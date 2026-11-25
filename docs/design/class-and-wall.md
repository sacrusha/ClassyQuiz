# The class and the wall

## Purpose

What the children and the projector are for. The class should be on the big
screen in a way that is fun, exposes nobody and stores nothing about them
(backlog v1 item 5), get closure from a ranking that slow readers can follow
(v1 item 8), and join inside a minute on tablets nobody has set up (v1 item 4).

The wall is also where a teaching moment happens. After a question the class
sees how it answered, with the answer colours and no names, and which answers
count.

The owner's words on the avatars (v2 item 5): "how to make the avatars
interesting to the students without wasting everybody's time or having fights
break out."

## Situation

The product's classroom (shared, school-managed tablets, a laptop on the
projector, the teacher's phone, young and slow readers, a teacher in the room)
is in `backlog.md`, Project. What shapes this file:

- The users are the example class's children, who may not read the site's
  words, or not read at all, so a child's screens use icons and numbers in
  place of labels where they can.
- Tablets are shared and nothing is kept on them beyond the class. Nothing may
  identify a child: no names, no accounts.
- Plausible assumption: reaching the site and typing the code is the slowest
  step, and tablets arrive over about a minute, so the early ones wait in the
  lobby (what the dressing is for, below).
- Colour-blind children are in some classes. A tablet can be switched off
  after one lesson and opened for the next class; a battery can die mid-quiz
  without closing its connection.
- The wall is read from across a room: its avatars are 21 to 36 px in the
  who-answered bar, up to about 100 px when the winners jump. At those sizes
  a child mostly sees the colour and the outline of an avatar; the animal
  barely reads.
- A disruptive child is handled by the teacher walking over (backlog, Project),
  so the teacher gets no moderation beyond Remove.
- The crowd isn't always a class (backlog v5 item 4): a host may run the quiz
  for adults at work, a training room or a team event, on the same screens
  and with the same avatars.

## How the site meets it

### Getting in

- The projector shows the address, the join code and a QR code for
  `/play#<code>`. Typing the address leads to the root page, with the code
  box in its header (`root-page.md`). Without JavaScript
  the box still submits to `/play?c=...`.
- In testing, people who typed the address didn't find that box. Until the first
  avatar, the wall shows where it is: a wordless picture of a tablet's top,
  the address in the browser's field and the site's header (the mark and the
  name) with the class's code in its box, ringed. The address under the QR
  code has the mark before it, so the fox on the wall is the fox in the
  header the tablets open (`identity.md`). Wordless, so it matches the landing page in any
  language and at any width; after the first avatar the class shows each
  other.
  The code is necessary, the QR a convenience. On the wall they share the
  room the lobby leaves under the title and above Start, each on one line,
  sized from that room rather than from the window (`.lobby` in `app.css`).
- A class code is 5 digits (`functions/api/[[path]].ts`). Fewer would make a
  mistyped code likelier to land in another class's quiz; more is slower for
  young children, who scan the code or type it. What bounds a guess instead is
  in `hosting-and-limits.md`.
- No name and no choice. The server assigns an avatar: one of 12 animals in one
  of 8 colours, unique per class (the first dozen players get different
  animals; at a shared device, below, its players share one). The device keeps a player token, so a reload, sleep or dropped
  Wi-Fi resumes the same avatar and score.
- Avatars are SVG (`client/look.ts`), not emoji: emoji look different on an
  Android tablet and a Windows laptop, and a child must recognise "the frog on
  purple" across the room.

### Coming back

- Once the quiz has started, a device without a player sees the avatars of
  players whose devices are away, plus "+". A child whose tablet died taps
  their own avatar and keeps their score. A child could take someone else's;
  the teacher is in the room. A device without a player asks again every 10 s
  (`client/seat.ts`), so a dead tablet's avatar shows up within about a minute.
