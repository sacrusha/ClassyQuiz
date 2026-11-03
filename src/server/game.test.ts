// What must hold in front of the class: points follow the teacher's fixes,
// late or repeated answers change nothing, and the quiz can end at any point.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuiz } from "../quiz/format.ts";
import * as G from "./game.ts";
import { speedBonus } from "../shared/tempo.ts";
import { BACKGROUND_COUNT, HAT_COUNT, MAX_LOOK_CHANGES } from "../shared/looks.ts";
import { LOOK_DRAWINGS, avatarSvg } from "../client/look.ts";

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

/** seconds: the quiz's "Time:" for every question (none: the safe 60 s). */
function setup(players = 3, seconds?: number) {
  const g = G.newGame(seconds ? { ...quiz, seconds } : quiz);
  G.startRun(g, "12345", "r1");
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

test("the clicker key walks lobby → question → votes → reveal → next", () => {
  const { g } = setup(0);
  G.advance(g, 0, 10);
  assert.equal(g.run!.phase, "question");
  G.advance(g, 1, 10);
  assert.deepEqual([g.run!.phase, G.votesShown(g)], ["question", true]);
  G.advance(g, 2, 11);
  assert.equal(g.run!.phase, "reveal");
  G.advance(g, 3, 12);
  assert.deepEqual([g.run!.phase, g.run!.current, G.votesShown(g)], ["question", 1, false], "the next question opens without its votes");
});

// ---------------------------------------------------------------------------
// Spread, then key (backlog v2 item 6)

test("votes: answering closes without the key; a tap made before still counts; the reveal adds the key", () => {
  const { g, ids } = setup(3);
  G.begin(g, 0);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 5, 100), true);
  G.showVotes(g, 7);
  assert.equal(g.run!.phase, "question", "the votes are not the reveal");
  assert.equal(G.answering(g), "closed");
  assert.deepEqual(G.distribution(g, 0), [1, 0, 0]);
  assert.equal(G.answer(g, ids[1], 0, 1, 1, 6, 200), true, "tapped on a view that still showed the answers open: counts");
  assert.deepEqual(G.distribution(g, 0), [1, 1, 0], "and joins the votes on the wall");
  assert.equal(G.answer(g, ids[2], 0, 0, 1, 7, 300), false, "tapped once the device showed the votes: doesn't");
  assert.equal(G.answer(g, ids[0], 0, 2, 2, 7, 300), false, "nor a change of mind");
  assert.equal(score(g, ids[0]), 0, "nothing scores before the key");
  G.showVotes(g, 8);
  assert.equal(g.run!.closedView![0], 7, "a second press changes nothing");
  G.reveal(g, 9);
  assert.equal(g.run!.phase, "reveal");
  assert.equal(g.run!.closedView![0], 7, "the reveal keeps the votes' view");
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [1, 0]);
});

test("votes: not while the class reads; the reveal straight from the question still works (a page from before the votes)", () => {
  const { g } = setup(1);
  G.setTempo(g, "countdown");
  G.begin(g, 0);
  assert.throws(() => G.showVotes(g, 1), G.GameError);
  G.go(g, 10);
  G.reveal(g, 2);
  assert.equal(g.run!.phase, "reveal");
  assert.throws(() => G.showVotes(g, 3), G.GameError, "no votes after the key");
});

test("votes during a countdown: the clock stops, it can't be reopened, the −5/+5 moves to the next question", () => {
  const { g, ids } = setup(2, 20);
  G.setTempo(g, "speed");
  G.begin(g, 0);
  G.go(g, 0);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 1, 4000, 4000), true);
  G.showVotes(g, 5);
  assert.equal(G.deadline(g), null, "no time's up after the votes");
  assert.equal(G.runningClock(g), null);
  assert.throws(() => G.stopClock(g), G.GameError, "answering again after the votes would copy the majority");
  assert.equal(G.nudgeTarget(g)?.q, 1);
  G.reveal(g, 6);
  assert.equal(score(g, ids[0]), 10 + speedBonus(4000, 20_000), "the clock's length still sets the bonus");
});

test("votes, then the final ranking now: a question whose key wasn't shown doesn't count", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 1, 10);
  G.showVotes(g, 2);
  G.finish(g, 20);
  assert.equal(score(g, ids[0]), 0);
});

