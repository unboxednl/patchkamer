# Stijlgids: drum and bass

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Snelle gebroken beat met een zware sub-bas; half-time gevoel op de bas.
- Twee gebruikelijke smaken: liquid (melodisch, warm) en neurofunk/roller (donker, technisch).
- Veel ruimte in de ritmesectie; sub en een brede, ontstemde bas leveren energie.

## Tempo en maatsoort

- 4/4. Bereik 170 tot 178 BPM; typisch 172 tot 174.
- Swing: 0 tot 0,1 voor liquid (soms 0,08), 0 voor neuro.
- Houd er rekening mee dat de snare op tel 2 en 4 het halve-tempo gevoel geeft.

## Toonsoort en harmonie

- Mineur, vaak dorisch (liquid) of frygisch (donker).
- Voorbeeld F mineur (F2 = 41): `i VI III VII` = Fm Db Ab Eb (53 56 60 / 49 53 56 / 56 60 63 / 51 55 58), of `i iv VII III`.
- Liquid: m7 en m9 akkoorden met pads; neuro: één grondtoon met bas als hoofdrol.
- Akkoordwissel elke 2 of 4 maten.

## Ritme

Twee-step breakbeat (één maat):

```
kick       X.........x.....     (stap 0 en 10; vel 1,0 / 0,85)
snare      ....X.......X...     (stap 4 en 12; vel 1,0; 0,9)
hat gesl.  x.x.x.x.x.x.x.x.     (achtsten; vel 0,6 / 0,45)
ghost snr  ...g..g....g..g.     (vel 0,3; stap 3, 6, 11, 14)
```

Rolling variant (meer kicks, tikkende hats):

```
kick       X.......x.x.....     (stap 0, 8, 10)
snare      ....X.......X...
hat gesl.  xoxoxoxoxoxoxoxo     (x 0,65 / o 0,4)
```

- Basfiguur (F1 = 29): 2 tot 3 noten per maat, lange noten; bijvoorbeeld `x.....x...x.....` (stap 0, 6, 10) met noten 29, 29, 32; gate 0,8; in neuro met glide en wobble.
- Microtiming: ghost-snare 0,02 tot 0,04 stap te laat; geen swing op de kick.
- Fills: laatste maat van 4 of 8: snare-roll op 1/32 met stijgende velocity (0,3 tot 1,0), of een tom-rol.
- Variaties: elke 4 maten de kick op stap 10 verschuiven naar stap 11 of 9.

## Bas

- Sub: nootnummer 24 tot 40 (C1 tot E2). Liquid: ronde sub met korte noten of lange noten (gate 0,8 tot 1).
- Neuro/roller: mono, detuned zaag met filter en LFO op tempo; 1/4 of 1/8 noten met velocity-accent.
- Pump op de pad of akkoorden; de bas zelf blijft strak met de kick.

## Akkoorden en pads

- Liquid: warme pads en elektrische piano (Fm7: 53 56 60 63, Dbmaj7: 49 53 56 60), 1 akkoord per 2 maten; velocity 0,45 tot 0,6.
- Neuro: weinig akkoorden; een dunne drone of cluster; veel ruimte voor de bas.
- Stabs op stap 0 en 6 (korte lengte) voor ritme.

## Melodie en lead

- Liquid: lange, vloeiende melodie, 1 maat per frase, dichtheid 30 tot 50 procent, gate 0,8 tot 1,2.
- Neuro: korte staccato noten in de hoge regio of geen lead.
- Vocaal-achtige pad of fluit op rustige plaatsen; echo (delay) is gebruikelijk.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | pad, ritmische percussie; geen bas |
| Opbouw | 8 | hats en kick, snareroll op de laatste 2 maten |
| Drop 1 | 32 | beat en bas; elke 8 maten een variatie |
| Break | 16 | geen drums; pad en melodie; riser |
| Opbouw 2 | 8 | roll |
| Drop 2 | 32 | meer energie, extra laag |
| Outro | 16 | afbouwen |

Totaal 128 maten, bij 174 BPM ongeveer 2 minuten 55.

## Dynamiek en nuances

- Herkenbaar: kick op stap 0 en 10, snare 4 en 12, sub die onder alles ligt.
- Veelgemaakte fouten: een kick op elke tel (dan is het techno); een bas die in de lage midden vecht met de kick; te veel ghost-snares op gelijke velocity; geen fill voor de drop.
- Houd de bas mono onder 150 Hz.

