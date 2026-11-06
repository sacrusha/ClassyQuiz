// The root page's top (docs/design/root-page.md): code box, language, example
// ask, Run a quiz. The guidance for AIs below reads without this script, in
// English; this script puts the block above it in the visitor's language
// (client/landing-text.ts).

import type { Problem, QuizInfo } from "../shared/protocol.ts";
import { JOIN_CODE, MAX_QUIZ_BYTES, TEACHER_CODE } from "../shared/protocol.ts";
import { quotaResetAt } from "../shared/limits.ts";
import { uploadFormat, type UploadFormat } from "../shared/upload.ts";
import { $, esc, forgetQuiz, saveQuiz, savedQuizzes, store, tabLobby, tabRole, teacherCode, teacherEntry, type SavedQuiz } from "./dom.ts";
import { prepareImages, uploadQuiz } from "./images.ts";
import { api, readApi } from "./net.ts";
import { listZip, quizTextFromEntries, type ZipEntry } from "./unzip.ts";
import { LANG_KEY, LANGS, TEXT, chosenLang, type Lang, type Text } from "./landing-text.ts";
import { daysFull, recordUploadDay, uploadDays } from "./history.ts";
import { filmLanguage } from "./film-poster.ts";

// The QR code on the projector points here with the code after "#".
const fromHash = location.hash.slice(1).replace(/\D/g, "");
if (JOIN_CODE.test(fromHash) || TEACHER_CODE.test(fromHash)) location.replace(`/play#${fromHash}`);

/** The address the browser opened: an own copy shows its own (the build writes it into the static page for AIs). */
const host = location.host || "classyquiz.pages.dev";
const DEMO = "classyquiz.pages.dev";

let lang: Lang = chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
let t: Text = TEXT[lang];

// The code box: the students' class code, and the teacher code, the
// class code and two digits (docs/design/teacher-devices.md, "One entry: the teacher code"). It routes by length
// and never submits by itself, so typing seven isn't cut off at five.

const join = $("#join") as HTMLFormElement;
const codeInput = $("#code") as HTMLInputElement;
join.addEventListener("submit", (e) => {
  e.preventDefault();
  const code = codeInput.value.replace(/\D/g, "");
  if (JOIN_CODE.test(code) || TEACHER_CODE.test(code)) location.href = `/play#${code}`;
  else {
    codeInput.focus();
    codeInput.select();
  }
});
codeInput.addEventListener("input", () => {
  const code = codeInput.value.replace(/\D/g, "");
  if (code !== codeInput.value) codeInput.value = code;
});

// The language switch, top right (docs/design/root-page.md, "Languages"): "EN ▾" over a
// native select, which lists the four by their own names. Made here, not in
// the HTML, so an AI's fetcher doesn't read four language names.

const switchBox = document.createElement("label");
switchBox.className = "lang";
const switchShown = document.createElement("span");
const select = document.createElement("select");
select.innerHTML = LANGS.map((l) => `<option value="${l.id}" lang="${l.id}">${esc(l.name)}</option>`).join("");
switchBox.append(switchShown, select);
$("header.top .bar").append(switchBox);
select.addEventListener("change", () => {
  const next = LANGS.find((l) => l.id === select.value)?.id;
  if (!next) return;
  store.set(LANG_KEY, next);
  apply(next);
});

// Build a quiz: copy the address. The button is made here, not in the
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

/** The example asks: the sheets ask with each labelled part's label under it, the chess and open asks plain, and the tabs' names. */
function renderAsk(): void {
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
  bubble.classList.add("inplace");
  bubble.lang = lang;
  $("#labels").innerHTML = t.labels.map((l) => `<span class="nb">${esc(l)}</span>`).join(" · ");
  for (const [id, text] of [["#bubble3", t.askChess], ["#bubble2", t.ask2]] as const) {
    const el = $(id);
    el.textContent = text.replaceAll(DEMO, host);
    el.lang = lang;
  }
  for (const tab of askTabs) {
    const name = t[tab.dataset.name as "tabSheets" | "tabChess" | "tabOpen"];
    tab.setAttribute("aria-label", name);
    tab.title = name;
  }
}

// The example asks as tabs, one picture each for what the teacher brings
// (docs/design/root-page.md, "Build: two steps"). Made here: without the
// script, and for an AI's fetcher, the three asks stand one under the other.

const ASK_TABS = [
  { panel: "ask-sheets", name: "tabSheets", icon: `<span class="sheets"><img src="/landing/sheet-2.webp" alt=""><img src="/landing/sheet-1.webp" alt=""></span>` },
  {
    panel: "ask-chess",
    name: "tabChess",
    icon: `<svg viewBox="0 0 8 8" aria-hidden="true"><rect width="8" height="8" fill="#b58863"/><path d="M0 0h2v2H0zM4 0h2v2H4zM2 2h2v2H2zM6 2h2v2H6zM0 4h2v2H0zM4 4h2v2H4zM2 6h2v2H2zM6 6h2v2H6z" fill="#f0d9b5"/><text x="4" y="6.6" text-anchor="middle" font-size="7" fill="#111">&#9822;</text></svg>`,
  },
  { panel: "ask-open", name: "tabOpen", icon: `<span class="q" aria-hidden="true">?</span>` },
];
const askTabs: HTMLButtonElement[] = [];
{
  const asks = $("#asks");
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
    tab.innerHTML = a.icon;
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

/** Everything above About in language `l`. */
function apply(l: Lang): void {
  lang = l;
  t = TEXT[l];
  select.value = l;
  switchShown.textContent = `${l.toUpperCase()} ▾`;
  switchBox.title = t.language;
  select.setAttribute("aria-label", t.language);
  for (const el of document.querySelectorAll<HTMLElement>("[data-t]")) {
    const v = t[el.dataset.t as keyof Text];
    if (typeof v === "string") el.textContent = v;
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-t-aria]")) {
    const v = t[el.dataset.tAria as keyof Text];
    if (typeof v === "string") el.setAttribute("aria-label", v);
  }
  ($("#example-link") as HTMLAnchorElement).href = `/example?lang=${l}`;
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
let sending = false;

/** Counted by format only; a failure here never touches the upload. */
function countAttempt(format: UploadFormat): void {
  void fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }), keepalive: true }).catch(() => {});
}

