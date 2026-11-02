# classyQuiz — Decisions

Design decisions and the reasons for them. Each entry names the backlog item or
constraint it serves, what was decided, why, and what would make us revisit it.
Newest last. Open questions waiting on the owner are listed at the end.

## 2026-11-02 — Guidance page is information, not instruction

Serves: v1 item 11 (all four parts).

The guidance page describes what the site is for, what quizzes are for, how
they are built, and the situation of building one with a teacher. It does not
issue rules. The AI's behaviour should follow from understanding the
situation, the way an implementer's follows from the backlog. The quiz format
is presented as a specification ("a quiz looks like this"), not as commands.

Why (owner): rules can't adapt and they block better solutions. A teacher who
sent a full brief needs no questions; contradictory scans may need two; a rule
like "ask at most one question" fails both. Also, imperative text in a
fetched page trips AI prompt-injection guards, while reference material gets
read.

Consequence for testing: we check behaviour across situations (a full brief,
no brief, a handwritten note among the scans, contradictory material), not
only whether the output parses.

## 2026-11-02 — Correct answer marked inline; key check after upload

Serves: v1 item 1 (a wrong key visible in seconds), item 12.

- In the format, the correct answer is marked on the answer line itself, not
  given as an index ("answer: 3"). An AI can get an index wrong without anyone
  noticing; an inline mark sits next to the text a human reads.
- After upload, the device that uploaded shows a compact key check: every
  question, its marked answer, and any notes. This is the teacher's review
  surface. It is not the class preview of item 12.
- Besides the per-question notes, the format has one note for the whole quiz
  (e.g. "couldn't read exercise 4"). It goes only to the teacher.
- Fixing during the run (item 9) remains the safety net.

## 2026-11-02 — Forgiving parser; errors phrased for the AI

Serves: v1 item 1 (an AI must write it reliably), item 13.

The parser tolerates what AIs typically add or vary: prose around the quiz,
code fences, curly quotes, inconsistent numbering, extra blank lines,
right-to-left text. It rejects only what it can't interpret unambiguously.
When it does reject, the message names the question and the problem in plain
words, so the teacher can paste it back to the AI. Item 13 stays low priority;
this falls out of the parser at little cost.

## 2026-11-02 — Upload accepts paste, a single text file, or an archive

Serves: v1 item 2.

Paste is the main path, since many free AI tiers can't produce files. A single
.md/.txt file is accepted as-is. A zip archive holding the quiz text is
accepted from v1. What has to be future-proof is that the text can refer to
images in the archive by file name (v2), so the format reserves that now.

## 2026-11-02 — Lifetime of a quiz instance

Serves: "nothing kept beyond its use"; v1 item 10.

The owner's frame (backlog constraints): the uploaded quiz lives on the server
for the lifetime of its quiz instance, and the teacher's file is the durable
copy. That file is the text or file the AI produced, still in the chat.
Patterns to fit:
- made in the break and used once;
- sometimes uploaded the evening before;
- the same quiz run in two parallel classes;
- a corrected-quiz download is a later item.

- **The instance is the unit:** the uploaded quiz plus its runs. It ends when
  the teacher ends it; the end of every run offers "another class with this
  quiz" or "end". Otherwise it expires **48 hours after its last activity**
  (upload, run start, any teacher action). That covers an upload the evening
  before a lesson late the next day, and parallel classes the same or the
  next day. For anything later, re-uploading from the teacher's copy takes
  seconds.
- **When the instance ends,** everything in it is deleted: quiz, runs,
  players, answers.
- **Within the instance,** a run's players, answers and scores are deleted 1
  hour after the run ends. That is long enough for a reloaded screen to show
  the final ranking.
- **Corrections** made during a run (key change, voided question) apply to
  the instance's quiz, so a parallel class in the same instance gets them.
  When the instance ends they are lost, and the teacher's copy still has the
  wrong key. That is the problem the later "corrected quiz downloadable" item
  solves. formatQuiz already writes the corrected text, so that item is cheap.
