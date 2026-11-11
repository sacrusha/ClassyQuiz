// The words of the pages a quiz plays on, in the four languages of the root
// page: the local check and Solo (/open), the Projector, the Remote, the
// player's device and a Peers room, and the server's messages as they show
// there. A device speaks its own language, the one the root page speaks on
// it (landing-text.ts, chosenLang): the Projector the quizmaster's, a
// player's device its own browser's.
//
// What an AI reads stays English and is not here: the quiz's problems and
// warnings, and the text copied for the AI.
//
// The server says its messages in English, the words the pages match on
// (shared/limits.ts, shared/protocol.ts, server/game.ts); said() puts them in
// this device's language. One that has no entry here shows as it came.

import type { Lang } from "./landing-text.ts";
import { deviceLang } from "./device-lang.ts";
import { SITE_WORDS } from "./site-text.ts";
import { nameLooks } from "./look.ts";
import type { LineStatus } from "./net.ts";
import { CLASS_FULL, CLASS_STARTED, CLASS_WAITING, ROOM_FULL, ROOM_STARTED, quotaResetAt } from "../shared/limits.ts";
import { TOO_MANY_CODES, WRONG_TEACHER_CODE } from "../shared/protocol.ts";
import { LAST_CALL_MS, POINTS_RIGHT, SPEED_BONUS } from "../shared/tempo.ts";

/** Most strings are text; the few with markup say so, and take their parts as HTML already escaped. */
export interface RoomText {
  // Every page.
  /** The line's dot, its title (client/dom.ts, statusDot). */
  status: Record<LineStatus, string>;
  connecting: string;
  /** The notice over a device asleep after a long while without a change (client/net.ts). */
  tapToContinue: string;
  /** The countdown's bar, its accessible name; also the label of its button. */
  countdown: string;
  questions: (n: number) => string;
  /** A question's number among those shown, as the next step's label. */
  question: (n: number) => string;
  /** The way to an own copy, as a sentence after a refusal; `site` is this site's address. */
  ownCopy: (site: string) => string;
  /** Classes and groups are let in for the day's rows (shared/limits.ts, classesFullMessage); at: the time in Swiss time, or null. */
  classesFull: (at: string | null) => string;
  /** A Peers room refused as it opens (roomsFullMessage). */
  roomsFull: (at: string | null) => string;
  /** The day nearly full, on the check before the players are let in (client/manage.ts, roomNotice). */
  nearlyFull: (room: number) => string;
  close: string;
  more: string;
  back: string;
  menu: string;
  remove: string;
  picture: string;
  background: string;
  /** The ⋯ menu's and the solution sheet's words (client/manage.ts). */
  tagNow: string;
  tagDone: string;
  tagSkipped: string;
  tagVoid: string;
  tagHidden: string;
  tagRight: (n: number) => string;
  tagChanged: string;
  leftOut: string;
  tapRight: string;
  countAgain: string;
  dontCount: string;
  showAfterAll: string;
  skipIt: string;
  showPicture: string;
  hidePicture: string;
  done: string;
  changeSolution: string;
  changeSolutionSeen: string;
  showSolutions: string;
  hideSolutions: string;
  behindEvery: string;
  confirmFinish: string;
  confirmSkip: string;
  confirmRemove: string;
  /** null: the quiz has no title. */
  confirmDelete: (title: string | null) => string;
  skipQuestion: string;
  endQuiz: string;
  speedSwitch: string;
  speedNote: string;
  // The steering bar (client/steps.ts): nouns for what the class sees next (docs/design/question-flow.md, "The steering bar").
  choices: string;
  answers: string;
  closesAnswering: string;
  solution: string;
  ranking: string;
  finalRanking: string;
  countdownNote: string;
  startQuiz: string;
  exit: string;
  exitNote: string;
  // The local check (client/open.ts) and its entries.
  nothingOpenH: string;
  nothingOpen: string;
  toStart: string;
  howPlayed: string;
  foldName: string;
  notes: (n: number) => string;
  foldHint: string;
  /** What each way's picture shows (docs/ways/README.md), on its card: its accessible name. */
  picQuizmaster: string;
  picPeers: string;
  picSolo: string;
  soloLine: string;
  soloButton: string;
  soloNote: string;
  peersLine: string;
  peersButton: string;
  quizmasterLine: string;
  quizmasterButton: string;
  roomNote: string;
  peersNotHere: string;
  // Solo (client/entry-solo.ts).
  start: string;
  result: string;
  playAgain: string;
  copyAnswers: string;
  copiedAnswers: string;
  soloAi: string;
  backArrow: string;
  // The Projector (client/screen.ts) and the Remote (client/teach.ts).
  projector: string;
  remote: string;
  remoteConnected: string;
  remoteGoneHere: string;
  remoteGone: string;
  projectorGone: string;
  /** HTML: the teacher code typed on the site (both given as HTML). */
  secondDevice: (site: string, code: string) => string;
  /** HTML: `link` is the button's label, wrapped by the page. */
  secondDeviceWindow: (link: string) => string;
  newWindowLink: string;
  checkHowTo: (site: string, code: string) => string;
  checkHowToWindow: (link: string) => string;
  joinCode: string;
  arrangeAsk: string;
  oneScreen: string;
  oneScreenLine: string;
  screenAndRemote: string;
  screenAndRemoteLine: string;
  videoCall: string;
  letIn: string;
  moreMenu: string;
  /** HTML: `site` as HTML, `link` the link to what to tell IT, whole. */
  nobodyYet: (site: string, link: string) => string;
  backToCheck: string;
  secondDeviceLink: string;
  remoteGoneSecond: string;
  swapScreens: string;
  fullScreen: string;
  dragHint: string;
  zoomBack: string;
  zoomIn: string;
  players: string;
  swapHere: string;
  secondDeviceMenu: string;
  stopShowing: string;
  deleteQuiz: string;
  playersHint: string;
  confirmStopShowing: string;
  confirmStopShowingLast: (site: string, code: string) => string;
  popupBlocked: (code: string) => string;
  swap: string;
  joined: (n: string) => string;
  /** HTML: the projector computer's how-to. */
  onProjector: (site: string, code: string) => string;
  onProjectorWindow: (link: string) => string;
  projectorWindowLink: string;
  waitingFor: string;
  hiddenOnProjector: string;
  zoomBackProjector: string;
  zoomInProjector: string;
  notCounted: string;
  /** HTML: the numbers come as live spans, patched in place (client/manage.ts, patch), so no word may agree with them. */
  answered: (answered: string, present: string, away: string | null) => string;
  reading: string;
  locked: string;
  rightOf: (questions: number) => string;
  hideQuestions: string;
  allQuestions: string;
  swapSteerOther: string;
  typeOn: (site: string, code: string) => string;
  stopSteering: string;
  confirmStopSteering: (site: string, code: string) => string;
  // The player's device (client/play.ts) and a Peers room (client/peers.ts).
  unreached: string;
  unreachedTell: string;
  needsDigits: string;
  noQuizCode: (code: string) => string;
  quizCode: string;
  go: string;
  showOrSteer: string;
  showOrSteerH: string;
  codeAndDigits: string;
  digitsShown: string;
  entryFull: string;
  entryFullAgain: string;
  tryAgain: string;
  showHere: string;
  showHereSmall: string;
  steerHere: string;
  steerHereSmall: string;
  newAvatar: string;
  onlyYou: string;
  inWithYou: (n: number) => string;
  movesOn: string;
  /** Follows the avatar of whoever opened the room. */
  startsOnce: string;
  exitEverywhere: string;
  nowWithout: (step: string) => string;
  removeSomeone: string;
  /** HTML: `site` as HTML. */
  friendsJoin: (site: string) => string;
  orQr: string;
  // The avatars' and the tiles' accessible names (client/look.ts), in the order of their drawings.
  animals: string[];
  backgrounds: string[];
  hats: string[];
  tools: string[];
  shapes: string[];
  /** The server's messages, by their English words (said()). */
  server: Record<string, string>;
}

const at = (a: string | null, swiss: (t: string) => string): string => (a ? swiss(a) : "00:00 UTC");

