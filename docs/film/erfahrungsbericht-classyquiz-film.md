# Erfahrungsbericht: classyQuiz-Film (Animatic, 60 s, wortlos)

Gebaut 2026-11-06. Artifact: https://claude.ai/artifact/CjQKrFm4cshsVZp7Kpk1Nv
Quellen: `/home/claude/film/` (film.js, film.css, build.py, shoot.py), Storyboard `storyboard-classyquiz.md`, Bildschirmtexte `film-text.md`.

Was hier steht, ist beim Bauen beobachtet. Beim ersten Stand waren die Projekt-Dokumente für den bauenden Subagenten nicht lesbar (kein Projects-Tool); für die zweite Runde lagen die beiden Grundsätze-Dateien auf der Platte. puppenfilm.html und die früheren Erfahrungsberichte hat der Subagent nie gesehen; ob der Stil passt, ist nicht geprüft.

## Aufbau, der getragen hat

- **Ganzer Zustand als Funktion der Filmzeit.** `render(t)` setzt alles; Poster, Kapitel-Sprung, Pause, Scrubben und Abspielen sind derselbe Codepfad. Keine Timer, keine Ketten. `window.cqFilm.render(t)` macht jeden Moment direkt prüfbar.
- **Statisches SVG einmal per `innerHTML`-Vorlage, danach nur Attribute ändern, und nur wenn sich der Wert ändert** (Cache am Element). Desktop-Chromium: 0.4 bis 3.6 ms pro Frame (Skript plus Layout, ohne Malen), Wiedergabe 60 fps. Auf einem Telefon nicht gemessen.
- **Eine Welt mit Kamera** (translate/scale auf eine Gruppe, Zoom logarithmisch interpoliert) für Tisch, Laptop und Raum; **bildschirmgrosse Ebenen** für das, was man lesen muss (Chat, Website auf dem Telefon, Über-die-Schulter). Übergang: ein Clip-Rechteck wächst vom Telefonbildschirm (über die Welt-zu-Bild-Abbildung der Kamera berechnet) aufs ganze Bild, der Inhalt skaliert mit. Konvention "Telefonbildschirm füllt das Bild" einmal eingeführt (Chat), dann auch für die Website beibehalten; liest sich.
- **Bildschirme als eigene Bauteile** (Wand 960 × 540, Tablet 400 × 640, Laptop 960 × 600), mehrfach instanziert (Wand im Raum, im Laptop, hinter der Schulter). Alle lesen denselben Zustand aus `t`, deshalb stimmen sie in jedem Schnitt überein.
- **Text messen statt schätzen:** verstecktes `<text>` im selben SVG, `getComputedTextLength`. Rubik wird erst geladen, wenn sie gebraucht wird: vor dem Messen `document.fonts.load('700 40px Rubik')` abwarten. Umbruch nur an Leerzeichen, jedes Stück behält seinen Index im ganzen Satz; daraus Tippen (erste n Zeichen), Cursorposition und mitwachsende Unterstreichung.
- **Figuren von hinten** sparen Gesichter. Kopfdrehen: Haare seitlich verschieben, dadurch zeigt sich ein Hautstreifen, dazu ein Nasenbuckel. Liest sich auch in der Raumtotale.
- **Ein Motiv für jeden Druck der Lehrperson:** Zoom-Blase des Telefons unten links mit dem echten Knopf (Let the class in ▶, Start quiz ▶, Choices ▶, Answers ▶, Solution ▶, Final ranking ▶), Daumen, Ring, Schwanz zum Telefon in der Hand (nur wenn das Telefon im Bild ist). Die Änderung an der Wand kommt 0.25 s danach.
- **Über-die-Schulter schon im Lesezustand beginnen** (Tablet zeigt das Auge): dann sieht man im selben Bild, wie auf "Choices" die Kacheln an der Wand Text bekommen und das Tablet vom Auge zu den vier Knöpfen wechselt. Ursache und Wirkung in einem Bild.

## Was nur Rendern und Anschauen fand (Code sah jedes Mal richtig aus)

