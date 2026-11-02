// A student's device: join with the code, get an avatar, tap a colour.
// Built for young readers on shared, school-managed tablets: pictures,
// colours, shapes and numbers; the teacher in the room does the explaining.

import type { Auth, Avatar, PlayerView, ServerMessage } from "../shared/protocol.ts";
import { JOIN_CODE } from "../shared/protocol.ts";
import { $, esc, keepAwake, lines, statusDot, store } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg } from "./look.ts";
import { Line, api } from "./net.ts";

interface Saved {
  instance: string;
  token: string;
}

const main = $("main");
const dot = $("#dot");
const banner = $("#offline");
const code = (location.hash.slice(1) || new URLSearchParams(location.search).get("c") || "").replace(/\D/g, "");
const key = `cq.player.${code}`;

let line: Line | null = null;
let auth: Auth = { role: "player", join: true };
let view: PlayerView | null = null;
let joining = false;
let offlineTimer: number | undefined;
let instanceId = "";
let lastKey = "";
let chooseKey = "";
let chooseTimer: number | undefined;
/** The last tap, until the server confirms it. It counts when it arrives, even after the reveal. */
let waiting: { q: number; choice: number } | null = null;

async function start(): Promise<void> {
  if (!JOIN_CODE.test(code)) {
    location.replace("/");
    return;
  }
  keepAwake();
  const saved = store.get<Saved>(key);
  let instance: string;
  if (saved) {
    instance = saved.instance;
    auth = { role: "player", token: saved.token };
  } else {
    showWaiting();
    for (;;) {
      try {
        const r = await api<{ instance?: string }>("/api/join", { code });
        if (r.body.instance) {
          instance = r.body.instance;
          break;
        }
        if (r.status === 404) {
          showMessage(`<div class="big">${esc(code)}</div><div class="verdict wrong" style="width:22vmin;height:22vmin">${ICON.cross}</div>`, true);
          return;
        }
      } catch {
        /* offline: try again */
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  instanceId = instance;
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
    auth = { role: "player", token: m.token };
    store.set(key, { instance: instanceId, token: m.token } satisfies Saved);
    joining = false;
  } else if (m.t === "choose") {
    if (joining) return;
    if (m.avatars.length === 0 && !main.querySelector(".choose")) newPlayer();
    else showChoose(m.avatars);
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
    showMessage(`<div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>`, true);
  }
}

function newPlayer(): void {
  clearInterval(chooseTimer);
  chooseKey = "";
  joining = true;
  showWaiting();
  void line!.send({ op: "newPlayer" }).then((a) => {
    if (!a.ok) joining = false;
  });
}

// ---------------------------------------------------------------------------

function showWaiting(): void {
  main.innerHTML = `<div class="center"><div class="dot" data-status="connecting" style="width:28px;height:28px"></div></div>`;
}

function showMessage(html: string, home: boolean): void {
  main.innerHTML = `<div class="center">${html}${home ? `<a class="btn big" href="/" style="max-width:320px" aria-label="back">&#8592;</a>` : ""}</div>`;
}

function showChoose(avatars: { id: string; avatar: Avatar }[]): void {
  // Unchanged choice: leave the buttons alone, a tap may be under way.
  const k = JSON.stringify(avatars);
  if (k === chooseKey && main.querySelector(".choose")) return;
  chooseKey = k;
  // A classmate whose tablet died shows up here once it counts as away
  // (up to a minute); ask again now and then.
  clearInterval(chooseTimer);
  chooseTimer = window.setInterval(() => {
    if (!joining && line) void line.send({ op: "choose" });
  }, 10_000);
  main.innerHTML = `<div class="center">
    <div class="choose">
      ${avatars.map((a) => `<button data-id="${esc(a.id)}">${avatarSvg(a.avatar)}</button>`).join("")}
      <button class="new" aria-label="new">${ICON.plus}</button>
    </div>
  </div>`;
  main.querySelectorAll<HTMLButtonElement>(".choose button").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      if (!id) {
        newPlayer();
        return;
      }
      clearInterval(chooseTimer);
      chooseKey = "";
      joining = true;
      showWaiting();
      void line!.send({ op: "claim", player: id }).then((a) => {
        if (!a.ok) {
          // Someone else took that avatar in the meantime: ask again.
          joining = false;
          auth = { role: "player", join: true };
          line!.stop();
          void start();
        }
      });
    }),
  );
}

function render(): void {
  const v = view;
  if (!v) return;
  if (v.removed) {
    store.remove(key);
    main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div>
      <button class="btn big" style="max-width:320px" id="again">${ICON.plus}</button></div>`;
    $("#again").addEventListener("click", () => {
      auth = { role: "player", join: true };
      line?.stop();
      void start();
    });
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
        // Shown at once; the line delivers it, resending until the server confirms.
        q.mine = choice;
        lastKey = JSON.stringify({ ...view!, v: 0 });
        render();
        const tap = { q: q.q, choice };
        waiting = tap;
        void line!.send({ op: "answer", q: q.q, choice, seq: Date.now(), v: v.v }).then((a) => {
          if (waiting !== tap) return;
          waiting = null;
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