- A tablet whose avatar another device took back while it was away drops its
  token and offers "+". It does not join by itself: a tablet lying on a desk
  would be a connected phantom that holds up the countdown's early close
  ("everyone present answered"; `question-flow.md`).
- A known player can reconnect after the end, so a reloaded tablet still shows
  its final place.
- "Away" is not heard from for `FRESH_MS` (`server/instance.ts`, 45 s), for a
  WebSocket (clients ping every 20 s, `PING_EVERY` in `client/net.ts`) and for
  a poller alike. A tablet whose battery dies does not close its socket, so
  counting only open sockets kept its avatar "connected" and its child could
  not pick it back.
- The same tablets for the next class. The next class's quiz is its own
  upload with its own code, so a tablet comes to it as a newcomer: the player
  token it holds belongs to the earlier quiz, and the student page drops a
  token of another quiz (`client/play.ts`).

### The door

Purpose: slow tablets in a normal class are never stranded, with no control
for the teacher to find, and a stranger with the code cannot wander into a
quiz under way.

- The cap is `MAX_PLAYERS` (60, removed avatars included), `shared/limits.ts`;
  why 60, and that a larger group is what an own copy is for:
  `hosting-and-limits.md`.
- The door is open in the lobby, for `DOOR_OPEN_MS` (5 minutes) after Start, and
  while the first question is up (its reveal and ranking included),
  `doorOpen` in `server/game.ts`. A teacher who presses Start before handing
  out the tablets waits at the first question, because nobody answers. What
  tells a slow tablet from a stranger is when it comes.
- After that, `MAX_LATE_JOINERS` (5) more get in, then the refusal "This quiz
  has started and takes no more players. Ask whoever runs it." Only those who
  joined once the quiz was under way count towards the 5. A child returning to
  their own avatar is not a new player.
- Remove is sticky: the removed device keeps its token and shows the cross,
  with no "+", also after a reload. The removed avatar still counts towards
  both caps, so removing and rejoining is no way in. A determined child in a
  private window gets back in; the teacher walks over.
- What this gives up: a stranger in the first minutes or during the first
  question gets in, as one in the lobby always could. The avatar then shows on
  the wall.
- Rejected, each failing a plausible class: a cap relative to the class at Start (a
  teacher who starts with 3 of 25 strands 17); a window after the last join (a
  teacher who starts and then fetches the tablet cart strands the class); a
  "let more in" control in the teacher's menu (a teacher in front of a class
  does not know to look).

### Sharing a device

Purpose (backlog, "Fewer devices than people"): a class with fewer devices
than people, each person with a place, an avatar and a score of their own.
The owner: a nice-to-have, and a classroom's problem, so for a Quizmaster
only. Two children on one tablet as one player works without it.

Situation:

- The owner's case is 16 people at 6 iPads, generation unknown: two to a
  device don't seat them, three do.
- A browser makes a click only from a lone touch. With two or three hands
  on the glass, a press is lost while a neighbour's finger is down, and
  two fingers moving pinch the page. Seen in Edge's touch emulation: two
  overlapping touches on two places pressed neither by click; unchecked on
  an iPad.
- Children may try to reroll an avatar they don't like by adding and
  closing places (the owner).
- A place nobody sits at would hold up Last call's early close and stand
  on the wall (Coming back, above).
- The places size themselves by their column, with container units, which
  Safari has from 16. The owner: for a nice-to-have, Safari 16 may be its
  floor.

How the site meets it:

- **The teacher allows it** on the check, under how the screens are
  arranged, and on the Remote's lobby beside Points for speed: the switch
  "Shared devices", what it does always under it, the + included, so the
  teacher can say it to the class (`shareSwitch`, `client/manage.ts`). The
  browser keeps the last choice (`sharing`, `client/dom.ts`), and a quiz
  never set takes it (plausible assumption: a class short of devices is
  short lesson after lesson). Off, no device offers a place; places
  already there stay.
