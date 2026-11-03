// The steering bar's presses (backlog v4 item 6): a press in flow does what
// the teacher meant; a bounce, or a press landing on a screen that just
// moved, does nothing; a deliberate double press fast-forwards, but never
// past the start of a question.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BOUNCE_MS, DOUBLE_MS, Presses, SETTLE_MS, atOf, playStep, type StepState } from "./steps.ts";

const base: StepState = { phase: "question", current: 0, answering: "reading", votes: false, lastCall: false, last: false };
const S = {
  question: base,
  answering: { ...base, answering: "open" },
  lastCall: { ...base, answering: "open", lastCall: true },
  locked: { ...base, answering: "closed", votes: true },
  revealed: { ...base, phase: "reveal", answering: null },
  ranking: { ...base, phase: "ranking", answering: null },
} satisfies Record<string, StepState>;

/** A bar on a fake clock: press(t) at t ms, view(t, s) the screen moving to s at t. */
function bar(start: StepState) {
  let now = 0;
  const p = new Presses(() => now);
  p.noteView(start);
  now = 10_000;
  return {
    press: (t: number, s: StepState) => ((now = t), p.play(s)),
    view: (t: number, s: StepState) => ((now = t), p.noteView(s)),
    other: (t: number) => ((now = t), p.other()),
  };
}

test("Play's labels name where it goes; the last reveal goes to the final ranking", () => {
  assert.deepEqual(
    [S.question, S.answering, S.lastCall, S.locked, S.revealed, S.ranking].map((s) => playStep(s)?.label),
    ["Show answers", "Lock in", "Lock in", "Reveal", "Ranking", "Next"],
  );
  assert.equal(playStep({ ...S.revealed, last: true })?.label, "Final ranking");
  assert.equal(playStep({ ...base, phase: "lobby", answering: null }), null);
  assert.equal(playStep({ ...base, phase: "final", answering: null }), null);
  assert.deepEqual(atOf(S.lastCall), { phase: "question", current: 0, reading: false, votes: false, lastCall: true });
});

test("a press in flow steps once; a bounce is the same press", () => {
  const b = bar(S.answering);
  assert.deepEqual(b.press(10_000, S.answering), S.answering, "Lock in");
  assert.equal(b.press(10_000 + BOUNCE_MS - 1, S.answering), null, "a bounce");
  // A slow line: the screen moves 300 ms after the press.
  b.view(10_300, S.locked);
  assert.equal(b.press(10_000 + DOUBLE_MS + 100, S.locked), null, "past the double, but the screen has just moved under it");
  assert.deepEqual(b.press(10_300 + SETTLE_MS + 1, S.locked), S.locked, "a press once the new screen has settled: Reveal");
});

test("a deliberate double press steps twice, from where the first one leads, before or after the screen moved", () => {
  const b = bar(S.answering);
  assert.deepEqual(b.press(10_000, S.answering), S.answering);
  assert.deepEqual(b.press(10_200, S.answering), S.locked, "the screen hasn't moved yet: the second slice is the reveal, from the lock-in");
  assert.equal(b.press(10_350, S.answering), null, "a third press in the gesture does nothing");

  const c = bar(S.locked);
  c.press(10_000, S.locked);
  c.view(10_050, S.revealed);
  assert.deepEqual(c.press(10_250, S.revealed), S.revealed, "Reveal then Ranking, the screen already moved for the first");

  const d = bar(S.revealed);
  d.press(10_000, S.revealed);
  assert.deepEqual(d.press(10_300, S.revealed), S.ranking, "Ranking then Next");
});

test("never past the start of a question: from it, or onto it, a double press steps once", () => {
  const b = bar(S.question);
  assert.deepEqual(b.press(10_000, S.question), S.question, "Show answers");
  assert.equal(b.press(10_200, S.question), null, "not straight on to Lock in with nobody answered");

  const c = bar(S.ranking);
  assert.deepEqual(c.press(10_000, S.ranking), S.ranking, "Next");
  assert.equal(c.press(10_200, S.ranking), null, "not straight on to the answers before anyone read the question");

  const d = bar({ ...S.revealed, last: true });
  d.press(10_000, { ...S.revealed, last: true });
  assert.equal(d.press(10_200, { ...S.revealed, last: true }), null, "nothing after the final ranking");
});

test("Last call and Start: not a bounce, not on a screen that just moved; and Play right after them does nothing", () => {
  const b = bar(S.answering);
  assert.equal(b.other(10_000), true);
  assert.equal(b.press(10_200, S.answering), null, "a Lock in right on the heels of Last call");
  b.view(10_050, S.lastCall);
  assert.equal(b.other(10_300), false);
  assert.deepEqual(b.press(10_050 + SETTLE_MS + 1, S.lastCall), S.lastCall, "Lock in during Last call, once settled");
});
