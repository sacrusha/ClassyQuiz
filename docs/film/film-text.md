# The landing film: the words on its screens

The words the film's screens show, quoted from the site and the example's
material, with where each comes from: for whoever changes what the film says.
Paths are relative to the repo's root. `▲ ◆ ● ■` are the site's answer shapes.
Where a source disagrees with the film or with another source, it is marked
**NOTE**. The film's words themselves are in `docs/film/build/film.js` (`docs/film/README.md`).

## 0. Things to know first

1. **The tablet shows the choice text, not only colour and shape.** `src/client/play.ts` draws every answer button as shape + the choice's text. Only the *question* never reaches the tablet; the veiled **wall** tiles are the ones with colour and shape only. The film draws the text on the tablet's buttons, as the site does.
2. **The 72 000–73 000 question is in no .zip and no conversation.** It exists only in `src/public/landing/wall-en.webp` and `tablet-en.webp`. The real chat's preview card is a different question (646 000, see 2.4). The film uses the real 646 000 question on the chat's card and on the wall, so the rhyme between them is the real conversation's.
3. **The real conversation has three teacher turns.** The preview cards come after the *third* ask ("Can you make a visual preview…"). The film shows the first as Build's labelled ask (§1) and the third as the teacher's second message; turn 2 (adding questions) is left out.
4. **Shape/colour pairing differs between the AI's mock-up and the real site.** AI cards: red ▲, blue ●, orange ■, green ◆. Real wall and tablet: red ▲, blue ◆, yellow ●, green ■. The AI itself says "These are my own approximations". The film keeps the AI's pairing on its card and the real one on wall and tablet.
5. **Typos:** none found in the three teacher asks (zoomed 2x). Only: ask 3 starts lowercase ("thanks.").
6. **The question "Show the quiz here, or steer it from here?" is not on screen** as a sentence (it is only in docs/user-flow.md §1 rule 5). The real screen is the quiz title, then two buttons with a small line each (3.5).
7. **Languages.** The site's own screens after the upload (the check, the join screen, the wall chrome, the Remote, the tablets) exist in English only: `landing-text.ts` header: "The lobby, the wall, the Remote and the tablets stay English too." The root page block (header code label, Build/Run text, asks) is in DE/EN/FR/IT, and the teacher's chat with their AI, and the quiz it makes, are in the teacher's language. The film follows the page's language the same way: the ask and the root page's words come from `landing-text.ts` at build time; the second ask, the AI's status lines and the quiz's words (one quiz, the 646 000 one, translated, not each language's own example) from `CONTENT` in `docs/film/build/film.js`, where `draft: true` marks a language whose words are drafts pending the owner's review; the site's own screens stay English. Wall *pictures* exist in 4 languages with a different question each (see 3.9); the film uses none of them.

## 1. Ask 1 on the landing page ("#bubble"), all four languages

Source: `src/public/index.html` `#bubble` (EN) and `src/client/landing-text.ts` `ask` in `en/de/fr/it`. Underlined parts (labelled on the page) in `[ ]`; `classyquiz.pages.dev` is the underlined address. The labels sit under the parts.

- EN: Read [classyquiz.pages.dev]. Can you make me a classyQuiz with exercises [like no. 1, 3 and 4] from these two sheets? [For my 5th grade class], [about 10 questions], [in English].
  labels: this site · which exercises · your class · how many · which language
- DE: Lies [classyquiz.pages.dev]. Kannst du mir ein classyQuiz machen, mit ähnlichen Aufgaben [wie Nr. 1, 3 und 4] auf diesen zwei Blättern? [Für meine 5. Klasse], [etwa 10 Fragen], [auf Deutsch].
  labels: diese Seite · welche Aufgaben · deine Klasse · wie viele · welche Sprache
- FR: Lis [classyquiz.pages.dev]. Tu peux me faire un classyQuiz avec des exercices [comme les n° 1, 3 et 4] de ces deux fiches ? [Pour ma classe de CM2], [une dizaine de questions], [en français].
  labels: ce site · quels exercices · votre classe · combien · quelle langue
