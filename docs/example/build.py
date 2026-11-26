"""Draws the examples' conversations as the AI app's own chat, in four languages and
two colour schemes: the sheets run's, src/public/examples/conversation-<lang>-<light|dark>.webp,
with its overview of its questions, review-<lang>.webp, which its chat shows; the space run's (the root page's "Idea"
tab), conversation-idea-<lang>-<light|dark>.webp, with its overview, review-idea-<lang>.webp; and the notes run's
(the "Notes" tab) and the test run's (the "Test" tab), conversation-<notes|test>-<lang>-<light|dark>.webp, each with
the pictures of its attached PDF's pages (src/public/examples/<notes|test>-<lang>-<page>.webp for /example,
src/public/landing/<notes|test>-<lang>.webp for the root page).

Run (from anywhere): py -I docs/example/build.py [--convo idea] [--lang de] [--theme dark] [--keep]
  --convo           only that conversation, sheets, idea, notes or test (default: all four)
  --lang / --theme  only that language / scheme (default: all 8 pictures of each)
  --keep            also leave the pages and the full-size PNGs in .tmp/example/ (git-ignored)

The words are text.py's, space_text.py's, notes_text.py's and test_text.py's; the page is HTML drawn here and shot in the
installed Edge (playwright, as docs/film/build/shoot.py does). Needs Pillow and playwright, and PyMuPDF for the PDFs' pages.
The overviews are drawn from their .zip by the site's own src/public/preview.py, the script the guidance offers the
AI for it; the space run's German is the AI's own (space-review-original.webp here, 1500 px wide).
"""
import html, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
EX = ROOT / "src" / "public" / "examples"
TMP = ROOT / ".tmp" / "example"
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
import text as T  # noqa: E402
import space_text as S  # noqa: E402
import notes_text as N  # noqa: E402
import test_text as X  # noqa: E402

# The runs that attached a PDF. For each: the module with its words, and the key of its ask in src/client/landing-text.ts.
PDF_RUNS = {"notes": (N, "askNotes"), "test": (X, "askTest")}

WIDTH = 681          # the pictures' width, as /example's HTML has it
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


def landing_block(lang):
    src = (ROOT / "src" / "client" / "landing-text.ts").read_text(encoding="utf-8")
    return src[src.index(f"\nconst {lang}: Text = {{"):]


def landing_ask(key, lang):
    """An ask of src/client/landing-text.ts in a language: the root page's ask is the run's."""
    m = re.search(r'\n  %s: "((?:[^"\\]|\\.)*)",' % key, landing_block(lang))
    return m.group(1).replace('\\"', '"')


def ask_sheets(lang):
    """`ask` of src/client/landing-text.ts, its parts joined: the root page's sheets ask is the sheets run's first."""
    block = landing_block(lang)
    parts = block[block.index("\n  ask: ["):block.index("\n  ],", block.index("\n  ask: ["))]
    return "".join(s.replace('\\"', '"') for s in re.findall(r'\{ s: "((?:[^"\\]|\\.)*)"', parts))


def pick(v, lang):
    """A piece's text in a language: a dict of languages, or the name of a film/UI entry."""
    if isinstance(v, str):
        v = T.UI[v] if v in T.UI else {l: T.FILM[l][v] for l in T.LANGS}
    return v[lang]


def fmt(s, lang):
    """Plain text with **bold** and `code` into HTML; no-break spaces where the language wants them."""
    s = s.replace("{zip1}", T.ZIPS[lang][0]).replace("{zip2}", T.ZIPS[lang][1])
    s = re.sub(r"(\d) (\d{3})(?!\d)", lambda m: m.group(1) + NB + m.group(2), s)
    if lang == "fr":
        s = re.sub(r" ([:;?!»])", NB + r"\1", s)
        s = s.replace("« ", "«" + NB)
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


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
  --code:#f0efed; --react:#5c5b57; }
