# Stijlgids: reggae en dub

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Reggae: offbeat-akkoorden (skank), diepe, melodieuze bas, drums met nadruk op tel 3 (one drop).
- Dub: dezelfde basis maar met veel echo, hall en wegvallende lagen; mix als instrument.
- Ruim, relaxed, veel lucht.

## Tempo en maatsoort

- 4/4 (gevoeld in twee). Reggae 65 tot 85 BPM (one drop vaak rond 70), steppers 120 tot 140, dub 60 tot 80.
- Swing: 0,15 tot 0,3 op de achtsten; de offbeat wordt licht vertraagd.

## Toonsoort en harmonie

- Mineur of majeur met eenvoudige akkoorden; vaak twee akkoorden of een korte cyclus.
- Voorbeeld A mineur (A2 = 45): Am = 57 60 64, Dm = 50 53 57, G = 55 59 62; `i iv` of `i VII` (Am G: 57 60 64 / 55 59 62).
- Majeur: `I IV` (C F) of `I vi ii V` (C Am Dm G).
- Akkoord 1 of 2 maten per wissel; dub blijft vaak op één akkoord.

## Ritme

One drop (de kick valt samen met de snare op tel 3):

```
kick       ........X.......     (stap 8; vel 1,0)
snare/rim  ........x.......     (stap 8; rim vel 0,8)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,6; met swing)
```

Steppers (kick op elke tel):

```
kick       X...X...X...X...
snare      ........x.......
hat open   ..o...o...o...o.
```

- Skank (akkoorden op de offbeat): `..x...x...x...x.` (stap 2, 6, 10, 14), gate 0,2 tot 0,35, vel 0,6 tot 0,85.
- Basfiguur (A1 = 33): lange, melodieuze noten, bv. `x.....x.x.......` met noten 33 36 40 (A C E), gate 0,8, accent op tel 1.
- Fill: tom- of snareroll op 1/16 in de laatste maat van 4; in dub wordt de fill vaak met delay vervangen door stilte.
- Microtiming: skank en hats 0,03 tot 0,08 stap achter het raster; swing 0,2.

## Bas

- Rond, diep; nootbereik 24 tot 45; lange noten (gate 0,8 tot 1) met sub-gewicht.
- Melodieuze lijn tussen grondtoon, kwint en octaaf; veel rust (50 procent van de stappen).
- Sidechain niet nodig; laat de bas boven de kick uitkomen.

## Akkoorden en pads

- Skank: orgel of piano op de offbeat, korte noten, akkoord Am (57 60 64).
- Bubble-orgel: afwisselend achtste noten op stap 0, 2, 4... met velocity-patroon 0,6 / 0,8.
- Echo op de skank: delay op 3/16 (gedotteerde achtste) of 1/8, feedback 40 tot 60 procent.

## Melodie en lead

- Eenvoudige, zingbare lijn; melodica- of fluitachtig. Lange noten (gate 1,2), veel ruimte.
- Mineur pentatonisch (A: 69 72 74 76 79), dichtheid 20 tot 40 procent.
- In dub: de lead wordt gebruikt voor korte echo-fragmenten.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | drums en bas, daarna skank |
| Couplet | 16 | alle lagen |
| Refrein | 8 | extra orgel/melodie |
| Dub-sectie | 16 | drums, bas; skank en melodie door delay; lagen wegvallen en terugkomen |
| Couplet | 16 | zoals eerder |
| Outro | 8 | afbouwen, galm blijft staan |

Totaal 72 maten; bij 72 BPM ongeveer 4 minuten.

## Dynamiek en nuances

- Herkenbaar: offbeat-akkoorden, kick/snare op tel 3, melodieuze bas, veel echo.
- Veelgemaakte fouten: skank op de tel in plaats van de offbeat; te druk; te weinig ruimte; echo op de kick; bas die niet melodisch is.
- Dub: automatiseer sends (echo) en kanaalmute voor het "mixen als instrument".

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (mappen `Hip-hop` en `Funk & disco`; reggae is geen aparte map, bouw het patroon zelf of gebruik [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md), map `Dub & Reggae` in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json)), [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Dub`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Dub`).
- Bas: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Dub`), [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Dub`), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Dub`), [Patch Mono](../../devices/synths/PatchMono/AGENTS.md) (map `Dub`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Dub`).
- Orgel en skank: [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `Reggae`).
- Sequencers: [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Reggae & World`, presets `Reggae One Drop` en `Roots Dub Echoes`), [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md) (delay en hall), [Filter](../../devices/effects/Filter/AGENTS.md), [Tremolo](../../devices/effects/Tremolo/AGENTS.md).

## Minimale startconfiguratie

1. Euclidean Rhythms (map `Dub & Reggae`) of Drum Kit; BPM 72, swing 0,2.
2. Step Sequencer: bas (noot 33, lange noten) naar Basic Mono of Low Bass.
3. Chord Sequencer: spoor A `minor`, `division: 1`, `steps` op de offbeat, naar Stage Keys (map `Reggae`).
4. Room met delay-feedback op de skank; Filter-sweep op de bas in de dub-sectie.
5. Mixer (sends) en automatisering van mute; Master Chain, Speakers.
