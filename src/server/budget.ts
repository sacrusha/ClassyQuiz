// The site's share of the free plan (docs/design/hosting-and-limits.md, "Protecting the day's allowance"): one
// tiny Durable Object for the whole site that books every upload against two
// caps, the uploads' rows a day and bytes stored at once. Storage is the one limit that
// doesn't come back at midnight: filled, every write on the account fails,
// answers in running classes included, until quizzes expire.
//
// Holds nothing about a quiz or who made it: an id, a size and an expiry per
// quiz, a count per day.
//
// The day's ledger (docs/design/hosting-and-limits.md, "Running classes
// finish"): rows, requests and awake seconds (server/rows.ts). A quiz books
// its class when the class is let in, moves the booking as the class shows
// what it needs, and settles it at the final ranking with what it spent and
// what devices left on will. The ledger holds what is booked or spent today,
// so a class under way never meets a spent allowance its booking didn't
// leave room for, as far as the estimates hold.
//
// Telemetry (docs/design/telemetry.md): the day's record also takes each
// class's summary at its settle, the day's uploads and the most classes
// booked at once, all on writes made anyway. A day leaving the 31 days is
// folded into its month's record, kept MONTHS_KEPT months.
//
// It also keeps the days (UTC, as the count) on which it refused an upload,
// for 31 days: the landing's own-copy line says on how many of the last 30
// the site was full. Only these refusals are known here;
// a day the platform's request allowance ran out is not recorded, since the
// site can't write once it is spent (docs/design/hosting-and-limits.md, "When the allowance runs out anyway").

import { DurableObject } from "cloudflare:workers";
import { DAY_FOR_CLASSES, DAY_FOR_JOINS, DAY_ROWS_FOR_UPLOADS, MAX_LIVE_BYTES, NEARLY_FULL, type Cost, type SiteFull } from "../shared/limits.ts";
import { asCost, fullness, moved, within } from "./rows.ts";
import type { Env } from "./env.ts";
import { DAY_MS, FULL_KEEP_DAYS, countFull, dayOf } from "./fulldays.ts";
import { EDGES, MONTHS_KEPT, addClass, foldDay, monthOf, type ClassUse, type DayRecord, type DayUse, type MonthRecord, type OwnerView, type Refused } from "./telemetry.ts";

/** One day's classes, for the owner (GET /api/site/use): kept FULL_KEEP_DAYS days, then folded into its month. */
export interface RowsDay {
  day: string;
  /** Classes let in; `probes` of them uploaded by a simulator or a probe. */
  classes: number;
  probes?: number;
  /** Rows written by the classes that reached their final ranking or ended. */
  written: number;
  /** The most rows the ledger held at once. */
  peak: number;
  /** The most the ledger held at once in its fullest allowance, as a share of DAY_FOR_CLASSES: how close the day came. */
  peakShare?: number;
  /** The most classes booked at once: let in and not yet settled. */
  atOnce?: number;
  /** Classes turned away, as counted in this object's memory: a lower bound. */
  refused?: Refused;
  /** The classes that settled, summed (docs/design/telemetry.md); the probes' apart. */
  use?: DayUse;
  probeUse?: DayUse;
}

interface Booking {
  bytes: number;
  /** The quiz renews this while it lives; a booking past it is gone, whether or not its release arrived. */
  until: number;
  /** What is booked against `day`'s ledger, from letting the class in until it settles; a number is rows, from before requests and duration were booked. */
  rows?: Cost | number;
  day?: string;
}

export class SiteBudget extends DurableObject<Env> {
  /**
   * Classes turned away today, not yet in the day's record: a refusal writes
   * nothing of its own (a script's uploads, refused, would otherwise spend
   * rows), so the count rides on the day's next write of its record, and is
   * lost with this object's memory before that.
   */
  private refused: ({ day: string } & Refused) | null = null;

