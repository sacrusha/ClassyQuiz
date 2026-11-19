"""Builds the marked test that the Test example attaches (docs/design/root-page.md, "Getting a quiz").

The test is a two-page biology test on the cell. A pupil has answered it and a teacher has marked it with
21 of 30 points. It is invented, because a real test would show a real pupil's work.

test_sheet.html is the sheet. It has three layers: the printed test, the pupil's handwriting and the teacher's
red marks. The red marks are ticks, crosses and points only. The teacher does not write the right answers,
because many tests come back that way.

This file holds the words in the root page's four languages. Every language has the same questions and the
same mistakes:
- the mitochondrion is labelled "ribosome";
- mitochondria and the cell membrane are ticked for animal cells only;
- the two gases in the photosynthesis equation are swapped, and the second reason in 4c is missing;
- the two magnifications are added, not multiplied;
- the purpose of the diaphragm is wrong;
- "bacteria have a nucleus" is marked true.

    py -I docs/example/test_sheet.py [--lang de] [--layer blank|filled|marked]      (from anywhere)

By default it writes the marked test to src/public/examples/test-<lang>.pdf. The run attached that file, and
/example offers it for download. build.py draws the page pictures from it. With --layer blank or --layer filled
it writes .tmp/testSheet/test-<lang>-<layer>.pdf (git-ignored).

Needs playwright and Edge. The handwriting fonts are Ink Free and Segoe Script, which Windows has.
"""
import argparse
import html
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
EX = HERE.parents[1] / "src" / "public" / "examples"
TMP = HERE.parents[1] / ".tmp" / "testSheet"

