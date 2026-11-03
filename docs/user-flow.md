# classyQuiz — User flow

The teacher's and the class's path through a lesson: backlog v1 items 16–19,
and the parts of items 1, 2, 3, 4 and 10 they touch. This document is the
handover for implementing them. §8 says what is already in the working tree.

**Revision 3, 2026-11-02.** This revision folds in the owner's answers to the
second design:
- **Roles redefined (item 18).** Children must not take the Remote by
  accident. Both teacher screens are set up before the class gets the code.
  Only three cases need handling:
  - a tab that loses its connection comes back in the same role;
  - when the phone is gone, the projector takes over the steering;
  - when the projector is gone, the teacher reads the questions off the phone.

  The first draft's "any tab with the code picks a free role" is dropped.
- **Code per quiz,** confirmed.
- **Build a quiz:** the first draft's English sentence to copy contradicted
  "write in your quiz's language". Now only the address is copied.
- **Paste or .zip, no single text files (item 2).** The Run box must not read
  as a place to talk to an AI.
- **The quiz carries no notes (item 1).** The AI talks to the teacher in its
  chat, before the quiz is handed over.

## 1. The model

1. **One code per quiz.** It is made at upload and lives as long as the quiz:
   until it is deleted, or 48 h after the last teacher action. The class
   joins with it. "Again with another class" keeps it.
2. **Two entrances.**
   - **Students:** the code box in the root page's header, or the QR code on
     the wall, leads to `/play#<code>`. There they go straight to an avatar,
     or to "Which one are you?" when the quiz is running and absent players
     exist. A student device offers no teacher choice.
   - **Teacher:** `/teacher#<code>` (typed, or Resume on the root page) offers
     **Projector** and **Remote**. A role is offered while free.
3. **Two teacher roles, one tab each.**
   - The **Projector** is what the class sees.
   - The **Remote** is the teacher's own steering view.

   Roles belong to tabs, not devices: a laptop with two screens holds both in
   two windows. Each tab keeps its role token in sessionStorage. A reload,
   sleep or dropped connection resumes the same role with nothing to do.
4. **The tab you open the quiz in becomes the Projector, and it steers itself.**
   In the lobby it shows the teacher's lobby (§3.3). During the quiz a slim
   bar carries the next step. One mirrored laptop needs nothing else. A
   clicker or the keyboard works on any Projector during the quiz (§3.4).
5. **Splitting the roles:**
   - *Phone as Remote:* on the phone, `/teacher` and the code, then Remote.
     The Projector stops showing its bar.
   - *Second screen:* "a new window here" in the lobby's sentence. The new window
     takes the Projector, and the first tab turns into the Remote.
   - *Opened on the phone:* on the projector computer, `/teacher`, the code,
     then Projector. The phone's tab turns into the Remote.

   A Projector that steers itself can be taken over by another tab. That tab
   becomes the Projector, and the old one the Remote.
6. **Phone gone.** The Remote's tab counts as gone after 45 s without a
   sign. From then on the Projector steers again with its bar. On the
   Projector, ⋯ → "Steer from here" does the same at once. When the phone
   comes back, it is the Remote again. Once students are in, a phone without
   its tab gets back in two ways: a device that set the quiz up (opened the
   .zip, or took a role in the lobby) takes its role at `/teacher` directly;
   any other device needs "Allow a device to join" on the wall first. When
   nothing steers at all, any device at `/teacher` takes a role.
   docs/second-teacher-device.md.
7. **Projector gone.** The teacher reads the questions off the Remote, which
   says "Projector gone" and how to bring it back. A Projector whose tab is
   gone is offered again at `/teacher`, so another computer can take it.

## 2. The usual lesson

Design target: a school laptop on the projector, the teacher's phone, Android
tablets, and a quiz made in the break.

