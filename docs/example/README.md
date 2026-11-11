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
(the sheets run's) and `conversation-idea-<lang>-<light|dark>.webp` (the space
run's), 681 px wide, and the space run's overview,
`review-idea-<lang>.webp`, 1500 px wide. They are generated: edit the source,
not them.

## What the pictures are

The sheets run's:

- A reproduction of the run (a free Claude Sonnet, 4 Nov 2026; its screenshot
  `conversation-original.webp` in this folder, English, light), all three teacher
  turns: the first ask with the two photographs and the answer with the `.zip`,
  the second ask and the updated `.zip`, and the third ask with the AI's four
  preview cards.
- The German, French and Italian pictures are that run translated, so the
  example reads the same in each language. The page says so. The translations
  are drafts pending the owner's review (`docs/translation-review.md`).
- Light follows the screenshot. Dark is drawn here as that app's dark theme,
  without a reference: colours are estimates.
- The photographs: `sheet-photo-1.jpg`, `-2.jpg`.

The space run's (the root page's "Idea" tab):

- A reproduction of the owner's run of 11 Nov 2026, German, one ask with
  nothing attached and one answer (its screenshot and transcript are on the
  owner's machine, `.tmp/spaceQuiz/`): the ask as typed, the app's folded
  steps, the AI's answer with its summary, the overview's thumbnail, the
  `.zip` and "Download all". The app showed its own words in English; the
  German picture keeps them, the others show their language's.
- English, French and Italian are that run translated, the words drafts,
  as the sheets run's are.
- The overview, `review-idea-<lang>.webp`: German the AI's own review.png
  (`space-review-original.webp` here, 1500 px wide), the others drawn from
  their translated `.zip` by the site's `src/public/preview.py`, the script
  the guidance offers the AI for it, so their typeface is that machine's.

## Files

- `text.py`: the words, one entry per piece of the chat with the four languages
  under each, for reading side by side. Where a piece is also in the landing's
  film (the second ask, the status lines, the quiz's title and questions, the
  `.zip` names) it is the film's wording (`CONTENT` in
  `docs/film/build/film.js`); `build.py` refuses to run if they differ. The quiz
  questions the preview cards show are those of the translated quizzes
  (`quiz_zips.py`).
- `build.py`: draws the chat as HTML and shoots it in the installed Edge, the
  way `docs/film/build/shoot.py` shoots the film.
- `quiz_zips.py`: makes the German, French and Italian `.zip`s from the English
  one (a separate piece; the pictures only quote its wording).
- `space_text.py`: the space run's words, as `text.py` has the sheets run's.
- `space_zips.py`: makes the space quiz's English, French and Italian `.zip`
  from the owner's `weltall-quiz.zip` (in `src/public/examples/` as it came):
  the text translated, title, questions and choices (French with no-break
  spaces before its marks), and the three drawings with German words on
  them relabelled where the words stand, in the drawings' own face (DejaVu
  Sans Bold); the photographs unchanged. Drafts.
- `mock_zips.py`: the stand-in quizzes of the root page's Notes and Test
  examples, in the four languages, until the owner's runs replace them
  (`docs/design/root-page.md`, "Getting a quiz"); it goes with them.
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
   `py -I docs/example/mock_zips.py`: the translated and stand-in `.zip`s.
2. `cd src && npm run build`, then `py -I docs/example/faces.py`: the
   files' table and the faces (`--files-only` for the table alone).
3. `py -I docs/example/build.py`: the conversations and the space run's
   overview (`--convo sheets` or `--convo idea`, `--lang de`, `--theme dark`
   for fewer); `--keep` leaves the pages and the full-size PNGs in
   `.tmp/example/` (git-ignored).
4. The film, which shows the first tab's file and face
   (`src/DEVELOPING.md`, "The landing film").

Needs Python with Pillow and playwright, and Edge; `space_zips.py` needs
DejaVu Sans Bold (Windows 10 has it, so does matplotlib). The typefaces are
the machine's (Segoe UI, Cambria, Consolas on Windows), not the AI app's own,
so rebuilding elsewhere gives slightly different line breaks; the faces are
the site's Solo screen in the machine's `system-ui`.

## Not known

- The space run: its translations by a native reader; whether the app it ran
  in is drawn rightly in dark mode, as for the sheets run; its model and plan,
  which the screenshot doesn't show.
- The faces on the French quizzes show "?" on a line of its own where the
  quiz's text has a plain space before it, as the site's Solo screen does
  (the sheets quiz's French); the space quiz's French has no-break spaces.

- Dark: how the app's dark theme really looks.
- A few details of the screenshot: a word in the third answer is garbled in it
  ("the ques... is only a few words", read as "question"), and the second ask
  reads "Prease" there (the film and these pictures have "Please").
