// The root page's part for people (docs/design/root-page.md): code box,
// language, and the two steps: the ways to play as the tabs of the chat that
// shows each one's example, and the box that opens the AI's .zip. The
// guidance for AIs below reads without this script, in English; this script
// puts the part above it in the visitor's language (client/landing-text.ts).

import type { Problem, QuizInfo } from "../shared/protocol.ts";
import { JOIN_CODE, MAX_QUIZ_BYTES, TEACHER_CODE } from "../shared/protocol.ts";
import { uploadFormat, type UploadFormat } from "../shared/upload.ts";
import { $, esc, forgetQuiz, savedQuizzes, store, teacherCode, teacherEntry, type SavedQuiz } from "./dom.ts";
import { api, readApi } from "./net.ts";
import { ZipError, listZip, quizTextFromEntries, type ZipEntry } from "./unzip.ts";
import { LANG_KEY, TEXT, askText, chosenLang, isLang, type Lang, type Text } from "./landing-text.ts";
import { WAY_ZIP, type Way } from "./example-text.ts";
import { codeBox, langSwitch } from "./top.ts";
import { daysFull, uploadDays } from "./history.ts";
import { handOver, sweepStale } from "./handoff.ts";
import { readQuiz } from "./opening.ts";
import { filmLanguage } from "./film-poster.ts";

// The QR code on the projector points here with the code after "#".
const fromHash = location.hash.slice(1).replace(/\D/g, "");
if (JOIN_CODE.test(fromHash) || TEACHER_CODE.test(fromHash)) location.replace(`/play#${fromHash}`);
// The worked example's start as an earlier /example linked it: the example opens on the local check now.
const exampleLang = new URLSearchParams(location.search).get("example");
if (isLang(exampleLang)) location.replace(`/open?example=${exampleLang}`);
// A quiz handed to a check that never opened is still in this browser: it goes now (client/handoff.ts).
void sweepStale();

/** The address the browser opened: an own copy shows its own (the build writes it into the static page for AIs). */
const host = location.host || "classyquiz.pages.dev";
const DEMO = "classyquiz.pages.dev";

let lang: Lang = chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
let t: Text = TEXT[lang];

codeBox();
const codeInput = $("#code") as HTMLInputElement;
const showLang = langSwitch((l) => apply(l));

const runbox = $("#runbox");
const out = $("#out");
const file = $("#file") as HTMLInputElement;
/** A quiz is being read, or an example is on its way to the check: another file waits. */
let reading = false;

// Getting a quiz (docs/design/root-page.md, "Getting a quiz"): the ways to
// play are the tabs of the chat, each showing its example: the ask, and the
// AI's file, which "Play this quiz" opens in the box below. The fourth tab,
// "?", holds the ask that needs no knowing how to ask. Made here: without
// the script, and for an AI's fetcher, the asks stand one under the other.
// Every visit opens on the Quizmaster's (Situation: least surprise).

/** mock: a stand-in until the owner's run (backlog, "The page for people", item 1), marked in the chat's bar. */
const TABS: { tab: string; panel: string; way?: Way; ask: (t: Text) => string; mock?: boolean }[] = [
  { tab: "tab-quizmaster", panel: "ex-quizmaster", way: "quizmaster", ask: (t) => askText(t) },
  { tab: "tab-peers", panel: "ex-peers", way: "peers", ask: (t) => t.askPeers, mock: true },
  { tab: "tab-solo", panel: "ex-solo", way: "solo", ask: (t) => t.askSolo, mock: true },
  { tab: "tab-help", panel: "ex-help", ask: (t) => t.askHelp, mock: true },
];
const tabs = TABS.map((a) => $(`#${a.tab}`) as HTMLButtonElement);
const panels = TABS.map((a) => $(`#${a.panel}`));
/** The AI's question back in the help panel: made here, so a fetcher doesn't read an AI's words as the page's. */
const helpReply = document.createElement("p");
helpReply.className = "said-ai";
{
  const bar = $("#ways");
  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-labelledby", "get-h");
  TABS.forEach((a, i) => {
    tabs[i].setAttribute("role", "tab");
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", a.tab);
    tabs[i].addEventListener("click", () => chooseTab(i));
    const way = a.way;
    const zip = panels[i].querySelector<HTMLElement>(".zip");
    if (way && zip) {
      // The file in the AI's answer opens as a file of one's own does: it goes into the box below. The file
      // itself takes a press too, as a file in a chat does; the button is the one a keyboard reaches.
      const play = document.createElement("button");
      play.type = "button";
      play.className = "play";
      panels[i].querySelector(".foot")!.prepend(play);
      play.addEventListener("click", () => playExample(way, zip));
      zip.classList.add("takes");
      zip.addEventListener("click", () => playExample(way, zip));
    }
  });
  panels[3].querySelector(".bubble")!.after(helpReply);
  bar.addEventListener("keydown", (e) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const i = (tabs.findIndex((b) => b.getAttribute("aria-selected") === "true") + step + tabs.length) % tabs.length;
    chooseTab(i);
    tabs[i].focus();
  });
  chooseTab(0);
}

