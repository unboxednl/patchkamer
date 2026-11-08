# AGENTS.md: Guitar

Dit bestand is voor AI-agents die **tunes voor Guitar** maken of het apparaat bijwerken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Guitar geldt.

## Wat Guitar is

De geplukte-snarenfamilie met een eigen motor (`GuitarEngine`) in een AudioWorklet. Zeven **typen**, te kiezen met `type`: `steel` (staalsnarige akoestische gitaar), `nylon` (klassieke gitaar), `clean` (elektrisch, clean), `overdrive` (elektrisch met een versterker die vervormt), `muted` (elektrisch met palm mute), `twelve` (12-snarig: octaafparen en verstemde paren) en `bass` (basgitaar). De motor is een **digitale golfgeleider** (uitgebreid Karplus-Strong): geen samples en geen tabellen per noot.

- **Snaar:** een vertragingslijn met fractionele (kubische Lagrange) uitlezing, waarin een lus draait met een eenpolige demping (de hoge tonen sterven eerst), een lusversterking uit de klankduur en een of twee allpass-secties voor **snaarstijfheid** (dispersie: de boventonen lopen scherp, gekozen zodat de tiende deelton `stiff` × ongeveer 9 cent scherp staat, voor lage noten de helft). De fasevertraging van de demping en de allpass-secties wordt bij de grondtoon van de lijnlengte afgetrokken, dus de grondtoon klopt (gemeten: 0 cent afwijking bij A2 tot E5, bas en 12-snarig).
- **Pluk:** de lijn wordt gevuld met een driehoekige uitwijking (piek op de plukpositie `pickPos`) gemengd met gefilterde ruis waar een kam met dezelfde plukpositie op staat. `pick` (zachte vinger tot harde plectrum), `tone`, `velBright` en de aanslag bepalen de zachtheid van de pluk en de **demping in de lus**: een zachtere aanslag klinkt doffer (gemeten: zwaartepunt van het spectrum 1066 Hz bij velocity 0,25 en 2309 Hz bij 0,9 op een staalsnarige noot).
- **Pickup of microfoon:** een kam op de uitgang (`y[n] - c·y[n-m]`, `m = pickup-fractie × periode`): een pickup bij de brug klinkt dun, bij de hals vol. Bij de akoestische typen is de kamdiepte laag, bij de elektrische hoog.
- **Klankkast (akoestisch) of versterkerkast (elektrisch):** zes parallelle resonanties op de stereosom, per type een eigen set (`body`, `bodyTune`). **Versterker** (alleen bij `clean`, `overdrive`, `muted` en `bass`): een hoogdoorlaatfilter, een zachte verzadiger met een kleine asymmetrie (`drive`; het type `overdrive` heeft altijd minstens 0,4), en een tweepolig laagdoorlaatfilter (`ampTone`). Dit werkt op de som van alle snaren, dus akkoorden geven tussenmodulatie.
- **Een stem per snaar:** zes snaren (gitaar E2 A2 D3 G3 B3 E4, bas B0 E1 A1 D2 G2 C3) met elk één klinkende stem. Een losse noot gaat naar de snaar waarvan de frets (noot min open snaar) dicht bij de handpositie liggen; vrije snaren en open snaren krijgen de voorkeur; een snaar die nog vasthoudt, wordt ontlopen. Een nieuwe pluk op een snaar laat de oude stem 12 ms wegsterven. Er zijn 12 stemmen (6 actief, de rest sterft weg).
- **Hammer-on en pull-off:** een noot die op dezelfde snaar een lopende noot overlapt (de lopende noot is de laatste losse noot, hij duurt nog minstens 4 ms langer, het interval is hoogstens 12 halve tonen, de fret blijft 0 tot 24, en de noten komen niet tegelijk) wordt geen nieuwe pluk: de toonhoogte glijdt in `glide` ms naar de nieuwe noot, een hammer-on krijgt een kleine tik, een pull-off een kleine pluk erbij. Zet `legato` op `off` om dat uit te zetten. Een sequencer moet dus noten laten **overlappen** (een `dur` langer dan de stap) om hammer-ons te krijgen; aansluitende noten worden opnieuw geplukt.
- **Akkoorden en strum:** noten die op hetzelfde moment aankomen (binnen 4 ms) worden door de kaart als groep verwerkt: de groep krijgt stijgende snaren voor stijgende noten, zo compact mogelijk (de motor krijgt `str` en `grp` mee; een groep is nooit legato). Met `strum` > 0 spreidt de kaart de noten in de tijd (`strum` ms tussen de noten); `strumDir` is `down` (laag naar hoog), `up` (hoog naar laag) of `alt` (wisselt per akkoord). Een omlaag-strum klinkt licht luider op de lage snaren, een omhoog-strum op de hoge. Een groep van meer dan zes noten laat de rest door de motor plaatsen (dat kan snaren overnemen).
- **Buiging:** het contract kent geen toonhoogtegebeurtenis op noten, dus er is een regelaar `bend` (halve tonen, −12 … 12, werkt op de lopende snaren en glijdt zacht), een `cc` met id `bend` of `pitchbend` (waarde 0 … 1, 0,5 = midden, uitslag `bendRange` halve tonen, op het tijdstip van de gebeurtenis), en de paarse mod-ingang. Een buiging verandert de vertraging van de lus soepel (gemeten: geen sprongen).
- **Snaarruis:** een korte ruisstoot bij de aanslag (kleur en duur per type) en een piepend geluid dat meegaat met de snelheid van een glijding of buiging (`noise`).
- **Stereo:** de snaren staan van laag (links) naar hoog (rechts) in het beeld (`width`).

