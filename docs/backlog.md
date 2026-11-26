# classyQuiz — Backlog

## Project

A teacher has an exercise sheet and wants fifteen minutes of fun practice on
exactly that content. Existing tools fail on authoring time: their AI hands
the teacher a starting point to fix by hand in a slide editor; premade content
fails on topic. The product is the path from someone's material to a quiz
being played — run by a quizmaster for a class or another group (Quizmaster),
among friends with nobody running it (Peers), or alone (Solo) — and the
measure is the asker's time: where the output is trusted, the time it takes to
type the request and the wait until the result is there. Any age
group, adults beyond school included; quizzes come out in whatever language
the asker needs.

Plausible assumptions: the quiz is often made in the ten-minute break before
the lesson, with the teacher's own AI, and used once, so the format has to be
checkable in seconds and the run is the review; the material arrives as a few
phone photos, or as a document or PDF on a laptop, and the teacher may be on
either device.

The design files' example class is a Swiss German-speaking primary class: a
school-issued laptop on the projector, Android tablets for the kids, the
teacher's phone as remote, an AI account that may be a free one, students who
may read slowly or not read English at all, and the teacher in the room.

The failure to design against is a normal user who can't use it, not a
malicious one: a disruptive student is handled by the teacher walking over to
the tablet. A child in the room can just steal the projector's power plug:
a pupil sabotaging class is not a technical problem. Outside attackers and
14-year-olds writing automated scripts are real, so the site bounds what one
quiz costs.

## Constraints

- **Nothing public, nothing kept beyond its use, nothing identified** — data
  protection, and the own-classroom copyright exception for quizzes derived
  from published material. A quiz lives on the site for the lifetime of its
  room; the file on the teacher's disk is the durable copy. A device's
  address reaches the site's code only for the limit on wrong teacher codes:
  it is neither logged nor stored, only a hash of it salted per quiz, kept
  while it counts and deleted after (`server/instance.ts`, `deviceKey`).
- **Survives school Wi-Fi** — connections drop, phones go to sleep, a device
  dies mid-quiz, and the lesson must go on. Failure in front of the class ends
  adoption. A deploy or a Durable Object restart mid-run is the same
  situation from the server's side.
- **Hosted on the owner's Cloudflare account** — a teacher's laptop can't be
  relied on to be reachable over school Wi-Fi. Monetization is not a concern
  of the project, so the shared site runs on the Free plan, within its
  limits for a few users, and usage limits nudge heavy use toward
  self-hosting. The README promises that
  an AI can set up one's own instance from the public repo.

## v7 — Different question types

Its purpose needs to become clearer. Two epics, both different question
types: what a question presents beside text
and pictures (the items below), and how a question is answered beyond pressing
one of up to four — a number or a word, a place on the picture, an order, an
estimate (no items yet; whether it is in this version is open). Today the AI
turns whatever the material asks into choices of text and pictures.

1. **A simple, extensible quiz format** — the format within which extension
   happens. Open: its purpose in more words; whether it stands
   above both epics, since a kind of answer changes what an answer line means
   where a sound only adds a line like `Image:`.

2. **Audio** — some of what is practised is heard, not read: how a word
   sounds, which instrument or animal this is, a piece of music, an everyday
   sound for children who don't read yet. A quiz of text and pictures can only
   ask about such content, not present it. A sound can come from a recording
   the asker hands their AI, a recording under a free licence, or speech and
   notes an AI makes where it can; the site's part is the same for each, and
   an AI that can do more than the easy case shouldn't be held back by the
   page. Not known: whether the guidance has to say more on copyright.
   Plausible assumption, unverified: a recording carries rights beyond the
   work's, teaching exceptions differ by country and end where a room isn't a
   class, and free licences mostly ask for credit.

