// Upload: paste the AI's answer (the main path; many free AI tiers can't make
// files), or pick a .txt/.md file or a .zip holding one. The server parses it;
// problems come back in words the teacher can paste to the AI.

import type { Problem } from "../shared/protocol.ts";
import { MAX_QUIZ_BYTES } from "../shared/protocol.ts";
import { uploadFormat, type UploadFormat } from "../shared/upload.ts";
import { $, esc, saveQuiz } from "./dom.ts";
import { api } from "./net.ts";
import { quizTextFromZip } from "./unzip.ts";

const form = $("#form") as HTMLFormElement;
const text = $("#text") as HTMLTextAreaElement;
const file = $("#file") as HTMLInputElement;
const out = $("#out");
const go = $("#go") as HTMLButtonElement;

/** Counted by format only; a failure here never touches the upload. */
function countAttempt(format: UploadFormat): void {
  void fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }), keepalive: true }).catch(() => {});
}

file.addEventListener("change", async () => {
  const files = [...(file.files ?? [])];
  if (files.length === 0) return;
  const format = uploadFormat(files.map((f) => f.name));
  countAttempt(format);
  const f = files[0];
  try {
    if (format === "zip") text.value = await quizTextFromZip(await f.arrayBuffer());
    else if (format === "txt" || format === "md") text.value = await f.text();
    else {
      // Read as text, a .docx or .pdf would end in "No questions were found".
      const what = format === "several files" ? "several files at once" : format === "no extension" || format === "other" ? "this file" : `a .${format} file`;
      out.innerHTML = `<div class="card"><p class="err">The site takes the quiz as pasted text, a .txt or .md file, or a .zip containing one, not ${esc(what)}.</p>
        <p class="muted">Ask your AI for the quiz as one code block and paste it here, or as a .zip.</p></div>`;
      return;
    }
    out.innerHTML = "";
    await submit();
  } catch (e) {
    out.innerHTML = `<div class="card"><p class="err">${esc(e instanceof Error ? e.message : "The file couldn't be read.")}</p></div>`;
  } finally {
    file.value = "";
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (text.value.trim()) countAttempt("paste");
  void submit();
});

async function submit(): Promise<void> {
  const value = text.value;
  if (!value.trim()) {
    text.focus();
    return;
  }
  if (new Blob([value]).size > MAX_QUIZ_BYTES) {
    out.innerHTML = `<div class="card"><p class="err">This text is longer than a quiz can be (${Math.round(MAX_QUIZ_BYTES / 1000)} KB).</p></div>`;
    return;
  }
  go.disabled = true;
  out.innerHTML = `<p class="muted">Reading the quiz…</p>`;
  try {
    const r = await api<{ ok: boolean; id?: string; secret?: string; errors?: Problem[]; warnings?: Problem[]; error?: string }>("/api/quiz", { text: value });
    if (r.body.ok && r.body.id && r.body.secret) {
      saveQuiz({ id: r.body.id, secret: r.body.secret, title: "", at: Date.now() });
      location.href = `/teach?q=${r.body.id}`;
      return;
    }
    if (r.body.errors) showProblems(r.body.errors);
    else out.innerHTML = `<div class="card"><p class="err">${esc(r.body.error ?? "The site couldn't take the quiz. Try again.")}</p></div>`;
  } catch {
    out.innerHTML = `<div class="card"><p class="err">No connection to the site. Check the network and try again.</p></div>`;
  } finally {
    go.disabled = false;
  }
}

function showProblems(errors: Problem[]): void {
  const forAi = `The quiz site couldn't read the quiz:\n${errors.map((e) => `- ${e.message}`).join("\n")}\nPlease send the corrected quiz as one code block.`;
  out.innerHTML = `<div class="card">
    <p class="err">The site can't run this quiz yet:</p>
    <ul class="problems">${errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>
    <p class="muted">Your AI can fix this. Copy the message and paste it into the chat, then paste the new quiz here.</p>
    <p><button class="btn primary" id="copy" type="button">Copy the message for your AI</button></p>
  </div>`;
  $("#copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(forAi);
      $("#copy").textContent = "Copied";
    } catch {
      // No clipboard permission: show it for copying by hand.
      out.insertAdjacentHTML("beforeend", `<pre class="card" style="white-space:pre-wrap">${esc(forAi)}</pre>`);
    }
  });
}