Er zit **geen sequencer en geen effect** (galm, chorus, delay) in: het apparaat speelt alleen de noten van de ingang `notes`, of de knoppen Test note en Test chord op de kaart.

### Verschil met Karplus String, Low Bass en Sub Line

- **Karplus String** (`../KarplusString/`, id `nl.patchkamer.string`): een Karplus-Strong-model met acht stemmen, een eigen klavier van twee octaven en een gestreken variant, bedoeld als losse snaar (gitaar, harp, koto, metaal). Het kent geen gitaartypen, geen snaarindeling, geen hammer-ons, geen strum, geen buiging en geen pickup of versterker. Guitar is de **gitaarfamilie**: zes snaren met één stem per snaar, speeltechniek (legato, strum, buiging) en elektrische typen. Verwijs in een tune voor Guitar nooit naar Karplus String; de twee delen geen state.
- **Low Bass** (`../LowBass/`) en **Sub Line** (`../SubLine/`) zijn synthesizerbassen (oscillatoren, filter, sub-oscillator; Sub Line met patroon en arpeggiator). De bas in Guitar (`type: bass`) is een basgitaar: een geplukte snaar met een pickup, geen oscillator. Wil je een synthbas of een sub, gebruik dan Low Bass of Sub Line.

| | |
|---|---|
| Bestand | `guitar.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.guitar`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Guitar` in alle talen; de poortnamen hebben een Nederlandse variant (`Keyboard / noten`, `Stereo gitaar`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo guitar, stereo) |
| Worklet | `nl-patchkamer-guitar-1-20-0`; verhoog het versienummer in de naam bij elke wijziging van de motorcode |
| Contract | v1.20 |
| Licentie apparaat | AGPL-3.0-or-later |

## De state

`getState()` geeft alle velden hieronder (24 getallen, `type`, `strumDir`, `legato` en `preset`; gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een waarde wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd. Een buig-`cc` is **geen** state.

### Pluk en snaar

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `tone` | Helderheid: zachtheid van de demping in de lus en van de pluk | 0 … 1 | 0,01 | 0,5 |
| `velBright` | Aanslagkleur: hoeveel een hardere aanslag helderder klinkt | 0 … 1 | 0,01 | 0,6 |
| `pick` | Plukhardheid: 0 = zachte vinger, 1 = harde plectrum (ook de duur en kleur van de plukruis) | 0 … 1 | 0,01 | 0,6 |
| `pickPos` | Plukpositie als deel van de snaarlengte: kleine waarden zijn dun en scherp, grotere rond | 0,04 … 0,5 | 0,005 | 0,14 |
| `stiff` | Snaarstijfheid (dispersie), als factor | 0 … 2 | 0,01 | 1 |
| `detune` | Verstemming van het tweede deel van een 12-snarig paar, cent (alleen de twee hoogste paren; de lage paren zijn octaafparen) | 0 … 25 | 0,5 | 6 |
| `noise` | Snaarruis: plukruis en glij-/buigpiep | 0 … 1 | 0,01 | 0,4 |

### Uitklank en kast

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `decay` | Klankduur: factor op de uitklank (log); de basis is per type en daalt met de toonhoogte | 0,2 … 4 | 0,01 | 1 |
| `release` | Dempertijd bij loslaten (60 dB over deze tijd, log); met een lange waarde klinkt een noot door ("laten klinken") | 0,03 … 3 | 0,01 | 0,4 |
| `mute` | Palm mute: kortere, doffere noten (het type `muted` heeft er altijd 0,7) | 0 … 1 | 0,01 | 0 |
| `body` | Klankkast (akoestisch) of versterkerkast (elektrisch): hoeveel resonantie bij de som komt | 0 … 1 | 0,01 | 0,5 |
| `bodyTune` | Kastafstemming: factor op de resonantiefrequenties (log) | 0,5 … 2 | 0,01 | 1 |

### Pickup en versterker

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `pickup` | Pickuppositie van de brug (0) naar de hals (1); bij akoestische typen waar het geluid wordt opgenomen | 0 … 1 | 0,01 | 0,4 |
| `drive` | Verzadiging in de versterker (alleen `clean`, `overdrive`, `muted`, `bass`; `overdrive` minstens 0,4) | 0 … 1 | 0,01 | 0 |
| `ampTone` | Versterkertoon: het laagdoorlaatfilter van de kast, 1,4 kHz (0) tot 6,3 kHz (1) (alleen bij de elektrische typen) | 0 … 1 | 0,01 | 0,7 |

### Spel en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `strum` | Strum-spreiding in ms tussen de noten van een akkoord; 0 = alles tegelijk. De kaart doet dit, niet de motor | 0 … 80 | 1 | 0 |
| `glide` | Legato-glijtijd van een hammer-on of pull-off, ms (log) | 5 … 600 | 1 | 30 |
| `bend` | Buiging in halve tonen, op de lopende snaren | −12 … 12 | 0,01 | 0 |
| `bendRange` | Uitslag van een buig-`cc` in halve tonen (alleen de kaart) | 1 … 12 | 0,5 | 2 |
| `velocity` | Hoeveel de aanslag het niveau bepaalt (0 = elke noot even hard) | 0 … 1 | 0,01 | 0,8 |
| `width` | Stereobreedte van de snaren | 0 … 1 | 0,01 | 0,5 |
| `tune` | Stemming, cent | −100 … 100 | 1 | 0 |
| `transpose` | Transpositie in halve tonen, door de kaart op het nootnummer toegepast (geldt voor nieuwe noten) | −24 … 24 | 1 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,8 |

### De velden `type`, `strumDir`, `legato` en `preset`

`type` is een tekst: `steel`, `nylon`, `clean`, `overdrive`, `muted`, `twelve` of `bass`. Een ongeldige waarde geeft `steel`. `strumDir` is `down`, `up` of `alt` (start `down`); `legato` is `on` of `off` (start `on`). `preset` is de naam van de gekozen klank in de keuzelijst **Sound**: `Steel Strummer`, `Nylon Classic`, `Clean Electric`, `Crunch Lead`, `Palm Mute Chug`, `Twelve-String Shimmer`, `Fingerstyle Bass` of `Custom`. Het is alleen een label; de keuzelijst zet de bijbehorende waarden en het type wel echt in de state. De kaart zet het op `Custom` zodra een regelaar, het type, de strumrichting of de hammer-ons verandert. **Zet in een tune `"preset": "Custom"`** en zet `type` altijd. Een ongeldige waarde van `preset` geeft `Steel Strummer`.

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`), `noteon` en `noteoff` (aangehouden toetsen), `cc` en `panic`/`allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot er een `panic` komt of de transport stopt: **een sequencer moet altijd `dur` meesturen**. Een `cc` met `id` gelijk aan een veld uit de tabellen (behalve `type`, `strumDir`, `legato`, `preset`, `strum`, `transpose` en `bendRange`) en `value` 0 … 1 zet dat veld lineair over zijn bereik en zet `preset` op `Custom`.
- **Buiging:** `{ type: 'cc', id: 'bend' | 'pitchbend', value }` met `value` 0 … 1 (0,5 is geen buiging) buigt alle klinkende en nieuwe snaren tot ±`bendRange` halve tonen. Het contract kent geen eigen toonhoogtegebeurtenis; dit is een afspraak van dit apparaat. Een transportstop of `panic` zet de buiging terug op 0.
- **Legato in een song:** laat nootlengtes overlappen. Voorbeeld op een zestiende-raster: een noot met `dur` van 1,5 stap gevolgd door de volgende noot na 1 stap geeft een hammer-on of pull-off; `dur` van 0,9 stap geeft een nieuwe pluk. Een groep van noten op hetzelfde moment (akkoord) is nooit legato.
- De kaart verwerkt inkomende noten een tik later (een `setTimeout` van 0 ms) om noten van één akkoord te verzamelen; het tijdstip van de noot (`time`) blijft gelijk, dus voor sequencers verandert er niets. Bij live spelen (zonder vooruitplanning) zit er hooguit een paar ms bij.
- Alle knoppen behalve `transpose`, `strum` en `bendRange` zijn stuurbaar via de paarse `mod`-ingang (één spoor: Guitar); de lijsten bewegen niet mee. Waarden die per noot worden vastgelegd (`tone`, `velBright`, `pick`, `pickPos`, `stiff`, `detune`, `decay`, `velocity`, `width`, `tune`, `noise`, `mute` bij het aanslaan, `release` bij het loslaten, `glide` bij een legato-overgang) gelden voor de volgende noot; de rest (`body`, `bodyTune`, `drive`, `ampTone`, `level`, `bend`) werkt op wat klinkt, in de motor zacht (tijdconstante ongeveer 40 ms).

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Staalsnarig:** `type: steel`, `tone` 0,3 … 0,75, `pick` 0,4 … 0,8, `pickPos` 0,11 … 0,2, `decay` 0,8 … 1,4, `body` 0,4 … 0,65.
- **Nylon:** `type: nylon`, `tone` 0,25 … 0,45, `pick` 0,05 … 0,3 (vinger), `pickPos` 0,18 … 0,25, `body` 0,55 … 0,7.
- **12-snarig:** `type: twelve`, `detune` 6 … 12, `tone` 0,5 … 0,8, `width` 0,6 … 0,85.
- **Clean:** `type: clean`, `pickup` 0,05 (brug, strak) … 0,9 (hals, vol), `ampTone` 0,5 … 0,95, `body` 0,3 … 0,5.
- **Crunch en rock:** `type: overdrive`, `drive` 0,25 (lichte breakup) … 0,9 (zwaar), `ampTone` 0,55 … 0,7, `pick` 0,8 voor strak akkoordwerk, voor een solo `decay` 2 … 2,4 en `pickup` 0,7.
- **Gedempt:** `type: muted` of een ander type met `mute` 0,5 … 0,8; `release` 0,05 voor staccato.
- **Bas:** `type: bass`, `tone` 0,1 … 0,8, `pick` 0,05 (vinger) … 0,9 (plectrum), `pickup` 0,1 … 0,9, `width` 0,05 … 0,1. Speel noten rond MIDI 23 … 55.
- **Strum:** `strum` 8 … 20 ms bij een ballade, 6 … 12 bij funk of rock; `strumDir` `alt` voor een levendig ritme.
- **Ambient:** `decay` 3 … 3,5, `release` 2 … 3, `strum` 40 … 60 ms, `width` 0,8 … 0,9.

## Wat een tune niet moet doen

- `level` op 0: stil. `tone` 0 met `velBright` 0: bijna alleen de grondtoon (niet beluisterd).
- `drive` 1 met `ampTone` 1 op `overdrive`: hard en schel (niet beluisterd).
- `stiff` 2 op hoge noten: duidelijk vals (de boventonen lopen ver uit het harmonische).
- Bas-tunes met `width` hoog: de lage noten wapperen door het beeld.
- Geen velden verzinnen, geen `preset` anders dan `Custom`, en altijd `type` zetten.
- Noten boven ongeveer MIDI 100 worden in toonhoogte begrensd; lagere noten dan de laagste snaar spelen gewoon, maar zijn dan een "gestemde" snaar.

## Bewaker

De motor accepteert alleen eindige berichten (een niet-eindige waarde in een nootbericht, buigbericht of parameterbericht wordt genegeerd of afgekapt, een nootlengte wordt begrensd), en de wachtrij is begrensd (2048). De lus van elke stem (de laagdoorlaattoestand, de allpass-toestanden, de lijnlengte en de piek van het blok) wordt per blok op eindigheid en grootte gecontroleerd en de stem wordt verwijderd als hij niet klopt; de mix wordt op ±50 begrensd (NaN wordt 0) voordat hij de versterker en de resonanties in gaat, de toestanden van de versterker, de resonanties en het gelijkspanningsfilter worden per blok gecontroleerd en op 0 gezet als ze niet eindig of absurd zijn, en de uitgang is een zachte begrenzer. Een kleine wisselende offset (1e-15) houdt de filters uit het denormale gebied. `process` vangt fouten op en geeft dan stilte.

Getest (zie hieronder in "Controleren"): 80 renders van zes seconden met willekeurige en extreme instellingen (alle knoppen op minimum of maximum, soms `NaN`, `Infinity`, 1e9, 1e30, tekst, `null`), willekeurige noten (ook ongeldige nootnummers en velocity's), nootlengtes, snaartoewijzingen, groepen, losse en gestapelde buig-, parameter- en stopberichten: 46 miljoen samples, 0 niet-eindig, hoogste uitvoerwaarde 0,98. Voor elk type alle 128 noten bij velocity 0,01 en 1, met standaard en extreme instellingen: 18,8 miljoen samples, 0 niet-eindig, hoogste waarde 0,93. Met opzettelijk vergiftigde lijn, laagdoorlaatfilter, versterker, resonanties en gelijkspanningsfilter (NaN en Infinity) is de uitvoer meteen weer eindig en klinkt een volgende noot gewoon (piek 0,28).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.guitar` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande gitaren, versterkers of pedalen in naam of omschrijving (gebruik "clean", "crunch", "overdrive"), en verzin geen persoon bij `author`. Zet liever alle velden erin.

