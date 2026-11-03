// The Remote: the teacher's own view for steering, usually on the phone, or
// the laptop's screen when the projector is a second window
// (docs/user-flow.md §3.3, §3.5). One card and the steering bar (Last call,
// Play); everything else is in the ⋯ menu.

import type { ServerMessage, TeacherView } from "../shared/protocol.ts";
import { $, esc, keepAwake, lines, rolePage, siteAddress, statusDot, tabRole, teacherCode, teacherEntry, type HeldRole } from "./dom.ts";
import { ICON, avatarSvg } from "./look.ts";
import { Steer, answersBlock, live, newUI, openMenu, patch, playersRow, questionList, speedSwitch, syncCrowd, steerItems, thumb, toast, type MenuItem } from "./manage.ts";
import { steeringButtons } from "./steps.ts";
import { clockBar, localEnd } from "./clock.ts";
import { Line } from "./net.ts";
import { fillPictures } from "./pictures.ts";

const main = $("#main");
const actions = $("#actions");
const dot = $("#dot");

const instance = new URLSearchParams(location.search).get("q") ?? "";
const held: HeldRole | null = instance ? tabRole.get(instance) : null;

let line: Line | null = null;
let view: TeacherView | null = null;
/** Panels the teacher opened from ⋯ during the quiz. */
let showAll = false;
let showPlayers = false;
let lastButtons = "";
const steer = new Steer(() => line, () => view, newUI(), () => render());

function start(): void {
  if (!held || held.role !== "remote") {
    location.replace(held ? rolePage(instance, held.role) : "/");
    return;
  }
  keepAwake();
  line = new Line({
    instance,
    auth: () => ({ role: "remote", token: held.token }),
    onMessage,
    onStatus: (s) => statusDot(dot, s),
  });
  line.start();
  // Whether the projector's tab is still there changes with time, not with
  // an event: ask now and then.
  window.setInterval(() => {
    if (line && document.visibilityState === "visible") void line.send({ op: "tick" });
  }, 20_000);
}

function onMessage(m: ServerMessage): void {
  if (m.t === "state" && m.view.role === "teacher") {
    view = m.view;
    render();
  } else if (m.t === "role") {
    // ⇄ Swap, from here or from the wall: this tab shows the quiz now.
    line?.stop();
    tabRole.set(instance, { role: m.role, token: m.token, code: held!.code, teacher: teacherDigits() });
    location.replace(rolePage(instance, m.role));
  } else if (m.t === "lost") {
    // Another device took the steering while this one was away: back in with the teacher code.
    line?.stop();
    tabRole.remove(instance);
    const d = teacherDigits();
    location.replace(d ? teacherEntry(held!.code, d) : `/teacher#${held!.code}`);
  } else if (m.t === "gone") {
    line?.stop();
    tabRole.remove(instance);
    actions.innerHTML = "";
    main.innerHTML = `<div class="card"><p>${esc(m.reason)}</p><p><a class="btn primary" href="/">${esc(siteAddress())}</a></p></div>`;
  }
}

// ---------------------------------------------------------------------------

function render(): void {
  const v = view;
  if (!v) return;
  $("#title").textContent = v.title || "Quiz";
  document.title = `${v.title || "Quiz"} · remote`;
  $("#code").textContent = v.code;
  $("#pos").textContent = v.run && (v.phase === "question" || v.phase === "reveal" || v.phase === "ranking") ? `${v.run.n}/${v.run.total}` : "";

  let body = "";
  if (v.phase === "lobby") body = lobby(v);
  else if (v.phase === "question" || v.phase === "reveal") body = current(v);
  else if (v.phase === "ranking" || v.phase === "final") body = ranking(v);
  if (v.phase !== "lobby") {
    if (v.screen !== "present") body += projectorLine(v);
    if (showPlayers) body += playersPanel(v);
    if (showAll) body += questionList(v, steer.ui);
  }
  patch(main, body);
  syncCrowd(main, v);
  fillPictures(main);
  renderClock(v);

  // The steering bar: Last call and Play, the same size and in the same place throughout (steps.ts).
  const buttons = `<div class="wrap steerbtns">
    <button class="btn more" data-menu aria-label="more">⋯</button>
    ${steeringButtons(v)}
  </div>`;
  if (buttons !== lastButtons) {
    lastButtons = buttons;
    actions.innerHTML = buttons;
  }
  steer.noteStep(v);
}

