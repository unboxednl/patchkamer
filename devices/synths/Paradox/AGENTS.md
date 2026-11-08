# AGENTS.md: Paradox

Dit bestand is voor AI-agents die **tunes voor Paradox** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Paradox geldt.

## Wat Paradox is

Een experimentele synth die zelf meebeweegt. Elke stem is een sinus-synthese met onderlinge modulatie (FM), een wavefolder, een lowpass en een **niet-lineaire golfgeleider** (een korte terugkoppellus op de nootfrequentie, voor snaar- en buisklanken). Een **Lorenz-attractor** (chaos) laat toonhoogte, modulatiediepte en klank langzaam afdrijven. Een **cellulaire automaat** verzint op eigen houtje noten (het "organisme"). Een **granulaire stereo-geheugenlus** speelt stukjes van het eigen verleden terug, achteruit, stilstaand of versneld. Daarachter staan een bitcrusher met sample-and-hold, een gedempte resonante galm en een stereoveld met omloopbanen. Het apparaat is zelfstandig en heeft geen sequencer of patroon in de state: ritme ontstaat uit de celdeling (autonome gebeurtenissen) of uit het tempo van de studio (`sync`).

Het is een instrument voor drones, texturen, glitch, geluidsontwerp, filmische en donkere klanken, en bijzondere speelbare klanken. Het is geen gewone basis-, lead- of arpeggio-synth.

