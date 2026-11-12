"""The words of the example conversation, per language, for review side by side.

One entry per piece of the chat, in the order the chat shows them; under each
the four languages, en first. en is the real run's (a free Claude Sonnet,
4 Nov 2026, read from docs/example/sheets-conversation-original.webp); de, fr and it
are drafts for the owner's review (docs/translation-review.md). Where a piece
is also in the landing's film, it is the film's wording
(CONTENT in docs/film/build/film.js; build.py refuses to build if they differ).

de, fr and it render what each moment means in that language, not the English
words: where the English rests on the teacher writing English to German sheets
(the AI's question about the quiz's language), the German chat has the German
situation. Where the AI quotes the sheets, de quotes their own German.

Markup: **bold**, `code`. A plain space between a digit and three digits is a
thousands separator (build.py makes it a no-break space), and in fr a space
before : ; ? ! and inside « » is a no-break space too. {zip} is the chat's .zip
file name in the language (from FILMS below).
"""

LANGS = ("en", "de", "fr", "it")

# What the film says for these (build.py checks them against film.js CONTENT).
FILM = {
    "en": dict(zipTitle="Big numbers quiz", zipFile="big-numbers-quiz.zip",
               title="Big numbers on the number line",
               q1="Which number does the arrow show?",
               q4="Which number line has an arrow at 654 000?",
               ask2="Please add some questions where the number is given and they have to pick the matching marked number line.",
               status1="Fetching the classyquiz.pages.dev page now.",
               status2="Planning the spacing of the four new number-line questions"),
    "de": dict(zipTitle="Grosse Zahlen Quiz", zipFile="grosse-zahlen-quiz.zip",
               title="Grosse Zahlen am Zahlenstrahl",
               q1="Welche Zahl zeigt der Pfeil?",
               q4="Welcher Zahlenstrahl hat einen Pfeil bei 654 000?",
               ask2="Bitte füge ein paar Fragen hinzu, bei denen die Zahl gegeben ist und sie den passenden markierten Zahlenstrahl auswählen müssen.",
               status1="Rufe jetzt die Seite classyquiz.pages.dev ab.",
               status2="Plane die Abstände der vier neuen Zahlenstrahl-Fragen"),
    "fr": dict(zipTitle="Quiz grands nombres", zipFile="quiz-grands-nombres.zip",
               title="Les grands nombres sur la droite graduée",
               q1="Quel nombre la flèche montre-t-elle ?",
               q4="Quelle droite graduée a une flèche à 654 000 ?",
               ask2="Ajoute s’il te plaît quelques questions où le nombre est donné et où ils doivent choisir la droite graduée marquée qui correspond.",
               status1="Je consulte la page classyquiz.pages.dev.",
               status2="Planification de l’espacement des quatre nouvelles questions sur la droite graduée"),
    "it": dict(zipTitle="Quiz grandi numeri", zipFile="quiz-grandi-numeri.zip",
               title="I grandi numeri sulla retta numerica",
               q1="Quale numero indica la freccia?",
               q4="Quale retta numerica ha una freccia a 654 000?",
               ask2="Per favore aggiungi alcune domande in cui il numero è dato e devono scegliere la retta numerica segnata corrispondente.",
               status1="Sto leggendo la pagina classyquiz.pages.dev.",
               status2="Pianifico la spaziatura delle quattro nuove domande sulla retta numerica"),
}

# The app's own words around the chat (the run was in a German app: its status lines were German;
# each language here shows what that language's app would).
UI = {
    "ran": dict(
        en="Ran a command, shared files",
        de="Hat einen Befehl ausgeführt, Dateien geteilt",
        fr="Commande exécutée, fichiers partagés",
        it="Comando eseguito, file condivisi"),
    "tool": dict(
        en="Used a tool",
        de="Hat ein Tool verwendet",
        fr="Outil utilisé",
        it="Strumento utilizzato"),
    "failed": dict(
        en="Failed",
        de="Fehlgeschlagen",
        fr="Échec",
        it="Non riuscito"),
    "zipSub": dict(en="ZIP", de="ZIP", fr="ZIP", it="ZIP"),
}

