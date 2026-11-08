// What the steering tab shows and does, shared by the Remote (teach.ts) and
// the Projector while it steers itself (screen.ts). docs/user-flow.md §3.3–3.5.

import type { ImageRef, TeacherQuestion, TeacherView } from "../shared/protocol.ts";
import { POINTS_RIGHT, SPEED_BONUS } from "../shared/tempo.ts";
import { ROOM_WARN, quotaResetAt } from "../shared/limits.ts";
import { esc, lines, siteAddress } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg, syncAvatars } from "./look.ts";
import type { Line } from "./net.ts";
import { fillPictures, picImg } from "./pictures.ts";
import { Presses, atOf, playStep, stepState } from "./steps.ts";

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

function tags(q: TeacherQuestion): string {
  const right = q.answers.filter((a) => a.counts).length;
  return [
    q.status === "current" ? `<span class="tag now">now</span>` : "",
    q.status === "revealed" ? `<span class="tag">done</span>` : "",
    q.skip ? `<span class="tag">skipped</span>` : "",
    q.void ? `<span class="tag">not counted</span>` : "",
    q.image && q.pictureHidden ? `<span class="tag">picture hidden</span>` : "",
    right > 1 ? `<span class="tag">${right} right</span>` : "",
    q.answers.some((a) => a.counts !== a.marked) ? `<span class="tag">changed</span>` : "",
  ].join("");
}

