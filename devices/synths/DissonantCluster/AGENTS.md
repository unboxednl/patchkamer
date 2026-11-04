# AGENTS.md: Dissonant Cluster

Dit bestand is voor AI-agents die **tunes voor Dissonant Cluster** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Dissonant Cluster geldt.

## Wat Dissonant Cluster is

Een polyfone synth die **alleen dissonant klinkt**. Elke noot die je speelt wordt een cluster van 2 tot 6 stemmen in een gekozen structuur (bijvoorbeeld een smalle secundewolk, een chromatisch cluster of een 13-toons ligging). Een consonantiebewaker schuift stemmen zo nodig een paar cent op, zodat geen enkel paar tonen (binnen een noot en tussen noten die tegelijk klinken) in de buurt van een priem, octaaf, kwint, kwart, terts of sext komt. De klankbronnen hebben geen harmonische verhoudingen: zweving, FM en ringmodulatie op onmeetbare verhoudingen (√2, φ, π/2…), een metaalbron en ruis; daarbovenop wrijving (snelle amplitude-ruwheid), uiteendrijvende stemmen, een filter met eigen envelope, een vervormer en een amp-envelope. Een ruwheidsmeter en een dissonantiekaart op de kaart laten zien wat er klinkt; ze zijn alleen weergave en horen niet in een tune. Het apparaat heeft **geen eigen sequencer of arpeggiator**: het speelt noten die binnenkomen op de ingang `notes` en de klavier-knoppen op de kaart.

