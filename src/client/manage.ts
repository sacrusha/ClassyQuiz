// What the steering tab shows and does, shared by the Remote (teach.ts) and
// the Projector while it steers itself (screen.ts): the question list of the
// lobby (backlog item 19), the next step, fixes, players, the ⋯ menu.
// docs/user-flow.md §3.3–3.5.

import type { ImageRef, TeacherQuestion, TeacherView, Tempo } from "../shared/protocol.ts";
import { COUNTDOWN_MAX, COUNTDOWN_MIN, NUDGE_SECONDS, POINTS_RIGHT, SPEED_BONUS } from "../shared/tempo.ts";
import { esc, lines, siteAddress } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg } from "./look.ts";
import type { Line } from "./net.ts";
import { fillPictures, picImg } from "./pictures.ts";

/** What the teacher opened or is fixing; kept across redraws. */
export interface ManageUI {
  open: Set<number>;
  all: boolean;
  fixing: number | null;
}

export function newUI(): ManageUI {
  return { open: new Set(), all: false, fixing: null };
}

/** A number that changes while answers come in, patched in place rather than redrawn. */
export const live = (key: string, value: string | number) => `<span data-live="${key}">${value}</span>`;
const LIVE = /<span data-live="([^"]+)">[^<]*<\/span>/g;

/**
 * Puts html into el. When only live numbers changed, they are patched and
 * nothing else is touched: answers arrive fastest just when the teacher
 * reaches for Reveal, and a button replaced under the finger loses the tap.
 */
export function patch(el: HTMLElement, html: string): void {
  const skeleton = html.replace(LIVE, '<span data-live="$1"></span>');
  if (el.dataset.skeleton === skeleton) {
    const values = new Map<string, string>();
    for (const m of html.matchAll(/<span data-live="([^"]+)">([^<]*)<\/span>/g)) values.set(m[1], m[2]);
    el.querySelectorAll<HTMLElement>("[data-live]").forEach((x) => {
      const val = values.get(x.dataset.live!);
      if (val !== undefined && x.textContent !== val) x.textContent = val;
    });
    return;
  }
  el.dataset.skeleton = skeleton;
  el.innerHTML = html;
}

// ---------------------------------------------------------------------------
// The questions (lobby, and "All questions" during the run)

function tags(q: TeacherQuestion, v: TeacherView): string {
  const right = q.answers.filter((a) => a.counts).length;
  return [
    // With a countdown: each question's length, as the quiz gives it (or the teacher's one length).
    v.tempo !== "pace" && q.status === "upcoming" ? `<span class="tag">${q.seconds} s</span>` : "",
    q.status === "current" ? `<span class="tag now">now</span>` : "",
    q.status === "revealed" ? `<span class="tag">done</span>` : "",
    q.skip ? `<span class="tag">skipped</span>` : "",
    q.void ? `<span class="tag">void</span>` : "",
    q.image && q.pictureHidden ? `<span class="tag">picture hidden</span>` : "",
    right > 1 ? `<span class="tag">${right} right</span>` : "",
    q.answers.some((a) => a.counts !== a.marked) ? `<span class="tag">changed</span>` : "",
  ].join("");
}

/** A question's answers with the right ones marked; tappable while it is being fixed. */
export function answersBlock(q: TeacherQuestion, i: number, ui: ManageUI, dist: number[] | null = null): string {
  const fixing = ui.fixing === i;
  const rows = q.answers
    .map((a, j) => {
      const tap = fixing ? ` fixable" data-act="toggle-count" data-q="${i}" data-i="${j}` : "";
      return `<div class="ans a${j}${a.counts ? " right" : ""}${tap}">
        <span class="key">${a.counts ? ICON.check : ""}</span>${shapeSvg(j)}<span class="t">${lines(a.text)}</span>
        ${dist ? `<span class="cnt">${live(`d${i}-${j}`, dist[j])}</span>` : ""}
      </div>`;
    })
    .join("");
  const fix = fixing
    ? `<p class="hint">Tap the answers that count.</p>
       <div class="row">
         <button class="btn" data-act="void" data-q="${i}">${ICON.void} ${q.void ? "Count it again" : "Void: counts for nobody"}</button>
         ${q.status === "upcoming" || q.status === "skipped" ? `<button class="btn" data-act="skip" data-q="${i}">${q.skip ? "Show it after all" : "Skip it"}</button>` : ""}
         ${q.image ? `<button class="btn" data-act="hide-pic" data-q="${i}">${q.pictureHidden ? "Show the picture again" : "Hide the picture"}</button>` : ""}
         <button class="btn primary" data-act="fix-done">Done</button>
       </div>`
    : `<button class="link" data-act="fix-q" data-q="${i}">Change the right answer</button>`;
  return `<div class="answers">${rows}${fix}</div>`;
}

