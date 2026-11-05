# Stijlgids: jazz en blues

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Blues: twaalfmaats cyclus, shuffle-ritme, dominantseptiemakkoorden, blue notes.
- Jazz: swing, walking bass, uitgebreide akkoorden (7e, 9e, 13e), ii-V-I.
- Improviserende melodie op akkoordtonen; akkoordschema bepaalt alles.

## Tempo en maatsoort

- 4/4 (soms 3/4 of 6/8). Blues-shuffle 70 tot 130 BPM, jazz 90 tot 200 BPM; ballad 60 tot 80.
- Swing: 0,3 tot 0,5 (triool-swing 0,33; harde shuffle 0,5).

## Toonsoort en harmonie

- Bluesladder (C: 60 63 65 66 67 70) of mixolydisch voor dominantakkoorden; jazz: dorisch, mixolydisch, lydisch.
- Twaalfmaats blues in C (C3 = 48): C7 = 48 52 55 58, F7 = 53 57 60 63, G7 = 55 59 62 65. Schema (elke cijfer = 1 maat): I I I I | IV IV I I | V IV I V.
- Jazz `ii7 V7 Imaj7` in C: Dm7 G7 Cmaj7 (50 53 57 60 / 55 59 62 65 / 48 52 55 59). Mineur: `iiø7 V7 i7` (Bm7b5 E7 Am7).
- Blues-turnaround in maat 12: V (G7) of V IV.

## Ritme

Shuffle (swing 0,33 op de zestienden, gevoeld als achtste triolen):

```
kick       X.......x.......     (stap 0 en 8; vel 0,8 / 0,6)
snare      ....x.......x...     (stap 4 en 12; vel 0,65)
ride/hat   x...x.x.x...x.x.     (jazz-ride; vel 0,6 / 0,45; kwarten met swingende vulling)
```

- Walking bass (kwartnoten, 4 per maat): noot op stap 0, 4, 8, 12 (`x...x...x...x...`), nootbereik 28 tot 50; akkoordtonen op tel 1 en 3, doorgangsnoot op 2 en 4. Voorbeeld C7: 36 40 43 41 (C E G F), gate 0,9.
- Shuffle-bas (blues): `x.x.x.x.x.x.x.x.` op grondtoon en kwint (C2 = 36 / G2 = 43), gate 0,7.
- Piano-comping: korte akkoorden op onverwachte plaatsen (stap 3, 7, 10), vel 0,5 tot 0,75.
- Microtiming: swing 0,33; snare iets achter het raster; humanize `humT` 0,1, `humV` 0,2.
- Fill: korte drumfill in maat 12 van de cyclus.

## Bas

- Jazz: walking bass; blues: shuffle of boogie (`x.x.x.x.` met grondtoon, terts en kwint, zesde en kleine septiem).
- Velocity 0,6 tot 0,85 met kleine accenten op tel 2 en 4.
- Gate lang (0,8 tot 1) voor legato.

## Akkoorden en pads

- Piano of orgel: voicings met 7e en 9e, omkeringen om dicht te blijven (zie [MUSIC-THEORY](../MUSIC-THEORY.md#3-akkoorden-omkeringen-en-voicings)).
- Comping: vraag en antwoord met de melodie; laat ruimte.
- Blues-orgel kan lange noten spelen met lichte tremolo.

## Melodie en lead

- Blues: bluesladder, motieven met de blue note (F# in C: 66), 12 maten, call and response in de eerste 4 maten.
- Jazz: arpeggio van het akkoord in achtsten (swing), nadruk op 3e en 7e; chromatische doorgangsnoten.
- Dichtheid 40 tot 70 procent; frases van 2 tot 4 maten; eindnoot op een akkoordtoon.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | piano of orgel |
| Thema (12-maats cyclus) | 12 | melodie, bas, drums |
| Solo 1 | 12 | melodie improviseert |
| Solo 2 | 12 | andere stem of extra drukte |
| Thema | 12 | melodie terug |
| Outro | 4 | turnaround en laatste akkoord |

Totaal 56 maten; bij 100 BPM ongeveer 2 minuten 14. Voor AABA-vorm: A 8, A 8, B 8, A 8.

## Dynamiek en nuances

- Herkenbaar: swing, walking bass, 7e akkoorden, blue notes, een turnaround in maat 12.
- Veelgemaakte fouten: rechte zestienden (geen swing); drieklanken in plaats van 7e; bas die niet langs de akkoordtonen loopt; melodie buiten de akkoordschaal; een schema van 8 of 16 maten in plaats van 12 bij blues.
- Velocity-variatie groot en natuurlijk (0,45 tot 0,9).

## Passende devices, tunes en presets

- Keys: [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `Jazz`), [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Jazz & Soul`), [Karplus String](../../devices/synths/KarplusString/AGENTS.md) (map `Jazz`), [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Soul`).
- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) (map `Jazz`, tunes `Swing` en `Brushes`), [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `Jazz`), [Latin Percussion](../../devices/drums/LatinPercussion/AGENTS.md) (bossa nova).
- Bas: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md), [Low Bass](../../devices/synths/LowBass/AGENTS.md).
- Sequencers: [Pattern Tracker](../../devices/sequencers/PatternTracker/AGENTS.md) (map `Songwriting Forms`, presets `Twelve-Bar Blues` en `Jazz AABA Standard` in [pattern-tracker](../../presets/pattern-tracker.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Jazz & Blues`, presets `Twelve-Bar Blues Shuffle` en `Jazz Blues in F`), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Funk and Jazz`).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Tremolo](../../devices/effects/Tremolo/AGENTS.md).

## Minimale startconfiguratie

1. Pattern Tracker of Clip Arranger met de 12-maats opzet (spoor 1 drums, 2 bas, 3 piano, 4 melodie).
2. Drum Kit (map `Jazz`), BPM 100, swing 0,33.
3. Bas: walking bass als Step Sequencer-patroon, `len` 64 (4 maten) of via de tracker; naar Basic Mono.
4. Piano via Stage Keys (map `Jazz`), melodie via een tweede Stage Keys of Karplus String.
5. Room (kort); Mixer, Master Chain, Speakers.
