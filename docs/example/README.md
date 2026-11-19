# The examples: their quizzes, their faces, their conversations

The root page's chat offers an example for each thing an ask can start from,
Idea, Sheets, Notes, Test (`docs/design/root-page.md`, "Getting a quiz"), each
with its `.zip` in the page's four languages and a face, the quiz's first
question as the site shows it; `/example` shows each one's full example
(`docs/design/example-page.md`). This folder is their source and the scripts
that build them into `src/public/`.

A teacher reading `/example` in English, German, French or Italian sees the
conversation with the AI that made the example quiz, in their language and in
their device's light or dark mode, laid out as the AI app's own chat. Why the
page shows it as a picture and not as text: `docs/design/example-page.md`.

The pictures are `src/public/examples/conversation-<lang>-<light|dark>.webp`
(the sheets run's), `conversation-idea-<lang>-<light|dark>.webp` (the space
run's), `conversation-notes-<lang>-<light|dark>.webp` (the notes run's) and
`conversation-test-<lang>-<light|dark>.webp` (the test run's),
681 px wide; the sheets and space runs' overviews, `review-<lang>.webp` and
`review-idea-<lang>.webp`, 1500 px wide; and the pages of the notes and of
the marked test, `notes-<lang>-<page>.webp` and `test-<lang>-<page>.webp`
there, `src/public/landing/notes-<lang>.webp` and `test-<lang>.webp`
for the root page's chat. They are generated: edit the source, not them.

## What the pictures are

The sheets run's (the root page's "Sheets" tab, and `/example` without
`?ex=`):

- A reproduction of the owner's run of 19 Nov 2026, German, Claude Sonnet
  5.5 (its screenshot `sheets-conversation-original.webp` here, dark): the
  two photographs and two asks, each answered with an overview of the
  questions and a `.zip`; the AI's words as it wrote them, the app's folded
  steps, the thumbnails, the files' cards and "Download all". The first ask
  is the root page's sheets ask, read from `landing-text.ts`; the second is
  the owner's, tidied (`text.py`). The app showed its own words in English;
  the German picture keeps them, the others show their language's.
- English, French and Italian are that run translated, the words drafts,
  as the space run's are.
- The photographs are the page's (`sheet-photo-1.jpg`, `-2.jpg`), the ones
  the run attached, in its order, page 15 first.
- The thumbnails beside a fold of the app's steps stand in for the run's:
  the language's overview and two of the quiz's pictures. The overview's
  thumbnail under each answer is the final overview in both answers.
- The overview, `review-<lang>.webp`: each language's drawn from its
  `.zip` by the site's `preview.py`, German too, since the example shows
  the site as it is (`design/example-page.md`, Purpose); what that changes
  in the AI's words: `text.py`.

The space run's (the root page's "Idea" tab):

- A reproduction of the owner's run of 11 Nov 2026, German, one ask with
  nothing attached and one answer (its screenshot
  `space-conversation-original.webp` here, dark): the ask as typed, the
  app's folded steps, the AI's answer with its summary, the overview's
  thumbnail, the
  `.zip` and "Download all". The app showed its own words in English; the
  German picture keeps them, the others show their language's.
- English, French and Italian are that run translated, the words drafts,
  as the sheets run's are.
- The overview, `review-idea-<lang>.webp`: German the AI's own review.png
  (`space-review-original.webp` here, 1500 px wide), the others drawn from
  their translated `.zip` by the site's `src/public/preview.py`, the script
  the guidance offers the AI for it, so their typeface is that machine's.
  The committed ones predate `preview.py` arranging picture answers by
  their shape; drawn again, question 2's four planets come out two by two,
  where the German shows them in a row. Whether to draw them again, and
  the German too as the sheets run's is, is the owner's.

The notes run's (the root page's "Notes" tab):

- A reproduction of the owner's run of 12 Nov 2026, English, Claude
  Sonnet 5.5, the class notes attached as a PDF (`notes-<lang>.pdf` in
  `src/public/examples/`, the owner's in all four languages), one ask and one
  answer; its screenshot `notes-conversation-original.webp` here, dark. Both
  modes are drawn as the sheets run's are.
- German, French and Italian are that run translated, each attaching its own
  language's notes, the words drafts, as the other runs' are.

The test run (the "Test" tab on the root page):

- The owner ran it on 19 Nov 2026 in French with Claude Opus 5.5. He attached
  the marked test as a PDF and sent one message, and the AI gave one answer.
  The screenshot of that conversation is `test-conversation-original.webp`
  in this folder (dark mode).
- The picture is drawn to show a visitor what such a conversation looks
  like. It shows the attached PDF, the message, the AI's answer, the folded
  line of the AI's steps with the quiz's two drawings beside it, and the
  `.zip`. The AI's words are unchanged, except that the site's name is
  spelled "classyQuiz".
- During the run the app displayed its own interface words in English. The
  French picture keeps them in English. The other pictures show them
  translated.
- The marked test is invented, because a real test would show a real
  pupil's work. `test_sheet.py` writes it to
  `src/public/examples/test-<lang>.pdf`. All four languages have the same
  questions, the same answers and the same score, 21 of 30. The pupil's
  name, the class, the date format and the school terms follow each
  language's country. The run used the French PDF.
- The English, German and Italian versions are translations of the run.
  Each one attaches the test in its own language. The translations are
  drafts.

## Files

- `text.py`: the sheets run's words, one entry per piece of the chat with the
  four languages under each, for reading side by side. Where a piece is also
  in the landing's film (the second ask, the status lines, the `.zip`s'
  names, the quiz's title and first question) it is the film's wording
  (`CONTENT` in `docs/film/build/film.js`); `build.py` refuses to run if they
  differ.
- `build.py`: draws the chat as HTML and shoots it in the installed Edge, the
  way `docs/film/build/shoot.py` shoots the film.
- `quiz_zips.py`: makes the sheets quiz's English, French and Italian `.zip`
  from the run's `grosse-zahlen-quiz-v2.zip` (in `src/public/examples/` as it
  came): title, questions and the one text answer translated, the pictures
  unchanged, since they carry only numbers. Drafts.
