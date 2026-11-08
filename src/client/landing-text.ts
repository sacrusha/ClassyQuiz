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
// verified, with its tier and date.
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
  see: string;
  /** The film's chapters, named over its time bar while it is moved and in the bar's spoken value (docs/film/build/film.js). */
  capSheet: string;
  capAi: string;
  /** The .zip going up to the site, the film's third chapter. */
  capZip: string;
  capWall: string;
  capTap: string;
  build: string;
  step1: string;
  step1detail: string;
  step2: string;
  /** The example asks' tabs, by what the visitor brings and who plays: sheets, a description, practice alone, friends, a training session, nothing yet. */
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
  run: string;
  upload: string;
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
  capSheet: "Your exercise sheets",
  capAi: "Your AI",
  capZip: "The .zip, opened here",
  capWall: "What the class sees",
  capTap: "Each student taps",
  build: "Build a quiz",
  step1: "Choose any good AI.",
  step1detail: "Free Claude Sonnet wrote the example above, 4 Nov 2026: the one free AI that does this reliably.",
  step2: "Ask the AI to build you a quiz for",
  tabSheets: "With photos of exercise sheets",
  tabChess: "From a description: a chess quiz",
  tabSolo: "To practise on your own",
  tabFriends: "With friends, playing too",
  tabGroup: "For a group you lead: a training session",
  tabOpen: "With nothing decided yet",
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
  run: "Play a quiz",
  upload: "Open the quiz your AI made (.zip)",
  drop: "or drop it here",
  zipOnly: "Your AI can make the quiz as one .zip file, to download from the chat and open here.",
  notText: "The site takes the quiz as a .zip file, not as text.",
  notFile: (w) => `The site takes the quiz as a .zip file, not ${w === "several" ? "several files at once" : w === "this" ? "this file" : `a .${w} file`}.`,
  unreadable: "The file couldn't be read.",
  noHandoff: "This browser didn't let the site open the quiz (it may block site data). Try another browser.",
  tooLong: (kb) => `The quiz text is longer than the site takes (${kb} KB).`,
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
  ownCopyLink: "More quizzes: a site of your own or your school's ›",
  offline: "No connection to the site. Check the network and try again. If it stays like this, the network of a school or a company may block the site.",
  whatToTellIt: "What to tell IT ›",
  notStarted: "before the first question",
  question: (n, t) => `question ${n} of ${t}`,
  finalRanking: "final ranking",
  back: "Back to the quiz ▶",
  joinCode: "Join code",
  otherDevice: (c) => `On another device: type <b>${c}</b> in the code box.`,
  untitled: "Your quiz",
  ownCopy: (n) => `On ${n === 1 ? "one" : n} of the last 30 days this shared site was full or busy. For more quizzes, a site of your own or your school's:`,
  how: "how ›",
};

