// What must hold in front of the class: points follow the teacher's fixes,
// late or repeated answers change nothing, and the quiz can end at any point.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuiz } from "../quiz/format.ts";
import * as G from "./game.ts";
import { LAST_CALL_MS, POINTS_RIGHT, SPEED_REFERENCE_MS, speedBonus } from "../shared/tempo.ts";
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

function setup(players = 3) {
  const g = G.newGame(quiz);
  G.startRun(g, "12345", "r1");
  let r = 0;
  const random = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const ids = Array.from({ length: players }, (_, i) => G.addPlayer(g, `p${i}`, `t${i}`, i, random).id);
  return { g, ids };
}

const score = (g: G.Game, id: string) => G.scores(g).get(id);

/** The quiz starts and its first question's answers are shown, as most tests need them. */
function begin(g: G.Game, now: number) {
  G.begin(g, now);
  G.showAnswers(g, now);
}

/** The next question, its answers shown (unless that was the last). */
function nextQ(g: G.Game, now: number) {
  G.next(g, now);
  if (g.run!.phase === "question") G.showAnswers(g, now);
}

test("a full run: answers score at the reveal, ranking shares places on ties", () => {
  const { g, ids } = setup();
  begin(g, 100);
  G.answer(g, ids[0], 0, 0, 1, 0, 150);
  G.answer(g, ids[1], 0, 1, 1, 0, 160);
  assert.equal(score(g, ids[0]), 0, "nothing scores before the reveal");
  G.reveal(g, 10);
  assert.equal(score(g, ids[0]), 1);
  assert.deepEqual(G.distribution(g, 0), [1, 1, 0]);
  nextQ(g, 200);
  G.answer(g, ids[0], 1, 1, 2, 0, 210);
  G.answer(g, ids[1], 1, 1, 2, 0, 220);
  G.reveal(g, 10);
  const st = G.standings(g);
  assert.deepEqual(st.map((s) => [s.id, s.score, s.place]), [["p0", 2, 1], ["p1", 1, 2], ["p2", 0, 3]]);
  nextQ(g, 300);
  G.reveal(g, 10);
  nextQ(g, 400);
  assert.equal(g.run!.phase, "final");
  assert.equal(g.run!.ended, 400);
});

test("changing the key after the reveal moves the points; a second right answer adds them", () => {
  const { g, ids } = setup();
  begin(g, 0);
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
  begin(g, 0);
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
  begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.skipCurrent(g, 5);
  assert.equal(g.run!.current, 1);
  assert.deepEqual(G.progress(g), { n: 1, total: 1 });
  G.showAnswers(g, 5);
  G.reveal(g, 10);
  assert.throws(() => G.setSkip(g, 1, true), /void it instead/);
  nextQ(g, 10);
  assert.equal(g.run!.phase, "final", "question 3 was skipped, so the quiz ends");
  assert.equal(score(g, ids[0]), 0);
});

