// The own-copy line's count of full days (backlog v4 item 4).

import { test } from "node:test";
import assert from "node:assert/strict";
import { countFull, dayOf } from "./fulldays.ts";

const now = Date.UTC(2026, 10, 3, 23, 30);

test("full days are counted over the last 30, today included", () => {
  assert.equal(dayOf(now), "2026-11-03");
  const keys = ["f:2026-10-04", "f:2026-10-05", "f:2026-11-01", "f:2026-11-03"];
  // 2026-10-05 is the 30th day back counting today; 10-04 is the 31st.
  assert.equal(countFull(keys, now), 3);
  assert.equal(countFull([], now), 0);
  assert.equal(countFull(["f:2026-11-04"], now), 0);
});
