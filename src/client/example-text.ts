// /example's words in the four languages (docs/design/example-page.md). The
// static HTML is English, so an AI's fetcher reads English; example.ts swaps
// these in. The header's words (code, join, language) are the root page's,
// from landing-text.ts. de, fr and it are drafts for the owner's review
// (docs/translation-review.md); the voice is the root page's.

import type { Lang } from "./landing-text.ts";
import { EXAMPLE_FILES } from "./example-files.ts";

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
  /** The overview, the AI's picture of every question with its solution (the sheets' and the idea's runs). */
  reviewH: string;
  reviewP: string;
  reviewAlt: string;
  readReview: string;
  quizH: string;
  quizP: string;
  runH: string;
  runP: string;
  start: string;
  runNote: string;
  /** Under the steps: the run's language, and the others translated, so the example is the same in every language. */
  translated: string;
}

export const EXAMPLE_TEXT: Record<Lang, ExampleText> = {
  en: {
    title: "The example, step by step · classyQuiz",
    h1: "The example, step by step",
    lede: "How the number-line quiz was made, from the exercise sheets to the class, with everything to try the same on your own AI.",
    sheetsH: "The exercise sheets",
    sheetsP: "Two maths sheets on number lines, in German, photographed with a phone.",
    photo1: "Photo of page 1",
    photo2: "Photo of page 2",
    dl1: "Photo, page 1 (.jpg)",
    dl2: "Photo, page 2 (.jpg)",
    dlPdf: "The sheets (.pdf)",
    convoH: "The conversation",
    convoP: "The photos and two asks. The AI read the site, made the quiz from exercises 1, 3 and 4, checked it with the site's format checker and handed over the .zip with an overview of every question; the second ask changed it. Claude (Sonnet), 19 November 2026.",
    convoAlt: "The conversation, as a picture",
    readAll: "Read the whole conversation ›",
    reviewH: "The overview",
    reviewP: "Every question with its solution, as the AI drew them for checking the quiz before it is played.",
    reviewAlt: "Every question of the quiz with its solution, as a picture",
    readReview: "See the whole overview ›",
    quizH: "The quiz",
    quizP: "What the AI handed over with its second answer: one .zip with the quiz and its 24 pictures.",
    runH: "Try it",
    runP: "Start this quiz as if you had opened its file on the start page: you choose how it is played, on your own, with friends or for a class.",
    start: "Start this quiz",
    runNote: "On your own, it stays in this browser. With friends or a class, it runs on this site like any quiz.",
    translated: "The example was made in German. So that it is the same example in each language, the English, French and Italian pages show it translated: the conversation, the overview and the quiz.",
  },
  de: {
    title: "Das Beispiel, Schritt für Schritt · classyQuiz",
    h1: "Das Beispiel, Schritt für Schritt",
    lede: "Wie das Quiz zum Zahlenstrahl entstanden ist, von den Arbeitsblättern bis zur Klasse – mit allem, was du brauchst, um dasselbe mit deiner eigenen KI auszuprobieren.",
    sheetsH: "Die Arbeitsblätter",
    sheetsP: "Zwei Mathe-Arbeitsblätter zum Zahlenstrahl, auf Deutsch, mit dem Handy fotografiert.",
    photo1: "Foto von Seite 1",
    photo2: "Foto von Seite 2",
    dl1: "Foto, Seite 1 (.jpg)",
    dl2: "Foto, Seite 2 (.jpg)",
    dlPdf: "Die Arbeitsblätter (.pdf)",
    convoH: "Das Gespräch",
    convoP: "Die Fotos und zwei Anfragen. Die KI hat die Seite gelesen, das Quiz aus den Aufgaben 1, 3 und 4 gemacht, es mit der Formatprüfung der Seite geprüft und die .zip-Datei mit einer Übersicht aller Fragen geliefert; die zweite Anfrage hat es geändert. Claude (Sonnet), 19. November 2026.",
    convoAlt: "Das Gespräch, als Bild",
    readAll: "Das ganze Gespräch lesen ›",
    reviewH: "Die Übersicht",
    reviewP: "Alle Fragen mit ihren Lösungen, wie die KI sie gezeichnet hat, um das Quiz vor dem Spielen zu prüfen.",
    reviewAlt: "Alle Fragen des Quiz mit ihren Lösungen, als Bild",
    readReview: "Die ganze Übersicht ansehen ›",
    quizH: "Das Quiz",
    quizP: "Was die KI mit ihrer zweiten Antwort geliefert hat: eine .zip-Datei mit dem Quiz und seinen 24 Bildern.",
    runH: "Ausprobieren",
    runP: "Starte dieses Quiz, als hättest du seine Datei auf der Startseite geöffnet: Du wählst, wie es gespielt wird, allein, mit Freunden oder mit einer Klasse.",
    start: "Dieses Quiz starten",
    runNote: "Allein bleibt es in diesem Browser. Mit Freunden oder einer Klasse läuft es auf dieser Seite wie jedes Quiz.",
    translated: "Das Beispiel ist auf Deutsch entstanden. Damit es in jeder Sprache dasselbe Beispiel ist, zeigen die englische, die französische und die italienische Seite es übersetzt: das Gespräch, die Übersicht und das Quiz.",
  },
  fr: {
    title: "L'exemple, pas à pas · classyQuiz",
    h1: "L'exemple, pas à pas",
    lede: "Comment le quiz sur la droite graduée a été créé, des fiches d'exercices jusqu'à la classe, avec tout ce qu'il faut pour refaire l'essai avec votre propre IA.",
    sheetsH: "Les fiches d'exercices",
    sheetsP: "Deux fiches de maths sur la droite graduée, en allemand, photographiées avec un téléphone.",
    photo1: "Photo de la page 1",
    photo2: "Photo de la page 2",
    dl1: "Photo, page 1 (.jpg)",
    dl2: "Photo, page 2 (.jpg)",
    dlPdf: "Les fiches (.pdf)",
    convoH: "La conversation",
    convoP: "Les photos et deux demandes. L'IA a lu le site, fait le quiz à partir des exercices 1, 3 et 4, l'a vérifié avec le vérificateur de format du site et a fourni le .zip avec un aperçu de toutes les questions ; la deuxième demande l'a modifié. Claude (Sonnet), 19 novembre 2026.",
    convoAlt: "La conversation, en image",
    readAll: "Lire toute la conversation ›",
    reviewH: "L'aperçu",
    reviewP: "Toutes les questions avec leurs solutions, telles que l'IA les a dessinées pour vérifier le quiz avant d'y jouer.",
    reviewAlt: "Toutes les questions du quiz avec leurs solutions, en image",
    readReview: "Voir tout l'aperçu ›",
    quizH: "Le quiz",
    quizP: "Ce que l'IA a fourni avec sa deuxième réponse : un fichier .zip avec le quiz et ses 24 images.",
    runH: "Le lancer",
    runP: "Lancez ce quiz comme si vous aviez ouvert son fichier sur la page d'accueil : vous choisissez comment y jouer, en solo, entre amis ou avec une classe.",
    start: "Lancer ce quiz",
    runNote: "En solo, il reste dans ce navigateur. Entre amis ou avec une classe, il fonctionne sur ce site comme n'importe quel quiz.",
    translated: "L'exemple a été réalisé en allemand. Pour que ce soit le même exemple dans chaque langue, les pages en anglais, en français et en italien le montrent traduit : la conversation, l'aperçu et le quiz.",
  },
  it: {
    title: "L'esempio, passo per passo · classyQuiz",
    h1: "L'esempio, passo per passo",
    lede: "Come è nato il quiz sulla retta numerica, dalle schede di esercizi alla classe, con tutto il necessario per rifare la stessa prova con la tua IA.",
    sheetsH: "Le schede di esercizi",
    sheetsP: "Due schede di matematica sulla retta numerica, in tedesco, fotografate con il telefono.",
    photo1: "Foto della pagina 1",
    photo2: "Foto della pagina 2",
    dl1: "Foto, pagina 1 (.jpg)",
    dl2: "Foto, pagina 2 (.jpg)",
    dlPdf: "Le schede (.pdf)",
    convoH: "La conversazione",
    convoP: "Le foto e due richieste. L'IA ha letto il sito, ha fatto il quiz dagli esercizi 1, 3 e 4, l'ha verificato con il controllo del formato del sito e ha fornito il file .zip con una panoramica di tutte le domande; la seconda richiesta l'ha modificato. Claude (Sonnet), 19 novembre 2026.",
    convoAlt: "La conversazione, come immagine",
    readAll: "Leggi tutta la conversazione ›",
    reviewH: "La panoramica",
    reviewP: "Tutte le domande con le loro soluzioni, come l'IA le ha disegnate per verificare il quiz prima di giocarlo.",
    reviewAlt: "Tutte le domande del quiz con le loro soluzioni, come immagine",
    readReview: "Vedi tutta la panoramica ›",
    quizH: "Il quiz",
    quizP: "Quello che l'IA ha fornito con la sua seconda risposta: un file .zip con il quiz e le sue 24 immagini.",
    runH: "Provalo",
    runP: "Avvia questo quiz come se ne avessi aperto il file dalla pagina iniziale: scegli come giocarlo, per conto tuo, con gli amici o con una classe.",
    start: "Avvia questo quiz",
    runNote: "Per conto tuo, resta in questo browser. Con gli amici o con una classe funziona su questo sito come qualsiasi quiz.",
    translated: "L'esempio è nato in tedesco. Perché sia lo stesso esempio in ogni lingua, le pagine in inglese, francese e italiano lo mostrano tradotto: la conversazione, la panoramica e il quiz.",
  },
};

