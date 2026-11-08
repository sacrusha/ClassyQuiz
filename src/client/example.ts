// /example (docs/design/example-page.md): the shared header, and the page in
// the visitor's language. The static HTML is English for AIs; this puts the
// words, the conversation's picture, the .zip and the start link in the page's
// language. The landing's link passes ?lang=; without it, the device's choice.

import { $, store } from "./dom.ts";
import { LANG_KEY, TEXT, chosenLang, isLang, type Lang } from "./landing-text.ts";
import { EXAMPLE_TEXT, EXAMPLE_ZIP, type ExampleText } from "./example-text.ts";
import { codeBox, langSwitch } from "./top.ts";

const asked = new URLSearchParams(location.search).get("lang");
let lang: Lang = isLang(asked) ? asked : chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);

codeBox();
const showLang = langSwitch((l) => apply(l));

// The conversation in the device's mode: <picture> picks the shown one; the
// link to the whole picture follows the same mode.
const dark = matchMedia("(prefers-color-scheme: dark)");
const convo = (l: Lang, mode: "light" | "dark") => `/examples/conversation-${l}-${mode}.webp`;
function convoLinks(): void {
  const href = convo(lang, dark.matches ? "dark" : "light");
  for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-convo]")) a.href = href;
}
dark.addEventListener("change", convoLinks);

function apply(l: Lang): void {
  lang = l;
  const t = EXAMPLE_TEXT[l];
  const head = TEXT[l];
  showLang(l, head.language);
  $("#join label").textContent = head.code;
  $("#join button").setAttribute("aria-label", head.join);
  document.title = t.title;
  document.documentElement.lang = l;
  for (const el of document.querySelectorAll<HTMLElement>("[data-t]")) el.textContent = t[el.dataset.t as keyof ExampleText];
  for (const el of document.querySelectorAll<HTMLImageElement>("img[data-t-alt]")) el.alt = t[el.dataset.tAlt as keyof ExampleText];
  ($("#convo-dark") as HTMLSourceElement).srcset = convo(l, "dark");
  ($("#convo-img") as HTMLImageElement).src = convo(l, "light");
  convoLinks();
  const zip = $("#zip") as HTMLAnchorElement;
  zip.href = `/examples/${EXAMPLE_ZIP[l]}`;
  zip.textContent = EXAMPLE_ZIP[l];
  ($("#start") as HTMLAnchorElement).href = `/open?example=${l}`;
}

apply(lang);
