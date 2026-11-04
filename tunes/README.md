# tunes

*Nederlandse versie: [README_NL.md](README_NL.md)*

Ready-made sounds for devices that make sound (synths and drum machines), saved as data. Choose one from the list on a device's card, use it in a song or in your own library. Devices without a sound of their own have [presets](../presets/README.md) instead.

This folder has **5 packs with 221 tunes**, one pack per device. Drum devices load a whole machine (sounds and pattern) as one tune.

## The packs

| Device | Pack | Tunes | Folders | File |
|---|---|---|---|---|
| [Duofone](../devices/synths/Duofone/) | Duofone Styles | 60 | Techno (5), House (5), Trance (5), Ambient (5), Drum & Bass (5), Dubstep (5), Synthwave (5), Funk & Disco (5), Hip-hop (5), Electro (5), Pop (5), Chiptune (5) | [`duofone-styles.patchkamer-tunes.json`](duofone-styles.patchkamer-tunes.json) |
| [Acid Baselines](../devices/synths/AcidBaselines/) | Acid Baselines Classics | 49 | Chicago Origins (5), Frankfurt Rolling (5), Minimal Acid (5), Squelch Anthems (5), Acid Techno (5), Acid Trance (5), Electro Acid (5), Deep Acid (5), AIcid (9) | [`acid-baselines-classics.patchkamer-tunes.json`](acid-baselines-classics.patchkamer-tunes.json) |
| [Drum Kit](../devices/drums/DrumKit/) | Drum Kit Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-kit-styles.patchkamer-tunes.json`](drum-kit-styles.patchkamer-tunes.json) |
| [Drum Machine](../devices/drums/DrumMachine/) | Drum Machine Styles | 36 | Techno (3), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-machine-styles.patchkamer-tunes.json`](drum-machine-styles.patchkamer-tunes.json) |
| [Groovebox 12](../devices/drums/Groovebox12/) | Groovebox 12 Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`groovebox-12-styles.patchkamer-tunes.json`](groovebox-12-styles.patchkamer-tunes.json) |

The folders inside each pack are listed in the manual: [Tunes: user manual](../docs/tunes/USER-MANUAL_EN.md).

## How to use them

- Load `github.com/unboxednl/patchkamer` as a library in Patchkamer: the packs come with it. Or download a file from this folder and use **Tunes ▾ → Import…**.
- Then choose a tune in the list on the card of the device.
- Full explanation, including how to save, export, share and make your own packs: [Tunes: user manual](../docs/tunes/USER-MANUAL_EN.md). The basics of Patchkamer: [main manual](../docs/USER-MANUAL_EN.md).

## File format

One pack per file, named `name.patchkamer-tunes.json`: JSON with `format` (`patchkamer-tunes`), `formatVersion` (1), `device` (the exact id of the device), `name`, `author`, `license`, `description` and a `tree`. The `tree` holds folders (`folder` with `items`) and tunes; every item has a `name`, `kind: "set"` and the device's own `state`. Rules for agents that write packs: [AGENTS.md](AGENTS.md).

## License

CC0-1.0 (public domain). Whether settings are protected by copyright is doubtful, especially when they were made with AI. CC0 removes that doubt: you may reuse a tune without naming the author. See [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md).
