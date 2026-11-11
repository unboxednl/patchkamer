# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

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