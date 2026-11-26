# The landing film

A silent film of about 68 s on the root page, below its first screen. `build/`
holds its source (`film.js`, the film and its player in one script) and the
scripts that build and check it.

## Purpose

To make it easier for users to understand what this page is and does, so
they understand whether it's what they need, and how to use it if it is. A
teacher on the root page, usually not at school, should come away knowing
two things, in this order:

1. **Whether the site is something for them**: I have the material and a
   lesson coming up, not much time; what comes out is a whole class practising
   at once, and a moment to talk about a typical error, which nobody is graded
   on.
2. **How to use it**: photos of my sheets and one sentence to my own AI give a
   `.zip`, and another sentence changes it; the `.zip` goes up on this site,
   where I choose the way of playing it and bring my second device in; the
   class plays it on the big screen and their tablets.

The page above the film already answers the first, so teaching the use
carries more of the film. Two things a viewer doesn't see without being
shown: that the quiz is changed by asking again, and how the
`.zip` gets from the AI to the site.

Plausible assumption: the class playing works for people who know
classroom quizzes and may be tricky for those who don't. What such a viewer
can't guess: the question is on the big screen only and the tablets show the
choices; a tap on a tablet shows up on the wall; the teacher sets the pace
from their phone; the class sees how the votes split before anyone sees
what's right; the ranking shows avatars, so nobody is exposed.

## Situation

- **The film shows the site as built**, so that a newcomer who watched it
  meets the screens it showed. It draws them itself; which of the site's
  changes a test holds it to, and which it misses: `src/DEVELOPING.md`, "The
  landing film".
- **Languages**: the root page's part and the teacher's chat and quiz are in
  the film's language; the screens after the upload are drawn with their
  English words in every language, though the site shows them in the page's
  language.
- **Phones as well as laptops**: a first-time viewer should follow the
  film on an upright phone as much as on a laptop or a tablet on its side;
  on a phone the sheets have to be recognisable, and their legibility may
  suffer. On an upright phone the 1600 × 900 stage is
  about 358 CSS px wide, a factor of 0.224; text of 36 to 40 units is about
  the smallest that reads there, so what must be read needs a close-up and
  time on screen. The local check and the lobby's check are drawn as a
  laptop-wide window shows them, on the phone too, where the site stacks
  them: so the choice among three ways is one frame, not a scroll. Assumed,
  untried: a teacher who then opens a quiz on a phone recognises the stacked
  page as the one the film showed.
- **AIs read the root page**, so none of the film's words are in
  `index.html` (`docs/design/root-page.md`, "The page's two readers").
- **The site's content-security policy** (`src/scripts/build.mjs`): scripts,
  pictures and fonts only from the site's own files (pictures also `blob:`),
  so no `data:` URIs, no inline script, no outside font or library. It also
  blocks Playwright's `wait_for_function` (no `unsafe-eval`); the scripts poll
  with `evaluate` instead.
- **Devices' fonts differ.** The film's text is in Rubik and `system-ui`,
  which is another font of another width on each device; fixed texts are
  measured after the build and shrink to fit.
- **Measuring text is what building the film costs**: each width read forces
  a layout, so the cost grows with the square of the film's text. The build
  takes about 0.4 s on a desktop and 0.5 to 1.0 s on the owner's older test
  phone. Text typed out (`o.typing`) needs the width of every prefix; more
  text stays cheap only drawn whole.

## Building and checking

From the repo root, `py -I docs/film/build/<script>`. Needs Python 3 with
Playwright and Pillow, and the installed Edge; `sitecheck.py` also Node, npm
and git. Output goes to `.tmp/film/` and `.tmp/sitecheck/`.

- `build.py`: the standalone page, `.tmp/film/index.html` (`?lang=de` and so
  on), where `window.cqFilm.render(t)` draws any moment: the whole picture is
  a function of film time.
- `sitebuild.py`: the site's version, `src/public/js/film.js` and the poster
  frames `src/public/landing/film-*.webp` (`--no-poster` skips them).
- `shoot.py`: stills at any times, desktop or phone, and a contact sheet.
- `sitecheck.py`: the working tree's site against `main`'s, both built and
  served with the site's headers, in Edge on a desktop and a phone; its
  header lists what it checks.

What looked right in the code was wrong on screen time and again (a camera
that cut off the teacher's head, a vote split off by one child); only
rendered pictures found it. Phone stills are judged scaled to CSS pixels,
not at device pixels. A page error leaves the stage blank while
`node --check` passes, so the scripts listen for `pageerror`.

## Not known

- **Real phones**: a frame costs 0.4 to 3.6 ms in desktop Chromium and 30 to
  130 ms in emulation at 4× CPU slowdown, which would be jerky; no real phone
  has been measured. Full screen is checked in Edge only. Dragging the time
  bar on a slow phone hasn't been tried.
- **Whether the timings read** when watched (the holds on the root page and
  the checks, the second ask, the split): checked only as stills.
- **Whether 68 s is watched through** by a first-time viewer: nobody outside
  the project has watched it.
- **The pace for a teacher who has decided and wants the steps**: the
  default pace serves "is this for me" and is too fast for
  learning the steps. Under consideration: calling the default speed 2× and
  half speed 1×, or a slower setting for the chat, upload and laptop only.
- **Other fonts**: fixed texts were checked with one wider stand-in font
  (DejaVu Sans). The poster carries the font of the machine that rendered
  it, so on another `system-ui` the live frame that replaces it differs
  slightly.
- The site's version hasn't been looked at in dark mode or with a screen
  reader.
