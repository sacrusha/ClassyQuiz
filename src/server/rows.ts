// The most rows a class can write, for its booking of the day's allowance
// (docs/design/hosting-and-limits.md, "Running classes finish"). Every write
// of the instance stores its meta with what changed, so a stored change is
// two rows; the caps that bound the changes are in shared/limits.ts and
// shared/looks.ts.

import { MAX_ANSWER_CHANGES, MAX_LATE_JOINERS, MAX_PLAYERS } from "../shared/limits.ts";
import { MAX_LOOK_CHANGES } from "../shared/looks.ts";

/** A student's answers to one question: the first and each change of mind. */
const PER_ANSWER = 2 * (1 + MAX_ANSWER_CHANGES);
/** A student in the lobby: the join, every change of look, and a few avatars taken back. */
const PER_PLAYER_LOBBY = 2 + 2 * MAX_LOOK_CHANGES + 4;
/** A student once under way: a join as a latecomer, or a few avatars taken back. */
const PER_PLAYER_RUN = 6;
/** The teacher's steps through one question, a fix or two among them. */
const PER_QUESTION_STEPS = 20;
/** Roles taken, the speed switch, removals. */
const FIXED = 50;

/** Letting the class in: the class isn't known yet, so the most players a class can have. */
export function rowsAtLetIn(questions: number): number {
  return FIXED + questions * PER_QUESTION_STEPS + MAX_PLAYERS * (PER_PLAYER_LOBBY + questions * PER_ANSWER);
}

/** From the start on: the looks are fixed, the class is there, and the door lets in a few more. */
export function rowsFromStart(players: number, questions: number): number {
  const p = Math.min(MAX_PLAYERS, players + MAX_LATE_JOINERS);
  return FIXED + questions * PER_QUESTION_STEPS + p * (PER_PLAYER_RUN + questions * PER_ANSWER);
}
