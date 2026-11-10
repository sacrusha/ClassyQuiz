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
  100,000 rows written, 13,000 GB-s of Durable Object duration, 5 GB stored
  in all. Past any of them, further operations of that type fail. One class
  that spends the day's allowance spends it for every class on the site.
  Only `/api/*` runs code; static pages and scripts don't count.
- **What a class costs**, for 25 over 15 questions, estimated, nothing
  measured yet (the figures come with telemetry, `telemetry.md`):
  - Rows: about 250, most of them the teacher's steps. Answers and looks are
    held in memory and ride on those writes (`open-period-in-memory.md`,
    "Rows"). The same on any transport, and bounded: the caps give a class
    a most it can write (`server/rows.ts`).
  - Requests: on WebSockets about 200 Function and 250 Durable Object
    requests; with every device on the HTTP long-poll fallback about 3,000
    of each for a 15-minute run, growing with how long devices stay on
    (`scaling-drawer.md`, "Requests").
  - Duration: on WebSockets next to nothing. A single polling device keeps
    the object awake: about 340 GB-s for a 45-minute lesson, about twice
    that with a device left polling on the final ranking until it sleeps
    (`scaling-drawer.md`, "Duration"). One poller costs a class nearly all
    of it. Also growing with time, with no most a class can spend.
  - So the day carries some 400 classes on rows and on WebSocket requests,
    some 33 with every device polling, some 19 to 38 with a poller in every
    class. What binds first turns on the share of classes with at least one
    poller, which isn't known. The landing page's "room for a few dozen
    classes a day" rests on this (`shared/limits.ts`, comment on
    `DAY_ROWS_FOR_UPLOADS`).
- **Which devices poll.** A device polls only after three WebSocket attempts
  in a row failed or stayed silent, and then for the rest of its page's life
  (`connections.md`). Plausible assumption: the first users come from
  Kahoot, which runs in schools on a socket connection (reportedly CometD
  over `wss://kahoot.it/cometd/…`, as its community clients connect; not
  checked against Kahoot's own pages, and whether it falls back to
  long-poll is not established). A school network that runs
  Kahoot passes WebSockets, so blocking across a whole network is rare among
  them. What that doesn't cover: a filter that treats `*.pages.dev` apart
  from `kahoot.it`; the site's own fallback, which a crowded access point
  can set off with no filter involved, a share the site makes itself; and
  that duration turns on any poller in a class, so a small share of devices
  can be a large share of classes (at 2% of devices independently, about
  4 in 10 classes of 25 and a wall).
- **Who opens a lobby.** Opening a Quizmaster or Peers room is the upload
  (`local-check.md`); letting the class in is one tap from the lobby's check
  (`teacher-devices.md`, "The single tab: check, then join"). At the server these lobbies look alike until a class
  arrives:
  - Someone looking to see what the room is and whether the site is for
    them. Likely the most common once the site is advertised, a few
    hundred a day plausibly. They have no reasonable way to close it, and
    offering one would be a minor optimization. Plausibly they tap through
    to the join screen, maybe Start. Their quiz is the example (about
    40 KB) or one of their own, a few MB with pictures; a teacher's
    homework quizzes, plausibly played Solo, are never uploaded. A
    forgotten tab on a desktop keeps its socket; a phone or tablet
    suspends it.
  - A teacher opening the lobby on one device before class, going into the
    quiz by the end of the class: 30 minutes, or several hours.
  - A teacher with a projector and a Remote, connections dropping now and
    then, the Remote maybe changed later (`teacher-devices.md`).
  - A quiz walked to another device: teacher A has the file on a phone,
    opens the lobby, takes the school's projector in as the screen and
    leaves; teacher B runs it from the projector later, with or without a
    Remote. File sharing between devices is poor or poorly understood, so
    the site is how the quiz gets there.
  - After the upload no page holds the quiz: the check holds it in the
    page's memory only, and opening the room leaves that page for the lobby
    (`client/entry-quizmaster.ts`). Besides the file, the server's copy is
    the only one.
  - A student who joined the wrong quiz may want back into the one before,
    which is someone else's latest. A player joining another quiz says
    nothing about the first being done.
- **Breaks are shared.** Plausible assumption: a school's classes break at
  the same times, so classes leaving and coming back in are correlated, and
  so are lessons starting on the hour.
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
  taps on, about 3,000 of each for 25 players. Rows: the answers and the
  taps on are held in memory as a class's are, and ride on the room's
  steps (`open-period-in-memory.md`); the booking is a class's
  (`server/rows.ts`). Pictures: each
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
  rule).
