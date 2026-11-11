# The landing film: the words on its screens

The words the film's screens show, quoted from the site and the example's
material, with where each comes from: for whoever changes what the film says.
Paths are relative to the repo's root. `▲ ◆ ● ■` are the site's answer shapes.
The film's words themselves are in `docs/film/build/film.js` (`docs/film/README.md`).

## 0. Things to know first

**0.7 Languages.** Each screen has the language it has on the site (`README.md`, Situation: the film shows the site as built). The root page's part for people (the header's code label, the first screen, the asks) is in DE/EN/FR/IT, and the teacher's chat with their AI, and the quiz it makes, are in the teacher's language. The site's own screens after the upload (the local check, the lobby's check, the join screen, the wall chrome, the Remote, the tablets) speak the page's language on the site too (`docs/design/root-page.md`, "Languages"), but the film draws them with their English words in every language, so the German, French and Italian films don't yet show them as built (`docs/backlog.md`, Later, Localization). Where the words come from: the ask and the root page's words from `landing-text.ts` at build time; the second ask, the AI's status lines and the quiz's words (one quiz, the 646 000 one, translated, not each language's own example) from `CONTENT` in `docs/film/build/film.js`, where `draft: true` marks a language whose words are drafts pending the owner's review; the site's own screens' words from `SITE` in `film.js`, which `src/client/film.test.ts` holds to the site's code.

**0.8 The checks are drawn as a laptop-wide window shows them, on a phone too** (a decision, the product owner's delegate's). On a phone the site stacks the local check's cards, Quizmaster's below the fold, and the lobby's toggle (3.3, 3.4). The film is for a first-time viewer to follow which way is chosen, on a phone as much as on a laptop (`README.md`, Purpose): three cards side by side, then a close-up on one, show a choice among three in one frame, where the stacked page would need a scroll to reach the card that is taken. What it costs: a teacher who watched on a phone and opens a quiz there meets the stacked page, not the one the film showed. Plausible assumption it rests on: the same three names and buttons, stacked, are recognised as the screen the film showed; nobody outside the project has tried. The root page on the phone is drawn the same way, as a desktop's window shows it, and so is the laptop's (3.1): the page is one column at every width, so what differs on a phone is its sizes and the header's (the mark alone, no "Code" label), and "or drop it here", which a phone leaves out; drawn the same on both devices, the page the phone showed is the page the laptop then shows.

## 1. The ask

The root page's Quizmaster ask, `ask` in `src/client/landing-text.ts` (`#ask-quizmaster` in `src/public/index.html` for English), in the page's language, copied into the film's `LANDING` at build time. The film types it in the chat, the address in the accent and underlined, its other marked parts each kept on one line. How it relates to the run's first ask: `docs/design/root-page.md`, "Getting a quiz"; why the film types the page's: `README.md`, "What it shows, and why".

## 2. The chat

The chat's words are `CONTENT` in `docs/film/build/film.js`. English is the example's run (a free Claude Sonnet, 4 Nov 2026), whose words are `docs/example/text.py`'s; `docs/example/build.py` refuses to build while the two differ where they overlap. German, French and Italian are that run translated, drafts pending the owner's review, as are the translated quizzes (`docs/example/quiz_zips.py`).

The film shows two of the run's three teacher turns: the page's ask (§1) with the two photos, the AI's status line (`status1`), bars for its prose, the `.zip` chip (`zipTitle` over "ZIP"); then the second ask (`ask2`), the one that changes the quiz, a status line (`status2`), bars, a second chip, which is tapped. The AI's questions on the language and the length, and the third turn with its preview cards, are left out (`README.md`, Purpose, 2: one sentence makes the quiz, another changes it).

The film names no AI: the app's tile reads **AI** (DE **KI**, FR and IT **IA**; `CONTENT.ai`), and its name, under the tile on the phone's home screen and in the chat's header, is the AI chapter's, `landing-text.ts` `capAi`.

## 3. The site's screens

