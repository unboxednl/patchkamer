# Licenties

Elke map heeft een eigen licentie. De volledige tekst staat in het `LICENSE`-bestand van die map, en per SPDX-id in `LICENSES/`. `REUSE.toml` legt de indeling machineleesbaar vast.

| Map | Licentie | Waarom |
|---|---|---|
| `patchkamer/` (host) | AGPL-3.0-or-later | Het platform blijft open. Ook een betaalde webversie moet zijn broncode delen. |
| `contract/` | MIT | Iedereen, mens of AI, bouwt apparaten zonder voorwaarden en kiest zelf een licentie. Daarmee is de vraag weg of een apparaat een afgeleid werk van de host is. |
| `devices/` (apparaten) | AGPL-3.0-or-later | Deze apparaten kan niemand gesloten doorverkopen. Wie liever wil dat anderen ze vrij hergebruiken in eigen apparaten, kiest MIT. Apparaten die anderen in hun eigen bron publiceren, hebben hun eigen licentie. |
| `tunes/` | CC0-1.0 | Instellingen zijn data. Of ze auteursrechtelijk beschermd zijn is twijfelachtig, en met AI gemaakt nog meer. CC0 haalt elke twijfel weg: een tune kan zonder naamsvermelding in een song of in andermans bibliotheek. |
| `samples/` | CC0-1.0 | Een sample is geluid dat met de apparaten van deze repository is gerenderd, zonder bestaande opname. Zelfde reden als bij tunes en presets: een sample kan zonder naamsvermelding in een song of in andermans bibliotheek. Samples uit andermans opname zijn en blijven van die ander. |
| `presets/` | CC0-1.0 | Zelfde reden. |
| `skins/library/` | CC0-1.0 | Een skin is data (een uiterlijk in CSS en afbeeldingen). Zelfde reden als bij tunes en presets: een skin kan zonder naamsvermelding in een song of in andermans bibliotheek. |
| `skins/contract/` | MIT | Zoals `contract/`: iedereen, mens of AI, maakt skins zonder voorwaarden. |
| `songs/` (meegeleverd) | CC-BY-4.0 | Anderen mogen verder bouwen en zelfs uitbrengen, met vermelding van de maker. Wil je dat afgeleide versies ook open blijven, kies dan CC-BY-SA-4.0. |
| Songs van anderen | Keuze van de maker | De muziek is van de artiest. Patchkamer legt niets op. |

De `LICENSE` in de root (AGPL-3.0) geldt voor alles wat hierboven niet anders is aangegeven, dus ook voor `skins/AGENTS.md` en de README's in `skins/`.

## Onderdelen van derden

- **lamejs 1.2.1** (MP3-encoder, [LGPL-3.0](LICENSES/LGPL-3.0-only.txt), https://github.com/zhuker/lamejs) zit onveranderd in `devices/tools/Recorder/recorder.patchkamer-device.js`, als de tekstconstante `LAME_SRC` onderaan het bestand. Dat is het bestand `lame.min.js` uit de npm-release. Een apparaat moet één bestand zijn, dus een apart bestand kan niet. Je kunt de constante vervangen door een andere versie of een eigen build van lamejs: hij moet alleen een globale functie `lamejs` met `Mp3Encoder` opleveren. De rest van het bestand blijft AGPL-3.0-or-later. `REUSE.toml` legt dat per bestand vast.
  De host gebruikt dezelfde lamejs voor de mp3-omzetting van de Stem Splitter (de dienst fal.ai · Mureka neemt alleen mp3 of m4a aan). Die kopie staat als los, onveranderd bestand in `patchkamer/vendor/lame.min.js` (ook `lame.min.js` uit de npm-release; LGPL-3.0-only, in `REUSE.toml` apart vastgelegd) en wordt pas bij de eerste omzetting geladen, niet bij het opstarten. Je kunt dat bestand vervangen door een andere versie of een eigen build van lamejs (een globale functie `lamejs` met `Mp3Encoder`); in de desktop-app zit de map `vendor` in `resources/patchkamer/vendor`. Beide kopieën zijn dezelfde versie; de Recorder houdt zijn eigen kopie.
