#!/usr/bin/env python3
"""Builds the classyQuiz film animatic as one HTML page (index.html).

The page carries: film.css, the assets (the site's Rubik, the two sheets, the
brand marks) as data: URIs in one JS object, the avatar drawings taken from
the repo's client/look.ts, and film.js. On the site the same film.js would
read the assets from the site's own files instead (see the header of film.js).
"""
import base64, re, pathlib

HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path('/home/claude/src/ClassyQuiz/src')
PUB = REPO / 'public'


def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def look_js():
    """The avatars from client/look.ts, types stripped, as plain JS."""
    src = (REPO / 'client/look.ts').read_text()
    start = src.index('const AVATAR_COLOURS')
    end = src.index('/** A background shape alone')
    s = src[start:end]
    s = s.replace('const ANIMALS: (() => string)[] =', 'const ANIMALS =')
    s = s.replace('const BACKGROUNDS: ((c: string) => string)[] =', 'const BACKGROUNDS =')
    s = re.sub(r'const HATS: \{[^}]*\}\[\] =', 'const HATS =', s)
    s = s.replace('const SEATS: [number, number, number, number][] =', 'const SEATS =')
    s = s.replace('(cx: number, cy: number, outer: number, inner: number)', '(cx, cy, outer, inner)')
    s = s.replace('(n: number, cx: number, cy: number, d: number, r: number, attrs = "")', '(n, cx, cy, d, r, attrs = "")')
    s = s.replace('(x: number, y: number, r = 4.2)', '(x, y, r = 4.2)')
    s = s.replace('(y = 52, dx = 11, r?: number)', '(y = 52, dx = 11, r)')
    s = s.replace('(c) =>', '(c) =>')
    s = s.replace('function hatOn(animal: number, hat: number): string', 'function hatOn(animal, hat)')
    s = s.replace('const lookIndex = (i: number | undefined, n: number): number =>', 'const lookIndex = (i, n) =>')
    s = s.replace('export function avatarSvg(av: Avatar, label = true): string', 'function avatarSvg(av, label = true)')
    s = s.replace('BACKGROUND_COUNT', '6').replace('HAT_COUNT', '9')
    s = s.replace('(_, i)', '(_, i)')
    if re.search(r':\s*(number|string|Avatar)\b', s):
        raise SystemExit('type annotation left in look.ts extract: ' + re.search(r'.{30}:\s*(number|string|Avatar)\b.{10}', s).group(0))
    return '/* From client/look.ts (types stripped by build.py). */\n' + s


def main():
    assets = {
        'rubik': data_uri(PUB / 'fonts/rubik-bold-1.100.woff2', 'font/woff2'),
        'sheet1': data_uri(PUB / 'landing/sheet-1.webp', 'image/webp'),
        'sheet2': data_uri(PUB / 'landing/sheet-2.webp', 'image/webp'),
        'lockup': (PUB / 'brand/classyquiz-horizontal-32-inline.svg').read_text().strip(),
        'fox': (PUB / 'brand/classyquiz-symbol-colour.svg').read_text().strip(),
    }
    import json
    css = (HERE / 'film.css').read_text()
    js = (HERE / 'film.js').read_text()
    js = js.replace('/*@LOOK@*/', look_js())
    font_face = ('@font-face{font-family:"Rubik";src:url("%s") format("woff2");'
                 'font-weight:700;font-style:normal;font-display:block}\n' % assets['rubik'])
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>classyQuiz film, animatic</title>
<style>
{font_face}{css}
</style>
</head>
<body>
<main class="cqf-page"><div id="cqfilm"></div></main>
<script>window.CQFILM_ASSETS = {json.dumps(assets)};</script>
<script>
{js}
</script>
</body>
</html>
'''
    (HERE / 'index.html').write_text(html)
    print('index.html', len(html), 'bytes')


if __name__ == '__main__':
    main()
