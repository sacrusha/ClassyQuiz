# The site's identity

## Purpose

A teacher deciding whether to rely on the site in front of a class meets one
product, made on purpose: the same name and mark, the same paper, ink and
type on every page they pass through, from the landing to the wall. The
identity serves that judgement; it is not decoration, and nothing is reworked
for its own sake.

## Situation

- The answer marks are Kahoot's set (red triangle, blue diamond, yellow
  circle, green square, in that order; `class-and-wall.md`, "What each
  screen shows"). Plausible assumption: children who know Kahoot read them
  at once. The class knows the four answers by colour and shape on every
  screen, and the teacher's Play stands beside them on the wall's bar and on
  the Remote.
- The places where people look together are the wall's join screen (the
  whole class, every lesson), the landing page's header (where the tablets
  type the code) and the browser tab. Question screens belong to the quiz's
  content.
- The avatars are animals on a colour, some with a hat or a tool; a child finds "the
  frog on purple" across the room (`class-and-wall.md`). The mark comes from
  them, not from the answers.
- The wall's type fits the question and the answers by measuring them
  (`client/stage.ts`, `fitText`, `fitTiles`). A webfont that arrives after
  the first measure would leave a wrong fit.
- Quiz text is in any language and script.
- School Wi-Fi is slow and filtered, so nothing on the site loads from a
  third party (the Content-Security-Policy in `hosting-and-limits.md`).

## How the site meets it

### One home for the look

`src/public/site.css` holds the colours, the typefaces, the base styles and
the site's header; every page in `public/` links it first. `app.css` (the app
pages) and a page's own `<style>` (the root, `/own-copy`, `/layout`) build on
its tokens and define none of their own, so the paper doesn't shift from the
landing to `/check`. The build puts `site.css` in front of `app.css` for the
app pages and writes it into the page for the others (`scripts/build.mjs`),
so a page opened at lesson start (the root, `/play`, the wall) waits for one
stylesheet at most. Pages for a teacher follow the device's dark mode (`follows-dark`
on `body`); the wall stays light, because projectors wash dark backgrounds
out. The players' screens are light too; no reason is recorded for theirs.

App screens are set at 1.45 line height, pages read top to bottom (the root,
`/example`, `/own-copy`, `/layout`) at 1.55.

### Colours

