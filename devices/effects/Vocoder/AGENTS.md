# AGENTS.md: Vocoder

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Vocoder geldt.

## Wat Vocoder is

Een 16-bands vocoder. Een stem (of elk ander signaal) op de ingang `voice` meet via 16 bandfilters, een gelijkrichter en envelope-volgers hoe sterk elke frequentieband is; die niveaus openen 16 bandfilters op een draaggolf. De draaggolf is de ingebouwde synth (zaagtand, puls of driehoek, bespeeld met noten op `notes`), ruis, of een externe synth op de tweede audio-ingang `carrier`. Zonder signaal op `voice` blijft de vocoder stil. Alles loopt via native Web Audio-nodes; er is geen worklet.

| | |
|---|---|
| Bestand | `vocoder.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.vocoder`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Vocoder` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect` (categorie `effect`): Vocoder krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingangen `voice` en `carrier`, audio-uitgang `out`, event-ingang `notes` (noten voor de interne draaggolf), sturing-ingang `mod` |
| Stuurbaar | alle elf getalvelden uit de tabel hieronder, in één spoor |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.stem`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Vocoder is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak hiervoor geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.vocoder` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Vocoder heeft geen `getPreset`). De waarden van de log-velden zijn de echte waarden, niet de schuifstand.

| Veld | Wat | Bereik | Start | Schaal |
|---|---|---|---|---|
| `sensitivity` | Gevoeligheid voor de stem | 0,5 … 24 | 8 | log |
| `response` | Reactiesnelheid van de envelope-volgers (Hz) | 5 … 80 | 25 | log |
| `formant` | Formantverschuiving in halve tonen | −12 … 12 | 0 | lineair |
| `brightness` | Helderheid | 0 … 1 | 0,6 | lineair |
| `noise` | Lucht / ruis in de draaggolf | 0 … 1 | 0,12 | lineair |
| `carrier` | Niveau van de interne draaggolf | 0 … 1 | 0,8 | lineair |
| `external` | Niveau van de externe draaggolf | 0 … 1 | 0 | lineair |
| `dry` | Droge stem erbij | 0 … 1 | 0,12 | lineair |
| `wet` | Niveau van de vocoder | 0 … 1 | 0,85 | lineair |
| `release` | Uitklank van de interne synth (s) | 0,02 … 3 | 0,2 | log |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 | lineair |
| `wave` | Golfvorm van de interne draaggolf | `sawtooth`, `square` of `triangle` | `sawtooth` | – |
| `preset` | Onthoudt welk ingebouwd klankbeeld is gekozen (`Warm Robot`, `Whisper Choir`, `Hard Machine`, `Ghost Choir`, `Subtle Voice`, `External Synth`) | een van die zes namen | `Warm Robot` | – |

Wat Vocoder met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een onbekende `wave` of `preset` geeft de startwaarde. Onbekende velden worden genegeerd. `setState({})` geeft de standaardwaarden.
- De knoppen en keuzes in de UI volgen `setState`.

Wat Vocoder met zijn ingangen doet (getest): een enkele `NaN`, `±Infinity` of absurd grote waarde op een audio-ingang liet vroeger de synthesefilters voor altijd `NaN` geven (de vocoder bleef stil, ook na het verwijderen van de bron). Nu kijkt een bewaker om de 50 ms naar de uitgang en vervangt hij de bandfilters en de compressor zodra die niet eindig of absurd groot is. Het geluid komt dan binnen ongeveer 0,1 s terug. De bewaker staat uit in een offline render; normaal geluid blijft bit-identiek.

## Skins

Het apparaat is herkenbaar voor skins (`design.controls` met `face: rotary`): sinds 1.14.0 melden de schuiven zich aan met `data-pk-id` (de state-sleutel: `sensitivity`, `response`, `formant`, `brightness`, `noise`, `carrier`, `external`, `dry`, `wet`, `release`, `level`) en `data-pk-group` `vocoder`, de twee keuzelijsten met `preset` en `wave` (groep `setup`). De golfvorm tekent op de hoogte die de CSS hem geeft (standaard 64). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.vocoder/` (draaiknoppen met waarde en naam eronder, alle knoppen in één kader, lagere golfvorm; ongeveer 480 x 277 tegenover 840 x 513). Wijzig je de opbouw van `.row`, `canvas` of `.grid`, controleer dan die skin.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Vocoder/vocoder.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De golfvorm tekent via `host.frame`; er is geen eigen `requestAnimationFrame`-lus. Houd dat zo.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Vocoder: [NL](../../../docs/effects/USER-MANUAL_NL.md#vocoder) · [EN](../../../docs/effects/USER-MANUAL_EN.md#vocoder).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [vocoder.patchkamer-presets.json](../../../presets/vocoder.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: effect met twee audio-ingangen: `voice` (de modulator; zonder signaal erop blijft de vocoder stil) en `carrier` (een externe synth als draaggolf). De ingebouwde draaggolf bespeel je met noten op `notes`. Audio uit `out`.
