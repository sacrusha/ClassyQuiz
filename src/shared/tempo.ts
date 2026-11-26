/** Last call: answering locks in by itself this long after the teacher pressed it. */
export const LAST_CALL_MS = 15_000;

/**
 * Start: the first question comes this long after the press, so whoever is
 * still dressing their avatar sees the end coming and finishes.
 */
export const START_MS = 10_000;

/**
 * A right answer scores POINTS_RIGHT plus up to SPEED_BONUS more, by the
 * share of SPEED_REFERENCE_MS left when it was tapped, counted from the
 * choices appearing; whole points, so ties stay possible.
 */
export const POINTS_RIGHT = 10;
export const SPEED_BONUS = 5;
export const SPEED_REFERENCE_MS = 20_000;

export function speedBonus(ms: number): number {
  if (!(ms >= 0)) return 0;
  const left = Math.max(0, Math.min(1, 1 - ms / SPEED_REFERENCE_MS));
  return Math.round(SPEED_BONUS * left);
}
