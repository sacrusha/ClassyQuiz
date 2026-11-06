#!/usr/bin/env python3
"""Builds the film's version for classyquiz.pages.dev into site/.

  site/public/js/film.js            the film; assets are the site's own files (no data:)
  site/public/landing/film-en.webp  the poster frame, 1600 x 900, rendered from the film
  site/public/landing/film-en-800.webp
  site/client/film-poster.ts        the page side: ▶ or a chapter loads film.js (imported by home.ts)
  site/classyquiz-film.patch        all of it applied to the repo (made by sitecheck.py)

The site's CSP (src/scripts/build.mjs): scripts only from its own files, images
'self' and blob:, fonts from default-src 'self'. sitecheck.py checks it there.
"""
import json, pathlib, re, sys
from build import look_js, PUB, HERE

OUT = HERE / 'site'


def film_js():
    assets = {
        'sheet1': '/landing/sheet-1.webp',
        'sheet2': '/landing/sheet-2.webp',
        'lockup': (PUB / 'brand/classyquiz-horizontal-32-inline.svg').read_text().strip(),
        'fox': (PUB / 'brand/classyquiz-symbol-colour.svg').read_text().strip(),
    }
    js = (HERE / 'film.js').read_text()
    js = js.replace('/*@LOOK@*/', look_js())
    js = js.replace('/*@ASSETS@*/ window.CQFILM_ASSETS || {}', json.dumps(assets))
    if re.search(r'data:[a-z]+/', js):
        raise SystemExit('film.js for the site holds a data: URI')
    head = ('/* classyQuiz film, built by the film project\'s sitebuild.py from film.js; '
            'loaded by client/film-poster.ts on the first ▶. Edit the source, not this. */\n')
    return head + js


def poster(widths=(1600, 800), quality=82):
    """The poster frame from the artifact page itself, the stage at 1600 CSS px, no rounding."""
    from playwright.sync_api import sync_playwright
    from PIL import Image
    import io
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1700, 'height': 1000})
        pg.goto('file://' + str(HERE / 'index.html'))
        pg.wait_for_function('window.cqFilm')
        pg.add_style_tag(content='.cqf-page{max-width:none;padding:0}.cqf{display:block}.cqf-stage{width:1600px;border-radius:0}.cqf-big{display:none}')
        pg.evaluate('window.cqFilm.render(window.cqFilm.poster)')
        png = pg.locator('.cqf-stage > svg[role=img]').screenshot()
        b.close()
    im = Image.open(io.BytesIO(png)).convert('RGB')
    assert im.size == (1600, 900), im.size
    for w in widths:
        name = 'film-en.webp' if w == 1600 else f'film-en-{w}.webp'
        f = OUT / 'public/landing' / name
        (im if w == 1600 else im.resize((w, w * 9 // 16), Image.LANCZOS)).save(f, 'WEBP', quality=quality, method=6)
        print(f, f.stat().st_size, 'bytes')


def main():
    (OUT / 'public/js').mkdir(parents=True, exist_ok=True)
    (OUT / 'public/landing').mkdir(parents=True, exist_ok=True)
    js = film_js()
    (OUT / 'public/js/film.js').write_text(js)
    print('film.js', len(js.encode()), 'bytes')
    if '--no-poster' not in sys.argv:
        poster()


if __name__ == '__main__':
    main()