const en: RoomText = {
  status: { live: "Connected", offline: "Connection lost — reconnecting", connecting: "Connecting" },
  connecting: "Connecting",
  tapToContinue: "Tap to continue",
  countdown: "Countdown",
  questions: (n) => `${n} ${n === 1 ? "question" : "questions"}`,
  question: (n) => `Question ${n}`,
  ownCopy: (s) => `For more quizzes, a site of your own, your school's or your company's: ${s}/own-copy says how.`,
  classesFull: (a) => `The free site can't let another group in today: the quizzes under way use what is left. It takes new ones again at ${at(a, (t) => `${t} Swiss time`)}.`,
  roomsFull: (a) => `The free site can't take more quizzes today: the ones running now use what is left. It takes new ones again at ${at(a, (t) => `${t} Swiss time`)}.`,
  nearlyFull: (r) => `The free site is nearly full today: room for ${r === 1 ? "one more group" : `about ${r} more groups`}.`,
  close: "Close",
  more: "more",
  back: "back",
  menu: "menu",
  remove: "remove",
  picture: "picture",
  background: "background",
  tagNow: "now",
  tagDone: "done",
  tagSkipped: "skipped",
  tagVoid: "not counted",
  tagHidden: "picture hidden",
  tagRight: (n) => `${n} right`,
  tagChanged: "changed",
  leftOut: "(picture left out)",
  tapRight: "Tap every right choice.",
  countAgain: "Count it again",
  dontCount: "Don't count this question",
  showAfterAll: "Show it after all",
  skipIt: "Skip it",
  showPicture: "Show the picture again",
  hidePicture: "Hide the picture",
  done: "Done",
  changeSolution: "Change the solution",
  changeSolutionSeen: "Change the solution – everyone sees it",
  showSolutions: "Show the solutions",
  hideSolutions: "Hide the solutions",
  behindEvery: "behind every question",
  confirmFinish: "Show the final ranking now? Questions not yet shown are left out.",
  confirmSkip: "Skip this question? It won't count.",
  confirmRemove: "Remove this avatar? Its answers stop counting. For a double, or a device that doesn't belong here.",
  confirmDelete: (t) => (t ? `Delete “${t}”? Nobody can join it any more.` : "Delete this quiz? Nobody can join it any more."),
  skipQuestion: "Skip this question",
  endQuiz: "End the quiz: final ranking",
  speedSwitch: "Points for speed",
  speedNote: `A right answer ${POINTS_RIGHT}, up to ${SPEED_BONUS} more the quicker it comes.`,
  choices: "Choices",
  answers: "Answers",
  closesAnswering: "closes answering",
  solution: "Solution",
  ranking: "Ranking",
  finalRanking: "Final ranking",
  countdownNote: `${LAST_CALL_MS / 1000} s, then closes`,
  startQuiz: "Start quiz",
  exit: "Exit",
  exitNote: "ends the quiz for everyone",
  nothingOpenH: "No quiz open here",
  nothingOpen: "A quiz opens from the .zip your AI made, on the start page. This page keeps nothing of it once it reloads or closes, so open the .zip there again.",
  toStart: "To the start page",
  howPlayed: "How will it be played?",
  foldName: "The questions and their solutions",
  notes: (n) => `${n} ${n === 1 ? "note" : "notes"} from the site`,
  foldHint: "If you will play it yourself, leave this closed.",
  picQuizmaster: "A teacher at the big screen with the question, a phone in her hand; the class answers on tablets.",
  picPeers: "Three friends on a sofa in the evening, each with the question on their own phone, one of them laughing.",
  picSolo: "Someone alone at a desk with their notes, the question on their phone, the answer just found right.",
  soloLine: "On your own, to practise or review. Each answer shows the solution right away, and the score comes at the end.",
  soloButton: "Play ▶",
  soloNote: "Plays in this tab. Nothing is sent to the site. Reloading or closing the tab ends it.",
  peersLine: "With friends, each on their own device. Nobody runs it: the quiz moves on once everyone has answered.",
  peersButton: "Play together ▶",
  quizmasterLine: "For a class or a group: the questions on a big screen, the answers on everyone's own device. You run it and don't play.",
  quizmasterButton: "Open the lobby ▶",
  roomNote: "Sends the quiz to the site, into a room that only people with its code can join. The room is deleted when you end it, or three hours after its last use. The .zip is your lasting copy.",
  peersNotHere: "This site can't play a quiz this way yet.",
  start: "Start ▶",
  result: "Result",
  playAgain: "Play again ▶",
  copyAnswers: "Copy the answers for your AI",
  copiedAnswers: "Copied: paste it into the chat with your AI",
  soloAi: "Your AI can explain a mistake, or check a solution that looks wrong.",
  backArrow: "← Back",
  projector: "Big screen",
  remote: "Remote",
  remoteConnected: "Remote connected",
  remoteGoneHere: "Remote gone – steering here",
  remoteGone: "Remote gone",
  projectorGone: "Big screen gone.",
  secondDevice: (s, c) => `A second device, to steer from or to show the quiz on: on <strong>${s}</strong>, type <strong class="digits">${c}</strong>.`,
  secondDeviceWindow: (l) => ` Or ${l} with a click.`,
  newWindowLink: "open a second screen in a new window",
  checkHowTo: (s, c) => `On the second device, open <strong>${s}</strong> and type <strong class="digits">${c}</strong>.`,
  checkHowToWindow: (l) => ` With two screens on this computer: ${l}.`,
  joinCode: "Join code",
  arrangeAsk: "How are the screens arranged?",
  oneScreen: "One screen",
  oneScreenLine: "It shows the quiz and steers it: the buttons under the quiz, the keyboard or a clicker.",
  screenAndRemote: "Screen and remote",
  screenAndRemoteLine: "One device shows the quiz, another steers it: a phone, say.",
  videoCall: "In a video call, the window you share is the screen everyone sees.",
  letIn: "Let everyone in",
  moreMenu: "⋯ More",
  nobodyYet: (s, l) => `Nobody in yet? If phones and tablets can't open ${s}, their network may block it: ${l}`,
  backToCheck: "‹ Back",
  secondDeviceLink: "A second device ›",
  remoteGoneSecond: "Remote gone: a second device ›",
  swapScreens: "⇄ Swap screens",
  fullScreen: "Full screen (F)",
  dragHint: "Drag this window to the big screen, then press F for full screen.",
  zoomBack: "Back to the question (Z)",
  zoomIn: "Enlarge the picture (Z)",
  players: "Players",
  swapHere: "⇄ Swap: steer here, show the quiz on the other device",
  secondDeviceMenu: "A second device…",
  stopShowing: "Stop showing the quiz here",
  deleteQuiz: "Delete the quiz…",
  playersHint: "Faded ones are away; they come back by themselves. Tap one to remove it, e.g. a double.",
  confirmStopShowing: "Stop showing the quiz on this screen?",
  confirmStopShowingLast: (s, c) => `Stop showing the quiz on this screen? Nothing steers it until a device comes in: type ${c} at ${s}.`,
  popupBlocked: (c) => `The browser blocked the new window. Allow pop-ups for this site, or open it in another window and type ${c}.`,
  swap: "⇄ Swap",
  joined: (n) => `${n} joined`,
  onProjector: (s, c) => `On the big screen's computer: on <strong>${s}</strong>, type <strong class="digits">${c}</strong>.`,
  onProjectorWindow: (l) => ` Or ${l} here.`,
  projectorWindowLink: "open the big screen's window",
  waitingFor: "Waiting for",
  hiddenOnProjector: "Hidden from the big screen.",
  zoomBackProjector: "Back to the question on the big screen",
  zoomInProjector: "Enlarge on the big screen",
  notCounted: "This question doesn't count.",
  answered: (a, p, w) => `<strong>${a}</strong> of ${p} answered${w ? ` · ${w} away` : ""}`,
  reading: "The choices are hidden: everyone reads the question.",
  locked: "Answering closed. The big screen shows how everyone answered, not yet the solution.",
  rightOf: (n) => `right · ${n} ${n === 1 ? "question" : "questions"}`,
  hideQuestions: "Hide the questions",
  allQuestions: "All questions",
  swapSteerOther: "⇄ Swap: show the quiz here, steer from the other device",
  typeOn: (s, c) => `On ${s}, type ${c}.`,
  stopSteering: "Stop steering from here",
  confirmStopSteering: (s, c) => `Stop steering from this device? The big screen steers again. To steer again: on ${s}, type ${c}.`,
  unreached: "This device can't reach the quiz.",
  unreachedTell: "This device can't reach the quiz. Tell whoever runs it.",
  needsDigits: "This quiz now takes its code and two more digits.",
  noQuizCode: (c) => `No quiz with the code ${c}.`,
  quizCode: "Quiz code",
  go: "go",
  showOrSteer: "show or steer",
  showOrSteerH: "Show or steer a quiz from here",
  codeAndDigits: "The quiz's code and two more digits:",
  digitsShown: "The screen that runs the quiz shows them.",
  entryFull: "This quiz already has a screen that shows it and one that steers.",
  entryFullAgain: "If one of them was on this device a moment ago, try again in half a minute.",
  tryAgain: "Try again",
  showHere: "Show the quiz here",
  showHereSmall: "everyone watches this screen",
  steerHere: "Steer it from here",
  steerHereSmall: "Start, next, the solution",
  newAvatar: "new",
  onlyYou: "Only you so far.",
  inWithYou: (n) => `${n} in, you among them.`,
  movesOn: "The quiz moves on once everyone has answered.",
  startsOnce: "starts the quiz once everyone is in.",
  exitEverywhere: "Exit ends the quiz on every device.",
  nowWithout: (s) => `${s} now, without waiting`,
  removeSomeone: "Remove a player…",
  friendsJoin: (s) => `Friends join on <b>${s}</b> with the code`,
  orQr: "or with the QR code.",
  animals: ["cat", "dog", "fox", "bear", "rabbit", "owl", "frog", "pig", "mouse", "lion", "panda", "penguin"],
  backgrounds: ["circle", "hexagon", "star", "heart", "flower", "pond"],
  hats: ["", "crown", "top hat", "cap", "wizard hat", "party hat", "flower", "beanie", "viking helmet", "bowler"],
  tools: ["", "laptop", "chart", "calculator", "coffee", "briefcase", "book", "bow tie"],
  shapes: ["triangle", "diamond", "circle", "square"],
  server: {},
};

