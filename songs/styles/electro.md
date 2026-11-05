# Stijlgids: electro

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Robotachtig, strak, koel. Gesyncopeerde kick, klap of snare op 2 en 4, korte synth-bleeps.
- Bas als ritmische hoofdstem; vocoder- of robotstem optioneel.
- Futuristisch en machinaal, geen swing.

## Tempo en maatsoort

- 4/4. Bereik 110 tot 135 BPM; typisch 120 tot 128.
- Swing: 0 tot 0,05.

## Toonsoort en harmonie

- Mineur of frygisch, vaak één grondtoon; kleine terts en kwint.
- Voorbeeld C mineur (C2 = 36): Cm = 48 51 55, Gm = 55 58 62, Ab = 56 60 63, Bb = 58 62 65.
- Progressie `i bVI bVII` (Cm Ab Bb: 48 51 55 / 56 60 63 / 58 62 65) of `i iv` (Cm Fm).

## Ritme

```
kick       X..x..x...x.x...     (stap 0, 3, 6, 10, 12; vel 1,0 / 0,8)
snare/clap ....X.......X...     (stap 4, 12; vel 0,9)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,6 / 0,4)
hat open   ......o.......o.     (stap 6, 14; vel 0,5)
perc       ..g...g..g...g..     (rimshot/conga, vel 0,3)
```

- Kick met de Euclidische 5/16-structuur: `x...x..x..x..x..` ([Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) steps 16, pulses 5).
- Basfiguur (C2 = 36, 16 stappen): `x..x..x...x..x..` met noten 36 36 39 36 43, gate 0,5, accent op de eerste; 1/16 arpeggio (36 43 36 39) voor een sequenzer-puls.
- Microtiming: geen; maar ghost-percussie met `humV` 0,1.
- Fill: een snelle tomrol op 1/32 of een bleep-run (korte noten, stijgend).

## Bas

- Mono, nootnummer 24 tot 48. Korte noten (gate 0,3 tot 0,5) of een pulserende 1/16 (alle stappen, vel 0,6, accenten op 0, 6, 12).
- Zaagtand of puls met filter en snelle envelope; af en toe slide.
- Sidechain licht (Pump) of niet.

## Akkoorden en pads

- Koele pad (Cm: 60 63 67) of strakke stab op stap 0 en 10; gate 0,25 tot 0,5; vel 0,6.
- Strings of koorachtige toon voor achtergrond. Chorus op het pad.
- Vocoder: stem als zaagtand-akkoord, zie [Vocoder](../../devices/effects/Vocoder/AGENTS.md).

## Melodie en lead

- Bleep-lead: 2 tot 5 noten, mineur pentatonisch (C: 72 75 77 79 82), gate 0,3, korte rusten.
- Dichtheid 30 tot 50 procent, call-and-response tussen lead en bas.
- Pitch-slides of kleine sprongen; reverb en delay.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | kick en hats, bleep |
| Opbouw | 8 | bas erbij, perc erbij |
| Hoofdgedeelte A | 16 | alle lagen |
| Break | 8 | drums en bas weg, pad en bleep |
| Hoofdgedeelte B | 16 | alle lagen, lead hoger |
| Outro | 8 | lagen eruit |

Totaal 64 maten; bij 124 BPM ongeveer 2 minuten 4.

## Dynamiek en nuances

- Herkenbaar: gesyncopeerde kick, korte noten, koude pad, kleine velocity-verschillen.
- Veelgemaakte fouten: swing toevoegen (verliest strakheid); te veel akkoorden; lange noten in plaats van korte; bas en kick op dezelfde slagen zonder sidechain.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md), [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Electro`, tunes `Breakbeat` en `Robot`), [Click Synth](../../devices/drums/ClickSynth/AGENTS.md) (map `Electro`), [Pulse Drums](../../devices/drums/PulseDrums/AGENTS.md) (map `Electro`).
- Bas: [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Electro`), [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Electro`), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Electro`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Electro`), [Cross Mod Mono](../../devices/synths/CrossModMono/AGENTS.md) (map `Electro`).
- Pads en stabs: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Electro`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Electro`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Electro`).
- Sequencers: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) ([presets](../../presets/euclidean-rhythms.patchkamer-presets.json)), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (map `Bass Lines`).
- Effecten: [Vocoder](../../devices/effects/Vocoder/AGENTS.md), [Chorus](../../devices/effects/Chorus/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md).

## Minimale startconfiguratie

1. Drum Machine of Drum Kit (map `Electro`), BPM 124, swing 0.
2. Step Sequencer: bas (noot 36, korte noten) naar Duofone of Basic Mono.
3. Step Sequencer 2 of Wanderer (`minor pentatonic`, root 72) voor de bleep-lead.
4. Chorus en Room op het pad.
5. Mixer, Master Chain, Speakers.

## Aanvullende werkafspraken

- Houd alle patronen op het raster; variatie komt uit weggelaten slagen en velocity.
- Geef de bleep-lead en de bas elk een eigen register (72 tot 84 en 24 tot 48).
- Controleer dat de kick niet samenvalt met de bas zonder sidechain.
