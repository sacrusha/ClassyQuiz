"""The space quiz in English, French and Italian: the owner's run, weltall-quiz.zip (German, 11 Nov 2026), with its
quiz.txt translated, title, questions and choices, and the three pictures the AI drew with German words on them
(sonne-erde.png, tag-nacht.png, umlauf.png) labelled in the language; the photographs and the other drawing are unchanged.
The root page's "Idea" tab shows this run (docs/design/root-page.md, "Getting a quiz"); its translations are drafts for
the owner's review (docs/translation-review.md), as the sheets example's are (quiz_zips.py).

A label is replaced where it stands: its letters found by their colour, the patch under them painted over from the rows
above and below it, the new word written in the drawing's own face (DejaVu Sans Bold) at the size that matches the old
word, centred where the old one was, on its baseline.

    py -I docs/example/space_zips.py      (from anywhere)
"""
import io
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

EX = Path(__file__).resolve().parents[2] / "src" / "public" / "examples"
SOURCE = EX / "weltall-quiz.zip"
FONT_PATHS = [Path("C:/Windows/Fonts/DejaVuSans-Bold.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")]
try:
    import matplotlib
    FONT_PATHS.append(Path(matplotlib.__file__).parent / "mpl-data" / "fonts" / "ttf" / "DejaVuSans-Bold.ttf")
except ImportError:
    pass
FONT = next((p for p in FONT_PATHS if p.exists()), None)

# Each drawing's German labels: the word, a box around it (px of the 1600-wide picture) and the colour of its letters.
LABELS = {
    "sonne-erde.png": [("Sonne", (90, 390, 420, 510), (140, 60, 0)), ("Erde", (1220, 270, 1420, 356), (255, 255, 255))],
    "tag-nacht.png": [("Sonne", (40, 40, 290, 120), (255, 230, 140)), ("Erde", (1000, 90, 1200, 170), (255, 255, 255)),
                      ("Tag", (880, 720, 1060, 820), (255, 230, 140)), ("Nacht", (1100, 720, 1360, 820), (170, 190, 255))],
    "umlauf.png": [("Sonne", (690, 570, 910, 660), (255, 230, 140)), ("Erde", (1290, 625, 1460, 710), (255, 255, 255))],
}
WORDS = {
    "en": {"Sonne": "Sun", "Erde": "Earth", "Tag": "Day", "Nacht": "Night"},
    "fr": {"Sonne": "Soleil", "Erde": "Terre", "Tag": "Jour", "Nacht": "Nuit"},
    "it": {"Sonne": "Sole", "Erde": "Terra", "Tag": "Giorno", "Nacht": "Notte"},
}

