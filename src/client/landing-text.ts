// The landing block's words in the four languages it speaks (landing story
// §4): everything above About. The static HTML is English, so an AI's fetcher
// reads English; home.ts swaps these in. About and below stay English: they
// are for the AI. The lobby, the wall, the Remote and the tablets stay
// English too (backlog Later, "Localization").
//
// How the page addresses teachers (backlog v4 item 1, the owner's rule):
// commands only for what must be done (choosing an AI, asking it), advice as
// advice, and no claim that isn't true. That is the page's voice to its
// reader; the example ask is the teacher's own sentence to their AI, where an
// imperative is fine (decisions.md, "Guidance page is information, not
// instruction", amended 2026-11-04). Step 1's detail names what is
// verified and says nothing about free tiers.
//
// The example asks began as each language's real first ask from the example's
// redo (.tmp/example/v2-*/teacher-1.txt); since 2026-11-04 they open with
// "Read <address>." and call the quiz a classyQuiz (backlog v4 item 11), so
// the runs' asks no longer match them word for word. The marked parts carry
// the labels. The second ask is the other end,
// nothing decided yet: the owner's, translated; that the AI then asks what it
// needs is the guidance's "Building with the teacher". The site's address in
// both is replaced by the one the browser opened.

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
  strip: string;
  capSheet: string;
  capAi: string;
  /** The .zip going up to the site, the strip's third frame. */
  capZip: string;
  capWall: string;
  capTap: string;
  build: string;
  step1: string;
  step1detail: string;
  step2: string;
  forExample: string;
  ask: AskPart[];
  labels: string[];
  /** The second example ask, with its lead-in and what follows it. */
  orOpen: string;
  ask2: string;
  asksBack: string;
  copy: string;
  copied: string;
  run: string;
  upload: string;
  drop: string;
  // Run's messages
  zipOnly: string;
  notText: string;
  notFile: (what: "several" | "this" | string) => string;
  unreadable: string;
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
  /** The upload's request failed: the network names itself as a possible cause (landing story §7). */
  offline: string;
  whatToTellIt: string;
  // the resume card (backlog v4 item 2)
  notStarted: string;
  question: (n: number, total: number) => string;
  back: string;
  classCode: string;
  otherDevice: (code: string) => string;
  untitled: string;
  // the own-copy line (backlog v4 item 4)
  ownCopy: (n: number) => string;
  how: string;
}

