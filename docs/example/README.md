# The example's conversation pictures

A teacher reading `/example` in English, German, French or Italian sees the
conversation with the AI that made the example quiz, in their language and in
their device's light or dark mode, laid out as the AI app's own chat. Why the
page shows it as a picture and not as text: `docs/design/example-page.md`.

The pictures are `src/public/examples/conversation-<lang>-<light|dark>.webp`
(8 files, 681 px wide). They are generated: edit the source, not them.

## What the pictures are

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

## Running it

From anywhere: `py -I docs/example/build.py` (all 8 pictures), or
`--lang de`, `--theme dark` for one; `--keep` leaves the page and the full-size
PNG in `.tmp/example/` (git-ignored).

Needs Python with Pillow and playwright, and Edge. The typefaces are the
machine's (Segoe UI, Cambria, Consolas on Windows), not the AI app's own, so
rebuilding elsewhere gives slightly different line breaks.

## Not known

- Dark: how the app's dark theme really looks.
- A few details of the screenshot: a word in the third answer is garbled in it
  ("the ques... is only a few words", read as "question"), and the second ask
  reads "Prease" there (the film and these pictures have "Please").
