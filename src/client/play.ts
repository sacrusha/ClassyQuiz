// A tab that came with the quiz's code. Two entrances (docs/user-flow.md §1):
//
//   /play#63953      a student's device: straight to an avatar, then colours.
//                    No teacher choices here, so a child can't take the remote
//                    by accident. Built for young readers on shared tablets:
//                    pictures, colours, shapes and numbers.
//   /teacher#63953   the teacher's other screen or phone: Projector or Remote.
//   /teacher?role=screen#63953
//                    takes the Projector at once (the lobby's "Open the
//                    projector window").

import type { Auth, ChoiceState, PlayerView, ServerMessage } from "../shared/protocol.ts";
import { JOIN_CODE } from "../shared/protocol.ts";
import { CLASS_FULL, CLASS_STARTED } from "../shared/limits.ts";
import { $, esc, keepAwake, lines, rolePage, siteAddress, statusDot, store, tabRole } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg } from "./look.ts";
import { Line, api } from "./net.ts";

interface Saved {
  instance: string;
  token: string;
  /** The class the token belongs to. */
  run?: string;
}

type Choice = Extract<ServerMessage, { t: "choose" }>;

const main = $("main");
const dot = $("#dot");
const banner = $("#offline");
const teacher = location.pathname.startsWith("/teacher");
const params = new URLSearchParams(location.search);
const code = (location.hash.slice(1) || params.get("c") || "").replace(/\D/g, "");
const wantScreen = teacher && params.get("role") === "screen";
const key = `cq.player.${code}`;

let line: Line | null = null;
let auth: Auth = { role: "guest" };
let view: PlayerView | null = null;
let instanceId = "";
let lastKey = "";
let choice: Choice | null = null;
let busy = false;
let tickTimer: number | undefined;
let offlineTimer: number | undefined;
/** The last tap, until the server confirms it. It counts when it arrives, even after the reveal. */
let waiting: { q: number; choice: number } | null = null;
/** The class turned this device away (full, or started), in the phase it was then; asked again when that changes. */
let refused: { reason: string; phase: string } | null = null;

async function start(): Promise<void> {
  if (!JOIN_CODE.test(code)) {
    if (teacher) showCodeForm(false);
    else location.replace("/");
    return;
  }
  keepAwake();
  showWaiting();
  let instance = "";
  for (;;) {
    try {
      const r = await api<{ instance?: string }>("/api/join", { code });
      if (r.body.instance) {
        instance = r.body.instance;
        break;
      }
      if (r.status === 404) {
        store.remove(key);
        if (teacher) showCodeForm(true);
        else showNoQuiz();
        return;
      }
      if (r.body.quota) {
        // The site's daily allowance is spent: say so, and ask again rarely.
        main.innerHTML = `<div class="center"><p class="muted" style="max-width:36rem">${esc(r.body.error ?? "")}</p></div>`;
        await new Promise((res) => setTimeout(res, 60_000));
        continue;
      }
    } catch {
      /* offline: try again */
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  instanceId = instance;
  if (teacher) {
    if (wantScreen) {
      // A window opened from the lobby: it may carry a copy of its opener's
      // role, which stays with the opener.
      tabRole.remove(instance);
    } else {
      const held = tabRole.get(instance);
      if (held) {
        // This tab holds a role in this quiz: back to it.
        location.replace(rolePage(instance, held.role));
        return;
      }
    }
    auth = { role: "guest" };
  } else {
    const saved = store.get<Saved>(key);
    auth = saved && saved.instance === instance ? { role: "player", token: saved.token, run: saved.run } : { role: "guest" };
    if (saved && saved.instance !== instance) store.remove(key);
  }
  line = new Line({
    instance,
    auth: () => auth,
    onMessage,
    onStatus: (s) => {
      statusDot(dot, s);
      clearTimeout(offlineTimer);
      if (s === "live") banner.hidden = true;
      else offlineTimer = window.setTimeout(() => (banner.hidden = false), 2500);
    },
  });
  line.start();
}

function onMessage(m: ServerMessage): void {
  if (m.t === "welcome") {
    auth = { role: "player", token: m.token, run: m.run };
    store.set(key, { instance: instanceId, token: m.token, run: m.run } satisfies Saved);
    busy = false;
    clearInterval(tickTimer);
  } else if (m.t === "choose") {
    choice = m;
    if (view || busy) return;
    if (teacher) {
      if (wantScreen && (m.screen === "free" || m.screen === "movable")) void takeRole("screen");
      else showRoles();
    } else if (m.phase === "final") {
      showFinished();
    } else if (refused && refused.phase === m.phase && m.avatars.length === 0) {
      showRefused(refused.reason);
    } else if (m.avatars.length > 0) {
      // A student whose tablet died picks their avatar back.
      showAvatars();
    } else {
      newPlayer();
    }
    // Which roles are free, and which avatars are away, change with time.
    clearInterval(tickTimer);
    tickTimer = window.setInterval(() => {
      if (!busy && line && !view) void line.send({ op: "tick" });
    }, 10_000);
  } else if (m.t === "role") {
    clearInterval(tickTimer);
    line?.stop();
    tabRole.set(instanceId, { role: m.role, token: m.token, code });
    location.replace(rolePage(instanceId, m.role) + (wantScreen ? "&drag=1" : ""));
  } else if (m.t === "state" && m.view.role === "player") {
    // Every answer in the class bumps the version; only redraw when this
    // device's own view changed, or a tap could land on a button being
    // replaced and get lost.
    const k = JSON.stringify({ ...m.view, v: 0 });
    view = m.view;
    if (k === lastKey) return;
    lastKey = k;
    render();
  } else if (m.t === "gone") {
    store.remove(key);
    line?.stop();
    clearInterval(tickTimer);
    main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>
      <p class="muted">${esc(m.reason)}</p><a class="btn big" href="/" style="max-width:320px" aria-label="back">&#8592;</a></div>`;
  }
}

// ---------------------------------------------------------------------------
// Before a player or a role

function showWaiting(): void {
  main.innerHTML = `<div class="center"><div class="dot" data-status="connecting" style="width:28px;height:28px"></div></div>`;
}

function codeForm(): string {
  return `<form class="codeform" id="codeform"><input class="code-input" id="c" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="12345" aria-label="Quiz code"><button class="btn primary" aria-label="go">&#9654;</button></form>`;
}

function wireCodeForm(): void {
  const input = $("#c") as HTMLInputElement;
  input.focus();
  $("#codeform").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = input.value.replace(/\D/g, "");
    if (!JOIN_CODE.test(c)) return;
    location.hash = c;
    location.reload();
  });
}

