# AGENTS.md: Layered Landscape

Dit bestand is voor AI-agents die **tunes voor Layered Landscape** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Layered Landscape geldt.

## Wat Layered Landscape is

Een vierlaags ambient-instrument. Vier lagen klinken tegelijk en vormen samen een "landschap":

| Laag | Index | Wat | Stemmen |
|---|---|---|---|
| Drone | 0 | lage, trage grondklank (een octaaf onder de grondtoon) | 2 |
| Pad | 1 | de hoofdklank, op de grondtoon | 6 |
| Atmos | 2 | hoge, lichte klank (een octaaf boven de grondtoon) | 4 |
| Noise | 3 | textuur: een ingebouwde procedurele geluidsbron (golven, regen, wind, …), op vaste toonhoogte C4 | 2 |

Drone, Pad en Atmos maken geluid met eigen golfbanken (16 families met elk 8 beelden die in elkaar overlopen) en zes **structuren** (hoe de oscillatoren samenwerken). Elke laag heeft een filter, twee trage LFO's, een eigen stereopositie en een send naar de ruimte en naar een shimmer (octaafverheffer). Daarna volgt een gezamenlijke stereo-ruimte (8 vertragingslijnen) met negen karakters, een master-effect (zeven soorten) en een zachte begrenzer. Elke laag werkt in een van vier **modi** (hold, sequence, notes, off).

Verder zijn er patronen per laag, twee opslagplaatsen voor een klank (A en B) met een morph ertussen, en een XY-vlak. Een eigen sample (bestand of opname) kan de Noise-laag voeden; **dat hoort niet in een tune** (zie "Wat niet in een tune hoort").

