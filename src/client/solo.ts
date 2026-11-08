// Solo's run (docs/design/solo.md): the quiz as the local check holds it,
// played by one person in this page. It runs on the game's own rules
// (server/game.ts), the same a room runs on, so the check's fixes count
// here as they would there: a skipped question doesn't come up, a changed
// solution is the one that counts, a question not counted scores nothing.
// Nothing goes to the site and nothing is kept. No DOM here: the page is
// client/entry-solo.ts.

import type { Quiz } from "../quiz/format.ts";
import * as G from "../server/game.ts";

/** The one player's id in the run. */
const ME = "me";

/** The question up, as the device shows it. */
export interface SoloQuestion {
  /** Index in the quiz. */
  q: number;
  /** Position among the questions shown, 1-based, and how many there are. */
  n: number;
  total: number;
  /** Position on screen → index in the quiz text (shuffled per run unless "Order: fixed"). */
  order: number[];
}

/** The key after an answer, in the order on screen. */
export interface SoloKey {
  counts: boolean[];
  /** Not counted (a fix on the check): shown, scores nothing. */
  void: boolean;
  /** The answer chosen counts and the question counts. */
  right: boolean;
}

/**
 * A run of the quiz with the check's fixes, its answers in a fresh order,
 * and one player with this avatar (a new one when none is given: the
 * animal and colour are assigned, as in a room).
 */
export function newSoloRun(quiz: Quiz, fixes: G.Fix[], random: () => number, now: number, avatar?: G.Avatar): G.Game {
  const g = G.newGame(quiz);
  G.applyFixes(g, fixes);
  G.startRun(g, "solo", "solo", random);
  const p = G.addPlayer(g, ME, ME, now, random);
  if (avatar) p.avatar = { ...avatar };
  return g;
}

export function soloAvatar(g: G.Game): G.Avatar {
  return g.run!.players[ME].avatar;
}

/** The look chosen before the start; alone, nobody's look is scarce and nothing is spent, so the room's limit on changes doesn't apply. */
export function soloDress(g: G.Game, look: { b: number; h: number; t: number }): void {
  const { a, c } = soloAvatar(g);
  g.run!.players[ME].avatar = { a, c, ...(look.b ? { b: look.b } : {}), ...(look.h ? { h: look.h } : {}), ...(look.t ? { t: look.t } : {}) };
}

/** The first question, its answers open at once: alone, nobody reads it aloud first. */
export function soloStart(g: G.Game, now: number): void {
  G.begin(g, now);
  if (G.answering(g) === "reading") G.showAnswers(g, now);
}

/** The question up, or null once the quiz is over. */
export function soloQuestion(g: G.Game): SoloQuestion | null {
  const run = g.run!;
  if (run.phase !== "question" && run.phase !== "reveal") return null;
  const { n, total } = G.progress(g);
  return { q: run.current, n, total, order: G.orderOf(g, run.current) };
}

/** Whether the question up has its key shown (answered). */
export function soloAnswered(g: G.Game): boolean {
  return g.run!.phase === "reveal";
}

/** The answer chosen, in the order on screen, for the question up; null before it is answered. */
export function soloMine(g: G.Game): number | null {
  const run = g.run!;
  const rec = G.recordOf(g, run.current, ME);
  return rec ? G.orderOf(g, run.current).indexOf(rec.choice) : null;
}

/** The key of the question up, in the order on screen; null before it is answered. */
export function soloKey(g: G.Game): SoloKey | null {
  const run = g.run!;
  if (run.phase !== "reveal") return null;
  const q = run.current;
  const order = G.orderOf(g, q);
  const fix = g.fixes[q];
  const rec = G.recordOf(g, q, ME);
  return { counts: order.map((i) => fix.counts[i]), void: fix.void, right: !fix.void && !!rec && G.isRight(g, q, rec.choice) };
}

/** An answer, by its place on screen: it is the answer, and the key follows at once. */
export function soloAnswer(g: G.Game, shown: number, now: number): SoloKey | null {
  const run = g.run!;
  if (G.answering(g) !== "open") return null;
  const choice = G.orderOf(g, run.current)[shown];
  if (choice === undefined) return null;
  // Alone the device's clock is the only one; no points for speed, so the time only has to be in range.
  if (!G.answer(g, ME, run.current, choice, 1, 0, now)) return null;
  G.reveal(g, 1);
  return soloKey(g);
}

/** Whether the question up is the last to be shown: the next step is the result. */
export function soloLast(g: G.Game): boolean {
  return G.lastQuestion(g);
}

/** On from an answered question: the next one, its answers open, or the end. */
export function soloNext(g: G.Game, now: number): void {
  if (g.run!.phase !== "reveal") return;
  if (G.lastQuestion(g)) {
    G.finish(g, now);
    return;
  }
  G.next(g, now);
  if (G.answering(g) === "reading") G.showAnswers(g, now);
}

/** The result: right out of the questions that counted, and each of them right or not, in the order played. */
export function soloResult(g: G.Game): { right: number; of: number; each: boolean[] } {
  const per = G.classResult(g).perQuestion;
  return { right: per.reduce((n, p) => n + p.right, 0), of: per.length, each: per.map((p) => p.right > 0) };
}

/**
 * The run as text for the player's AI (docs/design/solo.md, "After the
 * run"): alone, a wrong solution can't be told from one's own mistake, and
 * the quiz carries no notes, so the AI is where a doubt can go. Each
 * question played, the answer chosen and the quiz's solution, in the
 * vocabulary of the site's other messages to an AI (solution, not key).
 */
export function soloForAi(g: G.Game): string {
  const run = g.run!;
  const quiz = g.quiz;
  const r = soloResult(g);
  const answer = (q: number, i: number) => {
    const a = quiz.questions[q].answers[i];
    return a.text || (a.image ? `the picture ${a.image}` : "a picture answer without its picture");
  };
  const lines = run.revealed.map((q, k) => {
    const question = quiz.questions[q];
    const fix = g.fixes[q];
    const rec = G.recordOf(g, q, ME);
    const text = question.text || "(no text)";
    const picture = question.image && !fix.hidePicture ? ` (with the picture ${question.image})` : "";
    const chose = rec ? `${answer(q, rec.choice)}, ${fix.void ? "not counted" : G.isRight(g, q, rec.choice) ? "right" : "wrong"}` : "nothing";
    const solution = fix.counts.flatMap((c, i) => (c ? [answer(q, i)] : [])).join("; ");
    return `${k + 1}. ${text.replace(/\n/g, " ")}${picture}\n   I chose: ${chose}\n   Solution: ${solution}`;
  });
  return `I played the quiz "${quiz.title || "Quiz"}" on my own: ${r.right} of ${r.of} right. Here is each question, the answer I chose and the quiz's solution. Please explain the ones I got wrong, and tell me if a solution itself looks wrong.\n\n${lines.join("\n")}\n`;
}
