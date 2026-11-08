// The Projector: what the class sees (docs/user-flow.md §3.3, §3.4). While no
// Remote is there it steers itself: in the lobby it is the single tab's two
// screens, the teacher's check and then, one tap on, the class's join screen
// (docs/design/teacher-devices.md, "The single tab: check, then join"); during
// the quiz the steering bar. A clicker or the keyboard moves the quiz on
// during the quiz; the quiz's code stays in a corner throughout.

import qrcode from "qrcode-generator";
import type { ImageRef, ScreenView, ServerMessage, TeacherView } from "../shared/protocol.ts";
import { $, arrangement, esc, keepAwake, lines, rolePage, siteAddress, statusDot, tabLobby, tabRole, teacherCode, teacherEntry, type Arrangement, type HeldRole } from "./dom.ts";
import { ICON, avatarSvg, syncAvatars } from "./look.ts";
import { Steer, roomNotice, addressAndCode, answersBlock, live, newUI, openMenu, patch, playersRow, questionList, speedSwitch, steerItems, syncCrowd, toast, type MenuItem } from "./manage.ts";
import { Presses, atOf, steeringButtons, type StepState } from "./steps.ts";
import { clockBar, localEnd } from "./clock.ts";
import { finalHtml, fitFinal } from "./final.ts";
import { Line } from "./net.ts";
import { fillPictures, load, picImg, preload } from "./pictures.ts";
import { backdrop, endJump, jump, layQuestion, markTiles } from "./stage.ts";

const main = $("main");
const sbar = $("#sbar");

const params = new URLSearchParams(location.search);
const instance = params.get("q") ?? "";
const held: HeldRole | null = instance ? tabRole.get(instance) : null;
/** Opened from the lobby's "Open the projector window": say where it goes. */
const dragHint = params.get("drag") === "1";

let line: Line | null = null;
let view: ScreenView | null = null;
let lastBar = "";
let wasFull = false;
let tickTimer: number | undefined;
/** The single tab's lobby screen: the teacher's check, or the class's join screen. */
let lobbyScreen: "check" | "join" = instance ? tabLobby.get(instance) : "join";
/** How the screens are arranged, the check's toggle: it decides which how-to the lobby shows, nothing else. */
let arranged: Arrangement = arrangement.get();
const steer = new Steer(() => line, () => view?.steer ?? null, newUI(), () => render());

function start(): void {
  if (!held || held.role !== "screen") {
    location.replace(held ? rolePage(instance, held.role) : "/");
    return;
  }
  if (dragHint) history.replaceState(null, "", rolePage(instance, "screen"));
  keepAwake();
  line = new Line({
    instance,
    auth: () => ({ role: "screen", token: held.token }),
    onMessage,
    onStatus: (s) => {
      const d = document.getElementById("dot");
      if (d) statusDot(d, s);
    },
  });
  line.start();
}

function onMessage(m: ServerMessage): void {
  if (m.t === "state" && m.view.role === "screen") {
    const before = view;
    view = m.view;
    // Every picture of the quiz, fetched ahead: the one on screen first.
    if (view.question?.image) void load(view.question.image.src, true);
    preload(view.pictures);
    // A wall that takes the steering back in the lobby (its steering tab left
    // or went away) keeps showing the class's screen, not the check.
    if (before && !before.steer && view.steer && view.phase === "lobby" && !view.waiting) setLobby("join", false);
    if (before && before.remote !== view.remote) {
      if (view.remote === "present") {
        toast("Remote connected");
        // This host steers from a second device: the next check here says how.
        arrange("remote", false);
      }
      // On the wall: nothing here invites the class to the teacher's page.
      else if (before.remote === "present") toast("Remote gone – steering here", 8000);
    }
    // Whether the Remote's tab is still there, and during a question which
    // tablets are (the count's "of"), changes with time, not with an event:
    // ask now and then.
    clearInterval(tickTimer);
    if (view.remote === "present" || (view.phase === "question" && view.question?.answering !== "reading")) {
      tickTimer = window.setInterval(() => {
        if (line) void line.send({ op: "tick" });
      }, 15_000);
    }
    render();
  } else if (m.t === "role") {
    // Another device chose to show the quiz, or ⇄ Swap: this tab steers from now on.
    line?.stop();
    tabRole.set(instance, { role: m.role, token: m.token, code: held!.code, teacher: teacherDigits() });
    location.replace(rolePage(instance, m.role));
  } else if (m.t === "lost") {
    // Another device took this screen's place while it was away: back in with the teacher code.
    line?.stop();
    tabRole.remove(instance);
    location.replace(comeBack());
  } else if (m.t === "gone") {
    line?.stop();
    tabRole.remove(instance);
    if (m.home) {
      location.replace("/");
      return;
    }
    document.body.className = "screen";
    sbar.innerHTML = "";
    main.innerHTML = `<div class="center"><p style="font-size:1.6em">${esc(m.reason)}</p><p><a class="btn primary" href="/">${esc(siteAddress())}</a></p></div>`;
  }
}

