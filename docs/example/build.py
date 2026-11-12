"""Draws the examples' conversations as the AI app's own chat, in four languages and
two colour schemes: the sheets run's, src/public/examples/conversation-<lang>-<light|dark>.webp,
the space run's (the root page's "Idea" tab), conversation-idea-<lang>-<light|dark>.webp,
with that run's overview of its questions, review-idea-<lang>.webp, which its chat shows, and the notes run's
(the "Notes" tab), conversation-notes-<lang>-<light|dark>.webp, with the pictures of its notes' pages
(src/public/examples/notes-<lang>-<page>.webp for /example, src/public/landing/notes-<lang>.webp for the root page).

Run (from anywhere): py -I docs/example/build.py [--convo idea] [--lang de] [--theme dark] [--keep]
  --convo           only that conversation, sheets, idea or notes (default: all three)
  --lang / --theme  only that language / scheme (default: all 8 pictures of each)
  --keep            also leave the pages and the full-size PNGs in .tmp/example/ (git-ignored)

The words are text.py's, space_text.py's and notes_text.py's; the page is HTML drawn here and shot in the installed Edge
(playwright, as docs/film/build/shoot.py does). Needs Pillow and playwright, and PyMuPDF for the notes' pages.
The space run's overview: German is the AI's own review.png (space-review-original.webp here, 1500 px
wide); the other three are drawn from their translated .zip by the site's own src/public/preview.py, the
script the guidance offers the AI for it.
The faces are those of the machine (Segoe UI, Cambria, Consolas on Windows): the
pictures differ a little on another one.
"""
import html, json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
EX = ROOT / "src" / "public" / "examples"
TMP = ROOT / ".tmp" / "example"
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
import text as T  # noqa: E402
import space_text as S  # noqa: E402
import notes_text as N  # noqa: E402

WIDTH = 681          # sheets-conversation-original.webp's width
SCALE = 2            # rendered at 2x, scaled down to WIDTH
NB = " "


# ------------------------------------------------------------------ words

def film_content():
    """CONTENT of docs/film/build/film.js, read per language (the keys text.FILM names)."""
    src = (ROOT / "docs" / "film" / "build" / "film.js").read_text(encoding="utf-8")
    body = src[src.index("const CONTENT = {"):src.index("const COMMON")]
    out = {}
    for lang in T.LANGS:
        m = re.search(r"\n    %s: \{(.*?)\n    \},\n" % lang, body, re.S)
        block = m.group(1)
        d = {}
        for k, v in re.findall(r"(\w+): '((?:[^'\\]|\\.)*)'", block):
            d[k] = v.replace("\\'", "'")
        out[lang] = d
    return out


def check_film():
    film = film_content()
    bad = []
    for lang in T.LANGS:
        for k, v in T.FILM[lang].items():
            if film[lang].get(k) != v:
                bad.append(f"{lang}.{k}: text.py {v!r} / film.js {film[lang].get(k)!r}")
    if bad:
        raise SystemExit("text.py differs from film.js CONTENT:\n  " + "\n  ".join(bad))


def ask_notes():
    """askNotes of src/client/landing-text.ts per language: the root page's ask is the notes run's."""
    src = (ROOT / "src" / "client" / "landing-text.ts").read_text(encoding="utf-8")
    out = {}
    for lang in N.LANGS:
        block = src[src.index(f"\nconst {lang}: Text = {{"):]
        m = re.search(r'\n  askNotes: "((?:[^"\\]|\\.)*)",', block)
        out[lang] = m.group(1).replace('\\"', '"')
    return out


def pick(v, lang, key_hint=None):
    """A piece's text in a language: a dict of languages, or the name of a film/UI entry."""
    if isinstance(v, str):
        v = T.UI[v] if v in T.UI else {l: T.FILM[l][v] for l in T.LANGS}
    return v[lang]


