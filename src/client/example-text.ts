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
    lede: "How the number-line quiz was made, from the exercise sheets to the class, with everything to try the same on your own AI.",
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
    runH: "Try it",
    runP: "Start this quiz as if you had opened its file on the start page: you choose how it is played, on your own, with friends or for a class.",
    start: "Start this quiz",
    runNote: "On your own, it stays in this browser. With friends or a class, it runs on this site like any quiz.",
    translated: "The example was tested in all four of the site's languages and works in each. So that it is the same example in each, the German, French and Italian pages show this run, made in English, translated.",
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
    convoP: "Die Fotos und drei Anfragen an die KI. Ihre erste Antwort war ein Quiz; die zweite Anfrage hat es geändert; die dritte wollte eine Vorschau der Bildschirme. Claude (Sonnet) in der kostenlosen Version, 4. November 2026.",
    convoAlt: "Das Gespräch, als Bild",
    readAll: "Das ganze Gespräch lesen ›",
    quizH: "Das Quiz",
    quizP: "Was die KI geliefert hat: eine .zip-Datei mit dem Quiz und seinen Bildern.",
    runH: "Ausprobieren",
    runP: "Starte dieses Quiz, als hättest du seine Datei auf der Startseite geöffnet: Du wählst, wie es gespielt wird, allein, mit Freunden oder mit einer Klasse.",
    start: "Dieses Quiz starten",
    runNote: "Allein bleibt es in diesem Browser. Mit Freunden oder einer Klasse läuft es auf dieser Seite wie jedes Quiz.",
    translated: "Das Beispiel wurde in allen vier Sprachen der Seite getestet und funktioniert in jeder. Damit es überall dasselbe Beispiel ist, zeigen die deutsche, die französische und die italienische Seite diesen Durchlauf, der auf Englisch gemacht wurde, in Übersetzung.",
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
    convoP: "Les photos et trois demandes à l'IA. Sa première réponse était un quiz ; la deuxième demande l'a modifié ; la troisième demandait un aperçu des écrans. Claude (Sonnet), version gratuite, 4 novembre 2026.",
    convoAlt: "La conversation, en image",
    readAll: "Lire toute la conversation ›",
    quizH: "Le quiz",
    quizP: "Ce que l'IA a fourni : un fichier .zip avec le quiz et ses images.",
    runH: "Le lancer",
    runP: "Lancez ce quiz comme si vous aviez ouvert son fichier sur la page d'accueil : vous choisissez comment y jouer, en solo, entre amis ou avec une classe.",
    start: "Lancer ce quiz",
    runNote: "En solo, il reste dans ce navigateur. Entre amis ou avec une classe, il fonctionne sur ce site comme n'importe quel quiz.",
    translated: "L'exemple a été testé dans les quatre langues du site et fonctionne dans chacune. Pour que ce soit le même exemple partout, les pages en allemand, en français et en italien montrent la traduction de cet essai, réalisé en anglais.",
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
    convoP: "Le foto e tre richieste all'IA. La sua prima risposta era un quiz; la seconda richiesta l'ha modificato; la terza chiedeva un'anteprima delle schermate. Claude (Sonnet), versione gratuita, 4 novembre 2026.",
    convoAlt: "La conversazione, come immagine",
    readAll: "Leggi tutta la conversazione ›",
    quizH: "Il quiz",
    quizP: "Quello che l'IA ha fornito: un file .zip con il quiz e le sue immagini.",
    runH: "Provalo",
    runP: "Avvia questo quiz come se ne avessi aperto il file dalla pagina iniziale: scegli come giocarlo, per conto tuo, con gli amici o con una classe.",
    start: "Avvia questo quiz",
    runNote: "Per conto tuo, resta in questo browser. Con gli amici o con una classe funziona su questo sito come qualsiasi quiz.",
    translated: "L'esempio è stato provato in tutte e quattro le lingue del sito e funziona in ognuna. Perché sia lo stesso esempio ovunque, le pagine in tedesco, francese e italiano mostrano la traduzione di questa prova, fatta in inglese.",
  },
};

/**
 * The full example of the root page's "Idea" tab, the owner's space run (11 Nov 2026, German): what replaces the worked
 * example's words on /example?ex=idea. Nothing was attached, so the sheets' step goes, and the AI's overview of its
 * questions (its review.png) stands after the conversation.
 */
export interface IdeaText {
  lede: string;
  convoP: string;
  reviewH: string;
  reviewP: string;
  reviewAlt: string;
  readReview: string;
  quizP: string;
  translated: string;
}

