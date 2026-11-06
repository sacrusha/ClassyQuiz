"""Builds the film's version for classyquiz.pages.dev straight into the site's source (src/).
Run: py -I sitebuild.py [--no-poster]   (builds the standalone page first; the pictures are rendered from it in the installed Edge;
  --no-poster: film.js only, no pictures)

  src/public/js/film.js                the film; assets are the site's own files (no data:)
  src/public/landing/film-<lang>.webp  the poster frame per language (de en fr it), 1600 x 900, rendered from the film,
  src/public/landing/film-<lang>-800.webp    and 800 x 450
  src/public/landing/film-<still>[-<lang>].webp  the chapters' stills, 192 x 108 (STILLS below)
  (src/client/film-poster.ts, the page side, is written by hand: the first ▶ or a chapter loads film.js;
  it and client/home.ts show the pictures of the page's language)

The site's CSP (src/scripts/build.mjs): scripts only from its own files, images
'self' and blob:, fonts from default-src 'self'. sitecheck.py checks it there.
"""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.dont_write_bytecode = True  # no __pycache__ in the tree
sys.path.insert(0, str(HERE))
import build  # noqa: E402
from build import film_source, PUB, REPO, PAGE, launch  # noqa: E402


def film_js():
    assets = {
        'sheet1': '/landing/sheet-1.webp',
        'sheet2': '/landing/sheet-2.webp',
        'lockup': (PUB / 'brand/classyquiz-horizontal-32-inline.svg').read_text(encoding='utf-8').strip(),
        'fox': (PUB / 'brand/classyquiz-symbol-colour.svg').read_text(encoding='utf-8').strip(),
    }
    js = film_source(json.dumps(assets))
    if re.search(r'data:[a-z]+/', js):
        raise SystemExit('film.js for the site holds a data: URI')
    head = ('/* classyQuiz film, built by the film project\'s sitebuild.py from film.js; '
            'loaded by client/film-poster.ts on the first ▶. Edit the source, not this. */\n')
    return head + js


LANGS = ('de', 'en', 'fr', 'it')
# The chapters' stills (index.html, the chapter list): one moment of each chapter that shows what its caption says
# without words to read: [the chapter's key, the file's name, the film time, whether the frame has words of a language,
# the part of the frame shown (x, y, width in the film's 1600 x 900; 16:9), so a thumbnail's few pixels go to the subject].
# The sheets on the desk have none, so one picture serves all four languages; the others have the chat's, the Run box's
# or the quiz's words, too small to read but in the page's language all the same.
STILLS = [('capSheet', 'sheet', 3.3, False, None), ('capAi', 'ai', 12.5, True, (200, 130, 1200)), ('capZip', 'zip', 20.95, True, None),
          ('capWall', 'wall', 33.5, True, (440, 30, 1100)), ('capTap', 'tap', 40.0, True, None)]
STILL_SIZE = (192, 108)   # 2x of the desktop list's 88 x 50 CSS px (index.html)


def frames(lang, times):
    """Frames of the standalone page in `lang`, the stage at 1600 CSS px, no rounding: PIL images, 1600 x 900."""
    from playwright.sync_api import sync_playwright
    from PIL import Image
    import io
    out = []
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_page(viewport={'width': 1700, 'height': 1000})
        pg.goto(PAGE.as_uri() + '?lang=' + lang)
        pg.wait_for_function('window.cqFilm')
        if pg.evaluate('window.cqFilm.lang') != lang:
            raise SystemExit(f'the standalone page built the film in {pg.evaluate("window.cqFilm.lang")}, not {lang}')
        pg.add_style_tag(content='.cqf-page{max-width:none;padding:0}.cqf{display:block}.cqf-stage{width:1600px;border-radius:0}.cqf-big{display:none}')
        for t in times:
            pg.evaluate(f'window.cqFilm.render({t})')
            im = Image.open(io.BytesIO(pg.locator('.cqf-stage > svg[role=img]').screenshot())).convert('RGB')
            assert im.size == (1600, 900), im.size
            out.append(im)
        b.close()
    return out


def pictures(widths=(1600, 800), quality=82, still_quality=72):
    """Per language: the poster frame (film-<lang>.webp, -800) and the chapters' stills; a still without words once."""
    from PIL import Image, ImageChops
    land = REPO / 'public/landing'
    def save(im, name, q):
        f = land / name
        im.save(f, 'WEBP', quality=q, method=6)
        print(f.name, f.stat().st_size, 'bytes')
    shared = {}
    for lang in LANGS:
        ims = frames(lang, ['window.cqFilm.poster'] + [x[2] for x in STILLS])
        for w in widths:
            save(ims[0] if w == 1600 else ims[0].resize((w, w * 9 // 16), Image.LANCZOS), f'film-{lang}.webp' if w == 1600 else f'film-{lang}-{w}.webp', quality)
        for (key, name, t, worded, box), im in zip(STILLS, ims[1:]):
            if box:
                x, y, w = box
                im = im.crop((x, y, x + w, y + w * 9 // 16))
            small = im.resize(STILL_SIZE, Image.LANCZOS)
            if worded:
                save(small, f'film-{name}-{lang}.webp', still_quality)
            elif name not in shared:
                shared[name] = im
                save(small, f'film-{name}.webp', still_quality)
            elif ImageChops.difference(shared[name], im).getbbox():
                raise SystemExit(f'the still {name} at {t} s differs between languages: give it one file per language (STILLS)')


def main():
    (REPO / 'public/js').mkdir(parents=True, exist_ok=True)
    (REPO / 'public/landing').mkdir(parents=True, exist_ok=True)
    js = film_js()
    (REPO / 'public/js/film.js').write_text(js, encoding='utf-8', newline='\n')
    print('film.js', len(js.encode()), 'bytes')
    if '--no-poster' not in sys.argv:
        build.main()   # the pictures come from a fresh standalone page
        pictures()


if __name__ == '__main__':
    main()
