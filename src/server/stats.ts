// Upload attempts by format: one tiny Durable Object for
// the whole site, holding per format a count and the first and last day it
// was seen. No content, no identity, no time of day.

import { DurableObject } from "cloudflare:workers";
import type { UploadFormat } from "../shared/upload.ts";
import type { Env } from "./env.ts";

interface Tally {
  count: number;
  first: string;
  last: string;
}

export class UploadStats extends DurableObject<Env> {
  async count(format: UploadFormat): Promise<void> {
    const key = `f:${format}`;
    const day = new Date().toISOString().slice(0, 10);
    const t = await this.ctx.storage.get<Tally>(key);
    await this.ctx.storage.put(key, t ? { ...t, count: t.count + 1, last: day } : { count: 1, first: day, last: day });
  }

  async read(): Promise<Record<string, Tally>> {
    const rows = await this.ctx.storage.list<Tally>({ prefix: "f:" });
    return Object.fromEntries([...rows].map(([k, t]) => [k.slice(2), t]));
  }
}
