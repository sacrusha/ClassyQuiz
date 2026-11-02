// The class's tempo (backlog v2 items 2 and 3; docs/decisions.md, "Countdown
// and points for speed"). Off by default: the teacher sets the pace, and no
// clock presses anyone. A class that wants game-show energy turns on the
// countdown, with or without points for speed, in the lobby.
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

/** The countdown lengths a teacher picks from, in seconds. */
export const COUNTDOWN_CHOICES: readonly number[] = [10, 20, 30, 60];
export const COUNTDOWN_DEFAULT = 20;

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
