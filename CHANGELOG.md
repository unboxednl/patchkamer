# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

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