# Playing the quiz, redefined — working note

An exploration, 2026-11-08, owner and assistant, behind backlog v5. The
backlog holds the problems and the owner's decisions; this note holds the
options that were weighed and what each looked like it would cost, so that
whoever picks a v5 item doesn't start from zero. Nothing here is decided
unless the backlog says so, and nothing here binds a design: where an item's
design finds a better way, this note is what it corrects.

## How the discussion arrived at use cases

It began as a build/run split (make quizzes with any AI; run them in several
ways) and ended with use cases, because people pick a situation they
recognise, not a capability. Along the way several apparent choices turned
out to be values of fewer axes:

- **Who advances the question**: a hand (the quizmaster, built), a clock
  (auto-play, Later's "Runs by itself", stalled on cadence design), everyone
  ready (the question closes when all present have answered, the key shows,
  the next comes when all have tapped Next), each their own (a race). "Game
  mode" and "quizmaster or auto-play" were both this axis; race is its last
  value, not a mode beside it. "Competitive" didn't separate anything, since
  a quizmaster quiz already has points, speed and a ranking; "race" did.
- **Where the question is read**: on a wall, or on each device. A big screen
  is a device role someone takes, not a setting to design; what it decides
  is where the question is read. A video call that shares a window has a big
  screen.
- **Audience**: the words (teacher/host, students/players/teams) and the
  avatar set.
- **Keys**: whether the host sees them (the asker who plays must not), and
  whether a player sees the key after each answer or at the end.
- **Scoring**: right of N, ranking, speed, teams.

A use case bundles defaults over these axes; the settings stay adjustable.
Two entries that bundle the same thing differently are one implementation.
Same time, different places (a call) is "no wall"; different times (each at
home when they like) is a store, out under the lifetime as decided.

## By backlog item

### 1. Looking or playing alone shouldn't cost a class

The browser already unzips (`client/unzip.ts`, the browser's own
DecompressionStream) and parses with the one parser the server also uses
(`quiz/format.ts`); `client/images.ts` reads the pictures. So the check's
content — title, count, pictures, the question list with its fixes — can be
built before any upload, and the entry choice (Solo | Peers | Quizmaster)
could sit on that check. "Open the lobby" would be the upload, carrying
whatever was set; the teacher code, the booking at let-in and the room's rules
would follow unchanged, later in the sequence. The server's re-parse on upload
stays: the client isn't trusted. Side effect: the example page's "Start the
example quiz" could land on the local check, so a visitor who only looks
costs nothing — most of v4 item 13 without a special path.

### 2. Solo

Could be static: a page that reads the zip and plays it, no server, nothing
counted, nothing to resume (the owner: closing the tab ending it is fine and
expected). The avatar picker and the celebration would stay (observed:
preteens excited by the jumping avatar). For learning, the key after each
answer; the score against the quiz, since nothing is kept between runs.
"Editable" was read as the quiz itself — fix a key, reword a question, save
the file — which would give Later's "corrected quiz downloadable" its first
home and send the file back to the AI; the owner hasn't confirmed that
reading. Alone, a wrong key has nowhere to be disputed; the learner's AI
after the run is the one place it can go, which is what ties editing to
blindness (item 5). Preview (v1 item 12) could be Solo with the key on demand
in the wall's layout, and the same could serve a class with a projector and
no devices, answering by hand; what would separate preview from Solo, if
anything, is layout and when the key shows, not a runner. The owner finds
the split unclear.

### 3. Peers

Quizmaster with the host as a participant and no hand on the advance. The
advance rule that needs no cadence design is everyone-ready (above); the
plausible assumption under it is that a few friends wait for each other.
Someone still has to End, fix keys at the end and Remove; the host from a
participant's screen is the obvious holder. The screen choice (item 6)
applies unchanged: a family at the TV is Peers with a screen and nobody
steering.

### 4. Quizmaster

The owner's sequence: the Quizmaster choice first, then how the screens are
arranged, as a toggle with an explanation, and the remote's manual only
where a remote is wanted. Three arrangements were seen: screen + remote
(built; today's default and the reason the check explains the teacher code at
all), screen only (built: the projector page steers itself, keyboard or
clicker, `design/question-flow.md`), devices only (new; needs item 6's
screen; the join code would have to be on the host's device, there being no
wall). A video call isn't a fourth value: its shared window is the big
screen, and the explanation can say so.

Settings would sit collapsed under the entry's defaults. The avatar set:
none for now, one menu for every room with a business register in it
(`design/class-and-wall.md`, "Dressing the avatar"); a set per upload,
defaulted by the entry, is the fallback named in the backlog's Open list.
Auto-play for a quizmaster: which flavour is open;
the plausible assumption that 25 children can't be waited on to all tap Next
points at the clock or the race rather than everyone-ready.

### 5. The asker who plays

Three places leak the questions today: the AI shows its draft in the
conversation (the example does), the check screen lists the questions with
their keys, and `/layout` renders a quiz. What was seen as needed: the
guidance telling the AI to keep questions and keys out of the chat when the
asker will play, reporting instead what it can (count, topics, difficulty,
pictures) and handing over the zip — not obvious to an AI, so it would have
to be on the page; an "I play too" switch on the check that hides the list;
and the key check moving to where it can go — the group's dispute-and-fix,
which is built, or alone the learner's AI after the run (item 2's editing).
The alternative, an explanation line in the format, reopens
`design/quiz-format.md`'s ruling that the quiz carries no notes.

