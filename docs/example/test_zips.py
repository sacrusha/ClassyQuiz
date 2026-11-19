"""Translates the quiz of the test run into German, English and Italian.

The AI handed over classyquiz-cellule.zip in French (19 Nov 2026). That file is in src/public/examples/ unchanged.
This script writes three more .zip files beside it. In each one, quiz.txt has a translated title, translated
questions and translated choices. The two drawings contain no words and are copied unchanged.

The translations use the same school terms as the test sheet in that language (test_sheet.py). They are drafts
that the owner has not reviewed (docs/translation-review.md). The root page's "Test" tab offers these files
(docs/design/root-page.md, "Getting a quiz").

    py -I docs/example/test_zips.py      (from anywhere)
"""
import re
import zipfile
from pathlib import Path

EX = Path(__file__).resolve().parents[2] / "src" / "public" / "examples"
SOURCE = EX / "classyquiz-cellule.zip"

X10 = {"de": "Das Okular vergrössert {a}-fach, das Objektiv {b}-fach. Wie stark ist die Gesamtvergrösserung?",
       "en": "The eyepiece magnifies {a} times, the objective lens {b} times. What is the total magnification?",
       "it": "L'oculare ingrandisce {a} volte, l'obiettivo {b} volte. Qual è l'ingrandimento totale?"}
TIMES = {"de": "{n}-fach", "en": "{n} times", "it": "{n} volte"}


def magnify(lang, a, b, *answers):
    return (X10[lang].format(a=a, b=b), [TIMES[lang].format(n=n) for n in answers])


