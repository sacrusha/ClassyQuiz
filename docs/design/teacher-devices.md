# Teacher devices

## Purpose

The teacher steers a quiz while the class watches the projector and plays on
their own tablets. The site gives the teacher two jobs, each held by a tab:

- the **Projector** (role `screen`) is what the class sees;
- the **Remote** (role `remote`) is the teacher's own steering view.

Connecting a second teacher device has one purpose, in the owner's words:
"easy to go right, hard to go wrong". A teacher who starts on the phone and
ends on the laptop, or the other way round, or whose phone died, gets the
quiz onto the device they want without learning terms or steps. Outside
scripts are the real attacker: they must not be able to take the steering of
a quiz just because they know its class code.

Before the class joins, the teacher also needs to see at once that this is the
right quiz and to spot a wrong key. That is what the local check is for,
before anything goes up (`local-check.md`); the lobby's check keeps the
questions and their fixes at hand, folded.

The same screens serve a host who runs a quiz for a crowd that isn't a class
— a pub, a family, a training room, a video call (backlog v5 item 4,
Quizmaster). Such a host needs the screens to read as theirs, and only the
setup they have explained: some steer from a phone, many from the one screen
everyone sees.

## Situation

Who teaches and with which devices is in `backlog.md` (Project, Constraints).
What matters here:

- **A teacher has one to three devices:** a laptop that is also the
  projector (shared or mirrored), a phone, sometimes a tablet. Owner:
  "Sharing and not sharing a screen is a button press, sometimes with the
  added fn modifier. Less technically adept users use the cable or the
  button on the big screen. Every teacher uses the laptop for shared and not
  shared sections." So a private screen exists on the laptop even when it is
  the projector.
- **Both workflows are real.** Owner: "snapping pictures of hand-drawn
  notes, feeding them into the AI, downloading the zip, opening the quiz all
  on the phone, then connecting the projector is a powerful workflow. But so
  is doing the same with a pdf or doc from the laptop that serves as
  projector or hybrid." A way in that works in one direction only is not
  enough. Some teachers set up before the students are involved, some join
  the remote on the last screen in parallel with them.
- **The site cannot sense the setup.** Owner: "Second screen detection is
  unreliable so it needs to add real value. Unsure how it currently works
  with phones and Miracast. Laptops might gain the second screen only after
  the check, and there's the issue of window size vs screen size. Tablets
  sitting in between and sharing all of these complications." So no role,
  screen or wording depends on what the browser reports about screens; the
  window's width changes layout only.
- **Drops are rare and teachers are not trained for them** (backlog v2 item
  8). What the owner expects: a device loses its connection and comes back
  with its role; a phone's battery dies and the teacher carries on from the
  laptop; a dead projector means reading the questions off the remote and
  improvising. Both devices dying is "oh well, quiz is over", though a new
  device can still take over (below).
- **Who the attacker is** (owner): hardening against outside attackers and
  14-year-olds writing automated scripts is real; a child in the room "can
  just steal the projector's power plug", and a pupil sabotaging class "is
  not a technical problem". The room is the teacher's to manage. What the
  site avoids is handing the code to the room unasked: "be careful of
  children accidentally taking the remote" (owner).
- **A school shares one address.** Everyone behind the school's NAT looks
  like one device. A limit keyed on the address therefore also catches the
  teacher's second device when pupils on the same Wi-Fi try codes.
- **A big all-in-one touch screen as the wall** leaves the teacher unable to
  unshare; nothing is private there. Out of scope (owner).
- **Three arrangements of screens** (`playing-redefined-notes.md`, 4): a
  screen and a remote (the example class's: the laptop on the
  projector, the teacher's phone); one screen that steers itself, by its bar,
  the keyboard or a clicker (built: `question-flow.md`); and devices only,
  the question on each player's device and no wall (not built for a room;
  Peers builds the room with the question on each device, v5 items 3 and 6).
  A video call that shares a window has a big screen: the shared window.
  Only some hosts have a remote; a teacher at a mirrored laptop, a pub host
  at the TV and a trainer in a call need none.
