# AGENTS.md: Woodwinds

Dit bestand is voor AI-agents die **tunes voor Woodwinds** maken of het apparaat bijwerken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Woodwinds geldt.

## Wat Woodwinds is

Een houtblazersfamilie met een eigen motor (`WoodwindEngine`) in een AudioWorklet: dwarsfluit, klarinet, hobo, fagot, altsaxofoon, tenorsaxofoon, blokfluit en panfluit, gekozen met `type`. Elke noot start één tot drie **spelers**; elke speler is een eigen stem (samen 16 stemmen). Er zit **geen sequencer en geen effect** (galm, chorus) in: het apparaat speelt alleen de noten van de ingang `notes`, of de knoppen Test note en Test chord op de kaart.

**Methode: bron-filtermodel, geen natuurkundige simulatie van de buis.** Een stem is een harmonische reeks (tot 48 deeltonen, met de Chebyshev-recursie uit één fasegenerator) waarvan de toonhoogte exact vastligt; de sterkte van elke deeltoon komt per sub-blok van 32 samples uit een spectraal model van het type: een helling `h^-s` die met de blaasdruk meegaat (harder blazen is helderder), de even/oneven-verhouding (klarinet en panfluit: bijna alleen oneven deeltonen, een cilinder; hobo, fagot en saxofoon: de volle reeks, een kegel; fluit en blokfluit: een sterke grondtoon), tot drie formanten van de kast (bij hobo een sterke rond 1,1 kHz, bij fagot rond 480 Hz), een lowpass, overblazen (alleen de deeltonen op een veelvoud van 2 of 3 blijven over: een octaaf, bij klarinet en panfluit een twaalfde), beet (extra hoge deeltonen en een zachte verzadiger) en grom (amplitude- en toonmodulatie van 18 tot 46 Hz). Het luchtruis loopt door een **kam die op de toonhoogte is afgestemd**, alsof de buis de adem laat meeklinken, met een tik bij de aanzet (tongstoot of lipaanzet) en een kleine toonhoogtedip bij fluiten. Het vibrato begint na een vertraging, beweegt de toon én de blaasdruk, en een kleine menselijke drift beweegt toon en niveau. Een noot die een lopende enkele noot overlapt, speelt **legato**: de stem blijft, de toonhoogte glijdt en er komt een kleine tik in plaats van een nieuwe aanzet. De toonhoogte is dus altijd goed (geen zelfoscillerende lus die op een verkeerde modus kan landen), en geen enkele noot blijft stil.

