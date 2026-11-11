# The root page

## Purpose

The root page is the first thing a visitor meets: first the example class's
teacher (backlog, Project), who may not be technical, and also anyone else
who wants a quiz to play, alone, with friends, or for a group they run
(backlog v5 item 9). If they don't see within seconds what this is, how to
get a quiz and how to start one, nothing else on the site matters, however
good the guidance below it is (backlog v1 item 16).

What a visitor gets from the page as it opens, without pressing or unfolding
anything (owner):

- **What this is, and whether it is for them.** A quiz here is something
  played: run for a class or another group on a big screen, among friends, or
  alone. A visitor recognises their own case among these (plausible
  assumption, the owner's: people think in use cases, not capabilities;
  backlog v5).
- **That an AI's file becomes a played quiz.** A first-timer faces two
  obstacles, "how do I ask?" and "what even is a quiz?", and one concrete
  instance answers both: what the AI hands over is what gets played, and the
  words that produced it are the how-to-ask (backlog v4 item 1).

Two visitors get to what they came for with as little in their way as the
page can manage (owner):

- **Whoever comes back with a file**, to open it (`local-check.md`); with
  them the teacher who comes back mid-lesson, to their quiz.
- **A newcomer who wants to figure out what "a quiz" means here**, beyond
  what the page shows as it opens.

And **students get in**: the teacher tells the class the address, so the
class needs one place for the code on this page, found at once by whoever
knows where to look and what it looks like (the wall shows both until the
first student is in: `class-and-wall.md`, "Getting in"), without taking the
page from the visitors above.

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
- Someone who isn't a teacher: a learner who wants to practise, friends for
  a games night, whoever runs a quiz for a training session or a party.
  Needs to see that the site is for them too, and how to ask; the asker who
  will play needs the AI to keep the questions to itself (the asks, below;
  the words, "Words for whoever comes").
- The teacher's AI, with the site's name, or the AI of whoever else asks.
  Needs the guidance section.

The product's situation (the example class, the devices, which AI, the free
plan) is the backlog's Project and Constraints sections. What the page has to
live with in particular:

- Not every AI hands over files. Owner, on the text version of the upload box:
  ".txt/.md invite users to type their AI questions into the textbox — people
  tend to be like that." Pasting the quiz text was itself a distractor.
- The shared site runs on a free plan whose limits are the account's, shared by
  everyone who uses it (the caps are in `design/hosting-and-limits.md`). Plausible assumption: a refused
  upload in front of a class ends adoption (what "The own copy" rests on).
- A school network may block the site, or only its live connection, or only the
  students' network may be stricter than the teacher's. Plausible assumption: a teacher is rarely at school when they
  first read the page (so the network help sits where the failure shows).
- The owner's finding from UX work: where there is any doubt whether a
  reader can tell what "it", or a word like it, stands for, some readers
  can't.
- The owner, from a user test of anecdotal size: getting a quiz and opening
  it set side by side worked worse than one above the other.
- The owner: least surprise. The page stays predictable for its visitor,
  which a page that changes with what a device remembers works against.
- The owner, on the page's words: they speak from the visitor's side, what
  someone came to do, not what the site technically provides. A neutral
  name for a way to play is fine ("on your own"); a line that describes the
  mechanism ("the solution after each question") is not a reason to play.

## How the site meets it

