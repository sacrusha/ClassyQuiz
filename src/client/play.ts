// A tab that came with a code from the code box, which routes by length
// (docs/design/teacher-devices.md):
//
//   /play#63953      the class code: a student's device, straight to an
//                    avatar, then colours. It never reaches a teacher role.
//   /play#6395347    the teacher code, the class code and two digits: a
//                    teacher device. When one tab shows and steers, it asks
//                    "Show the quiz here, or steer it from here?"; otherwise
//                    it takes the role that is free.
//   /play?win=1#…    the same from "open a second screen in a new window": a window opened by
//                    a teacher tab, whose copy of that tab's role isn't its own.
//   /teacher#63953   asks for the teacher code, except on the device that
//                    uploaded the quiz, which comes in with the quiz's secret.

import type { Auth, Avatar, Entry, PackPic, PlayerView, ServerMessage } from "../shared/protocol.ts";
import { JOIN_CODE, TEACHER_CODE, TOO_MANY_CODES, WRONG_TEACHER_CODE, viewKey } from "../shared/protocol.ts";
import { CLASS_FULL, CLASS_STARTED, CLASS_WAITING, ROOM_FULL, ROOM_STARTED } from "../shared/limits.ts";
import { $, esc, findQuiz, forgetQuiz, keepAwake, lines, playerKey, rolePage, savedQuizzes, siteHead, statusDot, store, tabRole } from "./dom.ts";
import { ICON, avatarSvg, lookKey, pickerRows, shapeSvg, wiggle } from "./look.ts";
import { pickLook, sameLook, type Look, type LookPart } from "../shared/looks.ts";
import { Line, api } from "./net.ts";
import { clockBar, localEnd } from "./clock.ts";
import { chooseGrid, type Chrome, type Orient } from "./answergrid.ts";
import { packPicture, picturesHere, wantPacks } from "./packs.ts";
import { PeersRoom } from "./peers.ts";
import { Latest } from "./latest.ts";
import { LINE_WORDS, T, lang, quotaNotice, said } from "./room-text.ts";

type Ack = Extract<ServerMessage, { t: "ack" }>;

interface Saved {
  instance: string;
  token: string;
}

type Choice = Extract<ServerMessage, { t: "choose" }>;

const main = $("main");
document.documentElement.lang = lang;
const dot = $("#dot");
const banner = $("#offline");
const params = new URLSearchParams(location.search);
const typed = (location.hash.slice(1) || params.get("c") || "").replace(/\D/g, "");
/** The old address, /teacher: it asks for the teacher code. */
const oldAddress = location.pathname.startsWith("/teacher");
const code = TEACHER_CODE.test(typed) ? typed.slice(0, 5) : typed;
/** The teacher code's two digits, when they were typed. */
const digits = TEACHER_CODE.test(typed) ? typed.slice(5) : "";
/** The uploading device needs no digits: it has the quiz's secret (Resume, or an old /teacher link). */
const savedHere = JOIN_CODE.test(code) ? (savedQuizzes().find((q) => q.code === code) ?? null) : null;
const teacher = !!digits || (oldAddress && !!savedHere);
/** Opened by "open a second screen in a new window" or "open the projector window" from a teacher tab. */
const fromWindow = params.get("win") === "1";
const key = playerKey(code);

let line: Line | null = null;
let auth: Auth = { role: "guest" };
let view: PlayerView | null = null;
let instanceId = "";
let lastKey = "";
let choice: Choice | null = null;
let busy = false;
let tickTimer: number | undefined;
let offlineTimer: number | undefined;
let unreachedTimer: number | undefined;

// A device that reaches the page but not the quiz (docs/design/root-page.md, "Network help, where failure shows"): after a
// while, plain words for the student, who tells the teacher; the teacher's
// side is the wall's "Nobody in yet?" line. A teacher device is told only
// what is wrong. Gone once the line is back.

