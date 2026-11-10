# Peers

## Purpose

Friends play a quiz together with nobody running it, so that everyone
plays, including whoever asked the AI for it (backlog v5 item 3). In a room
someone steers, a hand presses Play and the Solution, and that hand's
screens list the questions with their solutions; so a Peers room runs on
its own (v5 item 7, Peers' side), and whoever opened it is a player like
the others.

There is no wall at a table or on a call, so each device shows what a
wall would: the question itself, the spread, the winners, the ranking, and
on the device of whoever opened the room, the code for the others (v5 item
6, Peers' room).

## Situation

- Friends at a table, on a call or on a sofa, each with a phone, a tablet
  or a laptop. The question on the player's own device is Solo's
  (`solo.md`, "The device screen"), and the room is a class's: the code,
  joining, the avatars and their dressing, the game's rules for answers,
  fixes and scores (`server/game.ts`, `class-and-wall.md`, `question-flow.md`).
- Plausible assumption: a few friends wait for each other. The advance rests on it: everyone
  ready needs no cadence design, where a clock would (backlog Later, "Runs
  by itself").
- Phones sleep, batteries die, a tab gets closed (Constraints, "Survives
  school Wi-Fi"; `connections.md`): a room that waits for everyone must not
  wait for a device that is gone, and must not run through its questions
  when every phone is asleep.
- Someone still has to start the quiz, end it early, fix a wrong solution
  (AI-made solutions are wrong now and then: `question-flow.md`, "Fixing a
  question during the run") and remove an avatar nobody plays.
- Nothing identified (Constraints): the avatars are the room's, as in a
  class.
- The free plan's day is the classes' (backlog, Constraints): a Peers room
  costs no more than a class does (`hosting-and-limits.md`, "What a Peers
  room costs"). Every write is rows of the day ("Running classes finish"
  there), and every poll and picture fetched is requests.

## How the site meets it

Code: `client/entry-peers.ts` (the
check's card), `client/peers.ts` (the player page's Peers screens, handed
every view of a Peers room by `client/play.ts`), `client/device.ts` (the
question), the game's rules in `server/game.ts` (`peersStep`, `goOn`,
`setReady`, `waitingFor`), the room in `server/instance.ts`.

### Opening the room

On the local check, the card after Solo (`local-check.md`, "The entries"):
"With friends, each on their own device. Nobody runs it: the quiz moves on
once everyone has answered." [Play together ▶]. It
plays the quiz itself (`plays`), so the fold of questions says to leave it
closed. Its press is the upload with the mode `peers`; the room's first
player is made at upload, and this tab comes in as that player on
`/play#<code>`, its player token written before the page changes, as a
reloaded device keeps it. The check is replaced in the tab's history, as
Quizmaster's is.

There is no Projector, no Remote and no teacher code: the teacher code is
refused (`teacherCheck`, "The last two digits don't match this quiz."), and the
start page's resume card brings the device that opened it back as its
player. The others join at once, so the room is booked at upload as a
steered room's class is when it is let in (`atLetIn`, `server/rows.ts`;
`hosting-and-limits.md`, "Running classes finish"); a day without room
refuses under the card's button.

### The lobby

Every device: the title, who is in (the avatars, away ones faded), the
dressing menu as in a class's lobby. On the device that opened it, the code
for the others first (the address, the code, a QR code for `/play#<code>`),
then Start, above the dressing so a phone shows it without scrolling. The
others see whose Start it is: that avatar, "starts the quiz once everyone
is in."

### The pictures

There is no wall, so every device shows the question's picture and its
background besides the answer pictures, and every device fetching every
picture one by one would cost the day dozens of requests per device. So
the lobby fetches them in a few packs, one request each, as a class's
tablets get their answer pictures: the answer pictures' small copies
(640 px, as on a tablet), then bundles of the questions' pictures and
backgrounds, whole (a laptop or a tablet shows them large). How:
`pictures.md`, "Stored and served" and "Loading".

### Nobody steers

A question, then its solution, then the next, each step taken when
everyone present is done with the one before (`peersStep`):

1. **The question with its choices.** Nobody reads it aloud first, so
   there is no reading step (Solo shows its choices at once for the same
   reason).
2. **The solution**, once everyone present has answered: the key, the
   spread and the winners jumping on each device, the chosen tile marked.
   There is no lock-in before it: the spread without the key is the
   teaching moment a teacher leads, and nobody leads one here.
3. **The ranking**, each device's own step: the foot's "Ranking ▶", then
   places 1 to 3 as on the wall's ranking (at most ten avatars, ties
   sharing a place) and the player's own place. The room doesn't wait for
   anyone to look at it.
4. **The next question** (or the final ranking after the last), once
   everyone present has tapped on from the ranking ("Question 5 ▶",
   "Final ranking ▶").

"Present" is the class's: a device heard from in the last 45 s
(`FRESH_MS`, `connections.md`). So a phone that sleeps, or whose battery
dies with its socket open, stops holding the room 45 s after its last
sign; a tab that closes its line stops holding it at once. Presence
changes with time, so the instance's alarm looks again when the first
device the room waits for would turn away (`peersRecheck`), and steps on
if that leaves everyone present done. Nobody done holds the room whoever
is there, so a room whose phones all slept doesn't run through its
questions. A device that comes back is waited for again, with its avatar
and score; a new device picks an away avatar back as in a class
(`class-and-wall.md`, "Coming back").

A device that is done shows who the room waits for at its foot, as
avatars, the first six and "+n" beyond: among friends, that is what gets a
room moving. It is the Remote's "Waiting for" (`question-flow.md`, "Who
has answered") on every device. A device on the long-poll fallback gets
it, and who is in and who is away, with its next poll, up to 25 s late:
answering its poll for every friend's answer would cost a room of 25
some 10,000 requests, three polling classes' worth (`hosting-and-limits.md`,
"What a Peers room costs"). The room's steps and the device's own changes reach it at once.

The answers follow the class's rules (`question-flow.md`, "When a tap
counts"): a change of mind until the solution shows, a tap on its way
outlined dashed until held, the last tap held the one that counts.
Points for speed are not offered.

A step of the room is its use, as a teacher's step is: the quiz goes 3 h
after the last (`hosting-and-limits.md`, "What lives, and for how long").

### The ⋯ of whoever opened it

On their device's top bar, during the quiz:

- **Solution now, without waiting** (during a question), **Question 5 now,
  without waiting** or **Final ranking now, without waiting** (after the
  solution): for a friend who left a phone awake on the table.
- **Change the solution**, at the solution, until the opener taps on from
  it: the open question's choices in the steering screens' sheet ("Tap
  every right choice.", Don't count this question, Done); the points, the
  spread's marks and the winners follow. The room waits for the opener
  until they tap on, so it doesn't move while the sheet is open, and a key
  under the sheet doesn't tap on; once they have, the room may move at any
  moment, so the menu no longer offers it. The solutions are seen only
  once everyone has seen them, so the opener keeps playing blind.
- **Remove a player…**: the avatars, each to remove; the room stops waiting
  for it. Remove is sticky, as in a class.
- **End the quiz: final ranking.**

At the final ranking, Exit ends the quiz and sends every device to the
start page, also one that was between two polls (the instance keeps in
memory, for the moments after, that a hand ended it: `endedBy`); before
it, the others have ← there. A player's device that hears the quiz is
gone forgets it, so the opener's start page doesn't ask after it. Should
the opener's device die, its avatar can be picked back on another device,
and the ⋯ comes with it.

The others' refusals don't say "Ask whoever runs it": "This quiz is full: it
takes no more players." and "This quiz has started and takes no more
players." The door is the class's (`class-and-wall.md`, "The door").

## Not known

- Whether friends wait for each other, the plausible assumption the advance
  rests on; whether "Waiting for" with avatars helps a room along or reads
  as pressure; whether "without waiting" is found when a phone is left
  awake on a table.
- Whether a ranking after every question suits friends, or they tap
  through it.
- A family at the TV: a Peers room has no wall. A wall that shows without
  steering is v5 item 6's, with the Quizmaster's devices-only room.
- Whether the spread showing with the key, with no lock-in before it,
  suits friends.
- Whether fixing at the solution, until the opener taps on, is enough, or a
  fix at the end is wanted.
- Whether a "Waiting for" up to 25 s old on a polling device misleads a
  room; on WebSockets it is current.
- Whether an answer picture's small copy (640 px) looks soft on a laptop,
  where its tile can be wider.
- Whether points for speed are wanted between friends; everyone ready gives
  each question a shared start, which they assume.
- The words: "Peers" and "Play together" on the check, "Friends join on …
  with the code" on the opener's device.
- The line's dot (bottom right) sits under the device screen's foot bar
  while a question is up; only the offline banner shows a dropped line
  there.
- Checked in headless Edge on a 390 px and a 360 px phone, a 1280 px tablet
  and a 1366 px laptop; not on real phones, and not with a real group.
