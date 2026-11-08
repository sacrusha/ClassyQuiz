// The question on a player's own device (docs/design/solo.md, "The device
// screen"; backlog v5 item 6): the question, its picture and the tiles,
// laid out as the wall lays them out (client/stage.ts) in the room the
// device has, the tiles to tap; then the key on them. Solo is the first to
// stand on it; a room without a wall (Peers, a Quizmaster's devices-only
// room) drives it from its views the same way.
//
// The frame: a bar at the top (where the question stands, a verdict, the
// player's avatar and score), the stage, and a bar at the foot with one
// button, the next step, always in the same place and kept there invisible
// when there is none, so a hand in flow always finds it and a double tap
// never lands on something new (docs/design/question-flow.md, "The steering bar").

import type { Answering, Avatar, ImageRef } from "../shared/protocol.ts";
import { esc } from "./dom.ts";
import { ICON, avatarSvg } from "./look.ts";
import { fillPictures, picImg } from "./pictures.ts";
import { backdrop, endJump, jump, layQuestion, markTiles, type StageQuestion } from "./stage.ts";
import { SETTLE_MS } from "./steps.ts";

export interface DeviceQuestion extends StageQuestion {
  /** Tells questions apart: a new key is laid out afresh, the same one only marked. */
  key: string;
  /** Position among the questions shown, 1-based, and how many there are. */
  n: number;
  total: number;
  /** Behind the question: its own background, else the quiz's. */
  background: ImageRef | null;
}

/** What the device shows; every list in the order on screen. */
export interface DeviceView {
  title: string;
  question: DeviceQuestion;
  /** reading: the tiles veiled, their colours only; open: a tap answers; closed: no more taps. */
  answering: Answering;
  /** The answer this device chose, outlined. */
  mine: number | null;
  /** The key once it shows: which answers count. */
  counts: boolean[] | null;
  /** Not counted: the key shows, nothing scores. */
  void: boolean;
  /**
   * How many picked each: a room that shows the spread passes it (null
   * until it shows), so the tiles keep room for the counts from the start;
   * absent alone.
   */
  dist?: number[] | null;
  /** The player: the avatar in the bar and the score beside it. */
  me: { avatar: Avatar; score: number } | null;
  /** The foot's button: a noun for what comes next (the bar's vocabulary); null keeps its place, empty. */
  next: string | null;
}

