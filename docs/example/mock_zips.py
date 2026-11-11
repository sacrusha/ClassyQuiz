"""Stand-ins for the Solo and Peers examples of the root page's merged element
(docs/backlog.md, "The page for people: dense, not busy", item 1; docs/design/root-page.md,
"Getting a quiz"). Mocks: nobody's run made them. The owner approves the actual examples and
runs them himself; their .zip files then replace these, and this script goes.

Each is a short quiz in the root page's four languages, the title marked as a mock, so a look
at the check shows which file is a stand-in.

    py -I docs/example/mock_zips.py      (from anywhere)
"""
import zipfile
from pathlib import Path

EX = Path(__file__).resolve().parents[2] / "src" / "public" / "examples"

# way -> lang -> (zip name, title, [(question, right, [wrong, ...]), ...])
QUIZZES = {
    "solo": {
        "en": ("cell-test-practice.zip", "Mock · The cell: what I got wrong", [
            ("Which part of the cell holds the DNA?", "The nucleus", ["The cell membrane", "The ribosome", "The vacuole"]),
            ("Where is most of the cell's energy made?", "In the mitochondria", ["In the nucleus", "In the cell wall", "In the ribosomes"]),
            ("Which of these does a plant cell have and an animal cell doesn't?", "A cell wall", ["A nucleus", "A cell membrane", "Mitochondria"]),
            ("What do ribosomes make?", "Proteins", ["Sugar", "DNA", "Fat"]),
            ("What does the cell membrane do?", "It controls what goes in and out", ["It makes energy", "It stores the DNA", "It makes the cell green"]),
            ("Where does photosynthesis happen?", "In the chloroplasts", ["In the mitochondria", "In the nucleus", "In the vacuole"]),
        ]),
        "de": ("zellen-test-uebung.zip", "Mock · Die Zelle: was ich falsch hatte", [
            ("Welcher Teil der Zelle enthält die DNA?", "Der Zellkern", ["Die Zellmembran", "Das Ribosom", "Die Vakuole"]),
            ("Wo wird die meiste Energie der Zelle gewonnen?", "In den Mitochondrien", ["Im Zellkern", "In der Zellwand", "In den Ribosomen"]),
            ("Was hat eine Pflanzenzelle, eine Tierzelle aber nicht?", "Eine Zellwand", ["Einen Zellkern", "Eine Zellmembran", "Mitochondrien"]),
            ("Was stellen Ribosomen her?", "Proteine", ["Zucker", "DNA", "Fett"]),
            ("Was macht die Zellmembran?", "Sie regelt, was hinein- und hinausgeht", ["Sie gewinnt Energie", "Sie speichert die DNA", "Sie macht die Zelle grün"]),
            ("Wo findet die Fotosynthese statt?", "In den Chloroplasten", ["In den Mitochondrien", "Im Zellkern", "In der Vakuole"]),
        ]),
        "fr": ("controle-cellule-revision.zip", "Mock · La cellule : mes erreurs", [
            ("Quelle partie de la cellule contient l'ADN ?", "Le noyau", ["La membrane", "Le ribosome", "La vacuole"]),
            ("Où la cellule produit-elle la plus grande partie de son énergie ?", "Dans les mitochondries", ["Dans le noyau", "Dans la paroi", "Dans les ribosomes"]),
            ("Qu'est-ce qu'une cellule végétale a, et une cellule animale non ?", "Une paroi", ["Un noyau", "Une membrane", "Des mitochondries"]),
            ("Que fabriquent les ribosomes ?", "Des protéines", ["Du sucre", "De l'ADN", "De la graisse"]),
            ("À quoi sert la membrane ?", "Elle contrôle ce qui entre et sort", ["Elle produit l'énergie", "Elle garde l'ADN", "Elle rend la cellule verte"]),
            ("Où se fait la photosynthèse ?", "Dans les chloroplastes", ["Dans les mitochondries", "Dans le noyau", "Dans la vacuole"]),
        ]),
        "it": ("verifica-cellula-ripasso.zip", "Mock · La cellula: i miei errori", [
            ("Quale parte della cellula contiene il DNA?", "Il nucleo", ["La membrana", "Il ribosoma", "Il vacuolo"]),
            ("Dove produce la cellula gran parte della sua energia?", "Nei mitocondri", ["Nel nucleo", "Nella parete", "Nei ribosomi"]),
            ("Che cosa ha una cellula vegetale e una animale no?", "Una parete cellulare", ["Un nucleo", "Una membrana", "I mitocondri"]),
            ("Che cosa producono i ribosomi?", "Proteine", ["Zucchero", "DNA", "Grasso"]),
            ("Che cosa fa la membrana cellulare?", "Controlla che cosa entra ed esce", ["Produce energia", "Conserva il DNA", "Rende verde la cellula"]),
            ("Dove avviene la fotosintesi?", "Nei cloroplasti", ["Nei mitocondri", "Nel nucleo", "Nel vacuolo"]),
        ]),
    },
    "peers": {
        "en": ("history-exam-quiz.zip", "Mock · The French Revolution", [
            ("In which year was the Bastille stormed?", "1789", ["1776", "1799", "1815"]),
            ("Who was king of France when the Revolution began?", "Louis XVI", ["Louis XIV", "Napoleon", "Charles X"]),
            ("What were the three estates?", "Clergy, nobility, everyone else", ["King, church, army", "Towns, villages, farms", "North, centre, south"]),
            ("Which document was adopted in August 1789?", "The Declaration of the Rights of Man", ["The Code Napoléon", "The Magna Carta", "The Treaty of Versailles"]),
            ("What was the Terror?", "A time of mass executions, 1793–94", ["A famine in 1788", "A war with Britain", "A royal decree"]),
            ("Who took power in 1799?", "Napoleon Bonaparte", ["Robespierre", "Marie Antoinette", "Danton"]),
        ]),
        "de": ("geschichte-pruefung-quiz.zip", "Mock · Die Französische Revolution", [
            ("In welchem Jahr wurde die Bastille gestürmt?", "1789", ["1776", "1799", "1815"]),
            ("Wer war König von Frankreich, als die Revolution begann?", "Ludwig XVI.", ["Ludwig XIV.", "Napoleon", "Karl X."]),
            ("Welches waren die drei Stände?", "Klerus, Adel, alle anderen", ["König, Kirche, Armee", "Städte, Dörfer, Höfe", "Norden, Mitte, Süden"]),
            ("Welches Dokument wurde im August 1789 verabschiedet?", "Die Erklärung der Menschen- und Bürgerrechte", ["Der Code Napoléon", "Die Magna Carta", "Der Vertrag von Versailles"]),
            ("Was war die Schreckensherrschaft?", "Eine Zeit der Massenhinrichtungen, 1793–94", ["Eine Hungersnot 1788", "Ein Krieg gegen England", "Ein Erlass des Königs"]),
            ("Wer übernahm 1799 die Macht?", "Napoleon Bonaparte", ["Robespierre", "Marie Antoinette", "Danton"]),
        ]),
        "fr": ("quiz-examen-histoire.zip", "Mock · La Révolution française", [
            ("En quelle année la Bastille a-t-elle été prise ?", "1789", ["1776", "1799", "1815"]),
            ("Qui était roi de France au début de la Révolution ?", "Louis XVI", ["Louis XIV", "Napoléon", "Charles X"]),
            ("Quels étaient les trois ordres ?", "Clergé, noblesse, tiers état", ["Roi, Église, armée", "Villes, villages, fermes", "Nord, centre, sud"]),
            ("Quel texte a été adopté en août 1789 ?", "La Déclaration des droits de l'homme et du citoyen", ["Le Code Napoléon", "La Magna Carta", "Le traité de Versailles"]),
            ("Qu'était la Terreur ?", "Une période d'exécutions de masse, 1793–94", ["Une famine en 1788", "Une guerre contre l'Angleterre", "Un décret royal"]),
            ("Qui a pris le pouvoir en 1799 ?", "Napoléon Bonaparte", ["Robespierre", "Marie-Antoinette", "Danton"]),
        ]),
        "it": ("quiz-esame-storia.zip", "Mock · La Rivoluzione francese", [
            ("In che anno fu presa la Bastiglia?", "1789", ["1776", "1799", "1815"]),
            ("Chi era re di Francia quando iniziò la Rivoluzione?", "Luigi XVI", ["Luigi XIV", "Napoleone", "Carlo X"]),
            ("Quali erano i tre stati?", "Clero, nobiltà, terzo stato", ["Re, Chiesa, esercito", "Città, villaggi, fattorie", "Nord, centro, sud"]),
            ("Quale documento fu adottato nell'agosto 1789?", "La Dichiarazione dei diritti dell'uomo e del cittadino", ["Il Codice napoleonico", "La Magna Carta", "Il trattato di Versailles"]),
            ("Che cos'era il Terrore?", "Un periodo di esecuzioni di massa, 1793–94", ["Una carestia nel 1788", "Una guerra con l'Inghilterra", "Un decreto del re"]),
            ("Chi prese il potere nel 1799?", "Napoleone Bonaparte", ["Robespierre", "Maria Antonietta", "Danton"]),
        ]),
    },
}


def quiz_text(title, questions):
    out = [f"Title: {title}", ""]
    for i, (q, right, wrong) in enumerate(questions, 1):
        out.append(f"{i}. {q}")
        out.append(f"+ {right}")
        out += [f"- {w}" for w in wrong]
        out.append("")
    return "\n".join(out)


for way, langs in QUIZZES.items():
    for lang, (name, title, questions) in langs.items():
        info = zipfile.ZipInfo("quiz.txt", date_time=(2026, 11, 11, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        with zipfile.ZipFile(EX / name, "w") as z:
            z.writestr(info, quiz_text(title, questions).encode("utf-8"))
        print(EX / name)