/**
 * The full example of the root page's "Idea" tab, the owner's space run (11 Nov 2026, German): what replaces the worked
 * example's words on /example?ex=idea. Nothing was attached, so the sheets' step goes; the overview and the note under
 * the steps are the worked example's words, both runs having been made in German with an overview handed over.
 */
export interface IdeaText {
  lede: string;
  convoP: string;
  quizP: string;
}

export const IDEA_TEXT: Record<Lang, IdeaText> = {
  en: {
    lede: "How the space quiz was made, from one ask with nothing attached to the class, with everything to try the same on your own AI.",
    convoP: "One ask, nothing attached. The AI read the site, built the quiz with photographs it found and four drawings of its own, checked it and handed over the .zip, with an overview of every question. Claude, 11 November 2026.",
    quizP: "What the AI handed over: one .zip with the quiz and its 23 pictures.",
  },
  de: {
    lede: "Wie das Weltraum-Quiz entstanden ist, von einer einzigen Anfrage ohne Anhang bis zur Klasse – mit allem, was du brauchst, um dasselbe mit deiner eigenen KI auszuprobieren.",
    convoP: "Eine Anfrage, nichts angehängt. Die KI hat die Seite gelesen, das Quiz mit Fotos, die sie gefunden hat, und vier eigenen Zeichnungen gebaut, es geprüft und die .zip-Datei geliefert, dazu eine Übersicht aller Fragen. Claude, 11. November 2026.",
    quizP: "Was die KI geliefert hat: eine .zip-Datei mit dem Quiz und seinen 23 Bildern.",
  },
  fr: {
    lede: "Comment le quiz sur l'espace a été créé, d'une seule demande sans pièce jointe jusqu'à la classe, avec tout ce qu'il faut pour refaire l'essai avec votre propre IA.",
    convoP: "Une demande, rien en pièce jointe. L'IA a lu le site, construit le quiz avec des photos qu'elle a trouvées et quatre dessins à elle, l'a vérifié et a fourni le .zip, avec un aperçu de toutes les questions. Claude, 11 novembre 2026.",
    quizP: "Ce que l'IA a fourni : un fichier .zip avec le quiz et ses 23 images.",
  },
  it: {
    lede: "Come è nato il quiz sullo spazio, da un'unica richiesta senza allegati fino alla classe, con tutto il necessario per rifare la stessa prova con la tua IA.",
    convoP: "Una richiesta, niente in allegato. L'IA ha letto il sito, ha costruito il quiz con foto che ha trovato e quattro disegni suoi, l'ha verificato e ha fornito il file .zip, con una panoramica di tutte le domande. Claude, 11 novembre 2026.",
    quizP: "Quello che l'IA ha fornito: un file .zip con il quiz e le sue 23 immagini.",
  },
};

