# Stijlgids: breakbeat

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Gebroken, gesyncopeerde drums in plaats van vier op de vloer; ghost-snares en verschoven kicks.
- Funky bas, filterstabs en samples of korte hooks; breakbeat-loops die elke maten licht variëren.
- Energiek, dansbaar, speels.

## Tempo en maatsoort

- 4/4. Bereik 120 tot 140 BPM; klassiek 125 tot 135. Snellere varianten (150+) neigen naar jungle.
- Swing: 0,05 tot 0,2; ghost-noten dragen de groove.

## Toonsoort en harmonie

- Mineur, dorisch of blues; vaak één of twee akkoorden.
- Voorbeeld D dorisch (D3 = 50): Dm7 = 50 53 57 60, G7 = 55 59 62 65; pendel `i7 IV7`.
- Bas volgt de grondtoon met kwint en septiem (D2 = 38, A2 = 45, C3 = 48).

## Ritme

Basisbreak:

```
kick       X.....x...x.....     (stap 0, 6, 10; vel 1,0 / 0,8 / 0,85)
snare      ....X.......X...     (stap 4, 12; vel 1,0)
ghost snr  .g.g..g..g.g..g.     (vel 0,25 tot 0,4; wisselend per maat)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,65 / 0,45)
hat open   ..............o.     (stap 14, vel 0,5)
```

Tweede maat van een tweemaatsloop (andere kicks, andere snare-ghost):

```
kick       X.......x.x.....     (stap 0, 8, 10)
snare      ....X.......X..g     (stap 4, 12; ghost stap 15)
```

- Fill: elke 4 maten laatste maat met snare-rol op 1/32 (stijgende velocity) of een omgekeerd slagenpatroon.
- Microtiming: ghosts 0,02 tot 0,05 stap te laat; hats licht schuin (`humT` 0,1).
- Basfiguur: `x..x..x...x..x..`, noten 38 / 38 / 45 / 48, gate 0,5; accent op de eerste.

## Bas

- Funky: octaafsprongen en kwint (38 / 50 / 45), gate 0,4 tot 0,6, velocity 0,7 tot 0,95; glide af en toe.
- Sub-lijn voor zwaardere varianten (nootnummer 28 tot 40).
- Pump niet nodig, maar een lichte sidechain op de kick houdt de ruimte vrij.

## Akkoorden en pads

- Filterstab op stap 3 en 10 (`...x......x.....`) gate 0,25, vel 0,6 tot 0,8, akkoord Dm7 (50 53 57 60).
- Gesamplede of orgelachtige hook; pads onder een break.
- Stereo-brede achtergrond en een smalle lead in het midden.

## Melodie en lead

- Korte, speelse hook van 4 tot 6 noten uit D dorisch (62 64 65 67 69 72), gesyncopeerd.
- Call and response over twee maten; variatie door de laatste noot te verplaatsen.
- Acid- of electro-lijn mogelijk, zie [electro](electro.md).

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | break en hats, filter dicht |
| Opbouw | 8 | bas en stab erbij |
| Hoofdgedeelte A | 16 | alle lagen; elke 4 maten kleine breakvariatie |
| Break | 8 | drums weg, hook of pad |
| Hoofdgedeelte B | 16 | extra percussie, hook hoger |
| Outro | 8 | afbouwen |

Totaal 64 maten; bij 130 BPM ongeveer 2 minuten.

## Dynamiek en nuances

- Herkenbaar: ghost-snares, verschoven kicks, funky bas, wisselende fills.
- Veelgemaakte fouten: kick op elke tel (wordt house); ghost-snares met dezelfde velocity als de hoofdsnare; geen variatie na 4 maten; hats te hard.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) (map `Electro`, tune `Breakbeat`), [Pulse Drums](../../devices/drums/PulseDrums/AGENTS.md) (map `Breaks` in [pulse-drums-techno](../../tunes/pulse-drums-techno.patchkamer-tunes.json)), [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Breakbeat` in [loop-slicer-styles](../../tunes/loop-slicer-styles.patchkamer-tunes.json)), [Click Synth](../../devices/drums/ClickSynth/AGENTS.md) (map `Breakbeat`).
- Bas: [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Breakbeat`), [Low Bass](../../devices/synths/LowBass/AGENTS.md).
- Sequencers: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) (map `Drum & Bass and Breakbeat` in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json)), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Bass Music`, preset `Jungle Breakbeat Roller`).
- Effecten: [Filter](../../devices/effects/Filter/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md), [Grit](../../devices/effects/Grit/AGENTS.md).

## Minimale startconfiguratie

1. Loop Slicer (tune uit `Breakbeat`) of Drum Kit; BPM 130, swing 0,1.
2. Step Sequencer voor de bas (noot 38, `len` 16), naar Acid Stepper of Low Bass.
3. Chord Sequencer (spoor A, `minor7`, root 50) voor de stab naar Chord Poly.
4. Filter en Room op de stab.
5. Mixer, Master Chain, Speakers.
