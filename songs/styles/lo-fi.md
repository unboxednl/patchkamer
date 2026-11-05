# Stijlgids: lo-fi

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Warm, stoffig, rustig. Jazz-akkoorden (m7, maj7, 9), zachte drums met swing, lichte ruis en pitch-wobble.
- Korte lussen van 2 of 4 maten; de nadruk ligt op sfeer, niet op virtuositeit.
- Onvolmaaktheid is het doel: kleine timing- en velocity-verschillen.

## Tempo en maatsoort

- 4/4. Bereik 70 tot 90 BPM; typisch 75 tot 85.
- Swing: 0,15 tot 0,3; hoog genoeg om te voelen, laag genoeg om niet shuffle te worden.

## Toonsoort en harmonie

- Majeur of mineur met jazz-uitbreidingen (7e, 9e).
- Voorbeeld C majeur (C3 = 48): `ii7 V7 Imaj7 vi7` = Dm7 G7 Cmaj7 Am7 (50 53 57 60 / 55 59 62 65 / 48 52 55 59 / 57 60 64 67).
- Alternatief D mineur: `i7 iv7 VII7 IIImaj7` (Dm7 Gm7 C7 Fmaj7).
- Akkoordwissel elke maat of elke twee maten; cyclus van 4 of 8 maten.

## Ritme

```
kick       X.......X.x.....     (stap 0, 8, 10; vel 0,9 / 0,7)
snare      ....x.......x...     (stap 4, 12; vel 0,7; zacht)
hat gesl.  o.o.o.o.o.o.o.o.     (achtsten; vel 0,4)
ghost hat  .g.g.g.g.g.g.g.g     (vel 0,2 tot 0,3; met swing)
```

- Swing 0,2; kick en snare enigszins vertraagd (`mt` 0,03 tot 0,08 stap) voor een laid-back gevoel.
- Basfiguur (C2 = 36): `x.....x...x.....` (stap 0, 6, 10), noten 36 43 38, gate 0,7.
- Variatie: elke 4 maten een hat weglaten; elke 8 maten een kleine fill (rimshot op stap 14).
- Humanize: `humV` 0,15 en `humT` 0,15 op de drums.

## Bas

- Rond, warm, laag filter; nootnummer 28 tot 45; gate 0,6 tot 1.
- Volgt de akkoordgrondtonen met af en toe een doorgangsnoot (kwint of leidtoon).
- Velocity 0,6 tot 0,8; geen sterke accenten.

## Akkoorden en pads

- Elektrische-piano-, gitaar- of orgelklank met 7e en 9e akkoorden, gespeeld in omkeringen (voice leading).
- Akkoord op stap 0 en 6, gate 0,5 tot 0,9, vel 0,4 tot 0,65 met wisselende velocity per noot.
- Chorus en tape-wobble; lage filterafsnijding.

## Melodie en lead

- Eenvoudig, spaarzaam: motief van 3 tot 6 noten uit majeur pentatonisch (C: 72 74 76 79 81) of dorisch.
- Dichtheid 20 tot 40 procent; veel rusten, lange noten (gate 1).
- Variatie door één noot per herhaling te veranderen.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | akkoorden en ruis |
| Loop A | 8 | drums, bas, akkoorden |
| Loop B | 8 | melodie erbij |
| Break | 4 | drums weg, akkoorden |
| Loop A' | 8 | alle lagen, kleine variatie |
| Outro | 4 | afbouwen |

Totaal 36 maten; bij 80 BPM ongeveer 1 minuut 48. Lo-fi lussen worden vaak herhaald; verleng door de loops te herhalen.

## Dynamiek en nuances

- Herkenbaar: zachte velocity, swing, jazz-akkoorden, lichte ruis, lage filter.
- Veelgemaakte fouten: te harde kick; strakke hats zonder swing; te simpele akkoorden (alleen drieklanken); te veel lagen; geen vertraging op de snare.

## Passende devices, tunes en presets

- Akkoorden: [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `Lo-fi`), [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Lo-fi`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Lo-fi`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Lo-fi`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (map `Lo-fi`), [Karplus String](../../devices/synths/KarplusString/AGENTS.md) (map `Lo-fi`), [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Hip-hop & Lo-fi`).
- Pads en texturen: [Mist](../../devices/synths/Mist/AGENTS.md) (map `Lo-fi`), [Layered Landscape](../../devices/synths/LayeredLandscape/AGENTS.md) (map `Lo-fi`), [Biotope](../../devices/synths/Biotope/AGENTS.md) (map `Lo-fi`).
- Drums: [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Hip-hop`, tune `Dusty Lo-fi`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Lo-fi`), [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) (map `Hip-hop`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Lo-fi` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Hip-Hop & Chill`, preset `Lo-fi Late Night`), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Hip-hop and Soul`, preset `Lo-fi Rainy Window`).
- Effecten: [Chorus](../../devices/effects/Chorus/AGENTS.md), [Grit](../../devices/effects/Grit/AGENTS.md), [Tremolo](../../devices/effects/Tremolo/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md), [Filter](../../devices/effects/Filter/AGENTS.md).

## Minimale startconfiguratie

1. Loop Slicer of Drum Kit (zacht, hiphop-map); BPM 80, swing 0,2.
2. Chord Sequencer spoor A `minor7` (root 50) naar Stage Keys; spoor B bas `single` (root 38) naar Basic Mono.
3. Step Sequencer voor een kleine melodie.
4. Chorus, Grit (licht) en Room op de akkoorden; Filter dicht (hoge frequenties af).
5. Mixer, Master Chain, Speakers; houd het stil (velocity ≤ 0,7).

## Aanvullende werkafspraken

- Maak de lussen kort (4 of 8 maten) en laat de menselijke onvolkomenheden uit velocity en `mt` komen.
- Houd alle velocities onder 0,85; geen noot op exact 1,0 behalve eventueel de kick.
- Controleer dat de akkoorden een zevende of negende hebben en dat de swing op de hats staat.