- **A player's device splits** (`client/play.ts`): its place becomes a
  column, with a + along the edge that adds another, up to `MAX_SEATS` (3,
  `shared/limits.ts`). No words: a + and a person. A new column stands at
  the end, beside the +, and keeps its place across a reload. It is a new
  player beside the device's others (`newPlayer` with `beside`), joining
  only when the + is tapped, so no place stands on the wall empty. Under
  way it offers the avatars whose devices are away, scrolling when they
  don't fit the column, as any device without a player does. The door and
  the class's caps are any device's.
- **A × closes a place** while the device keeps a player in another, so
  closing places neither leaves it without one nor rerolls its animal; not
  at the final
  ranking, where a place only shows how its player did. Before the start
  its player is gone and the avatar free; after it the player keeps their
  score and is away at once, not after `FRESH_MS`, to be picked back
  (`leaveSeat`, `server/game.ts`).
- **One animal per device**, each place in its own colour: the same animal
  as the device's other players, so adding and closing places rerolls no
  animal; the colour from a family the device doesn't wear yet (yellow;
  blue, navy and purple; red and pink; teal and green), the first free in a
  fixed order, so a place closed and added again comes back with the avatar
  it had, and three players of one animal stay apart for most colour-blind
  eyes (`seatAvatar`). On the wall a shared device reads as one animal in
  up to three colours; the first dozen devices, not players, differ by
  animal.
- **Each place has its own line** and keeps its player under its own key
  (`seatKey`, `client/dom.ts`; `client/seat.ts`), so a reload brings every
  place back. The page's dot and offline banner show the worst of its
  lines; its places sleep and wake together (`connections.md`, "Devices
  left on").
- **Every finger presses for itself** while the page is split
  (`client/tap.ts`): a finger's lift inside a button presses it, and the
  click that may follow is dropped page-wide, since closing a place moves
  another under the finger. The split page doesn't pinch, scroll or call up
  a menu. A device of its own presses by click as before.
- **Sizes follow the column** (`.seats` in `app.css`): the dressing stacks
  and text answers stand one under the other in a column taller than wide.
  A browser without container units (Safari before 16) offers no + and
  plays one place.

### What each screen shows

- **Answers** carry colour plus shape (red triangle, blue diamond, yellow
  circle, green square) so colour-blind children can tell them apart.
- **Student device.** Lobby: its own avatar and the dressing menu. Question:
  the buttons, which also show the answer text, so a child who reads but
  cannot see the back of the room has it close up; a slow reader hears the
  teacher read from the projector. Reveal: a check or a cross, grey when void
  or unanswered. Ranking: avatar, place and points. The page redraws only when
  its own view changes, so a tap is never lost to a redraw while the class
  answers.
- **Projector.** Question: the question at the largest size that fits, the
  answer tiles, who has answered. Reveal: answers that do not count dimmed,
  each with its count. Ranking: places 1 to 3 (at most ten avatars; ties share
  a place) and the class's result as a percentage with one bar per question
  (`ranking()` in `server/instance.ts`), each on a track of the full height,
  so a low share reads as low, not as a speck. This is the closure for the whole
  class, whoever could not follow the questions. The final ranking has its own
  screen (below).
- **Teacher.** Live answer counts, the players (faded when away) and the fixes;
  the rest is in `teacher-devices.md` and `question-flow.md`.
- **Screens stay on.** The projector, teacher and student pages request a
  screen wake lock where the browser allows it (`client/dom.ts`).

### How a question fills the screen

Purpose (the owner): space used well, a layout that doesn't surprise, and
rules simple enough that the AI building a quiz can be told them, at least
approximately, and shape its questions, answers and pictures to fit.

Situation: a question is read on a 16:9 or 4:3 projector, on laptops and
tablets either way round, and on phones held upright. What runs short
differs. On the big screen a question without a picture fits at its full
size with room to spare; on a phone a long question competes with its
answers for the height; with a picture all three compete, and where the
picture goes decides what room the text has.

How the site meets it (`layQuestion`, `client/stage.ts`, for text answers):

- Each part has a full size: the question's type by its length (smaller
  with a picture), the answers' by the longest answer (the sizes are on
  `/layout`), the picture as large as its place allows: between the
  question and the tiles, the full width and at most 62% of the height;
  beside them, 58% or half the width.