- **Paper and ink**: `--bg` `#fbf8f2`, `--fg` `#1d1d1b`, with muted text and
  rules from the same warm grey. From it too: the dashed edge of a place to
  drop a file (`--dash`, the root page's box), and the ground of a tab not
  chosen, a step off the paper (`--tab`), with an edge where that step alone
  doesn't hold it apart, in dark mode (`--tab-edge`).
- **Controls are ink** (`--control`): Play on the steering bar and the
  Remote, Start, Let everyone in, Upload, the code box's ▶, the on state of
  a switch, a picked shape in the students' lobby, the countdown's bar, and
  the actions written as underlined words (Change the solution, Swap). Ink
  has no hue, so it can't be taken for red, blue, yellow or green, on a good
  screen or a washed-out projector; it is also the mark's hat. In dark mode
  the ink is light.
- **The accent is rust** (`--accent` `#a8471a`, light `#f0a065` in dark
  mode): the mark's orange darkened to read as text (5.5:1 on the paper).
  Links, the example ask's labels, the landing's step numbers, the ring that
  points the class at the code box in the join screen's drawing. It is never
  a control's fill: a rust button beside the red triangle's tile would be the
  confusion moved, not removed.
- **Answers** (`.a0`–`.a3` in `app.css`) and **right and wrong** (`--good`,
  `--bad`) have colours of their own, outside the identity. The landing's
  drawn tablets use the answers' exact colours.

### Type

- **Rubik Bold** for the site's own words: the name, the class and teacher
  codes, headings, the wall's big numbers (the join code, the count, the
  ranking's percentage and places). It is the wordmark's lettering, so the
  name in the header and the headings beside it are one hand. Self-hosted in
  `src/public/fonts/`, one weight, subset to Latin, which covers the
  languages the site's own words are in now: 21 KB, kept a year by
  the browser (the file's name carries the font's version; `build.mjs`).
  Licence: SIL Open Font License, `fonts/OFL.txt`.
- **The reading face** (the device's system font) for everything else, and
  always for a quiz's own words: the question, the answers, the quiz's
  title, on the wall, the tablets and the teacher's lists. They are in any
  script, the wall measures them to fit, and the system font is the one each
  device renders best; the brand face never decides whether a question
  fits.
- **A code is one face everywhere** (`.digits` in a sentence): the landing's
  box, the resume card, the wall, the check, the Remote, the teacher entry.
  Rubik's zero has no slash, and a code is digits only.
- Placeholders ("12345", "12345 67" for a teacher code) are `--placeholder`:
  4.6:1 on the paper and 4.9:1 on a card (5.3 and 4.7:1 in dark mode), so
  they read, against about 16:1 for what is typed, so a box with only a
  placeholder doesn't read as filled.

### The name and the mark

The mark is the avatars' fox in a top hat (classy), taken off its disc and
drawn as a mark, so the logo and the game share one character. The head is a
shade deeper orange than the avatar's (`#e26b22`), so its edge reaches 3:1
on the paper; the white face and the dark eyes and nose are the same on every
ground; the hat and the name take the ink, light in dark mode. The name is
Rubik Bold as outlines, the headings' lettering. None of the four answer
colours is in it.

The drawings and which serves where (which file on which ground, the
minimum sizes) are `docs/brand/guidelines.md`, with every
version in `docs/brand/svg/` and the Python that draws them in
`docs/brand/build/`. The site uses copies of these files, in
`src/public/brand/`:

- **The header lockup, inline** (`classyquiz-horizontal-32-inline.svg`): the
  fox and the name drawn for exactly 32 px tall, the hat and the name in
  `currentColor`, so they follow the page's ink and its dark mode. A page
  writes `<!--#brand file.svg-->` where it goes and the build writes the
  file in (`scripts/build.mjs`). One file feeds every page.
  - The root page is what teachers' AIs fetch to read the guidance, so the
    drawings don't stand before it: the header writes
    `<!--#brand-use file.svg-->`, a few bytes that `<use>` the drawing, and
    the drawing is written once at the page's end (`<!--#brand-defs-->`),
    after the guidance. `currentColor` still follows the header's ink.
  - The pages' script (`client/dom.ts`, `siteHead`: the teacher-code entry
    and the second device's screens) shows the light or the dark file
    (`classyquiz-horizontal-32.svg`, `-32-dark.svg`) as a picture that
    follows the device's dark mode, as those screens do. It is the
    students' script too, and the drawing inline would reach every tablet.
- **The fox alone, inline** (`classyquiz-symbol-32-inline.svg`): the
  landing's header on a phone held upright. The lockup needs about 430 px
  beside the code box and the language; narrower, the fox stands alone and
  its label still names the site to a screen reader.
- **The landing film** (`docs/film/`) draws the header lockup
  (`classyquiz-horizontal-32-inline.svg`) in the site's headers it shows
  full frame and on the laptop, and the full fox
  (`classyquiz-symbol-colour.svg`) where the phone in hand and the phone in
  each press's bubble show the site, on the join screen and on the end card.
  `sitebuild.py` writes both into the film as text, and the film's camera
  scales them with everything else.
- **The light-ground files** on the wall, which stays light: before the
  join screen's address, the full fox (`classyquiz-symbol-colour.svg`) on a
  wall of 1920 x 1080 or more, where it is drawn about 57 px tall, else the
  drawing for 24 to 47 px (`classyquiz-symbol-32.svg`). The choice goes by
  the window's size, not the mark's: beside an address much longer than the
  demo's, a big wall shows the full fox a little under 48 px. In the drawing
  of where the code goes, the header lockup (`classyquiz-horizontal-32.svg`),
  and the colour lockup (`classyquiz-horizontal-colour.svg`) where the
  32 px one would be drawn 48 px tall or more (a drawing 715 px wide, a wall
  about 1200 px high; a container query in `app.css`). The measure there is
  the lockup's box, as for the 32 px files; the master's fox inside it is
  then 45 px, under the kit's 48. Only the file shown is fetched.
- **The colour lockups** (`classyquiz-horizontal-colour.svg`, `-dark.svg`):
  the README's title, on GitHub's light or dark page.
- **The tab's icon**, at the site's root, the same on every page:
  `favicon.svg`, the drawing for 16 px with its hat following the browser's
  dark mode; `favicon.ico` (16, 32 and 48 px) for browsers without SVG icons;
  `apple-touch-icon.png`, the fox on a paper tile for a home-screen bookmark.
  A file at the root also answers `/favicon.ico`, which browsers ask for
  unprompted. Plausible assumption: school laptops run Chromium browsers,
  which take the SVG; so the `.ico` and the touch icon have no keyline for a
  dark tab strip (backlog, v4 item 14).

Where it is:

- **The landing's header**: the mark and the name, where the tablets find the
  code box.
- **The join screen**: the mark before the address the class types, and the
  lockup in the wordless drawing of where the code goes, which mirrors the
  landing's header and changes with it (`class-and-wall.md`, "Getting in").
  The drawing's foot fades out: the top of a tablet, not a cut-off one.
- **The landing film**: the drawn site headers show the mark and the name,
  the join screen the mark before the address, as on the site; the end card
  the mark over the address.
- **A small header on the pages a teacher reaches from the landing**
  (`/example`, `/own-copy`, `/check`, the teacher-code entry and the second
  device's screens, its question and its note that both roles are taken):
  the mark and the name, back to the landing.
- **The browser tab**, everywhere.
- **The README**, where `/own-copy` sends a teacher weighing their own copy:
  the lockup as its title, a picture of the wall beside one of a player's
  tablet (`landing/wall-en.webp`, `landing/tablet-en.webp`), and the
  pictures of the three ways to play (`landing/way-*.svg`).

Not on the question screens, the rankings, the Remote or the students'
answer screens: there the quiz and the class are the content, and the
film's wall and tablets and the README's pictures of the wall and the
tablet show them as they are.

## Not known

- Whether teachers read the answer marks as Kahoot's, and whether that helps
  or costs trust; nobody has asked one.
- Ink controls and rust on a real washed-out projector, and on Android and
  iPad (checked in Edge on Windows only).
- Which icon each browser puts in its tab: Chromium is expected to take the
  SVG over the `.ico`; not looked at in a real tab strip.
- Whether the mark in the film keeps the kit's minimum sizes
  (`docs/brand/guidelines.md`) on a phone: the camera sets its size; not
  checked.
- The font's cost on school Wi-Fi beyond its size; it loads with
  `font-display: swap`, so a slow load shows the system font first.
