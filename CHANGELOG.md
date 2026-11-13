# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

## 0.39.0 (2026-11-13)

### Added
- **Clip Arranger 1.38.0**: button **New project** next to the project name. It starts an empty project: one empty scene, one empty section in one song, empty clips and no title; the four standard tracks stay. Undo brings the old project back. State and presets are unchanged.

## 0.38.0 (2026-11-13)

### Added
- **Sax Studio** (synths, 1.0.0): lifelike soprano, alto, tenor and baritone saxophones from real recordings (MTG Solo Saxophones, CC BY 4.0) that are fetched from the internet only after a click on **Load** and are never copied into the repository. Velocity picks subtone, normal or bite, note length picks staccato, overlapping notes play mono-legato; growl, falloff, scoop, vibrato, breath and key noise, and a section mode for funk and soul stabs. With the tune pack **Sax Studio Styles** (36 tunes) and the skin Compact. Measured, not listened to.
- **Brass Studio** (synths, 1.0.0): brass as a physical model (lip reed, bore and bell): trumpet, flugelhorn, trombone, bass trombone, French horn and tuba, a section of one to four players, mutes with wah, scoop, rip, fall, doit, shake and drop, and legato. With the tune pack **Brass Studio Styles** (45 tunes) and the skin Compact. Measured, not listened to.
- **Funk Bass** (synths, 1.0.0): a bass guitar as a physical model for soul, funk and jazz, with dead notes, fingers, pull, slap and pop from velocity and note length, hammer-on and slide, fretless, flatwound or roundwound strings, pickups and 4 or 5 strings. With the tune pack **Funk Bass Styles** (26 tunes), nine **Step Sequencer** patterns (`step-sequencer-funk-bass`) and the skin Compact. Measured, not listened to.

## 0.37.3 (2026-11-13)

### Fixed
- **Iron Acid** (Acid Baselines Classics 1.1.1, tune 1.0.1): filter FM lowered from 0.2 to 0.05. At 0.2 the filter ran away in the offline render (152240 non-finite samples); resonance was not the cause. The guard of the device only runs live, so there it caused a short dropout. Now 0 non-finite samples. Not listened to: the bite may differ slightly.
- **Tune Finder 1.22.2**: index rebuilt, Iron Acid now has a real fingerprint.

## 0.37.2 (2026-11-12)

### Changed
- **Tune Finder 1.22.1**: the index was rebuilt and now holds 2961 tunes of 38 instruments (including Neuro Bass, Drawbar Organ, Brass Section, Squelch Box and the extended packs). The analysis is unchanged; the manual and AGENTS.md have the new counts.
- **Counts and tables corrected:** `tunes/README` and the tunes manual (NL and EN) now state 47 packs with 3365 tunes (36 for synths, 4 for samplers, 7 for drums), with the missing rows Neuro Bass, Squelch Box and Acoustic Drums and the counts and folders of the extended packs; `presets/README` states 57 packs with 2345 presets, with the row for Remix.

### Note
- The tune **Iron Acid** (Acid Baselines Classics) produces 152240 non-finite samples in the offline render when the index is built; the tune predates the extension and was not changed.

## 0.37.1 (2026-11-12)

### Improved
- **Reverb (1.0.2) computes about 1.5 to 2.5 times less.** The eight sines for the modulation of the delay lines are no longer calculated per sample but with a rotation that is restored exactly every block. Measured in Node with the settings from Iron Cathedral and Skyline Ascent: chamber over 2.4 times faster than 1.0.0, hall and plate about 1.5 to 1.6 times. The output deviates by at most one Float32 step (1.5e-8, or -156 dBFS), which is inaudible. Not listened to.

## 0.37.0 (2026-11-12)

