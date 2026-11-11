#!/usr/bin/env python3
"""Checks the film's site version in the real site, under the site's own headers.
Run: py -I sitecheck.py [OUTDIR]   (screenshots go to OUTDIR, default .tmp/sitecheck/shots at the repo root;
needs Node and npm, and Playwright with the installed Edge)

The site as the working tree has it (src/, film included, copied to .tmp/sitecheck/work) against the same
site as it is on `main` (before this change), `main` as `git archive` gives it (.tmp/sitecheck/main; nothing in git changes).
Both get the working tree's src/node_modules (a junction; npm ci only if the lock files differ or there is none).
The working copy: `npm run check`, the tests and the site's build; the baseline: the build. dist/ is
served with the headers the build writes (dist/_headers, the CSP among them); then Edge, desktop and phone:

  - before any press: the poster picture shows, film.js is not fetched, the
    page's HTML holds none of the film's words, nothing is a data: URI; the speed
    button cycles without loading anything;
  - ▶: film.js loads, the picture is replaced, the film plays; the live poster
    frame against the picture (mean difference per pixel);
  - the time bar moved as the first press loads the film and shows that moment, paused; the player's
    names are the page's (German); its chapter ticks are there once;
  - a German page shows the German poster (src and srcset) before any press; the film built there is
    German, its ask the page's; a switch to French while it plays goes back to the poster, in French,
    the bar at 0, and the next press builds one French film (nothing of the German left or doubled);
  - film.js blocked: the picture stays, a later press loads it;
  - scripts off: the picture still shows;
  - film.js loads but can't draw the film once: the picture stays, the next press draws it;
  - desktop: ▶ by keyboard leaves the focus on the bar's play/pause; the time bar's name and spoken
    value (time and chapter), the address the browser opened; one animation loop however often the bar
    is moved and played; a drag shows the chapter's name over the thumb, the release hides it; Space on
    the page and in the code box and the arrows on the ways' tabs stay theirs, the stage and the time bar
    take the film's keys; scrolled out
    of view or in a hidden tab it pauses and stays paused; at the end the page's replay icon (named in German)
    stands in the band under the end card's address and plays it from the start, the focus on play/pause;
  - the arrangement: desktop, upright phone and a phone held sideways (844 x 390, 740 x 360, 915 x 412): the bar under
    the film and as wide, on one row as on a desktop except on the upright phone, where the time bar has a row of its
    own; the time bar at least 150 px wide; no sideways scroll;
  - full screen, desktop and phone, the browser's and the fallback fixed over the viewport (forced by hiding the
    Fullscreen API): the film letterboxed 16:9 as large as the screen allows, the bar under it, the focus on the stage,
    the page under it not scrolling, the film's keys working, Tab going round the player; ended by Esc (the fallback),
    by the browser (the API's exitFullscreen, as its Esc does) or by the button, the page back where it was and the focus
    on the button; the phone turned sideways in it gives the big film;
  - every language (desktop): each ask typed out before its send, no line wider than its box, no
    fitted text shrunk below 3/4; languages whose film words are drafts are named;
  - the page around the film (the two steps, the foot, the guidance) is unchanged against
    `main`'s: every element's computed style;
  - no CSP violation, console error or page error anywhere.
"""
import http.server, io, json, os, pathlib, re, shutil, subprocess, sys, tarfile, threading
sys.stdout.reconfigure(encoding='utf-8')
HERE = pathlib.Path(__file__).resolve().parent
sys.dont_write_bytecode = True  # no __pycache__ in the tree
sys.path.insert(0, str(HERE))
from build import ROOT, film_length, launch  # noqa: E402
from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

TMP = ROOT / '.tmp' / 'sitecheck'
WORK = TMP / 'work'          # the working tree's src/, copied
BASE = TMP / 'main'          # main's src/
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else TMP / 'shots').resolve(); OUT.mkdir(parents=True, exist_ok=True)
FILM_WORDS = ['Which number does the arrow show', 'Let everyone in', 'How will it be played', '646 000', 'Big numbers on the number line', 'Setting up a visualizer mockup', 'Reading an arrow']
problems = []
DUR = film_length()
CLOCK = lambda x: f'{x // 60}:{x % 60:02d}'
NPM = shutil.which('npm')
NODE = shutil.which('node')
GIT = shutil.which('git')