def fmt(s, lang):
    """Plain text with **bold** and `code` into HTML; no-break spaces where the language wants them."""
    s = s.replace("{zip}", T.FILM[lang]["zipFile"])
    s = re.sub(r"(\d) (\d{3})(?!\d)", lambda m: m.group(1) + NB + m.group(2), s)
    if lang == "fr":
        s = re.sub(r" ([:;?!»])", NB + r"\1", s)
        s = s.replace("« ", "«" + NB)
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


# ------------------------------------------------------------------ pictures in the cards

def numberline(x0, x1, y, n, big, small, bigs, sw, cls="nl"):
    """Ticks from x0 to x1 (n intervals), the ends and bigs tall, on an axis at y; returns SVG parts and tick x's."""
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    parts = [f'<line class="{cls}" x1="{x0 - (x1 - x0) / n * 0.15:.1f}" x2="{x1 + (x1 - x0) / n * 0.15:.1f}" y1="{y}" y2="{y}" stroke-width="{sw}"/>']
    for i, x in enumerate(xs):
        h = big if i in bigs else small
        parts.append(f'<line class="{cls}" x1="{x:.1f}" x2="{x:.1f}" y1="{y - h}" y2="{y}" stroke-width="{sw * (1.15 if i in bigs else 0.9):.2f}"/>')
    return parts, xs


def arrow(x, top, tip, w, hw, hh):
    return (f'<line class="ar" x1="{x:.1f}" x2="{x:.1f}" y1="{top}" y2="{tip - hh + 1}" stroke-width="{w}"/>'
            f'<path class="arf" d="M{x - hw / 2:.1f} {tip - hh} L{x + hw / 2:.1f} {tip - hh} L{x:.1f} {tip}Z"/>')


def svg_big_line(label0, label1, label2):
    """Card 1: 640 000 to 660 000, the arrow at 646 000."""
    parts, xs = numberline(62.5, 571.5, 173, 10, 21, 10, {0, 5, 10}, 2)
    parts.append(arrow(xs[3], 104, 151, 4, 20, 20))
    for x, t in zip((xs[0], xs[5], xs[10]), (label0, label1, label2)):
        parts.append(f'<text class="lb" x="{x:.1f}" y="195" font-size="14.5" text-anchor="middle">{t}</text>')
    return f'<svg class="pic" width="634" height="356" viewBox="0 0 634 356">{"".join(parts)}</svg>'


def svg_mini_line(frac, a, b, c):
    """Card 2: one of the four framed lines: 640 000 to 660 000, an arrow at `frac` of the way."""
    parts, xs = numberline(20, 257, 35, 10, 10, 5, {0, 5, 10}, 1.1)
    ax = 20 + 237 * frac
    parts.append(arrow(ax, 6, 33, 1.8, 9, 8))
    for x, t in zip((xs[0], xs[5], xs[10]), (a, b, c)):
        parts.append(f'<text class="lb" x="{x:.1f}" y="47" font-size="8.6" text-anchor="middle">{t}</text>')
    return f'<svg width="278" height="50" viewBox="0 0 278 50">{"".join(parts)}</svg>'


def svg_sections():
    """Card 4: the four sections A-D, each a line of 20 steps with its end numbers."""
    rows = [("A", "4000", "5000"), ("B", "45 000", "46 000"), ("C", "405 000", "405 100"), ("D", "450 000", "451 000")]
    parts = []
    for i, (letter, a, b) in enumerate(rows):
        y = 85 + i * 44.4
        pp, xs = numberline(139.5, 524.5, y, 20, 15, 7, {0, 20}, 1.6)
        parts += pp
        parts.append(f'<text class="let" x="92" y="{y - 1}" font-size="17" text-anchor="middle">{letter}</text>')
        parts.append(f'<text class="lb" x="{xs[0]:.1f}" y="{y + 15}" font-size="11.5" text-anchor="middle">{a.replace(" ", NB)}</text>')
        parts.append(f'<text class="lb" x="{xs[20]:.1f}" y="{y + 15}" font-size="11.5" text-anchor="middle">{b.replace(" ", NB)}</text>')
    return f'<svg class="pic" width="634" height="356" viewBox="0 0 634 356">{"".join(parts)}</svg>'