  /**
   * Books a new quiz: its rows against the uploads' rows today, its bytes
   * against those stored at once; says which cap is reached when the site
   * is full (today's uploads, or bytes stored). `d:` counts the day's
   * uploads, for the telemetry.
   */
  async reserve(instance: string, bytes: number, until: number, rows = 0): Promise<{ day: Cost } | SiteFull> {
    const now = Date.now();
    const day = `d:${dayOf(now)}`;
    const rowsKey = `u:${dayOf(now)}`;
    await this.rollUp(now);
    const today = (await this.ctx.storage.get<number>(day)) ?? 0;
    const written = await this.ctx.storage.list<number>({ prefix: "u:" });
    const rowsToday = written.get(rowsKey) ?? 0;
    const old = [...written.keys()].filter((k) => k !== rowsKey);
    if (old.length > 0) await this.ctx.storage.delete(old.slice(0, 128));
    if (rowsToday + rows > DAY_ROWS_FOR_UPLOADS) return await this.full(now, "uploads", "uploads");
    const bookings = await this.ctx.storage.list<Booking>({ prefix: "i:" });
    const stale: string[] = [];
    let live = 0;
    for (const [k, b] of bookings) {
      if (b.until > now) live += b.bytes;
      else stale.push(k);
    }
    if (stale.length > 0) await this.ctx.storage.delete(stale.slice(0, 128));
    if (live + bytes > MAX_LIVE_BYTES) return await this.full(now, "bytes", "bytes");
    await this.ctx.storage.put({ [day]: today + 1, [rowsKey]: rowsToday + rows, [`i:${instance}`]: { bytes, until } satisfies Booking });
    // The day's ledger, so the check can say when the site is nearly full.
    return { day: await this.ledgerToday() };
  }

  /**
   * Books `cost` for the quiz's class against today's ledger: letting a class
   * in, or its first student after its booking lapsed (`reach` "join", which
   * may reach further: DAY_FOR_JOINS). A booking already there moves to
   * `cost`. "rows": the classes booked today leave no room; today counts as
   * a full day.
   */
  async bookRows(instance: string, booking: Cost | number, until: number, probe = false, reach: "letIn" | "join" = "letIn"): Promise<{ day: Cost } | "rows"> {
    // A number: an instance still on the code from before requests and duration were booked (a deploy reaches a running object late).
    const cost = asCost(booking);
    const now = Date.now();
    const key = `i:${instance}`;
    const b = (await this.ctx.storage.get<Booking>(key)) ?? { bytes: 0, until };
    const day = dayOf(now);
    await this.rollUp(now);
    const ledger = await this.ctx.storage.list<Cost | number>({ prefix: "r:" });
    const booked = asCost(ledger.get(`r:${day}`));
    const stale = [...ledger.keys()].filter((k) => k !== `r:${day}`);
    if (stale.length > 0) await this.ctx.storage.delete(stale.slice(0, 128));
    // A booking of today's moves; one from an earlier day leaves today's ledger alone, as moveRows does.
    const again = b.rows !== undefined && b.day === day;
    const after = moved(booked, again ? asCost(b.rows) : asCost(0), cost);
    if (!within(after, reach === "join" ? DAY_FOR_JOINS : DAY_FOR_CLASSES)) {
      await this.full(now, "uploads", "rows");
      return "rows";
    }
    const h = (await this.ctx.storage.get<RowsDay>(`h:${day}`)) ?? { day, classes: 0, written: 0, peak: 0 };
    const counted = b.rows !== undefined;
    // This class and the others let in and not yet settled.
    const bookings = await this.ctx.storage.list<Booking>({ prefix: "i:" });
    const atOnce = 1 + [...bookings].filter(([k, o]) => k !== key && o.rows !== undefined && o.until > now).length;
    const record: RowsDay = this.withRefused({
      ...h,
      ...(counted ? {} : { classes: h.classes + 1, ...(probe ? { probes: (h.probes ?? 0) + 1 } : {}) }),
      ...peaks(h, after),
      atOnce: Math.max(h.atOnce ?? 0, atOnce),
    });
    await this.ctx.storage.put({ [`r:${day}`]: after, [key]: { ...b, rows: cost, day } satisfies Booking, [`h:${day}`]: record });
    return { day: after };
  }