/**
 * The full example of the root page's "Notes" tab, the owner's notes run (12 Nov 2026, English, the class notes attached
 * as a PDF): what replaces the worked example's words on /example?ex=notes. The notes' two pages stand where the sheets'
 * photographs do. TEST_TEXT uses this shape too, because the test example also has an attached PDF of two pages.
 */
export interface NotesText {
  lede: string;
  notesH: string;
  notesP: string;
  /** A page's picture, its accessible name: {n} is the page. */
  page: string;
  dlPdf: string;
  convoP: string;
  quizP: string;
  translated: string;
}

export const NOTES_TEXT: Record<Lang, NotesText> = {
  en: {
    lede: "How the friends' quiz was made, from the class notes to playing it together, with everything to try the same on your own AI.",
    notesH: "The class notes",
    notesP: "Two pages of history notes on the French Revolution, as a PDF.",
    page: "Page {n} of the notes",
    dlPdf: "The notes (.pdf)",
    convoP: "The notes and one ask. The AI read the site, wrote the quiz from the notes, checked it with the site's format checker and handed over the .zip, without showing the questions to someone who plays too. Claude (Sonnet), 12 November 2026.",
    quizP: "What the AI handed over: one .zip with the quiz.",
    translated: "The example was made in English. So that it is the same example in each language, the German, French and Italian pages show it translated: the notes, the conversation and the quiz.",
  },
  de: {
    lede: "Wie das Quiz der Freunde entstanden ist, von den Notizen bis zum gemeinsamen Spiel – mit allem, was du brauchst, um dasselbe mit deiner eigenen KI auszuprobieren.",
    notesH: "Die Notizen",
    notesP: "Zwei Seiten Geschichtsnotizen zur Französischen Revolution, als PDF.",
    page: "Seite {n} der Notizen",
    dlPdf: "Die Notizen (.pdf)",
    convoP: "Die Notizen und eine Anfrage. Die KI hat die Seite gelesen, das Quiz aus den Notizen geschrieben, es mit der Formatprüfung der Seite geprüft und die .zip-Datei geliefert, ohne die Fragen jemandem zu zeigen, der mitspielt. Claude (Sonnet), 12. November 2026.",
    quizP: "Was die KI geliefert hat: eine .zip-Datei mit dem Quiz.",
    translated: "Das Beispiel ist auf Englisch entstanden. Damit es in jeder Sprache dasselbe Beispiel ist, zeigen die deutsche, die französische und die italienische Seite es übersetzt: die Notizen, das Gespräch und das Quiz.",
  },
  fr: {
    lede: "Comment le quiz entre amis a été créé, des notes de cours jusqu'à la partie ensemble, avec tout ce qu'il faut pour refaire l'essai avec votre propre IA.",
    notesH: "Les notes de cours",
    notesP: "Deux pages de notes d'histoire sur la Révolution française, en PDF.",
    page: "Page {n} des notes",
    dlPdf: "Les notes (.pdf)",
    convoP: "Les notes et une demande. L'IA a lu le site, écrit le quiz à partir des notes, l'a vérifié avec le vérificateur de format du site et a fourni le .zip, sans montrer les questions à qui joue aussi. Claude (Sonnet), 12 novembre 2026.",
    quizP: "Ce que l'IA a fourni : un fichier .zip avec le quiz.",
    translated: "L'exemple a été réalisé en anglais. Pour que ce soit le même exemple dans chaque langue, les pages en allemand, en français et en italien le montrent traduit : les notes, la conversation et le quiz.",
  },
  it: {
    lede: "Come è nato il quiz tra amici, dagli appunti alla partita insieme, con tutto il necessario per rifare la stessa prova con la tua IA.",
    notesH: "Gli appunti",
    notesP: "Due pagine di appunti di storia sulla Rivoluzione francese, in PDF.",
    page: "Pagina {n} degli appunti",
    dlPdf: "Gli appunti (.pdf)",
    convoP: "Gli appunti e una richiesta. L'IA ha letto il sito, ha scritto il quiz dagli appunti, l'ha verificato con il controllo del formato del sito e ha fornito il file .zip, senza mostrare le domande a chi gioca anche lui. Claude (Sonnet), 12 novembre 2026.",
    quizP: "Quello che l'IA ha fornito: un file .zip con il quiz.",
    translated: "L'esempio è nato in inglese. Perché sia lo stesso esempio in ogni lingua, le pagine in tedesco, francese e italiano lo mostrano tradotto: gli appunti, la conversazione e il quiz.",
  },
};

