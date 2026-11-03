# classyQuiz — Backlog

Project → versions as goals → items that get picked, worked and delivered. Each
item names the problem it solves for the teacher or the class; the versions tell
the story of what comes before and after. Items get resorted, split and combined
as understanding grows. Last settled: 2026-11-02.

## Project

A teacher has an exercise sheet and wants fifteen minutes of fun practice on
exactly that content. Existing tools fail on authoring time, premade content
fails on topic. The product is the path from sheet to a running classroom quiz.
Often the quiz is made in the ten-minute break before the lesson, with the
teacher's own AI, and used once. The material arrives as a few photos taken with
a phone, or as a document or PDF uploaded from a laptop; the teacher may be on
either device. Any age group, including settings beyond school with adult
participants; the example to design against is a Swiss German-speaking primary
class: a school-issued laptop on the projector, Android tablets for the kids,
the teacher's phone as remote, and an AI account that may be a free one.
Teachers understand English; students may read slowly, or not
read English at all, and the teacher is in the room. The guidance to the AI is
in English, which AIs are trained on; quizzes come out in whatever language the
teacher and the sheets are in. The measure is teacher time. The failure mode to
design against is a normal user who can't use it, not a malicious one: a
disruptive student is handled by the teacher walking over to the tablet and
taking care of the student. Children actively and openly sabotaging the class
while in class is not a technical problem that needs a technical solution.
By contrast, children automating a denial of service from outside the class,
to vandalise while in class or to vandalise another class's quiz, is a
realistic problem.

## Constraints

Hold for every version; not picked as work.

- **Nothing public, nothing kept beyond its use, nothing identified** — data
  protection, and the own-classroom copyright exception for quizzes derived
  from published material. The packaged quiz lives on the server for the
  lifetime of the quiz instance — what that lifetime is, is part of the work;
  the teacher's file on disk is the durable copy.
- **Survives school Wi-Fi** — connections drop, phones go to sleep, a device
  dies mid-quiz, and the lesson must go on. Failure in front of the class ends
  adoption. A deploy or a Durable Object restart in the middle of a run is the
  same situation from the server's side, and nobody has tested it yet.
- **Designed for Claude**; other mainstream AIs verified to produce usable
  quizzes from the guidance.
- **Hosted on the owner's Cloudflare account, no domain of its own** — a
  teacher's laptop can't be relied on to be reachable over school Wi-Fi; it's a
  tool, not a product, and usage limits nudge heavy use toward self-hosting, on
  Cloudflare or another provider. Free plan, designed to stay within its limits
  for a few users. The README promises that an AI can set up one's own instance
  from the public repo.

## v1 — One real teacher runs one real quiz their AI made in the break

Text-only multiple choice, up to four answers, press the right one. Runner first
so there is something to click early; authoring closes the loop.

1. **Quiz format** — a wrong key must be visible in seconds and fixable in the
   text or by telling the AI; an AI must write it reliably. Title, questions, up
   to four answers, any number of them right. The quiz is the finished
   deliverable: the AI talks to the teacher while authoring, when the teacher
   is there to react, not through the quiz during the lesson. (A per-question
   authoring note for the AI's doubts was the product owner's proposal,
   unobjected until the owner saw it in the design and rejected it.)
2. **Upload as pasted text or as an archive** — not every AI emits files; those
   that do hand over one bundle. The archive is the container from the start;
   v2 puts images in it. Zip only: every tool that makes tar.gz can make zip,
   and several loose files are too error-prone. Upload attempts are counted by
   format, with content and identity excluded, so whether anyone tries another
   format is a fact to look up rather than a guess.
   Owner, after seeing v1: .txt/.md invite users to type their AI questions
   into the textbox — people tend to be like that. So no text files, and the
   paste box must not read as a place to talk to an AI.
   Later the same day, on the live page: pasting the text quiz is itself a
   distractor; a simpler drop target and file opener is enough, "the block
   your AI made" and the clipboard button distract; zip is more useful —
   "let's see if we can get away with zip only."
3. **Three audiences in one session** — the class looking at the projector, the
   teacher steering from a small screen — possibly a different device than the
   one driving the projector — and students answering on their own. The teacher
   may paste and set up on either the laptop or the phone; during setup the
   projector is off or an extended screen, but a mirrored laptop would show the
   class the key and the controls.
