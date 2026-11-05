# Stijlgids: afrobeat en latin

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Lagen van ritmische patronen die samen een groove vormen: bel, shaker, congas, bas, gitaar- of keys-ostinato.
- Een kernritme (sleutelpatroon) of bel als ritmisch anker; elke stem heeft een eigen patroon.
- Afrobeat: lange vamps, 12/8-gevoel of 4/4 met syncope; latin: gebouwd op een kernritme (son, rumba), montuno-patroon.

## Tempo en maatsoort

- 4/4 of 12/8 (12 stappen per maat). Afrobeat 100 tot 125 BPM, salsa 160 tot 220, bossa nova 120 tot 150, reggaeton 85 tot 100.
- Swing: 0 tot 0,2; vaak recht met syncope in plaats van swing.

## Toonsoort en harmonie

- Dorisch, mixolydisch, majeur en mineur; vaak 1 of 2 akkoorden (vamp) of korte cyclus.
- Voorbeeld A dorisch/mineur (A3 = 57): Am7 = 57 60 64 67, D7 = 50 54 57 60, Dm7 = 50 53 57 60, E7 = 52 56 59 62.
- Salsa: `i iv V i` of `ii7 V7 Imaj7`; bossa: `Imaj7 ii7 V7 Imaj7` in C (Cmaj7 Dm7 G7 Cmaj7).
- Akkoord 1 of 2 maten; afrobeat-vamp kan 8 maten op één akkoord blijven.

## Ritme

Kernritmes in 16 stappen:

```
son 3-2    X..x..x...x.x...     (stap 0, 3, 6, 10, 12)
rumba 3-2  X..x...x..x.x...     (stap 0, 3, 7, 10, 12)
tresillo   X..x..x.X..x..x.     (3+3+2 twee keer)
```

12/8-bel (12 stappen, `div` `"0.75"` bij Euclidean Rhythms, of patroonlengte 12):

```
bel 7/12   x.xx.x.xx.x.         (12 stappen; vel 0,8)
shaker     xoxoxoxoxoxo         (12 stappen; vel 0,5 / 0,35)
```

- Afrobeat 4/4: kick `X..x..x...x.....`, snare `....X.......X...`, shaker `xoxoxoxoxoxoxoxo`, bel `x.x..x.x..x.x...`.
- Conga-tumbao: `..x.g.x.x..g.x..` (open slag stap 2/6/8/12, ghost 4/11; vel 0,3 tot 0,85).
- Bas (A1 = 33): tumbao `x..x..x.x..x....`, noten 33 33 40 (grondtoon, kwint), gate 0,5.
- Montuno-piano: syncoperende akkoorden `x..x.x..x..x.x..` (stap 0, 3, 5, 8, 11, 13), gate 0,3 tot 0,5.
- Microtiming: kernritme exact op het raster; ghost-slagen en shaker met `humV` 0,15.

## Bas

- Syncoperend, melodieus; grondtoon en kwint; bereik 28 tot 52.
- Afrobeat: repetitieve lijn die 8 maten herhaalt, met kleine variaties.
- Velocity 0,7 tot 0,9, accenten op de syncopen.

## Akkoorden en pads

- Gitaar- of piano-ostinato in 1/16 (Am7: 57 60 64 67), korte noten, vel 0,5 tot 0,8.
- Blazers: korte stabs (gate 0,3) op stap 0, 3, 8 (`x..x....x.......`), kleine melodische motieven.
- Orgel of strings als vulling (vel 0,4).

## Melodie en lead

- Call and response: blazers of lead vragen, de zanglijn (of tweede lead) antwoordt.
- Pentatonisch of dorisch (A: 69 72 74 76 79); korte frasen van 2 maten, syncoperend.
- Dichtheid 40 tot 60 procent; laat ruimte voor de percussie.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | percussie, bel, shaker |
| Vamp 1 | 16 | bas, drums, gitaar-ostinato |
| Blazers/thema | 16 | stabs en melodie |
| Solo/vamp 2 | 16 | extra lagen |
| Breakdown | 8 | alleen percussie en bas |
| Finale | 16 | alle lagen, hoger |
| Outro | 8 | afbouwen |

Totaal 88 maten; bij 110 BPM ongeveer 3 minuten 12.

## Dynamiek en nuances

- Herkenbaar: gelaagde patronen, syncope, geen enkele stem die alles speelt, geleidelijke opbouw.
- Veelgemaakte fouten: alle percussie op dezelfde slagen; een kernritme dat verschuift; te veel akkoordwissel; vaste velocity.
- Velocity per laag: bel 0,7, shaker 0,35 tot 0,5, conga 0,3 tot 0,85, bas 0,7 tot 0,9.

## Passende devices, tunes en presets

- Percussie: [Latin Percussion](../../devices/drums/LatinPercussion/AGENTS.md); tunes in [latin-percussion-styles](../../tunes/latin-percussion-styles.patchkamer-tunes.json), mappen `Salsa`, `Son`, `Mambo`, `Cha-Cha-Cha`, `Rumba`, `Bossa Nova`, `Samba`, `Merengue`, `Bachata`, `Cumbia`, `Reggaeton`, `Latin Jazz`, `Latin Soul`.
- Rhythm: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md), map `Afro & Latin` in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json); [Pattern Tracker](../../devices/sequencers/PatternTracker/AGENTS.md), map `World and Latin` (`Bossa Nova Rows`, `Samba Batucada Rows`); [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md), map `Reggae & World`.
- Bas en keys: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md), [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Funk`), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (mappen `Funk`, `Jazz`), [Karplus String](../../devices/synths/KarplusString/AGENTS.md) (mappen `World`, `Flamenco`).
- Blazers: [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Funk`), [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md).

## Minimale startconfiguratie

1. Latin Percussion (tune uit `Son` of `Rumba`) op de klok; BPM 110.
2. Euclidean Rhythms (map `Afro & Latin`) voor extra bel en shaker, naar dezelfde Latin Percussion (poort `notes`) of een Drum Kit.
3. Step Sequencer: bas (noot 33, tumbao), naar Low Bass.
4. Chord Sequencer spoor A: `minor7` ostinato (`division: 1`) naar Stage Keys of Karplus String.
5. Blazers via Step Sequencer naar Triple Osc Poly; Room licht.
6. Mixer, Master Chain, Speakers.