let lastStepKey = "";
function render(): void {
  const v = view;
  if (!v) return;
  document.title = v.title ? `${v.title} · classyQuiz` : "classyQuiz";
  // A fix opened in the lobby, or for the last question, must not pop up on
  // the wall with the next one (the clicker moves on without the menu).
  const stepKey = `${v.phase}|${v.current}`;
  if (stepKey !== lastStepKey) {
    lastStepKey = stepKey;
    steer.ui.fixing = null;
  }
  const managing = !!v.steer && v.phase === "lobby";
  document.body.classList.toggle("manage", managing);
  document.body.classList.toggle("steering", !!v.steer && !managing);
  if (v.phase !== "question" && v.phase !== "reveal") questionKey = "";
  // The lobby's wait for the first avatar ends with the start (nobodyYet).
  if (v.phase !== "lobby") forgetJoinWait();
  if (managing) renderManagedLobby(v);
  else if (v.phase === "lobby") renderLobby(v);
  else if ((v.phase === "question" || v.phase === "reveal") && v.question) renderQuestion(v);
  else if (v.phase === "ranking") renderRanking(v);
  else if (v.phase === "final") {
    lobbyKey = "";
    patch(main, finalHtml(v));
    fitFinal(main);
  }
  renderBar(v, managing);
  renderClock(v);
  renderFix(v);
  renderBackdrop(v);
  renderZoom(v);
  renderParty(v);
}

/**
 * "Change the solution" from ⋯ during the quiz: the question's answers in
 * a sheet over the wall, tappable. On a mirrored laptop the class sees it;
 * the menu item says so.
 */
function renderFix(v: ScreenView): void {
  const t = v.steer;
  const i = steer.ui.fixing;
  let el = document.getElementById("fix");
  if (!t || i === null || v.phase === "lobby" || !t.questions[i]) {
    if (el) {
      el.remove();
      if (t && v.phase !== "lobby") steer.ui.fixing = null;
    }
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "fix";
    el.className = "sheet-back";
    el.innerHTML = `<div class="sheet fixsheet"></div>`;
    el.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target === el) {
        steer.ui.fixing = null;
        render();
        return;
      }
      const a = target.closest<HTMLElement>("[data-act]");
      if (a) void steer.act(a);
    });
    document.body.appendChild(el);
  }
  const q = t.questions[i];
  patch(el.firstElementChild as HTMLElement, `<p class="fixq"><span class="num">${i + 1}</span> ${lines(q.text)}</p>${answersBlock(q, i, steer.ui)}`);
  fillPictures(el);
}

