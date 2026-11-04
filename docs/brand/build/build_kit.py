"""Builds the classyQuiz logo kit's vector files into ../ (svg/, web/) from fox.py, small.py, word.py, lockup.py.
Run: python -I build_kit.py [out_dir]   (needs fontTools and Rubik Bold 1.100 as a TTF, see word.py)
It renders no rasters: the site's favicon.ico and apple-touch-icon.png are renders of the sources in web/
(guidelines.md, "Files")."""
import sys
from contextlib import contextmanager
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else HERE.parent
sys.path.insert(0, str(HERE))
import fox, small, word, lockup  # noqa: E402

ORANGE, INK, WHITE = "#E26B22", "#1D1D1B", "#FFFFFF"
PAPER, NIGHT_INK = "#FBF8F2", "#ECEBE6"
CUR = "currentColor"
TITLE = "classyQuiz"

COLOUR_LIGHT = dict(orange=ORANGE, white=WHITE, ink=INK, hat=INK)
COLOUR_DARK = dict(orange=ORANGE, white=WHITE, ink=INK, hat=NIGHT_INK)
COLOUR_INLINE = dict(orange=ORANGE, white=WHITE, ink=INK, hat=CUR)


@contextmanager
def dark_geometry():
    """Light-on-dark reads heavier: open the band gap and the brim gap a little."""
    old = dict(fox.P)
    fox.P.update(gap_h=old["gap_h"] + 0.35, gap=old["gap"] + 0.25)
    try:
        yield
    finally:
        fox.P.clear(); fox.P.update(old)


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def svg_doc(body, w, h, title=TITLE, size_attrs=True):
    wh = f' width="{f(w)}" height="{f(h)}"' if size_attrs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}"{wh} role="img" aria-labelledby="t">'
            f'<title id="t">{title}</title>{body}</svg>\n')


def write(rel, text):
    if "-inline" in rel:   # inline in pages: no id to collide when the mark appears twice
        text = text.replace('aria-labelledby="t"><title id="t">' + TITLE + '</title>', f'aria-label="{TITLE}">')
        text = text.replace(' id="symbol"', "").replace(' id="wordmark"', "")
        assert ' id="' not in text, rel
    p = KIT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


def symbol(kind, col, dark=False, pad=16.0):
    k, dx, dy = fox.fit(fox.BBOX, pad=pad)
    if dark:
        with dark_geometry():
            body = fox.build(kind, lambda: fox.Pen(k, dx, dy), col)
    else:
        body = fox.build(kind, lambda: fox.Pen(k, dx, dy), col)
    return svg_doc(f'<g id="symbol">{body}</g>', 256, 256)


def lock(fn, kind, col, word_fill, dark=False, **kw):
    if dark:
        with dark_geometry():
            b, w, h = fn(kind, col, word_fill, **kw)
    else:
        b, w, h = fn(kind, col, word_fill, **kw)
    return svg_doc(b, w, h)


# lockup proportions (in cap heights of the wordmark)
H_RATIO, H_GAP, H_CHIN = 2.2, 0.55, 0.06
S_RATIO, S_GAP = 3.2, 0.55


def horizontal(kind, col, wf, dark=False):
    return lock(lockup.horizontal, kind, col, wf, dark, ratio=H_RATIO, gap=H_GAP, chin=H_CHIN)


def stacked(kind, col, wf, dark=False):
    return lock(lockup.stacked, kind, col, wf, dark, ratio=S_RATIO, gap=S_GAP)


def wordmark(fill, cap=100.0, pad=0.0):
    scale = cap / word.CAP
    asc, desc = 0.74 * word.CAP * scale, 0.25 * word.CAP * scale   # l ascender ~740, y/Q below ~-250
    w = word.width(scale) + 2 * pad
    d = word.paths(scale, pad, pad + asc)
    return svg_doc(f'<g id="wordmark"><path fill="{fill}" d="{d}"/></g>', w, asc + desc + 2 * pad)


def horizontal_32(hat):
    """Header size: the 32-grid fox at 1:1 (30 px tall drawing), the word at the lockup's ratio."""
    fox_h = 30.0                     # the 32-grid drawing spans y 1..31
    C = fox_h / H_RATIO
    scale = C / word.CAP
    x_fox0 = 5.0                     # the drawing spans x 5..27
    gap = H_GAP * C
    baseline = 31.0 - H_CHIN * C
    x0 = 27.0 + gap
    ww = word.width(scale)
    w = x0 + ww + 1.0
    body = (f'<g id="symbol" transform="translate({f(-x_fox0 + 1)} 0)">{small.s32(hat=hat, orange=ORANGE, white=WHITE, ink=INK)}</g>'
            f'<g id="wordmark"><path fill="{hat}" d="{word.paths(scale, x0 - x_fox0 + 1, baseline)}"/></g>')
    return svg_doc(body, w - x_fox0 + 1, 32)


