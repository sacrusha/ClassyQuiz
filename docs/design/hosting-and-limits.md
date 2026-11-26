# Hosting and limits

## Purpose

The shared site runs on the owner's Cloudflare Free plan (backlog,
Constraints). Within that plan, no class under way meets a spent allowance,
while most of the day's allowance stays usable, and lobbies no class joins
don't crowd out those a class does.

A quiz is kept on the server so that a device that lost its connection gets
back into the quiz in progress, and for nothing else: "nothing kept beyond
its use" (backlog, Constraints).

## Situation

### The plan

- Free limits are account-wide and reset at 00:00 UTC: 100,000 Function
  requests, 100,000 Durable Object requests, 100,000 rows written,
  5,000,000 rows read, 13,000 GB-s of Durable Object duration, 5 GB stored.
  Past any of them, further operations of that type fail, for every class
  on the site. Stored bytes don't reset: filled, every write on the account
  fails. Only `/api/*` runs code.
- Past the day's Function requests Cloudflare answers in the Function's
  place: its Workers docs name the Worker bypassed or an error 1027 page;
  its Pages docs name neither. Bypassed, the static server answers a POST
  with an empty 405 and a GET with the site's 404 page (seen 2026-11-25).
  The client takes any of these as the allowance spent, on the plausible
  assumption that nothing else answers a device's POST with an empty 405.
- Incoming WebSocket messages count twenty to a Durable Object request,
  outgoing ones not at all; auto-answered pings cause no invocation. A held
  long-poll is a Function and a Durable Object request and keeps the object
  awake for its whole hold, about 0.128 GB-s a second (measured once on a
  Worker of its own): duration is billed per awake object at 128 MB,
  whatever it holds, and shared by every device on it.
- A Function on Free has 10 ms of CPU, too little to parse a long quiz;
  a stored value holds at most 2 MB.
- A `pages.dev` address has no zone: no WAF, no rate-limiting rule. Every
  request reaches the Function and counts, refused or not, so a script can
  spend the day's requests; only a domain with an edge rule (Free includes
  one) or an own copy stops that. A limit inside the site saves nothing: a
  refused request is already spent, counting in a Durable Object costs a
  request per guess, Cloudflare's Rate Limiting binding is per location and
  approximate, and an IP key misfires on school NAT
  (`teacher-devices.md`, "Addresses").
- Pages serves `index.html` with a 200 for any path without a file unless
  the site has a `404.html`; AI fetchers' robots parsers then read the start
  page. Paths are case-sensitive on Cloudflare, not under local
  `wrangler pages dev` on Windows. A fetcher may keep its robots verdict per
  host spelling.
- Pages Functions' logs are not stored, only streamed while someone tails
  them; the state Worker has `observability` off.

### The address

`classyquiz.pages.dev`. Children may type it, and an AI told the site's
name needs the whole address. Shared subdomains such as `*.pages.dev` are
sometimes blocked by school filters because of phishing abuse; an own domain
would be the remedy.

### What a class costs

Estimated for 25 over 15 questions; nothing measured yet (`telemetry.md`).

- Rows: about 250, with a most a class can write (`server/rows.ts`).
- Requests: on WebSockets about 200 Function and 250 Durable Object
  requests; with every device on long-poll about 3,000 of each for 15
  minutes, growing with how long devices stay on.
- Duration: on WebSockets next to nothing. While any device polls, polls
  follow each other within 0.3 to 1.5 s, so one polling device keeps the
  object awake for the whole lesson: about 340 GB-s for 45 minutes, with no
  most.
- So the day carries some 400 classes on rows and WebSocket requests, some
  33 with every device polling, some 34 with one poller in every class. The
  capacity sentence, "a few dozen" quizzes a day on `/own-copy` and in the
  README, rests on this.
- A Peers room's view changes with every friend's answer and look. On a
  WebSocket that costs nothing; ending a held poll for each change would
  cost some 10,000 requests of each kind for 25 players, a tenth of the day.
- A device polls only after three WebSocket attempts failed or stayed
  silent (`connections.md`). Plausible assumption: the first users come
  from Kahoot, which runs in schools over WebSockets, so networks that block
  them are rare among them. That leaves filters that treat `*.pages.dev`
  apart, and the site's own fallback, which a crowded access point can set
  off. Since one poller keeps the object awake, a small share of devices is
  a large share of classes: at 2% of devices, about 4 classes in 10.
