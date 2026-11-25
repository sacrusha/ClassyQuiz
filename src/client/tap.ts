// Input on a device several players share (docs/design/class-and-wall.md,
// "Sharing a device"). A browser makes a click only from a lone touch, so
// while the page is split each finger or pen presses for itself: lifted
// soon, over the element it went down on. The click a lift may still bring
// is dropped page-wide, not only on its element: a press that closes a
// place moves the others under the finger, and the click would land on
// whatever is there now. Elsewhere, and from a mouse, the click alone
// presses, as it always did.

/** Whether the page is shared between players now (client/play.ts sets the class). */
const shared = (): boolean => document.body.classList.contains("shared");

/**
 * Held this long, a contact is a hand resting on the glass, not a press
 * (plausible assumption: a child's deliberate press lifts well within it).
 */
const HOLD_MS = 1000;
/** A click this soon after a lift was judged is that lift's own. */
const CLICK_AFTER_MS = 700;

const presses = new WeakMap<Element, () => void>();
/** Contacts down on a pressable element; spent once another contact pressed it. */
const contacts = new Map<number, { el: Element; at: number; spent: boolean }>();
let swallowUntil = -Infinity;

// Page-wide, so a contact that lifts away from its element (a pen the browser
// doesn't capture to it, or a column rebuilt under the finger) is forgotten too.
window.addEventListener(
  "pointerdown",
  (e) => {
    // A pointer down again is a new contact, whatever became of a lift that never came.
    contacts.delete(e.pointerId);
    // A pen's side button or eraser (button 2, 5) clicks nothing; it presses nothing either.
    if (!shared() || e.pointerType === "mouse" || e.button !== 0) return;
    const el = e.composedPath().find((t): t is Element => t instanceof Element && presses.has(t));
    if (el) contacts.set(e.pointerId, { el, at: e.timeStamp, spent: false });
  },
  true,
);

window.addEventListener("pointercancel", (e) => contacts.delete(e.pointerId), true);

window.addEventListener(
  "pointerup",
  (e) => {
    const c = contacts.get(e.pointerId);
    if (!c) return;
    contacts.delete(e.pointerId);
    if (!shared()) return;
    // By the events' own times: a page busy at the lift doesn't make a quick press a rest.
    // Over its element still, as a click would be: not lifted beside it (a touch stays
    // captured by the element it began on), nor under something drawn over it since.
    const press =
      !c.spent && e.timeStamp - c.at < HOLD_MS && c.el.contains(document.elementFromPoint(e.clientX, e.clientY))
        ? presses.get(c.el)
        : undefined;
    // The other contacts on it are the same press: two fingers of one hand, or a palm beside one.
    if (press) for (const o of contacts.values()) if (o.el === c.el) o.spent = true;
    try {
      press?.();
    } finally {
      // Pressed or not, the lift is judged; timed from when any press is done, which the click waits behind.
      swallowUntil = performance.now() + CLICK_AFTER_MS;
    }
  },
  true,
);

window.addEventListener(
  "click",
  (e) => {
    if (performance.now() >= swallowUntil) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  true,
);

// A long press calls up no menu (Chrome on Android, a Windows touchscreen;
// Safari's callout is app.css's) and lifts no picture to drag.
for (const type of ["contextmenu", "dragstart"]) {
  window.addEventListener(type, (e) => shared() && e.preventDefault(), true);
}

export function onTap(el: HTMLElement, press: () => void): void {
  presses.set(el, press);
  el.addEventListener("click", press);
}
