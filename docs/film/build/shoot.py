#!/usr/bin/env python3
"""Renders stills of the film at given times and a contact sheet.

usage: shoot.py OUTDIR [phone|desk] t1 t2 ...   (no times: every 1 s)
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
mode = sys.argv[2] if len(sys.argv) > 2 else 'desk'
times = [float(x) for x in sys.argv[3:]] or [x * 1.0 for x in range(0, 61)]
page_url = 'file://' + str(pathlib.Path(__file__).parent / 'index.html')

with sync_playwright() as p:
    b = p.chromium.launch()
    if mode == 'phone':
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3)
    else:
        ctx = b.new_context(viewport={'width': 1300, 'height': 900}, device_scale_factor=1)
    pg = ctx.new_page()
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto(page_url)
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
    print('errors:', errs[:20])
    b.close()