test("winners: who got it right, in the lobby's order; a fix of the key moves them, a void clears them", () => {
  const { g, ids } = setup(4);
  G.begin(g, 100);
  // Answers arrive in another order than the class joined.
  G.answer(g, ids[3], 0, 0, 1, 0, 150);
  G.answer(g, ids[1], 0, 1, 1, 0, 160);
  G.answer(g, ids[0], 0, 0, 1, 0, 170);
  assert.deepEqual(G.winners(g, 0), ["p0", "p3"], "the lobby's order");
  G.reveal(g, 10);
  assert.deepEqual(G.winners(g, 0), ["p0", "p3"]);
  G.setCounts(g, 0, [true, true, false]);
  assert.deepEqual(G.winners(g, 0), ["p0", "p1", "p3"], "a second right answer adds its children");
  G.removePlayer(g, ids[3]);
  assert.deepEqual(G.winners(g, 0), ["p0", "p1"], "a removed avatar doesn't jump");
  G.setVoid(g, 0, true);
  assert.deepEqual(G.winners(g, 0), [], "a void question has no winners");
  G.next(g, 200);
  G.reveal(g, 10);
  assert.deepEqual(G.winners(g, 1), [], "nobody answered");
});

test("avatars: the first dozen players all get different animals", () => {
  const { g } = setup(12);
  const animals = new Set(Object.values(g.run!.players).map((p) => p.avatar.a));
  assert.equal(animals.size, 12);
  // A full class (MAX_PLAYERS, below the 96 combinations) gets no two alike.
  const { g: big } = setup(G.MAX_PLAYERS);
  const combos = new Set(Object.values(big.run!.players).map((p) => `${p.avatar.a}/${p.avatar.c}`));
  assert.equal(combos.size, G.MAX_PLAYERS);
});

test("dressing: a look in the lobby, whole, the same for anyone, fixed at Start", () => {
  const { g, ids } = setup(3);
  const before = { ...g.run!.players[ids[0]].avatar };
  assert.equal(G.dress(g, ids[0], 2, 1), "stored");
  const av = g.run!.players[ids[0]].avatar;
  // The animal and its colour, which tell the children apart, stay.
  assert.deepEqual(av, { a: before.a, c: before.c, b: 2, h: 1 });
  // Not scarce: a classmate may wear the same.
  assert.equal(G.dress(g, ids[1], 2, 1), "stored");
  // A resend, or the same look again, stores nothing.
  assert.equal(G.dress(g, ids[0], 2, 1), "same");
  assert.equal(g.run!.players[ids[0]].looks, 1);
  // Back to the disc without a hat: the fields go.
  assert.equal(G.dress(g, ids[0], 0, 0), "stored");
  assert.deepEqual(g.run!.players[ids[0]].avatar, { a: before.a, c: before.c });
  // Only what the menu has.
  for (const [b, h] of [[6, 0], [0, 9], [-1, 0], [1.5, 0], ["1", 0], [null, 0]] as [unknown, unknown][]) assert.equal(G.dress(g, ids[0], b, h), "refused");
  assert.equal(G.dress(g, "nobody", 1, 1), "refused");
  // Not for a removed avatar.
  G.removePlayer(g, ids[2]);
  assert.equal(G.dress(g, ids[2], 1, 1), "refused");
  // Fixed at Start.
  G.begin(g, 100);
  assert.equal(G.dress(g, ids[1], 3, 3), "refused");
  assert.deepEqual(g.run!.players[ids[1]].avatar.b, 2);
});

test("dressing: a child who hammers the pictures stops at MAX_LOOK_CHANGES", () => {
  const { g, ids } = setup(1);
  let stored = 0;
  for (let i = 0; i < MAX_LOOK_CHANGES + 10; i++) if (G.dress(g, ids[0], i % 2, 1) === "stored") stored++;
  assert.equal(stored, MAX_LOOK_CHANGES);
  // The look that counts is the last one stored, and its same again is still fine.
  const av = g.run!.players[ids[0]].avatar;
  assert.equal(G.dress(g, ids[0], av.b ?? 0, av.h ?? 0), "same");
});

test("dressing: every look has a drawing", () => {
  assert.deepEqual(LOOK_DRAWINGS, { backgrounds: BACKGROUND_COUNT, hats: HAT_COUNT, seats: G.ANIMAL_COUNT, animals: G.ANIMAL_COUNT });
  // Every combination draws, inside the picture.
  for (let a = 0; a < G.ANIMAL_COUNT; a++)
    for (let b = 0; b < BACKGROUND_COUNT; b++)
      for (let h = 0; h < HAT_COUNT; h++) {
        const svg = avatarSvg({ a, c: 0, b, h });
        assert.match(svg, /^<svg class="avatar" viewBox="0 0 100 100"/);
        assert.doesNotMatch(svg, /undefined|NaN/);
      }
});

