# AGENTS.md: Grain Cloud

Dit bestand is voor AI-agents die **tunes voor Grain Cloud** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Grain Cloud geldt.

## Wat Grain Cloud is

Een granulaire synth en een granulair effect in één. Het knipt geluid in korreltjes (grains) van 5 ms tot 1 s en strooit ze opnieuw uit, elk met een eigen toonhoogte, richting, plek in de bron en stereopositie. Er zijn drie bronnen (het veld `src`):

- **`wave`** (Golf): een ingebouwde klankbron van één seconde die eindeloos loopt: `choir` (een zaagtand door drie formanten, een "aah" met vibrato), `organ`, `saw`, `glass` (onharmonische boventonen), `noise` (gefilterde ruis) of `sine`. Het apparaat is dan een **synth**: het klinkt zonder ingang. De bron is 220 Hz (A3): MIDI-noot 57 speelt hem op de oorspronkelijke toon.
- **`live`**: alles wat op de audio-ingang `in` binnenkomt, via een ringgeheugen van 8 seconden. Het apparaat is dan een **effect**: wolken, stotters en omgekeerde echo's van wat je erin stuurt. Zonder kabel op `in` klinkt `live` niets.
- **`frozen`**: het ringgeheugen staat stil (de knop Freeze of Record 4 s op de kaart) en je speelt erin rond. Het geheugen is een opname van deze sessie en zit **niet** in de state.

Elke noot en de drone (`cloud`) is een stem die `dens` korrels per seconde strooit. Een noot verschuift de toonhoogte van de korrels (bij `live` en `frozen` is C4, MIDI 60, de oorspronkelijke toon, bij `wave` is dat A3, MIDI 57). Er zijn maximaal acht stemmen tegelijk (de wolkstem telt mee; een negende noot neemt de oudste stem over) en samen maximaal 160 korrels tegelijk. Er zit **geen sequencer of arpeggiator** in: de klank is een textuur of wordt met noten gespeeld.

Het verschil met `BowedEnsemble` en `Mist`: die klinken op oscillatoren. Grain Cloud herschikt een korte golf of live geluid; het levert zwevende wolken, glinsterende koren, stotters en ruiskorrels die geen ander apparaat geeft. Mist is een stilstaand akkoordbed met een eigen akkoordgang; Grain Cloud heeft geen akkoorden of toonsoort.

| | |
|---|---|
| Bestand | `grain-cloud.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.graincloud`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Grain Cloud` in alle talen; de poortnamen `In (source)` en `Notes` hebben een Nederlandse variant (via `i18n`: `In (bron)`, `Noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-ingang `in` (In (source)), eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Korrel, `nl.patchkamer.korrel`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. **Een deel van de state-sleutels en -waarden heeft een Engelse naam gekregen**: het veld `wolk` heet nu `cloud`, de bron `bevroren` is `frozen` en `golf` is `wave`, de golven `koor`, `orgel`, `zaag`, `glas`, `ruis` en `sinus` zijn `choir`, `organ`, `saw`, `glass`, `noise` en `sine`, en de toonsprongen `vrij`, `octaven`, `kwinten` en `okt5` zijn `free`, `octaves`, `fifths` en `octfifth`. De oude waarden en de oude sleutel `wolk` worden bij het laden nog herkend (zie `preset` hieronder voor de klanknamen), maar gebruik in een tune alleen de nieuwe.

## Wat je hier doet

