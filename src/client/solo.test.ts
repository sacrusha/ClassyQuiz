// Solo plays the quiz as the local check left it, with the key after each
// answer and the result as right out of the questions that counted; what it
// hands the player's AI names every question played, the answer chosen and
// the solution (docs/design/solo.md).

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuiz } from "../quiz/format.ts";
import * as G from "../server/game.ts";
import { newSoloRun, soloAnswer, soloForAi, soloMine, soloNext, soloQuestion, soloResult, soloStart } from "./solo.ts";

const quiz = parseQuiz(`Title: Halves

1. Half of 10?
+ 5
- 4

2. Half of 8?
+ 4
- 3

3. Half of 6?
- 2
+ 3

4. Half of 4?
+ 2
- 1
`).quiz;

let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** Answers each question shown by its text, as the screen orders it; returns the questions in the order they came. */
function play(g: G.Game, pick: (q: number) => string): number[] {
  const seen: number[] = [];
  soloStart(g, 0);
  for (let now = 1; ; now++) {
    const sq = soloQuestion(g);
    if (!sq) return seen;
    seen.push(sq.q);
    const texts = sq.order.map((i) => quiz.questions[sq.q].answers[i].text);
    const shown = texts.indexOf(pick(sq.q));
    const key = soloAnswer(g, shown, now);
    assert.ok(key, "the key follows the answer at once");
    assert.equal(soloMine(g), shown);
    assert.equal(key.counts.filter(Boolean).length >= 1, true);
    soloNext(g, now);
  }
}

test("Solo plays the quiz as the check left it: skipped, changed and not-counted questions", () => {
  const fixes = G.newGame(quiz).fixes;
  fixes[1].skip = true; // never comes up
  fixes[2].counts = [true, false]; // "2" now counts for half of 6
  fixes[3].void = true; // shown, scores nothing
  const g = newSoloRun(quiz, fixes, random, 0);
  const seen = play(g, (q) => ({ 0: "5", 2: "2", 3: "2" })[q] ?? "");
  assert.deepEqual(seen, [0, 2, 3]);
  assert.deepEqual(soloResult(g), { right: 2, of: 2, each: [true, true] });
});

test("a wrong answer scores nothing, and the result counts every question played", () => {
  const g = newSoloRun(quiz, G.newGame(quiz).fixes, random, 0);
  play(g, (q) => ["4", "4", "2", "2"][q]);
  assert.deepEqual(soloResult(g), { right: 2, of: 4, each: [false, true, false, true] });
});

test("again: a new run keeps the avatar and starts from the first question", () => {
  const first = newSoloRun(quiz, G.newGame(quiz).fixes, random, 0);
  const avatar = { ...first.run!.players.me.avatar, h: 2 };
  const again = newSoloRun(quiz, G.newGame(quiz).fixes, random, 0, avatar);
  assert.deepEqual(again.run!.players.me.avatar, avatar);
  soloStart(again, 0);
  assert.equal(soloQuestion(again)?.n, 1);
});

test("the text for the AI names each question played, the answer chosen and the solution", () => {
  const fixes = G.newGame(quiz).fixes;
  fixes[1].skip = true;
  const g = newSoloRun(quiz, fixes, random, 0);
  play(g, (q) => ["4", "", "3", "2"][q]);
  const text = soloForAi(g);
  assert.match(text, /Halves/);
  assert.match(text, /2 of 3 right/);
  assert.match(text, /Half of 10\?\n\s+I chose: 4, wrong\n\s+Solution: 5/);
  assert.match(text, /Half of 6\?\n\s+I chose: 3, right\n\s+Solution: 3/);
  assert.doesNotMatch(text, /Half of 8/);
});