SHAPES = {
    "tri": '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 1.2 11 10.2H1Z"/></svg>',
    "dot": '<svg viewBox="0 0 12 12" width="12" height="12"><circle cx="6" cy="6" r="3"/></svg>',
    "sq": '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="2" y="2" width="8" height="8"/></svg>',
    "dia": '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 2 10 6 6 10 2 6Z"/></svg>',
}
COLOURS = ("red", "blue", "orange", "green")
SHAPE_KEYS = ("tri", "dot", "sq", "dia")


def answer_buttons(labels, lang):
    return '<div class="btns">' + "".join(
        f'<div class="btn {c}">{SHAPES[s]}<span>{fmt(l, lang)}</span></div>'
        for c, s, l in zip(COLOURS, SHAPE_KEYS, labels)) + "</div>"


def card(title, body, buttons="", cls=""):
    return f'<div class="card {cls}"><div class="q">{title}</div><div class="mid">{body}</div>{buttons}</div>'


# ------------------------------------------------------------------ the chat

ICONS = {
    "archive": '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4.5" width="16" height="4.5" rx="1"/><path d="M5.5 9v8.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M10 13h4"/></svg>',
    "copy": '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
    "speaker": '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12.5 19V5L7.5 9.5Z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"/></svg>',
    "up": '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v8H4.5v-8Z"/><path d="M7 11l3.5-6.5a1.8 1.8 0 0 1 3.3 1.3L13 9.5h5a2 2 0 0 1 2 2.3l-1 5.8a2 2 0 0 1-2 1.7H7"/></svg>',
    "down": '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleY(-1)"><path d="M7 11v8H4.5v-8Z"/><path d="M7 11l3.5-6.5a1.8 1.8 0 0 1 3.3 1.3L13 9.5h5a2 2 0 0 1 2 2.3l-1 5.8a2 2 0 0 1-2 1.7H7"/></svg>',
    "download": '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/></svg>',
    "retry": '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/></svg>',
}


