# AGENTS.md: devices/sequencers/ (Sequencers)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Sequencers** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Apparaten die zelf geen geluid maken maar noten, akkoorden en trigs sturen naar andere apparaten.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [presets/AGENTS.md](../../presets/AGENTS.md) (hoe presets zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../docs/sequencers/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'utility'`; uitgang `event uit` (een per spoor als er meer sporen zijn), geen audio. Een sequencer met een notenkabel naar een drumcomputer toont de klanken daarvan als rijen (`noteNames()`, contract v1.14).
- Een sequencer heeft **presets** (geen tunes). Het kopiëren en plakken van patronen loopt via het klembord van het contract (§13d, `clipInfo`, `getClip`, `setClip`).
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/sequencers/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak presets en bijbehorende documentatie volgens [presets/AGENTS.md](../../presets/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Chord Sequencer](ChordSequencer/AGENTS.md) | `nl.patchkamer.chordsequencer` | Vier onafhankelijke sporen (A–D) met akkoorden, arpeggio's, losse of opgenomen noten in patronen van 1 tot 16 stappen; vier scènes; velocity en lengte per stap; raster 1/16, 1/32, 1/64; live toetsenbord en inspelen; spoor of hele scène (vier sporen) kopiëren en plakken als noten (akkoord- en arpeggiosporen worden gekopieerd als vier maten noten) |
| [Clip Arranger](ClipArranger/AGENTS.md) | `nl.patchkamer.cliparranger` | Clips en scènes per spoor (tot 16 sporen) en een song-arrangement; CC-lanes; raster per clip; live toetsenbord en inspelen; clip of hele scène (de clip van elk spoor) kopiëren en plakken |
| [Euclidean Rhythms](EuclideanRhythms/AGENTS.md) | `nl.patchkamer.euclidean` | Acht rijen die slagen over stappen verdelen (3 over 8, 7 over 12…), met rotatie, accenten, ghost notes en fills; trigs voor drums of noten; live toetsenbord op de gekozen rij; ritme kopiëren als momentopname (noten of drums), plakken kan niet |
| [Pattern Playlist](PatternPlaylist/AGENTS.md) | `nl.patchkamer.patternplaylist` | Bouwt een song in lagen: patronen per laag die als blokken op een tijdlijn staan, tot 32 sporen; pianorol, effecten, live toetsenbord en inspelen; kanaal of heel patroon (alle kanalen) kopiëren en plakken (pianorol als noten, drum-editor als drums) |
| [Pattern Tracker](PatternTracker/AGENTS.md) | `nl.patchkamer.patterntracker` | Een tracker: noten in rijen met een effectkolom (arpeggio, retrigger, vertraging, kans, CC) en een volgorde van patronen; live toetsenbord en inspelen; kanaal of heel patroon (alle kanalen) kopiëren en plakken (pianorol als noten, drum-editor als drums) |
| [Scale Arpeggiator](ScaleArpeggiator/AGENTS.md) | `nl.patchkamer.scale-arpeggiator` | Speelt de vastgehouden noten van een akkoord of toetsenbord om de beurt in negen patronen over 1 tot 4 octaven, met velocity- en lengtepatronen |
| [Step Sequencer](StepSequencer/AGENTS.md) | `nl.patchkamer.seq` | Eén lijn van 1 tot 64 stappen op een pianorol, met noot, velocity, lengte en timing per stap; raster 1/16, 1/32, 1/64; swing, humanize, live toetsenbord en inspelen; patroon kopiëren en plakken |
| [Wanderer](Wanderer/AGENTS.md) | `nl.patchkamer.wanderer` | Een kansmelodie: verzint een motief in een toonladder, herhaalt het en verandert het beetje bij beetje; kan een akkoord volgen; motief kopiëren als momentopname in noten, plakken kan niet |

<!-- agents-tree:end -->
