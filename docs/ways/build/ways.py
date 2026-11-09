"""Draws the root page's three pictures of the ways to play into src/public/landing/way-<name>.svg.
Run: py -I docs/ways/build/ways.py      (from anywhere; what they are for: docs/ways/README.md)

The people, the screens and the answers' colours and shapes are the film's (docs/film/build/film.js): the colours and
shapes are read from it, the figures are drawn the way it draws them. No words in the pictures: one file serves the
page in every language.
"""
import math, pathlib, re, sys

sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FILM = ROOT / 'docs' / 'film' / 'build' / 'film.js'
OUT = ROOT / 'src' / 'public' / 'landing'
W, H = 640, 400  # every picture; the page shows it at about 113 x 71 CSS px on a phone, 225 x 141 on a desktop


# ---------------------------------------------------------------- what is read from the film
def film_list(name):
    """A JS array literal of strings (or of pairs of strings) in film.js, as a Python list."""
    src = FILM.read_text(encoding='utf-8')
    m = re.search(r'const ' + name + r' = (\[[\s\S]*?\]);', src)
    if not m:
        raise SystemExit(f'ways.py: no "const {name} = [...]" in {FILM}; the film changed, follow it here')
    return eval(m.group(1).replace('\n', ' '), {'__builtins__': {}})  # a literal of strings only


def film_colours():
    src = FILM.read_text(encoding='utf-8')
    m = re.search(r'const C = \{([\s\S]*?)\};', src)
    if not m:
        raise SystemExit(f'ways.py: no "const C = {{...}}" in {FILM}')
    return dict(re.findall(r"(\w+): '(#[0-9a-fA-F]{6})'", m.group(1)))


ANS, ANS_INK, SHAPES = film_list('ANS'), film_list('ANS_INK'), film_list('SHAPES')
HAIR, SKIN, TOPS = film_list('HAIR'), film_list('SKIN'), film_list('TOPS')
C = film_colours()
INK, PAPER, FRAME, RULE, ACCENT, GOOD = C['ink'], C['paper'], C['frame'], C['rule'], C['accent'], C['good']
TEAL = '#1c7c8c'  # the arrow in the example's number-line picture (film.js, cq-q1)


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.') if isinstance(v, float) else str(v)


def g(body, x=0, y=0, s=1, r=0):
    t = []
    if x or y: t.append(f'translate({f(x)} {f(y)})')
    if r: t.append(f'rotate({f(r)})')
    if s != 1: t.append(f'scale({f(s)})')
    return f'<g transform="{" ".join(t)}">{body}</g>' if t else f'<g>{body}</g>'


def shape(i, x, y, size, fill):
    """Answer i's mark (triangle, diamond, circle, square), drawn in a size x size box at x, y."""
    return f'<path d="{SHAPES[i]}" fill="{fill}" transform="translate({f(x)} {f(y)}) scale({f(size / 100)})"/>'


# ---------------------------------------------------------------- the screens
def number_line(x, y, w, h):
    """The example's question picture (q1.svg of big-numbers-quiz.zip, as the film draws it), in a w x h box."""
    s = w / 1600
    out = f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(max(1, w * .02))}" fill="#fff"/>'
    k = h / 340
    ln = lambda x1, y1, x2, y2, sw: f'<line x1="{f(x + x1 * s)}" y1="{f(y + y1 * k)}" x2="{f(x + x2 * s)}" y2="{f(y + y2 * k)}" stroke="#222" stroke-width="{f(sw * s * 1.6)}"/>'
    out += ln(80, 240, 1520, 240, 5)
    for i in range(11):
        tx = 100 + i * 140
        out += ln(tx, 240, tx, 180 if i % 5 == 0 else 214, 6 if i % 5 == 0 else 4)
    ax = x + 520 * s
    out += f'<line x1="{f(ax)}" y1="{f(y + 50 * k)}" x2="{f(ax)}" y2="{f(y + 150 * k)}" stroke="{TEAL}" stroke-width="{f(18 * s * 1.6)}"/>'
    out += f'<path d="M{f(ax - 34 * s * 1.6)} {f(y + 140 * k)} H{f(ax + 34 * s * 1.6)} L{f(ax)} {f(y + 196 * k)}Z" fill="{TEAL}"/>'
    return out