/** A picture small, tapped to see it full size on this device. */
export function thumb(img: ImageRef, cls = "", label = ""): string {
  return `<button class="thumb${cls ? ` ${cls}` : ""}" data-act="lightbox" data-src="${esc(img.src)}" data-w="${img.w}" data-h="${img.h}" aria-label="${label || "picture"}">${picImg(img.src, img.w, img.h)}${label ? `<span>${label}</span>` : ""}</button>`;
}

/**
 * A question's picture, and its own background if it has one, outside the
 * answers' fold: the class sees them anyway, and a wrong or revealing crop
 * is what a skimming teacher has to spot.
 */
function questionPictures(q: TeacherQuestion, quizBackground: ImageRef | null): string {
  const parts: string[] = [];
  if (q.image) parts.push(thumb(q.image, q.pictureHidden ? "hidden" : ""));
  if (q.background && q.background.src !== quizBackground?.src) parts.push(thumb(q.background, "bg", "background"));
  return parts.length ? `<div class="qpics">${parts.join("")}</div>` : "";
}

export function questionList(v: TeacherView, ui: ManageUI): string {
  const items = v.questions
    .map((q, i) => {
      const open = ui.all || ui.open.has(i) || ui.fixing === i;
      return `<li class="q${open ? " open" : ""}">
        <button class="qhead" data-act="toggle-q" data-q="${i}" aria-expanded="${open}">
          <span class="num">${i + 1}</span><span class="qt">${lines(q.text)}</span>${tags(q, v)}<span class="chev">›</span>
        </button>
        ${questionPictures(q, v.background)}
        ${open ? answersBlock(q, i, ui) : ""}
      </li>`;
    })
    .join("");
  return `<section class="qlist">
    <div class="qlist-head"><strong>${v.questions.length} questions</strong>
      <button class="btn" data-act="toggle-all">${ui.all ? "Hide answers" : "Show all answers"}</button></div>
    ${v.background ? `<div class="qbg">${thumb(v.background, "bg", "background")}<span class="hint">behind every question</span></div>` : ""}
    ${v.warnings.map((w) => `<p class="warning">${esc(w.message)}</p>`).join("")}
    <ol>${items}</ol>
  </section>`;
}

/** A picture over the whole page of this device; a tap closes it. */
export function lightbox(src: string, w: number, h: number): void {
  document.querySelector(".lightbox")?.remove();
  const back = document.createElement("div");
  back.className = "lightbox";
  back.innerHTML = picImg(src, w, h);
  back.addEventListener("click", () => back.remove());
  document.body.appendChild(back);
  fillPictures(back);
}

export function playersRow(v: TeacherView, removable: boolean): string {
  const players = v.run?.players ?? [];
  return `<div class="avatars">${players
    .map((p) =>
      removable
        ? `<button data-act="remove" data-player="${esc(p.id)}" class="${p.connected ? "" : "away"}" aria-label="remove">${avatarSvg(p.avatar)}</button>`
        : `<span class="${p.connected ? "" : "away"}">${avatarSvg(p.avatar)}</span>`,
    )
    .join("")}</div>`;
}

// ---------------------------------------------------------------------------
// The next step

export interface Step {
  act: string;
  label: string;
}

function isLast(v: TeacherView): boolean {
  return !v.questions.some((q, i) => i > v.current && !q.skip);
}

/** The big button: what usually comes next. */
export function nextStep(v: TeacherView): Step | null {
  switch (v.phase) {
    case "lobby":
      return { act: "begin", label: "Start quiz &#9654;" };
    case "question":
      // Countdown tempos: the class has read the question; Go shows the answers and starts the clock.
      if (v.answering === "reading") return { act: "go", label: "Go &#9654;" };
      return { act: "reveal", label: `${ICON.eye} Reveal` };
    case "reveal":
    case "ranking":
      return isLast(v) ? { act: "next", label: `${ICON.trophy} Final ranking` } : { act: "next", label: "Next &#9654;" };
    case "final":
      return { act: "again", label: "Again with another class" };
    default:
      return null;
  }
}