# Each language: (zip name, title, [(question, [choices in the French order]), ...]).
LANGS = {
    "de": ("classyquiz-zelle.zip", "Repetition Biologie 1. Sek · Die Zelle", [
        ("In dieser Pflanzenzelle: Wie heisst der Bestandteil, auf den der Pfeil zeigt?", ["Mitochondrium", "Ribosom", "Chloroplast", "Zellkern"]),
        ("Wie lautet die Wortgleichung der Fotosynthese (die mit Hilfe von Licht abläuft)?", [
            "Kohlenstoffdioxid + Wasser → Traubenzucker + Sauerstoff", "Sauerstoff + Wasser → Traubenzucker + Kohlenstoffdioxid",
            "Traubenzucker + Wasser → Sauerstoff + Kohlenstoffdioxid", "Traubenzucker + Sauerstoff → Kohlenstoffdioxid + Wasser"]),
        magnify("de", 10, 40, 400, 50, 40, 4000),
        ("Richtig oder falsch: Bakterien haben einen Zellkern.", ["Richtig", "Falsch"]),
        ("Wo kommen Mitochondrien vor?", ["In Pflanzenzellen und in Tierzellen", "Nur in Tierzellen", "Nur in Pflanzenzellen", "Weder in den einen noch in den anderen"]),
        ("Was braucht die Pflanze ausser Licht für die Fotosynthese?", ["Kohlenstoffdioxid und Wasser", "Sauerstoff und Wasser", "Traubenzucker und Wasser", "Traubenzucker und Sauerstoff"]),
        ("Wozu dient die Blende eines Mikroskops?", ["Sie regelt, wie viel Licht durchkommt", "Sie vergrössert das Bild", "Sie stellt das Bild scharf", "Sie hält den Objektträger fest"]),
        ("Welcher dieser Bestandteile kommt in BEIDEN Zelltypen vor, in der Pflanzen- und in der Tierzelle?", ["Die Zellmembran", "Die Zellwand", "Die Chloroplasten", "Die grosse Vakuole"]),
        ("Warum könnten Tiere ohne Pflanzen nicht leben, auch abgesehen vom Sauerstoff?", ["Pflanzen stehen am Anfang der Nahrungsketten", "Sie stellen das Wasser her, das die Tiere trinken", "Sie stellen das Kohlenstoffdioxid her, das wir atmen", "Sie wärmen die Luft"]),
        ("Wie berechnet man die Gesamtvergrösserung eines Mikroskops?", ["Man multipliziert die Vergrösserung des Okulars mit der des Objektivs", "Man addiert die Vergrösserung von Okular und Objektiv", "Man nimmt nur die Vergrösserung des Objektivs", "Man nimmt nur die grössere der beiden"]),
        ("Was unterscheidet ein Bakterium von den Zellen deines Körpers?", ["Es hat keinen Zellkern", "Es hat keine Zellmembran", "Es ist nicht lebendig", "Es ist viel grösser"]),
        ("Was entsteht bei der Fotosynthese?", ["Traubenzucker und Sauerstoff", "Traubenzucker und Kohlenstoffdioxid", "Kohlenstoffdioxid und Wasser", "Sauerstoff und Wasser"]),
        ("In dieser Tierzelle: Wie heisst der Bestandteil, auf den der Pfeil zeigt?", ["Mitochondrium", "Chloroplast", "Zellkern", "Vakuole"]),
        ("Das Bild im Mikroskop ist zu dunkel. Welches Teil musst du verstellen?", ["Die Blende", "Das Rad zum Scharfstellen", "Das Deckglas", "Das Okular"]),
        ("Hat eine Pflanzenzelle eine Zellmembran?", ["Ja, gleich innerhalb der Zellwand", "Nein, die Zellwand ersetzt die Zellmembran", "Nein, nur Tierzellen haben eine"]),
        ("Das Gras wird von einem Kaninchen gefressen, das Kaninchen von einem Fuchs. Woher kommt die Nahrung des Fuchses ursprünglich?", ["Von den Pflanzen: Sie stellen Nahrung durch Fotosynthese her", "Aus dem Boden", "Aus dem Wasser, das das Kaninchen trinkt", "Aus dem Sauerstoff der Luft"]),
        magnify("de", 10, 4, 40, 14, 4, 400),
        ("Welcher dieser Bestandteile kommt NUR in der Pflanzenzelle vor?", ["Die Chloroplasten", "Die Mitochondrien", "Die Zellmembran", "Der Zellkern"]),
        ("Welches Gas nimmt die Pflanze für die Fotosynthese aus der Luft auf?", ["Kohlenstoffdioxid", "Sauerstoff", "Stickstoff"]),
        ("Was macht das Mitochondrium in Tierzellen und in Pflanzenzellen?", ["Es gewinnt aus Traubenzucker Energie für die Zelle", "Es stellt mit Hilfe von Licht Traubenzucker her", "Es enthält die Erbinformation", "Es speichert Wasser"]),
        magnify("de", 15, 10, 150, 25, 1500, 105),
        ("Welcher Satz stimmt?", ["Pflanzenzellen haben Mitochondrien und eine Zellmembran", "Tierzellen haben eine Zellwand", "Bakterien haben einen Zellkern", "Tierzellen haben Chloroplasten"]),
    ]),
    "en": ("classyquiz-cell.zip", "Biology Year 7 revision · The cell", [
        ("In this plant cell, what is the part the arrow points to called?", ["Mitochondrion", "Ribosome", "Chloroplast", "Nucleus"]),
        ("What is the word equation for photosynthesis (which needs light)?", [
            "carbon dioxide + water → glucose + oxygen", "oxygen + water → glucose + carbon dioxide",
            "glucose + water → oxygen + carbon dioxide", "glucose + oxygen → carbon dioxide + water"]),
        magnify("en", 10, 40, 400, 50, 40, 4000),
        ("True or false: bacteria have a nucleus.", ["True", "False"]),
        ("Where are mitochondria found?", ["In plant cells and in animal cells", "Only in animal cells", "Only in plant cells", "In neither"]),
        ("Besides light, what does a plant use for photosynthesis?", ["Carbon dioxide and water", "Oxygen and water", "Glucose and water", "Glucose and oxygen"]),
        ("What is the diaphragm of a microscope for?", ["To control how much light gets through", "To magnify the image", "To focus the image", "To hold the slide"]),
        ("Which of these parts is found in BOTH kinds of cell, plant and animal?", ["The cell membrane", "The cell wall", "The chloroplasts", "The large vacuole"]),
        ("Besides oxygen, why could animals not live without plants?", ["Plants are at the start of food chains", "They make the water animals drink", "They produce the carbon dioxide we breathe", "They warm the air"]),
        ("How do you work out the total magnification of a microscope?", ["Multiply the magnification of the eyepiece by the magnification of the objective lens", "Add the magnification of the eyepiece and the magnification of the objective lens", "Use only the magnification of the objective lens", "Use only the larger of the two"]),
        ("What makes a bacterium different from the cells of your body?", ["It has no nucleus", "It has no membrane", "It is not alive", "It is much bigger"]),
        ("What does photosynthesis produce?", ["Glucose and oxygen", "Glucose and carbon dioxide", "Carbon dioxide and water", "Oxygen and water"]),
        ("In this animal cell, what is the part the arrow points to called?", ["Mitochondrion", "Chloroplast", "Nucleus", "Vacuole"]),
        ("Under the microscope, your image is too dark. Which part do you adjust?", ["The diaphragm", "The focus knob", "The cover slip", "The eyepiece"]),
        ("Does a plant cell have a cell membrane?", ["Yes, just inside the cell wall", "No, the cell wall replaces the membrane", "No, only animal cells have one"]),
        ("Grass is eaten by a rabbit, the rabbit by a fox. Where does the food of the fox come from originally?", ["From plants, which make it by photosynthesis", "From the soil", "From the water the rabbit drinks", "From the oxygen in the air"]),
        magnify("en", 10, 4, 40, 14, 4, 400),
        ("Which of these parts is found ONLY in the plant cell?", ["The chloroplasts", "The mitochondria", "The cell membrane", "The nucleus"]),
        ("Which gas does a plant take from the air for photosynthesis?", ["Carbon dioxide", "Oxygen", "Nitrogen"]),
        ("What does the mitochondrion do in both animal cells and plant cells?", ["It releases energy from glucose for the cell", "It makes glucose with the help of light", "It holds the genetic information", "It stores water"]),
        magnify("en", 15, 10, 150, 25, 1500, 105),
        ("Which sentence is right?", ["Plant cells have mitochondria and a cell membrane", "Animal cells have a cell wall", "Bacteria have a nucleus", "Animal cells have chloroplasts"]),
    ]),
    "it": ("classyquiz-cellula.zip", "Ripasso di scienze, classe prima · La cellula", [
        ("In questa cellula vegetale, come si chiama la parte indicata dalla freccia?", ["Mitocondrio", "Ribosoma", "Cloroplasto", "Nucleo"]),
        ("Qual è l'equazione a parole della fotosintesi (che avviene grazie alla luce)?", [
            "anidride carbonica + acqua → glucosio + ossigeno", "ossigeno + acqua → glucosio + anidride carbonica",
            "glucosio + acqua → ossigeno + anidride carbonica", "glucosio + ossigeno → anidride carbonica + acqua"]),
        magnify("it", 10, 40, 400, 50, 40, 4000),
        ("Vero o falso: i batteri hanno un nucleo.", ["Vero", "Falso"]),
        ("Dove si trovano i mitocondri?", ["Nelle cellule vegetali e nelle cellule animali", "Solo nelle cellule animali", "Solo nelle cellule vegetali", "Né nelle une né nelle altre"]),
        ("Oltre alla luce, che cosa usa la pianta per fare la fotosintesi?", ["Anidride carbonica e acqua", "Ossigeno e acqua", "Glucosio e acqua", "Glucosio e ossigeno"]),
        ("A che cosa serve il diaframma del microscopio?", ["A regolare la quantità di luce", "A ingrandire l'immagine", "A mettere a fuoco", "A tenere fermo il vetrino"]),
        ("Quale di queste parti si trova in ENTRAMBI i tipi di cellula, vegetale e animale?", ["La membrana cellulare", "La parete cellulare", "I cloroplasti", "Il grande vacuolo"]),
        ("Oltre che per l'ossigeno, perché gli animali non potrebbero vivere senza le piante?", ["Le piante sono all'inizio delle catene alimentari", "Producono l'acqua che bevono gli animali", "Producono l'anidride carbonica che respiriamo", "Riscaldano l'aria"]),
        ("Come si calcola l'ingrandimento totale di un microscopio?", ["Si moltiplica l'ingrandimento dell'oculare per quello dell'obiettivo", "Si sommano l'ingrandimento dell'oculare e quello dell'obiettivo", "Si considera solo l'ingrandimento dell'obiettivo", "Si considera solo il maggiore dei due"]),
        ("Che cosa distingue un batterio dalle cellule del tuo corpo?", ["Non ha il nucleo", "Non ha la membrana", "Non è vivo", "È molto più grande"]),
        ("Che cosa produce la fotosintesi?", ["Glucosio e ossigeno", "Glucosio e anidride carbonica", "Anidride carbonica e acqua", "Ossigeno e acqua"]),
        ("In questa cellula animale, come si chiama la parte indicata dalla freccia?", ["Mitocondrio", "Cloroplasto", "Nucleo", "Vacuolo"]),
        ("Al microscopio la tua immagine è troppo scura. Quale parte regoli?", ["Il diaframma", "La vite di messa a fuoco", "Il vetrino coprioggetto", "L'oculare"]),
        ("Una cellula vegetale ha una membrana cellulare?", ["Sì, subito all'interno della parete", "No, la parete sostituisce la membrana", "No, ce l'hanno solo le cellule animali"]),
        ("L'erba è mangiata da un coniglio, il coniglio da una volpe. Da dove viene, in origine, il cibo della volpe?", ["Dalle piante, che lo producono con la fotosintesi", "Dal suolo", "Dall'acqua che beve il coniglio", "Dall'ossigeno dell'aria"]),
        magnify("it", 10, 4, 40, 14, 4, 400),
        ("Quale di queste parti si trova SOLO nella cellula vegetale?", ["I cloroplasti", "I mitocondri", "La membrana cellulare", "Il nucleo"]),
        ("Quale gas la pianta prende dall'aria per fare la fotosintesi?", ["L'anidride carbonica", "L'ossigeno", "L'azoto"]),
        ("Che cosa fa il mitocondrio nelle cellule animali e in quelle vegetali?", ["Ricava dal glucosio l'energia per la cellula", "Produce glucosio con l'aiuto della luce", "Contiene l'informazione genetica", "Accumula acqua"]),
        magnify("it", 15, 10, 150, 25, 1500, 105),
        ("Quale frase è giusta?", ["Le cellule vegetali hanno mitocondri e una membrana", "Le cellule animali hanno una parete cellulare", "I batteri hanno un nucleo", "Le cellule animali hanno i cloroplasti"]),
    ]),
}