- IT: Leggi [classyquiz.pages.dev]. Mi puoi fare un classyQuiz con esercizi [come i n. 1, 3 e 4] di queste due schede? [Per la mia quinta elementare], [circa 10 domande], [in italiano].
  labels: questo sito · quali esercizi · la tua classe · quante · quale lingua
- Open ask, not asked for in the film (landing "ask2"): EN "Read classyquiz.pages.dev. I need a classyQuiz. Help?" / DE "Lies classyquiz.pages.dev. Ich brauche ein classyQuiz. Hilfst du mir?" / FR "Lis classyquiz.pages.dev. J'ai besoin d'un classyQuiz. Tu m'aides ?" / IT "Leggi classyquiz.pages.dev. Mi serve un classyQuiz. Mi aiuti?"

**NOTE:** the *real conversation's* first ask differs from the landing ask (2.2): no "like no. 1, 3 and 4", "4th grade", no length, no language. The film types the landing one (the storyboard's table says why); the AI's reply bars then do not match "10 questions in English" by wording, which nobody reads.

## 2. The chat (shot 3)

Source: `src/public/examples/conversation.webp` (681x3784), read in crops; also described on `src/public/example.html` ("Free Claude (Sonnet), 4 November 2026"); the landing's Build step names the same ("Free Claude Sonnet wrote the example above, 4 Nov 2026", `landing-text.ts` `step1detail`). The film names no AI.

Layout: teacher bubbles are light-grey, right-aligned, rounded; AI text is plain on white, left. Status lines are small grey ("thinking" lines with a ▸). The `.zip` is a grey rounded chip with an archive icon: "Big numbers quiz" over small "ZIP".

### 2.1 Turn 1 (teacher, y 0–220)
- Two photos side by side, upper right (the two sheets, on brown).
- Ask, 2 lines (verbatim): "Read classyquiz.pages.dev. Can you make me a classyQuiz with exercises from these two sheets? For my 4th grade class."

### 2.2 AI answer 1 (y 220–2000 of the sheet, shape only)
- grey line "Fetching the classyquiz.pages.dev page now."; 1 line prose ("I'll start by reading the ClassyQuiz page to see what format it expects."); grey chip line "Fetched: classyQuiz ▸".
- A right-aligned grey card with the AI's two questions and the teacher's answers (4 lines + 2 lines): "F: Which language should the quiz be in? The sheets are German, but you wrote to me in English. / A: English" and "F: How long should the quiz be? / A: About 10 questions". (Can be left out of the film.)
- grey line "Checking arrow positions for the number-line questions ▸"; 1 line "Thanks. Next I'll draw the number lines and pack everything into a .zip."; grey line "Hat einen Befehl ausgeführt, dateien geteilt ▸" (German UI: "ran a command, shared files").
- Then: paragraph 2 lines ("Your quiz is ready as big-numbers-quiz.zip. Upload it on classyquiz.pages.dev to run it."), paragraph 1 line ("It has 10 questions in English, …"), **4 bullets** (1, 1, 1, 2 lines; bold lead-ins "Questions 1–3:", "4–6:", "7–8:", "9–10:"), paragraph 3 lines, paragraph 2 lines, then the **.zip chip**.

### 2.3 Turn 2 (teacher; not in the film)
- Ask, 2 lines (verbatim): "Please add some questions where the number is given and they have to pick the matching marked number line."
- AI: grey "Planning the spacing of the four new number-line questions ▸"; 1 line "I'll add three matching questions and place them right after the three “read the arrow” questions."; grey "Hat einen Befehl ausgeführt, dateien geteilt ▸"; paragraph 2 lines ("I've updated big-numbers-quiz.zip. It now has 13 questions, with three new ones in the middle as questions 4–6. In each, a number is given and the students pick which of four number lines has the arrow in the right place:"); **3 bullets** (2, 2, 1 lines: "Question 4: the number is 654 000, …", "Question 5: the number is 81 750, …", "Question 6: the number is 308 080, …"); paragraph 4 lines; paragraph 2 lines; **.zip chip** ("Big numbers quiz / ZIP").

