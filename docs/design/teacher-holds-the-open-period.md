# The teacher's device holds the open period

A design kept ready, not built: a way to cut the rows a class writes, for when
that optimization is wanted. Taking it up costs a test design and an
implementation; the risk it leaves is managed, not zero. Open decisions and
unchecked facts are at the end; they are to be settled before a build.

## Purpose

More classes a day on the same plan, by writing to storage only what has to
survive, and by making clear who owns each piece of state at each moment, so
that no two sources ever have to be reconciled.

## Situation

- Every stored change writes the run and the instance's meta: two rows
  (`server/instance.ts`, `persist`; `server/rows.ts`). Answers are most of a
  class: about 750 of the ~1,300 rows of a class of 25 over 15 questions, and
  5,400 of the ~10,700 a let-in booking assumes. Looks are most of the rest of
  that booking: a player may change look `MAX_LOOK_CHANGES` (38) times, 2
  rows each.
- Rows are counted per row written, not per byte (Cloudflare's billing, to
  confirm), so a smaller layout does not save rows; fewer keys and fewer
  writes do.
- A Durable Object may be evicted when idle (hibernation, about 10 s without
  events) and without notice at a deploy or restart. There is no on-evict
  hook. The constructor reloads from storage (`load()`).
- Devices hold their own input: the look chosen, the tap made, the sequence
  number sent.
- The countdown is the server's today: a stored deadline (`run.clocks`) and a
  Durable Object alarm that locks answering in at it.
- A Remote or Projector tab counts as gone only after a silence
  (`teacher-devices.md`, 45 s for the Remote), so the server learns of a dead
  device late.

## How the site would meet it

**Who owns what.**

- The tab that steers (the Remote, or the Projector when it steers itself,
  called the holder here) owns the open period's content: the lobby's looks,
  and the open question's answers. The server relays student input to it. The
  persisted store is a checkpoint, never a second authority.
- When the period ends the holder hands its content to the server in one
  write, and the server owns it from then on: the looks at Start, a
  question's answers at lock-in. The handover is what the wall's spread and
  the scoring are computed from.
- The roster (tokens, and each avatar as chosen at join) is written when a
  device joins, bursts debounced into one row, so a known device is known
  after any eviction, and a look that cannot be recovered falls back to its
  join avatar, not to a plain disc.
- Everything the teacher decides is written at the teacher's steps as today:
  position, phase, fixes, the clock, the speed switch, revealed questions;
  the quiz and pictures at upload.

**The handover and the window.** At lock-in the holder sends its content with
the press, and the question's answers are written. Taps still in flight
reach the holder for the window, counted from the press: a device shows
"closed" only when the news reaches it, and a tap made just before comes
back, so the longest case is four legs (Remote to server, server to device,
device to server, server to Remote). At an assumed 0.5 s a leg, the Projector
closes at 0.5 s, the tablets at 1.0 s, the last tap reaches the holder at
2.0 s and its catchup is committed at 2.5 s. The window is therefore 2 s. The
holder collects what comes in and sends one catchup message, or none if there
is none. A teacher's next step closes the window early and carries the
catchup with it. A tap that arrives after the window is written through by
the server at once, an overwrite of that player's record where the higher
`seq` wins; such taps are rare and the existing caps bound their rows. The
window decides only how many writes are batched, not whether a tap counts:
that is the existing rule (a tap made on an older view counts until the class
leaves the reveal), and the points for speed use the `ms` the device
measured, not the arrival time. A late arrival can therefore change the
standing slightly after the spread was shown, which the design accepts.

**A lock-in by the countdown.** Each device measures its clock's offset to
the server at join, knows the deadline in server time, and closes itself at
the deadline on its own clock, so no "closed" message travels out. Only the
two inbound legs are in flight: the window is 1.0 s after the deadline and
the commit lands at 1.5 s. The holder set the deadline, so it sends the
handover at the deadline plus the window without being asked. The server's
alarm at the deadline is the backstop: if no handover has come it asks the
holder, and locks in without the content when there is no holder (open
decision). The tablets show the time out on schedule; the spread follows
about 1.5 s later.

**A returning holder never trusts its memory.** A tab that takes the steering
after a reload, a wake or on another device reads the checkpoint (position,
phase, roster) from the server and asks the roster's devices for the open
period's content (their look, their tap). Devices' reports are the only source
for that content; nothing competes with them.