const PLAY = "&#9654;";
/** The keys that press the foot's button, as on the wall (client/screen.ts). */
const NEXT_KEYS = new Set([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown", "n", "N"]);

export class DeviceScreen {
  private root: HTMLElement;
  private view: DeviceView | null = null;
  private laid = "";
  private zoomed = false;
  /** When the tiles last moved under a hand: a new question, or laid out again. */
  private laidAt = 0;
  private onAnswer: (shown: number) => void;
  private onNext: () => void;
  private live = true;

  /**
   * root: the page's main element; the device screen takes it over while it
   * shows. The page's body carries the wall's frame (classes screen and
   * steering: the full height, the foot's bar).
   */
  constructor(root: HTMLElement, on: { answer: (shown: number) => void; next: () => void }) {
    this.root = root;
    this.onAnswer = on.answer;
    this.onNext = on.next;
    root.addEventListener("click", this.click);
    document.addEventListener("keydown", this.key);
    window.addEventListener("resize", this.resize);
  }

  /** Stops listening and takes away what it put over the page (the band, the picture enlarged, the background). */
  close(): void {
    this.live = false;
    this.root.removeEventListener("click", this.click);
    document.removeEventListener("keydown", this.key);
    window.removeEventListener("resize", this.resize);
    this.leave();
  }

  /** Takes away what the screen put over the page, for a screen of the caller's own in `root` (a result). */
  leave(): void {
    endJump();
    this.zoom(false);
    backdrop(null);
    this.root.classList.remove("dscreen", "dspread");
    this.view = null;
    this.laid = "";
  }

  show(v: DeviceView): void {
    const before = this.view;
    this.view = v;
    const q = v.question;
    if (!this.root.querySelector("#stage")) {
      this.laid = "";
      this.root.classList.add("dscreen");
      this.root.innerHTML = `<div class="bar" id="qbar"><span id="qpos"></span><span class="grow"></span><span id="qicons"></span><span class="dme" id="dme"></span><span id="dscore"></span></div>
        <div class="stage" id="stage"></div>
        <div class="steerbar dbar"><span class="grow" id="dtitle"></span><button class="btn primary bar-play" type="button" id="dnext"></button></div>`;
    }
    if (before?.question.key !== q.key) this.zoom(false);
    backdrop(q.background);
    // Laid out once per question and window size: an answer only marks the tiles.
    const spread = v.dist !== undefined;
    const lay = JSON.stringify([q.key, spread, innerWidth, innerHeight]);
    const stage = this.at("#stage");
    if (lay !== this.laid) {
      this.laid = lay;
      endJump();
      this.root.classList.toggle("dspread", spread);
      layQuestion(stage, q, { buttons: true, device: true });
      this.laidAt = performance.now();
    }
    this.at("#tiles").classList.toggle("veiled", v.answering === "reading");
    this.at("#tiles").classList.toggle("open", v.answering === "open");
    markTiles(stage, { counts: v.counts, dist: v.dist ?? null, mine: v.mine });
    this.at("#qpos").textContent = `${q.n} / ${q.total}`;
    const verdict = v.void && v.counts ? `<span class="voided">${ICON.void}</span>` : v.counts && v.mine !== null ? (v.counts[v.mine] ? `<span class="dverdict right">${ICON.check}</span>` : `<span class="dverdict wrong">${ICON.cross}</span>`) : "";
    this.set("#qicons", verdict);
    this.set("#dme", v.me ? avatarSvg(v.me.avatar) : "");
    this.set("#dscore", v.me ? `${ICON.star} ${v.me.score}` : "");
    this.at("#dtitle").textContent = v.title;
    const next = this.at("#dnext") as HTMLButtonElement;
    this.set("#dnext", v.next ? `${PLAY}<span class="lbl"><span>${esc(v.next)}</span></span>` : "");
    next.style.visibility = v.next ? "" : "hidden";
    next.tabIndex = v.next ? 0 : -1;
  }

  /** These avatars jump over the question for a moment (the winners' band, client/stage.ts). */
  jump(avatars: { id: string; avatar: Avatar }[]): void {
    const stage = this.root.querySelector<HTMLElement>("#stage");
    if (stage && !this.zoomed) jump(stage, avatars);
  }

  private at(sel: string): HTMLElement {
    return this.root.querySelector<HTMLElement>(sel)!;
  }

  private set(sel: string, html: string): void {
    const el = this.at(sel);
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  private click = (e: MouseEvent): void => {
    const t = e.target as HTMLElement;
    if (!this.view) return;
    if (t.closest("#dnext")) {
      if (this.view.next) this.onNext();
      return;
    }
    if (t.closest("[data-zoom]")) {
      this.zoom(true);
      return;
    }
    const tile = t.closest<HTMLElement>("#tiles .tile");
    if (tile && this.answerable()) {
      // Focus off the tile, so Space or Enter then go on rather than press it again.
      tile.blur();
      this.onAnswer(Number(tile.dataset.i));
    }
  };

  private key = (e: KeyboardEvent): void => {
    const v = this.view;
    if (!v || !this.live || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (this.zoomed && (e.key === "Escape" || e.key === "z" || e.key === "Z")) {
      this.zoom(false);
      return;
    }
    if (e.key === "z" || e.key === "Z") {
      if (v.question.image) this.zoom(true);
      return;
    }
    // 1 to 4: the tiles in the order on screen, for a keyboard.
    const n = Number(e.key);
    if (this.answerable() && Number.isInteger(n) && n >= 1 && n <= v.question.answers.length) {
      e.preventDefault();
      this.onAnswer(n - 1);
      return;
    }
    // Space or Enter on a focused button is that button's click.
    if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (v.next && NEXT_KEYS.has(e.key)) {
      e.preventDefault();
      this.onNext();
    }
  };

  /**
   * A tap answers while answering is open, except on tiles that have just
   * appeared: it was aimed at what was there before (the second tap of a
   * double on Start, or on the button that brought the question), as on the
   * wall's steering bar (docs/design/question-flow.md, "Presses").
   */
  private answerable(): boolean {
    return this.view?.answering === "open" && performance.now() - this.laidAt >= SETTLE_MS;
  }

  private resize = (): void => {
    // The band is laid out for the old size; the question is laid out again for the new one.
    endJump();
    if (this.view && this.root.querySelector("#stage")) this.show(this.view);
    if (this.zoomed) {
      this.zoom(false);
      this.zoom(true);
    }
  };

  /** The question's picture over the whole screen, for a closer look; a tap or the next question ends it. */
  private zoom(on: boolean): void {
    const img = on ? this.view?.question.image : null;
    let el = document.getElementById("zoom");
    this.zoomed = !!img;
    if (!img) {
      el?.remove();
      return;
    }
    endJump();
    const scale = Math.min((window.innerWidth * 0.96) / img.w, (window.innerHeight * 0.94) / img.h);
    if (!el) {
      el = document.createElement("div");
      el.id = "zoom";
      el.addEventListener("click", () => this.zoom(false));
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="figure" style="width:${Math.floor(img.w * scale)}px;height:${Math.floor(img.h * scale)}px">${picImg(img.src, img.w, img.h)}</div>`;
    fillPictures(el);
  }
}