# Each language: (zip name, title, the 20 questions in order, each (question, [its choices in the source's order])).
LANGS = {
    "en": ("space-quiz.zip", "A journey through space", [
        ("The sun is a …", ["Star", "Planet", "Moon", "Comet"]),
        ("Which picture shows our Earth?", []),
        ("Why does night come once every day where we live?", ["The Earth spins around itself", "The sun flies around the Earth", "The sun switches off in the evening", "The Earth flies away from the sun"]),
        ("This is the biggest planet in our solar system. What is it called?", ["Jupiter", "Saturn", "Neptune", "Mars"]),
        ("Why does the moon shine at night?", ["The sun shines on it", "It burns like the sun", "It is made of glowing stone", "The stars light it up"]),
        ("A comet often has a long, glowing tail. What is a comet mostly made of?", ["Ice and dust", "Fire", "Metal", "Air"]),
        ("This planet is the hottest in the whole solar system. What is it called?", ["Venus", "Mercury", "Mars", "Jupiter"]),
        ("In 1969 something happened for the very first time. What?", ["People walked on the moon", "People landed on Mars", "A rocket flew to the sun", "People lived on the moon"]),
        ("The sun is huge! About how many Earths would fit inside the sun?", ["About 10", "About 100", "About 1000", "Over a million"]),
        ("Saturn has beautiful rings. What are they made of?", ["Lots of chunks of ice and rock", "A solid disc of stone", "Fire", "Light"]),
        ("Why do astronauts wear a spacesuit outside in space?", ["There is no air to breathe there", "So that they can be seen better", "Because it rains there", "Because it is too loud there"]),
        ("What is a shooting star really?", ["A little stone burning up in the air", "A star falling from the sky", "A plane at night", "A flash of lightning"]),
        ("The Earth travels around the sun. How long does one whole lap take?", ["One year", "One day", "One month", "One week"]),
        ("Mars is called “the red planet”. Why is it red?", ["Its dust is rusty", "It is red-hot", "It is full of lava", "Red plants grow there"]),
        ("The space station ISS flies around the Earth. How many times does it do that in a single day?", ["Once", "About 3 times", "About 16 times", "About 100 times"]),
        ("During a solar eclipse it gets dark in the middle of the day. What is happening?", ["The moon moves in front of the sun", "The Earth moves in front of the sun", "A huge cloud covers the sun", "The sun suddenly gets weaker"]),
        ("Pluto used to count as the 9th planet. What is it today?", ["A dwarf planet", "A star", "A comet", "A moon of the Earth"]),
        ("Neptune is very far from the sun. How long does it take to go once around the sun?", ["About a month", "Exactly one year", "About 10 years", "Over 160 years"]),
        ("The bright band in the sky is made of billions of stars. Our sun is one of them. What is the band called?", ["The Milky Way", "The Sun Road", "A shooting star", "The Moon's path"]),
        ("You can find these seven stars in the night sky. What is this group of stars called?", ["The Big Dipper", "The Milky Way", "The solar system", "The northern lights"]),
    ]),
    "fr": ("quiz-voyage-espace.zip", "Voyage dans l'espace", [
        ("Le Soleil est …", ["une étoile", "une planète", "une lune", "une comète"]),
        ("Quelle image montre notre Terre ?", []),
        ("Pourquoi fait-il nuit chez nous une fois par jour ?", ["La Terre tourne sur elle-même", "Le Soleil tourne autour de la Terre", "Le Soleil s'éteint le soir", "La Terre s'éloigne du Soleil"]),
        ("C'est la plus grande planète de notre système solaire. Comment s'appelle-t-elle ?", ["Jupiter", "Saturne", "Neptune", "Mars"]),
        ("Pourquoi la Lune brille-t-elle la nuit ?", ["Le Soleil l'éclaire", "Elle brûle comme le Soleil", "Elle est faite de pierre lumineuse", "Les étoiles l'éclairent"]),
        ("Une comète a souvent une longue queue lumineuse. De quoi une comète est-elle surtout faite ?", ["De glace et de poussière", "De feu", "De métal", "D'air"]),
        ("Cette planète est la plus chaude de tout le système solaire. Comment s'appelle-t-elle ?", ["Vénus", "Mercure", "Mars", "Jupiter"]),
        ("En 1969, quelque chose s'est passé pour la toute première fois. Quoi ?", ["Des humains ont marché sur la Lune", "Des humains se sont posés sur Mars", "Une fusée est allée jusqu'au Soleil", "Des humains ont habité sur la Lune"]),
        ("Le Soleil est immense ! Combien de Terres tiendraient à peu près dans le Soleil ?", ["Environ 10", "Environ 100", "Environ 1000", "Plus d'un million"]),
        ("Saturne a de magnifiques anneaux. De quoi sont-ils faits ?", ["De nombreux morceaux de glace et de roche", "D'un disque de pierre solide", "De feu", "De lumière"]),
        ("Pourquoi les astronautes portent-ils une combinaison spatiale dehors, dans l'espace ?", ["Il n'y a pas d'air à respirer", "Pour qu'on les voie mieux", "Parce qu'il y pleut", "Parce que c'est trop bruyant"]),
        ("Qu'est-ce qu'une étoile filante, en vrai ?", ["Un petit caillou qui brûle dans l'air", "Une étoile qui tombe du ciel", "Un avion dans la nuit", "Un éclair"]),
        ("La Terre voyage autour du Soleil. Combien de temps dure un tour complet ?", ["Un an", "Un jour", "Un mois", "Une semaine"]),
        ("On appelle Mars « la planète rouge ». Pourquoi est-elle rouge ?", ["Sa poussière est rouillée", "Elle est brûlante", "Elle est pleine de lave", "Des plantes rouges y poussent"]),
        ("La station spatiale ISS tourne autour de la Terre. Combien de fois en fait-elle le tour en une seule journée ?", ["Une fois", "Environ 3 fois", "Environ 16 fois", "Environ 100 fois"]),
        ("Pendant une éclipse de Soleil, il fait sombre en plein jour. Que se passe-t-il ?", ["La Lune passe devant le Soleil", "La Terre passe devant le Soleil", "Un nuage géant cache le Soleil", "Le Soleil faiblit tout à coup"]),
        ("Autrefois, Pluton comptait comme 9e planète. Qu'est-ce que Pluton aujourd'hui ?", ["Une planète naine", "Une étoile", "Une comète", "Une lune de la Terre"]),
        ("Neptune est très loin du Soleil. Combien de temps lui faut-il pour faire le tour du Soleil ?", ["Environ un mois", "Exactement un an", "Environ 10 ans", "Plus de 160 ans"]),
        ("La bande claire dans le ciel est faite de milliards d'étoiles. Notre Soleil en fait partie. Comment s'appelle cette bande ?", ["La Voie lactée", "La Route du Soleil", "Une étoile filante", "L'orbite de la Lune"]),
        ("Tu peux trouver ces sept étoiles dans le ciel la nuit. Comment s'appelle ce groupe d'étoiles ?", ["Le Grand Chariot", "La Voie lactée", "Le système solaire", "Une aurore polaire"]),
    ]),
    "it": ("quiz-viaggio-spazio.zip", "Viaggio nello spazio", [
        ("Il Sole è …", ["una stella", "un pianeta", "una luna", "una cometa"]),
        ("Quale immagine mostra la nostra Terra?", []),
        ("Perché da noi ogni giorno arriva una volta la notte?", ["La Terra gira su se stessa", "Il Sole gira intorno alla Terra", "Il Sole si spegne la sera", "La Terra si allontana dal Sole"]),
        ("È il pianeta più grande del nostro sistema solare. Come si chiama?", ["Giove", "Saturno", "Nettuno", "Marte"]),
        ("Perché la Luna brilla di notte?", ["Il Sole la illumina", "Brucia come il Sole", "È fatta di pietra luminosa", "Le stelle la illuminano"]),
        ("Una cometa ha spesso una lunga coda luminosa. Di che cosa è fatta soprattutto una cometa?", ["Di ghiaccio e polvere", "Di fuoco", "Di metallo", "Di aria"]),
        ("Questo pianeta è il più caldo di tutto il sistema solare. Come si chiama?", ["Venere", "Mercurio", "Marte", "Giove"]),
        ("Nel 1969 è successa una cosa per la primissima volta. Che cosa?", ["Delle persone hanno camminato sulla Luna", "Delle persone sono atterrate su Marte", "Un razzo è volato fino al Sole", "Delle persone hanno abitato sulla Luna"]),
        ("Il Sole è enorme! Più o meno quante Terre ci starebbero dentro?", ["Circa 10", "Circa 100", "Circa 1000", "Più di un milione"]),
        ("Saturno ha degli anelli bellissimi. Di che cosa sono fatti?", ["Di tanti pezzi di ghiaccio e roccia", "Di un disco di pietra compatto", "Di fuoco", "Di luce"]),
        ("Perché gli astronauti indossano una tuta spaziale fuori, nello spazio?", ["Lì non c'è aria da respirare", "Per farsi vedere meglio", "Perché lì piove", "Perché lì c'è troppo rumore"]),
        ("Che cos'è davvero una stella cadente?", ["Un sassolino che brucia nell'aria", "Una stella che cade dal cielo", "Un aereo di notte", "Un fulmine"]),
        ("La Terra viaggia intorno al Sole. Quanto dura un giro completo?", ["Un anno", "Un giorno", "Un mese", "Una settimana"]),
        ("Marte è chiamato «il pianeta rosso». Perché è rosso?", ["La sua polvere è arrugginita", "È rovente", "È pieno di lava", "Lì crescono piante rosse"]),
        ("La stazione spaziale ISS gira intorno alla Terra. Quante volte ci riesce in un solo giorno?", ["Una volta", "Circa 3 volte", "Circa 16 volte", "Circa 100 volte"]),
        ("Durante un'eclissi di Sole diventa buio in pieno giorno. Che cosa succede?", ["La Luna passa davanti al Sole", "La Terra passa davanti al Sole", "Una nuvola enorme copre il Sole", "Il Sole all'improvviso si indebolisce"]),
        ("Un tempo Plutone era considerato il 9° pianeta. Che cos'è oggi?", ["Un pianeta nano", "Una stella", "Una cometa", "Una luna della Terra"]),
        ("Nettuno è molto lontano dal Sole. Quanto tempo gli serve per fare un giro intorno al Sole?", ["Circa un mese", "Esattamente un anno", "Circa 10 anni", "Più di 160 anni"]),
        ("La fascia chiara nel cielo è fatta di miliardi di stelle. Anche il nostro Sole ne fa parte. Come si chiama questa fascia?", ["La Via Lattea", "La Via del Sole", "Una stella cadente", "L'orbita della Luna"]),
        ("Puoi trovare queste sette stelle nel cielo di notte. Come si chiama questo gruppo di stelle?", ["Il Grande Carro", "La Via Lattea", "Il sistema solare", "L'aurora polare"]),
    ]),
}


