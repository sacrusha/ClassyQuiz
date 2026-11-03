// /example: the check screen without codes (docs/after-upload.md §8; landing
// story §3.3). The example quiz's title and questions as the teacher's check
// shows them after an upload, answers folded, read in the visitor's browser
// from the example's static .zip. No upload, no lobby, no code, and nothing
// booked against the site's budget. In place of "Show the class the code",
// the .zip to download.

import type { ImageRef, TeacherQuestion, TeacherView } from "../shared/protocol.ts";
import { imageKey, parseQuiz } from "../quiz/format.ts";
import { $, esc, lines, store } from "./dom.ts";
import { LANG_KEY, chosenLang } from "./landing-text.ts";
import { prepareImages } from "./images.ts";
import { lightbox, newUI, questionList } from "./manage.ts";
import { fillPictures, provide } from "./pictures.ts";
import { listZip, quizTextFromEntries } from "./unzip.ts";

/** The example in each language the landing page speaks; the same sheet and ask, each giving a quiz in its language. */
const EXAMPLES: Record<string, string> = {
  de: "zahlenstrahl-quiz.zip",
  en: "number-line-quiz.zip",
  fr: "droite-graduee.zip",
  it: "quiz-retta-numerica.zip",
};

const main = $("#main");
const ui = newUI();
let view: TeacherView | null = null;

/** ?lang= from the landing's strip, else the language chosen there on this device, else the browser's. */
function language(): string {
  const asked = new URLSearchParams(location.search).get("lang") ?? "";
  if (asked in EXAMPLES) return asked;
  return chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
}

async function start(): Promise<void> {
  const file = `/examples/${EXAMPLES[language()]}`;
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error("not found");
    const entries = listZip(await res.arrayBuffer());
    const text = await quizTextFromEntries(entries);
    const parsed = parseQuiz(text);
    const pictures = await prepareImages(text, entries);
    // Each picture as a blob URL under a key of its own, which the check's
    // <img data-pic> elements are filled from (client/pictures.ts).
    const refs = new Map<string, ImageRef>();
    for (const p of pictures.images) {
      const src = `example:${imageKey(p.name)}`;
      const bitmap = await createImageBitmap(p.blob);
      refs.set(imageKey(p.name), { src, w: bitmap.width, h: bitmap.height });
      bitmap.close();
      provide(src, URL.createObjectURL(p.blob));
    }
    const ref = (name: string | undefined): ImageRef | null => (name ? (refs.get(imageKey(name)) ?? null) : null);
    const quiz = parsed.quiz;
    const questions: TeacherQuestion[] = quiz.questions.map((q) => ({
      text: q.text,
      image: ref(q.image),
      pictureHidden: false,
      background: ref(q.background || quiz.background),
      answers: q.answers.map((a) => ({ text: a.text, counts: a.correct, marked: a.correct, ...(a.image !== undefined ? { image: ref(a.image) } : {}) })),
      void: false,
      skip: false,
      status: "upcoming",
      seconds: q.seconds ?? quiz.seconds ?? 60,
    }));
    // Only what the question list reads; the rest of a steering view has no meaning here.
    view = { title: quiz.title, questions, background: ref(quiz.background), warnings: parsed.warnings, tempo: "pace" } as unknown as TeacherView;
    document.title = `${quiz.title || "The example"} · classyQuiz`;
    render(file);
  } catch {
    main.innerHTML = `<p class="muted">The example couldn't be loaded. <a href="${esc(file)}">Download it (.zip)</a></p>`;
  }
}

function render(file: string): void {
  const v = view!;
  const n = v.questions.length;
  main.innerHTML = `<div class="checkhead">
      <h1 class="ctitle">${lines(v.title || "Quiz")} <span class="cnum">· ${n} ${n === 1 ? "question" : "questions"}</span></h1>
    </div>
    <p class="cstart"><a class="btn primary big" href="${esc(file)}" download>Download the example (.zip)</a></p>
    <p class="device cline">Uploaded, it opens here, with a code for your class.</p>
    ${questionList(v, ui, true)}`;
  fillPictures(main);
}

main.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!el || !view) return;
  const a = el.dataset.act;
  const q = Number(el.dataset.q);
  if (a === "toggle-q") {
    if (ui.open.has(q)) ui.open.delete(q);
    else ui.open.add(q);
  } else if (a === "toggle-all") {
    ui.all = !ui.all;
    if (!ui.all) ui.open.clear();
  } else if (a === "lightbox") {
    lightbox(el.dataset.src!, Number(el.dataset.w), Number(el.dataset.h));
    return;
  } else return;
  const file = main.querySelector<HTMLAnchorElement>("a[download]")?.getAttribute("href") ?? "";
  render(file);
});

void start();
