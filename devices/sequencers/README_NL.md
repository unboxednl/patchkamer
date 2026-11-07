# Sequencers

*English version: [README.md](README.md)*

Apparaten die noten spelen voor andere apparaten. Een sequencer maakt zelf geen geluid: hij stuurt noten naar synths, drones of drumcomputers, die je met kabels verbindt. Er zijn er acht, in vijf soorten: akkoord-, stap- en melodie-, arpeggio-, ritme- en patroon- en clipsequencers. Elke sequencer heeft hier een eigen map met het apparaatbestand en een `AGENTS.md`. Elke sequencer heeft **presets** (geen tunes); de packs staan in [`presets/`](../../presets/).

Weet je niet welke je moet kiezen? De handleiding begint met een tabel "Welk apparaat voor welk doel".

| Apparaat | Wat het doet | Map | Presets | Handleiding |
|---|---|---|---|---|
| **Chord Sequencer** | Vier onafhankelijke sporen (A–D) met akkoorden, arpeggio's, losse of opgenomen noten in patronen van 1 tot 16 stappen; vier scènes; velocity en lengte per stap; raster 1/16, 1/32, 1/64; live toetsenbord en inspelen; spoor of hele scène (vier sporen) kopiëren en plakken als noten (akkoord- en arpeggiosporen worden gekopieerd als vier maten noten) | [`ChordSequencer/`](ChordSequencer/) | [80](../../presets/chord-sequencer.patchkamer-presets.json) in 14 mappen | [Chord Sequencer](../../docs/sequencers/USER-MANUAL_NL.md#chord-sequencer) |
| **Step Sequencer** | Eén lijn van 1 tot 64 stappen op een pianorol, met noot, velocity, lengte en timing per stap; raster 1/16, 1/32, 1/64; swing, humanize, live toetsenbord en inspelen; patroon kopiëren en plakken | [`StepSequencer/`](StepSequencer/) | [70](../../presets/step-sequencer.patchkamer-presets.json) in 6 mappen | [Step Sequencer](../../docs/sequencers/USER-MANUAL_NL.md#step-sequencer) |
| **Wanderer** | Een kansmelodie: verzint een motief in een toonladder, herhaalt het en verandert het beetje bij beetje; kan een akkoord volgen; motief kopiëren als momentopname in noten, plakken kan niet | [`Wanderer/`](Wanderer/) | [60](../../presets/wanderer.patchkamer-presets.json) in 9 mappen | [Wanderer](../../docs/sequencers/USER-MANUAL_NL.md#wanderer) |
| **Scale Arpeggiator** | Speelt de vastgehouden noten van een akkoord of toetsenbord om de beurt in negen patronen over 1 tot 4 octaven, met velocity- en lengtepatronen | [`ScaleArpeggiator/`](ScaleArpeggiator/) | [59](../../presets/scale-arpeggiator.patchkamer-presets.json) in 10 mappen | [Scale Arpeggiator](../../docs/sequencers/USER-MANUAL_NL.md#scale-arpeggiator) |
| **Euclidean Rhythms** | Acht rijen die slagen over stappen verdelen (3 over 8, 7 over 12…), met rotatie, accenten, ghost notes en fills; trigs voor drums of noten; live toetsenbord op de gekozen rij; ritme kopiëren als momentopname (noten of drums), plakken kan niet | [`EuclideanRhythms/`](EuclideanRhythms/) | [65](../../presets/euclidean-rhythms.patchkamer-presets.json) in 8 mappen | [Euclidean Rhythms](../../docs/sequencers/USER-MANUAL_NL.md#euclidean-rhythms) |
| **Pattern Playlist** | Bouwt een song in lagen: patronen per laag die als blokken op een tijdlijn staan, tot 32 sporen; pianorol, effecten, live toetsenbord en inspelen; kanaal of heel patroon (alle kanalen) kopiëren en plakken (pianorol als noten, drum-editor als drums) | [`PatternPlaylist/`](PatternPlaylist/) | [35](../../presets/pattern-playlist.patchkamer-presets.json) in 5 mappen | [Pattern Playlist](../../docs/sequencers/USER-MANUAL_NL.md#pattern-playlist) |
| **Pattern Tracker** | Een tracker: noten in rijen met een effectkolom (arpeggio, retrigger, vertraging, kans, CC) en een volgorde van patronen; live toetsenbord en inspelen; kanaal of heel patroon (alle kanalen) kopiëren en plakken (pianorol als noten, drum-editor als drums) | [`PatternTracker/`](PatternTracker/) | [34](../../presets/pattern-tracker.patchkamer-presets.json) in 4 mappen | [Pattern Tracker](../../docs/sequencers/USER-MANUAL_NL.md#pattern-tracker) |
| **Clip Arranger** | Clips en scènes per spoor (tot 16 sporen) en een song-arrangement; CC-lanes; raster per clip; live toetsenbord en inspelen; clip of hele scène (de clip van elk spoor) kopiëren en plakken | [`ClipArranger/`](ClipArranger/) | [58](../../presets/clip-arranger.patchkamer-presets.json) in 10 mappen | [Clip Arranger](../../docs/sequencers/USER-MANUAL_NL.md#clip-arranger) |

De kolom **Presets** linkt naar het pack van die sequencer en geeft het aantal presets en mappen erin.

## Meer

- Gebruikershandleiding voor de sequencers: [docs/sequencers/USER-MANUAL_NL.md](../../docs/sequencers/USER-MANUAL_NL.md)
- Presets, met een overzicht van alle packs en hoe je ze importeert: [presets/README_NL.md](../../presets/README_NL.md)
- Basishandleiding: [docs/USER-MANUAL_NL.md](../../docs/USER-MANUAL_NL.md)

## Licentie

AGPL-3.0-or-later. Zie [LICENSE](../LICENSE) en [LICENSING.md](../../LICENSING.md).
