# The open period held in memory

## Purpose

The site carries the classes that use it within the Free plan
(`scaling-drawer.md`), and a lesson goes on through dropped connections,
sleeping phones and instance restarts (backlog, Constraints, "Survives
school Wi-Fi"). Written as it came, every tap would be a write, and rows
would run out first. So the input that changes while a stage is open (the
lobby's looks, a question's answers, a Peers room's tap on) is held in the
instance's memory and written with the stage's steps, and a restart the
devices can recover from loses nothing they show. Resets are rare and
difficult to test, so the design needs to be simple and reliable.

## Situation

- Every write of the instance stores its meta with what changed: two rows
  (`persist`, `server/instance.ts`). Each `setAlarm()` writes a row
  (Cloudflare's Durable Objects pricing). Written as they come, the answers
  of a class of 25 over 15 questions would be about 750 rows, one tap each;
  the let-in booking for such a quiz, which has no row for an answer, is
  about 1,030 (`atLetIn`, `server/rows.ts`).
- A Durable Object loses its memory without notice or hook when it
  hibernates (its WebSockets kept open), takes up new code, or is restarted
  or evicted. A request in flight, a held long-poll among them, or a pending
  `setTimeout` keeps it from hibernating; one that can't hibernate is
  evicted after 70 to 140 s without events (Cloudflare's lifecycle page).
  Cloudflare's page has an object hibernate after 10 s without events; on a
  copy of the deployed site (2026-11-09) no quiet spell of 20 s let an
  instance hibernate and every one of 90 s did.
- The state Worker sets no code update strategy, so Cloudflare's default
  holds (`deferred`, `max_delay` 300 s): an active object keeps its code
  until it hibernates and wakes on the new code; one still active 300 s
  after a deploy resets, which ends its sockets. On the copy, deploys during
  a run left an instance's memory and sockets as they were, and an instance
  quiet through a deploy woke on the new code with the previous code's
  storage and socket attachments intact. The Pages functions are the new
  ones at once, so a call from them, or from an instance on the new code,
  may reach an object on the previous code.
- A WebSocket's attachment (`serializeAttachment`) survives hibernation
  while its socket lives, holds 16,384 bytes and is lost when either side
  closes (Cloudflare's WebSockets API). Writing one costs no rows and no
  stored bytes (measured on a probe Worker). The copies came back after
  hibernation both locally and on the copy of the deployed site.
- A student's socket is replaced several times a lesson: the screen locks,
  a reload, a switch between cellular and Wi-Fi, a deploy's reset. A device
  on long-poll has no socket.
- Held input that only memory has is lost whenever the object hibernates
  before the lock-in and the locked phone isn't back before the class leaves
  the reveal, which is routine in a lesson with no restart at all. That is
  what a line write is for: the run written when a player's line ends with
  input unwritten (`lineEnded`), capped per stage for the whole class
  (`MAX_LINE_WRITES`), since a class's booking must hold whatever it does.
  Plausible assumption, to check with telemetry: few lines end with input
  unwritten in a stage, so the cap is rarely met.
- Input is still lost when the memory goes (a deploy's reset, a restart, or
  hibernation after the stage's line writes are spent), no open socket keeps
  a copy, and the device doesn't come back with its own (kept across a
  reload) before the stage settles. A device opened in another browser has
  no copy of its own.

## Not known

- How often a line ends with input unwritten in a stage, and so whether ten
  line writes a stage is right; how many devices come back with their own
  copy after a restart. Telemetry is to say.
- The reset of an instance still active 300 s after a deploy, on the
  deployed platform, which a class with a device on long-poll meets at
  every deploy it runs through: the sockets end, and only the devices' own
  copies bring the input back. `scripts/simulate-memory.mjs --restart`
  passes against a local stack restarted in place; on the deployed site the
  script can't cause this reset.
