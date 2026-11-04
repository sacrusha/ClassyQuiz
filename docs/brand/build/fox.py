"""The classyQuiz fox: master geometry, built clean (no masks, no strokes, no paper-coloured layers).

Designed in the avatar's 100-unit space (src/client/look.ts, the fox and its top hat), emitted in any
target space through an affine map (scale + offset), so every file carries baked coordinates.

Parts (100-space):
  HEAD   ears and face as one silhouette; its top runs hidden under the brim.
  HAT    crown above a band gap, then the band strip and the brim, one path (nonzero, same winding).
  FACE   the white face: two cheek patches reaching up round the eyes, joined below the nose, with the
         orange bridge running down between them to the nose.
  EYES   ink dots with a white glint; NOSE an ink ellipse at the foot of the bridge.
The ears stand clear of the crown, so the crown always meets the background: the band gap is a real
gap in every version, and one-colour cuts only need a gap round the brim.
"""
import math

# ---------------------------------------------------------------- parameters (100-space)
P = dict(
    # head
    ear_outer=(22.0, 46.0), ear_tip=(22.0, 12.6), ear_in=(33.778, 33.0),  # outer edge vertical, inner edge at 60 deg
    jaw_ctrl=(26.0, 74.0), chin=(50.0, 82.0),
    # hat
    crown_w=22.0, flare=2.502, crown_top=6.0, crown_r=1.8,   # flare: the crown sides lean out 5 deg
    brim_w=43.0, brim_h=5.2, brim_y=33.6, brim_c=1.1,       # brim_y: top edge at the centre; ends lift by brim_c
    gap_top=27.6, gap_h=1.8,                                # band gap in the crown
    # face
    A=(27.6, 50.6), A_ctrl=(34.2, 42.4), B=(45.4, 47.4),     # cheek top: outer corner A, over the eye to brow corner B
    bridge_ctrl=(46.4, 62.0), nose_join=50.0,               # bridge edge B -> nose, meeting it at this angle (deg from horizontal)
    out_ctrl=(30.6, 71.4), C=(50.0, 79.0),                  # cheek outer edge A -> chin C
    eye_c=(39.5, 53.4), eye_r=3.9, glint=(1.45, -1.6, 1.3),  # glint offset dx, dy, radius
    nose_c=(50.0, 74.4), nose_rx=4.7, nose_ry=3.6,
    gap=1.7,                                                # one-colour gap round the brim
)


def mirror(p):
    return (100 - p[0], p[1])


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def qpt(p0, c, p1, t):
    return lerp(lerp(p0, c, t), lerp(c, p1, t), t)


def qsplit(p0, c, p1, t):
    """Split a quadratic at t: returns ((p0, c0, m), (m, c1, p1))."""
    c0, c1 = lerp(p0, c, t), lerp(c, p1, t)
    m = lerp(c0, c1, t)
    return (p0, c0, m), (m, c1, p1)


def line_x_at_y(a, b, y):
    return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])


def line_quad_hit(a, b, q, lo=0.0, hi=1.0):
    """Parameter t on quadratic q where it crosses the infinite line a-b (bisection; one crossing assumed)."""
    def side(t):
        p = qpt(*q, t)
        return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    s_lo = side(lo)
    for _ in range(60):
        mid = (lo + hi) / 2
        if (side(mid) > 0) == (s_lo > 0):
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


# ---------------------------------------------------------------- path writer
class Pen:
    """Collects path commands in 100-space and emits them through map (k, dx, dy)."""

    def __init__(self, k=1.0, dx=0.0, dy=0.0, nd=2):
        self.k, self.dx, self.dy, self.nd, self.out = k, dx, dy, nd, []

    def n(self, v):
        s = f"{v:.{self.nd}f}".rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s

    def pt(self, p):
        return f"{self.n(p[0] * self.k + self.dx)} {self.n(p[1] * self.k + self.dy)}"

    def M(self, p): self.out.append("M" + self.pt(p)); return self
    def L(self, p): self.out.append("L" + self.pt(p)); return self
    def Q(self, c, p): self.out.append("Q" + self.pt(c) + " " + self.pt(p)); return self
    def Z(self): self.out.append("Z"); return self

    def A(self, rx, ry, large, sweep, p):
        self.out.append(f"A{self.n(rx * self.k)} {self.n(ry * self.k)} 0 {large} {sweep} {self.pt(p)}")
        return self

    def circle(self, c, r, cw=True):
        """Full circle as two arcs; cw picks the winding (screen clockwise)."""
        s = 1 if cw else 0
        a, b = (c[0] - r, c[1]), (c[0] + r, c[1])
        return self.M(a).A(r, r, 0, s, b).A(r, r, 0, s, a).Z()

    def d(self):
        return "".join(self.out)


# ---------------------------------------------------------------- parts
def ear_inner_line(p):
    return p["ear_tip"], p["ear_in"]


