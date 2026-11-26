# The scaling drawer

The site carries the classes that use it within the Free plan, and doesn't
take on complexity for a load nobody has; near what the plan carries,
donations paying for hosting off the Free plan are another way.
So nothing here is planned: these are ideas for when telemetry
(`design/telemetry.md`) shows a limit binding for the use the site gets. The
plan, its measured costs and what a class costs:
`design/hosting-and-limits.md`, Situation.

## Duration

One poller keeps its class's object awake for the whole lesson
(`design/hosting-and-limits.md`, "What a class costs").

How you'd know: daily duration in the dashboard near the plan's; classes
with a poller and the seconds polled, from telemetry.

Ideas, cheapest first:

- **Short polls throughout** — no held polls, so no duration, but more
  requests, and a step reaches a poller a few seconds late.
- **The Function holds the poll, on a socket to the object** — accepted for
  hibernation as a device's socket is, so a class with pollers costs the
  duration a WebSocket class does. Not established: that an object whose
  socket ends in a Function is billed as one whose socket ends in a browser
  (a probe Worker would tell), and how it runs on the local stack. Costs a
  rewrite of the poll path around sockets, and more Cloudflare-specific code
  for a school that converts the server.
- **One object for the whole site holding every class's polls** — duration
  becomes fixed, at most about 10,800 GB-s a day. Costs a request from the
  instance per view change in a class with pollers (a few hundred a class), a
  second place in the delivery path, and more Cloudflare-specific code.

## Requests

How you'd know: daily requests in the dashboard; the long-poll share and
requests per class, from telemetry.

Idea: if the long-poll share is high, find why devices fall back (a school's
filter, a socket that never got a first message), and whether a page on
long-poll should try WebSocket again. Today it never does, and the reason is
unrecorded.

## Stored data: pictures

Pictures are almost all of a quiz's stored bytes, so `MAX_LIVE_BYTES` (1 GB)
holds a few hundred picture quizzes at once, about 60 at the 16 MB upload cap,
each for three hours after its last use.

How you'd know: `SiteBudget` refusing on `"bytes"`.

Ideas:

- **Eviction by need** — as stored bytes near the
  cap, a quiz left unused goes earlier than its three hours, the sooner the
  larger it is and the less room is left (say 50 MB left, a 10 MB quiz unused
  for an hour: evicted).
- **A host device serves the pictures** — it stays
  connected and hands out each question's pictures when the question comes,
  so the server stores less of them, or nothing.

## Rows

Letting a class in books the most it can write (`server/rows.ts`), 3 to 4
times what a class writes; the reserve for line writes is the largest
adjustable part.

How you'd know: refusals by `"rows"` in `GET /api/site/use`.

Idea: book nearer to what classes write, once telemetry shows it, the reserve
for line writes first.
