// The network check's words (/check, client/check.ts) in the four languages,
// in the device's language as on the room pages (client/room-text.ts). The
// static HTML is English, for a browser without scripts. The message for IT
// is the one a visitor sends to whoever looks after the network, so it is in
// the visitor's language and says what is asked without the site's own words.

import type { Lang } from "./landing-text.ts";

export interface CheckText {
  title: string;
  h1: string;
  lede: string;
  again: string;
  back: string;
  itH: string;
  /** Before the message: why nothing of the site opens, and that IT can change it. */
  itLede: string;
  /** The message for IT; `host` is this site's address, `now` what this device found, or "". */
  forIt: (host: string, now: string) => string;
  sendIt: string;
  http: string;
  ws: string;
  ms: (n: number) => string;
  status: (n: number) => string;
  noAnswer: string;
  blocked: string;
  noAnswerIn: (s: number) => string;
  blockedHere: string;
  unreachable: string;
  allGood: string;
  slower: string;
  nowBlocked: string;
  nowSlow: string;
}

const en: CheckText = {
  title: "classyQuiz · network check",
  h1: "Does the quiz get through this network?",
  lede: "Open this page on the computer that shows the quiz and on one player's device, on the network they will use. It takes a few seconds.",
  again: "Check again",
  back: "Back",
  itH: "If the site doesn't open at school or at work at all",
  itLede: "Some school and company networks block sites they don't know. Then nothing of the site opens there, this page included, and the check above can't run: read this at home or on a phone's mobile data. Whoever looks after the network can allow the site. What to send them:",
  forIt: (h, now) => `Please allow ${h} on our network. It is a quiz site: the players, a class or a group, answer on their own devices. It needs HTTPS and WebSocket connections to ${h}.${now ? ` ${now}` : ""}`,
  sendIt: "What to send IT:",
  http: "The site's server, over HTTP",
  ws: "Live connection (WebSocket)",
  ms: (n) => `${n} ms`,
  status: (n) => `answer ${n}`,
  noAnswer: "no answer",
  blocked: "blocked",
  noAnswerIn: (s) => `no answer within ${s} s`,
  blockedHere: "blocked by this network",
  unreachable: "This device can't reach the quiz's server: the network blocks it.",
  allGood: "All good: the quiz runs live on this network.",
  slower: "The quiz runs on this network, a little slower: answers and screens follow a moment later, because live connections are blocked. That is fine for playing. To make it live:",
  nowBlocked: "At the moment this network blocks it.",
  nowSlow: "At the moment the WebSocket connections are blocked, and the quiz runs more slowly.",
};

const de: CheckText = {
  title: "classyQuiz · Netzwerk-Check",
  h1: "Kommt das Quiz durch dieses Netzwerk?",
  lede: "Öffne diese Seite auf dem Computer, der das Quiz zeigt, und auf einem Gerät der Spielenden, im Netzwerk, das sie benutzen werden. Es dauert ein paar Sekunden.",
  again: "Nochmals prüfen",
  back: "Zurück",
  itH: "Wenn sich die Seite in der Schule oder bei der Arbeit gar nicht öffnet",
  itLede: "Manche Schul- und Firmennetze sperren Websites, die sie nicht kennen. Dann öffnet sich dort nichts von der Seite, auch diese hier nicht, und der Check oben kann nicht laufen: Lies das zu Hause oder über die mobilen Daten eines Handys. Wer das Netzwerk betreut, kann die Seite freigeben. Das kannst du schicken:",
  forIt: (h, now) => `Bitte geben Sie ${h} in unserem Netzwerk frei. Es ist eine Quiz-Website: Die Teilnehmenden, eine Klasse oder eine Gruppe, antworten auf ihren eigenen Geräten. Sie braucht HTTPS- und WebSocket-Verbindungen zu ${h}.${now ? ` ${now}` : ""}`,
  sendIt: "Das kannst du der IT schicken:",
  http: "Der Server der Seite, über HTTP",
  ws: "Live-Verbindung (WebSocket)",
  ms: (n) => `${n} ms`,
  status: (n) => `Antwort ${n}`,
  noAnswer: "keine Antwort",
  blocked: "blockiert",
  noAnswerIn: (s) => `keine Antwort innert ${s} s`,
  blockedHere: "von diesem Netzwerk blockiert",
  unreachable: "Dieses Gerät erreicht den Server des Quiz nicht: Das Netzwerk sperrt ihn.",
  allGood: "Alles bereit: Das Quiz läuft in diesem Netzwerk live.",
  slower: "Das Quiz läuft in diesem Netzwerk, etwas langsamer: Antworten und Bildschirme folgen einen Moment später, weil Live-Verbindungen gesperrt sind. Zum Spielen reicht das. Damit es live läuft:",
  nowBlocked: "Im Moment sperrt dieses Netzwerk die Website.",
  nowSlow: "Im Moment sind die WebSocket-Verbindungen gesperrt, und das Quiz läuft langsamer.",
};

