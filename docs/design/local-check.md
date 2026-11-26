# The local check (`/open`)

## Purpose

A quiz file opens into the site, and plays alone, without costing the
shared site a room; only opening one uploads it (what the site gets before
that: `root-page.md`, "Upload attempts by format"). A visitor who only
looks at an example costs nothing.

On the check the person picks how the quiz will be played (Solo, Peers,
Quizmaster), and sees the setting of each where it is chosen. Whoever will
play must not have to see the questions to get to playing.

For a newcomer's first use, frictionless beats powerful but confusing
options.

## Situation

- The parser, the picture matching and the fixes are the server's modules,
  run in the browser too, so what the check accepts the upload would. The
  server parses and checks again at upload: the browser isn't trusted.
- A page can't hand a file to the next one, so the quiz goes from the root
  page to the check through IndexedDB and lives in the page's memory after
  that. A reload of the check, a phone's pull to refresh included, finds
  nothing. A shared school laptop keeps nothing once the page is closed
  (backlog, Constraints), except on one failure path: a handover whose page
  never came stays in the browser's site data until the site is next opened
  there.
- The check speaks the device's language; the quiz's own problems and
  warnings stay English, since the AI reads them.
- Plausible assumption: a newcomer's first use is Solo or a
  look at the example quiz.

## Not known

- Whether the pictures help a teacher find Quizmaster's card,
  which on a phone stands last and below the first screen, or slow them.
- Whether a teacher who will run the quiz opens the folded questions here
  anyway, and then sees them again on the lobby's check.
- Whether "Open the lobby" is the word a pub host or a teacher reaches for.
- Whether school browsers that block site data (IndexedDB) exist in the
  target schools; such a browser can't reach the check.
