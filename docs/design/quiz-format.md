# The quiz text format and its parser

## Purpose

The quiz is what a teacher's AI hands over after talking with the teacher.
Its format must let a wrong key be seen in seconds and
fixed in the text or by telling the AI, and must be one an AI writes
reliably from exercise sheets, usually in a chat, for a teacher who doesn't
debug text.

When the AI gets something wrong, the message the teacher sees is one she
can paste back to it. That is a fallback, not a loop to rely on: a loop that
iterates is a failure, and keeping the format simple lets "fix it" find the
obvious fix.

The specification is the guidance page's "Format" section
(`src/public/index.html`), where AIs read it; the parser is
`src/quiz/format.ts`.

## Situation

- AIs vary what they write: prose and code fences around the quiz, curly
  quotes and typographic dashes, Markdown on keywords, letters before
  answers, inconsistent numbering, sometimes two quizzes in one answer. The
  parser forgives what it can read unambiguously and reports the rest; it
  never guesses a key.
- A chat window may render the text before it is copied, turning `+` and
  `-` into bullets. A question with no answer marked right is an error, so
  lost marks fail loudly.
- Any number of a question's answers may be right: there is fun to be had
  with questions whose answers are all correct.
- An index key ("answer: 3") lets an AI err without anyone noticing; a mark
  beside the answer's text is seen where the text is read and can be moved
  on a phone. Maths text uses `=`, `~` and `/`, so nothing in the format
  needs escaping.
- An AI may work from an older or cached reading of the guidance, so lines
  the format no longer has still parse.
- A fetch tool's small model asked for the format writes its own summary and
  example from it (`guidance-page.md`, Situation). What the format requires
  reaches that example more often than a warning elsewhere on the page, so
  the format's required first line is a comment naming the full manual's
  address, which gets a summary's reader to fetch the manual itself; nothing
  checks it.
- Plausible assumption: a quiz used once (backlog, Project) with a format
  error is regenerated rather than repaired by hand, so the parser's
  messages are written for the AI.
- Plausible assumption: a class that sees the right answer in the same place
  learns "tap red" within a few questions. In one quiz an AI wrote,
  the right answer came first in 14 of 19 questions. So the site shuffles
  answers at upload, and a parallel class playing its own upload sees
  another order. Where an order matters is the AI's to see and mark
  (`Order: fixed`); an order kept implicitly by the site is one neither the
  AI nor the teacher can see.
- The AI talks to the teacher while authoring, when she can react; nothing
  in the quiz is addressed to her during the lesson. A doubt goes in the
  conversation before the quiz is handed over.
- The guidance asks for one `quiz.txt` in UTF-8, narrower than what the site
  opens, so the format can migrate later under a fixed name.
- The AI that wrote the quiz still has it in context, so the verifier
  (`/verify.py`) only has to name the question and the problem. It holds
  the AI to the published format, stricter than the parser, which protects
  the teacher from an AI that strayed. Plausible assumption: an AI with a
  sandbox has Python's standard library.

## Not known

- Whether AIs run the verifier: whether they have a sandbox with Python, and
  whether the line on the page gets them to.
- Whether AIs mark several answers right where they shouldn't.
- Whether AIs use `Order: fixed` where it matters.
- Whether teachers are confused that the class sees another order than the
  AI's text.
- Whether maths needs more than plain Unicode characters.
- How often a doubt the AI mentions in the chat goes unread now that the
  quiz carries no notes.