### 3.1 The root page as it opens (`src/public/index.html`, `landing-text.ts`; `docs/design/root-page.md`, "One column")
The film draws the first screen as a desktop's window shows it, the column 672 px wide with the step numbers in its left margin, from the page's own sizes (`makeRootPage` in `build/film.js`), in the page's language; below the line under the box it draws nothing (the page goes on with the film's own section). On the phone at the full width and then in on the two steps; on the laptop as a window about 1070 px wide shows it, then in on the header while the code is typed.
- Header, as wide as the column: the fox mark + "classyQuiz" (brand SVG; on a phone held upright, mark only); label **Code** (`code`; hidden under 600 px), a box with placeholder **12345** (digits, bold), a ▶ button (aria "Join"), then the language switch "EN ▾". The laptop types the teacher code **63953 47** into the box.
- The sentence, the page's first heading (`what`): "Play quizzes your own AI makes: for a class or group, with friends, or on your own.", its lines balanced as on the page.
- Step 1's heading, its number in the margin: **Ask your AI for a quiz** (`getH`) and beside it "Any AI subscription will do, or free Claude." (`which`).
- The examples as tabs in words under it, one line each, named by what an ask starts from (`tabIdea`, `tabSheets`, `tabNotes`, `tabTest`): **Idea**, open into the chat, **Sheets**, **Notes**, **Test**, and **Not sure?** (`unsure`), the four on the tabs' ground, each as wide as its name and the row's rest shared.
- The chat: the first tab's ask (`askIdea`, the owner's space run, tidied) as the visitor's message on the right, nothing attached; under it "The AI's answer:" (`gives`) and the file card, its face the quiz's first question as the site's Solo screen shows it (`src/public/landing/face-idea-<lang>.webp`, the page's own picture of it), on it the first tab's file by its name and size in the page's language (`zipIdea`, `sizeIdea`, from `client/example-files.ts`), the download arrow, and "Play this quiz ↓" (`playThis`); beside the card's foot "The whole example ›" (`see`). So the page the film shows isn't the sheets story it tells: the page opens on another example (`docs/design/root-page.md`, "Getting a quiz"), and the teacher's own file is the one that goes into the box.
- Step 2, the Run box (3.2), its number in the margin, the margin's line joining the two.

### 3.2 Run box (root page, before upload)
Heading **Open the quiz your AI made** (`landing-text.ts` `run`). Dashed box, the heading inside it, and on the heading's row the button "Choose the .zip file" and the line "or drop it here" (`upload`, `drop`).
Progress after the pick: "Reading the quiz…", "Preparing the pictures… 3 of 12", "Sending the quiz…", a muted line under the box that moves the line under it down; the film shows the first. Then the local check (3.3), in this tab. The file sheet (the .zip on top) is the OS's, no site text.

### 3.3 The local check, after the upload (`open.ts` `renderCheck`, the entries in `entry-solo.ts`, `entry-peers.ts`, `entry-quizmaster.ts`; docs/design/local-check.md)
In English in every language of the film (0.7). The `.zip` is read in the browser; nothing has gone to the site. Top: the site's small header; the title as h1 with a small count: "Big numbers on the number line · 13 questions"; then "**How will it be played?**" and three cards, side by side on a laptop-wide window, stacked on a phone; each the picture of its way on top (`src/public/landing/way-*.svg`, `docs/ways/`), its name, a line, a button (the three alike, none primary) and a quiet line:
- **Solo**: "On your own, to practise or review. Each answer shows the solution right away, and the score comes at the end." [**Play ▶**] "Plays in this tab. Nothing is sent to the site. Reloading or closing the tab ends it."
- **Peers**: "With friends, each on their own device. Nobody runs it: the quiz moves on once everyone has answered." [**Play together ▶**] "Sends the quiz to the site, into a room that only people with its code can join. The room is deleted when you end it, or three hours after its last use."
- **Quizmaster**: "For a class or a group: the questions on a big screen, the answers on everyone's own device. You run it and don't play." [**Open the lobby ▶**] "Sends the quiz to the site, into a room that only people with its code can join. The room is deleted when you end it, or three hours after its last use."
Under the cards, folded: "▸ The questions and their solutions" and "If you will play it yourself, leave this closed." The film draws the laptop-wide layout (0.8), the fold below the frame; the camera moves in on Quizmaster's card, and the thumb taps "Open the lobby ▶" (while it goes up the site says "Sending the quiz…" under the button; the film leaves it out).

