# AGENTS.md: Scope

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Scope geldt.

## Wat Scope is

Een transparante audio-doorvoer met een live analyse: het geluid gaat ongewijzigd van `In` naar `Door` (dezelfde gain-node, geen extra versterking, downmix of vertraging), en de kaart laat tegelijk zien wat er langskomt. Vijf beelden: spectrum, golfvorm L/R, spectrogram, stereobeeld en peak/RMS, met een getallenregel (peak, RMS in dBFS en een CLIP-melding). De kaart tekent via de tekenklok van de host (30 keer per seconde, alleen als de kaart te zien is).

| | |
|---|---|
| Bestand | `scope.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.scope`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Scope` in alle talen; alleen de poortnaam `Door` heeft een Engelse variant (`Through`, via `i18n`) |
| Soort | `utility`: Scope krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`; geen events of sturing |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand (`scope_v1.8.0.js`, versie 1.8.0); de `id` is gelijk gebleven omdat de naam al Engels was.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Scope is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Scope geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.scope` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Scope heeft geen `getPreset`). Alle velden zijn keuzes uit een vaste lijst; de pauzeknop hoort niet bij de state.

| Veld | Wat | Toegestane waarden | Start |
|---|---|---|---|
| `mode` | Beeld | `spectrum`, `waveform`, `spectrogram`, `stereo`, `meters` | `spectrum` |
| `fft` | FFT-grootte | 1024, 2048, 4096, 8192 | 2048 |
| `smoothing` | Gladstrijken van het spectrum | 0 (uit), 0,4 (licht), 0,7 (normaal), 0,9 (sterk) | 0,7 |
| `floor` | Bereik van de dB-schaal (dB) | −60, −90, −120 | −90 |
| `windowMs` | Tijdvenster van de golfvorm (ms) | 5, 10, 25, 50 | 25 |

Wat Scope met een state doet (getest):
- Een waarde die niet in de lijst staat (ook een getal als tekst, bijvoorbeeld `"2048"`, `null` of `NaN`) geeft de startwaarde; er is dus niets om af te kappen.
- Onbekende velden worden genegeerd. Zet er geen in.
- `setState({})` en `setState(getState())` geven de standaard respectievelijk dezelfde state.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Scope/scope.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Dat het beeld klopt zie je alleen in de host (`../../../patchkamer/AGENTS.md`). Heb je geen browser, schrijf dan in je oplevering dat het beeld **niet bekeken** is.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.
- Het geluid mag nooit veranderen: de doorvoer is één gain-node met versterking 1. Pas die niet aan.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Scope: [NL](../../../docs/tools/USER-MANUAL_NL.md#scope) · [EN](../../../docs/tools/USER-MANUAL_EN.md#scope).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: meetinstrument dat het geluid ongewijzigd doorgeeft (`in` naar `out`) en laat zien wat er langskomt. Zet hem op een stem of de mix om te controleren.
