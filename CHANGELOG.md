# Changelog

*Nederlandse versie: [CHANGELOG_NL.md](CHANGELOG_NL.md)*

All notable changes to Patchkamer (the host and the desktop app) per version. The version number is in `patchkamer/version.json` and shown under **Settings > Version**. Older history is in the git log.

## 0.1.0 (not released yet)

### New
- **Desktop app** (Electron): Patchkamer in its own window, with the bundled library (devices, presets, tunes) and a portable Windows exe that needs no install. Built by the GitHub Action *App*. A folder `bibliotheek` next to the exe replaces the bundled library.
- **ASIO for the app**: audio can go straight to an ASIO driver for lower latency. Button **ASIO** at the bottom left, off by default. Choose driver, buffer, output pair, sample rate and margin; the button shows the estimated delay. Tested with an audio interface at about 17 ms.
- **Version number** under Settings: the version of Patchkamer, and in the app also the version of the app and the latest release on GitHub, with a download link. A link to this changelog.

### Fixed
- MIDI now connects in the app.
- The ASIO panel is readable in the light and retro looks.
- In the app, the message "another version on GitHub" no longer appears by mistake.
