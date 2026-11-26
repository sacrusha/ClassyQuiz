// The Projector: what the class sees. While no Remote is there it steers itself.

import qrcode from "qrcode-generator";
import type { ImageRef, ScreenView, ServerMessage, TeacherView } from "../shared/protocol.ts";
import { CLASS_WAITING } from "../shared/limits.ts";
import { $, arrangement, esc, keepAwake, lines, rolePage, siteAddress, statusDot, tabHadRemote, tabLobby, tabRole, teacherCode, teacherEntry, type Arrangement, type HeldRole } from "./dom.ts";
import { ICON, avatarSvg, syncAvatars } from "./look.ts";
import { Steer, roomNotice, addressAndCode, answersBlock, live, newUI, openMenu, patch, playersRow, questionList, shareSwitch, speedSwitch, steerItems, syncCrowd, toast, type MenuItem } from "./manage.ts";
import { Presses, atOf, fitLabels, startButton, steeringButtons, type StepState } from "./steps.ts";
import { edgeBar } from "./clock.ts";
import { finalHtml, fitFinal } from "./final.ts";
import { Line } from "./net.ts";
import { fillPictures, load, picImg, preload } from "./pictures.ts";
import { backdrop, endJump, jump, layQuestion, markTiles } from "./stage.ts";
import { LINE_WORDS, SITE, T, lang, said } from "./room-text.ts";

const main = $("main");
const sbar = $("#sbar");
document.documentElement.lang = lang;
document.title = `classyQuiz · ${T.projector}`;

const params = new URLSearchParams(location.search);
const instance = params.get("q") ?? "";
const held: HeldRole | null = instance ? tabRole.get(instance) : null;
/** Opened by "Open the projector window": say where it goes. */
const dragHint = params.get("drag") === "1";

let line: Line | null = null;
let view: ScreenView | null = null;
let lastBar = "";
let wasFull = false;
let tickTimer: number | undefined;
let lobbyScreen: "check" | "join" = instance ? tabLobby.get(instance) : "join";
let arranged: Arrangement = arrangement.get();
/** A run that ends without a Remote sets the browser's arrangement to One screen. */
let hadRemote = instance ? tabHadRemote.get(instance) : false;
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
    words: LINE_WORDS,
    auth: () => ({ role: "screen", token: held.token }),
    onMessage,
    onStatus: (s) => {
      const d = document.getElementById("dot");
      if (d) statusDot(d, s, T.status);
    },
  });
  line.start();
}

