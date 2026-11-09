# Telemetry

Backlog, "Room on the Free plan", item 2. Who reads it and how long it is
kept are the owner's (2026-11-09); the rest is the implementer's, on the
owner's "balance straightforwardness of implementation, likely usefulness of
data, and general purpose".

## Purpose

The owner's words, 2026-11-09: "avoid privacy violation", "get a handle on
usage", "get a handle on problems". The site's limits, the capacity sentence
on the landing, the caps and the scaling drawer's ideas rest on figures
nobody has measured; telemetry gives them without identifying anyone and
without spending what it measures.

## Situation

- The constraint "Nothing public, nothing kept beyond its use, nothing
  identified" (backlog, Constraints). What the site keeps and logs:
  `hosting-and-limits.md`, "What lives, and for how long": no request logs,
  no IP addresses, error logs with the message only and not stored.
- What the site recorded before telemetry, all without content or identity:
  `SiteBudget` (`server/budget.ts`) per UTC day for 31 days (classes let
  in, rows written by the classes that finished, the ledger's peak, the
  days an upload was refused; the day's upload count only until the next
  day), shown by `GET /api/site`; and `UploadStats` (`server/stats.ts`),
  upload attempts by format, kept for good, shown by `GET /api/stats`
  (`root-page.md`, "Upload attempts counted by format"). The landing reads
  `full` from `/api/site` for its own-copy line.
- The live figures, 2026-11-09: two or three classes a day, 75 zip attempts
  since 2 November. Plausible assumption: they are the project's own walks
  and probes (the deploy log names some). Telemetry is to be in place before
  teachers come.
- Cloudflare's dashboard gives account-wide daily counts (Function and
  Durable Object requests, rows, duration, storage), and its Durable
  Objects metrics can be filtered by one object's id (Cloudflare changelog,
  2026-06-12). The deploy token has no analytics permission
  (`secrets/README.md`). The dashboard is the account's check of the totals;
  telemetry says what they are made of.
