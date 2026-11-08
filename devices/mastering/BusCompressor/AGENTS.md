# AGENTS.md: Bus Compressor

Dit bestand is voor AI-agents die **presets voor Bus Compressor** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Bus Compressor geldt.

## Wat Bus Compressor is

Een stereo-linked compressor voor de master of een bus: threshold, ratio, attack, release, knee, make-up en een parallelmix. De detector kan op het eigen signaal of op de sidechain-ingang staan. Een analyse van acht seconden doet een voorstel. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `bus-compressor.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.buscompressor`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Bus Compressor` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-ingang `side` (Sidechain); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Samenhang, `nl.patchkamer.mastering.comp`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `threshold` | Threshold / Threshold | -60 … 0 dB | -18 |
| `ratio` | Ratio / Ratio | 1 … 12 | 2 |
| `attack` | Attack / Attack | 0.001 … 0.1 s | 0.02 |
| `release` | Release / Release | 0.03 … 1.5 s | 0.2 |
| `knee` | Knee / Knee | 0 … 18 dB | 6 |
| `makeup` | Make-up / Make-up | -12 … 18 dB | 0 |
| `compMix` | Compressormix / Compressor mix | 0 … 1 | 1 |
| `detector` | Detector / Detector | `internal` / `side` | `internal` |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Soft bus`, `Drums`, `Kick/bass ducking`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Wat `attack` en `release` doen (gemeten 07-11-2026, DSP ongewijzigd)

- Signaalweg: de detector neemt de grootste absolute waarde van links en rechts (stereo-gelinkt) of van de Sidechain-ingang en maakt er een piekomhullende van met een **vaste** aanval van 1 ms en een vaste terugval van 45 ms. Threshold, knee en ratio rekenen op die omhullende en geven een gewenste gain reduction in dB. Die reductie wordt daarna gladgestreken met een eenpolig filter: met de tijd `attack` zolang de reductie toeneemt, met de tijd `release` zolang ze afneemt (tijdconstanten, 63 %). `attack` en `release` sturen dus de gain, niet de detector; de drempel hangt aan de piekomhullende, niet aan RMS.
- Effect op een drumloop (120 bpm, -16 dB RMS, threshold -20, ratio 2,4, knee 6): attack 1 ms → 100 ms verlaagt de gemiddelde gain reduction van 6,3 naar 4,9 dB (95e percentiel 8,9 → 6,5 dB), het niveau gaat 2,4 dB omhoog en de crestfactor daalt 0,8 dB; release 30 ms → 800 ms verhoogt de gemiddelde reductie van 4,6 naar 7,1 dB (1,5 s: 7,5 dB) en het niveau gaat 2,0 dB omlaag (800 ms). Beide werken dus duidelijk hoorbaar (meer dan 1 dB); er is niets aan de DSP veranderd.
- Grens: omdat de detector zelf 45 ms nodig heeft om terug te vallen, zijn release-waarden onder ongeveer 50 ms bijna gelijk (30 ms tegen 50 ms: 0,2 dB verschil in gemiddelde reductie). Een attack onder ongeveer 5 ms verschilt weinig van 1 ms (6,2 tegen 6,3 dB). Hoor je geen verschil tussen twee zulke waarden, dan ligt dat hieraan en is het geen fout.
- Een stapsignaal (1 kHz, van -30 naar -6 dB) laat het zien: bij attack 100 ms is de gain 100 ms na de stap nog niet ingezet (-14,3 dB piek), bij 1 ms en 20 ms wel (-19,2 en -19,1 dB).

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.buscompressor`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack is gegenereerd (stijl × situatie, eigen waarden voor alle instellingen; generator `mpresets/buscomp.py`, buiten de repo) en daarna per preset met de motor gekalibreerd (make-up). Wijzig je het geluid van het apparaat, kalibreer `makeup` dan opnieuw; verander je waarden met de hand, controleer dan dat de piek niet hoger wordt dan de invoer.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/BusCompressor/bus-compressor.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Bus Compressor: [NL](../../../docs/mastering/USER-MANUAL_NL.md#bus-compressor) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#bus-compressor).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [bus-compressor.patchkamer-presets.json](../../../presets/bus-compressor.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mastering](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: mastering of bus-compressie. Audio in `in`, uit `out`; `side` is een optionele sidechain-ingang, `setup` de mastering-kabel van de Master Director.
