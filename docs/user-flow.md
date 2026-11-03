# classyQuiz — User flow

The teacher's and the class's path through a lesson: backlog v1 items 16–19,
and the parts of items 1, 2, 3, 4 and 10 they touch. This document is the
handover for implementing them. §8 says what is already in the working tree.

**Revised 2026-11-03 for the after-upload flow** (docs/after-upload.md, draft 5;
backlog v4 item 8): §1 rules 2 and 4–7, §2, §3.2–3.5, §4 and §5 describe it.
The teacher code replaces `/teacher` and its role choice; the gate "no new
steering once students are in" and "Allow a device to join" are gone.

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
2. **Two codes, one box.** The code box in the root page's header (and the
   box on `/play` after a wrong code) routes by length; it never submits by
   itself, so typing seven isn't cut off at five.
   - **Students:** the class code, five digits, or the QR code on the wall,
     leads to `/play#<code>`. There they go straight to an avatar, or to
     "Which one are you?" when the quiz is running and absent players exist.
     The class code never reaches a teacher role.
   - **Teacher:** the teacher code, the class code plus two digits, shown as
     "63953 47" on the teacher's screens. It leads to `/play#6395347`, which
     asks one question only when the one tab there shows and steers (rule
     5). The uploading device's Resume goes in the same way, with the quiz's
     secret besides. Wrong teacher codes are limited: the fifth within a
     minute from one device refuses that device's teacher codes for this
     quiz for 10 minutes.
   - `/teacher` stays for old links: it asks for the teacher code.
3. **Two teacher roles, one tab each.**
   - The **Projector** is what the class sees.
   - The **Remote** is the teacher's own steering view.

   Roles belong to tabs, not devices: a laptop with two screens holds both in
   two windows. Each tab keeps its role token in sessionStorage. A reload,
   sleep or dropped connection resumes the same role with nothing to do.
4. **The tab you open the quiz in becomes the Projector, and it steers itself.**
   In the lobby it shows the teacher's check first, then, one tap on, the
   class's join screen (§3.3). During the quiz a slim bar carries the next
   step. One mirrored laptop needs nothing else. A clicker or the keyboard
   works on any Projector during the quiz (§3.4).
5. **A second device** types the teacher code. What happens depends on what
   is there, never on anything the site senses about the device:
   - *One tab shows and steers* (the usual case): it asks "Show the quiz
     here, or steer it from here?". **Show the quiz here:** it becomes the
     Projector, and the first tab steers, on its check. **Steer it from
     here:** it becomes the Remote, and the first tab is the wall, on the
     join screen.
   - *A Projector and a Remote, one of them gone:* no question; it takes the
     role that is free.
   - *Both there:* "This quiz already has a screen for the class and one that
     steers." A tab that is there is never pushed aside.
   - *Nothing there:* no question; it shows and steers, as a tab that just
     uploaded.

   The phone-first lesson is one answer (the laptop: Show the quiz here),
   and so is the laptop-first one (the phone: Steer it from here). "A new
   window here", on the check, opens a window that asks the same question.
   **⇄ Swap**, on either tab while both are there, makes the wall the
   steering tab and the steering tab the wall, at once and without a
   confirmation; the same tap undoes it.
6. **Phone gone.** The Remote's tab counts as gone after 45 s without a
   sign. From then on the Projector steers again with its bar, which says
   "Remote gone: type 63953 47 on another device". When the phone comes
   back, it is the Remote again. A dead phone, a closed tab or a new phone
   mid-lesson: the teacher code takes the free steering, before and after
   the first student alike.
7. **Projector gone.** The teacher reads the questions off the Remote, which
   says "Projector gone" and how to bring it back: the teacher code on the
   projector computer, which takes the free Projector without a question.

## 2. The usual lesson

Design target: a school laptop on the projector, the teacher's phone, Android
tablets, and a quiz made in the break.

