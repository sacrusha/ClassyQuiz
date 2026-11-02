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

Serves: v1 item 2.

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
  full screen.
- **On the teacher's device, a step can't be tapped twice.** After each step
  (start, reveal, next, …) the buttons stay inert for 0.7 s. Otherwise a
  double tap on "Reveal" lands on the "Next" that replaces it, and the class
  never sees the reveal. The page also leaves the buttons alone while
  answers come in: only the numbers are patched. A button replaced under
  the finger would lose the tap. Found by both reviews.
- **Late joiners** get in at any point before the final ranking.
- **The teacher can remove an avatar**, e.g. a double tab or a stranger
  with the code. Its answers stop counting.

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

Serves: v1 item 14.

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
  at most 60 pictures, 16 MB per upload. Files the quiz doesn't name are
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
  (`taskkill /T`). Stopping only the shell leaves workerd holding the ports.
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
  - **Letters in order**, such as "A, B, C", optionally followed by one
    longer answer ("A, B, C, Auf keinem"), keep their order without the
    line. The key follows the figure there, and "C, Auf keinem, A, B"
    reads badly. Quizzes made before `Order:` existed rely on it,
    including the owner's.
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
