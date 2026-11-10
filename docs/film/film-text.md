# The landing film: the words on its screens

The words the film's screens show, quoted from the site and the example's
material, with where each comes from: for whoever changes what the film says.
Paths are relative to the repo's root. `▲ ◆ ● ■` are the site's answer shapes.
Where a source disagrees with the film or with another source, it is marked
**NOTE**. The film's words themselves are in `docs/film/build/film.js` (`docs/film/README.md`).

## 0. Things to know first

1. **The tablet shows the choice text, not only colour and shape.** `src/client/play.ts` draws every answer button as shape + the choice's text. Only the *question* never reaches the tablet; the veiled **wall** tiles are the ones with colour and shape only. The film draws the text on the tablet's buttons, as the site does.
2. **The 72 000–73 000 question is in no .zip and no conversation.** It exists only in `src/public/landing/wall-en.webp` and `tablet-en.webp`. The real chat's preview card is a different question (646 000, see 2.4). The film uses the real 646 000 question on the chat's card and on the wall, so the rhyme between them is the real conversation's.
3. **The real conversation has three teacher turns.** The film shows the first as Build's labelled ask (§1) and the second, which adds questions (2.3), as the teacher's second message, answered with the updated `.zip`; turn 3, the visual preview (2.4), is left out: the owner found the ask that changes the quiz more relevant to show than the AI's mock-up of it.
4. **Shape/colour pairing differs between the AI's mock-up and the real site.** AI cards: red ▲, blue ●, orange ■, green ◆. Real wall and tablet: red ▲, blue ◆, yellow ●, green ■. The AI itself says "These are my own approximations". The film shows no card of the AI's; wall and tablet use the real pairing.
5. **Typos:** none found in the three teacher asks (zoomed 2x). Only: ask 3 starts lowercase ("thanks.").
6. **The second device's question is not a sentence on screen.** The real screen is the quiz title, then two buttons with a small line each (3.5).
7. **Languages.** The site's own screens after the upload (the local check, the lobby's check, the join screen, the wall chrome, the Remote, the tablets) exist in English only: `landing-text.ts` header: "The lobby, the wall, the Remote and the tablets stay English too." The root page block (header code label, Build/Run text, asks) is in DE/EN/FR/IT, and the teacher's chat with their AI, and the quiz it makes, are in the teacher's language. The film follows the page's language the same way: the ask and the root page's words come from `landing-text.ts` at build time; the second ask, the AI's status lines and the quiz's words (one quiz, the 646 000 one, translated, not each language's own example) from `CONTENT` in `docs/film/build/film.js`, where `draft: true` marks a language whose words are drafts pending the owner's review; the site's own screens stay English (`SITE` in `film.js`, which `src/client/film.test.ts` holds to the site's code). Wall *pictures* exist in 4 languages with a different question each (see 3.9); the film uses none of them.
8. **The checks are drawn as a laptop-wide window shows them, on a phone too** (a decision, the product owner's delegate's). On a phone the site stacks the local check's cards, Quizmaster's below the fold, and the lobby's toggle (3.3, 3.4). The film is for a first-time viewer to follow which way is chosen, on a phone as much as on a laptop (`README.md`, Purpose): three cards side by side, then a close-up on one, show a choice among three in one frame, where the stacked page would need a scroll to reach the card that is taken. What it costs: a teacher who watched on a phone and opens a quiz there meets the stacked page, not the one the film showed. Plausible assumption it rests on: the same three names and buttons, stacked, are recognised as the screen the film showed; nobody outside the project has tried. The root page on the phone is drawn the same way, as a desktop's window shows it, and so is the laptop's (3.1): the page is one column at every width, so what differs on a phone is its sizes and the header's (the mark alone, no "Code" label), and "or drop it here", which a phone leaves out; drawn the same on both devices, the page the phone showed is the page the laptop then shows.

## 1. Ask 1 on the landing page, all four languages