| | |
|---|---|
| Bestand | `paradox.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.paradox`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Paradox` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-ingang `feed` (Feed), audio-uitgang `out` (Escape), eventingang `notes` (Notes / CC), modulatie-ingang via de 18 stuurbare parameters (spoor `paradox`) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand (`paradox_v1.8.0.js`, in de map `drone synths`). De `id` en alle state-sleutels zijn gelijk gebleven, dus tunes en songs van het oude bestand laden ook hier.

## Wat je hier doet

Je maakt klanken (tunes) voor Paradox en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft. Er zijn 24 velden. Alle getallen worden bij `setState` afgekapt op het bereik; een ongeldige waarde (tekst, `NaN`, `null`) geeft de startwaarde.

### Keuzes en schakelaars

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `mode` | Anatomie: de basisklank van de stemmen (zie hieronder) | geheel getal 0 … 5 | 0 |
| `behavior` | Gedrag: wie noten speelt | `keys`, `drone` of `organism` | `organism` |
| `on` | Het apparaat klinkt (uit = stil, geheugen loopt wel door) | `true` of `false` | `true` |
| `follow` | Alleen klinken als de transportklok van de studio loopt | `true` of `false` | `false` |
| `sync` | Celdeling volgt het tempo van de studio in plaats van `rate` | `true` of `false` | `false` |
| `division` | Bij `sync`: hoe vaak per tel een celdeling plaatsvindt (0,25 = zestiende, 0,5 = achtste, 1 = kwart, 2 = half, 4 = maat, 8 = twee maten) | 0,25 / 0,5 / 1 / 2 / 4 / 8 | 1 |

`mode` (Anatomie):

| Waarde | Naam op de kaart | Klank |
|---|---|---|
| 0 | Plasma | Rond en FM-achtig: sinus met een zachte sub. De neutrale, veelzijdige basis |
| 1 | Glass flesh | Een octaaf hoger met een inharmonische boventoon: glas, bellen, mallets |
| 2 | Machine choir | Vocaal, formant-achtig: koren, adem, stemmen; vouwing maakt het rauwer |
| 3 | Swarm | Ringmodulatie-achtig, zwevend en onrustig: zwermen, metaal, bijen |
| 4 | Fault line | Ruw en digitaal: de bits van de cellulaire automaat vermengd met vouwing |
| 5 | Time leak | Zacht en terugkoppelend, veel sub: donkere, warme, traag kantelende klanken |

`behavior`:

- `keys`: alleen noten van buiten (toetsenbord, sequencer, de toetsen op de kaart) klinken. Gebruik dit voor alles wat bespeelbaar moet zijn.
- `drone`: er klinkt continu één stem op `root` (hij glijdt mee als `root` verandert), en noten van buiten klinken er bovenop. Gebruik dit voor drones en pads die zelf blijven staan.
- `organism`: de cellulaire automaat speelt zelf noten rond `root` (een vaste toonreeks: grondtoon, kleine terts, kwint, kleine septiem en hogere octaven en benaderingen daarvan) met `rate` en `density`. Noten van buiten klinken er ook bij. Gebruik dit voor generatieve texturen, glitch en ritme.

### Knoppen

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `matter` | Materie. Verhouding zachte massa tegenover harde, inharmonische boventonen. Bij ongeveer 0,5 resoneert de golfgeleider precies op de nootfrequentie (zuivere snaar); lager en hoger stemmen hem af (metaal, buis) | 0 … 1 | 0,52 |
| `mutation` | Mutatie. Hoeveel de Lorenz-chaos de fase, de stemming (tot enkele halve tonen) en de FM-diepte vervormt. Boven 0,7 krijgen autonome noten ook een willekeurige toonhoogte-afwijking | 0 … 1 | 0,54 |
| `friction` | Wrijving. Terugkoppeling van de stem en sterkte van de golfgeleider: laag = FM-klank, hoog = snaar, buis of krassend organisme. Boven 0,9 een lang naklinkende resonantie | 0 … 1 | 0,38 |
| `fold` | Vouwing. Wavefolder: vouwt de golfvorm terug in zichzelf, meer boventonen | 0 … 1 | 0,35 |
| `fracture` | Breuk. Bitcrusher plus sample-and-hold; 0 is werkelijk schoon, boven 0,5 duidelijk digitaal | 0 … 1 | 0,12 |
| `memory` | Geheugen. Hoeveel van de granulaire geheugenlus wordt bijgemengd (en hoeveel terugkoppeling tussen links en rechts) | 0 … 1 | 0,3 |
| `warp` | Tijdrichting. Leessnelheid van het geheugen: 0 = achteruit, 0,5 = bijna stilstaand (bevroren), 1 = versneld vooruit | 0 … 1 | 0,64 |
| `size` | Korrelgrootte en afstand in het verleden: laag = nerveuze splinters, hoog = lange flarden | 0 … 1 | 0,42 |
| `space` | Ruimte. Gedempte resonante galm | 0 … 1 | 0,32 |
| `orbit` | Baan. Stereobreedte en omloopbeweging van de stemmen, plus een lichte detune | 0 … 1 | 0,6 |
| `life` | Leven. Snelheid van de attractor: hoger = sneller afdrijven en grilliger | 0 … 1 | 0,56 |
| `density` | Bevolking. Kans, duur en overlap van de autonome noten (alleen bij `organism`) | 0 … 1 | 0,56 |
| `input` | Voeding. Hoeveel van de audio-ingang `feed` door de stemmen, de golfgeleider en het geheugen gaat | 0 … 1 | 0 |
| `rate` | Celdeling in Hz: autonome gebeurtenissen per seconde (genegeerd bij `sync`) | 0,12 … 12 | 2,8 |
| `root` | Grondtoon als MIDI-nootnummer voor `drone`, `organism`, `bang` en de toetsen op de kaart. Externe noten behouden hun eigen toonhoogte | 24 … 84 (geheel) | 48 |
| `attack` | Geboorte: opkomsttijd van iedere stem in seconden | 0,003 … 2 | 0,024 |
| `release` | Verval: uitsterftijd in seconden na een noot of autonome gebeurtenis | 0,03 … 8 | 1,3 |
| `level` | Uitgang: totaalniveau (de uitgang wordt hiermee vermenigvuldigd) | 0 … 1 | 0,55 |

`getState()` geeft precies deze 24 velden terug, allemaal gewone JSON. Niet in de state (en dus niet in een tune): de toestand van het geheugen en of het bevroren is (knop Freeze memory), de stand van de attractor en de cellulaire automaat. Een tune hoort alle 24 velden te bevatten.

### Wat een tune niet in de state zet

Het apparaat heeft geen routing in de state. Zet geen testnoot, geen `bpm` en geen onbekende velden in een tune; ze worden genegeerd. `on` en `follow` laat je op `true` en `false` staan, tenzij het de bedoeling is dat de tune stil start of alleen met de transportklok klinkt.

## Noten, polyfonie en gedrag

- Maximaal **6 stemmen**. Is de populatie vol, dan laat het apparaat nieuwe noten voorbijgaan (er is geen stemstelen). Een tune met `drone` gebruikt er altijd één voor de drone, en `organism` met hoge `rate`, hoge `density` en lange `release` kan alle stemmen bezetten: speel dan niet ook een akkoord erbij.
- Een noot van buiten klinkt tot de noot-uit, plus `release`. Een noot van de cellulaire automaat heeft een eigen korte duur (afhankelijk van `density` en `rate`).
- De uitgang is begrensd (zachte verzadiging op 0,78), dus de piek blijft onder 0,8 bij `level` 1 en loopt dus nooit uit de hand. De klank hangt wel sterk af van de instelling: het gemiddelde niveau verschilt per tune, dus stel `level` per tune af (zie hieronder).
- De klank is **niet deterministisch**: stemmen krijgen een willekeurige pan, detune en fase, en de chaos begint steeds op dezelfde plek maar de ruis niet. Twee keer dezelfde noot klinkt dus nooit exact gelijk. Test niveaus daarom over meerdere noten of seeds.

## Wat een goede tune is

Een goede tune is een klank die je kunt spelen: een noot of akkoord op het toetsenbord geeft meteen iets bruikbaars, of (bij `drone` en `organism`) begint de tune vanzelf te leven. Paradox is sterk in klanken die niet in een gewone synth zitten; maak daarom geen kopieën van standaardklanken.

Tips per rol (alle waarden zijn richtingen, geen regels):

- **Drone en pad**: `behavior` `drone` (blijft zelf staan) of `keys` (speelbaar). `attack` 0,6 … 2, `release` 3 … 6, veel `space` (0,5 … 0,85), `memory` 0,3 … 0,75, lage `fold`, `mutation` onder 0,4. `mode` 0, 2 of 5. `life` laag (0,1 … 0,25) voor rustig afdrijven.
- **Snaar, mallet, bel**: `behavior` `keys`, `attack` 0,003 … 0,004, `friction` 0,6 … 0,95 (golfgeleider), `matter` rond 0,5 voor een zuivere toon of 0,6 … 0,85 voor een inharmonische bel, `mode` 0 of 1, `release` 1,5 … 6, `fracture` 0.
- **Bas**: `root` en noten rond 24 … 43, `mode` 0, 4 of 5, `fold` 0,3 … 0,85 voor tanden, korte `release` (0,2 … 0,6), weinig `space` en `memory`, `fracture` 0 … 0,4.
- **Lead**: `behavior` `keys`, `attack` 0,01 … 0,2, `release` 0,5 … 1,6, `mode` 0, 1, 2 of 4, `friction` 0,35 … 0,55, een beetje `fold`, `mutation` 0,1 … 0,8 voor leven.
- **Akkoord en toetsen**: `keys`, een niet te lange `release` (anders raakt het stemmenbestand vol), `orbit` hoog voor breedte.
- **Generatief ritme of arpeggio-achtig**: `behavior` `organism` met `sync` aan en `division` 0,25 of 0,5 (volgt het tempo van de studio), of `rate` 3 … 12 met hoge `density` en korte `release` (0,05 … 0,3). Er is geen patroon in de state: de volgorde van de noten komt uit de cellulaire automaat en wijkt per keer af.
- **Glitch en noise**: `fracture` 0,4 … 0,95, `fold` 0,6 … 1, `mode` 4 of 3, `size` laag (0,05 … 0,2), korte `release`.
- **Geluid van een ingang bewerken**: `input` 0,5 … 0,9 met `friction` hoog (0,8 … 0,96) en `matter` rond 0,5 laat de ingang een snaar laten resoneren. Zonder iets op `feed` klinkt zo'n tune alleen als je er zelf noten op speelt.

## Ontsporen en stilvallen

- **Niet-lineaire delen en chaos zijn begrensd** door het ontwerp: de golfgeleider zit in een verzadiging, de Lorenz-toestand wordt afgekapt, de geheugenlus gaat door een `tanh` en de uitgang door een tweede. In het hele bereik (alle knoppen op hun minimum of maximum, modulatie ±1, willekeurige noten, tempo 20 … 400) kwam de uitvoer nooit boven 0,78 en nooit `NaN` of `Infinity`.
- **Bewaker.** De klankmotor controleert per blok van de uitvoer of er een niet-eindige of absurde waarde in zit (boven 4). Is dat zo, dan wist hij het geheugen, de galm, de stemmen en de besturing en gaat het geluid door, in plaats van voor altijd stil te blijven. Een state met een ontbrekend of niet-eindig getal wordt door de motor geweigerd (de vorige blijft). In het normale gebied is het geluid bit-identiek aan dat van de oude versie (0 afwijkende samples in 160 renders met willekeurige en extreme instellingen en in 110 renders via de worklet).
- **Waar een tune niet moet zitten**: `mutation` boven 0,9 met `life` boven 0,9 en `fold` boven 0,9 tegelijk is het chaotische uiterste (alles klinkt dan als ruis met toonhoogte-sprongen, ook al is het begrensd); gebruik dat alleen bewust in Noise. Zet `level` niet boven de waarde die de piek onder 0,9 houdt. Laat `follow` niet aanstaan in een tune die zonder transportklok moet klinken. Combineer geen `memory` boven 0,9 met `size` boven 0,9 en `warp` rond 0,5: de uitvoer wordt dan een traag, bijna stilstaand wolkje en valt op korte noten weg.
- Test extreme instellingen ook met een modulator op de parameters (modulatie ±1 klemt op het bereik).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.paradox` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Stel `level` per tune af zodat het gemiddelde niveau van alle tunes gelijk is (de tunes uit het meegeleverde pack zijn zo afgesteld dat het gemiddelde niveau tussen ongeveer -27 en -20 dBFS ligt, in een offline render van 8 tot 10 seconden, en de piek onder 0,45; sommige stille texturen staan al op `level` 1).

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Paradox/paradox.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is. Een offline render (`OfflineAudioContext`, en per stap plannen met `suspend`) geeft wel piek, gemiddeld niveau en `NaN`-controle.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`rate: 1e9` wordt 12, `root: 1e9` wordt 84); een tekst, `NaN`, `null` of ontbrekende waarde geeft de startwaarde.
- Een ongeldige `mode` (geen geheel getal 0 … 5), `behavior` of `division` geeft de startwaarde; een ongeldige `on`, `follow` of `sync` (geen `true` of `false`) ook.
- `root` wordt op een geheel getal afgerond. Onbekende velden worden genegeerd. Zet er geen in.
- `setState(getState())` geeft dezelfde state, en de knoppen op de kaart bewegen mee.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Paradox: [NL](../../../docs/synths/USER-MANUAL_NL.md#paradox) · [EN](../../../docs/synths/USER-MANUAL_EN.md#paradox).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [paradox-styles.patchkamer-tunes.json](../../../tunes/paradox-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: experimentele synth met eigen beweging (FM, wavefolder, golfgeleider), voor effecten en sfeer. Noten en CC op `notes`, audio uit `out` (Escape); `feed` is een audio-ingang.