| | |
|---|---|
| Bestand | `dissonant-cluster.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.dissonantcluster`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Dissonant Cluster` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Out) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. Ook de namen van drie structuurwaarden zijn veranderd (zie `struct`).

## Wat je hier doet

Je maakt klanken (tunes) voor Dissonant Cluster en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: **38 velden**, allemaal getallen, tekst of `true`/`false`. Er is geen patroon, raster of sequencer in de state. Een tune hoeft niet alle velden te zetten: een ontbrekend veld krijgt de startwaarde. Zet toch alle velden die de klank bepalen, zodat de tune niet verandert als een startwaarde ooit verschuift.

### Cluster (hoe een noot een groep stemmen wordt)

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `struct` | Structuur: de afstanden in cent boven de grondtoon | `cloud`, `chrom`, `wide`, `trit`, `sept`, `x13` of `random` (zie onder) | `cloud` |
| `voices` | Aantal stemmen per noot | 2 … 6 (geheel getal) | 4 |
| `open` | Openheid: om-en-om een octaaf hoger | 0 … 3 (geheel getal) | 0 |
| `guard` | Consonantiebewaker aan | `true` of `false` | `true` |
| `margin` | Marge van de bewaker in cent | 10 … 60 | 35 |
| `drift` | Stemmen drijven uit elkaar, in cent per seconde (loopt in 8 s op; 0 = uit) | 0 … 50 | 0 |
| `beat` | Zweving: frequentieverschil (Hz) van de tweede oscillator per stem | 0 … 40 | 7 |
| `beatMix` | Hoeveel van die tweede oscillator meeklinkt (0 = geen zweving) | 0 … 1 | 0,4 |

Structuren (`struct`, afstand in cent boven de grondtoon bij het aantal stemmen):

| Waarde | Wat het is | Opmerking |
|---|---|---|
| `cloud` | Smalle secundewolk, stemmen 50 tot 75 cent uit elkaar (2 stemmen: 0 en 75) | zeer dicht, klinkt als gonzen of zwevende ruis |
| `chrom` | Chromatisch cluster: 0, 100, 200, 300 … cent | klassiek cluster |
| `wide` | Wijde spanning over 2 tot 3 octaven (tussentonen) | open en spannend |
| `trit` | Tritonus-kruis: 0, 600 en tussentonen | **maximaal 5 stemmen**: bij `voices: 6` klinken er 5 |
| `sept` | Septiem en none (1100, 2250, 2450 …) | harmonisch scherp |
| `x13` | 13-toons (xenharmonisch), ongelijke stappen | vreemd en onstabiel |
| `random` | Elke noot krijgt andere afstanden (raster van 25 cent, tot ongeveer 2,5 octaaf) | de klank verandert bij elke noot |

`open` verplaatst stem 2 (bij 1), stem 2 en 4 (bij 2) en stem 2, 4 en 6 (bij 3) een octaaf omhoog; de dissonantie blijft gelijk, de klank wordt wijder.

De bewaker (`guard: true`) schuift elke stem de kleinste stap (in stappen van 5 cent) weg van consonantie, tot de marge (`margin`) is gehaald; daarna schuift hij het hele cluster hooguit een halve toon ten opzichte van de noten die al klinken. Met `guard: false` klinkt de structuur zoals hij is en kunnen paren bij toeval consonant zijn.

### Bron (waar het geluid vandaan komt)

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `wave` | Golfvorm van de stemmen | `sawtooth`, `square`, `triangle` of `sine` | `sawtooth` |
| `fmRatio` | FM-verhouding (tekst, een van de acht) | `'1.41421'` (√2), `'1.73205'` (√3), `'1.61803'` (φ), `'1.5708'` (π/2), `'1.35914'` (e/2), `'2.23607'` (√5), `'2.71828'` (e), `'3.14159'` (π) | `'1.41421'` |
| `fmi` | FM-index: hoeveel de sinus op `fmRatio` de toonhoogte moduleert (0 = uit) | 0 … 10 | 0 |
| `ringRatio` | Verhouding van de ringmodulator (zelfde acht waarden als `fmRatio`) | zie boven | `'1.61803'` |
| `ring` | Ringmodulatie: aandeel van het gemoduleerde geluid (0 = uit) | 0 … 1 | 0 |
| `metal` | Metaalbron: zes blokgolven op onmeetbare verhoudingen door een bandfilter | 0 … 1 | 0 |
| `noise` | Ruis door een bandfilter rond de grondtoon | 0 … 1 | 0 |
| `rough` | Wrijving: diepte van een snelle volumebeweging per stem | 0 … 1 | 0,25 |
| `roughRate` | Snelheid van die beweging in Hz (elke stem wijkt tot 15 % af) | 8 … 70 | 27 |

`fmRatio` en `ringRatio` zijn **tekst**, geen getal: gebruik precies een van de acht waarden hierboven. Alles daarbuiten geeft de startwaarde. Snelle volumebeweging tussen ongeveer 15 en 70 Hz hoor je niet als ritme maar als ruwheid; rond 30 Hz is ze het sterkst.

### Filter, vervormer en envelopes

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `ftype` | Filtertype | `lowpass`, `bandpass`, `highpass`, `notch` of `peaking` | `lowpass` |
| `cut` | Cutoff in Hz (de basis; de noot en de envelope verschuiven hem) | 40 … 18000 | 2400 |
| `res` | Resonantie (Q) | 0,3 … 20 | 2 |
| `fenv` | Envelope-diepte van het filter: 1 = zes octaven omhoog, negatief = omlaag | −1 … 1 | 0,3 |
| `kt` | Toonvolgen: hoeveel de cutoff met de noot meegaat (ten opzichte van C4) | 0 … 1 | 0,5 |
| `stype` | Vervormer | `off`, `soft`, `hard`, `fold` of `asym` | `soft` |
| `drive` | Hoeveelheid vervorming | 0 … 1 | 0,2 |
| `fa` | Filter-envelope attack (s) | 0,001 … 8 | 0,01 |
| `fd` | Filter-envelope decay (s) | 0,01 … 8 | 0,6 |
| `fs` | Filter-envelope sustain (aandeel van de diepte) | 0 … 1 | 0,4 |
| `fr` | Filter-envelope release (s) | 0,01 … 10 | 0,8 |
| `aa` | Amp-envelope attack (s) | 0,001 … 8 | 0,02 |
| `ad` | Amp-envelope decay (s) | 0,01 … 8 | 0,6 |
| `as` | Amp-envelope sustain | 0 … 1 | 0,8 |
| `ar` | Amp-envelope release (s) | 0,01 … 10 | 1,2 |
| `vel` | Aanslaggevoeligheid | 0 … 1 | 0,5 |

### Uitgang

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `poly` | Aantal noten tegelijk (elke noot is een heel cluster); bij meer wordt de oudste snel afgekapt | 1 … 6 (geheel getal) | 4 |
| `width` | Stereobreedte van de stemmen binnen een noot | 0 … 1 | 0,7 |
| `tune` | Stemming in cent | −100 … 100 | 0 |
| `lvl` | Niveau | 0 … 1 | 0,55 |
| `pan` | Panorama (−1 links, 1 rechts) | −1 … 1 | 0 |

Alle 38 velden staan in `getState()`: `struct`, `voices`, `open`, `guard`, `margin`, `drift`, `wave`, `beat`, `beatMix`, `fmRatio`, `fmi`, `ringRatio`, `ring`, `metal`, `noise`, `rough`, `roughRate`, `ftype`, `cut`, `res`, `fenv`, `kt`, `stype`, `drive`, `fa`, `fd`, `fs`, `fr`, `aa`, `ad`, `as`, `ar`, `vel`, `poly`, `width`, `tune`, `lvl`, `pan`. De rest van de kaart (kleuren, de ruwheidsmeter, de dissonantiekaart, de klavierknoppen en de acht startklanken) zit niet in de state.

**Wat niet in een tune hoort:** kabels en routing (die bewaart de werkruimte), modulatie-instellingen (die horen bij de modulator die ze stuurt), en de klavier. De acht knoppen bovenaan de kaart (`Basic`, `Hornet Nest`, `Rusty Bell`, `Tritone Choir`, `Quarter-tone Mist`, `Glass Splinters`, `Industrial Drone`, `Minor Siren`) zetten gewoon een aantal van bovenstaande velden en mogen als uitgangspunt dienen; in een tune staat altijd de volledige state, nooit een verwijzing naar zo'n knop.

### Sturing (modulatie)

Het apparaat heeft negentien stuurbare parameters in vijf sporen, met dezelfde id als het state-veld: `beat`, `beatMix`, `drift` (Cluster); `fmi`, `ring`, `metal`, `noise`, `rough`, `roughRate` (Bron); `cut`, `res`, `fenv`, `drive` (Filter); `aa`, `ad`, `ar` (Envelopes); `tune`, `lvl`, `pan` (Uitgang). Snel (op audiosnelheid) stuurbaar zijn `cut`, `tune`, `lvl` en `pan`. Een stuursignaal van −1 tot 1 verschuift de knopstand over het volle bereik.

## Wat het apparaat met een state doet (getest)

- `setState({})`, `setState(null)` en een tekst geven de startwaarden.
- Getallen buiten het bereik worden afgekapt (`ar: 1e9` wordt 10, `tune: 1e9` wordt 100, `margin: -5` wordt 10, `voices: 99` wordt 6).
- Een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige keuzewaarde (`wave`, `struct`, `ftype`, `stype`, `fmRatio`, `ringRatio`) of een niet-booleaanse `guard` geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- `getState()` geeft altijd de volledige 38 velden, geldig JSON; `setState(getState())` geeft dezelfde state terug.

## Goede basis en tips per soort klank (niet beluisterd)

Alles hieronder is afgeleid uit de code en uit de meegeleverde knoppen, **niet beluisterd**. Beoordeel een tune altijd op wat de state zegt, en zeg in je oplevering dat je hem niet kon horen.

- **Goede basis:** de startwaarden hierboven (4 stemmen, secundewolk, zaagtand, lowpass op 2400 Hz, zachte vervorming, zweving 7 Hz, wrijving 25 %).
- **Basklank:** lage noten (onder C3) zijn bij een dicht cluster vooral een zwevend gonzen. Neem 2 of 3 stemmen, `struct: sept` of `trit`, `wave: square` of `sawtooth`, `cut` 400 tot 900 Hz met `fenv` rond 0,2, `res` laag (1 tot 4), `kt` 0,5 tot 1, `poly` 1 tot 2, `ad` kort en `as` laag voor een stoot.
- **Lead:** 2 tot 3 stemmen, `struct: trit` of `wide`, `wave: sawtooth`, `cut` 1500 tot 3500 Hz, `res` 2 tot 5, `aa` kort, `as` hoog, `poly` 1 tot 2, een beetje `drift` (3 tot 10) voor leven.
- **Pad:** 4 tot 6 stemmen, `struct: cloud` of `x13`, `wave: triangle` of `sine`, `noise` 0,2 tot 0,4, `aa` en `ar` lang (1 tot 4 s), `stype: off`, `poly` 3 tot 4, `width` 0,8 tot 1.
- **Pluck of klok:** `wave: sine`, `fmi` 2 tot 5 met `fmRatio` `'1.41421'` of `'1.5708'`, `ring` 0,3 tot 0,5, `metal` 0,2 tot 0,4, `aa` zeer kort (0,002), `ad` en `ar` lang (2 tot 4 s), `as: 0`.
- **Arpeggio:** het apparaat heeft er geen eigen. Een tune voor een externe arpeggiator of sequencer houdt `poly` laag (1 tot 3), `ar` kort (0,1 tot 0,5 s) en `aa` kort (0,002 tot 0,02 s), zodat elke noot een eigen cluster blijft en de noten niet in elkaar lopen. Gebruik liever geen `random` in een patroon dat herkenbaar moet zijn.
- **Industrieel of drone:** `struct: sept`, `wave: square`, `open: 1`, `metal` 0,2, `stype: hard`, `drive` 0,6, `cut` 600 Hz, `res` 6, `lvl` laag (0,25), `as: 1`.

## Wat een tune niet moet doen

- **Niet alles tegelijk op het maximum.** Zes stemmen, `poly: 6`, `res: 20`, `drive: 1` en een lage `cut` samen gaven in een zoektocht met extreme instellingen pieken tot ongeveer 18 (een volle schaal is 1) en een harde, gesatureerde klank. Houd `lvl` onder 0,6 als je veel stemmen en noten combineert.
- **Geen lange `ar` bij een hoge `poly` en veel stemmen:** elke uitklinkende noot blijft een heel cluster van oscillatoren en filters; kies `ar` onder de 4 s als de klank dat niet nodig heeft.
- **Geen `res` boven 12 met een `cut` onder 100 Hz en veel `fenv`:** de resonantiepiek loopt dan het hardst op (dit is niet apart beluisterd).
- **`guard: false` alleen met een reden:** zonder bewaker klinken priemen en octaven weer bij toeval, en dat is wat dit apparaat juist niet wil.
- **Geen nieuwe of afgeleide state-velden.** Verander geen `id`, `kind`, poort-id's of veldnamen.
- **Geen merknamen** van bestaande apparatuur in naam of omschrijving van een tune, en geen persoon verzinnen bij `author`.

Een bewaker controleert om de 50 ms de ruwe uitvoer van alle filters (vóór de vervormer, die een ontsporing anders verbergt). Loopt een filter weg naar waarden boven 1000 of naar `Infinity`/`NaN`, dan worden de klinkende noten opgeruimd en klinkt de volgende noot weer gewoon. Dat is een vangnet voor een ontspoord filter, geen reden om een instelling te kiezen die erop leunt. Het apparaat accepteert alleen eindige waarden van noot-, snelheid-, duur- en modulatie-ingangen.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.dissonantcluster` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Namen van tunes en packs zijn Engels. Geef elke tune een naam die beschrijft hoe hij klinkt of wat hij doet.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/DissonantCluster/dissonant-cluster.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.
