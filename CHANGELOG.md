# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

## 0.1.0 (not released yet)

### New
- **Chord Buddy** (new device, Tools category): helps you find chords without music theory. Pick a key and style, or play a chord on a MIDI keyboard: it recognises the chord (inversions, slash chords, incomplete chords), ranks the possible keys with how sure it is and why, suggests the next chord (safe, tension, colour), saves chords in 16 pads, plays the pads as a set (chords and bass on separate ports) and advises on bass lines and voice leading. Scales: major, minor (natural, harmonic, melodic), the seven modes, pentatonic and blues. A pack of 30 starter sets. Not listened to.
- **Audio Capture** (new device, Mixer category): brings the sound of another browser tab, a window or, on Windows, the whole system into the studio. One audio output that fits every audio input, so you can record, sample or process it. Mode, gain, high-pass, polarity, mute and meters; a pack of 12 presets. Nothing starts by itself: you choose the source in the share dialog of the browser. In the desktop app it shares the first screen and, on Windows, the sound of the whole system.
- **Skins: sections.** A skin can now give the controls of one group (for example the filter) a frame, lay them out in columns (3 columns = 3×3), make them bare (no frame of their own) and put the name under the control, and an appearance can set the card width so "Compact" makes the whole device smaller (skins contract 0.5; only when you pick the skin or appearance yourself, not with Auto). The mini designer has a Sections part and a Width field. Nothing is moved or hidden; sound and settings do not change.
- **Skins: meters.** A skin can now show a meter as a bar, an LED ladder or a round VU meter with a needle swinging from left to right, in the same place, with the length and width you choose (skins contract 0.4, device contract v1.18). The sound and settings do not change.
- **Desktop app** (Electron): Patchkamer in its own window, with the bundled library (devices, presets, tunes) and a portable Windows exe that needs no install. Built by the GitHub Action *App*. A folder `bibliotheek` next to the exe replaces the bundled library.
- **ASIO for the app**: audio can go straight to an ASIO driver for lower latency. Button **ASIO** at the bottom left, off by default. Choose driver, buffer, output pair, sample rate and margin; the button shows the estimated delay. Tested with an audio interface at about 17 ms.
- **Version number** under Settings: the version of Patchkamer, and in the app also the version of the app and the latest release on GitHub, with a download link. A link to this changelog.
- **Find sounds by instrument or style.** The Tunes and Presets tabs get **By instrument** and **By style**: an indented tree (Guitars → Nylon, Pianos, Brass, …; Hip-hop, Jungle, Techno, …) with search and a **Load** button that puts the tune on a card. The bundled tune and preset packs are tagged. New in the contract (v1.19): optional `tags` on tunes, presets, folders and packs.
- **Hip-hop songs and a folder tree in the Songs tab.** Four hip-hop songs in different sub-styles (boom bap, trap, lo-fi, G-funk) in `songs/hip-hop`, checked on paper and by measurement but not listened to. The Songs tab groups demo songs in subfolders under an indented heading.

### Fixed
- MIDI now connects in the app.
- The ASIO panel is readable in the light and retro looks.
- In the app, the message "another version on GitHub" no longer appears by mistake.
