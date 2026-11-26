# The root page

## Purpose

The root page is the first thing a visitor meets: first the teacher of the
example class (backlog, Project), who may not be technical, and also anyone
else who wants a quiz to play, alone, with friends, or for a group they run.
If a visitor doesn't see within seconds what this is,
how to get a quiz and how to start one, nothing else on the site matters.

What a visitor gets from the page as it opens, without pressing or unfolding
anything:

- **What this is, and whether it is for them.** A quiz here is something
  played: run for a class or another group on a big screen, among friends,
  or alone. A visitor recognises their own case among these. Plausible
  assumption: people think in use cases, not capabilities.
- **That an AI's file becomes a played quiz.** A first-timer faces two
  obstacles, "how do I ask?" and "what even is a quiz?". One concrete
  example answers both: what the AI hands over is what gets played, and the
  words that produced it show how to ask.

Two visitors get to what they came for with as little in their way as the
page can manage: whoever comes back with a file, or to a quiz
left running mid-lesson; and the newcomer who wants to
find out more than the page shows as it opens. For the latter there are the
film and `/example` (`docs/film/README.md`, `example-page.md`).

Students get in: the teacher calls out the address, so the class needs the
code box on this page, found at once, without taking the page from the
visitors above (`class-and-wall.md`).

Where they apply: help for a school network that blocks the site, reaching
the teacher where the failure shows; and the offer of an own copy to a
teacher who relies on the site and runs into its limits.

The part for people speaks four languages to tell the visitor in passing
that mixing languages in the instructions works.

The page is also what an AI reads when it is told the site's name
(`guidance-page.md`).

## Situation

### Who arrives

- A first-time teacher, on a laptop, tablet or phone, with a colleague's tip
  and no quiz yet. Doesn't read much.
- A teacher with a `.zip`, in the break, often on the phone that took the
  photos.
- A teacher coming back mid-lesson after a closed tab or a laptop that
  slept, who needs certainty that it is the right quiz.
- A regular teacher (plausible assumption: 20 to 30 quizzes a month) who
  wants to know whether they can rely on the site.
- A student on a tablet, with the address the teacher called out.
- Someone who isn't a teacher: a learner who wants to practise, friends on
  a games night, whoever runs a quiz for a training session or a party. A
  person who asks and then plays may not want to see the questions first
  (`guidance-page.md`, "The user").
- An AI that was given the site's name.

### What was found

- A visitor reads the page's words from their own side: what they came to
  do, not what the site technically provides. A neutral name for a
  way to play is fine ("on your own"); a line that describes the mechanism
  ("the solution after each question") is not a reason to play.
- Where there is any doubt what "it", or a word like it, stands for, some
  readers can't tell (from UX work).
- Least surprise: a predictable page. One that changes with what a device
  remembers works against that.
- From a user test of anecdotal size: getting a quiz and opening it set side
  by side worked worse than one above the other.
- "From your sheets, notes" biases readers to assume that attachments are
  required.
- A setting of its own for each example risks saying "Quizmaster is for
  school, Peers for trivia"; the examples share one, school. People who come
  from sites like Kahoot have the exercise-sheets use case.
- In testing the sheets ask, "pages" was misread, and "1, 3 and 4" was read
  as referring to the page's example bar.
- Sonnet Medium, in a test, read the address in an ask as a publishing
  target and fetched the page only once told to read it.
- A text box for pasting a quiz invites people to type their questions for
  the AI into it. Several loose files are too error-prone. Not every AI
  hands over files: Gemini currently can't make zip files, and some phones open a `.zip` in an extractor that
  doesn't let it be saved; so the quiz's text alone opens too, and the same
  archive under the name `.quiz` (plausible assumption: a phone doesn't
  hand a file of that name to its extractor).
- Plausible assumption: a teacher may close the tab
  before photographing the podium, so a quiz at its final ranking is still
  one to come back to.

### The page's two readers

