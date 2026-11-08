# AGENTS.md: Grit

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Grit geldt.

## Wat Grit is

Een vervormer met filter: drive (saturatie) in een resonant laagdoorlaatfilter, met een LFO op de cutoff. Bedoeld om een bron ruwer en donkerder te maken. Via de eventingang `cc` kan de cutoff worden gestuurd (`{ type: 'cc', id: 'cutoff', value: 0..1 }`).

| | |
|---|---|
| Bestand | `grit.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.grit`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Grit` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Grit krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, eventingang `cc`, sturing `mod` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.roest`, naam "Roest"). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Grit is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Grit geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.grit` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Grit heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `drive` | Drive: hoeveel de ingang wordt vervormd | 0 … 1 | 0,3 | deel |
| `cut` | Cutoff van het laagdoorlaatfilter | 100 … 16000 | 4000 | Hz |
| `res` | Resonantie van het filter | 0,3 … 18 | 1 | dB |
| `rate` | Snelheid van de LFO op de cutoff | 0,02 … 8 | 0,2 | Hz |
| `depth` | Diepte van de LFO | 0 … 1 | 0 | deel |
| `lvl` | Uitgangsniveau (wordt gecompenseerd voor de drive) | 0 … 1 | 0,8 | deel |

Wat Grit met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (boven ±16, +24 dB) worden begrensd door een kleine worklet voor de ingang, zodat één foutieve waarde van een apparaat ervoor het filter niet voorgoed vergiftigt. Daarnaast controleert een meter om de 50 ms of het filter niet-eindige of absurde waarden geeft; dan wordt het filter vervangen door een nieuw met dezelfde instellingen. Zonder AudioWorklet werkt alleen die meter. Normaal geluid blijft bit-identiek.

Wat Grit met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- De saturatie volgt `host.audio.oversample` (`none`, `2x` of `4x`); zonder die waarde is het `2x`, zoals voorheen.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Grit/grit.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- De teksten staan in het bestand zelf (namen per taal in `MODP`, de opmerking in `NOTE`). Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-grit-1-11-0`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Grit: [NL](../../../docs/effects/USER-MANUAL_NL.md#grit) · [EN](../../../docs/effects/USER-MANUAL_EN.md#grit).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [grit.patchkamer-presets.json](../../../presets/grit.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect voor vervorming met resonant lowpass-filter. Audio in `in`, uit `out`; de cutoff is te sturen via `mod` of met `cc`-events op de eventingang `cc`.