```json
{ "name": "Power Chord Drive", "kind": "set", "version": "1.0.0",
  "state": { "type": "overdrive", "tone": 0.5, "velBright": 0.6, "pick": 0.9, "pickPos": 0.14, "stiff": 1, "detune": 6, "noise": 0.4,
             "decay": 1.1, "release": 0.3, "mute": 0, "body": 0.6, "bodyTune": 1, "pickup": 0.1, "drive": 0.8, "ampTone": 0.55,
             "strum": 8, "glide": 30, "bend": 0, "bendRange": 2, "velocity": 0.8, "width": 0.3, "tune": 0, "transpose": 0, "level": 0.8,
             "strumDir": "down", "legato": "on", "preset": "Custom" } }
```

Het pack `../../../tunes/guitar.patchkamer-tunes.json` heeft 40 tunes in 11 mappen (Acoustic 5, Nylon 4, 12-String 3, Clean 5, Crunch 4, Muted 3, Bass 5, Strum 3, Ambient 3, Funk 2, Rock 3), met `tags` op de mappen (`instrument/guitar/acoustic`, `.../nylon`, `.../12-string`, `.../electric`, `instrument/guitar`, `instrument/bass`, `style/ambient`, `style/funk`, `style/rock`). Het pack zelf heeft geen `tags`, zodat de basklanken niet als gitaar tellen.

