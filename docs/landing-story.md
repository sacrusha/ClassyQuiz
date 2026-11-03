# classyQuiz — Landing story

What the root page says, to whom, in what order, and where the rest goes:
backlog v4 items 1, 2 and 4, with v1 items 16–19's history. Written for the
owner's reaction, like docs/user-flow.md. It ends in subtasks (§9). Draft 4
is built (as-built note below; decisions.md, "The landing page: the strip,
two steps, resume, four languages").

The example content: the first runs are in `.tmp/example/run*`, and the
redo on the new guidance is in `.tmp/example/v2-de`, `v2-en`, `v2-fr` and
`v2-it`. The redo is still in progress, so any number quoted here from it
gets checked against its final state.

**As built, 2026-11-03** (branch `landing`; S3–S6 and S8 of §9, S7 in part,
S5 with the redo's final zips). Where it differs from the draft below:
- **The strip's frames are stills, not drawn rooms** (§2, §5). Frame 1 is
  the rendered sheet's two pages, fanned, until the owner's photographs
  replace them; frame 2 a placeholder drawing of the act (a phone, two
  pages going up, a .zip coming back), no words; frames 3 and 4 the real
  screens from the redo, set in a dark bezel. The tablet is the plain
  colour buttons (`11-tablet-focus-buttons`) in every language: the
  example's second asks wanted pictures to tap, which a first-time teacher
  wouldn't ask for (coordinator). The wall is `30-projector-focus-reveal`
  for DE, EN and IT, i.e. question 2's votes and tick, not question 1's as
  §2 and §5 have it; their focus answers aren't the "tick read as 100" pair
  either (DE 56 640 against 56 320). French was re-shot with question 1
  as the focus (327 000 against 320 700, 12/6/2 votes,
  `.tmp/example/v2-fr/screens-q1/`), since its 30 leans on the question
  before it.
- **Step 1's detail** is neither the dated free test nor the personal
  frame: "Claude Opus wrote the example quiz, 3 Nov 2026." It is what is
  verified, with no claim about tiers. The personal frame's "expect paid
  Gemini or ChatGPT to work just fine" is untested, so it isn't used.
- **The wall's caption** is "What the class sees" (four words; §2's sketch
  had seven against its own five-word rule).
- **The labels** sit under their words, out of the text's flow; ruby
  spread the words when a label was wider than them.
- **Words at rest** above About: about 110 in English, against §2's 80.
- **The own-copy line** is item 4's one rule, not §6's table: a device that
  has uploaded, a site full on a day of the last 30; "On 3 of the last 30
  days this shared site was full, and new quizzes had to wait for the next
  day. A copy for you or your school is yours alone: how ›". §6's "every
  class stops" isn't true of the upload cap, which is what is recorded; a
  spent request allowance isn't recorded at all, so the count understates.
  At an upload the full site and the spent allowance say so in the chosen
  language, with "Your own copy: how ›".
- **The tablet's notice** says "This device", since a phone joins too.

**Draft 4, 2026-11-03.** `/example` is the example quiz on the Check
screen after upload, without codes (docs/after-upload.md §8), and nothing
else.
- **The page showing the sheet, both turns and the questions is dropped**
  as overload. No transcript is rendered anywhere.
- **A second message reshapes the quiz.** That was the one fact only the
  dropped page carried. It becomes a sentence in Build, stated as fact
  (§3.1).
- **The video plays from the strip only.**
- **The resume card** takes after-upload's teacher code (§3.2).
- **Run loses "No quiz yet? …"** Until the video exists, the strip links
  `/example` (§3.3).

**Draft 3, 2026-11-03.** The owner asked "strip, or video? Doing everything
is a busy distracting overloaded site." The answer is one element:
- **The strip is the video's poster.** Its four frames are the storyboard's
  keyframes, and a click anywhere on the strip plays the video in its
  place.
- **Nothing is shown twice:**
  - the ask's text appears only in Build, so keyframe 2 shows the act of
    asking, not the words;
  - the video plays only on the root;
  - `/example` keeps the conversation and the questions (superseded by
    draft 4: the questions only).
- **At rest the root is the story, Build and Run.** Everything else waits
  behind a click or a condition.
- **The video's beats** take the redo's numbers (§5).
- **A fallback** if the strip itself is too much: the video's single poster
  frame with ▶ (§2).

**Draft 2, 2026-11-03.** This draft folds in the owner's reaction to the
first:
- **One story for every screen.** Desktop, a tablet held sideways and a
  phone held upright all tell the same story in the same order. The sheet
  must read as a sheet; on a phone it may be hard to read. On a phone the
  strip can scroll sideways, and its frames can open larger when tapped.
  Draft 1 reordered the phone by device history; that's gone.
- **Languages.** The whole block above About is translated into DE, EN, FR
  and IT. About is for the AI and stays English. The switch sits top right
  in the header.
- **No hosting the example.** Opening it as a quiz would likely overwhelm a
  first-timer, who just wants to see the questions. "Try the example"
  becomes the example's questions, shown read-only.
- **A video shows the classroom.** The interaction in the room is what
  stills can't carry. A South-Park-ish 2D video from the owner's storyboard
  project does it. It is fed the real screens once the stills exist and
  never autoplays on the root. §5 is its brief. Draft 1's stepper is gone.
- **Language handling goes to the guidance, not the page.** When the
  exercise's language and the request's pull in different directions and
  don't resolve cleanly, the AI just asks. The labelled ask on the page
  still names the language (§8, for the guidance merge).
- **The labelled ask stays as text on the root.** "Guidance page is
  information, not instruction" has two purposes: not tripping injection
  guards, and not prescribing for nothing. A well-marked example of how to
  use an AI trips no guard. Draft 1's hiding of the ask in pictures and
  scripts is gone.
- **Build speaks to the teacher only where something must be done.**
  "Ask it" must be done, and the advice on how follows it. Draft 1's
  "Send your AI photos", "Tell it what to change" and "It hands you the
  quiz and says what's in it" are gone: the first two order what nobody
  must do, and the last isn't necessarily true. Step 1 is "Choose any good
  AI", with its detail as a dated test or a personal frame (§3.1).

## 0. What I want your reaction on

1. **Step 1's detail** (§3.1): a dated test, a personal frame, or both. The
   date waits for the free-tier test.
2. **The phone strip** (§2): one row that scrolls sideways, with the sheet
   first, large enough to read as a page in hand, and the next frame
   peeking in from the right.
3. **The video's brief** (§5):
   - the strip as its poster, the four keyframes, and the beats with the
     redo's numbers;
   - roughly 60 s, wordless, so one storyboard serves four languages with
     the screens swapped;
   - the fallback of a single poster frame, if the strip is too much.
4. **Where `/example` is linked once the video exists** (§3.3): from the
   video's last frame, or from nowhere on the root.
5. **Still open from draft 1:**
   - when and how loudly the own copy is mentioned, and its thresholds (§6);
   - the network help moving to where failure shows (§7);
   - "about 15 minutes" for an own copy, against "never measured" (§8).

## 1. Who arrives, and what each needs

| Who | Arrives with | Needs within seconds | Needs, if they stay |
|---|---|---|---|
| First-time teacher, laptop, tablet or phone | A colleague's tip or the README; no quiz | What the class will do; that their own AI makes it; what to say to it | The video; the example quiz's questions |
| Teacher with a .zip, in the break | The file, often on the phone that took the photos | Upload, at once | — |
| Teacher coming back mid-lesson | A closed tab, a laptop that slept | Their quiz, certain it's the right one (item 2) | The way back from another device |
| Regular teacher | Fifth week of use | Nothing new | Whether they can rely on the site (item 4) |
| Student, on a tablet | The address the teacher called out | The code box | Nothing |
| The teacher's AI | The site's name | The guidance below the landing part (About on), in English | — |

Two of these don't read: the first-timer and the student. What a
first-timer must grasp has to work as pictures plus a handful of words. The
student needs one box.

## 2. The first screen

Laptop, 1366×768, or a tablet held sideways:

```
┌──────────────────────────────────────────────────────────────────────┐
│ classyQuiz                         Code [_ _ _ _ _]  ▶      EN ▾     │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────┐     ┌──────────┐     ┌─────┐  ┌────────────────┐          │
│  │ sheet  │  →  │ teacher, │  →  │a    │  │ the class at   │          │
│  │ photo, │     │ phone,   │     │child│  │ the wall: votes│          │
│  │ in hand│     │ the AI   │     │taps │  │ and ✓, real    │          │
│  └────────┘     └──────────┘     └─────┘  └────────────────┘          │
│  Your           Your AI          Each      What the class    ▶ 1:00    │
│  exercise sheet                  student   sees on the wall            │
│                                  taps                                  │
├──────────────────────────────────┬───────────────────────────────────┤
│ Build a quiz                     │ Run a quiz                         │
│ 1 Choose any good AI.            │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│   Free Sonnet, tested … Nov 2026 │ │ [ Upload the quiz your AI     │  │
│ 2 Ask it to build you a quiz for │ │   made (.zip) ]               │  │
│   classyquiz.pages.dev [Copy]    │ │      or drop it here          │  │
│   For example, with photos of    │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│   two pages:                     │                                   │
│  ┌──────────────────────────────┐│                                   │
│  │ Hi! Can you make me a quiz   ││                                   │
│  │ for classyquiz.pages.dev …   ││                                   │
│  └──────────────────────────────┘│                                   │
│   this site · which exercises ·  │                                   │
│   your class · how many ·        │                                   │
│   which language                 │                                   │
│   A second message reshapes the  │                                   │
│   quiz.                          │                                   │
├──────────────────────────────────┴───────────────────────────────────┤
│ About classyQuiz … (English, for AIs and the curious)                 │
```

- **The strip is the answer to "what even is a quiz?", and it is the
  video's poster.**
  - Its four frames are the storyboard's keyframes (§5), in the video's
    order: the sheet, the ask, a tablet, the wall.
  - The two class frames are the largest, because they are the payoff.
    Each caption has at most five words.
  - A click anywhere on the strip plays the video in its place, at the
    strip's size, with a control to enlarge it. At the end the video
    stops on its last frame, and a click returns the strip.
  - The ▶ and the length sit in one corner. The strip reads as pictures
    first, and as a video only to someone who wants one.
  - Until the video exists, the keyframes stand as stills without the ▶,
    and a click on them opens `/example` (§3.3).
- **The sheet frame** is a photo of a page held in a hand, cropped so its
  edges and proportions show: a sheet, not a picture of text.
- **The ask frame shows the act, not the words:** the teacher with the
  phone, the photos going to the AI, the .zip coming back. The ask's text
  is shown once, in Build (§3.1).
- **The tablet and wall frames** are drawn rooms with the real screens set
  in. The wall shows question 1's votes with the tick: the right answer
  against the "one tick read as 100" wrong answer, e.g. 234 000 against
  230 400 in English (§5). It is the teaching moment. The votes come from
  the simulator, inside a drawn room with drawn children, so the frame
  reads plainly as an illustration, not as a real class's result.
- **The fallback, if the strip is too much:** one poster frame with ▶,
  the class at the wall (K4), captioned "What your class plays".
  The video then carries the sheet and the AI alone. Build has to say what
  the AI is given, so "For example, with photos of two pages" stays. The
  cost: the first glance answers "what is a quiz?" and leaves "how do I
  get one?" to Build's text. That is why the strip is the first choice.
- **Build** has two steps (§3.1). Step 2's how-to is the example's ask,
  set as a chat bubble, clearly marked as an example and labelled under its
  parts. The site's address in the bubble and the Copy button use the
  address the browser opened, as today (`home.ts`), so an own copy shows
  its own.
- **Run** is the box alone, with the resume card above it when a quiz is
  open (§3.2).
- **Gone from the first screen:**
  - the three Build bullets and "you can also ask it how the quizzes work"
    (the labelled ask and the guidance's "Build with the teacher" cover
    them);
  - both foot lines (§6, §7).
- **At rest the root is the story, Build and Run, and nothing else.** Each
  of the following waits behind a click or a condition:
  - the video, behind a click on the strip; until the video exists, the
    example quiz's questions (`/example`) take that place;
  - the resume card, shown only with an open quiz on this device;
  - the own-copy and network lines, shown only under the conditions in §6
    and §7.
- **Words visible at rest:** about 80, half of them the example's ask. The
  live page shows about 150.

**Phone held upright, 390 px.** The same story in the same order, in one
column:
- **The header** holds the logo, the code box and the language switch as
  a compact "EN ▾". It is tight at 390 px, so the logo may shrink to its
  mark.
- **The strip** is one row that scrolls sideways. The sheet comes first, at
  about 60 % of the width, so it reads as a page in hand. The next frame
  peeks in from the right, which says the row scrolls. A tap on ▶ plays
  the video in the row's place, at the full width. Swiping still scrolls
  the row. The row takes about 40 % of the screen's height, so Build
  begins above the fold.
- **Build, then Run.** With a quiz open on this device, the resume card
  (§3.2) sits on top of Run as everywhere. A teacher with a .zip on the
  phone scrolls past Build once. That is the price of one story, and it is
  small.

**A student tablet** (optional, unchanged from draft 1): a device that has
joined as a student and never uploaded could get the code box large in
the middle, above the strip. Try it only if the first classroom shows
children hunting for the box.

## 3. Build and Run, in detail

### 3.1 Build

```
1  Choose any good AI.
   <detail, one of the forms below>
2  Ask it to build you a quiz for classyquiz.pages.dev [Copy]
   For example, with photos of two pages:
   ┌────────────────────────────────────────────────────────────────┐
   │ Hi! Can you make me a quiz for classyquiz.pages.dev from these │
   │ two pages, with exercises like no. 1, 3 and 4? For my 5th      │
   │ grade class, about 10 questions, in English.                   │
   └────────────────────────────────────────────────────────────────┘
     this site · which exercises · your class · how many ·
     which language
   A second message reshapes the quiz.
```

The bubble is `v2-en/teacher-1.txt`, verbatim. The redo's asks name the
exercises by number, as in the owner's own exchange, so the labels gained
"which exercises". All four of the redo's asks name their language, the
German one included ("auf Deutsch").

- **The only orders are the two steps**, and both must be done: choosing
  an AI and asking it. "For example" marks the bubble as an example, not a
  script to copy. Its labels give the advice on how to ask without
  ordering anything.
- **"A second message reshapes the quiz."** It is a fact, not an order,
  and the one thing the dropped conversation page carried. v4 item 1
  found that the AI delivers at once and asks nothing back; the second
  turn is where the teacher shapes the quiz. Every redo run's second turn
  shows it: pictures to tap, a question added or dropped, keys corrected.
  It doesn't promise a dialogue.
- **The labels in place:** each one sits under its words in the bubble.
  On a phone, where the bubble wraps differently, the parts are underlined
  in the bubble and the labels follow it as one line.
- **Step 1's detail.** The owner's ranking, best first:
  1. a dated test: "Free Sonnet, tested 12 Nov 2026";
  2. a link, e.g. to claude.ai;
  3. naming the AI, the plan and the model ("Claude, free, Sonnet").

  A personal frame is also possible: "I typically use paid Opus; expect
  paid Gemini or ChatGPT to work just fine." The two combine: the personal
  line, plus the dated free test once it exists. Until the free-tier test,
  only the personal frame is true. The date and its wording follow the
  test (open decision).
- **Translated** (§4): the steps, the labels and the bubble. The bubble in
  each language is that language's real ask from its run, verbatim.

### 3.2 Run, and coming back (item 2)

```
│ Run a quiz                                         │
│ ┌────────────────────────────────────────────────┐ │   only on the device
│ │ Grosse Zahlen am Zahlenstrahl   question 4/10  │ │   that started it,
│ │ [ Back to the quiz ▶ ]               63953      │ │   until its final
│ │ On another device: type 63953 47 in the code   │ │   ranking
│ │ box                                            │ │
│ └────────────────────────────────────────────────┘ │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │ [ Upload the quiz your AI made (.zip) ] …      │ │
```

- Item 2 defines what the card shows: the latest open quiz only, its title,
  where it stands, and its code. Nothing about closing times, and no
  Delete.
- **It goes above the box.** With "upload is start" and no resume after the
  final ranking (item 3), an open quiz on this device means a lesson in
  progress or an interrupted one. Coming back to it is the likelier
  intention than uploading.
- The last line answers item 2's "the page doesn't say". It uses the
  teacher code (the class code plus two digits, typed in the students' box;
  docs/after-upload.md §4), not `/teacher`.

### 3.3 `/example`

`/example` is the example quiz on the Check screen, the first screen after
upload, without codes (docs/after-upload.md §8), and nothing else:
- the same title line and question list, with pictures, as a teacher sees
  their own quiz after upload;
- in place of "Show the class the code ▶": "Download the example (.zip)"
  and "Uploaded, it opens here, with a code for your class."

It is read in the visitor's browser from the example's static .zip, in the
chosen language. There is no upload, no lobby, no code, and nothing booked
against the site's budget.

**Linked from:** the strip, until the video exists, because a view of the
questions stands in for what the video will show. After that the strip
plays the video, and `/example` stays as the page the download sits on.
Whether the video's last frame links it then is for the owner (§0). Nothing
else on the root links it.

## 4. Languages

**What is translated:** everything above About, in DE, EN, FR and IT:
- the header's labels;
- the strip's captions, and the real screens set into K3, K4 and the
  video. K2's chat is drawn, not legible, so it needs no language;
- Build and Run, and Run's messages (the not-a-.zip messages, problems with
  the quiz, the resume card, the own-copy and network lines of §6–§7).

