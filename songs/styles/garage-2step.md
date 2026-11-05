# Stijlgids: garage en 2-step

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Gebroken, swingende dansmuziek: de kick slaat niet op elke tel, de hats shufflen.
- Gesneden vocal- of akkoordstabs, ronde sub-bas, warme akkoorden.
- Lichtvoetig en sensueel; ruimte tussen de slagen.

## Tempo en maatsoort

- 4/4. Bereik 128 tot 140 BPM; typisch 130 tot 134.
- Swing: 0,2 tot 0,33 op hats en percussie; kick en snare recht.

## Toonsoort en harmonie

- Mineur of dorisch met jazzachtige akkoorden (m7, m9, maj7).
- Voorbeeld D mineur (D3 = 50): Dm7 = 50 53 57 60, Bbmaj7 = 46 50 53 57, Fmaj7 = 53 57 60 64, Cmaj7 = 48 52 55 59.
- Progressies: `i7 VI maj7 III maj7 VII` (Dm7 Bbmaj7 Fmaj7 C: 50 53 57 60 / 46 50 53 57 / 53 57 60 64 / 48 52 55), of `i7 iv7` (Dm7 Gm7).
- Akkoord 1 of 2 maten; cyclus van 4 of 8 maten.

## Ritme

Klassieke 2-step:

```
kick       X.........x.....     (stap 0 en 10; vel 1,0 / 0,8)
snare/clap ....X.......X...     (stap 4 en 12; vel 0,9)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,6; met swing 0,3)
hat open   ......o.......o.     (stap 6 en 14; vel 0,5)
ghost snr  ...g.....g...g.g     (stap 3, 9, 13, 15; vel 0,3)
```

- Shuffelende hats: verschuif elke tweede zestiende met swing 0,25 tot 0,33; laat sommige hats weg voor onregelmatigheid.
- Basfiguur (D1 = 26): `x.....x...x.....` (stap 0, 6, 10), noten 26 26 33 (grondtoon, kwint), gate 0,6; of slides tussen noten.
- Microtiming: kick en snare strak, ghosts en hats licht te laat.
- Fill: 1/32 tomrol of snareroll in de laatste maat van 8; of een stilte van een tel.

## Bas

- Ronde sub, sinus of driehoek; nootbereik 24 tot 45; korte tot middellange noten (gate 0,5 tot 0,8).
- Springerig ritme, grondtoon met octaaf en kwint, af en toe een slide.
- Velocity 0,75 tot 0,95; accent op stap 0.

## Akkoorden en pads

- Gesneden akkoordstabs op stap 0, 3, 6, 10 (`x..x..x...x.....`), gate 0,25 tot 0,4, vel 0,6 tot 0,85.
- Warme pad (Dm9: 50 53 57 60 64) in lange noten onder de stab, vel 0,4.
- Vocal-chops: korte noten (gate 0,3) op een enkele toonhoogte per maat.

## Melodie en lead

- Korte motieven van 3 tot 5 noten uit D dorisch (D5 = 74: 74 77 79 81 84), gesyncopeerd.
- Dichtheid 30 tot 50 procent; call and response met de stab.
- Een sprong van een kwint of octaaf op de eerste noot geeft karakter.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | hats, pad, stab |
| Opbouw | 8 | bas, kick en snare erbij |
| Hoofdgedeelte A | 16 | alle lagen; elke 4 maten variatie in de hats |
| Break | 8 | drums weg, pad en melodie |
| Hoofdgedeelte B | 16 | extra vocal-chops, bas hoger |
| Outro | 8 | afbouwen |

Totaal 64 maten; bij 132 BPM ongeveer 1 minuut 56.

## Dynamiek en nuances

- Herkenbaar: kick op stap 0 en 10, shufflende hats, ghost-snares, ronde sub.
- Veelgemaakte fouten: kick op elke tel (wordt house); hats zonder swing; te veel drukte in de bas; stabs te lang; drums te zwaar.
- Velocity-variatie op hats: 0,35 tot 0,7.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Drum & Bass`, tune `Two-Step`), [Pulse Drums](../../devices/drums/PulseDrums/AGENTS.md) (map `Breaks`, tune `Two-Step`), [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) (map `Drum & Bass and Breakbeat`, preset `Two-Step Break`).
- Bas: [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Garage`, `Two-Step Bass`), [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Garage`).
- Akkoorden: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Garage`, `Garage Stab`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Deep House`), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Deep House` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (tune `Two-Step`), BPM 132, swing 0,28.
2. Step Sequencer: bas (noot 26, patroon stap 0, 6, 10), naar Acid Stepper of Low Bass.
3. Chord Sequencer: spoor A `minor7` (root 50), `division: 1`, stab-patroon, naar Chord Poly (map `Garage`).
4. Room op de stab; licht Pump op de pad.
5. Mixer, Master Chain, Speakers.
