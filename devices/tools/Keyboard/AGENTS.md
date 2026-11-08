# AGENTS.md: Keyboard

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Keyboard geldt.

## Wat Keyboard is

Een klavier zonder eigen geluid dat noten en controllers naar andere apparaten stuurt. Het aantal toetsen is instelbaar (25, 37, 49, 61, 76 of 88). Bediening met de muis of aanraking, de computertoetsen, pitch bend, modulatie, sustain, snelheid, transponeren en MIDI-kanaal. Het heeft geen MIDI-toegang: een fysiek keyboard sluit je aan op de MIDI Controller. Het vervangt het klavier van Keys / MIDI (dat is `retired`).

| | |
|---|---|
| Bestand | `keyboard.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.keyboard`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `utility` (categorie `tool`); krijgt dus **presets** en nooit tunes |
| Poorten | één eventuitgang `notes` (Noten); geen ingangen, geen audio |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

- **Gebeurtenissen.** `note` (met `dur`, in vasthoudmodus ook `held: true`), `noteoff`, `allnotesoff` en `cc` met `id` `bend` of `vibrato` (0 … 1). Elke gebeurtenis draagt `ch` (het MIDI-kanaal).
- **Speelmodus.** `hold` (standaard): noot aan bij indrukken, `noteoff` bij loslaten (met sustain pas bij loslaten van het pedaal). `pulse`: een noot met lengte `duration`.
- **Computertoetsen.** A W S E D F T G Y H U J K O L P ; ' (18 toetsen vanaf C van het gekozen octaaf); Z en X verschuiven het octaaf. Werkt niet als de focus in een invoerveld staat.
- **Toetsen.** `start` (laagste toets, een veelvoud van 12) en `keys` bepalen het bereik; de aanslag hangt af van waar je op de toets drukt (lager is harder). Een verloren focus van het venster laat alle noten los.

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `keys` | aantal toetsen | 25, 37, 49, 61, 76, 88 | 61 |
| `start` | laagste toets (MIDI-nootnummer) | 0 … 96 | 36 |
| `oct` | octaaf van de computertoetsen | −3 … 3 | 0 |
| `velocity` | aanslag | 0,05 … 1 | 0,8 |
| `mode` | `hold` of `pulse` | keuze | `hold` |
| `duration` | notenlengte in pulsmodus (s) | 0,05 … 4 | 0,4 |
| `transpose` | transponeren (halve tonen) | −24 … 24 | 0 |
| `channel` | MIDI-kanaal | 1 … 16 | 1 |
| `computer` | computertoetsen aan | aan/uit | aan |

Een **preset** (`getPreset`/`setPreset`) bevat `keys`, `start`, `velocity`, `mode`, `duration`, `transpose` en `channel`. `setState` en `setPreset` laten eerst alle noten los (`panic`).

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Keyboard/keyboard.patchkamer-device.js` (en met `--lang en`) moet `OK` geven, zonder `let op`.
- Getest in Chromium: het aantal toetsen (61 en 88), een toets met de muis en een computertoets. **Niet getest:** aanraking met meer vingers, de noten op een echte synth (niet beluisterd), pitch bend en modulatie op een echt instrument.
- Alle tekst staat in `TXT` bovenin het bestand (nl en en).

## Wat je niet doet

- Verander nooit de `id`, de `kind` of het poort-id `notes`, en verwijder geen state-velden.
- Voeg geen audiopoorten toe en geen MIDI-toegang (dat doet de MIDI Controller).
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding: [NL](../../../docs/tools/USER-MANUAL_NL.md#keyboard) · [EN](../../../docs/tools/USER-MANUAL_EN.md#keyboard).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Overzicht van alle apparaten: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
