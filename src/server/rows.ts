// What a class books of the day's allowances (docs/design/hosting-and-limits.md,
// Situation, "What a class costs", and "Running classes finish"): rows,
// requests and the seconds its object is kept awake.
//
// Rows have a most a class can write, and are booked at it. Every write of
// the instance stores its meta with what changed, so a stored change is two
// rows. Answers and looks are held in memory and ride on the writes counted
// here (docs/design/open-period-in-memory.md), so a class books writes, not
// taps.
//
// Requests and duration have no most: they grow with the time devices stay
// on. A class books an estimate of them from what is known when it books,
// and books again when what it shows outgrows that (a device falling back to
// long-poll). The figures below are estimates from docs/scaling-drawer.md
// ("Requests", "Duration"), not measurements; telemetry is to replace them.

import type { LineCounts } from "../shared/line.ts";
import { MAX_LATE_JOINERS, MAX_LINE_WRITES, MAX_PLAYERS, SLEEP_AFTER_MS, type Cost } from "../shared/limits.ts";

/** A student in the lobby: the join, and a few avatars taken back. */
const PER_PLAYER_LOBBY = 6;
/** A student once under way: a join as a latecomer, or a few avatars taken back. */
const PER_PLAYER_RUN = 6;
/**
 * The steps through one question, a fix or two among them, and the alarms
 * they set; in a Peers room the room's own steps and its rechecks of who is
 * away.
 */
const PER_QUESTION_STEPS = 20;
/** Writes because a line ended with input held unwritten, per stage (the lobby, each question). */
const PER_STAGE_LINES = 2 * MAX_LINE_WRITES;
/** Roles taken, the speed switch, removals. */
const FIXED = 50;

/**
 * Requests are estimated for the design target's class when the class isn't
 * there yet (backlog, Project): a larger one books more once it is, at Start.
 * The teacher's devices: a wall, and a Remote often enough to count it.
 */
const DESIGN_CLASS = 25;
const TEACHER_DEVICES = 2;
/** A device's sockets, each an upgrade: the first plus about three reconnects (lock, recess, a network switch; scaling-drawer.md, a guess). */
const REQUESTS_PER_DEVICE = 4;
/** A WebSocket device's messages over a question, twenty to a request: about 250 for a class of 25 over 15 questions. */
const REQUESTS_PER_QUESTION_WS = 0.5;
/** A polling device's polls and commands over a question: about 3,000 for a class of 25 over 15 questions. */
const REQUESTS_PER_QUESTION_POLL = 8;
/** A question's time in a lesson: 45 minutes for 15 questions. Plausible assumption; telemetry's minutes against questions played tell. */
const SECONDS_PER_QUESTION = 180;
/** A poll is held up to this long (POLL_HOLD_MS in server/instance.ts): what a poller on the final ranking spends, one poll per hold. */
const POLL_HOLD_S = 25;
/**
 * Before the class is there, its devices' lines aren't known. Plausible
 * assumptions, kept pessimistic against "Which devices poll"
 * (hosting-and-limits.md, Situation): a tenth of devices poll, and four
 * classes in ten have at least one poller, which keeps the object awake.
 * Telemetry: `polled` of `devices`, and the classes with a poller.
 */
const POLLING_DEVICES = 0.1;
const POLLER_CLASSES = 0.4;

const NONE: Cost = { rows: 0, requests: 0, awakeS: 0 };

/** Letting the class in (a Peers room: opening it): the class isn't known yet. Rows: the most players a class can have; the rest an estimate. */
export function atLetIn(questions: number): Cost {
  const devices = DESIGN_CLASS + TEACHER_DEVICES;
  return {
    rows: FIXED + PER_STAGE_LINES + questions * (PER_QUESTION_STEPS + PER_STAGE_LINES) + MAX_PLAYERS * PER_PLAYER_LOBBY,
    requests: Math.ceil(devices * REQUESTS_PER_DEVICE + requestsOver(devices, devices * POLLING_DEVICES, questions)),
    awakeS: Math.ceil(POLLER_CLASSES * questions * SECONDS_PER_QUESTION),
  };
}

/** The class as it is now: its players, its devices (players' and the teacher's) and how many of them poll, the questions still to come. */
export interface ClassNow {
  players: number;
  devices: number;
  pollers: number;
  questionsLeft: number;
}

/**
 * The most rows and the estimated requests and awake seconds still ahead of
 * a class from the start on: the lobby is behind, the class is there, and
 * the door lets in a few more, each of them perhaps a poller. Awake time
 * only with a poller now: a class on WebSockets that falls back later books
 * again when it shows (`grown`).
 */
