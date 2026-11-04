# The worked example (`/example`)

## Purpose

A first-time teacher wants to see how a quiz comes about before trying it:
a walkthrough, the example step by step. The landing's strip shows the path in
five pictures; this page shows the same path with the real material, and hands
over everything needed to repeat it on the teacher's own AI: the sheets, what
was said to the AI, what it handed back, and the quiz itself to run (backlog
v4 item 10).

## Situation

- The page is reached from the landing's strip ("The example, step by step ›",
  `root-page.md`, "The strip"). Teachers read the strip as the example; what
  they look for behind it is a walkthrough, not the result alone.
- An AI told the site's name may follow the strip's link. A teacher's chat with
  an AI, read as page text, could pass for instructions to it.
- The example's material is the sheet derived from the owner's (his own
  photographs can't be published) and a conversation with an AI. The owner
  makes the real conversation on another machine and account, using this page's
  downloads as the teacher's material; until then both the photographs and the
  conversation stand in.
- An upload costs the shared free site one booking and the quiz's bytes
  (`hosting-and-limits.md`).

## How the site meets it

`src/public/example.html`, static and in English; the four steps follow the
strip.

1. **The exercise sheets**: the two photographs, each as a download, and the
   sheets as a PDF, so a teacher can try the photographs or the clean file on
   their own AI.
2. **The conversation**, as a picture, not text: an AI reading the page doesn't
   read it, and the layout is the AI app's own (a screenshot of a free Claude
   Sonnet session of 4 Nov 2026, light only). The preview shows its top; the
   link opens the whole picture. The line above it names model, plan and date.
3. **The quiz**: the `.zip` the AI handed over.
4. **Run it**: "Start the example quiz" opens `/?example=en`; the landing fetches
   the static `.zip` and sends it through the same function as a dropped file
   (`home.ts`, `runExample`), so the example can't run differently from a
   teacher's upload. It is a real upload: booked and counted like any, and the
   teacher lands on the check screen.

The files are in `src/public/examples/` (not `example/`, which would collide
with the page's address). The stand-in photographs were made by
`.tmp/example/conversation/fake_photos.py` (owner's machine, not in the repo).

## Not known

- The photographs are made from the rendered sheet; the owner's own can't be
  published. The conversation and the `.zip` ("Big numbers on the number line",
  13 questions) are one real run, reviewed by the owner; the zip is that run's
  second turn. The owner may still replace them with a run of his own.
- Whether a teacher on a phone reads the conversation: the preview is the
  picture scaled to the screen; the whole picture opens at full size.
- The page in the landing's other three languages (backlog).
