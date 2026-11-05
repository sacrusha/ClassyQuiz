# Hosting and limits

## Purpose

The site is a tool, not a product, so it has no domain of its own and runs on
the owner's Cloudflare Free plan, designed to stay within that plan for a few
users. Usage limits nudge heavy use toward self-hosting. Three things follow
from that, and this file is about them:

- the address a teacher, an AI and children meet;
- how long a quiz lives on the server, so that "nothing public, nothing kept
  beyond its use, nothing identified" holds (backlog Constraints);
- what the site does when one class, one script or the whole day's traffic
  threatens the plan's limits, so that an accident or a casual prank doesn't
  take every class down.

## Situation

- **The plan.** Cloudflare's Free limits are account-wide and reset at
  00:00 UTC: 100,000 Function requests, 100,000 Durable Object requests,
  100,000 rows written, 5 GB stored in all. Past any of them, further
  operations of that type fail. One class that spends the day's allowance
  spends it for every class on the site. Only `/api/*` runs code; static pages
  and scripts don't count.
- **What a class costs.** A class of 25 over 15 questions costs about 1,300
  rows (answers 2 rows each, teacher steps about 4), a few hundred requests on
  WebSockets, and about 3,000 Function and 3,000 Durable Object requests if
  the whole class is on the HTTP long-poll fallback for 15 minutes. That is
  some 75 classes a day on rows and 30 with every device polling. The
  landing page's "room for a few dozen classes a day" rests on this
  (`shared/limits.ts`, comment on `MAX_UPLOADS_PER_DAY`).
- **No edge to defend with.** A `pages.dev` address has no zone, so no WAF and
  no rate-limiting rule: every request reaches the Function and counts,
  rejected or not. A determined script can spend the day's requests and
  nothing on this plan prevents it. The remedy is self-hosting, or a domain
  with a rate-limiting rule at the edge (the Free plan includes one such
  rule); that would reopen the no-domain decision, an open question with the
  owner (backlog, open list).
- **The threat is accident, not malice.** The Project's "a normal user who
  can't use it, not a malicious one" (backlog): children hammer buttons, a
  tablet is left on over the weekend, a class is bigger than the design
  target of about 25. Automated vandalism from outside the class is the
  realistic exception and the open one (v2 item 4).
- **School filters.** Shared subdomains such as `*.pages.dev` are sometimes
  blocked by school web filters because of phishing abuse. Whether the target
  schools let `pages.dev` through, and whether the AIs' user-triggered
  fetchers can read a page on it, is not established. An own domain would be
  the remedy.
- The classroom and devices designed for are in the backlog's Project
  section.

## How the site meets it

### The address and the two deployables

The address is `classyquiz.pages.dev`; children may type it, and the
guidance an AI reads has to contain the full address, since "told the site's
name" means the whole address. The owner prefers `pages.dev`.

Two things are deployed (`npm run deploy` does both, the state Worker first,
which is the order a new Durable Object migration needs):

- the Pages project `classyquiz` (`src/wrangler.toml`): the static pages and
  the `/api` functions;
- the Worker `classyquiz-state` (`src/server/wrangler.toml`): only the Durable
  Objects, with no public address (`workers_dev = false`). Pages can't define
  Durable Objects, so the functions bind them by script name.

Rejected, with the reason still true: one Worker with static assets has one
deployable but an address of the form `classyquiz.<account>.workers.dev`,
longer to type; Pages calling a `workers.dev` API directly needs two
addresses that school filters must both let through, plus cross-origin
WebSockets.

Parsing a quiz at upload happens in the Durable Object, not the Function: a
Function on Free has 10 ms of CPU, which a long text could exceed. Nothing is
stored when the quiz has errors. Storage is SQLite-backed Durable Objects, the
only kind on Free.

### What a fetcher meets besides the pages

An AI's fetch tool may read `/robots.txt` before the page and keep its
verdict, possibly per host as written, so `classyQuiz.pages.dev` and
`classyquiz.pages.dev` can hold different verdicts. Pages serves `index.html`
with a 200 for any path without a file unless the site has a `404.html`, which
gave robots parsers the start page's HTML. So the site has a real
`robots.txt` that allows everything, and a `404.html`: an unknown path gets a
404 and the list of real addresses, never the start page under a wrong name.
No page depends on the fallback; codes travel in the hash or query. Paths are
case-sensitive on Cloudflare (not under local `wrangler pages dev` on
Windows), and every address the site shows is lower case.

### A copy's own address