function chooseTab(i: number): void {
  tabs.forEach((tab, j) => {
    const on = i === j;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    panels[j].hidden = !on;
  });
  $("#mock").hidden = !TABS[i].mock;
}

/** The asks, the files and the full examples' links, in the page's language. */
function renderExamples(): void {
  TABS.forEach((a, i) => {
    const said = panels[i].querySelector<HTMLElement>(".said")!;
    said.textContent = a.ask(t).replaceAll(DEMO, host);
    said.lang = lang;
    if (a.way) {
      panels[i].querySelector(".zipname")!.textContent = WAY_ZIP[a.way][lang];
      panels[i].querySelector(".play")!.textContent = t.playThis;
      const see = panels[i].querySelector<HTMLAnchorElement>(".see");
      if (see) see.href = `/example?lang=${lang}${a.way === "quizmaster" ? "" : `&way=${a.way}`}`;
    }
  });
  helpReply.textContent = t.helpReply;
  helpReply.lang = lang;
}

/** An example played: its file moves into the box, as a file of one's own goes there, and opens on the local check. */
function playExample(way: Way, zip: HTMLElement): void {
  if (reading) return;
  reading = true;
  const go = () => location.assign(`/open?example=${lang}&way=${way}`);
  const button = $("#open");
  out.innerHTML = `<p class="muted">${esc(t.reading)}</p>`;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof zip.animate !== "function") {
    runbox.classList.add("drag");
    window.setTimeout(go, 300);
    return;
  }
  const fly = () => {
    const a = zip.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    const ghost = zip.cloneNode(true) as HTMLElement;
    ghost.classList.add("flying");
    Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px` });
    document.body.append(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    window.setTimeout(() => runbox.classList.add("drag"), 350);
    const done = () => {
      ghost.remove();
      go();
    };
    ghost
      .animate(
        [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px)`, offset: 0.75 }, { transform: `translate(${dx}px, ${dy}px) scale(.6)`, opacity: 0 }],
        { duration: 750, easing: "cubic-bezier(.45, 0, .2, 1)" },
      )
      .finished.then(done, done);
  };
  // The box out of sight (a quiz to come back to above it, a small window): it comes into sight first.
  if (button.getBoundingClientRect().bottom > innerHeight) {
    button.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(fly, 450);
  } else fly();
}

/** The part for people, everything above About, in language `l`. */
function apply(l: Lang): void {
  lang = l;
  t = TEXT[l];
  showLang(l, t.language);
  for (const el of document.querySelectorAll<HTMLElement>("[data-t]")) {
    const v = t[el.dataset.t as keyof Text];
    if (typeof v === "string") el.textContent = v;
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-t-aria]")) {
    const v = t[el.dataset.tAria as keyof Text];
    if (typeof v === "string") el.setAttribute("aria-label", v);
  }
  for (const el of document.querySelectorAll<HTMLImageElement>("img[data-t-alt]")) {
    const v = t[el.dataset.tAlt as keyof Text];
    if (typeof v === "string") el.alt = v;
  }
  for (const id of ["#landing", "header.top .bar"]) $(id).lang = l;
  filmLanguage(l); // after #landing's lang: the film is built in the language around it
  renderExamples();
  renderResume();
  renderOwnCopy();
}


