// The class's tempo (backlog v2 items 2 and 3; docs/decisions.md, "Countdown
// and points for speed" and "The tempo by the owner's decomposition"). Off
// by default: the teacher sets the pace, and no clock presses anyone. A quiz
// can be written for a countdown ("Tempo:", "Time:"), and the teacher can
// turn one on or off in the lobby. Without designed lengths a countdown is
// the safe 60 s; during the quiz the teacher's −5/+5 shortens or lengthens
// it, from the countdown on now through every one after.
//
// The numbers live here, in one place, for a self-hoster (or us) to tilt.

/**
 * - pace: the teacher reveals when the class is ready; no clock (v1).
 * - countdown: the question first; Go shows the answers and starts the
 *   clock; time's up closes answering; the reveal stays the teacher's step.
 * - speed: as countdown, and a right answer scores more the faster it came.
 */
export type Tempo = "pace" | "countdown" | "speed";

export const TEMPOS: readonly Tempo[] = ["pace", "countdown", "speed"];

/** Every countdown is this long or shorter, in seconds, and this long without a "Time:" line: safe, if slow. */
export const COUNTDOWN_MAX = 60;
export const COUNTDOWN_DEFAULT = COUNTDOWN_MAX;
/** The shortest countdown, in seconds: time to read four short answers and tap one. */
export const COUNTDOWN_MIN = 10;
/** One press of the teacher's −5 or +5, in seconds. */
export const NUDGE_SECONDS = 5;

/** A length in seconds, held within COUNTDOWN_MIN..COUNTDOWN_MAX. */
export function clampCountdown(seconds: number): number {
  return Math.max(COUNTDOWN_MIN, Math.min(COUNTDOWN_MAX, seconds));
}

/**
 * Points for speed: a right answer scores POINTS_RIGHT plus up to
 * SPEED_BONUS more, by the share of the countdown still left when it was
 * tapped (whole points, so ties stay possible). With 10 and 5, two fast right
 * answers weigh as much as three slow ones (Kahoot's ratio: half at the
 * buzzer). A smaller bonus makes speed a tie-breaker; a larger one makes it
 * a race. Without points for speed a right answer scores 1, as in v1.
 */
export const POINTS_RIGHT = 10;
export const SPEED_BONUS = 5;

/** The speed bonus of a right answer tapped `ms` after the answers appeared, with a countdown of `clockMs`. */
export function speedBonus(ms: number, clockMs: number): number {
  if (!(clockMs > 0) || !(ms >= 0)) return 0;
  const left = Math.max(0, Math.min(1, 1 - ms / clockMs));
  return Math.round(SPEED_BONUS * left);
}
