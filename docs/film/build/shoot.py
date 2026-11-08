"""Renders stills of the film at given times and a contact sheet, in the installed Edge.
Run: py -I shoot.py [--page FILE] [--lang de|en|fr|it] [--out DIR] [phone|desk] [t1 t2 ...]   (no times: every 1 s)
  --page  the standalone film page (default: .tmp/film/index.html, made by build.py)
  --lang  the film's language (default: the page's, English)
  --out   where the stills go (default: .tmp/film/shots, or .tmp/film/shots-<lang> with --lang, at the repo root, which git ignores)
"""
import sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
sys.dont_write_bytecode = True  # no __pycache__ in the tree
sys.path.insert(0, str(HERE))
from build import PAGE, ROOT, film_length, launch  # noqa: E402
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

args = sys.argv[1:]
def opt(name, default, path=True):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return pathlib.Path(v).resolve() if path else v
    return default
page_path = opt('--page', PAGE)
lang = opt('--lang', None, path=False)
out = opt('--out', ROOT / '.tmp' / 'film' / (f'shots-{lang}' if lang else 'shots')); out.mkdir(parents=True, exist_ok=True)
mode = args.pop(0) if args and args[0] in ('phone', 'desk') else 'desk'
times = [float(x) for x in args] or [x * 1.0 for x in range(0, film_length() + 1)]

with sync_playwright() as p:
    b = launch(p)
    if mode == 'phone':
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3)
    else:
        ctx = b.new_context(viewport={'width': 1300, 'height': 900}, device_scale_factor=1)
    pg = ctx.new_page()
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto(page_path.as_uri() + (f'?lang={lang}' if lang else ''))
    pg.wait_for_function('window.cqFilm', timeout=10000)
    stage = pg.locator('.cqf-stage')
    files = []
    for t in times:
        pg.evaluate(f'window.cqFilm.render({t})')
        f = out / f'{mode}-{t:05.1f}.png'
        stage.screenshot(path=str(f))
        files.append((t, f))
    if mode == 'desk' and len(files) > 1:
        ims = [Image.open(f) for _, f in files]
        w, h = 240, 135
        cols = 8
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * w, rows * (h + 16)), 'white')
        d = ImageDraw.Draw(sheet)
        for i, ((t, _), im) in enumerate(zip(files, ims)):
            x, y = (i % cols) * w, (i // cols) * (h + 16)
            sheet.paste(im.convert('RGB').resize((w - 4, h - 4)), (x + 2, y + 14))
            d.text((x + 4, y), f'{t:.1f}s', fill='black')
        sheet.save(out / 'contact.png')
    print('stills in', out, '' if not lang else f'(film in {pg.evaluate("window.cqFilm.lang")})')
    print('errors:', errs[:20])
    b.close()
