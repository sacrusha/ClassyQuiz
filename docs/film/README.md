# The landing film

A film of about 60 s, without sound, in the root page's top block, where the
strip of five stills stood. What it does on the page (the poster, the
chapters, the layout, what loads when): `docs/design/root-page.md`, "The
film". This folder is the film itself: this file (what it is for, what it
lives with, how it is made and checked), `storyboard-classyquiz.md` (the
shots, and how they depart from the owner's brief), `film-text.md` (the
words its screens show, and where in the repo each comes from), and `build/`
(the source and the scripts).

## Purpose

A teacher on the root page, usually not at school, should come away knowing
two things:

1. **The workflow**: photos of my sheets and one sentence to my own AI give a
   `.zip`; the `.zip` goes up on this site; the class plays it on the big
   screen and their tablets.
2. **That it solves a problem I have**: I have the material and a lesson
   coming up, not much time; what comes out is a whole class practising at
   once, and a moment to talk about a typical error, which nobody is graded
   on.

The owner, on the five stills: the last part, the class playing, works for
people who know classroom quizzes and may be tricky for those who don't. So
the classroom gets the most time, the AI half is brisk (Build's text below
explains it too), and what a newcomer can't guess is shown as cause and
effect:

- the question is on the big screen only; a tablet shows the four choices as
  colour, shape and their text, the same as on the wall (one child seen over
  the shoulder: wall and tablet in one frame);
- a tap on a tablet shows up on the wall (that child's avatar pops up, the
  count rises);
- the teacher sets the pace: every change on the wall follows a press on the
  teacher's phone, the same small motif each time;
- the class sees how the votes split before anyone sees what's right, and
  talks about it;
- the solution comes to each tablet (✓ or ✗) and to the wall (avatars jump);
  the ranking shows avatars, so nobody is exposed.

That the quiz was made in the break the viewer infers; the film doesn't say
it.

## Situation

- **A phone held upright** gives the 16:9 film about 358 × 201 CSS px. Text
  that must be read needs a close-up and time on screen; everything else may
  be illegible (codes typed by children, the AI's prose).
- **It never plays by itself**, so its poster frame and the chapters beside
  or under it must do the five-second job unplayed (`docs/design/root-page.md`).
- **No sound, no words of its own.** Text appears only on the screens it
  shows, in the language those screens have on the real site: the teacher's
  chat, the quiz and the root page in the page's language, the site's screens
  after the upload in English (`film-text.md` §0.7). Wordless bubbles carry
  the murmur and the cheer.
- **AIs read the root page.** None of the film's words may be in
  `index.html`: they are in the script and drawn at play time.
- **The site's content-security policy** (`src/scripts/build.mjs`, sent as
  headers from `dist/_headers`): scripts only from the site's own files,
  pictures from them or `blob:`, fonts from them (`default-src 'self'`). So
  no `data:` pictures or fonts, no inline script, no outside font or library.
- **The site claims nothing it hasn't tested** (no durations, no tiers). The
  film doesn't claim them by picture either: no clock, since the AI's minutes
  of building are sped up.
- **Devices' fonts differ.** The film's text is in the site's faces, Rubik
  and `system-ui`; `system-ui` is another font, of another width, on each
  device.

## How it is made

### The source and what is built from it

`build/` holds the source:

- `film.js`: the film and its player, one script. Its words: `LANDING` (the
  root page's own words, the example ask and the Run box, filled in from
  `src/client/landing-text.ts` at build time), `CONTENT` (per language: the
  teacher's second message, the AI's status lines, the `.zip`'s name, the
  quiz's title and questions; `draft: true` marks a language whose words are
  drafts pending the owner's review) and `COMMON` (the site's English
  screens, the timings of the chapters).
- `film.css`: the standalone page's player and the faces the film uses (on
  the site they come from `index.html` and `site.css`).
- `build.py`: the standalone page, `.tmp/film/index.html` at the repo root
  (git-ignored; `?lang=de` and so on picks the language), with the assets as
  `data:` URIs and the avatars taken from `src/client/look.ts`.
- `sitebuild.py`: the site's version, straight into `src/`:
  `src/public/js/film.js`, the poster frames `src/public/landing/film-<lang>.webp`
  and `-800.webp`, and the chapters' stills `film-<still>[-<lang>].webp`,
  rendered from a fresh standalone page. These are generated: edit the
  source, not them.
- `shoot.py`: stills of the standalone page at any times, desktop or phone,
  and a contact sheet, into `.tmp/film/shots`.
- `sitecheck.py`: the site's version checked in the real site, under the
  site's own headers, in Edge (below).

The page side, `src/client/film-poster.ts`, is written by hand. When to
rebuild, and what the scripts need: `src/DEVELOPING.md`, "The landing film".

### The film's shape

- **The whole picture is a function of film time**: `render(t)` sets
  everything, so the poster frame, a chapter's seek, pausing and playing are
  one code path, with nothing chained on timers. The standalone page exposes
  it as `window.cqFilm.render(t)`, which makes every moment checkable.
- The SVG is built once from templates; after that a frame only sets
  attributes, and only those whose value changed.
- **One world with a camera** (translate and scale on one group, the zoom
  interpolated logarithmically) for the room; **full-frame layers** for what
  must be read: the chat, the site on the phone, the shots over a child's
  shoulder. The opening, over the teacher's head onto the desk, is a layer
  with its own camera; it cuts to the room at the moment the laptop's screen
  fills both views alike, so the cut doesn't show. The chat grows out of the
  phone's screen to the full frame and shrinks back into it: once that
  convention is set, the site on the phone keeps it.
- **The screens are parts drawn once and used several times** (the wall
  960 × 540, the tablet 400 × 640, the laptop 960 × 600): the wall in the
  room, in the laptop and behind the child's shoulder read the same state of
  `t`, so they agree across every cut.
