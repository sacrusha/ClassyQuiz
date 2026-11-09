// Telemetry's arithmetic (docs/design/telemetry.md): a class reduced to one
// summary of numbers at its settle, the summaries added into the day's
// record, and a day folded into its month once it leaves the 31 days. Pure,
// so it is tested under Node and carried unchanged by a converted server.
// Nothing here holds an id, a token, a name or a time finer than the day.

import type { LineCounts } from "../shared/line.ts";

/** Peers; steered with a Remote taken; steered from the wall alone. */
export type RoomKind = "peers" | "remote" | "wall";

/** What only the instance knows of its class. */
export interface ClassFacts {
  kind: RoomKind;
  /** Players at the start (or in the lobby, for a class that never started). */
  players: number;
  late: number;
  questions: number;
  /** Questions that came up. */
  played: number;
  /** The final ranking was reached. */
  final: boolean;
  /** From Start to the final ranking, or to the quiz's end before it. */
  minutes: number;
  /** Rows the class wrote (Meta.rows.written). */
  rows: number;
}

/** A class, as it reaches SiteBudget: the instance's facts and its devices' lines summed. */
export interface ClassUse extends ClassFacts {
  devices: number;
  /** Devices on long-poll at their last count. */
  polled: number;
  opened: number;
  reconnects: number;
  failed: number;
  http: number;
  sent: number;
  pings: number;
  pollS: number;
  quota: number;
  slept: number;
  errors: number;
}

export function summarize(facts: ClassFacts, lines: LineCounts[]): ClassUse {
  const u: ClassUse = { ...facts, devices: lines.length, polled: 0, opened: 0, reconnects: 0, failed: 0, http: 0, sent: 0, pings: 0, pollS: 0, quota: 0, slept: 0, errors: 0 };
  for (const l of lines) {
    if (l.mode === "poll") u.polled++;
    u.opened += l.opened;
    u.reconnects += Math.max(0, l.opened - 1);
    u.failed += l.failed;
    u.http += l.http;
    u.sent += l.sent;
    u.pings += l.pings;
    u.pollS += l.pollS;
    u.quota += l.quota;
    u.slept += l.slept;
    u.errors += l.errors;
  }
  return u;
}

/**
 * The class's Durable Object requests, as the plan counts them: each HTTP
 * request and each WebSocket upgrade one, incoming WebSocket messages twenty
 * to one (Cloudflare's Durable Objects pricing). Pings are answered by the
 * runtime without an invocation (item 1's probe), so they don't count.
 */
export function objectRequests(u: ClassUse): number {
  return u.http + u.opened + Math.ceil(u.sent / 20);
}

/** Lower edges of the buckets (the first is 0); from the estimates in scaling-drawer.md. */
export const SIZE_EDGES = [0, 2, 5, 15, 30];
export const REQUEST_EDGES = [0, 250, 1000, 3000];
export const ROW_EDGES = [0, 150, 500, 1500];

function bucket(edges: number[], n: number): number {
  let i = 0;
  while (i + 1 < edges.length && n >= edges[i + 1]) i++;
  return i;
}

/** Use and cost: kept by the day, then by the month. */
export interface Use {
  classes: number;
  kinds: Record<RoomKind, number>;
  /** Classes per bucket of SIZE_EDGES, REQUEST_EDGES, ROW_EDGES. */
  size: number[];
  requests: number[];
  rows: number[];
  /** Classes with at least one device on long-poll. */
  withPoller: number;
  final: number;
  players: number;
  late: number;
  played: number;
  minutes: number;
  devices: number;
  polled: number;
  reconnects: number;
  http: number;
  sent: number;
  pings: number;
  pollS: number;
  slept: number;
}

/** Problems: kept by the day only (docs/design/telemetry.md, "How long, by kind"). */
export interface Problems {
  failed: number;
  quota: number;
  errors: number;
}

