# The root page

## Purpose

The root page is the first thing a visitor meets. The first visitor it
serves is the teacher of the example class (backlog, Project), who may not
be technical. It also serves anyone else who wants a quiz to play: alone,
with friends, or for a group they run (backlog v5 item 9). If a visitor
doesn't see within seconds what this is, how to get a quiz and how to start
one, nothing else on the site matters (backlog v1 item 16).

What a visitor gets from the page as it opens, without pressing or unfolding
anything (the owner):

- **What this is, and whether it is for them.** A quiz here is something
  played: run for a class or another group on a big screen, among friends,
  or alone. A visitor recognises their own case among these. Plausible
  assumption, the owner's: people think in use cases, not capabilities.
- **That an AI's file becomes a played quiz.** A first-timer faces two
  obstacles, "how do I ask?" and "what even is a quiz?". One concrete
  example answers both: what the AI hands over is what gets played, and the
  words that produced it show how to ask (backlog v4 item 1).

Two visitors get to what they came for with as little in their way as the
page can manage (the owner):

- **Whoever comes back with a file**, to open it (`local-check.md`), and
  the teacher who comes back mid-lesson to a running quiz.
- **A newcomer who wants to find out more** than the page shows as it
  opens.

**Students get in.** The teacher tells the class the address, so the class
needs one place for the code on this page, found at once, without taking
the page from the visitors above (`class-and-wall.md`, "Getting in").

Two further jobs appear only where they apply: help for a school network
that blocks the site, and the offer of an own copy to a teacher who runs
into the shared site's limits.

The page is also the page an AI reads when it is told the site's name. That
side is `guidance-page.md`. The AI reads the part for people too.

## Situation

Who arrives, and what each needs:

- A first-time teacher, on a laptop, tablet or phone, with a colleague's tip
  and no quiz yet. Needs: what the class will do, that their own AI makes
  the quiz, what to say to it. Doesn't read much.
- A teacher with a `.zip`, in the break, often on the phone that took the
  photos. Needs to open it at once.
- A teacher coming back mid-lesson after a closed tab or a laptop that
  slept. Needs the way back, and certainty that it is the right quiz.
- A regular teacher (plausible assumption: 20 to 30 quizzes a month) who
  wants to know whether they can rely on the site.
- A student on a tablet, with the address the teacher called out. Needs the
  code box and nothing else.
- Someone who isn't a teacher: a learner who wants to practise, friends on
  a games night, whoever runs a quiz for a training session or a party.
  Needs to see that the site is for them too, and how to ask. A person who
  asks and then plays needs the AI to keep the questions to itself.
- An AI that was given the site's name. Needs the guidance.

The product's situation (the example class, the devices, which AI, the free
plan) is in the backlog's Project and Constraints sections. What this page
has to live with in particular:

- Not every AI hands over files. The owner, on an earlier text box for
  pasting a quiz: ".txt/.md invite users to type their AI questions into
  the textbox — people tend to be like that."
- The shared site runs on a free plan whose limits everyone shares
  (`hosting-and-limits.md`). Plausible assumption: a refused upload in
  front of a class ends adoption.
- A school network may block the site, or only its live connection, or only
  on the students' network. Plausible assumption: a teacher is rarely at
  school when they first read the page.
- The owner's finding from UX work: where there is any doubt what "it", or a
  word like it, stands for, some readers can't tell.
- The owner, from a user test of anecdotal size: getting a quiz and opening
  it set side by side worked worse than one above the other.
- The owner: least surprise. The page stays predictable. A page that
  changes with what a device remembers works against that.
- The owner, on the page's words: they speak from the visitor's side, what
  someone came to do, not what the site technically provides. A neutral
  name for a way to play is fine ("on your own"). A line that describes the
  mechanism ("the solution after each question") is not a reason to play.

## How the site meets it

From top to bottom, the part for people is: the header with the code box; a
quiz to come back to, on a device that has one; the sentence that says what
this is and who plays; two numbered steps, asking an AI for a quiz and
opening the file it made; and, below the first screen, the film and About
classyQuiz. The guidance for AIs follows.

