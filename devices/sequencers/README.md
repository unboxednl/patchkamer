# Sequencers

*Nederlandse versie: [README_NL.md](README_NL.md)*

Devices that play notes for other devices. A sequencer makes no sound of its own: it sends notes to synths, drones or drum machines, which you connect with cables. There are eight, in five kinds: chord, step and melody, arpeggio, rhythm, and pattern and clip sequencers. Each sequencer has its own folder here with the device file and an `AGENTS.md`. Every sequencer has **presets** (no tunes); the packs are in [`presets/`](../../presets/).

Not sure which one to pick? The manual starts with a table "Which device for which purpose".

| Device | What it does | Folder | Presets | Manual |
|---|---|---|---|---|
| **Chord Sequencer** | Four independent tracks (A–D) with chords, arpeggios, single notes or recorded notes in patterns of 1 to 16 steps; four scenes; velocity and length per step; grid 1/16, 1/32, 1/64; live keyboard and recording | [`ChordSequencer/`](ChordSequencer/) | [80](../../presets/chord-sequencer.patchkamer-presets.json) in 14 folders | [Chord Sequencer](../../docs/sequencers/USER-MANUAL_EN.md#chord-sequencer) |
| **Step Sequencer** | One line of 1 to 64 steps on a piano roll, with note, velocity, length and timing per step; grid 1/16, 1/32, 1/64; swing, humanize, live keyboard and recording; copy and paste the pattern | [`StepSequencer/`](StepSequencer/) | [70](../../presets/step-sequencer.patchkamer-presets.json) in 6 folders | [Step Sequencer](../../docs/sequencers/USER-MANUAL_EN.md#step-sequencer) |
| **Wanderer** | A probability melody: invents a motif in a scale, repeats it and changes it little by little; can follow a chord | [`Wanderer/`](Wanderer/) | [60](../../presets/wanderer.patchkamer-presets.json) in 9 folders | [Wanderer](../../docs/sequencers/USER-MANUAL_EN.md#wanderer) |
| **Scale Arpeggiator** | Plays the held notes of a chord or keyboard one by one in nine patterns over 1 to 4 octaves, with velocity and length patterns | [`ScaleArpeggiator/`](ScaleArpeggiator/) | [59](../../presets/scale-arpeggiator.patchkamer-presets.json) in 10 folders | [Scale Arpeggiator](../../docs/sequencers/USER-MANUAL_EN.md#scale-arpeggiator) |
| **Euclidean Rhythms** | Eight rows that spread pulses over steps (3 over 8, 7 over 12…), with rotation, accents, ghost notes and fills; trigs for drums or notes; live keyboard on the selected row | [`EuclideanRhythms/`](EuclideanRhythms/) | [65](../../presets/euclidean-rhythms.patchkamer-presets.json) in 8 folders | [Euclidean Rhythms](../../docs/sequencers/USER-MANUAL_EN.md#euclidean-rhythms) |
| **Pattern Playlist** | Builds a song in layers: patterns per layer placed as blocks on a timeline, up to 32 tracks; piano roll, effects, live keyboard and recording | [`PatternPlaylist/`](PatternPlaylist/) | [35](../../presets/pattern-playlist.patchkamer-presets.json) in 5 folders | [Pattern Playlist](../../docs/sequencers/USER-MANUAL_EN.md#pattern-playlist) |
| **Pattern Tracker** | A tracker: notes in rows with an effect column (arpeggio, retrigger, delay, probability, CC) and a play order of patterns; live keyboard and recording | [`PatternTracker/`](PatternTracker/) | [34](../../presets/pattern-tracker.patchkamer-presets.json) in 4 folders | [Pattern Tracker](../../docs/sequencers/USER-MANUAL_EN.md#pattern-tracker) |
| **Clip Arranger** | Clips and scenes per track (up to 16 tracks) and a song arrangement; CC lanes; grid per clip; live keyboard and recording; copy and paste a clip | [`ClipArranger/`](ClipArranger/) | [58](../../presets/clip-arranger.patchkamer-presets.json) in 10 folders | [Clip Arranger](../../docs/sequencers/USER-MANUAL_EN.md#clip-arranger) |

The **Presets** column links to the pack of that sequencer and gives the number of presets and folders in it.

## More

- User manual for the sequencers: [docs/sequencers/USER-MANUAL_EN.md](../../docs/sequencers/USER-MANUAL_EN.md)
- Presets, with an overview of all packs and how to import them: [presets/README.md](../../presets/README.md)
- Main manual: [docs/USER-MANUAL_EN.md](../../docs/USER-MANUAL_EN.md)

## License

AGPL-3.0-or-later. See [LICENSE](../LICENSE) and [LICENSING.md](../../LICENSING.md).