const problem = (err: string, more = "") => `<div class="problem"><p class="err">${esc(err)}</p>${more}</div>`;
const zipOnly = () => `<p>${esc(t.zipOnly)}</p>`;
/** Where failure shows, the help (docs/design/root-page.md, "Network help, where failure shows"): the network may be the cause; what to tell IT is on /check. */
const networkHelp = () => problem(t.offline, `<p><a href="/check#it">${esc(t.whatToTellIt)}</a></p>`);

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
    await submit(await quizTextFromEntries(entries), entries);
  } catch (e) {
    // The archive's own messages (client/unzip.ts) are English, like the quiz's problems.
    out.innerHTML = problem(e instanceof Error ? e.message : t.unreadable);
  }
}

/** leaveOut: the teacher chose to run the quiz without the pictures that can't go up. */
async function submit(value: string, archive: ZipEntry[], leaveOut = false): Promise<void> {
  if (sending) return;
  if (new Blob([value]).size > MAX_QUIZ_BYTES) {
    out.innerHTML = problem(t.tooLong(Math.round(MAX_QUIZ_BYTES / 1000)));
    return;
  }
  sending = true;
  out.innerHTML = `<p class="muted">${esc(t.reading)}</p>`;
  try {
    const prepared = await prepareImages(value, archive, (done, of) => {
      out.innerHTML = `<p class="muted">${esc(t.preparing(done, of))}</p>`;
    });
    if (prepared.problems.length > 0 && !leaveOut) {
      showProblems(prepared.problems, true, () => void submit(value, archive, true));
      return;
    }
    out.innerHTML = `<p class="muted">${esc(t.sending)}</p>`;
    const r = await uploadQuiz(value, prepared.images, leaveOut);
    if (r.ok) {
      // One quiz that hasn't started per device: the previous upload ends if
      // it never started (docs/design/hosting-and-limits.md, "Running classes
      // finish"). keepalive: it outlives the page's change below.
      const previous = savedQuizzes()[0];
      if (previous && previous.id !== r.id) {
        void fetch(`/api/i/${previous.id}/replaced`, { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: previous.secret }) }).catch(() => {});
      }
      saveQuiz({ id: r.id, secret: r.secret, code: r.code, teacher: r.teacher, title: "", at: Date.now() });
      recordUploadDay();
      // This tab is the Projector that steers itself (user flow, rule 3); it opens on the check screen.
      tabRole.set(r.id, { role: "screen", token: r.token, code: r.code, teacher: r.teacher });
      tabLobby.set(r.id, "check");
      location.href = `/screen?q=${r.id}`;
      return;
    }
    if ((r.errors?.length ?? 0) > 0) showProblems(r.errors, (r.missingImages?.length ?? 0) > 0, () => void submit(value, archive, true));
    else if (r.quota) out.innerHTML = problem(t.quota(quotaResetAt()), `<p><a href="/own-copy">${esc(t.ownCopyLink)}</a></p>`);
    else if (r.full) out.innerHTML = problem(t.siteFull(r.full, quotaResetAt()), `<p><a href="/own-copy">${esc(t.ownCopyLink)}</a></p>`);
    // Not the site's answer: most likely a filter's page in between.
    else if (r.json === false) out.innerHTML = networkHelp();
    else out.innerHTML = problem(r.error ?? t.notTaken);
  } catch {
    out.innerHTML = networkHelp();
  } finally {
    sending = false;
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
  const href = info.teacher ? teacherEntry(info.code, info.teacher) : `/teacher#${info.code}`;
  box.innerHTML = `<div class="resume">
    <p class="head"><span class="title">${esc(info.title || t.untitled)}</span><span class="stands">${esc(stands)}</span></p>
    <p class="go"><a class="back" href="${esc(href)}">${esc(t.back)}</a><span class="code">${esc(t.classCode)} <b>${esc(info.code)}</b></span></p>
    ${info.teacher ? `<p class="other">${t.otherDevice(esc(teacherCode(info.code, info.teacher)))}</p>` : ""}
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

/** The example's quizzes, as /example's "Start the example quiz" names them (docs/design/example-page.md). */
const EXAMPLE_ZIPS: Record<string, string> = {
  de: "zahlenstrahl-quiz.zip",
  en: "big-numbers-quiz.zip",
  fr: "droite-graduee.zip",
  it: "quiz-retta-numerica.zip",
};

/** The example goes up as a dropped .zip does, through fromFiles: one path, so it can't drift from a teacher's upload. */
async function runExample(name: string): Promise<void> {
  out.innerHTML = `<p class="muted">${esc(t.reading)}</p>`;
  runbox.scrollIntoView({ block: "center" });
  let zip: Blob;
  try {
    const res = await fetch(`/examples/${name}`);
    if (!res.ok) throw new Error(String(res.status));
    zip = await res.blob();
  } catch {
    out.innerHTML = networkHelp();
    return;
  }
  await fromFiles([new File([zip], name, { type: "application/zip" })]);
}

apply(lang);
void findOpen();
void findFull();
const example = EXAMPLE_ZIPS[new URLSearchParams(location.search).get("example") ?? ""];
if (example) {
  // A reload or Back must not upload it again.
  history.replaceState(null, "", "/");
  void runExample(example);
}
