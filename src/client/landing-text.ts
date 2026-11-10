// The landing block's words in the four languages it speaks (docs/design/root-page.md,
// "Languages"): everything above About. The static HTML is English, so an AI's fetcher
// reads English; home.ts swaps these in. About and below stay English: they
// are for the AI. The lobby, the wall, the Remote and the tablets stay
// English too.
//
// How the page addresses teachers: commands only for what must be done (choosing an AI, asking it), advice as
// advice, and no claim that isn't true. That is the page's voice to its
// reader; the example ask is the teacher's own sentence to their AI, where an
// imperative is fine (docs/design/guidance-page.md, "Information in place of
// rules"). Step 1's detail names what is
// verified, with its tier and date. German, French and Italian say the same
// in their own sentences, the commands in each language's form and a noun
// where a pronoun could point at two things (docs/design/root-page.md,
// "Languages"; the choices: docs/translation-review.md).
//
// The example asks are each language's version of the same ask; the marked
// parts carry the labels. The chess ask is a description with no sheets, close
// to the words of its run. The asks to practise alone, with friends and for a
// training session are the other ways to play, in the words of whoever asks;
// the two who play say so, which the guidance's "When the user will play the
// quiz" answers. They have had no run, so no line names an AI under them
// (docs/design/root-page.md, "Build: two steps"). The open ask has nothing
// decided: the open request; that the AI then asks what it needs is the
// guidance's "Build with the user". The site's address in every ask is
// replaced by the one the browser opened.

import type { SiteFull } from "../shared/limits.ts";

export type Lang = "de" | "en" | "fr" | "it";
export const LANGS: { id: Lang; name: string }[] = [
  { id: "de", name: "Deutsch" },
  { id: "en", name: "English" },
  { id: "fr", name: "Français" },
  { id: "it", name: "Italiano" },
];

/** A run of the example ask; `l` is the index of its label. */
export type AskPart = { s: string; l?: number };

export interface Text {
  code: string;
  join: string;
  language: string;
  /** The film's accessible name (its stage), in the place the strip had: what it shows, and that it has no sound. */
  film: string;
  /** The film's ▶, on the stage and on its bar. */
  play: string;
  /** The bar's play button while the film plays. */
  pause: string;
  /** The bar's speed button (1×, ½×, ¼×). */
  speed: string;
  /** The film's time bar. */
  seek: string;
  /** The name of the replay icon on the film's end card, once it has played to the end: from the start again. */
  again: string;
  /** The name of the film's full screen button, a toggle (aria-pressed says whether it is on). */
  full: string;
  /** The link under the film, to the worked example (/example). */
  see: string;
  /** The page's first sentence, its h1: what the site does for whoever reads it (docs/design/root-page.md, "What this is"). */
  what: string;
  /**
   * The three ways a quiz is played here, a picture each. The names are the
   * local check's cards' in every language (Quizmaster, Peers, Solo:
   * client/entries.ts), written in the page; these are what each is, in the
   * visitor's words, after the name (docs/design/root-page.md, "The ways to play").
   */
  wayQuizmaster: string;
  wayPeers: string;
  waySolo: string;
  /** What each way's picture shows (docs/ways/README.md), its accessible name. */
  picQuizmaster: string;
  picPeers: string;
  picSolo: string;
  /** The first of the two steps: its heading, over the example ask. */
  getH: string;
  /** Under the ask: that a file comes back, before the example's file name. */
  gives: string;
  /** From the first step down to "How to ask". */
  more: string;
  /** Under the box that opens a file: the example quiz, for whoever has none yet (docs/design/local-check.md). */
  noQuiz: string;
  tryIt: string;
  /** The film's heading, where it stands for whoever wants to find out more. */
  filmH: string;
  /** "How to ask": which AI, the address, the example asks. */
  howH: string;
  /** Where the part for people ends: what a person can count on, and that the manual for AIs follows. */
  relyH: string;
  relyFree: string;
  relyKept: string;
  relyOpen: string;
  manual: string;
  /** The film's chapters, named over its time bar while it is moved and in the bar's spoken value (docs/film/build/film.js). */
  capSheet: string;
  capAi: string;
  /** The .zip going up to the site, the film's third chapter. */
  capZip: string;
  capWall: string;
  capTap: string;
  /** The second step's heading: for whoever has the quiz their AI made (docs/design/root-page.md, "Two steps"). */
  run: string;
  /** The button that opens the file picker: what it opens. */
  upload: string;
  step1: string;
  step1detail: string;
  step2: string;
  /** The example asks' tabs, in words short enough for six to stand in three rows on a phone: by what the visitor brings and who plays. */
  tabSheets: string;
  tabChess: string;
  tabSolo: string;
  tabFriends: string;
  tabGroup: string;
  tabOpen: string;
  ask: AskPart[];
  labels: string[];
  /** The chess ask, and which AI answered it (its run: design/guidance-page.md). */
  askChess: string;
  chessWho: string;
  /** Practising alone, playing with friends, a training session run on a big screen: no run behind them, so no line under them. */
  askSolo: string;
  askFriends: string;
  askGroup: string;
  /** The ask with nothing decided. */
  ask2: string;
  copy: string;
  copied: string;
  drop: string;
  zipOnly: string;
  notText: string;
  notFile: (what: "several" | "this" | string) => string;
  unreadable: string;
  /** The quiz couldn't be passed to the local check: the browser keeps no site data (client/handoff.ts). */
  noHandoff: string;
  tooLong: (kb: number) => string;
  reading: string;
  preparing: (done: number, of: number) => string;
  sending: string;
  picturesHead: string;
  quizHead: string;
  aiFixes: string;
  copyForAi: string;
  without: string;
  notTaken: string;
  /** An upload refused: full is the cap reached (uploads a day: back at `at`; bytes stored: as quizzes end or expire). */
  siteFull: (full: SiteFull, at: string | null) => string;
  /** at: the time the allowance comes back, in Swiss time; null when the browser has no time zones (then 00:00 UTC). */
  quota: (at: string | null) => string;
  ownCopyLink: string;
  /** The upload's request failed: the network names itself as a possible cause (docs/design/root-page.md, "Network help, where failure shows"). */
  offline: string;
  whatToTellIt: string;
  notStarted: string;
  question: (n: number, total: number) => string;
  finalRanking: string;
  back: string;
  /** The code others join with, on the resume card: the screens' "Join code", for a class, a group or friends. */
  joinCode: string;
  otherDevice: (code: string) => string;
  untitled: string;
  ownCopy: (n: number) => string;
  how: string;
}