function onMessage(m: ServerMessage): void {
  if (m.t === "state" && m.view.role === "screen") {
    const before = view;
    view = m.view;
    if (view.question?.image) void load(view.question.image.src, true);
    preload(view.pictures);
    // A wall that takes the steering back in the lobby (its steering tab left
    // or went away) keeps showing the class's screen, not the check.
    if (before && !before.steer && view.steer && view.phase === "lobby" && !view.waiting) setLobby("join", false);
    // How the screens are arranged, learnt from what happens: a Remote,
    // before this tab or after it, means a second device; a run that reached
    // its end without one, one screen. Only as the Remote comes, so a tap on
    // One screen while it is away holds.
    const firstRemote = view.remote !== "none" && !hadRemote;
    if (firstRemote) {
      hadRemote = true;
      tabHadRemote.set(instance);
    }
    if (firstRemote || (view.remote === "present" && before?.remote !== "present")) arrange("remote", false);
    else if (view.phase === "final" && before?.phase !== "final" && !hadRemote) arrange("one", false);
    if (before && before.remote !== view.remote) {
      if (view.remote === "present") toast(T.remoteConnected);
      // On the wall: nothing here invites the class to the teacher's page.
      else if (before.remote === "present") toast(T.remoteGoneHere, 8000);
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
    edgeBar("", null);
    main.innerHTML = `<div class="center"><p style="font-size:1.6em">${esc(said(m.reason))}</p><p><a class="btn primary" href="/">${esc(siteAddress())}</a></p></div>`;
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

function teacherDigits(): string {
  return view?.teacher || held?.teacher || "";
}

function comeBack(): string {
  const d = teacherDigits();
  return d ? teacherEntry(held!.code, d) : `/teacher#${held!.code}`;
}

function secondDevice(v: ScreenView): string {
  return `${T.secondDevice(esc(siteAddress()), esc(teacherCode(v.code, v.teacher)))}<span class="twoscreens">${T.secondDeviceWindow(`<button class="link" data-act="projector-window">${T.newWindowLink}</button>`)}</span>`;
}

function checkHowTo(v: ScreenView): string {
  return `${T.checkHowTo(esc(siteAddress()), esc(teacherCode(v.code, v.teacher)))}<span class="twoscreens">${T.checkHowToWindow(`<button class="link" data-act="projector-window">${T.newWindowLink}</button>`)}</span>`;
}

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

function arrange(a: Arrangement, draw = true): void {
  // Written even when this page already has it: another tab of the browser may have set the other.
  arrangement.set(a);
  if (arranged === a) return;
  arranged = a;
  if (draw) render();
}

function arrangeOption(a: Arrangement, name: string, line: string): string {
  return `<button class="arrange-opt" type="button" data-act="arrange" data-to="${a}" aria-pressed="${arranged === a}"><strong>${name}</strong><small>${line}</small></button>`;
}

function renderCheck(v: ScreenView): void {
  const t = v.steer!;
  const n = v.players.length;
  const nq = t.questions.length;
  // A Remote that was here and went: the how-to to bring it back, whatever the toggle says.
  const howTo = arranged === "remote" || t.remote === "away";
  const gone = t.remote === "away" ? `${T.remoteGone}. ` : "";
  const html = `<div class="check">
    <div class="checkhead">
      <h1 class="ctitle counted">${lines(v.title || "Quiz")} <span class="cnum">${T.questions(nq)}</span></h1>
      <p class="classcode">${T.joinCode} <strong>${esc(v.code)}</strong>${n > 0 ? ` <span class="joinedn">${ICON.person}${live("joined", n)}</span>` : ""}</p>
    </div>
    ${roomNotice(t)}
    <h2 class="arrange-ask">${T.arrangeAsk}</h2>
    <div class="arrange" role="group" aria-label="${T.arrangeAsk}">
      ${arrangeOption("one", T.oneScreen, T.oneScreenLine)}
      ${arrangeOption("remote", T.screenAndRemote, T.screenAndRemoteLine)}
    </div>
    ${howTo ? `<p class="device cline">${gone}${checkHowTo(v)}</p>` : ""}
    <p class="arrange-call">${T.videoCall}</p>
    <p class="device cshare">${shareSwitch(t)}</p>
    <p class="cstart"><button class="btn primary big" data-act="show-join">${T.letIn}&nbsp;&#9654;</button></p>
    ${questionList(t, steer.ui)}
    <p class="mfoot"><button class="btn" data-menu>${T.moreMenu}</button></p>
  </div>`;
  patch(main, html);
  fillPictures(main);
  steer.noteStep(t);
}

const NOBODY_MS = 90_000;
/** The wait for the first avatar counts across ‹ Back and the join screen again. */
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

function howTo(code: string): string {
  return `<div class="howto" aria-hidden="true"><div class="scr">
    <div class="url">${esc(siteAddress())}</div>
    <div class="hdr"><span class="logo"><img class="s32" src="/brand/classyquiz-horizontal-32.svg" alt="" width="134" height="32" loading="lazy"><img class="master" src="/brand/classyquiz-horizontal-colour.svg" alt="" width="935" height="256" loading="lazy"></span><span class="box">${esc(code)}</span><span class="go">&#9654;</span></div>
    <div class="page"><i></i><i></i><i></i></div>
  </div></div>`;
}

/**
 * The full drawing from 48 px, which beside a pages.dev address the mark
 * reaches on a 1920 x 1080 wall; the drawing for 24 to 47 px below that.
 * --chars is the address's length plus the mark's room.
 */
function joinAddress(): string {
  return `<div class="addr" style="--chars:${siteAddress().length + 3}"><picture><source media="(min-width: 1600px) and (min-height: 960px)" srcset="/brand/classyquiz-symbol-colour.svg"><img class="mark" src="/brand/classyquiz-symbol-32.svg" alt="" width="32" height="32"></picture>${esc(siteAddress())}</div>`;
}

function nobodyLine(): string {
  return T.nobodyYet(esc(siteAddress()), `<a href="/check#it" target="_blank" rel="noopener">${esc(SITE.whatToTellIt)}</a>`);
}

function renderJoin(v: ScreenView): void {
  const t = v.steer!;
  const n = v.players.length;
  // With the first join refused for want of room, the notice says why nobody is in.
  const nobody = nobodyYet(v);
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
          ${roomNotice(t) || (nobody ? `<p class="nobody">${nobodyLine()}</p>` : "")}
        </div>
      </div>
      <div class="mstart">${startButton("big", 'data-act="begin"', `${T.startQuiz}&nbsp;&#9654;`, !!t.starts)}
        <p class="device">${speedSwitch(t)}</p>
        <p class="joinnav"><button class="link" data-act="show-check">${T.backToCheck}</button>
          ${arranged === "remote" || t.remote === "away" ? `<button class="link" data-act="second-device">${t.remote === "away" ? T.remoteGoneSecond : T.secondDeviceLink}</button>` : ""}
          <button class="link" data-menu aria-label="${T.more}">⋯</button></p>
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
      <div class="center"><p class="muted">${esc(said(CLASS_WAITING))}</p></div>`;
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
  // picture moves or flickers. The fit depends on the room the bar leaves
  // and on the window's size, so both are part of the key.
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

/** The avatars are sized for the whole class, so they don't shrink as the answers come in. */
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

function stripSize(n: number, w: number, h: number): number {
  const gap = 4;
  for (let s = Math.floor(h); s >= 8; s--) {
    const perRow = Math.max(1, Math.floor((w + gap) / (s + gap)));
    const rows = Math.ceil(n / perRow);
    if (rows * s + (rows - 1) * gap <= h) return s;
  }
  return 8;
}

/** Once per key: a view that comes again (a tick, a reconnect) doesn't restart the jump; a fix of the key does. */
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

/** Drawn again only when it starts, stops or runs out; in between, CSS drains it. */
function renderClock(v: ScreenView): void {
  if (v.phase === "lobby") {
    edgeBar("start", v.starts);
    return;
  }
  const q = v.phase === "question" ? v.question : null;
  edgeBar(`${q?.q}|${q?.clock?.leftMs === 0}`, q?.clock ?? null);
}

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

function renderBar(v: ScreenView, managing: boolean): void {
  const full = !!document.fullscreenElement;
  let html: string;
  if (managing) {
    html = "";
  } else if (v.steer) {
    html = `<div class="steerbar">
      <button class="btn more" data-menu aria-label="${T.more}">⋯</button>
      <span class="grow codeline">${v.phase === "final" ? "" : addressAndCode(v.code)}</span><span class="dot" id="dot"></span>
      ${v.steer.remote === "away" ? `<span class="joinchip">${T.remoteGone}</span>` : ""}
      ${steeringButtons(v.steer)}
    </div>`;
  } else {
    html = `<div class="corner">
      ${v.phase === "lobby" ? "" : `<span class="codeline">${addressAndCode(v.code)}</span>`}
      <span class="grow"></span><span class="dot" id="dot"></span>
      ${v.phase === "lobby" && v.remote === "present" ? `<button data-act="swap" type="button">${T.swapScreens}</button>` : ""}
      ${full ? "" : `<button data-full type="button">${T.fullScreen}</button>`}
      <button data-menu type="button" aria-label="${T.more}">⋯</button>
    </div>`;
  }
  // Until the window has been full screen once (it is on the projector then).
  if (full) wasFull = true;
  if (dragHint && !full && !wasFull && !v.steer) {
    html += `<div class="drag-hint">${T.dragHint}</div>`;
  }
  if (html !== lastBar) {
    lastBar = html;
    sbar.innerHTML = html;
    fitLabels(sbar);
  }
  if (v.steer) steer.noteStep(v.steer);
  else wallPresses.noteView(screenState(v));
}

function menu(v: ScreenView): void {
  const items: MenuItem[] = v.steer ? steerItems(v.steer, steer, true) : [];
  if (v.question?.image && (v.phase === "question" || v.phase === "reveal")) {
    items.unshift({ label: v.zoom ? T.zoomBack : T.zoomIn, run: () => toggleZoom() });
  }
  if (v.steer) items.push({ label: T.players, run: () => showPlayers() });
  // ⇄ Swap: this wall steers, the steering tab shows the quiz.
  if (!v.steer && v.remote === "present") items.push({ label: T.swapHere, run: () => void swap() });
  if (v.steer) items.push({ label: T.secondDeviceMenu, run: () => showNote(secondDevice(v)) });
  items.push({ label: T.stopShowing, run: () => void leave() });
  if (v.steer && v.phase !== "final") items.push({ label: T.deleteQuiz, danger: true, run: () => void steer.run("delete") });
  openMenu(items);
}

function showPlayers(): void {
  const t = view?.steer;
  if (!t) return;
  document.querySelector(".sheet-back")?.remove();
  const back = document.createElement("div");
  back.className = "sheet-back";
  back.innerHTML = `<div class="sheet players-sheet"><p class="hint">${T.playersHint}</p>
    ${playersRow(t, true)}<button class="cancel" data-close>${T.close}</button></div>`;
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
  back.innerHTML = `<div class="sheet"><p>${html}</p><button class="cancel" data-close>${T.close}</button></div>`;
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

/** No confirmation: the same tap on either device undoes it. */
async function swap(): Promise<void> {
  const r = await line?.send({ op: "swap" });
  if (r && !r.ok && r.error) toast(said(r.error));
}

async function leave(): Promise<void> {
  // The single tab with the class in: nothing steers after this, until a device comes in with the teacher code.
  const last = !!view?.steer && view.players.length > 0;
  if (!confirm(last && view ? T.confirmStopShowingLast(siteAddress(), teacherCode(view.code, view.teacher)) : T.confirmStopShowing)) return;
  await line?.send({ op: "leave" });
  line?.stop();
  tabRole.remove(instance);
  location.replace("/");
}

function projectorWindow(): void {
  const w = window.open(teacherEntry(held!.code, teacherDigits(), "?win=1"), "_blank", "popup,width=1280,height=720");
  if (!w) toast(T.popupBlocked(teacherCode(held!.code, teacherDigits())), 8000);
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

// No key starts the quiz from the lobby: a stray key (a teacher leaning on
// the laptop) must not move it while the class is still joining. While a
// Remote steers, the laptop's big keys (Space, Enter, N) are the likeliest
// strays; only a clicker's keys move on from here.
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
    if (!r.ok && r.error) toast(said(r.error));
  });
}
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
  fitLabels(sbar);
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