- **Words that name the classroom's roles** (teacher, class, students,
  "your teacher") tell a host who isn't a teacher that the screens are
  someone else's. Owner: "host" is acceptable, not
  great, in English (in software, participants connect to a host too), and
  a role noun is avoided where a sentence does without one; translations
  come later and will hit meaning, not the literal word. The site's own
  screens are English (`local-check.md`, Situation). Which word stands where
  "teacher" stands on the README, the landing and the guidance is v5 item
  9's, decided once for all entries.
- **A Quizmaster reaches the lobby having seen the questions:** the local
  check shows them before the upload, with their fixes, which go up with
  the quiz.

## How the site meets it

### One entry: the teacher code

The class code (five digits) never reaches a teacher role; typed by a
student it leads to an avatar. The **teacher code** is the class code plus
two digits, shown as "63953 47" on teacher screens and typed in the same code
box the students use (root page, `/play`). The box routes by length: five
digits are a student, seven a teacher device (`TEACHER_CODE` in
`shared/protocol.ts`; `/play#6395347`). One entry serves both workflows from
either device; a QR code would serve one direction only.

The two digits are drawn at upload and kept in the quiz's `meta.teacher`
(`server/instance.ts`). The first five find the quiz; the quiz checks the
last two, at `/api/join` and again in `takeRole`, whatever the page did.

The device that uploaded holds the quiz's secret (kept in the browser; Resume
and Delete use it) and needs no digits: Resume goes in with the secret.
`/teacher` is kept only for old links; on a device that did not upload, it
asks for the teacher code.

Where the code is shown: on the teacher's own screens at rest (the check
once a remote is wanted, below; the steering tab), behind "A second device"
on the join screen (likewise) and in the wall's menu in the lobby and during
the quiz, on the uploading device's Resume card, and in Leave's
confirmation. It is not in the steering bar in front of the class: when the
Remote is away the bar says only that the Remote is gone and points to the
menu, because the bar is in front of the class exactly when the Remote is
likeliest away, and a tablet that read the code there could take the
steering. Screens and wording: `user-flow.md §1`, `§3.2`, `§3.3`.

### The single tab: check, then join

The tab that uploads is the Projector and steers itself. It opens on the
**check**, the teacher's private screen: title and number of questions (the
count is what most often tells two versions of a quiz apart), the join code
small (with a count once someone has joined), how the screens are arranged
(below) with the teacher code where a remote is wanted, and the question
list with its fixes, folded and closed on arrival: the local check showed
it before the upload, and its fixes came up with the quiz, so a list open
here would only make the teacher scroll past it a second time. One tap,
"Let everyone in", leads to the **join screen** and lets the class in:
teacher devices come in at any time, student devices only from that tap (or
Start) on, and one that arrives earlier waits and joins by itself. Letting
the class in is the moment the quiz starts to cost the day's allowance, so a
quiz uploaded only to look it over costs none (`hosting-and-limits.md`,
"Running classes finish"). With a Remote, the Remote's lobby has the same
button until it is tapped, and the wall shows the title without the code. The
**join screen** is the class's: address, code, QR, avatars, Start. The class's screen
ends at the fold; a quiet line goes back to the check ("‹ Back": it holds
more than the questions) or, where a remote is wanted, opens the
second-device sheet.

Which of the two a tab shows is kept per tab (`tabLobby` in `client/dom.ts`,
sessionStorage), so a reload stays; a wall that takes the steering back in the
lobby shows the join screen, not the check. With two tabs the work splits: the
wall shows only join; the steering tab shows the check with class code, count
and Start.

Start reads the same on every screen that steers: the mode is named where
there is a choice, on the second device, since a single tab has no other mode
to tell it from. Labels: `user-flow.md §3.3`.

The worked example's "Start the example quiz" (`example-page.md`) opens
the local check; its "Open the lobby" is an upload like any, and leads to
this same check, with codes and fixes.

### How the screens are arranged

The owner's sequence for a Quizmaster: the choice first (the local check's
card, `local-check.md`), then how the screens are arranged, as a toggle with
an explanation, and the remote's how-to only where it applies. The how-to
needs the teacher code, which exists only once the quiz is up, so the toggle
sits on the lobby's check, not on the local check's card.

