# AGENTS.md: samples/

Dit bestand is voor AI-agents die samplepacks maken voor Patchkamer. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst. Het formaat staat in het contract, §13e (`../contract/PATCHKAMER-CONTRACT_NL.md`).

## Plaats in de boom

Omhoog: de [root AGENTS.md](../AGENTS.md). Omlaag: de apparaten die samples laden en spelen, [samplers](../devices/samplers/AGENTS.md) (Samplebank, Loop Slicer) en de [tools](../devices/tools/AGENTS.md) die audio uit de tab Samples aannemen (Drum Listener, Bass Finder, Tune Finder, Stem Splitter). Opzij: [tunes/AGENTS.md](../tunes/AGENTS.md) (een tune van een sampler bevat nooit audio) en [devices/AGENTS.md](../devices/AGENTS.md).

## Wat een samplepack is

Eén bestand `naam.patchkamer-samples.json` met `format: "patchkamer-samples"`, `formatVersion: 1`, `name`, `author`, `license`, `description`, optioneel `tags` en een `tree` van mappen (`folder`, `items`) en samples (`name`, `bpm`, `bars`, `tags`, `audio: { format, data }`). `data` is base64 van een WAV-, MP3-, OGG- of FLAC-bestand. Kies voor eigen loops FLAC (verliesloos, ongeveer de helft van WAV).

## Regels

- **Alleen eigen geluid.** Render samples uit de apparaten van deze repository (offline, `OfflineAudioContext`, met de echte apparaatcode) of maak ze zelf. Gebruik geen stuk uit een bestaande opname en geef een sample geen naam die naar een opname of artiest verwijst. Licentie `CC0-1.0`.
- **Loops herhalen naadloos:** de lengte is een geheel aantal maten op het tempo van het sample (`bpm`, `bars`), zonder klik aan de naad. Meet het: lengte in samples, piek (onder −1 dBFS), geen NaN of Infinity, de aanzetten tegenover het raster.
- **Tags:** samples gebruiken de wortel `style` (bijvoorbeeld `style/jungle`), op het pack, de map of het sample. Zie §13c voor de standaardnamen.
- **Namen** van packs, mappen en samples zijn Engels, zonder merk- of modelnamen.
- **Je kunt niet luisteren:** schrijf in de omschrijving wat gemeten is en dat het niet beluisterd is.
- Een pack mag niet groter zijn dan wat de host aankan: per bestand hoogstens 50 MiB; houd één pack liever onder enkele MB.

## Controleren

Importeer het pack in de host (tab Samples, **Importeren…**), controleer dat elk sample in de boom staat, speel het af met ▶ en laad het in de Loop Slicer (→ Loop Slicer): de naam moet in de kaart staan.

## De packs

| Pack | Samples | Inhoud |
|---|---|---|
| `break-loops.patchkamer-samples.json` | 14 | tweemaats drumloops uit Drum Kit en Pulse Drums: breakbeat (4), jungle (6), drum and bass (2), boom bap (2) |