The politician quiz ("guess what they voted on this bill") is the purest
demonstration — nobody in the room picked the questions, so the quiz is
nobody's agenda — and the worst landing example: its keys depend on the AI's
sourcing (a free tier without web will invent votes), and it is politics on a
page a school's IT reads during a data-protection review. A YouTube channel's
transcripts or a football club's last three seasons are safe for the landing,
with the usual caveat: they need an AI that can fetch, so a paid-tier example,
one real run, tier and date on the line under it.

### 6. The room's screens

One new screen serves every new case at once: question, picture and tiles on
the player's own device, then the spread and the key. It is needed wherever
there is no wall (a table, a call), and by every self-paced player (race,
solo, preview, a test). Without a wall, the spread, key, ranking and
celebration land on each device (the same exposure as the wall), and the
join code has only the host's device to be shown on. Today's split rests on
`design/question-flow.md`'s plausible assumption that the teacher reads aloud
while the class looks at the projector. The guidance describes the wall and
the back row; whether it should say where a quiz will be read is open.

### 7. Nobody has to steer

The flavours are under "who advances" above. Everyone-ready costs no cadence
design and suits a small group; the clock is Later's design item with its
cadence still owed and suits a class whose hands-free teacher wants a shared
moment; the race suits a class that wants throughput. Race may lower
"Runs by itself" in priority, since it serves the hands-elsewhere situation
without a cadence, but the two differ in purpose (shared moment vs.
throughput), so neither replaces the other.

### 8. Players at their own pace

What a race would need that nothing built has: the device screen (item 6);
the wall, if there is one, as the field — the classroom's exposure rule
(`design/class-and-wall.md`, winners only) would make the front of the field
and how many have finished the default and the tail a setting for crowds
that enjoy it, the owner's call; the key after each answer (learning; fast
players will shout keys) or at the end (competition, test); fixes at the end,
there being no shared moment to dispute at, with the points recomputed;
correctness first, speed as finishing order or total time, since the 20 s
speed points assume a shared start per question; a progress index per player
on the server, surviving a dropped phone, and the key returned per answer
rather than at a reveal. Rows are answers, as today, so the booking is
unchanged. Tiles could be shuffled per device, no wall colours having to
match, so neighbours can't copy by colour. A team on one phone works
unchanged. A test is race-shaped: keys withheld to the end, a time, no
celebration, results export (Later).

### 9. The words

The landing's "Run a quiz" would lead to the entry choice; the README's
"Quizzes for classes" and the lede's "live classroom quizzes" would give way
to the entries; the guidance would describe the entries and their rooms so
the AI specializes (reading distance, question length, count, whether to keep
the questions out of the chat); the example asks would become one per entry,
each after a real run, tier and date under it. "Host" was the candidate for
where "teacher" stands today (it covers pub and class; Solo has nobody); the
owner wants that decided once, with the queued localization in view. Names
weighed for the shared things, should a user ever need them: "room" (the
docs' word, short, abstract), "on the big screen" (recognisable, long),
"live" (Kahoot's, says tempo not situation); for the solo thing "by
yourself" or "play it yourself" (covers preview). The name classyQuiz
survives the widening: it works on "class" and "classy".

## A concern raised, not ruled

No real class has run the built product. Two half-built entries would read
worse than one finished one with a clear statement of what is coming; the
words can change with each delivery (item 9), so the landing never promises
what isn't built.