const de: RoomText = {
  status: { live: "Verbunden", offline: "Verbindung unterbrochen – wird wieder aufgebaut", connecting: "Verbindung wird aufgebaut" },
  connecting: "Verbindung wird aufgebaut",
  tapToContinue: "Tippen, um weiterzumachen",
  countdown: "Countdown",
  questions: (n) => `${n} ${n === 1 ? "Frage" : "Fragen"}`,
  question: (n) => `Frage ${n}`,
  ownCopy: (s) => `Mehr Quiz gibt es mit einer eigenen Website für dich, deine Schule oder deine Firma. Wie das geht, steht auf ${s}/own-copy.`,
  classesFull: (a) => `Die Gratis-Seite kann heute keine weitere Gruppe hereinlassen: Was übrig ist, brauchen die Runden, die schon laufen. Ab ${at(a, (t) => `${t} Uhr Schweizer Zeit`)} nimmt sie wieder neue an.`,
  roomsFull: (a) => `Die Gratis-Seite kann heute kein weiteres Quiz annehmen: Was übrig ist, brauchen die Runden, die gerade laufen. Ab ${at(a, (t) => `${t} Uhr Schweizer Zeit`)} nimmt sie wieder eines an.`,
  nearlyFull: (r) => `Die Gratis-Seite ist heute fast voll: Platz für ${r === 1 ? "noch eine Gruppe" : `noch etwa ${r} Gruppen`}.`,
  close: "Schliessen",
  more: "mehr",
  back: "zurück",
  menu: "Menü",
  remove: "entfernen",
  picture: "Bild",
  background: "Hintergrund",
  tagNow: "jetzt",
  tagDone: "vorbei",
  tagSkipped: "übersprungen",
  tagVoid: "zählt nicht",
  tagHidden: "Bild verborgen",
  tagRight: (n) => `${n} richtig`,
  tagChanged: "geändert",
  leftOut: "(Bild weggelassen)",
  tapRight: "Tippe jede richtige Option an.",
  countAgain: "Wieder zählen lassen",
  dontCount: "Diese Frage nicht zählen",
  showAfterAll: "Doch zeigen",
  skipIt: "Überspringen",
  showPicture: "Bild wieder zeigen",
  hidePicture: "Bild verbergen",
  done: "Fertig",
  changeSolution: "Lösung ändern",
  changeSolutionSeen: "Lösung ändern – alle sehen es",
  showSolutions: "Lösungen zeigen",
  hideSolutions: "Lösungen verbergen",
  behindEvery: "hinter jeder Frage",
  confirmFinish: "Jetzt die Schlussrangliste zeigen? Fragen, die noch nicht gezeigt wurden, fallen weg.",
  confirmSkip: "Diese Frage überspringen? Sie zählt dann nicht.",
  confirmRemove: "Diesen Avatar entfernen? Seine Antworten zählen dann nicht mehr. Gedacht für einen doppelten oder ein Gerät, das nicht hierher gehört.",
  confirmDelete: (t) => (t ? `«${t}» löschen? Danach kann niemand mehr beitreten.` : "Dieses Quiz löschen? Danach kann niemand mehr beitreten."),
  skipQuestion: "Diese Frage überspringen",
  endQuiz: "Quiz beenden: Schlussrangliste",
  speedSwitch: "Punkte fürs Tempo",
  speedNote: `Eine richtige Antwort gibt ${POINTS_RIGHT}, bis zu ${SPEED_BONUS} mehr, je schneller sie kommt.`,
  choices: "Optionen",
  answers: "Antworten",
  closesAnswering: "beendet das Antworten",
  solution: "Lösung",
  ranking: "Rangliste",
  finalRanking: "Schlussrangliste",
  countdownNote: `${LAST_CALL_MS / 1000} s, dann Schluss`,
  startQuiz: "Quiz starten",
  exit: "Beenden",
  exitNote: "das Quiz für alle",
  nothingOpenH: "Hier ist kein Quiz offen",
  nothingOpen: "Ein Quiz öffnest du auf der Startseite, aus der .zip-Datei deiner KI. Diese Seite behält nichts davon, sobald sie neu lädt oder geschlossen wird: Öffne die .zip-Datei dort nochmals.",
  toStart: "Zur Startseite",
  howPlayed: "Wie wird das Quiz gespielt?",
  foldName: "Die Fragen und ihre Lösungen",
  notes: (n) => `${n} ${n === 1 ? "Hinweis" : "Hinweise"} der Seite`,
  foldHint: "Spielst du selbst mit, lass das geschlossen.",
  picQuizmaster: "Eine Lehrerin am grossen Bildschirm mit der Frage, das Handy in der Hand; die Klasse antwortet auf Tablets.",
  picPeers: "Drei Freunde abends auf dem Sofa, alle mit der Frage auf dem eigenen Handy, einer lacht.",
  picSolo: "Jemand allein am Schreibtisch mit Notizen, die Frage auf dem Handy, eben richtig beantwortet.",
  soloLine: "Für dich allein, zum Üben oder Wiederholen. Nach jeder Antwort siehst du gleich die Lösung, am Schluss die Punkte.",
  soloButton: "Spielen ▶",
  soloNote: "Läuft in diesem Tab. Nichts geht an die Seite. Neu laden oder den Tab schliessen beendet es.",
  peersLine: "Mit Freunden, alle am eigenen Gerät. Niemand leitet: Das Quiz geht weiter, sobald alle geantwortet haben.",
  peersButton: "Zusammen spielen ▶",
  quizmasterLine: "Für eine Klasse oder Gruppe: die Fragen am Grossbildschirm, die Antworten auf den eigenen Geräten. Du leitest und spielst nicht mit.",
  quizmasterButton: "Lobby öffnen ▶",
  roomNote: "Sendet das Quiz an die Seite. Beitreten kann nur, wer den Code hat. Gelöscht wird es, wenn du es beendest, spätestens aber drei Stunden nach der letzten Benutzung. Die .zip-Datei ist die Kopie, die dir bleibt.",
  peersNotHere: "Diese Seite kann ein Quiz noch nicht so spielen.",
  start: "Start ▶",
  result: "Ergebnis",
  playAgain: "Nochmals spielen ▶",
  copyAnswers: "Antworten für deine KI kopieren",
  copiedAnswers: "Kopiert: Füg es in den Chat mit deiner KI ein",
  soloAi: "Deine KI kann dir einen Fehler erklären oder eine Lösung prüfen, die falsch aussieht.",
  backArrow: "← Zurück",
  projector: "Grossbildschirm",
  remote: "Fernbedienung",
  remoteConnected: "Fernbedienung verbunden",
  remoteGoneHere: "Fernbedienung weg – gesteuert wird hier",
  remoteGone: "Fernbedienung weg",
  projectorGone: "Grossbildschirm weg.",
  secondDevice: (s, c) => `Ein zweites Gerät, um damit zu steuern oder das Quiz darauf zu zeigen: auf <strong>${s}</strong> <strong class="digits">${c}</strong> eingeben.`,
  secondDeviceWindow: (l) => ` Oder mit einem Klick ${l}.`,
  newWindowLink: "einen zweiten Bildschirm in einem neuen Fenster öffnen",
  checkHowTo: (s, c) => `Auf dem zweiten Gerät <strong>${s}</strong> öffnen und <strong class="digits">${c}</strong> eingeben.`,
  checkHowToWindow: (l) => ` Mit zwei Bildschirmen an diesem Computer: ${l}.`,
  joinCode: "Code zum Beitreten",
  arrangeAsk: "Wie sind die Bildschirme eingerichtet?",
  oneScreen: "Ein Bildschirm",
  oneScreenLine: "Er zeigt das Quiz und steuert es: mit den Knöpfen unter dem Quiz, der Tastatur oder einem Presenter.",
  screenAndRemote: "Bildschirm und Fernbedienung",
  screenAndRemoteLine: "Ein Gerät zeigt das Quiz, ein anderes steuert es, zum Beispiel ein Handy.",
  videoCall: "In einem Videocall ist das Fenster, das du teilst, der Bildschirm, den alle sehen.",
  letIn: "Alle hereinlassen",
  moreMenu: "⋯ Mehr",
  nobodyYet: (s, l) => `Noch niemand da? Wenn Handys und Tablets ${s} nicht öffnen können, sperrt es vielleicht ihr Netzwerk: ${l}`,
  backToCheck: "‹ Zurück",
  secondDeviceLink: "Ein zweites Gerät ›",
  remoteGoneSecond: "Fernbedienung weg: ein zweites Gerät ›",
  swapScreens: "⇄ Bildschirme tauschen",
  fullScreen: "Vollbild (F)",
  dragHint: "Zieh dieses Fenster auf den Grossbildschirm und drück dann F für Vollbild.",
  zoomBack: "Zurück zur Frage (Z)",
  zoomIn: "Bild vergrössern (Z)",
  players: "Wer ist dabei",
  swapHere: "⇄ Tauschen: hier steuern, das Quiz auf dem anderen Gerät zeigen",
  secondDeviceMenu: "Ein zweites Gerät…",
  stopShowing: "Das Quiz hier nicht mehr zeigen",
  deleteQuiz: "Quiz löschen…",
  playersHint: "Blasse Avatare sind gerade weg; sie kommen von selbst zurück. Tippe einen an, um ihn zu entfernen, zum Beispiel einen doppelten.",
  confirmStopShowing: "Das Quiz auf diesem Bildschirm nicht mehr zeigen?",
  confirmStopShowingLast: (s, c) => `Das Quiz auf diesem Bildschirm nicht mehr zeigen? Dann steuert es nichts mehr, bis ein Gerät dazukommt: auf ${s} ${c} eingeben.`,
  popupBlocked: (c) => `Der Browser hat das neue Fenster blockiert. Erlaube Pop-ups für diese Seite, oder öffne sie in einem anderen Fenster und gib ${c} ein.`,
  swap: "⇄ Tauschen",
  joined: (n) => `${n} dabei`,
  onProjector: (s, c) => `Am Computer des Grossbildschirms: auf <strong>${s}</strong> <strong class="digits">${c}</strong> eingeben.`,
  onProjectorWindow: (l) => ` Oder hier ${l}.`,
  projectorWindowLink: "das Fenster für den Grossbildschirm öffnen",
  waitingFor: "Warten auf",
  hiddenOnProjector: "Am Grossbildschirm verborgen.",
  zoomBackProjector: "Am Grossbildschirm zurück zur Frage",
  zoomInProjector: "Am Grossbildschirm vergrössern",
  notCounted: "Diese Frage zählt nicht.",
  answered: (a, p, w) => `Geantwortet: <strong>${a}</strong> von ${p}${w ? ` · weg: ${w}` : ""}`,
  reading: "Die Optionen sind verdeckt: Alle lesen die Frage.",
  locked: "Niemand kann mehr antworten. Der Grossbildschirm zeigt, wie alle geantwortet haben, noch nicht die Lösung.",
  rightOf: (n) => `richtig · ${n} ${n === 1 ? "Frage" : "Fragen"}`,
  hideQuestions: "Fragen verbergen",
  allQuestions: "Alle Fragen",
  swapSteerOther: "⇄ Tauschen: das Quiz hier zeigen, vom anderen Gerät steuern",
  typeOn: (s, c) => `Auf ${s} ${c} eingeben.`,
  stopSteering: "Nicht mehr von hier steuern",
  confirmStopSteering: (s, c) => `Nicht mehr von diesem Gerät steuern? Dann steuert wieder der Grossbildschirm. Um wieder zu steuern: auf ${s} ${c} eingeben.`,
  unreached: "Dieses Gerät erreicht das Quiz nicht.",
  unreachedTell: "Dieses Gerät erreicht das Quiz nicht. Sag es der Person, die das Quiz leitet.",
  needsDigits: "Dieses Quiz braucht jetzt seinen Code und zwei weitere Ziffern.",
  noQuizCode: (c) => `Kein Quiz mit dem Code ${c}.`,
  quizCode: "Code des Quiz",
  go: "los",
  showOrSteer: "zeigen oder steuern",
  showOrSteerH: "Ein Quiz von hier aus zeigen oder steuern",
  codeAndDigits: "Der Code des Quiz und zwei weitere Ziffern:",
  digitsShown: "Der Bildschirm, auf dem das Quiz läuft, zeigt sie.",
  entryFull: "Dieses Quiz hat schon einen Bildschirm, der es zeigt, und einen, der es steuert.",
  entryFullAgain: "War einer davon eben noch auf diesem Gerät, versuch es in einer halben Minute nochmals.",
  tryAgain: "Nochmals versuchen",
  showHere: "Das Quiz hier zeigen",
  showHereSmall: "alle schauen auf diesen Bildschirm",
  steerHere: "Von hier steuern",
  steerHereSmall: "Start, weiter, die Lösung",
  newAvatar: "neu",
  onlyYou: "Bisher nur du.",
  inWithYou: (n) => `${n} dabei, du auch.`,
  movesOn: "Das Quiz geht weiter, sobald alle geantwortet haben.",
  startsOnce: "startet das Quiz, sobald alle da sind.",
  exitEverywhere: "Damit endet das Quiz auf allen Geräten.",
  nowWithout: (s) => `${s} jetzt, ohne zu warten`,
  removeSomeone: "Jemanden entfernen…",
  friendsJoin: (s) => `Freunde treten auf <b>${s}</b> bei, mit dem Code`,
  orQr: "oder mit dem QR-Code.",
  animals: ["Katze", "Hund", "Fuchs", "Bär", "Hase", "Eule", "Frosch", "Schwein", "Maus", "Löwe", "Panda", "Pinguin"],
  backgrounds: ["Kreis", "Sechseck", "Stern", "Herz", "Blume", "Teich"],
  hats: ["", "Krone", "Zylinder", "Schirmmütze", "Zauberhut", "Partyhut", "Blume", "Wollmütze", "Wikingerhelm", "Melone"],
  tools: ["", "Laptop", "Diagramm", "Taschenrechner", "Kaffee", "Aktentasche", "Buch", "Fliege"],
  shapes: ["Dreieck", "Raute", "Kreis", "Quadrat"],
  server: {},
};

