# classyQuiz — Backlog

Project → versions as goals → items that get picked, worked and delivered. Each
item names the problem it solves for the teacher or the class. Done items are one
line with a pointer to the design file that holds their purpose and situation
(`design/<file>.md`); what is still to do is in full, and in the one list at the
end. Last settled: 2026-11-09.

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
`design/quiz-format.md`, `design/question-flow.md`). The material arrives as a
few photos taken with a phone, or as a document or PDF uploaded from a laptop;
the teacher may be on either device. Any age group, including settings beyond
school with adult participants: the site offers the ways to play by name,
Solo, Peers and Quizmaster, and the classroom is a Quizmaster's quiz (v5).
The design target is a Swiss German-speaking
primary class: a school-issued laptop on the projector, Android tablets for
the kids, the teacher's phone as remote, an AI account that may be a free one,
students who may read slowly or not read English at all, and the teacher in
the room. The design files call it the example class; what they say of
children and the room is said of it. Plausible assumption: teachers understand
English (so the guidance and the site's own words are English; Localization,
under Later, is the queued change). The guidance to the AI is in English,
which AIs are trained on; quizzes come out in whatever language the asker
needs, and the AI asks when the sheet's language and the ask's differ. The
failure mode to design against is a normal user who can't use it, not a
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
  from published material. The packaged quiz lives on the server for the
  lifetime of the quiz instance — what that lifetime is, is part of the work;
  the teacher's file on disk is the durable copy.
- **Survives school Wi-Fi** — connections drop, phones go to sleep, a device
  dies mid-quiz, and the lesson must go on. Failure in front of the class ends
  adoption. A deploy or a Durable Object restart in the middle of a run is the
  same situation from the server's side.
- **Designed for Claude**; other mainstream AIs build from the guidance where
  their plan gives them the tools: free Gemini can't choose its strong models,
  free ChatGPT has its tools on some runs and not others. Findings by model
  and tier: `design/guidance-page.md`, "The AIs verified against".
- **Hosted on the owner's Cloudflare account** — a teacher's laptop can't be
  relied on to be reachable over school Wi-Fi. Monetization is not a concern of
  the project, so the shared site runs on the Free plan, designed to stay
  within its limits for a few users, and usage limits nudge heavy use toward
  self-hosting, on Cloudflare or another provider. The README promises that an
  AI can set up one's own instance from the public repo. It has no domain of
  its own today, a situation, not a rule; what a domain would change is in
  `design/hosting-and-limits.md`.

## v1 — One real teacher runs one real quiz their AI made in the break

Text-only multiple choice, up to four answers, press the right one. Runner first
so there is something to click early; authoring closes the loop.

1. Quiz format a teacher can check in seconds and an AI writes reliably, with a
   wrong key fixable in the text or by telling the AI — built, `design/quiz-format.md`.
2. Getting the AI's quiz onto the site, as one archive — built (zip only; the
   owner: "let's see if we can get away with zip only", the paste box and text
   files invite typing questions to an AI), `design/root-page.md`.
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
    human — built, `design/guidance-page.md`. Whether a given AI does is a test,
    not an assumption (open list).
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
   nothing from the sheet's solutions or a pupil's name in the crop (open
   list).
2. Optional countdown for classes that want game-show tempo — built, then
   replaced by the steering bar (v4 item 6), `design/question-flow.md`.
3. Speed scoring — built as a switch, `design/question-flow.md`.
4. Hardening an open public instance, including closing the door — built,
   `design/hosting-and-limits.md`. Open: automated vandalism from outside the
   class is realistic, and on the default pages.dev address nothing stops a
   script from spending the account's daily allowance for every class — the
   code can only bound what one quiz costs, which it does. The known remedy is
   a domain in front of the site with a rate-limiting rule at the edge, which
   the free plan includes; a domain is on the open list.
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
before anything else comes into play. Owner and product owner, 2026-11-03.