const de: Text = {
  code: "Code",
  join: "Beitreten",
  language: "Sprache",
  film: "Vom Aufgabenblatt bis zur Klasse: ein Film ohne Worte",
  play: "Abspielen",
  pause: "Pause",
  speed: "Tempo",
  seek: "Position im Film",
  again: "Nochmals abspielen",
  full: "Vollbild",
  see: "Das Beispiel Schritt für Schritt ›",
  capSheet: "Deine Aufgabenblätter",
  capAi: "Deine KI",
  capZip: "Die .zip, hier geöffnet",
  capWall: "Was die Klasse sieht",
  capTap: "Jedes Kind tippt",
  build: "Ein Quiz bauen",
  step1: "Wähle eine gute KI.",
  step1detail: "Das Beispiel oben hat das kostenlose Claude Sonnet geschrieben, 4. Nov. 2026: die eine kostenlose KI, die das zuverlässig kann.",
  step2: "Bitte die KI um ein Quiz für",
  tabSheets: "Mit Fotos von Aufgabenblättern",
  tabChess: "Aus einer Beschreibung: ein Schach-Quiz",
  tabSolo: "Zum Üben für dich allein",
  tabFriends: "Mit Freunden, du spielst mit",
  tabGroup: "Für eine Gruppe, die du leitest: eine Schulung",
  tabOpen: "Wenn noch nichts feststeht",
  ask: [
    { s: "Lies " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Kannst du mir ein classyQuiz machen, mit ähnlichen Aufgaben " },
    { s: "wie Nr. 1, 3 und 4", l: 1 },
    { s: " auf diesen zwei Blättern? " },
    { s: "Für meine 5. Klasse", l: 2 },
    { s: ", " },
    { s: "etwa 10 Fragen", l: 3 },
    { s: ", " },
    { s: "auf Deutsch", l: 4 },
    { s: "." },
  ],
  labels: ["diese Seite", "welche Aufgaben", "deine Klasse", "wie viele", "welche Sprache"],
  askChess: "Lies classyquiz.pages.dev. Bitte mach mir ein classyQuiz zu Schach: 8-Jährige, 400–500 Elo, nur 5 Fragen. Such dafür bewertete Puzzles. Ich lasse ihnen bei jeder Frage etwas Zeit, bevor ich die Antworten zeige und den Countdown starte. Die Antworten dürfen in Schachnotation sein, aber ohne + oder Matt, das wäre zu einfach. Vergiss nicht zu sagen, wer am Zug ist. Bei der letzten Frage gib ihnen 2 ähnliche Stellungen zur Wahl, eine aussichtsreich, eine gewinnend. Auf Deutsch. Was brauchst du?",
  chessWho: "Claude Opus 5.5, bezahltes Abo, 5. Nov. 2026",
  askSolo: "Lies classyquiz.pages.dev. Am Freitag habe ich eine Biologieprüfung über die Zelle. Hier sind meine Notizen. Kannst du mir ein classyQuiz zum Üben machen, etwa 20 Fragen? Ich spiele es selbst, also zeig mir bitte weder Fragen noch Antworten.",
  askFriends: "Lies classyquiz.pages.dev. Mach uns ein classyQuiz für unseren Spieleabend: 15 Fragen zu Filmen aus den 90ern, ein paar leichte, ein paar schwere. Ich spiele mit, also zeig mir die Fragen nicht.",
  askGroup: "Lies classyquiz.pages.dev. Morgen schule ich 25 neue Kolleginnen und Kollegen zu unseren Sicherheitsregeln. Die Folien sind angehängt. Kannst du mir ein classyQuiz für den Schluss machen, auf dem grossen Bildschirm, etwa 10 Fragen?",
  ask2: "Lies classyquiz.pages.dev. Ich brauche ein classyQuiz. Hilfst du mir?",
  copy: "Kopieren",
  copied: "Kopiert",
  run: "Ein Quiz starten",
  upload: "Das Quiz deiner KI öffnen (.zip)",
  drop: "oder hier ablegen",
  zipOnly: "Deine KI kann das Quiz als eine .zip-Datei machen, zum Herunterladen aus dem Chat und Öffnen hier.",
  notText: "Die Seite nimmt das Quiz als .zip-Datei, nicht als Text.",
  notFile: (w) => `Die Seite nimmt das Quiz als .zip-Datei, nicht ${w === "several" ? "mehrere Dateien auf einmal" : w === "this" ? "diese Datei" : `eine .${w}-Datei`}.`,
  unreadable: "Die Datei liess sich nicht lesen.",
  noHandoff: "Dieser Browser hat das Quiz nicht öffnen lassen (er blockiert vielleicht Website-Daten). Versuch es in einem anderen Browser.",
  tooLong: (kb) => `Der Quiztext ist länger, als die Seite nimmt (${kb} KB).`,
  reading: "Das Quiz wird gelesen…",
  preparing: (d, o) => `Die Bilder werden vorbereitet… ${d} von ${o}`,
  sending: "Das Quiz wird gesendet…",
  picturesHead: "Einige Bilder können nicht mit dem Quiz hochgeladen werden:",
  quizHead: "Dieses Quiz kann die Seite noch nicht spielen:",
  aiFixes: "Deine KI kann das beheben. Kopiere die Nachricht in den Chat und öffne die .zip, die sie zurückschickt.",
  copyForAi: "Nachricht für deine KI kopieren",
  without: "Ohne diese Bilder weiter",
  notTaken: "Die Seite konnte das Quiz nicht annehmen. Versuch es nochmals.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Die Gratis-Seite hat im Moment keinen Platz für ein weiteres Quiz. Es geht wieder, wenn andere Quiz beendet oder abgelaufen sind (drei Stunden nach der letzten Benutzung).`
      : `Die Gratis-Seite kann heute keine Quiz mehr annehmen. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} nimmt sie wieder neue.`,
  quota: (at) => `Die Gratis-Seite hat ihr Kontingent für heute aufgebraucht. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} geht sie wieder.`,
  ownCopyLink: "Mehr Quiz: eine eigene Seite oder eine der Schule ›",
  offline: "Keine Verbindung zur Seite. Prüf das Netz und versuch es nochmals. Bleibt es so, sperrt vielleicht das Netz einer Schule oder Firma die Seite.",
  whatToTellIt: "Was du der Schul-IT sagen kannst ›",
  notStarted: "vor der ersten Frage",
  question: (n, t) => `Frage ${n} von ${t}`,
  finalRanking: "Schlussrangliste",
  back: "Zurück zum Quiz ▶",
  joinCode: "Code zum Beitreten",
  otherDevice: (c) => `Auf einem anderen Gerät: <b>${c}</b> ins Code-Feld tippen.`,
  untitled: "Dein Quiz",
  ownCopy: (n) => `An ${n === 1 ? "einem" : n} der letzten 30 Tage war diese geteilte Seite voll oder stark ausgelastet. Für mehr Quiz eine eigene Seite oder eine der Schule:`,
  how: "wie ›",
};

const fr: Text = {
  code: "Code",
  join: "Rejoindre",
  language: "Langue",
  film: "De la fiche d'exercices à la classe : un film sans paroles",
  play: "Lire",
  pause: "Pause",
  speed: "Vitesse",
  seek: "Position dans le film",
  again: "Revoir",
  full: "Plein écran",
  see: "L'exemple pas à pas ›",
  capSheet: "Vos fiches d'exercices",
  capAi: "Votre IA",
  capZip: "Le .zip, ouvert ici",
  capWall: "Ce que voit la classe",
  capTap: "Chaque élève touche",
  build: "Créer un quiz",
  step1: "Choisissez une bonne IA.",
  step1detail: "L'exemple ci-dessus a été écrit par Claude Sonnet gratuit, le 4 nov. 2026 : la seule IA gratuite qui le fait de façon fiable.",
  step2: "Demandez à l'IA un quiz pour",
  tabSheets: "Avec les photos de fiches",
  tabChess: "D'après une description : un quiz d'échecs",
  tabSolo: "Pour réviser en solo",
  tabFriends: "Entre amis, en jouant aussi",
  tabGroup: "Pour un groupe que vous animez : une formation",
  tabOpen: "Sans rien avoir décidé",
  ask: [
    { s: "Lis " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Tu peux me faire un classyQuiz avec des exercices " },
    { s: "comme les n° 1, 3 et 4", l: 1 },
    { s: " de ces deux fiches ? " },
    { s: "Pour ma classe de CM2", l: 2 },
    { s: ", " },
    { s: "une dizaine de questions", l: 3 },
    { s: ", " },
    { s: "en français", l: 4 },
    { s: "." },
  ],
  labels: ["ce site", "quels exercices", "votre classe", "combien", "quelle langue"],
  askChess: "Lis classyquiz.pages.dev. Fais-moi un classyQuiz d'échecs, s'il te plaît : enfants de 8 ans, 400–500 Elo, 5 questions seulement. Prends des puzzles notés. Je leur laisse un peu de temps sur chaque question avant de montrer les choix et de lancer le compte à rebours. Les choix peuvent être en notation, mais sans + ni mat, ce serait trop facile. N'oublie pas de dire qui a le trait. Pour la dernière question, donne-leur 2 positions semblables au choix, l'une prometteuse, l'autre gagnante. En français. De quoi as-tu besoin ?",
  chessWho: "Claude Opus 5.5, abonnement payant, 5 nov. 2026",
  askSolo: "Lis classyquiz.pages.dev. J'ai un contrôle de biologie vendredi sur la cellule. Voici mes notes. Tu peux me faire un classyQuiz pour réviser, une vingtaine de questions ? J'y jouerai moi-même, alors garde les questions et les réponses pour toi.",
  askFriends: "Lis classyquiz.pages.dev. Fais-nous un classyQuiz pour notre soirée jeux : 15 questions sur les films des années 90, des faciles et des difficiles. Je joue aussi, alors ne me montre pas les questions.",
  askGroup: "Lis classyquiz.pages.dev. Demain, je forme 25 nouveaux collègues à nos règles de sécurité. Les diapositives sont jointes. Tu peux me faire un classyQuiz pour la fin de la séance, sur le grand écran, une dizaine de questions ?",
  ask2: "Lis classyquiz.pages.dev. J'ai besoin d'un classyQuiz. Tu m'aides ?",
  copy: "Copier",
  copied: "Copié",
  run: "Lancer un quiz",
  upload: "Ouvrir le quiz de votre IA (.zip)",
  drop: "ou déposez-le ici",
  zipOnly: "Votre IA peut faire le quiz en un seul fichier .zip, à télécharger depuis le chat et à ouvrir ici.",
  notText: "Le site prend le quiz en fichier .zip, pas en texte.",
  notFile: (w) => `Le site prend le quiz en fichier .zip, pas ${w === "several" ? "plusieurs fichiers à la fois" : w === "this" ? "ce fichier" : `un fichier .${w}`}.`,
  unreadable: "Le fichier n'a pas pu être lu.",
  noHandoff: "Ce navigateur n'a pas laissé le site ouvrir le quiz (il bloque peut-être les données de site). Essayez un autre navigateur.",
  tooLong: (kb) => `Le texte du quiz est plus long que ce que le site accepte (${kb} Ko).`,
  reading: "Lecture du quiz…",
  preparing: (d, o) => `Préparation des images… ${d} sur ${o}`,
  sending: "Envoi du quiz…",
  picturesHead: "Certaines images ne peuvent pas partir avec le quiz :",
  quizHead: "Le site ne peut pas encore lancer ce quiz :",
  aiFixes: "Votre IA peut corriger cela. Copiez le message dans le chat et ouvrez le .zip qu'elle renvoie.",
  copyForAi: "Copier le message pour votre IA",
  without: "Continuer sans ces images",
  notTaken: "Le site n'a pas pu prendre le quiz. Réessayez.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Le site gratuit n'a pour l'instant plus de place pour un autre quiz. Il en reprend dès que d'autres sont terminés ou expirés (trois heures après leur dernière utilisation).`
      : `Le site gratuit ne peut plus prendre de quiz aujourd'hui. Il en reprend à ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  quota: (at) => `Le site gratuit a épuisé son quota du jour. Il remarche à ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  ownCopyLink: "Plus de quiz : un site à vous ou à votre école ›",
  offline: "Pas de connexion au site. Vérifiez le réseau et réessayez. Si cela persiste, le réseau d'une école ou d'une entreprise bloque peut-être le site.",
  whatToTellIt: "Ce qu'il faut dire au service informatique ›",
  notStarted: "avant la première question",
  question: (n, t) => `question ${n} sur ${t}`,
  finalRanking: "classement final",
  back: "Retour au quiz ▶",
  joinCode: "Code pour rejoindre",
  otherDevice: (c) => `Sur un autre appareil : tapez <b>${c}</b> dans la case du code.`,
  untitled: "Votre quiz",
  ownCopy: (n) => `Ce site partagé a été complet ou très chargé ${n} ${n === 1 ? "jour" : "jours"} sur les 30 derniers. Pour plus de quiz, un site à vous ou à votre école :`,
  how: "comment ›",
};

const it: Text = {
  code: "Codice",
  join: "Entra",
  language: "Lingua",
  film: "Dalla scheda alla classe: un film senza parole",
  play: "Riproduci",
  pause: "Pausa",
  speed: "Velocità",
  seek: "Posizione nel film",
  again: "Rivedi",
  full: "Schermo intero",
  see: "L'esempio passo per passo ›",
  capSheet: "Le tue schede",
  capAi: "La tua IA",
  capZip: "Lo .zip, aperto qui",
  capWall: "Cosa vede la classe",
  capTap: "Ogni alunno tocca",
  build: "Crea un quiz",
  step1: "Scegli una buona IA.",
  step1detail: "L'esempio qui sopra l'ha scritto Claude Sonnet gratuito, 4 nov 2026: l'unica IA gratuita che lo fa in modo affidabile.",
  step2: "Chiedi all'IA un quiz per",
  tabSheets: "Con le foto di schede",
  tabChess: "Da una descrizione: un quiz di scacchi",
  tabSolo: "Per esercitarti per conto tuo",
  tabFriends: "Con gli amici, giocando anche tu",
  tabGroup: "Per un gruppo che guidi: una formazione",
  tabOpen: "Senza aver ancora deciso nulla",
  ask: [
    { s: "Leggi " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Mi puoi fare un classyQuiz con esercizi " },
    { s: "come i n. 1, 3 e 4", l: 1 },
    { s: " di queste due schede? " },
    { s: "Per la mia quinta elementare", l: 2 },
    { s: ", " },
    { s: "circa 10 domande", l: 3 },
    { s: ", " },
    { s: "in italiano", l: 4 },
    { s: "." },
  ],
  labels: ["questo sito", "quali esercizi", "la tua classe", "quante", "quale lingua"],
  askChess: "Leggi classyquiz.pages.dev. Fammi un classyQuiz di scacchi, per favore: bambini di 8 anni, 400–500 Elo, solo 5 domande. Cerca dei puzzle con rating. Lascio loro un po' di tempo su ogni domanda prima di mostrare le scelte e avviare il conto alla rovescia. Le scelte possono essere in notazione scacchistica, ma senza + né matto, sarebbe troppo facile. Non dimenticare di dire a chi tocca muovere. Per l'ultima domanda dai loro 2 posizioni simili tra cui scegliere, una promettente e una vincente. In italiano. Di cosa hai bisogno?",
  chessWho: "Claude Opus 5.5, abbonamento a pagamento, 5 nov 2026",
  askSolo: "Leggi classyquiz.pages.dev. Venerdì ho una verifica di biologia sulla cellula. Ecco i miei appunti. Mi fai un classyQuiz per esercitarmi, circa 20 domande? Ci gioco io, quindi tieni per te le domande e le risposte.",
  askFriends: "Leggi classyquiz.pages.dev. Facci un classyQuiz per la nostra serata giochi: 15 domande sui film degli anni '90, alcune facili, alcune difficili. Gioco anch'io, quindi non mostrarmi le domande.",
  askGroup: "Leggi classyquiz.pages.dev. Domani formo 25 nuovi colleghi sulle nostre regole di sicurezza. Le slide sono allegate. Mi fai un classyQuiz per la fine della sessione, sul grande schermo, circa 10 domande?",
  ask2: "Leggi classyquiz.pages.dev. Mi serve un classyQuiz. Mi aiuti?",
  copy: "Copia",
  copied: "Copiato",
  run: "Avvia un quiz",
  upload: "Apri il quiz della tua IA (.zip)",
  drop: "o trascinalo qui",
  zipOnly: "La tua IA può fare il quiz come un unico file .zip, da scaricare dalla chat e aprire qui.",
  notText: "Il sito prende il quiz come file .zip, non come testo.",
  notFile: (w) => `Il sito prende il quiz come file .zip, non ${w === "several" ? "più file insieme" : w === "this" ? "questo file" : `un file .${w}`}.`,
  unreadable: "Non è stato possibile leggere il file.",
  noHandoff: "Questo browser non ha lasciato aprire il quiz al sito (forse blocca i dati dei siti). Prova con un altro browser.",
  tooLong: (kb) => `Il testo del quiz è più lungo di quanto il sito accetti (${kb} KB).`,
  reading: "Lettura del quiz…",
  preparing: (d, o) => `Preparazione delle immagini… ${d} di ${o}`,
  sending: "Invio del quiz…",
  picturesHead: "Alcune immagini non possono partire con il quiz:",
  quizHead: "Il sito non può ancora avviare questo quiz:",
  aiFixes: "La tua IA può correggerlo. Copia il messaggio nella chat e apri il .zip che ti rimanda.",
  copyForAi: "Copia il messaggio per la tua IA",
  without: "Continua senza queste immagini",
  notTaken: "Il sito non è riuscito a prendere il quiz. Riprova.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Il sito gratuito per ora non ha più posto per un altro quiz. Ne riprende quando altri sono terminati o scaduti (tre ore dopo l'ultimo uso).`
      : `Il sito gratuito oggi non può prendere altri quiz. Ne riprende alle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  quota: (at) => `Il sito gratuito ha esaurito la quota di oggi. Torna a funzionare alle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  ownCopyLink: "Più quiz: un sito tuo o della tua scuola ›",
  offline: "Nessuna connessione al sito. Controlla la rete e riprova. Se resta così, forse la rete di una scuola o di un'azienda blocca il sito.",
  whatToTellIt: "Cosa dire al servizio informatico ›",
  notStarted: "prima della prima domanda",
  question: (n, t) => `domanda ${n} di ${t}`,
  finalRanking: "classifica finale",
  back: "Torna al quiz ▶",
  joinCode: "Codice per entrare",
  otherDevice: (c) => `Su un altro dispositivo: digita <b>${c}</b> nella casella del codice.`,
  untitled: "Il tuo quiz",
  ownCopy: (n) => `Negli ultimi 30 giorni questo sito condiviso è stato pieno o molto carico ${n === 1 ? "un giorno" : `${n} giorni`}. Per più quiz, un sito tuo o della tua scuola:`,
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