/** A smaller button beside it. */
export function sideStep(v: TeacherView): Step | null {
  if (v.phase === "reveal" && !isLast(v)) return { act: "ranking", label: `${ICON.trophy} Ranking` };
  return null;
}

// ---------------------------------------------------------------------------
// Acting

const STEPS = new Set(["begin", "go", "reveal", "next", "ranking", "finish", "skip-current", "again"]);
/** After each step the buttons stay inert for a moment, so a double tap on Reveal doesn't land on the Next that replaces it. */
export const STEP_LOCK_MS = 700;

export class Steer {
  private lockUntil = 0;
  private lastStep = "";
  private line: () => Line | null;
  private view: () => TeacherView | null;
  readonly ui: ManageUI;
  private redraw: () => void;

  constructor(line: () => Line | null, view: () => TeacherView | null, ui: ManageUI, redraw: () => void) {
    this.line = line;
    this.view = view;
    this.ui = ui;
    this.redraw = redraw;
  }

  /** Call on every view: a new step locks the step buttons for a moment. */
  noteStep(v: TeacherView, buttons: ParentNode): void {
    // Go and Reveal share a phase: a double tap on Go mustn't land on the Reveal that replaces it.
    const step = `${v.phase}|${v.current}|${v.answering === "reading"}`;
    if (step === this.lastStep) return;
    this.lastStep = step;
    this.lockUntil = Math.max(this.lockUntil, Date.now() + STEP_LOCK_MS);
    const until = this.lockUntil;
    window.setTimeout(() => {
      if (this.lockUntil === until) buttons.querySelectorAll<HTMLButtonElement>("button[data-step]").forEach((b) => (b.disabled = false));
    }, until - Date.now());
  }

  /** The same as a click on a button with these data attributes (for the ⋯ menu). */
  run(act: string, data: Record<string, string> = {}): Promise<boolean> {
    const el = document.createElement("button");
    el.dataset.act = act;
    for (const [k, val] of Object.entries(data)) el.dataset[k] = val;
    return this.act(el);
  }

  locked(): boolean {
    return Date.now() < this.lockUntil;
  }

  /** Handles a click on an element with data-act; returns false when the action isn't a steering one. */
  async act(el: HTMLElement): Promise<boolean> {
    const v = this.view();
    const line = this.line();
    const a = el.dataset.act ?? "";
    const q = Number(el.dataset.q);
    if (!v || !line) return false;
    if (STEPS.has(a)) {
      if (this.locked()) return true;
      this.lockUntil = Date.now() + STEP_LOCK_MS;
    }
    const at = { phase: v.phase, current: v.current, reading: v.answering === "reading" };
    const send = async (cmd: Parameters<Line["send"]>[0]) => {
      const r = await line.send(cmd);
      if (!r.ok && r.error) toast(r.error);
      return r;
    };
    switch (a) {
      case "begin":
      case "go":
      case "reveal":
      case "next":
      case "ranking":
      case "again":
        if (a === "next" || a === "again") this.ui.fixing = null;
        await send({ op: a, at });
        return true;
      case "stop-clock":
        await send({ op: "stopClock", at });
        return true;
      case "nudge":
        await send({ op: "nudge", by: Number(el.dataset.by) });
        return true;
      case "tempo-sheet":
        tempoSheet(v, (cmd) => send(cmd));
        return true;
      case "finish":
        if (confirm("Show the final ranking now? Questions not yet shown are left out.")) await send({ op: "finish", at });
        return true;
      case "skip-current":
        if (confirm("Skip this question? It won't count.")) await send({ op: "skipCurrent", at });
        return true;
      case "toggle-q":
        if (this.ui.open.has(q)) this.ui.open.delete(q);
        else this.ui.open.add(q);
        if (this.ui.fixing === q) this.ui.fixing = null;
        this.redraw();
        return true;
      case "toggle-all":
        this.ui.all = !this.ui.all;
        if (!this.ui.all) this.ui.open.clear();
        this.redraw();
        return true;
      case "fix-q":
        this.ui.fixing = q;
        this.redraw();
        return true;
      case "fix-done":
        this.ui.fixing = null;
        this.redraw();
        return true;
      case "toggle-count": {
        const i = Number(el.dataset.i);
        const counts = v.questions[q].answers.map((x, j) => (j === i ? !x.counts : x.counts));
        if (!counts.some(Boolean)) {
          toast("At least one answer has to count. To count none, void the question.");
          return true;
        }
        await send({ op: "setCounts", q, counts });
        return true;
      }
      case "void":
        await send({ op: "setVoid", q, value: !v.questions[q].void });
        return true;
      case "skip":
        await send({ op: "setSkip", q, value: !v.questions[q].skip });
        return true;
      case "hide-pic":
        await send({ op: "setHidePicture", q, value: !v.questions[q].pictureHidden });
        return true;
      case "lightbox":
        lightbox(el.dataset.src!, Number(el.dataset.w), Number(el.dataset.h));
        return true;
      case "zoom":
        await send({ op: "zoom", value: !v.zoom, at });
        return true;
      case "remove":
        if (confirm("Remove this avatar? Its answers stop counting. For a double, or a device that isn't from this class.")) {
          await send({ op: "remove", player: el.dataset.player! });
        }
        return true;
      case "delete":
        if (confirm(`Delete “${v.title || "this quiz"}”? The class can't join it any more.`)) await send({ op: "endInstance" });
        return true;
      default:
        return false;
    }
  }
}