# ------------------------------------------------------------------ turn 1

TURN1 = [
    ("user", dict(
        en="Read classyquiz.pages.dev. Can you make me a classyQuiz with exercises from these two sheets? For my 4th grade class.",
        de="Lies classyquiz.pages.dev. Kannst du mir ein classyQuiz mit Aufgaben von diesen zwei Blättern machen? Für meine 4. Klasse.",
        fr="Lis classyquiz.pages.dev. Tu peux me faire un classyQuiz avec des exercices de ces deux fiches ? Pour ma classe de CM1.",
        it="Leggi classyquiz.pages.dev. Mi puoi fare un classyQuiz con gli esercizi di queste due schede? Per la mia quarta elementare.")),

    ("status", "status1"),

    ("ai", dict(
        en="I’ll start by reading the ClassyQuiz page to see what format it expects.",
        de="Ich lese zuerst die ClassyQuiz-Seite, um zu sehen, welches Format sie erwartet.",
        fr="Je commence par lire la page ClassyQuiz pour voir quel format elle attend.",
        it="Per prima cosa leggo la pagina di ClassyQuiz per vedere che formato richiede.")),

    ("fold", dict(
        en="Fetched: classyQuiz",
        de="Abgerufen: classyQuiz",
        fr="Consulté : classyQuiz",
        it="Letto: classyQuiz")),

    # The AI's two questions with the teacher's answers, as one grey card on the right.
    # The labels are each language's app's own (Q/A, Frage/Antwort, Question/Réponse, Domanda/Risposta).
    # The language question rests on the sheets being German: where the teacher writes German too (de),
    # the AI asks to confirm German instead.
    ("qa", [
        (dict(
            en="Q: Which language should the quiz be in? The sheets are German, but you wrote to me in English.",
            de="F: In welcher Sprache soll das Quiz sein? Auf Deutsch, wie die Blätter?",
            fr="Q : Dans quelle langue veux-tu le quiz ? Les fiches sont en allemand, mais tu m’as écrit en français.",
            it="D: In che lingua vuoi il quiz? Le schede sono in tedesco, ma mi hai scritto in italiano."),
         dict(
            en="A: English",
            de="A: Deutsch",
            fr="R : Français",
            it="R: Italiano")),
        (dict(
            en="Q: How long should the quiz be?",
            de="F: Wie lang soll das Quiz sein?",
            fr="Q : Quelle longueur doit avoir le quiz ?",
            it="D: Quanto deve essere lungo il quiz?"),
         dict(
            en="A: About 10 questions",
            de="A: Etwa 10 Fragen",
            fr="R : Une dizaine de questions",
            it="R: Una decina di domande")),
    ]),

    ("fold", dict(
        en="Checking arrow positions for the number-line questions",
        de="Prüfe die Pfeilpositionen der Zahlenstrahl-Fragen",
        fr="Vérification de la position des flèches pour les questions sur la droite graduée",
        it="Controllo le posizioni delle frecce per le domande sulla retta numerica")),

    ("ai", dict(
        en="Thanks. Next I’ll draw the number lines and pack everything into a `.zip`.",
        de="Danke. Als Nächstes zeichne ich die Zahlenstrahlen und packe alles in eine `.zip`-Datei.",
        fr="Merci. Je vais maintenant dessiner les droites graduées et tout mettre dans un `.zip`.",
        it="Grazie. Ora disegno le rette numeriche e metto tutto in un file `.zip`.")),

    ("fold", "ran"),

    ("ai", dict(
        en="Your quiz is ready as `{zip}`. Upload it on classyquiz.pages.dev to run it.",
        de="Dein Quiz ist fertig: `{zip}`. Lade es auf classyquiz.pages.dev hoch, um es zu starten.",
        fr="Ton quiz est prêt : `{zip}`. Importe-le sur classyquiz.pages.dev pour le lancer.",
        it="Il tuo quiz è pronto: `{zip}`. Caricalo su classyquiz.pages.dev per avviarlo.")),

    ("ai", dict(
        en="It has 10 questions in English, with new numbers in the style of the sheets rather than a 1:1 copy:",
        de="Es hat 10 Fragen auf Deutsch, mit neuen Zahlen im Stil der Blätter statt einer 1:1-Kopie:",
        fr="Il compte 10 questions en français, avec de nouveaux nombres dans le style des fiches plutôt qu’une copie à l’identique :",
        it="Ha 10 domande in italiano, con numeri nuovi nello stile delle schede invece di una copia 1:1:")),

    ("bullets", [
        dict(
            en="**Questions 1–3:** read the arrow on a number line. The step size is different each time (2000, 50, 20), so students have to work out what one small tick is worth first.",
            de="**Fragen 1–3:** den Pfeil auf einem Zahlenstrahl ablesen. Die Schrittweite ist jedes Mal anders (2000, 50, 20), die Kinder müssen also zuerst herausfinden, was ein kleiner Strich wert ist.",
            fr="**Questions 1 à 3 :** lire la flèche sur une droite graduée. Le pas change à chaque fois (2000, 50, 20) : les élèves doivent donc d’abord trouver ce que vaut un petit trait.",
            it="**Domande 1–3:** leggere la freccia su una retta numerica. Il passo cambia ogni volta (2000, 50, 20), quindi gli alunni devono prima capire quanto vale una piccola tacca."),
        dict(
            en="**Questions 4–6:** count on in steps of 20 000, 500 and 50.",
            de="**Fragen 4–6:** in 20 000er-, 500er- und 50er-Schritten weiterzählen.",
            fr="**Questions 4 à 6 :** compter de 20 000 en 20 000, de 500 en 500 et de 50 en 50.",
            it="**Domande 4–6:** contare di 20 000 in 20 000, di 500 in 500 e di 50 in 50."),
        dict(
            en="**Questions 7–8:** find the number exactly in the middle of two others.",
            de="**Fragen 7–8:** die Zahl finden, die genau in der Mitte zwischen zwei anderen liegt.",
            fr="**Questions 7 et 8 :** trouver le nombre situé exactement au milieu de deux autres.",
            it="**Domande 7–8:** trovare il numero che sta esattamente a metà tra altri due."),
        dict(
            en="**Questions 9–10:** use one picture of the four sections A–D to say which section a number lies on, or which number belongs on section C.",
            de="**Fragen 9–10:** mit einem Bild der vier Abschnitte A–D sagen, auf welchem Abschnitt eine Zahl liegt oder welche Zahl auf Abschnitt C gehört.",
            fr="**Questions 9 et 10 :** à l’aide d’une image des quatre segments A–D, dire sur quel segment se trouve un nombre, ou quel nombre va sur le segment C.",
            it="**Domande 9–10:** con un’immagine dei quattro segmenti A–D, dire su quale segmento si trova un numero o quale numero va sul segmento C."),
    ]),

    # The AI's "sheet 1" for the none-of-the-sections case is as in the run (that case is on the second photo).
    # de quotes the sheet's own heading (exercise 5); fr and it translate it.
    ("ai", dict(
        en="I drew the number lines myself, so the numbers on them aren’t from your sheet. I left out the “draw it on squared paper” exercise (sheet 2, exercise 5) because students can’t draw on their phones. I also didn’t use sheet 1’s “none of the sections” case, since it needs a fifth answer and the site allows four.",
        de="Die Zahlenstrahlen habe ich selbst gezeichnet, die Zahlen darauf stammen also nicht von deinem Blatt. Die Aufgabe «Zeichne den Abschnitt auf Häuschenpapier» (Blatt\u00a02, Aufgabe\u00a05) habe ich weggelassen, weil die Kinder auf ihren Handys nicht zeichnen können. Auch den Fall «auf keinem der Abschnitte» von Blatt\u00a01 habe ich nicht verwendet, da er eine fünfte Antwort braucht und die Seite nur vier zulässt.",
        fr="J’ai dessiné moi-même les droites graduées, donc les nombres qui y figurent ne viennent pas de ta fiche. J’ai laissé de côté l’exercice « Dessine le segment sur du papier quadrillé » (fiche\u00a02, exercice\u00a05), parce que les élèves ne peuvent pas dessiner sur leur téléphone. Je n’ai pas non plus utilisé le cas « sur aucun des segments » de la fiche\u00a01, car il demande une cinquième réponse et le site n’en accepte que quatre.",
        it="Le rette numeriche le ho disegnate io, quindi i numeri non sono quelli della tua scheda. Ho lasciato fuori l’esercizio «Disegna il segmento su carta quadrettata» (scheda\u00a02, esercizio\u00a05), perché gli alunni non possono disegnare sul telefono. Non ho usato nemmeno il caso «su nessuno dei segmenti» della scheda\u00a01, perché richiede una quinta risposta e il sito ne accetta solo quattro.")),

    ("ai", dict(
        en="One thing I couldn’t test is how the pictures look on your projector. You can check them in the teacher’s preview after upload, with the answers folded away.",
        de="Eines konnte ich nicht testen: wie die Bilder auf deinem Beamer aussehen. Du kannst sie nach dem Hochladen in der Lehrervorschau prüfen, mit eingeklappten Antworten.",
        fr="Une chose que je n’ai pas pu tester : le rendu des images sur ton projecteur. Tu peux les vérifier dans l’aperçu enseignant après l’import, avec les réponses masquées.",
        it="Una cosa che non ho potuto verificare è come appaiono le immagini sul tuo proiettore. Puoi controllarle nell’anteprima per l’insegnante dopo il caricamento, con le risposte nascoste.")),

    ("chip", None),
]