Source: `src/public/index.html` `#ask-top` (EN, the first step's ask) and `src/client/landing-text.ts` `ask` in `en/de/fr/it`. Underlined parts (labelled on the page) in `[ ]`; `classyquiz.pages.dev` is the underlined address. The labels sit under the parts.

- EN: Read [classyquiz.pages.dev]. Can you make me a classyQuiz with exercises [like no. 1, 3 and 4] from these two sheets? [For my 4th grade class], [about 10 questions], [in English].
  labels: this site · which exercises · your class · how many · which language
- DE: Lies [classyquiz.pages.dev]. Kannst du mir ein classyQuiz mit Aufgaben [wie Nr. 1, 3 und 4] von diesen zwei Blättern machen? [Für meine 4. Klasse], [etwa 10 Fragen], [auf Deutsch].
  labels: diese Seite · welche Aufgaben · deine Klasse · wie viele · welche Sprache
- FR: Lis [classyquiz.pages.dev]. Tu peux me faire un classyQuiz avec des exercices [comme les n° 1, 3 et 4] de ces deux fiches ? [Pour ma classe de CM1], [une dizaine de questions], [en français].
  labels: ce site · quels exercices · votre classe · combien · quelle langue
- IT: Leggi [classyquiz.pages.dev]. Mi puoi fare un classyQuiz con esercizi [come i n. 1, 3 e 4] di queste due schede? [Per la mia quarta elementare], [una decina di domande], [in italiano].
  labels: questo sito · quali esercizi · la tua classe · quante · quale lingua
- Open ask, not asked for in the film (landing "ask2"): EN "Read classyquiz.pages.dev. I need a classyQuiz. Help?" / DE "Lies classyquiz.pages.dev. Ich brauche ein classyQuiz. Hilfst du mir?" / FR "Lis classyquiz.pages.dev. J'ai besoin d'un classyQuiz. Tu m'aides ?" / IT "Leggi classyquiz.pages.dev. Mi serve un classyQuiz. Mi aiuti?"

**NOTE:** the *real conversation's* first ask (2.1) is shorter than the landing ask: the same grade, no "like no. 1, 3 and 4", and the length and the language given only when the AI asked. The landing ask is that conversation in one message (`docs/design/root-page.md`, "Two steps"); the film types the landing one (the storyboard's table says why).

## 2. The chat (shot 3)