TEXT = {
    "de": dict(
        course="Biologie · 1. Sek · Thema 2", title="Prüfung: Die Zelle",
        name="Name:", **{"class": "Klasse:"}, date="Datum:", points="Punkte:", grade=("Note:", "4.5"),
        pupil="Lena Brunner", pupilClass="1b", pupilDate="10. 11. 2026",
        p="P.", p1="P.", page="Seite", foot="Biologie 1. Sek · Prüfung «Die Zelle»",
        wall="Zellwand", membrane="Zellmembran", nucleus="Zellkern", chloroplast="Chloroplast", vacuole="Vakuole",
        mitochondrion="Mitochondrium", ribosome="Ribosom",
        chloroplasts="Chloroplasten", mitochondria="Mitochondrien", bigVacuole="grosse Vakuole mit Zellsaft",
        t1="Beschrifte die Pflanzenzelle.",
        t2="Welche Aufgabe gehört zu welchem Zellbestandteil? Schreibe die Buchstaben auf.",
        jobA="speichert Wasser und darin gelöste Stoffe (Zellsaft)",
        jobB="steuert die Vorgänge in der Zelle und enthält die Erbinformation",
        jobC="stellt mit Hilfe von Licht Traubenzucker her",
        jobD="grenzt die Zelle ab und regelt, welche Stoffe hinein- und hinausgelangen",
        jobE="gewinnt aus Traubenzucker Energie für die Zelle",
        t3="Pflanzenzelle, Tierzelle oder beide? Kreuze an, wo der Bestandteil vorkommt.",
        part="Bestandteil", plantCell="Pflanzenzelle", animalCell="Tierzelle",
        t4="Fotosynthese", q4a="Ergänze die Wortgleichung der Fotosynthese.",
        oxygen="Sauerstoff", water="Wasser", light="Licht", glucose="Traubenzucker", co2="Kohlenstoffdioxid",
        q4b="In welchem Zellbestandteil findet die Fotosynthese statt?", a4b="in den Chloroplasten",
        q4c="Nenne zwei Gründe, warum Menschen und Tiere ohne Pflanzen nicht leben könnten.",
        a4c="Pflanzen machen den Sauerstoff, den wir zum Atmen brauchen.",
        t5="Das Mikroskop",
        q5a="Das Okular vergrössert 10-fach, das Objektiv 40-fach. Wie stark ist die Gesamtvergrösserung?",
        a5a="10 + 40 = 50-fach",
        q5b="Mit welchem Objektiv beginnst du beim Mikroskopieren?", a5b="mit dem kleinsten",
        q5c="Wozu dient die Blende?", a5c="damit man das Bild grösser sieht",
        q5d="Wie heisst das dünne Glasplättchen, das auf das Objekt gelegt wird?", a5d="Deckglas",
        t6="Richtig oder falsch? Kreuze an.", statement="Aussage", true="richtig", false="falsch",
        s1="Alle Lebewesen bestehen aus Zellen.", s2="Bakterien haben einen Zellkern.",
        s3="Alle Zellen in deinem Körper sehen gleich aus.", s4="Neue Zellen entstehen, indem sich Zellen teilen.",
    ),
    "en": dict(
        course="Biology · Year 7 · Unit 2", title="Test: The cell",
        name="Name:", **{"class": "Class:"}, date="Date:", points="Points:", grade=None,
        pupil="Emily Carter", pupilClass="7B", pupilDate="10 Nov 2026",
        p="pts", p1="pt", page="Page", foot="Biology Year 7 · Test “The cell”",
        wall="Cell wall", membrane="Cell membrane", nucleus="Nucleus", chloroplast="Chloroplast", vacuole="Vacuole",
        mitochondrion="Mitochondrion", ribosome="Ribosome",
        chloroplasts="Chloroplasts", mitochondria="Mitochondria", bigVacuole="Large vacuole with cell sap",
        t1="Label the plant cell.",
        t2="Which job belongs to which part of the cell? Write down the letters.",
        jobA="stores water and the substances dissolved in it (cell sap)",
        jobB="controls what happens in the cell and holds the genetic information",
        jobC="makes glucose with the help of light",
        jobD="encloses the cell and controls which substances get in and out",
        jobE="releases energy from glucose for the cell",
        t3="Plant cell, animal cell or both? Put a cross where the part is found.",
        part="Part", plantCell="Plant cell", animalCell="Animal cell",
        t4="Photosynthesis", q4a="Complete the word equation for photosynthesis.",
        oxygen="oxygen", water="water", light="light", glucose="glucose", co2="carbon dioxide",
        q4b="In which part of the cell does photosynthesis take place?", a4b="in the chloroplasts",
        q4c="Give two reasons why humans and animals could not live without plants.",
        a4c="Plants make the oxygen we need to breathe.",
        t5="The microscope",
        q5a="The eyepiece magnifies 10 times, the objective lens 40 times. What is the total magnification?",
        a5a="10 + 40 = 50 times",
        q5b="Which objective lens do you start with?", a5b="the smallest one",
        q5c="What is the diaphragm for?", a5c="so you see the picture bigger",
        q5d="What is the thin piece of glass called that is placed on top of the specimen?", a5d="cover slip",
        t6="True or false? Put a cross.", statement="Statement", true="true", false="false",
        s1="All living things are made of cells.", s2="Bacteria have a nucleus.",
        s3="All the cells in your body look the same.", s4="New cells form when cells divide.",
    ),
    "fr": dict(
        course="SVT · 5e · Chapitre 2", title="Contrôle : La cellule",
        name="Nom :", **{"class": "Classe :"}, date="Date :", points="Points :", grade=None,
        pupil="Léa Martin", pupilClass="5e B", pupilDate="10/11/2026",
        p="pts", p1="pt", page="Page", foot="SVT 5e · Contrôle « La cellule »",
        wall="Paroi", membrane="Membrane", nucleus="Noyau", chloroplast="Chloroplaste", vacuole="Vacuole",
        mitochondrion="Mitochondrie", ribosome="Ribosome",
        chloroplasts="Chloroplastes", mitochondria="Mitochondries", bigVacuole="Grande vacuole",
        t1="Légende la cellule végétale.",
        t2="Quel rôle correspond à quel élément de la cellule ? Écris les lettres.",
        jobA="stocke de l'eau et des substances dissoutes",
        jobB="dirige le fonctionnement de la cellule et contient l'information génétique",
        jobC="fabrique du glucose grâce à la lumière",
        jobD="délimite la cellule et contrôle les substances qui entrent et qui sortent",
        jobE="libère l'énergie du glucose pour la cellule",
        t3="Cellule végétale, cellule animale ou les deux ? Coche là où l'élément est présent.",
        part="Élément", plantCell="Cellule végétale", animalCell="Cellule animale",
        t4="La photosynthèse", q4a="Complète l'équation de la photosynthèse.",
        oxygen="dioxygène", water="eau", light="lumière", glucose="glucose", co2="dioxyde de carbone",
        q4b="Dans quel élément de la cellule la photosynthèse a-t-elle lieu ?", a4b="dans les chloroplastes",
        q4c="Donne deux raisons pour lesquelles les humains et les animaux ne pourraient pas vivre sans les plantes.",
        a4c="Les plantes produisent le dioxygène qu'on respire.",
        t5="Le microscope",
        q5a="L'oculaire grossit 10 fois, l'objectif 40 fois. Quel est le grossissement total ?",
        a5a="10 + 40 = 50 fois",
        q5b="Par quel objectif commences-tu l'observation ?", a5b="par le plus petit",
        q5c="À quoi sert le diaphragme ?", a5c="à voir l'image en plus grand",
        q5d="Comment s'appelle la fine plaque de verre que l'on pose sur l'objet ?", a5d="la lamelle",
        t6="Vrai ou faux ? Coche.", statement="Affirmation", true="vrai", false="faux",
        s1="Tous les êtres vivants sont constitués de cellules.", s2="Les bactéries ont un noyau.",
        s3="Toutes les cellules de ton corps se ressemblent.",
        s4="Les nouvelles cellules naissent de la division d'autres cellules.",
    ),
    "it": dict(
        course="Scienze · Classe prima · Unità 2", title="Verifica: La cellula",
        name="Nome:", **{"class": "Classe:"}, date="Data:", points="Punti:", grade=None,
        pupil="Giulia Rossi", pupilClass="1ª B", pupilDate="10/11/2026",
        p="p.", p1="p.", page="Pagina", foot="Scienze, classe prima · Verifica «La cellula»",
        wall="Parete cellulare", membrane="Membrana cellulare", nucleus="Nucleo", chloroplast="Cloroplasto",
        vacuole="Vacuolo", mitochondrion="Mitocondrio", ribosome="Ribosoma",
        chloroplasts="Cloroplasti", mitochondria="Mitocondri", bigVacuole="Grande vacuolo",
        t1="Scrivi i nomi delle parti della cellula vegetale.",
        t2="Quale funzione appartiene a quale parte della cellula? Scrivi le lettere.",
        jobA="accumula acqua e sostanze disciolte",
        jobB="dirige le attività della cellula e contiene l'informazione genetica",
        jobC="produce glucosio con l'aiuto della luce",
        jobD="delimita la cellula e controlla quali sostanze entrano ed escono",
        jobE="ricava dal glucosio l'energia per la cellula",
        t3="Cellula vegetale, cellula animale o entrambe? Metti una crocetta dove la parte è presente.",
        part="Parte", plantCell="Cellula vegetale", animalCell="Cellula animale",
        t4="La fotosintesi", q4a="Completa l'equazione a parole della fotosintesi.",
        oxygen="ossigeno", water="acqua", light="luce", glucose="glucosio", co2="anidride carbonica",
        q4b="In quale parte della cellula avviene la fotosintesi?", a4b="nei cloroplasti",
        q4c="Indica due motivi per cui l'uomo e gli animali non potrebbero vivere senza le piante.",
        a4c="Le piante producono l'ossigeno che respiriamo.",
        t5="Il microscopio",
        q5a="L'oculare ingrandisce 10 volte, l'obiettivo 40 volte. Qual è l'ingrandimento totale?",
        a5a="10 + 40 = 50 volte",
        q5b="Con quale obiettivo inizi l'osservazione?", a5b="con il più piccolo",
        q5c="A che cosa serve il diaframma?", a5c="a vedere l'immagine più grande",
        q5d="Come si chiama il vetrino sottile che si appoggia sul preparato?", a5d="vetrino coprioggetto",
        t6="Vero o falso? Metti una crocetta.", statement="Affermazione", true="vero", false="falso",
        s1="Tutti gli esseri viventi sono fatti di cellule.", s2="I batteri hanno un nucleo.",
        s3="Tutte le cellule del tuo corpo sono uguali.",
        s4="Le nuove cellule nascono dalla divisione di altre cellule.",
    ),
}