/** The teacher code's two digits: the view's, else what the tab was given. */
function teacherDigits(): string {
  return view?.teacher || held?.teacher || "";
}

/**
 * The steering tab's lobby is the check (docs/after-upload.md §3): the class
 * code, count and avatars, points for speed, the teacher code at rest, ⇄ Swap while
 * the wall is there, and the questions; Start in the bar below.
 */
function lobby(v: TeacherView): string {
  const n = v.run?.players.length ?? 0;
  const projector =
    v.screen === "present"
      ? `<p class="device"><span class="ok">Projector ✓</span> · <button class="link" data-act="swap">&#8644; Swap</button></p><p class="device">${secondDevice(v)}</p>`
      : projectorLine(v);
  return `<section class="joinbox">
      <div class="addr">${esc(siteAddress())}</div>
      <div class="codebig">${esc(v.code)}</div>
      <div class="joined">${live("joined", n)} joined</div>
      <div class="avatars" data-crowd></div>
      <p class="device">${speedSwitch(v)}</p>
    </section>
    ${projector}
    ${questionList(v, steer.ui)}`;
}

/** The teacher code at rest, in the sentence the wall's check uses. */
function secondDevice(v: TeacherView): string {
  return `A second device, to steer from or to show the quiz on: on <strong>${esc(siteAddress())}</strong>, type <strong>${esc(teacherCode(v.code, v.teacher))}</strong>.`;
}

/**
 * How to bring the projector (back): the teacher code on the projector
 * computer, which takes the free wall without asking; or, on the two-screen
 * laptop whose projector window got closed, that window again. During the
 * quiz it says the projector is gone.
 */
function projectorLine(v: TeacherView): string {
  const gone = v.phase === "lobby" ? "" : "Projector gone. ";
  return `<p class="device">${gone}On the projector computer: on <strong>${esc(siteAddress())}</strong>, type <strong>${esc(teacherCode(v.code, v.teacher))}</strong>.<span class="twoscreens"> Or <button class="link" data-act="projector-window">open the projector window</button> here.</span></p>`;
}

function current(v: TeacherView): string {
  const run = v.run!;
  const q = v.questions[v.current];
  // Of the devices that are there, or that answered and went away since.
  const counted = run.players.filter((p) => p.connected || p.answered);
  const present = counted.length;
  const away = run.players.length - present;
  // The last few the class waits for: the teacher's to see, not the wall's (v2 item 7).
  const waiting = v.phase === "question" && v.answering === "open" ? counted.filter((p) => !p.answered) : [];
  const waitLine =
    waiting.length > 0 && waiting.length <= 6 && run.answered > 0
      ? `<p class="waiting">Waiting for <span class="avatars">${waiting.map((p) => `<span>${avatarSvg(p.avatar)}</span>`).join("")}</span></p>`
      : "";
  // The picture, so a teacher whose projector died can still show it around;
  // and the button that puts it over the whole projector screen.
  const pic = q.image
    ? `<div class="curpic">${thumb(q.image, q.pictureHidden ? "hidden" : "")}
        ${
          q.pictureHidden
            ? `<p class="hint">Hidden from the projector.</p>`
            : `<button class="btn" data-act="zoom">${v.zoom ? "Back to the question on the projector" : "Enlarge on the projector"}</button>`
        }</div>`
    : "";
  return `<section class="card current">
    <div class="qt">${lines(q.text)}</div>
    ${pic}
    ${q.void ? `<p class="hint">Void: counts for nobody.</p>` : ""}
    ${stepLine(v)}
    ${answersBlock(q, v.current, steer.ui, run.dist)}
    <p class="answered"><strong>${live("answered", run.answered)}</strong> of ${live("present", present)} answered${away ? ` · ${live("away", away)} away` : ""}</p>
    ${waitLine}
  </section>`;
}

/**
 * Where the question is, above the answers (backlog v4 item 6): its answers
 * hidden while the class reads, Last call draining in its slot (see
 * renderClock), or locked in with the spread on the wall.
 */
