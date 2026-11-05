# Stijlgids: hiphop

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd. Voor trapdrums zie [trap](trap.md), voor de rustigere variant [lo-fi](lo-fi.md).

## Kenmerken

- Zware kick, harde snare op 2 en 4, swing op de hats, bas die de kick volgt.
- Een sample-achtige loop (akkoorden, stab, keys) van 2 of 4 maten onder een ritmische stem.
- Ruimte voor een zanger of rapper: het midden van de mix blijft vrij.

## Tempo en maatsoort

- 4/4. Bereik 70 tot 100 BPM (boom bap 85 tot 95; half-time gevoel van 140+).
- Swing: 0,12 tot 0,3. Op hats en ghosts meestal 0,2.

## Toonsoort en harmonie

- Mineur of dorisch, vaak één of twee akkoorden of een korte loop.
- Voorbeeld C mineur (C3 = 48): Cm7 = 48 51 55 58, Fm7 = 53 56 60 63, Abmaj7 = 56 60 63 67, Bb7 = 58 62 65 68.
- Progressies: `i7 iv7` (Cm7 Fm7), `i VI VII` (Cm Ab Bb: 48 51 55 / 56 60 63 / 58 62 65), `ii7 V7 i7`.
- Akkoordwissel elke maat of elke twee maten; loop van 2 of 4 maten.

## Ritme

Klassieke boom bap, één maat:

```
kick       X.....x...x.....     (stap 0, 6, 10; vel 1,0 / 0,8 / 0,85)
snare      ....X.......X...     (stap 4, 12; vel 1,0)
ghost snr  .......g.......g     (stap 7 en 15; vel 0,3)
hat gesl.  x.o.x.o.x.o.x.o.     (achtsten; vel 0,7 / 0,45)
```

- Swing 0,2 op de hats; de snare iets achter het raster (`mt` 0,03 stap) voor een zware, achterover gevoel.
- Basfiguur (C2 = 36): `x.....x...x.....` (stap 0, 6, 10), noten 36 36 39; gate 0,7 tot 1; of een lange sub-noot die glijdt.
- Fill: elke 4 maten een korte snare-roll of een weggelaten kick.
- Variatie: de hi-hat in de tweede maat van een tweemaatsloop anders (open hat op stap 14).

## Bas

- Sub of ronde bas, nootnummer 24 tot 40, lange noten (gate 0,8 tot 1,2) met glide.
- Volgt de kickpatroon; velocity 0,8 tot 1.
- Houd de sub mono; sidechain licht op de loop.

## Akkoorden en pads

- Keys of strijkers als loop, korte of lange noten; stoffig, met filter (hoge frequenties af).
- Akkoord op stap 0, vaak met een stab op stap 8 of 10.
- Houd de loop zacht (vel 0,5 tot 0,7) om ruimte voor de vocal te laten.

## Melodie en lead

- Korte hook (3 tot 5 noten) uit mineur pentatonisch (C: 72 75 77 79 82), dichtheid 20 tot 40 procent.
- Call and response met de vocal-ruimte; de hook zwijgt als de rapper spreekt (couplet) en speelt mee in het refrein.
- Een eenvoudige, herhaalde tonenreeks werkt beter dan een lange melodie.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | loop en hats |
| Couplet 1 | 16 | beat, bas, loop zacht; ruimte voor de vocal |
| Refrein | 8 | extra laag, hook, strings |
| Couplet 2 | 16 | zoals couplet 1 met variatie in de hats |
| Refrein | 8 | zoals eerder |
| Brug | 8 | drums weg, loop alleen |
| Refrein | 8 | alle lagen |
| Outro | 4 | afbouwen |

Totaal 72 maten; bij 90 BPM 3 minuten 12.

## Dynamiek en nuances

- Herkenbaar: harde snare op 2 en 4, ghost-snares, swingende hats, stevig sub.
- Veelgemaakte fouten: te weinig swing; te veel lagen in het couplet; sub en kick die elkaar wegdrukken; een loop zonder variatie.
- Velocity: kick 1,0, snare 1,0, hats 0,45 tot 0,7, loop 0,5 tot 0,7.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Hip-hop`, tunes `Boom Bap` en `Trap`), [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Hip-hop`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Hip-hop`).
- Bas: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Hip-hop`), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Hip-hop`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Hip-hop`), [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Hip-hop`), [Patch Mono](../../devices/synths/PatchMono/AGENTS.md) (map `Hip-hop`).
- Loops: [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Hip-hop & Lo-fi`), [Patchbay Synth](../../devices/synths/PatchbaySynth/AGENTS.md) (map `Hip-hop`), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md).
- Sequencers: [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Hip-Hop & Chill`, preset `Boom Bap Classic`, [presets](../../presets/clip-arranger.patchkamer-presets.json)), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Hip-hop and Soul`, preset `Boom Bap Cipher`, [presets](../../presets/pattern-playlist.patchkamer-presets.json)), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Filter](../../devices/effects/Filter/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (map `Hip-hop`, `Boom Bap`), BPM 90, swing 0,2.
2. Step Sequencer voor de bas (noot 36), naar Basic Mono of Sub Line.
3. Chord Sequencer (spoor A, `minor7`, root 48) naar Stage Keys of Four-Operator FM voor de loop.
4. Filter en Room op de loop; Pump licht op de loop.
5. Mixer, Master Chain, Speakers; laat ruimte voor een vocal.