Each thing stands once, where the visitor needs it (backlog, "The page for
people: dense, not busy"). The first screen shows what you say and what you
get. How a quiz is played is chosen on the local check (`local-check.md`,
"The check"), and the pictures of the three ways stand there. The whole of
an example is behind "The whole example ›". The classroom's story is the
film.

### One column

Purpose: the first two things in Purpose show as the page opens, on a phone
and on a desktop, and whoever holds a file reaches the box that opens it
without hunting (backlog v6 item 1).

The part for people is one column, as wide as the guidance below it, in the
same order at every width. Getting a quiz stands above opening one
everywhere, for two reasons: side by side worked worse (Situation), and a
first-timer who meets "Choose the .zip file" before the ask doesn't yet know
which file is meant. The guidance starts on the same edge, because two
edges read as two pages joined.

What this costs: on a 1366 × 650 laptop the first screen is a narrow
column, and the button that opens a file has little room under it. Three
alternatives were weighed and not taken:

- Opening first, for the visitor who comes back with a file. It costs the
  first-timer what "the .zip file" refers to.
- The box fixed to the foot of a phone's window until the page reaches it.
  It takes about 90 px of every phone's window and moves the page under
  something (least surprise).
- A wider page on a laptop, with a picture beside the path. It gives the
  guidance below a second edge.

What fits, measured in Edge windows of phone and laptop sizes, in the four
languages:

- On Sheets, the tab every visit opens on, the sentence, the tabs, the chat
  and the button that opens a file are all in the first screen from
  375 × 667 up: 44 px to spare there, 9 to 32 px on 1366 × 650. At
  360 × 640 the ask takes seven lines in English, German and French, and
  the button is cut by 2 px; in Italian it takes six and leaves 19 px.
- On Idea, all of it is in the first screen from 360 × 640 up, with less
  than 35 px to spare on 1366 × 650 and on 360 × 640.
- In smaller windows (360 × 560, 320 × 568) the button is below the edge.
- The other tabs at 360 × 640: Notes's ask takes seven lines in German and
  French, and cuts the button by 2 px there too; Test leaves it 32 px or
  more.
- A quiz to come back to stands above everything and moves the rest down by
  its height.

A visitor who has chosen another tab is reading the chat, not looking for
the box. A visitor who comes with a file passes the sentence and the chat
before the box, which is why both are kept short.

The page follows the device's dark mode. The face of the AI's file stays
light in dark mode, as a screenshot of the site would.

### One page, two readers

An AI that is told the site's name fetches the whole page. The part for
people runs through "About classyQuiz"; from the manual's heading (`#site`)
on it is the guidance.

Parts that must not read as text for an AI are added by the script and are
not in the HTML:

- the language switch, so a fetcher doesn't read four language names;
- the numbers of the two steps, so a heading doesn't read "1Ask";
- "Play this quiz ↓", which does nothing without the script;
- the faces of the files, which are pictures of each quiz's first question,
  so a fetcher reads no quiz words between the asks;
- the AI's answer in the "Not sure?" tab, so a fetcher doesn't take an AI's
  words for the page's.

Without the script the five asks stand one under the other, each example
with its file's name and size. The tabs' names stay in the HTML, because
they say what an ask can start from, as the guidance does.

The page has two first-level headings, one for each reader: the sentence
for people and the manual's heading, kept at a second-level heading's size
because it is long.

### What this is

Purpose (backlog v6 item 1a): someone who reads one sentence knows what the
site does for them.

The sentence is the page's first heading: "Play quizzes your own AI makes:
for a class or group, with friends, or on your own." The reasons for its
parts:

- It says what happens here (you play), who makes the quiz (your own AI,
  the one the visitor already uses), and who plays. The three ways are said
  in the same words as the cards on the local check, so a visitor
  recognises their case in both places.
- "Group" stays, so that someone who runs a pub quiz or a training session
  recognises the first way.
- It doesn't say what the quiz is made from. The owner found that "from
  your sheets, notes" made readers assume that attachments are required.
- It has no pronoun whose referent a reader must find (Situation).

The wording is the implementer's. The choices in the other three languages
are in `translation-review.md`.

### Getting a quiz

Purpose (backlog, "The page for people", item 1; v6 items 1b and 1c): a
visitor sees what an ask can start from. The example shows them the ask,
where it is typed, the file it leads to, the quiz that file holds, and what
to do with the file. Someone who wants the whole example is one press from
it.

The first step is the heading "Ask your AI for a quiz", with a line beside
it that says which AI. Under the heading stand the examples as five tabs,
and under the tabs the chat of the chosen example. A visitor who reads only
the two steps' headings has the whole how-to.

**The tabs are named by what the visitor starts from**: Idea, Sheets, Notes,
Test, and "Not sure?".

- They are not named by the ways to play. The way is chosen on the local
  check, for any file. Tabs named by way tied each way to one kind of
  material ("Peers is for notes") and could read as choosing how the quiz
  will be played.
- They carry words, because the owner expects nobody to press a switch
  between examples that carries none.
- One word each, because that is what fits a 360 px row. The row is the
  tightest fit on the page: in German it has about 3 px to spare at 360 px
  in Edge's fonts, and "Nicht sicher?" became "Unsicher?" for it. At 320 px
  the row scrolls sideways.
- Each example pairs a material with a way (the notes are played with
  friends, the test alone). Plausible assumption: that reads as an example
  and not as a rule, since the sentence names all three ways and the check
  offers all three for any file.
- Every visit opens on Sheets (why: the examples, below), and nothing is
  remembered (least surprise).

**"Not sure?"** is for whoever recognises none of the four, or doesn't know
what to ask (backlog item 1e). Its ask needs no knowledge of how to ask:
"Read <address>. I need a classyQuiz. Help?". The AI's answer is a question
back: what the quiz is for, who will play it, and whether there is
material. Alternatives that were not taken: a "?" alone read as help; a
line under every ask would cost every tab two lines of the first screen; a
link beside the line about which AI would switch the chat with no tab
chosen. It is not an FAQ. The AI's answer in this tab is still a mock,
marked as one while the tab is chosen, until the owner's run replaces it.
Nothing with a mock is deployed.

**Which AI**: "Any AI subscription will do, or free Claude." A visitor
needs to know which AI to try, and the answer depends on what they have.
The line states a fact about subscriptions and does not tell the visitor to
use theirs, which in translation assumed they have one. What the claim
rests on: `guidance-page.md`, "The AIs verified against".

**The chat** is where the ask is typed. The visitor's message is on the
right with its attachment beside it; the AI's answer is on the left.

**The AI's answer is a file, and its face is the quiz it holds**: the first
question as the site's Solo screen shows it. This says, through one
example, that an AI's file becomes a played quiz. An earlier picture of the
classroom on this file pulled the page towards the Quizmaster way (the
owner: "starting on the guided classroom example pulls towards
quizmaster"). The face is a picture shot from the site itself with the
example's own file, so it cannot differ from the quiz that plays. What it
costs: the face is light in dark mode, and it shows the Solo screen as it
was when the faces were last built (`docs/example/README.md`).

**Download and play are separate.** The file's name downloads the file, as
a file in a chat does. The rest of the card plays the quiz: the file's name
moves into the box of step 2, and the quiz opens on the local check, which
costs the site nothing until a room opens. So playing an example is one
press from the first screen, and it shows where a visitor's own file goes
(backlog item 1f). The download is kept because a press on a file's name
downloads it everywhere else, and because a visitor who downloads can
rehearse the real path. The owner's caution, that this depends on the
audience's technical ability, is met by making the play press the larger
target. What it costs: two presses on one card mean different things.

**"The whole example ›"** stands beside the card and leads to the example's
page (`example-page.md`).

**The four examples share a setting, school.** The owner: a setting of its
own for each way risks saying "Quizmaster is for school, Peers for trivia".
What each example is there to show:

- **Idea**: a quiz from one message with nothing attached, and a result
  with pictures. It answers most directly the bias the owner named, that
  attachments seem required.
- **Sheets**: a teacher with exercise sheets, who asks a second time to
  change the quiz. The ask shows how to say everything in one message: the
  exercises by number, the grade, how many questions, the language, harder
  towards the end. The file under it is the one from the second answer.
  What that costs: the file is not what that first ask alone produced.
  Every visit opens on Sheets, so that the first chat shows a visitor's own
  material as what the quiz is made from (the owner: people who come from
  sites like Kahoot have that use case). It also shows an attachment first,
  the bias that Idea, one press away, answers.
- **Notes**: friends before an exam who play together. The AI keeps the
  questions out of the chat, because the person asking plays too.
- **Test**: a learner with a marked test who asks for practice by minutes,
  mostly on the wrong answers, and says "Don't show me the questions, I'll
  play it myself". It goes beyond the owner's baseline (backlog item 1c) by
  saying that the asker plays and by asking for time. The marked test is
  invented, because a real one would show a real pupil's work. The owner
  wants it realistic but recognisable as generated, and representative of
  the tests visitors have: the teacher's marks are ticks and points, and
  the right answers are not written in.

Each example comes from a run by the owner and is tidied (backlog item 1a).
The facts of the runs are in `docs/example/README.md`.

**Every ask opens with "Read <address>." and says "a classyQuiz".** A
Sonnet-class model that was told only "make me a quiz for <address>" took
the address for a publishing target and fetched the page only when told to
read it. "Read" makes the fetch the first act, and a failed fetch can't
pass as a generic quiz (backlog v4 item 11). The owner's Idea run worked
without either, so whether the rule stays is his call. The address shown is
the one the browser opened, so an own copy shows its own.

**Words in the sheets ask** come from the owner's testing: "pages" was read
as the site's pages, and "no. 1, 3 and 4" as numbers of pictures. So the
ask says "sheets" and ties the numbers to them. A number stays on the line
of its word ("no. 1", "4. Klasse"), because a line that ends "like no."
reads as the end of a sentence.

The asks carry no labels for their parts. With an example for each thing an
ask can start from, the asks themselves show what an ask holds.

### Two steps

Purpose (backlog v6 items 1c and 1d; v4 item 1): as the page opens, the
visitor sees the words to the AI, the file that came back, and the place
where a file is opened. Whoever holds a file opens it there.

The two parts are numbered because they are a sequence: "Ask your AI for a
quiz" and "Open the quiz your AI made". The box of step 2 stands outside
the tabs, because it is the same for every example. It is dashed, like a
place to drop something, and the file of a played example lands in it.

The second heading and its button name what the person holds ("the quiz
your AI made", "the .zip file"), not "Run" and "Upload". A Solo player runs
nothing, and nothing goes to the site until a room opens.

### The film

Purpose (backlog v6 item 1e): the newcomer who wants more than the first
screen finds what a room does over time, from the exercise sheet to the
class playing. The owner's purpose for the film: "make it easier for users
to understand what this page is and does, so they understand whether it's
what they need, and how to use it if it is." The first screen now carries
the first part of that without a press. The film carries what needs motion
and what a teacher who doesn't know classroom quizzes can't guess: the
tablet answering to the wall, the teacher's phone setting the pace, the
votes splitting before the solution.

What the film must get across and how it is made: `docs/film/`. What this
page decides about it:

- **Its player looks like a video player**: a poster with ▶ and a bar with
  play, time, speed and full screen. Anything a video player doesn't do
  takes attention from the film.
- **The poster is the teaching moment**: the class at the wall with the
  votes split between the right answer and the typical error.
- **The film's script, about 170 KB, loads on the first press.** The bar
  works before that.
- **The film's words are not in the HTML**, because the page is what AIs
  read.
- **Every language shows the same quiz.** The owner: the safest, since
  wrong answers in several different examples would linger.
- **No example is linked from under the film.** Each example's page is linked
  beside its file, where the visitor who wants it already is.

### Languages

The part for people is in German, English, French and Italian. The owner's
purpose: to tell the visitor in passing that mixing languages in the
instructions works. Why these four: he can review three, may reach someone
who can review the fourth, and they are the likeliest to see use. The
guidance is in English, because the AI reads it, and the static HTML is
English for the same reader.

The visitor chooses with a switch in the header. Otherwise the page takes
the browser's first language among the four, otherwise English. The pages
after this one have no switch and speak the language chosen here, on that
device. So the Projector speaks the quizmaster's language and each player's
device its own. The owner: each device has its own language for the site's
words; a quiz's questions and answers show as they were written, and
translating them would be a feature to design. A quiz's problems and the
text copied for the AI stay English, because the AI reads them.

Purpose (backlog v6 item 2): a visitor who reads German, French or Italian
gets the same page in that language's own sentences, and the findings in
Situation hold in each:

- **No pronoun whose referent a reader must find.** Where English leans on
  "it", the translation names the noun.
- **A noun that the page uses for two things is told apart** where the two
  could be confused. German "Seite" is this page and also the site, so a
  site of one's own is "eine eigene Website".
- **The first screen holds the same in each language** from 360 px up, so
  where two wordings say the same, the shorter is taken.

The words in the three languages are the implementer's drafts. The choices
behind them are in `translation-review.md`.

### Words for whoever comes

Purpose (backlog v5 item 9): a visitor who isn't a teacher, and an AI asked
for a quiz that isn't for a lesson, recognise themselves on the page and in
the guidance. The teacher of the example class is still served first. The
words widen who else is addressed; they don't displace the teacher.

What the words live with:

- "Teacher" stood for two people: whoever asks the AI for the quiz, and
  whoever runs it in the room. In Solo and Peers nobody runs it, and the
  person who asked plays.
- The owner: "host" is acceptable but not great in English, and a role noun
  is avoided where a sentence does without one.
- The page and the screens are translated, and a translation hits the
  meaning, not the literal word.

The decisions, for all three ways:

- **No role noun where the words are translated.** The page says "you". The
  screens use a sentence ("Ask whoever runs it"). A noun would need a word
  in each language that suits a classroom and a pub alike, and the words
  for someone who receives guests (Gastgeber, hôte, ospite) don't say who
  runs a quiz.
- **"Quizmaster"** for whoever runs a room, where English needs a noun (the
  guidance, the README). It is the name of the way on the local check and
  the word for whoever runs a pub quiz. "Host" remains the code's word.
- **"The user"** in the guidance for whoever talks to the AI. **"Players"**
  for whoever answers.
- **"Teacher", "class", "students", "lesson"** stay where the classroom is
  meant: the film, the sheets ask, the classroom's lines in the guidance,
  and the design docs. The network check says "school or work", and the way
  to more quizzes names "your school's or your company's" site.

### Opening: the `.zip` and nothing else

The second step is one element: a dashed box with one button and "or drop
it here".

- **Why only a `.zip`** (the owner, after seeing a text box in its place):
  the box read as a place to talk to an AI. Every tool that makes `tar.gz`
  can make a `.zip`, and several loose files are too error-prone. The
  `.zip` is also what carries the pictures (`pictures.md`).
- **Two more things open, and the page for people names neither.** The
  owner: Gemini currently can't make zip files, and some phones open a
  `.zip` in an extractor that doesn't let it be saved. So the quiz's text
  alone opens as a `.txt` or `.md` file, without pictures, and the same
  archive opens under the name `.quiz`. Plausible assumption: a phone
  doesn't hand a file of that name to its extractor. The manual tells the
  AI that both work.
- **The file input has no type filter.** Some mobile browsers open the
  photo picker when given a `.zip` filter, and some desktop pickers grey
  out a zip whose reported type differs. The file's name is checked after
  choosing.
- **Anything else that arrives is answered**, in the visitor's language,
  with what the site takes and what the AI can do instead. Silently
  ignoring text from a teacher whose AI read old guidance would leave them
  with nothing.
- **A quiz with problems lists them under the box**, with "Copy the message
  for your AI", which asks for a corrected `.zip` (`quiz-format.md`).
- **A refused upload says which limit it hit**, because the two limits come
  back at different times, and offers the way to an own copy
  (`hosting-and-limits.md`).
- A quiz that reads goes to the local check, where nothing has gone to the
  site yet (`local-check.md`).

### Upload attempts counted by format

Purpose (backlog v1 item 2): whether anyone tries another format is a fact
to look up, not a guess.

Each attempt is counted under one word from a closed list (`UPLOAD_FORMATS`
in `shared/upload.ts`), derived from the file's name only. The server takes
only words from that list, so no file name or text can be stored. The
counts hold no content, no identity and no time of day, and they are public
(`GET /api/stats`): they say how much the site is used and nothing about
anyone. A failed count never touches the upload. A quiz that is sent again
after a fix counts again, because these are attempts, not quizzes.

A format is counted at most `DAY_ATTEMPTS_PER_FORMAT` times a UTC day,
since each count is a row of the plan's day that no booking holds
(`hosting-and-limits.md`, "Protecting the day's allowance"). Later
attempts that day write nothing, and the tally says on how many days it
got that far (`capped`), so a count that may be short says so. Per
format, because the question is about the other formats: a day's `.zip`s
don't keep a `.docx` from being counted. Plausible assumption: a quiz
handed to a class to play alone at home can take `.zip` to its most on an
ordinary day; the count then understates `.zip`, which the question
doesn't turn on.

### Coming back: the resume card

Purpose (backlog v4 item 2): the device that started a quiz gets back to it
during that lesson, after a closed tab, a laptop that slept, or an upload
made on the phone with the teacher now at the laptop. It needs the way
back, and certainty that it is the right quiz.

- **The card shows only the latest quiz this device started that is still
  on the site**: its title, where it stands, "Back to the quiz", the join
  code, and how to get back from another device.
- **It shows no closing time, no Delete and no older quizzes.** A closing
  time read as if the server held a shared, public list, which it must not.
  The owner found the first design's insistence on it pointed to "a rule
  that snuck in as a requirement".
- **It stands above everything else.** An open quiz on this device means a
  lesson in progress or interrupted, where coming back is likelier than
  anything else the page offers, and a teacher in front of a class
  shouldn't have to look for it.
- **It is the one part that depends on what the device remembers** (least
  surprise). It appears once the site has answered for the quiz, so the
  page moves down a moment after it opens.
- A quiz at its final ranking stays on the site until the teacher exits. If
  it is still there, the tab was closed, perhaps before the photograph of
  the podium was taken (the owner). So the card shows it too.

How long a quiz stays resumable: `hosting-and-limits.md`.

### Where the part for people ends

Purpose (backlog v6 item 1f): a person knows that what follows is the
manual for AIs, so the guidance doesn't read as a second page joined on.

The part for people ends with About classyQuiz, after the film: what the
site is, in the visitor's language, and who makes it (`identity.md`, "The
maker's name"). What the site is speaks to the visitor, so About belongs to
their part, not to the manual (the owner). Its English follows the part's
words ("Words for whoever comes"). The manual follows on the same ground
and the same edge, and its heading says what it is: "The manual to build
quizzes, for AIs and for people who like to get their hands dirty". A
person is welcome to read it; for people it only has to show that there
are no secrets (`guidance-page.md`). A tinted band would
mark the second reader and make the guidance read as a second page.

What a person may want to rely on before trying is said where it applies,
not in a section of its own (backlog, "The page for people", item 2a):

- what is sent to the site and when a room is deleted: on the cards of the
  local check, where the way is chosen;
- that the shared site can't promise room for every quiz: where it runs out
  ("The own copy");
- that no account is needed: nothing on the page asks for one (the owner:
  no sign-up is obvious).

Not said in the part for people: that playing costs nothing. That the code
is open is About's first sentence.

### The own copy

Purpose (backlog v4 item 4): the teacher's question is "I'll run 20 to 30 a
month, whenever I need to; can I rely on this?" The shared site can't
promise it, and there is something the teacher can do. The owner: knowing
that the site can and probably should be self-hosted is important, but
"realistically first-time viewers won't read, unless the site is close to
running out of quizzes and tells them". So the page doesn't raise it on a
first visit.

- **One line under the box**, shown only on a device that has uploaded
  before, and only if the site was full or busy on at least one of the last
  30 days. It states the fact ("On 3 of the last 30 days this shared site
  was full or busy") and links to `/own-copy`. Counting busy days as well
  as full ones brings the offer to a teacher who relies on the site before
  their first refusal. "Busy" starts at half of a day's share (the owner:
  lower than 80%; `hosting-and-limits.md`, "The teacher hears before it
  fails"). The device keeps the days it uploaded and never sends them.
- **A refused upload says the same** at the moment it happens.
- **`/own-copy` is a short guide** with two routes:
  - Setting one up yourself. In the owner's assessment, a cloud virtual
    machine is a route anyone can take, and free Sonnet in a chat takes
    some technical affinity. On a paid subscription an AI sets the copy up
    on its own virtual machine. The page says
    "A computer to deploy through wrangler" deliberately (the owner): a
    teacher without the affinity reads it as a sign that "the AI sets this
    up in minutes" is their realistic option, or asks someone.
  - The IT of a school or company. A school is a natural unit for an own
    copy, and an outside service may need a data protection review first.
    A trainer who reads only "your school's" would think the route isn't
    theirs, so a company is named after the school. "Thousands of quizzes
    per day" says that the ceiling is IT's to set (the owner: scaling is
    the point of Cloudflare, and IT has a budget). It is not a measured
    limit.
- **The guide names no more than a teacher must act on.** The AI knows the
  details at the time, and a detail stated on the page can go stale.
- **Updating a copy is a choice.** A copy that is left alone shows the same
  screens every lesson, which a teacher before a lesson values more than
  what is new.
- **The capacity is said per day** ("a few dozen quizzes a day"), because
  the limits reset daily and "full for today" is what a teacher meets.

### Network help, where failure shows

Purpose: a school may block the site, and the help has to be where the
failure shows, not in a line on this page that is read at home. `/check`
tests what a quiz uses on that device and gives a message for the school's
IT. It is not linked from the root page.

The help reaches the teacher in four places:

- on the local check, when opening a room fails for lack of a connection or
  gets an answer that isn't the site's;
- on `/check#it`, which can be read without running anything, because
  nothing runs if the site is blocked;
- on the wall's join screen, after a while with nobody in. That is the
  moment the class watches the teacher wait;
- on a device that reaches the page but not the quiz, or gets an answer
  that isn't the site's (`connections.md`, "Answers that aren't the
  site's").

When only live connections are blocked, the quiz carries on over plain
requests by itself (`connections.md`).

## Not known

- Whether a visitor gets the first two things in Purpose from the first
  screen. The check proposed: show the page's top to two or three people, a
  teacher among them, for five seconds, then ask what one does here,
  whether it is for them, and what they would type to their AI. Nobody has
  done it, and nobody outside the project has seen the page. Part of it:
  whether the sentence reads as "this is for me" without the pictures of
  the ways, and whether a thumbnail of a question reads as "this file,
  played".
- The first screen on real phones. The sizes in "One column" are Edge
  windows on a desktop, not devices. In particular: whether the tab row
  fits in German at 360 px, whether its sideways scroll at 320 px is found,
  and whether a phone leaves out "or drop it here".
- Whether a visitor with a file on a small phone takes the box under the
  ask as close enough, or whether opening should stand first there.
- Whether the tabs are read as "what I have" and pressed; whether "Test"
  reads as a marked test and not as trying the site; whether "Not sure?" is
  found by whoever recognises none of the four.
- Whether a visitor presses the card to play and understands where their
  own file will go; whether a phone user presses the file's name expecting
  to play and is surprised by a download.
- Whether the "Read <address>." and "a classyQuiz" rule should stay, given
  that the owner's run worked without it.
- Whether the face should be drawn in the page from the quiz. It would then
  follow the Solo screen and dark mode, at the cost of quiz words in the
  page for a fetcher.
- Whether the chat reads as the visitor's own message to their AI, with no
  label on their side.
- Whether a visitor who wants to know if the site costs anything, or if its
  code is open, finds out.
- Whether teachers scroll to the film and play it, now that it stands below
  the first screen and the first screen tells another example's story.
  Whether the film's end card should link somewhere. The film on real
  phones: `docs/film/README.md`, "Not known".
- Whether an Android tablet's file picker shows a `.zip` downloaded from a
  chat app as selectable.
- Either own-copy route, end to end. Neither is tried; "in minutes" and "a
  while" are the owner's estimates. For Claude Code on the web: whether its
  virtual machine reaches api.cloudflare.com without a change to the
  environment's network access.
- Whether `/own-copy` should say that one copy per school, set up once by a
  colleague or IT, is enough. Many teachers have neither an AI that runs
  programs nor a computer where they may install.
- The German, French and Italian wording, read by a native speaker. The
  Italian has been read by nobody.
- A student tablet that has joined and never uploaded could get the code
  box large in the middle. To try only if the first classroom shows
  children hunting for the box.
