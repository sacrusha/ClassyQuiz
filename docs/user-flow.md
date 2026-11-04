# classyQuiz — User flow

The teacher's and the class's path through a lesson, screen by screen, with the
words on them. The purpose of each part and the reasons for its shape are in
docs/design/; this file says what the screens show.

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
     secret besides. Wrong teacher codes are limited per device and per quiz,
     the uploading device exempt (docs/design/teacher-devices.md, "Wrong
     teacher codes").
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
     steers." A tab that is there is never pushed aside. A Remote whose tab
     closed, or that hasn't been heard from for 25 s, isn't there for this:
     the teacher code takes it at once.
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
   "Remote gone"; the teacher code itself is on the
   wall only under ⋯ → A second device…, not in the bar in front of the
   class. When the phone comes back, it is the Remote again. A dead phone, a
   closed tab or a new phone mid-lesson: the teacher code takes the
   steering, before and after the first student alike, and a closed tab's
   at once (rule 5).
7. **Projector gone.** The teacher reads the questions off the Remote, which
   says "Projector gone" and how to bring it back: the teacher code on the
   projector computer, which takes the free Projector without a question.

## 2. The usual lesson

Design target: a school laptop on the projector, the teacher's phone, Android
tablets, and a quiz made in the break.

| When | Teacher | Class |
|---|---|---|
| Break | Phone or laptop: the AI chat, with the sheet photos and the site's address. The AI asks what it needs and hands over the quiz as a .zip file. | — |
| Break | **Laptop:** opens `classyquiz.pages.dev` and uploads the AI's .zip there (or drops it). The check: the right quiz, a spot fix (§3.3). | — |
| Break, optional | **Phone:** `classyquiz.pages.dev`, types the teacher code "63953 47" in the box, Steer it from here. The wall says "Remote connected". Or, with two screens: "open a second screen in a new window", Show the quiz here, drag it across, F. | — |
| Lesson starts | **Let the class in ▶** (or on the wall already). "Type classyquiz.pages.dev and the number." Perhaps: "While we wait, dress your animal." | Tablets: address, code, ▶. Avatars pop up on the wall; a child who dresses theirs (a shape, a hat) sees it change there. |
| Quiz | Start on whichever tab steers; Play: Choices → Answers → Solution → Ranking → Question 2, and Countdown when the class should hurry, there or with the clicker. | Tap a colour; their avatar pops up on the wall; ✓ or ✗ with the answer, and those right see their avatar jump on the wall. |
| End | Final ranking. "Again with another class" for the parallel class, or nothing. | Their place on their tablet. |

## 3. Screens

`[ ]` is a button, `[_]` an input, `›` expands, `⋯` a menu.

### 3.1 Root page

Purpose and reasons: docs/design/root-page.md.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [fox] classyQuiz                   Code [_ _ _ _ _]  ▶      EN ▾     │
├──────────────────────────────────────────────────────────────────────┤
│ [two sheet pages] → [phone: photos up, .zip back] → [laptop: .zip up] │
│   → [wall] [tablets, fanned]                                         │
│ Your exercise sheets · Your AI · The .zip, uploaded here ·           │
│ What the class sees · Each student taps  The example, step by step › │
├──────────────────────────────────┬───────────────────────────────────┤
│ Build a quiz                     │ Run a quiz                         │
│ 1 Choose any good AI.            │ ┌ Big numbers … · question 4 of 10 ┐│ only with an open
│   Claude Opus wrote the example  │ │ [Back to the quiz ▶] Class code  ││ quiz this device
│   quiz, 3 Nov 2026.              │ │ On another device: type 63953 47 ││ started, until its
│ 2 Ask the AI to build you a quiz │ └──────────────────────────────────┘│ final ranking
│   for classyquiz.pages.dev [Copy]│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   For example, with photos of    │ │ [ Upload the quiz your AI      │ │
│   two sheets:                    │ │   made (.zip) ] or drop it here│ │
│  ( Hi! Can you make me a quiz … )│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│     labels under the parts       │ On 3 of the last 30 days this …   │ only on a device that
│   Or, with nothing decided yet:  │                                   │ uploaded before, the
│  ( I need a quiz for classyquiz… )│                                  │ site full lately
│   The AI then asks you for what  │
│   it still needs, before the quiz│                                   │
├──────────────────────────────────┴───────────────────────────────────┤
│ About classyQuiz … (English, for AIs)                                 │
```

- **The header**: the mark and the name, the code box, the language. On a
  phone held upright the mark stands alone, the name kept for screen
  readers. Where the mark and the name appear across the site, and why:
  docs/design/identity.md.
- **The block above About** speaks DE, EN, FR or IT: the device's choice
  (`cq.lang`), else the browser's language, else English. The static HTML is
  English, for AIs' fetchers. The lobby, wall, Remote and tablets stay
  English.
- **The strip** follows the workflow: the sheet, the ask, the .zip going up
  to the site, the wall, tablets fanned out. A card with a border and the label "The
  example, step by step ›"; it links `/example` (the worked example) until the
  video exists; no ▶. Below 720 px wide its frames are one row that scrolls
  sideways.
- **Below 860 px wide** Build and Run stand one above the other, Run first.
- **Build's step 2** has two example asks: the labelled one with photos, and
  the open one ("I need a quiz for classyquiz.pages.dev. Help?"), after which
  the AI asks what it needs.
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
- **Coming back:** the latest quiz this device started, while it
  hasn't reached its final ranking: its title, where it stands, Back to the
  quiz (`/play#` + the teacher code), the class code, and "On another device:
  type 63953 47 in the code box". No closing time, no Delete, no older
  quizzes.
- **The own copy:** one line under Run, only on a device that has
  uploaded before (`cq.days`, dates only) and only when the site refused an
  upload on a day of the last 30 (`GET /api/site`).
- **The network check** is no longer on the root page: the upload error,
  the wall's "Nobody in yet?" line after 90 s of an empty lobby (counted
  anew for each class, so "Again with another class" waits its 90 s too),
  and a device that can't reach the quiz carry the help where the failure
  shows (docs/design/root-page.md).

