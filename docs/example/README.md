# The examples

The scripts here build the four examples the root page offers in its chat
and `/example` shows in full, in the site's four languages, into
`src/public/`. Each comes from one real conversation between the owner and an
AI, and isn't a faithful record of it (`docs/design/example-page.md`).

## The four runs

| Tab | Run | Attached | Words |
|---|---|---|---|
| Idea | 11 Nov 2026, German | nothing | `space_text.py` |
| Sheets | 19 Nov 2026, German, Claude Sonnet 5.5 | two photographs of exercise sheets | `text.py` |
| Notes | 12 Nov 2026, English, Claude Sonnet 5.5 | class notes as a PDF | `notes_text.py` |
| Test | 19 Nov 2026, French, Claude Opus 5.5 | a marked test as a PDF | `test_text.py` |

Each run's screenshot is `<run>-conversation-original.webp`; the `.zip` the
AI handed over is in `src/public/examples/`, unchanged. The run's language is
the original; the other three are draft translations of the conversation and
the quiz.

Where an example differs from its run:

- **Idea**: only the German overview picture is the AI's
  (`space-review-original.webp`); the others are drawn from the translated
  quizzes by the site's `preview.py`.
- **Sheets**: the photographs are cut to the paper, scaled to 1200 px and
  stripped of metadata; the owner's second message is tidied; the overview
  and two quiz pictures stand in for the small pictures beside the folded
  steps, which weren't kept; both answers show the final overview, drawn by
  `preview.py` in all four languages, and `text.py` records what that
  changed in the AI's words. The film shows some of the same words, and
  `build.py` refuses to run while they differ.
- **Notes**: the owner wrote the notes in all four languages; the ask is the run's with a workaround of that day cut from it.
- **Test**: the marked test is invented, because a real test would show a real pupil's work (`test_sheet.py`); all four
  languages have the same questions, answers and score. The AI's words spell the site "classyQuiz".
- In the German and French runs the app showed its own interface words in
  English; the run's language keeps them so, the translations translate
  them.

## Rebuilding

From anywhere, in this order:

1. If the marked test changed: `py -I docs/example/test_sheet.py`.
2. The translated quizzes: `py -I docs/example/space_zips.py`,
   `quiz_zips.py`, `notes_zips.py`, `test_zips.py`.
3. The table of files: `py -I docs/example/faces.py --files-only`.
4. The site: `cd src && npm run build`.
5. The faces on the root page: `py -I docs/example/faces.py`, shot from the
   built site.
6. The conversations, overviews and PDF pages: `py -I docs/example/build.py`
   (`--convo sheets|idea|notes|test`, `--lang de`, `--theme dark`, `--keep`).
7. The film, if the Idea example changed (`src/DEVELOPING.md`, "The landing
   film").

What these write under `src/public/` is generated. They need Python with
Pillow, playwright and PyMuPDF, and the installed Edge; `space_zips.py` also
DejaVu Sans Bold. The pictures use the machine's fonts (Segoe UI, Cambria,
Consolas, Ink Free, Segoe Script on Windows), so another machine breaks
lines slightly differently.

## Not known

- No biology teacher has read the invented test.
- Which model and plan made the Idea run; which plan Notes and Test.
- The Idea overviews predate a change to `preview.py` that arranges picture
  answers by their shape: drawn again, question 2's four planets would stand
  two by two where the German picture has a row. Whether to redraw them,
  the German one too, is the owner's decision.
- The chat's light colours come from a light screenshot of the same app, the
  dark ones are estimated from it; neither is checked exactly.