function showNoQuiz(): void {
  main.innerHTML = `<div class="center">
    <p class="big">${esc(code)}</p><div class="verdict wrong" style="width:22vmin;height:22vmin">${ICON.cross}</div>
    ${codeForm()}
  </div>`;
  wireCodeForm();
}

/** The teacher's entrance without a code, or with one that opens nothing. */
function showCodeForm(wrong: boolean): void {
  document.title = "classyQuiz · teacher";
  main.innerHTML = `<div class="center teacher-entry">
    <h1>Show or steer a quiz from here</h1>
    <p class="muted">${wrong ? `No quiz with the code ${esc(code)}.` : "The quiz's code:"}</p>
    ${codeForm()}
    <p class="muted">Students go to <a href="/">${esc(siteAddress())}</a>.</p>
  </div>`;
  wireCodeForm();
}

function showFinished(): void {
  main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>
    <a class="btn big" href="/" style="max-width:320px" aria-label="back">&#8592;</a></div>`;
}

function showAvatars(): void {
  const c = choice!;
  main.innerHTML = `<div class="center">
    <div class="choose">
      ${c.avatars.map((a) => `<button data-id="${esc(a.id)}">${avatarSvg(a.avatar)}</button>`).join("")}
      <button class="new" aria-label="new">${ICON.plus}</button>
    </div>
  </div>`;
  main.querySelectorAll<HTMLButtonElement>(".choose button").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      if (id) claim(id);
      else newPlayer();
    }),
  );
}

function roleButton(role: "screen" | "remote", state: ChoiceState): string {
  const free = state === "free" || state === "movable";
  const label = role === "screen" ? "Projector" : "Remote";
  const what = role === "screen" ? "shows the quiz to the class" : "steers the quiz";
  const note =
    state === "quiet"
      ? "in use – free in under a minute"
      : state === "closed"
        ? role === "remote"
          ? "not once students are in: the projector steers"
          : "not once students are in"
        : free
          ? what
          : "in use";
  return `<button class="btn role" data-role="${role}"${free ? "" : " disabled"}>${label}<small>${note}</small></button>`;
}

/** The teacher's entrance: what this tab is for. */
function showRoles(): void {
  const c = choice!;
  document.title = `${c.title || "Quiz"} · teacher`;
  main.innerHTML = `<div class="center choice">
    <h1 class="qtitle">${lines(c.title || "Quiz")}</h1>
    <p class="muted">This screen is the…</p>
    <div class="row roles">${roleButton("screen", c.screen)}${roleButton("remote", c.remote)}</div>
  </div>`;
  main.querySelectorAll<HTMLButtonElement>("button[data-role]").forEach((b) =>
    b.addEventListener("click", () => void takeRole(b.dataset.role as "screen" | "remote")),
  );
}

async function takeRole(role: "screen" | "remote"): Promise<void> {
  if (!line) return;
  busy = true;
  showWaiting();
  const a = await line.send({ op: "takeRole", role });
  if (!a.ok) {
    // Taken in the meantime: the new choice has come with the answer.
    busy = false;
    showRoles();
  }
}

function newPlayer(): void {
  if (!line) return;
  busy = true;
  showWaiting();
  void line.send({ op: "newPlayer" }).then((a) => {
    if (!a.ok) {
      busy = false;
      if (choice?.phase === "final") showFinished();
      else if (a.error === CLASS_FULL || a.error === CLASS_STARTED) {
        refused = { reason: a.error, phase: choice?.phase ?? "" };
        showRefused(a.error);
      }
    } else refused = null;
  });
}

