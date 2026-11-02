// The Projector: what the class sees (docs/user-flow.md §3.3, §3.4). No key
// before the reveal. While no Remote is there it steers itself: in the lobby
// it is the teacher's lobby (join box on top, questions below the fold), and
// during the quiz a slim bar carries the next step. A clicker or the keyboard
// moves the quiz on at any time; the quiz's code stays in a corner throughout.

import qrcode from "qrcode-generator";
import type { ScreenView, ServerMessage } from "../shared/protocol.ts";
import { $, esc, keepAwake, lines, rolePage, siteAddress, statusDot, tabRole, type HeldRole } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg } from "./look.ts";
import { Steer, addressAndCode, answersBlock, live, newUI, nextStep, openMenu, patch, playersRow, questionList, sideStep, steerItems, toast, type MenuItem } from "./manage.ts";
import { Line } from "./net.ts";

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
    if (before && before.remote !== view.remote) {
      if (view.remote === "present") toast("Remote connected");
      // On the wall: nothing here invites the class to the teacher's page.
      else if (before.remote === "present") toast("Remote gone – steering here", 8000);
    }
    // Whether the Remote's tab is still there changes with time, not with an event: ask now and then.
    clearInterval(tickTimer);
    if (view.remote === "present") {
      tickTimer = window.setInterval(() => {
        if (line) void line.send({ op: "tick" });
      }, 15_000);
    }
    render();
  } else if (m.t === "role") {
    // Another tab took the Projector: this one steers from now on.
    line?.stop();
    tabRole.set(instance, { role: m.role, token: m.token, code: held!.code });
    location.replace(rolePage(instance, m.role));
  } else if (m.t === "lost") {
    line?.stop();
    tabRole.remove(instance);
    location.replace(`/teacher#${held!.code}`);
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
  }
  const managing = !!v.steer && v.phase === "lobby";
  document.body.classList.toggle("manage", managing);
  document.body.classList.toggle("steering", !!v.steer && !managing);
  if (v.phase !== "question" && v.phase !== "reveal") questionKey = "";
  if (managing) renderManagedLobby(v);
  else if (v.phase === "lobby") renderLobby(v);
  else if ((v.phase === "question" || v.phase === "reveal") && v.question) renderQuestion(v);
  else if (v.phase === "ranking" || v.phase === "final") renderRanking(v);
  renderBar(v, managing);
  renderFix(v);
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
}

function qrSvg(code: string): string {
  const qr = qrcode(0, "M");
  qr.addData(`${location.origin}/#${code}`);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

/** How a phone or another screen joins the teacher's side. */
function deviceHelp(): string {
  return `Your phone or another screen: open <strong>${esc(siteAddress())}/teacher</strong>, type the code, choose <strong>Remote</strong> or <strong>Projector</strong>.`;
}

/**
 * The lobby while this screen steers: the class's part on top and large,
 * laid out like the class lobby; the Start button and the teacher's
 * questions below it (item 19). On a mirrored laptop all of it is on the
 * wall, so the line on how to steer from a phone shows only until the first
 * student is in: after that it would invite the class to the teacher's page
 * (backlog item 18, "children accidentally taking the remote"). It stays in ⋯.
 */
function renderManagedLobby(v: ScreenView): void {
  lobbyKey = "";
  const t = v.steer!;
  const n = v.players.length;
  const devices =
    t.remote === "present"
      ? `<p class="device ok">Remote connected ✓</p>`
      : n === 0
        ? `<p class="device twoscreens"><button class="btn" data-act="projector-window">Two screens? Open the projector window</button></p>
           <p class="device">${deviceHelp()}</p>`
        : "";
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
          ${playersRow(t, true)}
        </div>
      </div>
      <div class="mstart"><button class="btn primary big" data-step data-act="begin">Start quiz &#9654;</button>${devices}</div>
    </div>
    <div class="mbelow">
      ${questionList(t, steer.ui)}
      <p class="mfoot"><button class="btn" data-menu>⋯ More</button></p>
    </div>
  </div>`;
  patch(main, html);
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
        </div>
      </div>`;
  }
  // Add newcomers without redrawing everyone, so each pops in once.
  const crowd = $("#crowd");
  const present = new Set(v.players.map((p) => p.id));
  for (const el of [...crowd.children] as HTMLElement[]) if (!present.has(el.dataset.id!)) el.remove();
  const shown = new Set(([...crowd.children] as HTMLElement[]).map((el) => el.dataset.id));
  for (const p of v.players) {
    if (shown.has(p.id)) continue;
    const d = document.createElement("div");
    d.className = "av";
    d.dataset.id = p.id;
    d.innerHTML = avatarSvg(p.avatar);
    crowd.appendChild(d);
  }
  $("#count").textContent = String(v.players.length);
}

