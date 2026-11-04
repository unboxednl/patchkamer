# AGENTS.md: Notes

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Notes geldt.

## Wat Notes is

Een notitieblok op de vloer voor ideeën, toonsoort, structuur en wat er nog moet. Het heeft een veld voor de toonsoort, een veld voor tempo of gevoel, knoppen die een kop (Intro, Opbouw, Break, Drop, Outro) in de tekst zetten, een groot tekstveld, een takenlijst met vinkjes en een regel met het tijdstip van de laatste wijziging. Het maakt geen geluid en heeft geen poorten; de tekst wordt met de werkruimte bewaard.

| | |
|---|---|
| Bestand | `notes.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.notes`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Notes` in alle talen; het apparaat heeft geen poorten, dus geen `i18n` nodig |
| Soort | `utility` (categorie `tool`): Notes krijgt dus **presets** (geen tunes) |
| Poorten | geen |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.notities`). Werkruimtes, presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Notes is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Notes geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.notes` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt (bijvoorbeeld een lege songsjabloon met koppen en taken).

## De state en de preset

`getState()` bevat vijf velden. Een preset (`getPreset`/`setPreset`) bevat alles behalve `edited`: het tijdstip van de laatste wijziging hoort bij deze sessie en niet bij een preset. Zet `edited` dus niet in een preset.

| Veld | Wat | Bereik | Start | In preset |
|---|---|---|---|---|
| `key` | Toonsoort (vrije tekst) | tekst, hoogstens 200 tekens | leeg | ja |
| `tempo` | Tempo / gevoel (vrije tekst) | tekst, hoogstens 200 tekens | leeg | ja |
| `text` | De notities | tekst, hoogstens 100.000 tekens | leeg | ja |
| `todo` | De takenlijst | lijst van hoogstens 200 taken `{ t, done }` | lege lijst | ja |
| `edited` | Tijdstip van de laatste wijziging (ms sinds 1970) | getal ≥ 0 | 0 | nee |

Een taak heeft `t` (tekst, hoogstens 500 tekens) en `done` (boolean, standaard `false`).

Wat Notes met een state doet (getest):
- Een tekst die te lang is, wordt afgekapt; een lijst met meer dan 200 taken houdt de eerste 200.
- Een veld dat de verkeerde soort is (een getal of `null` in plaats van tekst, een tekst als `todo`) geeft de startwaarde. Taken zonder tekst `t`, of die geen object zijn, vallen weg. Een `done` die geen boolean is, wordt `false`.
- `edited` dat geen getal is, `NaN`, oneindig of negatief geeft 0.
- Onbekende velden worden genegeerd. Zet er geen in.
- `setPreset` laat `edited` staan zoals het was.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Notes/notes.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Notes maakt geen geluid, dus er valt niets te beluisteren.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en. De namen van de kopknoppen staan ook in `TXT` en komen als tekst in de notities terecht.

## Wat je niet doet

- Verander nooit de `id`, de `kind` of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