Source: `docs/example/conversation-original.webp` (681x3784, the run's screenshot), read in crops; also described on `src/public/example.html` ("Free Claude (Sonnet), 4 November 2026"); the landing's Build step names the same ("Free Claude Sonnet wrote the example above, 4 Nov 2026", `landing-text.ts` `step1detail`). The film names no AI: the app's tile reads **AI** (DE **KI**, FR and IT **IA**; `CONTENT.ai` in `film.js`), and its name, under the tile on the phone's home screen and in the chat's header, is the AI chapter's, `landing-text.ts` `capAi`: *Your AI / Deine KI / Votre IA / La tua IA*.

Layout: teacher bubbles are light-grey, right-aligned, rounded; AI text is plain on white, left. Status lines are small grey ("thinking" lines with a ▸). The `.zip` is a grey rounded chip with an archive icon: "Big numbers quiz" over small "ZIP".

### 2.1 Turn 1 (teacher, y 0–220)
- Two photos side by side, upper right (the two sheets, on brown).
- Ask, 2 lines (verbatim): "Read classyquiz.pages.dev. Can you make me a classyQuiz with exercises from these two sheets? For my 4th grade class."

### 2.2 AI answer 1 (y 220–2000 of the sheet, shape only)
- grey line "Fetching the classyquiz.pages.dev page now."; 1 line prose ("I'll start by reading the ClassyQuiz page to see what format it expects."); grey chip line "Fetched: classyQuiz ▸".
- A right-aligned grey card with the AI's two questions and the teacher's answers (4 lines + 2 lines): "F: Which language should the quiz be in? The sheets are German, but you wrote to me in English. / A: English" and "F: How long should the quiz be? / A: About 10 questions". (Can be left out of the film.)
- grey line "Checking arrow positions for the number-line questions ▸"; 1 line "Thanks. Next I'll draw the number lines and pack everything into a .zip."; grey line "Hat einen Befehl ausgeführt, dateien geteilt ▸" (German UI: "ran a command, shared files").
- Then: paragraph 2 lines ("Your quiz is ready as big-numbers-quiz.zip. Upload it on classyquiz.pages.dev to run it."), paragraph 1 line ("It has 10 questions in English, …"), **4 bullets** (1, 1, 1, 2 lines; bold lead-ins "Questions 1–3:", "4–6:", "7–8:", "9–10:"), paragraph 3 lines, paragraph 2 lines, then the **.zip chip**.

### 2.3 Turn 2 (teacher; the film's second message, with the second `.zip` chip)
- Ask, 2 lines (verbatim): "Please add some questions where the number is given and they have to pick the matching marked number line."
- AI: grey "Planning the spacing of the four new number-line questions ▸"; 1 line "I'll add three matching questions and place them right after the three “read the arrow” questions."; grey "Hat einen Befehl ausgeführt, dateien geteilt ▸"; paragraph 2 lines ("I've updated big-numbers-quiz.zip. It now has 13 questions, with three new ones in the middle as questions 4–6. In each, a number is given and the students pick which of four number lines has the arrow in the right place:"); **3 bullets** (2, 2, 1 lines: "Question 4: the number is 654 000, …", "Question 5: the number is 81 750, …", "Question 6: the number is 308 080, …"); paragraph 4 lines; paragraph 2 lines; **.zip chip** ("Big numbers quiz / ZIP").

### 2.4 Turn 3 (teacher; not in the film) and the preview cards
- Ask, 1 line (verbatim, lowercase start): "thanks. Can you make a visual preview, just one per question type?"
- AI: grey "Setting up a visualizer mockup of the projector screens ▸"; 1 line "I'll check the site's layout page so the previews match how the class will actually see them."; red grey line "Hat ein Tool verwendet Fehlgeschlagen ▸" (tool used, failed).
- **Four preview cards**, each: small grey caption above, a white rounded card with a bold question line, optional picture, then four coloured buttons 2x2 (red top-left, blue top-right, orange bottom-left, green bottom-right), each with shape + text.
  1. Caption "Reading an arrow (questions 1–3)". Question "Which number does the arrow show?". Picture: number line with arrow, labels 640 000 · 650 000 · 660 000. Buttons: ▲ 646 000 (red) · ● 645 000 (blue) · ■ 644 000 (orange) · ◆ 647 000 (green). Right answer is 646 000 (quiz.txt, `Order: fixed`).
  2. Caption "Picking the matching number line (questions 4–6)". Question "Which number line has an arrow at 654 000?". No text buttons: four small number lines (640 000 · 650 000 · 660 000 each) in red/blue/orange/green frames, arrow at slightly different places.
  3. Caption "Counting and middle questions, text only (questions 7–11)". Question "Count in steps of 20 000: 500 000, 520 000, 540 000, … What comes next?" Buttons: ▲ 560 000 · ● 550 000 · ■ 541 000 · ◆ 640 000.
  4. Caption "Finding the section (questions 12–13)". Question "On which section does 45 200 lie?". Picture: four stacked lines labelled A (4000–5000), B (45 000–46 000), C (405 000–405 100), D (450 000–451 000). Buttons: ▲ A · ● B · ■ C · ◆ D.
- Then 1 paragraph (2 lines), **4 bullets** (1, 2, 1, 2 lines, bold lead-ins), 1 paragraph (3 lines), a row of small reaction icons. No .zip chip here.

**Where the other languages are:** the same run, translated: the pictures `src/public/examples/conversation-<lang>-<light|dark>.webp` and their words in `docs/example/text.py`, which `docs/example/build.py` holds to the film's `CONTENT` in `docs/film/build/film.js` where they overlap; the translated quizzes `grosse-zahlen-quiz.zip`, `quiz-grands-nombres.zip`, `quiz-grandi-numeri.zip` (`docs/example/quiz_zips.py`). All drafts pending the owner's review.

## 3. The site's screens

### 3.1 The root page as it opens (`src/public/index.html`, `landing-text.ts`; `docs/design/root-page.md`, "One column")
The film draws the first screen as a desktop's window shows it, the column 672 px wide, from the page's own sizes (`makeRootPage` in `build/film.js`), in the page's language; below the line under the box it draws nothing (the page goes on with the film's own section). On the phone at the full width and then in on the two steps; on the laptop as a window about 1070 px wide shows it, then in on the header while the code is typed.
- Header, as wide as the column: the fox mark + "classyQuiz" (brand SVG; on a phone held upright, mark only); label **Code** (DE Code, FR Code, IT Codice; hidden under 600 px), a box with placeholder **12345** (digits, bold), a ▶ button (aria "Join" / "Beitreten" / "Rejoindre" / "Entra"), then the language switch "EN ▾". The laptop types the teacher code **63953 47** into the box.
- The sentence, the page's first heading (`what`): "Here you play quizzes your own AI makes from your sheets, notes or ideas.", its lines balanced as on the page.
- The three ways, a picture each (`src/public/landing/way-*.svg`), the name in every language as the check's cards have it, then the setting (`wayQuizmaster`, `wayPeers`, `waySolo`): **Quizmaster** "for a class or a group, on a big screen", **Peers** "with friends, each on their own device", **Solo** "on your own, to practise or review" (the sentence and the settings in the other languages: `landing-text.ts`).
- Step 1, **Ask your AI for a quiz** (`getH`; DE Frag deine KI nach einem Quiz, FR Demandez un quiz à votre IA, IT Chiedi un quiz alla tua IA): the ask of §1 as a chat message, plain, without its labels, the two sheets attached; under it "The AI's answer:" (`gives`) and the example's file by its name in the page's language (`big-numbers-quiz.zip`, `grosse-zahlen-quiz.zip`, `quiz-grands-nombres.zip`, `quiz-grandi-numeri.zip`; the film's `CONTENT.zipFile`, the same file the chat hands over).
- Step 2, the Run box (3.2), and under it "No quiz yet? Play the example ›" and, at the right, "How to ask your AI ↓" (`noQuiz`, `tryIt`, `more`).

### 3.2 Run box (root page, before upload)
Heading **Open the quiz your AI made** (DE Öffne das Quiz deiner KI, FR Ouvrez le quiz de votre IA, IT Apri il quiz della tua IA; `landing-text.ts` `run`). Dashed box with button and a line under it (`upload`, `drop`):
- EN: button "Choose the .zip file", line "or drop it here"
- DE: ".zip-Datei auswählen" / "oder hier ablegen"
- FR: "Choisir le fichier .zip" / "ou déposez-le ici"
- IT: "Scegli il file .zip" / "o trascinalo qui"
Progress after the pick (EN): "Reading the quiz…", "Preparing the pictures… 3 of 12", "Sending the quiz…" (DE "Das Quiz wird gelesen…", FR "Lecture du quiz…", IT "Lettura del quiz…"), a muted line under the box that moves the line under it down; the film shows the first. Then the local check (3.3), in this tab. The file sheet (the .zip on top) is the OS's, no site text.

### 3.3 The local check, after the upload (`open.ts` `renderCheck`, the entries in `entry-solo.ts`, `entry-peers.ts`, `entry-quizmaster.ts`; docs/user-flow.md §3.1, "The local check")
English only. The `.zip` is read in the browser; nothing has gone to the site. Top: the site's small header; the title as h1 with a small count: "Big numbers on the number line · 13 questions"; then "**How will it be played?**" and three cards, side by side on a laptop-wide window, stacked on a phone; each its name, a line, a button (the three alike, none primary) and a quiet line:
- **Solo**: "On your own, to practise or review. Each answer shows the solution right away, and the score comes at the end." [**Play ▶**] "Plays in this tab. Nothing is sent to the site. Reloading or closing the tab ends it."
- **Peers**: "With friends, each on their own device. Nobody runs it: the quiz moves on once everyone has answered." [**Play together ▶**] "Sends the quiz to the site, into a room that only people with its code can join. The room is deleted when you end it, or three hours after its last use."
- **Quizmaster**: "For a class or a group: the questions on a big screen, the answers on everyone's own device. You run it and don't play." [**Open the lobby ▶**] "Sends the quiz to the site, into a room that only people with its code can join. The room is deleted when you end it, or three hours after its last use."
Under the cards, folded: "▸ The questions and their solutions" and "If you will play it yourself, leave this closed." The film draws the laptop-wide layout (0.8), the fold below the frame; the camera moves in on Quizmaster's card, and the thumb taps "Open the lobby ▶" (while it goes up the site says "Sending the quiz…" under the button; the film leaves it out).

### 3.4 The lobby's check, then the Remote's lobby (`screen.ts` `renderCheck`, `teach.ts` `lobby`; docs/user-flow.md §3.3)
English only, and no role named (docs/design/teacher-devices.md, "Words for any crowd"). The check, the tab that opened the lobby (here the phone, the Projector until a second device takes that):
- Title line as on the local check; right of it (under it on a phone) "Join code **63953**".
- "**How are the screens arranged?**" and a toggle of two, side by side (stacked on a phone): **One screen** "It shows the quiz and steers it: the buttons under the quiz, the keyboard or a clicker." and **Screen and remote** "One device shows the quiz, another steers it: a phone, say." Screen and remote is pressed on a first visit (the rule: docs/design/teacher-devices.md, "How the screens are arranged").
- Under Screen and remote only, the how-to (verbatim): "On the second device, open **classyquiz.pages.dev** and type **63953 47**." and, hidden on a phone, " With two screens on this computer: open a second screen in a new window."
- Always: "In a video call, the window you share is the screen everyone sees."
- **Let everyone in ▶**; then the questions, listed, no fold: "**13 questions**" and [Show the solutions], then each question its number, its text and its picture, the answers folded (`manage.ts` `questionList`); "⋯ More".
The film: the check as a first visit finds it, Screen and remote pressed and the how-to there, the questions' list starting at the frame's foot (on a phone, so without the line on a second screen); then the camera moves in on the how-to and the teacher code pulses.

Once the laptop has taken the wall, the phone is the Remote; the film shows only its button, in the bubble of each press. Its lobby's words: the title, the join code; **Let everyone in ▶** until tapped; the address **classyquiz.pages.dev**, the code large **63953**, "**n** joined", avatars, the switch "Points for speed"; "Projector ✓ · ⇄ Swap" (wall there), else "On the projector computer: on classyquiz.pages.dev, type 63953 47."; "A second device, to steer from or to show the quiz on: on classyquiz.pages.dev, type 63953 47."; the questions listed, each one's answers folded. **Start quiz ▶** is pinned at the bottom.

### 3.5 Second device, after typing the teacher code (`play.ts` `enter`)
Site header (fox + classyQuiz), then the quiz title as big heading ("Big numbers on the number line"), then two buttons:
- **Show the quiz here** / small: "everyone watches this screen"
- **Steer it from here** / small: "Start, next, the solution"

### 3.6 Join screen = the wall in the lobby (`screen.ts` `renderJoin`, `renderLobby`)
Before anyone is let in, a wall steered by a Remote shows the title in its top bar and "Joining opens in a moment." (the film's laptop and wall after "Show the quiz here").
Wall version (class sees): top bar with the quiz title only; left column: QR code, then the fox + **classyquiz.pages.dev**, then the class code in huge digits **63953**; right column: a person icon with the count ("6"), avatars popping in. While nobody is in: a wordless drawing of a tablet (address bar "classyquiz.pages.dev", site header with the code box showing 63953 and ▶). After 90 s empty: "Nobody in yet? If the tablets can't open classyquiz.pages.dev, the school network may block it: what to tell IT ›" (don't draw this).
Steering tab's version adds: **Start quiz ▶**, "Points for speed" switch + "A right answer 10, up to 5 more the quicker it comes.", and "‹ Back", "A second device ›" (only where a remote is wanted), "⋯" (teacher-only, below the fold).

### 3.7 Wall during a question (`screen.ts` `renderQuestion`, `markTiles`; docs/user-flow.md §3.4; look at `src/public/landing/wall-en.webp`)
Constant frame: top bar: left "**2 / 10**", then the answered avatars in a row (only those who answered, never their colour), right a person icon and "**20 / 20**" in green (green when all in; during answering "18 / 20" etc.; hidden while reading). Below: the question as a big centred bold heading, the picture band (white), four tiles 2x2. Corner/footer: "classyquiz.pages.dev · 34654" (the image's code), small "Full screen (F)", "⋯"; when the wall steers itself the footer is the steering bar instead (⋯, address · code, "⏱ Countdown / 15 s, then closes", "▶ Answers / closes answering"). The labelled buttons on the phone are the same, ▶ before the label (`steps.ts`; "Start quiz ▶" has it after): **▶ Choices → ▶ Answers → ▶ Solution → ▶ Ranking → ▶ Question 3** ("▶ Final ranking" after the last). The film's bubble shows the label alone, without the small line under some ("closes answering").
Tile colours/shapes: red ▲, blue ◆, yellow ●, green ■.

States:
1. **Question (veiled):** question + picture visible; four tiles coloured with their shapes, faint (`app.css` `.tiles.veiled`, opacity .55), **no text**; no count; tablets show the eye. Remote line: "The choices are hidden: everyone reads the question."
2. **Answering:** tiles show their text; the avatars pop into the bar; count "n / of" rises. Countdown: a bar drains along the top edge.
3. **Locked in / the split:** each tile gets its count at the right and a bar along its foot; **no tick, nothing faded**. Remote: "Answering closed. The projector shows how everyone answered, not yet the solution."
4. **Solution:** tick ✓ before the count on the right tile(s); the others fade; the right students' avatars jump in a band over the question for about 4 s.
5. **Ranking** (3.10).

### 3.8 The question in the film
Question 1 of `big-numbers-quiz.zip` (`quiz.txt`): "**Which number does the arrow show?**", a number line labelled 640 000 · 650 000 · 660 000 with the arrow at 646 000 (`q1.svg`), `Order: fixed`, the right answer first. On the wall and tablets, in the site's pairing: red ▲ **646 000** (right) · blue ◆ **645 000** · yellow ● **644 000** · green ■ **647 000**. The split (12 / 6 / 2 / 0) is the film's own (`docs/film/build/film.js`; the storyboard says why); the class code 63953 and the teacher code 63953 47 are docs/user-flow.md's example.

### 3.9 The landing's old pictures of the wall and a tablet
`src/public/landing/wall-xx.webp` and `tablet-xx.webp` (de en fr it) show the wall at a solution and a tablet answering, each language its own question, not translations: EN "Which number does the arrow show?" with the arrow at 72 650 (right: blue ◆ 72 650; "2 / 10"; the footer's code 34654), DE 56 640, FR 327 000, IT 15 140. The wall's chrome ("Full screen (F)", "⋯", the count) is English in all four. The site doesn't show them and the film uses none of them; the README shows `wall-en.webp`.

### 3.10 Tablets (`play.ts` `render`, `look.ts`)
Top bar when playing: avatar left, "n / total" centre, "★ score" right.
- **Lobby:** the child's avatar large, three rows of pictures below to dress it (six background shapes, eight hats, six tools to hold); no words. Before joining opens: "Joining opens in a moment." Entering the code: input placeholder "12345", ▶ (aria "go"); wrong code: the code, ✗, the box again.
- **Question (reading):** top bar and a large **eye** icon. No text.
- **Answering:** top bar and four buttons (shape + choice text, colours as above). A tap marks the button at once with a dashed pulsing outline, solid once stored; the other buttons dim ("chosen").
- **Locked:** the same buttons, no more taps, the chosen one marked, a small eye in the top bar.
- **Solution:** a large ✓ (right, in a green disc) or ✗ (wrong, red disc), "–" if no answer; "+13" under it only with points for speed; the shape of the chosen button below.
- **Ranking:** avatar large, "**3.** / 20" (place / players), "★ 9"; at the final ranking also a trophy.

### 3.11 Ranking on the wall (`screen.ts` `renderRanking`, `final.ts`)
Quiz title in the top bar. Podium with the top entries: avatar, place "1.", "★ 9 / 13" (score / questions; with speed just the score). Beside it the class result: a large percentage ("64%"), "✓ 83 / 130" (right / given), and one little bar per question. The **final** ranking: podium 1–3 as steps with the numbers on the blocks, everyone else in front of it, all jumping, trophy in the top bar, "Exit" in the steering bar ("ends the quiz for everyone"). No names anywhere, only avatars.

## 4. Sources in short
- Chat: `docs/example/conversation-original.webp`; `big-numbers-quiz.zip` `quiz.txt`.
- The root page's words in 4 languages, its asks and the Run box: `src/client/landing-text.ts`, `src/public/index.html`; its sizes: `index.html`'s styles and `src/public/site.css`; the ways' pictures: `src/public/landing/way-*.svg`.
- The local check: `src/client/open.ts`, `entry-solo.ts`, `entry-peers.ts`, `entry-quizmaster.ts`.
- The lobby's check, join, wall, ranking: `src/client/screen.ts`, `final.ts`, `manage.ts`, `teach.ts`, `steps.ts`.
- Second device screen, tablet states: `src/client/play.ts`.
- Pictures of wall/tablet (EN/DE/FR/IT), not used by the site or the film: `src/public/landing/wall-xx.webp`, `tablet-xx.webp`.
- Rules and states: `docs/user-flow.md` §1–3, `docs/design/question-flow.md`.