**Student devices that leave and return** ask the holder for their state.
The join waits for the reply, or for the holder to count as gone (a timeout of
a few seconds), and then takes the defaults: the join avatar in the lobby, no
choice in a question. A device that took defaults is provisional: the holder's
state, when it has any, overwrites the device's.

**Mass sleep.** After a rebuild, the teacher's next step is blocked by an
overlay: "n students offline", with their names and avatars, counted from
who has not replied (not from presence, which lags by the ping timeout), live
until zero. "Proceed without them" lets the class go on; it says what that
means (avatars as they joined, this question's answer not counted). The
overlay is for a rebuilding holder only; an absent student in an ordinary
lock-in blocks nothing. Those who return later are not locked out; they take
the class's current state.

**The countdown stays the server's alarm.** The teacher's press sets the
deadline and the server's alarm executes it. A countdown owned by a phone
dies whenever the phone locks, long before it is dead, while the wall keeps
drawing the stored deadline.

**Rows.** About 100 to 150 for a class of 25 over 15 questions, not counting
the upload (roster 3 to 5, steps about 60, answers about 20, start and
ranking a few), against ~1,300; estimated, not measured. The booking in
`rows.ts` shrinks to match, which also raises how many classes run at once,
and the looks stop being a third of the worst case. Classes on the HTTP
long-poll fallback then bind on requests (about 3,000 Function and 3,000
Durable Object each), not rows.

## Costs and risks

- The loss left is an open period's content when the holder is gone and the
  content cannot be rebuilt from the devices (all of them off at once):
  tolerable, and the overlay makes it a visible choice.
- A new message set (query, reply, handover, catchup, closed), new states
  (rebuilding, waiting), and a changed ack: tests are most of the work.
- The server stores what the holder sends. The holder is already authorised
  by the teacher code.
- A holder on the HTTP fallback would cost requests for every relayed tap; on
  a WebSocket it costs almost none.
- The server learns of a dead holder late (see Situation), so taps relayed in
  that lag may reach nobody. The holder acknowledging each relayed tap, or
  the rebuild collecting them from the devices, covers it.

## The competing variant: the server keeps the open period

Not explored; named so the choice is made knowingly. The server holds the open
period in memory and persists it: a debounced flush a few seconds after the
last tap, and at lock-in; a late tap is written through. The holder keeps a
mirror from the views it already receives, used once, after a server reset
(the constructor ran since the last press), together with the devices'
reports. Otherwise the server's memory is the truth.

Against the design above: rows are higher, about 150 to 250 a class instead of
100 to 150, and most of the saving is shared. It needs no relay, window,
clock sync or "no holder" state, and an ack still means "stored". The loss
left is the flush interval on a deploy or crash. It depends on a pending
timer keeping the object awake until the flush (unchecked, see below).

## Open decisions

- **Taps while no holder is present:** refused (the tablet shows "waiting for
  the teacher"), or kept on the device and delivered at the rebuild. The
  first never lets a tablet show an answer as accepted that nothing holds,
  and changes what an ack means from "stored" to "held"; the second needs no
  refusal, because the rebuild collects from devices anyway.
- **A lock-in by the countdown with no holder:** wait for one, or lock in
  without the answers.
- **Who applies the rules that need the previous state** (a tap that changes
  nothing is dropped, `MAX_ANSWER_CHANGES`, the higher `seq` wins): the
  holder, which has the state, or the server with a small counter.
- **The wait for a holder's reply** in a join and in the alarm's backstop:
  the timeouts. A round trip is two legs; at the assumed 0.5 s a leg that is
  1 s, and about 3 s leaves a margin against calling a slow device gone.
- **The latency assumed:** 0.5 s a leg, for the worst plausible school
  Wi-Fi or mobile link (typical is 20 to 100 ms). To measure on a real
  school network (`/check`).

## Not known

- Whether the client keeps its tap and look across a reload (localStorage)
  and resends on reconnect; whether the views carry each student's answer or
  only counts, which the holder needs.
- Whether a pending timer keeps a hibernating object awake, and the exact
  idle window (Cloudflare's docs give about 10 s and differ on the longer
  figures).
- Whether WebSocket messages bill at 20 to a request here, and whether
  `setAlarm` writes a row.
- The 2 MB value cap against `MAX_PLAYERS` (60): a run of 60 players over 15
  questions is far smaller as JSON than `hosting-and-limits.md` implies.
- Whether the single tab, which both shows and steers, can be the holder
  without the wall's wake lock (needs HTTPS) keeping it awake.
