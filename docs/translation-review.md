# Translation review: the first page, the film and the worked example

The first page's words in German, French and Italian are in `src/client/landing-text.ts`: drafts
by v6 item 2's implementer, not yet read by the owner. This note holds the choices they rest on, as
questions for that read; a word the owner changes is changed in the file. The film's own words
(`CONTENT` in `docs/film/build/film.js`) and the worked example's are proposals and drafts, below.
A working note: delete it once read. ⍽ stands for U+202F.

## The first page in German, French and Italian (v6 item 2)

Every key of `landing-text.ts`: the page, its states (the box's messages, a quiz to come back to,
the line about an own copy) and the local check's refusals, which speak the page's language
(`design/local-check.md`, "Opening a room"). What holds in each language, and why:
`design/root-page.md`, "Languages". The film types the sheets ask and shows the second step's
heading, button and line, and names its chapters, from this file (`docs/film/build/sitebuild.py`
copies them in); the time bar shows the chapters' names on the page.

For the read:

- **Register**: German "du", French "vous", Italian "tu", to the visitor; "du", "tu", "tu" in the
  asks, which are the visitor's own words to the AI.
- **The two steps**: "Frag deine KI nach einem Quiz" / "Öffne das Quiz deiner KI", "Demandez un
  quiz à votre IA" / "Ouvrez le quiz de votre IA", "Chiedi un quiz alla tua IA" / "Apri il quiz
  della tua IA". German "fragen nach" rather than "bitten um", which reads stiffer.
- **Buttons and links in the infinitive** in German and French, as their interfaces have it:
  ".zip-Datei auswählen", "Choisir le fichier .zip"; Italian "Scegli il file .zip". Under the
  example's file: "Dieses Quiz spielen ↓", "Jouer à ce quiz ↓", "Gioca a questo quiz ↓", the quiz
  of the file beside it; "Das ganze Beispiel ›", "L'exemple complet ›", "Tutto l'esempio ›" for its
  full example, short enough to share a line with it on a 360 px phone; "step by step" alone, which
  /example's title says, read as a way of playing the quiz beside it.
- **The plural of "Quiz"**: German has "die Quiz" in the dictionary and "Quizze" in speech, and
  either reads oddly, so the German words avoid the plural: "Spiel das Quiz, das deine
  KI … macht.", "kann heute kein weiteres Quiz annehmen … nimmt sie wieder eines an". "Mehr Quiz"
  (the way to an own copy) stays: it reads as a singular, in the advertising form, which suits
  a line about more for free (the owner).
- **"Any AI subscription will do, or free Claude."**, beside the first step's heading: "Jedes KI-Abo reicht,
  sonst Claude gratis." / "Tout abonnement IA convient, ou Claude gratuit." / "Va bene ogni
  abbonamento IA, o Claude gratuito.", short enough to stand on one line under the heading at
  360 px. A statement about subscriptions, not an order to use one's own: "Nimm die KI, die du
  abonniert hast" assumed the visitor has one.
- **The first sentence without "own"** in German, French and Italian ("deine KI", "votre IA",
  "la tua IA"): with "eigene", "propre" the sentence took a third line on a phone. The possessive
  still says the AI is the visitor's.
- **Arbeitsblatt**, not Aufgabenblatt, in German: the film's heading, its chapter and its name,
  and the tab. It is a primary teacher's everyday word in Switzerland and Germany, and `/example`
  says it (E5); "Aufgabenblatt" reads like a university problem set.
- **Film or video**, the film's name and its time bar's: German "Film" (a short clip that explains
  is an "Erklärfilm" as much as an "Erklärvideo"), French "vidéo" and Italian "video", the normal
  word there for a minute's clip on a website. The name says it has no sound: "ein Film ohne Ton",
  "une vidéo sans son", "un video senza audio".
- **The tabs' names**, one word each, what an ask starts from, each the word its ask uses for
  what it attaches: German "Idee", "Blätter", "Notizen", "Prüfung"; French "Idée", "Fiches",
  "Cours", "Contrôle"; Italian "Idea", "Schede", "Appunti", "Verifica". French "Cours", not
  "Notes", and its ask "nos notes de cours": "notes" beside "Contrôle" also reads as marks, and
  a student's "mes cours" are their class notes. The test is the school
  word for a marked test in each ("Prüfung" as Swiss schools say it, "contrôle", "verifica"),
  not "Test", which in German and French also reads as trying the site out. The fifth tab:
  "Unsicher?" in German, which fits a 360 px row where "Nicht sicher?" didn't (3 px are left),
  "Un doute ?", "Dubbi?", French without "pas sûr", which is gendered; its tooltip, "Rien de tout
  cela, ou pas encore sûr", still has the gendered word. Drafts nobody has read.
