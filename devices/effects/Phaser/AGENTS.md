# AGENTS.md: Phaser

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Phaser geldt.

## Wat Phaser is

Een klassieke phaser: 4, 6, 8 of 12 allpass-trappen per kant, een LFO op de middenfrequentie (de diepte is in octaven), terugkoppeling (positief of negatief) en een stereo-instelling die het faseverschil tussen links en rechts bepaalt. De LFO loopt vrij (Hz) of op het tempo van de studio. Stuurbaar via de modulatie-ingang.

| | |
|---|---|
| Bestand | `phaser.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.phaser`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Phaser` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Phaser krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, modulatie-ingang `mod` (zes stuurbare parameters in het spoor `phaser`); geen events |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Phaser is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Phaser geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.phaser` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Phaser heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `stages` | Aantal allpass-trappen per kant | 4, 6, 8 of 12 | 6 | – |
| `sync` | LFO vrij of op tempo; de waarde is het aantal tellen per LFO-periode | `free`, `32` (8 maten), `16`, `8`, `4` (1 maat), `2`, `1`, `0.5` | `free` | – |
| `rate` | LFO-snelheid (alleen bij `sync: "free"`) | 0,02 … 10 | 0,25 | Hz |
| `depth` | Diepte van de LFO (1 = ±2 octaven) | 0 … 1 | 0,7 | – |
| `center` | Middenfrequentie van de allpass-trappen | 100 … 6000 | 800 | Hz |
| `fb` | Terugkoppeling | −0,95 … 0,95 | 0,5 | – |
| `stereo` | Faseverschil tussen links en rechts (1 = 180°) | 0 … 1 | 0,5 | – |
| `mix` | Mengverhouding droog/nat | 0 … 1 | 0,5 | – |

Wat Phaser met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`center: 1e9` wordt 6000, `stages: 100` wordt 12); een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde. Een `stages` tussen de toegestane waarden in (bijvoorbeeld 5) geeft de startwaarde.
- Een ongeldige `sync` geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en keuzes op de kaart bewegen mee met `setState`. Een andere `stages` bouwt de filterketens opnieuw op (de terugkoppellus begint dan leeg).

Wat Phaser met zijn ingang en zijn eigen terugkoppeling doet (getest): de terugkoppellus heeft geheugen. `NaN` of `±Infinity` blijft er voorgoed in rondgaan, en een lus die wegloopt (veel terugkoppeling, lage middenfrequentie, volle diepte) kan pieken van tienduizenden geven. Een bewaker kijkt in een live context om de 50 ms naar de uitvoer van de laatste trap van elke kant en bouwt de ketens opnieuw op zodra er iets niet-eindigs of groter dan ±200 staat. Het geluid komt dan binnen enkele tientallen milliseconden terug. In een offline render staat de bewaker uit. Normaal geluid is bit-identiek aan de vorige versie. Een `NaN` of `Infinity` op de ingang zelf komt, zolang hij duurt, ook op de uitgang (de droge route is een doorgeefroute).

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Phaser/phaser.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engels als waarde). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Phaser: [NL](../../../docs/effects/USER-MANUAL_NL.md#phaser) · [EN](../../../docs/effects/USER-MANUAL_EN.md#phaser).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [phaser.patchkamer-presets.json](../../../presets/phaser.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect voor beweging, vooral op pads en akkoorden. Audio in `in`, uit `out`; zes parameters zijn stuurbaar via `mod`.
