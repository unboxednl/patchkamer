# AGENTS.md: Leveler

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Leveler geldt.

## Wat Leveler is

Een niveaubewaker: houdt het gemiddelde volume van een bron gelijk. Een leveler meet het niveau over een instelbare tijd en regelt het volume langzaam omhoog én omlaag naar een doelniveau, binnen een maximaal bereik. Bij stilte (onder de stiltedrempel) blijft de regeling staan, zodat galmstaarten en pauzes niet worden opgeblazen. Daarachter zit een limiter met 5 ms vooruitkijken als vangnet voor pieken boven het plafond. Bedoeld voor bronnen die door een modulator langzaam harder en zachter worden: zet hem tussen het instrument en de mixer, of op de mix vóór de uitgang.

| | |
|---|---|
| Bestand | `leveler.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.leveler`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Leveler` in alle talen; alleen de poortnamen `In` en `Out` hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Leveler krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`; geen events of sturing |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.egaal`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Leveler is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Leveler geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.leveler` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Leveler heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `on` | Stand: regelen (`true`) of doorlaten (`false`) | boolean | `true` | – |
| `target` | Doelniveau | −36 … −6 | −18 | dB |
| `speed` | Reactietijd (omlaag drie keer sneller) | 0,2 … 20 | 3 | s |
| `window` | Meettijd | 0,1 … 3 | 0,8 | s |
| `range` | Bereik ± | 0 … 24 | 12 | dB |
| `gate` | Stiltedrempel | −80 … −30 | −55 | dB |
| `ceiling` | Plafond van de limiter | −12 … 0 | −1 | dB |

Wat Leveler met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- `on` die geen boolean is, geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.

## Controleren

- `node contract/validate-instrument.mjs devices/mixer/Leveler/leveler.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