def tile(i, x, y, w, h, mark=None, text=True):
    """One answer's tile: its colour, its shape, a line standing for its text. mark: 'chosen' outlines it in ink, 'right' adds ✓."""
    r = min(w, h) * .14
    out = f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{ANS[i]}"/>'
    if w > h * 1.6:  # a wide tile: the shape at the left, the text beside it
        m = h * .62
        out += shape(i, x + h * .2, y + (h - m) / 2, m, ANS_INK[i])
        if text:
            out += f'<rect x="{f(x + h * 1.05)}" y="{f(y + h * .38)}" width="{f(min(w * .36, w - h * 1.4))}" height="{f(h * .24)}" rx="{f(h * .12)}" fill="{ANS_INK[i]}" opacity=".85"/>'
    else:  # a tall tile, as on a tablet: the shape over the text
        m = min(w * .5, h * .4)
        out += shape(i, x + (w - m) / 2, y + h * .16, m, ANS_INK[i])
        if text:
            out += f'<rect x="{f(x + w * .22)}" y="{f(y + h * .7)}" width="{f(w * .56)}" height="{f(max(1.5, h * .07))}" rx="1" fill="{ANS_INK[i]}" opacity=".85"/>'
    if mark in ('chosen', 'right'):
        sw = max(2, min(w, h) * .09)
        out += f'<rect x="{f(x - sw)}" y="{f(y - sw)}" width="{f(w + 2 * sw)}" height="{f(h + 2 * sw)}" rx="{f(r + sw)}" fill="none" stroke="{INK}" stroke-width="{f(sw)}"/>'
    if mark == 'right':
        c = h * .5
        cx, cy = x + w - h * .5, y + h / 2
        out += f'<path d="M{f(cx - c * .42)} {f(cy)} l{f(c * .3)} {f(c * .3)} l{f(c * .55)} {f(-c * .6)}" fill="none" stroke="{ANS_INK[i]}" stroke-width="{f(max(2, h * .14))}" stroke-linecap="round" stroke-linejoin="round"/>'
    return out


