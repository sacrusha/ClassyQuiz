// The steering bar's presses (docs/design/question-flow.md, "Presses"): a press in flow does what
// the teacher meant; a bounce, or a press landing on a screen that just
// moved, does nothing; a deliberate double press fast-forwards, but never
// past the start of a question.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { TeacherView } from "../shared/protocol.ts";
import { BOUNCE_MS, DOUBLE_MS, Presses, SETTLE_MS, playStep, steeringButtons, type StepState } from "./steps.ts";

const base: StepState = { phase: "question", current: 0, answering: "reading", votes: false, lastCall: false, last: false, n: 1 };
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
    ["Choices", "Answers", "Answers", "Solution", "Ranking", "Question 2"],
  );
  assert.equal(playStep({ ...S.revealed, last: true })?.label, "Final ranking");
  assert.equal(playStep({ ...base, phase: "lobby", answering: null }), null);
  assert.equal(playStep({ ...base, phase: "final", answering: null }), null);
});

test("at the final ranking the bar holds Exit alone: no Play, so a press where Play was lands on nothing", () => {
  const html = steeringButtons({ phase: "final", current: 3, answering: null, votes: false, clock: null, last: true, run: null } as unknown as TeacherView);
  assert.match(html, /data-act="exit"/);
  assert.doesNotMatch(html, /data-act="(play|last-call)"/);
});

test("a press in flow steps once; a bounce is the same press", () => {
  const b = bar(S.answering);
  assert.deepEqual(b.press(10_000, S.answering), S.answering, "Answers");
  assert.equal(b.press(10_000 + BOUNCE_MS - 1, S.answering), null, "a bounce");
  // A slow line: the screen moves 300 ms after the press.
  b.view(10_300, S.locked);
  assert.equal(b.press(10_000 + DOUBLE_MS + 100, S.locked), null, "past the double, but the screen has just moved under it");
  assert.deepEqual(b.press(10_300 + SETTLE_MS + 1, S.locked), S.locked, "a press once the new screen has settled: Solution");
});

test("a deliberate double press steps twice, from where the first one leads, before or after the screen moved", () => {
  const b = bar(S.answering);
  assert.deepEqual(b.press(10_000, S.answering), S.answering);
  assert.deepEqual(b.press(10_200, S.answering), S.locked, "the screen hasn't moved yet: the second slice is the reveal, from the lock-in");
  assert.equal(b.press(10_350, S.answering), null, "a third press in the gesture does nothing");

  const c = bar(S.locked);
  c.press(10_000, S.locked);
  c.view(10_050, S.revealed);
  assert.deepEqual(c.press(10_250, S.revealed), S.revealed, "Solution then Ranking, the screen already moved for the first");

  const d = bar(S.revealed);
  d.press(10_000, S.revealed);
  assert.deepEqual(d.press(10_300, S.revealed), S.ranking, "Ranking then the next question");
});

test("never past the start of a question: from it, or onto it, a double press steps once", () => {
  const b = bar(S.question);
  assert.deepEqual(b.press(10_000, S.question), S.question, "Choices");
  assert.equal(b.press(10_200, S.question), null, "not straight on to Answers with nobody answered");

  const c = bar(S.ranking);
  assert.deepEqual(c.press(10_000, S.ranking), S.ranking, "the next question");
  assert.equal(c.press(10_200, S.ranking), null, "not straight on to the answers before anyone read the question");

  const d = bar({ ...S.revealed, last: true });
  d.press(10_000, { ...S.revealed, last: true });
  assert.equal(d.press(10_200, { ...S.revealed, last: true }), null, "nothing after the final ranking");
});

test("Countdown and Start: not a bounce, not on a screen that just moved; and Play right after them does nothing", () => {
  const b = bar(S.answering);
  assert.equal(b.other(10_000), true);
  assert.equal(b.press(10_200, S.answering), null, "an Answers press right on the heels of Countdown");
  b.view(10_050, S.lastCall);
  assert.equal(b.other(10_300), false);
  assert.deepEqual(b.press(10_050 + SETTLE_MS + 1, S.lastCall), S.lastCall, "Answers during Countdown, once settled");
});
