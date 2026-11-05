# modulators

*Nederlandse versie: [README_NL.md](README_NL.md)*

Devices that move the controls of other devices over a purple cable. They make no sound of their own, so they have **presets** (not tunes).

| Device | What it does | Folder | Manual |
|---|---|---|---|
| **Macro** | Four knobs that each move a group of controls at once, also across devices; the knobs can also be moved over a CC event input | [`Macro/`](Macro/) | [Macro](../../docs/modulators/USER-MANUAL_EN.md#macro) |
| **LFO** | A wave in time with the clock (eight shapes, also an envelope that starts on a trigger) that moves controls of other devices | [`Lfo/`](Lfo/) | [LFO](../../docs/modulators/USER-MANUAL_EN.md#lfo) |
| **Multi-Segment Envelope** | A curve you draw over 1 to 64 bars, looping or once, for build-ups, breaks and sweeps | [`Mseg/`](Mseg/) | [Multi-Segment Envelope](../../docs/modulators/USER-MANUAL_EN.md#multi-segment-envelope) |
| **Swell** | Slow, coherent movement in four linked tracks (Breath, Warmth, Space, Sway) for pads and ambient | [`Swell/`](Swell/) | [Swell](../../docs/modulators/USER-MANUAL_EN.md#swell) |
| **Drift** | Lets the ticked controls wander very slowly around their knob position; Drifts can share a wind in a group | [`Drift/`](Drift/) | [Drift](../../docs/modulators/USER-MANUAL_EN.md#drift) |
| **Follower** | An envelope follower: turns the loudness, the hits and the brightness of a sound into control for other devices, and sends a trigger or a note at every hit | [`Follower/`](Follower/) | [Follower](../../docs/modulators/USER-MANUAL_EN.md#follower) |

## More

- [User manual for modulators](../../docs/modulators/USER-MANUAL_EN.md): how a modulator works, every control, an example.
- Presets (all in the [presets folder](../../presets/)):
  - [`macro.patchkamer-presets.json`](../../presets/macro.patchkamer-presets.json): Macro Basics, 40 presets
  - [`lfo.patchkamer-presets.json`](../../presets/lfo.patchkamer-presets.json): LFO Basics, 60 presets
  - [`mseg.patchkamer-presets.json`](../../presets/mseg.patchkamer-presets.json): Multi-Segment Envelope Presets, 54 presets
  - [`swell.patchkamer-presets.json`](../../presets/swell.patchkamer-presets.json): Swell Presets, 55 presets
  - [`drift.patchkamer-presets.json`](../../presets/drift.patchkamer-presets.json): Drift Presets, 44 presets
  - [`follower.patchkamer-presets.json`](../../presets/follower.patchkamer-presets.json): Follower Basics, 14 presets
- Basics of Patchkamer: the [main user manual](../../docs/USER-MANUAL_EN.md).

## License

AGPL-3.0-or-later. See [LICENSE](../LICENSE) and [LICENSING.md](../../LICENSING.md).
