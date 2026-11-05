# Stijlgids: pop

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Zingbare hook, duidelijke structuur (couplet, refrein, brug), eenvoudige harmonie.
- Een herkenbaar refrein dat terugkomt; contrast tussen couplet (rustig) en refrein (vol).
- Heldere mix: kick, snare, bas, akkoorden, lead en pad, elk met eigen plek.

## Tempo en maatsoort

- 4/4. Bereik 90 tot 130 BPM; typisch 100 tot 120.
- Swing: 0 tot 0,1.

## Toonsoort en harmonie

- Majeur of mineur, vier akkoorden per cyclus.
- Voorbeeld C majeur (C3 = 48): `I V vi IV` = C G Am F (48 52 55 / 55 59 62 / 57 60 64 / 53 57 60), elk akkoord 1 maat, cyclus 4 maten.
- Mineur A: `i VI III VII` = Am F C G (57 60 64 / 53 57 60 / 48 52 55 / 55 59 62).
- Couplet: `vi IV I V` (Am F C G); refrein: `I V vi IV`; brug: `IV V iii vi`.
- Sluit het refrein af met V → I (authentieke cadens) of IV → I.

## Ritme

```
kick       X.......x.x.....     (stap 0, 8, 10; vel 1,0 / 0,8)
snare      ....X.......X...     (stap 4, 12; vel 0,95)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,65 / 0,45)
hat open   ..............o.     (stap 14; vel 0,5)
```

- Couplet: minder kick/hats (alleen kick, rim, bas); refrein: volle drums, claps op 2 en 4.
- Basfiguur (C2 = 36): `x.....x.x.....x.` of achtsten `x.x.x.x.x.x.x.x.` op de grondtoon van het akkoord; gate 0,5 tot 0,8.
- Fill: snareroll of tom in de laatste maat voor het refrein.
- Microtiming: recht; humanize `humV` 0,1.

## Bas

- Volgt de akkoordgrondtonen: C (36), G (31), A (33), F (29); nootbereik 28 tot 48.
- Achtsten of kwartnoten, gate 0,6, velocity 0,8; accent op tel 1.
- Octaafsprong op stap 8 voor beweging in het refrein.

## Akkoorden en pads

- Piano of akkoordsynth: couplet in lange noten (gate 1) of kwartnoten, refrein in achtsten met accent op tel 1.
- Pad of strijkers onder het refrein voor volume (vel 0,5).
- Gitaar-achtige strum met Karplus String of piano via Stage Keys.

## Melodie en lead

- Hook van 4 tot 8 noten uit C majeur (C5 = 72: 72 74 76 79 76 74 72), dichtheid 50 tot 70 procent.
- Couplet-melodie rustiger en lager, refrein-melodie hoger en langere noten.
- Herhaling met variatie: zelfde ritme, eindnoot verandert; call and response.
- Backing: een tweede stem een terts onder de lead (halve tonen: −3 of −4) op de eindnoten.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | akkoorden en hook |
| Couplet 1 | 16 | kick, bas, akkoorden; melodie |
| Pre-chorus | 4 | hats, snare-fill, stijgende velocity |
| Refrein | 16 | alle lagen, pad, backing |
| Couplet 2 | 16 | zoals couplet 1 met extra percussie |
| Refrein | 16 | zoals eerder |
| Brug | 8 | drums weg, ander akkoordenpatroon |
| Refrein | 16 | alle lagen, hook +12 |
| Outro | 4 | afbouwen |

Totaal 100 maten; bij 112 BPM ongeveer 3 minuten 34. Kort in voor een kortere song (schrap couplet 2 en een refrein: 68 maten).

## Dynamiek en nuances

- Herkenbaar: duidelijk contrast couplet / refrein, hook die terugkomt, kleine velocity-variatie.
- Veelgemaakte fouten: geen contrast; te veel akkoorden; hook te complex; melodie in hetzelfde register als de akkoorden; refrein niet vol genoeg.
- Velocity: couplet 0,6 tot 0,75, refrein 0,8 tot 1.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Pop`, tunes `Dance Pop` en `Backbeat`).
- Bas: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Pop`), [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Pop`).
- Akkoorden en leads: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Pop`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Pop`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Pop`), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `Pop`), [Supersaw Swarm](../../devices/synths/SupersawSwarm/AGENTS.md) (map `Pop`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (map `Pop`), [Karplus String](../../devices/synths/KarplusString/AGENTS.md) (map `Pop`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Pop` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Pop & Rock`, preset `Pop Verse-Chorus`), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Song Forms`, preset `Indie Pop Verse-Chorus`), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (map `Melodic Hooks`, preset `Pop Hook`).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Chorus](../../devices/effects/Chorus/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (map `Pop`), BPM 112, swing 0.
2. Akkoorden: de akkoordsoort van Chord Sequencer is per spoor vast, dus `I V vi IV` (met een mineur akkoord op de zesde trede) schrijf je uit als `notes` in Clip Arranger of Pattern Playlist; of gebruik `fifth` (open kwint) op root 48 met `progression` `[0,7,9,5]`.
3. Step Sequencer voor de bas (grondtonen), naar Basic Mono.
4. Step Sequencer 2 voor de hook, naar Poly Chorus of Triple Osc Poly.
5. Room op de lead; Mixer, Master Chain, Speakers; secties via Clip Arranger scènes.
