# The scaling drawer — working note

Ideas kept for when a specific limit of the Free plan starts to bind, so
that whoever meets it doesn't start from zero. Nothing here is planned or
decided. Each idea names the limit it answers and how you would know that
limit has become real. Figures are estimates unless marked as measured.

## Purpose

The site carries the classes that use it within the Free plan, and it
doesn't take on complexity for a load nobody has. Near what the plan
carries there are other ways than more complicated code, donations paying
for hosting off the Free plan among them (the owner). An idea here is taken
up when a figure shows its limit binding for the use the site actually gets
(`design/telemetry.md`).

The plan's day starts at 00:00 UTC (01:00 Swiss time in winter, 02:00 in
summer). A Swiss before-lunch peak, about 10:00 UTC, meets a day whose
ledger holds only that morning's classes.

The plan's limits and what a class costs: `design/hosting-and-limits.md`,
Situation.

## Duration: an object that holds a poll stays awake

**Situation.** Duration is billed at 128 MB per awake object, whatever it
actually holds ("regardless of actual usage", Cloudflare's Durable Objects
pricing). The Free plan allows 13,000 GB-s a day, about 29 hours of awake
objects account-wide. The time is shared within an object: 25 devices in one
class cost what one does. An object that is "idle in memory but unable to
hibernate" is billed. An object holding a long-poll (`waiters`,
`server/instance.ts`) is such an object: measured 2026-11-09 on a probe
Worker, a request held 25 s accrued duration for the whole hold, about
0.128 GB-s a second, with a timer or on a bare promise alike. While any
device in a class polls, polls follow each other within 0.3 to 1.5 s, so the
object stays awake for the whole lesson. On WebSockets alone, only handler
time counts, which is negligible.

**Estimate.** A class with at least one polling device costs about 340 GB-s
for a 45-minute lesson, so about 38 such classes a day. A device left polling
on the final ranking adds up to `SLEEP_AFTER_MS` (45 min without a change of
view), so about 680 GB-s and about 19 classes a day. Below the 33 classes a
day that requests allow when every device polls. How often a class has a
poller is not known.

**How you'd know.** Daily duration in the Cloudflare dashboard, near 13,000
GB-s. Classes with at least one poller and the seconds devices spent
polling, from telemetry (`GET /api/site/use`, `design/telemetry.md`).

**Ideas, cheapest first:**

- **Pollers dormant after 5 minutes, asleep after 45** (owner: adequate).
  After 5 minutes without a change of view or the device's own input, a
  poller stops holding polls and asks with short polls that the server
  answers at once, about every 30 s. A short poll lets the object hibernate.
  It costs about 2 requests a minute per dormant device (Function plus Durable
  Object). A step after a long pause reaches the wall within 30 s, with no
  tap. That matters for the wall in Screen-and-remote mode, which nobody
  touches. Sleep with "Tap to continue" stays at 45 minutes. A dormant wall
  on the final ranking keeps the ranking visible, since that's the photograph
  moment. It takes back the time after the lesson: about 380 GB-s per class,
  about 34 classes a day. The lesson itself stays.
- **Short polls throughout.** No held polls at all: no duration, more
  requests, and a step reaches a poller a few seconds late. Trades the
  duration limit for the requests limit.
- **One object for the whole site holding every class's polls.** Duration
  becomes a fixed cost: at most 0.125 GB × 24 h ≈ 10,800 GB-s a day, however
  many classes poll. The cost:
  - each view change in a class with pollers becomes a request from the
    instance to that object, a few hundred per class;
  - a second place in the delivery path, against "state lives in one place"
    (`design/connections.md`);
  - more Cloudflare-specific code for a school that converts the server.

## Requests: the long-poll share and the pings

**Situation.** Per class of 25 over 15 questions, estimated: on WebSockets
about 200 Function and 250 Durable Object requests; on long-poll about 3,000
of each. That is about 400 classes a day on WebSockets, about 33 with every
device polling, roughly 250 + f × 2,750 Durable Object requests for a class
whose share f of devices polls. Incoming WebSocket messages count at 20 to a
request. The client's `"ping"` every 20 s (`client/net.ts`), answered by
`setWebSocketAutoResponse`, costs nothing: measured 2026-11-09 on a probe
Worker, 4,000 pings left no invocation, where 4,000 handled messages left
4,002 (the billed 20:1 figure isn't exposed in the metrics). Reconnects per
device (about 4 assumed: the first plus lock, recess, network switch) are a
guess.

**How you'd know.** Daily requests in the dashboard. The long-poll share,
reconnects per device and requests per class, from telemetry
(`GET /api/site/use`, `design/telemetry.md`).

**Ideas:**

- **If the long-poll share is high:** why the devices fall back (the school's
  filter, a socket that never got a first message), and whether a page on
  long-poll should try WebSocket again. Today it never does, and the reason
  is unrecorded (`design/connections.md`, Not known).
- **A script spending the day:** a domain with an edge rate-limiting rule
  (backlog, open list), since a server-side cap can't save a request that has
  already arrived.

## Stored data: pictures

**Situation.** Pictures are almost all of a quiz's stored bytes. A quiz with
15 pictures is a few MB, a text-only quiz about 1 % of that
(`design/pictures.md`). `MAX_LIVE_BYTES` (1 GB) then holds a few hundred
picture quizzes at once, about 60 at the 16 MB upload cap, and far more
text-only ones. Each holds its bytes three hours after its last use.

**How you'd know.** `SiteBudget` refusing on `"bytes"`
(`design/hosting-and-limits.md`, "A refused upload says which cap it hit").

**Ideas:**

- **Eviction by need** (the owner, 2026-11-10): as stored bytes near the
  cap, a quiz left unused goes earlier than its three hours, the sooner
  the larger it is and the less room is left (for example 50 MB left, a
  10 MB quiz unused for an hour: evicted). Who comes back to an evicted
  lobby, and what they need then, is in `design/hosting-and-limits.md`,
  Situation, "Who opens a lobby".
- **A host device serves the pictures** (the owner's example): it stays
  connected and hands out each question's pictures when the question comes,
  so the server stores less per quiz, or nothing of the pictures.
- The levers otherwise: the lifetime (a decided promise), the picture limits
  (`pictures.md`), and the share of the plan's 5 GB given to live quizzes.

## Rows: the booking

**Situation.** Letting a class in books the most it can write
(`server/rows.ts`): about 1,030 rows a lobby and 830 from Start for 25
players, 3 to 4 times the ~250 a class writes. The ledger counts the day's
settled writes plus the live bookings against the rows of `DAY_FOR_CLASSES`
(80,000), so after 200 classes in one UTC day about 29 lobbies still fit at
once, counted in rows. The reserve for line writes is the largest adjustable part, 320 of a
lobby's 1,030. The same ledger books requests and awake time as estimates
(`design/hosting-and-limits.md`, "Running classes finish"); for classes on
WebSockets rows are still what it fills first, at their most, so started
classes of 25 fit some 96 at once on rows and some 230 on requests.

**How you'd know.** Refusals by `"rows"` in `GET /api/site/use`.

**Ideas:** book nearer to what classes actually write, once telemetry shows
it, with the reserve for line writes first.
