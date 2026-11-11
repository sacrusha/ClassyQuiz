// The landing block's words in the four languages it speaks (docs/design/root-page.md,
// "Languages"): everything above About. The static HTML is English, so an AI's fetcher
// reads English; home.ts swaps these in. About and below is English: it is
// for the AI. The pages a quiz then plays on speak the language chosen here
// (client/room-text.ts).
//
// German, French and Italian say the same as the English in their own
// sentences, with a noun where a pronoun could point at two things
// (docs/design/root-page.md, "Languages"; the choices:
// docs/translation-review.md).
//
// The example asks, one per way to play (docs/design/root-page.md, "Getting a
// quiz"): the sheets ask, the Quizmaster's, is each language's version of the
// same ask, the film typing it; Solo's and
// Peers' are in the words of whoever asks, and the one who plays says so,
// which the guidance's "The user who plays" answers; the help ask has nothing
// decided, and the AI's question back is the guidance's "Build with the
// user". Solo's, Peers' and the help reply are mocks until the owner's runs.
// The site's address in every ask is replaced by the one the browser opened.

import { SITE_WORDS, type SiteWords } from "./site-text.ts";
import type { ZipProblem } from "./unzip.ts";

// The four languages and the device's choice among them live in device-lang.ts, which every page can load without these words.
export { LANGS, LANG_KEY, chosenLang, isLang, type Lang } from "./device-lang.ts";
import type { Lang } from "./device-lang.ts";

/** A run of the sheets ask; `l` marks the parts the film keeps on one line as it types them, the site's address as 0 (docs/film/build/film.js). */
export type AskPart = { s: string; l?: number };