def head(pen, p=P):
    """Silhouette, clockwise. Top runs hidden under the brim at y=36."""
    tip, ein = ear_inner_line(p)
    yh = 36.0
    hid = (line_x_at_y(tip, ein, yh), yh)
    pen.M(p["ear_outer"]).L(tip).L(hid).L(mirror(hid)).L(mirror(tip)).L(mirror(p["ear_outer"]))
    pen.Q(mirror(p["jaw_ctrl"]), p["chin"]).Q(p["jaw_ctrl"], p["ear_outer"]).Z()


def brim_geom(p=P, grow=0.0):
    """Brim outline pieces, grown by `grow` all round: top quad (left->right), bottom quad (right->left), end radius."""
    bw, bh, by, c = p["brim_w"], p["brim_h"], p["brim_y"], p["brim_c"]
    rr = bh / 2 + grow
    xl, xr = 50 - bw / 2 + bh / 2, 50 + bw / 2 - bh / 2   # centres of the end arcs
    top = ((xl, by - c - grow), (50, by + c - grow), (xr, by - c - grow))
    bot = ((xr, by + bh - c + grow), (50, by + bh + c + grow), (xl, by + bh - c + grow))
    return top, bot, rr


def brim(pen, p=P):
    top, bot, rr = brim_geom(p)
    pen.M(top[0]).Q(top[1], top[2]).A(rr, rr, 0, 1, bot[0]).Q(bot[1], bot[2]).A(rr, rr, 0, 1, top[0]).Z()


def crown_x(p, y):
    """Left side of the crown at height y (flares toward the top)."""
    yb = p["brim_y"] + 1.0
    xb, xt = 50 - p["crown_w"] / 2, 50 - p["crown_w"] / 2 - p["flare"]
    return xb + (xt - xb) * (yb - y) / (yb - p["crown_top"])


def hat(pen, p=P):
    """Crown above the band gap; band strip; brim. All clockwise (nonzero merges strip and brim)."""
    r, yt = p["crown_r"], p["crown_top"]
    g0, g1 = p["gap_top"], p["gap_top"] + p["gap_h"]
    xl0, xlt = crown_x(p, g0), crown_x(p, yt)
    # upper crown: rounded top corners as arcs; sides follow the flare
    pen.M((xl0, g0)).L((xlt, yt + r)).A(r, r, 0, 1, (xlt + r, yt)).L((100 - xlt - r, yt)).A(r, r, 0, 1, (100 - xlt, yt + r))
    pen.L((100 - xl0, g0)).Z()
    # band strip: from the gap's foot down into the brim
    yb = p["brim_y"] + 1.0
    pen.M((crown_x(p, g1), g1)).L((100 - crown_x(p, g1), g1)).L((100 - crown_x(p, yb), yb)).L((crown_x(p, yb), yb)).Z()
    brim(pen, p)


def face(pen, p=P, with_nose_notch=True):
    """The white face, one region, clockwise: left cheek top A->B, bridge down to the nose, round the nose's
    lower side, up the right bridge, over the right eye, down the right cheek to the chin, up the left."""
    A, Ac, B, bc = p["A"], p["A_ctrl"], p["B"], p["bridge_ctrl"]
    (nx, ny), rx, ry = p["nose_c"], p["nose_rx"], p["nose_ry"]
    th = math.radians(p["nose_join"])
    N1 = (nx - rx * math.cos(th), ny - ry * math.sin(th))   # upper-left point on the nose
    N2 = mirror(N1)
    pen.M(A).Q(Ac, B).Q(bc, N1)
    # round the nose's lower side: from upper-left, anticlockwise on screen through left, bottom, right
    pen.A(rx, ry, 1, 0, N2)
    pen.Q(mirror(bc), mirror(B)).Q(mirror(Ac), mirror(A))
    pen.Q(mirror(p["out_ctrl"]), p["C"]).Q(p["out_ctrl"], A).Z()
    return N1, N2