Je maakt klanken (tunes) voor Grain Cloud en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft de 20 velden hieronder (getallen, tekst en één boolean; gewone JSON, geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een getal wordt in het bereik afgekapt (er is geen stapgrootte); een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Een onbekende tekst bij `src`, `wave` of `steps` geeft de startwaarde.

### Waar en hoe vaak

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `src` | Bron: `live`, `frozen` of `wave` (zie boven) | drie keuzes | `wave` |
| `wave` | Ingebouwde golf voor `src: "wave"`: `choir`, `organ`, `saw`, `glass`, `noise`, `sine`. Bij een andere bron zonder effect | zes keuzes | `choir` |
| `pos` | Positie waar de korrels vandaan komen: bij `live` hoe ver terug in de tijd van de 8 s (0 = zojuist, 1 = acht seconden terug), bij `wave` en `frozen` waar in de bron. Bij een periodieke golf als `sine` of `saw` hoor je het verschil nauwelijks | 0 … 1 | 0,3 |
| `spread` | Willekeurige spreiding van die plek (1 = de korrel mag een halve bronlengte verderop beginnen) | 0 … 1 | 0,25 |
| `scan` | De positie schuift vanzelf door de bron: 1 = 0,15 bronlengte per seconde vooruit, −1 achteruit | −1 … 1 | 0 |
| `size` | Korrelgrootte in ms (logaritmisch). Klein (5 … 40) klinkt als ruis, een zoem of tikken; groot (300 … 1000) als losse, herkenbare brokjes of een zacht koor | 5 … 1000 | 120 |
| `dens` | Dichtheid: korrels per seconde per stem (logaritmisch). `dens × size / 1000` is het gemiddeld aantal korrels dat tegelijk klinkt; daaronder (≤ 1) krijg je losse tikken | 1 … 150 | 22 |

### Elke korrel

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `pitch` | Toonhoogte van alle korrels in halve tonen | −24 … 24 | 0 |
| `pspread` | Willekeurige toonspreiding in halve tonen (± dit bereik) | 0 … 24 | 0 |
| `steps` | Hoe de toonspreiding springt: `free` (elke waarde), `octaves` (−24, −12, 0, 12, 24, begrensd door `pspread`), `fifths` (−12, −5, 0, 7, 12, 19), `octfifth` (−12, 0, 7, 12, 19, 24). Bij `pspread` 0 zonder effect; bij een kleine `pspread` (1 … 4) bevat `octaves` alleen 0 | vier keuzes | `free` |
| `rev` | Kans dat een korrel achteruit speelt | 0 … 1 | 0 |
| `pan` | Stereobreedte: hoever een korrel links of rechts mag klinken (0 = alles in het midden) | 0 … 1 | 0,6 |
| `shape` | Vorm van het venster: 0 = zacht (Hann), 1 = hoekig (trapezium, klinkt als een tik) | 0 … 1 | 0,2 |

### Wolk en niveau

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `cloud` | Wolkstem: een eindeloze wolk op de oorspronkelijke toon (verschoven met `pitch`), ook zonder noten. `false` = alleen noten klinken | `true` of `false` | `true` |
| `fb` | Terugkoppeling: de wolk gaat terug de opname in. Alleen bij `live` (en tijdens opnemen); bij `wave` zonder effect | 0 … 0,9 | 0 |
| `mix` | Hoeveel van de wolk er klinkt. Bij `live` en `frozen` is `1 − mix` het droge ingangssignaal dat erdoorheen blijft komen; bij `wave` stuurt `mix` alleen het niveau van de wolk (er is geen dry) | 0 … 1 | 0,7 |
| `att` | Aanzet van een stem in seconden (logaritmisch): hoe lang het duurt voor de wolk of de noot op volle sterkte is | 0,005 … 8 | 0,4 |
| `rel` | Uitklank van een stem in seconden (logaritmisch) na het einde van de noot | 0,01 … 12 | 2 |
| `level` | Uitgangsniveau | 0 … 1 | 0,8 |

### Het veld `preset`

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `preset` | De naam van de gekozen klank in de keuzelijst **Soundscape** op de kaart. Het is alleen een label: het zet zelf niets. De kaart zet het op `Custom` zodra iets verandert | `Choir Sea`, `Glass Rain`, `Organ Cloud`, `Stutter`, `Frozen Time`, `Reverse Echo`, `Crystals`, `Noise Storm`, `Custom` | `Choir Sea` |

Een ongeldige waarde geeft de startwaarde. De oude Nederlandse namen worden bij het laden herkend (`Eigen` wordt `Custom`, `Koorzee` wordt `Choir Sea` enzovoort). **Zet in een tune `"preset": "Custom"`**: laat je het veld weg, dan staat de keuzelijst op `Choir Sea` terwijl de klank anders is. De keuzelijst zet de bijbehorende waarden wel echt in de state; je kunt de klankwaarden van de ingebouwde klanken dus als uitgangspunt gebruiken door ze op de kaart te kiezen en `getState()` te lezen.

Velden die niet in een tune horen: er zijn er geen in de state. Wel: **geen opname of sample in een tune** (het 8-seconden-geheugen en de opname van Record 4 s zijn geen state), geen routing en geen klokstand.

## Wat een tune met een audio-ingang wel en niet kan

- **Een tune met `src: "wave"` is een synth**: de ingang wordt genegeerd en je hoort alleen de ingebouwde golf. Dit is de standaardkeuze voor tunes: ze klinken direct, zonder kabel.
- **Een tune met `src: "live"` is een effect** op wat er op de ingang `in` binnenkomt. Hij kan de bron laten stotteren, omkeren, verschuiven, bevriezen (korte `size`, hoge `dens`, `shape` 1), uitsmeren (grote `size`, `fb` 0,3 … 0,6) en verstrooien (`pspread`, `steps`). Hij klinkt **niets zonder kabel**, hoort pas na een of twee seconden echt iets (het geheugen moet zich vullen) en klinkt alleen zo goed als de bron. `mix` 0,4 … 0,6 houdt de bron hoorbaar.
- Een tune **kan geen opname meebrengen**: `src: "frozen"` in een tune start met een leeg geheugen en klinkt dus niets tot de gebruiker opneemt (Record 4 s) of bevriest. Zet `frozen` daarom nooit in een tune.
- Bij `live` bepaalt `pos` hoe ver terug in de laatste 8 seconden de korrels vandaan komen: 0,05 … 0,15 klinkt als een stotter van het zojuist gespeelde, 0,5 … 1 als een lange echo.
- Een tune met `cloud: true` en `src: "live"` laat de wolk altijd door de ingang lopen; met `cloud: false` klinkt de wolk alleen bij noten (en blijft de droge ingang door `1 − mix` wel hoorbaar).
- Test elke tune met `live` met een echt ingangssignaal (een korte pluck, een ritme of akkoorden); stilte of een sinus verbergt de meeste effecten.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt (`size: 1e9` wordt 1000, `fb: 5` wordt 0,9); een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en de keuzelijsten op de kaart bewegen mee met `setState`.
- Veranderingen komen via een bericht naar de worklet; de overgang van knoppen is niet gladgestreken (niet beluisterd). De aanzet en uitklank van stemmen zijn dat wel.

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`; zonder `dur` klinkt een `note` 0,5 s), `noteon` en `noteoff` (aangehouden toetsen; een `noteon` zonder `noteoff` klinkt door tot een `panic` of tot de transport stopt), `cc` (`id` gelijk aan een getalveld uit de tabellen, `value` 0 … 1 zet dat veld lineair over zijn bereik, ook bij de logaritmische) en `panic`/`allnotesoff`. Een transportstop laat alle stemmen uitklinken (`rel`).
- Een noot heeft geen eigen filter of envelope buiten `att` en `rel`; de dichtheid en het venster maken de klank. Velocity telt lineair mee.
- Het ruwe niveau hangt af van `dens × size`: de wolk wordt genormaliseerd op 0,9 / √(`dens × size / 1000`) (bij minder dan één gelijktijdige korrel niet), daarna begrenst een tanh de uitgang. Een wolk met veel korrels is dus niet automatisch luider, maar een stem erbij wel (drie stemmen tegelijk zijn ruim luider dan één: houd bij akkoorden `level` onder ongeveer 0,6).
- De modulatie-ingang `mod` (paars) verschuift vijftien knoppen (alle getallen behalve de keuzes en `cloud`); de basiswaarden blijven staan. Eén spoor: Grain Cloud. Logaritmisch bewegen `size`, `dens`, `att` en `rel`. `pitch` en `level` staan standaard niet aan voor modulatie. Een Drift op `pos` of `scan` laat de wolk door de bron dwalen.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik, niveau en gedrag. Bij `wave` met `mix` 1 en `level` rond 0,6 … 0,9 is de uitgang van een zachte wolk redelijk gelijk; harde korrels (`shape` 0,8 … 1, `size` onder 30) en `noise` zijn zachter en hebben een hogere `level` nodig, een `choir` en een `sine` met grote korrels zijn luider.

Gemeten (offline, de worklet-code buiten de browser, 12 s): met `level` 0,2 … 1 geeft een tune met `wave` een rms van het stationaire deel tussen 0,08 en 0,18 (de piek blijft onder 0,8). Een tune met `live` klinkt zo hard als zijn bron; met een korte pluck van rms 0,07 op de ingang komt de uitgang op ongeveer 0,045 uit. De golf `noise` heeft een kleine gelijkspanning (ongeveer 0,01 bij een rms van 0,1), omdat de golf niet is rechtgetrokken; een hoogdoorlaatfilter in de keten haalt die weg.

- **Basis (wolk):** `src: "wave"`, `wave: "choir"`, `size` 200 … 500, `dens` 10 … 30, `att` 3 … 6, `rel` 6 … 10, `mix` 1, `pan` 1.
- **Pad:** `choir`, `organ` of `glass` met `cloud: true`, `size` 250 … 600, `dens` 10 … 30, `spread` 0,3 … 0,8, `att` 3 … 6, `rel` 6 … 10. `pspread` 7 … 12 met `steps: "fifths"` of `"octaves"` maakt het een akkoord- of koorbed.
- **Drone en bas:** `pitch` −12 … −24, `size` 500 … 1000, `dens` 6 … 12, `spread` onder 0,2, `shape` 0 … 0,1, `wave: "sine"` of `"organ"`, `level` 0,9 … 1 (lage tonen zijn zacht).
- **Lead (met noten):** `cloud: false`, `att` 0,05 … 0,2, `rel` 0,5 … 1,5, `size` 50 … 200, `dens` 25 … 60, `pspread` onder 1 (anders klinkt de toonhoogte onzuiver), `wave` `saw` of `choir`.
- **Pluck of klok:** `cloud: false`, `att` 0,005 … 0,01, `rel` 2 … 4, `size` 100 … 250, `dens` 12 … 18, `wave: "glass"` of `"sine"`.
- **Arpeggio of sequencer:** geen eigen patroon: stuur noten met `dur`. Kies `att` onder 0,1 en `rel` onder de afstand tussen de noten, anders lopen de noten door elkaar.
- **Textuur, FX en ruis:** `wave: "noise"` of `"glass"`, `size` 5 … 40, `dens` 40 … 120, `pspread` 12 … 24 met `steps: "free"`, `shape` 0,6 … 1, `scan` 0,3 … 1, `pan` 1.
- **Effect op een ingang:** `src: "live"`, `mix` 0,4 … 0,6, `cloud: true`, en dan stotter (`size` 40 … 100, `dens` 30 … 40, `pos` 0,05, `shape` 0,9), omgekeerde echo (`rev` 0,7 … 1, `size` 150 … 250), schimmering (`pitch` 12, `steps: "octfifth"`, `fb` 0,3) of uitsmeren (`size` 400 … 600, `dens` 8 … 10, `fb` 0,4).

## Wat een tune niet moet doen

Het apparaat geeft in normaal gebruik geen niet-eindige getallen (zie Bewaker), maar je kunt een tune maken die stil of onbruikbaar is:

- `src: "live"` of `"frozen"` voor een tune die zonder ingang moet klinken: stil. `frozen` hoort nooit in een tune.
- `level` of `mix` 0, of `cloud: false` zonder noten: stil.
- `dens` 1 met `size` 5: bijna niets (een korrel van 5 ms per seconde).
- Grote `dens` (150) met grote `size` (1000): de wolk valt op de grens van 160 korrels en klinkt niet meer dichter; het kost veel rekenkracht. Houd `dens × size / 1000` onder ongeveer 30.
- `att` groter dan de nootlengte bij `cloud: false`: de noot is voorbij voor hij opkomt.
- `fb` 0,9 met `live`, `dens` 150 en `size` 1000: de terugkoppeling kan de opname laten overgaan in een eindeloos schreeuwende wolk (de begrenzer voorkomt een ontsporing, niet een vol, vervormd geluid). Houd `fb` onder ongeveer 0,6.
- Hoge `pspread` (12 … 24) met `steps: "free"` bij een melodie: de noten klinken dan onzuiver. Gebruik `octaves` of `fifths`, of houd `pspread` onder 1.
- Geen velden verzinnen en geen `preset` anders dan `Custom`.

## Bewaker

In normaal gebruik geeft Grain Cloud nooit een niet-eindig getal. In de oude versie bleef de opname van `live` voor altijd `NaN` houden als één `NaN` of `Infinity` op de ingang binnenkwam (het geheugen is dan vergiftigd en elke korrel erna ook). Daarom begrenst de worklet de ingang (`NaN` wordt 0, plafond ±16), schrijft hij alleen eindige waarden in het geheugen, accepteert hij alleen eindige parameters en noten, en zet hij de scanpositie terug als die ontspoort. Getest met een stoot van `NaN`, `Infinity`, `1e30` en `1e9` op de ingang: het oude bestand gaf daarna voor altijd `NaN` (of bleef op volle sterkte hangen bij `1e30`); het nieuwe is direct weer normaal. Het geluid in het normale gebied is gelijk aan het oude.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.graincloud` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

```json
{ "name": "Choir Mist", "kind": "set", "version": "1.0.0",
  "state": { "pos": 0.3, "spread": 0.4, "scan": 0, "size": 300, "dens": 14, "pitch": 0, "pspread": 0, "rev": 0, "pan": 1, "shape": 0.2,
             "fb": 0, "mix": 1, "att": 3, "rel": 6, "level": 0.8, "src": "wave", "wave": "choir", "steps": "free", "cloud": true, "preset": "Custom" } }
```

Zet liever alle velden erin: dan klinkt de tune hetzelfde als de startwaarden ooit veranderen. Vermeld in de omschrijving van het pack welke tunes `live` gebruiken (effecten); zet dat niet in hun naam.

## Skins

Alle keuzelijsten en knoppen zijn sinds 1.14.0 via `host.ui.adopt` herkenbaar voor skins: `id` is de state-sleutel (`pos`, `size`, `level`, `preset`, `src`, `wave`, `steps`, enzovoort), `role` is `param` (schuiven, genormaliseerd 0 tot 1) of `select`, `group` is `where`, `grain` of `cloud` (schuiven) of `source` (keuzelijsten). De knoppen (Wolk, Bevries, Neem op, Test noot) hebben geen id. Een skin kan zo de schuiven als draaiknop tonen (`design.controls` met `face: rotary`). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.graincloud/` (draaiknoppen met de naam eronder, per groep een kader, lager golfvlak, ongeveer 480 x 416 punten tegenover 820 x 688). Wijzig je de opbouw van de UI (`.top`, `.sel`, `.grid`, `.c`, `.lab`), controleer dan die skin.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/GrainCloud/grain-cloud.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Een offline render met de echte worklet is niet reproduceerbaar: berichten naar een worklet komen niet op een vaste plek in het audioblok aan, zodat noten soms te laat beginnen. Meet het niveau daarom door de worklet-code (de string `WORKLET` in het bestand) buiten de browser te draaien met een eigen `AudioWorkletProcessor`, `sampleRate` en `currentTime`, blok voor blok; zo is elke render gelijk.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en. De worklet-naam heeft een versie (`nl-patchkamer-graincloud-1-11-0`); verhoog die bij elke wijziging van de worklet-code.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Grain Cloud: [NL](../../../docs/synths/USER-MANUAL_NL.md#grain-cloud) · [EN](../../../docs/synths/USER-MANUAL_EN.md#grain-cloud).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [grain-cloud-styles.patchkamer-tunes.json](../../../tunes/grain-cloud-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: granulaire synth en effect voor texturen en pads. Noten op `notes`, audio uit `out`; de audio-ingang `in` kan als bron dienen. Een bron uit een bestand zit niet in de song.
