# The pictures of the ways to play

Three pictures on the local check, one for each way to play, Quizmaster,
Peers, Solo: each on its way's card, where the way is chosen. Where they
stand and the words beside them are the check's (`docs/design/local-check.md`,
"The check"). This folder is the pictures: this file (what
they are for, what they live with, how they are made) and `build/` (the
script that draws them and the one that renders them for looking at).

## Purpose

A visitor recognises their own case among the ways to play, and a reason
to play it (backlog v6 item 1b). The words name each way; a picture shows the
visitor where they would be playing, with whom, and what their device would
show. It stands where the way is chosen, for any quiz (the owner: "the
images could go to the open page"); the root page says who plays in its
sentence (`docs/design/root-page.md`, "What this is").

## Situation

- What the three differ in is the setting and what a device shows: with a
  quizmaster the question is on the big screen and each player's device
  shows the choices; among friends and alone each device shows the whole
  question (backlog v6 item 1b; `docs/design/class-and-wall.md`, "What each
  screen shows"; `docs/design/solo.md`, "The device screen").
- The owner, on the mockup's drawings (pictograms of people and devices on
  the page's paper): they look more corporate than the film's poster, which
  is relatable. And: scaring off corporate visitors is less of a concern
  than scaring off everybody else by looking too corporate. Plausible
  assumption: what makes the poster relatable is a real room with people in
  it, doing something (the class at the wall, the votes split, the murmur),
  drawn in one hand; so these pictures are drawn in the film's.
- They are drawn for 16:10 at 91 to 216 px wide. The check shows all
  three: on a phone 96 px wide beside each card's name, from 44rem 186
  to 218 px on top of each card (`docs/design/local-check.md`, "The check").
  At a phone's size the mockup's class had devices nobody could see.
- The check speaks the device's language, in the root page's four
  (`docs/design/root-page.md`, "Languages"); it isn't a page AIs are sent to.
- The check follows the device's dark mode; the film's poster is the same
  picture in both. The film draws the check with them (`docs/film/`).
- The site's content-security policy allows pictures from the site's own
  files (`docs/film/README.md`, Situation).

## How it is made

- **One scene per way, a moment in it.** Quizmaster: a class at the big
  screen with the votes split, the teacher with the phone pointing at the
  question's picture, a child's tablet over the shoulder showing the four
  choices only, a "?" and a "!" (the example class, the film's story).
  Peers: three friends on a sofa on an evening, seen from behind it, each
  phone showing the whole question, one laughing; no big screen in the room
  (`docs/design/peers.md`: friends at a table, on a call or on a sofa).
  Solo: someone alone at a desk with their notes, the phone showing the
  whole question with the answer just found right (`docs/design/solo.md`:
  practising or reviewing on one's own).
- **The setting first, the device as large as the setting leaves room
  for.** A visitor recognises their case by where and with whom (the
  Purpose); so at every width the room and its people read first: the
  screen and the class, the sofa at night, the desk. The device is the
  second thing: each picture has one near the viewer, over a shoulder, as
  large as the scene allows, so the difference between a tablet with four
  tiles and a phone with the question, its picture and the choices one
  under the other held on the root page from a 390 px phone's picture
  (about 150 px wide) up, so it holds on the check's desktop cards (186 to
  218 px); at a phone's 96 px it may read only as "a tablet" and "a phone". The film shows the difference in full. In the class, the heads beside the tablet are fair, so its dark
  frame doesn't sink into dark hair; the teacher, who is the visitor in
  this way, is drawn big enough to be seen at a phone's size.
- **The film's hand.** The people are the film's children and teacher,
  drawn the way `docs/film/build/film.js` draws them (seen from behind or
  from the side, a head turned by shifting the hair), with its bubbles; the
  screens show the example's question, its number line and the four
  answers' colours and shapes. The answers' colours and shapes, the hair,
  skin and clothing colours and the screens' paper and ink are read from
  `film.js` when the pictures are drawn, so the pictures follow the film;
  the figures' shapes are copied, and a change to them in the film isn't
  followed.
- **No words in them**: the question and the choices are bars, so one file
  serves all four languages. The accessible name of each, in the device's
  language, is the check's (`client/room-text.ts`, `picQuizmaster`,
  `picPeers`, `picSolo`).
- **SVG files, opaque.** `src/public/landing/way-quizmaster.svg`,
  `way-peers.svg`, `way-solo.svg`, drawn at 640 × 400 (16:10), 6 to 15 KB
  each, sharp at any size and density. Each carries its own room, wall to
  floor, as the poster does, so it stands the same on the light page and the
  dark one.
- They are generated: edit `build/ways.py`, not them, and run
  `py -I docs/ways/build/ways.py` (from anywhere; Python only).
- `py -I docs/ways/build/sheet.py` renders them beside the film's poster at
  a phone's size (390 px wide, 3 device px to the CSS px, and 1 to 1) and a
  desktop's, on the light and the dark ground, and each at its drawn size,
  into `.tmp/ways/` (git-ignored); `--phone` and `--desk` set a picture's
  width. Needs Python with playwright and the installed Edge. Pictures this
  small are judged at 1 to 1: the 3× rendering makes them look clearer than
  a phone shows them.

## Not known

- Whether a visitor recognises their own case from them; nobody outside the
  project has seen them. Whether, at 96 px on a phone's card, they still say
  more than the way's name beside them.
- Whether, on a phone, a phone with the whole question reads as different
  from a tablet with the choices only, or only as "a device"; and whether
  that matters to a visitor choosing among the three.
- Whether the friends read as adults: they are the film's children's
  figures, with wider shoulders.