#### The example, step by step (`/example`)

English, from the strip. Purpose and reasons: docs/design/example-page.md.

```
[fox] classyQuiz                         (the site's small header, to the root)
─────────────────────────────────────────
The example, step by step
How the example quiz was made, from the exercise sheets to the class, with
everything to try the same on your own AI.
1 The exercise sheets     [photo p.1] [photo p.2]
                          [Photo, page 1 (.jpg)] [Photo, page 2 (.jpg)] [The sheets (.pdf)]
2 The conversation        [top of the conversation picture]  Read the whole conversation ›
3 The quiz                [number-line-quiz.zip]
4 Run it                  [ Start the example quiz ]
                          It runs on this site like any quiz, on the projector
                          and on your students' devices.
```

"Start the example quiz" uploads the example as Run does and lands on the
check (§3.3). `/own-copy` and `/check` have the same small header.

### 3.2 The two entrances after a code

Students (`/play#63953`) get no screen of their own:
- in the lobby, straight to their avatar, with two rows of pictures below
  it to dress it until Start: six background shapes in its colour and
  eight hats (docs/design/class-and-wall.md);
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
│ [fox] classyQuiz             │
├──────────────────────────────┤
│ Prozente                     │
│ [ Show the quiz here ]       │
│   the class watches this     │
│   screen                     │
│ [ Steer it from here ]       │
│   Start, next, the solution  │
└──────────────────────────────┘
```

Otherwise there is no question (rule 5): it takes the free role, or says
both are there, with "If one of them was on this device a moment ago, try
again in half a minute." and "Try again". The question is acted on once, as
the device arrives: a device left lying on the question never takes a role
by itself later. A wrong teacher code shows the box again with "That isn't
this quiz's teacher code."; after five from the device, or the quiz's ten,
"Too many wrong codes for this quiz. Try again in a few minutes."
`/teacher#63953`, the old way in, shows the same box with the class code in
it. The box's placeholder is a teacher code, "12345 67"; this screen and the
question above have the site's small header.

### 3.3 The lobby: the check, then the join screen

The single tab, which shows and steers, has two screens. **The check is the
teacher's** (the questions, the fixes, the teacher code); **the
join screen is the class's** (title, address, class code, QR, count,
avatars, Start, the points-for-speed switch). The teacher shares the screen when they choose; the site
doesn't know whether it is shared.