| When | Teacher | Class |
|---|---|---|
| Break | Phone or laptop: the AI chat, with the sheet photos and the site's address. The AI asks what it needs and hands over the quiz as a .zip file. | — |
| Break | **Laptop:** opens `classyquiz.pages.dev` and opens the AI's .zip there (or drops it). The check: the right quiz, a spot fix, the tempo (§3.3). | — |
| Break, optional | **Phone:** `classyquiz.pages.dev`, types the teacher code "63953 47" in the box, Steer it from here. The wall says "Remote connected". Or, with two screens: "a new window here", Show the quiz here, drag it across, F. | — |
| Lesson starts | **Show the class the code ▶** (or on the wall already). "Type classyquiz.pages.dev and the number." Perhaps: "While we wait, dress your animal." | Tablets: address, code, ▶. Avatars pop up on the wall; a child who dresses theirs (a shape, a hat) sees it change there. |
| Quiz | Start on whichever tab steers; Show votes → Show answer → Next … there, or with the clicker. | Tap a colour; their avatar pops up on the wall; ✓ or ✗ with the answer. |
| End | Final ranking. "Again with another class" for the parallel class, or nothing. | Their place on their tablet. |

## 3. Screens

`[ ]` is a button, `[_]` an input, `›` expands, `⋯` a menu.

### 3.1 Root page (v4 items 1, 2, 4)

The design is docs/landing-story.md (draft 4); built 2026-11-03, decisions.md,
"The landing page: the strip, two steps, resume, four languages". Earlier
versions: "The landing page by attention budget", "The landing page, third
look".

```
┌──────────────────────────────────────────────────────────────────────┐
│ classyQuiz                         Code [_ _ _ _ _]  ▶      EN ▾     │
├──────────────────────────────────────────────────────────────────────┤
│   [two sheet pages] → [phone: photos up, .zip back] → [tablet] [wall] │
│   Your exercise sheet   Your AI   Each student taps  What the class sees │
├──────────────────────────────────┬───────────────────────────────────┤
│ Build a quiz                     │ Run a quiz                         │
│ 1 Choose any good AI.            │ ┌ Big numbers … · question 4 of 10 ┐│ only with an open
│   Claude Opus wrote the example  │ │ [Back to the quiz ▶] Class code  ││ quiz this device
│   quiz, 3 Nov 2026.              │ │ On another device: type 63953 47 ││ started, until its
│ 2 Ask it to build you a quiz for │ └──────────────────────────────────┘│ final ranking
│   classyquiz.pages.dev [Copy]    │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   For example, with photos of    │ │ [ Upload the quiz your AI      │ │
│   two pages:                     │ │   made (.zip) ] or drop it here│ │
│  ( Hi! Can you make me a quiz … )│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│     labels under the parts       │ On 3 of the last 30 days this …   │ only on a device that
│   A second message reshapes the  │                                   │ uploaded before, the
│   quiz.                          │                                   │ site full lately
├──────────────────────────────────┴───────────────────────────────────┤
│ About classyQuiz … (English, for AIs)                                 │
```

- **The block above About** speaks DE, EN, FR or IT: the device's choice
  (`cq.lang`), else the browser's language, else English. The static HTML is
  English, for AIs' fetchers. The lobby, wall, Remote and tablets stay
  English.
- **The strip** links `/example` in the chosen language until the video
  exists; no ▶. On a phone it is one row that scrolls sideways.
- **Run a quiz takes a .zip and nothing else.** The button opens the file
  chooser; a .zip can also be dropped on the box. Nothing invites pasting.
  - A file pasted with Ctrl+V (copied in the file manager) opens like a
    chosen one.
  - Text pasted or dropped anyway gets "The site takes the quiz as a .zip
    file, not as text. Your AI can make the quiz as one .zip file, to
    download from the chat and upload here." It is counted as "paste".
  - Any other file gets "The site takes the quiz as a .zip file, not a
    .docx file." and the same sentence. Attempts are counted by format.
  - No connection, or an answer that isn't the site's (a filter's page):
    the network is named as a possible cause, with "What to tell IT ›" to
    `/check#it`.
- **Problems with the quiz:** listed in place, with "Copy the message for your
  AI" (which asks for a corrected .zip, in English), plus "Continue without
  these pictures" when it's pictures.
- **On success:** straight to the check, in this tab as the Projector.
- **Coming back (v4 item 2):** the latest quiz this device started, while it
  hasn't reached its final ranking: its title, where it stands, Back to the
  quiz (`/play#` + the teacher code), the class code, and "On another device:
  type 63953 47 in the code box". No closing time, no Delete, no older
  quizzes.
- **The own copy (v4 item 4):** one line under Run, only on a device that has
  uploaded before (`cq.days`, dates only) and only when the site refused an
  upload on a day of the last 30 (`GET /api/site`).
- **The network check** is no longer on the root page: the upload error,
  the wall's "Nobody in yet?" line after 90 s, and a device that can't
  reach the quiz carry the help where the failure shows (landing story §7).

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

Teacher (`/play#6395347`, the teacher code typed in the box; Resume on the
uploading device), when one tab shows and steers:

```
┌──────────────────────────────┐
│ Prozente                     │
│ [ Show the quiz here ]       │
│   the class watches this     │
│   screen                     │
│ [ Steer it from here ]       │
│   Start, next, the answers   │
└──────────────────────────────┘
```

Otherwise there is no question (rule 5): it takes the free role, or says
both are there, with "Try again". The question is acted on once, as the
device arrives: a device left lying on the question never takes a role by
itself later. A wrong teacher code shows the box again with "That isn't
this quiz's teacher code."; after five, "Too many wrong codes for this quiz.
Try again in a few minutes." `/teacher#63953`, the old way in, shows the
same box with the class code in it.

### 3.3 The lobby: the check, then the join screen (item 19; docs/after-upload.md §3)

The single tab, which shows and steers, has two screens. **The check is the
teacher's** (the questions, the fixes, the teacher code, the tempo); **the
join screen is the class's** (title, address, class code, QR, count,
avatars, Start). The teacher shares the screen when they choose; the site
doesn't know whether it is shared.