def french_spaces(s: str) -> str:
    """French puts a space before ? ! : ; and inside « »; a no-break one, so a line doesn't start with the mark (the site
    keeps no-break spaces as written: quiz/format.ts)."""
    import re
    return re.sub(r" ([?!:;»])", "\u00a0\\1", s).replace("« ", "«\u00a0")


def translate(text: str, title: str, questions: list, lang: str) -> str:
    """The source's lines with the title, each question's text and each choice's text replaced; tags and picture choices kept."""
    if lang == "fr":
        questions = [(french_spaces(q), [french_spaces(c) for c in cs]) for q, cs in questions]
    out, n, k = [], 0, 0
    for line in text.split("\n"):
        if line.startswith("Title: "):
            line = f"Title: {title}"
        elif line[:1].isdigit() and ". " in line and line.split(". ", 1)[0].isdigit():
            num = line.split(". ", 1)[0]
            n += 1
            assert int(num) == n, line
            line, k = f"{num}. {questions[n - 1][0]}", 0
        elif line[:2] in ("+ ", "- ") and not line[2:].startswith("Image:"):
            choices = questions[n - 1][1]
            line = f"{line[:2]}{choices[k]}"
            k += 1
        if n and line == "" and questions[n - 1][1]:
            assert k == len(questions[n - 1][1]), f"question {n}: {k} choices in the source"
        out.append(line)
    assert n == len(questions), f"{n} questions in the source"
    return "\n".join(out)


