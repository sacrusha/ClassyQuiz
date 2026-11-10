// The root page's messages that the pages a quiz plays on say too: the
// site full or its allowance spent, an upload not taken, the way to an own
// copy, what to tell IT. One wording for both: landing-text.ts takes them
// from here, and so do the room pages (client/room-text.ts), which leave the
// rest of the root page's words out of their scripts.

import type { Lang } from "./landing-text.ts";
import type { SiteFull } from "../shared/limits.ts";

export interface SiteWords {
  notTaken: string;
  /** An upload refused: full is the cap reached (the uploads' rows a day: back at `at`; bytes stored: as quizzes end or expire). */
  siteFull: (full: SiteFull, at: string | null) => string;
  /** at: the time the allowance comes back, in Swiss time; null when the browser has no time zones (then 00:00 UTC). */
  quota: (at: string | null) => string;
  ownCopyLink: string;
  whatToTellIt: string;
}

const en: SiteWords = {
  notTaken: "The site couldn't take the quiz. Try again.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `The free site has no room for another quiz right now. It takes one again once others have ended or expired (three hours after their last use).`
      : `The free site can't take more quizzes today. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`,
  quota: (at) => `The free site has used up today's allowance. It works again at ${at ? `${at} Swiss time` : "00:00 UTC"}.`,
  ownCopyLink: "More quizzes: a site of your own, your school's or your company's ›",
  whatToTellIt: "What to tell IT ›",
};

const de: SiteWords = {
  notTaken: "Die Seite konnte das Quiz nicht annehmen. Versuch es nochmals.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Die Gratis-Seite hat im Moment keinen Platz für ein weiteres Quiz. Sie nimmt wieder eines an, sobald andere beendet oder abgelaufen sind (drei Stunden nach ihrer letzten Benutzung).`
      : `Die Gratis-Seite kann heute kein weiteres Quiz annehmen. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} nimmt sie wieder eines an.`,
  quota: (at) => `Die Gratis-Seite hat ihr Tageskontingent aufgebraucht. Ab ${at ? `${at} Uhr Schweizer Zeit` : "00:00 UTC"} funktioniert sie wieder.`,
  ownCopyLink: "Mehr Quiz: eine eigene Website für dich, deine Schule oder deine Firma ›",
  whatToTellIt: "Was du der IT sagen kannst ›",
};

const fr: SiteWords = {
  notTaken: "Le site n'a pas pu recevoir le quiz. Réessayez.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Le site gratuit n'a plus de place pour un nouveau quiz pour l'instant. De la place se libère dès que d'autres quiz sont terminés ou ont expiré (trois heures après leur dernière utilisation).`
      : `Le site gratuit n'accepte plus de nouveaux quiz aujourd'hui. Il en acceptera de nouveau à partir de ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  quota: (at) => `Le site gratuit a épuisé son quota du jour. Il sera de nouveau disponible à partir de ${at ? `${at}, heure suisse` : "00:00 UTC"}.`,
  ownCopyLink: "Davantage de quiz : un site à vous, à votre école ou à votre entreprise ›",
  whatToTellIt: "Que dire au service informatique ›",
};

const it: SiteWords = {
  notTaken: "Il sito non è riuscito a ricevere il quiz. Riprova.",
  siteFull: (full, at) =>
    full === "bytes"
      ? `Al momento il sito gratuito non ha spazio per un altro quiz. Ne accetterà di nuovo quando altri quiz saranno terminati o scaduti (tre ore dopo il loro ultimo uso).`
      : `Per oggi il sito gratuito non può accettare altri quiz. Ne accetta di nuovo dalle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  quota: (at) => `Il sito gratuito ha esaurito la quota giornaliera. Torna a funzionare dalle ${at ? `${at}, ora svizzera` : "00:00 UTC"}.`,
  ownCopyLink: "Più quiz: un sito tuo, della tua scuola o della tua azienda ›",
  whatToTellIt: "Cosa dire al servizio informatico ›",
};

export const SITE_WORDS: Record<Lang, SiteWords> = { de, en, fr, it };