- **Storage during the lifetime** is whatever lets the instance survive
  devices dying and the server going idle overnight, e.g. Durable Object
  storage. That is not "persisting" in the owner's sense, which means keeping
  anything past the instance.
- The durations are single configuration values.
- Logs keep no quiz content and no IP addresses, as far as the host allows.

Replaces the earlier entry of the same day (quiz 8 days, run 12 hours). That
was written before the owner's answer that the teacher's file is the durable
copy.

Revisit: if teachers are seen re-uploading for patterns the 48 hours miss.

## 2026-11-02 — Continuity: same device resumes, a dead device restarts

Serves: "survives school Wi-Fi"; v1 items 4, 7.

- A student device holds a player token for the run. A device coming back
  after sleep or a dropped connection resumes the same avatar, score and the
  current screen without the student doing anything.
- An answer is retried until the server confirms it, and recording it twice
  changes nothing. An answer given just before the phone slept is not lost.
- A student whose device died joins again as a new player. Their earlier
  score is lost. Accepted because it is rare, the ranking is "somewhat
  anonymous" and grading is unlikely.
- Teacher devices: the teacher view is reached through a secret teacher link.
  If the teacher's device dies, the projector view can hand control to
  another device. It shows a pairing code, and someone at the projector
  machine has to confirm before control passes.

Revisit: if the real run shows dead devices are common.

Amended by the runner entries below: the pairing direction is reversed
("Runner: pairing devices"), and a student whose device died can pick their
avatar back ("Runner: joining and rejoining").

## 2026-11-02 — Single mirrored laptop: not designed for in v1

Serves: v1 item 3.

The expected setup is the big screen on one device and the remote on
another. A lone mirrored laptop is not a v1 target. The projector view does
accept keyboard and presentation-clicker input (next, reveal) at little cost,
which also helps the two-device setup. Authoring notes appear only on the
teacher view. Flagged to the owner in case he wants to rule otherwise.

## 2026-11-02 — Ranking and closure without language

Serves: v1 items 5, 8.

- Students appear as randomly assigned avatars (picture plus colour). They
  never type a name. Joining means tapping a box and entering a number, or
  scanning a code.
- After a question: the distribution of answers, shown with the answer
  colours and no names, as a teaching moment.
- Intermediate and final ranking on the projector: the top few avatars, plus
  the whole class's result as a picture and a number.
- Each student's device shows their own avatar, score and place.
- Labels are icons and numbers wherever possible.
- Answer buttons are marked by colour plus shape, so colour-blind students
  can tell them apart.
- The teacher does not see which student is which. This fits "grading
  unlikely" and is flagged to the owner in case he wants to override it.

## 2026-11-02 — AIs to verify against

Serves: "Designed for Claude; other mainstream AIs verified"; v1 item 11.

- Claude is the design target.
- Verified against the AIs teachers actually use: ChatGPT, Gemini and
  Microsoft Copilot. That includes Microsoft 365 Copilot Chat, which schools
  often provide through their education Microsoft 365 accounts.
- Free tiers are tested as well as paid ones, because they decide whether an
  AI can fetch a page or produce a file at all.
- Mistral Le Chat is an optional addition for European teachers.
- The owner's design target is a teacher on a free account, so free-tier
  Claude (claude.ai) is the first verification. There's no specific real
  teacher yet.
- Local harness for repeatable checks, kept outside the repo: .tmp/ai-tests/
  (run.mjs). It drives the claude CLI under the owner's login, with no tools
  and no project context.

What a run checks:
- The AI understands the site from its address alone.
- It handles the authoring situations above sensibly.
- It produces a quiz that parses and whose keys are right.

## 2026-11-02 — The quiz text format

Serves: v1 items 1, 2, 13. Implemented in src/quiz/format.ts. The
specification is the "How quizzes are built" section of the guidance page
(src/public/index.html), because that is where AIs and teachers read it. A
test parses the page's example, so the two can't drift apart.

