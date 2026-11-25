// /example's words in the four languages (docs/design/example-page.md). The
// static HTML is English, so an AI's fetcher reads English; example.ts swaps
// these in. The header's words (code, join, language) are the root page's,
// from landing-text.ts. de, fr and it are drafts for the owner's review;
// the voice is the root page's.

import type { Lang } from "./landing-text.ts";
import { EXAMPLE_FILES } from "./example-files.ts";

export interface ExampleText {
  title: string;
  h1: string;
  sheetsH: string;
  photo1: string;
  photo2: string;
  dl1: string;
  dl2: string;
  dlPdf: string;
  convoH: string;
  convoAlt: string;
  readAll: string;
  reviewH: string;
  reviewAlt: string;
  readReview: string;
  quizH: string;
  runH: string;
  start: string;
  runNote: string;
  /** Shown where the page's language isn't the run's: {from} is the run's language. */
  translated: string;
  /** The languages' names in this language, for {from}. */
  langName: Record<Lang, string>;
}

export const EXAMPLE_TEXT: Record<Lang, ExampleText> = {
  en: {
    title: "The example, step by step · classyQuiz",
    h1: "The example, step by step",
    sheetsH: "The exercise sheets",
    photo1: "Photo of page 1",
    photo2: "Photo of page 2",
    dl1: "Photo, page 1 (.jpg)",
    dl2: "Photo, page 2 (.jpg)",
    dlPdf: "The sheets (.pdf)",
    convoH: "The conversation",
    convoAlt: "The conversation, as a picture",
    readAll: "Read the whole conversation ›",
    reviewH: "The overview",
    reviewAlt: "Every question of the quiz with its solution, as a picture",
    readReview: "See the whole overview ›",
    quizH: "The quiz",
    runH: "Try it",
    start: "Start this quiz",
    runNote: "On your own, it stays in this browser. With friends or a class, it runs on this site like any quiz.",
    translated: "This example was made in {from}. This page shows a translation.",
    langName: { de: "German", en: "English", fr: "French", it: "Italian" },
  },
  de: {
    title: "Das Beispiel, Schritt für Schritt · classyQuiz",
    h1: "Das Beispiel, Schritt für Schritt",
    sheetsH: "Die Arbeitsblätter",
    photo1: "Foto von Seite 1",
    photo2: "Foto von Seite 2",
    dl1: "Foto, Seite 1 (.jpg)",
    dl2: "Foto, Seite 2 (.jpg)",
    dlPdf: "Die Arbeitsblätter (.pdf)",
    convoH: "Das Gespräch",
    convoAlt: "Das Gespräch, als Bild",
    readAll: "Das ganze Gespräch lesen ›",
    reviewH: "Die Übersicht",
    reviewAlt: "Alle Fragen des Quiz mit ihren Lösungen, als Bild",
    readReview: "Die ganze Übersicht ansehen ›",
    quizH: "Das Quiz",
    runH: "Ausprobieren",
    start: "Dieses Quiz starten",
    runNote: "Allein bleibt es in diesem Browser. Mit Freunden oder einer Klasse läuft es auf dieser Seite wie jedes Quiz.",
    translated: "Dieses Beispiel ist auf {from} entstanden. Diese Seite zeigt eine Übersetzung.",
    langName: { de: "Deutsch", en: "Englisch", fr: "Französisch", it: "Italienisch" },
  },
  fr: {
    title: "L'exemple, pas à pas · classyQuiz",
    h1: "L'exemple, pas à pas",
    sheetsH: "Les fiches d'exercices",
    photo1: "Photo de la page 1",
    photo2: "Photo de la page 2",
    dl1: "Photo, page 1 (.jpg)",
    dl2: "Photo, page 2 (.jpg)",
    dlPdf: "Les fiches (.pdf)",
    convoH: "La conversation",
    convoAlt: "La conversation, en image",
    readAll: "Lire toute la conversation ›",
    reviewH: "L'aperçu",
    reviewAlt: "Toutes les questions du quiz avec leurs solutions, en image",
    readReview: "Voir tout l'aperçu ›",
    quizH: "Le quiz",
    runH: "Le lancer",
    start: "Lancer ce quiz",
    runNote: "En solo, il reste dans ce navigateur. Entre amis ou avec une classe, il fonctionne sur ce site comme n'importe quel quiz.",
    translated: "Cet exemple a été réalisé en {from}. Cette page en montre une traduction.",
    langName: { de: "allemand", en: "anglais", fr: "français", it: "italien" },
  },
  it: {
    title: "L'esempio, passo per passo · classyQuiz",
    h1: "L'esempio, passo per passo",
    sheetsH: "Le schede di esercizi",
    photo1: "Foto della pagina 1",
    photo2: "Foto della pagina 2",
    dl1: "Foto, pagina 1 (.jpg)",
    dl2: "Foto, pagina 2 (.jpg)",
    dlPdf: "Le schede (.pdf)",
    convoH: "La conversazione",
    convoAlt: "La conversazione, come immagine",
    readAll: "Leggi tutta la conversazione ›",
    reviewH: "La panoramica",
    reviewAlt: "Tutte le domande del quiz con le loro soluzioni, come immagine",
    readReview: "Vedi tutta la panoramica ›",
    quizH: "Il quiz",
    runH: "Provalo",
    start: "Avvia questo quiz",
    runNote: "Per conto tuo, resta in questo browser. Con gli amici o con una classe funziona su questo sito come qualsiasi quiz.",
    translated: "Questo esempio è nato in {from}. Questa pagina ne mostra una traduzione.",
    langName: { de: "tedesco", en: "inglese", fr: "francese", it: "italiano" },
  },
};

