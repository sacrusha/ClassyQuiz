"""Renders the three pictures of the ways to play beside the film's poster, at a phone's and a desktop's size, in the
installed Edge, for looking at them as the page shows them.
Run: py -I docs/ways/build/sheet.py [--out DIR] [--phone PX] [--desk PX]
  --out    where the renderings go (default: .tmp/ways at the repo root, which git ignores)
  --phone  a picture's width on a phone, in CSS px (default 114)
  --desk   a picture's width on a desktop, in CSS px (default 216)
Writes phone.png (a 390 px wide phone, 3 device px to the CSS px), phone-css.png (the same at 1 to 1, to judge what
reads at that size), desk.png (1 to 1), and phone and desk on the page's dark ground (-dark), each with the poster
above the three pictures, as wide as the three together; and full-<name>.png, each picture at its drawn size.
"""
import pathlib, sys

sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
LANDING = ROOT / 'src' / 'public' / 'landing'
from playwright.sync_api import sync_playwright

args = sys.argv[1:]


def opt(name, default, cast=str):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return cast(v)
    return default


out = pathlib.Path(opt('--out', str(ROOT / '.tmp' / 'ways'))).resolve(); out.mkdir(parents=True, exist_ok=True)
phone_w, desk_w = opt("--phone", 114, int), opt("--desk", 216, int)
NAMES = ['quizmaster', 'peers', 'solo']
GAP = {'phone': 9, 'desk': 24}
missing = [n for n in NAMES if not (LANDING / f'way-{n}.svg').exists()]
if missing:
    raise SystemExit(f'sheet.py: no way-{missing[0]}.svg in {LANDING}; run ways.py first')


def page(w, gap, dark):
    bg, fg = ('#171716', '#ecebe6') if dark else ('#fbf8f2', '#1d1d1b')
    imgs = ''.join(f'<figure><img src="{(LANDING / f"way-{n}.svg").as_uri()}" width="{w}"><figcaption>{n}</figcaption></figure>' for n in NAMES)
    row = 3 * w + 2 * gap
    poster = (LANDING / ('film-en-800.webp' if row <= 400 else 'film-en.webp')).as_uri()
    return f'''<!doctype html><meta charset="utf-8"><style>
      body {{ margin: 0; background: {bg}; color: {fg}; font: 12px system-ui; }}
      .s {{ display: inline-block; padding: 16px; }}
      .poster {{ display: block; width: {row}px; border-radius: 6px; margin-bottom: 14px; }}
      .row {{ display: flex; gap: {gap}px; }} figure {{ margin: 0; }} img {{ display: block; border-radius: 6px; }}
      figcaption {{ margin-top: 4px; opacity: .7; }}
    </style><div class="s"><img class="poster" src="{poster}">
    <div class="row">{imgs}</div></div>'''


with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    for mode, w, vp, dpr, tag in (('phone', phone_w, 390, 3, ''), ('phone', phone_w, 390, 1, '-css'), ('desk', desk_w, 1300, 1, '')):
        for dark in (False, True):
            if dark and tag:
                continue
            ctx = b.new_context(viewport={'width': vp, 'height': 900}, device_scale_factor=dpr)
            pg = ctx.new_page()
            f = out / f'{mode}{tag}{"-dark" if dark else ""}.png'
            html = f.with_suffix('.html')
            html.write_text(page(w, GAP[mode], dark), encoding='utf-8')
            pg.goto(html.as_uri())
            pg.wait_for_load_state('networkidle')
            pg.locator('.s').screenshot(path=str(f))
            print(f)
            ctx.close()
    # each picture at its full size, for the details
    ctx = b.new_context(viewport={'width': 700, 'height': 450}, device_scale_factor=1)
    pg = ctx.new_page()
    for n in NAMES:
        pg.goto((LANDING / f'way-{n}.svg').as_uri())
        f = out / f'full-{n}.png'
        pg.screenshot(path=str(f), clip={'x': 0, 'y': 0, 'width': 640, 'height': 400})
        print(f)
    b.close()