/**
 * The words of /example?ex=test, the page for the root page's "Test" tab. They replace the words of the sheets example.
 * The page shows the owner's test run (19 Nov 2026, French) with the marked test attached as a PDF. That test was
 * written for the example (docs/example/test_sheet.py), and the page tells the visitor so.
 */
export const TEST_TEXT: Record<Lang, NotesText> = {
  en: {
    lede: "How the practice quiz was made, from the marked test to playing it alone. Everything you need to try the same with your own AI is on this page.",
    notesH: "The marked test",
    notesP: "Two pages of a biology test on the cell, with a pupil's answers and the teacher's marks, as a PDF. The test was written for this example, so that no real pupil's work is shown.",
    page: "Page {n} of the test",
    dlPdf: "The test (.pdf)",
    convoP: "One message with the test attached. The AI read the test and the site, wrote a quiz that focuses on the wrong answers and drew two pictures for it. It checked the file and handed over the .zip without showing the questions, because the person who asked plays the quiz. Claude (Opus), 19 November 2026.",
    quizP: "The AI handed over one .zip file with the quiz and its two pictures.",
    translated: "This example was made in French. The English, German and Italian pages show a translation of the test, the conversation and the quiz, so that every language shows the same example.",
  },
  de: {
    lede: "So ist das Übungsquiz entstanden, von der korrigierten Prüfung bis zum Spielen allein. Auf dieser Seite findest du alles, um dasselbe mit deiner eigenen KI auszuprobieren.",
    notesH: "Die korrigierte Prüfung",
    notesP: "Zwei Seiten einer Biologieprüfung zur Zelle, mit den Antworten einer Schülerin und den Korrekturen der Lehrperson, als PDF. Die Prüfung wurde für dieses Beispiel geschrieben, damit keine echte Schülerarbeit gezeigt wird.",
    page: "Seite {n} der Prüfung",
    dlPdf: "Die Prüfung (.pdf)",
    convoP: "Eine Nachricht mit der Prüfung im Anhang. Die KI hat die Prüfung und die Seite gelesen, ein Quiz vor allem zu den falschen Antworten geschrieben und zwei Bilder dafür gezeichnet. Sie hat die Datei geprüft und die .zip-Datei geliefert, ohne die Fragen zu zeigen, weil die fragende Person das Quiz selbst spielt. Claude (Opus), 19. November 2026.",
    quizP: "Die KI hat eine .zip-Datei mit dem Quiz und seinen zwei Bildern geliefert.",
    translated: "Dieses Beispiel ist auf Französisch entstanden. Die englische, die deutsche und die italienische Seite zeigen die Prüfung, das Gespräch und das Quiz übersetzt, damit jede Sprache dasselbe Beispiel zeigt.",
  },
  fr: {
    lede: "Voici comment le quiz de révision a été créé, du contrôle corrigé jusqu'à la partie en solo. Cette page contient tout ce qu'il faut pour refaire l'essai avec votre propre IA.",
    notesH: "Le contrôle corrigé",
    notesP: "Deux pages d'un contrôle de SVT sur la cellule, avec les réponses d'une élève et les corrections du professeur, en PDF. Le contrôle a été écrit pour cet exemple, afin de ne montrer le travail d'aucun élève réel.",
    page: "Page {n} du contrôle",
    dlPdf: "Le contrôle (.pdf)",
    convoP: "Un message avec le contrôle en pièce jointe. L'IA a lu le contrôle et le site, a écrit un quiz centré sur les réponses fausses et a dessiné deux images pour ce quiz. Elle a vérifié le fichier et a fourni le .zip sans montrer les questions, parce que la personne qui demande joue elle-même. Claude (Opus), 19 novembre 2026.",
    quizP: "L'IA a fourni un fichier .zip avec le quiz et ses deux images.",
    translated: "Cet exemple a été réalisé en français. Les pages en anglais, en allemand et en italien montrent une traduction du contrôle, de la conversation et du quiz, pour que chaque langue montre le même exemple.",
  },
  it: {
    lede: "Ecco come è nato il quiz di ripasso, dalla verifica corretta fino a giocarlo per conto tuo. In questa pagina trovi tutto il necessario per rifare la stessa prova con la tua IA.",
    notesH: "La verifica corretta",
    notesP: "Due pagine di una verifica di scienze sulla cellula, con le risposte di un'alunna e le correzioni dell'insegnante, in PDF. La verifica è stata scritta per questo esempio, per non mostrare il lavoro di nessun alunno reale.",
    page: "Pagina {n} della verifica",
    dlPdf: "La verifica (.pdf)",
    convoP: "Un messaggio con la verifica in allegato. L'IA ha letto la verifica e il sito, ha scritto un quiz concentrato sulle risposte sbagliate e ha disegnato due immagini per il quiz. Ha controllato il file e ha fornito il file .zip senza mostrare le domande, perché chi ha fatto la richiesta gioca in prima persona. Claude (Opus), 19 novembre 2026.",
    quizP: "L'IA ha fornito un file .zip con il quiz e le sue due immagini.",
    translated: "Questo esempio è nato in francese. Le pagine in inglese, tedesco e italiano mostrano una traduzione della verifica, della conversazione e del quiz, così ogni lingua mostra lo stesso esempio.",
  },
};

/** The root page's examples, in its tabs' order, each named by what the visitor starts from (docs/design/root-page.md, "Getting a quiz"). */
export const EXAMPLES = ["idea", "sheets", "notes", "test"] as const;
export type Example = (typeof EXAMPLES)[number];
export const isExample = (x: unknown): x is Example => EXAMPLES.includes(x as Example);

/** The example a page's address names: ?ex=, else the worked example, the sheets. */
export function exampleOf(params: URLSearchParams): Example {
  const ex = params.get("ex");
  return isExample(ex) ? ex : "sheets";
}

/** An example's file in a language (docs/example/faces.py writes the table from the files). */
export const exampleZip = (ex: Example, lang: Lang): string => EXAMPLE_FILES[ex][lang].zip;