// ---------------------------------------------------------------------------
// The ⋯ menu and short notices

export interface MenuItem {
  label: string;
  run: () => void;
  danger?: boolean;
}

/** A sheet of choices over the page; a tap outside closes it. */
export function openMenu(items: MenuItem[]): void {
  document.querySelector(".sheet-back")?.remove();
  const back = document.createElement("div");
  back.className = "sheet-back";
  back.innerHTML = `<div class="sheet" role="menu">${items
    .map((it, i) => `<button role="menuitem" class="${it.danger ? "danger" : ""}" data-i="${i}">${it.label}</button>`)
    .join("")}<button class="cancel" data-i="-1">Close</button></div>`;
  back.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button[data-i]");
    if (!b && e.target !== back) return;
    back.remove();
    const i = b ? Number(b.dataset.i) : -1;
    if (i >= 0) items[i].run();
  });
  document.body.appendChild(back);
}

/**
 * The steering items of the ⋯ menu for the phase; the page adds its own.
 * onWall: the menu is on the Projector, where fixing an open question shows
 * the answer to the class.
 */
export function steerItems(v: TeacherView, steer: Steer, onWall = false): MenuItem[] {
  const open = (act: string, data: Record<string, string> = {}) => void steer.run(act, data);
  const items: MenuItem[] = [];
  // The clock presses the class, never the teacher: it can be stopped, and
  // after time's up the answers can open again.
  if (v.phase === "question" && v.clock && v.answering === "open") items.push({ label: "Stop the countdown: answers stay open", run: () => open("stop-clock") });
  if (v.phase === "question" && v.answering === "closed") items.push({ label: "Open the answers again, without a countdown", run: () => open("stop-clock") });
  // An unfun tempo is changed here, from the next question on.
  if (v.phase !== "lobby" && v.phase !== "final") items.push({ label: `Tempo: ${esc(tempoName(v))}…`, run: () => open("tempo-sheet") });
  if (v.phase === "question") {
    items.push({ label: "Skip this question", run: () => open("skip-current") });
    items.push({ label: onWall ? "Change the right answer – the class sees it" : "Change the right answer", run: () => open("fix-q", { q: String(v.current) }) });
  }
  if (v.phase === "reveal") items.push({ label: "Change the right answer", run: () => open("fix-q", { q: String(v.current) }) });
  if (v.phase === "question" || v.phase === "reveal" || v.phase === "ranking") items.push({ label: `${ICON.trophy} Final ranking now`, run: () => open("finish") });
  return items;
}

let toastTimer: number | undefined;
export function toast(msg: string, ms = 4000): void {
  let t = document.querySelector<HTMLElement>(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t!.hidden = true), ms);
}

/** "classyquiz.pages.dev · 63953" */
export function addressAndCode(code: string): string {
  return `${esc(siteAddress())} · <strong>${esc(code)}</strong>`;
}

// ---------------------------------------------------------------------------
// Tempo (backlog v2 items 2, 3; shared/tempo.ts)

const TEMPO_NAMES: Record<Tempo, string> = {
  pace: "Teacher's pace",
  countdown: "Countdown",
  speed: "Countdown and points for speed",
};

/** The countdown lengths still to come, in a few words: "60 s", "15–40 s". */
function lengths(v: TeacherView): string {
  const s = v.questions.filter((q, i) => !q.skip && (v.phase === "lobby" || i >= v.current)).map((q) => q.seconds);
  if (s.length === 0) return "";
  const lo = Math.min(...s);
  const hi = Math.max(...s);
  return lo === hi ? `${lo} s` : `${lo}–${hi} s`;
}