const fr: RoomText = {
  status: { live: "Connecté", offline: "Connexion perdue — reconnexion en cours", connecting: "Connexion en cours" },
  connecting: "Connexion en cours",
  tapToContinue: "Touchez pour continuer",
  countdown: "Décompte",
  questions: (n) => `${n} ${n === 1 ? "question" : "questions"}`,
  question: (n) => `Question ${n}`,
  ownCopy: (s) => `Pour davantage de quiz, un site à vous, à votre école ou à votre entreprise : ${s}/own-copy explique comment faire.`,
  classesFull: (a) => `Le site gratuit ne peut plus accueillir de groupe aujourd'hui : les quiz en cours utilisent ce qui reste. Il en accepte de nouveau à partir de ${at(a, (t) => `${t}, heure suisse`)}.`,
  roomsFull: (a) => `Le site gratuit n'accepte plus de nouveaux quiz aujourd'hui : ceux qui tournent en ce moment utilisent ce qui reste. Il en accepte de nouveau à partir de ${at(a, (t) => `${t}, heure suisse`)}.`,
  nearlyFull: (r) => `Le site gratuit est presque complet aujourd'hui : il reste de la place pour ${r === 1 ? "un seul groupe" : `environ ${r} groupes`}.`,
  close: "Fermer",
  more: "plus",
  back: "retour",
  menu: "menu",
  remove: "retirer",
  picture: "image",
  background: "arrière-plan",
  tagNow: "en cours",
  tagDone: "passée",
  tagSkipped: "sautée",
  tagVoid: "ne compte pas",
  tagHidden: "image masquée",
  tagRight: (n) => `${n} ${n < 2 ? "juste" : "justes"}`,
  tagChanged: "modifiée",
  leftOut: "(image laissée de côté)",
  tapRight: "Touchez chaque proposition juste.",
  countAgain: "La compter de nouveau",
  dontCount: "Ne pas compter cette question",
  showAfterAll: "La montrer quand même",
  skipIt: "La sauter",
  showPicture: "Remontrer l'image",
  hidePicture: "Masquer l'image",
  done: "Terminé",
  changeSolution: "Modifier la solution",
  changeSolutionSeen: "Modifier la solution – tout le monde la voit",
  showSolutions: "Afficher les solutions",
  hideSolutions: "Masquer les solutions",
  behindEvery: "derrière chaque question",
  confirmFinish: "Afficher maintenant le classement final ? Les questions pas encore montrées sont laissées de côté.",
  confirmSkip: "Sauter cette question ? Elle ne comptera pas.",
  confirmRemove: "Retirer cet avatar ? Ses réponses ne comptent plus. C'est pour un doublon, ou un appareil qui n'a rien à faire ici.",
  confirmDelete: (t) => (t ? `Supprimer « ${t} » ? Plus personne ne pourra le rejoindre.` : "Supprimer ce quiz ? Plus personne ne pourra le rejoindre."),
  skipQuestion: "Sauter cette question",
  endQuiz: "Terminer le quiz : classement final",
  speedSwitch: "Points de rapidité",
  speedNote: `Une bonne réponse vaut ${POINTS_RIGHT}, et jusqu'à ${SPEED_BONUS} de plus si elle arrive vite.`,
  choices: "Propositions",
  answers: "Réponses",
  closesAnswering: "clôt les réponses",
  solution: "Solution",
  ranking: "Classement",
  finalRanking: "Classement final",
  countdownNote: `${LAST_CALL_MS / 1000} s, puis clôture`,
  startQuiz: "Lancer le quiz",
  exit: "Terminer",
  exitNote: "le quiz pour tous",
  nothingOpenH: "Aucun quiz ouvert ici",
  nothingOpen: "Un quiz s'ouvre sur la page d'accueil, à partir du fichier .zip de votre IA. Cette page n'en garde rien dès qu'elle est rechargée ou fermée : ouvrez de nouveau le .zip sur la page d'accueil.",
  toStart: "Vers la page d'accueil",
  howPlayed: "Comment se jouera le quiz ?",
  foldName: "Les questions et leurs solutions",
  notes: (n) => `${n} ${n === 1 ? "remarque" : "remarques"} du site`,
  foldHint: "Si vous jouez vous-même, laissez ceci fermé.",
  picQuizmaster: "Une enseignante devant le grand écran avec la question, le téléphone à la main ; la classe répond sur des tablettes.",
  picPeers: "Trois amis sur un canapé le soir, chacun avec la question sur son téléphone, l'un d'eux rit.",
  picSolo: "Une personne seule à son bureau avec ses notes, la question sur son téléphone, la bonne réponse tout juste trouvée.",
  soloLine: "Pour vous exercer ou réviser. Chaque réponse affiche aussitôt la solution, et le score vient à la fin.",
  soloButton: "Jouer ▶",
  soloNote: "Se joue dans cet onglet. Rien n'est envoyé au site. Recharger ou fermer l'onglet y met fin.",
  peersLine: "Entre amis, chacun sur son appareil. Personne n'anime : le quiz avance dès que tout le monde a répondu.",
  peersButton: "Jouer ensemble ▶",
  quizmasterLine: "Pour une classe ou un groupe : les questions sur grand écran, les réponses sur l'appareil de chacun. Vous animez sans jouer.",
  quizmasterButton: "Ouvrir le salon ▶",
  roomNote: "Envoie le quiz au site, où seules les personnes qui ont son code peuvent le rejoindre. Il est supprimé quand vous y mettez fin, au plus tard trois heures après sa dernière utilisation. Le fichier .zip reste votre copie.",
  peersNotHere: "Ce site ne peut pas encore faire jouer un quiz de cette façon.",
  start: "Commencer ▶",
  result: "Résultat",
  playAgain: "Rejouer ▶",
  copyAnswers: "Copier les réponses pour votre IA",
  copiedAnswers: "Copié : collez-le dans le chat avec votre IA",
  soloAi: "Votre IA peut vous expliquer une erreur, ou vérifier une solution qui semble fausse.",
  backArrow: "← Retour",
  projector: "Grand écran",
  remote: "Télécommande",
  remoteConnected: "Télécommande connectée",
  remoteGoneHere: "Télécommande déconnectée – le pilotage revient ici",
  remoteGone: "Télécommande déconnectée",
  projectorGone: "Grand écran déconnecté.",
  secondDevice: (s, c) => `Un deuxième appareil, pour piloter le quiz ou pour l'afficher : sur <strong>${s}</strong>, tapez <strong class="digits">${c}</strong>.`,
  secondDeviceWindow: (l) => ` Ou, d'un clic, ${l}.`,
  newWindowLink: "ouvrez un deuxième écran dans une nouvelle fenêtre",
  checkHowTo: (s, c) => `Sur le deuxième appareil, ouvrez <strong>${s}</strong> et tapez <strong class="digits">${c}</strong>.`,
  checkHowToWindow: (l) => ` Avec deux écrans sur cet ordinateur : ${l}.`,
  joinCode: "Code pour participer",
  arrangeAsk: "Comment les écrans sont-ils disposés ?",
  oneScreen: "Un seul écran",
  oneScreenLine: "Il affiche le quiz et le pilote : avec les boutons sous le quiz, le clavier ou un pointeur de présentation.",
  screenAndRemote: "Écran et télécommande",
  screenAndRemoteLine: "Un appareil affiche le quiz, un autre le pilote : un téléphone, par exemple.",
  videoCall: "En visioconférence, la fenêtre que vous partagez est l'écran que tout le monde voit.",
  letIn: "Faire entrer tout le monde",
  moreMenu: "⋯ Plus",
  nobodyYet: (s, l) => `Toujours personne ? Si les téléphones et les tablettes n'arrivent pas à ouvrir ${s}, leur réseau le bloque peut-être : ${l}`,
  backToCheck: "‹ Retour",
  secondDeviceLink: "Un deuxième appareil ›",
  remoteGoneSecond: "Télécommande déconnectée : un deuxième appareil ›",
  swapScreens: "⇄ Échanger les écrans",
  fullScreen: "Plein écran (F)",
  dragHint: "Faites glisser cette fenêtre sur le grand écran, puis appuyez sur F pour le plein écran.",
  zoomBack: "Revenir à la question (Z)",
  zoomIn: "Agrandir l'image (Z)",
  players: "Participants",
  swapHere: "⇄ Échanger : piloter ici, afficher le quiz sur l'autre appareil",
  secondDeviceMenu: "Un deuxième appareil…",
  stopShowing: "Ne plus afficher le quiz ici",
  deleteQuiz: "Supprimer le quiz…",
  playersHint: "Les avatars pâles sont absents ; ils reviennent d'eux-mêmes. Touchez-en un pour le retirer, un doublon par exemple.",
  confirmStopShowing: "Ne plus afficher le quiz sur cet écran ?",
  confirmStopShowingLast: (s, c) => `Ne plus afficher le quiz sur cet écran ? Plus rien ne le pilote tant qu'aucun appareil ne le rejoint : tapez ${c} sur ${s}.`,
  popupBlocked: (c) => `Le navigateur a bloqué la nouvelle fenêtre. Autorisez les fenêtres pop-up pour ce site, ou ouvrez-le dans une autre fenêtre et tapez ${c}.`,
  swap: "⇄ Échanger",
  joined: (n) => `Présents : ${n}`,
  onProjector: (s, c) => `Sur l'ordinateur du grand écran : sur <strong>${s}</strong>, tapez <strong class="digits">${c}</strong>.`,
  onProjectorWindow: (l) => ` Ou ${l} ici.`,
  projectorWindowLink: "ouvrez la fenêtre du grand écran",
  waitingFor: "En attente de",
  hiddenOnProjector: "Masquée sur le grand écran.",
  zoomBackProjector: "Revenir à la question sur le grand écran",
  zoomInProjector: "Agrandir sur le grand écran",
  notCounted: "Cette question ne compte pas.",
  answered: (a, p, w) => `Réponses : <strong>${a}</strong> sur ${p}${w ? ` · absents : ${w}` : ""}`,
  reading: "Les propositions sont masquées : tout le monde lit la question.",
  locked: "Réponses closes. Le grand écran montre comment chacun a répondu, pas encore la solution.",
  rightOf: (n) => `justes · ${n} ${n === 1 ? "question" : "questions"}`,
  hideQuestions: "Masquer les questions",
  allQuestions: "Toutes les questions",
  swapSteerOther: "⇄ Échanger : afficher le quiz ici, piloter depuis l'autre appareil",
  typeOn: (s, c) => `Sur ${s}, tapez ${c}.`,
  stopSteering: "Ne plus piloter d'ici",
  confirmStopSteering: (s, c) => `Ne plus piloter depuis cet appareil ? Le grand écran reprend le pilotage. Pour piloter de nouveau : sur ${s}, tapez ${c}.`,
  unreached: "Cet appareil n'arrive pas à joindre le quiz.",
  unreachedTell: "Cet appareil n'arrive pas à joindre le quiz. Prévenez la personne qui l'anime.",
  needsDigits: "Ce quiz demande maintenant son code et deux chiffres de plus.",
  noQuizCode: (c) => `Aucun quiz avec le code ${c}.`,
  quizCode: "Code du quiz",
  go: "valider",
  showOrSteer: "afficher ou piloter",
  showOrSteerH: "Afficher ou piloter un quiz d'ici",
  codeAndDigits: "Le code du quiz et deux chiffres de plus :",
  digitsShown: "L'écran sur lequel tourne le quiz les affiche.",
  entryFull: "Ce quiz a déjà un écran qui l'affiche et un autre qui le pilote.",
  entryFullAgain: "Si l'un des deux était sur cet appareil il y a un instant, réessayez dans une demi-minute.",
  tryAgain: "Réessayer",
  showHere: "Afficher le quiz ici",
  showHereSmall: "tout le monde regarde cet écran",
  steerHere: "Le piloter d'ici",
  steerHereSmall: "départ, suite, solution",
  newAvatar: "nouveau",
  onlyYou: "Personne d'autre pour l'instant.",
  inWithYou: (n) => `${n} dans le quiz, vous compris.`,
  movesOn: "Le quiz avance dès que tout le monde a répondu.",
  startsOnce: "lance le quiz dès que tout le monde est là.",
  exitEverywhere: "Cela termine le quiz sur tous les appareils.",
  nowWithout: (s) => `${s} maintenant, sans attendre`,
  removeSomeone: "Retirer quelqu'un…",
  friendsJoin: (s) => `Vos amis rejoignent sur <b>${s}</b> avec le code`,
  orQr: "ou avec le code QR.",
  animals: ["chat", "chien", "renard", "ours", "lapin", "chouette", "grenouille", "cochon", "souris", "lion", "panda", "pingouin"],
  backgrounds: ["cercle", "hexagone", "étoile", "cœur", "fleur", "mare"],
  hats: ["", "couronne", "haut-de-forme", "casquette", "chapeau de sorcier", "chapeau de fête", "fleur", "bonnet", "casque de viking", "chapeau melon"],
  tools: ["", "ordinateur portable", "graphique", "calculatrice", "café", "mallette", "livre", "nœud papillon"],
  shapes: ["triangle", "losange", "cercle", "carré"],
  server: {},
};