Pattern, for every item below: any claim about what an AI can do carries the
tier and the date it was tested, e.g. "free Claude Sonnet, tested 4 Nov 2026"
(`design/guidance-page.md`).

What is deployed: `deploy-log.md`. What is still open is in each item and in
the open list at the end.

1. **One instance, rendered: sheet → two turns → quiz → the class playing it**
   — between "Build a quiz" and "Run a quiz" a first-timer faces two obstacles,
   "how do I ask?" and "what even is a quiz?", and one concrete instance
   answers both: what the AI hands over *is* what the class plays, and the
   words that produced it are the how-to-ask. The forms are renderings of that
   one instance, so more than one can exist; not a closed list: a video; a
   static display of the input leading into the playable quiz as its
   deliverable; a carousel or slideshow. Built: a film of about a minute without
   sound, from the owner's storyboard brief, fed the real screens and the
   example ask in the page's four languages, never autoplaying; until it plays
   its poster and a video player's bar stand in its place
   (`design/root-page.md`, "The film"; `docs/film/`). Open: the German "du",
   French "vous" and the translations of the page and the film, drafts
   pending the owner's review (proposals and the questions behind them:
   `docs/translation-review.md`); whether the owner's daylight photographs of
   the sheet are still to replace the rendered sheet pages the film and the
   ask's tab show (Open: the sources don't say); the film's pace for the
   teacher who has decided and wants the steps (`docs/film/README.md`, "Not
   known"). One story must work on a desktop and on horizontal tablets as
   well as on vertical phones: the sheet recognizable as a sheet, readability
   on a phone may suffer, phone variants such as clickable or scrollable are
   allowed. Owner, on how the page addresses teachers: "commands only for what
   must be done ("Ask it" is one; advice on how follows well)"; the page
   doesn't order its reader about for things nobody must do, but the teacher's
   own sentence to their AI, where "Read …" is fine, is not covered.
   Owner: both humans and AIs learn a format through a prototype — the txt
   example in the manual for the AI, the example ask in Build for the teacher.
2. Resume for the device that started the quiz, the way back and certainty it's
   the right quiz — built, `design/root-page.md`.
3. **Upload is start** — owner: "uploaded the evening before" is not real;
   the parallel class's quiz is its own quiz, started by its own upload. A
   quiz is one class's lesson; the site is a runner, not a store of quizzes.
   Built: one class per upload, the final ranking as its own screen (podium,
   the class in front unordered, all jumping, the class's result kept for a
   photograph), and Exit alone in the middle of its bar, without a
   confirmation, sending every screen to the root page (`design/class-and-wall.md`,
   "The final ranking"; `design/question-flow.md`, "The steering bar").
   Ending early is ⋯ → End the quiz: final ranking, then Exit. The lifetime is decided and built: everything
   goes 3 hours after the teacher's last use, or when the teacher ends it
   (owner: the purpose of keeping is rejoining a quiz in progress; one
   duration everywhere is sensible and easy to communicate). Lost until
   "corrected quiz download" ships: a key fixed in class dies with the quiz.
   Lifetime as built: `design/hosting-and-limits.md`.
4. The foot lines from the teacher's side — own copy for the teacher who will
   run 20–30 quizzes a month and asks "can I rely on this?", network help where
   the failure shows — built, `design/root-page.md`. "Your AI does it" and
   a number serve one purpose — it's not scary, you can do it — and are only
   true if the AI a teacher has can do it. Owner, 5 Nov 2026: a cloud VM
   (Claude Code on the web, paid Claude) is a route anyone can take; free
   Sonnet in a chat can walk a patient teacher through it, which takes some
   technical affinity. `/own-copy` offers two routes to more quizzes: setting one up
   yourself, by one of those two AIs (one prompt for both, the token kept out
   of the chat); and the school's IT, on its own servers or a paid Cloudflare
   account; updating a
   copy is a choice, an unchanging copy being what a teacher values before a
   lesson. The conversion is the school's, not checked here (owner: the point of
   telling them to convert is so we don't have to); `simulate.mjs` is their
   check (`design/hosting-and-limits.md`, "A copy on a school's or company's
   own server").
   Open: the page says the VM route takes "minutes" and the walk-through "a
   while" (owner), untimed on the current README; the VM's network access
   (`root-page.md`, "Not known"). The own-copy line
   understates (it counts only days the upload cap refused).
5. The guidance, the owner's rewrite merged — built, `design/guidance-page.md`.
6. Tempo in the instance, in the teacher's hand: a bar of two buttons (Play,
   Countdown) stepping the question through its states — built and live,
   `design/question-flow.md`. The owner on labels: "Reveal" and "Ranking" name
   a thing the class sees; "Next question" and "Straight to answering" name a
   motion. The teacher screens' words (choices, answers, solution; nouns on
   Play), also in the guidance and the format's messages — built and live,
   same file. Follow-ups are in the open list.
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
    film, in the landing's four languages (item 12). Open:
    - The run, its photographs and its picture: `design/example-page.md`.
      Open: a run of the owner's may replace it; whether the quiz's growth
      past the asked ten is worth leaving in the picture.
