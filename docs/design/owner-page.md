# The owner's page

`/owner` (`src/public/owner.html`, `client/owner.ts`, the arithmetic in
`client/owner-figures.ts`).

## Purpose

The owner reads the figures behind his decisions about the site (usage,
problems, whether the Free plan still carries it) without a terminal, and
the key that guards them stays out of URLs, history and anything shared.

## Situation

- The figures are `GET /api/site/use` with `Authorization: Bearer <key>`,
  and 404 without the key, with a wrong one, and on a copy that has none
  set (`telemetry.md`). A browser's address
  bar can't send the header.
- Every page of the site is public. The page can
  hold no figure and no key; what it holds is its words.
- A key typed into a page lives where that page's origin keeps data. The
  site's Content-Security-Policy allows scripts only from its own files
  (`src/scripts/build.mjs`), which is what keeps another script from
  reading it.
- The figures carry no count of sockets opened and no stored bytes, and the
  classes' requests and duration, which devices report, leave out uploads,
  joins and pictures; the Cloudflare dashboard has the plan's totals.

## Not known

- Whether the plan's figures on the gauges, written into
  `client/owner-figures.ts` from `hosting-and-limits.md`, are the plan's
  today.
- Whether the requests estimate is near: it counts sockets as one per
  device not on long-poll plus its reconnects, the one derived figure that
  isn't a sum the site keeps.
- Whether `localStorage` is the right place for a key the owner may type on
  a shared computer; the page forgets it on request and nothing else does.
- How it reads on the owner's own screens: checked in headless Edge,
  desktop and phone width, light and dark, against a local stack and
  invented figures, not with a month of real ones.
