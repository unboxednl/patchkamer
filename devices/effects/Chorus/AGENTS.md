# AGENTS.md: Chorus

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Chorus geldt.

## Wat Chorus is

Een chorus-effect met twee standen: Chorus (twee stemmen) en Ensemble (drie stemmen, elk met een trage en een snelle LFO, 120° uit fase, zoals een string-ensemble). Stereo breedte, toonfilter en mix; de LFO loopt vrij (Hz) of op het tempo van de studio. Stuurbaar via de modulatie-ingang.

| | |
|---|---|
| Bestand | `chorus.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.chorus`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Chorus` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Chorus krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, modulatie-ingang `mod` (zes stuurbare parameters in het spoor `chorus`); geen events |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Chorus is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Chorus geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.chorus` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Chorus heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Soort | `ensemble` of `chorus` | `ensemble` | – |
| `sync` | LFO vrij of op tempo; de waarde is het aantal tellen per LFO-periode | `free`, `16` (4 maten), `4` (1 maat), `2`, `1`, `0.5` | `free` | – |
| `rate` | LFO-snelheid (alleen bij `sync: "free"`) | 0,03 … 8 | 0,5 | Hz |
| `depth` | Diepte van de LFO | 0 … 1 | 0,5 | – |
| `delay` | Basisvertraging | 3 … 30 | 12 | ms |
| `width` | Stereobreedte | 0 … 1 | 0,8 | – |
| `tone` | Toonfilter (laagdoorlaat) op het effectsignaal | 800 … 16000 | 9000 | Hz |
| `mix` | Mengverhouding droog/nat | 0 … 1 | 0,5 | – |

Wat Chorus met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`rate: 1e9` wordt 8); een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige `mode` of `sync` geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en keuzes op de kaart bewegen mee met `setState`.

Wat Chorus met zijn ingang doet (getest): het toonfilter in het effectpad houdt `NaN` of `±Infinity` voor altijd vast en vergiftigt dan de hele uitgang. Een bewaker kijkt in een live context om de 50 ms naar de uitvoer van dat filter en vervangt het filter zodra er iets niet-eindigs in staat. Het geluid komt dan binnen enkele tientallen milliseconden terug. In een offline render staat de bewaker uit. Normaal geluid is bit-identiek aan de vorige versie. Een `NaN` of `Infinity` op de ingang zelf komt, zolang hij duurt, ook op de uitgang (de droge route is een doorgeefroute).

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Chorus/chorus.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engels als waarde). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Chorus: [NL](../../../docs/effects/USER-MANUAL_NL.md#chorus) · [EN](../../../docs/effects/USER-MANUAL_EN.md#chorus).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [chorus.patchkamer-presets.json](../../../presets/chorus.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: insert-effect op een stem of bus (breedte en beweging). Audio in `in`, uit `out`; zes parameters zijn stuurbaar via `mod`.
