"""Lockups: the fox and the wordmark. Ratios are in cap heights of the wordmark (C)."""
import fox, word

FOX_W, FOX_H = fox.BBOX[2] - fox.BBOX[0], fox.BBOX[3] - fox.BBOX[1]


def fox_pen(x, y, h):
    """Pen factory placing the fox's drawing bbox with its top-left at (x, y), height h."""
    k = h / FOX_H
    return (lambda: fox.Pen(k, x - fox.BBOX[0] * k, y - fox.BBOX[1] * k)), FOX_W * k


def horizontal(kind, col, word_fill, ratio=2.1, gap=0.42, chin=0.06, fox_h=200.0, pad=28.0, optical=None):
    """ratio: fox height / cap height; gap: fox-to-word in C; chin: how far the chin sits below the baseline, in C."""
    C = fox_h / ratio
    scale = C / word.CAP
    top = pad
    baseline = top + fox_h - chin * C
    fp, fw = fox_pen(pad, top, fox_h)
    body = f'<g id="symbol">{fox.build(kind, fp, col)}</g>'
    x0 = pad + fw + gap * C
    d = word.paths(scale, x0, baseline, optical=optical)
    w = x0 + word.width(scale, optical=optical) + pad
    h = fox_h + 2 * pad
    body += f'<g id="wordmark"><path fill="{word_fill}" d="{d}"/></g>'
    return body, w, h


def stacked(kind, col, word_fill, ratio=3.0, gap=0.55, fox_h=200.0, pad=28.0, optical=None):
    """Fox centred above the word; ratio: fox height / cap height; gap in C (chin to cap top)."""
    C = fox_h / ratio
    scale = C / word.CAP
    ww = word.width(scale, optical=optical)
    # descender of y and Q's tail reach below the baseline
    desc = 0.25 * word.CAP * scale
    w = max(ww, FOX_W * fox_h / FOX_H) + 2 * pad
    fp, fw = fox_pen((w - FOX_W * fox_h / FOX_H) / 2, pad, fox_h)
    body = f'<g id="symbol">{fox.build(kind, fp, col)}</g>'
    baseline = pad + fox_h + gap * C + C
    d = word.paths(scale, (w - ww) / 2, baseline, optical=optical)
    body += f'<g id="wordmark"><path fill="{word_fill}" d="{d}"/></g>'
    return body, w, baseline + desc + pad


def doc(body, w, h, title):
    f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}" '
            f'role="img" aria-labelledby="t"><title id="t">{title}</title>{body}</svg>\n')
