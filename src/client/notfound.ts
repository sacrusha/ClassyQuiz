// The page for an address that isn't one (404.html), in this device's
// language (client/device-lang.ts); the static HTML is English.

import { deviceLang, speak } from "./device-lang.ts";
import type { Lang } from "./landing-text.ts";

const N = " "; // French: a thin no-break space before a colon, as on the root page

const WORDS: Record<Exclude<Lang, "en">, Record<string, string>> = {
  de: {
    title: "Nicht gefunden · classyQuiz",
    h1: "Unter dieser Adresse gibt es keine Seite",
    lede: "Die Adressen der Website sind kleingeschrieben:",
    start: "die Startseite und die Anleitung für KIs, die Quiz machen",
    example: "ein Beispiel, wie eine Lehrperson mit einer KI ein Quiz macht",
    layout: "wie der Grossbildschirm eine Frage anordnet, als HTML und CSS",
    own: "eine eigene Kopie der Website",
  },
  fr: {
    title: "Page introuvable · classyQuiz",
    h1: "Il n'y a pas de page à cette adresse",
    lede: `Les adresses du site s'écrivent en minuscules${N}:`,
    start: "la page d'accueil, et le manuel pour les IA qui font des quiz",
    example: "un exemple de quiz préparé avec une IA pour une classe",
    layout: "la mise en page d'une question sur le grand écran, en HTML et CSS",
    own: "votre propre copie du site",
  },
  it: {
    title: "Pagina non trovata · classyQuiz",
    h1: "A questo indirizzo non c'è nessuna pagina",
    lede: "Gli indirizzi del sito si scrivono in minuscolo:",
    start: "la pagina iniziale, e il manuale per le IA che creano quiz",
    example: "un esempio di quiz preparato con un'IA per una classe",
    layout: "come lo schermo grande dispone una domanda, in HTML e CSS",
    own: "la tua copia del sito",
  },
};

const lang = deviceLang();
if (lang !== "en") {
  document.documentElement.lang = lang;
  speak(WORDS[lang]);
}
