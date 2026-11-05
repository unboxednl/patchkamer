# Stijlgids: dubstep

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Half-time gevoel: de snare valt op tel 3, de bas beweegt in lange, bewegende golven.
- Zware sub-bas plus een middenbas met wobble en growl; veel ruimte tussen de slagen.
- Spanning door stilte, risers en een harde drop.

## Tempo en maatsoort

- 4/4 geschreven, 140 BPM gevoeld als 70 BPM half-time. Bereik 138 tot 142.
- Swing: 0 tot 0,1; sommige producties gebruiken licht swing op de hats (0,1).

## Toonsoort en harmonie

- Mineur, frygisch of harmonisch mineur; weinig akkoorden. Eén grondtoon met chromatische beweging.
- Voorbeeld F mineur (F1 = 29): grondtoon 29, kleine terts 32, kwint 36, kleine septiem 39, af en toe de b2 (30) voor dreiging.
- Pad of drone onder de intro: Fm (53 56 60), 4 tot 8 maten per akkoord; in de drop meestal alleen de bas.

## Ritme

```
kick       X.........x.....     (stap 0 en 10; vel 1,0 / 0,85)
snare      ........X.......     (stap 8; vel 1,0)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,55 / 0,4)
hat open   ......o.......o.     (stap 6, 14; vel 0,5)
```

- Half-time fill (laatste maat): snare-roll op 1/32 in de laatste 4 stappen, velocity 0,3 → 1,0; of een tomlijn.
- Basritme: noot op stap 0, daarna wobbles in achtste of kwart triolen (LFO met `Lfo`-device synchroon met de klok) op noten 29 / 32 / 36; gate 0,8 tot 1.
- Groove: houd de kick en snare op het raster; variatie komt uit de bas (LFO-snelheid wisselt per 2 maten: 1/4, 1/8, 1/8 triool, 1/16).
- Microtiming: de snare precies op stap 8; ghost-hats met `humV` 0,1.

## Bas

- Twee lagen: sub (sinus, nootnummer 24 tot 36) en midden (zaag/golfvorm met filter + LFO, nootnummer 36 tot 53).
- Wobble: LFO op het filter in 1/4, 1/8 of 1/8-triolen, diepte 0,6 tot 1.
- Growl: FM of distortion op de middenlaag; neem [Grit](../../devices/effects/Grit/AGENTS.md).
- Velocity 0,85 tot 1; gate lang (0,8 tot 1), stilte vóór de volgende noot.

## Akkoorden en pads

- Pad of stab alleen in de intro en break: Fm (53 56 60) lange noten, filter dicht, vel 0,4.
- Cluster- of drone-accenten: [Dissonant Cluster](../../devices/synths/DissonantCluster/AGENTS.md) voor dreigende texturen.
- In de drop geen akkoorden; houd de ruimte vrij voor de bas.

## Melodie en lead

- Spaarzaam: een kort motief van 3 tot 5 noten in de break (frygisch: 65 66 68 70), of een hoge stab.
- Lead-synth met veel delay in de intro en break; in de drop alleen de bas als hoofdstem.
- Risers: stijgende pitch of filter over 4 tot 8 maten.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | pad, ruis, hats; kick zacht |
| Opbouw | 8 | snareroll, riser, filter opent; vel stijgt |
| Drop 1 | 16 | kick, snare, sub en wobble; elke 4 maten een nieuwe bas-variatie |
| Break | 8 | alleen pad en melodie |
| Opbouw 2 | 8 | roll, riser |
| Drop 2 | 16 | heftiger, meer bassen |
| Outro | 8 | afbouwen |

Totaal 80 maten, bij 140 BPM ongeveer 2 minuten 17.

## Dynamiek en nuances

- Herkenbaar: stilte voor de drop (1 tot 2 tellen niets), snare op tel 3, basvariaties per 2 maten.
- Veelgemaakte fouten: snare op tel 2 en 4 (wordt gewone 140-bpm-beat); sub en middenbas in hetzelfde register; kick zonder sidechain op de sub; te veel hats.
- Houd de sub strikt mono en onder 120 Hz.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md), [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Dubstep`, tunes `Half-Time` en `Heavy`) in [drum-kit-styles](../../tunes/drum-kit-styles.patchkamer-tunes.json) en [drum-machine-styles](../../tunes/drum-machine-styles.patchkamer-tunes.json).
- Bas: [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Dubstep`), [Patch Mono](../../devices/synths/PatchMono/AGENTS.md) (map `Dubstep`), [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Dubstep`), [Dissonant Cluster](../../devices/synths/DissonantCluster/AGENTS.md) (map `Dubstep`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Dubstep`).
- Modulatie: [LFO](../../devices/modulators/Lfo/AGENTS.md) op het filter van de bas, op de klok; [Multi-Segment Envelope](../../devices/modulators/Mseg/AGENTS.md) voor de opbouw.
- Sequencers: [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md); [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) (map `Rolls and Ratchets`, [presets](../../presets/wanderer.patchkamer-presets.json)); [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Bass Music`, [presets](../../presets/clip-arranger.patchkamer-presets.json)).
- Effecten: [Grit](../../devices/effects/Grit/AGENTS.md), [Filter](../../devices/effects/Filter/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit, tune `Half-Time` (map `Dubstep`), BPM 140.
2. Step Sequencer voor de bas (noot 29, `len` 16, lange noten), naar Low Bass.
3. LFO (op de klok) naar het filter van de bas via de modulatiekabel.
4. Chord Sequencer of Drone Synth voor een pad in de intro.
5. Grit op de bas; Room op snare en pad.
6. Mixer, Master Chain, Speakers.
