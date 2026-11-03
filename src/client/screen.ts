// The Projector: what the class sees (docs/user-flow.md §3.3, §3.4). No key
// before the reveal. While no Remote is there it steers itself: in the lobby
// it is the single tab's two screens, the teacher's check and then, one tap
// on, the class's join screen (docs/after-upload.md §3); during the quiz a
// slim bar carries the next step. A clicker or the keyboard moves the quiz on
// at any time; the quiz's code stays in a corner throughout.

import qrcode from "qrcode-generator";
import type { ImageRef, ScreenView, ServerMessage, TeacherView } from "../shared/protocol.ts";
import { chooseGrid, type Chrome, type Orient } from "./answergrid.ts";
import { $, esc, keepAwake, lines, rolePage, siteAddress, statusDot, tabLobby, tabRole, teacherCode, teacherEntry, type HeldRole } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg, syncAvatars } from "./look.ts";
import { STEP_LOCK_MS, Steer, addressAndCode, answersBlock, live, newUI, nextStep, nudgePair, openMenu, patch, playersRow, questionList, sideStep, steerItems, syncCrowd, closeTempoSheet, tempoLine, toast, type MenuItem } from "./manage.ts";
import { clockBar, localEnd } from "./clock.ts";
import { Line } from "./net.ts";
import { fillPictures, load, picImg, preload } from "./pictures.ts";

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
    if (before && !before.steer && view.steer && view.phase === "lobby") setLobby("join", false);
    if (before && before.remote !== view.remote) {
      if (view.remote === "present") toast("Remote connected");
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
    document.body.className = "screen";
    sbar.innerHTML = "";
    main.innerHTML = `<div class="center"><p style="font-size:1.6em">${esc(m.reason)}</p><p><a class="btn primary" href="/">${esc(siteAddress())}</a></p></div>`;
  }
}

// ---------------------------------------------------------------------------
// Drawing

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
    closeTempoSheet();
  }
  if (!v.steer) closeTempoSheet();
  const managing = !!v.steer && v.phase === "lobby";
  document.body.classList.toggle("manage", managing);
  document.body.classList.toggle("steering", !!v.steer && !managing);
  if (v.phase !== "question" && v.phase !== "reveal") questionKey = "";
  // The lobby's wait for the first avatar is per class (nobodyYet).
  if (v.phase !== "lobby") forgetJoinWait();
  if (managing) renderManagedLobby(v);
  else if (v.phase === "lobby") renderLobby(v);
  else if ((v.phase === "question" || v.phase === "reveal") && v.question) renderQuestion(v);
  else if (v.phase === "ranking" || v.phase === "final") renderRanking(v);
  renderBar(v, managing);
  renderClock(v);
  renderFix(v);
  renderBackdrop(v);
  renderZoom(v);
}

/**
 * "Change the right answer" from ⋯ during the quiz: the question's answers in
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
  // guidance first, on the step the owner calls the slowest (item 4). The
  // root still forwards "/#code" for anyone who types it.
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
 * The teacher code at rest, in one sentence naming both needs
 * (docs/after-upload.md §3); it doesn't guess which device this is. "A new
 * window here" opens a window that asks the same question as any other
 * device; it is always there, so a laptop that gains its second screen after
 * the check finds it where it was (hidden on a phone).
 */
