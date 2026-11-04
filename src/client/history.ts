// This device's history with the site, for the own-copy line
// (docs/design/root-page.md, "The own copy"): the days it uploaded a quiz, kept on the device
// and never sent. Dates only: no titles, no codes. cq.quizzes can't serve,
// it keeps 20 entries and forgets finished quizzes.

import { store } from "./dom.ts";

const KEY = "cq.days";
/** Days kept: enough for "on how many days lately", little enough to say nothing else. */
const KEEP = 60;

function today(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function uploadDays(): string[] {
  const v = store.get<unknown>(KEY);
  return Array.isArray(v) ? v.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
}

export function recordUploadDay(now = new Date()): void {
  const d = today(now);
  const days = uploadDays().filter((x) => x !== d);
  store.set(KEY, [d, ...days].slice(0, KEEP));
}

/** The site's answer, read defensively: a whole number of days, 0 to 30. */
export function daysFull(v: unknown): number {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? Math.min(v, 30) : 0;
}
