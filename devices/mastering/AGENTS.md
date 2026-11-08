# AGENTS.md: devices/mastering/ (Mastering)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Mastering** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Apparaten om een mix af te maken: toon, dynamiek, saturatie, breedte, volume en controle.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [presets/AGENTS.md](../../presets/AGENTS.md) (hoe presets zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../docs/mastering/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- Een keten van `in` naar `out`; Master Director zet ze allemaal tegelijk via mastering-kabels (`host.mastering`, contract v1.12). Presets, geen tunes.
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/mastering/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak presets en bijbehorende documentatie volgens [presets/AGENTS.md](../../presets/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Balance EQ](BalanceEQ/AGENTS.md) | `nl.patchkamer.balanceeq` | Parametrische equalizer met vijf tot twaalf banden, dynamische banden en analysevoorstellen |
| [Bus Compressor](BusCompressor/AGENTS.md) | `nl.patchkamer.buscompressor` | Stereo-linked buscompressor met parallelmix en sidechain |
| [Listening Output](ListeningOutput/AGENTS.md) | `nl.patchkamer.listeningoutput` | Transparante luisteruitgang met een luistervolume |
| [Master Chain](MasterChain/AGENTS.md) | `nl.patchkamer.masterchain` | Toon, buscompressie en een lookahead-limiter, met LUFS- en true-peakmeting |
| [Master Director](MasterDirector/AGENTS.md) | `nl.patchkamer.masterdirector` | Stelt de hele keten in voor een van 32 muziekstijlen en 9 situaties |
| [Mix Check](MixCheck/AGENTS.md) | `nl.patchkamer.mixcheck` | Controle op mono, side en referentie met loudness en correlatie |
| [Multiband Balance](MultibandBalance/AGENTS.md) | `nl.patchkamer.multibandbalance` | Multibandcompressor met drie banden of brede dynamische EQ |
| [Patina](Patina/AGENTS.md) | `nl.patchkamer.patina` | Subtiele harmonische saturatie: tape, buis of neutraal |
| [Stereo Space](StereoSpace/AGENTS.md) | `nl.patchkamer.stereospace` | Twee-kanaals diffusie voor breedte en diepte, met breedtebewaking voor mono |

<!-- agents-tree:end -->