```
┌────────────────────────────────────────────────────────────┐
│ Prozente · 12 questions                 Class code 63953   │
│                                      [ Let the class in ▶ ]│
│  A second device, to steer from or to show the quiz on:    │
│  on classyquiz.pages.dev, type 63953 47. Or open a second  │
│  screen in a new window with a click.                      │
│   12 questions                       [Show the solutions]  │
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
│                  ( ) Points for speed                      │
│     ‹ Questions        A second device ›        ⋯          │
└────────────────────────────────────────────────────────────┘
```

A question opened (or all of them, with Show the solutions / Hide the solutions):

```
│    2  Eine Jacke kostet 80 Franken …                    ⌄  │
│       ▲ 55 Franken  ◆ 20 Franken  ● 75 Franken  ✓■ 60 Fr.  │
│       Change the solution                                  │
```

- **The tab that uploaded opens on the check;** "Let the class in ▶"
  is the one tap to the join screen, "‹ Questions" the way back. The tab
  remembers which it shows (sessionStorage): a reload stays there. A wall
  that takes the steering back in the lobby (its Remote left or went away)
  shows the join screen.
- **The class code is on the check, small,** with the count once someone
  has joined: a teacher who reads it aloud has the class joining without the
  tap.
- **The teacher code sits at rest** on the check, in one sentence naming
  both needs; on the join screen it is behind "A second device ›", a sheet.
  "open a second screen in a new window" (hidden on a phone) opens a window that asks the same
  question as any other device.
- **Answers start folded,** so a shared check shows no key until the
  teacher presses a button that says it shows the answers.
- **"Change the solution"** makes the choices tappable ("Tap every right
  choice."), with Don't count this question (Count it again), Skip it (Show
  it after all), Hide the picture where there is one, and Done. A question
  that doesn't count is tagged "not counted" in the list.
- **The site's warnings** (the same answer twice, text too long to read well,
  ignored text, no title) sit above the list, one muted line each.
- **Avatars** can be tapped to remove a double. Until the first one, their
  place shows where the code goes: a wordless tablet top, fading out at its
  foot, the address in the browser's field and the code in the landing
  header's box beside the mark and the name (design: `class-and-wall.md`,
  "Getting in").
- **The address** has the mark before it, the fox the tablets then find in
  the landing's header.
- **Start reads "Start quiz ▶"** on every screen that steers. The mode is
  named where there is a choice: on the second device's question.
- **Points for speed**, a switch under Start on the join screen, off by default; on, it says "A right answer 10, up to 5 more the
  quicker it comes." Fixed once the quiz starts; see §3.7.
- **⋯:** Players · A second device… · Stop showing the quiz here · Delete the quiz…

The Remote's lobby is the check in one column: the class code large, the
count and avatars, the points-for-speed switch, the teacher code's sentence, "Projector ✓ ·
⇄ Swap" while the wall is there, and the questions, with Start quiz pinned at
the bottom. Without a wall it says how to bring one: "On the projector
computer: on classyquiz.pages.dev, type 63953 47." A Projector that doesn't
steer shows only the class's part (address, code, QR and avatars), with
"⇄ Swap screens" faint in its corner beside Full screen and ⋯.

### 3.4 Projector during the quiz

The v1 screens (question, reveal, ranking, final), with the code in a corner
throughout. While it steers, the bottom line is the bar:

```
│ ⋯   classyquiz.pages.dev · 63953   [⏱ Countdown        ] [▶ Answers        ] │
│                                    [ 15 s, then closes ] [ closes answering] │
```

