"""The example quiz in German, French and Italian: big-numbers-quiz.zip with its
quiz.txt translated, the pictures unchanged (they carry only numbers and the
letters A-D). Title and questions 1 and 4 are the film's (CONTENT in
docs/film/build/film.js); all of it is a draft for the owner's review
(docs/translation-review.md).

    py docs/example/quiz_zips.py      (from the repo root)
"""
import zipfile
from pathlib import Path

EX = Path(__file__).resolve().parents[2] / "src" / "public" / "examples"
SOURCE = EX / "big-numbers-quiz.zip"

# Each language: (zip name, title, the 13 questions in order). Answers stay as in English.
LANGS = {
    "de": ("grosse-zahlen-quiz.zip", "Grosse Zahlen am Zahlenstrahl", [
        "Welche Zahl zeigt der Pfeil?",
        "Welche Zahl zeigt der Pfeil?",
        "Welche Zahl zeigt der Pfeil?",
        "Welcher Zahlenstrahl hat einen Pfeil bei 654 000?",
        "Welcher Zahlenstrahl hat einen Pfeil bei 81 750?",
        "Welcher Zahlenstrahl hat einen Pfeil bei 308 080?",
        "Zähle in 20 000er-Schritten: 500 000, 520 000, 540 000, ... Welche Zahl kommt als Nächstes?",
        "Zähle in 500er-Schritten: 78 000, 78 500, 79 000, ... Welche Zahl kommt als Nächstes?",
        "Zähle in 50er-Schritten: 249 800, 249 850, 249 900, ... Welche Zahl kommt als Nächstes?",
        "Welche Zahl liegt genau in der Mitte zwischen 250 000 und 260 000?",
        "Welche Zahl liegt genau in der Mitte zwischen 440 000 und 480 000?",
        "Auf welchem Abschnitt liegt 45 200?",
        "Welche Zahl liegt auf Abschnitt C?",
    ]),
    "fr": ("quiz-grands-nombres.zip", "Les grands nombres sur la droite graduée", [
        "Quel nombre la flèche montre-t-elle ?",
        "Quel nombre la flèche montre-t-elle ?",
        "Quel nombre la flèche montre-t-elle ?",
        "Quelle droite graduée a une flèche à 654 000 ?",
        "Quelle droite graduée a une flèche à 81 750 ?",
        "Quelle droite graduée a une flèche à 308 080 ?",
        "Compte de 20 000 en 20 000 : 500 000, 520 000, 540 000, ... Quel nombre vient ensuite ?",
        "Compte de 500 en 500 : 78 000, 78 500, 79 000, ... Quel nombre vient ensuite ?",
        "Compte de 50 en 50 : 249 800, 249 850, 249 900, ... Quel nombre vient ensuite ?",
        "Quel nombre se trouve exactement au milieu entre 250 000 et 260 000 ?",
        "Quel nombre se trouve exactement au milieu entre 440 000 et 480 000 ?",
        "Sur quel segment se trouve 45 200 ?",
        "Quel nombre se trouve sur le segment C ?",
    ]),
    "it": ("quiz-grandi-numeri.zip", "I grandi numeri sulla retta numerica", [
        "Quale numero indica la freccia?",
        "Quale numero indica la freccia?",
        "Quale numero indica la freccia?",
        "Quale retta numerica ha una freccia a 654 000?",
        "Quale retta numerica ha una freccia a 81 750?",
        "Quale retta numerica ha una freccia a 308 080?",
        "Conta di 20 000 in 20 000: 500 000, 520 000, 540 000, ... Quale numero viene dopo?",
        "Conta di 500 in 500: 78 000, 78 500, 79 000, ... Quale numero viene dopo?",
        "Conta di 50 in 50: 249 800, 249 850, 249 900, ... Quale numero viene dopo?",
        "Quale numero si trova esattamente a metà tra 250 000 e 260 000?",
        "Quale numero si trova esattamente a metà tra 440 000 e 480 000?",
        "Su quale segmento si trova 45 200?",
        "Quale numero si trova sul segmento C?",
    ]),
}


def translate(text: str, title: str, questions: list[str]) -> str:
    out, n = [], 0
    for line in text.split("\n"):
        if line.startswith("Title: "):
            line = f"Title: {title}"
        elif line[:1].isdigit() and ". " in line and line.split(". ", 1)[0].isdigit():
            num = line.split(". ", 1)[0]
            n += 1
            assert int(num) == n, line
            line = f"{num}. {questions[n - 1]}"
        out.append(line)
    assert n == len(questions), f"{n} questions in the source"
    return "\n".join(out)


with zipfile.ZipFile(SOURCE) as src:
    entries = [(i, src.read(i.filename)) for i in src.infolist()]
for name, title, questions in LANGS.values():
    with zipfile.ZipFile(EX / name, "w", zipfile.ZIP_DEFLATED) as z:
        for info, data in entries:
            if info.filename == "quiz.txt":
                data = translate(data.decode("utf-8"), title, questions).encode("utf-8")
            z.writestr(info, data)
    print(name)