- `space_text.py`: the space run's words, as `text.py` has the sheets run's.
- `space_zips.py`: makes the space quiz's English, French and Italian `.zip`
  from the owner's `weltall-quiz.zip` (in `src/public/examples/` as it came):
  the text translated, title, questions and choices (French with no-break
  spaces before its marks), and the three drawings with German words on
  them relabelled where the words stand, in the drawings' own face (DejaVu
  Sans Bold); the photographs unchanged. Drafts.
- `notes_text.py`: the notes run's words, as `text.py` has the sheets run's;
  its ask is the root page's (`askNotes`, `src/client/landing-text.ts`),
  which `build.py` reads from there.
- `notes_zips.py`: makes the notes quiz's German, French and Italian `.zip`
  from the run's `french-revolution-quiz.zip` (in `src/public/examples/` as
  it came), in the words of each language's notes. Drafts.
- `test_sheet.py`, `test_sheet.html`: build the marked test. The HTML file
  is the sheet, with three layers: the printed test, the pupil's
  handwriting and the teacher's red marks. The Python file holds the words
  in four languages and writes `test-<lang>.pdf`.
- `test_text.py`: the words of the test run's conversation in four
  languages. The pupil's message is not in this file. `build.py` reads it
  from `askTest` in `src/client/landing-text.ts`, so the root page and the
  picture always show the same message.
- `test_zips.py`: translates the quiz from the run,
  `classyquiz-cellule.zip`, into German, English and Italian. The French
  file in `src/public/examples/` is the one the AI handed over. The two
  drawings contain no words and are copied unchanged. The translations are
  drafts.
- `faces.py`: what the root page says of each example's file and its face.
  It reads every example's `.zip` (the table `EXAMPLES` names them) and
  writes `src/client/example-files.ts` (each file's name, size, title,
  question count and first question), then shoots each quiz's first
  question from the site's own Solo screen, 800 × 500 CSS px, into
  `src/public/landing/face-<example>-<lang>.webp` (464 × 290), the site's
  random draws fixed so a rebuild draws the same. It serves `src/dist/`
  itself, so the site is built first. `src/client/example-files.test.ts`
  fails while the table doesn't match the files.

## Running it

From anywhere, in this order when a quiz changes:

1. `py -I docs/example/space_zips.py`, `py -I docs/example/quiz_zips.py`,
   `py -I docs/example/notes_zips.py`, `py -I docs/example/test_zips.py`:
   these write the translated `.zip` files. Also run
   `py -I docs/example/test_sheet.py` if the marked test changed.
2. `cd src && npm run build`, then `py -I docs/example/faces.py`: the
   files' table and the faces (`--files-only` for the table alone). The
   faces are shot from the built site, which opens each file by the name the
   table had at the build: when a file's name changes, the table first, then
   the build, then the faces.
3. `py -I docs/example/build.py`: the conversations, the overviews and the
   pages of the notes and the test (`--convo sheets`, `idea`, `notes` or `test`,
   `--lang de`, `--theme dark` for fewer); `--keep` leaves the pages and
   the full-size PNGs in
   `.tmp/example/` (git-ignored).
4. The film, which shows the first tab's file and face
   (`src/DEVELOPING.md`, "The landing film").

Needs Python with Pillow, playwright and PyMuPDF, and Edge; `space_zips.py`
needs
DejaVu Sans Bold (Windows 10 has it, so does matplotlib). The typefaces are
the machine's (Segoe UI, Cambria, Consolas on Windows), not the AI app's own,
so rebuilding elsewhere gives slightly different line breaks; the faces are
the site's Solo screen in the machine's `system-ui`.

## Not known

- The sheets run: its translations by a native reader.
- The space run: its translations by a native reader; its model and plan,
  which the screenshot doesn't show.
- The notes run: its translations by a native reader; its plan.
- The test run: no native speaker has read the translations. Which plan
  the run used is not known. No biology teacher has read the invented test.
- The colours: light was drawn from an earlier run's light screenshot of
  the same app, dark estimated from it. By eye, dark matches the sheets
  run's screenshot; the exact colours of either are unchecked.
