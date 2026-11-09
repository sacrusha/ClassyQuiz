import { test } from "node:test";
import assert from "node:assert/strict";
import { Latest } from "./latest.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("a burst of taps sends the first and the latest, one at a time, with the gap between", async () => {
  const sent: { x: number; at: number }[] = [];
  const answered: number[] = [];
  const t0 = Date.now();
  const l = new Latest<number, string>(
    async (x) => {
      sent.push({ x, at: Date.now() - t0 });
      await sleep(20);
      return `ack ${x}`;
    },
    (x) => answered.push(x),
    100,
  );
  // A burst shorter than the gap.
  for (let i = 1; i <= 10; i++) l.put(i);
  assert.equal(l.idle(), false);
  await sleep(300);
  assert.deepEqual(sent.map((s) => s.x), [1, 10]);
  assert.ok(sent[1].at - sent[0].at >= 95, `the gap holds (${sent[1].at - sent[0].at} ms)`);
  assert.deepEqual(answered, [1, 10]);
  assert.equal(l.idle(), true);
});
