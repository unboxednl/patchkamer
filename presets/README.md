# presets

*Nederlandse versie: [README_NL.md](README_NL.md)*

Ready-made settings for devices that make no sound of their own (effects, mixers, modulators, sequencers and other tools), saved as data. Choose one from the list on a device's card, or use a pack as the starting point for your own. Devices that make sound have [tunes](../tunes/README.md) instead.

This folder has **15 packs with 238 presets**, one pack per device. The **Effect Chain Basics** pack is special: each of its 14 presets is a complete chain of 4 to 8 effects built for one use. The **Chord Sequencer Styles** pack is the only one for a sequencer: 60 presets in 11 style folders, each filling four tracks and four scenes. The column **Folders** is the number of folders in the pack; their names are in the manual.

## The packs

### Effects (12)

| Device | Pack | Presets | Folders | File |
|---|---|---|---|---|
| [Chorus](../devices/effects/Chorus/) | Chorus Basics | 12 | 4 | [`chorus.patchkamer-presets.json`](chorus.patchkamer-presets.json) |
| [Effect Chain](../devices/effects/EffectChain/) | Effect Chain Basics | 14 | 4 | [`effect-chain.patchkamer-presets.json`](effect-chain.patchkamer-presets.json) |
| [Filter](../devices/effects/Filter/) | Filter Basics | 14 | 3 | [`filter.patchkamer-presets.json`](filter.patchkamer-presets.json) |
| [Flanger](../devices/effects/Flanger/) | Flanger Basics | 12 | 4 | [`flanger.patchkamer-presets.json`](flanger.patchkamer-presets.json) |
| [Frequency Shifter](../devices/effects/FrequencyShifter/) | Frequency Shifter Basics | 13 | 3 | [`frequency-shifter.patchkamer-presets.json`](frequency-shifter.patchkamer-presets.json) |
| [Grit](../devices/effects/Grit/) | Grit Basics | 12 | 3 | [`grit.patchkamer-presets.json`](grit.patchkamer-presets.json) |
| [Phaser](../devices/effects/Phaser/) | Phaser Basics | 11 | 3 | [`phaser.patchkamer-presets.json`](phaser.patchkamer-presets.json) |
| [Pump](../devices/effects/Pump/) | Pump Basics | 13 | 3 | [`pump.patchkamer-presets.json`](pump.patchkamer-presets.json) |
| [Resonator](../devices/effects/Resonator/) | Resonator Basics | 13 | 3 | [`resonator.patchkamer-presets.json`](resonator.patchkamer-presets.json) |
| [Room](../devices/effects/Room/) | Room Basics | 12 | 3 | [`room.patchkamer-presets.json`](room.patchkamer-presets.json) |
| [Tremolo](../devices/effects/Tremolo/) | Tremolo Basics | 13 | 4 | [`tremolo.patchkamer-presets.json`](tremolo.patchkamer-presets.json) |
| [Vocoder](../devices/effects/Vocoder/) | Vocoder Basics | 14 | 4 | [`vocoder.patchkamer-presets.json`](vocoder.patchkamer-presets.json) |

### Mixer (1)

| Device | Pack | Presets | Folders | File |
|---|---|---|---|---|
| [Leveler](../devices/mixer/Leveler/) | Leveler Basics | 11 | 3 | [`leveler.patchkamer-presets.json`](leveler.patchkamer-presets.json) |

### Modulators (1)

| Device | Pack | Presets | Folders | File |
|---|---|---|---|---|
| [Follower](../devices/modulators/Follower/) | Follower Basics | 14 | 3 | [`follower.patchkamer-presets.json`](follower.patchkamer-presets.json) |

### Sequencers (1)

| Device | Pack | Presets | Folders | File |
|---|---|---|---|---|
| [Chord Sequencer](../devices/sequencers/ChordSequencer/) | Chord Sequencer Styles | 60 | 11 | [`chord-sequencer.patchkamer-presets.json`](chord-sequencer.patchkamer-presets.json) |

The folders inside each pack are listed in the manual: [Presets: user manual](../docs/presets/USER-MANUAL_EN.md).

## How to use them

- Load `github.com/unboxednl/patchkamer` as a library in Patchkamer: the packs come with it. Or download a file from this folder and use **Presets ▾ → Import…**.
- Then choose a preset in the list on the card of the device.
- Full explanation, including how to save, export, share and make your own packs: [Presets: user manual](../docs/presets/USER-MANUAL_EN.md). The basics of Patchkamer: [main manual](../docs/USER-MANUAL_EN.md).

## File format

One pack per file, named `name.patchkamer-presets.json`: JSON with `format` (`patchkamer-presets`), `formatVersion` (2), `device` (the exact id of the device), `name`, `author`, `license`, `description` and a `tree`. The `tree` holds folders (`folder` with `items`) and presets; every item has a `name`, `kind: "set"` and the device's own `state`. Rules for agents that write packs: [AGENTS.md](../tunes/AGENTS.md) (written for tunes; the layout is the same).

## License

CC0-1.0 (public domain). Whether settings are protected by copyright is doubtful, especially when they were made with AI. CC0 removes that doubt: you may reuse a preset without naming the author. See [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md).