/** The tempo in a few words: "Countdown, 60 s", or "Countdown, 15–40 s" when the quiz gives its own lengths. */
export function tempoName(v: TeacherView): string {
  if (v.tempo === "pace") return TEMPO_NAMES.pace;
  const l = lengths(v);
  return l ? `${TEMPO_NAMES[v.tempo]}, ${l}` : TEMPO_NAMES[v.tempo];
}

/**
 * The teacher's −5/+5 during the quiz (owner's decomposition, v2 item 2): the
 * countdown running, or the next to start, and every one after it, within
 * 10..60 s. Shown only when there is a countdown to change.
 */
export function nudgePair(v: TeacherView): string {
  const s = v.countdown;
  if (s === null) return "";
  return `<span class="nudge" aria-label="countdown length">
    <button class="btn" data-act="nudge" data-by="-${NUDGE_SECONDS}"${s <= COUNTDOWN_MIN ? " disabled" : ""} aria-label="shorter">&minus;${NUDGE_SECONDS}</button>
    <span class="len">${ICON.timer}${s} s</span>
    <button class="btn" data-act="nudge" data-by="${NUDGE_SECONDS}"${s >= COUNTDOWN_MAX ? " disabled" : ""} aria-label="longer">+${NUDGE_SECONDS}</button>
  </span>`;
}

/** The lobby's line under Start: the tempo, tapped to change it. Off (the teacher's pace) unless a class turns it on. */
export function tempoLine(v: TeacherView): string {
  return `<button class="link tempo-line" data-act="tempo-sheet">Tempo: ${esc(tempoName(v))} ›</button>`;
}

/** The tempo's sheet goes when the step it was opened in has passed, or this tab no longer steers. */
export function closeTempoSheet(): void {
  document.querySelector(".tempo-sheet")?.parentElement?.remove();
}

/**
 * The tempo's choices in a sheet: the three tempos, the quiz's own choice
 * marked first. No lengths: the quiz's are as written (60 s without), and
 * during the quiz −5/+5 changes them (owner, v2 item 2: less clutter than a
 * length picker). During the quiz a change applies from the next question.
 * Changes are sent at once; the sheet marks them as they're made.
 */
function tempoSheet(v: TeacherView, send: (cmd: { op: "tempo"; tempo: Tempo }) => Promise<{ ok: boolean }>): void {
  document.querySelector(".sheet-back")?.remove();
  const lobby = v.phase === "lobby";
  const what: Record<Tempo, string> = {
    pace: "You reveal when the class is ready. No clock.",
    countdown: "The question comes first. Go shows the answers and starts the clock; when it runs out, answering closes and you reveal.",
    speed: `As Countdown. A right answer scores ${POINTS_RIGHT}, and up to ${SPEED_BONUS} more the quicker it came.`,
  };
  const tempos =
    (lobby ? "" : `<p class="hint">From the next question on.</p>`) +
    (["pace", "countdown", "speed"] as Tempo[])
      .map((t) => `<button class="tempo-choice${v.tempo === t ? " on" : ""}" data-tempo="${t}"><strong>${TEMPO_NAMES[t]}</strong><small>${esc(what[t])}</small></button>`)
      .join("");
  const l = lengths(v);
  const how = `<p class="hint seconds"${v.tempo === "pace" ? " hidden" : ""}>${
    v.timed && v.adjust === 0 ? `The countdown: ${l}, as the quiz says.` : `The countdown: ${l}.`
  } During the quiz, &minus;${NUDGE_SECONDS} and +${NUDGE_SECONDS} make it shorter or longer, from ${COUNTDOWN_MIN} to ${COUNTDOWN_MAX} s.</p>`;
  const back = document.createElement("div");
  back.className = "sheet-back";
  back.innerHTML = `<div class="sheet tempo-sheet">${tempos}${how}<button class="cancel" data-close>Done</button></div>`;
  back.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target === back || target.closest("[data-close]")) {
      back.remove();
      return;
    }
    const t = target.closest<HTMLElement>("[data-tempo]");
    if (t) {
      const tempo = t.dataset.tempo as Tempo;
      back.querySelectorAll("[data-tempo]").forEach((b) => b.classList.toggle("on", b === t));
      back.querySelector<HTMLElement>(".seconds")!.hidden = tempo === "pace";
      void send({ op: "tempo", tempo });
    }
  });
  document.body.appendChild(back);
}
