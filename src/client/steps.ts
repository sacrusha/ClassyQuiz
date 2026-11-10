// The steering bar's buttons and the rules for presses
// (docs/design/question-flow.md, "The steering bar" and "Presses").

import type { Answering, At, TeacherView } from "../shared/protocol.ts";
import { ICON } from "./look.ts";
import { T } from "./room-text.ts";

export interface StepState {
  phase: TeacherView["phase"];
  current: number;
  answering: Answering | null;
  /** Locked in, the spread on the wall. */
  votes: boolean;
  lastCall: boolean;
  /** No question after this one: its reveal leads to the final ranking. */
  last: boolean;
  /** The current question's number among those shown (1-based; 0 before the first). */
  n: number;
}

export function stepState(v: TeacherView): StepState {
  return { phase: v.phase, current: v.current, answering: v.answering, votes: v.votes, lastCall: !!v.clock && v.answering === "open", last: v.last, n: v.run?.n ?? 0 };
}

/** The state a step command names: the server takes it only from there, so a press sent twice takes one step. */
export function atOf(s: StepState): At {
  return { phase: s.phase, current: s.current, reading: s.answering === "reading", votes: s.votes, lastCall: s.lastCall };
}

const PLAY = "&#9654;";

/**
 * Where Play goes from s: its label, a small line where the step has a
 * consequence the label doesn't name, and the state it leads to; null where
 * there is no Play (lobby, final). Labels are nouns for what the class sees
 * next, in the bar's vocabulary: choices (the tiles), answers (what the class
 * tapped), solution (the key) (docs/design/question-flow.md, "The steering bar").
 */
export function playStep(s: StepState): { label: string; note?: string; to: StepState } | null {
  const at = (to: Partial<StepState>): StepState => ({ ...s, answering: null, votes: false, lastCall: false, ...to });
  if (s.phase === "question" && s.answering === "reading") return { label: T.choices, to: at({ answering: "open" }) };
  if (s.phase === "question" && s.answering === "open") return { label: T.answers, note: T.closesAnswering, to: at({ answering: "closed", votes: true }) };
  if (s.phase === "question") return { label: T.solution, to: at({ phase: "reveal" }) };
  if (s.phase === "reveal" && s.last) return { label: T.finalRanking, to: at({ phase: "final" }) };
  if (s.phase === "reveal") return { label: T.ranking, to: at({ phase: "ranking" }) };
  // The next question's index isn't needed: a double press never goes past a question's start (Presses).
  // Its number is: skipped questions aren't counted, as on the wall's "4 / 12".
  if (s.phase === "ranking") return { label: T.question(s.n + 1), to: at({ phase: "question", current: -1, answering: "reading", n: s.n + 1 }) };
  return null;
}

/** Countdown (`lastCall`) is there while the question is up and not locked in; once running it waits, greyed. */
function lastCallState(s: StepState): "on" | "running" | "off" {
  if (s.phase !== "question" || s.answering === null || s.answering === "closed") return "off";
  return s.lastCall ? "running" : "on";
}

/**
 * The two buttons, for the Remote's bottom bar and the wall's steering bar:
 * Countdown, then Play. Both always drawn, so neither moves: Countdown is
 * kept invisible where it doesn't apply. At the final ranking only Exit, in
 * the middle of the bar: where Play was, a press lands on nothing
 * (docs/design/question-flow.md, "The steering bar").
 */
export function steeringButtons(v: TeacherView): string {
  const s = stepState(v);
  if (v.phase === "lobby") return `<button class="btn primary bar-play" data-act="begin">${T.startQuiz}&nbsp;${PLAY}</button>`;
  if (v.phase === "final") return `<button class="btn bar-exit" data-act="exit"><span class="lbl"><span>${T.exit}</span><small>${T.exitNote}</small></span></button>`;
  const lc = lastCallState(s);
  const play = playStep(s);
  const label = (text: string, note?: string) => `<span class="lbl"><span>${text}</span>${note ? `<small>${note}</small>` : ""}</span>`;
  return `<button class="btn bar-last${lc === "running" ? " running" : ""}" data-act="last-call"${lc === "off" ? ' style="visibility:hidden" tabindex="-1" aria-hidden="true"' : ""}${lc === "running" ? " disabled" : ""}>${ICON.timer}${label(T.countdown, T.countdownNote)}</button>
    <button class="btn primary bar-play" data-act="play"${play ? "" : " disabled"}>${PLAY}${label(play ? play.label : "", play?.note)}</button>`;
}

/** Presses closer than this are one press (a bouncing key, a clicker sending its code twice). */
export const BOUNCE_MS = 80;
/** A second press within this is a deliberate double: one more slice, never past a question's start. */
export const DOUBLE_MS = 450;
/** A press this soon after the screen moved was aimed at the previous screen; counted from the view arriving, not from the press. */
export const SETTLE_MS = 400;

// docs/design/question-flow.md, "Presses".
export class Presses {
  private stepKey = "";
  private movedAt = 0;
  private last: { at: number; to: StepState | null; second: boolean; stops: boolean } | null = null;
  private now: () => number;

  constructor(now: () => number = () => performance.now()) {
    this.now = now;
  }

  noteView(s: StepState): void {
    const key = `${s.phase}|${s.current}|${s.answering}|${s.votes}|${s.lastCall}`;
    if (key === this.stepKey) return;
    this.stepKey = key;
    this.movedAt = this.now();
  }

  /** Play pressed on state s: the state to step from, or null for nothing. */
  play(s: StepState): StepState | null {
    const now = this.now();
    const last = this.last;
    if (last && now - last.at < BOUNCE_MS) return null;
    if (last && now - last.at <= DOUBLE_MS) {
      // The second press of a double: one more slice, from where the first leads.
      if (last.second || last.stops || !last.to) return null;
      const step = playStep(last.to);
      if (!step) return null;
      this.last = { at: now, to: step.to, second: true, stops: true };
      return last.to;
    }
    if (now - this.movedAt < SETTLE_MS) return null;
    const step = playStep(s);
    if (!step) return null;
    const question = (x: StepState) => x.phase === "question" && x.answering === "reading";
    this.last = { at: now, to: step.to, second: false, stops: question(s) || question(step.to) };
    return s;
  }

  /** Another step (Last call, Start): not a bounce, not on a screen that just moved. */
  other(): boolean {
    const now = this.now();
    if (this.last && now - this.last.at < DOUBLE_MS) return false;
    if (now - this.movedAt < SETTLE_MS) return false;
    this.last = { at: now, to: null, second: false, stops: true };
    return true;
  }
}