/** A question's choices with the solution marked; tappable while it is being fixed. */
export function answersBlock(q: TeacherQuestion, i: number, ui: ManageUI, dist: number[] | null = null): string {
  const fixing = ui.fixing === i;
  const rows = q.answers
    .map((a, j) => {
      const tap = fixing ? ` fixable" data-act="toggle-count" data-q="${i}" data-i="${j}` : "";
      // A picture answer shows its picture: the text says nothing
      // about it, so this is where the teacher checks the key. While fixing,
      // a tap on the row toggles the answer, so the picture isn't a button then.
      const body =
        a.image !== undefined
          ? a.image
            ? `<span class="t pic">${fixing ? picImg(a.image.src, a.image.w, a.image.h) : thumb(a.image, "ansthumb")}</span>`
            : `<span class="t muted">(picture left out)</span>`
          : `<span class="t">${lines(a.text)}</span>`;
      return `<div class="ans a${j}${a.counts ? " right" : ""}${tap}">
        <span class="key">${a.counts ? ICON.check : ""}</span>${shapeSvg(j)}${body}
        ${dist ? `<span class="cnt">${live(`d${i}-${j}`, dist[j])}</span>` : ""}
      </div>`;
    })
    .join("");
  const fix = fixing
    ? `<p class="hint">Tap every right choice.</p>
       <div class="row">
         <button class="btn" data-act="void" data-q="${i}">${ICON.void} ${q.void ? "Count it again" : "Don't count this question"}</button>
         ${q.status === "upcoming" || q.status === "skipped" ? `<button class="btn" data-act="skip" data-q="${i}">${q.skip ? "Show it after all" : "Skip it"}</button>` : ""}
         ${q.image ? `<button class="btn" data-act="hide-pic" data-q="${i}">${q.pictureHidden ? "Show the picture again" : "Hide the picture"}</button>` : ""}
         <button class="btn primary" data-act="fix-done">Done</button>
       </div>`
    : `<button class="link" data-act="fix-q" data-q="${i}">Change the solution</button>`;
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

/** The questions with their fixes; also the local check's, before the upload (client/open.ts), which has no run. */
export type QuestionsView = Pick<TeacherView, "questions" | "background" | "warnings">;

export function questionList(v: QuestionsView, ui: ManageUI): string {
  const items = v.questions
    .map((q, i) => {
      const open = ui.all || ui.open.has(i) || ui.fixing === i;
      return `<li class="q${open ? " open" : ""}">
        <button class="qhead" data-act="toggle-q" data-q="${i}" aria-expanded="${open}">
          <span class="num">${i + 1}</span><span class="qt">${lines(q.text)}</span>${tags(q)}<span class="chev">›</span>
        </button>
        ${questionPictures(q, v.background)}
        ${open ? answersBlock(q, i, ui) : ""}
      </li>`;
    })
    .join("");
  return `<section class="qlist">
    <div class="qlist-head"><strong>${v.questions.length} questions</strong>
      <button class="btn" data-act="toggle-all">${ui.all ? "Hide the solutions" : "Show the solutions"}</button></div>
    ${v.background ? `<div class="qbg">${thumb(v.background, "bg", "background")}<span class="hint">behind every question</span></div>` : ""}
    ${v.warnings.map((w) => `<p class="warning">${esc(w.message)}</p>`).join("")}
    <ol>${items}</ol>
  </section>`;
}

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

/**
 * The lobby's players, kept in place in its `[data-crowd]` row rather than
 * in the patched page: children dressing their animals change the row
 * often, and a page redrawn under the teacher's finger loses the tap on
 * Start. Tapping an avatar removes it, as in playersRow.
 */
export function syncCrowd(root: HTMLElement, v: TeacherView): void {
  const box = root.querySelector<HTMLElement>("[data-crowd]");
  if (!box) return;
  syncAvatars(box, v.run?.players ?? [], (p) => ({
    tag: "button",
    className: p.connected ? "" : "away",
    attrs: { "data-act": "remove", "data-player": p.id, "aria-label": "remove" },
  }));
}

export class Steer {
  /** Every press of the steering bar, its keys and clicker included, goes through here. */
  readonly presses = new Presses();
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

  /** Call on every view: the moment the step on screen changes is what a press is judged against. */
  noteStep(v: TeacherView): void {
    this.presses.noteView(stepState(v));
  }

  /** The same as a click on a button with these data attributes (for the ⋯ menu and the keyboard). */
  run(act: string, data: Record<string, string> = {}): Promise<boolean> {
    const el = document.createElement("button");
    el.dataset.act = act;
    for (const [k, val] of Object.entries(data)) el.dataset[k] = val;
    return this.act(el);
  }

  /** Handles a click on an element with data-act; returns false when the action isn't a steering one. */
  async act(el: HTMLElement): Promise<boolean> {
    const v = this.view();
    const line = this.line();
    const a = el.dataset.act ?? "";
    const q = Number(el.dataset.q);
    if (!v || !line) return false;
    if (viewAct(el, this.ui, this.redraw)) return true;
    const at = atOf(stepState(v));
    const send = async (cmd: Parameters<Line["send"]>[0]) => {
      const r = await line.send(cmd);
      // A long message (the site full for today) stays long enough to read.
      if (!r.ok && r.error) toast(r.error, r.error.length > 80 ? 12_000 : 4000);
      return r;
    };
    switch (a) {
      case "play": {
        // One slice, or the second of a double press (steps.ts, Presses).
        const from = this.presses.play(stepState(v));
        if (!from) return true;
        if (from.phase === "ranking" || (from.phase === "reveal" && playStep(from)?.to.phase === "final")) this.ui.fixing = null;
        await send({ op: "play", at: atOf(from) });
        return true;
      }
      case "last-call":
      case "begin":
        if (!this.presses.other()) return true;
        await send({ op: a === "begin" ? "begin" : "lastCall", at });
        return true;
      case "exit":
        // No question: Exit is alone in the middle of the bar, away from where Play was.
        if (!this.presses.other()) return true;
        await send({ op: "endInstance" });
        return true;
      case "let-in":
        // Refused for the day's room: the check's notice says so and stays (roomNotice), no toast.
        await line.send({ op: "letIn" });
        return true;
      case "speed":
        await send({ op: "speed", value: !v.speed });
        return true;
      case "finish":
        if (confirm("Show the final ranking now? Questions not yet shown are left out.")) await send({ op: "finish", at });
        return true;
      case "skip-current":
        if (confirm("Skip this question? It won't count.")) await send({ op: "skipCurrent", at });
        return true;
      case "toggle-count": {
        const i = Number(el.dataset.i);
        const counts = v.questions[q].answers.map((x, j) => (j === i ? !x.counts : x.counts));
        if (!counts.some(Boolean)) {
          toast("At least one choice has to be right. For none, don't count the question.");
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

/**
 * What the question list does on this device alone: unfold, show the
 * solutions, open a question's fixes, enlarge a picture. Returns false for
 * anything else (a fix itself, which the caller applies).
 */
export function viewAct(el: HTMLElement, ui: ManageUI, redraw: () => void): boolean {
  const q = Number(el.dataset.q);
  switch (el.dataset.act) {
    case "toggle-q":
      if (ui.open.has(q)) ui.open.delete(q);
      else ui.open.add(q);
      if (ui.fixing === q) ui.fixing = null;
      redraw();
      return true;
    case "toggle-all":
      ui.all = !ui.all;
      if (!ui.all) ui.open.clear();
      redraw();
      return true;
    case "fix-q":
      ui.fixing = q;
      redraw();
      return true;
    case "fix-done":
      ui.fixing = null;
      redraw();
      return true;
    case "lightbox":
      lightbox(el.dataset.src!, Number(el.dataset.w), Number(el.dataset.h));
      return true;
    default:
      return false;
  }
}

export interface MenuItem {
  label: string;
  run: () => void;
  danger?: boolean;
}

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
 * the solution to the class.
 */
export function steerItems(v: TeacherView, steer: Steer, onWall = false): MenuItem[] {
  const open = (act: string, data: Record<string, string> = {}) => void steer.run(act, data);
  const items: MenuItem[] = [];
  if (v.phase === "question") {
    items.push({ label: "Skip this question", run: () => open("skip-current") });
    items.push({ label: onWall ? "Change the solution – the class sees it" : "Change the solution", run: () => open("fix-q", { q: String(v.current) }) });
  }
  if (v.phase === "reveal") items.push({ label: "Change the solution", run: () => open("fix-q", { q: String(v.current) }) });
  if (v.phase === "question" || v.phase === "reveal" || v.phase === "ranking") items.push({ label: `${ICON.trophy} End the quiz: final ranking`, run: () => open("finish") });
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

/** "classyquiz.pages.dev · 63953"; on a phone-sized wall the address gives way to the code (app.css). */
/**
 * Before the class is let in, on a day the free site is nearly or quite full:
 * what that means for this class, and the way to more quizzes
 * (docs/design/hosting-and-limits.md, "Running classes finish"). It stays
 * while it holds; the page opens beside the quiz.
 */
export function roomNotice(v: TeacherView): string {
  const room = v.room;
  if (room === null || room >= ROOM_WARN) return "";
  const at = quotaResetAt();
  const says =
    room === 0
      ? `The free site can't take more classes today: the ones running now use what is left. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`
      : `The free site is nearly full today: room for ${room === 1 ? "one more class" : `about ${room} more classes`}.`;
  return `<p class="roomnote">${esc(says)} <a href="/own-copy" target="_blank" rel="noopener">More quizzes: a site of your own or your school's ›</a></p>`;
}

export function addressAndCode(code: string): string {
  return `<span class="addr">${esc(siteAddress())} · </span><strong>${esc(code)}</strong>`;
}

/**
 * The lobby's switch, under Start on the join screen and in the Remote's
 * lobby: off by default, fixed once the quiz starts.
 */
export function speedSwitch(v: TeacherView): string {
  return `<button class="speed-switch" role="switch" aria-checked="${v.speed}" data-act="speed"><span class="knob" aria-hidden="true"></span>Points for speed</button><small class="speed-note">A right answer ${POINTS_RIGHT}, up to ${SPEED_BONUS} more the quicker it comes.</small>`;
}
