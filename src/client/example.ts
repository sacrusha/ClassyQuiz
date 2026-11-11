// /example (docs/design/example-page.md): the shared header, and the page in
// the visitor's language. The static HTML is English for AIs; this puts the
// words, the conversation's picture, the .zip and the start link in the page's
// language. The root page's link passes ?lang=; without it, the device's choice.
// ?way= names the root page's example it came from; a way whose run is a mock
// (MOCK_TEXT) shows its attachment and a made-up conversation instead of the
// worked example's.

import { $, esc, store } from "./dom.ts";
import { LANG_KEY, TEXT, chosenLang, isLang, type Lang } from "./landing-text.ts";
import { EXAMPLE_TEXT, MOCK_TEXT, WAY_ZIP, isWay, type ExampleText } from "./example-text.ts";
import { codeBox, langSwitch } from "./top.ts";

const params = new URLSearchParams(location.search);
const asked = params.get("lang");
let lang: Lang = isLang(asked) ? asked : chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
const askedWay = params.get("way");
const way = isWay(askedWay) ? askedWay : "quizmaster";
const mock = way === "peers" || way === "solo" ? way : null;
const host = location.host || "classyquiz.pages.dev";

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

// A mock way's attachment and conversation, made here, so a fetcher doesn't read a chat as the page's words.
const MOCK_PIC = { peers: "/landing/mock-notes.svg", solo: "/landing/mock-test.svg" } as const;
let mockChat: HTMLElement | null = null;
if (mock) {
  const sheets = document.querySelector("#sheets")!;
  sheets.querySelector(".pics")!.innerHTML = `<a href="${MOCK_PIC[mock]}"><img src="${MOCK_PIC[mock]}" alt="" width="233" height="300"></a>`;
  sheets.querySelector(".files")!.remove();
  for (const el of document.querySelectorAll("[data-convo]")) el.remove();
  mockChat = document.createElement("div");
  mockChat.className = "mockchat";
  $("#convo-p").after(mockChat);
  $(".translated").remove();
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
  zip.href = `/examples/${WAY_ZIP[way][l]}`;
  zip.textContent = WAY_ZIP[way][l];
  ($("#start") as HTMLAnchorElement).href = `/open?example=${l}&way=${way}`;
  if (mock && mockChat) {
    const m = MOCK_TEXT[l];
    $(".lede").textContent = m.lede[mock];
    $("#sheets h2").textContent = m.attachedH;
    $("#sheets p").textContent = m.attached[mock];
    $("#convo-p").textContent = m.mockNote;
    const ask = (mock === "peers" ? head.askPeers : head.askSolo).replaceAll("classyquiz.pages.dev", host);
    mockChat.innerHTML = `<p class="me">${esc(ask)}</p><p class="ai">${esc(m.reply[mock])}<span class="file">${esc(WAY_ZIP[way][l])}</span></p>`;
    return;
  }
  ($("#convo-dark") as HTMLSourceElement).srcset = convo(l, "dark");
  ($("#convo-img") as HTMLImageElement).src = convo(l, "light");
  convoLinks();
}

apply(lang);
