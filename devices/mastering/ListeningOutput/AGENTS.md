# AGENTS.md: Listening Output

Dit bestand is voor AI-agents die **presets voor Listening Output** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md`; lees dat eerst.

## Wat Listening Output is

Een transparante luisteruitgang: de audio gaat ongewijzigd naar de uitgang van de browser, met alleen een luistervolume. Zet hem als laatste in de keten, na de mastering-apparaten, zodat je meet wat je hoort.

| | |
|---|---|
| Bestand | `listening-output.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.listeningoutput`. Verander die nooit |
| Soort | `output`: krijgt dus **presets** |
| Poorten | audio-ingang `in` (In) |
| Contract | v1.11 |

Voorganger: Luisteruitgang (`nl.patchkamer.monitoruit`).

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `level` | Volume (luistervolume) | 0 … 1 | 0,7 |

`getPreset()` geeft hetzelfde. Een ongeldige waarde (tekst, `NaN`, `Infinity`) geeft 0,7; een getal buiten het bereik wordt afgekapt; het volume gaat zacht naar zijn nieuwe waarde.

## Controleren

`node contract/validate-instrument.mjs devices/mastering/ListeningOutput/listening-output.patchkamer-device.js --lang nl` en `--lang en`. Niet beluisterd.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Listening Output: [NL](../../../docs/mastering/USER-MANUAL_NL.md#listening-output) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#listening-output).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [listening-output.patchkamer-presets.json](../../../presets/listening-output.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mastering](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: laatste schakel van een masterketen met alleen een luistervolume, bedoeld om te meten wat je hoort. Audio in `in`; geen uitgangen. Zet hem na de mastering-apparaten.
