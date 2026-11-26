# The pictures of the ways to play

One picture for each way to play (Quizmaster, Peers, Solo), on its card on
the local check, where the way is chosen (`docs/design/local-check.md`).

## Purpose

A visitor recognises their own case among the ways to play, and a reason to
play it: the words name each way, the picture shows
where they would be playing, with whom, and what their device would show
(with a quizmaster the question is on the big screen and each device shows
the choices; among friends and alone each device shows the whole question).

## Situation

- Pictograms of people and devices look more corporate than the film's
  poster, which is relatable. Scaring off corporate visitors is less of a
  concern than scaring off everybody else by looking too corporate.
  Plausible assumption: what makes the poster relatable is a real room
  with people in it, doing something, drawn in one hand; so these are drawn
  in the film's hand, with its people.
- They are drawn for 16:10 at 91 to 216 px wide; the check shows them 96 px
  wide on a phone and 186 to 218 px from 44rem up.
- They carry no words, so one file serves the check's four languages; their
  accessible names are `picQuizmaster`, `picPeers`, `picSolo` in
  `src/client/room-text.ts`.
- Each carries its own room, wall to floor, so it stands the same on the
  light page and the dark one.
- `build/ways.py` reads the answers' colours and shapes, the hair, skin and
  clothing colours and the screens' paper and ink from
  `docs/film/build/film.js`; the figures' shapes are copied, and a change to
  them in the film isn't followed.

## Building

`py -I docs/ways/build/ways.py` (Python only) writes
`src/public/landing/way-quizmaster.svg`, `way-peers.svg`, `way-solo.svg`;
they are generated.

`py -I docs/ways/build/sheet.py` renders them beside the film's poster at a
phone's and a desktop's size, light and dark, into `.tmp/ways/` (`--phone`
and `--desk` set the width; needs playwright and the installed Edge).
Pictures this small are judged at 1 to 1: the 3× rendering makes them look
clearer than a phone shows them.

## Not known

- Whether a visitor recognises their own case from them; nobody outside the
  project has seen them. Whether at 96 px they say more than the way's name
  beside them, and whether a phone with the whole question reads as
  different from a tablet with the choices only.
- Whether the friends read as adults: they are the film's children's
  figures, with wider shoulders.