```
Title: Adding fractions
Note: (teacher only, about the whole quiz)

1. What is 1/2 + 1/4?
- 2/6
+ 3/4
- 1/8
Note: (teacher only, shown while this question is up)
```

- **"+" marks the correct answer, "-" a wrong one,** on the answer's own
  line. It sits in a fixed column, so it is visible at a glance, and a phone
  keyboard can move it. The order in the text is the order on screen.
- **Loss of the markers fails loudly.** If the text was copied from a
  rendered chat bubble, "+"/"-" become bullet points and disappear. The
  parser then reports "no answer marked correct" instead of guessing a key.
  The guidance asks for one code block for this reason.
- **Questions are numbered "1.", "2.", …** Numbering is optional for the
  parser. When present, it separates questions robustly: a line numbered as
  the next question ends any stray text before it, so an AI's "Explanation:"
  line becomes a reported error instead of merging silently into the next
  question.
- **English keywords** (Title:, Note:) in every quiz language. Answers carry
  no keyword or letter.
- **What the parser forgives:**
  - fenced code blocks (quiz blocks are picked out of a chat answer);
  - an unclosed fence;
  - prose before the title and after the last question (the trailing prose
    gets a warning);
  - Markdown headings and bold on keywords and questions;
  - checkbox answers ("- [x]");
  - dash and minus variants, and fullwidth "+";
  - indentation of the whole block;
  - a deeper-indented continuation of an answer;
  - CRLF, BOM, non-breaking and zero-width spaces;
  - leading bidi marks in right-to-left text. ZWNJ/ZWJ are kept.
