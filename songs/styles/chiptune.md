# Stijlgids: chiptune

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Klank van simpele chips: blokgolf, puls, driehoek en ruis; weinig stemmen tegelijk.
- Snelle arpeggio's in plaats van akkoorden; korte, strakke noten; droog en helder.
- Melodisch en ritmisch eenvoudig, vaak in majeur of pentatonisch, in kleine lussen.

## Tempo en maatsoort

- 4/4. Bereik 100 tot 180 BPM; typisch 120 tot 150.
- Swing: 0 (strikt recht).

## Toonsoort en harmonie

- Majeur, mineur of pentatonisch; eenvoudige cadensen.
- Voorbeeld A mineur (A3 = 57): Am = 57 60 64, F = 53 57 60, C = 48 52 55, G = 55 59 62; `i VI III VII` met elk akkoord 1 maat (cyclus 4 maten).
- Alternatief C majeur: `I V vi IV` (C G Am F).
- Akkoorden worden als snelle arpeggio's gespeeld (zie hieronder), geen blokken.

## Ritme

```
kick       X...x...X...x...     (stap 0, 4, 8, 12; vel 1,0 / 0,8; korte pulserende kick)
snare/ruis ....X.......X...     (stap 4, 12; korte ruisburst; vel 0,9)
hat/ruis   x.x.x.x.x.x.x.x.     (achtsten; vel 0,45; zeer korte gate 0,15)
```

- Arpeggio (1/16): `xxxxxxxxxxxxxxxx`, drie noten omhoog en terug (Am: 57 60 64 60), gate 0,5, vel 0,7. In [Pattern Tracker](../../devices/sequencers/PatternTracker/AGENTS.md) kan dit met het effect `ARP`: `value` 0x37 = mineur akkoord, 0x47 = majeur.
- Basfiguur (A1 = 33): driehoekbas `x.x.x.x.x.x.x.x.` octaaf wisselend (33, 45), gate 0,5; of kwartnoten.
- Drumpatroon met 1/16 snare-roll in de laatste maat van elke 4.
- Microtiming: geen; velocity-patroon 0,8 / 0,5 / 0,65 / 0,5 voor leven.

## Bas

- Driehoek of blokgolf; nootbereik 28 tot 52; korte noten (gate 0,4 tot 0,6), octaafsprongen.
- Eén stem; volgt de akkoordgrondtonen.
- Geen sub-onder-30 Hz; de chip-bas is hoog en helder.

## Akkoorden en pads

- Geen pads; akkoorden zijn arpeggio's in 1/16 (twee tot drie noten per akkoord).
- Tweede arpeggio met pulsgolf 25% of 50% in hoger register voor kleur.
- Tremolo of vibrato (kleine pitchbeweging) op lange noten.

## Melodie en lead

- Blokgolf-lead; melodie van 8 tot 16 noten uit majeur (C: 72 74 76 77 79 81 83 84) of pentatonisch.
- Korte noten (gate 0,5 tot 0,7), 1/16 en 1/8; hoge snelheid.
- Herhaal het motief 2 keer; transponeer bij de herhaling een trede omhoog; afsluiten op de grondtoon.
- Dichtheid 60 tot 90 procent.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 4 | arpeggio alleen |
| Thema A | 8 | melodie, bas, drums |
| Thema A' | 8 | tweede arpeggio erbij |
| Thema B | 8 | andere akkoorden, melodie hoger |
| Thema A | 8 | alle lagen |
| Outro | 4 | afbouwen |

Totaal 40 maten; bij 140 BPM ongeveer 1 minuut 8. Chiptune-lussen herhalen vaak; verleng door herhaling.

## Dynamiek en nuances

- Herkenbaar: snelle arpeggio's, blokgolf, korte ruisdrums, geen reverb, harde velocity-schakelingen.
- Veelgemaakte fouten: reverb of chorus; te veel stemmen tegelijk (de chip heeft er 3 tot 5); lange gates; akkoordblokken in plaats van arpeggio's.
- Velocity vaak vast (0,7 of 1); kleine accenten.

## Passende devices, tunes en presets

- Synths: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Chiptune`, `Square Lead`, `Triangle Bass`), [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Chiptune`), [Cross Mod Mono](../../devices/synths/CrossModMono/AGENTS.md) (map `Chiptune`), [Patchbay Synth](../../devices/synths/PatchbaySynth/AGENTS.md) (map `Chiptune`), [Four-Operator FM](../../devices/synths/FourOperatorFM/AGENTS.md) (map `Chiptune`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Chiptune`).
- Sequencers: [Pattern Tracker](../../devices/sequencers/PatternTracker/AGENTS.md) (map `Module Classics`, presets `Chiptune Hero Loop` en `Chip Boss Battle` in [pattern-tracker](../../presets/pattern-tracker.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Retro & Game`, preset `Chiptune Adventure`), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (rate 1, gate 0,5).
- Drums: [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) of [Click Synth](../../devices/drums/ClickSynth/AGENTS.md); klein en droog.
- Tunes: [basic-mono-styles](../../tunes/basic-mono-styles.patchkamer-tunes.json), [samplebank-styles](../../tunes/samplebank-styles.patchkamer-tunes.json).

## Minimale startconfiguratie

1. Pattern Tracker (`rowsPerBeat` 4) met vier sporen: lead, arpeggio, bas, drums; BPM 140, swing 0.
2. Spoor 1 naar Basic Mono (blokgolf), spoor 2 naar Duofone (puls), spoor 3 naar Basic Mono (driehoek), spoor 4 naar Drum Machine.
3. Geen effecten, of heel licht.
4. Mixer, Master Chain, Speakers.

## Aanvullende werkafspraken

- Houd het aantal gelijktijdige stemmen laag (vier of vijf sporen) en geef elke stem een eigen register.
- Gebruik korte patronen (`len` 16 of 32) en herhaal ze; verandering komt uit akkoordwissel en transpositie.
- Controleer dat de gates kort blijven (0,15 tot 0,6) en dat er geen reverb in de keten zit.
