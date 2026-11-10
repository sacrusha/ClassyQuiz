# Translation review: root page (landing-text.ts) and film words

Proposals by three translator agents (Opus), one per language, asked to translate by intent
("the normal word in that situation"), meaning and claims unchanged. Nothing applied yet.
A working note: delete it once applied. Mark rows you reject or change; unmarked rows get applied
(to `src/client/landing-text.ts` and `CONTENT` in `docs/film/build/film.js`, then `docs/film/build/sitebuild.py`).

## Decisions across languages

| # | Question | Proposals | My recommendation |
|---|---|---|---|
| D1 | The film's screen-reader name says "without words", but its screens show text; what it lacks is sound. | en "a silent film" / "a film without sound"; de "ein Film ohne Ton"; fr "une vidéo sans son" (or "un film muet"); it "un video senza audio". fr and it prefer "vidéo/video" over "film" (a 60 s clip is a video on a website). | "without sound" in all four; "film" vs "video": your call (it also sets `seek`'s "film"). |
| D2 | The ask's "exercises like no. 1, 3 and 4": the same exercises, or similar new ones? de currently says "ähnlichen" (similar); en/fr/it are open. de translator would drop "ähnlichen" for style, it translator offers "simili ai". | — | State the intent; then all four follow it. |
| D3 | `tooLong` "(N KB)": unclear whether N is the quiz's size or the limit (it's the limit). | de "Die Seite nimmt höchstens N KB an", fr/it "dépasse la limite / supera il limite (N)". | en: "…longer than the site takes (at most N KB)." |
| D4 | `step1` "Choose any good AI" next to `step1detail` "the one free AI that does this reliably" — can read as "any AI works"; de asks whether testing backs "the one free AI". | — | Your knowledge: is it tested against the other free AIs? |
| D5 | Regional defaults | de "5. Klasse" (HarmoS: 7H) keep; fr "CM2" (Romandie: 7H) keep as default; it "quinta elementare" right in Ticino and Italy; it "alunno" (Italy) vs "allievo" (Ticino) keep alunno. | Keep all defaults. |
| D6 | French typography: narrow no-break space (U+202F) before ; : ! ? is used in some strings, a plain space in others. | fr: U+202F everywhere incl. asks (stops a lone "?" wrapping); plain space only in the film's fast-typed ask3. | Agree. |
| D7 | Film player labels Pause / Speed / Time, now in the page's language (keys `pause`, `speed`, `seek`). | de Pause / Tempo / Position im Film; fr Pause / Vitesse / Position dans la vidéo; it Pausa / Velocità / Posizione nel video (draft). | In `landing-text.ts` as proposed, with "film" for "vidéo/video" until D1 is decided. |
| D8 | The film's zip name for the translated quiz | de proposed the German example's real name "Zahlenstrahl-Quiz" / zahlenstrahl-quiz.zip (a different quiz); fr "Quiz grands nombres" / quiz-grands-nombres.zip; it "Quiz sui grandi numeri" / quiz-grandi-numeri.zip. | Literal for all, since it is the translated big-numbers quiz: de "Grosse-Zahlen-Quiz" / grosse-zahlen-quiz.zip. |
| D9 | `capTap` "Each student taps": fr/it say a bare "touche/tocca" reads unfinished. | fr "Chaque élève répond"; it "Ogni alunno tocca la risposta"; de keeps "Jedes Kind tippt". | Agree. |

