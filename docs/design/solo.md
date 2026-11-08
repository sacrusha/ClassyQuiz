# Solo

## Purpose

Someone practises or reviews on their own, with a quiz their AI or their
teacher's made, without having seen its answers (backlog v5 item 2).
Nothing is uploaded and nothing counted; closing the tab ends it, which the
owner finds fine and expected.

Here the question, its picture and the tiles live on the player's own
device for the first time, then the key (v5 item 6). A room without a
wall stands on that screen too: Peers does (`peers.md`), a Quizmaster's
devices-only room is to come.

## Situation

- The quiz is open on the local check (`local-check.md`): read in the
  browser, its pictures as blob URLs, the check's fixes beside it. The
  game's rules are pure and run in the browser (`server/game.ts`), and so
  does the wall's layout of a question.
- Alone, nobody disputes a wrong key, and the learner can't tell a wrong
  solution from their own mistake. The quiz carries no notes
  (`quiz-format.md`); the learner's AI, after the run, is where a doubt
  can go. Editing the quiz isn't Solo's (owner: a review may edit, solo
  play doesn't).
- Observed in the owner's user testing: preteens got excited about seeing
  their avatar celebrate (jump) in solo runs.
- Plausible assumption (the owner's): Solo is a newcomer's first use of the
  site, often with the example quiz, so frictionless beats
  confusing-but-powerful options. Solo therefore has no settings, its card
  is the check's first, and its button starts it.
- A reload, a phone's pull to refresh included, loses the quiz: the check
  holds it in memory only (`local-check.md`, "From the root page to the
  check").
- The player may be on a phone held upright, a tablet, or a laptop, and on
  a laptop it may be the one on the projector.
- `app.css` is one namespace for every app page (backlog, Housekeeping): a
  new class can pick up an old rule (`.device` is the network check's
  line), so the device screen's names carry a `d` (`dscreen`, `dbar`).

## How the site meets it

Screens and words: `user-flow.md` §3.8. Code: `client/entry-solo.ts` (the
pages), `client/solo.ts` (the run, no DOM), `client/device.ts` (the device
screen), `client/stage.ts` (the question's layout, shared with the wall).

### The entry

On the check, the first card: "You play the quiz on your own, to learn or
review: the solution after each answer." [Play ▶], and under it "Nothing
goes to the site. A reload or closing the tab ends it.", since the reload
is the one way to lose a run that a hand makes without meaning to. It
plays the quiz itself (`plays`), so the fold of questions says that whoever
will play leaves it closed. One press starts it; it takes over the check's
page and pushes a step into the tab's history, so Back from any of Solo's
screens gives the check back as it was, its fold and fixes kept.

### The start

The avatar a room would give (an animal and a colour, assigned) and the
lobby's dressing menu, the same for every room (`class-and-wall.md`,
"Dressing the avatar"), with Start under it. It is the one step between
the check and the first question; what it is for is the observation
above: the avatar that celebrates is the player's own. Alone nothing is
scarce and nothing is spent, so the room's limit on changes doesn't apply.
The look stays for Play again, within the page.

### A question, alone

The run is the game's own (`server/game.ts`): a run with one player, the
check's fixes applied as the server applies them at upload
(`applyFixes`). So a skipped question doesn't come up, a changed solution
is the one that counts, a question not counted shows its key and scores
nothing, a hidden picture stays hidden, and the answers are shuffled per
run unless the quiz says "Order: fixed" (`quiz-format.md`).

- The answers show with the question: nobody reads it aloud first, so
  there is no reading step.
- A tap is the answer, and the key follows at once on the tiles: the
  solution ticked, the rest dimmed, the chosen one outlined, with a cross
  when it doesn't count. Nothing moves (the tiles keep room for the mark
  from the start). The bar at the top says ✓ or ✗, or ⊘ for a question not
  counted, and the score.
- A right answer makes the avatar jump over the question for a few
  seconds, the wall's winners' band with one winner (`class-and-wall.md`,
  "The winners jump").
- The score is right out of the questions that counted, as the ranking
  counts without points for speed; alone there is no speed to compare.
- The next step is at the foot: Question 4, then Result.

### The device screen

`client/device.ts`, `DeviceScreen`: a page's main element taken over by a
bar at the top (where the question stands, a verdict, the player's avatar
and score), the stage, and a bar at the foot with one button.

- **The stage is the wall's** (`client/stage.ts`, `layQuestion`): the
  question, its picture between or beside, picture answers arranged by
  their shapes, laid out in the room the device has. On a laptop, Solo
  therefore shows a question as the projector at that size would.
- **Where a device differs** (`device` option): it is read at arm's
  length and often held upright, and its answers are what is tapped. The
  question takes less of the height than on a wall (0.7 of the wall's
  share), and text tiles that two columns would break or set small stand
  in one column. The tiles are buttons.
- **The foot's button** is the steering bar's Play in another hand: a noun
  for what comes next, in the same place on every question, kept there
  invisible while there is none, so a double tap never lands on something
  new (`question-flow.md`, "The steering bar"). Keys as on the wall: Space,
  Enter, →, ↓, PageDown and N go on; 1 to 4 answer; Z, or a tap on the
  picture, enlarges it, and a tap closes it.
- **Tiles that just appeared take no tap** for `SETTLE_MS` (400 ms): the
  tap was aimed at what was there before, the second of a double on Start
  or Play again, which would otherwise answer the first question
  (`question-flow.md`, "Presses").
- **What it offers a room** (`DeviceView`): the tiles veiled while a
  question is read (`answering: "reading"`), open to a tap, or closed; the
  answer this device chose, and whether it is still on its way to the
  room (`sending`, outlined dashed); the key; the spread (`dist`: a room
  that will show it passes it from the question's start, null until it
  shows, so the tiles keep room for the counts); the avatars that jump
  (`jump`); the foot's noun, and beside it a line of the room's in place
  of the title (`foot`: who it waits for); a ⋯ for the room's menu
  (`menu`). A room drives it from its views as Solo drives it from its
  run; the join code, the ranking and the end are the room's own.
- Light, as the class's screens are; a page of a screen's height has no
  site header.

### The result

The avatar cheering, whatever the score (the closure the final ranking
gives a class); ★ right / of; a bar per question, full or empty. Then Play
again ▶ (a new order, the same avatar), Copy the answers for your AI, and
← Back. The foot's bar is gone there, as Play's place is empty at the final
ranking: a double tap on Result lands on nothing.

### After the run: the player's AI

"Copy the answers for your AI" puts the run on the clipboard as text: the
quiz's title, the score, and for each question played its text (and its
picture's file name), the answer chosen, right or wrong, and the quiz's
solution, asking the AI to explain the ones got wrong and to say if a
solution itself looks wrong. The words are the ones the site's other
messages to an AI use (solution, not key). Where the clipboard is refused,
the text shows on the page to copy by hand. Nothing else is said about a
doubtful solution: the quiz has no notes to say it with.

### Preview and the projector alone

One Solo, without settings, appears to serve both, which is the owner's
lean; neither use is confirmed.

- **The teacher's preview** (v1 item 12, the quiz as the class will see
  it): Solo on the laptop that will show the quiz lays every question out
  as the projector at that window's size would, pictures and fitting
  included; the solutions are the check's fold, without playing. What the
  wall adds (the question read first with its answers veiled, who has
  answered, the spread) isn't the quiz's look.
- **A projector and no student devices** (backlog, Open): Solo on the
  projector shows the question as the wall does; the class answers by hand
  or with coloured cards, and whoever taps puts the key up. Nothing scores
  the class, and the one avatar and its result stand for the room. Whether
  the day's refusal offers it stays the owner's decision.

## Not known

- Whether a tap as the final answer suits learners, or a mis-tap costs too
  much; and whether "I don't know" (the key without answering) is wanted.
- Whether the dressing before the first question is the point for a
  newcomer or a delay; whether a player alone wants to choose the animal,
  which a room assigns so that nothing is grabbed.
- Whether learners copy their answers to their AI, and whether the text is
  enough for it (pictures go only by file name; the AI that made the quiz
  has them).
- Whether a teacher looking for a preview recognises it in "on your own,
  to learn or review"; whether the result's single avatar reads for a
  class at a projector.
- Pull to refresh is asked off while Solo is on (`overscroll-behavior`);
  checked headless in Edge only, not on Android or iOS.
- How much of the question's height a device should give up (0.7) and
  when tiles go to one column (under 1.3 em in two): tuned on the example
  quiz, a quiz of sentence answers and the picture-answer quiz at 360x740
  and 1280x800.
- The wall's layout on a phone wall (the "phone only" variant) is
  unchanged: its tiles stay two by two.
