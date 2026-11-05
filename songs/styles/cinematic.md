# Stijlgids: cinematic

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Filmmuziek-achtig: opbouw van spanning, grote hoogtepunten, strijkers, lage hoorns, ostinati en impacts.
- Dynamiek is het hoofdmiddel: van bijna stil naar vol en terug.
- Harmonie draagt het verhaal; ritme is vaak een ostinato of een trage puls.

## Tempo en maatsoort

- 4/4 (soms 3/4 of 6/8). Bereik 60 tot 130 BPM; epische opbouw 90 tot 110, spanning 60 tot 80.
- Swing: 0.

## Toonsoort en harmonie

- Mineur voor drama, majeur of lydisch voor hoop. Veel pedaaltoon (grondtoon in de bas) met bovenstem die beweegt.
- Voorbeeld D mineur (D3 = 50): `i VI III VII` = Dm Bb F C (50 53 57 / 46 50 53 / 53 57 60 / 48 52 55), elk akkoord 2 maten.
- Filmische mineur `i bVI bVII` = Dm Bb C (50 53 57 / 46 50 53 / 48 52 55); majeur-hoop `I bVII IV` (D C G).
- Pedaalbas: D1 = 26 of D2 = 38 blijft liggen onder wisselende akkoorden.

## Ritme

Ostinato (strijkers, 1/8) als motor:

```
ostinato   x.x.x.x.x.x.x.x.     (achtsten; vel 0,5, crescendo naar 0,9 over 8 maten)
paukslag   X.......X.......     (stap 0 en 8; vel 1,0 / 0,8; lage tom)
impact     X...............     (één per sectie; vel 1,0)
```

- Trage puls: één slag per tel of per maat; geen swing.
- Percussie-opbouw: een snareroll op 1/16 → 1/32 met velocity 0,2 → 1,0 over 4 tot 8 maten.
- Microtiming: niet nodig; maak variatie met velocity (`humV` 0,1).
- Stilte als effect: 1 tot 2 tellen niets vóór een hoogtepunt.

## Bas

- Pedaalbas of drone: nootnummer 24 tot 40, lange noten (8 tot 16 stappen), vel 0,6 tot 0,8.
- Lage hoorns of cello's: 1/4 of 1/2 noten die de akkoordgrondtonen volgen.
- Impact: één diepe slag (kick of lage boom) op stap 0 van een sectie.

## Akkoorden en pads

- Strijkers: breed akkoord (Dm: 50 53 57 + 62), lange noten (gate 1), vel 0,5 tot 0,8 met crescendo.
- Koor of pad in een hoger register (60 tot 79); kopers (cluster 38 45 50) voor kracht.
- Voice leading: neem omkeringen die ligger houden.

## Melodie en lead

- Thema van 4 tot 8 noten, bijvoorbeeld D mineur (D4 = 62): 62 65 69 74 72 69 65 62; herhaal, varieer de laatste noot.
- Lange noten (gate 1,2) met zachte attack; solo-instrument (cello of piano) tegen strijkers.
- Hoogtepunt op de laatste herhaling een octaaf hoger (+12).

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 8 | alleen drone of pad |
| Thema | 16 | solo-melodie op pad, ostinato zacht |
| Opbouw | 16 | ostinato, kopers, percussie; crescendo |
| Hoogtepunt | 16 | alle lagen, thema +12, impact |
| Afbouw | 8 | lagen eruit, melodie alleen |
| Epiloog | 8 | drone, laatste akkoord, fade |

Totaal 72 maten; bij 90 BPM ongeveer 3 minuten 12.

## Dynamiek en nuances

- Herkenbaar: grote crescendi (0,3 → 1,0 over 8 tot 16 maten), kopers op hoogtepunt, stilte voor impact.
- Veelgemaakte fouten: te vroeg hoogtepunt; geen contrast; akkoordwissels te snel; ostinato met constante velocity; te veel instrumenten in hetzelfde register.
- Gebruik Multi-Segment Envelope voor filter en volume over de hele song.

## Passende devices, tunes en presets

- Strijkers en koor: [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (mappen `Cinematic`, `Film Score`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Cinematic`), [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Cinematic`), [Supersaw Swarm](../../devices/synths/SupersawSwarm/AGENTS.md) (map `Cinematic`), [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Cinematic`).
- Texturen en impacts: [Mist](../../devices/synths/Mist/AGENTS.md), [Celestial Mechanics](../../devices/synths/CelestialMechanics/AGENTS.md), [Foundry](../../devices/synths/Foundry/AGENTS.md) (map `Cinematic`), [Paradox](../../devices/synths/Paradox/AGENTS.md) (map `Cinematic`), [Drone Synth](../../devices/synths/DroneSynth/AGENTS.md) (map `Cinematic`), [Samplebank](../../devices/samplers/Samplebank/AGENTS.md) (map `Cinematic`), [Loop Slicer](../../devices/samplers/LoopSlicer/AGENTS.md) (map `Cinematic`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (mappen `Cinematic`, `Film Score` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) (map `Ambient & Cinematic`), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (preset `Film Score Tension Cue`), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Ambient and Cinematic`).
- Modulatie en effecten: [Multi-Segment Envelope](../../devices/modulators/Mseg/AGENTS.md), [Swell](../../devices/modulators/Swell/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md).

## Minimale startconfiguratie

1. Chord Sequencer: spoor A (strijkers, `minor`, root 50, progressie `[0,-4,3,-2]` werkt met `fifth`) naar Bowed Ensemble; spoor B bas `single` root 38 naar Drone Synth.
2. Step Sequencer: ostinato in achtsten naar Karplus String of Bowed Ensemble.
3. Drum Kit (of Samplebank) voor pauken en impact, getriggerd door een Step Sequencer (noot 36).
4. Mseg of Swell voor crescendo; Room met lange hall.
5. Mixer, Master Chain, Speakers; BPM 90.

## Aanvullende werkafspraken

- Plan het hoogtepunt op ongeveer twee derde van de song en bouw er minstens 16 maten naartoe.
- Schrijf crescendo's expliciet als velocity-reeksen (0,3 tot 1,0) of met een modulator; een crescendo ontstaat niet vanzelf.
- Zet impacts alleen op stap 0 van een nieuwe sectie, nooit midden in een maat.