### 3.4 The lobby's check, then the Remote's lobby (`screen.ts` `renderCheck`, `teach.ts` `lobby`; docs/design/teacher-devices.md, "The single tab: check, then join")
In English in every language of the film (0.7), and no role named (docs/design/teacher-devices.md, "Words for any crowd"). The check, the tab that opened the lobby (here the phone, the Projector until a second device takes that):
- Title line as on the local check; right of it (under it on a phone) "Join code **63953**".
- "**How are the screens arranged?**" and a toggle of two, side by side (stacked on a phone): **One screen** "It shows the quiz and steers it: the buttons under the quiz, the keyboard or a clicker." and **Screen and remote** "One device shows the quiz, another steers it: a phone, say." Screen and remote is pressed on a first visit (why: docs/design/teacher-devices.md, "How the screens are arranged").
- Under Screen and remote only, the how-to (verbatim): "On the second device, open **classyquiz.pages.dev** and type **63953 47**." and, hidden on a phone, " With two screens on this computer: open a second screen in a new window."
- Always: "In a video call, the window you share is the screen everyone sees."
- **Let everyone in ▶**; then the questions, listed, no fold: "**13 questions**" and [Show the solutions], then each question its number, its text and its picture, the answers folded (`manage.ts` `questionList`); "⋯ More".
The film: the check as a first visit finds it, Screen and remote pressed and the how-to there, the questions' list starting at the frame's foot (on a phone, so without the line on a second screen); then the camera moves in on the how-to and the teacher code pulses.

Once the laptop has taken the wall, the phone is the Remote; the film shows only its button, in the bubble of each press. Its lobby's words: the title, the join code; **Let everyone in ▶** until tapped; the address **classyquiz.pages.dev**, the code large **63953**, "**n** joined", avatars, the switch "Points for speed"; "Big screen ✓ · ⇄ Swap" (wall there), else "On the big screen's computer: on classyquiz.pages.dev, type 63953 47."; "A second device, to steer from or to show the quiz on: on classyquiz.pages.dev, type 63953 47."; the questions listed, each one's answers folded. **Start quiz ▶** is pinned at the bottom.

### 3.5 Second device, after typing the teacher code (`play.ts` `enter`)
Site header (fox + classyQuiz), then the quiz title as big heading ("Big numbers on the number line"), then two buttons:
- **Show the quiz here** / small: "everyone watches this screen"
- **Steer it from here** / small: "Start, next, the solution"

