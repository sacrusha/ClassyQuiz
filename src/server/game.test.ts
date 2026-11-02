// What must hold in front of the class: points follow the teacher's fixes,
// late or repeated answers change nothing, and the quiz can end at any point.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuiz } from "../quiz/format.ts";
import * as G from "./game.ts";

const quiz = parseQuiz(`Title: T
1. One?
+ a
- b
- c

2. Two?
- a
+ b

3. Three?
+ a
- b
`).quiz;

function setup(players = 3) {
  const g = G.newGame(quiz);
  G.startRun(g, "12345");
  let r = 0;
  const random = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const ids = Array.from({ length: players }, (_, i) => G.addPlayer(g, `p${i}`, `t${i}`, i, random).id);
  return { g, ids };
}

const score = (g: G.Game, id: string) => G.scores(g).get(id);

test("a full run: answers score at the reveal, ranking shares places on ties", () => {
  const { g, ids } = setup();
  G.begin(g, 100);
  G.answer(g, ids[0], 0, 0, 1, 0, 150);
  G.answer(g, ids[1], 0, 1, 1, 0, 160);
  assert.equal(score(g, ids[0]), 0, "nothing scores before the reveal");
  G.reveal(g, 10);
  assert.equal(score(g, ids[0]), 1);
  assert.deepEqual(G.distribution(g, 0), [1, 1, 0]);
  G.next(g, 200);
  G.answer(g, ids[0], 1, 1, 2, 0, 210);
  G.answer(g, ids[1], 1, 1, 2, 0, 220);
  G.reveal(g, 10);
  const st = G.standings(g);
  assert.deepEqual(st.map((s) => [s.id, s.score, s.place]), [["p0", 2, 1], ["p1", 1, 2], ["p2", 0, 3]]);
  G.next(g, 300);
  G.reveal(g, 10);
  G.next(g, 400);
  assert.equal(g.run!.phase, "final");
  assert.equal(g.run!.ended, 400);
});

test("changing the key after the reveal moves the points; a second right answer adds them", () => {
  const { g, ids } = setup();
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.answer(g, ids[1], 0, 1, 1, 0, 1);
  G.answer(g, ids[2], 0, 2, 1, 0, 1);
  G.reveal(g, 10);
  G.setCounts(g, 0, [false, true, false]);
  assert.deepEqual([...G.scores(g).values()], [0, 1, 0]);
  G.setCounts(g, 0, [true, true, false]);
  assert.deepEqual([...G.scores(g).values()], [1, 1, 0]);
  assert.throws(() => G.setCounts(g, 0, [false, false, false]), /void/);
});

test("voiding a question takes its points away from everyone; un-voiding brings them back", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.reveal(g, 10);
  G.setVoid(g, 0, true);
  assert.equal(score(g, ids[0]), 0);
  assert.equal(G.classResult(g).perQuestion.length, 0);
  G.setVoid(g, 0, false);
  assert.equal(score(g, ids[0]), 1);
});

test("skipping: the open question goes unscored, a future one is never shown, a seen one can't be skipped", () => {
  const { g, ids } = setup(1);
  G.setSkip(g, 2, true);
  assert.deepEqual(G.progress(g), { n: 0, total: 2 });
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.skipCurrent(g, 5);
  assert.equal(g.run!.current, 1);
  assert.deepEqual(G.progress(g), { n: 1, total: 1 });
  G.reveal(g, 10);
  assert.throws(() => G.setSkip(g, 1, true), /void it instead/);
  G.next(g, 10);
  assert.equal(g.run!.phase, "final", "question 3 was skipped, so the quiz ends");
  assert.equal(score(g, ids[0]), 0);
});