- **One motif for every press of the teacher**: a bubble at the lower left
  zooming in on the phone with the real button (Let the class in ▶, Start
  quiz ▶, Choices ▶, Answers ▶, Solution ▶, Final ranking ▶), the thumb and
  its ripple, a tail to the phone in the teacher's hand while it is in the
  frame; the wall answers 0.25 s later. The bubble appears only once the
  camera holds.
- **Figures are seen from behind or from the side**, which saves faces. A
  head turns by shifting the hair, which shows a strip of skin and a nose.
  Fingers and thumbs travel under about 1000 units a second; two taps less
  than 1.4 s apart go straight from one to the other.

### Text

- Text is measured, not estimated: a hidden `<text>` in the same SVG, once
  Rubik has loaded. Lines break at ordinary spaces only, so a labelled part of
  the ask ("Nr. 1", "5. Klasse") stays whole; each piece keeps its place in
  the whole sentence, from which the typing, the cursor and the growing
  underline follow. SVG drops a `<text>`'s trailing spaces, so the measuring
  element and the drawn lines keep them (`xml:space="preserve"`).
- Each ask ends a fixed time before it is sent, so its typing speed follows
  its length: in every language, and with an own copy's longer address. The
  address shown is the one the browser opened, as on the page.
- A fixed text in a fixed box carries the box's width and, measured after the
  build, shrinks around its anchor where the device's font is wider.

### Reading on a phone

The stage is 1600 × 900 units; on a phone held upright it is 358 CSS px
wide, a factor of 0.224.

- 46 units is about 10 CSS px there and reads (the typed ask); 36 to 40 units
  is the lower limit for anything that must be read.
- The teacher code is shown twice: after the upload, zoomed 1.9 times and
  pulsing, then typed on the laptop with the laptop's screen filling the
  frame.
- The vote counts on the wall barely read in the room's wide shot, so the
  camera moves in for the split.
- The children's bubbles are drawn 1.35 times larger; smaller, they are dots
  on a phone.

### Checking

What looked right in the code was wrong on screen time and again: a camera
that cut off the teacher's head, a hand over the phone's screen, a pan that
showed only the teacher's back for 0.3 s, the vote split off by one child.
Only rendered pictures found them, so the film is checked by looking:

- `shoot.py` renders stills at any times, the desktop at 1300 px and the phone
  at 390 px and 3 device pixels to the CSS pixel, and a contact sheet. The
  whole film every 0.5 to 1 s; transitions and movement every 0.1 to 0.2 s.
- Phone stills are looked at scaled to CSS pixels (the 358 px stage), not at
  device pixels.
- Fixed texts are checked with a wider font forced in (DejaVu Sans, injected
  CSS), standing in for a device whose `system-ui` is wider.
- A page error leaves the stage blank without a word from `node --check` (a
  local variable that hid an element did): the scripts listen for
  `pageerror`.
- `sitecheck.py` runs the working tree's site against `main`'s, both built
  and served with the site's headers, in Edge on a desktop and a phone. Its
  header lists every check: nothing of the film fetched before a press and
  none of its words in the HTML; the poster picture against the live frame;
  chapters, languages and the switch back to the poster; failures to load or
  to draw; keys and focus; the arrangement on upright and sideways phones;
  full screen, the browser's and the fallback; every language's ask typed
  out in time and no fitted text shrunk below three quarters; and the rest
  of the landing unchanged, by every element's computed style (a picture
  comparison can't: the page shows its own address, port included). The
  site's tests run with it (`npm test`; one fails while the built film's
  root-page words differ from `landing-text.ts`).

### The site's version

- Assets are in one object, `ASSETS`: `build.py` fills it with `data:` URIs
  for the standalone page, `sitebuild.py` with the site's
  `/landing/sheet-*.webp` and the brand SVGs as text; the font comes from
  `site.css`. `sitebuild.py` refuses a `film.js` with a `data:` URI in it.
- The avatars are `src/client/look.ts`'s own, read by `build.py` with the
  types stripped, not copied.
- The chapters on the page are the captions in `landing-text.ts` (`data-t`);
  their times are only in `film.js` (`COMMON.chapters`, keyed by the same
  names).
- The poster picture lies over the SVG, absolutely placed, while the film
  builds underneath it; then the film replaces it.
- The CSP stops Playwright's `wait_for_function` (it evaluates a string,
  and there is no `unsafe-eval`); the scripts poll with `evaluate` from
  Python instead.

## Not known

- **Real phones.** A frame costs 0.4 to 3.6 ms in desktop Chromium; in
  emulation at 4× CPU slowdown about 30 to 130 ms, which on a slow phone would
  be a jerky film. No real phone, iPhone or Android, has been measured. The
  full screen, the browser's and the fallback, is checked in Edge only, not on
  an iPhone's Safari or on Android.
- **Whether the timings read** when watched: the hold after the ask, the
  preview card's second or so, the split's six seconds. Checked only as
  stills.
- **Other fonts.** The fit of fixed texts is checked with one wider stand-in
  font. The poster picture carries the font of the machine that rendered it;
  on a device with another `system-ui` the live frame that replaces it shows
  slightly different text.
- **The German, French and Italian words** of the film are drafts pending the
  owner's review (`CONTENT`, `draft: true`; `sitecheck.py` names them).
- Whether the AI's preview card, in the AI's own colours and shapes rather
  than the site's (`film-text.md` §0.4), weakens the rhyme between the chat and
  the wall.
- The site's version only as `sitecheck.py` serves it: not yet on Cloudflare
  Pages, not looked at in the page's dark mode, not with a screen reader.
- Whether teachers read the poster and chapters in five seconds:
  `docs/design/root-page.md`, "Not known".
