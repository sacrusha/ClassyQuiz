// The question on a player's own device where no wall shows it (Solo,
// Peers), laid out as the wall lays it out (client/stage.ts). The foot's
// button and Countdown keep their place, invisible, when there is none, so a
// double tap never lands on something new.

import type { Answering, Avatar, ImageRef } from "../shared/protocol.ts";
import { esc } from "./dom.ts";
import { ICON, avatarSvg } from "./look.ts";
import { fillPictures, picImg } from "./pictures.ts";
import { backdrop, endJump, jump, layQuestion, markTiles, type StageQuestion } from "./stage.ts";
import { edgeBar } from "./clock.ts";
import { DOUBLE_MS, SETTLE_MS } from "./steps.ts";
import { T } from "./room-text.ts";

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
  /**
   * A room's tap still on its way: outlined dashed until the room has it
   * stored.
   */
  sending?: boolean;
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
  /** The foot's button's label; null keeps its place, empty. */
  next: string | null;
  /** Beside the foot's button, as HTML, in place of the title: what a room waits for. */
  foot?: string;
  /**
   * Countdown, left of the foot's button, for a room that has one (absent:
   * no place for it). null keeps its place, invisible; without `running` a
   * press starts it; running, it is greyed with the avatar of whoever
   * started it, and its bar drains along the top edge.
   */
  countdown?: { note: string; running: { key: string; ms: number; leftMs: number; by: Avatar } | null } | null;
  /** In the top bar, as HTML, in place of the player's avatar and score: how a room stands. */
  standing?: string;
  /** A ⋯ at the end of the top bar, for a room's own menu. */
  menu?: boolean;
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
  private onMenu: (() => void) | undefined;
  private onCountdown: (() => void) | undefined;
  /** When Countdown last became pressable, and when the foot's button was last pressed: a press soon after either isn't meant for Countdown. */
  private countdownAt = 0;
  private nextAt = 0;
  private live = true;

  /**
   * root: the page's main element; the device screen takes it over while it
   * shows. The page's body carries the wall's frame (classes screen and
   * steering: the full height, the foot's bar).
   */
  constructor(root: HTMLElement, on: { answer: (shown: number) => void; next: () => void; menu?: () => void; countdown?: () => void }) {
    this.root = root;
    this.onAnswer = on.answer;
    this.onNext = on.next;
    this.onMenu = on.menu;
    this.onCountdown = on.countdown;
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
    edgeBar("", null);
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
      this.root.innerHTML = `<div class="bar" id="qbar"><span id="qpos"></span><span class="grow"></span><span id="qicons"></span><span class="dstand" id="dstand"></span><span class="dme" id="dme"></span><span id="dscore"></span><button class="dmenu" id="dmenu" type="button" aria-label="${T.menu}" hidden>&#8943;</button></div>
        <div class="stage" id="stage"></div>
        <div class="steerbar dbar"><span class="grow" id="dtitle"></span><button class="btn bar-last" type="button" id="dlast" hidden></button><button class="btn primary bar-play" type="button" id="dnext"></button></div>`;
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
    stage.querySelectorAll("#tiles .tile").forEach((t, i) => t.classList.toggle("sending", !!v.sending && i === v.mine));
    this.at("#qpos").textContent = `${q.n} / ${q.total}`;
    const verdict = v.void && v.counts ? `<span class="voided">${ICON.void}</span>` : v.counts && v.mine !== null ? (v.counts[v.mine] ? `<span class="dverdict right">${ICON.check}</span>` : `<span class="dverdict wrong">${ICON.cross}</span>`) : "";
    this.set("#qicons", verdict);
    const own = v.me && v.standing === undefined ? v.me : null;
    this.set("#dme", own ? avatarSvg(own.avatar) : "");
    this.set("#dscore", own ? `${ICON.star} ${own.score}` : "");
    this.set("#dstand", v.standing ?? "");
    this.set("#dtitle", v.foot ?? esc(v.title));
    this.at("#dmenu").hidden = !v.menu;
    const next = this.at("#dnext") as HTMLButtonElement;
    this.set("#dnext", v.next ? `${PLAY}<span class="lbl"><span>${esc(v.next)}</span></span>` : "");
    next.style.visibility = v.next ? "" : "hidden";
    next.tabIndex = v.next ? 0 : -1;
    this.renderCountdown(v.countdown, before?.countdown);
  }

  private renderCountdown(c: DeviceView["countdown"], before: DeviceView["countdown"]): void {
    const btn = this.at("#dlast") as HTMLButtonElement;
    btn.hidden = c === undefined;
    const run = c?.running ?? null;
    if (c && !run && !(before && !before.running)) this.countdownAt = performance.now();
    btn.style.visibility = c ? "" : "hidden";
    btn.tabIndex = c && !run ? 0 : -1;
    btn.disabled = !!run;
    btn.classList.toggle("running", !!run);
    this.set("#dlast", c ? `${run ? `<span class="dby">${avatarSvg(run.by)}</span>` : ICON.timer}<span class="lbl"><span>${T.countdown}</span><small>${esc(c.note)}</small></span>` : "");
    edgeBar(run?.key ?? "", run);
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
      this.nextAt = performance.now();
      if (this.view.next) this.onNext();
      return;
    }
    if (t.closest("#dlast")) {
      // Not the second tap of a double on the foot's button, nor one aimed at
      // what was there before Countdown came.
      const now = performance.now();
      if (this.view.countdown && !this.view.countdown.running && now - this.nextAt > DOUBLE_MS && now - this.countdownAt >= SETTLE_MS) this.onCountdown?.();
      return;
    }
    if (t.closest("#dmenu")) {
      this.onMenu?.();
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
      this.nextAt = performance.now();
      this.onNext();
    }
  };

  /**
   * A tap answers while answering is open, except on tiles that have just
   * appeared: it was aimed at what was there before (the second tap of a
   * double on Start, or on the button that brought the question), as on the
   * wall's steering bar.
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