- The layouts tried are the tiles in two columns or one and, with a
  picture, the picture between the question and the tiles or beside both
  (the picture left, the question and the tiles in one column).
- In each layout, what doesn't fit at full size shrinks alike: the
  question, the answers and, between, the picture, by the same share of
  their full size. Beside, the picture keeps its size and the text shrinks
  in its column, since the picture doesn't take the text's height there.
- The layout whose most-shrunk part stays largest is taken, the picture
  measured against the largest any layout gives it; of layouts within 0.03
  of it, the more familiar one: two columns first, then a picture beside,
  then one column. The parts shrink to 0.3 of their full size at most, the question
  to 1.1em and the answers to 1em; where no layout fits, words break, and
  the layout that overruns least is taken.
- What comes of it, and what the guidance tells the AI: on a landscape
  screen square and upright pictures go beside the question and its
  answers, on a 16:9 screen most photos too, and wide figures such as
  number lines go between; text answers stand two by two. On an upright
  tablet a picture goes between and the answers stand two by two; on a
  phone the picture goes between and the answers mostly one under the
  other. A long question or long answers make every part somewhat smaller
  rather than one part small.
- Questions with picture answers keep their own arrangement, by the
  pictures' shape (`pictures.md`, "The projector").
- The tiles' rows have the same height whatever their text
  (`grid-auto-rows: 1fr`), so the rows don't move when a tile's content
  changes (below).

### Tiles do not move at the reveal

At the reveal the right answer gains a check mark and a count. The text must
not move for it: a number like "1 000 000" once wrapped and the tile grew,
costing the teaching moment its steadiness.

- Every tile reserves the room for the mark and count from the start of the
  question; the reveal fills it.
- The tiles' type is set once per question and window by the layout
  (above), so that no word is cut and no answer overflows; a word breaks only
  where no layout fits. The rows are of equal height, so a mark doesn't
  change them.
- Digit groups such as "1 000 000" stay on one line wherever answers and
  questions are shown, even when written with ordinary spaces
  (`client/dom.ts`). A false match only prevents a line break. The parser keeps
  non-breaking spaces.
- A number stays with a short word after it ("50 Franken", "3 cm", up to ten
  letters): broken after the number, a tile's first line is the number alone
  and reads as the whole answer. The tile then fits a little smaller.

### Who has answered

Purpose (v2 item 7): a child wonders whether the tap counted; a mark as its
answer lands answers that from the projector.

- Only answered avatars appear, popping into the wall's top bar in arrival
  order. There are no placeholders: nobody is shown as missing, so it exposes
  nobody. The mark says an answer arrived, never which: no answer colour, and a
  change of mind changes nothing.
- Beside the avatars, "answered / of"; when everyone there is in, the count
  turns green (`.all`). Who "of" counts, how the wall keeps it current, and
  the Remote's "Waiting for" are in `question-flow.md`, "Who has answered".
- Nothing moves. The bar (`#qbar`, `public/app.css`) has a fixed height, 1.9em
  (about 6.5% of a 720 px wall). The avatars are sized when the question opens
  so the whole class fits, in one row or more, and do not shrink as answers
  come in. The count appearing and the key change nothing below.

### Dressing the avatar

Purpose (v2 item 5): an avatar does two jobs: it tells children apart, and it
belongs to a child. Random assignment does the first with no fights, since
nothing can be grabbed and nobody chose the frog. The second is given to the
child by dressing the animal in the lobby.

