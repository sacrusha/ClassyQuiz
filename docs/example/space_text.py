"""The words of the space run's conversation (the root page's "Idea" tab), per language, for review side by side.

The run is the owner's (11 Nov 2026, German, nothing attached; its screenshot is space-conversation-original.webp here,
dark). de is its words as typed, the ask's slips included, and the app's own words as that app showed
them, in English; en, fr and it are drafts for the owner's review (docs/translation-review.md), with the app's words as
that language's app would show them. Where the German rests on the German situation (the quiz "auf Deutsch (Schweizer
Schreibweise)"), the translation has its own language's. The quiz's title and the names in the AI's summary are the
translated quizzes' (space_zips.py).

Markup as text.py's: **bold**, `code`; in fr a space before : ; ? ! and inside « » becomes a no-break space.
"""

LANGS = ("en", "de", "fr", "it")

# The .zip as the chat shows it: its title on the file's card (the file's name without .zip, as the app shows it).
ZIP_TITLE = dict(en="Space quiz", de="Weltall quiz", fr="Quiz espace", it="Quiz spazio")

UI = {
    "read": dict(en="Read a page, ran 4 commands", de="Read a page, ran 4 commands",
                 fr="Page lue, 4 commandes exécutées", it="Ha letto una pagina, eseguito 4 comandi"),
    "made": dict(en="Created a file, shared 2 files, and 29 more steps", de="Created a file, shared 2 files, and 29 more steps",
                 fr="Fichier créé, 2 fichiers partagés et 29 autres étapes", it="Ha creato un file, condiviso 2 file e altri 29 passaggi"),
    "all": dict(en="Download all", de="Download all", fr="Tout télécharger", it="Scarica tutto"),
    "zipSub": dict(en="ZIP", de="ZIP", fr="ZIP", it="ZIP"),
}

