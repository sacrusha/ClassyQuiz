// /own-copy in this device's language (client/device-lang.ts); the static
// HTML is English, for a browser without scripts. The ask is the visitor's own
// words to their AI, "du", "tu", "tu" as the root page's asks.

import { deviceLang, speak } from "./device-lang.ts";
import type { Lang } from "./landing-text.ts";

const N = " "; // French: a thin no-break space before ? : ; !, as on the root page

const WORDS: Record<Exclude<Lang, "en">, Record<string, string>> = {
  de: {
    title: "Dein eigenes classyQuiz",
    h1: "Dein eigenes classyQuiz",
    lede: "Diese Website ist gratis und wird von allen geteilt, die sie nutzen, mit Platz für ein paar Dutzend Quiz am Tag. Deine eigene Kopie ist dieselbe Website unter einer eigenen Adresse, ein paar Dutzend Quiz am Tag nur für dich. Du kannst sie selbst einrichten, wobei eine KI die Arbeit macht, oder die IT deiner Schule oder Firma bitten, eine zu betreiben.",
    selfH: "Selbst einrichten",
    needH: "Was du brauchst",
    need1: "Einen Computer, von dem aus wrangler die Website hochlädt. Mit einem bezahlten Abo richtet eine KI wie Claude Code das in Minuten auf ihrer eigenen virtuellen Maschine ein. Ohne Abo kann dich eine KI durch die Einrichtung auf deinem eigenen Computer führen; das kann eine Weile dauern.",
    need2: "Ein kostenloses Cloudflare-Konto.",
    askH: "Was du deiner KI sagst",
    ask: "Bitte richte classyQuiz von https://github.com/sacrusha/ClassyQuiz auf einem kostenlosen Cloudflare-Konto ein. Sag mir, falls eine andere Umgebung von dir das einfacher macht.",
    doH: "Was du selbst machst",
    do1: "Erstelle ein kostenloses Konto auf",
    do2: "Erstelle ein Zugriffstoken: Die KI zeigt dir, wo und wie. Es ist kniffliger, als man denkt. Füg es nicht in den Chat ein; frag die KI, wie du es sicher übergibst.",
    do3: "Wähl einen Namen für deine Website. Er wird zur Adresse:",
    name: "name",
    itH: "Oder frag die IT deiner Schule oder Firma",
    it: "Leute mit IT-Erfahrung und einer KI für die Entwicklung können das Projekt so anpassen, dass es auf ihren eigenen Servern läuft, oder es auf einem bezahlten Cloudflare-Konto betreiben, für Tausende Quiz am Tag.",
    afterH: "Danach",
    after1: "Wenn du deine KI nach einem Quiz fragst, nimm statt classyquiz.pages.dev die Adresse, die die Startseite deiner Kopie zeigt.",
    after2: "Eine Kopie ändert sich nur, wenn sie aktualisiert wird. Bleibt sie, wie sie ist, zeigt sie jedes Mal dieselben Bildschirme und Knöpfe. Aktualisiert bekommt sie, was neu und behoben ist, und ihre Bildschirme können sich ändern. Um eine Kopie zu aktualisieren, die du selbst eingerichtet hast, bitte deine KI, sie von GitHub zu aktualisieren, so wie du sie eingerichtet hast.",
  },
  fr: {
    title: "Votre propre classyQuiz",
    h1: "Votre propre classyQuiz",
    lede: "Ce site est gratuit et partagé par toutes les personnes qui l'utilisent, avec de la place pour quelques dizaines de quiz par jour. Votre propre copie est le même site, à une adresse à vous, avec quelques dizaines de quiz par jour rien que pour vous. Vous pouvez l'installer vous-même, en laissant le travail à une IA, ou demander au service informatique de votre école ou de votre entreprise d'en faire tourner une.",
    selfH: "L'installer vous-même",
    needH: "Ce qu'il vous faut",
    need1: "Un ordinateur depuis lequel wrangler publie le site. Avec un abonnement payant, une IA comme Claude Code l'installe en quelques minutes sur sa propre machine virtuelle. Sans abonnement, une IA peut vous guider pour l'installer sur votre ordinateur, ce qui peut prendre un moment.",
    need2: "Un compte Cloudflare gratuit.",
    askH: "Que dire à votre IA",
    ask: `Peux-tu déployer classyQuiz depuis https://github.com/sacrusha/ClassyQuiz sur un compte Cloudflare gratuit${N}? Dis-moi si un autre de tes environnements rend la chose plus simple.`,
    doH: "Ce que vous faites vous-même",
    do1: "Créez un compte gratuit sur",
    do2: `Créez un jeton d'accès${N}: l'IA vous explique où et comment. C'est plus délicat qu'on ne le pense. Ne le collez pas dans le chat${N}; demandez à l'IA comment le lui transmettre en toute sécurité.`,
    do3: `Choisissez un nom pour votre site. Il devient l'adresse${N}:`,
    name: "nom",
    itH: "Ou demandez au service informatique de votre école ou de votre entreprise",
    it: "Des personnes qui s'y connaissent en informatique et qui ont une IA pour développeurs peuvent adapter le projet à leurs propres serveurs, ou le faire tourner sur un compte Cloudflare payant pour des milliers de quiz par jour.",
    afterH: "Ensuite",
    after1: "Quand vous demandez un quiz à votre IA, donnez-lui l'adresse qu'affiche la page d'accueil de votre copie au lieu de classyquiz.pages.dev.",
    after2: "Une copie ne change que lorsqu'elle est mise à jour. Laissée telle quelle, elle affiche toujours les mêmes écrans et les mêmes boutons. Mise à jour, elle reçoit les nouveautés et les corrections, et ses écrans peuvent changer. Pour mettre à jour une copie que vous avez installée vous-même, demandez à votre IA de la mettre à jour depuis GitHub, comme pour l'installation.",
  },
  it: {
    title: "Il tuo classyQuiz",
    h1: "Il tuo classyQuiz",
    lede: "Questo sito è gratuito e condiviso da tutti quelli che lo usano, con spazio per qualche decina di quiz al giorno. La tua copia è lo stesso sito a un indirizzo tutto tuo, qualche decina di quiz al giorno solo per te. Puoi crearla da te, lasciando il lavoro a un'IA, oppure chiedere al servizio informatico della tua scuola o della tua azienda di gestirne una.",
    selfH: "Crearla da te",
    needH: "Cosa ti serve",
    need1: "Un computer da cui wrangler pubblica il sito. Con un abbonamento a pagamento, un'IA come Claude Code lo configura in pochi minuti sulla sua macchina virtuale. Senza abbonamento, un'IA può guidarti nella configurazione sul tuo computer, il che può richiedere un po' di tempo.",
    need2: "Un account Cloudflare gratuito.",
    askH: "Cosa chiedere alla tua IA",
    ask: "Puoi pubblicare classyQuiz da https://github.com/sacrusha/ClassyQuiz su un account Cloudflare gratuito? Dimmi se hai un altro ambiente che lo rende più semplice.",
    doH: "Cosa fai tu",
    do1: "Crea un account gratuito su",
    do2: "Crea un token di accesso: l'IA ti spiega dove e come. È più complicato di quanto sembri. Non incollarlo nella chat; chiedi all'IA come consegnarglielo in modo sicuro.",
    do3: "Scegli un nome per il tuo sito. Diventa l'indirizzo:",
    name: "nome",
    itH: "Oppure chiedi al servizio informatico della tua scuola o della tua azienda",
    it: "Chi ha esperienza informatica e un'IA per sviluppatori può adattare il progetto ai propri server, oppure gestirlo su un account Cloudflare a pagamento per migliaia di quiz al giorno.",
    afterH: "Dopo",
    after1: "Quando chiedi un quiz alla tua IA, usa l'indirizzo che mostra la pagina iniziale della tua copia al posto di classyquiz.pages.dev.",
    after2: "Una copia cambia solo quando viene aggiornata. Lasciata com'è, mostra ogni volta gli stessi schermi e pulsanti. Aggiornata, riceve le novità e le correzioni, e i suoi schermi possono cambiare. Per aggiornare una copia che hai creato tu, chiedi alla tua IA di aggiornarla da GitHub, come quando l'hai creata.",
  },
};

const lang = deviceLang();
if (lang !== "en") {
  document.documentElement.lang = lang;
  speak(WORDS[lang]);
}