CSS = """
:root { color-scheme: light;
  --bg:#ffffff; --ink:#1f1e1d; --ai:#16181b; --grey:#767570; --bub:#f3f4f3; --chip:#f8f8f8; --chipline:#ececea; --ico:#ececea;
  --code:#f0efed; --card:#ffffff; --cardline:#e0e0e0; --qink:#1c1b19; --nl:#26262a; --lb:#2a2a2d; --ar:#1c7c89; --let:#2a7f8c;
  --fail:#a3322f; --react:#5c5b57; --frame-in:#ffffff; }
:root[data-theme="dark"] { color-scheme: dark;
  --bg:#262624; --ink:#ece9df; --ai:#ece9df; --grey:#9c9a92; --bub:#1f1e1d; --chip:#2f2f2c; --chipline:#3d3c38; --ico:#3a3935;
  --code:#383733; --card:#1f1e1d; --cardline:#3d3c38; --qink:#f2f0e8; --nl:#d8d6cc; --lb:#c9c7bc; --ar:#4db3c4; --let:#58b8c6;
  --fail:#e5857d; --react:#a8a69d; --frame-in:#1f1e1d; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); }
body { width: 681px; padding: 14px 34px 20px 16px; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: var(--ink); -webkit-font-smoothing: antialiased; }
.photos { display: flex; justify-content: flex-end; gap: 7px; margin-right: 0; }
.photos img { width: 105px; height: 137px; object-fit: cover; border-radius: 12px; display: block; }
.user { display: flex; justify-content: flex-end; margin: 8px 0 0; }
.photos + .user { margin-top: 8px; }
.bub { background: var(--bub); border-radius: 14px; padding: 9px 14px; font-size: 13.8px; line-height: 19px; max-width: 540px; }
.qbox .bub { max-width: 524px; }
.qa + .qa { margin-top: 8px; }
.st { font-size: 13.2px; line-height: 18px; color: var(--grey); margin: 15px 0 0; }
.chev { display: inline-block; margin-left: 7px; border-left: 4px solid currentColor; border-top: 3px solid transparent; border-bottom: 3px solid transparent; vertical-align: 1px; opacity: .85; }
.fail { color: var(--fail); }
.user + .st, .qbox + .st { margin-top: 30px; }
.ai { font-family: Cambria, Georgia, serif; font-variant-numeric: lining-nums; font-size: 14.05px; line-height: 18.6px; color: var(--ai); margin-top: 15px; }
ul.ai { padding-left: 29px; margin-top: 9px; }
ul.ai li { margin-top: 3px; }
ul.ai li::marker { font-size: 12px; }
p.ai + p.ai { margin-top: 10px; }
ul.ai + p.ai { margin-top: 12px; }
p.ai + ul.ai { margin-top: 9px; }
code { font-family: Consolas, "Cascadia Mono", monospace; font-size: .86em; background: var(--code); padding: 1px 3px; border-radius: 4px; }
.chip { display: flex; align-items: center; gap: 12px; width: 448px; margin: 18px 0 0 -3px; padding: 10px 12px 10px 14px; border-radius: 12px; background: var(--chip); border: 1px solid var(--chipline); }
.chip .ico { width: 28px; height: 28px; border-radius: 6px; background: var(--ico); display: flex; align-items: center; justify-content: center; color: var(--grey); }
.ct { font-size: 14px; line-height: 17px; }
.cs { font-size: 11.5px; line-height: 14px; color: var(--grey); letter-spacing: .2px; }
.user.t2 { margin-top: 46px; }
.cap { font-size: 12px; line-height: 14px; color: var(--grey); margin: 24px 0 5px -3px; }
.card { margin: 0 0 0 -3px; width: 634px; height: 356px; border: 1px solid var(--cardline); background: var(--card); border-radius: 14px; display: flex; flex-direction: column; align-items: center; overflow: hidden; font-family: "Segoe UI", Arial, sans-serif; }
.q { margin-top: 24px; position: relative; font-size: 17.6px; line-height: 22px; font-weight: 500; text-align: center; color: var(--qink); padding: 0 20px; }
.card.big .q { font-size: 19px; line-height: 26px; font-weight: 500; margin-top: 56px; max-width: 560px; }
.mid { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
.card { position: relative; }
.pic { position: absolute; left: -1px; top: -1px; }
.pic .nl, svg .nl { stroke: var(--nl); fill: none; stroke-linecap: butt; }
svg .ar { stroke: var(--ar); }
svg .arf { fill: var(--ar); }
svg .lb { fill: var(--lb); font-family: "Segoe UI", Arial, sans-serif; }
svg .let { fill: var(--let); font-family: "Segoe UI", Arial, sans-serif; font-weight: 700; }
.btns { margin-top: auto; position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 7px 6px; width: 100%; padding: 0 25px 21px; }
.btn { height: 38px; border-radius: 9px; display: flex; align-items: center; gap: 10px; padding: 0 12px; font-size: 17px; font-weight: 500; color: #fff; }
.btn svg { fill: #fff; flex: none; }
.btn.red { background: #e14b4a; } .btn.blue { background: #368add; } .btn.orange { background: #ef9f26; color: #3a2b12; } .btn.green { background: #639921; }
.btn.orange svg { fill: #3a2b12; }
.frames { position: absolute; left: 0; top: 128px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 6px; width: 100%; padding: 0 25px; }
.frame { border: 5px solid; border-radius: 12px; background: var(--frame-in); height: 60px; padding: 0; overflow: hidden; display: flex; align-items: flex-end; justify-content: center; }
.frame svg { display: block; margin-bottom: 0; }
.frame.red { border-color: #e14b4a; } .frame.blue { border-color: #368add; } .frame.orange { border-color: #ef9f26; } .frame.green { border-color: #639921; }
.card.plain .mid { align-items: center; }
.react { display: flex; gap: 11px; margin: 16px 0 0 0; color: var(--react); }
.thumb { width: 86px; height: 130px; margin: 20px 0 0 -3px; border-radius: 10px; border: 1px solid var(--chipline); overflow: hidden; background: #fbf8f2; }
.thumb img { display: block; width: 100%; }
.thumb + .chip { margin-top: 10px; }
.all { display: inline-flex; align-items: center; gap: 7px; margin: 10px 0 0 -3px; padding: 6px 11px; border-radius: 9px; background: var(--chip); border: 1px solid var(--chipline); font-size: 13px; line-height: 17px; }
.react svg { display: block; }
.pdf { position: relative; width: 132px; height: 132px; margin-left: auto; border-radius: 12px; border: 1px solid var(--chipline); overflow: hidden; background: #fff; }
.pdf img { display: block; width: 100%; }
.pdf span { position: absolute; left: 9px; bottom: 9px; padding: 1px 6px; border-radius: 5px; background: rgba(60,60,58,.82); color: #f2f0e8; font-size: 11.5px; line-height: 16px; font-weight: 600; }
.pdf + .user { margin-top: 10px; }
"""