## Controleren

- Vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Guitar/guitar.patchkamer-device.js` (en met `--lang en` en `--lang nl`). Dat moet `OK` geven, zonder `let op`.
- Motor in Node benchmarken en op niet-eindige waarden testen: laad het apparaat met een nep-`AudioContext`, vang de workletcode op via `host.loadWorklet` en haal `GuitarEngine` eruit (een `new Function` met `sampleRate`, `AudioWorkletProcessor` en `registerProcessor` en `return GuitarEngine`); gebruik `engine.enqueue(...)` (`note` met `str` en `grp`, `off`, `bend`, `params`, `stop`) en `engine.render(L, R, 128, t)`. Gemeten (Node, blokken van 128 samples bij 48 kHz, budget 2,67 ms, na opwarmen): één noot gemiddeld 0,4 … 0,8% van het budget (p99 ≤ 1,3%, maximum ≤ 15%); een akkoord van zes noten vier keer achter elkaar met strum gemiddeld 0,6 … 0,9%, p99 ≤ 3,9%, maximum ≤ 21%; een 12-snarig akkoord met buiging en legato gemiddeld 1,4%, p99 7,1%, maximum 27,6%; de zwaarste belasting (twaalf stemmen, 12-snarig, doorlopende buiging en glijdingen) gemiddeld 1,4%, p99 8,1%, maximum 29%. (Het allereerste blok van een run kan door het opwarmen van de JIT hoger zijn.)
- Klikken: bij loslaten, transportstop (met en zonder `stop`-bericht), een buigsprong van twee halve tonen en een hammer-on of pull-off zonder tik (alleen het glijden) is het tweede verschil van de uitvoer niet groter dan 1,4 keer de omgeving (typen `steel`, `overdrive`, `twelve`, `bass`). De tik bij een hammer-on of pull-off en de aanzet van een nieuwe pluk zijn bedoelde aanzetten. Zestig noten snel achter elkaar (afkappen) geeft buiten de aanzetten maximaal 1,9 keer het 99,9e percentiel.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is. De klank van dit apparaat is nog niet beluisterd.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van Guitar: [NL](../../../docs/synths/USER-MANUAL_NL.md#guitar) · [EN](../../../docs/synths/USER-MANUAL_EN.md#guitar).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [guitar.patchkamer-tunes.json](../../../tunes/guitar.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: akoestische en elektrische gitaar en basgitaar (zes snaren, één stem per snaar) voor akkoorden, begeleiding, melodie en baslijnen. Noten op `notes`, audio uit `out` (stereo). Stuur hem met een sequencer die `dur` meestuurt; laat noten overlappen voor hammer-ons. Er zit geen galm in, zet er een effect achter.
