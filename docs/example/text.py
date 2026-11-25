"""The words of the sheets run's conversation, per language, for review side by side.

The run is the owner's (19 Nov 2026, German, Claude Sonnet 5.5; its screenshot is sheets-conversation-original.webp
here, dark): the two photographed sheets and two asks, each answered with a .zip and an overview of its questions. One
entry per piece of the chat, in the order the chat shows them; under each the four languages. de is the AI's words as
it wrote them, less its remark that the overview showed the picture answers only small (the run's preview.py put them
four to a row; the overview shown is the current one's), and the app's own as that app showed them, in English; the
asks are the owner's, the second tidied. en,
fr and it are drafts for the owner's review, with the app's words as that language's app
would show them. Where the German rests on the German situation (the quiz "in Schweizer
Schreibweise"), the translation has the situation of a teacher asking in that language about the same German sheets.
The quiz's title and questions are the translated quizzes' (quiz_zips.py).

The first ask is the root page's sheets ask (`ask` in src/client/landing-text.ts), which build.py reads from there.
Where a piece is also in the landing's film (the second ask, the status lines, the .zips' names, the quiz's title and
first question) it is the film's wording (CONTENT in docs/film/build/film.js); build.py refuses to run if they differ.

Markup: **bold**, `code`. A plain space between a digit and three digits is a thousands separator (build.py makes it a
no-break space), and in fr a space before : ; ? ! and inside « » is a no-break space too. {zip1} and {zip2} are the
chat's two .zip files in the language (ZIPS below).
"""

LANGS = ("en", "de", "fr", "it")
NB = " "

# The two .zips the AI handed over, per language: the first answer's and the second's (the one /example offers).
ZIPS = {
    "en": ("big-numbers-quiz.zip", "big-numbers-quiz-v2.zip"),
    "de": ("grosse-zahlen-quiz.zip", "grosse-zahlen-quiz-v2.zip"),
    "fr": ("quiz-grands-nombres.zip", "quiz-grands-nombres-v2.zip"),
    "it": ("quiz-grandi-numeri.zip", "quiz-grandi-numeri-v2.zip"),
}


def card_title(name):
    """The file's name as the app titles its card: without .zip, dashes as spaces, the first letter capital."""
    return name[:-4].replace("-", " ").capitalize()


# What the film says for these (build.py checks them against film.js CONTENT).
FILM = {
    lang: dict(zipTitle=card_title(ZIPS[lang][0]), zipTitle2=card_title(ZIPS[lang][1]), zipFile=ZIPS[lang][1], **words)
    for lang, words in {
        "en": dict(
            title="Big numbers on the number line",
            q1="Which number does the arrow show?",
            ask2="Thanks. 3, 7 and 10 would work even better with pictures as answers. 2 and 11 turned out a bit too easy – you could turn exercises like 1, 4, 6 around, with pictures as answers, and mix them in for a bit more variety.",
            status1="I’ll read classyquiz.pages.dev first, so I know which format the quiz has to be built in.",
            status2="Setting the positions for the number-line question with a target number"),
        "de": dict(
            title="Grosse Zahlen am Zahlenstrahl",
            q1="Welche Zahl zeigt der Pfeil?",
            ask2="Danke. 3, 7 und 10 würden mit Bildern als Antwort noch besser funktionieren. 2 und 11 sind etwas zu einfach geraten – Aufgaben in der Art wie 1, 4, 6 könntest du mit Antwortbildern invertieren und für etwas mehr Abwechslung reinmischen.",
            status1="Ich lese zuerst classyquiz.pages.dev, damit ich weiss, in welchem Format das Quiz gebaut werden muss.",
            status2="Positionen für Zahlenstrahl-Aufgabe mit Zielzahl festlegen"),
        "fr": dict(
            title="Les grands nombres sur la droite graduée",
            q1="Quel nombre la flèche indique-t-elle ?",
            ask2="Merci. Les 3, 7 et 10 marcheraient encore mieux avec des images comme réponses. Les 2 et 11 sont un peu trop faciles – tu pourrais inverser des exercices comme les 1, 4, 6, avec des images comme réponses, et les mélanger aux autres pour un peu plus de variété.",
            status1="Je lis d’abord classyquiz.pages.dev, pour savoir dans quel format le quiz doit être construit.",
            status2="Définition des positions pour l’exercice sur la droite graduée avec un nombre cible"),
        "it": dict(
            title="I grandi numeri sulla retta numerica",
            q1="Quale numero indica la freccia?",
            ask2="Grazie. La 3, la 7 e la 10 funzionerebbero ancora meglio con immagini come risposte. La 2 e l’11 sono venute un po’ troppo facili – potresti invertire esercizi come l’1, il 4 e il 6, con immagini come risposte, e mescolarli per avere un po’ più di varietà.",
            status1="Prima leggo classyquiz.pages.dev, così so in che formato va costruito il quiz.",
            status2="Definizione delle posizioni per l’esercizio sulla retta numerica con un numero obiettivo"),
    }.items()
}

