# drums

*Nederlandse versie: [README_NL.md](README_NL.md)*

Devices that make drums and percussion. All six have **tunes** (a tune is the complete setting of one device, including its patterns), and each has a built-in step sequencer that plays along with the Patchkamer clock.

| Device | What it does | Folder | Manual |
|---|---|---|---|
| **Drum Machine** | A simple drum computer with four sounds (kick, snare, hat, perc) of 16 steps each, with tune, decay, tone, level and pan per sound; copy and paste the pattern (on/off only, lanes matched by kind) | [`DrumMachine/`](DrumMachine/) | [Drum Machine](../../docs/drums/USER-MANUAL_EN.md#drum-machine) |
| **Drum Kit** | A drum workstation with up to 16 channels of synthesized instruments, four patterns of up to 64 steps, a separate output per channel and notes or trigs in; copy and paste pattern A to D as drums; velocity, probability and ratchet come along and the length stays that of the kit | [`DrumKit/`](DrumKit/) | [Drum Kit](../../docs/drums/USER-MANUAL_EN.md#drum-kit) |
| **Groovebox 12** | A groovebox with 12 tracks (drum and synth machines), polymeter, parameter locks, trig conditions, 8 patterns with a chain, an FX block, delay and reverb | [`Groovebox12/`](Groovebox12/) | [Groovebox 12](../../docs/drums/USER-MANUAL_EN.md#groovebox-12) |
| **Pulse Drums** | A techno drum workstation: layered kick, FM percussion, a length of its own per channel (polymeter, Euclid), rumble bus and grit; copy and paste pattern A to D as drums, with polymeter and microtiming; every, phase, fill and locks only travel to another Pulse Drums | [`PulseDrums/`](PulseDrums/) | [Pulse Drums](../../docs/drums/USER-MANUAL_EN.md#pulse-drums) |
| **Latin Percussion** | Fifteen synthesized latin percussion sounds (bongos, congas, timbales, agogos, shakers, whistles) with pads, four banks of patterns and trigs in; copy and paste the selected bank (accents kept; lanes matched by sound name) | [`LatinPercussion/`](LatinPercussion/) | [Latin Percussion](../../docs/drums/USER-MANUAL_EN.md#latin-percussion) |
| **Click Synth** | A percussion synth for clicks, ticks, bleeps, zaps, wood, glass and glitches: eight lanes with their own sound engine, randomness and polyrhythm; copy and paste the pattern, with chance, ratchet and per-lane length; lanes matched by name | [`ClickSynth/`](ClickSynth/) | [Click Synth](../../docs/drums/USER-MANUAL_EN.md#click-synth) |

## More

- [User manual for drums](../../docs/drums/USER-MANUAL_EN.md): how to connect them, every control, examples.
- Tunes: [`drum-machine-styles.patchkamer-tunes.json`](../../tunes/drum-machine-styles.patchkamer-tunes.json) (36 tunes), [`drum-kit-styles.patchkamer-tunes.json`](../../tunes/drum-kit-styles.patchkamer-tunes.json) (38), [`groovebox-12-styles.patchkamer-tunes.json`](../../tunes/groovebox-12-styles.patchkamer-tunes.json) (38), [`pulse-drums-techno.patchkamer-tunes.json`](../../tunes/pulse-drums-techno.patchkamer-tunes.json) (26), [`latin-percussion-styles.patchkamer-tunes.json`](../../tunes/latin-percussion-styles.patchkamer-tunes.json) (39) and [`click-synth-styles.patchkamer-tunes.json`](../../tunes/click-synth-styles.patchkamer-tunes.json) (30). See also the [tunes folder](../../tunes/).
- Basics of Patchkamer: the [main user manual](../../docs/USER-MANUAL_EN.md).

## License

AGPL-3.0-or-later. See [LICENSE](../LICENSE) and [LICENSING.md](../../LICENSING.md).
