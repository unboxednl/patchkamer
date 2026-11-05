# Stijlgids: dark ambient

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd. Lees ook [ambient](ambient.md): dark ambient is dezelfde aanpak met een andere kleur.

## Kenmerken

- Donker, dreigend, leeg. Lage drones, dissonante clusters, metaalachtige of holle texturen.
- Zeer langzame ontwikkeling; ruimte en stilte zijn onderdeel van de muziek.
- Geen of nauwelijks ritme; als er een puls is, is dat een trage, diepe slag.

## Tempo en maatsoort

- 4/4 als raster, tempo 40 tot 70 BPM; vaak 50 tot 60. Lange loops van 16 tot 64 maten.
- Swing: 0.

## Toonsoort en harmonie

- Frygisch, locrisch, harmonisch mineur of heletoon; tritonus en kleine secunde als spanning.
- Voorbeeld E frygisch (E2 = 40): E F G A B C D = 40 41 43 45 47 48 50; akkoord Em (52 55 59) met F erboven (53 57 60) is een cluster-effect.
- Drone op een grondtoon (E1 = 28) met een tweede stem op de b2 (F2 = 41) of tritonus (Bb2 = 46).
- Akkoordwissel hoogstens 1 per 8 tot 16 maten.

## Ritme

Geen vast drumpatroon. Optionele zachte, diepe puls:

```
slag       X...............     (één lage slag per maat; vel 0,6)
metaal     ..........g.....     (stap 10; vel 0,25; onregelmatig)
```

- Gebruik [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) met `steps` 32, `pulses` 1 tot 3 en `prob` 0,6 voor onregelmatige slagen.
- Microtiming: `humT` 0,3 of hoger; velocity-verschillen groot (0,2 tot 0,7).

## Bas

- Subdrone, nootnummer 24 tot 40; gate 1, noten van 16 tot 64 stappen.
- Verander de toonhoogte hoogstens een halve toon of kleine terts per 8 maten.
- Velocity 0,5 tot 0,7; geen ritmische bas.

## Akkoorden en pads

- Clusters: drie of meer aangrenzende noten (E, F, F#: 52 53 54) of tritonus-stack (E, Bb: 52 58).
- Lange noten (16 stappen of meer) met trage attack; filter dicht; veel reverb.
- Gebruik [Drift](../../devices/modulators/Drift/AGENTS.md) en [Swell](../../devices/modulators/Swell/AGENTS.md) voor langzame pitch- en filterbeweging.

## Melodie en lead

- Zeer spaarzaam: één noot per 4 maten, bijvoorbeeld de b2 (F5 = 77) of kleine septiem, gate 2 en langer.
- Metaalachtige of vocale klank; echo met lange feedback.
- Mutaties: [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) met `phrygian`, `density` 0,15, `reps` 8, `jump` 0,3.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | drone alleen |
| Laag 2 | 16 | cluster-pad, ruis |
| Midden | 32 | slagen, metaaltextuur, filter opent |
| Piek | 16 | meer dissonantie, alle lagen |
| Afbouw | 32 | lagen één voor één eruit |

Totaal 112 maten; bij 56 BPM ongeveer 8 minuten.

## Dynamiek en nuances

- Herkenbaar: lage frequenties, dissonanten die niet oplossen, lange stiltes, traag filterwerk.
- Veelgemaakte fouten: te veel beweging; opgeloste akkoorden (wordt filmmuziek); te hoge velocity; reverb te kort; te veel hoge frequenties.
- Houd het laag in de mix; mono onder 120 Hz.

## Passende devices, tunes en presets

- Synths: [Drone Synth](../../devices/synths/DroneSynth/AGENTS.md) (map `Dark Ambient`), [Dissonant Cluster](../../devices/synths/DissonantCluster/AGENTS.md) (mappen `Dark Ambient`, `Drone`), [Celestial Mechanics](../../devices/synths/CelestialMechanics/AGENTS.md) (mappen `Dark Ambient`, `Horror`), [Paradox](../../devices/synths/Paradox/AGENTS.md) (map `Dark Ambient`), [Mist](../../devices/synths/Mist/AGENTS.md) (map `Dark Ambient`), [Layered Landscape](../../devices/synths/LayeredLandscape/AGENTS.md) (map `Dark Ambient`), [Foundry](../../devices/synths/Foundry/AGENTS.md) (map `Dark Ambient`), [Biotope](../../devices/synths/Biotope/AGENTS.md) (map `Dark Ambient`), [Grain Cloud](../../devices/synths/GrainCloud/AGENTS.md) (map `Dark Ambient`).
- Tunes: bijvoorbeeld [dissonant-cluster-styles](../../tunes/dissonant-cluster-styles.patchkamer-tunes.json), [drone-synth-styles](../../tunes/drone-synth-styles.patchkamer-tunes.json), [paradox-styles](../../tunes/paradox-styles.patchkamer-tunes.json).
- Sequencers: [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Ambient & Cinematic`, preset `Dark Drone Evolution`, [presets](../../presets/clip-arranger.patchkamer-presets.json)), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Ambient and Cinematic`), [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Resonator](../../devices/effects/Resonator/AGENTS.md), [Frequency Shifter](../../devices/effects/FrequencyShifter/AGENTS.md).

## Minimale startconfiguratie

1. Drone Synth (map `Dark Ambient`), één noot E1 (28) over de hele song, via Step Sequencer (`ln` 16, `len` 64 of meer).
2. Dissonant Cluster op een tweede spoor met een cluster op 52 53 54, lange noten.
3. Drift op het filter van beide synths; Room met lange hall.
4. Optioneel Euclidean Rhythms voor onregelmatige lage slagen.
5. Mixer, Master Chain, Speakers; BPM 56.

## Aanvullende werkafspraken

- Laat ten minste de helft van de maten vrij van nieuwe aanslagen; stilte is een instrument.
- Verander per sectie één parameter (filter, toonhoogte, aantal lagen), niet meerdere.
- Controleer dat de clusters echt dissonant zijn (secunde of tritonus) en dat geen akkoord als gewone drieklank oplost.