function secondDevice(v: ScreenView): string {
  return `A second device, to steer from or to show the quiz on: on <strong>${esc(siteAddress())}</strong>, type <strong>${esc(teacherCode(v.code, v.teacher))}</strong>.<span class="twoscreens"> Or <button class="link" data-act="projector-window">a new window here</button>.</span>`;
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

/** The lobby while this screen steers: the check, or the join screen. */
function renderManagedLobby(v: ScreenView): void {
  lobbyKey = "";
  if (lobbyScreen === "check") renderCheck(v);
  else renderJoin(v);
}

/**
 * Check, the teacher's (docs/after-upload.md §3): the right quiz (title and
 * how many questions, which tells two versions apart), the class code small
 * ("upload is start": read aloud, the class joins without the tap), the
 * tempo, the teacher code at rest, and the questions with their fixes.
 * "Show the class the code" is the one tap to the join screen.
 */
function renderCheck(v: ScreenView): void {
  const t = v.steer!;
  const n = v.players.length;
  const gone = t.remote === "away" ? "Remote gone. " : "";
  const html = `<div class="check">
    <div class="checkhead">
      <h1 class="ctitle">${lines(v.title || "Quiz")} <span class="cnum">· ${t.questions.length} ${t.questions.length === 1 ? "question" : "questions"}</span></h1>
      <p class="classcode">Class code <strong>${esc(v.code)}</strong>${n > 0 ? ` <span class="joinedn">${ICON.person}${live("joined", n)}</span>` : ""}</p>
    </div>
    <p class="cstart"><button class="btn primary big" data-act="show-join">Show the class the code &#9654;</button></p>
    <p class="device cline">${tempoLine(t)}</p>
    <p class="device cline">${gone}${secondDevice(v)}</p>
    ${questionList(t, steer.ui)}
    <p class="mfoot"><button class="btn" data-menu>⋯ More</button></p>
  </div>`;
  patch(main, html);
  fillPictures(main);
  steer.noteStep(t, main);
}

// --- nobody in yet (landing story §7, backlog v4 item 4): the laptop got
// through, the tablets may not (a student network with a stricter filter).
// After NOBODY_MS with the class's join screen up and nobody in, one muted
// line under the avatars; gone with the first avatar. It shows on a mirrored
// laptop, in front of the class: harmless text, at the moment the class
// watches the teacher wait. The link opens a new tab, so the wall stays.

const NOBODY_MS = 90_000;
/**
 * When this tab first showed the class the code to an empty lobby; the wait
 * counts from there, across ‹ Questions and back. Each class starts its own:
 * the count goes with the first avatar and with the run's start, so "Again
 * with another class" waits its 90 s too (review D #3).
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

function nobodyLine(): string {
  const host = esc(siteAddress());
  return `Nobody in yet? If the tablets can't open ${host}, the school network may block it: <a href="/check#it" target="_blank" rel="noopener">what to tell IT ›</a>`;
}

/**
 * Join, the class's: today's fold, the code large, the avatars arriving, and
 * Start. The class's screen ends at the fold; "‹ Questions" goes back to the
 * check, "A second device ›" shows the teacher code in a sheet.
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
          <div class="addr">${esc(siteAddress())}</div>
          <div class="bigcode">${esc(v.code)}</div>
        </div>
        <div class="crowdcol">
          <div class="count">${ICON.person}${live("joined", n)}</div>
          <div class="avatars" data-crowd></div>
          ${nobodyYet(v) ? `<p class="nobody">${nobodyLine()}</p>` : ""}
        </div>
      </div>
      <div class="mstart"><button class="btn primary big" data-step data-act="begin">Start quiz &#9654;</button>
        <p class="device">${tempoLine(t)}</p>
        <p class="joinnav"><button class="link" data-act="show-check">‹ Questions</button>
          <button class="link" data-act="second-device">${t.remote === "away" ? "Remote gone: a" : "A"} second device ›</button>
          <button class="link" data-menu aria-label="more">⋯</button></p>
      </div>
    </div>
  </div>`;
  patch(main, html);
  syncCrowd(main, t);
  steer.noteStep(t, main);
}

let lobbyKey = "";
function renderLobby(v: ScreenView): void {
  const key = `${v.code}`;
  if (lobbyKey !== key || !main.querySelector(".lobby")) {
    lobbyKey = key;
    delete main.dataset.skeleton;
    main.innerHTML = `
      <div class="bar"><span class="grow">${esc(v.title)}</span></div>
      <div class="lobby">
        <div class="join">
          <div class="qr">${qrSvg(v.code)}</div>
          <div class="addr">${esc(siteAddress())}</div>
          <div class="bigcode">${esc(v.code)}</div>
        </div>
        <div style="display:flex;flex-direction:column;min-height:0">
          <div class="count">${ICON.person}<span id="count">0</span></div>
          <div class="crowd" id="crowd"></div>
          <p class="nobody" id="nobody" hidden>${nobodyLine()}</p>
        </div>
      </div>`;
  }
  $("#nobody").hidden = !nobodyYet(v);
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
  // picture moves or flickers (decisions.md, "Projector tiles: the reveal
  // doesn't move the text"). The fit depends on the room the bar leaves and
  // on the window's size, so both are part of the key.
  const key = JSON.stringify([q.q, q.text, q.answers, q.pics, q.image, !!v.steer, innerWidth, innerHeight]);
  if (key !== questionKey || !main.querySelector("#stage")) {
    questionKey = key;
    barKey = "";
    delete main.dataset.skeleton;
    // The bar has a fixed height (app.css, #qbar), so the avatars landing in
    // it, the count appearing at Go and the reveal move nothing below.
    main.innerHTML = `<div class="bar" id="qbar"><span id="qpos"></span><span class="strip" id="strip"></span><span id="qicons"></span>
      <span class="qcount" id="qcount">${ICON.person} <span id="answered"></span></span></div><div class="stage" id="stage"></div>`;
  }
  // The bar first: the layout measures the room it leaves.
  const reading = q.answering === "reading";
  const timeUp = !r && !v.votes && q.answering === "closed";
  const bk = JSON.stringify([q.n, q.total, !!r?.void, timeUp]);
  if (bk !== barKey) {
    barKey = bk;
    $("#qpos").textContent = `${q.n} / ${q.total}`;
    $("#qicons").innerHTML = `${r && r.void ? `<span class="voided">${ICON.void}</span>` : ""}${timeUp ? `<span class="timeup">${ICON.timer}</span>` : ""}`;
  }
  // Nobody can answer while the class reads the question.
  $("#qcount").hidden = reading;
  // "Of" counts the devices that are there (or answered and went away), so a
  // dead tablet doesn't hold it below full; an older server sends no `of`.
  const of = typeof v.of === "number" ? v.of : v.players.length;
  $("#answered").textContent = `${v.answered} / ${of}`;
  $("#qcount").classList.toggle("all", of > 0 && v.answered >= of);
  renderStrip(q.q, reading ? [] : (v.answeredBy ?? []), of);
  const stage = $("#stage");
  if (!stage.dataset.laid) {
    stage.dataset.laid = "1";
    layQuestion(stage, q);
  }
  // Countdown tempos: the tiles are laid out with their answers from the
  // start, so nothing moves at Go; until then only their colours and shapes show.
  document.getElementById("tiles")?.classList.toggle("veiled", reading);
  markTiles(r, v.votes ?? null);
}

/**
 * Who has answered (v2 item 7): each avatar pops into the bar as its answer
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

/**
 * The countdown along the top edge of the wall, over everything: it takes
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
 * The votes, then the reveal, on the tiles (v2 item 6). The votes: how many
 * picked each, with a bar, and no answer marked or faded. The reveal adds a
 * tick on the ones that count and fades the others; the bars stay. The mark
 * and count have their place at the right of every tile from the start, so
 * neither step moves any answer text.
 */
function markTiles(r: ScreenView["reveal"], votes: number[] | null): void {
  const dist = r ? r.dist : votes;
  const max = dist ? Math.max(1, ...dist) : 1;
  main.querySelectorAll<HTMLElement>("#tiles .tile").forEach((tile, i) => {
    const right = r ? r.counts[i] : false;
    tile.classList.toggle("dim", !!r && !right);
    const side = tile.querySelector<HTMLElement>(".side")!;
    const html = dist ? `${right ? `<span class="mark">${ICON.check}</span>` : ""}<span class="n">${dist[i]}</span>` : "";
    if (side.innerHTML !== html) side.innerHTML = html;
    let fill = tile.querySelector<HTMLElement>(".fill");
    if (!dist) {
      fill?.remove();
      return;
    }
    const width = `${(100 * dist[i]) / max}%`;
    if (!fill) {
      // Grows from nothing at the votes (or at the reveal, from a page that skipped them).
      const f = document.createElement("span");
      f.className = "fill";
      f.style.width = "0";
      tile.appendChild(f);
      requestAnimationFrame(() => requestAnimationFrame(() => (f.style.width = width)));
      fill = f;
    } else fill.style.width = width;
  });
}

/** Font size (em) for the question by its length; smaller when it shares the screen with a picture. */
function questionSize(len: number, withPicture: boolean): number {
  if (withPicture) return len <= 40 ? 3 : len <= 90 ? 2.5 : len <= 160 ? 2.1 : 1.8;
  return len <= 40 ? 3.6 : len <= 90 ? 3 : len <= 160 ? 2.4 : 1.9;
}

/**
 * The question, its picture and the tiles in the room below the bar. The
 * picture goes between the question and the tiles, or beside both: whichever
 * shows it larger, from its shape (known before it has loaded) and the room
 * the question's text leaves. Wide figures such as number lines end up
 * between; square and upright ones beside a short question. Beside needs the
 * question to stay readable in the narrower column, so a long question keeps
 * the picture between.
 */
function layQuestion(stage: HTMLElement, q: NonNullable<ScreenView["question"]>): void {
  if (q.pics) {
    layPictureAnswers(stage, q, q.pics);
    return;
  }
  const n = q.answers.length;
  const longest = Math.max(...q.answers.map((a) => a.length));
  const tileSize = longest <= 12 ? 2.6 : longest <= 30 ? 2 : longest <= 60 ? 1.55 : 1.25;
  const qHtml = `<h2 class="qtext" id="qtext">${lines(q.text)}</h2>`;
  const tilesHtml = `<div class="tiles" id="tiles">${q.answers
    .map((a, i) => `<div class="tile a${i}">${shapeSvg(i)}<span class="txt">${lines(a)}</span><span class="side"></span></div>`)
    .join("")}</div>`;
  const img = q.image;
  if (!img) {
    stage.className = "stage";
    stage.innerHTML = qHtml + tilesHtml;
    fitText($("#qtext"), questionSize(q.text.length, false), window.innerHeight * 0.34);
    fitTiles($("#tiles"), tileSize);
    return;
  }
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const gap = parseFloat(getComputedStyle(stage).rowGap) || 0;
  const aspect = img.w / img.h;
  const figure = (w: number, h: number) =>
    `<div class="figure" id="figure" data-zoom style="width:${Math.floor(w)}px;height:${Math.floor(h)}px">${picImg(img.src, img.w, img.h)}</div>`;

  const between = (): number => {
    stage.className = "stage fig between";
    stage.innerHTML = qHtml + figure(0, 0) + tilesHtml;
    fitText($("#qtext"), questionSize(q.text.length, true), H * 0.3);
    const qh = $("#qtext").offsetHeight;
    // The tiles keep room for their answers: a row of short numbers needs less than a row of sentences.
    const rows = n > 2 ? 2 : 1;
    const tilesMin = rows * H * (longest <= 12 ? 0.135 : longest <= 30 ? 0.16 : 0.2);
    const h = Math.max(40, Math.min(W / aspect, H - qh - tilesMin - 2 * gap, H * 0.62));
    const fig = $("#figure");
    fig.style.width = `${Math.floor(h * aspect)}px`;
    fig.style.height = `${Math.floor(h)}px`;
    fitTiles($("#tiles"), tileSize);
    return h * h * aspect;
  };

  const betweenArea = between();
  // Beside, the picture takes up to 58% of the width, else half; the text
  // must stay readable in the column that leaves, or it's between after all.
  let beside = false;
  for (const share of [0.58, 0.5]) {
    const sideH = Math.min(H, (share * W) / aspect);
    if (sideH * sideH * aspect <= 1.3 * betweenArea) break;
    stage.className = "stage fig beside";
    stage.innerHTML = figure(sideH * aspect, sideH) + `<div class="col">${qHtml}${tilesHtml}</div>`;
    const textSize = fitText($("#qtext"), questionSize(q.text.length, true), H * 0.42);
    const tiles = fitTiles($("#tiles"), tileSize);
    if (textSize >= 1.5 && !tiles.squeezed && tiles.size >= Math.min(tileSize, 1.3)) {
      beside = true;
      break;
    }
  }
  if (!beside && stage.classList.contains("beside")) between();
  fillPictures(stage);
}

/**
 * Pictures as answers (v3 item 1). Each tile shows the picture on the
 * answer's colour, which shows wherever the picture is transparent (the
 * creator's choice: a white ground is drawn into the picture), its shape
 * beside or above the picture, and the room for the votes' count and the
 * tick reserved from the start, so the votes and the reveal move nothing. The tiles are arranged
 * by the pictures' shape (client/answergrid.ts). A question's own picture
 * goes above the tiles: beside the question's text when that leaves it
 * larger, else between text and tiles; the room is shared so that the
 * question's picture and the smallest answer picture come out about alike.
 * A text answer among them ("none of these") takes a picture's place.
 */
function layPictureAnswers(stage: HTMLElement, q: NonNullable<ScreenView["question"]>, pics: (ImageRef | null)[]): void {
  const aspects = pics.map((p) => (p ? p.w / p.h : null));
  const longestText = Math.max(0, ...q.answers.map((a) => a.length));
  const qHtml = `<h2 class="qtext" id="qtext">${lines(q.text)}</h2>`;
  const tilesHtml = `<div class="tiles pics" id="tiles">${q.answers
    .map((a, i) => {
      const p = pics[i];
      const card = p ? picImg(p.src, p.w, p.h) : a ? `<span class="txt">${lines(a)}</span>` : "";
      return `<div class="tile pic a${i} row">${shapeSvg(i)}<div class="apic${p ? "" : " text"}">${card}</div><span class="side"></span></div>`;
    })
    .join("")}</div>`;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const gap = parseFloat(getComputedStyle(stage).rowGap) || 0;

  // What a tile takes around its card, in either orientation: fixed by the tiles' font, not by their size.
  stage.className = "stage picans";
  stage.innerHTML = tilesHtml;
  const tiles = $("#tiles");
  const tileGap = parseFloat(getComputedStyle(tiles).rowGap) || 0;
  const chromeOf = (orient: Orient): Chrome => {
    const t = tiles.querySelector<HTMLElement>(".tile")!;
    t.className = `tile pic a0 ${orient}`;
    const c = t.querySelector<HTMLElement>(".apic")!;
    return { w: t.offsetWidth - c.offsetWidth, h: t.offsetHeight - c.offsetHeight };
  };
  const chrome = { row: chromeOf("row"), col: chromeOf("col") };
  const grid = (h: number) => chooseGrid(aspects, W, Math.max(0, h), tileGap, chrome);

  const img = q.image;
  let best: { html: string; tilesH: number; fit: () => void; score: number } | null = null;
  if (!img) {
    stage.innerHTML = qHtml;
    fitText($("#qtext"), questionSize(q.text.length, true), H * 0.26);
    const tilesH = H - $("#qtext").offsetHeight - gap;
    best = { html: qHtml, tilesH, fit: () => fitText($("#qtext"), questionSize(q.text.length, true), H * 0.26), score: 0 };
  } else {
    const aspect = img.w / img.h;
    const figure = (w: number, h: number) =>
      `<div class="figure" id="figure" data-zoom style="width:${Math.floor(w)}px;height:${Math.floor(h)}px">${picImg(img.src, img.w, img.h)}</div>`;
    // Between: the text, the picture at the full width, the tiles.
    stage.innerHTML = qHtml;
    fitText($("#qtext"), questionSize(q.text.length, true), H * 0.22);
    const qh = $("#qtext").offsetHeight;
    for (const share of [0.22, 0.3, 0.38, 0.46]) {
      const fh = Math.min(W / aspect, H * share);
      const tilesH = H - qh - fh - 2 * gap;
      const score = Math.min(fh * fh * aspect, grid(tilesH).score);
      if (!best || score > best.score)
        best = { html: qHtml + figure(fh * aspect, fh), tilesH, fit: () => fitText($("#qtext"), questionSize(q.text.length, true), H * 0.22), score };
    }
    // Beside: the picture and the text in one band above the tiles, while the text stays readable.
    for (const share of [0.3, 0.38, 0.46]) {
      const bh = H * share;
      const fw = Math.min(bh * aspect, W * 0.55);
      const fh = fw / aspect;
      const tilesH = H - bh - gap;
      const score = Math.min(fh * fh * aspect, grid(tilesH).score);
      if (best && score <= best.score) continue;
      const html = `<div class="qband" style="height:${Math.floor(bh)}px">${figure(fw, fh)}${qHtml}</div>`;
      stage.innerHTML = html;
      const fit = () => fitText($("#qtext"), questionSize(q.text.length, true), bh);
      if (fit() < 1.5 && q.text.length > 40) continue;
      best = { html, tilesH, fit, score };
    }
  }
  const b = best!;
  const g = grid(b.tilesH);
  stage.innerHTML = b.html + tilesHtml;
  b.fit();
  const box = $("#tiles");
  box.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
  box.style.gridTemplateRows = `repeat(${g.rows}, minmax(0, 1fr))`;
  box.style.height = `${Math.floor(b.tilesH)}px`;
  box.querySelectorAll<HTMLElement>(".tile").forEach((t) => {
    t.classList.remove("row", "col");
    t.classList.add(g.orient);
  });
  box.dataset.grid = `${g.cols}x${g.rows} ${g.orient}`;
  fitCardTexts(box, longestText <= 12 ? 2.2 : longestText <= 30 ? 1.7 : 1.3);
  fillPictures(stage);
}

/** A text answer among picture answers: the largest font, from `start` down, that fits its card. */
function fitCardTexts(box: HTMLElement, start: number): void {
  const texts = [...box.querySelectorAll<HTMLElement>(".apic.text .txt")];
  if (texts.length === 0) return;
  let size = start;
  const set = () => texts.forEach((t) => (t.style.fontSize = `${size}em`));
  // A word wider than its card, or lines taller than it.
  const overflows = () => texts.some((t) => t.scrollWidth > t.clientWidth + 1 || t.parentElement!.scrollHeight > t.parentElement!.clientHeight + 1);
  set();
  while (overflows() && size > 0.6) {
    size -= 0.1;
    set();
  }
}

/** Largest font, from `start` down, at which no answer word is cut and no answer overflows its tile. */
function fitTiles(box: HTMLElement, start: number): { size: number; squeezed: boolean } {
  const tiles = [...box.querySelectorAll<HTMLElement>(".tile")];
  const overflows = () =>
    tiles.some((t) => t.scrollHeight > t.clientHeight + 1 || [...t.querySelectorAll<HTMLElement>(".txt")].some((x) => x.scrollWidth > x.clientWidth + 1));
  let size = start;
  box.style.fontSize = `${size}em`;
  while (overflows() && size > 1) {
    size -= 0.1;
    box.style.fontSize = `${size}em`;
  }
  // Still too long at the smallest size: break inside words rather than hide text.
  const squeezed = overflows();
  box.classList.toggle("squeezed", squeezed);
  return { size, squeezed };
}

/** Largest font, from `start` down, that keeps the question within `limit` pixels of height. */
function fitText(el: HTMLElement, start: number, limit: number): number {
  let size = start;
  el.style.fontSize = `${size}em`;
  while (el.scrollHeight > limit && size > 1.1) {
    size -= 0.15;
    el.style.fontSize = `${size}em`;
  }
  return size;
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
  const bg = v.phase === "question" || v.phase === "reveal" ? (v.question?.background ?? null) : v.background;
  let el = document.getElementById("backdrop");
  document.body.classList.toggle("has-backdrop", !!bg);
  if (!bg) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "backdrop";
    el.setAttribute("aria-hidden", "true");
    document.body.prepend(el);
  }
  if (el.dataset.src !== bg.src) {
    el.dataset.src = bg.src;
    el.innerHTML = picImg(bg.src, bg.w, bg.h);
  }
  fillPictures(el);
}