| When | Teacher | Class |
|---|---|---|
| Break | Phone or laptop: the AI chat, with the sheet photos and the site's address. The AI asks what it needs and hands over the quiz as a .zip file. | — |
| Break | **Laptop:** opens `classyquiz.pages.dev` and opens the AI's .zip there (or drops it). The lobby is on the wall (§3.3). | — |
| Break, optional | **Phone:** `classyquiz.pages.dev/teacher`, the code, Remote. The wall says "Remote connected". Or, with two screens: "a new window here", drag it across, F. | — |
| Lesson starts | "Type classyquiz.pages.dev and the number." Perhaps: "While we wait, dress your animal." | Tablets: address, code, ▶. Avatars pop up on the wall; a child who dresses theirs (a shape, a hat) sees it change there. |
| Quiz | Start on whichever tab steers; Show votes → Show answer → Next … there, or with the clicker. | Tap a colour; their avatar pops up on the wall; ✓ or ✗ with the answer. |
| End | Final ranking. "Again with another class" for the parallel class, or nothing. | Their place on their tablet. |

## 3. Screens

`[ ]` is a button, `[_]` an input, `›` expands, `⋯` a menu.

### 3.1 Root page (item 16)

Revised 2026-11-03 for the owner's attention budget (item 16) and zip only
(item 2); decisions.md, "The landing page by attention budget". Revised
again for his third look; decisions.md, "The landing page, third look".

```
┌────────────────────────────────────────────────────────────┐
│ classyQuiz                            Code [_ _ _ _ _]  ▶  │
├────────────────────────────────────────────────────────────┤
│  Build a quiz                                              │
│  1  Use a good AI. Claude's free version works …           │
│  2  Ask it, in your own words, to build you a quiz for     │
│     classyquiz.pages.dev [Copy]                            │
│       – Fastest: photos or PDFs, your quiz's language,     │
│         how many questions and what kind                   │
│       – Or leave it open and steer turn by turn.           │
│       – You can also ask it how the quizzes work …         │
│                                                            │
│  Run a quiz                                                │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │       [ Upload the quiz your AI made (.zip) ]        │  │
│  │                    or drop it here                   │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│  Resume Prozente ▶                  closes 16:20  Delete…  │  only on a device that
│  ▸ 1 more quiz                                             │  opened it, while open
│                                                            │
│  Some school networks block live quizzes. A quick check,   │
│  run on the school's Wi-Fi, shows whether yours does and,  │
│  if so, what to tell IT.                                   │
│  This site is free and shared by everyone who uses it,     │
│  with room for a few dozen classes a day. An AI can set up │
│  a copy just for your classes, also free: how that works.  │
├────────────────────────────────────────────────────────────┤
│  About classyQuiz (the guidance for AIs, static HTML)      │
```

- **Run a quiz takes a .zip and nothing else.** The button opens the file
  chooser; a .zip can also be dropped on the box. Nothing invites pasting.
  - A file pasted with Ctrl+V (copied in the file manager) opens like a
    chosen one.
  - Text pasted or dropped anyway gets "The site takes the quiz as a .zip
    file, not as text. Your AI can make the quiz as one .zip file, to
    download from the chat and upload here." It is counted as "paste".
  - Any other file gets "The site takes the quiz as a .zip file, not a
    .docx file." and the same sentence. Attempts are counted by format.
- **Problems with the quiz:** listed in place, with "Copy the message for your
  AI" (which asks for a corrected .zip), plus "Continue without these
  pictures" when it's pictures.
- **On success:** straight to the lobby, in this tab as the Projector.
- **Coming back (item 17):** the latest quiz this device opened that is still
  open, as one line under the box; any others fold under "n more quizzes".
  A title uploaded again is one line, the newest upload; Delete… ends every
  upload of it on this device. On a laptop the lines align as columns; on a
  phone each is two lines.
  - Resume goes to `/teacher#<code>`.
  - "closes 16:20" is the only place the product mentions the closing time.
  - Delete… sits at the far end of the line and asks inline: "Delete
    *Prozente*? The class can't join it any more. [Delete] [Keep]".
  - Closed quizzes drop off the list.
- **The two lines at the foot** say what their links are for:
  - `/check` ends in one of three verdicts; the two that aren't "all good"
    carry a message to forward to IT, with the site's address in it.
  - `/own-copy` is the self-hosting guide for a teacher (item 14).