- What isn't known (backlog Room item 2, `scaling-drawer.md`, the design
  files' "Not known"): the share of devices on long-poll, classes with at
  least one poller, reconnects per device, why a device falls back; actual
  rows and requests per class, duration per day, devices left on after the
  lesson; classes a day and at once (the owner's threshold, about 200 and
  60), the kind of room, class size, how far a quiz gets; the spent
  allowance and errors as devices meet them. Measured once, not by
  telemetry (item 1's probe on a Worker of its own): auto-answered pings
  cause no invocation, socket attachments write no rows and store no
  bytes, and a held poll accrues duration for its whole hold (about
  0.128 GB-s a second).
- An object hibernates between messages and loses what it holds in memory;
  a socket's attachment is lost when the socket closes. A count kept by the
  instance alone loses whatever came between two writes. Devices hold their
  own state across that, and send it, not events, with their hello and
  every poll (backlog Room item 1). The hello and the poll body carry
  `held`, the input the server last accepted, which it applies as a resent
  command; each WebSocket player's newest socket keeps a copy in its
  attachment; `load()` rebuilds memory from storage and the attachments.
  The run is written with every step, a join, and a "line write" (a socket
  closing or a held poll timing out with input unwritten, batched over a
  second, a few per stage).

## How the site meets it

### What is counted, and by whom

Each device counts its own line for the quiz it is in, since the page
opened: whether it is on WebSocket or long-poll now; the sockets that
worked (reconnects are that minus one) and the WebSocket attempts that
failed, those that opened and carried nothing apart (a filter that takes
the upgrade and drops the frames, against one that refuses it); the HTTP
requests it sent (polls, commands); the WebSocket
messages it sent, and its pings apart; the seconds it spent on long-poll;
how often it was told the allowance was spent; whether it went to sleep;
and its script errors, as a number. Integers and one word from a closed
list; never an error's message, which can carry quiz text. The server takes
each number as a bounded integer and the word only from the list.

The device sends its counts as `line`, beside `held` (not inside it: `held`
is accepted input), with what it sends anyway: its hello, its polls and its
commands. A WebSocket device's counts change while its socket lives and
would otherwise reach the server only at the next hello; its taps and looks
carry them on. The newest replaces the one before, so memory lost on the
server is rebuilt from the next message and nothing is counted twice. No
request of its own.

The instance keeps each device's latest counts in memory, a WebSocket
device's also in its newest socket's attachment beside `held`, and in the
run (players by their id, the teacher's tabs by role), so whatever write of
the run comes next stores them. Counts never cause a write of their own.
Counts that arrive after the run's last write are in memory when the
summary is made, or lost to a hibernation in between: accepted, the
figures are for orders of magnitude. A teacher role taken by another tab,
or an avatar picked back on another device, replaces the first device's
counts.

The instance adds what only it knows: the kind of room (Peers; steered with
a Remote taken; steered from the wall alone), players not removed,
latecomers, questions played and the quiz's questions, whether it reached
the final ranking, minutes from Start to the final ranking, rows written,
and the longest any device polled: pollers share one awake object, so that,
not their sum, is about how long polls kept it awake.

### What reaches storage

When the class's booking settles (the final ranking, or the quiz's end
before it), the instance reduces the class to one summary of numbers and
sends it with the settle it sends anyway (`moveRows`). `SiteBudget` adds it
into the day's record, which that call writes anyway: sums, and counts of
classes by kind, by size (1, 2–4, 5–14, 15–29, 30 and more players), by
Durable Object requests (under 250, to 999, to 2,999, 3,000 and more), by
rows (under 150, to 499, to 1,499, 1,500 and more), and with at least one
poller. From writes `SiteBudget` makes anyway it also keeps the day's
uploads (the `d:` count, now kept as long as the day's record) and the
most classes booked at once (let in and not yet settled), the owner's
"at once".

Classes turned away, by the cap (uploads a day, bytes stored, the day's
rows), are the figure behind the owner's "beyond that, donations": a
refusal writes nothing of its own, since a script's refused uploads would
otherwise spend rows, so `SiteBudget` counts it in memory and adds it to
the day's record with that day's next write of it, which a busy day has
(a class settling, one let in). Lost with the object's memory before that:
a lower bound.

The project's own runs are kept apart: the simulators and probes upload
through the JSON upload, which no page uses (`root-page.md`), so the
instance marks such a quiz, and its class counts among the day's `probes`
and its summary in `probeUse`, not in `use`. That costs nothing, and
matters because a simulator's class is a class of 25 that the size counts
can't tell from a teacher's (one is to run against the deployed site,
backlog Room item 1). Browser walks upload as a page does and count as
classes; they are classes of one to four.

A lobby never let in books no rows and sends no summary; uploads less
classes counts those. The settle comes before the tail after the lesson
(devices left on the final ranking): nothing writes the run then, so a
summary sent at the quiz's end would carry little more than the settle's,
for a row. The tail is the dashboard's: duration per day against classes,
or one object's metrics.

Not counted: the Function's own errors, which can't be counted without a
request or a row each (Cloudflare's Analytics Engine could, at the price of
Cloudflare-specific code a converting school carries); picture fetches;
which way a quiz was played on the local check (Solo never reaches the
server, by design, `local-check.md`; counting the choice costs a request
and a row each).

### How long, by kind

What the figures are for changes after a month, from what is happening now
to how it moves. So a day's record lives 31 days, as the day records did;
then it is folded into its month's record (sums added, the most at once and
the busiest day kept) and the day is deleted, in one write. Month records
live 24 months: two school years side by side, the shortest span that shows
a trend through a school year's holidays.

- **Use** — uploads, classes, probes, classes turned away, kinds, sizes,
  how far, minutes, the most at once, the busiest day: day and month. The
  owner's threshold is in classes a day and at once.
- **Cost** — rows, requests, devices on long-poll, poller seconds and the
  awake seconds, reconnects, sleeps: day and month. The drawer's ideas wait
  for a cost per class to grow as well as a number of classes.
- **Problems** — failed and silent sockets, the spent allowance seen,
  script errors, and the probes' figures: the day only. They are for noticing and fixing what fails now; a month
  later they describe a site that may have changed since.
- The full days and the upload attempts by format keep their own spans,
  unchanged (the landing's own-copy line; `root-page.md`).

Folding and pruning ride on `SiteBudget`'s writes at an upload and at
letting a class in: a few rows a day, none per class.

### Who reads it

The owner, behind a key: `GET /api/site/use` with `Authorization: Bearer
<key>` answers the day records (rows, use, cost, problems), the month
records and what is booked now. The key is the Pages project's secret
`OWNER_KEY`, compared in the Function; without it set the address answers
404, so a copy shows nothing until its owner sets one. `GET /api/site`
answers `full` alone, for the landing. Nothing identifies anyone, but the
figures are the owner's to read, not the public's.

Reading it (each day: `classes`, `use`; each month: `use`):

- Classes a day: `classes` less `probes`. At once: `atOnce`, which counts
  bookings, so a lobby let in and left, or a quiz left before its final
  ranking, counts until it expires three hours after its last step.
- How far: `use.final` of `use.classes`, `use.played` of `use.questions`.
- Requests: Durable Object requests per class in `use.requests`, counted
  as HTTP requests plus sockets opened plus one per twenty messages; a
  class's Function requests are about its HTTP requests plus its sockets.
  Uploads, joins and pictures come on top (Cloudflare's dashboard has the
  day's totals).
- Duration: `use.awakeS` times about 0.128 GB-s is what classes' polls
  cost of the day's 13,000 GB-s, the lesson only (the settle comes before
  the tail).
- The buckets' edges are `edges` (lower edges: players, requests, rows).
  If they change, months before the change hold the old ones.
- `refused`: classes turned away, a lower bound.

### What would count as identifying

Anything that ties a figure to a person, a device, a quiz or an instance:
an address, a token, a player or instance id, the quiz's code or title,
quiz text, free text of any kind, a time finer than the day. None leaves
the instance; per class and per device, the counts are deleted with the
quiz. A day with one class shows that class's figures; it names nobody.

## Not known

- How far the counts after the run's last write fall short, with a
  hibernation between them and the settle.
- Whether the buckets' edges fall where classes differ; they are from the
  estimates in `scaling-drawer.md` (a class on WebSockets some 250 to 430
  Durable Object requests, a polling one some 3,000; with item 1 a class
  of 25 writes about 250 rows, before it about 1,300).
- Whether a busy day's refusals reach its record: they ride on a later
  write of it, which a day full of rows may not have once its classes have
  settled.
- Whether the device's counts read as intended on real devices: checked
  with the simulators and one Peers walk in headless Edge, not on a
  tablet.
