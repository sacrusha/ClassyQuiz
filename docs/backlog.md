# classyQuiz — Backlog

Project → versions as goals → items that get picked, worked and delivered. Each
item names the problem it solves for the teacher or the class; the versions tell
the story of what comes before and after. Items get resorted, split and combined
as understanding grows. Last settled: 2026-11-03.

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
teacher needs, and the AI asks when the sheet's language and the ask's differ.
The measure is teacher time. The failure mode to
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
    works" is unverified and needs a more thorough test. Owner, on the step 1
    wording: no need to be overly specific yet; if Sonnet tests successfully
    on a free account the step says so, if not we adapt. The bullets
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
   Revised by v4 item 6: tempo moves from the quiz to the instance.
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

## v4 — Adoption: the first visit

The deliverable holds; what makes or breaks adoption is the landing page,
before anything else comes into play. Owner and product owner, 2026-11-03.

Pattern, for every item below: any claim about what an AI can do carries the
tier and the date it was tested — "free Claude Sonnet, tested 4 Nov 2026". It
is a qualifier and a trust signal at once. Never "the free version works",
never "about 15 minutes".

Delivery, in two steps. A — landing: the instance rendering (item 1), resume
(2), the foot-line problems (4) and the language step, plus the guidance merge
(5) and the after-upload flow (8); the guidance's account of a lesson is
written once, for the flow that ships with it, so the landing's resume line and
the teacher code are one story. Tempo text as the site works today. B — the
Tempo button, the points-for-speed switch (6) and the "upload is start"
lifetime (3); server-side. A is three implementers' worth and gets a review
before the owner deploys. In progress: the guidance merge on a branch; the
landing story in `docs/landing-story.md`.

1. **One instance, rendered: sheet → two turns → quiz → the class playing it**
   — between "Build a quiz" and "Run a quiz" a first-timer faces two obstacles,
   "how do I ask?" and "what even is a quiz?", and one concrete instance
   answers both: what the AI hands over *is* what the class plays, and the
   words that produced it are the how-to-ask. The forms are renderings of that
   one instance, so more than one can exist; not a closed list: a video; a
   static display of the input leading into the playable quiz as its
   deliverable; a carousel or slideshow. The sheet: the owner's real photos (a
   textbook's number-line pages, German, numbers to a million, photographed in
   hand) can't be published; they are in `.tmp/examplesheets/` for deriving a
   sheet of the same form, level, language and exercise shapes with other
   content.
   Built so far: the derived sheet and a real two-turn conversation with its
   quiz, in `.tmp/example/` (sheet/, run/, zahlenstrahl-quiz.zip), run for four
   languages — German, English, French, Italian — each needing the language
   named in the ask. Owner: the renders stand; they print and photograph once
   the sheet is final; "5. Klasse" stays (the real sheet is Swiss 4th grade,
   close enough). The example is maths, readable across languages; the one
   barrier for a non-German reader is the German ask, so the rendering cycles
   the same sheet and the same ask through languages, each producing a quiz in
   that language.
   Finding: on a complete ask Claude delivers at once and asks nothing back, so
   the page must not promise a dialogue; the second turn is where the teacher
   shapes the quiz. Finding: the page contradicted itself on quiz language —
   landing step 2 "write in the language the quiz should be in" against the
   guidance's "language of the material unless the teacher wants otherwise"; an
   English ask on the German sheet gave a German quiz, correctly by the
   guidance. The owner's rewrite (item 5) settles it: the quiz is in whatever
   language the teacher needs, and the AI asks rather than guesses; the landing
   step must say to name the language.
   The four runs were made on the old guidance and are redone once item 5
   settles. Real transcripts are edited for visuals only — they are walls of
   text — never in content. The owner's own earlier exchange (plaintext era,
   saved at `docs/drafts/example-exchange-2026-11-03.md`) shows the shape to
   aim for: an ask by exercise numbers, and a closing that names the typical
   errors behind the wrong answers and offers a second set for a parallel
   class.
   Owner's reaction to `docs/landing-story.md`, 2026-11-03. One story must
   work on a desktop and on horizontal tablets as well as on vertical phones:
   the sheet recognizable as a sheet, readability on a phone may suffer, and
   phone variants such as clickable or scrollable are allowed. DE·EN·FR·IT
   translates the block above About; About is for the AI and stays English;
   the switch sits top right, like on 99% of pages. "Try the example" opening
   as host is likely overwhelming — they just want to see the questions. The
   classroom interaction still needs visualizing: the job of a South-Park-ish
   2D video, from the owner's storyboard project (agents working on purpose
   and situation, after-action reports distilled into Grundsätze), fed the
   real screens once the stills exist, and never autoplaying on the root.
   How the page addresses teachers, in the owner's words: commands only for
   what must be done ("Ask it" is one; advice on how follows well). "Send
   your AI photos" and "Tell it what to change" are commands nobody must
   follow. "It hands you the quiz and says what's in it" isn't necessarily
   true — not how you address users. "Choose any good AI" is milder than
   "Use a"; then detail: a link beats naming tiers, a dated test statement
   beats both. A personal frame is possible: "I typically use paid Opus;
   expect paid Gemini or ChatGPT to work just fine."
   Landing story draft 2 is in `docs/landing-story.md`. Still with the owner:
   the video brief (§5); the own-copy thresholds and the network help at
   failure points are resolved by item 4. Owner on the example quiz, which
   revises "Try the example" above: both humans and AIs learn a format through
   a prototype — the txt example in the manual for the AI, the example ask in
   Build for the teacher; each carries weight where it is. A human-facing "see
   the questions" is a proxy for what a quiz is, and once the storyboard exists
   it duplicates it toward noise.
