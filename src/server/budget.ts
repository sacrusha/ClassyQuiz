// The site's share of the free plan (docs/design/hosting-and-limits.md, "Protecting the day's allowance"): one
// tiny Durable Object for the whole site that books every upload against two
// caps, uploads a day and bytes stored at once. Storage is the one limit that
// doesn't come back at midnight: filled, every write on the account fails,
// answers in running classes included, until quizzes expire.
//
// Holds nothing about a quiz or who made it: an id, a size and an expiry per
// quiz, a count per day.
//
// The day's rows (docs/design/hosting-and-limits.md, "Running classes
// finish"): a quiz books the most rows its class can write when the class is
// let in, shrinks the booking at the start, and settles it at the final
// ranking with what it wrote. The day's ledger holds what is booked or spent
// today, so a class under way never meets a spent allowance its booking
// didn't leave room for.
//
// It also keeps the days (UTC, as the count) on which it refused an upload,
// for 31 days: the landing's own-copy line says on how many of the last 30
// the site was full. Only these refusals are known here;
// a day the platform's request allowance ran out is not recorded, since the
// site can't write once it is spent (docs/design/hosting-and-limits.md, "When the allowance runs out anyway").

import { DurableObject } from "cloudflare:workers";
import { DAY_ROWS_FOR_CLASSES, MAX_LIVE_BYTES, MAX_UPLOADS_PER_DAY, NEARLY_FULL, type SiteFull } from "../shared/limits.ts";
import type { Env } from "./env.ts";
import { DAY_MS, FULL_KEEP_DAYS, countFull, dayOf } from "./fulldays.ts";

/** One day's classes, for the owner (GET /api/site): kept FULL_KEEP_DAYS days. */
export interface RowsDay {
  day: string;
  /** Classes let in. */
  classes: number;
  /** Rows written by the classes that reached their final ranking or ended. */
  written: number;
  /** The most the ledger held at once: how close the day came to DAY_ROWS_FOR_CLASSES. */
  peak: number;
}

interface Booking {
  bytes: number;
  /** The quiz renews this while it lives; a booking past it is gone, whether or not its release arrived. */
  until: number;
  /** Rows booked against `day`'s ledger, from letting the class in until it settles. */
  rows?: number;
  day?: string;
}

export class SiteBudget extends DurableObject<Env> {
  /** Books a new quiz; says which cap is reached when the site is full (today's uploads, or bytes stored). */
  async reserve(instance: string, bytes: number, until: number): Promise<{ rows: number } | SiteFull> {
    const now = Date.now();
    const day = `d:${dayOf(now)}`;
    const days = await this.ctx.storage.list<number>({ prefix: "d:" });
    const today = days.get(day) ?? 0;
    const stale = [...days.keys()].filter((k) => k !== day);
    if (today >= MAX_UPLOADS_PER_DAY) return await this.full(now, "uploads");
    const bookings = await this.ctx.storage.list<Booking>({ prefix: "i:" });
    let live = 0;
    for (const [k, b] of bookings) {
      if (b.until > now) live += b.bytes;
      else stale.push(k);
    }
    if (stale.length > 0) await this.ctx.storage.delete(stale.slice(0, 128));
    if (live + bytes > MAX_LIVE_BYTES) return await this.full(now, "bytes");
    await this.ctx.storage.put({ [day]: today + 1, [`i:${instance}`]: { bytes, until } satisfies Booking });
    // The day's rows booked, so the check can say when the site is nearly full.
    return { rows: await this.rowsToday() };
  }

  /**
   * Letting a class in: books `rows` against today's ledger. "rows": the
   * classes booked today leave no room; today counts as a full day. A quiz
   * that booked already is not booked again.
   */
  async bookRows(instance: string, rows: number, until: number): Promise<{ rows: number } | "rows"> {
    const now = Date.now();
    const key = `i:${instance}`;
    const b = (await this.ctx.storage.get<Booking>(key)) ?? { bytes: 0, until };
    if (b.rows !== undefined) return { rows: await this.rowsToday() };
    const day = dayOf(now);
    const ledger = await this.ctx.storage.list<number>({ prefix: "r:" });
    const booked = ledger.get(`r:${day}`) ?? 0;
    const stale = [...ledger.keys()].filter((k) => k !== `r:${day}`);
    if (stale.length > 0) await this.ctx.storage.delete(stale.slice(0, 128));
    if (booked + rows > DAY_ROWS_FOR_CLASSES) {
      await this.full(now, "uploads");
      return "rows";
    }
    const h = await this.history(day);
    const record: RowsDay = { ...h, classes: h.classes + 1, peak: Math.max(h.peak, booked + rows) };
    await this.ctx.storage.put({ [`r:${day}`]: booked + rows, [key]: { ...b, rows, day } satisfies Booking, [`h:${day}`]: record });
    return { rows: booked + rows };
  }