4. **Joining** — 25 kids inside a minute on shared, school-managed tablets with
   nothing set up or installed on them: that is the baseline, everything beyond
   it is optimisation. Devices with and without cameras, young readers, a
   teacher in the room who can call out what to do. Reaching the site is the
   slowest step; without a domain the owner prefers a `pages.dev` address, with
   short links or QR codes as further options.
5. **Students on the big screen** — they appear in a way that's fun, exposes
   nobody, and stores nothing about them; quick avatars are fine.
6. **Teacher-paced flow** — the teacher sets the tempo, stops to explain, shows
   the answer; the quiz is a teaching moment and no clock pressures the teacher.
7. **Answering on a small screen** — quick taps; colour-coded answers have
   worked better than lettered lists. Correctness scoring; speed scoring in v2
   must not need a rebuild.
8. **Ranking, intermediate and final** — closure for the whole class, slow
   readers included; export later without rework.
9. **Fixing a question during the run** — during the question, at the reveal,
   or any time before the final ranking; e.g. skip it, void it, change the key
   with the points following, or let another answer count too — the same
   capability as a question where any number of the answers are right and
   students pick one; a question where every answer is right has its own fun.
   Nothing constrains the number of right answers except what the result
   display can show. AI-made keys are wrong now and then; with break-time
   authoring this is the review.
10. **Hosted instance** — upload from one device, run from another, nobody has
    an account; nothing kept beyond its use.
11. **Guidance page: what the site is for, what quizzes are for, how they're
    built, how to build them with a human** — an AI told only the site's name
    must come away understanding these four things; typing the name into the
    chat already open must be enough. Whether a given AI actually does is a
    fact to test, not assume; known hazard: some hosting plans block AI
    fetchers by default. Part 4 is a first draft the owner takes over.
12. **Preview as the class will see it** — low priority: useful when there is
    time before class, which often there isn't.
13. **Validation errors the teacher can hand back to the AI** — low priority: a
    single-use quiz with a format error gets regenerated rather than repaired.
14. **Self-hosting nudge** — the free plan serves a few users; the site tells
    people how to get their own instance, e.g. "ask your AI to set one up,
    takes 5–10 minutes", or the guide on GitHub.
15. **An answer that looked in time counts** — a student who tapped before the
    reveal, as far as their tablet showed, and then finds it didn't count is
    disappointed, and the fun is dented for the whole class. What the device
    shows as accepted and what is counted must agree, however the teacher's
    reveal and the tap race each other over school Wi-Fi.
16. **The landing page lands the teacher** — the teacher arrives first and may
    be non-technical; if they don't see within seconds how to get a quiz and
    how to start one, the AI reading the same page doesn't matter. They need
    the sentence to give their AI (e.g. "Please help me build a
    classyQuiz.pages.dev quiz from the attached exercises") and an expectation
    of how that conversation goes; then two things to do: start a quiz, join a
    quiz. Students need less, the teacher instructs them. What's there now is
    five action elements and a number field with no minimal how-to. On the
    first design: right direction, too noisy. Two things, "Build a Quiz" and
    "Run a Quiz"; Run a Quiz is one element, not three plus a label; no need
    to keep the screen busy. Build, perhaps, a step-by-step list: pick a
    capable AI, free Claude works; give it photos of the exercises and ask it
    to build a quiz for classyquiz.pages.dev — "Help me build a quiz for
    classyquiz.pages.dev" works — best in the language the quiz should be in,
    and ask it to explain how this works. On the second design: looks clean;
    the copy has a problem for multilingual users, the specific sentence
    contradicts the language instruction; the three Build steps need work,
    the direction is right.
    On the live page, by attention budget: it overspends. The resume list
    needs no more than one active quiz, though a list is fine since that user
    already knows how to create one. "About this site" is a wasted link.
    "Check the school network" and "run your own copy" don't say what they
    are for, to an average teacher. Owner's examples, problems more relevant
    than the wording: "Some networks block … — one click compatibility
    check", leading to all good or to what to tell IT; and "This is a free
    server that can run a few hundred quizzes per month, total. If you don't
    worry about its limits, ask AI to set up your own, here's a quick guide",
    the guide being short: what Cloudflare and GitHub are for the user, a
    sample prompt for the AI, what work they'll have to do (create a free
    account, have the AI tell them where to find a token and how to give it
    to the AI), the GitHub link. Better solutions welcome.
    Third look, on the live page after the rework: "ChatGPT works as well"
    may be more valuable information than "Opus works better" — corrected:
    ChatGPT currently breaks with two attachments, maybe temporarily. Sonnet
    was only tested on a paid account; that the free tier offers Sonnet was
    checked, whether it produces a working zip was not — "the free version
    works" is unverified and needs a more thorough test. The bullets
    under step 2 should mention the number of questions — it helps the user
    specify, and makes the model more likely to ask when it isn't. "Download
    it." is an order for the sake of ordering the user around, extremely
    off-putting; "It hands you the quiz as a .zip file. Download it." and
    "Open the quiz's .zip" are a bad way of saying "Upload the quiz the AI
    created (*.zip)". The list of open quizzes got broken: worse formatting,
    still an accumulating count, and an expander that goes out of sync. The
    two lines with the links are incompetently written.
