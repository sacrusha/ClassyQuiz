# classyQuiz — User flow (draft for the owner's reaction)

2026-11-02. The redesign of how teacher and class get through a lesson:
backlog v1 items 16–19, with the parts of items 3, 4 and 10 they touch. Not
code yet. Not covered here: item 15, the upload counter, images (the second
implementer's), and the quiz format.

What v1 got wrong, in one line each, as the owner saw it: the root page is
five links and a number box; the teacher must know the words *projector*,
*remote*, *pairing*, *key check*; a second device needs a second code; the
teacher's view is a stack of folded cards; coming back reads like an account.

## 1. The model, in five rules

1. **One code per quiz.** Made at upload, it lives as long as the quiz (until
   deleted, or 48 h after last use). The class joins with it, the teacher's
   other devices open the quiz with it, and a second class later uses it again.
2. **Two teacher roles: Projector and Remote,** one device each. Every other
   device with the code is a player. A device that enters the code chooses:
   **▶** (play), **Projector** or **Remote**; a role is offered while free.
3. **The device you uploaded on takes one role:** Projector on a laptop-sized
   screen, Remote on a phone. It can switch (⋯ → "Use this device as the
   remote instead").
4. **While no device holds the Remote, the Projector steers:** it shows a
   slim bar with the next step. A clicker or the keyboard works on it always.
5. **A role is freed when its device has been gone for about a minute**
   (asleep, offline, battery). A device that comes back to a role still free
   gets it back without noticing; if someone took it meanwhile, it shows the
   choice again. The Projector can always take the steering back ("Steer from
   here"), because it is the device in the room; the device that had the
   Remote then shows the choice again.

Everything below follows from these. Pairing codes, `/screen`, `/remote`, the
teacher link and the key-check cover go away.

## 2. The usual lesson, minute by minute

Design target: school laptop on the projector (often mirrored), teacher's
phone, Android tablets, the quiz made in the break.

| When | Teacher | Class |
|---|---|---|
| Break | Phone or laptop: AI chat with the sheet photos and the sentence from the site. Copies the quiz block. | — |
| Break | **Laptop** at the projector: opens `classyquiz.pages.dev`, pastes. The laptop now shows the lobby (§3.3): big address, code and QR on the wall, Start quiz, the questions below. Scrolls down, opens a question or two, sees it's the right quiz. | — |
| Lesson starts | Says: "Type classyquiz.pages.dev, the number, press the big button." | Tablets: address, code, **▶**. Avatars pop up on the wall. |
| Optional | Phone: same address, same code, **Remote**. The wall says "Remote connected", the laptop's buttons go away, the phone shows the lobby. | — |
| Quiz | Start quiz → Reveal → Next … on the phone (or the laptop, or the clicker). The AI's note on a question shows on the phone while it's up. | Tap a colour; see ✓ or ✗ at the reveal. |
| End | Final ranking. "Again with another class" for the parallel class, or nothing: the quiz deletes itself. | Their place on their tablet. |

Phone-first is the mirror image: the teacher pastes on the phone, the phone
is the Remote, and its lobby says how to put the quiz on the projector (same
address and code on the laptop, **Projector**).

## 3. Screens

Exact words. `[ ]` button, `[_]` input, `›` expands, `⋯` menu. Sizes are
indicative; laptop frames are 1366×768, phone frames 390 wide.

### 3.1 Root page (item 16)

The top is for people; the guidance for AIs stays below it as static HTML.
The code box sits in the header so a teacher can say "the box at the top"
and a child finds it on any device. `/new` merges into this page.

```
┌────────────────────────────────────────────────────────────┐
│ classyQuiz                       Quiz code [_ _ _ _ _]  ▶  │
├────────────────────────────────────────────────────────────┤
│  A live quiz for your class, made from your exercise       │
│  sheets by your own AI.                                     │
│                                                            │
│  1  Give your AI the sheets – photos or a PDF – and this:  │
│     ┌────────────────────────────────────────────┐         │
│     │ Please help me build a classyquiz.pages.dev │ [Copy] │
│     │ quiz from the attached exercises.           │         │
│     └────────────────────────────────────────────┘         │
│     It reads this site, may ask you a question or two –    │
│     which exercises, how many questions – and answers with │
│     the quiz as one block of text. Copy the block.         │
│                                                            │
│  2  Paste it here                                          │
│     ┌────────────────────────────────────────────┐         │
│     │                                            │         │
│     └────────────────────────────────────────────┘         │
│     [Continue ▶]   or upload the file                      │
│                                                            │
│  Before the first lesson: check the school network ·       │
│  Run your own copy                                         │
├────────────────────────────────────────────────────────────┤
│  About this site – for teachers and their AI               │
│  (the guidance, unchanged)                                 │
```

- Pasting starts the check at once; Continue is for typed text. Problems
  appear under the box as in v1, with "Copy the message for your AI".
- Success goes straight to the lobby. There is no "Start with a class" step.

**Coming back (item 17).** On a device that uploaded quizzes still on the
site, a block above step 1. "On this device" answers "is this a shared
list?"; the code says how to open it anywhere else.

```
│  On this device                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Prozente · 12 questions · code 63953                 │  │
│  │ [Continue ▶]          on the site until Wed 16:20    │  │
│  │                                            Delete…   │  │
│  └──────────────────────────────────────────────────────┘  │
```

Delete… sits apart from Continue and opens: "Delete *Prozente* from the site
now? The class can't join it any more. [Delete] [Keep]". Expired quizzes drop
off the list. The same "until … · Delete…" line is at the foot of the lobby.

### 3.2 Choosing what this device is

After a code, on any device. The title tells a teacher it's the right quiz;
▶ is what children are told to press.

```
┌──────────────────────────────┐
│ Prozente                     │
│ ┌──────────────────────────┐ │
│ │            ▶             │ │  big, green
│ └──────────────────────────┘ │
│ Teacher                      │
│ [ Projector    ] [ Remote  ] │
│  what the class    steer     │
│  sees              from here │
└──────────────────────────────┘
```

- A role held by a live device shows "in use", greyed. Held by a device
  that's gone: "in use – free in under a minute", and it becomes a button by
  itself.
- Wrong code: "No quiz with the code 12345." and the box again.
- After ▶ once the quiz is running, and avatars of absent players exist:
  "Which one are you?" with those avatars and **+** (v1's reclaim).
- The QR on the wall leads here too, so a teacher's phone can scan it. It
  costs each child one tap on ▶.

### 3.3 Lobby, on the device that steers (item 19)

On the laptop this is the projector and the steering in one screen; what the
class needs is on top and large, what the teacher checks is below the fold.

```
┌────────────────────────────────────────────────────────────┐
│ Prozente                                                   │
│                                                            │
│   classyquiz.pages.dev    ┌─────┐   🐱 🐻 🐷 🐧 🐭 🐼        │
│   6 3 9 5 3               │ QR  │   6 joined              │
│                           └─────┘                          │
│                                                            │
│   [ Start quiz ▶ ]                                         │
│   Steer from your phone: same address and code, Remote.    │
├──────────────────────── below the fold ────────────────────┤
│   12 questions · 1 with a note from your AI                │
│                                          [Show all answers]│
│   Note: Exercise 5 was cut off in the photo, left out.     │
│    1  Was sind 10% von 250?                             ›  │
│    2  Eine Jacke kostet 80 Franken …               ⚑ note ›│
│    3  Welche dieser Zahlen sind gerade?                 ›  │
│   …                                                        │
│   On the site until Wed 16:20 · Delete…              ⋯     │
└────────────────────────────────────────────────────────────┘
```

A question opened (or all, with Show all answers / Hide answers):

```
│    2  Eine Jacke kostet 80 Franken und wird um 25 %     ⌄  │
│       reduziert. Wie viel kostet sie jetzt?                │
│       ▲ 55 Franken  ◆ 20 Franken  ● 75 Franken  ■ 60 Fr. ✓ │
│       ⚑ Die Lösung auf dem Blatt sagt 65 Franken; ich      │
│         habe 60 gerechnet.                                 │
│       Change the right answer                              │
```

- Answers start folded on every device: a mirrored laptop shows no key until
  the teacher presses a button that says it shows the answers.
- The question's note is inside the fold (it may give the key away); the
  question line carries "⚑ note" so a skimming teacher sees which to open.
  The note on the whole quiz is shown openly. Parser warnings sit on their
  question ("same answer twice"), quiz-wide ones beside the quiz note.
- "Change the right answer": the answers become tappable, "Tap the answers
  that count. [Done]". Void and skip are in the same place.
- The device line names only what is missing and turns into a tick when it
  arrives: on a laptop "Steer from your phone: …", on a phone "On the
  projector computer: open classyquiz.pages.dev, type 63953, choose
  Projector." Both connected: "Projector ✓ Remote ✓".
- ⋯: Use this device as the remote / as the projector instead · Players.

On the phone (Remote) the same content in one column, Start quiz pinned at
the bottom. The laptop, once a phone holds the Remote, shows only the top
half: address, code, QR, avatars.

### 3.4 Projector during the quiz

v1's screens (question, reveal, ranking, final), plus the code in a corner
throughout, so a late child or a teacher on a new device can always read it.

```
┌────────────────────────────────────────────────────────────┐
│ 2 / 12                                           👤 18 / 22 │
│        Eine Jacke kostet 80 Franken und wird um            │
│        25 % reduziert. Wie viel kostet sie jetzt?          │
│  ┌──────────────────────┐ ┌──────────────────────┐         │
│  │ ▲ 55 Franken         │ │ ◆ 20 Franken         │         │
│  └──────────────────────┘ └──────────────────────┘         │
│  ┌──────────────────────┐ ┌──────────────────────┐         │
│  │ ● 75 Franken         │ │ ■ 60 Franken         │         │
│  └──────────────────────┘ └──────────────────────┘         │
│ classyquiz.pages.dev · 63953                             ⛶ │
└────────────────────────────────────────────────────────────┘
```

While no Remote is connected, a slim bar replaces the bottom line:

```
│ ⋯   classyquiz.pages.dev · 63953     ⚑ Note     [Reveal ▶] │
```

- The bar's button is the next step: Start quiz / Reveal / Next / Final
  ranking. Space, Enter, → and a clicker do the same.
- ⚑ Note appears only when the question has one; it opens the note on the
  wall. On one mirrored laptop there is nowhere private to show it; the chip
  is how the note reaches the teacher at all.
- ⋯: Skip this question · Change the right answer · Ranking now · Final
  ranking now · Players · Steer from here (only while a Remote is
  connected) · Leave (the screen goes back to the root page).
- "Remote connected" and "Remote gone – steer here or open the code on
  another device" appear as short notices on the wall, so the teacher sees
  that the phone worked, or that a child took the Remote.

### 3.5 Remote during the quiz

One card and one button. Everything else is in ⋯.

```
┌──────────────────────────────┐
│ Prozente     2/12   63953  ● │
├──────────────────────────────┤
│ ⚑ Note from your AI          │
│ Die Lösung auf dem Blatt     │
│ sagt 65 Franken; ich habe    │
│ 60 gerechnet.                │
│                              │
│ Eine Jacke kostet 80 Franken │
│ … Wie viel kostet sie jetzt? │
│   ▲ 55 Franken            3  │
│   ◆ 20 Franken            1  │
│   ● 75 Franken            2  │
│ ✓ ■ 60 Franken           12  │
│                              │
│ 18 of 22 answered · 1 away   │
├──────────────────────────────┤
│ [⋯]            [ Reveal ▶ ]  │
└──────────────────────────────┘
```

- "of 22" counts the devices present; absent ones are named separately
  (landscape requirement 3, at no extra cost).
- After the reveal: `[Ranking]  [Next ▶]`; after the last question
  `[Final ranking]`.
- ⋯: Skip this question · Change the right answer · Final ranking now · All
  questions · Players (tap one to remove a double) · Stop using this phone as
  remote · On the site until Wed 16:20 · Delete…
- Final: the class result and top three, then `[Again with another class]`
  and, apart, "On the site until … · Delete…". Another class gets a new lobby
  with the same code; the corrections carry over (v1).

### 3.6 Student

Unchanged from v1 apart from the way in: avatar and 👁 in the lobby, colour
buttons, ✓/✗ at the reveal, place and stars at the ranking. A tablet from the
previous class still showing the final screen doesn't slip into the next
class's lobby; it stays on its final place.

## 4. Variants

- **Laptop only, no phone.** The projector steers through its bar the whole
  lesson. The AI's notes hide behind ⚑ Note. Changing a key before the reveal
  shows it on the wall: the button says what it does.
- **Phone only, no projector.** The phone is the Remote; the teacher reads the
  questions aloud, the tablets show the answers' text (v1).
- **Evening before.** Uploaded at home: next day the school laptop and the
  phone open it with the code (the home laptop's role is long free). On the
  phone it is also under "On this device". The code is the thing to remember;
  the lobby says "Code 63953 opens this quiz on any device until Wed 16:20".
- **Two quizzes** (6a, 6b): two uploads, two codes, two entries under "On this
  device".
- **Extended screen.** The laptop window is the Remote (⋯ → use as remote);
  a second window with the code becomes the Projector and is dragged to the
  wall. Possible, not advertised.

## 5. When something goes wrong, or someone comes back

| What happens | What they see | What they do |
|---|---|---|
| Tablet sleeps, Wi-Fi drops | Same avatar and screen on waking; "offline" banner meanwhile | Nothing |
| Tablet dies or the page is closed | — | Another tablet: address, code, ▶, own avatar among "Which one are you?" (shows up within a minute). Score kept |
| Child types a wrong code | "No quiz with the code …", or another quiz's title | Types again |
| Teacher's phone sleeps or goes to the AI app | Back on the Remote when it returns | Nothing. After a minute away the wall shows the steering bar until the phone is back |
| Teacher's phone dies | Wall: "Remote gone – …"; steering bar | Steer at the laptop, or any device: code → Remote |
| Projector laptop reloads | The quiz again (within 8 h, v1) | Nothing |
| Projector laptop dies | — | Another computer: code → Projector (free after a minute) |
| A child picks Remote | Wall: "Remote connected"; the bar goes | Projector ⋯ → Steer from here, or walk over and take the tablet |
| Teacher back next day, same device | "On this device" block | Continue |
| … on another device | — | Code → Projector or Remote |
| Quiz expired or deleted | Gone from "On this device"; code: "No quiz with the code …"; open screens: "This quiz has ended" | Paste it again from the AI chat |
| School network blocks WebSockets | Nothing; a moment slower (v1 fallback) | Nothing |

## 6. What this changes in v1

For the code phase; listed so the scope is visible.

- Root page: new top, `/new` folded in; the guidance text stays.
- Code per quiz, made at upload (was per run, made at "Start with a class");
  the run's lobby opens at upload; "Another class" keeps the code.
- Roles held by device tokens with the existing "gone" detection (45 s);
  upload device's role by screen width; a lookup by code returns title,
  phase and which roles are free.
- Removed: Pairing objects and codes, `/screen` pairing, `/remote`, teacher
  link and its copy button, the key-check cover, the "Connect" and
  "Finish · end" cards.
- Projector: corner code, steering bar, notices, ⋯. Teacher page rebuilt
  as the lobby of §3.3 and the Remote of §3.5. Student page: the choice
  screen in front.
- decisions.md entries superseded in part: Continuity (teacher link),
  Pairing devices, Key check on a screen that may be projected, Flow of a run
  (new code per class), Joining and rejoining (code per run), Single mirrored
  laptop (now supported, with the note behind a chip).
- Overlap with the second implementer: `instance.ts`, `protocol.ts`,
  `play.ts`, `screen.ts` are theirs for item 15 now; the role work goes in
  after theirs lands.

## 7. Calls I made that you may want to overrule

1. **Code per quiz, not per class.** One number for the teacher to know,
   and coming back from any device works. Consequence of item 18 either way,
   larger with this: while nobody holds the Remote, anyone with the code can
   open the quiz as Remote at home and see the answers, or delete it. Fits
   "normal users, not malicious"; per-class codes would shrink the window.
2. **Upload device's role by screen width**, with a switch in ⋯, instead of
   asking "Is this the projector?" after upload.
3. **The choice screen for everyone**, one tap on ▶ for each child, rather
   than children landing straight on an avatar with teacher links underneath.
4. **The code box in the header** rather than as a second card beside "paste".
5. **Laptop alone: the AI's note behind a chip** on the wall, not shown
   unasked.

## 8. Not established

- Whether "Projector" and "Remote" are the words a teacher reaches for.
  A lesson will tell.
- Whether a minute is right for freeing a role. It is the v1 away detection,
  measured for tablets, not phones in pockets.
- Whether the new top of the root page, which addresses the teacher
  ("Give your AI…"), changes how AIs read the page. The guidance decision
  notes that imperative text trips injection guards. Needs a fetch test
  after the change.
- Whether children press ▶ without help. The teacher is in the room.
