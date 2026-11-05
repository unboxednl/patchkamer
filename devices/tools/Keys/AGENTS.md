# AGENTS.md: Keys / MIDI

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Toets / MIDI geldt.

## Wat Keys / MIDI is

Een toetsenbord en Web MIDI-brug zonder eigen geluid. Het stuurt noten en controllers naar andere apparaten (synth, sampler, arpeggiator). De bron is het schermtoetsenbord, de computertoetsen (A–W–S–E…) of een aangesloten MIDI-keyboard.

| | |
|---|---|
| Bestand | `keys.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.keys`. Verander die nooit: daaraan hangen presets en songs van gebruikers. Het apparaat heette eerst `nl.patchkamer.toets`; werkruimtes of presets uit die tijd verwijzen naar de oude id |
| Naam | `Keys / MIDI` in alle talen; alleen de poortnaam `Notes / CC` heeft een Nederlandse variant (`Noten / CC`, via `i18n`) |
| Soort | `utility` (categorie `tool`) |
| Poorten | alleen een eventuitgang `notes` ("Noten / CC"); geen audio, geen ingangen |
| Contract | v1.13 (apparaatversie 1.12.0): elke gebeurtenis draagt `ch` (MIDI-kanaal); elke MIDI-CC gaat door met `cc` (nummer) en een naam (`cutoff`, `level`, `vibrato`, `expression` zoals eerder, anders `ccN`; het sustainpedaal als `pedal`; kanaaldruk als `pressure`) |
| Licentie apparaat | AGPL-3.0-or-later |

Wat het uitstuurt: `note` (met `dur`, in vasthoudmodus ook `held: true`), `noteoff`, `allnotesoff` en `cc` met `id` `bend`, `vibrato`, `expression`, `cutoff` of `level` (waarde 0 … 1). MIDI vraagt alleen toestemming na een klik op de knop; er is geen sysex.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Keys / MIDI is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak hiervoor geen pack in `../../../tunes/`. Maak alleen presets als de opdracht dat uitdrukkelijk vraagt.

## De state en de preset

`getState()` bevat acht velden. Een **preset** (`getPreset`/`setPreset`) bevat alleen de eerste vier: routing (kanaal, ingang) en lopende waarden (bend, wiel) horen niet in een preset.

| Veld | Wat | Bereik | Start | In preset |
|---|---|---|---|---|
| `root` | Laagste toets (MIDI-nootnummer) | 24 … 84, afgerond op een veelvoud van 12 | 48 | ja |
| `velocity` | Aanslagsterkte | 0,05 … 1 | 0,8 | ja |
| `duration` | Pulsduur in seconden | 0,05 … 8 | 0,5 | ja |
| `mode` | Speelmodus | `pulse` of `hold` | `pulse` | ja |
| `channel` | MIDI-kanaal (0 = alle) | geheel getal 0 … 16 | 0 | nee |
| `input` | MIDI-ingang (`all` of een id) | tekst | `all` | nee |
| `bend` | Pitchbend (0,5 = midden) | 0 … 1 | 0,5 | nee |
| `wheel` | Modulatiewiel | 0 … 1 | 0 | nee |

Wat het apparaat met een state doet:
- Getallen buiten het bereik worden afgekapt; een ontbrekende of ongeldige waarde krijgt de startwaarde. Onbekende velden worden genegeerd.
- `setState` en `setPreset` stoppen eerst alle klinkende noten (`panic`) en bouwen daarna de UI opnieuw op.
- `setPreset({})` verandert niets; een preset raakt `channel`, `input`, `bend` en `wheel` niet aan.

## Een preset

Een pack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`. Het formaat staat in het contract (§13c); alles in `presets/` heeft licentie `CC0-1.0`. Voor dit apparaat is `device` altijd `nl.patchkamer.keys`, elke preset is `kind: "set"` en `state` bevat alleen de vier velden uit de tabel.

```json
{
  "format": "patchkamer-presets",
  "formatVersion": 2,
  "device": "nl.patchkamer.keys",
  "name": "Keys play modes",
  "author": "<naam van de maker>",
  "license": "CC0-1.0",
  "description": "<korte omschrijving>",
  "tree": [
    { "name": "Kort aanslaan", "kind": "set", "version": "1.0.0", "state": { "root": 48, "velocity": 0.8, "duration": 0.2, "mode": "pulse" } },
    { "name": "Vasthouden", "kind": "set", "version": "1.0.0", "state": { "root": 48, "velocity": 0.8, "duration": 0.5, "mode": "hold" } }
  ]
}
```

Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/tools/Keys/keys.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Het apparaat tekent niet zelf per frame; er is geen `requestAnimationFrame`. Houd dat zo.
- De validator kan geen echte MIDI-hardware en geen toestemmingsvraag van de browser testen. Schrijf in je oplevering wat je **niet** hebt getest.
- Alle tekst staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- Kleuren komen uit de CSS-variabelen van de host; zet geen vaste kleuren in de UI (de pianotoetsen zijn de enige uitzondering).

## Wat je niet doet

- Verander nooit de `id`, de `kind` of het poort-id `notes`, en verwijder geen state-velden: oude werkruimtes en presets hangen eraan.
- Voeg geen audiopoorten toe: dit apparaat heeft geen geluid.
- Commit of push niet, tenzij de opdracht dat vraagt.