Purpose (v5 item 4; the owner, 2026-11-08): the avatars let a wider
audience use the site, a business or training room among them. The owner's
direction for it: the animals stay; expanding on the top hat is businessy
enough; pulling the pickable tools back in (laptop, chart, calculator, …)
might be one approach. The top hat is also the site's mark: the fox in a top
hat is what makes it classy (`identity.md`).

Why this shape:

- Fights come from something scarce that another child holds or could get, and
  from goods that are not equal. The identity (animal and colour) therefore
  stays assigned. The menu is the same for everybody, any number of children
  can wear the crown, and nothing is earned. Earned or rare items would show
  performance on the wall or breed envy, against "exposes nobody".
- Dressing fills the lobby wait. No tap stands between the code and being on
  the wall: the child is on the wall first, and the last to arrive plays plain,
  like everyone otherwise.
- The wall acts as a mirror. What a child taps shows on the wall about a second
  later with a wiggle, which also teaches the child where they are on the wall.
- A shape changes the outline, the cue that survives at 26 px on the
  who-answered bar. A child who knows "purple star" searches among the purple
  stars. Hats add a coloured blob.
- A plain start, not a random outfit: nobody is shown in something they did not
  pick.
- No words on the menu, and no new control for the teacher. Start ends the
  dressing, after a time every screen shows (below, "The end of the
  dressing"). Late joiners get no menu and play plain.
- The wider audience is served by each adult's own look, from the same
  menu: one who finds an animal on a disc out of place at work dresses it
  into something that fits. Plausible assumption, unseen with either
  audience: an adult at work finds a fitting look in the menu, and children
  don't find the office's things dull.
- Two registers for adults sit beside the children's. The dapper one is
  the implementer's reading of the owner's "expanding on the top hat": the
  bowler and the bow tie. The office's is the owner's examples, the laptop,
  the chart and the calculator, with the implementer's coffee, briefcase and
  book. Each is in the menu because it survives the bar's sizes on the
  wall's paper (figure, below).
- Tools for the children themselves, the students' own wish (backlog v4
  item 9), are not these: the office's things serve the adults. That
  register is still open.

What it is (`shared/looks.ts`, `client/look.ts`):

- Six shapes in the player's own colour (circle, which is the default,
  hexagon, star, heart, flower, pond; `BACKGROUND_COUNT`), nine hats (crown,
  top hat, cap, wizard hat, party hat, flower, beanie, viking helmet,
  bowler; `HAT_COUNT` is 10 with "none") and seven things held, worn or set
  before the animal, called the tools in the code (laptop, chart,
  calculator, coffee, briefcase, book, bow tie; `TOOL_COUNT` is 8 with
  "none"), a row each in the picker. Tapping a shape puts the animal on it;
  tapping a hat or a thing puts it on; tapping the worn one takes it off.
  One hat and one thing from the third row at a time, so the bow tie and the
  laptop don't go together. Figure `../avatars/tools.png`: every animal with
  a thing from the row, with the top hat or the bowler, and with the top hat
  and the bow tie, at 80 px; a class of 25 at the bar's 26 and 34 px on the
  wall's paper; the Remote's list of players at 44 px, light and dark.
- Rejected shapes: rhombus, square and triangle, because the answer marks are
  a red triangle, blue diamond, yellow circle and green square, and the bar
  must never read as an answer's colour. A cloud reads as a disc at 26 px.
