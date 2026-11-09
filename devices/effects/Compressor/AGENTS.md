# AGENTS.md: Compressor

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Compressor geldt.

## Wat Compressor is

Een compressor die het verschil tussen zacht en luid kleiner maakt. Drempel, ratio (1:1 tot oneindig) en knee bepalen hoeveel, attack en release (ook automatisch) hoe snel; make-up (ook automatisch), peak- of RMS-detectie, lookahead tot 10 ms, een sidechain-filter (hoog- en laagdoorlaat), een externe sidechain-ingang, parallelle mix, stereo-koppeling en mid/side, een reductiemeter en een overdrachtscurve met het huidige niveau.

| | |
|---|---|
| Bestand | `compressor.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.compressor`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Compressor` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Compressor krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingangen `in` en `sc` (sidechain), audio-uitgang `out`, sturing `mod`; geen events |
| Contract | v1.28 (`latency()` sinds 1.2.0: v1.34) |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Compressor is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Compressor geen pack in `../../../tunes/`. Het presetpack is `../../../presets/compressor.patchkamer-presets.json`: `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.compressor`, elke preset is `kind: "set"` met **alle** velden van de state. Controleer een pack met `node devices/effects/Compressor/check-preset.mjs` vanuit de root.

## De state

`state` van een preset is wat `getState()` teruggeeft (Compressor heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `thr` | Drempel | −60 … 0 | −18 | dB |
| `ratio` | Ratio (100 = oneindig) | 1 … 100 (log) | 4 | :1 |
| `knee` | Knee (0 = hard) | 0 … 24 | 6 | dB |
| `att` | Attack (tijdconstante, 63%) | 0,05 … 200 (log) | 10 | ms |
| `rel` | Release (tijdconstante, 63%) | 5 … 2000 (log) | 120 | ms |
| `auto` | Auto-release: twee releases (30 en 400 ms) tegelijk; `rel` telt dan niet | boolean | `false` | – |
| `makeup` | Make-up | 0 … 24 | 0 | dB |
| `autoMk` | Auto make-up: telt de reductie bij −12 dB ingang erbij | boolean | `false` | – |
| `mix` | Mix: deel van het gecomprimeerde signaal | 0 … 1 | 1 | deel |
| `look` | Lookahead = latency | 0 … 10 | 0 | ms |
| `link` | Koppeling van de kanalen (0 = apart, 1 = gelijk) | 0 … 1 | 1 | deel |
| `hpf` | Hoogdoorlaat op de detector (20 = uit) | 20 … 1000 (log) | 20 | Hz |
| `lpf` | Laagdoorlaat op de detector (20000 = uit) | 1000 … 20000 (log) | 20000 | Hz |
| `detect` | Detectie: `peak`, `rms` (venster 10 ms) | een van twee | `peak` | – |
| `chmode` | Kanalen: `stereo` (L/R) of `ms` (mid/side) | een van twee | `stereo` | – |
| `sc` | Detectorbron: `int` (ingang) of `ext` (ingang `sc`) | een van twee | `int` | – |
| `on` | Aan, of doorlaten | boolean | `true` | – |

Definities (gemeten, zie `docs/tools/measure-compressor.mjs`):

- Attack en release zijn **tijdconstanten** van de reductie in dB: na één attack is 63% van de uiteindelijke reductie bereikt, na één release is 63% van het herstel gedaan (10% tot 90% duurt ongeveer 2,2 keer zo lang). Gemeten met een stap in een blokgolf, afwijking minder dan 2 ms of 2%.
- De statische curve is die met een kwadratische knee: reductie = (1 − 1/ratio)(over + knee/2)² / (2 knee) binnen de knee, daarboven (1 − 1/ratio) × over. Gemeten bij 1 kHz met RMS-detectie: binnen 0,1 dB van de formule. Ratio 100 telt als oneindig.
- Peak-detectie leest per sample, RMS met een venster van 10 ms. Peak ziet de top van elke periode en reageert daardoor op een hoger niveau dan RMS (een sinus met piek 0 dBFS: 13,8 dB reductie tegen 12,8 dB).
- Latency = lookahead: het geluid (en de droge mix) wordt `look` ms vertraagd, de detector niet. Het apparaat meldt de waarde sinds 1.2.0 met `latency()` (seconden, contract v1.34, §13j); de host toont hem op de titelbalk en bij de kabels maar compenseert niet; de kaart toont de waarde ook zelf. Een wijziging van `look` loopt langzaam (hoogstens 0,004 sample per sample), zodat er geen tik is; dat geeft tijdens het schuiven een heel kleine toonhoogteverschuiving.
- Auto make-up telt de statische reductie bij −12 dB ingang bij de make-up op (0 als de drempel boven −12 dB ligt).
- Externe sidechain (`sc: 'ext'`) zonder kabel op de ingang `sc` geeft een stil signaal voor de detector: er wordt niet gecomprimeerd.
- `link` werkt op de detectorniveaus in dB (grootste van de twee kanalen); in `ms` zijn de twee kanalen mid en side.

Wat Compressor met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (1e9, 1e30) worden begrensd (boven ±16, +24 dB), zodat één foutieve waarde van een apparaat ervoor het geheugen van de detector en de filters niet voorgoed vergiftigt. De worklet accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug. Na een burst klinkt het geluid weer precies als zonder burst.

Wat Compressor met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een keuzeveld met een onbekende waarde geeft de startwaarde. Booleans die geen boolean zijn, geven de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- `Luister naar ...` (meeluisteren) is geen state: het staat na laden altijd uit.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Compressor/compressor.patchkamer-device.js` en met `--lang nl` en `--lang en`, vanuit de root. Alle drie moeten `OK` geven, zonder `let op`.
- Metingen (drempel, attack/release, latency, stabiliteit, rekenlast): `node docs/tools/measure-compressor.mjs` vanuit de root. Dat laadt de worklet uit het apparaatbestand in Node, blok voor blok van 128 samples.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in de woordenboeken `NL` en `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-compressor-1-0-0`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Compressor: [NL](../../../docs/effects/USER-MANUAL_NL.md#compressor) · [EN](../../../docs/effects/USER-MANUAL_EN.md#compressor).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [compressor.patchkamer-presets.json](../../../presets/compressor.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: een compressor als insert op zang, drums, bas of de hele mix; met `sc` aan een kick als pompende sidechain. Audio in `in`, uit `out`; de externe sidechain komt op `sc` met `sc: "ext"`.
