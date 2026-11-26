# The mark

The site's top-hat fox avatar (`src/client/look.ts`) off its disc, drawn as
a mark. Which file the site uses where: `docs/design/identity.md`.

- `build/` writes the drawings: `python -I build/build_kit.py` rewrites
  `svg/` and `web/`. It needs fontTools and Rubik Bold 1.100 as a TTF
  (`RUBIK_TTF` in `build/word.py`). `build/fox.py` holds the geometry, in
  the avatar's 100-unit space with baked coordinates, so a change to the
  avatar isn't followed.
- The site's files in `src/public/` (`brand/` and the browser icons) are
  copies and renders of these.
- `svg/` holds every version. `-dark` files are for dark grounds, `-inline`
  files paint the hat and wordmark in `currentColor`, which resolves only
  inline (in an `<img>` it falls back to black). The colour symbol and the
  lockups built on it are drawn for 48 px and up; `-32` files on a 32 grid
  for 24 to 47 px, `-16` files for exactly 16 px. The black and
  white files are separate one-colour drawings, black for light grounds and
  white for dark.
- The orange `#E26B22` is a shade deeper than the avatar's `#E8742A` so the
  head's edge reaches 3:1 against the light page.

## Rasters

The build renders none, so the site's rasters are rendered by hand with any
SVG renderer that keeps the geometry:

- `favicon.ico`: `svg/classyquiz-symbol-16.svg` at 16,
  `svg/classyquiz-symbol-32.svg` at 32 and `web/favicon-48.svg` at 48.
- `apple-touch-icon.png`: `web/touch-icon.svg` at 180.
- `social-card.png`: `svg/classyquiz-social-card.svg` at 1200 × 630, the
  link preview the pages name in `og:image`, where chat apps take no SVG.

`web/` holds the browser icons' sources; `web/favicon.svg` is served as it
is.
