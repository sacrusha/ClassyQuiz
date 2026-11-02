// Full-screen notices over any page that holds a line to its quiz
// (docs/decisions.md, "Hardening"): asleep after a long while without a
// change, a tap wakes it; and the site's daily allowance spent, said as such
// rather than as a lost connection. Styled inline: they sit over whatever the
// page draws, whichever stylesheet it has.

export type NoticeKind = "sleep" | "quota";

const ids: Record<NoticeKind, string> = { sleep: "cq-sleep", quota: "cq-quota" };

const layer =
  "position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2rem;" +
  "padding:24px;box-sizing:border-box;text-align:center;font:inherit;";

/**
 * Shows a notice. `onWake` (sleep only): called once by the first tap or key,
 * which the page underneath doesn't get, so waking never also presses a
 * button or advances the quiz.
 */
export function showNotice(kind: NoticeKind, text: string, onWake?: () => void): void {
  if (document.getElementById(ids[kind])) {
    if (kind === "quota") document.getElementById(ids[kind])!.querySelector("p")!.textContent = text;
    return;
  }
  const el = document.createElement("div");
  el.id = ids[kind];
  el.setAttribute("role", kind === "quota" ? "alert" : "dialog");
  if (kind === "sleep") {
    el.style.cssText = `${layer}background:rgba(10,12,20,.88);color:#fff;cursor:pointer;`;
    el.innerHTML = `<svg viewBox="0 0 100 100" width="120" height="120" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="6"/><path d="M40 30 L72 50 L40 70 Z" fill="currentColor"/></svg><p style="margin:0;font-size:1.4rem"></p>`;
    el.querySelector("p")!.textContent = text;
    const wake = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.removeEventListener("pointerdown", wake, true);
      window.removeEventListener("keydown", wake, true);
      // The click that follows this pointerdown mustn't reach the page either.
      window.setTimeout(() => window.removeEventListener("click", swallow, true), 400);
      window.addEventListener("click", swallow, true);
      hideNotice("sleep");
      onWake?.();
    };
    window.addEventListener("pointerdown", wake, true);
    window.addEventListener("keydown", wake, true);
  } else {
    el.style.cssText = `${layer}background:rgba(250,248,240,.97);color:#222;`;
    el.innerHTML = `<p style="margin:0;max-width:36rem;font-size:1.25rem;line-height:1.45"></p>`;
    el.querySelector("p")!.textContent = text;
  }
  document.body.appendChild(el);
}

export function hideNotice(kind: NoticeKind): void {
  document.getElementById(ids[kind])?.remove();
}

function swallow(e: Event): void {
  e.preventDefault();
  e.stopImmediatePropagation();
}