### Added
- **Funk song Sunday Pocket** in `songs/funk/` (104 BPM, swing 0.12, E dorian, 104 bars): Acoustic Drums with ghost snares, choked hi-hats and rimshots, Drawbar Organ with a rotary that moves from stop to slow and fast per section, bass and guitar, Stage Keys and Brass Section, Mixer and Master Chain. The drums need the kit download ("Load kit" on Acoustic Drums, about 31 MB); without that kit the song plays without drums. Not listened to. Section in `songs/styles/funk-disco.md` and rows in both songs READMEs.

## 0.36.2 (2026-11-12)

### Improved
- **Drum Kit (1.19.3): lighter page.** The marker for the current step on the step buttons was updated every animation frame on all buttons of all channels; it now only updates when the step changes. In a main-thread measurement the drawing time of Drum Kit dropped from about 0.2 to 0.03 s per 6 s. Sound, state and appearance are unchanged.

## 0.36.1 (2026-11-12)

### Fixed
- **Stutter and Transient Shaper now sit in a subcategory of Effects.** They were missing from the library layout and so stood loose at the top of Effects, above the subcategories. Stutter is now under Time & space, Transient Shaper under Dynamics.

## 0.36.0 (2026-11-12)

### Added
- **Acoustic Drums** (drums, 1.0.0): a sampled acoustic drum kit for funk, soul and jazz with real snares, hi-hats and cymbals. The recordings (a freely licensed jazz kit, CC0) are loaded through a link after a click and never copied into the repo; source, licence and download size are shown on the card before the click (sets Funk and soul, Funk and soul compact and Jazz, 15 to 45 MB per microphone). Velocity layers with crossfade, round robin, automatic ghost notes and rimshots, side stick, flam, buzz, snares on/off, tuning and damping, hi-hat with closed, pedal, half, open and splash and choking without a pop, ride with bell, crash, toms, microphone mix, separate outputs and the same clip and lane coupling as Drum Kit. Pack `acoustic-drums-styles` with 40 voicings. Not listened to.
- **Drawbar Organ** (synths, 1.0.0): a drawbar organ with a shared bank of 91 tonewheel generators (equal tempered, with octave foldback and crosstalk), two manuals and bass pedals with split points, key click, percussion, vibrato and chorus, a rotary speaker (stop, slow, fast with ramp, Doppler and two microphones), preamp with spring reverb and a second sound model, Combo. Pack `drawbar-organ-styles` with 88 tunes (jazz, soul, funk, gospel, blues, ballad, percussive, rotary, combo and bass split). Not listened to.

## 0.35.6 (2026-11-12)

### Improved
- **Reverb (1.0.1), Transient Shaper (1.0.1) and Pump (1.14.2) compute less.** States are now in local variables, constants are determined per block and for a switched-off part (for example Early at 0 in Reverb) the calculation is skipped. In a calculation test with the settings from Iron Cathedral and Skyline Ascent: Reverb 1.1 to 1.5 times faster, Transient Shaper about 1.7 times, Pump 1.0 to 1.1 times in that case (up to 3.5 times in other settings). The output is identical sample for sample (hash over all output bits, on several inputs).
- Delay and Distortion were investigated and not changed: every variant that gives the same output was not faster.
- Not listened to; the speeds were measured in Node on a busy machine.

## 0.35.5 (2026-11-12)

### Improved
- **Mastering devices compute much less.** Master Chain (1.17.1) was the most expensive device in a busy piece (in Iron Cathedral, removing it gave +0.25 on the audio time/wall time ratio). Per sample, powers, exponentials and new arrays were calculated; these are now cached or removed, the true-peak measurement uses a loop without modulo, and filter and envelope states that stayed stuck at denormal numbers after silence (around 1e-310, where the processor computes up to five times slower) are now set to zero. The same changes were made in **Balance EQ 1.15.1**, **Bus Compressor 1.15.1**, **Multiband Balance 1.15.1** (about 40% faster), **Patina 1.17.1**, **Stereo Space 1.15.1** and **Mix Check 1.15.1**.
- The sound and the reported LUFS, LRA and true-peak values are bit-identical in two test settings with 10 s of music (output and meter messages hashed). Only in silence, for values below 1e-30 (below -600 dBFS), is the output not bit-identical (largest deviation 2.3e-29). That is inaudible and was only measured.
- The processing time per block of Master Chain drops from a median of 125 to 60 microseconds in a Node test. In the real host (Chromium), Iron Cathedral got a better audio time/wall time ratio (0.70 to about 0.8 on a heavily loaded machine). Not listened to.

