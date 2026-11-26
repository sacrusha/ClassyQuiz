"""The sheets run's quiz in English, French and Italian: the run's grosse-zahlen-quiz-v2.zip (src/public/examples/, as it
came) with its quiz.txt translated, the pictures unchanged (they carry only numbers). Title and question 1 are the film's
(CONTENT in docs/film/build/film.js).

    py -I docs/example/quiz_zips.py      (from anywhere)

A space between digit groups becomes a no-break space, as the run's German has it; in French, so does a space before
? ! : ;.
"""
import re
import zipfile
from pathlib import Path

EX = Path(__file__).resolve().parents[2] / "src" / "public" / "examples"
SOURCE = EX / "grosse-zahlen-quiz-v2.zip"
NB = " "

ARROW = dict(en="Which number does the arrow show?", fr="Quel nombre la flèche indique-t-elle ?", it="Quale numero indica la freccia?")
WHICH = dict(en="Which arrow shows {}?", fr="Quelle flèche indique {} ?", it="Quale freccia indica {}?")
SECTION = dict(en="Which section is the number {} on?", fr="Sur quel segment se trouve le nombre {} ?", it="Su quale segmento si trova il numero {}?")
MIDDLE = dict(en="Which number is exactly halfway between {} and {}?", fr="Quel nombre se trouve exactement au milieu de {} et {} ?",
              it="Quale numero si trova esattamente a metà tra {} e {}?")

# Each language: (zip name, title, the 12 questions in order, the text answers that aren't numbers).
LANGS = {
    lang: (name, title, [
        ARROW[lang],
        WHICH[lang].format("735 000"),
        SECTION[lang].format("60 400"),
        ARROW[lang],
        MIDDLE[lang].format("250 000", "270 000"),
        ARROW[lang],
        SECTION[lang].format("520 400"),
        MIDDLE[lang].format("35 000", "36 000"),
        ARROW[lang],
        SECTION[lang].format("99 000"),
        WHICH[lang].format("37 200"),
        ARROW[lang],
    ], {"Auf keinem davon": none})
    for lang, name, title, none in (
        ("en", "big-numbers-quiz-v2.zip", "Big numbers on the number line", "On none of them"),
        ("fr", "quiz-grands-nombres-v2.zip", "Les grands nombres sur la droite graduée", "Sur aucun d’eux"),
        ("it", "quiz-grandi-numeri-v2.zip", "I grandi numeri sulla retta numerica", "Su nessuno"),
    )
}


def spaces(s: str, lang: str) -> str:
    s = re.sub(r"(\d) (\d{3})(?!\d)", r"\1" + NB + r"\2", s)
    return re.sub(r" ([?!:;])", NB + r"\1", s) if lang == "fr" else s


def translate(text: str, lang: str, title: str, questions: list[str], answers: dict[str, str]) -> str:
    out, n, done = [], 0, set()
    for line in text.split("\n"):
        head = line.split(". ", 1)[0]
        if line.startswith("Title: "):
            line = f"Title: {title}"
        elif head.isdigit() and ". " in line:
            n += 1
            assert int(head) == n, line
            line = f"{head}. {spaces(questions[n - 1], lang)}"
        elif line[:2] in ("+ ", "- ") and line[2:] in answers:
            done.add(line[2:])
            line = line[:2] + spaces(answers[line[2:]], lang)
        out.append(line)
    assert n == len(questions), f"{n} questions in the source"
    assert done == set(answers), f"answers not found: {set(answers) - done}"
    return "\n".join(out)


with zipfile.ZipFile(SOURCE) as src:
    entries = [(i, src.read(i.filename)) for i in src.infolist()]
for lang, (name, title, questions, answers) in LANGS.items():
    with zipfile.ZipFile(EX / name, "w", zipfile.ZIP_DEFLATED) as z:
        for info, data in entries:
            if info.filename == "quiz.txt":
                data = translate(data.decode("utf-8"), lang, title, questions, answers).encode("utf-8")
            z.writestr(info, data)
    print(name)