function renderRanking(v: ScreenView): void {
  lobbyKey = "";
  const r = v.ranking;
  if (!r) return;
  const pct = r.given > 0 ? Math.round((100 * r.right) / r.given) : 0;
  const final = v.phase === "final";
  const html = `
    <div class="bar"><span class="grow">${esc(v.title)}</span>${final ? `<span>${ICON.trophy}</span>` : ""}</div>
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
        <div class="bars">${r.perQuestion.map((p) => `<span style="height:${p.given ? (100 * p.right) / p.given : 0}%"></span>`).join("")}</div>
      </div>
    </div>`;
  patch(main, html);
}

/**
 * The bottom line. Steering: ⋯, the code, and the next step. Not steering:
 * the code in a corner, full screen, and ⋯ (steer from here, leave).
 */
function renderBar(v: ScreenView, managing: boolean): void {
  const full = !!document.fullscreenElement;
  let html: string;
  if (managing) {
    html = "";
  } else if (v.steer) {
    const next = nextStep(v.steer);
    const side = sideStep(v.steer);
    html = `<div class="steerbar">
      <button class="btn more" data-menu aria-label="more">⋯</button>
      <span class="grow codeline">${addressAndCode(v.code)}</span><span class="dot" id="dot"></span>
      ${v.steer.remote === "away" ? `<span class="joinchip">Remote gone: another device via ⋯</span>` : ""}
      ${nudgePair(v.steer)}
      ${side ? `<button class="btn" data-step data-act="${side.act}">${side.label}</button>` : ""}
      ${next ? `<button class="btn primary" data-step data-act="${next.act}">${next.label}</button>` : ""}
    </div>`;
  } else {
    html = `<div class="corner">
      ${v.phase === "lobby" ? "" : `<span class="codeline">${addressAndCode(v.code)}</span>`}
      <span class="grow"></span><span class="dot" id="dot"></span>
      ${v.phase === "lobby" && v.remote === "present" ? `<button data-act="swap" type="button">&#8644; Swap</button>` : ""}
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
  if (v.steer) {
    steer.noteStep(v.steer, sbar);
    if (steer.locked()) sbar.querySelectorAll<HTMLButtonElement>("button[data-step]").forEach((b) => (b.disabled = true));
  }
}

// ---------------------------------------------------------------------------
// Acting

function menu(v: ScreenView): void {
  const items: MenuItem[] = v.steer ? steerItems(v.steer, steer, true) : [];
  if (v.question?.image && (v.phase === "question" || v.phase === "reveal")) {
    items.unshift({ label: v.zoom ? "Back to the question (Z)" : "Enlarge the picture (Z)", run: () => toggleZoom() });
  }
  if (v.steer) items.push({ label: "Players", run: () => showPlayers() });
  // ⇄ Swap while both tabs are there: this wall steers, the steering tab shows the quiz.
  if (!v.steer && v.remote === "present") items.push({ label: "&#8644; Swap: steer here, show the quiz on the other device", run: () => void swap() });
  if (v.steer) items.push({ label: "A second device…", run: () => showNote(secondDevice(v)) });
  items.push({ label: "Leave: stop showing the quiz here", run: () => void leave() });
  if (v.steer) items.push({ label: "Delete the quiz…", danger: true, run: () => void steer.run("delete") });
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

/** A short text in a sheet, for the teacher to read and close. */
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

/** ⇄ Swap (docs/after-upload.md §4): no confirmation, the same tap on either device undoes it. */
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
  if (!w) toast("The browser blocked the new window. Allow pop-ups for this site, or open it in another window and type the teacher code.", 8000);
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
    else if (act === "show-join") setLobby("join");
    else if (act === "show-check") setLobby("check");
    else if (act === "second-device") {
      if (view) showNote(secondDevice(view));
    } else if (act === "swap") void swap();
    else void steer.act(el);
  });
}

