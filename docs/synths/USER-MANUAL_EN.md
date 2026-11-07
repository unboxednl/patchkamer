# Synths: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

Synths are the devices that make sound from notes. This page covers the 33 synths that come with Patchkamer. For the basics (opening Patchkamer, loading a library, drawing cables) see the [main user manual](../USER-MANUAL_EN.md). The folder with the devices is described in [devices/synths](../../devices/synths/README.md).

## Contents

1. [What synths do](#what-synths-do)
2. [Which synth for which goal](#which-synth-for-which-goal)
3. [Basses](#basses): [Acid Baselines](#acid-baselines), [Acid Stepper](#acid-stepper), [Low Bass](#low-bass), [Sub Line](#sub-line), [Basic Mono](#basic-mono)
4. [Mono synths for leads and sound design](#mono-synths-for-leads-and-sound-design): [Duofone](#duofone), [Ladder Mono](#ladder-mono), [Cross Mod Mono](#cross-mod-mono), [Patch Mono](#patch-mono)
5. [Polyphonic synths, pads and chords](#polyphonic-synths-pads-and-chords): [Poly Chorus](#poly-chorus), [Triple Osc Poly](#triple-osc-poly), [Supersaw Swarm](#supersaw-swarm), [Chord Poly](#chord-poly), [Cinematic Synth](#cinematic-synth), [Bowed Ensemble](#bowed-ensemble), [Brass Section](#brass-section), [Woodwinds](#woodwinds)
6. [Keys and strings](#keys-and-strings): [Piano](#piano), [Guitar](#guitar), [Stage Keys](#stage-keys), [Four-Operator FM](#four-operator-fm), [Karplus String](#karplus-string)
7. [Special and modular](#special-and-modular): [Dissonant Cluster](#dissonant-cluster), [Patchbay Synth](#patchbay-synth)
8. [Drone and texture synths](#drone-and-texture-synths): [Layered Landscape](#layered-landscape), [Biotope](#biotope), [Drone Synth](#drone-synth), [Celestial Mechanics](#celestial-mechanics), [Paradox](#paradox), [Foundry](#foundry), [Mist](#mist), [Grain Cloud](#grain-cloud)
9. [Voice](#voice): [Formant Singer](#formant-singer)
10. [If it does not work](#if-it-does-not-work)

## What synths do

Most synths have no audio input. The exceptions are the **Preamp in** of Patchbay Synth, the **External audio / envelope** input of Patch Mono and, among the drone and texture synths, Layered Landscape, Paradox, Foundry and Grain Cloud. It receives **notes** (orange cables) and gives you **sound** (a teal audio cable). Every synth also has a purple **Mod** input: a modulator can move its controls while you play (see [Modulators](../modulators/USER-MANUAL_EN.md)). The knob keeps its value; the modulator adds to it.

A typical patch has three steps, from left to right:

1. A source of notes: **Keys / MIDI** (a keyboard that makes no sound itself), a sequencer, or the built-in sequencer of the synth (Acid Baselines, Acid Stepper, Sub Line, Cross Mod Mono, and the drone and texture synths Drone Synth and Layered Landscape). The drone and texture synths often need no notes at all: they keep sounding on their own (see [Drone and texture synths](#drone-and-texture-synths)).
2. The synth.
3. Where the sound goes: **Speakers** directly, or first a channel of a **Mixer** and an effect.

Press **Start** to run the clock. Built-in sequencers, arpeggiators, the trance gate of Supersaw Swarm, the pump and the automatic chords and melody of Mist only move while the clock runs. Notes from Keys and the test buttons on the cards work without it. A sequencer that sends notes to a polyphonic synth should always send a note length (`dur`); a note without a length keeps sounding on some synths.

Every synth has **tunes**: a tune is the complete setting of one synth, and some tunes include a bass line or pattern. Load a pack from a library or with the **Tunes** tab of the library → **Import…**, then pick a tune in the list at the top of the card (it reads `Folder › Name`). See [Tunes](../tunes/USER-MANUAL_EN.md) for how to use, save and share them. The synths have no presets: the choices that look like presets inside a card (a **Sound** list, **Preset** buttons) are starting sounds that set the knobs once.

## Which synth for which goal

| I want to… | Use |
|---|---|
| A bass line that plays by itself, with accent and slide per step | [Acid Baselines](#acid-baselines) (16 steps, 16 patterns), [Acid Stepper](#acid-stepper) (simpler) |
| A bass or lead that plays its own pattern or arpeggio | [Sub Line](#sub-line), [Cross Mod Mono](#cross-mod-mono) |
| A bass played from my own keyboard or sequencer | [Low Bass](#low-bass), [Basic Mono](#basic-mono), [Sub Line](#sub-line) |
| A simple, direct mono sound with few knobs | [Basic Mono](#basic-mono) |
| A lead with two pitches at once, ring modulation, hard sync or sample & hold | [Duofone](#duofone), [Cross Mod Mono](#cross-mod-mono) |
| A classic analog mono sound: fat bass, singing lead, resonant filter that sings by itself | [Ladder Mono](#ladder-mono) |
| A mono synth I can re-wire inside, with an input for outside sound | [Patch Mono](#patch-mono) |
| Pads and polyphonic sounds with a built-in chorus | [Poly Chorus](#poly-chorus) |
| A big, flexible polyphonic synth with three oscillators and two filters | [Triple Osc Poly](#triple-osc-poly) |
| Trance supersaws with delay, reverb and gate | [Supersaw Swarm](#supersaw-swarm) |
| Chords from single notes (stabs, organ chords, pads) | [Chord Poly](#chord-poly), [Supersaw Swarm](#supersaw-swarm), [Triple Osc Poly](#triple-osc-poly) |
| Film-score sounds: braams, big pads, drones, ostinati, impacts | [Cinematic Synth](#cinematic-synth) |
| Strings and string sections | [Bowed Ensemble](#bowed-ensemble) |
| Trumpet, trombone, horn and brass sections, stabs and swells | [Brass Section](#brass-section) |
| Flute, clarinet, oboe, bassoon, saxophone, recorder and pan flute | [Woodwinds](#woodwinds) |
| Acoustic pianos (grand, upright, honky-tonk), tine and reed electric pianos, clavichord | [Piano](#piano) |
| Guitars: steel-string, nylon, clean and overdriven electric, palm-muted, 12-string and bass guitar | [Guitar](#guitar) |
| Electric pianos, organs, vibraphone | [Stage Keys](#stage-keys) |
| Bells, glass, tines, FM basses | [Four-Operator FM](#four-operator-fm) |
| Plucked or bowed single strings (guitar, harp, koto) | [Karplus String](#karplus-string) |
| Dissonant clusters, drones, tension, sound effects | [Dissonant Cluster](#dissonant-cluster) |
| A modular feel: patch cables between modules | [Patchbay Synth](#patchbay-synth) |
| A long ambient landscape of four layers (drone, pad, atmosphere, texture) | [Layered Landscape](#layered-landscape) |
| Natural soundscapes: rain, wind, water, fire, footsteps | [Biotope](#biotope) |
| A continuous drone with a sub, a second layer, noise and a root sequencer | [Drone Synth](#drone-synth) |
| Planets that bend in pitch (Doppler), drones, bells, sirens | [Celestial Mechanics](#celestial-mechanics) |
| Self-moving, experimental sounds, glitch and textures | [Paradox](#paradox) |
| Industrial sounds: metal resonances, FM, ring modulation, wavefolding | [Foundry](#foundry) |
| A slow chord bed with its own chords and melody under a song | [Mist](#mist) |
| Clouds of tiny grains from a built-in sound, or an effect on live audio | [Grain Cloud](#grain-cloud) |
| A voice that sings a text: lead, choir, whispers, robot voices | [Formant Singer](#formant-singer) |

## Basses

### Acid Baselines

**What it is for.** A bass synth with its own 16-step sequencer. You draw a bass line on a grid, add accent and slide on the steps you want, and shape the sound with six sections of controls. It plays along with the clock, and it can also play notes you send from a keyboard or another sequencer.

![The Acid Baselines card](../images/en/synths/acid-baselines.png)

**Controls.** Double-click a slider to go back to its starting value. Click the number to type a value. The six sections follow the way the sound travels through the device.

- **Oscillator:** **Waveform** (Sawtooth or Square), **Octave** (−1, 0, +1), **Tuning** (−100 to +100 ct), **Sub** (a square wave one octave lower), **Noise**, **Osc 2** (second oscillator, same waveform), **Detune 2** (−100 to +100 ct) and **Ring** (ring modulation of the two oscillators).
- **Filter:** **Filter type** (Lowpass, Bandpass or Highpass), **Cutoff** (80 to 5000 Hz), **Resonance** (0.5 to 28), **Env mod** (how far each note opens the filter), **Filter FM**, **Filter 2** (level of a second bandpass filter in parallel) and **F2 octave** (moves Filter 2 from −2 to +3 octaves).
- **Envelope:** **Accent** (how much louder an accented step is and how much more it opens the filter), **Normal decay** (0.03 to 3 s), **Accent decay** (0.03 to 1 s), **Soft attack** (1 to 300 ms) and **VCA decay** (0.1 to 4 s).
- **Slide:** **Slide time**, the glide time on steps that have slide (0.02 to 0.6 s).
- **Distortion:** **Type** (Soft, Hard, Fold or Asym: four shapes), **Overdrive**, **Tight** (filters low frequencies out before the distortion, off to 600 Hz), **Mix** (distorted against clean), **Crush** (bit depth after the distortion, 2 to 16 bits, off = 16) and **Tone filter** (a lowpass after the distortion, 500 to 12000 Hz).
- **Output:** **Level**.

Everything from **Sub** onwards (Sub, Noise, Osc 2, Detune 2, Ring, Filter type, Filter 2, F2 octave, Type, Tight, Mix, Crush) is off or neutral at the start, so older tunes sound as they did before.

The sequencer under the controls:

- **Grid.** Click a square to put a note on that step; click it again to remove it. The rows run from C2 to C3, one row per semitone. There are 16 steps in a set.
- **Accent row.** A step with accent is louder and opens the filter more (see **Accent**).
- **Slide row.** A step with slide glides from the note of the previous step. The same note with slide is a tie: the note keeps going.
- **Octave row.** Each step has its own choice, +2 to −2 octaves, on top of the **Octave** control.
- **SETS.** The list chooses 1, 2, 4, 8 or 16 sets of 16 steps. The numbered buttons above the grid choose which set you edit. The set that is playing is marked.
- **internal on.** With it on, the sequencer plays along with the clock. Switch it off to play only notes that arrive on the **Notes** port.
- **Choose pattern…** puts one of 16 patterns in the set you are editing: 01 Rolling, 02 Squelch, 03 Pump, 04 Climb, 05 Stab, 06 Bounce, 07 Hypno, 08 Chase, 09 Walk, 10 Drop, 11 Wobble, 12 Slide run, 13 Offbeat, 14 Octave jump, 15 Minor run, 16 Closing.
- **NEW LINE** fills the set with a random line. **TRANSPOSE +** and **TRANSPOSE −** move all notes of the set by two semitones (a note past the grid wraps around). **COPY BAR TO ALL** copies the set you are editing to all 16 sets. **CLEAR** empties the set.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or another sequencer. A note with velocity above 0.9 counts as an accent. Overlapping notes slide. |
| **CC** | notes in (orange) | Control changes with a value from 0 to 1 for `cutoff`, `res`, `env`, `drive` and `level`. Other ids are ignored. |
| **Mod** | modulation in (purple) | A modulator can move 14 controls: **Tuning**, **Cutoff**, **Resonance**, **Env mod**, **Normal decay**, **Accent**, **Accent decay**, **Soft attack**, **Slide time**, **Filter FM**, **Overdrive**, **Tone filter**, **VCA decay** and **Level**. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Acid Baselines** and **Speakers**. Connect **Out** to **In** on Speakers.
2. Press **Start**. The start line plays at once.
3. Set **SETS** to **1 × 16**, then choose **Choose pattern… › 02 · Squelch**.
4. Set **Resonance** to about 20, **Env mod** to 80% and turn **Cutoff** down slowly while it plays.
5. Set **Distortion › Type** to **Fold** and raise **Overdrive** until you like it. Use **Tight** to keep the lowest notes clear.
6. To play it from a keyboard instead: switch **internal on** off, place **Keys / MIDI** and connect its notes to **Notes**.

**Tunes.** Pack **Acid Baselines Classics**: 49 tunes in nine folders (Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid, Deep Acid and AIcid), file [`acid-baselines-classics.patchkamer-tunes.json`](../../tunes/acid-baselines-classics.patchkamer-tunes.json). Every tune comes with its own bass line. The **AIcid** folder uses the newest controls (the extra oscillators, filter types and distortions). A few names: **Warehouse Squelch**, **Rolling Thunder**, **Hard Drive**, **Sunrise Acid**, **Neural Squelch**.

**Tips and limits.**

- **Resonance**, **Filter FM** and a cutoff that a modulator turns down can make a filter unstable. A built-in guard checks this every 50 ms and replaces the filters, so the sound comes back by itself.
- A note is held for about 62% of a step, unless the next step has slide: then it is held until the next note.
- The notes in the grid run from C2 to C3. Use **Octave**, the per-step octave row or a tune to go outside that range.

### Acid Stepper

**What it is for.** A simpler acid bass synth for a quick, direct bass line: one oscillator and a sub, a four-pole lowpass filter with resonance and an envelope, accent, slide, drive, and a fixed grid of 16 steps. Compared with Acid Baselines it has no sets, no octave per step, no second filter and fewer kinds of distortion. The internal clock of the host sets tempo and swing.

![The Acid Stepper card](../images/en/synths/acid-stepper.png)

**Controls.**

- **Top row:** **Pattern** (six start lines: Warehouse Acid, Octave Engine, Dark Rubber, Open Skyline, Sparse Pulse, Broken Staircase), **Control** (**Internal clock / pattern** or **External keyboard / sequencer**), **Waveform** (Sawtooth or Square), **Note division** (1/16, 1/8 or 1/4: with 1/8 every note lasts two steps), **Pattern length** (1 to 16), **Test note** and **All off**.
- **The 16 step buttons.** Each shows its number and note (`1 · MIDI 36`); `!` means accent, `↗` means slide and `rest` means silent. Click one to edit it.
- **Edit step:** **MIDI note** (24 to 84; 36 = C2), **Plays** (On or Off; off is a rest), **Accent** and **Slide to this step** (the pitch glides from the previous active step and the note stays open).
- **Sound:** **Cutoff** (70 to 10000 Hz), **Resonance** (0.4 to 9), **Envelope amount** (0 to 5 octaves the cutoff jumps up on each note), **Decay** (0.03 to 2 s), **Accent** (0 to 1), **Slide time** (0.005 to 0.4 s), **Gate** (how long a note sounds as part of the step, 0.1 to 1), **Drive**, **Sub**, **Transpose** (−24 to 24 semitones) and **Output**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **External notes** | notes in (orange) | Only used when **Control** is **External keyboard / sequencer**. A velocity above 0.9 counts as accent. In the pattern mode, incoming notes are ignored. |
| **Mod** | modulation in (purple) | A modulator can move 11 controls: **Cutoff**, **Resonance**, **Envelope amount**, **Decay**, **Accent**, **Slide time**, **Gate**, **Drive**, **Sub**, **Transpose** and **Output**. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Acid Stepper** and **Speakers** and connect **Out** to **In**.
2. Press **Start**: the line plays on the clock (the card says "Waiting for the internal clock." until then).
3. Click step 5 and set **Plays** to **On**, then give step 6 **Slide to this step: On** to make a glide.
4. Raise **Resonance** and **Envelope amount** and turn **Cutoff** down while it plays.

**Tunes.** Pack **Acid Stepper Styles**: 65 tunes in 12 folders (Acid, Techno, House, Deep House, Electro, Trance, Breakbeat, Hip-hop, Synthwave, Dub, Industrial, Garage), file [`acid-stepper-styles.patchkamer-tunes.json`](../../tunes/acid-stepper-styles.patchkamer-tunes.json). 45 of the 65 tunes bring their own line; the others keep the line that is on the card. A few names: **Concrete Squelch**, **Rubber Climb**, **Driving Rumble**, **Funky Offbeat**, **Neon Arp**.

**Tips and limits.**

- With every start or stop of the clock the line begins again at step 1.
- A rest closes the note before it. A slide on the next active step ties the current note to it, so you can build long gliding phrases.
- The **Pattern** list only names the start line you chose; a tune that sets only knobs does not change the line.

### Low Bass

**What it is for.** A mono bass synth without a sequencer: it plays the notes that arrive on its **Notes** port (the last note wins). Two slightly detuned oscillators, a sine sub one octave lower, optional FM, drive, a filter with envelope, glide and legato.

![The Low Bass card](../images/en/synths/low-bass.png)

**Controls.**

- **Top row:** **Preset** (Analog Bass, Deep Sub, Acid Slide, Square Punch, FM Growl, Rumble Bass, Pluck Bass; choosing one loads its knob settings; it shows **Custom** as soon as you change a knob), **Waveform** (the waveform of both oscillators: Sawtooth, Square or Triangle) and **Legato** (overlapping notes glide instead of striking again).
- **Sound:** **Cutoff** (40 to 10000 Hz), **Resonance** (0.2 to 7), **Sub**, **Detune** (0 to 20 cents between the two oscillators), **Drive** (1 to 16; the level is compensated), **FM depth** (how strongly the second oscillator modulates the pitch of the first), **Filter envelope** (0 to 5 octaves) and **Glide** (0.001 to 1.5 s).
- **Envelope:** **Attack**, **Decay** (for amplifier and filter), **Sustain** and **Release**.
- **Level:** **Accent** (how much extra volume a hard key press gets), **Volume** and **Pitchbend** (a fixed shift of −12 to 12 semitones).
- **Test bass** plays a note, **All off** stops everything.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move 15 controls (all the knobs on the card). |
| **Bass out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Keys / MIDI**, **Low Bass** and **Speakers**. Connect the notes of Keys to **Notes** and **Bass out** to **In**.
2. Play low notes (the tunes expect roughly MIDI notes 28 to 48).
3. Choose the preset **Acid Slide** and play two keys overlapping: with **Legato** on they glide.
4. Turn **FM depth** up slowly for a harder edge.

**Tunes.** Pack **Low Bass Styles**: 64 tunes in 13 folders (Sub, Rolling Bass, Detuned Wide, Dub, Booming Sub, Acid, Funk, Drum & Bass, Dubstep, Garage, Trap, Synthwave, Techno & House), file [`low-bass-styles.patchkamer-tunes.json`](../../tunes/low-bass-styles.patchkamer-tunes.json). A tune is only a sound; the notes come from your keyboard or sequencer. A few names: **Pure Sub**, **Rolling Saw**, **Wide Detuned Growl**, **Heavy Dub Sub**, **Squelch Mono**.

**Tips and limits.**

- Legato only works while the previous note still sounds (overlapping or held notes); separate notes always strike again. The filter envelope restarts on every note, also with legato.
- Envelopes and glide are read when the next note starts.
- A built-in guard replaces the filters if they derail, so a modulator can not silence the device for good.

### Sub Line

**What it is for.** A mono synth for bass lines and leads. It has one oscillator bank (sawtooth, pulse with pulse width, a sub and noise), a filter with envelope, portamento and an LFO, plus its own 32-step pattern and an arpeggiator. It also plays notes from a keyboard or an external sequencer.

![The Sub Line card](../images/en/synths/subline.png)

**Controls.**

- **Top row:** **Sound** (a list of starting sounds, starting with Rubber Bass), **Sub octave** (1 or 2 octaves lower), **Priority** (**Last**, **Low** or **High**: which key sounds when several are held) and **Legato**. **Test note** (24 to 96) with **Play note**, **Hold note** and **All notes off**.
- **Sequencer:** **Control** (**Keyboard / external sequencer**, **Own pattern** or **Arpeggiator**), **Note division** (1/16, 1/8, 1/4), **Arp direction** (Up or Down), **Length** (1 to 32 steps). The step buttons show `1 · 36` (step and MIDI note) or `rest`; click one to edit it with **Note** and **Plays** (Note or Rest). **Sequencer gate** (under Modulation) sets how long a pattern or arp note lasts as part of the step.
- **Filters:** **Cutoff** (30 to 16000 Hz), **Resonance**, **Filter envelope** (−5 to 5 octaves) and **Key tracking**.
- **Amp / envelope:** **VCA attack**, **VCA decay**, **VCA sustain** and **VCA release** (one envelope for filter and amplifier).
- **Oscillators:** **Pulse width**, **Noise**, **Transpose**, **Sawtooth**, **Pulse** and **Sub** (levels).
- **Modulation:** **PWM depth**, **LFO rate**, **LFO → pitch** (vibrato in cents), **LFO → filter**, **Portamento** and **Sequencer gate**.
- **Master:** **Drive** and **Output**. At the bottom of the card you see a small scope.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer (**Control** = keyboard), or the held keys for the arpeggiator. |
| **Mod** | modulation in (purple) | A modulator can move the knobs; the knob values stay the base. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Sub Line** and **Speakers** and connect **Out** to **In**.
2. Choose the tune **Techno › Rolling Sub**, which plays its own pattern (**Control** = **Own pattern**), and press **Start**.
3. Click a step, change **Note** and turn **Plays** to **Rest** on another step.
4. Switch **Control** to **Arpeggiator**, place **Keys / MIDI** and hold three keys: they play one after the other, low to high (or high to low with **Arp direction**).

**Tunes.** Pack **Sub Line Styles**: 68 tunes in 10 folders (Techno, House, Deep House, Acid, Electro, Synthwave, Hip-hop, Dub, Drum & Bass, Trance), file [`subline-styles.patchkamer-tunes.json`](../../tunes/subline-styles.patchkamer-tunes.json). 42 tunes play from a keyboard, 23 play their own pattern and 3 are arpeggios. A few names: **Rolling Sub**, **Squelch Runner**, **Neon Bass**, **Boom Sub**, **Gate Arp**.

**Tips and limits.**

- The own pattern and the arpeggiator only play while the clock runs (**Start**). A tune with the mode **Keyboard / external sequencer** plays only the notes you send.
- With the arpeggiator, a **Length** that is a multiple of the number of held keys keeps the pattern even: 12 fits 1, 2, 3 and 4 keys, 16 fits 1, 2, 4 and 8.
- **Sound** is only a starting point: choosing it sets the knobs once.

### Basic Mono

**What it is for.** The simplest mono synth: one oscillator, a sub, a resonant lowpass filter with envelope, glide and one level knob. It has no sequencer, no arpeggiator and no LFO; it plays the notes you send, one voice at a time (a new note takes over the old one). Good for a quick bass, lead or pluck.

![The Basic Mono card](../images/en/synths/basic-mono.png)

**Controls.** Double-click a knob to go back to its starting value.

- **Wave:** sawtooth, square or triangle.
- **Tune:** −100 to 100 ct (oscillator and sub together).
- **Cutoff:** 80 to 8000 Hz, the resting position of the filter.
- **Resonance:** 0.5 to 24.
- **Env mod:** how far each note shoots the cutoff up (0 to 100%).
- **Decay:** 0.05 to 2 s; how fast the cutoff falls back and how fast the volume falls to its sustain level. There is no sustain knob: the sustain is fixed at 30% of the attack. A long **Decay** on a held note therefore sounds almost like an organ; a short one gives a short pluck.
- **Sub:** level of the square-wave sub one octave lower.
- **Glide:** 0 to 300 ms (0 = off).
- **Level:** 0 to 100%.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. Overlapping notes cut each other off: the newest wins. |
| **Mod** | modulation in (purple) | A modulator can move every knob except **Wave**. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Keys / MIDI**, **Basic Mono** and **Speakers**; connect notes to **Notes** and **Out** to **In**.
2. Choose the tune **Techno › Rolling Sub** and play low notes.
3. Raise **Env mod** and **Resonance** and turn **Cutoff** up and down.

**Tunes.** Pack **Basic Mono Styles**: 65 tunes in 12 folders (Techno, House, Electro, Hip-hop, Funk, Synthwave, Dub, Pop, Chiptune, Acid, Trance, Ambient), file [`basic-mono-styles.patchkamer-tunes.json`](../../tunes/basic-mono-styles.patchkamer-tunes.json). A few names: **Rolling Sub**, **Zap Bass**, **Slap Bass**, **Square Lead**, **Deep Drone**.

**Tips and limits.**

- Keep **Level** below 0.6 (60%), and below 0.4 when **Sub** and **Resonance** are both high. A soft limiter on the output keeps the peak below 0.99 (it does nothing below 0.9), so **Level** 100%, **Sub** 100% and **Resonance** 8 sound compressed instead of clipping.
- A pad is not really possible (mono, no slow attack); a drone with long notes is.
- A built-in guard replaces the filter if it derails.

## Mono synths for leads and sound design

### Duofone

**What it is for.** A synth with two oscillators that can play two different pitches at the same time (**duophonic**). The two oscillators share one filter and one amplifier. It has ring modulation, hard sync, sample & hold and a built-in test keyboard. It is inspired by classic duophonic analog synths. Of the keys you hold, only the lowest and the highest are heard: it is not a chord synth.

![The Duofone card](../images/en/synths/duofone.png)

**Controls.** Double-click a slider to go back to its starting value. Click the number to type a value.

*Top row (choices)*

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

**Test note.** **Test note MIDI** chooses a note number (24 to 96, starting at 48). **Play note** plays it once, **Hold note** holds it until you press the button again, **Test chord** plays three notes together (the chosen note, a minor third up and a fifth up; Duofone then plays the lowest and the highest of them) and **All off** stops everything.

*Filters (the filter and its envelope)*

| Control | What it does | Range |
|---|---|---|
| **Cutoff** | Where the filter starts to cut | 30 to 16000 Hz (2400) |
| **Resonance** | Emphasis around the cutoff | 0 to 1 (0.25) |
| **Filter EG** | How far the filter envelope moves the cutoff | −5 to 5 (2.5) |
| **Key tracking** | How much the cutoff follows the pitch you play | 0 to 1 (0.5) |
| **Filter attack**, **Filter decay**, **Filter sustain**, **Filter release** | The filter envelope | 0.001 to 4 s, 0.01 to 8 s, 0 to 1, 0.01 to 8 s |
| **High-pass** | Cuts low frequencies | 20 to 6000 Hz (40) |

*Amplifier / envelope:* **VCA attack**, **VCA decay**, **VCA sustain** and **VCA release** shape the volume of each note. Attack 0.001 to 4 s, decay 0.01 to 8 s, sustain 0 to 1, release 0.01 to 8 s.

*Oscillators*

| Control | What it does | Range |
|---|---|---|
| **Pulse width** | Width of the pulse wave | 0.05 to 0.95 (0.5) |
| **Noise** | Amount of noise | 0 to 1 |
| **Transpose** | Moves everything up or down | −24 to 24 semitones |
| **VCO A**, **VCO B** | The level of each oscillator | 0 to 1 (0.7 and 0.5) |
| **VCO B interval** | Distance between VCO B and its note | −24 to 24 semitones |
| **VCO B fine** | Small detune of VCO B | −35 to 35 cents |
| **Ring modulation** | Mix of the ring modulation of both oscillators | 0 to 1 |

*Modulation*

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

*Master:* **Drive** (0 to 1) adds distortion, **Output** (0 to 1) sets the level. At the bottom of the card you see a small scope.

In mono mode the controls for the second oscillator (**VCO B** level, **VCO B interval**, **VCO B fine**, **VCO B → A FM**, **VCO B → filter**, **Ring modulation**), the filter envelope and **High-pass** are hidden.

![The Duofone card in mono mode](../images/en/synths/duofone-mono.png)

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Connect **Keys / MIDI** or a sequencer. In duophonic mode the lowest key you hold plays VCO A and the highest plays VCO B. |
| **Mod** | modulation in (purple) | A modulator can move the controls. The knob values stay as you set them. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Keys / MIDI**, **Duofone** and **Speakers**.
2. Connect the orange notes out of Keys to **Keyboard / notes** on Duofone, and **Stereo** to **In** on Speakers.
3. Press **Start**, choose the tune **Trance › Supersaw Lead** (or leave the sound as it is) and play two keys at once.
4. Set **VCO B interval** to 7 semitones and **VCO B fine** to 8 cents, and turn **Cutoff** up and down while you play.

No keyboard? Use **Hold note** or **Test chord** on the card instead.

**Tunes.** Pack **Duofone Styles**: 60 tunes in 12 folders (Techno, House, Trance, Ambient, Drum & Bass, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop, Chiptune), five per folder, file [`duofone-styles.patchkamer-tunes.json`](../../tunes/duofone-styles.patchkamer-tunes.json). A few names: **Dark Stab**, **Supersaw Lead**, **Detuned Saw Bass** and **Neon Lead** (two oscillators), and **Rolling Bass**, **Wobble Bass** and **Pulse Lead** (mono mode). A tune also sets **Mode**.

**Tips and limits.**

- **Sound** replaces many controls at once. Choose it first, then adjust. After you pick a tune, **Sound** shows the starting sound that the tune is based on.
- Mono mode plays one note at a time. Duophonic mode plays two pitches at once (the lowest and the highest key you hold).
- Without AudioWorklet support in your browser the card says that the audio engine is not available.

### Ladder Mono

**What it is for.** A monophonic analog synth in the spirit of the classic analog mono synths: fat basses, singing and screaming leads, mono brass and strings, plucks and sound effects. It has three oscillators, a noise source, a mixer that can be overloaded and a four-pole **24 dB ladder-model filter** with feedback that sings by itself at a high **Emphasis**. Two envelopes (filter and loudness), key tracking, glide, an LFO and pitch bend complete it. All the sound is made in an AudioWorklet, with oversampling in the filter, band-limited oscillators and a guard against invalid values.

![The Ladder Mono card](../images/en/synths/ladder-mono.png)

**Controls.**

- **Oscillators:** each of the three has a **Waveform** (triangle, shark tooth, sawtooth, square, wide pulse, narrow pulse), a **Range** (−2 to +2 octaves) and a **Level**. Oscillators 2 and 3 also have a fine **Tune** (±7 semitones). **Sync 2 to 1** restarts oscillator 2 with every cycle of oscillator 1. **Osc 3 follows keyboard** can be switched off to use oscillator 3 as a fixed low drone.
- **Mixer:** **Noise** (white or pink) and **Mixer overload** (the mixer saturates when it is driven hard).
- **Filter:** **Cutoff** (20 to 16000 Hz), **Emphasis** (from 0 to 105%: above about 100% the filter oscillates by itself), **Envelope amount** (−5 to +5 octaves) and **Key tracking** (0 to 100%).
- **Filter envelope** and **Loudness envelope:** **Attack**, **Decay**, **Sustain** and **Release** each.
- **Play:** **Glide** (0 to 2 s), **Trigger** (**Every note** restarts the envelopes with every key, **Legato** only when no key was held), **Bend range** (0 to 12 semitones) and **Transpose**.
- **Modulation:** **LFO rate**, **LFO shape** (triangle, square, saw, sample & hold), **LFO to pitch** (0 to 100 cents) and **LFO to filter** (0 to 3 octaves). The mod wheel (CC 1) adds vibrato; pitch bend moves the pitch.
- **Output:** **Output drive** and **Level**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI**, a sequencer or the **MIDI Hub**. |
| **Mod** | modulation in (purple) | A modulator can move 15 parameters (cutoff, emphasis, envelope amount, LFO depths, mixer overload, the three levels, both tunings, noise, glide, output drive and level). |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Ladder Mono** and **Speakers**. Pick the tune **Bass › Fat Ladder Bass** and play low notes. Turn **Emphasis** up for a squelch, or open **Cutoff** while you play. For a singing lead pick **Lead › Singing Lead**, play legato and slide between notes.

**Tunes.** Pack **Ladder Mono Classics**: 58 tunes in 7 folders (Bass, Lead, Brass and Strings, Plucks and Keys, Sequences, Effects, Percussion).

**Tips and limits.**

- The synth plays one note at a time. If you hold a key and press another, the new one sounds; when you release it the held one sounds again.
- Without AudioWorklet the synth stays silent and the card says so.
- A very high **Emphasis** with a high **Level** can be loud; start low.
- The filter takes the sound from three oscillators: with all three at full **Level** the mixer is driven hard. Lower the levels or use **Mixer overload** for the effect.

### Cross Mod Mono

**What it is for.** A mono synth (one voice) built around two oscillators that influence each other: hard sync, and cross modulation at audio rate where oscillator B moves the pitch of A and the cutoff of the filter. It has two envelopes, a two-pole lowpass filter, an LFO, portamento, a pattern of up to 32 steps and an arpeggiator. It also plays notes from a keyboard or a sequencer.

![The Cross Mod Mono card](../images/en/synths/cross-mod-mono.png)

**Controls.**

- **Top row:** **Sound** (six starting sounds: Twin Saw Bass, Sync Blade, Cross Mod Metal, Low B Motion, Detroit Pluck and Long Unison Lead; choosing one keeps the mode, the pattern and the note priority), **Osc A wave**, **Osc B wave**, **LFO shape**, **Note priority** (Last, Low, High), **Legato**, **Hard sync** and **Osc B low** (oscillator B becomes a slow modulator at a fixed frequency of about 0.125 to 2 Hz, set by **Osc B interval**, no longer following the note).
- **Test note** (MIDI) with **Play note**, **Hold note** and **All off**.
- **Control, Note division, Arp direction, Length** and the step buttons: **Control** is **Keyboard / external sequencer**, **Own pattern** or **Arpeggiator**; **Length** is 1 to 32 steps. A step button shows its number and note (`1 · 33`) or `rest`; **Note** and **Plays** edit the step.
- **Filter:** **Cutoff** (30 to 16000 Hz), **Resonance**, **Filter envelope** (−5 to 5 octaves), **Key tracking**, **LFO → filter** and **Filter attack**, **Filter decay**, **Filter sustain**, **Filter release**.
- **Amplifier / envelope:** **VCA attack**, **VCA decay**, **VCA sustain**, **VCA release**.
- **Oscillators:** **Pulse width** (only on a pulse wave), **Noise**, **Transpose**, **Osc A level**, **Osc B level**, **Osc B interval** (−24 to 24 semitones) and **Osc B fine** (−35 to 35 cents).
- **Modulation:** **PWM depth**, **LFO rate**, **LFO → pitch**, **Portamento**, **Osc B → A FM** (0 to 3), **Osc B → filter** and **Gate length** (how long a pattern or arp note lasts as part of the step).
- **Master:** **Drive** and **Output level**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes and control changes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move 29 controls in five groups (Filter, Amplifier / envelope, Oscillators, Modulation, Master). |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Keys / MIDI**, **Cross Mod Mono** and **Speakers**; connect notes to **Keyboard / notes** and **Stereo** to **In**.
2. Set **Hard sync** to **On**, **Osc B interval** to 12 or more semitones, and turn **Cutoff** and **Filter envelope** up while you hold a note: you get the sync sweep.
3. For metallic sounds: **Osc B → A FM** around 0.3 to 1.2 with **Osc B interval** at 7 or 12 semitones.

**Tunes.** Pack **Cross Mod Mono Styles**: 63 tunes in 12 folders (Techno, Acid, House, Trance, Ambient, Synthwave, Electro, Drum & Bass, Dub, Hip-hop, Chiptune, Funk & Disco), file [`cross-mod-mono-styles.patchkamer-tunes.json`](../../tunes/cross-mod-mono-styles.patchkamer-tunes.json). 47 tunes play from a keyboard, 11 play their own pattern and 5 are arpeggios. A few names: **Rolling Sub**, **Squelch Line**, **Sync Screamer**, **Neon Bass**, **Metal Zap**.

**Tips and limits.**

- Own pattern and Arpeggiator only play while the clock runs; the arpeggiator also needs held keys. Pick an arp **Length** that is a multiple of the number of keys you hold (12 fits 1 to 4 keys, 16 fits 1, 2, 4 and 8).
- **Osc B → A FM** above 1 can make the pitch of A nearly stall for a moment.
- It is mono: a chord can only be played as an arpeggio.

### Patch Mono

**What it is for.** A mono synth in two builds, chosen with **Voice layout**: one oscillator with a 12 dB lowpass filter and one envelope for volume and filter, or two oscillators (VCO A and VCO B, with interval, fine tune, FM and ring modulation) with a high-pass and two lowpass filters in series (24 dB) and a separate filter envelope. In both builds it has noise, an LFO with sample & hold, pulse-width modulation, portamento, legato, key tracking and drive. It also has an audio input for outside sound and **four internal patch routes** that connect a source to a target.

![The Patch Mono card](../images/en/synths/patch-mono.png)

**Controls.** The picture shows the one-oscillator build.

- **Top row:** **Sound** (a list of starting sounds, starting with Raw Mono), **Voice layout** (**1 VCO · lowpass** or the two-oscillator build), **VCO 1** (waveform: Sawtooth, Pulse, Triangle or Noise), **Note priority**, **LFO shape**, **Legato**. **Test note (MIDI)** with **Play note**, **Hold note** and **All off**.
- **Filters:** **Cutoff**, **Resonance**, **Filter EG** (octaves) and **Key tracking**.
- **Amplifier / envelope:** **VCA attack**, **VCA decay**, **VCA sustain**, **VCA release** (in the one-oscillator build they also drive the filter).
- **Oscillators:** **Pulse width**, **Noise**, **Transpose**, **VCO A** (level) and **External audio** (level of the sound from the audio input, which runs through the filters; its volume follows the note).
- **Modulation:** **PWM depth**, **LFO rate**, **LFO → pitch**, **LFO → filter** and **Portamento**.
- **Master:** **Drive** and **Level**.
- **Four internal patch routes:** each route has a **Source** (off, LFO, filter envelope, sample & hold or the external envelope), a **Target** (pitch, cutoff or pulse width) and an **Amount** (−1 to 1; pitch ±24 semitones, cutoff ±5 octaves at 1).
- In the two-oscillator build the card also offers the second oscillator (level, interval, fine tune, FM onto VCO A, ring modulation, B → filter), the high-pass filter with its resonance and a separate filter envelope. Those controls have no effect in the one-oscillator build.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **External audio / envelope** | audio in (teal) | Outside sound that runs through the filters and can act as an envelope follower. |
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move the knobs; the knob values stay the base. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** A wobble with a patch route:

1. Place **Keys / MIDI**, **Patch Mono** and **Speakers**; connect the notes and the sound as usual.
2. In route 1, set **Source** to the LFO, **Target** to **Cutoff** and **Amount** to about 0.3.
3. Set **LFO rate** to 2 to 6 Hz and hold a low note.

To shape outside sound: connect an audio source to **External audio / envelope**, open **External audio** and use **Hold note** as the gate.

**Tunes.** Pack **Patch Mono Styles**: 79 tunes in 14 folders (Techno, Acid, Dubstep, Drum & Bass, Hip-hop, Dub, Synthwave, Ambient, Electro, Funk & Disco, Trance, Chiptune, **Patch Routes** and **External Input**), file [`patch-mono-styles.patchkamer-tunes.json`](../../tunes/patch-mono-styles.patchkamer-tunes.json). 42 tunes use the one-oscillator build, 37 the two-oscillator build. A few names: **Rolling Sub**, **Acid Squelch**, **Wobble Bass** and **Sample and Hold Computer** (folder Patch Routes), **Input Through Lowpass** and **Input Follower Bass** (folder External Input).

**Tips and limits.**

- The routes are an internal matrix, not electrical CV cables (for those, see [Patchbay Synth](#patchbay-synth)).
- Mono: one note at a time; **Note priority** decides which held key sounds.

## Polyphonic synths, pads and chords

### Poly Chorus

**What it is for.** A polyphonic synth with six voices and a stereo chorus. Each voice has a sawtooth, a pulse (with pulse-width modulation), a sub and noise. Good for chords, pads and bright basses.

![The Poly Chorus card](../images/en/synths/poly-chorus.png)

**Controls.**

- **Sound** (eight starting sounds: Warm Poly, Rave Chords, Silk Strings, Deep Sub, PWM Cloud, Slow Brass, Muted Pluck, Wide Organ). **Test note (MIDI)** with **Play note**, **Hold note**, **Test chord** and **All off**.
- **Oscillator:** **Sawtooth**, **Pulse**, **Sub** and **Noise** (levels), **Pulse width** and **Transpose** (−24 to 24 semitones).
- **Filter:** **High-pass** (four settings, `0 · deep` to the thinnest, cutting at 20, 80, 180 or 400 Hz), **Cutoff** (30 to 16000 Hz), **Resonance**, **Filter envelope** (−5 to 5 octaves), **Key tracking** and **Drive**.
- **Amplifier:** **VCA** (**Envelope** or **Gate**), **VCA attack**, **VCA decay**, **VCA sustain**, **VCA release**.
- **Modulation:** **LFO rate**, **LFO → pitch**, **LFO → filter**, **PWM depth**, **Portamento**.
- **Chorus:** **Chorus** (**Off**, **I** (slow), **II** (faster) or **I + II**), **Chorus mix** and **Chorus width**.
- **Output** and a scope (**Output waveform**).

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move the knobs (not the choices). |
| **Out** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Poly Chorus** and **Speakers**. Choose the sound **Silk Strings**, set **Chorus** to **I + II** and play chords. Lengthen **VCA attack** for a slow swell.

**Tunes.** Pack **Poly Chorus Styles**: 72 tunes in 12 folders (Synthwave, Ambient, Cinematic, Pop, Trance, House, Deep House, Funk & Disco, Soul, Electro, Lo-fi, Techno), six per folder, file [`poly-chorus-styles.patchkamer-tunes.json`](../../tunes/poly-chorus-styles.patchkamer-tunes.json). A few names: **Neon Bass**, **Slow Tide**, **Rising Strings**, **Bright Pop Chords**, **Stab Chord**.

**Tips and limits.**

- The four envelope knobs steer two things at once: the amplifier and, through **Filter envelope**, the filter. A long **VCA attack** also opens the filter slowly. With **VCA** on **Gate**, the amplifier gets a fixed fast attack (3 ms), full sustain and a short release (30 ms), and the knobs only move the filter.
- Six voices: a seventh note takes over the oldest voice that is already letting go. Long releases with many notes break notes off.

### Triple Osc Poly

**What it is for.** A flexible polyphonic subtractive synth. Each voice has three oscillators (sawtooth, square, triangle, sine, FM or noise) with unison up to seven voices, a mixer with ring modulation, a shaper, two filters (the second is off at the start) and two envelopes. It can also turn a single key into a chord.

![The Triple Osc Poly card](../images/en/synths/triple-osc-poly.png)

**Controls.**

- **Preset buttons** (Init, Warm Pad, Strings, FM Keys, Pluck, Supersaw, Deep Bass, Glass, Noise Field): starting sounds that set the controls once. The counter shows how many voices sound (`0 of 6 voices`).
- **Oscillator 1, 2 and 3** (each with an **on** checkbox): **Type** (Sawtooth, Square, Triangle, Sine, FM, Noise), **Octave**, **Semitones**, **Fine** (cents), **Level**, **Unison** (1 to 7), **Spread** (the detune between the unison voices, in cents), **Stereo** (width of the unison voices), **FM-ratio** and **FM-index** (only for type FM).
- **Mix:** **Noise**, **Ring 1×2** (ring modulation of oscillators 1 and 2) and **FM 2→1** (oscillator 2 modulates the pitch of oscillator 1).
- **Shaper:** **Shape** (Off, Soft, Hard, Fold, Asym) and **Drive**.
- **Filter 1** and **Filter 2** (second one has an **on** checkbox): **Type** (for example **LP 24**, **HP 12**), **Cutoff**, **Resonance**, **Env depth** and **Key follow**; **Routing** (**Series (1 → 2)** or parallel).
- **Filter-envelope** and **Amp-envelope:** **Attack**, **Decay**, **Sustain**, **Release**; the amp envelope also has **Velocity** (0 = every note equally loud). One filter envelope is shared by both filters.
- **Voices & output:** **Voices** (maximum number of notes), **Chord** (a single note or a chord built from one key), **Voicing** (how open the chord is), **Tune**, **Level** and **Pan**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. Every chord note counts as a voice. |
| **Mod** | modulation in (purple) | A modulator can move 21 controls (tune, oscillator levels, unison spread and more). |
| **Out** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Click **Supersaw**, then place **Keys / MIDI** and **Speakers**. Lower **Cutoff** of **Filter 1** a little, raise **Env depth** and play chords. Switch on **Filter 2** with **Routing** on **Series** for a steeper cut.

**Tunes.** Pack **Triple Osc Poly Styles**: 73 tunes in 12 folders (Trance, House, Pop, Synthwave, Ambient, Cinematic, Future Bass, Funk, Disco, Electro, Techno, Lo-fi), file [`triple-osc-poly-styles.patchkamer-tunes.json`](../../tunes/triple-osc-poly-styles.patchkamer-tunes.json). A few names: **Supersaw Anthem**, **Piano Stab**, **Epic Strings**, **Sub Bass**, **Warehouse Stab**.

**Tips and limits.**

- A note that is shorter than the amplifier **Attack** is not silent: the release starts from the level the attack had reached, so a short note sounds soft. For short notes and plucks, keep the attack short anyway.
- The level of each voice is divided by the square root of the unison count and of the number of chord notes, so many unison voices do not make it louder in the same measure.
- Oscillator type **Noise** is very soft; a patch with only noise oscillators stays quiet.

### Supersaw Swarm

**What it is for.** A polyphonic trance supersaw. Each note is a swarm of 1, 3, 5, 7 or 9 detuned sawtooth waves, with an octave layer, a sub, chorus, ping-pong delay, reverb, a trance gate and a pump effect, all in one card.

![The Supersaw Swarm card](../images/en/synths/supersaw-swarm.png)

**Controls.**

- **Top row:** **Preset** (starting sounds, for example Anthem Lead, Heaven Pad and Hall Chords), **Saws per note** (1, 3, 5, 7 or 9), **Chord per key** (**Single notes**, Minor, Major, Sus2, Sus4, Minor 7, Minor add9 or Fifth + octave; every key becomes that chord), **Delay time** (1/16, 1/8, 3/16, 1/4 or 3/8; it follows the clock). **Test chord**, **Test note** and **All off**.
- **Sound:** **Filter** (cutoff), **Resonance**, **Filter envelope** and **Drive**.
- **Swarm:** **Swarm width** (detune of the outer saws, up to 60 cents), **Side saws** (side saws against the middle saw), **Stereo spread**, **Octave layer** (two saws one octave higher) and **Sub**.
- **Envelope:** **Attack**, **Decay**, **Sustain**, **Release**.
- **Space:** **Chorus**, **Delay**, **Delay repeats**, **Reverb** and **Reverb length** (0.6 to 10 s).
- **Motion & level:** **Trance gate** (depth), **Pump** (depth), **Transpose** and **Output**.
- **Gate pattern (16 steps, follows the clock):** 16 squares, one per sixteenth note; a lit square is open, a dark one closed (down to the depth of **Trance gate**).

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move the knobs except **Reverb length**, the choices and the preset. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Supersaw Swarm** and **Speakers**. Press **Start**, set **Chord per key** to **Minor**, **Trance gate** to about 70% and play single notes: every key plays a chord that chops to the gate pattern. Try **Pump** at 50% for a volume dip on every beat.

**Tunes.** Pack **Supersaw Swarm Styles**: 61 tunes in 10 folders (Trance, Hardstyle, Progressive, Big Room, Synthwave, Pop, Future Bass, Eurodance, Ambient, Cinematic), file [`supersaw-swarm-styles.patchkamer-tunes.json`](../../tunes/supersaw-swarm-styles.patchkamer-tunes.json). A few names: **Anthem Supersaw**, **Euphoric Lead**, **Festival Lead**, **Future Chord Stack**, **Slow Bloom Pad**.

**Tips and limits.**

- **Trance gate** and **Pump** only move while the clock runs (**Start**). **Pump** lowers the volume on every beat to `1 − 0.85 × depth` and lets it come back.
- At most 14 notes at once; a new note releases the oldest. A chord counts for every note in it. Choose **Single notes** if your sequencer already sends chords.
- Changing **Reverb length** rebuilds the reverb, so the new reverb arrives after about 0.2 s.

### Chord Poly

**What it is for.** A polyphonic chord synth with up to 24 voices. Every note becomes a chord (or stays single). Each note has two slightly detuned oscillators and a sub, a lowpass filter with envelope, a stereo chorus and drive. Made for stabs, organ chords and pads.

![The Chord Poly card](../images/en/synths/chord-poly.png)

**Controls.**

- **Top row:** **Preset** (Warehouse Chords, Warm Horizon, Rave Stab, Glass Pulse, Soft Organ, Wide Lead, Night Pad, Electric Chimes), **Waveform** (Sawtooth, Square, Triangle or Sine for both oscillators), **Chord memory** (**Single notes**, Major, Minor, a suspended chord, Minor 7, or a custom chord that uses **Custom intervals**) and **Custom intervals** (semitones above the played note, separated by commas, for example `0,4,7`; at most 6). **Test chord** and **All off**.
- **Filter:** **Filter** (cutoff, 80 to 16000 Hz), **Resonance** and **Filter envelope** (0 to 4 octaves).
- **Oscillators:** **Unison spread** (the two oscillators sit this many cents above and below the note, 0 to 35) and **Sub oscillator**.
- **Envelope:** **Attack**, **Decay**, **Sustain** and **Release**.
- **Space and level:** **Chorus**, **Stereo width**, **Drive**, **Transpose** and **Output**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move the knobs. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Chord Poly** and **Speakers**. Set **Chord memory** to **Minor 7** and play one key at a time: each key sounds a four-note chord. For your own chord, choose the custom chord and type `0,4,7,11` in **Custom intervals**.

**Tunes.** Pack **Chord Poly Styles**: 120 tunes in 20 folders (House, Deep House, Garage, Lo-fi, Ambient, Pop, Soul, Synthwave, Cinematic, Disco & Funk, Techno, Dub Techno, Trance, Progressive Trance, Big Room, Electro House, Electro, Future Bass, Hardstyle, Eurodance), six per folder, file [`chord-poly-styles.patchkamer-tunes.json`](../../tunes/chord-poly-styles.patchkamer-tunes.json). A few names: **Classic House Stab**, **Deep Ninth Chord**, **Velvet Chord**, **Endless Pad**, **Disco Stab**.

**Tips and limits.**

- Every chord note takes one of the 24 voices: a four-note chord leaves room for six chords.
- The volume of a chord is divided by the square root of the number of notes, so a chord is not much louder than a single note.
- If your sequencer already sends chords, choose **Single notes**.

### Cinematic Synth

**What it is for.** A polyphonic synth for film-score sounds: huge brass-like braams, wide pads and drones, low pulsing ostinati and organ-like arpeggios. Each voice has a main layer of up to 5 detuned oscillators with stereo spread, a second layer with an octave choice, a sub sine and noise, a lowpass filter with its own swell, an amplifier envelope with up to 12 seconds of attack and 15 seconds of release, and a pitch drop or rise at the start of every note. Behind the voices sit drive, a low and a high shelf, an ensemble chorus, a ping-pong echo and a big reverb of 0.5 to 9 seconds. A **pulse engine** follows the studio clock and plays the notes you hold as an ostinato or arpeggio.

![The Cinematic Synth card](../images/en/synths/cinematic-synth.png)

**Controls.**

- **Oscillators:** **Waveform**, **Voices per note** (1 to 5), **Detune**, **Stereo spread**, **Second layer** (off, saw, square, triangle, sine), **Second layer octave** (−2 to +1), **Second layer mix**, **Sub**, **Noise**, **Pitch drop** (−12 to +12 semitones at the start of each note) and **Drop time**.
- **Filter:** **Cutoff**, **Resonance**, **Swell** (how many octaves the filter opens, −4 to +5), **Filter attack**, **Filter decay**, **Filter hold** and **Key tracking**.
- **Amplifier:** **Attack** (up to 12 s), **Decay**, **Sustain** and **Release** (up to 15 s).
- **Motion:** **Vibrato rate**, **Vibrato depth** and **Filter wave** (a slow wave on the cutoff).
- **Space and tone:** **Drive**, **Weight** (low shelf), **Air** (high shelf), **Ensemble**, **Echo time**, **Echo feedback**, **Echo**, **Reverb length**, **Reverb damping** and **Reverb**.
- **Pulse engine:** **Pattern** (off, eighths, sixteenths, up, down, up and down, random, organ run, chord hits), **Rate** (1/4, 1/8, 1/8 triplet, 1/16, 1/16 triplet, 1/32), **Gate**, **Octaves** (1 to 3), **Accent** and **Latch** (keep the chord after you let go).
- **Output:** **Level** and **Transpose**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI**, a sequencer or the **MIDI Hub**. |
| **Mod** | modulation in (purple) | A modulator can move 18 parameters (cutoff, resonance, swell, detune, sub, noise, layer mix, vibrato depth, filter wave, drive, weight, air, ensemble, echo feedback, echo, reverb, gate and level). |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Cinematic Synth** and **Speakers**. Pick the tune **Dream Heist › Heist Braam** and play a low note: a huge brass-like swell. For an ostinato pick **Dream Heist › Pulse Ostinato Low**, press **Start** and hold a chord: the pulse engine plays it in eighths.

**Tunes.** Pack **Cinematic Synth Scores**: 56 tunes in 7 sets (Dream Heist, Dark Hero, Space Voyage, Desert Epic, Ancient Battle, Quiet Tension, Impacts and Risers): braams and brass, drones, pads, ostinati, arpeggios, bells and impacts. Choose a set and then a tune in the tune list. Tunes with a pulse pattern follow the clock, so press **Start**.

**Tips and limits.**

- Up to 10 voices play at once; the oldest one is cut short when you play more. A big unison (5 voices per note) with a second layer uses the most processing power.
- The pulse engine plays only while the studio clock runs (**Start**). Without it the notes you hold stay silent when a pattern is on.
- A new reverb length builds a new reverb a moment after you stop turning the knob.
- With long attacks and releases the notes you play stay audible for a long time: use **Stop** or **All notes off** to silence them.

### Bowed Ensemble

**What it is for.** A polyphonic string ensemble with sixteen voices. Each voice has four slightly detuned oscillators, bow or air noise, a lowpass filter with its own envelope and a stereo position. All voices share a high-pass filter, two tone filters, a three-tap ensemble chorus and a hall of about 5.5 seconds. Made for chords, pads and long lines. It is a section, not a model of one string (for that, see [Karplus String](#karplus-string)).

![The Bowed Ensemble card](../images/en/synths/bowed-ensemble.png)

**Controls.**

- **Ensemble** (list of starting sounds: Chamber Ensemble, Cinematic Strings, Velvet Strings, Vintage String Machine, Disco Strings, Slow Bloom, Spiccato, Pizzicato, Dark Cellos, Glass Strings, Wide Legato, String Lead; it shows **Custom sound** once you change a knob).
- **Sound & articulation:** **Brightness** (cutoff, 200 to 14000 Hz), **Resonance**, **Body** (fuller low mids), **Bow / air** (bow noise under the note), **Attack** (0.005 to 5 s), **Decay**, **Sustain**, **Release** (up to 12 s) and **Touch response** (how much the velocity sets the level).
- **Ensemble & space:** **Ensemble detune** (0 to 20 cents between the oscillators), **Vibrato** and **Vibrato rate** (3 to 8 Hz), **Organic drift** (slow pitch wandering per voice), **Chorus**, **Stereo width**, **Hall** and **Balance**.
- **Playing & level:** **Transpose**, **Expression** (a second volume control after the compressor, for swells) and **Output**. **Test chord** and **All off**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. A sequencer must send the note length. |
| **Mod** | modulation in (purple) | A modulator can move the knobs; the **Ensemble** list is not moved. |
| **Stereo strings** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Bowed Ensemble** and **Speakers**. Choose the tune **Cinematic › Epic Strings Wide**, hold a chord and move **Expression** while you play for a swell. Raise **Attack** to about 1 s for a slow bloom.

**Tunes.** Pack **Bowed Ensemble Styles**: 65 tunes in 11 folders (Cinematic, Ambient, Pop, Ballad, Trance, Synthwave, Film Score, Lo-fi, Neo-classical, Disco & Funk, Deep House), file [`bowed-ensemble-styles.patchkamer-tunes.json`](../../tunes/bowed-ensemble-styles.patchkamer-tunes.json). A few names: **Epic Strings Wide**, **Slow Bloom**, **Tender Violins**, **Chamber Quartet**, **Funk Chops**.

**Tips and limits.**

- Sixteen voices: a seventeenth note takes over the voice that finishes first. A long **Release** with many notes breaks notes off.
- A note without a length and without a note-off keeps sounding until the transport stops or a panic arrives: make a sequencer send note lengths.
- Hardware MIDI connects through **Keys / MIDI** (see the [main manual](../USER-MANUAL_EN.md)).

### Brass Section

**What it is for.** A polyphonic brass instrument: trumpet, trombone, horn or a whole section. Every note starts one to four **players**, and each player is its own voice (32 voices in total): a band-limited sawtooth through a lowpass filter that swells open on every note (the characteristic *blat*) and opens further when you play harder. On the attack the pitch scoops up from slightly below, breath and lip noise sit under the note and the vibrato only starts after a delay. With more than one player the voices are tuned a few cents apart, enter a few milliseconds after each other and stand at different places in the stereo image. A **Mute** control gives a cup-mute tone. It has no sequencer and no reverb: add an effect behind it.

![The Brass Section card](../images/en/synths/brass-section.png)

**Controls.**

- **Brass** (list of starting sounds: Trumpet, Muted Trumpet, Flugelhorn, Trombone, French Horn, Brass Section, Tight Stabs, Slow Swell, Soft Ballad Horn; it shows **Custom sound** once you change a knob).
- **Tone & blat:** **Brightness** (filter cutoff, 250 to 9000 Hz), **Blat** (how far the filter swells open on every note), **Swell time** (how fast it opens), **Resonance**, **Edge** (soft saturation that makes the tone rougher), **Mute** (cup-mute tone: darker with a nasal peak) and **Velocity colour** (how much harder notes sound brighter).
- **Attack & playing:** **Attack**, **Decay**, **Sustain**, **Release**, **Scoop** (how many cents the note starts below its pitch) and **Scoop time**, **Breath** (breath and lip noise) and **Touch response** (how much the velocity sets the level).
- **Section & vibrato:** **Players** (1 to 4 per note), **Section detune** (cents between the players), **Entry spread** (the players start up to 80 ms after each other), **Stereo width**, **Vibrato**, **Vibrato rate** and **Vibrato delay** (how long before the vibrato starts).
- **Playing & level:** **Transpose**, **Expression** (for swells) and **Output**. **Test note**, **Test chord** and **All off**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. A sequencer must send the note length. |
| **Mod** | modulation in (purple) | A modulator can move every knob except **Players** and **Transpose**; the **Brass** list is not moved. |
| **Stereo brass** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Brass Section** and **Speakers**. Choose the tune **Stabs › Funk Stab** and play short chords with different strengths: the harder notes sound brighter and rougher. Then choose **Swells › Slow Swell**, hold a chord and move **Expression** for a slow swell.

**Tunes.** Pack **Brass Section**: 32 tunes in 8 folders (Trumpet, Trombone, Horn, Section, Stabs, Swells, Funk, Ballad), file [`brass-section.patchkamer-tunes.json`](../../tunes/brass-section.patchkamer-tunes.json). A few names: **Bright Lead**, **Fat Slide**, **Big Band Section**, **Funk Stab**, **Fall Hit**, **Slow Swell**, **Smoky Flugel**. The tunes are checked for range and behaviour, not listened to.

**Tips and limits.**

- 32 voices: with 4 players there is room for 8 notes at once; a new note takes over the quietest fading voice or else the oldest one.
- A note without a length and without a note-off keeps sounding until the transport stops or a panic arrives: make a sequencer send note lengths.
- **Attack**, **Release**, **Scoop**, **Section detune**, **Entry spread** and **Players** are read when a note starts, so a change affects the next note.
- Trombone and horn sounds use **Transpose** −12; or play lower notes.

### Woodwinds

**What it is for.** The woodwind family with its own engine: **flute**, **clarinet**, **oboe**, **bassoon**, **alto** and **tenor saxophone**, **recorder** and **pan flute**, chosen with the **Type** list. Every voice is a harmonic series with an exact pitch whose strength per overtone follows a model of the instrument: a slope that opens with the breath pressure, the odd-only series of a cylinder (clarinet, pan flute) or the full series of a cone (oboe, bassoon, saxophone), formant peaks of the body (a strong one for the oboe, a dark one for the bassoon) and a lowpass. The breath noise passes through a comb tuned to the note, as if the tube let the air sound along, and every note starts with a tongue or lip chiff. The vibrato starts after a delay and also moves the breath pressure; notes that overlap on a melodic line play **legato** with a pitch glide; **Overblow** jumps to the second register; **Bite** and **Growl** give reed and saxophone their raw side. Every note starts one to three **players** (16 voices in total). It is a source-filter model and not a physical simulation of the tube. It has no sequencer and no reverb: add an effect behind it.

![The Woodwinds card](../images/en/synths/woodwinds.png)

**Controls.**

- **Type** (Flute, Clarinet, Oboe, Bassoon, Alto saxophone, Tenor saxophone, Recorder, Pan flute) and **Sound** (list of starting sounds: Concert Flute, Clarinet, Oboe, Bassoon, Alto Sax, Tenor Sax, Recorder, Pan Flute, Woodwind Section; it shows **Custom sound** once you change a control).
- **Tone & formant:** **Brightness**, **Formant** (how much of the body resonance of the type you hear), **Reed & jet** (reed stiffness for the reed types, jet strength for the flutes), **Bite** (extra high overtones and a soft saturation), **Growl** (a slow rough modulation, flutter-tongue on a flute) and **Overblow** (jumps to the second register: an octave up, a twelfth for the clarinet and pan flute).
- **Breath & attack:** **Breath pressure** (louder, brighter and more air), **Breath** (air noise), **Tongue chiff** (the burst at the start of a note), **Attack**, **Release** and **Touch response**.
- **Vibrato & legato:** **Vibrato**, **Vibrato rate**, **Vibrato delay** (how long before the vibrato starts), **Legato glide**, **Human drift** (slow random wander of pitch and level) and the **Legato** list (On or Off).
- **Section & level:** **Players** (1 to 3 per note), **Section detune**, **Stereo width**, **Tuning**, **Transpose**, **Expression** (for swells) and **Output**. **Test note**, **Test chord** and **All off**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer; a sequencer must send the note length, and notes that should play legato must overlap (a length longer than the step). A bend message (`cc` with id `bend` or `pitchbend`, value 0 to 1 with 0.5 in the middle) bends two semitones up or down. |
| **Mod** | modulation in (purple) | A modulator can move every control except **Players** and **Transpose**; the **Type**, **Sound** and **Legato** lists do not move. |
| **Stereo woodwinds** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Woodwinds** and **Speakers**. Choose the tune **Sax › Smooth Alto** and play a melody in which the notes overlap: they glide into each other. Choose **Flute › Overblown Flute** for a breathy octave jump, or **Section › Clarinet Trio** and play chords for three players per note.

**Tunes.** Pack **Woodwinds**: 42 tunes in 12 folders (Flute, Clarinet, Oboe, Bassoon, Sax, Recorder, Pan Flute, Section, Ballad, Jazz, Folk, Ambient), file [`woodwinds.patchkamer-tunes.json`](../../tunes/woodwinds.patchkamer-tunes.json). A few names: **Concert Flute**, **Chalumeau**, **Nasal Oboe**, **Growl Tenor**, **Andean Pan Flute**, **Sax Section**, **Late Night Sax**, **Breath Pad**. The tunes are checked for range and behaviour, not listened to.

**Tips and limits.**

- 16 voices: with 3 players there is room for 5 notes at once; a new note takes over the quietest fading voice or else the oldest one.
- A note without a length and without a note-off keeps sounding until the transport stops or a panic arrives: make a sequencer send note lengths.
- **Attack**, **Release**, **Legato glide**, **Vibrato delay**, **Section detune** and **Players** are read when a note starts, so a change affects the next note. **Type** also applies to new notes.
- Legato only works on a single line: notes that arrive together (a chord) never glide into each other, and the players per note must be the same as for the previous note.
- Tenor and bass-register sounds (bassoon, bass clarinet, contra bassoon) use **Transpose** −12 or −24, or play lower notes.

## Keys and strings

### Piano

**What it is for.** The acoustic piano family with its own engine: a **grand**, an **upright**, a **honky-tonk**, a **tine electric piano** (soft, bell-like tines with tremolo), a **reed electric piano** (with bark and drive) and a **clavichord** (plucked, percussive). Every note is a bank of ringing partials: inharmonic overtones that run a little sharp (the string stiffness), one to three slightly detuned strings per note, a strike point that shapes the spectrum, a hammer whose hardness and noise follow how hard you play, a decay that is longer for low notes and shorter for high ones, and a soundboard that colours the sum. The sustain pedal keeps released notes ringing, and a damper stops them when you let go. The notes are placed in the stereo image by pitch. There is no sequencer and no reverb: put an effect behind it. Stage Keys is the electric-keys and organ synth; Piano is the acoustic piano family, with the electric pianos as variants.

![The Piano card](../images/en/synths/piano.png)

**Controls.**

- **Type** (Grand, Upright, Honky-tonk, Tine e-piano, Reed e-piano, Clavichord) and **Sound** (list of starting sounds: Concert Grand, Studio Upright, Honky-tonk, Tine Piano, Reed Piano, Clavichord, Soft Felt Piano, Bright Pop Grand; it shows **Custom sound** once you change a knob).
- **Tone & strings:** **Brightness** (hammer hardness), **Velocity colour** (how much harder notes sound brighter), **Strike point** (where the hammer hits the string), **Inharmonicity** (string stiffness: the overtones run sharp), **String detune** (cents between the strings of a note; large for honky-tonk) and **Hammer noise**.
- **Decay & body:** **Sustain length**, **Aftersound** (how much of the long tail is left after the first quick decay), **Damper time** (how fast a note stops when you release it), **Soundboard** (amount of body resonance) and **Body tuning** (size of the case).
- **Electric:** **Tremolo** (depth, auto-pan between left and right), **Tremolo rate** and **Drive** (the bark of the reed piano).
- **Playing & level:** **Stereo width** (how far the notes spread over the keyboard), **Touch response**, **Tuning**, **Transpose** and **Output**. **Test note**, **Test chord**, **Pedal** (toggles the sustain pedal) and **All off**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer; a sequencer must send the note length. A pedal message (`cc` with id `pedal` or `sustain`, or controller 64) works the sustain pedal; **Keys / MIDI** passes your pedal on. |
| **Mod** | modulation in (purple) | A modulator can move every knob except **Transpose**; the **Type** and **Sound** lists do not move. |
| **Stereo piano** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Piano** and **Speakers**. Choose the tune **Grand › Concert Grand**, play chords with different strengths and press **Pedal**: released notes keep ringing until you press it again. Then choose **Tine › Suitcase Tremolo** for a swaying electric piano, or **Honky-tonk › Saloon Honky-tonk** for a detuned bar piano.

**Tunes.** Pack **Piano**: 43 tunes in 11 folders (Grand, Upright, Honky-tonk, Tine, Reed, Clavichord, Layered, Ballad, Pop, Jazz, Lo-fi), file [`piano.patchkamer-tunes.json`](../../tunes/piano.patchkamer-tunes.json). A few names: **Concert Grand**, **Dusty Upright**, **Saloon Honky-tonk**, **Suitcase Tremolo**, **Barking Reed**, **Baroque Room**, **Pad Bed Piano**. The tunes are checked for range and behaviour, not listened to.

**Tips and limits.**

- 40 voices, one per note; a new note takes over the quietest fading voice. With the pedal held, many notes can pile up: the engine stops the quietest ones.
- A note without a length and without a note-off keeps sounding until the transport stops or a panic arrives: make a sequencer send note lengths.
- **Brightness**, **Strike point**, **Inharmonicity**, **String detune**, **Sustain length**, **Aftersound** and **Hammer noise** are read when a note starts, so a change affects the next note. **Type** also applies to new notes.
- The sustain pedal is not a knob and is not saved in a tune.

### Guitar

**What it is for.** The plucked-string family with its own engine: a **steel-string**, a **nylon** classical guitar, a **clean electric**, an **overdriven electric**, a **palm-muted** electric, a **12-string** and a **bass guitar**. Every string is a small physical model (a digital waveguide, an extended Karplus-Strong loop): a pluck whose position shapes the spectrum, a loop that damps the highs faster when you play softer, a string stiffness that makes the overtones run a little sharp, and string noise. The acoustic types add a body resonance; the electric types add a pickup position and an amp with drive. There are six strings with one voice each: notes are given to strings by pitch, so a chord spreads over the strings, and a note that overlaps a sounding note on the same string becomes a hammer-on or pull-off (the pitch glides, the string is not plucked again). A strum helper spreads the notes of a chord in time, down, up or alternating, and the pitch can be bent. There is no sequencer, reverb or delay: put an effect behind it. Karplus String is the single-string plucked and bowed model with its own keyboard, and Low Bass and Sub Line are synthesizer basses; Guitar is the guitar and bass-guitar family with playing technique.

![The Guitar card](../images/en/synths/guitar.png)

**Controls.**

- **Type** (Steel-string, Nylon, Clean electric, Overdriven electric, Muted (palm mute), 12-string, Bass guitar) and **Sound** (list of starting sounds: Steel Strummer, Nylon Classic, Clean Electric, Crunch Lead, Palm Mute Chug, Twelve-String Shimmer, Fingerstyle Bass; it shows **Custom sound** once you change a control).
- **Pluck & string:** **Brightness**, **Velocity colour** (how much harder notes sound brighter), **Pick hardness** (soft finger to hard pick), **Pick position** (near the bridge is thin and sharp, further away is round), **String stiffness** (the overtones run sharp), **Pair detune** (cents between the two strings of a 12-string pair) and **String noise** (pick noise and the squeak of gliding and bending).
- **Decay & body:** **Sustain length**, **Damper time** (how fast a note stops when you release it), **Palm mute** (shorter and duller), **Body** (the body resonance of the acoustic types, the cabinet of the electric types) and **Body tuning**.
- **Pickup & amp:** **Pickup position** (from the bridge to the neck; for the acoustic types it is where the sound is picked up), **Drive** and **Amp tone**. **Drive** and **Amp tone** work for the electric types (clean, overdriven, muted and bass); the overdriven type always has some drive.
- **Playing & level:** **Strum spread** (0 to 80 ms between the notes of a chord), **Direction** (Down, Up, Alternating), **Hammer-ons** (On or Off), **Legato glide** (how long a hammer-on or pull-off glides), **Bend** (semitones), **Bend range** (what a bend controller moves), **Touch response**, **Stereo width**, **Tuning**, **Transpose** and **Output**. **Test note**, **Test chord** and **All off**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer; a sequencer must send the note length, and notes that should become a hammer-on must overlap (a length longer than the step). A bend message (`cc` with id `bend` or `pitchbend`, value 0 to 1 with 0.5 in the middle) bends all strings. |
| **Mod** | modulation in (purple) | A modulator can move every control except **Transpose**, **Strum spread** and **Bend range**; the **Type**, **Sound**, **Direction** and **Hammer-ons** lists do not move. |
| **Stereo guitar** | audio out (teal, stereo) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Guitar** and **Speakers**. Choose the tune **Acoustic › Steel Strummer** and press **Test chord**: the six notes sound one after the other. Play a melody with overlapping notes for hammer-ons, or choose **Bass › Fingerstyle Bass** and play low notes. **Crunch › Classic Crunch** gives an overdriven electric and **Strum › Alternating Strum** strums chords up and down.

**Tunes.** Pack **Guitar**: 40 tunes in 11 folders (Acoustic, Nylon, 12-String, Clean, Crunch, Muted, Bass, Strum, Ambient, Funk, Rock), file [`guitar.patchkamer-tunes.json`](../../tunes/guitar.patchkamer-tunes.json). A few names: **Steel Strummer**, **Classical Concert**, **Shimmer Twelve**, **Edge of Breakup**, **Palm Mute Chug**, **Fingerstyle Bass**, **Glass Pad Guitar**, **Power Chord Drive**. The tunes are checked for range and behaviour, not listened to.

**Tips and limits.**

- Six strings with one voice each, plus a few voices that are still dying out after a new pluck on the same string. Notes above about MIDI note 100 are limited in pitch.
- A note without a length and without a note-off keeps sounding until the transport stops or a panic arrives: make a sequencer send note lengths.
- **Brightness**, **Pick hardness**, **Pick position**, **String stiffness**, **Pair detune**, **Sustain length** and **String noise** are read when a note starts, so a change affects the next note. **Type** also applies to new notes; changing between an acoustic and an electric type may make a short click in notes that are sounding.
- The strum helper and the string assignment work on notes that arrive at the same moment; the notes of a chord are given to different strings and are never hammer-ons.

### Stage Keys

**What it is for.** A polyphonic keys synth with seven sound models, its own keyboard and an output chain with drive and stereo tremolo. It has no sequencer: you play it from the card keyboard or from another device.

![The Stage Keys card](../images/en/synths/stage-keys.png)

**Controls.**

- **Keyboard strip:** the arrows move the 49-key keyboard (C3 to C7 in the picture) and **Sustain** holds notes.
- **Sound model buttons:** **Tine Piano**, **Reed Piano**, **Comb Pluck**, **Drawbar Organ**, **Combo Organ**, **Vibraphone** and **Synth Bass**.
- **Tone knob** (its label changes with the model, 0 to 1): **Bark** for Tine Piano (hardness of the strike), a reed growl for Reed Piano, **Pickup** for Comb Pluck, **Drawbars** for Drawbar Organ (0 = only the lowest drawbars), a flute-to-reed blend for Combo Organ, **Mallet** for Vibraphone and **Filter** for Synth Bass.
- **Drive**, **Tremolo** (depth), **Trem Hz** (speed, 0.5 to 12 Hz; the two channels run in opposite phase), **Tuning** (−50 to 50 cents) and **Level**.
- **Rotary slow / fast:** speed of the rotary effect (only for the Drawbar Organ: 0.7 Hz slow, 6.6 Hz fast).
- **Octave** (−2 to +2): shifts incoming notes, not the card keyboard.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move six controls: tone, drive, tremolo depth, tremolo rate, tuning and level. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |
| **Played** | notes out (orange) | Sends on what you play on the card keyboard, so you can feed it to another device. |

**Example.** Place **Stage Keys** and **Speakers** and connect **Out** to **In**. Click **Drawbar Organ**, play on the card keyboard, raise **Tone** for more drawbars and toggle **Rotary slow / fast**. Connect **Played** to a second synth to play two sounds at once.

**Tunes.** Pack **Stage Keys Styles**: 66 tunes in 11 folders (Soul, Funk, Jazz, Pop, Gospel, Rock, Disco, House, Lo-fi, Reggae, Ballad), six per folder, file [`stage-keys-styles.patchkamer-tunes.json`](../../tunes/stage-keys-styles.patchkamer-tunes.json). Together they cover all seven models (Tine Piano 12 tunes, Drawbar Organ 12, Reed Piano 10, Synth Bass 10, Vibraphone 8, Combo Organ 8, Comb Pluck 6). A few names: **Warm Tine Chords**, **Greasy Organ**, **Smoky Vibes**, **Church Drawbars**, **Skank Organ**.

**Tips and limits.**

- Up to 24 voices; one voice per pitch, so striking the same note again cuts the previous one of that pitch short.
- The **Tone** value is read at every new note, so a change affects the next note.
- Every model has a fixed release after you let go of a key (for example about 0.2 s for Tine Piano and 0.12 s for Synth Bass).

### Four-Operator FM

**What it is for.** An FM synth with four sine operators and eight voices. Every operator has its own frequency ratio, level, fine tune and envelope. Eight algorithms decide which operators modulate each other and which ones you hear (the carriers). Operator 4 has feedback. Good for bells, glass, tines, electric pianos and FM basses.

![The Four-Operator FM card](../images/en/synths/four-operator-fm.png)

**Controls.**

- **Top row:** **Sound** (Rubber Bass, Digital Tines, Hollow Organ, Metal Bells, Stab Chord, Glass Marimba, Breathing Pad, Wire Pluck), **Algorithm** (1 to 8). **Test note MIDI** with **Play note**, **Hold note**, **Test chord** and **All off**.
- **The diagram:** shows the chosen algorithm. The bottom row is what you hear; operators higher up colour those carriers. Use **Operator** to choose which one you edit.
- **Per operator (OP 1 to OP 4):** **Ratio** (frequency against the note, 0.5 to 16: whole numbers give harmonic sounds, fractions give bells and metal), **Level** (for a modulator the modulation depth, for a carrier the volume), **Fine tune** (−12 to 12 cents), **Attack**, **Decay**, **Sustain** and **Release**.
- **General:** **Feedback OP 4** (0 to 7: 0 is a pure sine, 2 to 3 a sawtooth-like tone, 6 to 7 noise), **LFO** (rate, 0.05 to 20 Hz), **Vibrato** (0 to 80 cents), **Tremolo**, **Transpose** and **Output**.

The eight algorithms (`a → b` means a modulates b):

1. 4 → 3 → 2 → 1; you hear 1. One long chain.
2. 3 and 4 → 2 → 1; you hear 1.
3. 4 → 3 and 2 both → 1; you hear 1.
4. 4 → 2 and 3 both → 1; you hear 1.
5. 2 → 1 and 4 → 3; you hear 1 and 3. Two pairs.
6. 4 → 1, 4 → 2 and 4 → 3; you hear 1, 2 and 3. One modulator for three carriers.
7. 4 → 3; you hear 1, 2 and 3.
8. No modulation; you hear all four. Purely additive.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Keyboard / notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move all the numeric controls. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Choose **Algorithm 6** and set **OP 4 · Ratio** to 3.5, with a long **Decay** (1.5 to 3 s) and **Sustain** 0 on the carriers: bell-like tones. Play single notes from **Keys / MIDI**.

**Tunes.** Pack **Four-Operator FM Styles**: 67 tunes in 11 folders (Synthwave, Electro, Pop, Chiptune, Jazz & Soul, Ambient, Cinematic, Techno & House, Drum & Bass, Hip-hop & Lo-fi, Funk & Disco), file [`four-operator-fm-styles.patchkamer-tunes.json`](../../tunes/four-operator-fm-styles.patchkamer-tunes.json). A few names: **Neon Bass**, **Tine Piano**, **Warm Vibes**, **Deep Impact**, **Dusty Keys**.

**Tips and limits.**

- Keep the sum of the carrier levels at about 1 or lower. The device already divides by the square root of the number of carriers and has a limiter behind the output; **Output** around 60 to 80% is usual.
- A carrier with **Sustain** 0 and a short **Decay** gives a tick; **Sustain** 1 holds the tone as long as the key is down.
- Eight voices: with long releases and fast notes the oldest voice drops out.

### Karplus String

**What it is for.** A model of a plucked or bowed string with eight voices and its own keyboard of two octaves. Each note is a string: a short burst of noise (pluck) or a continuing noise (bow) goes into a delay loop with damping, stiffness and ring time.

![The Karplus String card](../images/en/synths/karplus-string.png)

**Controls.**

- **Quick settings:** **Guitar**, **Harp**, **Koto**, **Bowed**, **Metal** and **Muted** set **Decay**, **Damping**, **Brightness**, **Pluck pos.**, **Bowing** and **Stiffness** in one go. The other controls stay.
- **Decay:** the ring time of a held note, 0.1 to 20 s.
- **Damping:** 0 = bright and long, 1 = dull and short.
- **Brightness:** how sharp the strike is.
- **Pluck pos.:** where on the string it is plucked (0.02 to 0.5): near 0 is sharp and nasal, 0.5 is hollow.
- **Bowing:** 0 = pluck, higher = a continuing bowed sound; 1 is strong.
- **Stiffness:** higher makes the overtones sit too high (metal, bell).
- **Tuning:** −100 to 100 cents. **Octave:** −2 to +2, for incoming notes and the card keyboard. **Stereo:** every note gets a random place; 0 = middle, 1 = wide. **Level.**

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move eight controls: **Decay**, **Damping**, **Brightness**, **Pluck pos.**, **Bowing**, **Stiffness**, **Tuning** and **Level**. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Karplus String** and **Speakers**. Click **Harp** and play. Click **Bowed** and hold notes for two seconds or more: the string keeps sounding while you hold.

**Tunes.** Pack **Karplus String Styles**: 60 tunes in 10 folders (Folk, Ambient, Cinematic, Pop, World, Lo-fi, Ballad, Flamenco, Jazz, Metallic), six per folder, file [`karplus-string-styles.patchkamer-tunes.json`](../../tunes/karplus-string-styles.patchkamer-tunes.json). A tune is a sound only; there is no pattern. A few names: **Open Guitar**, **Glass Strings**, **Koto Lead**, **Slow Bow Pad**, **Rust Strings**.

**Tips and limits.**

- A note sounds for its length and then rings out for at most 0.25 s, even when **Decay** is larger: **Decay** sets the ring while the note is held. For a long ringing string, hold the note long.
- The pitch stays accurate above about MIDI note 24 (C1).
- Eight voices: a ninth note takes over the voice that has sounded longest.
- There is no arpeggiator: send short notes (0.1 to 0.25 s) from a sequencer for a plucked rhythm.

## Special and modular

### Dissonant Cluster

**What it is for.** A polyphonic synth that only sounds dissonant. Every note becomes a cluster of 2 to 6 voices in a structure you choose (a narrow cloud, a chromatic cluster, a wide 13-tone layout and more). A guard shifts voices by a few cents when needed, so no pair of tones sounds consonant. For drones, tension, industrial sounds and effects.

![The Dissonant Cluster card](../images/en/synths/dissonant-cluster.png)

**Controls.**

- **Preset buttons** at the top: Basic, Hornet Nest, Rusty Bell, Tritone Choir, Quarter-tone Mist, Glass Splinters, Industrial Drone and Minor Siren (starting settings). Below them the **Roughness** meter and the dissonance map (grey: roughness of two tones per interval, red: forbidden consonant zones, highlighted: your voices).
- **Cluster:** **Structure** (cloud, chromatic, wide, tritone, seventh and ninth, 13-tone or random), **Voices** (2 to 6), **Openness** (every second voice an octave higher: closed to 3), **Beating** (Hz) and **Beating mix** (how much of the second oscillator per voice sounds), **Drifting apart** (voices drift apart, in cents per second; off = 0), **Guard** (the consonance guard) and **Margin** (in cents).
- **Source:** **Waveform**, **FM ratio** and **FM-index**, **Ring ratio** and **Ring**, **Metal** (a metallic source of six square waves) and **Noise**.
- **Friction:** **Depth** and **Rate** (8 to 70 Hz): a fast volume movement that you hear as roughness, strongest around 30 Hz.
- **Filter:** **Type** (Lowpass, Bandpass, Highpass, Notch, Peaking), **Cutoff**, **Reso**, **Env depth**, **Key tracking**, **Shaper** and **Drive**.
- **Filter-envelope** and **Amp-envelope:** **Attack**, **Decay**, **Sustain**, **Release**; the amp envelope also has **Velocity**.
- **Output:** **Notes** (how many notes sound at once, each a whole cluster), **Stereo**, **Tuning**, **Level** and **Pan**. A keyboard at the bottom plays the card.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. |
| **Mod** | modulation in (purple) | A modulator can move 19 controls (beating, drifting, FM, ring, metal, noise, friction, filter, envelope times and more). |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Dissonant Cluster** and **Speakers**. Click the preset **Hornet Nest** and hold a low chord. Then set **Structure** to **tritone** with **Voices** 3, raise **Friction › Depth** and turn **Cutoff** down slowly for a threatening drone.

**Tunes.** Pack **Dissonant Cluster Styles**: 60 tunes in 9 folders (Industrial, Horror & Cinematic, Dark Ambient, Techno, Experimental, Sound Design, Noise, Dubstep, Drone), file [`dissonant-cluster-styles.patchkamer-tunes.json`](../../tunes/dissonant-cluster-styles.patchkamer-tunes.json). A few names: **Rust Bass**, **Dread Pad**, **Abyss Drone**, **Quarter Tone Choir**, **Laser Zap**.

**Tips and limits.**

- Low notes with a close cluster come out as a humming beat rather than as a pitch; try 2 or 3 voices, **seventh and ninth** or **tritone** for basses.
- The tritone structure plays at most 5 voices.
- With **Guard** off the cluster is not corrected and may sound consonant.
- It has no arpeggiator of its own; keep **Notes** low for fast sequences from outside.

### Patchbay Synth

**What it is for.** A semi-modular synth with a patch panel: inputs, outputs and sliders that link modules. Every input already has a built-in source (marked **←**); a cable replaces it. Three VCOs, a noise generator, a ring modulator, a four-pole 24 dB lowpass filter (it can self-oscillate with high resonance), an ADSR and an AR envelope, sample & hold with its own clock, an envelope follower, a preamp for outside audio, two inverters, a lag, an electronic switch and a keyboard from C2 to C6. It has no sequencer or arpeggiator.

![The Patchbay Synth card](../images/en/synths/patchbay-synth.png)

**Controls.**

- **Sound buttons** at the top: Default Patch, Fat Bass, S/H Melody, Ring Bell, Wind, Whistling Filter, Gliding Lag, Vibrato via VCO-3 and **Unplug all cables**. Each is a set of cables and knobs you can start from.
- **Panels** (left to right): **Preamp**, **Envelope follower**, **Ring modulator**, **Keyboard**, **VCO-1**, **VCO-2**, **VCO-3** (each with a **range** of **Audio** or **LF**, **Frequency**, **Fine** and amounts for frequency modulation), **Noise**, **Voltage processors** (two inverters and a lag), **Filter**, **Envelopes**, **Sample & hold and clock**, **VCA**, **Electronic switch**, **Mixer and output**.
- **Cables.** Drag from an **output** (orange dot) to an **input** (teal dot). An input can have one cable. Click a cable to unplug it; drag from an occupied input to move the cable. **Unplug all cables** removes all of them.
- **Keyboard panel:** **KBD CV** output, **Portamento** (with **Glide time**), pitch spacing (**1 V/octave** by default, adjustable) and a **Tuning** offset.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Preamp in** | audio in (teal) | Outside sound for the preamp. |
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer (the keys on the card also work). |
| **Mod** | modulation in (purple) | A modulator can move the knobs. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.**

1. Place **Keys / MIDI**, **Patchbay Synth** and **Speakers**; connect the notes to **Notes** and **Out** to **In**. Click **Default Patch** and play.
2. Click **Fat Bass** or **Ring Bell** and compare which cables are plugged in.
3. Make a glide: drag a cable from the **KBD CV** output to the **In** of the lag (the last **In** above **Lag time**) and a second cable from the **Lag** output to the **KBD** input of **VCO-1**. Turn **Lag time** to taste.

**Tunes.** Pack **Patchbay Synth Styles**: 89 tunes in 15 folders (Techno, Acid, House, Synthwave, Ambient, Cinematic, Electro, Hip-hop, Dub, Funk & Disco, Trance, Chiptune, Drum & Bass, Generative, FX), file [`patchbay-synth-styles.patchkamer-tunes.json`](../../tunes/patchbay-synth-styles.patchkamer-tunes.json). A tune holds all knobs and the list of cables. A few names: **Rolling Sub**, **Squelch Bass**, **S/H Bleeps**, **Random Bells**, **Laser Zap**, **Siren**.

**Tips and limits.**

- **The VCA decides what you hear.** Its gain is **Initial** plus the linear input times its amount plus the exponential input (the **ADSR** by default). If all three are zero, the VCA gives nothing and the synth is silent.
- **Volume** (left and right) is the real level control; the output is limited hard.
- Pitch and filter follow 1 volt per octave. The LF range decouples the keyboard from a VCO.
- The envelopes take their gate from the keyboard and host notes; with **Gate source** on **Gate in** the gate comes from the external input (the clock by default).

## Drone and texture synths

Eight synths for long, slowly changing sounds: drones, pads, soundscapes and textures. Most of them keep sounding without anyone playing; some are played with notes as well. Each has its own way to start, so read the first lines of its section.

| Synth | Plays by itself | Played with notes | Audio input |
|---|---|---|---|
| [Layered Landscape](#layered-landscape) | Yes: four layers hold notes or run a pattern | Yes (**Note input** picks the layer) | **Stereo texture / recording** (for the Noise layer) |
| [Biotope](#biotope) | Yes: eight sound layers | No (triggers only) | No |
| [Drone Synth](#drone-synth) | Yes: one continuous drone | Notes set the root | No |
| [Celestial Mechanics](#celestial-mechanics) | No | Yes: every note becomes a planet | No |
| [Paradox](#paradox) | Yes (**Drone** and **Organism**) | Yes (**Playable**) | **Feed** |
| [Foundry](#foundry) | Yes (**Drone / transport**) | Yes (**Keyboard / sequencer**) | **External material** |
| [Mist](#mist) | Yes (**Drone + notes**) | Yes | No |
| [Grain Cloud](#grain-cloud) | Yes (**Cloud (drone)**) | Yes | **In (source)** |

How they start (the details are in each section):

- **Layered Landscape:** **Start landscape** (also works without the clock).
- **Biotope:** plays as soon as **On** is checked; with **Follow start/stop** only while the clock runs.
- **Drone Synth:** silent until you press **Start**, unless **On stop** is set to **keeps sounding**.
- **Paradox:** the **Alive** checkbox, and **Behavior** (**Playable**, **Drone** or **Organism**).
- **Foundry:** **Start / stop drone**, or **Keyboard / sequencer** for notes.
- **Mist:** **Start drone**, or press **Start** for chords and melody.
- **Grain Cloud:** the **Cloud (drone)** button, or notes.
- **Celestial Mechanics:** needs notes, or the buttons under the star field.

The sound of these synths changes all the time. A tune is a starting point, not a recording; some synths use chance, so the same tune can sound a little different each time.

### Layered Landscape

**What it is for.** A four-layer ambient instrument. Four layers sound together and make one "landscape": **Drone** (low, slow, an octave below the root), **Pad** (the main sound, on the root), **Atmos** (high and light, an octave above) and **Noise** (a texture such as waves, rain or wind, at a fixed pitch). Each layer has its own wave family, filter, two slow LFOs, pan, a send to a shared room and a send to a shimmer (octave up). After that come a stereo room with nine characters and a master effect. Each layer can hold notes, run its own pattern, play notes from outside, or be off.

![The Layered Landscape card](../images/en/synths/layered-landscape.png)

**Controls.** The card is long; from top to bottom:

- **Top row:** **Landscape** (a list of twelve starting landscapes), **Start landscape**, **Stop sources** and **Silence**, **Root note (MIDI)**, **Master volume**, **Sound character** (**Soft / flowing** or **Original / bright**) and **Note input** (which layer the **Notes to chosen layer** port feeds).
- **Four layer blocks** (**Drone · edit**, **Pad · edit**, **Atmos · edit**, **Noise · edit**): the button chooses the layer you edit below. Each block has **Level**, **Pan**, **Mute** and **Solo**.
- **XY pad** with **X axis** and **Y axis**: drag the dot to move two controls at once. **Save A** and **Save B** store a sound; **Morph A ↔ B** blends between them. A/B stores the numeric controls only; structures, wave choices and patterns do not change with it.
- **Sound and motion** of the chosen layer: **Source control** (**Drone / Hold**, **Own sequencer**, **External notes** or **Off**), **Chord**, **Filter** (**Low-pass** and others), **Structure** (six ways the oscillators work together, for example **Pad I · triple**) and **Wave family** (16 families). Under them: **Wave morph**, **Filter**, **Resonance**, **Motion depth**, **LFO 1**, **LFO 2**, **Oscillator spread**, **Attack**, **Release**, **Transpose**, **Room send** and **Shimmer send**. The Noise layer has a **Texture** list instead of a wave family.
- **Sequencer** of the chosen layer: **Note division**, **Steps** (1 to 64), the step buttons, and per step **Note offset**, **Velocity / rest** (0 is a rest) and **Length in steps**. **Motion recording**, **Write motion to step** and **Clear motion** store movements of the controls per step. The pattern only plays when **Source control** is **Own sequencer**.
- **Room and master effect:** **Room** (small, large or infinite, each dark, neutral or bright), **Freeze** (holds the room: no new sound goes into it), **Master effect** (for example **Stereo chorus**, **Tape echo** and **Reverse echo**), **Room size**, **Room damping**, **Effect mix** and **Effect time / character**.
- **Visualization** and the save buttons: **Save landscape (.json)** writes the whole landscape to a file, and the file chooser below it opens one again. The file format is `patchkamer-landscape-1`. This is a separate file from a tune.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Stereo texture / recording** | audio in (teal) | Sound for the Noise layer (an outside texture or a recording). |
| **Notes to chosen layer** | notes in (orange) | Notes for the layer chosen in **Note input**. |
| **Drone notes**, **Pad notes**, **Atmos notes**, **Noise notes** | notes in (orange) | Notes straight to one layer. |
| **Mod** | modulation in (purple) | A modulator can move the controls. |
| **Stereo landscape** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Layered Landscape** and **Speakers**, connect **Stereo landscape** to **In**. Choose a tune, then click **Start landscape**: all layers on **Drone / Hold** start sounding. Turn **Master volume** and the **Level** of a layer to taste. For a moving line, set the **Pad** layer's **Source control** to **Own sequencer**, press **Start** and edit the steps.

**Tunes.** Pack **Layered Landscape Styles**: 71 tunes in 11 folders (Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Nature, Space, Drone, Lo-fi, Minimal, Industrial), file [`layered-landscape-styles.patchkamer-tunes.json`](../../tunes/layered-landscape-styles.patchkamer-tunes.json). A few names: **Morning Haze**, **Floating Garden**, **Sunken Hall**, **Black Tide**, **Epic Swell**. In the pack, 61 tunes hold their notes with the Pad layer, 7 tunes run a pattern on the Pad layer and 3 tunes are played with notes on the Pad layer. A tune holds the sound, not an own sample or recording.

**Tips and limits.**

- The landscape sounds after **Start landscape** or when the clock starts; a tune alone does not make sound until then.
- Choosing another tune while the landscape sounds stops the old sound and starts the new one at once.
- A layer on **Mute**, or all four layers at level 0, is silent.
- With **Freeze** on, no new sound goes into the room.
- A landscape file has the name of the format in it; only files made by Layered Landscape open.
- An own sample or recording for the Noise layer is not part of a tune.

### Biotope

**What it is for.** A synth for environments that makes its own sounds without samples: eight layers (**Rain**, **Drops**, **Bubbles**, **Wind**, **Footsteps**, **Fireplace**, **Sea**, **Creaks**) that together make a soundscape. It has no keyboard and no notes: it plays as soon as it is on and changes slowly through chance and slow waves. The low wind characters (**Red planet**, **Gas giant**, **Cosmic imagination**), the deep bubbles and the ship's hull creaks make dark, slowly changing drones.

![The Biotope card](../images/en/synths/biotope.png)

**Controls.**

- **Top:** a list **Choose a soundscape…** (starting settings), **All layers off**, the **On** checkbox and **Follow start/stop** (only sound while the clock runs).
- **Output**, **Space** (stereo reverb) and **Width** (0% is mono).
- **Eight layer blocks.** Each has a **Character** list (four to seven kinds per layer), **Volume** (0% is off), **Density** (how active: drops, bubbles, crackles per second; for rain, wind and sea also how heavy the noise is), **Tone** (dark and dull to bright and sharp) and **Motion** (variation in stereo, pitch and timing; for wind the speed of the gusts, for sea the depth of the swell).
- **Footsteps** also has **Steps/min** and **Clock** (**Free tempo**, **Triggers only**, or every 1/16, 1/8, 1/4, 1/2 or bar of the clock). It is the only layer with a tempo of its own.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Triggers / CC** | notes in (orange) | Triggers play one event of the layers Drops, Bubbles, Footsteps, Fireplace or Creaks; CC messages move the controls. |
| **Mod** | modulation in (purple) | A modulator can move the controls. |
| **Stereo out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Biotope** and **Speakers**, connect **Stereo out** to **In**. Choose a tune such as **Morning Forest**: it plays at once. Turn up **Volume** of **Rain** and turn **Tone** of **Wind** down for something darker. For a drone, set **Wind** to **Red planet** or **Gas giant**, **Tone** low and **Space** high.

**Tunes.** Pack **Biotope Styles**: 86 tunes in 13 folders (Nature, Weather, Water, Ambient, Meditation, Sleep, Cinematic, Sci-Fi, Dark Ambient, Lo-fi, Field Recording, Interiors, Rhythmic), file [`biotope-styles.patchkamer-tunes.json`](../../tunes/biotope-styles.patchkamer-tunes.json). A few names: **Morning Forest**, **Meadow Breeze**, **Light Drizzle**, **Steady Rain**, **Slow March**.

**Tips and limits.**

- With **Follow start/stop** on, or **Clock** on a clock setting, you hear nothing until the clock runs.
- With **Clock** on **Triggers only** the footsteps are silent until a trigger arrives.
- Drops, footsteps, fireplace and creaks are single events and sound soft next to rain, wind and sea; give them a higher **Volume**, or add a soft bed.
- The noise is random: a tune is a setting, so it sounds a little different every time.
- At most 96 voices at once; many layers at full level and full **Density** can fill them.

### Drone Synth

**What it is for.** A drone and ambient synth. The sound is one continuous tone built from a first drone layer (three detuned oscillators and a sine sub an octave lower), an optional second layer at an interval of your choice, filtered noise, a resonant lowpass filter with a slow LFO, distortion, a delay and a reverb. On top come random events (siren, metal hit, radio static, heartbeat) and a 16-step root sequencer. It does not play chords or notes with an envelope: what changes is the **root**.

![The Drone Synth card](../images/en/synths/drone-synth.png)

**Controls.**

- **Starting sounds** at the top: **ABANDONED FACTORY**, **VENTILATION SHAFT**, **AIR RAID**, **DEAD STATION**, **UNDERGROUND**, **COLD DAWN** and **RANDOM**. They set the knobs once.
- **Drone:** **on**, **ROOT** (in Hz), **WAVEFORM**, **TUNING**, **DETUNE**, **SUB OCTAVE** and **LEVEL**.
- **Drone B:** **on**, **WAVEFORM**, **INTERVAL** (in semitones; +7 is a fifth, +12 an octave), **DETUNE** and **LEVEL**.
- **Noise:** **on**, **COLOUR** (brown, pink or white), **BAND FILTER**, **RESONANCE** and **LEVEL**.
- **Filter & LFO:** **CUTOFF**, **RESONANCE**, **LFO RATE**, **LFO DEPTH** and **PITCH WOBBLE**.
- **Space & decay:** **DISTORTION**, **DELAY TIME**, **DELAY FEEDBACK**, **REVERB SIZE** and **REVERB MIX**.
- **Output:** **LEVEL** and **ON STOP** (**silent** or **keeps sounding**).
- **Events:** **TYPE** (**None**, **Siren**, **Metal hit**, **Radio static** or **Heartbeat**), **INTERVAL** and **LEVEL**. They fire at random around the interval while the clock runs.
- **Play:** eight buttons (A1 to B♭2) that set the root at once.
- **Root sequencer:** **on**, **SETS** (1 to 16 sets of 16 steps), **GLIDE** and **GATE**. The grid has eight fixed notes (A1, C2, D2, E♭2, F2, G2, A2, B♭2); one note per step, an empty step keeps the previous pitch. **RISING**, **PULSE** and **RANDOM** fill the set, **COPY BAR TO ALL** copies it and **CLEAR** empties it. With **GATE** above 0% only the first drone layer pulses.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Incoming notes also set the root. |
| **CC** | notes in (orange) | Control changes for the knobs. |
| **Mod** | modulation in (purple) | A modulator can move the controls. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Drone Synth** and **Speakers**. Click **ABANDONED FACTORY**, set **ON STOP** to **keeps sounding** and press a button under **Play**. For a rhythm: switch **on** in the root sequencer, put notes on a few steps, set **GATE** to 50% and press **Start**.

**Tunes.** Pack **Drone Synth Styles**: 66 tunes in 10 folders (Drone, Ambient, Dark Ambient, Techno, Industrial, Cinematic, Meditation, Sci-Fi, Doom, Minimal), file [`drone-synth-styles.patchkamer-tunes.json`](../../tunes/drone-synth-styles.patchkamer-tunes.json). A few names: **Root Fifth Pad**, **Pure Sine Floor**, **Glass Pad**, **Floating Fifths**, **Crypt Choir**. In the pack, 20 tunes use the root sequencer and all 66 are set to keep sounding.

**Tips and limits.**

- The output is closed until the clock runs, or until **ON STOP** is on **keeps sounding**. Events and the sequencer only run along with the clock.
- The sequencer has only the eight fixed notes; for other roots use **ROOT** and a flat drone.
- **GATE** has no effect without notes in the sequencer.
- With very high **RESONANCE**, a very low **CUTOFF** and strong **LFO DEPTH**, or a long delay with very high feedback, the sound can break up; a guard replaces the filter, delay and reverb when that happens.
- Many layers at full level together can be louder than 1; keep **LEVEL** (Output) in check.

### Celestial Mechanics

**What it is for.** A gravity synth. Every note that comes in becomes a planet that circles a sun, and the physics of the system makes the sound. The pitch is the note, shifted by the Doppler effect (towards you is higher, away is lower). Planets that approach each other modulate each other and can collide and merge. A planet that grazes the sun picks up a "solar flare" of noise. There is no envelope, no filter and no fixed waveform.

![The Celestial Mechanics card](../images/en/synths/celestial-mechanics.png)

**Controls.**

- **Top:** **Universe** (seven starting universes, for example **Solar System** and **Glass Spheres**), **Scale (slinging)**, **Root note** (for planets you sling yourself and for the Big Bang) and **Lifetime** (**Forever (until swallowed)** and shorter choices).
- **Star field.** Drag in it to sling a planet away. Under it: **Big Bang** (five planets from the scale), **Comet** (a comet falls in), **Black hole: swallow everything** and **Silence**. A line shows how many celestial bodies are in space.
- **Orbital mechanics:** **Gravity**, **Orbit size**, **Eccentricity** and **Time**.
- **Space-time:** **Black hole**, **Speed of light** (low = big Doppler bends), **Interaction** (how much planets influence each other) and **Grain**.
- **Celestial phenomena:** **Solar flares**, **Pulsar** (ticks on the clock) and **Comets** (how often one falls in).
- **Sound:** **Ether (reverb)**, **Echo from the deep** and **Output**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer; each note makes a planet. |
| **Mod** | modulation in (purple) | A modulator can move 14 controls, for example **Gravity** or **Time**. |
| **Out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Celestial Mechanics** and **Speakers**. Hold one or two long notes with a wide interval. Slowly raise **Black hole**: the orbits shrink, the pitches sink and the planets are swallowed. Lower **Speed of light** and every orbit becomes a wailing Doppler siren.

**Tunes.** Pack **Celestial Mechanics Styles**: 74 tunes in 11 folders (Space, Cinematic, Sci-Fi, Ambient, Dark Ambient, Experimental, Sound Design, Synthwave, Trance, Horror, Drone), file [`celestial-mechanics-styles.patchkamer-tunes.json`](../../tunes/celestial-mechanics-styles.patchkamer-tunes.json). A few names: **Orbit Drift**, **Deep Field**, **Tension Bed**, **Doppler Siren**, **Warp Core**.

**Tips and limits.**

- At most 14 planets exist at once; a new note pushes the oldest one away.
- The pitch of a note you play is exact; **Scale (slinging)** only applies to planets you sling yourself and to the Big Bang.
- A note-off removes its planet at once, even with **Lifetime** on forever.
- **Pulsar** and **Echo from the deep** follow the tempo of the clock; without the clock the pulsar does nothing.
- A note comes in softly (about 0.1 s), so the synth is not suited to percussive sounds.

### Paradox

**What it is for.** An experimental synth that moves by itself. Every voice is a sine synthesis with mutual modulation, a wavefolder, a lowpass filter and a string-like feedback loop. A chaos system (Lorenz) lets pitch and tone drift slowly. A cellular automaton can invent notes on its own (the "organism"). A granular memory plays pieces of its own past back, backwards, standing still or faster. For drones, textures, glitch, sound design and unusual playable sounds. It has no sequencer or pattern.

![The Paradox card](../images/en/synths/paradox.png)

**Controls.**

- **Top:** a list **Choose a universe…** (starting settings), **Anatomy** (the basic sound of the voices: **Plasma**, **Glass flesh**, **Machine choir**, **Swarm**, **Fault line**, **Time leak**) and **Behavior** (**Playable**: only outside notes sound; **Drone**: one voice keeps sounding on the root, outside notes sound on top; **Organism**: the automaton plays notes itself around the root).
- **Alive** (off = silent), **Follow Start/Stop** (only sound while the clock runs) and **Clock** with a division list (the automaton follows the tempo of the studio instead of **Cell rate**).
- **Display** with the Lorenz orbit, the automaton and the live audio. Buttons: **Mutate** (moves most knobs a bit at random), **Cell division!** (triggers one event of the automaton), **Fold time** (turns **Time direction** around), **Freeze memory** and **PANIC / silence**.
- **Knobs:** **Matter**, **Mutation**, **Friction**, **Fold**, **Fracture** (bit crusher), **Memory**, **Time direction** (0% backwards, around 50% almost standing still, 100% faster), **Grain size**, **Space**, **Orbit** (stereo width), **Life** (speed of the chaos), **Population** (how many notes the automaton plays), **Feed** (how much of the audio input goes through the voices), **Cell rate**, **Root** (a MIDI note), **Birth** (attack), **Decay** and **Output**.
- A small keyboard of 13 keys at the bottom plays the card from the root.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Feed** | audio in (teal) | Sound that goes through the voices and the memory (see **Feed**). |
| **Notes / CC** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. A trigger makes one cell division. |
| **Mod** | modulation in (purple) | A modulator can move 18 controls. |
| **Escape** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Paradox** and **Speakers**. Choose the tune **Sub Cathedral** (it sets **Behavior** to **Drone**): it keeps sounding. Turn **Time direction** back to hear the memory play backwards. For a generative rhythm, choose **Organism**, check **Clock**, pick a division and press **Start**.

**Tunes.** Pack **Paradox Styles**: 70 tunes in 10 folders (Drone, Ambient, Dark Ambient, Cinematic, Sci-Fi, Glitch, Industrial, Experimental, Sound Design, Noise), file [`paradox-styles.patchkamer-tunes.json`](../../tunes/paradox-styles.patchkamer-tunes.json). A few names: **Sub Cathedral**, **Choir of Pipes**, **Frozen Lake**, **Morning Glass**, **Abandoned Hall**. In the pack, 37 tunes are **Playable**, 19 **Organism** and 14 **Drone**.

**Tips and limits.**

- At most 6 voices; when all are busy new notes are skipped. A tune with **Drone** always uses one voice.
- The sound is not deterministic: voices get a random pan, detune and phase, so the same note never sounds exactly the same twice.
- Freezing the memory only lasts this session; its content is not stored in a tune.
- **Follow Start/Stop** on means silence without the clock.
- **Mutation**, **Life** and **Fold** all above 90% give the chaotic extreme: noise with pitch jumps.
- The output is limited softly, so it does not clip, but the level differs per setting; adjust **Output** per sound.

### Foundry

**What it is for.** An industrial sound sculptor, mono. The sound runs in a fixed order: an FM chain of three oscillators, a ring modulator, noise and optional outside sound; four resonators (a metal "body" made of feedback delays) in four materials (steel, glass, concrete, cable); two parallel distortions (overdrive and wavefolder); an output filter; an envelope; and a room with a compressor. A slow motion (LFO on pitch, filter and ring modulator) and an irregular drift keep it moving. It has no sequencer or arpeggiator of its own.

![The Foundry card](../images/en/synths/foundry.png)

**Controls.**

- **Top:** **Sound** (twelve starting sounds, for example **Steel Mill**, plus **Custom sculpture**), **Play mode** (**Drone / transport** or **Keyboard / sequencer**), **Start / stop drone**, **Metal strike** (switches to notes and plays one note), **All off** and **Mutate sound** (changes the sound, not the output level).
- **XY pad** with **X axis** and **Y axis**. **Save A**, **Save B**, **Recall A**, **Recall B** and **Morph A ↔ B** keep two sounds and blend between them.
- **Material** (**Steel**, **Glass**, **Concrete**, **Cable**), **Source** (the waveform of the main oscillator) and **Scope** (display only).
- **Sources & frequencies:** **Drone frequency**, **Transpose**, **FM amount**, **FM ratio** (whole numbers sound harmonic, other values metallic), **Ring modulation**, **Ring frequency**, **Noise / scrape** and **External material**.
- **Material & distortion:** **Resonator mix**, **Body frequency**, **Damping / brightness**, **Roughness / drive**, **Wavefold mix**, **Output filter** and **Filter resonance**.
- **Motion & space:** **Cyclic motion**, **Motion rate**, **Irregular drift**, **Space / echo** and **Stereo width**.
- **Envelope & level:** **Attack**, **Decay**, **Sustain**, **Release** and **Output**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **External material** | audio in (teal) | Outside sound that goes through the chain; raise the knob **External material**. |
| **Keyboard / notes** | notes in (orange) | Notes in the play mode **Keyboard / sequencer**. Monophonic: a new note takes over. |
| **Mod** | modulation in (purple) | A modulator can move the controls; it also works without the clock. |
| **Stereo sculpture** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Foundry** and **Speakers**. Choose the tune **Press Line Bass** (set to **Keyboard / sequencer**) and play low notes. For a drone: choose **Drone / transport**, press **Start / stop drone**, and drag in the XY pad to change **FM amount** and **Wavefold mix**.

**Tunes.** Pack **Foundry Styles**: 69 tunes in 11 folders (Industrial, Techno, Dark Ambient, Cinematic, Sound Design, Horror, Experimental, Noise, Drone, Metal Percussion, Electro), file [`foundry-styles.patchkamer-tunes.json`](../../tunes/foundry-styles.patchkamer-tunes.json). A few names: **Press Line Bass**, **Rivet Lead**, **Warehouse Sub**, **Rolling Rumble**, **Cathedral Drone**. In the pack, 50 tunes are set to **Keyboard / sequencer** and 19 to **Drone / transport**.

**Tips and limits.**

- A drone only sounds when the clock runs or **Start / stop drone** is on. For a keyboard, a sound must be on **Keyboard / sequencer**.
- The resonators sit in a feedback loop; the highest tuned **Body frequency** is about 375 Hz. Use it as a colour rather than a tuned pitch.
- **Resonator mix** above about 94% gives no longer decay.
- **External material** only has an effect when something is connected to the input.
- A guard blocks the input while it carries invalid or absurdly large values and rebuilds the chain after them.

### Mist

**What it is for.** A drone and ambient synth that runs along with the clock of the studio. Eight oscillators (alternately sine and triangle, slightly detuned) make a standing chord that fades in and out slowly. Under it lies brown noise through a band filter, like wind. Everything goes through a tone filter with a slow LFO, a long reverb and two stereo echoes. As long as the clock runs and **Play** is on **Drone + notes**, the chords change by themselves and an automatic melody plays. It also plays outside notes, up to twelve at once. It is meant as a bed under a song.

![The Mist card](../images/en/synths/mist.png)

**Controls.**

- **Soundscape** (14 starting sounds, plus **Custom sound**), **Play** (**Drone + notes** or **Notes only**: the drone is silent and only your notes sound) and **Chord** (**Open fifths**, **Minor 7**, **Major 7**, **Sus / floating**, **Open add9**, **Minor 9**, **Major 9** or **Major 6**).
- **Melody** (level of the automatic melody) and **Density** (how often it plays a note).
- **Warmth**, **Detune**, **Root** (the drone and the automatic melody; outside notes keep their own pitch) and **Level**.
- **Brightness** (cutoff of the tone filter), **Wind**, **Motion**, **Reverb**, **Echo**, **Attack**, **Release** and **Evolve** (after how many bars the chord changes).
- **START DRONE**: plays a standing chord without the clock.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes / CC** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer; control changes for the knobs. |
| **Mod** | modulation in (purple) | A modulator can move 13 controls. |
| **Stereo out** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Mist** and **Speakers**. Choose the tune **Slow Horizon** and press **Start**: the chord drifts and the melody plays. Without the clock, press **START DRONE**. For soft bells: choose **Notes only** and play notes from **Keys / MIDI**.

**Tunes.** Pack **Mist Styles**: 62 tunes in 11 folders (Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Experimental, Lo-fi, Drone, Sound Design, New Age, Chillout), file [`mist-styles.patchkamer-tunes.json`](../../tunes/mist-styles.patchkamer-tunes.json). A few names: **Slow Horizon**, **Open Fields**, **Sub Cave**, **Black Cathedral**, **Epic Rise**. In the pack, 54 tunes are **Drone + notes** and 8 are **Notes only**.

**Tips and limits.**

- The drone only sounds when the clock runs (or after **START DRONE**) and **Play** is **Drone + notes**. When the clock stops, everything fades out over **Release**.
- Chord changes and the melody are fixed and repeat: same tune and same clock give the same result.
- A note is at least 0.2 s long to come up and sounds at least 1 s after: Mist is not suited to plucks or stabs.
- At most twelve notes at once, the automatic melody included; a thirteenth is ignored.
- A very long **Release** (24 s) with many notes fills the voices.

### Grain Cloud

**What it is for.** A granular synth and a granular effect in one. It cuts sound into grains of 5 ms to 1 s and scatters them again, each with its own pitch, direction, place in the source and stereo position. There are three sources: **Wave (built-in)** (a one-second sound that loops endlessly; the card is then a synth and sounds without an input), **Live (input)** (whatever arrives on **In (source)**, through a memory of 8 seconds; the card is then an effect and is silent without a cable) and **Frozen recording** (the memory stands still and you play around in it). There is no sequencer or arpeggiator.

![The Grain Cloud card](../images/en/synths/grain-cloud.png)

**Controls.**

- **Soundscape** (starting settings), **Source** (**Live (input)**, **Frozen recording** or **Wave (built-in)**), **Wave** (**Choir (aah)**, **Organ**, **Sawtooth**, **Glass**, **Noise**, **Sine**; only for the built-in source) and **Pitch jumps** (**Free**, **Octaves**, **Fifths**, **Octave + fifth**).
- Buttons: **Cloud (drone)** (an endless cloud at the original pitch, also without notes), **Freeze** (switches between live and frozen), **Record 4 s** (records 4 seconds from the input and then freezes) and **Test note**.
- **Where and how often:** **Position**, **Spread**, **Scan** (the position moves through the source by itself), **Grain size** (in ms) and **Density** (grains per second).
- **Every grain:** **Pitch**, **Pitch spread**, **Reverse** (chance that a grain plays backwards), **Width** and **Window** (0% soft, 100% angular like a click).
- **Cloud and mix:** **Feedback** (the cloud goes back into the recording; only for Live), **Mix**, **Attack**, **Release** and **Output**.

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **In (source)** | audio in (teal) | The sound for the sources **Live (input)** and **Frozen recording**. Without a cable **Live (input)** is silent. |
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer. A note shifts the pitch of the grains (C4 is the original pitch; with the built-in source it is A3). |
| **Mod** | modulation in (purple) | A modulator can move 15 controls, for example **Position**. |
| **Stereo** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** As a synth: place **Grain Cloud** and **Speakers**, choose the tune **Choir Mist** (source **Wave (built-in)**): a choir cloud sounds. As an effect: connect a synth to **In (source)**, choose the source **Live (input)**, set **Mix** around 50% and play: you hear stutters, scatterings and reverse echoes of what you send in. Give it one or two seconds to fill the memory.

**Tunes.** Pack **Grain Cloud Styles**: 61 tunes in 10 folders (Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Experimental, Glitch/IDM, Lo-fi, Drone, Sound Design), file [`grain-cloud-styles.patchkamer-tunes.json`](../../tunes/grain-cloud-styles.patchkamer-tunes.json). A few names: **Choir Mist**, **Glass Shimmer**, **Sunken Choir**, **Cave Breath**, **Epic Choir Rise**. Of the 61 tunes, 54 use the built-in source and sound on their own; 7 use **Live (input)** and work as effects, silent without a cable: **Stutter Cloud**, **Micro Slicer**, **Pitch Scatter**, **Reverse Chop**, **Warped Cassette**, **Freeze Echo** and **Smear Cloud**.

**Tips and limits.**

- At most 8 voices (the cloud counts as one) and 160 grains at once.
- A frozen recording is a recording of this session and is not part of a tune: a tune never contains a sample.
- With **Live (input)** the grains come from the memory of the last 8 seconds; test with a real signal (a short pluck, a rhythm or chords), because silence hides most effects.
- Keep **Feedback** under about 60%: higher values can turn the recording into an endlessly screaming cloud.
- For melodies: use a low **Pitch spread** (under 1 semitone) or **Octaves** or **Fifths**, or the notes sound out of tune.
- With several notes together, keep **Output** under about 60%.

## Voice

Formant Singer is the one synth in Patchkamer that sings. It is described here on its own, because it works differently from the others: it reads a text and every note you play sings the next syllable of it.

### Formant Singer

**What it is for.** A synth that sings a text. You type the lyrics on the card and play notes from **Keys / MIDI** or a sequencer. Every note sings the **next syllable** of the text, at the pitch, the length and the velocity of that note. It makes no sound by itself and has no sequencer or clock: it only sings the notes it receives (or the **Test** button). It works with filters on a noise and tone source (formant synthesis), so there is no network and no recorded voice. Use it for a lead voice, a choir, a pad of vowels, a whispered line or a robot voice.

![The Formant Singer card](../images/en/synths/formant-singer.png)

**Controls.** Double-click a slider to go back to its starting value. The card follows this order:

- **Lyrics** (the text field), **Language** (**English**, **Dutch** or **Phonemes**: how the text is read), **Voice** (**Soprano**, **Alto**, **Tenor**, **Bass**, **Child**, **Whisper** or **Custom**) and **Mode** (**Mono (legato)** or **Poly**).
- **End of lyrics:** what happens after the last syllable: **Loop** (start again), **Hold** (keep singing the last vowel, without consonants) or **Stop** (silent until you press **Restart**).
- **Fixed vowel** and **Vowel:** with **Fixed vowel** on, every note sings the chosen vowel and the text is skipped. **Vowel** is also used when **Lyrics** is empty. The list has 14 vowels, for example **a – spa**, **ae – cat**, **i – see**, **u – moon**, **y – Dutch uur**.
- **Syllables:** the text cut into syllables, with the next one highlighted, and the line **Syllable 1 of 5**. Buttons: **Restart** (start at the first syllable), **Test** (sings the current syllable for a second and stays on it) and **All off** (lets all voices fade out).
- **Voice & source:** **Formant shift** (−12 to +12 semitones: moves the vowel colours, not the pitch; positive is smaller and brighter, negative is larger and darker), **Breath** (noise in the source, 0 to 100%), **Brightness** (how bright the source is), **Choir voices** (1 to 8 singers per note), **Detune** (0 to 50 ct between the singers, only audible with more than one) and **Stereo spread** (width of the singers, and with **Poly** of the notes).
- **Movement:** **Vibrato rate** (3 to 8 Hz), **Vibrato depth** (0 to 100 ct), **Vibrato delay** (0 to 2 s before the vibrato starts), **Glide** (0 to 0.5 s: the pitch glide in **Mono** and the speed at which the vowel colour moves to the next vowel), **Attack** (0.005 to 3 s) and **Release** (0.02 to 6 s).
- **Speech:** **Consonants** (how much of the consonants you hear; 0 sings only vowels) and **Onset length** (longest length of the consonants at the start of a syllable, 5 to 200 ms; consonants at the end get 80% of it).
- **Level:** **Output**.
- At the bottom a spectrum of the output with the first two vowel peaks (F1 and F2) of the last vowel.

**Mode.** In **Mono (legato)** there is one voice. Notes that overlap are tied: the pitch and the vowel glide to the new note. In **Poly** up to 8 notes sound at once; a ninth takes over the oldest note with a short fade. Notes that begin within 30 ms of each other count as one chord and sing the same syllable.

**How the text is split.** Syllables are separated by a space, a hyphen (`-`) or a bar (`|`). A word without `-` or `|` is split automatically by a simple rule (**hello** becomes hel-lo). If you want to be sure, write the split yourself: `ha-lle-lu-ja`.

| Write | Meaning |
|---|---|
| space, `-` or `|` | next syllable |
| `_` or `~` | **melisma**: this note keeps singing the last vowel of the previous syllable, without consonants (`glo_o_o-ri-a`, or `no _ _`) |
| `*` or `.` on its own | **rest**: the note takes a place in the text but sings nothing (`la*la`) |

Punctuation, capital letters and accents are ignored. A syllable without a vowel is sung with a short **uh**; a syllable of only **m** or **n** is a hum that lasts the whole note. A text has at most 2000 characters and 1500 syllables.

**Fixing a word with phonemes.** The spelling rules for English and Dutch are compact and do not cover everything. When a word is sung wrong, set **Language** to **Phonemes** and write the sounds of each syllable directly, one after another without spaces, with `-` between syllables. Sounds are read from left to right, longest code first; put an apostrophe between codes you want to keep apart (`s'h` is **s** and **h**, `n'g` is **n** and **g**). Two vowels with an apostrophe between them make a glide from the first to the second. `_`, `~` and `*` work as above.

| Kind | Codes |
|---|---|
| Vowels | `a` spa, `ae` cat, `e` bed, `ee` Dutch veel, `i` see, `ih` sit, `o` oh, `aw` law, `u` moon, `oo` foot, `y` Dutch uur, `oe` Dutch deur, `uh` cup, `er` her |
| Diphthongs | `ai`, `ei`, `au`, `ou`, `oi`, `ui` |
| Voiceless fricatives | `s`, `sh`, `f`, `th`, `x` (Dutch ch and g), `h` |
| Voiced fricatives | `v`, `z`, `zh`, `dh` |
| Plosives | `p`, `t`, `k`, `b`, `d`, `g` |
| Nasals | `m`, `n`, `ng` |
| Liquids and glides | `l`, `r`, `j`, `w` |
| Combined | `ch` (t + sh), `jh` (d + zh) |

Examples: `ha-lo`, `shaet`, `mm-ou` (a hum, then **ou**).

**Ports.**

| Port | Kind | Use |
|---|---|---|
| **Notes** | notes in (orange) | Notes from **Keys / MIDI** or a sequencer: every note sings the next syllable. A sequencer must send a note length (`dur`), or the note keeps sounding. Control changes move the knobs (not **Choir voices**). |
| **Lyrics / restart** | notes in (orange) | A trigger or note here does a **Restart**: the text starts again at the first syllable. A sequencer can use this to start every phrase on the same words. |
| **Mod** | modulation in (purple) | A modulator can move 14 controls (all number controls except **Choir voices**). |
| **Stereo voice** | audio out (teal) | Connect to **Speakers** or a **Mixer** channel. |

**Example.** Place **Keys / MIDI**, **Formant Singer** and **Speakers** and connect them in that order (notes, then audio). Choose the tune **Clear Alto Lead** (folder Solo Voices) and replace the text with `sing-ing in the rain`: that is five syllables. Press **Restart** and play five notes: each one sings the next syllable; the card shows the current one. With **End of lyrics** on **Loop** the sixth note starts again at **sing**. To let a long note carry a word, write `rain _ _`: the second and third note keep singing the vowel. For a choir, choose **Warm Choir**, which uses **Poly** and **Choir voices** 6, and play chords: a chord sings one syllable.

**Tunes.** Pack **Formant Singer Styles**: 66 tunes in 12 folders (Choir, Solo Voices, Bass Voices, Whisper and Breath, Pads and Ambient, Cinematic, Pop Leads, Robot and FX, Chant, Lullaby, Hymn, Syllable Study), file [`formant-singer-styles.patchkamer-tunes.json`](../../tunes/formant-singer-styles.patchkamer-tunes.json). A few names: **Warm Choir**, **Clear Alto Lead**, **Low Monk**, **Soft Whisper**, **Robot Voice**. Every tune has a short original text of about 1 to 9 syllables, in English, Dutch or phonemes, that fits its style; play a melody with that many notes, or press **Restart** to begin again. Tunes with **Fixed vowel** sing one vowel on every note. The syllable position is not saved in a tune.

**Tips and limits.**

- Give long notes to the vowels and short notes to simple syllables (**la**, **te**, **ko**): on a very short note the consonants are cut off at 35% of the note and long clusters become unclear. For notes shorter than about 80 ms, lower **Consonants**.
- A higher velocity gives a firmer voice and clearer consonants; a low velocity gives a softer voice and softer, shorter consonants.
- **Whisper** has no pitch: the notes only give the rhythm.
- **Attack** longer than the note means the note is over before it comes up.
- **Choir voices** 8 with **Poly** and many notes is heavy for the browser; 3 to 5 is usually enough.
- **Formant shift** at the extremes (±12) makes vowels unrecognisable; that is meant as an effect.
- The voice is robotic by design: vowels are recognisable and consonants are approximations. The spelling-to-sound rules are compact, so use **Phonemes** for words that go wrong. The tune descriptions are based on their settings, not on listening.
- **Stop** and **Hold** at the end of the text: a transport stop does not reset the position. Use **Restart**.

## If it does not work

- **No sound.** Check that audio runs from the synth to **Speakers** (teal cable), that you pressed **Start** and that the volume on Speakers is up. Click anywhere in Patchkamer once: browsers pause audio until you do.
- **A built-in sequencer or arpeggiator is silent.** Acid Baselines (with **internal on**), Acid Stepper (**Control** = **Internal clock / pattern**), Sub Line and Cross Mod Mono (**Control** = **Own pattern** or **Arpeggiator**) only play while the clock runs: press **Start**. An arpeggiator also needs held keys.
- **A synth does not react to a keyboard.** Connect the orange cable to its notes port (**Notes**, **Keyboard / notes**, **External notes**), not to **Mod**. Acid Baselines needs **internal on** off for outside notes, Acid Stepper needs **Control** = **External keyboard / sequencer**, and Sub Line and Cross Mod Mono need **Control** = **Keyboard / external sequencer**. For a MIDI keyboard use **Connect MIDI** on Keys; see the [main manual](../USER-MANUAL_EN.md#13-troubleshooting).
- **A drone or texture synth is silent.** Each one starts in its own way: **Start landscape** (Layered Landscape), **Start / stop drone** (Foundry), **START DRONE** (Mist), **Cloud (drone)** (Grain Cloud), **Alive** (Paradox), **On** (Biotope). Drone Synth, Mist, Foundry (in the play mode **Drone / transport**) and Layered Landscape (with the own sequencer) follow the clock: press **Start**, or check that **Follow start/stop** is off. Grain Cloud on the source **Live (input)** is silent without a cable on **In (source)**, and Celestial Mechanics needs notes.
- **Formant Singer is silent or stops singing.** Check **Level** (**Output**) and that notes arrive on **Notes**. With **End of lyrics** on **Stop** it stays silent after the last syllable until you press **Restart**; with **Voice** on **Whisper** there is no pitch, only breath.
- **Notes keep sounding.** A note without a length keeps sounding on some synths (Bowed Ensemble). Make the sequencer send note lengths, or press **All off** on the card.
- **Supersaw Swarm gate or pump does nothing.** They only work while the clock runs.
- **Quiet or silent.** Check **Level** or **Output**, and the sound controls: a very low cutoff with a low envelope amount is very quiet (Acid Baselines, Basic Mono), Patchbay Synth needs a VCA source (see its tips) and a very short note with a long amplifier attack sounds only faintly on Triple Osc Poly.
- **A filter blows up or goes silent.** Several synths (for example Acid Baselines, Basic Mono and Low Bass) have a guard that checks the filter every 50 ms and replaces it when it derails, so the sound comes back by itself. If it happens again, lower **Resonance**.
- **Crackles.** Open Settings → Audio and choose a larger latency, or a lower quality.
