// The local check, /open (docs/design/local-check.md): a quiz read from its
// .zip in this browser, before anything of it goes to the site. The person picks how it will be played
// (client/entries.ts); the questions and their fixes are folded away, since
// whoever will play mustn't have to see them to get there.
//
// The quiz arrives from the root page through handoff.ts (/open#<key>), or
// is one of the root page's examples, fetched here (/open?example=<lang>&ex=<example>). Nothing of it
// is kept: a reload of a handed-over quiz finds nothing, and says so.

import * as G from "../server/game.ts";
import type { Problem } from "../quiz/format.ts";
import type { TeacherQuestion } from "../shared/protocol.ts";
import { $, esc, lines } from "./dom.ts";
import { ENTRIES, type Entry, type EntryContext } from "./entries.ts";
import { exampleOf, exampleZip } from "./example-text.ts";
import { sweepStale, takeOver } from "./handoff.ts";
import { TEXT, isLang } from "./landing-text.ts";
import { T, lang, said } from "./room-text.ts";
import { newUI, patch, questionList, toast, viewAct, type QuestionsView } from "./manage.ts";
import { openQuiz, readQuiz, type OpenedQuiz, type QuizFiles } from "./opening.ts";
import { fillPictures } from "./pictures.ts";
import { listZip, quizTextFromEntries } from "./unzip.ts";

const main = $("#main");
document.documentElement.lang = lang;
/** The root page's words for what it shares with this page: reading the quiz, its problems, no connection. */
const PAGE = TEXT[lang];
const ui = newUI();
let opened: OpenedQuiz | null = null;
/** The fixes go through the game's own rules (server/game.ts), as the server applies them at upload. */
let game: G.Game | null = null;
let foldOpen = false;
/** An entry is starting: other presses wait. */
let busy = false;

async function arrive(): Promise<void> {
  const example = new URLSearchParams(location.search).get("example");
  const key = location.hash.slice(1);
  // The key is spent once read; a reload must not look for it again.
  if (key) history.replaceState(null, "", location.pathname + location.search);
  // takeOver sweeps as it reads; without a key, what an earlier handover left goes here.
  else void sweepStale();
  let files: QuizFiles | null = null;
  if (isLang(example)) {
    // The root page's examples (docs/design/root-page.md, "Getting a quiz"): ?ex= names one; without it, the worked example's.
    files = await exampleFiles(exampleZip(exampleOf(new URLSearchParams(location.search)), example));
    if (!files) return;
  } else if (key) {
    files = await takeOver(key).catch(() => null);
  }
  if (!files) {
    nothingOpen();
    return;
  }
  const r = await openQuiz(files);
  if (!r.ok) {
    cantRun(r.errors);
    return;
  }
  opened = r.quiz;
  game = G.newGame(opened.quiz);
  opened.fixes = game.fixes;
  renderCheck();
}

/** The worked example's .zip, read as a teacher's is (docs/design/example-page.md): one path, so it can't run differently. */
async function exampleFiles(name: string): Promise<QuizFiles | null> {
  main.innerHTML = `<p class="muted">${esc(PAGE.reading)}</p>`;
  let buf: ArrayBuffer;
  try {
    const res = await fetch(`/examples/${name}`);
    if (!res.ok) throw new Error(String(res.status));
    buf = await res.arrayBuffer();
  } catch {
    main.innerHTML = `<div class="open-problem"><p class="err">${esc(PAGE.offline)}</p><p><a href="/check#it">${esc(PAGE.whatToTellIt)}</a></p></div>`;
    return null;
  }
  try {
    const entries = listZip(buf);
    const r = await readQuiz(await quizTextFromEntries(entries), entries, false);
    if (r.ok) return r.files;
    cantRun(r.errors);
  } catch (e) {
    cantRun([{ message: e instanceof Error ? e.message : PAGE.unreadable }]);
  }
  return null;
}

function nothingOpen(): void {
  document.title = "classyQuiz";
  main.innerHTML = `<h1 class="ctitle">${esc(T.nothingOpenH)}</h1>
    <p>${esc(T.nothingOpen)}</p>
    <p><a class="btn primary" href="/">${esc(T.toStart)}</a></p>`;
}

function cantRun(errors: Problem[]): void {
  main.innerHTML = `<div class="open-problem"><p class="err">${esc(PAGE.quizHead)}</p>
    <ul lang="en">${errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul></div>
    <p><a class="btn" href="/">${esc(T.toStart)}</a></p>`;
}

/**
 * The check: the title and the count (what tells two versions of a quiz
 * apart), the entries, and the questions folded away under a line that
 * warns whoever will play.
 */
