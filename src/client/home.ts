// The root page's part for people (docs/design/root-page.md): code box,
// language, the ways to play, the two steps (the example ask, and the box
// that opens the AI's .zip), the example asks under "How to ask". The
// guidance for AIs below reads without this script, in English; this script
// puts the part above it in the visitor's language (client/landing-text.ts).

import type { Problem, QuizInfo } from "../shared/protocol.ts";
import { JOIN_CODE, MAX_QUIZ_BYTES, TEACHER_CODE } from "../shared/protocol.ts";
import { uploadFormat, type UploadFormat } from "../shared/upload.ts";
import { $, esc, forgetQuiz, savedQuizzes, store, teacherCode, teacherEntry, type SavedQuiz } from "./dom.ts";
import { api, readApi } from "./net.ts";
import { ZipError, listZip, quizTextFromEntries, type ZipEntry } from "./unzip.ts";
import { LANG_KEY, TEXT, askText, chosenLang, isLang, type Lang, type Text } from "./landing-text.ts";
import { EXAMPLE_ZIP } from "./example-text.ts";
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

// How to ask: copy the address. The button is made here, not in the
// HTML: an AI's fetcher converting the page to text would otherwise read the
// address as "classyquiz.pages.devCopy".

const addr = document.querySelector<HTMLElement>(".addr");
let copy: HTMLButtonElement | null = null;
if (addr) addr.textContent = host;
if (addr && navigator.clipboard?.writeText) {
  copy = document.createElement("button");
  copy.type = "button";
  addr.append(copy);
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(host);
      copy!.textContent = t.copied;
      window.setTimeout(() => (copy!.textContent = t.copy), 2000);
    } catch {
      /* the address is there to read */
    }
  });
}

/**
 * The example asks: the sheets ask plain in the first step and, under "How
 * to ask", again with each labelled part's label under it; the other asks
 * plain; and the tabs' names.
 */
function renderAsk(): void {
  const top = $("#ask-top");
  top.textContent = askText(t).replaceAll(DEMO, host);
  $("#bubble-top").lang = lang;
  const bubble = $("#bubble");
  // Punctuation right after a labelled part is glued to it: a browser may break a line
  // after an inline-block, which would start the next line with "," or ".".
  let html = "";
  let glued = 0;
  t.ask.forEach((p, i) => {
    const s = p.s.replaceAll(DEMO, host).slice(glued);
    glued = 0;
    if (p.l === undefined) {
      html += esc(s);
      return;
    }
    const next = t.ask[i + 1];
    const punct = next && next.l === undefined ? (/^[,.;:?!]+/.exec(next.s)?.[0] ?? "") : "";
    glued = punct.length;
    html += `<span class="glue"><span class="part"><u>${esc(s)}</u><span class="lab">${esc(t.labels[p.l])}</span></span>${esc(punct)}</span>`;
  });
  bubble.innerHTML = html;
  bubble.lang = lang;
  for (const [id, text] of [["#bubble3", t.askChess], ["#bubble-solo", t.askSolo], ["#bubble-friends", t.askFriends], ["#bubble-group", t.askGroup], ["#bubble2", t.ask2]] as const) {
    const el = $(id);
    el.textContent = text.replaceAll(DEMO, host);
    el.lang = lang;
  }
  for (const tab of askTabs) tab.textContent = t[tab.dataset.name as (typeof ASK_TABS)[number]["name"]];
}

// The example asks as tabs, each named in words for what the visitor brings
// or who plays (docs/design/root-page.md, "How to ask"). Made here: without
// the script, and for an AI's fetcher, the asks stand one under the other,
// and the sheets ask stands once, in the first step. Its second showing, with
// the labels, is made here too, as the first tab.

const ASK_TABS = [
  { panel: "ask-sheets", name: "tabSheets" },
  { panel: "ask-chess", name: "tabChess" },
  { panel: "ask-group", name: "tabGroup" },
  { panel: "ask-friends", name: "tabFriends" },
  { panel: "ask-solo", name: "tabSolo" },
  { panel: "ask-open", name: "tabOpen" },
] as const;
const askTabs: HTMLButtonElement[] = [];
{
  const asks = $("#asks");
  const sheets = document.createElement("div");
  sheets.className = "example";
  sheets.id = "ask-sheets";
  sheets.innerHTML = `<blockquote class="bubble inplace" id="bubble"></blockquote>`;
  asks.prepend(sheets);
  const bar = document.createElement("div");
  bar.className = "ask-tabs";
  bar.setAttribute("role", "tablist");
  for (const a of ASK_TABS) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `${a.panel}-tab`;
    tab.dataset.name = a.name;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", a.panel);
    const panel = $(`#${a.panel}`);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", () => chooseAsk(askTabs.indexOf(tab)));
    askTabs.push(tab);
    bar.append(tab);
  }
  // Arrow keys move between the tabs, as in any tab list.
  bar.addEventListener("keydown", (e) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const i = (askTabs.findIndex((b) => b.getAttribute("aria-selected") === "true") + step + askTabs.length) % askTabs.length;
    chooseAsk(i);
    askTabs[i].focus();
  });
  asks.before(bar);
  asks.classList.add("tabbed");
  chooseAsk(0);
}

function chooseAsk(i: number): void {
  askTabs.forEach((tab, j) => {
    const on = i === j;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    $(`#${ASK_TABS[j].panel}`).hidden = !on;
  });
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
  ($("#example-link") as HTMLAnchorElement).href = `/example?lang=${l}`;
  // The example's file and its start, in the page's language (docs/design/example-page.md).
  $("#zipname").textContent = EXAMPLE_ZIP[l];
  ($("#zip") as HTMLAnchorElement).href = `/examples/${EXAMPLE_ZIP[l]}`;
  ($("#try") as HTMLAnchorElement).href = `/open?example=${l}`;
  for (const id of ["#landing", "header.top .bar"]) $(id).lang = l;
  filmLanguage(l); // after #landing's lang: the film is built in the language around it
  if (copy) copy.textContent = t.copy;
  renderAsk();
  renderResume();
  renderOwnCopy();
}

const runbox = $("#runbox");
const out = $("#out");
const file = $("#file") as HTMLInputElement;
/** A quiz is being read: another file waits. */
let reading = false;

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
  if (format !== "zip") {
    const what = format === "several files" ? "several" : format === "no extension" || format === "other" ? "this" : format;
    out.innerHTML = problem(t.notFile(what), zipOnly());
    return;
  }
  try {
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
  if (e.persisted) out.innerHTML = "";
});
