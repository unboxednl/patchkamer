# AGENTS.md: Multitrack

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Multitrack geldt.

## Wat Multitrack is

Een meersporenrecorder: neemt tot 16 sporen tegelijk op, sample-gelijk, als stereo-WAV (16 of 24 bit, of 32 bit float). De ingang is een bundel (dikke groene kabel), bijvoorbeeld de bundeluitgang van de Mixer of de losse uitgangen van een drumcomputer. Nieuwe bundelkanalen komen vanzelf op vrije sporen (instelbaar); per spoor kies je de bron, de naam en of het spoor opgenomen wordt (arm). Elke take blijft deze sessie in het geheugen; je bewaart alles in één `.zip` (een WAV per spoor) of per spoor. Opnemen kan met een knop of met start/stop van de klok. Het geluid wordt niet veranderd en loopt niet door: dit apparaat luistert alleen mee.

| | |
|---|---|
| Bestand | `multitrack.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.multitrack`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Multitrack` in alle talen; alleen de poortnaam `Bundel` heeft een Engelse variant (`Bundle`, via `i18n`) |
| Soort | `utility`: Multitrack krijgt dus **presets** (geen tunes) |
| Poorten | één bundelingang `in`; geen audio-, event- of stuurpoorten |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand (`multitrack_v1.8.0.js`, versie 1.8.0). De `id` is hetzelfde gebleven.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Multitrack is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Multitrack geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.multitrack` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`getPreset()` geeft de state **zonder** `src` per spoor (welke bron op welk spoor staat is routing en hoort niet in een preset); `setPreset` laat de bronkeuzes staan. Zet in een preset dus geen `src`.

Bovenste niveau:

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | Naam van de sessie (begin van de bestandsnaam) | tekst, hoogstens 60 tekens | `Session` |
| `nTr` | Aantal sporen | 1 … 16 (geheel getal) | 8 |
| `bits` | WAV-formaat | `16`, `24` of `32` (32 = float) | 24 |
| `withTransport` | Opnemen met start/stop van de klok | boolean | `false` |
| `auto` | Nieuwe bundelkanalen vanzelf op vrije sporen zetten | boolean | `true` |
| `tr` | Lijst met `nTr` sporen | zie onder | – |

Spoor (`tr[i]`):

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | Naam van het spoor (wordt de bestandsnaam) | tekst, hoogstens 32 tekens | leeg |
| `src` | Bronkeuze uit een bundel (`sleutel\|kanaal-id`); niet in presets | tekst | leeg |
| `arm` | Opnemen op dit spoor | boolean | `true` |

Wat Multitrack met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`nTr: 99` wordt 16); een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde. Een getal als tekst (`"24"`) telt niet.
- Een `bits` die niet 16, 24 of 32 is, en een boolean die geen boolean is, geven de startwaarde.
- Een lijst `tr` die korter is dan `nTr` wordt aangevuld met standaardsporen (leeg, gearmd).
- Onbekende velden worden genegeerd en komen niet in de state terecht. Zet er geen in.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Multitrack/multitrack.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een opname klinkt. Heb je geen browser, schrijf dan in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.
- De opname-worklet (`pk-multitrack`) is ongewijzigd; verander je hem, verhoog dan de worklet-naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
