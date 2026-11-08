# AGENTS.md: Brass Section

Dit bestand is voor AI-agents die **tunes voor Brass Section** maken of het apparaat bijwerken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Brass Section geldt.

## Wat Brass Section is

Een polyfoon koperinstrument (trompet, trombone, hoorn, sectie) met een eigen motor (`BrassEngine`) in een AudioWorklet. Elke noot start één tot vier **spelers**; elke speler is een eigen stem (samen 32 stemmen). Een stem is een bandbegrensde zaagtand door een lowpass-filter (TPT-toestandsfilter) dat bij elke noot openzwelt (de "blat"), helderder wordt bij een hardere aanslag en bij hoge noten, met een kleine toonhoogteglijding van onderaf bij de aanzet, adem- en lipruis, vibrato dat pas na een vertraging inzet, een zachte verzadiger (Scherpte) en een eigen stereopositie. De spelers van één noot staan een paar cent uit elkaar (Verstemming), beginnen een paar milliseconden na elkaar (Inzetverschil) en hebben ieder een eigen vibratofase: dat geeft het sectiegevoel. Op de stereosom zit een demperfilter (Demper) en een gelijkspanningsfilter, met een zachte begrenzer als laatste stap. Er zit **geen sequencer en geen effect** (galm, chorus) in: het apparaat speelt alleen de noten van de ingang `notes`, of de knoppen Test note en Test chord op de kaart.

