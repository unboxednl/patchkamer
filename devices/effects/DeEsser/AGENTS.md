# AGENTS.md: De-esser

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor De-esser geldt.

## Wat De-esser is

Een de-esser die scherpe s-klanken in een stem dempt. Een detectieband (3 tot 10 kHz, bandbreedte in octaven) bepaalt wanneer; daarna drempel, ratio en maximale reductie. Twee modi: **split-band** (alleen die band wordt gedempt) en **wideband** (het hele signaal). Verder attack, release, parallelle mix, een luistermodus voor de detectieband en een reductiemeter.

| | |
|---|---|
| Bestand | `deesser.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.deesser`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `De-esser` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): De-esser krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod`; geen sidechain en geen events |
| Contract | v1.28 (apparaat 1.1.1) |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. De-esser is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor De-esser geen pack in `../../../tunes/`. Het presetpack is `../../../presets/deesser.patchkamer-presets.json`: `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.deesser`, elke preset is `kind: "set"` met **alle** velden van de state. Controleer een pack met `node devices/effects/DeEsser/check-preset.mjs` vanuit de root.

## De state

`state` van een preset is wat `getState()` teruggeeft (De-esser heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Modus: `split` (alleen de band) of `wide` (alles) | een van twee | `split` | – |
| `freq` | Middenfrequentie van de band | 3000 … 10000 (log) | 6500 | Hz |
| `bw` | Bandbreedte | 0,25 … 3 | 1 | octaaf |
| `thr` | Drempel (niveau van de band) | −60 … 0 | −30 | dB |
| `ratio` | Ratio (100 = oneindig) | 1 … 100 (log) | 4 | :1 |
| `range` | Max. reductie | 0 … 24 | 10 | dB |
| `att` | Attack (tijdconstante, 63%) | 0,05 … 20 (log) | 0,5 | ms |
| `rel` | Release (tijdconstante, 63%) | 5 … 500 (log) | 50 | ms |
| `mix` | Mix: deel van het bewerkte signaal | 0 … 1 | 1 | deel |
| `on` | Aan, of doorlaten | boolean | `true` | – |

Definities (gemeten, zie `docs/tools/measure-deesser.mjs`):

- De detector is een banddoorlaatfilter van de 2e orde (0 dB in het midden, bandbreedte in octaven tussen de −3 dB-punten) gevolgd door een piekvolger met 0,5 ms release; het grootste van links en rechts telt. De drempel is het niveau van die band (een toon op de middenfrequentie met piek −30 dBFS staat op −30).
- De statische curve heeft een vaste knee van 6 dB; de reductie is begrensd op `range`. Gemeten op de middenfrequentie: binnen 0,1 dB van de formule (1 − 1/ratio) × over.
- Attack en release zijn tijdconstanten van de reductie in dB (63%). Gemeten: attack 5 ms: 63% na 6 ms; release 100 ms: 63% hersteld na ongeveer 100 ms.
- `split`: uitgang = ingang + (g − 1) × band(ingang); op de middenfrequentie is de demping dus precies g, ernaast minder (bij 1 oktaaf: −2,9 dB op 4,6 kHz als het midden 12 dB wordt gedempt, −0,7 dB op 3 kHz, 0,0 dB op 1 kHz). `wide`: uitgang = ingang × g (ook de stem eronder wordt gedempt: −12,0 dB bij g = −12 dB).
- Latency: geen (er is geen lookahead).
- De reductiemeter (`gr`, ook de kromme in het scherm) toont de werkelijke reductie op de middenfrequentie: bij `on: false` is dat 0 en bij `mix` onder 1 de gemengde reductie (1.1.1; eerst toonde hij de volle, niet toegepaste reductie). Test: `node docs/tools/test-deesser.mjs`.
- Luister naar detectieband (`listen`) is geen state: het geeft de band zelf als uitgang.

Wat De-esser met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (1e9, 1e30) worden begrensd (boven ±16, +24 dB), zodat één foutieve waarde van een apparaat ervoor het geheugen van de detector en de filters niet voorgoed vergiftigt. De worklet accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug. Na een burst klinkt het geluid weer precies als zonder burst.

Wat De-esser met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een keuzeveld met een onbekende waarde geeft de startwaarde. Booleans die geen boolean zijn, geven de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- `Luister naar ...` (meeluisteren) is geen state: het staat na laden altijd uit.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/DeEsser/deesser.patchkamer-device.js` en met `--lang nl` en `--lang en`, vanuit de root. Alle drie moeten `OK` geven, zonder `let op`.
- Metingen (drempel, attack/release, latency, stabiliteit, rekenlast): `node docs/tools/measure-deesser.mjs` vanuit de root. Dat laadt de worklet uit het apparaatbestand in Node, blok voor blok van 128 samples.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in de woordenboeken `NL` en `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-deesser-1-0-1`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van De-esser: [NL](../../../docs/effects/USER-MANUAL_NL.md#de-esser) · [EN](../../../docs/effects/USER-MANUAL_EN.md#de-esser).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [deesser.patchkamer-presets.json](../../../presets/deesser.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: een de-esser achter een zangspoor, voor of na de compressor. Audio in `in`, uit `out`.
