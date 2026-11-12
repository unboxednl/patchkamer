# drums

*English version: [README.md](README.md)*

Apparaten die drums en percussie maken. Alle zes hebben **tunes** (een tune is de volledige instelling van één apparaat, inclusief de patronen), en elk heeft een ingebouwde stapsequencer die meespeelt met de klok van Patchkamer.

| Apparaat | Wat het doet | Map | Handleiding |
|---|---|---|---|
| **Drum Machine** | Een eenvoudige drumcomputer met vier geluiden (kick, snare, hat, perc) van elk 16 stappen, met tune, decay, toon, niveau en pan per geluid; patroon kopiëren en plakken (alleen aan/uit, per baan op soort uitgelijnd) | [`DrumMachine/`](DrumMachine/) | [Drum Machine](../../docs/drums/USER-MANUAL_NL.md#drum-machine) |
| **Drum Kit** | Een drumworkstation met tot 16 kanalen gesynthetiseerde instrumenten, vier patronen van maximaal 64 stappen, een aparte uitgang per kanaal en noten of trigs in; patroon A tot D kopiëren en plakken als drums; velocity, kans en ratchet gaan mee en de lengte blijft die van de kit | [`DrumKit/`](DrumKit/) | [Drum Kit](../../docs/drums/USER-MANUAL_NL.md#drum-kit) |
| **Groovebox 12** | Een groovebox met 12 tracks (drum- en synthmachines), polymeter, parameter locks, trig-condities, 8 patronen met een ketting, een FX-blok, delay en galm; het bewerkte patroon met alle 12 tracks kopiëren en plakken (stappen, lengtes, kans en ratchet; tussen twee Groovebox 12's ook klank, p-locks en condities) | [`Groovebox12/`](Groovebox12/) | [Groovebox 12](../../docs/drums/USER-MANUAL_NL.md#groovebox-12) |
| **Pulse Drums** | Een drumworkstation voor techno: gelaagde kick, FM-percussie, een eigen lengte per kanaal (polymeter, Euclid), rumble-bus en grit; patroon A tot D kopiëren en plakken als drums, met polymeter en microtiming; every, phase, fill en locks gaan alleen mee naar een ander exemplaar van Pulse Drums | [`PulseDrums/`](PulseDrums/) | [Pulse Drums](../../docs/drums/USER-MANUAL_NL.md#pulse-drums) |
| **Latin Percussion** | Vijftien gesynthetiseerde latin-percussieklanken (bongo's, conga's, timbales, agogo's, shakers, fluitjes) met pads, vier banken patronen en trigs in; gekozen bank kopiëren en plakken (accent blijft; uitlijnen op klanknaam) | [`LatinPercussion/`](LatinPercussion/) | [Latin Percussion](../../docs/drums/USER-MANUAL_NL.md#latin-percussion) |
| **Click Synth** | Een percussiesynth voor kliks, tiks, bleeps, zaps, hout, glas en glitches: acht sporen met een eigen klankmotor, willekeur en polyritme; patroon kopiëren en plakken, met kans, ratchet en eigen spoorlengte; uitlijnen op spoornaam | [`ClickSynth/`](ClickSynth/) | [Click Synth](../../docs/drums/USER-MANUAL_NL.md#click-synth) |
| **Acoustic Drums** | Een gesampled akoestisch drumstel voor funk, soul en jazz: opnames die na een klik via een link worden geladen (CC0, grootte vooraf zichtbaar), velocity-lagen met een zachte overgang, round robin, ghost notes en rimshots op de snare, een hi-hat die natuurlijk afkapt, bekkens, toms, kiesbare microfoons en losse uitgangen; patroon kopiëren en plakken als drums | [`AcousticDrums/`](AcousticDrums/) | [Acoustic Drums](../../docs/drums/USER-MANUAL_NL.md#acoustic-drums) |

## Meer

- [Gebruikershandleiding voor drums](../../docs/drums/USER-MANUAL_NL.md): hoe je ze aansluit, elke regelaar, voorbeelden.
- Tunes: [`drum-machine-styles.patchkamer-tunes.json`](../../tunes/drum-machine-styles.patchkamer-tunes.json) (36 tunes), [`drum-kit-styles.patchkamer-tunes.json`](../../tunes/drum-kit-styles.patchkamer-tunes.json) (38), [`groovebox-12-styles.patchkamer-tunes.json`](../../tunes/groovebox-12-styles.patchkamer-tunes.json) (38), [`pulse-drums-techno.patchkamer-tunes.json`](../../tunes/pulse-drums-techno.patchkamer-tunes.json) (26), [`latin-percussion-styles.patchkamer-tunes.json`](../../tunes/latin-percussion-styles.patchkamer-tunes.json) (39) en [`click-synth-styles.patchkamer-tunes.json`](../../tunes/click-synth-styles.patchkamer-tunes.json) (30). Zie ook de [map tunes](../../tunes/).
- De basis van Patchkamer: de [basishandleiding](../../docs/USER-MANUAL_NL.md).

## Licentie

AGPL-3.0-or-later. Zie [LICENSE](../LICENSE) en [LICENSING.md](../../LICENSING.md).