A self-hoster's copy is built under another name. The build
(`src/scripts/build.mjs`) writes `<name>.pages.dev` (the `name` in
`wrangler.toml`), or `SITE_ADDRESS` when set, into the start page's mentions
of the address: the Build step, and the own-copy and layout links. That is for
AIs, which read the page without its script. The script shows the address the
browser opened, which also covers a name that was taken. `own-copy.html` keeps
the demo's name.

The refusal messages in `shared/limits.ts` (`OWN_COPY`) still name
`classyquiz.pages.dev/own-copy`, so a copy shows the demo's address there. A
copy that raises its limits rarely shows them.

### What lives, and for how long

Keeping a quiz on the server serves one purpose: a device that lost its
connection, for whatever reason, gets back into the quiz in progress. The
breaks a lesson resumes after are the short break and, less often, lunch,
with the projector likely left on the quiz; Swiss midday breaks run up to
about two hours. The next day is not one. Seeing results after an accidental
close is not a reason to keep anything; it has other answers.

So the rule is one, and the same everywhere: everything is deleted three
hours after the teacher last used the quiz, or when the teacher ends it. One
duration is sensible and easy to say, and the page says it as such. The
teacher's file, the text or file the AI produced and still has in the chat,
is the durable copy. Storage during the lifetime is Durable Object storage, so
the instance survives devices dying and the server going idle.

As built:

- The instance ends 3 hours after its last activity (`INSTANCE_IDLE_MS`,
  `server/instance.ts`; activity is the upload, a teacher's step, a role
  taken), or when the teacher ends it. Everything in it is then deleted: quiz,
  runs, players, answers, pictures, the join code's claim and the site's
  booking. Students joining or reconnecting don't count, so a projector or
  tablets left on don't keep a quiz alive.
- A run's players, answers and scores are deleted 3 hours after its final
  ranking (`RUN_KEEP_MS`), and a class nobody steers for 3 hours ends
  (`CLASS_IDLE_MS`, from the teacher's last step or the last student
  joining). Both are covered by the instance's 3 hours: the final ranking is a teacher step, and the class's idle clock
  never starts before the teacher's. They stay as constants until "Upload is
  start" removes the runs.
- Corrections made during a run (a key change, a voided question) apply to the
  instance's quiz and are lost when it ends; the teacher's copy still has the
  wrong key. The Later item "corrected quiz download" is what closes that.
- Logs keep no quiz content and no IP addresses: the state Worker has
  `observability` off, and Pages Functions' logs are not stored (only streamed
  while someone tails them). Error logs carry the message only.

The durations are single constants in code.

Pending: backlog v4 item 3 ("Upload is start") makes a quiz one class's
lesson, so the instance with several runs, "another class with this quiz"
(the `again` command) and the lobby reopening after the ranking go.

### Protecting the day's allowance

Numbers live in `shared/limits.ts` unless noted; a self-hoster raises any of
them, and the README points self-hosters there.

- **Hammered buttons.** Children hammer a button, and every stored tap is 2
  rows, so one class making a game of it could spend the account's day. The
  device doesn't send an answer it already shows as chosen; the server doesn't
  store a tap that changes nothing (a resend, or the same answer again; the
  newer sequence number is kept in memory, so a late older tap still loses);
  changes of mind are capped at `MAX_ANSWER_CHANGES` (10) per student and
  question, and past that the device shows the answer that counts.
- **Players per class: `MAX_PLAYERS` (60), removed avatars included.** The run
  is one stored value rewritten with every answer and must stay under the 2 MB
  a value holds; the projector draws every avatar. A larger group is what an
  own copy is for.
- **The door** after the start (`DOOR_OPEN_MS`, `MAX_LATE_JOINERS`) and
  Remove that sticks bound who joins a class under way: `class-and-wall.md`,
  "The door".
- **The site's share, booked.** `SiteBudget` (`server/budget.ts`), one Durable
  Object for the whole site, books every quiz that parses against two caps:
  `MAX_UPLOADS_PER_DAY` (300, back at 00:00 UTC) and `MAX_LIVE_BYTES` (1 GB of
  quiz text plus pictures stored at once, back as quizzes end or expire).
  Storage is the limit that doesn't reset at midnight: filled, every write on
  the account fails, answers in running classes included. A quiz with errors
  books nothing. Ending a quiz releases its booking; a booking also lapses at
  the end of its code's claim, which is renewed alongside it, so a lost
  release can't fill the ledger for good. Per quiz it holds an id, a size and
  an expiry; per day a count; nothing about the quiz or who made it. It also
  keeps the UTC days on which it refused an upload for 31 days, for the
  landing's own-copy line (backlog v4 item 4; the landing is `root-page.md`).