const UNREACHED_MS = 15_000;
const unreachedText = (): string => (teacher ? T.unreached : T.unreachedTell);
const bannerWords = document.createElement("span");
bannerWords.hidden = true;
bannerWords.textContent = unreachedText();
banner.append(bannerWords);
/**
 * The last tap, until the server's view shows it stored (or the server
 * refused it). Until then the button shows it on its way, never as
 * accepted: what the tablet shows as accepted is the server's record, the
 * one that scores (docs/design/question-flow.md, "When a tap counts"). It counts if it
 * arrives while the question is still on screen.
 */
let waiting: { q: number; choice: number } | null = null;
/**
 * This page played as an avatar another device has since taken back: it
 * offers the choice ("+") rather than joining by itself, from now on. It may
 * be lying on a desk with nobody at it.
 */
let displaced = false;
/** The class turned this device away (full, or started), in the phase it was then; asked again when that changes. */
let refused: { reason: string; phase: string } | null = null;
/**
 * When the open question's answers appeared on this device (performance.now()),
 * per question: a tap's time for the points for speed is counted from here,
 * on this device, so a slow line costs no speed.
 */
let shown: { q: number; at: number } | null = null;
/** Closes the buttons when Last call runs out on this device. */
let outTimer: number | undefined;
/**
 * Dressing the animal in the lobby (docs/design/class-and-wall.md):
 * the look the child picked, shown at once, until the server's view shows
 * it back; the latest pick wins. One `dress` is in flight at a time, so a
 * burst of taps sends the first and then the last.
 */
let look: Required<Look> | null = null;
/** The server took no more changes of look (MAX_LOOK_CHANGES): the pictures stay, without effect. */
let dressSpent = false;
/** A Peers room draws its own screens (client/peers.ts); made with its first view. */
let peers: PeersRoom | null = null;