| D10 | New key `again` (the film's end button), drafted by the implementer | en "Play again"; de "Nochmals abspielen"; fr "Revoir"; it "Rivedi" | — |

## The other ways to play (v5 item 9)

New keys in `landing-text.ts`, drafted by the words pass, not by a translator agent: the asks of
someone who isn't a teacher, and the resume card's code. The asks are the user's own words to the AI
(du / tu to it in de, fr, it, as the other asks); the tabs' names are the page's voice (du / vous /
tu). No role noun, by meaning (`design/root-page.md`, "Words for whoever comes").

| key | en | de | fr | it |
|---|---|---|---|---|
| tabSolo | To practise on your own | Zum Üben für dich allein | Pour réviser en solo | Per esercitarti per conto tuo |
| tabFriends | To play with friends | Zum Spielen mit Freunden | Pour jouer entre amis | Per giocare con gli amici |
| tabGroup | For a group you lead: a training session | Für eine Gruppe, die du leitest: eine Schulung | Pour un groupe que vous animez : une formation | Per un gruppo che guidi: una formazione |
| joinCode | Join code | Code zum Beitreten | Code pour rejoindre | Codice per entrare |

The asks (`askSolo`, `askFriends`, `askGroup`) are in the file. Choices made there: a biology test
("Biologieprüfung", "contrôle", "verifica"), a games night ("Spieleabend", "soirée jeux", "serata
giochi"), colleagues trained on safety rules ("Kolleginnen und Kollegen", "Folien", "diapositives",
"slide"); "Ich spiele es selbst / J'y jouerai moi-même / Ci gioco io" and "Ich spiele mit / Je joue
aussi / Gioco anch'io" carry the point, that whoever asks plays.

Changed by the same pass in all four, so the rows above that quote the old wording (zipOnly, aiFixes,
offline, capZip) apply to the new one: nothing goes to the site when the `.zip` is opened, so the Run
box and its hints say open, not upload ("öffnen", "ouvrir", "aprire"; `upload`, `zipOnly`, `aiFixes`),
and the chapter is "Die .zip, hier geöffnet / Le .zip, ouvert ici / Lo .zip, aperto qui" (`capZip`);
Run's heading and button are below, "The words before the check". The network help (`offline`)
names "the network of a school or a company" ("das Netz einer Schule oder Firma", "le réseau d'une
école ou d'une entreprise", "la rete di una scuola o di un'azienda"). fr keeps a plain space before ":" and
"?" as the other asks do until D6 is decided.

## The words before the check (after v5)

Drafted by the words pass, not by a translator agent. The second step's heading speaks to whoever
has the AI's quiz and its button names the file (`design/root-page.md`, "Two steps"). The sentence
that named the three ways and the tabs' long names are gone; their words are in "The first page
(v6 item 1)", below.

| key | en | de | fr | it |
|---|---|---|---|---|
| run | Open the quiz your AI made | Das Quiz deiner KI öffnen | Ouvrir le quiz de votre IA | Apri il quiz della tua IA |
| upload | Choose the .zip file | Die .zip-Datei wählen | Choisir le fichier .zip | Scegli il file .zip |

Choices made: `run` is the earlier button's words without "(.zip)", and "starten / lancer / avviare"
are gone with "play".

The way to more quizzes names a company after the school, so a trainer isn't told the route is a
school's (`design/root-page.md`, "The own copy"); the German IT link drops "Schul-", as the network
help it follows already says "Schule oder Firma". These supersede the rows for `ownCopyLink`,
`ownCopy` and `whatToTellIt` in the language tables below where they name the school alone; their
other proposals (word order, "Tageskontingent") still stand.

| key | en | de | fr | it |
|---|---|---|---|---|
| ownCopyLink | More quizzes: a site of your own, your school's or your company's › | Mehr Quiz: eine eigene Seite oder eine der Schule oder Firma › | Plus de quiz⍽: un site à vous, à votre école ou à votre entreprise › | Più quiz: un sito tuo, della tua scuola o della tua azienda › |
| ownCopy (end) | For more quizzes, a site of your own, your school's or your company's: | Für mehr Quiz eine eigene Seite oder eine der Schule oder Firma: | Pour plus de quiz, un site à vous, à votre école ou à votre entreprise⍽: | Per più quiz, un sito tuo, della tua scuola o della tua azienda: |
| whatToTellIt | (unchanged) | Was du der IT sagen kannst › | (unchanged) | (unchanged) |

Where these words now show: a room's refusals on the local check (`siteFull`, `quota`, `offline`,
`whatToTellIt`, `ownCopyLink`, `quizHead`) and "Sending the quiz…" before them (`sending`) speak the
root page's language there too (`design/local-check.md`, "Opening a room"), so the proposals for
those keys apply to the check as well as to the root page.

## The first page (v6 item 1)

Drafted by the page's implementer in all four languages, English included, not by a translator and
not yet seen by the owner; backlog v6 item 2 is the read of the three. Where the words stand and
what each is for: `design/root-page.md` ("What this is", "The ways to play", "Two steps", "How to
ask", "Where the part for people ends"). The ways' names (Quizmaster, Peers, Solo) are written in
the page and stay as they are in every language. ⍽ stands for U+202F.

| key | en | de | fr | it |
|---|---|---|---|---|
| what | Here you play quizzes your own AI makes from your sheets, notes or ideas. | Hier spielst du Quiz, die deine KI aus deinen Blättern, Notizen oder Ideen macht. | Ici, vous jouez aux quiz que votre propre IA crée à partir de vos fiches, notes ou idées. | Qui giochi ai quiz che la tua IA crea dalle tue schede, dai tuoi appunti o dalle tue idee. |
| wayQuizmaster | for a class or a group, on a big screen | für eine Klasse oder Gruppe, am grossen Bildschirm | pour une classe ou un groupe, sur grand écran | per una classe o un gruppo, sul grande schermo |
| wayPeers | with friends, each on their own device | mit Freunden, alle am eigenen Gerät | entre amis, chacun sur son appareil | con gli amici, ognuno sul proprio dispositivo |
| waySolo | on your own, to practise or review | für dich allein, zum Üben oder Wiederholen | de votre côté, pour s'exercer ou réviser | per conto tuo, per esercitarti o ripassare |
| getH | Ask your AI for a quiz | Bitte deine KI um ein Quiz | Demandez un quiz à votre IA | Chiedi un quiz alla tua IA |
| gives | The AI's answer: | Die Antwort der KI: | La réponse de l'IA⍽: | La risposta dell'IA: |
| noQuiz | No quiz yet? | Noch kein Quiz? | Pas encore de quiz⍽? | Ancora nessun quiz? |
| tryIt | Play the example › | Das Beispiel spielen › | Jouer l'exemple › | Gioca l'esempio › |
| more | How to ask your AI ↓ | So fragst du deine KI ↓ | Comment demander à votre IA ↓ | Come chiedere alla tua IA ↓ |
| filmH | From the exercise sheet to the class playing, in one minute | Vom Aufgabenblatt zur spielenden Klasse, in einer Minute | De la fiche d'exercices à la classe qui joue, en une minute | Dalla scheda alla classe che gioca, in un minuto |
| howH | How to ask your AI | So fragst du deine KI | Comment demander à votre IA | Come chiedere alla tua IA |
| tabSheets | Exercise sheets | Aufgabenblätter | Fiches d'exercices | Schede di esercizi |
| tabChess | A description | Eine Beschreibung | Une description | Una descrizione |
| tabGroup | A training session | Eine Schulung | Une formation | Una formazione |
| tabFriends | With friends | Mit Freunden | Entre amis | Con gli amici |
| tabSolo | On your own | Für dich allein | De votre côté | Per conto tuo |
| tabOpen | Nothing decided yet | Noch nichts entschieden | Rien de décidé | Niente di deciso |
| relyH | What you can count on | Worauf du zählen kannst | Ce sur quoi vous pouvez compter | Su cosa puoi contare |
| relyFree | Free, without accounts or sign-up. | Kostenlos, ohne Konto und ohne Anmeldung. | Gratuit, sans compte ni inscription. | Gratuito, senza account né registrazione. |
| relyKept | Played on your own, a quiz never leaves your browser. Played in a room, a quiz is deleted when the room is ended, or three hours after its last use. The .zip is your lasting copy. | Für dich allein gespielt, verlässt ein Quiz deinen Browser nie. In einem Raum gespielt, wird ein Quiz gelöscht, wenn der Raum beendet wird, sonst drei Stunden nach der letzten Benutzung. Die .zip-Datei ist deine bleibende Kopie. | Joué de votre côté, un quiz ne quitte jamais votre navigateur. Joué dans une salle, un quiz est supprimé quand la salle est fermée, sinon trois heures après sa dernière utilisation. Le fichier .zip est votre copie durable. | Giocato per conto tuo, un quiz non lascia mai il tuo browser. Giocato in una stanza, un quiz viene eliminato quando la stanza viene chiusa, altrimenti tre ore dopo l'ultimo uso. Il file .zip è la tua copia duratura. |
| relyOpen | The code is open: | Der Code ist offen: | Le code est ouvert⍽: | Il codice è aperto: |
| manual | The rest of this page is the manual for AIs, in English: what your AI reads when you give it this address. You are welcome to read it too. | Der Rest dieser Seite ist das Handbuch für KIs, auf Englisch: was deine KI liest, wenn du ihr diese Adresse gibst. Du darfst es gern auch lesen. | Le reste de cette page est le manuel pour les IA, en anglais⍽: ce que lit votre IA quand vous lui donnez cette adresse. Vous pouvez le lire aussi. | Il resto di questa pagina è il manuale per le IA, in inglese: quello che legge la tua IA quando le dai questo indirizzo. Puoi leggerlo anche tu. |

Also new, the pictures' accessible names (`picQuizmaster`, `picPeers`, `picSolo`): what each
picture shows, a sentence each, in `landing-text.ts`.

Choices made, each a question for the read:

- `what` speaks to "you" in each language's register (du, vous, tu). "Own" stays with the AI in
  fr ("propre"); de and it leave it to the possessive ("deine KI", "la tua IA"): "deine eigene KI"
  took the sentence to four lines on a 360 px phone, and "la tua propria" is stiff. fr drops the
  repeated "de vos" before the second and third noun, also for three lines on a phone.
- The ways' words carry no verb and no pronoun, so nothing in them needs a referent
  (`design/root-page.md`, Situation); they are what stood in the sentence that named the three
  ways, without "you run it" (du leitest es, vous l'animez, lo guidi tu). fr "de votre côté" for
  on your own, since "seul" is gendered (it "per conto tuo"); fr "chacun sur son appareil" and it
  "ognuno" are the generic masculine. de "zum Üben oder Wiederholen" and fr "pour s'exercer ou
  réviser" are untested against what a pupil would say.
- `gives` is "the AI's answer", not "hands you a file": short enough to share a 390 px phone's
  line with the file's name in all four; on a 360 px one the name wraps under it in German and
  French.
- The tabs' names are short so six fit a phone in three rows; they replace the long names
  the rows for `tabSheets`, `tabChess`, `tabOpen`, `tabSolo`, `tabFriends` and `tabGroup`
  elsewhere in this file quote, and those rows' proposals fall with them (de "Arbeitsblätter" for
  "Aufgabenblätter" still applies to `tabSheets`, with `capSheet`).
- `relyKept` says "room" (Raum, salle, stanza) for what the screens call a lobby and a quiz under
  way; no screen is translated yet, so no word is fixed for it.
- Gone with the page's old top: `build` ("Build a quiz"), whose proposals in the language tables
  below no longer apply, and `ways`.

## The worked example (`/example`)

Drafts, not in the tables above: the page's words (`src/client/example-text.ts`), the conversation
pictures' words (`docs/example/text.py`, four languages side by side; rebuild with
`py -I docs/example/build.py`), the quizzes (`docs/example/quiz_zips.py`). Where they overlap with
the film they are the film's words, so D1–D10 apply to both; where the example would word a shared
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
- E3, regional choices: "4th grade" fr CM1 (Romandie would write 6H; follows D5's CM2 on the landing),
  de 4. Klasse, it quarta elementare. Students: de "die Kinder" (as the landing's capTap, also on the
  page's runNote), fr "les élèves", it "gli alunni". de "Beamer", "Lektion", "Handy", "Lehrervorschau",
  "Häuschenpapier"; fr "leçon" (Romand sense), "importer" for upload (as the landing; the page had
  "téléversé"); « » in de, fr, it. fr ranges "questions 1 à 3", "12 et 13"; de and it keep "1–3".
- E4, words of the sheets: de quotes the sheet's own heading («Zeichne den Abschnitt auf
  Häuschenpapier») and its "in 20 000er-Schritten"; fr and it translate it. "Section" is de Abschnitt
  (the sheet's), fr/it "segment(o)"; "tick" de Strich (the sheet's), fr trait, it tacca.
- E5, depends on the landing: the page says "Arbeitsblätter" (the German proposal for capSheet); if you
  keep "Aufgabenblätter" there, the page and the quiz chat follow. it h1 "passo per passo" matches the
  landing's current `see`; if you take "passo dopo passo" there, change the page too.
- The AI says du / tu to the teacher in de, fr, it (as the film's asks); the page itself says du /
  vous / tu (the landing's register).

- E6, the "Try it" step's words (`runP`, `runNote`), redrafted for the three ways to play by the
  words pass, not a translator: "allein / en solo / per conto tuo" for on your own (it avoids
  "da solo", gendered), "Startseite / page d’accueil / pagina iniziale" for the start page.

The quizzes (`quiz_zips.py`) are unchanged: questions 7–13 read as the sheets' own instructions
in de and as the normal classroom wording in fr and it. Questions 1–6 and the title are the film's.

Also flagged, no decision needed: film-text.md §2 note is stale (Opus/3 Nov → Sonnet/4 Nov); fixed with the docs pass.

## German (you review)

Convention kept: no ß, Swiss words (nochmals, Schlussrangliste, Gratis-Seite).

| key | current | proposed | why |
|---|---|---|---|
| film | Vom Aufgabenblatt bis zur Klasse: ein Film ohne Worte | Vom Arbeitsblatt zur Klasse: ein Film ohne Ton | D1; "bis zur" stiff |
| capSheet | Deine Aufgabenblätter | Deine Arbeitsblätter | everyday teacher word (CH and DE); "Aufgabenblatt" sounds like university sets |
| build | Ein Quiz bauen | Quiz erstellen | headings drop the article; "bauen" calque |
| run | Ein Quiz starten | Quiz starten | superseded: "The words before the check" |
| step1 | Wähle eine gute KI. | Wähle eine gute KI, egal welche. | carries "any" (see D4) |
| step1detail | Das Beispiel oben hat das kostenlose Claude Sonnet geschrieben, 4. Nov. 2026: die eine kostenlose KI, die das zuverlässig kann. | Das Beispiel oben hat das kostenlose Claude Sonnet am 4. Nov. 2026 geschrieben – die einzige kostenlose KI, die das zuverlässig kann. | "die eine" anglicism |
| tabSheets | Mit Fotos von Aufgabenblättern | Mit Fotos von Arbeitsblättern | follows capSheet |
| tabChess | Aus einer Beschreibung: ein Schach-Quiz | Nach einer Beschreibung: ein Schachquiz | idiom; closed compound |
| upload | Das Quiz deiner KI hochladen (.zip) | Quiz deiner KI hochladen (.zip) | superseded: "The words before the check" |
| drop | oder hier ablegen | oder hierher ziehen | everyday drag-and-drop (low priority) |
| zipOnly | Deine KI kann das Quiz als eine .zip-Datei machen, zum Herunterladen aus dem Chat und Hochladen hier. | Deine KI kann das Quiz als einzelne .zip-Datei erstellen: im Chat herunterladen, hier hochladen. | nominal chain clumsy |
| notText | Die Seite nimmt das Quiz als .zip-Datei, nicht als Text. | Die Seite braucht das Quiz als .zip-Datei, nicht als Text. | "nimmt … als" not idiomatic |
| notFile | …nimmt das Quiz als .zip-Datei, nicht … `eine .${w}-Datei` | …braucht das Quiz als .zip-Datei, nicht … `als .${w}-Datei` | same; "nicht als .pdf-Datei" |
| tooLong | Der Quiztext ist länger, als die Seite nimmt (N KB). | Der Quiztext ist zu lang: Die Seite nimmt höchstens N KB an. | D3 |
| reading / preparing / sending | Das Quiz wird gelesen… / Die Bilder werden vorbereitet… / Das Quiz wird gesendet… | Quiz wird gelesen… / Bilder werden vorbereitet… / Quiz wird gesendet… | status lines drop the article |
| without | Ohne diese Bilder weiter | Ohne diese Bilder fortfahren | standard button verb |
| siteFull (bytes) | …Es geht wieder, wenn andere Quiz beendet oder abgelaufen sind (drei Stunden nach der letzten Benutzung). | Die Gratis-Seite hat im Moment keinen Platz für ein weiteres Quiz. Sie nimmt wieder eines an, sobald andere beendet oder abgelaufen sind (drei Stunden nach ihrer letzten Nutzung). | "Es geht wieder" vague |
| siteFull (day) | …nimmt sie wieder neue. | …nimmt sie wieder neue an. | missing "an" |
| quota | …hat ihr Kontingent für heute aufgebraucht. Ab … geht sie wieder. | …hat ihr Tageskontingent aufgebraucht. Ab … funktioniert sie wieder. | colloquial |
| ownCopyLink | Mehr Quiz: eine eigene Seite oder eine der Schule › | Mehr Quiz: eine eigene Seite, für dich oder deine Schule › | calque |
| offline | Keine Verbindung zur Seite. Prüf das Netz und versuch es nochmals. Bleibt es so, sperrt vielleicht das Schulnetz die Seite. | Keine Verbindung zur Seite. Prüf die Netzwerkverbindung und versuch es nochmals. Wenn es so bleibt, blockiert vielleicht das Schulnetz die Seite. | "das Netz prüfen" not said |
| otherDevice | Auf einem anderen Gerät: <b>c</b> ins Code-Feld tippen. | Auf einem anderen Gerät: <b>c</b> ins Codefeld eingeben. | compound, verb |
| ownCopy | …war diese geteilte Seite voll oder stark ausgelastet. Für mehr Quiz eine eigene Seite oder eine der Schule: | An N der letzten 30 Tage war diese gemeinsam genutzte Seite voll oder stark ausgelastet. Für mehr Quiz: eine eigene Seite, für dich oder deine Schule. | literal; calque |
| how | wie › | So geht's › | natural link text |

Kept: code, join, language, play, see, capAi, capZip, capWall, capTap, step2, tabOpen, copy, copied, unreadable, picturesHead, quizHead, aiFixes, copyForAi, notTaken, whatToTellIt, notStarted, question, finalRanking, back, classCode, untitled, chessWho.

Asks:

| key | current | proposed | why |
|---|---|---|---|
| ask | …ein classyQuiz machen, mit ähnlichen Aufgaben [wie Nr. 1, 3 und 4] auf diesen zwei Blättern? … | …ein classyQuiz machen mit Aufgaben [wie Nr. 1, 3 und 4] auf diesen beiden Blättern? … | "ähnliche … wie" doubles "like" — but see D2 |
| askChess | …Bitte mach mir ein classyQuiz zu Schach … Such dafür bewertete Puzzles. Ich lasse ihnen bei jeder Frage etwas Zeit, bevor ich die Antworten zeige … gib ihnen 2 ähnliche Stellungen zur Wahl, eine aussichtsreich, eine gewinnend. … | …Mach mir bitte ein classyQuiz zum Thema Schach … Such ein paar Puzzles mit Rating heraus. Ich lasse ihnen bei jeder Frage Zeit zum Anschauen, bevor ich die Antwortmöglichkeiten zeige … gib ihnen 2 ähnliche Stellungen zur Auswahl, eine aussichtsreiche und eine gewonnene. … | "bewertete" reads "reviewed"; grammar; "gewonnen" is the chess word |

## French (you review)

"⍽" = U+202F (see D6).

| key | current | proposed | why |
|---|---|---|---|
| film | De la fiche d'exercices à la classe : un film sans paroles | De la fiche d'exercices à la classe⍽: une vidéo sans son | D1 |
| capTap | Chaque élève touche | Chaque élève répond | D9 |
| step1detail | L'exemple ci-dessus a été écrit par Claude Sonnet gratuit, le 4 nov. 2026 : la seule IA gratuite qui le fait de façon fiable. | L'exemple ci-dessus a été réalisé par Claude Sonnet, en version gratuite, le 4 nov. 2026⍽: la seule IA gratuite qui y arrive de façon fiable. | calque |
| tabSheets | Avec les photos de fiches | Avec des photos de fiches d'exercices | article |
| tabChess | D'après une description : un quiz d'échecs | À partir d'une description⍽: un quiz d'échecs | usual phrase |
| tabOpen | Sans rien avoir décidé | Sans avoir encore rien décidé | restores "yet" |
| drop | ou déposez-le ici | ou glissez-le ici | glisser-déposer |
| zipOnly | Votre IA peut faire le quiz en un seul fichier .zip, à télécharger depuis le chat et à importer ici. | Votre IA peut fournir le quiz en un seul fichier .zip, à télécharger depuis le chat puis à importer ici. | literal |
| notText | Le site prend le quiz en fichier .zip, pas en texte. | Le site accepte le quiz en fichier .zip, pas sous forme de texte. | calque |
| notFile | Le site prend le quiz… | Le site accepte le quiz en fichier .zip, pas … | same |
| unreadable | Le fichier n'a pas pu être lu. | Impossible de lire le fichier. | usual error |
| tooLong | Le texte du quiz est plus long que ce que le site accepte (N Ko). | Le texte du quiz dépasse la limite du site (N Ko). | D3 |
| picturesHead | Certaines images ne peuvent pas partir avec le quiz⍽: | Certaines images ne peuvent pas être envoyées avec le quiz⍽: | calque |
| aiFixes | …Copiez le message dans le chat et importez le .zip qu'elle renvoie. | …Copiez le message dans le chat, puis importez le .zip qu'elle vous renvoie. | order of steps |
| notTaken | Le site n'a pas pu prendre le quiz. Réessayez. | Le site n'a pas pu recevoir le quiz. Réessayez. | calque |
| siteFull (bytes) | Le site gratuit n'a pour l'instant plus de place pour un autre quiz. Il en reprend dès que… | Le site gratuit n'a plus de place pour un nouveau quiz pour l'instant. De la place se libère dès que d'autres quiz sont terminés ou ont expiré (trois heures après leur dernière utilisation). | unidiomatic |
| siteFull (day) | Le site gratuit ne peut plus prendre de quiz aujourd'hui. Il en reprend à …, heure suisse | Le site gratuit n'accepte plus de nouveaux quiz aujourd'hui. Il en acceptera de nouveau à partir de … (heure suisse). | same |
| quota | … Il remarche à … | Le site gratuit a épuisé son quota du jour. Il sera de nouveau disponible à … (heure suisse). | colloquial |
| offline | Pas de connexion au site. … Si cela persiste, … | Impossible de se connecter au site. Vérifiez le réseau et réessayez. Si le problème persiste, le réseau de l'école bloque peut-être le site. | standard opening |
| whatToTellIt | Ce qu'il faut dire au service informatique › | Que dire au service informatique › | advice, not obligation |
| otherDevice | …tapez <b>c</b> dans la case du code. | …tapez <b>c</b> dans le champ Code. | names the visible label |
| ownCopy | Ce site partagé a été complet ou très chargé N jours sur les 30 derniers. … | Sur les 30 derniers jours, ce site partagé a été complet ou très chargé N jours (un jour). Pour plus de quiz, un site à vous ou à votre école⍽: | word order |

Kept: code, join, language, play, see, capSheet, capAi, capZip, capWall, build, step1, step2, copy, copied, run, upload, reading, preparing, sending, quizHead, copyForAi, without, ownCopyLink, notStarted, question, finalRanking, back, classCode, untitled, how, chessWho.

Asks: `ask` unchanged except "…de ces deux fiches⍽?"; `ask2` U+202F before "?"; `askChess`:
"Lis classyquiz.pages.dev. Fais-moi un classyQuiz d'échecs, s'il te plaît⍽: enfants de 8 ans, 400–500 Elo, 5 questions seulement. Trouve des problèmes avec un classement Elo. Je leur laisse le temps de regarder chaque question avant d'afficher les propositions et de lancer le compte à rebours. Les propositions peuvent être en notation échiquéenne, mais sans + ni mat, ce serait trop facile. N'oublie pas de dire qui a le trait. Pour la dernière question, donne-leur le choix entre 2 positions semblables, l'une prometteuse, l'autre gagnante. En français. De quoi as-tu besoin⍽?"
(why: "puzzles notés" isn't chess French; "un peu de temps" was added; "choix" → "propositions"; "notation" had lost "échiquéenne").

## Italian (no reviewer on the project; translator's confidence given)

| key | current | proposed | why | conf. |
|---|---|---|---|---|
| film | Dalla scheda alla classe: un film senza parole | Dalla scheda di esercizi alla classe: un video senza audio | D1 | med-high |
| see | L'esempio passo per passo › | L'esempio, passo dopo passo › | idiom | med |
| capZip | Lo .zip, caricato qui | Il file .zip, caricato qui | "Lo ." odd; aiFixes says "il .zip" | med-high |
| capTap | Ogni alunno tocca | Ogni alunno tocca la risposta | D9 | med-high |
| step1 | Scegli una buona IA. | Scegli una buona IA, quella che preferisci. | carries "any" (D4) | med |
| step1detail | …l'ha scritto Claude Sonnet gratuito, 4 nov 2026: … | L'esempio qui sopra l'ha scritto Claude Sonnet nella versione gratuita, il 4 nov. 2026: l'unica IA gratuita che lo fa in modo affidabile. | clumsy | high |
| tabSheets | Con le foto di schede | Con le foto delle schede | article | high |
| zipOnly | …può fare il quiz come un unico file .zip… | …può preparare il quiz in un unico file .zip, da scaricare dalla chat e caricare qui. | calque | high |
| notText / notFile | Il sito prende il quiz… / …più file insieme… | Il sito accetta il quiz… / …più file alla volta… | calque | high |
| tooLong | …più lungo di quanto il sito accetti (N KB). | Il testo del quiz supera il limite del sito (N KB). | D3 | high |
| picturesHead | Alcune immagini non possono partire con il quiz: | Alcune immagini non si possono caricare con il quiz: | calque | high |
| aiFixes | …Copia il messaggio nella chat e carica il .zip che ti rimanda. | …Copia il messaggio, incollalo nella chat e carica il file .zip che ti rimanda. | copy then paste | med-high |
| notTaken | …non è riuscito a prendere il quiz. | …non è riuscito a ricevere il quiz. | calque | high |
| siteFull | …Ne riprende quando… / …oggi non può prendere altri quiz. Ne riprende alle … | Al momento il sito gratuito non ha spazio per un altro quiz. Ne accetterà di nuovo quando altri quiz saranno terminati o scaduti (tre ore dopo il loro ultimo utilizzo). / Per oggi il sito gratuito non può accettare altri quiz. Ne accetta di nuovo dalle …, ora svizzera. | unidiomatic | high |
| quota | …la quota di oggi. Torna a funzionare alle … | …la quota giornaliera. Torna a funzionare dalle … | usual | med |
| ownCopyLink | Più quiz: un sito tuo o della tua scuola › | Per più quiz: un sito tuo o della tua scuola › | fragment | med |
| offline | Nessuna connessione al sito. Controlla la rete e riprova. Se resta così, forse la rete della scuola blocca il sito. | Impossibile collegarsi al sito. Controlla la connessione e riprova. Se il problema persiste, la rete della scuola potrebbe bloccare il sito. | standard | high |
| whatToTellIt | Cosa dire al servizio informatico › | Cosa dire al tecnico informatico › | schools have "il tecnico"; current fine for Ticino | low-med |
| notStarted | prima della prima domanda | in attesa della prima domanda | repetition | med-high |
| ownCopy | Negli ultimi 30 giorni … è stato pieno … N giorni. Per più quiz, … | In N degli ultimi 30 giorni questo sito condiviso era pieno o molto carico. Per avere più quiz, un sito tuo o della tua scuola: | counts days | med-high |
| chessWho | …5 nov 2026 | …5 nov. 2026 | cosmetic | low |

Asks: `ask` "circa 10 domande" → "una decina di domande" (med); optionally "come i" → "simili ai" (D2); `labels` "quante" → "quante domande" (med); `askChess` "Lascio loro un po' di tempo su ogni domanda prima di mostrare le scelte…" → "A ogni domanda lascio loro il tempo di guardarla prima di mostrare le opzioni e avviare il conto alla rovescia. Le opzioni possono essere in notazione scacchistica, ma senza + né matto, altrimenti sarebbe troppo facile." (med-high).

## The film's words

| key | de | fr | it |
|---|---|---|---|
| ask1 | the page's `ask` (as decided above) | the page's `ask` (plain space before "?" as typed) | the page's `ask` |
| ask3 | danke. Kannst du eine visuelle Vorschau machen, nur eine pro Fragetyp? | merci. Tu peux faire un aperçu visuel, un seul par type de question ? | grazie. Mi fai un'anteprima visiva, solo una per tipo di domanda? |
| status1 | Die Seite classyquiz.pages.dev wird jetzt abgerufen. | Je récupère la page classyquiz.pages.dev. | Recupero ora la pagina di classyquiz.pages.dev. |
| status3 | Erstelle eine Mockup-Vorschau der Beamer-Ansichten | Préparation d'une maquette des écrans projetés | Preparo un mockup visivo delle schermate del proiettore |
| zipTitle / file | see D8 | Quiz grands nombres / quiz-grands-nombres.zip | Quiz sui grandi numeri / quiz-grandi-numeri.zip |
| title | Grosse Zahlen am Zahlenstrahl | Les grands nombres sur la droite graduée | Grandi numeri sulla retta numerica |
| q1, rows 1–3 | Welche Zahl zeigt der Pfeil? | Quel nombre la flèche montre-t-elle ? | Quale numero indica la freccia? |
| row 4 | Auf welchem Zahlenstrahl zeigt der Pfeil auf 654 000? | Quelle droite graduée a une flèche à 654 000 ? | Su quale retta numerica la freccia indica 654 000? |
| cardCaption | Pfeil ablesen (Fragen 1–3) | Lecture d'une flèche (questions 1 à 3) | Leggere la freccia (domande 1–3) |

From the example's translator, for keys the film's `CONTENT` now has (the example's chat and quizzes
quote them, so whatever you decide applies to film, pictures and zips together; for row 4, the quizzes'
questions 5 and 6 follow its pattern in `quiz_zips.py`):

| key | current | proposed | why |
|---|---|---|---|
| ask2 de | …bei denen die Zahl gegeben ist und sie den passenden markierten Zahlenstrahl auswählen müssen. | …bei denen die Zahl gegeben ist und sie den Zahlenstrahl auswählen müssen, auf dem sie markiert ist. | "passenden markierten" stacks two adjectives; "matching marked" means "the one it is marked on" |
| ask2 fr | …choisir la droite graduée marquée qui correspond. | …choisir la droite graduée sur laquelle il est marqué. | "droite marquée" isn't said |
| ask2 it | Per favore aggiungi alcune domande in cui il numero è dato e devono scegliere la retta numerica segnata corrispondente. | Per favore aggiungi qualche domanda in cui è dato il numero e devono scegliere la retta numerica su cui è segnato. | same |
| q1 fr | Quel nombre la flèche montre-t-elle ? | Quel nombre la flèche indique-t-elle ? | an arrow "indique" |
| q4 fr | Quelle droite graduée a une flèche à 654 000 ? | Sur quelle droite graduée la flèche indique-t-elle 654 000 ? | as de/it's row-4 proposals above |

The rows above for ask1, ask3, status3 and cardCaption name keys the film's `CONTENT` no longer has
(it now has ask2 and status2); ask3, status3 and the captions are the example pictures' alone, in `text.py`.

Choices 646 000 · 645 000 · 644 000 · 647 000 unchanged in all (each language's example quiz uses a space as thousands separator); right answer unchanged. Titles and q1 match each language's own example quiz wording. File names sheet-photo-1/2.jpg stay.