  /**
   * Days older than FULL_KEEP_DAYS leave: each is folded into its month's
   * record and deleted in the same write (no await between the put and the
   * deletes, so they are stored together or not at all). Months older than
   * MONTHS_KEPT go too. Writes nothing on most calls.
   */
  private async rollUp(now: number): Promise<void> {
    const storage = this.ctx.storage;
    const [records, uploads, months] = await Promise.all([
      storage.list<RowsDay>({ prefix: "h:" }),
      storage.list<number>({ prefix: "d:" }),
      storage.list<MonthRecord>({ prefix: "m:" }),
    ]);
    const keepFrom = dayOf(now - FULL_KEEP_DAYS * DAY_MS);
    const monthFrom = `m:${monthOf(now, MONTHS_KEPT)}`;
    const dayKeys = [...records.keys(), ...uploads.keys()];
    const old = new Set(dayKeys.map((k) => k.slice(2)).filter((d) => d < keepFrom));
    const gone = dayKeys.filter((k) => old.has(k.slice(2)));
    gone.push(...[...months.keys()].filter((k) => k < monthFrom));
    if (gone.length === 0) return;
    const put: Record<string, MonthRecord> = {};
    for (const day of [...old].sort()) {
      const mk = `m:${day.slice(0, 7)}`;
      if (mk < monthFrom) continue;
      // The whole record, so whatever foldDay keeps by the month (probes, refusals) reaches it.
      const record: DayRecord = { ...(records.get(`h:${day}`) ?? { day, classes: 0, written: 0, peak: 0 }), uploads: uploads.get(`d:${day}`) ?? 0 };
      put[mk] = foldDay(put[mk] ?? months.get(mk), record);
    }
    const writes: Promise<unknown>[] = [];
    if (Object.keys(put).length > 0) writes.push(storage.put(put));
    for (let i = 0; i < gone.length; i += 128) writes.push(storage.delete(gone.slice(i, i + 128)));
    await Promise.all(writes);
  }

  /** GET /api/site, for the landing: on how many of the last 30 days the site was full. */
  async site(): Promise<{ full: number }> {
    return { full: await this.fullDays() };
  }

  /** GET /api/site/use, for the owner: the days' and the months' records, newest first, with what is booked or spent now. */
  async owner(): Promise<OwnerView> {
    const [records, uploads, months] = await Promise.all([
      this.ctx.storage.list<RowsDay>({ prefix: "h:" }),
      this.ctx.storage.list<number>({ prefix: "d:" }),
      this.ctx.storage.list<MonthRecord>({ prefix: "m:" }),
    ]);
    const days = [...new Set([...records.keys(), ...uploads.keys()].map((k) => k.slice(2)))].sort().reverse();
    return {
      ledger: { now: await this.ledgerToday(), of: DAY_FOR_CLASSES },
      edges: EDGES,
      days: days.map((day) => ({ uploads: uploads.get(`d:${day}`) ?? 0, ...(records.get(`h:${day}`) ?? { day, classes: 0, written: 0, peak: 0 }) })),
      months: [...months.values()].reverse(),
    };
  }

  /**
   * Moves a booking to `cost`, never refused: the class is under way, or the
   * booking shrinks (the start, a lobby nobody joined). settle: the class is
   * done (the final ranking, the end); `cost` is what it spent and what its
   * devices left on will, which the ledger keeps. A booking from an earlier
   * day leaves today's ledger alone. use: the class's summary, added into
   * its day's record with the settle.
   */
  async moveRows(instance: string, booking: Cost | number, settle = false, use?: ClassUse): Promise<void> {
    const cost = asCost(booking);
    const key = `i:${instance}`;
    const b = await this.ctx.storage.get<Booking>(key);
    if (!b || b.rows === undefined) return;
    const now = Date.now();
    const entries: Record<string, unknown> = {};
    let h: RowsDay | null = null;
    if (b.day === dayOf(now)) {
      const lk = `r:${b.day}`;
      const after = moved(asCost(await this.ctx.storage.get<Cost | number>(lk)), asCost(b.rows), cost);
      entries[lk] = after;
      const was = (await this.ctx.storage.get<RowsDay>(`h:${b.day}`)) ?? { day: b.day, classes: 0, written: 0, peak: 0 };
      const p = peaks(was, after);
      // The record is written only when a peak moved or the class settles: a shrink leaves it as it was.
      if (settle || p.peak !== was.peak || p.peakShare !== was.peakShare) h = { ...was, ...p };
    }
    const { rows: _r, day: _d, ...rest } = b;
    entries[key] = settle ? rest : { ...b, rows: cost };
    if (settle && b.day) {
      h ??= (await this.ctx.storage.get<RowsDay>(`h:${b.day}`)) ?? { day: b.day, classes: 0, written: 0, peak: 0 };
      const summary = use ? (use.probe ? { probeUse: addClass(h.probeUse, use) } : { use: addClass(h.use, use) }) : {};
      h = { ...h, written: h.written + cost.rows, ...summary };
    }
    if (h) entries[`h:${h.day}`] = this.withRefused(h);
    await this.ctx.storage.put(entries);
  }

