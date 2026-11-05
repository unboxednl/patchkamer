# Patchkamer app

The Patchkamer host in its own desktop window (Electron, Chromium). It is the same page as in the browser, with the bundled library (devices, presets, tunes) built in, no click needed to allow audio, and Web MIDI without sysex.

## Run it

```
cd app
npm install
npm start
```

If `app/node_modules/electron/dist` stays empty after `npm install` (the download script can be blocked), run `node node_modules/electron/install.js` once.

## Build the Windows exe

The GitHub Action `App` (`.github/workflows/app.yml`) builds a portable `Patchkamer-<version>-portable.exe` on a Windows runner: Actions > App > Run workflow, or push a tag `app/vX.Y.Z`. The exe is a build artifact of the run.

## Own library

A folder `bibliotheek` next to the exe replaces the bundled library. It is a normal library (see the contract, section Libraries); without its own `patchkamer.json` the app lists every `*.patchkamer-device.js`, `*.patchkamer-presets.json` and `*.patchkamer-tunes.json` it finds under `devices`, `presets` and `tunes`.

## Measure latency

```
npm run probe
```

Prints the base and output latency that this Chromium reports per `latencyHint` and sample rate, as JSON, and also writes it to `patchkamer-probe.json` (next to the exe, or in the current folder). With the portable exe: `Patchkamer-0.1.0-portable.exe --probe` from a terminal, then open `patchkamer-probe.json`. Run it on the machine and sound card you play on. The numbers say how much the audio path of Chromium costs; they are the basis for deciding whether a native ASIO route is worth building.

## Notes

- The page is served from `http://127.0.0.1:47318` (fixed port, so settings and workspaces stay in one place). If that port is taken, a random port is used and settings are stored under that address.
- Only MIDI (no sysex), audio input and fullscreen are allowed as permissions. Links to other sites open in the default browser.
- Not included yet: ASIO. Chromium plays through WASAPI on Windows.