test("answers: retries and late arrivals change nothing, changing one's mind before the reveal does", () => {
  const { g, ids } = setup(1);
  begin(g, 1000);
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

test("a tap the device showed before the reveal counts while the question is on screen; leaving its reveal settles it", () => {
  const { g, ids } = setup(3);
  begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 3, 5);
  G.reveal(g, 10);
  assert.equal(G.answer(g, ids[1], 0, 0, 1, 9, 20), true, "tapped on view 9, the reveal came with view 10");
  assert.equal(G.answer(g, ids[0], 0, 1, 2, 9, 20), true, "a change of mind tapped before the reveal also counts");
  nextQ(g, 30);
  assert.equal(G.answer(g, ids[1], 0, 1, 2, 9, 40), false, "once the class has moved on, the question is settled");
  assert.equal(G.answer(g, ids[2], 0, 0, 1, 9, 40), false, "also for a first answer");
  assert.equal(G.answer(g, ids[1], 0, 0, 1, 9, 45), true, "a resend of what is stored is still confirmed");
  assert.deepEqual([score(g, ids[0]), score(g, ids[1]), score(g, ids[2])], [0, 1, 0]);
  assert.deepEqual(G.distribution(g, 0), [1, 1, 0]);

  // The ranking settles it too: what it shows doesn't move under the class.
  G.answer(g, ids[0], 1, 1, 3, 20, 50);
  G.reveal(g, 30);
  G.showRanking(g);
  assert.equal(G.answer(g, ids[1], 1, 1, 3, 29, 60), false, "tapped before the reveal, arriving at the ranking");
  assert.deepEqual(G.recordOf(g, 1, ids[0]), { choice: 1, seq: 3 }, "the record the acknowledgement carries");
  assert.equal(G.recordOf(g, 1, ids[1]), null);
});

test("finishing early: the unrevealed question doesn't count, also for taps arriving late", () => {
  const { g, ids } = setup(1);
  begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.finish(g, 50);
  assert.equal(g.run!.phase, "final");
  assert.equal(G.answer(g, ids[0], 0, 0, 2, 0, 60), false);
  assert.equal(score(g, ids[0]), 0);
});

test("a skipped question takes no late taps", () => {
  const { g, ids } = setup(1);
  begin(g, 0);
  G.skipCurrent(g, 5);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 0, 10), false);
});

test("a removed avatar leaves the counts and the ranking", () => {
  const { g, ids } = setup(2);
  begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 0, 1);
  G.answer(g, ids[1], 0, 0, 1, 0, 1);
  G.removePlayer(g, ids[1]);
  assert.deepEqual(G.distribution(g, 0), [1, 0, 0]);
  G.reveal(g, 10);
  assert.deepEqual(G.standings(g).map((s) => s.id), [ids[0]]);
});

test("Play walks one slice at a time: Show answers, Lock in, Reveal, Ranking, Next; the last reveal goes to the final ranking", () => {
  const { g } = setup(0);
  assert.throws(() => G.play(g, 0, 1), G.GameError, "the lobby has Start, not Play");
  G.begin(g, 0);
  const where = () => [g.run!.phase, g.run!.current, G.answering(g)];
  assert.deepEqual(where(), ["question", 0, "reading"], "every question starts with its answers hidden");
  G.play(g, 1, 2);
  assert.deepEqual(where(), ["question", 0, "open"]);
  G.play(g, 2, 3);
  assert.deepEqual([...where(), G.lockedIn(g)], ["question", 0, "closed", true]);
  G.play(g, 3, 4);
  assert.deepEqual(where(), ["reveal", 0, null]);
  G.play(g, 4, 5);
  assert.deepEqual(where(), ["ranking", 0, null]);
  G.play(g, 5, 6);
  assert.deepEqual([...where(), G.lockedIn(g)], ["question", 1, "reading", false], "the next question, its answers hidden again");
  for (let i = 0; i < 5; i++) G.play(g, 10 + i, 10 + i);
  assert.deepEqual(where(), ["question", 2, "reading"]);
  for (let i = 0; i < 3; i++) G.play(g, 20 + i, 20 + i);
  assert.equal(G.lastQuestion(g), true);
  G.play(g, 30, 30);
  assert.equal(g.run!.phase, "final", "no intermediate ranking right before the final one");
  assert.throws(() => G.play(g, 31, 31), G.GameError);

  // A page from before the bar: its clicker's key starts the quiz and goes from the reveal to the next question.
  const { g: old } = setup(0);
  G.advance(old, 0, 1);
  G.advance(old, 1, 2);
  G.advance(old, 2, 3);
  G.advance(old, 3, 4);
  assert.equal(old.run!.phase, "reveal");
  G.advance(old, 4, 5);
  assert.deepEqual([old.run!.phase, old.run!.current], ["question", 1]);
});

// ---------------------------------------------------------------------------
// Spread, then key (backlog v2 item 6)