- **Two values:** *One screen* ("It shows the quiz and steers it: the
  buttons under the quiz, the keyboard or a clicker.") and *Screen and
  remote* ("One device shows the quiz, another steers it: a phone, say.").
  Under Screen and remote, the how-to: "On the second device, open
  classyquiz.pages.dev and type 63953 47", and on a laptop the second
  screen's window. It names neither device's role, since either may be the
  one in hand (the phone-first and the laptop-first lesson). Under both, a
  video call: "the window you share is the screen everyone sees".
- **It changes words, not what a device can do.** A second device still
  comes in by the same teacher code, whatever the toggle says, and ⋯ →
  A second device… has it on every steering wall; with One screen it is
  only there, off the check and the join screen. A Remote that was there
  and is gone brings the how-to back after "Remote gone.", whatever the
  toggle says. The server isn't told: nothing it does depends on it.
- **One screen unless this browser knows better.** One screen is what every
  host has and what needs no setup (rule 4 of `user-flow.md` §1); the
  remote is the optional second device in the owner's words. The choice is
  kept per browser (`arrangement`, `client/dom.ts`), and a browser that has
  had a Remote, on either side, is set to Screen and remote: the example
  class's teacher who steers from the phone makes the choice once, or not
  at all. Plausible assumption: a laptop or phone is used the same way
  lesson after lesson; on a shared school laptop the next teacher at worst
  sees the how-to they may not need.
- **Devices only is not offered.** For a Quizmaster it would be a host who
  steers with nobody watching a common screen: a call shares a window, a
  table of friends is Peers, and a host without any wall can already be the
  one screen that steers and read the questions aloud (`user-flow.md` §4,
  "Phone only"). What it would take: the room with the question on each
  device that Peers builds, steered by this site's Remote, with the join
  code on the host's device; cheap once that room exists, if a host turns
  out to want it.

### Words for any crowd

From the check on, the screens' words name no role where a sentence does
without one, so they read as a class's and as a pub's: "Let everyone in",
"Join code", "Joining opens in a moment.", "Ask whoever runs it.",
"everyone watches this screen", "everyone reads the question", "The last
two digits don't match this quiz." The example class is still the design
target: a child who reads slowly or no English shows the tablet to the
teacher, as before. "Projector" and "Remote" stay, the roles' names, which
the owner uses for any host ("use one as remote the other as a
projector"). These docs keep "teacher", "class" and "teacher code": they
speak of the example class. The words before the check (the root page, its
resume card's "Class code", the guidance, the README) and the `/check` page
for IT ("a site for classroom quizzes") are v5 item 9's. Screens and words:
`user-flow.md` §3.2–3.5.

### A second device: one question, only when needed

`entry()` in `server/instance.ts` decides what a device arriving with the
teacher code does, by what is there, never by the device:

| Present | What happens |
|---|---|
| One tab shows and steers (the usual case) | The device is asked: show the quiz here, or steer it from here. The first tab becomes the other role. |
| Projector and Remote, one of them gone | No question; it takes the free role. |
| Both tabs there | "full": a tab that is there is never pushed aside. |
| Nothing there | No question; it shows and steers, as a tab that just uploaded. A gone Remote's token goes with it, so the next device is asked. |

The device acts once, on arrival; one left on the question or on "full" never
takes a role later by itself ("Try again" asks anew). One tap is what not
guessing costs; by then the teacher knows projector and remote and which this
device is (owner). Phone casting by Miracast, a tablet, a second window all
answer the same question, so none needs detecting. On a laptop, "open a
second screen in a new window" opens a window that asks the same question
(a browser may block it; the page says so).

A Remote is held only while its tab is **present**. After `QUIET_MS` (25 s)
without a sign, or once its line has closed and not come back, it is quiet,
and the teacher code takes it at once; its old tab hears "lost" if it returns.
Otherwise a teacher who closed the steering tab and typed the code again was
told "full" for most of a minute. "Full" still says: if one of them was on
this device a moment ago, try again in half a minute. A polling tab on the
HTTP fallback whose poll is held counts as heard from now.

**Swap** (`swap` in `server/instance.ts`): while both tabs are there, either
can exchange the roles at once, with no confirmation; the same tap undoes it.
It exists because the question is one tap and a misclick has to be recoverable
from either device (owner). Both tabs get new tokens; the other hears its new
role. In the lobby it is a quiet line on both; during the quiz it is in the
menu on both.

### When a device is gone

Presence changes with time, not events, so teacher pages send a periodic
`tick`.

- **The Remote gone.** The wall steers again `FRESH_MS` (45 s) after the last
  sign from the Remote and says "Remote gone". When the phone comes back with
  its tab it is the Remote again. A new phone, a closed tab, a dead battery:
  the teacher code takes the steering, before and after the first student
  alike.
- **The Projector gone.** The Remote says so and how to bring it back: the
  teacher code on the projector computer, which takes the free Projector
  without a question. A free Projector while a Remote steers is open to any
  device with the code.
- **A clicker or the keyboard** works on any Projector during the quiz, also
  while a Remote steers. Other commands from a Projector that does not steer
  are refused.
- **Leave** drops a role; the device comes back with the code.
- Roles belong to tabs, not devices: each tab keeps its token in
  sessionStorage, so a reload, sleep or a dropped connection resumes the
  role, and a two-screen laptop holds both in two windows.

### Wrong teacher codes

Two digits are 100 possibilities, so guesses are limited. The counts live in
the instance's storage (`guesses`), so an idle instance does not forget them.

- **Per device** (`GUESS_MAX` 5 within `GUESS_WINDOW_MS` 1 min): the fifth
  wrong ending refuses that device's teacher codes for this quiz for
  `GUESS_LOCK_MS` (10 min). A device is its address as a hash salted with a
  salt drawn per quiz and stored with the upload; the hash is stored only
  while it counts and the alarm deletes it afterwards. With no address (local
  development) the device is the quiz. Owner: the "no IP addresses" decision
  is about logs and retention, not about detecting attacks.
- **Per quiz, whatever the addresses** (`QUIZ_GUESSES` 10, one more every
  `QUIZ_GUESS_EVERY_MS` 6 min): covers many addresses (an IPv6 range, a
  botnet). Used up, every teacher code for the quiz is refused, the right one
  too, since otherwise the answers would tell it. A sweep of the 100 endings
  takes about nine hours, about half that to hit on average; a quiz lives
  3 hours past the teacher's last step.
- **Not counted:** an attempt without two digits (the class code alone) is no
  guess at them; a right code; a refusal. **Exempt:** the uploading device's
  secret.
- The answer is `TOO_MANY_CODES` ("Too many wrong codes for this quiz. Try
  again in a few minutes."), HTTP 429 at `/api/join`, an ack at `takeRole`.
- **The cost.** A script, or a class typing seven-digit codes, can keep the
  teacher's second device out, a try at a time every six minutes. Behind a
  school's NAT, a pupil's five wrong codes lock the teacher's second device
  out for ten minutes. The uploading device (Resume) is the teacher's way in
  then.
- Class codes are not limited here: a wrong class code finds no instance to
  count in, and a guessed class code wins only an avatar. Other caps:
  `hosting-and-limits.md`.

## Not known

- Whether teachers read "63953 47" as theirs and "63953" as the class's.
- Whether the words (Show the quiz here, Steer it from here, A second device,
  Swap) are the ones teachers reach for.
- Whether hosts read the toggle as a question about their setup, and
  whether One screen as the first default costs the example class's teacher
  the remote's how-to they came for (it is one tap, then remembered).
- Whether a teacher or a host misses the questions open on the lobby's
  check; whether "‹ Back" says where it leads.
- Whether "Join code", "Let everyone in" and "Ask whoever runs it" read
  naturally to a teacher, a child's helper and a pub host; no one outside
  the project has read them.
- Whether "another device via the menu" is read as meant on a wall.
- How a phone's browser behaves while casting by Miracast (sleeps, drops the
  page).
- Whether 45 s is right once a phone in a pocket has been seen in a lesson,
  and whether a throttled hidden projector tab is wrongly counted away.
- How often teachers upload at the front with the class waiting, the case
  where opening on the check costs a tap every lesson.
- Whether the limit works against a real attacker on Cloudflare (the
  `cf-connecting-ip` header there; which count applies).
- That the alarm clears a device's hash once its count runs out (known from
  the code, not observed).
