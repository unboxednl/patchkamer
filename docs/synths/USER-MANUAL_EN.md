# Synths: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

Synths are the devices that make sound from notes. This page covers the two synths that come with Patchkamer: **Duofone** and **Acid Baselines**. For the basics (opening Patchkamer, loading a library, drawing cables) see the [main user manual](../USER-MANUAL_EN.md). The folder with the devices is described in [devices/synths](../../devices/synths/README.md).

## Contents

1. [What synths do](#what-synths-do)
2. [Which synth for which goal](#which-synth-for-which-goal)
3. [Duofone](#duofone)
4. [Acid Baselines](#acid-baselines)
5. [If it does not work](#if-it-does-not-work)

## What synths do

A synth has no audio input. It receives **notes** (orange cables) and gives you **sound** (a teal audio cable). Both synths here also have a purple **Mod** input: a modulator can move their controls while you play (see [Modulators](../modulators/USER-MANUAL_EN.md)).

A typical patch has three steps, from left to right:

1. A source of notes: **Keys / MIDI** (a keyboard that makes no sound itself), or the built-in sequencer of the synth.
2. The synth.
3. Where the sound goes: **Speakers** directly, or first a channel of a **Mixer** and an effect.

Press **Start** to run the clock. Without the clock the sequencer of Acid Baselines does not play. The test buttons on Duofone and notes from Keys do work without it.

Both synths have **tunes**: a tune is the complete setting of one synth. See [Tunes](../tunes/USER-MANUAL_EN.md) for how to use and share them.

## Which synth for which goal

| I want to… | Use |
|---|---|
| Play lines, chords or leads from a keyboard, with two pitches that can differ | [Duofone](#duofone) |
| Make sounds with ring modulation, hard sync or sample & hold | [Duofone](#duofone) |
| Get a bass line that plays by itself, with accent and slide per step | [Acid Baselines](#acid-baselines) |
| Shape a bass sound with several kinds of distortion and a second filter | [Acid Baselines](#acid-baselines) |
| Play the bass synth from your own keyboard or another sequencer | [Acid Baselines](#acid-baselines) (switch **internal** off) |

## Duofone

### What it is for

Duofone is a synth with two oscillators that can play two different pitches at the same time (**duophonic**). The two oscillators share one filter and one amplifier. It has ring modulation, hard sync, sample & hold and a built-in test keyboard. It is inspired by classic duophonic analog synths. It plays one voice at a time: of the keys you hold, only the lowest and the highest are heard. It is not a chord synth.

![The Duofone card](../images/en/synths/duofone.png)

### The controls

Double-click a slider to go back to its starting value. Click the number to type a value.

**Top row (choices)**

| Control | What it does |
|---|---|
| **Sound** | Picks one of six starting sounds: Duo Brass, Ring Factory, Sample Hold Lab, Sync Flight, Mono Pulse Bass and Duo Atmosphere. It sets many controls at once. You can change everything afterwards. |
| **Mode** | **Duophonic · two VCOs** or **Mono · one VCO**. In mono mode there is one oscillator and one envelope for filter and amplifier, and part of the controls disappear from the card. |
| **VCO A**, **VCO B** | The waveform of each oscillator: Sawtooth, Pulse or Triangle. (In mono mode only **VCO A** is shown.) |
| **Low-pass** | The steepness of the filter: 12 dB or 24 dB (duophonic mode only). |
| **VCA envelope** | **ADSR** or **AR** (duophonic mode only). |
| **LFO shape** | The shape of the slow oscillator (LFO): Sawtooth, Pulse or Triangle. |
| **Hard sync** | **On** or **Off**. When it is on, the phase of VCO B restarts every time VCO A completes a cycle (duophonic mode only). |
| **Legato** | **On** or **Off**. When it is on, a note you play while another key is still held does not restart the envelopes. |

**Test note.** **Test note MIDI** chooses a note number (24 to 96, starting at 48). **Play note** plays it once, **Hold note** holds it until you press the button again, **Test chord** plays three notes together (the chosen note, a minor third up and a fifth up; Duofone then plays the lowest and the highest of them) and **All off** stops everything. Use these to try a sound without a keyboard.

**Filters** (the filter and its envelope)

| Control | What it does | Range |
|---|---|---|
| **Cutoff** | Where the filter starts to cut | 30 to 16000 Hz (2400) |
| **Resonance** | Emphasis around the cutoff | 0 to 1 (0.25) |
| **Filter EG** | How far the filter envelope moves the cutoff | −5 to 5 (2.5) |
| **Key tracking** | How much the cutoff follows the pitch you play | 0 to 1 (0.5) |
| **Filter attack**, **Filter decay**, **Filter sustain**, **Filter release** | The filter envelope | 0.001 to 4 s, 0.01 to 8 s, 0 to 1, 0.01 to 8 s |
| **High-pass** | Cuts low frequencies | 20 to 6000 Hz (40) |

**Amplifier / envelope**: **VCA attack**, **VCA decay**, **VCA sustain** and **VCA release** shape the volume of each note. Attack 0.001 to 4 s, decay 0.01 to 8 s, sustain 0 to 1, release 0.01 to 8 s.

**Oscillators**

| Control | What it does | Range |
|---|---|---|
| **Pulse width** | Width of the pulse wave | 0.05 to 0.95 (0.5) |
| **Noise** | Amount of noise | 0 to 1 |
| **Transpose** | Moves everything up or down | −24 to 24 semitones |
| **VCO A**, **VCO B** | The level of each oscillator | 0 to 1 (0.7 and 0.5) |
| **VCO B interval** | Distance between VCO B and its note | −24 to 24 semitones |
| **VCO B fine** | Small detune of VCO B | −35 to 35 cents |
| **Ring modulation** | Mix of the ring modulation of both oscillators | 0 to 1 |

**Modulation**

| Control | What it does | Range |
|---|---|---|
| **PWM depth** | How much the pulse width moves | 0 to 1 |
| **LFO rate** | Speed of the LFO | 0.05 to 30 Hz |
| **LFO → pitch** | LFO on the pitch (vibrato) | 0 to 120 cents |
| **LFO → filter** | LFO on the cutoff | 0 to 1 |
| **Portamento** | Glide time between notes | 0.001 to 1 s |
| **VCO B → A FM** | VCO B modulates the frequency of VCO A | 0 to 3 |
| **VCO B → filter** | VCO B modulates the cutoff | 0 to 1 |
| **S&H → pitch**, **S&H → filter** | A random, stepped value (sample & hold) on the pitch or the cutoff | 0 to 1 |

**Master**: **Drive** (0 to 1) adds distortion, **Output** (0 to 1) sets the level. At the bottom of the card you see a small scope.

In mono mode the controls for the second oscillator (**VCO B** level, **VCO B interval**, **VCO B fine**, **VCO B → A FM**, **VCO B → filter**, **Ring modulation**), the filter envelope and **High-pass** are hidden.

![The Duofone card in mono mode](../images/en/synths/duofone-mono.png)

### Ports

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Connect **Keys / MIDI** or a sequencer. In duophonic mode the lowest key you hold plays VCO A and the highest plays VCO B. |
| **Mod** | modulation in (purple) | A modulator can move the controls. The knob values stay as you set them. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

### An example

1. Place **Keys / MIDI**, **Duofone** and **Speakers**.
2. Connect the orange **Notes** out of Keys to **Keyboard / notes** on Duofone, and **Stereo** to **In** on Speakers.
3. Press **Start**, choose the tune **Trance › Supersaw Lead** (or leave the sound as it is) and play two keys at once.
4. Set **VCO B interval** to 7 semitones and **VCO B fine** to 8 cents, and turn **Cutoff** up and down while you play.

No keyboard? Use **Hold note** or **Test chord** on the card instead.

### Tunes

Duofone has the pack **Duofone Styles**: 60 tunes in 12 folders (Techno, House, Trance, Ambient, Drum & Bass, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop, Chiptune), five per folder. The file is [`tunes/duofone-styles.patchkamer-tunes.json`](../../tunes/duofone-styles.patchkamer-tunes.json). Load it from a library (see the main manual) or with the **Tunes ▾** menu → **Import…**, then pick a tune in the list on the card. A few names: **Dark Stab**, **Supersaw Lead**, **Reese Bass** and **Neon Lead** (two oscillators), and **Rolling Bass**, **Wobble Bass** and **Pulse Lead** (mono mode). A tune also sets **Mode**.

### Tips and limits

- **Sound** replaces many controls at once. Choose it first, then adjust. After you pick a tune, **Sound** shows the starting sound that the tune is based on.
- Mono mode plays one note at a time. Duophonic mode plays two pitches at once (the lowest and the highest key you hold).
- Without AudioWorklet support in your browser the card says that the audio engine is not available.

## Acid Baselines

### What it is for

Acid Baselines is a bass synth with its own 16-step sequencer. You draw a bass line on a grid, add accent and slide on the steps you want, and shape the sound with six sections of controls. It plays along with the clock, and it can also play notes you send from a keyboard or another sequencer.

![The Acid Baselines card](../images/en/synths/acid-baselines.png)

### The controls

Double-click a slider to go back to its starting value. Click the number to type a value. The six sections follow the way the sound travels through the device.

**Oscillator**

| Control | What it does | Range (start) |
|---|---|---|
| **Waveform** | Sawtooth or Square | Sawtooth |
| **Octave** | Moves the whole synth | −1, 0, +1 (0) |
| **Tuning** | Fine tuning | −100 to +100 ct (0) |
| **Sub** | A square wave one octave lower | 0 to 100% (0%) |
| **Noise** | Noise | 0 to 100% (0%) |
| **Osc 2** | Second oscillator with the same waveform | 0 to 100% (0%) |
| **Detune 2** | Detune of Osc 2 | −100 to +100 ct (0) |
| **Ring** | Ring modulation of the two oscillators | 0 to 100% (0%) |

**Filter**

| Control | What it does | Range (start) |
|---|---|---|
| **Filter type** | Lowpass, Bandpass or Highpass | Lowpass |
| **Cutoff** | Where the filter cuts | 80 to 5000 Hz (520) |
| **Resonance** | Emphasis around the cutoff | 0.5 to 28 (14) |
| **Env mod** | How far each note opens the filter | 0 to 100% (65%) |
| **Filter FM** | Frequency modulation of the filter | 0 to 100% (0%) |
| **Filter 2** | Level of a second bandpass filter in parallel | 0 to 100% (0%) |
| **F2 octave** | Moves Filter 2 up or down from the cutoff | −2 to +3 octaves (0) |

**Envelope**

| Control | What it does | Range (start) |
|---|---|---|
| **Accent** | How much an accented step is louder and opens the filter more | 0 to 100% (70%) |
| **Normal decay** | Decay of a normal note | 0.03 to 3 s (0.30) |
| **Accent decay** | Decay of an accented note | 0.03 to 1 s (0.12) |
| **Soft attack** | Attack of each note | 1 to 300 ms (3) |
| **VCA decay** | Decay of the volume | 0.1 to 4 s (2.00) |

**Slide**: **Slide time** is the glide time on steps that have slide, 0.02 to 0.6 s (0.09).

**Distortion**

| Control | What it does | Range (start) |
|---|---|---|
| **Type** | Soft, Hard, Fold or Asym (four different shapes of distortion) | Soft |
| **Overdrive** | Amount of distortion | 0 to 100% (35%) |
| **Tight** | Filters low frequencies out before the distortion | off to 600 Hz (off) |
| **Mix** | Distorted sound against clean sound | 0 to 100% (100%) |
| **Crush** | Bit depth after the distortion | 2 to 16 bits (off = 16) |
| **Tone filter** | A lowpass filter after the distortion | 500 to 12000 Hz (7000) |

**Output**: **Level** sets the volume, 0 to 100% (60%).

Everything from **Sub** onwards (Sub, Noise, Osc 2, Detune 2, Ring, Filter type, Filter 2, F2 octave, Type, Tight, Mix, Crush) is off or neutral at the start, so older tunes sound as they did before.

**The sequencer**

- **Grid.** Click a square to put a note on that step; click it again to remove it. The rows run from C2 to C3, one row per semitone. There are 16 steps in a set.
- **Accent row.** A step with accent is louder and opens the filter more (see **Accent**).
- **Slide row.** A step with slide glides from the note of the previous step. The same note with slide is a tie: the note keeps going.
- **Octave row.** Each step has its own choice, +2 to −2 octaves, on top of the **Octave** control.
- **Sets.** The list **Sets** chooses 1, 2, 4, 8 or 16 sets of 16 steps. The numbered buttons above the grid choose which set you edit. The set that is playing is marked.
- **internal.** With **internal** on, the sequencer plays along with the clock. Switch it off to play only notes that arrive on the **Notes** port.
- **Choose pattern…** puts one of 16 patterns in the set you are editing: 01 Rolling, 02 Squelch, 03 Pump, 04 Climb, 05 Stab, 06 Bounce, 07 Hypno, 08 Chase, 09 Walk, 10 Drop, 11 Wobble, 12 Slide run, 13 Offbeat, 14 Octave jump, 15 Minor run, 16 Closing.
- **New line** fills the set with a random line.
- **Transpose +** and **Transpose −** move all notes of the set up or down by two semitones. A note that would go past the grid wraps around to the other side.
- **Copy bar to all** copies the set you are editing to all 16 sets.
- **Clear** empties the set.

### Ports

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or another sequencer. A note with velocity above 0.9 counts as an accent. Overlapping notes slide. |
| **CC** | notes in (orange) | Control changes with a value from 0 to 1 for `cutoff`, `res`, `env`, `drive` and `level`. Other ids are ignored. |
| **Mod** | modulation in (purple) | A modulator can move 14 controls: **Tuning**, **Cutoff**, **Resonance**, **Env mod**, **Normal decay**, **Accent**, **Accent decay**, **Soft attack**, **Slide time**, **Filter FM**, **Overdrive**, **Tone filter**, **VCA decay** and **Level**. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

### An example

1. Place **Acid Baselines** and **Speakers**. Connect **Out** to **In** on Speakers.
2. Press **Start**. The start line plays at once.
3. Set **Sets** to **1 × 16**, then choose **Choose pattern… › 02 · Squelch**.
4. Set **Resonance** to about 20, **Env mod** to 80% and turn **Cutoff** down slowly while it plays.
5. Set **Distortion › Type** to **Fold** and raise **Overdrive** until you like it. Use **Tight** to keep the lowest notes clear.
6. To play it from a keyboard instead: switch **internal** off, place **Keys / MIDI** and connect its notes to **Notes**.

### Tunes

Acid Baselines has the pack **Acid Baselines Classics**: 49 tunes in nine folders (Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid, Deep Acid and AIcid). The file is [`tunes/acid-baselines-classics.patchkamer-tunes.json`](../../tunes/acid-baselines-classics.patchkamer-tunes.json). Every tune comes with its own bass line. The **AIcid** folder uses the newest controls (the extra oscillators, filter types and distortions). A few names: **Warehouse Squelch**, **Rolling Thunder**, **Hard Drive**, **Sunrise Acid**, **Neural Squelch**.

Load the pack from a library or with the **Tunes ▾** menu → **Import…**, then pick a tune in the list on the card.

### Tips and limits

- **Resonance**, **Filter FM** and a cutoff that a modulator turns down can make a filter unstable. A built-in guard checks this every 50 ms and replaces the filters, so the sound comes back by itself.
- A note is held for about 62% of a step, unless the next step has slide: then it is held until the next note.
- The notes in the grid run from C2 to C3. Use **Octave**, the per-step octave row or a tune to go outside that range.

## If it does not work

- **No sound.** Check that audio runs from the synth to **Speakers** (teal cable), that you pressed **Start**, and that the volume on Speakers is up. Click anywhere in Patchkamer once: browsers pause audio until you do.
- **Acid Baselines is silent.** Check that **internal** is on and the set has notes, or that notes arrive on **Notes**. Look at **Level** and at **Cutoff**: a very low cutoff with a low **Env mod** is very quiet.
- **Duofone does not react to a keyboard.** Connect the orange cable to **Keyboard / notes** (not **Mod**). For a MIDI keyboard use **Connect MIDI** on Keys; see the [main manual](../USER-MANUAL_EN.md#13-troubleshooting).
- **Crackles.** Open Settings → Audio and choose a larger latency, or a lower quality.