3. **Content in which time matters** — a still picture, text or a sound can't
   present what these people want practised or played. The cases are thought
   of, not asked for by anyone; some may be sliced off, and how any is met is
   open: a purpose shapes the problem and what can solve it, so the cases come
   first. Stored video invites trouble for the 1 GB the site holds at once.

   At school:
   - A traffic instructor visiting a primary class wants children to practise
     judging when it is safe to cross; a still has already decided it.
   - A foreign-language teacher wants pupils to understand speech in a
     situation, with gesture and setting; audio alone removes half of what
     they are meant to use.
   - A science teacher wants pupils to recognise how an animal moves: a
     horse's gaits, a bird's flight, how a snake travels.
   - A science teacher wants pupils to commit to a prediction before they see
     how an experiment comes out.
   - A physics teacher wants pupils to translate a motion they watch into a
     graph; describing the motion in words does half of it for them.
   - A media teacher wants pupils to practise telling a real clip from a
     generated or manipulated one.
   - A music teacher wants pupils to recognise a conductor's beat pattern, or
     which player in an ensemble is playing.
   - A primary teacher wants quick recognition trained, a number of dots at a
     glance, where the short time is the point.
   - A teacher wants to check what the class took from a film it watched.

   Training and exams, mostly adults, often alone:
   - A sign language teacher wants learners to recognise vocabulary; a sign
     is a movement, and a still shows a handshape.
   - A referee's or coach's instructor wants trainees to judge a situation as
     it happens: foul or not, what is wrong in this technique.
   - A first-aid or skills trainer wants a group to tell an action done right
     from a faulty one, compressions at the right rhythm.
   - A driving instructor wants learners to spot a hazard while a scene
     develops.
   - Someone preparing for a boat licence wants to recognise light signals,
     which are defined by their rhythm of flashes.
   - A workplace safety trainer wants staff to recognise hand signals, for
     cranes or marshalling, of which several are movements.
   - A medical or nursing student wants to recognise signs that are
     movements: a gait, a tremor, a seizure, a rhythm on a monitor.
   - A sports club's coach wants juniors to name what they see: a jump in
     figure skating, a throw in judo, a referee's signal.

   For fun, among people who know each other:
   - A family or a wedding party wants a quiz about its own people, with clips
     from its own phones.
   - Someone hosting a quiz evening wants a film or sport round, because such
     an evening has one.
   - Children among themselves want a round on the games and shows they know,
     from a few seconds of footage.
   - A quizmaster who wants game-show tension wants a picture that reveals
     itself gradually, the fastest to recognise it winning.

   What the cases differ in: who holds the footage (the maker's own phone, a
   course or publisher, the open web, or nobody, because it can be drawn);
   whether sound belongs to it; whether people appear in it, which touches
   "nothing identified"; and who plays: in the training cases mostly one
   learner with a quiz someone else made and handed on, a use the Project
   section doesn't name.

## The first visit

- **Whether the page reads as theirs to someone who isn't a teacher** — a
  visitor who wants a quiz for fun reads examples that share a school
  setting, for the reason in `design/root-page.md` ("What was found").
- **The button that opens a file, on a 360 × 640 phone** — an ask of seven
  lines cuts it by 2 px: Sheets in English, German and French, Notes in German
  and French. A bubble line-height of 1.4 instead of 1.45 on phones leaves it
  3 px, at the cost of every ask's lines on a phone; a baseline to beat.
- **The film and the sheets ask show the page and the example that exist** —
  a newcomer who watched the film is to meet the screens it showed
  (`film/README.md`, Situation, where its English later screens are too).
  The film draws the first screen on Idea while the page opens on Sheets;
  its lobby check has no split-screen switch; it and the root page's ask
  show the rendered sheet pages (`landing/sheet-*.webp`) where `/example`
  shows the owner's photographs of the printed sheet.
- **"This file is not a readable .zip archive."** lacks a next step for the
  visitor, where the other errors under the box have one.

## The guidance to the AI

- **Pictures that work on the wall** — what the guidance tells the AI about a
  picture that works on the projector: a tight crop, how wide and square
  figures land, what the back row can read, nothing from the sheet's solutions
  or a pupil's name in the crop.
- **The user who plays** — whether AIs work out from the page when showing the
  questions would spoil the play (`design/guidance-page.md`, Not known); no
  run on the current page.
- **Where a quiz will be read** — whether the guidance should say, now that a
  question may be read on a wall or on each device.
