# Stijlgids: industrial

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Hard, mechanisch, rauw. Metaalachtige percussie, vervormde bas, dissonante texturen, ruis.
- Marcherend, repetitief ritme; weinig melodie, veel klank.
- Distortie en filter als instrument.

## Tempo en maatsoort

- 4/4. Bereik 100 tot 150 BPM; typisch 120 tot 135.
- Swing: 0. Strakke machinale timing.

## Toonsoort en harmonie

- Frygisch, locrisch, heletoon of chromatisch; tritonus en kleine secunde.
- Voorbeeld E frygisch (E1 = 28): grondtoon 28, kleine secunde 29, tritonus 34, kwint 35.
- Meestal één grondtoon, soms een cluster: E + F + Bb (52 53 58).
- Akkoordwissel hoogstens 1 per 8 maten; dissonanten blijven staan.

## Ritme

```
kick       X...X...X...X...     (hard, vervormd; vel 1,0)
metaal     ....X.......X...     (metaalslag in plaats van snare; vel 0,95)
hat/ruis   x.x.x.x.x.x.x.x.     (korte ruisbursts; vel 0,5)
perc       ..g..g..g..g..g.     (stap 2, 5, 8, 11, 14; vel 0,35; ander metaalgeluid)
```

- Marsritme: kick op elke tel, metaalslag op 2 en 4, extra slagen onregelmatig (stap 7, 10).
- Basfiguur (E1 = 28): `x.x.x.x.x.x.x.x.` of `x..x..x...x.....`, noten 28 28 29 28 34; gate 0,4 tot 0,7; vel 0,8 tot 1.
- Polyritme: een patroon van 7 of 5 stappen tegen 16 voor onregelmatige percussie (Step Sequencer `len` 7).
- Microtiming: geen; maar kleine willekeur (`prob` 0,8) op de percussie voor onrust.
- Fill: ruisroll of metaalroll op 1/32 met velocity 0,5 → 1,0.

## Bas

- Vervormde, mono bas; nootbereik 24 tot 48; korte hard geaccentueerde noten.
- Distortion (Grit) met hoge drive; filter met resonantie.
- Sidechain: Pump zodat de kick doorbreekt.

## Akkoorden en pads

- Drones en clusters: lange noten (16 stappen+) op E, F, Bb (52 53 58), vel 0,5 tot 0,7.
- Metaalachtige pads en ruis; langzaam filter bewegen.
- Geen zoete akkoorden; geen reverb-staart zonder reden.

## Melodie en lead

- Spaarzaam: korte ostinato's van 2 tot 4 noten (E F E Bb: 64 65 64 70), mechanisch herhaald.
- Lead vervormd; geen vibrato.
- Dichtheid 20 tot 40 procent; soms alleen een enkele schreeuw-of-sirene-lijn.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | drone en ruis |
| Opbouw | 8 | kick, metaal erbij |
| Hoofdgedeelte | 32 | alle lagen; elke 8 maten een nieuw element |
| Break | 8 | alleen drone, ruis en een enkele slag |
| Hoofdgedeelte 2 | 32 | harder, extra distortion |
| Outro | 8 | lagen eruit, stilte |

Totaal 96 maten; bij 128 BPM ongeveer 3 minuten.

## Dynamiek en nuances

- Herkenbaar: hardheid, repetitie, distortion, dissonantie, plotselinge stilte.
- Veelgemaakte fouten: te veel melodie; zachte velocity; reverb overal; opgeloste akkoorden; geen contrast tussen sectie en break.
- Houd het laag en hard; mix mono onder 120 Hz.

## Passende devices, tunes en presets

- Percussie en bas: [Foundry](../../devices/synths/Foundry/AGENTS.md) (mappen `Industrial`, `Metal Percussion`), [Dissonant Cluster](../../devices/synths/DissonantCluster/AGENTS.md) (map `Industrial`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Industrial`), [Click Synth](../../devices/drums/ClickSynth/AGENTS.md) (map `Industrial`), [Pulse Drums](../../devices/drums/PulseDrums/AGENTS.md) (map `Hard Techno`).
- Drones en texturen: [Drone Synth](../../devices/synths/DroneSynth/AGENTS.md) (map `Industrial`), [Paradox](../../devices/synths/Paradox/AGENTS.md) (map `Industrial`), [Layered Landscape](../../devices/synths/LayeredLandscape/AGENTS.md) (map `Industrial`).
- Sequencers: [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (`len` 7 voor polyritme), [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) (map `Odd Meters and Polymeters`), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Electronic Dance`).
- Effecten: [Grit](../../devices/effects/Grit/AGENTS.md), [Frequency Shifter](../../devices/effects/FrequencyShifter/AGENTS.md), [Resonator](../../devices/effects/Resonator/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md).

## Minimale startconfiguratie

1. Pulse Drums (map `Hard Techno`) of Foundry (`Metal Percussion`); BPM 128, swing 0.
2. Step Sequencer: bas (noot 28) naar Acid Stepper of Low Bass, met Grit.
3. Drone Synth (map `Industrial`) voor een lange noot E1 of een cluster.
4. Euclidean Rhythms (map `Odd Meters and Polymeters`) voor onregelmatige percussie.
5. Pump op bas en drone; Mixer, Master Chain, Speakers.

## Aanvullende werkafspraken

- Zet distortion op bas en percussie, niet op de hele mix.
- Gebruik per sectie één nieuw element (extra slag, nieuwe textuur) en laat de rest staan.
- Controleer dat de breaks echt leeg zijn: alleen drone en ruis.