def page(lang, theme, convo="sheets"):
    blocks = chat(lang) if convo == "sheets" else chat_space(lang) if convo == "idea" else chat_notes(lang)
    return f'<!doctype html><html lang="{lang}" data-theme="{theme}"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(blocks)}</body></html>'


def chat(lang):
    out = []
    zip_title = html.escape(T.FILM[lang]["zipTitle"])

    def chip():
        return f'<div class="chip"><div class="ico">{ICONS["archive"]}</div><div><div class="ct">{zip_title}</div><div class="cs">{T.UI["zipSub"][lang]}</div></div></div>'

    out.append('<div class="photos"><img src="%s"><img src="%s"></div>' % (
        (EX / "sheet-photo-1.jpg").as_uri(), (EX / "sheet-photo-2.jpg").as_uri()))
    for ti, turn in enumerate((T.TURN1, T.TURN2, T.TURN3)):
        for kind, v in turn:
            if kind == "user":
                cls = "user t2" if (ti > 0 and out[-1].startswith("<div class=\"chip\"")) else "user"
                out.append(f'<div class="{cls}"><div class="bub">{fmt(pick(v, lang), lang)}</div></div>')
            elif kind == "status":
                out.append(f'<div class="st">{fmt(pick(v, lang), lang)}</div>')
            elif kind == "fold":
                out.append(f'<div class="st">{fmt(pick(v, lang), lang)}<i class="chev"></i></div>')
            elif kind == "toolfail":
                out.append(f'<div class="st">{fmt(T.UI["tool"][lang], lang)} <span class="fail">{fmt(T.UI["failed"][lang], lang)}</span><i class="chev"></i></div>')
            elif kind == "ai":
                out.append(f'<p class="ai">{fmt(pick(v, lang), lang)}</p>')
            elif kind == "qa":
                groups = "".join(f'<div class="qa"><div>{fmt(q[lang], lang)}</div><div>{fmt(a[lang], lang)}</div></div>' for q, a in v)
                out.append(f'<div class="user qbox" style="margin-top:34px"><div class="bub">{groups}</div></div>')
            elif kind == "bullets":
                out.append('<ul class="ai">' + "".join(f"<li>{fmt(b[lang], lang)}</li>" for b in v) + "</ul>")
            elif kind == "chip":
                out.append(chip())
            elif kind == "caption":
                out.append(f'<div class="cap">{fmt(v[lang], lang)}</div>')
            elif kind == "card_arrow":
                out.append(card(fmt(T.FILM[lang]["q1"], lang), svg_big_line("640" + NB + "000", "650" + NB + "000", "660" + NB + "000"),
                                answer_buttons(("646 000", "645 000", "644 000", "647 000"), lang)))
            elif kind == "card_match":
                fracs = (0.7, 0.6, 0.8, 0.3)
                frames = "".join(f'<div class="frame {c}">{svg_mini_line(f, "640" + NB + "000", "650" + NB + "000", "660" + NB + "000")}</div>'
                                 for c, f in zip(COLOURS, fracs))
                out.append(card(fmt(T.FILM[lang]["q4"], lang), f'<div class="frames">{frames}</div>', cls="plain"))
            elif kind == "card_count":
                out.append(card(fmt(v[lang], lang).replace("... ", "...<br>"), "", answer_buttons(("560 000", "550 000", "541 000", "640 000"), lang), cls="big"))
            elif kind == "card_section":
                out.append(card(fmt(v[lang], lang), svg_sections(), answer_buttons(("A", "B", "C", "D"), lang)))
            elif kind == "reactions":
                out.append('<div class="react">' + "".join(ICONS[k] for k in ("copy", "speaker", "up", "down", "retry")) + "</div>")
            else:
                raise SystemExit("unknown block " + kind)
    return out


