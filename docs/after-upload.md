# classyQuiz — After upload: from the .zip to Start

What the teacher's screens do between upload and Start: which screens, what
each is responsible for, what moves between them, and where the one setting
goes. Backlog v1 items 18–19, v4 items 2, 3 and 6. Written for the owner's
reaction, like docs/user-flow.md and docs/landing-story.md. Nothing here is
built.

**Closed, 2026-11-03.** How it got here, by the owner's reactions:
- **Draft 1** assumed that a mirrored wall has no private screen. Owner:
  "Sharing and not sharing a screen is a button press, sometimes with the
  added fn modifier. Less technically adept users use the cable or the
  button on the big screen. Every teacher uses the laptop for shared and
  not shared sections." So a check screen first is back, and draft 1's
  privacy question is withdrawn.
- **Draft 2** kept `/teacher`. Owner: "/teacher is clunky, a dedicated code
  (e.g. 2 digits longer) would address it. Would need to account for
  starting from either device — snapping pictures of hand-drawn notes,
  feeding them into the AI, downloading the zip, opening the quiz all on
  the phone, then connecting the projector is a powerful workflow. But so
  is doing the same with a pdf or doc from the laptop that serves as
  projector or hybrid." The way in is now a teacher code typed in the
  students' box. The problem it solves is both directions through one
  entry; a QR code solves one.
- **Draft 3** let screen size pick the role.
  - Owner: "Second screen detection is unreliable so it needs to add real
    value. Unsure how it currently works with phones and Miracast. Laptops
    might gain the second screen only after the check, and there's the
    issue of window size vs screen size. Tablets sitting in between and
    sharing all of these complications."
  - So nothing the site senses decides a role, a screen or a wording any
    more.
  - On the code read off a shared wall: "the teacher is in the room, it's a
    teachable moment. In situations where that doesn't apply the teacher
    can start with the projector off, or from the remote. If they don't,
    they will next time."
- **Draft 4** made the device that comes in ask one question.
  - Owner: one tap is fine. "By the time a second device gets connected,
    the user already knows about projector and remote and which role the
    device is." He required that a misclick be recoverable from either
    device; that is now Swap (§4).
  - On draft 4's random teacher code: it "tries to address the same
    nonexistent problem. A pupil that tries to sabotage class is not a
    technical problem. They can just steal the projector's power plug." So
    the teacher code is the class code plus two digits.
- **Draft 5:**
  - Start quiz ▶ on every screen that steers.
  - §8 accepted, with `/example` linked from the landing strip only until
    the storyboard video exists.
  - A limit on teacher-code guesses (§4). The owner's purpose for the code
    is "easy to go right, hard to go wrong". Outside scripts are the real
    attacker, the child in the room isn't a technical problem, and the
    limit covers the ground between.

## 0. Settled
1. **Check first, then Join,** on the single tab. One tap between them:
   **Show the class the code ▶** (§3).
2. **The teacher code:** the class code plus two digits, typed in the
   students' box, from any device, in either direction (§4).
3. **One question on the device that comes in,** "Show the quiz here, or
   steer it from here?", asked only when the one tab there does both. A
   misclick is undone by **Swap**, on either device (§4).
4. **Points for speed:** set on either screen, read by the class on Join,
   remembered on the device, fixed at Start (§5).
5. **Nothing sensed decides anything.** The window's width is used for
   layout only.
6. **Start quiz ▶** on every screen that steers (§3).
7. **`/example` is the check screen without codes** (§8).
8. **Wrong teacher codes are limited per quiz** (§4).

## 1. The cases it must land well

The wall shows what the teacher shares: by key press, cable, the
projector's own button, or casting. The site doesn't see any of it.

| Case | What the teacher does around the site | What they need first from it |
|---|---|---|
| Break-time upload on the projector laptop | No class yet, nothing to hide | The right quiz; the phone, if they use it; later the code |
| Everything on the phone: photos, AI, .zip, upload | Then either the laptop becomes the wall, or the phone casts to the projector | The quiz on the projector |
| A PDF or doc on the laptop that is the wall | The laptop is projector, or projector and steering | The right quiz; the phone as remote, if they want it |
| Class present, setup first | Unshared: checks, fixes, sets up the phone. Shares when ready | A private check, then the code on one act |
| Class present, joining in parallel | Shares at once, or never stopped | The code on the wall at once |
| Laptop extended to the projector, perhaps only after the check | The laptop's screen is private by layout | The class's screen on the other screen |
| A tablet as the wall, or as the remote | Either | Whatever it was picked up for |
| A visitor opening the example | No class | The questions (landing story §3.3) |

