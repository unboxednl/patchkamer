# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

## 0.30.17 (2026-11-11)

### Added
- **Clip Arranger (1.31.0): a stretched clip follows the song sections.** A 16-bar clip stretched over two scenes now plays section 1 and then section 2 in song mode, even if the second section does not use the scene directly below, as long as the section has no clip of its own on that track. The clip carries on where the previous section stopped, so the section lengths decide how many bars each section plays. Other tracks keep playing their own clips per section. Before, such a clip did not carry on after the first section. The song bar shows the continuation.
- **Undo and Redo per part.** The song bar, the clip matrix and the clip editor each have their own Undo and Redo buttons; they undo only the last change in that part and leave changes in other parts alone. Ctrl+Z and Ctrl+Shift+Z work for the part you clicked last. The Undo and Redo at the top still step back through everything in order.
- **Reusing a clip.** Right-click a clip: Reuse in next empty scene or in all empty scenes (or Alt-drag to another slot of the same track). The slot is a link, not a copy: a change in the clip sounds in every scene that reuses it. Make own copy detaches it again.
- **The × on a scene no longer deletes clips.** It only takes the scene out of the song sections; the row with its clips stays. **Delete empty scenes** really cleans up.

## 0.30.16