- **Building the quiz together** — the teacher sees the draft, pictures
  included, beside the conversation, says what needs work, and sees the
  correction. What exists: the guidance's high-density layout notation with
  `/preview.py`, and the high-fidelity `/layout`. An idea: an element that
  previews a zip on the device and edits it in local state, before the lobby
  and on any page that can hold it, handing back the zip.

## Rooms and screens

- **The room's screens aren't the classroom's** (`design/teacher-devices.md`,
  "Arrangements of screens"). Open: a Quizmaster's room with devices only
  and no wall; a wall in a Peers room.
- **Avatars the children want** (student feedback) — tools beside the animal,
  in the children's own register; the office's row is for adults and doesn't
  answer this. Of the examples on record (a lantern, a staff, a pitchfork, a
  shovel), only a blob such as the lantern survives the bar's sizes
  (`design/class-and-wall.md`, The avatars). Also
  open: whether four seconds is long enough for a child to find themselves
  among the winners; a short question beside its picture leaves ten winners
  small, because the key stays visible.
- **The empty join screen** — its right half stays blank until children join.
- **The preview** — whether Solo is the preview teachers want
  (`design/solo.md`).

### The steering bar

- An accidental Countdown can't be cancelled; the old bar had "Stop the
  countdown". In a Peers room it also shows the avatar of whoever pressed.
- The stepper under Play (the question's states, the current one marked), so
  the noun on Play reads as the next step; its room on the wall's bar is
  unmeasured.
- Whether "Answers" reads as the step that closes answering ("Votes"
  suggests majority voting).
- A press blocked by the settle window gives no feedback; the 80/450/400 ms
  timings need a real hand, clicker and phone.

## Room on the Free plan

What the limits don't cover, and what isn't known of them:
`design/hosting-and-limits.md`. Ideas per limit, for when one binds:
`scaling-drawer.md`.

- **A domain** — the owner's to decide. With an edge rule it stops a script
  spending the day's allowance for every class (`design/hosting-and-limits.md`,
  "The plan"); a name children can type would also beat `pages.dev` on the
  slowest step.
- **A lobby left waiting** — how long it holds its booking.

## Later — Paper and memory

The quiz is already made; it can be more than one activity.

- **Printables** — quick test on paper, answer sheet, review print to take
  home; not every lesson has devices.
- **A class without devices** — answers on cards the children hold up, read by
  a camera with AI recognition.
- **Corrected quiz downloadable after the run** — the in-class fixes shouldn't
  be lost for the next variant.
- **Results export** — a teacher who wants to look again.
- **Languages beyond the four** — teachers and classes who read none of
  English, German, French and Italian.
- **Formula rendering** — fractions, powers, equations on maths sheets; until
  then an image carries them.