# ------------------------------------------------------------------ turn 2

TURN2 = [
    ("user", "ask2"),
    ("fold", "status2"),

    ("ai", dict(
        en="I’ll add three matching questions and place them right after the three “read the arrow” questions.",
        de="Ich füge drei Zuordnungsfragen hinzu und setze sie direkt nach den drei Fragen «Pfeil ablesen».",
        fr="J’ajoute trois questions d’association et je les place juste après les trois questions « lire la flèche ».",
        it="Aggiungo tre domande di abbinamento e le metto subito dopo le tre domande «leggi la freccia».")),

    ("fold", "ran"),

    ("ai", dict(
        en="I’ve updated `{zip}`. It now has 13 questions, with three new ones in the middle as questions 4–6. In each, a number is given and the students pick which of four number lines has the arrow in the right place:",
        de="Ich habe `{zip}` aktualisiert. Das Quiz hat jetzt 13 Fragen; die drei neuen stehen in der Mitte, als Fragen 4–6. Bei jeder ist eine Zahl vorgegeben, und die Kinder wählen, auf welchem der vier Zahlenstrahlen der Pfeil an der richtigen Stelle steht:",
        fr="J’ai mis à jour `{zip}`. Le quiz compte maintenant 13 questions, dont trois nouvelles au milieu (questions 4 à 6). Dans chacune, un nombre est donné et les élèves choisissent laquelle des quatre droites graduées porte la flèche au bon endroit :",
        it="Ho aggiornato `{zip}`. Ora il quiz ha 13 domande, con le tre nuove nel mezzo, come domande 4–6. In ciascuna è dato un numero e gli alunni scelgono quale delle quattro rette numeriche ha la freccia nel punto giusto:")),

    ("bullets", [
        dict(
            en="**Question 4:** the number is 654 000, on the line from 640 000 to 660 000 with steps of 2000. The wrong arrows sit one or two steps off, and one is far off.",
            de="**Frage 4:** Die Zahl ist 654 000, auf dem Zahlenstrahl von 640 000 bis 660 000 in 2000er-Schritten. Die falschen Pfeile liegen einen oder zwei Schritte daneben, einer weit daneben.",
            fr="**Question 4 :** le nombre est 654 000, sur la droite de 640 000 à 660 000 avec un pas de 2000. Les mauvaises flèches sont décalées d’un ou deux pas, et l’une est très loin.",
            it="**Domanda 4:** il numero è 654 000, sulla retta da 640 000 a 660 000 con passo 2000. Le frecce sbagliate sono a uno o due passi di distanza, e una è molto lontana."),
        dict(
            en="**Question 5:** the number is 81 750, on the line from 81 000 to 82 000 with steps of 50. The wrong arrows are one step either side and two steps further on, so students need to count the small ticks.",
            de="**Frage 5:** Die Zahl ist 81 750, auf dem Zahlenstrahl von 81 000 bis 82 000 in 50er-Schritten. Die falschen Pfeile liegen einen Schritt links und rechts davon und zwei Schritte weiter; die Kinder müssen also die kleinen Striche zählen.",
            fr="**Question 5 :** le nombre est 81 750, sur la droite de 81 000 à 82 000 avec un pas de 50. Les mauvaises flèches sont à un pas de chaque côté et à deux pas plus loin : les élèves doivent donc compter les petits traits.",
            it="**Domanda 5:** il numero è 81 750, sulla retta da 81 000 a 82 000 con passo 50. Le frecce sbagliate sono a un passo per parte e a due passi più avanti, quindi gli alunni devono contare le piccole tacche."),
        dict(
            en="**Question 6:** the number is 308 080, on the line from 307 900 to 308 100 with steps of 20.",
            de="**Frage 6:** Die Zahl ist 308 080, auf dem Zahlenstrahl von 307 900 bis 308 100 in 20er-Schritten.",
            fr="**Question 6 :** le nombre est 308 080, sur la droite de 307 900 à 308 100 avec un pas de 20.",
            it="**Domanda 6:** il numero è 308 080, sulla retta da 307 900 a 308 100 con passo 20."),
    ]),

    ("ai", dict(
        en="All four pictures in a question have the same shape and labels, and only the arrow moves. That is also why the site shouldn’t warn about mismatched proportions. The answers stay in the order written (not shuffled), so the correct picture is always the first one in the file. Because the site shuffles answers at upload by default, the order is fixed in the quiz text, so it won’t change on your screen.",
        de="Alle vier Bilder einer Frage haben dieselbe Form und dieselben Beschriftungen, nur der Pfeil verschiebt sich. Darum sollte die Seite auch nicht vor unpassenden Proportionen warnen. Die Antworten bleiben in der Reihenfolge, in der sie geschrieben sind (nicht gemischt), das richtige Bild ist also immer das erste in der Datei. Weil die Seite die Antworten beim Hochladen standardmässig mischt, ist die Reihenfolge im Quiztext festgelegt und ändert sich auf deinem Bildschirm nicht.",
        fr="Les quatre images d’une question ont la même forme et les mêmes étiquettes, seule la flèche bouge. C’est aussi pour cela que le site ne devrait pas signaler de proportions différentes. Les réponses restent dans l’ordre où elles sont écrites (sans mélange), donc la bonne image est toujours la première du fichier. Comme le site mélange par défaut les réponses à l’import, l’ordre est fixé dans le texte du quiz : il ne changera pas sur ton écran.",
        it="Le quattro immagini di una domanda hanno la stessa forma e le stesse etichette, e si sposta solo la freccia. È anche per questo che il sito non dovrebbe segnalare proporzioni diverse. Le risposte restano nell’ordine in cui sono scritte (non mescolate), quindi l’immagine corretta è sempre la prima nel file. Poiché il sito di default mescola le risposte al caricamento, l’ordine è fissato nel testo del quiz e sul tuo schermo non cambierà.")),

    ("ai", dict(
        en="The quiz is now a bit past the 10 questions you asked for. If it’s too long for your lesson, you can skip questions 12–13 during play.",
        de="Das Quiz hat jetzt etwas mehr als die 10 Fragen, die du wolltest. Wenn es für deine Lektion zu lang ist, kannst du die Fragen 12–13 beim Spielen überspringen.",
        fr="Le quiz dépasse maintenant un peu la dizaine de questions demandée. S’il est trop long pour ta leçon, tu peux sauter les questions 12 et 13 pendant la partie.",
        it="Ora il quiz supera di poco la decina di domande che avevi chiesto. Se è troppo lungo per la tua lezione, puoi saltare le domande 12–13 durante il gioco.")),

    ("chip", None),
]

