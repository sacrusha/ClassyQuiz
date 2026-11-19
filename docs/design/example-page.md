# The worked example (`/example`)

## Purpose

A first-time teacher wants to see how a quiz comes about before trying it:
a walkthrough, the example step by step. The landing's film shows the path in
about a minute; this page shows the same path with the real material, and hands
over everything needed to repeat it on the teacher's own AI: the sheets, what
was said to the AI, what it handed back, and the quiz itself to run (backlog
v4 item 10). It is there to explain and set expectations, not to reproduce a
run faithfully (the owner): where a run met a bug the site has since fixed,
the example shows the site as it is.

## Situation

- The page is reached from "The whole example ›" beside each example's file
  in the landing's chat (`root-page.md`, "Getting a quiz"), one link per
  tab. The landing itself shows the example's ask and its file, and starts
  the example quiz; what only this page has is what was attached, the whole
  conversation and the files to repeat it with. Plausible assumption: teachers
  read the path shown there as the example, and look behind it for a
  walkthrough, not the result alone (the page's name and its steps).
- An AI told the site's name may follow that link. A teacher's chat with
  an AI, read as page text, could pass for instructions to it.
- The example's material is the sheet derived from the owner's, the owner's
  phone photographs of it printed (5 Nov 2026), and the owner's conversation
  with an AI that attached them (19 Nov 2026, German).
- An upload costs the shared free site one booking and the quiz's bytes
  (`hosting-and-limits.md`).

## How the site meets it

`src/public/example.html`, static and in English for an AI that reads it;
`client/example.ts` puts it in the visitor's language, one of the landing's
four (`?lang=` from the landing's link, otherwise the device's choice, as on
the landing; words in `client/example-text.ts`). The header is the landing's,
code box and language switch (`client/top.ts`). The steps follow the
path the film shows.

1. **The exercise sheets**: the two photographs, each as a download, and the
   sheets as a PDF, so a teacher can try the photographs or the clean file on
   their own AI.
2. **The conversation**, as a picture, not text: an AI reading the page doesn't
   read it, and the layout is the AI app's own. Both turns of the owner's
   session of 19 Nov 2026 (Claude Sonnet 5.5, German), rendered from its
   screenshot in the page's language and the device's light or dark mode
   (`<picture>`; the link to the whole picture follows the mode). How they
   are made: `docs/example/README.md`. The preview shows its top. The line
   above it says what happened in a sentence and names the AI and the date,
   not the plan: in that app the free and paid plans have the same features
   (the owner).
3. **The overview**, the AI's picture of every question with its solution,
   which the run handed over with each `.zip` for checking the quiz before
   it is played: the second answer's, drawn from each language's `.zip` by
   the site's `preview.py`, the script the guidance offers the AI for it
   and the one the run used.
4. **The quiz**: the `.zip` the AI handed over with its second answer, in
   the page's language.
5. **Try it**: "Start this quiz" opens `/open?example=<lang>&ex=<example>`, the
   local check (`local-check.md`): it fetches the static `.zip` and reads it
   through the same function as a dropped file (`opening.ts`, `readQuiz`),
   so the example can't run differently from a teacher's. Looking costs the
   site nothing, and neither does Solo; opening a room there (Peers, or
   Quizmaster's "Open the lobby") is a real upload, booked like any. The
   step's words say so: the visitor chooses how it is played, on their own
   it stays in the browser, with friends or a class it runs like any quiz
   (a visitor who isn't a teacher sees the example is theirs to play too,
   backlog v5 item 9).

`/example` without `?ex=` is the worked example, the landing's Sheets tab.
`?ex=idea` is the landing's first tab, the owner's space run (11 Nov 2026,
German, nothing attached): the steps without the sheets', since nothing was
attached; the conversation, one ask and one answer, and its overview, German
the AI's own review.png, as above (words: `IDEA_TEXT` in
`client/example-text.ts`; pictures: `docs/example/README.md`). `?ex=notes`
is the Notes tab's, the owner's notes run (12 Nov 2026, English): the notes'
two pages and their PDF in place of the photographs, the conversation as a
picture, no overview, since the run handed over none, the quiz and its
start, and a note that the run was made in English and the other pages
show it translated (words: `NOTES_TEXT`). `?ex=test` is the page for the Test tab. It shows the owner's test run
(19 Nov 2026, French, Claude Opus). In place of the photographs it shows
the two pages of the marked test and offers the PDF. The page says that
the test was written for the example, because a real test would show a
real pupil's work. Below that come the conversation as a picture, the quiz
with its two drawings, and the button that starts it. There is no
overview, because the AI made none in this run. A note at the end says
that the run was made in French and that the other languages show a
translation. The words are in `TEST_TEXT`.

Each page is one example of the landing's four, so its words name its quiz
("How the number-line quiz was made") and start "this quiz"; the heading,
"The example, step by step", is the same on all four and means the example
whose "The whole example ›" the visitor pressed.

Under the steps, a note: the example was made in German, and so that it is
the same example in each language, the English, French and Italian pages
show it translated (the idea's page says the same of its run, the notes'
of its English one). One quiz in every language, the one the film shows
(its `CONTENT` in `docs/film/build/film.js`): the conversation's words and
the `.zip`s agree with the film's where they overlap (`docs/example/`).

The files are in `src/public/examples/` (not `example/`, which would collide
with the page's address). The photographs are the owner's
originals (`.tmp/ExampleSheets/`, owner's machine, not in the repo) cut to the
paper at top and bottom, the wood beside it left, 1200 px wide, without the
camera's metadata.

## Not known

- The space run's AI: the page names it "Claude" from its screenshot, and
  neither its model nor its plan; the owner knows them.
- The space run's photographs: 19 of its 23 pictures (15 with questions, 4
  as the choices of question 2), in each of its four `.zip`s. The AI said
  they are NASA's and so in the public domain; no picture carries a source
  or a credit, and nothing else records where each comes from, so the page
  says "photographs it found" and whether the site may hand them on is the
  owner's (backlog, "Open: with the owner").
- The space run's English, French and Italian: its conversation, its quiz and
  its drawings' words are drafts, and its overview in those languages is the
  site's `preview.py`'s, not an AI's.
- The notes run's plan: the screenshot shows Sonnet 5.5, not which plan.
  Its German, French and Italian conversation and quiz are drafts; the notes
  in those languages are the owner's.
- The test run: which plan was used is not known; the screenshot shows only
  "Opus 5.5". The English, German and Italian conversation and quiz are
  draft translations. No biology teacher has read the invented test in any
  of the four languages.
- The sheets run's English, French and Italian conversation, overview and
  quiz are drafts (backlog v4 item 12).

- Whether a teacher on a phone reads the conversation: the preview is the
  picture scaled to the screen; the whole picture opens at full size.