- **Placement beyond the named layouts** — some content fits none of the
  layouts a question is placed in (`design/class-and-wall.md`, "How a
  question fills the screen"); a layout supplied with the quiz would run in
  every player's browser on the shared site.
- **Pictures for a teacher whose AI can't make a zip** — free tiers and some
  AIs may not crop figures and bundle them; e.g. attach and crop the photo in
  the lobby, or an AI-drawn figure inline in the pasted text.
- **Scripts and right-to-left text** — the guidance says "any language", but
  whether CJK, Arabic or Hebrew render correctly (font coverage on the
  projector and the students' buttons, RTL layout of question, tiles and
  ranking) is untested.
- **Sound effects and atmosphere** — some classes want it.
- **No file to carry** — the zip is downloaded from the AI and opened on the
  site by hand; an AI that hands over a link or delivers through a connector
  would spare the asker that step. Waiting: ChatGPT, much of the
  market, is blocked on nearly everything until its business tier; to see
  whether something moves there.
- **Runs by itself** — the quiz carries on while the teacher's hands are
  elsewhere (a student who needs them, the next thing to set up, a small
  group), teacher in the room, not steering. Not core purpose, but value.
  Needs a cadence with nobody pressing, a close rule per question, and a way
  back to manual. Nobody reads aloud, so it is for classes that read for
  themselves. The cheap version — close on the last student's
  answer or a maximum time, fixed generous durations for the result pages —
  messes with deliberate pauses, so it needs a proper design.
- **Fewer devices than people** in Peers — a Quizmaster's device can be
  shared (`design/class-and-wall.md`, "Sharing a device"); Peers is to fold
  it in, the + always offered. Open: the Peers layout, different
  since its devices show the question themselves, and with it whether a phone
  splits and how many share a device; team play, a mode of its own.
- **Dark mode on the players' screens** — a visitor whose device is dark gets
  every screen dark but the players' ones, which are light with no reason
  recorded, probably an oversight: models have dropped dark mode unnoticed
  before. Tolerable on Samsung Internet too.

## Housekeeping

- **`app.css` is one global namespace** (`src/DEVELOPING.md`, Layout), of
  about 340 top-level rules on short class names. The usual remedies: prefixed names for new screen parts with a build warning on
  clashes, or CSS Modules screen by screen.
- **Code paths marked "from before …"** keep data or pages older than a
  change readable (`budget.ts`, `rows.ts`, `instance.ts`, `game.ts`,
  `entry-peers.ts`, `stats.ts`). A quiz lives three hours and the ledger is
  kept by the day, so some of them may no longer run.
- **`votes: boolean`** in `shared/protocol.ts` and `client/steps.ts` means
  "locked in"; in `ScreenView` `votes` is the counts. `game.ts` calls the
  state `lockedIn`.
- **`finalSize`'s fallback branch** (`client/look.ts`), where the podium can
  overrun the height, is reached by no test.
- **`optical`** is passed through `docs/brand/build/word.py` and `lockup.py`
  and never set.
- **Lobbies left open:** `design/connections.md` says a few dozen spend a
  day's duration, `design/hosting-and-limits.md` says some 340; and the
  latter's "some 34" classes a day with a poller in each was not rechecked
  against its own figures.

## With the owner

- The read of the German, French and Italian words: the root page's, the
  screens' (`client/room-text.ts`, `check-text.ts`, `own-copy.ts`,
  `notfound.ts`), `/example`'s conversations and quizzes, the film's chat and
  quiz, and About's. Italian has no native reader on the project.
- The space run's photographs (the Idea tab): whether the site may hand them
  on in the four `.zip`s (`design/example-page.md`, Not known).
- The runs' models and plans that `example/README.md` lacks.
- The "Not sure?" tab's answer is a mock until his run replaces it. Whether
  it is on the public site is not known: the repository doesn't record
  which commit is live.
- `README.md` says "Nothing kept" while the site keeps daily counts that
  name no person, device or quiz (`design/telemetry.md`): whether and how
  the README says so.
- Two cuts he has not seen: the sentence that introduced the manual is gone
  from the root page, and "The .zip is your lasting copy." ends the note
  under Peers and Quizmaster on the check.

## In the field

Nobody has run these; walks and probe-marked rooms only.

- A class or a crowd on the live site: a Quizmaster run with a real second
  device, a Peers room on real phones, a final ranking and Exit with real
  players.
- Real tablets and phones: the file picker with a zip downloaded from a chat
  app, a killed browser tab bringing back its role, the bar and the answered
  avatars from the back row, the steering bar's double press with a real
  clicker and hand, whether children dress their avatars and see the end of
  the dressing coming; a shared device on a real iPad; an iPhone's full
  screen; a phone's pull-to-refresh on `/open`.
- A real projector: the question layouts, the pale states (hidden answers,
  faded tiles at the reveal) where pale red and pale yellow may run together
  on a washed-out one.
- A school's network: its filter on `*.pages.dev`, its Wi-Fi through
  `/check`.
- A deploy or Durable Object restart in the middle of a run, and the reset
  of an instance still active 300 s after a deploy
  (`design/open-period-in-memory.md`, Not known).
- The platform's answers once a free allowance is spent.
- AIs: fetchers other than Claude Code's WebFetch on the live page, and an AI
  building against the guidance as it now is.
- A screen reader on any page.
- An own copy set up end to end by the routes on `/own-copy`.