- **The steering bar:** two buttons of fixed size in a fixed place, on the wall's bar and
  on the Remote alike, in the teacher's vocabulary: *choices* (the tiles),
  *answers* (what the class tapped), *solution* (the key)
  (docs/design/question-flow.md, "The steering bar"). **Play ▶** steps one
  slice and is labelled with a noun for what the class sees next: Choices,
  Answers (small: "closes answering"), Solution, Ranking, Question 4 (Final
  ranking after the last question's reveal). **Countdown** (small: "15 s,
  then closes") is there while the question is up and answering not closed:
  from the hidden choices it shows them too, and fifteen seconds later
  answering closes by itself, or sooner once everyone there has answered;
  while it runs it is greyed. Where it doesn't apply its place stays empty,
  so Play never moves. The same words on every width: on the Remote a
  label may take two lines; on a phone-sized wall Countdown's word is a
  little smaller.
- **Presses:** a bounce, or a press landing within 0.4 s of the screen
  moving, does nothing; a second press within 0.45 s of the first is a
  double and steps once more, from where the first leads, except across
  the start of a question (a double from the hidden answers shows them
  only; one onto the next question brings it up only). One double is two
  slices at most.
- **Keys:** Space, Enter, →, ↓, PageDown, N and a clicker press Play;
  F toggles full screen. No key starts the quiz from the lobby (Start is
  the button), a key held with Ctrl, Alt or Windows/Cmd does nothing, and
  while a Remote steers only a clicker's keys (PageDown, →, ↓) move on
  from the Projector. On a phone-sized wall the code gives way to the two
  buttons.
- **⋯ while steering:** Skip this question · Change the solution · End the
  quiz: final ranking · Players · A second device… · Stop showing the quiz
  here · Delete the quiz…
- **⋯ while a Remote steers:** ⇄ Swap · Stop showing the quiz here.
- **Notices on the wall:** "Remote connected", and "Remote gone – steering
  here". While a Remote that was there is away, the bar keeps "Remote gone" (on a phone-sized wall it gives way), and ⋯ → A
  second device… has the code: on demand, not in front of the class.
- **A window opened by "open a second screen in a new window"** that answered "Show the quiz
  here" says "Drag this window to the projector screen, then press F for
  full screen" until it is full screen.

**A question, its states.** Every question comes up with its answers hidden:

| State | Wall | Tablets | Steering tab |
|---|---|---|---|
| Question | the question and picture; tiles coloured, without text | the eye | "The choices are hidden: the class reads the question."; **▶ Choices**, Countdown |
| Answering | the choices; in the bar at the top, the avatar of each student whose answer has arrived pops in, and "answered / of"; during Countdown a bar drains along the top edge | buttons (and the same bar) | the counts with the solution; **▶ Answers**, Countdown |
| Locked in | each tile's count and a bar; no tick, nothing faded | buttons locked, the chosen one marked, 👁 | "Answering closed. The wall shows how the class answered, not yet the solution."; **▶ Solution** |
| Revealed | the tick, the other tiles faded; the avatars of those right jump for about four seconds in a band over the question | ✓ or ✗, "+13" with points for speed | **▶ Ranking** (Final ranking after the last question) |
| Ranking | places and stars | place and stars | **▶ Question 3** |

- **Answering closes** by Play (▶ Answers), by Countdown running out, or by
  everyone there answering during Countdown. A tap made before the tablet
  showed it closed still counts when it arrives, and the spread grows by
  one, as long as the question is still on screen: once the class has left
  its reveal (the ranking, the next question), its answers are settled.
- **A tablet shows its answer as accepted only on the server's word:** a
  tapped button is marked at once with a dashed, pulsing outline (on its
  way), and solid once the server's view has it stored. At the reveal a tap
  still on its way shows as on its way, then ✓ or ✗ once it is stored.
- **Only students who have answered appear**, in the order the answers
  arrive, never with the colour of their answer. Nobody is shown as
  missing; the Remote shows the teacher the last few it waits for.
- **"Of"** counts the devices that are there, or that answered and went
  away since: a tablet away for 45 s stops holding it below full. When
  everyone there has answered, the count turns green.
- **Nothing moves** on the wall between the question, the votes and the
  answer: the bar has a fixed height, and the tiles keep room for the count
  and tick from the start.
- **Pictures as answers:** each picture sits on its tile's
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
│ Change the solution          │
│ 18 of 22 answered · 1 away   │
│ Waiting for 🐸 🐻 🐷 🐧        │
├──────────────────────────────┤
│ [⋯] [⏱ Countdown] [▶ Answers]│
└──────────────────────────────┘
```

- **The buttons:** the steering bar, as on the wall (§3.4): Countdown and
  Play, the same size and place throughout the quiz; Start quiz in the
  lobby, "Again with another class" at the end, which opens a new lobby with
  the same code and keeps the corrections.
- **Projector gone:** "Projector gone. On the projector computer: on
  classyquiz.pages.dev, type 63953 47." On a wide screen also "open the
  projector window here".
- **Waiting for** shows the avatars of the students who are there and
  haven't answered, once at most six are left, until the lock-in.
- **⋯:** Skip this question · Change the solution · End the quiz: final
  ranking · All questions · Players · ⇄ Swap (while the wall is there) ·
  Stop steering from here · Delete the quiz…

### 3.6 Student

The student screens are as in v1, with the lobby's pictures to dress the
animal (docs/design/class-and-wall.md): avatar and 👁 in the lobby, colour
buttons, locked with 👁 at the lock-in, ✓ or ✗ with the answer, place and
stars at the ranking. Picture answers show their pictures on the buttons,
from a small copy fetched once in the lobby, and the chosen picture under
the ✓ or ✗. A tablet
still showing the previous class is told "This quiz has finished"; it
doesn't slip into the next class's lobby. A tablet switched off after the
previous class and opened again for the next one joins it like any other.

### 3.7 Pace and points for speed

The pace is the teacher's: the quiz carries none (the format has no
`Tempo:` or `Time:`). The
only clock is Countdown, fifteen seconds (`LAST_CALL_MS`, `shared/tempo.ts`).

- **Points for speed:** the join screen's switch, off by default, fixed at
  Start, carried over to "Again with another class". On, a right answer
  scores 10 and up to 5 more the sooner after the answers appeared it was
  tapped, by the device's own clock, over a fixed 20 s (`shared/tempo.ts`);
  the ranking shows points, not "right out of n".

## 4. Variants

- **One laptop, mirrored.** The Projector steers itself all lesson. Changing
  a key before the reveal shows it on the wall; the button says what it does.
- **Laptop with two screens.** "open a second screen in a new window", Show the quiz here, drag it, F. Placing
  the window on the second screen automatically (the Window Management API)
  is untried.
- **Phone only, no projector.** The phone is a Projector that steers itself.
  The teacher reads aloud, and the tablets show the answers' text.
- **Everything on the phone, then the laptop.** The phone uploads; on the
  laptop at the projector, the teacher code, Show the quiz here. The phone
  steers, on its check.
- **Evening before.** Upload the .zip at home, then Resume on the same device
  next day. On another device, type the teacher code, or upload it again.
- **Two quizzes:** two .zip files, two codes, two Resume lines.

## 5. When something goes wrong

| What happens | What they see | What they do |
|---|---|---|
| Tablet sleeps, Wi-Fi drops | Same avatar and screen on waking | Nothing |
| Tablet dies | — | Another tablet: code, own avatar under "Which one are you?" (it appears within a minute). Score kept |
| The dead tablet comes back after that | "Which one are you?" with **+** | Leave it, or **+** for another student |
| Tablets still joining after Start | They get in (first five minutes and the first question; then five more) | Nothing |
| A tablet from the last lesson, left at its final ranking | "This quiz has finished" and ← | ←, then the code |
| Any teacher tab reloads, sleeps or loses Wi-Fi | The same role again | Nothing |
| Phone dies, or goes to the AI app for long | After 45 s the wall says "Remote gone – …", shows the bar, and keeps "Remote gone" on it | Steer at the laptop. The phone is the Remote again when it's back; without its tab, or another phone: the teacher code, which takes the steering without a question |
| The Remote's tab closed by mistake | Nothing on the wall for 45 s | The teacher code again, at once: a closed tab's Remote is taken without waiting (on the HTTP fallback, within 25 s) |
| A wrong answer to the second device's question | The wall steers where the phone should, or the other way round | ⇄ Swap, on either device |
| Projector dies | The Remote says "Projector gone" and how to bring it back | Read off the Remote. Optionally another computer: the teacher code (the free Projector, after 45 s), or the projector window on a two-screen laptop |
| Wrong code | Students: the code, ✗, the box. Teacher: "That isn't this quiz's teacher code." | Type it again; after five wrong teacher codes in a minute, that device waits 10 minutes; after ten for the quiz, any device waits up to six minutes. The device that uploaded gets in with Resume regardless |
| Quiz closed or deleted | Gone from the Run box; open screens say "This quiz has ended" | Upload the .zip again |
| School network blocks WebSockets | Nothing; a moment slower (v1 fallback) | Nothing |

## 6. Not established

- Whether "Projector" and "Remote" are the words a teacher reaches for.
- Whether children find the code box in the header. The first lesson will
  show.