// Clicker and keyboard: the one key moves the quiz on. Like the buttons,
// it stays inert for a moment after a press: a clicker pressed twice (or a
// bouncing key) would otherwise take two steps once the first one's view is
// back, e.g. Go and straight on to the reveal before anyone could answer.
//
// A stray key must not move the quiz (review C): a teacher leaning on the
// laptop, a shortcut. So no key starts the quiz from the lobby: Start is the
// lobby's button, pressed once while the class is still joining. A key
// held with Ctrl, Alt or the Windows/Cmd key is a shortcut, not a step.
// While a Remote steers, the teacher is on the phone and the laptop's big
// keys (Space, Enter, N) are the likeliest strays; only a clicker's keys
// (PageDown, and the arrows some clickers send) move on from here.
const ADVANCE = new Set([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown", "n", "N"]);
const CLICKER = new Set(["PageDown", "ArrowRight", "ArrowDown"]);
let lastAdvance = 0;
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
  if (!ADVANCE.has(e.key) || e.repeat || !line || !view) return;
  if (view.phase === "lobby" || view.phase === "idle" || (!view.steer && !CLICKER.has(e.key))) return;
  e.preventDefault();
  if (Date.now() - lastAdvance < STEP_LOCK_MS) return;
  lastAdvance = Date.now();
  void line.send({
    op: "advance",
    at: { phase: view.phase, current: view.current, reading: view.phase === "question" && view.question?.answering === "reading", votes: view.phase === "question" && !!view.votes },
  });
});

/** The question's picture over the whole screen, or back. */
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
