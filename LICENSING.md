# Licenties

Elke map heeft een eigen licentie. De volledige tekst staat in het `LICENSE`-bestand van die map, en per SPDX-id in `LICENSES/`. `REUSE.toml` legt de indeling machineleesbaar vast.

| Map | Licentie | Waarom |
|---|---|---|
| `patchkamer/` (host) | AGPL-3.0-or-later | Het platform blijft open. Ook een betaalde webversie moet zijn broncode delen. |
| `contract/` | MIT | Iedereen, mens of AI, bouwt apparaten zonder voorwaarden en kiest zelf een licentie. Daarmee is de vraag weg of een apparaat een afgeleid werk van de host is. |
| `devices/` (apparaten) | AGPL-3.0-or-later | Deze apparaten kan niemand gesloten doorverkopen. Wie liever wil dat anderen ze vrij hergebruiken in eigen apparaten, kiest MIT. Apparaten die anderen in hun eigen bron publiceren, hebben hun eigen licentie. |
| `tunes/` | CC0-1.0 | Instellingen zijn data. Of ze auteursrechtelijk beschermd zijn is twijfelachtig, en met AI gemaakt nog meer. CC0 haalt elke twijfel weg: een tune kan zonder naamsvermelding in een song of in andermans bibliotheek. |
| `presets/` | CC0-1.0 | Zelfde reden. |
| `songs/` (meegeleverd) | CC-BY-4.0 | Anderen mogen verder bouwen en zelfs uitbrengen, met vermelding van de maker. Wil je dat afgeleide versies ook open blijven, kies dan CC-BY-SA-4.0. |
| Songs van anderen | Keuze van de maker | De muziek is van de artiest. Patchkamer legt niets op. |

De `LICENSE` in de root (AGPL-3.0) geldt voor alles wat hierboven niet anders is aangegeven.

## Onderdelen van derden

- **lamejs 1.2.1** (MP3-encoder, [LGPL-3.0](LICENSES/LGPL-3.0-only.txt), https://github.com/zhuker/lamejs) zit onveranderd in `devices/tools/Recorder/recorder.patchkamer-device.js`, als de tekstconstante `LAME_SRC` onderaan het bestand. Dat is het bestand `lame.min.js` uit de npm-release. Een apparaat moet één bestand zijn, dus een apart bestand kan niet. Je kunt de constante vervangen door een andere versie of een eigen build van lamejs: hij moet alleen een globale functie `lamejs` met `Mp3Encoder` opleveren. De rest van het bestand blijft AGPL-3.0-or-later. `REUSE.toml` legt dat per bestand vast.