| | |
|---|---|
| Bestand | `brass-section.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.brass-section`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Brass Section` in alle talen; de poortnamen hebben een Nederlandse variant (`Keyboard / noten`, `Stereo koper`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo brass, stereo) |
| Worklet | `nl-patchkamer-brass-section-1-20-0`; verhoog het versienummer in de naam bij elke wijziging van de motorcode |
| Contract | v1.20 |
| Licentie apparaat | AGPL-3.0-or-later |

## De state

`getState()` geeft alle velden hieronder (24 getallen en `preset`, gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een waarde wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd.

### Toon en blat

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `brightness` | Helderheid: cutoff van het filter in Hz in de ingeslagen stand (bij aanslag 0,7, middelste C). Hoge noten gaan mee omhoog (een octaaf per drie octaven) | 250 … 9000 | 10 | 1500 |
| `blat` | Hoeveel het filter bij elke noot openzwelt: 0 = geen zwelling, 1 = begint drie octaven lager en zwelt open, met een kleine heldere piek bij een harde aanslag | 0 … 1 | 0,01 | 0,6 |
| `swell` | Tijd waarin dat openzwellen gebeurt (seconden) | 0,01 … 1 | 0,005 | 0,1 |
| `resonance` | Resonantie (Q) van het filter | 0,5 … 5 | 0,1 | 1,2 |
| `edge` | Scherpte: zachte verzadiging na het filter, sterker bij harde aanslag. Maakt de toon ruwer en "blatender" | 0 … 1 | 0,01 | 0,35 |
| `mute` | Demper: dempkaplaag. Verlaagt de cutoff, haalt laag weg en zet een nasale piek rond 1,8 kHz op de som. 0 = open | 0 … 1 | 0,01 | 0 |
| `velBright` | Aanslagkleur: hoeveel een hardere aanslag helderder klinkt (drie octaven cutoff over het hele bereik) | 0 … 1 | 0,01 | 0,6 |

### Aanzet en spel

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `attack` | Opkomst, lineair, seconden | 0,005 … 1 | 0,005 | 0,05 |
| `decay` | Tijd naar het sustain-niveau | 0,02 … 2 | 0,01 | 0,2 |
| `sustain` | Sustain-niveau | 0 … 1 | 0,01 | 0,85 |
| `release` | Uitklank na het loslaten (exponentieel, 60 dB over deze tijd) | 0,02 … 3 | 0,01 | 0,18 |
| `scoop` | Aanzetglijding: hoeveel cent de toon onder de noot begint (er komt 25% spreiding per speler bij) | 0 … 100 | 1 | 30 |
| `scoopTime` | Tijdconstante van die glijding, seconden | 0,01 … 0,3 | 0,005 | 0,07 |
| `breath` | Adem- en lipruis, het sterkst in de eerste 60 ms | 0 … 1 | 0,01 | 0,25 |
| `velocity` | Hoeveel de aanslag het niveau bepaalt (0 = elke noot even hard) | 0 … 1 | 0,01 | 0,8 |

### Sectie en vibrato

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `players` | Spelers per noot (geheel getal). Met 4 spelers is er ruimte voor 8 noten tegelijk | 1 … 4 | 1 | 1 |
| `spread` | Verstemming tussen de spelers, cent (heeft bij 1 speler alleen een klein toevalsdeel) | 0 … 30 | 0,5 | 8 |
| `stagger` | Inzetverschil: de laatste speler begint zoveel ms na de eerste (alleen bij een vers beschikbare stem) | 0 … 80 | 1 | 12 |
| `width` | Stereobreedte van de spelers (bij 1 speler staat de stem in het midden) | 0 … 1 | 0,01 | 0,6 |
| `vibrato` | Diepte (1 = 35 cent) | 0 … 1 | 0,01 | 0,25 |
| `vibRate` | Snelheid in Hz | 3 … 8 | 0,1 | 5,3 |
| `vibDelay` | Vertraging voor het vibrato inzet (dan 0,5 s inzwellen), seconden | 0 … 2 | 0,05 | 0,4 |

### Spel en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `transpose` | Transpositie in halve tonen, door de kaart op het nootnummer toegepast (hele getallen; geldt voor nieuwe noten) | −24 … 24 | 1 | 0 |
| `expression` | Expressie: tweede volumeregelaar voor swells (ook via `cc`) | 0 … 1 | 0,01 | 0,9 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,8 |

### Het veld `preset`

De naam van de gekozen klank in de keuzelijst **Brass**: `Trumpet`, `Muted Trumpet`, `Flugelhorn`, `Trombone`, `French Horn`, `Brass Section`, `Tight Stabs`, `Slow Swell`, `Soft Ballad Horn` of `Custom`. Het is alleen een label; de keuzelijst zet de bijbehorende waarden wel echt in de state. De kaart zet het op `Custom` zodra een knop verandert. **Zet in een tune `"preset": "Custom"`**: het apparaat zelf zet geen andere naam in een tune. Een ongeldige waarde geeft de startwaarde `Trumpet`.

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`), `noteon` en `noteoff` (aangehouden toetsen), `cc` en `panic`/`allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot er een `panic` komt of de transport stopt: **een sequencer moet altijd `dur` meesturen**. Een `cc` met `id` gelijk aan een veld uit de tabellen en `value` 0 … 1 zet dat veld lineair over zijn bereik en zet `preset` op `Custom`. Een transportstop laat alle noten in 0,15 s uitklinken en wist de noten die al vooruit zijn gepland.
- Stemmen: 32. Elke noot neemt `players` stemmen. Zijn er niet genoeg vrije, dan wordt eerst de zachtste uitklinkende stem overgenomen, daarna de oudste. Een overgenomen stem houdt zijn niveau en fase vast (geen klik); alleen de toonhoogte springt.
- Alle knoppen behalve `players` en `transpose` zijn stuurbaar via de paarse `mod`-ingang (één spoor: Brass); `preset` beweegt niet mee. Een modulatie werkt op de lopende regelaars (cutoff, blat, demper, ademruis, vibrato, niveau, enz.); waarden die per noot worden vastgelegd (`attack`, `decay`, `sustain`, `release`, `scoop`, `scoopTime`, `vibDelay`, `spread`, `stagger`, `players`, `velocity`, `edge`) gelden voor de volgende noot.
- Parameters gaan in de motor zacht over (tijdconstante ongeveer 40 ms): geen klikken bij een tune- of presetwissel (niet beluisterd).

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Trompet:** `brightness` 1500 … 2400, `blat` 0,6 … 0,8, `attack` 0,03 … 0,05, `scoop` 20 … 35, `vibrato` 0,2 … 0,3, `players` 1.
- **Gedempte trompet:** `mute` 0,8 … 0,9, `edge` 0,25, `breath` 0,15.
- **Trombone of hoorn:** `transpose` −12 (of speel lage noten), `brightness` 600 … 1000, `swell` 0,14 … 0,2, `attack` 0,07 … 0,12, `scoop` 12 … 45.
- **Sectie:** `players` 3 … 4, `spread` 8 … 12, `stagger` 10 … 20, `width` 0,8 … 1, `blat` 0,7.
- **Stab:** `attack` 0,005 … 0,01, `decay` 0,08 … 0,15, `sustain` 0,3 … 0,55, `release` 0,07 … 0,1, `blat` 0,85 … 1, `swell` 0,02 … 0,04, `vibrato` 0.
- **Swell:** `attack` 0,5 … 0,9, `swell` 0,5 … 1, `blat` 0,9 … 1, `players` 4, `stagger` 40 … 60, `sustain` 0,9 … 1. Een lange `attack` heeft lange noten nodig.
- **Ballad:** `brightness` 650 … 1000, `blat` 0,3, `vibrato` 0,35 … 0,45, `vibDelay` 0,3, `mute` 0,15 … 0,3.

## Wat een tune niet moet doen

- `level` of `expression` op 0: stil. `sustain` 0 met een lange `decay`: de noot sterft vanzelf, ook als je hem aanhoudt.
- `attack` langer dan de nootlengte: de noot is voorbij voor hij opkomt.
- `brightness` 250 met `mute` 1 en `blat` 1: nauwelijks hoorbaar (niet beluisterd).
- `players` 4 met een lange `release` en veel gelijktijdige noten: dan zijn de 32 stemmen op en nemen nieuwe noten oude over.
- `resonance` 5 met een hoge `edge`: een scherpe, schreeuwende toon.
- Geen velden verzinnen en geen `preset` anders dan `Custom`.

## Bewaker

De motor accepteert alleen eindige berichten (een niet-eindige waarde in een nootbericht of parameterbericht wordt genegeerd of afgekapt), en de wachtrij is begrensd (1024). Per blok controleert hij de toestanden van elke stem (filter, fase, envelope), de busfilters en de uitgang; een stem waarvan het uitgangssignaal niet eindig of absurd groot is (boven 50) wordt gewist, een niet-eindige busfilter-toestand wordt op 0 gezet en een niet-eindige uitgangsstand wordt als 0 doorgegeven. `process` vangt fouten op en geeft dan stilte. Het filter is een TPT-toestandsfilter dat voor elke positieve cutoff en Q stabiel is, en de cutoff wordt begrensd tussen 40 Hz en 0,45 maal de samplefrequentie (maximaal 16 kHz).

Getest (zie hieronder in "Controleren"): 80 renders van zes seconden met willekeurige en extreme instellingen, alle noten 0 … 127, vreemde velocity en duur (`NaN`, `Infinity`, 1e9, negatief), een stoot niet-eindige parameterberichten en een transportstop gaf 0 niet-eindige samples bij 46 miljoen. Met opzettelijk vergiftigde stemfilters en busfilters (NaN en Infinity) is de uitvoer meteen weer eindig en klinkt een volgende noot gewoon.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.brass-section` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`. Zet liever alle velden erin.

```json
{ "name": "Funk Stab", "kind": "set", "version": "1.0.0",
  "state": { "brightness": 2400, "blat": 0.9, "swell": 0.03, "resonance": 1.2, "edge": 0.55, "mute": 0, "velBright": 0.6,
             "attack": 0.01, "decay": 0.12, "sustain": 0.55, "release": 0.09, "scoop": 25, "scoopTime": 0.04, "breath": 0.2, "velocity": 0.8,
             "players": 3, "spread": 9, "stagger": 6, "width": 0.6, "vibrato": 0, "vibRate": 5.3, "vibDelay": 0.4,
             "transpose": 0, "expression": 0.9, "level": 0.8, "preset": "Custom" } }
