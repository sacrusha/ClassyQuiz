# Connections

## Purpose

A lesson goes on when a connection drops, a phone sleeps or a device dies
(backlog, Constraints, "Survives school Wi-Fi": "Failure in front of the
class ends adoption."). A student whose device comes back has nothing to do;
a tap sent twice never skips a step or counts twice; a flaky line never costs
a question.

## Situation

- A school network may block the WebSocket upgrade, or accept it and then
  drop every frame; NAT tables and proxies drop idle sockets. Phones and
  tablets sleep mid-lesson and come back minutes later, and a dead battery
  leaves the server with silence rather than a close. A deploy or a Durable
  Object restart mid-run ends every socket (`open-period-in-memory.md`).
- A device resends every command the server hasn't acknowledged once it
  reconnects, so the server can receive any command more than once.
- A school filter answers in the site's place with a page of its own, under
  any status, a 404 among them; so does Cloudflare once the day's Function
  requests are spent (`hosting-and-limits.md`). The site's own answers are
  JSON, and a refusal names its reason (`error`). What a device keeps (a
  student's place in a quiz, the secret of a quiz it opened, the owner's
  key) is its way back, forgotten only on the site's `error`. A picture
  answered by such a page with a 200 shows broken until the page reloads.
- A POST with a chunked body and no Content-Length reaches the instance
  whole unless the Function caps it, and a large one can reset a class's
  instance mid-lesson.
- A student whose device died and who doesn't pick their avatar back
  (`class-and-wall.md`) joins as a new player and loses the earlier score.
  Plausible assumptions: that is rare, and nobody grades by the ranking,
  which is somewhat anonymous.
- Every open connection or poll spends some of the free plan's daily
  allowance (`hosting-and-limits.md`). Plausible assumption: a lesson is 45
  minutes and tablets are often left on afterwards; a tab whose view hasn't
  changed for 45 minutes sleeps (`SLEEP_AFTER_MS`).

### A poller left alone rests

Purpose: a quiz nobody is using doesn't spend the plan's duration (a few
dozen lobbies left open would spend a day's), and a class that is in is
never slowed for it.

Situation: a held long-poll keeps the object awake (`hosting-and-limits.md`,
"The plan"). An object holding no
poll and running no timer can hibernate and, by Cloudflare's pricing page,
isn't billed while idle, but hibernating loses its memory, which is all it
knows of a poller. So where no class is in, a page on long-poll that has
neither changed nor been touched for a while stops holding polls and asks
at an interval instead (`atRest`, `server/instance.ts`).

- A step from another device reaches a tab at rest up to 30 s late.
- A teacher's tab at rest stays present to the other devices by a stored
  word: the lobby is where a class arrives, and a wall saying "Remote gone"
  there is a stumble in front of it (lobbies are opened early:
  `hosting-and-limits.md`, "Who opens a lobby"). A tab that went away at
  rest is found gone within `REST_FRESH_MS` of another device next calling.
  That is 75 s rather than the 45 s of other tabs on the plausible
  assumption (from memory, not checked) that Chrome runs the chained timers
  of a tab hidden over five minutes once a minute.

## Not known

- Whether dead devices are common in real classes; if they are, the lost
  score above may not stay acceptable.
- Whether the rest's five minutes, 30 s and 75 s are right; none has been
  seen in a lesson, nor a hidden tab's asking at rest. A tab slowed past
  75 s would read as gone and back.
- Whether an object asked every 30 s by a device at rest is billed only
  while it answers; what was measured (`hosting-and-limits.md`, "The plan")
  is a held poll and the pings, not this.