- "About this site" is gone: the guidance below is for the AI, and a teacher
  who scrolls finds it anyway.

### 3.2 The two entrances after a code

Students (`/play#63953`) get no screen of their own:
- in the lobby, straight to their avatar, with two rows of pictures below
  it to dress it until Start: six background shapes in its colour and
  eight hats (docs/avatars.md);
- once running, "Which one are you?" with the absent players' avatars and
  **+**, when there are any; a tablet whose avatar another device took
  back while it was away gets the same choice when it returns;
- after the start, tablets still arriving get in, however many: during
  the first five minutes and the whole first question. After that, five
  more, then "This quiz has started and takes no more players. Ask your
  teacher.";
- after the final ranking, a trophy and ←;
- with a wrong code, the code, ✗, and the code box again.

Teacher (`/teacher#63953`; `/teacher` alone asks "The quiz's code:"):

```
┌──────────────────────────────┐
│ Prozente                     │
│ This screen is the…          │
│ [ Projector    ] [ Remote  ] │
│  shows the quiz   steers the │
│  to the class     quiz       │
└──────────────────────────────┘
```

A role held by a live tab is greyed and says "in use". If its tab has gone
quiet, it says "in use – free in under a minute" and becomes a button by
itself.

### 3.3 Lobby, on the tab that steers (item 19)

On a single laptop this screen is the wall and the teacher's view at once.
What the class needs is on top and large; what the teacher checks is below
the fold.

```
┌────────────────────────────────────────────────────────────┐
│ Prozente                                                   │
│   classyquiz.pages.dev   ┌─────┐   👤 6                     │
│   6 3 9 5 3              │ QR  │   🐱 🐻 🐷 🐧 🐭 🐼          │
│                          └─────┘                           │
│          [ Start as Projector + Remote ▶ ]                 │
│               Tempo: Countdown, 20–40 s ›                  │
│   For a separate projector and remote, open                │
│   classyquiz.pages.dev/teacher on the other screen (a      │
│   phone, another computer, or a new window here), type     │
│   63953 and choose.                                        │
├──────────────────────── below the fold ────────────────────┤
│   12 questions                         [Show all answers]  │
│    1  Was sind 10% von 250?                             ›  │
│    2  Eine Jacke kostet 80 Franken …                    ›  │
│   …                                               ⋯ More   │
└────────────────────────────────────────────────────────────┘
```

A question opened (or all of them, with Show all answers / Hide answers):

```
│    2  Eine Jacke kostet 80 Franken …                    ⌄  │
│       ▲ 55 Franken  ◆ 20 Franken  ● 75 Franken  ✓■ 60 Fr.  │
│       Change the right answer                              │
```

- **Answers start folded,** so a mirrored laptop shows no key until the
  teacher presses a button that says it shows the answers.
- **"Change the right answer"** makes the answers tappable ("Tap the answers
  that count."), with Void, Skip it and Done.
- **The site's warnings** (the same answer twice, the right answer always in
  one place) sit above the list, one muted line each.
- **Avatars** can be tapped to remove a double.
- **Start says the mode** (item 19): this screen is the Projector and the
  Remote at once. "Projector + Remote" uses the two names `/teacher` offers.
- **Tempo**, one muted line under Start: "Tempo: Teacher's pace ›", or what
  the quiz says, e.g. "Countdown, 20–40 s". It opens a sheet with Teacher's
  pace, Countdown, and Countdown and points for speed. There are no lengths
  in the sheet; see §3.7.
- **One sentence** says how to split the roles. "a new window here" opens
  the projector window (hidden on a phone). It shows until the first student
  is in, and becomes "Remote connected ✓" once a Remote is there.
- **⋯:** Players · Leave · Delete the quiz…

The Remote's lobby is the same in one column, with Start quiz pinned at the
bottom. It names the projector line until a Projector is there: "On the
projector computer: open classyquiz.pages.dev/teacher, type 63953, choose
Projector." A Projector that doesn't steer shows only the class's part:
address, code, QR and avatars.

### 3.4 Projector during the quiz