- The third row's things are solid blobs: the animals are heads without
  paws, and at 21 to 34 px a thin tool (a staff, a shovel, a wand) is 1 to 2
  px wide and gone, while a blob shows as a patch, as a hat does on top.
  Things held sit at the same place on every animal, low on the right, over
  the cheek and past the disc's edge, so they change the outline there; they
  measure 0.30 to 0.36 of the avatar across and 0.31 to 0.42 high (the
  coffee's steam the tallest). Where they pass the disc's edge they are
  dark, brown or the site's rust: white there is lost on the wall's paper at
  26 px. The bow tie
  sits under each animal's chin, 0.31 across, black with a faint white edge
  so it shows on a dark disc. The laptop stands before the animal, seen from
  its lid, low in the middle and below every mouth, 0.46 across: held low on
  the right, at 44 px on the Remote's list of players, a laptop sits where
  apps put a status badge and reads as the device the player is on.
- Their colours are greys, black, brown, white and the site's rust, with a
  pale green calculator screen and a pale label on the book; none is an
  answer's colour, and so none an answer's colour in an answer's shape.
- Not in the menu: a monocle, the dapper register's third piece. From 34 px
  it reads as a monocle; at 21 to 26 px it is a grey smudge over one eye, a
  flaw in the drawing rather than a smaller monocle. A necktie is a thin line
  at 26 px.
- The look is stored with the player as `b`, `h` and `t` beside the animal and
  colour (`Avatar`); absent means the default. The command `dress` sets the
  look whole, so a resend changes nothing; a page from before the tools sends
  no `t`, which means none. It is accepted only in the lobby,
  only for what the menu has, never for a removed avatar, and at most
  `MAX_LOOK_CHANGES` (100) changes per player, after which the pictures stop
  responding (what the cap is for: `open-period-in-memory.md`, "Caps, taps
  and alarms"). The
  animal and colour are never touched.
- On a tablet the nine hats stay on one line: each picture is 60 px, or as
  little as 46 where the picker is narrower (53 px on a 1024 px tablet held
  sideways). Where the picker cannot hold them on one line they break into
  halves (five and four), never a full line and a stray one, and the tools
  (seven) are one line down to a 360 px phone: there every picture is 41 px,
  so the menu is four lines and Start stays on the first screen of a 360 by
  640 phone. At 320 px the tools break four and three, and the menu and the
  avatar still fit a 320 by 568 screen without scrolling (`.dress` in
  `app.css`, by the picker's own width).
- The server holds the class's looks in memory, sends the screens the
  looks changed at most once per `LOOK_SHOW_MS` (1 s), and writes them when
  the first question comes (`open-period-in-memory.md`), so the cost of a
  class is the same whatever the children do.
- The tablet shows the pick at once and keeps showing it until its view shows
  it back. One `dress` is in flight at a time, at most every `INPUT_GAP_MS`,
  and the latest pick is sent next, so a burst of taps sends the first and
  the last (`client/latest.ts`).
- The lobby rows on the wall (class and self-steering) and on the Remote are
  kept in place (`syncAvatars`, `client/look.ts`): newcomers pop in, a changed
  look wiggles, nothing else is replaced. Redrawing a lobby while a class
  dresses would redraw the Start button several times a second while the
  teacher reaches for it. The rows clip their overflow, so the wiggle (12%
  larger, turned 8 degrees) and a newcomer's pop have a margin of 15% of an
  avatar inside the clip.
- Every animal takes every shape and hat. A hat has a seat per animal (brim
  centre, width, growth). The frog's eyes sit at the sides and its head is a
  dome so a hat sits on top; the penguin's hats are smaller; the lion's mane
  is drawn small (radius about 32, against the 24 to 32 of the other heads) so
  a shape shows behind it as behind the others. Figure
  `../avatars/lion-before-after.png`: the lion before and after beside the
  frog, at the lobby's size and the bar's.

#### The end of the dressing

Purpose (the owner, after his user test of Peers): whoever is dressing
sees the end coming, and whoever starts has a way to bring the dressing to
a close, with the least surprise for the people on each screen.

Situation:

- In that test Start ended a friend's dressing at once, under their
  fingers. A Quizmaster meets the mirror of it: a class that won't stop
  dressing, and no way through it that isn't a cut-off.
- A ready per player was set aside (the owner): some people confuse Ready
  and Start even where only one of them exists; a class of 25 with
  non-readers can't be waited on; and the wall shows nobody as missing
  (Who has answered).
- Who reads: the one who starts does, the teacher or a Peers room's
  opener; friends on their phones mostly do; children on a class's
  tablets may not, and in a class the teacher is in the room and says
  what comes.

How the site meets it: Start gives the dressing `START_MS` (10 s,
`shared/tempo.ts`) more, then the first question comes (`startSoon`,
`startOut` in `server/game.ts`; the instance's alarm takes the step, so a
restart in between still begins on time). The press lets the class in, as
Start always did; until the end the lobby stays as it was: the menu works,
a newcomer joins and gets it.

- **Every screen shows the time the same way**: Countdown's bar
  (`question-flow.md`, "The steering bar") along the top edge, draining
  with no digits, its last fifth warm, on the wall, the Remote, each
  tablet and each phone (`edgeBar`, `client/clock.ts`). Over everything,
  so nothing in the menu moves under a finger. When it is empty, the menu
  gives way to the question, as answering closes when Countdown's bar is
  empty.
- **Start says what its press does**, in the small line under its label
  that a step has where its consequence isn't in the label: "in 10 s"
  (`startButton`, `client/steps.ts`). Once pressed it is greyed on every
  screen that has it, as Countdown is while it runs, and a second press
  changes nothing.
- **In a Peers room**, the friends' line beside the opener's avatar turns
  from "starts the quiz once everyone is in." to "starts the quiz in a
  moment." (`peers.md`, "The lobby").
- What carries it to a child who doesn't read is the bar, the same on the
  wall in front of the class and on the tablet in hand, and the teacher's
  voice. On a question the bar was barely noticed without the quizmaster
  announcing it (`question-flow.md`, Situation), so in a class the
  teacher's voice is what this rests on, and in a Peers room the opener's.
- There is no way to start at once once pressed, and none to take a Start
  back: the ten seconds are the dressing's, and the starter read them
  under the button.

### The winners jump

Purpose (v4 item 9, the students' own wish): winners only, after every
question, jumping; ten easily told apart, crowding accepted beyond.

- After every reveal, the avatars of everyone whose answer counts jump on the
  wall for about four seconds (`PARTY_MS`, `client/stage.ts`); then the band
  fades. It is a band over the top of the stage where the question was read,
  stopping above the first tile, so the tick and the counts stay in view: the
  key is the teaching moment. It is a layer, so nothing moves.
- Up to ten are side by side and apart, as large as the band allows (the band
  at most three tenths of the stage, never past the first tile): 104 px on a
  1366 px wall. More than ten get smaller, to two thirds of ten's size, then
  overlap. On a narrow wall they stand in two rows. The band is as high
  whatever the count (`partySize`, `client/look.ts`).
- Where a short question stands beside its picture, or pictures are the
  answers, the tiles start 80 to 95 px below the stage's top and ten come out
  at 47 to 56 px.
- Order is the lobby's, so the first in the row is not the fastest. Each pops
  in and jumps five times, starts scattered over half a second so neighbours
  are out of step and ten side by side read as ten. With reduced motion asked
  for, they stand still for the same time.
- Once per key. A view that comes again (the 15 s tick, a reconnect, the Remote
  coming or going) does not restart it. A fix of the key during the reveal
  starts it again for the new winners. A void question or nobody right: no
  band. The next step, an enlarged picture or a resized window ends it.
- The data is `RevealView.winners` on the wall's view only (`G.winners`: whose
  stored answer counts under the current fix; never a removed avatar; nobody on
  a void). The tablets already show a check or a cross.
- The band shows who was right, and so by absence who was not. This takes the
  who-answered bar's "nobody missing" one step further; the owner decided that
  winners jump after every reveal, also when most of the class got it right,
  and that they are then hard to make out is accepted. Nothing else shows it.

### The final ranking

The end of the lesson's quiz, and its closure: it should feel like a
celebration of the class, not like the intermediate ranking with a trophy
added, and some teachers want to photograph it. So it has its own screen
(`client/final.ts`):

- Places 1 to 3 on a podium, the first step highest; ties share a step and
  shrink to fit it (the same top as the intermediate ranking: at most ten
  avatars), each step with its points.
- Everyone else stands in front of the podium as a crowd, not a grid (owner:
  "a South Park crowd"; `crowdPlaces` in `client/look.ts`): overlapping
  rows, the back ones higher and a little smaller, each row shifted against
  the next, every avatar a little off its place and size, the same on every
  view. Unordered, because below the podium a rank would expose the last
  places (owner); neighbours in the lobby's order go to different rows.
- The sizes follow the room and the class (`finalSize` in `client/look.ts`,
  measured on every view and resize): the crowd as large as its rows allow
  while the first place stays half again as large, the podium in the height
  the crowd leaves. A small class gets a large podium and large avatars in
  front; 60 still fit in rows of smaller ones, with a smaller podium.
- All of them jump, one jump and a rest each, out of step with their
  neighbours (`@keyframes cheer`, after the winners' jump); still for
  reduced motion.
- The class's result, percentage and bars, stays beside it, smaller: it is
  part of the photograph (owner).
- It stays until the teacher's Exit (`question-flow.md`, "The steering bar"),
  which sends every screen to the root page. A teacher whose tab closed before
  Exit gets it back with the resume card or the teacher code
  (`root-page.md`, "Coming back"). The tablets show their place, stars and
  a trophy until then.

## Not known

- A shared device in real hands, on a real iPad: palm rejection, whether a
  resting hand presses a button in its own place, the four- and
  five-finger gestures that leave Safari (on by default, Settings,
  Multitasking & Gestures); the columns judged headless only, three at
  768 × 1024, 1024 × 768 and 1180 × 820; whether three side by side at one
  9.7" iPad works, and an upright iPad's columns of 256 px; whether pupils
  misuse adding and closing places (user testing, the owner); whether
  neighbours copying each other's tile matters in a practice quiz; whether
  a teacher says what the + does.
- Whether children dress at all, and whether teachers wait for it; whether the
  shapes help a child find their avatar from the back row.
- Whether Start's time is seen where nobody announces it: a child or a
  friend looking at the picker, with the bar 16 px high at the top edge;
  whether ten seconds is enough for a class and not too
  long for friends who are done; whether a starter wants "now" or a way
  back, or digits for the last seconds would carry better to non-readers.
- Whether ten at 104 px read from the back row, and twenty as a crowd; whether
  four seconds is long enough for a child to find themselves and short enough
  for the teacher; how children take being seen not jumping; how the
  projector's colours treat the band's veil.
- Whether 47 to 56 px is enough for ten winners beside a picture, or the band
  should go elsewhere there.
- The final ranking on a real projector and in a photograph: whether a class
  jumping without end is festive or restless, whether a child
  in the back rows still finds their avatar half behind another, and whether it is seen on screens under 500 px
  wide (checked at 600 px and wider only); whether a class of 40 to 60 should
  also stand under the class's result, where the width is unused, so its
  avatars and the podium stay larger.
- Whether the students' buttons need the answer text, or heads stay down.
- Whether the layout's shares read right on a real projector and to a
  class: 0.03 for the familiar layout, 0.3 as the floor, 58% and half for a
  picture beside; judged headless on the space quiz, drawn number lines and
  sentence answers, from 1920x1080 to a 360x740 phone. Whether answers
  changing between one column and two from question to question on a phone
  surprise anyone.
- Whether adults at work dress at all, and whether the dapper and the
  office's registers give them a look that fits; whether a training room
  of undressed animals keeps anyone from using the site; whether children take to the office's things, and read the laptop
  seen from its lid as a laptop; whether a thing from the third row at the
  bar's 26 px helps a child find their avatar or only crowds it.
