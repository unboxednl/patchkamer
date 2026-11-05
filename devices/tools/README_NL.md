# Tools

*English version: [README.md](README.md)*

Hulpmiddelen om muziek te maken: spelen, opnemen, meten, notities maken en andere apparaten besturen. Tools zijn geen effecten en maken meestal zelf geen geluid (de uitzondering is Metronome, die een tik speelt). Elke tool heeft hier een eigen map met het apparaatbestand en een `AGENTS.md`.

| Apparaat | Wat het doet | Map | Handleiding |
|---|---|---|---|
| **Control Surface** | Toont een MIDI-controller met knoppen, schuiven, pads en drukknoppen als paneel met een indeling die je uit secties bouwt; stuurt wat je doet door als CC | `ControlSurface/` | [Control Surface](../../docs/tools/USER-MANUAL_NL.md#control-surface) |
| **Keys / MIDI** | Een keyboard (scherm, computertoetsen of MIDI) dat noten naar andere apparaten stuurt | `Keys/` | [Keys / MIDI](../../docs/tools/USER-MANUAL_NL.md#keys--midi) |
| **MIDI Hub** | Verbindt MIDI-bronnen en sequencersporen met apparaten en zet elke regelaar van een apparaat op een knop, schuif of pad van je MIDI-apparaat; bewaart koppelingen per apparaat | `MidiHub/` | [MIDI Hub](../../docs/tools/USER-MANUAL_NL.md#midi-hub) |
| **Pad Controller** | Koppelt apparaten aan een raster van 40 pads (8 × 5) op een MIDI-controller; je kiest zelf de MIDI-ingang en de uitgang voor de lampjes | `PadController/` | [Pad Controller](../../docs/tools/USER-MANUAL_NL.md#pad-controller) |
| **Recorder** | Neemt op wat er binnenkomt en geeft het ongewijzigd door; bewaart WAV, MP3 of WebM/MP4 | `Recorder/` | [Recorder](../../docs/tools/USER-MANUAL_NL.md#recorder) |
| **Multitrack** | Neemt tot 16 sporen op uit een bundel, een WAV per spoor | `Multitrack/` | [Multitrack](../../docs/tools/USER-MANUAL_NL.md#multitrack) |
| **Scope** | Toont het geluid (spectrum, golfvorm, spectrogram, stereobeeld, peak/RMS); geeft het ongewijzigd door | `Scope/` | [Scope](../../docs/tools/USER-MANUAL_NL.md#scope) |
| **Metronome** | Een tik op elke maat, tel, achtste of zestiende van de klok van de studio; dezelfde slagen gaan als trigs naar buiten | `Metronome/` | [Metronome](../../docs/tools/USER-MANUAL_NL.md#metronome) |
| **Notes** | Een notitieblok met toonsoort, tempo, delen en een takenlijst; geen geluid, geen poorten | `Notes/` | [Notes](../../docs/tools/USER-MANUAL_NL.md#notes) |

## Meer

- Gebruikershandleiding van de tools: [docs/tools/USER-MANUAL_NL.md](../../docs/tools/USER-MANUAL_NL.md)
- Basishandleiding: [docs/USER-MANUAL_NL.md](../../docs/USER-MANUAL_NL.md)
- Presets voor tools: [`metronome.patchkamer-presets.json`](../../presets/metronome.patchkamer-presets.json) (Metronome Basics, 9 presets) [`midi-hub.patchkamer-presets.json`](../../presets/midi-hub.patchkamer-presets.json) (MIDI Hub Basics, 15 presets) en [`control-surface.patchkamer-presets.json`](../../presets/control-surface.patchkamer-presets.json) (Control Surface Layouts, 20 presets). De andere tools hebben er nog geen; het formaat en hoe je er zelf een maakt staan in [presets/](../../presets/README_NL.md)

## Licentie

AGPL-3.0-or-later, zoals alle apparaten. Zie [LICENSE](../LICENSE) en [LICENSING.md](../../LICENSING.md). De MP3-encoder in Recorder is lamejs (LGPL-3.0); zie de sectie Recorder in de handleiding.
