// The root page's top (docs/user-flow.md §3.1): the code box for students in
// the header, Build a quiz, and Run a quiz: upload or drop the .zip the AI
// made, and the quizzes this device opened that are still open. The guidance
// for AIs below reads without this script.
//
// Run a quiz takes a .zip and nothing else (backlog item 2): a box to type
// in read as a place to talk to an AI, and pasting text distracted.

import type { Problem, QuizInfo } from "../shared/protocol.ts";
import { JOIN_CODE, MAX_QUIZ_BYTES, TEACHER_CODE } from "../shared/protocol.ts";
import { uploadFormat, type UploadFormat } from "../shared/upload.ts";
import { $, esc, forgetQuiz, saveQuiz, savedQuizzes, store, tabLobby, tabRole, teacherEntry, type SavedQuiz } from "./dom.ts";
import { prepareImages, uploadQuiz } from "./images.ts";
import { api } from "./net.ts";
import { listZip, quizTextFromEntries, type ZipEntry } from "./unzip.ts";

// The QR code on the projector points here with the code after "#".
const fromHash = location.hash.slice(1).replace(/\D/g, "");
if (JOIN_CODE.test(fromHash) || TEACHER_CODE.test(fromHash)) location.replace(`/play#${fromHash}`);

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

// --- Build a quiz: copy the address

// The address is this site's, also on a copy under another name (the build
// writes the copy's expected name into the page for AIs; this is the one the
// teacher's browser actually opened). The button is made here, not in the
// HTML: an AI's fetcher converting the page to text would otherwise read the
// address as "classyquiz.pages.devCopy".
const addr = document.querySelector<HTMLElement>(".addr");
if (addr && location.host) addr.textContent = location.host;
if (addr && navigator.clipboard?.writeText) {
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy";
  addr.append(copy);
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.host);
      copy.textContent = "Copied";
      window.setTimeout(() => (copy.textContent = "Copy"), 2000);
    } catch {
      /* the address is there to read */
    }
  });
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

/** What the box takes, said when something else arrives. */
const ZIP_ONLY = `<p>Your AI can make the quiz as one .zip file, to download from the chat and upload here.</p>`;

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
  out.innerHTML = `<div class="problem"><p class="err">The site takes the quiz as a .zip file, not as text.</p>${ZIP_ONLY}</div>`;
}

async function fromFiles(files: File[]): Promise<void> {
  const format = uploadFormat(files.map((f) => f.name));
  countAttempt(format);
  if (format !== "zip") {
    const what = format === "several files" ? "several files at once" : format === "no extension" || format === "other" ? "this file" : `a .${format} file`;
    out.innerHTML = `<div class="problem"><p class="err">The site takes the quiz as a .zip file, not ${esc(what)}.</p>${ZIP_ONLY}</div>`;
    return;
  }
  try {
    const entries = listZip(await files[0].arrayBuffer());
    await submit(await quizTextFromEntries(entries), entries);
  } catch (e) {
    out.innerHTML = `<div class="problem"><p class="err">${esc(e instanceof Error ? e.message : "The file couldn't be read.")}</p></div>`;
  }
}