# The app's own words around the chat: English in the German run, as the app showed them; each other language shows
# what that language's app would.
UI = {
    "read": dict(en="Read 2 pages, updated tasks", de="Read 2 pages, updated tasks",
                 fr="2 pages lues, tâches mises à jour", it="Ha letto 2 pagine, aggiornato le attività"),
    "ran": dict(en="Read 2 files, ran a command", de="Read 2 files, ran a command",
                fr="2 fichiers lus, 1 commande exécutée", it="Ha letto 2 file, eseguito un comando"),
    "made1": dict(en="Shared 2 files, created a file, and 11 more steps", de="Shared 2 files, created a file, and 11 more steps",
                  fr="2 fichiers partagés, 1 fichier créé et 11 autres étapes", it="Ha condiviso 2 file, creato un file e altri 11 passaggi"),
    "made2": dict(en="Shared 2 files, created a file, and 7 more steps", de="Shared 2 files, created a file, and 7 more steps",
                  fr="2 fichiers partagés, 1 fichier créé et 7 autres étapes", it="Ha condiviso 2 file, creato un file e altri 7 passaggi"),
    "all": dict(en="Download all", de="Download all", fr="Tout télécharger", it="Scarica tutto"),
    "zipSub": dict(en="ZIP", de="ZIP", fr="ZIP", it="ZIP"),
}

FILES = dict(en="Files:", de="Dateien:", fr="Fichiers :", it="File:")

# ------------------------------------------------------------------ turn 1
# The photos in the run's order: page 15 (exercises 4 and 5), then page 14 (exercises 1 to 3).

