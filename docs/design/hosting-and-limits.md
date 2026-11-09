# Hosting and limits

## Purpose

Monetization is not a concern of the project, so the site runs on the owner's
Cloudflare Free plan, designed to stay within that plan for a few users, and
usage limits nudge heavy use toward self-hosting. It has no domain of its own
(Situation). Three things follow from that, and this file is about them:

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
- **What a Peers room costs** (`peers.md`) is held to what a class costs,
  since the day is the classes'. Its view changes with every friend's
  answer, look and line (who the room waits for, who is away), where a
  class's tablet changes only with its own answer and the teacher's steps.
  On a WebSocket that is a message out, which the plan doesn't count
  (Cloudflare's Durable Objects pricing: incoming messages count, twenty to
  a request; outgoing ones not at all). On the long-poll fallback each would
  answer a held poll, a Function and a Durable Object request: some 10,000
  each for 25 players over 15 questions, a tenth of the day. So such a
  change doesn't end a poll; it comes with the poll's end, at most 25 s
  later (`pollKey`, `server/instance.ts`), and a polling device costs what
  a class's tablet does: its polls, the room's steps, its own answers and
  taps on, about 3,000 of each for 25 players. Rows: each answer 2, as in a
  class, and the taps on from a solution ride on the run's next write, at
  most one a second (`LOOK_WRITE_MS`), as the looks do, so 25 players over
  15 questions write about 1,500 (plausible assumption: friends tap on
  within some seconds of each other; each tap on its own would add 750).
  The booking still counts every tap on (`server/rows.ts`). Pictures: each
  device lays out the question itself, so it fetches the questions'
  pictures and backgrounds as well as the answer pictures' small copies;
  both come in packs of at most 1.5 MB (`pictures.md`), a few requests per
  device, where one by one a quiz with a picture and four picture answers
  per question would cost each device 75 for 15 questions.
- **No edge to defend with.** A `pages.dev` address has no zone, so no WAF and
  no rate-limiting rule: every request reaches the Function and counts,
  rejected or not. A determined script can spend the day's requests and
  nothing on this plan prevents it. The remedy is self-hosting, or a domain
  with a rate-limiting rule at the edge (the Free plan includes one such
  rule); whether to take one is an open question with the owner (backlog, open
  list).
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
- **Where an own copy can run.** On another Cloudflare account it is the same
  site under another name. On a teacher's own laptop it needs no AI and no
  account (the AI only writes the quiz, and the guidance can be read from a
  public copy), but the class's tablets and the teacher's phone must reach the
  laptop over the room's network, which school Wi-Fi often doesn't allow
  between devices; the laptop is often school-managed and can't run a server;
  and without HTTPS the browser gives no screen wake lock. A school's own
  server avoids all three, since the school's IT controls its network and
  certificates, and avoids an outside service, which at a school may need a
  data protection review first.
- **The code is written to be convertible.** The Cloudflare-specific part is
  small and in known files, the logic it calls is pure and tested under Node,
  and `scripts/simulate.mjs` checks any running copy end to end. So a school's
  AI can convert the server to the school's own, and the project maintains
  one server.
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

### A copy on a school's or company's own server

The README's "On a school's or company's own server" is what a school's or
company's AI converts from: what changes, what a converted copy keeps (the lifetime, no logs, HTTPS),
and the two checks it passes. `/own-copy` offers the route to teachers
(`root-page.md`, "The own copy"). The conversion is theirs and is not
checked here.

A converted copy left as it is has one dependency on the live site: a
teacher's AI reads guidance before writing a quiz, and the parser is tolerant
only one way. A quiz from older guidance runs on a newer site
(`quiz-format.md`); a quiz from newer guidance can fail on an older copy. And
the AI can't reach an address inside the school. So the README requires the
converted start page to name an outside address serving its own version's
guidance.

### What lives, and for how long

Keeping a quiz on the server serves one purpose: a device that lost its
connection, for whatever reason, gets back into the quiz in progress.
Plausible assumption: the breaks a lesson resumes after are the short break
and, less often, lunch, with the projector likely left on the quiz; Swiss
midday breaks run up to about two hours; the next day is not one. Seeing
results after an accidental close is not a reason to keep anything; it has
other answers.

So the rule is one, and the same everywhere: everything is deleted three
hours after the teacher last used the quiz, or when the teacher ends it. One
duration is sensible and easy to say, and the page says it as such. The
teacher's file, the text or file the AI produced and still has in the chat,
is the durable copy. Storage during the lifetime is Durable Object storage, so
the instance survives devices dying and the server going idle.