def page_html(lang):
    t = dict(TEXT[lang], lang=lang)
    grade = t.pop("grade")
    words = {k: html.escape(v, quote=False) for k, v in t.items()}
    if lang == "fr":  # French puts a space before : ? ! and inside « »; make it a no-break space
        words = {k: re.sub(r" ([:?!»])", " \\1", v).replace("« ", "« ") for k, v in words.items()}
    words["gradeRow"] = f'{grade[0]} <span class="line"><span class="t">{grade[1]}</span></span>' if grade else ""
    return re.sub(r"\[\[(\w+)\]\]", lambda m: words[m[1]], (HERE / "test_sheet.html").read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", choices=list(TEXT))
    ap.add_argument("--layer", choices=["blank", "filled", "marked"], default="marked")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright

    TMP.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge")
        page = b.new_page()
        for lang in [a.lang] if a.lang else TEXT:
            out = EX / f"test-{lang}.pdf" if a.layer == "marked" else TMP / f"test-{lang}-{a.layer}.pdf"
            src = TMP / f"sheet-{lang}.html"
            src.write_text(page_html(lang), encoding="utf-8")
            page.goto(f"{src.as_uri()}?layer={a.layer}")
            page.evaluate("document.fonts.ready")
            page.pdf(path=str(out), format="A4", print_background=True)
            src.unlink()
            print(out)
        b.close()


if __name__ == "__main__":
    main()