2. **Resume, from purpose** — item 17 was built as a feature (list, count,
   fold, "closes", delete) without a defined purpose; the questions come
   before the implementation. Who resumes: the device that started the
   quiz. When: during that lesson — tab closed, laptop slept, lesson
   interrupted, or the teacher uploaded on the phone and stands at the
   laptop. What they need: the way back, and certainty it's the right quiz.
   An open quiz is one this device started that hasn't reached its final
   ranking; shown: the title, where it stands, the code — the way back from
   another device is `/teacher` + code, which the page doesn't say. Only the
   latest. Not shown: when it closes, delete.
   The landing stops offering resume at the final ranking; the server keeps the
   quiz an hour past it, so a tablet reloaded to see its place still finds it
   (item 3).
3. **Upload is start** — owner: "uploaded the evening before" is not real;
   the parallel class's quiz is its own quiz, started by its own upload. A
   quiz is one class's lesson. This revises the lifetime decision's patterns
   and what was built on them: the 48 h instance with several runs, "Again
   with another class" (its one hidden value, carrying in-run key fixes,
   belongs to the Later item "corrected quiz download"), "closes" on the
   landing, and Delete there duplicating End at the ranking. The landing
   page doesn't wait for the server-side simplification; an implementer
   sizes it.
   Sized 2026-11-03: small to medium, mostly removal — the `again` command, the
   lobby reopened an hour after the ranking, "closes" and Delete-by-title on
   the landing, tempo carry-over between runs; game logic, scoring and the
   connection code untouched. The one decision is the new lifetime: never end
   at the final ranking (an interrupted lesson, a tablet reloaded to see its
   place) — the ranking plus the existing one-hour keep, or idle; the 3 h
   class-idle ceiling in `limits.ts` is the number to check. Lost until
   "corrected quiz download" ships: a key fixed in class dies with the quiz.