export function ahead(c: ClassNow): Cost {
  const late = Math.max(0, Math.min(MAX_PLAYERS, c.players + MAX_LATE_JOINERS) - c.players);
  const devices = c.devices + late;
  const pollers = c.pollers + late * POLLING_DEVICES;
  return {
    rows: FIXED + c.questionsLeft * (PER_QUESTION_STEPS + PER_STAGE_LINES) + (c.players + late) * PER_PLAYER_RUN,
    requests: Math.ceil(late * REQUESTS_PER_DEVICE + requestsOver(devices, pollers, c.questionsLeft)),
    awakeS: c.pollers > 0 ? c.questionsLeft * SECONDS_PER_QUESTION : 0,
  };
}

/** After the final ranking: devices left polling on it, until they sleep (SLEEP_AFTER_MS). Nothing is written then. */
export function tail(pollers: number): Cost {
  if (pollers <= 0) return NONE;
  const s = SLEEP_AFTER_MS / 1000;
  return { rows: 0, requests: Math.ceil(pollers * (s / POLL_HOLD_S)), awakeS: s };
}

/**
 * What the class has spent, from its devices' own counts (docs/design/telemetry.md,
 * "What is counted, and by whom"): each HTTP request and socket one,
 * messages twenty to one; awake for as long as its longest poller polled.
 */
export function spent(lines: LineCounts[], rowsWritten: number): Cost {
  let requests = 0;
  let awakeS = 0;
  for (const l of lines) {
    requests += l.http + l.opened + Math.ceil(l.sent / 20);
    awakeS = Math.max(awakeS, l.pollS);
  }
  return { rows: rowsWritten, requests, awakeS };
}

function requestsOver(devices: number, pollers: number, questions: number): number {
  return (devices - pollers) * questions * REQUESTS_PER_QUESTION_WS + pollers * questions * REQUESTS_PER_QUESTION_POLL;
}

export function add(a: Cost, b: Cost): Cost {
  return { rows: a.rows + b.rows, requests: a.requests + b.requests, awakeS: a.awakeS + b.awakeS };
}

/** The booking moved from `from` to `to`, applied to a ledger; never below nothing. */
export function moved(ledger: Cost, from: Cost, to: Cost): Cost {
  return {
    rows: Math.max(0, ledger.rows + to.rows - from.rows),
    requests: Math.max(0, ledger.requests + to.requests - from.requests),
    awakeS: Math.max(0, ledger.awakeS + to.awakeS - from.awakeS),
  };
}

/** Whether `ledger` holds no more than `share` in every allowance. */
export function within(ledger: Cost, share: Cost): boolean {
  return ledger.rows <= share.rows && ledger.requests <= share.requests && ledger.awakeS <= share.awakeS;
}

/** How full the ledger is, in the fullest allowance: 1 is the whole share. */
export function fullness(ledger: Cost, share: Cost): number {
  return Math.max(ledger.rows / share.rows, ledger.requests / share.requests, ledger.awakeS / share.awakeS);
}

/** How many more classes booking `each` fit beside `ledger` within `share`. */
export function room(ledger: Cost, each: Cost, share: Cost): number {
  const fit = (k: keyof Cost) => (each[k] > 0 ? Math.floor((share[k] - ledger[k]) / each[k]) : Infinity);
  return Math.max(0, Math.min(fit("rows"), fit("requests"), fit("awakeS")));
}

/**
 * What the class needs booked now, when it has outgrown `booked` by more than
 * is worth a call to the site's ledger (a request and a few rows): a poller
 * appeared, or the class spends faster than estimated. Null: the booking holds.
 */
export function grown(booked: Cost, need: Cost): Cost | null {
  const over = need.rows > booked.rows || need.requests > booked.requests * 1.1 + 20 || need.awakeS > booked.awakeS + SECONDS_PER_QUESTION;
  return over ? { rows: Math.max(booked.rows, need.rows), requests: Math.max(booked.requests, need.requests), awakeS: Math.max(booked.awakeS, need.awakeS) } : null;
}

/** A stored ledger or booking: a number is one from before requests and duration were booked, rows alone. */
export function asCost(v: unknown): Cost {
  if (typeof v === "number") return { rows: v, requests: 0, awakeS: 0 };
  if (v && typeof v === "object") {
    const o = v as Partial<Cost>;
    return { rows: o.rows ?? 0, requests: o.requests ?? 0, awakeS: o.awakeS ?? 0 };
  }
  return NONE;
}

export const NO_COST = NONE;

/**
 * Rows an upload writes over its life: each picture and pack, the quiz, its
 * meta, fixes, run, guesses and first alarm; deleted again at its end, which
 * writes as many; and the code's claim and the site's booking of it.
 */
export function uploadRows(files: number): number {
  return 2 * (files + 6) + 3;
}
