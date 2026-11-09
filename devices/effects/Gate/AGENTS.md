# AGENTS.md: Gate

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Gate geldt.

## Wat Gate is

Een noise gate, expander en ducker in één. Drie soorten (`mode`): **gate** (ratio oneindig, dempt onder de drempel), **expander** (zacht: (ratio − 1) dB per dB onder de drempel) en **ducker** (omgekeerd: dempt zodra het niveau boven de drempel komt, bedoeld voor een externe sidechain). Verder: range (de grootste demping), hold, hysterese, attack en release, sidechain-filters met meeluisteren, een externe sidechain-ingang, lookahead tot 10 ms, stereo-koppeling, een overdrachtscurve en een meter die toont hoe open de poort is.

| | |
|---|---|
| Bestand | `gate.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.gate`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Gate` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Gate krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingangen `in` en `sc` (sidechain), audio-uitgang `out`, sturing `mod`; geen events |
| Contract | v1.28 (`latency()` sinds 1.2.0: v1.34) |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Gate is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Gate geen pack in `../../../tunes/`. Het presetpack is `../../../presets/gate.patchkamer-presets.json`: `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.gate`, elke preset is `kind: "set"` met **alle** velden van de state. Controleer een pack met `node devices/effects/Gate/check-preset.mjs` vanuit de root.

## De state

`state` van een preset is wat `getState()` teruggeeft (Gate heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Soort: `gate`, `expander`, `ducker` | een van drie | `gate` | – |
| `thr` | Drempel | −90 … 0 | −45 | dB |
| `ratio` | Ratio van expander en ducker (100 = oneindig); de gate is altijd oneindig | 1 … 100 (log) | 4 | :1 |
| `range` | Range: de grootste demping | 0 … 90 | 60 | dB |
| `hyst` | Hysterese: eenmaal open sluit de poort zoveel dB onder de drempel (niet bij `ducker`) | 0 … 24 | 4 | dB |
| `att` | Attack (tijdconstante van openen; ducker: van dempen) | 0,05 … 100 (log) | 1 | ms |
| `hold` | Hold | 0 … 500 | 50 | ms |
| `rel` | Release (tijdconstante van sluiten; ducker: van herstel) | 5 … 3000 (log) | 150 | ms |
| `look` | Lookahead = latency | 0 … 10 | 0 | ms |
| `hpf` | Hoogdoorlaat op de detector (20 = uit) | 20 … 1000 (log) | 20 | Hz |
| `lpf` | Laagdoorlaat op de detector (20000 = uit) | 1000 … 20000 (log) | 20000 | Hz |
| `link` | Koppeling van de kanalen | 0 … 1 | 1 | deel |
| `sc` | Detectorbron: `int` of `ext` (ingang `sc`) | een van twee | `int` | – |
| `detect` | Detectie: `peak` (volger met 3 ms release) of `rms` (15 ms) | een van twee | `peak` | – |
| `on` | Aan, of doorlaten | boolean | `true` | – |

Definities (gemeten, zie `docs/tools/measure-gate.mjs`):

- De drempel is het niveau van de detector (na de filters). Gate: boven de drempel open (gain 0 dB), eronder `range` dB demping. Expander: demping = (drempel − niveau) × (ratio − 1), hoogstens `range`; gemeten binnen 0,01 dB van de formule. Ducker: demping = (niveau − drempel) × (ratio − 1), hoogstens `range`.
- Attack en release zijn **tijdconstanten van de versterking (amplitude)**: na één attack is 63% van de weg naar open gedaan; na één release staat de gain op 37% (−8,7 dB). Dempen over 60 dB duurt dus ongeveer 7 keer de release (release 100 ms: gain −20 dB na 239 ms, −60 dB na 928 ms). Bij de ducker is attack de tijd van het dempen en release die van het herstel.
- Hold houdt de poort open nadat het niveau onder de drempel zakte. Daarbovenop komt de nalooptijd van de piekvolger (3 ms release): het niveau moet eerst vanaf de piek tot de drempel zakken, bij 20 dB ongeveer 7 ms. Gemeten: hold 50 ms begint te dempen na 59 ms.
- Hysterese: de poort sluit pas bij drempel − `hyst`; bij `ducker` telt de hysterese niet.
- Latency = lookahead (zoals bij Compressor): het geluid wordt `look` ms vertraagd, de detector niet; de poort opent dus vóór de aanzet. De host compenseert niet; het apparaat meldt de waarde sinds 1.2.0 met `latency()` (seconden, contract v1.34, §13j) en de host toont hem.
- Externe sidechain (`sc: 'ext'`) zonder kabel geeft een stil signaal: een gate blijft dicht, een ducker dempt niet.
- De uitgang is nooit hoger dan de ingang (de gain is 1 of lager); er is geen make-up of mix.

Wat Gate met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (1e9, 1e30) worden begrensd (boven ±16, +24 dB), zodat één foutieve waarde van een apparaat ervoor het geheugen van de detector en de filters niet voorgoed vergiftigt. De worklet accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug. Na een burst klinkt het geluid weer precies als zonder burst.

Wat Gate met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een keuzeveld met een onbekende waarde geeft de startwaarde. Booleans die geen boolean zijn, geven de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- `Luister naar ...` (meeluisteren) is geen state: het staat na laden altijd uit.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Gate/gate.patchkamer-device.js` en met `--lang nl` en `--lang en`, vanuit de root. Alle drie moeten `OK` geven, zonder `let op`.
- Metingen (drempel, attack/release, latency, stabiliteit, rekenlast): `node docs/tools/measure-gate.mjs` vanuit de root. Dat laadt de worklet uit het apparaatbestand in Node, blok voor blok van 128 samples.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in de woordenboeken `NL` en `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-gate-1-0-0`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Gate: [NL](../../../docs/effects/USER-MANUAL_NL.md#gate) · [EN](../../../docs/effects/USER-MANUAL_EN.md#gate).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [gate.patchkamer-presets.json](../../../presets/gate.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: een gate op drums of gitaar, een expander voor ruis of te sterk gecomprimeerd materiaal, of een ducker met een spraakkanaal of kick op `sc`. Audio in `in`, uit `out`.