- **The threat is accident, not malice.** The Project's "a normal user who
  can't use it, not a malicious one" (backlog): children hammer buttons, a
  tablet is left on over the weekend, a class is bigger than the example
  class's about 25. Automated vandalism from outside the class is the
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
name" means the whole address.

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
checked here (owner: the point of telling them to convert is so we don't
have to).

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

### Protecting the day's allowance

Numbers live in `shared/limits.ts` unless noted; a self-hoster raises any of
them, and the README points self-hosters there.

- **Hammered buttons.** Children hammer a button. A tap is held in memory
  and costs no row (`open-period-in-memory.md`), but each one sent costs a
  request on long-poll, which no server-side cap can save once it has
  arrived. So the device sends the first tap of a burst and then its
  latest, one at a time and at most every `INPUT_GAP_MS` (300 ms), and
  doesn't send an answer it already shows as chosen; a tap that changes
  nothing (a resend, or the same answer again) changes nothing held, the
  newer sequence number kept so a late older tap still loses.
- **Players per class: `MAX_PLAYERS` (60), removed avatars included.** The run
  is one stored value rewritten with every write and must stay under the 2 MB
  a value holds; the projector draws every avatar. A larger group is what an
  own copy is for.
- **The door** after the start (`DOOR_OPEN_MS`, `MAX_LATE_JOINERS`) and
  Remove that sticks bound who joins a class under way: `class-and-wall.md`,
  "The door".
- **The site's share, booked.** `SiteBudget` (`server/budget.ts`), one Durable
  Object for the whole site, books every quiz that parses against two caps:
  `DAY_ROWS_FOR_UPLOADS` (15,000 rows a day, back at 00:00 UTC) and
  `MAX_LIVE_BYTES` (1 GB of quiz text plus pictures stored at once, back as
  quizzes end or expire). The uploads' cap is in rows, what an upload
  spends of the plan (its quiz, each picture and its small records, and as
  many again at its deletion: `uploadRows`, `server/rows.ts`), out of what
  the classes' share leaves; a text quiz is some 15 rows, so about 1,000
  uploads a day, one with 15 pictures some 45, about 330. Rests on: looks
  at the room are likely the most common uploads and no class (Situation,
  "Who opens a lobby"), so a count of uploads, sized on what classes spent,
  would let them spend the day before any class's allowance binds; what a
  class spends is booked apart ("Running classes finish").
  Storage is the limit that doesn't reset at midnight: filled, every write on
  the account fails, answers in running classes included. A quiz with errors
  books nothing. Ending a quiz releases its booking; a booking also lapses at
  the end of its code's claim, which is renewed alongside it, so a lost
  release can't fill the ledger for good. Per quiz it holds an id, a size and
  an expiry; per day a count and the uploads' rows; nothing about the quiz
  or who made it. It also keeps the UTC days on which it refused an upload
  or a class for 31 days, for the landing's own-copy line (backlog v4 item 4; the landing is `root-page.md`).
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
  `client/site-text.ts` (`siteFull`), shown in the visitor's language on
  the local check, where the upload happens (`local-check.md`, "Opening a
  room").
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
Constraints). And most of the day stays usable: what is held for classes and
not spent is the price. The owner, 2026-11-10: avoid mid-quiz "out of
resources for the day" events, while also allowing most resources of the day
to be used. The same holds for stored bytes and the day's uploads: lobbies no
class joins (Situation, "Who opens a lobby") are not to crowd out those a
class does.

Situation: every daily limit runs out in the middle of lessons, since a class
spends as it plays; how each grows with a class, and which binds first, is
in Situation, "What a class costs" and "Which devices poll". The upload and
bytes caps count quizzes and bytes, not what a class spends. Who leaves
lobbies behind, and why a lobby's devices or players can't say it is done:
Situation, "Who opens a lobby". Refusing a teacher with no child in costs
little, refusing a class in front of the children much, failing one under
way most.

The design's frame is the owner's: quizzes book slots and release them when
done, the booking shrinks at Start, students only once the class is let in,
one stored quiz per device, and a class's taps held in memory so that its
booking is small. The numbers and the
rest are the implementer's.