- **The ways' pictures' names**, on the check's cards: Italian "schermo grande", the adjective
  after the noun, in Quizmaster's: "il grande schermo" is the cinema.
- **The sentence** says who plays, in the check's cards' order of words: German "Spiel das Quiz,
  das deine KI macht: in der Klasse oder Gruppe, mit Freunden oder allein." ("mit Klasse" also
  reads as "stylish"; the singular, as above); French "Jouez aux quiz que votre IA crée : en classe
  ou en groupe, entre amis, ou en solo." ("en solo" for Solo without "seul" or "seule", which are
  gendered); Italian "Gioca ai quiz che la tua IA crea: in classe o in gruppo, tra amici o per
  conto tuo." Three lines on a 360 px phone in each language, two on a desktop. German "deine KI"
  and Italian "la tua IA" carry no "own": "deine eigene KI" reads as an AI one owns.
- **The file's card**: the face's name "Die erste Frage des Quiz:", "La première question du
  quiz :", "La prima domanda del quiz:", then the question as the quiz has it; the download's
  tooltip "Herunterladen", "Télécharger", "Scarica", as a file's in a chat; the size with the
  language's decimal comma and French "Ko", "Mo".
- **Seite, plus**: a noun the page has for two things (`design/root-page.md`, "Languages").
  "Eine eigene Website" for a site of one's own, in the link and the line about busy days;
  everywhere else the site stays "die Seite", as people say it. "Davantage de quiz⍽: …" and
  "Pour davantage de quiz, …".
- **The sheets ask**: "like no. 1, 3 and 4" is "wie", "comme", "come" in each, without "similar"
  (ähnlich, simili), so each language says what the English says. German puts "machen" last, where
  German puts it: "Kannst du mir ein classyQuiz mit Aufgaben wie Nr. 1, 3 und 4 von diesen zwei
  Blättern machen?". "Von", not "auf": "auf diesen zwei Blättern" stands before "machen" and could
  be taken with it, and the conversation on `/example` says "von diesen zwei Blättern" too. The
  film types this ask, so it follows a change to it at its build. Italian "una decina di domande",
  as French "une dizaine". The grade is the example run's, 4th (`design/root-page.md`, "Two
  steps"), in each region's word: "4. Klasse", "CM1" (Romandie says 6H, and the times on this
  page are "heure suisse"), "quarta elementare".
- **The idea's ask**, the owner's German run tidied, the others its translation: "Ich brauche ein
  classyQuiz über den Weltraum, 4. Klasse, mit Bildern. Die Planetenreihenfolge ist bekannt,
  Mondnamen wären zu schwierig. Schaffst du 20 Fragen, ohne dass es repetitiv wird? Sonst
  weniger." The run's "repetitiv" stays, the owner's word; "Planeterreihenfolge" and "is" are
  his slips, tidied. The other three say what the German says, in the words the run's
  conversation on `/example` has for it (`docs/example/space_text.py`): "Can you manage 20
  questions without it getting repetitive?", "Tu arrives à faire 20 questions sans que ça
  devienne répétitif⍽?", "Riesci a fare 20 domande senza che diventi ripetitivo?". French
  "niveau CM1" and Italian "quarta elementare", as the sheets ask's grade.
- **The notes' and the test's asks** are stand-ins until the owner's runs, and go with them;
  their words aside, French "notes de cours" (above, the tabs).
- **Small words**: "Vom Arbeitsblatt zum Quiz in der Klasse, in einer Minute" over the film ("zur spielenden Klasse" was the English
  participle); "Die Seite kann dieses Quiz noch nicht starten:", the subject first, since "Dieses
  Quiz kann die Seite …" doesn't show which of the two can't. French "Code pour participer" on
  the card of a quiz to come back to ("rejoindre" wants an object); "et non de texte" in the
  box's refusals, where "pas de texte" also reads "no text". The link after the line about busy
  days: "So geht's ›", "comment faire ›", "ecco come ›". The marker beside a stand-in's tab,
  until the owner's runs: "Platzhalter", "provisoire", "segnaposto". Left as it is, correct and a
  little heavy: Italian "servizio informatico".