test("votes: answering closes without the key; a tap made before still counts; the reveal adds the key", () => {
  const { g, ids } = setup(3);
  begin(g, 0);
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 5, 100), true);
  G.lockIn(g, 7);
  assert.equal(g.run!.phase, "question", "the votes are not the reveal");
  assert.equal(G.answering(g), "closed");
  assert.deepEqual(G.distribution(g, 0), [1, 0, 0]);
  assert.equal(G.answer(g, ids[1], 0, 1, 1, 6, 200), true, "tapped on a view that still showed the answers open: counts");
  assert.deepEqual(G.distribution(g, 0), [1, 1, 0], "and joins the votes on the wall");
  assert.equal(G.answer(g, ids[2], 0, 0, 1, 7, 300), false, "tapped once the device showed the votes: doesn't");
  assert.equal(G.answer(g, ids[0], 0, 2, 2, 7, 300), false, "nor a change of mind");
  assert.equal(score(g, ids[0]), 0, "nothing scores before the key");
  G.lockIn(g, 8);
  assert.equal(g.run!.closedView![0], 7, "a second press changes nothing");
  G.reveal(g, 9);
  assert.equal(g.run!.phase, "reveal");
  assert.equal(g.run!.closedView![0], 7, "the reveal keeps the votes' view");
  assert.deepEqual([score(g, ids[0]), score(g, ids[1])], [1, 0]);
});

test("lock-in: not while the answers are hidden; the reveal straight from answering still works (a page from before the lock-in)", () => {
  const { g, ids } = setup(1);
  G.begin(g, 0);
  assert.throws(() => G.lockIn(g, 1), G.GameError);
  assert.throws(() => G.reveal(g, 1), G.GameError, "no key before the answers were shown");
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 0, 5), false, "nothing to answer while the answers are hidden");
  G.showAnswers(g, 10);
  assert.throws(() => G.showAnswers(g, 11), G.GameError, "shown once");
  G.reveal(g, 2);
  assert.equal(g.run!.phase, "reveal");
  assert.throws(() => G.lockIn(g, 3), G.GameError, "no lock-in after the key");
});

test("Last call: fifteen seconds, then locked in with the spread; from the hidden answers it shows them too", () => {
  const { g, ids } = setup(2);
  G.begin(g, 0);
  G.lastCall(g, 1000);
  assert.equal(G.answering(g), "open", "Last call from the question shows the answers");
  assert.equal(g.run!.shown![0], 1000, "the time for speed starts with them");
  assert.equal(G.deadline(g), 1000 + LAST_CALL_MS);
  assert.throws(() => G.lastCall(g, 2000), G.GameError, "once per question");
  assert.equal(G.answer(g, ids[0], 0, 0, 1, 1, 4000), true);
  G.closeAnswers(g, 5);
  assert.deepEqual([G.answering(g), G.lockedIn(g), g.run!.phase], ["closed", true, "question"], "time's up locks in; the reveal stays the teacher's");
  assert.equal(G.deadline(g), null, "no clock once locked in");
  assert.equal(G.runningClock(g), null);
  assert.equal(G.answer(g, ids[1], 0, 0, 1, 4, 16_100), true, "tapped on a view that still showed the answers open: counts");
  assert.equal(G.answer(g, ids[1], 0, 1, 2, 5, 16_200), false, "tapped once the device showed the lock-in: doesn't");
  G.closeAnswers(g, 9);
  assert.equal(g.run!.closedView![0], 5, "a second close changes nothing");

  // From answering, Last call starts the clock; Lock in before it runs out stops it.
  G.reveal(g, 10);
  nextQ(g, 30_000);
  G.lastCall(g, 32_000);
  assert.equal(G.deadline(g), 32_000 + LAST_CALL_MS);
  G.play(g, 33_000, 11);
  assert.deepEqual([G.lockedIn(g), G.deadline(g)], [true, null]);
  assert.throws(() => G.lastCall(g, 34_000), G.GameError, "no Last call once locked in");
  G.closeAnswers(g, 12);
  assert.equal(g.run!.closedView![1], 11, "a late alarm changes nothing");
});