The v1 screens (question, reveal, ranking, final), with the code in a corner
throughout. While it steers, the bottom line is the bar:

```
│ ⋯   classyquiz.pages.dev · 63953   [−5] ⏱25 s [+5]  [Ranking] [Next ▶] │
```

- **With a countdown in play** the bar also carries the −5/+5 pair (§3.7).
  On a phone the code gives way to it.
- **The bar's main button** is the next step: Go, Show votes, Show answer,
  Next or Final ranking. Space, Enter, →, ↓, PageDown, N and a clicker do the same;
  F toggles full screen. No key starts the quiz from the lobby (Start is
  the button), a key held with Ctrl, Alt or Windows/Cmd does nothing, and
  while a Remote steers only a clicker's keys (PageDown, →, ↓) move on
  from the Projector.
- **⋯ while steering:** Skip this question · Change the right answer · Final
  ranking now · Players · Allow a device to join (once students are in) ·
  Leave · Delete the quiz…
- **⋯ while a Remote steers:** Steer from here · Leave.
- **Notices on the wall:** "Remote connected", and "Remote gone – steering
  here". While a Remote that was there is away, the bar keeps "Remote gone
  [Allow a device to join]"; while that is open, "One device can join at
  /teacher [Close]".
- **A window opened by "a new window here"** says "Drag this window
  to the projector screen, then press F for full screen" until it is full
  screen.

**A question, its votes, its answer** (backlog v2 items 6 and 7; decisions.md,
"Spread, then key; who has answered, on the wall"). The same steps at the
teacher's pace and with a countdown, after Go:

| Step | Wall | Tablets | Steering tab |
|---|---|---|---|
| The question | the question and tiles; in the bar at the top, the avatar of each student whose answer has arrived pops in, and "answered / of" | buttons | the counts with the key; **Show votes** |
| Show votes | each tile's count and a bar; no tick, nothing faded | buttons locked, the chosen one marked, 👁 | "The votes are on the wall, without the right answer"; **Show answer** |
| Show answer | the tick, the other tiles faded | ✓ or ✗ | Ranking, Next |

- **Show votes closes answering**, as time's up does. A tap made before the
  tablet showed it closed still counts when it arrives, and the votes grow
  by one.
- **Only students who have answered appear**, in the order the answers
  arrive, never with the colour of their answer. Nobody is shown as
  missing; the Remote shows the teacher the last few it waits for.
- **"Of"** counts the devices that are there, or that answered and went
  away since: a tablet away for 45 s stops holding it below full. When
  everyone there has answered, the count turns green.
- **Nothing moves** on the wall between the question, the votes and the
  answer: the bar has a fixed height, and the tiles keep room for the count
  and tick from the start.

### 3.5 Remote during the quiz

```
┌──────────────────────────────┐
│ Prozente   2/12   63953    ● │
├──────────────────────────────┤
│ Eine Jacke kostet 80 Franken │
│ … Wie viel kostet sie jetzt? │
│   ▲ 55 Franken            3  │
│   ◆ 20 Franken            1  │
│   ● 75 Franken            2  │
│ ✓ ■ 60 Franken           12  │
│ Change the right answer      │
│ 18 of 22 answered · 1 away   │
│ Waiting for 🐸 🐻 🐷 🐧        │
├──────────────────────────────┤
│ [⋯]        [ ▥ Show votes ]  │
└──────────────────────────────┘
```

- **The buttons:** Show votes, then Show answer, during a question;
  Ranking and Next after the answer; Final ranking after the last question; "Again with another class"
  at the end, which opens a new lobby with the same code and keeps the
  corrections.
- **Waiting for** shows the avatars of the students who are there and
  haven't answered, once at most six are left, until the votes.
- **⋯:** Skip this question · Change the right answer · Final ranking now ·
  All questions · Players · Show the projector here · Stop being the remote ·
  Delete the quiz…

### 3.6 Student