export const IDEA_TEXT: Record<Lang, IdeaText> = {
  en: {
    lede: "How the space quiz was made, from one ask with nothing attached to the class, with everything to try the same on your own AI.",
    convoP: "One ask, nothing attached. The AI read the site, built the quiz with photographs it found and four drawings of its own, checked it and handed over the .zip, with an overview of every question. Claude, 11 November 2026.",
    reviewH: "The overview",
    reviewP: "Every question with its solution, as the AI drew them for checking the quiz before it is played.",
    reviewAlt: "Every question of the quiz with its solution, as a picture",
    readReview: "See the whole overview ›",
    quizP: "What the AI handed over: one .zip with the quiz and its 23 pictures.",
    translated: "The example was made in German. So that it is the same example in each language, the English, French and Italian pages show it translated: the conversation, the overview and the quiz.",
  },
  de: {
    lede: "Wie das Weltraum-Quiz entstanden ist, von einer einzigen Anfrage ohne Anhang bis zur Klasse – mit allem, was du brauchst, um dasselbe mit deiner eigenen KI auszuprobieren.",
    convoP: "Eine Anfrage, nichts angehängt. Die KI hat die Seite gelesen, das Quiz mit Fotos, die sie gefunden hat, und vier eigenen Zeichnungen gebaut, es geprüft und die .zip-Datei geliefert, dazu eine Übersicht aller Fragen. Claude, 11. November 2026.",
    reviewH: "Die Übersicht",
    reviewP: "Alle Fragen mit ihren Lösungen, wie die KI sie gezeichnet hat, um das Quiz vor dem Spielen zu prüfen.",
    reviewAlt: "Alle Fragen des Quiz mit ihren Lösungen, als Bild",
    readReview: "Die ganze Übersicht ansehen ›",
    quizP: "Was die KI geliefert hat: eine .zip-Datei mit dem Quiz und seinen 23 Bildern.",
    translated: "Das Beispiel ist auf Deutsch entstanden. Damit es in jeder Sprache dasselbe Beispiel ist, zeigen die englische, die französische und die italienische Seite es übersetzt: das Gespräch, die Übersicht und das Quiz.",
  },
  fr: {
    lede: "Comment le quiz sur l'espace a été créé, d'une seule demande sans pièce jointe jusqu'à la classe, avec tout ce qu'il faut pour refaire l'essai avec votre propre IA.",
    convoP: "Une demande, rien en pièce jointe. L'IA a lu le site, construit le quiz avec des photos qu'elle a trouvées et quatre dessins à elle, l'a vérifié et a fourni le .zip, avec un aperçu de toutes les questions. Claude, 11 novembre 2026.",
    reviewH: "L'aperçu",
    reviewP: "Toutes les questions avec leurs solutions, telles que l'IA les a dessinées pour vérifier le quiz avant d'y jouer.",
    reviewAlt: "Toutes les questions du quiz avec leurs solutions, en image",
    readReview: "Voir tout l'aperçu ›",
    quizP: "Ce que l'IA a fourni : un fichier .zip avec le quiz et ses 23 images.",
    translated: "L'exemple a été réalisé en allemand. Pour que ce soit le même exemple dans chaque langue, les pages en anglais, en français et en italien le montrent traduit : la conversation, l'aperçu et le quiz.",
  },
  it: {
    lede: "Come è nato il quiz sullo spazio, da un'unica richiesta senza allegati fino alla classe, con tutto il necessario per rifare la stessa prova con la tua IA.",
    convoP: "Una richiesta, niente in allegato. L'IA ha letto il sito, ha costruito il quiz con foto che ha trovato e quattro disegni suoi, l'ha verificato e ha fornito il file .zip, con una panoramica di tutte le domande. Claude, 11 novembre 2026.",
    reviewH: "La panoramica",
    reviewP: "Tutte le domande con le loro soluzioni, come l'IA le ha disegnate per verificare il quiz prima di giocarlo.",
    reviewAlt: "Tutte le domande del quiz con le loro soluzioni, come immagine",
    readReview: "Vedi tutta la panoramica ›",
    quizP: "Quello che l'IA ha fornito: un file .zip con il quiz e le sue 23 immagini.",
    translated: "L'esempio è nato in tedesco. Perché sia lo stesso esempio in ogni lingua, le pagine in inglese, francese e italiano lo mostrano tradotto: la conversazione, la panoramica e il quiz.",
  },
};

/** The root page's examples, in its tabs' order, each named by what the visitor starts from (docs/design/root-page.md, "Getting a quiz"). */
export const EXAMPLES = ["idea", "sheets", "notes", "test"] as const;
export type Example = (typeof EXAMPLES)[number];
export const isExample = (x: unknown): x is Example => EXAMPLES.includes(x as Example);

/** The examples whose runs are stand-ins (docs/example/mock_zips.py) until the owner's replace them (backlog, "The page for people", item 1). */
export const MOCKS = ["notes", "test"] as const;
export type Mock = (typeof MOCKS)[number];
export const isMock = (x: unknown): x is Mock => MOCKS.includes(x as Mock);

/** The example a page's address names: ?ex=, else the worked example, the sheets. */
export function exampleOf(params: URLSearchParams): Example {
  const ex = params.get("ex");
  return isExample(ex) ? ex : "sheets";
}