An AI told the site's name fetches the whole page and reads its static HTML,
which is English; what the script adds, it doesn't see. So what would read
wrongly as page text for an AI (language names, step numbers, the quizzes'
words on the files' faces, an AI's words in a chat, the film's words) is
added by the script. The part for people ends with About classyQuiz, which
speaks to the visitor; the manual for AIs follows on the same
ground, and a person is welcome to read it.

### Search and shared links

Plausible assumption: a colleague's tip arrives as a name to search for or
as a link in a chat. A search result and a chat's preview show the page's
title, its description and the social card (`docs/brand/README.md`,
Rasters); a Peers invite shares `/play#` with its code, which carries the
preview too. Some platforms link to a page's `og:url` in place of the
address shared, which would drop the code, so the pages name none.
Search engines see the page in English: the four languages share one
address, and a crawler's browser plausibly asks for English. The
description may also reach AIs' training data, where it tells an AI about
to make a classyQuiz that this page holds the manual it needs.

### Files and browsers

- Some mobile browsers open the photo picker when a file input is filtered
  to `.zip`, and some desktop pickers grey out a zip whose reported type
  differs.
- The shared site runs on a free plan whose limits everyone shares
  (`hosting-and-limits.md`). Plausible assumption: a refused upload in
  front of a class ends adoption.
- A school network may block the site, or only its live connection, or only
  on the students' network (`connections.md`, `/check`). Plausible
  assumption: a teacher is rarely at school when they first read the page,
  so help on this page would be read at the wrong time.

### Languages

The part for people is in German, English, French and Italian (Purpose). Three
of the four have a reader on the project (backlog, "With the owner");
plausibly they are the likeliest to see use. Each
device has its own language for the site's words; a quiz's questions and
answers show as they were written, and translating them would be a feature
to design. What the AI reads stays English. The film shows the
same quiz in every language, since wrong answers in several different
examples would linger.

- German "Seite" is this page and also the site; a site of one's own is
  "eine eigene Website".
- The plural of "Quiz": the Duden says "Quizze" is wrong, and
  every normal German speaker says "die Quiz" as a plural is wrong.
- At 360 px the first screen's words have little room to spare in any of
  the four languages.

### Words for whoever comes

"Teacher" stood for two people: whoever asks the AI for the quiz, and
whoever runs it in the room; in Solo and Peers nobody runs it, and the
person who asked plays. "Host" is ok, not great, in English (participants
also connect to a host, in software language), and a translation has to hit
the meaning, not the literal word. The words for someone who receives guests (Gastgeber, hôte, ospite) don't say who runs a
quiz. On the pages, whoever runs a room is the Quizmaster; the code says
host.

### The own copy

Knowing that the site can and probably should be self-hosted is important,
but realistically first-time viewers won't read about it unless the site is
close to running out of quizzes and tells them. On `/own-copy`,
the paid route has an AI set the copy up on its own virtual machine, and
the free one has an AI talk the visitor through their own computer, which
takes some technical affinity; "a computer to deploy through wrangler"
tells a teacher without it that the AI's route is theirs, or to ask someone
who has it. "Thousands of quizzes per day" for a school's or company's IT is
not a measured limit: scaling is the point of Cloudflare, and IT has a
budget.

### Upload attempts by format

Whether anyone tries another format than the `.zip` is a fact to look up,
not a guess; the counts are public (`GET /api/stats`).
Every file or paste the root page is given is counted, an example not. Until
a room opens, the count is all the shared site gets of a quiz: a Function
and a Durable Object request, and a row of the plan's day, so a format is
counted at most `DAY_ATTEMPTS_PER_FORMAT` times a UTC day. Plausible
assumption: a quiz handed to a class to play alone at home can take `.zip`
to that most on an ordinary day; the count then understates `.zip`, which
the question doesn't turn on.

## Not known

- Whether a visitor gets the first two things in Purpose from the first
  screen. Nobody outside the project has seen the page. A check proposed:
  show the page's top to two or three people, a teacher among them, for
  five seconds, then ask what one does here, whether it is for them, and
  what they would type to their AI.
- The first screen on real phones; it was measured only in Edge windows of
  phone sizes. Whether the tab row, the first screen's most fragile fit,
  fits in German at 360 px, whether its
  sideways scroll at 320 px is found, and whether a visitor with a file on
  a small phone takes the box under the ask as close enough.
- Whether the tabs are read as "what I have" and pressed; whether "Test"
  reads as a marked test and not as trying the site; whether "Not sure?" is
  found by whoever recognises none of the four.
- Whether a visitor presses the file's card to play and understands where
  their own file will go; whether a phone user presses the file's name
  expecting to play and is surprised by a download.
- Whether the chat reads as the visitor's own message to their AI.
- Whether a visitor who wants to know if the site costs anything, or if its
  code is open, finds out.
- Whether teachers scroll to the film and play it.
- Whether an Android tablet's file picker shows a `.zip` downloaded from a
  chat app as selectable.
- Either own-copy route, end to end; "in minutes" and "a while" are the
  estimates. Whether `/own-copy` should say that one copy per
  school, set up once by a colleague or IT, is enough.