1. Tischeinstellung: Kamera schnitt den Kopf ab, die Lehrerin füllte das Bild, Blätter kaum sichtbar.
2. Die Hand am Telefon (Hautkreis) lag beim Hineinzoomen über dem unteren Drittel des Telefonbildschirms. Hand hinter das Telefon gelegt.
3. Der Arm zur Laptoptastatur lag vor dem Laptopbildschirm (wir schauen von hinten; der Arm ist zwischen uns und dem Bildschirm). Arm unten herum geführt.
4. Blitz als grosses Rechteck in Weltkoordinaten: bei Zoom 2 deckte er das ganze Bild, und er lag über der Lehrerin. Jetzt kleiner Kreis auf den Blättern, hinter der Figur.
5. Stimmenverteilung zeigte 13 / 6 / 1 / 0 statt 12 / 6 / 2 / 0: das Kind für die Schulteraufnahme wurde nach der Antwortliste auf "richtig" gesetzt. Sichtbar nur an der gerenderten Wand.
6. Die Vorschaukarte im Chat wurde vom Eingabefeld halb verdeckt (Scrollziel mit falscher Unterkante).
7. Kameraschwenk Telefon → Laptop bei hohem Zoom fuhr über den Rücken: 0.3 s nur blaue Fläche. Gefunden erst mit Bildern im 0.15-s-Abstand. Zwischenschlüssel mit weniger Zoom.
8. Der grosse Play-Knopf auf dem Posterbild lag genau auf der roten Kachel, also auf der Stimmenverteilung, die das Poster zeigen soll. Nach unten links verschoben.
9. Zoom-Blase erschien, während die Kamera noch fuhr.

Vorgehen, das diese Fehler fand: `shoot.py` (Playwright, Chromium) rendert beliebige Zeiten als Standbilder der Bühne, Desktop 1300 px und Telefon 390 px bei DPR 3, und baut ein Kontaktblatt. Ganzer Film alle 0.5 s, dann Übergänge alle 0.1 bis 0.2 s. Telefonbilder auf CSS-Pixel (358 px Bühnenbreite) verkleinert anschauen, nicht in Gerätepixeln.

## Masse für die Lesbarkeit (Bühne 1600 × 900, auf dem Telefon 358 px breit)

- Faktor 0.224: Schrift 46 Einheiten ≈ 10 CSS-px, auf 358 px lesbar (die getippte Bitte). 36 bis 40 Einheiten ist die Untergrenze für etwas, das gelesen werden muss.
- Codes (Lehrercode 63953 47) zweimal zeigen: nach dem Upload mit 1.9-fachem Zoom und Puls, dann beim Tippen auf dem Laptop mit der Kamera so nah, dass der Laptopbildschirm das Bild füllt.
- Stimmenzahlen an der Wand sind in der Raumtotale bei 358 px knapp lesbar; Kamera beim Halt leicht hineinfahren (1.1).
- Sprechblasen der Kinder 1.35-fach, sonst auf dem Telefon nur Punkte.

## Portierbarkeit auf die Website

- Die CSP der Seite (`src/scripts/build.mjs`, als Header in `dist/_headers`): `script-src 'self'`, `img-src 'self' blob:`, Schriften fallen auf `default-src 'self'`. **Keine data:-Bilder und -Schriften, kein Inline-Skript.** Alle Assets stehen deshalb in einem Objekt (`ASSETS`); `sitebuild.py` füllt es für die Seite mit `/landing/sheet-*.webp` und den Marken-SVGs als Text, die Schrift kommt aus site.css. Der Teil der Seite (▶ lädt film.js) muss im eigenen Skript der Seite stehen: `client/film-poster.ts`, von home.ts importiert.
- SVG-Präsentationsattribute statt `style=`.
- Avatare: `client/look.ts` wird von `build.py` gelesen und von Typen befreit, nicht abgeschrieben.
- Alle Wörter des Films stehen in `TEXT` in film.js, keines im HTML der Seite. Die Kapitel auf der Seite sind die Bildunterschriften des Streifens (`data-t`, von home.ts übersetzt); ihre Zeiten stehen nur in film.js (`TX.chapters`, Schlüssel = `data-t`).
## Inhaltliche Fakten, die beim Bauen auffielen

- Die echte Frage (646 000) ist Frage 1 von 13 mit `Order: fixed`; die richtige Antwort ist deshalb die erste: rot ▲. Das Storyboard nahm blau ◆ (vom alten Bild 72 650).
- Die Vorschaukarte der KI hat andere Farben und Formen als die Seite (die KI schreibt selbst "approximations"). Im Film so belassen; ob das den Reim Chat → Wand stört, ist offen.
- Nach Frage 1 stünden zwölf Kinder gleichauf mit ★ 1; deshalb Schlussrangliste nach einem kurzen Durchlauf 1 / 13 → 13 / 13.
- Die Wand zeigt nach "Show the quiz here" und vor "Let the class in" den Satz "The class is let in in a moment." (screen.ts, renderLobby, waiting).

