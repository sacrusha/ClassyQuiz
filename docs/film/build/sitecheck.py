#!/usr/bin/env python3
"""Checks the film's site version in the real site, under the site's own headers.

A fresh copy of the repo, site/classyquiz-film-page.patch applied, the files
sitebuild.py made copied in, `npm run check`, the tests and the site's build;
dist/ served with the headers the build writes (dist/_headers, the CSP among
them); then Chromium, desktop and phone:

  - before any press: the poster picture shows, film.js is not fetched, the
    page's HTML holds none of the film's words, nothing is a data: URI;
  - ▶: film.js loads, the picture is replaced, the film plays; the live poster
    frame against the picture (mean difference per pixel);
  - a chapter as the first press starts there; German chapters come from the page;
  - film.js blocked: the picture stays, a later press loads it;
  - scripts off: the picture still shows;
  - the rest of the landing (Build, Run, the guidance) is unchanged against
    the unpatched site: every element's computed style;
  - no CSP violation, console error or page error anywhere.

usage: sitecheck.py [OUTDIR]   (screenshots go to OUTDIR, default /tmp/sitecheck)
"""
import http.server, json, os, pathlib, shutil, subprocess, sys, threading
from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path('/home/claude/src/ClassyQuiz')
WORK = pathlib.Path('/tmp/sitecheck-repo')
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/sitecheck'); OUT.mkdir(parents=True, exist_ok=True)
FILM_WORDS = ['Which number does the arrow show', 'Let the class in', '646 000', 'Big numbers on the number line', 'Setting up a visualizer mockup', 'Reading an arrow']
problems = []


def sh(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f'{cmd} failed:\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}')
    return r.stdout


def prepare(work=WORK, patched=True):
    shutil.rmtree(work, ignore_errors=True)
    shutil.copytree(REPO, work, ignore=shutil.ignore_patterns('node_modules', 'dist'))
    src = work / 'src'
    if not patched:
        sh('npm ci --no-audit --no-fund && node scripts/build.mjs', src)
        return src / 'dist'
    sh(f'git apply {HERE / "site/classyquiz-film-page.patch"}', work)
    shutil.copytree(HERE / 'site/public', src / 'public', dirs_exist_ok=True)
    sh('npm ci --no-audit --no-fund', src)
    sh('npm run check', src)
    out = sh('node --test 2>&1 | grep -E "^# (pass|fail)"', src)
    print(out.strip().replace('\n', ', '))
    if '# fail 0' not in out:
        problems.append('tests: ' + out)
    sh('node scripts/build.mjs', src)
    return src / 'dist'


def headers_for(dist):
    """dist/_headers, as Cloudflare Pages reads it: path patterns, each with its header lines."""
    rules, cur = [], None
    for line in (dist / '_headers').read_text().splitlines():
        if not line.strip():
            continue
        if not line.startswith(' '):
            cur = (line.strip(), []); rules.append(cur)
        else:
            k, v = line.strip().split(':', 1); cur[1].append((k.strip(), v.strip()))
    def match(path):
        hs = []
        for pat, h in rules:
            if pat == '/*' or (pat.endswith('/*') and path.startswith(pat[:-1])) or pat == path:
                hs += h
        return hs
    return match


def serve(dist, port=0):
    match = headers_for(dist)
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=str(dist), **k)
        def end_headers(self):
            for k, v in match(self.path.split('?')[0]): self.send_header(k, v)
            super().end_headers()
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f'http://127.0.0.1:{srv.server_address[1]}'


WATCH = '''window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));'''


def page(b, mode, js=True):
    ctx = b.new_context(**({'viewport': {'width': 390, 'height': 844}, 'device_scale_factor': 3, 'is_mobile': True, 'has_touch': True} if mode == 'phone'
                           else {'viewport': {'width': 1300, 'height': 900}}), java_script_enabled=js)
    pg = ctx.new_page()
    pg.add_init_script(WATCH)
    log = {'errors': [], 'requests': []}
    pg.on('console', lambda m: log['errors'].append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: log['errors'].append('PAGEERROR ' + str(e)))
    pg.on('request', lambda r: log['requests'].append(r.url))
    return ctx, pg, log