- **French spaces**: U+202F before ; : ? ! in everything, the asks included, so a "?" never starts
  a line; the film types the sheets ask with it. A no-break space keeps a number with its word
  in the sheets ask ("Nr. 1", "4. Klasse", "n° 1", "n. 1"; `design/root-page.md`, "Two steps").
- **Apostrophes**: the keyboard's ' on the page and on `/example` alike ("l'IA", "L'exemple,
  pas à pas"), since a visitor goes from one to the other by "The whole example ›", and the
  page's asks are what a visitor copies and types. The conversation's pictures keep the app's ’.
- **The box's messages** name what the site needs ("braucht", "attend", "accetta") and repeat the
  noun where a pronoun could point at another: German "öffne hier die neue .zip-Datei, die
  zurückkommt" where "die sie zurückschickt" could be the message. A quiz that is too long names
  the limit as a limit, in English too: "longer than the site takes (at most N KB)".
- **Italian** has no native reader on the project (`design/root-page.md`, Not known).

The first screen's words are held to its room: at 360 × 640 the button that opens a file has
19 px to spare in French and Italian on the first tab, and the tab row 3 px in German
(`design/root-page.md`, "One column", "Getting a quiz"). A word made longer there is measured
again.

## The screens after the first page

Drafts, unread by the owner: `src/client/room-text.ts` (the local check, Solo, the lobby, the
screen everyone watches, the Remote, the players' devices, a Peers room, and the server's
messages), `check-text.ts`, `own-copy.ts`, `notfound.ts`, `site-text.ts`. Each device speaks its
own language (`design/root-page.md`, "Languages"). For the read:

- **Register** as the first page's: "du", "vous", "tu", on the players' devices too. The message
  for IT on `/check` is the visitor's to a third person: "Bitte geben Sie … frei", "Merci
  d'autoriser", "Per favore autorizzate".
- **The device that shows the quiz** is the first page's word on the Remote, in the tab's title
  and on the 404 page: "Grossbildschirm", "grand écran", "schermo grande", English "big screen"
  (`design/teacher-devices.md`, "Words for any crowd"). The lobby's check says "Bildschirm",
  "écran", "schermo" where the device in hand may be the one ("Ein Bildschirm", "alle schauen auf
  diesen Bildschirm"). The longest it makes: "das Fenster für den Grossbildschirm öffnen", "Am
  Grossbildschirm zurück zur Frage", "Torna alla domanda sullo schermo grande", a link and
  buttons on the Remote that may wrap.
- **Steering**: "steuern", "piloter", "comandare"; the Remote "Fernbedienung", "Télécommande",
  "Telecomando"; a clicker "Presenter", "pointeur de présentation", "puntatore per
  presentazioni". Italian "comandare" follows "telecomando" and may read as giving orders.
- **The lobby**: "Lobby öffnen ▶", "Apri la lobby ▶", French "Ouvrir le salon ▶". "Salon" is
  recalled, not looked up, as the word French versions of games and chat apps have for a lobby;
  "salle d'attente", a video call's word, has the "salle" the first page avoids for a room
  (above, "What is kept").
- **No word for a room**, since Raum, salle and stanza read first as the room one sits in: the
  line under Peers and Quizmaster says the quiz is sent, who can join and when it is deleted; the
  server's messages say "this quiz". That line ends on the lasting copy, without a word-for-word
  "lasting": "Die .zip-Datei ist die Kopie, die dir bleibt.", "Le fichier .zip reste votre
  copie.", "Il file .zip resta la tua copia."
- **Choices and answers** stay apart: "Optionen", "Propositions", "Opzioni" beside "Antworten",
  "Réponses", "Risposte". Under that button the line for what it ends: "beendet das Antworten",
  "clôt les réponses", "chiude le risposte"; the Remote then says "Niemand kann mehr antworten.",
  "Réponses closes.", "Risposte chiuse." ("Abgabe" read as handing in schoolwork).
- **The steering bar's longest labels**: "Schlussrangliste", "Classement final", "Classifica
  finale". Countdown is "Countdown", "Décompte", "Countdown".
- **"Players"** in the ⋯ menu and over the sheet is "Wer ist dabei" (beside the lobby's "n
  dabei"), "Participants", "Partecipanti", as `/check` has them; "Spieler" carries a gender, and
  the hint under it names the avatars.
- **Exit** on the steering bar after the final ranking is one phrase with the line under it:
  "Beenden" / "das Quiz für alle", "Terminer" / "le quiz pour tous", "Termina" / "il quiz per
  tutti". "Quitter" and "Esci" could be taken as leaving alone.
- **A device that went away**: "Fernbedienung weg", "Télécommande déconnectée", "Telecomando
  assente".
- **Swiss German**: "innert", "nochmals", ss for ß, as on the first page.
- **Still English under a translated heading**: a quiz's problems and the site's notes on it
  (the local check's fold says "3 Hinweise der Seite" and lists them in English).
- **Italian** has no native reader on the project.

## The worked example (`/example`)

Drafts: the page's words (`src/client/example-text.ts`), the conversation
pictures' words (`docs/example/text.py`, four languages side by side; rebuild with
`py -I docs/example/build.py`), the quizzes (`docs/example/quiz_zips.py`). Where they overlap with
the film they are the film's words, so what is decided for the film applies to both; where the example would word a shared
piece differently, the proposal is under "The film's words" below. The translations render what each
moment means in the language, not the English words. Open for you:

- E1, de, the AI's question about the quiz's language: in English it rests on "the sheets are German,
  but you wrote in English". With German sheets and a German ask there is no conflict, so the German AI
  confirms instead: "In welcher Sprache soll das Quiz sein? Auf Deutsch, wie die Blätter?" / "Deutsch".
  fr and it keep the premise (German sheets, a French or Italian ask). Is that the moment you want?
- E2, the question card's labels are each language's app's: en Q/A (your call), de F/A (as in the
  screenshot), fr Q/R, it D/R. fr and it are inferred from Question/Réponse and Domanda/Risposta, not
  seen in the app. The app's other lines: de as the screenshot ("Hat einen Befehl ausgeführt …"); fr
  and it as participles ("Commande exécutée, fichiers partagés", "Comando eseguito, file condivisi"),
  likewise inferred.
- E3, regional choices: "4th grade" fr CM1 (Romandie would write 6H; as the landing's),
  de 4. Klasse, it quarta elementare. Students: de "die Kinder" (as the landing's capTap, also on the
  page's runNote), fr "les élèves", it "gli alunni". de "Beamer", "Lektion", "Handy", "Lehrervorschau",
  "Häuschenpapier"; fr "leçon" (Romand sense), "importer" for upload (as the landing; the page had
  "téléversé"); « » in de, fr, it. fr ranges "questions 1 à 3", "12 et 13"; de and it keep "1–3".
- E4, words of the sheets: de quotes the sheet's own heading («Zeichne den Abschnitt auf
  Häuschenpapier») and its "in 20 000er-Schritten"; fr and it translate it. "Section" is de Abschnitt
  (the sheet's), fr/it "segment(o)"; "tick" de Strich (the sheet's), fr trait, it tacca.
- E5, shared with the landing: the page says "Arbeitsblätter", as the landing does; should the
  landing go back to "Aufgabenblätter", the page and the quiz chat follow. it h1 "passo per passo" is
  the landing's `see`; a change there changes the page too.
- The AI says du / tu to the teacher in de, fr, it (as the film's asks); the page itself says du /
  vous / tu (the landing's register).

- E6, the "Try it" step's words (`runP`, `runNote`), redrafted for the three ways to play by the
  words pass, not a translator: "allein / en solo / per conto tuo" for on your own (it avoids
  "da solo", gendered), "Startseite / page d'accueil / pagina iniziale" for the start page.
  Each page is one of four examples, so it starts "this quiz": "Dieses Quiz starten", "Lancer ce
  quiz", "Avvia questo quiz"; the sheets page's lede names its quiz: "das Quiz zum
  Zahlenstrahl", "le quiz sur la droite graduée", "il quiz sulla retta numerica".
- French on `/example` has U+202F before ; : ? !, as the first page has.
- The stand-ins' pages (`MOCK_TEXT`, Notes and Test) go with the mocks; no read needed.

The quizzes (`quiz_zips.py`): questions 7–13 read as the sheets' own instructions in de and as
the normal classroom wording in fr and it. Questions 1–6 and the title are the film's.

## The space run (the root page's "Idea" tab)

The owner's run is German; its English, French and Italian are the implementer's drafts, made
from it, in `docs/example/space_zips.py` (the quiz) and `docs/example/space_text.py` (the
conversation on `/example`), with `/example`'s words for it in `client/example-text.ts`
(`IDEA_TEXT`).

- **The quiz's title**: "A journey through space", "Voyage dans l'espace", "Viaggio nello
  spazio", from "Reise durchs Weltall".
- **The drawings' words**: Sonne, Erde, Tag, Nacht as "Sun", "Earth", "Day", "Night"; "Soleil",
  "Terre", "Jour", "Nuit"; "Sole", "Terra", "Giorno", "Notte".
- **The Big Dipper**: "Grosser Wagen" is "The Big Dipper" (the British "Plough" is the other
  name), "Le Grand Chariot" (not "la Grande Ourse", which is the whole constellation), "Il Grande
  Carro".
- **Pronouns**: where a question's answer could point at two things the question names the noun
  ("What is the band called?" in question 19, where "it" could be the sun); French "Qu'est-ce
  que Pluton aujourd'hui ?", which leaves Pluto's gender, masculine or feminine in use, unsaid.
- **French spaces** in the quiz: a no-break space before ? ! : ; and inside « », so a "?" never
  starts a line on the Solo screen (the sheets quiz's French has plain ones there).
- **The page's line on the run**: the photographs as "Fotos, die sie gefunden hat", "des photos
  qu'elle a trouvées", "foto che ha trovato", since nothing but the AI's answer says they are
  NASA's.
- **The conversation**: the AI's answer translated as the AI would have written it in that
  language; where the German says "auf Deutsch (Schweizer Schreibweise)", the others name their
  own language. The app's words (its folded steps, "Download all") are English in the German
  picture, as the app showed them, and in the language's own in the others.
- **Italian** has no native reader on the project.

## The film's words

The film's own words in German, French and Italian are drafts, in `CONTENT`
(`docs/film/build/film.js`); the example's chat and quizzes quote them (`docs/example/text.py`,
`FILM`), so whatever you decide applies to film, pictures and zips together, and for q4 the
quizzes' questions 5 and 6 follow its pattern (`quiz_zips.py`). Where a translator proposed other
words:

| key | | in `CONTENT` | proposed | why |
|---|---|---|---|---|
| ask2 | de | …bei denen die Zahl gegeben ist und sie den passenden markierten Zahlenstrahl auswählen müssen. | …bei denen die Zahl gegeben ist und sie den Zahlenstrahl auswählen müssen, auf dem sie markiert ist. | "passenden markierten" stacks two adjectives; "matching marked" means "the one it is marked on" |
| ask2 | fr | …choisir la droite graduée marquée qui correspond. | …choisir la droite graduée sur laquelle il est marqué. | "droite marquée" isn't said |
| ask2 | it | Per favore aggiungi alcune domande in cui il numero è dato e devono scegliere la retta numerica segnata corrispondente. | Per favore aggiungi qualche domanda in cui è dato il numero e devono scegliere la retta numerica su cui è segnato. | same |
| status1 | de | Rufe jetzt die Seite classyquiz.pages.dev ab. | Die Seite classyquiz.pages.dev wird jetzt abgerufen. | |
| status1 | fr | Je consulte la page classyquiz.pages.dev. | Je récupère la page classyquiz.pages.dev. | |
| status1 | it | Sto leggendo la pagina classyquiz.pages.dev. | Recupero ora la pagina di classyquiz.pages.dev. | |
| zipTitle | it | Quiz grandi numeri | Quiz sui grandi numeri | |
| title | it | I grandi numeri sulla retta numerica | Grandi numeri sulla retta numerica | |
| q1 | fr | Quel nombre la flèche montre-t-elle ? | Quel nombre la flèche indique-t-elle ? | an arrow "indique" |
| q4 | de | Welcher Zahlenstrahl hat einen Pfeil bei 654 000? | Auf welchem Zahlenstrahl zeigt der Pfeil auf 654 000? | |
| q4 | fr | Quelle droite graduée a une flèche à 654 000 ? | Sur quelle droite graduée la flèche indique-t-elle 654 000 ? | as the de and it proposals |
| q4 | it | Quale retta numerica ha una freccia a 654 000? | Su quale retta numerica la freccia indica 654 000? | |