## Zweite Runde: Rückmeldungen des Besitzers zum ersten Stand, und was sie zeigten

Er hat den ersten Stand auf dem Telefon und am Desktop angeschaut. Seine Punkte, und was dahinter lag:

- **Die Finger kamen alle etwas zu schnell, ausser dem des Kindes.** Der Daumen kam in 0.4 s über rund 760 Einheiten (gut 1900 Einheiten/s), der Finger des Kindes in 0.5 s über 590 (knapp 1200). Jetzt: 0.6 s herein, 0.15 s halten, 0.55 s hinaus, kürzerer Weg (unter 1000 Einheiten/s). Zwei Tipper, die weniger als 1.4 s auseinanderliegen, gehen direkt vom einen zum anderen, ohne hinauszufahren. Vorher sprang der Daumen, weil das Zeitfenster des zweiten Tippers das des ersten überlappte.
- **Die Textkästen waren rechts zu breit, der Text lief über den Hintergrund.** Hier gab es drei Ursachen:
  1. SVG schluckt Leerzeichen am Ende eines `<text>`. Das Messelement mass "Read " ohne Leerzeichen. Die Unterstreichung begann deshalb eine Leerschlag-Breite zu früh, und "Class code" klebte an der Zahl. Behoben mit `xml:space="preserve"` auf dem Messelement und auf den gezeichneten Zeilen.
  2. Der Umbruch im Eingabefeld rechnete mit der ganzen Feldbreite, der Senden-Knopf lag aber im Text.
  3. Feste Texte in festen Kästen hängen an der Schrift des Geräts (system-ui): hier ist es Inter, auf dem Telefon des Besitzers vermutlich eine breitere. Jetzt hat jeder solche Text seine Kastenbreite (`data-fit`) und wird nach dem Aufbau gemessen und, wenn nötig, um seinen Ankerpunkt verkleinert. Zum Prüfen mit erzwungener breiter Schrift rendern (DejaVu Sans per eingeschleustem CSS); damit fand sich auch der überlaufende Knopf "Let the class in ▶" in der Zoom-Blase.
- **Die Hände der Kinder (runde Punkte) sassen auf den Schultern.** Entfernt, ebenso die Hände beim Achselzucken. Achselzucken jetzt nur über den Kopf, der in die Schultern sinkt.
- **Das Zittern vor der Schlussrangliste wirkte falsch.** Die Kacheln blinkten mit 20 Hz, und die Platzhalter wechselten bei jeder Frage ihre Breite. Jetzt steht alles still, nur der Zähler läuft mit Ein- und Ausfedern von 1 / 13 auf 13 / 13. Die Kamera fährt vorher langsamer auf die Wand.
- **Die Haltung der Lehrperson war unnatürlich.** Neu gibt es zwei Zustände (seit der dritten Runde ist sie im Raum nur noch von der Seite zu sehen: die Rückenansicht am Pult und die Drehung gibt es nicht mehr, den Gang schon):
  - von hinten am Pult, bis "Let the class in";
  - von der Seite vor der Klasse, mit Blick zur Leinwand.
  Dazwischen dreht sie sich um und geht. Die Drehung staucht die Rückenansicht auf 35 % Breite und zieht die Seitenansicht von 35 % auf (Grundsätze: Profil nie schmaler als 35 %). Der Gang läuft während der Kamerafahrt, die Schrittphase kommt aus der zurückgelegten Strecke, die Beine pendeln gegengleich. Die Zeichenreihenfolge folgt der Pose: Der ferne Arm (hält das Telefon) liegt hinter dem Körper, der nahe Arm vor allem. Beide Arme laufen über 2-Bone-IK, der Ellbogen liegt unter der Linie von Schulter zu Hand. Zeigen: nahe Hand auf 97 % Reichweite Richtung Pfeil, Kopf 9° hoch.
  - **Bekannter Konflikt:** Jeder gestreckte Zeigearm von links unten zum Pfeil liegt über der linken unteren Kachel (gelb, 2 Stimmen).