/** leaveOut: the teacher chose to run the quiz without the pictures that can't go up. */
async function submit(value: string, archive: ZipEntry[] | null, leaveOut = false): Promise<void> {
  if (sending) return;
  if (new Blob([value]).size > MAX_QUIZ_BYTES) {
    out.innerHTML = `<div class="problem"><p class="err">The quiz text is longer than the site takes (${Math.round(MAX_QUIZ_BYTES / 1000)} KB).</p></div>`;
    return;
  }
  sending = true;
  out.innerHTML = `<p class="muted">Reading the quiz…</p>`;
  try {
    const prepared = await prepareImages(value, archive, (done, of) => {
      out.innerHTML = `<p class="muted">Preparing the pictures… ${done} of ${of}</p>`;
    });
    if (prepared.problems.length > 0 && !leaveOut) {
      showProblems(prepared.problems, true, () => void submit(value, archive, true));
      return;
    }
    out.innerHTML = `<p class="muted">Sending the quiz…</p>`;
    const r = await uploadQuiz(value, prepared.images, leaveOut);
    if (r.ok) {
      saveQuiz({ id: r.id, secret: r.secret, code: r.code, teacher: r.teacher, title: "", at: Date.now() });
      // This tab is the Projector that steers itself (user flow, rule 3); it opens on the check screen.
      tabRole.set(r.id, { role: "screen", token: r.token, code: r.code, teacher: r.teacher });
      tabLobby.set(r.id, "check");
      location.href = `/screen?q=${r.id}`;
      return;
    }
    if ((r.errors?.length ?? 0) > 0) showProblems(r.errors, (r.missingImages?.length ?? 0) > 0, () => void submit(value, archive, true));
    else out.innerHTML = `<div class="problem"><p class="err">${esc(r.error ?? "The site couldn't take the quiz. Try again.")}</p></div>`;
  } catch {
    out.innerHTML = `<div class="problem"><p class="err">No connection to the site. Check the network and try again.</p></div>`;
  } finally {
    sending = false;
  }
}

/** pictures: the problems are pictures that can't go up; the teacher may run the quiz without them. */
function showProblems(errors: Problem[], pictures: boolean, without: () => void): void {
  const ask = pictures
    ? "Please send the quiz again as one .zip file, with these pictures fixed."
    : "Please send the corrected quiz as one .zip file.";
  const forAi = `The quiz site couldn't read the quiz:\n${errors.map((e) => `- ${e.message}`).join("\n")}\n${ask}`;
  out.innerHTML = `<div class="problem">
    <p class="err">${pictures ? "Some pictures can't go up with the quiz:" : "The site can't run this quiz yet:"}</p>
    <ul>${errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>
    <p>Your AI can fix this. Copy the message into the chat, and upload the .zip it sends back.</p>
    <p><button class="primary" id="copymsg" type="button">Copy the message for your AI</button>
    ${pictures ? `<button id="without" type="button">Continue without these pictures</button>` : ""}</p>
  </div>`;
  $("#copymsg").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(forAi);
      $("#copymsg").textContent = "Copied";
    } catch {
      // No clipboard permission: show it for copying by hand.
      out.insertAdjacentHTML("beforeend", `<pre style="white-space:pre-wrap">${esc(forAi)}</pre>`);
    }
  });
  if (pictures) $("#without").addEventListener("click", without);
}

// --- coming back (item 17): the quizzes this device opened that are still open

const mine = $("#mine");