test("answers: retries and late arrivals change nothing, changing one's mind before the reveal does", () => {
  const { g, ids } = setup(1);
  G.begin(g, 1000);
  assert.equal(G.answer(g, ids[0], 0, 1, 1, 0, 1500), true);
  assert.equal(G.answer(g, ids[0], 0, 0, 2, 0, 1800), true);
  assert.equal(G.answer(g, ids[0], 0, 1, 1, 0, 1900), true, "an older retry arriving late is acknowledged…");
  assert.equal(g.run!.answers[0][ids[0]].choice, 0, "…but ignored");
  assert.equal(g.run!.answers[0][ids[0]].ms, 800);
  G.reveal(g, 10);
  assert.equal(G.answer(g, ids[0], 0, 0, 2, 0, 2000), true, "a resend whose ack was lost is confirmed after the reveal");
  assert.equal(G.answer(g, ids[0], 0, 1, 3, 10, 2000), false, "a tap on a device that already showed the reveal doesn't count");
  assert.equal(G.answer(g, ids[0], 5, 0, 4, 0, 2000), false);
  assert.equal(score(g, ids[0]), 1);
});

test("a tap the device showed before the reveal counts, however late it arrives", () => {
  const { g, ids } = setup(2);
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 3, 5);
  G.reveal(g, 10);
  assert.equal(G.answer(g, ids[1], 0, 0, 1, 9, 20), true, "tapped on view 9, the reveal came with view 10");
  assert.equal(G.answer(g, ids[0], 0, 1, 2, 9, 20), true, "a change of mind tapped before the reveal also counts");
  G.next(g, 30);
  assert.equal(G.answer(g, ids[1], 0, 1, 2, 9, 40), true, "still counts after the class moved on");
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [0, 0]);
  assert.deepEqual(G.distribution(g, 0), [0, 2, 0]);
});

test("finishing early: the unrevealed question doesn't count, also for taps arriving late", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.finish(g, 50);
  assert.equal(g.run!.phase, "final");
  assert.equal(G.answer(g, ids[0], 0, 0, 2, 0, 60), false);
  assert.equal(score(g, ids[0]), 0);
});

test("a skipped question takes no late taps", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  G.skipCurrent(g, 5);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 0, 10), false);
});

test("a removed avatar leaves the counts and the ranking", () => {
  const { g, ids } = setup(2);
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.answer(g, ids[1], 0, 0, 1, 0, 1);
  G.removePlayer(g, ids[1]);
  assert.deepEqual(G.distribution(g, 0), [1, 0, 0]);
  G.reveal(g, 10);
  assert.deepEqual(G.standings(g).map((s) => s.id), [ids[0]]);
});

test("the clicker key walks lobby → question → reveal → next", () => {
  const { g } = setup(0);
  G.advance(g, 0, 10);
  assert.equal(g.run!.phase, "question");
  G.advance(g, 1, 10);
  assert.equal(g.run!.phase, "reveal");
  G.advance(g, 2, 10);
  assert.deepEqual([g.run!.phase, g.run!.current], ["question", 1]);
});

test("avatars: the first dozen players all get different animals", () => {
  const { g } = setup(12);
  const animals = new Set(Object.values(g.run!.players).map((p) => p.avatar.a));
  assert.equal(animals.size, 12);
  const { g: big } = setup(G.ANIMAL_COUNT * G.COLOUR_COUNT);
  const combos = new Set(Object.values(big.run!.players).map((p) => `${p.avatar.a}/${p.avatar.c}`));
  assert.equal(combos.size, G.ANIMAL_COUNT * G.COLOUR_COUNT);
});

test("a question the class has moved past can't be un-skipped; ids from devices don't reach the prototype", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  G.skipCurrent(g, 1);
  assert.throws(() => G.setSkip(g, 0, false), /moved past/);
  G.removePlayer(g, "__proto__");
  assert.equal(({} as Record<string, unknown>).removed, undefined);
  assert.equal(G.answer(g, "__proto__", 1, 0, 1, 0, 2), false);
  assert.equal(G.activePlayers(g.run!).length, ids.length);
});
