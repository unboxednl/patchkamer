# Changelog

*English version: [CHANGELOG.md](CHANGELOG.md)*

Alle belangrijke wijzigingen in Patchkamer (de host en de desktop-app) per versie. Het versienummer staat in `patchkamer/version.json` en onder **Instellingen > Versie**. Oudere geschiedenis staat in het git-log.

## 0.30.17 (2026-11-11)

### Toegevoegd
- **Clip Arranger (1.31.0): een uitgerekte clip volgt de secties van de song.** Een clip van 16 maten die je over twee scènes hebt uitgerekt, speelt in songmodus sectie 1 en daarna sectie 2, ook als die tweede sectie niet de scène direct eronder gebruikt, zolang de sectie op dat spoor geen eigen clip heeft. De clip gaat verder waar de vorige sectie ophield, dus de lengte van de secties bepaalt hoeveel maten elke sectie speelt. Andere sporen spelen gewoon hun eigen clips per sectie. Voorheen speelde zo'n clip na de eerste sectie niet door. De songbalk toont het vervolg.
- **Undo en Redo per deel.** In de songbalk, bij de clipmatrix en in de clip-editor staan eigen Undo- en Redo-knoppen; ze maken alleen de laatste wijziging in dat deel ongedaan, wijzigingen in andere delen blijven staan. Ctrl+Z en Ctrl+Shift+Z werken voor het deel waar je het laatst klikte. De Undo en Redo bovenin blijven alles in volgorde terugdraaien.
- **Een clip hergebruiken.** Rechtermuisknop op een clip: Hergebruik in volgende lege scène of in alle lege scènes (of Alt + slepen naar een ander slot van hetzelfde spoor). Het slot is een koppeling, geen kopie: een wijziging in de clip klinkt in elke scène die hem hergebruikt. Maak eigen kopie maakt het weer los.
- **De × bij een scène verwijdert geen clips meer.** Hij haalt de scène alleen uit de secties van de songs; de rij met haar clips blijft staan. **Verwijder lege scènes** ruimt echt op.

## 0.30.16