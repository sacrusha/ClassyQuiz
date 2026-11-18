# Peers

## Purpose

Friends play a quiz together with nobody running it, so that everyone
plays, including whoever asked the AI for it (backlog v5 item 3). In a room
someone steers, a hand presses Play and the Solution, and that hand's
screens list the questions with their solutions; so a Peers room runs on
its own (v5 item 7, Peers' side), and whoever opened it plays blind like
the others. What the room does should surprise the players least (the
owner).

There is no wall at a table or on a call, so each device shows what a
wall would: the question itself, the spread, the winners, how the friends
stand, and on the device of whoever opened the room, the invitation for
the others (v5 item 6, Peers' room).

## Situation

- Friends at a table, on a call or on a sofa, each with a phone, a tablet
  or a laptop. The question on the player's own device is Solo's
  (`solo.md`, "The device screen"), and the room is a class's: the code,
  joining, the avatars and their dressing, the game's rules for answers,
  fixes and scores (`server/game.ts`, `class-and-wall.md`, `question-flow.md`).
- Plausible assumption: a few friends wait for each other. The advance rests on it: everyone
  ready needs no cadence design, where a clock would (backlog Later, "Runs
  by itself").
- The owner's user test found the flow inadequate. Which of the following
  it showed is not recorded; they are the reading the flow rests on.
- A room that waits for everyone is held by one: a phone left awake on a
  table holds it for good; a player who is slow, or not looking, holds it
  as long. Small children play too, and being the consistently slow one
  must not get worse through the site's doing (the owner): the site doesn't
  move on, or stop waiting, by a decision of its own.
- A ranking after every question carries little among friends: with no
  points for speed the top is mostly ties, the player's own score is in
  the bar already, and the winners jump at the solution.
- Phones sleep, batteries die, a tab gets closed (Constraints, "Survives
  school Wi-Fi"; `connections.md`): a room that waits for everyone must not
  wait for a device that is gone, and must not run through its questions
  when every phone is asleep.
- Someone still has to start the quiz, end it early, fix a wrong solution
  (AI-made solutions are wrong now and then: `question-flow.md`, "Fixing a
  question during the run") and remove an avatar nobody plays. One person
  learning those controls is easier than everyone learning them, and
  plausibly whoever opens the room has been on the site before (the owner).
- The devices are personal: none needs to be sent anywhere at the end, and
  each leaves when its player likes.
- On a call nobody can scan a QR code from another screen.
- Nothing identified, nothing kept beyond its use (Constraints): the
  avatars are the room's, as in a class, and the room goes once it has
  served.
- The free plan's day is the classes' (backlog, Constraints): a Peers room
  costs no more than a class does (`hosting-and-limits.md`, "What a Peers
  room costs"). Every write is rows of the day ("Running classes finish"
  there), and every poll and picture fetched is requests.

## How the site meets it

Code: `client/entry-peers.ts` (the
check's card), `client/peers.ts` (the player page's Peers screens, handed
every view of a Peers room by `client/play.ts`), `client/device.ts` (the
question), the game's rules in `server/game.ts` (`peersStep`,
`startCountdown`, `setReady`, `waitingFor`), the room in `server/instance.ts`.

### Opening the room

On the local check, the card after Solo (`local-check.md`, "The entries"):
"With friends, each on their own device. Nobody runs it: the quiz moves on
once everyone has answered." [Play together ▶], and under it when the room
goes (The end). It
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
dressing menu as in a class's lobby. On the device that opened it, the
invitation first: the address, the code, a QR code for `/play#<code>`, and
that address as a link to send, for a call: "Share the link" hands it to a
phone's or a tablet's share sheet (a coarse pointer and `navigator.share`),
"Copy the link" puts it on a laptop's clipboard, where it goes into the
call's chat; with no clipboard the link shows selected, to copy by hand.
Then Start, above the dressing so a phone shows it without scrolling. The
others see whose Start it is: that avatar, "starts the quiz once everyone
is in." Start's press gives the dressing ten seconds more, its bar draining
along the top edge of every device, and that line then says "starts the
quiz in a moment." (`class-and-wall.md`, "The end of the dressing").

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
everyone present is done with the one before (`peersStep`), or when a
friend's Countdown runs out (below):

1. **The question with its choices.** Nobody reads it aloud first, so
   there is no reading step (Solo shows its choices at once for the same
   reason). Done is answered.
2. **The solution**, once everyone present has answered: the key, the
   spread and the winners jumping on each device, the chosen tile marked,
   and in the top bar how the friends stand (below). There is no lock-in
   before it: the spread without the key is the teaching moment a teacher
   leads, and nobody leads one here. Done is one tap on the foot's button,
   which names what comes: "Question 5 ▶", or "Final ranking ▶" after the
   last.
3. **The next question** (or the final ranking after the last), once
   everyone present is done with the solution. There is no ranking step
   between: the solution has shown it.

**How the friends stand**, at the solution, in the top bar where the
player's own avatar and score are during the question: each score from
the highest, with the avatars that have it, so a tie reads as one group;
the player's own avatar ringed. A tie's avatars overlap a little. Where it
doesn't fit (a phone, many friends: beside the verdict on a 360 px phone,
seven avatars of one score, or three across two scores, less beside the
opener's ⋯), avatars give way from the lowest score up, never the
player's own, each score saying "+n" for its own; scores keep their place
while that is enough, then the lowest go but the player's, with "…"
(`fitStanding`). The stage keeps all its room, so nothing moves under the
solution.

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
has answered") on every device that is done; the device of whoever is
waited for doesn't show it. A device on the long-poll fallback gets
it, and who is in and who is away, with its next poll, up to 25 s late:
answering its poll for every friend's answer would cost a room of 25
some 10,000 requests, three polling classes' worth (`hosting-and-limits.md`,
"What a Peers room costs"). The room's steps, a Countdown and the device's
own changes reach it at once.

The answers follow the class's rules (`question-flow.md`, "When a tap
counts"): a change of mind until the solution shows, a tap on its way
outlined dashed until held, the last tap held the one that counts.
Points for speed are not offered.

A step of the room is its use, as a teacher's step is: the quiz goes 3 h
after the last (`hosting-and-limits.md`, "What lives, and for how long").

### Countdown

Any player done with the step can start Quizmaster's Countdown
(`question-flow.md`, "The steering bar") for those the room still waits
for: on the question, `LAST_CALL_MS` (15 s) later the solution shows
whoever hasn't answered; on the solution, the next question comes whoever
hasn't tapped on (`startCountdown`, `countdownOut`; the instance's alarm
takes the step). Every device shows it running: the bar draining along
the top edge, as on the wall, and the Countdown button greyed with the
avatar of whoever started it in place of the timer. The room's waiting
stays the friends' to end: the one waited for gets a warning, the one who
presses is seen pressing, and a group regulates itself; the site starts
none on its own.

- It is offered on a device that is done, while someone present is waited
  for: on the question once the answer is held (not while it is on its
  way), on the solution once tapped on. The small line under it says what
  its end does: "15 s, then closes" on the question, as on the steering
  bar, and "15 s, then goes on" on the solution.
- Once per step: while one runs, it is greyed on every device. The room
  steps on sooner if everyone present is done before its end, and the
  Countdown goes with the step.
- It stands left of the foot's button, in its own place: after a tap on
  "Question 5 ▶" that button goes invisible, keeping its place, and
  Countdown appears beside it, so a second tap where the first landed
  presses nothing. A press within `DOUBLE_MS` of the foot's button, or
  within `SETTLE_MS` of Countdown appearing, does nothing either
  (`question-flow.md`, "Presses"). No key starts it.
- A tap made on the question while it still showed open counts, as in a
  class, if it arrives before the room leaves the solution.

### The ⋯ of whoever opened it

On their device's top bar, during the quiz:

- **Change the solution**, at the solution, until the opener taps on from
  it: the open question's choices in the steering screens' sheet ("Tap
  every right choice.", Don't count this question, Done); the points, the
  spread's marks, the winners and the standing follow. The room waits for
  the opener until they tap on, so only a friend's Countdown moves it while
  the sheet is open; then the sheet closes with the room, the changes made
  so far kept. A key under the sheet doesn't tap on; once they have tapped
  on, the room may move at any moment, so the menu no longer offers it.
  The solutions are seen only once everyone has seen them, so the opener
  keeps playing blind.
- **Remove a player…**: the avatars, each to remove; the room stops waiting
  for it. Remove is sticky, as in a class. It is the way out for a phone
  left awake on a table, which a Countdown only gets past one step at a
  time.
- **End the quiz: final ranking.**

The opener has no way on of their own: Countdown is everyone's. Should the
opener's device die, its avatar can be picked back on another device, and
the ⋯ comes with it.

The others' refusals don't say "Ask whoever runs it": "This quiz is full: it
takes no more players." and "This quiz has started and takes no more
players." The door is the class's (`class-and-wall.md`, "The door").

### The end

The final ranking on every device: the podium as on the wall, cheering,
the player's own place and score, and ←, to the start page. Nobody ends
the room for the others: each device leaves when its player likes. The
opener's ← also forgets the room on that device, so its start page doesn't
offer it back.

The room ends by itself once nobody has been at its final ranking for
`PEERS_EMPTY_MS` (10 minutes, `server/instance.ts`): after the last device
was heard from or closed its line, or after the final ranking came,
whichever is later. Nothing else tells a device that left from one that
slept: a phone pocketed while the friends talk is away after 45 s, its
socket open or not. Plausible assumption: friends who want the podium
again look while still together, within minutes. Until then the room is
there for them; after it, whatever the instance held goes
(`hosting-and-limits.md`, "What lives, and for how long"), which the
3 hours after the last step would otherwise keep, nobody using it. What it
costs is an alarm now and then while a device stays on the podium (a row
each), and a device that comes back after it finds the quiz ended. What
the instance has heard is in its memory only; a memory the alarm woke has
heard nobody since it started, which holds because a device polling keeps
the object awake.

## Not known

- Whether friends wait for each other, the plausible assumption the advance
  rests on; whether "Waiting for" with avatars helps a room along or reads
  as pressure.
- Whether Countdown is found, by children too, and whether whose it is
  reads as a group regulating itself or as one player hurrying another;
  whether 15 s suits a solution as it suits a question. An accidental
  Countdown can't be cancelled, as on the steering bar, and here it shows
  the avatar of whoever pressed.
- Whether a standing in the top bar is seen at all, beside the winners
  jumping; whether a group of more than three on a 360 px phone wants
  more than "+n".
- Whether a Countdown moving the room under the opener's open sheet (Change
  the solution) happens, and whether a fix at the end is wanted.
- Whether ten minutes is the right wait before an empty room ends.
- A family at the TV: a Peers room has no wall. A wall that shows without
  steering is v5 item 6's, with the Quizmaster's devices-only room.
- Whether the spread showing with the key, with no lock-in before it,
  suits friends.
- Whether a "Waiting for" up to 25 s old on a polling device misleads a
  room; on WebSockets it is current.
- Whether an answer picture's small copy (640 px) looks soft on a laptop,
  where its tile can be wider.
- Whether points for speed are wanted between friends; everyone ready gives
  each question a shared start, which they assume.
- The words: "Peers" and "Play together" on the check, "Friends join on …
  with the code" on the opener's device, "15 s, then goes on" under
  Countdown on the solution.
- The line's dot (bottom right) sits under the device screen's foot bar
  while a question is up; only the offline banner shows a dropped line
  there.
- Checked in headless Edge on 360 px and 390 px phones (up to seven
  friends) and a 1366 px laptop; the share sheet only as far as the page
  calls it. Not on real phones, and not with a real group.
