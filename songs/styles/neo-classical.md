# Stijlgids: neoklassiek

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Pianogestuurde, intieme moderne klassieke muziek met strijkers en veel nuance.
- Eenvoudige, herhalende figuren (arpeggio's, ostinati) waarover een melodie zweeft.
- Rubato-gevoel, grote dynamiek, veel ruimte; geen drums of heel subtiele percussie.

## Tempo en maatsoort

- 4/4, 3/4 of 6/8. Bereik 50 tot 100 BPM; typisch 60 tot 80.
- Swing: 0. Voor een menselijk gevoel: `humT` 0,15, `humV` 0,2.

## Toonsoort en harmonie

- Majeur of mineur, soms dorisch/lydisch; kleurvolle 7e en add9-akkoorden.
- Voorbeeld A mineur (A3 = 57): `i VI III VII` (Am F C G), of `i iv VI V` (Am Dm F E: 57 60 64 / 50 53 57 / 53 57 60 / 52 56 59).
- C majeur (C3 = 48): `I iii vi IV` = C Em Am F (48 52 55 / 52 55 59 / 57 60 64 / 53 57 60).
- Vloeiende bas via omkeringen (stapsgewijs); elk akkoord 1 of 2 maten.

## Ritme

3/4-arpeggio (12 stappen) of 4/4 (16 stappen); piano-arpeggio:

```
arp 4/4    xoxoxoxoxoxoxoxo     (achtsten met zachte binnenstem; x 0,6 / o 0,4)
arp 3/4    xoxoxoxoxoxo         (12 stappen; patroonlengte 12)
bas        X.......x.......     (stap 0 en 8; vel 0,7 / 0,5)
```

- Arpeggio's gaan om de achtste noot omhoog en omlaag (Am: 57 60 64 69 64 60).
- Basfiguur: lange noot op de eerste tel, kwint op tel 3.
- Percussie (optioneel): zachte pauk op tel 1 in de opbouw, `X...............` (vel 0,6).
- Microtiming: lichte rubato via `mt` ±0,1 en vel-variatie; ritardando door de laatste noten van een zin 0,05 stap te laat.

## Bas

- Warme celloachtige of piano-laagte; nootbereik 33 tot 52.
- Lange noten (gate 1 of langer), legato; octaafverdubbeling (A1 en A2: 33 en 45).
- Velocity 0,5 tot 0,75; accent op tel 1.

## Akkoorden en pads

- Piano-akkoorden in lange noten of arpeggio's, vel 0,4 tot 0,7.
- Strijkers (viool, cello) in lange noten en tremolo, vel 0,3 tot 0,6 met crescendo naar het hoogtepunt.
- Pedal (sustain): laat akkoorden langer klinken dan de volgende toon (gate 1,2 tot 1,5).

## Melodie en lead

- Zingbare melodie van 2 tot 4 maten; motief van 3 tot 5 noten, herhaald en gevarieerd (sequens: dezelfde figuur een trede hoger).
- Voorbeeld A mineur (A4 = 69): 69 72 71 69 67 64 | 65 67 69 (slot op de grondtoon).
- Lange noten (gate 1 tot 2) wisselen af met korte; dichtheid 40 tot 60 procent.
- Hoogtepunt aan het eind van de tweede zin, daarna rust.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | piano-arpeggio |
| Thema A | 8 | melodie op piano |
| Thema A' | 8 | strijkers erbij |
| Ontwikkeling B | 8 | andere akkoorden, melodie hoger |
| Hoogtepunt | 8 | alle lagen, crescendo, melodie +12 |
| Terugkeer A | 8 | zoals begin, zacht |
| Outro | 4 | piano, uitklinken |

Totaal 48 maten; bij 72 BPM ongeveer 2 minuten 40.

## Dynamiek en nuances

- Herkenbaar: brede dynamiek (0,25 tot 1), lange crescendi, expressieve rusten, geen vaste drumbeat.
- Veelgemaakte fouten: constante velocity; te regelmatige timing; te veel instrumenten; akkoordwissel op elke tel; melodie die in hetzelfde register als de begeleiding zit.
- Gebruik pedaalnoten (lang) en laat de laatste noot uitklinken.

## Passende devices, tunes en presets

- Piano en snaren: [Stage Keys](../../devices/synths/StageKeys/AGENTS.md) (map `Ballad`, zachte tine-piano), [Karplus String](../../devices/synths/KarplusString/AGENTS.md) (mappen `Ballad`, `Folk`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (mappen `Neo-classical`, `Film Score`), [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Pop`, soft keys).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Neo-classical` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Classical & Neo-Classical`, presets `Neo-Classical Piano Etude` en `Sonata Form Allegro`), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Ambient and Cinematic`, patronen zoals `Slow Harp`), [Pattern Tracker](../../devices/sequencers/PatternTracker/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md) (zachte hall), [Chorus](../../devices/effects/Chorus/AGENTS.md) licht.
- Tunes: [stage-keys-styles](../../tunes/stage-keys-styles.patchkamer-tunes.json), [bowed-ensemble-styles](../../tunes/bowed-ensemble-styles.patchkamer-tunes.json), [karplus-string-styles](../../tunes/karplus-string-styles.patchkamer-tunes.json).

## Minimale startconfiguratie

1. Scale Arpeggiator (`up`, `rate` 2) of Step Sequencer voor het piano-arpeggio, naar Stage Keys.
2. Chord Sequencer voor akkoorden (spoor A `minor` of `major`, `division: 8`) naar dezelfde of een tweede Stage Keys.
3. Chord Sequencer spoor B voor strijkers (lange noten) naar Bowed Ensemble.
4. Step Sequencer of Wanderer voor de melodie, naar Karplus String of Stage Keys.
5. Room (zacht); Mixer, Master Chain, Speakers; BPM 72, geen drums.
