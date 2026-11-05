# Stijlgids: ballad

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Langzaam, expressief, melodie voorop. Zacht begin, geleidelijke opbouw naar een emotioneel refrein.
- Piano of gitaar, strijkers, zachte drums of geen drums in het begin.
- Veel ademruimte; elke frase krijgt tijd.

## Tempo en maatsoort

- 4/4 (soms 6/8 of 12/8). Bereik 55 tot 85 BPM; typisch 62 tot 72.
- Swing: 0, of 0,2 voor een zacht 6/8-gevoel.

## Toonsoort en harmonie

- Majeur of mineur met opeenvolgende, zingbare akkoorden; omkeringen voor vloeiende bas.
- Voorbeeld C majeur (C3 = 48): `I V vi IV` (C G Am F), of `I vi IV V` (C Am F G: 48 52 55 / 57 60 64 / 53 57 60 / 55 59 62).
- Mineur: `i VI III VII` (Am F C G) of `i iv V i` met G# (Am Dm E Am: 57 60 64 / 50 53 57 / 52 56 59 / 57 60 64).
- Akkoordwissel per maat of per twee maten; aan het eind een V → I of IV → I-cadens.

## Ritme

Zachte begeleiding, achtstenbasis:

```
kick       X.......x.......     (stap 0 en 8; vel 0,7 / 0,5)
rim/snare  ........x.......     (stap 8; zacht, vel 0,5)
hat gesl.  o.o.o.o.o.o.o.o.     (achtsten; vel 0,35)
```

- Piano-arpeggio in achtsten: `xoxoxoxoxoxoxoxo` op 16 stappen (1/8-noten op stap 0, 2, 4, ... ) of lange akkoorden `x...............`.
- Basfiguur: grondtoon op stap 0 en kwint op stap 8 (`x.......x.......`), gate 0,9, vel 0,6.
- Microtiming: geen swing; piano licht menselijk met `humT` 0,1 en `humV` 0,15.
- Drums zacht pas vanaf het tweede couplet of refrein; in de brug weer weg.

## Bas

- Rond en warm; nootbereik 28 tot 48; lange noten (gate 0,8 tot 1).
- Volgt grondtonen; omkeringsbassen (E onder C: 40) voor een glijdende lijn.
- Velocity 0,5 tot 0,7.

## Akkoorden en pads

- Piano-arpeggio of akkoordstructuur in lange noten (gate 1), vel 0,45 tot 0,7.
- Strijkers als pad vanaf het refrein (vel 0,5 tot 0,7) met crescendo.
- Gitaar-achtige tokkel met Karplus String; chorus licht.

## Melodie en lead

- Zingbare melodie met lange noten (gate 1 tot 2) en een hoogtepunt aan het eind van de zin.
- Voorbeeld C majeur (C5 = 72): 72 76 79 77 76 72 74 72, eindigend op de grondtoon.
- Dichtheid 40 tot 60 procent; vraag en antwoord over twee maten.
- Refrein een octaaf hoger (+12) of met een sprong naar de kwint.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | piano |
| Couplet 1 | 16 | piano, bas, melodie |
| Refrein | 16 | strijkers, zachte drums |
| Couplet 2 | 16 | zachte hats erbij |
| Refrein | 16 | alle lagen |
| Brug | 8 | alleen piano en melodie, dan crescendo |
| Refrein (laatste) | 16 | melodie +12, strijkers vol |
| Outro | 4 | piano, laatste akkoord uitloop |

Totaal 96 maten; bij 66 BPM ongeveer 5 minuten 49.

## Dynamiek en nuances

- Herkenbaar: lange crescendo's, rusten die wijzen op ademhaling, melodie die rijst.
- Veelgemaakte fouten: te snel; te veel drums vroeg; akkoorden te dicht en te laag; geen rust voor het refrein; constante velocity.
- Velocity-bereik breed: couplet 0,4 tot 0,6, refrein 0,7 tot 1.

## Passende devices, tunes en presets

- Keys en snaar: [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `Ballad`), [Karplus String](../../devices/synths/KarplusString/AGENTS.md) (map `Ballad`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (map `Ballad`), [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Pop`).
- Pads: [Mist](../../devices/synths/Mist/AGENTS.md), [Layered Landscape](../../devices/synths/LayeredLandscape/AGENTS.md).
- Drums (zacht): [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) (map `Pop`, tune `Backbeat`; velocity laag houden).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Ballad` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Ambient and Cinematic`, voor langzame arpeggio's), [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) (map `Ambient and Slow`, preset `Slow Song`).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Chorus](../../devices/effects/Chorus/AGENTS.md).

## Minimale startconfiguratie

1. Chord Sequencer (spoor A piano, `major` of `minor`, `division: 8`, root 48) naar Stage Keys.
2. Step Sequencer of Wanderer voor de melodie, naar Karplus String of Stage Keys.
3. Chord Sequencer spoor B voor strijkers (`fifth`, `division: 8`) naar Bowed Ensemble.
4. Drum Kit zacht; Room met middellange hall.
5. Mixer, Master Chain, Speakers; BPM 66, swing 0.
