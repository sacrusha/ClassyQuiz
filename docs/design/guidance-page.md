# The guidance page

## Purpose

The guidance is the part of the root page (`src/public/index.html`, from the
heading "About classyQuiz" on) that an AI reads. Someone who wants a quiz
names the site to their own AI, and that must be enough: the AI comes away
understanding what the site is for, how its quizzes are played, how a quiz is
built, and how to build one with a human (backlog v1 item 11). That someone is
first the example class's teacher, with material in hand and a lesson coming
up, and also a learner, friends, or whoever runs a quiz for another group
(backlog v5 item 9; who arrives: `root-page.md`, Situation). The page is the one address the teacher gives, so it
leads straight to everything the AI needs.

It has a second reader. In the owner's words, it is the "manual for the AI, and
humans who like to get their hands dirty": for people it only has to show that
there are no secrets, that it is not magic, and that they are allowed to look.
It need not read easily for them.

The page is the home of what the AI reads. This file says what the page is for
and the situation it is written into, and does not repeat it. The format's
specification is on the page; `design/quiz-format.md` says why the format is
shaped as it is.

## Situation

- The reader is a model that has just been given an address, often by a
  teacher on a free AI account. It fetches the page, or fails to. Some hosting
  plans block AI fetchers by default, and fetch tools may not follow links.
  Whether a given AI understands the site from its address alone is a fact to
  test, not to assume.
- Claude Code's WebFetch, as its code reads in 2.1.322 (Nov 2026), asks for
  `text/markdown` first, turns HTML into Markdown with Turndown (`style`,
  `script`, `noscript` and `iframe` removed), and hands the calling model a
  small model's answer to the caller's prompt rather than the page. For a
  site off its preapproved list, that model is told to quote at most 125
  characters at a time and to answer concisely, and it condenses the
  manual even when the page and the caller both ask for it whole; its
  exception for open source software doesn't take. Its summaries pass on the manual's
  pointer to `/manual.txt`, which a model with a shell fetches whole.
  Getting the page itself through would take a prompt injection, which a
  public repository can't document, so an edit that doesn't know of it
  would break it.
- The product's situation (teacher time as the measure, the example class, the
  AI that may be a free one) is the backlog's Project and Constraints sections. The guidance
  puts the part of it the reading model can't know into its own words.