**Not designed for:** a big all-in-one touch screen that is itself the
wall. On it the teacher can't unshare, so nothing is private. Out of scope
for now (owner).

**Where two teacher devices exist,** the two jobs already run side by side:
the wall shows the join, the steering device shows the questions. Only the
single tab, the one that does both, needs an order, and the teacher's habit
gives it: the private part first, then share.

## 2. The setup steps, each with a verdict

| Step | Where it lives | Verdict |
|---|---|---|
| a) Right quiz, right version | Check: title, "12 questions", the list at full width | Keep. The count is what most often tells two versions apart ("make it 10") |
| b) Spot fix | Check, in the list; ⋯ during the quiz | Keep as is |
| c) Projector and Remote | The teacher code on every teacher screen; one question on the device that comes in; Swap (§4) | Change: one entry, both directions |
| d) Advanced config | Points for speed only (v4 item 6) | Change: from a Tempo line to one switch, shown to the class as a rule (§5) |
| e) Code on the big screen | Join. The class code is small on Check from upload ("upload is start") | The tap gives it emphasis; it doesn't create it |
| f) Joining, and at what rate | Count and avatars popping in, as today; tap to remove a double; "Nobody in yet?" after about 90 s (landing story §7) | Keep, plus the line. A rate display is more complexity than value: the avatars arriving are the rate |
| g) Everybody ready | The room. The teacher asks "anyone not on?" | No feature. The site doesn't know the class size. The door (5 minutes and the first question after Start) makes an early Start cheap |
| h) Start | Join | Keep; label in §3 |

## 3. The screens

**Two responsibilities:**
- **Check is the teacher's.** It holds the question list, the fixes, the
  teacher code and the setting.
- **Join is the class's.** It holds the title, address, class code, QR,
  count, avatars, the rules they play by, and Start.

**By role, whatever the device:**

