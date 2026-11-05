# Stijlgids: synthwave

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Nachtelijke, nostalgische elektronische pop-rock uit de jaren 80. Gated reverb op de snare, pulserende achtstenbas, brede pads, arpeggio's.
- Melodieën zijn zingbaar en emotioneel, vaak in mineur.
- Retro-drumcomputers, lopende bas en lange hall.

## Tempo en maatsoort

- 4/4. Bereik 80 tot 120 BPM; typisch 96 tot 112. Half-time varianten rond 80.
- Swing: 0 tot 0,1.

## Toonsoort en harmonie

- Natuurlijk mineur, soms majeur. Eenvoudige progressies.
- Voorbeeld A mineur (A3 = 57): `i VI III VII` = Am F C G (57 60 64 / 53 57 60 / 48 52 55 / 55 59 62), elk akkoord 1 maat (cyclus van 4) of 2 maten.
- Alternatieven: `i VII VI VII`, `i iv VI V`.
- Bas speelt de grondtonen (A1 = 33, F1 = 29, C2 = 36, G1 = 31) in achtsten.

## Ritme

```
kick       X...x...X...x...     (stap 0,4,8,12; vel 1,0 / 0,8)
snare      ....X.......X...     (stap 4, 12; vel 1,0, met gated reverb)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,6 / 0,45)
tom fill   ............xoxo     (laatste maat van 4: toms 1/16, vel 0,7)
```

- Basfiguur (achtsten): `x.x.x.x.x.x.x.x.` met alle noten op de grondtoon (A1 = 33), gate 0,5, accent op stap 0 en 8; of octaafpulserend 33 / 45 / 33 / 45.
- Arpeggio 1/16 over het akkoord, `up`, gate 0,4, vel 0,55 tot 0,75, accent op de eerste.
- Microtiming: geen swing; hooguit `humV` 0,1.
- Fill: tomrol of snareroll in de laatste maat van elke 4 of 8 maten.

## Bas

- Mono, nootnummer 28 tot 45. Pulserend op achtsten met zaag of puls, gate 0,5, velocity 0,8; of lopende bas.
- Volgt akkoordgrondtonen (A, F, C, G), maatwissel op tel 1.
- Octaafsprong op stap 4 en 12 voor beweging.

## Akkoorden en pads

- Brede polyfone pad (Am: 57 60 64) in lange noten (gate 1), vel 0,5, met chorus.
- Stabs: Am op stap 0 en 6 voor ritme; string-achtige toon.
- Arpeggio's naast de pad: dezelfde akkoordtonen in 1/16.

## Melodie en lead

- Zingbare lead, 4 tot 8 noten per frase, mineur pentatonisch plus de grote sext (A: 69 72 74 76 79 81).
- Lange noten (2 tot 4 stappen) afgewisseld met korte; hoogtepunt in de refrein-lead (+12).
- Dichtheid 40 tot 60 procent; echo/delay op de lead.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | pad en arpeggio; hats |
| Couplet | 16 | kick, bas, snare, pad; arp zachter |
| Refrein | 16 | alle lagen, lead, arp luider |
| Couplet 2 | 16 | zoals couplet met extra arp |
| Refrein 2 | 16 | zoals refrein, lead +12 |
| Brug | 8 | alleen pad, arp en lead |
| Refrein 3 | 16 | alle lagen, extra tom-fills |
| Outro | 8 | afbouwen |

Totaal 104 maten; bij 108 BPM ongeveer 3 minuten 51.

## Dynamiek en nuances

- Herkenbaar: gated snare, pulserende bas, brede pads, langzame filteropening.
- Veelgemaakte fouten: te veel swing; te korte pads; bas die niet de grondtonen volgt; geen akkoordwisseling per maat; te veel hoge frequenties in de pad.
- Velocity: pad 0,5, arp 0,6, lead 0,7 tot 0,85.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Synthwave`, tunes `Retro Drive` en `Night Ride`).
- Bas: [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Synthwave`), [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Synthwave`), [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Synthwave`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Synthwave`).
- Pads en leads: [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Synthwave`), [Supersaw Swarm](../../devices/synths/SupersawSwarm/AGENTS.md) (map `Synthwave`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Synthwave`), [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Synthwave`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (map `Synthwave`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Synthwave` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Synthwave and Retro`), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (map `Melodic Hooks`, o.a. `Synthwave Lead`), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Retro & Game`, `Synthwave Night Drive`).
- Effecten: [Chorus](../../devices/effects/Chorus/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md), [Phaser](../../devices/effects/Phaser/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (map `Synthwave`), BPM 104, swing 0.
2. Step Sequencer: bas in achtsten (noot 33), naar Sub Line.
3. Chord Sequencer: spoor A pad (`fifth` of `minor`, root 57, progressie `[0,-4,3,-2]` met `fifth`), naar Poly Chorus.
4. Scale Arpeggiator op de pad-akkoorden, naar een tweede synth (Triple Osc Poly).
5. Room (lange hall) op de snare en lead, Chorus op de pad.
6. Mixer, Master Chain, Speakers.
