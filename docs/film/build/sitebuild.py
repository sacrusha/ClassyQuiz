"""Builds the film's version for classyquiz.pages.dev straight into the site's source (src/).
Run: py -I sitebuild.py [--no-poster]   (builds the standalone page first; the pictures are rendered from it in the installed Edge;
  --no-poster: film.js only, no pictures)

  src/public/js/film.js                the film; assets are the site's own files (no data:)
  src/public/landing/film-<lang>.webp  the poster frame per language (de en fr it), 1600 x 900, rendered from the film,
  src/public/landing/film-<lang>-800.webp    and 800 x 450
  (src/client/film-poster.ts, the page side, is written by hand: the first ▶ or a move of the time bar loads film.js;
  it and client/home.ts show the poster of the page's language)

index.html's time bar works before film.js is there, so it carries the film's length (its max, and the length shown
beside it); this script refuses to build while they differ from film.js's.

The site's CSP (src/scripts/build.mjs): scripts only from its own files, images
'self' and blob:, fonts from default-src 'self'. sitecheck.py checks it there.
"""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.dont_write_bytecode = True  # no __pycache__ in the tree
sys.path.insert(0, str(HERE))
import build  # noqa: E402
from build import film_length, film_source, PUB, REPO, PAGE, launch  # noqa: E402


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


def pictures(widths=(1600, 800), quality=82):
    """Per language: the poster frame, film-<lang>.webp and -800."""
    from PIL import Image
    land = REPO / 'public/landing'
    for lang in LANGS:
        im = frames(lang, ['window.cqFilm.poster'])[0]
        for w in widths:
            f = land / (f'film-{lang}.webp' if w == 1600 else f'film-{lang}-{w}.webp')
            (im if w == 1600 else im.resize((w, w * 9 // 16), Image.LANCZOS)).save(f, 'WEBP', quality=quality, method=6)
            print(f.name, f.stat().st_size, 'bytes')


def length_on_page():
    """index.html's time bar against film.js: its max and the length shown beside it are the film's DUR."""
    dur = film_length()
    html = (REPO / 'public/index.html').read_text(encoding='utf-8')
    want = (f'type="range" min="0" max="{dur}"', f'<span class="cqf-dur"> / {dur // 60}:{dur % 60:02d}</span>')
    missing = [w for w in want if w not in html]
    if missing:
        raise SystemExit(f'index.html: the time bar does not carry the length of the film ({dur} s): no {missing}')


def main():
    (REPO / 'public/js').mkdir(parents=True, exist_ok=True)
    (REPO / 'public/landing').mkdir(parents=True, exist_ok=True)
    length_on_page()
    js = film_js()
    (REPO / 'public/js/film.js').write_text(js, encoding='utf-8', newline='\n')
    print('film.js', len(js.encode()), 'bytes')
    if '--no-poster' not in sys.argv:
        build.main()   # the pictures come from a fresh standalone page
        pictures()


if __name__ == '__main__':
    main()
