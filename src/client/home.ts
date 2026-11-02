// The root page's top (docs/user-flow.md §3.1): the code box for students in
// the header, Build a quiz, and Run a quiz: paste the AI's block or drop its
// .zip, and the quizzes this device pasted that are still open. The guidance
// for AIs below reads without this script.
//
// Run a quiz is not a text box: a box to type in reads as a place to talk to
// an AI (backlog item 2). Ctrl+V anywhere on the page, the Paste button, or a
// dropped .zip; a box to long-press only where the browser won't let the page
// read the clipboard.

import type { Problem, QuizInfo } from "../shared/protocol.ts";
import { JOIN_CODE, MAX_QUIZ_BYTES } from "../shared/protocol.ts";
import { uploadFormat, type UploadFormat } from "../shared/upload.ts";
import { $, esc, forgetQuiz, saveQuiz, savedQuizzes, tabRole, type SavedQuiz } from "./dom.ts";
import { prepareImages, uploadQuiz } from "./images.ts";
import { api } from "./net.ts";
import { listZip, quizTextFromEntries, type ZipEntry } from "./unzip.ts";

// The QR code on the projector points here with the code after "#".
const fromHash = location.hash.slice(1).replace(/\D/g, "");
if (JOIN_CODE.test(fromHash)) location.replace(`/play#${fromHash}`);

// --- the students' code box

const join = $("#join") as HTMLFormElement;
const codeInput = $("#code") as HTMLInputElement;
join.addEventListener("submit", (e) => {
  e.preventDefault();
  const code = codeInput.value.replace(/\D/g, "");
  if (JOIN_CODE.test(code)) location.href = `/play#${code}`;
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

const copy = document.getElementById("copy") as HTMLButtonElement | null;
if (copy && navigator.clipboard?.writeText) {
  copy.hidden = false;
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
const pasteBtn = $("#paste") as HTMLButtonElement;
const manual = $("#manual");
const text = $("#text") as HTMLTextAreaElement;
const file = $("#file") as HTMLInputElement;
let sending = false;

/** Counted by format only; a failure here never touches the upload. */
function countAttempt(format: UploadFormat): void {
  void fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }), keepalive: true }).catch(() => {});
}

document.addEventListener("paste", (e) => {
  if (e.target === codeInput) return;
  const t = e.clipboardData?.getData("text/plain") ?? "";
  const files = [...(e.clipboardData?.files ?? [])];
  if (!t.trim() && files.length === 0) return;
  e.preventDefault();
  if (t.trim()) void fromPaste(t);
  else void fromFiles(files);
});

pasteBtn.addEventListener("click", async () => {
  let t = "";
  try {
    t = await navigator.clipboard.readText();
  } catch {
    /* not allowed or not offered: the long-press box below */
  }
  if (t.trim()) {
    void fromPaste(t);
    return;
  }
  manual.hidden = false;
  text.focus();
});
$("#go").addEventListener("click", () => void fromPaste(text.value));

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
  else {
    const t = e.dataTransfer?.getData("text/plain") ?? "";
    if (t.trim()) void fromPaste(t);
  }
});

/** Lines a quiz has and a question to an AI doesn't: answers marked + or -, or a title. */
const QUIZ_LIKE = /^\s*(?:[-+–—−＋]\s+\S|[-*]?\s*\[[ xX✓✔]\]\s|#*\s*\**title\**\s*:)/im;

async function fromPaste(t: string): Promise<void> {
  countAttempt("paste");
  if (!QUIZ_LIKE.test(t)) {
    // Someone typed or pasted a question for the AI: tell them where it goes.
    out.innerHTML = `<div class="problem"><p class="err">That doesn't look like a quiz yet.</p>
      <p>This box takes the quiz your AI made. Ask your AI in its own chat; it answers with the quiz as a block with a copy button. Copy that and paste it here.</p></div>`;
    return;
  }
  await submit(t, null);
}

async function fromFiles(files: File[]): Promise<void> {
  const format = uploadFormat(files.map((f) => f.name));
  countAttempt(format);
  if (format !== "zip") {
    const what = format === "several files" ? "several files at once" : format === "no extension" || format === "other" ? "this file" : `a .${format} file`;
    out.innerHTML = `<div class="problem"><p class="err">The site takes the quiz pasted, or as a .zip from your AI, not ${esc(what)}.</p>
      <p>Ask your AI for the quiz as one code block and paste it here, or as a .zip.</p></div>`;
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
    out.innerHTML = `<div class="problem"><p class="err">This text is longer than a quiz can be (${Math.round(MAX_QUIZ_BYTES / 1000)} KB).</p></div>`;
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
      saveQuiz({ id: r.id, secret: r.secret, code: r.code, title: "", at: Date.now() });
      // This tab is the Projector that steers itself (user flow, rule 3).
      tabRole.set(r.id, { role: "screen", token: r.token, code: r.code });
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
    ? "Please send the quiz with its pictures as one .zip file, or the quiz without pictures as one code block."
    : "Please send the corrected quiz as one code block.";
  const forAi = `The quiz site couldn't read the quiz:\n${errors.map((e) => `- ${e.message}`).join("\n")}\n${ask}`;
  out.innerHTML = `<div class="problem">
    <p class="err">${pictures ? "Some pictures can't go up with the quiz:" : "The site can't run this quiz yet:"}</p>
    <ul>${errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>
    <p>Your AI can fix this. Copy the message, paste it into the chat, then paste the new quiz here.</p>
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

// --- coming back (item 17): the quizzes this device pasted that are still open

const mine = $("#mine");

function closes(t: number): string {
  const d = new Date(t);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return sameDay ? time : `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
}

async function showMine(): Promise<void> {
  const list = savedQuizzes().slice(0, 5);
  const open: { q: SavedQuiz; info: QuizInfo }[] = [];
  await Promise.all(
    list.map(async (q) => {
      try {
        const r = await api<QuizInfo>(`/api/i/${q.id}/info`, { secret: q.secret });
        if (r.status === 404) forgetQuiz(q.id);
        else if (r.body.code) open.push({ q, info: r.body });
      } catch {
        /* offline: show nothing rather than something stale */
      }
    }),
  );
  open.sort((a, b) => b.q.at - a.q.at);
  mine.innerHTML = open
    .map(
      ({ q, info }) => `<div class="resume" data-id="${esc(q.id)}">
        <div><strong>${esc(info.title || "Quiz")}</strong> · code ${esc(info.code)}</div>
        <div class="l2"><a class="go" href="/teacher#${esc(info.code)}">Resume &#9654;</a><span class="t">closes ${esc(closes(info.closes))}</span><button class="del" type="button" data-del>Delete…</button></div>
      </div>`,
    )
    .join("");
  mine.querySelectorAll<HTMLElement>("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const box = b.closest<HTMLElement>(".resume")!;
      const q = open.find((o) => o.q.id === box.dataset.id)!;
      if (box.querySelector(".confirm")) return;
      box.insertAdjacentHTML(
        "beforeend",
        `<div class="confirm">Delete <strong>${esc(q.info.title || "this quiz")}</strong>? The class can't join it any more.
          <button class="del" data-yes type="button">Delete</button> <button class="del" data-no type="button">Keep</button></div>`,
      );
      box.querySelector("[data-no]")!.addEventListener("click", () => box.querySelector(".confirm")?.remove());
      box.querySelector("[data-yes]")!.addEventListener("click", async () => {
        try {
          await api(`/api/i/${q.q.id}/end`, { secret: q.q.secret });
        } catch {
          return;
        }
        forgetQuiz(q.q.id);
        box.remove();
      });
    }),
  );
}

void showMine();