| | |
|---|---|
| Bestand | `layered-landscape.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.layeredlandscape`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Layered Landscape` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-ingang `in` (textuur of opname), audio-uitgang `out` (stereo), eventingangen `notes` (naar de gekozen laag), `drone`, `pad`, `atmos`, `noise` (naar die laag), modulatie-ingang `mod` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Wat je hier doet

Je maakt klanken (tunes) voor Layered Landscape en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## Hoe het apparaat speelt (belangrijk voor een tune)

- **Start van het landschap.** Een tune zet alleen de klank. Het landschap klinkt zodra de transportklok start of de gebruiker op **Start landscape** klikt. Dan krijgt elke laag in modus `hold` zijn noten: de grondtoon `root` (laag 0 een octaaf lager, laag 2 een octaaf hoger, laag 3 vast C4) plus het akkoord van die laag. De noten klinken vast door (`held`) tot het landschap stopt.
- **Wisselt de gebruiker van tune terwijl het landschap klinkt**, dan stopt het apparaat de oude klank en start het de nieuwe meteen weer.
- **Een tune kiest dus zelf wat er te horen is**: zet een laag die stil moet zijn op niveau 0 of op modus `off`.

## De state

`state` van een tune is wat `getPreset()` teruggeeft. Dat is `getState()` zonder vijf velden die niet bij een klank horen (`sampleData`, `sampleName`, `selectedLayer`, `selectedStep`, `visual`). Geef **alle andere velden** een waarde (een ontbrekend veld krijgt de standaard, maar een tune moet volledig zijn). Getallen buiten het bereik worden afgekapt, onbekende velden genegeerd, een ongeldige keuze of tekst geeft de standaard.

### Per laag (`l0` Drone, `l1` Pad, `l2` Atmos, `l3` Noise)

Schrijf `l<index><veld>`, bijvoorbeeld `l1cutoff`. De standaardwaarden verschillen per laag.

| Veld | Wat | Bereik | Standaard `l0` / `l1` / `l2` / `l3` |
|---|---|---|---|
| `level` | Niveau van de laag | 0 … 1 | 0,55 / 0,6 / 0,35 / 0,23 |
| `pan` | Stereopositie (−1 links, 1 rechts) | −1 … 1 | 0 / −0,12 / 0,2 / 0 |
| `blend` | Golfmorph: hoe ver de golfbank door zijn beelden loopt (donker/eenvoudig naar helder/rijk) | 0 … 1 | 0,25 / 0,45 / 0,55 / 0,4 |
| `cutoff` | Filter in Hz (logaritmisch) | 60 … 16000 | 1800 / 3800 / 6000 / 2600 |
| `resonance` | Resonantie van het filter | 0 … 1 | 0,15 voor alle lagen |
| `depth` | Bewegingsdiepte: hoeveel de twee LFO's de morph, positie, cutoff en toonhoogte laten bewegen | 0 … 1 | 0,2 / 0,35 / 0,25 / 0,3 |
| `rate1` | Snelheid LFO 1 in Hz (logaritmisch): stuurt de morph (en bij structuur `drone1` de detune) | 0,005 … 2 | 0,017 / 0,031 / 0,047 / 0,023 |
| `rate2` | Snelheid LFO 2 in Hz (logaritmisch): stuurt een heel lichte toonhoogtezwaai, de positie en de cutoff | 0,005 … 2 | 0,011 / 0,019 / 0,029 / 0,013 |
| `detune` | Spreiding van de oscillatoren in cent | 0 … 35 | 8 / 13 / 7 / 0 |
| `attack` | Opkomst in seconden (logaritmisch) | 0,02 … 10 | 2,5 / 2 / 1,5 / 2,5 |
| `release` | Uitklank in seconden (logaritmisch) | 0,05 … 20 | 8 / 7 / 6 / 5 |
| `transpose` | Transpositie in halve tonen | −24 … 24 | 0 voor alle lagen |
| `send` | Hoeveel van de laag naar de ruimte gaat | 0 … 1 | 0,5 / 0,65 / 0,75 / 0,45 |
| `shimmer` | Hoeveel naar de shimmer gaat (octaaf omhoog, in de ruimte gevoed) | 0 … 1 | 0,05 / 0,2 / 0,25 / 0,03 |

Alleen laag 3 (Noise) heeft ook: `l3noiseMix` (witte ruis bijmengen, 0 … 1, standaard 0,1) en `l3external` (niveau van de audio-ingang, 0 … 1, standaard 0; **laat 0**, dit is routing).

### Per laag, keuzes

| Veld | Wat | Waarden | Standaard `l0` / `l1` / `l2` / `l3` |
|---|---|---|---|
| `mode` | Wat de laag speelt | `hold` (vaste noten van grondtoon en akkoord), `sequence` (het eigen patroon), `notes` (alleen noten die binnenkomen), `off` (stil) | `hold` voor alle lagen |
| `structure` | Alleen laag 0, 1 en 2 | `drone1` (detune), `drone2` (tegengolf), `pad1` (drie oscillatoren), `pad2` (spectraal), `atmos1` (ringmodulatie), `atmos2` (fase-FM) | `drone2` / `pad1` / `atmos2` / `noise` (laag 3 gebruikt de structuur niet) |
| `wave` | Golffamilie, 16 stuks | 0 … 15 (zie hieronder) | 4 / 0 / 6 / 0 (laag 3 gebruikt hem niet) |
| `filter` | Filtertype | `lp`, `hp`, `bp`, `off` | `lp` voor alle lagen |
| `chord` | Het akkoord dat de laag speelt rond zijn noot | `single` (0), `major` (0 4 7), `minor` (0 3 7), `sus` (0 2 7), `fifth` (0 7) | `single` / `minor` / `fifth` / `single` |
| `mute`, `solo` | Mute en solo | `true` of `false` | `false`. **Zet ze in een tune altijd op `false`** |
| `length` | Aantal stappen van het patroon | 1 … 64 | 16 |
| `division` | Nootwaarde van een stap | 0,5 (1/32), 1 (1/16), 2 (1/8), 4 (1/4), 8 (1/2), 16 (1 maat), 32 (2 maten), 64 (4 maten), 128 (8 maten) | 16 / 8 / 4 / 2 |

De golffamilies (`wave`): 0 zachte sinus, 1 amberkleurige zaagtand, 2 hol riet, 3 gevouwen zijde, 4 laag getij, 5 houten koor, 6 glazen tuin, 7 koperen wolk, 8 luchtformanten, 9 verre klokken, 10 fluwelen stroom, 11 kristallen sluier, 12 warm stof, 13 bevroren klinkers, 14 spookorgel, 15 zilverlijn.

`l3texture` (Noise): `ocean` (getij), `rain`, `wind`, `forest` (nachtbos), `embers` (gloed), `tape` (tapelucht), `chimes` (windklokken), `hum` (diepe atmosfeer), `sample` (eigen sample; **niet voor een tune**, zonder sample klinkt hij stil).

### Globaal

| Veld | Wat | Bereik of waarden | Start |
|---|---|---|---|
| `root` | Grondtoon (MIDI-nootnummer van laag 1) | 24 … 84 (48 = C3) | 48 |
| `master` | Hoofdvolume | 0 … 1 | 0,8 |
| `space` | Grootte van de ruimte | 0 … 1 | 0,7 |
| `damping` | Demping van de ruimte (hoger = donkerder galm) | 0 … 1 | 0,4 |
| `room` | Karakter: `smallL`, `smallM`, `smallH` (klein), `largeL`, `largeM`, `largeH` (groot), `infinityL`, `infinityM`, `infinityH` (eindeloos); L = donker, M = neutraal, H = helder | keuzes | `largeM` |
| `freeze` | Houdt de galm vast: er gaat dan **geen nieuw geluid meer de ruimte in**. Niet gebruiken in een tune | `true`/`false` | `false` |
| `fx` | Master-effect: `off`, `tape` (echo), `reverse` (omgekeerde echo), `drive`, `crush`, `tilt` (tilt-EQ), `chorus` | keuzes | `tape` |
| `fxAmount` | Hoeveel van het effect | 0 … 1 | 0,25 |
| `fxTime` | Tijd of karakter van het effect (logaritmisch; bij `drive` de drive, bij `crush` de bitdiepte, bij `chorus` de snelheid) | 0,05 … 1,5 | 0,65 |
| `fxFeedback` | Feedback van de echo (`tape`, `reverse`) | 0 … 0,75 | 0,35 |
| `fxTone` | Helderheid van het effect (`tape`, `tilt`) | 0 … 1 | 0,5 |
| `fxSync` | Echotijd: `free` (volgt `fxTime`) of vast aan de klok: `2` (1/8), `3` (gepunte 1/8), `4` (1/4), `8` (1/2) | keuzes | `free` |
| `smooth` | Klankkarakter: `true` = zacht en vloeiend, `false` = oorspronkelijk en helderder | `true`/`false` | `true` |
| `sampleLoop` | Loop van het eigen sample; zonder sample zonder effect | `true`/`false` | `true` |
| `preset` | Naam van het gekozen landschap in de keuzelijst van de kaart (een van de twaalf ingebouwde: `Quiet Dawn`, `Arctic Glass`, `Deep Tide`, `Amber Cathedral`, `Forest After Rain`, `Warm Tape Memory`, `Frozen Observatory`, `Glass Pizzicato`, `Slow Orbit`, `Dusk Embers`, `Industrial Stillness`, `Open Sky`). Alleen de keuzelijst toont hem; hij verandert het geluid niet. Laat de standaard staan | keuzes | `Quiet Dawn` |
| `xAxis`, `yAxis` | Welke regelaars het XY-vlak stuurt (bediening, geen klank). Laat de standaard staan | een regelaar van het vlak | `l1blend` / `l2blend` |
| `sceneA`, `sceneB`, `morph` | De opgeslagen klanken A en B en de morph ertussen. Laat leeg (`""`) en `0` | | `""`, `""`, 0 |
| `noteTarget` | Naar welke laag de ingang `notes` gaat (routing). Laat de standaard staan | `pad`, `drone`, `atmos`, `noise`, `all` | `pad` |
| `patternData` | De vier patronen, zie hieronder | lijst van vier teksten | zie hieronder |

`getState()` geeft bovendien `sampleData` (het eigen sample, base64), `sampleName`, `selectedLayer`, `selectedStep` en `visual` terug; die horen **niet** in een tune.

### Het patroon (`patternData`)

`patternData` is een lijst van **vier teksten** (laag 0 t/m 3). Elke tekst is JSON met vier lijsten van **64** posities:

| Lijst | Wat een waarde betekent | Bereik |
|---|---|---|
| `notes` | Nootafstand in halve tonen ten opzichte van de grondtoon van de laag (`root`, laag 0 −12, laag 2 +12, laag 3 vast C4) | −24 … 36 |
| `velocity` | Aanslagsterkte; **0 betekent rust** (er klinkt dan niets) | 0 … 1 |
| `gate` | Duur van de noot als aantal stappen-eenheden: duur = `gate` × (nootwaarde `division`) | 0,1 … 8 |
| `motion` | Bewegingsmomentopname per stap, `null` (geen) of `{"blend":…,"cutoff":…,"pan":…}` | |

Alleen de eerste `length` stappen worden gespeeld, daarna begint het patroon opnieuw. Een stap speelt het akkoord van de laag (`chord`) rond de noot `root + nootafstand`. Een patroon klinkt alleen als `mode` van die laag `sequence` is. Een patroon met een noot op elke stap is een lopende lijn; zet `velocity` op 0 voor een rust. Een tune **hoeft maar één laag** een patroon te geven; de andere lagen blijven `hold` (ze houden dan hun standaardpatroon, dat ongebruikt blijft). Geef altijd alle vier de teksten. De standaardpatronen zijn viermaal `[0 0 0 0 3 3 3 3 -2 -2 -2 -2 5 5 5 5]` met aanslag op elke vierde stap.

De sequencer loopt mee met de transportklok: elke `division` zestiende noten komt de volgende stap. Zonder klok (alleen **Start landscape**) speelt er geen patroon, alleen `hold`.

### Wat een tune zet

- Alle velden van de tabellen hierboven, behalve de velden die staan als "laat de standaard staan" of als niet voor een tune.
- `patternData` met vier teksten (de standaard of een eigen patroon).
- Niets over de ingang `in`, kabels of een sample.

### Wat niet in een tune hoort

- `sampleData`, `sampleName` (staan niet in `getPreset()`; zouden de tune enorm groot maken).
- `l3texture: "sample"` en `l3external` groter dan 0 (routing en eigen opname).
- `freeze: true` (geen nieuw geluid in de ruimte).
- `mute: true` of `solo: true` (de tune is dan stil of onverwacht onvolledig).
- `selectedLayer`, `selectedStep`, `visual`: niet bij de klank.

## Bewaker

De audiomotor (een worklet, naam `nl-patchkamer-layered-landscape-1-11-0-…`) beschermt zich tegen `NaN` en `Infinity`: de externe ingang wordt begrensd op ±100 en `NaN` wordt 0; een parameter of noot met een niet-eindige waarde wordt genegeerd; en ziet de motor aan zijn uitvoer of toestand dat er toch iets niet-eindigs is binnengekomen, dan schoont hij zichzelf op (alle stemmen, ruimte en effect gewist, geheugen op nul) en klinkt het apparaat daarna gewoon weer bij de volgende noot. Het geluid in het normale gebied is bit-voor-bit gelijk aan dat van de oude versie. Een opschoning haalt wel de lopende stemmen weg: na zo'n ingreep klinkt een vastgehouden noot niet door.

## Tips voor tunes (neutrale taal)

- **Grondtoon.** Laag, donker: `root` 31 … 40. Midden: 43 … 52. Licht en open: 55 … 62. Laag 0 klinkt een octaaf lager, dus bij `root` 36 is dat 24 (diepe sub).
- **Niveau.** Een standaardlandschap geeft een gemiddeld niveau (RMS ruim 0,1 na de begrenzer). Houd tunes bij elkaar in niveau door `master` te stellen (0,6 … 1). Veel lagen luid én hoge `send`/`shimmer` laten de begrenzer werken; zet de som van de niveaus liever niet veel boven 1,5.
- **Opkomst.** Een tune hoort snel genoeg te beginnen: houd `attack` van het hoofdgeluid onder circa 4 seconden, anders is de tune de eerste seconden bijna stil.
- **Drone.** Een drone-tune: laag 0 `structure` `drone1` of `drone2`, `wave` 0, 4, 12 of 14, `chord` `single` of `fifth`, `cutoff` 600 … 1500, de rest stil of zacht.
- **Pad.** Laag 1 met `pad1` of `pad2`, `chord` `major`, `minor` of `sus`, `attack` 2 … 4, `release` 6 … 12.
- **Bellen en lichtpunten.** Laag 2 met `atmos2` of `atmos1`, `wave` 9 (klokken), 6 of 15, `shimmer` 0,3 … 0,6.
- **Textuur.** Laag 3 met `ocean`, `rain`, `wind`, `forest`, `embers`, `tape`, `chimes` of `hum` op niveau 0,1 … 0,5.
- **Ruimte.** Eindeloze ruimtes (`infinity…`) maken lange, ononderbroken landschappen. Voor een korte, droge klank: `smallM` met `space` 0,5.
- **Effect.** `tape` met `fxSync` `free` geeft een zwevende echo. `reverse` geeft opzwellende nagalm. `crush` en `drive` zijn vuil en passen bij lo-fi en industrieel.
- **Patroon.** Langzame patronen (`division` 8, 16 of 32) maken een bewegend landschap. Snel (`division` 1 … 4) geeft een arpeggio of puls; gebruik dan `attack` onder 0,3 en `release` 1,5 … 4 voor korte noten.
- **Speelbaar.** Zet een laag op `mode` `notes` voor een tune die je met een toetsenbord of sequencer bespeelt (`attack` 0,3 … 1,2).

## Wat een tune absoluut niet moet doen

- Alle vier de lagen op niveau 0 of op `off` zetten: de tune is dan stil.
- `mute` of `solo` op `true`.
- `attack` langer dan 5 seconden op de enige laag die klinkt (de tune lijkt de eerste seconden stil).
- Een patroon op een laag zetten zonder `mode` `sequence` (hoorbaar niets) of met `division` 128 en een lage `length` (een tune die minutenlang zwijgt).
- Velden verzinnen: alleen de sleutels hierboven bestaan.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft de standaardwaarden; `setState(getState())` geeft dezelfde state terug; ook `setPreset(getPreset())`.
- Getallen buiten het bereik worden afgekapt (`master: 1e9` wordt 1, `root: 1000` wordt 84); `NaN`, tekst of `null` geven de standaard.
- Een onbekende keuze (`room: "x"`, `fx: 5`, `chord: {}`) geeft de standaard. Onbekende velden worden genegeerd.
- In een patroon worden noten buiten −24 … 36 afgekapt, een ontbrekende lijst of tekst geeft het standaardpatroon.
- Na `setState` bouwt de kaart zichzelf opnieuw op, dus alle regelaars volgen.

## Controleren

- Vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/LayeredLandscape/layered-landscape.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`), start het landschap en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Layered Landscape: [NL](../../../docs/synths/USER-MANUAL_NL.md#layered-landscape) · [EN](../../../docs/synths/USER-MANUAL_EN.md#layered-landscape).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [layered-landscape-styles.patchkamer-tunes.json](../../../tunes/layered-landscape-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: ambient in vier lagen (drone, pad, atmosfeer, ruis). Noten op `notes` gaan naar de gekozen laag; de eventingangen `drone`, `pad`, `atmos` en `noise` sturen een eigen laag, audio uit `out` (stereo).

## Skins

Sinds 1.14.0 zijn alle knoppen en keuzelijsten via `host.ui.adopt` herkenbaar voor skins: knoppen hebben als `id` hun state- of params-sleutel (`l1cutoff`, `master`, `root`, `morph`, `length`, `stepnotes`, ...), keuzelijsten een id afgeleid van het (Nederlandse) label (`klankkarakter`, `ruimte`, `l0-mute`, ...); `role` is `param` of `select`, `group` is `start`, `mixer`, `xy`, `klank`, `sample`, `sequencer`, `ruimte` of `visual`. De drie canvassen (`canvas.xy` 180 px, `canvas.smp` 70 px, `canvas.scope` 64 px) volgen de CSS-hoogte, zodat een skin ze lager kan maken. De meegeleverde skin `Compact` (`skins/library/nl.patchkamer.layeredlandscape/compact.patchkamer-skin.json`) toont draaiknoppen met het label eronder, knoppen per groep in een kader en lagere canvassen (kaart 540 breed: smaller kan niet door de kaartkop met de lange titel). Zonder skin is alles gelijk aan voorheen.