test("the door: a class takes MAX_PLAYERS, removed ones included, and a few late joiners once under way", () => {
  const { g, ids } = setup(G.MAX_PLAYERS - 1);
  G.removePlayer(g, ids[0]);
  G.addPlayer(g, "last", "tl", 1, Math.random);
  assert.throws(() => G.addPlayer(g, "one-more", "t", 1, Math.random), /full/);

  // Under way: past the first question and the first minutes after the start.
  const { g: small } = setup(3);
  G.begin(small, 10);
  G.reveal(small, 1);
  G.next(small, 20);
  const later = 10 + G.DOOR_OPEN_MS;
  assert.equal(G.doorOpen(small.run!, later - 1), true, "the first minutes after the start");
  assert.equal(G.doorOpen(small.run!, later), false);
  for (let i = 0; i < G.MAX_LATE_JOINERS; i++) G.addPlayer(small, `late${i}`, `tl${i}`, later + 1, Math.random);
  assert.throws(() => G.addPlayer(small, "late-too", "t", later + 2, Math.random), /started/);
  // A removed late joiner still took a place: removing and rejoining isn't a way in.
  G.removePlayer(small, "late0");
  assert.throws(() => G.addPlayer(small, "late-again", "t", later + 3, Math.random), /started/);
});

test("the door: slow tablets of a class get in, however many, while the class is arriving", () => {
  // Started with 3 of 25 in: the rest arrive in the first minutes.
  const { g } = setup(3);
  G.begin(g, 0);
  for (let i = 0; i < 22; i++) G.addPlayer(g, `slow${i}`, `ts${i}`, 1000 + i * 10_000, Math.random);
  assert.equal(Object.values(g.run!.players).filter((p) => p.late).length, 0, "none of them counts as late");

  // Started before the tablets were handed out: the teacher waits at the
  // first question, however long that takes, also after its reveal.
  const { g: early } = setup(0);
  G.begin(early, 0);
  const much = 3 * G.DOOR_OPEN_MS;
  for (let i = 0; i < 20; i++) G.addPlayer(early, `cart${i}`, `tc${i}`, much + i, Math.random);
  G.reveal(early, 1);
  G.addPlayer(early, "after-reveal", "tr", much + 100, Math.random);
  G.next(early, much + 200);
  // The second question is up and the minutes are over: a few more, then no one.
  for (let i = 0; i < G.MAX_LATE_JOINERS; i++) G.addPlayer(early, `late${i}`, `tl${i}`, much + 300, Math.random);
  assert.throws(() => G.addPlayer(early, "stranger", "t", much + 400, Math.random), /started/);
});

