"""The words of the notes run's conversation (the root page's "Notes" tab), per language, for review side by side.

The run is the owner's (12 Nov 2026, English, Claude Sonnet, the class notes attached as a PDF,
src/public/examples/notes-<lang>.pdf; its screenshot is notes-conversation-original.webp here, dark). en is its words as
shown; the ask is the root page's (askNotes in src/client/landing-text.ts, read from there by build.py), which is the
run's with a workaround of that day cut from it. de, fr and it are drafts for the owner's review
(docs/translation-review.md), in the words of that language's notes and quiz (notes_zips.py), with the app's words as
that language's app would show them.

Markup as text.py's: **bold**, `code`, {zip} for the language's .zip name (faces.py's EXAMPLES); in fr a space before
: ; ? ! becomes a no-break space.
"""

LANGS = ("en", "de", "fr", "it")

UI = {
    "drafted": dict(en="Created a file, read a file, and 10 more steps",
                    de="Hat eine Datei erstellt, eine Datei gelesen und 10 weitere Schritte",
                    fr="Fichier créé, fichier lu et 10 autres étapes",
                    it="Ha creato un file, letto un file e altri 10 passaggi"),
    "packed": dict(en="Shared a file, updated tasks, ran a command",
                   de="Hat eine Datei geteilt, Aufgaben aktualisiert, einen Befehl ausgeführt",
                   fr="Fichier partagé, tâches mises à jour, commande exécutée",
                   it="Ha condiviso un file, aggiornato le attività, eseguito un comando"),
    "pdf": dict(en="PDF", de="PDF", fr="PDF", it="PDF"),
    "zipSub": dict(en="ZIP", de="ZIP", fr="ZIP", it="ZIP"),
}

TURN = [
    ("attachment", None),
    ("user", "askNotes"),
    ("fold", "drafted"),
    ("ai", dict(
        en="Quiz drafted (13 questions, concepts rather than dates). I'm now packaging it and running the site's format checker.",
        de="Quiz entworfen (13 Fragen, Begriffe statt Daten). Ich packe es jetzt und lasse die Formatprüfung der Seite laufen.",
        fr="Quiz rédigé (13 questions, des notions plutôt que des dates). Je l'emballe maintenant et je lance le vérificateur de format du site.",
        it="Quiz abbozzato (13 domande, concetti più che date). Ora lo impacchetto e faccio girare il controllo del formato del sito.")),
    ("fold", "packed"),
    ("ai", dict(
        en="Your quiz is ready: `{zip}`, 13 questions that should take about 10 minutes with friends.",
        de="Dein Quiz ist fertig: `{zip}`, 13 Fragen, die mit Freunden etwa 10 Minuten dauern sollten.",
        fr="Ton quiz est prêt : `{zip}`, 13 questions qui devraient prendre environ 10 minutes entre amis.",
        it="Il tuo quiz è pronto: `{zip}`, 13 domande che dovrebbero durare circa 10 minuti con gli amici.")),
    ("ai", dict(
        en="To play, open classyquiz.pages.dev, drop the zip in, and pick the friends option. You'll get a lobby code or QR code to share, and you play too.",
        de="Zum Spielen öffnest du classyquiz.pages.dev, ziehst das Zip hinein und wählst die Option für Freunde. Du bekommst einen Lobby-Code oder QR-Code zum Teilen, und du spielst mit.",
        fr="Pour jouer, ouvre classyquiz.pages.dev, dépose le zip et choisis l'option entre amis. Tu obtiens un code de salon ou un QR code à partager, et tu joues aussi.",
        it="Per giocare, apri classyquiz.pages.dev, trascina dentro lo zip e scegli l'opzione con gli amici. Avrai un codice della lobby o un codice QR da condividere, e giochi anche tu.")),
    ("ai", dict(
        en="The questions are about ideas and cause and effect, not dates. They cover:",
        de="Die Fragen drehen sich um Ideen, Ursachen und Folgen, nicht um Daten. Sie behandeln:",
        fr="Les questions portent sur les idées, les causes et les effets, pas sur les dates. Elles couvrent :",
        it="Le domande riguardano idee, cause ed effetti, non date. Trattano:")),
    ("bullets", [
        dict(en="the Three Estates and the vote-by-head dispute", de="die drei Stände und den Streit um die Abstimmung nach Köpfen",
             fr="les trois ordres et le conflit sur le vote par député", it="i tre ordini e la disputa sul voto per testa"),
        dict(en="the Enlightenment", de="die Aufklärung", fr="les Lumières", it="l'Illuminismo"),
        dict(en="the Tennis Court Oath, the Bastille and the Declaration of Rights",
             de="den Ballhausschwur, die Bastille und die Erklärung der Menschenrechte",
             fr="le serment du Jeu de paume, la Bastille et la Déclaration des droits",
             it="il Giuramento della Pallacorda, la Bastiglia e la Dichiarazione dei diritti"),
        dict(en="constitutional monarchy versus republic", de="konstitutionelle Monarchie gegen Republik",
             fr="monarchie constitutionnelle contre République", it="monarchia costituzionale contro repubblica"),
        dict(en="the Terror", de="die Terrorherrschaft", fr="la Terreur", it="il Terrore"),
        dict(en="Napoleon's coup", de="Napoleons Staatsstreich", fr="le coup d'État de Napoléon", it="il colpo di Stato di Napoleone"),
        dict(en="the lasting results of the Revolution", de="die bleibenden Folgen der Revolution",
             fr="les conséquences durables de la Révolution", it="le conseguenze durature della Rivoluzione"),
        dict(en="a final question on putting the whole story in order", de="eine Schlussfrage, die die ganze Geschichte in die richtige Reihenfolge bringt",
             fr="une dernière question pour remettre toute l'histoire dans l'ordre", it="una domanda finale per mettere in ordine tutta la storia"),
    ]),
    ("ai", dict(
        en="I built every answer from your notes, and the site's own format checker passes the file.",
        de="Jede Antwort habe ich aus euren Notizen gebaut, und die Formatprüfung der Seite lässt die Datei durch.",
        fr="J'ai tiré chaque réponse de vos notes, et le vérificateur de format du site valide le fichier.",
        it="Ho costruito ogni risposta dai vostri appunti, e il controllo del formato del sito approva il file.")),
    ("ai", dict(
        en="I didn't show you the questions, since you're playing. If you'd like to see them, or want more or fewer, harder or easier, just say so.",
        de="Die Fragen habe ich dir nicht gezeigt, weil du mitspielst. Wenn du sie sehen möchtest oder mehr oder weniger, schwerere oder leichtere willst, sag es einfach.",
        fr="Je ne t'ai pas montré les questions, puisque tu joues. Si tu veux les voir, ou en avoir plus ou moins, plus difficiles ou plus faciles, dis-le simplement.",
        it="Non ti ho mostrato le domande, visto che giochi anche tu. Se vuoi vederle, o ne vuoi di più o di meno, più difficili o più facili, dimmelo.")),
    ("chip", None),
    ("reactions", None),
]
