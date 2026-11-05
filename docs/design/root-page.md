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
- A regular teacher, who will run perhaps 20 to 30 quizzes a month and wants to
  know whether they can rely on the site.
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
  presented. A teacher is rarely at school when they first read the page.

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

### The strip

The strip is five pictures that show the whole path in order: the exercise
sheet; the AI (a drawing of the act: a phone with two pages going up and a
`.zip` coming back); the `.zip` uploaded on the site (a laptop showing the
site's header, the dashed Run box and the `.zip` dropping in); the wall; a
tablet. It answers "what even is a quiz?" before the teacher reads anything. It
has five frames because the owner found that "the step where the zip goes to
classyQuiz isn't obvious", and that students tap after the big screen.

- The class frames are the largest; they are the payoff. The wall frame shows
  the teaching moment: the votes split between the right answer and a typical
  error. Two more tablets fan out behind the front one, drawn with only their
  colour buttons: every student has a device, all showing the same buttons. The
  tablet shows the plain colour buttons, since the example runs'
  second ask wanted pictures to tap, which a first-time teacher wouldn't ask for.
- The sheet frame is the rendered pages of a sheet derived from the owner's
  (his photographs can't be published), standing in until his photographs replace them.
- Until the video exists, the strip is one link to `/example`, the worked
  example (`design/example-page.md`), with no play mark. Teachers in the
  owner's testing read the strip as the example but didn't see that it opens:
  it is a card with a border and a label in the page's link style, "The
  example, step by step ›", named for what a teacher looks for (a walkthrough),
  not for what the page is to us ("how it was made"). The pictures are WebP in `src/public/landing/`;
  the wall and tablet exist in all four languages.
- Layout: a grid of two rows so the pictures stand on one line whatever their
  captions' lengths, sized by `--h` to fit the width. Below 720 px wide the
  frames are a single row that scrolls sideways inside the card, the label
  staying in view below, the sheet first and the next frame peeking in, and its height is capped by the viewport's height as well as its width, so
  a phone held sideways still shows Build and Run.
- The story must work on a desktop and on horizontal tablets as well as on
  vertical phones; on a phone the sheet may lose readability.

### Run first when stacked

Below 860 px wide Build and Run stand one above the other, and there Run comes
first. Build is about 650 px tall on a phone, so with Build first the upload box
sat a full screen down on every phone, past a natural place to stop reading: the
teacher with a `.zip` on the phone that took the photos, and the one coming back
mid-lesson, whose way back is in Run, had to scroll for it. Run is short (the
heading and the upload box), so Build's heading still shows below it on phones
from 360×640 up. A first-timer meets the upload before the how-to; the strip
above has told the story and the button says "the quiz your AI made". A running
quiz's card makes Run taller and can push Build off a small screen; that
teacher came for Run. The order is visual only: the HTML, side by side on wider
screens, and the order for keyboards and screen readers keep Build first.

### Build: two steps

Step 1 is "Choose any good AI." Its detail states only what is verified: which AI
wrote the example quiz, and when. No claim about what an AI can do goes on the
page without the tier and date of the test (the pattern in backlog v4, owned by design/guidance-page.md);
nothing says "the free version works" or gives a duration. A free account was
never tried end to end.

Step 2 is the ask. It and the line after the open ask say "the AI" where a
pronoun would do: in the owner's testing Build had too many "it"s to follow.
The address shown in the bubbles and in Copy is the one the
browser opened, so an own copy shows its own. Two examples:

- With photos of two sheets: a chat bubble with five parts underlined and
  labelled under their words: this site, which exercises, your class, how many,
  which language. The labels are advice on how to ask, given without ordering
  anything. The labels stay under their words on a phone too: in the owner's
  testing the labels set out as one line after the bubble read as broken. From
  320 px up no label overlaps another or leaves the bubble, in the four
  languages. Its words
  were read wrongly in the owner's testing: "pages" as the site's pages, and
  "no. 1, 3 and 4" as frames of the strip. So the ask says "sheets" and ties
  the numbers to them ("like no. 1, 3 and 4 from these two sheets").
- With nothing decided yet: "Read <address>. I need a classyQuiz. Help?", then
  the sentence that the AI asks for what it still needs, with two examples, before
  it builds the quiz (the guidance's "Build with the teacher": what is open,
  put so the teacher can answer in a line, and the quiz after the answer). The
  examples and "before" tell a first-timer what the next turn looks like and
  that no quiz built on guesses comes first. It is the owner's ask, translated.

Both examples open with "Read <address>." and call the quiz "a classyQuiz". A
Sonnet-class model told only "make me a quiz for <address>" read the address as
a publishing target and fetched the page only when told to read it; "Read" makes
the fetch the first act, and a failed fetch can't pass as a generic quiz (backlog
v4 item 11).

The example is the same sheet and the same ask in four languages, each producing
a quiz in its language: for a reader of another language the one barrier is the
German ask, so the page cycles it. The asks are close to what the example runs
were asked, not word for word. The run's second turn, where the teacher reshapes
the quiz, is not shown: its payoff differs per language, and the second example
carries the fact that the AI asks back.

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
(`cq.lang`); otherwise the browser's first language among the four; otherwise
English. The words are in `client/landing-text.ts`, one table per language, Run's
messages included. The quiz's own problems, the archive's messages and the text
copied for the AI stay English. Register: German "du", French "vous", Italian
"tu".

### Run: the `.zip` and nothing else

Run is one element: a dashed box with one button and "or drop it here". The
button opens the file chooser (`accept` names `application/zip` and
`application/x-zip-compressed`, which Windows reports, so a picker that filters by
type doesn't grey it out); a `.zip` can also be dropped on the box, or pasted
from the file manager with Ctrl+V.

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
  request allowance has its own message. Each is followed by "Your own copy: how
  ›" to `/own-copy`. The caps are `design/hosting-and-limits.md`.
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
  the site refused an upload on at least one of the last 30 days. It states the
  fact: "On 3 of the last 30 days this shared site was full and turned new
  quizzes away", then the link. The device keeps the days it uploaded (`cq.days`,
  dates only, at most 60, never sent; `client/history.ts`).
- The site records, once a day, each day on which the budget refused an upload
  (`SiteBudget`, kept 31 days); `GET /api/site` answers `{full: n}`. The page asks
  once per visit, and only from such a device.
- A refused upload says the same at the moment it happens, with the link.
- `/own-copy` (`src/public/own-copy.html`, static, no script) is the short guide:
  why (the shared site's allowance; an own copy's is yours alone); who does what
  (GitHub is where the code is, no account needed; Cloudflare's free plan runs it,
  on your own account; the AI does the setup); what you need (an AI that runs
  programs on your computer, such as Claude Code, since a browser chat can explain
  but not carry out; a computer where you may install programs, which a
  school-managed laptop often isn't; an email address); a sample prompt; what you
  do yourself (the account, a token the AI says where to create and where to put,
  a name for the site); and afterwards (name your address to the AI; ask it to
  update from GitHub). The token goes where the AI says, not into the chat. The
  page makes no time promise.
- The capacity sentence ("room for a few dozen classes a day", on `/own-copy`)
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

- Whether teachers read the strip in five seconds. The check proposed: show the
  strip to two or three teachers for five seconds, then ask what the class does
  and what they would type to their AI. If they can't say, the strip fails; the
  fallback is one poster frame of the class at the wall. The owner's testing so
  far: read as the example; not seen to open, before the card and its label.
- Whether free Claude and other free tiers hand over a `.zip`; Step 1 says nothing
  about tiers until that is tested.
- Whether an Android tablet's file picker shows a `.zip` downloaded from a chat app
  as selectable.
- How long a teacher's first own copy takes with Claude Code; untried. The owner's
  guidance rewrite says an AI can set up an own server "within about 15 minutes".
- Whether a spent request allowance can be recorded: the own-copy line counts only
  days the upload cap refused, so it understates a site that runs out of requests
  first.
- The German, French and Italian wording, by a native reader (Italian, by anyone).
- How a fetcher's text conversion reads the labelled ask.
- The video: about 60 s, wordless so one storyboard serves four languages with the
  screens swapped, fed the real screens, never autoplaying, played from the strip
  only. The brief is the owner's, from his storyboard project. What it shows is
  what the stills cannot: the room, children typing the code, avatars popping up,
  the murmur when the votes split, the teacher pointing at one tick, the groan and
  cheer at the answer, the ranking as closure. Whether the tool's output fits the
  site's content-security policy (its own scripts only) is the one technical check;
  whether the video's last frame links `/example` is open.
- Whether one own copy per school, set up once by a colleague or IT, should be said
  on `/own-copy`: many teachers have neither an AI that runs programs nor a
  computer where they may install.
- A student tablet that has joined and never uploaded could get the code box large
  in the middle; to try only if the first classroom shows children hunting for the
  box.