const it: RoomText = {
  status: { live: "Connesso", offline: "Connessione persa — nuovo collegamento in corso", connecting: "Collegamento in corso" },
  connecting: "Collegamento in corso",
  tapToContinue: "Tocca per continuare",
  countdown: "Countdown",
  questions: (n) => `${n} ${n === 1 ? "domanda" : "domande"}`,
  question: (n) => `Domanda ${n}`,
  ownCopy: (s) => `Per avere più quiz, un sito tuo, della tua scuola o della tua azienda: su ${s}/own-copy trovi come fare.`,
  classesFull: (a) => `Per oggi il sito gratuito non può far entrare un altro gruppo: i quiz in corso usano ciò che resta. Ne accetta di nuovo dalle ${at(a, (t) => `${t}, ora svizzera`)}.`,
  roomsFull: (a) => `Per oggi il sito gratuito non può accettare altri quiz: quelli in corso usano ciò che resta. Ne accetta di nuovo dalle ${at(a, (t) => `${t}, ora svizzera`)}.`,
  nearlyFull: (r) => `Oggi il sito gratuito è quasi pieno: c'è posto ${r === 1 ? "per un solo altro gruppo" : `per circa altri ${r} gruppi`}.`,
  close: "Chiudi",
  more: "altro",
  back: "indietro",
  menu: "menu",
  remove: "rimuovi",
  picture: "immagine",
  background: "sfondo",
  tagNow: "in corso",
  tagDone: "fatta",
  tagSkipped: "saltata",
  tagVoid: "non conta",
  tagHidden: "immagine nascosta",
  tagRight: (n) => `${n} ${n === 1 ? "giusta" : "giuste"}`,
  tagChanged: "modificata",
  leftOut: "(immagine esclusa)",
  tapRight: "Tocca ogni opzione giusta.",
  countAgain: "Falla contare di nuovo",
  dontCount: "Non contare questa domanda",
  showAfterAll: "Mostrala comunque",
  skipIt: "Saltala",
  showPicture: "Mostra di nuovo l'immagine",
  hidePicture: "Nascondi l'immagine",
  done: "Fatto",
  changeSolution: "Cambia la soluzione",
  changeSolutionSeen: "Cambia la soluzione – la vedono tutti",
  showSolutions: "Mostra le soluzioni",
  hideSolutions: "Nascondi le soluzioni",
  behindEvery: "dietro ogni domanda",
  confirmFinish: "Mostrare ora la classifica finale? Le domande non ancora mostrate restano fuori.",
  confirmSkip: "Saltare questa domanda? Non conterà.",
  confirmRemove: "Rimuovere questo avatar? Le sue risposte non contano più. Serve per un doppione, o per un dispositivo che non c'entra.",
  confirmDelete: (t) => (t ? `Eliminare «${t}»? Nessuno potrà più entrarci.` : "Eliminare questo quiz? Nessuno potrà più entrarci."),
  skipQuestion: "Salta questa domanda",
  endQuiz: "Termina il quiz: classifica finale",
  speedSwitch: "Punti per la velocità",
  speedNote: `Una risposta giusta vale ${POINTS_RIGHT}, e fino a ${SPEED_BONUS} in più se arriva in fretta.`,
  choices: "Opzioni",
  answers: "Risposte",
  closesAnswering: "chiude le risposte",
  solution: "Soluzione",
  ranking: "Classifica",
  finalRanking: "Classifica finale",
  countdownNote: `${LAST_CALL_MS / 1000} s, poi chiude`,
  startQuiz: "Avvia il quiz",
  exit: "Termina",
  exitNote: "il quiz per tutti",
  nothingOpenH: "Nessun quiz aperto qui",
  nothingOpen: "Un quiz si apre dalla pagina iniziale, dal file .zip della tua IA. Questa pagina non ne conserva nulla quando viene ricaricata o chiusa: apri di nuovo il file .zip dalla pagina iniziale.",
  toStart: "Alla pagina iniziale",
  howPlayed: "Come si giocherà il quiz?",
  foldName: "Le domande e le loro soluzioni",
  notes: (n) => `${n} ${n === 1 ? "nota" : "note"} del sito`,
  foldHint: "Se giochi anche tu, lascia chiuso.",
  picQuizmaster: "Un'insegnante davanti allo schermo grande con la domanda, il telefono in mano; la classe risponde sui tablet.",
  picPeers: "Tre amici sul divano di sera, ognuno con la domanda sul proprio telefono, uno di loro ride.",
  picSolo: "Una persona sola alla scrivania con i suoi appunti, la domanda sul telefono, la risposta giusta appena trovata.",
  soloLine: "Per conto tuo, per esercitarti o ripassare. Dopo ogni risposta vedi subito la soluzione, e alla fine il punteggio.",
  soloButton: "Gioca ▶",
  soloNote: "Si gioca in questa scheda. Al sito non viene inviato nulla. Ricaricare o chiudere la scheda lo termina.",
  peersLine: "Tra amici, ognuno sul suo dispositivo. Nessuno conduce: il quiz va avanti appena tutti hanno risposto.",
  peersButton: "Gioca insieme ▶",
  quizmasterLine: "Per una classe o un gruppo: le domande su schermo grande, le risposte sul dispositivo di ognuno. Tu conduci e non giochi.",
  quizmasterButton: "Apri la lobby ▶",
  roomNote: "Invia il quiz al sito, dove può entrare solo chi ha il codice. Viene eliminato quando lo termini, al più tardi tre ore dopo l'ultimo uso. Il file .zip resta la tua copia.",
  peersNotHere: "Questo sito non può ancora far giocare un quiz in questo modo.",
  start: "Inizia ▶",
  result: "Risultato",
  playAgain: "Gioca ancora ▶",
  copyAnswers: "Copia le risposte per la tua IA",
  copiedAnswers: "Copiato: incollalo nella chat con la tua IA",
  soloAi: "La tua IA può spiegarti un errore o controllare una soluzione che sembra sbagliata.",
  backArrow: "← Indietro",
  projector: "Schermo grande",
  remote: "Telecomando",
  remoteConnected: "Telecomando collegato",
  remoteGoneHere: "Telecomando assente – si comanda da qui",
  remoteGone: "Telecomando assente",
  projectorGone: "Schermo grande assente.",
  secondDevice: (s, c) => `Un secondo dispositivo, per comandare il quiz o per mostrarlo: su <strong>${s}</strong>, digita <strong class="digits">${c}</strong>.`,
  secondDeviceWindow: (l) => ` Oppure, con un clic, ${l}.`,
  newWindowLink: "apri un secondo schermo in una nuova finestra",
  checkHowTo: (s, c) => `Sul secondo dispositivo, apri <strong>${s}</strong> e digita <strong class="digits">${c}</strong>.`,
  checkHowToWindow: (l) => ` Con due schermi su questo computer: ${l}.`,
  joinCode: "Codice per entrare",
  arrangeAsk: "Come sono disposti gli schermi?",
  oneScreen: "Uno schermo",
  oneScreenLine: "Mostra il quiz e lo comanda: con i pulsanti sotto il quiz, la tastiera o un puntatore per presentazioni.",
  screenAndRemote: "Schermo e telecomando",
  screenAndRemoteLine: "Un dispositivo mostra il quiz, un altro lo comanda: per esempio un telefono.",
  videoCall: "In una videochiamata, la finestra che condividi è lo schermo che vedono tutti.",
  letIn: "Fai entrare tutti",
  moreMenu: "⋯ Altro",
  nobodyYet: (s, l) => `Ancora nessuno? Se telefoni e tablet non riescono ad aprire ${s}, forse la loro rete lo blocca: ${l}`,
  backToCheck: "‹ Indietro",
  secondDeviceLink: "Un secondo dispositivo ›",
  remoteGoneSecond: "Telecomando assente: un secondo dispositivo ›",
  swapScreens: "⇄ Scambia gli schermi",
  fullScreen: "Schermo intero (F)",
  dragHint: "Trascina questa finestra sullo schermo grande, poi premi F per lo schermo intero.",
  zoomBack: "Torna alla domanda (Z)",
  zoomIn: "Ingrandisci l'immagine (Z)",
  players: "Partecipanti",
  swapHere: "⇄ Scambia: comanda da qui, mostra il quiz sull'altro dispositivo",
  secondDeviceMenu: "Un secondo dispositivo…",
  stopShowing: "Non mostrare più il quiz qui",
  deleteQuiz: "Elimina il quiz…",
  playersHint: "Gli avatar sbiaditi sono assenti; tornano da soli. Toccane uno per rimuoverlo, per esempio un doppione.",
  confirmStopShowing: "Non mostrare più il quiz su questo schermo?",
  confirmStopShowingLast: (s, c) => `Non mostrare più il quiz su questo schermo? Niente lo comanda finché non entra un dispositivo: digita ${c} su ${s}.`,
  popupBlocked: (c) => `Il browser ha bloccato la nuova finestra. Consenti i pop-up per questo sito, oppure aprilo in un'altra finestra e digita ${c}.`,
  swap: "⇄ Scambia",
  joined: (n) => `Presenti: ${n}`,
  onProjector: (s, c) => `Sul computer dello schermo grande: su <strong>${s}</strong>, digita <strong class="digits">${c}</strong>.`,
  onProjectorWindow: (l) => ` Oppure ${l}.`,
  projectorWindowLink: "apri qui la finestra dello schermo grande",
  waitingFor: "In attesa di",
  hiddenOnProjector: "Nascosta sullo schermo grande.",
  zoomBackProjector: "Torna alla domanda sullo schermo grande",
  zoomInProjector: "Ingrandisci sullo schermo grande",
  notCounted: "Questa domanda non conta.",
  answered: (a, p, w) => `Risposte: <strong>${a}</strong> su ${p}${w ? ` · assenti: ${w}` : ""}`,
  reading: "Le opzioni sono nascoste: tutti leggono la domanda.",
  locked: "Risposte chiuse. Lo schermo grande mostra come hanno risposto tutti, non ancora la soluzione.",
  rightOf: (n) => `giuste · ${n} ${n === 1 ? "domanda" : "domande"}`,
  hideQuestions: "Nascondi le domande",
  allQuestions: "Tutte le domande",
  swapSteerOther: "⇄ Scambia: mostra il quiz qui, comanda dall'altro dispositivo",
  typeOn: (s, c) => `Su ${s}, digita ${c}.`,
  stopSteering: "Non comandare più da qui",
  confirmStopSteering: (s, c) => `Non comandare più da questo dispositivo? Lo schermo grande torna a comandare. Per comandare di nuovo: su ${s}, digita ${c}.`,
  unreached: "Questo dispositivo non riesce a raggiungere il quiz.",
  unreachedTell: "Questo dispositivo non riesce a raggiungere il quiz. Avvisa chi lo conduce.",
  needsDigits: "Questo quiz ora richiede il suo codice e altre due cifre.",
  noQuizCode: (c) => `Nessun quiz con il codice ${c}.`,
  quizCode: "Codice del quiz",
  go: "vai",
  showOrSteer: "mostrare o comandare",
  showOrSteerH: "Mostra o comanda un quiz da qui",
  codeAndDigits: "Il codice del quiz e altre due cifre:",
  digitsShown: "Lo schermo su cui gira il quiz le mostra.",
  entryFull: "Questo quiz ha già uno schermo che lo mostra e uno che lo comanda.",
  entryFullAgain: "Se uno dei due era su questo dispositivo poco fa, riprova tra mezzo minuto.",
  tryAgain: "Riprova",
  showHere: "Mostra il quiz qui",
  showHereSmall: "tutti guardano questo schermo",
  steerHere: "Comandalo da qui",
  steerHereSmall: "avvio, avanti, la soluzione",
  newAvatar: "nuovo",
  onlyYou: "Per ora ci sei solo tu.",
  inWithYou: (n) => `${n} in gioco, contando te.`,
  movesOn: "Il quiz va avanti appena tutti hanno risposto.",
  startsOnce: "avvia il quiz quando ci sono tutti.",
  exitEverywhere: "Così il quiz termina su tutti i dispositivi.",
  nowWithout: (s) => `${s} ora, senza aspettare`,
  removeSomeone: "Rimuovi qualcuno…",
  friendsJoin: (s) => `Gli amici entrano su <b>${s}</b> con il codice`,
  orQr: "o con il codice QR.",
  animals: ["gatto", "cane", "volpe", "orso", "coniglio", "gufo", "rana", "maiale", "topo", "leone", "panda", "pinguino"],
  backgrounds: ["cerchio", "esagono", "stella", "cuore", "fiore", "stagno"],
  hats: ["", "corona", "cilindro", "cappellino", "cappello da mago", "cappello da festa", "fiore", "berretto", "elmo vichingo", "bombetta"],
  tools: ["", "portatile", "grafico", "calcolatrice", "caffè", "valigetta", "libro", "papillon"],
  shapes: ["triangolo", "rombo", "cerchio", "quadrato"],
  server: {},
};