| Teacher's tabs | Wall | Steering |
|---|---|---|
| One tab | Check, then Join after the tap | (the same tab) |
| Two tabs, two devices or two windows | Join only | Check, with the class code, count and Start (today's Remote lobby) |

A phone, a tablet or a laptop can hold either role. The layout follows the
window's width (one column when narrow), as today; the role doesn't. A
phone single tab casting by Miracast is a wall like any other, with Check
and Join like the laptop.

**The single tab after upload: Check**

```
┌────────────────────────────────────────────────────────────┐
│ Prozente · 12 questions                 Class code 63953   │
│                               [ Show the class the code ▶ ]│
│  Points for speed: off ›                                   │
│  A second device, to steer from or to show the quiz on:    │
│  on classyquiz.pages.dev, type 63953 47.                   │
│                                                            │
│   12 questions                         [Show all answers]  │
│    1  Was sind 10% von 250?                             ›  │
│    2  Eine Jacke kostet 80 Franken …                    ›  │
│   …                                               ⋯ More   │
└────────────────────────────────────────────────────────────┘
```

- **The class code is there, small.** "Upload is start": a teacher who
  reads it aloud has the class joining without the tap. A count appears
  beside it once someone has joined.
- **The teacher code sits at rest** in one sentence that names both needs.
  The sentence doesn't guess which device this is.
- **"Show the class the code ▶" is the primary button,** the one tap between
  the two screens.
- **A second window on this computer:** a quiet "or a new window here" after
  the sentence. It opens a window that asks the same question as any other
  device (§4). It is always there, so a laptop that gains its second screen
  after the check finds it where it was.

**After the tap: Join**

```
┌────────────────────────────────────────────────────────────┐
│ Prozente                                                   │
│   classyquiz.pages.dev   ┌─────┐   (person) 6               │
│   6 3 9 5 3              │ QR  │   (avatars)                │
│                          └─────┘                           │
│                  [ Start quiz ▶ ]                          │
│               Points for speed: off ›                      │
│     ‹ Questions               A second device ›            │
└────────────────────────────────────────────────────────────┘
```

- **Today's fold, without the sentence that names `/teacher`.**
- **"A second device ›"** opens a sheet with Check's sentence.
- **"‹ Questions"** goes back to Check. The class's screen ends at the fold.

**Start's label: Start quiz ▶,** the same on every screen that steers
(settled).
- **Where the mode is named now.** "Start as Projector + Remote" named the
  mode because "Start quiz" didn't say what the screen would become.
  - With one tab, there is no other mode to tell it from: the screen shows
    and steers, which is what a teacher with one device expects.
  - With two devices, the teacher chose each device's job a moment ago,
    when the second device asked. As the owner put it, they know which
    role each device is.

  So the mode is named where there is a choice, on the second device. A
  label that names a mode with no alternative says nothing.
- **It is the label the Remote already uses,** and the owner's own words
  in item 19 ("Start quiz", not "Start with a class").
- **"Projector + Remote" goes.** With `/teacher`'s two buttons gone, the
  names appear nowhere else. The guidance's account of a lesson, which
  names the button, changes with it.

**Dropped: a second-screen button** that promoted the new-window link when
`screen.isExtended` reported a second screen. For the owner's reasons, it
added a guess and no reliable value.

## 4. The way in: a teacher code in the students' box

**The entry is the one the students use.** That is the code box in the root
page's header, the box on `/play` after a wrong code, and Resume. Five
digits are the class code and lead to an avatar, as today. Seven digits
are the teacher code and lead to the teacher's side. There is nothing else
to type.

**The teacher code is the class code plus two digits:**
- **Shown as "63953 47".** The teacher reads the class's code and their own
  two digits. The two are drawn at upload and kept by the quiz.
- **Nothing new to claim.** The first five digits find the quiz as today
  (`JoinCode`); the quiz checks the last two.
- **Shown on teacher screens:**
  - at rest on Check and on the steering tab;
  - behind "A second device ›" on Join and in the wall's ⋯ during the quiz;
  - on the uploading device's Resume card.

  A child reading it off a shared wall is accepted (owner): a sabotaging
  pupil is not a technical problem.

**The device that comes in asks, in what it will do:**

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

| What is there when it comes in | What happens |
|---|---|
| One tab that does both (the usual case) | The question. "Show here": it becomes the wall, the other tab steers. "Steer from here": it steers, the other tab is the wall |
| A wall and a steering tab, one of them gone | No question: it takes the role that is free |
| Both held by tabs that are there | "This quiz already has a screen for the class and one that steers." A present tab is never pushed aside |
| Nothing there (both gone) | No question: it does both, as a tab that just uploaded would |

Both of the owner's workflows are one answer each:
- **Phone first, then the laptop:** the laptop answers "Show here".
- **A PDF on the projector laptop, then the phone:** the phone answers
  "Steer from here".

A phone casting by Miracast, a tablet or a second window answers the same
question, so none of them needs detecting.

**Swap: a misclick undone from either device.** While two tabs are there,
each has **⇄ Swap**: the wall becomes the steering tab and the steering tab
the wall, at once.
- **In the lobby,** it is a quiet line on both: on Join beside "A second
  device ›", on the steering tab under the sentence.
- **During the quiz,** it is in ⋯ on both.
- **No confirmation.** A swap is undone by the same tap on either device,
  and the class sees only the wall changing back.
- **It replaces the two one-sided moves:**
  - "Show the projector here" on the Remote, which today sends the old
    wall back to the role choice;
  - "Steer from here" on the wall while the steering tab is there, which
    today sends the Remote back.

  Both left the other device stranded. "Steer from here" stays for a wall
  whose steering tab is gone.

**What it replaces:**
- **`/teacher` and its Projector/Remote choice.** `/teacher` stays only as
  a redirect for old links, asking for the teacher code.
- **The gate "no new steering once students are in", and "Allow a device to
  join".** The class code never reaches a teacher role, so the teacher code
  is the gate, before and after the first student alike. A dead phone, a
  closed tab or a new phone mid-lesson: type the teacher code again.
- **The race against the first student, and the window's two minutes.**
- **The secret on devices that took a role** (second-teacher-device rule
  2): it is no longer needed to come back. It stays for Resume and Delete
  on the uploading device.

**Wrong teacher codes are limited, per quiz.** After 5 wrong two-digit
endings for one quiz within a minute, the quiz refuses teacher codes for
10 minutes: "Too many wrong codes for this quiz. Try again in a few
minutes." The numbers are proposals.
- **Exempt:** the uploading device. It comes back with its secret (Resume),
  so a script or a child can't lock the teacher out of their own quiz.
- **Counted per quiz, not per device.** The owner asked for "a device that
  tries many codes in seconds". Telling devices apart would need an
  identity, and a script drops any token we give it. The hardening entry
  ruled out the IP address: a class shares one behind the school's NAT,
  and the owner's "nothing identified" rules out IP-based limiting. The
  quiz is what a guesser attacks, and it is where the last two digits are
  checked anyway.
- **It costs no extra request.** The count sits in the instance, which the
  check already reaches. With the limit, guessing the two digits takes a
  script that knows the class code hours, not seconds.
- **What the hardening entry says about class codes** (decisions.md,
  "Hardening", under "Not done, and why"): it does *not* limit them. A
  refused request costs the Function request it was meant to save. A count
  in a Durable Object costs a request per guess, as much as the lookup it
  protects. Cloudflare's rate-limiting binding is approximate, its docs
  advise against keying by IP, and its support on Free/Pages isn't
  documented. And a guessed class code wins only an avatar, which the cap,
  the door and Remove handle. That stays as it is: a wrong class code
  finds no instance to count in.
- **What this changes in that entry:** its last reason, "Taking a role is
  already closed once students are in", goes with the gate (above). This
  limit is what covers that ground now. The entry needs a line saying so
  when this is built.

**A QR code** would solve laptop→phone only; the code covers both. On
Check, a QR for the teacher code could later be a shortcut for that one
direction. It is not the way in.

## 5. Where the one setting goes

After v4 item 6, the lobby's only setting is points for speed. The
15-second button lives on the question, not in the lobby.

- **Set on either screen, read on Join.** The setup-first teacher sets it
  on Check. The class sees it on Join as a rule: it changes how they play,
  and they should know before the first question. A class has an opinion on
  it ("with speed!"), so it can be tapped there too.
- **Wording:**
  - on a steering screen: "Points for speed: off ›"; a tap toggles it;
  - on a wall that doesn't steer: nothing while it's off, and "Faster right
    answers score more" while it's on;
  - optionally the same line in the tablets' lobby.
- **Fixed at Start,** like the avatars: changing it mid-quiz would mix two
  scorings in one ranking.
- **The default is this device's last choice,** else off. A teacher who
  always plays with speed shouldn't switch it on in every lesson. It is
  kept in localStorage as a convenience; losing it costs one tap.

The rule that gives it its place: settings the participants have an opinion
on show on the join screen. A setting the class doesn't feel lives on Check
only.

## 6. What moves between the states

| From → to | What moves | How |
|---|---|---|
| Root page → Check | Quiz id, secret, token, class code, the two teacher digits | Upload reply; secret and code in `cq.quizzes`, token in sessionStorage |
| Check ⇄ Join | Nothing on the server; the tab shows the other screen | "Show the class the code ▶" / "‹ Questions" |
| Any screen → a second device | A role | The teacher code in the code box, then the question when the single tab is there |
| Single tab → steering tab | Check | Another device or window answers "Show the quiz here"; this tab steers and stays on Check |
| Single tab → wall | Join | Another device answers "Steer it from here"; this tab is the wall and shows Join |
| Wall ⇄ steering tab | Both roles, at once | Swap, on either device |
| Join → quiz | Avatars and the speed rule, both fixed; fixes made on Check | Start quiz |

## 7. What it costs

- **One tap for the teacher who wants the class joining at once,** with the
  class watching. That is the default this design gets wrong in every
  lesson for that teacher. It is accepted: the button is the primary one,
  and the class code is readable on Check without it. Two alternatives
  were weighed:
  - a device that remembers, opening on Join when the teacher skipped
    Check last time. It is cleverness the teacher can't see, and a stale
    guess in the lesson where they do want to check.
  - join-first, as today, with Check below the fold. It saves the tap but
    gives up the setup-first order and the room on Check.

  **What would reopen join-first:** first lessons showing that most uploads
  happen at the front, shared, with the class waiting.
- **One tap on the second device,** the question, whenever the single tab
  is there. It is the price of not guessing; Swap makes a wrong answer
  cheap.
- **A teacher who shares while still on Check** shows the class the
  question list (answers folded) and the teacher code. That is their
  sharing act.
- **A run-through uses up the quiz** once v4 item 3 removes "Again with
  another class". A lone teacher can play their own quiz (Join, with their
  phone as a student), but the lesson then needs a fresh upload. The
  guidance's account of a lesson should say it.

