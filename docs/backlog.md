# classyQuiz — Backlog

Project → versions as goals → items that get picked, worked and delivered. Each
item names the problem it solves. A built item points to the design file that
holds its purpose and situation (`design/<file>.md`); what is still open stays
in its item, and what needs the owner or the field is in the list at the end.
What is deployed: `deploy-log.md`.

## Project

A teacher has an exercise sheet and wants fifteen minutes of fun practice on
exactly that content. Existing tools fail on authoring time: their AI hands
the teacher a starting point to fix by hand in a slide editor; premade content
fails on topic. The product is the path from someone's material to a quiz
being played — run by a quizmaster for a class or another group, among
friends with nobody running it, or alone — and the measure is the asker's
time. Plausible assumption: the quiz is often
made in the ten-minute break before the lesson, with the teacher's own AI, and
used once (so the format is checkable in seconds and the run is the review:
`design/quiz-format.md`, `design/question-flow.md`). Plausible assumption: the
material arrives as a few photos taken with a phone, or as a document or PDF
on a laptop, and the teacher may be on either device. Any age group,
including settings beyond school with adult participants: the site offers the ways to play by name,
Solo, Peers and Quizmaster, and the classroom is a Quizmaster's quiz (v5).
The design files' example class is a Swiss German-speaking
primary class: a school-issued laptop on the projector, Android tablets for
the kids, the teacher's phone as remote, an AI account that may be a free one,
students who may read slowly or not read English at all, and the teacher in
the room; what the design files say of
children and the room is said of it. The guidance to the AI is in English,
which AIs are trained on; quizzes come out in whatever language the asker
needs. The failure mode to design against is a normal user who can't use it, not a
malicious one: a disruptive student is handled by the teacher walking over to
the tablet and taking care of the student. Children actively and openly
sabotaging the class while in class is not a technical problem that needs a
technical solution. Plausible assumption: children automating a denial of
service from outside the class, to vandalise while in class or to vandalise
another class's quiz, is realistic (so the site bounds what one quiz costs,
v2 item 4).

## Constraints

Hold for every version; not picked as work.

- **Nothing public, nothing kept beyond its use, nothing identified** — data
  protection, and the own-classroom copyright exception for quizzes derived
  from published material. A quiz sent to the site lives there for the
  lifetime of its room (v4 item 3); the teacher's file on disk is the durable
  copy.
- **Survives school Wi-Fi** — connections drop, phones go to sleep, a device
  dies mid-quiz, and the lesson must go on. Failure in front of the class ends
  adoption. A deploy or a Durable Object restart in the middle of a run is the
  same situation from the server's side.
- **Hosted on the owner's Cloudflare account** — a teacher's laptop can't be
  relied on to be reachable over school Wi-Fi. Monetization is not a concern of
  the project, so the shared site runs on the Free plan, designed to stay
  within its limits for a few users, and usage limits nudge heavy use toward
  self-hosting, on Cloudflare or another provider. The README promises that an
  AI can set up one's own instance from the public repo.

## v1 — One real teacher runs one real quiz their AI made in the break

Text-only multiple choice, up to four answers, press the right one.

1. Quiz format a teacher can check in seconds and an AI writes reliably, with a
   wrong key fixable in the text or by telling the AI — built, `design/quiz-format.md`.
2. Getting the AI's quiz onto the site, as one archive — built,
   `design/root-page.md` ("Opening: the `.zip` and nothing else").
3. Three audiences in one session (class at the projector, teacher on a small
   screen, students on their own) — built, `design/teacher-devices.md`.
4. Joining, 25 kids inside a minute on shared tablets with nothing installed —
   built, `design/class-and-wall.md`.
5. Students on the big screen in a way that is fun, exposes nobody and stores
   nothing about them — built, `design/class-and-wall.md`.
6. Teacher-paced flow, no clock pressuring the teacher — built, `design/question-flow.md`.
7. Answering on a small screen with colour-coded answers and correctness
   scoring — built, `design/question-flow.md`.
8. Ranking, intermediate and final, with closure for slow readers — built,
   `design/class-and-wall.md`.
9. Fixing a question during the run (skip, void, change the key, let another
   answer count; any number of answers right) — built, `design/question-flow.md`.
