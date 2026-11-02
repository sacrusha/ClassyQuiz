// The run of a quiz as a pure state machine: who has joined, which question is
// up, what each student answered, and what the teacher has fixed. No I/O, no
// clock and no randomness of its own (both are passed in), so it runs the same
// in the Durable Object, in tests and in a simulation.
//
// Scores are never stored. They are computed from the recorded answers and the
// current fixes, so a key changed after the reveal moves the points with it
// (backlog v1 item 9). Points for speed are the same kind of computation:
// each answer keeps how long after the answers appeared it was tapped, and
// each question that had a countdown keeps its length (shared/tempo.ts).

import type { Quiz } from "../quiz/format.ts";
import { CLASS_FULL, CLASS_STARTED, MAX_ANSWER_CHANGES, MAX_LATE_JOINERS, MAX_PLAYERS } from "../shared/limits.ts";
import { COUNTDOWN_CHOICES, COUNTDOWN_DEFAULT, POINTS_RIGHT, TEMPOS, speedBonus, type Tempo } from "../shared/tempo.ts";

export type Phase = "lobby" | "question" | "reveal" | "ranking" | "final";

/**
 * Within an open question: the class reads it (countdown tempos: the
 * answers aren't shown yet), the answers are open, or answering has closed
 * (time's up, or everyone present answered) and the reveal waits for the
 * teacher.
 */
export type Answering = "reading" | "open" | "closed";

/** The countdown of one question, from the moment its answers appeared (Go). */
export interface Clock {
  /** When the answers appeared (server time). */
  at: number;
  /** Its length; kept when stopped, for the points for speed. */
  ms: number;
  /** The teacher stopped it: the answers stay open without a clock. */
  stopped?: boolean;
  /** Time's up, or everyone present answered: answering is closed until the reveal. */
  closed?: boolean;
}

/** The teacher's corrections to one question; they apply to every run of the instance. */
export interface Fix {
  /** Which answers count as right. At least one, unless the question is void. */
  counts: boolean[];
  /** Counts for nobody (shown, but no points). */
  void: boolean;
  /** Not shown at all. */
  skip: boolean;
  /** The question's picture stays off the projector (a wrong or revealing crop). Missing in fixes stored before it existed. */
  hidePicture?: boolean;
}

export interface Avatar {
  /** Index into the animal set. */
  a: number;
  /** Index into the colour set. */
  c: number;
}

export interface Player {
  id: string;
  token: string;
  avatar: Avatar;
  joined: number;
  removed: boolean;
  /** Joined after the quiz started (MAX_LATE_JOINERS). */
  late?: boolean;
}

export interface AnswerRecord {
  choice: number;
  /**
   * Milliseconds after the answers appeared, as the device measured it (its
   * own display, not the network's delay), at most the server's count; the
   * server's count for a device that sends none. For the points for speed.
   */
  ms: number;
  /** The client's sequence number; a lower one arriving late is ignored. */
  seq: number;
  /** Times the student changed their mind on this question (MAX_ANSWER_CHANGES); absent until the first change. */
  changes?: number;
}

export interface Run {
  /** Tells this class from the next one playing the same quiz: a tablet left on the last final screen does not slip into the new lobby. */
  id: string;
  code: string;
  phase: Phase;
  /** Index of the question that is up (or was last up); -1 before the first. */
  current: number;
  openedAt: number;
  /** Questions whose answer was revealed, in order; only these score. */
  revealed: number[];
  /**
   * Question index → the view version that first showed its answering
   * closed: time's up, or the reveal. An answer tapped on an older view was
   * in time as far as the device showed, and counts whenever it arrives
   * (backlog v1 item 15). Missing in runs stored before this was added.
   */
  closedView?: Record<string, number>;
  /** The same, as runs stored before the countdown named it (reveals only); read when closedView has no entry. */
  revealView?: Record<string, number>;
  /** The class's tempo (shared/tempo.ts); missing: the teacher's pace. Chosen in the lobby. */
  tempo?: Tempo;
  /** The countdown's length in seconds, for the questions still to come; missing: COUNTDOWN_DEFAULT. */
  seconds?: number;
  /** Question index → its countdown, once its answers appeared under one. */
  clocks?: Record<string, Clock>;
  players: Record<string, Player>;
  /** Join command id → player it created, so a resent join doesn't make a second avatar. */
  joins?: Record<string, string>;
  /** Question index → player id → answer. */
  answers: Record<string, Record<string, AnswerRecord>>;
  ended: number | null;
  /**
   * Per question, the order its answers are shown in: position on screen →
   * index in the quiz text. Everything stored (answers, fixes) is by the
   * text's index; the views show this order. Missing in runs stored before
   * it existed, and in tests: the text's order.
   */
  order?: number[][];
  /**
   * The open question's picture fills the projector: "phase|current" of the
   * step it was enlarged in, so moving on (or revealing) ends it by itself.
   */
  zoom?: string;
}