  /** A day's record, old ones pruned on the way. */
  private async history(day: string): Promise<RowsDay> {
    const all = await this.ctx.storage.list<RowsDay>({ prefix: "h:" });
    const old = [...all.keys()].filter((k) => k < `h:${dayOf(Date.now() - FULL_KEEP_DAYS * DAY_MS)}`);
    if (old.length > 0) await this.ctx.storage.delete(old.slice(0, 128));
    return all.get(`h:${day}`) ?? { day, classes: 0, written: 0, peak: 0 };
  }

  /** GET /api/site in one request: the full days, and the days' records, newest first, with what is booked or spent now. */
  async site(): Promise<{ full: number; rows: { now: number; of: number; days: RowsDay[] } }> {
    const all = await this.ctx.storage.list<RowsDay>({ prefix: "h:" });
    return { full: await this.fullDays(), rows: { now: await this.rowsToday(), of: DAY_ROWS_FOR_CLASSES, days: [...all.values()].reverse() } };
  }

  /**
   * Moves a booking to `rows` (the start: shrinks to the class that came), or
   * settles it with `rows` written (the final ranking, the end): the ledger
   * keeps what was written and gets the rest back. A booking from an earlier
   * day leaves today's ledger alone.
   */
  async moveRows(instance: string, rows: number, settle = false): Promise<void> {
    const key = `i:${instance}`;
    const b = await this.ctx.storage.get<Booking>(key);
    if (!b || b.rows === undefined) return;
    const now = Date.now();
    const entries: Record<string, unknown> = {};
    if (b.day === dayOf(now)) {
      const lk = `r:${b.day}`;
      const booked = (await this.ctx.storage.get<number>(lk)) ?? 0;
      entries[lk] = Math.max(0, booked + rows - b.rows);
    }
    const { rows: _r, day: _d, ...rest } = b;
    entries[key] = settle ? rest : { ...b, rows };
    if (settle && b.day) {
      const h = (await this.ctx.storage.get<RowsDay>(`h:${b.day}`)) ?? { day: b.day, classes: 0, written: 0, peak: 0 };
      entries[`h:${b.day}`] = { ...h, written: h.written + rows };
    }
    await this.ctx.storage.put(entries);
  }

  /** Rows booked or spent today by the classes, of DAY_ROWS_FOR_CLASSES. */
  async rowsToday(): Promise<number> {
    return (await this.ctx.storage.get<number>(`r:${dayOf(Date.now())}`)) ?? 0;
  }

  /** An upload refused: today is a full day. Written once a day; older full days than FULL_KEEP_DAYS go. Gives back the cap, for reserve. */
  private async full(now: number, cap: SiteFull): Promise<SiteFull> {
    const days = [...(await this.ctx.storage.list({ prefix: "f:" })).keys()];
    const key = `f:${dayOf(now)}`;
    const old = days.filter((k) => k < `f:${dayOf(now - FULL_KEEP_DAYS * DAY_MS)}`);
    if (old.length > 0) await this.ctx.storage.delete(old.slice(0, 128));
    if (!days.includes(key)) await this.ctx.storage.put(key, 1);
    return cap;
  }

  /** On how many of the last 30 days (today included) an upload was refused. */
  /** Full days, and days whose bookings came near the limit, of the last 30. */
  async fullDays(): Promise<number> {
    const full = [...(await this.ctx.storage.list({ prefix: "f:" })).keys()];
    const near = [...(await this.ctx.storage.list<RowsDay>({ prefix: "h:" })).values()]
      .filter((h) => h.peak >= NEARLY_FULL * DAY_ROWS_FOR_CLASSES)
      .map((h) => `f:${h.day}`);
    return countFull([...new Set([...full, ...near])], Date.now());
  }

  /** Moves a booking's end later when the quiz's end moves (a booking never shrinks). */
  async renew(instance: string, until: number): Promise<void> {
    const key = `i:${instance}`;
    const b = await this.ctx.storage.get<Booking>(key);
    if (b && b.until < until) await this.ctx.storage.put(key, { ...b, until });
  }

  /** The quiz ended: its bytes come back, and its rows settle with `written` if they hadn't. */
  async release(instance: string, written?: number): Promise<void> {
    if (written !== undefined) await this.moveRows(instance, written, true);
    await this.ctx.storage.delete(`i:${instance}`);
  }
}
