// A device's own count of its line to the quiz it is in, since its page
// opened (docs/design/telemetry.md, "What is counted, and by whom"). The
// device sends its current counts, not events, so the newest replaces the
// one before and nothing is counted twice. Numbers and one word from a
// closed list, nothing else: no message, no name, no time.

export const LINE_MODES = ["ws", "poll"] as const;
export type LineMode = (typeof LINE_MODES)[number];

export interface LineCounts {
  /** The line now: WebSocket, or the long-poll fallback. */
  mode: LineMode;
  /** WebSockets that worked (a message came through); reconnects are this minus one. */
  opened: number;
  /** WebSocket attempts that failed; of those, `silent` opened and then carried nothing (a filter that takes the upgrade and drops the frames). */
  failed: number;
  silent: number;
  /** HTTP requests to the quiz: polls and commands. */
  http: number;
  /** WebSocket messages sent (hellos, commands), pings apart. */
  sent: number;
  pings: number;
  /** Seconds on long-poll. */
  pollS: number;
  /** Times the device was told the day's allowance was spent. */
  quota: number;
  /** Times the page went to sleep (SLEEP_AFTER_MS). */
  slept: number;
  /** Script errors on the page, counted only. */
  errors: number;
}

export const LINE_NUMBERS = ["opened", "failed", "silent", "http", "sent", "pings", "pollS", "quota", "slept", "errors"] as const satisfies readonly (keyof LineCounts)[];

/** No device's count goes past this: a broken or hostile page can't swell a day's sums. */
const LINE_MAX = 100_000;

export function emptyLine(): LineCounts {
  return { mode: "ws", opened: 0, failed: 0, silent: 0, http: 0, sent: 0, pings: 0, pollS: 0, quota: 0, slept: 0, errors: 0 };
}

/** What a device sent as its line, as the server keeps it: the word from the list, each number a bounded integer; null when it isn't a line at all. */
export function readLine(v: unknown): LineCounts | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!LINE_MODES.includes(o.mode as LineMode)) return null;
  const line = emptyLine();
  line.mode = o.mode as LineMode;
  for (const k of LINE_NUMBERS) {
    const n = o[k];
    line[k] = typeof n === "number" && Number.isFinite(n) ? Math.min(LINE_MAX, Math.max(0, Math.floor(n))) : 0;
  }
  return line;
}
