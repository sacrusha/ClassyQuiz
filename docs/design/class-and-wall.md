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

- Children are the users and may not read English, or at all. Everything a
  child sees or does is a picture, a colour, a shape or a number. Labels are
  icons and numbers wherever possible.
- Tablets are shared and nothing is kept on them beyond the class. Nothing may
  identify a child: no names, no accounts.
- Reaching the site and typing the code is the slowest step, and tablets
  arrive over about a minute. The early ones wait in the lobby.
- Colour-blind children are in some classes. A tablet can be switched off
  after one lesson and opened for the next class; a battery can die mid-quiz
  without closing its connection.
- The wall is read from across a room: its avatars are 21 to 36 px in the
  who-answered bar, up to about 100 px when the winners jump. At those sizes
  a child mostly sees the colour and the outline of an avatar; the animal
  barely reads.
- A disruptive child is handled by the teacher walking over (backlog, Project).
  The design offers the teacher no moderation beyond Remove.

## How the site meets it

Screens, their wording and their layout are in `../user-flow.md` (§3.3 the
lobby, §3.4 the projector, §3.5 the Remote, §3.6 the student). This section says what each
audience sees and why.

### Getting in

- The projector shows the address, the join code and a QR code for
  `/play#<code>`. Typing the address leads to the landing page, the teachers'
  page, with the code box in its header (`root-page.md`). Without JavaScript
  the box still submits to `/play?c=...`.
- First users who typed the address didn't find that box. Until the first
  avatar, the wall shows where it is: a wordless picture of a tablet's top,
  the address in the browser's field and the site's header with the class's
  code in its box, ringed. Wordless, so it matches the landing page in any
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
  animals). The device keeps a player token, so a reload, sleep or dropped
  Wi-Fi resumes the same avatar and score.
- Avatars are SVG (`client/look.ts`), not emoji: emoji look different on an
  Android tablet and a Windows laptop, and a child must recognise "the frog on
  purple" across the room.
- The teacher does not see which child is which. This fits "grading unlikely"
  (v1 item 5).

### Coming back

- Once the quiz has started, a device without a player sees the avatars of
  players whose devices are away, plus "+". A child whose tablet died taps
  their own avatar and keeps their score. A child could take someone else's;
  the teacher is in the room. A device without a player asks again every 10 s
  (`client/play.ts`), so a dead tablet's avatar shows up within about a minute.
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
- The same tablets for the next class. A tablet switched off after one class
  holds that class's player token. A page opened anew with an earlier class's
  token is a newcomer and joins at once (the player's auth carries `fresh`,
  `shared/protocol.ts`). A page still showing the earlier class (left on at its
  final ranking, offline when "Again" came) is told "This quiz has finished",
  so a leftover screen does not slip into the next lobby. Without this the next
  class met a refusal on most tablets.

### The door

Purpose: slow tablets in a normal class are never stranded, with no control
for the teacher to find, and a stranger with the code cannot wander into a
quiz under way.

- The cap is `MAX_PLAYERS` (60, removed avatars included), `shared/limits.ts`.
  The design target is about 25; more is what an own copy is for.
- The door is open in the lobby, for `DOOR_OPEN_MS` (5 minutes) after Start, and
  while the first question is up (its reveal and ranking included),
  `doorOpen` in `server/game.ts`. A teacher who presses Start before handing
  out the tablets waits at the first question, because nobody answers. What
  tells a slow tablet from a stranger is when it comes.
- After that, `MAX_LATE_JOINERS` (5) more get in, then the refusal "This quiz
  has started and takes no more players. Ask your teacher." Only those who
  joined once the quiz was under way count towards the 5. A child returning to
  their own avatar is not a new player.
- Remove is sticky: the removed device keeps its token and shows the cross,
  with no "+", also after a reload. The removed avatar still counts towards
  both caps, so removing and rejoining is no way in. A determined child in a
  private window gets back in; the teacher walks over.
- What this gives up: a stranger in the first minutes or during the first
  question gets in, as one in the lobby always could. The avatar then shows on
  the wall.
