# The guidance page

## Purpose

The guidance is the part of the root page (`src/public/index.html`, from the
manual's heading, `#site`, on; also `/manual.txt`) that an AI reads. Someone
who wants a quiz names the site to their own AI, and that must be enough:
the AI comes away understanding what the site is for, how its quizzes are
played, how a quiz is built, and how to build one with a human. That someone is first the example class's teacher, with material
in hand and a lesson coming up, and also a learner, friends, or whoever runs
a quiz for another group. Whoever asked may play the quiz without the
conversation having spoiled it.

It has a second reader: it is the manual for the AI, and for humans who
like to get their hands dirty. For people it only has to
show that there are no secrets, that it is not magic, and that they are
allowed to look. It need not read easily for them.

The page is the home of what the AI reads; why the format is shaped as it
is: `quiz-format.md`.

## Situation

### The reader and its fetch

- The reader is a model that has just been given an address, often by a
  teacher on a free AI account. It fetches the page, or fails to. Some
  hosting plans block AI fetchers by default, and fetch tools may not follow
  links. It reads the page's static HTML, which is English
  (`root-page.md`, "The page's two readers").
- Claude Code's WebFetch, as its code reads in 2.1.322 (Nov 2026), turns
  HTML into Markdown and hands the calling model a small model's answer to
  the caller's prompt rather than the page. For a site off its preapproved
  list, that model quotes at most 125 characters at a time and condenses
  the manual even when the page and the caller both ask for it whole. Most
  summaries drop a sentence that names `/manual.txt` or asks for the manual
  whole, whatever its wording, and write their own example from the format,
  with errors the page doesn't contain (`Order: fixed` on ordinary
  questions, translated keywords, tags after the choices). What the format
  requires travels better: with its first line a required comment naming
  the manual's address (`quiz-format.md`), fourteen of sixteen summaries
  gave the address, which sends whoever reads the summary to the manual
  itself.
- Sonnet has so far always followed its first fetch with questions; Opus
  asked for the whole manual and fetched it with curl.
  In the example's sheets run Sonnet noticed that WebFetch only summarised,
  and fetched the original with a command (`docs/example/text.py`). A
  model with a shell fetches `/manual.txt` whole.
- In Claude's web environment, WebFetch keeps a page cached for hours (Nov
  2026), so a changed page reaches an AI there late.

### What the reader knows, and how it takes text

- Plausible assumption: a capable model already knows teaching, question
  design and how to talk to whoever asks. What it can't know is the site:
  what it does, how the screens and a lesson run, how long data lives, the
  format, the limits, how a quiz reaches the site. The page is cut to that.
- Plausible assumption: fetched text that gives orders to the reader can
  trip an AI's prompt-injection guards, while reference material gets read.
- Many models spot a rule and follow it to the letter, also outside the
  situation it was written for; only under a hard constraint, such as the
  file format, is the letter what is wanted. Teachers differ from message to
  message: a full brief needs no questions, contradictory scans may need
  two, and "ask at most one question" fails both. The language of the
  material and of the request vary without end, and AIs resolve it with
  location and memory.
- From Telic Programming's "negative space": wide terms work like
  an abstract interface. The page names what the builder works with, such
  as a presentation, and the builder specializes it from its own situation;
  a qualifier like "for AIs that can render a preview" adds nothing and
  implies the page knows the builder's means better than the builder does.

### The user

- The user knows what they need and is there to say it, so the AI needn't
  guess; building takes minutes, long enough for attention to drift, so
  asking early beats delivering something half right.
- The AI's file should work the first time (`quiz-format.md`, Purpose).
- Whoever asked the AI may play the quiz: a learner alone, one of the
  friends. An AI shows its draft in the conversation. Whether seeing the
  questions spoils the play depends on what was asked for:
  someone who asks for a quiz on their own 50 words expects those 50 words
  to be there, and friends who want a pop quiz don't want it read out
  beforehand.