| | |
|---|---|
| Bestand | `woodwinds.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.woodwinds`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Woodwinds` in alle talen; de poortnamen hebben een Nederlandse variant (`Keyboard / noten`, `Stereo houtblazers`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo woodwinds, stereo) |
| Worklet | `nl-patchkamer-woodwinds-1-20-0`; verhoog het versienummer in de naam bij elke wijziging van de motorcode |
| Contract | v1.20 (het apparaat is gebouwd voor v1.20 en gevalideerd tegen de huidige validator) |
| Licentie apparaat | AGPL-3.0-or-later |

## Verschil met verwante apparaten

- **Formant Singer** zingt lettergrepen: een stemmodel met klinkerformanten die per lettergreep wisselen, tekstinvoer en een koor. Woodwinds heeft geen tekst en geen klinkers; zijn formanten liggen per type vast en horen bij de kast van een blaasinstrument.
- **Bowed Ensemble** is een strijkersensemble (zagen met strijkstokruis, ensemble-chorus en galm). Woodwinds heeft geen chorus of galm, wel luchtruis dat op de toonhoogte klinkt, overblazen en legato.
- **Cinematic Synth** is een filmsynth met pads, braams en een pulsmotor. Woodwinds is een solo- en sectie-instrument voor blaasmelodieën.
- **Brass Section** is koper: een zaagtand door een lowpassfilter dat openzwelt (blat), met een demper. Woodwinds bouwt het spectrum per deeltoon op (cilinder of kegel, formanten, overblazen), kent luchtruis in een afgestemde kam, aanzettik, vibrato met druk, legato met glijding en grom/beet voor riet. De twee delen de structuur (stemmen, spelers, bewaker) maar niet de klankopbouw.
- **Karplus String** en **Guitar** zijn snaarmodellen (golfgeleiders); Woodwinds is er geen.

## De state

`getState()` geeft alle velden hieronder (24 getallen en `type`, `legato` en `preset`; gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een waarde wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd.

### Type en toon

| Veld | Wat het doet | Waarden | Start |
|---|---|---|---|
| `type` | Het instrument | `flute`, `clarinet`, `oboe`, `bassoon`, `altosax`, `tenorsax`, `recorder`, `panflute` | `flute` |
| `tone` | Helderheid: verschuift de lowpass van het type (±1,5 octaaf) en de ruisband | 0 … 1, stap 0,01 | 0,5 |
| `body` | Formant: hoeveel van de formanten van het type te horen zijn (0 = vlak spectrum) | 0 … 1 | 0,8 |
| `reed` | Riet & straal: bij riet de rietstijfheid (stijver = helderder, meer hoge deeltonen), bij fluiten de straalsterkte (meer even deeltonen en lucht) | 0 … 1 | 0,5 |
| `bite` | Beet: extra hoge deeltonen (vanaf de derde) en een zachte verzadiger; 0 = zuiver | 0 … 1 | 0 |
| `growl` | Grom: amplitude- en toonmodulatie van 18 tot 46 Hz plus extra ruis; bij fluiten is het flatterzunge | 0 … 1 | 0 |
| `overblow` | Overblazen: naar het tweede register (alleen deeltonen op een veelvoud van 2, bij klarinet en panfluit van 3 blijven over, dus een octaaf of een twaalfde hoger) | 0 … 1 | 0 |

### Adem en aanzet

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `pressure` | Blaasdruk: harder, helderder en meer lucht (via de helling, de lowpass en het niveau); de aanslag telt mee | 0 … 1 | 0,6 |
| `breath` | Luchtruis ten opzichte van de toon (per type verschillend: fluiten en panfluit veel, riet weinig) | 0 … 1 | 0,3 |
| `chiff` | Aanzettik: korte ruisstoot, extra helderheid en een kleine overschrijding bij de aanzet; bij fluiten ook een toonhoogtedip | 0 … 1 | 0,4 |
| `attack` | Opkomst in seconden (exponentieel naar volle sterkte, 95% in deze tijd) | 0,005 … 1 (log) | 0,06 |
| `release` | Uitklank na het loslaten (60 dB over deze tijd) | 0,02 … 2 (log) | 0,15 |
| `velocity` | Hoeveel de aanslag de blaasdruk verschuift (0 = elke noot even hard) | 0 … 1 | 0,7 |

### Vibrato en legato

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `vibrato` | Diepte (1 = 38 cent) en, per type, ook diepte van de drukmodulatie | 0 … 1 | 0,3 |
| `vibRate` | Snelheid in Hz | 3 … 8 (log) | 5,2 |
| `vibDelay` | Vertraging voor het vibrato inzet (dan 0,5 s inzwellen), seconden | 0 … 2 | 0,5 |
| `glide` | Legato-glijtijd in ms (95% van de glijding) | 5 … 400 (log) | 60 |
| `legato` | `on` of `off`: overlappende enkele noten (binnen 12 halve tonen) nemen de stem over | `on`, `off` | `on` |
| `drift` | Menselijkheid: trage willekeurige drift van toon (tot ±4,5 cent) en niveau | 0 … 1 | 0,25 |

### Sectie en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `players` | Spelers per noot (geheel getal); met 3 spelers is er ruimte voor 5 noten tegelijk | 1 … 3 | 1 | 1 |
| `spread` | Verstemming tussen de spelers, cent | 0 … 30 | 0,5 | 8 |
| `width` | Stereobreedte van de spelers (bij 1 speler staat de stem in het midden) | 0 … 1 | 0,01 | 0,4 |
| `tune` | Stemming in cent | −100 … 100 | 1 | 0 |
| `transpose` | Transpositie in halve tonen, door de kaart op het nootnummer toegepast (geldt voor nieuwe noten) | −24 … 24 | 1 | 0 |
| `expression` | Expressie: tweede volumeregelaar voor swells (ook via `cc`) | 0 … 1 | 0,01 | 0,9 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,8 |

### Het veld `preset`

De naam van de gekozen klank in de keuzelijst **Sound**: `Concert Flute`, `Clarinet`, `Oboe`, `Bassoon`, `Alto Sax`, `Tenor Sax`, `Recorder`, `Pan Flute`, `Woodwind Section` of `Custom`. Het is alleen een label; de keuzelijst zet de bijbehorende waarden wel echt in de state. De kaart zet het op `Custom` zodra een knop verandert. **Zet in een tune `"preset": "Custom"`**: het apparaat zelf zet geen andere naam in een tune. Een ongeldige waarde geeft de startwaarde `Concert Flute`.

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`), `noteon` en `noteoff` (aangehouden toetsen), `cc` en `panic`/`allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot er een `panic` komt of de transport stopt: **een sequencer moet altijd `dur` meesturen**. Een `cc` met `id` gelijk aan een veld uit de tabellen (behalve `transpose`) en `value` 0 … 1 zet dat veld lineair over zijn bereik en zet `preset` op `Custom`; `cc` met `id` `bend` of `pitchbend` (0,5 = midden) buigt twee halve tonen omhoog of omlaag. Een transportstop laat alle noten in 0,15 s uitklinken en wist de noten die al vooruit zijn gepland.
- **Legato:** een nieuwe noot die een lopende **enkele** noot overlapt (de vorige noot klinkt nog en de nieuwe komt minstens 20 ms later, binnen 12 halve tonen) neemt dezelfde stem(men) over: de toonhoogte glijdt in `glide`, de omhulling begint niet opnieuw en er komt een kleine aanzettik. Akkoorden (noten binnen 40 ms van elkaar) gaan nooit legato. Laat sequencer-noten overlappen (`dur` langer dan de stap) voor legato; met `legato: off` krijgt elke noot een nieuwe aanzet. Het geldt alleen als het aantal spelers gelijk is aan dat van de vorige noot.
- Stemmen: 16. Elke noot neemt `players` stemmen. Zijn er niet genoeg vrije, dan wordt eerst de zachtste uitklinkende stem overgenomen, daarna de oudste. Een overgenomen stem houdt zijn niveau en fase vast (geen klik); alleen de toonhoogte springt.
- Alle knoppen behalve `players` en `transpose` zijn stuurbaar via de paarse `mod`-ingang (één spoor: Woodwinds); `type`, `legato` en `preset` bewegen niet mee. `attack`, `release`, `glide`, `vibDelay`, `spread`, `players` gelden voor de volgende noot; de rest werkt direct op lopende noten.
- Parameters gaan in de motor zacht over (tijdconstante ongeveer 40 ms): geen klikken bij een tune- of presetwissel (niet beluisterd). `type` geldt voor nieuwe noten; lopende noten klinken uit in hun oude type.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Dwarsfluit:** `breath` 0,3 … 0,6, `chiff` 0,4 … 0,6, `vibrato` 0,2 … 0,35, `attack` 0,06 … 0,1. Piccolo: `transpose` 12; altfluit: −5. `overblow` 0,5 … 0,7 met `pressure` 0,8 voor een geblazen octaafsprong.
- **Klarinet:** `breath` 0,15, `vibrato` 0,05 … 0,15 (klarinet speelt vaak zonder vibrato), `reed` 0,5 … 0,7. Basklarinet: `transpose` −24 en `tone` 0,3.
- **Hobo en althobo:** `body` 0,9 … 1, `reed` 0,6 … 0,8, `pressure` 0,55 … 0,7. Althobo: `transpose` −7.
- **Fagot:** `tone` 0,35 … 0,5, `attack` 0,05 … 0,12, `transpose` −12 voor contrafagot.
- **Saxofoon:** `bite` 0,1 … 0,5, `growl` 0,1 … 0,6 (tenor), `vibrato` 0,3 … 0,45 met `vibDelay` 0,3 … 0,4. Sopraan: altsax met `transpose` 12.
- **Blokfluit:** `tone` 0,35 … 0,65, `breath` 0,25 … 0,7, `vibrato` 0 … 0,1.
- **Panfluit:** `breath` 0,4 … 0,9, `chiff` 0,4 … 0,9, `attack` 0,03 … 0,1.
- **Sectie:** `players` 3, `spread` 9 … 12, `width` 0,7 … 0,8, `vibrato` 0,1 … 0,2, `breath` ≤ 0,25.
- **Ambient:** `attack` 0,6 … 0,9, `release` 1 … 1,4, `breath` 0,5 … 0,9, `drift` 0,5 … 0,6, `players` 2 … 3.

## Wat een tune niet moet doen

- `level` of `expression` op 0: stil. `pressure` 0 geeft nog een zachte toon (de motor kent geen stilte door druk alleen), maar `level` 0 is stil.
- `attack` langer dan de nootlengte: de noot is voorbij voor hij opkomt (het apparaat start dan wel en laat hem uitklinken).
- `overblow` 1 laat de grondtoon verdwijnen: de noot klinkt een octaaf of een twaalfde hoger dan gespeeld. Dat is bedoeld, maar zet het niet in een algemene tune.
- `players` 3 met een lange `release` en veel gelijktijdige noten: dan zijn de 16 stemmen op en nemen nieuwe noten oude over.
- Geen velden verzinnen en geen `preset` anders dan `Custom`.

## Bewaker

De motor accepteert alleen eindige berichten (een niet-eindige waarde in een nootbericht of parameterbericht wordt genegeerd of afgekapt, een onbekend type geeft de startwaarde) en de wachtrij is begrensd (2048). Per sub-blok controleert hij de uitgang, de ruisfilters, de omhulling, de fase en de ruissterkte van elke stem; een stem met een niet-eindige of absurde uitgang (boven 20, of een niet-eindige som: een NaN telt mee) wordt gewist en niet gemengd. Op de bus staat een gelijkspanningsfilter met een zachte begrenzer; een niet-eindige busstand wordt 0 en de busfilters worden teruggezet. Een niet-eindige parameterstand in de motor wordt teruggezet op de doelwaarde. `process` vangt fouten op en geeft dan stilte. De spectrale reeks heeft geen terugkoppeling (de Chebyshev-recursie loopt over één periode), dus de enige lus is de ruiskam, met terugkoppeling ≤ 0,92 en een genormeerde winst.

Getest (zie "Controleren"): 80 renders van 6,5 seconden met willekeurige en extreme instellingen (elke knop op minimum, maximum of willekeurig), alle typen en spelers, noten 0 … 127 (ook alle noten met stappen van 3 aan het eind), vreemde velocity en duur (`NaN`, `Infinity`, 1e9, 1e30, negatief, tekst, `null`), een stoot niet-eindige parameter- en buigberichten en transportstops gaf 0 niet-eindige samples bij 49,9 miljoen (grootste absolute waarde 0,99). Met opzettelijk vergiftigde stemtoestanden (kam, ruisfilter, deeltonen, fase, glijding, omhulling, frequentie, ruissterkte, attack) en vergiftigde bus- en parameterstanden is de uitvoer meteen weer eindig en klinkt een volgende noot gewoon.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.woodwinds` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande instrumenten in naam of omschrijving, en verzin geen persoon bij `author`. Zet liever alle velden erin.