- **A refused upload says which cap it hit.** The two caps free up
  differently, so `SiteBudget.reserve` answers `true`, `"uploads"` or
  `"bytes"` and the failure carries it as `full`, beside `error`
  (`siteFullMessage` in `shared/limits.ts`, English, for any reader that
  doesn't know `full`). The uploads cap says the site takes new quizzes again
  at 01:00 Swiss time (`quotaResetAt`; "00:00 UTC" without time zone data);
  the bytes cap says it does once others have ended or expired, three hours
  after their last use (`INSTANCE_IDLE_MS`). Both point to the own-copy page
  as the self-hosting nudge, and show to the teacher as a message, not as a
  problem to copy for the AI. Wording on the screen is in
  `client/landing-text.ts` (`siteFull`), in the four languages.
- **A request body without a length.** Every POST to an instance is read in
  the Function and capped at 20 KB (`MAX_COMMAND_BYTES`,
  `functions/api/[[path]].ts`) whatever its Content-Length says, and forwarded
  as text; JSON uploads are capped likewise at twice `MAX_QUIZ_BYTES`
  (200 KB). A chunked body that reached the instance whole could reset a
  class's instance mid-lesson. Uploads with pictures need a length and are
  bounded by `MAX_UPLOAD_BYTES` (16 MB, `shared/protocol.ts`); picture limits
  are in `pictures.md`.
- **Content-Security-Policy** on every page (`src/scripts/build.mjs`, emitted
  as `_headers`): scripts only from the site's own files, no plugins, no
  `<base>`, forms to the site, no framing; pictures also as `blob:` (the
  projector fetches pictures into object URLs).
  Styles stay open because the pages set many inline; WebSocket addresses stay
  open (`ws: wss:`) because matching them by `'self'` is uneven on the older
  browsers school devices run. It is the second layer behind escaping: quiz
  text is the teacher's AI's and shows on every screen of the class, so a slip
  in a page that builds HTML from it must not run as script.

### When the allowance runs out anyway

Devices say so instead of showing the offline dot: `quotaMessage`, "The free
site has used up today's allowance. It works again at 01:00 Swiss time", the
hour computed (02:00 in summer), with the own-copy pointer. Joining and
uploading on the root page show the same words. The mapping: the Function
turns a platform error that reads like a spent limit (`isQuotaError`, matched
on "free tier", "daily limit", "quota") into `{error: "quota"}` (503); an
instance whose write fails that way answers `{t: "quota"}` and reloads its
state from storage, so nothing shows that isn't stored; the client also takes
a 429, or a page mentioning error 1027, as spent. What devices do afterwards
(asking once a minute, resending a step) is in `connections.md`.

### What is not limited, and why

- **Class codes, uploads, roles: no rate limit.** A refused request still
  costs the Function request it was meant to save; counting in a Durable
  Object costs a Durable Object request per guess, as much as the lookup it
  protects; Cloudflare's Rate Limiting binding is per location and
  approximate, its docs advise against keying by IP, and Free/Pages support
  isn't documented. A wrong class code finds no instance to count in. What a
  guess wins is an avatar in someone's class, which the player cap, the door
  and Remove handle. IP keying also misfires on school NAT, where a class
  shares one address. The one exception is wrong teacher codes, limited in
  the quiz's instance, which the check reaches anyway; that is
  `teacher-devices.md`.
- **Bidi characters in quiz text are not stripped.** The only text anyone sees
  is the teacher's own quiz on their own class's screens (avatars are
  assigned, nobody types a name), and stripping could damage legitimate
  right-to-left text. Isolating quiz text with `unicode-bidi: isolate` is
  display hygiene for whoever next touches the screens.

## Not known

- Whether the AIs' user-triggered fetchers read a page on `pages.dev`, and
  whether the target schools' filters let `*.pages.dev` through. ChatGPT
  failed to read the site depending on how the address was capitalised, and
  Claude and Gemini had access failures that may be the same thing. A robots
  verdict cached per host spelling is the working explanation, not a
  confirmed one; cached verdicts expire on the fetcher's schedule.
- The wording of the platform's error when an allowance is spent, and what
  Cloudflare returns once Pages Functions pass their requests (the Workers
  docs say error 1027; status and Pages behaviour aren't documented).
  `isQuotaError` is a best reading.
- Whether the numbers (300 uploads, 1 GB, 60 players, 5 late joiners,
  3 hours) fit real use; no deploy log or dashboard figures yet.
- Whether teachers are seen with more than five latecomers, or re-uploading
  after the 3 hours.
- German, French and Italian wording of the two caps' messages, by a native
  reader; the caps' wording has not been seen in a browser.
- Whether a domain with an edge rate-limiting rule becomes necessary.
- Whether the class cost above, and so the capacity sentence, still holds now
  that a question steps through four or five states, each a view to every
  device; it was derived when a question had three.
