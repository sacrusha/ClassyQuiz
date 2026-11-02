// Short codes that lead somewhere. Each code is its own tiny Durable Object
// (named by the code), so claiming one is atomic without a central registry.

import { DurableObject } from "cloudflare:workers";
import type { Grant } from "../shared/protocol.ts";
import type { Env } from "./env.ts";

/** A class's join code → the quiz instance running it. */
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

/** How long a device shows its pairing code before it has to ask for a new one. */
export const PAIR_TTL_MS = 10 * 60_000;
const WAIT_HOLD_MS = 25_000;

interface PairState {
  role: "screen" | "teacher";
  nonce: string;
  expires: number;
  grant: Grant | null;
}

/**
 * A device waiting to be given a role (docs/decisions.md, "Pairing"). The
 * waiting device shows the code; a device that already holds the quiz types
 * it in. Seeing the code grants nothing, so it may stand on the projector.
 */
export class Pairing extends DurableObject<Env> {
  private waiters = new Set<(g: Grant | null) => void>();

  private async state(): Promise<PairState | null> {
    const s = await this.ctx.storage.get<PairState>("v");
    return s && s.expires > Date.now() ? s : null;
  }

  async open(role: "screen" | "teacher", nonce: string): Promise<boolean> {
    if (await this.state()) return false;
    const expires = Date.now() + PAIR_TTL_MS;
    await this.ctx.storage.put("v", { role, nonce, expires, grant: null } satisfies PairState);
    await this.ctx.storage.setAlarm(expires);
    return true;
  }

  /** The role the waiting device asked for, while nobody has answered it. */
  async wanted(): Promise<"screen" | "teacher" | null> {
    const s = await this.state();
    return s && !s.grant ? s.role : null;
  }

  async deliver(grant: Grant): Promise<boolean> {
    const s = await this.state();
    if (!s || s.grant || s.role !== grant.role) return false;
    s.grant = grant;
    await this.ctx.storage.put("v", s);
    for (const w of this.waiters) w(grant);
    this.waiters.clear();
    return true;
  }

  /** Long-poll by the waiting device: its grant, "waiting", or "expired". */
  async wait(nonce: string): Promise<{ grant: Grant } | { waiting: true } | { expired: true }> {
    const s = await this.state();
    if (!s || s.nonce !== nonce) return { expired: true };
    const take = async (g: Grant) => {
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
      return { grant: g };
    };
    if (s.grant) return take(s.grant);
    const g = await new Promise<Grant | null>((resolve) => {
      this.waiters.add(resolve);
      setTimeout(() => {
        if (this.waiters.delete(resolve)) resolve(null);
      }, WAIT_HOLD_MS);
    });
    return g ? take(g) : { waiting: true };
  }

  async alarm(): Promise<void> {
    for (const w of this.waiters) w(null);
    this.waiters.clear();
    await this.ctx.storage.deleteAll();
  }
}
