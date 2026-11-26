// Upload attempts by format, site-wide: per format a count and the first and
// last day it was seen. No content, no identity, no time of day.

import { DurableObject } from "cloudflare:workers";
import { DAY_ATTEMPTS_PER_FORMAT } from "../shared/limits.ts";
import type { UploadFormat } from "../shared/upload.ts";
import type { Env } from "./env.ts";

interface Tally {
  count: number;
  first: string;
  last: string;
  /** How many of them on the day `last`; absent on a tally from before the day's count had a most. */
  onLast?: number;
  /** Days on which the count reached DAY_ATTEMPTS_PER_FORMAT, where it stops: `count` lacks whatever came after. */
  capped?: number;
}

export class UploadStats extends DurableObject<Env> {
  async count(format: UploadFormat): Promise<void> {
    const key = `f:${format}`;
    const day = new Date().toISOString().slice(0, 10);
    const t = await this.ctx.storage.get<Tally>(key);
    const onLast = t?.last === day ? (t.onLast ?? 0) : 0;
    if (onLast >= DAY_ATTEMPTS_PER_FORMAT) return;
    const capped = (t?.capped ?? 0) + (onLast + 1 === DAY_ATTEMPTS_PER_FORMAT ? 1 : 0);
    await this.ctx.storage.put(key, { count: (t?.count ?? 0) + 1, first: t?.first ?? day, last: day, onLast: onLast + 1, ...(capped ? { capped } : {}) } satisfies Tally);
  }

  async read(): Promise<Record<string, Tally>> {
    const rows = await this.ctx.storage.list<Tally>({ prefix: "f:" });
    return Object.fromEntries([...rows].map(([k, t]) => [k.slice(2), t]));
  }
}
