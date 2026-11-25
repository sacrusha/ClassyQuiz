"""The words of the test run's conversation in four languages, side by side for review.
The root page's "Test" tab and /example?ex=test show this conversation as a picture.

The owner ran it on 19 Nov 2026 in French with Claude Opus 5.5. He attached the French marked test
(src/public/examples/test-fr.pdf, written by test_sheet.py). The screenshot of the run is
test-conversation-original.webp in this folder.

- fr holds the AI's words from the run. One change: the site's name is spelled "classyQuiz".
- en, de and it are draft translations. They use the same school terms as the test
  sheet and the quiz in that language (test_sheet.py, test_zips.py).
- The pupil's message is not in this file. build.py reads it from askTest in src/client/landing-text.ts, so the
  root page and the picture always show the same message.
- During the run the app displayed its own interface words in English. fr keeps them in English; the other
  languages show them translated.

Markup: {zip} stands for the name of the .zip file in that language (EXAMPLES in faces.py). In fr, build.py turns
the space before : ; ? ! into a no-break space.
"""

LANGS = ("en", "de", "fr", "it")

UI = {
    "made": dict(en="Created a file, shared a file, and 16 more steps",
                 de="Hat eine Datei erstellt, eine Datei geteilt und 16 weitere Schritte",
                 fr="Created a file, shared a file, and 16 more steps",
                 it="Ha creato un file, condiviso un file e altri 16 passaggi"),
    "pdf": dict(en="PDF", de="PDF", fr="PDF", it="PDF"),
    "zipSub": dict(en="ZIP", de="ZIP", fr="ZIP", it="ZIP"),
}

# The quiz's pictures the app shows beside the fold of its steps, by their names in the .zip.
FOLD_PICS = ("cellule-vegetale.png", "cellule-animale.png")

TURN = [
    ("attachment", None),
    ("user", "askTest"),
    ("ai", dict(
        en="I'm reading your test and the classyQuiz site to see how to build the quiz.",
        de="Ich lese deine Prüfung und die classyQuiz-Seite, um zu sehen, wie ich das Quiz erstelle.",
        fr="Je lis ton contrôle et le site classyQuiz pour voir comment créer le quiz.",
        it="Leggo la tua verifica e il sito classyQuiz per vedere come creare il quiz.")),
    ("foldpics", "made"),
    ("ai", dict(
        en="Your quiz is ready: {zip}. It has 22 questions, which takes about 15 minutes in Solo. I haven't shown you any of its content.",
        de="Dein Quiz ist fertig: {zip}. Es hat 22 Fragen, das dauert im Solo-Modus etwa 15 Minuten. Vom Inhalt habe ich dir nichts gezeigt.",
        fr="Ton quiz est prêt : {zip}. Il contient 22 questions, ce qui fait environ 15 minutes en Solo. Je ne t'ai rien montré du contenu.",
        it="Il tuo quiz è pronto: {zip}. Contiene 22 domande, che in Solo richiedono circa 15 minuti. Non ti ho mostrato nulla del contenuto.")),
    ("ai", dict(
        en="Most of the questions are on what you got wrong in the test, and each idea comes back two or three times in different forms. You'll also find a few questions on things you got right, to keep the ideas connected. I checked that the file follows the site's format and that every right answer is correct.",
        de="Die meisten Fragen drehen sich um das, was du in der Prüfung falsch hattest, und jedes Thema kommt zwei- oder dreimal in anderer Form vor. Dazu kommen ein paar Fragen zu Dingen, die du richtig hattest, damit der Zusammenhang erhalten bleibt. Ich habe geprüft, dass die Datei dem Format der Seite entspricht und dass jede richtige Antwort stimmt.",
        fr="La plupart des questions portent sur ce que tu as raté au contrôle, et chaque notion revient deux ou trois fois sous des formes différentes. Tu y trouves aussi quelques questions sur des choses que tu avais réussies, pour garder le lien entre les notions. J'ai vérifié que le fichier respecte le format du site et que chaque bonne réponse est juste.",
        it="La maggior parte delle domande riguarda quello che hai sbagliato nella verifica, e ogni concetto ritorna due o tre volte in forme diverse. Ci sono anche alcune domande su cose che avevi fatto giuste, per tenere collegati i concetti. Ho verificato che il file rispetti il formato del sito e che ogni risposta giusta sia corretta.")),
    ("ai", dict(
        en="At the end, the site offers to copy your answers with the solutions. If you paste them here, I can make you a shorter quiz on what is still shaky.",
        de="Am Ende bietet dir die Seite an, deine Antworten mit den Lösungen zu kopieren. Wenn du sie hier einfügst, mache ich dir ein kürzeres Quiz zu dem, was noch hakt.",
        fr="À la fin, le site te propose de copier tes réponses avec les solutions. Si tu me les colles ici, je peux te refaire un quiz plus court sur ce qui coince encore.",
        it="Alla fine il sito ti propone di copiare le tue risposte con le soluzioni. Se me le incolli qui, posso prepararti un quiz più breve su quello che ancora non va.")),
    ("chip", None),
    ("reactions", None),
]
