# Pictures

Question pictures, backgrounds and pictures as answers: how they reach the
site, how they are stored, and how each screen shows them. The text format's
other parts are in `quiz-format.md`; the screens' wording and layout are in
`../user-flow.md`.

## Purpose

Most exercise sheets have pictures, and for many of them the figure is the
exercise (backlog v2 item 1: "figures are the exercise"). The question on
the big screen is what makes the quiz feel interactive, so the voting
devices don't need the question's picture. A picture can also be the choice
itself ("which of these shows ...", backlog v3 item 1), and then the
students' devices need it.

Three kinds of picture:

- **A question's picture**: one per question, on the projector only.
- **A background**: atmosphere or context rather than content. It is a
  separate thing from the question's picture. Questions may share files,
  as picture or as background.
- **A picture as an answer**: on the projector and, in a small copy, on
  the students' buttons.

The first target is a teacher whose AI can make a zip. The owner:
"working and good first, flexible later".

## Situation

- The quiz arrives as a `.zip` holding the text and the pictures. A teacher
  whose AI can't make a zip has no way to bring pictures (see Not known).
  The product's constraints are in `backlog.md` (Constraints); the zip
  reader's limits are in `src/client/unzip.ts`.
- Plausible assumption: the projector is read from the back row, eight to
  ten metres away (what the sizes below are for). Its size varies; the
  layouts are checked at 1366x768 (a common school laptop), 1920x1080,
  1280x800, 1024x768 and a phone.
- Real sheets give wide strips (number lines, 6:1 to 2.6:1), squares,
  upright figures and photos, and often a run of questions with the same
  text ("Welche Zahl ist mit dem Pfeil markiert?"). Photos from phones are
  several MB and carry the camera, time and GPS.
- A school laptop is shared: nothing may stay on it once the page is
  closed.
- Nothing is kept beyond its use and nothing identifies anyone
  (Constraints). The Free plan's limits bind every request and stored byte
  (`hosting-and-limits.md`); for pictures it matters that a Function has 10 ms
  CPU and a Durable Object value holds 2 MB. A quiz with 15 pictures is a few
  MB and a handful of rows.
- The author of the quiz is the teacher's AI. It writes picture lines as it
  writes anything, and it can't see the wall. The guidance page
  (`src/public/index.html`, "How quizzes are built", "Pictures on the wall",
  "Pictures as choices") carries what an AI can't derive: where a picture
  lands, the caps, that transparency shows the tile's colour. Its scope is
  `guidance-page.md`.

## How the site meets it

### In the text

The picture lines are specified in the guidance page; the parser is
`src/quiz/format.ts`. What they are shaped for:

- `Image: q3.png` after the question text and before the answers: the
  question's picture. `Background: forest.jpg` after a question's text lies
  behind that question. The parser also takes one before the first question,
  behind every question; the guidance doesn't publish it (`quiz-format.md`).
- `+ Image: pie-3.png` / `- Image: pie-1.png`: an answer that is a picture,
  mark in its column. Text and picture answers mix ("none of these"), and a
  question with picture answers may have its own `Image:`.
- Names match by `imageKey` (`format.ts`): the base name, case-insensitive,
  Unicode NFC, so `Bilder/Q3.PNG` is `q3.png` and a Mac zip's decomposed "ä"
  matches.
- Markdown dress, quotes, backticks and a description after the file name
  are read through, as AIs produce them.
- A picture line after the answers is an error, because it may be meant for
  the next question and a wrong guess shows a figure with the wrong
  question. The message gives the picture-answer form, since such a line is
  often meant as one.
- Other errors: two pictures or two backgrounds on one question; `Image:`
  before the first question; a line or picture answer that names no picture
  file, or a web address (the site loads nothing from the web).
- Warnings: the same picture as two answers; an answer that is only a file
  name ("cat.jpg") shows as text, and the message gives the picture form. It
  isn't taken as a picture because "Which file is a picture? + cat.jpg" is a
  real question.
- A question whose answer pictures differ in proportions by more than 1.5
  (`ASPECT_SPREAD`, `server/images.ts`) draws a warning from the server once
  sizes are known: the class would pick by shape or crop.

### At upload

`src/client/images.ts` runs in the teacher's browser: `prepareImages()`
reads only the files the text names, one at a time, from the zip, and
redraws each on a canvas.

- Long side at most `IMAGE_LONG_SIDE` 1600 px for a question's picture,
  `BACKGROUND_LONG_SIDE` 1920 for a background, `ANSWER_LONG_SIDE` 1200 for
  a file used only as an answer (`shared/protocol.ts`). A file's size follows
  its largest use. A smaller picture is not shrunk; the screens enlarge it,
  because blurry beats small from the back row.
- Redrawing drops everything a photo carries besides the image (camera,
  time, GPS) and shrinks a 4 MB phone photo to a few hundred KB. The server
  takes only PNG or JPEG, so no SVG, with whatever scripts it holds, is ever
  served. An SVG with only a `viewBox` is drawn at the long side. EXIF
  orientation is applied.