- Plausible assumption: a capable model already knows teaching, question
  design and how to talk to a teacher or anyone else who asks (what the cut
  to the site's facts rests on). What it can't know is the site: what it
  does, how the screens and a lesson run, how long data lives, the format
  with examples, the limits, how a quiz reaches the site and what the
  upload shows.
- The quiz file is the same for every way it is played (Solo, Peers,
  Quizmaster: `local-check.md`), and the user picks the way after opening it.
  The ways differ in what shapes a question: where it is read and from how
  far, whether it is read out with its choices hidden first, whether the
  spread comes before the solution, and whether the person asking plays.
  Plausible assumption: an AI that knows how its quiz will be played
  specialises it (untested, "Not known").
- Whoever asked the AI may play the quiz (backlog v5 item 5): a learner
  alone, one of the friends. An AI shows its draft in the conversation: the
  example's run did (`example-page.md`), and the page leads towards a
  presentation. Whether seeing the questions spoils the play depends on
  what was asked for (the owner): someone who asks for a quiz on their own
  50 words expects those 50 words to be there, and friends who want a pop
  quiz don't want it read out beforehand.
- Plausible assumption: fetched text that gives orders to the reader can trip
  an AI's prompt-injection guards, while reference material gets read, and a
  well-marked example of using an AI with the site trips no guard (why the
  page informs rather than instructs, below).
- The teacher's own words to their AI are not the page's voice; whether the
  AI fetches the page at all depends on them (the example asks, `root-page.md`,
  "Getting a quiz").
- Teachers differ from message to message: a full brief needs no questions,
  contradictory scans may need two, and a rule of the form "ask at most one
  question" fails both. Many models spot a rule and follow it to the
  letter, also outside the situation it was written for (the owner).
  Language is the same: the language of the exercises and
  of the request vary without end, AIs resolve it with location and memory, and
  no list of cases is exhaustive.

## How the site meets it

### Information in place of rules

The page describes the site and the situation of building a quiz with a
teacher, so that the AI's behaviour follows from understanding, the way an
implementer's follows from the backlog. The quiz format is presented as a
specification ("a quiz looks like this"), not as commands.

Rules can't adapt and they block better solutions, and commands in a fetched
page can trip injection guards. Where an instruction is the point, a plain, well-marked
one is right.

Wide terms work like an abstract interface in OOP (owner, from Telic
Programming's "negative space"): the page names what the builder works with,
such as a presentation, and the builder specializes it from its own
situation, the way a subclass overrides. What doesn't apply to a builder
drops out without being said, so qualifiers like "for AIs that can render a
preview" add nothing, and imply the page knows the builder's means better
than the builder does.

The page leaves out what a model that can write the quiz at all gets right
anyway: that the keywords stay English in a quiz of any language (owner: an
AI that can't be trusted not to translate format tags can't be trusted to
write a script, ever), and that a quiz has no timer of its own (the AI copies
the format it is shown).

### Cut to what the reading model can't know

The page says only what the reading model can't already know: the site's
facts. Left out is advice a capable model derives from them or already has:
how to design wrong answers, short questions, when a fixed order fits, how
long a countdown a kind of task needs, cropping of pictures,
notes to the teacher outside the quiz text. The facts those rested on stay, per
way of playing: where the question is read (on the big screen from the back
of the room, or on a device at arm's length), whether the spread comes before
the solution, that a quiz carries no explanations, and that answer pictures
lie on tiles in four colours. How the parser treats a file
that doesn't follow the format (stray text, files beside the quiz) is left off:
a file that doesn't follow the format doesn't work, and the published format
is narrower than the real one on purpose (`quiz.txt`, UTF-8), so that the
format can migrate later (`quiz-format.md`). The page does say that the
quiz's text alone, and the archive named `.quiz`, open too
(`root-page.md`, "Opening: the `.zip` and nothing else").

The ways to play are described as far as they shape a quiz: Solo's solution after each
answer and the answers copied for the player's AI; the Peers room that moves
on once everyone has answered, and its opener's fixes; a Quizmaster's
question first read with its choices hidden, then the choices, the answers
without the solution, the solution, the ranking, steered from the big screen
or a second device, and the optional countdown of 15 s that closes
answering. What the site
reports at upload is not described: the AI's file should work the first time
(owner: there must be no loop; a loop that iterates is a failure, and "fix
it" should allow the obvious fix, by keeping the format simple). How the steering works (its buttons, a
clicker, a double press, which device takes which job, what happens when a
phone goes quiet) shapes no quiz, and on the page only goes stale. The page uses the teacher screens' words, choices, answers and
solution (`question-flow.md`, "The steering bar"), as the format's messages
do.

### Describes the site as it runs

The guidance describes the site as deployed, so what it says is checked
against `src/` at every change. Facts that live elsewhere (the lifetime of a
quiz and of a class's data, the picture limits) are stated
on the page as the code does them, and the page changes with the code. The
page's example quizzes are parsed by the test suite (`src/quiz/format.test.ts`),
which keeps the specification and the parser in step.

### Shape and anchors

The root URL serves the guidance as static HTML that reads without
JavaScript; the landing's language switch (`design/root-page.md`) is a script
over an English block, so a fetcher reads English. The guidance runs from
"About classyQuiz" through the manual (`#site`), what informs the shape of the
quizzes (`#quizzes`), how quizzes are built (`#format`) and "Build with the
user" (`#with-the-user`, with `#presenting`). The first two
sections carry the FAQ-kind information (the ways to play, how a room runs,
privacy, hosting), which doubles as context for building; the format section
carries what building needs.

The guidance's nouns are those of `root-page.md`, "Words for whoever comes".

The "Build with the user" stance is the owner's, said of the teacher and
true of any user: the teacher knows what
they need and is there to say it, so the AI doesn't guess; building takes
minutes, long enough for the teacher's attention to drift, so asking early
beats delivering something half right. The page gives three phases (establish
what gets built, build, present and refine) as situation: the gaps are closed
with the teacher before the build, because the build takes one to three
minutes and some teachers do something else meanwhile; a teacher who
frontloads everything probably wants the build at once. The first phase
carries an example response: one short reply that says what the AI took
from the material and asks what it couldn't, which leads towards that shape
without ordering it, where an assistant's pull is to build at once on what
it has. "Presentation" is deliberately abstract:
each AI shows the teacher the questions, or a question type, with whatever
tools it has, for approval or correction during the conversation, not as a
gate. Its purpose is the teacher's feedback, so the page asks for usefulness,
not fidelity, and names two kinds. The dense one is the whole quiz as one
high-resolution picture, for judging whether the questions are the kind the
teacher needs, the right answers right and the wrong ones wrong. The chat is
for the conversation: a preview over several screens pushes it apart, jumps on
every remark, and multiplies with each version, worse with pictures mixed in;
one picture stays one item, read whole when scaled down and in detail when
zoomed; a page the app shows beside the chat (an artifact) does the same.
The pictures sit in the AI's sandbox, and written out by hand as base64 they
cost the AI its output, so code puts them in: into an HTML page the code
writes, where the app shows that page beside the chat, or into the picture
`/preview.py` draws from the zip (Python and Pillow; SVG needs cairosvg or
rsvg-convert), like `verify.py`. The page gives the layout in a short layout
notation, so each AI picks the delivery its app shows well.
A text form is left to the AI that can't draw: an AI that turns sheet photos
into a quiz can infer one. The sheet leaves out the choices' colours and
shapes, which come from places on screen after the shuffle, so a preview's
red would not be the projector's red. The faithful one is the projector's
look, for AIs that can render HTML, for a question type or the whole quiz:
about a screen per question, which is the point where the picture is the
question (the chess run, below). Which to use is the builder's call in its
situation; the page gives what each costs and serves. Its home is the layout page
(`/layout`), which stays as-built and complete, as HTML and CSS, because it is
linked rather than inlined. Whether to present follows from who will play
and what they asked for (below). On controversial subjects the user leads (the owner): an AI may bring in
propaganda it was trained on, or guess the user's political leaning, or
read it from memory, and build on that, which is a problem where the quiz is
for an audience and not for the user.

### The user who plays

Purpose (backlog v5 item 5, the guidance's side): whoever asked the AI for
the quiz can play it without the conversation having spoiled it. The page
says so as situation, at the head of "Presenting" (`#presenting`): a user
who will play solo or with peers might need protecting from spoilers,
depending on what they asked for, with a case each way (vocabulary the
user struggles with, where spoilers don't matter; a pop quiz on the space
race played alongside friends, where they do). Whether to present, and
what, is the AI's to derive: the layout under it leads towards showing the
questions with their solutions, and what a spoiler costs holds that back
where it applies. The owner: a ruling is for a hard constraint like the
file format; a rule against showing questions gets the 50 words wrong
(Situation). The site's side is the local check's fold (`local-check.md`);
the user's side, the example asks that say "I'll play it myself" and "I'm
playing too" in the user's own words (`root-page.md`, "Getting a quiz").

Who plays is in the ways' descriptions: in Peers whoever opens the lobby
plays too, and a Quizmaster runs the quiz for the group
(`teacher-devices.md`: their screens take no answers).

### The AIs verified against

- The AIs teachers actually use, beside Claude: ChatGPT, Gemini and
  Microsoft Copilot, including Microsoft 365 Copilot Chat, which schools often
  provide through education accounts. Mistral Le Chat is an optional addition
  for European teachers.
- Free tiers are tested as well as paid ones, because they decide whether an AI
  can fetch a page or produce a file at all. A teacher may be on a free account
  (backlog, Project).
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

Observed once each, 5 Nov 2026, the same ask: five rated chess puzzles for
eight-year-olds, in German, the last one a choice between two positions.
- Claude Opus 5.5 on paid claude.ai (Opus isn't on the free tier) asked four
  questions first, one of them whether the teacher wanted to see the quiz
  before the zip. It sourced Lichess puzzles, checked them with Stockfish, and
  delivered a verified zip with 900-pixel PNG boards, an artifact of all five
  questions in the layout page's forms with the boards and a "Lösungen
  markieren" toggle, and in the chat a table of each question's right and
  wrong moves with caveats. That the artifact's HTML was written by code, the
  boards embedded by it, is inferred, not seen. Chess boards need the full
  display; five questions kept it short.
- Free ChatGPT made up its own puzzles, quickly and poorly; several keys were
  wrong.

The free tiers, the owner's findings as of 5 Nov 2026 (in his words where
quoted; runs not recorded beyond the above):
- Free Claude Sonnet: the one free AI that builds the quiz reliably (the
  example's run, `design/example-page.md`).
- Free ChatGPT: had a web tool on some runs and not on others, and without it
  "improvised", presenting a quiz built with no idea what was asked; it also
  hit the daily upload limit on the second photo, which makes it impractical.
- Free Gemini: has trouble with the `.zip`. On one test it told the user
  of the plain-text route by itself, from the page's sentence that plain
  text works (the owner).
- Free Microsoft Copilot: "generally slightly above Haiku's level"; not
  trusted to generate a quiz.
- Grok: not tested.
- Paid plans, the owner's knowledge of them rather than a run here: the paid
  versions of ChatGPT and Gemini have models at least as strong as Sonnet,
  web access and scripting, and make zip files; nothing indicates they can't
  build the quiz. The root page sends a visitor to the AI they subscribe to
  on this basis (`design/root-page.md`, "Getting a quiz").

## Not known

- How real fetching behaves, and the effect of the claude.ai system prompt on
  a model reading the page.
- Behaviour of other models and of free tiers on the current page; paid
  ChatGPT and Gemini, and Grok, untested.
- Whether "neither is advertised" keeps an AI that can make a `.zip` from
  offering plain text or `.quiz`, while one that can't still offers them.
  The owner expects the phone whose extractor swallows the `.zip` to be
  rare, and `.quiz` to come up once the user describes it to their AI
  ("when I click on it, it only shows me a list of names"); untried.
- Whether AI sandboxes have cairosvg or rsvg-convert, without which
  `preview.py` shows SVG pictures as "not drawn here"; untested, as is that
  path of the script.
- Whether a partial ask reliably gets the short summary and question rather
  than a quiz at once; samples have gone both ways.
- Whether the drawn number-line quizzes' pictures match their keys.
- Whether `Read <address>.` beats "for it", "with it" and "Have a look at" at
  getting the page fetched before the first build.
- Whether AIs derive from the page when showing the questions would spoil
  the play, and whether a user who wasn't shown them hears enough to trust
  the quiz; and whether the example response leads AIs to ask before they
  build. No run on the current page.
- Whether an AI told how the quiz will be played shapes it differently
  (questions for a phone at arm's length, a length for friends); untested.
- Whether AIs give answer pictures a ground of their own often enough: the
  page says the tile colour shows through a transparent picture,
  and a blueish-green mark once vanished on the blue tile (backlog v4 item 11).