- **Students join once the class is let in** (`teacher-devices.md`, "The
  single tab: check, then join"); teacher devices come in at any time.
- **What a class books, and in what.** `SiteBudget` keeps the day's ledger
  (`r:` and the day, back at 00:00 UTC) in the three allowances a class can
  run out of mid-lesson: rows, Durable Object requests (a class's Function
  requests are about the same) and the seconds its object is awake
  (Situation, "What a class costs"). Each has the classes' share,
  `DAY_FOR_CLASSES`: 80,000 rows, 75,000 requests, 80,000 awake seconds of
  the plan's 100,000, 100,000 and about 101,000. What is left over is for
  what no class books (uploads, whose quiz and pictures are rows; picture
  fetches, joins and the landing; the site's small objects) and for
  estimates that come out low; requests leave more, since more of them come
  from outside a class. If the plan's limits change, or what comes from
  outside a class, the shares are what to revisit.
- **Rows are booked at the most, requests and duration as an estimate**
  (`server/rows.ts`). Rows have a most a class can write, so their booking
  leaves no margin to guess: at letting in `MAX_PLAYERS`, each joining and
  taking an avatar back a few times (6 rows), plus the teacher's steps (20
  rows a question, the alarms among them) and the writes when a line ends
  with input held (`MAX_LINE_WRITES` a stage, 2 rows each;
  `open-period-in-memory.md`), about 1,030 rows for 15 questions. Requests
  and duration have no most, so the booking is what is spent plus an
  estimate of what is ahead, from the scaling drawer's figures (a WebSocket
  device about half a request a question plus its sockets, a poller about
  8 a question; a question about 3 minutes of a lesson). The estimates are
  the drawer's, not measured; telemetry's figures per class are what to
  replace them with (`telemetry.md`).
- **Letting the class in books an estimate for a class not yet there**: 25
  students (the example class) and two teacher devices, a tenth of them
  polling, and the object awake for four classes in ten of the lesson's
  time. Plausible assumptions, kept pessimistic against "Which devices
  poll": if telemetry shows the share of pollers or of classes with one
  lower or higher, these are what moves. Start without letting in books the
  same first. A class the ledger can't carry is refused at the tap, on the
  teacher's screen with no child in yet; the day counts as full. If the
  ledger can't be reached, the class goes in unbooked rather than be
  stopped by the site's own bookkeeping.
