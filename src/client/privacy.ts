import { deviceLang, speak } from "./device-lang.ts";
import type { Lang } from "./landing-text.ts";
import { SITE_WORDS } from "./site-text.ts";

const N = " "; // French: a narrow no-break space before ? : ; !

const WORDS: Record<Exclude<Lang, "en">, Record<string, string>> = {
  de: {
    whoH: "Wer hinter dieser Website steht",
    who: "classyquiz.pages.dev wird von Graculus gemacht und betrieben, einer Marke von Peter Bänziger Software Consulting, einem Einzelunternehmen nach Schweizer Recht.",
    country: "Schweiz",
    copies: "Kopien von classyQuiz unter anderen Adressen betreibt, wer sie eingerichtet hat.",
    dataH: "Deine Daten",
    browser: "Diese Website setzt keine Cookies. Schriften, Bilder und Skripte kommen von der Website selbst. Dein Browser merkt sich die Sprache, die du gewählt hast, jedes Quiz, das du für andere zum Mitspielen geöffnet hast, mit dem, was es braucht, um dorthin zurückzukommen, wie du die Bildschirme eingerichtet hast, und an welchen der letzten 60 Tage du ein Quiz hochgeladen hast; für jeden Tab die Rolle, die er in einem Quiz hat, damit ein Neuladen sie zurückbringt. Davon bekommt die Website nur, was ein Quiz braucht, etwa den Weg zurück hinein. Ein Quiz, das du auf der Startseite öffnest, gelangt über den Speicher deines Browsers zur nächsten Seite; der Browser löscht es dort, sobald diese Seite es übernimmt; öffnet sie sich nie, löscht er es beim nächsten Öffnen der Startseite.",
    solo: "Allein gespielt verlässt ein Quiz deinen Browser nie.",
    room: "Mit anderen gespielt wird ein Quiz mit seinen Bildern und den Avataren, Antworten und Punkten der Spielenden auf der Website gespeichert und gelöscht, wenn es endet, spätestens drei Stunden nach seiner letzten Benutzung. Bevor ein Bild deinen Browser verlässt, zeichnet der Browser es neu; dabei fällt weg, was ein Foto neben dem Bild mitträgt, etwa Kamera, Zeitpunkt und Ort.",
    ip: "Keine Anfrage wird mit einer IP-Adresse protokolliert. Um das Erraten des Codes zu begrenzen, mit dem man ein Quiz von einem anderen Gerät aus steuert, unterscheidet die Website Geräte nach einem Hash ihrer Adresse, gesalzen für dieses Quiz, und behält ihn, solange das Gerät verbunden ist oder seine falschen Versuche zählen, spätestens bis das Quiz gelöscht wird.",
    counts: "Um zu sehen, wie die Website genutzt wird und wo sie versagt, zählt sie pro Tag: wie oft ein Quiz hochgeladen und gespielt wurde und auf welche Art, mit wie vielen Spielenden und Geräten, wie weit sie kamen und wie ihre Verbindungen hielten. Nichts in diesen Zahlen verbindet sie mit einer Person, einem Gerät oder einem Quiz, und keine ist feiner als der Tag. Die Zahlen eines Tages bleiben 31 Tage, dann gehen sie in die ihres Monats ein; die eines Monats bleiben 24 Monate. Nur ich sehe sie. Für alle sichtbar ist nur, wie voll die Website heute ist und an den letzten Tagen war, und die Zahl der Hochladeversuche je Dateiformat, mit dem ersten und letzten Tag, an dem das Format vorkam:",
    host: "Die Website läuft bei Cloudflare, Inc. (USA). Jede Anfrage geht durch dessen Netz, und Cloudflare speichert die Daten der Website in einem Rechenzentrum nahe der ersten Anfrage, ohne zugesicherte Region. Wie Cloudflare selbst mit Anfragen umgeht, steht in seiner",
    hostPolicy: "Datenschutzerklärung",
    mail: "Wenn du mir schreibst, verwende ich deine Angaben, um dir zu antworten. Ich gebe sie nicht weiter.",
  },
  fr: {
    whoH: "Qui est derrière ce site",
    who: "classyquiz.pages.dev est conçu et exploité par Graculus, une marque de Peter Bänziger Software Consulting, entreprise individuelle de droit suisse.",
    country: "Suisse",
    copies: "Les copies de classyQuiz à d'autres adresses sont exploitées par ceux qui les ont installées.",
    dataH: "Vos données",
    browser: `Ce site ne dépose aucun cookie. Les polices, les images et les scripts viennent du site lui-même. Votre navigateur garde la langue que vous avez choisie, les quiz que vous avez ouverts pour que d'autres les rejoignent, avec ce qu'il faut pour y revenir, la disposition de vos écrans, et les jours, parmi les 60 derniers, où vous avez téléversé un quiz${N}; pour chaque onglet, son rôle dans un quiz, pour qu'un rechargement le lui rende. Le site n'en reçoit que ce dont un quiz a besoin, comme le moyen d'y revenir. Un quiz que vous ouvrez sur la page d'accueil passe à la page suivante par le stockage de votre navigateur, qui l'efface dès que cette page le prend${N}; si cette page ne s'ouvre jamais, il l'efface à la prochaine ouverture de la page d'accueil.`,
    solo: "Joué seul, un quiz ne quitte jamais votre navigateur.",
    room: "Joué avec d'autres, un quiz, avec ses images et les avatars, réponses et points des joueurs, est enregistré sur le site et effacé à sa fin, au plus tard trois heures après sa dernière utilisation. Avant qu'une image ne quitte votre navigateur, celui-ci la redessine, ce qui retire ce qu'une photo contient en plus de l'image, comme l'appareil, l'heure et le lieu.",
    ip: "Aucune requête n'est journalisée avec une adresse IP. Pour limiter les tentatives de deviner le code qui permet de piloter un quiz depuis un autre appareil, le site distingue les appareils par une empreinte de leur adresse, salée pour ce quiz, et la garde tant que l'appareil est connecté ou que ses essais erronés comptent, au plus tard jusqu'à ce que le quiz soit effacé.",
    counts: `Pour voir comment le site est utilisé et où il échoue, il compte par jour${N}: combien de quiz ont été téléversés et joués, et de quelle manière, avec combien de joueurs et d'appareils, jusqu'où ils sont allés, et comment leurs connexions ont tenu. Rien dans ces chiffres ne les relie à une personne, à un appareil ou à un quiz, et aucun n'est plus fin que le jour. Les chiffres d'un jour sont gardés 31 jours, puis ajoutés à ceux de leur mois${N}; ceux d'un mois sont gardés 24 mois. Je suis le seul à les voir, sauf ce que chacun peut voir${N}: à quel point le site est plein, aujourd'hui et ces derniers jours, et le nombre de tentatives de téléversement par format de fichier, avec le premier et le dernier jour où chaque format a été vu${N}:`,
    host: "Le site est hébergé par Cloudflare, Inc. (États-Unis). Chaque requête passe par son réseau, et Cloudflare enregistre les données du site dans un centre de données proche de la première requête, sans région garantie. La manière dont Cloudflare traite lui-même les requêtes est décrite dans sa",
    hostPolicy: "politique de confidentialité",
    mail: "Si vous m'écrivez, j'utilise ce que vous me dites pour vous répondre. Je ne transmets pas vos coordonnées.",
  },
  it: {
    whoH: "Chi c'è dietro questo sito",
    who: "classyquiz.pages.dev è realizzato e gestito da Graculus, un marchio di Peter Bänziger Software Consulting, ditta individuale di diritto svizzero.",
    country: "Svizzera",
    copies: "Le copie di classyQuiz ad altri indirizzi sono gestite da chi le ha installate.",
    dataH: "I tuoi dati",
    browser: "Questo sito non usa cookie. Caratteri, immagini e script vengono dal sito stesso. Il tuo browser ricorda la lingua che hai scelto, i quiz che hai aperto perché altri vi partecipino, con ciò che serve per tornarci, come hai disposto gli schermi e in quali degli ultimi 60 giorni hai caricato un quiz; per ogni scheda, il ruolo che ha in un quiz, perché un ricaricamento lo ripristini. Di tutto questo il sito riceve solo ciò che serve a un quiz, come il modo per rientrarci. Un quiz che apri nella pagina iniziale passa alla pagina successiva attraverso la memoria del browser, che lo cancella appena quella pagina lo prende; se quella pagina non si apre mai, lo cancella alla prossima apertura della pagina iniziale.",
    solo: "Giocato da solo, un quiz non lascia mai il tuo browser.",
    room: "Giocato con altri, un quiz, con le sue immagini e gli avatar, le risposte e i punteggi dei giocatori, viene salvato sul sito e cancellato quando finisce, al più tardi tre ore dopo l'ultimo utilizzo. Prima che un'immagine lasci il tuo browser, il browser la ridisegna, togliendo ciò che una foto contiene oltre all'immagine, come fotocamera, ora e luogo.",
    ip: "Nessuna richiesta viene registrata con un indirizzo IP. Per limitare i tentativi di indovinare il codice con cui si guida un quiz da un altro dispositivo, il sito distingue i dispositivi tramite un hash del loro indirizzo, con un sale proprio di quel quiz, e lo conserva finché il dispositivo è connesso o i suoi tentativi sbagliati contano, al più tardi finché il quiz viene cancellato.",
    counts: "Per vedere come viene usato il sito e dove non funziona, conta per giorno: quanti quiz sono stati caricati e giocati, e in che modo, con quanti giocatori e dispositivi, fin dove sono arrivati e come hanno tenuto le connessioni. Niente in questi numeri li collega a una persona, a un dispositivo o a un quiz, e nessuno è più fine del giorno. I numeri di un giorno restano 31 giorni, poi confluiscono in quelli del loro mese; quelli di un mese restano 24 mesi. Li vedo solo io, tranne ciò che tutti possono vedere: quanto è pieno il sito, oggi e negli ultimi giorni, e il numero di tentativi di caricamento per formato di file, con il primo e l'ultimo giorno in cui ogni formato è comparso:",
    host: "Il sito gira su Cloudflare, Inc. (USA). Ogni richiesta passa per la sua rete, e Cloudflare salva i dati del sito in un centro dati vicino alla prima richiesta, senza una regione garantita. Come Cloudflare stesso tratta le richieste è descritto nella sua",
    hostPolicy: "informativa sulla privacy",
    mail: "Se mi scrivi, uso ciò che mi dici per risponderti. Non passo i tuoi dati a nessuno.",
  },
};

const lang = deviceLang();
if (lang !== "en") {
  document.documentElement.lang = lang;
  const name = SITE_WORDS[lang].privacy;
  speak({ ...WORDS[lang], h1: name, title: `${name} · classyQuiz` });
}