- A question's or an answer's picture with transparency stays a PNG with its
  alpha, up to `MAX_IMAGE_BYTES` (1.5 MB), because a picture as an answer
  sits on the tile's colour (below). Backgrounds, opaque pictures and a
  transparent one too large as PNG are flattened onto white. An opaque PNG,
  GIF, BMP or SVG stays PNG up to 500 KB (crisp line art), else JPEG.
- Each answer picture also gets a small copy for the devices: long side
  `SMALL_LONG_SIDE` 640, at most `MAX_SMALL_BYTES` 300 KB. If it can't be
  made the answer still works and the devices show its colour and shape. A
  transparent picture too large as PNG shows on white (above 1.5 MB on the
  wall, above 300 KB in the small copy); line drawings stay far below.
- HEIC can't be decoded by most browsers; the teacher is told so.
- The zip reader's limits stand: stored and deflate only, no zip64, names as
  UTF-8. An old Windows zip with a non-ASCII name in code page 437 would not
  match its `Image:` line; the AIs' Python writes UTF-8.
- A picture the quiz names that isn't in the zip is a problem that names it
  and, for a zip, lists the pictures the zip does have, so the AI sees its
  own naming mistake. The teacher can run the quiz without the pictures
  ("Continue without these pictures", `leaveOut`); the quiz then runs with a
  warning per question. A left-out picture answer shows its colour and shape
  alone, and the teacher's list says "(picture left out)".
- Without pictures the upload is JSON `{text}`; with them it is multipart:
  `text`, `leaveOut`, and per picture an `image` file with its `imageName`,
  and for answers a `small` with `smallName`. The Function forwards the body
  unread to the quiz's instance, because its 10 ms CPU can't parse it; the
  Durable Object does.

### Stored and served

`src/server/images.ts`, `src/server/instance.ts`.

- The server checks every file again: PNG or JPEG by signature, size read
  from the file, at most `MAX_IMAGE_BYTES` per file (a Durable Object value
  holds 2 MB), at most `MAX_IMAGES` pictures (120; 15 questions with four
  picture answers are 60), `MAX_UPLOAD_BYTES` 16 MB for the upload. Files the
  quiz doesn't name are dropped.
- Each picture is stored once as `img:<n>` in the instance's own storage, in
  the same write as the quiz, and goes with the instance when it ends. The
  alarm is set before that write, so a failed write is still cleaned up.
- The small copies are concatenated into packs of at most `PACK_BYTES`
  (1.5 MB), stored as `pack:<k>` in the same write, and count towards the
  site's booked bytes.
- `GET /api/i/:id/img/:secret/:n` serves a picture; `.../p<k>` a pack. The
  secret is per quiz and travels only in views, so the instance id that every
  student device knows doesn't open the pictures. The students' devices get a
  separate `packSecret` that opens the packs only, never a question's
  picture. Responses are `cache-control: no-store` (a shared laptop keeps
  nothing on disk), `nosniff`, and a sandboxing CSP.
- Views: the projector and teacher views carry `image` and `background` as
  `{src, w, h}` (the size lets the layout hold the place before the file
  arrives). The projector's question also carries `pics` for picture answers.
  The player view carries no question picture; it carries `packs` (in every
  view, the lobby included) and, once the answers are up, `pics` per answer.

### Loading

- Each page fetches each picture once, into a blob URL
  (`src/client/pictures.ts`, `PARALLEL` 2 at a time, the one on screen
  first), because the server sends `no-store` and an `<img>` drawn again
  would fetch again. If a fetch fails the `<img>` asks the server itself.
- The projector fetches every picture it may show as soon as it has a view,
  in the lobby or on a reload mid-quiz. A reveal fetches nothing. Each fetch
  is one Function and one Durable Object request on the Free plan; the
  owner's 19-question sample cost 10 for a whole run.
- The teacher's pages fetch what they show.
- A student device fetches each pack once (`src/client/packs.ts`), one at a
  time, retrying at 5, 15, 45 s and so on, at most five tries, and cuts the
  pictures out by offset. The time for speed points starts once the
  question's pictures are there. Fetching per picture would have cost
  25 x 4 x 15 = 1,500 requests for a class of 25 on 15 picture-answer
  questions; one pack per device is 25 requests, and with a 400 KB pack about
  10 MB over the school Wi-Fi in the lobby.
- A picture arriving after the buttons is filled in place, without a redraw
  that could swallow a tap.

### The projector

`layQuestion` and `layPictureAnswers` in `src/client/stage.ts`. The aim: the
figure as large as the room allows, with the question and the tiles still
readable, chosen by the page, not by the AI or the teacher.

- **Question picture, placement.** Between the question and the tiles at full
  width, or beside (picture left, question and tiles in one column). The page
  lays out between first, then takes beside when the picture comes out 1.3
  times larger, with the picture at 58% of the width, else 50%, and only if
  the question stays at 1.5em or more and no answer is squeezed or below
  1.3em. Wide strips go between; square and upright figures, and photos with
  short answers, go beside. A phone as the projector is always between.
