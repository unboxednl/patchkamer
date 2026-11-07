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
- Only MIDI (no sysex), audio input, screen sharing for the Audio Capture device and fullscreen are allowed as permissions. Audio Capture shares the first screen (the picture is never used); on Windows it brings in the sound of the whole system, on other systems the app shares no sound. Links to other sites open in the default browser.

## ASIO (in progress)

Chromium plays through WASAPI on Windows. For lower latency the app gets a native audio path: a Node addon (`native/`, N-API) that opens an ASIO driver, and a ring buffer that keeps the clock of the host and the clock of the sound card together (`native/ring.h`: reads slightly faster or slower, at most 0.3%, and raises its margin by itself when the writer delivers in bursts).

The host plays through it, in the app only (the page in a browser is not touched). The wrapper adds one script to the page it serves (`app-asio.js`; the file in the repo stays as it is). With ASIO on, the `AudioContext` of the host runs on a silent output; everything that is connected to its destination goes to a worklet that writes into shared memory, a worker passes it over a message channel to the main process, and the addon plays it through the driver. A button at the bottom left (**ASIO**) opens a panel: driver, buffer, output pair, sample rate and the margin of the ring buffer, with the delay the driver reports and the estimated delay. It is off by default; applying reloads the audio (the host asks first and keeps your workspace). The settings are in `asio.json` in the data folder of the app.

The page is cross-origin isolated (needed for shared memory), so a library or font from another site must send CORS headers, which GitHub does.

Test the sound card without the host (Windows, with your interface):

```
Patchkamer-0.1.0-portable.exe --asio-test
```

It lists the ASIO drivers, opens the first one (or the one whose name contains the text you give: `--asio-test=name`), plays a soft 440 Hz tone for 2.5 seconds on outputs 1 and 2 and writes `patchkamer-asio.json` next to the exe: buffer size, latencies reported by the driver, underruns and the margin of the ring buffer. Options: `--buffer=<frames>` (default: preferred size of the driver), `--target=<ms>` (ring margin, default 8), `--pair=<n>` (0 = outputs 1-2, 1 = outputs 3-4). A second run with the test clock (no sound card) shows the software side alone.

Build notes:
- `npm run build:native` builds the addon. With the environment variable `ASIO_SDK_DIR` (the folder `ASIOSDK` of the SDK) on Windows it includes ASIO; without it only the test clock (all platforms).
- The GitHub Action downloads the SDK 2.3.4 from Steinberg, checks its SHA-256 and uses it under its GPLv3 option, which fits the AGPL of this repo. The SDK is not stored in the repo; its licence text goes into the exe (`resources/licenses`).
- `npm run test:native` runs the tests of the ring buffer and the sample conversion in simulated time (equal clocks, clock skew up to 1000 ppm, jitter, a stalling writer, bursts, NaN and Infinity).
- ASIO is a trademark and software of Steinberg Media Technologies GmbH.
