# AGENTS.md: Tremolo

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Tremolo geldt.

## Wat Tremolo is

Een tremolo-effect: een trage oscillator (LFO) laat het volume van het signaal op en neer gaan. Snelheid is de frequentie van de oscillator, Diepte hoeveel het volume meebeweegt. Het apparaat is bestuurbaar: een modulator kan zowel Snelheid als Diepte laten bewegen. Er zit geen geheugen in de signaalweg.

| | |
|---|---|
| Bestand | `tremolo.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.tremolo`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Tremolo` in alle talen; alleen de poortnamen `In` en `Out` hebben een Nederlandse variant (via `i18n`: `Uit`) |
| Soort | `effect` (categorie `effect`): Tremolo krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturingsingang `mod`; geen events |
| Stuurbare parameters | `rate` (logaritmisch) en `depth`, in één spoor `Tremolo`; geen snelle sturing |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere id (`nl.voorbeeld.tremolo`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Tremolo is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Tremolo geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.tremolo` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Tremolo heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `rate` | Snelheid van de oscillator | 0,1 … 20 | 4 | Hz |
| `depth` | Diepte | 0 … 1 | 0,5 | deel van het volume |

Wat Tremolo met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde. `setState({})` geeft de startwaarden.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen volgen `setState`; het geluid gaat zacht naar de nieuwe waarde (`setTargetAtTime`).

Wat Tremolo met zijn ingang doet (getest): het is een vermenigvuldiging zonder geheugen. Een `NaN`, `±Infinity` of enorme waarde op de ingang gaat dus door naar de uitgang zolang hij duurt, maar laat daarna niets achter: het geluid komt terug. Begrens zo nodig in het apparaat ervoor of erachter.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Tremolo/tremolo.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