/** Counted by format only; a failure here never touches the upload. */
function countAttempt(format: UploadFormat): void {
  void fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }), keepalive: true }).catch(() => {});
}

const problem = (err: string, more = "") => `<div class="problem"><p class="err">${esc(err)}</p>${more}</div>`;
const zipOnly = () => `<p>${esc(t.zipOnly)}</p>`;

$("#open").addEventListener("click", () => file.click());
file.addEventListener("change", () => {
  const files = [...(file.files ?? [])];
  file.value = "";
  if (files.length) void fromFiles(files);
});
runbox.addEventListener("dragover", (e) => {
  e.preventDefault();
  runbox.classList.add("drag");
});
runbox.addEventListener("dragleave", () => runbox.classList.remove("drag"));
runbox.addEventListener("drop", (e) => {
  e.preventDefault();
  runbox.classList.remove("drag");
  const files = [...(e.dataTransfer?.files ?? [])];
  if (files.length) void fromFiles(files);
  else if ((e.dataTransfer?.getData("text/plain") ?? "").trim()) notText();
});

// Nothing invites pasting. A file pasted from the file manager still opens;
// pasted text is told the site takes a .zip, and counted.
document.addEventListener("paste", (e) => {
  if (e.target === codeInput) return;
  const files = [...(e.clipboardData?.files ?? [])];
  if (files.length) {
    e.preventDefault();
    void fromFiles(files);
  } else if ((e.clipboardData?.getData("text/plain") ?? "").trim()) {
    e.preventDefault();
    notText();
  }
});

function notText(): void {
  countAttempt("paste");
  out.innerHTML = problem(t.notText, zipOnly());
}

async function fromFiles(files: File[]): Promise<void> {
  const format = uploadFormat(files.map((f) => f.name));
  countAttempt(format);
  // The page asks for a .zip and says nothing else; the same archive named .quiz and the quiz's text
  // alone open too (docs/design/root-page.md, "Opening: the .zip and nothing else").
  const text = format === "txt" || format === "md";
  if (format !== "zip" && format !== "quiz" && !text) {
    const what = format === "several files" ? "several" : format === "no extension" || format === "other" ? "this" : format;
    out.innerHTML = problem(t.notFile(what), zipOnly());
    return;
  }
  try {
    if (text) {
      await toCheck(await files[0].text(), []);
      return;
    }
    const entries = listZip(await files[0].arrayBuffer());
    await toCheck(await quizTextFromEntries(entries), entries);
  } catch (e) {
    // The archive's problems in the page's language; anything else (the browser's decompression) as it came.
    out.innerHTML = problem(e instanceof ZipError ? t.zip[e.problem] : e instanceof Error ? e.message : t.unreadable);
  }
}

/**
 * The quiz read and checked here, then handed to the local check (/open),
 * where the person picks how it will be played: nothing goes to the site
 * until a room opens there (docs/design/local-check.md). leaveOut: the
 * person chose to go on without the pictures that can't be read.
 */
async function toCheck(value: string, archive: ZipEntry[], leaveOut = false): Promise<void> {
  if (reading) return;
  if (new Blob([value]).size > MAX_QUIZ_BYTES) {
    out.innerHTML = problem(t.tooLong(Math.round(MAX_QUIZ_BYTES / 1000)));
    return;
  }
  reading = true;
  out.innerHTML = `<p class="muted">${esc(t.reading)}</p>`;
  try {
    const r = await readQuiz(value, archive, leaveOut, (done, of) => {
      out.innerHTML = `<p class="muted">${esc(t.preparing(done, of))}</p>`;
    });
    if (!r.ok) {
      showProblems(r.errors, r.pictures, () => void toCheck(value, archive, true));
      return;
    }
    let key: string;
    try {
      key = await handOver(r.files);
    } catch {
      out.innerHTML = problem(t.noHandoff);
      return;
    }
    location.href = `/open#${key}`;
  } finally {
    reading = false;
  }
}

