# AGENTS.md: Scale Arpeggiator

Dit bestand is voor AI-agents die dit apparaat configureren, er componeren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Scale Arpeggiator geldt.

## Wat Scale Arpeggiator is

Een geklokte arpeggiator. Hij neemt de noten die op de ingang `notes` klinken of worden vastgehouden (een toetsenbord, een akkoord uit een sequencer) en speelt ze om de beurt op de klok van de studio, in een patroon, over 1 tot 4 octaven. Het maakt **zelf geen geluid** en heeft geen eigen klok: het stuurt `note`-gebeurtenissen (`note`, `vel`, `time`, `dur`) naar de uitgang `notes`, die je met een synth verbindt. Een inkomende noot behoudt zijn eigen velocity (die vermenigvuldigd wordt met de knop Velocity); een wachtrij zorgt dat noten uit de toekomst niet te vroeg klinken.

| | |
|---|---|
| Bestand | `scale-arpeggiator.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.scale-arpeggiator`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Scale Arpeggiator` in alle talen; de poortnamen zijn Engels in alle talen (`Chord / keyboard`, `Arpeggio`; in- en uitgang delen de poort-id `notes`, daarom is er geen aparte Nederlandse naam) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `notes`, modulatie-ingang `mod`, eventuitgang `notes`; geen audio |
| Contract | v1.14 (apparaatversie 1.14.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe vorm van een ouder, Nederlandstalig bestand met een andere naam en id (`nl.patchkamer.toonladder`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Het is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het presetpack staat in `../../../presets/scale-arpeggiator.patchkamer-presets.json`; formaat volgens contract §13c, `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.scale-arpeggiator`, elke preset is `kind: "set"`. Een preset bevat het patroon, niet het akkoord: de noten komen van de gebruiker.

## De state

Er zijn geen `getPreset`/`setPreset`: een preset is de hele `getState()`. De state is gewone JSON.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `mode` | Patroon: `up` omhoog, `down` omlaag, `updown` heen en terug (eindpunten één keer), `updown2` heen en terug met herhaalde eindpunten, `order` speelvolgorde (zoals ingespeeld), `random` willekeurig, `chord` alle noten tegelijk als puls, `converge` laag-hoog-laag-hoog naar het midden, `thumb` de laagste noot om de andere noot, daartussen omhoog | een van die negen | `up` |
| `rate` | Snelheid (index): 0 = 1/32, 1 = 1/16, 2 = 1/8, 3 = 1/4, 4 = 1/2, 5 = 1/64, 6 = 1/16 triool, 7 = 1/8 triool, 8 = 1/32 triool | hele getallen 0 … 8 | 2 |
| `octaves` | Aantal octaven waarover het akkoord herhaald wordt (noten boven 127 vervallen) | hele getallen 1 … 4 | 2 |
| `gate` | Nootlengte als deel van de snelheid | 0,1 … 1,5 | 0,7 |
| `velocity` | Velocity-factor (× de velocity van de inkomende noot) | 0,05 … 1 | 0,85 |
| `latch` | Het akkoord blijft klinken tot een nieuw akkoord begint of Wissen | `true`/`false` | `false` |
| `enabled` | `true` arpeggio, `false` doorvoer: de inkomende gebeurtenissen gaan ongewijzigd door | `true`/`false` | `true` |
| `seed` | Zaad van `random` en van de speelkans (zelfde zaad en ingang = dezelfde reeks) | hele getallen 0 … 4294967295 | 12345 |
| `plen` | Lengte van het velocity- en lengte-patroon in noten | hele getallen 1 … 16 | 1 |
| `vpat` | **Velocity-patroon**: 16 getallen; de n-de gespeelde noot van de cyclus (modulo `plen`) krijgt de velocity × dit getal. Alleen de eerste `plen` tellen | 16 × 0,05 … 1 | 16 × 1 |
| `gpat` | **Lengte-patroon**: 16 getallen; vermenigvuldigt de nootlengte (korte staccato noten en lange noten afwisselen) | 16 × 0,1 … 1 | 16 × 1 |
| `accent` | Optelling bij de velocity (tot +0,3) voor noten die precies op een tel (elke vierde zestiende) vallen | 0 … 1 | 0 |
| `ghost` | Noten die niet op een achtste vallen worden zachter: velocity × (1 − 0,6 × waarde) | 0 … 1 | 0 |
| `human` | Willekeurige velocity (±0,25 × waarde) en lichte vertraging (hoogstens 0,3 × de notenduur × waarde) | 0 … 1 | 0 |
| `chance` | Kans dat een noot gespeeld wordt (de teller loopt gewoon door; 1 = altijd) | 0 … 1 | 1 |
| `repeat` | Herhalingen per noot (een roll): de nootduur wordt verdeeld, elke herhaling 12% zachter | hele getallen 1 … 4 | 1 |

Getallen buiten het bereik worden afgekapt; tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde. Een onbekend patroon geeft `up`. Een patroonlijst met rommel krijgt per ongeldig element de waarde 1.

### Hoe het speelt

Op de klok van de studio (`onStep`, elke zestiende) speelt het apparaat een noot per rasterstap: bij `rate` 0 twee per zestiende, 5 vier per zestiende, 6, 7 en 8 op driedelige afstanden (3 per 2 zestienden, 3 per 4 zestienden en 3 per zestiende). Een noot die op een stap valt waar nog geen akkoord klinkt wordt later alsnog gespeeld zodra de noot met die tijd binnenkomt (de host plant ongeveer 100 ms vooruit). De transportstop zet alles terug en stuurt `allnotesoff`. `cc`-gebeurtenissen gaan altijd ongewijzigd door.

## Componeren met Scale Arpeggiator

Het apparaat componeert niets zelf: de **akkoordprogressie** komt van een toetsenbord, een akkoord-sequencer of een agent die noten naar de ingang stuurt. Jij kiest patroon, snelheid en dynamiek. Voor de progressie laat je bijvoorbeeld Chord Sequencer (spoor A) of een toetsenbord de akkoorden spelen en sluit je die aan op de ingang.

### Raster en toonlengte

- `rate` 1 (1/16) is de standaard voor arps en pluck-lijnen; 2 (1/8) voor rustiger, pad-achtig werk; 0 (1/32) voor snelle runs, trillers en schitterende arps; 5 (1/64) alleen voor sprays en glissando-achtige effecten; 6, 7 en 8 voor triolen (jazz, shuffle, hiphop).
- `gate` 0,2 … 0,35 is staccato (pluck, trance, techno), 0,5 … 0,7 normaal, 0,9 … 1,2 legato, boven 1 overlappende noten (alleen met een polyfone synth of bewust een zwevend effect).
- `repeat` 2 … 4 maakt van elke noot een roll (ratchet); gebruik dat op `rate` 1 of 2.
- Met `gpat` (lengte-patroon) wissel je staccato en legato: `[0.15, 1, 0.15, 1]` geeft korte en lange noten om de beurt.

### Velocity en dynamiek

- **Accent op de tel**: zet `vpat` `[1, 0.6, 0.8, 0.6]` met `plen` 4 op `rate` 1: de eerste van elke vier is het hardst. `accent` 0,5 … 1 voegt dat voor de echte tellen toe, ook als de cyclus langer is dan een tel.
- **Ghost notes**: `ghost` 0,4 … 0,9 maakt de noten tussen de achtsten zacht; of een `vpat` met 0,2 … 0,35 op de tussenplaatsen (funk: `[1,0.3,0.6,0.3,0.9,0.3,0.6,0.4]`, `plen` 8).
- **Crescendo/decrescendo**: een `vpat` van 16 stijgende (of dalende) waarden met `plen` 16, bijvoorbeeld `0.2 … 1`: een opbouw over een maat.
- **Mensachtig**: `human` 0,1 … 0,3 (piano, pluck), tot 0,5 voor een speelse strum, nooit boven 0,7.
- Houd de inkomende velocity in gedachten: het toetsenbord bepaalt de basis (vaak 0,6 … 0,9), `velocity` en `vpat` schalen die.
- Geen dynamiek per spoor: dit apparaat heeft één uitgang; sluit voor een tweede dynamiek een tweede exemplaar aan.

### Per rol

| Rol | Instelling |
|---|---|
| Trance/dance | `up` of `updown`, `rate` 1, `octaves` 2 … 3, `gate` 0,25 … 0,35, `vpat` met accent op de eerste van vier, `accent` 0,6 … 0,8 |
| House/disco | `updown`, `rate` 2 of 1, `gate` 0,3 … 0,5, `vpat` met ghosts, `human` 0,2 |
| Pad-arp / ambient | `up`, `rate` 2 of 3, `octaves` 3, `gate` 1 … 1,5, `velocity` lager, `human` 0,3 … 0,4 |
| Bas-arp | `octaves` 1, `rate` 1 of 2, `gate` 0,3 … 0,6, laag akkoord (36 … 52) |
| Fijne rolls | `rate` 0 of 5, `octaves` 3 … 4, korte `gate`, zachte `vpat` (0,5 … 0,8) |
| Jazz/shuffle | `rate` 7, `chord` of `updown`, `human` 0,3 … 0,45 |
| Generatief | `random` met `chance` 0,4 … 0,7 en een eigen `seed` |

### Voorbeeld: een trance-arp met accent en korte noten

```json
{ "mode": "updown", "rate": 1, "octaves": 3, "gate": 0.3, "velocity": 0.88, "latch": true, "enabled": true, "seed": 12345,
  "plen": 4, "vpat": [1, 0.55, 0.75, 0.55, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "gpat": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "accent": 0.7, "ghost": 0, "human": 0, "chance": 1, "repeat": 1 }
```

## Instellen voor een goede preset

- Een preset bevat het patroon, de snelheid en de dynamiek; geen akkoord. Test hem met een akkoord van drie of vier noten (bijvoorbeeld 57, 60, 64, 67).
- Geef elke preset een eigen karakter: patroon, `rate`, `octaves` en `vpat`/`gpat` verschillen. Houd `vpat` en `gpat` altijd 16 lang.
- Laat `vpat` niet onder 0,2 komen bij een zachte basis: wat onder 0,1 velocity valt is onhoorbaar.

### Wat een preset niet moet doen

- `enabled: false`: dat is doorvoer, geen arpeggio.
- `chance` 0: stil. `gpat` en `vpat` met overal de kleinste waarde: nauwelijks hoorbaar.
- `gate` boven 1 met `repeat` 3 of 4 en een snel raster: overlappende noten die een monofone synth afknipt.
- `latch: true` in een preset voor een toetsenbord dat je live bespeelt kan verwarren; gebruik het alleen bij pad- en trance-arps.
- Geen routing in de state, geen veld verzinnen. De poort-id is `notes` voor in- én uitgang.

## Live toetsenbord

Het toetsenbord is hier de **akkoordbron** zelf: sluit het aan op de ingang `notes` en de arpeggiator speelt wat je vasthoudt. Er zijn geen sporen of clips, dus geen opname en geen doorgifte naar een geselecteerd spoor. Wil je het toetsenbord ongewijzigd laten klinken (zonder arp), zet dan `enabled` op `false` (de kaart toont dat als Doorvoer): alle gebeurtenissen gaan dan door naar de uitgang. Als het toetsenbord ook rechtstreeks met de synth is verbonden, hoor je de noten dubbel; dat is de keuze van de gebruiker.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug. De kaart bouwt zich opnieuw op bij `setState`, dus alle keuzes, schuiven en balkjes volgen.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, `{}`, `[]`, extreme getallen, rommel in `vpat`/`gpat`) geven de standaard of worden afgekapt; geen uitzondering.
- Alle uitgestuurde noten zijn eindig met `note` 0 … 127, `vel` 0 … 1, `dur` > 0 (500 willekeurige runs met rommel op ingang, klok en state; ruim 60000 gebeurtenissen; geen overtreding).
- Met een ongewijzigde (oude) state, dezelfde ingang en dezelfde klokstappen geeft het apparaat dezelfde gebeurtenissen als het oude bestand (inclusief cc, panic, latch en `held`): 400 willekeurige runs, 19700 gebeurtenissen, 0 verschillen.
- Niet beluisterd; geen echte synth of toetsenbord aangesloten getest.

## Swing (1.14.0)

Nieuwe sleutel `swing` (0 … 0,5 van een zestiende, standaard 0, altijd in de state; schuif "Swing"). Het is swing van het apparaat zelf (er zijn geen sporen of rijen).

Regel (voor alle apparaten gelijk): `swing` is een fractie van een zestiende (0 … 0,5; de UI toont 0 … 50 %, dubbelklik op een schuif = 0). De lokale vertraging van een gebeurtenis in een **oneven zestiende** (positie in zestienden, naar beneden afgerond, is oneven) is `(som van de niveaus) × stepDur`, de som begrensd op 0,5; de swing van de host (`info.time`) blijft er los onder. Even zestienden blijven staan. Rasters van 1/8 en langzamer hebben alleen gebeurtenissen op even zestienden en schuiven dus niet. Een ontbrekend of niet-eindig veld is 0; met alles op 0 spelen state en klokstappen precies als voor versie 1.11.0. Een noot (ook elke herhaling bij `repeat`, en `chord`-pulsen) valt in een oneven zestiende als `floor(positie)` oneven is. Bij `rate` 2 (1/8) en langzamer speelt de arpeggiator alleen op even zestienden: dan is swing zonder effect; gebruik `rate` 1 (1/16) of sneller. Opnemen/kwantiseren is niet van toepassing: dit apparaat is een generator.

## Skins

Regelaars zijn sinds 1.17.0 via `host.ui.adopt` herkenbaar voor skins (id = state- of spoorsleutel: mode, rate, octaves, repeat, latch, enabled, plen (selects) en gate, velocity, accent, ghost, swing, human, chance (knoppen); rol `param` of `select`; groep `play` en `feel`). Zonder skin is er niets veranderd. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.scale-arpeggiator/` (draaiknoppen met de naam eronder, per groep een kader, geen uitlegtekst; ongeveer 480 x 353 punten tegenover 620 x 735). De balkjes-editors (canvassen) zijn in de skin lager (30 punten) via CSS; de tekening is balkjes en wordt niet vervormd. De skin gebruikt `:nth-child` op de eerste zeven `.control`-elementen (de selects); verander je de volgorde of het aantal selects, controleer dan de skin.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/ScaleArpeggiator/scale-arpeggiator.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's (`notes`, `mod`) of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Scale Arpeggiator: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#scale-arpeggiator) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#scale-arpeggiator).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [scale-arpeggiator.patchkamer-presets.json](../../../presets/scale-arpeggiator.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Sequencers](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing, arpeggio uit de noten op de eventingang `notes` (een toetsenbord of akkoord uit een sequencer), gespeeld op de klok; eventuitgang `notes` gaat naar een synth. Zet er een akkoord- of stap-sequencer voor.
