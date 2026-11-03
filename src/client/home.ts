// The root page's top (docs/landing-story.md, draft 4): the code box for
// students and the language in the header; the strip, which until the video
// exists links the example's questions (/example); Build a quiz in two steps
// with the labelled example ask and the open one (nothing decided yet); Run a quiz: the resume card for the latest
// open quiz this device started, the box for the .zip, and, under a
// condition, the own-copy line. The guidance for AIs below reads without this
// script, in English; this script puts the block above it in the visitor's
// language (client/landing-text.ts).
//
// Run a quiz takes a .zip and nothing else (backlog item 2): a box to type
// in read as a place to talk to an AI, and pasting text distracted.

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

// The QR code on the projector points here with the code after "#".
const fromHash = location.hash.slice(1).replace(/\D/g, "");
if (JOIN_CODE.test(fromHash) || TEACHER_CODE.test(fromHash)) location.replace(`/play#${fromHash}`);

/** The address the browser opened: an own copy shows its own (the build writes it into the static page for AIs). */
const host = location.host || "classyquiz.pages.dev";
const DEMO = "classyquiz.pages.dev";

let lang: Lang = chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
let t: Text = TEXT[lang];

// --- the code box: the students' class code, and the teacher code, the
// class code and two digits (docs/after-upload.md §4). It routes by length
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

// --- the language switch, top right (landing story §4): "EN ▾" over a
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

// --- Build a quiz: copy the address. The button is made here, not in the
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

/** The example asks: the first with each labelled part's label under it (on a phone the CSS hides those and shows the labels as one line), the open one plain. */
function renderAsk(): void {
  const bubble = $("#bubble");
  bubble.innerHTML = t.ask
    .map((p) => {
      const s = esc(p.s.replaceAll(DEMO, host));
      return p.l === undefined ? s : `<span class="part"><u>${s}</u><span class="lab">${esc(t.labels[p.l])}</span></span>`;
    })
    .join("");
  bubble.classList.add("inplace");
  bubble.lang = lang;
  $("#labels").innerHTML = t.labels.map((l) => `<span class="nb">${esc(l)}</span>`).join(" · ");
  const openAsk = $("#bubble2");
  openAsk.textContent = t.ask2.replaceAll(DEMO, host);
  openAsk.lang = lang;
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
  for (const img of document.querySelectorAll<HTMLImageElement>("img[data-lang-src]")) img.src = `/landing/${img.dataset.langSrc}-${l}.webp`;
  ($("#strip") as HTMLAnchorElement).href = `/example?lang=${l}`;
  for (const id of ["#landing", "header.top .bar"]) $(id).lang = l;
  if (copy) copy.textContent = t.copy;
  renderAsk();
  renderResume();
  renderOwnCopy();
}

// --- Run a quiz

const runbox = $("#runbox");
const out = $("#out");
const file = $("#file") as HTMLInputElement;
let sending = false;

/** Counted by format only; a failure here never touches the upload. */
function countAttempt(format: UploadFormat): void {
  void fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }), keepalive: true }).catch(() => {});
}

const problem = (err: string, more = "") => `<div class="problem"><p class="err">${esc(err)}</p>${more}</div>`;
/** What the box takes, said when something else arrives. */
const zipOnly = () => `<p>${esc(t.zipOnly)}</p>`;
/** Where failure shows, the help (landing story §7): the network may be the cause; what to tell IT is on /check. */
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

// Nothing on the page invites pasting (item 2: pasting distracted). A file
// copied in the file manager and pasted still opens; pasted text is told
// where the quiz goes, and counted, so whether people still try is a fact.
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
async function submit(value: string, archive: ZipEntry[] | null, leaveOut = false): Promise<void> {
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

// --- coming back (backlog v4 item 2). Who resumes: the device that started
// the quiz, during that lesson. What it needs: the way back, and certainty
// it's the right quiz. So: the latest quiz this device started, while it
// hasn't reached its final ranking; its title, where it stands, its code,
// and the way back from another device, the teacher code in the code box.
// Not shown: when it closes, delete, older quizzes.

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
      // The latest quiz still on the site decides: open, or finished (then nothing).
      if (r.body.code && r.body.stands?.phase !== "final") open = { q, info: r.body };
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
  const stands = s && s.n > 0 && s.phase !== "lobby" && s.phase !== "idle" ? t.question(s.n, s.total) : t.notStarted;
  const href = info.teacher ? teacherEntry(info.code, info.teacher) : `/teacher#${info.code}`;
  box.innerHTML = `<div class="resume">
    <p class="head"><span class="title">${esc(info.title || t.untitled)}</span><span class="stands">${esc(stands)}</span></p>
    <p class="go"><a class="back" href="${esc(href)}">${esc(t.back)}</a><span class="code">${esc(t.classCode)} <b>${esc(info.code)}</b></span></p>
    ${info.teacher ? `<p class="other">${t.otherDevice(esc(teacherCode(info.code, info.teacher)))}</p>` : ""}
  </div>`;
}

// --- the own copy (backlog v4 item 4, the product owner's defaults): one
// line under Run, only on a device that has uploaded before, and only once
// the site has been full on a day of the last 30, stating that fact. The
// site's state is one request per visit, and only from such a device.

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