async function start(): Promise<void> {
  if (oldAddress && !teacher) {
    showTeacherForm(JOIN_CODE.test(code) ? T.needsDigits : "");
    return;
  }
  if (!JOIN_CODE.test(code)) {
    location.replace("/");
    return;
  }
  if (teacher) document.body.classList.add("follows-dark");
  keepAwake();
  showWaiting();
  let instance = "";
  const joinFrom = Date.now();
  for (;;) {
    try {
      const r = await api<{ instance?: string; message?: string }>("/api/join", teacher ? { code: typed, secret: savedHere?.secret } : { code });
      if (r.body.instance) {
        instance = r.body.instance;
        break;
      }
      if (r.status === 404 || (r.status === 429 && r.body.error === "locked")) {
        store.remove(key);
        if (!teacher) showNoQuiz();
        else if (r.body.error === "locked") showTeacherForm(TOO_MANY_CODES);
        else if (r.body.error === "teacher") showTeacherForm(WRONG_TEACHER_CODE);
        else showTeacherForm(T.noQuizCode(code));
        return;
      }
      if (r.body.quota) {
        // The site's daily allowance is spent: say so, and ask again rarely.
        main.innerHTML = `<div class="center"><p class="muted" style="max-width:36rem">${esc(quotaNotice())}</p></div>`;
        await new Promise((res) => setTimeout(res, 60_000));
        continue;
      }
    } catch {
      const words = document.getElementById("unreached");
      if (words && Date.now() - joinFrom >= UNREACHED_MS) {
        words.textContent = unreachedText();
        words.hidden = false;
      }
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  instanceId = instance;
  if (teacher) {
    if (fromWindow) {
      // A window opened from a teacher tab: it may carry a copy of its
      // opener's role, which stays with the opener.
      tabRole.remove(instance);
    } else {
      const held = tabRole.get(instance);
      if (held) {
        location.replace(rolePage(instance, held.role));
        return;
      }
    }
    auth = { role: "guest" };
  } else {
    const saved = store.get<Saved>(key);
    auth = saved && saved.instance === instance ? { role: "player", token: saved.token } : { role: "guest" };
    if (saved && saved.instance !== instance) store.remove(key);
  }
  line = new Line({
    instance,
    words: LINE_WORDS,
    auth: () => auth,
    onMessage,
    onStatus: (s) => {
      statusDot(dot, s, T.status);
      clearTimeout(offlineTimer);
      clearTimeout(unreachedTimer);
      if (s === "live") {
        banner.hidden = true;
        bannerWords.hidden = true;
      } else {
        offlineTimer = window.setTimeout(() => (banner.hidden = false), 2500);
        unreachedTimer = window.setTimeout(() => (bannerWords.hidden = false), UNREACHED_MS);
      }
    },
  });
  line.start();
}

function onMessage(m: ServerMessage): void {
  if (m.t === "welcome") {
    auth = { role: "player", token: m.token };
    store.set(key, { instance: instanceId, token: m.token } satisfies Saved);
    // Over HTTP, a poll held for the guest would hold back this player's views.
    line?.repoll();
    busy = false;
    displaced = false;
    clearInterval(tickTimer);
  } else if (m.t === "choose") {
    if (auth.role === "player") {
      // A choice for a guest reaching a player: the answer to a poll made
      // before the welcome. Joining again would make a second avatar.
      if (!m.stale) return;
      // The token isn't this class's player any more: another device took
      // the avatar back while this one was away. Choose again rather than
      // stay on a view that no longer moves.
      if (view !== null) displaced = true;
      auth = { role: "guest" };
      store.remove(key);
      view = null;
      lastKey = "";
      waiting = null;
    }
    choice = m;
    if (view || busy) return;
    if (teacher) {
      // Acted on once, as the device arrives; later choices (another tab
      // came or went) wait for the teacher's tap, so a device left lying
      // here never takes a role by itself.
      if (!entered) {
        entered = true;
        enter(m);
      }
      return;
    } else if (m.phase === "final") {
      showFinished();
    } else if (refused && refused.phase === m.phase && m.avatars.length === 0) {
      showRefused(refused.reason);
    } else if (m.waiting) {
      // Before the teacher lets the class in: wait here; the next choice without it joins.
      showRefused(CLASS_WAITING, false);
    } else if (m.avatars.length > 0 || displaced) {
      // A student whose tablet died picks their avatar back. A tablet whose
      // avatar went to another device offers "+" rather than joining by
      // itself: it may be lying on a desk, nobody at it.
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
    tabRole.set(instanceId, { role: m.role, token: m.token, code, teacher: digits || findQuiz(instanceId)?.teacher });
    // A window opened to be dragged to the projector says so until it is full screen.
    location.replace(rolePage(instanceId, m.role) + (fromWindow && m.role === "screen" ? "&drag=1" : ""));
  } else if (m.t === "state" && m.view.role === "player" && m.view.peers) {
    view = m.view;
    peers ??= new PeersRoom({ main, send: (cmd) => line!.send(cmd), dress: (into) => view?.me && renderDress(view.me.avatar, into) });
    peers.show(m.view);
  } else if (m.t === "state" && m.view.role === "player") {
    // Every answer in the class bumps the version; only redraw when this
    // device's own view changed, or a tap could land on a button being
    // replaced and get lost.
    const k = viewKey(m.view);
    const before = view;
    view = m.view;
    const q = view.question;
    // The server's word on the last tap: stored, so no longer on its way.
    const stored = view.reveal ? view.reveal.mine : q?.mine;
    if (waiting && q && waiting.q === q.q && stored === waiting.choice) waiting = null;
    wantPacks(view.packs, packsArrived);
    // A picture answer's time for speed runs from when its pictures are here.
    if (q && q.answering !== "reading" && q.sinceMs !== null && shown?.q !== q.q && picturesHere(q.pics)) shown = { q: q.q, at: performance.now() - q.sinceMs };
    if (k === lastKey) return;
    lastKey = k;
    // Only the stored answer changed while the buttons are up: they are marked
    // in place, since a redraw could swallow a tap landing just then.
    if (before && onlyMineChanged(before, view) && main.querySelector(".buttons")) {
      markChosen();
      return;
    }
    render();
  } else if (m.t === "gone") {
    store.remove(key);
    // Gone: the start page's resume card needn't ask after it (a Peers room's opener uploaded it).
    forgetQuiz(instanceId);
    line?.stop();
    clearInterval(tickTimer);
    if (m.home) {
      location.replace("/");
      return;
    }
    main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>
      <p class="muted">${esc(said(m.reason))}</p><a class="btn big" href="/" style="max-width:320px" aria-label="${T.back}">&#8592;</a></div>`;
  }
}

function showWaiting(): void {
  main.innerHTML = `<div class="center"><div class="dot" data-status="connecting" style="width:28px;height:28px"></div><p class="muted" id="unreached" hidden></p></div>`;
}

/** The code box again, as on the root page: five digits for a student, seven for a teacher; it routes by length. */
function codeForm(value = "", placeholder = "12345"): string {
  return `<form class="codeform" id="codeform"><input class="code-input" id="c" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="${placeholder}" aria-label="${T.quizCode}" value="${esc(value)}"><button class="btn primary" aria-label="${T.go}">&#9654;</button></form>`;
}

function wireCodeForm(): void {
  const input = $("#c") as HTMLInputElement;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  input.addEventListener("input", () => {
    const c = input.value.replace(/\D/g, "");
    if (c !== input.value) input.value = c;
  });
  $("#codeform").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = input.value.replace(/\D/g, "");
    if (!JOIN_CODE.test(c) && !TEACHER_CODE.test(c)) {
      input.select();
      return;
    }
    if (location.pathname.startsWith("/play")) {
      location.hash = c;
      location.reload();
    } else location.href = `/play#${c}`;
  });
}

function showNoQuiz(): void {
  main.innerHTML = `<div class="center">
    <p class="big">${esc(code)}</p><div class="verdict wrong" style="width:22vmin;height:22vmin">${ICON.cross}</div>
    ${codeForm()}
  </div>`;
  wireCodeForm();
}

/**
 * A teacher device without a working teacher code: the old /teacher
 * address, a wrong code, or too many wrong ones. The box takes the class
 * code too, for a student who ends up here.
 */
function showTeacherForm(note: string): void {
  document.body.classList.add("follows-dark");
  document.title = `classyQuiz · ${T.showOrSteer}`;
  main.innerHTML = `${siteHead()}<div class="center teacher-entry">
    <h1>${T.showOrSteerH}</h1>
    ${note ? `<p class="muted">${esc(said(note))}</p>` : ""}
    <p class="muted">${T.codeAndDigits}</p>
    ${codeForm(JOIN_CODE.test(code) ? code : "", "12345 67")}
    <p class="muted">${T.digitsShown}</p>
  </div>`;
  wireCodeForm();
}

function showFinished(): void {
  main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>
    <a class="btn big" href="/" style="max-width:320px" aria-label="${T.back}">&#8592;</a></div>`;
}

function showAvatars(): void {
  const c = choice!;
  main.innerHTML = `<div class="center">
    <div class="choose">
      ${c.avatars.map((a) => `<button data-id="${esc(a.id)}">${avatarSvg(a.avatar)}</button>`).join("")}
      <button class="new" aria-label="${T.newAvatar}">${ICON.plus}</button>
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

/** This device uploaded the quiz: it comes in with the quiz's secret, needing no digits. */
function ownSecret(): string | undefined {
  return findQuiz(instanceId)?.secret ?? savedHere?.secret;
}

/** A teacher device has acted on what the quiz said when it came in. */
let entered = false;

/**
 * What a teacher device does on arriving (docs/design/teacher-devices.md, "A second device: one question, only when needed"): the
 * question when one tab shows and steers; the role whose tab is gone,
 * without asking; or the note that both are there, which pushes nobody
 * aside. Nothing the device senses decides it.
 */
function enter(c: Choice): void {
  document.title = `${c.title || "Quiz"} · ${T.showOrSteer}`;
  const entry: Entry = c.entry;
  if (entry === "screen" || entry === "remote") {
    void takeRole(entry);
    return;
  }
  if (entry === "full") {
    main.innerHTML = `${siteHead()}<div class="center choice">
      <h1 class="qtitle">${lines(c.title || "Quiz")}</h1>
      <p class="muted">${T.entryFull}</p>
      <p class="muted">${T.entryFullAgain}</p>
      <button class="btn" data-retry>${T.tryAgain}</button>
    </div>`;
    main.querySelector("[data-retry]")!.addEventListener("click", () => {
      entered = false;
      showWaiting();
      void line?.send({ op: "tick" });
    });
    return;
  }
  main.innerHTML = `${siteHead()}<div class="center choice">
    <h1 class="qtitle">${lines(c.title || "Quiz")}</h1>
    <div class="entry-roles">
      <button class="btn role" data-role="screen">${T.showHere}<small>${T.showHereSmall}</small></button>
      <button class="btn role" data-role="remote">${T.steerHere}<small>${T.steerHereSmall}</small></button>
    </div>
  </div>`;
  main.querySelectorAll<HTMLButtonElement>("button[data-role]").forEach((b) =>
    b.addEventListener("click", () => void takeRole(b.dataset.role as "screen" | "remote")),
  );
}

async function takeRole(role: "screen" | "remote"): Promise<void> {
  if (!line) return;
  busy = true;
  showWaiting();
  const a = await line.send({ op: "takeRole", role, teacher: digits || undefined, secret: ownSecret() });
  if (a.ok) return; // the role follows
  busy = false;
  if (a.error === WRONG_TEACHER_CODE || a.error === TOO_MANY_CODES) {
    line.stop();
    clearInterval(tickTimer);
    showTeacherForm(a.error);
    return;
  }
  // The tabs changed in the meantime: the new choice has come with the answer.
  if (choice) enter(choice);
}

function newPlayer(): void {
  if (!line) return;
  busy = true;
  showWaiting();
  void line.send({ op: "newPlayer" }).then((a) => {
    if (!a.ok) {
      busy = false;
      if (choice?.phase === "final") showFinished();
      else if (a.error === CLASS_WAITING) showRefused(CLASS_WAITING, false);
      else if (a.error === CLASS_FULL || a.error === CLASS_STARTED || a.error === ROOM_FULL || a.error === ROOM_STARTED) {
        refused = { reason: a.error, phase: choice?.phase ?? "" };
        showRefused(a.error);
      }
    } else refused = null;
  });
}

/** Turned away by the class (MAX_PLAYERS, MAX_LATE_JOINERS): the teacher is in the room. */
function showRefused(reason: string, final = true): void {
  // final: turned away; otherwise waiting to be let in, with the line's dot.
  const mark = final
    ? `<div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div>`
    : `<div class="dot" data-status="connecting" style="width:28px;height:28px"></div>`;
  main.innerHTML = `<div class="center">${mark}
    <p class="muted">${esc(said(reason))}</p></div>`;
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

/**
 * A pack of answer pictures arrived: the pictures on screen get their
 * source in place (no redraw, which could swallow a tap), and the time for
 * speed starts now if the question was waiting for them.
 */
function packsArrived(): void {
  main.querySelectorAll<HTMLImageElement>("img[data-pack]").forEach((img) => {
    if (img.getAttribute("src")) return;
    const [p, o, l, type] = img.dataset.pack!.split(",");
    const url = packPicture({ p: Number(p), o: Number(o), l: Number(l), type, w: 0, h: 0 });
    if (url) img.src = url;
  });
  const q = view?.question;
  if (q && q.answering !== "reading" && q.sinceMs !== null && shown?.q !== q.q && picturesHere(q.pics)) shown = { q: q.q, at: performance.now() };
}

/** An answer picture's <img>, with its source once its pack is here. */
function packImg(p: PackPic): string {
  const url = packPicture(p);
  return `<img data-pack="${p.p},${p.o},${p.l},${esc(p.type)}"${url ? ` src="${url}"` : ""} alt="">`;
}

/**
 * Picture answers' buttons arranged by the pictures' shape (client/answergrid.ts),
 * in the room the buttons have; the room is fixed in px so a picture
 * arriving doesn't push the buttons around.
 */
function arrangePictureButtons(box: HTMLElement, pics: (PackPic | null)[]): void {
  const W = box.clientWidth;
  const H = box.clientHeight;
  box.style.height = `${H}px`;
  const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
  const first = box.querySelector<HTMLElement>(".ansbtn")!;
  const cls = first.className;
  const chromeOf = (orient: Orient): Chrome => {
    first.classList.remove("row", "col");
    first.classList.add(orient);
    first.style.width = "300px";
    first.style.height = "300px";
    const c = first.querySelector<HTMLElement>(".apic")!;
    const r = { w: first.offsetWidth - c.offsetWidth, h: first.offsetHeight - c.offsetHeight };
    first.style.width = first.style.height = "";
    return r;
  };
  const chrome = { row: chromeOf("row"), col: chromeOf("col") };
  first.className = cls;
  const g = chooseGrid(pics.map((p) => (p ? p.w / p.h : null)), W, H, gap, chrome);
  box.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
  box.style.gridTemplateRows = `repeat(${g.rows}, minmax(0, 1fr))`;
  box.dataset.grid = `${g.cols}x${g.rows} ${g.orient}`;
  box.querySelectorAll<HTMLElement>(".ansbtn").forEach((b) => {
    b.classList.remove("row", "col");
    b.classList.add(g.orient);
  });
}

function chosenPicture(i: number): string {
  const p = view?.question?.pics?.[i];
  return p ? `<div class="row" style="justify-content:center"><div class="verdict-pic a${i}">${packImg(p)}</div></div>` : "";
}

/** The answer the buttons show as chosen: the stored one, or the last tap on its way (sending). */
function chosen(q: NonNullable<PlayerView["question"]>): { mine: number | null; sending: boolean } {
  if (waiting && waiting.q === q.q && waiting.choice !== q.mine) return { mine: waiting.choice, sending: true };
  return { mine: q.mine, sending: false };
}

/** The buttons' marks, in place: the stored answer, or the tap on its way. */
function markChosen(): void {
  const q = view?.question;
  const box = main.querySelector<HTMLElement>(".buttons");
  if (!q || !box) return;
  const { mine, sending } = chosen(q);
  box.classList.toggle("chosen", mine !== null);
  box.querySelectorAll<HTMLElement>(".ansbtn").forEach((b) => {
    const i = Number(b.dataset.i);
    b.classList.toggle("mine", i === mine);
    b.classList.toggle("sending", i === mine && sending);
  });
}

/** The two views differ only in the stored answer of the open question (the buttons can stay). */
function onlyMineChanged(a: PlayerView, b: PlayerView): boolean {
  if (a.phase !== "question" || b.phase !== "question" || !a.question || !b.question || a.question.q !== b.question.q) return false;
  const strip = (x: PlayerView) => viewKey({ ...x, question: { ...x.question!, mine: null } });
  return strip(a) === strip(b);
}

function render(): void {
  const v = view;
  if (!v) return;
  if (v.removed) {
    // The teacher removed this avatar: the device keeps its token, so it
    // comes back as removed rather than as a new player in the same class
    // (docs/design/class-and-wall.md, "The door": Remove is sticky).
    main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div></div>`;
    return;
  }
  const me = v.me;
  const top = me
    ? `<div class="top"><div class="me">${avatarSvg(me.avatar)}</div><span class="grow"></span>
       ${v.question ? `<span>${v.question.n} / ${v.question.total}</span><span class="grow"></span>` : ""}
       <span>${ICON.star} ${me.score}</span></div>`
    : "";

  if (v.phase === "lobby" && me) {
    renderDress(me.avatar);
    return;
  }
  look = null;
  if (v.phase === "lobby" || v.phase === "idle" || !me) {
    main.innerHTML = `<div class="center">${me ? `<div class="hero">${avatarSvg(me.avatar)}</div>` : ""}<div class="big">${ICON.eye}</div></div>`;
    return;
  }
  clearTimeout(outTimer);
  if (v.phase === "question" && v.question && v.question.answering === "reading") {
    // The class reads the question on the board; the answers come when the teacher shows them.
    main.innerHTML = `${top}<div class="center"><div class="big reading">${ICON.eye}</div></div>`;
    return;
  }
  if (v.phase === "question" && v.question) {
    const q = v.question;
    const n = q.answers.length;
    // Locked in, or Last call run out here: the buttons stay, the chosen one
    // marked, and take no more taps. A tap still on its way shows as on its way.
    const end = q.clock ? localEnd(`${v.current}|${q.clock.ms}`, q.clock) : null;
    const out = q.answering === "closed" || (end !== null && end <= performance.now());
    const { mine, sending } = chosen(q);
    const pics = q.pics;
    main.innerHTML = `${top}${q.clock && end !== null ? clockBar(q.clock.ms, end) : ""}<div class="buttons n${n}${pics ? " pics" : ""}${mine !== null ? " chosen" : ""}${out ? " closed" : ""}">
      ${q.answers
        .map((a, i) => {
          const sel = mine === i ? (sending ? " mine sending" : " mine") : "";
          if (!pics) return `<button class="ansbtn a${i}${sel}" data-i="${i}">${shapeSvg(i)}<span>${lines(a)}</span></button>`;
          const p = pics[i];
          return `<button class="ansbtn pic col a${i}${sel}" data-i="${i}">${shapeSvg(i)}<span class="apic${p ? "" : " text"}">${p ? packImg(p) : `<span>${lines(a)}</span>`}</span></button>`;
        })
        .join("")}
    </div>`;
    if (pics) arrangePictureButtons(main.querySelector<HTMLElement>(".buttons")!, pics);
    if (out) {
      // Locked in, the spread on the wall: look up. Otherwise Last call ran out here.
      main.querySelector(".top")?.insertAdjacentHTML("beforeend", q.votes ? `<span class="timeup look">${ICON.eye}</span>` : `<span class="timeup">${ICON.timer}</span>`);
      return;
    }
    if (end !== null) {
      // Run out here: closed without a redraw, so no tap is swallowed by one.
      outTimer = window.setTimeout(() => {
        main.querySelector(".buttons")?.classList.add("closed");
        main.querySelector(".clockbar")?.classList.add("out");
        main.querySelector(".top")?.insertAdjacentHTML("beforeend", `<span class="timeup">${ICON.timer}</span>`);
      }, Math.max(0, end - performance.now()));
    }
    main.querySelectorAll<HTMLButtonElement>(".ansbtn").forEach((b) =>
      b.addEventListener("click", () => {
        if (main.querySelector(".buttons.closed")) return;
        const choice = Number(b.dataset.i);
        // The same button again changes nothing; it isn't sent (children
        // hammer buttons, and each stored tap is spent from the site's day).
        if (chosen(q).mine === choice) return;
        const ms = shown && shown.q === q.q ? Math.round(performance.now() - shown.at) : undefined;
        // Shown at once as on its way; as accepted once the server's view
        // has it. The line delivers it, resending until the server answers.
        const tap = { q: q.q, choice };
        waiting = tap;
        markChosen();
        answers.put({ tap, seq: Date.now(), v: v.v, ms });
      }),
    );
    return;
  }
  if (v.phase === "reveal" && v.reveal && waiting && waiting.q === v.question?.q) {
    // Tapped before the reveal but not yet delivered: it will count.
    main.innerHTML = `${top}<div class="center"><div class="verdict none"><span class="dot" data-status="offline" style="width:30%;height:30%"></span></div>
      <div class="row verdict-shape" style="justify-content:center"><span class="a${waiting.choice}" style="color:var(--ans)">${shapeSvg(waiting.choice)}</span></div>${chosenPicture(waiting.choice)}</div>`;
    return;
  }
  if (v.phase === "reveal" && v.reveal) {
    const r = v.reveal;
    const cls = r.void ? "void" : r.mine === null ? "none" : r.counts[r.mine] ? "right" : "wrong";
    const icon = r.void ? ICON.void : r.mine === null ? "–" : r.counts[r.mine] ? ICON.check : ICON.cross;
    const mine = r.mine !== null ? `<div class="row verdict-shape" style="justify-content:center"><span class="a${r.mine}" style="color:var(--ans)">${shapeSvg(r.mine)}</span></div>${chosenPicture(r.mine)}` : "";
    const gained = r.points ? `<div class="big gained">+${r.points}</div>` : "";
    main.innerHTML = `${top}<div class="center"><div class="verdict ${cls}">${icon}</div>${gained}${mine}</div>`;
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

// Dressing the animal, in the lobby: a background shape, a hat and a tool,
// the same menu for everyone, no words. Built once and patched in place: a
// view arriving (a classmate joining changes "of") must not replace a
// picture under a finger.

/** into: where the menu is built the first time; a Peers lobby has it beside the code and Start (client/peers.ts). */
function renderDress(stored: Avatar, into: HTMLElement = main): void {
  // The server's view has caught up with what the child picked.
  if (look && looks.idle() && sameLook(stored, look)) look = null;
  const shown = look ? { ...stored, ...look } : stored;
  let box = main.querySelector<HTMLElement>(".dress");
  if (!box) {
    into.innerHTML = `<div class="dress">
      <div class="hero"></div>
      <div class="picker">${pickerRows(stored.c)}</div>
      <div class="look">${ICON.eye}</div>
    </div>`;
    box = main.querySelector<HTMLElement>(".dress")!;
    box.querySelectorAll<HTMLButtonElement>(".pick").forEach((btn) => btn.addEventListener("click", () => pick(btn)));
  }
  const hero = box.querySelector<HTMLElement>(".hero")!;
  const key = lookKey(shown);
  if (hero.dataset.key !== key) {
    const changed = hero.dataset.key !== undefined;
    hero.dataset.key = key;
    hero.innerHTML = avatarSvg(shown);
    if (changed) wiggle(hero);
  }
  box.querySelectorAll<HTMLButtonElement>(".pick").forEach((btn) => {
    const on = Number(btn.dataset.i) === (shown[btn.dataset.part as LookPart] ?? 0);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  box.classList.toggle("spent", dressSpent);
}

function pick(btn: HTMLButtonElement): void {
  const me = view?.me;
  if (!me || view?.phase !== "lobby" || dressSpent) return;
  const now: Required<Look> = look ?? { b: me.avatar.b ?? 0, h: me.avatar.h ?? 0, t: me.avatar.t ?? 0 };
  const next = pickLook(now, btn.dataset.part as LookPart, Number(btn.dataset.i));
  if (sameLook(next, now)) return;
  look = next;
  renderDress(me.avatar);
  looks.put(next);
}

/**
 * Taps go out merged (client/latest.ts): the first of a burst, then the
 * latest. The line resends each until the server answers.
 */
const answers = new Latest<{ tap: { q: number; choice: number }; seq: number; v: number; ms?: number }, Ack>(
  (x) => line!.send({ op: "answer", q: x.tap.q, choice: x.tap.choice, seq: x.seq, v: x.v, ms: x.ms }),
  (x, a) => {
    if (waiting !== x.tap) return;
    // Taken: its view says so (above). Not taken (too late, too many
    // changes of mind): the device shows what is held, as its view has it.
    if (a.ok) return;
    waiting = null;
    if (main.querySelector(".buttons")) markChosen();
    else render();
  },
);

const looks = new Latest<Required<Look>, Ack>(
  (l) => line!.send({ op: "dress", b: l.b, h: l.h, t: l.t }),
  (_, a) => {
    if (!a.ok) {
      // Not taken: the quiz started, or the changes are spent. The device
      // shows the look that is held, as the wall does.
      look = null;
      looks.clear();
      if (view?.phase === "lobby" && a.error === undefined) dressSpent = true;
    }
    if (view?.phase === "lobby" && view.me) renderDress(view.me.avatar);
  },
);

void start();