### 3.6 Join screen = the wall in the lobby (`screen.ts` `renderJoin`, `renderLobby`)
Before anyone is let in, a wall steered by a Remote shows the title in its top bar and "Joining opens in a moment." (the film's laptop and wall after "Show the quiz here").
Wall version (class sees): top bar with the quiz title only; left column: QR code, then the fox + **classyquiz.pages.dev**, then the class code in huge digits **63953**; right column: a person icon with the count ("6"), avatars popping in. While nobody is in: a wordless drawing of a tablet (address bar "classyquiz.pages.dev", site header with the code box showing 63953 and ▶). After 90 s empty: "Nobody in yet? If the tablets can't open classyquiz.pages.dev, the school network may block it: what to tell IT ›"; the film's class is in before then.
Steering tab's version adds: **Start quiz ▶**, "Points for speed" switch + "A right answer 10, up to 5 more the quicker it comes.", and "‹ Back", "A second device ›" (only where a remote is wanted), "⋯" (teacher-only, below the fold).

### 3.7 Wall during a question (`screen.ts` `renderQuestion`, `markTiles`; docs/design/question-flow.md, "The states of a question"; look at `src/public/landing/wall-en.webp`)
Constant frame: top bar: left "**2 / 10**", then the answered avatars in a row (only those who answered, never their colour), right a person icon and "**20 / 20**" in green (green when all in; during answering "18 / 20" etc.; hidden while reading). Below: the question as a big centred bold heading, the picture band (white), four tiles 2x2. Corner/footer: "classyquiz.pages.dev · 34654" (the image's code), small "Full screen (F)", "⋯"; when the wall steers itself the footer is the steering bar instead (⋯, address · code, "⏱ Countdown / 15 s, then closes", "▶ Answers / closes answering"). The labelled buttons on the phone are the same, ▶ before the label (`steps.ts`; "Start quiz ▶" has it after): **▶ Choices → ▶ Answers → ▶ Solution → ▶ Ranking → ▶ Question 3** ("▶ Final ranking" after the last). The film's bubble shows the label alone, without the small line under some ("closes answering").
Tile colours/shapes: red ▲, blue ◆, yellow ●, green ■.

States:
1. **Question (veiled):** question + picture visible; four tiles coloured with their shapes, faint (`app.css` `.tiles.veiled`, opacity .55), **no text**; no count; tablets show the eye. Remote line: "The choices are hidden: everyone reads the question."
2. **Answering:** tiles show their text; the avatars pop into the bar; count "n / of" rises. Countdown: a bar drains along the top edge.
3. **Locked in / the split:** each tile gets its count at the right and a bar along its foot; **no tick, nothing faded**. Remote: "Answering closed. The big screen shows how everyone answered, not yet the solution."
4. **Solution:** tick ✓ before the count on the right tile(s); the others fade; the right students' avatars jump in a band over the question for about 4 s.
5. **Ranking** (3.10).

### 3.8 The question in the film
Question 1 of `big-numbers-quiz.zip` (`quiz.txt`): "**Which number does the arrow show?**", a number line labelled 640 000 · 650 000 · 660 000 with the arrow at 646 000 (`q1.svg`), `Order: fixed`, the right answer first. On the wall and tablets, in the site's pairing: red ▲ **646 000** (right) · blue ◆ **645 000** · yellow ● **644 000** · green ■ **647 000**. The split (12 / 6 / 2 / 0) is the film's own (`docs/film/build/film.js`): blue the halfway mistake, yellow one tick off; the class code 63953 and the teacher code 63953 47 are the design docs' example (`docs/design/teacher-devices.md`).

### 3.9 Tablets (`play.ts` `render`, `look.ts`)
Top bar when playing: avatar left, "n / total" centre, "★ score" right.
- **Lobby:** the child's avatar large, three rows of pictures below to dress it (six background shapes, eight hats, six tools to hold); no words. Before joining opens: "Joining opens in a moment." Entering the code: input placeholder "12345", ▶ (aria "go"); wrong code: the code, ✗, the box again.
- **Question (reading):** top bar and a large **eye** icon. No text.
- **Answering:** top bar and four buttons (shape + choice text, colours as above). A tap marks the button at once with a dashed pulsing outline, solid once stored; the other buttons dim ("chosen").
- **Locked:** the same buttons, no more taps, the chosen one marked, a small eye in the top bar.
- **Solution:** a large ✓ (right, in a green disc) or ✗ (wrong, red disc), "–" if no answer; "+13" under it only with points for speed; the shape of the chosen button below.
- **Ranking:** avatar large, "**3.** / 20" (place / players), "★ 9"; at the final ranking also a trophy.

### 3.10 Ranking on the wall (`screen.ts` `renderRanking`, `final.ts`)
Quiz title in the top bar. Podium with the top entries: avatar, place "1.", "★ 9 / 13" (score / questions; with speed just the score). Beside it the class result: a large percentage ("64%"), "✓ 83 / 130" (right / given), and one little bar per question. The **final** ranking: podium 1–3 as steps with the numbers on the blocks, everyone else in front of it, all jumping, trophy in the top bar, "Exit" in the steering bar ("ends the quiz for everyone"). No names anywhere, only avatars.

## 4. Sources in short
- Chat: `CONTENT` in `docs/film/build/film.js`, held to `docs/example/text.py`; `big-numbers-quiz.zip` `quiz.txt`.
- The root page's words in 4 languages, its asks and the Run box: `src/client/landing-text.ts`, `src/public/index.html`; its sizes: `index.html`'s styles and `src/public/site.css`; the face on the file: `src/public/landing/face-idea-<lang>.webp` (`docs/example/faces.py`); the pictures on the check's cards: `src/public/landing/way-*.svg`.
- The local check: `src/client/open.ts`, `entry-solo.ts`, `entry-peers.ts`, `entry-quizmaster.ts`.
- The lobby's check, join, wall, ranking: `src/client/screen.ts`, `final.ts`, `manage.ts`, `teach.ts`, `steps.ts`.
- Second device screen, tablet states: `src/client/play.ts`.
- The screens' design and states: `docs/design/teacher-devices.md`, `docs/design/question-flow.md`.