## 0.35.4 (2026-11-12)

### Improved
- **Devices that are lighter on the processor.** Same cause as with Celestial Mechanics (0.35.3): objects whose fields were added later, which stopped the browser from speeding up the inner loop. For each device the output was compared with the previous version and is identical sample for sample (with a fixed noise source), except where noted below.
  - **Click Synth 1.19.1:** about 3.5 times faster in the inner loop.
  - **Layered Landscape 1.14.1:** 1.6 to 2.6 times faster (parameter names are no longer rebuilt every block).
  - **Latin Percussion 1.18.1:** 1.3 to 1.5 times faster.
  - **Poly Chorus 1.13.1:** 25 to 34% faster (the settings are no longer kept in a dictionary-mode object).
  - **Grain Cloud 1.14.1** and **Four-Operator FM 1.14.1:** small gains (up to about 12% and 4 to 9%).
  - Woodwinds, Piano and Paradox were checked and not changed: nothing to gain there.
- **Cinematic Synth 1.17.1: second voice limit.** Released notes that were still ringing out did not count towards the limit of 10 voices, so when played very fast more than 150 voices sounded at once and the audio clock fell behind (measured ratio 0.29, now 1.0). There is now also a limit of 32 sounding voices: a ringing-out voice is cut first (30 ms fade), otherwise the oldest. Normal playing is unchanged; only above 32 simultaneous voices is a ringing tail cut earlier. This is a behaviour change that was not listened to.
- Not listened to; the speeds were measured in Node on a busy machine.

## 0.35.3 (2026-11-12)

### Improved
- **Celestial Mechanics (1.14.1) is much lighter on the processor.** In a busy piece with many planets this device took the most of the audio thread of all devices (measured about 52%). The planets got their fields only gradually, which stopped the browser from speeding up the inner loop; they now have the same fields from the start. In addition, no new arrays are created per audio block, there is one sine less per planet per sample and the panning is computed per block. In a calculation test with 14 planets it was two to four times faster, with exactly the same output (same samples as 1.14.0). Not listened to; it was measured that the sound does not change.

## 0.35.2 (2026-11-12)

### Fixed
- **Pulse Drums tunes: kicks no longer sound like a bongo.** In the *Pulse Drums Techno* pack (1.1.1), 24 of the 37 tunes had a kick that was too high or too short: a fundamental above 80 Hz or a decay below 0.1 s (mostly the newer drum and bass tunes with a `tune` around -6 to +4, and the short kicks of Hypnotic, Squelch, Half-Time and Miami, among others). For each tune only the kick's `tune` and `decay` were changed (the rest of the state is untouched), measured in the real host: the fundamental now lies between about 37 and 76 Hz, falling to about 32 to 59 Hz, and the decay is longer (-12 dB after 0.09 to 0.2 s). Not listened to.

## 0.35.1 (2026-11-12)

### Fixed
- **Clip Arranger (1.37.2): the matrix keeps its scroll position.** Playing a scene lower down no longer jumps back to the top scene. The matrix now also scrolls the scene that is playing into view when it is out of view.

## 0.35.0 (2026-11-12)