As built:

- The instance ends 3 hours after its last activity (`INSTANCE_IDLE_MS`,
  `server/instance.ts`; activity is the upload, a teacher's step, a role
  taken), or when the teacher ends it (Exit at the final ranking, or Delete).
  Everything in it is then deleted: quiz, its one class, players, answers, pictures, the join code's claim and the site's
  booking. Students joining or reconnecting don't count, so a projector or
  tablets left on don't keep a quiz alive.
- A quiz is one class's lesson (backlog v4 item 3, "Upload is start"): the
  upload starts its one class, and a parallel class gets its own upload. The
  final ranking stays until the teacher's Exit or the 3 hours.
- Corrections made during the quiz (a key change, a voided question) apply to the
  instance's quiz and are lost when it ends; the teacher's copy still has the
  wrong key. The Later item "corrected quiz download" is what closes that.
- Logs keep no quiz content and no IP addresses: the state Worker has
  `observability` off, and Pages Functions' logs are not stored (only streamed
  while someone tails them). Error logs carry the message only.

The duration is a single constant in code.

### Protecting the day's allowance

Numbers live in `shared/limits.ts` unless noted; a self-hoster raises any of
them, and the README points self-hosters there.

- **Hammered buttons.** Children hammer a button, and every stored tap is 2
  rows, so one class making a game of it could spend the account's day. The
  device doesn't send an answer it already shows as chosen; the server doesn't
  store a tap that changes nothing (a resend, or the same answer again; the
  newer sequence number is kept in memory, so a late older tap still loses);
  changes of mind are capped at `MAX_ANSWER_CHANGES` (2) per student and
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
  `client/landing-text.ts` (`siteFull`), shown in English on the local
  check, where the upload happens (`local-check.md`).
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
  open (`ws: wss:`) because Safari before 16 doesn't let `'self'` match a
  same-origin `wss:` address (WebKit bugs 201591 and 235873, fixed in trunk
  April 2022), and every browser on an iOS 15 device is WebKit. Devices that
  can't leave iOS 15 stay in schools; without the rule they would fall to
  long-polling. The Safari release carrying the fix is inferred from dates,
  not tested. It is the second layer behind escaping: quiz
  text is the teacher's AI's and shows on every screen of the class, so a slip
  in a page that builds HTML from it must not run as script.

### Running classes finish

Purpose: when the free plan runs out, it runs out on a new class before it
is let in, where the refusal and the ways to more quizzes are, and never on a
class under way. "Failure in front of the class ends adoption" (backlog,
Constraints).

