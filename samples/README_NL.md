# samples

*English version: [README.md](README.md)*

Geluid voor de tab **Samples** van de bibliotheek: samplepacks (`*.patchkamer-samples.json`) met de audio erin, als base64. Blader per stijl of per pack, beluister met ▶ en laad een sample in de Loop Slicer of de Samplebank. Het formaat staat in het [contract](../contract/PATCHKAMER-CONTRACT_NL.md) (§13e).

## De packs

| Pack | Samples | Inhoud |
|---|---|---|
| [Break Loops](break-loops.patchkamer-samples.json) | 14 | drumloops van twee maten: breakbeat (4, 120 tot 135 BPM), jungle (6, 160 tot 172), drum and bass (2, 174 tot 175) en boom bap (2, 88 en 90) |

De loops zijn offline gerenderd uit de apparaten **Drum Kit** en **Pulse Drums** van deze repository: stereo, 44,1 kHz, verliesloze FLAC, genormaliseerd op −1,5 dBFS. De patronen zijn origineel (swing, ghost notes, rolls); er is geen bestaande opname gebruikt. Elke loop is met metingen gecontroleerd: de lengte is precies twee maten op zijn tempo, er zijn geen klikken aan de naad, en de kicks en snares vallen op het raster. Ze zijn **niet beluisterd**.

Loop Slicer-tunes voor deze loops staan in de map [tunes](../tunes/README_NL.md) (Loop Slicer Break Chops). Songs die ze gebruiken staan in `songs/jungle`, `songs/breakbeat` en `songs/drum-and-bass`.

## Maak je eigen pack

Een pack is één JSON-bestand met een `tree` van mappen en samples; elk sample heeft `audio: { format, data }` (WAV, MP3, OGG of FLAC als base64), eventueel `bpm` en `bars`, en `tags` zoals `style/jungle`. Samples uit andermans opname zijn auteursrechtelijk beschermd: voeg ze alleen toe als je de rechten hebt. Laat het bestand los op de vloer of gebruik **Importeren…** op de tab Samples; zet het in je bibliotheekmap of op GitHub en het laadt vanzelf.

## Licentie

CC0-1.0, zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).
