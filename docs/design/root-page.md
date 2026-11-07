# The root page

## Purpose

The root page is the first thing a teacher meets, and the teacher may not be
technical. If they don't see within seconds how to get a quiz and how to start
one, nothing else on the site matters, however good the guidance below it is
(backlog v1 item 16). So the page does three jobs and no more:

- **Build**: tell a first-time teacher how a quiz comes to exist. A first-timer
  faces two obstacles, "how do I ask?" and "what even is a quiz?", and one
  concrete instance answers both: what the AI hands over is what the class
  plays, and the words that produced it are the how-to-ask (backlog v4 item 1).
- **Run**: take the `.zip` the teacher's AI made, and give the teacher who comes
  back mid-lesson the way back to their quiz.
- **Be found by students**: a code box in the header, since the teacher tells
  the class the address and the class needs one box. Unobtrusive on the
  teachers' page, and easily found by whoever knows to look at the top and
  what the box looks like; the wall shows both until the first student is in
  (`class-and-wall.md`, "Getting in").

Two further jobs appear only when they apply, at the place where they apply:
help for a school network that blocks the site, and the offer of an own copy to
a teacher who is running into the shared site's limits.

The page is also, unavoidably, the page an AI reads when told the site's name.
That side is `design/guidance-page.md`; what the landing block says is read by
the AI too.

## Situation

Who arrives, and what each needs:

- A first-time teacher, on a laptop, tablet or phone, with a colleague's tip and
  no quiz yet. Needs: what the class will do, that their own AI makes the quiz,
  what to say to it. Doesn't read much.
- A teacher with a `.zip`, in the break, often on the phone that took the
  photos. Needs to upload, at once.
- A teacher coming back mid-lesson: a closed tab, a laptop that slept. Needs the
  way back, and certainty that it is the right quiz.
- A regular teacher (plausible assumption: 20 to 30 quizzes a month) who wants
  to know whether they can rely on the site.
- A student on a tablet, with the address the teacher called out. Needs the code
  box and nothing else.
- The teacher's AI, with the site's name. Needs the guidance section.

The product's situation (the example class, the devices, which AI, the free
plan) is the backlog's Project and Constraints sections. What the page has to
live with in particular:

- Not every AI hands over files. Owner, on the text version of the upload box:
  ".txt/.md invite users to type their AI questions into the textbox — people
  tend to be like that." Pasting the quiz text was itself a distractor.
- The shared site runs on a free plan whose limits are the account's, shared by
  everyone who uses it (the caps are in `design/hosting-and-limits.md`). A refused upload in front of a class ends
  adoption.
- A school network may block the site, or only its live connection, or only the
  students' network may be stricter than the teacher's. The owner's frame: no
  probe days ahead before the package works; a check can be part of what is
  presented. Plausible assumption: a teacher is rarely at school when they
  first read the page (so the network help sits where the failure shows).

## How the site meets it

