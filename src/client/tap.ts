// A press on a device several players share (docs/design/class-and-wall.md,
// "Sharing a device"). A browser makes a click only from a lone touch: a
// neighbour's finger on the glass at the same moment would swallow the press
// or start a pinch. There each finger's own lift inside the element presses
// it. The click a lift may still bring is dropped page-wide, not only on its
// element: a press that closes a place moves the others under the finger,
// and the click would land on whatever is there now. Elsewhere the click
// alone presses, as it always did.

/** Whether the page is shared between players now (client/play.ts sets the class). */
const shared = (): boolean => document.body.classList.contains("shared");

/** A click this soon after a lift that pressed is that lift's own. */
const CLICK_AFTER_MS = 700;
let swallowUntil = -Infinity;
let listening = false;

// Timed by the page's own clock, one for the lift and the click, rather than by each event's timeStamp.
function swallow(e: MouseEvent): void {
  if (performance.now() >= swallowUntil) return;
  e.preventDefault();
  e.stopImmediatePropagation();
}

export function onTap(el: HTMLElement, press: () => void): void {
  if (!listening) {
    listening = true;
    window.addEventListener("click", swallow, true);
  }
  const down = new Set<number>();
  el.addEventListener("pointerdown", (e) => {
    if (shared() && e.pointerType !== "mouse") down.add(e.pointerId);
  });
  el.addEventListener("pointercancel", (e) => down.delete(e.pointerId));
  el.addEventListener("pointerup", (e) => {
    if (!down.delete(e.pointerId) || !shared()) return;
    // A touch is captured by the element it began on: lifted elsewhere, it presses nothing, as a click wouldn't.
    const r = el.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    swallowUntil = performance.now() + CLICK_AFTER_MS;
    press();
  });
  el.addEventListener("click", press);
}
