# AGENTS.md: Multiband Balance

Dit bestand is voor AI-agents die **presets voor Multiband Balance** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Multiband Balance geldt.

## Wat Multiband Balance is

Een multibandcompressor met drie stereo-linked LR4-banden, of een brede dynamische EQ. Elke band heeft eigen threshold, ratio, attack, release, maximale reductie en gain; er is geen upward-boost van ruis. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `multiband-balance.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.multibandbalance`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Multiband Balance` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Evenwicht, `nl.patchkamer.mastering.multiband`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `mode` | Werkwijze / Mode | `multiband` / `dyneq` | `multiband` |
| `lowSplit` | Lage crossover / Low crossover | 50 … 800 Hz | 180 |
| `highSplit` | Hoge crossover / High crossover | 1200 … 8000 Hz | 2600 |
| `mix` | Mix / Mix | 0 … 1 | 1 |
| `trim` | Uitgangstrim / Output trim | -12 … 6 dB | 0 |
| `b1On` | Laag actief / Low active | `true` of `false` | `true` |
| `b1Threshold` | Laag threshold / Low threshold | -60 … 0 dB | -27 |
| `b1Ratio` | Laag ratio / Low ratio | 1 … 6 | 1.6 |
| `b1Attack` | Laag attack / Low attack | 0.001 … 0.15 s | 0.035 |
| `b1Release` | Laag release / Low release | 0.03 … 1.2 s | 0.28 |
| `b1Range` | Laag max. reductie / Low max. reduction | 0 … 9 dB | 3 |
| `b1Gain` | Laag gain / Low gain | -6 … 6 dB | 0 |
| `b2On` | Midden actief / Mid active | `true` of `false` | `true` |
| `b2Threshold` | Midden threshold / Mid threshold | -60 … 0 dB | -24 |
| `b2Ratio` | Midden ratio / Mid ratio | 1 … 6 | 1.35 |
| `b2Attack` | Midden attack / Mid attack | 0.001 … 0.15 s | 0.022 |
| `b2Release` | Midden release / Mid release | 0.03 … 1.2 s | 0.18 |
| `b2Range` | Midden max. reductie / Mid max. reduction | 0 … 9 dB | 3 |
| `b2Gain` | Midden gain / Mid gain | -6 … 6 dB | 0 |
| `b3On` | Hoog actief / High active | `true` of `false` | `true` |
| `b3Threshold` | Hoog threshold / High threshold | -60 … 0 dB | -29 |
| `b3Ratio` | Hoog ratio / High ratio | 1 … 6 | 1.4 |
| `b3Attack` | Hoog attack / High attack | 0.001 … 0.15 s | 0.008 |
| `b3Release` | Hoog release / High release | 0.03 … 1.2 s | 0.12 |
| `b3Range` | Hoog max. reductie / High max. reduction | 0 … 9 dB | 3 |
| `b3Gain` | Hoog gain / High gain | -6 … 6 dB | 0 |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Neutral`, `Low under control`, `Soft bus glue`, `Dynamic EQ`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.multibandbalance`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd uit de recepten van de Master Director (stijl × situatie); wijzig het niet met de hand maar via de generator, anders lopen apparaat en Director uiteen.

## Skins

Alle schuiven en keuzelijsten zijn sinds 1.15.0 via `host.ui.adopt` herkenbaar voor skins: `id` is de state-sleutel (de naam van het veld in de state, plus `amount`), `role` is `param` (schuif) of `select` (keuzelijst) en `group` is de laan: `main` (modus, crossovers, Mix, Uitgangstrim), `band1`, `band2`, `band3` (laag, midden, hoog) en `auto` (`amount`). De regelaars staan per groep in een omhulsel `.grp` (zonder skin `display:contents`, dus ongewijzigd uiterlijk). De vinkjes (aan/uit, Vast) hebben geen id. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.multibandbalance/` (draaiknoppen met de naam eronder, per groep één kader, meters en spectrum naast elkaar, ongeveer 480 x 508 punten tegenover 660 x 1094). Wijzig je de opbouw van `.row`, `.line`, `.grid`, `.grp`, `.control`, `pre` of `.screen`, controleer dan die skin.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/MultibandBalance/multiband-balance.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Multiband Balance: [NL](../../../docs/mastering/USER-MANUAL_NL.md#multiband-balance) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#multiband-balance).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [multiband-balance.patchkamer-presets.json](../../../presets/multiband-balance.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mastering](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: mastering, multibandcompressie of dynamische EQ op de eindmix. Audio in `in`, uit `out`; `setup` ontvangt de mastering-kabel van de Master Director.