## 8. The landing story

**Check-first flows back.** "Try the example" (landing story §3.3) shows the
example's questions read-only, "as the lobby shows it". With Check as the
first screen after upload, `/example` can be Check without codes:
- the same title line and question list;
- in place of "Show the class the code ▶": "Download the example (.zip)" and
  "Uploaded, it opens here, with a code for your class."

**The resume card** (landing story §3.2) says "On another device:
classyquiz.pages.dev/teacher and 63953". It becomes "On another device:
type 63953 47 in the code box".

**Linked from the landing strip only until the storyboard video exists**
(owner). A view of the questions for people is a stand-in for what the
video shows. Once the video is there, the strip links the video, and
`/example` stays only as the page the download sits on.

Landing story §3.2 and §3.3 change accordingly.

## 9. For the implementer

**Server:**
- **The two teacher digits:** drawn at upload, stored in the quiz's meta,
  and returned in the upload reply. `/api/join` takes seven digits: the
  first five find the instance, and the instance checks the last two.
- **Entering with the teacher code:** the table in §4. For "Show here",
  `takeRole` keeps today's "movable" handover; it gains the mirror for
  "Steer from here", where the newcomer steers and the single tab stops.
- **Swap:** a new op. It hands both roles new tokens and sends each tab a
  `role` message, the mechanism `evict` already uses for a moved role. It
  replaces `projectorHere`, and `steerHere` while the steering tab is
  present.