4. **The foot lines from the teacher's side** — both serve real purposes
   but speak for the site. Own copy: the teacher's question is "I'll run
   20–30 a month, whenever I need to; can I rely on this?" — this site can't
   promise it, and there is something they can do proactively. Not a
   first-visit question; its moment is after the first success, or on a
   return visit. Network check: the upload proves HTTP, the lobby degrades
   to HTTP by itself, a tablet joining the lobby is the tablet-side check —
   on the day the site checks itself. What `/check` uniquely has is the
   failure explanation, "it's the network, tell IT this", which belongs
   where the failure shows. Placement not yet confirmed by the owner.
   Owner on the own copy: knowing it can and probably should be self-hosted is
   important, but realistically first-time viewers won't read, unless the site
   is close to running out of quizzes and tells them. Needs a design assessment
   focused on the problem, not the solution — part of the landing story.
   Resolved with product-owner defaults, the owner to adjust: the own-copy line
   shows only on a device that has uploaded before and only once the site has
   been full at least once in the last 30 days, stating the fact ("full on N
   days this month"); the exact thresholds are the implementer's to size.
   Network help at the failure points as the landing story has it — the lobby
   after about 90 s with nobody joined, the upload error, and a part of
   `/check` readable at home — is accepted. The video brief (landing story §5)
   stays with the owner.
   "Your AI does it" and a number serve one purpose — it's not scary, you can
   do it — and are only true if the AI a normie has can do it; setting up a
   local environment is almost impossible for a normie without AI. The check
   that gates the own-copy wording: free Claude, through its own sandbox,
   from the own-copy prompt to a copy online. If yes, time it and state it
   dated. If not, no number anywhere — people with a paid AI derive it from
   theirs — and own-copy says who can: someone with an AI that runs
   programs, or a colleague by hand from the README. It needs the free
   account the owner expects; the agents prepare the protocol so that it
   costs one sitting.
5. **The guidance, the owner's rewrite** — the lower section of the page,
   verbatim at `docs/drafts/guidance-rewrite-2026-11-03.md`: About, the manual
   for the AI, what informs the quizzes' shape, how quizzes are built, and
   "Build with the teacher", which is item 11's part 4 taken over by the owner
   (take in what's provided, then a short summary of what you got and what you
   still need, not a wall of text; previews from the layout page where the
   tools allow; a teacher who frontloads everything wants delivery). It is
   based on a version before pictures as answers. The merge reconciles it with
   what's built: pictures as answers and the pictures guidance; the limits (120
   pictures, not 60); the Remote fading after 45 s; "a question number with no
   text" to verify against the parser; the lifetime figures follow item 3; the
   Tempo paragraph follows item 6 — the live page must describe the live site
   at every deploy. Structure and detail kept, wording free.
   Owner's notes on the merge, 2026-11-03: the bare question number was a
   feature mixed in prematurely — dropped; a few words are enough when
   pictures carry the question. The "Any language" passage is the just-ask
   instruction — "if the exercise language and the request language pull in
   different directions and don't resolve cleanly, just ask" — not named
   cases: AIs use location and memory to resolve, there is no exhaustive
   list, and detail breaks things. "About 15 minutes" is out until tested.
   The 2026-11-02 decision "Guidance page is information, not instruction"
   was a rule read as a rule; its purposes are two — not tripping injection
   guards, and no pointless prescription — and a well-marked example of
   using an AI trips no guard.
   The standard the owner set on the merge: the guidance says only what the
   reading model can't already know; "all the useful advice derived from model
   knowledge the reading model already knows" went (4311 → 2266 words). The
   Manual section's human-facing job is only "there are no secrets, it's not
   magic, you're allowed to look", so it reads dense. Branch `guidance-merge`
   at e93954f, tests pass; one partial-ask sample still asked before building
   after the cut.
6. **Tempo, in the instance** — owner: `Tempo:` on the quiz's definition is the
   wrong place; the mode, the pace and whether speed scores belong to the
   instance, chosen in the lobby. The solution to beat before any complexity is
   justified: an "end question in 15 seconds" button on each question — the
   teacher's pace by default, the energy moment when the teacher chooses it,
   and the teacher's eyes on the answered avatars replacing the AI's prediction
   of difficulty. `Tempo:` and `Time:` leave the definition. Per-question hints
   ("needs more time", "less") stay parked until a teacher asks for them:
   reading load is derivable from the text and a picture, only load beyond
   reading is the AI's alone, and if ever, relative, never seconds. Points for
   speed survive as a lobby switch; its reference time (answers shown?) is the
   implementer's to size. The existing countdown code is the subset the button
   needs — good enough to forge from.
8. **After upload** — the flow from upload to Start, designed in
   `docs/after-upload.md` (draft 5 is the design). Owner's
   decomposition: opening a quiz has two uses — run through it in the real
   environment; start it, get people to join, set up — not exclusive; a quick
   check that it's the right version of the right quiz is value for the second
   and captures most of the first. Setup steps, some perhaps more complexity
   than value: check it's the right quiz, spot fix, set presenter and remote
   roles, advanced config (tempo now, others later), show the join code on the
   big screen, know whether pupils are joining and at what rate, know when
   everybody is ready, start. A new user doesn't yet think about remote and
   projector and must be taught efficiently with low friction. Teachers differ:
   some join the remote on the last screen in parallel with the students, some
   set up before students are involved.
   Sharing and not sharing a screen is a button press — every teacher uses the
   laptop for shared and unshared sections — so a private check screen exists;
   the exception is big all-in-one touch screens, out of scope. "/teacher is
   clunky"; a dedicated teacher code, two digits longer, typed in the same box
   as the students', serving both workflows: all on the phone (snap hand-drawn
   notes, AI, zip, open, then connect the projector) and all on the laptop that
   serves as projector or hybrid. Second-screen detection is unreliable and
   would need to add real value: phones and Miracast, laptops gaining the
   screen after the check, window size versus screen size, tablets in between.
   A child reading the teacher code off a shared wall: the teacher is in the
   room, a teachable moment; otherwise start with the projector off or from the
   remote — if they don't, they will next time.
   Closed, draft 5. The owner's purpose for connecting the remote: easy to go
   right, hard to go wrong. Hardening against outside attackers and 14-year-olds
   writing automated scripts is real; the same 14-year-olds inside the
   classroom won't be stopped from disrupting class by a random key — "they can
   just steal the projector's power plug". So the teacher code is the class code
   plus two digits, and a device that tries many codes in seconds is refused for
   a while — to be done anyway. Shape: private check screen first (questions,
   the second-device steps, the speed switch, the code small), one tap to the
   join screen; a device arriving with the teacher code gets one plain-words
   question — show here or steer here — only when the one tab already there
   does both; nothing sensed decides a role. One tap on the second device, in
   plain words, is fine: by then the user knows projector and remote and which
   this device is, and a misclick is recoverable by ⇄ Swap on either device.
   Start's label: "Start quiz ▶" everywhere that steers — the owner's words
   from item 19; the mode is named where the choice is. `/example` is the check
   screen without codes, linked from the landing strip only until the
   storyboard video exists.
