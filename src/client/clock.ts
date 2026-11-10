// Last call's bar. It drains smoothly with no digits, along an edge, so it
// reads from the back row and takes no room from the question, its picture
// or the tiles.
//
// Device clocks aren't synchronised, so a device runs it from when the view
// reached it: `leftMs` is what was left when the server made the view. It
// ends a moment after the server's, never before, and a tap the device still
// showed as open counts (docs/design/question-flow.md, "When a tap counts").

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
 * where it was, without a timer in the page. The last fifth turns warm.
 */
export function clockBar(ms: number, end: number, cls = ""): string {
  const left = Math.max(0, end - performance.now());
  const done = Math.max(0, ms - left);
  return `<div class="clockbar${cls ? ` ${cls}` : ""}${left <= 0 ? " out" : ""}" role="timer" aria-label="${T.countdown}"><span style="animation-duration:${ms}ms;animation-delay:-${Math.round(done)}ms"></span></div>`;
}
