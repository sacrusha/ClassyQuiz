"""The notes quiz in German, French and Italian: the run's french-revolution-quiz.zip (English, 12 Nov 2026) with its
quiz.txt translated, title, questions and choices, in the words of that language's class notes
(src/public/examples/notes-<lang>.pdf). The root page's "Notes" tab shows this run (docs/design/root-page.md, "Getting a quiz"); the
translations are drafts for the owner's review (docs/translation-review.md), as the other examples' are.

    py -I docs/example/notes_zips.py      (from anywhere)
"""
import re
import zipfile
from pathlib import Path

EX = Path(__file__).resolve().parents[2] / "src" / "public" / "examples"
SOURCE = EX / "french-revolution-quiz.zip"

# Each language: (zip name, title, [(question, [choices in the English order, the right one first]), ...]).
LANGS = {
    "de": ("franzoesische-revolution-quiz.zip", "Die Französische Revolution · Prüfungsvorbereitung", [
        ("Wer gehörte zum Dritten Stand?", ["Alle ausser Klerus und Adel: Bürgertum, Arbeiterschaft, Bauern", "Nur arme Bauern", "Nur reiche Kaufleute und Anwälte", "Die engsten Berater des Königs"]),
        ("Welche Ideen der Aufklärung stellten die alte Ordnung infrage?", ["Freiheit, Gleichheit und Volkssouveränität", "Gottesgnadentum, Tradition und Gehorsam", "Privilegien, Rang und Erbe", "Brot, Steuern und Krieg"]),
        ("In den Generalständen stritt man, wie abgestimmt wird: nach Ständen oder nach Köpfen (eine Stimme pro Abgeordneten). Warum wollte der Dritte Stand nach Köpfen abstimmen?", ["Er war die grosse Mehrheit, nach Köpfen hatte er also echtes Gewicht", "Der König hatte es ihm für neue Steuern versprochen", "Er wollte den Adel aus der Versammlung werfen", "Er wollte, dass der König gar keine Stimme hat"]),
        ("Was schworen die Abgeordneten beim Ballhausschwur?", ["Nicht auseinanderzugehen, bevor Frankreich eine Verfassung hat", "Nach Versailles zu ziehen und den König nach Paris zu bringen", "Die Monarchie abzuschaffen und eine Republik zu gründen", "Österreich den Krieg zu erklären"]),
        ("Warum erinnert man sich an den Sturm auf die Bastille?", ["Er wurde zum Symbol des Widerstands gegen die Königsmacht", "Er beendete die Monarchie endgültig", "Er schaffte die feudalen Privilegien ab", "Er begründete die Republik"]),
        ("Was verkündete die Erklärung der Menschen- und Bürgerrechte?", ["Freiheit, Gleichheit vor dem Gesetz, Eigentum und nationale Souveränität", "Eine Republik ohne König", "Die Herrschaft der Kirche über den Staat", "Die absolute Macht des Königs"]),
        ("Was für einen Staat schuf die Verfassung von 1791?", ["Eine konstitutionelle Monarchie: ein König mit begrenzter Macht", "Eine Republik ohne König", "Eine absolute Monarchie unter neuem Namen", "Eine Diktatur unter Robespierre"]),
        ("Welche Versammlung schaffte die Monarchie ab und rief die Republik aus?", ["Der Nationalkonvent", "Die Generalstände", "Das Direktorium", "Der Wohlfahrtsausschuss"]),
        ("Wer hatte während der Terrorherrschaft Notstandsbefugnisse, mit Robespierre als führender Figur?", ["Der Wohlfahrtsausschuss", "Das Direktorium", "Die Generalstände", "Die Nationalversammlung"]),
        ("Wie endete die Terrorherrschaft?", ["Robespierre wurde gestürzt und hingerichtet", "Ludwig XVI. kehrte auf den Thron zurück", "Napoleon übernahm die Macht", "Die Generalstände traten wieder zusammen"]),
        ("Napoleon stürzte das Direktorium. Was für eine Tat war das?", ["Ein Staatsstreich: Machtübernahme ausserhalb der üblichen Regeln", "Eine Abstimmung im Nationalkonvent", "Ein Friedensvertrag mit Österreich", "Eine Wahl, die der Dritte Stand gewann"]),
        ("Was war eine bleibende Folge der Revolution?", ["Gleichheit vor dem Gesetz wurde zu einem zentralen Prinzip", "Frauen erhielten gleiche politische Rechte", "Die drei Stände wurden gesetzlich bestätigt", "Europa blieb von revolutionären Ideen unberührt"]),
        ("Welche Abfolge erzählt die Revolution in der richtigen Reihenfolge?", [
            "Ungleichheit und Krise → Revolution → Republik → Terror → Direktorium → Napoleon",
            "Ungleichheit und Krise → Republik → Revolution → Direktorium → Terror → Napoleon",
            "Ungleichheit und Krise → Revolution → Terror → Republik → Direktorium → Napoleon",
            "Ungleichheit und Krise → Revolution → Direktorium → Terror → Republik → Napoleon"]),
    ]),
    "fr": ("quiz-revolution-francaise.zip", "La Révolution française · Révisions d'examen", [
        ("Qui faisait partie du tiers état ?", ["Tous sauf le clergé et la noblesse : bourgeois, travailleurs, paysans", "Seulement les paysans pauvres", "Seulement les riches marchands et avocats", "Les plus proches conseillers du roi"]),
        ("Quelles idées des Lumières contestaient l'ordre ancien ?", ["Liberté, égalité et souveraineté nationale", "Droit divin, tradition et obéissance", "Privilège, rang et héritage", "Pain, impôts et guerre"]),
        ("Aux États généraux, on se disputait sur le vote : par ordre ou par député (une voix chacun). Pourquoi le tiers état voulait-il le vote par député ?", ["Il formait la grande majorité : compter les députés lui donnait un vrai poids", "Le roi le lui avait promis en échange de nouveaux impôts", "Il voulait exclure la noblesse de l'assemblée", "Il voulait que le roi n'ait aucune voix"]),
        ("Qu'ont juré les députés par le serment du Jeu de paume ?", ["De ne pas se séparer avant d'avoir donné une constitution à la France", "De marcher sur Versailles et de ramener le roi à Paris", "D'abolir la monarchie et de fonder une république", "De déclarer la guerre à l'Autriche"]),
        ("Pourquoi se souvient-on de la prise de la Bastille ?", ["Elle est devenue le symbole de la résistance au pouvoir royal", "Elle a mis fin à la monarchie pour de bon", "Elle a aboli les privilèges féodaux", "Elle a créé la République"]),
        ("Qu'affirmait la Déclaration des droits de l'homme et du citoyen ?", ["La liberté, l'égalité devant la loi, la propriété et la souveraineté nationale", "Une république sans roi", "Le pouvoir de l'Église sur l'État", "Le pouvoir absolu du roi"]),
        ("Quel régime la constitution de 1791 a-t-elle créé ?", ["Une monarchie constitutionnelle : un roi aux pouvoirs limités", "Une république sans roi", "Une monarchie absolue sous un autre nom", "Une dictature sous Robespierre"]),
        ("Quelle assemblée a aboli la monarchie et proclamé la République ?", ["La Convention nationale", "Les États généraux", "Le Directoire", "Le Comité de salut public"]),
        ("Pendant la Terreur, qui avait des pouvoirs d'exception, avec Robespierre parmi ses figures majeures ?", ["Le Comité de salut public", "Le Directoire", "Les États généraux", "L'Assemblée nationale"]),
        ("Comment la Terreur a-t-elle pris fin ?", ["Robespierre a été renversé puis exécuté", "Louis XVI est remonté sur le trône", "Napoléon a pris le pouvoir", "Les États généraux se sont de nouveau réunis"]),
        ("Napoléon a renversé le Directoire. De quel acte s'agit-il ?", ["Un coup d'État : une prise du pouvoir hors des règles habituelles", "Un vote de la Convention nationale", "Un traité de paix avec l'Autriche", "Une élection gagnée par le tiers état"]),
        ("Quelle a été une conséquence durable de la Révolution ?", ["L'égalité devant la loi est devenue un principe central", "Les femmes ont obtenu l'égalité des droits politiques", "Les trois ordres ont été confirmés par la loi", "L'Europe est restée à l'écart des idées révolutionnaires"]),
        ("Quelle suite raconte la Révolution dans le bon ordre ?", [
            "Inégalités et crise → Révolution → République → Terreur → Directoire → Napoléon",
            "Inégalités et crise → République → Révolution → Directoire → Terreur → Napoléon",
            "Inégalités et crise → Révolution → Terreur → République → Directoire → Napoléon",
            "Inégalités et crise → Révolution → Directoire → Terreur → République → Napoléon"]),
    ]),
    "it": ("quiz-rivoluzione-francese.zip", "La Rivoluzione francese · Ripasso per l'esame", [
        ("Chi faceva parte del Terzo Stato?", ["Tutti tranne clero e nobiltà: borghesi, lavoratori, contadini", "Solo i contadini poveri", "Solo i ricchi mercanti e avvocati", "I consiglieri più vicini al re"]),
        ("Quali idee dell'Illuminismo misero in discussione l'ordine esistente?", ["Libertà, uguaglianza e sovranità nazionale", "Diritto divino, tradizione e obbedienza", "Privilegio, rango ed eredità", "Pane, tasse e guerra"]),
        ("Agli Stati generali si discuteva su come votare: per ordine o per testa (un voto per deputato). Perché il Terzo Stato voleva il voto per testa?", ["Era la grande maggioranza, quindi contare le teste gli dava un peso reale", "Il re gliel'aveva promesso in cambio di nuove tasse", "Voleva cacciare la nobiltà dall'assemblea", "Voleva che il re non avesse alcun voto"]),
        ("Che cosa giurarono i deputati con il Giuramento della Pallacorda?", ["Di non separarsi prima di aver dato una costituzione alla Francia", "Di marciare su Versailles e portare il re a Parigi", "Di abolire la monarchia e fondare una repubblica", "Di dichiarare guerra all'Austria"]),
        ("Perché si ricorda la presa della Bastiglia?", ["Divenne il simbolo della resistenza al potere regio", "Mise fine per sempre alla monarchia", "Abolì i privilegi feudali", "Creò la Repubblica"]),
        ("Che cosa affermava la Dichiarazione dei diritti dell'uomo e del cittadino?", ["Libertà, uguaglianza davanti alla legge, proprietà e sovranità nazionale", "Una repubblica senza re", "Il dominio della Chiesa sullo Stato", "Il potere assoluto del re"]),
        ("Che tipo di Stato creò la costituzione del 1791?", ["Una monarchia costituzionale: un re con poteri limitati", "Una repubblica senza re", "Una monarchia assoluta con un altro nome", "Una dittatura sotto Robespierre"]),
        ("Quale assemblea abolì la monarchia e proclamò la Repubblica?", ["La Convenzione nazionale", "Gli Stati generali", "Il Direttorio", "Il Comitato di salute pubblica"]),
        ("Durante il Terrore, chi aveva poteri d'emergenza, con Robespierre tra le figure principali?", ["Il Comitato di salute pubblica", "Il Direttorio", "Gli Stati generali", "L'Assemblea nazionale"]),
        ("Come finì il Terrore?", ["Robespierre fu rovesciato e giustiziato", "Luigi XVI tornò sul trono", "Napoleone prese il potere", "Gli Stati generali si riunirono di nuovo"]),
        ("Napoleone rovesciò il Direttorio. Che tipo di atto fu?", ["Un colpo di Stato: la presa del potere fuori dalle regole", "Un voto della Convenzione nazionale", "Un trattato di pace con l'Austria", "Un'elezione vinta dal Terzo Stato"]),
        ("Quale fu una conseguenza duratura della Rivoluzione?", ["L'uguaglianza davanti alla legge divenne un principio fondamentale", "Le donne ottennero la parità dei diritti politici", "I tre ordini furono confermati per legge", "L'Europa rimase estranea alle idee rivoluzionarie"]),
        ("Quale sequenza racconta la Rivoluzione nell'ordine giusto?", [
            "Disuguaglianza e crisi → Rivoluzione → Repubblica → Terrore → Direttorio → Napoleone",
            "Disuguaglianza e crisi → Repubblica → Rivoluzione → Direttorio → Terrore → Napoleone",
            "Disuguaglianza e crisi → Rivoluzione → Terrore → Repubblica → Direttorio → Napoleone",
            "Disuguaglianza e crisi → Rivoluzione → Direttorio → Terrore → Repubblica → Napoleone"]),
    ]),
}


def french_spaces(s: str) -> str:
    """A no-break space before ? ! : ; so a line doesn't start with the mark (as space_zips.py)."""
    return re.sub(r" ([?!:;»])", " \\1", s).replace("« ", "« ")


def translate(text: str, title: str, questions: list, lang: str) -> str:
    """The English quiz.txt with each line swapped for its translation, its marks (+ -) and numbers kept."""
    if lang == "fr":
        questions = [(french_spaces(q), [french_spaces(c) for c in cs]) for q, cs in questions]
    out, qi, ci = [], -1, 0
    for line in text.split("\n"):
        m = re.match(r"(\d+)\. ", line)
        if line.startswith("Title: "):
            out.append("Title: " + title)
        elif m:
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
    info = src.getinfo("quiz.txt")
    text = src.read(info).decode("utf-8")
for lang, (name, title, questions) in LANGS.items():
    out = zipfile.ZipInfo("quiz.txt", date_time=info.date_time)
    out.compress_type = zipfile.ZIP_DEFLATED
    with zipfile.ZipFile(EX / name, "w") as z:
        z.writestr(out, translate(text, title, questions, lang).encode("utf-8"))
    print(EX / name)