  /** What the classes booked or spent today, of DAY_FOR_CLASSES. */
  async ledgerToday(): Promise<Cost> {
    return asCost(await this.ctx.storage.get<Cost | number>(`r:${dayOf(Date.now())}`));
  }

  /** A day's record with the refusals counted since its last write, when they are that day's. */
  private withRefused(h: RowsDay): RowsDay {
    const r = this.refused;
    if (!r || r.day !== h.day) return h;
    this.refused = null;
    const was = h.refused ?? { uploads: 0, bytes: 0, rows: 0 };
    return { ...h, refused: { uploads: was.uploads + r.uploads, bytes: was.bytes + r.bytes, rows: was.rows + r.rows } };
  }

  /**
   * An upload or a class refused: today is a full day, and the refusal is
   * counted (`refused`). Written once a day; older full days than
   * FULL_KEEP_DAYS go. Gives back the cap, for reserve.
   */
  private async full(now: number, cap: SiteFull, by: keyof Refused): Promise<SiteFull> {
    const day = dayOf(now);
    if (this.refused?.day !== day) this.refused = { day, uploads: 0, bytes: 0, rows: 0 };
    this.refused[by]++;
    const days = [...(await this.ctx.storage.list({ prefix: "f:" })).keys()];
    const key = `f:${dayOf(now)}`;
    const old = days.filter((k) => k < `f:${dayOf(now - FULL_KEEP_DAYS * DAY_MS)}`);
    if (old.length > 0) await this.ctx.storage.delete(old.slice(0, 128));
    if (!days.includes(key)) await this.ctx.storage.put(key, 1);
    return cap;
  }

  /** Full days, and days whose bookings came near the limit, of the last 30. */
  async fullDays(): Promise<number> {
    const full = [...(await this.ctx.storage.list({ prefix: "f:" })).keys()];
    const near = [...(await this.ctx.storage.list<RowsDay>({ prefix: "h:" })).values()]
      .filter((h) => (h.peakShare ?? h.peak / DAY_FOR_CLASSES.rows) >= NEARLY_FULL)
      .map((h) => `f:${h.day}`);
    return countFull([...new Set([...full, ...near])], Date.now());
  }

  /** Moves a booking's end later when the quiz's end moves (a booking never shrinks). */
  async renew(instance: string, until: number): Promise<void> {
    const key = `i:${instance}`;
    const b = await this.ctx.storage.get<Booking>(key);
    if (b && b.until < until) await this.ctx.storage.put(key, { ...b, until });
  }

  /** The quiz ended: its bytes come back, and its booking settles with what it spent (and its summary) if it hadn't. */
  async release(instance: string, spent?: Cost | number, use?: ClassUse): Promise<void> {
    if (spent !== undefined) await this.moveRows(instance, spent, true, use);
    await this.ctx.storage.delete(`i:${instance}`);
  }
}

/** The day's peaks with the ledger at `after`. */
function peaks(h: RowsDay, after: Cost): Pick<RowsDay, "peak" | "peakShare"> {
  return { peak: Math.max(h.peak, after.rows), peakShare: Math.max(h.peakShare ?? 0, fullness(after, DAY_FOR_CLASSES)) };
}