This section says what
each part is for and what it depends on. The page is `src/public/index.html`
(static, English, what AIs read) and `src/client/home.ts` (which puts the
visitor's language and the live parts into it).

From top to bottom, the part for people is: the header with the code box; a
quiz to come back to, on the device that has one; the sentence that says what
this is and who plays; the two things to do, numbered, asking an AI for a
quiz and opening the file it made; then, below the first screen, the film and
what a person can count on, and the sentence where the part for people ends.
The guidance for AIs follows.

Each thing stands once, where the visitor needs it (backlog, "The page for
people: dense, not busy"). The first screen shows what you say and what you
get; the local check shows how it is played. The sentence names the three
ways, the examples show what an ask can start from, the AI's file shows the
quiz it holds, and the pictures of the ways stand on the check's cards, where
the way is chosen (`local-check.md`, "The check"). The whole of an example is
behind its "The whole example ›", the classroom's story is the film.

### One column

Purpose: the Purpose's first two things show as the page opens, on a phone
and on a desktop, and whoever holds a file reaches the box that opens it
without hunting (backlog v6 item 1).

The part for people is one column of the guidance's width, 42rem, in one
order at every width, and the header's bar is as wide. Nothing is rearranged
between a phone and a desktop, so getting a quiz stands above opening one
everywhere (Situation: side by side worked worse; and a first-timer who meets
"Choose the .zip file" before the ask doesn't yet know which file), and the
guidance starts on the edge the part for people ends on (two edges read as
two pages joined). On a wide window only the step numbers stand outside the
column, in its left margin ("Two steps").

What this costs: on a 1366 × 650 laptop the first screen is a narrow column
with 9 (German, French, Italian) to 32 px (English) to spare under the button. Weighed against it: opening first, for
the visitor who comes back with a file, which costs the first-timer what "the
.zip file" refers to; the box fixed to the foot of a phone's window until the
page reaches it, which would free the first screen but takes about 90 px of
every phone's window and moves the page under something (Situation: least
surprise); a wider page on a laptop with the picture beside the path, which
gives the manual below a second edge.

What shows as the page opens depends on the browser's window, not on the
device's screen: a phone's browser bars take part of it. Measured in Edge
windows of these sizes, in the four languages, with the asks carrying the
deployed site's address and the chat on the first tab's example, as every
visit opens:

| Window | The sentence, the tabs, the chat | The button that opens a file |
|---|---|---|
| 1024 × 690 and larger (laptops, desktops, a tablet) | whole | whole, 49 to 72 px above the edge |
| 1366 × 650 | whole | whole, 9 (German, French, Italian) to 32 px above the edge |
| 412 × 730, 390 × 664 (phones) | whole | whole, 64 to 125 px above the edge |
| 360 × 640 | whole | whole, 19 (French, Italian) to 32 px above the edge |
| 360 × 560 | whole | below the edge, by 48 to 61 px |
| 320 × 568 | whole, the tab row scrolling sideways in German, French and Italian | below the edge, by 67 to 104 px |
| 320 × 470 | the sentence, the tabs and the ask | below |

The phone's tighter spacing (the stylesheet's block for windows up to 600 px)
is kept from the page before; whether the first tab still needs it to hold
German at 360 × 640 wasn't measured. Another tab can be taller than the first, and the box
moves down by the difference. On Sheets the button is whole at every size
measured (19 px at least, German and French at 360 × 640). With the mock asks
of Notes and Test, and the "mock example" marker, which takes a row of its
own on a phone, at 360 × 640 the button reaches the edge in English, French
and Italian and is cut by 21 px in German and on French Notes; at 390 × 664
and on a 1366 × 650 laptop it is whole on every tab (19 and 9 px at least). A
visitor who has chosen a tab is reading the chat, not looking for the box;
the asks that replace the mocks are measured again. A quiz to come back to
stands above all of it and moves the rest down by its height, about 110 px on
a laptop and 180 to 205 on a 360 px phone; "Back to the quiz" is in the first
screen at every size above. No window tried scrolls the page sideways; at
320 px the tab row does ("Getting a quiz").

The order follows what a person does: the ask, then the file. A visitor who
comes with a file passes the sentence and the chat before the box, which is
why each of them is kept short.

The page follows the device's dark mode. The face of the AI's file stays
light on the dark ground, as a screenshot of the site would.

### One page, two readers

The part for people is above "About classyQuiz"; About and below is the
guidance. An AI told the site's name fetches the whole page.

Parts that must not read as text for an AI are made by the script, not written
in the HTML: the language switch (so a fetcher doesn't read four language
names), the numbers of the two steps (drawn by the stylesheet, so a heading
doesn't read "1Ask"), "Play this quiz ↓", which does nothing without the
script, the faces of the AI's files, pictures of each quiz's first question
whose accessible name is that question, so a fetcher reads no quiz words
between the asks, and the answer in the "Not sure?" tab, its label and the
AI's question back, so a fetcher doesn't take an AI's words for the page's.
Without the script the five asks stand one under the other, the first four
each with its file's name and size. That is what a fetcher reads: the tabs'
names, "Idea Sheets Notes Test Not sure?", then the asks in the same order.
The tabs' names are text a fetcher reads between the heading and the asks;
they say what an ask can start from, as the guidance does, which is why they
stay in the HTML. The
film's bar is in the HTML, since it works before the
film's script is there, with the film's length, which the film's build
checks (`docs/film/`); a fetcher reads it as "▶ 0:00 / 1:08 1×" under the film's
heading, joined to no other word.

The page has two first-level headings, the sentence for people and "About
classyQuiz", one for each reader. The guidance's headings keep their levels
(`guidance-page.md`, "Shape and anchors").

### What this is

Purpose (backlog v6 item 1a; v4 item 14 left it open as "what classyQuiz is,
as a statement"): someone who reads one sentence knows what the site does for
them.

The sentence is the page's first heading: "Play quizzes your own AI makes:
for a class or group, with friends, or on your own." From the visitor's side
it holds what happens here (you play), who makes the quiz (your own AI: the
one the visitor already uses, not one the site brings), and who plays: the
three ways, said as the check's cards open (`client/room-text.ts`,
`quizmasterLine`, `peersLine`, `soloLine`), so a visitor recognises their
own case among them in the sentence (Purpose), which on the page before the
tabs' second lines and the pictures of the ways did. "Group" stays so
whoever runs a quiz at a pub or a training session recognises the first way;
leaving it out would save about nine characters. It doesn't say what the
quiz is made from: the owner found that "from your sheets, notes" biased
readers to assume attachments are required; what an ask can start from is
the tabs' ("Getting a quiz"). It has no pronoun whose referent a reader must
find (Situation). It takes two lines on a desktop in each language and three
on a phone of 360 to 390 px in each. German, French and Italian say "your
AI" without "own"; Solo is said without a gendered word (French "en solo",
Italian "per conto tuo"); German says "in der Klasse oder Gruppe", since
"mit Klasse" also reads as "stylish", and the singular "das Quiz" for the
plural (`translation-review.md`). The wording is the implementer's.

### Getting a quiz

Purpose (backlog, "The page for people", item 1; v6 items 1b and 1c): a
visitor sees what an ask can start from, and the example shows them the ask,
where it is typed, the file it leads to, the quiz that file holds, and what
to do with the file. Someone who wants the whole of it is one press from it.

The first step is its heading, "Ask your AI for a quiz", with which AI beside
it; under the heading the examples as five tabs; under the tabs the chat
that shows the chosen tab's example. A visitor who reads only the two steps'
headings has the whole how-to. The heading stands above the tabs, not inside
the chat, so the tabs sit under "Ask": they pick an example of asking. A tab
picks the example and nothing else; how a file is played is picked on the
check, for any file (`local-check.md`).

- **The tabs name what the visitor starts from**: **Idea**, **Sheets**,
  **Notes**, **Test**, one word each, and **Not sure?**. Not the ways to
  play: the way is chosen on the check, for any file, and tabs named by way
  tied each way to one kind of material ("Peers is for notes") and could read
  as choosing how the quiz will be played. Words, because the epic's owner
  expects nobody to press a switch between examples that carries no words.
  One word each, because more than four tabs of two lines don't fit a 360
  px row, and five single words do. Each name says what its ask attaches
  (nothing, for Idea), so the name and the chat say the same thing. The
  examples pair a material with a way (the notes played with friends, the
  test alone); plausible assumption: that reads as an example and not as a
  rule, since the sentence names all three ways and the check offers all
  three for any file. The chosen tab is open into the chat, on its ground;
  the others stand on a ground a step off the paper (with an edge as well in
  dark mode, where the step alone doesn't hold them apart), so a phone, which
  shows nothing on hover, shows them as tabs to press. Every visit opens on
  the first (Situation: least surprise), and nothing is remembered. The tabs
  are a tab list, the arrow keys, Home and End moving between them.
  The row's fit is the most fragile number on the page. The room left in it
  with the five names at their natural widths, in Edge's fonts, at 360 px:
  English 45 px, German 3, French 14, Italian 24; at 390 px 49, 5, 16, 27.
  German "Nicht sicher?" became "Unsicher?" for it. At 320 px German, French
  and Italian don't fit (by 16 to 37 px): the row scrolls sideways under a
  fade at its right edge, the chosen tab scrolls into view, and the page
  doesn't scroll. A real phone's font a few pixels wider puts German at 360
  px into that state.
- **"Not sure?", the fifth tab**, is for whoever recognises none of the
  four, or doesn't know what to ask (backlog item 1e): "Read <address>. I
  need a classyQuiz. Help?", and the AI's question back, what the quiz is
  for, who will play it, and the material if there is any (the guidance's
  "Build with the user"). It is the ask that takes no knowing how to ask, in
  the same chat, so it adds no new element. A tab in words like the other
  four: its visible words are its accessible name, "None of these, or not
  sure yet" its tooltip. A "?" alone read as help; a line under every ask
  ("Not sure what to ask? …") would have told every visitor the AI asks back,
  at the cost of two lines of the first screen on every tab; a link beside
  "Any AI subscription will do" would switch the chat with no tab chosen. Its
  cost is the row's fit, above. It isn't an FAQ: the questions a visitor has
  before trying each have their place, which AI beside the heading, what it
  costs and what is kept under "What you can count on". Nor a store for
  further asks, which the epic removes.
- **Which AI**, beside the heading: "Any AI subscription will do, or free
  Claude." A visitor needs to know which AI to try, and the answer is their
  own situation, not a ranking; the line states a fact about subscriptions
  rather than telling the visitor to use theirs, which in translation ("Nimm
  die KI, die du abonniert hast") assumed they have one. A paid plan of a
  mainstream AI has a model at least as strong as Sonnet, web access,
  scripting and makes a zip (the owner); of the free ones, Claude is the one
  that built the quiz in the owner's testing (5 Nov 2026, against free
  ChatGPT, Gemini and Copilot: `guidance-page.md`, "The AIs verified
  against"). It holds for every tab, since free ChatGPT fails whatever the
  ask starts from.
- **The chat is the AI's**, where the ask is typed. The ask is the visitor's
  message, on the right as a chat has it, with what it attaches beside it on
  the bubble's left, where it takes no line from the text. The AI's answer is
  on the left, under "The AI's answer:".
- **The AI's answer is a file, and its face is the quiz it holds**: its first
  question as the site's Solo screen shows it, "1 / 20", the question, its
  picture, the four coloured choices with their shapes. That says the
  Purpose's second thing, that an AI's file becomes a played quiz, through
  one concrete instance and without a setting: a picture of the classroom on
  the file of the example every visit opens on pulled the page towards
  Quizmaster (the owner: "starting on the guided classroom example pulls
  towards quizmaster"). And it shows the result the ask leads to, which the
  owner wanted kept out of the box below. The face is a picture made from
  the example's own `.zip` in each language: the site's Solo screen, shot at
  800 × 500 (`docs/example/faces.py`), so it can't differ from the quiz that
  plays, and a fetcher reads no quiz words between the asks ("One page, two
  readers"). Its accessible name is "The quiz's first question:" and the
  question, in the page's language. It is 232 × 145 on a desktop, where the
  question is legible; on a phone 42% of the card up to 156 px, a thumbnail
  that reads as a quiz screen, not as text. What it costs: in dark mode it
  shows the light screen, as a screenshot would; a quiz whose first question
  has no picture (the stand-ins) shows text only, which is plainer than the
  space run's; and it shows the Solo screen as it was when faces.py last
  ran, which a change to that screen doesn't follow until faces.py runs
  again.
- **Download and play are separate.** The file's name and its size, with a
  download arrow, are a link that downloads the file, as a file in a chat
  does. The size is counted as a browser's downloads count it (1 KB = 1024
  bytes), so it is the size the visitor then sees. The rest of the card, its
  face and "Play this quiz ↓" play the quiz: the whole card takes a
  pointer's press, as a file in a chat does, the name excepted, and the
  button is the keyboard's. The press moves a copy of the file's name down
  onto the button that opens a file, the box lighting up as it does for a
  file dragged over it, and opens the file on the local check
  (`/open?example=<lang>&ex=<example>`), which costs the site nothing until a
  room opens (`local-check.md`). So playing an example is one press from the
  first screen and shows where a file of one's own goes (backlog item 1f).
  With reduced motion the box lights up and the check opens. Why the
  download: least surprise, a press on a file downloads it; and a visitor
  who downloads can rehearse the real path, download, choose, check. The
  owner's caution, that this depends on the audience's technical capability,
  is met by keeping the play press the larger target. A phone has no path of
  its own (the owner dislikes splitting them): there the download is a
  detour only for whoever chooses it. What it costs: the epic's prune had
  taken the file's download out of the first step (backlog item 2a); it is
  back, on the file itself, not as a link of its own. Two presses on one card
  mean different things.
  "The whole example ›" stands outside the card, beside its foot on a laptop
  and on the label's row on a phone: inside the card it would make the card
  taller than its face on a phone. It leads to the full example (`/example`,
  `example-page.md`): the whole conversation, what was attached if anything,
  the `.zip` to download and a start of that quiz.
- **The examples share a setting, school** (the owner: a setting of its own
  for each way risks saying "Quizmaster is for school, Peers for trivia").
  **Idea**: the owner's run without attachments (11 Nov 2026), a space quiz
  for a 4th grade class with pictures the AI found (NASA photographs, public
  domain) and four it drew; every visit opens on it, since it answers most
  directly the bias the owner named: a bubble with nothing attached, and a
  result with pictures. **Sheets**: the worked example's run, a teacher
  with exercise sheets. **Notes**: friends with their class notes before an
  exam, the one who asks playing too ("I'm playing too, so don't show me the
  questions"). **Test**: a learner with a marked test, practising for a time
  rather than a number of questions, mostly on what they got wrong ("Don't
  show me the questions, I'll play it myself"). The two who play say so: the
  asker's side of what the guidance tells the AI (`guidance-page.md`, "The
  user who plays"). The notes' and the test's asks exceed the owner's
  baselines (backlog items 1c, 1d) by saying where the quiz will be played
  and that the asker plays it, and the test's by asking for minutes, which
  the AI turns into questions (alone, a question may take less time than in
  a class). Their attachments, files, full examples and the "Not sure?" tab's
  answer are mocks, marked "mock example" beside the first step's heading
  while their tab is chosen, until the owner's runs (backlog item 1);
  nothing with a mock is deployed. Weighed for the first tab: Sheets, the
  guided example, which keeps the film and the first screen telling one
  story and shows an attachment first, the bias the owner named. What the
  idea costs: the film, `/example`'s first full example and the Sheets tab
  tell the sheets story, and the page opens on another.
  The idea's ask is the owner's, tidied (backlog item 1a: inspired by a run
  and tidied): "Read <address>." with a full stop and "a classyQuiz", which
  every ask here has (below); his run worked with neither ("Lies
  classyQuiz.pages.dev Ich brauche ein Weltraum/Planeten Quiz…"), so whether
  that rule should stay is the owner's call; and no pronoun whose referent a
  reader must find ("The order of the planets is known"). It is German; the
  other three languages show it translated and play its quiz translated
  (`docs/example/space_zips.py`), as the sheets run's are. The face of each
  is its own language's quiz.

Every ask opens with "Read <address>." and calls the quiz "a classyQuiz". A
Sonnet-class model told only "make me a quiz for <address>" read the address as
a publishing target and fetched the page only when told to read it; "Read" makes
the fetch the first act, and a failed fetch can't pass as a generic quiz (backlog
v4 item 11). The address in every ask is the one the browser opened, so an own
copy shows its own.

**The sheets ask** is the example's run (`example-page.md`), said in one
message (the implementer's call). The file came from a conversation:
"Read … Can you make me a classyQuiz with exercises from these two sheets?
For my 4th grade class.", then the two answers the AI asked for (about 10
questions, in English), then a second ask that added questions (`/example`
shows the three asks; the film types the second). The ask here is that
conversation's first ask with its two answers in it, and "like no. 1, 3 and
4 from these two sheets" for which exercises; the grade is the run's. So it
shows how to ask in one message, which is what a first-timer needs from it,
and nothing in it contradicts the run. Its cost: whoever reads `/example`
finds the file took three asks rather than one, a quiz of 13 questions where
the ask says about 10, and no choice of exercises in the run's own words.
Its words were read wrongly in the owner's testing: "pages" as the site's
pages, and "no. 1, 3 and 4" as numbers of pictures on the page; so the ask
says "sheets" and ties the numbers to them. A number stays on the line of
the word it belongs to ("no. 1", "Nr. 1", "4. Klasse", "n° 1", "n. 1",
joined by a no-break space): a line that ends "like no." or "Für meine 4."
reads as the end of a sentence. It is the same sheet and the same ask in four
languages, each asking for the quiz in the page's language; the example was
tested in each, and every page shows the English run translated
(`example-page.md`). The film types it in the page's language
(`docs/film/film-text.md`).

What the page no longer says, and where it went: the ways to play as the
tabs, with whose case each is under its name, and the picture of a way as
the face of its example's file; the ways are the sentence's, and their
pictures are on the check's cards (`local-check.md`). The ask's five parts
labelled under their words (this site, which exercises, your class, how
many, which language) were advice on how to ask; with an example for each
thing an ask can start from, the asks show what an ask holds, and the labels
had no place in a chat of the visitor's case. The chess ask, the training session and the games night
are gone with "How to ask": the training session is the Quizmaster's case,
the games night Peers', and the chess ask's lesson, that the AI asks what it
needs, is the "Not sure?" tab's. Which AI wrote the example and when is on
`/example`.

### Two steps

Purpose (backlog v6 items 1c and 1d; v4 item 1): as the page opens, the
visitor sees that an AI's file becomes a played quiz, through one concrete
instance: the words to the AI, the file that came back, and the place where
a file is opened. And whoever holds a file opens it there.

Two parts, one above the other, numbered because they are a sequence: "Ask
your AI for a quiz" with its tabs and chat ("Getting a quiz"), and **"Open
the quiz your AI made"**, the heading inside the dashed box that opens a file
("Opening: the `.zip` and nothing else"). The box stands outside the tabs,
since it is the same for every example; dashed, as a place to drop something is,
so it reads as the place a file goes, and the file that "Play this quiz ↓"
moves lands in it. A file's problems and the own copy's line stand under the
box.

On a window 54rem wide and wider the two numbers hang in the column's left
margin, joined by a line, so the eye takes "1, then 2" before reading either;
the "2" is placed from the box, not from its section, so a file's problems
under the box don't move it. Narrower, each number leads its heading. On a
laptop the box's heading and its button share a row, which a 1366 × 650
window needs ("One column"); on a phone the button is as wide as the box.
Between a phone and 54rem, with a pointer that drags (820 px was tried), the
heading stands above the button and "or drop it here".

The second heading and its button name what the person holds ("the quiz your
AI made", "the .zip file"), not "Run" and "Upload": a Solo player runs
nothing, and nothing goes to the site until a room opens on the local check
("Words for whoever comes").

"or drop it here" stands beside the button where there is a pointer that
drags, and is left out where the device reports none (a phone).

### The film

Purpose (backlog v6 item 1e): the newcomer who wants more than the page shows
as it opens finds what a room does over time: the whole path from the
exercise sheet to the class playing (backlog v4 item 1). The owner's purpose
for the film, when it was made for the top of the page: "make it easier for
users to understand what this page is and does, so they understand whether
it's what they need, and how to use it if it is." The first screen now
carries the first of that without a press; the film carries what takes
motion and a teacher who doesn't know classroom quizzes can't guess: the
tablet answering to the wall, the teacher's phone setting the pace, the votes
splitting before the solution. It tells the classroom's story, and its
heading says so: "From the exercise sheet to the class playing, in one
minute". The minute is a round figure for a film of 1:08, which the bar
under it shows exactly (the implementer's call): a heading says the film's size, and a reader who checks finds
eight seconds more.
What the film itself must get across, and how it is made: `docs/film/`.

The film's player is one people already know from video: a poster with ▶,
and under it a bar with play, a time bar to drag, the time and the length,
the speed and full screen. Anything the player does that a video player
doesn't takes attention away from the film. The starts of the film's five
chapters are ticks on the time bar, and dragging shows the chapter's name
over the thumb.

What it lives with, beyond the page's own situation:

- The page is what AIs read, so the film's words can't be in the HTML.
- A phone held upright gives the film about 358 × 201 px; a phone held
  sideways has little height.
- The story must work on a desktop and on horizontal tablets as well as on
  vertical phones.

How the page meets it (the details: the comments on the film in
`index.html`; the page side: `client/film-poster.ts`):

- **Before a press** the page holds the poster frame as a picture, ▶ and the
  bar. The poster is the teaching moment: the class at the wall with the
  votes split between the right answer and the typical error, no solution yet,
  tablets in hands, the teacher with the phone. It is rendered from the film
  per language (`landing/film-*.webp`), about 30 KB where the browser takes
  the 800 px picture, 65 KB where it takes the 1600 px one, as a phone's
  dense screen does. The picture is made by the script, in the page's
  language, so a visit fetches its own language's poster and no other; the
  English one in the static HTML is for a browser without scripts
  (`<noscript>`).
- **The bar works before the film is there.** The film's script, about
  170 KB, loads on the first press of ▶ or the picture, or on the first move
  of the time bar. It paints the same frame over the picture, then plays
  from the start or shows the moment the bar was moved to. The bar shows
  that time while the script loads. From the press until the film is
  drawn, ▶ is a turning ring, a frame painted before the build starts: the
  build holds the page, up to a second on an older phone
  (`docs/film/README.md`, "Text"), and a press with no answer reads as
  missed. The speed works without loading
  anything. Full screen needs the film, so it keeps its place hidden until
  then. If the script can't load or can't draw, the picture stays and the
  next press tries again.
- **Words.** The film speaks the page's language up to the upload: the ask
  typed to the AI (the sheets ask, word for word), the teacher's second
  message, the quiz, and this page's first screen as it opens, its words
  and its pictures (the first tab's ask and its file), on the phone and then
  on the laptop, so a viewer who
  has scrolled past it recognises it (`docs/film/`). From the upload on,
  the site's screens (the check, the wall's chrome, the Remote, the tablets)
  are drawn as the site shows them (`docs/film/README.md`, Situation),
  untranslated for now ("Languages"). Every language shows the same quiz, the
  example's 646 000 number-line question, translated (owner: the safest,
  since wrong answers in several different examples would linger). A
  language switch takes the film back to its poster in the new language.
- **Layout.** The film stands below the two steps, under its heading, as
  wide as the column (672 px on a desktop) and at most 62% of the screen's
  height, the bar under it and as wide; so on a phone held sideways the
  heading, the film and its bar are in one screen. A
  phone held upright differs where it has to: its film is about 358 px
  wide, and one row would leave the time bar too short to drag, so the time
  bar takes a row of its own. Watching the film big is
  what the full screen button is for: the browser's full screen where it
  has one, else the film fixed over the viewport (iPhone Safari).
- **The end card** shows the mark and the address. Once the film has played
  to the end, a replay icon stands on it; its accessible name is the
  page's.
- The stage's accessible name says what it is, "a film without sound". It,
  ▶, the replay, play and pause, the time bar, the speed and full screen
  are named in the page's language. The time bar's spoken value is the time
  and the chapter's name.
- Nothing links from under the film: the full example of each tab is beside
  its file in the chat ("Getting a quiz"), where the visitor who wants it
  already is.

### Languages

The part for people is in German, English, French and Italian. The owner's
purpose: to tell the visitor in passing that mixing languages in the
instructions works, together with the example ask and the German example
sheets. Why these four, in his reading: he can review three, may have access
to someone who can review the fourth, and they are the likelier to see
immediate use. About and below is the
guidance, in English, which the AI reads; the static HTML is English for the
same reader. The
visitor's choice is made with a switch top right, kept on the device
(`cq.lang`); the header with the code box and the switch is shared with
`/example` (`client/top.ts`), so the choice holds on both; otherwise the browser's first language among the four; otherwise
English (`client/device-lang.ts`). The words are in `client/landing-text.ts`, one table per language, the
messages of the box that opens a file included, also where opening a room moved them: the local check's
"Sending the quiz…" and its refusals speak the language this page spoke
(`local-check.md`, "Opening a room"); the ones the room pages say too (the
site full, the allowance spent, the way to an own copy, what to tell IT)
are in `client/site-text.ts`. The quiz's own problems and the text copied
for the AI stay English: the AI reads them.

The pages after this one have no switch and speak the language chosen here,
on that device: the local check and Solo, the lobby, the Projector, the
Remote, the players' devices and a Peers room (`client/room-text.ts`, with
the server's messages, which come in English), `/check`
(`client/check-text.ts`), `/own-copy` and the page for an address that
isn't one (`client/own-copy.ts`, `client/notfound.ts`). So the Projector
speaks the quizmaster's language and each player's device its own
browser's. The owner: each device its own language for the site's words;
a quiz's questions and answers show as they were written, on every device,
and translating them would be a feature to design. Their static HTML is
English; the page's script puts the device's language over it.

Purpose (backlog v6 item 2): a visitor reading German, French or Italian gets
the same page, said in that language's own sentences, not the English
sentence's structure, and the findings in Situation hold in each:

- **No pronoun whose referent a reader must find.** Where the English leans
  on "it", the translation names the noun ("die neue .zip-Datei", "le
  quiz", "il quiz"); a French or Italian pronoun stands where its gender
  leaves one candidate.
- **A noun the page has for two things is told apart where the two could be
  confused** (Situation: the same finding, for a word like "it"). "Code" is
  the header's box and the join code, so the code that is open is the
  "Quellcode", "code source", "codice sorgente". German "Seite" is this page
  and also the site, so a site of one's own is "eine eigene Website". French
  "plus de quiz" is also "no more quizzes", and the way to more stands under
  a refusal, so that line says "davantage".
- **"Room" isn't translated as a noun**: Raum, salle and stanza read first
  as a room one sits in, so the line on what is kept says when several play
  ("spielen mehrere", "à plusieurs", "in gruppo").
- **The first screen holds the same in each language** at 360 px and wider
  ("One column"), so where two wordings say the same the shorter is taken:
  the sentence without "own" ("What this is"), the line on which AI, the
  label before the file ("Antwort der KI:"), the link to the full example
  ("Das ganze Beispiel ›", "L'exemple complet ›", "Tutto l'esempio ›"), and
  the tabs' one word each ("Unsicher?" for "Nicht sicher?").

The words in the three are the implementer's drafts, with the choices behind
them in `docs/translation-review.md`.
The film follows the site: the page's language up to the upload, the
site's screens as they are after it ("The film", Words); its words are in
`docs/film/build/film.js`, the page's own taken from `landing-text.ts` when it
is built.

### Words for whoever comes

Purpose (backlog v5 item 9): a visitor who isn't a teacher, and an AI asked
for a quiz that isn't a lesson's, recognise themselves on the page and in the
guidance, while the example class's teacher is still served first (backlog,
Project): the words widen who else is, they don't displace the teacher.

What the words live with:

- "Teacher" stood for two people that v5 tells apart: whoever asks the AI
  for the quiz, and whoever runs it in the room. In Solo and Peers nobody
  runs it, and the one who asked plays.
- The owner: "host" is acceptable, not great, in English (in software,
  participants connect to a host too), and a role noun is avoided where a
  sentence does without one.
- The part for people is in four languages, and so are the screens after
  it ("Languages"); a translation hits the meaning, not the literal word. The guidance is English, for the AI
  (`guidance-page.md`).

So, once for all entries:

- **No role noun where the words are translated**, on the landing and the
  screens: the landing says "you" (du, vous, tu), the screens use a sentence
  ("Ask whoever runs it", `teacher-devices.md`, "Words for any crowd"). A
  sentence translates by its meaning; a noun would need a word in each
  language that suits a classroom and a pub alike, and the words for
  someone receiving guests (Gastgeber, hôte, ospite) don't say who runs a
  quiz.
- **"Quizmaster"** for whoever runs a room, where English needs a noun (the
  guidance, the README): it is the entry's own name, so the role and the
  card picked on the local check agree, and the word for whoever runs a pub
  quiz. "Host" stays the code's word (`peers.md`). On the landing the three
  ways are the sentence's, said as the check's cards open them ("for a class
  or group, with friends, or on your own"); Quizmaster, Peers and Solo stand
  as the entries' names on the check, in every language, not as role
  nouns.
- **"The user"** in the guidance for whoever is in the conversation with the
  AI, the AI's own word for that person, whoever they are; **"players"** for
  whoever answers.
- **"Teacher", "class", "students", "lesson"** stay where the classroom is
  meant: the film (the example class's story, `docs/film/`), the sheets
  ask, the classroom's lines in the guidance, and the design docs,
  which speak of the example class. The network check (`/check`) says
  "school or work" and "our network", and leaves allowing the site to
  "whoever looks after the network": it is reached from any room that
  can't open. The way to more quizzes names "your school's or your
  company's" site ("The own copy").

### Opening: the `.zip` and nothing else

The second step is one element: a dashed box with one button and "or drop it
here". The
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
- Two more things open, for whoever a `.zip` fails, and the page for people
  names neither. The owner: Gemini currently can't make zip files, and some
  phones open a `.zip` by themselves in an extractor that doesn't let it be
  saved. So the quiz's text alone opens as a `.txt` or `.md` file, read as
  the text in a `.zip` is, with no pictures beside it; and the same archive
  opens under the name `.quiz` (plausible assumption: a phone doesn't hand
  a file of that name to its extractor). The manual tells the AI that both
  work (`index.html`, "The manual").
- Anything else that arrives (pasted or dropped text, another file type, several
  files) is told what the site takes, in the teacher's language, and what the AI
  can do instead. It is counted. Silently ignoring text from a teacher whose AI
  read old guidance would leave them with nothing.
- A quiz with problems lists them in place, under the box, in English, with "Copy the message for
  your AI", which asks for a corrected `.zip`. When the problem is pictures that
  can't go up, the teacher may continue without them. The format and its
  validation are `design/quiz-format.md`.
- A refused upload, at "Open the lobby" or "Play together" on the local
  check and in this page's language there ("Languages"), says which cap it hit, since the two come back differently:
  the uploads of the day at the day's turn (00:00 UTC, said in Swiss time by
  `quotaResetAt`), the bytes stored as quizzes end or expire. A spent daily
  request allowance has its own message. Each is followed by "More quizzes: a site
  of your own, your school's or your company's ›" to `/own-copy`, which names what the link
  gives (the owner: "Your own copy" was too ambiguous). The caps are `design/hosting-and-limits.md`.
- A quiz that reads goes to the local check (`local-check.md`), where
  nothing has gone to the site yet; opening the lobby there uploads it, and
  the tab becomes the projector on the lobby's check
  (`design/teacher-devices.md`).

### Upload attempts counted by format

Purpose: whether anyone tries another format is then a fact to look up, not a
guess (backlog v1 item 2). Each attempt is counted under one word from the closed
list `UPLOAD_FORMATS` in `shared/upload.ts` (paste, txt, md, zip, quiz, several files,
the common other formats, "no extension", "other"). The word comes from the file
name only; the server takes only words from the list, anything else counts as
"other", so no file name or text can be stored. Kept per format: the count and
the first and last day seen (`UploadStats`, `server/stats.ts`), for good, since it
describes the site, not a quiz or a person. No content, no identity, no time of
day. `GET /api/stats` shows it, publicly: it says how much the site is used and
nothing about anyone. The page sends the word to `POST /api/attempt` without
waiting; a failed count never touches the upload. A quiz resent after the AI
fixed it counts again: these are attempts, not quizzes. The upload itself goes
as JSON when the quiz has no pictures, as multipart with them; the simulators
and probes use the JSON upload too and mark theirs (`telemetry.md`).

### Coming back: the resume card

Purpose (backlog v4 item 2): the device that started a quiz resumes it during that
lesson, after a closed tab, a laptop that slept, an interrupted lesson, or an
upload made on the phone with the teacher now at the laptop. It needs the way
back, and certainty it is the right quiz.

So the card shows only the latest quiz this device started that is still on the
site: its title, where it stands ("before the first question", "question
4 of 10", "final ranking"), "Back to the quiz" (to the play page with the teacher code), the join
code (the screens' word, for a class, a group or friends), and the way back from another device, the teacher code typed in the code
box. It is set tight: its title with "Back to the quiz" beside it, where it
stands and the join code under the title, the way from another device across
the foot; about 110 px high on a laptop, 180 to 205 on a 360 px phone, where
the button stands under the title. It shows no closing time, no Delete, no older quizzes. A closing time read as
if the server held a shared, public list, which it must not; and the owner found
the first design's insistence on it pointed to "a rule that snuck in as a
requirement".

The card stands above everything else on the page, under the header: an open
quiz on this device means a lesson in progress or interrupted, where coming
back is likelier than anything else the page offers, and a teacher in front
of a class shouldn't have to look for it. It is the one part that differs by
what the device remembers (Situation: least surprise); the rest of the page is the same below it. It appears once the
site has answered for the quiz, so on that device the page moves down under
it a moment after it opens. A quiz
at its final ranking is on the site only until the teacher's Exit, so one still
there was left without it: a closed tab, and perhaps the photograph of the
podium not yet taken (owner).

The device remembers the quizzes it started (`savedQuizzes`, in `localStorage`)
and asks the site about the newest with its secret (`/api/i/:id/info`). If the
newest is gone from the site it is forgotten and the next is asked, at most
`ASK_AT_MOST` (3) in a visit, each a request against the daily allowance. How
long a quiz stays resumable follows the instance's lifetime
(`design/hosting-and-limits.md`).

### Where the part for people ends

Purpose (backlog v6 item 1f): a person knows what they can count on, and that
what follows is the manual for AIs, so the guidance doesn't read as a second
page joined on.

Under "What you can count on", three lines: free, without accounts or
sign-up; played on one's own, a quiz never leaves the browser, and played in
a room it is deleted when the room is ended or three hours after its last
use, the `.zip` being the lasting copy; the code is open, with the link to
it. They say what the guidance says of the site (`index.html`, "The manual"),
in the visitor's language, and change with it (the lifetime:
`design/hosting-and-limits.md`). What the shared site can't promise, room
for every quiz on every day, isn't raised here: it is said where it applies
("The own copy").

Then, on a rule of its own, one sentence in the page's language: the rest of
the page is the manual for AIs, in English, what the visitor's AI reads when
given this address, and a person is welcome to read it too
(`guidance-page.md`, Purpose: for people it only has to show that there are no
secrets). The manual follows on the same ground and the same edge. A tinted
band for it would mark the second reader, and make the guidance read as a
second page joined on, which this part's Purpose is against.

### The own copy

Purpose (backlog v4 item 4): the teacher's question is "I'll run 20 to 30 a month,
whenever I need to; can I rely on this?" The shared site can't promise it, and
there is something they can do about it. Owner: knowing it can and probably should
be self-hosted is important, but "realistically first-time viewers won't read,
unless the site is close to running out of quizzes and tells them". So the page
doesn't raise it on a first visit.

- One line under the box that opens a file, shown
  only on a device that has uploaded before and only if
  the site was full or busy on at least one of the last 30 days: it
  refused an upload or a class, or the classes' bookings reached
  `NEARLY_FULL` (half; the owner: lower than 80%) of the day's share in any
  allowance (`hosting-and-limits.md`, "The teacher hears before it fails"). It states the fact: "On 3 of the last
  30 days this shared site was full or busy. For more quizzes, a site
  of your own, your school's or your company's:", then the link. Counting the busy
  days brings the way to more quizzes to the teacher who relies on the site
  before their first refusal. The device keeps the days it uploaded (`cq.days`,
  dates only, at most 60, never sent; `client/history.ts`).
- The site records, once a day, each day on which the budget refused an upload
  or a class (`SiteBudget`, kept 31 days); `GET /api/site` answers `{full: n}` (the days' classes are the owner's, `telemetry.md`). The page asks
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
  Then the IT of a school or company: people with an IT background and a
  developer AI can adjust it to their own servers, or run it on a paid
  Cloudflare account for "thousands of quizzes per day". The owner: scaling
  is the point of Cloudflare, a paid plan handles more than thousands, and IT
  has a budget; the number says the ceiling is the school's to set, not a
  measured limit. A school is a natural unit for an own copy, and an outside
  service is red tape at a school: it may need a data protection review first,
  so the school's own server comes first. A company that runs trainings meets
  the same IT and the same review, and a trainer who reads "your school's"
  is told the route isn't theirs; so this page, the line under the box and the
  link on a refusal name a company after the school (the words widen who
  else is, they don't displace the teacher: "Words for whoever comes"). The conversion is theirs, done
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

- opening the lobby on the local check: no connection, or an answer that isn't the site's (a filter's page),
  names the school network as a possible cause, with "What to tell IT ›" to
  `/check#it`;
- `/check#it`: "If the site doesn't open at school at all", readable without
  running anything (if the site is blocked, nothing runs), with the text for IT;
- the wall's join screen, steering or not: after `NOBODY_MS` (90 s) with nobody
  in, "Nobody in yet? If phones and tablets can't open <address>, their network
  may block it", with the IT link in a new tab so the wall stays; gone with the first
  avatar, counted anew for each class. It shows in front of the class on a
  mirrored laptop: harmless text, at the moment the class watches the teacher
  wait;
- a device that reaches the page but not the quiz: after `UNREACHED_MS` (15 s), at
  joining or in the offline banner, "This device can't reach the quiz. Tell whoever
  runs it." (a teacher device without the second sentence).

When only live connections are blocked, HTTP takes over by itself
(`design/connections.md`); that costs the shared site more requests, which is not
the teacher's concern.

## Not known

- Whether a visitor gets the Purpose's first two things from the first
  screen. The check proposed: show the page's top to two or three people, a
  teacher among them, for five seconds, then ask what one does here, whether
  it is for them, and what they would type to their AI. Nobody has; nobody
  outside the project has seen the page. Part of it: whether the sentence is
  read as "this is for me" without the pictures of the ways; whether a
  visitor reads a thumbnail of a question as "this file, played", and so
  takes in that what the AI hands over is what gets played.
- The first screen on real phones: the sizes in "One column" are Edge
  windows of a phone's size on a desktop, with Edge's fonts, not devices;
  whether the tab row fits there as measured (German at 360 px by 3 px), and
  whether its sideways scroll at 320 px is found; and whether a phone
  reports no pointer that drags, so that "or drop it here" is left out
  there (the emulated phone showed it).
- Whether a visitor with a file, on a small phone, takes the box under the
  ask as close enough, or whether opening should stand first there ("One
  column").
- Whether tabs named by material are taken as "what I have" and pressed;
  whether "Test" reads as a marked test and not as trying the site, and
  "Idea" as "I only have a topic"; whether "Not sure?" is found by whoever
  recognises none of the four.
- Whether a visitor presses the card or "Play this quiz ↓", and takes the
  file's way into the box as the way their own file will go; whether a phone
  user presses the file's name expecting to play, and is surprised by a
  download.
- The "a classyQuiz" and "Read <address>." rule against the owner's run,
  which worked without them ("Getting a quiz").
- The face as a picture made at build time, or drawn in the page from the
  quiz: the picture is built (`docs/example/faces.py`); drawn in the page, it
  would follow the site's Solo screen and the dark mode, at the cost of the
  quiz's words in the page for a fetcher.
- Whether the chat with no label for the visitor's side (only "The AI's
  answer:") reads as their own message to their AI.
- Whether teachers scroll to the film, and play it, now that it stands below
  the first screen and the first screen tells another example's story.
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
- The German, French and Italian wording, by a native reader (Italian, by anyone).
  The page's and the film's in these three are drafts.
- Whether one own copy per school, set up once by a colleague or IT, should be said
  on `/own-copy`: many teachers have neither an AI that runs programs nor a
  computer where they may install.
- A student tablet that has joined and never uploaded could get the code box large
  in the middle; to try only if the first classroom shows children hunting for the
  box.