`/example` shows the chosen language's quiz. Its frame is the Check
screen's, which is translated or not along with the teacher's other
screens.

**What stays English:**
- **About and everything below it.** It is for the AI.
- **The sheet.** It is the input, and the point is that the sheet's
  language doesn't bind the quiz's: a French reader sees a German sheet
  become a French quiz.
- **The lobby, the wall, the Remote and the tablets.** They stay with the
  Later item "Localization". This pulls that item forward for the landing
  block only.

**The switch** sits top right in the header, as on most sites: "EN ▾",
listing Deutsch, English, Français, Italiano. The first visit takes the
browser's language when it is one of the four, otherwise English. A choice
is remembered on the device (localStorage, a convenience only). The static
HTML is English, so an AI's fetcher reads the English block, and a script
swaps in the chosen language.

## 5. The video, and the strip as its poster

**One element.** The strip and the video are one thing: the strip is the
video at rest, and the video is the strip in motion. Its four frames are
the storyboard's keyframes, and they appear in the video in the strip's
order. Nothing the video shows is shown again on the root or on `/example`.

**Why a video at all.** Stills show the screens. What they can't show is
the room: children typing the code, their avatars popping up on the wall,
the murmur when the votes split, the teacher pointing at one tick, the
groan and cheer at the key, the ranking as closure. That is the experience
a first-timer is deciding on.

