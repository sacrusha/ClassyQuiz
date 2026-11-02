// The site's share of the free plan (docs/decisions.md, "Hardening"): one
// tiny Durable Object for the whole site that books every upload against two
// caps, uploads a day and bytes stored at once. Storage is the one limit that
// doesn't come back at midnight: filled, every write on the account fails,
// answers in running classes included, until quizzes expire.
//
// Per quiz it holds its id, its size and until when it may live; per day a
// count. Nothing about the quiz or who made it.

import { DurableObject } from "cloudflare:workers";
import { MAX_LIVE_BYTES, MAX_UPLOADS_PER_DAY } from "../shared/limits.ts";
import type { Env } from "./env.ts";

interface Booking {
  bytes: number;
  /** The quiz renews this while it lives; a booking past it is gone, whether or not its release arrived. */
  until: number;
}

export class SiteBudget extends DurableObject<Env> {
  /** Books a new quiz; false when the site is full (today's uploads, or bytes stored). */
  async reserve(instance: string, bytes: number, until: number): Promise<boolean> {
    const now = Date.now();
    const day = `d:${new Date(now).toISOString().slice(0, 10)}`;
    const days = await this.ctx.storage.list<number>({ prefix: "d:" });
    const today = days.get(day) ?? 0;
    const stale = [...days.keys()].filter((k) => k !== day);
    if (today >= MAX_UPLOADS_PER_DAY) return false;
    const bookings = await this.ctx.storage.list<Booking>({ prefix: "i:" });
    let live = 0;
    for (const [k, b] of bookings) {
      if (b.until > now) live += b.bytes;
      else stale.push(k);
    }
    if (stale.length > 0) await this.ctx.storage.delete(stale.slice(0, 128));
    if (live + bytes > MAX_LIVE_BYTES) return false;
    await this.ctx.storage.put({ [day]: today + 1, [`i:${instance}`]: { bytes, until } satisfies Booking });
    return true;
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
