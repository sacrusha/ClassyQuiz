# The scaling drawer — working note

Ideas kept for when a specific limit of the Free plan starts to bind, so
that whoever meets it doesn't start from zero. Nothing here is planned or
decided. Each idea names the limit it answers and how you would know that
limit has become real. Figures are estimates, from an exploration between the
owner and the assistant on 2026-11-09, unless marked as measured.

## Purpose and threshold

Purpose: the site carries the classes that use it within the Free plan, and
it doesn't take on complexity for a load nobody has.

The owner, 2026-11-09: about 200 classes a day and about 60 at once is
plenty, once answers and looks are held in memory (backlog, "Room on the
Free plan", item 1). Beyond that, donations could pay Cloudflare for more,
rather than the code being made more complicated. An idea here is taken up
when a figure shows its limit binding below that threshold. The figures are
the telemetry item's to provide (same section, item 2).

The plan's limits and what a class costs: `design/hosting-and-limits.md`,
Situation.

## Duration: an object that holds a poll stays awake

**Situation.** Duration is billed at 128 MB per awake object, whatever it
actually holds ("regardless of actual usage", Cloudflare's Durable Objects
pricing). The Free plan allows 13,000 GB-s a day, about 29 hours of awake
objects account-wide. The time is shared within an object: 25 devices in one
class cost what one does. An object that is "idle in memory but unable to
hibernate" is billed. Measured (item 1's probe on a Worker of its own): a
held long-poll (`waiters`, `server/instance.ts`) accrues duration for its
whole hold, about 0.128 GB-s a second. While any
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
about 200 Function and 250 to 430 Durable Object requests; on long-poll about
3,000 of each. That is about 230 to 400 classes a day on WebSockets, about 33
with every device polling, roughly 400 + f × 2,600 Durable Object requests
for a class whose share f of devices polls. Incoming WebSocket messages count
at 20 to a request. The client's `"ping"` every 20 s (`client/net.ts`) is a
text message answered by `setWebSocketAutoResponse`, not a protocol ping;
measured (item 1's probe), it causes no invocation, so the 430 is nearer
250. Reconnects per device (about 4 assumed: the first plus lock, recess,
network switch) are a guess.

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

**Ideas:** none worked out yet. The levers are the lifetime (a decided
promise), the picture limits (`pictures.md`), and the share of the plan's
5 GB given to live quizzes.
