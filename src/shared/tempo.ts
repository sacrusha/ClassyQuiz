// The teacher's pace and the points for speed (docs/design/question-flow.md).
// The numbers live here, in one place, for a self-hoster to tilt.

/** Last call: answering locks in by itself this long after the teacher pressed it. */
export const LAST_CALL_MS = 15_000;

/**
 * A right answer scores POINTS_RIGHT plus up to SPEED_BONUS more, by the
 * share of SPEED_REFERENCE_MS still left when it was tapped, counted from the
 * answers appearing (whole points, so ties stay possible); a tap after the
 * reference gets no bonus. Why these numbers, and why the reference is fixed
 * rather than the question's own time: docs/design/question-flow.md, "Scoring".
 */
export const POINTS_RIGHT = 10;
export const SPEED_BONUS = 5;
export const SPEED_REFERENCE_MS = 20_000;

/** The speed bonus of a right answer tapped `ms` after the answers appeared. */
export function speedBonus(ms: number): number {
  if (!(ms >= 0)) return 0;
  const left = Math.max(0, Math.min(1, 1 - ms / SPEED_REFERENCE_MS));
  return Math.round(SPEED_BONUS * left);
}
