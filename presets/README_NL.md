# presets

*English version: [README.md](README.md)*

Kant-en-klare instellingen voor apparaten die geen eigen geluid maken (effecten, mixers, modulatoren en andere tools), opgeslagen als data. Kies er een uit de lijst op de kaart van een apparaat, of gebruik een pack als beginpunt voor je eigen presets. Apparaten die geluid maken hebben [tunes](../tunes/README_NL.md).

Deze map heeft **14 packs met 178 presets**, één pack per apparaat. Het pack **Effect Chain Basics** is bijzonder: elk van zijn 14 presets is een complete keten van 4 tot 8 effecten, gemaakt voor één toepassing (ambient, cinematic, techno, dub, lo-fi en meer).

## De packs

| Apparaat | Pack | Presets | Mappen | Bestand |
|---|---|---|---|---|
| [Chorus](../devices/effects/Chorus/) | Chorus Basics | 12 | Subtle (3), Ensemble (3), Movement (3), Extreme (3) | [`chorus.patchkamer-presets.json`](chorus.patchkamer-presets.json) |
| [Effect Chain](../devices/effects/EffectChain/) | Effect Chain Basics | 14 | Atmosphere (4), Studio (4), Club (4), Sound Design (2) | [`effect-chain.patchkamer-presets.json`](effect-chain.patchkamer-presets.json) |
| [Filter](../devices/effects/Filter/) | Filter Basics | 14 | Basics (5), Movement (5), Aggressive (4) | [`filter.patchkamer-presets.json`](filter.patchkamer-presets.json) |
| [Flanger](../devices/effects/Flanger/) | Flanger Basics | 12 | Classic (4), Subtle (2), Tempo (2), Extreme (4) | [`flanger.patchkamer-presets.json`](flanger.patchkamer-presets.json) |
| [Follower](../devices/modulators/Follower/) | Follower Basics | 14 | Level (6), Onsets (4), Extreme (4) | [`follower.patchkamer-presets.json`](follower.patchkamer-presets.json) |
| [Frequency Shifter](../devices/effects/FrequencyShifter/) | Frequency Shifter Basics | 13 | Subtle (4), Inharmonic (5), Feedback (4) | [`frequency-shifter.patchkamer-presets.json`](frequency-shifter.patchkamer-presets.json) |
| [Grit](../devices/effects/Grit/) | Grit Basics | 12 | Warm (3), Motion (4), Extreme (5) | [`grit.patchkamer-presets.json`](grit.patchkamer-presets.json) |
| [Leveler](../devices/mixer/Leveler/) | Leveler Basics | 11 | Sources (6), Mix (4), Utility (1) | [`leveler.patchkamer-presets.json`](leveler.patchkamer-presets.json) |
| [Phaser](../devices/effects/Phaser/) | Phaser Basics | 11 | Classic (4), Tempo (3), Extreme (4) | [`phaser.patchkamer-presets.json`](phaser.patchkamer-presets.json) |
| [Pump](../devices/effects/Pump/) | Pump Basics | 13 | Clock (6), Sidechain (3), Split and Mix (4) | [`pump.patchkamer-presets.json`](pump.patchkamer-presets.json) |
| [Resonator](../devices/effects/Resonator/) | Resonator Basics | 13 | Subtle (4), Chords (6), Extreme (3) | [`resonator.patchkamer-presets.json`](resonator.patchkamer-presets.json) |
| [Room](../devices/effects/Room/) | Room Basics | 12 | Spaces (4), Delays (4), Space FX (4) | [`room.patchkamer-presets.json`](room.patchkamer-presets.json) |
| [Tremolo](../devices/effects/Tremolo/) | Tremolo Basics | 13 | Classic (4), Slow (3), Rhythmic (3), Extreme (3) | [`tremolo.patchkamer-presets.json`](tremolo.patchkamer-presets.json) |
| [Vocoder](../devices/effects/Vocoder/) | Vocoder Basics | 14 | Voices (4), Textures (4), Extreme (4), External (2) | [`vocoder.patchkamer-presets.json`](vocoder.patchkamer-presets.json) |

De mappen in elk pack staan in de handleiding: [Presets: gebruikershandleiding](../docs/presets/USER-MANUAL_NL.md).

## Zo gebruik je ze

- Laad `github.com/unboxednl/patchkamer` als bibliotheek in Patchkamer: de packs komen mee. Of download een bestand uit deze map en gebruik **Presets ▾ → Importeren…**.
- Kies daarna een preset in de lijst op de kaart van het apparaat.
- Uitleg in het geheel, ook over bewaren, exporteren, delen en je eigen packs maken: [Presets: gebruikershandleiding](../docs/presets/USER-MANUAL_NL.md). De basis van Patchkamer: [basishandleiding](../docs/USER-MANUAL_NL.md).

## Bestandsformaat

Eén pack per bestand, met de naam `naam.patchkamer-presets.json`: JSON met `format` (`patchkamer-presets`), `formatVersion` (2), `device` (de exacte id van het apparaat), `name`, `author`, `license`, `description` en een `tree`. De `tree` bevat mappen (`folder` met `items`) en presets; elk item heeft een `name`, `kind: "set"` en de eigen `state` van het apparaat. Regels voor agents die packs schrijven: [AGENTS.md](../tunes/AGENTS.md) (geschreven voor tunes; de indeling is gelijk).

## Licentie

CC0-1.0 (publiek domein). Of instellingen auteursrechtelijk beschermd zijn is twijfelachtig, zeker als ze met AI gemaakt zijn. CC0 haalt die twijfel weg: je mag een preset hergebruiken zonder naamsvermelding. Zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).