const en: Text = {
  code: "Code",
  join: "Join",
  language: "Language",
  strip: "The example quiz, from an exercise sheet to the class: see its questions",
  capSheet: "Your exercise sheet",
  capAi: "Your AI",
  capZip: "The .zip, uploaded here",
  capWall: "What the class sees",
  capTap: "Each student taps",
  build: "Build a quiz",
  step1: "Choose any good AI.",
  step1detail: "Claude Opus wrote the example quiz, 3 Nov 2026.",
  step2: "Ask it to build you a quiz for",
  forExample: "For example, with photos of two pages:",
  ask: [
    { s: "Read " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Can you make me a classyQuiz from these two pages, with exercises " },
    { s: "like no. 1, 3 and 4", l: 1 },
    { s: "? " },
    { s: "For my 5th grade class", l: 2 },
    { s: ", " },
    { s: "about 10 questions", l: 3 },
    { s: ", " },
    { s: "in English", l: 4 },
    { s: "." },
  ],
  labels: ["this site", "which exercises", "your class", "how many", "which language"],
  orOpen: "Or, with nothing decided yet:",
  ask2: "Read classyquiz.pages.dev. I need a classyQuiz. Help?",
  asksBack: "It then asks what it needs.",
  copy: "Copy",
  copied: "Copied",
  run: "Run a quiz",
  upload: "Upload the quiz your AI made (.zip)",
  drop: "or drop it here",
  zipOnly: "Your AI can make the quiz as one .zip file, to download from the chat and upload here.",
  notText: "The site takes the quiz as a .zip file, not as text.",
  notFile: (w) => `The site takes the quiz as a .zip file, not ${w === "several" ? "several files at once" : w === "this" ? "this file" : `a .${w} file`}.`,
  unreadable: "The file couldn't be read.",
  tooLong: (kb) => `The quiz text is longer than the site takes (${kb} KB).`,
  reading: "Reading the quiz…",
  preparing: (d, o) => `Preparing the pictures… ${d} of ${o}`,
  sending: "Sending the quiz…",
  picturesHead: "Some pictures can't go up with the quiz:",
  quizHead: "The site can't run this quiz yet:",
  aiFixes: "Your AI can fix this. Copy the message into the chat, and upload the .zip it sends back.",
  copyForAi: "Copy the message for your AI",
  without: "Continue without these pictures",
  notTaken: "The site couldn't take the quiz. Try again.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `The free site has no room for another quiz right now. It takes one again once others have ended or expired (two days after their last use).`
      : `The free site can't take more quizzes today. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`,
  quota: (at) => `The free site has used up today's allowance. It works again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`,
  ownCopyLink: "Your own copy: how ›",
  offline: "No connection to the site. Check the network and try again. If it stays like this, the school network may block the site.",
  whatToTellIt: "What to tell IT ›",
  notStarted: "before the first question",
  question: (n, t) => `question ${n} of ${t}`,
  back: "Back to the quiz ▶",
  classCode: "Class code",
  otherDevice: (c) => `On another device: type <b>${c}</b> in the code box.`,
  untitled: "Your quiz",
  ownCopy: (n) => `On ${n === 1 ? "one" : n} of the last 30 days this shared site was full and turned new quizzes away. A copy for you or your school is yours alone:`,
  how: "how ›",
};

const de: Text = {
  code: "Code",
  join: "Beitreten",
  language: "Sprache",
  strip: "Das Beispiel-Quiz, vom Aufgabenblatt bis zur Klasse: seine Fragen ansehen",
  capSheet: "Dein Aufgabenblatt",
  capAi: "Deine KI",
  capZip: "Die .zip, hier hochgeladen",
  capWall: "Was die Klasse sieht",
  capTap: "Jedes Kind tippt",
  build: "Ein Quiz bauen",
  step1: "Wähle eine gute KI.",
  step1detail: "Das Beispiel-Quiz hat Claude Opus geschrieben, 3. Nov. 2026.",
  step2: "Bitte sie um ein Quiz für",
  forExample: "Zum Beispiel, mit Fotos von zwei Seiten:",
  ask: [
    { s: "Lies " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Kannst du mir aus diesen zwei Seiten ein classyQuiz machen, mit ähnlichen Aufgaben " },
    { s: "wie Nr. 1, 3 und 4", l: 1 },
    { s: "? " },
    { s: "Für meine 5. Klasse", l: 2 },
    { s: ", " },
    { s: "etwa 10 Fragen", l: 3 },
    { s: ", " },
    { s: "auf Deutsch", l: 4 },
    { s: "." },
  ],
  labels: ["diese Seite", "welche Aufgaben", "deine Klasse", "wie viele", "welche Sprache"],
  orOpen: "Oder, wenn noch nichts feststeht:",
  ask2: "Lies classyquiz.pages.dev. Ich brauche ein classyQuiz. Hilfst du mir?",
  asksBack: "Dann fragt sie, was sie braucht.",
  copy: "Kopieren",
  copied: "Kopiert",
  run: "Ein Quiz starten",
  upload: "Das Quiz deiner KI hochladen (.zip)",
  drop: "oder hier ablegen",
  zipOnly: "Deine KI kann das Quiz als eine .zip-Datei machen, zum Herunterladen aus dem Chat und Hochladen hier.",
  notText: "Die Seite nimmt das Quiz als .zip-Datei, nicht als Text.",
  notFile: (w) => `Die Seite nimmt das Quiz als .zip-Datei, nicht ${w === "several" ? "mehrere Dateien auf einmal" : w === "this" ? "diese Datei" : `eine .${w}-Datei`}.`,
  unreadable: "Die Datei liess sich nicht lesen.",
  tooLong: (kb) => `Der Quiztext ist länger, als die Seite nimmt (${kb} KB).`,
  reading: "Das Quiz wird gelesen…",
  preparing: (d, o) => `Die Bilder werden vorbereitet… ${d} von ${o}`,
  sending: "Das Quiz wird gesendet…",
  picturesHead: "Einige Bilder können nicht mit dem Quiz hochgeladen werden:",
  quizHead: "Dieses Quiz kann die Seite noch nicht spielen:",
  aiFixes: "Deine KI kann das beheben. Kopiere die Nachricht in den Chat und lade die .zip hoch, die sie zurückschickt.",
  copyForAi: "Nachricht für deine KI kopieren",
  without: "Ohne diese Bilder weiter",
  notTaken: "Die Seite konnte das Quiz nicht annehmen. Versuch es nochmals.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Die Gratis-Seite hat im Moment keinen Platz für ein weiteres Quiz. Es geht wieder, wenn andere Quiz beendet oder abgelaufen sind (zwei Tage nach der letzten Benutzung).`
      : `Die Gratis-Seite kann heute keine Quiz mehr annehmen. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} nimmt sie wieder neue.`,
  quota: (at) => `Die Gratis-Seite hat ihr Kontingent für heute aufgebraucht. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} geht sie wieder.`,
  ownCopyLink: "Eine eigene Kopie: wie ›",
  offline: "Keine Verbindung zur Seite. Prüf das Netz und versuch es nochmals. Bleibt es so, sperrt vielleicht das Schulnetz die Seite.",
  whatToTellIt: "Was du der Schul-IT sagen kannst ›",
  notStarted: "vor der ersten Frage",
  question: (n, t) => `Frage ${n} von ${t}`,
  back: "Zurück zum Quiz ▶",
  classCode: "Klassencode",
  otherDevice: (c) => `Auf einem anderen Gerät: <b>${c}</b> ins Code-Feld tippen.`,
  untitled: "Dein Quiz",
  ownCopy: (n) => `An ${n === 1 ? "einem" : n} der letzten 30 Tage war diese geteilte Seite voll und hat neue Quiz abgewiesen. Eine Kopie für dich oder deine Schule gehört euch allein:`,
  how: "wie ›",
};

const fr: Text = {
  code: "Code",
  join: "Rejoindre",
  language: "Langue",
  strip: "Le quiz d'exemple, de la fiche d'exercices à la classe : voir ses questions",
  capSheet: "Votre fiche d'exercices",
  capAi: "Votre IA",
  capZip: "Le .zip, importé ici",
  capWall: "Ce que voit la classe",
  capTap: "Chaque élève touche",
  build: "Créer un quiz",
  step1: "Choisissez une bonne IA.",
  step1detail: "Le quiz d'exemple a été écrit par Claude Opus, le 3 nov. 2026.",
  step2: "Demandez-lui un quiz pour",
  forExample: "Par exemple, avec les photos de deux pages :",
  ask: [
    { s: "Lis " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Tu peux me faire un classyQuiz à partir de ces deux pages, avec des exercices " },
    { s: "comme les n° 1, 3 et 4", l: 1 },
    { s: " ? " },
    { s: "Pour ma classe de CM2", l: 2 },
    { s: ", " },
    { s: "une dizaine de questions", l: 3 },
    { s: ", " },
    { s: "en français", l: 4 },
    { s: "." },
  ],
  labels: ["ce site", "quels exercices", "votre classe", "combien", "quelle langue"],
  orOpen: "Ou, sans rien avoir décidé :",
  ask2: "Lis classyquiz.pages.dev. J'ai besoin d'un classyQuiz. Tu m'aides ?",
  asksBack: "Elle vous demande alors ce qu'il lui faut.",
  copy: "Copier",
  copied: "Copié",
  run: "Lancer un quiz",
  upload: "Importer le quiz de votre IA (.zip)",
  drop: "ou déposez-le ici",
  zipOnly: "Votre IA peut faire le quiz en un seul fichier .zip, à télécharger depuis le chat et à importer ici.",
  notText: "Le site prend le quiz en fichier .zip, pas en texte.",
  notFile: (w) => `Le site prend le quiz en fichier .zip, pas ${w === "several" ? "plusieurs fichiers à la fois" : w === "this" ? "ce fichier" : `un fichier .${w}`}.`,
  unreadable: "Le fichier n'a pas pu être lu.",
  tooLong: (kb) => `Le texte du quiz est plus long que ce que le site accepte (${kb} Ko).`,
  reading: "Lecture du quiz…",
  preparing: (d, o) => `Préparation des images… ${d} sur ${o}`,
  sending: "Envoi du quiz…",
  picturesHead: "Certaines images ne peuvent pas partir avec le quiz :",
  quizHead: "Le site ne peut pas encore lancer ce quiz :",
  aiFixes: "Votre IA peut corriger cela. Copiez le message dans le chat et importez le .zip qu'elle renvoie.",
  copyForAi: "Copier le message pour votre IA",
  without: "Continuer sans ces images",
  notTaken: "Le site n'a pas pu prendre le quiz. Réessayez.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Le site gratuit n'a pour l'instant plus de place pour un autre quiz. Il en reprend dès que d'autres sont terminés ou expirés (deux jours après leur dernière utilisation).`
      : `Le site gratuit ne peut plus prendre de quiz aujourd'hui. Il en reprend à ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  quota: (at) => `Le site gratuit a épuisé son quota du jour. Il remarche à ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  ownCopyLink: "Une copie à vous : comment ›",
  offline: "Pas de connexion au site. Vérifiez le réseau et réessayez. Si cela persiste, le réseau de l'école bloque peut-être le site.",
  whatToTellIt: "Ce qu'il faut dire au service informatique ›",
  notStarted: "avant la première question",
  question: (n, t) => `question ${n} sur ${t}`,
  back: "Retour au quiz ▶",
  classCode: "Code de la classe",
  otherDevice: (c) => `Sur un autre appareil : tapez <b>${c}</b> dans la case du code.`,
  untitled: "Votre quiz",
  ownCopy: (n) => `Ce site partagé a été complet ${n} ${n === 1 ? "jour" : "jours"} sur les 30 derniers et a refusé de nouveaux quiz. Une copie pour vous ou votre école n'est qu'à vous :`,
  how: "comment ›",
};

const it: Text = {
  code: "Codice",
  join: "Entra",
  language: "Lingua",
  strip: "Il quiz di esempio, dalla scheda alla classe: vedi le sue domande",
  capSheet: "La tua scheda",
  capAi: "La tua IA",
  capZip: "Lo .zip, caricato qui",
  capWall: "Cosa vede la classe",
  capTap: "Ogni alunno tocca",
  build: "Crea un quiz",
  step1: "Scegli una buona IA.",
  step1detail: "Il quiz di esempio l'ha scritto Claude Opus, 3 nov 2026.",
  step2: "Chiedile un quiz per",
  forExample: "Per esempio, con le foto di due pagine:",
  ask: [
    { s: "Leggi " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Mi puoi fare un classyQuiz da queste due pagine, con esercizi " },
    { s: "come i n. 1, 3 e 4", l: 1 },
    { s: "? " },
    { s: "Per la mia quinta elementare", l: 2 },
    { s: ", " },
    { s: "circa 10 domande", l: 3 },
    { s: ", " },
    { s: "in italiano", l: 4 },
    { s: "." },
  ],
  labels: ["questo sito", "quali esercizi", "la tua classe", "quante", "quale lingua"],
  orOpen: "Oppure, senza aver ancora deciso nulla:",
  ask2: "Leggi classyquiz.pages.dev. Mi serve un classyQuiz. Mi aiuti?",
  asksBack: "Allora ti chiede ciò che le serve.",
  copy: "Copia",
  copied: "Copiato",
  run: "Avvia un quiz",
  upload: "Carica il quiz della tua IA (.zip)",
  drop: "o trascinalo qui",
  zipOnly: "La tua IA può fare il quiz come un unico file .zip, da scaricare dalla chat e caricare qui.",
  notText: "Il sito prende il quiz come file .zip, non come testo.",
  notFile: (w) => `Il sito prende il quiz come file .zip, non ${w === "several" ? "più file insieme" : w === "this" ? "questo file" : `un file .${w}`}.`,
  unreadable: "Non è stato possibile leggere il file.",
  tooLong: (kb) => `Il testo del quiz è più lungo di quanto il sito accetti (${kb} KB).`,
  reading: "Lettura del quiz…",
  preparing: (d, o) => `Preparazione delle immagini… ${d} di ${o}`,
  sending: "Invio del quiz…",
  picturesHead: "Alcune immagini non possono partire con il quiz:",
  quizHead: "Il sito non può ancora avviare questo quiz:",
  aiFixes: "La tua IA può correggerlo. Copia il messaggio nella chat e carica il .zip che ti rimanda.",
  copyForAi: "Copia il messaggio per la tua IA",
  without: "Continua senza queste immagini",
  notTaken: "Il sito non è riuscito a prendere il quiz. Riprova.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Il sito gratuito per ora non ha più posto per un altro quiz. Ne riprende quando altri sono terminati o scaduti (due giorni dopo l'ultimo uso).`
      : `Il sito gratuito oggi non può prendere altri quiz. Ne riprende alle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  quota: (at) => `Il sito gratuito ha esaurito la quota di oggi. Torna a funzionare alle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  ownCopyLink: "Una copia tua: come ›",
  offline: "Nessuna connessione al sito. Controlla la rete e riprova. Se resta così, forse la rete della scuola blocca il sito.",
  whatToTellIt: "Cosa dire al servizio informatico ›",
  notStarted: "prima della prima domanda",
  question: (n, t) => `domanda ${n} di ${t}`,
  back: "Torna al quiz ▶",
  classCode: "Codice della classe",
  otherDevice: (c) => `Su un altro dispositivo: digita <b>${c}</b> nella casella del codice.`,
  untitled: "Il tuo quiz",
  ownCopy: (n) => `Negli ultimi 30 giorni questo sito condiviso è stato pieno ${n === 1 ? "un giorno" : `${n} giorni`} e ha rifiutato nuovi quiz. Una copia per te o per la tua scuola è solo vostra:`,
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
