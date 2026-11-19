// /example (docs/design/example-page.md): the shared header, and the page in
// the visitor's language. The static HTML is English for AIs, the worked
// example's (the sheets); this puts the words, the conversation's picture, the
// .zip and the start link in the page's language. The root page's link passes
// ?lang=; without it, the device's choice. ?ex= names the root page's example
// it came from: the idea's (the space run) has no attachment, and shows its
// own overview where the sheets' run shows its; the notes' (the notes run)
// and the test example (the test run) show the two pages of their attached
// PDF in place of the photographs, and have no overview.

import { $, store } from "./dom.ts";
import { LANG_KEY, TEXT, chosenLang, isLang, type Lang } from "./landing-text.ts";
import { EXAMPLE_TEXT, IDEA_TEXT, NOTES_TEXT, TEST_TEXT, exampleOf, exampleZip, type ExampleText } from "./example-text.ts";
import { codeBox, langSwitch } from "./top.ts";

const params = new URLSearchParams(location.search);
const asked = params.get("lang");
let lang: Lang = isLang(asked) ? asked : chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
const ex = exampleOf(params);
/** The words of this page if its example attached a two-page PDF (notes, test); otherwise null. */
const PDF_TEXT = ex === "notes" ? NOTES_TEXT : ex === "test" ? TEST_TEXT : null;

codeBox();
const showLang = langSwitch((l) => apply(l));

// The conversation in the device's mode: <picture> picks the shown one; the
// link to the whole picture follows the same mode. Each example's
// conversation is its own picture (docs/example/README.md).
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
  // Nothing was attached; its overview is taller than the sheets run's.
  $("#sheets").remove();
  const img = $("#review img");
  img.setAttribute("width", "1000");
  img.setAttribute("height", "1826");
} else if (PDF_TEXT) {
  // The PDF's two pages in place of the sheets' photographs, and the PDF in place of the sheets' files; the run
  // handed over no overview.
  $("#review").remove();
  const sheets = $("#sheets");
  sheets.querySelector(".pics")!.innerHTML = [1, 2].map(() => `<a><img alt="" width="700" height="989"></a>`).join("");
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
  for (const el of document.querySelectorAll<HTMLElement>("[data-t]")) el.textContent = t[el.dataset.t as keyof ExampleText];
  for (const el of document.querySelectorAll<HTMLImageElement>("img[data-t-alt]")) el.alt = t[el.dataset.tAlt as keyof ExampleText];
  const zip = $("#zip") as HTMLAnchorElement;
  zip.href = `/examples/${exampleZip(ex, l)}`;
  zip.textContent = exampleZip(ex, l);
  ($("#start") as HTMLAnchorElement).href = `/open?example=${l}&ex=${ex}`;
  if (PDF_TEXT) {
    const d = PDF_TEXT[l];
    $(".lede").textContent = d.lede;
    $("#sheets h2").textContent = d.notesH;
    $("#sheets p").textContent = d.notesP;
    $("#sheets .pics").querySelectorAll("a").forEach((a, i) => {
      a.href = `/examples/${ex}-${l}-${i + 1}.webp`;
      const img = a.querySelector("img")!;
      img.src = a.href;
      img.alt = d.page.replace("{n}", String(i + 1));
    });
    const pdf = $("#sheets .files a") as HTMLAnchorElement;
    pdf.href = `/examples/${ex}-${l}.pdf`;
    pdf.textContent = d.dlPdf;
    $("#convo-p").textContent = d.convoP;
    $("#quiz p").textContent = d.quizP;
    $(".translated").textContent = d.translated;
  }
  if (ex === "idea") {
    const d = IDEA_TEXT[l];
    $(".lede").textContent = d.lede;
    $("#convo-p").textContent = d.convoP;
    $("#quiz p").textContent = d.quizP;
  }
  if (ex === "idea" || ex === "sheets") {
    ($("#review img") as HTMLImageElement).src = review(l);
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-review]")) a.href = review(l);
  }
  ($("#convo-dark") as HTMLSourceElement).srcset = convo(l, "dark");
  ($("#convo-img") as HTMLImageElement).src = convo(l, "light");
  convoLinks();
}

apply(lang);