function renderCheck(): void {
  const q = opened!;
  const n = q.quiz.questions.length;
  document.title = `${q.quiz.title || "Quiz"} · classyQuiz`;
  const notes = q.warnings.length;
  const plays = ENTRIES.some((e) => e.plays);
  // An entry that played in this page (Solo) gives it back: the check's own page, as open.html has it.
  document.body.className = "follows-dark";
  main.className = "check open-check";
  main.innerHTML = `<div class="checkhead"><h1 class="ctitle counted">${lines(q.quiz.title || "Quiz")} <span class="cnum">${T.questions(n)}</span></h1></div>
    ${ENTRIES.length > 1 ? `<h2 class="open-ask">${esc(T.howPlayed)}</h2>` : ""}
    <div class="open-entries">${ENTRIES.map(entryCard).join("")}</div>
    <details class="open-fold"${foldOpen ? " open" : ""}>
      <summary><span class="open-fold-name">${esc(T.foldName)}</span>${notes ? `<span class="open-fold-notes"> · ${esc(T.notes(notes))}</span>` : ""}${
        plays ? `<span class="open-fold-hint">${esc(T.foldHint)}</span>` : ""
      }</summary>
      <div id="qs"></div>
    </details>`;
  $("details.open-fold", main).addEventListener("toggle", (e) => {
    foldOpen = (e.target as HTMLDetailsElement).open;
    if (foldOpen) renderList();
  });
  if (foldOpen) renderList();
}

/**
 * An entry's card: the picture of its way, its name, the sentence, the
 * button and what starting it costs. No button is the primary one: a teacher
 * in a hurry who means to run the quiz would press the one that stands out,
 * and the first is Solo's (docs/design/local-check.md, "The check").
 */
function entryCard(e: Entry, i: number): string {
  return `<section class="open-entry">
    <img class="open-way" src="${esc(e.picture)}" alt="${esc(e.pictureAlt)}" width="640" height="400">
    <h2>${esc(e.name)}</h2>
    <p class="open-line">${esc(e.line)}</p>
    <p class="open-go"><button class="btn" type="button" data-entry="${i}">${esc(e.button)}</button></p>
    ${e.note ? `<p class="open-note">${esc(e.note)}</p>` : ""}
    <div class="open-say" data-say="${i}" role="status"></div>
  </section>`;
}

/** The question list, drawn only while the fold is open, so a closed check holds no question in the page. */
function renderList(): void {
  const box = document.getElementById("qs");
  if (!box || !opened) return;
  patch(box, questionList(questionsView(opened), ui));
  fillPictures(box);
}

/** The check's questions as the lobby lists them (client/manage.ts), in the text's order: no run, so no shuffle yet. */
function questionsView(q: OpenedQuiz): QuestionsView {
  const quiz = q.quiz;
  return {
    background: q.picture(quiz.background),
    warnings: q.warnings,
    questions: quiz.questions.map((qq, i): TeacherQuestion => {
      const fix = q.fixes[i];
      return {
        text: qq.text,
        image: q.picture(qq.image),
        pictureHidden: !!fix.hidePicture,
        background: q.picture(qq.background || quiz.background),
        answers: qq.answers.map((a, j) => ({ text: a.text, counts: fix.counts[j], marked: a.correct, ...(a.image !== undefined ? { image: q.picture(a.image) } : {}) })),
        void: fix.void,
        skip: fix.skip,
        status: fix.skip ? "skipped" : "upcoming",
      };
    }),
  };
}

/** A fix on the check: the same rules as the lobby's (server/game.ts), here before anything goes up. */
function fix(el: HTMLElement): void {
  const g = game!;
  const q = Number(el.dataset.q);
  const f = g.fixes[q];
  if (!f) return;
  try {
    switch (el.dataset.act) {
      case "toggle-count": {
        const i = Number(el.dataset.i);
        G.setCounts(g, q, f.counts.map((c, j) => (j === i ? !c : c)));
        break;
      }
      case "void":
        G.setVoid(g, q, !f.void);
        break;
      case "skip":
        G.setSkip(g, q, !f.skip);
        break;
      case "hide-pic":
        G.setHidePicture(g, q, !f.hidePicture);
        break;
      default:
        return;
    }
  } catch (e) {
    if (!(e instanceof G.GameError)) throw e;
    toast(said(e.message));
  }
  renderList();
}

async function startEntry(i: number, button: HTMLButtonElement): Promise<void> {
  if (busy || !opened) return;
  const entry = ENTRIES[i];
  const say = main.querySelector<HTMLElement>(`[data-say="${i}"]`);
  const ctx: EntryContext = {
    say: (html) => {
      if (say?.isConnected) say.innerHTML = html;
    },
    main,
    showCheck: renderCheck,
  };
  busy = true;
  button.disabled = true;
  try {
    await entry.start(opened, ctx);
  } finally {
    busy = false;
    if (button.isConnected) button.disabled = false;
  }
}

main.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const act = target.closest<HTMLElement>("[data-act]");
  if (act && opened && document.getElementById("qs")?.contains(act)) {
    if (!viewAct(act, ui, renderList)) fix(act);
    return;
  }
  const button = target.closest<HTMLButtonElement>("button[data-entry]");
  if (button) void startEntry(Number(button.dataset.entry), button);
});

void arrive();
