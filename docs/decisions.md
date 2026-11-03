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

Amended: the notes are gone ("The quiz carries no notes"); the key check
becomes the lobby's question list (docs/user-flow.md §3.3).

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

Serves: v1 item 2. **Superseded 2026-11-03: zip only** ("The landing page by
attention budget; zip only").

Paste is the main path, since many free AI tiers can't produce files. A single
.md/.txt file is accepted as-is. A zip archive holding the quiz text is
accepted from v1. What has to be future-proof is that the text can refer to
images in the archive by file name (v2), so the format reserves that now.

Any other file (.docx, .pdf, .tar.gz, …) gets a message naming what the site
takes, instead of being read as text and failing with "No questions were
found" (review B). Counting upload attempts by format is built; see "Upload
attempts counted by format" below.

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
  solves. (A serializer for it was written early and removed unused in the
  2026-11-02 pruning; the item writes its own against the fixes.)
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

Superseded for teacher devices by "One code per quiz, two teacher roles per
tab": no teacher link; roles per tab.

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

Superseded by "One code per quiz, two teacher roles per tab": the single
mirrored laptop is now the starting point; the Projector steers itself.

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

Amended: `Note:` is no longer part of the format; the parser drops such
lines ("The quiz carries no notes").

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
  keyboard can move it. The order in the text is the order on screen
  (reversed: "Answers shuffled at upload").
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
  - an "Image:" line (until v2 made it the question's picture: "Pictures in the archive");
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

Superseded by "The quiz carries no notes" below.

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
  of Durable Object time out of 13,000 a day.

  On the long-poll fallback, a student's device is woken only when its own
  view changes: its answer, or the teacher's next step. A classmate's answer
  doesn't wake it. Measured with `simulate.mjs --all-poll`: 25 students,
  drops, five questions, about 1,100 HTTP requests in two minutes. Each one
  is a Function request plus a Durable Object request. Idle polls add one
  per device every 25 s. A 15-minute lesson with the whole class on the
  fallback comes to roughly 3,000 of each.

  Short polling was rejected: about 11,000 requests per run. Before review A
  found it, every answer woke every poller, which cost about the same as
  short polling.
- **Parsing at upload** happens in the Durable Object, not the Function. A
  Function on Free has 10 ms of CPU, and a long pasted text could exceed
  it. Nothing is stored when the quiz has errors. The quiz text is stored
  once, apart from the small record rewritten with every answer.
- **Storage:** SQLite-backed Durable Objects, the only kind on Free. There
  are no request logs (`observability` off), so no IP addresses are kept.
  The Pages side has no such setting and stores no logs ("Hardening").
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
  - If WebSockets fail three times in a row, the page switches to HTTP
    long-polling (25 s holds) for the rest of its life. A socket counts as
    failed when no message arrives through it within 8 s, whether or not
    it opened. Some school filters block the upgrade; others accept it and
    then drop every frame. The quiz then runs a moment slower.
  - Polls never follow each other closer than 300 ms. A device without a
    player is held like any other poller, until the avatars on offer
    change.
  - Rejected: Server-Sent Events. Proxies buffer them too, commands would
    still need POST, and they don't hibernate.
- **Everything a device sends is safe to repeat:**
  - Flow commands (reveal, next, …) name the phase and question they were
    given in; the server ignores them once the quiz has moved on.
  - Answers carry a sequence number; a late older one changes nothing.
  - Fixes set a value rather than toggle one.
  - "Start with a class" names the state it was given in, like flow
    commands. It only acts from "no run" or the final ranking, so a resend
    can't wipe a class that has started joining.
  - A join remembers its command id, so a resent join gets the same player,
    not a second avatar.

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
  final fixes. Since the review, the dead tablet dies silently: its socket
  stays open and just goes quiet, as when a battery dies. The student gets
  their avatar back once the old device counts as away. A browser check
  covers the real client:
  - behind a proxy that drops frames, the device falls back to HTTP and
    plays;
  - a double tap on a teacher step;
  - Reveal tapped while 45 answers arrive;
  - a new phone taking over at the projector.

## 2026-11-02 — Runner: the flow of a run

Serves: v1 items 6, 7, 8, 9.

Amended by "One code per quiz, two teacher roles per tab": "Another class"
keeps the quiz's code; a class opens at upload.

- **Phases:** lobby → question → reveal → (ranking) → next question … →
  final. The final ranking can be called from any point (the bell rings at
  question 9); a question that wasn't revealed doesn't count.
- **A question scores once it's revealed.** Students can change their
  answer until the reveal, and the last tap counts. On a tablet a mis-tap is
  likelier than a tactic. "Until the reveal" means until the device showed
  it; see "A tap that looked in time counts".
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
  full screen. Amended by "Review C": no key starts the quiz, none with
  Ctrl, Alt or Windows/Cmd, and only a clicker's keys while a Remote steers.
- **On the teacher's device, a step can't be tapped twice.** After each step
  (start, reveal, next, …) the buttons stay inert for 0.7 s. Otherwise a
  double tap on "Reveal" lands on the "Next" that replaces it, and the class
  never sees the reveal. The page also leaves the buttons alone while
  answers come in: only the numbers are patched. A button replaced under
  the finger would lose the tap. Found by both reviews.
- **Late joiners** get in at any point before the final ranking.
  Amended by "Hardening": five once the quiz has started, 60 players in all.
- **The teacher can remove an avatar**, e.g. a double tab or a stranger
  with the code. Its answers stop counting. Since "Hardening" the removed
  device can't join the same class again.

## 2026-11-02 — Runner: pairing devices

Serves: v1 items 3, 10. Replaces the Continuity entry's handover through a
code on the projector.

Superseded by "One code per quiz, two teacher roles per tab": no pairing
codes; `/teacher` and the quiz's code.

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
- **The teacher's only device dies** (review A). A new device opens
  `/remote` and shows a code. The code is typed in at the projector
  computer: press C, or the "Connect a phone" button. The projector may
  hand over control because it is the device in the room. Anyone at its
  keyboard could do the same, and the teacher is there. Also, the
  "Connect" section offers "Copy the teacher link" for a teacher who wants
  a private copy.
- **A projector resumes its pairing after a reload only within 8 hours.** A
  shared school laptop shouldn't open yesterday's teacher's quiz. "Other
  quiz" lets go of a pairing at any time.
- **The secret leaves the address bar.** The teacher link arrives as
  `/teach#id.secret`, is stored in the browser, and the address becomes
  `/teach?q=id`. A projected address bar shows nothing usable.
- **Pairing codes** are valid for 10 minutes and single use. Each code is
  its own tiny Durable Object, so claiming one is atomic without a central
  registry. Join codes work the same way.

## 2026-11-02 — Runner: key check on a screen that may be projected

Serves: v1 item 3. The owner's frame: setup happens with the projector off
or on an extended screen, and both devices must work for setup.

Superseded by the lobby's question list, answers folded until a button that
says it shows them (user flow §3.3, "One code per quiz, two teacher roles
per tab").

On a laptop, detected as min-width 900 px with a fine pointer, the key
check opens collapsed: a summary and a "Show the key check" button. On a
phone it opens directly. That costs the laptop one tap, against the case
where the situation doesn't hold and the class sees every key.

## 2026-11-02 — Runner: joining and rejoining

Serves: v1 items 4, 5. The owner's baseline: shared, school-managed tablets
with nothing set up or installed.

Amended by "One code per quiz, two teacher roles per tab": the code is per
quiz, not per run; no "8 hours" projector resume (a tab keeps its role,
`sessionStorage`).

- **Getting to the quiz:**
  - The projector shows the address, the join code, and a QR code for
    `https://<address>/#<code>` (since "Review C", `/play#<code>`).
  - Typing the address leads to the root page, whose top is a big number
    box. Without JavaScript it still submits to `/play?c=…`.
- **Join codes have 5 digits** and never start with 0. With four digits, a
  mistyped code is likelier to land in another class's quiz. Six or more
  are slower for young children, who use the QR code or type. There is no
  rate limiting; "Hardening" says why, and what bounds a guess instead.
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
- **"Away" means not heard from recently:**
  - a WebSocket whose device hasn't pinged for 45 s (clients ping every
    20 s);
  - a poller silent for 35 s.

  A tablet whose battery dies doesn't close its socket. Counting only open
  sockets kept its avatar "connected", so its student couldn't pick it back
  (review A). A device without a player asks again every 10 s, so the
  avatar shows up within about a minute of the death.

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

Serves: v1 item 14. **Revised 2026-11-03:** a guide page of its own,
`/own-copy` ("The landing page by attention budget; zip only").

The guidance page says the site runs on a free plan meant for a few
teachers and points to the public repository. Its README has the setup
steps an AI or a person can follow: a free Cloudflare account, one token,
`npm run deploy`. Five to ten minutes.

## 2026-11-02 — Projector tiles: the reveal doesn't move the text

Serves: v1 item 6 (the reveal as a teaching moment); fixes the owner's
"1 000 000" bug.

The bug: at the reveal the right answer's tile gained a check mark and a
count. They took about 190 px from the text, so "1 000 000" wrapped onto
two lines and the tile grew. The parser also turned non-breaking spaces into
ordinary ones, so an AI that wrote the number with them didn't help.

- **Reserved space:** every tile reserves the space for the mark and count
  from the start of the question. The reveal fills it, and the text keeps
  its place.
- **Shrink to fit:** the tile font starts at the size given by the longest
  answer, as before. It then shrinks until no word is cut and no answer
  overflows its tile, the way the question text already fits. Only at the
  smallest size does a word break.
- **Digit groups stay together:** "1 000 000" is kept on one line wherever
  answers and questions are shown, even when written with ordinary spaces. A
  false match only prevents one line break.
- **Non-breaking spaces:** the parser keeps them. Its patterns read them as
  spaces anyway.

Checked in headless Edge: three spellings of the number, plus long, two-answer
and short quizzes, at 1280×720, 1024×768 and 800×600. Question and reveal
have identical text geometry in all of them.

## 2026-11-02 — A tap that looked in time counts

Serves: v1 item 15.

Before: a tap that reached the server after the reveal was refused. The
tablet had already shown it as chosen, and then showed "no answer" at the
reveal.

- **The rule is the device's view, not the arrival time.** Every view
  carries a version, and the server notes the version of the first view that
  shows each reveal. An answer names the version of the view it was tapped
  on. If that is older than the reveal's, the device was still showing the
  question as open, so the answer counts whenever it arrives, even after the
  class has moved on. It doesn't count if the question was skipped, or not
  revealed before an early final ranking.
- **Why not time:** device clocks aren't synchronised, and on school Wi-Fi a
  delivery can take longer than any window that would still be fair. The
  version answers exactly the backlog's question: what the tablet showed.
- **Accepted risk:** a tablet that is offline still shows the question, so
  a child could copy the key from the projector and tap. The backlog designs
  against the normal user; the teacher deals with that one in the room. A
  device that sends no version (an old cached page) gets the old rule.
- **On the device:** a tap shows as chosen at once, as before. If the reveal
  comes before the server confirmed the tap, the device shows the tap as on
  its way (its shape, a pulsing dot), not "no answer". It shows right or
  wrong once the server has the tap. So the device never shows an answer
  counted that isn't, or the other way round.
- **Evidence:**
  - game tests for a late tap, a change of mind, after Next, after an
    early final ranking, and after a skip;
  - an HTTP probe: the same tap counts on the question view and doesn't on
    the reveal view;
  - the simulation now has a tablet that taps offline, the reveal going out
    before the tap arrives, and the check that it counts. Both modes pass;
  - headless Edge on the HTTP fallback, with the tap's request held back
    past the reveal: "on its way", then the right-answer verdict.

## 2026-11-02 — Upload attempts counted by format

Serves: v1 item 2 ("upload attempts are counted by format, with content and
identity excluded").

- **What is counted:** each attempt on the upload page, as one word from a
  closed list in `src/shared/upload.ts`:
  - paste, txt, md, zip;
  - several files;
  - docx, pdf, tar.gz and the other formats a teacher might try;
  - "no extension", "other".

  The word comes from the file name only. The server takes only words from
  the list, and anything else is counted as "other", so no file name or text
  can end up stored.
- **What is kept:** per format, the count and the first and last day it was
  seen. No content, no identity, no time of day. One Durable Object for the
  site (`UploadStats`). This is kept for good: it describes the site, not a
  quiz or a person.
- **Where to look:** `GET /api/stats` on the site, e.g.
  https://classyquiz.pages.dev/api/stats. It is public. The numbers say how
  much the site is used, nothing about anyone. If the owner wants them
  private, a key in `secrets/` read by an `npm run stats` script is the next
  step.
- **How:** the page sends the word to `POST /api/attempt` and doesn't wait
  for an answer. A failed count never touches the upload. A pasted quiz
  resent after the AI fixed it counts again: these are attempts, not
  quizzes.
- **The file picker no longer filters** to .txt/.md/.zip and accepts several
  files. On a phone a filter can make other files unpickable, and then no
  one could be seen trying a .docx. Any other file, or several at once, gets
  the message naming what the site takes. That message existed already.
- **Not settled:** the backlog says "zip only", and a single .txt or .md
  file is still accepted. It costs no code beyond reading text, and the
  counter will show whether anyone uses it. Dropping it is the owner's call.
- **Deploy:** a new Durable Object class needs the state Worker migration
  `v2` (server/wrangler.toml). `npm run deploy` deploys the state Worker
  before the site, which is the order it needs.
- **Checked:** unit tests for the format words; the endpoints on the local
  stack; headless Edge counting a paste, a zip, a .docx and two files at
  once, with the paste and zip still reaching the teacher page.

## 2026-11-02 — Pictures in the archive

Serves: v2 item 1; v1 item 2 (the archive is the container); constraints
"nothing kept beyond its use, nothing identified" and the Free plan. Keeps
v3 item 1 (answers as images) open. Replaces the handover notes that stood
here; what they flagged is answered below.

Owner's direction (backlog v2 item 1): the picture is for the big screen,
not the voting devices; a background is separate from the question's
picture, and questions can share files; the first target is a teacher whose
AI can make a zip ("working and good first, flexible later"). Sonnet can
crop and zip (owner's test), so no model calls were spent on it. Pictures
without a zip are a Later item.

**Format** (guidance page, "How quizzes are built"):
- `Image: q3.png` after the question text, before the answers: the
  question's picture, one per question.
- `Background: forest.jpg`: before the first question, behind every
  question; after a question's text, behind that one instead.
- One file can serve several questions, as picture or background.
- Names match by `imageKey`: base name, case-insensitive, Unicode NFC. So
  `Bilder/Q3.PNG` in the archive is the quiz's `q3.png`, and a decomposed
  "ä" from a Mac zip matches.
- Forgiven: Markdown dress (`**Image:**`, `![alt](q3.png)` on its own
  line), quotes, backticks, a description after the file name.
- Errors:
  - a picture line after the answers, because it may be meant for the next
    question and a wrong guess shows a figure with the wrong question;
  - two pictures or two backgrounds on one question;
  - `Image:` before the first question;
  - a line that names no picture file, or a web address.
- A picture the quiz names that didn't come with it is an error that names
  it. When it's a zip, the message lists the pictures the zip does have, so
  the AI sees its own naming mistake. The teacher can instead press
  "Continue without these pictures", and the quiz runs with a warning per
  question.

**Upload** (`client/images.ts`, called by the upload page; whichever page
takes the quiz after the flow redesign calls `prepareImages()` and
`uploadQuiz()`):
- The browser parses the text (the parser is pure) and reads only the named
  files out of the zip, one at a time.
- It redraws each one on a canvas:
  - long side at most 1600 px, 1920 for backgrounds;
  - a question's picture with transparency stays a PNG with its alpha
    channel, up to 1.5 MB (changed in "Pictures on the screens": v3's
    answers as pictures need alpha); every screen shows pictures on white,
    so a transparent line drawing doesn't vanish on a dark page;
  - anything else is flattened onto white: backgrounds, opaque pictures,
    and a transparent one too large as PNG;
  - EXIF orientation applied;
  - PNG kept for line art up to 500 KB, else JPEG.
- That drops everything a photo carries besides the image: camera, time,
  GPS. It shrinks a 4 MB phone photo to a few hundred KB. And the server
  only ever takes PNG or JPEG, so no SVG (with whatever scripts it holds)
  is served. An SVG with only a viewBox is drawn at full size.
- HEIC can't be decoded by most browsers. The teacher gets a message saying
  so.
- The zip reader's limits stand (`client/unzip.ts`): stored and deflate
  only, no zip64, and names read as UTF-8 whatever the archive's flag. An
  old Windows zip with a non-ASCII name in code page 437 would not match its
  `Image:` line; Python's zipfile, which AIs use, writes UTF-8.
- Without pictures, the upload is the old JSON `{text}`. With them it is
  multipart: `text`, `leaveOut`, and per picture an `image` file plus its
  `imageName` as a text field. Non-ASCII names in multipart headers aren't
  decoded alike everywhere.
- The Function forwards the multipart body unread to the new instance. A
  Free Function has 10 ms CPU; the Durable Object parses it.

**Storage and serving** (`server/images.ts`, `instance.ts`):
- The server checks every file: PNG or JPEG by its signature, size read
  from the file, at most 1.5 MB per file (a Durable Object value holds 2 MB),
  at most 60 pictures (120 since "Pictures as answers"), 16 MB per upload. Files the quiz doesn't name are
  dropped.
- Each picture is stored once as `img:<n>` in the instance's own storage, in
  the same write as the quiz. The alarm is set before that write, so a
  failed write is still cleaned up. Pictures go with `deleteAll` when the
  instance ends, like everything else.
- `GET /api/i/:id/img/:secret/:n`:
  - The secret is per quiz and travels only in views, so the instance id
    that every student device knows doesn't open the pictures.
  - `cache-control: no-store`: a shared school laptop keeps nothing on disk
    once the page is closed.
  - `nosniff`, plus a sandbox CSP.
- Views: the projector and teacher views carry `image` and `background` as
  `{src, w, h}` per question, and the quiz's background. The player view
  carries none (owner: not on the voting devices). The size is there for
  the layout before the file has loaded.
- Budget: on Cloudflare's published Free limits (5 GB of Durable Object
  storage per account, 100,000 rows written a day), a quiz with 15 pictures
  is a few MB and a handful of rows. Fetching them costs one Function and
  one Durable Object request per picture per screen.

**The screens** are built: "Pictures on the screens" below records what
the plan that stood here became, and where it differs.

**Merging with the flow redesign:**
- `client/new.ts` is the upload page. The redesign folds it into the root
  page. What the new page needs:
  - keep the zip's entries (`listZip`) in a variable, set when a zip is
    picked and cleared when the teacher types or pastes into the box;
  - take the text with `quizTextFromEntries`;
  - call `prepareImages(text, entries)`;
  - show its problems with "Continue without these pictures", which
    resubmits with `leaveOut`;
  - call `uploadQuiz(text, images, leaveOut)`. It returns
    `UploadResult`; an error with `missingImages` offers the same button.
- The copy-for-AI text for picture problems asks for a .zip, not a code
  block.
- `quizTextFromZip` still exists for callers that only want the text.
- Server changes are additive:
  - `Instance.create(text, images?, leaveOutMissing?)`;
  - the multipart branch in the instance's `fetch` (action `quiz`) and the
    `img` GET;
  - `QuizRecord.images`/`imageSecret`;
  - `image`/`background` fields on `QuestionView`, `TeacherQuestion`,
    `ScreenView` and `TeacherView`.

  When the redesign rebuilds the views around roles, these fields move with
  the question data. The picture's secret stays out of anything a student
  device is sent.

**A second local stack** (for an agent beside the main one on 8787/8788):
- Wrangler's dev registry is global (`%APPDATA%\xdg.config\.wrangler\registry`).
  Its entries are keyed by Worker name, so a second stack that keeps the name
  `classyquiz-state` would overwrite the entry the main stack's site binds
  to. This is inferred from the registry's layout, not tried.
- So copy the deployables (functions, server, shared, quiz, dist, both
  wrangler.toml) to a scratch folder, and rename the state Worker in both
  tomls, e.g. `classyquiz-state-images`. The site name `classyquiz` is
  shared, harmlessly, since nothing binds to it. Use ports 8817/8818.
- Start the site only after the state Worker is registered. If the site
  starts against a stale registry entry (left by a killed process), every
  API call fails with "Network connection lost" even though the bindings
  read "[connected]". Restarting the site fixes it.
- Stop a stack by killing the wrangler node processes with their children
  (`taskkill /T`). Stopping only the shell leaves workerd holding the ports;
  killing only workerd makes wrangler start a new one. The wrangler process
  is the parent of the workerd that listens on the port (`netstat -ano`,
  then `wmic process where ProcessId=<pid> get ParentProcessId`).
- Right after a start, the site's calls to the Durable Objects can fail
  with "Network connection lost" for up to about 40 s (hardening, three
  starts); a probe should wait until `/api/join` stops answering 500.
- Don't give the site and the state Worker the same `--persist-to`
  directory: every Durable Object call from the site then fails with
  "Network connection lost". A start script that waits for "Ready on" in a
  log must delete the old log first.
- The first start after stopping a stack failed that way three times out of
  three ("Pictures on the screens", ports 8827/8828), even with the site
  started 10 s after the state Worker was ready; restarting only the site
  didn't help. Stopping both and starting both again worked each time.
  Probe with one upload before running a walk.

**Checked:**
- Unit tests: parser forms and errors, `imageKey`, PNG/JPEG reading,
  matching, sharing, leaving out.
- HTTP against the local stack:
  - a non-ASCII name;
  - wrong secret and unknown picture: 404;
  - pasted text naming pictures, and "continue without";
  - SVG bytes under a .png name: refused;
  - 15 pictures, 5.9 MB: stored and served in about 0.3 s;
  - 17 MB: 413;
  - ending the instance: the picture is gone.
- Headless Edge, through the real upload page, with a zip holding:
  - a 3000×2000 JPEG with EXIF orientation 6 and a GPS-like marker: came
    out 1067×1600, upright, without EXIF or the marker;
  - a viewBox-only SVG: 1600×800 PNG;
  - a transparent PNG: white corners;
  - a fake HEIC: listed, then left out on request;
  - a background: 1920×1280, behind every question;
  - a `__MACOSX` entry: ignored.

Revisit: if teachers' AIs put picture lines after the answers often enough
that the error costs more round trips than a guess would cost wrong figures.

## 2026-11-02 — The quiz carries no notes

Serves: v1 item 1 as the owner rewrote it: "The quiz is the finished
deliverable: the AI talks to the teacher while authoring, when the teacher is
there to react, not through the quiz during the lesson." Supersedes "Notes
are for doubts, and rare". The per-question note was the product owner's
proposal, rejected once the owner saw it on the screens of the flow design.

- **Format:** no `Note:` line, neither on a question nor on the quiz. Nothing
  in the quiz is addressed to the teacher.
- **Parser:** a `Note:` line is dropped without an error or a warning. An AI
  that read the old guidance, or a cached copy of it, still produces a quiz
  that runs. An indented line after a `Note:` line doesn't continue the
  answer above it, as before.
- **Guidance page:** the notes section and the notes in the example are gone.
  "Nothing else belongs to the quiz" now names messages to the teacher.
  "Making a quiz with a teacher" says where a doubt goes instead: into the
  conversation, before the quiz is handed over, best as a reading the teacher
  can confirm. Part 4 stays the owner's to take over.
- **Screens:** no note anywhere. This covers the key check's count and "Check
  these first", and the note above the current question. The protocol lost
  `quizNote` and the question's `note`.
- **What the notes did that is now unprotected:** a doubt the AI raised in a
  chat the teacher only skimmed no longer reappears during the run. The
  remedy is the lobby's question list with the answers a tap away (user flow
  §3.3) and fixing during the run (item 9). The harness evidence under the old
  entry, that models put a planted wrong sheet key in a note, says nothing
  about whether they mention it in the chat. That is worth one harness round
  when the guidance is next tested.

## 2026-11-02 — One code per quiz, two teacher roles per tab

Serves: v1 items 3, 4, 17, 18, 19; constraint "survives school Wi-Fi".
Built from docs/user-flow.md revision 3 (§1, §3); this entry records what
was built and where it differs from the design.

- **One code per quiz** (`server/instance.ts`). Claimed in its `JoinCode`
  object at upload, for the instance's lifetime plus `CODE_SLACK_MS` (12 h),
  and claimed again whenever the instance's end moves to within half that
  slack of the claim's end. `/api/join` also asks the instance whether the
  code still opens it, so a code whose claim outlived a deleted quiz opens
  nothing. "Again with another class" keeps the code and the fixes; the old
  class's tablets are told "This quiz has finished" (their token carries
  the class's id), live or when they come back.
- **Roles per tab.** The Projector (`screen`) and the Remote, each held by
  one token, kept in `sessionStorage`: a reload, sleep or dropped line
  resumes the role; two windows of one browser can hold both. The tab that
  pasted the quiz holds the Projector.
- **Two entrances.** `/play#<code>` (students; the root page's code box and
  the QR code lead there) offers no teacher role. `/teacher#<code>` offers
  Projector and Remote while free.
- **Presence.** A role's tab is "quiet" after 25 s without a sign and "away"
  after 45 s (`QUIET_MS`, `FRESH_MS`; the tablets' away detection). A sign
  is a WebSocket ping, a poll, or a hello. A teacher tab whose socket
  closes (reload, a phone locking) counts from the close and fades the same
  way, so a reload doesn't flip the steering to the wall and back. Presence
  changes with time, not events: the teacher pages send `tick` (Projector
  every 15 s while a Remote is there, Remote every 20 s, the role choice
  every 10 s).
- **The Projector steers itself while no Remote is there** (none, or away):
  its view carries `steer`, the Remote's view. In the lobby it shows the
  teacher's lobby; during the quiz a bar at the bottom. The clicker and
  keyboard (`advance`) work on any Projector, also while a Remote steers.
  "Steer from here" (⋯) takes the steering at once and sends the Remote back
  to the role choice; a Remote that was only away resumes when it comes
  back.
- **"Movable".** A Projector that steers itself is offered to another tab;
  taking it turns the old tab into the Remote (pasted on the phone, the
  laptop takes the wall; "Open the projector window" on a laptop with two
  screens). The new tokens count as present from the handover, and a tab
  that was between polls or reconnecting when its role moved is told so on
  its next contact (an in-memory map of moved tokens), rather than "lost".
- **Legacy instances** (made before codes per quiz) are refused with "This
  quiz was made with an earlier version of the site. Paste it again." and
  expire on their own.
- **Upload:** paste or .zip, nothing else; a paste with no answer line and
  no `Title:` gets the not-a-quiz message and isn't sent. Attempts are
  still counted by format.
- **Deploy:** the state Worker's migration `v3` deletes the `Pairing` class
  (and its stored pairing codes). `npm run deploy` deploys the state Worker
  before the site, which is the order it needs.

**Where it differs from the design:**
- **The phone line on the wall.** On the self-steering Projector's lobby
  the line "Your phone or another screen: open …/teacher, type the code"
  and the projector-window button show only until the first student has
  joined, as does ⋯ "Steer from your phone…" (after that the gate below
  closes the way anyway). On a mirrored laptop that lobby is the wall, and
  the line would invite the class to the teacher's entrance (the owner: "be
  careful of children accidentally taking the remote"). For the same reason
  the wall's notice
  is "Remote gone – steering here", without "enter the code on another
  device".
- **"Change the right answer" on the steering Projector** during the quiz
  opens the answers in a sheet over the wall; during a question the menu
  item says "– the class sees it" (user flow §4). Any open fix closes when
  the quiz moves on, so the clicker never brings a key onto the wall.
- **A phone as the Projector** (pasted on the phone, or no projector) gets
  a one-column lobby.

**No new steering once students are in** (decided by the product owner
within the owner's three cases). Once the current class has a student, a
guest at `/teacher` can't take the Remote, can't take over a Projector that
steers itself, and can't take a free Projector that would steer itself; the
role choice shows such a role as "not once students are in". The owner's
cases all still hold: a tab that holds a role comes back to it; a dead phone
means the wall steers; a dead projector means reading off the Remote, and
another computer can still take the free Projector while a Remote steers.
"Again with another class" opens a lobby without students, so the roles are
open again. Accepted loss: a phone whose tab was closed, or that left the
Remote, can't steer again during that class; "Stop being the remote" and
"Steer from here" say so in their confirmation once students are in. Why:
the owner's "be careful of children accidentally taking the remote"; without
the gate a child who knew `/teacher` got the steering, all lesson long on a
single mirrored laptop. The guidance's paragraph on how a lesson runs says
both screens are set up before the students get the code.

**Evidence:**
- `scripts/simulate.mjs`, rewritten for the roles: 25 students (a fifth
  polling, or all with `--all-poll`), drops, a silent dead tablet picked
  back, a stray avatar, fixes, doubled steps, a late tap; the phone takes
  the Remote and steers, dies silently, and the wall steers again after
  ~45 s since its last ping; it comes back as the Remote; "again" (same
  code, fixes kept, old tablets told, an old token refused); the Remote
  leaves; a tab on HTTP takes the self-steering Projector and the old one
  becomes the Remote; that Remote shows the projector itself and the HTTP
  Projector, waiting in a poll, hears it lost the role; delete, and the
  code opens nothing; once the next class has a student, a new tab is
  offered no steering and is refused both roles. Both modes pass on the
  local stack (763 HTTP requests with all polling).
- Headless Edge through the real pages: paste and not-a-quiz on the root
  page; the managed lobby, answers and fixing; a phone at `/teacher` taking
  the Remote; a full run with reveal, ranking, the bar after the Remote
  left, final, again; the projector window (drag hint, opener becomes the
  Remote); a Remote reloading mid-question without the wall taking over;
  Space revealing on the wall; delete reaching the wall; pasted on the
  phone with the laptop taking the wall; the fix sheet on the wall; a
  student and a Remote with WebSockets broken (the role choice polls twice
  in 8 s, not three times a second); a .docx; Delete on the root page; a
  tablet closed mid-question and its avatar picked back with its answer;
  `/teacher` after the Remote left mid-quiz, showing the Remote as "not
  once students are in". No page errors.

Revisit: 45 s once a phone in a pocket has been seen in a lesson; the gate,
if teachers are seen wanting a phone in mid-lesson.

## 2026-11-02 — Pictures on the screens

Serves: v2 item 1, with the owner's direction (beside the question, "might
depend on question length"; a background is a separate thing; nothing on
the voting devices); v1 items 9 (fixing during the run) and 19 (the right
quiz at a glance); v3 item 1 kept open (alpha). Built on the plan in
"Pictures in the archive". The trigger: the owner's own AI made a German
number-line quiz from a real sheet (19 questions, nine pictures and one
shared by five questions, all wide strips of 6:1 to 2.6:1); uploaded to
the live site, it showed no picture.

**Projector, question and reveal** (`client/screen.ts`, `layQuestion`):
- The picture goes **between** the question and the tiles, or **beside**
  both (picture left, question and tiles in one column on the right). The
  page lays out *between* first, then computes how large *beside* would
  show the picture. *Beside* is taken when the picture comes out at least
  1.3 times larger, with the picture at 58% of the width, else 50%, and
  only if the text stays readable in the narrower column: the question at
  1.5em or more, and no answer squeezed or below 1.3em. Otherwise it's
  *between*. Neither the AI nor the teacher chooses.
- What that gives: number lines and other wide strips go *between* at the
  full width; square and upright figures, and photos with short answers,
  go *beside*. A long question beside a square figure stays *beside* on a
  1366×768 laptop (question at 1.5em) and goes *between* on 1920×1080 and
  1280×800, where *between* already shows it large enough. A phone as the
  projector is always *between*.
- With a picture, the question starts smaller (3em instead of 3.6em up to
  40 characters, and so on down) and may take at most 30% of the height.
  The tiles keep a minimum height per row (13.5% of the height for answers
  up to 12 characters, 16% up to 30, 20% beyond). The picture takes the
  rest, at most 62% of the height.
- The figure's size is set in px from `w`/`h` in the view, so nothing
  moves when the file arrives. It sits on a white card. A picture smaller
  than its box is enlarged: blurry beats small from the back row.
- **The reveal moves nothing.** The question is laid out once per question
  (and window size). The reveal and incoming answers only change the
  tiles' marks, counts and bars in place; the figure isn't redrawn. The
  bars now grow from zero at the reveal.

**Enlarging the picture** (the plan's "full screen for a figure"): `Z` or
a click on the picture on the projector, "Enlarge the picture (Z)" in its
⋯ menu, or "Enlarge on the projector" on the Remote's current question.
- The picture fills the screen, above everything but the steering bar.
  The same key, click or button brings the question back.
- The state is on the server (`run.zoom`, command `zoom`), so the Remote
  and the projector agree. It is keyed to the step it was set in, so the
  reveal and the next question end it by themselves; the class always
  sees the tiles at the reveal.
- The projector may enlarge also while a Remote steers, like the clicker:
  it's the teacher at the laptop pointing at the figure.
- No clicker button is mapped to it. Clickers' "black screen" key sends
  `B` or `.`, and a figure appearing there would surprise.

**Background:** behind the whole projector, `object-fit: cover`, under a
light veil (55% of the page colour). The question, the lobby's join box,
the counter, the ranking's podium and class result, and the top bar sit
on white cards. A question's own background replaces the quiz's. My call,
as the plan proposed and still pending the owner: the quiz's background
also shows in the lobby and at the rankings. In the steering lobby the
question list below the fold has the plain page colour.

**Loading** (`client/pictures.ts`): the server sends pictures `no-store`,
so an `<img>` drawn again would fetch again.
- Each page fetches each picture once, into a blob URL, at most two at a
  time; the one on screen goes first and skips the queue. Every
  `<img data-pic>` is filled from that.
- The projector view carries `pictures`, every picture the projector may
  show, and the projector fetches them all as soon as it has a view: in
  the lobby, or on a reload mid-quiz.
- The teacher's pages fetch what they show.
- If a fetch fails, the `<img>` asks the server itself.
- Measured on the sample: 10 picture requests for a whole run, none at a
  reveal.

**Teacher's side** (`client/manage.ts`, `teach.ts`):
- **Question list** (lobby, and "All questions" during the run): a
  thumbnail under each question that has a picture, 72 px high, outside
  the answers' fold. A question's own background gets a smaller one
  labelled "background". The quiz's background is shown once above the
  list ("behind every question"). A tap shows the picture full size on
  that device (a dark overlay; a tap closes it).
- Nine of the sample's questions read "Welche Zahl ist mit dem Pfeil
  markiert?". Without the thumbnails the list can't tell them apart.
- **Remote, current question:** the picture across the card, above the
  answers, with "Enlarge on the projector". It's also what the teacher
  shows around when the projector has died.

**Fix: hide the picture.** In "Change the right answer", beside Void and
Skip: "Hide the picture" / "Show the picture again". It's for a wrong or
revealing crop.
- It's a per-question fix like the others (`Fix.hidePicture`, command
  `setHidePicture`). The projector's view then has no picture for that
  question, the projector doesn't fetch it, and it can't be enlarged.
- The teacher's view keeps the picture, faded and struck through, with a
  "picture hidden" tag, so it can be shown again.
- Allowed at any time, also on the open question. On the wall the
  picture disappears; the class saw it anyway.

**Alpha** (owner, via backlog v3 item 1: answers as images "will require
an alpha channel"):
- The upload no longer flattens a question's picture when it has
  transparency. It stays a PNG with alpha, up to 1.5 MB; larger, it's
  flattened to JPEG as before. Backgrounds are always flattened.
- The dark-screen case the flattening guarded against is now handled
  where pictures are shown: the projector's figure, the enlarged view,
  the thumbnails and the full-size view all put the picture on white.
- The server accepted any PNG already. v3 will need its own answer to
  where an answer picture sits; a white tile is the obvious start.

**Student devices:** unchanged, no picture (owner).

**Not done:**
- The upload page doesn't preview pictures; the lobby list is the
  preview.
- No picture in the "Change the right answer" sheet on the wall.

**Evidence** (headless Edge, local stack, through the real pages):
- **The owner's sample zip**, uploaded on the root page, with the
  projector at 1366×768, a phone as Remote and a tablet:
  - 10 pictures fetched ahead, each once;
  - 14 thumbnails in the lobby;
  - Q1 *between* at full width;
  - the figure, question and answer text at the same pixel positions
    before and after the reveal, and no fetch at the reveal;
  - Q10 (three number lines) *between*;
  - enlarged from the Remote, back with `Z`, enlarged by a click, ended by
    the reveal;
  - Q11's picture hidden from the Remote's list before it came up, and
    absent on the projector;
  - Q15 without a picture as before;
  - the full-size view on the phone.
- **A drawn quiz**, with the projector steering itself by keyboard:
  - a square figure, an upright one, a 3:2 photo with a 21-character
    answer, a long question with a square figure, two answers, a
    transparent line drawing, the quiz's background and a question's own;
  - each question at 1366×768, 1920×1080, 1024×768, 1280×800 and 390×844:
    nothing overflows, and the figure stays inside its area;
  - the transparent PNG served back with alpha 0 in the corner and 255 on
    the line;
  - the background in the lobby, behind the questions and at the final
    ranking.
- **First run, a bug found and fixed:** the layout measured the room
  before the top bar had its text. Square figures *beside* then ran past
  the bottom by the bar's height.
- `scripts/simulate.mjs` on the same stack: OK. Unit tests: 65,
  including zoom and hide.

Revisit:
- the 1.3× and 1.5em/1.3em thresholds, once real sheets with photos have
  been on a real projector;
- whether teachers find `Z` and the click, or only the Remote's button;
- the background in the lobby and rankings, once the owner has seen it.

## 2026-11-02 — Answers shuffled at upload

Serves: v1 items 1 (quiz format), 6 and 7 (a teaching moment, quick taps);
the measure, teacher time. Reverses "The order in the text is the order on
screen" in "The quiz text format". Settled with the owner through the
product owner.

Amended by the owner (2026-11-02, "Countdown and points for speed" work):
**the letters exemption is reversed.** Only `Order: fixed` keeps an order.
The exemption existed so the owner's own test zip, made before the line
existed, would still read well; that compatibility is worth nothing now,
and a rule hidden in the site is one neither the AI nor the teacher can
see or rely on. The guidance names the cases where the line belongs:
letters that label a picture, a sequence, rising numbers, "none of these"
last. `keepsOrder` and its test are gone; a test now checks that "A, B, C,
none" without the line is shuffled like any answers. The owner's
number-line zip shuffles its "A, B, C, Auf keinem" questions until it is
remade with the line.

**The problem.** The owner's number-line quiz from his own AI had the
right answer first in 14 of 19 questions. The other five were "A, B, C,
Auf keinem", where the key follows the figure. A class learns "tap red" in
a few questions.
- The site's warning ("the correct answer is in position N in every
  question") didn't fire: it needed every question.
- A warning costs the teacher a round trip in the break anyway.
- The guidance had a sentence on it. Whether the AI read it is unknown:
  the guidance may not have reached it.

**What was considered:**
- *A guidance-only fix*, the owner's first suggestion: write the right
  answer first, then the wrong ones, then permute with a script. It makes
  the text right when the AI does all of it. But an AI that skips the last
  step, or can't run code, now leaves every key first: worse than today.
- *Shuffling on screen only when the text shows the bias* (built briefly,
  then replaced): keeps the AI's order when it did its job. But the rule
  is harder to state, and the teacher can't predict what the class sees.
- *Settled:* the site always shuffles. The guidance states it as a fact,
  in the owner's words: answers will be shuffled; right answer first might
  be convenient. A question keeps its order where the order carries
  meaning.

**Why text order is no longer screen order.** It was there so a teacher
could match the text to the wall. The teacher now checks the key in the
lobby's question list and fixes it on the Remote. Both show the answers in
the order on screen, with the right ones marked, and the class sees the
same. Nobody needs the text beside the wall any more.

**How:**
- **Per class.** `Run.order[q]` maps position on screen to the answer's
  index in the text. It is made when the quiz is uploaded (the first
  class's lobby), stored with the run in the instance's storage, and made
  again for "Again with another class". A parallel class then can't be told
  "number 3 is red" in the break.
  - Reshuffling for another class is my call (the product owner left it
    open).
  - The cost: the second class's order differs from what the teacher
    checked before the first lesson. The key and the corrections are by
    answer, not by place, so nothing about them changes.
- **One order everywhere.** Every view shows the answers in the order on
  screen: the projector's tiles, the tablets' buttons, the Remote's
  current question and the question list, and the reveal's marks and
  counts. Commands that name an answer use that order too:
  - a tablet's `answer.choice`;
  - the teacher's `setCounts`.

  The instance maps them to the text's order (`orderOf`, `onScreen`,
  `fromScreen` in `instance.ts`). Everything stored stays by the text's
  order: answers, `Fix.counts`. So scores, fixes and "again" are
  unaffected. The clients needed no change.
- **Kept in order:**
  - **`Order: fixed`** (new in the format). After the question text, like
    `Image:`, it keeps that question as written. Before the first question
    it keeps all of them. Right after the answers it is also taken for the
    question above: unlike a picture line it can't be meant for the next
    question. `Order: shuffle` (or random, mixed) states the default.
  - ~~**Letters in order**, such as "A, B, C", optionally followed by one
    longer answer ("A, B, C, Auf keinem"), keep their order without the
    line.~~ Reversed, see the amendment above.
  - Not numbers in order: an AI that writes the key first and the rest
    rising would keep its bias by chance (one in three for three answers).
    `Order: fixed` covers numbers.
- **Old data.** Runs stored before this have no `order`, and tests start
  runs without randomness: both show the text's order.
- **Parser:** the position warning is gone; it would describe an order
  nobody sees.
- **Guidance:** "Up to four answers" now says the site shuffles and that
  writing the right answer first might be convenient. The parts list has
  "Answer order" with `Order: fixed`. The keyword list names it. The
  warnings list lost the position warning.
- **`/layout.html`:** `.a0`–`.a3` are places on screen, not in the text.

**Evidence:**
- Unit tests:
  - a key written first in 20 questions lands in at least three places;
  - every order is a permutation;
  - `Order: fixed` and letters keep their order;
  - another class gets another order;
  - the `Order:` forms, including before the first question and after
    the answers.
- Headless Edge on the owner's zip:
  - the lobby list showed Q1 in the order the class then saw;
  - the projector, a tablet and the Remote showed one order;
  - the tablet tapped "73 000" by its text, and the reveal ticked
    "73 000" with 1 vote; the tablet said right;
  - "77 200" was made to count on the Remote by its text, and the reveal
    ticked "77 200" and "77 400";
  - across Q1–9, keys written first landed in several places;
  - Q10 stayed "A, B, C, Auf keinem";
  - after "Again with another class", the order differed.
- `scripts/simulate.mjs`: its answers are now words (letters keep their
  order) and its two index-based checks go by text. It passes with
  shuffled answers.

Revisit: if teachers are confused that the class sees another order than
the AI's text; whether AIs use `Order: fixed` where it matters.

## 2026-11-02 — Hardening

Serves: v2 item 4; constraints "nothing public, nothing kept beyond its
use, nothing identified" and the Free plan "for a few users, usage limits
nudging heavy use toward self-hosting"; the Project's "a normal user who
can't use it, not a malicious one". Answers what reviews A and B left open.
Decided by the product owner within the owner's words; the numbers are
constants in `src/shared/limits.ts`, which the README points self-hosters
to.

**What it can and can't do.** Cloudflare's Free limits are account-wide
and reset at 00:00 UTC: 100,000 Function requests, 100,000 Durable Object
requests, 100,000 rows written, 5 GB stored in all (published limits,
2026-11-02; past any of them "further operations of that type will fail
with an error"). A pages.dev address has no zone, so no WAF: every request
reaches the Function and counts, rejected or not. A determined script can
spend the day's requests, and nothing on this plan prevents it. Accepted:
the remedy is self-hosting (or a domain with a WAF rule). The goal is that
accidents, careless clients and casual pranks don't, and that no quiz grows
without bound. A class of 25 over 15 questions costs about 1,300 rows
(answers 2 rows each, teacher steps about 4) and a few hundred requests on
WebSockets, about 3,000 on the HTTP fallback: some 75 classes a day on
rows, 30 on requests with every device polling.

- **Hammered buttons.** Children hammer a button; every tap was stored
  (2 rows), so one class making a game of it could spend the account's
  day. Now:
  - the device doesn't send an answer it already shows as chosen;
  - the server doesn't store a tap that changes nothing (a resend, or the
    same answer again; the newer sequence number is kept in memory, so a
    late older tap still loses);
  - changes of mind are capped at 10 per student and question. Past that
    the tap is refused, and the device shows the answer that counts, not
    the refused one (v1 item 15 holds).
- **Players per class: 60**, removed avatars included. The run is one
  stored value rewritten with every answer, and it has to stay under the
  2 MB a value holds; the projector draws every avatar. The owner's design
  target is about 25.
- **The door, automatic, no new control** (owner's "few elements").
  Amended by "Review C": the door stays open while the class is still
  arriving, and the 5 count from when the quiz is under way. Once
  the quiz has started, 5 more players get in, then "This quiz has started
  and takes no more players. Ask your teacher." A student whose tablet
  died picks their avatar back as before; that isn't a new player.
  **Remove now sticks:** the removed device keeps its token and shows the
  cross, with no "+" to join again, also after a reload. A determined child
  in a private window gets back in; the teacher walks over. The removed
  avatar still counts towards both caps, so removing and rejoining isn't a
  way in.
- **The site's share, booked** (`server/budget.ts`, `SiteBudget`, one
  Durable Object): every quiz that parses is booked against 300 uploads a
  day and 1 GB stored at once (text plus pictures). Storage is the limit
  that doesn't reset at midnight: filled, every write on the account fails,
  answers in running classes included, until quizzes expire. A quiz with
  errors books nothing. Ending a quiz releases its booking; a booking also
  lapses at the end of its code's claim, renewed alongside it, so a lost
  release can't fill the ledger for good. The refusal is the owner's
  self-hosting nudge: "The free site is full for today. Your own copy takes
  five to ten minutes: ask your AI to help set up your own, or follow the
  guide on GitHub (github.com/sacrusha/ClassyQuiz)." It shows as a message
  to the teacher, not as a problem to copy for the AI. Holds per quiz: its
  id, size, and until when; per day a count. Quizzes uploaded before this
  have no booking and aren't counted.
- **Left-behind classes.** A class nobody steers for 3 hours ends: under
  way, with its final ranking, whose data goes an hour later as before; a
  lobby with students opens empty again (the tablets are told the quiz has
  finished). The clock runs from the teacher's last step or the last
  student joining, so a lobby filling for a lesson hours after the upload
  isn't cleared. An empty lobby isn't touched: an upload the evening before
  waits. Before this, an unfinished class kept its tablets connected for the
  quiz's 48 hours; on the HTTP fallback each one costs about 144 Function
  and 144 Durable Object requests an hour.
- **Devices left on.** A tab whose view hasn't changed for 45 minutes
  sleeps: the line closes, the wake lock is released, and "Tap to continue"
  covers the page. The waking tap or key doesn't reach the page, so it
  presses nothing and doesn't advance the quiz on a clicker. Coming back to
  the tab (a tablet switched on) wakes it too. A lesson is 45 minutes, and
  in a running quiz the view changes with every step. Pages' own timers
  (`tick`) don't wake it. In `client/net.ts`, so it covers every page with
  a line, the picture screens included.
- **The allowance spent.** Devices say so instead of showing the offline
  dot: "The free site has used up today's allowance. It works again at
  01:00 Swiss time. Your own copy …", the hour computed (02:00 in
  summer). The Function maps
  a platform error that reads like a spent limit to `{error: "quota"}`
  (503); an instance whose write fails that way answers `{t: "quota"}`
  and reloads its state from storage, so nothing shows that isn't stored;
  the client also takes a 429, or a page mentioning error 1027, as spent.
  Then it asks again once a minute rather than every few seconds. Joining,
  and uploading on the root page, show the same words. **Unverified:** the
  error's wording (matched on "free tier", "daily limit", "quota"), and
  what Cloudflare returns once Pages Functions pass their requests (the
  Workers docs say error 1027; status and Pages behaviour aren't
  documented). To check in the dashboard and with a look at the responses
  the first time it happens, or never.
- **Bodies without a length** (review A): every POST to an instance is
  read in the Function, capped at 20 KB, whatever its Content-Length says,
  and forwarded as text; JSON uploads likewise at twice the quiz limit.
  Before, a chunked body reached the instance whole, and a large one could
  have reset a class's instance mid-lesson. Uploads with pictures already
  needed a length.
- **Content-Security-Policy** on every page (`scripts/build.mjs`,
  `_headers`): scripts only from the site's own files, no plugins, no
  `<base>`, forms to the site, no framing; pictures also as `data:` (the
  favicons) and `blob:` (the projector fetches pictures into object URLs).
  Styles stay open: the pages set many inline. WebSocket addresses stay
  open (`ws: wss:`): matching them by `'self'` is uneven on older browsers.
  It's the second layer behind escaping: quiz text is the teacher's AI's,
  and a slip in any page that builds HTML from it must not run.

**Not done, and why:**
- **Rate-limiting code guesses, uploads or roles.** A refused request still
  costs the Function request it was meant to save. Counting in a Durable
  Object costs a DO request per guess, as much as the lookup it protects.
  Cloudflare's Rate Limiting binding is per location and approximate, its
  docs advise against keying by IP, and Free/Pages support isn't
  documented. Keying by IP misfires on school NAT, where a class shares
  one, and the owner ruled out IP-based limiting altogether ("nothing
  identified"). What a guess wins is an avatar in someone's class, which
  the cap, the door and Remove now handle. Taking a role is already closed
  once students are in.
  *Amended 2026-11-03 ("After upload"):* that last reason went with the
  gate. A role now takes the teacher code, and wrong teacher codes are
  limited per device in the quiz's instance, which the check reaches
  anyway: no extra request. The owner: the "no IP addresses" decision is
  about logs and retention, not attack detection, so the device's address
  may be counted transiently (salted, in memory, for the window, never
  stored or logged). Class codes stay unlimited, for the reasons above: a
  wrong class code finds no instance to count in.
  *Amended again after review D:* memory alone forgot the counts whenever
  the instance idled (about 10 s locally), so the counts are now in the
  instance's storage, and the quiz has its own allowance besides (ten wrong
  endings, one more every six minutes, whatever the address). The device
  stays a salted hash; it is stored now, with its per-quiz salt, but only
  while it counts (the minute, or the ten-minute refusal): the alarm
  deletes it then, and the quiz's end deletes the salt. Not logged. See
  "After upload", its review D part.
- **Stripping bidi characters** (review A). The only text anyone sees is
  the teacher's own quiz, on their own class's screens: avatars are
  assigned, nobody types a name. Stripping could damage legitimate
  right-to-left text. Isolating quiz text (`unicode-bidi: isolate`) is
  display hygiene for whoever next touches the screens.
- **Logs.** The state Worker has `observability` off. Pages has no such
  key: its documented config keys don't include it, and its Functions logs
  "are not stored", only streamed while someone tails them
  (developers.cloudflare.com/pages/functions/debugging-and-logging,
  2026-11-02). So nothing to set; error logs carry the message only, as
  before.

**Checked:**
- Unit tests: the door (60, removed included; 5 late; a removed late
  joiner still counts), answers (same tap and resend unchanged, a late
  older tap loses, 10 changes then refused, the counted answer tapped
  again is fine, the score follows).
- `simulate.mjs` against a local stack, both modes pass (758 and 768 HTTP
  requests with all polling, against 763 before).
- HTTP probes: 30 more taps on the same answer stored nothing (the view
  version didn't move); the 11th change refused; 60 join and the 61st is
  told the class is full; after Start 5 join and the 6th is turned away; a
  removed device sees itself removed; a 1 MB chunked poll body gets 413
  and a 500 KB chunked upload 400.
- A stack with small limits (4 uploads a day, 2,000 bytes, a class idle
  after 15 s): the second large quiz refused with the owner's words, taken
  again once the first was deleted; a quiz with errors books nothing; the
  fifth upload of the day refused; a lobby with a student cleared and its
  tablet told; a class under way ended with its ranking; the quiz, its
  empty lobby and its code still there.
- Headless Edge through the real pages: the CSP header on `/`, `/check`
  (which still passes), `/layout.html`, `/teacher`, the Projector with its
  QR code and the student page, with no violation or page error; eight
  taps on one button send one answer; after 45 minutes (clock moved on) the
  student page sleeps, doesn't hear the reveal, and a tap wakes it onto
  the reveal it missed; the allowance spent, as our `{error: "quota"}` and
  as a 429 page with 1027, shows the notice, which goes once the polls
  succeed again (up to a poll's 25 s hold); joining with it spent shows
  the words, not a spinner; the 61st device reads "This class is full";
  the root page shows "The free site is full for today" without the
  copy-for-AI button; a sleeping Projector woken by Space stays in the
  lobby, and the next Space starts the quiz.
- After merging with the picture screens and the shuffled answers (taps
  name a place on screen, translated to the text's order before the
  answer rules above apply): tests, typecheck, `simulate.mjs` in both
  modes (760 requests all polling) and the probes and pages above again,
  plus a Projector over HTTP showing a question's picture from a `blob:`
  URL with no CSP violation, the allowance notice over it and gone again,
  and asleep, woken by Space without a step, the picture still there. A
  step pressed while the allowance was out (HTTP) is resent once a minute
  and happens when it comes back; the `at` guard drops it once the class
  has moved on.

**Deploy:** the state Worker's migration `v4` adds `SiteBudget`. `npm run
deploy` deploys the state Worker before the site, which is the order it
needs.

Revisit: the numbers, once the deploy log or the dashboard shows real
use; the door, if teachers are seen with more than five latecomers; the
quota wording, the first time the allowance runs out.

## 2026-11-02 — Countdown and points for speed

Serves: v2 items 2 (optional countdown) and 3 (speed scoring); v1 item 6
("no clock pressures the teacher"), item 8 (closure, slow readers
included), item 15 (a tap that looked in time counts). The design was
mine; the product owner settled the open points within the owner's words
(below). The owner's thoughts were a smooth bar or circle rather than a
count, perhaps a "start the countdown" button, and possibly the question
first with the answers only during the countdown.

**Amended 2026-11-03 by the owner. Two changes; the rest of this entry
stands.** Lengths since replaced by "The tempo by the owner's
decomposition": no length picker or single length; 60 s without `Time:`;
`Time:` 10..60; −5/+5 during the run.

*1. The quiz carries its tempo.* The owner: "tempo is a bit of a problem if
it's done in the lobby and the quiz not designed for a specified tempo."
The AI that wrote the questions knows which take a minute of arithmetic
and which ten seconds, and the quiz is the finished deliverable.
- **Format:** `Tempo: countdown` or `Tempo: speed` before the first
  question (also `pace`; forgiving wording such as "countdown with points
  for speed").
- **`Time: 30`** (also "30 s", "1 min", "1:30"): before the first question
  for every question, after a question's text for that question, and after
  the answers for the question above (like `Order:`). It is clamped to
  5–300 s.
- **A missing line means what it meant before:** the teacher's pace, and
  20 s once a countdown runs.
- **What can't be read** is a warning, not an error: an unknown tempo, a
  `Tempo:` line after the first question, or a `Time:` that isn't a
  length.
- **The lobby shows what the quiz says.** The tempo line reads e.g.
  "Countdown, lengths as written". Each upcoming question shows its
  length as a tag in the list.
- **The teacher's choice overrides:** a tempo, or one length for every
  question. "As written" goes back to the quiz's lengths.
- **Precedence** (`secondsFor`): the teacher's length, then the
  question's `Time:`, then the quiz's, then 20 s.
- **Guidance:** a "Tempo" item among the parts of a quiz, in the page's
  register. It says what a countdown does, how long typical tasks take, and
  that the reading isn't part of the time. It also says which material
  suits which tempo.
- This reverses the product owner's "no `Time:` line" (length point 3,
  above).

*2. The tempo can change mid-quiz.* The owner asked how a teacher changes
an unfun tempo mid-quiz. ⋯ now has "Tempo: …" during the quiz, the same
sheet as in the lobby, marked "From the next question on". It covers
countdown on or off, points on or off, and the length.
- **Each question keeps the tempo it came up under** (`Run.played[q]`, set
  when it opens). The question on screen is read, timed and scored as it
  came up. That removes the ambiguity that had locked the tempo.
- **The scale:** if any question that scores was played for speed, every
  right answer is worth 10. Questions played for speed with a countdown
  add their bonus. Otherwise a right answer is 1 ("right out of so many").
- So switching on points mid-quiz rescales the earlier questions from 1
  to 10 each. The order between players is kept, since earlier right
  answers each move to 10 together, and the ranking changes its display.
- Voiding the only speed question goes back to the 1-point scale.

Checked:
- Unit tests (77):
  - the parser's `Tempo:`/`Time:` forms, the clamp, warnings, and that no
    line means teacher's pace;
  - a mid-quiz switch: the open question keeps its reading step, the next
    one opens at the teacher's pace, scores 15/25/10 on the speed scale,
    and the 1-point scale comes back after a void.
- An HTTP probe of a quiz with `Tempo: countdown` and two `Time:` lines:
  - the lobby view says countdown, lengths as written, 15 and 40 s;
  - the first question reads and its clock is 15 s;
  - switching to pace mid-question leaves it reading;
  - the next question opens without a clock.
- On a restarted stack:
  - `simulate.mjs --tempo` and the plain mode both pass;
  - the browser walk passes with no page errors;
  - a Remote on a quiz with `Tempo: speed`, `Time: 20` and one `Time: 60`
    shows "Countdown and points for speed, lengths as written", the tags
    20 s and 60 s, "As written" marked in the sheet, and the sheet from ⋯
    mid-quiz.
- Lesson for the next local stack: wrangler dev didn't reload the state
  Worker after its folders were replaced by a fresh copy. Restart the stack
  after copying server code. The shuffle change of 2026-11-02 was therefore
  checked by unit tests only, not on the stack.

**One choice, three tempos, off by default.** In the lobby, under Start,
one line: "Tempo: Teacher's pace ›". It opens a sheet with three choices,
each with one sentence:
- *Teacher's pace* (the default, v1 unchanged);
- *Countdown*;
- *Countdown and points for speed*, plus the length (10, 20, 30 or 60 s).

Speed points without a countdown aren't offered. With the teacher reading
aloud, a clock started with the question measures reading speed, and with
no end there is no scale for "slow". The choice is per class, carries over
to "Again with another class", and can't change once the quiz has started.
The length can change at any time, from ⋯ on whichever tab steers. It
applies from the next Go.

**The question first, the answers on Go.** With a countdown, a question
opens for reading:
- the wall shows the question and its picture, with the tiles in their
  final places, coloured and shaped but without text (nothing moves at
  Go);
- the tablets show the eye they show in the lobby, and get no answers;
- the steering tab's main button is **Go**, and the clicker's next step is
  Go too.

Go shows the answers everywhere and starts the clock. This is the owner's
"start the countdown" button. It is also what makes speed fair: time zero
comes after the reading, so a slow reader who heard the teacher read the
question starts level. The cost is one more press per question, only for a
class that chose the countdown.

**Time's up closes answering; it doesn't reveal.** The reveal stays the
teacher's step. This goes against Kahoot's convention, and the product
owner confirmed it. When time runs out:
- the wall's bar is empty and a timer shows next to the answered count;
- the tablets keep their buttons, the chosen one marked, but take no more
  taps;
- the Remote says "Time's up: answering is closed".

This is the state that v2 item 6 (spread, then key) needs, between
answering and the key. Answering also closes early when everyone present
has answered. Away devices don't hold it open, the same rule as "n of
25".

**The clock never presses the teacher.** Reveal ends it early. From ⋯:
- "Stop the countdown: answers stay open" turns the question into
  teacher's pace;
- after time's up, "Open the answers again, without a countdown" does the
  same.

Nothing moves on by itself.

**The bar.** A bar that drains smoothly, with no digits, as the owner
leaned. Its last fifth turns orange.
- On the wall it runs along the top edge, over everything, including an
  enlarged picture. It takes no room from the question, its picture or
  the tiles, so no layout changes.
- On the tablet it sits above the buttons; on the Remote, in the current
  question's card.
- It is one CSS animation with a negative delay (`client/clock.ts`). A
  redraw, or a device that arrives mid-countdown, picks up where it is
  without a timer in the page.

A circle was rejected: it needs a place of its own and competes with the
picture layout.

**Time on unsynchronised devices.** Device clocks aren't synchronised.
Views carry what was left when the server made them (`leftMs`). A device
runs its bar from when the view arrived, so its countdown ends at or after
the server's, never before. The server closes answering at the deadline
with the Durable Object's alarm, the same alarm the lifetime uses:
`scheduleAlarm` takes the earliest. The close is a view change like the
reveal. `Run.closedView` records the version of the first view that showed
answering closed, whether by time's up or the reveal. A tap made on an
older view counts whenever it arrives, by item 15's rule. `closedView`
replaces `revealView`, which is still read for runs stored before.

**What a tablet shows when time runs out.** A tablet whose own bar has run
out closes its buttons without a redraw, so no tap is swallowed by one. A
tap still on its way shows as chosen.

**The time a tap took is measured on the device.** It runs from the
answers appearing on that device to the tap. Before, `ms` was the server's
arrival time after the question opened. That includes the network both
ways, and for a late tap counted by item 15, the whole time offline. On
school Wi-Fi the podium would have gone to the best line.
- Each view carries `sinceMs`, how long the answers had been showing when
  it was made. The device adds its own time, so a reloaded tablet still
  measures from Go.
- The server caps the device's figure at its own count, which includes
  both trips, and never goes below zero. A page that sends no figure (an
  older cached page) gets the server's count.
- This trusts the client, which fits "a normal user, not a malicious one".
- The last tap counts, with its own time: a change of mind costs speed.

**Scoring is a mode.** Scores are still computed from the stored answers
under the current fixes (`points` in `game.ts`):
- without speed points, a right answer scores 1, as in v1;
- with them, `POINTS_RIGHT` (10) plus `speedBonus`: up to `SPEED_BONUS`
  (5), whole points, by the share of the countdown left.

That is the Kahoot ratio, chosen by the product owner: two fast right
answers weigh as much as three slow ones. Whole points keep ties possible,
and ties share a place.
- A key changed afterwards moves the points with their speed.
- A tap after the countdown's length (possible once the clock was
  stopped) scores 10 with no bonus.
- The numbers are in `shared/tempo.ts`, one place for a self-hoster (or
  us) to tilt.
- The tablet shows "+13" under the check at the reveal.
- The ranking shows the score without "/ questions" when speed counts.

**The clicker is inert for a moment after a press,** like the buttons
(`STEP_LOCK_MS`). Go and Reveal share a phase. A clicker pressed twice
took two steps once the first step's view was back (found in headless
Edge, about 150 ms apart): Go, then straight to the reveal before anyone
could answer. This was already possible before the countdown (Reveal,
then Next). Commands also carry `at.reading`, so a doubled Go sent from
the same view is stale rather than a reveal.

**Protocol and state** (all additive; stored runs without them read as
teacher's pace):
- `Run`: `tempo`, `seconds`, `clocks[q]` (`at`, `ms`, `stopped`,
  `closed`), `closedView`;
- commands: `go`, `stopClock`, `tempo`;
- `answer.ms`, `At.reading`;
- views: `answering` (reading/open/closed) and `clock` on the question,
  `sinceMs` and `reveal.points` for the tablet, `tempo`/`seconds` for the
  teacher, `ranking.speed`.

`viewKey` (in `shared/protocol.ts`) leaves out the fields that only say
how much time has passed. A student's view is still sent only when what it
shows changes.

**Pages.**
- The guidance's account of a lesson gains a paragraph on the tempo, so
  an AI can tell the teacher it exists. The quiz format is unchanged.
- `/layout.html` describes the reading state and the bar.
- The README points self-hosters to `shared/tempo.ts`.

**Free plan.** A countdown question costs one alarm and one or two stored
rows (Go and the close). With all 25 devices polling, the simulation made
891 HTTP requests with the countdown, against 747 for the same branch
without it (758 to 768 on main earlier): the extra step per question, and
a run that lasts longer, cost about a fifth more.

**Checked:**
- Unit tests (75):
  - reading refuses taps, and the clicker's step from reading is Go;
  - time's up doesn't reveal;
  - a tap on the open view counts after the close, and one on the closed
    view doesn't;
  - the clock can be stopped, and the answers opened again after time's
    up;
  - speed points of 15, 11 and 0, which follow a key change and a void;
  - the device's time is capped by the server's, with the server's used
    when there is none;
  - the tempo is chosen in the lobby only, its length changes for the
    next question, and it carries over to the next class;
  - the teacher's pace is unchanged.
- `simulate.mjs --tempo` (new): the countdown with speed points, a doubled
  Go on every question, answering closing before the reveal, and every
  score checked against the device times the tablets sent. It passes over
  WebSockets and with `--all-poll`. In both runs answering closed every
  time because everyone present had answered.
- An HTTP probe of the alarm path:
  - one of two students stays silent;
  - answering closes about 10 s after Go without a reveal;
  - the silent tablet's tap made on the open view still counts, and its
    tap on the closed view is refused;
  - stopping the clock reopens the answers;
  - the tempo can't change after Start, but the length can.
- Headless Edge through the real pages (wall 1280×720, phone, two
  tablets), with no page errors:
  - the default line in the lobby, and the sheet chosen on the phone;
  - reading: tiles veiled, the eye on the tablet, Go on the Remote;
  - a doubled Space on the wall leaves the question open;
  - the bar on the wall, the tablet and the Remote;
  - time's up on all three, and a tap after it not taken;
  - "+13" at the reveal, and the ranking without "/";
  - ⋯ offering the length, then "Stop the countdown", after which the bar
    is gone everywhere;
  - the wall's tempo sheet closing once the phone steers.
- The plain simulation's "final view reached" check failed intermittently
  on this branch and on main's code alike. The cause was devices still
  inside a 5 s chaos drop at the check. It now waits for the drops to end.
  The simulated tablets also no longer send the answer they already show
  as chosen, like `client/play.ts`. The server keeps the first tap's time
  for a repeat, which the tempo check had counted from the second.

**Not established:**
- Whether a class finds the empty tiles while reading odd. They could
  instead show nothing at all, but the layout would then jump at Go.
- Whether orange reads as "nearly over" on a washed-out projector.
- The alarm's precision on Cloudflare under load. Locally it fired well
  within a second. A late alarm only means the bar sits empty a moment
  before the tablets lock, since each tablet locks at its own end anyway.

Revisit: if classes leave the countdown on and slow readers drop out of
the ranking anyway (then a smaller `SPEED_BONUS`); if teachers want a
length per question (a format line was rejected: every addition is
something an AI must write reliably, and the teacher is in the room).

## 2026-11-03 — Guidance: what makes a picture work on the wall

Serves: v2 item 1, its "Open" paragraph. Before this, the guidance told
the AI how to attach a picture and pointed at the layout. It didn't say
what makes a picture work on the wall: a tight crop, how wide and square
figures land, what the back row can read, nothing from the solutions or a
pupil's name in the crop, the size caps.

**What changed.** `public/index.html`, under "How quizzes are built", has a
new subsection "Pictures on the wall". It replaces the one sentence about
crops and moves the link to `/layout.html` into it. It is written as
situation, in the page's register: what the AI needs to judge a crop, not
rules. Its four paragraphs:
- **Where a picture lands.** About eight to ten metres to the back row. At
  most about three fifths of the height. Wide figures go between the
  question and the tiles, at full width; a 6:1 strip takes under a third
  of the height. Square, upright and landscape up to about 3:2 go beside a
  short question, at about half the width. The site chooses. The teacher
  can enlarge a picture, with the question out of sight while it is.
- **So what reaches the back row is the crop.** Margins and neighbouring
  exercises take room from the figure. Labels read at about a tenth of the
  figure's height. Text to be read belongs in the question. A photographed
  sheet projects as taken (a grey page, a shadow, a slant), and a
  transparent picture shows on white.
- **What must not be in the crop.** A pupil's filled-in answer, a printed
  solution or worked example, the key, a name, a stamp. A redrawn figure
  (SVG) can replace one with the answer in it. A figure can also give the
  answer away by itself.
- **The caps.** 60 pictures and 16 MB per zip; 1600 px on the long side,
  1920 for a background. A small picture is enlarged.

**Where the numbers come from:** "Pictures on the screens" (62% of the
height, 50 to 58% of the width beside, the 1.3× rule) and
`shared/protocol.ts` (the caps). The 3:2 boundary is worked out from
`layQuestion` for a short question on a 1366×768 screen. Beside wins up
to about 3:2; at 2:1 the picture goes between.

**Not established:**
- "A tenth of the figure's height" is my estimate. On a 768-px-high
  projector, a figure shown about 300 px high gives labels of about 30 px,
  roughly two thirds of the answer tiles' letter height. No room has been
  measured.
- Whether AIs crop tighter with this text, and leave pupils' writing out,
  is untested. The product owner ruled out a fetch test for this change:
  the fetcher that matters isn't the one we can run, and the page's
  structure is unchanged.

Rendered in headless Edge: the section reads in place, and the page has
no errors.

## 2026-11-03 — For whoever picks up the landing page (backlog items 16 and 2, the owner's latest words)

A handover from the countdown worker, who stopped at the picture guidance.
These are facts about the code that aren't obvious from the backlog; the
design is yours.

- **One file, two readers.** `src/public/index.html` is both the landing
  page and the guidance an AI reads.
  - The landing part is `<section class="start">`: Build a quiz, Run a
    quiz, and the `.foot` line with the three links.
  - The guidance is `<div class="guide">`, from the `<h1>` "About
    classyQuiz" on. Its anchors are `#site`, `#quizzes`, `#format` and
    `#with-a-teacher`.
  - An AI told the site's name fetches this whole page, so whatever the
    landing part says is also read as guidance. "Guidance page is
    information, not instruction" applies to both: imperative text trips
    AI injection guards.
  - Styles are inline in the page's `<style>`, not `app.css`.
- **The Run box's code** is `src/client/home.ts`:
  - Ctrl+V anywhere on the page;
  - the "Paste the quiz" button, which reads the clipboard;
  - the `#manual` textarea fallback, for when the clipboard can't be read;
  - the file input and drop;
  - "That doesn't look like a quiz yet", for a paste without markers;
  - the resume list in `#mine`. It holds one entry per quiz this device
    pasted that is still open, from localStorage. It calls `/api/i/:id/info`
    with the device's secret, and Delete asks inline.

  **Zip only** (owner, item 2) means removing the paste paths, the
  clipboard button, the textarea and that message. Keep
  `countAttempt(uploadFormat(...))` on drop and choose, so what people try
  is still counted. The "paste" format in the counter then stops occurring.
  `uploadFormat` and the counter are in `shared/upload.ts` and
  `server/stats.ts`.
- **The guidance assumes pasting in several places. Under zip only, each
  needs to change:**
  - "How a lesson runs" in `#site`: "pastes the quiz into the box … or
    drops the file";
  - all of "Getting the quiz to the site" in `#format`: the code block and
    copy button, "The site takes no single text file";
  - the `.foot` line;
  - the messages for the teacher in `home.ts`: "That doesn't look like a
    quiz yet", and the one for a wrong file type. Both send the teacher
    back for "a block with a copy button" or "one code block".

  The quiz text inside the zip keeps its format. An AI that can't make
  files can no longer deliver at all. The owner chose that, to find out.
- **The link targets today:**
  - "check the school network" goes to `/check` (`public/check.html`,
    `client/check.ts`). Its verdict is already one of three: all good; the
    quiz runs over HTTP; blocked, ask IT ("Runner: network check"). So the
    owner's "one click → all good, or what to tell IT" is mostly the
    landing line's wording, plus the IT text on the check page.
  - "run your own copy" goes to the GitHub repo. Its README "Your own
    instance" has the setup steps, the token's three permissions and
    `npm run deploy`.
  - "about this site" goes to `#site`.

  A new static page (like `public/layout.html`) is copied to `dist/` by
  `scripts/build.mjs` with no further wiring. The CSP allows only the
  site's own scripts, so a page with no script, or one bundled per page,
  works.
- **"A few hundred quizzes a month"**: the numbers behind it, from
  "Hardening" and `shared/limits.ts`:
  - uploads are capped at 300 a day, site-wide;
  - the day's request allowance covers about 30 classes when every device
    polls, about 75 on stored rows;
  - "a few hundred a month" is therefore conservative, not a cap.

  The same self-hosting words appear in `OWN_COPY` in `shared/limits.ts`,
  shown when the site is full or out of allowance ("…or follow the guide
  on GitHub"). If a guide page replaces the GitHub link, that string
  should point to it too.
- **Testing:**
  - The shots tool under the session scratchpad (`shots-tool/`,
    puppeteer-core driving Edge) has walks of the root page:
    `mock-root.mjs`, `upload-count.mjs`, `smoke.mjs`.
  - A local stack: see "A second local stack" in "Pictures in the
    archive".

## 2026-11-03 — The landing page by attention budget; zip only

Serves: v1 item 16's last paragraph (the live page overspends attention),
item 2's last paragraph (a drop target and file opener for a .zip, nothing
else), item 14 (self-hosting nudge), item 17 (coming back). Supersedes the
paste path of "Upload accepts paste, a single text file, or an archive" and
the GitHub link of "Self-hosting nudge". The owner's examples were taken as
examples; where the result differs, the reason is below.

**Run a quiz is one element.** A dashed box with one button, "Open the
quiz's .zip", and "or drop it here". Gone: the Paste button, the textarea
fallback, "the block your AI made", "That doesn't look like a quiz yet".
- Nothing on the page invites pasting, but the page still listens for
  Ctrl+V. A file copied in the file manager and pasted opens like a
  chosen one. Text pasted or dropped gets "The site takes the quiz as a
  .zip file, not as text. Ask your AI for the quiz as one .zip file,
  download it, and open it here." It is counted as `paste`, so whether
  teachers still try (an AI that read the old guidance, say) stays a fact
  to look up. Silently ignoring it would leave a teacher with nothing.
- Any other file gets the same sentence after "not a .docx file", and is
  counted by format as before.
- "Copy the message for your AI" now asks for a corrected .zip.
- `accept` also names `application/x-zip-compressed` (what Windows reports
  for a .zip), so a picker that filters by type doesn't grey it out.
- The server's JSON upload of plain text is unchanged: the simulator and
  probes use it, and nothing on the page reaches it any more.

**Build gains a third step:** "It hands you the quiz as a .zip file.
Download it." With zip only, the Build list has to end where Run begins.

**The resume list: one line, under the box.** "Resume Prozente ▶ ·
closes 16:20 · Delete…", for the latest open quiz on this device. Any
others fold under "1 more quiz". The code is gone from the line, since
Resume carries it. The box no longer moves down when a quiz is open: it is
the page's main action and stays in one place. Delete… sits at the far
end and still asks inline.

**"About this site" is gone.** The guidance below the start section is for
the AI. A teacher who scrolls finds it, and the Build steps already say the
AI can explain how the site works.

**Two foot lines that say what their links are for:**
- "Some school networks block live quizzes. *Check this network*: one
  click tells you it works, or what to ask IT." The check page already
  ended in one of three verdicts. The two that aren't "all good" now carry
  a message to forward to IT, with the site's own address: allow it, it is
  a quiz site, it needs HTTPS and WebSocket connections, and what is
  blocked now.
- "This site is free, and shared by everyone who uses it: a few dozen
  classes a day in all. If that's too tight, your AI can set up *your own
  copy*." The owner's example said "a few hundred quizzes a month". I gave
  a daily figure, since the limits reset daily and "full for today" is what
  a teacher would meet. It comes from "Hardening": about 30 classes a day
  when every device polls, about 75 on stored rows, under the 300 uploads
  a day. A comment at `OWN_COPY` in `shared/limits.ts` says the sentence
  rests on those numbers.

**`/own-copy`** (`public/own-copy.html`, static, no script) is the short
guide the owner described:
- why: the shared site's daily allowance, and that an own copy's is yours
  alone;
- who does what: GitHub (where the code is, no account needed),
  Cloudflare (whose free plan runs it, your own account), your AI (the
  setup);
- what you need: an AI that runs programs on your computer, such as Claude
  Code (a browser chat can explain but not carry out), a computer where you
  may install programs (a school laptop often isn't one), an email address;
- a sample prompt; what you do yourself (account, token, a name for the
  site), and that the AI asks before it installs anything;
- afterwards: name your own address to the AI; ask it to update from
  GitHub; the GitHub link.

The token goes where the AI says, not into the chat. The README's "Your own
instance" now tells an AI that: what the teacher does (account, token,
name), and that the teacher pastes the token into `secrets/cloudflare.env`
themselves. `OWN_COPY` points to `/own-copy` instead of GitHub. The page
makes no time promise: "five to ten minutes" was never measured, and a
first setup with Node.js to install is likely longer.

**The guidance (`#site`, `#format`) assumes a .zip throughout.** "Getting
the quiz to the site" now says the site takes one .zip and nothing else,
what is in it, that two quizzes are two files, and that an assistant that
can't create files has no way to hand a quiz to the site. The paragraphs on
the code block, the copy button and bullet points that eat the markers are
gone. The self-hosting paragraph links `/own-copy`.

**Checked:**
- Typecheck.
- Headless Edge, local stack (`shots-tool/landing-walk.mjs`), no page
  errors:
  - the page at 1366×768 and 390×844, with no sideways scroll on the phone;
  - the button opens the file chooser;
  - two .zip files opened lead to the lobby;
  - back on `/`, the resume line, "1 more quiz" and its fold, and Delete…
    asking inline;
  - pasted text and a .docx show their messages;
  - the stats counted `paste` 1, `docx` 1, `zip` 2;
  - `/check` all good, and with WebSocket blocked the HTTP-only verdict
    with the IT message;
  - `/own-copy` at phone width.

**Not established:**
- Whether free Claude, and other free tiers, hand over a .zip. An AI that
  can't make files can no longer deliver at all. The owner chose that, to
  find out.
- Whether an Android tablet's file picker shows a .zip downloaded from a
  chat app as selectable under this `accept`.
- How long a teacher's first own copy takes with Claude Code. Not tried.

## 2026-11-03 — The tempo by the owner's decomposition: 60 s safe, −5/+5 during the run

Serves: v2 item 2's last paragraph. The owner splits the tempo three ways:
- the teacher's pace, with full control;
- a safe countdown of 60 s, which may be boring;
- a fast countdown, which needs designed questions and a way for the
  teacher to adjust: a −5/+5 pair during the run, persisting across
  questions, 10 to 60 s. That keeps the lobby less cluttered than a length
  picker.

Replaces the lobby's length picker (10/20/30/60) and the teacher's single
length over every question ("Countdown and points for speed", amendment
1). The quiz's `Tempo:` and `Time:` lines stay: they are the "designed
questions". Approved by the product owner as proposed.

**The model: an offset over the quiz's lengths.**
- `Run.adjust` replaces `Run.seconds`: the seconds the pair added or took
  away.
- A question's countdown is its length as written (`Time:` for the
  question, else the quiz's, else 60) plus `adjust`, held within 10..60
  (`secondsFor`).
- An offset, not one length, because per-question lengths are the design:
  +5 on a 15 s vocabulary question shouldn't turn the next 45 s sum into
  20 s.
- Each length is clamped on its own. From 50 and 20, +10 gives 60 and 30.
  Cutting a written 60 to 10 carries −50, so a later written 15 runs 10.
- `adjust` carries over to "Again with another class", like the tempo.
- Production never had the countdown, so no stored run carries `seconds`.

**What the pair acts on** (`nudgeTarget`):
- the countdown running now;
- else the question being read;
- else, when the class plays with a countdown, the next question.

It is not shown in the lobby, at the teacher's pace (unless a clock still
runs from before a switch) or after the last question.
- On a running countdown it acts at once (approved; "persisting across
  questions" read as including the one on screen). The clock's `ms`
  changes, the alarm is rescheduled through `afterTeacherChange`, and
  every screen redraws its bar.
- Cut below the time already gone, answering closes, with the same
  `closedView` rule as time's up: a tap made on an older view still counts.
- At 10 or 60 the button is disabled, and a press that arrives anyway
  changes nothing.
- The command `{op: "nudge", by: ±5}` carries no `at`. Two presses are
  meant as two. One pressed at the reveal that lands after Next acts on the
  same question, now being read.
- Points for speed use the clock's final length.
- Devices key their local end by question and length (`localEnd`), so a
  changed length restarts the bar from the new view's `leftMs`. A tablet
  that had locked its buttons at its own end opens again when +5 extends a
  clock the server hadn't closed.

**Where it shows:**
- On the Remote: a line in the question's card, "Countdown [−5] ⏱ 25 s
  [+5]". It reads "Next countdown" once this one is over (time's up,
  stopped) and at the reveal or the ranking.
- On the wall while it steers itself: in the steering bar, before the step
  buttons. On a phone-sized wall the bar tightens and the code gives way,
  so five controls fit in 360 px.
- The lobby keeps one line, "Tempo: Countdown, 20–40 s ›", showing the
  range of the lengths to come. Its sheet has the three tempos and one
  sentence: the lengths as the quiz says (or 60 s), and that −5 and +5
  change them during the quiz, from 10 to 60 s.

**The format's `Time:` range is now 10..60, the pair's range** (approved).
A line outside it is taken at the bound with a warning ("was taken as 60
seconds: a countdown is 10 to 60 seconds"). Before it was 5..300. The
guidance says a task needing more than a minute suits the teacher's pace;
⋯ "Stop the countdown" is still there. Without `Time:` a countdown is 60 s
(before: 20). The guidance says so, and that 60 is slow for most
questions, so an AI writing `Tempo: countdown` has reason to write lengths.

Constants in `shared/tempo.ts`: `COUNTDOWN_MIN` 10, `COUNTDOWN_MAX` and
`COUNTDOWN_DEFAULT` 60, `NUDGE_SECONDS` 5, `clampCountdown`.
`COUNTDOWN_CHOICES` is gone. `setSeconds` is replaced by `nudge`. The view
drops `seconds` and gains `adjust` and `countdown` (the pair's length, null
for no pair).

**Checked:**
- Unit tests (78). Two new ones:
  - 60 s without `Time:`; no pair in the lobby; the bounds; only ±5;
    reading, running (the deadline moves), after the reveal (the next
    question), a cut below the time gone closing answering without a
    reveal; nothing after the last question; carried to the next class;
  - lengths written per question moving together, each held at 10 and 60;
    a stopped clock pointing the pair at the next question; none when the
    next comes at the teacher's pace.
  - The format test's clamp is now 10..60 with its warning.
- HTTP probe against the real alarm (`scratchpad/lp/nudge.mjs`, nobody
  answering, so only the clock closes):
  - `Time: 90` taken as 60 with the warning; a nudge in the lobby refused;
  - +5 three seconds into a 15 s countdown: the tablet's view says 20 s,
    and answering closed 20.2 s after Go;
  - at the reveal the pair shows the next question;
  - ten −5 on a written 60: 10 s, closed at 10.2 s;
  - on the third question, +10 while reading, then −10 twelve seconds in:
    closed at once, on the tablet too.
- `simulate.mjs --tempo` (now a `Time: 10` line, plus +5 and −5 while the
  first question is read, the pair's length checked) and the plain mode:
  both pass on a restarted stack.
- Headless Edge (`shots-tool/pair-walk.mjs`), no page errors: the Remote's
  pair while reading and running; the wall's bar and the tablet's bar both
  going from 25 to 30 s after +5 while running; "Next countdown 50 s" at
  the reveal (written 40, +10); the wall's own steering bar −5 to 15 s.
  `pair-narrow.mjs`: the steering bar fits at 360 px at the reveal.

**Not established:** whether teachers find −5/+5 during a running
countdown, and whether a class reads a bar that suddenly lengthens as
"more time".

## 2026-11-03 — The lobby's Start says the mode

Serves: v1 item 19's last paragraph. The owner, on the live lobby:
- Start, "Open projector" and the "open classyquiz on another device" line:
  the last duplicates the second's job.
- "Start quiz" doesn't say the mode: as projector, as remote, or the one
  screen that does both, which needs a better public-facing name.
- His example: "Start as [that]", and a text below saying that for
  separate remote and projector screens, connect a second screen and
  choose remote or projector.

**The name is "Projector + Remote".** The button on the tab that steers
itself reads **Start as Projector + Remote ▶**. It uses the two names the
teacher meets at `/teacher`. The Remote's own button stays "Start quiz":
its mode is already the screen it is on.

**One sentence instead of a button and a line:** "For a separate projector
and remote, open classyquiz.pages.dev/teacher on the other screen (a phone,
another computer, or *a new window here*), type 63953 and choose."
- "a new window here" is a link that does what the button did: a popup at
  `/teacher?role=screen` takes the Projector, and this tab becomes the
  Remote.
- On a phone-sized screen the link part is hidden, since there's no second
  monitor; the button was hidden there before too.
- As before, the sentence shows only until the first student is in, and
  becomes "Remote connected ✓". ⋯ still has "Steer from your phone…" and
  "Two screens: open the projector window".

The guidance's account of a lesson names the button and the link.

**Checked** (`shots-tool/pair-walk.mjs`):
- the label;
- one sentence with the link and no second button;
- the link hidden at 390 px;
- the link opening a window that took the Projector, while the first tab
  went to `/teach`;
- a lobby screenshot at 1366×768.

## 2026-11-03 — Review C: the next class on the same tablets, the door, stray keys

Serves: the constraint "survives school Wi-Fi"; v1 items 2, 4, 6, 16; v2
items 2 and 4. Fixes findings 1, 2, 3 and 5 of
`docs/reviews/2026-11-03-review-c.md`, each verified against the code at
4be4d59 first. Not finding 4 (the Remote once students are in): v2 item
8, the owner's.

**1. A tablet switched off after one class opens the quiz for the next.**
- *Verified:* a player token with another class's run id got "This quiz
  has finished" from `authenticate()`, also on a page opened anew. The
  page cleared the token, so a reload worked. The next class after
  "Again", or after the new class the site opens an hour after a final
  ranking, met it on most tablets.
- *Now:* the page says whether it has shown its class yet (`fresh` on the
  player's auth). A page opened anew with an earlier class's token is a
  newcomer: in the lobby it joins at once. A page still showing the
  earlier class (left on at its final ranking, offline when "Again" came)
  is still told it has finished. That is the "doesn't slip into the next
  class" case the check was written for.
- *Found beside it:* an unrecognised token got the guest's choice, which a
  page holding a view ignored. So a tablet whose avatar another device
  took back while it was away froze on its last question, its taps
  refused. The server now marks that choice `stale`. The page drops its
  token and offers "Which one are you?" with +. It doesn't join by itself:
  the tablet may be lying on a desk, and a connected phantom would hold
  up the countdown's early close ("everyone present answered").
- *Also, read in the code, not seen:* a guest's choice reaching a page
  that had become a player was acted on while its first view was still on
  the way. That happens to the answer to a poll made as a guest, racing
  the welcome over HTTP, and it sends a second join, a second avatar. Now
  a player page ignores a choice unless it is `stale`.

**2. The door.** The requirement, relayed by the product owner: slow
tablets in a normal class never stranded; no new control if avoidable; a
stranger with the code still can't wander into a quiz under way.
- *Verified:* after Start, 5 new players got in, then the refusal, with
  nothing the teacher could do.
- *What tells a slow tablet from a stranger is when it comes.* Slow
  tablets arrive in the first minutes after Start. A teacher who pressed
  Start before handing the tablets out waits at the first question,
  because nobody answers. So the door is open, up to the 60, in the lobby,
  for 5 minutes after Start (`DOOR_OPEN_MS`), and while the first question
  is up (its reveal and a ranking after it included). Once the second
  question is up and the 5 minutes are over, the quiz is under way: 5
  more, then "This quiz has started and takes no more players. Ask your
  teacher." Only joiners under way count toward the 5. `server/game.ts`,
  `doorOpen`.
- *Considered:*
  - A cap relative to the class at Start: a teacher who starts with 3 of
    25 strands 17.
  - A window after the last join: a teacher who starts and then fetches
    the tablet cart strands the class.
  - "Let more in" in ⋯: a new control, and a teacher in front of a class
    doesn't know to look for it.
- *What it gives up:* a stranger in the first minutes or during the first
  question gets in, as one in the lobby always did. The avatar shows on
  the wall, and Remove sticks. Runs stored before this (a deploy during a
  class) have no start time and keep the narrow door.

**3. Stray keys on the Projector.**
- *Verified:* Space, Enter, →, ↓, PageDown and N started the quiz from the
  lobby and advanced it while a Remote steered. Ctrl+N advanced, and
  Ctrl+F toggled full screen.
- *Now:*
  - No key starts the quiz. Start is the lobby's button: one deliberate
    press on the steering screen, while the class is still joining.
  - A key held with Ctrl, Alt or Windows/Cmd does nothing, F and Z
    included.
  - While a Remote steers, only a clicker's keys (PageDown, →, ↓) move on
    from the Projector. The teacher is on the phone, and Space, Enter and
    N are the keys a lean on the laptop hits.
  - While the Projector steers itself, the keys work as before.
- *Left:* a single stray Space during a question on a self-steering
  Projector still reveals. That keyboard is the teacher's steering.

**4. The smaller ones (review point 5).**
- *Zip with several text files:* the reader parses each `.md`/`.txt` and
  takes the one without errors with the most questions. A tie goes to the
  top level, then the shortest path. When none has a question it takes
  that first file, so the error message is about the likeliest one.
- *"Tempo: countdown (no points)"* read as speed. A clause that starts with
  no, not, without, ohne or kein… no longer counts. "Tempo: no countdown",
  "off" and "none" are still the teacher's pace.
- *Letter prefixes:* dropped, not warned. This applies when every answer
  of a question carries the next letter from A with the same mark ("A) ",
  "(a) ", "B. ", "C: ") and the question's answers are shuffled. Shuffled,
  "A)" lands third, which is wrong, and a warning would ask the teacher to
  fix what the site can, the same way question numbers are dropped. Under
  `Order: fixed` the letters stay, since the guidance names letters that
  label parts of a picture. A bare letter is an answer, not a prefix.
- *QR code:* it now points at `/play#<code>`. The root page still forwards
  `/#<code>`.
- *A copy's Build text:* the build writes `<name>.pages.dev` (the `name` in
  `wrangler.toml`), or `SITE_ADDRESS` when set, into the start page's
  three mentions of the address: the Build step, and the own-copy and
  layout links. That is for AIs, which read the page without its script.
  The script shows the address the browser opened in the Build step,
  which also covers a name that was taken. `own-copy.html` keeps the
  demo's name, which it uses as the demo's. *Not done:* the "free site is
  full" and spent-allowance messages (`shared/limits.ts`, also in the
  server bundle) still name `classyquiz.pages.dev/own-copy`. A copy that
  raises its limits rarely shows them.

**Checked:**
- Unit tests: 82. The door is open while the class arrives (3 of 25 at
  Start; Start before the tablet cart, 15 minutes at the first question),
  narrow under way (5, a removed one counts), letters, tempo clauses, the
  zip's choice.
- Typecheck.
- `simulate.mjs` in all three modes, with a new check: the old class's
  token without `fresh` still gets "finished", and on a page opened anew
  it gets the new lobby.
- Headless Edge (`shots-tool/fixc-walk.mjs`, 27 checks):
  - The first class's token on a page opened anew joins the new class.
  - A page left at its final ranking and offline during "Again" is told
    it has finished.
  - A tablet whose away avatar was taken by another device offers + on
    its return and doesn't join on the next tick.
  - Twelve joins after Start all get in.
  - The keys, as above, both with the Projector steering and with a
    Remote.
  - A zip with `notes.txt` beside `prozente-quiz.md` opens.
  - The Build step shows the opened address.
- The reviewer's `stale.mjs`: the first load now lands on the question.
- A build with `SITE_ADDRESS` puts the address in all three places.
- Not measured: whether 5 minutes is long enough for real tablets.

**Deploy:** no migration. The protocol additions are optional fields. A
student page from before the deploy doesn't send `fresh` and behaves as
before; it ignores `stale`.

## 2026-11-03 — A second teacher device once the class is in

Serves: v2 item 8; review C point 4. Design and the owner's reaction in
`docs/second-teacher-device.md`. Revision 1 guarded against a child at
`/teacher` with a number and a yes for each request. The owner: "why would
a child rejoin at /teacher? Imaginary problems don't need solving." Built
to his direction instead: one button on the screen that steers, and no
handshake. Narrows "No new steering once students are in" in "One code per
quiz, two teacher roles per tab".

- **A device that set the quiz up comes back without asking.**
  - That is the device that opened the .zip, and any tab that took a role
    before the first student joined.
  - Each holds the quiz's secret. The server sends the secret with a role
    taken while the class is empty, and the page keeps it in `cq.quizzes`,
    like an upload. So the phone's root page also offers Resume and
    Delete.
  - `takeRole` carries the secret. With it, the gate doesn't apply, but a
    tab that is there is never pushed aside.
  - A device let in mid-class gets no secret.
- **"Allow a device to join"**, on Projector + Remote once students are in.
  - Where: in the lobby under Start, in ⋯, and on the bar after "Remote gone".
  - The next device at `/teacher` takes the free or dropped Remote, or the
    Projector itself. Then this screen becomes the Remote: a phone-only
    start handing the wall to a laptop, allowed without a warning (owner).
  - It is open until one device takes a role, or 2 minutes pass
    (`JOIN_OPEN_MS`), or Close.
  - It is stored in `meta.joinUntil`. Memory alone would shut it when a
    hibernating object is evicted.
  - The bar names only "/teacher": the class's address and code stay
    beside it, so a late student isn't sent to the teacher's page.
- **When nothing steers, any device at `/teacher` takes a role.** Before,
  Leave on Projector + Remote with students in, or a dead self-steering
  laptop without its tab, ended the steering for that class. Leave says so
  now.
- **The wall says the Remote is gone for as long as it is.** Before, only
  an 8 s notice did. In the lobby: "Remote gone. Allow a device to join".
- **The Remote says "Projector gone"** during the quiz, not only in the
  lobby. On a wide screen it adds "open the projector window": the
  two-screen laptop whose projector window got closed. A free Projector
  while a Remote steers stays open to any device, as before. Review C's
  lock-out of the laptop needs another device at `/teacher`, which is the
  scenario the owner dismissed.
- **Notices let clicks through** (`pointer-events: none`). The 8 s "Remote
  gone – steering here" sat over the middle of the lobby's Start button,
  and a click there did nothing: seen in the walk below.
- **Words:**
  - `/teacher` names the way in on a closed Remote: "students are in:
    first, on the projector screen, ⋯ Allow a device to join".
  - "Steer from here" and "Stop being the remote" no longer say the
    steering can't come back.

**What it gives up.** On the free plan, an outside script that guesses a
5-digit code can take a role while nothing steers, or within a 2-minute
window. That is the same kind of exposure as an empty lobby, where any
guessed code gets the Remote today. It belongs to the open hardening
question about vandalism from outside the class (backlog v2 item 4).

**Checked:**
- Typecheck; 82 unit tests.
- `simulate.mjs`, all three modes (761 HTTP requests with all polling).
  New checks:
  - a role taken in the lobby comes with the secret;
  - the secret takes the Remote with the class in, and a wrong one
    doesn't;
  - after Allow a device to join, one device takes the Remote without the
    secret, the window shuts, and the next device is refused;
  - Close shuts it;
  - after Leave on Projector + Remote with the class in, both roles are
    offered and a new tab steers.
- Headless Edge (`shots-tool/item8-walk.mjs`), 24 checks, no page errors:
  - the phone keeps the secret and its root page offers Resume;
  - the phone dies, and the lobby and then the bar say Remote gone;
  - a new phone is refused with the way in named;
  - Allow, Close, and Allow from ⋯; the new phone becomes the Remote and
    the wall stops steering;
  - the first phone, with a fresh tab, takes the Remote back without the
    button;
  - the projector dies, and the Remote says so, with the window link only
    on a wide screen;
  - the window takes the Projector, and the line goes.
- Lesson: `build.mjs --watch` doesn't copy `public/`. After a CSS change,
  run `node scripts/build.mjs` once.

**Deploy:** no migration. The protocol additions are optional.
- A page from before the deploy sends no secret, and shows a closed role
  as "in use".
- The wall's "Allow a device to join" needs the new page.
## 2026-11-03 — The landing page, third look: one line per quiz, upload, two foot lines

Serves: v1 item 16, the owner's third look at the live page. Revises "The
landing page by attention budget; zip only" where named.

**The resume list (the bug).**
- *The count only ever grew.* Every upload is its own quiz on the site,
  open for two days, and only Delete on the start page ends one early. A
  corrected quiz from the AI keeps its title, so a test round, or a key
  fixed before the lesson, left one line per upload. Now a title is one
  line: the newest upload of it. Delete… ends every upload of that title
  this device holds. The older ones are out of the list but stay on the
  site until they close by themselves; nothing ends them unasked, because a
  quiz with the same title may be running in another tab. Ending them at
  upload instead would be "nothing kept beyond its use" taken further; it
  is the product owner's call.
- Titles are learnt from the site (`/info`) and kept with the device's
  entry, so a second visit doesn't ask about older uploads of a known
  title. At most 6 are asked per visit, each a request against the daily
  allowance. An untitled quiz is its own line.
- *The expander went out of sync.* It was a `<details>` whose count was
  written once: deleting the top line left "2 more quizzes" with nothing
  above it. The list now renders from its state after every change; the
  fold is a button ("▸ 2 more quizzes"), and goes when one quiz is left.
- *Worse formatting.* The rows were flex lines, so "closes" landed wherever
  the title ended, and a long title pushed it onto a line of its own. On a
  laptop the rows now share one grid: Resume and the title, then "closes",
  then Delete…, aligned down the list. Under 560 px each quiz is two lines:
  Resume and the title, then "closes" with Delete… at the right.

**Run a quiz:** the button is "Upload the quiz your AI made (.zip)", the
owner's wording with ".zip" for "*.zip". Build's third step ("It hands you
the quiz as a .zip file. Download it.") is gone: the button now says what
the AI makes and what happens to it, so the step only ordered. The
messages for text or another file say what the AI can do ("Your AI can make
the quiz as one .zip file, to download from the chat and upload here")
instead of ordering three steps; the fix hint says "upload" for "open".

**Build, step 2:** "say how many questions you need and what kind". It
helps the teacher specify, and an AI reading the page sees the number
belongs to the brief and asks when it's missing ("Making a quiz with a
teacher" already lists it among what only the teacher knows). **Step 1 is
unchanged,** by the owner's word: rewording which AI works risked making it
worse. It still says "Claude's free version works", which the owner has
since said was tested only on a paid account.

**The foot lines** each say what the link is, what for, and when:
- "Some school networks block live quizzes. *A quick check*, run on the
  school's Wi-Fi, shows whether yours does and, if so, what to tell IT."
  "Check this network" didn't say that the network to check is the
  school's, which is rarely where a teacher first reads the page.
- "This site is free and shared by everyone who uses it, with room for a
  few dozen classes a day. An AI can set up a copy just for your classes,
  also free: *how that works*." The link names its destination, a guide;
  "If that's too tight" asked the teacher to judge a limit they can't see.
  `/own-copy`'s first sentence repeated the old wording and now matches.

**Checked:** typecheck, 82 tests; headless Edge on the built page with the
API mocked (`shots-tool/lp3-walk.mjs`), at 1366×768 and 390×844, no page
errors, no sideways scroll on the phone: two uploads titled Prozente show as
one line and "2 more quizzes" for the other two; the second visit asks only
about the newest Prozente; Delete… on it ends both; the fold and its count
follow each delete down to an empty list.

**Not changed, for whoever owns the guidance:** it still says the teacher
"opens" the `.zip` on the start page ("How a lesson runs", "Getting the quiz
to the site", the paragraph on what assistants can't do). An AI relaying
that sends the teacher looking for "Open"; "uploads" matches the button.

## 2026-11-03 — Spread, then key; who has answered, on the wall

Serves: backlog v2 items 6 and 7, together, since both live between a
question and its key; v1 items 5 ("exposes nobody"), 6 (the teaching
moment), 9 (fixing a question) and 15 (a tap that looked in time counts).
The landscape doc's requirements 2 and 3. The product owner settled the
three open points within the owner's words (below); he relays to the owner.

**What was already there.** The Remote showed the live counts beside the
key during the question, and "18 of 22 answered · 1 away". So a teacher
with a phone could already see a broken question before the key. The wall
showed only "answered / players", away devices included, and the tablet
marks a tap chosen at once, delivered or not: nothing told a child their
answer had arrived.

**The steps.** After the question (and Go, with a countdown) the teacher
presses twice. Fixed sequence, both presses the teacher's, countdown or
not (product owner): the wall never changes while the teacher is
mid-sentence, the clicker has one key, and the owner wants few elements.
One more press per question is the price of the teaching moment.

| Step | Wall | Tablets | Steering tab |
|---|---|---|---|
| Show votes | each tile's count and bar; no tick, nothing faded | buttons locked, the choice marked, 👁 | "The votes are on the wall, without the right answer"; **Show answer** |
| Show answer | the tick, the others faded | ✓ or ✗ (+points) | Ranking, Next |

- **The votes close answering**, like time's up, so nobody copies the
  majority (Socrative's advice for its pause). `Run.closedView` takes the
  votes' view, so a tap made on an older view still counts when it arrives
  (item 15), and the votes on the wall grow by one.
- **No re-vote** (product owner): ⋯ doesn't offer "Open the answers again"
  at the votes, and `stopClock` refuses there.
- **The clock** stops at the votes: no time's up after them, no bar, no
  timer mark. Points for speed still use its length. The −5/+5 pair moves
  to the next question.
- **"Final ranking now" at the votes**: the question doesn't count, as
  before for any question whose key wasn't shown.
- **An enlarged picture** goes back beside the question at the votes, as
  it does at the reveal: it would cover the votes.
- **Button words:** "Show votes" (a bars icon) and "Show answer" (the ✓).
  They fit the wall's steering bar at 360 px with the −5/+5 pair.
- **State:** `Run.votes`, the index of the question whose votes are up;
  the phase stays `question`. `answering()` reads it as closed. Command
  `votes`; `At.votes` keeps a doubled press from landing on the key, as
  `At.reading` does for Go. The clicker's `advance` goes reading → Go →
  votes → reveal → next.
- **Pages from before the deploy:** an old Remote's Reveal goes straight to
  the key (`reveal` still works from the question); an old tablet shows
  the votes as time's up; an old wall shows the question until the key.

**Who has answered (item 7).** Only answered avatars, popping into the
wall's top bar as the answers arrive, in arrival order; no placeholders
(product owner: "exposes nobody" and the top-three ranking decide it). A
child sees theirs land; nobody is shown as missing. The mark says the
answer arrived, never which: no answer colour, and a change of mind
changes nothing.
- **"Of"** is the players whose device is there, or who answered and went
  away since (without the second part a device that answered and dropped
  would give 26/25). A tablet away 45 s (`FRESH_MS`) stops holding the
  count below full. When everyone there is in, the count turns green.
- **The wall asks for its view every 15 s during a question**, as it did
  only while a Remote was there: presence changes with time, not events.
- **The Remote shows who the class waits for**: "Waiting for" with their
  avatars, once six or fewer are left, until the votes. The product owner's
  decision assumed the Remote had this; it had only the count.
- **Nothing moves.** The question's bar (`#qbar`) has a fixed height, 1.9em
  (about 6.5 % of a 720 px wall); the avatars are sized when the question
  opens so the whole class fits, in one row or more, and don't shrink as
  answers come in. The count appearing at Go and the key change nothing
  below it.

**The countdown closes once the last missing device is away.** Before,
"everyone present has answered" was checked only when an answer arrived:
if the one tablet still missing died, the clock ran out. Now the teacher
tabs' ticks (the wall's 15 s, the Remote's 20 s) check it too
(`closeIfAllIn`). With item 7's count that matters: the wall would read
"all in" while the bar kept draining.

**Not done:** a hint on the Remote when most of the class chose an answer
that isn't marked right. The counts sit beside the key already; a teacher
on one mirrored laptop can't check the key privately anyway, and fixes it
after the answer, with the points following.

**Free plan.** One more step per question, which reaches every device:
`simulate.mjs --all-poll` made 822 HTTP requests (761 before, +8 %), and one
more stored write per question. The wall's tick adds about four requests a
minute while a question is up.

**Checked:**
- Typecheck; unit tests 86: the clicker's walk with the votes; votes
  closing answering, a tap on the older view counting and joining the
  votes, one on the votes' view refused, nothing scoring before the key, a
  second press changing nothing, the reveal keeping the votes' view; no
  votes while reading or after the key; the reveal straight from the
  question; votes stopping a running clock, refusing to reopen, the pair
  moving to the next question, the bonus from the clock's length; the
  final ranking at the votes not counting the question.
- `simulate.mjs`, plain, `--tempo` and `--all-poll`, all passing. New: on
  every question but one, a doubled Show votes and a doubled Show answer,
  the wall showing the votes without the key, and the wall's avatars
  matching the answers counted with "of" no more than the class; question
  4 revealed straight from the question, like a page from before.
- Headless Edge (`shots-tool/votes-walk.mjs`), 47 checks, no page errors:
  - a wall steering itself with four tablets: avatars popping in one per
    answer, none for a change of mind, no answer colour on them; "3 / 4";
    Show votes with counts and bars, no tick, nothing faded; the tablets
    locked with the eye, the choice marked, no verdict; a tap after the
    votes not taken; Show answer with one tick and the others faded, the
    verdicts matching it; the question's text, tiles and bar in exactly the
    same place across answers landing, the votes and the key; the next
    question with an empty bar; a closed tablet not counted ("3 / 3",
    green);
  - a phone Remote with a 60 s countdown: "Waiting for" with the missing
    avatar; that tablet closed, answering closed 14 s later by the tick
    with 50 s left; the Remote's votes line and Show answer; the wall
    without clock or time's-up mark at the votes; no "Open the answers
    again" in ⋯;
  - the steering bar at 360 px fitting with the −5/+5 pair, at the
    question and at the votes;
  - 25 answers at 1280×720 (avatars 34 px), 1366×768 (37), 1920×1080 (53),
    1024×768 (26), 800×600 (18), and 60 at 1280×720 (21), all inside the
    bar, nothing below moving.

**Not established:** whether a child finds their avatar at 26 px on a
1024-wide projector from the back row (the lobby shows them at 9 % of the
height); whether teachers use the votes to talk, or press through them.

**Deploy:** no migration; the protocol additions are optional fields. The
guidance page and `/layout.html` name the two steps and the avatars.

## 2026-11-03 — Avatars the children dress

Serves: backlog v2 item 5; v1 items 4 and 5 ("exposes nobody", "stores
nothing about them"); the constraints "nothing kept beyond its use" and the
Free plan. The design, the owner's reaction and the figures are in
`docs/avatars.md`. The owner took the four recommendations: dress the
assigned animal; shapes and hats, no tools; a plain start; fixed at Start.

**What a child does.** In the lobby, below their animal: six background
shapes in its colour (disc, hexagon, star, heart, flower, pond) and eight
hats (crown, top hat, cap, wizard hat, party hat, flower, beanie, viking
helmet). Tapping a shape puts the animal on it; tapping a hat puts it on,
tapping the worn hat takes it off. The tablet shows it at once, the wall
and the Remote about a second later, where the avatar wiggles. At Start
the pictures go and the look is fixed. No words.

**The owner's drawing notes.**
- *The frog's hats:* a new head. The eyes moved from the top to the sides
  and the head became a dome, so a hat sits on top as on the other animals.
  Tried first and dropped: the hat tucked between and behind the old eyes,
  with the eyes moved apart or not; too small to read at 34 px.
- *The penguin:* its hats grow 1.05× the brim's width, against 1.3× on the
  others.
- *The wand:* tools aren't built; the prototype's star now sits on the tip.

**Built.**
- `shared/looks.ts`: the menu's size (`BACKGROUND_COUNT`, `HAT_COUNT`),
  `MAX_LOOK_CHANGES` (30 a child per class), `LOOK_WRITE_MS` (1 s).
- `Avatar` gains `b` and `h`, absent at their defaults. `G.dress` sets the
  look whole (a resend changes nothing): only in the lobby, only what the
  menu has, never for a removed avatar; "same" stores nothing; past 30
  changes it refuses. The animal and colour, which tell the children
  apart, are never touched.
- Command `dress`. **The class's looks are written at most once a second:**
  a change waits for the next write of the run (its own after up to 1 s,
  or a join's), and is acknowledged once stored; the views go out after
  the write, so nothing shows that isn't stored. A look changed while a
  write is under way waits for the next one.
- `client/play.ts`: the picker, built once and patched in place. The tablet
  shows the pick at once and keeps showing it until its view shows it
  back. One `dress` in flight; the latest pick is sent next, so a burst of
  taps sends the first and the last. Refused (the quiz started, or the
  changes spent): the stored look, and the pictures stop responding.
- `client/look.ts`: the shapes, the hats and a seat per animal (brim
  centre, width, growth; a hat never reaches past the top). `syncAvatars`
  keeps a lobby's row in place: newcomers pop in, a changed look wiggles,
  nothing else is replaced.
- **The lobbies' rows are kept in place** on the wall (class lobby and
  the one that steers itself) and on the Remote. Before, any change to the
  players redrew the steering wall's whole lobby, Start button included,
  and the Remote's body; with a class dressing, that would happen several
  times a second while the teacher reaches for Start.

**Found and fixed beside it: a tablet joining over HTTP waited up to 25 s
for its first view.** The guest's poll was held until the guest's choice
changed, which a new player doesn't do; the welcome came with the command's
answer, the view didn't. Now the welcome over HTTP carries the view, as
over a WebSocket, and the page lets the guest's poll go (`Line.repoll`) so
the next one asks as the player. Seen as the simulation's polling tablets
never showing their own look.

**Cost** (`simulate.mjs --all-poll`, 25 students, two runs each way):
- With dressing: 80 taps by 25 students took 112 HTTP requests (the
  commands and the polls they answered), in a run of 1,345 in all.
- Without (`--no-dress`): 1,178 and 1,174.
- So dressing costs about 110–170 requests a class with every device on
  the fallback, under +15%, as the design estimated. The absolute numbers
  are above the 822 measured for "Spread, then key"; I didn't isolate why
  (run lengths differed, 170–210 s, and idle polls count with time).
- On WebSockets a change is one incoming message, 1/20 of a request.
Rows: a change is two rows (the run and its meta), at most one write a
second for the whole class; the simulation's 25 children made about 90
taps in 5–10 s.

**Checked:**
- Unit tests 89: the look set whole and kept apart from animal and colour,
  a classmate wearing the same, a resend storing nothing, back to the
  defaults, the menu's bounds, a removed avatar, fixed at Start; 30
  changes then refused, the stored look's "same" still fine; every animal
  with every shape and hat draws.
- Typecheck.
- `simulate.mjs`, plain and `--all-poll`, passing, with new checks: every
  tablet, the wall and the Remote show the look last acknowledged, on the
  same animal and colour; a device sending 40 changes without waiting is
  refused once its changes are spent, and only its stored look is
  acknowledged after that; dressing after Start refused; the student whose
  tablet died gets their look back with their avatar; the look at the end
  and in the ranking is the lobby's.
- Headless Edge through the real pages (`.tmp/avatars-pass/avatar-walk.mjs`,
  24 checks, no page errors): the picker's six shapes and eight hats,
  no words, a plain start; the star on the tablet at once and on the wall
  about 0.1 s later locally; the crown on the Remote; a wiggle per change on
  the wall and the Remote; the hat off with a second tap; a burst of eight
  taps ending on the last on the tablet and the wall; the Remote's lobby
  and the steering wall's Start button not replaced while 24 children join
  and dress; Start removes the picker; the dressed avatars in the tablet's
  top bar, the wall's bar (24 at 36 px) and the ranking. Tablets at
  960×600, 600×960 and a 360 px phone.

**Not established:** whether children dress at all, and whether teachers
wait for it; whether the shapes help a child find their avatar from the
back row.

**Seen once, not attributed:** the local site's runtime crashed ("Workers
runtime crashed unexpectedly") while a simulation and a browser walk ran
against it at the same time, about 75 connections; each alone passed
repeatedly.

**Deploy:** no migration. The protocol additions are optional fields:
pages from before the deploy draw every avatar plain and offer no picker;
an old student page ignores the view that comes with its welcome.

## 2026-11-03 — Pictures as answers

Serves: backlog v3 item 1 ("which of these shows…", readers who are still
slow); v1 items 7 (colour-coded answers), 9 (fixing a question) and 19
(the right quiz at a glance); v2 items 6 and 7 (votes, then the answer;
nothing moves); the constraints "nothing kept beyond its use" and the Free
plan. Settled by the product owner within the owner's words, before code:
- the tablets show the answer pictures, from one bundle fetched in the
  lobby (the owner's "nothing on the voting devices" was about the
  question's picture, and for a picture answer the choice is the picture);
- the picture sits on the tile's colour, with the shape badge: no white
  card by design. Built first with a white card inside a frame of the
  colour, and the cut-out rendered beside it for the owner's look. The
  owner: "Cut out should be creator's choice, simply by using alpha
  channel, no?" So transparent areas show the tile's colour, and a creator
  who wants a white ground draws one in. The contrast question moves into
  the guidance, and the tablet does the same;
- the picture cap goes from 60 to 120, one constant; 16 MB per upload and
  the site's 1 GB stay;
- a question's own picture together with picture answers is supported.

No model calls: the owner tests with his own AI on real sheets, so the
guidance is written for his next zip to be the test.

**Format** (`quiz/format.ts`; guidance "The parts" and "Pictures as answers"):
- `+ Image: pie-3.png` / `- Image: pie-1.png`: an answer line whose text
  is a picture line. The mark stays in its column.
- Forgiven, as for `Image:` lines: `**Image:**`, `![…](b.png)`, quotes, a
  description after the name, a continuation line. Read after the answer
  letters are dropped, so `A) Image: x.png` is a picture too.
- Text and picture answers mix in one question ("none of these").
- A question with picture answers may have its own `Image:` line.
- `Answer.image` holds the name; the text is "". A picture answer left out
  (missing from the zip, "Continue without") keeps `image: ""` and shows
  its colour and shape alone; the teacher's list says "(picture left out)".
- Errors: a picture answer naming no file, or a web address.
- Warnings:
  - the same picture as two answers;
  - an answer that is only a file name ("cat.jpg"): it shows as text, and
    the message gives the picture form. It isn't taken as a picture,
    because "Which file is a picture? + cat.jpg" is a real question;
  - a question whose answer pictures differ in proportions by more than
    1.5× (server, once sizes are known): the class picks by shape or crop.
- The messages for `Image:` lines that were meant as answers (several on
  one question, or after the answers) now show the answer form.

**Upload** (`client/images.ts`):
- A file's wall size follows its largest use: 1920 for a background, 1600
  for a question's picture, 1200 (`ANSWER_LONG_SIDE`) for one used only as
  an answer. A question's or an answer's picture keeps its alpha.
- Each answer picture also gets a small copy for the devices:
  `SMALL_LONG_SIDE` 640, at most `MAX_SMALL_BYTES` 300 KB. It goes as
  `small` plus `smallName` in the multipart. Without one the answer still
  works and the devices show its colour and shape.

**Storage and serving** (`server/images.ts`, `instance.ts`):
- The small copies are concatenated into packs of at most `PACK_BYTES`
  (1.5 MB; a Durable Object value holds 2 MB), stored as `pack:<k>` in the
  same write as the quiz. `StoredImage.small` = `{p, o, l, type, w, h}`.
  They count towards the site's booked bytes.
- Served as `GET /api/i/:id/img/<packSecret>/p<k>` through the existing
  `img` route, so the Function is unchanged. `application/octet-stream`,
  `no-store`, `nosniff`, sandbox CSP.
- `packSecret` is separate from `imageSecret`: the students' devices get
  it, and it opens the packs only, never a question's picture.
- Views:
  - the projector's question carries `pics` (`ImageRef` or null per
    answer, in the order on screen), and its `pictures` (fetched ahead)
    include the answer pictures;
  - the teacher's answers carry `image`;
  - the player view carries `packs` (the URLs, in every view, the lobby
    included) and, once the answers are up, `pics` (a `PackPic` per answer
    or null).

**The wall** (`client/screen.ts`, `layPictureAnswers`; `client/answergrid.ts`):
- A picture tile: the picture on the answer's colour (no ground of its
  own, so its transparent areas show the colour), the shape badge, and
  `.side` for the count and tick.
  - "row": badge, card and side across;
  - "col": badge and side above the card.

  The side and the bar's strip are reserved from the start, so the votes
  and the reveal move nothing.
- The arrangement is one, two or four columns (three for three answers)
  in either orientation, whichever shows the smallest picture largest. It
  is computed from the chrome a tile takes around its card, measured once.
  Two by two wins when within 85 % of the best: the arrangement the class
  knows from the text tiles.
- With the question's own picture: either between (text, picture at full
  width, tiles) or in a band beside the text, at three or four heights.
  The choice maximises the smaller of the question's picture and the
  smallest answer picture, so both come out about alike. The band needs
  the text at 1.5em or more.
- Measured at 1366×768 on the test quiz:
  - four square pictures: four in a row, each 299 px (277 with a question
    picture in the band);
  - four 6:1 number lines: two by two, 626×104;
  - three upright 1:2.7 thermometers: side by side, 180×480;
  - two squares: 473 each.
  At 1920×1080 the squares come out at 420 px, at 800×600 at 168 px (two by two).
- A text answer among pictures takes a picture's place, in the tile's ink, its font fitted.
- The countdown's veil hides the cards' contents until Go. Enlarging (Z)
  stays with the question's picture.

**The tablet** (`client/play.ts`, `client/packs.ts`):
- Every view that names `packs` makes sure they are fetched, one at a
  time. Retries at 5, 15, 45 s and so on, at most five tries. Each picture
  is cut out of its pack into a blob URL by offset.
- The buttons get the picture on the button's colour with the shape, arranged by
  the same rule in the room the page leaves. That room is fixed in px,
  because a cached picture otherwise stretched the page when it was
  measured; this was found in the walk.
- A picture arriving after the buttons is filled in place, with no redraw
  that could swallow a tap. The time for speed points starts once the
  question's pictures are there.
- Under the ✓ or ✗, and while a late tap is on its way, the chosen
  picture shows beside its shape.

**The teacher's side** (`client/manage.ts`): in the question list, the
Remote's current question and the wall's fix sheet, a picture answer's row
shows its picture (64 px; tap for full size), with the key's green ring.
While fixing, the row toggles and the picture is no button.

**Guidance** (`public/index.html`):
- a "Pictures as answers" bullet under "The parts";
- a section "Pictures as answers" with an example (a test parses it):
  - the room an answer picture gets, with the measured sizes;
  - the ground: a transparent picture shows its tile's colour (red,
    blue, yellow or green, shuffled), so a drawing whose contrast or
    colours matter brings its own white ground, the same for every answer
    of the question;
  - **pictures made alike**: the right one cropped from the sheet among
    drawn ones stands out before anyone thinks;
  - no labelling letters;
  - why four answer pictures beat one picture labelled A–D with
    `Order: fixed`;
- the limits now say 120 pictures and 1200 px for answer pictures.

`/layout.html` has the picture-tile markup and rules.

**Cost on the Free plan:**
- The wall fetches each picture once: 21 requests (each one Function and
  one Durable Object request) for the test quiz.
- Each student device makes one request per pack: one for the test quiz,
  whose 20 small copies made a 398 KB pack. 25 tablets are 25 requests and
  about 10 MB over the school's Wi-Fi in the lobby.
- Fetching per picture would have been 25 × 4 × 15 = 1,500 requests for a
  quiz of picture answers.
- Rows: the packs are written with the quiz, a few more values.

**Checked:**
- Typecheck; unit tests 96. Parser: picture forms, mixing, errors,
  warnings, left out, the guidance example. Server: packing across packs,
  a stray or oversized small copy dropped, a missing small copy, the
  proportions warning, left out.
- `simulate.mjs` (no picture answers) on the same stack, as a regression
  check:
  - `--all-poll`: OK, 1,395 HTTP requests (1,345 before);
  - plain: the first run failed with "s10: score 4, expected 3" (the
    server counted one more right answer than the simulated device saw
    acknowledged). Then 16 runs passed on this tree: 8 plain and 8 with
    an instrumented copy. 12 instrumented runs on 73ec32d also passed.

  Not reproduced, so not attributed. For a quiz without picture answers,
  which is the simulation's, the server behaves as 73ec32d by
  construction:
  - every server change is guarded on a picture answer being present (the
    view fields are conditional spreads, absent otherwise);
  - `game.ts` (answers, fixes, scoring) is unchanged;
  - an answer text only becomes a picture when it starts with `Image:` or
    `![`.

  s10 was not the device the simulation kills (that is always s0), so a
  tap lost with a frozen device doesn't explain it. The instrumented copy
  is made by `.tmp/sim-diag/make_diag.py` from `scripts/simulate.mjs`. On a
  mismatch it prints the student's taps, acknowledgements, drops and the
  server's own record at each answer: the next occurrence explains itself.
- Headless Edge, `.tmp/picture-answers/v3-walk.mjs` with the generated zip
  (`make_v3_zip.py`, drawn SVGs: pies, 6:1 number lines, thermometers, an
  L-shape question with mirror answers, three "photos" and "Keines davon",
  two answers, and a text question). 86 checks, no page errors:
  - the wall fetched the 21 pictures ahead, each once, and no pack;
  - the lobby list showed the 20 answer pictures loaded with the 6 right
    ones ringed, and no warnings;
  - a 960×600 tablet and a 360×740 phone each made one request for the
    pictures, in the lobby, and none afterwards;
  - for every question: all pictures from blobs, nothing outside the stage
    at 1366×768, 1920×1080, 1280×800, 1024×768 and 800×600;
  - tiles, cards, pictures and question at the same pixels before the
    votes, at the votes and at the answer;
  - the votes' counts as tapped, the tablets' ✓/✗ matching the wall's
    ticks, the chosen picture under the verdict;
  - buttons inside the screen on both devices.
- The Remote on a 390 px phone: the current question's pictures, and a key
  fixed by tapping a picture row (no lightbox opened).
- The owner's number-line zip: Q1 between as before, the tablet with text
  buttons and no picture request.

**The owner's look, and his call:** a comparison at 1366×768 showed the
white card beside the cut-out on the tile's colour. On transparent drawings
the cut-out lost the unshaded quarters to the tile's colour, the blue L on
the blue tile, and the red thermometer's mercury on the red tile. The owner
chose the cut-out as the creator's choice, by the alpha channel. So the
site adds no ground, and the guidance tells the AI when to draw a white
one. `.tmp/picture-answers/q1…q5-colour-vs-whiteground.png` show what is
built beside the same drawings with a white ground, the creator's other
choice.
- Found while switching: the picture's element first had the class
  `card`, which the site's stylesheet already uses for its white panels
  (padding, border, white). The white background hid it, and without it a
  text answer turned white on white. It is now `apic`, and the sizes above
  are measured after the rename.
- In the teacher's lists the thumbnails sit on the answer's colour too, so
  the key check shows what the class will see.
- The tablet's chosen picture under the verdict also sits on its colour.
- One edge case: a transparent picture too large as PNG is flattened onto
  white at upload (for the wall above 1.5 MB, for a tablet's small copy
  above 300 KB), so it shows on white there. Line drawings stay far below
  that.

**Not established:**
- How large an answer picture reads from the back row on a real
  projector.
- Whether AIs draw a question's answer pictures alike, given the guidance;
  the owner's next zip is the test.
- Whether 85 % is the right preference for two by two. At 1366×768 the
  squares went four in a row.
- How children take pictures on their tablets.

**Pages from before the deploy:** an old Remote or list shows a picture
answer as an empty row. An old tablet shows its colour and shape without
text. An old wall shows empty text tiles.

**Deploy:** no migration. The protocol additions are optional fields, and
the packs are new storage keys in the instance.

## Open

- Whether the default Cloudflare address passes the AIs' fetchers and school
  filters. This needs the deployed page; `/check` covers the school side on
  the day.
- Whether AIs overuse several "+" lines now that the guidance allows them.
- A real sheet. The local harness ran on an invented German fractions sheet.
  The owner's own AI has since made a number-line quiz from a real sheet
  (pictures, see "Pictures on the screens"); the harness hasn't run on it.
- Free-tier verification: the harness runs the claude CLI under the owner's
  login, not claude.ai's free tier. Testing the free tier, and ChatGPT,
  Gemini and Copilot, needs a person or those accounts.

## 2026-11-03 — Tooling kept on disk, outside the repo

The headless-browser walks every implementer built on (Edge via the scratchpad's `shots-tool`) are copied to `E:\Projects\classyQuiz\.tmp\shots-tool\` (36 scripts, no screenshots), and the per-implementer local-stack scripts to `E:\Projects\classyQuiz\.tmp\stacks\<name>\`. `.tmp/` is ignored by git and survives sessions on this machine; the session scratchpad doesn't. Also there: `.tmp/sim-diag/` (the instrumented simulation for the score mismatch in bugs.md), `.tmp/picture-answers/` (the generated test zip and its generator), `.tmp/samples/` (the owner's number-line zip), `.tmp/avatars-prototype/`. None of it is reviewed for the repo; a future implementer reads before running.

## 2026-11-03 — Guidance: the owner's rewrite, merged with what's built

Serves: v4 item 5 (and v1 item 11, whose part 4 the owner took over). Branch
`guidance-merge`; delivery A of v4, so the page describes the site as it runs
today.

**Structure, from the owner's draft** (`docs/drafts/guidance-rewrite-2026-11-03.md`):
About; the manual for AIs and people who like to get their hands dirty
(anchor kept as `#site`); what informs the shape of the quizzes; how quizzes
are built; building with the teacher. The draft's facts are all in, in the
page's descriptive voice: the hybrid Projector + Remote and the second device
choosing its role, the lobby as a list, the code box at the top of the page,
upload from the phone, privacy concerns answered by the open code and an own
copy (with every device on the own copy's address), about fifteen questions,
the poll with every answer right under `Order: fixed`, line endings, the
picture on the left.
The draft's "about 15 minutes" for an own copy is left out until a free-tier
test has timed it; its eventual form is a dated statement, e.g. "Tested to
take 14 minutes with free Claude Sonnet, 4 Nov 2026" (owner).

**Reconciled with what's built:**
- Pictures as answers, the wall's layout and the limits kept from the live
  page; 120 pictures, not 60.
- The remote fades after 45 s (`FRESH_MS`), not a minute; the projector then
  steers and can let a new device join.
- Lifetime as the site runs now: until ended or 48 h after last use; a
  class's data an hour after its final ranking; a class unsteered for 3 h
  ends. The draft's figures (48 h or 1 h after the end, whichever is sooner)
  come with v4 item 3, delivery B; the paragraph changes with it.
- Tempo exactly as the live page; v4 item 6 replaces it.
- Spread, then key, as built, where the draft's reveal showed both at once.
- "A question number with no text": the parser accepts `1.` alone, but keeps
  "1." as the question's text, so the wall shows a large "1." (NUMBERING
  needs whitespace after the dot; an empty text is an error). The page says
  instead that a few words do when the pictures carry the question. Allowing
  it properly is a parser and wall change, not made here.
- Kept from the live page because the AI needs them and the draft doesn't
  contradict them: zip only, `.txt` or `.md` inside, nothing else in the
  quiz text, what the site shows after upload and its paste-back errors.
- Dropped with the owner's part 4: Transfer/Variants/Topic, the ten-minute
  break paragraph, "a blurred digit near a key goes in the conversation", the
  after-delivery list.

**Cut to what the reading AI can't know** (owner, on reviewing the merge:
good direction, far too wordy). The section went from 4311 words to 2456,
then to 2266 with the manual made denser: for people it only has to show that
there are no secrets and they may look, not read easily (owner).
What stays is the site's facts: what it is and does, the screens and how a
lesson runs, privacy and lifetime, the format with both examples, the limits
and the wall's layout, how the quiz reaches the site and what the upload
shows, and the "build with the teacher" stance in two short paragraphs, still
naming what a frontloading teacher gives. What went is advice a capable model
derives from those facts or already knows: wrong answers as the mistakes
students make (and the 25-francs example), short questions, good enough
beats polished, why the mark sits on the answer's line, when `Order: fixed`
fits, how long a countdown a kind of task needs and which classes suit one,
all the cropping and legibility advice for pictures (margins, label size,
grey photographed pages, names and filled-in answers in the crop), contrast
of answer pictures on the tile colours and making them alike, letters as
labels, four options in one picture, cropping with code, notes to the
teacher outside the quiz text, and the reasoning about why guessing costs
the teacher. The facts those rested on stay (spread before key, the class
reads from the back, tiles in four colours with transparency showing
through, the site's warning on mixed proportions, text outside the quiz
ignored or an error).

**Two passages changed after a test.** On the draft's wording the AI behaved
as on the old page. "Building with the teacher" now lists what a frontloading
teacher gives (exercises, number of questions, the sheet's numbers or new
ones, language) and says the quiz follows the answer. "Any language" is the
owner's instruction, plainly: if the language of the exercises and of the
request pull in different directions and don't resolve cleanly, just ask. A
first version named cases (a German sheet, an English message); the owner
ruled that out: AIs resolve with location and memory, no list is exhaustive,
and detail is more likely to break things.

**Amends "Guidance page is information, not instruction" (2026-11-02).** That
entry was a rule read as a rule. Its purposes are two: not tripping
injection guards, and no pointless prescription. A plain, well-marked
instruction about using an AI with the site trips no guard, and is the right
form where it is the point, as in "Any language".

**How an AI behaves on it** (Opus via the claude CLI, the page injected as if
fetched, the derived number-line sheet as images; nothing fetched; one sample
per cell unless said; runs in `.tmp/guidance-runs/`):

| Ask | Old page (`.tmp/example/`) | Draft wording | Final wording |
|---|---|---|---|
| German, "etwa 10 Fragen" | quiz at once | quiz at once, closing offer | 1 of 2 samples: quiz at once (new numbers, said so); 1 of 2: summary + two questions (numbers, tempo) |
| English, same, language unstated | German quiz at once, unsaid | German quiz at once, said so, offers translation | summary + two questions (language, numbers), both on the case-naming version (after the answer, a German quiz) and on the owner's instruction |
| Frontloaded German brief | — | quiz at once | quiz at once |

The table's last column is the merge before the cut. After the cut, one
sample of the English ask (`.tmp/guidance-runs/page-v4/en/`): summary of the
five exercises and a plan, and one question before the quiz, the language;
new numbers, no timer and drawn number lines are stated as defaults the
teacher can change. The ask-back survived the cut; one sample, so no rate.

Every quiz produced parsed without errors or warnings. Not established: the
claude.ai system prompt and real fetch behaviour, other models and the free
tier, whether the drawn number lines match their keys.

## 2026-11-03 — After upload: the check, the teacher code, one question, Swap

Serves: v4 item 8 (delivery A). Design: `docs/after-upload.md`, draft 5,
closed; its §4 corrected by the owner on the limit (below). Branch
`after-upload`. Supersedes the gate in "One code per quiz, two teacher roles
per tab" and rules 2–4 of "A second teacher device once the class is in";
user-flow.md §1 and §3 describe the flow as built.

**Built:**
- **The single tab after upload opens on the check:** title and number of
  questions, the class code small (with the count once someone joined), today's
  tempo line, the teacher code at rest in one sentence ("A second device, to
  steer from or to show the quiz on: on classyquiz.pages.dev, type 63953 47.
  Or a new window here."), the question list with its fixes. **Show the
  class the code ▶** is the one tap to the join screen: today's fold, Start
  quiz ▶, the tempo line, and a quiet line "‹ Questions · A second device ›
  · ⋯". Which of the two the tab shows is kept per tab (sessionStorage), so
  a reload stays; a wall that takes the steering back in the lobby shows the
  join screen, never the check.
- **The teacher code** is the class code plus two digits, drawn at upload
  (`meta.teacher`, any digit 0–9), returned with the upload and in `/info`,
  carried in every teacher view. The code box on the root page and on `/play`
  routes by length: five digits are a student, seven a teacher device
  (`/play#6395347`). `/api/join` takes seven: the first five find the
  instance, the instance checks the two. `takeRole` checks them again
  itself, whatever the page did; the uploading device's secret (Resume)
  needs no digits.
- **The device that comes in** acts on `choose.entry`, which replaces the
  per-role `ChoiceState`: `ask` when one tab shows and steers ("Show the quiz
  here" / "Steer it from here"); `remote` or `screen` when that tab is gone,
  taken without a question; `screen` too when nothing is there, and then a
  gone Remote's token goes with it, so the next device is asked; `full` when
  both are there. It acts once, on arrival: a device left on the question or
  on "full" never takes a role by itself later ("Try again" asks anew).
- **⇄ Swap**, a new op from either tab while the other is there: both get
  new tokens; the other tab hears its new role through `evict`, the sender
  in its reply. On the wall: faint in the lobby's corner, and in ⋯; on the
  steering tab: "Projector ✓ · ⇄ Swap" in the lobby, and in ⋯.
- **Gone:** the class-in gate in `choiceState`, `allowJoin`, `joinUntil`,
  `projectorHere`, `steerHere` and the wall's "Steer from here", the secret
  sent with a role, `/teacher`'s two buttons. The bar's "Remote gone [Allow a
  device to join]" is "Remote gone: type 63953 47 on another device"
  (after review D: "Remote gone: another device via ⋯", below).
  `/teacher` asks for the teacher code, with the class code in the box,
  except on the device that uploaded the quiz, which goes in with its secret.
- **Wrong teacher codes:** the fifth within a minute from one device refuses
  that device's teacher codes for this quiz for 10 minutes ("Too many wrong
  codes for this quiz. Try again in a few minutes."), at `/api/join` (429)
  and at `takeRole` alike. Counted in the instance, which the check reaches
  anyway. An attempt without two digits (the class code alone) isn't counted:
  it is no guess at them. (After review D: stored, and with a per-quiz
  allowance besides, below.)
- **`/example`:** the check without codes, read in the browser from a static
  .zip in `public/examples/` (the four language runs in `.tmp/example/`, by
  the browser's language or `?lang=`), with "Download the example (.zip)" in
  place of Show the class the code, no fixes, pictures from the .zip.
- **The guide's account of a lesson** (index.html) describes this flow; the
  root page's code box takes seven digits (`maxlength` 8, so "63953 47" pasted
  with its space fits; the box keeps digits only).
- **Where a quiz stands,** in the owner's `/info` answer (`stands`: phase, n of
  total), for the landing's resume line (v4 item 2), which reads it.
- **The steering bar on a phone-sized wall** shows the code without the
  address, and gives the code's room to −5/+5 when they are there: the
  address cut the code to a lone digit before the ellipsis (bugs.md, the
  stray "1").

**Differs from the design, and why:**
- **The limit keys on the device, not the quiz** (owner, correcting §4: the
  "no IP addresses" decision is about logs and retention, not attack
  detection). The address is hashed with a salt that lives in the object's
  memory, held for the window, never stored or logged. Per quiz only where
  there is no address (local development). Consequence: memory-only means an
  evicted (hibernated) instance forgets its counts; a script that pauses long
  enough between bursts of five gets more tries than the numbers say (review
  D measured it: about 10 s idle locally; fixed after it, below). Behind
  a school's NAT a class shares an address: a pupil's five wrong codes lock
  the teacher's second device out too, for ten minutes, on the school Wi-Fi;
  the uploading device is exempt.
- **No migration by expiry.** The design kept `/teacher` for quizzes open at
  the deploy until they expire. Instead an instance without digits gets them
  on its first load after the deploy, stored at once; its teacher's screens
  show them from their next view. One code path, and no gate kept alive for
  old quizzes.
- **"Steer from here" is gone entirely,** not kept "for a wall whose steering
  tab is gone": the wall already steers by itself 45 s after its Remote is
  gone, so the case has no item left to serve.
- **Today's tempo line, not the speed switch:** delivery A carries
  today's tempo control onto the check (and the join screen) as it is; the
  design's "Points for speed" line comes with v4 item 6 in delivery B.
- **The Remote without a wall** offers "A second device…" in ⋯ instead of
  "Show the projector here"; the card says how to bring the projector back
  with the teacher code.
- **Resume on the landing** only changes its link (`/play#<teacher code>`);
  the card's "On another device: type 63953 47 in the code box" is the
  landing's resume line (v4 item 2), on its own branch, from `/info`'s
  `teacher`.
- **`/example`'s .zip files are the old guidance's runs,** placeholders until
  the redo (landing story S1); the page reads whatever .zip is there.

**Checked:**
- Both typechecks; 96 unit tests (none touch the instance).
- `simulate.mjs`, all three modes, OK (1,399 HTTP requests with all polling,
  1,345 before: the added role cases). New checks: the upload returns the
  digits; `/api/join` takes the teacher code and tells a wrong one; the phone
  is asked while one tab shows and steers; with the Remote gone, a new device
  is sent to it; with both there, a third takes nothing; a tab on HTTP answers
  Show the quiz here and the old tab becomes the Remote; three swaps, from
  either side, over WebSocket and HTTP; with students in, the class code
  alone takes no role, the secret and the teacher code do; with nothing
  there, a device takes the Projector and steers; five wrong teacher codes
  lock the device (the right code and `takeRole` refused too), the secret
  and the class code unaffected.
- Headless Edge through the real pages (`.tmp/shots-tool/after-upload-walk.mjs`,
  41 checks, no page errors): upload through the file input to the check;
  the join screen, a reload staying on it, the sheet, the way back; "63953 47"
  typed with its space in the root page's box, the question, Steer it from
  here; the wall's class lobby with Swap; a student with five digits; four
  swaps, from the wall's corner and the steering tab's lobby line; a third device
  told both are there; a wrong code; the old `/teacher` link; Resume's link;
  the phone dying, the wall back on the join screen with "Remote gone", the
  bar's line; the 360 px bar; a new phone taking the free steering without
  the question; the wall's ⋯; `/example` in German and English, pictures
  from the .zip, no fixes.

**Learnt:**
- A click within 0.7 s of the steering view first appearing is swallowed by
  the step lock (`STEP_LOCK_MS`), silently: the walk's Start did nothing
  until it waited. A person is unlikely to be that fast; noted, not changed.
- Two local stacks at once collide in wrangler's dev registry when their
  Pages projects share the name `classyquiz`, and a stack killed hard leaves
  a stale registry entry the next start keeps using (uploads fail with
  "Network connection lost"). The stack scripts in `.tmp/stacks/after-upload/`
  rename the project and delete their own entries before starting.

**Deploy:** no migration. Old pages open at the deploy: a `/teacher` choice
screen's buttons are refused (no digits), a wall's "Allow a device to join"
and a Remote's "Show the projector here" answer "unknown command"; a reload
gives the new pages. Quizzes open at the deploy get their digits on first
load.

**Not established:** whether teachers read "63953 47" as theirs and "63953" as
the class's; whether "Show the quiz here", "Steer it from here", "A second
device", "Show the class the code" and "Swap" are the words they reach for;
a phone casting by Miracast; the limit against a real attacker on
Cloudflare (it ran locally, where the address may be absent and the count
the quiz's; which applied wasn't checked).

**After review D** (`docs/reviews/2026-11-03-review-d.md`, its §1–4 and the
own-copy wording; branch `review-d-fixes`). The coordinator's resolutions,
on the purpose of connecting a remote: easy to go right, hard to go wrong;
outside scripts are the real attacker; the child in the room isn't a
technical problem, but the site must not hand the child the code itself.
- **Wrong teacher codes, stored, with a per-quiz allowance (#1).** The
  counts were in memory, and an idle instance forgot them: locally, a pause
  of about 10 s between bursts reset them, so a script that knew the class
  code swept the 100 endings in minutes.
  - Now in the instance's storage (`guesses`), written only on a wrong
    ending; a right code or a refusal writes nothing.
  - Per device, as before: five within a minute refuse that device for ten
    minutes. The device is still a salted hash of its address; the salt is
    drawn per quiz and stored with the upload, so a device keeps its key
    after the object idles. The hash is stored only while it counts: the
    alarm deletes it when the minute or the refusal runs out.
  - Per quiz, new, whatever the addresses (an IPv6 /64, a botnet): at most
    ten wrong endings, one more allowed every six minutes. Spent, every
    teacher code for the quiz is refused, the right one too, else the
    answers would still tell it. A sweep of the 100 endings takes about nine
    hours, about four and a half on average to hit, within the quiz's 48;
    "hours, not seconds" (§4) holds now. Writes are bounded the same way.
  - The cost of it: a script, or a class typing seven-digit codes, can keep
    the teacher's second device out, a try at a time every six minutes. The
    uploading device's secret (Resume) is exempt from both, as before, and
    is the teacher's way in then.
  - Not done: keying IPv6 by its /64 (the per-quiz allowance covers many
    addresses); more digits.
- **The teacher code is off the wall's bar (#2).** The bar while the Remote
  is away said "Remote gone: type 63953 47 on another device", in front of
  the class, at the moment the Remote was likeliest away, and a tablet that
  typed it took the steering. Now "Remote gone: another device via ⋯"; the
  code is on the teacher's own device, and on the wall only on demand: ⋯ →
  A second device…, the join screen's "A second device ›" sheet, the check
  at rest (the teacher's screen before the class sees the code), and
  Leave's confirmation.
- **Nobody in yet, per class (#3).** The 90 s count started with the first
  empty lobby and never again, so after "Again with another class" the
  wall said at once that the school network may block the site. The count
  now ends with the first avatar and with the run's start; the next empty
  lobby starts its own.
- **A quiet Remote is free for the teacher code (#4).** A closed steering
  tab counted as there for 45 s, so its owner typing the code again was
  told "full" for about 50 s, while the wall didn't steer either.
  - `entry()` and `takeRole` treat a Remote as held only while it is
    present: a quiet one, 25 s without a sign, or one whose line closed and
    hasn't come back (`closed`, set in `webSocketClose`), is taken at once
    by the teacher code, and its old tab hears "lost" if it returns.
  - Everything else is as before: the wall steers only once the Remote is
    away (45 s), the bar's presence doesn't change, a swap still waits for
    a quiet tab, and the wall's side isn't loosened (review D's open
    question about a throttled hidden projector tab).
  - A polling tab whose poll is held counts as heard from now, so a live
    Remote on the HTTP fallback isn't quiet at the end of each 25 s poll.
    A closed tab on the HTTP fallback is still taken only once quiet, within
    25 s.
  - "Full" says "If one of them was on this device a moment ago, try again
    in half a minute." under its sentence, for what is left of the case.
- **The own-copy line says only what it knows (wording note).** "and new
  quizzes had to wait for the next day" was true of the upload cap, not of
  the bytes cap, which clears as quizzes expire, up to 48 hours. Now "On 3
  of the last 30 days this shared site was full and turned new quizzes
  away." In German "voll und hat neue Quiz abgewiesen", in French "a été
  complet … et a refusé de nouveaux quiz" (review D's "complet" for "plein"),
  in Italian "è stato pieno … e ha rifiutato nuovi quiz".
- **Left as they are:** #5 (Back to the quiz with the quiz's tab still
  open asks the question; designed); the at-upload "The free site is full
  for today." (`SITE_FULL`, `siteFull` in four languages) and
  `own-copy.html`'s "works again the next day", which carry the same
  next-day claim for the bytes cap; the line's `/own-copy` link; the line
  appearing mostly after a script filled the upload cap (review D's
  reading of `limits.ts`).
- **Checked,** on a local stack of its own (workers `-rdf`, ports
  8941/8942; scripts in the session scratchpad's `rdfix/`):
  - both typechecks; 99 of 99 tests (none touch the instance);
  - `simulate.mjs`, plain, `--all-poll` (1,427 requests) and `--tempo`:
    all OK, with two new checks: a Remote whose tab just closed is taken at
    once with the teacher code, the wall not steering in between; from new
    addresses the quiz's allowance runs out within ten, then the right
    code from another new address is refused, the secret and the class
    code get in. The local stack passes a client's `cf-connecting-ip`
    through; the platform sets its own;
  - review D's probes, re-run: `evict.mjs` with 12, 25 and 45 s pauses
    refuses the fifth wrong code each time (review D: the count started
    again after 12 s and more); probe 4, the closed Remote tab and the code
    typed at once: on `/teach` at +3 s (review D: +51 s); probe 3, Again:
    no "Nobody in yet?" on the new class's lobby; probe 1: the bar in the
    quiz reads "⋯ 127.0.0.1:8942 · 53000 Remote gone: another device via ⋯
    Show votes", "full" carries its new line, no page errors. Probe 1's
    tablet still takes the steering with the code, which it reads off the
    check, not the wall;
  - the counts across a restart of the state Worker (memory gone): four
    wrong codes from one address and five from others, restart, then the
    first address's fifth refused, a new address's wrong one spends the
    quiz's tenth and is refused, the right code from a third refused, the
    secret in;
  - a timed walk: after the phone's tab closes, a guest is offered
    `remote` within a second; the wall says "Remote gone" at +45 s, as
    before.
- **Not established:** that the alarm deletes a device's hash once its
  count runs out (by the code, not observed); Cloudflare's own idle
  eviction and `cf-connecting-ip` there (review D), which no longer decide
  the limit; whether "another device via ⋯" is read as meant on a wall.

## 2026-11-03 — The landing page: the strip, two steps, resume, four languages

Serves: v4 items 1, 2 and 4, the last part of delivery A. Design:
`docs/landing-story.md`, draft 4, with an as-built note there; user-flow.md
§3.1 describes the page as built. Branch `landing`.

**Built:**
- **The strip,** four frames in the video's order (sheet, ask, tablet, wall),
  the class frames the largest, captions of at most four words. Until the
  video exists it is one link to `/example?lang=<chosen>`, with no ▶. On a
  phone it is one row that scrolls sideways, the sheet first at about 60 %
  of the width and the next frame peeking in. The frames:
  - the sheet: the rendered pages (`.tmp/example/sheet/`), two fanned, until
    the owner's photographs replace them;
  - the ask: a drawing of the act, a phone with two pages going up and a
    .zip coming back, no words; a placeholder for the storyboard's K2;
  - the tablet: `11-tablet-focus-buttons`, the plain colour buttons, in
    every language (coordinator: the example's second asks wanted pictures
    to tap, which a first-time teacher wouldn't ask for; the first
    impression shows what a plain ask produces);
  - the wall: `30-projector-focus-reveal` for DE, EN and IT. French was
    re-shot with question 1 as the focus (327 000 against 320 700, 12/6/2
    votes), since its 30 leans on the question before it; the screens are in
    `.tmp/example/v2-fr/screens-q1/`, from the class walk adapted to the
    check-first flow (`.tmp/example/screens-tool/class-walk-checkfirst.mjs`).
  The images are WebP in `public/landing/`, about 170 KB for all four
  languages.
- **Build, two steps.** "Choose any good AI.", with "Claude Opus wrote the
  example quiz, 3 Nov 2026." under it, and "Ask it to build you a quiz for
  `<address>` [Copy]", then "For example, with photos of two pages:", the
  ask as a chat bubble, and "A second message reshapes the quiz." The
  bubble is each language's real first ask, verbatim (checked by script
  against `v2-*/teacher-1.txt`); its five parts are underlined, with their
  labels under them (this site · which exercises · your class · how many ·
  which language), and on a phone as one line after the bubble. The address
  in the bubble and in Copy is the one the browser opened; the static
  English bubble gets SITE_ADDRESS from the build like the rest of the page.
- **Run:** the resume card above the box, the box, and the own-copy line
  under it. The foot lines are gone.
- **Four languages** for the block above About (`client/landing-text.ts`, one
  table per language, Run's messages included). The switch "EN ▾" sits top
  right over a native select listing Deutsch, English, Français, Italiano;
  it is made by the script, so a fetcher doesn't read four language names.
  The choice is kept on the device (`cq.lang`); otherwise the browser's
  first language among the four, otherwise English. The static HTML stays
  English. `/example` takes `?lang=` from the strip, else `cq.lang`. The
  quiz's problems, the archive's messages and the text copied for the AI
  stay English. Address: German "du" (the asks' own register; Swiss
  spelling), French "vous", Italian "tu".
- **Resume (item 2).** The latest quiz this device started; if it is gone
  from the site the next newest is asked, three at most, one request each.
  Shown only until its final ranking: the title, where it stands ("before
  the first question", "question 4 of 10"), Back to the quiz ▶ (`/play#` +
  the teacher code), the class code, and "On another device: type 63953 47
  in the code box." No closing time, no Delete, no "n more" (item 2; item
  3's "Delete-by-title on the landing").
- **Device history:** the days this device uploaded, dates only, at most
  60 (`cq.days`, `client/history.ts`).
- **The own copy (item 4, the product owner's default).** The budget records
  each day on which it refused an upload (the daily cap or the bytes
  stored), once a day, kept 31 days; `GET /api/site` answers `{full: n}` for
  the last 30 days, today included. The page asks only on a device that has
  uploaded before, once per visit, and shows one line under Run only when n
  > 0: "On 3 of the last 30 days this shared site was full and turned new
  quizzes away. A copy for you or your school is yours alone: how ›" (was
  "…had to wait for the next day", changed after review D: see "After
  upload", its review D part). At an upload, the full site and a spent
  allowance are said in the chosen language with "Your own copy: how ›".
- **Network help where failure shows (item 4; landing story §7):**
  - the upload: no connection, or an answer that isn't the site's (a
    filter's page), names the school network as a possible cause, with
    "What to tell IT ›" to `/check#it`;
  - `/check#it`: "If the site doesn't open at school at all", readable
    without running anything, with the text for IT and this site's address
    (the build substitutes it in `check.html` too);
  - the wall's lobby, steering or not: after 90 s with the join screen up
    and nobody in, "Nobody in yet? If the tablets can't open
    classyquiz.pages.dev, the school network may block it: what to tell IT
    ›" (a new tab, so the wall stays), gone with the first avatar; counted
    anew for each class since review D (the run's start and the first
    avatar end the count), so "Again with another class" waits its 90 s;
  - a device that reaches the page but not the quiz: after 15 s, at joining
    or in the offline banner, "This device can't reach the quiz. Tell your
    teacher." (a teacher device without the second sentence).
- **`/example`** carries the redo's final zips under the names it served,
  in place of the placeholders.

**Differs from the design, and why:**
- **Step 1's detail** is neither the dated free test nor the personal frame.
  Owner's rule: no claim that isn't true, and none about free tiers. What is
  verified is that Claude Opus wrote the four example quizzes, through the
  claude CLI with Read and Write (the harness zipped the folder; claude.ai
  itself not tested). The personal frame's "expect paid Gemini or ChatGPT
  to work just fine" is untested, so it is left out.
- **The wall frame** shows question 2's votes for DE, EN and IT, and their
  focus wrong answer isn't the "tick read as 100" one (§2 and §5 name
  question 1); only the French re-shoot has that pair.
- **The labels** are positioned under their words, not ruby: ruby spread
  the words apart whenever a label was wider ("in   English").
- **The own-copy wording** says what is recorded: the upload cap, so new
  quizzes had to wait. The story's "every class stops until 01:00" is true
  only of a spent request allowance, which isn't recorded (below).
- **§6's other rows** (busy today, a regular's dismissable line, full now
  before an upload) are not built: item 4 resolved them to the one rule.
- **"This device"** for the story's "This tablet": a phone joins too.
- **Words at rest:** about 110 in English, against the story's 80. The
  rendered ask, the five labels and step 1's detail are most of the gap.

**Checked:**
- Both typechecks; 99 unit tests (new: the full-days count, the language
  choice, each language's ask labelling the same five parts in order).
- `simulate.mjs`, all three modes, OK (1,400 HTTP requests with all
  polling). The first `--tempo` run scored one student 59 where 45 was
  expected; two re-runs passed. The game and the instance are untouched
  here; it is the intermittent mismatch in bugs.md, seen a second time.
- Headless Edge through the real pages on the local stack
  (`.tmp/shots-tool/landing-v4-walk.mjs`, 71 checks, no page errors):
  1366×768, 1280×800, 1024×768, 390×844 and 360×740, no sideways scroll of
  the page in any language; the strip above the fold at 1366, Build and Run
  side by side and above the fold at 1366 and 1280, Build above the fold at
  390; the labels inside the bubble and apart in all four languages; the
  switch, the remembered choice, a French browser getting French, About
  English in every language; the strip opening the French example; the
  upload refused offline and by a filter's page; `/check#it`; the resume
  card before the start and at question 1, in English and German; the
  own-copy line with the site's answer stood in; a tablet whose joins fail;
  the wall's line at 90 s and its going with the first avatar; dark mode.
- The own copy's server side on a stack copy with the daily cap at 2
  (`.tmp/shots-tool/full-walk.mjs`): `/api/site` 0 before, 1 after three
  refusals and still 1 after a fourth; the line on a device with history,
  in German; the upload's "full for today" with the own-copy link.
- A build with `SITE_ADDRESS=https://quiz.example-school.ch/`: the address
  in `index.html` (bubble included) and `check.html`, none of the demo's
  left.

**Learnt:**
- Puppeteer hangs on evaluating in a tab whose window has another tab in
  front; `bringToFront()` before driving it.
- The class walk that shot the redo's screens predates the check-first
  flow; it ran before after-upload was merged. The copy adapted to it is
  beside the original.
- The four runs named their zips as they liked; the English one is
  `zahlenstrahl-quiz.zip` too. `/example` serves them under per-language
  names, so the download's name isn't the AI's.

**Deploy:** no migration. The Pages project gains a binding to the state
Worker's `SiteBudget`, which gains `fullDays()`: the state Worker goes
first, as `deploy.mjs` does it. Full days start counting at the deploy, so
the line can't show before the site is first full after it.

**Not established:** whether teachers read the strip in five seconds (the
story's §9 test); the German and French wording by a native reader, and
the Italian by anyone (no checker on this side; shipped as written); the
storyboard's drawn frames; how a fetcher's text conversion reads the
labelled ask (the static HTML has the plain bubble and the labels as one
line after it); a spent request allowance, which the full days don't
record, so the line understates a site that runs out of requests rather
than uploads; the free-tier test, which step 1 waits for.

## 2026-11-03 — A refused upload says which cap it hit

The site said "full for today" and "works again the next day" for both caps.
True of the uploads a day (back at 00:00 UTC), wrong for the bytes stored
(back as quizzes end or expire).

- `SiteBudget.reserve` already knew which cap refused; it said only `false`.
  It now answers `true`, `"uploads"` or `"bytes"`; `create` puts it in the
  failure as `full`, beside `error` (`UploadResult`), and the Pages function
  passes it on. `SITE_FULL` is gone (the client matched the sentence); the
  server's `error` is `siteFullMessage(full)`, English, for any reader that
  doesn't know `full`.
- Uploads: "The free site can't take more quizzes today. It takes new ones
  again at 01:00 Swiss time." (the daily reset, as the allowance's `quota`
  line says it; "00:00 UTC" without time zone data). Bytes: "The free site
  has no room for another quiz right now. It takes one again once others
  have ended or expired (two days after their last use)." The two days are
  `INSTANCE_IDLE_MS`; a quiz in use stays. Both in the four languages
  (`siteFull(full, at)` in `landing-text.ts`), under the same own-copy link.
- `own-copy.html` (English only, as before): "When that is used up, it says
  so and takes new quizzes again once the day turns or older quizzes have
  expired." The own-copy line already said only "turned new quizzes away".
- Not established: German, French and Italian wording by a native reader,
  as with the rest of the landing. The two caps' wording was not shown in a
  browser; the uploads cap is 300 a day, the bytes cap 1 GB, neither
  reachable on a local stack without lowering them.