/** An example's file in a language (docs/example/faces.py writes the table from the files). */
export const exampleZip = (ex: Example, lang: Lang): string => EXAMPLE_FILES[ex][lang].zip;

/**
 * The full example of an example whose run is a mock (MOCKS): what replaces the worked example's sheets, conversation
 * and note on /example?ex=<example>. Made up, and said to be; it goes when the owner's runs bring the real ones.
 */
export interface MockText {
  attachedH: string;
  mockNote: string;
  /** What was handed over: the stand-in quizzes have no pictures. */
  quizP: string;
  lede: Record<Mock, string>;
  attached: Record<Mock, string>;
  reply: Record<Mock, string>;
}

export const MOCK_TEXT: Record<Lang, MockText> = {
  en: {
    attachedH: "What was attached",
    mockNote: "A stand-in: this example has had no run yet, so the conversation below is made up.",
    quizP: "What the AI handed over: one .zip with the quiz.",
    lede: { notes: "How the friends' quiz was made, from the class notes to playing it together.", test: "How the practice quiz was made, from the marked test to playing it alone." },
    attached: { notes: "A page of class notes, photographed with a phone.", test: "The marked test, photographed with a phone." },
    reply: {
      notes: "Here is your quiz: 6 questions on the French Revolution, from your notes. Open the .zip on the site; I haven't shown the questions here, so you can play along.",
      test: "Here is your practice quiz: 6 questions on the cell, most of them on what you got wrong. I've kept the questions out of this chat; open the .zip on the site.",
    },
  },
  de: {
    attachedH: "Was angehängt war",
    mockNote: "Ein Platzhalter: Zu diesem Beispiel gibt es noch keinen echten Durchgang, das Gespräch unten ist erfunden.",
    quizP: "Was die KI geliefert hat: eine .zip-Datei mit dem Quiz.",
    lede: { notes: "Wie das Quiz der Freunde entstand, von den Notizen bis zum gemeinsamen Spiel.", test: "Wie das Übungsquiz entstand, von der korrigierten Prüfung bis zum Spiel allein." },
    attached: { notes: "Eine Seite Notizen aus dem Unterricht, mit dem Handy fotografiert.", test: "Die korrigierte Prüfung, mit dem Handy fotografiert." },
    reply: {
      notes: "Hier ist euer Quiz: 6 Fragen zur Französischen Revolution, aus euren Notizen. Öffne die .zip-Datei auf der Website; die Fragen habe ich hier nicht gezeigt, damit du mitspielen kannst.",
      test: "Hier ist dein Übungsquiz: 6 Fragen zur Zelle, die meisten zu dem, was du falsch hattest. Die Fragen habe ich aus diesem Chat herausgehalten; öffne die .zip-Datei auf der Website.",
    },
  },
  fr: {
    attachedH: "Ce qui était joint",
    mockNote: "Un exemple provisoire : il n'a pas encore été essayé, la conversation ci-dessous est inventée.",
    quizP: "Ce que l'IA a fourni : un fichier .zip avec le quiz.",
    lede: { notes: "Comment le quiz entre amis a été fait, des notes de cours à la partie ensemble.", test: "Comment le quiz de révision a été fait, du contrôle corrigé à la partie en solo." },
    attached: { notes: "Une page de notes de cours, photographiée avec un téléphone.", test: "Le contrôle corrigé, photographié avec un téléphone." },
    reply: {
      notes: "Voici votre quiz : 6 questions sur la Révolution française, tirées de vos notes de cours. Ouvre le .zip sur le site ; je n'ai pas montré les questions ici, pour que tu puisses jouer aussi.",
      test: "Voici ton quiz de révision : 6 questions sur la cellule, surtout sur ce que tu as raté. J'ai gardé les questions hors de cette conversation ; ouvre le .zip sur le site.",
    },
  },
  it: {
    attachedH: "Che cosa era allegato",
    mockNote: "Un segnaposto: questo esempio non è ancora stato provato, la conversazione qui sotto è inventata.",
    quizP: "Quello che l'IA ha fornito: un file .zip con il quiz.",
    lede: { notes: "Come è nato il quiz tra amici, dagli appunti alla partita insieme.", test: "Come è nato il quiz di ripasso, dalla verifica corretta alla partita da solo." },
    attached: { notes: "Una pagina di appunti delle lezioni, fotografata con il telefono.", test: "La verifica corretta, fotografata con il telefono." },
    reply: {
      notes: "Ecco il vostro quiz: 6 domande sulla Rivoluzione francese, dai vostri appunti. Apri il .zip sul sito; qui non ho mostrato le domande, così puoi giocare anche tu.",
      test: "Ecco il tuo quiz di ripasso: 6 domande sulla cellula, soprattutto su quello che hai sbagliato. Ho tenuto le domande fuori da questa chat; apri il .zip sul sito.",
    },
  },
};
