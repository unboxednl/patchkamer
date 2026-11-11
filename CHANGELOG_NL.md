# Changelog

*English version: [CHANGELOG.md](CHANGELOG.md)*

Alle belangrijke wijzigingen in Patchkamer (de host en de desktop-app) per versie. Het versienummer staat in `patchkamer/version.json` en onder **Instellingen > Versie**. Oudere geschiedenis staat in het git-log.

## 0.30.25 (2026-11-11)

### Hersteld
- **Pulse Drums (1.20.1): elke slag klinkt gelijk, ook bij 135 BPM.** Bij een tempo waarop een tel niet in een heel aantal renderblokken van 128 samples past (135 BPM: 166,67 blokken), tikte elke derde bassdrum harder dan de andere twee, omdat de ruis van de klik anders klinkt als de start midden in een blok valt. De start van elke slag wordt nu naar boven afgerond op een blokgrens (hooguit 2,7 ms later, nooit eerder dan gepland). Gemeten in een echte browser met de tune Squelch: de scherpste sprong per slag was 0,31, 0,19 en 0,13 voor de drie plekken en is nu 0,27 voor alle drie. Niet beluisterd. Drum Kit, Click Synth, Latin Percussion en Drum Machine gebruiken dezelfde opbouw en zijn niet aangepast.

## 0.30.24 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.37.1):** minder ruimte tussen de poortenrij en de regel met Project, en de verticale lijn in de kleur van de sectie staat verder naar links, los van de afspeelknoppen van de scènes.

## 0.30.23 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.37.0): kleuren met een kleurkiezer.** Spoor, scène en sectie krijgen een kleur via een kleurkiezer in plaats van een lijst met nummers (het potlood bij het spoor en bij de scène; Kleur in de sectie-instellingen). Klik op de naam van een scène om hem te hernoemen. Kies je een sectie, dan staat links en rechts van haar scènes een verticale lijn in de kleur van de sectie. De vakjes met clipnummers in de sectieblokken zijn weg.

## 0.30.22 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.36.0): meer scènes in één sectie.** Bij Scènes in de sectie-instellingen voeg je met + scène scènes toe (en wissel je de volgorde); ze spelen na elkaar, elk Maten lang, en de reeks herhaalt Herhalingen keer. Een clip die over twee scènes is uitgerekt, speelt zo door de hele sectie. Songs en presets zonder dit veld klinken gelijk.
- **De rij Sectie onder de tracks is weg** en de clipknoppen in 01 zijn weg (ze staan in 02; Knip clip is erbij gekomen). De kop van 02 toont nu TRACK / SCÈNE / CLIP van de gekozen clip. In plaats van het vierkantje wordt + nu overal als gewone + getoond.

## 0.30.21 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.35.0): sectie 02 (Track) zit nu in de spoorkop.** Klik op de naam of het label van een spoor om het aan te passen, het tracktype is een keuzelijst in de kop, en kleur, transponeren, gate, swing, velocity en Track auditeren (bij drums ook protocol, swing rij en de drumrijen) staan onder het potlood. Live opname → deze clip staat nu in de clip-editor, die sectie 02 is geworden.

## 0.30.20 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.34.0): een clip aan een scène toekennen met een keuzelijst.** Elke cel in de matrix heeft een keuzelijst (▾; een lege cel toont kies clip ▾) met de clips van de bibliotheek, geen clip, of een nieuwe clip. Dezelfde clip mag in zoveel scènes als je wilt. Een lege cel maakt niet meer vanzelf een clip aan.

## 0.30.19 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.33.0): de clips zijn echt een bibliotheek per spoor, los van de scènes.** In 03 blijven de clips in een vaste volgorde met vaste nummers staan; een scène is alleen een rij die per spoor naar een clip wijst. Een scène verwijderen, toevoegen, dupliceren of verplaatsen verandert de bibliotheek niet meer (in 0.30.18 schoven de clips daarbij naar achteren). Een lege cel toont + (klik maakt een nieuwe clip). Haal uit scène laat de clip in 03 staan, Verwijder clip helemaal gooit hem weg. Dezelfde clip kan in meer scènes staan (verwijzing, ↻); een clip uit de clipbalk naar een cel slepen zet hem erin. Oude songs en presets (ook de 58 meegeleverde) klinken en laden gelijk.

## 0.30.18 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.32.0): de clips zijn een bibliotheek per spoor, los van de scènes.** Een clip uit een scène halen (rechtermuisknop of Delete: Haal uit scène) laat hem in de clipbalk (03) staan; Verwijder clip helemaal gooit hem echt weg. De × bij een scène verwijdert de rij weer echt (niet meer grijs) en haar clips blijven in de bibliotheek. Een nieuwe scène (+) heeft lege cellen; zet er een clip in via Hergebruik clip of door hem uit de clipbalk naar de cel te slepen. De bibliotheek begint met 8 clips en groeit tot 48. Oude songs en presets klinken gelijk. Dit herstelt de × van 0.30.17, die een scène alleen grijs maakte.

## 0.30.17 (2026-11-11)

### Toegevoegd
- **Clip Arranger (1.31.0): een uitgerekte clip volgt de secties van de song.** Een clip van 16 maten die je over twee scènes hebt uitgerekt, speelt in songmodus sectie 1 en daarna sectie 2, ook als die tweede sectie niet de scène direct eronder gebruikt, zolang de sectie op dat spoor geen eigen clip heeft. De clip gaat verder waar de vorige sectie ophield, dus de lengte van de secties bepaalt hoeveel maten elke sectie speelt. Andere sporen spelen gewoon hun eigen clips per sectie. Voorheen speelde zo'n clip na de eerste sectie niet door. De songbalk toont het vervolg.
- **Undo en Redo per deel.** In de songbalk, bij de clipmatrix en in de clip-editor staan eigen Undo- en Redo-knoppen; ze maken alleen de laatste wijziging in dat deel ongedaan, wijzigingen in andere delen blijven staan. Ctrl+Z en Ctrl+Shift+Z werken voor het deel waar je het laatst klikte. De Undo en Redo bovenin blijven alles in volgorde terugdraaien.
- **Een clip hergebruiken.** Rechtermuisknop op een clip: Hergebruik in volgende lege scène of in alle lege scènes (of Alt + slepen naar een ander slot van hetzelfde spoor). Het slot is een koppeling, geen kopie: een wijziging in de clip klinkt in elke scène die hem hergebruikt. Maak eigen kopie maakt het weer los.
- **De × bij een scène verwijdert geen clips meer.** Hij haalt de scène alleen uit de secties van de songs; de rij met haar clips blijft staan. **Verwijder lege scènes** ruimt echt op.

## 0.30.16