export interface Text extends SiteWords {
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
  /** Under an example's file, to its full example (/example). */
  see: string;
  /** The page's first sentence, its h1: what the site does for whoever reads it (docs/design/root-page.md, "What this is"). */
  what: string;
  /** What each way's picture shows (docs/ways/README.md), its accessible name; the names are the local check's cards' (client/entries.ts), written in the page. */
  picQuizmaster: string;
  picPeers: string;
  picSolo: string;
  /** The first of the two steps: its heading, the bar of the chat that shows the example ask. */
  getH: string;
  /** Under the ask: that a file comes back, before the example's file name. */
  gives: string;
  /** The film's heading, where it stands for whoever wants to find out more. */
  filmH: string;
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
  /** The way a visitor recognises as theirs shows an example for it (docs/design/root-page.md, "Getting a quiz"): its ask, and its file. */
  askSolo: string;
  askPeers: string;
  /** The fourth entry, "?", for whoever recognises none of the three: its name, the ask that takes no knowing how to ask, and the AI's question back (a mock until a run gives one). */
  help: string;
  askHelp: string;
  helpReply: string;
  /** Which AI, in the chat's bar. */
  which: string;
  /** Beside the example's file: opens it in the box below, as a file of one's own is opened. */
  playThis: string;
  ask: AskPart[];
  copied: string;
  drop: string;
  zipOnly: string;
  notText: string;
  notFile: (what: "several" | "this" | string) => string;
  unreadable: string;
  /** Why the file isn't a quiz's archive (client/unzip.ts). */
  zip: Record<ZipProblem, string>;
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
  /** The upload's request failed: the network names itself as a possible cause (docs/design/root-page.md, "Network help, where failure shows"). */
  offline: string;
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
  see: "Step by step ›",
  what: "Play quizzes your own AI makes from your sheets, notes or ideas.",
  picQuizmaster: "A teacher at the big screen with the question, a phone in her hand; the class answers on tablets.",
  picPeers: "Three friends on a sofa in the evening, each with the question on their own phone, one of them laughing.",
  picSolo: "Someone alone at a desk with their notes, the question on their phone, the answer just found right.",
  getH: "Ask your AI for a quiz",
  gives: "The AI's answer:",
  filmH: "From the exercise sheet to the class playing, in one minute",
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
  ask: [
    { s: "Read " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Can you make me a classyQuiz with exercises " },
    { s: "like no. 1, 3 and 4", l: 1 },
    { s: " from these two sheets? " },
    { s: "For my 4th grade class", l: 2 },
    { s: ", " },
    { s: "about 10 questions", l: 3 },
    { s: ", " },
    { s: "in English", l: 4 },
    { s: "." },
  ],
  askHelp: "Read classyquiz.pages.dev. I need a classyQuiz. Help?",
  helpReply: "Gladly. What is the quiz for, and who will play it? If you have material, like exercise sheets or notes, send it along.",
  help: "None of these, or not sure yet",
  askSolo: "Read classyquiz.pages.dev. I got this biology test back. Make me a classyQuiz for 20 minutes of practice, mostly on what I got wrong. Don't show me the questions, I'll play it myself.",
  askPeers: "Read classyquiz.pages.dev. Here are our notes for the history exam. Make my friends and me a 10-minute classyQuiz, to learn and have fun. I'm playing too, so don't show me the questions.",
  which: "Any AI subscription will do, or free Claude.",
  playThis: "Play this quiz ↓",
  copied: "Copied",
  run: "Open the quiz your AI made",
  upload: "Choose the .zip file",
  drop: "or drop it here",
  zipOnly: "Your AI can make the quiz as one .zip file, to download from the chat and open here.",
  notText: "The site takes the quiz as a .zip file, not as text.",
  notFile: (w) => `The site takes the quiz as a .zip file, not ${w === "several" ? "several files at once" : w === "this" ? "this file" : `a .${w} file`}.`,
  unreadable: "The file couldn't be read.",
  zip: { notZip: "This file is not a readable .zip archive.", damaged: "The .zip archive is damaged.", noQuiz: "The archive contains no .txt or .md file with the quiz." },
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
  ...SITE_WORDS.en,
  offline: "No connection to the site. Check the network and try again. If it stays like this, the network of a school or a company may block the site.",
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
  see: "Schritt für Schritt ›",
  what: "Spiel das Quiz, das deine KI aus deinen Blättern, Notizen oder Ideen macht.",
  picQuizmaster: "Eine Lehrerin am grossen Bildschirm mit der Frage, das Handy in der Hand; die Klasse antwortet auf Tablets.",
  picPeers: "Drei Freunde abends auf dem Sofa, alle mit der Frage auf dem eigenen Handy, einer lacht.",
  picSolo: "Jemand allein am Schreibtisch mit Notizen, die Frage auf dem Handy, eben richtig beantwortet.",
  getH: "Frag deine KI nach einem Quiz",
  gives: "Antwort der KI:",
  filmH: "Vom Arbeitsblatt zum Quiz in der Klasse, in einer Minute",
  relyH: "Worauf du zählen kannst",
  relyFree: "Kostenlos, ohne Konto und ohne Anmeldung.",
  relyKept: "Spielst du allein, verlässt das Quiz deinen Browser nie. Spielen mehrere, wird das Quiz gelöscht, sobald es beendet ist, spätestens aber drei Stunden nach der letzten Benutzung. Die .zip-Datei ist die Kopie, die dir bleibt.",
  relyOpen: "Der Quellcode ist offen:",
  manual: "Der Rest dieser Seite ist das Handbuch für KIs, auf Englisch: was deine KI liest, wenn du ihr diese Adresse gibst. Du darfst es gern auch lesen.",
  capSheet: "Deine Arbeitsblätter",
  capAi: "Deine KI",
  capZip: "Die .zip-Datei, hier geöffnet",
  capWall: "Was die Klasse sieht",
  capTap: "Jedes Kind tippt",
  ask: [
    { s: "Lies " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Kannst du mir ein classyQuiz mit Aufgaben " },
    { s: "wie Nr. 1, 3 und 4", l: 1 },
    { s: " von diesen zwei Blättern machen? " },
    { s: "Für meine 4. Klasse", l: 2 },
    { s: ", " },
    { s: "etwa 10 Fragen", l: 3 },
    { s: ", " },
    { s: "auf Deutsch", l: 4 },
    { s: "." },
  ],
  askHelp: "Lies classyquiz.pages.dev. Ich brauche ein classyQuiz. Hilfst du mir?",
  helpReply: "Gern. Wofür ist das Quiz, und wer spielt es? Wenn du Material hast, etwa Arbeitsblätter oder Notizen, schick es mit.",
  help: "Nichts davon, oder noch unsicher",
  askSolo: "Lies classyquiz.pages.dev. Ich habe diese Biologieprüfung zurückbekommen. Mach mir ein classyQuiz für 20 Minuten Üben, vor allem zu dem, was ich falsch hatte. Zeig mir die Fragen nicht, ich spiele es selbst.",
  askPeers: "Lies classyquiz.pages.dev. Hier sind unsere Notizen für die Geschichtsprüfung. Mach meinen Freunden und mir ein classyQuiz für 10 Minuten, zum Lernen und zum Spass. Ich spiele mit, also zeig mir die Fragen nicht.",
  which: "Jedes KI-Abo reicht, sonst Claude gratis.",
  playThis: "Dieses Quiz spielen ↓",
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
  zip: { notZip: "Diese Datei ist kein lesbares .zip-Archiv.", damaged: "Das .zip-Archiv ist beschädigt.", noQuiz: "Im Archiv ist keine .txt- oder .md-Datei mit dem Quiz." },
  noHandoff: "Dieser Browser hat verhindert, dass die Seite das Quiz öffnet (vielleicht blockiert er Website-Daten). Versuch es mit einem anderen Browser.",
  tooLong: (kb) => `Der Quiztext ist zu lang: Die Seite nimmt höchstens ${kb} KB an.`,
  reading: "Das Quiz wird gelesen…",
  preparing: (d, o) => `Die Bilder werden vorbereitet… ${d} von ${o}`,
  sending: "Das Quiz wird gesendet…",
  picturesHead: "Einige Bilder können nicht mit dem Quiz hochgeladen werden:",
  quizHead: "Die Seite kann dieses Quiz noch nicht starten:",
  aiFixes: "Deine KI kann das beheben: Kopier die Nachricht in den Chat und öffne hier die neue .zip-Datei, die zurückkommt.",
  copyForAi: "Nachricht für deine KI kopieren",
  without: "Ohne diese Bilder fortfahren",
  ...SITE_WORDS.de,
  offline: "Keine Verbindung zur Seite. Prüf die Internetverbindung und versuch es nochmals. Klappt es weiterhin nicht, sperrt vielleicht das Netz einer Schule oder Firma die Seite.",
  notStarted: "vor der ersten Frage",
  question: (n, t) => `Frage ${n} von ${t}`,
  finalRanking: "Schlussrangliste",
  back: "Zurück zum Quiz ▶",
  joinCode: "Code zum Beitreten",
  otherDevice: (c) => `Auf einem anderen Gerät: <b>${c}</b> ins Codefeld eingeben.`,
  untitled: "Dein Quiz",
  ownCopy: (n) => `An ${n === 1 ? "einem" : n} der letzten 30 Tage war diese gemeinsam genutzte Website voll oder stark ausgelastet. Mehr Quiz gibt es mit einer eigenen Website für dich, deine Schule oder deine Firma:`,
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
  see: "Pas à pas ›",
  what: "Jouez aux quiz que votre IA crée avec vos fiches, notes ou idées.",
  picQuizmaster: "Une enseignante devant le grand écran avec la question, le téléphone à la main ; la classe répond sur des tablettes.",
  picPeers: "Trois amis sur un canapé le soir, chacun avec la question sur son téléphone, l'un d'eux rit.",
  picSolo: "Une personne seule à son bureau avec ses notes, la question sur son téléphone, la bonne réponse tout juste trouvée.",
  getH: "Demandez un quiz à votre IA",
  gives: "Réponse de l'IA :",
  filmH: "De la fiche d'exercices à la classe qui joue, en une minute",
  relyH: "Ce sur quoi vous pouvez compter",
  relyFree: "Gratuit, sans compte ni inscription.",
  relyKept: "En solo, le quiz ne quitte jamais votre navigateur. À plusieurs, le quiz est supprimé dès qu'il est terminé, au plus tard trois heures après sa dernière utilisation. Le fichier .zip reste votre copie.",
  relyOpen: "Le code source est ouvert :",
  manual: "Le reste de cette page est le manuel pour les IA, en anglais : ce que lit votre IA quand vous lui donnez cette adresse. Vous pouvez le lire vous aussi.",
  capSheet: "Vos fiches d'exercices",
  capAi: "Votre IA",
  capZip: "Le .zip, ouvert ici",
  capWall: "Ce que voit la classe",
  capTap: "Chaque élève répond",
  ask: [
    { s: "Lis " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Tu peux me faire un classyQuiz avec des exercices " },
    { s: "comme les n° 1, 3 et 4", l: 1 },
    { s: " de ces deux fiches ? " },
    { s: "Pour ma classe de CM1", l: 2 },
    { s: ", " },
    { s: "une dizaine de questions", l: 3 },
    { s: ", " },
    { s: "en français", l: 4 },
    { s: "." },
  ],
  askHelp: "Lis classyquiz.pages.dev. J'ai besoin d'un classyQuiz. Tu m'aides ?",
  helpReply: "Avec plaisir. À quoi sert le quiz, et qui va y jouer ? Si tu as du matériel, des fiches ou des notes par exemple, envoie-le.",
  help: "Rien de tout cela, ou pas encore sûr",
  askSolo: "Lis classyquiz.pages.dev. On m'a rendu ce contrôle de biologie. Fais-moi un classyQuiz pour 20 minutes de révision, surtout sur ce que j'ai raté. Ne me montre pas les questions, j'y joue moi-même.",
  askPeers: "Lis classyquiz.pages.dev. Voici nos notes pour l'examen d'histoire. Fais-nous, à mes amis et moi, un classyQuiz de 10 minutes pour apprendre en s'amusant. Je joue aussi, alors ne me montre pas les questions.",
  which: "Tout abonnement IA convient, ou Claude gratuit.",
  playThis: "Jouer à ce quiz ↓",
  copied: "Copié",
  run: "Ouvrez le quiz de votre IA",
  upload: "Choisir le fichier .zip",
  drop: "ou déposez-le ici",
  zipOnly: "Votre IA peut fournir le quiz en un seul fichier .zip, à télécharger depuis le chat puis à ouvrir ici.",
  notText: "Le site attend le quiz sous forme de fichier .zip, et non de texte.",
  notFile: (w) =>
    w === "several"
      ? "Le site attend le quiz sous forme d'un seul fichier .zip, et non de plusieurs fichiers."
      : w === "this"
        ? "Le site attend le quiz sous forme de fichier .zip, et ce fichier n'en est pas un."
        : `Le site attend le quiz sous forme de fichier .zip, et non de fichier .${w}.`,
  unreadable: "Impossible de lire le fichier.",
  zip: { notZip: "Ce fichier n'est pas une archive .zip lisible.", damaged: "L'archive .zip est endommagée.", noQuiz: "L'archive ne contient aucun fichier .txt ou .md avec le quiz." },
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
  ...SITE_WORDS.fr,
  offline: "Impossible de se connecter au site. Vérifiez la connexion et réessayez. Si le problème persiste, le réseau d'une école ou d'une entreprise bloque peut-être le site.",
  notStarted: "avant la première question",
  question: (n, t) => `question ${n} sur ${t}`,
  finalRanking: "classement final",
  back: "Retour au quiz ▶",
  joinCode: "Code pour participer",
  otherDevice: (c) => `Sur un autre appareil : tapez <b>${c}</b> dans le champ Code.`,
  untitled: "Votre quiz",
  ownCopy: (n) => `Sur les 30 derniers jours, ce site partagé a été complet ou très chargé ${n === 1 ? "un jour" : `${n} jours`}. Pour davantage de quiz, un site à vous, à votre école ou à votre entreprise :`,
  how: "comment faire ›",
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
  see: "Passo per passo ›",
  what: "Gioca ai quiz che la tua IA crea da schede, appunti o idee.",
  picQuizmaster: "Un'insegnante davanti allo schermo grande con la domanda, il telefono in mano; la classe risponde sui tablet.",
  picPeers: "Tre amici sul divano di sera, ognuno con la domanda sul proprio telefono, uno di loro ride.",
  picSolo: "Una persona sola alla scrivania con i suoi appunti, la domanda sul telefono, la risposta giusta appena trovata.",
  getH: "Chiedi un quiz alla tua IA",
  gives: "Risposta dell'IA:",
  filmH: "Dalla scheda alla classe che gioca, in un minuto",
  relyH: "Su cosa puoi contare",
  relyFree: "Gratuito, senza account né registrazione.",
  relyKept: "Se giochi per conto tuo, il quiz non esce mai dal tuo browser. Se si gioca in gruppo, il quiz viene eliminato appena è finito, al più tardi tre ore dopo l'ultimo uso. Il file .zip resta la tua copia.",
  relyOpen: "Il codice sorgente è aperto:",
  manual: "Il resto di questa pagina è il manuale per le IA, in inglese: quello che legge la tua IA quando le dai questo indirizzo. Puoi leggerlo anche tu.",
  capSheet: "Le tue schede",
  capAi: "La tua IA",
  capZip: "Il file .zip, aperto qui",
  capWall: "Cosa vede la classe",
  capTap: "Ogni alunno risponde",
  ask: [
    { s: "Leggi " },
    { s: "classyquiz.pages.dev", l: 0 },
    { s: ". Mi puoi fare un classyQuiz con esercizi " },
    { s: "come i n. 1, 3 e 4", l: 1 },
    { s: " di queste due schede? " },
    { s: "Per la mia quarta elementare", l: 2 },
    { s: ", " },
    { s: "una decina di domande", l: 3 },
    { s: ", " },
    { s: "in italiano", l: 4 },
    { s: "." },
  ],
  askHelp: "Leggi classyquiz.pages.dev. Mi serve un classyQuiz. Mi aiuti?",
  helpReply: "Volentieri. A cosa serve il quiz, e chi ci giocherà? Se hai del materiale, per esempio schede o appunti, mandamelo.",
  help: "Nessuno di questi, o non lo so ancora",
  askSolo: "Leggi classyquiz.pages.dev. Mi hanno restituito questa verifica di biologia. Fammi un classyQuiz per 20 minuti di ripasso, soprattutto su quello che ho sbagliato. Non mostrarmi le domande, ci gioco io.",
  askPeers: "Leggi classyquiz.pages.dev. Ecco i nostri appunti per l'esame di storia. Fai a me e ai miei amici un classyQuiz di 10 minuti, per imparare divertendoci. Gioco anch'io, quindi non mostrarmi le domande.",
  which: "Va bene ogni abbonamento IA, o Claude gratuito.",
  playThis: "Gioca a questo quiz ↓",
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
  zip: { notZip: "Questo file non è un archivio .zip leggibile.", damaged: "L'archivio .zip è danneggiato.", noQuiz: "L'archivio non contiene nessun file .txt o .md con il quiz." },
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
  ...SITE_WORDS.it,
  offline: "Impossibile collegarsi al sito. Controlla la connessione e riprova. Se il problema persiste, forse la rete di una scuola o di un'azienda blocca il sito.",
  notStarted: "in attesa della prima domanda",
  question: (n, t) => `domanda ${n} di ${t}`,
  finalRanking: "classifica finale",
  back: "Torna al quiz ▶",
  joinCode: "Codice per entrare",
  otherDevice: (c) => `Su un altro dispositivo: digita <b>${c}</b> nel campo Codice.`,
  untitled: "Il tuo quiz",
  ownCopy: (n) => `In ${n === 1 ? "uno" : n} degli ultimi 30 giorni questo sito condiviso era pieno o molto carico. Per avere più quiz, un sito tuo, della tua scuola o della tua azienda:`,
  how: "ecco come ›",
};

export const TEXT: Record<Lang, Text> = { de, en, fr, it };

/** The example asks as plain text, for checking the labelled parts and the address. */
export function askText(t: Text): string {
  return t.ask.map((p) => p.s).join("");
}
