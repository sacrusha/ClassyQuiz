// The top of the root page: the join box for students (the address a child
// types leads straight to it), and the teacher's ways in. The guidance for AIs
// below reads without this script.

import { JOIN_CODE } from "../shared/protocol.ts";
import { $, esc, savedQuizzes } from "./dom.ts";

// The QR code on the projector points here with the code after "#".
const fromHash = location.hash.slice(1).replace(/\D/g, "");
if (JOIN_CODE.test(fromHash)) location.replace(`/play#${fromHash}`);

const form = $("#join") as HTMLFormElement;
const input = $("#code") as HTMLInputElement;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const code = input.value.replace(/\D/g, "");
  if (JOIN_CODE.test(code)) location.href = `/play#${code}`;
  else {
    input.focus();
    input.select();
  }
});
input.addEventListener("input", () => {
  const code = input.value.replace(/\D/g, "");
  if (code !== input.value) input.value = code;
});

// A teacher coming back to the site finds their quiz again.
const mine = savedQuizzes();
if (mine.length > 0) {
  const el = $("#mine");
  el.innerHTML = `Your quizzes on this device: ${mine
    .slice(0, 5)
    .map((q) => `<a href="/teach?q=${esc(q.id)}">${esc(q.title || "untitled")}</a>`)
    .join(" · ")}`;
  el.hidden = false;
}