9. **Avatars: celebration, the lion's mane, tools** — student feedback:
   celebrating avatars, winners only, after every question; jumping seems
   easiest; at least ten winners easily distinguishable, crowding allowed
   beyond that if required. Bug: lion on a star — the star's colour is hard to
   see because the mane is bigger than the shape. Tools: not built;
   `docs/avatars.md` recommended against (1–2 px wide at wall sizes, floating
   beside a head without paws; the balloon and the lantern survive as blobs)
   and left the call to the owner, still open.
   Winners jump after every reveal, including the ones where most of the class
   got it right; that they are then hard to make out is accepted.

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
- **Runs by itself** — design item, moved here from v4 item 7. Not core
  purpose, but value: the quiz carries on while the teacher's hands are
  elsewhere — a student who needs them, the next thing to set up, a small
  group — teacher in the room, not steering. Needs a cadence with nobody
  pressing (show, close, votes, key, next; votes-then-key may collapse to one
  step), a close rule per question — the wall can watch instead of the
  teacher: close when everyone present has answered, or some seconds after the
  last answer, with a cap — and a way back: any press by the teacher makes it
  manual. Limit: nobody reads aloud, so it is for classes that read for
  themselves; an option, never the default. Lives in the instance beside pace
  and points for speed; shares the clock machinery with v4 item 6 so neither
  forecloses the other. Owner: the cheap version — closes on the last
  student's answer or max time, with fixed, generous durations for the result
  pages — messes with deliberate pauses, so a proper design item rather than
  a quick build. The Tempo implementer (v4 item 6) doesn't foreclose it.
- **Pairs and teams** — two children on one tablet already works as one
  player; whether "of 25" and the ranking read sensibly when twelve tablets
  stand for twenty-four children is unchecked, and team play is a mode of its
  own.

## Open decisions and checks, at the close of 2026-11-03

With the owner:
- Standing authorization for implementers' branches and merges to main,
  the owner's rule: commit in meaningful, likely working units, no churn
  commits, and squash what slips.
- The free-tier test waits until the landing and guidance pages are settled:
  every fetch from claude.ai restarts the fetch cache's clock on whatever the
  page is that day. Until then, no fetch tests of the live root.
- v4 item 4: the own-copy and network-help defaults, to adjust if the owner
  wants; placement of the foot lines follows the landing story.
- A domain in front of the site, so a rate-limiting rule at the edge can
  stop a script from spending the day's allowance; the free plan includes one
  such rule, and a name children can type beats pages.dev on the slowest step.
- The landing page's step 1: what it says about which AI, now that "the free
  version works" is unverified; not to be overly specific yet — it says
  Sonnet works on a free account if the test succeeds, otherwise we adapt.
- The free-tier test: a logged-in free Claude account producing a working zip
  with pictures; the zip it produces is the artifact to keep. The owner
  expects access to someone else's free account soon, and won't make their
  own, to avoid a ToS hammer.
- The free-tier setup check (v4 item 4): free Claude, through its own
  sandbox, from the own-copy prompt to a copy online; it gates the own-copy
  wording and any number. Same account, same sitting as the test above; the
  agents prepare the protocol.

Needs a real classroom or real devices, nobody has run it:
- Android tablets and phones: the file picker with a zip, a killed browser tab
  bringing back its role, the bar and the answered avatars from the back row,
  −5/+5 during a countdown, whether children dress their avatars.
- The school's Wi-Fi, through /check.
- The platform's wording when the free allowance is spent.

Done since the first deploy, all live: the redesigned teacher flow with one
code per quiz and roles per tab, pictures on the screens and as answers,
shuffled answers with Order: fixed, hardening for the free plan, countdown and
points for speed with the quiz carrying its tempo and −5/+5 in the run (revised
by v4 item 6), votes
before the answer, answered avatars on the wall, a second teacher device from
the wall, avatars the children dress, the landing page by attention budget,
zip only, and /own-copy. Left in Later: printables, corrected quiz download,
results export, localization, formula rendering, pictures for a teacher whose
AI can't make a zip, sound, pairs and teams; v3 item 2, placement beyond the
named layouts.