def chat_space(lang):
    """The space run: one ask, nothing attached, and the AI's one answer with its overview and the .zip."""
    out = []
    for kind, v in S.TURN:
        if kind == "user":
            out.append(f'<div class="user"><div class="bub">{fmt(v[lang], lang)}</div></div>')
        elif kind == "ai":
            out.append(f'<p class="ai">{fmt(v[lang], lang)}</p>')
        elif kind == "fold":
            out.append(f'<div class="st">{fmt(S.UI[v][lang], lang)}<i class="chev"></i></div>')
        elif kind == "bullets":
            out.append('<ul class="ai">' + "".join(f"<li>{fmt(b[lang], lang)}</li>" for b in v) + "</ul>")
        elif kind == "review":
            out.append(f'<div class="thumb"><img src="{(EX / f"review-idea-{lang}.webp").as_uri()}"></div>')
        elif kind == "chip":
            out.append(f'<div class="chip"><div class="ico">{ICONS["archive"]}</div><div><div class="ct">{html.escape(S.ZIP_TITLE[lang])}</div><div class="cs">{S.UI["zipSub"][lang]}</div></div></div>')
        elif kind == "all":
            out.append(f'<div class="all">{ICONS["download"]}<span>{fmt(S.UI["all"][lang], lang)}</span></div>')
        elif kind == "reactions":
            out.append('<div class="react">' + "".join(ICONS[k] for k in ("copy", "speaker", "up", "down", "retry")) + "</div>")
        else:
            raise SystemExit("unknown block " + kind)
    return out


def chat_notes(lang):
    """The notes run: the notes attached, one ask, and the AI's one answer with the .zip."""
    from faces import EXAMPLES  # the files of the root page's examples
    out = []
    ask = ask_notes()
    zip_name = EXAMPLES["notes"][lang]
    for kind, v in N.TURN:
        if kind == "attachment":
            out.append(f'<div class="pdf"><img src="{(TMP / f"notes-{lang}-1.png").as_uri()}"><span>{N.UI["pdf"][lang]}</span></div>')
        elif kind == "user":
            out.append(f'<div class="user"><div class="bub">{fmt(ask[lang], lang)}</div></div>')
        elif kind == "ai":
            out.append(f'<p class="ai">{fmt(v[lang].replace("{zip}", zip_name), lang)}</p>')
        elif kind == "fold":
            out.append(f'<div class="st">{fmt(N.UI[v][lang], lang)}<i class="chev"></i></div>')
        elif kind == "bullets":
            out.append('<ul class="ai">' + "".join(f"<li>{fmt(b[lang], lang)}</li>" for b in v) + "</ul>")
        elif kind == "chip":
            title = zip_name[:-4].replace("-", " ").capitalize()  # the file's name, as the app titles its card
            out.append(f'<div class="chip"><div class="ico">{ICONS["archive"]}</div><div><div class="ct">{html.escape(title)}</div><div class="cs">{N.UI["zipSub"][lang]}</div></div></div>')
        elif kind == "reactions":
            out.append('<div class="react">' + "".join(ICONS[k] for k in ("copy", "speaker", "up", "down", "retry")) + "</div>")
        else:
            raise SystemExit("unknown block " + kind)
    return out