test("votes, then the final ranking now: a question whose key wasn't shown doesn't count", () => {
  const { g, ids } = setup(1);
  begin(g, 0);
  G.answer(g, ids[0], 0, 0, 1, 1, 10);
  G.lockIn(g, 2);
  G.finish(g, 20);
  assert.equal(score(g, ids[0]), 0);
});

test("winners: who got it right, in the lobby's order; a fix of the key moves them, a void clears them", () => {
  const { g, ids } = setup(4);
  begin(g, 100);
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
  nextQ(g, 200);
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
  begin(g, 100);
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
  begin(small, 10);
  G.reveal(small, 1);
  nextQ(small, 20);
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
  begin(g, 0);
  for (let i = 0; i < 22; i++) G.addPlayer(g, `slow${i}`, `ts${i}`, 1000 + i * 10_000, Math.random);
  assert.equal(Object.values(g.run!.players).filter((p) => p.late).length, 0, "none of them counts as late");

  // Started before the tablets were handed out: the teacher waits at the
  // first question, however long that takes, also after its reveal.
  const { g: early } = setup(0);
  begin(early, 0);
  const much = 3 * G.DOOR_OPEN_MS;
  for (let i = 0; i < 20; i++) G.addPlayer(early, `cart${i}`, `tc${i}`, much + i, Math.random);
  G.reveal(early, 1);
  G.addPlayer(early, "after-reveal", "tr", much + 100, Math.random);
  nextQ(early, much + 200);
  // The second question is up and the minutes are over: a few more, then no one.
  for (let i = 0; i < G.MAX_LATE_JOINERS; i++) G.addPlayer(early, `late${i}`, `tl${i}`, much + 300, Math.random);
  assert.throws(() => G.addPlayer(early, "stranger", "t", much + 400, Math.random), /started/);
});