```
┌────────────────────────────────────────────────────────────┐
│ Prozente · 12 questions                 Class code 63953   │
│                               [ Show the class the code ▶ ]│
│  Tempo: Teacher's pace ›                                   │
│  A second device, to steer from or to show the quiz on:    │
│  on classyquiz.pages.dev, type 63953 47. Or a new window   │
│  here.                                                     │
│   12 questions                         [Show all answers]  │
│    1  Was sind 10% von 250?                             ›  │
│    2  Eine Jacke kostet 80 Franken …                    ›  │
│   …                                               ⋯ More   │
└────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────┐
│ Prozente                                                   │
│   classyquiz.pages.dev   ┌─────┐   👤 6                     │
│   6 3 9 5 3              │ QR  │   🐱 🐻 🐷 🐧 🐭 🐼          │
│                          └─────┘                           │
│                    [ Start quiz ▶ ]                        │
│               Tempo: Teacher's pace ›                      │
│     ‹ Questions        A second device ›        ⋯          │
└────────────────────────────────────────────────────────────┘
```

A question opened (or all of them, with Show all answers / Hide answers):

```
│    2  Eine Jacke kostet 80 Franken …                    ⌄  │
│       ▲ 55 Franken  ◆ 20 Franken  ● 75 Franken  ✓■ 60 Fr.  │
│       Change the right answer                              │
```

- **The tab that uploaded opens on the check;** "Show the class the code ▶"
  is the one tap to the join screen, "‹ Questions" the way back. The tab
  remembers which it shows (sessionStorage): a reload stays there. A wall
  that takes the steering back in the lobby (its Remote left or went away)
  shows the join screen.
- **The class code is on the check, small,** with the count once someone
  has joined: a teacher who reads it aloud has the class joining without the
  tap.
- **The teacher code sits at rest** on the check, in one sentence naming
  both needs; on the join screen it is behind "A second device ›", a sheet.
  "a new window here" (hidden on a phone) opens a window that asks the same
  question as any other device.
- **Answers start folded,** so a shared check shows no key until the
  teacher presses a button that says it shows the answers.
- **"Change the right answer"** makes the answers tappable ("Tap the answers
  that count."), with Void, Skip it and Done.
- **The site's warnings** (the same answer twice, the right answer always in
  one place) sit above the list, one muted line each.
- **Avatars** can be tapped to remove a double.
- **Start reads "Start quiz ▶"** on every screen that steers. The mode is
  named where there is a choice: on the second device's question.
- **Tempo**, one muted line on both screens, as before: "Tempo: Teacher's
  pace ›", or what the quiz says, e.g. "Countdown, 20–40 s". It opens a
  sheet with Teacher's pace, Countdown, and Countdown and points for speed.
  There are no lengths in the sheet; see §3.7. (Backlog v4 item 6 replaces
  it with a points-for-speed switch, in delivery B.)
- **⋯:** Players · A second device… · Leave · Delete the quiz…

