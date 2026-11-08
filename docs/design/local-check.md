# The local check (`/open`)

## Purpose

A quiz file opens into the site without costing the shared site a class
(backlog v5 item 1). Every upload books one of the day's quizzes and the
quiz's bytes, which are the classes' (Constraints; `hosting-and-limits.md`),
yet many who open a file only want to look at it, or to play it alone. So the
`.zip` is read and checked in the browser, and only opening a room uploads
it (the owner's ruling). The worked example's "Start the example quiz" lands
here too, so a visitor who only looks costs nothing (v4 item 13).

On that check the person picks how the quiz will be played: the entries
**Solo**, **Peers** and **Quizmaster**, the owner's names (v5). And whoever
will play must not have to see the questions to get to playing (v5 item 5,
the check's side): the one running a Quizmaster quiz checks the keys here, a
Solo learner mustn't be shown them.

## Situation

- The browser already read the zip and redrew its pictures before uploading
  (`client/unzip.ts`, `client/images.ts`); the parser is one module that runs
  in the browser and on the server (`quiz/format.ts`), and so are the picture
  matching (`server/images.ts`, `matchImages`) and the fixes
  (`server/game.ts`). So everything the lobby's check showed can be built
  before an upload.
- The server parses and checks the quiz again at upload and stays the
  authority: the browser isn't trusted.
- Plausible assumption (the owner's): a newcomer's first use is Solo or a
  look at the example quiz, so frictionless there beats options.
- Nothing kept beyond its use (Constraints): the teacher's file on disk is
  the durable copy; a shared school laptop should keep nothing of a quiz once
  the page is closed (`pictures.md`, "Stored and served").
- The site's own screens are English; the root page's top block, Run's
  messages with it, is in the visitor's language (`root-page.md`,
  "Languages").
- Pages allow pictures only from the site and as `blob:` URLs, scripts only
  from the site's files (`hosting-and-limits.md`, Content-Security-Policy).
- Only what is built is offered: the site never promises what isn't (v5).
  Quizmaster is built: the classroom's lobby. Solo and Peers are to come.

## How the site meets it

### Reading on the root page

The Run box reads the `.zip` as before, then checks it here instead of
uploading it (`client/home.ts`; `readQuiz` in `client/opening.ts`): the text
first (the parser's errors, with "Copy the message for your AI"), then the
pictures the quiz names (with "Continue without these pictures"), then the
server's picture checks. The problems stay on the root page, in its language,
where they were. A quiz that passes goes to the check.

### From the root page to the check

A page can't hand a file to the next one. The quiz read (its text, its
pictures redrawn, whether some were left out) goes through the browser's
IndexedDB for the moment of the page change (`client/handoff.ts`): the root
page stores it under a random key and opens `/open#<key>`; the check takes
it out and deletes it on arrival, with any record older than a minute that
never reached its page (a tab closed in between). From then on the quiz
lives only in the page's memory. A reload of the check therefore finds
nothing and says so ("No quiz open here", the way back to the start page):
nothing is kept. A browser that keeps no site data can't pass the quiz on;
the root page says so in its language.

The worked example needs no handoff: "Start the example quiz" opens
`/open?example=<lang>`, which fetches the static `.zip` and reads it through
the same `readQuiz` as a teacher's file, so it can't run differently; a
reload reads it again. `/?example=<lang>`, an earlier link, forwards there.
The example's start isn't an upload attempt, and isn't counted as one
(`root-page.md`, "Upload attempts counted by format").

### The check

`src/public/open.html`, `client/open.ts`; screens and words:
`user-flow.md §3.1`, "The local check". The page checks the files as the
server will (`openQuiz`: the same parse and picture matching, the pictures
left out taken off the quiz with a warning each) and shows:

- **The title and the count**, what tells two versions of a quiz apart.
- **The entries**, each a card with its name, one sentence on who it is for
  and how it plays, its own button, and an optional quiet line (what
  starting it costs). One button per entry: picking and starting is one
  press, which is the frictionless way for the newcomer's Solo. The first
  card's button is the primary one, so the order of the entries is a
  decision (`client/entries.ts`). "How will it be played?" heads them once
  there are two or more.
- **The questions folded away**, under "The questions and their solutions"
  (with how many notes the site has, the parser's and the pictures'
  warnings, which quote the quiz). Closed, the list isn't in the page at all.
  Once an offered entry plays the quiz itself (`plays`), the fold says
  beside its name that whoever will play leaves it closed. Opened, it is the
  lobby's list (`client/manage.ts`): thumbnails, answers folded, "Show the
  solutions", and per question "Change the solution" with Don't count this
  question, Skip it and Hide the picture. The fixes go through the game's own
  rules (`server/game.ts`), so what the check accepts the lobby would.

### Opening a room

Opening a room is the upload (`openRoom` in `client/opening.ts`), with the
check's fixes (`fixes`, beside `text` and `leaveOut`, JSON or multipart).
The server parses the text again and applies the fixes to the new quiz
through the same rules as a teacher's fix (`G.applyFixes`); a fix that
doesn't fit its question is left as the quiz has it. The device's own
bookkeeping moves with it: the previous unstarted quiz ends
(`hosting-and-limits.md`, "Running classes finish"), the quiz is remembered
for the resume card and the day for the own-copy line. Refusals (the day's
caps, the allowance, no connection) show under the entry's button in
English, the root page's words.

### The entries

What an entry is given (`client/entries.ts`, `Entry`): its words, whether
whoever starts it plays (`plays`), and `start(quiz, ctx)`. The quiz
(`OpenedQuiz`, `client/opening.ts`) is the files as they go up, the quiz as
it will run (questions and answers in the text's order: shuffling happens
per run), the warnings, the check's fixes, kept current while the check is
open, and each picture as a blob URL on the page with its size. The context
lets an entry say something under its button, take over the page's main
element to play there, and give the check back as it was.

- **Quizmaster** (`client/entry-quizmaster.ts`): "Open the lobby ▶" opens a
  room, and this tab becomes the Projector on the lobby's check
  (`teacher-devices.md`), which repeats the questions with the fixes and
  adds what the lobby needs (the teacher code, Let the class in). The check
  is replaced in the tab's history, not followed: Back from the lobby passes
  it, where the same button would put up a second quiz.

## Not known

- Whether teachers miss the question list open on the check: it is folded
  for every entry; the lobby's check lists it open.
- Whether the lobby's check, repeating the questions after the local check,
  costs a Quizmaster more than it gives; Quizmaster's own screens are v5
  item 4's.
- Whether "Open the lobby" is the word a pub host or a teacher reaches for.
- The Run box still says "Upload the quiz your AI made"; the file goes up
  only when a room opens. Its words are also the film's (`docs/film/`), which shows
  the lobby's check straight after the upload.
- Whether school browsers that block site data (IndexedDB) exist in the
  target schools; such a browser can't reach the check.
- Pull-to-refresh on a phone reloads the check, which then holds nothing.