### 2.4 Turn 3 (teacher; the film's second message) and the preview cards
- Ask, 1 line (verbatim, lowercase start): "thanks. Can you make a visual preview, just one per question type?"
- AI: grey "Setting up a visualizer mockup of the projector screens ▸"; 1 line "I'll check the site's layout page so the previews match how the class will actually see them."; red grey line "Hat ein Tool verwendet Fehlgeschlagen ▸" (tool used, failed).
- **Four preview cards**, each: small grey caption above, a white rounded card with a bold question line, optional picture, then four coloured buttons 2x2 (red top-left, blue top-right, orange bottom-left, green bottom-right), each with shape + text.
  1. Caption "Reading an arrow (questions 1–3)". Question "Which number does the arrow show?". Picture: number line with arrow, labels 640 000 · 650 000 · 660 000. Buttons: ▲ 646 000 (red) · ● 645 000 (blue) · ■ 644 000 (orange) · ◆ 647 000 (green). Right answer is 646 000 (quiz.txt, `Order: fixed`).
  2. Caption "Picking the matching number line (questions 4–6)". Question "Which number line has an arrow at 654 000?". No text buttons: four small number lines (640 000 · 650 000 · 660 000 each) in red/blue/orange/green frames, arrow at slightly different places.
  3. Caption "Counting and middle questions, text only (questions 7–11)". Question "Count in steps of 20 000: 500 000, 520 000, 540 000, … What comes next?" Buttons: ▲ 560 000 · ● 550 000 · ■ 541 000 · ◆ 640 000.
  4. Caption "Finding the section (questions 12–13)". Question "On which section does 45 200 lie?". Picture: four stacked lines labelled A (4000–5000), B (45 000–46 000), C (405 000–405 100), D (450 000–451 000). Buttons: ▲ A · ● B · ■ C · ◆ D.
- Then 1 paragraph (2 lines), **4 bullets** (1, 2, 1, 2 lines, bold lead-ins), 1 paragraph (3 lines), a row of small reaction icons. No .zip chip here.

**Where the other languages are:** not as chat pictures. Only the English picture exists. The four .zips of the earlier runs exist in `src/public/examples/` (`big-numbers-quiz.zip` EN, `zahlenstrahl-quiz.zip` DE, `droite-graduee.zip` FR, `quiz-retta-numerica.zip` IT); `docs/backlog.md` items 9 and 12 mention "real two-turn conversations in four languages" / "the four .zips of the earlier runs exist", but no conversation text in DE/FR/IT is in the repo. The film's German, French and Italian chat and quiz words are therefore translations of the English (`CONTENT` in `docs/film/build/film.js`), drafts pending the owner's review.

## 3. The site's screens

### 3.1 Root page header (`src/public/index.html`, `landing-text.ts`)
- Left: the fox mark + "classyQuiz" (brand SVG; on a phone held upright, mark only).
- Right: label **Code** (DE Code, FR Code, IT Codice; hidden under 600 px), a box with placeholder **12345** (digits, bold), a ▶ button (aria "Join" / "Beitreten" / "Rejoindre" / "Entra"), then the language selector "EN ▾".
- Below the film: "Build a quiz" / "Run a quiz" columns (Run first on narrow screens).

### 3.2 Run box (root page, before upload)
Heading **Run a quiz** (DE Ein Quiz starten, FR Lancer un quiz, IT Avvia un quiz). Dashed box with button and a line under it:
- EN: button "Upload the quiz your AI made (.zip)", line "or drop it here"
- DE: "Das Quiz deiner KI hochladen (.zip)" / "oder hier ablegen"
- FR: "Importer le quiz de votre IA (.zip)" / "ou déposez-le ici"
- IT: "Carica il quiz della tua IA (.zip)" / "o trascinalo qui"
Progress after the pick (EN): "Reading the quiz…", "Preparing the pictures… 3 of 12", "Sending the quiz…" (DE "Das Quiz wird gelesen…", FR "Lecture du quiz…", IT "Lettura del quiz…"). Then straight to the check in this tab. The file sheet (the .zip on top) is the OS's, no site text.