### Added
- **Six new songs for dance genres**, each with a Clip Arranger for the structure: **Concrete Meridian** (techno, 130 BPM, 4:26), **Late Train Home** (house, 124 BPM, 4:23), **Skyline Ascent** (trance, 138 BPM, 5:48), **Skyline Ignition** (EDM, 128 BPM, 4:15), **Slow Horizon** (progressive, 126 BPM, 7:07) and **Golden Hour Lights** (top 40 pop, 102 BPM, 3:08), in `songs/techno/`, `house/`, `trance/`, `edm/`, `progressive/` and `pop/`. The top 40 song was started with **Remix** (recipe New song, style Pop, hit score 100 out of 100) and then worked out. The Pulse Drums kicks are lower and longer (model Deep, tune -16 to -17, decay 0.8, sweep 0.65: a fundamental of about 63 Hz falling to about 45 Hz, a tail of about 0.35 s), because a high, short kick sounds like a bongo. Every track and every drum channel gets notes from the sequencer. Checked with `check-song.py` and per-device measurements; for four songs the full length was not measured in one run (the machine was overloaded, the rest was measured in test copies). **Not listened to.**

## 0.34.2 (2026-11-12)

### Fixed
- **Pop on a choke** in Drum Kit (1.19.1) and Pulse Drums (1.20.2): when a closed hat cut off an open hat, the decaying envelope jumped back to its peak. The release now holds the current value (`cancelAndHoldAtTime`). Not listened to.
- **Drum Kit 1.19.2 and Drum Machine 1.18.1**: same fix as Pulse Drums 1.20.1. A hit now starts on the next 128-sample block boundary, so every hit sounds the same at 135 BPM. Measured in an offline render (135 BPM, first 20 ms of the onset): the Drum Kit kick had a three-hit cycle (0.057 / 0.042 / 0.045) and is now even (0.044 / 0.043 / 0.043); the Drum Machine snare had 0.099 / 0.117 / 0.089 and is now even (0.106). Click Synth and Latin Percussion start in a worklet, sample-accurate, and do not have this. Not listened to.
- **Pump 1.14.1**: a duck event within half a sample of the block end was lost (about 0.4% of events); its position is now clamped to the last sample of the block.

## 0.34.1 (2026-11-12)

### Fixed
- **Hip-hop songs: every drum channel now sounds.** In Boom Bap, G-Funk, Lo-Fi and Trap, rim, shaker, cowbell, woodblock and sub 808 had their own pattern in the Drum Kit, but the Drum Kit is set to `run: false` and the Pattern Tracker never sent their notes, so they stayed silent. Each missing instrument now has its own Pattern Tracker track (**Rim**, **Shaker**, **Cowbell**, **Wood**, **Sub**) with a cable to `trigger`, with the same hits as the pattern in the kit, in the sections where the kick plays. Measured in the host over the whole song: every channel produces sound. Not listened to.
- **songs/AGENTS.md:** step 8 and the pitfalls list: check every track and every drum channel, because a channel the sequencer never drives stays silent without an error.

## 0.34.0 (2026-11-11)

### Added
- **Three drum & bass songs** in `songs/drum-and-bass/`, each in its own flavour: **Stadium Daybreak** (dancefloor, 174 BPM, A minor: supersaw hook, vocal chops, split sub and mid bass), **Amber Hours** (minimal liquid, 172 BPM, A dorian: electric-piano chords, bass guitar, flute, strings, vinyl texture) and **Iron Cathedral** (neurofunk, 174 BPM, E phrygian: morphing Neuro Bass, dry tight drums, drone and cluster, stutter fills). They use the new Neuro Bass, Transient Shaper and Stutter and the new DnB tunes. `check-song` gives exit code 0 for all three; the two heavier songs sit on the Master Chain ceiling in the drops, and the outro of Iron Cathedral was not measured. Not listened to. The style guide `songs/styles/drum-and-bass.md` lists the three flavours and the new packs.

## 0.33.0 (2026-11-11)