const fr: CheckText = {
  title: "classyQuiz · test du réseau",
  h1: "Le quiz passe-t-il sur ce réseau ?",
  lede: "Ouvrez cette page sur l'ordinateur qui affiche le quiz et sur l'appareil d'une personne qui joue, sur le réseau qui sera utilisé. Cela prend quelques secondes.",
  again: "Tester de nouveau",
  back: "Retour",
  itH: "Si le site ne s'ouvre pas du tout à l'école ou au travail",
  itLede: "Certains réseaux d'écoles et d'entreprises bloquent les sites qu'ils ne connaissent pas. Rien du site ne s'ouvre alors, pas même cette page, et le test ci-dessus ne peut pas se faire : lisez ceci à la maison ou avec les données mobiles d'un téléphone. La personne qui gère le réseau peut autoriser le site. Que lui envoyer :",
  forIt: (h, now) => `Merci d'autoriser ${h} sur notre réseau. C'est un site de quiz : les participants, une classe ou un groupe, répondent sur leurs propres appareils. Il a besoin de connexions HTTPS et WebSocket vers ${h}.${now ? ` ${now}` : ""}`,
  sendIt: "Que dire au service informatique :",
  http: "Le serveur du site, en HTTP",
  ws: "Connexion en direct (WebSocket)",
  ms: (n) => `${n} ms`,
  status: (n) => `réponse ${n}`,
  noAnswer: "pas de réponse",
  blocked: "bloquée",
  noAnswerIn: (s) => `pas de réponse en ${s} s`,
  blockedHere: "bloquée par ce réseau",
  unreachable: "Cet appareil n'arrive pas à joindre le serveur du quiz : le réseau le bloque.",
  allGood: "Tout est prêt : le quiz tourne en direct sur ce réseau.",
  slower: "Le quiz tourne sur ce réseau, un peu plus lentement : réponses et écrans suivent avec un léger retard, car les connexions en direct sont bloquées. Pour jouer, cela suffit. Pour qu'il tourne en direct :",
  nowBlocked: "En ce moment, ce réseau bloque le site.",
  nowSlow: "En ce moment, les connexions WebSocket sont bloquées, et le quiz tourne plus lentement.",
};

const it: CheckText = {
  title: "classyQuiz · verifica della rete",
  h1: "Il quiz passa da questa rete?",
  lede: "Apri questa pagina sul computer che mostra il quiz e sul dispositivo di chi gioca, sulla rete che userete. Ci vuole qualche secondo.",
  again: "Verifica di nuovo",
  back: "Indietro",
  itH: "Se a scuola o al lavoro il sito non si apre per niente",
  itLede: "Alcune reti di scuole e aziende bloccano i siti che non conoscono. Allora lì non si apre niente del sito, nemmeno questa pagina, e la verifica qui sopra non può partire: leggi questo a casa o con i dati mobili di un telefono. Chi gestisce la rete può autorizzare il sito. Cosa mandargli:",
  forIt: (h, now) => `Per favore autorizzate ${h} sulla nostra rete. È un sito di quiz: i partecipanti, una classe o un gruppo, rispondono sui propri dispositivi. Ha bisogno di connessioni HTTPS e WebSocket verso ${h}.${now ? ` ${now}` : ""}`,
  sendIt: "Cosa dire al servizio informatico:",
  http: "Il server del sito, via HTTP",
  ws: "Connessione in diretta (WebSocket)",
  ms: (n) => `${n} ms`,
  status: (n) => `risposta ${n}`,
  noAnswer: "nessuna risposta",
  blocked: "bloccata",
  noAnswerIn: (s) => `nessuna risposta entro ${s} s`,
  blockedHere: "bloccata da questa rete",
  unreachable: "Questo dispositivo non riesce a raggiungere il server del quiz: la rete lo blocca.",
  allGood: "Tutto a posto: il quiz funziona in diretta su questa rete.",
  slower: "Il quiz funziona su questa rete, un po' più lentamente: risposte e schermi arrivano con un attimo di ritardo, perché le connessioni in diretta sono bloccate. Per giocare va bene. Per averlo in diretta:",
  nowBlocked: "Al momento questa rete blocca il sito.",
  nowSlow: "Al momento le connessioni WebSocket sono bloccate, e il quiz va più lento.",
};

export const CHECK_TEXT: Record<Lang, CheckText> = { de, en, fr, it };
