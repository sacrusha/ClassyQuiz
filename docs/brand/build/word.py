"""The wordmark: "classyQuiz" in Rubik Bold (SIL OFL 1.1), set as outlines.
Tracking -12/1000, Rubik's own kern for "sy" (-21), plus optical pair adjustments (font units)."""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

# Rubik Bold 1.100 as a TTF (Google Fonts). The site's woff2 is subset and
# compressed; reading it would need brotli, and the outlines must come from
# the same version the wordmark was set in.
FONT = TTFont(os.environ.get("RUBIK_TTF", "C:/Windows/Fonts/Rubik-Bold.ttf"))
GS, CMAP = FONT.getGlyphSet(), FONT.getBestCmap()
TEXT = "classyQuiz"
TRACK = -12
KERN = {("s", "y"): -21}
OPTICAL = {}          # filled after looking: {("y", "Q"): -n, ...}
CAP, XH = 700, 520


def layout(text=TEXT, optical=None):
    """[(glyph, x in font units)], total advance."""
    opt = OPTICAL if optical is None else optical
    x, out = 0, []
    for i, ch in enumerate(text):
        out.append((CMAP[ord(ch)], x))
        x += GS[CMAP[ord(ch)]].width + TRACK
        if i + 1 < len(text):
            pair = (ch, text[i + 1])
            x += KERN.get(pair, 0) + opt.get(pair, 0)
    return out, x - TRACK


def ink_bounds(text=TEXT, optical=None):
    """Left/right ink edges in font units (side bearings excluded)."""
    lay, _ = layout(text, optical)
    xs = []
    for g, x in lay:
        bp = BoundsPen(GS)
        GS[g].draw(bp)
        if bp.bounds:
            xs += [x + bp.bounds[0], x + bp.bounds[2]]
    return min(xs), max(xs)


def paths(scale, x0, baseline, text=TEXT, optical=None, nd=2):
    """SVG path data of the word: x0 is where the first glyph's ink starts; baseline in target units."""
    lay, _ = layout(text, optical)
    left, _ = ink_bounds(text, optical)
    pen = SVGPathPen(GS, ntos=lambda v: (f"{v:.{nd}f}".rstrip("0").rstrip(".") or "0"))
    for g, x in lay:
        GS[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x0 + (x - left) * scale, baseline)))
    return pen.getCommands()


def width(scale, text=TEXT, optical=None):
    l, r = ink_bounds(text, optical)
    return (r - l) * scale