TURN1 = [
    ("photos", None),
    ("ask", None),
    ("ai", "status1"),
    ("fold", "read"),

    ("ai", dict(
        en="WebFetch only summarises the manual, and the page warns against exactly that. I’ll try loading the original text directly, and I’m making an empty directory of my own for it.",
        de="WebFetch fasst das Handbuch nur zusammen, die Seite warnt aber genau davor. Ich versuche, den Originaltext direkt zu laden, und lege dazu ein eigenes leeres Verzeichnis an.",
        fr="WebFetch ne fait que résumer le manuel, et la page met justement en garde contre cela. J’essaie de charger directement le texte original, et je crée pour cela un répertoire vide à moi.",
        it="WebFetch riassume soltanto il manuale, e la pagina avverte proprio di questo. Provo a caricare direttamente il testo originale, e per farlo creo una cartella vuota tutta mia.")),
    ("fold", "ran"),

    ("ai", dict(
        en="Read the manual in the original; `verify.py` is harmless. I’ll also look at `preview.py` and check which fonts and libraries I have for drawing the number lines.",
        de="Das Handbuch im Original gelesen, `verify.py` ist harmlos. Ich schaue mir noch `preview.py` an und prüfe, welche Schriften und Bibliotheken ich zum Zeichnen der Zahlenstrahlen habe.",
        fr="J’ai lu le manuel original, `verify.py` est sans danger. Je regarde encore `preview.py` et je vérifie de quelles polices et bibliothèques je dispose pour dessiner les droites graduées.",
        it="Ho letto il manuale originale, `verify.py` è innocuo. Guardo ancora `preview.py` e controllo quali font e librerie ho per disegnare le rette numeriche.")),
    ("fold", "made1"),

    ("ai", dict(
        en="The quiz “Big numbers on the number line” is ready: 12 questions in English, the large numbers written as on your sheets (a space between groups of three digits from five digits up, none in four-digit numbers). I looked up the format in the manual on classyquiz.pages.dev. `verify.py` reports “ok”, and I computed the solutions from the same numbers that draw the pictures.",
        de="Das Quiz «Grosse Zahlen am Zahlenstrahl» ist fertig: 12 Fragen auf Deutsch in Schweizer Schreibweise (grosse Zahlen mit Abstand ab fünf Stellen, vierstellige ohne). Ich habe das Format im Handbuch von classyquiz.pages.dev nachgelesen. `verify.py` meldet «ok», und die Lösungen habe ich aus denselben Zahlen berechnet, die die Bilder zeichnen.",
        fr="Le quiz « Les grands nombres sur la droite graduée » est prêt : 12 questions en français, les grands nombres écrits comme sur tes fiches (une espace entre les groupes de trois chiffres à partir de cinq chiffres, aucune pour ceux à quatre chiffres). J’ai vérifié le format dans le manuel de classyquiz.pages.dev. `verify.py` répond « ok », et j’ai calculé les solutions à partir des mêmes nombres qui servent à dessiner les images.",
        it="Il quiz «I grandi numeri sulla retta numerica» è pronto: 12 domande in italiano, con i grandi numeri scritti come sulle tue schede (uno spazio tra i gruppi di tre cifre da cinque cifre in su, nessuno nei numeri di quattro cifre). Ho controllato il formato nel manuale di classyquiz.pages.dev. `verify.py` risponde «ok», e ho calcolato le soluzioni dagli stessi numeri con cui sono disegnate le immagini.")),

    ("ai", dict(
        en="**Structure** (new numbers, not copied 1:1 from the sheets)",
        de="**Aufbau** (neue Zahlen, nicht 1:1 von den Blättern)",
        fr="**Structure** (de nouveaux nombres, pas une copie à l’identique des fiches)",
        it="**Struttura** (numeri nuovi, non copiati 1:1 dalle schede)")),
    ("bullets", [
        dict(
            en=f"**Reading the arrow, like no.{NB}1** (questions 1, 4, 6, 9, 12): the number line as a picture, four numbers to choose from. The wrong answers are typical mistakes, such as one tick off or mirrored across the middle mark.",
            de=f"**Pfeil ablesen wie Nr.{NB}1** (Fragen 1, 4, 6, 9, 12): Zahlenstrahl als Bild, vier Zahlen zur Auswahl. Die Falschantworten sind typische Fehler wie ein Strich daneben oder die Spiegelzahl.",
            fr=f"**Lire la flèche, comme le n°{NB}1** (questions 1, 4, 6, 9, 12) : la droite graduée en image, quatre nombres au choix. Les mauvaises réponses sont des erreurs typiques, comme un trait à côté ou le nombre symétrique par rapport au milieu.",
            it=f"**Leggere la freccia, come il n.{NB}1** (domande 1, 4, 6, 9, 12): la retta numerica come immagine, quattro numeri tra cui scegliere. Le risposte sbagliate sono errori tipici, come una tacca più in là o il numero simmetrico rispetto al centro."),
        dict(
            en=f"**The number in the middle, like no.{NB}3** (questions 2, 5, 8, 11): text-only questions.",
            de=f"**Zahl in der Mitte wie Nr.{NB}3** (Fragen 2, 5, 8, 11): reine Textfragen.",
            fr=f"**Le nombre au milieu, comme le n°{NB}3** (questions 2, 5, 8, 11) : des questions de texte seulement.",
            it=f"**Il numero a metà, come il n.{NB}3** (domande 2, 5, 8, 11): domande solo di testo."),
        dict(
            en=f"**Matching the section, like no.{NB}4** (questions 3, 7, 10): a picture with sections A to D, and the answers “Section A” and so on. Question 10 has the option “On none of the sections”.",
            de=f"**Abschnitt zuordnen wie Nr.{NB}4** (Fragen 3, 7, 10): Bild mit Abschnitten A bis D, dazu Antworten «Abschnitt A» usw. Frage 10 hat die Option «Auf keinem Abschnitt».",
            fr=f"**Trouver le segment, comme le n°{NB}4** (questions 3, 7, 10) : une image avec les segments A à D, et les réponses « Segment A », etc. La question 10 a l’option « Sur aucun segment ».",
            it=f"**Trovare il segmento, come il n.{NB}4** (domande 3, 7, 10): un’immagine con i segmenti da A a D, e le risposte «Segmento A» ecc. La domanda 10 ha l’opzione «Su nessun segmento»."),
    ]),

    ("ai", dict(
        en="**Difficulty:** questions 1 to 4 are easy (each tick worth 1000 or 500), 5 to 8 medium (ticks worth 50, similar-looking sections such as 52 000, 520 000 and 502 000). 9 to 12 are the hardest:",
        de="**Schwierigkeit:** Fragen 1 bis 4 sind leicht (Strichwert 1000 oder 500), 5 bis 8 mittel (Strichwert 50, ähnlich aussehende Abschnitte wie 52 000, 520 000 und 502 000). 9 bis 12 sind am schwierigsten:",
        fr="**Difficulté :** les questions 1 à 4 sont faciles (un trait vaut 1000 ou 500), 5 à 8 moyennes (un trait vaut 50, des segments qui se ressemblent, comme 52 000, 520 000 et 502 000). 9 à 12 sont les plus difficiles :",
        it="**Difficoltà:** le domande da 1 a 4 sono facili (una tacca vale 1000 o 500), da 5 a 8 medie (una tacca vale 50, segmenti simili come 52 000, 520 000 e 502 000). Da 9 a 12 sono le più difficili:")),
    ("bullets", [
        dict(en="**Question 9:** each tick is worth 25.", de="**Frage 9:** Strichwert 25.",
             fr="**Question 9 :** un trait vaut 25.", it="**Domanda 9:** una tacca vale 25."),
        dict(en="**Question 10:** the number is on none of the sections.", de="**Frage 10:** Die Zahl liegt auf keinem der Abschnitte.",
             fr="**Question 10 :** le nombre ne se trouve sur aucun des segments.", it="**Domanda 10:** il numero non si trova su nessuno dei segmenti."),
        dict(en="**Question 11:** the middle of 490 000 and 510 000 crosses into the next hundred thousand.",
             de="**Frage 11:** Die Mitte von 490 000 und 510 000 liegt über einer Tausenderstelle.",
             fr="**Question 11 :** le milieu de 490 000 et 510 000 passe à la centaine de mille suivante.",
             it="**Domanda 11:** il punto medio tra 490 000 e 510 000 passa al centinaio di migliaia successivo."),
        dict(en="**Question 12:** the arrow is just left of 900 000, at 899 970.", de="**Frage 12:** Der Pfeil steht links von 900 000 bei 899 970.",
             fr="**Question 12 :** la flèche est juste à gauche de 900 000, à 899 970.", it="**Domanda 12:** la freccia è appena a sinistra di 900 000, a 899 970."),
    ]),

    ("ai", dict(
        en="I haven’t chosen a way of playing; you set that on the site (on your own, with friends, or as quizmaster on the projector). The quiz has no explanations, so the children only see which answer was right. If you play it yourself and don’t want to see the solutions, don’t look at the overview file.",
        de="Ich habe kein Spielformat gewählt, das stellst du auf der Seite ein (allein, mit Freunden oder als Quizmaster am Beamer). Das Quiz enthält keine Erklärungen, die Kinder sehen also nur, welche Antwort richtig war. Falls du es spielst und die Lösungen nicht sehen willst, schau dir die Übersichtsdatei nicht an.",
        fr="Je n’ai pas choisi de façon de jouer, tu la choisis sur le site (en solo, entre amis ou en quizmaster au vidéoprojecteur). Le quiz ne contient pas d’explications : les enfants voient donc seulement quelle réponse était juste. Si tu y joues toi-même et que tu ne veux pas voir les solutions, ne regarde pas le fichier d’aperçu.",
        it="Non ho scelto un modo di gioco, lo scegli tu sul sito (per conto tuo, con gli amici o come quizmaster al proiettore). Il quiz non contiene spiegazioni, quindi i bambini vedono solo quale risposta era giusta. Se ci giochi tu e non vuoi vedere le soluzioni, non guardare il file della panoramica.")),

    ("ai", FILES),
    ("bullets", [
        {lang: "{zip1}" for lang in LANGS},
        dict(en="review.png (an overview of all questions with the right answers marked)",
             de="review.png (Übersicht aller Fragen mit markierten richtigen Antworten)",
             fr="review.png (un aperçu de toutes les questions, les bonnes réponses marquées)",
             it="review.png (una panoramica di tutte le domande con le risposte giuste segnate)"),
    ]),
    ("review", None),
    ("chip", 0),
    ("all", None),
]