```json
{ "name": "Smoky Tenor", "kind": "set", "version": "1.0.0",
  "state": { "tone": 0.4, "body": 0.8, "reed": 0.5, "bite": 0.3, "growl": 0.2, "overblow": 0,
             "pressure": 0.6, "breath": 0.45, "chiff": 0.5, "attack": 0.06, "release": 0.15, "velocity": 0.7,
             "vibrato": 0.25, "vibRate": 5.2, "vibDelay": 0.5, "glide": 60, "drift": 0.25,
             "players": 1, "spread": 8, "width": 0.4, "tune": 0, "transpose": 0, "expression": 0.9, "level": 0.8,
             "type": "tenorsax", "legato": "on", "preset": "Custom" } }
```

Het pack `../../../tunes/woodwinds.patchkamer-tunes.json` heeft 42 tunes in 12 mappen (Flute, Clarinet, Oboe, Bassoon, Sax, Recorder, Pan Flute, Section, Ballad, Jazz, Folk, Ambient), met `tags`: `instrument/woodwind` op het pack, `instrument/woodwind/flute`, `.../clarinet`, `.../oboe`, `.../sax` (standaardnamen van contract §13c), `.../bassoon`, `.../recorder`, `.../pan-flute` (eigen namen) en de stijlen `style/ballad`, `style/jazz`, `style/folk`, `style/ambient`.

