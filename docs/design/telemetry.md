# Telemetry

## Purpose

A handle on usage and on problems, without violating privacy. The site's
limits, the capacity
sentence (`hosting-and-limits.md`), the caps and the scaling drawer's ideas
rest on figures nobody has measured; telemetry gives them without identifying
anyone and without spending what it measures. The owner alone reads it,
behind `OWNER_KEY` (`owner-page.md`). After a month the use narrows to
seeing a trend, and different data may need different treatment.

## Situation

- Nothing that leaves an instance ties a figure to a person, a device, a
  quiz or an instance: no address, token, id, code, title, quiz text, free
  text, or time finer than the day. The counts per class and per device
  are deleted with the quiz. A day with one class shows that class's
  figures; it names nobody.
- Cloudflare's dashboard has the account's daily totals and one object's
  metrics by its id; the deploy token has no analytics permission
  (`secrets/README.md`). Telemetry says what the totals are made of. The
  platform's costs measured once: `hosting-and-limits.md`, "The plan".
- Counts ride on writes the site makes anyway, and an object loses its
  memory when it hibernates, so counts that arrive after a class's last
  write can be lost: the figures are for orders of magnitude.
- Not counted: the Function's own errors (each would cost a request or a
  row; Cloudflare's Analytics Engine would add Cloudflare-specific code a
  converting school carries), picture fetches, and how a quiz was played on
  the local check, since Solo never reaches the server.
- The project's simulators and probes mark their upload (`probe: true`)
  and are counted apart from `use`; any script can send the mark too, which
  hides its classes from `use` and nothing else. Browser walks upload as a
  page does and count as classes of one to four.
- Reading the figures: `refused` is a lower bound, since a refusal is held
  in memory until the day's record is next written; `atOnce` counts
  bookings, so a lobby let in and left counts until it expires; `awakeS`
  times about 0.128 GB-s is what the lessons' polls cost, without the tail
  of devices left on after the final ranking, which only the dashboard
  shows. Months before a change of the buckets' `edges` hold the old ones.

## Not known

- How far the counts after a class's last write fall short.
- Whether the buckets' edges fall where classes differ; they are from the
  estimates in `hosting-and-limits.md`, "What a class costs".
- Whether a busy day's refusals reach its record, when no write of it
  follows once its classes have settled.
- Whether a device's counts read as intended on a tablet and behind a real
  school filter. In headless Edge, with a refused upgrade, a socket that
  drops every frame and a reload imitated in the page, the class's figures
  were the devices' own counts; a real filter may fail in a way not
  imitated. The simulators send lines of their own making, which test the
  server's side only.