// The server's fixed messages, by their English words. The ones with a time
// in them (the site full for the day) are recognised by their start, in said().
de.server = {
  [CLASS_FULL]: "Dieses Quiz ist voll. Frag die Person, die es leitet.",
  [CLASS_WAITING]: "Gleich kann man beitreten.",
  [CLASS_STARTED]: "Dieses Quiz hat schon begonnen und nimmt niemanden mehr auf. Frag die Person, die es leitet.",
  [ROOM_FULL]: "Dieses Quiz ist voll: Es nimmt niemanden mehr auf.",
  [ROOM_STARTED]: "Dieses Quiz hat schon begonnen und nimmt niemanden mehr auf.",
  [WRONG_TEACHER_CODE]: "Die letzten zwei Ziffern passen nicht zu diesem Quiz.",
  [TOO_MANY_CODES]: "Zu viele falsche Codes für dieses Quiz. Versuch es in ein paar Minuten nochmals.",
  "This quiz has ended.": "Dieses Quiz ist beendet.",
  "This quiz has been ended.": "Dieses Quiz wurde beendet.",
  "Nobody is playing this quiz right now.": "Gerade spielt niemand dieses Quiz.",
  "This quiz has finished.": "Dieses Quiz ist zu Ende.",
  "The quiz has already started.": "Das Quiz hat schon begonnen.",
  "The choices are already shown.": "Die Optionen sind schon zu sehen.",
  "Answering is already closed.": "Das Antworten ist schon beendet.",
  "The countdown is already running.": "Der Countdown läuft schon.",
  "There is no open question.": "Gerade ist keine Frage offen.",
  "The choices aren't shown yet.": "Die Optionen sind noch nicht zu sehen.",
  "There is no open question to reveal.": "Gerade ist keine Frage offen.",
  "Points for speed are set before the start.": "Punkte fürs Tempo werden vor dem Start festgelegt.",
  "Show the solution first.": "Zuerst die Lösung zeigen.",
  "The ranking comes after the solution.": "Die Rangliste kommt nach der Lösung.",
  "Nothing to step on to.": "Hier geht es nicht weiter.",
  "Nothing to go on to.": "Hier geht es nicht weiter.",
  "No such question.": "Diese Frage gibt es nicht.",
  "The choices don't match the question.": "Die Optionen passen nicht zur Frage.",
  "At least one choice has to be right. For none, don't count the question.": "Mindestens eine Option muss richtig sein. Ist keine richtig, die Frage nicht zählen.",
  "Everyone has seen this question already: it can't be skipped any more, only not counted.": "Alle haben diese Frage schon gesehen: Überspringen lässt sie sich nicht mehr. Du kannst nur noch festlegen, dass sie nicht zählt.",
  "The quiz has moved past this question; it can't come back in this run.": "Das Quiz ist schon über diese Frage hinaus: Sie kann in dieser Runde nicht mehr kommen.",
  "There is no question on screen.": "Gerade ist keine Frage zu sehen.",
  "This question has no picture on screen.": "Diese Frage zeigt kein Bild.",
  "There is no open question to skip.": "Gerade ist keine Frage offen.",
  "The quiz with its pictures is too large.": "Das Quiz ist mit seinen Bildern zu gross.",
  "The upload couldn't be read.": "Das gesendete Quiz liess sich nicht lesen. Versuch es nochmals.",
  "The request was too large or not readable.": "Die Anfrage war zu gross oder nicht lesbar.",
  "Something went wrong on the server. Try again.": "Auf dem Server ist etwas schiefgegangen. Versuch es nochmals.",
};