- **The teacher hears before it fails.** The upload's booking answers with
  the day's ledger, kept with the quiz (`Meta.day`, also after a refused
  tap), and the check (and a Remote's lobby) shows, while fewer than
  `ROOM_WARN` (3) classes like this one fit in the fullest allowance:
  "nearly full today: room for about n more groups", or at none "can't let
  another group in today … again at 01:00 Swiss time", both with "More
  quizzes: a site of your own, your school's or your company's ›"
  (`roomNotice`, `client/manage.ts`). It lasts while it holds, where a toast
  would be gone before a teacher who looked away saw it. The count is from
  the upload or the last tap, not live. Days whose ledger reached
  `NEARLY_FULL` (half, the owner's: lower than 80%) in any allowance count
  as busy on the landing's line beside the full days (`root-page.md`, "The
  own copy").
- **At Start the class is there, so the booking moves to what was spent plus
  what is ahead of the class that came**: its players and the latecomers
  the door lets in (`MAX_LATE_JOINERS`), its devices as their lines say
  (WebSocket or long-poll), the lobby behind. Awake time is booked only
  with a poller among them, for the questions ahead. A class of 25 on
  WebSockets then holds about 830 rows, 320 requests and no awake time; with
  one poller about 2,700 awake seconds for 15 questions. Rests on: a device's
  line says how it is connected (`telemetry.md`), and one poller keeps the
  object awake for all.
- **Under way, a class that outgrows its booking books more**, never
  refused: a device fell back to long-poll, or the class spends faster than
  estimated. Checked with each teacher step against what the devices'
  lines say; the site's ledger is asked only when the need passes the
  booking by a margin (a tenth of the requests, a question's awake time), a
  request and a few rows each time. Rests on: a fallback mid-lesson is the
  site's own (a crowded access point), so it shows one device at a time,
  and the shares' margin carries it until the next step.
- **A let-in lobby that no student joins within `LOBBY_WAIT_MS` (20
  minutes) gives its booking back** to what it spent; the quiz stays. Its
  first student books it again, and may reach further, to `DAY_FOR_JOINS`
  (90,000 rows, 87,000 requests, 92,000 awake seconds), since the children
  are there and refusing them costs more than refusing the teacher at
  letting in, less than a class under way failing. Past that the join is
  refused, with the same words as at letting in. A Start with no student
  there books only what was spent, and its first student books it the same
  way. Rests on: looks at the room are likely the most common lobbies
  (Situation, "Who opens a lobby"), and look like a class until a student
  comes; a teacher lets the class in when it is there or about to come in,
  within a break's length (plausible assumption: Swiss breaks run 5 to 20
  minutes). If teachers turn out to let in long before, more first
  students reach into the joins' share; if lobbies are rarely looks, the
  wait matters less.
- **A class that has had students keeps its booking until its final
  ranking**, whether or not its devices are there. Rests on: breaks are
  shared across a school (Situation), so bookings that shrank at recess
  would come back at once, into a margin that might not hold them all.
- **At the final ranking the booking settles**: the ledger keeps what was
  spent (rows counted per key the instance stores, requests and awake time
  as the devices' lines say) plus what devices left polling on the ranking
  will spend until they sleep (`SLEEP_AFTER_MS`), and gets the rest back; if
  that call fails, the quiz's end settles it instead, with what was spent.
  The quiz itself stays its three hours for photographs and rejoining. A
  quiz that ends or expires before its final ranking settles then. Rests on:
  nothing writes after the final ranking, and a device left polling keeps
  the object awake as long as during the lesson.
- So the ledger limits classes at the same time, not in the day: some 74
  lobbies let in at once (awake time binds), some 96 started classes of 25
  on WebSockets (rows, booked at their most), some 30 with a poller (awake time), while
  finished classes count what they spent. The last booking of a busy day
  leaves some of the day unused, which is accepted.
- **One quiz per device.** A device's next upload ends its previous quiz if
  that one never started (`POST /api/i/:id/replaced` with the previous
  quiz's secret, sent by the local check once the new upload is in; each
  upload replaces the one before, so only the latest needs asking).
  A started quiz is never ended this way. A let-in lobby with children
  in it ends too, and their tablets say the quiz has ended: a new upload
  from the device that steers is taken as the teacher moving on (the right
  quiz after a wrong one). The device already knows its latest quiz and its
  secret (`root-page.md`, "Coming back"). A player joining another quiz ends
  nothing (Situation, "Who opens a lobby").
- **The day's spending, for the owner:** how close a day came to its
  limit is a fact to look up, at `GET /api/site/use` behind the owner's key
  (`telemetry.md`, "Who reads it"). Nothing about a quiz or who made it.
- A booking made before midnight UTC and moved after it leaves the new
  day's ledger alone: the rare class across the turn spends some of the new
  day uncounted.

What the design rests on that no longer holds (backlog, "Room on the Free
plan", item 3):

- The lifetime runs from the last teacher step or role taken. A lobby that
  waits longer than three hours for its class ends: the teacher who opened
  it early, the walked quiz.
- `MAX_LIVE_BYTES` would be reached by lookers' own picture quizzes, some
  300 at a few MB each, held three hours, and then refuse uploads that a
  class would have joined. An idea kept for it: `scaling-drawer.md`, "Stored
  data: pictures".

Not covered: a lobby before its class is let in books nothing, so what its
teacher devices spend comes out of what the shares leave over; a projector
on long-poll keeps its object awake until the page sleeps (`SLEEP_AFTER_MS`),
some 345 GB-s, which a wave of looks at the room from behind a filter would
make large. Plausible assumption: looks come from homes and offices whose
networks pass WebSockets (Situation, "Which devices poll"). And a script
hammering `/api`, which spends requests no class booked; that is the case
for a domain with a rate-limiting rule.

### When the allowance runs out anyway

Devices say so instead of showing the offline dot, in their language: "The
free site has used up today's allowance. It works again at 01:00 Swiss
time", the hour computed (02:00 in summer), with the own-copy pointer
(`quotaNotice`, `client/room-text.ts`). Joining says the same, and so does
opening a room on the local check. The mapping: the Function
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
  the schools' iPads have moved past iOS 15 or the example class is no
  longer a school's; then try `'self'` alone on a real
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
- Whether the numbers (15,000 upload rows, 1 GB, 60 players, 5 late joiners,
  3 hours) fit real use; no figures from real classes yet.
- Whether teachers are seen with more than five latecomers, or re-uploading
  after the 3 hours.
- Whether the German, French and Italian wording of the two caps' messages
  reads right; it has not been seen in a browser.
- Whether a domain with an edge rate-limiting rule becomes necessary.
- Whether any school converts the server, and how its AI fares with the
  README section; and which outside address serves a converted copy's own
  version of the guidance in a way the AIs read (the guidance page on GitHub
  at the converted commit is the obvious candidate, unread by any AI so far).
- The share of classes with at least one poller, and how much of it the
  site's own fallback makes; how long devices stay on after the final
  ranking (telemetry: `polled`, classes with a poller, `awakeS`).
- How many lobbies are looks at the room, how far they go (let in,
  Start), and what they upload; how long a lobby opened early waits for its
  class; how often a quiz is walked to another device, and to whom.
- Whether the class cost above, and so the capacity sentence, still holds now
  that a question steps through four or five states, each a view to every
  device; it was derived when a question had three.
