# classyQuiz — Backlog

Project → versions as goals → items that get picked, worked and delivered. Each
item names the problem it solves for the teacher or the class. Done items are one
line with a pointer to the design file that holds their purpose and situation
(`design/<file>.md`); what is still to do is in full, and in the one list at the
end. Last settled: 2026-11-08.

## Project

A teacher has an exercise sheet and wants fifteen minutes of fun practice on
exactly that content. Existing tools fail on authoring time: their AI hands
the teacher a starting point to fix by hand in a slide editor; premade content
fails on topic. The product is the path from sheet to a running classroom
quiz, and the measure is teacher time. Plausible assumption: the quiz is often
made in the ten-minute break before the lesson, with the teacher's own AI, and
used once (so the format is checkable in seconds and the run is the review:
`design/quiz-format.md`, `design/question-flow.md`). The material arrives as a
few photos taken with a phone, or as a document or PDF uploaded from a laptop;
the teacher may be on either device. Any age group, including settings beyond
school with adult participants. The design target is a Swiss German-speaking
primary class: a school-issued laptop on the projector, Android tablets for
the kids, the teacher's phone as remote, an AI account that may be a free one,
students who may read slowly or not read English at all, and the teacher in
the room. The design files call it the example class; what they say of
children and the room is said of it. Plausible assumption: teachers understand
English (so the guidance and the site's own words are English; Localization,
under Later, is the queued change). The guidance to the AI is in English,
which AIs are trained on; quizzes come out in whatever language the teacher
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
12. Preview as the class will see it — whether it is v5 item 2's problem
    (Solo) is open there. Not built.
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
   deliverable; a carousel or slideshow. Built: a film of about 60 s without
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
   check (`design/hosting-and-limits.md`, "A copy on a school's own server").
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
   `design/class-and-wall.md`. Open: tools beside the animal are the owner's
   call; whether four seconds is long enough for a child to find themselves;
   the weak spot is a short question beside its picture, where ten winners come
   out small because the key stays visible.
10. **The worked example, behind one link** — built, `design/example-page.md`:
    `/example`, "The example, step by step" from the link under the landing's
    film, in the landing's four languages (item 12). Open:
    - The run, its photographs and its picture: `design/example-page.md`.
      Open: a run of the owner's may replace it; whether the quiz's growth
      past the asked ten is worth leaving in the picture.
    - Whether the check screen holds a socket or poll while a visitor only
      looks at the example: each "Start the example quiz" is a real upload.
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
    teacher's upload does. Today it is a normal upload, counted as one.
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
    the free plan ran out doesn't come back. Rows written are likely the first
    limit to run out, during lessons, while the site's caps count quizzes and
    let in four times what the rows carry. Built: students join once the
    teacher lets the class in (teacher devices any time); letting in books the
    most rows the class can write (changes of mind capped at 2), refused on the
    teacher's screen when the day can't carry it; the booking shrinks at Start
    and settles at the final ranking; a device's next upload ends its previous
    quiz if that one never started; the days' classes, rows written and
    peak are in `GET /api/site` for the owner. The check warns while fewer
    than three classes fit and keeps the refusal on screen, both with "More
    quizzes: a site of your own or your school's ›" (the owner: "Your own
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

