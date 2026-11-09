# The open period held in memory

## Purpose

The shared site is to carry about 200 classes a day and about 60 at once
on the Free plan (the owner, 2026-11-09; backlog, "Room on the Free
plan"), and the lesson goes on when connections drop, phones sleep or the
instance restarts (backlog Constraints, "Survives school Wi-Fi"). Rows
written ran out first, because every tap was a write. So the input that
changes while a stage is open (the lobby's looks, a question's answers) is
written in batches, and a restart that the devices can recover from loses
nothing they show.

The owner on the losses this moves around: "resets are rare and difficult
to test, the architectural design needs to be simple and reliable." So
there is one owner of the input, the server; one rule for when a late tap
counts, the one that already existed; and no new kind of message.

## Situation

- Every write of the instance stores its meta with what changed: two rows
  (`persist`, `server/instance.ts`). Each `setAlarm()` writes a row too
  (Cloudflare's Durable Objects pricing).
- Answers were about 750 of a class's ~1,300 rows, and the looks most of
  the rest of a let-in booking (`hosting-and-limits.md`, "Running classes
  finish").
- A Durable Object loses its memory when it hibernates (about 10 s without
  events, its WebSockets kept open), at a deploy (which closes its
  sockets), and when the platform restarts or evicts it, without notice.
  There is no hook before it goes. A request in flight, a held long-poll
  among them, keeps it in memory.
- A WebSocket's attachment (`serializeAttachment`) survives hibernation
  while its socket lives. It holds 16,384 bytes and is lost when either
  side closes (Cloudflare's WebSockets API). Writing one writes no rows
  and stores no bytes (measured on a probe Worker, 2026-11-09: 3,000
  writes of 1.9 KB on one socket, and 40 sockets with 1.9 KB each, 0 rows
  written). It survives an eviction by hibernation in the local runtime
  (workerd evicted the instance in each of three quiet 40 s spells of
  `scripts/simulate-memory.mjs`, and the copies came back); on the
  deployed platform that is Cloudflare's word, not measured: the probe's
  objects weren't evicted in 45 s idle.
- A student's socket is replaced several times a lesson: the screen locks,
  a reload, a switch between cellular and Wi-Fi, a deploy. A device on
  long-poll has no socket.
- When a tap counts is the device's view, not the arrival time: a tap made
  on a view that showed answering open counts while its question is on
  screen, until the class leaves its reveal (`question-flow.md`, "When a
  tap counts").
- The caps on changes (`MAX_ANSWER_CHANGES`, `MAX_LOOK_CHANGES`) existed
  only for rows (the owner).

## How the site meets it

### The server holds the open stage

A dress in the lobby, an answer to the question on screen and, in a Peers
room, a tap on from a solution change the game in the instance's memory
(`took`). They are acknowledged and shown at once, and not written. Any
write of the run carries everything held so far: Start writes the looks,
the lock-in (or the reveal, if nothing locked before it) a question's
answers, and the step that leaves the reveal the stragglers' (below). A
join, a Peers room's step and the writes below carry it as well.
`unwritten` names the players whose input storage doesn't have yet.

Storage is a checkpoint and the server's memory the one owner, so an
acknowledgement means "held", where it meant "stored". The Remote and the
Projector hold nothing; the earlier design that made the steering tab the
owner needed a relay, a window, a clock offset and a state without a
holder, and none of that is built.

### Copies the memory is rebuilt from

- **On the socket.** The attachment of each player's newest socket keeps a
  copy of what the server holds of them for the open stage (`G.heldOf`:
  the look, the answer's record, the tap on); a hello or an input on one
  socket takes the copy off the player's other sockets (`mirror`), so the
  copy put back is never an older one. When the object wakes, `load()`
  reads storage and puts the copies back (`G.restoreHeld`): only into the
  stage still open, only where newer (an answer's higher `seq`), and not
  judged again, since it was taken once.
- **On the device.** The device keeps its input as the server last took it
  (`DeviceHeld`: the look its `dress` was acknowledged with, and the answer
  tap the acknowledgement named as the record), in `client/net.ts`, across
  a reload too (sessionStorage; an iPad reloads a tab it put away), and
  sends it with every hello and every poll. The server takes it as the
  commands again, by the rules of a tap, but only for a player whose input
  this memory hasn't taken since it was loaded (`takenHere`): a look has
  no sequence number, and a poll carrying the look before can arrive after
  a newer dress. That is how a restart, which closes every socket, and a
  poller, which has none, get their input back.

### Stragglers: the grace period is the tap rule

The open point on which stragglers the grace period covers is settled by
the rule that already decided when a tap counts. A tap in flight at the
lock-in and the input of a device away at the close that comes back are
the same case: a tap made on a view older than the one that closed
answering. It counts while the question is on screen, until the class
leaves its reveal, and is written with that step at the latest; the wall's
spread grows by one meanwhile, as it always has for a late tap. No timer.
For the looks the stage ends at Start.

### A line that ends writes what it held

The other open point, the tap of a device away at the close and not back
in time: it is written when its line ends, within bounds. When a player's
socket closes, or their held poll runs out, while the server holds their
input unwritten and no other socket of theirs keeps a copy, the run is
written (`lineEnded`): one write for every line that ends within
`LINE_WRITE_MS` (1 s), at most `MAX_LINE_WRITES` (10) in a stage for the
whole class (`Run.lineWrites`, stored with the run); past those the input
waits for the stage's own write.

Why not accept it as lost: hibernation is routine in a lesson (ten quiet
seconds while the class reads), and a phone that locks closes its socket,
so a child's tap would be lost whenever the object hibernated before the
lock-in and the phone wasn't back before the class left the reveal, with
no restart at all. Why a cap for the class rather than per child: the
booking must hold whatever a class does (below), and a cap per child
would book 60 children's worth per stage. Plausible assumption, to check
with telemetry: few lines end with input unwritten in a stage, so the cap
is rarely met.

### What can still be lost

Input is lost only when all of these hold: the memory goes (a deploy, a
restart, or hibernation after the stage's line writes are spent); no open
socket keeps a copy; and the device doesn't come back with its own copy
before the stage settles (Start for a look; the class leaving the reveal
for an answer). The device then shows what is stored: its look as before,
its answer as not given. A device opened in another browser, or a page
from before this design (until reloaded), has no copy of its own.

A write refused because the day's allowance is spent reloads the instance
(`hosting-and-limits.md`, "When the allowance runs out anyway"), with the
sockets' copies put back; a poller's comes with its next poll.

### Caps, taps and alarms

- `MAX_ANSWER_CHANGES` (10) and `MAX_LOOK_CHANGES` (100) stay as
  backstops, set generously: a change costs no row, and what the server
  holds per player doesn't grow with them, so they guard nothing measured
  and aren't part of a booking.
- A server-side cap can't save a request that has already arrived: a
  child tapping five times a second on long-poll would cost about 300
  requests a question. So the device sends the first tap of a burst, then
  its latest, one at a time and at most every `INPUT_GAP_MS` (300 ms)
  (`client/latest.ts`), the answers and the looks alike.
- An alarm is set only when none is due sooner (`scheduleAlarm`): an alarm
  that comes early only looks and sets the next, so a teacher's step no
  longer writes a row for the alarm too.

### Rows

What a class books (`server/rows.ts`): the steps, 20 rows a question; the
line writes, 20 a stage; a join and a few avatars taken back, 6 a player;
50 for roles and switches. For 15 questions that is about 1,030 rows when
the class is let in (77 lobbies at once in `DAY_ROWS_FOR_CLASSES`) and 830
from the start for a class of 25 (96 at once), against about 10,700 and
3,200 before.

What a class of 25 over 15 questions writes, estimated, not measured:
about 250 rows. Most are the steps (five presses a question, two rows
each: 150), then the joins (50), a line write now and then, and the
alarms of Countdown. That is about a fifth of the ~1,300 before; the
steps now bind, and requests and stored bytes bind next
(`scaling-drawer.md`).

## Not known

- Whether a socket's attachment survives an actual eviction (Situation).
  If it didn't, hibernation would lose what only memory held, and the line
  writes would be all that keeps it.
- How often a line ends with input unwritten in a stage, and so whether
  ten line writes a stage is right; how many devices come back with their
  own copy after a restart. Telemetry is to say.
- How the deployed platform behaves: `scripts/simulate-memory.mjs` passes
  against a local stack restarted in place, which closes the sockets as a
  deploy does, and against the local runtime hibernating the instance; the
  same run without the devices' copies loses every look and the open
  question's answers. Both ways are to run once against the deployed site,
  a deploy in the middle of the run for the first.
- Whether a pending timer keeps a hibernating object in memory: the line
  write's timer is set by an event, and the object stays in memory about
  10 s after one, so the 1 s timer is assumed to fire.