fr.server = {
  [CLASS_FULL]: "Ce quiz est complet. Demandez à la personne qui l'anime.",
  [CLASS_WAITING]: "Vous pourrez rejoindre le quiz dans un instant.",
  [CLASS_STARTED]: "Ce quiz a déjà commencé et n'accepte plus personne. Demandez à la personne qui l'anime.",
  [ROOM_FULL]: "Ce quiz est complet : il n'accepte plus personne.",
  [ROOM_STARTED]: "Ce quiz a déjà commencé et n'accepte plus personne.",
  [WRONG_TEACHER_CODE]: "Les deux derniers chiffres ne correspondent pas à ce quiz.",
  [TOO_MANY_CODES]: "Trop de codes erronés pour ce quiz. Réessayez dans quelques minutes.",
  "This quiz has ended.": "Ce quiz est terminé.",
  "This quiz has been ended.": "Ce quiz a été arrêté.",
  "Nobody is playing this quiz right now.": "Personne ne joue à ce quiz en ce moment.",
  "This quiz has finished.": "Ce quiz est fini.",
  "The quiz has already started.": "Le quiz a déjà commencé.",
  "The choices are already shown.": "Les propositions sont déjà affichées.",
  "Answering is already closed.": "Les réponses sont déjà closes.",
  "The countdown is already running.": "Le décompte est déjà lancé.",
  "There is no open question.": "Aucune question n'est ouverte.",
  "The choices aren't shown yet.": "Les propositions ne sont pas encore affichées.",
  "There is no open question to reveal.": "Aucune question n'est ouverte.",
  "Points for speed are set before the start.": "Les points de rapidité se règlent avant le départ.",
  "Show the solution first.": "Montrez d'abord la solution.",
  "The ranking comes after the solution.": "Le classement vient après la solution.",
  "Nothing to step on to.": "Il n'y a pas de suite.",
  "Nothing to go on to.": "Il n'y a pas de suite.",
  "No such question.": "Cette question n'existe pas.",
  "The choices don't match the question.": "Les propositions ne correspondent pas à la question.",
  "At least one choice has to be right. For none, don't count the question.": "Au moins une proposition doit être juste. Si aucune ne l'est, ne comptez pas la question.",
  "Everyone has seen this question already: it can't be skipped any more, only not counted.": "Tout le monde a déjà vu cette question : on ne peut plus la sauter, seulement ne pas la compter.",
  "The quiz has moved past this question; it can't come back in this run.": "Le quiz a déjà dépassé cette question : elle ne peut plus revenir dans cette partie.",
  "There is no question on screen.": "Aucune question n'est affichée.",
  "This question has no picture on screen.": "Cette question n'affiche pas d'image.",
  "There is no open question to skip.": "Aucune question n'est ouverte.",
  "The quiz with its pictures is too large.": "Le quiz est trop volumineux avec ses images.",
  "The upload couldn't be read.": "Le quiz envoyé n'a pas pu être lu. Réessayez.",
  "The request was too large or not readable.": "La requête était trop volumineuse ou illisible.",
  "Something went wrong on the server. Try again.": "Une erreur s'est produite sur le serveur. Réessayez.",
};

