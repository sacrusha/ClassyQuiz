"""python preview.py quiz.zip [review.png]: the whole quiz as one picture for the teacher to review.
Needs Pillow; SVG pictures also need cairosvg or rsvg-convert. The layout is the guidance page's
(classyquiz.pages.dev, "Build with the teacher")."""
import io, re, shutil, subprocess, sys, zipfile
from PIL import Image, ImageDraw, ImageFont

W, COLS, GAP, PAD = 3000, 3, 40, 28
CARD = (W - GAP * (COLS + 1)) // COLS
PAGE, INK, MUTED, RULE, BAD = "#fbf8f2", "#1d1d1b", "#5d5c57", "#d8d2c4", "#c62828"
NUM, RIGHT = "#a8471a", "#1f8a4c"

z = zipfile.ZipFile(sys.argv[1])
out = sys.argv[2] if len(sys.argv) > 2 else "review.png"
key = lambda n: n.replace("\\", "/").split("/")[-1].lower()
files = {key(n): n for n in z.namelist()}
text = z.read("quiz.txt").decode("utf-8").replace("\r\n", "\n").strip()
blocks = re.split(r"\n\s*\n", text)
head = blocks.pop(0).split("\n")
title = head[0].split(":", 1)[-1].strip()
allfixed = any(l.strip() == "Order: fixed" for l in head[1:])
allbg = next((m[1].strip() for l in head[1:] if (m := re.match(r"Background: *(\S.*)", l))), None)

questions = []
for b in blocks:
    lines = b.split("\n")
    q = {"text": re.sub(r"^\d+\.\s*", "", lines[0]), "image": None, "background": None, "fixed": allfixed, "choices": []}
    for line in lines[1:]:
        m = re.match(r"([+-]) (.+)", line)
        if m:
            pic = re.match(r"Image: *(\S.*)", m[2])
            q["choices"].append((m[1] == "+", m[2], pic[1].strip() if pic else None))
        elif m := re.match(r"(Image|Background): *(\S.*)", line):
            q[m[1].lower()] = m[2].strip()
        elif line.strip() == "Order: fixed":
            q["fixed"] = True
    questions.append(q)


def font(size, bold=False):
    names = ["DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf", "arialbd.ttf" if bold else "arial.ttf"]
    dirs = ["", "/usr/share/fonts/truetype/dejavu/", "/usr/share/fonts/dejavu/", "/usr/share/fonts/TTF/", "C:/Windows/Fonts/", "/Library/Fonts/"]
    for n in names:
        for d in dirs:
            try:
                return ImageFont.truetype(d + n, size)
            except OSError:
                pass
    return ImageFont.load_default(size)


F, FB, FS, FT = font(34), font(34, True), font(26), font(48, True)
LH = 46


def wrap(s, f, width):
    out, line = [], ""
    for word in s.split(" "):
        t = (line + " " + word).strip()
        if f.getlength(t) <= width or not line:
            line = t
        else:
            out.append(line)
            line = word
    return out + [line] if line else out or [""]


def svg(data):
    try:
        import cairosvg
        return cairosvg.svg2png(bytestring=data, output_width=1200)
    except Exception:
        pass
    if shutil.which("rsvg-convert"):
        return subprocess.run(["rsvg-convert", "-w", "1200"], input=data, capture_output=True).stdout or None


def picture(name):
    """The picture, or why there is none: missing from the zip is the quiz's problem, not drawable is this machine's."""
    n = files.get(key(name))
    if not n:
        return None, "not in the zip: " + name
    data = z.read(n)
    if n.lower().endswith(".svg"):
        data = svg(data)
        if not data:
            return None, "SVG, not drawn here: " + name
    try:
        return Image.open(io.BytesIO(data)).convert("RGBA"), None
    except Exception:
        return None, "can't be read: " + name


