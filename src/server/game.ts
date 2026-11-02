// The run of a quiz as a pure state machine: who has joined, which question is
// up, what each student answered, and what the teacher has fixed. No I/O, no
// clock and no randomness of its own (both are passed in), so it runs the same
// in the Durable Object, in tests and in a simulation.
//
// Scores are never stored. They are computed from the recorded answers and the
// current fixes, so a key changed after the reveal moves the points with it
// (backlog v1 item 9), and speed scoring (v2) only needs the answer times that
// are already recorded.

import type { Quiz } from "../quiz/format.ts";

export type Phase = "lobby" | "question" | "reveal" | "ranking" | "final";

/** The teacher's corrections to one question; they apply to every run of the instance. */
export interface Fix {
  /** Which answers count as right. At least one, unless the question is void. */
  counts: boolean[];
  /** Counts for nobody (shown, but no points). */
  void: boolean;
  /** Not shown at all. */
  skip: boolean;
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
}

export interface AnswerRecord {
  choice: number;
  /** Milliseconds after the question opened (for speed scoring in v2). */
  ms: number;
  /** The client's sequence number; a lower one arriving late is ignored. */
  seq: number;
}

export interface Run {
  code: string;
  phase: Phase;
  /** Index of the question that is up (or was last up); -1 before the first. */
  current: number;
  openedAt: number;
  /** Questions whose answer was revealed, in order; only these score. */
  revealed: number[];
  players: Record<string, Player>;
  /** Join command id → player it created, so a resent join doesn't make a second avatar. */
  joins?: Record<string, string>;
  /** Question index → player id → answer. */
  answers: Record<string, Record<string, AnswerRecord>>;
  started: number;
  ended: number | null;
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

export function startRun(g: Game, code: string, now: number): Run {
  g.run = {
    code,
    phase: "lobby",
    current: -1,
    openedAt: 0,
    revealed: [],
    players: {},
    answers: {},
    started: now,
    ended: null,
  };
  return g.run;
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

export function addPlayer(g: Game, id: string, token: string, now: number, random: () => number): Player {
  const run = needRun(g);
  if (run.phase === "final") throw new GameError("This quiz has finished.");
  const p: Player = { id, token, avatar: pickAvatar(run, random), joined: now, removed: false };
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

export function reveal(g: Game): void {
  const run = needRun(g);
  if (run.phase !== "question") throw new GameError("There is no open question to reveal.");
  if (!run.revealed.includes(run.current)) run.revealed.push(run.current);
  run.phase = "reveal";
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
export function advance(g: Game, now: number): void {
  const run = needRun(g);
  if (run.phase === "lobby") begin(g, now);
  else if (run.phase === "question") reveal(g);
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

/** Returns true when the answer was recorded (or was already the recorded one). */
export function answer(g: Game, playerId: string, q: number, choice: number, seq: number, now: number): boolean {
  const run = g.run;
  if (!run) return false;
  const p = playerById(run, playerId);
  if (!p || p.removed) return false;
  // A resend of an answer already recorded (its acknowledgement was lost
  // with the connection) is confirmed, also after the reveal: it counts.
  const prev = run.answers[q]?.[playerId];
  if (prev && prev.seq >= seq) return true;
  if (run.phase !== "question" || run.current !== q) return false;
  const question = g.quiz.questions[q];
  if (!question || !Number.isInteger(choice) || choice < 0 || choice >= question.answers.length) return false;
  const byPlayer = (run.answers[q] ??= {});
  // Changing one's mind is allowed until the reveal; the time is the last tap's.
  byPlayer[playerId] = { choice, ms: Math.max(0, now - run.openedAt), seq };
  return true;
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

/** Questions that score: revealed and not void. */
export function scoringQuestions(g: Game): number[] {
  const run = g.run;
  if (!run) return [];
  return run.revealed.filter((q) => !g.fixes[q].void && !g.fixes[q].skip);
}

export function isRight(g: Game, q: number, choice: number): boolean {
  return g.fixes[q].counts[choice] === true;
}

export function scores(g: Game): Map<string, number> {
  const out = new Map<string, number>();
  const run = g.run;
  if (!run) return out;
  for (const p of activePlayers(run)) out.set(p.id, 0);
  for (const q of scoringQuestions(g)) {
    for (const [pid, a] of Object.entries(run.answers[q] ?? {})) {
      if (out.has(pid) && isRight(g, q, a.choice)) out.set(pid, out.get(pid)! + 1);
    }
  }
  return out;
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
  const list = activePlayers(run)
    .map((p) => ({ id: p.id, avatar: p.avatar, score: s.get(p.id) ?? 0, place: 0, joined: p.joined }))
    .sort((a, b) => b.score - a.score || a.joined - b.joined);
  list.forEach((e, i) => (e.place = i > 0 && list[i - 1].score === e.score ? list[i - 1].place : i + 1));
  return list.map(({ joined: _j, ...e }) => e);
}

/** How many players picked each answer of question q. */
export function distribution(g: Game, q: number): number[] {
  const run = g.run;
  const counts = new Array(g.quiz.questions[q]?.answers.length ?? 0).fill(0);
  if (!run) return counts;
  for (const [pid, a] of Object.entries(run.answers[q] ?? {})) {
    const p = run.players[pid];
    if (p && !p.removed) counts[a.choice]++;
  }
  return counts;
}

/** Share of given answers that were right, per scoring question: the class's result as a picture. */
export function classResult(g: Game): { perQuestion: { q: number; right: number; given: number }[]; right: number; given: number } {
  const run = g.run;
  const perQuestion: { q: number; right: number; given: number }[] = [];
  let right = 0;
  let given = 0;
  if (!run) return { perQuestion, right, given };
  for (const q of scoringQuestions(g)) {
    let r = 0;
    let n = 0;
    for (const [pid, a] of Object.entries(run.answers[q] ?? {})) {
      const p = run.players[pid];
      if (!p || p.removed) continue;
      n++;
      if (isRight(g, q, a.choice)) r++;
    }
    perQuestion.push({ q, right: r, given: n });
    right += r;
    given += n;
  }
  return { perQuestion, right, given };
}

/** Position of the current question among the shown ones, and how many will be shown. */
export function progress(g: Game): { n: number; total: number } {
  const shown = g.fixes.map((f, i) => (f.skip ? -1 : i)).filter((i) => i >= 0);
  const run = g.run;
  const n = run ? shown.indexOf(run.current) + 1 : 0;
  return { n, total: shown.length };
}
