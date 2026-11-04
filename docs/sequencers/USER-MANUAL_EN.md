# Sequencers: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

A sequencer plays notes for other devices. It makes **no sound of its own**: it sends notes along a cable, and a synth turns them into sound. This page covers the sequencer that comes with Patchkamer: **Chord Sequencer**. For the basics (opening Patchkamer, loading a library, drawing cables) see the [main user manual](../USER-MANUAL_EN.md). The folder with the devices is described in [devices/sequencers](../../devices/sequencers/README.md).

## Contents

1. [How to use a sequencer](#how-to-use-a-sequencer)
2. [Which device for which purpose](#which-device-for-which-purpose)
3. [Chord Sequencer](#chord-sequencer)
4. [If it does not work](#if-it-does-not-work)

## How to use a sequencer

1. Place the sequencer and a synth. Draw a cable from an **event output** of the sequencer to the **Notes** input of the synth (for some synths the input is called **Keyboard / notes**).
2. Connect the synth's audio output to your speakers or to a mixer.
3. Press Start (the studio clock). A sequencer plays only while the clock runs and follows its tempo.

Event cables carry notes, not sound. A sequencer therefore sits at the start of the chain, before the synths. Several synths can play from one sequencer at the same time, each from its own output.

A sequencer has **presets**, not tunes: a preset is the setting of a device without a sound of its own. See [Presets: user manual](../presets/USER-MANUAL_EN.md).

## Which device for which purpose

| I want to… | Use |
|---|---|
| play chords, a bass line, a pulse and a melody together from one place, on four synths | [Chord Sequencer](#chord-sequencer) |

## Chord Sequencer

### What it is for

Chord Sequencer plays up to four parts at once, each on its own **track** (A to D): for example chords, a bass, a pulse and bells. Each track has its own root note, chord type, pattern length and note length, and each track has its own cable to its own synth. You can store four different arrangements as **scenes** and switch between them on the beat, so a song can move from a main part to a breakdown and back.

![The Chord Sequencer card](../images/en/sequencers/chord-sequencer.png)

### The controls

**Top row**

- **Scene 1** … **Scene 4**: choose the active scene. The highlighted button is the scene that plays now. While the clock runs, a new scene starts at the next bar (see **Scene change**); the line under the controls then reads "Scene 2 on the next bar".
- **Scene change**: **Next bar** (the new scene starts at the next bar) or **Immediately** (the notes that sound are cut off and the new scene starts at once).
- **Copy scene to next**: copies the current scene (all four tracks) into the next scene. Scene 4 copies into scene 1. Handy for making a variation.
- **All off**: stops all sounding notes on the four outputs.

**Edit track**

- **Edit track**: choose which track the controls below show and change (A, B, C or D, with its name). The other tracks keep playing.

**Settings of the track** (stored per scene, so each scene can have different tracks)

| Control | What it does |
|---|---|
| **Track name** | A name for the track. Leave it as it is to keep the default name (Chords, Bass, Pulse, Bells for A to D). Up to 40 characters. |
| **Active** | **On** or **Off**. A track that is off plays nothing. By default A and B are on, C and D are off. |
| **Play** | **Full chord**: all notes of the chord at the same time. **Arpeggio**: the notes one by one, the next note at each step that plays. **Root only**: only the root note. |
| **Chord** | The chord type: `major`, `minor`, `sus`, `minor7`, `fifth` (root and fifth) or `single` (just the root). These words are English in both languages. |
| **Note division** | How often the track plays: **1/16**, **1/8**, **1/4** or **1/2**. Also the length of a step. |
| **Root (MIDI)** | The root note as a MIDI note number, 24 to 96. 60 is C4. Defaults: 48, 36, 60 and 72 for A to D. |
| **Inversion** | 0 to 3. Each step moves the lowest note of the chord up an octave. |
| **Pattern length** | 1 to 16 steps. Every track loops on its own, so tracks with different lengths shift against each other. |
| **Repeats per step** | 1 to 4. A note is repeated that many times within its step, and the length is divided. |
| **Probability** | 0 to 1. The chance that a step plays. 1 is always, 0 is never. |
| **Progression per bar (0,3,-2,5)** | Four numbers, separated by commas: the number of semitones added to the root in bar 1, 2, 3 and 4. After four bars it starts over. `0,0,0,0` keeps the chord the same. |

**Step buttons**: sixteen buttons, **1** to **16**. A dot (●) means this step plays; click a button to switch it. Only the first steps up to the **Pattern length** are used. While the clock runs, the step that is playing has a coloured edge.

**Sound of the track**

| Control | What it does |
|---|---|
| **Gate** | The length of the note compared to its step, 0.10 to 1.50. Start value 0.70. Shorter is more detached. |
| **Velocity** | How hard the notes are played, 0.05 to 1.00. Start value 0.80. |
| **Transpose** (**Transpositie** in Dutch) | Shifts the whole track in semitones, −24 to 24. It is rounded to whole semitones when playing. |

Double-click a slider to set it back to its start value.

The line under the controls shows the scene and the tempo in BPM, for example "Scene 1 · 120 BPM".

### The ports

| Port | Kind | What to connect |
|---|---|---|
| **Transpose** | event input | Notes from a **Keys / MIDI** device or another sequencer. The note C4 (60) means no shift; every note around it shifts all tracks by that many semitones (up to 36 up or down). |
| **Mod** | modulation input | A modulator. It can move the **Gate**, **Velocity** and **Transpose** of each track. |
| **Track A** … **Track D** | event outputs | Each goes to the notes input of the synth that plays that track. |

There are no audio ports.

### An example

A small band of three synths:

1. Place Chord Sequencer, and three synths: for example Chord Poly for the chords, Low Bass for the bass and Sub Line for the pulse. Chord Poly and the other synths in the [synths manual](../synths/USER-MANUAL_EN.md) say which can play several notes at once.
2. Connect **Track A** to the notes input of the chord synth, **Track B** to the bass synth and **Track C** to the third synth. Connect the three audio outputs to a mixer or to your speakers.
3. On the card, check track A: **Full chord**, **Chord** `minor`, **Note division** 1/4. Switch track C on (**Active** → **On**) and set **Play** to **Root only**.
4. Press Start. Change **Progression per bar** of track A to `0,5,3,7` to make the chords change every bar.
5. Use scene 2 for a variation: choose **Copy scene to next**, click **Scene 2** and change a few things there.

Or skip steps 3 and 4 and choose a preset (see below).

### The presets

The pack **Chord Sequencer Styles** has 60 presets in 11 folders: Pop (6), Ballad (5), Cinematic (6), Film Score (5), Ambient (6), Trance (6), Synthwave (6), Lo-fi (5), Neo-classical (5), Deep House (5) and Funk & Disco (5). Examples: **Pop** › Bright Four, **Ambient** › Floating Garden, **Trance** › Uplifting Anthem, **Deep House** › Warehouse Warmth.

Each preset fills the four tracks and the four scenes. According to the description of the pack the scenes are a main part, a variation, a breakdown and a lift. Load the pack with **Presets ▾ → Import…** from [`presets/chord-sequencer.patchkamer-presets.json`](../../presets/chord-sequencer.patchkamer-presets.json), or load `github.com/unboxednl/patchkamer` as a library. Then choose a preset in the list on the card. More in [Presets: user manual](../presets/USER-MANUAL_EN.md#chord-sequencer-chord-and-pattern-presets).

A preset does not hold cables, and it does not change which track you are editing. Connect the outputs to your synths yourself.

### Tips and limits

- A **Full chord** goes out as separate notes at the same moment. Use a synth that can play several notes at once; a single-voice synth plays only one of them.
- Four tracks send events on four different cables, so each track can have its own synth. Use **Root only** or **Arpeggio** for a single-voice synth.
- Each track counts its own steps, so a track of 5 steps and a track of 16 steps start together again only after 80 steps (when both use the same **Note division**).
- Stopping the clock stops all notes and resets the counters; the next start begins at step 1 and bar 1.
- The chance of a step (**Probability**) is random but repeatable: the same state and the same clock steps give the same notes on every run.
- A scene switch with **Immediately** cuts off the notes that are sounding. Use **Next bar** for a live switch.

## If it does not work

- **No sound.** The sequencer makes no sound itself. Check that the output you use is connected to the notes input of a synth, that the synth is connected to your speakers, and that the clock is running (Start).
- **A track is silent.** Check that **Active** is **On**, that some steps within the **Pattern length** are switched on (●), and that **Probability** is above 0.
- **Only one note of a chord sounds.** The synth has one voice. Use a synth that can play several notes at once, or switch **Play** to **Arpeggio** or **Root only**.
- **A scene does not switch.** With **Next bar** the switch happens at the start of the next bar, and only while the clock runs. When the clock is stopped, the scene changes at once.
- **Notes are cut short or overlap.** Lower **Repeats per step** or **Gate**, or use a longer **Note division**.
- **A song or preset from the earlier device does not load.** Songs and presets made for the earlier device with another name (Puls Sequencer, which was among the synths) refer to its old id and do not load into Chord Sequencer.