The student screens are as in v1, with the lobby's pictures to dress the
animal (docs/avatars.md §3): avatar and 👁 in the lobby, colour
buttons, locked with 👁 at the votes, ✓ or ✗ with the answer, place and
stars at the ranking. A tablet
still showing the previous class is told "This quiz has finished"; it
doesn't slip into the next class's lobby. A tablet switched off after the
previous class and opened again for the next one joins it like any other.

### 3.7 Tempo: countdown and points for speed (v2 items 2, 3)

Off by default, unless the quiz says otherwise: `Tempo: countdown` or
`Tempo: speed` before the first question, `Time: 30` (10 to 60 s) for one
question or all; without `Time:`, 60 s. The lobby shows what the quiz says,
and the teacher can switch the tempo there. In ⋯ during the quiz it changes
from the next question on. With a countdown, each question has one more
step:

| Step | Wall | Tablets | Steering tab |
|---|---|---|---|
| Next | the question and picture; tiles coloured, without text | the eye | **Go ▶** ("The class reads the question…") |
| Go | the answers; a bar drains along the top edge | buttons, the same bar | the bar; **Show votes** |
| Time's up, or all present answered | the bar empty, a timer by the count | buttons locked, the chosen one marked | "Time's up: answering is closed"; **Show votes** |
| Show votes, Show answer | as at the teacher's pace (§3.4); the bar gone | as at the teacher's pace, and "+13" with speed points at the answer | as at the teacher's pace |

- The clicker's next step from reading is Go; it ignores a second press
  within 0.7 s.
- ⋯ while the clock runs: "Stop the countdown: answers stay open"; after
  time's up: "Open the answers again, without a countdown"; at any time:
  "Tempo: …" (from the next question on).
- With speed points the ranking shows points, not "right out of n".
- **−5 / +5** (owner's decomposition, v2 item 2), on whichever tab steers:
  the Remote's card ("Countdown [−5] ⏱ 25 s [+5]"; "Next countdown" once
  this one is over or at the reveal), and the wall's steering bar. It acts
  on the countdown being read or running, else the next one, and every one
  after, each against its own `Time:`, within 10 to 60 s. A running bar
  changes at once on every screen; cut below the time gone, answering
  closes. Not in the lobby. It carries over to "Again with another class".

## 4. Variants

- **One laptop, mirrored.** The Projector steers itself all lesson. Changing
  a key before the reveal shows it on the wall; the button says what it does.
- **Laptop with two screens.** "a new window here", drag it, F. Placing
  the window on the second screen automatically (the Window Management API)
  is untried.
- **Phone only, no projector.** The phone is a Projector that steers itself.
  The teacher reads aloud, and the tablets show the answers' text.
- **Evening before.** Open the .zip at home, then Resume on the same device
  next day. On another device, use `/teacher` and the code, or open it again.
- **Two quizzes** (6a, 6b): two .zip files, two codes, two Resume lines.

## 5. When something goes wrong

| What happens | What they see | What they do |
|---|---|---|
| Tablet sleeps, Wi-Fi drops | Same avatar and screen on waking | Nothing |
| Tablet dies | — | Another tablet: code, own avatar under "Which one are you?" (it appears within a minute). Score kept |
| The dead tablet comes back after that | "Which one are you?" with **+** | Leave it, or **+** for another student |
| Tablets still joining after Start | They get in (first five minutes and the first question; then five more) | Nothing |
| A tablet from the last lesson, left at its final ranking | "This quiz has finished" and ← | ←, then the code |
| Any teacher tab reloads, sleeps or loses Wi-Fi | The same role again | Nothing |
| Phone dies, or goes to the AI app for long | After 45 s the wall says "Remote gone – …", shows the bar, and keeps "Remote gone [Allow a device to join]" on it | Steer at the laptop. The phone is the Remote again when it's back; without its tab, Resume or `/teacher` on it (set up in the lobby), else Allow a device to join on the wall first |
| Projector dies | The Remote says "Projector gone" and how to bring it back | Read off the Remote. Optionally another computer: `/teacher`, code, Projector (offered after 45 s), or the projector window on a two-screen laptop |
| Wrong code | "No quiz with the code …" | Type it again |
| Quiz closed or deleted | Gone from the Run box; open screens say "This quiz has ended" | Open the .zip again |
| School network blocks WebSockets | Nothing; a moment slower (v1 fallback) | Nothing |

