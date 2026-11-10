# The owner's page

Backlog, "Room on the Free plan", item 2 (`telemetry.md`, "Who reads it").
The page is the implementer's shape for the owner's "small owner page would
be useful", offered as "a small owner page that asks for the key once,
keeps it in the browser, and fetches with the header" (2026-11-09).

## Purpose

The owner reads the figures behind his decisions about the site (usage,
problems, whether the Free plan still carries it; `scaling-drawer.md`)
without a terminal, and the key that guards them stays out of URLs,
history and anything shared.

## Situation

- The figures are `GET /api/site/use` with `Authorization: Bearer <key>`,
  and 404 without the key, with a wrong one, and on a copy that has none
  set (`telemetry.md`, "Who reads it"). A browser's address bar can't send
  the header.
- Every page of the site is public (`hosting-and-limits.md`). The page can
  hold no figure and no key; what it holds is its words.
- A key typed into a page lives where that page's origin keeps data. The
  site's Content-Security-Policy allows scripts only from its own files
  (`hosting-and-limits.md`), which is what keeps another script from
  reading it.
- The figures hold a few days now, and the months fill as days pass 31.

## How the site meets it

`/owner` (`src/public/owner.html`, `client/owner.ts`, the arithmetic in
`client/owner-figures.ts`). Nothing on the site points to it: not the
landing, the guidance, the 404 page or `robots.txt`; the page says
`noindex`. Someone who finds it sees a heading and a box for a key, and
nothing else: everything below is written by the script after the site
has accepted a key.

The key:

- Typed in a password field with no `name`, in a form that is never
  submitted: no address, no form field, no history entry carries it. A
  request goes out only as the header, with no referrer.
- Kept in this browser's `localStorage` once the site has accepted it, so
  it is asked for once; not kept for a key the site refused. The page
  shows that the key is not kept when the browser won't keep it.
- Not shown after it is typed; the page's figures, which a screenshot or a
  shared screen carries, hold no key. "Forget the key" removes it.
- A key the site stops accepting (changed on the Pages project) is dropped
  and asked for again. The site answers 404 to that and to a copy with no
  key set alike, and the page says so in those words. A site that can't be
  reached keeps the key.

The figures, as `telemetry.md`, "Reading it", gives them:

- **The latest day**: the classes (less the project's own runs) and the
  most at once as figures, with nothing to measure them against: how many
  classes a day the site carries is for the figures to show. Beside them,
  gauges against the plan's real limits: the ledger in each of its three
  allowances (rows, requests, awake seconds) against the classes' share,
  which is what letting a class in is refused by; then the settled classes'
  Durable Object requests against 100,000 and held-poll duration against
  13,000 GB-s. The last two are from what devices report: requests count sockets as one for each device not on long-poll
  plus its reconnects (the sums hold no count of sockets opened), and
  duration is `awakeS` at 0.128 GB-s a second. They leave out uploads,
  joins and pictures, and say so; the Cloudflare dashboard has the totals.
- **Days**, **Months**: one row each, the same figures, refusals as the
  caps that turned a class away.
- **The classes**: over the days on record, the room kinds, the size,
  request and row buckets (named from the edges the answer carries), how
  far classes got, the share of devices and classes on long-poll,
  reconnects per device.
- **Problems**: by the day, as kept. The project's own runs apart, under
  a heading that is closed until opened.

The page reads when it opens and again on "Read again"; nothing polls.

## Not known

- Whether the plan's figures on the gauges (100,000 requests, 13,000 GB-s)
  are the plan's today: they are written into `client/owner-figures.ts`
  from `hosting-and-limits.md`.
- Stored bytes against the plan's 5 GB and `MAX_LIVE_BYTES`: the figures
  don't carry them (the day records hold the caps' refusals, "bytes"
  among them), so there is no gauge for them.
- Whether the requests estimate is near. It is the one derived figure that
  isn't a sum the site keeps.
- Whether `localStorage` is the right place for a key the owner may
  type on a shared computer; the page forgets it on request and nothing
  else does.
- How it reads on the owner's own screens: checked in headless Edge,
  desktop and phone width, light and dark, against a local stack and
  invented figures, not with a month of real ones.