- **Wrong teacher digits:** counted in the instance (§4). It refuses
  further teacher codes for a while and lets the uploading device's
  secret through.
- **Remove:** the class-in gate in `choiceState`, `allowJoin` and
  `joinUntil`.
- **Migration:** quizzes open at the deploy have no teacher digits; they
  keep `/teacher` until they expire.

**Client:**
- **`home.ts` and `play.ts`:**
  - The boxes take seven digits. `maxlength` is 5 today, and `JOIN_CODE`
    gains a teacher pattern.
  - They route by length. Neither box submits by itself, so typing seven
    isn't cut off at five.
- **`play.ts`, `showRoles`:** the two buttons become the question in §4.
- **`screen.ts`:**
  - The managed lobby becomes two views of the single tab:
    - Check: `questionList`, the header line, the speed switch, the
      sentence and the quiet new-window link.
    - Join: today's fold without the `devices` sentence, plus the speed
      line, "A second device ›" and Swap.
  - The ⋯ items "Steer from your phone…" and "Allow a device to join"
    become the sentence.
  - The bar's "Remote gone [Allow a device to join]" becomes "Remote gone:
    type 63953 47 on another device".
  - Start reads "Start quiz ▶".
- **`teach.ts`:** `projectorLine` becomes the sentence, and the speed line
  replaces `tempoLine`. "Show the projector here" becomes Swap.

**Elsewhere:**
- **Docs:** user-flow §1 rules 2 and 5–7, §3.2, §3.3 and §5;
  second-teacher-device rules 2–4; the guidance's account of a lesson,
  which names `/teacher` and the Start label; decisions.md for the gate's
  removal.
- **v4 item 6:** the server work for the speed switch and the 15 s button.

## 10. Not established

- How a phone's browser behaves while casting by Miracast: whether it
  sleeps or drops the page. Nothing here depends on detecting the cast. It
  is a real-device check, like the 45 s presence question in user-flow §7.
- Whether teachers read "63953 47" as theirs and "63953" as the class's.
- Whether "Show the quiz here", "Steer it from here", "A second device",
  "Show the class the code" and "Swap" are the words teachers reach for.
- How often teachers upload at the front with the class waiting: the case
  that would reopen join-first (§7).
