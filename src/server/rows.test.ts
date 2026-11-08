import { test } from "node:test";
import assert from "node:assert/strict";
import { rowsAtLetIn, rowsFromStart } from "./rows.ts";
import { DAY_ROWS_FOR_CLASSES } from "../shared/limits.ts";

test("a class's booking: the most at letting in, shrinking at the start to the class that came", () => {
  const atLetIn = rowsAtLetIn(15);
  const started = rowsFromStart(25, 15);
  assert.ok(started < atLetIn / 2, `a class of 25 books far less from the start (${started} of ${atLetIn})`);
  assert.ok(rowsFromStart(60, 15) <= atLetIn, "never more than at letting in");
  // Bookings settle at the final ranking, so these are classes at the same time, not in the day.
  assert.ok(DAY_ROWS_FOR_CLASSES / started >= 20, `twenty classes of 25 can run at once (${Math.floor(DAY_ROWS_FOR_CLASSES / started)})`);
  assert.ok(DAY_ROWS_FOR_CLASSES / atLetIn >= 7, `seven lobbies can be let in at once (${Math.floor(DAY_ROWS_FOR_CLASSES / atLetIn)})`);
});
