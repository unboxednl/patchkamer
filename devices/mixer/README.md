# mixer

*Nederlandse versie: [README_NL.md](README_NL.md)*

Devices that bring sounds together and send them out. They make no sound of their own, so they have **presets** (not tunes).

| Device | What it does | Folder | Manual |
|---|---|---|---|
| **Mixer** | A mixing desk with 1 to 32 channels and 0 to 8 groups: trim, EQ, send and return, pan, fader, mute and solo, bundle in and out, and a master with a limiter | [`Mixer/`](Mixer/) | [Mixer](../../docs/mixer/USER-MANUAL_EN.md#mixer) |
| **Leveler** | Keeps the average volume of a source steady, with a limiter behind it | [`Leveler/`](Leveler/) | [Leveler](../../docs/mixer/USER-MANUAL_EN.md#leveler) |
| **Speakers** | The output of the studio: volume, a limiter and a level meter | [`Speakers/`](Speakers/) | [Speakers](../../docs/mixer/USER-MANUAL_EN.md#speakers) |
| **Audio Output** | Sends the sound to an output you choose, such as an audio interface or headphones: volume, mono, limiter, meters, channel pair | [`AudioOutput/`](AudioOutput/) | [Audio Output](../../docs/mixer/USER-MANUAL_EN.md#audio-output) |
| **Audio Input** | Brings in sound from an input of the computer or an audio interface: channel choice, mono or stereo, gain, high-pass, meters | [`AudioInput/`](AudioInput/) | [Audio Input](../../docs/mixer/USER-MANUAL_EN.md#audio-input) |

## More

- [User manual for the mixer devices](../../docs/mixer/USER-MANUAL_EN.md): how to connect them, every control, examples.
- Presets: [`leveler.patchkamer-presets.json`](../../presets/leveler.patchkamer-presets.json) (11 presets) and [`audio-input.patchkamer-presets.json`](../../presets/audio-input.patchkamer-presets.json) (31 presets), [`audio-output.patchkamer-presets.json`](../../presets/audio-output.patchkamer-presets.json) (16 presets). Mixer and Speakers have no preset pack. See also the [presets folder](../../presets/).
- Basics of Patchkamer: the [main user manual](../../docs/USER-MANUAL_EN.md).

## License

AGPL-3.0-or-later. See [LICENSE](../LICENSE) and [LICENSING.md](../../LICENSING.md).