# ------------------------------------------------------------------ turn 2

TURN2 = [
    ("user", "ask2"),
    ("fold", "status2"),

    ("ai", dict(
        en="Understood: the three section questions get pictures as answers, and I’ll replace questions 2 and 11 with reversed arrow questions. First I’ll check on the layout page how picture answers are shown, so that I choose suitable picture formats.",
        de="Verstanden: Die drei Abschnitts-Fragen bekommen Bilder als Antworten, und Frage 2 und 11 ersetze ich durch umgekehrte Pfeil-Aufgaben. Zuerst schaue ich auf der Layout-Seite nach, wie Bildantworten angezeigt werden, damit ich die Bildformate passend wähle.",
        fr="Compris : les trois questions sur les segments auront des images comme réponses, et je remplace les questions 2 et 11 par des exercices de flèche inversés. Je regarde d’abord sur la page de mise en page comment les réponses en image sont affichées, pour choisir des formats d’image adaptés.",
        it="Capito: le tre domande sui segmenti avranno immagini come risposte, e sostituisco le domande 2 e 11 con esercizi sulla freccia al contrario. Prima controllo sulla pagina del layout come vengono mostrate le risposte con immagini, così scelgo i formati giusti.")),
    ("fold", "made2"),

    ("ai", dict(
        en="The second version of the quiz is ready, again with 12 questions. `verify.py` reports “ok”. I couldn’t try out whether the picture answers read well on the site; according to the site’s layout description it arranges strips like these two by two.",
        de="Die zweite Version des Quiz ist fertig, wieder mit 12 Fragen. `verify.py` meldet «ok». Ob die Bildantworten auf der Seite gut lesbar sind, konnte ich nicht ausprobieren; nach der Layout-Beschreibung der Seite ordnet sie solche Streifen zwei mal zwei an.",
        fr="La deuxième version du quiz est prête, toujours avec 12 questions. `verify.py` répond « ok ». Je n’ai pas pu essayer si les réponses en image se lisent bien sur le site ; d’après la description de la mise en page, le site dispose ces bandes deux par deux.",
        it="La seconda versione del quiz è pronta, sempre con 12 domande. `verify.py` risponde «ok». Non ho potuto provare se le risposte con immagini si leggono bene sul sito; secondo la descrizione del layout il sito dispone queste strisce due per due.")),

    ("ai", dict(en="**Picture answers**", de="**Bildantworten**", fr="**Réponses en image**", it="**Risposte con immagini**")),
    # A bullet given as (text, [sub-bullets]) has its sub-bullets under it.
    ("bullets", [
        dict(
            en="**Questions 3, 7 and 10** (“Which section is the number … on?”): each answer is a number-line section of its own, with its start and end numbers; the letters A to D are gone. In question 10, three answers are pictures and the fourth is the text “On none of them” (right: 99 000 is on none of the sections). That text is fixed in last place.",
            de="**Fragen 3, 7 und 10** («Auf welchem Abschnitt liegt die Zahl …?»): Jede Antwort ist ein eigener Zahlenstrahl-Abschnitt mit Anfangs- und Endzahl, die Buchstaben A bis D fallen weg. Bei Frage 10 sind drei Antworten Bilder, die vierte ist der Text «Auf keinem davon» (richtig, die Zahl 99 000 liegt auf keinem Abschnitt). Der Text steht dort fest an letzter Stelle.",
            fr="**Questions 3, 7 et 10** (« Sur quel segment se trouve le nombre … ? ») : chaque réponse est un segment de droite graduée à part, avec son nombre de début et de fin ; les lettres A à D disparaissent. À la question 10, trois réponses sont des images, la quatrième est le texte « Sur aucun d’eux » (juste : 99 000 ne se trouve sur aucun segment). Ce texte reste fixé en dernière position.",
            it="**Domande 3, 7 e 10** («Su quale segmento si trova il numero …?»): ogni risposta è un segmento di retta numerica a sé, con il numero iniziale e finale; le lettere da A a D spariscono. Nella domanda 10 tre risposte sono immagini, la quarta è il testo «Su nessuno» (giusta: 99 000 non si trova su nessun segmento). Quel testo resta fisso all’ultimo posto."),
        (dict(
            en="**Questions 2 and 11** (the two middle-number questions you found too easy): I replaced them with reversed arrow questions, so the children pick the picture with the right arrow.",
            de="**Fragen 2 und 11** (die beiden Mitte-Aufgaben, die dir zu einfach waren): Ich habe sie durch umgekehrte Pfeil-Aufgaben ersetzt, die Kinder wählen also das Bild mit dem richtigen Pfeil.",
            fr="**Questions 2 et 11** (les deux exercices du nombre au milieu, trop faciles pour toi) : je les ai remplacées par des exercices de flèche inversés ; les enfants choisissent donc l’image avec la bonne flèche.",
            it="**Domande 2 e 11** (i due esercizi del numero a metà, che per te erano troppo facili): le ho sostituite con esercizi sulla freccia al contrario, quindi i bambini scelgono l’immagine con la freccia giusta."), [
            dict(
                en="**Question 2:** “Which arrow shows 735 000?” on the line from 700 000 to 800 000 (each tick worth 5000).",
                de="**Frage 2:** «Welcher Pfeil zeigt 735 000?» auf dem Strahl von 700 000 bis 800 000 (Strichwert 5000).",
                fr="**Question 2 :** « Quelle flèche indique 735 000 ? » sur la droite de 700 000 à 800 000 (un trait vaut 5000).",
                it="**Domanda 2:** «Quale freccia indica 735 000?» sulla retta da 700 000 a 800 000 (una tacca vale 5000)."),
            dict(
                en="**Question 11:** “Which arrow shows 37 200?” on the line from 34 000 to 38 000 (each tick worth 200). The wrong arrows are one tick off or mirrored.",
                de="**Frage 11:** «Welcher Pfeil zeigt 37 200?» auf dem Strahl von 34 000 bis 38 000 (Strichwert 200). Die falschen Pfeile liegen einen Strich daneben oder gespiegelt.",
                fr="**Question 11 :** « Quelle flèche indique 37 200 ? » sur la droite de 34 000 à 38 000 (un trait vaut 200). Les mauvaises flèches sont décalées d’un trait ou symétriques.",
                it="**Domanda 11:** «Quale freccia indica 37 200?» sulla retta da 34 000 a 38 000 (una tacca vale 200). Le frecce sbagliate sono spostate di una tacca o simmetriche."),
        ]),
    ]),

    ("ai", dict(
        en="Questions 1, 4, 5, 6, 8, 9 and 12 are unchanged. Two middle-number questions (5 and 8) are still in, so that this type comes up too. If they’re too easy for you, I can make them harder or replace them with more reversed questions.",
        de="Fragen 1, 4, 5, 6, 8, 9 und 12 sind unverändert. Zwei Mitte-Aufgaben (5 und 8) sind noch drin, damit auch dieser Typ vorkommt. Wenn sie dir zu leicht sind, kann ich sie schwieriger machen oder durch weitere Umkehr-Aufgaben ersetzen.",
        fr="Les questions 1, 4, 5, 6, 8, 9 et 12 n’ont pas changé. Deux exercices du nombre au milieu (5 et 8) restent, pour que ce type soit aussi présent. S’ils te semblent trop faciles, je peux les rendre plus difficiles ou les remplacer par d’autres exercices inversés.",
        it="Le domande 1, 4, 5, 6, 8, 9 e 12 sono invariate. Due esercizi del numero a metà (5 e 8) sono rimasti, così c’è anche questo tipo. Se ti sembrano troppo facili, posso renderli più difficili o sostituirli con altri esercizi al contrario.")),

    ("ai", FILES),
    ("bullets", [
        {lang: "{zip2}" for lang in LANGS},
        dict(en="review-v2.png (overview)", de="review-v2.png (Übersicht)", fr="review-v2.png (aperçu)", it="review-v2.png (panoramica)"),
    ]),
    ("review", None),
    ("chip", 1),
    ("all", None),
    ("reactions", None),
]