- Rejected, each failing a real class: a cap relative to the class at Start (a
  teacher who starts with 3 of 25 strands 17); a window after the last join (a
  teacher who starts and then fetches the tablet cart strands the class); a
  "let more in" control in the teacher's menu (a teacher in front of a class
  does not know to look).

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
  class, whoever could not follow the questions.
- **Teacher.** Live answer counts, the players (faded when away) and the fixes;
  the rest is in `teacher-devices.md` and `question-flow.md`.
- **Screens stay on.** The projector, teacher and student pages request a
  screen wake lock where the browser allows it (`client/dom.ts`).

### Tiles do not move at the reveal

At the reveal the right answer gains a check mark and a count. The text must
not move for it: a number like "1 000 000" once wrapped and the tile grew,
costing the teaching moment its steadiness.

- Every tile reserves the room for the mark and count from the start of the
  question; the reveal fills it.
- The tile font starts at the size the longest answer gives, then shrinks until
  no word is cut and no answer overflows, as the question text already fits.
  Only at the smallest size does a word break.
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
  dressing. Late joiners get no menu and play plain.

What it is (`shared/looks.ts`, `client/look.ts`):

- Six shapes in the child's own colour (circle, which is the default, hexagon,
  star, heart, flower, pond; `BACKGROUND_COUNT`) and eight hats (crown, top hat,
  cap, wizard hat, party hat, flower, beanie, viking helmet; `HAT_COUNT` is 9
  with "none"). Tapping a shape puts the animal on it; tapping a hat puts it
  on; tapping the worn hat takes it off. One hat at a time.
- Rejected shapes: rhombus, square and triangle, because the answer marks are
  a red triangle, blue diamond, yellow circle and green square, and the bar
  must never read as an answer's colour. A cloud reads as a disc at 26 px.
  Tools held beside the animal are not built: the animals are heads without
  paws, and at 21 to 34 px a staff or shovel is 1 to 2 px wide. The balloon and
  lantern would survive as blobs. Tools remain the owner's call (v4 item 9).
- The look is stored with the player as `b` and `h` beside the animal and
  colour (`Avatar`); absent means the default. The command `dress` sets the
  look whole, so a resend changes nothing. It is accepted only in the lobby,
  only for what the menu has, never for a removed avatar, and at most
  `MAX_LOOK_CHANGES` (30) changes per child, after which the pictures stop
  responding. The animal and colour are never touched. The cap stops a child
  who hammers the pictures from spending the site's daily allowance
  (`hosting-and-limits.md`).
- The server writes the class's looks at most once per `LOOK_WRITE_MS` (1 s);
  views go out after the write, so nothing shows that is not stored. Each
  stored change is two rows, so the cost of a class is bounded whatever the
  children do.
- The tablet shows the pick at once and keeps showing it until its view shows
  it back. One `dress` is in flight at a time, and the latest pick is sent
  next, so a burst of taps sends the first and the last (`client/play.ts`).
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

### The winners jump

Purpose (v4 item 9, the students' own wish): winners only, after every
question, jumping; ten easily told apart, crowding accepted beyond.

- After every reveal, the avatars of everyone whose answer counts jump on the
  wall for about four seconds (`PARTY_MS`, `client/screen.ts`); then the band
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

## Not known

- Whether children dress at all, and whether teachers wait for it; whether the
  shapes help a child find their avatar from the back row.
- Whether ten at 104 px read from the back row, and twenty as a crowd; whether
  four seconds is long enough for a child to find themselves and short enough
  for the teacher; how children take being seen not jumping; how the
  projector's colours treat the band's veil.
- Whether 47 to 56 px is enough for ten winners beside a picture, or the band
  should go elsewhere there.
- Whether the students' buttons need the answer text, or heads stay down (the
  owner has not said whether the colour-coded setup he saw had text on the
  devices).
- Whether tools beside the animal are wanted (owner's open call).
- Pairs and teams: two children on one tablet already work as one player;
  whether "of 25" and the ranking read sensibly when twelve tablets stand for
  twenty-four children is unchecked, and team play is a mode of its own.
