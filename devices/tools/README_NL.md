# Tools

*English version: [README.md](README.md)*

Hulpmiddelen om muziek te maken: spelen, opnemen, meten, notities maken en andere apparaten besturen. Tools maken zelf geen geluid en zijn geen effecten. Elke tool heeft hier een eigen map met het apparaatbestand en een `AGENTS.md`.

| Apparaat | Wat het doet | Map | Handleiding |
|---|---|---|---|
| **Keys / MIDI** | Een keyboard (scherm, computertoetsen of MIDI) dat noten naar andere apparaten stuurt | `Keys/` | [Keys / MIDI](../../docs/tools/USER-MANUAL_NL.md#keys--midi) |
| **Pad Controller** | Koppelt apparaten aan een raster van 40 pads (8 × 5) op een MIDI-controller; je kiest zelf de MIDI-ingang en de uitgang voor de lampjes | `PadController/` | [Pad Controller](../../docs/tools/USER-MANUAL_NL.md#pad-controller) |
| **Recorder** | Neemt op wat er binnenkomt en geeft het ongewijzigd door; bewaart WAV, MP3 of WebM/MP4 | `Recorder/` | [Recorder](../../docs/tools/USER-MANUAL_NL.md#recorder) |
| **Multitrack** | Neemt tot 16 sporen op uit een bundel, een WAV per spoor | `Multitrack/` | [Multitrack](../../docs/tools/USER-MANUAL_NL.md#multitrack) |
| **Scope** | Toont het geluid (spectrum, golfvorm, spectrogram, stereobeeld, peak/RMS); geeft het ongewijzigd door | `Scope/` | [Scope](../../docs/tools/USER-MANUAL_NL.md#scope) |
| **Notes** | Een notitieblok met toonsoort, tempo, delen en een takenlijst; geen geluid, geen poorten | `Notes/` | [Notes](../../docs/tools/USER-MANUAL_NL.md#notes) |

## Meer

- Gebruikershandleiding van de tools: [docs/tools/USER-MANUAL_NL.md](../../docs/tools/USER-MANUAL_NL.md)
- Basishandleiding: [docs/USER-MANUAL_NL.md](../../docs/USER-MANUAL_NL.md)
- Presets voor tools: er zijn er nog geen meegeleverd; het formaat en hoe je er zelf een maakt staan in [presets/](../../presets/README_NL.md)

## Licentie

AGPL-3.0-or-later, zoals alle apparaten. Zie [LICENSE](../LICENSE) en [LICENSING.md](../../LICENSING.md). De MP3-encoder in Recorder is lamejs (LGPL-3.0); zie de sectie Recorder in de handleiding.