### Added
- **Drum & bass: three new devices and a lot of new sounds.** **Neuro Bass (1.0.0, Synths)**: a mono bass with two oscillators, FM and ring modulation, a clean mono sub under an adjustable crossover (only the highs are distorted), three waveshaper stages, a formant filter with a Morph macro, a tempo-synced LFO and a limiter; 70 tunes (Neurofunk, Detune Stack, Liquid, Jump Up, Dancefloor, Sub, Dubstep and Bass Music, Techno, Stabs and Hits). **Transient Shaper (1.0.0, Effects)**: attack and sustain up or down, independent of level, optional three bands, no latency; 35 presets. **Stutter (1.0.0, Effects)**: beat repeat on the tempo (1/4 to 1/32, triplets), gate pattern, pitch ramp, decay, tape stop and reverse; 34 presets.
- **New drum & bass tunes in 41 existing packs (about 620 tunes):** bass synths (Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads), leads, keys, pads, strings and vocals (Liquid DnB, Dancefloor DnB, Neuro Pads), dark textures, risers and impacts, and drum kits with patterns (Tech Step, Liquid, Dancefloor, Neurofunk, Jump Up, Jungle, Halftime, Amen Chops). Packs go up to 1.1.0. Levels are measured and aligned per device. Not listened to.

## 0.32.0 (2026-11-11)

### Added
- **Remix (1.0.0), a new device in Tools.** Remix reads the song of a Clip Arranger, analyses key, chords, sections and hook, and puts a remix in the same Clip Arranger as an **extra song**; the first song stays and **Restore** takes the remix away. Recipes: **Hit version** and **Radio edit** (intro, verse, chorus, verse, chorus, breakdown, double chorus, outro, 3:30 at most, after a classic hit formula), **Club mix** (DJ intro with only a kick, build-ups, drops, breakdown, DJ outro), **Tempo flip** (clips and sections ×2 or ÷2 at a tempo that differs by about a factor 2, for example 68 to 138 BPM) and **New song** from a style (House, Pop, Hip-hop, Disco, Synthwave) with a key, chord progression, bass, drums and a hook from a seed, to bootstrap a song. The analysis shows the key, chords with Roman numerals, sections, hook and a hit score with checks (length, first chorus, sections of 4 bars, breakdown, outro, chords in the scale). Remix works on notes and clips and cannot listen: **not listened to**. Pack **Remix Recipes** with 21 presets, manual and screenshots in both languages.
- **Contract v1.35, §13k: reading and writing another device's state.** `host.stateOf(this, targetId)` returns a copy of another device's state, `host.setStateOf(this, targetId, state)` sets a state through that device's `setState`, only shortly after a click by the user. Optional; existing devices keep working. The validator, the tests and both contract languages are updated.

### Changed
- **Song instructions:** step 2 names a classic hit formula and points to the styles and recipes of Remix; the AGENTS.md of Clip Arranger describes how another device may read and write the song.

## 0.31.0 (2026-11-11)

### Added
- **AI Chat can adjust devices on your floor.** Ask for example for brighter high frequencies or a correction of the mastering: the AI looks at the workspace and the controls of the devices, reads in the repository what they do and proposes changes with the old and new value. **Apply** sets them, **Undo** puts them back. Nothing changes without your click.

## 0.30.25 (2026-11-11)

### Fixed
- **Pulse Drums (1.20.1): every hit sounds the same, also at 135 BPM.** At a tempo where one beat is not a whole number of 128-sample render blocks (135 BPM: 166.67 blocks), every third kick drum clicked harder than the other two, because the noise of the click sounds different when the start falls in the middle of a block. The start of each hit is now rounded up to a block boundary (at most 2.7 ms later, never earlier than planned). Measured in a real browser with the Squelch tune: the sharpest jump per hit was 0.31, 0.19 and 0.13 for the three positions and is now 0.27 for all three. Not listened to. Drum Kit, Click Synth, Latin Percussion and Drum Machine use the same construction and were not changed.

## 0.30.24 (2026-11-11)

### Changed
- **Clip Arranger (1.37.1):** less space between the ports row and the Project line, and the vertical line in the colour of the section sits further to the left, apart from the play buttons of the scenes.

## 0.30.23 (2026-11-11)