The screens and their wording are `user-flow.md §3.1`. This section says what
each part is for and what it depends on. The page is `src/public/index.html`
(static, English, what AIs read) and `src/client/home.ts` (which puts the
visitor's language and the live parts into it).

### One page, two readers

The landing block is above "About classyQuiz"; About and below is the guidance.
An AI told the site's name fetches the whole page, so the landing block is
written as information to a reader, with commands only for what must be done
(choosing an AI and asking it). The owner's purpose: the page
doesn't order its reader about for things nobody must do. The teacher's own
sentence to their AI, the example ask, is outside that: "Read ..." is fine
there.

Parts that must not read as text for an AI are made by the script, not written
in the HTML: the Copy button (a fetcher's text conversion would read
"classyquiz.pages.dev" and "Copy" as one word) and the language switch (so a
fetcher doesn't read four language names).

### The film

Purpose: that of the strip of five stills it replaces, carried over. A
first-timer should see what a quiz is before reading anything: the whole path
from the exercise sheet to the class playing (backlog v4 item 1). The owner's purpose for a film in the strip's
place: "make it easier for users to understand what this page is and does, so
they understand whether it's what they need, and how to use it if it is." Five
stills showed the path; what the class does, which a teacher who doesn't know
classroom quizzes can't guess, takes motion: the tablet answering to the wall,
the teacher's phone setting the pace, the votes splitting before the solution.
What the film itself must get across, and how it is made: `docs/film/`.

The film's player is one people already know from video: a poster with ▶,
and under it a bar with play, a time bar to drag, the time and the length,
the speed and full screen. Anything the player does that a video player
doesn't takes attention away from the film. The five steps the strip
showed are in the film itself (`docs/film/`). Their starts are ticks on the
time bar, and dragging shows the step's name over the thumb.

What it lives with, beyond the page's own situation:

- The page is what AIs read, so the film's words can't be in the HTML.
- A phone held upright gives the film about 358 × 201 px; a phone held
  sideways has little height.
- The film has no sound and no words of its own: text appears only on the
  screens it shows, as on the real ones.
- The story must work on a desktop and on horizontal tablets as well as on
  vertical phones.

How the page meets it (the details: the comments on the film in
`index.html`; the page side: `client/film-poster.ts`):

- **Before a press** the page holds the poster frame as a picture, ▶ and the
  bar. The poster is the teaching moment: the class at the wall with the
  votes split between the right answer and the typical error, no solution yet,
  tablets in hands, the teacher with the phone. It is rendered from the film
  per language (`landing/film-*.webp`); the static HTML names the English
  one, so a first visit in another language also loads the English poster:
  about 30 KB where the browser takes the 800 px picture, 65 KB where it
  takes the 1600 px one, as a phone's dense screen does.
- **The bar works before the film is there.** The film's script, about
  140 KB, loads on the first press of ▶ or the picture, or on the first move
  of the time bar. It paints the same frame over the picture, then plays
  from the start or shows the moment the bar was moved to. The bar shows
  that time while the script loads. The speed works without loading
  anything. Full screen needs the film, so it keeps its place hidden until
  then. If the script can't load or can't draw, the picture stays and the
  next press tries again.
- **Words.** The film speaks the page's language up to the upload: the ask
  typed to the AI (Build's labelled ask, word for word), the teacher's second
  message, the quiz, and the root page with its Run box. From the upload on,
  the site's screens (the check, the wall's chrome, the Remote, the tablets)
  are English, as on the real site. Every language shows the same quiz, the
  example's 646 000 number-line question, translated: wrong answers in
  several different examples would linger. The German, French and Italian
  words are drafts pending the owner's review. A language switch takes the
  film back to its poster in the new language.
- **Layout.** The film stands centred above Build and Run, at most 62% of the
  screen's height, the bar under it and as wide. A phone held sideways gets
  the same layout as a desktop. A phone held upright differs where it has
  to: its film is about 358 px wide, and one row would leave the time bar
  too short to drag, so the time bar takes a row of its own. What the site
  is and how to use it is the film's to show, so Build and Run may start
  below the first screen. Watching the film big is
  what the full screen button is for: the browser's full screen where it
  has one, else the film fixed over the viewport (iPhone Safari).
- **The end card** shows the mark and the address. Once the film has played
  to the end, a replay icon stands on it: an icon, not "Play again", so the
  wordless film carries no words to translate; its accessible name is the
  page's.
- The stage's accessible name says what it is, "a film without sound". It,
  ▶, the replay, play and pause, the time bar, the speed and full screen
  are named in the page's language. The time bar's spoken value is the time
  and the step's name.
- Under the film, "The example, step by step ›" links `/example`, the worked
  example (`design/example-page.md`), named for what a teacher looks for (a
  walkthrough), not for what the page is to us ("how it was made").

### Run first when stacked

Below 860 px wide Build and Run stand one above the other, and there Run comes
first. Build is about 650 px tall on a phone, so with Build first the upload box
sat a full screen down on every phone, past a natural place to stop reading: the
teacher with a `.zip` on the phone that took the photos, and the one coming back
mid-lesson, whose way back is in Run, had to scroll for it. Run is short (the
heading and the upload box), so Build's heading still shows below it on phones
from 360×640 up. A first-timer meets the upload before the how-to; the film
above tells the story and the button says "the quiz your AI made". A running
quiz's card makes Run taller and can push Build off a small screen; that
teacher came for Run. The order is visual only: the HTML, side by side on wider
screens, and the order for keyboards and screen readers keep Build first.

### Build: two steps

Step 1 is "Choose any good AI." Its detail states only what is verified, with
tier and date: free Claude Sonnet wrote the example above (the film's quiz,
and `/example`'s), 4 Nov 2026 (`design/example-page.md`), and is the one free AI that does this reliably,
the owner's finding of 5 Nov 2026 against free ChatGPT, Gemini and Copilot
(`design/guidance-page.md`, "The AIs verified against"). No claim about what an
AI can do goes on the page without the tier and date of the test (the pattern
in backlog v4, owned by design/guidance-page.md); nothing gives a duration.

Step 2 is the ask. It says "the AI" where a pronoun would do: in the owner's
testing Build had too many "it"s to follow. The address shown in the bubbles
and in Copy is the one the browser opened, so an own copy shows its own.

Three example asks, each for something a teacher may bring: exercise sheets,
an idea put in words, or nothing yet. They are tabs, one picture each (the two sheets,
a chess board, a question mark), the chosen one joined to its bubble, so the
picture names the situation and no lead-in sentence is needed ("For example",
"Or", "The AI then" were cut for it). Each tab's name in words is its
accessible name and tooltip. The tabs are made by `home.ts`: without it, and
for an AI's fetcher, the three asks stand one under the other, sheets first.

- **Sheets**: a chat bubble with five parts underlined and
  labelled under their words: this site, which exercises, your class, how many,
  which language. The labels are advice on how to ask, given without ordering
  anything. The labels stay under their words on a phone too: in the owner's
  testing the labels set out as one line after the bubble read as broken. From
  320 px up no label overlaps another or leaves the bubble, in the four
  languages. Its words
  were read wrongly in the owner's testing: "pages" as the site's pages, and
  "no. 1, 3 and 4" as frames of the row of pictures above it (the strip of
  five stills that the film's chapters replace). So the ask says "sheets" and ties
  the numbers to them ("like no. 1, 3 and 4 from these two sheets").
- **Chess**: a description with no sheets, the ask of the chess run
  (`design/guidance-page.md`), tidied; it asks for the quiz in the page's
  language, where the run asked for German. It shows a brief that says how the
  teacher will run the quiz (time to look before the choices, whose turn), and
  ends "What do you need?". A line under it names the AI, plan and date,
  Claude Opus 5.5 on a paid plan, 5 Nov 2026, since step 1 names a free model
  and this one isn't. Its bubble is the longest, on a phone about 350 px.
- **Nothing decided**: "Read <address>. I need a classyQuiz. Help?". That the
  AI then asks what it still needs before it builds (the guidance's "Build
  with the teacher") is no longer said on the page; the chess ask's closing
  question shows the same turn. It is the owner's ask, translated.

All three open with "Read <address>." and call the quiz "a classyQuiz". A
Sonnet-class model told only "make me a quiz for <address>" read the address as
a publishing target and fetched the page only when told to read it; "Read" makes
the fetch the first act, and a failed fetch can't pass as a generic quiz (backlog
v4 item 11).

The sheets example is the same sheet and the same ask in four languages, each producing
a quiz in its language: for a reader of another language the one barrier is the
German ask, so the page cycles it. The asks are close to what the example runs
were asked, not word for word. The run's second turn, where the teacher reshapes
the quiz, is not shown: its payoff differs per language. The film types this
ask in the page's language, then the run's short third ask, translated
(`docs/film/film-text.md`).

### Languages

The block above About is in German, English, French and Italian. The owner's
purpose: to tell the visitor in passing that mixing languages in the
instructions works, together with the example ask and the German example
sheets. Why these four, in his reading: he can review three, may have access
to someone who can review the fourth, and they are the likelier to see
immediate use. About and the
rest of the site stay English: the AI reads English, and the lobby, wall, Remote
and tablets wait for the backlog's Localization. The static HTML is English. The
visitor's choice is made with a switch top right, kept on the device
(`cq.lang`); the header with the code box and the switch is shared with
`/example` (`client/top.ts`), so the choice holds on both; otherwise the browser's first language among the four; otherwise
English. The words are in `client/landing-text.ts`, one table per language, Run's
messages included. The quiz's own problems, the archive's messages and the text
copied for the AI stay English. Register: German "du", French "vous", Italian
"tu". The film follows the same line: the page's language up to the upload, the
site's English screens after it ("The film", Words); its words are in
`docs/film/build/film.js`, the page's own taken from `landing-text.ts` when it
is built.

### Run: the `.zip` and nothing else

Run is one element: a dashed box with one button and "or drop it here". The
button opens the file chooser; a `.zip` can also be dropped on the box, or pasted
from the file manager with Ctrl+V. The input has no `accept`: older mobile
browsers that can't map a `.zip` filter to a picker open the photo picker
instead, and desktop pickers that filter by type can grey out a zip whose
reported type differs (Windows reports `application/x-zip-compressed`). The
file's name is checked after choosing, and anything else gets the message below.

- Why only a `.zip`: the owner's, after seeing the text version. The box read as a
  place to talk to an AI, and the clipboard button and "the block your AI made"
  distracted. Every tool that makes `tar.gz` can make a `.zip`, and several loose
  files are too error-prone. The `.zip` is also the container the pictures travel
  in (`design/pictures.md`).
- Anything else that arrives (pasted or dropped text, another file type, several
  files) is told what the site takes, in the teacher's language, and what the AI
  can do instead. It is counted. Silently ignoring text from a teacher whose AI
  read old guidance would leave them with nothing.
- A quiz with problems lists them in place, in English, with "Copy the message for
  your AI", which asks for a corrected `.zip`. When the problem is pictures that
  can't go up, the teacher may continue without them. The format and its
  validation are `design/quiz-format.md`.
- A refused upload says which cap it hit, since the two come back differently:
  the uploads of the day at the day's turn (00:00 UTC, said in Swiss time by
  `quotaResetAt`), the bytes stored as quizzes end or expire. A spent daily
  request allowance has its own message. Each is followed by "More quizzes: a site
  of your own or your school's ›" to `/own-copy`, which names what the link
  gives (the owner: "Your own copy" was too ambiguous). The caps are `design/hosting-and-limits.md`.
- On success the tab becomes the projector, on the check screen
  (`design/teacher-devices.md`).

### Upload attempts counted by format

Purpose: whether anyone tries another format is then a fact to look up, not a
guess (backlog v1 item 2). Each attempt is counted under one word from the closed
list `UPLOAD_FORMATS` in `shared/upload.ts` (paste, txt, md, zip, several files,
the common other formats, "no extension", "other"). The word comes from the file
name only; the server takes only words from the list, anything else counts as
"other", so no file name or text can be stored. Kept per format: the count and
the first and last day seen (`UploadStats`, `server/stats.ts`), for good, since it
describes the site, not a quiz or a person. No content, no identity, no time of
day. `GET /api/stats` shows it, publicly: it says how much the site is used and
nothing about anyone. The page sends the word to `POST /api/attempt` without
waiting; a failed count never touches the upload. A quiz resent after the AI
fixed it counts again: these are attempts, not quizzes. The server's JSON upload
of plain text remains, for the simulator and probes; nothing on the page reaches
it.

### Coming back: the resume card

Purpose (backlog v4 item 2): the device that started a quiz resumes it during that
lesson, after a closed tab, a laptop that slept, an interrupted lesson, or an
upload made on the phone with the teacher now at the laptop. It needs the way
back, and certainty it is the right quiz.

So the card shows only the latest quiz this device started that is still on the
site: its title, where it stands ("before the first question", "question
4 of 10", "final ranking"), "Back to the quiz" (to the play page with the teacher code), the class
code, and the way back from another device, the teacher code typed in the code
box. It shows no closing time, no Delete, no older quizzes. A closing time read as
if the server held a shared, public list, which it must not; and the owner found
the first design's insistence on it pointed to "a rule that snuck in as a
requirement".

The card sits above the upload box: an open quiz on this device means a lesson in
progress or interrupted, and coming back is likelier than uploading again. A quiz
at its final ranking is on the site only until the teacher's Exit, so one still
there was left without it: a closed tab, and perhaps the photograph of the
podium not yet taken (owner).

The device remembers the quizzes it started (`savedQuizzes`, in `localStorage`)
and asks the site about the newest with its secret (`/api/i/:id/info`). If the
newest is gone from the site it is forgotten and the next is asked, at most
`ASK_AT_MOST` (3) in a visit, each a request against the daily allowance. How
long a quiz stays resumable follows the instance's lifetime
(`design/hosting-and-limits.md`).

### The own copy

Purpose (backlog v4 item 4): the teacher's question is "I'll run 20 to 30 a month,
whenever I need to; can I rely on this?" The shared site can't promise it, and
there is something they can do about it. Owner: knowing it can and probably should
be self-hosted is important, but "realistically first-time viewers won't read,
unless the site is close to running out of quizzes and tells them". So the page
doesn't raise it on a first visit.

- One line under Run, shown only on a device that has uploaded before and only if
  the site was full or busy on at least one of the last 30 days: it
  refused an upload or a class, or the classes' bookings reached
  `NEARLY_FULL` (half; the owner: lower than 80%) of the day's rows. It states the fact: "On 3 of the last
  30 days this shared site was full or busy. For more quizzes, a site
  of your own or your school's:", then the link. Counting the busy
  days brings the way to more quizzes to the teacher who relies on the site
  before their first refusal. The device keeps the days it uploaded (`cq.days`,
  dates only, at most 60, never sent; `client/history.ts`).
- The site records, once a day, each day on which the budget refused an upload
  (`SiteBudget`, kept 31 days); `GET /api/site` answers `{full: n}` (and the days' classes for the owner, `hosting-and-limits.md`). The page asks
  once per visit, and only from such a device.
- A refused upload says the same at the moment it happens, with the link.
- `/own-copy` (`src/public/own-copy.html`, static, no script) is the short guide:
  why (the shared site's few dozen quizzes a day; an own copy's are yours
  alone), then two routes to more quizzes. First setting one up yourself. In
  the owner's assessment a cloud VM is a route anyone can take, and free Sonnet
  in a chat one that takes some technical affinity. So what you need is a
  computer to deploy from: on a paid subscription an AI like Claude Code sets
  it up on its own virtual machine "in minutes"; without one, an AI talks the
  teacher through it on their own computer, "which can take a while"; and a
  free Cloudflare account. One prompt for both (deploy it; say if another
  environment of yours makes it easier). What you do yourself: the account; the
  access token, which the AI walks you through, kept out of the chat, the AI
  saying how to hand it over securely; a name for the site. The page names no
  more than a teacher must act on: the AI knows the details at the time, and a
  detail stated here can go stale.
  "A computer to deploy through wrangler" is deliberate (owner): a teacher
  without the affinity reads it as "the AI sets this up in minutes" being
  their realistic option, or asking someone who has it.
  Then the school's IT: people with an IT background and a developer AI can
  adjust it to the school's own servers, or run it on a paid Cloudflare
  account for "thousands of quizzes per day". The owner: scaling is the point
  of Cloudflare, a paid plan handles more than thousands, and IT has a budget;
  the number says the ceiling is the school's to set, not a measured limit. A school is a natural unit for an own copy, and an outside
  service is red tape at a school: it may need a data protection review first,
  so the school's own server comes first. The conversion is the school's, done
  with their AI, so this project maintains one server and checks no
  conversion; the README gives the AI what to change, what to keep and the
  tests a converted copy must pass. Afterwards: the address to name to the AI
  is the one the copy's start page shows, and updating is a choice. A copy
  changes only when its owner updates it; left as it is, it shows the same
  screens every lesson, which a teacher before a lesson values more than what
  is new. Updated, it gets the new and the fixed (for a self-set-up copy: ask
  the AI to update it from GitHub, the way it was set up).
- The capacity sentence ("space for a few dozen quizzes a day", on `/own-copy`)
  is per day because the limits reset daily and "full for today" is what a
  teacher meets; what it rests on is in `design/hosting-and-limits.md`,
  Situation.
- An own copy's pages carry its own address: the build replaces the demo's in
  `index.html` and `check.html` (`SITE_ADDRESS`, else the project name in
  `wrangler.toml`), for AIs that read the page without its script.

### Network help, where failure shows

Purpose: a school may block the site, and the help has to be where the failure
shows, not in a landing line read at home. The network check itself (`/check`,
`src/public/check.html`, `client/check.ts`) tests what the quiz uses on this
device: the API over HTTP, then a WebSocket echo. Its verdicts: all good; the quiz
runs over HTTP (live connections blocked, a little slower, with a message for IT);
the site's server can't be reached (with a message for IT). The IT message carries
the site's address, says it is a quiz site, that it needs HTTPS and WebSocket
connections, and what is blocked now. `/check` is not linked from the root page.

The help reaches the teacher at:

- the upload: no connection, or an answer that isn't the site's (a filter's page),
  names the school network as a possible cause, with "What to tell IT ›" to
  `/check#it`;
- `/check#it`: "If the site doesn't open at school at all", readable without
  running anything (if the site is blocked, nothing runs), with the text for IT;
- the wall's join screen, steering or not: after `NOBODY_MS` (90 s) with nobody
  in, "Nobody in yet? If the tablets can't open <address>, the school network may
  block it", with the IT link in a new tab so the wall stays; gone with the first
  avatar, counted anew for each class. It shows in front of the class on a
  mirrored laptop: harmless text, at the moment the class watches the teacher
  wait;
- a device that reaches the page but not the quiz: after `UNREACHED_MS` (15 s), at
  joining or in the offline banner, "This device can't reach the quiz. Tell your
  teacher." (a teacher device without the second sentence).

When only live connections are blocked, HTTP takes over by itself
(`design/connections.md`); that costs the shared site more requests, which is not
the teacher's concern.

## Not known

- What the film's poster tells a teacher who doesn't play it, and whether
  teachers play it. The check proposed: show the page's top to two or three
  teachers for five seconds, then ask what the class does and what they would
  type to their AI; then the same after one viewing of the film. Nobody has
  done either.
- Whether the film's end card should link somewhere, `/example` for one.
- The film on real phones (the cost of a frame, the full screen on an iPhone
  and on Android) and whether its timings read when watched:
  `docs/film/README.md`, "Not known".
- Whether an Android tablet's file picker shows a `.zip` downloaded from a chat app
  as selectable.
- Either own-copy route end to end on the current README; untried; the page's
  "in minutes" and "a while" are the owner's estimates. The owner's guidance rewrite says an AI can set up an own
  server "within about 15 minutes". For Claude Code on the web: whether its VM
  reaches api.cloudflare.com without a change to the environment's network
  access. A GitHub repository is its convenient way to get work out (owner);
  the page leaves accounts beyond Cloudflare's to the AI.
- Whether a spent request allowance can be recorded: the own-copy line counts only
  days the upload cap refused, so it understates a site that runs out of requests
  first.
- The German, French and Italian wording, by a native reader (Italian, by anyone).
  The page's and the film's in these three are drafts pending the owner's review.
- How a fetcher's text conversion reads the labelled ask.
- Whether one own copy per school, set up once by a colleague or IT, should be said
  on `/own-copy`: many teachers have neither an AI that runs programs nor a
  computer where they may install.
- A student tablet that has joined and never uploaded could get the code box large
  in the middle; to try only if the first classroom shows children hunting for the
  box.
