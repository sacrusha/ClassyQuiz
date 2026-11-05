# The quiz text format and its parser

## Purpose

The quiz is the finished deliverable a teacher's AI hands over after talking with the teacher. Two things are asked of its format (backlog v1 item 1):

- **A wrong key must be visible in seconds**, and fixable in the text or by telling the AI.
- **An AI must be able to write it reliably.** The AI writes from exercise sheets, usually in a chat, and the teacher is not someone who debugs text.

When the AI gets something wrong, the message the teacher sees must be one she can paste back to the AI (backlog v1 item 13, low priority, but it falls out of the parser at little cost). It is a fallback, not a loop to rely on: the owner's "there must be no loop; a loop that iterates is a failure, and 'fix it' should allow the obvious fix, by keeping the format simple".

The format's specification is the "How quizzes are built" section of the guidance page, `src/public/index.html`, because that is where AIs and teachers read it. This file does not restate it. It says what the format is for and why it is shaped so. The parser is `src/quiz/format.ts`; where the page and the parser differ, the parser is what runs.

## Situation

- AIs vary what they write. They add prose around the quiz, wrap it in code fences, use curly quotes and typographic dashes, number inconsistently, put Markdown on keywords, add letters to answers ("A)"), and sometimes write two quizzes in one answer.
- A chat window may render the text before it is copied. Then `+` and `-` turn into bullet points and the marks are lost.
- The AI may be working from an older or cached reading of the guidance, so it may still write lines the format no longer has.
- A quiz is single-use. One with a format error is regenerated far more often than repaired by hand.
- A class that sees the right answer in the same place learns "tap red" within a few questions. In one quiz the owner's AI wrote, the right answer came first in 14 of 19 questions.
- The teacher checks the key after upload and can fix it during the run: user-flow.md §3.3 for the list, `question-flow.md` for fixing.
- Who the teacher is, which AIs, and that a quiz arrives as a zip (not pasted text) are in the backlog's Project and Constraints sections and in `root-page.md`.

## How the site meets it

### The right answer is marked on its own line

`+` marks a right answer, `-` a wrong one, at the start of the answer's own line. An index ("answer: 3") would let an AI err without anyone noticing; the inline mark sits next to the text a human reads, in a fixed column, and a phone keyboard can move it.

Any number of a question's answers may be right, from one to all, and a student who picks any of them scores. The owner's frame, in his words: "There is fun to be had with questions where all answers are correct." A question with none marked right is an error. That is how lost marks (a copy from a rendered bubble) fail loudly instead of the parser guessing a key.

A question has two to four answers (`MIN_ANSWERS`, `MAX_ANSWERS` in `format.ts`). The guidance and the format's messages call them choices, as the teacher's screens do (`question-flow.md`, "The steering bar"); this file keeps the code's word.

Rejected formats, kept as one line each so nobody tries them again:
- Aiken (lettered answers plus "ANSWER: B"): an index key, which hides errors.
- Moodle GIFT: `=` and `~` collide with maths text and need escaping.
- JSON: a wrong key isn't visible at a glance, and a teacher can't fix it by hand on a phone.

### Plain text, English keywords, any language

The site shows quiz text as written, without Markdown, so maths is Unicode characters. The keywords (`Title:`, `Image:`, `Background:`, `Order:`) are English in every quiz language; answers carry no keyword or letter.

Questions are numbered `1.`, `2.`, but the parser doesn't need the numbers. When present they separate questions robustly: a line numbered as the next question ends any stray text before it, so an AI's "Explanation:" line becomes a reported error instead of merging silently into the next question. A number is stripped only when it is the one expected next, so "1.5 + 2" stays.

### What the parser forgives, and what it refuses

The parser forgives what AIs typically add or vary and refuses only what it cannot interpret unambiguously. It reports rather than guesses a key.

Forgiven:
- a chat answer around the quiz: fenced code blocks are picked out, an unclosed fence runs to the end, prose before the title is dropped, prose after the last question gets a warning;
- Markdown on keywords and questions, checkbox answers (`- [x]`), dash, minus and fullwidth-plus variants, whole-block indentation, an answer continued on a deeper-indented line;
- CRLF, BOM, zero-width and non-breaking spaces, and leading bidi marks in right-to-left text (ZWNJ and ZWJ are kept: they carry meaning in Persian, Indic scripts and emoji);
- question numbers, and answer letters ("A) ", "(a) ", "B. ") when every answer of the question carries the next letter from A with the same mark and the answers are shuffled. Shuffled, "A)" would land third, and a warning would ask the teacher to fix what the site can. A bare letter is an answer, not a prefix.

Refused, as errors naming the question:
- no answer marked right; fewer than two or more than four answers;
- `*` and `•` bullets, which don't say right or wrong;
- an answer before any question; text between questions without answers;
- a `Title:` after questions have started: that is a second quiz, and merging would be silently wrong. Two quizzes are two uploads.