### Changed
- **Clip Arranger (1.37.0): colours with a colour picker.** Track, scene and section get a colour through a colour picker instead of a list with numbers (the pencil at the track and at the scene; Colour in the section settings). Click the name of a scene to rename it. When you choose a section, a vertical line in the colour of the section is shown to the left and right of its scenes. The cells with clip numbers in the section blocks are gone.

## 0.30.22 (2026-11-11)

### Changed
- **Clip Arranger (1.36.0): more scenes in one section.** At Scenes in the section settings you add scenes with + scene (and change the order); they play one after another, each Bars long, and the series repeats Repeats times. A clip stretched over two scenes then plays through the whole section. Songs and presets without this field sound the same.
- **The Section row under the tracks is gone** and the clip buttons in 01 are gone (they are in 02; Cut clip was added). The header of 02 now shows TRACK / SCENE / CLIP of the selected clip. The + is shown as a plain + everywhere instead of a box.

## 0.30.21 (2026-11-11)

### Changed
- **Clip Arranger (1.35.0): section 02 (Track) is now in the track header.** Click the name or the label of a track to change it, the track type is a drop-down in the header, and colour, transpose, gate, swing, velocity and Audition track (for drums also protocol, row swing and the drum rows) are behind the pencil. Live record → this clip is now in the clip editor, which has become section 02.

## 0.30.20 (2026-11-11)

### Changed
- **Clip Arranger (1.34.0): assign a clip to a scene with a drop-down list.** Every cell in the matrix has a drop-down list (▾; an empty cell shows choose clip ▾) with the clips of the library, no clip, or a new clip. The same clip may be in as many scenes as you like. An empty cell no longer creates a clip by itself.

## 0.30.19 (2026-11-11)

### Changed
- **Clip Arranger (1.33.0): the clips really are a library per track, separate from the scenes.** In 03 the clips stay in a fixed order with fixed numbers; a scene is only a row that points to one clip per track. Deleting, adding, duplicating or moving scenes no longer changes the library (in 0.30.18 the clips shifted to the back). An empty cell shows + (click makes a new clip). Take out of scene leaves the clip in 03, Delete clip completely throws it away. The same clip can be in more scenes (reference, ↻); dragging a clip from the clip bar onto a cell puts it in. Old songs and presets (including the 58 shipped ones) load and sound the same.

## 0.30.18 (2026-11-11)

### Changed
- **Clip Arranger (1.32.0): the clips are a library per track, separate from the scenes.** Taking a clip out of a scene (right-click or Delete: Take out of scene) leaves it in the clip bar (03); Delete clip completely really throws it away. The × on a scene deletes the row again (no longer just dimmed) and its clips stay in the library. A new scene (+) has empty cells; put a clip in via Reuse clip or by dragging it from the clip bar onto the cell. The library starts with 8 clips and grows up to 48. Old songs and presets sound the same. This corrects the × of 0.30.17, which only dimmed a scene.

## 0.30.17 (2026-11-11)

### Added
- **Clip Arranger (1.31.0): a stretched clip follows the song sections.** A 16-bar clip stretched over two scenes now plays section 1 and then section 2 in song mode, even if the second section does not use the scene directly below, as long as the section has no clip of its own on that track. The clip carries on where the previous section stopped, so the section lengths decide how many bars each section plays. Other tracks keep playing their own clips per section. Before, such a clip did not carry on after the first section. The song bar shows the continuation.
- **Undo and Redo per part.** The song bar, the clip matrix and the clip editor each have their own Undo and Redo buttons; they undo only the last change in that part and leave changes in other parts alone. Ctrl+Z and Ctrl+Shift+Z work for the part you clicked last. The Undo and Redo at the top still step back through everything in order.
- **Reusing a clip.** Right-click a clip: Reuse in next empty scene or in all empty scenes (or Alt-drag to another slot of the same track). The slot is a link, not a copy: a change in the clip sounds in every scene that reuses it. Make own copy detaches it again.
- **The × on a scene no longer deletes clips.** It only takes the scene out of the song sections; the row with its clips stays. **Delete empty scenes** really cleans up.

## 0.30.16