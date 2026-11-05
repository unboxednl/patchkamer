# AGENTS.md: Master Chain

Dit bestand is voor AI-agents die **presets voor Master Chain** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Master Chain geldt.

## Wat Master Chain is

Een masterketen: toonregeling (laag, midden, hoog) → buscompressie → lookahead-limiter met 4× true-peakbegrenzing. Meet LUFS-I, -M en -S, LRA en true peak; het doelniveau (LUFS-I) en het plafond zijn instelbaar. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `master-chain.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.masterchain`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Master Chain` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Eindbeeld, `nl.patchkamer.mastering.master`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `profile` | Doelkarakter / Target character | `transparent` / `warm` / `firm` / `club` | `transparent` |
| `target` | Doel LUFS-I / Target LUFS-I | -24 … -7 LUFS | -14 |
| `gain` | Gain voor limiter / Gain before limiter | -12 … 18 dB | 0 |
| `ceiling` | Maximaal TP / Maximum TP | -6 … -0.1 dBTP | -1 |
| `eq` | Toonregeling / Tone control | `true` of `false` | `true` |
| `low` | Laag / Low | -4 … 4 dB | 0 |
| `mid` | Midden / Mid | -4 … 4 dB | 0 |
| `high` | Hoog / High | -4 … 4 dB | 0 |
| `compress` | Buscompressie / Bus compression | `true` of `false` | `true` |
| `threshold` | Threshold / Threshold | -60 … 0 dB | -18 |
| `ratio` | Ratio / Ratio | 1 … 12 | 2 |
| `attack` | Attack / Attack | 0.001 … 0.1 s | 0.02 |
| `release` | Release / Release | 0.03 … 1.5 s | 0.2 |
| `knee` | Knee / Knee | 0 … 18 dB | 6 |
| `makeup` | Make-up / Make-up | -12 … 18 dB | 0 |
| `compMix` | Compressormix / Compressor mix | 0 … 1 | 1 |
| `limit` | Limiter / Limiter | `true` of `false` | `true` |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Transparent`, `Warm`, `Firm`, `Club`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.masterchain`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd uit de recepten van de Master Director (stijl × situatie); wijzig het niet met de hand maar via de generator, anders lopen apparaat en Director uiteen.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/MasterChain/master-chain.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Master Chain: [NL](../../../docs/mastering/USER-MANUAL_NL.md#master-chain) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#master-chain).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [master-chain.patchkamer-presets.json](../../../presets/master-chain.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: complete masterketen in één apparaat (toon, bus-compressie, limiter, loudness-meting). Audio in `in`, uit `out`; `setup` ontvangt de mastering-kabel van de Master Director. Zet hem tussen de Mixer-uitgang en de laatste uitgang.
