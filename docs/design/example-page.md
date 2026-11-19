# The example pages (`/example`)

## Purpose

Someone who has not made a quiz yet wants to see how one comes about before
trying it. The root page shows an example's ask and its file. This page
shows what stands behind them, and hands over everything needed to repeat
the example with one's own AI: what was attached, the conversation, the
quiz, and a way to play it (backlog v4 item 10).

The page explains and sets expectations. It is not a faithful record of a
run (the owner). Where a run met a bug that the site has since fixed, the
example shows the site as it is.

## Situation

- A visitor arrives from "The whole example ›" beside an example's file on
  the root page (`root-page.md`, "Getting a quiz"). There is one page per
  example: `/example` for Sheets, `?ex=idea`, `?ex=notes`, `?ex=test` for
  the others.
- An AI that was told the site's name may follow that link too. If it read
  a conversation between a person and an AI as page text, it could take
  that conversation for instructions.
- Opening a room costs the shared free site one booking and the quiz's
  bytes (`hosting-and-limits.md`). Looking at a quiz, or playing it alone,
  costs nothing.

## Decisions

- **The conversation is a picture, not text**, so an AI reading the page
  does not read it. The picture is drawn like the AI app's own chat, in the
  page's language and in the device's light or dark mode. The preview shows
  its top; a link opens the whole picture.
- **The steps carry almost no description.** Each step shows the thing
  itself: the attachment, the conversation, the overview, the file, the
  button. A sentence that retold what the reader sees below it was removed.
  Four pieces of text remain because the page cannot show them otherwise:
  - which AI made the example and when, as a caption on the conversation;
  - on the Test page, that the marked test was written for the example, so
    that no real pupil's work is shown. The owner expects visitors to
    understand that reason;
  - under the start button, that playing alone stays in the browser and
    that playing with others runs on the site like any quiz;
  - on a page whose language is not the run's language, that the page shows
    a translation.
- **An example has the steps its run had.** Idea attached nothing, so it
  has no attachment step. Notes and Test were handed over without an
  overview, so they have none.
- **The overview is drawn by the site's `preview.py`**, the script the
  guidance offers an AI for checking a quiz. So the page shows what a
  visitor's own AI would produce today.
- **"Start this quiz" opens the local check** (`local-check.md`) with the
  example's file, through the same function that reads a dropped file. The
  example therefore cannot behave differently from a visitor's own quiz.
- **The static page is English and shows the Sheets example**, for an AI
  that fetches it. The script puts the page in the visitor's language and
  swaps in the chosen example.
- **Every language shows the same example.** The run's language is the
  original; the others are translations (`docs/example/README.md`).

Where the material comes from and how it is built: `docs/example/README.md`.

## Not known

- The photographs in the space quiz: 19 of its 23 pictures. The AI said
  they are NASA's and in the public domain. No picture carries a source,
  and nothing else records where each comes from. Whether the site may hand
  them on is the owner's decision (backlog, "Open: with the owner").
- Whether a visitor on a phone reads the conversation. The preview is the
  picture scaled to the screen; the whole picture opens at full size.
- Whether the steps are clear without their descriptions. The owner judged
  "The overview" arguable either way: its heading and picture carry it, and
  a description would only answer "what is this" a little earlier.