10. Upload from one device, run from another, nobody has an account — built,
    `design/hosting-and-limits.md`.
11. Guidance page: an AI told only the site's name understands what the site is
    for, what quizzes are for, how they're built, how to build them with a
    human — built, `design/guidance-page.md`.
12. Preview as the class will see it — Solo on the projector's laptop lays
    every question out as the wall would (`design/solo.md`, "Preview and the
    projector alone"); whether that is the preview teachers want is unconfirmed.
13. Validation errors the teacher can hand back to the AI — built, `design/quiz-format.md`.
14. Self-hosting nudge, the free plan serving a few users — built as `/own-copy`
    and its landing line, `design/root-page.md`.
15. An answer that looked in time counts, whatever the race between reveal and
    tap — built, `design/question-flow.md`.
16. The landing page lands the teacher within seconds, with the sentence for
    their AI, two things to do (start a quiz, join a quiz) and an honest
    expectation of the conversation — built, `design/root-page.md`; the first
    visit goes on in v4.
17. Coming back to a quiz from the teacher's side — built, `design/root-page.md`;
    reworked by v4 item 2.
18. One code per quiz, roles picked per tab, a device that drops reconnecting
    with its role, and the freed control role takeable — built, `design/teacher-devices.md`.
19. The view after upload makes it easy to tell it's the right quiz — built,
    `design/teacher-devices.md`; reworked by v4 item 8.

## v2 — Figures, tempo, and a hardened instance

Most sheets have pictures; some classes want energy; an open instance gets fed
garbage.

1. Image per question (figures are the exercise) — built, `design/pictures.md`.
   Open: what the guidance tells the AI makes a picture work on the wall — a
   tight crop, how wide and square figures land, what the back row can read,
   nothing from the sheet's solutions or a pupil's name in the crop.
2. Optional countdown for classes that want game-show tempo — built, then
   replaced by the steering bar (v4 item 6), `design/question-flow.md`.
3. Speed scoring — built as a switch, `design/question-flow.md`.
4. Hardening an open public instance, including closing the door — built,
   `design/hosting-and-limits.md`. The code bounds what one quiz costs; a
   script spending the day's allowance for every class can be stopped only at
   the edge, by a domain in front of the site (open list).
5. Avatars the students find interesting, without wasting time or fights —
   built, `design/class-and-wall.md`.
6. Spread, then key: the pause-and-discuss moment before the key is on the
   wall — built, `design/question-flow.md`.
7. Who has answered, on the wall, so a child knows the tap counted — built,
   `design/question-flow.md`, `design/class-and-wall.md`.
8. A second teacher device from the wall, for a dead phone or one never
   connected — built, `design/teacher-devices.md`.

## v3 — Answers as images

"Which of these shows…" — and readers who are still slow.

1. Image answer options (the question is visual, so is the choice) — built,
   `design/pictures.md`.
2. **Placement beyond the named layouts** — some content fits no layout;
   teacher-supplied layout would run in every student's browser on the shared
   site. Not built.

## v4 — Adoption: the first visit

The deliverable holds; what makes or breaks adoption is the landing page,
before anything else comes into play (owner and product owner).

1. **One instance, rendered: sheet → two turns → quiz → the class playing it**
   — between asking an AI and opening its quiz a first-timer faces two
   obstacles, "how do I ask?" and "what even is a quiz?", and one concrete
   instance answers both: what the AI hands over *is* what the class plays,
   and the words that produced it are the how-to-ask. Owner: both humans and
   AIs learn a format through a prototype — the txt example in the manual for
   the AI, the example ask on the root page for the teacher. The forms are
   renderings of that one instance, so more than one can exist; not a closed
   list: a video; a static display of the input leading into the playable
   quiz as its deliverable; a carousel or slideshow. Built: the film
   (`design/root-page.md`, "The film"; `docs/film/`) and the worked example
   (item 10). Open: the film's pace for the teacher who has decided and wants
   the steps (`docs/film/README.md`, "Not known").
2. Resume for the device that started the quiz, the way back and certainty it's
   the right quiz — built, `design/root-page.md`.
3. **Upload is start** — owner: "uploaded the evening before" is not real;
   the parallel class's quiz is its own quiz, started by its own upload. A
   quiz is one class's lesson; the site is a runner, not a store of quizzes.
   Built: one class per upload, its final ranking and Exit
   (`design/class-and-wall.md`, "The final ranking"; `design/question-flow.md`,
   "The steering bar"), and the lifetime (`design/hosting-and-limits.md`,
   "What lives, and for how long").
4. The foot lines from the teacher's side — own copy for the teacher who will
   run 20–30 quizzes a month and asks "can I rely on this?", network help where
   the failure shows — built, `design/root-page.md` ("The own copy", "Network
   help, where failure shows"). "Your AI does it" and a number serve one
   purpose — it's not scary, you can do it — and are only true if the AI a
   teacher has can do it. The conversion to a school's own server is the
   school's: `design/hosting-and-limits.md`, "A copy on a school's or
   company's own server".
5. The guidance, the owner's rewrite merged — built, `design/guidance-page.md`.
6. Tempo in the instance, in the teacher's hand: a bar of two buttons (Play,
   Countdown) stepping the question through its states, and the teacher
   screens' words (choices, answers, solution; nouns on Play) — built,
   `design/question-flow.md`. Follow-ups are in the open list.
8. The flow from upload to Start: a private check screen, a teacher code, roles
   in plain words — built, `design/teacher-devices.md`.
9. Avatars: celebration, the lion's mane, tools — student feedback:
   celebrating avatars, winners only, after every question; at least ten
   winners easily distinguishable. Built (winners' band, lion's mane),
   `design/class-and-wall.md`. Open: tools beside the animal in the
   children's own register. The row built with v5 item 4 is the office's,
   for the adults, and doesn't answer this wish; the examples on record are
   v2 item 5's, a lantern, a staff, a pitchfork and a shovel, of which only
   a blob such as the lantern survives the bar's sizes
   (`design/class-and-wall.md`, "Dressing the avatar"). Also open: whether
   four seconds is long enough for a child to find themselves;
   the weak spot is a short question beside its picture, where ten winners come
   out small because the key stays visible.
10. **The worked example, behind one link** — built, `design/example-page.md`:
    `/example`, "The example, step by step" from the link under the landing's
    film, in the landing's four languages (item 12). Open: whether a run of
    the owner's replaces the example's run, and whether the quiz's growth
    past the asked ten is worth leaving in the picture
    (`design/example-page.md`).
11. **What a Sonnet-at-medium test (2026-11-04) misread** — the address read
    as a publish target, answer pictures lost on their tile's colour, every
    picture taken as enlargeable — met in the asks and the guidance:
    `design/root-page.md` ("How to ask"), `design/guidance-page.md` (Not
    known), `design/pictures.md` ("Enlarging").
12. **The worked example in the landing's other three languages** — built,
    `design/example-page.md`: the page, the conversation picture (light and
    dark) and the quiz in de, fr and it, the English run translated so the
    example is the same in each, as the page says. Open: the translations are
    drafts (`docs/example/text.py`, the page's
    words in `client/example-text.ts`, the quizzes in
    `docs/example/quiz_zips.py`); the choices are
    `docs/translation-review.md` E1–E5.
13. **The example's upload as a special case**, e.g. not booked against the
    free site's caps, or kept ready instead of uploaded per click. Only with a
    test set that runs the same `.zip` through the special path and the normal
    upload and fails when they differ, so the example can't drift from what a
    teacher's upload does. Looking at the example costs nothing
    (`design/local-check.md`); opening its lobby is a normal upload, counted
    as one.
14. **One product, made on purpose** — the teacher deciding whether to rely
    on the site in front of a class meets the same name, mark, paper, ink and
    type on every page.
    Built: the top-hat fox and favicon everywhere, the shared header, one
    stylesheet for the look, Rubik for the site's own words, ink controls,
    the ranking's bars on tracks, the README's title and picture, the logo
    kit in `docs/brand/`, `design/identity.md`. The owner's "one-line descriptor by
    the logo, what classyQuiz is, as a statement" is the root page's first
    sentence, built with v6 item 1 (`design/root-page.md`, "What this is"). Open, the owner's words: the next
    step for "This file is not a readable .zip archive.", which lacks one
    where its neighbours have it. Open, beyond the identity: the logo kit's
    web manifest and theme colours, which make the site installable as an
    app (its icons would be renders of the kit's paper tile,
    `docs/brand/web/touch-icon.svg`); a keyline on the raster icons for a dark
    tab strip, needed only by browsers that don't take the SVG icon; the
    kit's link-preview card, which no page names yet.
    Open: the empty join screen's right half stays blank until children
    join; on a real washed-out projector the pale states (hidden answers,
    faded tiles at the reveal) may let pale red and pale yellow run
    together — unchecked.

15. **Running classes finish** — a teacher whose class stops mid-quiz because
    the free plan ran out doesn't come back. Built:
    `design/hosting-and-limits.md`, "Running classes finish"; what the
    booking now meets: "Room on the Free plan", item 3.

16. **Quiz-building sessions more interactive**, on the models that make use
    of what the site provides (Opus 5.5 does: the chess run,
    `design/guidance-page.md`) — the teacher sees the draft, pictures
    included, beside the conversation, says what needs work, and sees the
    correction. Built: the guidance page's two presentation kinds, high
    density (a layout in a short notation, and `/preview.py`, which draws it
    from the zip as one picture) and high fidelity (`/layout`).
    Open: an element that previews a zip on the device and edits it in local
    state, before the lobby and on any page that can hold it, handing back
    the zip; checking the look on an average projector, on an improved
    version of the preview after upload (v1 item 12).

## v5 — Playing the quiz, redefined

People had to understand classroom quizzes before they could use the site: it
presented one way to play, the projector with the teacher's phone and the
students' devices, and a newcomer had to grasp it before anything else. The
file the AI makes is independent of that way, and the person who asked for
the quiz need not know its answers, so a quiz is also for playing alone, with
friends (where whoever brought the quiz plays too), or for a crowd someone
runs. Plausible assumption (the
owner's, 2026-11-08): people think in use cases, not capabilities — so the
site offers entries a person recognises before knowing any setting, named by
the owner **Solo** (you play the quiz on your own, for learning or review),
**Peers** (play with friends, the quiz runs on its own) and **Quizmaster** (a
host running the quiz for a crowd), on the check a quiz opens into
(`design/local-check.md`). Underneath, Solo is the browser alone, nothing
uploaded; Peers and Quizmaster are the one room, running on its own or by a
hand; the classroom is a Quizmaster's quiz, and nothing built was undone.

1. Looking at a quiz, or playing it alone, doesn't cost the shared site a
   class: the zip is read and checked in the browser, the entries are offered
   there, and opening a room is the upload — `design/local-check.md`.

2. Solo: a learner practises or reviews alone, without having seen the
   answers, the solution after each one, the run copied for their AI at the
   end — `design/solo.md`.

3. Peers: friends play together with nobody running it, whoever asked for
   the quiz among them; the room moves on once everyone present is done —
   `design/peers.md`.

4. Quizmaster: a host runs a quiz for a class or any other crowd; the lobby
   asks how the screens are arranged, the remote's how-to shows only where a
   remote is wanted, no screen names a role, and the avatars let a wider
   audience use the site, a business or training room among them, through
   each adult's own look: the bowler and the bow tie beside the top hat, and
   the office's things, in the one menu — `design/teacher-devices.md`
   ("How the screens are arranged", "Words for any crowd"),
   `design/class-and-wall.md` ("Dressing the avatar"). Devices only, a room
   with no wall, isn't offered; why, and what would make it cheap now:
   `design/teacher-devices.md`.

5. Whoever asked the AI for the quiz plays it without having seen the
   questions — what lets a quiz be played by its own maker: the guidance's
   "When the user will play the quiz" and the local check's fold —
   `design/guidance-page.md` ("The user who plays"),
   `design/local-check.md`. A quizmaster doesn't play: the guidance says
   so, and has the AI ask a user who will host and play which they mean,
   Peers or Quizmaster. Open: whether AIs keep the questions out of the
   chat, ask, and report enough without naming a question; no run since
   the page says it.

6. **The room's screens aren't the classroom's.** A table or a call has no
   big screen; a call may share a window as one; a class may have a projector
   and no student devices. The device screen — the question, its picture and the tiles
   on the player's own device, then the key — is built with Solo
   (`design/solo.md`, "The device screen"), and a Peers room stands on it
   (`design/peers.md`). Open: a Quizmaster's devices-only room; a wall in a
   Peers room, a family at the TV; whether the guidance should say where a
   quiz will be read.

7. Nobody has to steer — Peers' side: everyone ready, the question closing
   once everyone present has answered and the next coming once everyone is
   done with the solution — `design/peers.md` ("Nobody steers"). It rests
   on a few friends waiting for each other, which, a plausible assumption,
   a class of 25 doesn't; a quizmaster whose hands are
   elsewhere is Later, "Runs by itself", whose cadence design is still owed.

8. **Players at their own pace** — a race: fast players don't wait, slow ones
   don't hold the room. Not pursued: it serves a classroom's throughput, not
   v5's widening. Open: in a classroom,
   whether the tail of the field is shown (`design/class-and-wall.md` shows
   winners only).

9. A visitor who isn't a teacher, and an AI asked for a quiz that isn't a
   lesson's, recognise themselves on the page, the example class's teacher
   still served first: the word decided once (`design/root-page.md`, "Words
   for whoever comes"), the three ways on the root page, a picture each, by
   the names the check's cards carry and a few words in the visitor's
   language (`design/root-page.md`, "The ways to play"), the guidance describing the three
   ways and where each reads a question (`design/guidance-page.md`), three
   more example asks, and the film showing the
   check and the lobby as built (`docs/film/`). Open: the de/fr/it drafts
   (`translation-review.md`, "The first page in German, French and
   Italian", E6); whether someone
   who isn't a teacher reads the page as theirs, which nobody outside the
   project has tried.

Out under the lifetime as decided (keeping serves rejoining a quiz in
progress: `design/hosting-and-limits.md`, "What lives, and for how long"): playing at different times — each at home when they like, a
leaderboard that waits — needs a quiz kept for days, which nobody has asked
for. Named, not pursued: tests, in class or self-administered.

## v6 — The first visit, in one look

The page a visitor first meets has to tell them, as it opens, what this is,
whether it is for them, and that an AI's file becomes a played quiz; and it
has to leave little in the way of whoever comes with a file and of the
newcomer who wants to find out more (`design/root-page.md`, Purpose). The
page built for item 1 does, in one column (`design/root-page.md`, "How the
site meets it"). What the owner found while directions were tried is in
`design/root-page.md`, Situation.

1. **The page as a whole** — a visitor at a phone or a desktop gets the
   Purpose's first two things from the page as it opens, and whoever holds
   a quiz file opens it without hunting. Built: `design/root-page.md`, where
   "One column" says what shows as the page opens in which window. Open:
   on a phone's window of 360 × 640 the button that opens a file is cut by
   the screen's edge in German and French, and on a smaller one it is
   below the edge, since the ask stands above it; and what nobody has
   tried (same file, "Not known"). The parts,
   each with a purpose of its own:

   a. **What this is, in words** — someone who reads one sentence knows
      what the site does for them. Built as the page's first heading
      ("What this is").

   b. **Whether it is for me: the ways to play** — a visitor recognises
      their own case and a reason to play it, and later recognises the
      check's cards, which are named Solo, Peers and Quizmaster
      (`design/local-check.md`). In words and in pictures; the pictures
      are made (`docs/ways/`). What the three differ in is the setting
      and what a device shows: with a quizmaster the question is on the
      big screen and each player's device shows the choices; among friends
      and alone each device shows the whole question. Built ("The ways to
      play"): the three pictures side by side with each way's name and
      setting; a reason to play is in the pictures and, in words, only
      Solo's.

   c. **Getting a quiz** — a visitor learns that the AI they already use
      makes the quiz, how to ask it, and that a file comes back; someone
      who wants to see it done finds an ask close to their own case. The
      asks exist, six of them, with what each is for
      (`design/root-page.md`, "Two steps"); what the page may say
      about which AI manages it is what was verified
      (`design/guidance-page.md`, "The AIs verified against"). Built: one
      ask and the file it brought in the first screen ("Two steps"), the
      AI, the address and the six asks below it ("How to ask").

   d. **Opening a quiz** — whoever has the file opens it; whoever has
      none yet can play the example, which costs the site nothing until a
      room opens (`design/local-check.md`). A quiz to come back to and
      whatever goes wrong with a file show here
      (`design/root-page.md`, "Two steps", "Opening: the `.zip` and
      nothing else", "Coming back"). Built: the box as the second step,
      the example's line under it, a file's problems between the two, and
      a quiz to come back to above everything on the page.

   e. **Finding out more** — the newcomer who wants more than the page
      shows as it opens: what a room does over time, what playing is
      like, the whole conversation with the AI. The film and `/example`
      exist for this (`docs/film/`, `design/example-page.md`); the film
      was made to be the top of the page and tells the classroom's story.
      Built: the film under the first screen, under a heading that says
      what it shows, with the link to `/example` ("The film"); playing the
      example is in the second step.

   f. **Where the page for people ends** — a person knows what they can
      rely on (free, open, no accounts, how long a quiz is kept) and that
      what follows is the manual for AIs. Built ("Where the part for
      people ends").

2. **The page in its four languages** — a visitor reading German, French
   or Italian gets the same page, not a translation of the English
   sentence structure: the owner's findings on pronouns and on the
   visitor's side of the words hold in each language
   (`design/root-page.md`, "Languages"). Built: every word of the page and
   its states in the three, in `client/landing-text.ts`; the choices behind
   the words, `translation-review.md`, "The first page in German, French and
   Italian".

3. **The film and the worked example show the page that exists** — the
   film types the ask and shows the root page with the box that opens a
   file, and `/example` walks the same path; once the page changes, a
   newcomer who watches or reads them sees the page they will then use
   (`docs/film/`, `design/example-page.md`). Built: the film draws the
   page's first screen in the page's language from the page's own sizes
   (`docs/film/README.md`, Situation); its words are held to the page by
   `npm test`, its layout is not (`src/DEVELOPING.md`, "The landing film").

## Room on the Free plan

The site carries the classes that use it within the Free plan and doesn't
take on complexity for a load nobody has; near what the plan carries,
donations could pay for hosting off it instead (`scaling-drawer.md`,
"Purpose"). What a class costs and what binds:
`design/hosting-and-limits.md`, "What a class costs".

1. **Answers and looks held in memory** — a class writes its input in
   batches, so rows stop binding first and the looks stop being a third of
   a let-in booking; a restart that the devices can recover from loses
   nothing they show — built, `design/open-period-in-memory.md`. Open: the
   reset of an instance still active five minutes after a deploy, which
   ends its sockets, seen only on a local stack (same file, Not known).

2. **What telemetry the project needs** — the limits, the capacity
   sentence on the landing, the caps and the drawer's ideas rest on figures
   nobody had measured; telemetry gives them without identifying anyone
   and without costing rows or requests — `design/telemetry.md`. Built:
   each device counts its own line and sends the count with what it sends
   anyway; a class becomes one summary at its settle; the days' records
   (31 days, then by the month for 24 months, problems by the day only)
   for the owner at `GET /api/site/use`, behind `OWNER_KEY`, read in a browser
   at `/owner` (`design/owner-page.md`).

3. **What a class holds, in line with what binds now** — no class under way
   meets a spent allowance, and most of the day stays usable (the owner,
   2026-11-10). The situation the booking meets (the costs per transport,
   which devices poll, who opens a lobby): `design/hosting-and-limits.md`,
   Situation. Built: the ledger in rows, requests and awake time, a lobby
   nobody joins giving its booking back, the uploads' cap in rows
   (`design/hosting-and-limits.md`, "Running classes finish"). Open: the
   lifetime of a lobby left waiting, and the stored bytes against a wave of
   looks at the room.

## Later — Paper and memory

The quiz is already made; it can be more than one activity.

- **Printables** — quick test on paper, answer sheet, review print to take home;
  not every lesson has devices.
- **A class without devices** — answers on cards the children hold up, read
  by a camera with AI recognition (the owner).
- **Corrected quiz downloadable after the run** — the in-class fixes shouldn't
  be lost for the next variant.
- **Results export** — a teacher who wants to look again.
- **Localization** — teachers who don't read English, classes that should
  see the few labels there are in their own. The bar's labels, their room
  and why they are nouns: `design/question-flow.md`, "The steering bar".
  Known pitfalls: the words for choices and answers must stay apart (German
  "Antwortmöglichkeiten" contains "Antwort"; "Auswahl" or "Optionen" don't);
  "Schlussrangliste" and "Classement final" are at the limit; Countdown
  needs a French word ("Décompte", or "Top chrono") and Italian may keep
  "Countdown"; "⏱ 15 s" where no short word exists, the number from
  `LAST_CALL_MS`.
- **Formula rendering** — fractions, powers, equations on maths sheets; until
  then an image carries them.
- **Pictures for a teacher whose AI can't make a zip** — free tiers and some
  AIs may not crop figures and bundle them; e.g. attach and crop the photo in
  the lobby, or an AI-drawn figure inline in the pasted text.
- **Scripts and right-to-left text** — the guidance says "any language", but
  whether CJK, Arabic or Hebrew render correctly (font coverage on the
  projector and the students' buttons, RTL layout of question, tiles and
  ranking) is untested.
- **Sound** — some classes want it.
- **Runs by itself** — the design kept for v5 item 7. Not core purpose, but
  value: the quiz carries on while
  the teacher's hands are elsewhere — a student who needs them, the next thing
  to set up, a small group — teacher in the room, not steering. Needs a cadence
  with nobody pressing, a close rule per question — the wall can watch instead
  of the teacher: close when everyone present has answered, or some seconds
  after the last answer, with a cap — and a way back: any press by the teacher
  makes it manual. Limit: nobody reads aloud, so it is for classes that read
  for themselves. Owner: the cheap version —
  closes on the last student's answer or max time, with fixed, generous
  durations for the result pages — messes with deliberate pauses, so a proper
  design item rather than a quick build.
- **Pairs and teams** — two children on one tablet already works as one
  player; whether "of 25" and the ranking read sensibly when twelve tablets
  stand for twenty-four children is unchecked, and team play is a mode of its
  own.

## Open: with the owner, and in the field

With the owner, what only he can do:
- The read of the German, French and Italian words
  (`translation-review.md`); Italian has no native reader on the project.
- Whether his daylight photographs of the sheet are to replace the rendered
  sheet pages the film and the sheets ask's tab show.
- A domain in front of the site, so a rate-limiting rule at the edge can stop a
  script from spending the day's allowance; the free plan includes one such
  rule, and a name children can type beats pages.dev on the slowest step
  (`design/hosting-and-limits.md`).

Follow-ups on the steering bar (`design/question-flow.md`):
- An accidental Countdown can't be cancelled; the old bar had "Stop the
  countdown".
- The stepper under Play (the question's states, the current one marked), so
  the noun on Play reads as the next step; its room on the wall's bar is
  unmeasured.
- Whether "Answers" reads as the step that closes answering ("Votes" set
  aside: it suggests majority voting).
- A press blocked by the settle window gives no feedback; the 80/450/400 ms
  timings need a real hand, clicker and phone.
- The capacity sentence ("a few dozen", landing and /own-copy), derived
  when a question had three steps (`design/hosting-and-limits.md`, Not
  known).
- A 320 px wall still clips the ranking.

Needs a real classroom or real devices, nobody has run it:
- Android tablets and phones: the file picker with a zip downloaded from a chat
  app, a killed browser tab bringing back its role, the bar and the answered
  avatars from the back row, the steering bar's double press with a real
  clicker and hand, whether children dress their avatars.
- The school's Wi-Fi, through /check.
- A deploy or Durable Object restart in the middle of a run
  (`design/connections.md`).
- The platform's wording when the free allowance is spent
  (`design/hosting-and-limits.md`).

## Housekeeping

- The README is to be rebuilt (the owner). It is the public GitHub landing,
  and its paragraph for an AI setting up a copy for someone else has the
  person run every step on their own computer, where the line above it
  offers an AI that runs the commands there.
- Nothing kept times the film's build (`sitecheck.py` doesn't); text over
  the steps (the owner's idea) would make it matter again. What it costs,
  and how the emulation compares with the owner's phone:
  `docs/film/README.md`, "Text".
- `app.css` is one global namespace (about 340 top-level rules on short class
  names), linked by every app page and `/example`; a bare rule for one screen
  can land on another page, as the podium's `.steps` did on `/example`.
  Deferred by the owner, the usual remedies: prefixed names (BEM-style) for new
  screen parts, with a build warning on a page's own classes that `app.css` also
  styles bare (allowlist for shared controls such as `.btn`), or esbuild's CSS
  Modules screen by screen, which touches the one-stylesheet build.