let questionKey = "";
function renderQuestion(v: ScreenView): void {
  lobbyKey = "";
  const q = v.question!;
  const r = v.reveal;
  // While answers come in only the count changes; redrawing the question
  // each time would make it flicker on a slow laptop. The fit depends on the
  // room the bar leaves, so it is part of the key.
  const key = JSON.stringify([v.phase, q, r, !!v.steer]);
  const counter = main.querySelector("#answered");
  if (key === questionKey && counter) {
    counter.textContent = `${v.answered} / ${v.players.length}`;
    return;
  }
  questionKey = key;
  delete main.dataset.skeleton;
  const max = r ? Math.max(1, ...r.dist) : 1;
  const longest = Math.max(...q.answers.map((a) => a.length));
  const tileSize = longest <= 12 ? 2.6 : longest <= 30 ? 2 : longest <= 60 ? 1.55 : 1.25;
  // The mark and count have their place at the right of every tile from the
  // start, so the reveal adds them without moving the answer text.
  main.innerHTML = `
    <div class="bar">
      <span>${q.n} / ${q.total}</span><span class="grow"></span>
      ${r && r.void ? `<span class="voided">${ICON.void}</span>` : ""}
      <span>${ICON.person} <span id="answered">${v.answered} / ${v.players.length}</span></span>
    </div>
    <h2 class="qtext" id="qtext">${lines(q.text)}</h2>
    <div class="tiles" id="tiles">
      ${q.answers
        .map((a, i) => {
          const right = r ? r.counts[i] : false;
          const dim = r && !right ? " dim" : "";
          return `<div class="tile a${i}${dim}">
            ${shapeSvg(i)}<span class="txt">${lines(a)}</span>
            <span class="side">${r ? `${right ? `<span class="mark">${ICON.check}</span>` : ""}<span class="n">${r.dist[i]}</span>` : ""}</span>
            ${r ? `<span class="fill" style="width:${(100 * r.dist[i]) / max}%"></span>` : ""}
          </div>`;
        })
        .join("")}
    </div>`;
  fitText($("#qtext"), q.text.length);
  fitTiles($("#tiles"), tileSize);
}

/** Largest font, from `start` down, at which no answer word is cut and no answer overflows its tile. */
function fitTiles(box: HTMLElement, start: number): void {
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
  box.classList.toggle("squeezed", overflows());
}

/** Largest font that keeps the question within its box. */
function fitText(el: HTMLElement, len: number): void {
  let size = len <= 40 ? 3.6 : len <= 90 ? 3 : len <= 160 ? 2.4 : 1.9;
  el.style.fontSize = `${size}em`;
  const limit = window.innerHeight * 0.34;
  while (el.scrollHeight > limit && size > 1.1) {
    size -= 0.15;
    el.style.fontSize = `${size}em`;
  }
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
              <div>${ICON.star} ${e.score} / ${r.of}</div>
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
      ${side ? `<button class="btn" data-step data-act="${side.act}">${side.label}</button>` : ""}
      ${next ? `<button class="btn primary" data-step data-act="${next.act}">${next.label}</button>` : ""}
    </div>`;
  } else {
    html = `<div class="corner">
      ${v.phase === "lobby" ? "" : `<span class="codeline">${addressAndCode(v.code)}</span>`}
      <span class="grow"></span><span class="dot" id="dot"></span>
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
  if (v.steer) items.push({ label: "Players", run: () => showPlayers() });
  if (!v.steer) items.push({ label: "Steer from here", run: () => void steerHere() });
  else {
    // Once students are in, no new tab gets the steering (decisions.md).
    if (v.players.length === 0) items.push({ label: "Steer from your phone…", run: () => showNote(deviceHelp()) });
    if (v.phase === "lobby") items.push({ label: "Two screens: open the projector window", run: () => projectorWindow() });
  }
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
    if ((e.target as HTMLElement).closest("[data-close]") || e.target === back) back.remove();
  });
  document.body.appendChild(back);
}

async function steerHere(): Promise<void> {
  if ((view?.players.length ?? 0) > 0 && !confirm("Steer from here? The remote stops steering, and while students are in it can't take the steering back.")) return;
  const r = await line?.send({ op: "steerHere" });
  if (r && !r.ok && r.error) toast(r.error);
}

async function leave(): Promise<void> {
  if (!confirm("Stop showing the quiz on this screen?")) return;
  await line?.send({ op: "leave" });
  line?.stop();
  tabRole.remove(instance);
  location.replace("/");
}

/** Two screens: a new window takes the Projector, and this tab becomes the Remote. */
function projectorWindow(): void {
  const w = window.open(`/teacher?role=screen#${held!.code}`, "_blank", "popup,width=1280,height=720");
  if (!w) toast("The browser blocked the new window. Allow pop-ups for this site, or open the code in another window and choose Projector.", 8000);
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
    if (el.dataset.act === "projector-window") {
      projectorWindow();
      return;
    }
    void steer.act(el);
  });
}

// Clicker and keyboard: the one key moves the quiz on.
const ADVANCE = new Set([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown", "n", "N"]);
document.addEventListener("keydown", (e) => {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === "f" || e.key === "F") {
    toggleFullscreen();
    return;
  }
  // Space or Enter on a focused button is that button's click.
  if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
  if (!ADVANCE.has(e.key) || e.repeat || !line || !view) return;
  e.preventDefault();
  void line.send({ op: "advance", at: { phase: view.phase, current: view.current } });
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
});

start();