test("taps that change nothing aren't stored; changes of mind are capped; the last accepted tap counts", () => {
  const { g, ids } = setup(1);
  begin(g, 0);
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
  begin(g, 0);
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
  begin(g, 0);
  G.setZoom(g, true);
  assert.equal(G.zoomed(g), true);
  G.lockIn(g, 1);
  assert.equal(G.zoomed(g), false, "the votes show the tiles again");
  G.setZoom(g, true);
  G.reveal(g, 2);
  assert.equal(G.zoomed(g), false, "the reveal shows the tiles again");
  G.setZoom(g, true);
  G.setZoom(g, false);
  assert.equal(G.zoomed(g), false);
  G.setZoom(g, true);
  nextQ(g, 10);
  assert.equal(G.zoomed(g), false, "the next question starts unenlarged");
  assert.throws(() => G.setZoom(g, true), G.GameError, "question 2 has no picture");
  G.setHidePicture(g, 2, true);
  G.reveal(g, 2);
  nextQ(g, 20);
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
// Points for speed (backlog v4 item 6: the join screen's switch)

test("points for speed: 10 for a right answer, up to 5 more by how soon after the answers appeared; fixes move them", () => {
  const { g, ids } = setup(3);
  G.setSpeed(g, true);
  G.begin(g, 0);
  G.showAnswers(g, 1000);
  G.answer(g, ids[0], 0, 0, 1, 0, 2000, 900); // fast, right
  G.answer(g, ids[1], 0, 0, 1, 0, 16_000, 14_500); // slow, right
  G.answer(g, ids[2], 0, 1, 1, 0, 3000, 1500); // fast, wrong
  G.reveal(g, 5);
  assert.deepEqual(ids.map((id) => score(g, id)), [POINTS_RIGHT + 5, POINTS_RIGHT + speedBonus(14_500), 0]);
  assert.equal(speedBonus(14_500), 1);
  assert.equal(speedBonus(SPEED_REFERENCE_MS + 1), 0, "a tap after the reference scores no bonus");
  assert.equal(G.pointsFor(g, 0, ids[0]), 15);
  G.setCounts(g, 0, [true, true, false]);
  assert.deepEqual(ids.map((id) => score(g, id)), [15, 11, 15], "another answer counts too: its speed counts with it");
  G.setVoid(g, 0, true);
  assert.deepEqual(ids.map((id) => score(g, id)), [0, 0, 0]);
  assert.equal(G.pointsFor(g, 0, ids[0]), null);
  assert.equal(G.standings(g)[0].place, 1);
});

test("points for speed: set in the lobby only, off by default, carried to the next class", () => {
  const { g, ids } = setup(1);
  assert.equal(G.speedScale(g), false);
  G.setSpeed(g, true);
  G.setSpeed(g, false);
  G.setSpeed(g, true);
  begin(g, 0);
  assert.throws(() => G.setSpeed(g, false), G.GameError, "fixed at Start");
  G.answer(g, ids[0], 0, 0, 1, 0, 100, 100);
  G.reveal(g, 1);
  assert.equal(score(g, ids[0]), 15);
  G.finish(g, 200);
  G.startRun(g, "12345", "r2");
  assert.equal(G.speedScale(g), true, "Again with another class keeps it");

  const { g: plain, ids: p } = setup(1);
  begin(plain, 0);
  G.answer(plain, p[0], 0, 0, 1, 0, 100, 100);
  G.reveal(plain, 1);
  assert.equal(score(plain, p[0]), 1, "without it a right answer is 1, as in v1");
});

test("points for speed: the device's time can't exceed the server's, and an old page without one gets the server's", () => {
  const { g, ids } = setup(2);
  G.setSpeed(g, true);
  G.begin(g, 0);
  G.showAnswers(g, 1000);
  G.answer(g, ids[0], 0, 0, 1, 0, 3000, 99_999);
  G.answer(g, ids[1], 0, 0, 1, 0, 4000);
  assert.equal(g.run!.answers[0][ids[0]].ms, 2000);
  assert.equal(g.run!.answers[0][ids[1]].ms, 3000);
  G.answer(g, ids[0], 0, 1, 2, 0, 5000, -50);
  assert.equal(g.run!.answers[0][ids[0]].ms, 0, "a change of mind keeps its own time; never below zero");
});

test("a run stored before the steering bar reads as one after it", () => {
  const { g, ids } = setup(2);
  G.begin(g, 0);
  // As the countdown stored it: a speed class, question 1 played with a countdown that closed.
  const run = g.run! as G.Run & Record<string, unknown>;
  run.tempo = "speed";
  run.adjust = -5;
  run.played = { 0: "speed" };
  run.clocks = { 0: { at: 500, ms: 20_000, closed: true } as G.Clock };
  delete run.shown;
  G.upgradeRun(run);
  assert.deepEqual([run.tempo, run.adjust, run.played], [undefined, undefined, undefined]);
  assert.equal(G.speedScale(g), true);
  assert.equal(run.shown![0], 500, "the countdown's Go is when the answers appeared");
  assert.deepEqual([G.answering(g), G.lockedIn(g), G.deadline(g)], ["closed", true, null], "a closed countdown is the lock-in");
  assert.equal(run.opened, 1);
  G.reveal(g, 3);
  nextQ(g, 1000);

  // A question at the teacher's pace, its answers open from when it came up.
  const { g: pace } = setup(1);
  G.begin(pace, 700);
  const r2 = pace.run! as G.Run & Record<string, unknown>;
  r2.tempo = "pace";
  r2.played = { 0: "pace" };
  G.upgradeRun(r2);
  assert.deepEqual([G.answering(pace), r2.shown![0], G.speedScale(pace)], ["open", 700, false]);
  assert.equal(G.upgradeRun(r2), r2, "a run from after it is left as it is");
  assert.equal(ids.length, 2);
});
