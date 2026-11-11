# The worked example (`/example`)

## Purpose

A first-time teacher wants to see how a quiz comes about before trying it:
a walkthrough, the example step by step. The landing's film shows the path in
about a minute; this page shows the same path with the real material, and hands
over everything needed to repeat it on the teacher's own AI: the sheets, what
was said to the AI, what it handed back, and the quiz itself to run (backlog
v4 item 10).

## Situation

- The page is reached from "The whole example ›" beside each example's file
  in the landing's chat (`root-page.md`, "Getting a quiz"), one link per
  tab. The landing itself shows the example's ask and its file, and starts
  the example quiz; what only this page has is what was attached, the whole
  conversation and the files to repeat it with. Plausible assumption: teachers
  read the path shown there as the example, and look behind it for a
  walkthrough, not the result alone (the page's name and its four steps).
- An AI told the site's name may follow that link. A teacher's chat with
  an AI, read as page text, could pass for instructions to it.
- The example's material is the sheet derived from the owner's, the owner's
  phone photographs of it printed, and a conversation with an AI. The
  conversation (4 Nov 2026) was run on earlier stand-in photographs made from
  the rendered sheet; the photographs on the page are of 5 Nov 2026.
- An upload costs the shared free site one booking and the quiz's bytes
  (`hosting-and-limits.md`).

## How the site meets it

`src/public/example.html`, static and in English for an AI that reads it;
`client/example.ts` puts it in the visitor's language, one of the landing's
four (`?lang=` from the landing's link, otherwise the device's choice, as on
the landing; words in `client/example-text.ts`). The header is the landing's,
code box and language switch (`client/top.ts`). The four steps follow the
path the film shows.

1. **The exercise sheets**: the two photographs, each as a download, and the
   sheets as a PDF, so a teacher can try the photographs or the clean file on
   their own AI.
2. **The conversation**, as a picture, not text: an AI reading the page doesn't
   read it, and the layout is the AI app's own. All three turns of the free
   Claude Sonnet session of 4 Nov 2026, rendered from its screenshot in the
   page's language and the device's light or dark mode (`<picture>`; the link
   to the whole picture follows the mode). How they are made:
   `docs/example/README.md`. The preview shows its top. The line above it
   names model, plan and date.
3. **The quiz**: the `.zip` the AI handed over, in the page's language.
4. **Try it**: "Start this quiz" opens `/open?example=<lang>&ex=<example>`, the
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
German, nothing attached): no sheets' step, since nothing was attached; the
conversation, one ask and one answer, as a picture in the page's language
and the device's mode as above; then **the overview**, the AI's picture of
every question with its solution, which the run handed over with the `.zip`
for checking the quiz before it is played (German the AI's own review.png,
the other languages drawn from their translated `.zip` by the site's
`preview.py`, the script the guidance offers the AI for it); then the quiz
and its start, and a note that the run was made in German and the other
pages show it translated (words: `IDEA_TEXT` in `client/example-text.ts`;
pictures: `docs/example/README.md`). `?ex=notes` and `?ex=test` are the full
examples of the Notes and Test tabs, whose runs are mocks until the owner's
(backlog, "The page for people", item 1): the same four steps, with the mock
attachment in place of the photographs, a made-up conversation made by the
script and said to be made up (`MOCK_TEXT`), the mock `.zip`
(`docs/example/mock_zips.py`), which holds the quiz without pictures, and its
start, and without the note below.

Each page is one example of the landing's four, so its words name its quiz
("How the number-line quiz was made") and start "this quiz"; its heading,
"The example, step by step", is the one the visitor came from.

Under the steps, a note: the example was tested in all four languages and
works in each; so that it is the same example in each, the German, French and
Italian pages show the English run translated. One quiz in every language,
the one the film shows (its `CONTENT` in `docs/film/build/film.js`): the
conversation's words and the `.zip`s agree with the film's where they
overlap (`docs/example/`).

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

- The conversation and the `.zip` ("Big numbers on the number line",
  13 questions) are one real run, reviewed by the owner; the zip is that run's
  second turn. The owner may still replace them with a run of his own.
- Whether a teacher on a phone reads the conversation: the preview is the
  picture scaled to the screen; the whole picture opens at full size.
- The German, French and Italian words, pictures and quizzes are drafts (backlog v4 item 12).