- With a picture the question starts smaller and may take at most 30% of the
  height; the tiles keep a minimum height per row; the picture takes the
  rest, at most 62% of the height. The figure's size is set in px from `w`
  and `h`, so nothing moves when the file arrives. It sits on a white card:
  every screen shows pictures on white, so a transparent line drawing doesn't
  vanish on a dark page.
- **The reveal moves nothing.** The question is laid out once per question
  and window size; the lock-in and the reveal only change the tiles' marks,
  counts and bars in place.
- **Enlarging.** `Z`, a click on the picture, "Enlarge the picture (Z)" in
  the projector's menu, or the Remote's "Enlarge on the projector": the
  picture fills the screen above everything but the steering bar; the same
  action brings the question back. The state is on the server (`run.zoom`, op
  `zoom`) so Remote and projector agree, and is keyed to the step it was set
  in: the reveal and the next question end it, so the class always sees the
  tiles at the reveal. No clicker button maps to it: the clickers' "black
  screen" key sends `B` or `.`, and a figure appearing there would surprise.
- **Background.** Behind the whole projector, `object-fit: cover`, under a
  55% wash of the page colour (`#backdrop::after` in `app.css`) so the
  question and tiles read from the back row; the text sits on 90% white
  cards. The page states both figures. A question's own background replaces the quiz's; the
  quiz's also shows in the lobby and at the rankings.
- **Picture answers.** A tile is the picture on the answer's colour (no
  ground of its own, so transparent areas show the colour), the shape badge,
  and a side for the count and tick, reserved from the start so votes and
  reveal move nothing. The arrangement is one, two or four columns (three for
  three answers) in either orientation, whichever shows the smallest picture
  largest; two by two wins when within 85% of the best, the arrangement the
  class knows from text tiles. With the question's own picture, it goes
  between text and tiles or in a band beside the text, chosen so the
  question's picture and the smallest answer picture come out about alike. A
  text answer among pictures takes a picture's place. While the question is
  read with its answers hidden, the veil hides the cards' contents too
  (`question-flow.md`).
- Measured at 1366x768: four squares 299 px each (277 with a question
  picture), four 6:1 number lines two by two at 626x104, three upright 1:2.7
  thermometers 180x480, two squares 473. The guidance gives these to the AI.
- **The colour is the creator's choice.** A transparent answer picture shows
  the tile's colour (red, blue, yellow or green, shuffled with the answers),
  so a drawing whose contrast matters brings its own ground, the same for
  every answer of the question. A white card inside the tile's colour was
  tried beside the cut-out; on transparent drawings the cut-out lost
  quarters shaded in the tile's colour, and the owner chose the cut-out:
  "Cut out should be creator's choice, simply by using alpha channel, no?"
  The site adds no ground. A blueish-green marker has vanished on a blue tile.

### The students' devices

- A question's picture is not sent to them (backlog v2 item 1: they don't
  need it).
- A picture answer is the choice, so the buttons carry the picture on the
  button's colour with its shape, arranged by the same rule in a room fixed
  in px (a cached picture otherwise stretched the page when measured). Under
  the verdict, and while a late tap is on its way, the chosen picture shows
  beside its shape. Screens: `user-flow.md §3.6`.
- Without a small copy, or before the pack arrives, a button shows colour and
  shape alone.

### The teacher's side

- The question list (lobby, and "All questions" during the run) shows a
  thumbnail, 72 px high, under each question with a picture: nine questions
  can read the same and the list can't tell them apart without it. A
  question's own background gets a smaller one labelled "background"; the
  quiz's is shown once above the list. A tap shows the picture full size on
  that device. A picture answer's row shows its picture (64 px) on the
  answer's colour with the key's ring, so the key check shows what the class
  will see.
- The Remote's current question shows the picture across the card above the
  answers, with the enlarge button; it is also what the teacher shows around
  when the projector has died.
- **Hide the picture** (`Fix.hidePicture`, op `setHidePicture`) is among the
  fixes for a question ("Change the right answer"), for a wrong or revealing
  crop. The projector's view then has no picture for that question and it
  can't be enlarged. The teacher's view keeps it faded, struck through and
  tagged "picture hidden", so it can be shown again. It works at any time,
  also on the open question.
- The upload page doesn't preview pictures; the lobby list is the preview.

## Not known

- How large a question picture or an answer picture reads from the back row on a real projector; the thresholds (1.3 times, 1.5em, 1.3em, 85%) were judged on drawn and sample quizzes only.
- Whether teachers find `Z` and the click, or only the Remote's button.
- Whether the quiz's background at the lobby and the rankings is liked.
- Whether AIs crop tighter, leave pupils' writing out of the crop, and draw a question's answer pictures alike, with the guidance as it stands.
- How children take pictures on their tablets.
- Whether picture lines after the answers are common enough that the error costs more round trips than a guess would cost wrong figures.
- How to bring pictures for a teacher whose AI can't make a zip (backlog Later: attach and crop in the lobby, or an AI-drawn figure inline).
- Placement beyond the named layouts (backlog v3 item 2).
