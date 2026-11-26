// Last call's bar. Device clocks aren't synchronised, so a device runs it
// from when the view reached it: `leftMs` is what was left when the server made the view. It
// ends a moment after the server's, never before, and a tap the device still
// showed as open counts.

import type { ClockView } from "../shared/protocol.ts";
import { T } from "./room-text.ts";

/** Per question and length, when Last call ends on this device (performance.now()). */
const ends = new Map<string, number>();

/** When Last call of this question ends here; the first view that showed it sets it. */
export function localEnd(key: string, clock: ClockView): number {
  let end = ends.get(key);
  if (end === undefined || clock.leftMs === 0) {
    end = performance.now() + clock.leftMs;
    // Time's up arrived: it is over here too, whatever was left locally.
    if (clock.leftMs === 0) end = Math.min(end, ends.get(key) ?? end);
    ends.set(key, end);
    if (ends.size > 50) ends.delete(ends.keys().next().value!);
  }
  return end;
}

/**
 * The bar for a Last call of `ms` ending at `end`. One CSS animation with a
 * negative delay: it starts where Last call is, and a redraw picks up
 * where it was, without a timer in the page.
 */
export function clockBar(ms: number, end: number, cls = ""): string {
  const left = Math.max(0, end - performance.now());
  const done = Math.max(0, ms - left);
  return `<div class="clockbar${cls ? ` ${cls}` : ""}${left <= 0 ? " out" : ""}" role="timer" aria-label="${T.countdown}"><span style="animation-duration:${ms}ms;animation-delay:-${Math.round(done)}ms"></span></div>`;
}

/** What the bar along the top edge shows now ("" for none): it is drawn again only when that changes. */
let edgeKey = "";

/**
 * The bar along the top edge, over everything, as on the wall: one per page,
 * whoever draws it. `key` names what it times (with `ms`, so a new clock on
 * the same step starts afresh); null takes it away.
 */
export function edgeBar(key: string, clock: ClockView | null): void {
  let el = document.getElementById("clock");
  const k = clock ? `${key}|${clock.ms}` : "";
  if (k === edgeKey && (!clock || el)) return;
  edgeKey = k;
  if (!clock) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "clock";
    document.body.appendChild(el);
  }
  el.innerHTML = clockBar(clock.ms, localEnd(k, clock), "wall");
}