export interface DayUse extends Use {
  problems: Problems;
}

function emptyUse(): Use {
  return {
    classes: 0,
    kinds: { peers: 0, remote: 0, wall: 0 },
    size: SIZE_EDGES.map(() => 0),
    requests: REQUEST_EDGES.map(() => 0),
    rows: ROW_EDGES.map(() => 0),
    withPoller: 0,
    final: 0,
    players: 0,
    late: 0,
    played: 0,
    minutes: 0,
    devices: 0,
    polled: 0,
    reconnects: 0,
    http: 0,
    sent: 0,
    pings: 0,
    pollS: 0,
    slept: 0,
  };
}

const SUMMED = ["players", "late", "played", "minutes", "devices", "polled", "reconnects", "http", "sent", "pings", "pollS", "slept"] as const satisfies readonly (keyof Use & keyof ClassUse)[];

/** The day's use with one more class added. */
export function addClass(day: DayUse | undefined, u: ClassUse): DayUse {
  const d: DayUse = day ? structuredClone(day) : { ...emptyUse(), problems: { failed: 0, quota: 0, errors: 0 } };
  d.classes++;
  d.kinds[u.kind]++;
  d.size[bucket(SIZE_EDGES, u.players)]++;
  d.requests[bucket(REQUEST_EDGES, objectRequests(u))]++;
  d.rows[bucket(ROW_EDGES, u.rows)]++;
  if (u.polled > 0) d.withPoller++;
  if (u.final) d.final++;
  for (const k of SUMMED) d[k] += u[k];
  d.problems.failed += u.failed;
  d.problems.quota += u.quota;
  d.problems.errors += u.errors;
  return d;
}

/** A day as SiteBudget keeps it (RowsDay in server/budget.ts), with its uploads. */
export interface DayRecord {
  day: string;
  uploads: number;
  classes: number;
  written: number;
  peak: number;
  atOnce?: number;
  use?: DayUse;
}

export interface MonthRecord {
  /** "2026-11". */
  month: string;
  /** Days folded in. */
  days: number;
  uploads: number;
  /** Classes let in, and the most in one day. */
  classes: number;
  busiest: number;
  written: number;
  /** The most the ledger held at once, and the most classes booked at once, on any day. */
  peak: number;
  atOnce: number;
  use: Use;
}

/** A day leaving the 31 days, folded into its month: sums added, the most kept; its problems stay behind. */
export function foldDay(month: MonthRecord | undefined, day: DayRecord): MonthRecord {
  const m: MonthRecord = month ? structuredClone(month) : { month: day.day.slice(0, 7), days: 0, uploads: 0, classes: 0, busiest: 0, written: 0, peak: 0, atOnce: 0, use: emptyUse() };
  m.days++;
  m.uploads += day.uploads;
  m.classes += day.classes;
  m.busiest = Math.max(m.busiest, day.classes);
  m.written += day.written;
  m.peak = Math.max(m.peak, day.peak);
  m.atOnce = Math.max(m.atOnce, day.atOnce ?? 0);
  const u = day.use;
  if (u) {
    m.use.classes += u.classes;
    for (const k of ["peers", "remote", "wall"] as const) m.use.kinds[k] += u.kinds[k];
    for (const k of ["size", "requests", "rows"] as const) u[k].forEach((n, i) => (m.use[k][i] = (m.use[k][i] ?? 0) + n));
    m.use.withPoller += u.withPoller;
    m.use.final += u.final;
    for (const k of SUMMED) m.use[k] += u[k];
  }
  return m;
}

/** Month records are kept this many months back from the current one: two school years side by side. */
export const MONTHS_KEPT = 24;

/** "2026-11" for a UTC time, `back` months earlier. */
export function monthOf(t: number, back = 0): string {
  const d = new Date(t);
  const m = d.getUTCFullYear() * 12 + d.getUTCMonth() - back;
  return `${Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, "0")}`;
}