function closes(t: number): string {
  const d = new Date(t);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return sameDay ? time : `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
}

/** One quiz as the teacher sees it: the newest upload of a title, and every upload of it this device holds. */
interface Entry {
  newest: SavedQuiz;
  info: QuizInfo;
  /** All of this device's uploads with this title, the newest included: Delete ends them all. */
  copies: SavedQuiz[];
}

/** How many saved quizzes are asked about per visit; each is a request against the site's daily allowance. */
const ASK_AT_MOST = 6;

let entries: Entry[] = [];
let moreOpen = false;

/**
 * One line per quiz: Resume, when it closes, and Delete… apart at the end,
 * asking inline. The latest shows; the rest fold under "n more" (item 16:
 * one open quiz is the usual case, and a teacher with several already knows
 * the page).
 *
 * A title opened again is one quiz, not two (item 16, third look: the count
 * only ever grew). A corrected quiz from the AI keeps its title, so a test
 * round or a key fixed before the lesson left a line per upload. The newest
 * upload of a title stands for it; the older ones stay on the site until they
 * close by themselves, out of the list, and Delete ends them with it. Titles
 * are learnt from the site and kept on the device, so older uploads of a
 * known title aren't asked about at all. An untitled quiz is its own entry.
 */
async function showMine(): Promise<void> {
  const saved = savedQuizzes().sort((a, b) => b.at - a.at);
  const seen = new Set<string>();
  const ask: SavedQuiz[] = [];
  for (const q of saved) {
    if (ask.length >= ASK_AT_MOST) break;
    if (q.title && seen.has(q.title)) continue;
    if (q.title) seen.add(q.title);
    ask.push(q);
  }
  const open: { q: SavedQuiz; info: QuizInfo }[] = [];
  await Promise.all(
    ask.map(async (q) => {
      try {
        const r = await api<QuizInfo>(`/api/i/${q.id}/info`, { secret: q.secret });
        if (r.status === 404) forgetQuiz(q.id);
        else if (r.body.code) open.push({ q, info: r.body });
      } catch {
        /* offline: show nothing rather than something stale */
      }
    }),
  );
  const titles = new Map(open.filter((o) => o.info.title && o.info.title !== o.q.title).map((o) => [o.q.id, o.info.title]));
  if (titles.size) store.set("cq.quizzes", savedQuizzes().map((q) => (titles.has(q.id) ? { ...q, title: titles.get(q.id)! } : q)));

  open.sort((a, b) => b.q.at - a.q.at);
  const byKey = new Map<string, Entry>();
  for (const { q, info } of open) {
    const key = info.title ? `t:${info.title}` : `i:${q.id}`;
    const e = byKey.get(key);
    if (e) e.copies.push(q);
    else byKey.set(key, { newest: q, info, copies: [q] });
  }
  // Uploads not asked about because a newer one has their title.
  for (const q of saved) {
    const e = q.title ? byKey.get(`t:${q.title}`) : undefined;
    if (e && !e.copies.some((c) => c.id === q.id)) e.copies.push(q);
  }
  entries = [...byKey.values()];
  render();
}

function render(): void {
  if (!entries.length) {
    mine.innerHTML = "";
    return;
  }
  const row = (e: Entry, i: number) => `<div class="row" data-i="${i}"${i > 0 && !moreOpen ? " hidden" : ""}>
      <a class="go" href="${esc(e.info.teacher ? teacherEntry(e.info.code, e.info.teacher) : `/teacher#${e.info.code}`)}">Resume ${esc(e.info.title || "the quiz")} &#9654;</a>
      <span class="t">closes ${esc(closes(e.info.closes))}</span>
      <button class="del" type="button" data-del>Delete…</button>
    </div>`;
  const n = entries.length - 1;
  const more = n
    ? `<button class="more" type="button" aria-expanded="${moreOpen}">${moreOpen ? "&#9662;" : "&#9656;"} ${n} more ${n === 1 ? "quiz" : "quizzes"}</button>`
    : "";
  mine.innerHTML = `<div class="mine">${row(entries[0], 0)}${more}${entries.slice(1).map((e, i) => row(e, i + 1)).join("")}</div>`;
  mine.querySelector(".more")?.addEventListener("click", () => {
    moreOpen = !moreOpen;
    render();
  });
  mine.querySelectorAll<HTMLElement>("[data-del]").forEach((b) => b.addEventListener("click", () => askDelete(b.closest<HTMLElement>(".row")!)));
}

function askDelete(box: HTMLElement): void {
  if (box.querySelector(".confirm")) return;
  const e = entries[Number(box.dataset.i)];
  box.insertAdjacentHTML(
    "beforeend",
    `<div class="confirm">Delete <strong>${esc(e.info.title || "this quiz")}</strong>? The class can't join it any more.
      <button class="del" data-yes type="button">Delete</button> <button class="del" data-no type="button">Keep</button></div>`,
  );
  const confirm = box.querySelector<HTMLElement>(".confirm")!;
  confirm.querySelector("[data-no]")!.addEventListener("click", () => confirm.remove());
  confirm.querySelector("[data-yes]")!.addEventListener("click", async () => {
    const done = await Promise.all(
      e.copies.map(async (q) => {
        try {
          await api(`/api/i/${q.id}/end`, { secret: q.secret });
          forgetQuiz(q.id);
          return true;
        } catch {
          return false;
        }
      }),
    );
    if (done.some((ok) => !ok)) {
      confirm.querySelector(".err")?.remove();
      confirm.insertAdjacentHTML("beforeend", ` <span class="err">No connection to the site. Try again.</span>`);
      return;
    }
    entries = entries.filter((x) => x !== e);
    if (entries.length < 2) moreOpen = false;
    render();
  });
}

void showMine();
