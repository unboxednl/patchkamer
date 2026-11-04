# Patchkamer

*Nederlandse versie: [README_NL.md](README_NL.md)*

**Patchkamer is a modular music studio in your browser.** Place devices on a floor, connect them with cables, press Start and make music. Synths, sequencers, effects and outputs are small plug-in files that follow an open contract, so people and AI agents can build new ones.

![Keys, Acid Baselines and Speakers connected in Patchkamer](docs/images/en/03-patch.png)

## What you can do

- **Patch like a modular studio.** Drag devices onto the floor and connect them with cables: **audio**, **events** (notes), **modulation** and **bundles** (many channels in one cable).
- **Play and sequence.** A clock with tempo and swing drives the devices. Play live with the on-screen keyboard, your computer keys or a MIDI keyboard, or let a built-in step sequencer play for you.
- **Keep your sounds.** Save the full setting of any device as a **tune** (devices that make sound) or a **preset** (effects, mixers and so on). Organise them in libraries and folders and share them as packs.
- **Save and share your work.** Save a workspace as a file or in your browser, or export it as a **song** that carries all device code, a title, an author and a license, so anyone can open it.
- **Load devices from anywhere.** From a folder on your computer, from GitHub or from a web address.
- **Make it yours.** Dutch and English interface (follows your browser), dark, light and retro looks, a focus view, zoom and an audio quality setting (sample rate, latency, oversampling).
- **Private by design.** One HTML file. No install, no account, nothing uploaded.

## Quick start

1. Download this repository (**Code → Download ZIP**, or `git clone https://github.com/unboxednl/patchkamer`).
2. Open `patchkamer/patchkamer.html` in Chrome or Edge. For the smoothest start, run `python3 -m http.server 8080` in the repository folder and open `http://localhost:8080/patchkamer/patchkamer.html`.
3. In the library window, under **Sources**, type `github.com/unboxednl/patchkamer` and click **Add**. Place **Keys / MIDI**, **Acid Baselines** and **Speakers**, connect them with cables, press **Start** and play.

The [user manual](docs/USER-MANUAL_EN.md) walks you through it step by step, with screenshots.

## Included devices

| Device | What it is | Folder |
|---|---|---|
| **Duofone** | An analog-style synth with two independent pitches, a shared filter and VCA, ring modulation, hard sync and sample & hold | `devices/synths/Duofone/` |
| **Acid Baselines** | A bass synth with a 16-step sequencer (accent, slide, octave per step), 16 classic acid-style patterns, extra oscillators and four kinds of distortion | `devices/synths/AcidBaselines/` |
| **Keys / MIDI** | A keyboard and Web MIDI bridge that sends notes to other devices | `devices/tools/Keys/` |
| **Mixer** | A mixing desk with 1 to 32 channels and 0 to 8 groups: trim, EQ, sends and returns, pan, faders, mute and solo, bundle in and out, and a master with a limiter | `devices/mixer/Mixer/` |
| **Leveler** | Keeps the average volume of a source steady: a leveler with a limiter behind it | `devices/mixer/Leveler/` |
| **Multitrack** | A multitrack recorder for up to 16 tracks, sample-aligned, saved as WAV (16 or 24 bit, or 32 bit float) | `devices/tools/Multitrack/` |
| **Notes** | A notepad on the floor for ideas, key, structure and a to-do list; makes no sound | `devices/tools/Notes/` |
| **Recorder** | Records what comes in and passes it through unchanged; takes can be saved as WAV (16 or 24 bit), MP3 or WebM/MP4 | `devices/tools/Recorder/` |
| **Scope** | A transparent pass-through that shows the sound: spectrum, waveform, spectrogram, stereo image and peak/RMS | `devices/tools/Scope/` |
| **Speakers** | The output: volume, a limiter and a level meter | `devices/mixer/Speakers/` |

The `tunes/` folder has **Duofone Styles** (60 tunes in 12 styles) and **Acid Baselines Classics** (49 tunes in 9 styles, including the **AIcid** folder that uses the newest Acid Baselines controls).

## Build your own devices, with or without AI

A device is a single `.patchkamer-device.js` file. The **contract** says exactly what a device must do. It is complete and self-contained, in English and Dutch, so a person or an AI agent can build a device from it alone. A **validator** checks the result:

```
node contract/validate-instrument.mjs devices/synths/Duofone/duofone.patchkamer-device.js
```

Point your AI agent at [AGENTS.md](AGENTS.md). It tells the agent what to read, where to put the files and what to check. The current contract is **v1.11**. Every version is tagged (`contract/vX.Y`).

## What is in this repository

| Folder | Contents | License |
|---|---|---|
| `patchkamer/` | The host: the studio itself, as one HTML page | AGPL-3.0-or-later |
| `contract/` | The device contract (English and Dutch) and the validator | MIT |
| `devices/` | The included devices, one folder per device | AGPL-3.0-or-later |
| `tunes/` | Sounds for devices that make sound | CC0-1.0 |
| `presets/` | Settings for devices without a sound of their own | CC0-1.0 |
| `songs/` | Included songs | CC-BY-4.0 |
| `docs/` | The user manual, its screenshots and the script that makes them | AGPL-3.0 (the root license) |

See [LICENSING.md](LICENSING.md) for the reasons behind each choice.

## Documentation

- [User manual](docs/USER-MANUAL_EN.md) ([Nederlands](docs/USER-MANUAL_NL.md))
- [Device contract](contract/PATCHKAMER-CONTRACT_EN.md) ([Nederlands](contract/PATCHKAMER-CONTRACT_NL.md))
- [AGENTS.md](AGENTS.md): instructions for AI agents that build devices

## License

Each folder has its own license, listed above and in [LICENSING.md](LICENSING.md). The `LICENSE` file in the root (AGPL-3.0) covers everything not stated otherwise. Copyright 2026 Freek van Gool.

Third-party part: the Recorder device makes MP3 files with [lamejs](https://github.com/zhuker/lamejs) 1.2.1 (LGPL-3.0, [license text](LICENSES/LGPL-3.0-only.txt)), included unchanged as a separate piece of text in `devices/tools/Recorder/recorder.patchkamer-device.js`. The rest of that file is AGPL-3.0-or-later. See [LICENSING.md](LICENSING.md).
