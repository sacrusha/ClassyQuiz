// The site's share of the free plan (docs/decisions.md, "Hardening"): one
// tiny Durable Object for the whole site that books every upload against two
// caps, uploads a day and bytes stored at once. Storage is the one limit that
// doesn't come back at midnight: filled, every write on the account fails,
// answers in running classes included, until quizzes expire.
//
// Per quiz it holds its id, its size and until when it may live; per day a
// count. Nothing about the quiz or who made it.
//
// It also keeps the days (UTC, as the count) on which it refused an upload,
// for 31 days: the landing's own-copy line says on how many of the last 30
// the site was full (backlog v4 item 4). Only these refusals are known here;
// a day the platform's request allowance ran out is not recorded, since the
// site can't write once it is spent (decisions.md, "The landing page").

import { DurableObject } from "cloudflare:workers";
import { MAX_LIVE_BYTES, MAX_UPLOADS_PER_DAY, type SiteFull } from "../shared/limits.ts";
import type { Env } from "./env.ts";
import { DAY_MS, FULL_KEEP_DAYS, countFull, dayOf } from "./fulldays.ts";

interface Booking {
  bytes: number;
  /** The quiz renews this while it lives; a booking past it is gone, whether or not its release arrived. */
  until: number;
}

export class SiteBudget extends DurableObject<Env> {
  /** Books a new quiz; says which cap is reached when the site is full (today's uploads, or bytes stored). */
  async reserve(instance: string, bytes: number, until: number): Promise<true | SiteFull> {
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
    return true;
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
  async fullDays(): Promise<number> {
    return countFull([...(await this.ctx.storage.list({ prefix: "f:" })).keys()], Date.now());
  }

  /** The quiz lives on: its booking with it. */
  async renew(instance: string, until: number): Promise<void> {
    const key = `i:${instance}`;
    const b = await this.ctx.storage.get<Booking>(key);
    if (b && b.until < until) await this.ctx.storage.put(key, { ...b, until });
  }

  async release(instance: string): Promise<void> {
    await this.ctx.storage.delete(`i:${instance}`);
  }
}
