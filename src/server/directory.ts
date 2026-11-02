// Short codes that lead somewhere. Each code is its own tiny Durable Object
// (named by the code), so claiming one is atomic without a central registry.

import { DurableObject } from "cloudflare:workers";
import type { Env } from "./env.ts";

/** A quiz's code → the quiz instance. Claimed at upload, renewed while the quiz lives, released when it ends. */
export class JoinCode extends DurableObject<Env> {
  async claim(instance: string, expires: number): Promise<boolean> {
    const cur = await this.ctx.storage.get<{ instance: string; expires: number }>("v");
    if (cur && cur.expires > Date.now() && cur.instance !== instance) return false;
    await this.ctx.storage.put("v", { instance, expires });
    await this.ctx.storage.setAlarm(expires);
    return true;
  }

  async resolve(): Promise<string | null> {
    const cur = await this.ctx.storage.get<{ instance: string; expires: number }>("v");
    return cur && cur.expires > Date.now() ? cur.instance : null;
  }

  async release(instance: string): Promise<void> {
    const cur = await this.ctx.storage.get<{ instance: string; expires: number }>("v");
    if (cur && cur.instance === instance) {
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
    }
  }

  async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }
}