**Brief for the storyboard agents** (the owner's project works from purpose
and situation):
- **Purpose.** A first-time teacher pictures their own lesson with
  classyQuiz, from sheet to ranking:
  - where the quiz comes from: their sheet and their own AI;
  - what the class does, and what the teacher does;
  - that the wrong answers start the discussion.

  Watched after a click, by someone who chose to watch.
- **Situation.**
  - A Swiss primary class of about twenty, numbers to a million.
  - The number-line quiz from the redo (`.tmp/example/v2-*`).
  - A school laptop on the projector, the teacher's phone, Android
    tablets on the desks.
  - 2D, South Park-ish: simple figures, no real children's faces or
    names.
- **Keyframes = the strip** (K1–K4), and the beats around them, each with
  the real screen set in where a screen is in view:
  1. **K1, the sheet.** In the break, the teacher photographs two pages of
     the exercise sheet with the phone, the page held in a hand.
  2. **K2, the ask.** The teacher sends the photos with one message, and a
     .zip comes back. The chat is drawn as shapes, not words, so it needs
     no language. The words are in Build.
  3. On the projector laptop, the teacher uploads the .zip. The wall shows
     the code and the QR code.
  4. The children type the code. Avatars pop up on the wall, and one child
     gives theirs a hat.
  5. **K3, a child taps a colour.** Start, then question 1: the arrow on
     the number line, on the wall. On a tablet, a finger taps a colour.
     Avatars pop into the wall's bar as answers land.
  6. **K4, the wall: votes and ✓.** Show votes. Most chose the right
     answer, and a cluster chose the "one tick read as 100" answer. A
     murmur. The teacher points at one tick, without words: one tick is
     1000. Show answer: the tick mark lands, with groans and a cheer.
     Question 1's numbers in the redo:

     | Language | Right | The tick read as 100 |
     |---|---|---|
     | DE | 327 000 | 320 700 |
     | EN | 234 000 | 230 400 |
     | FR | 327 000 | 320 700 |
     | IT | 237 000 | 230 700 |

     Every language has the same error at the same place, so one
     storyboard serves all four. The German reply names it itself ("Der
     Schritt wird falsch gedeutet (z. B. 320 700 statt 327 000)").
  7. **The final ranking:** avatars and a trophy, the class happy, nobody
     named. The last frame holds (whether it links `/example` is open,
     §3.3).
- **Constraints:**
  - **Fed the real screens:** screenshots from §9 S2, from each language's
    redone .zip, swapped per language. Wordless apart from the screens, so
    one storyboard serves four languages.
  - **Length:** about 60 s.
  - **Playback:** no autoplay, ever. It plays on a click on the strip, in
    the strip's place, with sound off until the viewer turns it on.
  - **Staleness:** when the UI changes, the screens are re-shot by script
    and the video rebuilt with them.
- **Left out on purpose:** the second turn. Its payoff differs per language
  (DE adds an "auf keinem Abschnitt" question; EN corrects two keys the
  teacher checked; FR and IT add an arrow), so it can't share a storyboard.
  Build's sentence "A second message reshapes the quiz" carries the fact.

**Order of work.** The keyframes come first, from the storyboard. Until the
video exists, they stand on the root as stills. The video follows, fed by
S2's screens. Whether the tool's output fits the site's CSP (only the
site's own scripts) is the one technical check. The video plays from the
strip only, nowhere else.

## 6. Own copy: the problem, and when the site speaks

Unchanged from draft 1, for the owner's reaction.

**The problem** (v4 item 4, owner's words). A regular user should self-host
before the shared site fails them. A first-timer won't read about it,
unless the site is close to running out and says so. Failing in front of
the class ends adoption. The existing "site full" message arrives at
exactly that moment, which is too late.

**What the site can know, with nothing identified:**
- **The device's history.** Kept on the device, never sent: the days this
  device uploaded a quiz, and whether it joined as a student. Today the
  only history is `cq.quizzes`, which keeps at most 20 entries and forgets
  closed quizzes, so it can't count a regular. A list of dates (no titles,
  no codes) is enough.
- **Its own budget today.** `SiteBudget` counts today's uploads against
  300, and the bytes stored. Uploads aren't the binding limit, though: the
  request allowance covers about 30–75 classes a day ("Hardening"). So
  uploads are a proxy, and "busy" has to be set well below 300, e.g. 25
  uploads.
- **Its own past.** On how many of the last 30 days it was full. The upload
  cap is easy to record: `reserve` already sees it. A spent request
  allowance is harder, because the site can't write when it is out of
  requests. The options: record it the next day from the platform's
  analytics, on a scheduled Worker, or from the first client after midnight
  that saw a quota error. That is for the implementer to size.

**When it speaks.** No new screen; one line under Run, at most:

| Device | Site | Line |
|---|---|---|
| No history | Any, except full | Nothing |
| Any | Full or out of allowance now | "The free site is full until 01:00 (Swiss time). Your own copy never is: how ›". Shown before an upload is tried. |
| Has uploaded before | Busy today | "Busy today: this free site is shared, and may fill up before evening. Your own copy: how ›" |
| Regular: quizzes on 3+ separate days | Never full lately | Once, dismissable: "You've run quizzes here on 3 days. This site is free and shared, so it can't promise to be there for every lesson. A copy of your own (or one for your school) can: how ›" |
| Regular | Full on N of the last 30 days | Not dismissable while N > 0: "This site was full on N days this month. When it's full, every class stops until 01:00 Swiss time. A copy of your own …" |

The last row answers the teacher's real question ("I'll run 20–30 a month;
can I rely on this?") with a fact instead of a hedge. The landing reads the
site's state with one request per visit. The page itself is a static asset
(Pages Functions serve only `/api`), so it still loads, and still shows the
line, when the allowance is spent.

**One copy per school.** `/own-copy` today assumes the teacher sets it up
themselves. That needs an AI that runs programs, such as Claude Code, and a
computer where they may install programs. Many teachers have neither. One
copy serves every teacher of a school, and the colleague or IT person who
sets it up once is the more realistic setter-up. `/own-copy` gains a short
part for that: who to ask, and what to forward them (the GitHub link and
the sample prompt).

**Not on the first visit.** The guidance below the landing still says the
site is shared and links `/own-copy`, so an AI asked about privacy or
reliability can say so.

## 7. Network help, where failure shows

Unchanged from draft 1, for the owner's reaction. The landing's network
line spoke to a teacher at home about a failure that happens at school.

| Failure | Where it shows | Help there |
|---|---|---|
| The school blocks the whole site | The filter's page on the teacher's laptop. Nothing of ours loads, `/check` included | Only off that network: on the phone's mobile data, or at home. `/check` gets a part readable without running anything: "If the site doesn't open at school at all", with the IT text |
| The laptop gets through, the tablets don't (student network, stricter filter) | The lobby: nobody appears, the children say it doesn't work | After about 90 s with the lobby open and nobody in: one muted line under the avatars, "Nobody in yet? If the tablets can't open classyquiz.pages.dev, the school network may block it: what to tell IT ›". Gone with the first avatar |
| The upload's request is blocked | The upload error | That message names the network as a possible cause and links the IT text |
| WebSockets blocked | Nothing: HTTP takes over (`net.ts`) | Nothing for the teacher. It costs the shared site more requests, which is a fact for the owner, not the teacher |
| A tablet reaches the page but not the quiz | The tablet's offline notice | "This tablet can't reach the quiz. Tell your teacher." The lobby line above covers the teacher's side |

The lobby line shows on a mirrored laptop, in front of the class. It is
harmless text, and its moment is exactly when the class is watching the
teacher wait. `/check` stays, linked from these places and from the
guidance; it is no longer on the landing.

## 8. Open, and handed on

- **"About 15 minutes."** The owner's guidance rewrite says an AI can set
  up an own server "within about 15 minutes". "The landing page by
  attention budget" dropped "five to ten minutes" because it was never
  measured, and a first setup that installs Node.js is likely longer. A
  timed setup settles it.
- **For the guidance merge (v4 item 5), the owner's words:** "if the
  exercise language and the request language pull in different directions
  and don't resolve cleanly, just ask". AIs resolve it from location and
  memory, there's no exhaustive list, and detail breaks things. The page
  carries none of it.
- **For the example's redo (S1)**, against `v2-*` as it stood at 19:12:
  - every ask names its language, the German one included ("auf
    Deutsch"): done;
  - the bubble shows each run's first ask verbatim. The transcripts are
    no longer rendered anywhere, so the replies' walls of text no longer
    need cutting;
  - `v2-de`'s question 11 puts "Auf keinem Abschnitt" among picture
    answers without `Order: fixed`, so it doesn't always stand last, as
    the guidance's "none of these last" expects. Whether that matters for
    the example is the redo's to judge.
- **Step 1's detail** waits for the free-tier test (open decision).

## 9. Subtasks

Each sized as a guess, for an implementer to resize. All belong to delivery
step A in the backlog unless named.

| # | What | Depends on | Size |
|---|---|---|---|
| S1 | Redo the example in four languages on the merged guidance: asks naming every labelled part, both turns, the final zips; the sheet printed and photographed in hand | Guidance merge (v4 item 5); in progress (`v2-*`) | Content work; a session |
| S2 | Screenshot script: from each zip, the real screens for K3, K4 and the video's beats, on the local stack with the simulator; re-run per deploy | S1's final zips; can start on `v2-*` | Small–medium (shots-tool and simulate.mjs exist) |
| S3 | Root: the strip as the video's poster (sideways-scrolling on a phone; linking `/example` until the video exists), Build's two steps with the labelled bubble and the second-message sentence, Run beside it; the foot lines removed | The keyframes (S9's first step; placeholders until then) | Medium |
| S4 | The landing block in DE, FR and IT, with the switch top right; the strings out of the HTML into one table per language | S3's final wording; S1's asks | Medium (the translation itself is small; the client messages in `home.ts` are the work) |
| S5 | `/example`: the Check screen without codes, from the example's static .zip by language, with the download | after-upload's Check screen; S1's zips | Small once Check exists |
| S6 | Resume card (item 2) with the teacher code line, and device history (dates only) | after-upload's teacher code | Small–medium; resume is item 2's work anyway |
| S7 | Budget state for the landing: one read endpoint, 30 days of full days, the lines in §6 | Sizing the allowance-exhaustion record; owner on §6 | Medium |
| S8 | Network help: the lobby line, the upload error, `/check`'s no-run part, the tablet's notice | Owner on §7 | Small |
| S9 | The storyboard from §5's brief, in the owner's project: first the four keyframes (the strip), then the video, fed by S2's screens | Keyframes: S1's numbers. Video: S2 | The owner's tool's |
| S10 | `/own-copy`: the one-copy-per-school part; the time claim per §8 | Owner on §8 | Small |

**How to check the prediction before building much:** show the four
keyframes to two or three teachers for five seconds, then ask what the
class does and what they'd type to their AI. If they can't say, the strip
fails, and no amount of implementation behind it helps; the single poster
frame (§2) is then the next thing to try. The keyframes and a mock of S3 are
enough for that test.
