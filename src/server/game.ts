// The run of a quiz as a pure state machine: who has joined, which question is
// up, what each student answered, and what the teacher has fixed. No I/O, no
// clock and no randomness of its own (both are passed in), so it runs the same
// in the Durable Object, in tests and in a simulation.
//
// Scores are never stored. They are computed from the recorded answers and the
// current fixes, so a key changed after the reveal moves the points with it.
// Points for speed are the same kind of computation: each answer keeps how
// long after the answers appeared it was tapped (shared/tempo.ts).
//
// When a tap counts, and when a question's answers settle: answerOutcome and
// docs/design/question-flow.md, "When a tap counts".

import type { Quiz } from "../quiz/format.ts";
import { CLASS_FULL, CLASS_STARTED, CLASS_WAITING, DOOR_OPEN_MS, MAX_ANSWER_CHANGES, MAX_LATE_JOINERS, MAX_PLAYERS } from "../shared/limits.ts";
import { MAX_LOOK_CHANGES, sameLook, validLook } from "../shared/looks.ts";
import { LAST_CALL_MS, POINTS_RIGHT, speedBonus } from "../shared/tempo.ts";

export type Phase = "lobby" | "question" | "reveal" | "ranking" | "final";

/**
 * Within an open question: the class reads it, its answers hidden; the
 * answers are open; or answering is locked in, the spread on the wall, and
 * the reveal waits for the teacher.
 */
export type Answering = "reading" | "open" | "closed";

/** Last call on one question: from the teacher's press, LAST_CALL_MS, then answering locks in. */
export interface Clock {
  /** When Last call was pressed (server time). */
  at: number;
  ms: number;
}

/** The teacher's corrections to one question; they apply to every run of the instance. */
export interface Fix {
  /** Which answers count as right. At least one, unless the question is void. */
  counts: boolean[];
  /** Counts for nobody (shown, but no points). */
  void: boolean;
  /** Not shown at all. */
  skip: boolean;
  /** The question's picture stays off the projector (a wrong or revealing crop). */
  hidePicture?: boolean;
}

export interface Avatar {
  /** Index into the animal set. */
  a: number;
  /** Index into the colour set. */
  c: number;
  /** The background shape the child chose in the lobby (shared/looks.ts); absent: the disc. */
  b?: number;
  /** The hat the child chose in the lobby; absent: none. */
  h?: number;
  /** The tool the child chose in the lobby; absent: none. */
  t?: number;
}

