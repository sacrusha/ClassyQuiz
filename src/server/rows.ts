// The most rows a class can write, for its booking of the day's allowance
// (docs/design/hosting-and-limits.md, "Running classes finish"). Every write
// of the instance stores its meta with what changed, so a stored change is
// two rows. Answers and looks are held in memory and ride on the writes
// counted here (docs/design/open-period-in-memory.md), so a class books
// writes, not taps.

import { MAX_LATE_JOINERS, MAX_LINE_WRITES, MAX_PLAYERS } from "../shared/limits.ts";

/** A student in the lobby: the join, and a few avatars taken back. */
const PER_PLAYER_LOBBY = 6;
/** A student once under way: a join as a latecomer, or a few avatars taken back. */
const PER_PLAYER_RUN = 6;
/**
 * The steps through one question, a fix or two among them, and the alarms
 * they set; in a Peers room the room's own steps and its rechecks of who is
 * away.
 */
const PER_QUESTION_STEPS = 20;
/** Writes because a line ended with input held unwritten, per stage (the lobby, each question). */
const PER_STAGE_LINES = 2 * MAX_LINE_WRITES;
/** Roles taken, the speed switch, removals. */
const FIXED = 50;

/** Letting the class in (a Peers room: opening it): the class isn't known yet, so the most players a class can have. */
export function rowsAtLetIn(questions: number): number {
  return FIXED + PER_STAGE_LINES + questions * (PER_QUESTION_STEPS + PER_STAGE_LINES) + MAX_PLAYERS * PER_PLAYER_LOBBY;
}

/** From the start on: the lobby is behind, the class is there, and the door lets in a few more. */
export function rowsFromStart(players: number, questions: number): number {
  const p = Math.min(MAX_PLAYERS, players + MAX_LATE_JOINERS);
  return FIXED + questions * (PER_QUESTION_STEPS + PER_STAGE_LINES) + p * PER_PLAYER_RUN;
}