test("taps that change nothing aren't stored; changes of mind are capped; the last accepted tap counts", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  const p = ids[0];
  assert.equal(G.answerOutcome(g, p, 0, 1, 1, 0, 1), "recorded");
  assert.equal(G.answerOutcome(g, p, 0, 1, 2, 0, 2), "unchanged", "the same button again");
  assert.equal(G.answerOutcome(g, p, 0, 1, 2, 0, 3), "unchanged", "a resend");
  // A late, older tap on another answer doesn't overwrite the newer same-answer tap.
  assert.equal(G.answerOutcome(g, p, 0, 0, 1, 0, 4), "unchanged");
  assert.equal(g.run!.answers[0][p].choice, 1);
  let seq = 10;
  for (let i = 0; i < G.MAX_ANSWER_CHANGES; i++) assert.equal(G.answerOutcome(g, p, 0, i % 2 === 0 ? 0 : 1, seq++, 0, 5), "recorded");
  const last = g.run!.answers[0][p].choice;
  assert.equal(G.answerOutcome(g, p, 0, 1 - last, seq++, 0, 6), "refused", "one change too many");
  assert.equal(G.answerOutcome(g, p, 0, last, seq++, 0, 6), "unchanged", "the counted answer tapped again is fine");
  assert.equal(g.run!.answers[0][p].choice, last);
  G.reveal(g, 1);
  assert.equal(score(g, p), last === 0 ? 1 : 0);
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

test("a picture enlarged on the projector goes back by itself with the next step; a hidden one can't be enlarged", () => {
  const pictured = parseQuiz(`Title: P
1. One?
Image: a.png
+ a
- b

2. Two?
+ a
- b

3. Three?
Image: c.png
+ a
- b
`).quiz;
  const g = G.newGame(pictured);
  G.startRun(g, "12345", "r1");
  assert.throws(() => G.setZoom(g, true), G.GameError, "nothing on screen in the lobby");
  G.begin(g, 0);
  G.setZoom(g, true);
  assert.equal(G.zoomed(g), true);
  G.showVotes(g, 1);
  assert.equal(G.zoomed(g), false, "the votes show the tiles again");
  G.setZoom(g, true);
  G.reveal(g, 2);
  assert.equal(G.zoomed(g), false, "the reveal shows the tiles again");
  G.setZoom(g, true);
  G.setZoom(g, false);
  assert.equal(G.zoomed(g), false);
  G.setZoom(g, true);
  G.next(g, 10);
  assert.equal(G.zoomed(g), false, "the next question starts unenlarged");
  assert.throws(() => G.setZoom(g, true), G.GameError, "question 2 has no picture");
  G.setHidePicture(g, 2, true);
  G.reveal(g, 2);
  G.next(g, 20);
  assert.throws(() => G.setZoom(g, true), G.GameError, "a hidden picture isn't on screen");
  G.setHidePicture(g, 2, false);
  G.setZoom(g, true);
  assert.equal(G.zoomed(g), true);
});

test("answers are shuffled for each class, the same on every screen; only Order: fixed keeps them", () => {
  const random = (() => {
    let r = 7;
    return () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  })();
  const quiz = parseQuiz(
    Array.from({ length: 20 }, (_, i) => `${i + 1}. Q?\n+ right\n- w1\n- w2\n- w3\n`).join("\n") +
      "\n21. Kept?\nOrder: fixed\n+ 10\n- 20\n- 30\n- 40\n\n22. Parts?\n- A\n+ B\n- C\n- none\n",
  ).quiz;
  const g = G.newGame(quiz);
  G.startRun(g, "12345", "r1", random);
  const keyPlaces = quiz.questions.slice(0, 20).map((_, q) => G.orderOf(g, q).indexOf(0));
  assert.ok(new Set(keyPlaces).size >= 3 && keyPlaces.filter((p) => p === 0).length < 12, `the key, first in the text, lands at ${keyPlaces}`);
  for (let q = 0; q < 20; q++) assert.deepEqual([...G.orderOf(g, q)].sort(), [0, 1, 2, 3], "a permutation");
  assert.deepEqual(G.orderOf(g, 20), [0, 1, 2, 3], "Order: fixed");
  assert.notDeepEqual(
    [21, 21, 21].map(() => (G.startRun(g, "12345", "rx", random), G.orderOf(g, 21).join())),
    ["0,1,2,3", "0,1,2,3", "0,1,2,3"],
    "letters A, B, C without the line are shuffled like any answers",
  );
  G.startRun(g, "12345", "r1", random);
  const before = quiz.questions.map((_, q) => G.orderOf(g, q).join());
  G.startRun(g, "12345", "r2", random);
  assert.notDeepEqual(quiz.questions.map((_, q) => G.orderOf(g, q).join()), before, "another class, another order");
  G.startRun(g, "12345", "r3");
  assert.deepEqual(G.orderOf(g, 0), [0, 1, 2, 3], "without randomness (tests, runs stored before): the text's order");
});

// ---------------------------------------------------------------------------
// Tempo: the countdown and points for speed (backlog v2 items 2, 3)

test("countdown: the question first, Go opens the answers, time's up closes them, the reveal stays the teacher's", () => {
  const { g, ids } = setup(2, 10);
  G.setTempo(g, "countdown");
  G.begin(g, 0);
  assert.equal(G.answering(g), "reading");
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 0, 5), false, "no answers while the class reads");
  assert.equal(G.deadline(g), null);
  G.advance(g, 100, 1);
  assert.equal(G.answering(g), "open", "the clicker's step from reading is Go, not the reveal");
  assert.equal(G.deadline(g), 10_100);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 2, 3000, 2800), true);
  assert.equal(g.run!.answers[0][ids[0]].ms, 2800, "the device's own time");
  G.closeAnswers(g, 5);
  assert.equal(G.answering(g), "closed");
  assert.equal(g.run!.phase, "question", "time's up doesn't reveal");
  assert.equal(G.deadline(g), null);
  assert.equal(G.answer(g, ids[1], 0, 0, 1, 4, 10_300, 9_900), true, "tapped on a view that still showed the answers open: counts");
  assert.equal(G.answer(g, ids[1], 0, 1, 2, 5, 10_400), false, "tapped once the device showed time's up: doesn't");
  G.advance(g, 11_000, 6);
  assert.deepEqual([g.run!.phase, G.votesShown(g)], ["question", true], "after time's up the clicker shows the votes");
  G.advance(g, 11_500, 7);
  assert.equal(g.run!.phase, "reveal");
  assert.equal(g.run!.closedView![0], 5, "the votes and the reveal keep the close's view");
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [1, 1], "without points for speed a right answer is 1, as before");
});

