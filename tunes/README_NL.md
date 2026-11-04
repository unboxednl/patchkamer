# tunes

*English version: [README.md](README.md)*

Kant-en-klare klanken voor apparaten die geluid maken (synths en drumcomputers), opgeslagen als data. Kies er een uit de lijst op de kaart van een apparaat, gebruik hem in een song of in een eigen bibliotheek. Apparaten zonder eigen geluid hebben [presets](../presets/README_NL.md).

Deze map heeft **5 packs met 221 tunes**, één pack per apparaat. Een drumapparaat laadt een hele machine (klanken en patroon) als één tune.

## De packs

| Apparaat | Pack | Tunes | Mappen | Bestand |
|---|---|---|---|---|
| [Duofone](../devices/synths/Duofone/) | Duofone Styles | 60 | Techno (5), House (5), Trance (5), Ambient (5), Drum & Bass (5), Dubstep (5), Synthwave (5), Funk & Disco (5), Hip-hop (5), Electro (5), Pop (5), Chiptune (5) | [`duofone-styles.patchkamer-tunes.json`](duofone-styles.patchkamer-tunes.json) |
| [Acid Baselines](../devices/synths/AcidBaselines/) | Acid Baselines Classics | 49 | Chicago Origins (5), Frankfurt Rolling (5), Minimal Acid (5), Squelch Anthems (5), Acid Techno (5), Acid Trance (5), Electro Acid (5), Deep Acid (5), AIcid (9) | [`acid-baselines-classics.patchkamer-tunes.json`](acid-baselines-classics.patchkamer-tunes.json) |
| [Drum Kit](../devices/drums/DrumKit/) | Drum Kit Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-kit-styles.patchkamer-tunes.json`](drum-kit-styles.patchkamer-tunes.json) |
| [Drum Machine](../devices/drums/DrumMachine/) | Drum Machine Styles | 36 | Techno (3), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-machine-styles.patchkamer-tunes.json`](drum-machine-styles.patchkamer-tunes.json) |
| [Groovebox 12](../devices/drums/Groovebox12/) | Groovebox 12 Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`groovebox-12-styles.patchkamer-tunes.json`](groovebox-12-styles.patchkamer-tunes.json) |

De mappen in elk pack staan in de handleiding: [Tunes: gebruikershandleiding](../docs/tunes/USER-MANUAL_NL.md).

## Zo gebruik je ze

- Laad `github.com/unboxednl/patchkamer` als bibliotheek in Patchkamer: de packs komen mee. Of download een bestand uit deze map en gebruik **Tunes ▾ → Importeren…**.
- Kies daarna een tune in de lijst op de kaart van het apparaat.
- Uitleg in het geheel, ook over bewaren, exporteren, delen en je eigen packs maken: [Tunes: gebruikershandleiding](../docs/tunes/USER-MANUAL_NL.md). De basis van Patchkamer: [basishandleiding](../docs/USER-MANUAL_NL.md).

## Bestandsformaat

Eén pack per bestand, met de naam `naam.patchkamer-tunes.json`: JSON met `format` (`patchkamer-tunes`), `formatVersion` (1), `device` (de exacte id van het apparaat), `name`, `author`, `license`, `description` en een `tree`. De `tree` bevat mappen (`folder` met `items`) en tunes; elk item heeft een `name`, `kind: "set"` en de eigen `state` van het apparaat. Regels voor agents die packs schrijven: [AGENTS.md](AGENTS.md).

## Licentie

CC0-1.0 (publiek domein). Of instellingen auteursrechtelijk beschermd zijn is twijfelachtig, zeker als ze met AI gemaakt zijn. CC0 haalt die twijfel weg: je mag een tune hergebruiken zonder naamsvermelding. Zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).