Only warned: no title, the same answer twice, an answer or question too long for a button or the back row (`LONG_ANSWER`, `LONG_QUESTION`).

Messages name the question and the problem in plain words.

### Answers are shuffled; `Order: fixed` keeps an order

The site shuffles each question's answers at upload. The AI can write the right answer anywhere, first included, and the class still doesn't learn a position. A parallel class plays its own upload, so it can't be told "number 3 is red" in the break: its order differs.

Alternatives that failed, kept because their reasons still hold:
- Guidance only (write the key first, then permute with a script): an AI that skips the last step or can't run code leaves every key first, worse than before.
- A warning when the key sits in one place: it costs the teacher a round trip to the AI in the break, and it did not fire when only most questions were biased.
- Shuffling only when the text shows the bias: the rule is harder to state and the teacher can't predict what the class sees.

The order is the same on every screen: projector, tablets, the teacher's remote and the lobby's question list. Position in the text matters to nobody, since the teacher checks the key in the lobby's list and fixes it on the remote, both in screen order. `startRun` and `shownOrder` in `src/server/game.ts` make the order, and `orderOf` maps screen to text. Everything stored stays by text order; see `question-flow.md`.

`Order: fixed` keeps a question's order, or every question's when it stands before the first question. The guidance publishes only the per-question form, as it does for `Background:`: the parser's quiz-wide forms aren't used, and publishing unused functionality is bad design (owner). Where a fixed order belongs (letters that label a picture, a sequence, a vote) is the AI's to see. No answer keeps its order implicitly. A rule hidden in the site is one neither the AI nor the teacher can see or rely on, so "A, B, C, none" without the line is shuffled like any answers, and letters are dropped from shuffled questions but kept under `Order: fixed`. `Order: shuffle` (or random, mixed) states the default.

An `Order:` line after the answers counts for the question above: unlike a picture line it can't be meant for the next question.

### The quiz carries no notes

Nothing in the quiz is addressed to the teacher. The AI talks to the teacher while authoring, when she is there to react, not through the quiz during the lesson (backlog v1 item 1). A doubt belongs in the conversation before the quiz is handed over, best as a reading the teacher can confirm; the guidance's "Making a quiz with a teacher" says so.

The parser still recognises `Note:`, and `Tempo:` and `Time:`, and drops them without error or warning, so an AI working from an older guidance still produces a quiz that runs. A warning would be noise about something the teacher can't act on. An indented line after one doesn't continue the answer above it. The pace of a question is the teacher's, steered in the room (`question-flow.md`), so the format has no tempo.

What the old per-question note protected, and nothing now does: a doubt the AI raised in a chat the teacher only skimmed doesn't reappear during the run. What remains is the lobby's question list with the answers a tap away, and fixing during the run.

### Pictures in the format

The lines `Image:`, `Background:` and picture answers (`+ Image: pie-3.png`) are parsed in `format.ts`. Their shape, errors and warnings are in `pictures.md`, "In the text".

### Which text file in the zip

The guidance asks for one `quiz.txt` in UTF-8 beside the pictures, narrower than what the site takes so that the format can migrate later under a fixed name. The site takes more: the text is the zip's `.txt` or `.md` file, found by `quizTextFromEntries` in `src/client/unzip.ts`. An AI may put a README or its own notes beside the quiz, so with several text files the one that reads as a quiz wins: no errors first, then the most questions; a tie goes to the top level, then the shortest path. When none has a question the first is taken, so the teacher's error is about the likeliest file.

### The verifier for the AI

Purpose: the AI that wrote `quiz.txt` can catch a slip before the teacher has to. The file is some 100 lines and still in that AI's context, so all it needs is a hint what's wrong: the question's number and the problem, such as an image named in the text and missing from the zip. No line numbers and no detail beyond that; the checker's simplicity is its value, and a longer one is one more thing to keep in step with the format.

`src/public/verify.py` (served at `/verify.py`, linked from the format section of the guidance page) takes a zip and checks what the guidance specifies: `quiz.txt` at the top level in UTF-8, a one-line title, numbered question blocks separated by blank lines, two to four choices with at least one `+`, only the published tags, and every named picture present in the zip (matched without folder or case, as `imageKey` does). It prints `ok` or one line per problem.

It is deliberately stricter than the parser, which forgives what AIs vary (see above): the verifier holds the AI to the published format, the parser protects the teacher from the AI that strayed from it. It does not check picture types, sizes, zip size or text length; the upload does. It is plain Python with the standard library, because an AI with a sandbox usually has it.

## Not known

- Whether AIs run the verifier: whether they have a sandbox with Python, and whether the line on the page gets them to.
- Whether AIs now mark several answers right where they shouldn't.
- Whether AIs use `Order: fixed` where it matters.
- Whether teachers are confused that the class sees another order than the AI's text.
- Whether maths needs more than plain Unicode characters.
- How often a doubt the AI mentions in the chat goes unread now that the quiz carries no notes.