test("countdown: a doubled Go is told apart from the Reveal by the reading flag (advance from reading only goes)", () => {
  const { g } = setup(1);
  G.setTempo(g, "countdown");
  G.begin(g, 0);
  G.go(g, 10);
  assert.throws(() => G.go(g, 20), G.GameError);
  assert.equal(G.answering(g), "open");
});

test("countdown: the teacher can stop it, or open the answers again after time's up", () => {
  const { g, ids } = setup(1, 10);
  G.setTempo(g, "speed");
  G.begin(g, 0);
  G.go(g, 0);
  G.closeAnswers(g, 7);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 7, 12_000), false);
  G.stopClock(g);
  assert.equal(G.answering(g), "open");
  assert.equal(G.deadline(g), null, "no clock runs after a stop");
  assert.equal(G.answer(g, ids[0], 0, 0, 2, 8, 15_000, 14_000), true, "open again");
  G.reveal(g, 9);
  assert.equal(score(g, ids[0]), 10, "right but after the countdown's length: no bonus");
  assert.throws(() => G.stopClock(g), G.GameError, "nothing to stop after the reveal");
});

test("points for speed: 10 for a right answer, up to 5 more by the share of the clock left; fixes move them", () => {
  const { g, ids } = setup(3, 20);
  G.setTempo(g, "speed");
  G.begin(g, 0);
  G.go(g, 1000);
  G.answer(g, ids[0], 0, 0, 1, 0, 2000, 900); // fast, right
  G.answer(g, ids[1], 0, 0, 1, 0, 16_000, 14_500); // slow, right
  G.answer(g, ids[2], 0, 1, 1, 0, 3000, 1500); // fast, wrong
  G.reveal(g, 5);
  assert.deepEqual(ids.map((id) => score(g, id)), [15, 11, 0]);
  assert.equal(G.pointsFor(g, 0, ids[0]), 15);
  G.setCounts(g, 0, [true, true, false]);
  assert.deepEqual(ids.map((id) => score(g, id)), [15, 11, 15], "another answer counts too: its speed counts with it");
  G.setVoid(g, 0, true);
  assert.deepEqual(ids.map((id) => score(g, id)), [0, 0, 0]);
  assert.equal(G.pointsFor(g, 0, ids[0]), null);
  assert.equal(G.standings(g)[0].place, 1);
});

test("points for speed: the device's time can't exceed the server's, and an old page without one gets the server's", () => {
  const { g, ids } = setup(2);
  G.setTempo(g, "speed");
  G.begin(g, 0);
  G.go(g, 1000);
  G.answer(g, ids[0], 0, 0, 1, 0, 3000, 99_999);
  G.answer(g, ids[1], 0, 0, 1, 0, 4000);
  assert.equal(g.run!.answers[0][ids[0]].ms, 2000);
  assert.equal(g.run!.answers[0][ids[1]].ms, 3000);
  G.answer(g, ids[0], 0, 1, 2, 0, 5000, -50);
  assert.equal(g.run!.answers[0][ids[0]].ms, 0, "a change of mind keeps its own time; never below zero");
});