def run(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        raise SystemExit(f'{cmd} failed:\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}')
    return r.stdout


def clear(d):
    """Remove a prepared folder; the node_modules junction goes first, so rmtree never reaches the real one."""
    nm = d / 'src' / 'node_modules'
    if nm.is_junction():
        os.rmdir(nm)
    elif nm.is_symlink():
        nm.unlink()
    shutil.rmtree(d, ignore_errors=True)


def link_modules(src):
    real = ROOT / 'src'
    if (real / 'node_modules').is_dir() and (real / 'package-lock.json').read_bytes() == (src / 'package-lock.json').read_bytes():
        if os.name == 'nt':  # a junction needs no rights a symlink would on Windows
            subprocess.run(['cmd', '/c', 'mklink', '/J', str(src / 'node_modules'), str(real / 'node_modules')], check=True, capture_output=True)
        else:
            os.symlink(real / 'node_modules', src / 'node_modules', target_is_directory=True)
    else:
        run([NPM, 'ci', '--no-audit', '--no-fund'], src)


def prepare(work=WORK, patched=True):
    clear(work)
    work.mkdir(parents=True)
    src = work / 'src'
    if patched:
        shutil.copytree(ROOT / 'src', src, ignore=shutil.ignore_patterns('node_modules', 'dist'))
    else:
        tar = subprocess.run([GIT, 'archive', '--format=tar', 'main', 'src'], cwd=ROOT, capture_output=True, check=True).stdout
        tarfile.open(fileobj=io.BytesIO(tar)).extractall(work, filter='data')
    link_modules(src)
    if patched:
        run([NPM, 'run', 'check'], src)
        out = run([NODE, '--test'], src)
        counts = dict(re.findall(r'(?:^# |^ℹ )(pass|fail) (\d+)', out, re.M))
        print(f'tests: pass {counts.get("pass")}, fail {counts.get("fail")}')
        if counts.get('fail') != '0' or not counts.get('pass'):
            problems.append('tests: ' + out[-1500:])
    run([NODE, 'scripts/build.mjs'], src)
    return src / 'dist'


def headers_for(dist):
    """dist/_headers, as Cloudflare Pages reads it: path patterns, each with its header lines."""
    rules, cur = [], None
    for line in (dist / '_headers').read_text(encoding='utf-8').splitlines():
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
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json'}  # not the Windows registry's
        def log_message(self, *a): pass
    class S(http.server.ThreadingHTTPServer):
        allow_reuse_address = False  # on Windows SO_REUSEADDR would bind over another program's port
    srv = S(('127.0.0.1', port), H)
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


POSTER_STATE = """() => { const h = document.getElementById('cqfilm'), st = h.querySelector('.cqf-stage'), r = h.querySelector('.cqf-seek input');
  return { img: st.querySelectorAll(':scope > img').length, svg: st.querySelectorAll(':scope > svg').length, bar: h.querySelectorAll('.cqf-bar > :not([hidden])').length,
    full: [h.querySelectorAll('.cqf-full').length, h.querySelector('.cqf-full').hidden, h.querySelector('.cqf-full').getAttribute('aria-pressed')],
    big: !h.querySelector('.cqf-big').hidden, again: !h.querySelector('.cqf-again').hidden, marks: h.querySelectorAll('.cqf-marks, .cqf-tip').length,
    at: [r.value, h.querySelector('.cqf-time').firstChild.nodeValue, h.querySelector('.cqf-play').textContent],
    api: !!window.cqFilm, tabindex: st.getAttribute('tabindex') }; }"""
POSTER_WANT = {'img': 1, 'svg': 0, 'bar': 4, 'full': [1, True, 'false'], 'big': True, 'again': False, 'marks': 0, 'at': ['0', '0:00', '▶'], 'api': False, 'tabindex': None}
# the time bar moved by a script as a hand moves it: its value, then the input event
MOVE = "(x) => { const r = document.querySelector('.cqf-seek input'); r.value = x; r.dispatchEvent(new Event('input', { bubbles: true })); }"


def pictures(pg, mode, lang, when):
    """The poster (src and srcset) in `lang`, loaded and shown."""
    wait_until(pg, "() => [...document.querySelectorAll('#cqfilm img')].every(i => i.complete)")
    st = pg.evaluate("""() => { const p = document.querySelector('#cqfilm .cqf-stage > img');
      return { src: p.getAttribute('src'), srcset: p.getAttribute('srcset'), current: p.currentSrc.split('/').pop(), w: p.naturalWidth }; }""")
    print(f'{mode}: {when}: poster {st["src"]} / {st["srcset"]} (showing {st["current"]})')
    if st['src'] != f'/landing/film-{lang}.webp' or st['srcset'] != f'/landing/film-{lang}-800.webp 800w, /landing/film-{lang}.webp 1600w' or not st['current'].startswith(f'film-{lang}') or not st['w']:
        problems.append(f'{mode}: {when}: poster not in {lang}: {st}')


def speaks(pg, mode, lang):
    """The film built in `lang`: its ask is the page's (landing-text.ts) and it types out before its send, every fitted text in its box."""
    from build import landing_text
    part = max((p['s'] for p in landing_text()[lang]['ask'] if 'l' not in p), key=len).strip()
    got = pg.evaluate("[window.cqFilm.lang, document.querySelector('.cqf-stage > svg').textContent.replace(/ /g, ' ')]")
    print(f'{mode}: the film is in {got[0]}, its ask has "{part}": {part in got[1]}')
    if got[0] != lang or part not in got[1]: problems.append(f'{mode}: the film is not in {lang} or lacks its ask "{part}"')


def check(url, mode):
    with sync_playwright() as p:
        b = launch(p)
        # 1. before any press, then ▶
        ctx, pg, log = page(b, mode)
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        # The faces of the examples' files are named by each quiz's first question, the sheets example's being the film's
        # question 1: the page's own words for a picture, made by the script (docs/design/root-page.md, "Getting a quiz").
        html = pg.evaluate("(() => { const d = document.documentElement.cloneNode(true); d.querySelectorAll('.face img').forEach((i) => i.removeAttribute('alt')); return d.outerHTML; })()")
        for w in FILM_WORDS:
            if w in html: problems.append(f'{mode}: the page HTML holds the film\'s words "{w}"')
        raw = (WORK / 'src/dist/index.html').read_text(encoding='utf-8')
        if 'data:' in raw.replace('data-', ''): problems.append(f'{mode}: data: in index.html')
        info = pg.evaluate('''() => { const i = document.querySelector('#cqfilm .cqf-stage > img'); const s = document.querySelector('.cqf-stage').getBoundingClientRect();
          return { src: i && i.currentSrc, w: i && i.naturalWidth, stage: [s.width, s.height], film: [...document.scripts].some(x => x.src.includes('film.js')) }; }''')
        print(f'{mode}: before ▶: poster {info["src"].split("/")[-1]} ({info["w"]} px wide) on a stage of {info["stage"][0]:.0f} x {info["stage"][1]:.0f} CSS px')
        if not info['w']: problems.append(f'{mode}: poster not loaded')
        if any('film.js' in r for r in log['requests']): problems.append(f'{mode}: film.js fetched before a press')
        # the speed before the film: it cycles, and nothing loads for it
        sp = []
        for _ in range(3):
            pg.click('.cqf-speed'); sp.append(pg.evaluate("[document.querySelector('.cqf-speed').dataset.rate, document.querySelector('.cqf-speed').textContent]"))
        pg.wait_for_timeout(200)
        print(f'{mode}: the speed before ▶: {sp}; film.js fetched: {any("film.js" in r for r in log["requests"])}')
        if sp != [['0.5', '½×'], ['0.25', '¼×'], ['1', '1×']] or any('film.js' in r for r in log['requests']): problems.append(f'{mode}: the speed before ▶: {sp}')
        before_reqs = len(log['requests'])
        pg.screenshot(path=str(OUT / f'{mode}-page.png'))  # the page's first screen; the film stands below it
        pg.add_style_tag(content='.cqf-big { visibility: hidden }')  # the same frame without ▶, which goes when the film plays
        poster_im = shot(pg, 'poster-picture', mode)
        pg.add_style_tag(content='.cqf-big { visibility: visible }')
        shot(pg, 'poster-with-play', mode)
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        pg.wait_for_timeout(800)
        st = pg.evaluate('''() => ({ img: !!document.querySelector('#cqfilm .cqf-stage > img'), svg: !!document.querySelector('.cqf-stage > svg'), time: document.querySelector('.cqf-time').textContent, big: document.querySelector('.cqf-big').hidden })''')
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
        # 2. the time bar moved as the first press, in German
        ctx, pg, log = page(b, mode)
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        pg.select_option('header select', 'de')
        pictures(pg, mode, 'de', 'German page, before any press')
        sels = ['.cqf-stage', '.cqf-big', '.cqf-again', '.cqf-full', '.cqf-play', '.cqf-seek input', '.cqf-speed']
        aria = pg.evaluate('(sels) => sels.map(s => document.querySelector(s).getAttribute("aria-label"))', sels)
        print(f'{mode}: German names of the film, ▶, the replay, full screen, play, the time bar and the speed: {aria}')
        english = ['From an exercise sheet to the class: a film without sound', 'Play', 'Play again', 'Full screen', 'Play', 'Time in the film', 'Speed']  # index.html's
        if any(not x or x == e for x, e in zip(aria, english)): problems.append(f'{mode}: names not German: {aria}')
        pg.evaluate(MOVE, 40)
        pre = pg.evaluate("document.querySelector('.cqf-time').firstChild.nodeValue")
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        pg.wait_for_timeout(300)
        st = pg.evaluate("""() => ({ clock: document.querySelector('.cqf-time').textContent, vt: document.querySelector('.cqf-seek input').getAttribute('aria-valuetext'),
          play: document.querySelector('.cqf-play').getAttribute('aria-label'), big: document.querySelector('.cqf-big').hidden, marks: document.querySelectorAll('.cqf-marks i').length,
          tip: document.querySelector('.cqf-tip').hidden })""")
        print(f'{mode}: time bar moved to 40 s before the film: clock {pre} while it loads; then {st}')
        if pre != '0:40' or st['clock'] != f'0:40 / {CLOCK(DUR)}' or not st['vt'].startswith('0:40, ') or st['play'] != aria[4] or not st['big'] or st['marks'] != 4 or not st['tip']:
            problems.append(f'{mode}: the time bar as the first press: {pre} {st}')
        shot(pg, 'moved-to-40', mode)
        pg.click('.cqf-play')
        speaks(pg, mode, 'de')
        # a language switch while it plays: back to the poster, in the new language; the next press builds the film in that one
        pg.select_option('header select', 'fr')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film !== 'on'")
        st = pg.evaluate(POSTER_STATE)
        print(f'{mode}: switched to French while it played: {st}')
        if st != POSTER_WANT: problems.append(f'{mode}: after a switch not the poster: {st}')
        pictures(pg, mode, 'fr', 'switched to French after the film loaded')
        reqs = len(log['requests'])
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        pg.wait_for_timeout(300)
        n = pg.evaluate("[document.querySelectorAll('.cqf-stage > svg').length, document.querySelectorAll('.cqf-bar > *').length, document.querySelectorAll('.cqf-seek > *').length, document.querySelector('.cqf-time').textContent]")
        c = pg.evaluate('window.cqFilm.check()')
        print(f'{mode}: ▶ after the switch: films {n[0]}, bar items {n[1]}, time bar parts {n[2]}, clock {n[3]}, {c["kids"]} children and {c["avatars"]} avatars (one class), film.js fetched again: {any("film.js" in u for u in log["requests"][reqs:])}')
        if n[0] != 1 or n[1] != 5 or n[2] != 3 or c['kids'] != 20 or c['avatars'] != 20: problems.append(f'{mode}: rebuilt film doubled: {n} {c["kids"]} {c["avatars"]}')
        speaks(pg, mode, 'fr')
        if pg.evaluate('window.__csp') or log['errors']: problems.append(f'{mode}: time bar run: {pg.evaluate("window.__csp")} {log["errors"]}')
        ctx.close()
        # 3. film.js blocked, then allowed
        ctx, pg, log = page(b, mode)
        blocked = {'on': True}
        pg.route('**/js/film.js', lambda r: r.abort() if blocked['on'] else r.continue_())
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        pg.click('.cqf-big'); pg.wait_for_timeout(800)
        st = pg.evaluate("({ img: !!document.querySelector('#cqfilm .cqf-stage > img'), loading: document.getElementById('cqfilm').classList.contains('loading') })")
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
        w = pg.evaluate("document.querySelector('#cqfilm .cqf-stage img').naturalWidth")  # in <noscript>, which scripts off makes part of the page
        print(f'{mode}: scripts off: poster {w} px wide, screenshot {f.name}')
        if not w: problems.append(f'{mode}: scripts off: no poster')
        ctx.close()
        # 5. film.js loads but can't draw the film once: the picture stays, the next press draws it
        ctx, pg, log = page(b, mode)
        pg.add_init_script('window.__cqFail = 1;')
        def failing(route):
            body = route.fetch().text()
            call = '      makeWorld();\n'
            if body.count(call) != 1: problems.append(f'{mode}: failure check: no single makeWorld() call in film.js to break')
            route.fulfill(status=200, headers={'content-type': 'text/javascript'}, body=body.replace(call, '      if (window.__cqFail) { window.__cqFail--; throw new Error("checked failure"); }\n' + call))
        pg.route('**/js/film.js', failing)
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'failed'")
        st = pg.evaluate("({ img: !!document.querySelector('#cqfilm .cqf-stage > img'), svg: !!document.querySelector('.cqf-stage > svg'), bar: document.querySelectorAll('.cqf-full:not([hidden]), .cqf-marks').length })")
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        st2 = pg.evaluate("({ img: !!document.querySelector('#cqfilm .cqf-stage > img'), svgs: document.querySelectorAll('.cqf-stage > svg').length })")
        print(f'{mode}: film.js fails to draw once: picture stays {st["img"]}, no film left {not st["svg"]}, the bar as before {not st["bar"]}; the next press: film {st2}')
        if not st['img'] or st['svg'] or st['bar'] or st2['img'] or st2['svgs'] != 1: problems.append(f'{mode}: failed draw left {st}, then {st2}')
        if [e for e in log['errors'] if 'checked failure' not in e]: problems.append(f'{mode}: failure run: {log["errors"]}')
        ctx.close()
        ending(b, url, mode)
        for fallback in (False, True):
            fullscreen(b, url, mode, fallback)
        if mode == 'desk':
            arrangement(b, url)
            controls(b, url)
            languages(b, url)
        b.close()


RAF = '''window.__raf = 0; { const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (f) => { window.__raf++; return r(f); }; }'''
STATE = '''() => { const pb = document.querySelector('.cqf-play'), tip = document.querySelector('.cqf-tip'); return { t: +document.querySelector('.cqf-bar input').value,
  playing: pb.getAttribute('aria-label') === 'Pause', y: Math.round(scrollY), focus: document.activeElement === pb ? 'play/pause' : document.activeElement.tagName,
  tip: !tip || tip.hidden ? '' : tip.textContent }; }'''


def controls(b, url):
    """The player's keys, focus and loop, desktop: keys only from inside the player, one animation loop, never playing unseen."""
    ctx, pg, log = page(b, 'desk')
    pg.add_init_script(RAF)
    pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
    state = lambda: pg.evaluate(STATE)
    bad = lambda what: problems.append('desk controls: ' + what)
    # ▶ from the keyboard: the focus goes to the bar's play/pause, not to the page
    pg.focus('.cqf-big'); pg.keyboard.press('Enter')
    wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
    pg.wait_for_timeout(300)
    s = state(); print(f'desk: ▶ by Enter: focus on {s["focus"]}, playing {s["playing"]}')
    if s['focus'] != 'play/pause' or not s['playing']: bad(f'after ▶ by Enter {s}')
    names = pg.evaluate('''() => { const r = document.querySelector('.cqf-bar input'), st = document.querySelector('.cqf-stage');
      return { range: r.getAttribute('aria-label'), valuetext: r.getAttribute('aria-valuetext'), clock: document.querySelector('.cqf-time').textContent, step: r.step,
        stage: [st.getAttribute('role'), st.getAttribute('aria-label'), st.tabIndex],
        text: document.querySelector('.cqf-stage > svg').textContent, host: location.host }; }''')
    print(f'desk: names: range "{names["range"]}" ({names["valuetext"]}, step {names["step"]}; clock {names["clock"]}), stage {names["stage"]}')
    if not names['range'] or names['valuetext'] != names['clock'].split(' / ')[0] + ', Your exercise sheets' or names['stage'][0] != 'group' or not names['stage'][1] or names['stage'][2] != 0: bad(f'names { {k: v for k, v in names.items() if k != "text"} }')
    addr = names['host'] in names['text'] and 'classyquiz.pages.dev' not in names['text']
    print(f'desk: the film shows the address opened ({names["host"]}), not the demo\'s: {addr}')
    if not addr: bad('the film shows another address than the one opened')
    # one loop, however often the bar is moved and played while it plays
    def rate():
        n0 = pg.evaluate('window.__raf'); pg.wait_for_timeout(1000); return pg.evaluate('window.__raf') - n0
    r0 = rate()
    for i in range(5):
        pg.evaluate(MOVE, 5 + i); pg.click('.cqf-play')
    r1 = rate()
    print(f'desk: animation frames a second while playing: {r0}; after five moves of the bar, each played: {r1}')
    if r1 > r0 * 1.3 + 5: bad(f'frames a second {r0} -> {r1} after moves of the bar')
    # a drag to 40 s, in "What the class sees": the chapter's name over the thumb while it is held, gone on release; the film paused where it was let go
    box = pg.locator('.cqf-seek input').bounding_box(); y = box['y'] + box['height'] / 2
    pg.mouse.move(box['x'] + 8, y); pg.mouse.down(); pg.mouse.move(box['x'] + 8 + (box['width'] - 16) * 40 / DUR, y, steps=6); pg.wait_for_timeout(100)
    held = state(); pg.mouse.up(); pg.wait_for_timeout(100); let_go = state()
    print(f'desk: a drag to 40 s: held {held}; let go {let_go}')
    if not (39 <= held['t'] <= 41) or held['tip'] != 'What the class sees' or held['playing'] or let_go['tip'] or let_go['playing']: bad(f'drag {held} {let_go}')
    t0 = state()['t']
    # the page's own keys stay the page's
    tab0 = pg.evaluate("document.querySelector('#ways [aria-selected=true]').id")
    pg.focus('#ways [aria-selected=true]'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(100)
    s = state(); tab1 = pg.evaluate("document.querySelector('#ways [aria-selected=true]').id")
    print(f'desk: ArrowRight on the tabs of the ways: tab {tab0} -> {tab1}, film at {s["t"]} (was {t0})')
    if s['t'] != t0 or s['playing'] or tab0 == tab1: bad(f'ArrowRight on the tabs {s}, tab {tab0} -> {tab1}')
    pg.focus('#code'); pg.keyboard.press(' '); pg.wait_for_timeout(100)
    s = state(); print(f'desk: Space in the code box: film at {s["t"]}, playing {s["playing"]}')
    if s['t'] != t0 or s['playing']: bad(f'Space in #code {s}')
    pg.evaluate('document.activeElement.blur(); scrollTo(0, 0)'); pg.keyboard.press(' '); pg.wait_for_timeout(600)
    s = state(); print(f'desk: Space on the page: scrolled to {s["y"]}, film at {s["t"]}, playing {s["playing"]}')
    if s['y'] <= 0 or s['t'] != t0 or s['playing']: bad(f'Space on the page {s}')
    pg.evaluate('scrollTo(0, 0)'); pg.wait_for_timeout(200)
    # the stage and the time bar take the film's keys
    pg.focus('.cqf-stage'); pg.keyboard.press(' '); pg.wait_for_timeout(200); p1 = state()['playing']
    pg.keyboard.press(' '); s = state(); p2 = s['playing']; t1 = s['t']
    pg.keyboard.press('ArrowRight'); t2 = state()['t']
    pg.keyboard.press('Shift+ArrowLeft'); t3 = state()['t']
    pg.focus('.cqf-bar input'); pg.keyboard.press('ArrowLeft'); t4 = state()['t']
    vt = pg.evaluate("[document.querySelector('.cqf-bar input').getAttribute('aria-valuetext'), document.querySelector('.cqf-time').textContent]")
    print(f'desk: on the stage Space plays {p1}, Space again pauses {not p2}; ArrowRight {t1} -> {t2}, Shift+ArrowLeft -> {t3}; on the time bar ArrowLeft -> {t4} ({vt[0]})')
    if not p1 or p2 or abs(t2 - t1 - 1) > 0.11 or abs(t2 - t3 - 0.1) > 0.06 or abs(t3 - t4 - 1) > 0.11 or not vt[0].startswith(vt[1].split(' / ')[0] + ', '): bad(f'stage and range keys {p1} {p2} {t1} {t2} {t3} {t4} {vt}')
    # never unseen: scrolled away or the tab hidden, it pauses and stays paused
    pg.click('.cqf-bar button'); pg.wait_for_timeout(200)
    pg.evaluate('scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(500); a = state()['playing']
    pg.evaluate("document.querySelector('.cqf-film').scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(500); s = state()
    if not state()['playing']: pg.click('.cqf-bar button')
    pg.wait_for_timeout(200); h0 = state()['playing']
    pg.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'))")
    h = state()['playing']
    print(f'desk: scrolled out of view: playing {a}; back in view: playing {s["playing"]}; tab hidden: playing {h0} -> {h}')
    if a or s['playing'] or not h0 or h: bad(f'unseen: scrolled away {a}, back {s["playing"]}, hidden {h}')
    if pg.evaluate('window.__csp') or log['errors']: bad(f'{pg.evaluate("window.__csp")} {log["errors"]}')
    ctx.close()


END_UNDERLINE = 649 / 900   # the bottom of the end card's underline under the address, as a share of the film's height (film.js, makeEnd)


def ending(b, url, mode):
    """At the end the stage shows the page's replay icon, named in German here and with no words of its own, in the band under
    the end card's address; pressed (by keyboard), it plays the film from the start and the focus goes to play/pause."""
    ctx, pg, log = page(b, mode)
    pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
    pg.select_option('header select', 'de')
    pg.click('.cqf-big')
    wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
    hidden0 = pg.evaluate("document.querySelector('.cqf-again').hidden")
    pg.evaluate(f'window.cqFilm.render({DUR - 0.7})')
    pg.click('.cqf-play')  # play the last moment out
    wait_until(pg, "() => !document.querySelector('.cqf-again').hidden", 5)
    s = pg.evaluate(STATE)
    a = pg.evaluate("""() => { const a = document.querySelector('.cqf-again'), r = a.getBoundingClientRect(), st = document.querySelector('.cqf-stage').getBoundingClientRect();
      return { label: a.getAttribute('aria-label'), text: a.textContent.trim(), icon: !!a.querySelector('svg'), w: r.width, h: r.height,
        top: (r.top - st.top) / st.height, bottom: (r.bottom - st.top) / st.height, mid: (r.left + r.width / 2 - st.left) / st.width }; }""")
    f = OUT / f'{mode}-end-again.png'; pg.locator('.cqf-stage').screenshot(path=str(f))
    pg.focus('.cqf-again'); pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
    s2 = pg.evaluate(STATE); hidden2 = pg.evaluate("document.querySelector('.cqf-again').hidden")
    print(f'{mode}: the replay hidden while it plays {hidden0}; at the end (at {s["t"]}, playing {s["playing"]}, {f.name}) named "{a["label"]}", words "{a["text"]}", icon {a["icon"]},'
          f' {a["w"]:.0f} x {a["h"]:.0f} px from {a["top"]:.3f} to {a["bottom"]:.3f} of the height (the underline ends at {END_UNDERLINE:.3f}), centre at {a["mid"]:.3f} of the width;'
          f' pressed: at {s2["t"]}, playing {s2["playing"]}, hidden {hidden2}, focus on {s2["focus"]}')
    if not hidden0 or s['t'] < DUR - 0.1 or s['playing'] or not a['label'] or a['label'] == 'Play again' or a['text'] or not a['icon'] or not (s2['playing'] and s2['t'] < 1 and hidden2 and s2['focus'] == 'play/pause'):
        problems.append(f'{mode}: replay: {hidden0} {a} {s} {s2} {hidden2}')
    if a['top'] < END_UNDERLINE + 0.02 or a['bottom'] > 0.985 or abs(a['mid'] - 0.5) > 0.005 or abs(a['w'] - a['h']) > 0.5:
        problems.append(f'{mode}: the replay is not a round button in the band under the address: {a}')
    if pg.evaluate('window.__csp') or log['errors']: problems.append(f'{mode}: replay: {pg.evaluate("window.__csp")} {log["errors"]}')
    ctx.close()


# Viewports the arrangement is checked at: [name, viewport, phone?, rows of the bar]
ARRANGEMENTS = [('desk', (1300, 900), False, 1), ('desk-short', (1024, 600), False, 1), ('phone', (390, 844), True, 2),
                ('sideways-844x390', (844, 390), True, 1), ('sideways-740x360', (740, 360), True, 1), ('sideways-915x412', (915, 412), True, 1)]


def arrangement(b, url):
    """The bar under the film and as wide, on the rows given (root-page.md, "The film": a phone held sideways as a desktop),
    its time bar wide enough to drag, and no sideways scroll."""
    for name, (w, h), phone, rows in ARRANGEMENTS:
        ctx = b.new_context(viewport={'width': w, 'height': h}, **({'device_scale_factor': 3, 'is_mobile': True, 'has_touch': True} if phone else {}))
        pg = ctx.new_page()
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        m = pg.evaluate("""() => { const r = s => document.querySelector(s).getBoundingClientRect();
          document.querySelector('#film-h').scrollIntoView();  // the film stands below the first screen, under its heading
          const st = r('.cqf-stage'), bar = r('.cqf-bar'), seek = r('.cqf-seek'), end = bar.bottom;
          return { vh: innerHeight, sw: document.documentElement.scrollWidth, vw: innerWidth, stage: [st.left, st.width, st.height], whole: [r('#film-h').top, end],
            bar: [bar.left, bar.width, bar.top - st.bottom],  seek: seek.width,
            rows: new Set([...document.querySelectorAll('.cqf-bar > *')].map(e => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2))).size > 1 ? 2 : 1 }; }""")
        pg.screenshot(path=str(OUT / f'layout-{name}.png'))
        print(f'{name} {w} x {h}: film {m["stage"][1]:.0f} x {m["stage"][2]:.0f}, bar {m["bar"][1]:.0f} wide {m["bar"][2]:.0f} px under it on {m["rows"]} row(s), time bar {m["seek"]:.0f} wide;'
              f' from its heading to its bar\'s foot {m["whole"][0]:.0f} to {m["whole"][1]:.0f} of {m["vh"]}; page {m["sw"]} wide; layout-{name}.png')
        if abs(m['bar'][0] - m['stage'][0]) > 0.5 or abs(m['bar'][1] - m['stage'][1]) > 0.5 or not 0 <= m['bar'][2] <= 12: problems.append(f'{name}: the bar is not under the film and as wide: {m}')
        if m['rows'] != rows: problems.append(f'{name}: the bar on {m["rows"]} row(s), not {rows}')
        if m['seek'] < 150: problems.append(f'{name}: the time bar is {m["seek"]:.0f} px wide')
        if m['sw'] > m['vw']: problems.append(f'{name}: the page scrolls sideways ({m["sw"]} > {m["vw"]})')
        ctx.close()


FS = """() => { const col = document.querySelector('.cqf-film'), st = document.querySelector('.cqf-stage').getBoundingClientRect(), bar = document.querySelector('.cqf-bar').getBoundingClientRect(),
  full = document.querySelector('.cqf-full'), a = document.activeElement;
  return { on: col.classList.contains('cqf-fs'), api: document.fullscreenElement === col, pressed: full.getAttribute('aria-pressed'), stage: [st.left, st.top, st.width, st.height],
    bar: [bar.top, bar.bottom], vw: innerWidth, vh: innerHeight, y: Math.round(scrollY), inside: col.contains(a), focus: a === full ? 'full' : a.classList.contains('cqf-stage') ? 'stage' : a.tagName }; }"""


def fullscreen(b, url, mode, fallback):
    """Full screen by its button: the browser's (fallback False) or, with the Fullscreen API hidden as on iPhone Safari, the film's
    column fixed over the viewport."""
    how = 'fallback' if fallback else 'api'
    ctx, pg, log = page(b, mode)
    if fallback: pg.add_init_script("Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false });")
    pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
    bad = lambda what: problems.append(f'{mode} full screen ({how}): {what}')
    pg.click('.cqf-big')
    wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
    pg.click('.cqf-play')  # paused, so the keys' effect shows
    y0 = pg.evaluate("Math.round(document.querySelector('.cqf-film').getBoundingClientRect().top + scrollY) - 60")  # the film in view, a little down the page
    def enter():
        pg.evaluate(f'scrollTo(0, {y0})'); pg.wait_for_timeout(100)
        pg.focus('.cqf-full'); pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
        return pg.evaluate(FS)
    def letterboxed(s, when):
        w = min(s['vw'], (s['vh'] - 48) * 16 / 9)
        ok = abs(s['stage'][2] - w) < 1.5 and abs(s['stage'][0] - (s['vw'] - w) / 2) < 1.5 and s['stage'][1] >= -0.5 and s['bar'][1] <= s['vh'] + 0.5 and s['bar'][0] >= s['stage'][1] + s['stage'][3]
        print(f'{mode} full screen ({how}) {when}: film {s["stage"][2]:.0f} x {s["stage"][3]:.0f} at {s["stage"][0]:.0f},{s["stage"][1]:.0f} on {s["vw"]} x {s["vh"]}, bar {s["bar"][0]:.0f}-{s["bar"][1]:.0f}; letterboxed {ok}')
        if not ok: bad(f'{when}: not letterboxed 16:9 in the screen: {s}')
    s = enter()
    pg.screenshot(path=str(OUT / f'{mode}-fullscreen-{how}.png'))
    print(f'{mode} full screen ({how}) on: browser\'s {s["api"]}, pressed {s["pressed"]}, focus on {s["focus"]}; {mode}-fullscreen-{how}.png')
    if not s['on'] or s['api'] == fallback or s['pressed'] != 'true' or s['focus'] != 'stage': bad(f'on: {s}')
    letterboxed(s, 'on')
    # the page under it holds still; the film's keys work; Tab goes round the player
    pg.mouse.move(s['vw'] / 2, s['vh'] / 2); pg.mouse.wheel(0, 400); pg.wait_for_timeout(300)
    y1 = pg.evaluate('Math.round(scrollY)')
    p0 = pg.evaluate(STATE)['playing']; pg.keyboard.press(' '); pg.wait_for_timeout(200); p1 = pg.evaluate(STATE)['playing']
    pg.keyboard.press(' '); t0 = pg.evaluate(STATE)['t']; pg.keyboard.press('ArrowRight'); t1 = pg.evaluate(STATE)['t']
    ring = []
    for _ in range(12):
        pg.keyboard.press('Tab'); ring.append(pg.evaluate(FS)['inside'])
    pg.keyboard.press('Shift+Tab'); ring.append(pg.evaluate(FS)['inside'])
    print(f'{mode} full screen ({how}): wheel: page at {y1} (was {y0}); Space on the stage plays {p1} (was {p0}), ArrowRight {t0} -> {t1}; Tab x12, Shift+Tab: focus inside {all(ring)}')
    if y1 != y0: bad(f'the page scrolled under it: {y0} -> {y1}')
    if p0 or not p1 or abs(t1 - t0 - 1) > 0.11: bad(f'the film\'s keys: {p0} {p1} {t0} {t1}')
    if not all(ring): bad(f'Tab left the player: {ring}')
    if mode == 'phone' and fallback:
        pg.set_viewport_size({'width': 844, 'height': 390}); pg.wait_for_timeout(300)
        letterboxed(pg.evaluate(FS), 'turned sideways')
        pg.screenshot(path=str(OUT / f'{mode}-fullscreen-{how}-sideways.png'))
        pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(300)
    # ended: the fallback by Esc, the browser's by the browser (its Esc can't be pressed from here: exitFullscreen, as it does), then by the button
    drift = pg.evaluate('scrollTo(0, 0), Math.round(scrollY)')  # as a browser may leave it: the end puts the page back where it was
    if drift != 0: bad(f'the page could not be moved under it to check the way back ({drift})')
    if fallback: pg.keyboard.press('Escape')
    else: pg.evaluate('document.exitFullscreen()')
    pg.wait_for_timeout(400)
    e = pg.evaluate(FS)
    print(f'{mode} full screen ({how}) ended by {"Esc" if fallback else "the browser"}: on {e["on"]}, pressed {e["pressed"]}, page at {e["y"]} (was {y0}), focus on {e["focus"]}')
    if e['on'] or e['api'] or e['pressed'] != 'false' or e['y'] != y0 or e['focus'] != 'full': bad(f'ended by {"Esc" if fallback else "the browser"}: {e}')
    s = enter()
    if pg.evaluate('scrollTo(0, 0), Math.round(scrollY)') != 0: bad('the page could not be moved under it to check the way back')
    pg.keyboard.press('Shift+Tab'); on_full = pg.evaluate(FS)['focus'] == 'full'  # from the stage, back round to the last of the player: the button
    pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
    e = pg.evaluate(FS)
    print(f'{mode} full screen ({how}) again, Shift+Tab from the stage to its button {on_full}, ended by it: on {e["on"]}, page at {e["y"]}, focus on {e["focus"]}')
    if not s['on'] or not on_full or e['on'] or e['api'] or e['pressed'] != 'false' or e['y'] != y0 or e['focus'] != 'full': bad(f'ended by the button: {s} {on_full} {e}')
    if pg.evaluate('window.__csp') or log['errors']: bad(f'{pg.evaluate("window.__csp")} {log["errors"]}')
    ctx.close()


def languages(b, url):
    """Every language's film: each ask typed out before its send with the composer under the top bar, no line of an ask wider
    than its box, no fitted text shrunk below 3/4; the languages whose words in film.js are drafts are named."""
    drafts = []
    for lang in ('de', 'en', 'fr', 'it'):
        ctx, pg, log = page(b, 'desk')
        pg.goto(url + '/'); pg.wait_for_load_state('networkidle')
        pg.select_option('header select', lang)
        pg.click('.cqf-big')
        wait_until(pg, "() => document.getElementById('cqfilm').dataset.film === 'on'")
        c = pg.evaluate('window.cqFilm.check()')
        a1, a2 = c['ask1'], c['ask2']
        small = [(x['text'], round(x['k'], 2)) for x in c['fits']]
        print(f'desk {lang}: ask {a1["chars"]} characters on {a1["lines"]} lines at {a1["cps"]:.1f}/s, typed out {a1["send"] - a1["typed"]:.2f} s before its send;'
              f' the second {a2["chars"]} on {a2["lines"]} at {a2["cps"]:.1f}/s, {a2["send"] - a2["typed"]:.2f} s; composer just before the sends {c["typedBefore"]};'
              f' shrunk to fit {small}{"; DRAFT words" if c["draft"] else ""}')
        if c['lang'] != lang: problems.append(f'desk {lang}: the film is in {c["lang"]}')
        for x in c['typedBefore']:
            if x['shown'] != x['of'] or x['top'] < 80: problems.append(f'desk {lang}: an ask not typed out before its send, or its composer over the top bar: {x}')
        if a1['send'] - a1['typed'] < 1 or a2['send'] - a2['typed'] < 0.1: problems.append(f'desk {lang}: an ask typed out too late: {a1} {a2}')
        if c['overflow']: problems.append(f'desk {lang}: wider than its box: {c["overflow"]}')
        for t, k in small:
            if k < 0.75: problems.append(f'desk {lang}: "{t}" shrunk to {k} of its size to fit')
        if c['draft']: drafts.append(lang)
        if pg.evaluate('window.__csp') or log['errors']: problems.append(f'desk {lang}: {pg.evaluate("window.__csp")} {log["errors"]}')
        ctx.close()
    if drafts: print(f'NOTE: the film\'s words in {", ".join(drafts)} are drafts (film.js, CONTENT)')


REST = '.get, .get *, .run, .run *, .rely, .rely *, .guide, .guide *'  # the page around the film: the two steps, the foot, the guidance
STYLES = """(rest) => [...document.querySelectorAll(rest)].map(e => { const c = getComputedStyle(e);
  return [e.tagName, e.className, ...['display', 'font', 'color', 'background-color', 'border', 'border-radius', 'padding', 'margin', 'width', 'grid-template-columns', 'text-decoration-line'].map(k => c.getPropertyValue(k))].join('|'); })"""


def rest_unchanged(dist0, dist, port=0):
    """The page around the film (the two steps, the foot, the guidance) against `main`'s: every element's
    computed style. One port for both: the page shows its own address. A `main` whose page is built differently
    (no such parts) shows up here as a change, which it is."""
    got = {}
    for d, name in ((dist0, 'before'), (dist, 'after')):
        srv, u = serve(d, port)
        port = srv.server_address[1]  # a free port the first time, the same one for the second
        with sync_playwright() as p:
            b = launch(p)
            for mode, vp in (('desk', {'width': 1300, 'height': 900}), ('phone', {'width': 390, 'height': 844})):
                pg = b.new_page(viewport=vp)
                pg.goto(u + '/'); pg.wait_for_load_state('networkidle')
                got[mode, name] = pg.evaluate(STYLES, REST)
                if pg.locator('.get').count(): pg.locator('.get').screenshot(path=str(OUT / f'{mode}-steps-{name}.png'))
                pg.close()
            b.close()
        srv.shutdown(); srv.server_close()
    for mode in ('desk', 'phone'):
        a, c = got[mode, 'before'], got[mode, 'after']
        bad = [(x, y) for x, y in zip(a, c) if x != y]
        print(f'{mode}: the page around the film against main: {len(a)} elements there, {len(c)} here, {len(bad) + abs(len(a) - len(c))} with another style')
        if bad or len(a) != len(c): problems.append(f'{mode}: the page around the film changed against main: {len(a)} elements there, {len(c)} here; first differences {bad[:3]}')


dist0 = prepare(BASE, patched=False)
dist = prepare()
rest_unchanged(dist0, dist)
srv, url = serve(dist)
print('CSP:', [v for k, v in headers_for(dist)('/') if k == 'Content-Security-Policy'][0])
for mode in ('desk', 'phone'):
    check(url, mode)
srv.shutdown()
print('PROBLEMS:' if problems else 'no problems', *problems, sep='\n  ')