export interface Game {
  quiz: Quiz;
  fixes: Fix[];
  run: Run | null;
}

export const ANIMAL_COUNT = 12;
export const COLOUR_COUNT = 8;

export class GameError extends Error {}

export function newGame(quiz: Quiz): Game {
  return {
    quiz,
    fixes: quiz.questions.map((q) => ({ counts: q.answers.map((a) => a.correct), void: false, skip: false })),
    run: null,
  };
}

/**
 * A new class: at upload, and with "Again with another class". With
 * `random`, each question's answers get a fresh order, the same on every
 * screen, unless the quiz keeps it ("Order: fixed"; nothing else does:
 * a rule the AI and the teacher can't see is one they can't rely on).
 * Decisions.md, "Answers shuffled at upload". The tempo carries over from
 * the class before: the parallel class most likely plays the same way.
 */
export function startRun(g: Game, code: string, id: string, random?: () => number): void {
  const before = g.run;
  g.run = { id, code, phase: "lobby", current: -1, openedAt: 0, revealed: [], players: {}, answers: {}, ended: null };
  if (before?.tempo && before.tempo !== "pace") g.run.tempo = before.tempo;
  if (before?.seconds) g.run.seconds = before.seconds;
  if (random) g.run.order = g.quiz.questions.map((q) => (q.keepOrder ? q.answers.map((_, i) => i) : shownOrder(q.answers.map((a) => a.text), random)));
}