17. **Coming back to a quiz, from the teacher's side** — a quiz already
    uploaded is worth resuming, but "your quizzes on this device" reads as if
    the server held a shared list. The teacher's view is: resume, how long
    until it closes, delete now — with delete placed where a misclick can't
    reach it. Students coming back by re-entering the code is probably enough.
    These are design decisions; the purpose is low-friction use. On the first
    design: "On the site until Wed 16:20" reads as publicly shared, which it
    must not; what it is for is unclear to the owner, and its insistence points
    to a rule that snuck in as a requirement.
18. **One code, roles picked in the lobby** — owner's direction after seeing
    v1: most teachers start from the projector laptop, not by "connecting a
    projector". Anyone who has the code can pick any role still free, with
    one screen role and one control role in total; so a teacher whose battery
    runs out picks up the freed control role from any device, with the same
    code the class used, which the screen shows in a corner throughout. Roles
    aren't necessarily different devices: different tabs or windows do; a
    dual-screen laptop should be a common case, and the projector as
    single-screen controller is useful. Redefined after the second design, in
    the owner's words: be careful of children accidentally taking the remote;
    we may be over-committed to a solution. Losing connection is presumably
    rare; losing both projector and remote is an "oh well, quiz is over"
    moment; typically both are set up before any student gets the code.
    Realistically: a device loses connection and reconnects with the same
    role; the phone battery dies and the teacher switches to a
    projector-plus-control hybrid role; the projector dies — tough luck, the
    teacher reads the questions off the remote and improvises. Code per quiz,
    confirmed.
19. **The view after upload** — owner's direction: it must be easy to tell
    it's the right quiz. Lobby management on top, few words, simple clean
    design: how to join, who joined, and the start button ("Start quiz", not
    "Start with a class"). Below it the question set; expanding the answers,
    with an "all" toggle, shows them with the marked ones. A "show the key
    check" button fails because the teacher doesn't know what a key check is,
    and a "the class would see them" warning is only needed when the user
    doesn't know what the button does.
    On the live lobby: Start, "Open projector" and the "open classyquiz on
    another device" line — the last duplicates the second's job. "Start quiz"
    doesn't say the mode: as projector, remote, or the one screen that does
    both, which needs a better public-facing name. Owner's example: the button
    says "Start as [that]", and the text below says if you want separate
    remote and projector screens, connect a second screen and choose remote
    or projector.

## v2 — Figures, tempo, and a hardened instance

Most sheets have pictures; some classes want energy; an open instance gets fed
garbage.

1. **Image per question** — figures are the exercise; the question on the big
   screen is what makes the quiz feel interactive, so the voting devices don't
   need it. Owner's direction: beside the question is a good improvement but
   may depend on question length; a background image is a separate thing from
   the question's image, and different questions can share images. The
   initial target is a teacher whose AI can make a zip — working and good
   first, flexible later.
   Open: the guidance tells the AI the mechanics of a picture and points to
   the wall's layout, but not what makes one work there — a tight crop, how
   wide and square figures land, what the back row can read, nothing from the
   sheet's solutions or a pupil's name in the crop, the size caps.
