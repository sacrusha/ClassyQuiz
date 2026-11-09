import { test } from "node:test";
import assert from "node:assert/strict";
import { rowsAtLetIn, rowsFromStart } from "./rows.ts";
import { DAY_ROWS_FOR_CLASSES } from "../shared/limits.ts";

// Bookings settle at the final ranking, so these are classes at the same
// time, not in the day. The owner, 2026-11-09: about 60 at once is plenty.
test("a class's booking: sixty classes fit at once, let in or started", () => {
  const atLetIn = rowsAtLetIn(15);
  assert.ok(DAY_ROWS_FOR_CLASSES / atLetIn >= 60, `sixty lobbies can be let in at once (${Math.floor(DAY_ROWS_FOR_CLASSES / atLetIn)})`);
  assert.ok(rowsFromStart(60, 15) <= atLetIn, "a started class never books more than at letting in");
  assert.ok(rowsFromStart(25, 15) < atLetIn, "a class of 25 books less from the start");
});
