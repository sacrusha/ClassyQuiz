// The Remote: the teacher's own view for steering, usually on the phone, or
// the laptop's screen when the projector is a second window
// (docs/user-flow.md §3.3, §3.5). One card and one button; everything else
// is in the ⋯ menu.

import type { ServerMessage, TeacherView } from "../shared/protocol.ts";
import { $, esc, keepAwake, lines, rolePage, siteAddress, statusDot, tabRole, type HeldRole } from "./dom.ts";
import { ICON, avatarSvg } from "./look.ts";
import { Steer, answersBlock, live, newUI, nextStep, openMenu, patch, playersRow, questionList, sideStep, steerItems, closeTempoSheet, tempoLine, thumb, toast, type MenuItem } from "./manage.ts";
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
let lastStep = "";
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
    // ⋯ → "Show the projector here": this tab is the Projector now.
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

  const step = `${v.phase}|${v.current}`;
  if (step !== lastStep) {
    lastStep = step;
    closeTempoSheet();
  }
  let body = "";
  if (v.phase === "lobby") body = lobby(v);
  else if (v.phase === "question" || v.phase === "reveal") body = current(v);
  else if (v.phase === "ranking" || v.phase === "final") body = ranking(v);
  if (v.phase !== "lobby") {
    if (showPlayers) body += playersPanel(v);
    if (showAll) body += questionList(v, steer.ui);
  }
  patch(main, body);
  fillPictures(main);
  renderClock(v);

  const next = nextStep(v);
  const side = sideStep(v);
  const buttons = `<div class="wrap">
    <button class="btn more" data-menu aria-label="more">⋯</button>
    ${side ? `<button class="btn" data-step data-act="${side.act}">${side.label}</button>` : ""}
    ${next ? `<button class="btn primary big" data-step data-act="${next.act}">${next.label}</button>` : ""}
  </div>`;
  if (buttons !== lastButtons) {
    lastButtons = buttons;
    actions.innerHTML = buttons;
  }
  steer.noteStep(v, actions);
  if (steer.locked()) actions.querySelectorAll<HTMLButtonElement>("button[data-step]").forEach((b) => (b.disabled = true));
}

function lobby(v: TeacherView): string {
  const n = v.run?.players.length ?? 0;
  const projector =
    v.screen === "present"
      ? `<p class="device ok">Projector ✓</p>`
      : `<p class="device">On the projector computer: open <strong>${esc(siteAddress())}/teacher</strong>, type <strong>${esc(v.code)}</strong>, choose <strong>Projector</strong>.</p>`;
  return `<section class="joinbox">
      <div class="addr">${esc(siteAddress())}</div>
      <div class="codebig">${esc(v.code)}</div>
      <div class="joined">${live("joined", n)} joined</div>
      ${playersRow(v, true)}
      <p class="device">${tempoLine(v)}</p>
    </section>
    ${projector}
    ${questionList(v, steer.ui)}`;
}

function current(v: TeacherView): string {
  const run = v.run!;
  const q = v.questions[v.current];
  const present = run.players.filter((p) => p.connected).length;
  const away = run.players.length - present;
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
    ${tempoState(v)}
    ${answersBlock(q, v.current, steer.ui, run.dist)}
    <p class="answered"><strong>${live("answered", run.answered)}</strong> of ${live("present", present)} answered${away ? ` · ${live("away", away)} away` : ""}</p>
  </section>`;
}

/**
 * Where the countdown is, above the answers: the class reading (the wall
 * shows the question, Go brings the answers and the clock), the clock
 * running (its bar goes in the slot, see renderClock), or time's up.
 */
function tempoState(v: TeacherView): string {
  if (v.phase !== "question" || v.playing === "pace") return "";
  if (v.answering === "reading") return `<p class="hint">The class reads the question. <strong>Go</strong> shows the answers and starts the ${v.questions[v.current].seconds} s countdown.</p>`;
  if (v.answering === "closed") return `<p class="timeup-line">${ICON.timer} Time's up: answering is closed.</p>`;
  return v.clock ? `<div class="clockslot"></div>` : `<p class="hint">Countdown stopped: the answers stay open.</p>`;
}

/** The running countdown in its slot, drawn again only when it starts or stops: CSS drains it. */
function renderClock(v: TeacherView): void {
  const slot = main.querySelector<HTMLElement>(".clockslot");
  if (!slot || !v.clock) return;
  const key = `${v.current}|${v.clock.ms}|${v.clock.leftMs === 0}`;
  if (slot.dataset.key === key) return;
  slot.dataset.key = key;
  slot.innerHTML = clockBar(v.clock.ms, localEnd(`${v.current}`, v.clock));
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
  items.push({ label: "Show the projector here", run: () => void projectorHere() });
  items.push({ label: "Stop being the remote", run: () => void leave() });
  items.push({ label: "Delete the quiz…", danger: true, run: () => void steer.run("delete") });
  openMenu(items);
}

async function projectorHere(): Promise<void> {
  if (view?.screen === "present" && !confirm("The projector moves to this screen; the other screen stops showing the quiz.")) return;
  const r = await line?.send({ op: "projectorHere" });
  if (r && !r.ok && r.error) toast(r.error);
}

async function leave(): Promise<void> {
  const inClass = (view?.run?.players.length ?? 0) > 0;
  const back = inClass ? " While students are in, no device can take the steering back from it." : "";
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
    if (el.dataset.act === "close-players") {
      showPlayers = false;
      render();
      return;
    }
    void steer.act(el);
  });
}

start();
