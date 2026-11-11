# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

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