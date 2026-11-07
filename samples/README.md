# samples

*Nederlandse versie: [README_NL.md](README_NL.md)*

Sound for the **Samples** tab of the library: sample packs (`*.patchkamer-samples.json`) with the audio inside, as base64. Browse by style or by pack, listen with ▶ and load a sample into the Loop Slicer or the Samplebank. The format is in the [contract](../contract/PATCHKAMER-CONTRACT_EN.md) (§13e).

## The packs

| Pack | Samples | Contents |
|---|---|---|
| [Break Loops](break-loops.patchkamer-samples.json) | 14 | two-bar drum loops: breakbeat (4, 120 to 135 BPM), jungle (6, 160 to 172), drum and bass (2, 174 to 175) and boom bap (2, 88 and 90) |

The loops are rendered offline from the **Drum Kit** and **Pulse Drums** devices of this repository: stereo, 44.1 kHz, lossless FLAC, normalised to −1.5 dBFS. The patterns are original (swing, ghost notes, rolls); no existing recording is used. Each loop was checked by measurement: its length is exactly two bars at its tempo, there are no clicks at the seam, and the kicks and snares fall on the grid. They have **not been listened to**.

Loop Slicer tunes for these loops are in the [tunes](../tunes/README.md) folder (Loop Slicer Break Chops). Songs that use them are in `songs/jungle`, `songs/breakbeat` and `songs/drum-and-bass`.

## Make your own pack

A pack is one JSON file with a `tree` of folders and samples; each sample has `audio: { format, data }` (WAV, MP3, OGG or FLAC as base64), optionally `bpm` and `bars`, and `tags` such as `style/jungle`. Samples of someone else's recording are protected by copyright: only add them if you have the rights. Drop the file on the floor or use **Import…** on the Samples tab; put it in your library folder or on GitHub and it loads by itself.

## License

CC0-1.0, see [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md) (in Dutch).