- The booking for a class not yet there (a tenth of its devices polling,
  the object awake four classes in ten) is a pessimistic guess for
  telemetry to replace.

### Who opens a lobby

Plausible assumptions the booking rests on:

- Once the site is advertised, the commonest lobby is someone looking at
  what a room is, a few hundred a day, more in a flood after a post or a
  video spreads. They tap through, maybe Start, some with a phone of their
  own joined, and have no reason to close it; their quiz is the example
  (about 40 KB) or their own, a few MB with pictures. At the server they
  look like a class until a class arrives. A Peers room opened alone is the
  same. Pages, film, examples and Solo cost the plan nothing, a file opened
  only its format's count (`root-page.md`, "Upload attempts by format").
- A teacher lets the class in when it is there or about to come, within a
  break's length (Swiss breaks run 5 to 20 minutes), and starts once it is
  in.
- A group playing is heard from every few seconds; a phone locked or put
  away not at all.
- A school's classes break at the same times, so a school's bookings would
  shrink and come back together.
- The breaks a lesson resumes after are the short break and lunch; Swiss
  midday breaks run up to about two hours, and the next day isn't one. The
  three-hour lifetime rests on this.
- A quiz is sometimes walked to another device: one teacher uploads from a
  phone and takes the projector in, another runs it later. The server's
  copy is then the only one besides the file.
- A student who joined the wrong quiz may want back into the one before; a
  join elsewhere says nothing about the first being done.

### Own copies

On another Cloudflare account an own copy is the same site under another
name. On a teacher's laptop it rarely works: school Wi-Fi often blocks
traffic between devices, the laptop is often school-managed, and without
HTTPS tablets get no screen wake lock. A school's own server avoids all
three, and an outside service, which at a school may need a data protection
review first. The README's "On a school's or company's own server" is what
the school's AI converts from.

### What the limits don't cover

- A lobby that waits longer than three hours for its class ends: the
  teacher who opened it early, the walked quiz.
- Lookers' own picture quizzes, some 300 held three hours, reach
  `MAX_LIVE_BYTES` and refuse uploads a class would have joined
  (`scaling-drawer.md`, "Stored data: pictures").
- What a quiz spends before its class is let in, or after its booking
  lapsed, is booked by no one. A projector on long-poll in a lobby costs
  some 300 awake seconds. Of the day's some 101,000, classes may book
  80,000 (`DAY_FOR_CLASSES`); the 21,000 left are some 70 such lobbies, the
  whole 101,000 some 340, past which every object on the
  account stops, classes under way included. Plausible assumption: lookers
  are on home and office networks that pass WebSockets.
- Rows read: calls spaced to wake `SiteBudget` every 10 s all day could
  read some 2.5 million of the 5,000,000. What the other objects read is
  not estimated.
- A script hammering `/api`.

## Not known

- Whether the class cost, and so the capacity sentence, still holds now
  that a question steps through four or five states, each a view to every
  device; it was derived when a question had three.
- The share of classes with at least one poller, and how much of it the
  site's own fallback makes.
- How many lobbies are looks, how far they go, and what they upload; how
  long a lobby opened early waits for its class; how often a quiz is walked
  to another device.
- Whether the caps and the three hours fit real use.
- Whether AI fetchers read a page on `pages.dev`, and whether the target
  schools' filters let it through. ChatGPT failed to read the site depending
  on the address's capitalisation, and Claude and Gemini had access
  failures that may be the same; a robots verdict cached per host spelling
  is the working explanation.
- Which answer a Pages project gets past the day's Function requests, and
  the wording of the platform's error when rows, Durable Object requests or
  duration are spent (`isQuotaError` is a best reading).
- Whether `ws: wss:` in the Content-Security-Policy still earns its place.
  It is there because Safari before 16 doesn't let `'self'` match a
  same-origin `wss:` address (WebKit bugs 201591 and 235873), and every
  browser on iOS 15 is WebKit; without it the schools' old iPads would fall
  to long-poll. Once iOS 15 no longer matters, or `'self'` alone connects
  on a real iOS 15 device through `/check`, the two schemes can go.
- Whether any school converts the server, and which outside address serves
  a converted copy's own version of the guidance in a way the AIs read.
