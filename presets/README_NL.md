# presets

*English version: [README.md](README.md)*

Kant-en-klare instellingen voor apparaten die geen eigen geluid maken (effecten, mixers, modulatoren, sequencers en andere tools), opgeslagen als data. Kies er een uit de lijst op de kaart van een apparaat, of gebruik een pack als beginpunt voor je eigen presets. Apparaten die geluid maken hebben [tunes](../tunes/README_NL.md).

Deze map heeft **15 packs met 238 presets**, één pack per apparaat. Het pack **Effect Chain Basics** is bijzonder: elk van zijn 14 presets is een complete keten van 4 tot 8 effecten voor één toepassing. Het pack **Chord Sequencer Styles** is het enige voor een sequencer: 60 presets in 11 stijlmappen, die elk vier sporen en vier scènes vullen. De kolom **Mappen** is het aantal mappen in het pack; de namen staan in de handleiding.

## De packs

### Effecten (12)

| Apparaat | Pack | Presets | Mappen | Bestand |
|---|---|---|---|---|
| [Chorus](../devices/effects/Chorus/) | Chorus Basics | 12 | 4 | [`chorus.patchkamer-presets.json`](chorus.patchkamer-presets.json) |
| [Effect Chain](../devices/effects/EffectChain/) | Effect Chain Basics | 14 | 4 | [`effect-chain.patchkamer-presets.json`](effect-chain.patchkamer-presets.json) |
| [Filter](../devices/effects/Filter/) | Filter Basics | 14 | 3 | [`filter.patchkamer-presets.json`](filter.patchkamer-presets.json) |
| [Flanger](../devices/effects/Flanger/) | Flanger Basics | 12 | 4 | [`flanger.patchkamer-presets.json`](flanger.patchkamer-presets.json) |
| [Frequency Shifter](../devices/effects/FrequencyShifter/) | Frequency Shifter Basics | 13 | 3 | [`frequency-shifter.patchkamer-presets.json`](frequency-shifter.patchkamer-presets.json) |
| [Grit](../devices/effects/Grit/) | Grit Basics | 12 | 3 | [`grit.patchkamer-presets.json`](grit.patchkamer-presets.json) |
| [Phaser](../devices/effects/Phaser/) | Phaser Basics | 11 | 3 | [`phaser.patchkamer-presets.json`](phaser.patchkamer-presets.json) |
| [Pump](../devices/effects/Pump/) | Pump Basics | 13 | 3 | [`pump.patchkamer-presets.json`](pump.patchkamer-presets.json) |
| [Resonator](../devices/effects/Resonator/) | Resonator Basics | 13 | 3 | [`resonator.patchkamer-presets.json`](resonator.patchkamer-presets.json) |
| [Room](../devices/effects/Room/) | Room Basics | 12 | 3 | [`room.patchkamer-presets.json`](room.patchkamer-presets.json) |
| [Tremolo](../devices/effects/Tremolo/) | Tremolo Basics | 13 | 4 | [`tremolo.patchkamer-presets.json`](tremolo.patchkamer-presets.json) |
| [Vocoder](../devices/effects/Vocoder/) | Vocoder Basics | 14 | 4 | [`vocoder.patchkamer-presets.json`](vocoder.patchkamer-presets.json) |

### Mixer (1)

| Apparaat | Pack | Presets | Mappen | Bestand |
|---|---|---|---|---|
| [Leveler](../devices/mixer/Leveler/) | Leveler Basics | 11 | 3 | [`leveler.patchkamer-presets.json`](leveler.patchkamer-presets.json) |

### Modulatoren (1)

| Apparaat | Pack | Presets | Mappen | Bestand |
|---|---|---|---|---|
| [Follower](../devices/modulators/Follower/) | Follower Basics | 14 | 3 | [`follower.patchkamer-presets.json`](follower.patchkamer-presets.json) |

### Sequencers (1)

| Apparaat | Pack | Presets | Mappen | Bestand |
|---|---|---|---|---|
| [Chord Sequencer](../devices/sequencers/ChordSequencer/) | Chord Sequencer Styles | 60 | 11 | [`chord-sequencer.patchkamer-presets.json`](chord-sequencer.patchkamer-presets.json) |

De mappen in elk pack staan in de handleiding: [Presets: gebruikershandleiding](../docs/presets/USER-MANUAL_NL.md).

## Zo gebruik je ze

- Laad `github.com/unboxednl/patchkamer` als bibliotheek in Patchkamer: de packs komen mee. Of download een bestand uit deze map en gebruik **Presets ▾ → Importeren…**.
- Kies daarna een preset in de lijst op de kaart van het apparaat.
- Uitleg in het geheel, ook over bewaren, exporteren, delen en je eigen packs maken: [Presets: gebruikershandleiding](../docs/presets/USER-MANUAL_NL.md). De basis van Patchkamer: [basishandleiding](../docs/USER-MANUAL_NL.md).

## Bestandsformaat

Eén pack per bestand, met de naam `naam.patchkamer-presets.json`: JSON met `format` (`patchkamer-presets`), `formatVersion` (2), `device` (de exacte id van het apparaat), `name`, `author`, `license`, `description` en een `tree`. De `tree` bevat mappen (`folder` met `items`) en presets; elk item heeft een `name`, `kind: "set"` en de eigen `state` van het apparaat. Regels voor agents die packs schrijven: [AGENTS.md](../tunes/AGENTS.md) (geschreven voor tunes; de indeling is gelijk).

## Licentie

CC0-1.0 (publiek domein). Of instellingen auteursrechtelijk beschermd zijn is twijfelachtig, zeker als ze met AI gemaakt zijn. CC0 haalt die twijfel weg: je mag een preset hergebruiken zonder naamsvermelding. Zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).