People have to understand classroom quizzes before they can use the site: it
presents one way to play, the projector with the teacher's phone and the
students' devices, and a newcomer must grasp it before anything else. The file
the AI makes is independent of that way, and the person who asked for the
quiz need not know its answers, so a quiz is also for playing alone, with
friends, or for a crowd where the host plays too. Plausible assumption (the
owner's, 2026-11-08): people think in use cases, not capabilities — so the
site offers entries a person recognises before knowing any setting, named by
the owner **Solo** (you play the quiz on your own, for learning or review),
**Peers** (play with friends, the quiz runs on its own) and **Quizmaster** (a
host running the quiz for a crowd); entries that turn out the same underneath
are one thing, and that shared thing needs its right name (owner). The
classroom is a Quizmaster's quiz; nothing built is undone. The exploration
behind these items — options and what each would cost — is
`playing-redefined-notes.md`, a working note, not a design.

1. **Looking at a quiz, or playing it alone, shouldn't cost the shared site
   a class.** Every quiz today is an upload, and the day's uploads, rows and
   instances are the classes' (Constraints); the example page's every "Start"
   is one (v4 item 13). Owner: the zip is read in the browser first, and only
   opening a lobby uploads it. The browser already reads and parses it
   (`client/unzip.ts`, `quiz/format.ts`).

2. **Solo — a learner wants to practise or review on their own**, with a quiz
   their AI or their teacher's made, without having seen the answers. Today a
   quiz needs a room and a second device. Alone, nobody disputes a wrong key,
   and the learner can't tell one from their own mistake; the quiz carries no
   notes (`design/quiz-format.md`). Observed in the owner's user testing:
   preteens got excited about seeing their avatar celebrate (jump) in solo
   runs. Owner: closing the tab ends it, fine and expected; "editable" is
   wanted (what is editable: to confirm). Open: whether a teacher's preview
   of the quiz as the class will see it (v1 item 12) is this same problem
   (owner: unclear).

3. **Peers — friends want to play together with nobody running it**, so that
   everyone plays, including whoever asked for the quiz. Today someone must
   press Play and Reveal, and that someone has seen the question list.
   Owner: Peers makes the host a participant; the quiz runs on its own.

4. **Quizmaster — a host runs a quiz for a crowd that isn't a class**: a pub,
   a family, a training room, a video call. The words are the classroom's
   (teacher code, teacher devices), the avatars are animals (the open
   business-avatar question lands here), and the remote's how-to is shown to
   every host though only some have a remote. Owner: the Quizmaster choice
   comes first, then how the screens are arranged, as a toggle with an
   explanation and the remote's manual only where it applies; auto-play
   (item 7) is the quizmaster's option.

5. **Whoever asked the AI for the quiz wants to play it, and so must not have
   seen the questions.** This is what lets a quiz be played by its own maker
   — a pub host who guesses along, a trivia quiz that is nobody's agenda.
   Today the AI shows its draft in the conversation, and the check screen
   after upload lists every question with its key (v4 item 8). A group
   catches a wrong key (fixes during the run); alone, it is item 2's problem.

6. **The room's screens aren't the classroom's.** A table or a call has no
   big screen; a call may share a window as one; a class may have a projector
   and no student devices (the open "projector alone" question). Today the
   question lives on the wall only and the tablets show colour-coded buttons,
   on `design/question-flow.md`'s plausible assumption that the teacher reads
   aloud while the class looks at the projector. Open: whether the guidance
   should say where a quiz will be read.

7. **Nobody has to steer.** Peers can't do without it; a quizmaster whose
   hands are elsewhere wants it (Later, "Runs by itself", whose cadence
   design is still owed).

8. **Players at their own pace** — a race: fast players don't wait, slow ones
   don't hold the room. Open with the owner: in a classroom, whether the tail
   of the field is shown (`design/class-and-wall.md` shows winners only).

9. **A visitor who isn't a teacher, and an AI asked for a quiz that isn't a
   lesson's, must recognise themselves on the page.** The README says
   "Quizzes for classes", the lede "live classroom quizzes", the landing's
   "Run a quiz" leads to a classroom, the guidance describes a lesson and its
   back row, the example asks are a teacher's. Which word stands where
   "teacher" stands today is decided once, for all entries and the queued
   localization. Each sentence changes with the delivery it describes, so the
   page never promises what isn't built.

Out under the lifetime as decided (v4 item 3: keeping serves rejoining a quiz
in progress): playing at different times — each at home when they like, a
leaderboard that waits — needs a quiz kept for days, which nobody has asked
for. Named, not pursued: tests, in class or self-administered.

## Later — Paper and memory

The quiz is already made; it can be more than one activity.

- **Printables** — quick test on paper, answer sheet, review print to take home;
  not every lesson has devices.
- **Corrected quiz downloadable after the run** — the in-class fixes shouldn't
  be lost for the next variant. Perhaps v5 item 2's "editable".
- **Results export** — a teacher who wants to look again.
- **Rows by holding the open period on the teacher's device** — a design kept
  ready for when the Free plan's rows bind: about a tenth of a class's
  rows, a changed ack, a rebuild and an offline overlay
  (`design/teacher-holds-the-open-period.md`).
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
- Consumers beyond the classroom: settled as v5 (Solo, Peers, Quizmaster).
  Of what rested on it, the landing's first sentence, the README's descriptor
  and the example asks are v5 item 9. Still open: team names against "nothing
  identified" (the constraint's stated purpose is data protection, written
  with children in mind; whether an adult entry is another situation is the
  owner's); and the quiz
  carrying no notes, which Solo meets with the key after each answer and
  nothing to explain it — an explanation line in the format would reopen
  `design/quiz-format.md`'s ruling.
- A class refused for the day's room can't run in that lesson; only waiting
  or an own copy are offered. Whether the refusal should also offer running
  the quiz on the projector alone (the browser plays it; the class answers by
  hand or with coloured cards; no student devices, no scoring), which costs
  the free plan nothing since static pages don't count
  (`design/hosting-and-limits.md`, "Running classes finish"). Not decided;
  the situation is v5 item 6's.
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
- Tools beside the avatar, and whether four seconds suits the winners' band
  (v4 item 9).
- Business avatar styling: avatar options more suitable to business use (the
  animals suit a classroom; a business audience is among the consumers beyond
  the classroom, above). Home: v5 item 4. Not designed: which options, and
  whether a host picks the set per upload, defaulted by the entry (the file
  is made blind and the host knows the room), or the quiz carries it.
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
  stack), `labels-walk.mjs` (the bar's labels and small lines through every
  step on walls of 1366, 600 and 360 px and a 360 px Remote: text cut or
  not, height, shots). They read a site at 127.0.0.1:8931 or 8788; read before running.
- Process, the owner's words, for whoever orchestrates next: delegate on
  purpose and situation, not steps; no spec changes to an agent in flight —
  settle the item first, then brief a fresh one; no runs whose outcome is
  already known; a backlog edit rides with the delivery it belongs to. Commit in
  meaningful, likely working units, no churn commits, and squash what slips;
  branches opened can be merged back.