- On controversial subjects the user leads: an AI may bring in
  propaganda it was trained on, or guess the user's political leaning, or
  read it from memory, and build on that, which is a problem where the
  quiz is for an audience and not for the user.
- The quiz file is the same for every way it is played, and the user picks
  the way after opening it (`local-check.md`). The ways differ in what
  shapes a question: where it is read and from how far, whether it is read
  out with its choices hidden first, whether the spread comes before the
  solution, and whether the person asking plays. Plausible assumption: an
  AI that knows how its quiz will be played specialises it.

### The site it describes

The page states facts that live in the code (the lifetime of a quiz and of
a class's data, the picture limits, how a question is laid out), so a
change to those makes it stale. Its example quizzes are parsed by the test
suite (`src/quiz/format.test.ts`).

### The AIs teachers use

- Beside Claude: ChatGPT, Gemini and Microsoft Copilot, including Microsoft
  365 Copilot Chat, which schools often provide through education accounts;
  Mistral Le Chat for European teachers.
- A teacher may be on a free account (backlog, Project), and the free tier
  decides whether an AI can fetch a page or produce a file at all.
- A run that tells whether an AI copes asks whether it understands the site
  from its address alone, handles the authoring situations (a full brief,
  no brief, a handwritten note among the scans, contradictory material)
  sensibly, and produces a quiz that parses and whose keys are right.
- A machine-local harness outside the repo, `.tmp/ai-tests/` (`run.mjs`,
  runs in `.tmp/guidance-runs/`), drives the `claude` CLI under the owner's
  login with the page injected as if fetched. It is not reviewed for the
  repo.

Findings as of Nov 2026, which the root page's "Any AI
subscription will do, or free Claude." rests on:

- Free Claude Sonnet: the one free AI that builds the quiz reliably. The
  example's sheets run was made in the web environment, whose free and paid
  plans have the same features there.
- Free ChatGPT: had a web tool on some runs and not on others, and without
  it "improvised", presenting a quiz built with no idea what was asked; it
  hit the daily upload limit on the second photo; asked for chess puzzles,
  it made up its own, several with wrong keys.
- Free Gemini: has trouble with the `.zip`. On one test it told the user of
  the plain-text route by itself, from the page's sentence that plain text
  works.
- Free Microsoft Copilot: "generally slightly above Haiku's level"; not
  trusted to generate a quiz.
- Paid ChatGPT and Gemini, from what is known of them rather than from a
  run: models at least as strong as Sonnet, web access and scripting, and
  zip files; nothing indicates they can't build the quiz.
- Grok: not tested.

## Not known

- How real fetching behaves, and the effect of the claude.ai system prompt
  on a model reading the page.
- Other models and free tiers on the current page; paid ChatGPT and Gemini,
  and Grok, untested.
- Whether an AI that can make a `.zip` refrains from offering plain text or
  `.quiz`, while one that can't still offers them. Expected, untried: the
  phone whose extractor swallows the `.zip` is rare, and `.quiz` comes up
  once the user describes it to their AI.
- Whether AI sandboxes have cairosvg or rsvg-convert, without which
  `preview.py` shows SVG pictures as "not drawn here"; untested, as is that
  path of the script.
- Whether a partial ask reliably gets a short summary and question rather
  than a quiz at once; samples have gone both ways.
- Whether the drawn number-line quizzes' pictures match their keys.
- Whether `Read <address>.` beats "for it", "with it" and "Have a look at"
  at getting the page fetched before the first build.
- Whether AIs derive from the page when showing the questions would spoil
  the play, and whether a user who wasn't shown them hears enough to trust
  the quiz; whether the page leads AIs to ask before they build.
- Whether an AI told how the quiz will be played shapes it differently.
- Whether AIs give answer pictures a ground of their own often enough: the
  tile colour shows through a transparent picture, and a blueish-green mark
  once vanished on the blue tile.
