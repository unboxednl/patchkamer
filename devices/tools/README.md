# Tools

*Nederlandse versie: [README_NL.md](README_NL.md)*

Helpers for making music: play, record, measure, take notes and control other devices. Tools are not effects, and most make no sound of their own (the exception is Metronome, which plays a click). Each tool has its own folder here with the device file and an `AGENTS.md`.

| Device | What it does | Folder | Manual |
|---|---|---|---|
| **Chord Buddy** | Helps you find chords without music theory: pick a key and style or play a chord on a MIDI keyboard, get chord, key and next-chord suggestions, save chords in 16 pads, play the pads as a set with a separate bass, and get bass and voice-leading advice | `ChordBuddy/` | [Chord Buddy](../../docs/tools/USER-MANUAL_EN.md#chord-buddy) |
| **Control Surface** | *Retired, replaced by the MIDI Controller and the Keyboard.* Shows a MIDI controller with knobs, faders, pads and buttons as a panel with a layout you build from sections; sends what you do as CC | `ControlSurface/` | [Control Surface](../../docs/tools/USER-MANUAL_EN.md#control-surface) |
| **Drum Listener** | Listens to a drum loop (an audio file, a sample from the library or a recording from the input) and writes down the pattern: kick, snare, hats, toms and percussion on their own lanes; plays it to a drum machine or copies it to a sequencer | `DrumListener/` | [Drum Listener](../../docs/tools/USER-MANUAL_EN.md#drum-listener) |
| **Keyboard** | A keyboard with a settable number of keys (25 to 88) that sends notes to other devices: screen keys, computer keys, pitch bend, modulation, sustain | `Keyboard/` | [Keyboard](../../docs/tools/USER-MANUAL_EN.md#keyboard) |
| **MIDI Controller** | All your MIDI controllers and keyboards at once: choose which device you control, switch devices with a button, map quickly (layout, suggestion, quick map), save mappings as presets | `MidiController/` | [MIDI Controller](../../docs/tools/USER-MANUAL_EN.md#midi-controller) |
| **Keys / MIDI** | *Retired, replaced by the MIDI Controller and the Keyboard.* A keyboard (screen, computer keys or MIDI) that sends notes to other devices | `Keys/` | [Keys / MIDI](../../docs/tools/USER-MANUAL_EN.md#keys--midi) |
| **MIDI Hub** | *Retired, replaced by the MIDI Controller and the Keyboard.* Connects MIDI sources and sequencer tracks to devices, and puts any control of a device on a knob, slider or pad of your MIDI device; saves mappings per device | `MidiHub/` | [MIDI Hub](../../docs/tools/USER-MANUAL_EN.md#midi-hub) |
| **Pad Controller** | *Retired, replaced by the MIDI Controller and the Keyboard.* Links devices to a grid of 40 pads (8 × 5) on a MIDI controller; you choose the MIDI input and the output for the lights | `PadController/` | [Pad Controller](../../docs/tools/USER-MANUAL_EN.md#pad-controller) |
| **Recorder** | Records what comes in and passes it on unchanged; saves WAV, MP3 or WebM/MP4 | `Recorder/` | [Recorder](../../docs/tools/USER-MANUAL_EN.md#recorder) |
| **Multitrack** | Records up to 16 tracks from a bundle, one WAV per track | `Multitrack/` | [Multitrack](../../docs/tools/USER-MANUAL_EN.md#multitrack) |
| **Scope** | Shows the sound (spectrum, waveform, spectrogram, stereo image, peak/RMS); passes it on unchanged | `Scope/` | [Scope](../../docs/tools/USER-MANUAL_EN.md#scope) |
| **Metronome** | A click on every bar, beat, eighth or sixteenth of the studio clock; the same beats go out as trigs | `Metronome/` | [Metronome](../../docs/tools/USER-MANUAL_EN.md#metronome) |
| **Notes** | A notepad with key, tempo, sections and a to-do list; no sound, no ports | `Notes/` | [Notes](../../docs/tools/USER-MANUAL_EN.md#notes) |
| **Stem Splitter** | Splits a track into stems (vocals, drums, bass, the rest) with an online service, which costs money per track and needs the rights to the music; a file, a sample from the library or a recording from the input goes in, an output per stem and a bundle come out, played with the studio clock; saves the stems as WAV and hands the drums to the Drum Listener | `StemSplitter/` | [Stem Splitter](../../docs/tools/USER-MANUAL_EN.md#stem-splitter) |
| **Tune Finder** | Listens to a sound (one note, a short phrase, a bass line or a chord of one instrument, from a file or a recording) and finds the synth and tune of the library that comes closest, ranked by timbre, harmonics, attack and decay; **Load** puts the chosen tune on that synth in the workspace | `TuneFinder/` | [Tune Finder](../../docs/tools/USER-MANUAL_EN.md#tune-finder) |
| **Bass Finder** | Listens to a monophonic bass line (a file, a sample from the library or a recording from the input) and writes down the notes: pitch, start, length and velocity, on a grid of 1/8, 1/16 or triplet 1/16 or free; you can correct the notes, play them on a synth with the studio clock, or **Copy** them as a clip and **Paste** them into a sequencer | `BassFinder/` | [Bass Finder](../../docs/tools/USER-MANUAL_EN.md#bass-finder) |

## More

- User manual for the tools: [docs/tools/USER-MANUAL_EN.md](../../docs/tools/USER-MANUAL_EN.md)
- Main manual: [docs/USER-MANUAL_EN.md](../../docs/USER-MANUAL_EN.md)
- Presets for tools: [`chord-buddy.patchkamer-presets.json`](../../presets/chord-buddy.patchkamer-presets.json) (Chord Buddy Starter Sets, 30 sets), [`metronome.patchkamer-presets.json`](../../presets/metronome.patchkamer-presets.json) (Metronome Basics, 9 presets) [`midi-hub.patchkamer-presets.json`](../../presets/midi-hub.patchkamer-presets.json) (MIDI Hub Basics, 15 presets) and [`control-surface.patchkamer-presets.json`](../../presets/control-surface.patchkamer-presets.json) (Control Surface Layouts, 20 presets). The other tools have none yet; the format and how to make your own are in [presets/](../../presets/README.md)

## License

AGPL-3.0-or-later, like all devices. See [LICENSE](../LICENSE) and [LICENSING.md](../../LICENSING.md). The MP3 encoder inside Recorder is lamejs (LGPL-3.0); see the Recorder section of the manual.