# ------------------------------------------------------------------ turn 3
# The teacher's third message starts in lower case, as in the run.

TURN3 = [
    ("user", dict(
        en="thanks. Can you make a visual preview, just one per question type?",
        de="danke. Kannst du eine visuelle Vorschau machen, nur eine pro Fragetyp?",
        fr="merci. Tu peux faire un aperçu visuel, juste un par type de question ?",
        it="grazie. Puoi fare un’anteprima visiva, solo una per tipo di domanda?")),

    ("fold", dict(
        en="Setting up a visualizer mockup of the projector screens",
        de="Erstelle ein Mock-up der Beamer-Ansichten im Visualizer",
        fr="Préparation d’une maquette visuelle des écrans projetés",
        it="Preparo un mockup visivo delle schermate del proiettore")),

    ("ai", dict(
        en="I’ll check the site’s layout page so the previews match how the class will actually see them.",
        de="Ich schaue mir die Layout-Seite der Website an, damit die Vorschau zeigt, wie die Klasse die Fragen tatsächlich sehen wird.",
        fr="Je regarde la page du site consacrée à la mise en page, pour que les aperçus correspondent à ce que la classe verra vraiment.",
        it="Controllo la pagina sul layout del sito, così le anteprime corrisponderanno a ciò che la classe vedrà davvero.")),

    ("toolfail", None),

    # Four preview cards. The questions are the zip's (the quiz's own wording, questions 1, 4, 7 and 12).
    # The captions name the question types as the bullets below them do.
    ("caption", dict(
        en="Reading an arrow (questions 1–3)",
        de="Pfeil ablesen (Fragen 1–3)",
        fr="Lire une flèche (questions 1 à 3)",
        it="Leggere la freccia (domande 1–3)")),
    ("card_arrow", None),   # question: the film's q1

    ("caption", dict(
        en="Picking the matching number line (questions 4–6)",
        de="Passenden Zahlenstrahl wählen (Fragen 4–6)",
        fr="Choisir la droite graduée qui correspond (questions 4 à 6)",
        it="Scegliere la retta numerica corrispondente (domande 4–6)")),
    ("card_match", None),   # question: the film's q4

    ("caption", dict(
        en="Counting and middle questions, text only (questions 7–11)",
        de="Weiterzählen und Mitte finden, nur Text (Fragen 7–11)",
        fr="Compter et trouver le milieu, texte seul (questions 7 à 11)",
        it="Contare e trovare il numero a metà, solo testo (domande 7–11)")),
    ("card_count", dict(
        en="Count in steps of 20 000: 500 000, 520 000, 540 000, ... What comes next?",
        de="Zähle in 20 000er-Schritten: 500 000, 520 000, 540 000, ... Welche Zahl kommt als Nächstes?",
        fr="Compte de 20 000 en 20 000 : 500 000, 520 000, 540 000, ... Quel nombre vient ensuite ?",
        it="Conta di 20 000 in 20 000: 500 000, 520 000, 540 000, ... Quale numero viene dopo?")),

    ("caption", dict(
        en="Finding the section (questions 12–13)",
        de="Abschnitt finden (Fragen 12–13)",
        fr="Trouver le segment (questions 12 et 13)",
        it="Trovare il segmento (domande 12–13)")),
    ("card_section", dict(
        en="On which section does 45 200 lie?",
        de="Auf welchem Abschnitt liegt 45 200?",
        fr="Sur quel segment se trouve 45 200 ?",
        it="Su quale segmento si trova 45 200?")),

    ("ai", dict(
        en="Above are four mock-ups of how the questions will look on the projector, one per question type. Here is what each one shows:",
        de="Oben siehst du vier Mock-ups, wie die Fragen auf dem Beamer aussehen werden, eines pro Fragetyp. Das zeigen sie im Einzelnen:",
        fr="Ci-dessus, quatre maquettes de ce à quoi ressembleront les questions au projecteur, une par type de question. Voici ce que montre chacune :",
        it="Qui sopra ci sono quattro mock-up di come appariranno le domande sul proiettore, uno per tipo di domanda. Ecco cosa mostra ciascuno:")),

    ("bullets", [
        dict(
            en="**Reading an arrow:** the number line sits full width between the question and the answers, and the four answers are plain text buttons.",
            de="**Pfeil ablesen:** Der Zahlenstrahl steht in voller Breite zwischen Frage und Antworten, und die vier Antworten sind einfache Textknöpfe.",
            fr="**Lire une flèche :** la droite graduée occupe toute la largeur entre la question et les réponses, et les quatre réponses sont de simples boutons de texte.",
            it="**Leggere la freccia:** la retta numerica occupa tutta la larghezza tra la domanda e le risposte, e le quattro risposte sono semplici pulsanti di testo."),
        dict(
            en="**Picking the matching number line:** the question is only a few words, and the four answers are pictures. The coloured frame around each picture is its answer colour.",
            de="**Passenden Zahlenstrahl wählen:** Die Frage besteht nur aus wenigen Wörtern, und die vier Antworten sind Bilder. Der farbige Rahmen um jedes Bild ist seine Antwortfarbe.",
            fr="**Choisir la droite graduée qui correspond :** la question ne fait que quelques mots, et les quatre réponses sont des images. Le cadre coloré autour de chaque image est la couleur de sa réponse.",
            it="**Scegliere la retta numerica corrispondente:** la domanda è di poche parole e le quattro risposte sono immagini. La cornice colorata attorno a ogni immagine è il colore della sua risposta."),
        dict(
            en="**Counting and middle questions:** only text, with the four answer buttons at the bottom.",
            de="**Weiterzählen und Mitte finden:** nur Text, mit den vier Antwortknöpfen unten.",
            fr="**Compter et trouver le milieu :** du texte seulement, avec les quatre boutons de réponse en bas.",
            it="**Contare e trovare il numero a metà:** solo testo, con i quattro pulsanti di risposta in basso."),
        dict(
            en="**Finding the section:** the four sections A–D are one tall picture, and the answers are the letters A–D.",
            de="**Abschnitt finden:** Die vier Abschnitte A–D sind ein einziges hohes Bild, und die Antworten sind die Buchstaben A–D.",
            fr="**Trouver le segment :** les quatre segments A–D forment une seule image haute, et les réponses sont les lettres A–D.",
            it="**Trovare il segmento:** i quattro segmenti A–D sono un’unica immagine alta e le risposte sono le lettere A–D."),
    ]),

    ("ai", dict(
        en="These are my own approximations, so the real site will differ in the exact colours, shapes and spacing. The students’ phones show only the coloured answer buttons and never the question. For the real look, check the teacher preview after you upload the `.zip`.",
        de="Das sind meine eigenen Annäherungen; die echte Website weicht in den genauen Farben, Formen und Abständen also ab. Auf den Handys der Kinder sieht man nur die farbigen Antwortknöpfe, nie die Frage. Wie es wirklich aussieht, siehst du in der Lehrervorschau, nachdem du die `.zip`-Datei hochgeladen hast.",
        fr="Ce sont mes propres approximations : sur le vrai site, les couleurs, les formes et les espacements exacts seront différents. Les téléphones des élèves n’affichent que les boutons de réponse colorés, jamais la question. Pour voir le rendu réel, regarde l’aperçu enseignant après avoir importé le `.zip`.",
        it="Sono approssimazioni mie, quindi nel sito vero colori, forme e spaziature esatti saranno diversi. I telefoni degli alunni mostrano solo i pulsanti colorati delle risposte, mai la domanda. Per vedere l’aspetto reale, controlla l’anteprima per l’insegnante dopo aver caricato il file `.zip`.")),

    ("reactions", None),
]