it.server = {
  [CLASS_FULL]: "Questo quiz è al completo. Chiedi a chi lo conduce.",
  [CLASS_WAITING]: "Tra un attimo si potrà entrare.",
  [CLASS_STARTED]: "Questo quiz è già iniziato e non accetta più nessuno. Chiedi a chi lo conduce.",
  [ROOM_FULL]: "Questo quiz è al completo: non accetta più nessuno.",
  [ROOM_STARTED]: "Questo quiz è già iniziato e non accetta più nessuno.",
  [WRONG_TEACHER_CODE]: "Le ultime due cifre non corrispondono a questo quiz.",
  [TOO_MANY_CODES]: "Troppi codici sbagliati per questo quiz. Riprova tra qualche minuto.",
  "This quiz has ended.": "Questo quiz è terminato.",
  "This quiz has been ended.": "Questo quiz è stato chiuso.",
  "Nobody is playing this quiz right now.": "Al momento nessuno sta giocando a questo quiz.",
  "This quiz has finished.": "Questo quiz è finito.",
  "The quiz has already started.": "Il quiz è già iniziato.",
  "The choices are already shown.": "Le opzioni sono già visibili.",
  "Answering is already closed.": "Le risposte sono già chiuse.",
  "The countdown is already running.": "Il countdown è già partito.",
  "There is no open question.": "Non c'è nessuna domanda aperta.",
  "The choices aren't shown yet.": "Le opzioni non sono ancora visibili.",
  "There is no open question to reveal.": "Non c'è nessuna domanda aperta.",
  "Points for speed are set before the start.": "I punti per la velocità si impostano prima dell'inizio.",
  "Show the solution first.": "Prima mostra la soluzione.",
  "The ranking comes after the solution.": "La classifica viene dopo la soluzione.",
  "Nothing to step on to.": "Non c'è un passo successivo.",
  "Nothing to go on to.": "Non c'è un passo successivo.",
  "No such question.": "Questa domanda non esiste.",
  "The choices don't match the question.": "Le opzioni non corrispondono alla domanda.",
  "At least one choice has to be right. For none, don't count the question.": "Almeno un'opzione deve essere giusta. Se nessuna lo è, non contare la domanda.",
  "Everyone has seen this question already: it can't be skipped any more, only not counted.": "Tutti hanno già visto questa domanda: non si può più saltare, solo non contare.",
  "The quiz has moved past this question; it can't come back in this run.": "Il quiz ha già superato questa domanda: in questa partita non può più tornare.",
  "There is no question on screen.": "Nessuna domanda sullo schermo.",
  "This question has no picture on screen.": "Questa domanda non mostra un'immagine.",
  "There is no open question to skip.": "Non c'è nessuna domanda aperta.",
  "The quiz with its pictures is too large.": "Il quiz con le sue immagini è troppo grande.",
  "The upload couldn't be read.": "Non è stato possibile leggere il quiz inviato. Riprova.",
  "The request was too large or not readable.": "La richiesta era troppo grande o illeggibile.",
  "Something went wrong on the server. Try again.": "Qualcosa è andato storto sul server. Riprova.",
};

export const ROOM_TEXT: Record<Lang, RoomText> = { de, en, fr, it };

export const lang: Lang = deviceLang();
export const T: RoomText = ROOM_TEXT[lang];
/** The messages these pages share with the root page, in this device's language (client/site-text.ts). */
export const SITE = SITE_WORDS[lang];

// The avatars' and the tiles' names, which the shared drawings say in English.
nameLooks(T);

/** The site's own address, as the refusals name it. */
const site = (): string => (typeof location === "undefined" ? "classyquiz.pages.dev" : location.host);

/**
 * A message from the server, or one of the server's rules run here (a fix on
 * the check), in this device's language. The day's caps are said again
 * here, with the time this browser works out; the server's wording is
 * recognised by its start. Anything else comes back as it was.
 */
export function said(msg: string): string {
  if (lang === "en") return msg;
  const known = T.server[msg];
  if (known) return known;
  const a = quotaResetAt();
  const own = T.ownCopy(site());
  if (msg.startsWith("The free site can't let another group in today")) return `${T.classesFull(a)} ${own}`;
  if (msg.startsWith("The free site can't take more quizzes today:")) return `${T.roomsFull(a)} ${own}`;
  if (msg.startsWith("The free site can't take more quizzes today.")) return `${SITE.siteFull("uploads", a)} ${own}`;
  if (msg.startsWith("The free site has no room for another quiz")) return `${SITE.siteFull("bytes", a)} ${own}`;
  if (msg.startsWith("The free site has used up today's allowance")) return `${SITE.quota(a)} ${own}`;
  if (msg === SITE_WORDS.en.notTaken) return SITE.notTaken;
  return msg;
}

/** The day's allowance spent, as the notice over every page says it (client/net.ts). */
export function quotaNotice(): string {
  return `${SITE.quota(quotaResetAt())} ${T.ownCopy(site())}`;
}

/** What a page's line to its quiz says over the page (client/net.ts, Line). */
export const LINE_WORDS = { asleep: T.tapToContinue, quota: quotaNotice };