def translate(text: str, title: str, questions: list, lang: str) -> str:
    """Return the French quiz.txt with every title, question and choice replaced by its translation.
    The question numbers, the + and - marks and all other lines stay as they are."""
    out, qi, ci = [], -1, 0
    for line in text.split("\n"):
        m = re.match(r"(\d+)\. ", line)
        if line.startswith("Title: "):
            out.append("Title: " + title)
        elif m:
            assert qi < 0 or ci == len(questions[qi][1]), f"{lang} {qi + 1}: {ci} choices in the source, {len(questions[qi][1])} translated"
            qi, ci = qi + 1, 0
            out.append(f"{m.group(1)}. {questions[qi][0]}")
        elif line[:2] in ("+ ", "- "):
            out.append(line[:2] + questions[qi][1][ci])
            ci += 1
        else:
            out.append(line)
    assert qi + 1 == len(questions), f"{lang}: {qi + 1} questions in the source, {len(questions)} translated"
    return "\n".join(out)


with zipfile.ZipFile(SOURCE) as src:
    entries = [(i, src.read(i)) for i in src.infolist()]
for lang, (name, title, questions) in LANGS.items():
    with zipfile.ZipFile(EX / name, "w") as z:
        for info, data in entries:
            out = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            out.compress_type = zipfile.ZIP_DEFLATED
            if info.filename == "quiz.txt":
                data = translate(data.decode("utf-8"), title, questions, lang).encode("utf-8")
            z.writestr(out, data)
    print(EX / name)
