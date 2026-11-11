# The local check (`/open`)

## Purpose

A quiz file opens into the site without costing the shared site a class
(backlog v5 item 1). The `.zip` is read and checked in the browser, and
only opening a room uploads it (the owner's ruling). The worked example's "Start the example quiz" and
the root page's "Play this quiz ↓", under each of its examples, land here too, so a visitor who only
looks costs nothing (v5 item 1).

On that check the person picks how the quiz will be played: the entries
**Solo**, **Peers** and **Quizmaster**, the owner's names (v5), each with the
setting it is played in, seen where it is chosen (the owner: "the images
could go to the open page"; backlog, "The page for people", item 1). And whoever
will play must not have to see the questions to get to playing (v5 item 5,
the check's side): the one running a Quizmaster quiz checks the keys here, a
Solo learner mustn't be shown them.

## Situation

- The browser reads the zip and redraws its pictures (`client/unzip.ts`,
  `client/images.ts`); the parser is one module that runs in the browser and
  on the server (`quiz/format.ts`), and so are the picture matching
  (`server/images.ts`, `matchImages`) and the fixes (`server/game.ts`).
- The server parses and checks the quiz again at upload and stays the
  authority: the browser isn't trusted.
- Plausible assumption (the owner's): a newcomer's first use is Solo or a
  look at the example quiz, so frictionless there beats options.
- Nothing kept beyond its use (Constraints): the teacher's file on disk is
  the durable copy; a shared school laptop should keep nothing of a quiz once
  the page is closed (`pictures.md`, "Stored and served").
- The check speaks the device's language, the one the root page speaks on
  it (`root-page.md`, "Languages"); the quiz's own problems and warnings
  stay English, since the AI reads them.
- Pages allow pictures only from the site and as `blob:` URLs, scripts only
  from the site's files (`hosting-and-limits.md`, Content-Security-Policy).
- Whoever opens a quiz to run it for a class is often in a hurry, before the
  lesson, and may be on the phone that took the photos (backlog, Project);
  the cards stand in an order the owner set (Solo first, below), so on a
  phone Quizmaster's is the last.

## How the site meets it

### Reading on the root page

The box of the second step (under "Open the quiz your AI made", since nothing
goes up there; `root-page.md`, "Two steps") reads the `.zip` (or what else opens: `root-page.md`, "Opening: the `.zip` and nothing else"), then checks it here instead of
uploading it (`client/home.ts`; `readQuiz` in `client/opening.ts`): the text
first (the parser's errors, with "Copy the message for your AI"), then the
pictures the quiz names (with "Continue without these pictures"), then the
server's picture checks. The problems show on the root page; a quiz that
passes goes to the check.

### From the root page to the check

A page can't hand a file to the next one. The quiz read (its text, its
pictures redrawn, whether some were left out) goes through the browser's
IndexedDB for the moment of the page change (`client/handoff.ts`): the root
page stores it under a random key and opens `/open#<key>`; the check takes
it out and deletes it on arrival. From then on the quiz lives only in the
page's memory. A record whose page never came (the tab closed in between,
the navigation lost) stays in the browser's site data until the site next
runs a page that sweeps: the start page, a check, or the next handover each
delete every record older than a minute. Where the browser doesn't list its
databases (`indexedDB.databases`), only the next handover and its check
sweep: elsewhere, opening the database to look would create it. So on a shared school laptop a quiz can outlast its use only on
this failure path, and only until the site is next opened there. A reload of the check therefore finds
nothing and says so ("No quiz open here", the way back to the start page):
nothing is kept. A browser that keeps no site data can't pass the quiz on;
the root page says so in its language.

The examples need no handoff: "Start the example quiz", and the root
page's "Play this quiz ↓", open `/open?example=<lang>&ex=<example>` (the
worked example's, the sheets, without `ex`; an earlier link's `&way=` opens
the example its way's tab had), which fetches the static `.zip` and reads it through
the same `readQuiz` as a teacher's file, so it can't run differently; a
reload reads it again. `/?example=<lang>`, an earlier link, forwards there.
The example's start isn't an upload attempt, and isn't counted as one
(`root-page.md`, "Upload attempts counted by format").

### The check

`src/public/open.html`, `client/open.ts`. The page checks the files as the
server will (`openQuiz`: the same parse and picture matching, the pictures
left out taken off the quiz with a warning each) and shows:

- **The title and the count**, plausibly what tells two versions of a quiz
  apart (`teacher-devices.md`, "The single tab: check, then join").
- **The entries**, each a card with the picture of its way (`docs/ways/`),
  its name, one sentence on who it is for and how it plays, its own button,
  and an optional quiet line (what starting it costs). The picture is where
  the setting is seen beside the choice it belongs to: on the root page one
  picture at a time stood for one way per example, and pulled the example
  that showed it towards that way. One button per entry: picking and starting is one
  press, which is the frictionless way for the newcomer's Solo. The three
  buttons look alike: whoever opens a quiz meaning to run it, a teacher in
  a hurry before the lesson, would otherwise press the one that stands out,
  and Solo plays the quiz in this tab instead of opening the lobby. What
  ranks them is their order, the reading order (`client/entries.ts`). "How
  will it be played?" heads them once there are two or more.
  From 44rem the cards stand side by side, the picture on top (about 190 to
  220 px wide), each button on one line. Narrower they stand one under the
  other, the picture beside the name, then the sentence, the button and the
  quiet line across the card. Weighed on a phone: the picture floated beside
  the text, which wrapped three short lines and then full ones; the picture
  beside the name and the button, which wrapped "Zusammen spielen ▶" at 360
  px. The picture beside the name is 96 px wide, near the smallest it is
  drawn for (91 px), and the cards are set tighter there than the site's
  other cards, for whoever scrolls for their way: at 390 × 664 the first
  screen holds Solo's card and Peers' picture, name and sentence, and
  Quizmaster's button ends at 1061 px (English) to 1114 (German). At 42% of
  the card, the picture the design proposed (137 px there), it ended at
  1199 to 1252 and Peers' sentence was below the edge; without pictures, at
  1018 to 1070. What it costs: the pictures at a phone's size name a
  setting, a class, a sofa, a desk, more than they show it; the cards with
  them still put Quizmaster's button about 400 px below a phone's first
  screen, which no size of picture changes, since the order does it.
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
check's fixes (`fixes`, beside `text` and `leaveOut`, JSON or multipart)
and how the room plays (`mode`; `peers` for a room that runs on its own,
`peers.md`).
The server parses the text again and applies the fixes to the new quiz
through the same rules as a teacher's fix (`G.applyFixes`); a fix that
doesn't fit its question is left as the quiz has it. The device's own
bookkeeping comes with the upload: the previous unstarted quiz ends
(`hosting-and-limits.md`, "Running classes finish"), the quiz is remembered
for the resume card and the day for the own-copy line. Refusals (the day's
caps, the allowance, no connection), and "Sending the quiz…" before them,
show under the entry's button in the root page's words (`client/refusal.ts`),
in the device's language like the rest of the check. They are the root
page's messages, moved here with the upload, and they say what to do next
(wait, an own copy, what to tell IT); the quiz's own problems stay English,
as on the root page.

### The entries

What an entry is given (`client/entries.ts`, `Entry`): its words, whether
whoever starts it plays (`plays`), and `start(quiz, ctx)`. The quiz
(`OpenedQuiz`, `client/opening.ts`) is the files as they go up, the quiz as
it will run (questions and answers in the text's order: shuffling happens
per run), the warnings, the check's fixes, kept current while the check is
open, and each picture as a blob URL on the page with its size. The context
lets an entry say something under its button, take over the page's main
element to play there, and give the check back as it was.

- **Solo** (`client/entry-solo.ts`), first: "Play ▶" plays the quiz in
  this page, nothing uploaded, and Back gives the check back (`solo.md`).
- **Peers** (`client/entry-peers.ts`), second: "Play together ▶" opens a
  room that runs on its own (`mode`: `peers` beside the fixes), and this
  tab comes into it as its first player, on the player page
  (`peers.md`). The check is replaced in the tab's history, as below.
- **Quizmaster** (`client/entry-quizmaster.ts`): "Open the lobby ▶" opens a
  room, and this tab becomes the Projector on the lobby's check
  (`teacher-devices.md`), which lists the questions, their answers folded,
  with the fixes made here: the fold here stays closed for a Quizmaster as
  for anyone, so the lobby's check is where whoever runs the quiz sees the
  questions and catches a wrong key. It adds what the lobby needs (how the
  screens are arranged, the teacher code where a remote is wanted, Let
  everyone in). The check
  is replaced in the tab's history, not followed: Back from the lobby passes
  it, where the same button would put up a second quiz.

## Not known

- Whether the picture beside the name helps a teacher in a hurry find
  Quizmaster's card while scrolling, or slows them; whether, on a phone,
  Quizmaster's card last is the cost the owner meant Solo first to have.

- Whether a teacher who will run the quiz opens the fold here anyway, to
  check before uploading, and then sees the questions twice; the lobby's
  check lists them open (`teacher-devices.md`, "The single tab: check, then
  join").
- Whether "Open the lobby" is the word a pub host or a teacher reaches for.
- Whether school browsers that block site data (IndexedDB) exist in the
  target schools; such a browser can't reach the check.
- Pull-to-refresh on a phone reloads the check, which then holds nothing.
