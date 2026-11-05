# Stijlgids: house

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Dansbaar, warm, groovy. Vier op de vloer met een duidelijke offbeat-hat en een swingende bas.
- Akkoordstabs of een piano- of orgelachtig akkoordpatroon, vaak met sidechain-pomp.
- Herhalende lussen van 4 of 8 maten; verandering door lagen aan en uit te zetten.

## Tempo en maatsoort

- 4/4. Bereik 118 tot 130 BPM; klassiek 122 tot 126.
- Swing: 0,12 tot 0,25 op hats en percussie; kick recht. Host-swing 0,15 is een goed begin (pas op dat je swing niet dubbel zet via de sequencer).

## Toonsoort en harmonie

- Mineur of dorisch; ook majeur. Zevende-akkoorden (m7, maj7, dom7) geven de warme kleur.
- Voorbeeld C dorisch/mineur (C3 = 48): Cm7 = 48 51 55 58, Fm7 = 53 56 60 63, Bb = 46 50 53.
- Progressies: `i7 IV7` (Cm7 F7: 48 51 55 58 / 53 57 60 63), `ii7 V7` (Dm7 G7: 50 53 57 60 / 55 59 62 65), `I vi ii V` (C Am Dm G: 48 52 55 / 57 60 64 / 50 53 57 / 55 59 62).
- Twee-akkoordenpendel (8 maten) is gebruikelijk; elk akkoord 2 maten (of 1 maat bij de stab).

## Ritme

```
kick       X...X...X...X...     (stap 0,4,8,12; vel 1,0 / 0,95)
clap       ....X.......X...     (stap 4,12; vel 0,85; of snare)
hat open   ..X...X...X...X.     (offbeat; vel 0,8; gate 0,5 tot 0,9)
hat gesl.  xoxoxoxoxoxoxoxo     (x 0,6 / o 0,4)
shaker     .gog.gog.gog.gog     (g 0,3 / o 0,45)
```

- Basfiguur (gesyncopeerd, C2 = 36): `x..x..x...x.x...` op de noten 36 36 36 36 43 (octaaf of kwint erbij), gate 0,5.
- Groove: swing 0,15 op de hats; ghost-percussie op stap 3, 11. Microtiming: de clap 0,02 tot 0,05 stap te laat (`mt` in Step Sequencer) voor laid-back.
- Variatie: elke 4 maten een extra percussie-slag; elke 8 maten een korte tom- of claproll (1/32, stijgende velocity) of een enkele tel stilte.

## Bas

- Mono of sub, nootnummer 36 tot 48. Gesyncopeerd, octaafsprongen (36 / 48) of grondtoon-kwint (36 / 43).
- Gate 0,4 tot 0,7, velocity 0,7 tot 0,95, accent op de eerste noot van de maat.
- Offbeat-bas (stap 2, 6, 10, 14) laat de kick ademen; loopt vaak mee met de akkoordwisseling (maatgrenzen).
- [Pump](../../devices/effects/Pump/AGENTS.md) op bas en akkoorden voor het pompen.

## Akkoorden en pads

- Stab-pattern: kort akkoord (gate 0,3 tot 0,5) op stap 3, 6, 10 of 3, 7, 10, 14 (`..x..x...x.x....`), vel 0,6 tot 0,85, accent op de eerste.
- Piano- of orgelachtig sound met 7e en 9e; mineur 9 (Cm9: 48 51 55 58 62) voor warmte.
- Pad onder de stab op vel 0,4 voor vulling; laag in het mix (zie sectie 11 van [MUSIC-THEORY](../MUSIC-THEORY.md#11-mixen-op-hoofdlijnen)).

## Melodie en lead

- Korte hook van 4 tot 8 noten, vaak één maat, uit mineur pentatonisch (C: 60 63 65 67 70) of dorisch; call and response in twee maten.
- Dichtheid 30 tot 50 procent. Herhaal de hook elke 2 maten, varieer de laatste noot.
- Vocal-achtige chops (korte, afgekapte noten) op stap 2, 3, 6, 11 geven karakter.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | kick en hats, daarna shaker en percussie |
| Opbouw | 8 | bas erbij, filter van de stab opent langzaam |
| Hoofdgedeelte A | 16 | alle lagen: kick, bas, stab, clap, hat |
| Break | 8 | kick en bas weg, pad en hook; riser in laatste 2 maten |
| Hoofdgedeelte B | 16 | extra laag (lead of percussie), filter open |
| Outro | 16 | lagen één voor één eruit |

Totaal 80 maten, bij 124 BPM ongeveer 2 minuten 35.

## Dynamiek en nuances

- Herkenbaar: swingende hats, een kick die nooit overslaat, een bas die het raster tegenspreekt, stabs met reverb-staarten.
- Veelgemaakte fouten: te strakke hats (swing 0); bas en kick op precies dezelfde slagen zonder sidechain; akkoorden te dicht en te laag (onder 48); te lange stab-gate waardoor het een pad wordt.
- Laat de pomp subtiel: 2 tot 4 dB ducking.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md); tunes in [drum-kit-styles](../../tunes/drum-kit-styles.patchkamer-tunes.json) en [drum-machine-styles](../../tunes/drum-machine-styles.patchkamer-tunes.json), map `House`. [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) heeft in [loop-slicer-styles](../../tunes/loop-slicer-styles.patchkamer-tunes.json) de map `House`.
- Bas: [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `House`), [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Techno & House`), [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `House`).
- Stabs: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `House`), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `House`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `House`).
- Sequencers: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json), map `House`; [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) in [pattern-playlist](../../presets/pattern-playlist.patchkamer-presets.json), map `Dance Floor`; [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) in [scale-arpeggiator](../../presets/scale-arpeggiator.patchkamer-presets.json), map `House and Disco`.
- Effecten: [Pump](../../devices/effects/Pump/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md), [Chorus](../../devices/effects/Chorus/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (tune uit map `House`), BPM 124, swing 0,15.
2. Step Sequencer voor de bas (noot 36, syncopen), naar Sub Line of Low Bass.
3. Chord Sequencer voor de stab: spoor A, `mode: chord`, `minor7`, `division: 1` of 2, naar Chord Poly of Stage Keys.
4. Pump op bas en stab; Room op de stab.
5. Mixer, Master Chain, Speakers.

## Aanvullende werkafspraken

- Controleer dat de hats swing hebben maar de kick niet, en dat de stab niet langer dan een achtste duurt.
- Zet elke 8 maten een kleine verandering (extra percussie, filterstap).
- Schrijf de bas in een eigen register (36 tot 48) onder de stab (48 en hoger).
