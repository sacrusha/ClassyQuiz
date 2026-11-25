# Connections

## Purpose

A lesson goes on when a connection drops, a phone goes to sleep or a device
dies. From the backlog's constraint "Survives school Wi-Fi": "Failure in front
of the class ends adoption." A teacher who sees the quiz stumble once in front
of thirty children does not use it again. The constraint itself is in
`backlog.md` (Constraints); this file says how the site meets it.

For a student the aim is that nothing needs doing: a device that comes back
shows the same avatar, the same score and the current screen. For a teacher it
is that a step is never skipped or counted twice because a tap was sent
twice, and that a flaky line never costs a question.

## Situation

- A network may be hostile to long-lived connections: a filter may block
  the WebSocket upgrade, or accept it and then drop every frame; NAT tables
  and proxies drop idle sockets.
- Phones and tablets sleep mid-lesson and come back minutes later. A battery
  can die with the socket still open, so the server sees silence rather than a
  close.
- A deploy or a Durable Object restart in the middle of a run is the same
  situation from the server's side.
- A student whose device died joins again as a new player (or picks their
  avatar back, `class-and-wall.md`). When they do not pick it back, the earlier
  score is lost: accepted on the plausible assumptions that it is rare and
  that nobody grades by the ranking, and because the ranking is "somewhat
  anonymous" (the owner's words).
- Plausible assumption: a lesson is 45 minutes and tablets are often left on
  afterwards (`SLEEP_AFTER_MS`, "Devices left on").
- The free plan has a daily allowance (`hosting-and-limits.md`). Every open
  connection or poll spends some of it.

## How the site meets it

### State lives in one place, views are sent whole

One Durable Object per quiz instance (`server/instance.ts`) holds the quiz,
the teacher's fixes and the current run with its players and answers. A
teacher's step, a join and a fix are written before they are acknowledged.
The input of an open stage (the lobby's looks, a question's answers) is
held in memory and written with the stage's steps; what a restart or a
hibernation takes from memory comes back from the copies the sockets and
the devices keep (`open-period-in-memory.md`).

The server sends each device the complete view for its role (projector,
teacher, student), never a diff (`shared/protocol.ts`). A device that slept
just draws the newest one. Scores are never stored; they are computed from
answers plus fixes. That is why a changed key moves the points, and why speed
scoring needs only the answer times already recorded (`question-flow.md`).

### Transport: WebSocket first, long-polling when the network breaks it

The line is `Line` in `src/client/net.ts`; the same messages and views travel
either way.

- WebSocket first, hibernating on the server, so an idle instance costs
  nothing.
- The client pings every 20 s (`PING_EVERY`). The runtime answers `pong`
  without waking the object (`setWebSocketAutoResponse`) and notes the time;
  the server uses that time to tell a present device from one that is away
  (`FRESH_MS`, 45 s, in `server/instance.ts`). No pong within 8 s
  (`PONG_WITHIN`) means the line is dead and the device reconnects.
- Waking, coming back online, a page restored from the cache or the tab
  becoming visible reconnects at once rather than waiting out the backoff
  (0.5 s doubling to 5 s). A socket that looks open after sleep is tested with
  a ping first.
- A socket counts as working only once a message has arrived through it, not
  when it opened. One that stays silent for 8 s (`FIRST_MESSAGE_WITHIN`)
  counts as failed. After three failures in a row the page switches to HTTP
  long-polling for the rest of its life; it does not go back to WebSocket.
  The quiz then runs a moment slower.
- Long-polling: a poll is held up to 25 s (`POLL_HOLD_MS`) until the device's
  view changes. Polls never follow each other closer than 300 ms
  (`MIN_POLL_GAP`); a quick empty answer waits 1.5 s. A device with no player
  yet (choosing an avatar or a role) is held like any other poller, until the
  choices on offer change. When a tab changes identity (a guest becomes a
  player) the held poll is let go and asked again as the new one. Where no
  class is in, a poller left alone stops holding polls ("A poller left
  alone rests").
- Server-Sent Events were rejected: proxies buffer them too, commands would
  still need POST, and they do not hibernate.

### Everything a device sends is safe to repeat

Commands are kept by the client until the server acknowledges them and are
resent after a reconnect. A double tap, or a retry after a dropped line, never
skips a question or counts twice, because each kind of command is idempotent:

- Step commands (`play`, `lastCall`, `begin`, ...) name the state they were
  pressed in (`At`); the server ignores them once the quiz has moved on.
- Answers carry a sequence number; a late older one changes nothing. An
  answer given just before the phone slept is therefore not lost.
- Fixes set a value rather than toggle one.
- A join remembers its command id, so a resent join gets the same player, not
  a second avatar (`run.joins` in `server/instance.ts`; the newest
  `JOINS_KEPT` are kept).

Taps that looked in time but arrived late, and answers settling, are in
`question-flow.md`. Rejoining with an avatar is in `class-and-wall.md`.

### Devices left on

A tab whose view has not changed for 45 minutes (`SLEEP_AFTER_MS`,
`shared/limits.ts`) goes to sleep: the line closes, the wake lock is released
and "Tap to continue" covers the page. In a running quiz the view changes
with every step, so a live class never sleeps; a tablet
left on after the lesson stops costing requests all day.

- The waking tap or key does not reach the page, so it presses nothing and
  cannot advance the quiz from a clicker. Coming back to the tab (a tablet
  switched on) wakes it too.
- A page with several lines, a device the class shares
  (`class-and-wall.md`, "Sharing a device"), sleeps and wakes as one: a
  change on any of its lines keeps them all awake, and the one tap wakes
  them all.
- A page's own timers (the `tick` command) neither count as activity nor wake
  it. Any other command is someone at the device and does.
- It lives in `client/net.ts`, so it covers every page with a line, the
  picture screens included.

### A poller left alone rests

Purpose: a quiz nobody is using doesn't spend the plan's duration, of which
a few dozen lobbies left open would spend a day's (`hosting-and-limits.md`,
"Running classes finish", Not covered), and a class that is in is never
slowed for the plan's sake.

