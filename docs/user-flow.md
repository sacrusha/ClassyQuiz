# classyQuiz — User flow

The teacher's and the class's path through a lesson, screen by screen, with the
words on them. The purpose of each part and the reasons for its shape are in
docs/design/; this file says what the screens show.

## 1. The model

1. **One quiz, one class.** A quiz file opens in the browser first, on the
   local check (§3.1), and nothing of it goes to the site there. Opening the
   lobby uploads it and starts it: the upload is the lesson's quiz, and a
   parallel class gets its own upload. Its code is made at
   upload and lives as long as the quiz: until the teacher ends it (Exit at
   the final ranking, or Delete), or 3 h after the last teacher action. The
   class joins with it.
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
4. **The tab that opens the lobby becomes the Projector, and it steers itself.**
   In the lobby it shows the teacher's check first (how the screens are
   arranged, the questions folded), then, one tap on, the class's join
   screen (§3.3). During the quiz a slim bar carries the next step. One
   mirrored laptop needs nothing else: the check's "One screen". A clicker or the keyboard
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
   - *Both there:* "This quiz already has a screen that shows it and one
     that steers." A tab that is there is never pushed aside. A Remote whose tab
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
| Break | **Laptop:** opens `classyquiz.pages.dev` and chooses the AI's .zip there (or drops it). The local check: the right quiz, a spot fix, Open the lobby (§3.1). | — |
| Break, optional | **Laptop:** on the check, Screen and remote, which shows the teacher code. **Phone:** `classyquiz.pages.dev`, types the teacher code "63953 47" in the box, Steer it from here. The wall says "Remote connected". Or, with two screens: "open a second screen in a new window", Show the quiz here, drag it across, F. | — |
| Lesson starts | **Let everyone in ▶** (or on the wall already). "Type classyquiz.pages.dev and the number." Perhaps: "While we wait, dress your animal." | Tablets: address, code, ▶. Avatars pop up on the wall; a child who dresses theirs (a shape, a hat, a tool) sees it change there. |
| Quiz | Start on whichever tab steers; Play: Choices → Answers → Solution → Ranking → Question 2, and Countdown when the class should hurry, there or with the clicker. | Tap a colour; their avatar pops up on the wall; ✓ or ✗ with the answer, and those right see their avatar jump on the wall. |
| End | Final ranking: the podium, the class in front of it, the class's result; a photo if wanted. Exit, and every screen goes to the root page. | Their place on their tablet, then the root page. |

## 3. Screens

`[ ]` is a button, `[_]` an input, `›` expands, `⋯` a menu.

### 3.1 Root page