### 3.3 The check, after upload (`screen.ts` `renderCheck`; docs/user-flow.md §3.3)
English only. Top: title as h1 + small count; under it "Class code **63953**" (with a person icon and joined count once someone joined). Then the big button; then the teacher-code sentence; then the list.
- Title line: "Big numbers on the number line · 13 questions" (the example's real title, 13 questions; singular would be "· 1 question"). docs/user-flow.md draws "Prozente · 12 questions" as a mock-up.
- Class code: "Class code 63953"
- Button: **Let the class in ▶**
- The teacher-code sentence (verbatim): "A second device, to steer from or to show the quiz on: on **classyquiz.pages.dev**, type **63953 47**. Or open a second screen in a new window with a click." (last sentence is hidden on a phone; "63953 47" bold, tabular digits).
- List header: "**13 questions**" and a button "Show the solutions" (becomes "Hide the solutions"). Rows: a number, the question text, a › chevron; folded. In the example: 1–3 "Which number does the arrow show?", 4 "Which number line has an arrow at 654 000?", 5 "…at 81 750?", 6 "…at 308 080?", 7 "Count in steps of 20 000: 500 000, 520 000, 540 000, ... What comes next?" (full list in `big-numbers-quiz.zip` `quiz.txt`).
- Footer: "⋯ More".
- Open row shows the four choices with shapes (`▲ ◆ ● ■` and ✓ on the right ones) and a link "Change the solution".
The film follows the zip: "· 13 questions" on the check, "1 / 13" on the wall and the tablets.

### 3.4 The Remote on the phone, lobby (`teach.ts` `lobby`)
The film shows only the button, in the bubble of each press. Words: **Let the class in ▶** (primary button, above); then the address **classyquiz.pages.dev**, the class code large **63953**, "**n** joined", avatars, the switch "Points for speed" with "A right answer 10, up to 5 more the quicker it comes."; then either "Projector ✓ · ⇄ Swap" (wall there), or "On the projector computer: on classyquiz.pages.dev, type 63953 47."; then the question list. **Start quiz ▶** is pinned at the bottom. On the wall a toast "Remote connected" appears when the phone arrives.

### 3.5 Second device, after typing the teacher code (`play.ts` `enter`)
Site header (fox + classyQuiz), then the quiz title as big heading ("Big numbers on the number line"), then two buttons:
- **Show the quiz here** / small: "the class watches this screen"
- **Steer it from here** / small: "Start, next, the solution"
**NOTE:** user-flow.md says the screen "asks 'Show the quiz here, or steer it from here?'". The code has no such sentence; it is only the two buttons, and the film shows only them.

### 3.6 Join screen = the wall in the lobby (`screen.ts` `renderJoin`, `renderLobby`)
Wall version (class sees): top bar with the quiz title only; left column: QR code, then the fox + **classyquiz.pages.dev**, then the class code in huge digits **63953**; right column: a person icon with the count ("6"), avatars popping in. While nobody is in: a wordless drawing of a tablet (address bar "classyquiz.pages.dev", site header with the code box showing 63953 and ▶). After 90 s empty: "Nobody in yet? If the tablets can't open classyquiz.pages.dev, the school network may block it: what to tell IT ›" (don't draw this).
Steering tab's version adds: **Start quiz ▶**, "Points for speed" switch + "A right answer 10, up to 5 more the quicker it comes.", and "‹ Questions", "A second device ›", "⋯" (teacher-only, below the fold).

### 3.7 Wall during a question (`screen.ts` `renderQuestion`, `markTiles`; docs/user-flow.md §3.4; look at `src/public/landing/wall-en.webp`)
Constant frame: top bar: left "**2 / 10**", then the answered avatars in a row (only those who answered, never their colour), right a person icon and "**20 / 20**" in green (green when all in; during answering "18 / 20" etc.; hidden while reading). Below: the question as a big centred bold heading, the picture band (white), four tiles 2x2. Corner/footer: "classyquiz.pages.dev · 34654" (the image's code), small "Full screen (F)", "⋯"; when the wall steers itself the footer is the steering bar instead (⋯, address · code, "⏱ Countdown / 15 s, then closes", "▶ Answers / closes answering"). The labelled buttons on the phone are the same: **Choices → Answers → Solution → Ranking → Question 3** ("Final ranking" after the last).
Tile colours/shapes: red ▲, blue ◆, yellow ●, green ■.

States:
1. **Question (veiled):** question + picture visible; four tiles coloured with their shapes, **no text**; no count; tablets show the eye. Remote line: "The choices are hidden: the class reads the question."
2. **Answering:** tiles show their text; the avatars pop into the bar; count "n / of" rises. Countdown: a bar drains along the top edge.
3. **Locked in / the split:** each tile gets its count at the right and a bar along its foot; **no tick, nothing faded**. Remote: "Answering closed. The wall shows how the class answered, not yet the solution."
4. **Solution:** tick ✓ before the count on the right tile(s); the others fade; the right students' avatars jump in a band over the question for about 4 s.
5. **Ranking** (3.10).

### 3.8 The question in the film
Question 1 of `big-numbers-quiz.zip` (`quiz.txt`): "**Which number does the arrow show?**", a number line labelled 640 000 · 650 000 · 660 000 with the arrow at 646 000 (`q1.svg`), `Order: fixed`, the right answer first. On the wall and tablets, in the site's pairing: red ▲ **646 000** (right) · blue ◆ **645 000** · yellow ● **644 000** · green ■ **647 000**. The split (12 / 6 / 2 / 0) is the film's own (`docs/film/build/film.js`; the storyboard says why); the class code 63953 and the teacher code 63953 47 are docs/user-flow.md's example.

### 3.9 The landing's old pictures of the wall and a tablet
`src/public/landing/wall-xx.webp` and `tablet-xx.webp` (de en fr it) show the wall at a solution and a tablet answering, each language its own question, not translations: EN "Which number does the arrow show?" with the arrow at 72 650 (right: blue ◆ 72 650; "2 / 10"; the footer's code 34654), DE 56 640, FR 327 000, IT 15 140. The wall's chrome ("Full screen (F)", "⋯", the count) is English in all four. The site doesn't show them and the film uses none of them; the README shows `wall-en.webp`.

### 3.10 Tablets (`play.ts` `render`, `look.ts`)
Top bar when playing: avatar left, "n / total" centre, "★ score" right.
- **Lobby:** the child's avatar large, two rows of pictures below to dress it (six background shapes, eight hats); no words. Before the teacher lets the class in: "Your teacher lets the class in in a moment." Entering the code: input placeholder "12345", ▶ (aria "go"); wrong code: the code, ✗, the box again.
- **Question (reading):** top bar and a large **eye** icon. No text.
- **Answering:** top bar and four buttons (shape + choice text, colours as above). A tap marks the button at once with a dashed pulsing outline, solid once stored; the other buttons dim ("chosen").
- **Locked:** the same buttons, no more taps, the chosen one marked, a small eye in the top bar.
- **Solution:** a large ✓ (right, in a green disc) or ✗ (wrong, red disc), "–" if no answer; "+13" under it only with points for speed; the shape of the chosen button below.
- **Ranking:** avatar large, "**3.** / 20" (place / players), "★ 9"; at the final ranking also a trophy.

### 3.11 Ranking on the wall (`screen.ts` `renderRanking`, `final.ts`)
Quiz title in the top bar. Podium with the top entries: avatar, place "1.", "★ 9 / 13" (score / questions; with speed just the score). Beside it the class result: a large percentage ("64%"), "✓ 83 / 130" (right / given), and one little bar per question. The **final** ranking: podium 1–3 as steps with the numbers on the blocks, everyone else in front of it, all jumping, trophy in the top bar, "Exit" in the steering bar ("ends the quiz for everyone"). No names anywhere, only avatars.

## 4. Sources in short
- Chat: `src/public/examples/conversation.webp`; `big-numbers-quiz.zip` `quiz.txt`.
- Landing words, asks, Run box in 4 languages: `src/client/landing-text.ts`, `src/public/index.html`.
- Check, join, wall, ranking: `src/client/screen.ts`, `final.ts`, `manage.ts`, `teach.ts`, `steps.ts`.
- Second device screen, tablet states: `src/client/play.ts`.
- Pictures of wall/tablet (EN/DE/FR/IT), not used by the site or the film: `src/public/landing/wall-xx.webp`, `tablet-xx.webp`.
- Rules and states: `docs/user-flow.md` §1–3, `docs/design/question-flow.md`.