## Controleren

- Vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Woodwinds/woodwinds.patchkamer-device.js` (en met `--lang en` en `--lang nl`). Dat moet `OK` geven, zonder `let op`.
- Motor in Node benchmarken en op niet-eindige waarden testen: laad het apparaat met een nep-`AudioContext`, vang de workletcode op via `host.loadWorklet` en haal `WoodwindEngine` eruit; gebruik `engine.enqueue(...)` en `engine.render(L, R, 128, t)`. Gemeten (Node, blokken van 128 samples bij 48 kHz, budget 2,67 ms): één stem (fluit) gemiddeld 1,1% van het budget, p99 5%; één lage fagotnoot (48 deeltonen) 0,8%; 16 stemmen op de lage noten van een tenorsax met beet, grom en overblazen gemiddeld 17%, p99 22%; 16 fagotstemmen 12%, p99 16%; vijf akkoorden met drie spelers (panfluit) 11%, p99 19%; 150 snelle noten 3%, p99 15%. Het eerste blok na het laden duurt langer (JIT, in de meting tot 7 maal het budget); daarna ligt het maximum onder 30%.
- Toonhoogte: elke type op noten 48, 60, 72 en 84 met vibrato, drift en aanzettik uit gaf een afwijking van hooguit 3,1 cent (autocorrelatie, meetnauwkeurigheid). Overblazen 1 geeft alleen deeltonen op een veelvoud van 2 (3 bij klarinet en panfluit).
- Klikken: de sprong tussen opeenvolgende samples bij de aanzet, een legato-overgang en het einde van een noot is hooguit 1,6 maal de grootste sprong in de gehouden toon (de fluit en panfluit halen dat door de ruisaanzet, niet door een klik).
- Een echte worklet in Chromium (nep-`AudioContext` vervangen door een echte, `--autoplay-policy=no-user-gesture-required`): alle acht typen geven een eindig signaal met de juiste toonhoogte (±3 Hz bij de autocorrelatie), zonder paginafouten.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is. De klank van dit apparaat is nog niet beluisterd: het spectrale model en de typewaarden (formanten, hellingen, ruis) zijn gekozen uit kennis van de instrumenten, niet met het gehoor afgesteld.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van instrumenten of fabrikanten in naam, label, commentaar of tune.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van Woodwinds: [NL](../../../docs/synths/USER-MANUAL_NL.md#woodwinds) · [EN](../../../docs/synths/USER-MANUAL_EN.md#woodwinds).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [woodwinds.patchkamer-tunes.json](../../../tunes/woodwinds.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: houtblazers voor melodielijnen, solo's, secties en pads. Noten op `notes`, audio uit `out` (stereo). Stuur hem met een sequencer die `dur` meestuurt (en laat noten overlappen voor legato); er zit geen galm in, zet er een effect achter.
