"""Builds the classyQuiz film animatic as one standalone HTML page.
Run: py -I build.py [out_file]   (default: .tmp/film/index.html at the repo root, which git ignores;
the page is generated, ~230 KB, and not kept in the tree. shoot.py and sitebuild.py read it from there.)

The page carries: film.css, the assets (the site's Rubik, the two sheets, the Quizmaster's picture, the
brand marks) as data: URIs in one JS object, the avatar drawings taken from
the repo's client/look.ts, the root page's words the film shows (the example
ask, the words of the page's first screen, the chapters' and the player's names) taken from
client/landing-text.ts, and film.js. On the site
the same film.js reads the assets from the site's own files instead (see the
header of film.js). The page opens in English; page.html?lang=de (en, fr, it)
plays the film in that language.
"""
import base64, json, re, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]          # the repo root
REPO = ROOT / 'src'             # the site
PUB = REPO / 'public'
PAGE = ROOT / '.tmp' / 'film' / 'index.html'   # default output, git-ignored


# the picture on the AI's file in the root page's first screen, the Quizmaster's, the tab every visit opens on (src/public/landing/way-*.svg)
WAYS = {'wayQuizmaster': 'way-quizmaster.svg'}


def launch(p):
    """Chromium for the scripts that render the film: the installed Edge (no bundled browser needed)."""
    return p.chromium.launch(channel='msedge')


def film_length():
    """The film's length in whole seconds: DUR in film.js."""
    return int(re.search(r'const W = 1600, H = 900, DUR = (\d+)', (HERE / 'film.js').read_text(encoding='utf-8')).group(1))


def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def look_js():
    """The avatars from client/look.ts, types stripped, as plain JS."""
    src = (REPO / 'client/look.ts').read_text(encoding='utf-8')
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
    s = s.replace('BACKGROUND_COUNT', '6').replace('HAT_COUNT', '9').replace('TOOL_COUNT', '7')
    s = s.replace('(_, i)', '(_, i)')
    if re.search(r':\s*(number|string|Avatar)\b', s):
        raise SystemExit('type annotation left in look.ts extract: ' + re.search(r'.{30}:\s*(number|string|Avatar)\b.{10}', s).group(0))
    return '/* From client/look.ts (types stripped by build.py). */\n' + s


LANDING_KEYS = ('code', 'what', 'getH', 'which', 'subQuizmaster', 'subPeers', 'subSolo', 'unsure', 'gives', 'playThis', 'see', 'run', 'upload', 'drop', 'reading', 'capSheet', 'capAi', 'capZip', 'capWall', 'capTap', 'play', 'pause', 'speed', 'seek')


def landing_text():
    """The root page's own words the film shows, per language, from client/landing-text.ts: the example ask
    (its parts as { s, l }: l 0 is the site's address, other l a labelled part) and the words of the page's first screen,
    so the film types the very sentence the page prints and its phone and laptop show the root page as a visitor sees it; and the
    chapters' names and the player's, which the film shows on the page's time bar."""
    src = (REPO / 'client/landing-text.ts').read_text(encoding='utf-8')
    out = {}
    for lang in ('de', 'en', 'fr', 'it'):
        m = re.search(r'\nconst %s: Text = \{\n(.*?)\n\};\n' % lang, src, re.S)
        if not m:
            raise SystemExit(f'landing-text.ts: no "const {lang}: Text" block')
        block = '\n' + m.group(1)
        a = re.search(r'\n  ask: \[\n(.*?)\n  \],\n', block, re.S)
        if not a:
            raise SystemExit(f'landing-text.ts {lang}: no ask')
        parts = []
        for line in a.group(1).splitlines():
            p = re.fullmatch(r'\s*\{ s: ("(?:[^"\\]|\\.)*")(?:, l: (\d))? \},', line)
            if not p:
                raise SystemExit(f'landing-text.ts {lang}: an ask line the film can\'t read: {line.strip()}')
            parts.append({'s': json.loads(p.group(1)), **({'l': int(p.group(2))} if p.group(2) else {})})
        if [x.get('l') for x in parts if 'l' in x] != [0, 1, 2, 3, 4]:
            raise SystemExit(f'landing-text.ts {lang}: the ask\'s labelled parts are not 0-4 in order')
        words = {'ask': parts}
        for k in LANDING_KEYS:
            v = re.search(r'\n  %s: ("(?:[^"\\]|\\.)*"),' % k, block)
            if not v:
                raise SystemExit(f'landing-text.ts {lang}: no plain string "{k}"')
            words[k] = json.loads(v.group(1))
        out[lang] = words
    return out


def film_source(assets_js):
    """film.js with what the builds fill in: the avatars, the root page's words and the assets (assets_js, a JS expression)."""
    js = (HERE / 'film.js').read_text(encoding='utf-8')
    for mark, value in (('/*@LOOK@*/', look_js()), ('/*@LANDING@*/ {}', json.dumps(landing_text(), ensure_ascii=False)),
                        ('/*@ASSETS@*/ window.CQFILM_ASSETS || {}', assets_js)):
        if js.count(mark) != 1:
            raise SystemExit(f'film.js: the mark {mark} is not there exactly once')
        js = js.replace(mark, value)
    return js


def main(out=None):
    assets = {
        'rubik': data_uri(PUB / 'fonts/rubik-bold-1.100.woff2', 'font/woff2'),
        'sheet1': data_uri(PUB / 'landing/sheet-1.webp', 'image/webp'),
        'sheet2': data_uri(PUB / 'landing/sheet-2.webp', 'image/webp'),
        **{k: data_uri(PUB / f'landing/{f}', 'image/svg+xml') for k, f in WAYS.items()},
        'lockup': (PUB / 'brand/classyquiz-horizontal-32-inline.svg').read_text(encoding='utf-8').strip(),
        'fox': (PUB / 'brand/classyquiz-symbol-colour.svg').read_text(encoding='utf-8').strip(),
    }
    css = (HERE / 'film.css').read_text(encoding='utf-8')
    js = film_source('window.CQFILM_ASSETS || {}')
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
<script>window.CQFILM_ASSETS = {json.dumps(assets)};
/* the film speaks the page's language: ?lang=de (or en, fr, it) sets it here */
(function () {{ var l = new URLSearchParams(location.search).get('lang'); if (l) document.documentElement.lang = l; }})();</script>
<script>
{js}
</script>
</body>
</html>
'''
    out = pathlib.Path(out).resolve() if out else PAGE
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8', newline='\n')
    print(out, len(html.encode()), 'bytes')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
