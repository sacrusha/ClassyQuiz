// The site's four languages, and this device's among them: the one the root
// page speaks on it (its switch, kept as LANG_KEY, else the browser's first
// of the four, else English: chosenLang). The pages after the root page and
// /example speak it; they have no switch of their own. Apart from the words,
// so that every page can load it.

export type Lang = "de" | "en" | "fr" | "it";
export const LANGS: { id: Lang; name: string }[] = [
  { id: "de", name: "Deutsch" },
  { id: "en", name: "English" },
  { id: "fr", name: "Français" },
  { id: "it", name: "Italiano" },
];

export const LANG_KEY = "cq.lang";

export function isLang(x: unknown): x is Lang {
  return x === "de" || x === "en" || x === "fr" || x === "it";
}

/** A choice made on this device, else the browser's first language among the four, else English. */
export function chosenLang(saved: unknown, browser: readonly string[]): Lang {
  if (isLang(saved)) return saved;
  for (const l of browser) {
    const two = (l ?? "").slice(0, 2).toLowerCase();
    if (isLang(two)) return two;
  }
  return "en";
}

/** Outside a browser (the tests) English, whatever the machine's own language. */
export function deviceLang(): Lang {
  if (typeof document === "undefined") return "en";
  let saved: unknown = null;
  try {
    saved = JSON.parse(localStorage.getItem(LANG_KEY) ?? "null");
  } catch {
    /* no storage: the browser's language decides */
  }
  return chosenLang(saved, navigator.languages ?? [navigator.language]);
}

/** A static page's English words, in [data-t] elements, put in this device's language. */
export function speak(words: Record<string, unknown>): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-t]")) {
    const w = words[el.dataset.t!];
    if (typeof w === "string") el.textContent = w;
  }
}