- **Der Anfang nach der Skizze des Besitzers:** Die Kamera schaut über den Hinterkopf aufs Pult. Der Hinterkopf ist gross und unten in der Mitte angeschnitten, die Pultkanten liegen auf einem Drittel und auf der Hälfte, die Tasse steht links, die Blätter liegen gefächert, das Telefon ist mittig über den Blättern, der Arm kommt von links unten, der Daumen liegt am Telefon. Das ist eine eigene Ebene mit eigener Kamera; das Hineinfahren ins Telefon ist eine Gerade. Der Laptop steht rechts auf demselben Pult ausserhalb des ersten Bildes, die Kamera schwenkt hin.
  - **Übergang in den Raum:** ein Schnitt in dem Moment, in dem der Laptopbildschirm in beiden Ansichten bildfüllend gleich gross und gleich zentriert ist (Bildbreite 1484 Einheiten). Der Schnitt ist unsichtbar, danach zieht die Raumkamera auf.
  - Erst gerendert sah man: Das Telefon, das von unten hochkommt, lag über dem Kopf. Von dieser Kamera aus ist der Kopf das Nächste, das Telefon liegt dahinter. Kopf zuletzt zeichnen, dann kommt das Telefon hinter dem Kopf hervor.
- **Ein Fehler, den nur die Seite fand:** Eine lokale Variable `ph` (Schrittphase) verdeckte das Element `ph` (Telefon). Die Seite blieb leer, `node --check` meldete nichts. Gefunden über `pageerror` in Playwright.
- **Bewegung prüfen:** Drehung und Gang, Daumenwege und Übergänge mit Bildern im 0.1-s-Abstand (10 Bilder/s) als Kontaktblatt angeschaut. Das zeigte auch, dass die Pultaufnahme bei "Let the class in" den Kopf anschnitt.

## Dritte Runde: Rückmeldungen des Besitzers zum zweiten Stand, und die Fassung für die Seite

Seine Punkte, und was dahinter lag:

- **Der Finger in der ersten Szene sass falsch: daumengross, aber an der Stelle eines Mittelfingers.** Der Daumen hing an der unteren linken Ecke des Telefons und zeigte von unten in die Mitte des Bildschirms. Jetzt hält die linke Hand das Telefon von unten: Handfläche dahinter, drei Fingerspitzen am rechten Rand, der Daumen kommt vom linken Rand quer zum Auslöser und drückt bei jedem Foto (5° Drehung). Hand und Daumen sind in Telefon-Einheiten gezeichnet, mit derselben Transformation wie das Telefon, deshalb stimmen sie beim Hochheben und Hineinfahren.
- **"Let the class in" darf schon die Seitenansicht haben, das Telefon etwas nach rechts gehalten, damit man es sieht.** Vorher lag die nahe Hand die ganze Zeit auf dem Telefon (12 × 42, von der Kante gesehen) und deckte es. Jetzt:
  - Seitenansicht ab dem Schnitt durch den Laptop. Die Rückenansicht im Raum und die Drehung gibt es nicht mehr; der Schnitt (Laptopbildschirm bildfüllend) verdeckt den Wechsel.
  - Das Telefon (26 × 50, Bildschirm zum Zuschauer gedreht, mit dem dunklen Knopf) hält die ferne Hand vor der Brust, ausserhalb der Körperkontur. Gezeichnet nach dem Körper, vor dem nahen Arm.
  - Die nahe Hand liegt darunter und geht nur zum Drücken hinauf.
  - Kamera beim Druck: [431, 537, 2.3]. Den Zoom begrenzt der Scheitel; bei 2.8 war der Kopf angeschnitten. So sind Telefon, Laptop und die untere Ecke der Leinwand im Bild, und man sieht im selben Bild, wie Laptop und Leinwand auf den Druck antworten.
  - Der Schwanz der Zoom-Blase beginnt jetzt am Teil der Oberkante, der dem Telefon am nächsten ist. Ein Telefon rechts neben der Blase auf gleicher Höhe ergab sonst einen flachen Keil quer über die Figur.
  - Erst gerendert sah man: Die Blase sprang bei 26.4 s auf, während die Kamera noch fuhr (Punkt 9 von oben, wieder). Der Druck kommt jetzt bei 27.4 statt 27.1. Halt bis 28.1, Gang 28.2 bis 29.3, Kapitel "What the class sees" bei 27.7.