def notes_pages(langs):
    """The notes' pages as pictures: each page for /example (notes-<lang>-<page>.webp, 700 px wide), the first for the
    root page's attachment (landing/notes-<lang>.webp, 233 px wide), and the first at full size in .tmp/example/ for the
    conversation's thumbnail."""
    import pymupdf
    from PIL import Image
    TMP.mkdir(parents=True, exist_ok=True)
    for lang in langs:
        doc = pymupdf.open(EX / f"notes-{lang}.pdf")
        for i, pg in enumerate(doc, 1):
            png = TMP / f"notes-{lang}-{i}.png"
            pg.get_pixmap(dpi=150).save(str(png))
            im = Image.open(png).convert("RGB")
            if i > 1:
                png.unlink()  # only the first page is the conversation's thumbnail
            for w, out in ((700, EX / f"notes-{lang}-{i}.webp"), (233, ROOT / "src" / "public" / "landing" / f"notes-{lang}.webp")):
                if w == 233 and i > 1:
                    continue
                small = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
                small.save(out, "WEBP", quality=82, method=6)
                print(out.name, small.size, out.stat().st_size // 1024, "KB")


# ------------------------------------------------------------------ the space run's overview

REVIEW_W = 1500


def reviews(langs):
    """review-idea-<lang>.webp: German the AI's own, the others drawn from their .zip by the site's preview.py."""
    import subprocess
    from PIL import Image
    from faces import EXAMPLES  # the files of the root page's examples
    TMP.mkdir(parents=True, exist_ok=True)
    for lang in langs:
        out = EX / f"review-idea-{lang}.webp"
        if lang == "de":
            im = Image.open(HERE / "space-review-original.webp").convert("RGB")
        else:
            png = TMP / f"review-idea-{lang}.png"
            subprocess.run([sys.executable, "-I", str(ROOT / "src" / "public" / "preview.py"), str(EX / EXAMPLES["idea"][lang]), str(png)],
                           check=True, cwd=str(TMP), stdout=subprocess.DEVNULL)
            im = Image.open(png).convert("RGB")
            png.unlink()
        im = im.resize((REVIEW_W, round(im.height * REVIEW_W / im.width)), Image.LANCZOS)
        im.save(out, "WEBP", quality=80, method=6)
        print(out.name, im.size, out.stat().st_size // 1024, "KB")


# ------------------------------------------------------------------ shooting

def main():
    args = sys.argv[1:]

    def opt(name):
        if name in args:
            i = args.index(name)
            v = args[i + 1]
            del args[i:i + 2]
            return v
        return None

    convos = [opt("--convo")] if "--convo" in args else ("sheets", "idea", "notes")
    langs = [opt("--lang")] if "--lang" in args else T.LANGS
    themes = [opt("--theme")] if "--theme" in args else ("light", "dark")
    keep = "--keep" in args
    check_film()
    if "idea" in convos:
        reviews(langs)
    if "notes" in convos:
        notes_pages(langs)
    from playwright.sync_api import sync_playwright
    from PIL import Image
    TMP.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge")
        for convo, lang, theme in [(c, la, th) for c in convos for la in langs for th in themes]:
            if True:
                tag = f"{'' if convo == 'sheets' else convo + '-'}{lang}-{theme}"
                f = TMP / f"chat-{tag}.html"
                f.write_text(page(lang, theme, convo), encoding="utf-8")
                ctx = b.new_context(viewport={"width": WIDTH, "height": 900}, device_scale_factor=SCALE,
                                    color_scheme="dark" if theme == "dark" else "light")
                pg = ctx.new_page()
                pg.goto(f.as_uri())
                pg.evaluate("document.fonts.ready")
                png = TMP / f"chat-{tag}.png"
                pg.screenshot(path=str(png), full_page=True)
                ctx.close()
                im = Image.open(png).convert("RGB")
                h = round(im.height * WIDTH / im.width)
                im = im.resize((WIDTH, h), Image.LANCZOS)
                out = EX / f"conversation-{tag}.webp"
                im.save(out, "WEBP", quality=88, method=6)
                print(out.name, im.size, out.stat().st_size // 1024, "KB")
                if not keep:
                    png.unlink()
                    f.unlink()
        b.close()
    if not keep:
        for png in TMP.glob("notes-*-1.png"):
            png.unlink()


if __name__ == "__main__":
    main()