## Smaken en voorbeeldsongs (sinds 0.33.0)

De map `drum-and-bass` heeft drie songs, elk in een eigen smaak; kijk er bij een nieuwe song naar voor de indeling van apparaten, tunes en kanalen.

| Smaak | Song | Tempo en toonsoort | Wat het kenmerkt |
|---|---|---|---|
| Dancefloor | [stadium-daybreak](../drum-and-bass/stadium-daybreak.patchkamer-song.json) | 174, A mineur | Supersaw-hook, vocal chops, mid-bas boven een schone sub, snare-roll plus riser vóór de drop, pomp op de akkoorden |
| Liquid, minimaal | [amber-hours](../drum-and-bass/amber-hours.patchkamer-song.json) | 172, A dorisch, swing 0,08 | Rhodes-achtige m9-akkoorden, bassgitaar plus sub, fluit, strijkers, zachte ghost-snares, vinyltextuur, lang evoluerende groove |
| Neurofunk | [iron-cathedral](../drum-and-bass/iron-cathedral.patchkamer-song.json) | 174, E frygisch | Morphende [Neuro Bass](../../devices/synths/NeuroBass/AGENTS.md), droge strakke drums, drone en cluster in plaats van akkoorden, hits, risers, stutter-fills |

- Nieuwe apparaten voor deze stijl: [Neuro Bass](../../devices/synths/NeuroBass/AGENTS.md) (tunes: Neurofunk, Detune Stack, Liquid, Jump Up, Dancefloor, Sub), [Transient Shaper](../../devices/effects/TransientShaper/AGENTS.md) en [Stutter](../../devices/effects/Stutter/AGENTS.md) (presets: map `Drum & Bass`).
- Veel packs hebben sinds 0.33.0 eigen DnB-mappen: `Neurofunk`, `Detune Stack`, `Liquid`, `Liquid DnB`, `Dancefloor DnB`, `Jump Up`, `Jungle`, `Halftime DnB`, `DnB Leads`, `DnB Keys`, `Neurofunk Atmospheres`, `DnB Risers and Impacts`, `Intro and Break Textures`. Zoek ze in [tunes/AGENTS.md](../../tunes/AGENTS.md#de-packs).
- Drumkit-tunes hebben `run: false` (zie [tunes/AGENTS.md](../../tunes/AGENTS.md)): stuur de drums met een sequencer aan.
- Meet de Master Chain: met de preset `Drum & bass` en veel energie zit de limiter in de drops op het plafond. Zet de kanalen zachter als de piek bij elke seconde op het plafond staat.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md), map `Drum & Bass` in [drum-kit-styles](../../tunes/drum-kit-styles.patchkamer-tunes.json) en [drum-machine-styles](../../tunes/drum-machine-styles.patchkamer-tunes.json); [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md), map `Drum and Bass` in [loop-slicer-styles](../../tunes/loop-slicer-styles.patchkamer-tunes.json).
- Bas: [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Drum & Bass`), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Drum & Bass`), [Cross Mod Mono](../../devices/synths/CrossModMono/AGENTS.md) (map `Drum & Bass`), [Patch Mono](../../devices/synths/PatchMono/AGENTS.md) (map `Drum & Bass`), [Duofone](../../devices/synths/Duofone/AGENTS.md) (map `Drum & Bass`).
- Sequencers: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) (map `Drum & Bass and Breakbeat` in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json)); [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Bass Music`, [clip-arranger](../../presets/clip-arranger.patchkamer-presets.json)); [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Bass Music`).
- Pads: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md), [Mist](../../devices/synths/Mist/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md), [Grit](../../devices/effects/Grit/AGENTS.md).

## Minimale startconfiguratie

1. Drum Kit (map `Drum & Bass`), BPM 174, swing 0.
2. Step Sequencer: bas (noot 29, `len` 16 of 32), naar Low Bass of Cross Mod Mono.
3. Chord Sequencer (spoor A pad, `minor7`, root 53) naar Chord Poly of Mist.
4. Room op de pad, Pump op de pad.
5. Mixer, Master Chain, Speakers; secties via Pattern Playlist of Clip Arranger.