:root[data-theme="dark"] { color-scheme: dark;
  --bg:#262624; --ink:#ece9df; --ai:#ece9df; --grey:#9c9a92; --bub:#1f1e1d; --chip:#2f2f2c; --chipline:#3d3c38; --ico:#3a3935;
  --code:#383733; --react:#a8a69d; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); }
body { width: 681px; padding: 14px 34px 20px 16px; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: var(--ink); -webkit-font-smoothing: antialiased; }
.photos { display: flex; justify-content: flex-end; gap: 7px; margin-right: 0; }
.photos img { width: 105px; height: 137px; object-fit: cover; border-radius: 12px; display: block; }
.user { display: flex; justify-content: flex-end; margin: 8px 0 0; }
.photos + .user { margin-top: 8px; }
.bub { background: var(--bub); border-radius: 14px; padding: 9px 14px; font-size: 13.8px; line-height: 19px; max-width: 540px; }
.st { font-size: 13.2px; line-height: 18px; color: var(--grey); margin: 15px 0 0; }
.st.files { display: flex; align-items: center; justify-content: space-between; }
.st .thumbs { display: flex; gap: 5px; }
.st .thumbs img { height: 19px; border-radius: 3px; border: 1px solid var(--chipline); object-fit: cover; background: #fff; display: block; }
.chev { display: inline-block; margin-left: 7px; border-left: 4px solid currentColor; border-top: 3px solid transparent; border-bottom: 3px solid transparent; vertical-align: 1px; opacity: .85; }
.user + .st { margin-top: 30px; }
.ai { font-family: Cambria, Georgia, serif; font-variant-numeric: lining-nums; font-size: 14.05px; line-height: 18.6px; color: var(--ai); margin-top: 15px; }
ul.ai { padding-left: 29px; margin-top: 9px; }
ul.ai li { margin-top: 3px; }
ul.ai li::marker { font-size: 12px; }
ul.ai ul { list-style: circle; padding-left: 26px; margin-top: 3px; }
p.ai + p.ai { margin-top: 10px; }
ul.ai + p.ai { margin-top: 12px; }
p.ai + ul.ai { margin-top: 9px; }
code { font-family: Consolas, "Cascadia Mono", monospace; font-size: .86em; background: var(--code); padding: 1px 3px; border-radius: 4px; }
.chip { display: flex; align-items: center; gap: 12px; width: 448px; margin: 18px 0 0 -3px; padding: 10px 12px 10px 14px; border-radius: 12px; background: var(--chip); border: 1px solid var(--chipline); }
.chip .ico { width: 28px; height: 28px; border-radius: 6px; background: var(--ico); display: flex; align-items: center; justify-content: center; color: var(--grey); }
.ct { font-size: 14px; line-height: 17px; }
.cs { font-size: 11.5px; line-height: 14px; color: var(--grey); letter-spacing: .2px; }
.user.t2 { margin-top: 46px; }
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
    blocks = chat(lang) if convo == "sheets" else chat_space(lang) if convo == "idea" else chat_pdf(convo, lang)
    return f'<!doctype html><html lang="{lang}" data-theme="{theme}"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(blocks)}</body></html>'


# The files a "Shared 2 files, created a file, and n more steps" fold shows beside it, as the app does: the overview, then
# two of the quiz's pictures (the run's own are not kept; these stand in at 19 px high).
FOLD_FILES = {"made1": ("review", "q01.png", "q03b.png"), "made2": ("review", "q02a.png", "q03a.png")}


def zip_picture(lang, name, zip_name=None):
    """A picture from a .zip, the language's of the sheets run unless named, as a data: URI."""
    import base64
    import zipfile
    with zipfile.ZipFile(EX / (zip_name or T.ZIPS[lang][1])) as z:
        return "data:image/png;base64," + base64.b64encode(z.read(name)).decode()


def chat(lang):
    """The sheets run: the two photos and two asks, each answered with an overview and a .zip."""
    out = []
    review = (EX / f"review-{lang}.webp").as_uri()

    def li(b):
        if isinstance(b, tuple):  # (text, its sub-bullets)
            return f"<li>{fmt(b[0][lang], lang)}<ul>{''.join(li(c) for c in b[1])}</ul></li>"
        return f"<li>{fmt(b[lang], lang)}</li>"

    def bullets(items):
        return f'<ul class="ai">{"".join(li(b) for b in items)}</ul>'

    for kind, v in T.TURN1 + T.TURN2:
        if kind == "photos":
            out.append('<div class="photos"><img src="%s"><img src="%s"></div>' % (
                (EX / "sheet-photo-2.jpg").as_uri(), (EX / "sheet-photo-1.jpg").as_uri()))
        elif kind == "ask":
            out.append(f'<div class="user"><div class="bub">{fmt(ask_sheets(lang), lang)}</div></div>')
        elif kind == "user":
            out.append(f'<div class="user t2"><div class="bub">{fmt(pick(v, lang), lang)}</div></div>')
        elif kind == "fold" and v in FOLD_FILES:
            pics = "".join(f'<img src="{review if f == "review" else zip_picture(lang, f)}" style="width:{21 if f == "review" else 36}px">'
                           for f in FOLD_FILES[v])
            out.append(f'<div class="st files"><span>{fmt(pick(v, lang), lang)}<i class="chev"></i></span><span class="thumbs">{pics}</span></div>')
        elif kind == "fold":
            out.append(f'<div class="st">{fmt(pick(v, lang), lang)}<i class="chev"></i></div>')
        elif kind == "ai":
            out.append(f'<p class="ai">{fmt(pick(v, lang), lang)}</p>')
        elif kind == "bullets":
            out.append(bullets(v))
        elif kind == "review":
            out.append(f'<div class="thumb"><img src="{review}"></div>')
        elif kind == "chip":
            title = html.escape(T.card_title(T.ZIPS[lang][v]))
            out.append(f'<div class="chip"><div class="ico">{ICONS["archive"]}</div><div><div class="ct">{title}</div><div class="cs">{T.UI["zipSub"][lang]}</div></div></div>')
        elif kind == "all":
            out.append(f'<div class="all">{ICONS["download"]}<span>{fmt(T.UI["all"][lang], lang)}</span></div>')
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


def chat_pdf(convo, lang):
    """A run that attached a PDF (the notes', the test's): the PDF, one ask, and the AI's answer with the .zip."""
    from faces import EXAMPLES  # the files of the root page's examples
    N, ask_key = PDF_RUNS[convo]
    out = []
    zip_name = EXAMPLES[convo][lang]
    for kind, v in N.TURN:
        if kind == "attachment":
            out.append(f'<div class="pdf"><img src="{(TMP / f"{convo}-{lang}-1.png").as_uri()}"><span>{N.UI["pdf"][lang]}</span></div>')
        elif kind == "user":
            out.append(f'<div class="user"><div class="bub">{fmt(landing_ask(ask_key, lang), lang)}</div></div>')
        elif kind == "ai":
            out.append(f'<p class="ai">{fmt(v[lang].replace("{zip}", zip_name), lang)}</p>')
        elif kind == "fold":
            out.append(f'<div class="st">{fmt(N.UI[v][lang], lang)}<i class="chev"></i></div>')
        elif kind == "foldpics":  # the folded line of steps, with small copies of the quiz's pictures at its right, as in the app
            pics = "".join(f'<img src="{zip_picture(lang, f, zip_name)}" style="width:29px">' for f in N.FOLD_PICS)
            out.append(f'<div class="st files"><span>{fmt(N.UI[v][lang], lang)}<i class="chev"></i></span><span class="thumbs">{pics}</span></div>')
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


def pdf_pages(convo, langs):
    """An attached PDF's pages as pictures: each page for /example (<convo>-<lang>-<page>.webp, 700 px wide), the first
    for the root page's attachment (landing/<convo>-<lang>.webp, 233 px wide), and the first at full size in
    .tmp/example/ for the conversation's thumbnail."""
    import pymupdf
    from PIL import Image
    TMP.mkdir(parents=True, exist_ok=True)
    for lang in langs:
        doc = pymupdf.open(EX / f"{convo}-{lang}.pdf")
        for i, pg in enumerate(doc, 1):
            png = TMP / f"{convo}-{lang}-{i}.png"
            pg.get_pixmap(dpi=150).save(str(png))
            im = Image.open(png).convert("RGB")
            if i > 1:
                png.unlink()  # only the first page is the conversation's thumbnail
            for w, out in ((700, EX / f"{convo}-{lang}-{i}.webp"), (233, ROOT / "src" / "public" / "landing" / f"{convo}-{lang}.webp")):
                if w == 233 and i > 1:
                    continue
                small = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
                small.save(out, "WEBP", quality=82, method=6)
                print(out.name, small.size, out.stat().st_size // 1024, "KB")


# ------------------------------------------------------------------ the overviews

REVIEW_W = 1500
# Per run: the German overview where it is the AI's own (None: drawn like the others), and the name its pictures
# take (review-<tag><lang>.webp).
REVIEW = {"sheets": (None, ""), "idea": ("space-review-original.webp", "idea-")}


def reviews(convo, langs):
    """review-<tag><lang>.webp: drawn from their .zip by the site's preview.py, German the AI's own where REVIEW has it."""
    import subprocess
    from PIL import Image
    from faces import EXAMPLES  # the files of the root page's examples
    original, tag = REVIEW[convo]
    TMP.mkdir(parents=True, exist_ok=True)
    for lang in langs:
        out = EX / f"review-{tag}{lang}.webp"
        if lang == "de" and original:
            im = Image.open(HERE / original).convert("RGB")
        else:
            png = TMP / f"review-{tag}{lang}.png"
            subprocess.run([sys.executable, "-I", str(ROOT / "src" / "public" / "preview.py"), str(EX / EXAMPLES[convo][lang]), str(png)],
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

    convos = [opt("--convo")] if "--convo" in args else ("sheets", "idea", "notes", "test")
    langs = [opt("--lang")] if "--lang" in args else T.LANGS
    themes = [opt("--theme")] if "--theme" in args else ("light", "dark")
    keep = "--keep" in args
    check_film()
    for convo in convos:
        if convo in REVIEW:
            reviews(convo, langs)
    for convo in convos:
        if convo in PDF_RUNS:
            pdf_pages(convo, langs)
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
                ctx = b.new_context(viewport={"width": WIDTH, "height": 100}, device_scale_factor=SCALE,  # a low viewport, so the picture of a short chat has no empty space below it
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
        for convo in PDF_RUNS:
            for png in TMP.glob(f"{convo}-*-1.png"):
                png.unlink()


if __name__ == "__main__":
    main()
