# Effects

*Nederlandse versie: [README_NL.md](README_NL.md)*

Effects take sound in, change it and send it on. Put them between a sound source and a Mixer or Speakers. Each effect has an audio input and output and a purple **Mod** port for a modulator. Effects have **presets**, not tunes.

| Device | What it does | Folder | Manual |
|---|---|---|---|
| Bitcrusher | Lowers bit depth and sample rate, with four quantiser styles, dither, noise, optional anti-alias filter and a waveform display. | [`Bitcrusher/`](Bitcrusher/) | [Bitcrusher](../../docs/effects/USER-MANUAL_EN.md#bitcrusher) |
| Chorus | Doubles a sound with small moving delays; two voices or three (ensemble). | [`Chorus/`](Chorus/) | [Chorus](../../docs/effects/USER-MANUAL_EN.md#chorus) |
| Compressor | Compressor with threshold, ratio up to infinite, soft knee, attack and release (also automatic), make-up, peak or RMS detection, lookahead, sidechain filter and external sidechain, parallel mix, mid/side, a reduction meter and a transfer curve. | [`Compressor/`](Compressor/) | [Compressor](../../docs/effects/USER-MANUAL_EN.md#compressor) |
| Convolution Reverb | A convolution reverb with 15 built-in impulse responses and your own files. | [`ConvolutionReverb/`](ConvolutionReverb/) | [Convolution Reverb](../../docs/effects/USER-MANUAL_EN.md#convolution-reverb) |
| De-esser | Tames harsh s sounds in a voice: detection band from 3 to 10 kHz, threshold, ratio, maximum reduction, split-band or wideband, listening to the band, mix and a reduction meter. | [`DeEsser/`](DeEsser/) | [De-esser](../../docs/effects/USER-MANUAL_EN.md#de-esser) |
| Delay | An extended delay: free time in ms, host-clock sync (1/64 to 2 bars, straight, dotted, triplet, x/16), own tempo (tap), stereo, ping-pong, mono and dual, with filters, saturation, diffusion, modulation, ducking, freeze and reverse. | [`Delay/`](Delay/) | [Delay](../../docs/effects/USER-MANUAL_EN.md#delay) |
| Distortion | Eight distortion types from soft clip to fuzz and wavefolder, with oversampling, tone controls and a parallel mix. | [`Distortion/`](Distortion/) | [Distortion](../../docs/effects/USER-MANUAL_EN.md#distortion) |
| Effect Chain | Up to 8 effects in a row, chosen from 33, with an analyzer. | [`EffectChain/`](EffectChain/) | [Effect Chain](../../docs/effects/USER-MANUAL_EN.md#effect-chain) |
| Filter | Ten filter types, from low-pass to vowel and comb filters. | [`Filter/`](Filter/) | [Filter](../../docs/effects/USER-MANUAL_EN.md#filter) |
| Flanger | A sweeping flanger with feedback, free or on the tempo. | [`Flanger/`](Flanger/) | [Flanger](../../docs/effects/USER-MANUAL_EN.md#flanger) |
| Frequency Shifter | Moves all frequencies by a fixed number of Hz. | [`FrequencyShifter/`](FrequencyShifter/) | [Frequency Shifter](../../docs/effects/USER-MANUAL_EN.md#frequency-shifter) |
| Gate | Noise gate, expander and ducker in one: threshold, ratio, attack, hold, release, range, hysteresis, sidechain filters and listening, external sidechain, lookahead and a gate-open meter. | [`Gate/`](Gate/) | [Gate](../../docs/effects/USER-MANUAL_EN.md#gate) |
| Grit | Distortion into a resonant low-pass filter with an LFO. | [`Grit/`](Grit/) | [Grit](../../docs/effects/USER-MANUAL_EN.md#grit) |
| Harmonizer | Up to four extra voices at fixed intervals or in a scale, following the pitch of the input or notes on the event input, with level, pan, detune and delay per voice. | [`Harmonizer/`](Harmonizer/) | [Harmonizer](../../docs/effects/USER-MANUAL_EN.md#harmonizer) |
| Phaser | A phaser with 4 to 12 stages, free or on the tempo. | [`Phaser/`](Phaser/) | [Phaser](../../docs/effects/USER-MANUAL_EN.md#phaser) |
| Pitch Correction | Monophonic pitch correction: detects the pitch of a voice or line and moves it to the nearest allowed note of a scale, with speed, amount, vibrato keeping and a display of the heard and corrected note. | [`PitchCorrection/`](PitchCorrection/) | [Pitch Correction](../../docs/effects/USER-MANUAL_EN.md#pitch-correction) |
| Pitch Shifter | Shifts pitch by −24 to +24 semitones plus cents, keeping the tempo, with a percussive grain engine, a grain engine for voices and a vocoder with formant control, plus feedback for shimmer and octave echoes. | [`PitchShifter/`](PitchShifter/) | [Pitch Shifter](../../docs/effects/USER-MANUAL_EN.md#pitch-shifter) |
| Pump | Ducks a source on the beat: sidechain, trigger or clock. | [`Pump/`](Pump/) | [Pump](../../docs/effects/USER-MANUAL_EN.md#pump) |
| Resonator | Four resonators tuned to a root note and a chord. | [`Resonator/`](Resonator/) | [Resonator](../../docs/effects/USER-MANUAL_EN.md#resonator) |
| Reverb | An algorithmic reverb with five models: Hall, Plate, Spring, Room and Chamber. | [`Reverb/`](Reverb/) | [Reverb](../../docs/effects/USER-MANUAL_EN.md#reverb) |
| Room | A delay and a reverb in one effect. | [`Room/`](Room/) | [Room](../../docs/effects/USER-MANUAL_EN.md#room) |
| Tremolo | Makes the volume go up and down. | [`Tremolo/`](Tremolo/) | [Tremolo](../../docs/effects/USER-MANUAL_EN.md#tremolo) |
| Vocoder | A 16-band vocoder: a voice plays a synth. | [`Vocoder/`](Vocoder/) | [Vocoder](../../docs/effects/USER-MANUAL_EN.md#vocoder) |

## More

- [User manual for effects](../../docs/effects/USER-MANUAL_EN.md): which effect for which goal, the order of effects in a chain, and a section per effect.
- [Presets](../../presets/README.md): the preset packs (one per effect, for example `chorus.patchkamer-presets.json`).
- [Basic manual](../../docs/USER-MANUAL_EN.md): starting Patchkamer, loading a library and cables.

## License

The devices are AGPL-3.0-or-later, the presets CC0-1.0. See [LICENSING.md](../../LICENSING.md).
