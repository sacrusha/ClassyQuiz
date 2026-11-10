# classyQuiz logo kit

The mark serves the site's identity (`docs/design/identity.md`, which says
which file the site uses where). It is the site's own top-hat fox avatar,
taken off its disc and drawn as a mark, so the logo and the game share one
character; on a disc it would be the avatar again. This folder holds the
drawings and which serves where: `svg/` every version, `web/` the sources of
the browser icons, `build/` the Python that writes both.

## The drawing

- **Head**: an orange shield. The ear outer edges are vertical and the inner
  edges run at 60°. The jaw follows the avatar's curve to the chin.
- **Face**: white, coming up round the eyes, with an orange bridge running
  down to the nose. Every version has dark eyes on a light face, which is
  what keeps the one-colour cuts from looking like a masked bandit.
- **Hat**: a top hat between the ears. The crown flares 5°, a band gap sits
  just above a brim with lifted ends, and the brim lies over the head. The
  ears never touch the crown, so the crown always meets the background.
  This is why the hat can simply take the text colour.
- **Holes** are real, never paper-coloured paint. In the colour files the
  only hole is the band gap. The white face is fur colour and stays white
  on every ground. In the one-colour files, the gap round the brim, the face
  (black version) and the eyes and nose (white version) are evenodd holes.
- **Built from** `build/fox.py`, in the avatar's 100-unit space with baked
  coordinates: no masks, strokes, filters, text or transforms in the symbol
  files. `python -I build/build_kit.py` rewrites `svg/` and `web/`; it needs
  fontTools and Rubik Bold 1.100 as a TTF (`build/word.py`, `RUBIK_TTF`).
  The site's files in `src/public/` are copies.

## Versions and files (`svg/`)

| Use | Light ground | Dark ground | Inline in a page (`currentColor`) |
|---|---|---|---|
| Symbol, 48 px and up | `classyquiz-symbol-colour.svg` | `classyquiz-symbol-colour-dark.svg` | `classyquiz-symbol-colour-inline.svg` |
| Symbol, 24–47 px (drawn on a 32 grid) | `classyquiz-symbol-32.svg` | `classyquiz-symbol-32-dark.svg` | `classyquiz-symbol-32-inline.svg` |
| Symbol, 16 px (drawn on a 16 grid) | `classyquiz-symbol-16.svg` | `classyquiz-symbol-16-dark.svg` | `classyquiz-symbol-16-inline.svg` |
| Horizontal lockup | `classyquiz-horizontal-colour.svg` | `classyquiz-horizontal-colour-dark.svg` | `classyquiz-horizontal-inline.svg` |
| Header lockup, 32 px tall | `classyquiz-horizontal-32.svg` | `classyquiz-horizontal-32-dark.svg` | `classyquiz-horizontal-32-inline.svg` |
| Stacked lockup | `classyquiz-stacked-colour.svg` | `classyquiz-stacked-colour-dark.svg` | n/a |
| Wordmark alone | `classyquiz-wordmark-ink.svg` | `classyquiz-wordmark-white.svg` | `classyquiz-wordmark-inline.svg` |
| One colour (print, foil, stamps) | `classyquiz-symbol-black.svg`, `-horizontal-black`, `-stacked-black` | `classyquiz-symbol-white.svg`, `-horizontal-white`, `-stacked-white` | n/a |
| Link preview (1200 x 630) | `classyquiz-social-card.svg` | | |

- **`-dark` files** have a light hat and wordmark, and a slightly wider band
  gap, because light on dark reads heavier.
- **`-inline` files** paint the hat and wordmark in `currentColor`. They
  carry `aria-label` and no ids, so the mark can appear twice on a page.
  `currentColor` only resolves inline. In an `<img>` it falls back to
  black, so use the light or dark file there.
- **The face stays fixed**: the orange, the white face, and the eyes and
  nose (`#1D1D1B`) are the same in every colour file. They sit on orange or
  white, so they never follow the theme.
- **The black and white cuts are different drawings, not recolours.** Black
  is for light grounds only, because its face is a hole. White is for dark
  grounds only: a light fox with a dark line round the face, and dark eyes
  and nose.

## Browser icons (`web/`)

- `favicon.svg` is the 16-grid drawing, its hat switched by
  `prefers-color-scheme`; served as it is.
- `favicon.ico` holds three renders: `svg/classyquiz-symbol-16.svg` at 16,
  `svg/classyquiz-symbol-32.svg` at 32 and `web/favicon-48.svg` (the master,
  tight) at 48.
- `apple-touch-icon.png` is `web/touch-icon.svg`, the colour fox on a paper
  tile (`#FBF8F2`), rendered at 180. A tile is only for app icons.
- The build renders no rasters: any SVG renderer that keeps the geometry
  does (cairosvg, rsvg-convert, Inkscape, a headless browser).
- **Dark mode**: inline `currentColor` follows the page's switch, including
  an opt-out such as `data-theme="light"`. An `<img>` or `<picture>` with a
  media query, and `favicon.svg`, follow only the browser's scheme.

## Minimum size

- **Colour master** (and lockups built on it): the fox at least 48 px tall
  on screen, or 12 mm in print.
- **Smaller**: from 24 to 47 px, the 32-grid files (sharpest at exactly
  32). Below 24 px, the 16-grid files, made for exactly 16.
- **One-colour black and white**: at least 48 px or 12 mm. No small
  one-colour cut exists.

## Colour

| Name | HEX | RGB | Role |
|---|---|---|---|
| Fox orange | `#E26B22` | 226 107 34 | head. 3.1:1 on the light page, 5.4:1 on the dark one |
| Ink | `#1D1D1B` | 29 29 27 | hat and wordmark on light (the site's light `--fg`), eyes and nose everywhere |
| Night ink | `#ECEBE6` | 236 235 230 | hat and wordmark on dark (the site's dark `--fg`) |
| White | `#FFFFFF` | 255 255 255 | the face, all grounds |
| Paper | `#FBF8F2` | 251 248 242 | tile behind app icons and the social card (the site's light `--bg`) |

- **The orange** is a shade deeper than the avatar's `#E8742A`, so the
  head's edge reaches 3:1 on the light page.
- **Print**: CMYK for the orange is about 0 / 53 / 85 / 11, a naive
  conversion that needs a press proof. No Pantone match has been made.
- **Answer colours** (red, blue, yellow, green) carry meaning on the wall,
  so none of them is in the mark. Don't add them: no red hat band as on
  the avatar, and no answer colour as a ground.

## Wordmark

"classyQuiz" in Rubik Bold (SIL Open Font License 1.1) as outlines. It
uses tracking −12/1000 and Rubik's own −21 kern on "sy", with no other
changes. The outlines need no webfont.