/** Turned away by the class (MAX_PLAYERS, MAX_LATE_JOINERS): the teacher is in the room. */
function showRefused(reason: string): void {
  main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div>
    <p class="muted">${esc(reason)}</p></div>`;
}

function claim(id: string): void {
  if (!line) return;
  busy = true;
  showWaiting();
  void line.send({ op: "claim", player: id }).then((a) => {
    if (!a.ok) {
      // Someone else took that avatar in the meantime: ask again.
      busy = false;
      void line!.send({ op: "tick" });
    }
  });
}

// ---------------------------------------------------------------------------
// The student's device

function render(): void {
  const v = view;
  if (!v) return;
  if (v.removed) {
    // The teacher removed this avatar: the device keeps its token, so it
    // comes back as removed rather than as a new player in the same class
    // (decisions.md, "Hardening": Remove means something).
    main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div></div>`;
    return;
  }
  const me = v.me;
  const top = me
    ? `<div class="top"><div class="me">${avatarSvg(me.avatar)}</div><span class="grow"></span>
       ${v.question ? `<span>${v.question.n} / ${v.question.total}</span><span class="grow"></span>` : ""}
       <span>${ICON.star} ${me.score}</span></div>`
    : "";

  if (v.phase === "lobby" || v.phase === "idle" || !me) {
    main.innerHTML = `<div class="center">${me ? `<div class="hero">${avatarSvg(me.avatar)}</div>` : ""}<div class="big">${ICON.eye}</div></div>`;
    return;
  }
  if (v.phase === "question" && v.question) {
    const q = v.question;
    const n = q.answers.length;
    main.innerHTML = `${top}<div class="buttons n${n}${q.mine !== null ? " chosen" : ""}">
      ${q.answers
        .map((a, i) => `<button class="ansbtn a${i}${q.mine === i ? " mine" : ""}" data-i="${i}">${shapeSvg(i)}<span>${lines(a)}</span></button>`)
        .join("")}
    </div>`;
    main.querySelectorAll<HTMLButtonElement>(".ansbtn").forEach((b) =>
      b.addEventListener("click", () => {
        const choice = Number(b.dataset.i);
        // The same button again changes nothing; it isn't sent (children
        // hammer buttons, and each stored tap is spent from the site's day).
        if (q.mine === choice) return;
        const before = q.mine;
        // Shown at once; the line delivers it, resending until the server confirms.
        q.mine = choice;
        lastKey = JSON.stringify({ ...view!, v: 0 });
        render();
        const tap = { q: q.q, choice };
        waiting = tap;
        void line!.send({ op: "answer", q: q.q, choice, seq: Date.now(), v: v.v }).then((a) => {
          if (waiting !== tap) return;
          waiting = null;
          // Not taken (e.g. too many changes of mind): the device shows what counts.
          const shown = view?.question;
          if (!a.ok && shown && shown.q === tap.q && shown.mine === choice) {
            shown.mine = before;
            lastKey = JSON.stringify({ ...view!, v: 0 });
          }
          // During the question the buttons stay as they are: a redraw could swallow a tap.
          if (!a.ok || view?.phase === "reveal") render();
        });
      }),
    );
    return;
  }
  if (v.phase === "reveal" && v.reveal && waiting && waiting.q === v.question?.q) {
    // Tapped before the reveal but not yet delivered: it will count.
    main.innerHTML = `${top}<div class="center"><div class="verdict none"><span class="dot" data-status="offline" style="width:30%;height:30%"></span></div>
      <div class="row verdict-shape" style="justify-content:center"><span class="a${waiting.choice}" style="color:var(--ans)">${shapeSvg(waiting.choice)}</span></div></div>`;
    return;
  }
  if (v.phase === "reveal" && v.reveal) {
    const r = v.reveal;
    const cls = r.void ? "void" : r.mine === null ? "none" : r.counts[r.mine] ? "right" : "wrong";
    const icon = r.void ? ICON.void : r.mine === null ? "–" : r.counts[r.mine] ? ICON.check : ICON.cross;
    const mine = r.mine !== null ? `<div class="row verdict-shape" style="justify-content:center"><span class="a${r.mine}" style="color:var(--ans)">${shapeSvg(r.mine)}</span></div>` : "";
    main.innerHTML = `${top}<div class="center"><div class="verdict ${cls}">${icon}</div>${mine}</div>`;
    return;
  }
  if (v.phase === "ranking" || v.phase === "final") {
    main.innerHTML = `${top}<div class="center">
      <div class="hero">${avatarSvg(me.avatar)}</div>
      <div class="big">${me.place}. <span class="muted" style="font-size:.6em">/ ${me.of}</span></div>
      <div class="big">${ICON.star} ${me.score}</div>
      ${v.phase === "final" ? `<div class="big">${ICON.trophy}</div>` : ""}
    </div>`;
  }
}

void start();