def fit(target, d, name, box, wash=False):
    x, y, w, h = box
    img, why = picture(name)
    if img is None:
        d.rectangle((x, y, x + w, y + h), outline=RULE, width=2)
        d.multiline_text((x + 12, y + 12), "\n".join(wrap(why, FS, w - 24)), font=FS, fill=BAD if why.startswith("not in") else MUTED)
        return
    r = min(w / img.width, h / img.height)
    im = img.resize((max(1, round(img.width * r)), max(1, round(img.height * r))))
    if wash:
        im = Image.alpha_composite(im, Image.new("RGBA", im.size, (251, 248, 242, 140)))
    target.paste(im, (x + (w - im.width) // 2, y + (h - im.height) // 2), im)


def tick(d, x, y):
    d.line([(x, y + 14), (x + 10, y + 26), (x + 30, y)], fill=RIGHT, width=6, joint="curve")


def card(i, q):
    im = Image.new("RGBA", (CARD, 4000), "white")
    d = ImageDraw.Draw(im)
    inner = CARD - 2 * PAD
    nw = max(52, FB.getlength(str(i)) + 24)
    d.rounded_rectangle((PAD, PAD, PAD + nw, PAD + 52), 26, fill=NUM)
    d.text((PAD + nw / 2, PAD + 26), str(i), font=FB, fill="white", anchor="mm")
    y = PAD + 4
    for line in wrap(q["text"], F, inner - nw - 18):
        d.text((PAD + nw + 18, y), line, font=F, fill=INK)
        y += LH
    y = max(y, PAD + 52) + 20
    pics = [(q["image"], False), (q["background"] if q["background"] != allbg else None, True)]
    pics = [p for p in pics if p[0]]
    if pics:
        w = (inner - 20 * (len(pics) - 1)) // len(pics)
        for k, (name, bg) in enumerate(pics):
            fit(im, d, name, (PAD + k * (w + 20), y, w, 300), bg)
            if bg:
                d.text((PAD + k * (w + 20) + 8, y + 304), "background", font=FS, fill=MUTED)
        y += 300 + (40 if any(bg for _, bg in pics) else 0) + 16
    chs = q["choices"]
    cols = 4 if any(c[2] for c in chs) else 2
    cw = (inner - 16 * (cols - 1)) // cols
    for r in range(0, len(chs), cols):
        row = chs[r:r + cols]
        rh = max(220 if c[2] else LH * len(wrap(c[1], F, cw - 70)) + 28 for c in row)
        for k, (right, label, pic) in enumerate(row):
            x = PAD + k * (cw + 16)
            d.rounded_rectangle((x, y, x + cw, y + rh), 12, outline=RIGHT if right else RULE, width=6 if right else 2)
            if right:
                tick(d, x + 16, y + 14)
            if pic:
                fit(im, d, pic, (x + 56, y + 10, cw - 66, rh - 20))
            else:
                for n, line in enumerate(wrap(label, F, cw - 70)):
                    d.text((x + 56, y + 14 + n * LH), line, font=F, fill=INK)
        y += rh + 16
    if q["fixed"] and not allfixed:
        d.text((PAD, y), "order fixed", font=FS, fill=MUTED)
        y += 36
    return im.crop((0, 0, CARD, y + PAD - 16))


tags = ["order fixed"] * allfixed + [f"behind every question: {allbg}"] * bool(allbg)
headline = wrap("  ·  ".join([title, f"{len(questions)} questions"] + tags), FT, W - 2 * GAP)
top = 40 + 64 * len(headline) + 20
cards = [card(i, q) for i, q in enumerate(questions, 1)]
rows = [cards[r:r + COLS] for r in range(0, len(cards), COLS)]
H = top + sum(max(c.height for c in row) + GAP for row in rows)
sheet = Image.new("RGB", (W, H), PAGE)
d = ImageDraw.Draw(sheet)
for n, line in enumerate(headline):
    d.text((GAP, 40 + 64 * n), line, font=FT, fill=INK)
y = top
for row in rows:
    for k, c in enumerate(row):
        mask = Image.new("L", c.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, c.width - 1, c.height - 1), 16, fill=255)
        sheet.paste(c, (GAP + k * (CARD + GAP), y), mask)
    y += max(c.height for c in row) + GAP
sheet.save(out)


def glyph(ch):
    g = Image.new("L", (80, 80))
    ImageDraw.Draw(g).text((10, 10), ch, font=F, fill=255)
    return g.tobytes()


# Characters the font draws as an empty box: the AI says so beside the picture.
blank = glyph("\ue000")
missing = sorted({ch for ch in text if not ch.isspace() and glyph(ch) == blank})
print(out, f"{W}x{H}")
if missing:
    print("the font can't draw:", " ".join(f"U+{ord(ch):04X}" for ch in missing))
