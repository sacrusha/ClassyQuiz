import re, sys, zipfile

errors = []


def err(msg):
    errors.append(msg)


z = zipfile.ZipFile(sys.argv[1])
names = z.namelist()
if "quiz.txt" not in names:
    sys.exit("no quiz.txt at the top level of the zip")
if len(names) > 121:
    err("more than 120 auxiliary files")

try:
    text = z.read("quiz.txt").decode("utf-8")
except UnicodeDecodeError:
    sys.exit("quiz.txt is not UTF-8")

key = lambda n: n.replace("\\", "/").split("/")[-1].lower()
have = {key(n) for n in names if n != "quiz.txt"}
used = []

blocks = re.split(r"\n\s*\n", text.strip().replace("\r\n", "\n"))
title = blocks.pop(0).split("\n")
if not re.match(r"Title:\s*\S", title[0]) or len(title) > 1:
    err("first block must be the single line 'Title: ...'")
if not blocks:
    err("no questions")

for i, block in enumerate(blocks, 1):
    lines = block.split("\n")
    q = f"question {i}"
    if not re.match(rf"{i}\.(\s|$)", lines[0]):
        err(f"{q}: must start with '{i}.'")
    right = wrong = 0
    for line in lines[1:]:
        m = re.match(r"([+-]) (.+)", line)
        if m:
            right += m[1] == "+"
            wrong += m[1] == "-"
            line = m[2]
            if not line.startswith("Image:"):
                continue
        m = re.match(r"(Image|Background): *(\S.*)", line)
        if m:
            used.append((q, m[2].strip()))
        elif line.strip() != "Order: fixed":
            err(f"{q}: unrecognised line '{line}'")
    if not 2 <= right + wrong <= 4:
        err(f"{q}: needs 2 to 4 choices, has {right + wrong}")
    if not right:
        err(f"{q}: no correct '+ ' choice")

for q, name in used:
    if key(name) not in have:
        err(f"{q}: '{name}' is not in the zip")

print("\n".join(errors) if errors else "ok")
sys.exit(1 if errors else 0)
