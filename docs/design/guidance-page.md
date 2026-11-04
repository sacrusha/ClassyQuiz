# The guidance page

## Purpose

The guidance is the part of the root page (`src/public/index.html`, from the
heading "About classyQuiz" on) that an AI reads. A teacher with material in
hand and a lesson coming up names the site to their own AI, and that must be
enough: the AI comes away understanding what the site is for, what its quizzes
are for, how a quiz is built, and how to build one with a human
(backlog v1 item 11). The page is the one address the teacher gives, so it
leads straight to everything the AI needs.

It has a second reader. In the owner's words, it is the "manual for the AI, and
humans who like to get their hands dirty": for people it only has to show that
there are no secrets, that it is not magic, and that they are allowed to look.
It need not read easily for them.

The page is the home of what the AI reads. This file says what the page is for
and the situation it is written into, and does not repeat it. The format's
specification is on the page; `design/quiz-format.md` says why the format is
shaped as it is. The screens the page describes are in `docs/user-flow.md`.

## Situation

- The reader is a model that has just been given an address, often by a
  teacher on a free AI account. It fetches the page, or fails to. Some hosting
  plans block AI fetchers by default, and fetch tools may not follow links.
  Whether a given AI understands the site from its address alone is a fact to
  test, not to assume.
- The product's situation (teacher time as the measure, the example class, the
  AI that may be a free one, "Designed for Claude; other mainstream AIs
  verified") is the backlog's Project and Constraints sections. The guidance
  puts the part of it the reading model can't know into its own words.
- A capable model already knows teaching, question design and how to talk to a
  teacher. What it can't know is the site: what it does, how the screens and a
  lesson run, how long data lives, the format with examples, the limits, how a
  quiz reaches the site and what the upload shows.
- Fetched text that gives orders to the reader can trip an AI's
  prompt-injection guards, while reference material gets read. A well-marked
  example of using an AI with the site trips no guard.
- The teacher's own words to their AI are not the page's voice; whether the
  AI fetches the page at all depends on them (the example asks, `root-page.md`,
  "Build: two steps").
- Teachers differ from message to message: a full brief needs no questions,
  contradictory scans may need two, and a rule of the form "ask at most one
  question" fails both. Language is the same: the language of the exercises and
  of the request vary without end, AIs resolve it with location and memory, and
  no list of cases is exhaustive.

## How the site meets it

### Information in place of rules

The page describes the site and the situation of building a quiz with a
teacher, so that the AI's behaviour follows from understanding, the way an
implementer's follows from the backlog. The quiz format is presented as a
specification ("a quiz looks like this"), not as commands.

Rules can't adapt and they block better solutions. The purposes behind this
are two: not tripping injection guards, and not ordering the reader about for
things nobody must do. Where an instruction is the point, a plain, well-marked
one is right, as in the "Any language" paragraph (ask when the language of the
exercises and of the request don't resolve cleanly).

### Cut to what the reading model can't know

The page says only what the reading model can't already know. The section was
cut from 4311 words to about 2266 on that standard. What stays is the site's
facts. What went is advice a capable model derives from them or already has:
how to design wrong answers, short questions, when a fixed order fits, how
long a countdown a kind of task needs, cropping and legibility of pictures,
notes to the teacher outside the quiz text. The facts those rested on stay: the
class reads from the back of the room, answers are shown spread before key,
answer pictures lie on tiles in four colours, and text outside the quiz is
ignored or an error.

### Describes the site as it runs

The guidance describes the site as deployed, so what it says is checked
against `src/` at every change. Facts that live elsewhere (the lifetime of a
quiz and of a class's data, the picture limits, points for speed) are stated
on the page as the code does them, and the page changes with the code. The
page's example quizzes are parsed by the test suite (`src/quiz/format.test.ts`),
which keeps the specification and the parser in step.

### Shape and anchors

The root URL serves the guidance as static HTML that reads without
JavaScript; the landing's language switch (`design/root-page.md`) is a script
over an English block, so a fetcher reads English. The guidance runs from
"About classyQuiz" through the manual (`#site`), what informs the shape of the
quizzes (`#quizzes`), how quizzes are built (`#format`) and building with the
teacher (`#with-a-teacher`).

The "build with the teacher" stance is the owner's: the teacher knows what
they need and is there to say it, and an AI that guesses what a sentence would
have settled reads as not having understood. The page names what a teacher who
frontloads gives (exercises, number of questions, the sheet's numbers or new
ones, language) and says the quiz follows the answer; otherwise the first
reply is a few lines of what is clear and what is open, put so the teacher can
answer in a line.

### Claims about what an AI can do

Any claim about what an AI can do carries the tier and the date it was tested,
for instance "free Claude Sonnet, tested 4 Nov 2026": a qualifier and a trust
signal at once, never "the free version works". Such claims stay off the page
until a test has timed them; the owner's example of the eventual form is the
time to make an own copy.

### The AIs verified against

- Claude is the design target.
- Verified against the AIs teachers actually use: ChatGPT, Gemini and
  Microsoft Copilot, including Microsoft 365 Copilot Chat, which schools often
  provide through education accounts. Mistral Le Chat is an optional addition
  for European teachers.
- Free tiers are tested as well as paid ones, because they decide whether an AI
  can fetch a page or produce a file at all. The design target is a teacher on
  a free account, so free-tier Claude (claude.ai) is the first verification;
  there is no specific real teacher yet.
- A run checks three things: the AI understands the site from its address
  alone; it handles the authoring situations (a full brief, no brief, a
  handwritten note among the scans, contradictory material) sensibly; it
  produces a quiz that parses and whose keys are right. Parsing alone is not
  the test.
- A local harness, `.tmp/ai-tests/` (`run.mjs`), with runs in
  `.tmp/guidance-runs/`, lives outside the repo. It drives the `claude` CLI
  under the owner's login, with no tools and no project context, the page
  injected as if fetched. It is a machine-local aid, not reviewed for the repo.

Observed once, on the cut page: a partial ask (five exercises, language
unstated) got a summary and one question before the quiz, the language, with
defaults the teacher can change (new numbers, no timer) stated. One sample is
not a rate.

## Not known

- How real fetching behaves, and the effect of the claude.ai system prompt on
  a model reading the page.
- Behaviour of other models and of free tiers on the current page.
- Whether a partial ask reliably gets the short summary and question rather
  than a quiz at once; samples have gone both ways.
- Whether the drawn number-line quizzes' pictures match their keys.
- Whether `Read <address>.` beats "for it", "with it" and "Have a look at" at
  getting the page fetched before the first build; the test waits until the
  landing and guidance settle, because of the fetch cache.
- Whether AIs give answer pictures a ground of their own often enough: the
  page says the tile colour, shuffled, shows through a transparent picture,
  and a blueish-green mark once vanished on the blue tile (backlog v4 item 11).