2. **Optional countdown** — game-show tempo for classes that want it. Owner's
   thoughts, undecided: a smooth bar or circle might be better than a discrete
   count; what the teacher needs to control it is unclear, a minimal solution
   might be a "start the countdown" button; unclear whether the question
   should appear first and the answers only during the countdown.
   After the build: a tempo chosen in the lobby is a problem when the quiz
   wasn't designed for one — the AI that wrote the questions knows which need
   a minute of arithmetic and which ten seconds; so the quiz carries its
   tempo, and the lobby shows it with the teacher able to change it.
   Owner's decomposition after the build: teacher's pace — they do their own
   countdown, narrated or none, full control; a safe countdown of 60 s, which
   might be boring; a fast countdown needs designed questions and a way for
   the teacher to adjust — a −5/+5 s pair during the run, persisting across
   questions, minimum 10 s, maximum 60 s — which keeps the lobby less
   cluttered than a length picker.
3. **Speed scoring** — energy for classes that want it.
4. **Hardening** — an open public instance: e.g. size limits, malformed
   archives, abuse of upload and sessions. Includes closing the door, which
   every comparable tool has: after the start only a few late joiners get in,
   a removed device stays out, and a class has a size limit. Open: automated
   vandalism from outside the class is realistic, and on the default pages.dev
   address nothing stops a script from spending the account's daily allowance
   for every class — the code can only bound what one quiz costs, which it
   does. The known remedy is a domain in front of the site with a rate-limiting
   rule at the edge, which the free plan includes; that reopens the no-domain
   decision.
5. **Avatars the students find interesting** — the design question, in the
   owner's words: how to make the avatars interesting to the students without
   wasting everybody's time or having fights break out. Random assignment
   scores very high on the last two and not perfectly on the first. Ideas,
   not rulings: pick from three, or customise; background shapes (hexagon,
   rhombus, square, star, heart, circle, a pond), hats, tools held to the
   side (lantern, staff, pitchfork, shovel).
6. **Spread, then key** — the reveal currently shows how the class answered
   and the right answer in one step; showing the spread first gives the
   pause-and-discuss moment the teaching moment asks for, and lets the
   teacher see a broken question before the key is on the wall. Plickers
   does it this way.
7. **Who has answered, on the wall** — a child wonders whether the tap
   counted; a mark on each avatar as its answer lands answers that from the
   projector, and the "n of 25" should not count devices that are away.
8. **The wall admits a second teacher device** — once the class has
   players nobody can take a free role, so a teacher whose phone died or who
   forgot to connect it before giving out the code steers from the wall for
   the rest of the lesson; review C expects this to be missed on day one.
   Owner's direction: dropping projector or remote already falls back to the
   one screen doing both, and that screen having a button to allow a second
   teacher device to join solves most reconnect issues; the edge cases need
   working through first — a second device rejoining might be "drop the
   missing projector or remote, allow a new one to join", or plainly "allow a
   remote or projector to join" if none was connected from the start. The
   usability problem: drops are rare and users aren't trained on it.

## v3 — Answers as images

"Which of these shows…" — and readers who are still slow.

1. **Image answer options** — the question is visual, so is the choice.
   Owner: will require an alpha channel — the current upload path flattens
   pictures onto white, which would foreclose it.
2. **Placement beyond the named layouts** — some content fits no layout;
   teacher-supplied layout would run in every student's browser on the shared
   site.

## Later — Paper and memory

The quiz is already made; it can be more than one activity.

- **Printables** — quick test on paper, answer sheet, review print to take home;
  not every lesson has devices.
- **Corrected quiz downloadable after the run** — the in-class fixes shouldn't
  be lost for the next variant.
- **Results export** — a teacher who wants to look again.
- **Localization**, one sub-item per language — teachers who don't read
  English, classes that should see the few labels there are in their own.
- **Formula rendering** — fractions, powers, equations on maths sheets; until
  then an image carries them.
- **Pictures for a teacher whose AI can't make a zip** — free tiers and some
  AIs may not crop figures and bundle them; e.g. attach and crop the photo in
  the lobby, or an AI-drawn figure inline in the pasted text.
- **Sound** — some classes want it; off by default, a mute on the projector.
- **Pairs and teams** — two children on one tablet already works as one
  player; whether "of 25" and the ranking read sensibly when twelve tablets
  stand for twenty-four children is unchecked, and team play is a mode of its
  own.