function qrSvg(code: string): string {
  const qr = qrcode(0, "M");
  // Straight to the student page: the root page would load the whole
  // guidance first, and joining must be fast. The root still forwards
  // "/#code" for anyone who types it.
  qr.addData(`${location.origin}/play#${code}`);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

/** The teacher code's two digits: the view's, else what the tab was given. */
function teacherDigits(): string {
  return view?.teacher || held?.teacher || "";
}

/** The way back in for a tab that lost its role. */
function comeBack(): string {
  const d = teacherDigits();
  return d ? teacherEntry(held!.code, d) : `/teacher#${held!.code}`;
}

/**
 * The second device's how-to, in one sentence naming both needs
 * (docs/design/teacher-devices.md, "The single tab: check, then join"); it doesn't guess which device this is. "Open a second
 * screen in a new window" opens a window that asks the same question as any other
 * device; it is always there, so a laptop that gains its second screen after
 * the check finds it where it was (hidden on a phone). This is the sheet's
 * and the menu's; the check says it under "Screen and remote", which has
 * already named both needs (checkHowTo).
 */
function secondDevice(v: ScreenView): string {
  return `A second device, to steer from or to show the quiz on: on <strong>${esc(siteAddress())}</strong>, type <strong class="digits">${esc(teacherCode(v.code, v.teacher))}</strong>.<span class="twoscreens"> Or <button class="link" data-act="projector-window">open a second screen in a new window</button> with a click.</span>`;
}

/** The how-to under the check's "Screen and remote". */
function checkHowTo(v: ScreenView): string {
  return `On the second device, open <strong>${esc(siteAddress())}</strong> and type <strong class="digits">${esc(teacherCode(v.code, v.teacher))}</strong>.<span class="twoscreens"> With two screens on this computer: <button class="link" data-act="projector-window">open a second screen in a new window</button>.</span>`;
}

/** The single tab's lobby screen; the class never sees the check unless the teacher shares it. */
function setLobby(screen: "check" | "join", draw = true): void {
  if (lobbyScreen === screen) return;
  lobbyScreen = screen;
  tabLobby.set(instance, screen);
  if (!draw) return;
  window.scrollTo(0, 0);
  render();
}

function renderManagedLobby(v: ScreenView): void {
  lobbyKey = "";
  // Before the class is let in there is no join screen to show.
  if (lobbyScreen === "check" || v.waiting) renderCheck(v);
  else renderJoin(v);
}

/** The check's toggle (docs/design/teacher-devices.md, "How the screens are arranged"); remembered in this browser. */
function arrange(a: Arrangement, draw = true): void {
  if (arranged === a) return;
  arranged = a;
  arrangement.set(a);
  if (draw) render();
}

/** One side of the toggle: its name and what it means, pressed when it is the arrangement. */
function arrangeOption(a: Arrangement, name: string, line: string): string {
  return `<button class="arrange-opt" type="button" data-act="arrange" data-to="${a}" aria-pressed="${arranged === a}"><strong>${name}</strong><small>${line}</small></button>`;
}

/**
 * The check: the host's page before anyone joins
 * (docs/design/teacher-devices.md, "The single tab: check, then join"). It
 * asks how the screens are arranged and gives the remote's how-to only to a
 * host who has one; it lists the questions, their answers folded: the local
 * check keeps them closed for whoever plays, so this is where whoever runs
 * the quiz sees them and catches a wrong key before the wall. The join code is
 * small; a second device can use it with the two more digits, the players
 * only once "Let everyone in" is tapped: the one tap to the join screen,
 * which lets them in.
 */
function renderCheck(v: ScreenView): void {
  const t = v.steer!;
  const n = v.players.length;
  const nq = t.questions.length;
  // A Remote that was here and went: the how-to to bring it back, whatever the toggle says.
  const howTo = arranged === "remote" || t.remote === "away";
  const gone = t.remote === "away" ? "Remote gone. " : "";
  const html = `<div class="check">
    <div class="checkhead">
      <h1 class="ctitle">${lines(v.title || "Quiz")} <span class="cnum">· ${nq} ${nq === 1 ? "question" : "questions"}</span></h1>
      <p class="classcode">Join code <strong>${esc(v.code)}</strong>${n > 0 ? ` <span class="joinedn">${ICON.person}${live("joined", n)}</span>` : ""}</p>
    </div>
    ${roomNotice(t)}
    <h2 class="arrange-ask">How are the screens arranged?</h2>
    <div class="arrange" role="group" aria-label="How are the screens arranged?">
      ${arrangeOption("one", "One screen", "It shows the quiz and steers it: the buttons under the quiz, the keyboard or a clicker.")}
      ${arrangeOption("remote", "Screen and remote", "One device shows the quiz, another steers it: a phone, say.")}
    </div>
    ${howTo ? `<p class="device cline">${gone}${checkHowTo(v)}</p>` : ""}
    <p class="arrange-call">In a video call, the window you share is the screen everyone sees.</p>
    <p class="cstart"><button class="btn primary big" data-act="show-join">Let everyone in &#9654;</button></p>
    ${questionList(t, steer.ui)}
    <p class="mfoot"><button class="btn" data-menu>⋯ More</button></p>
  </div>`;
  patch(main, html);
  fillPictures(main);
  steer.noteStep(t);
}

// Nobody in yet (docs/design/root-page.md, "Network help, where failure shows"): the laptop got
// through, the tablets may not (a student network with a stricter filter).
// After NOBODY_MS with the class's join screen up and nobody in, one muted
// line under the avatars; gone with the first avatar. It shows on a mirrored
// laptop, in front of the class: harmless text, at the moment the class
// watches the teacher wait. The link opens a new tab, so the wall stays.

const NOBODY_MS = 90_000;
/**
 * When this tab first let the class in to an empty lobby; the wait
 * counts from there, across ‹ Back and the join screen again. It goes with the first
 * avatar and with the quiz's start.
 */
let joinSince: { code: string; at: number } | null = null;
let nobodyTimer: number | undefined;

function forgetJoinWait(): void {
  joinSince = null;
  clearTimeout(nobodyTimer);
}

function nobodyYet(v: ScreenView): boolean {
  if (v.players.length > 0 || v.phase !== "lobby") {
    forgetJoinWait();
    return false;
  }
  if (joinSince?.code !== v.code) joinSince = { code: v.code, at: Date.now() };
  const left = joinSince.at + NOBODY_MS - Date.now();
  if (left <= 0) return true;
  clearTimeout(nobodyTimer);
  nobodyTimer = window.setTimeout(() => render(), left + 50);
  return false;
}

/**
 * Where the code goes (docs/design/class-and-wall.md, "Getting in"): first
 * users typing the address didn't find the code box in the landing page's
 * header. A wordless picture of a tablet's top: the address in the browser's
 * field, the site's header with this class's code in its box. Wordless, so
 * it matches the landing page in any language and at any width. Shown until
 * the first avatar; after that the class shows each other.
 */
function howTo(code: string): string {
  return `<div class="howto" aria-hidden="true"><div class="scr">
    <div class="url">${esc(siteAddress())}</div>
    <div class="hdr"><span class="logo"><img class="s32" src="/brand/classyquiz-horizontal-32.svg" alt="" width="134" height="32" loading="lazy"><img class="master" src="/brand/classyquiz-horizontal-colour.svg" alt="" width="935" height="256" loading="lazy"></span><span class="box">${esc(code)}</span><span class="go">&#9654;</span></div>
    <div class="page"><i></i><i></i><i></i></div>
  </div></div>`;
}

/**
 * The address the class types, the mark before it: the fox the tablets then
 * find in the landing page's header (docs/design/identity.md). The wall stays
 * light, so the light-ground files: the full drawing from 48 px, which beside
 * a pages.dev address the mark reaches on a 1920 x 1080 wall (the join
 * column's height caps it), the drawing for 24 to 47 px below that. --chars
 * is the address's length plus the mark's room (app.css, the join column).
 */
function joinAddress(): string {
  return `<div class="addr" style="--chars:${siteAddress().length + 3}"><picture><source media="(min-width: 1600px) and (min-height: 960px)" srcset="/brand/classyquiz-symbol-colour.svg"><img class="mark" src="/brand/classyquiz-symbol-32.svg" alt="" width="32" height="32"></picture>${esc(siteAddress())}</div>`;
}

function nobodyLine(): string {
  const host = esc(siteAddress());
  return `Nobody in yet? If phones and tablets can't open ${host}, their network may block it: <a href="/check#it" target="_blank" rel="noopener">what to tell IT ›</a>`;
}

/**
 * The join screen, everyone's: QR, code, avatars and Start. The part
 * everyone sees ends at the fold; "‹ Back" goes back to the check, and
 * with a remote "A second device ›" shows its how-to in a sheet (on one
 * screen it is in ⋯ only).
 */
function renderJoin(v: ScreenView): void {
  const t = v.steer!;
  const n = v.players.length;
  const html = `<div class="mlobby">
    <div class="mfold">
      <div class="bar"><span class="grow">${esc(v.title || "Quiz")}</span></div>
      <div class="lobby">
        <div class="join">
          <div class="qr">${qrSvg(v.code)}</div>
          ${joinAddress()}
          <div class="bigcode">${esc(v.code)}</div>
        </div>
        <div class="crowdcol">
          <div class="count">${ICON.person}${live("joined", n)}</div>
          ${n === 0 ? howTo(v.code) : ""}
          <div class="avatars" data-crowd></div>
          ${nobodyYet(v) ? `<p class="nobody">${nobodyLine()}</p>` : ""}
        </div>
      </div>
      <div class="mstart"><button class="btn primary big" data-act="begin">Start quiz &#9654;</button>
        <p class="device">${speedSwitch(t)}</p>
        <p class="joinnav"><button class="link" data-act="show-check">‹ Back</button>
          ${arranged === "remote" || t.remote === "away" ? `<button class="link" data-act="second-device">${t.remote === "away" ? "Remote gone: a" : "A"} second device ›</button>` : ""}
          <button class="link" data-menu aria-label="more">⋯</button></p>
      </div>
    </div>
  </div>`;
  patch(main, html);
  syncCrowd(main, t);
  steer.noteStep(t);
}

let lobbyKey = "";
function renderLobby(v: ScreenView): void {
  if (v.waiting) {
    // The wall beside a steering tab, before the class is let in: no code yet.
    if (lobbyKey === "waiting") return;
    lobbyKey = "waiting";
    delete main.dataset.skeleton;
    main.innerHTML = `<div class="bar"><span class="grow">${esc(v.title)}</span></div>
      <div class="center"><p class="muted">Joining opens in a moment.</p></div>`;
    return;
  }
  const key = `${v.code}`;
  if (lobbyKey !== key || !main.querySelector(".lobby")) {
    lobbyKey = key;
    delete main.dataset.skeleton;
    main.innerHTML = `
      <div class="bar"><span class="grow">${esc(v.title)}</span></div>
      <div class="lobby">
        <div class="join">
          <div class="qr">${qrSvg(v.code)}</div>
          ${joinAddress()}
          <div class="bigcode">${esc(v.code)}</div>
        </div>
        <div style="display:flex;flex-direction:column;min-height:0">
          <div class="count">${ICON.person}<span id="count">0</span></div>
          <div id="howto">${howTo(v.code)}</div>
          <div class="crowd" id="crowd"></div>
          <p class="nobody" id="nobody" hidden>${nobodyLine()}</p>
        </div>
      </div>`;
  }
  $("#nobody").hidden = !nobodyYet(v);
  $("#howto").hidden = v.players.length > 0;
  // Newcomers pop in once; a changed look wiggles (the child dressing it).
  syncAvatars($("#crowd"), v.players, () => ({ tag: "div", className: "av" }));
  $("#count").textContent = String(v.players.length);
}

let questionKey = "";
let barKey = "";
function renderQuestion(v: ScreenView): void {
  lobbyKey = "";
  const q = v.question!;
  const r = v.reveal;
  // The question is laid out once: while answers come in only the count
  // changes, and the reveal only marks the tiles, so neither text nor
  // picture moves or flickers (docs/design/class-and-wall.md,
  // "Tiles do not move at the reveal"). The fit depends on the room the bar leaves and
  // on the window's size, so both are part of the key.
  const key = JSON.stringify([q.q, q.text, q.answers, q.pics, q.image, !!v.steer, innerWidth, innerHeight]);
  if (key !== questionKey || !main.querySelector("#stage")) {
    questionKey = key;
    barKey = "";
    delete main.dataset.skeleton;
    // The bar has a fixed height (app.css, #qbar), so the avatars landing in
    // it, the count appearing when the answers are shown and the reveal move nothing below.
    main.innerHTML = `<div class="bar" id="qbar"><span id="qpos"></span><span class="strip" id="strip"></span><span id="qicons"></span>
      <span class="qcount" id="qcount">${ICON.person} <span id="answered"></span></span></div><div class="stage" id="stage"></div>`;
  }
  // The bar first: the layout measures the room it leaves.
  const reading = q.answering === "reading";
  const bk = JSON.stringify([q.n, q.total, !!r?.void]);
  if (bk !== barKey) {
    barKey = bk;
    $("#qpos").textContent = `${q.n} / ${q.total}`;
    $("#qicons").innerHTML = r && r.void ? `<span class="voided">${ICON.void}</span>` : "";
  }
  $("#qcount").hidden = reading;
  // "Of" counts the devices that are there (or answered and went away), so a
  // dead tablet doesn't hold it below full.
  const of = v.of;
  $("#answered").textContent = `${v.answered} / ${of}`;
  $("#qcount").classList.toggle("all", of > 0 && v.answered >= of);
  renderStrip(q.q, reading ? [] : v.answeredBy, of);
  const stage = $("#stage");
  if (!stage.dataset.laid) {
    stage.dataset.laid = "1";
    layQuestion(stage, q);
  }
  // The answers hidden: the tiles are laid out with their answers from the
  // start, so nothing moves when they show; until then only their colours and shapes.
  document.getElementById("tiles")?.classList.toggle("veiled", reading);
  markTiles(main, { counts: r ? r.counts : null, dist: r ? r.dist : (v.votes ?? null) });
}

/**
 * Who has answered: each avatar pops into the bar as its answer
 * lands, in the order they arrive. Only those who answered: nobody is shown
 * as missing (the count says how many, the Remote who). The mark says the
 * answer arrived, never which one, and a change of mind changes nothing.
 * The avatars are as large as the bar allows for the whole class in one or
 * more rows, so they don't shrink as the answers come in.
 */
let stripQ = -1;
let stripFit = "";
const popped = new Set<string>();
function renderStrip(q: number, inList: { id: string; avatar: ScreenView["players"][number]["avatar"] }[], of: number): void {
  const strip = document.getElementById("strip");
  if (!strip) return;
  if (q !== stripQ) {
    stripQ = q;
    popped.clear();
  }
  const n = Math.max(1, of, inList.length);
  const fit = `${n}|${strip.clientWidth}|${strip.clientHeight}`;
  if (fit !== stripFit) {
    stripFit = fit;
    strip.style.setProperty("--av", `${stripSize(n, strip.clientWidth, strip.clientHeight)}px`);
  }
  const want = new Set(inList.map((p) => p.id));
  for (const el of [...strip.children] as HTMLElement[]) if (!want.has(el.dataset.id!)) el.remove();
  const shown = new Set(([...strip.children] as HTMLElement[]).map((el) => el.dataset.id));
  for (const p of inList) {
    if (shown.has(p.id)) continue;
    const d = document.createElement("span");
    d.className = "av";
    d.dataset.id = p.id;
    // Only the first time on this question: a redraw (a resized window) doesn't pop them all again.
    if (popped.has(p.id)) d.classList.add("still");
    popped.add(p.id);
    d.innerHTML = avatarSvg(p.avatar);
    strip.appendChild(d);
  }
}

/** The largest avatar (px) such that n of them fit in w×h, in as many rows as that takes. */
function stripSize(n: number, w: number, h: number): number {
  const gap = 4;
  for (let s = Math.floor(h); s >= 8; s--) {
    const perRow = Math.max(1, Math.floor((w + gap) / (s + gap)));
    const rows = Math.ceil(n / perRow);
    if (rows * s + (rows - 1) * gap <= h) return s;
  }
  return 8;
}

// The winners jump: after every reveal, the avatars of those whose answer
// counts jump for a few seconds in a band over the top of the stage; the tiles
// with the key stay in view (look.ts, partySize). In the lobby's order, so
// the first isn't the fastest. Once per key: a view that comes again (a tick,
// a reconnect) doesn't restart it; a fix of the key does, for its new winners.

let partyKey = "";

function renderParty(v: ScreenView): void {
  const r = v.phase === "reveal" ? v.reveal : null;
  if (!r) partyKey = "";
  const byId = new Map(v.players.map((p) => [p.id, p.avatar]));
  const winners = (r && !r.void ? r.winners : []).flatMap((id) => (byId.has(id) ? [{ id, avatar: byId.get(id)! }] : []));
  const stage = document.getElementById("stage");
  if (!r || !stage || v.zoom || winners.length === 0) {
    endJump();
    return;
  }
  const key = `${v.current}|${r.winners.join()}`;
  if (key === partyKey) return;
  partyKey = key;
  jump(stage, winners);
}

/**
 * Last call's bar along the top edge of the wall, over everything: it takes
 * no room from the question, its picture or the tiles. Drawn again only when
 * it starts, stops or runs out; in between, CSS drains it.
 */
let clockKey = "";
function renderClock(v: ScreenView): void {
  const q = v.phase === "question" ? v.question : null;
  const c = q?.clock ?? null;
  let el = document.getElementById("clock");
  if (!q || !c) {
    clockKey = "";
    el?.remove();
    return;
  }
  const key = JSON.stringify([q.q, c.ms, c.leftMs === 0]);
  if (key === clockKey && el) return;
  clockKey = key;
  if (!el) {
    el = document.createElement("div");
    el.id = "clock";
    document.body.appendChild(el);
  }
  el.innerHTML = clockBar(c.ms, localEnd(`${v.current}|${c.ms}`, c), "wall");
}

/**
 * The picture over the whole screen, for the moment the teacher points at
 * it: Z or a click on the picture here, or the Remote. It ends by itself
 * with the next step.
 */
function renderZoom(v: ScreenView): void {
  const img = v.zoom && (v.phase === "question" || v.phase === "reveal") ? v.question?.image : null;
  let el = document.getElementById("zoom");
  if (!img) {
    el?.remove();
    return;
  }
  const maxW = window.innerWidth * 0.96;
  const maxH = (window.innerHeight - (v.steer ? 64 : 0)) * 0.94;
  const scale = Math.min(maxW / img.w, maxH / img.h);
  const key = JSON.stringify([img.src, scale]);
  if (el?.dataset.key === key) return;
  if (!el) {
    el = document.createElement("div");
    el.id = "zoom";
    el.dataset.zoom = "";
    document.body.appendChild(el);
  }
  el.dataset.key = key;
  el.classList.toggle("over-bar", !!v.steer);
  el.innerHTML = `<div class="figure" style="width:${Math.floor(img.w * scale)}px;height:${Math.floor(img.h * scale)}px">${picImg(img.src, img.w, img.h)}</div>`;
  fillPictures(el);
}

/**
 * A background behind the whole screen, under a light veil so the question
 * and tiles read from the back row: the question's own (or the quiz's) while
 * a question is up, the quiz's in the lobby and at the rankings.
 */
function renderBackdrop(v: ScreenView): void {
  backdrop(v.phase === "question" || v.phase === "reveal" ? (v.question?.background ?? null) : v.background);
}

function renderRanking(v: ScreenView): void {
  lobbyKey = "";
  const r = v.ranking;
  if (!r) return;
  const pct = r.given > 0 ? Math.round((100 * r.right) / r.given) : 0;
  const html = `
    <div class="bar"><span class="grow">${esc(v.title)}</span></div>
    <div class="ranking">
      <div class="podium">
        ${r.top
          .map(
            (e) => `<div class="entry p${e.place}">
              <div class="av">${avatarSvg(e.avatar)}</div>
              <div class="place">${e.place}.</div>
              <div>${ICON.star} ${e.score}${r.speed ? "" : ` / ${r.of}`}</div>
            </div>`,
          )
          .join("")}
      </div>
      <div class="classres">
        <div class="pct">${pct}%</div>
        <div class="muted">${ICON.check} ${r.right} / ${r.given}</div>
        <div class="bars">${r.perQuestion.map((p) => `<span><i style="height:${p.given ? (100 * p.right) / p.given : 0}%"></i></span>`).join("")}</div>
      </div>
    </div>`;
  patch(main, html);
}

/**
 * The bottom line. Steering: ⋯, the code, Countdown and Play (steps.ts). Not steering:
 * the code in a corner, full screen, and ⋯ (steer from here, leave).
 */
function renderBar(v: ScreenView, managing: boolean): void {
  const full = !!document.fullscreenElement;
  let html: string;
  if (managing) {
    html = "";
  } else if (v.steer) {
    html = `<div class="steerbar">
      <button class="btn more" data-menu aria-label="more">⋯</button>
      <span class="grow codeline">${v.phase === "final" ? "" : addressAndCode(v.code)}</span><span class="dot" id="dot"></span>
      ${v.steer.remote === "away" ? `<span class="joinchip">Remote gone</span>` : ""}
      ${steeringButtons(v.steer)}
    </div>`;
  } else {
    html = `<div class="corner">
      ${v.phase === "lobby" ? "" : `<span class="codeline">${addressAndCode(v.code)}</span>`}
      <span class="grow"></span><span class="dot" id="dot"></span>
      ${v.phase === "lobby" && v.remote === "present" ? `<button data-act="swap" type="button">&#8644; Swap screens</button>` : ""}
      ${full ? "" : `<button data-full type="button">Full screen (F)</button>`}
      <button data-menu type="button" aria-label="more">⋯</button>
    </div>`;
  }
  // Until the window has been full screen once (it is on the projector then).
  if (full) wasFull = true;
  if (dragHint && !full && !wasFull && !v.steer) {
    html += `<div class="drag-hint">Drag this window to the projector screen, then press F for full screen.</div>`;
  }
  if (html !== lastBar) {
    lastBar = html;
    sbar.innerHTML = html;
  }
  // What a press is judged against: when the step on this screen changed.
  if (v.steer) steer.noteStep(v.steer);
  else wallPresses.noteView(screenState(v));
}

function menu(v: ScreenView): void {
  const items: MenuItem[] = v.steer ? steerItems(v.steer, steer, true) : [];
  if (v.question?.image && (v.phase === "question" || v.phase === "reveal")) {
    items.unshift({ label: v.zoom ? "Back to the question (Z)" : "Enlarge the picture (Z)", run: () => toggleZoom() });
  }
  if (v.steer) items.push({ label: "Players", run: () => showPlayers() });
  // ⇄ Swap while both tabs are there: this wall steers, the steering tab shows the quiz.
  if (!v.steer && v.remote === "present") items.push({ label: "&#8644; Swap: steer here, show the quiz on the other device", run: () => void swap() });
  if (v.steer) items.push({ label: "A second device…", run: () => showNote(secondDevice(v)) });
  items.push({ label: "Stop showing the quiz here", run: () => void leave() });
  if (v.steer && v.phase !== "final") items.push({ label: "Delete the quiz…", danger: true, run: () => void steer.run("delete") });
  openMenu(items);
}

function showPlayers(): void {
  const t = view?.steer;
  if (!t) return;
  document.querySelector(".sheet-back")?.remove();
  const back = document.createElement("div");
  back.className = "sheet-back";
  back.innerHTML = `<div class="sheet players-sheet"><p class="hint">Faded ones are away; they come back by themselves. Tap one to remove it, e.g. a double.</p>
    ${playersRow(t, true)}<button class="cancel" data-close>Close</button></div>`;
  back.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
    if (el) void steer.act(el);
    if (el || (e.target as HTMLElement).closest("[data-close]") || e.target === back) back.remove();
  });
  document.body.appendChild(back);
}

function showNote(html: string): void {
  document.querySelector(".sheet-back")?.remove();
  const back = document.createElement("div");
  back.className = "sheet-back";
  back.innerHTML = `<div class="sheet"><p>${html}</p><button class="cancel" data-close>Close</button></div>`;
  back.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-act=projector-window]")) {
      back.remove();
      projectorWindow();
      return;
    }
    if (t.closest("[data-close]") || e.target === back) back.remove();
  });
  document.body.appendChild(back);
}

/** ⇄ Swap (docs/design/teacher-devices.md, "A second device: one question, only when needed"): no confirmation, the same tap on either device undoes it. */
async function swap(): Promise<void> {
  const r = await line?.send({ op: "swap" });
  if (r && !r.ok && r.error) toast(r.error);
}

async function leave(): Promise<void> {
  // The single tab with the class in: nothing steers after this, until a device comes in with the teacher code.
  const last = !!view?.steer && view.players.length > 0;
  const back = view ? `type ${teacherCode(view.code, view.teacher)} at ${siteAddress()}` : "";
  if (!confirm(last ? `Stop showing the quiz on this screen? Nothing steers it until a device comes in: ${back}.` : "Stop showing the quiz on this screen?")) return;
  await line?.send({ op: "leave" });
  line?.stop();
  tabRole.remove(instance);
  location.replace("/");
}

/** Two screens: a new window, which asks the same question as any other device. */
function projectorWindow(): void {
  const w = window.open(teacherEntry(held!.code, teacherDigits(), "?win=1"), "_blank", "popup,width=1280,height=720");
  if (!w) toast(`The browser blocked the new window. Allow pop-ups for this site, or open it in another window and type ${teacherCode(held!.code, teacherDigits())}.`, 8000);
}

for (const area of [main, sbar]) {
  area.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-menu]")) {
      if (view) menu(view);
      return;
    }
    if (t.closest("[data-full]")) {
      toggleFullscreen();
      return;
    }
    const el = t.closest<HTMLElement>("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "projector-window") projectorWindow();
    else if (act === "show-join") {
      // The first time, the tap lets the class in; the join screen follows the view that says so.
      if (view?.waiting) void steer.run("let-in");
      setLobby("join");
    }
    else if (act === "show-check") setLobby("check");
    else if (act === "arrange") arrange(el.dataset.to === "remote" ? "remote" : "one");
    else if (act === "second-device") {
      if (view) showNote(secondDevice(view));
    } else if (act === "swap") void swap();
    else void steer.act(el);
  });
}

// Clicker and keyboard: Space, Enter, →, ↓, PageDown and N are Play, judged
// like a press of the button (steps.ts, Presses). No key starts the quiz from
// the lobby: a stray key must not move it (a teacher leaning on the laptop),
// and Start is pressed once while the class is still joining. A key with
// Ctrl, Alt or Cmd is a shortcut, not a step. While a Remote steers, the
// teacher is on the phone and the laptop's big keys (Space, Enter, N) are the
// likeliest strays; only a clicker's keys (PageDown, →, ↓) move on from here
// (docs/design/question-flow.md, "The steering bar", Keys).
const PLAY_KEYS = new Set([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown", "n", "N"]);
const CLICKER = new Set(["PageDown", "ArrowRight", "ArrowDown"]);
/** The clicker's presses while a Remote steers; while this wall steers, the Steer's own. */
const wallPresses = new Presses();

function screenState(v: ScreenView): StepState {
  const q = v.phase === "question" ? v.question : null;
  return {
    phase: v.phase,
    current: v.current,
    answering: q ? q.answering : null,
    votes: !!v.votes,
    lastCall: !!q?.clock && q.answering === "open",
    last: !!v.question && v.question.n >= v.question.total,
    n: v.question?.n ?? 0,
  };
}

document.addEventListener("keydown", (e) => {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === "f" || e.key === "F") {
    toggleFullscreen();
    return;
  }
  if ((e.key === "z" || e.key === "Z") && !e.repeat) {
    toggleZoom();
    return;
  }
  // Space or Enter on a focused button is that button's click.
  if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
  if (!PLAY_KEYS.has(e.key) || e.repeat || !line || !view) return;
  if (view.phase === "lobby" || view.phase === "idle" || (!view.steer && !CLICKER.has(e.key))) return;
  e.preventDefault();
  if (view.steer) {
    void steer.run("play");
    return;
  }
  const from = wallPresses.play(screenState(view));
  if (from) void line.send({ op: "play", at: atOf(from) });
});

function toggleZoom(): void {
  const v = view;
  if (!v || !line || !v.question?.image || (v.phase !== "question" && v.phase !== "reveal")) return;
  void line.send({ op: "zoom", value: !v.zoom, at: { phase: v.phase, current: v.current } }).then((r) => {
    if (!r.ok && r.error) toast(r.error);
  });
}
// The picture beside the question, or the enlarged one: a click toggles.
document.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest("[data-zoom]")) toggleZoom();
});

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}
document.addEventListener("fullscreenchange", () => {
  lastBar = "";
  if (view) renderBar(view, !!view.steer && view.phase === "lobby");
});
window.addEventListener("resize", () => {
  // The band is laid out for the old size; it doesn't come back for this key.
  endJump();
  // A window dragged to the projector screen: fit the question to its size.
  if (view && (view.phase === "question" || view.phase === "reveal")) {
    questionKey = "";
    render();
  }
  const z = document.getElementById("zoom");
  if (z) delete z.dataset.key;
  if (view) renderZoom(view);
});

start();
