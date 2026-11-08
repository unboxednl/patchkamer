# AGENTS.md: devices/samplers/ (Samplers)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Samplers** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Apparaten die eigen geluid spelen: pads en slices uit geladen audio (Samplebank, Loop Slicer).

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [tunes/AGENTS.md](../../tunes/AGENTS.md) (hoe tunes zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/samplers/USER-MANUAL_NL.md) · [EN](../../docs/samplers/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'instrument'`; noten in, audio uit. Het geluid komt uit geladen audio (contract §13e, `loadAudio`).
- Een tune van een sampler bevat **nooit de audio zelf**, alleen de instellingen (hoe geknipt, hoe gespeeld). De audio zit in een samplepack of een bestand van de gebruiker; zie [samples/AGENTS.md](../../samples/AGENTS.md).
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/samplers/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak tunes en bijbehorende documentatie volgens [tunes/AGENTS.md](../../tunes/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Loop Slicer](LoopSlicer/AGENTS.md) | `nl.patchkamer.loopslicer` | Knipt een loop in 4, 8, 16 of 32 slices en speelt ze vanaf toetsen of een patroon van 16 stappen op de klok; met een ingebouwde demo-loop |
| [Samplebank](Samplebank/AGENTS.md) | `nl.patchkamer.samplebank` | Een sampler met 4 banken van 16 pads: laad WAV of MP3, bewerk de selectie, speel vanaf pads of chromatisch, importeer en exporteer banken |

<!-- agents-tree:end -->