function stepLine(v: TeacherView): string {
  if (v.phase !== "question") return "";
  if (v.answering === "reading") return `<p class="hint">The answers are hidden: the class reads the question.</p>`;
  if (v.votes) return `<p class="hint">Locked in. The spread is on the wall, without the right answer.</p>`;
  return v.clock ? `<p class="hint lastcall-line">${ICON.timer} Last call</p><div class="clockslot"></div>` : "";
}

/** Last call in its slot, drawn again only when it starts: CSS drains it. */
function renderClock(v: TeacherView): void {
  const slot = main.querySelector<HTMLElement>(".clockslot");
  if (!slot || !v.clock) return;
  const key = `${v.current}|${v.clock.ms}|${v.clock.leftMs === 0}`;
  if (slot.dataset.key === key) return;
  slot.dataset.key = key;
  slot.innerHTML = clockBar(v.clock.ms, localEnd(`${v.current}|${v.clock.ms}`, v.clock));
}

function ranking(v: TeacherView): string {
  const r = v.run?.ranking;
  if (!r) return "";
  const pct = r.given ? Math.round((100 * r.right) / r.given) : 0;
  return `<section class="card">
    <div class="stat">${pct}%</div><p class="muted">right · ${r.of} ${r.of === 1 ? "question" : "questions"}</p>
    <div class="avatars">${r.top.map((e) => `<span class="ranked">${avatarSvg(e.avatar)}<small>${e.place}.</small></span>`).join("")}</div>
  </section>`;
}

function playersPanel(v: TeacherView): string {
  return `<section class="card"><div class="row spread"><strong>Players</strong><button class="link" data-act="close-players">Close</button></div>
    <p class="hint">Faded ones are away; they come back by themselves. Tap one to remove it, e.g. a double.</p>
    ${playersRow(v, true)}</section>`;
}

function menu(v: TeacherView): void {
  const items: MenuItem[] = steerItems(v, steer);
  if (v.phase !== "lobby") {
    items.push({ label: showAll ? "Hide the questions" : "All questions", run: () => ((showAll = !showAll), render()) });
    items.push({ label: "Players", run: () => ((showPlayers = true), render()) });
  }
  // ⇄ Swap while the wall is there: a wrong answer to the second device's question, undone from either.
  if (v.screen === "present") items.push({ label: "&#8644; Swap: show the quiz here, steer from the other device", run: () => void swap() });
  else items.push({ label: "A second device…", run: () => toast(`On ${siteAddress()}, type ${teacherCode(v.code, v.teacher)}.`, 8000) });
  items.push({ label: "Stop being the remote", run: () => void leave() });
  items.push({ label: "Delete the quiz…", danger: true, run: () => void steer.run("delete") });
  openMenu(items);
}

/** ⇄ Swap (docs/after-upload.md §4): no confirmation, the same tap on either device undoes it. */
async function swap(): Promise<void> {
  const r = await line?.send({ op: "swap" });
  if (r && !r.ok && r.error) toast(r.error);
}

async function leave(): Promise<void> {
  const back = view ? ` To steer again: on ${siteAddress()}, type ${teacherCode(view.code, view.teacher)}.` : "";
  if (!confirm(`Stop steering from this device? The projector steers again.${back}`)) return;
  await line?.send({ op: "leave" });
  line?.stop();
  tabRole.remove(instance);
  location.replace("/");
}

for (const area of [main, actions]) {
  area.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-menu]")) {
      if (view) menu(view);
      return;
    }
    const el = t.closest<HTMLElement>("[data-act]");
    if (!el) return;
    if (el.dataset.act === "projector-window") {
      // A second monitor: the window takes the free Projector; this tab stays the Remote.
      const w = window.open(teacherEntry(held!.code, teacherDigits(), "?win=1"), "_blank", "popup,width=1280,height=720");
      if (!w) toast("The browser blocked the new window. Allow pop-ups for this site, or open it in another window and type the teacher code.", 8000);
      return;
    }
    if (el.dataset.act === "swap") {
      void swap();
      return;
    }
    if (el.dataset.act === "close-players") {
      showPlayers = false;
      render();
      return;
    }
    void steer.act(el);
  });
}

start();
