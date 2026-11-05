# Tools

*Nederlandse versie: [README_NL.md](README_NL.md)*

Helpers for making music: play, record, measure, take notes and control other devices. Tools are not effects, and most make no sound of their own (the exception is Metronome, which plays a click). Each tool has its own folder here with the device file and an `AGENTS.md`.

| Device | What it does | Folder | Manual |
|---|---|---|---|
| **Keys / MIDI** | A keyboard (screen, computer keys or MIDI) that sends notes to other devices | `Keys/` | [Keys / MIDI](../../docs/tools/USER-MANUAL_EN.md#keys--midi) |
| **MIDI Hub** | Connects MIDI sources and sequencer tracks to devices, and puts any control of a device on a knob, slider or pad of your MIDI device; saves mappings per device | `MidiHub/` | [MIDI Hub](../../docs/tools/USER-MANUAL_EN.md#midi-hub) |
| **Pad Controller** | Links devices to a grid of 40 pads (8 × 5) on a MIDI controller; you choose the MIDI input and the output for the lights | `PadController/` | [Pad Controller](../../docs/tools/USER-MANUAL_EN.md#pad-controller) |
| **Recorder** | Records what comes in and passes it on unchanged; saves WAV, MP3 or WebM/MP4 | `Recorder/` | [Recorder](../../docs/tools/USER-MANUAL_EN.md#recorder) |
| **Multitrack** | Records up to 16 tracks from a bundle, one WAV per track | `Multitrack/` | [Multitrack](../../docs/tools/USER-MANUAL_EN.md#multitrack) |
| **Scope** | Shows the sound (spectrum, waveform, spectrogram, stereo image, peak/RMS); passes it on unchanged | `Scope/` | [Scope](../../docs/tools/USER-MANUAL_EN.md#scope) |
| **Metronome** | A click on every bar, beat, eighth or sixteenth of the studio clock; the same beats go out as trigs | `Metronome/` | [Metronome](../../docs/tools/USER-MANUAL_EN.md#metronome) |
| **Notes** | A notepad with key, tempo, sections and a to-do list; no sound, no ports | `Notes/` | [Notes](../../docs/tools/USER-MANUAL_EN.md#notes) |

## More

- User manual for the tools: [docs/tools/USER-MANUAL_EN.md](../../docs/tools/USER-MANUAL_EN.md)
- Main manual: [docs/USER-MANUAL_EN.md](../../docs/USER-MANUAL_EN.md)
- Presets for tools: [`metronome.patchkamer-presets.json`](../../presets/metronome.patchkamer-presets.json) (Metronome Basics, 9 presets) and [`midi-hub.patchkamer-presets.json`](../../presets/midi-hub.patchkamer-presets.json) (MIDI Hub Basics, 15 presets). The other tools have none yet; the format and how to make your own are in [presets/](../../presets/README.md)

## License

AGPL-3.0-or-later, like all devices. See [LICENSE](../LICENSE) and [LICENSING.md](../../LICENSING.md). The MP3 encoder inside Recorder is lamejs (LGPL-3.0); see the Recorder section of the manual.
