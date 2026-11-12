# AGENTS.md: Pump

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Pump geldt.

## Wat Pump is

Een sidechain-compressor ("ducker"): de kick drukt de bas en pads omlaag, het klassieke pompen. Drie bronnen voor de duik: **Sidechain** (luistert naar de audio-ingang `sc`, met een luisterfilter zodat alleen het laag of hoog telt), **Trigger** (elke trig of noot op de eventingang `trig` start een duik, sample-nauwkeurig) en **Clock** (duikt vanzelf op elke tel of onderverdeling van de hostklok, zonder kabel). Verder: alleen het laag of hoog laten duiken, release op tempo, curvevorm, parallel mengen, meeluisteren met de sidechain en een grafiek van de demping.

| | |
|---|---|
| Bestand | `pump.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.pump`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Pump` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Pump krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingangen `in` en `sc` (sidechain), audio-uitgang `out`, eventingang `trig`, sturing `mod`; geen eventuitgang |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.pomp`, naam "Pomp · sidechain"). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Pump is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Pump geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.pump` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Pump heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `depth` | Diepte van de duik | 0 … 1 | 0,8 | deel |
| `rel` | Release | 20 … 1500 | 180 | ms |
| `att` | Attack | 0,1 … 60 | 3 | ms |
| `hold` | Hold (alleen Trigger en Clock) | 0 … 300 | 20 | ms |
| `curve` | Curve: 0 = recht terug, 1 = laat en snel terug | 0 … 1 | 0,5 | deel |
| `thr` | Drempel (alleen Sidechain) | −60 … 0 | −24 | dB |
| `ratio` | Ratio (alleen Sidechain) | 1 … 20 | 6 | :1 |
| `scfreq` | Filter van de sidechain-detector | 40 … 8000 | 150 | Hz |
| `xo` | Kantelpunt tussen laag en hoog (bij `band` `laag` of `hoog`) | 40 … 1000 | 120 | Hz |
| `mix` | Parallel: deel van het geduikte signaal | 0 … 1 | 1 | deel |
| `makeup` | Make-up | 0 … 12 | 0 | dB |
| `tail` | Deel van de afstand tot de volgende slag (bij `relSync`) | 0,1 … 1 | 0,85 | deel |
| `mode` | Bron: `sc` (Sidechain), `trig` (Trigger), `klok` (Clock) | een van drie | `klok` | – |
| `div` | Clock: elke 1/16, 1/8, 1/4, 1/2 of hele maat: `16`, `8`, `4`, `2`, `1` | een van vijf | `4` | – |
| `band` | Wat duikt: `alles`, `laag`, `hoog` | een van drie | `alles` | – |
| `scf` | Waar de sidechain naar luistert: `lp` (laag), `vol` (alles), `hp` (hoog) | een van drie | `lp` | – |
| `relSync` | Release volgt het tempo (Trigger en Clock) | boolean | `true` | – |
| `on` | Aan, of doorlaten | boolean | `true` | – |
| `preset` | Naam van de gekozen preset in de keuzelijst, of `Custom` | tekst | `Classic pump` | – |

De waarden van `mode`, `band` en `scf` zijn interne sleutels en blijven zoals ze waren, omdat bewaarde werkruimtes eraan hangen; ze worden niet vertaald.

De namen in `preset` zijn Engels: `Classic pump`, `Low end only`, `Kick as sidechain`, `Soft breathing`, `Gated (1/16)`, `Trigger from sequencer`, `Parallel (subtle)`, `Custom`. De oude Nederlandse namen (`Klassiek pompen`, `Alleen het laag`, `Kick als sidechain`, `Zacht ademen`, `Trigger van Regie`, `Parallel (subtiel)`, `Eigen`) worden bij het laden herkend en omgezet. Een keuze in de lijst zet de andere velden op de waarden van die preset; zodra je daarna iets verandert, wordt `preset` `Custom`.

Wat Pump met zijn ingangen doet (getest): `NaN`, `±Infinity` en absurd grote waarden (boven ±16, +24 dB) op `in` en op `sc` worden begrensd, zodat één foutieve waarde van een apparaat ervoor het geheugen van de detector en het crossoverfilter niet voorgoed vergiftigt. De worklet accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug. Normaal geluid blijft bit-identiek.

Wat Pump met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een keuzeveld met een onbekende waarde geeft de startwaarde. `relSync` en `on` die geen boolean zijn, geven de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- `Luister naar sidechain` (meeluisteren) is geen state: het staat na laden altijd uit.

## Skins

Het apparaat is herkenbaar voor skins (`design.controls` met `face: rotary`): sinds 1.14.0 melden de schuiven zich aan met `data-pk-id` (de state-sleutel: `depth`, `rel`, `att`, `hold`, `curve`, `thr`, `ratio`, `scfreq`, `xo`, `mix`, `makeup`, `tail`) en `data-pk-group` (`duck`, `detector` of `tone`). De hoogte van het duikscherm volgt de CSS-eigenschap `--u-ch` (standaard 90). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.pump/` (draaiknoppen met waarde en naam eronder, drie kaders naast elkaar, laag scherm; ongeveer 480 x 316 tegenover 720 x 673). Wijzig je de opbouw van `.top`, `h3` of `.grid`, controleer dan die skin: hij plaatst de koppen en kaders met `nth-child`.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Pump/pump.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in de woordenboeken `NL` en `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-pump-1-14-2`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Pump: [NL](../../../docs/effects/USER-MANUAL_NL.md#pump) · [EN](../../../docs/effects/USER-MANUAL_EN.md#pump).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [pump.patchkamer-presets.json](../../../presets/pump.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sidechain-ducking in het spoor van bas en pads (audio in `in`, uit `out`). Het veld `mode` kiest de bron: `sc` (audio-ingang `sc`, bijvoorbeeld een kick), `trig` (elke trig of noot op de eventingang `trig`, bijvoorbeeld van de uitgang `trigs` van een drumcomputer) of `klok` (volgt de klok van de studio).