test("tempo: 60 s without a Time: line; the -5/+5 pair acts on the countdown read, running or next, and every one after", () => {
  const { g, ids } = setup(1);
  G.setTempo(g, "countdown");
  assert.equal(G.secondsFor(g, 0), 60, "the safe countdown");
  assert.equal(G.nudgeSeconds(g), null, "no pair in the lobby");
  assert.throws(() => G.nudge(g, 5, 0, 1), G.GameError);
  G.begin(g, 0);
  assert.equal(G.nudgeSeconds(g), 60, "while the class reads: this question's");
  G.nudge(g, 5, 0, 1);
  assert.equal(G.nudgeSeconds(g), 60, "at 60 a +5 changes nothing");
  assert.throws(() => G.nudge(g, 10, 0, 1), G.GameError, "only 5 either way");
  for (let i = 0; i < 4; i++) G.nudge(g, -5, 0, 1);
  assert.equal(G.secondsFor(g, 0), 40);
  G.go(g, 1000);
  assert.equal(G.deadline(g), 41_000);
  G.nudge(g, 5, 5000, 2);
  assert.deepEqual([G.deadline(g), G.nudgeSeconds(g)], [46_000, 45], "a running countdown changes at once");
  G.answer(g, ids[0], 0, 0, 1, 0, 6000, 4000);
  G.reveal(g, 3);
  assert.equal(G.nudgeSeconds(g), 45, "after the reveal: the next question's, the change kept");
  G.nudge(g, -5, 7000, 4);
  G.next(g, 8000);
  assert.equal(G.secondsFor(g, 1), 40);
  G.go(g, 8000);
  G.nudge(g, -5, 50_000, 5);
  assert.equal(G.answering(g), "closed", "cut below the time already gone: answering closes");
  assert.equal(g.run!.closedView![1], 5);
  assert.equal(g.run!.phase, "question", "and the reveal is still the teacher's");
  for (let i = 0; i < 9; i++) G.nudge(g, -5, 60_000, 6);
  assert.equal(G.nudgeSeconds(g), 10, "never under 10 s");
  G.reveal(g, 7);
  G.next(g, 70_000);
  G.go(g, 70_000);
  G.reveal(g, 8);
  assert.equal(G.nudgeSeconds(g), null, "nothing after the last question");
  G.finish(g, 80_000);
  G.startRun(g, "12345", "r2");
  assert.deepEqual([G.tempoOf(g), G.secondsFor(g, 0)], ["countdown", 10], "Again with another class keeps the tempo and the change");
});

test("tempo: the -5/+5 moves lengths written per question together, each held within 10..60", () => {
  const timed = parseQuiz(`Title: T
Tempo: countdown
Time: 20

1. A?
+ a
- b

2. B?
Time: 50
+ a
- b

3. C?
Time: 10
+ a
- b
`).quiz;
  const g = G.newGame(timed);
  G.startRun(g, "12345", "r1");
  assert.deepEqual([0, 1, 2].map((q) => G.secondsFor(g, q)), [20, 50, 10], "as written");
  G.begin(g, 0);
  G.nudge(g, 5, 0, 1);
  G.nudge(g, 5, 0, 1);
  assert.deepEqual([0, 1, 2].map((q) => G.secondsFor(g, q)), [30, 60, 20], "+10 on each, 50 held at 60");
  G.nudge(g, -5, 0, 1);
  G.nudge(g, -5, 0, 1);
  G.nudge(g, -5, 0, 1);
  assert.deepEqual([0, 1, 2].map((q) => G.secondsFor(g, q)), [15, 45, 10], "-5 on each, 5 held at 10");
  G.go(g, 0);
  G.stopClock(g);
  assert.equal(G.nudgeSeconds(g), 45, "a stopped countdown: the pair acts on the next one");
  G.setTempo(g, "pace");
  assert.equal(G.nudgeSeconds(g), null, "and none when the next question comes at the teacher's pace");
});

test("tempo changed mid-quiz: from the next question on; each question is played and scored as it came up", () => {
  const { g, ids } = setup(2, 10);
  G.setTempo(g, "speed");
  G.begin(g, 0);
  G.setTempo(g, "pace");
  assert.equal(G.answering(g), "reading", "the question on screen keeps how it came up");
  G.go(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1000, 1000);
  G.reveal(g, 1);
  assert.deepEqual([score(g, ids[0]), G.speedScale(g)], [15, true]);
  G.next(g, 20_000);
  assert.equal(G.answering(g), "open", "the next one at the teacher's pace: no reading, no clock");
  assert.equal(G.deadline(g), null);
  G.answer(g, ids[0], 1, 1, 2, 0, 21_000);
  G.answer(g, ids[1], 1, 1, 1, 0, 21_000);
  G.reveal(g, 2);
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [25, 10], "on the speed scale a right answer is 10; no bonus without a countdown");
  G.setCounts(g, 1, [true, false]);
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [15, 0]);
  G.setVoid(g, 0, true);
  assert.equal(G.speedScale(g), false, "no scoring question was played for speed: right out of so many again");
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [0, 0]);
});

test("at the teacher's pace nothing changes: no reading step, no clock", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  assert.equal(G.answering(g), "open");
  assert.equal(G.deadline(g), null);
  assert.throws(() => G.go(g, 0), G.GameError);
  G.closeAnswers(g, 3);
  assert.equal(G.answering(g), "open", "no clock to close");
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 4, 10), true);
});
