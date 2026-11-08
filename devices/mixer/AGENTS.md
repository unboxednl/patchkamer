# AGENTS.md: devices/mixer/ (Mixer)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Mixer** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Binnenhalen, mixen, het niveau gelijk houden en afspelen: Mixer, Leveler, Speakers, Audio Input, Audio Capture en Audio Output.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [presets/AGENTS.md](../../presets/AGENTS.md) (hoe presets zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/mixer/USER-MANUAL_NL.md) · [EN](../../docs/mixer/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'mixer'` of `'output'`. Een song met Audio Input of Audio Capture klinkt niet bij elke luisteraar hetzelfde, want het geluid hangt af van wat is aangesloten. Presets, geen tunes.
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/mixer/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak presets en bijbehorende documentatie volgens [presets/AGENTS.md](../../presets/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Audio Capture](AudioCapture/AGENTS.md) | `nl.patchkamer.audiocapture` | Haalt het geluid van een ander browsertabblad, een venster of (op Windows) het systeem naar binnen, om te samplen of op te nemen: weergave, versterking, hoogdoorlaat, meters |
| [Audio Input](AudioInput/AGENTS.md) | `nl.patchkamer.audioinput` | Haalt geluid van een ingang van de computer of een audio-interface naar binnen: kanaalkeuze, mono of stereo, versterking, hoogdoorlaat, meters |
| [Audio Output](AudioOutput/AGENTS.md) | `nl.patchkamer.audiooutput` | Stuurt het geluid naar een uitgang die je kiest, zoals een audio-interface of koptelefoon: volume, mono, begrenzer, meters, kanaalpaar |
| [Leveler](Leveler/AGENTS.md) | `nl.patchkamer.leveler` | Houdt het gemiddelde volume van een bron gelijk, met een limiter erachter |
| [Mixer](Mixer/AGENTS.md) | `nl.patchkamer.mixer` | Een mengpaneel met 1 tot 32 kanalen en 0 tot 8 groepen: trim, EQ, send en return, pan, fader, mute en solo, bundel in en uit, en een master met limiter |
| [Speakers](Speakers/AGENTS.md) | `nl.patchkamer.speakers` | De uitgang van de studio: volume, een limiter en een niveaumeter |

<!-- agents-tree:end -->