- **What it rejects:**
  - no correct answer (more than one is allowed: see "Several right
    answers" below);
  - fewer than 2 or more than 4 answers;
  - "*" and "•" bullets, which are ambiguous;
  - answer lines before any question;
  - text without answers between questions.
- **What only warns:**
  - no title;
  - the same answer twice;
  - long answers or questions;
  - an "Image:" line (reserved for v2);
  - the correct answer in the same position in every question.
- **Rejected alternatives:**
  - Aiken (lettered answers plus "ANSWER: B"): an index key, which hides
    errors.
  - Moodle GIFT: "=" and "~" collide with maths text and need escaping.
  - JSON: a wrong key isn't visible at a glance, and teachers can't fix it
    by hand on a phone.
- **Maths** is plain text with Unicode characters until C is decided.

## 2026-11-02 — Code: TypeScript, no dependencies so far

(Dependencies since: see "Runner: code and toolchain" below.)

TypeScript restricted to syntax Node can strip (Node 24 runs .ts directly;
tsc --erasableSyntaxOnly checks it). Tests use Node's built-in runner:
`npm test` in src/. The parser is pure, so it runs unchanged in the browser,
on Cloudflare Workers or on Node. The hosting decision (I) doesn't touch it.
There is no dependency yet; tsc is run via a pinned npx for checking only.

## 2026-11-02 — The guidance page is the site's root

Serves: v1 item 11 ("typing the name into the chat already open must be
enough").

The root URL serves the guidance as static HTML that reads without
JavaScript, so the one address an AI is given leads straight to everything it
needs. Fetch tools may not follow links. The human entry points (join with a
number, paste or upload a quiz) will sit at the top of the same page. Part 4
("Making a quiz with a teacher") is a first draft for the owner to take
over.

## 2026-11-02 — Notes are for doubts, and rare

Serves: v1 item 1 ("an authoring note per question for the AI's doubts, which
must reach the teacher while the question is up").

The owner's reason for the note is review decay. After a streak of good
quizzes, the teacher stops reading closely, so the AI's doubt has to stand
out in the key check and during the run. The test: the one real doubt is
unmissable to a teacher who skims.

- **The guidance page** describes notes as doubts only. Its examples: a scan
  read without confidence, an uncertain key, a sheet solution that disagrees,
  a changed question. It also explains why notes must stay rare: when every
  question has one, the one that matters reads like the others. The page's
  example quiz has a note on one question only.
- **No second keyword.** One channel, kept rare, is easier for an AI to get
  right than a classification into two. If tests show routine material
  creeping back, a second keyword is the fallback.
- **Presentation (for the runner):**
  - The key check shows how many questions have notes, puts those questions
    visibly apart, and shows the quiz note on top.
  - The teacher view shows a question's note prominently, in a place where a
    question without a note shows nothing.
- **Evidence** (local harness, Sonnet and Haiku, 4 situations each):
  - Before the change, every model wrote a note on every question.
  - After it, quizzes had 0 to 2 question notes. Each was a real doubt or
    assumption, e.g. "sheet says 4/6 for 1b; I calculated 5/6", or "the
    sheet doesn't say ascending or descending; I assumed ascending".
  - Both models put the planted wrong sheet key in a note on that exact
    question.
  - Limits: typed sheets, no real fetch, not the claude.ai system prompt.
    In round one, the page's example also used the test sheet's sums;
    round two used a different example (percentages).

## 2026-11-02 — More than one quiz in one paste is an error

Serves: v1 items 1, 2.

An AI may write two quizzes in one answer, e.g. originals for 6a and variants
for 6b. If the whole answer is pasted, a "Title:" line after questions has
started is an error naming the second quiz, not a merge. The guidance page
says two quizzes are two blocks, pasted one at a time.

## 2026-11-02 — Hosting: the owner's Cloudflare account, default address

Serves: constraint "Hosted on the owner's Cloudflare account, no domain of its
own".

Owner's decision: no domain, since it's a tool, not a product. Usage limits
nudge heavy use toward self-hosting. Consequences to carry:

- **The address is the default Cloudflare one** (*.workers.dev or
  *.pages.dev). "Told only the site's name" (item 11) therefore means told
  the full address. The README's prompt has to contain it.
- **To test before relying on it:**
  - whether the AIs' user-triggered fetchers can read a page on the default
    address;
  - whether school web filters let *.workers.dev / *.pages.dev through.
    Shared subdomains are sometimes blocked because of phishing abuse. If a
    school blocks them, an own domain is the remedy, which is the owner's
    call.
- **Design target from the owner:** a Swiss German-speaking primary class
  with a school-issued laptop on the projector, Android tablets for the
  students, and the teacher's phone as remote. The teacher's AI account may
  be a free one.
- Data location is moot: nothing is persisted beyond the instance.
- No degraded hands-up mode (owner: "no need").
- Formula rendering is a Later backlog item. Until then, maths is plain text
  with Unicode in v1 and images in v2.

## 2026-11-02 — Several right answers

Serves: v1 item 9. The owner's frame: a second answer that counts is one
case of a question where any number of the answers are right and students
pick one. "There is fun to be had with questions where all answers are
correct."

- **Format:** any number of a question's answers may carry "+", from one to
  all. "No answer marked correct" stays an error. Two "+" lines are no
  longer an error. The loud failure guarded against an AI marking two by
  mistake. The key check now shows "N right" on such a question instead,
  which a skimming teacher sees.
- **The "same position every time" warning** only looks at questions with a
  single right answer.
- **Guidance page:** "Usually exactly one answer is correct. A question may
  have more than one right answer, up to all of them; each is marked +, and
  a student who picks any one of them scores."
- **Display:** the reveal marks every answer that counts and dims the rest,
  so it needs no limit on how many count.
- **During the run** the fix is the same capability. The teacher taps
  answers to make them count or not, at least one; "void" covers counting
  none.

Not verified yet: whether AIs now mark several answers where they
shouldn't. A harness run of about 8 model calls would check it.

## 2026-11-02 — Runner: hosting shape on the Free plan

Serves: constraint "hosted on the owner's Cloudflare account, no domain";
v1 items 4, 10, 14.

- **Address:** `classyquiz.pages.dev`. The owner prefers pages.dev, and the
  name didn't resolve before the first deploy. Children may type it.
- **Two deployables:**
  - the Pages project `classyquiz`: the static pages plus the `/api`
    functions;
  - the Worker `classyquiz-state`: only the Durable Objects, with no public
    address (`workers_dev = false`).

  Pages can't define Durable Objects, so the functions bind them by script
  name. `npm run deploy` deploys both.
- **Rejected alternatives:**
  - One Worker with static assets: one deployable, but its address is
    `classyquiz.<account>.workers.dev`, which is longer to type.
  - Pages calling a workers.dev API directly: two addresses that school
    filters must both let through, plus cross-origin WebSockets.
- **Free-plan budget:** only `/api/*` runs code; static pages and scripts
  don't count. A class of 25 costs:
  - about 30 WebSocket connections, plus reconnects;
  - messages, billed at 20:1;
  - one storage write per answer.

  That is a few hundred requests out of 100,000 a day, plus about 150 GB-s
  of Durable Object time out of 13,000 a day. A whole class on the
  long-poll fallback stays around 2,500 requests. Short polling was
  rejected: about 11,000 requests per run.
- **Storage:** SQLite-backed Durable Objects, the only kind on Free. There
  are no request logs (`observability` off), so no IP addresses are kept.
  Error logs carry the message only, never quiz content.

## 2026-11-02 — Runner: state, transport and repeats

Serves: constraint "survives school Wi-Fi"; v1 items 3, 6, 7, 9.

- **One Durable Object per quiz instance** holds the quiz, the teacher's
  fixes, and the current run with its players and answers. Every change is
  written before it is acknowledged, so a restarted object loses nothing.
- **The server sends views, not diffs:** each device gets the complete view
  for its role (projector, teacher, student). A device that slept just
  draws the newest one. Scores are never stored; they are always computed
  from answers plus fixes. That is why a changed key moves the points. It
  is also why v2's speed scoring only needs the answer times already
  recorded (milliseconds after the question opened).
- **Transport:**
  - WebSocket first, hibernating, so an idle instance costs nothing.
  - A ping every 20 s is answered by the runtime without waking the object.
  - A missing pong means the line is dead, and the device reconnects.
  - Waking up, coming back online, or the tab becoming visible reconnects
    at once.
  - If a WebSocket can't open three times in a row, the page switches to
    HTTP long-polling (25 s holds) for the rest of its life. Some school
    filters break WebSockets; the quiz then runs a moment slower.
  - Rejected: Server-Sent Events. Proxies buffer them too, commands would
    still need POST, and they don't hibernate.
- **Everything a device sends is safe to repeat:**
  - Flow commands (reveal, next, …) name the phase and question they were
    given in; the server ignores them once the quiz has moved on.
  - Answers carry a sequence number; a late older one changes nothing.
  - Fixes set a value rather than toggle one.

  Commands are resent until acknowledged. So a double tap, or a retry after
  a dropped connection, never skips a question or counts twice.
- **Evidence:** `scripts/simulate.mjs` runs a class of 25 against the local
  stack, a fifth of it over long-polling. The run includes:
  - random drops of 0.5 to 5 s;
  - answers sent just before a drop;
  - a dead tablet whose student picks their avatar back;
  - a stray avatar, removed;
  - a key change, a void and a skip;
  - doubled Reveal and Next.

  It checks that every score equals the acknowledged answers under the
  final fixes.

## 2026-11-02 — Runner: the flow of a run

Serves: v1 items 6, 7, 8, 9.

- **Phases:** lobby → question → reveal → (ranking) → next question … →
  final. The final ranking can be called from any point (the bell rings at
  question 9); a question that wasn't revealed doesn't count.
- **A question scores once it's revealed.** Students can change their
  answer until the reveal, and the last tap counts. On a tablet a mis-tap is
  likelier than a tactic.
- **Fixes, at any time while the instance lives:**
  - which answers count;
  - void: shown, but counts for nobody;
  - skip, for a question not yet shown.

  For the open question, "Skip" moves on and drops its answers. Fixes
  belong to the instance, so a parallel class later gets them too, skips
  included.
- **One run at a time per instance.** "Another class" starts a new run with
  a new join code. The previous run's players and answers go then, earlier
  than the hour the lifetime entry allows. Two classes playing at the same
  time would need two uploads; rejected as rare.
- **Keyboard and presentation clicker on the projector:** Space, Enter, →,
  ↓ or PageDown takes the next usual step (start, reveal, next). F toggles
  full screen.
- **Late joiners** get in at any point before the final ranking.
- **The teacher can remove an avatar**, e.g. a double tab or a stranger
  with the code. Its answers stop counting.

## 2026-11-02 — Runner: pairing devices

Serves: v1 items 3, 10. Replaces the Continuity entry's handover through a
code on the projector.

**The device that wants a role shows a code; a device that already holds
the quiz types it in.**

- The projector computer opens `/screen` and shows a 6-digit code. The
  teacher's phone, which holds the quiz, types it in, and the projector
  shows the quiz.
- A phone that should steer a quiz uploaded on the laptop opens `/remote`
  and shows a code. The laptop types it in, and the phone gets the teacher
  link.

Seeing a code grants nothing, so it can safely stand on the projector. The
earlier design had the projector show a code that any device could use to
request control, confirmed at the projector. The class could read that
code, and the confirm dialog couldn't tell the teacher's phone from a
child's tablet.

- **Same device, extended screen:** a teacher on one laptop opens the
  projector window from the teacher page (`/screen?q=…`) and moves it to
  the second screen. No pairing needed.
- **The secret leaves the address bar.** The teacher link arrives as
  `/teach#id.secret`, is stored in the browser, and the address becomes
  `/teach?q=id`. A projected address bar shows nothing usable.
- **Pairing codes** are valid for 10 minutes and single use. Each code is
  its own tiny Durable Object, so claiming one is atomic without a central
  registry. Join codes work the same way.

## 2026-11-02 — Runner: key check on a screen that may be projected

Serves: v1 item 3. The owner's frame: setup happens with the projector off
or on an extended screen, and both devices must work for setup.

On a laptop, detected as min-width 900 px with a fine pointer, the key
check opens collapsed: a summary and a "Show the key check" button. On a
phone it opens directly. That costs the laptop one tap, against the case
where the situation doesn't hold and the class sees every key.

## 2026-11-02 — Runner: joining and rejoining

Serves: v1 items 4, 5. The owner's baseline: shared, school-managed tablets
with nothing set up or installed.

- **Getting to the quiz:**
  - The projector shows the address, the join code, and a QR code for
    `https://<address>/#<code>`.
  - Typing the address leads to the root page, whose top is a big number
    box. Without JavaScript it still submits to `/play?c=…`.
- **Join codes have 5 digits** and never start with 0. With four digits, a
  mistyped code is likelier to land in another class's quiz. Six or more
  are slower for young children, who use the QR code or type. There is no
  rate limiting until v2's hardening item.
- **No name, no choice:** the avatar is assigned (decision "Ranking and
  closure"). The device keeps a player token, so a reload, sleep or dropped
  Wi-Fi resumes the same avatar and score.
- **Rejoining:** once the quiz has started, a device without a player sees
  the avatars of players whose devices are away, plus "+". A student whose
  tablet died taps their own avatar and keeps their score. A child could
  take someone else's; the teacher is in the room. This amends the
  Continuity entry's "joins again as a new player".
- **A known player can reconnect after the end,** so a reloaded tablet
  still shows its final place.

## 2026-11-02 — Runner: what each screen shows

Serves: v1 items 3, 5, 7, 8.

- **Avatars** are drawn as SVG, not emoji: 12 animals on 8 disc colours.
  Emoji look different on an Android tablet and a Windows laptop, and a
  child must recognise "the frog on purple" across the room. The first
  dozen players get different animals.
- **Answers** are marked by colour plus shape: red triangle, blue diamond,
  yellow circle, green square.
- **Students' buttons also show the answer text.** The owner hasn't said
  whether the colour-coded setup he saw had text on the devices. The
  baseline is that slow readers hear the teacher read from the projector.
  Text close up helps those who can read but can't see the back of the
  room. Revisit after the real run if heads stay down.
- **Projector:**
  - question: the question at the largest size that fits, the answer
    tiles, and the answered count;
  - reveal: answers that don't count are dimmed, each with its count;
  - ranking: places 1 to 3 (at most ten avatars; ties share a place), and
    the class's result as a percentage with one bar per question.
- **Teacher:**
  - Key check: a summary (questions, notes, questions with several right
    answers), then the quiz note, then "Check these first" with the noted
    questions, then all questions.
  - During a question, the note sits prominently above the question;
    without a note there is nothing in its place.
  - Live answer counts, the players (faded when away), and fixes at all
    times.
- **Student device:**
  - lobby: its own avatar;
  - question: the buttons;
  - reveal: a check or a cross, grey when void or unanswered;
  - ranking: avatar, place and points.

  It redraws only when its own view changes, so a tap is never lost to a
  redraw while the class answers.
- **Screens stay on:** the projector, teacher and student pages request a
  screen wake lock where the browser allows it.

## 2026-11-02 — Runner: network check

Serves: constraint "survives school Wi-Fi"; the open item on school
filters. The owner's frame: no probe days ahead before the package works;
a check can be part of what is presented.

`/check` tests what the quiz uses, on this device and network: the API over
HTTP, then a WebSocket echo. Its verdict is one of:

- all good;
- the quiz runs over HTTP;
- the site is blocked: ask IT.

It's linked from the root page, for the school laptop and one tablet before
the first lesson.

## 2026-11-02 — Runner: code and toolchain

- **Layout under `src/`:**
  - `quiz/`: the format;
  - `server/`: game logic, Durable Objects, the state Worker's config;
  - `functions/`: the Pages API;
  - `shared/`: protocol types;
  - `client/`: page scripts;
  - `public/`: pages and stylesheet;
  - `scripts/`: build, dev, deploy, simulate.
- **Dependencies:**
  - Dev: wrangler, esbuild, @cloudflare/workers-types and typescript, each
    pinned to an exact version at least two weeks old at the time, with one
    exception. Wrangler is at 4.153.0, one week old: up to 4.152 its bundled
    undici carries advisories, one of them TLS certificate validation, and
    wrangler is the tool that holds the deploy token.
  - Runtime: qrcode-generator (MIT, no dependencies of its own), bundled
    into the projector page. A QR encoder is too error-prone to hand-write
    for no gain.
  - Zip reading uses the browser's DecompressionStream, with no library.
- **Pages** are plain DOM without a framework, bundled per page to ES2020.
  School devices are not always current.
- **Commands, in `src/`:**
  - `npm test`: parser and game logic;
  - `npm run check`: both tsconfigs;
  - `npm run dev`: the local stack on 127.0.0.1:8788;
  - `node scripts/simulate.mjs`: the class simulation;
  - `npm run deploy`.
- **Deploy credentials** go in `secrets/cloudflare.env`, copied from
  `src/cloudflare.env.example`. The folder is git-ignored except its
  README. The token needs, for one account, only:
  - Workers Scripts: Edit;
  - Cloudflare Pages: Edit;
  - Account Settings: Read.

  Wrangler reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from
  the environment; Node's `--env-file` sets them.

## 2026-11-02 — Self-hosting nudge

Serves: v1 item 14.

The guidance page says the site runs on a free plan meant for a few
teachers and points to the public repository. Its README has the setup
steps an AI or a person can follow: a free Cloudflare account, one token,
`npm run deploy`. Five to ten minutes.

## Open

- Whether the default Cloudflare address passes the AIs' fetchers and school
  filters. This needs the deployed page; `/check` covers the school side on
  the day.
- Whether AIs overuse several "+" lines now that the guidance allows them.
- A real sheet. The local harness ran on an invented German fractions sheet.
- Free-tier verification: the harness runs the claude CLI under the owner's
  login, not claude.ai's free tier. Testing the free tier, and ChatGPT,
  Gemini and Copilot, needs a person or those accounts.
