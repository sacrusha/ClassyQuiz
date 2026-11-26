// /example. The static page is English and
// shows the sheets example, for an AI that reads it; this script makes it
// the example ?ex= names, in ?lang= or else the device's language. The idea
// example attached nothing, so it has no first step; the notes and test
// examples attached a two-page PDF and have no overview.

import { $, store } from "./dom.ts";
import { LANG_KEY, TEXT, chosenLang, isLang, type Lang } from "./landing-text.ts";
import { EXAMPLE_TEXT, PDF_TEXT, RUNS, exampleOf, exampleZip, type ExampleText } from "./example-text.ts";
import { codeBox, langSwitch } from "./top.ts";

const params = new URLSearchParams(location.search);
const asked = params.get("lang");
let lang: Lang = isLang(asked) ? asked : chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
const ex = exampleOf(params);
const run = RUNS[ex];
const pdf = ex === "notes" || ex === "test" ? PDF_TEXT[ex] : null;
const LOCALE: Record<Lang, string> = { en: "en-GB", de: "de-CH", fr: "fr-FR", it: "it-IT" };
type Word = Exclude<keyof ExampleText, "langName">;

codeBox();
const showLang = langSwitch((l) => apply(l));

// The conversation in the device's mode: <picture> picks the shown one; the
// link to the whole picture follows the same mode.
const dark = matchMedia("(prefers-color-scheme: dark)");
const tag = ex === "sheets" ? "" : `${ex}-`;
const convo = (l: Lang, mode: "light" | "dark") => `/examples/conversation-${tag}${l}-${mode}.webp`;
const review = (l: Lang) => `/examples/review-${tag}${l}.webp`;
function convoLinks(): void {
  const href = convo(lang, dark.matches ? "dark" : "light");
  for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-convo]")) a.href = href;
}
dark.addEventListener("change", convoLinks);

if (ex === "idea") {
  $("#sheets").remove();
  // Its overview is taller than the sheets example's.
  const img = $("#review img");
  img.setAttribute("width", "1000");
  img.setAttribute("height", "1826");
} else if (pdf) {
  $("#review").remove();
  const sheets = $("#sheets");
  sheets.querySelector(".pics")!.innerHTML = [1, 2].map(() => `<a><img alt="" width="700" height="990"></a>`).join("");
  sheets.querySelector(".files")!.innerHTML = `<li><a download></a></li>`;
}

function apply(l: Lang): void {
  lang = l;
  const t = EXAMPLE_TEXT[l];
  const head = TEXT[l];
  showLang(l, head.language);
  $("#join label").textContent = head.code;
  $("#join button").setAttribute("aria-label", head.join);
  document.title = t.title;
  document.documentElement.lang = l;
  for (const el of document.querySelectorAll<HTMLElement>("[data-t]")) el.textContent = t[el.dataset.t as Word];
  for (const el of document.querySelectorAll<HTMLImageElement>("img[data-t-alt]")) el.alt = t[el.dataset.tAlt as Word];
  const zip = $("#zip") as HTMLAnchorElement;
  zip.href = `/examples/${exampleZip(ex, l)}`;
  zip.textContent = exampleZip(ex, l);
  ($("#start") as HTMLAnchorElement).href = `/open?example=${l}&ex=${ex}`;
  if (pdf) {
    const d = pdf[l];
    $("#sheets h2").textContent = d.h;
    $("#sheets .pics").querySelectorAll("a").forEach((a, i) => {
      a.href = `/examples/${ex}-${l}-${i + 1}.webp`;
      const img = a.querySelector("img")!;
      img.src = a.href;
      img.alt = d.page.replace("{n}", String(i + 1));
    });
    const file = $("#sheets .files a") as HTMLAnchorElement;
    file.href = `/examples/${ex}-${l}.pdf`;
    file.textContent = d.dlPdf;
    const note = $("#att-note");
    note.textContent = d.note ?? "";
    note.hidden = !d.note;
  }
  if (ex === "idea" || ex === "sheets") {
    ($("#review img") as HTMLImageElement).src = review(l);
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-review]")) a.href = review(l);
  }
  const day = new Intl.DateTimeFormat(LOCALE[l], { dateStyle: "long", timeZone: "UTC" }).format(new Date(run.date));
  $("#made").textContent = `${run.ai}, ${day}`;
  const translated = $("#translated");
  translated.textContent = t.translated.replace("{from}", t.langName[run.lang]);
  translated.hidden = l === run.lang;
  ($("#convo-dark") as HTMLSourceElement).srcset = convo(l, "dark");
  ($("#convo-img") as HTMLImageElement).src = convo(l, "light");
  convoLinks();
}

apply(lang);