/** Position on screen → index in the text. */
export function shownOrder(texts: string[], random: () => number): number[] {
  const order = texts.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The order question q's answers are shown in. */
export function orderOf(g: Game, q: number): number[] {
  const n = g.quiz.questions[q]?.answers.length ?? 0;
  const o = g.run?.order?.[q];
  return o && o.length === n ? o : Array.from({ length: n }, (_, i) => i);
}

function needRun(g: Game): Run {
  if (!g.run) throw new GameError("No class is playing this quiz right now.");
  return g.run;
}

// ---------------------------------------------------------------------------
// Players

/**
 * Picks an avatar nobody in the run has. Animals are used up before colours
 * repeat an animal, so the first dozen students differ by animal, which is
 * what a child recognises across the room.
 */
export function pickAvatar(run: Run, random: () => number): Avatar {
  const taken = new Set(Object.values(run.players).filter((p) => !p.removed).map((p) => p.avatar.a * 100 + p.avatar.c));
  const animalUse = new Array(ANIMAL_COUNT).fill(0);
  const colourUse = new Array(COLOUR_COUNT).fill(0);
  for (const p of Object.values(run.players)) {
    if (p.removed) continue;
    animalUse[p.avatar.a]++;
    colourUse[p.avatar.c]++;
  }
  const free: Avatar[] = [];
  for (let a = 0; a < ANIMAL_COUNT; a++) for (let c = 0; c < COLOUR_COUNT; c++) if (!taken.has(a * 100 + c)) free.push({ a, c });
  if (free.length === 0) {
    // More players than avatars: repeats are unavoidable.
    return { a: Math.floor(random() * ANIMAL_COUNT), c: Math.floor(random() * COLOUR_COUNT) };
  }
  const minAnimal = Math.min(...free.map((f) => animalUse[f.a]));
  const pool1 = free.filter((f) => animalUse[f.a] === minAnimal);
  const minColour = Math.min(...pool1.map((f) => colourUse[f.c]));
  const pool = pool1.filter((f) => colourUse[f.c] === minColour);
  return pool[Math.floor(random() * pool.length)];
}

export { MAX_ANSWER_CHANGES, MAX_LATE_JOINERS, MAX_PLAYERS };

export function addPlayer(g: Game, id: string, token: string, now: number, random: () => number): Player {
  const run = needRun(g);
  if (run.phase === "final") throw new GameError("This quiz has finished.");
  const all = Object.values(run.players);
  if (all.length >= MAX_PLAYERS) throw new GameError(CLASS_FULL);
  const late = run.phase !== "lobby";
  if (late && all.filter((p) => p.late).length >= MAX_LATE_JOINERS) throw new GameError(CLASS_STARTED);
  const p: Player = { id, token, avatar: pickAvatar(run, random), joined: now, removed: false, ...(late ? { late: true } : {}) };
  run.players[id] = p;
  return p;
}

/** The player with this id, if any (ids come from devices: no prototype lookups). */
export function playerById(run: Run, id: string): Player | null {
  return typeof id === "string" && Object.hasOwn(run.players, id) ? run.players[id] : null;
}

export function removePlayer(g: Game, id: string): void {
  const p = playerById(needRun(g), id);
  if (p) p.removed = true;
}

export function activePlayers(run: Run): Player[] {
  return Object.values(run.players).filter((p) => !p.removed);
}

/** The answers to question q that count in the run: a removed avatar's don't. */
export function activeAnswers(run: Run, q: number): AnswerRecord[] {
  return Object.entries(run.answers[q] ?? {})
    .filter(([pid]) => playerById(run, pid)?.removed === false)
    .map(([, a]) => a);
}

// ---------------------------------------------------------------------------
// Flow

function nextShown(g: Game, from: number): number {
  for (let i = from + 1; i < g.quiz.questions.length; i++) if (!g.fixes[i].skip) return i;
  return -1;
}

function open(g: Game, run: Run, q: number, now: number): void {
  if (q === -1) {
    finish(g, now);
    return;
  }
  run.current = q;
  run.phase = "question";
  run.openedAt = now;
}

/** Lobby → first question. */
export function begin(g: Game, now: number): void {
  const run = needRun(g);
  if (run.phase !== "lobby") throw new GameError("The quiz has already started.");
  open(g, run, nextShown(g, -1), now);
}

/** `view`: the version of the first view that will show the reveal. */
export function reveal(g: Game, view: number): void {
  const run = needRun(g);
  if (run.phase !== "question") throw new GameError("There is no open question to reveal.");
  if (!run.revealed.includes(run.current)) run.revealed.push(run.current);
  // Time's up may have closed answering earlier; that view is the one that counts.
  (run.closedView ??= {})[run.current] ??= view;
  run.phase = "reveal";
}

// ---------------------------------------------------------------------------
// Tempo (backlog v2 items 2, 3; shared/tempo.ts)

export function tempoOf(run: Run | null): Tempo {
  return run?.tempo ?? "pace";
}

export function secondsOf(run: Run | null): number {
  return run?.seconds ?? COUNTDOWN_DEFAULT;
}

/** The class's tempo: chosen in the lobby, before the class has seen a question. */
export function setTempo(g: Game, tempo: Tempo): void {
  const run = needRun(g);
  if (!TEMPOS.includes(tempo)) throw new GameError("Unknown tempo.");
  if (run.phase !== "lobby") throw new GameError("The tempo is chosen in the lobby, before the quiz starts.");
  if (tempo === "pace") delete run.tempo;
  else run.tempo = tempo;
}

/** The countdown's length for the questions still to come; a running one keeps its own. */
export function setSeconds(g: Game, seconds: number): void {
  const run = needRun(g);
  if (!COUNTDOWN_CHOICES.includes(seconds)) throw new GameError("That countdown length isn't on offer.");
  run.seconds = seconds;
}

/** Where the open question is: being read, open for answers, or closed until the reveal. */
export function answering(g: Game): Answering | null {
  const run = g.run;
  if (!run || run.phase !== "question" || run.current < 0) return null;
  const clock = run.clocks?.[run.current];
  if (clock) return clock.closed ? "closed" : "open";
  return tempoOf(run) === "pace" ? "open" : "reading";
}

/** The open question's countdown while it runs: neither stopped nor closed. */
export function runningClock(g: Game): Clock | null {
  const run = g.run;
  if (!run || run.phase !== "question") return null;
  const clock = run.clocks?.[run.current];
  return clock && !clock.stopped && !clock.closed ? clock : null;
}

/** Go: the class has read the question; its answers appear and the countdown starts. */
export function go(g: Game, now: number): void {
  const run = needRun(g);
  if (answering(g) !== "reading") throw new GameError("The answers are already shown.");
  (run.clocks ??= {})[run.current] = { at: now, ms: secondsOf(run) * 1000 };
}

/**
 * Time's up, or everyone present answered: answering closes and the reveal
 * waits for the teacher. `view`: the version of the first view that will
 * show it closed; a tap made on an older one still counts (v1 item 15).
 */
export function closeAnswers(g: Game, view: number): void {
  const run = needRun(g);
  const clock = runningClock(g);
  if (!clock) return;
  clock.closed = true;
  (run.closedView ??= {})[run.current] ??= view;
}

/**
 * The teacher stops the clock: the answers stay open, or open again after
 * time's up, with no countdown, as at the teacher's pace. The clock's length
 * stays for the points for speed: a tap after it scores no bonus.
 */
export function stopClock(g: Game): void {
  const run = needRun(g);
  const clock = run.phase === "question" ? run.clocks?.[run.current] : undefined;
  if (!clock) throw new GameError("No countdown is running.");
  clock.stopped = true;
  if (clock.closed) {
    delete clock.closed;
    // Open again: a later close is a new one.
    if (run.closedView) delete run.closedView[run.current];
  }
}

/** When the running countdown ends (server time), or null. */
export function deadline(g: Game): number | null {
  const clock = runningClock(g);
  return clock ? clock.at + clock.ms : null;
}

/** Reveal or ranking → next question (or the final ranking after the last one). */
export function next(g: Game, now: number): void {
  const run = needRun(g);
  if (run.phase !== "reveal" && run.phase !== "ranking") throw new GameError("Reveal the answer first.");
  open(g, run, nextShown(g, run.current), now);
}

/** Reveal → intermediate ranking. */
export function showRanking(g: Game): void {
  const run = needRun(g);
  if (run.phase !== "reveal") throw new GameError("The ranking comes after a reveal.");
  run.phase = "ranking";
}

/** The one key a clicker or keyboard has: whatever comes next in the usual flow. */
export function advance(g: Game, now: number, view: number): void {
  const run = needRun(g);
  if (run.phase === "lobby") begin(g, now);
  else if (run.phase === "question" && answering(g) === "reading") go(g, now);
  else if (run.phase === "question") reveal(g, view);
  else if (run.phase === "reveal" || run.phase === "ranking") next(g, now);
}

/** Final ranking, from any point (the bell rings at question 9). An unrevealed question doesn't count. */
export function finish(g: Game, now: number): void {
  const run = needRun(g);
  run.phase = "final";
  if (run.ended === null) run.ended = now;
}

// ---------------------------------------------------------------------------
// Answers

/**
 * Records a tap. `view` is the version of the view the device showed when it
 * was tapped. Returns true when the answer was accepted (recorded, or already
 * the recorded one).
 */
export function answer(g: Game, playerId: string, q: number, choice: number, seq: number, view: number, now: number, deviceMs?: number): boolean {
  return answerOutcome(g, playerId, q, choice, seq, view, now, deviceMs) !== "refused";
}

/**
 * As `answer`, telling apart a tap that changed what is recorded (to be
 * stored) from one that didn't: a resend, or the same answer tapped again.
 * Children hammer a button; storing each tap would spend the account's daily
 * storage writes, which every class on the site shares.
 */
export function answerOutcome(
  g: Game,
  playerId: string,
  q: number,
  choice: number,
  seq: number,
  view: number,
  now: number,
  /** How long after the answers appeared the device says it was tapped. */
  deviceMs?: number,
): "recorded" | "unchanged" | "refused" {
  const run = g.run;
  if (!run) return "refused";
  const p = playerById(run, playerId);
  if (!p || p.removed) return "refused";
  // A resend of an answer already recorded (its acknowledgement was lost
  // with the connection) is confirmed, also after the reveal: it counts.
  const prev = run.answers[q]?.[playerId];
  if (prev && prev.seq >= seq) return "unchanged";
  const current = run.phase === "question" && run.current === q;
  const open = current && answering(g) === "open";
  // Tapped before the device showed answering closed (time's up, or the
  // reveal), delivered after it: the device showed the answers as open, so
  // the answer counts. While the class reads the question nothing is open.
  const closedAt = run.closedView?.[q] ?? run.revealView?.[q];
  const inTime = open || ((current || run.revealed.includes(q)) && closedAt !== undefined && view < closedAt);
  if (!inTime) return "refused";
  const question = g.quiz.questions[q];
  if (!question || !Number.isInteger(choice) || choice < 0 || choice >= question.answers.length) return "refused";
  if (prev && prev.choice === choice) {
    // The same answer again: nothing to store. The newer sequence number is
    // kept in memory, so an older different tap arriving late still loses.
    prev.seq = seq;
    return "unchanged";
  }
  const changes = prev ? (prev.changes ?? 0) + 1 : 0;
  if (changes > MAX_ANSWER_CHANGES) return "refused";
  const byPlayer = (run.answers[q] ??= {});
  // Changing one's mind is allowed until answering closes; the last tap
  // counts, with its own time. The time is the device's: from the answers
  // appearing on its screen to the tap, so a slow line or a reconnect costs
  // no speed. It can't be longer than the server's count, which includes
  // both trips over the network.
  const clock = run.clocks?.[q];
  const serverMs = Math.max(0, now - (clock ? clock.at : run.openedAt));
  const ms = typeof deviceMs === "number" && Number.isFinite(deviceMs) ? Math.round(Math.max(0, Math.min(deviceMs, serverMs))) : serverMs;
  byPlayer[playerId] = { choice, ms, seq, ...(changes > 0 ? { changes } : {}) };
  return "recorded";
}

// ---------------------------------------------------------------------------
// Fixes (backlog v1 item 9)

export function setCounts(g: Game, q: number, counts: boolean[]): void {
  const fix = g.fixes[q];
  if (!fix) throw new GameError("No such question.");
  if (counts.length !== fix.counts.length || !counts.every((c) => typeof c === "boolean"))
    throw new GameError("The answers don't match the question.");
  if (!counts.some(Boolean)) throw new GameError("At least one answer has to count. To count none, void the question.");
  fix.counts = counts.slice();
}

export function setVoid(g: Game, q: number, isVoid: boolean): void {
  const fix = g.fixes[q];
  if (!fix) throw new GameError("No such question.");
  fix.void = isVoid;
}

/** Skipping only makes sense for a question the class hasn't seen; the open one is skipped by moving on. */
export function setSkip(g: Game, q: number, skip: boolean): void {
  const fix = g.fixes[q];
  if (!fix) throw new GameError("No such question.");
  const run = g.run;
  if (run && (run.revealed.includes(q) || (run.current === q && run.phase === "question")) && skip)
    throw new GameError("The class has already seen this question; void it instead.");
  // The run only moves forward: a question behind the current one would
  // count in "n / total" but never come up.
  if (run && run.phase !== "lobby" && q <= run.current && !skip)
    throw new GameError("The class has moved past this question; it can't come back in this run.");
  fix.skip = skip;
}

export function setHidePicture(g: Game, q: number, hide: boolean): void {
  const fix = g.fixes[q];
  if (!fix) throw new GameError("No such question.");
  fix.hidePicture = hide;
}

/** Whether the open question's picture fills the projector. */
export function zoomed(g: Game): boolean {
  const run = g.run;
  return !!run && (run.phase === "question" || run.phase === "reveal") && run.zoom === `${run.phase}|${run.current}`;
}

/** The picture of the question on screen fills the projector, or goes back beside the question. */
export function setZoom(g: Game, on: boolean): void {
  const run = needRun(g);
  if (run.phase !== "question" && run.phase !== "reveal") throw new GameError("There is no question on screen.");
  if (on && (!g.quiz.questions[run.current]?.image || g.fixes[run.current].hidePicture)) throw new GameError("This question has no picture on screen.");
  if (on) run.zoom = `${run.phase}|${run.current}`;
  else delete run.zoom;
}

/** The open question goes away unscored and the next one comes up. */
export function skipCurrent(g: Game, now: number): void {
  const run = needRun(g);
  if (run.phase !== "question") throw new GameError("There is no open question to skip.");
  g.fixes[run.current].skip = true;
  delete run.answers[run.current];
  open(g, run, nextShown(g, run.current), now);
}

// ---------------------------------------------------------------------------
// Scores

export function scoringQuestions(g: Game): number[] {
  const run = g.run;
  if (!run) return [];
  return run.revealed.filter((q) => !g.fixes[q].void && !g.fixes[q].skip);
}

export function isRight(g: Game, q: number, choice: number): boolean {
  return g.fixes[q].counts[choice] === true;
}

/**
 * What an answer to question q scores under the class's tempo and the
 * current fixes: 0 when wrong; 1 when right; with points for speed
 * POINTS_RIGHT plus the speed bonus, when the question had a countdown.
 */
export function points(g: Game, q: number, a: AnswerRecord): number {
  if (!isRight(g, q, a.choice)) return 0;
  const run = g.run;
  if (tempoOf(run) !== "speed") return 1;
  const clock = run?.clocks?.[q];
  return POINTS_RIGHT + (clock ? speedBonus(a.ms, clock.ms) : 0);
}

export function scores(g: Game): Map<string, number> {
  const out = new Map<string, number>();
  const run = g.run;
  if (!run) return out;
  for (const p of activePlayers(run)) out.set(p.id, 0);
  for (const q of scoringQuestions(g)) {
    for (const [pid, a] of Object.entries(run.answers[q] ?? {})) {
      if (out.has(pid)) out.set(pid, out.get(pid)! + points(g, q, a));
    }
  }
  return out;
}

/** What a player's answer to question q scored, once revealed; null when it doesn't score (not revealed, void, skipped, no answer). */
export function pointsFor(g: Game, q: number, playerId: string): number | null {
  const run = g.run;
  const a = run?.answers[q]?.[playerId];
  if (!run || !a || !scoringQuestions(g).includes(q)) return null;
  return points(g, q, a);
}

export interface Standing {
  id: string;
  avatar: Avatar;
  score: number;
  /** Shared places for ties: 1, 1, 3. */
  place: number;
}

export function standings(g: Game): Standing[] {
  const run = g.run;
  if (!run) return [];
  const s = scores(g);
  const score = (p: Player) => s.get(p.id) ?? 0;
  const list = activePlayers(run)
    .sort((a, b) => score(b) - score(a) || a.joined - b.joined)
    .map((p): Standing => ({ id: p.id, avatar: p.avatar, score: score(p), place: 0 }));
  list.forEach((e, i) => (e.place = i > 0 && list[i - 1].score === e.score ? list[i - 1].place : i + 1));
  return list;
}

/** How many players picked each answer of question q. */
export function distribution(g: Game, q: number): number[] {
  const counts = new Array(g.quiz.questions[q]?.answers.length ?? 0).fill(0);
  if (g.run) for (const a of activeAnswers(g.run, q)) counts[a.choice]++;
  return counts;
}

/** Share of given answers that were right, per scoring question: the class's result as a picture. */
export function classResult(g: Game): { perQuestion: { right: number; given: number }[]; right: number; given: number } {
  const run = g.run;
  const perQuestion = scoringQuestions(g).map((q) => {
    const given = run ? activeAnswers(run, q) : [];
    return { right: given.filter((a) => isRight(g, q, a.choice)).length, given: given.length };
  });
  return {
    perQuestion,
    right: perQuestion.reduce((n, p) => n + p.right, 0),
    given: perQuestion.reduce((n, p) => n + p.given, 0),
  };
}

/** Position of the current question among the shown ones, and how many will be shown. */
export function progress(g: Game): { n: number; total: number } {
  const shown = g.fixes.map((f, i) => (f.skip ? -1 : i)).filter((i) => i >= 0);
  const run = g.run;
  const n = run ? shown.indexOf(run.current) + 1 : 0;
  return { n, total: shown.length };
}
