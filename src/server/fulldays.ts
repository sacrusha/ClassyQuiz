// The site's full days (server/budget.ts): kept per UTC day, counted over the last 30.

export const DAY_MS = 86_400_000;
/** Full days are kept this long: one more than the line looks back. */
export const FULL_KEEP_DAYS = 31;

/** "2026-11-03", the UTC day, as the day's upload count is kept. */
export function dayOf(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** Of the stored full days ("f:2026-11-03"), those within the last 30 days, today included. */
export function countFull(keys: string[], now: number): number {
  const from = `f:${dayOf(now - 29 * DAY_MS)}`;
  const to = `f:${dayOf(now)}`;
  return keys.filter((k) => k >= from && k <= to).length;
}