export interface Player {
  id: string;
  token: string;
  avatar: Avatar;
  joined: number;
  removed: boolean;
  /** Joined once the class had arrived (`doorOpen` false): MAX_LATE_JOINERS of these. */
  late?: boolean;
  /** Changes of look stored for this player (MAX_LOOK_CHANGES); absent until the first. */
  looks?: number;
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
   * closed: locked in, or the reveal. An answer tapped on an older view was
   * in time as far as the device showed, and counts when it arrives before
   * the class leaves the question's reveal.
   */
  closedView?: Record<string, number>;
  /** Points for speed, the teacher's switch on the join screen; fixed at Start. Missing: off. */
  speed?: boolean;
  /** Question index → when its answers appeared (server time): answering opened, and the time for speed runs from here. */
  shown?: Record<string, number>;
  /** Question index → its Last call, once pressed. */
  clocks?: Record<string, Clock>;
  /** How many questions have come up so far (the door narrows from the second). */
  opened?: number;
  players: Record<string, Player>;
  /** Join command id → player it created, so a resent join doesn't make a second avatar. */
  joins?: Record<string, string>;
  /** Question index → player id → answer. */
  answers: Record<string, Record<string, AnswerRecord>>;
  ended: number | null;
  /** When the teacher started the quiz (server time); missing before the start. */
  started?: number;
  /**
   * Per question, the order its answers are shown in: position on screen →
   * index in the quiz text. Everything stored (answers, fixes) is by the
   * text's index; the views show this order. Missing in tests: the text's
   * order.
   */
  order?: number[][];
  /**
   * The open question's picture fills the projector: "phase|current" of the
   * step it was enlarged in, so moving on (or revealing) ends it by itself.
   */
  zoom?: string;
  /**
   * The question locked in, its spread on the wall and its key not yet shown:
   * answering is closed, and the next step is the reveal. Only meaningful while that question is the open one; the run
   * only moves forward, so an index left from an earlier question never
   * matches.
   */
  votes?: number;
  /**
   * The class waits outside: the teacher hasn't let it in yet ("Let the class
   * in", or Start). Students can't join until then; teacher devices aren't
   * players and come in any time. Absent: let in.
   */
  waiting?: true;
  /**
   * Peers (docs/design/peers.md): nobody steers, everyone plays. A
   * question's choices show with it, it closes once everyone present has
   * answered, and the next comes once everyone present is done with its
   * solution. `host`: the player who opened the room, who also starts it,
   * ends it, fixes a solution and removes an avatar. Absent: a room someone
   * steers.
   */
  peers?: { host: string };
  /** Peers: player id → the question whose solution that player is done with (tapped on). */
  ready?: Record<string, number>;
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
 * The class, at upload. With `random`, each question's answers get a
 * fresh order, the same on every screen, unless the quiz keeps it ("Order:
 * fixed"; nothing else does: a rule the AI and the teacher can't see is one
 * they can't rely on; docs/design/quiz-format.md, "Answers are shuffled").
 */
export function startRun(g: Game, code: string, id: string, random?: () => number): void {
  g.run = { id, code, phase: "lobby", current: -1, openedAt: 0, revealed: [], players: {}, answers: {}, ended: null };
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

export { CLASS_WAITING, DOOR_OPEN_MS, MAX_ANSWER_CHANGES, MAX_LATE_JOINERS, MAX_PLAYERS };

/**
 * Whether a new player comes in freely: the class is still arriving. That
 * is the lobby, and after the start the first DOOR_OPEN_MS and the first
 * question, however long the teacher keeps it up: slow tablets arrive in
 * the first minutes, and a teacher who started before handing the tablets
 * out waits at the first question for the class. Once the second question
 * is up and the minutes are over, the quiz is under way and the door
 * narrows to MAX_LATE_JOINERS (docs/design/class-and-wall.md, "The door").
 */
export function doorOpen(run: Run, now: number): boolean {
  if (run.phase === "lobby") return true;
  if (run.phase === "final" || run.started === undefined) return false;
  return now - run.started < DOOR_OPEN_MS || (run.opened ?? 0) <= 1;
}

export function addPlayer(g: Game, id: string, token: string, now: number, random: () => number): Player {
  const run = needRun(g);
  if (run.phase === "final") throw new GameError("This quiz has finished.");
  if (run.waiting) throw new GameError(CLASS_WAITING);
  const all = Object.values(run.players);
  if (all.length >= MAX_PLAYERS) throw new GameError(CLASS_FULL);
  const late = !doorOpen(run, now);
  if (late && all.filter((p) => p.late).length >= MAX_LATE_JOINERS) throw new GameError(CLASS_STARTED);
  const p: Player = { id, token, avatar: pickAvatar(run, random), joined: now, removed: false, ...(late ? { late: true } : {}) };
  run.players[id] = p;
  return p;
}

/**
 * A child dresses their animal (docs/design/class-and-wall.md, "Dressing the
 * avatar"): the background shape, the hat and the tool, set as a whole so a
 * resend changes nothing. A page from before the tools sends no tool: none.
 * Only in the lobby; the look is fixed at Start, so the wall's avatars stay
 * as the children last saw them. "same": nothing to store. "refused": not
 * now, not a look the menu has, or MAX_LOOK_CHANGES spent; the device then
 * shows the look that is stored.
 */
export function dress(g: Game, playerId: string, b: unknown, h: unknown, t: unknown = 0): "stored" | "same" | "refused" {
  const run = g.run;
  const p = run ? playerById(run, playerId) : null;
  if (!run || !p || p.removed || run.phase !== "lobby" || !validLook(b, h, t)) return "refused";
  const look = { b: b as number, h: h as number, t: t as number };
  if (sameLook(p.avatar, look)) return "same";
  if ((p.looks ?? 0) >= MAX_LOOK_CHANGES) return "refused";
  p.looks = (p.looks ?? 0) + 1;
  const { a, c } = p.avatar;
  p.avatar = { a, c, ...(look.b ? { b: look.b } : {}), ...(look.h ? { h: look.h } : {}), ...(look.t ? { t: look.t } : {}) };
  return "stored";
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
  run.opened = (run.opened ?? 0) + 1;
  // Peers: nobody reads the question aloud first, so its choices come with it.
  if (run.peers) (run.shown ??= {})[q] = now;
}

export function begin(g: Game, now: number): void {
  const run = needRun(g);
  if (run.phase !== "lobby") throw new GameError("The quiz has already started.");
  delete run.waiting;
  run.started = now;
  open(g, run, nextShown(g, -1), now);
}

/** "Let the class in": students can join from now on. In the lobby only; again changes nothing. */
export function letIn(g: Game): void {
  const run = needRun(g);
  if (run.phase !== "lobby") return;
  delete run.waiting;
}

export function answering(g: Game): Answering | null {
  const run = g.run;
  if (!run || run.phase !== "question" || run.current < 0) return null;
  if (run.votes === run.current) return "closed";
  return run.shown?.[run.current] !== undefined ? "open" : "reading";
}

/** The open question's answers appear: answering opens, and the time for speed starts. */
export function showAnswers(g: Game, now: number): void {
  const run = needRun(g);
  if (answering(g) !== "reading") throw new GameError("The choices are already shown.");
  (run.shown ??= {})[run.current] = now;
}

/**
 * Last call: LAST_CALL_MS, then answering locks in by itself (the alarm, see
 * `deadline`). From the question with its answers hidden it shows them too.
 * Once per question.
 */
export function lastCall(g: Game, now: number): void {
  const run = needRun(g);
  const a = answering(g);
  if (a === "reading") showAnswers(g, now);
  else if (a !== "open") throw new GameError("Answering is already closed.");
  if (run.clocks?.[run.current]) throw new GameError("The countdown is already running.");
  (run.clocks ??= {})[run.current] = { at: now, ms: LAST_CALL_MS };
}

/**
 * Lock in: answering closes and how the class answered goes on the wall,
 * without the key, so nobody copies the majority. By the teacher's press, at
 * the end of Last call, or once everyone there has answered during it. `view`
 * is the version of the first view that shows it locked; a tap made on an
 * older one still counts. The reveal, the next step, adds the key.
 */
export function lockIn(g: Game, view: number): void {
  const run = needRun(g);
  if (run.phase !== "question") throw new GameError("There is no open question.");
  if (answering(g) === "reading") throw new GameError("The choices aren't shown yet.");
  if (lockedIn(g)) return;
  (run.closedView ??= {})[run.current] ??= view;
  run.votes = run.current;
  // An enlarged picture would cover the spread; the reveal ends it the same way.
  delete run.zoom;
}

/** The open question is locked in: its spread on the wall, its key not yet. */
export function lockedIn(g: Game): boolean {
  const run = g.run;
  return !!run && run.phase === "question" && run.votes === run.current;
}

/** The key. `view`: the version of the first view that will show it. From the lock-in, or straight from answering. */
export function reveal(g: Game, view: number): void {
  const run = needRun(g);
  if (run.phase !== "question") throw new GameError("There is no open question to reveal.");
  if (answering(g) === "reading") throw new GameError("The choices aren't shown yet.");
  if (!run.revealed.includes(run.current)) run.revealed.push(run.current);
  // The lock-in may have closed answering earlier; that view is the one that counts.
  (run.closedView ??= {})[run.current] ??= view;
  run.phase = "reveal";
}

/** Last call, while it runs: pressed, and answering not yet locked in. */
export function runningClock(g: Game): Clock | null {
  const run = g.run;
  if (!run || run.phase !== "question" || lockedIn(g)) return null;
  return run.clocks?.[run.current] ?? null;
}

/** When Last call ends (server time), or null. */
export function deadline(g: Game): number | null {
  const clock = runningClock(g);
  return clock ? clock.at + clock.ms : null;
}

/** Last call ran out, or everyone there answered during it: answering locks in. `view`: as in lockIn. */
export function closeAnswers(g: Game, view: number): void {
  if (runningClock(g)) lockIn(g, view);
}

/** Points for speed, the teacher's switch on the join screen: only in the lobby, so the whole class plays one way. */
export function setSpeed(g: Game, on: boolean): void {
  const run = needRun(g);
  if (run.phase !== "lobby") throw new GameError("Points for speed are set before the start.");
  if (on) run.speed = true;
  else delete run.speed;
}

/** Whether right answers score more the quicker they came. */
export function speedScale(g: Game): boolean {
  return !!g.run?.speed;
}

/** Whether no question comes after the current one: its reveal is followed by the final ranking. */
export function lastQuestion(g: Game): boolean {
  const run = g.run;
  return !!run && nextShown(g, run.current) === -1;
}

/** Reveal or ranking → next question (or the final ranking after the last one). */
export function next(g: Game, now: number): void {
  const run = needRun(g);
  if (run.phase !== "reveal" && run.phase !== "ranking") throw new GameError("Show the solution first.");
  open(g, run, nextShown(g, run.current), now);
}

export function showRanking(g: Game): void {
  const run = needRun(g);
  if (run.phase !== "reveal") throw new GameError("The ranking comes after a reveal.");
  run.phase = "ranking";
}

/**
 * Play, the steering bar's step: one slice on from where the question is.
 * Question → Show answers → Lock in → Reveal → Ranking →
 * Next; after the last question's reveal, the final ranking.
 */
export function play(g: Game, now: number, view: number): void {
  const run = needRun(g);
  const a = answering(g);
  if (run.phase === "question" && a === "reading") showAnswers(g, now);
  else if (run.phase === "question" && a === "open") lockIn(g, view);
  else if (run.phase === "question") reveal(g, view);
  else if (run.phase === "reveal" && lastQuestion(g)) finish(g, now);
  else if (run.phase === "reveal") showRanking(g);
  else if (run.phase === "ranking") next(g, now);
  else throw new GameError("Nothing to step on to.");
}

/** Final ranking, from any point (the bell rings at question 9). An unrevealed question doesn't count. */
export function finish(g: Game, now: number): void {
  const run = needRun(g);
  run.phase = "final";
  if (run.ended === null) run.ended = now;
}

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
  // The question is still on screen: being answered, locked in, or
  // revealed. Once the class has left its reveal its answers are settled.
  const onScreen = run.current === q && (run.phase === "question" || run.phase === "reveal");
  const open = onScreen && answering(g) === "open";
  // Tapped before the device showed answering closed (locked in, or the
  // reveal), delivered after it: the device showed the answers as open, so
  // the answer counts, as long as the question is still on screen. While the
  // class reads the question nothing is open.
  const closedAt = run.closedView?.[q];
  const inTime = open || (onScreen && closedAt !== undefined && view < closedAt);
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
  // The time is the device's, capped at the server's own count
  // (docs/design/question-flow.md, "Whose time it is").
  const serverMs = Math.max(0, now - (run.shown?.[q] ?? run.openedAt));
  const ms = typeof deviceMs === "number" && Number.isFinite(deviceMs) ? Math.round(Math.max(0, Math.min(deviceMs, serverMs))) : serverMs;
  byPlayer[playerId] = { choice, ms, seq, ...(changes > 0 ? { changes } : {}) };
  return "recorded";
}

export function setCounts(g: Game, q: number, counts: boolean[]): void {
  const fix = g.fixes[q];
  if (!fix) throw new GameError("No such question.");
  if (counts.length !== fix.counts.length || !counts.every((c) => typeof c === "boolean"))
    throw new GameError("The answers don't match the question.");
  if (!counts.some(Boolean)) throw new GameError("At least one choice has to be right. For none, don't count the question.");
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
    throw new GameError("The class has already seen this question; it can only be not counted.");
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

/**
 * The fixes made on the local check before the upload (docs/design/local-check.md,
 * "Opening a room"), applied to a new game through the same rules as a
 * teacher's fix: the browser isn't trusted. A value that doesn't fit its
 * question is left as the quiz has it; the rest still apply.
 */
export function applyFixes(g: Game, fixes: unknown): void {
  if (!Array.isArray(fixes) || fixes.length !== g.fixes.length) return;
  fixes.forEach((f: unknown, q) => {
    if (!f || typeof f !== "object") return;
    const { counts, void: isVoid, skip, hidePicture } = f as Record<string, unknown>;
    const tries: (() => void)[] = [];
    if (Array.isArray(counts)) tries.push(() => setCounts(g, q, counts));
    if (typeof isVoid === "boolean") tries.push(() => setVoid(g, q, isVoid));
    if (typeof skip === "boolean") tries.push(() => setSkip(g, q, skip));
    if (typeof hidePicture === "boolean") tries.push(() => setHidePicture(g, q, hidePicture));
    for (const t of tries) {
      try {
        t();
      } catch (e) {
        if (!(e instanceof GameError)) throw e;
      }
    }
  });
}

// Peers (docs/design/peers.md, "Nobody steers"): the room moves on when
// everyone present is done, on the plausible assumption that a few friends
// wait for each other. "Present" is the room's to say (its devices'
// lines); here it is a set of player ids.

/** The room runs on its own: nobody steers. */
export function isPeers(g: Game): boolean {
  return !!g.run?.peers;
}

/** The player who opened a Peers room. */
export function isHost(g: Game, playerId: string): boolean {
  return !!g.run?.peers && g.run.peers.host === playerId;
}

/**
 * Peers: a player is done with the open question's solution (tapped on).
 * "same": already done; "refused": not now (no solution showing, another
 * question, a removed avatar).
 */
export function setReady(g: Game, playerId: string, q: number): "stored" | "same" | "refused" {
  const run = g.run;
  const p = run ? playerById(run, playerId) : null;
  if (!run?.peers || !p || p.removed || run.phase !== "reveal" || run.current !== q) return "refused";
  if (run.ready?.[playerId] === q) return "same";
  (run.ready ??= {})[playerId] = q;
  return "stored";
}

/** Peers: whether this player is done with the open question's solution. */
export function isReady(g: Game, playerId: string): boolean {
  const run = g.run;
  return !!run?.peers && run.phase === "reveal" && run.ready?.[playerId] === run.current;
}

/** Peers: whether this player is done with the step the room is on: answered the open question, or done with its solution. */
function done(g: Game, run: Run, playerId: string): boolean {
  if (run.phase === "question") return Object.hasOwn(run.answers[run.current] ?? {}, playerId);
  return run.ready?.[playerId] === run.current;
}

/** Peers: the present players the room waits for, in the lobby's order; none outside a question and its solution. */
export function waitingFor(g: Game, present: Set<string>): string[] {
  const run = g.run;
  if (!run?.peers || (run.phase !== "question" && run.phase !== "reveal")) return [];
  return activePlayers(run)
    .filter((p) => present.has(p.id) && !done(g, run, p.id))
    .map((p) => p.id);
}

/**
 * Peers: whether the room moves on now. Someone is done, and nobody present
 * isn't: a device away (a phone asleep, a battery dead) doesn't hold the
 * room, but nobody being done holds it, so a room whose phones all slept
 * doesn't run through its questions.
 */
export function peersDue(g: Game, present: Set<string>): boolean {
  return anyoneDone(g) && waitingFor(g, present).length === 0;
}

/** Peers: someone has answered the open question, or is done with its solution. */
export function anyoneDone(g: Game): boolean {
  const run = g.run;
  if (!run?.peers || (run.phase !== "question" && run.phase !== "reveal")) return false;
  return activePlayers(run).some((p) => done(g, run, p.id));
}

/**
 * Peers, one step on: the open question's solution, or after it the next
 * question (the final ranking after the last). There is no ranking step
 * between them: each device shows the ranking while it waits for the
 * others. `view`: as in reveal.
 */
export function goOn(g: Game, now: number, view: number): void {
  const run = needRun(g);
  if (run.phase === "question") reveal(g, view);
  else if (run.phase === "reveal") {
    if (lastQuestion(g)) finish(g, now);
    else next(g, now);
  } else throw new GameError("Nothing to go on to.");
}

/** Peers: one step on if everyone present is done (peersDue). True when it stepped. */
export function peersStep(g: Game, now: number, view: number, present: Set<string>): boolean {
  if (!peersDue(g, present)) return false;
  goOn(g, now, view);
  return true;
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

export function scoringQuestions(g: Game): number[] {
  const run = g.run;
  if (!run) return [];
  return run.revealed.filter((q) => !g.fixes[q].void && !g.fixes[q].skip);
}

export function isRight(g: Game, q: number, choice: number): boolean {
  return g.fixes[q].counts[choice] === true;
}

export function points(g: Game, q: number, a: AnswerRecord, scale = speedScale(g)): number {
  if (!isRight(g, q, a.choice)) return 0;
  return scale ? POINTS_RIGHT + speedBonus(a.ms) : 1;
}

/**
 * A player's stored answer to question q, as the acknowledgement of a tap
 * carries it back: the record the tablet shows as accepted, and the one that
 * scores. Null when there is none.
 */
export function recordOf(g: Game, q: number, playerId: string): { choice: number; seq: number } | null {
  const a = g.run?.answers[q]?.[playerId];
  return a ? { choice: a.choice, seq: a.seq } : null;
}

export function scores(g: Game): Map<string, number> {
  const out = new Map<string, number>();
  const run = g.run;
  if (!run) return out;
  for (const p of activePlayers(run)) out.set(p.id, 0);
  const scale = speedScale(g);
  for (const q of scoringQuestions(g)) {
    for (const [pid, a] of Object.entries(run.answers[q] ?? {})) {
      if (out.has(pid)) out.set(pid, out.get(pid)! + points(g, q, a, scale));
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

/**
 * Who got question q right, in the order they joined (the lobby's order,
 * not the answers'): the wall's celebration after the reveal. Nobody for a
 * void question; a removed avatar never.
 */
export function winners(g: Game, q: number): string[] {
  const run = g.run;
  if (!run || g.fixes[q]?.void) return [];
  const answers = run.answers[q] ?? {};
  return activePlayers(run)
    .filter((p) => answers[p.id] && isRight(g, q, answers[p.id].choice))
    .map((p) => p.id);
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
