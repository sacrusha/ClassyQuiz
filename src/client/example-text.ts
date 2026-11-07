// /example's words in the four languages (docs/design/example-page.md). The
// static HTML is English, so an AI's fetcher reads English; example.ts swaps
// these in. The header's words (code, join, language) are the root page's,
// from landing-text.ts. de, fr and it are drafts for the owner's review
// (docs/translation-review.md); the voice is the root page's.

import type { Lang } from "./landing-text.ts";

export interface ExampleText {
  title: string;
  h1: string;
  lede: string;
  sheetsH: string;
  sheetsP: string;
  photo1: string;
  photo2: string;
  dl1: string;
  dl2: string;
  dlPdf: string;
  convoH: string;
  convoP: string;
  convoAlt: string;
  readAll: string;
  quizH: string;
  quizP: string;
  runH: string;
  runP: string;
  start: string;
  runNote: string;
  /** Under the steps: one run, translated, so the example is the same in every language. */
  translated: string;
}

export const EXAMPLE_TEXT: Record<Lang, ExampleText> = {
  en: {
    title: "The example, step by step · classyQuiz",
    h1: "The example, step by step",
    lede: "How the example quiz was made, from the exercise sheets to the class, with everything to try the same on your own AI.",
    sheetsH: "The exercise sheets",
    sheetsP: "Two maths sheets on number lines, in German, photographed with a phone.",
    photo1: "Photo of page 1",
    photo2: "Photo of page 2",
    dl1: "Photo, page 1 (.jpg)",
    dl2: "Photo, page 2 (.jpg)",
    dlPdf: "The sheets (.pdf)",
    convoH: "The conversation",
    convoP: "The photos and three asks to the AI. Its first answer was a quiz; the second ask changed it; the third asked for a preview of the screens. Free Claude (Sonnet), 4 November 2026.",
    convoAlt: "The conversation, as a picture",
    readAll: "Read the whole conversation ›",
    quizH: "The quiz",
    quizP: "What the AI handed over: one .zip with the quiz and its pictures.",
    runH: "Run it",
    runP: "Start the example as if you had uploaded it: you check its questions, then let the class in with a code.",
    start: "Start the example quiz",
    runNote: "It runs on this site like any quiz, on the projector and on your students' devices.",
    translated: "The example was tested in all four of the site's languages and works in each. So that it is the same example in each, the German, French and Italian pages show this run, made in English, translated.",
  },
  de: {
    title: "Das Beispiel, Schritt für Schritt · classyQuiz",
    h1: "Das Beispiel, Schritt für Schritt",
    lede: "Wie das Beispiel-Quiz entstanden ist, von den Arbeitsblättern bis zur Klasse – mit allem, was du brauchst, um dasselbe mit deiner eigenen KI auszuprobieren.",
    sheetsH: "Die Arbeitsblätter",
    sheetsP: "Zwei Mathe-Arbeitsblätter zum Zahlenstrahl, auf Deutsch, mit dem Handy fotografiert.",
    photo1: "Foto von Seite 1",
    photo2: "Foto von Seite 2",
    dl1: "Foto, Seite 1 (.jpg)",
    dl2: "Foto, Seite 2 (.jpg)",
    dlPdf: "Die Arbeitsblätter (.pdf)",
    convoH: "Das Gespräch",
    convoP: "Die Fotos und drei Anfragen an die KI. Ihre erste Antwort war ein Quiz; die zweite Anfrage hat es geändert; die dritte wollte eine Vorschau der Bildschirme. Claude (Sonnet) in der kostenlosen Version, 4. November 2026.",
    convoAlt: "Das Gespräch, als Bild",
    readAll: "Das ganze Gespräch lesen ›",
    quizH: "Das Quiz",
    quizP: "Was die KI geliefert hat: eine .zip-Datei mit dem Quiz und seinen Bildern.",
    runH: "Ausprobieren",
    runP: "Starte das Beispiel, als hättest du es hochgeladen: Du prüfst seine Fragen und lässt dann die Klasse mit einem Code herein.",
    start: "Beispiel-Quiz starten",
    runNote: "Es läuft auf dieser Seite wie jedes Quiz, auf dem Beamer und auf den Geräten der Kinder.",
    translated: "Das Beispiel wurde in allen vier Sprachen der Seite getestet und funktioniert in jeder. Damit es überall dasselbe Beispiel ist, zeigen die deutsche, die französische und die italienische Seite diesen Durchlauf, der auf Englisch gemacht wurde, in Übersetzung.",
  },
  fr: {
    title: "L’exemple, pas à pas · classyQuiz",
    h1: "L’exemple, pas à pas",
    lede: "Comment le quiz d’exemple a été créé, des fiches d’exercices jusqu’à la classe, avec tout ce qu’il faut pour refaire l’essai avec votre propre IA.",
    sheetsH: "Les fiches d’exercices",
    sheetsP: "Deux fiches de maths sur la droite graduée, en allemand, photographiées avec un téléphone.",
    photo1: "Photo de la page 1",
    photo2: "Photo de la page 2",
    dl1: "Photo, page 1 (.jpg)",
    dl2: "Photo, page 2 (.jpg)",
    dlPdf: "Les fiches (.pdf)",
    convoH: "La conversation",
    convoP: "Les photos et trois demandes à l’IA. Sa première réponse était un quiz ; la deuxième demande l’a modifié ; la troisième demandait un aperçu des écrans. Claude (Sonnet), version gratuite, 4 novembre 2026.",
    convoAlt: "La conversation, en image",
    readAll: "Lire toute la conversation ›",
    quizH: "Le quiz",
    quizP: "Ce que l’IA a fourni : un fichier .zip avec le quiz et ses images.",
    runH: "Le lancer",
    runP: "Lancez l’exemple comme si vous l’aviez importé : vous vérifiez ses questions, puis vous faites entrer la classe avec un code.",
    start: "Lancer le quiz d’exemple",
    runNote: "Il fonctionne sur ce site comme n’importe quel quiz, au projecteur et sur les appareils de vos élèves.",
    translated: "L’exemple a été testé dans les quatre langues du site et fonctionne dans chacune. Pour que ce soit le même exemple partout, les pages en allemand, en français et en italien montrent la traduction de cet essai, réalisé en anglais.",
  },
  it: {
    title: "L’esempio, passo per passo · classyQuiz",
    h1: "L’esempio, passo per passo",
    lede: "Come è nato il quiz d’esempio, dalle schede di esercizi alla classe, con tutto il necessario per rifare la stessa prova con la tua IA.",
    sheetsH: "Le schede di esercizi",
    sheetsP: "Due schede di matematica sulla retta numerica, in tedesco, fotografate con il telefono.",
    photo1: "Foto della pagina 1",
    photo2: "Foto della pagina 2",
    dl1: "Foto, pagina 1 (.jpg)",
    dl2: "Foto, pagina 2 (.jpg)",
    dlPdf: "Le schede (.pdf)",
    convoH: "La conversazione",
    convoP: "Le foto e tre richieste all’IA. La sua prima risposta era un quiz; la seconda richiesta l’ha modificato; la terza chiedeva un’anteprima delle schermate. Claude (Sonnet), versione gratuita, 4 novembre 2026.",
    convoAlt: "La conversazione, come immagine",
    readAll: "Leggi tutta la conversazione ›",
    quizH: "Il quiz",
    quizP: "Quello che l’IA ha fornito: un file .zip con il quiz e le sue immagini.",
    runH: "Provalo",
    runP: "Avvia l’esempio come se lo avessi caricato tu: controlli le domande, poi fai entrare la classe con un codice.",
    start: "Avvia il quiz d’esempio",
    runNote: "Funziona su questo sito come qualsiasi quiz, sul proiettore e sui dispositivi dei tuoi alunni.",
    translated: "L’esempio è stato provato in tutte e quattro le lingue del sito e funziona in ognuna. Perché sia lo stesso esempio ovunque, le pagine in tedesco, francese e italiano mostrano la traduzione di questa prova, fatta in inglese.",
  },
};

/** The example's quiz per language: big-numbers-quiz.zip, translated (docs/example/quiz_zips.py); home.ts runs the same files for /?example=<lang>. */
export const EXAMPLE_ZIP: Record<Lang, string> = {
  en: "big-numbers-quiz.zip",
  de: "grosse-zahlen-quiz.zip",
  fr: "quiz-grands-nombres.zip",
  it: "quiz-grandi-numeri.zip",
};
