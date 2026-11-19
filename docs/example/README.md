# The examples

This folder builds the four examples that the root page offers in its chat
(Idea, Sheets, Notes, Test) and that `/example` shows in full. Each example
comes from one real conversation between the owner and an AI. The scripts
here turn that conversation into the files under `src/public/`, in the
site's four languages.

Why the pages look the way they do is in `docs/design/example-page.md` and
`docs/design/root-page.md` ("Getting a quiz"). How each script works is in
its own docstring. This file holds what neither of those can say: where the
material comes from, where an example differs from the real conversation,
and the order in which to rebuild.

## The four runs

| Tab | Run | Attached | Words |
|---|---|---|---|
| Idea | 11 Nov 2026, German | nothing | `space_text.py` |
| Sheets | 19 Nov 2026, German, Claude Sonnet 5.5 | two photographs of exercise sheets | `text.py` |
| Notes | 12 Nov 2026, English, Claude Sonnet 5.5 | class notes as a PDF | `notes_text.py` |
| Test | 19 Nov 2026, French, Claude Opus 5.5 | a marked test as a PDF | `test_text.py` |

For every run:

- The screenshot of the real conversation is in this folder,
  `<run>-conversation-original.webp`.
- The `.zip` the AI handed over is in `src/public/examples/`, unchanged.
- The run's own language is the original. The other three languages are
  draft translations of the conversation and the quiz.
- The example is there to show a visitor what such a conversation looks
  like. It is not a faithful record (the owner).

Where an example differs from its run:

- **Idea.** The German overview picture is the one the AI made
  (`space-review-original.webp`). The other three are drawn from the
  translated quizzes by the site's `preview.py`.
- **Sheets.** The photographs are the owner's, cut to the paper, scaled to
  1200 px wide and stripped of the camera's metadata. The owner's second
  message is tidied. The small pictures beside the folded steps were not
  kept from the run, so the overview and two pictures from the quiz stand
  in for them. Both answers show the final overview. The overviews in all
  four languages are drawn by `preview.py`, because the example shows the
  site as it is today; `text.py` records what that changed in the AI's
  words. Where the film shows the same words, `build.py` refuses to run
  unless they match.
- **Notes.** The owner wrote the notes in all four languages.
- **Test.** The marked test is invented (`test_sheet.py`), because a real
  test would show a real pupil's work. All four languages have the same
  questions, answers and score. The run used the French one. The site's
  name is spelled "classyQuiz" in the AI's words.

In the German and French runs the app displayed its own interface words in
English. The picture in the run's language keeps them in English; the other
pictures show them translated.

## Rebuilding

Run from anywhere, in this order:

1. If the marked test changed: `py -I docs/example/test_sheet.py`.
2. The translated quizzes: `py -I docs/example/space_zips.py`,
   `quiz_zips.py`, `notes_zips.py`, `test_zips.py`.
3. The table of files: `py -I docs/example/faces.py --files-only`.
4. The site: `cd src && npm run build`.
5. The faces on the root page: `py -I docs/example/faces.py`. They are
   shot from the built site, which is why the table and the build come
   first.
6. The conversations, overviews and PDF pages:
   `py -I docs/example/build.py`. Options: `--convo sheets|idea|notes|test`,
   `--lang de`, `--theme dark`, `--keep`.
7. The film, if the Idea example changed (`src/DEVELOPING.md`, "The
   landing film").

Everything these scripts write under `src/public/` is generated. Edit the
source here, not the output.

Needs Python with Pillow, playwright and PyMuPDF, and the installed Edge.
`space_zips.py` needs the font DejaVu Sans Bold. The pictures use the
machine's fonts (Segoe UI, Cambria, Consolas, Ink Free and Segoe Script on
Windows), so a rebuild on another machine gives slightly different line
breaks.

## Not known

- No native speaker has read any of the translations.
- The Idea run: which model and plan made it. For Notes and Test, which
  plan.
- The Idea overviews: the committed pictures are older than a change to
  `preview.py` that arranges picture answers by their shape. Drawn again,
  the four planets of question 2 would stand two by two, where the German
  picture shows them in a row. Whether to redraw them, and the German one
  too, is the owner's decision.
- The invented test: no biology teacher has read it.
- The chat's colours: light mode was taken from a light screenshot of the
  same app, dark mode estimated from it. Neither is checked exactly.
