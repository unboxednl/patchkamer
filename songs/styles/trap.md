# Stijlgids: trap

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd. Zie ook [hip-hop](hip-hop.md).

## Kenmerken

- Half-time beat: de snare of clap valt op tel 3 (stap 8), de hats rollen in 1/16, 1/32 en triolen.
- Diepe, glijdende sub-bas (lange noten met glide) en donkere melodielijnen.
- Spaarzame, ruime productie: veel stilte, korte hooks.

## Tempo en maatsoort

- 4/4 geschreven, 130 tot 170 BPM, gevoeld als half-time (65 tot 85). Typisch 140 tot 150.
- Swing: 0; het ritme komt uit rolls en triolen.

## Toonsoort en harmonie

- Mineur, frygisch of harmonisch mineur; één grondtoon of twee akkoorden.
- Voorbeeld F mineur (F2 = 41): Fm = 53 56 60, Db = 49 53 56, Eb = 51 55 58, C = 48 52 55.
- Progressie `i VI VII` of `i bII` (Fm Gb); elke 2 tot 4 maten.
- Bas volgt de grondtonen (F1 = 29, Db1 = 25, Eb1 = 27).

## Ritme

```
kick       X.........x.....     (stap 0 en 10; vel 1,0 / 0,85)
snare      ........X.......     (stap 8; vel 1,0)
hat gesl.  xxxxxxxxxxxxxxxx     (1/16; vel varieert 0,4 tot 0,8)
open hat   ..............o.     (stap 14; vel 0,5)
```

Hat-roll (laatste 4 stappen van een maat op 1/32, `res` 32):

```
roll 1/32  ................xxxxxxxxxxxxxxxx   (res 32: 32 stappen = 1 maat; de laatste 16 = tel 3 en 4; vel stijgt 0,3 tot 1,0)
```

- Hat-patroon: 1/16 met ontbrekende stappen en accent (vel 0,8 op stap 0, 4, 8, 12; 0,45 daartussen); triolenroll via Wanderer `div` `"1.5"` of Step Sequencer `res` 32.
- Basfiguur (F1 = 29): lange noot op stap 0 (`ln` 8), korte noot op stap 10 (`ln` 2); glide naar de volgende noot.
- Microtiming: hats met `humV` 0,2 voor een menselijk gevoel; geen swing.
- Fill: elke 4 maten laatste maat met snare-roll op 1/32.

## Bas

- Sinus-sub, nootnummer 24 tot 36; lange noten (gate 1 tot 1,5) met glide tussen noten.
- Velocity 0,9 tot 1; af en toe een kort pitch-slidegeluid.
- De kick moet de sub niet maskeren: kort kickgeluid of sidechain via Pump.

## Akkoorden en pads

- Donkere pad of strijkers (Fm: 53 56 60), vel 0,4 tot 0,6, lange noten.
- Piano of bel-achtige lijn in de hoge octaven met veel reverb.
- Weinig akkoorden; ruimte voor de vocal en de hats.

## Melodie en lead

- Kort motief (3 tot 5 noten), vaak herhaald en met één noot variërend; mineur pentatonisch (F: 77 80 82 84 87).
- Bel, fluit of pluck; veel ruimte, delay.
- Dichtheid 20 tot 40 procent; velocity 0,6 tot 0,85.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | melodie en hats |
| Couplet | 16 | kick, snare, sub, hat-patroon; ruimte voor vocal |
| Pre-chorus | 4 | roll, riser |
| Refrein (drop) | 8 | volledige beat, extra melodie |
| Couplet 2 | 16 | zoals couplet 1 |
| Refrein | 8 | zoals eerder |
| Outro | 8 | afbouwen |

Totaal 68 maten; bij 144 BPM ongeveer 1 minuut 53.

## Dynamiek en nuances

- Herkenbaar: snare op tel 3, hat-rolls met stijgende velocity, lange glijdende sub.
- Veelgemaakte fouten: snare op 2 en 4 (wordt gewone hiphop op 140); hats met gelijke velocity; sub niet mono; te veel melodieën tegelijk.
- Stilte van 1 tel voor de drop.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Hip-hop`, tune `Trap`), [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Trap`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Trap`).
- Bas: [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Trap`, `Heavy Trap Sub`, `Glide Trap Bass`).
- Sequencers: [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) (map `Rolls and Ratchets`, preset `Trap Style Rolls` in [wanderer](../../presets/wanderer.patchkamer-presets.json)), [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) (map `Fills and Rolls`), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (`res` 32 voor rolls).
- Melodie: [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md), [Karplus String](../../devices/synths/KarplusString/AGENTS.md), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md), [Grit](../../devices/effects/Grit/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (tune `Trap`), BPM 144, swing 0.
2. Step Sequencer voor de bas (noot 29, lange noten), naar Low Bass.
3. Step Sequencer of Wanderer (`res` 32 of `div` `"1.5"`) voor de hat-rolls, naar de hat van de drumcomputer.
4. Een melodie via Chord Sequencer of Step Sequencer naar Four-Operator FM, met Room.
5. Mixer, Master Chain, Speakers.