def _offset_line(a, b, g):
    """Line a-b moved by g to its left on screen (outward for a clockwise contour): (point, direction)."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy)
    return (a[0] + g * dy / n, a[1] - g * dx / n), (dx, dy)


def _meet(l1, l2):
    (p, d), (q, e) = l1, l2
    den = d[0] * e[1] - d[1] * e[0]
    s = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den
    return (p[0] + s * d[0], p[1] + s * d[1])


def face_grown(pen, g, p=P):
    """The white face grown by g everywhere except along the nose, where it keeps the nose's outline.
    Offset of the control polygon (exact for the lines, close for these shallow quadratics)."""
    A, Ac, B, bc, out, C = p["A"], p["A_ctrl"], p["B"], p["bridge_ctrl"], p["out_ctrl"], p["C"]
    (nx, ny), rx, ry = p["nose_c"], p["nose_rx"], p["nose_ry"]
    th = math.radians(p["nose_join"])
    N1 = (nx - rx * math.cos(th), ny - ry * math.sin(th))
    e1, e2, e3, e4 = (_offset_line(A, Ac, g), _offset_line(Ac, B, g), _offset_line(B, bc, g), _offset_line(bc, N1, g))
    eC, eL = _offset_line(C, out, g), _offset_line(out, A, g)
    A2, Ac2, B2, bc2, out2 = _meet(eL, e1), _meet(e1, e2), _meet(e2, e3), _meet(e3, e4), _meet(eC, eL)
    C2 = _meet(eC, ((50.0, 0.0), (0.0, 1.0)))
    # where the offset bridge edge meets the nose ellipse (first hit going down)
    (px, py), (dx, dy) = e4
    lo, hi = 0.0, 1.5
    inside = lambda s: ((px + s * dx - nx) / rx) ** 2 + ((py + s * dy - ny) / ry) ** 2 - 1
    for _ in range(60):
        mid = (lo + hi) / 2
        if inside(mid) > 0:
            lo = mid
        else:
            hi = mid
    N1g = (px + lo * dx, py + lo * dy)
    pen.M(A2).Q(Ac2, B2).Q(bc2, N1g).A(rx, ry, 1, 0, mirror(N1g))
    pen.Q(mirror(bc2), mirror(B2)).Q(mirror(Ac2), mirror(A2)).Q(mirror(out2), C2).Q(out2, A2).Z()


def eyes(pen, p=P, glints_as_holes=True):
    for c in (p["eye_c"], mirror(p["eye_c"])):
        pen.circle(c, p["eye_r"])
        if glints_as_holes:
            gx, gy, gr = p["glint"]
            pen.circle((c[0] + gx, c[1] + gy), gr, cw=False)


def glints(pen, p=P):
    gx, gy, gr = p["glint"]
    for c in (p["eye_c"], mirror(p["eye_c"])):
        pen.circle((c[0] + gx, c[1] + gy), gr)


def nose(pen, p=P):
    (nx, ny), rx, ry = p["nose_c"], p["nose_rx"], p["nose_ry"]
    pen.M((nx - rx, ny)).A(rx, ry, 0, 1, (nx + rx, ny)).A(rx, ry, 0, 1, (nx - rx, ny)).Z()


def head_bitten(pen, p=P):
    """Head minus the brim grown by the gap: for one-colour cuts. Clockwise outer contour."""
    g = p["gap"]
    tip, ein = ear_inner_line(p)
    top, bot, rr = brim_geom(p, grow=g)
    t1 = line_quad_hit(tip, ein, top, 0.0, 0.5)          # left ear's inner edge meets the grown brim top
    (_, c0, I1), _ = qsplit(*top, t1)                     # piece of top from its start to I1
    t2 = 1 - t1
    _, (I2, c1, _) = qsplit(*top, t2)                     # piece from I2 to the end (mirror)
    pen.M(p["ear_outer"]).L(tip).L(I1)
    # along the grown brim top back to its left end (reverse of start->I1)
    pen.Q(c0, top[0])
    # round the left end, down: from the top-left point to the bottom-left point, anticlockwise on screen
    pen.A(rr, rr, 0, 0, bot[2])
    # along the bottom, left to right (reverse of bot, which runs right->left)
    pen.Q(bot[1], bot[0])
    pen.A(rr, rr, 0, 0, top[2])
    pen.Q(c1, I2)
    pen.L(mirror(tip)).L(mirror(p["ear_outer"]))
    pen.Q(mirror(p["jaw_ctrl"]), p["chin"]).Q(p["jaw_ctrl"], p["ear_outer"]).Z()


# ---------------------------------------------------------------- compositions
BBOX = (22.0, 6.0, 78.0, 82.0)   # x0, y0, x1, y1 of the drawing (ear outer corners 22/78, crown top 6, chin 82)


def build(kind, pen_factory, col):
    """kind: colour | mono | reversed. col: dict of fills. Returns SVG body (paths)."""
    out = []

    def path(fill, fn, rule=None, **kw):
        pen = pen_factory()
        fn(pen, **kw)
        r = f' fill-rule="{rule}"' if rule else ""
        out.append(f'<path fill="{fill}"{r} d="{pen.d()}"/>')

    if kind == "colour":
        path(col["orange"], head)
        path(col["white"], face)
        def ink(pen):
            eyes(pen); nose(pen)
        path(col["ink"], ink, "evenodd")    # glints are holes in the eyes, over the white face
        path(col["hat"], hat)
    elif kind == "mono":
        def m(pen):
            head_bitten(pen); face(pen); eyes(pen)
        path(col["ink"], m, "evenodd")      # the face is a hole; eyes ink again; glints holes
        path(col["ink"], hat)
    elif kind == "reversed":
        def r(pen):
            head_bitten(pen); face_grown(pen, P["gap"]); face(pen); eyes(pen); nose(pen)
        # a dark line round the face keeps the fox's markings; eyes and nose are holes; glints light again
        path(col["ink"], r, "evenodd")
        path(col["ink"], hat)
    return "".join(out)


def fit(box, x0=0.0, y0=0.0, w=256.0, h=256.0, pad=16.0, up=0.0):
    """Map the drawing's bbox into a target rectangle (contain, centred); up shifts optically upward."""
    bx0, by0, bx1, by1 = box
    k = min((w - 2 * pad) / (bx1 - bx0), (h - 2 * pad) / (by1 - by0))
    dx = x0 + (w - (bx1 - bx0) * k) / 2 - bx0 * k
    dy = y0 + (h - (by1 - by0) * k) / 2 - by0 * k - up
    return k, dx, dy
