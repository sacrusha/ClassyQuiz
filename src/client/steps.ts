// The steering bar (backlog v4 item 6; docs/design/question-flow.md, "The steering
// bar"): two buttons, the same size and in the same place whatever the
// state, so a hand in flow finds them. Play ▶ steps one slice and is
// labelled with where it goes: Show answers, Lock in, Reveal, Ranking,
// Next. Last call is its own button while the question is up and not yet
// locked in. The lobby has Start instead, the final ranking "Again".

import type { Answering, At, TeacherView } from "../shared/protocol.ts";
import { ICON } from "./look.ts";

/** Where the open question is, as far as the bar needs to know. */
export interface StepState {
  phase: TeacherView["phase"];
  current: number;
  answering: Answering | null;
  /** Locked in, the spread on the wall. */
  votes: boolean;
  /** Last call running. */
  lastCall: boolean;
  /** No question after this one: its reveal leads to the final ranking. */
  last: boolean;
}

export function stepState(v: TeacherView): StepState {
  return { phase: v.phase, current: v.current, answering: v.answering, votes: v.votes, lastCall: !!v.clock && v.answering === "open", last: v.last };
}

/** The state a step command names: the server takes it only from there, so a press sent twice takes one step. */
export function atOf(s: StepState): At {
  return { phase: s.phase, current: s.current, reading: s.answering === "reading", votes: s.votes, lastCall: s.lastCall };
}

const PLAY = "&#9654;";

/** Where Play goes from s: its label, and the state it leads to; null where there is no Play (lobby, final). */
export function playStep(s: StepState): { label: string; to: StepState } | null {
  const at = (to: Partial<StepState>): StepState => ({ ...s, answering: null, votes: false, lastCall: false, ...to });
  if (s.phase === "question" && s.answering === "reading") return { label: "Show answers", to: at({ answering: "open" }) };
  if (s.phase === "question" && s.answering === "open") return { label: "Lock in", to: at({ answering: "closed", votes: true }) };
  if (s.phase === "question") return { label: "Reveal", to: at({ phase: "reveal" }) };
  if (s.phase === "reveal" && s.last) return { label: "Final ranking", to: at({ phase: "final" }) };
  if (s.phase === "reveal") return { label: "Ranking", to: at({ phase: "ranking" }) };
  // The next question's index isn't needed: a double press never goes past a question's start (Presses).
  if (s.phase === "ranking") return { label: "Next", to: at({ phase: "question", current: -1, answering: "reading" }) };
  return null;
}

/** Last call is there while the question is up and not locked in; once running it waits, greyed. */
function lastCallState(s: StepState): "on" | "running" | "off" {
  if (s.phase !== "question" || s.answering === null || s.answering === "closed") return "off";
  return s.lastCall ? "running" : "on";
}

/**
 * The two buttons, for the Remote's bottom bar and the wall's steering bar:
 * Last call, then Play. Both always drawn, so neither moves: Last call is
 * kept invisible where it doesn't apply.
 */
export function steeringButtons(v: TeacherView): string {
  const s = stepState(v);
  if (v.phase === "lobby") return `<button class="btn primary bar-play" data-act="begin">Start quiz ${PLAY}</button>`;
  if (v.phase === "final") return `<button class="btn primary bar-play" data-act="again">Again with another class</button>`;
  const lc = lastCallState(s);
  const play = playStep(s);
  return `<button class="btn bar-last${lc === "running" ? " running" : ""}" data-act="last-call"${lc === "off" ? ' style="visibility:hidden" tabindex="-1" aria-hidden="true"' : ""}${lc === "running" ? " disabled" : ""}>${ICON.timer}<span>Last call</span></button>
    <button class="btn primary bar-play" data-act="play"${play ? "" : " disabled"}>${PLAY}<span>${play ? play.label : ""}</span></button>`;
}

/**
 * Presses of the bar, by mouse, finger, keyboard or clicker: a teacher's
 * press in flow does what they meant; a bounce, or a press landing on a
 * screen that has just moved, does nothing; a deliberate double press
 * fast-forwards (docs/design/question-flow.md, "Presses").
 *
 * - A press within BOUNCE_MS of the last one is the same press: a bouncing
 *   key or a clicker sending twice. Nobody presses twice that fast.
 * - A second press within DOUBLE_MS of the first is a double: one gesture,
 *   made before the screen moved for the first. It steps one more slice,
 *   from where the first press leads (the server takes it only from there).
 *   Not past the start of a question: a double whose first press showed the
 *   answers, or brought up the next question, steps once; a second slice
 *   there (Lock in with nobody answered, or the answers before anyone read
 *   the question) is never wanted. One double is two slices; a third press
 *   in it does nothing.
 * - Otherwise a press within SETTLE_MS of the screen moving does nothing:
 *   aimed at what was there before (the screen moved for the press before,
 *   or by itself: Last call locking in), or a hand that hasn't seen the new
 *   state. Counted from the view arriving, not from the press: on a slow
 *   line the screen moves late, and that is when it misleads.
 */
export const BOUNCE_MS = 80;
export const DOUBLE_MS = 450;
export const SETTLE_MS = 400;

export class Presses {
  private stepKey = "";
  private movedAt = 0;
  private last: { at: number; to: StepState | null; second: boolean; stops: boolean } | null = null;
  private now: () => number;

  constructor(now: () => number = () => performance.now()) {
    this.now = now;
  }

  /** Every view: when the step on screen changes, the moment is noted. */
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