## 6. Decisions to record in decisions.md once built

These entries are superseded, in part or whole:
- Continuity (the teacher link);
- Pairing devices;
- Key check on a screen that may be projected;
- Flow of a run (a new code per class);
- Joining and rejoining (a code per run, "8 hours" projector resume);
- Single mirrored laptop (now the starting point).

New entries:
- one code per quiz and its renewal (`CODE_SLACK_MS`);
- roles per tab with sessionStorage tokens;
- the two entrances;
- presence: 25 s "quiet", 45 s "away";
- a Projector that steers itself while no Remote is there;
- "movable", the self-steering Projector taken over by another tab;
- legacy instances refused with "paste it again";
- the zip-only upload and the not-a-quiz message;
- deploy note: state Worker migration `v3` deletes the `Pairing` class.

## 7. Not established

- Whether "Projector" and "Remote" are the words a teacher reaches for.
- Whether 45 s is right for a phone in a pocket. It is the tablets' away
  detection.
- Whether AIs explain the run well enough for Build step 3. This needs a
  fetch test of the new guidance. The test should also check that the
  page's new top doesn't trip injection guards.
- "Free Claude works" is the owner's statement; it is untested here.
- `navigator.clipboard.readText()` behaviour on the school's Android tablets
  and Edge. The long-press box is the fallback.
- Whether children find the code box in the header. The first lesson will
  show.

## 8. As built (2026-11-03)

On top of main at 8959cc4 (the pictures merge). Built and run: both
typechecks, 64 tests, the simulator in both modes, and headless Edge
through the real pages. What was built, the differences from this design,
and the evidence are in decisions.md, "One code per quiz, two teacher roles
per tab", including the product owner's gate: once the class has a
student, no new tab gets the steering, which narrows §1 rules 5–7.

| Area | State |
|---|---|
| Notes removal (item 1) | Done: format, tests, guidance, protocol, views; decisions.md "The quiz carries no notes" |
| Server (`instance.ts`, `directory.ts`, API, migration `v3`) | Done and run. Fixed while running it: a role handed over counts as present at once; a tab whose role moved while it was between polls is told so; a closed teacher socket fades over 45 s instead of at once; an HTTP command from a tab whose role moved gets the message, not a 404 |
| `client/net.ts` | A tab without a view (role or avatar choice) on HTTP no longer polls three times a second |
| Root page | Run in the browser. The Build copy is a draft for the owner to judge on the live site: only the address is copied; "in your own words" and "write in the language the quiz should be in" replace the English sentence |
| Projector, Remote, `/teacher`, students | Styled in `public/app.css` and run; the obsolete pairing, notes and key-check rules removed. Changes to §3.3/§3.4 listed in decisions.md |
| `scripts/simulate.mjs` | Rewritten for the roles (see decisions.md) |
| Pictures on the screens | Done: the projector puts the picture between question and tiles or beside them, enlarges it (Z, a click, the Remote), and shows backgrounds; thumbnails in the question list (§3.3), the picture on the Remote's current question (§3.5), "Hide the picture" among the fixes. decisions.md, "Pictures on the screens" |
| Answer order | Done: answers shuffled per class at upload and for "Again", the same on every screen including the lobby list (§3.3) and the Remote (§3.5); `Order: fixed` keeps a question as written. decisions.md, "Answers shuffled at upload" |
| Spread, then key; who has answered (v2 items 6, 7) | Done: Show votes, then Show answer, on every steering tab and the clicker; avatars popping into the wall's bar as answers arrive; "of" without away devices; the Remote's "Waiting for". §3.4, §3.5, §3.7; decisions.md, "Spread, then key; who has answered, on the wall" |
| Avatars the children dress (v2 item 5) | Done: a shape and a hat in the lobby, live on the wall and the Remote with a wiggle, fixed at Start; the lobbies' avatar rows kept in place. docs/avatars.md; decisions.md, "Avatars the children dress" |
