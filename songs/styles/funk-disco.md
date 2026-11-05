# Stijlgids: funk en disco

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Groove boven alles. Funk: gesyncopeerde bas, korte akkoordstabs, ghost notes. Disco: vier op de vloer, octaafbas, strijkers en open hi-hat.
- Strakke band-feel; elke stem heeft een eigen ritmisch gat.
- Zevende-akkoorden en dorische/mixolydische kleuren.

## Tempo en maatsoort

- 4/4. Funk 95 tot 115 BPM, disco 110 tot 126 BPM.
- Swing: funk 0,1 tot 0,25 (zestienden), disco 0 tot 0,1.

## Toonsoort en harmonie

- Dorisch, mixolydisch, blues; één of twee akkoorden met zevenden.
- Voorbeeld E mineur/dorisch (E2 = 40): Em7 = 52 55 59 62, A7 = 45 49 52 55 (of 57 61 64 67), Dm7 = 50 53 57 60.
- Funk: `i7 IV7` (Em7 A7) of eenakkoord-jam op Em7 (vamp), 2 maten per akkoord.
- Disco: `i7 iv7 VII7 III` (Am7 Dm7 G7 Cmaj7: 57 60 64 67 / 50 53 57 60 / 55 59 62 65 / 48 52 55 59).

## Ritme

Funk (16 stappen, ghost-rijke snare):

```
kick       X..x..x...x.....     (stap 0, 3, 6, 10; vel 1,0 / 0,8)
snare      ....X..g.g..X..g     (stap 4, 12 accent; ghosts stap 7, 9, 15; vel 0,3)
hat gesl.  xoxoxoxoxoxoxoxo     (zestienden; x 0,7 / o 0,45)
```

Disco (vier op de vloer met open hat):

```
kick       X...X...X...X...
clap       ....X.......X...
hat open   ..X...X...X...X.     (offbeat; vel 0,8)
hat gesl.  xoxoxoxoxoxoxoxo
```

- Funkbas (E1 = 28): `x..x..x...x.x...` noten 40 40 43 40 45 (E2 = 40), ghost-noten op stap 9, 11 (vel 0,3), gate 0,3 tot 0,5.
- Discobas: octavenpuls `x.x.x.x.x.x.x.x.` afwisselend 40 en 52 (E2 / E3), gate 0,5.
- Microtiming: swing 0,15 op funk-zestienden; hats licht achter het raster.
- Fill: tomloop op 1/16 in de laatste 4 stappen van elke 4 of 8 maten.

## Bas

- Funk: 16 stappen, korte noten, veel ghost notes (vel 0,25 tot 0,4), accent op 1 (vel 1,0), slides af en toe.
- Disco: onafgebroken achtsten of zestienden, octaafsprongen (E2 / E3), gate 0,4 tot 0,6, vel 0,8.
- Houd de bas strak met de kick; laat ruimte op stap 1 en 2 in funk.

## Akkoorden en pads

- Funk: korte stabs (gate 0,2 tot 0,35) op stap 3, 6, 10, 13 (`...x..x...x..x..`), akkoord Em7 (52 55 59 62), vel 0,6 tot 0,85.
- Disco: strijkers in lange noten (gate 1, vel 0,5), plus gesyncopeerde piano- of gitaar-stabs (stap 2, 6, 10, 14).
- Klavier (elektrisch) of orgel in funk; strijkers en blazers in disco.

## Melodie en lead

- Funk: korte riffs van 4 tot 6 noten uit mineur pentatonisch (E: 64 67 69 71 74), in call and response met de bas.
- Disco: zingbare lijn met lange noten en octaafsprongen; strijkersrun omhoog (E dorisch) voor opbouw.
- Dichtheid 40 tot 60 procent.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | drums, bas |
| Couplet | 16 | akkoordstabs, bas, drums |
| Refrein | 8 | strijkers/blazers erbij, melodie |
| Couplet 2 | 16 | zoals couplet |
| Brug / break | 8 | drums en bas alleen, of de bas solo |
| Refrein | 8 | alle lagen |
| Outro | 8 | afbouwen |

Totaal 72 maten; bij 112 BPM ongeveer 2 minuten 34.

## Dynamiek en nuances

- Herkenbaar: ghost notes, korte stabs, een gat op tel 1 van sommige maten, accent op 1.
- Veelgemaakte fouten: alle noten even lang; geen ghost notes; bas drukt op alle zestienden; akkoorden te lang; swing op de kick.
- Variatie van velocity: 0,25 (ghost) tot 1,0 (accent).

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Funk & disco`, tunes `Funk` en `Disco`), [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Funk`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Funk & Disco`).
- Bas: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Funk`), [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Funk`), [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Funk & Disco`), [Cross Mod Mono](../../devices/synths/CrossModMono/AGENTS.md) (map `Funk & Disco`), [Patch Mono](../../devices/synths/PatchMono/AGENTS.md) (map `Funk & Disco`).
- Keys en strijkers: [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (mappen `Funk`, `Disco`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (mappen `Funk`, `Disco`), [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Disco & Funk`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (map `Disco & Funk`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Funk & Disco`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Funk & Disco` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Funk, Soul & Disco`), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (mappen `House and Disco`, `Funk and Jazz`), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (map `Bass Lines`).
- Effecten: [Chorus](../../devices/effects/Chorus/AGENTS.md), [Phaser](../../devices/effects/Phaser/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (map `Funk & disco`), BPM 112, swing 0,15 (funk) of 0 (disco).
2. Step Sequencer: funkbas (noot 40, ghosts) naar Basic Mono of Low Bass.
3. Chord Sequencer: spoor A `minor7` (root 52), `division: 1`, stab-patroon, naar Stage Keys.
4. Optioneel strijkers via een tweede Chord Sequencer-spoor naar Bowed Ensemble.
5. Chorus of Phaser op de keys; Mixer, Master Chain, Speakers.