11. **Findings from a Sonnet-at-medium test, 2026-11-04** (account tier not
    recorded, so no tier claim)
    - "Make me a quiz for classyquiz.pages.dev" was read as a publish target
      and set aside; the model fetched the page only when told to read it.
      The examples now begin `Read <address>.` and say "a classyQuiz" (commit
      ddededf); the README's
      example says the same.
    - Transparent answer pictures: a blueish-green marker vanished on the blue
      tile. The guidance already says tiles are shuffled across four colours
      (`src/public/index.html`, "Pictures as choices"); what remains is to
      tell the AI to draw each answer picture with a ground of its own, white
      unless there's a reason, because a mark can vanish on a random tile
      colour. Rides with the next delivery.
    - Told the teacher "students can press Z or click a picture to enlarge
      it" of answer pictures. Only the question's picture enlarges, by the
      teacher (`design/pictures.md`, "Enlarging"). The guidance's "the teacher
      can enlarge a picture" and "a smaller picture is enlarged on the wall"
      allowed the reading; they now name the question's picture and say
      "scaled up". Z, click and students aren't on the page.
12. **The worked example in the landing's other three languages** — built,
    `design/example-page.md`: the page, the conversation picture (light and
    dark) and the quiz in de, fr and it, the English run translated so the
    example is the same in each, as the page says. Open: the translations are
    drafts pending the owner's review (`docs/example/text.py`, the page's
    words in `client/example-text.ts`, the quizzes in
    `docs/example/quiz_zips.py`); the choices for the owner are
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
    kit in `docs/brand/`, `design/identity.md`. Open, the owner's words: a one-line descriptor by
    the logo, what classyQuiz is, as a statement (the first such sentence is
    in the English guidance under the page's largest heading); and the next
    step for "This file is not a readable .zip archive.", which lacks one
    where its neighbours have it. Open, beyond the identity: the logo kit's
    web manifest and theme colours, which make the site installable as an
    app (its icons would be renders of the kit's paper tile,
    `docs/brand/web/touch-icon.svg`); a keyline on the raster icons for a dark
    tab strip, needed only by browsers that don't take the SVG icon; the
    kit's link-preview card, which no page names yet.
    Open, from the teacher-view review and not acted on: the root's English
    guidance starts on a different left edge from the teacher block (desktop),
    so it reads as a second page joined on, unless that is meant; the empty join screen's right half stays blank
    until children join; on a real washed-out projector the pale states
    (hidden answers, faded tiles at the reveal) may let pale red and pale
    yellow run together — unchecked.

15. **Running classes finish** — a teacher whose class stops mid-quiz because
    the free plan ran out doesn't come back. Which limit runs out first, and
    what a class costs: `design/hosting-and-limits.md`, "What a class costs".
    Built: students join once the
    teacher lets the class in (teacher devices any time); letting in books the
    most rows the class can write (its taps held in memory, not counted:
    "Room on the Free plan", item 1), refused on the
    teacher's screen when the day can't carry it; the booking shrinks at Start
    and settles at the final ranking; a device's next upload ends its previous
    quiz if that one never started; the days' classes, rows written and
    peak are in `GET /api/site` for the owner. The check warns while fewer
    than three classes fit and keeps the refusal on screen, both with "More
    quizzes: a site of your own, your school's or your company's ›" (the owner: "Your own
    copy" too ambiguous); the landing's line counts busy days too (half the day's rows booked at once). Not
    deployed. Owner: booking slots and releasing them, the shrink at
    Start, one stored quiz per device, the low cap instead of overbooking,
    students only once let in; the numbers are the implementer's, to confirm.
    `design/hosting-and-limits.md`, "Running classes finish".

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
hand; the classroom is a Quizmaster's quiz, and nothing built was undone. The
exploration behind these items — options and what each would cost — is
`playing-redefined-notes.md`, a working note, not a design. What is deployed:
`deploy-log.md`; what the owner hasn't seen: the open list at the end.

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
   and no student devices (the open "projector alone" question, in the list
   at the end). The device screen — the question, its picture and the tiles
   on the player's own device, then the key — is built with Solo
   (`design/solo.md`, "The device screen"), and a Peers room stands on it
   (`design/peers.md`). Open: a Quizmaster's devices-only room; a wall in a
   Peers room, a family at the TV; whether the guidance should say where a
   quiz will be read.

7. Nobody has to steer — Peers' side: everyone ready, the question closing
   once everyone present has answered and the next coming once everyone is
   done with the solution — `design/peers.md` ("Nobody steers"). It rests
   on a few friends waiting for each other, which a class of 25 doesn't
   (`playing-redefined-notes.md`, item 4); a quizmaster whose hands are
   elsewhere is Later, "Runs by itself", whose cadence design is still owed.

8. **Players at their own pace** — a race: fast players don't wait, slow ones
   don't hold the room. Not pursued in this delivery: it serves a classroom's
   throughput, not the widening; what it would need is in
   `playing-redefined-notes.md`, item 8. Open with the owner: in a classroom,
   whether the tail of the field is shown (`design/class-and-wall.md` shows
   winners only).

9. A visitor who isn't a teacher, and an AI asked for a quiz that isn't a
   lesson's, recognise themselves on the page, the example class's teacher
   still served first: the word decided once (`design/root-page.md`, "Words
   for whoever comes"), the three ways named in one sentence above Build and
   Run, in the visitor's language, by the names the check's cards carry
   (`design/root-page.md`, "The three ways, named"), Run's words leaving
   "play" to the check's cards so a child with a code isn't drawn into the
   file picker ("Run first when stacked"), the guidance describing the three
   ways and where each reads a question (`design/guidance-page.md`), three
   more example asks with
   no line under them since no run is behind them, and the film showing the
   check and the lobby as built (`docs/film/`). Open: the de/fr/it drafts
   (`translation-review.md`, "The other ways to play", "The words before
   the check", E6); whether someone
   who isn't a teacher reads the page as theirs, which nobody outside the
   project has tried.

Out under the lifetime as decided (v4 item 3: keeping serves rejoining a quiz
in progress): playing at different times — each at home when they like, a
leaderboard that waits — needs a quiz kept for days, which nobody has asked
for. Named, not pursued: tests, in class or self-administered.

## Room on the Free plan

The owner, 2026-11-09: about 200 classes a day and about 60 at once is
plenty. Beyond that, donations could pay Cloudflare for more, rather than
the code being made more complicated. A class's taps are held in memory
(item 1), so rows written no longer bind first; requests are likely to
(`design/hosting-and-limits.md`, "What a class costs"). Ideas for the
limits that come after are in `scaling-drawer.md`, to take up when a figure
shows one binding.

1. **Answers and looks held in memory** — a class writes its input in
   batches, so rows stop binding first and the looks stop being a third of
   a let-in booking; a restart that the devices can recover from loses
   nothing they show — `design/open-period-in-memory.md`, which also
   settles the open points the baseline left (the stragglers, a device away
   at the close). Built on the owner's and the assistant's baseline of
   2026-11-09. A let-in booking is about 1,030 rows (77 lobbies at once); a
   class of 25 over 15 questions writes about 250, most of them the
   teacher's steps (estimated, not measured; the baseline estimated 100 to
   150). Open: it is to run once against the deployed site, a deploy in the
   middle of a run among it (`scripts/simulate-memory.mjs`).

2. **What telemetry the project needs** — the limits, the capacity
   sentence on the landing, the caps and the drawer's ideas rest on figures
   nobody had measured; telemetry gives them without identifying anyone
   and without costing rows or requests — `design/telemetry.md`. Built:
   each device counts its own line and sends the count with what it sends
   anyway; a class becomes one summary at its settle; the days' records
   (31 days, then by the month for 24 months, problems by the day only)
   for the owner at `GET /api/site/use`, behind `OWNER_KEY`. Open: the key
   is to be set on the Pages project before the deploy that carries this
   (`secrets/README.md`), or the figures can't be read; the deploy moves
   the days' rows records off the public `GET /api/site`.

## Later — Paper and memory

The quiz is already made; it can be more than one activity.

- **Printables** — quick test on paper, answer sheet, review print to take home;
  not every lesson has devices.
- **Corrected quiz downloadable after the run** — the in-class fixes shouldn't
  be lost for the next variant. Not Solo's (owner: a review may edit, solo
  play doesn't).
- **Results export** — a teacher who wants to look again.
- **Localization**, one sub-item per language — teachers who don't read
  English, classes that should see the few labels there are in their own.
  The bar's labels are nouns so they translate without grammar and fit the
  wall's ~13–15 characters (`design/question-flow.md`, "The steering bar").
  Known pitfalls: the words for choices and answers must stay apart (German
  "Antwortmöglichkeiten" contains "Antwort"; "Auswahl" or "Optionen" don't);
  "Schlussrangliste" and "Classement final" are at the limit; Countdown
  needs a French word ("Décompte", or "Top chrono") and Italian may keep
  "Countdown"; "⏱ 15 s" where no short word exists, the number from
  `LAST_CALL_MS`. A native-speaking teacher confirms each language.
- **Formula rendering** — fractions, powers, equations on maths sheets; until
  then an image carries them.
- **Pictures for a teacher whose AI can't make a zip** — free tiers and some
  AIs may not crop figures and bundle them; e.g. attach and crop the photo in
  the lobby, or an AI-drawn figure inline in the pasted text.
- **Scripts and right-to-left text** — the guidance says "any language", but
  whether CJK, Arabic or Hebrew render correctly (font coverage on the
  projector and the students' buttons, RTL layout of question, tiles and
  ranking) is untested. Check before the guidance implies it; a native-reading
  teacher confirms.
- **Sound** — some classes want it; off by default, a mute on the projector.
- **Runs by itself** — the design kept for v5 item 7. Not core purpose, but
  value: the quiz carries on while
  the teacher's hands are elsewhere — a student who needs them, the next thing
  to set up, a small group — teacher in the room, not steering. Needs a cadence
  with nobody pressing, a close rule per question — the wall can watch instead
  of the teacher: close when everyone present has answered, or some seconds
  after the last answer, with a cap — and a way back: any press by the teacher
  makes it manual. Limit: nobody reads aloud, so it is for classes that read
  for themselves; an option, never the default. Shares the clock machinery with
  the steering bar so neither forecloses the other. Owner: the cheap version —
  closes on the last student's answer or max time, with fixed, generous
  durations for the result pages — messes with deliberate pauses, so a proper
  design item rather than a quick build. Configuration presets (Quick,
  Teaching), where a question starts with its answers shown, belong here
  as an option.
- **Pairs and teams** — two children on one tablet already works as one
  player; whether "of 25" and the ranking read sensibly when twelve tablets
  stand for twenty-four children is unchecked, and team play is a mode of its
  own.

## Open: with the owner, and in the field

Actions and decisions only; where a design file's "Not known" describes the
uncertainty, it is pointed to, not restated.

With the owner:
- Answers and looks held in memory ("Room on the Free plan", item 1), the
  implementer's calls, not yet seen by the owner
  (`design/open-period-in-memory.md`): the grace period for stragglers is
  the existing rule for a late tap (until the class leaves the reveal), no
  timer; a device away at the close has its input written when its line
  ends and isn't back within a second, at most ten such writes a stage for
  the class; the caps raised to
  10 changes of mind and 100 changes of look; the device sends at most one
  tap every 300 ms, the latest of a burst; an acknowledgement now means the
  server holds the tap, not that it is stored. Seen as a consequence:
  `ROOM_WARN`'s three classes are now the last 4% of the day, where they
  were its last third.
- Telemetry ("Room on the Free plan", item 2), the implementer's calls on
  the owner's "balance straightforwardness of implementation, likely
  usefulness of data, and general purpose", not yet seen by the owner
  (`design/telemetry.md`): day sums and buckets, no record per class;
  devices' script errors counted, the Function's errors not; the
  simulators' and probes' classes kept apart by the JSON upload they use;
  classes turned away counted as a lower bound, at no row of their own; the
  summary at the settle, so the after-lesson tail is the dashboard's; which
  way a quiz was played on the local check not counted; month records kept
  24 months, refusals among them.
- Consumers beyond the classroom: settled as v5 (Solo, Peers, Quizmaster).
  Of what rested on it, the lede, the README's descriptor and the example
  asks are built with v5 item 9. Still open: team names against "nothing
  identified" (the constraint's stated purpose is data protection, written
  with children in mind; whether an adult entry is another situation is the
  owner's); and the quiz
  carrying no notes, which Solo meets with the key after each answer,
  nothing to explain it, and the run copied for the player's AI at the end
  (`design/solo.md`) — an explanation line in the format would reopen
  `design/quiz-format.md`'s ruling.
- A class refused for the day's room can't run in that lesson; only waiting
  or an own copy are offered. Whether the refusal should also offer running
  the quiz on the projector alone (the browser plays it; the class answers by
  hand or with coloured cards; no student devices, no scoring), which costs
  the free plan nothing since static pages don't count
  (`design/hosting-and-limits.md`, "Running classes finish"). Not decided;
  the situation is v5 item 6's. Solo on the projector is what such an offer
  would open (`design/solo.md`, "Preview and the projector alone").
- The identity (v4 item 14) as built, seen by the owner in a local test
  ("looks good", 2026-11-04): the
  implementer's calls are ink controls and a rust accent, no blue,
  which takes `class-and-wall.md`'s rule for the who-answered bar (never an
  answer's colour) to every control and every colour of the site's own;
  Rubik for the site's own words only; the mark alone, without the name, in
  the header on an upright phone; and where the mark appears
  (`design/identity.md`).
- Two changes to the class's screens, built as the implementer's calls and
  not yet seen by the owner (`design/class-and-wall.md`): the ranking's bar
  per question stands on a track of the full height, so a low share reads as
  low; and a number stays on one line with a short word after it ("50
  Franken", "3 cm"), so a tile's first line isn't the number alone.
- The quiz's background in the lobby and at the rankings: built that way as
  an implementer's call, not yet seen by the owner (`design/pictures.md`).
- The implementer's two choices on the bar: Countdown closes answering early once
  everyone present has answered; points for speed run over a fixed 20 s from
  the answers appearing (`design/question-flow.md`).
- v2 item 1's open point (what makes a picture work on the wall): the
  guidance carried it, then the cut to what the reading model can't know took
  most of it out again. Open, or closed by that standard.
- The free-tier sitting (`docs/free-tier-check.md`), on a free Claude
  account, with its owner: a logged-in
  free account producing a working zip with pictures (keep the zip). Landing
  step 1's wording no longer waits on it: the owner's free-tier findings
  settle it (`design/guidance-page.md`, "The AIs verified against"); the
  sitting puts a dated record under them. The own copy is not part of it. It waits
  until the landing and guidance are settled: every fetch from claude.ai
  restarts the fetch cache's clock, so no fetch tests of the live root until
  then.
- The daylight photographs of the sheet, the turn-2 ask (v4 item 10), the
  read of the translations, the page's and the film's (v4 item 1), the
  personal line in step 1 if wanted.
- Whether four seconds suits the winners' band (v4 item 9).
- The avatars for a wider audience (v5 item 4), built on the owner's purpose
  and direction of 2026-11-08 and not yet seen by the owner: the animals
  stay, every look starts plain, and the one menu for every room carries two
  registers for adults beside the children's. The owner's examples are the
  top hat and the laptop, chart and calculator; the implementer's are the
  bowler and the bow tie (the top hat expanded on; a monocle was rendered
  and left out) and the coffee, briefcase and book. No look for a room, no
  set per upload, none carried by the quiz (figure `avatars/tools.png`,
  `design/class-and-wall.md`, "Dressing the avatar"). To decide on seeing
  it: whether that serves a training room, and the implementer's items.
  Should one menu not serve both rooms, the fallback is a set per upload,
  defaulted by the entry and changeable among the host's settings on the
  check screen. The looks are held in memory and cost no rows, so the menu
  can grow without moving a booking (`design/open-period-in-memory.md`).
- Solo (v5 item 2) as built, kept by the owner's delegate and not yet seen
  by the owner (`design/solo.md`, Not known): a tap is the final answer;
  the avatar is dressed before the first question; the result's "Copy the
  answers for your AI", in those words; Back ends a run without asking.
- Quizmaster (v5 item 4), the implementer's calls, not yet seen by the
  owner (`design/teacher-devices.md`): the toggle on the lobby's check
  rather than the local check's card (there Screen and remote can show the
  teacher code at once, made at upload); devices only not offered; the
  words ("Join
  code", "Let everyone in", "Joining opens in a moment.", "Ask whoever runs
  it", "‹ Back"), which the landing's film now shows too. The
  delegate's decisions after the review of v5, likewise not yet seen by
  the owner: the lobby's check and the Remote's lobby list the questions
  open with the answers folded, as before v5, since the local check keeps
  them closed for every entry; Screen and remote as the first default, so
  the example class's teacher finds the remote's how-to on a first visit,
  and One screen once this browser has run a quiz to its end without a
  Remote; the local check's three buttons alike, none primary, so a teacher
  in a hurry doesn't press Solo's for standing out (`design/local-check.md`).
- Peers (v5 items 3 and 7), the shapes as built, kept by the owner's
  delegate and not yet seen by the owner (`design/peers.md`, its "Not
  known" for each): who the room waits for, shown as avatars on every
  device that is done; the spread showing with the key, no lock-in
  before it; a ranking on each device while it waits; the opener's "…
  now, without waiting"; no points for speed; no wall.
- The words (v5 item 9), the implementer's calls, not yet seen by the
  owner (`design/root-page.md`, "Words for whoever comes"): "quizmaster" as
  the noun where English needs one rather than "host", "the user" in the
  guidance, no role noun where the words are translated; the three new asks
  and their pictures (one person, three people, a screen before an
  audience), six tabs on a phone; "Join code" on the resume card; `/check`
  speaking of "our network" and "school or work".
- v4 item 3: the new lifetime ("upload is start"); the work is B's remainder.
- v4 item 4: the own-copy and network-help defaults, to adjust if wanted.
- A domain in front of the site, so a rate-limiting rule at the edge can stop a
  script from spending the day's allowance; the free plan includes one such
  rule, and a name children can type beats pages.dev on the slowest step
  (`design/hosting-and-limits.md`).
- Whether the default Cloudflare address passes the AIs' fetchers and school
  filters: needs the deployed page; `/check` covers the school side on the day.
- Whether AIs overuse several "+" lines now that the guidance allows them; a
  real sheet through the local harness (it ran on an invented German fractions
  sheet; the owner's number-line quiz from a real sheet hasn't been run through
  it).

Review E's follow-ups on the bar (`design/question-flow.md`):
- An accidental Countdown can't be cancelled; the old bar had "Stop the
  countdown".
- The stepper under Play (the question's states, the current one marked), so
  the noun on Play reads as the next step; its room on the wall's bar is
  unmeasured.
- Whether "Answers" reads as the step that closes answering ("Votes" set
  aside: it suggests majority voting).
- A press blocked by the settle window gives no feedback; the 80/450/400 ms
  timings need a real hand, clicker and phone.
- The capacity sentence ("a few dozen classes a day", landing and /own-copy)
  is not re-derived now that a question has four or five steps.
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

## Housekeeping and process, for the next session

- What is deployed, and from where: `deploy-log.md`; how: `src/DEVELOPING.md`,
  "Deploying".
- `app.css` is one global namespace (about 340 top-level rules on short class
  names), linked by every app page and `/example`; a bare rule for one screen
  can land on another page, as the podium's `.steps` did on `/example`.
  Deferred by the owner, the usual remedies: prefixed names (BEM-style) for new
  screen parts, with a build warning on a page's own classes that `app.css` also
  styles bare (allowlist for shared controls such as `.btn`), or esbuild's CSS
  Modules screen by screen, which touches the one-stylesheet build.
- Probes kept in `.tmp/shots-tool/`: `landing-ask-sweep.mjs` (stray
  punctuation in the labelled ask across widths, full-page shots),
  `landing-stacked-order.mjs` (where Build and Run start on upright screens),
  `example-launch.mjs` ("Start the example quiz" to the check, on a running
  stack; it waits for the lobby, which comes after the local check now),
  `../v5-check/walk.mjs` (the local check: the example and a root upload to
  `/open`, nothing uploaded while looking, the fold, fixes reaching the
  lobby, reload and Back, the root's problems; a site at 8868 by default), `labels-walk.mjs` (the bar's labels and small lines through every
  step on walls of 1366, 600 and 360 px and a 360 px Remote: text cut or
  not, height, shots), `../fix-solo/solo-walk.mjs` (Solo on the example,
  desktop and phone, nothing uploaded, Back to the check, then the lobby),
  `../fix-solo/solo-quizzes.mjs` (Solo with sentence and picture answers on a
  phone and a tablet, on its side and upright; both wait out the start's
  settle window, which `../v5-solo/`'s originals don't),
  `../fix-solo/preview-compare.mjs` (Solo against the wall that steers
  itself in the same window, question by question: boxes, fonts, grid; its
  quizzes from `make-zips.py`), `../fix-solo/double-tap.mjs` (double taps
  on the check's Play, Start and Result in five windows; these two read a
  site at 8988 by default),
  `../v5-solo/wall-walk.mjs` (the wall through a
  question with bot players: spread, key, winners), `../v5-peers/peers-walk.mjs`
  (Peers on the example: the card, the opener's lobby, a phone and a laptop
  joining, a question, the solution, the ranking while waiting, the ⋯, the
  final ranking, Exit) and `../v5-peers/peers-pics.mjs` (Peers with picture
  answers, every picture loaded; both on a site at 8918, `stacks/peers/`). They read a site at
  127.0.0.1:8931, 8788 or 8958 (`stacks/solo/`); read before running.
- Process, the owner's words, for whoever orchestrates next: delegate on
  purpose and situation, not steps; no spec changes to an agent in flight —
  settle the item first, then brief a fresh one; no runs whose outcome is
  already known; a backlog edit rides with the delivery it belongs to. Commit in
  meaningful, likely working units, no churn commits, and squash what slips;
  branches opened can be merged back.