const en: Text = {
  code: "Code",
  join: "Join",
  language: "Language",
  film: "From an exercise sheet to the class: a film without sound",
  play: "Play",
  pause: "Pause",
  speed: "Speed",
  seek: "Time in the film",
  again: "Play again",
  full: "Full screen",
  see: "The example, step by step ›",
  what: "Here you play quizzes your own AI makes from your sheets, notes or ideas.",
  wayQuizmaster: "for a class or a group, on a big screen",
  wayPeers: "with friends, each on their own device",
  waySolo: "on your own, to practise or review",
  picQuizmaster: "A teacher at the big screen with the question, a phone in her hand; the class answers on tablets.",
  picPeers: "Three friends on a sofa in the evening, each with the question on their own phone, one of them laughing.",
  picSolo: "Someone alone at a desk with their notes, the question on their phone, the answer just found right.",
  getH: "Ask your AI for a quiz",
  gives: "The AI's answer:",
  more: "How to ask your AI ↓",
  noQuiz: "No quiz yet?",
  tryIt: "Play the example ›",
  filmH: "From the exercise sheet to the class playing, in one minute",
  howH: "How to ask your AI",
  relyH: "What you can count on",
  relyFree: "Free, without accounts or sign-up.",
  relyKept: "Played on your own, a quiz never leaves your browser. Played in a room, a quiz is deleted when the room is ended, or three hours after its last use. The .zip is your lasting copy.",
  relyOpen: "The code is open:",
  manual: "The rest of this page is the manual for AIs, in English: what your AI reads when you give it this address. You are welcome to read it too.",
  capSheet: "Your exercise sheets",
  capAi: "Your AI",
  capZip: "The .zip, opened here",
  capWall: "What the class sees",
  capTap: "Each student taps",
  step1: "Choose any good AI.",
  step1detail: "Free Claude Sonnet wrote the example above, 4 Nov 2026: the one free AI that does this reliably.",
  step2: "Ask the AI to build you a quiz for",
  tabSheets: "Exercise sheets",
  tabChess: "A description",
  tabSolo: "On your own",
  tabFriends: "With friends",
  tabGroup: "A training session",
  tabOpen: "Nothing decided yet",
  ask: [
    { s: "Read " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Can you make me a classyQuiz with exercises " },
    { s: "like no. 1, 3 and 4", l: 1 },
    { s: " from these two sheets? " },
    { s: "For my 5th grade class", l: 2 },
    { s: ", " },
    { s: "about 10 questions", l: 3 },
    { s: ", " },
    { s: "in English", l: 4 },
    { s: "." },
  ],
  labels: ["this site", "which exercises", "your class", "how many", "which language"],
  askChess: "Read classyquiz.pages.dev. Please make me a classyQuiz for chess: 8-year-olds, 400–500 Elo, just 5 questions. Find some rated puzzles. I'll give them time to look at each question before I reveal the choices and start the countdown. Choices can be in chess notation, but without + or mate, which would make it too easy. Don't forget to say whose turn it is. For the last question, give them 2 similar positions to choose from, one promising, one winning. In English. What do you need?",
  chessWho: "Claude Opus 5.5, paid plan, 5 Nov 2026",
  askSolo: "Read classyquiz.pages.dev. My biology test on Friday is about the cell. Here are my notes. Can you make me a classyQuiz to practise with, about 20 questions? I'll play it myself, so please keep the questions and answers to yourself.",
  askFriends: "Read classyquiz.pages.dev. Make us a classyQuiz for our games night: 15 questions on films from the 90s, some easy, some hard. I'm playing too, so don't show me the questions.",
  askGroup: "Read classyquiz.pages.dev. Tomorrow I'm training 25 new colleagues on our safety rules. The slides are attached. Can you make me a classyQuiz for the end of the session, on the big screen, about 10 questions?",
  ask2: "Read classyquiz.pages.dev. I need a classyQuiz. Help?",
  copy: "Copy",
  copied: "Copied",
  run: "Open the quiz your AI made",
  upload: "Choose the .zip file",
  drop: "or drop it here",
  zipOnly: "Your AI can make the quiz as one .zip file, to download from the chat and open here.",
  notText: "The site takes the quiz as a .zip file, not as text.",
  notFile: (w) => `The site takes the quiz as a .zip file, not ${w === "several" ? "several files at once" : w === "this" ? "this file" : `a .${w} file`}.`,
  unreadable: "The file couldn't be read.",
  noHandoff: "This browser didn't let the site open the quiz (it may block site data). Try another browser.",
  tooLong: (kb) => `The quiz text is longer than the site takes (at most ${kb} KB).`,
  reading: "Reading the quiz…",
  preparing: (d, o) => `Preparing the pictures… ${d} of ${o}`,
  sending: "Sending the quiz…",
  picturesHead: "Some pictures can't go up with the quiz:",
  quizHead: "The site can't run this quiz yet:",
  aiFixes: "Your AI can fix this. Copy the message into the chat, and open the .zip it sends back.",
  copyForAi: "Copy the message for your AI",
  without: "Continue without these pictures",
  notTaken: "The site couldn't take the quiz. Try again.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `The free site has no room for another quiz right now. It takes one again once others have ended or expired (three hours after their last use).`
      : `The free site can't take more quizzes today. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`,
  quota: (at) => `The free site has used up today's allowance. It works again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`,
  ownCopyLink: "More quizzes: a site of your own, your school's or your company's ›",
  offline: "No connection to the site. Check the network and try again. If it stays like this, the network of a school or a company may block the site.",
  whatToTellIt: "What to tell IT ›",
  notStarted: "before the first question",
  question: (n, t) => `question ${n} of ${t}`,
  finalRanking: "final ranking",
  back: "Back to the quiz ▶",
  joinCode: "Join code",
  otherDevice: (c) => `On another device: type <b>${c}</b> in the code box.`,
  untitled: "Your quiz",
  ownCopy: (n) => `On ${n === 1 ? "one" : n} of the last 30 days this shared site was full or busy. For more quizzes, a site of your own, your school's or your company's:`,
  how: "how ›",
};

const de: Text = {
  code: "Code",
  join: "Beitreten",
  language: "Sprache",
  film: "Vom Arbeitsblatt zur Klasse: ein Film ohne Ton",
  play: "Abspielen",
  pause: "Pause",
  speed: "Tempo",
  seek: "Position im Film",
  again: "Nochmals abspielen",
  full: "Vollbild",
  see: "Das Beispiel Schritt für Schritt ›",
  what: "Hier spielst du Quiz, die deine KI aus deinen Blättern, Notizen oder Ideen macht.",
  wayQuizmaster: "für eine Klasse oder Gruppe, am Grossbildschirm",
  wayPeers: "mit Freunden, alle am eigenen Gerät",
  waySolo: "für dich allein, zum Üben oder Wiederholen",
  picQuizmaster: "Eine Lehrerin am grossen Bildschirm mit der Frage, das Handy in der Hand; die Klasse antwortet auf Tablets.",
  picPeers: "Drei Freunde abends auf dem Sofa, alle mit der Frage auf dem eigenen Handy, einer lacht.",
  picSolo: "Jemand allein am Schreibtisch mit Notizen, die Frage auf dem Handy, eben richtig beantwortet.",
  getH: "Frag deine KI nach einem Quiz",
  gives: "Die Antwort der KI:",
  more: "So fragst du deine KI ↓",
  noQuiz: "Noch kein Quiz?",
  tryIt: "Das Beispiel spielen ›",
  filmH: "Vom Arbeitsblatt zur spielenden Klasse, in einer Minute",
  howH: "So fragst du deine KI",
  relyH: "Worauf du zählen kannst",
  relyFree: "Kostenlos, ohne Konto und ohne Anmeldung.",
  relyKept: "Spielst du allein, verlässt das Quiz deinen Browser nie. Spielen mehrere, wird das Quiz gelöscht, sobald es beendet ist, spätestens aber drei Stunden nach der letzten Benutzung. Deine bleibende Kopie ist die .zip-Datei.",
  relyOpen: "Der Code ist offen:",
  manual: "Der Rest dieser Seite ist das Handbuch für KIs, auf Englisch: was deine KI liest, wenn du ihr diese Adresse gibst. Du darfst es gern auch lesen.",
  capSheet: "Deine Arbeitsblätter",
  capAi: "Deine KI",
  capZip: "Die .zip-Datei, hier geöffnet",
  capWall: "Was die Klasse sieht",
  capTap: "Jedes Kind tippt",
  step1: "Wähle eine gute KI.",
  step1detail: "Das Beispiel oben stammt vom kostenlosen Claude Sonnet, 4. Nov. 2026, der einzigen kostenlosen KI, die das zuverlässig kann.",
  step2: "Frag die KI nach einem Quiz für",
  tabSheets: "Arbeitsblätter",
  tabChess: "Eine Beschreibung",
  tabSolo: "Für dich allein",
  tabFriends: "Mit Freunden",
  tabGroup: "Eine Schulung",
  tabOpen: "Noch nichts entschieden",
  ask: [
    { s: "Lies " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Kannst du mir ein classyQuiz mit Aufgaben " },
    { s: "wie Nr. 1, 3 und 4", l: 1 },
    { s: " auf diesen zwei Blättern machen? " },
    { s: "Für meine 5. Klasse", l: 2 },
    { s: ", " },
    { s: "etwa 10 Fragen", l: 3 },
    { s: ", " },
    { s: "auf Deutsch", l: 4 },
    { s: "." },
  ],
  labels: ["diese Seite", "welche Aufgaben", "deine Klasse", "wie viele", "welche Sprache"],
  askChess: "Lies classyquiz.pages.dev. Mach mir bitte ein classyQuiz zum Thema Schach: 8-Jährige, 400–500 Elo, nur 5 Fragen. Such dafür Puzzles mit Elo-Wertung heraus. Ich lasse ihnen bei jeder Frage Zeit zum Anschauen, bevor ich die Optionen zeige und den Countdown starte. Die Optionen dürfen in Schachnotation sein, aber ohne + oder Matt, das wäre zu einfach. Vergiss nicht zu sagen, wer am Zug ist. Bei der letzten Frage gib ihnen 2 ähnliche Stellungen zur Auswahl, eine aussichtsreiche und eine gewonnene. Auf Deutsch. Was brauchst du?",
  chessWho: "Claude Opus 5.5, bezahltes Abo, 5. Nov. 2026",
  askSolo: "Lies classyquiz.pages.dev. Am Freitag habe ich eine Biologieprüfung über die Zelle. Hier sind meine Notizen. Kannst du mir ein classyQuiz zum Üben machen, etwa 20 Fragen? Ich spiele es selbst, also behalte die Fragen und Antworten bitte für dich.",
  askFriends: "Lies classyquiz.pages.dev. Mach uns ein classyQuiz für unseren Spieleabend: 15 Fragen zu Filmen aus den 90ern, ein paar leichte, ein paar schwere. Ich spiele mit, also zeig mir die Fragen nicht.",
  askGroup: "Lies classyquiz.pages.dev. Morgen schule ich 25 neue Kolleginnen und Kollegen zu unseren Sicherheitsregeln. Die Folien sind angehängt. Kannst du mir ein classyQuiz für den Schluss der Schulung machen, auf dem grossen Bildschirm, etwa 10 Fragen?",
  ask2: "Lies classyquiz.pages.dev. Ich brauche ein classyQuiz. Hilfst du mir?",
  copy: "Kopieren",
  copied: "Kopiert",
  run: "Öffne das Quiz deiner KI",
  upload: ".zip-Datei auswählen",
  drop: "oder hier ablegen",
  zipOnly: "Deine KI kann das Quiz als eine einzige .zip-Datei liefern: Du lädst sie im Chat herunter und öffnest sie hier.",
  notText: "Die Seite braucht das Quiz als .zip-Datei, nicht als Text.",
  notFile: (w) =>
    w === "several"
      ? "Die Seite braucht das Quiz als eine einzige .zip-Datei, nicht als mehrere Dateien."
      : w === "this"
        ? "Die Seite braucht das Quiz als .zip-Datei, und diese Datei ist keine."
        : `Die Seite braucht das Quiz als .zip-Datei, nicht als .${w}-Datei.`,
  unreadable: "Die Datei liess sich nicht lesen.",
  noHandoff: "Dieser Browser hat verhindert, dass die Seite das Quiz öffnet (vielleicht blockiert er Website-Daten). Versuch es mit einem anderen Browser.",
  tooLong: (kb) => `Der Quiztext ist zu lang: Die Seite nimmt höchstens ${kb} KB an.`,
  reading: "Das Quiz wird gelesen…",
  preparing: (d, o) => `Die Bilder werden vorbereitet… ${d} von ${o}`,
  sending: "Das Quiz wird gesendet…",
  picturesHead: "Einige Bilder können nicht mit dem Quiz hochgeladen werden:",
  quizHead: "Dieses Quiz kann die Seite noch nicht spielen:",
  aiFixes: "Deine KI kann das beheben: Kopier die Nachricht in den Chat und öffne hier die neue .zip-Datei, die zurückkommt.",
  copyForAi: "Nachricht für deine KI kopieren",
  without: "Ohne diese Bilder fortfahren",
  notTaken: "Die Seite konnte das Quiz nicht annehmen. Versuch es nochmals.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Die Gratis-Seite hat im Moment keinen Platz für ein weiteres Quiz. Sie nimmt wieder eines an, sobald andere beendet oder abgelaufen sind (drei Stunden nach ihrer letzten Benutzung).`
      : `Die Gratis-Seite kann heute keine Quiz mehr annehmen. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} nimmt sie wieder neue an.`,
  quota: (at) => `Die Gratis-Seite hat ihr Tageskontingent aufgebraucht. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} funktioniert sie wieder.`,
  ownCopyLink: "Mehr Quiz: eine eigene Seite für dich, deine Schule oder deine Firma ›",
  offline: "Keine Verbindung zur Seite. Prüf die Internetverbindung und versuch es nochmals. Klappt es weiterhin nicht, sperrt vielleicht das Netz einer Schule oder Firma die Seite.",
  whatToTellIt: "Was du der IT sagen kannst ›",
  notStarted: "vor der ersten Frage",
  question: (n, t) => `Frage ${n} von ${t}`,
  finalRanking: "Schlussrangliste",
  back: "Zurück zum Quiz ▶",
  joinCode: "Code zum Beitreten",
  otherDevice: (c) => `Auf einem anderen Gerät: <b>${c}</b> ins Codefeld eingeben.`,
  untitled: "Dein Quiz",
  ownCopy: (n) => `An ${n === 1 ? "einem" : n} der letzten 30 Tage war diese gemeinsam genutzte Seite voll oder stark ausgelastet. Mehr Quiz gibt es mit einer eigenen Seite für dich, deine Schule oder deine Firma:`,
  how: "So geht's ›",
};

const fr: Text = {
  code: "Code",
  join: "Rejoindre",
  language: "Langue",
  film: "De la fiche d'exercices à la classe : une vidéo sans son",
  play: "Lire",
  pause: "Pause",
  speed: "Vitesse",
  seek: "Position dans la vidéo",
  again: "Revoir",
  full: "Plein écran",
  see: "L'exemple pas à pas ›",
  what: "Ici, vous jouez aux quiz que votre propre IA crée à partir de vos fiches, notes ou idées.",
  wayQuizmaster: "pour une classe ou un groupe, sur grand écran",
  wayPeers: "entre amis, chacun sur son appareil",
  waySolo: "en solo, pour vous exercer ou réviser",
  picQuizmaster: "Une enseignante devant le grand écran avec la question, le téléphone à la main ; la classe répond sur des tablettes.",
  picPeers: "Trois amis sur un canapé le soir, chacun avec la question sur son téléphone, l'un d'eux rit.",
  picSolo: "Une personne seule à son bureau avec ses notes, la question sur son téléphone, la bonne réponse tout juste trouvée.",
  getH: "Demandez un quiz à votre IA",
  gives: "La réponse de l'IA :",
  more: "Comment demander à votre IA ↓",
  noQuiz: "Pas encore de quiz ?",
  tryIt: "Essayer l'exemple ›",
  filmH: "De la fiche d'exercices à la classe qui joue, en une minute",
  howH: "Comment demander à votre IA",
  relyH: "Ce sur quoi vous pouvez compter",
  relyFree: "Gratuit, sans compte ni inscription.",
  relyKept: "En solo, le quiz ne quitte jamais votre navigateur. À plusieurs, le quiz est supprimé dès qu'il est terminé, au plus tard trois heures après sa dernière utilisation. Le fichier .zip reste votre copie durable.",
  relyOpen: "Le code est ouvert :",
  manual: "Le reste de cette page est le manuel pour les IA, en anglais : ce que lit votre IA quand vous lui donnez cette adresse. Vous pouvez le lire vous aussi.",
  capSheet: "Vos fiches d'exercices",
  capAi: "Votre IA",
  capZip: "Le .zip, ouvert ici",
  capWall: "Ce que voit la classe",
  capTap: "Chaque élève répond",
  step1: "Choisissez une bonne IA.",
  step1detail: "L'exemple ci-dessus a été écrit par la version gratuite de Claude Sonnet, le 4 nov. 2026 : la seule IA gratuite à le faire de façon fiable.",
  step2: "Demandez à l'IA un quiz pour",
  tabSheets: "Fiches d'exercices",
  tabChess: "Une description",
  tabSolo: "En solo",
  tabFriends: "Entre amis",
  tabGroup: "Une formation",
  tabOpen: "Encore rien de décidé",
  ask: [
    { s: "Lis " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Tu peux me faire un classyQuiz avec des exercices " },
    { s: "comme les n° 1, 3 et 4", l: 1 },
    { s: " de ces deux fiches ? " },
    { s: "Pour ma classe de CM2", l: 2 },
    { s: ", " },
    { s: "une dizaine de questions", l: 3 },
    { s: ", " },
    { s: "en français", l: 4 },
    { s: "." },
  ],
  labels: ["ce site", "quels exercices", "votre classe", "combien", "quelle langue"],
  askChess: "Lis classyquiz.pages.dev. Fais-moi un classyQuiz d'échecs, s'il te plaît : des enfants de 8 ans, 400–500 Elo, 5 questions seulement. Trouve des problèmes avec un classement Elo. Je leur laisse le temps de regarder chaque question avant d'afficher les propositions et de lancer le compte à rebours. Les propositions peuvent être en notation échiquéenne, mais sans + ni mat, ce serait trop facile. N'oublie pas de dire qui a le trait. Pour la dernière question, donne-leur le choix entre 2 positions semblables, l'une prometteuse, l'autre gagnante. En français. De quoi as-tu besoin ?",
  chessWho: "Claude Opus 5.5, abonnement payant, 5 nov. 2026",
  askSolo: "Lis classyquiz.pages.dev. J'ai un contrôle de biologie vendredi sur la cellule. Voici mes notes. Tu peux me faire un classyQuiz pour réviser, une vingtaine de questions ? J'y jouerai moi-même, alors garde les questions et les réponses pour toi.",
  askFriends: "Lis classyquiz.pages.dev. Fais-nous un classyQuiz pour notre soirée jeux : 15 questions sur les films des années 90, des faciles et des difficiles. Je joue aussi, alors ne me montre pas les questions.",
  askGroup: "Lis classyquiz.pages.dev. Demain, je forme 25 nouveaux collègues à nos règles de sécurité. Les diapositives sont jointes. Tu peux me faire un classyQuiz pour la fin de la séance, sur le grand écran, une dizaine de questions ?",
  ask2: "Lis classyquiz.pages.dev. J'ai besoin d'un classyQuiz. Tu m'aides ?",
  copy: "Copier",
  copied: "Copié",
  run: "Ouvrez le quiz de votre IA",
  upload: "Choisir le fichier .zip",
  drop: "ou déposez-le ici",
  zipOnly: "Votre IA peut fournir le quiz en un seul fichier .zip, à télécharger depuis le chat puis à ouvrir ici.",
  notText: "Le site attend le quiz sous forme de fichier .zip, pas de texte.",
  notFile: (w) =>
    w === "several"
      ? "Le site attend le quiz sous forme d'un seul fichier .zip, pas de plusieurs fichiers."
      : w === "this"
        ? "Le site attend le quiz sous forme de fichier .zip, et ce fichier n'en est pas un."
        : `Le site attend le quiz sous forme de fichier .zip, pas de fichier .${w}.`,
  unreadable: "Impossible de lire le fichier.",
  noHandoff: "Ce navigateur a empêché le site d'ouvrir le quiz (il bloque peut-être les données des sites). Essayez un autre navigateur.",
  tooLong: (kb) => `Le texte du quiz dépasse la limite du site (${kb} Ko au plus).`,
  reading: "Lecture du quiz…",
  preparing: (d, o) => `Préparation des images… ${d} sur ${o}`,
  sending: "Envoi du quiz…",
  picturesHead: "Certaines images ne peuvent pas être envoyées avec le quiz :",
  quizHead: "Le site ne peut pas encore lancer ce quiz :",
  aiFixes: "Votre IA peut corriger cela. Copiez le message dans le chat, puis ouvrez ici le .zip qu'elle vous renvoie.",
  copyForAi: "Copier le message pour votre IA",
  without: "Continuer sans ces images",
  notTaken: "Le site n'a pas pu recevoir le quiz. Réessayez.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Le site gratuit n'a plus de place pour un nouveau quiz pour l'instant. De la place se libère dès que d'autres quiz sont terminés ou ont expiré (trois heures après leur dernière utilisation).`
      : `Le site gratuit n'accepte plus de nouveaux quiz aujourd'hui. Il en acceptera de nouveau à partir de ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  quota: (at) => `Le site gratuit a épuisé son quota du jour. Il sera de nouveau disponible à partir de ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  ownCopyLink: "Plus de quiz : un site à vous, à votre école ou à votre entreprise ›",
  offline: "Impossible de se connecter au site. Vérifiez la connexion et réessayez. Si le problème persiste, le réseau d'une école ou d'une entreprise bloque peut-être le site.",
  whatToTellIt: "Que dire au service informatique ›",
  notStarted: "avant la première question",
  question: (n, t) => `question ${n} sur ${t}`,
  finalRanking: "classement final",
  back: "Retour au quiz ▶",
  joinCode: "Code pour rejoindre",
  otherDevice: (c) => `Sur un autre appareil : tapez <b>${c}</b> dans le champ Code.`,
  untitled: "Votre quiz",
  ownCopy: (n) => `Sur les 30 derniers jours, ce site partagé a été complet ou très chargé ${n === 1 ? "un jour" : `${n} jours`}. Pour plus de quiz, un site à vous, à votre école ou à votre entreprise :`,
  how: "comment ›",
};

const it: Text = {
  code: "Codice",
  join: "Entra",
  language: "Lingua",
  film: "Dalla scheda di esercizi alla classe: un video senza audio",
  play: "Riproduci",
  pause: "Pausa",
  speed: "Velocità",
  seek: "Posizione nel video",
  again: "Rivedi",
  full: "Schermo intero",
  see: "L'esempio passo per passo ›",
  what: "Qui giochi ai quiz che la tua IA crea dalle tue schede, dai tuoi appunti o dalle tue idee.",
  wayQuizmaster: "per una classe o un gruppo, sul grande schermo",
  wayPeers: "con gli amici, ognuno sul suo dispositivo",
  waySolo: "per conto tuo, per esercitarti o ripassare",
  picQuizmaster: "Un'insegnante al grande schermo con la domanda, il telefono in mano; la classe risponde sui tablet.",
  picPeers: "Tre amici sul divano di sera, ognuno con la domanda sul proprio telefono, uno di loro ride.",
  picSolo: "Una persona sola alla scrivania con i suoi appunti, la domanda sul telefono, la risposta giusta appena trovata.",
  getH: "Chiedi un quiz alla tua IA",
  gives: "La risposta dell'IA:",
  more: "Come chiedere alla tua IA ↓",
  noQuiz: "Ancora nessun quiz?",
  tryIt: "Prova l'esempio ›",
  filmH: "Dalla scheda alla classe che gioca, in un minuto",
  howH: "Come chiedere alla tua IA",
  relyH: "Su cosa puoi contare",
  relyFree: "Gratuito, senza account né registrazione.",
  relyKept: "Se giochi per conto tuo, il quiz non lascia mai il tuo browser. Se si gioca in gruppo, il quiz viene eliminato appena è finito, al più tardi tre ore dopo l'ultimo uso. Il file .zip resta la tua copia.",
  relyOpen: "Il codice è aperto:",
  manual: "Il resto di questa pagina è il manuale per le IA, in inglese: quello che legge la tua IA quando le dai questo indirizzo. Puoi leggerlo anche tu.",
  capSheet: "Le tue schede",
  capAi: "La tua IA",
  capZip: "Il file .zip, aperto qui",
  capWall: "Cosa vede la classe",
  capTap: "Ogni alunno risponde",
  step1: "Scegli una buona IA.",
  step1detail: "L'esempio qui sopra l'ha scritto la versione gratuita di Claude Sonnet, il 4 nov. 2026: l'unica IA gratuita che ci riesce in modo affidabile.",
  step2: "Chiedi all'IA un quiz per",
  tabSheets: "Schede di esercizi",
  tabChess: "Una descrizione",
  tabSolo: "Per conto tuo",
  tabFriends: "Con gli amici",
  tabGroup: "Una formazione",
  tabOpen: "Ancora niente di deciso",
  ask: [
    { s: "Leggi " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Mi puoi fare un classyQuiz con esercizi " },
    { s: "come i n. 1, 3 e 4", l: 1 },
    { s: " di queste due schede? " },
    { s: "Per la mia quinta elementare", l: 2 },
    { s: ", " },
    { s: "una decina di domande", l: 3 },
    { s: ", " },
    { s: "in italiano", l: 4 },
    { s: "." },
  ],
  labels: ["questo sito", "quali esercizi", "la tua classe", "quante", "quale lingua"],
  askChess: "Leggi classyquiz.pages.dev. Fammi un classyQuiz di scacchi, per favore: bambini di 8 anni, 400–500 Elo, solo 5 domande. Cerca dei problemi con un punteggio Elo. A ogni domanda lascio loro il tempo di guardarla prima di mostrare le opzioni e avviare il conto alla rovescia. Le opzioni possono essere in notazione scacchistica, ma senza + né matto, altrimenti sarebbe troppo facile. Non dimenticare di dire a chi tocca muovere. Per l'ultima domanda dai loro 2 posizioni simili tra cui scegliere, una promettente e una vincente. In italiano. Di cosa hai bisogno?",
  chessWho: "Claude Opus 5.5, abbonamento a pagamento, 5 nov. 2026",
  askSolo: "Leggi classyquiz.pages.dev. Venerdì ho una verifica di biologia sulla cellula. Ecco i miei appunti. Mi fai un classyQuiz per esercitarmi, una ventina di domande? Ci gioco io, quindi tieni per te le domande e le risposte.",
  askFriends: "Leggi classyquiz.pages.dev. Facci un classyQuiz per la nostra serata giochi: 15 domande sui film degli anni '90, alcune facili, altre difficili. Gioco anch'io, quindi non mostrarmi le domande.",
  askGroup: "Leggi classyquiz.pages.dev. Domani faccio una formazione sulle nostre norme di sicurezza a 25 nuovi colleghi. Le slide sono allegate. Mi fai un classyQuiz per la fine della sessione, sul grande schermo, una decina di domande?",
  ask2: "Leggi classyquiz.pages.dev. Mi serve un classyQuiz. Mi aiuti?",
  copy: "Copia",
  copied: "Copiato",
  run: "Apri il quiz della tua IA",
  upload: "Scegli il file .zip",
  drop: "o trascinalo qui",
  zipOnly: "La tua IA può preparare il quiz in un unico file .zip, da scaricare dalla chat e aprire qui.",
  notText: "Il sito accetta il quiz come file .zip, non come testo.",
  notFile: (w) =>
    w === "several"
      ? "Il sito accetta il quiz come un unico file .zip, non come più file."
      : w === "this"
        ? "Il sito accetta il quiz come file .zip, e questo file non lo è."
        : `Il sito accetta il quiz come file .zip, non come file .${w}.`,
  unreadable: "Non è stato possibile leggere il file.",
  noHandoff: "Questo browser ha impedito al sito di aprire il quiz (forse blocca i dati dei siti). Prova con un altro browser.",
  tooLong: (kb) => `Il testo del quiz supera il limite del sito (al massimo ${kb} KB).`,
  reading: "Lettura del quiz…",
  preparing: (d, o) => `Preparazione delle immagini… ${d} di ${o}`,
  sending: "Invio del quiz…",
  picturesHead: "Alcune immagini non si possono inviare con il quiz:",
  quizHead: "Il sito non può ancora avviare questo quiz:",
  aiFixes: "La tua IA può correggere il problema. Copia il messaggio nella chat e apri qui il file .zip che ti rimanda.",
  copyForAi: "Copia il messaggio per la tua IA",
  without: "Continua senza queste immagini",
  notTaken: "Il sito non è riuscito a ricevere il quiz. Riprova.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Al momento il sito gratuito non ha spazio per un altro quiz. Ne accetterà di nuovo quando altri quiz saranno terminati o scaduti (tre ore dopo il loro ultimo uso).`
      : `Per oggi il sito gratuito non può accettare altri quiz. Ne accetta di nuovo dalle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  quota: (at) => `Il sito gratuito ha esaurito la quota giornaliera. Torna a funzionare dalle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  ownCopyLink: "Più quiz: un sito tuo, della tua scuola o della tua azienda ›",
  offline: "Impossibile collegarsi al sito. Controlla la connessione e riprova. Se il problema persiste, forse la rete di una scuola o di un'azienda blocca il sito.",
  whatToTellIt: "Cosa dire al servizio informatico ›",
  notStarted: "in attesa della prima domanda",
  question: (n, t) => `domanda ${n} di ${t}`,
  finalRanking: "classifica finale",
  back: "Torna al quiz ▶",
  joinCode: "Codice per entrare",
  otherDevice: (c) => `Su un altro dispositivo: digita <b>${c}</b> nel campo Codice.`,
  untitled: "Il tuo quiz",
  ownCopy: (n) => `In ${n === 1 ? "uno" : n} degli ultimi 30 giorni questo sito condiviso era pieno o molto carico. Per più quiz, un sito tuo, della tua scuola o della tua azienda:`,
  how: "come ›",
};

export const TEXT: Record<Lang, Text> = { de, en, fr, it };

/** The example asks as plain text, for checking the labelled parts and the address. */
export function askText(t: Text): string {
  return t.ask.map((p) => p.s).join("");
}

export const LANG_KEY = "cq.lang";

export function isLang(x: unknown): x is Lang {
  return x === "de" || x === "en" || x === "fr" || x === "it";
}

/** A choice made on this device, else the browser's first language among the four, else English. */
export function chosenLang(saved: unknown, browser: readonly string[]): Lang {
  if (isLang(saved)) return saved;
  for (const l of browser) {
    const two = (l ?? "").slice(0, 2).toLowerCase();
    if (isLang(two)) return two;
  }
  return "en";
}