/** The examples that attached a two-page PDF: the words of that step. `note` is said under the pages. */
export interface PdfText {
  h: string;
  /** A page's picture, its accessible name: {n} is the page. */
  page: string;
  dlPdf: string;
  note?: string;
}

export const PDF_TEXT: Record<"notes" | "test", Record<Lang, PdfText>> = {
  notes: {
    en: { h: "The class notes", page: "Page {n} of the notes", dlPdf: "The notes (.pdf)" },
    de: { h: "Die Notizen", page: "Seite {n} der Notizen", dlPdf: "Die Notizen (.pdf)" },
    fr: { h: "Les notes de cours", page: "Page {n} des notes", dlPdf: "Les notes (.pdf)" },
    it: { h: "Gli appunti", page: "Pagina {n} degli appunti", dlPdf: "Gli appunti (.pdf)" },
  },
  test: {
    en: { h: "The marked test", page: "Page {n} of the test", dlPdf: "The test (.pdf)", note: "The test was written for this example, so that no real pupil's work is shown." },
    de: { h: "Die korrigierte Prüfung", page: "Seite {n} der Prüfung", dlPdf: "Die Prüfung (.pdf)", note: "Die Prüfung wurde für dieses Beispiel geschrieben, damit keine echte Schülerarbeit gezeigt wird." },
    fr: { h: "Le contrôle corrigé", page: "Page {n} du contrôle", dlPdf: "Le contrôle (.pdf)", note: "Le contrôle a été écrit pour cet exemple, afin de ne montrer le travail d'aucun élève réel." },
    it: { h: "La verifica corretta", page: "Pagina {n} della verifica", dlPdf: "La verifica (.pdf)", note: "La verifica è stata scritta per questo esempio, per non mostrare il lavoro di nessun alunno reale." },
  },
};

/** The root page's examples, in its tabs' order, each named by what the visitor starts from (docs/design/root-page.md, "Getting a quiz"). */
export const EXAMPLES = ["idea", "sheets", "notes", "test"] as const;
export type Example = (typeof EXAMPLES)[number];
export const isExample = (x: unknown): x is Example => EXAMPLES.includes(x as Example);

/** Each example's run: the AI as its screenshot names it, the day, and the language it was made in. */
export const RUNS: Record<Example, { ai: string; date: string; lang: Lang }> = {
  idea: { ai: "Claude", date: "2026-11-11", lang: "de" },
  sheets: { ai: "Claude (Sonnet)", date: "2026-11-19", lang: "de" },
  notes: { ai: "Claude (Sonnet)", date: "2026-11-12", lang: "en" },
  test: { ai: "Claude (Opus)", date: "2026-11-19", lang: "fr" },
};

/** The example a page's address names: ?ex=, else the worked example, the sheets. */
export function exampleOf(params: URLSearchParams): Example {
  const ex = params.get("ex");
  return isExample(ex) ? ex : "sheets";
}

/** An example's file in a language (docs/example/faces.py writes the table from the files). */
export const exampleZip = (ex: Example, lang: Lang): string => EXAMPLE_FILES[ex][lang].zip;