def relabel(png: bytes, labels: list, words: dict) -> bytes:
    im = Image.open(io.BytesIO(png)).convert("RGB")
    px = im.load()
    draw = ImageDraw.Draw(im)
    for word, (x0, y0, x1, y1), ink in labels:
        # the letters: pixels near the label's colour, their box
        near = lambda p: sum(abs(p[i] - ink[i]) for i in range(3)) < 90
        hits = [(x, y) for x in range(x0, x1) for y in range(y0, y1) if near(px[x, y])]
        assert hits, f"{word}: no letters found"
        bx0, by0 = min(x for x, _ in hits), min(y for _, y in hits)
        bx1, by1 = max(x for x, _ in hits), max(y for _, y in hits)
        # the face's size: the one at which the old word is as wide as it is drawn
        size = min(range(20, 200), key=lambda s: abs(ImageFont.truetype(str(FONT), s).getbbox(word)[2] - ImageFont.truetype(str(FONT), s).getbbox(word)[0] - (bx1 - bx0 + 1)))
        font = ImageFont.truetype(str(FONT), size)
        ob = font.getbbox(word)
        baseline_top = by0 - ob[1]  # where the face's origin was
        cx = (bx0 + bx1) / 2
        # paint the patch over from the rows just above and below it, column by column
        pad = 5
        px0, py0, px1, py1 = bx0 - pad, by0 - pad, bx1 + pad, by1 + pad
        for x in range(px0, px1 + 1):
            a, b = px[x, py0 - 1], px[x, py1 + 1]
            for y in range(py0, py1 + 1):
                t = (y - py0 + 1) / (py1 - py0 + 2)
                px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
        new = words[word]
        nb = font.getbbox(new)
        draw.text((cx - (nb[0] + nb[2]) / 2, baseline_top), new, font=font, fill=ink)
    out = io.BytesIO()
    im.save(out, "PNG", optimize=True)
    return out.getvalue()


if FONT is None:
    raise SystemExit("DejaVu Sans Bold not found (it comes with Windows 10's fonts here, or with matplotlib)")
with zipfile.ZipFile(SOURCE) as src:
    entries = [(i, src.read(i.filename)) for i in src.infolist()]
for lang, (name, title, questions) in LANGS.items():
    with zipfile.ZipFile(EX / name, "w", zipfile.ZIP_DEFLATED) as z:
        for info, data in entries:
            if info.filename == "quiz.txt":
                data = translate(data.decode("utf-8"), title, questions, lang).encode("utf-8")
            elif info.filename in LABELS:
                data = relabel(data, LABELS[info.filename], WORDS[lang])
            z.writestr(info, data)
    print(EX / name)