```

Het pack `../../../tunes/brass-section.patchkamer-tunes.json` heeft 32 tunes in 8 mappen (Trumpet, Trombone, Horn, Section, Stabs, Swells, Funk, Ballad), met `tags` (`instrument/brass`, `instrument/brass/trumpet`, `.../trombone`, `.../section`, `style/funk`, `style/ballad`).

## Controleren

- Vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/BrassSection/brass-section.patchkamer-device.js` (en met `--lang en` en `--lang nl`). Dat moet `OK` geven, zonder `let op`.
- Motor in Node benchmarken en op niet-eindige waarden testen: laad het apparaat met een nep-`AudioContext`, vang de workletcode op via `host.loadWorklet` en haal `BrassEngine` eruit; gebruik `engine.enqueue(...)` en `engine.render(L, R, 128, t)`. Gemeten (Node, blokken van 128 samples bij 48 kHz, budget 2,67 ms): 32 stemmen (acht noten met vier spelers) gemiddeld 3,1% van het budget, p99 4,9%, maximum 10%; één stem 0,3%.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is. De klank van dit apparaat is nog niet beluisterd.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van Brass Section: [NL](../../../docs/synths/USER-MANUAL_NL.md#brass-section) · [EN](../../../docs/synths/USER-MANUAL_EN.md#brass-section).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [brass-section.patchkamer-tunes.json](../../../tunes/brass-section.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: polyfoon koper (32 stemmen) voor melodielijnen, stabs, swells en secties. Noten op `notes`, audio uit `out` (stereo). Stuur hem met een sequencer die `dur` meestuurt; er zit geen galm in, zet er een effect achter.