TURN = [
    ("user", dict(
        en="Read classyQuiz.pages.dev I need a space/planets quiz, 4th grade, with pictures. the order of the planets in the solar system is known, the individual moon names would be too hard. can you manage 20 questions without it getting repetitive? if not, then fewer questions.",
        de="Lies classyQuiz.pages.dev Ich brauche ein Weltraum/Planeten Quiz, 4 Klasse, mit Bildern. Planeterreihenfolge im Sonnensystem is bekannt, die einzelnen Mondnamen wären zu schwierig. kriegst du 20 Fragen hin ohne dass es repetitiv wird? wenn nicht, dann weniger Fragen.",
        fr="Lis classyQuiz.pages.dev J'ai besoin d'un quiz espace/planètes, CM1, avec des images. l'ordre des planètes dans le système solaire est connu, les noms des lunes seraient trop difficiles. tu arrives à faire 20 questions sans que ça devienne répétitif ? sinon, moins de questions.",
        it="Leggi classyQuiz.pages.dev Mi serve un quiz spazio/pianeti, quarta elementare, con immagini. l'ordine dei pianeti nel sistema solare lo sanno, i nomi delle singole lune sarebbero troppo difficili. riesci a fare 20 domande senza che diventi ripetitivo? se no, meno domande.")),
    ("ai", dict(
        en="I'll look at classyQuiz.pages.dev first, so that the quiz fits the right format.",
        de="Ich schaue mir zuerst classyQuiz.pages.dev an, damit das Quiz ins richtige Format passt.",
        fr="Je regarde d'abord classyQuiz.pages.dev, pour que le quiz ait le bon format.",
        it="Prima guardo classyQuiz.pages.dev, così il quiz ha il formato giusto.")),
    ("fold", "read"),
    ("ai", dict(
        en="Format understood. I'm building the quiz now, in English, with real NASA pictures and a few drawings of my own. After that you'll get an overview to check, and the zip.",
        de="Format verstanden. Ich baue das Quiz jetzt auf Deutsch (Schweizer Schreibweise), mit echten NASA-Bildern und ein paar eigenen Zeichnungen. Danach gibt’s eine Übersicht zum Prüfen und das Zip.",
        fr="Format compris. Je construis maintenant le quiz, en français, avec de vraies images de la NASA et quelques dessins à moi. Ensuite, tu auras un aperçu à vérifier, et le zip.",
        it="Formato capito. Ora costruisco il quiz, in italiano, con vere immagini della NASA e qualche disegno mio. Poi avrai una panoramica da controllare, e lo zip.")),
    ("fold", "made"),
    ("ai", dict(
        en="Yes, it came to 20 questions, and none of them repeats. The quiz is called “A journey through space”, every question has a picture, and the format check (verify.py) ran without errors. In review.png you can see all the questions with their solutions at a glance.",
        de="Ja, es sind 20 Fragen geworden, und keine wiederholt sich. Das Quiz heisst «Reise durchs Weltall», jede Frage hat ein Bild, und die Prüfung des Formats (verify.py) ist ohne Fehler durchgelaufen. In review.png siehst du alle Fragen mit den Lösungen auf einen Blick.",
        fr="Oui, ça fait 20 questions, et aucune ne se répète. Le quiz s'appelle « Voyage dans l'espace », chaque question a une image, et la vérification du format (verify.py) s'est déroulée sans erreur. Dans review.png, tu vois toutes les questions avec leurs solutions d'un coup d'œil.",
        it="Sì, sono venute 20 domande, e nessuna si ripete. Il quiz si chiama «Viaggio nello spazio», ogni domanda ha un'immagine, e il controllo del formato (verify.py) è passato senza errori. In review.png vedi tutte le domande con le soluzioni a colpo d'occhio.")),
    ("ai", dict(en="**What's in it:**", de="**Was drin ist:**", fr="**Ce qu'il contient :**", it="**Cosa contiene:**")),
    ("bullets", [
        dict(en="**Sun and Earth:** The sun is a star, why there is day and night, a year as one lap around the sun, how many Earths fit into the sun.",
             de="**Sonne und Erde:** Die Sonne ist ein Stern, warum es Tag und Nacht gibt, ein Jahr als eine Runde um die Sonne, wie viele Erden in die Sonne passen.",
             fr="**Soleil et Terre :** le Soleil est une étoile, pourquoi il y a le jour et la nuit, une année comme un tour autour du Soleil, combien de Terres tiennent dans le Soleil.",
             it="**Sole e Terra:** il Sole è una stella, perché ci sono il giorno e la notte, un anno come un giro intorno al Sole, quante Terre entrano nel Sole."),
        dict(en="**Planets:** Jupiter, Saturn's rings, Mars, Venus, Neptune and Pluto. For Venus, “Mercury” is there on purpose as a trap. That's a good moment to talk about Venus's thick layer of clouds.",
             de="**Planeten:** Jupiter, Saturns Ringe, Mars, Venus, Neptun und Pluto. Bei der Venus ist «Merkur» absichtlich als Falle dabei. Das ist ein guter Moment, um über die dicke Wolkendecke der Venus zu reden.",
             fr="**Planètes :** Jupiter, les anneaux de Saturne, Mars, Vénus, Neptune et Pluton. Pour Vénus, « Mercure » est là exprès, comme piège. C'est un bon moment pour parler de l'épaisse couche de nuages de Vénus.",
             it="**Pianeti:** Giove, gli anelli di Saturno, Marte, Venere, Nettuno e Plutone. Per Venere, «Mercurio» c'è apposta come trabocchetto. È un buon momento per parlare dello spesso strato di nuvole di Venere."),
        dict(en="**Moon and sky:** Why the moon shines, solar eclipse, comet, shooting star, the Milky Way and, to finish, the Big Dipper. The children can look for it in the sky themselves in the evening.",
             de="**Mond und Himmel:** Warum der Mond leuchtet, Sonnenfinsternis, Komet, Sternschnuppe, Milchstrasse und als Abschluss der Grosse Wagen. Den können die Kinder am Abend selbst am Himmel suchen.",
             fr="**Lune et ciel :** pourquoi la Lune brille, l'éclipse de Soleil, la comète, l'étoile filante, la Voie lactée et, pour finir, le Grand Chariot. Les enfants peuvent le chercher eux-mêmes dans le ciel, le soir.",
             it="**Luna e cielo:** perché la Luna brilla, l'eclissi di Sole, la cometa, la stella cadente, la Via Lattea e, per finire, il Grande Carro. I bambini possono cercarlo da soli in cielo la sera."),
        dict(en="**Space travel:** Moon landing 1969, spacesuit, ISS (it goes around the Earth about 16 times a day).",
             de="**Raumfahrt:** Mondlandung 1969, Raumanzug, ISS (sie fliegt etwa 16 Mal pro Tag um die Erde).",
             fr="**Voyages dans l'espace :** les premiers pas sur la Lune en 1969, la combinaison spatiale, l'ISS (elle fait le tour de la Terre environ 16 fois par jour).",
             it="**Viaggi nello spazio:** lo sbarco sulla Luna nel 1969, la tuta spaziale, la ISS (fa il giro della Terra circa 16 volte al giorno)."),
    ]),
    ("ai", dict(
        en="In question 2 the answers are pictures: the children have to recognise the Earth among Neptune, Uranus and Venus. I left out questions only about the order of the planets, and moon names. The children still need the order for thinking, for example with Neptune.",
        de="Bei Frage 2 sind die Antworten Bilder: Die Kinder müssen die Erde zwischen Neptun, Uranus und Venus erkennen. Fragen nur zur Reihenfolge der Planeten und Mondnamen habe ich weggelassen. Die Reihenfolge brauchen die Kinder aber zum Überlegen, zum Beispiel bei Neptun.",
        fr="À la question 2, les réponses sont des images : les enfants doivent reconnaître la Terre parmi Neptune, Uranus et Vénus. J'ai laissé de côté les questions portant seulement sur l'ordre des planètes, et les noms des lunes. Les enfants ont quand même besoin de l'ordre pour réfléchir, par exemple pour Neptune.",
        it="Nella domanda 2 le risposte sono immagini: i bambini devono riconoscere la Terra tra Nettuno, Urano e Venere. Ho lasciato fuori le domande solo sull'ordine dei pianeti, e i nomi delle lune. L'ordine però serve ai bambini per ragionare, per esempio con Nettuno.")),
    ("ai", dict(
        en="**Pictures:** The photos are real NASA images, so in the public domain. I drew four pictures myself: day and night, the Earth's path around the sun, the size comparison (to scale, the sun is 109 times as wide as the Earth) and the Big Dipper. The sun is a NASA image in ultraviolet, which is why it looks orange-red and not yellow.",
        de="**Bilder:** Die Fotos sind echte NASA-Aufnahmen, also gemeinfrei. Vier Bilder habe ich selbst gezeichnet: Tag und Nacht, die Erdbahn um die Sonne, den Grössenvergleich (im richtigen Massstab, die Sonne ist 109-mal so breit wie die Erde) und den Grossen Wagen. Die Sonne ist eine NASA-Aufnahme in Ultraviolett, darum sieht sie orange-rot aus und nicht gelb.",
        fr="**Images :** les photos sont de vraies images de la NASA, donc dans le domaine public. J'ai dessiné quatre images moi-même : le jour et la nuit, l'orbite de la Terre autour du Soleil, la comparaison des tailles (à l'échelle, le Soleil est 109 fois plus large que la Terre) et le Grand Chariot. Le Soleil est une image de la NASA en ultraviolet, c'est pourquoi il paraît rouge orangé et non jaune.",
        it="**Immagini:** le foto sono vere immagini della NASA, quindi di pubblico dominio. Quattro immagini le ho disegnate io: il giorno e la notte, l'orbita della Terra intorno al Sole, il confronto delle dimensioni (in scala, il Sole è 109 volte più largo della Terra) e il Grande Carro. Il Sole è un'immagine NASA in ultravioletto, per questo sembra rosso-arancio e non giallo.")),
    ("ai", dict(
        en="For the class on the projector, choose “Quizmaster” on the site after opening the zip. If you'd like particular questions easier or harder, just tell me which.",
        de="Für die Klasse am Beamer wählst du nach dem Öffnen des Zips auf der Seite «Quizmaster». Wenn du einzelne Fragen leichter oder schwieriger haben möchtest, sag mir einfach welche.",
        fr="Pour la classe au vidéoprojecteur, choisis « Quizmaster » sur le site après avoir ouvert le zip. Si tu veux certaines questions plus faciles ou plus difficiles, dis-moi simplement lesquelles.",
        it="Per la classe al proiettore, dopo aver aperto lo zip scegli «Quizmaster» sul sito. Se vuoi alcune domande più facili o più difficili, dimmi solo quali.")),
    ("review", None),
    ("chip", None),
    ("all", None),
    ("reactions", None),
]
