// /example (docs/design/example-page.md): the shared header, and the page in
// the visitor's language. The static HTML is English for AIs, the worked
// example's (the sheets); this puts the words, the conversation's picture, the
// .zip and the start link in the page's language. The root page's link passes
// ?lang=; without it, the device's choice. ?ex= names the root page's example
// it came from: the idea's (the space run) has no attachment and shows the
// AI's overview of its questions; an example whose run is a mock (MOCK_TEXT)
// shows its attachment and a made-up conversation instead of the worked
// example's.

import { $, esc, store } from "./dom.ts";
import { LANG_KEY, TEXT, chosenLang, isLang, type Lang } from "./landing-text.ts";
import { EXAMPLE_TEXT, IDEA_TEXT, MOCK_TEXT, exampleOf, exampleZip, isMock, type ExampleText } from "./example-text.ts";
import { codeBox, langSwitch } from "./top.ts";

const params = new URLSearchParams(location.search);
const asked = params.get("lang");
let lang: Lang = isLang(asked) ? asked : chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
const ex = exampleOf(params);
const mock = isMock(ex) ? ex : null;
const host = location.host || "classyquiz.pages.dev";

codeBox();
const showLang = langSwitch((l) => apply(l));

// The conversation in the device's mode: <picture> picks the shown one; the
// link to the whole picture follows the same mode. The idea's conversation and
// overview are their own pictures (docs/example/README.md).
const dark = matchMedia("(prefers-color-scheme: dark)");
const convo = (l: Lang, mode: "light" | "dark") => `/examples/conversation-${ex === "idea" ? "idea-" : ""}${l}-${mode}.webp`;
const review = (l: Lang) => `/examples/review-idea-${l}.webp`;
function convoLinks(): void {
  const href = convo(lang, dark.matches ? "dark" : "light");
  for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-convo]")) a.href = href;
}
dark.addEventListener("change", convoLinks);

// A mock's attachment and conversation, made here, so a fetcher doesn't read a chat as the page's words.
const MOCK_PIC = { notes: "/landing/mock-notes.svg", test: "/landing/mock-test.svg" } as const;
let mockChat: HTMLElement | null = null;
if (mock) {
  const sheets = $("#sheets");
  sheets.querySelector(".pics")!.innerHTML = `<a href="${MOCK_PIC[mock]}"><img src="${MOCK_PIC[mock]}" alt="" width="233" height="300"></a>`;
  sheets.querySelector(".files")!.remove();
  for (const el of document.querySelectorAll("[data-convo]")) el.remove();
  mockChat = document.createElement("div");
  mockChat.className = "mockchat";
  $("#convo-p").after(mockChat);
  $(".translated").remove();
} else if (ex === "idea") {
  // Nothing was attached; the AI's overview of the questions stands after the conversation.
  $("#sheets").remove();
  const li = document.createElement("li");
  li.id = "review";
  li.innerHTML = `<h2></h2><p></p><a class="convo" data-review><img alt="" width="1000" height="1826"></a><p><a data-review data-read></a></p>`;
  $("#convo").after(li);
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
  if (mock && mockChat) {
    const m = MOCK_TEXT[l];
    $(".lede").textContent = m.lede[mock];
    $("#sheets h2").textContent = m.attachedH;
    $("#sheets p").textContent = m.attached[mock];
    $("#convo-p").textContent = m.mockNote;
    $("#quiz p").textContent = m.quizP;
    const ask = (mock === "notes" ? head.askNotes : head.askTest).replaceAll("classyquiz.pages.dev", host);
    mockChat.innerHTML = `<p class="me">${esc(ask)}</p><p class="ai">${esc(m.reply[mock])}<span class="file">${esc(exampleZip(ex, l))}</span></p>`;
    return;
  }
  if (ex === "idea") {
    const d = IDEA_TEXT[l];
    $(".lede").textContent = d.lede;
    $("#convo-p").textContent = d.convoP;
    $("#quiz p").textContent = d.quizP;
    $(".translated").textContent = d.translated;
    const li = $("#review");
    li.querySelector("h2")!.textContent = d.reviewH;
    li.querySelector("p")!.textContent = d.reviewP;
    li.querySelector("img")!.src = review(l);
    li.querySelector("img")!.alt = d.reviewAlt;
    li.querySelector("[data-read]")!.textContent = d.readReview;
    for (const a of li.querySelectorAll<HTMLAnchorElement>("a[data-review]")) a.href = review(l);
  }
  ($("#convo-dark") as HTMLSourceElement).srcset = convo(l, "dark");
  ($("#convo-img") as HTMLImageElement).src = convo(l, "light");
  convoLinks();
}

apply(lang);