Situation: a held poll keeps the object awake, so one device on long-poll
keeps its quiz's object awake until its page sleeps. With a class in, its
booking carries that time; with none in (a lobby whose class waits
outside, a quiz nobody came to, a final ranking) nothing does, or only the
final ranking's estimate. An object holding no poll and running no timer
can hibernate, and by Cloudflare's pricing page isn't billed while idle;
hibernating loses its memory, which is all it knows of a poller
(`open-period-in-memory.md`, Situation).

- **Where no class is in** (`atRest`, `server/instance.ts`), a page on
  long-poll that has shown no change and felt no touch for 5 minutes
  (`REST_AFTER_MS`) holds no poll and asks every 30 s (`REST_EVERY_MS`)
  instead, until something is stored, a touch or a command. Students whose
  devices went quiet are still a class in (what that leaves awake:
  `hosting-and-limits.md`, "Running classes finish", Not covered).
- **A step from another device reaches a tab at rest up to 30 s late**: a
  wall nobody touches shows the class let in from the Remote that much
  after the tap (owner: adequate).
- **A player's device at rest counts as away** to the others, as one
  asleep does: across a loss of memory its asking is no sign of it, and
  nothing is stored for it.
- **A teacher's tab at rest stays there** to the other teacher device and
  to a teacher code, by a stored word, a row as it goes to rest, as it
  stops and as it is found gone. Purpose: the lobby is where a class
  arrives, and there a wall saying "Remote gone", or a teacher code taking
  the place of a tab that is lit, is a stumble in front of it (the lobby
  opened early, the walked quiz: `hosting-and-limits.md`, Situation, "Who
  opens a lobby"). The cost of not relying on memory: a tab that went away
  at rest is found gone within `REST_FRESH_MS` (75 s) of another device
  next sending a command, a teacher code, a reconnect or a poll not at rest;
  not a timer's `tick`, and a hand on a wall on WebSocket sends nothing.
  Until then the wall doesn't steer for a Remote that died at rest. 75 s,
  not the 45 s of other tabs: plausibly (from memory, not checked) Chrome
  runs the chained timers of a silent tab hidden over five minutes once a
  minute; whether a timer set after a request's answer is chained isn't
  known.

What would let a poller cost no duration at all, and count as there while
it waits: `scaling-drawer.md`, "Duration".

### The allowance spent

What devices say when the account's daily allowance is spent, and how they
know: `hosting-and-limits.md`, "When the allowance runs out anyway". While
spent, a device asks again once a minute (`QUOTA_RETRY`), not every
few seconds. The notice goes once something is stored or an HTTP call
succeeds again.

### Answers that aren't the site's

Purpose: what a device keeps is a way back (a student's place in a quiz,
the secret of the quiz the device opened, the owner's key), and none of it
is lost because something other than the site answered.

Situation: a school filter answers in the site's place with a page of its
own, under any status, a 404 among them; so does Cloudflare once the day's
Function requests are spent (`hosting-and-limits.md`, Situation). The
site's own answers are JSON, and a refusal names its reason (`error`).

So an answer that isn't JSON counts as no answer unless it reads as the
allowance spent (`readApi`, `client/net.ts`), and a device forgets only on
the site's `error`, never on a status. Not covered: a picture, where a
page that comes with a 200 is taken for the picture and shows broken
until the page reloads.

### Bodies without a length

Every POST to an instance (command, poll, info, end) is read in the Function
and capped at 20 KB (`MAX_COMMAND_BYTES`), whatever its Content-Length says,
then forwarded as text. JSON uploads are capped likewise at twice the quiz
limit (`MAX_QUIZ_BYTES`). Without this a chunked body reached the instance
whole, and a large one could have reset a class's instance mid-lesson. Uploads
with pictures already need a length.

## Not known

- Whether dead devices are common in real classes; if they are, losing the
  score of a student who does not pick their avatar back may not stay
  acceptable.
- A deploy's reset of a running instance, which ends its sockets, has
  been checked only against a local stack restarted in place; a deploy
  taken up at hibernation was checked on a copy of the deployed site
  (`open-period-in-memory.md`, Situation and Not known).
- Why a page on long-polling never tries WebSocket again: the behaviour is
  v1's (`client/net.ts`), its reason unrecorded.
- Whether five minutes, 30 s and 75 s are right; none has been seen in a
  lesson, nor a hidden tab's asking at rest. A tab slowed past 75 s would
  read as gone and back, a row each time. A teacher's tab at rest across a
  loss of memory was seen on the local runtime only.
- Whether an object asked every 30 s by a device at rest is billed only
  while it answers; measured are a held poll and the pings
  (`scaling-drawer.md`), not this. To measure on a copy of the site: the
  day's duration before and after a lobby on long-poll left at rest.