def main():
    out = []
    # ---- symbol
    out.append(write("svg/classyquiz-symbol-colour.svg", symbol("colour", COLOUR_LIGHT)))
    out.append(write("svg/classyquiz-symbol-colour-dark.svg", symbol("colour", COLOUR_DARK, dark=True)))
    out.append(write("svg/classyquiz-symbol-colour-inline.svg", symbol("colour", COLOUR_INLINE)))
    out.append(write("svg/classyquiz-symbol-black.svg", symbol("mono", dict(ink="#000000"))))
    out.append(write("svg/classyquiz-symbol-white.svg", symbol("reversed", dict(ink=WHITE), dark=True)))
    # ---- small cuts
    for n, fn in ((32, small.s32), (16, small.s16)):
        out.append(write(f"svg/classyquiz-symbol-{n}.svg", svg_doc(fn(hat=INK, orange=ORANGE, white=WHITE, ink=INK), n, n)))
        out.append(write(f"svg/classyquiz-symbol-{n}-dark.svg", svg_doc(fn(hat=NIGHT_INK, orange=ORANGE, white=WHITE, ink=INK), n, n)))
        out.append(write(f"svg/classyquiz-symbol-{n}-inline.svg", svg_doc(fn(hat=CUR, orange=ORANGE, white=WHITE, ink=INK), n, n)))
    # ---- lockups
    out.append(write("svg/classyquiz-horizontal-colour.svg", horizontal("colour", COLOUR_LIGHT, INK)))
    out.append(write("svg/classyquiz-horizontal-colour-dark.svg", horizontal("colour", COLOUR_DARK, NIGHT_INK, dark=True)))
    out.append(write("svg/classyquiz-horizontal-inline.svg", horizontal("colour", COLOUR_INLINE, CUR)))
    out.append(write("svg/classyquiz-horizontal-black.svg", horizontal("mono", dict(ink="#000000"), "#000000")))
    out.append(write("svg/classyquiz-horizontal-white.svg", horizontal("reversed", dict(ink=WHITE), WHITE, dark=True)))
    out.append(write("svg/classyquiz-horizontal-32-inline.svg", horizontal_32(CUR)))
    out.append(write("svg/classyquiz-horizontal-32.svg", horizontal_32(INK)))
    out.append(write("svg/classyquiz-horizontal-32-dark.svg", horizontal_32(NIGHT_INK)))
    out.append(write("svg/classyquiz-stacked-colour.svg", stacked("colour", COLOUR_LIGHT, INK)))
    out.append(write("svg/classyquiz-stacked-colour-dark.svg", stacked("colour", COLOUR_DARK, NIGHT_INK, dark=True)))
    out.append(write("svg/classyquiz-stacked-black.svg", stacked("mono", dict(ink="#000000"), "#000000")))
    out.append(write("svg/classyquiz-stacked-white.svg", stacked("reversed", dict(ink=WHITE), WHITE, dark=True)))
    # ---- wordmark alone
    out.append(write("svg/classyquiz-wordmark-ink.svg", wordmark(INK)))
    out.append(write("svg/classyquiz-wordmark-white.svg", wordmark(WHITE)))
    out.append(write("svg/classyquiz-wordmark-inline.svg", wordmark(CUR)))

    # ---- web icons
    web = KIT / "web"
    web.mkdir(exist_ok=True)
    fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
           f'<style>.hat{{fill:{INK}}}@media (prefers-color-scheme:dark){{.hat{{fill:{NIGHT_INK}}}}}</style>'
           + small.s16(hat="", orange=ORANGE, white=WHITE, ink=INK).replace('<path fill="" ', '<path class="hat" ')
           + "</svg>\n")
    assert 'class="hat"' in fav
    out.append(write("web/favicon.svg", fav))
    # Sources of the rasters the site serves: favicon.ico holds svg/classyquiz-symbol-16.svg at 16,
    # svg/classyquiz-symbol-32.svg at 32 and favicon-48.svg at 48; apple-touch-icon.png is touch-icon.svg at 180.
    k, dx, dy = fox.fit(fox.BBOX, pad=4)
    out.append(write("web/favicon-48.svg", svg_doc(fox.build("colour", lambda: fox.Pen(k, dx, dy), COLOUR_LIGHT), 256, 256)))

    def tile(scale, up=0.0):
        k2, dx2, dy2 = fox.fit(fox.BBOX, w=256, h=256, pad=(256 - 256 * scale) / 2, up=up)
        body = f'<rect width="256" height="256" fill="{PAPER}"/>' + fox.build("colour", lambda: fox.Pen(k2, dx2, dy2), COLOUR_LIGHT)
        return svg_doc(body, 256, 256)
    out.append(write("web/touch-icon.svg", tile(0.70, up=2)))

    # ---- link preview card 1200x630 (no page names it yet: backlog, v4 item 14)
    b, w, h = lockup.stacked("colour", COLOUR_LIGHT, INK, ratio=S_RATIO, gap=S_GAP)
    sc = 470 / h
    og = (f'<rect width="1200" height="630" fill="{PAPER}"/>'
          f'<g transform="translate({f((1200 - w * sc) / 2)} {f((630 - h * sc) / 2)}) scale({f(sc)})">{b}</g>')
    out.append(write("svg/classyquiz-social-card.svg", svg_doc(og, 1200, 630)))
    for p in out:
        print(p.relative_to(KIT))


if __name__ == "__main__":
    main()
