// The owner page's arithmetic (docs/design/owner-page.md): what the figures
// at /api/site/use come to against the Free plan, read as docs/design/
// telemetry.md, "Reading it", says. Pure, so it runs under Node.

import type { DayRecord, MonthRecord, Use } from "../server/telemetry.ts";

/** Cloudflare's Free plan, per UTC day (hosting-and-limits.md, Situation): the totals of the whole account, which this page can only partly see. */
export const PLAN = { objectRequests: 100_000, gbSeconds: 13_000 };

/** What a held poll costs the object it keeps awake, per second (measured, scaling-drawer.md, "Duration"). */
export const GB_S_PER_POLL_S = 0.128;

/**
 * Durable Object requests the classes made, about: HTTP requests, sockets
 * opened, and one per twenty messages sent. The sums hold no count of
 * sockets opened, so it is taken as one for each device not on long-poll at
 * its last count plus its reconnects; a poller that once had a socket is
 * left out.
 */
export function objectRequests(u: Use): number {
  return u.http + Math.max(0, u.devices - u.polled) + u.reconnects + Math.ceil(u.sent / 20);
}

/** What the classes' polls cost of the day's duration, about: the lesson only, each poller's seconds up to a held poll short. */
export function pollGbSeconds(u: Use): number {
  return u.awakeS * GB_S_PER_POLL_S;
}

export function turnedAway(r: DayRecord["refused"] | MonthRecord["refused"]): number {
  return r ? r.uploads + r.bytes + r.rows : 0;
}

/** Classes let in less the project's own runs. */
export function realClasses(d: DayRecord): number {
  return d.classes - (d.probes ?? 0);
}

/** A bucket's name from the lower edges: "0–1", "2–4", … "30+". */
export function bucketLabels(edges: number[]): string[] {
  return edges.map((lo, i) => {
    if (i === edges.length - 1) return `${lo}+`;
    const hi = edges[i + 1] - 1;
    return hi === lo ? `${lo}` : `${lo}–${hi}`;
  });
}

/** The days' `use` added together; undefined when none has any. */
export function sumUse(uses: (Use | undefined)[]): Use | undefined {
  let out: Use | undefined;
  for (const u of uses) {
    if (!u) continue;
    if (!out) {
      out = structuredClone(u);
      delete (out as { problems?: unknown }).problems; // the days' problems are not a sum to read
      continue;
    }
    out.classes += u.classes;
    for (const k of ["peers", "remote", "wall"] as const) out.kinds[k] += u.kinds[k];
    for (const k of ["size", "requests", "rows"] as const) u[k].forEach((n, i) => (out![k][i] = (out![k][i] ?? 0) + n));
    for (const k of NUMBERS) out[k] += u[k] ?? 0;
  }
  return out;
}

const NUMBERS = ["withPoller", "final", "players", "late", "questions", "played", "minutes", "devices", "polled", "reconnects", "http", "sent", "pings", "pollS", "awakeS", "slept"] as const satisfies readonly (keyof Use)[];