The Remote's lobby is the check in one column: the class code large, the
count and avatars, the tempo, the teacher code's sentence, "Projector ✓ ·
⇄ Swap" while the wall is there, and the questions, with Start quiz pinned at
the bottom. Without a wall it says how to bring one: "On the projector
computer: on classyquiz.pages.dev, type 63953 47." A Projector that doesn't
steer shows only the class's part (address, code, QR and avatars), with
⇄ Swap faint in its corner beside Full screen and ⋯.

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
  ranking now · Players · A second device… · Leave · Delete the quiz…
- **⋯ while a Remote steers:** ⇄ Swap · Leave. (Swap replaces "Steer from
  here", which left the phone stranded; the wall steers by itself 45 s after
  the Remote is gone.)
- **Notices on the wall:** "Remote connected", and "Remote gone – steering
  here". While a Remote that was there is away, the bar keeps "Remote gone:
  type 63953 47 on another device"; on a phone-sized wall it gives way, and
  ⋯ → A second device… has the code.
- **A window opened by "a new window here"** that answered "Show the quiz
  here" says "Drag this window to the projector screen, then press F for
  full screen" until it is full screen.

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
- **Pictures as answers** (v3 item 1): each picture sits on its tile's
  colour, which shows where the picture is transparent, with its shape
  beside or above it.
  The tiles are arranged by the pictures' shape (two by two, four in a
  row, one under the other); a question's own picture sits in a band
  beside its text, or between text and tiles. The votes and the answer
  mark these tiles as they do text tiles, and nothing moves.

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
- **Projector gone:** "Projector gone. On the projector computer: on
  classyquiz.pages.dev, type 63953 47." On a wide screen also "open the
  projector window here".
- **Waiting for** shows the avatars of the students who are there and
  haven't answered, once at most six are left, until the votes.
- **⋯:** Skip this question · Change the right answer · Final ranking now ·
  All questions · Players · ⇄ Swap (while the wall is there) · Stop being
  the remote · Delete the quiz…

### 3.6 Student

The student screens are as in v1, with the lobby's pictures to dress the
animal (docs/avatars.md §3): avatar and 👁 in the lobby, colour
buttons, locked with 👁 at the votes, ✓ or ✗ with the answer, place and
stars at the ranking. Picture answers show their pictures on the buttons,
from a small copy fetched once in the lobby, and the chosen picture under
the ✓ or ✗. A tablet
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
- **Laptop with two screens.** "a new window here", Show the quiz here, drag it, F. Placing
  the window on the second screen automatically (the Window Management API)
  is untried.
- **Phone only, no projector.** The phone is a Projector that steers itself.
  The teacher reads aloud, and the tablets show the answers' text.
- **Everything on the phone, then the laptop.** The phone uploads; on the
  laptop at the projector, the teacher code, Show the quiz here. The phone
  steers, on its check.
- **Evening before.** Open the .zip at home, then Resume on the same device
  next day. On another device, type the teacher code, or open it again.
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
| Phone dies, or goes to the AI app for long | After 45 s the wall says "Remote gone – …", shows the bar, and keeps "Remote gone: type 63953 47 on another device" on it | Steer at the laptop. The phone is the Remote again when it's back; without its tab, or another phone: the teacher code, which takes the free steering without a question |
| A wrong answer to the second device's question | The wall steers where the phone should, or the other way round | ⇄ Swap, on either device |
| Projector dies | The Remote says "Projector gone" and how to bring it back | Read off the Remote. Optionally another computer: the teacher code (the free Projector, after 45 s), or the projector window on a two-screen laptop |
| Wrong code | Students: the code, ✗, the box. Teacher: "That isn't this quiz's teacher code." | Type it again; after five wrong teacher codes in a minute, that device waits 10 minutes |
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
| After upload (v4 item 8) | Done: the check, then the join screen; the teacher code in the students' box; the one question; ⇄ Swap; `/example`. §1 rules 2, 4–7, §3.2–3.5; decisions.md, "After upload: the check, the teacher code, one question, Swap" |
| Landing page (v4 items 1, 2, 4) | Done: the strip, Build in two steps with the labelled ask, Run with the resume card, the own-copy line, four languages; the network help at the upload, the wall's lobby, the tablet and `/check#it`. §3.1; decisions.md, "The landing page: the strip, two steps, resume, four languages" |
| Pictures as answers (v3 item 1) | Done: `+ Image: b.png` answer lines; picture tiles on the wall (§3.4), pictures on the students' buttons from one pack per device (§3.6), thumbnails with the key in the question list and on the Remote (§3.3, §3.5). decisions.md, "Pictures as answers" |