def shot(pg, name, mode):
    f = OUT / f'{mode}-{name}.png'
    pg.locator('.cqf-stage').screenshot(path=str(f))
    im = Image.open(f).convert('RGB')
    if mode == 'phone':
        im = im.resize((im.width // 3, im.height // 3), Image.LANCZOS)
    return im


def wait_until(pg, expr, timeout=10):
    """Polled from here: the site's CSP (no eval) stops Playwright's wait_for_function."""
    import time
    end = time.time() + timeout
    while time.time() < end:
        if pg.evaluate(expr): return
        pg.wait_for_timeout(50)
    raise TimeoutError(expr)


def diff(a, b):
    b = b.resize(a.size)
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3


def check(url, mode):
    with sync_playwright() as p:
        b = p.chromium.launch()
        # 1. before any press, then ▶
        ctx, pg, log = page(b, mode)
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        html = pg.evaluate('document.documentElement.outerHTML')
        for w in FILM_WORDS:
            if w in html: problems.append(f'{mode}: the page HTML holds the film\'s words "{w}"')
        raw = open(WORK / 'src/dist/index.html').read()
        if 'data:' in raw.replace('data-', ''): problems.append(f'{mode}: data: in index.html')
        info = pg.evaluate('''() => { const i = document.querySelector('#cqfilm img'); const s = document.querySelector('.cqf-stage').getBoundingClientRect();
          return { src: i && i.currentSrc, w: i && i.naturalWidth, stage: [s.width, s.height], film: [...document.scripts].some(x => x.src.includes('film.js')) }; }''')
        print(f'{mode}: before ▶: poster {info["src"].split("/")[-1]} ({info["w"]} px wide) on a stage of {info["stage"][0]:.0f} x {info["stage"][1]:.0f} CSS px')
        if not info['w']: problems.append(f'{mode}: poster not loaded')
        if any('film.js' in r for r in log['requests']): problems.append(f'{mode}: film.js fetched before a press')
        before_reqs = len(log['requests'])
        pg.screenshot(path=str(OUT / f'{mode}-page.png'))  # the landing's first screen, the film in the strip's place
        pg.add_style_tag(content='.cqf-big { visibility: hidden }')  # the same frame without ▶, which goes when the film plays
        poster_im = shot(pg, 'poster-picture', mode)
        pg.add_style_tag(content='.cqf-big { visibility: visible }')
        shot(pg, 'poster-with-play', mode)
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        pg.wait_for_timeout(800)
        st = pg.evaluate('''() => ({ img: !!document.querySelector('#cqfilm img'), svg: !!document.querySelector('.cqf-stage > svg'), time: document.querySelector('.cqf-time').textContent, big: document.querySelector('.cqf-big').hidden })''')
        after = log['requests'][before_reqs:]
        print(f'{mode}: after ▶: fetched {[u.split("/")[-1] for u in after]}; picture left: {st["img"]}; film svg: {st["svg"]}; clock {st["time"]}')
        if st['img'] or not st['svg']: problems.append(f'{mode}: picture not replaced by the film')
        if not any(u.endswith('/js/film.js') for u in after): problems.append(f'{mode}: film.js not fetched on ▶')
        shot(pg, 'playing', mode)
        pg.evaluate('window.cqFilm.render(window.cqFilm.poster)')
        live = shot(pg, 'poster-live', mode)
        d = diff(poster_im, live)
        print(f'{mode}: poster picture against the live poster frame: mean difference {d:.2f} of 255 per channel')
        ImageChops.difference(poster_im, live.resize(poster_im.size)).point(lambda v: min(255, v * 4)).save(OUT / f'{mode}-poster-diff.png')
        csp = pg.evaluate('window.__csp')
        if csp: problems.append(f'{mode}: CSP violations {csp}')
        if log['errors']: problems.append(f'{mode}: console {log["errors"]}')
        if any(u.startswith('data:') for u in log['requests']): problems.append(f'{mode}: data: requests')
        ctx.close()
        # 2. a chapter as the first press, in German
        ctx, pg, log = page(b, mode)
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        pg.select_option('header select', 'de')
        names = pg.evaluate("[...document.querySelectorAll('.cqf-ch button')].map(b => b.textContent)")
        pg.click('.cqf-ch button[data-t=capTap]')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        pg.wait_for_timeout(300)
        tm = pg.evaluate("document.querySelector('.cqf-time').textContent")
        on = pg.evaluate("[...document.querySelectorAll('.cqf-ch button.on')].map(b => b.textContent)")
        print(f'{mode}: German chapters {names}; first press "{names[-1]}" plays at {tm}, highlighted {on}')
        if tm != '0:38': problems.append(f'{mode}: chapter start {tm}, not 0:38')
        if pg.evaluate('window.__csp') or log['errors']: problems.append(f'{mode}: chapter run: {pg.evaluate("window.__csp")} {log["errors"]}')
        ctx.close()
        # 3. film.js blocked, then allowed
        ctx, pg, log = page(b, mode)
        blocked = {'on': True}
        pg.route('**/js/film.js', lambda r: r.abort() if blocked['on'] else r.continue_())
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        pg.click('.cqf-big'); pg.wait_for_timeout(800)
        st = pg.evaluate("({ img: !!document.querySelector('#cqfilm img'), loading: document.getElementById('cqfilm').classList.contains('loading') })")
        blocked['on'] = False
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        print(f'{mode}: film.js blocked: picture stays {st["img"]}, still loading {st["loading"]}; a second press loads it')
        if not st['img'] or st['loading']: problems.append(f'{mode}: blocked film.js left {st}')
        ctx.close()
        # 4. scripts off
        ctx, pg, log = page(b, mode, js=False)
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        f = OUT / f'{mode}-noscript.png'; pg.locator('.cqf-stage').screenshot(path=str(f))
        w = pg.evaluate("document.querySelector('#cqfilm img').naturalWidth")
        print(f'{mode}: scripts off: poster {w} px wide, screenshot {f.name}')
        if not w: problems.append(f'{mode}: scripts off: no poster')
        ctx.close()
        b.close()


STYLES = """() => [...document.querySelectorAll('.cols, .cols *, .guide, .guide *')].map(e => { const c = getComputedStyle(e);
  return [e.tagName, e.className, ...['display', 'font', 'color', 'background-color', 'border', 'border-radius', 'padding', 'margin', 'width', 'grid-template-columns', 'text-decoration-line'].map(k => c.getPropertyValue(k))].join('|'); })"""


def rest_unchanged(dist0, dist, port=8765):
    """Everything below the film (Build, Run, the guidance) against the site without it: every element's computed style.
    One port for both: the page shows its own address."""
    got = {}
    for d, name in ((dist0, 'before'), (dist, 'after')):
        srv, u = serve(d, port)
        with sync_playwright() as p:
            b = p.chromium.launch()
            for mode, vp in (('desk', {'width': 1300, 'height': 900}), ('phone', {'width': 390, 'height': 844})):
                pg = b.new_page(viewport=vp)
                pg.goto(u + '/'); pg.wait_for_load_state('networkidle')
                got[mode, name] = pg.evaluate(STYLES)
                pg.locator('.cols').screenshot(path=str(OUT / f'{mode}-cols-{name}.png')); pg.close()
            b.close()
        srv.shutdown(); srv.server_close()
    for mode in ('desk', 'phone'):
        a, c = got[mode, 'before'], got[mode, 'after']
        bad = [(x, y) for x, y in zip(a, c) if x != y]
        print(f'{mode}: Build, Run and the guidance against the site without the film: {len(a)} elements, {len(bad) + abs(len(a) - len(c))} with another style')
        if bad or len(a) != len(c): problems.append(f'{mode}: the landing below the film changed: {bad[:3]}')


dist0 = prepare(pathlib.Path('/tmp/sitecheck-repo0'), patched=False)
dist = prepare()
rest_unchanged(dist0, dist)
srv, url = serve(dist)
print('CSP:', [v for k, v in headers_for(dist)('/') if k == 'Content-Security-Policy'][0])
for mode in ('desk', 'phone'):
    check(url, mode)
srv.shutdown()
print('PROBLEMS:' if problems else 'no problems', *problems, sep='\n  ')
