# Sequencers: gebruikershandleiding

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Een sequencer speelt noten voor andere apparaten. Hij maakt **zelf geen geluid**: hij stuurt noten over een kabel, en een synth maakt er geluid van. Deze pagina behandelt de sequencer die met Patchkamer meekomt: **Chord Sequencer**. De basis (Patchkamer openen, een bibliotheek laden, kabels trekken) staat in de [basishandleiding](../USER-MANUAL_NL.md). De map met de apparaten is beschreven in [devices/sequencers](../../devices/sequencers/README_NL.md).

## Inhoud

1. [Een sequencer gebruiken](#een-sequencer-gebruiken)
2. [Welk apparaat voor welk doel](#welk-apparaat-voor-welk-doel)
3. [Chord Sequencer](#chord-sequencer)
4. [Als het niet werkt](#als-het-niet-werkt)

## Een sequencer gebruiken

1. Plaats de sequencer en een synth. Trek een kabel van een **eventuitgang** van de sequencer naar de ingang **Notes** van de synth (bij sommige synths heet de ingang **Keyboard / noten**).
2. Sluit de audio-uitgang van de synth aan op je speakers of op een mixer.
3. Druk op Start (de klok van de studio). Een sequencer speelt alleen zolang de klok loopt en volgt het tempo ervan.

Eventkabels dragen noten, geen geluid. Een sequencer staat dus aan het begin van de keten, vóór de synths. Meerdere synths kunnen tegelijk van één sequencer spelen, elk vanaf een eigen uitgang.

Een sequencer heeft **presets**, geen tunes: een preset is de instelling van een apparaat zonder eigen geluid. Zie [Presets: gebruikershandleiding](../presets/USER-MANUAL_NL.md).

## Welk apparaat voor welk doel

| Ik wil… | Gebruik |
|---|---|
| akkoorden, een baslijn, een puls en een melodie samen vanaf één plek laten spelen, op vier synths | [Chord Sequencer](#chord-sequencer) |

## Chord Sequencer

### Waar het voor dient

Chord Sequencer speelt tot vier partijen tegelijk, elk op een eigen **spoor** (A tot D): bijvoorbeeld akkoorden, een bas, een puls en bellen. Elk spoor heeft een eigen grondtoon, akkoordsoort, patroonlengte en nootlengte, en een eigen kabel naar een eigen synth. Je kunt vier verschillende arrangementen bewaren als **scènes** en er op de maat tussen wisselen, zodat een song van een hoofdpart naar een breakdown kan gaan en terug.

![De kaart van Chord Sequencer](../images/nl/sequencers/chord-sequencer.png)

### De regelaars

**Bovenste rij**

- **Scène 1** … **Scène 4**: kies de actieve scène. De gemarkeerde knop is de scène die nu speelt. Terwijl de klok loopt, begint een nieuwe scène op de volgende maat (zie **Scènewissel**); de regel onder de regelaars zegt dan "Scène 2 op de volgende maat".
- **Scènewissel**: **Volgende maat** (de nieuwe scène begint op de volgende maat) of **Direct** (de klinkende noten worden afgekapt en de nieuwe scène begint meteen).
- **Kopieer scène naar volgende**: kopieert de huidige scène (alle vier de sporen) naar de volgende scène. Scène 4 kopieert naar scène 1. Handig om een variatie te maken.
- **Alles uit**: stopt alle klinkende noten op de vier uitgangen.

**Bewerk spoor**

- **Bewerk spoor**: kies welk spoor de regelaars hieronder tonen en veranderen (A, B, C of D, met zijn naam). De andere sporen blijven spelen.

**Instellingen van het spoor** (bewaard per scène, dus elke scène kan andere sporen hebben)

| Regelaar | Wat hij doet |
|---|---|
| **Spoornaam** | Een naam voor het spoor. Laat je hem staan, dan blijft de standaardnaam (Akkoorden, Bas, Puls, Bellen voor A tot D). Hoogstens 40 tekens. |
| **Actief** | **Aan** of **Uit**. Een spoor dat uit staat speelt niets. Standaard staan A en B aan, C en D uit. |
| **Spel** | **Volledig akkoord**: alle noten van het akkoord tegelijk. **Arpeggio**: de noten om de beurt, bij elke stap die speelt de volgende noot. **Alleen grondtoon**: alleen de grondtoon. |
| **Akkoord** | De akkoordsoort: `major`, `minor`, `sus`, `minor7`, `fifth` (grondtoon en kwint) of `single` (alleen de grondtoon). Deze woorden zijn in beide talen Engels. |
| **Nootdeling** | Hoe vaak het spoor speelt: **1/16**, **1/8**, **1/4** of **1/2**. Tegelijk de lengte van een stap. |
| **Grondtoon MIDI** | De grondtoon als MIDI-nootnummer, 24 tot 96. 60 is C4. Standaard: 48, 36, 60 en 72 voor A tot D. |
| **Omkeerligging** | 0 tot 3. Elke stap tilt de laagste noot van het akkoord een octaaf omhoog. |
| **Patroonlengte** | 1 tot 16 stappen. Elk spoor loopt op zichzelf rond, dus sporen met een verschillende lengte schuiven ten opzichte van elkaar. |
| **Herhalingen per stap** | 1 tot 4. Een noot wordt zo vaak herhaald binnen zijn stap, en de lengte wordt gedeeld. |
| **Speelkans** | 0 tot 1. De kans dat een stap speelt. 1 is altijd, 0 is nooit. |
| **Progressie per maat (0,3,-2,5)** | Vier getallen, gescheiden door komma's: het aantal halve tonen dat bij de grondtoon wordt opgeteld in maat 1, 2, 3 en 4. Na vier maten begint het opnieuw. `0,0,0,0` houdt het akkoord gelijk. |

**Stapknoppen**: zestien knoppen, **1** tot **16**. Een stip (●) betekent dat deze stap speelt; klik op een knop om hem om te zetten. Alleen de eerste stappen tot de **Patroonlengte** tellen mee. Terwijl de klok loopt, heeft de stap die speelt een gekleurde rand.

**Klank van het spoor**

| Regelaar | Wat hij doet |
|---|---|
| **Gate** | De lengte van de noot ten opzichte van zijn stap, 0,10 tot 1,50. Beginwaarde 0,70. Korter is kortaf. |
| **Velocity** | Hoe hard de noten worden gespeeld, 0,05 tot 1,00. Beginwaarde 0,80. |
| **Transpositie** | Verschuift het hele spoor in halve tonen, −24 tot 24. Bij het spelen afgerond op hele halve tonen. |

Dubbelklik op een schuif om hem terug te zetten op zijn beginwaarde.

De regel onder de regelaars toont de scène en het tempo in BPM, bijvoorbeeld "Scène 1 · 120 BPM".

### De poorten

| Poort | Soort | Wat sluit je aan |
|---|---|---|
| **Transpositie** | eventingang | Noten van een **Keys / MIDI**-apparaat of een andere sequencer. De noot C4 (60) betekent geen verschuiving; elke noot eromheen verschuift alle sporen met zoveel halve tonen (tot 36 omhoog of omlaag). |
| **Mod** | modulatie-ingang | Een modulator. Hij kan de **Gate**, **Velocity** en **Transpositie** van elk spoor bewegen. |
| **Spoor A** … **Spoor D** | eventuitgangen | Elk gaat naar de notes-ingang van de synth die dat spoor speelt. |

Er zijn geen audiopoorten.

### Een voorbeeld

Een kleine band van drie synths:

1. Plaats Chord Sequencer en drie synths: bijvoorbeeld Chord Poly voor de akkoorden, Low Bass voor de bas en Sub Line voor de puls. In de [handleiding voor synths](../synths/USER-MANUAL_NL.md) staat welke synths meerdere noten tegelijk kunnen spelen.
2. Verbind **Spoor A** met de notes-ingang van de akkoordsynth, **Spoor B** met de bassynth en **Spoor C** met de derde synth. Sluit de drie audio-uitgangen aan op een mixer of op je speakers.
3. Controleer op de kaart spoor A: **Volledig akkoord**, **Akkoord** `minor`, **Nootdeling** 1/4. Zet spoor C aan (**Actief** → **Aan**) en zet **Spel** op **Alleen grondtoon**.
4. Druk op Start. Verander **Progressie per maat** van spoor A in `0,5,3,7`, dan wisselen de akkoorden elke maat.
5. Gebruik scène 2 voor een variatie: kies **Kopieer scène naar volgende**, klik op **Scène 2** en verander daar een paar dingen.

Of sla stap 3 en 4 over en kies een preset (zie hieronder).

### De presets

Het pack **Chord Sequencer Styles** heeft 60 presets in 11 mappen: Pop (6), Ballad (5), Cinematic (6), Film Score (5), Ambient (6), Trance (6), Synthwave (6), Lo-fi (5), Neo-classical (5), Deep House (5) en Funk & Disco (5). Voorbeelden: **Pop** › Bright Four, **Ambient** › Floating Garden, **Trance** › Uplifting Anthem, **Deep House** › Warehouse Warmth.

Elke preset vult de vier sporen en de vier scènes. Volgens de omschrijving van het pack zijn de scènes een hoofdpart, een variatie, een breakdown en een lift. Laad het pack met **Presets ▾ → Importeren…** uit [`presets/chord-sequencer.patchkamer-presets.json`](../../presets/chord-sequencer.patchkamer-presets.json), of laad `github.com/unboxednl/patchkamer` als bibliotheek. Kies daarna een preset in de lijst op de kaart. Meer in [Presets: gebruikershandleiding](../presets/USER-MANUAL_NL.md#chord-sequencer-akkoord--en-patroonpresets).

Een preset bevat geen kabels en verandert niet welk spoor je bewerkt. Verbind de uitgangen zelf met je synths.

### Tips en beperkingen

- Een **Volledig akkoord** gaat als losse noten op hetzelfde moment weg. Gebruik een synth die meerdere noten tegelijk kan spelen; een synth met één stem speelt er maar één van.
- Vier sporen sturen gebeurtenissen over vier verschillende kabels, dus elk spoor kan een eigen synth hebben. Gebruik **Alleen grondtoon** of **Arpeggio** voor een synth met één stem.
- Elk spoor telt zijn eigen stappen, dus een spoor van 5 stappen en een spoor van 16 stappen beginnen pas na 80 stappen weer samen (als beide dezelfde **Nootdeling** hebben).
- Stopt de klok, dan stoppen alle noten en gaan de tellers terug; de volgende start begint bij stap 1 en maat 1.
- De kans van een stap (**Speelkans**) is willekeurig maar herhaalbaar: dezelfde state en dezelfde klokstappen geven bij elke run dezelfde noten.
- Een scènewissel met **Direct** kapt de klinkende noten af. Gebruik **Volgende maat** voor een live wissel.

## Als het niet werkt

- **Geen geluid.** De sequencer maakt zelf geen geluid. Controleer of de uitgang die je gebruikt verbonden is met de notes-ingang van een synth, of de synth verbonden is met je speakers en of de klok loopt (Start).
- **Een spoor is stil.** Controleer of **Actief** op **Aan** staat, of er stappen binnen de **Patroonlengte** aanstaan (●) en of de **Speelkans** boven 0 is.
- **Van een akkoord klinkt maar één noot.** De synth heeft één stem. Gebruik een synth die meerdere noten tegelijk kan spelen, of zet **Spel** op **Arpeggio** of **Alleen grondtoon**.
- **Een scène wisselt niet.** Met **Volgende maat** gebeurt de wissel aan het begin van de volgende maat, en alleen zolang de klok loopt. Staat de klok stil, dan wisselt de scène meteen.
- **Noten worden afgekapt of lopen door elkaar.** Verlaag **Herhalingen per stap** of **Gate**, of gebruik een langere **Nootdeling**.
- **Een song of preset van het eerdere apparaat laadt niet.** Songs en presets die voor het eerdere apparaat met een andere naam zijn gemaakt (Puls Sequencer, dat bij de synths stond) verwijzen naar zijn oude id en laden niet in Chord Sequencer.