/** pictures: the problems are pictures that can't go up; the teacher may run the quiz without them. */
function showProblems(errors: Problem[], pictures: boolean, without: () => void): void {
  // For the AI, in English like the problems themselves.
  const ask = pictures
    ? "Please send the quiz again as one .zip file, with these pictures fixed."
    : "Please send the corrected quiz as one .zip file.";
  const forAi = `The quiz site couldn't read the quiz:\n${errors.map((e) => `- ${e.message}`).join("\n")}\n${ask}`;
  out.innerHTML = `<div class="problem">
    <p class="err">${esc(pictures ? t.picturesHead : t.quizHead)}</p>
    <ul lang="en">${errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>
    <p>${esc(t.aiFixes)}</p>
    <p><button class="primary" id="copymsg" type="button">${esc(t.copyForAi)}</button>
    ${pictures ? `<button id="without" type="button">${esc(t.without)}</button>` : ""}</p>
  </div>`;
  $("#copymsg").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(forAi);
      $("#copymsg").textContent = t.copied;
    } catch {
      // No clipboard permission: show it for copying by hand.
      out.insertAdjacentHTML("beforeend", `<pre style="white-space:pre-wrap">${esc(forAi)}</pre>`);
    }
  });
  if (pictures) $("#without").addEventListener("click", without);
}

// Coming back (docs/design/root-page.md, "Coming back: the resume card"): the
// latest quiz this device started, while it hasn't reached its final ranking.

/** Uploads asked about per visit at most, when the newer ones are gone; each is a request against the site's daily allowance. */
const ASK_AT_MOST = 3;

let open: { q: SavedQuiz; info: QuizInfo } | null = null;

async function findOpen(): Promise<void> {
  const saved = savedQuizzes().sort((a, b) => b.at - a.at);
  for (const q of saved.slice(0, ASK_AT_MOST)) {
    try {
      const r = await api<QuizInfo>(`/api/i/${q.id}/info`, { secret: q.secret });
      if (r.status === 404) {
        forgetQuiz(q.id);
        continue;
      }
      // The latest quiz still on the site: until the teacher's Exit deletes
      // it, also at its final ranking, which the teacher may want back to photograph.
      if (r.body.code) open = { q, info: r.body };
    } catch {
      /* offline: show nothing rather than something stale */
    }
    break;
  }
  renderResume();
}

function renderResume(): void {
  const box = $("#resume");
  if (!open) {
    box.innerHTML = "";
    return;
  }
  const { info } = open;
  const s = info.stands;
  const stands = s?.phase === "final" ? t.finalRanking : s && s.n > 0 && s.phase !== "lobby" && s.phase !== "idle" ? t.question(s.n, s.total) : t.notStarted;
  // A Peers room has no teacher devices: this device comes back as its player (docs/design/peers.md).
  const href = info.peers ? `/play#${info.code}` : info.teacher ? teacherEntry(info.code, info.teacher) : `/teacher#${info.code}`;
  box.innerHTML = `<div class="resume">
    <p class="head"><span class="title">${esc(info.title || t.untitled)}</span><span class="stands">${esc(stands)}</span></p>
    <p class="go"><a class="back" href="${esc(href)}">${esc(t.back)}</a><span class="code">${esc(t.joinCode)} <b>${esc(info.code)}</b></span></p>
    ${info.teacher && !info.peers ? `<p class="other">${t.otherDevice(esc(teacherCode(info.code, info.teacher)))}</p>` : ""}
  </div>`;
}

// The own copy (docs/design/root-page.md, "The own copy"). The site's state is
// asked once per visit, and only from a device that has uploaded.

let fullDays = 0;

async function findFull(): Promise<void> {
  if (uploadDays().length === 0) return;
  try {
    const res = await fetch("/api/site", { cache: "no-store" });
    const body = await readApi<{ full?: unknown }>(res);
    fullDays = daysFull(body.full);
  } catch {
    fullDays = 0;
  }
  renderOwnCopy();
}

function renderOwnCopy(): void {
  const line = $("#owncopy");
  line.hidden = fullDays === 0;
  line.innerHTML = fullDays ? `${esc(t.ownCopy(fullDays))} <a href="/own-copy">${esc(t.how)}</a>` : "";
}

apply(lang);
void findOpen();
void findFull();
// Back to this page after a quiz was handed on: the reading line is done with.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  out.innerHTML = "";
  runbox.classList.remove("drag");
  reading = false;
});