def big_screen(x, y, w, votes=None):
    """The wall on the big screen: where the question stands and who is in, the question, its picture, the four tiles;
    votes: how far each tile's split bar has filled (0 to 1), as at the split, before the solution."""
    h = w * 9 / 16
    p = w / 100  # one hundredth of the width
    out = f'<rect x="{f(x - 2 * p)}" y="{f(y - 2 * p)}" width="{f(w + 4 * p)}" height="{f(h + 4 * p)}" rx="{f(p)}" fill="#c7c1b6"/>'
    out += f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{PAPER}"/>'
    # the bar: where the question stands, the avatars of those in, the count
    out += f'<rect x="{f(x + 3 * p)}" y="{f(y + 3.4 * p)}" width="{f(5 * p)}" height="{f(1.8 * p)}" rx="{f(.6 * p)}" fill="{INK}" opacity=".7"/>'
    for n in range(14):
        out += f'<circle cx="{f(x + 13 * p + n * 4.4 * p)}" cy="{f(y + 4.3 * p)}" r="{f(1.7 * p)}" fill="{TOPS[(n * 3 + 1) % len(TOPS)]}"/>'
    out += f'<rect x="{f(x + 89 * p)}" y="{f(y + 3.4 * p)}" width="{f(8 * p)}" height="{f(1.8 * p)}" rx="{f(.6 * p)}" fill="{GOOD}"/>'
    # the question, one line
    out += f'<rect x="{f(x + 22 * p)}" y="{f(y + 9 * p)}" width="{f(56 * p)}" height="{f(3.6 * p)}" rx="{f(1.2 * p)}" fill="{INK}"/>'
    out += number_line(x + 3 * p, y + 15.5 * p, 94 * p, 17 * p)
    tw, th = 46 * p, 10.4 * p
    for i in range(4):
        tx = x + 3 * p + (i % 2) * (tw + 2 * p)
        ty = y + 34.5 * p + (i // 2) * (th + 2 * p)
        out += tile(i, tx, ty, tw, th)
        if votes:
            out += f'<rect x="{f(tx)}" y="{f(ty + th - 1.2 * p)}" width="{f(tw * votes[i])}" height="{f(1.2 * p)}" fill="#fff" opacity=".55"/>'
    return out


def tablet_choices(w):
    """A player's tablet in a room with a big screen, upright, centred on 0, 0: the four choices only."""
    h = w * 1.6
    b = w * .07
    out = f'<rect x="{f(-w / 2 - b)}" y="{f(-h / 2 - b)}" width="{f(w + 2 * b)}" height="{f(h + 2 * b)}" rx="{f(w * .12)}" fill="{FRAME}"/>'
    out += f'<rect x="{f(-w / 2)}" y="{f(-h / 2)}" width="{f(w)}" height="{f(h)}" rx="{f(w * .04)}" fill="{PAPER}"/>'
    gp = w * .04
    top = h * .1
    tw, th = (w - 3 * gp) / 2, (h - top - 3 * gp) / 2
    out += f'<circle cx="{f(-w / 2 + gp + w * .05)}" cy="{f(-h / 2 + top / 2)}" r="{f(w * .05)}" fill="{TOPS[2]}"/>'
    for i in range(4):
        out += tile(i, -w / 2 + gp + (i % 2) * (tw + gp), -h / 2 + top + gp + (i // 2) * (th + gp), tw, th)
    return out


def phone_question(w, mark=None):
    """A phone held upright, centred on 0, 0, showing the whole question: the bar, the question, its picture, the
    choices one under the other. mark: (answer, 'chosen' | 'right')."""
    h = w * 2
    b = w * .06
    out = f'<rect x="{f(-w / 2 - b)}" y="{f(-h / 2 - b)}" width="{f(w + 2 * b)}" height="{f(h + 2 * b)}" rx="{f(w * .16)}" fill="#1b1b1d"/>'
    out += f'<rect x="{f(-w / 2)}" y="{f(-h / 2)}" width="{f(w)}" height="{f(h)}" rx="{f(w * .1)}" fill="{PAPER}"/>'
    x0, y = -w / 2 + w * .08, -h / 2 + h * .05
    iw = w * .84
    out += f'<rect x="{f(x0)}" y="{f(y)}" width="{f(iw * .18)}" height="{f(h * .022)}" rx="1" fill="{INK}" opacity=".6"/>'
    out += f'<circle cx="{f(x0 + iw - w * .05)}" cy="{f(y + h * .011)}" r="{f(w * .05)}" fill="{TOPS[6]}"/>'
    y += h * .065
    out += f'<rect x="{f(x0 + iw * .04)}" y="{f(y)}" width="{f(iw * .92)}" height="{f(h * .034)}" rx="{f(h * .012)}" fill="{INK}"/>'
    y += h * .06
    out += f'<rect x="{f(x0 + iw * .2)}" y="{f(y)}" width="{f(iw * .6)}" height="{f(h * .034)}" rx="{f(h * .012)}" fill="{INK}"/>'
    y += h * .065
    out += number_line(x0, y, iw, iw * .34)
    y += iw * .34 + h * .04
    th, gp = h * .1, h * .025
    for i in range(4):
        m = mark[1] if mark and mark[0] == i else None
        out += tile(i, x0, y + i * (th + gp), iw, th, m)
    return out


# ---------------------------------------------------------------- people
# A figure seen from behind, as the film's children are (film.js, makeKid): origin at the head's centre, the head's
# radius 33, the top running out of the picture's foot. hair: the film's seven cuts.
def hair_cut(n):
    curls = ''.join(f'<circle cx="{f(28 * math.cos(i / 9 * 2 * math.pi))}" cy="{f(-4 + 28 * math.sin(i / 9 * 2 * math.pi))}" r="13"/>' for i in range(9))
    return [
        '<circle cx="0" cy="-3" r="35"/>',
        '<circle cx="0" cy="-3" r="35"/><ellipse cx="0" cy="38" rx="11" ry="27"/><rect x="-8" y="22" width="16" height="7" rx="3" fill="#f5c518"/>',
        '<circle cx="0" cy="-3" r="35"/><circle cx="0" cy="-38" r="15"/>',
        '<path d="M-35 -3 A35 35 0 0 1 35 -3 L38 58 Q0 70 -38 58Z"/>',
        f'<circle cx="0" cy="-4" r="31"/>{curls}',
        '<circle cx="0" cy="-3" r="35"/><ellipse cx="-27" cy="42" rx="8" ry="25"/><ellipse cx="27" cy="42" rx="8" ry="25"/>',
        '<circle cx="0" cy="-3" r="35"/><path d="M-30 -18 L-24 -44 L-14 -26 L-4 -50 L6 -28 L16 -48 L22 -24 L32 -38 L32 -14Z"/>',
    ][n]


def person_back(hair, hair_c, skin, top, turn=0, wide=1.0, extra=''):
    """turn: -1 or 1 turns the head to that side (the hair shifts, a strip of face and the nose show); wide widens the
    shoulders for an adult; extra is drawn over the top (an arm, a hand)."""
    sk, skd = skin
    sw = 58 * wide
    body = f'<path d="M{f(-sw)} 46 Q{f(-sw - 2)} 36 {f(-sw + 20)} 33 L{f(sw - 20)} 33 Q{f(sw + 2)} 36 {f(sw)} 46 L{f(sw + 8)} 300 L{f(-sw - 8)} 300Z" fill="{top}"/>'
    neck = f'<rect x="-11" y="20" width="22" height="18" fill="{skd}"/>'
    nose = f'<circle cx="{31 * turn}" cy="6" r="7" fill="{sk}"/>' if turn else ''
    head = (f'<g transform="translate({4 * turn} 0)"><circle r="33" fill="{sk}"/><ellipse cx="-33" cy="4" rx="6" ry="9" fill="{sk}"/>'
            f'<ellipse cx="33" cy="4" rx="6" ry="9" fill="{sk}"/>{nose}'
            f'<g fill="{hair_c}" transform="translate({-9 * turn} 0)">{hair_cut(hair)}</g></g>')
    return body + neck + head + extra


def hand(x, y, skin, r=12):
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="{skin[0]}"/>'


def sleeve(points, top, w=22):
    d = 'M' + ' L'.join(f'{f(a)} {f(b)}' for a, b in points)
    return f'<path d="{d}" fill="none" stroke="{top}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def ik(sx, sy, tx, ty, l1, l2, bend):
    """The film's two-bone reach: the elbow and the hand for an arm from s towards t."""
    dx, dy = tx - sx, ty - sy
    d = min(max(math.hypot(dx, dy), abs(l1 - l2) + 1), l1 + l2 - .5)
    th = math.atan2(dy, dx)
    a = math.acos(min(max((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1), 1))
    return (sx + l1 * math.cos(th + bend * a), sy + l1 * math.sin(th + bend * a)), (sx + d * math.cos(th), sy + d * math.sin(th))


def teacher_side(point_at):
    """The film's teacher, side-on, facing right (film.js, makeTeacherSide), the phone in the far hand, the near arm
    pointing at point_at (in the figure's own units, from the base of the neck)."""
    top, topd, hair, skin, skind, trou = '#5b6f8a', '#4a5c75', '#4a2f1d', '#e9b892', '#d9a07a', '#2f3440'
    sh, l1, l2 = (4, 10), 70, 64
    px, py = 74, 44
    e1, h1 = ik(sh[0], sh[1], px - 4, py + 18, l1, l2, 1)
    dx, dy = point_at[0] - sh[0], point_at[1] - sh[1]
    dl = math.hypot(dx, dy)
    e2, h2 = ik(sh[0], sh[1], sh[0] + dx / dl * (l1 + l2) * .97, sh[1] + dy / dl * (l1 + l2) * .97, l1, l2, 1)
    return (f'<path d="M0 236 V560" stroke="#262a33" stroke-width="34" stroke-linecap="round"/>'
            f'<path d="M{sh[0]} {sh[1]} L{f(e1[0])} {f(e1[1])} L{f(h1[0])} {f(h1[1])}" fill="none" stroke="{topd}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<circle cx="{f(h1[0])}" cy="{f(h1[1])}" r="11" fill="{skind}"/>'
            f'<path d="M8 236 V560" stroke="{trou}" stroke-width="34" stroke-linecap="round"/>'
            f'<path d="M-30 12 Q-30 -4 -10 -6 L12 -6 Q32 -4 34 14 Q44 64 36 124 L32 248 L-34 248 L-34 124 Q-38 64 -30 12Z" fill="{top}"/>'
            f'<rect x="-6" y="-24" width="18" height="26" fill="{skind}"/>'
            f'<g transform="rotate(-9 4 -10)"><circle cx="6" cy="-56" r="36" fill="{skin}"/><circle cx="41" cy="-52" r="7" fill="{skin}"/><circle cx="25" cy="-63" r="3.3" fill="{INK}"/>'
            f'<path d="M38 -78 C24 -100 -26 -100 -36 -62 C-42 -42 -34 -26 -20 -20 L-10 -32 C-16 -52 -2 -70 38 -72Z" fill="{hair}"/><circle cx="-32" cy="-34" r="15" fill="{hair}"/>'
            f'<ellipse cx="-2" cy="-50" rx="6" ry="9" fill="{skind}"/></g>'
            f'<g transform="translate({px} {py}) rotate(-8)"><rect x="-13" y="-25" width="26" height="50" rx="5" fill="#1b1b1d"/><rect x="-10" y="-21" width="20" height="40" rx="2" fill="{PAPER}"/><rect x="-7" y="-9" width="14" height="8" rx="2" fill="{INK}"/></g>'
            f'<path d="M{sh[0]} {sh[1]} L{f(e2[0])} {f(e2[1])} L{f(h2[0])} {f(h2[1])}" fill="none" stroke="{top}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="M{f(h2[0])} {f(h2[1])} l{f(dx / dl * 22)} {f(dy / dl * 22)}" stroke="{skin}" stroke-width="7" stroke-linecap="round"/>'
            f'<circle cx="{f(h2[0])}" cy="{f(h2[1])}" r="12" fill="{skin}"/>')


def bubble(kind, w=62):
    """The film's wordless bubble (film.js, makeBubbles), its tail's tip at about 0, 58: '?', '!' or 'ha', a laugh."""
    path = (f'<path d="M{-w / 2} -30 Q{-w / 2} -40 {-w / 2 + 10} -40 H{w / 2 - 10} Q{w / 2} -40 {w / 2} -30 V24 Q{w / 2} 34 {w / 2 - 10} 34 '
            f'H8 L-6 58 L-6 34 H{-w / 2 + 10} Q{-w / 2} 34 {-w / 2} 24Z" fill="#fff" stroke="{INK}" stroke-width="3.5"/>')
    if kind == '?':
        glyph = f'<path d="M-10 -14 Q-10 -27 1 -27 Q12 -27 12 -16 Q12 -8 5 -4 Q1 -1 1 5" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="1" cy="17" r="5" fill="{INK}"/>'
    elif kind == '!':
        glyph = f'<path d="M0 -26 V3" stroke="{ACCENT}" stroke-width="10" stroke-linecap="round"/><circle cx="0" cy="17" r="5.5" fill="{ACCENT}"/>'
    else:
        glyph = (f'<path d="M-22 -6 Q0 22 22 -6Z" fill="{INK}"/>'
                 f'<path d="M-20 -18 q6 -6 12 0 M8 -18 q6 -6 12 0" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>')
    return path + glyph


# ---------------------------------------------------------------- the three pictures
def quizmaster():
    """A class at the big screen: the question on the wall, a tablet over a child's shoulder with the choices only,
    the teacher with the phone pointing at the picture; the votes split, a murmur."""
    o = f'<rect width="{W}" height="{H}" fill="#efe6d8"/><rect y="330" width="{W}" height="70" fill="#d6c2a3"/>'
    o += '<rect x="-10" y="40" width="130" height="96" rx="5" fill="#c9a274"/><rect x="10" y="52" width="40" height="52" fill="#fff" transform="rotate(-3 30 78)"/><rect x="62" y="58" width="44" height="34" fill="#f6e7a6"/>'
    sx, sy, sw = 196, 26, 414
    o += big_screen(sx, sy, sw, votes=[.6, .3, .1, 0])
    # the teacher at the left, pointing at the arrow in the picture
    # the teacher at the left, pointing at the arrow in the picture: the one a quizmaster is, so big enough to be seen
    ts, tx, ty = .76, 104, 196
    arrow = (sx + sw * (.03 + .94 * 520 / 1600), sy + sw * (.155 + .17 * .4))
    o += g(teacher_side(((arrow[0] - tx) / ts, (arrow[1] - ty) / ts)), tx, ty, ts)
    # the class, from behind: a back row, a front row, and the child whose tablet we see over the shoulder. The heads
    # beside and behind the tablet are fair, so its dark frame stands apart from them at a phone's size.
    back = [(232, 300, 2, 4, 1, 0, 0), (294, 296, 4, 0, 3, 1, 1), (356, 302, 5, 6, 0, 4, 0), (418, 297, 0, 3, 4, 3, -1),
            (480, 301, 6, 6, 2, 5, 0), (542, 296, 3, 7, 1, 6, 0), (604, 300, 1, 5, 4, 7, 0)]
    for x, y, hc, hcol, sk, tp, turn in back:
        o += g(person_back(hc, HAIR[hcol], SKIN[sk], TOPS[tp], turn=turn), x, y, .5)
    front = [(244, 354, 0, 4, 3, 1, 1), (604, 352, 4, 0, 2, 0, -1)]
    for x, y, hc, hcol, sk, tp, turn in front:
        o += g(person_back(hc, HAIR[hcol], SKIN[sk], TOPS[tp], turn=turn), x, y, .7)
    o += g(bubble('?'), 262, 246, .52)
    o += g(bubble('!'), 586, 246, .52)
    # the tablet held up in two hands, to the child's left, the choices only
    kid = dict(hair=1, hair_c='#a0432a', skin=SKIN[0], top=TOPS[2])
    kx, ky, ks = 494, 334, 1.0
    tab = g(tablet_choices(92), -100, -6, 1, -6)
    hands = hand(-146, 64, kid['skin']) + hand(-54, 54, kid['skin'])
    arms = sleeve([(-44, 60), (-66, 84), (-136, 84)], kid['top'], 22) + sleeve([(-20, 52), (-50, 62)], kid['top'], 22)
    o += g(person_back(kid['hair'], kid['hair_c'], kid['skin'], kid['top'], turn=0, extra=arms + tab + hands), kx, ky, ks)
    return o


def peers():
    """Friends on a sofa on a games night, seen from behind it, each with the whole question on their own phone; no big
    screen in the room. One laughs."""
    o = f'<rect width="{W}" height="{H}" fill="#e9dcc8"/>'
    o += '<defs><radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></radialGradient></defs>'
    # the window at night, a shelf with a plant, the floor lamp
    o += '<rect x="36" y="34" width="150" height="170" rx="4" fill="#f4ecdf"/><rect x="46" y="44" width="130" height="150" fill="#2e4766"/>'
    o += '<path d="M111 44 V194 M46 119 H176" stroke="#f4ecdf" stroke-width="6"/><circle cx="148" cy="72" r="12" fill="#f3e6b4"/><circle cx="141" cy="68" r="10" fill="#2e4766"/>'
    o += '<circle cx="70" cy="66" r="2" fill="#f3e6b4"/><circle cx="88" cy="96" r="1.6" fill="#f3e6b4"/><circle cx="160" cy="150" r="1.6" fill="#f3e6b4"/>'
    o += '<circle cx="560" cy="96" r="130" fill="url(#lamp)"/><path d="M560 112 V330" stroke="#3b3a36" stroke-width="6"/><path d="M526 56 H594 L612 112 H508Z" fill="#f2c46d"/>'
    o += '<rect x="250" y="70" width="180" height="10" rx="3" fill="#b9946a"/><rect x="268" y="44" width="22" height="26" rx="3" fill="#a8471a"/><rect x="294" y="38" width="16" height="32" rx="2" fill="#2f7f86"/><rect x="313" y="48" width="20" height="22" rx="2" fill="#e8b100"/>'
    o += '<path d="M392 70 q-4 -22 -14 -30 q14 4 16 18 q2 -20 14 -26 q-6 14 -8 30 q8 -12 20 -12 q-12 8 -16 20Z" fill="#4f8a4b"/><rect x="382" y="58" width="26" height="14" rx="3" fill="#c98a5e"/>'
    # three friends behind the sofa's back, each phone held up beside the head
    friends = [
        dict(x=124, y=212, s=.92, hair=3, hc=HAIR[1], sk=SKIN[1], top='#8e4ec6', turn=1, mark=(0, 'chosen'), side=1),
        dict(x=312, y=200, s=.92, hair=4, hc=HAIR[4], sk=SKIN[3], top='#f28c28', turn=-1, mark=None, side=1),
        dict(x=478, y=214, s=.92, hair=0, hc=HAIR[6], sk=SKIN[4], top='#3e7bfa', turn=-1, mark=(1, 'chosen'), side=1),
    ]
    for fr in friends:
        sd = fr['side']
        ph = g(phone_question(68, fr['mark']), 88 * sd, 26, 1, 7 * sd)
        arm = sleeve([(34 * sd, 70), (66 * sd, 118), (76 * sd, 96)], fr['top'], 22)
        hd = hand(77 * sd, 86, fr['sk'], 12)
        o += g(person_back(fr['hair'], fr['hc'], fr['sk'], fr['top'], turn=fr['turn'], wide=1.12, extra=arm + ph + hd), fr['x'], fr['y'], fr['s'])
    o += g(bubble('ha'), 296, 108, .78)
    # the sofa's back across the foot, a cushion, a bowl of popcorn on the armrest
    o += '<path d="M10 330 Q10 314 30 314 H590 Q610 314 610 330 V410 H10Z" fill="#2f7f86"/><path d="M10 340 H610" stroke="#286e74" stroke-width="4"/>'
    o += '<rect x="-30" y="296" width="62" height="120" rx="22" fill="#286e74"/><rect x="588" y="296" width="72" height="120" rx="22" fill="#286e74"/>'
    py = 296
    o += f'<path d="M624 {py - 8} Q648 {py - 8} 650 {py} H598 Q600 {py - 8} 624 {py - 8}Z" fill="#fff"/><path d="M594 {py} H654 L644 {py + 22} H604Z" fill="#d93b3b"/><path d="M606 {py} H618 L616 {py + 22} H610Z M630 {py} H642 L638 {py + 22} H632Z" fill="#fff"/>'
    o += ''.join(f'<circle cx="{602 + i * 7}" cy="{py - 6 - (i % 3) * 3}" r="5" fill="#fbf1d6"/>' for i in range(8))
    return o


def solo():
    """Someone alone at a desk with their notes, practising on a phone that shows the whole question, the answer just
    found right."""
    o = f'<rect width="{W}" height="{H}" fill="#efe6d8"/>'
    o += '<defs><radialGradient id="desk-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff1c8" stop-opacity=".95"/><stop offset="1" stop-color="#fff1c8" stop-opacity="0"/></radialGradient></defs>'
    # the pinboard, a sticky note and a sheet on it; the window by day
    o += '<rect x="400" y="30" width="200" height="130" rx="5" fill="#c9a274"/><rect x="418" y="44" width="56" height="72" fill="#fff" transform="rotate(-4 446 80)"/>'
    o += '<path d="M426 60 h36 M426 70 h30 M426 80 h38 M426 90 h24" stroke="#bdb8ae" stroke-width="3" transform="rotate(-4 446 80)"/>'
    o += '<rect x="492" y="52" width="46" height="40" fill="#f6e7a6" transform="rotate(5 515 72)"/><rect x="548" y="96" width="38" height="34" fill="#f8c7c1" transform="rotate(-6 567 113)"/>'
    o += '<rect x="40" y="30" width="150" height="150" rx="4" fill="#f4ecdf"/><rect x="50" y="40" width="130" height="130" fill="#bfdcef"/><path d="M115 40 V170 M50 105 H180" stroke="#f4ecdf" stroke-width="6"/>'
    o += '<path d="M50 150 q30 -26 60 -6 q30 -22 70 -2 V170 H50Z" fill="#9cc58f"/>'
    # the desk, the lamp and its light, the books, the mug, the notes and the highlighter
    o += '<circle cx="478" cy="282" r="150" fill="url(#desk-lamp)"/>'
    o += '<path d="M-10 286 H650 V400 H-10Z" fill="#c89f72"/><rect x="-10" y="286" width="660" height="8" fill="#b88d60"/>'
    o += '<path d="M548 286 L540 278 H588 L580 286Z" fill="#3b3a36"/><path d="M564 278 L540 206 L492 196" fill="none" stroke="#3b3a36" stroke-width="7" stroke-linejoin="round"/><path d="M464 226 Q466 190 493 190 Q520 190 522 226Z" fill="#2f7f86"/><rect x="489" y="184" width="8" height="8" rx="2" fill="#3b3a36"/>'
    o += '<rect x="586" y="246" width="70" height="16" rx="2" fill="#5b6f8a"/><rect x="580" y="262" width="70" height="14" rx="2" fill="#a8471a"/><rect x="590" y="276" width="70" height="12" rx="2" fill="#e8b100"/>'
    o += '<rect x="30" y="248" width="40" height="44" rx="7" fill="#2f7f86"/><path d="M70 258 q16 2 14 16 q-2 12 -14 12" fill="none" stroke="#2f7f86" stroke-width="6"/><ellipse cx="50" cy="250" rx="20" ry="4.5" fill="#215c61"/>'
    o += g('<rect width="118" height="84" fill="#fff"/><path d="M12 16 h70 M12 30 h90 M12 44 h60 M12 58 h84 M12 70 h50" stroke="#bdb8ae" stroke-width="4"/><rect x="10" y="40" width="64" height="9" fill="#f6e36f" opacity=".7"/>', 412, 300, 1, -6)
    o += '<rect x="514" y="330" width="62" height="12" rx="6" fill="#f6e36f" transform="rotate(14 545 336)"/><rect x="566" y="338" width="14" height="12" rx="3" fill="#3b3a36" transform="rotate(14 545 336)"/>'
    # the learner from behind, the phone held up to the right, the right answer just tapped
    sk, top = SKIN[2], '#e93d82'
    ph = g(phone_question(78, (0, 'right')), 110, -16, 1, 6)
    arm = sleeve([(48, 70), (86, 126), (98, 82)], top, 24)
    hd = hand(100, 66, sk, 14)
    o += g(person_back(2, HAIR[5], sk, top, turn=1, wide=1.0, extra=arm + ph + hd), 250, 232, 1.12)
    return o


PICTURES = {'quizmaster': quizmaster, 'peers': peers, 'solo': solo}


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<clipPath id="frame"><rect width="{W}" height="{H}"/></clipPath><g clip-path="url(#frame)">{body}</g></svg>\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, draw in PICTURES.items():
        p = OUT / f'way-{name}.svg'
        p.write_text(svg(draw()), encoding='utf-8', newline='\n')  # the same bytes on every machine
        print(p.relative_to(ROOT), f'{p.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