Purpose and reasons: docs/design/root-page.md.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [fox] classyQuiz                   Code [_ _ _ _ _]  ▶      EN ▾     │
├──────────────────────────────────────────────────────────────────────┤
│          ┌ the film, 16:9, no sound ─────────────┐                   │
│          │ poster: the class at the wall, the    │                   │
│          │ votes split, no solution yet  [▶]     │                   │
│          └───────────────────────────────────────┘                   │
│          [▶] ──●──'───'─'──'────── 0:00 / 1:00 [1×] [full screen]    │
│                              The example, step by step ›             │
├──────────────────────────────────┬───────────────────────────────────┤
│ Build a quiz                     │ Play a quiz                        │
│ 1 Choose any good AI.            │ ┌ Big numbers … · question 4 of 10 ┐│ only with an open
│   Free Claude Sonnet wrote the   │ │ [Back to the quiz ▶] Join code   ││ quiz this device
│   example above, 4 Nov 2026 …    │ │ On another device: type 63953 47 ││ started, until its
│ 2 Ask the AI to build you a quiz │ └──────────────────────────────────┘│ final ranking
│   for classyquiz.pages.dev [Copy]│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   [sheets][chess][1][3][▭][?]    │ │ [ Open the quiz your AI        │ │
│   tabs, one ask shown:           │ │   made (.zip) ] or drop it here│ │
│  ( Read classyquiz… Can you … )  │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│     labels under the parts       │ On 3 of the last 30 days this …   │ only on a device that
│                                  │                                   │ uploaded before, the
│                                  │                                   │ site full lately
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
- **The film**, about 60 s without sound, follows the workflow: the sheets,
  the AI, the .zip going up to the site, the wall, a student's tablet. Until ▶
  is pressed or the time bar moved it is its poster, a picture: the class at
  the wall, the votes split. Under it a video player's bar: play, the time bar
  with ticks where the five steps start (dragging shows the step's name), the
  time and the length, the speed, full screen; on a phone held upright the
  time bar has a row of its own. At the end a replay icon on the end card.
  Under it, "The example, step by step ›" links `/example` (the worked
  example).
- **Below 860 px wide** Build and Run stand one above the other, Run first.
- **Build's step 2** has six example asks behind six picture tabs: the
  labelled one with photos of sheets, a chess quiz described in words (with
  the AI, plan and date that answered it), practising alone for a test ("I'll
  play it myself, so please keep the questions and answers to yourself"), a
  games night with friends ("I'm playing too, so don't show me the
  questions"), a training session on the big screen, and the open one ("Read
  classyquiz.pages.dev. I need a classyQuiz. Help?"). Pictures: the sheets, a
  chess board, one person, three people, a screen before an audience, a
  question mark.
- **Play a quiz takes a .zip and nothing else.** The button opens the file
  chooser; a .zip can also be dropped on the box. Nothing invites pasting.
  - A file pasted with Ctrl+V (copied in the file manager) opens like a
    chosen one.
  - Text pasted or dropped anyway gets "The site takes the quiz as a .zip
    file, not as text. Your AI can make the quiz as one .zip file, to
    download from the chat and open here." It is counted as "paste".
  - Any other file gets "The site takes the quiz as a .zip file, not a
    .docx file." and the same sentence. Attempts are counted by format.
- **Problems with the quiz:** listed in place, with "Copy the message for your
  AI" (which asks for a corrected .zip, in English), plus "Continue without
  these pictures" when it's pictures.
- **A browser that keeps no site data** can't pass the quiz to the check:
  "This browser didn't let the site open the quiz (it may block site data).
  Try another browser."
- **On success:** the local check (below), in this tab. Nothing has gone to
  the site.
- **Coming back:** the latest quiz this device started, while it is on
  the site (until Exit, final ranking included): its title, where it stands, Back to the
  quiz (`/play#` + the teacher code), "Join code" and the code, and "On another device:
  type 63953 47 in the code box". No closing time, no Delete, no older
  quizzes.
- **The own copy:** one line under Run, only on a device that has
  uploaded before (`cq.days`, dates only) and only when the site was full
  or busy on a day of the last 30 (`GET /api/site`).
- **On the lobby's check (§3.3), before the players are let in,** on a day the free site is
  nearly full: "The free site is nearly full today: room for about 2 more
  groups." (one more: "room for one more group"); when no class fits
  or letting in was refused: "The free site can't take more players today:
  the quizzes under way use what is left. It takes new ones again at 01:00
  Swiss time." Both followed by "More quizzes: a site of your own or your
  school's ›" (`/own-copy`, in a new tab). The Remote's lobby shows the same.
- **The network check** is no longer on the root page: opening the lobby,
  the wall's "Nobody in yet?" line after 90 s of an empty lobby,
  and a device that can't reach the quiz carry the help where the failure
  shows (docs/design/root-page.md).

#### The example, step by step (`/example`)

English, from the link under the film. Purpose and reasons: docs/design/example-page.md.

```
[fox] classyQuiz                         (the site's small header, to the root)
─────────────────────────────────────────
The example, step by step
How the example quiz was made, from the exercise sheets to the class, with
everything to try the same on your own AI.
1 The exercise sheets     [photo p.1] [photo p.2]
                          [Photo, page 1 (.jpg)] [Photo, page 2 (.jpg)] [The sheets (.pdf)]
2 The conversation        [top of the conversation picture]  Read the whole conversation ›
3 The quiz                [big-numbers-quiz.zip]
4 Try it                  [ Start the example quiz ]
                          On your own, it stays in this browser. With friends
                          or a class, it runs on this site like any quiz.
```

"Start the example quiz" opens `/open?example=<lang>`: the example on the
local check, read as Run reads a file, nothing uploaded. `/own-copy` and
`/check` have the same small header.

#### The local check (`/open`)

A quiz read from its .zip in this browser, before anything of it goes to
the site; English. Purpose and reasons: docs/design/local-check.md.

```
[fox] classyQuiz                         (the site's small header, to the root)
─────────────────────────────────────────────────────────────
Big numbers on the number line · 13 questions
  How will it be played?               (only with two or more ways)
┌ Solo ─────────────────────────────────────────────────────┐
│ You play the quiz on your own, to learn or review: the    │
│ solution after each answer.                               │
│ [ Play ▶ ]                                                │
│ Nothing goes to the site. A reload or closing the tab     │
│ ends it.                                                  │
└───────────────────────────────────────────────────────────┘
┌ Peers ────────────────────────────────────────────────────┐
│ You play the quiz with friends, each on your own device.  │
│ It moves on once everyone has answered, so nobody has to  │
│ run it.                                                   │
│ [ Play together ▶ ]                                       │
│ This puts the quiz on the site, with a code for the       │
│ others. Until then it is only in this browser.            │
└───────────────────────────────────────────────────────────┘
┌ Quizmaster ───────────────────────────────────────────────┐
│ You run the quiz for a class or a group: the questions on │
│ a big screen, the answers on everyone's own device.       │
│ [ Open the lobby ▶ ]                                      │
│ This puts the quiz on the site. Until then it is only in  │
│ this browser.                                             │
└───────────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────
▸ The questions and their solutions · 2 notes from the site
    If you will play it yourself, leave this closed.
                                  (while a way to play it yourself is offered)
```

- **One card per way to play it**, each with its own button; the first
  card's is the primary one. Only what is built is offered: today Solo,
  Peers, then Quizmaster.
- **The questions are folded** under the cards, closed on arrival. Opened,
  they are the lobby's list (§3.3): thumbnails, answers folded, Show the
  solutions, the site's warnings, and Change the solution with its fixes
  (Don't count this question, Skip it, Hide the picture). The fixes go up
  with the quiz.
- **Play ▶** plays the quiz in this tab (§3.8); nothing goes to the site.
- **Play together ▶** uploads the quiz as a room that runs on its own and
  comes into it, in this tab, as its first player (§3.9); Back from there
  passes this page. While it goes up and when it is refused, as Open the
  lobby.
- **Open the lobby ▶** uploads the quiz and lands on the lobby's check
  (§3.3), in this tab as the Projector; Back from there passes this page.
  While it goes up: "Sending the quiz…". Refused, under the button: the
  site's day ("The free site can't take more quizzes today. …", "… has no
  room for another quiz right now …", "… has used up today's allowance …",
  each with "More quizzes: a site of your own or your school's ›"), or no
  connection or an answer that isn't the site's (a filter's page): the
  network named as a possible cause, with "What to tell IT ›" to
  `/check#it`.
- **A reload, or arriving with nothing:** "No quiz open here. A quiz opens
  from the .zip your AI made, on the start page. This page keeps nothing of
  it once it reloads or closes, so open the .zip there again." [To the
  start page]. The example's check reads the example again instead.

### 3.2 The two entrances after a code

Students (`/play#63953`) get no screen of their own:
- before the teacher lets the class in, a wait: "Joining opens in a
  moment.", joining by itself at the tap;
- in the lobby, straight to their avatar, with three rows of pictures below
  it to dress it until Start: six background shapes in its colour, nine
  hats and seven things to hold or wear (docs/design/class-and-wall.md);
- once running, "Which one are you?" with the absent players' avatars and
  **+**, when there are any; a tablet whose avatar another device took
  back while it was away gets the same choice when it returns;
- after the start, tablets still arriving get in, however many: during
  the first five minutes and the whole first question. After that, five
  more, then "This quiz has started and takes no more players. Ask whoever
  runs it." (over `MAX_PLAYERS`: "This quiz is full. Ask whoever runs it.");
- a tablet that reaches the page but not the quiz: after a while "This
  device can't reach the quiz. Tell whoever runs it.";
- at the final ranking, their place, stars and a trophy; joining then
  gets a trophy and ←;
- after the teacher's Exit, the root page;
- with a wrong code, the code, ✗, and the code box again.

Teacher (`/play#6395347`, the teacher code typed in the box; Resume on the
uploading device), when one tab shows and steers:

```
┌──────────────────────────────┐
│ [fox] classyQuiz             │
├──────────────────────────────┤
│ Prozente                     │
│ [ Show the quiz here ]       │
│   everyone watches this      │
│   screen                     │
│ [ Steer it from here ]       │
│   Start, next, the solution  │
└──────────────────────────────┘
```

Otherwise there is no question (rule 5): it takes the free role, or says
both are there, with "If one of them was on this device a moment ago, try
again in half a minute." and "Try again". The question is acted on once, as
the device arrives: a device left lying on the question never takes a role
by itself later. A wrong teacher code shows the box again ("Show or steer a
quiz from here", "The quiz's code and two more digits:", the box, "The
screen that runs the quiz shows them.") with "The last two digits don't
match this quiz."; after five from the device, or the quiz's ten, "Too many
wrong codes for this quiz. Try again in a few minutes." `/teacher#63953`,
the old way in, shows the same box with the class code in it and "This quiz
now takes its code and two more digits." The box's placeholder is a teacher
code, "12345 67". The tab's title ends "· show or steer". This screen, the
question above and the note that both are there have the site's small
header.

### 3.3 The lobby: the check, then the join screen

The lobby opens from the local check's "Open the lobby ▶" (§3.1); "the
check" in this section is the lobby's.

The single tab, which shows and steers, has two screens. **The check is the
teacher's** (how the screens are arranged, the teacher code where a remote
is wanted, the questions and fixes folded); **the join screen is the
class's** (title, address, class code, QR, count, avatars, Start, the
points-for-speed switch). The teacher shares the screen when they choose;
the site doesn't know whether it is shared. Both screens' words name no
role (docs/design/teacher-devices.md, "Words for any crowd"): the same
screens serve a class and any other crowd.

```
┌────────────────────────────────────────────────────────────┐
│ Prozente · 12 questions                    Join code 63953 │
│ How are the screens arranged?                              │
│ ┌ One screen ────────────────┐ ┌ Screen and remote ──────┐ │
│ │ It shows the quiz and      │ │ One device shows the    │ │
│ │ steers it: the buttons     │ │ quiz, another steers    │ │
│ │ under the quiz, the        │ │ it: a phone, say.       │ │
│ │ keyboard or a clicker.     │ │                         │ │
│ └────────────────────────────┘ └─────────────────────────┘ │
│  (Screen and remote only:) On the second device, open      │
│  classyquiz.pages.dev and type 63953 47. With two screens  │
│  on this computer: open a second screen in a new window.   │
│  In a video call, the window you share is the screen       │
│  everyone sees.                                            │
│                                       [ Let everyone in ▶ ]│
│ ───────────────────────────────────────────────────────────│
│ ▸ The questions and their solutions · 1 note from the site │
│                                                   ⋯ More   │
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
│     ‹ Back        A second device ›        ⋯               │
└────────────────────────────────────────────────────────────┘
```

The fold opened, a question opened (or all of them, with Show the solutions / Hide the solutions):

```
│    2  Eine Jacke kostet 80 Franken …                    ⌄  │
│       ▲ 55 Franken  ◆ 20 Franken  ● 75 Franken  ✓■ 60 Fr.  │
│       Change the solution                                  │
```

- **The tab that uploaded opens on the check;** "Let everyone in ▶"
  lets the class in and is the one tap to the join screen, "‹ Back" the
  way back. The tab remembers which it shows (sessionStorage): a reload
  stays there, and before the class is let in it is the check. A wall
  that takes the steering back in the lobby (its Remote left or went away)
  shows the join screen once the class is let in.
- **How the screens are arranged:** a toggle of two, One screen or Screen
  and remote, each saying what it means; under it, always, the line on a
  video call. The toggle changes what the screens say, nothing a device
  can do. One screen until this browser has chosen otherwise or has had a
  Remote (localStorage, `cq.screens`); a reload keeps it.
- **The join code is on the check, small,** with the count once someone
  has joined. Teacher devices use it with the teacher code at any time;
  student devices that arrive with it before the tap wait ("Joining opens
  in a moment.") and join by themselves at the tap. With a Remote, the
  Remote's lobby has "Let everyone in ▶" until it is tapped, and the wall
  shows the quiz's title and "Joining opens in a moment." without the code
  until then. Start also lets the class in.
- **The teacher code sits at rest** on the check under Screen and remote
  (or once a Remote was there and is gone, after "Remote gone."); on the
  join screen it is behind "A second device ›", a sheet, also only then.
  With One screen, ⋯ → A second device… is the way to it. "open a second
  screen in a new window" (hidden on a phone) opens a window that asks the
  same question as any other device.
- **The questions are folded,** under "The questions and their solutions"
  with how many notes the site has, closed on arrival: the local check
  showed them before the upload, its fixes included. Opened, the list as
  below.
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
⇄ Swap" while the wall is there, and the questions folded as on the wall's check, with Start quiz pinned at
the bottom. Without a wall it says how to bring one: "On the projector
computer: on classyquiz.pages.dev, type 63953 47." A Projector that doesn't
steer shows only the class's part (address, code, QR and avatars), with
"⇄ Swap screens" faint in its corner beside Full screen and ⋯.

### 3.4 Projector during the quiz

The v1 screens (question, reveal, ranking), with the code in a corner
throughout, and the final ranking (below). While it steers, the bottom line is the bar:

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
- **The final ranking:** places 1 to 3 on a podium (ties share a step),
  everyone else in front of it in the lobby's order, all of them jumping,
  and the class's result beside it. It stays until Exit. The bar holds ⋯
  and, in its middle, **Exit** (small: "ends the quiz for everyone"), with
  no confirmation; where Play was there is nothing, and no key presses
  Exit. Exit deletes the quiz and sends every screen, the tablets
  included, to the root page.
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
  here · Delete the quiz… (not at the final ranking, where Exit is).
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
| Question | the question and picture; tiles coloured, without text | the eye | "The choices are hidden: everyone reads the question."; **▶ Choices**, Countdown |
| Answering | the choices; in the bar at the top, the avatar of each student whose answer has arrived pops in, and "answered / of"; during Countdown a bar drains along the top edge | buttons (and the same bar) | the counts with the solution; **▶ Answers**, Countdown |
| Locked in | each tile's count and a bar; no tick, nothing faded | buttons locked, the chosen one marked, 👁 | "Answering closed. The projector shows how everyone answered, not yet the solution."; **▶ Solution** |
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
  lobby, ⋯ and Exit in the middle at the final ranking.
- **Projector gone:** "Projector gone. On the projector computer: on
  classyquiz.pages.dev, type 63953 47." On a wide screen also "open the
  projector window here".
- **Waiting for** shows the avatars of the students who are there and
  haven't answered, once at most six are left, until the lock-in.
- **⋯:** Skip this question · Change the solution · End the quiz: final
  ranking · All questions · Players · ⇄ Swap (while the wall is there) ·
  Stop steering from here · Delete the quiz… (not at the final ranking).

### 3.6 Student

The student screens are as in v1, with the lobby's pictures to dress the
animal (docs/design/class-and-wall.md): avatar and 👁 in the lobby, colour
buttons, locked with 👁 at the lock-in, ✓ or ✗ with the answer, place and
stars at the ranking. Picture answers show their pictures on the buttons,
from a small copy fetched once in the lobby, and the chosen picture under
the ✓ or ✗. At the final ranking, place, stars and a trophy, until the
teacher's Exit sends the tablet to the root page. A tablet that comes to
the next lesson's quiz comes with that quiz's own code.

### 3.7 Pace and points for speed

The pace is the teacher's: the quiz carries none (the format has no
`Tempo:` or `Time:`). The
only clock is Countdown, fifteen seconds (`LAST_CALL_MS`, `shared/tempo.ts`).

- **Points for speed:** the join screen's switch, off by default, fixed at
  Start. On, a right answer
  scores 10 and up to 5 more the sooner after the answers appeared it was
  tapped, by the device's own clock, over a fixed 20 s (`shared/tempo.ts`);
  the ranking shows points, not "right out of n".

### 3.8 Solo

Played on the local check's page (`/open`), nothing uploaded; purpose and
reasons: docs/design/solo.md. English, the site's own words; the pages are
light, as the class's screens.

```
The start
[fox] classyQuiz
        Big numbers on the number line
                 13 questions
(avatar)        ● ⬡ ★ ♥ ✿ ◎        (the shapes, in its colour)
                hats, tools          (pictures, no words)
[ Start ▶ ]

A question, answered
4 / 13                                  ✓   (avatar)   ★ 3
        Which number does the arrow show?
                [the picture]
[▲ 646 000            ✓]  [◆ 645 000             ]
[● 644 000             ]  [■ 647 000             ]
Big numbers on the number line         [ ▶ Question 5 ]

The result
[fox] classyQuiz
        Big numbers on the number line
              (avatar, cheering)
                 ★ 7 / 13
               ▮ ▯ ▮ ▮ ▯ ▮ …
[ Play again ▶ ] [ Copy the answers for your AI ] [ ← Back ]
Your AI can explain a mistake, or check a solution that looks wrong.
```

- **The start:** the title and how many questions, the avatar (an animal
  and a colour, assigned) with the lobby's dressing menu, no words, and
  Start ▶.
- **A question:** the bar at the top (where the question stands, after the
  answer ✓, ✗ or ⊘ for not counted, the avatar, ★ the score), the question
  laid out as on the wall, its answers showing at once; on an upright phone
  the question smaller than on a wall and long answers in one column. A tap
  answers, and the key shows on the tiles: the solution ticked, the rest
  dim, the tap outlined, ✗ on it when wrong; a right answer makes the
  avatar jump over the question. At the foot the quiz's title and the next
  step, "▶ Question 5", "▶ Result" after the last, absent before the
  answer. A tap on the picture enlarges it; a tap closes it. Keys: 1–4
  answer, Space, Enter, →, ↓, PageDown or N go on, Z enlarges the picture.
- **The result:** the avatar cheering, ★ right / of, a bar per question
  that counted, full or empty; Play again ▶ (the same avatar, a new order),
  Copy the answers for your AI ("Copied: paste it into the chat with your
  AI", or the text shown to copy by hand), ← Back; under them "Your AI can
  explain a mistake, or check a solution that looks wrong."
- **Back,** from any of these, is the check again, its fold and fixes as
  they were. A reload of a quiz from the root page finds nothing (§3.1);
  the example's reads the example again.

### 3.9 Peers

A room that runs on its own, every device a player's, on `/play`; purpose
and reasons: docs/design/peers.md. English; light, as the class's screens.

```
The lobby, on the device that opened it
        Big numbers on the number line
┌───────────────────────────────────────────┐
│ [QR]  Friends join on classyquiz.pages.dev │
│       with the code                        │
│       50224                                │
│       or with the QR code.                 │
└───────────────────────────────────────────┘
          (avatars of everyone in)
[ Start ▶ ]
3 in, you among them. The quiz moves on once everyone has answered.
(avatar) ● ⬡ ★ ♥ ✿ ◎ / hats / tools

The lobby, on the others' devices
        Big numbers on the number line
          (avatars of everyone in)
(avatar) ● ⬡ ★ ♥ ✿ ◎ / hats / tools   (eye)
(avatar of whoever opened it) starts the quiz once everyone is in.

A question, answered, waiting
1 / 13                              (avatar)   ★ 0   [⋯]
        Which number does the arrow show?
                [the picture]
[▲ 646 000          ]  (outlined: the answer)
[◆ 645 000          ]
[● 644 000          ]
[■ 647 000          ]
Waiting for (avatar) (avatar)

The solution
1 / 13                         ✓   (avatar)   ★ 1   [⋯]
   (the winners jump over the question)
[▲ 646 000      ✓ 2]  [◆ 645 000       1]  (the spread, the rest dim)
Big numbers on the number line              [ ▶ Ranking ]

The ranking, done
1 / 13                              (avatar)   ★ 1   [⋯]
          1.  (avatar)  ★ 1
          1.  (avatar)  ★ 1
          3.  (avatar)  ★ 0
Waiting for (avatar)                        (button hidden)

The final ranking
        Big numbers on the number line
     (avatar)   (avatar)   (avatar)      (cheering)
        1.         1.         3.
       ★ 1        ★ 1        ★ 0
     (avatar) 3. / 3  ★ 0  (trophy)
[ Exit ]                      (the others: [ ← ])
Exit ends the quiz on every device.
```

- **The lobby:** the code, the address and the QR code on the device that
  opened the room only; Start is its player's. The dressing menu as in a
  class's lobby.
- **A question:** the device screen of §3.8 with the room's bar (where the
  question stands, after the solution ✓, ✗ or ⊘, the avatar, ★ the score;
  ⋯ on the opener's device). The choices show with the question. A tap
  answers, outlined dashed until the room has it, solid once stored; a
  change of mind until the solution shows. Once answered, the foot says
  "Waiting for" and the avatars of those present who haven't (six, then
  "+n").
- **The solution** comes once everyone present has answered: the key and
  the spread on the tiles, the winners jumping over the question. The foot:
  "▶ Ranking".
- **The ranking:** places 1 to 3 and, further down, one's own place,
  highlighted. The foot: "▶ Question 2", or "▶ Final ranking" after the
  last; tapped, it gives way to "Waiting for" and the avatars of those
  present who haven't. The next question comes once everyone present has.
  Keys as on the device screen.
- **⋯** (the opener's): "Solution now, without waiting" during a question;
  "Question 2 now, without waiting" or "Final ranking now, without waiting"
  after the solution; "Change the solution" at the solution (the choices as
  on the lobby's check, §3.3: Tap every right choice, Don't count this
  question, Done); "Remove a player…" (each avatar, Remove); "End the
  quiz: final ranking"; Close.
- **The final ranking:** places 1 to 3 cheering, one's own place, stars and
  a trophy. The opener's Exit ends the quiz on every device, which goes to
  the start page; the others have ←.
- **When something goes wrong:** a phone asleep or dead stops holding the
  room 45 s after its last sign, a closed tab at once; back, it is waited
  for again, with its avatar and score. Another device: the code, and its
  own avatar under "Which one are you?". The opener's device too: its ⋯
  comes with the avatar. A device of the opener's that reloads, or comes
  back from the start page's resume card, is its player again. Turned away:
  "This quiz is full: it takes no more players." / "This quiz has started
  and takes no more players."

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
- **Parallel classes:** each class its own upload of the .zip, its own
  code and order of the answers. Two quizzes at once: two codes; the resume
  card shows the latest, the other comes back with its teacher code.

## 5. When something goes wrong

| What happens | What they see | What they do |
|---|---|---|
| Tablet sleeps, Wi-Fi drops | Same avatar and screen on waking | Nothing |
| Tablet dies | — | Another tablet: code, own avatar under "Which one are you?" (it appears within a minute). Score kept |
| The dead tablet comes back after that | "Which one are you?" with **+** | Leave it, or **+** for another student |
| Tablets still joining after Start | They get in (first five minutes and the first question; then five more) | Nothing |
| A tablet left at its final ranking | Its place until the teacher's Exit, then the root page; after 3 h unused, "This quiz has ended" and ← | ←, then the code |
| Any teacher tab reloads, sleeps or loses Wi-Fi | The same role again | Nothing |
| Phone dies, or goes to the AI app for long | After 45 s the wall says "Remote gone – …", shows the bar, and keeps "Remote gone" on it | Steer at the laptop. The phone is the Remote again when it's back; without its tab, or another phone: the teacher code, which takes the steering without a question |
| The Remote's tab closed by mistake | Nothing on the wall for 45 s | The teacher code again, at once: a closed tab's Remote is taken without waiting (on the HTTP fallback, within 25 s) |
| A wrong answer to the second device's question | The wall steers where the phone should, or the other way round | ⇄ Swap, on either device |
| Projector dies | The Remote says "Projector gone" and how to bring it back | Read off the Remote. Optionally another computer: the teacher code (the free Projector, after 45 s), or the projector window on a two-screen laptop |
| Wrong code | Students: the code, ✗, the box. Teacher: "The last two digits don't match this quiz." | Type it again; after five wrong teacher codes in a minute, that device waits 10 minutes; after ten for the quiz, any device waits up to six minutes. The device that uploaded gets in with Resume regardless |
| Quiz ended by the teacher (Exit, Delete) | Every open screen goes to the root page | Upload the .zip again |
| Quiz expired (3 h unused) | Gone from the resume card; open screens say "This quiz has ended" | Upload the .zip again |
| School network blocks WebSockets | Nothing; a moment slower (v1 fallback) | Nothing |

## 6. Not established

- Whether "Projector" and "Remote" are the words a teacher reaches for.
- Whether children find the code box in the header. The first lesson will
  show.