Situation: of the platform's daily limits, rows written are likely the first
to run out on a busy day, and they run out in the middle of lessons: a class
writes about 1,300 (Situation, "What a class costs"; about 1,000 is the
owner's guess for a real one), so the day carries about 75 classes, while the
upload cap lets 300 quizzes in. The upload and bytes caps count quizzes and
bytes, not what a class writes. How many devices poll, and so whether
requests run out first instead, is not known.

The design is the owner's: quizzes book slots and release them when done,
the booking shrinks at Start, a low cap on changes of mind instead of
overbooking, students only once the class is let in, one stored quiz per
device. The numbers and the rest are the implementer's, to confirm.

- **Students join once the class is let in** (`teacher-devices.md`, "The
  single tab: check, then join"); teacher devices come in at any time. So a
  quiz uploaded only to look it over (for tomorrow, say) writes nothing for
  a class and books nothing; looking it over on the local check, before any
  upload, costs no upload either (`local-check.md`).
- **Letting the class in books the most its class can write**
  (`server/rows.ts`), so nothing is overbooked and no margin is guessed. The
  class isn't known yet, so it is `MAX_PLAYERS`: each joins (2 rows), changes
  look up to `MAX_LOOK_CHANGES` (2 rows each), answers each question at most
  three times (`MAX_ANSWER_CHANGES`, 2: a mis-tap and one rethink, the owner:
  adequate; 2 rows each), plus the teacher's steps. For 15 questions that is
  about 10,700 rows, the looks over two fifths of it. Start without letting in books
  the same. `SiteBudget` keeps the day's ledger (`r:` and the day, back at
  00:00 UTC) against `DAY_ROWS_FOR_CLASSES` (80,000 of the plan's 100,000;
  the rest is for uploads, whose quiz and pictures are rows, the site's small
  objects and what a booking doesn't cover). A class the ledger can't carry is
  refused at the tap, on the teacher's screen with no child in yet; the day
  counts as full. If the ledger can't be reached, the class goes in unbooked
  rather than be stopped by the site's own bookkeeping.
- **The teacher hears before it fails.** The upload's booking answers with
  the day's rows booked, kept with the quiz (`Meta.dayRows`, also after a
  refused tap), and the check (and a Remote's lobby) shows, while fewer than
  `ROOM_WARN` (3) classes like this one fit: "nearly full today: room for
  about n more groups", or at none "can't let another group in today … again at
  01:00 Swiss time", both with "More quizzes: a site of your own, your
  school's or your company's ›" (`roomNotice`, `client/manage.ts`). It lasts while it holds,
  where a toast would be gone before a teacher who looked away saw it. The
  count is from the upload or the last tap, not live; three classes is
  roughly the last third of the day. Days whose bookings reached
  `NEARLY_FULL` (half, the owner's: lower than 80%) count as busy on the
  landing's line beside the full days
  (`root-page.md`, "The own copy").
- **At Start the booking shrinks** to what was written plus the most the rest
  can write: the class that came plus the latecomers the door lets in
  (`MAX_LATE_JOINERS`), the looks fixed. A class of 25 then holds about
  3,200.
- **At the final ranking the booking settles**: the ledger keeps what was
  written (counted per key the instance stores) and gets the rest back; if
  that call fails, the quiz's end settles it instead. The
  quiz itself stays its three hours for photographs and rejoining. A quiz
  that ends or expires before its final ranking settles then.
- So the ledger limits classes at the same time, not in the day: about 7
  lobbies let in at once, or about 24 started classes of 25, while finished
  classes count only what they wrote. The last booking of a busy day leaves
  some of the day unused, which is accepted.
- **A let-in lobby that is left holds its booking**, about 13% of the day,
  until the quiz expires three hours after the teacher's last step. One
  quiz per device bounds that per device: a device's next upload ends its
  previous quiz if that one never started (`POST /api/i/:id/replaced` with
  the previous quiz's secret, sent by the root page once the new upload is
  in; each upload replaces the one before, so only the latest needs asking), so a lobby opened at the
  end of a look-over and left, or a test with a few devices, doesn't pile up.
  A started quiz is never ended this way, so a quiz paused over lunch
  survives a new zip tried on the same laptop. A let-in lobby with children
  in it ends too, and their tablets say the quiz has ended: a new upload
  from the device that steers is taken as the teacher moving on (the right
  quiz after a wrong one), and a lobby whose children count as keeping it
  would let a test with a few devices, left in the lobby, hold its booking
  after all. The device already knows its
  latest quiz and its secret (`root-page.md`, "Coming back").
- **The day's spending, for the owner:** `GET /api/site` answers, beside
  `full`, `rows`: what is booked or spent now, of `DAY_ROWS_FOR_CLASSES`, and
  per day (kept 31 days) the classes let in, the rows written by those that
  finished, and the ledger's peak, so how close a day came to its limit is
  a fact to look up. Nothing about a quiz or who made it.
- A booking made before midnight UTC and moved after it leaves the new
  day's ledger alone: the rare class across the turn writes some rows the
  new day doesn't count.

Cutting a class's rows to about a tenth, by holding answers and looks in
memory: backlog, "Room on the Free plan", item 1.

Not covered: requests. Counting each in an object would itself be a request;
a class on WebSockets spends few, and a script hammering `/api` is the case
for a domain with a rate-limiting rule.

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

- Whether `ws: wss:` in the CSP still earns its place. It exists only for
  iOS 15 and other Safari before 16 (see "Protecting the day's allowance"),
  which the target schools' stock of old iPads keeps in use; a static header
  can't target a version, so every browser gets the wider rule. Reassess when
  the schools' iPads have moved past iOS 15, when the design target is no
  longer a school, or by November 2028; then try `'self'` alone on a real
  iOS 15 device through `/check`, and drop the two schemes if the WebSocket
  connects or iOS 15 no longer matters.
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
- Whether any school converts the server, and how its AI fares with the
  README section; and which outside address serves a converted copy's own
  version of the guidance in a way the AIs read (the guidance page on GitHub
  at the converted commit is the obvious candidate, unread by any AI so far).
- Whether the class cost above, and so the capacity sentence, still holds now
  that a question steps through four or five states, each a view to every
  device; it was derived when a question had three.