- **Ab dieser Szene müssen Tasse und Blätter nicht mehr im Bild sein.** Die Raumtotale ist jetzt [850, 455, 1.06], der Halt bei der Stimmenverteilung [840, 425, 1.15] (vorher [800, 450, 1] und [770, 430, 1.1]). Die Grenze ist die Höhe (Leinwandoberkante bei y 62, Kinder bis 900), deshalb gewinnt die Wand nur etwa 6 %. Weiter nach rechts ([880, 455, 1.07]) legt die Zoom-Blase bei jedem Druck über die Beine der Lehrerin; die rechte Blasenkante liegt bei x 446 im Bild.
- **Der grosse ▶ deckte auf dem Telefon im Posterbild Lehrerin und Laptop** (76 px auf 358 px Bühne). Jetzt wächst er mit der Bühne mit: `clamp(52px, 13%, 76px)`, im Artifact und auf der Seite gleich.

**Die Fassung für die Seite** (`film/site/`, gebaut von `sitebuild.py`, geprüft von `sitecheck.py`):

- Bis zum ersten Druck steht im HTML nur das Posterbild als WebP, aus dem Film gerendert (1600 × 900, Qualität 82: 65 KB; 800 breit: 30 KB; die vier Bilder des Streifens wiegen 72 KB). Dazu kommen ▶, eine leere Leiste und die Kapitel. Chromium nahm am Desktop (735 px Bühne, DPR 1) die 800er und auf dem Telefon (DPR 3) die 1600er.
- Der erste Druck lud film.js und die beiden Blätter. Rubik war schon da, weil das Codefeld der Startseite sie braucht.
- Posterbild gegen das live gemalte Posterbild: Der einzige echte Unterschied war ▶, der beim Abspielen verschwindet. Mit verstecktem ▶ beträgt der mittlere Unterschied 3.7 (Desktop) bzw. 3.0 (Telefon) von 255, nur an Kanten (Umrechnen).
- Das Bild muss absolut über dem SVG liegen. Das SVG wird zuerst eingefügt, und im Fluss hätte es das Bild aus der Bühne geschoben, falls zwischendurch gemalt würde.
- Die Seiten-CSP stoppt Playwrights `wait_for_function` (wertet eine Zeichenkette aus, kein `unsafe-eval`). `evaluate` und `add_init_script` gehen; deshalb wird in Python abgefragt.
- **Ein Fehler, den nur das Bild der ganzen Seite fand:** Beim Ersetzen des Streifen-CSS fielen auch die Regeln für Build, Run, Bitte und Upload-Feld weg. Alle Prüfungen am Film waren grün. `sitecheck.py` vergleicht deshalb die berechneten Stile aller 155 Elemente unter dem Film mit der ungepatchten Seite. Ein Bildvergleich taugte dafür nicht: Die Seite zeigt ihre eigene Adresse (also den Port), und der Block darunter beginnt auf einer anderen Teilpixel-Höhe.
- Ein veraltetes site/film.js (vor der letzten Änderung an film.js gebaut) liess den Kapiteltest scheitern. Nach jeder Änderung an film.js beide bauen: `build.py`, dann `sitebuild.py`.

## Nicht geprüft

- Das Artifact im claude.ai-Rahmen und auf einem echten Telefon (Safari/iOS, Android); nur headless Chromium.
- Bewegung in Echtzeit angeschaut: nein, nur Standbilder in dichten Abständen (bis 10 Bilder/s). Die neue Daumen- und Telefonhaltung hat noch niemand in Bewegung gesehen.
- Die Textanpassung auf der Schrift des Besitzer-Telefons: nur mit einer breiteren Ersatzschrift simuliert. Das Posterbild trägt die Systemschrift der Maschine, auf der es gerendert wurde; auf einem Gerät mit anderer system-ui weicht der Text des live gemalten Posterbilds davon ab. Ob die Zeiten (z. B. 1.3 s Halt nach der Bitte, gut 1 s für die Vorschaukarte, 6 s Stimmenverteilung) beim Zuschauen reichen, weiss man erst nach dem Anschauen.
- Die Seitenfassung: nicht auf Cloudflare Pages (nur `dist/` mit den Headern aus `_headers` lokal ausgeliefert), nicht im Dunkelmodus der Startseite, nicht mit Bildschirmleser.
- Der Fünf-Sekunden-Test mit Lehrpersonen.
