// The teacher's pace (backlog v4 item 6; docs/design/question-flow.md, "The steering
// bar"). Every question steps through the same states, each by the
// teacher's press: the question with its answers hidden, answering, locked
// with the spread on the wall, revealed, the ranking. Last call is the one
// clock: a fixed fifteen seconds, then answering locks in by itself. Points
// for speed are a switch the teacher sets on the join screen.
//
// The numbers live here, in one place, for a self-hoster (or us) to tilt.

/** Last call: answering locks in by itself this long after the teacher pressed it. */
export const LAST_CALL_MS = 15_000;

/**
 * Points for speed: a right answer scores POINTS_RIGHT plus up to
 * SPEED_BONUS more, by the share of SPEED_REFERENCE_MS still left when it was
 * tapped, counted from the answers appearing (whole points, so ties stay
 * possible). With 10 and 5, two fast right answers weigh as much as three
 * slow ones (Kahoot's ratio: half at the buzzer). A smaller bonus makes speed
 * a tie-breaker; a larger one makes it a race. Without points for speed a
 * right answer scores 1, as in v1.
 *
 * The reference is fixed rather than the question's own time: the teacher's
 * pace has no length to measure against, and Last call starts whenever the
 * teacher presses it. Twenty seconds is the old countdown's default length:
 * a tap after it still scores POINTS_RIGHT, just no bonus.
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
