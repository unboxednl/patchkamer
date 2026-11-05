# Stijlgids: techno

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Hypnotisch, repetitief, machinaal. Weinig harmonie, veel klank en ritme.
- Een vaste kick op elke tel (vier op de vloer), hats op de offbeat, een bas die de kick aanvult.
- Verandering zit in filter, velocity en het in- en uitschakelen van lagen, niet in akkoorden.
- Melodie is minimaal: een of twee motieven van 2 tot 5 noten.

## Tempo en maatsoort

- 4/4. Bereik 124 tot 140 BPM; peak-time rond 128 tot 134, hard techno 140 tot 150 (de host gaat tot 200 BPM).
- Swing: 0 tot 0,08. Recht is de norm; een beetje swing (0,1 tot 0,15) alleen op hats of percussie.

## Toonsoort en harmonie

- Meestal mineur of frygisch/dorisch op een enkele grondtoon; vaak maar één akkoord of een pedaal.
- Voorbeeld A mineur: grondtoon A (A1 = 33, A2 = 45), pad of stab op Am (57 60 64), eventueel een tweede akkoord G (55 59 62) of F (53 57 60) elke 4 maten.
- Progressie `i VII` (Am G) of `i bII` (Am Bb, frygisch: 57 60 64 / 58 62 65) voor extra donkerte.
- Houd akkoorden kort (stab, 1/16 tot 1/8) en met veel ruimte ertussen.

## Ritme

Maat in 1/16 (stap 0 tot 15). Vier op de vloer, offbeat open hat, backbeat clap:

```
kick       X...X...X...X...      (stap 0,4,8,12; vel 1,0 / 0,95)
clap       ....X.......X...      (stap 4,12; vel 0,85)
hat gesl.  o.o.o.o.o.o.o.o.      (achtsten, vel 0,45)
hat open   ..X...X...X...X.      (offbeat open hat, vel 0,8; gate kort)
rim        ...g..g...g..g..      (ghost, vel 0,3)
```

Variant met doorlopende zestienden (hypnotisch, vel varieert 0,4 tot 0,7):

```
hat gesl.  xoxoxoxoxoxoxoxo      (x 0,65 / o 0,4)
perc       ..g..g..g..g..g.      (vel 0,3; ander geluid)
```

- Basfiguren (A1 = 33, 16 stappen): rollende bas `.xx.xx.xx.xx.xx.` (alle tussen de kicks, vel 0,8; noot 33), of offbeat bas `..x...x...x...x.` (stap 2,6,10,14 op noot 33, gate 0,5).
- Microtiming: houd de kick op het raster; verschuif de clap of rim hooguit 0,05 stap (`mt` in Step Sequencer) voor een lichte schuring. Humanize `humV` 0,05 tot 0,1 op hats is genoeg.
- Variatie: elke 4 maten een andere ghost-rij; elke 8 maten een fill (snare/clap-roll op 1/32 met stijgende velocity) in de laatste maat.

## Bas

- Mono, laag: nootnummer 28 tot 40 (E1 tot E2). Eén grondtoon, soms een octaaf of kleine terts erboven.
- Twee gangbare patronen: rollend (elke zestiende tussen de kicks) of offbeat (stap 2, 6, 10, 14).
- Gate 0,4 tot 0,6; velocity 0,7 tot 0,9; accent 1,0 op de eerste noot van de maat.
- Laat de kick en de bas niet tegelijk de laagste frequenties delen: [Pump](../../devices/effects/Pump/AGENTS.md) op de bas, getriggerd door de kick.

## Akkoorden en pads

- Stab: kort akkoord (Am 57 60 64) op stap 3, 7 of 10 (off-grid), gate 0,25 tot 0,4, vel 0,6 tot 0,8, met veel delay/reverb ([Room](../../devices/effects/Room/AGENTS.md)).
- Pad of drone: één lange noot per 4 tot 8 maten (Am: 45 + 57), vel 0,4 tot 0,5, laag gefilterd; filter langzaam laten bewegen met een LFO of Multi-Segment Envelope.
- Gebruik geen dichte akkoordwisselingen; laat het akkoord 4 maten staan.

## Melodie en lead

- Kort motief van 3 tot 5 noten uit mineur pentatonisch (A: 57 60 62 64 67), ritmisch gesyncopeerd, bijvoorbeeld stap 0, 3, 6, 10 (`x..x..x...x.....`).
- Herhaal 4 maten, wijzig dan één noot. Dichtheid 20 tot 40 procent van de stappen.
- Acid-achtige lijn kan: 16 stappen, noten 33 en 45 met slide en accent (zie [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md)).

## Arrangement en songstructuur

Secties in maten (totaal circa 128 maten, 7 tot 8 minuten bij 130 BPM; 96 maten voor een kortere versie):

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | kick, daarna hats na 8 maten; geen bas |
| Opbouw 1 | 16 | bas erbij, clap erbij na 8 maten; stab sluipt binnen |
| Hoofdgedeelte 1 | 32 | alle lagen; elke 8 maten een kleine verandering |
| Break | 16 | kick, bas en hats weg; pad en stab blijven; riser in de laatste 4 maten |
| Hoofdgedeelte 2 | 32 | terug met alle lagen, extra percussie, filter open |
| Outro | 16 | lagen één voor één eruit, kick als laatste |

Elke 8 maten verandert er iets; overgangen via een filterbeweging, een snare/clap-roll of een tel stilte.

## Dynamiek en nuances

- Herkenbaar: constante kick op 1,0, kleine velocity-verschillen op de hats, filterbewegingen over 8 tot 32 maten.
- Veelgemaakte fouten: te veel akkoordwisselingen; een lead die continu speelt; hats zonder velocity-variatie; kick en bas die allebei sub-energie hebben zonder sidechain; geen break waardoor de drop (terugkeer) geen effect heeft.
- Houd de mix mono onder 120 Hz, breed boven.

## Passende devices, tunes en presets

- Drums: [Pulse Drums](../../devices/drums/PulseDrums/AGENTS.md) (techno-werkstation), tunes in [pulse-drums-techno](../../tunes/pulse-drums-techno.patchkamer-tunes.json), mappen `Techno`, `Minimal`, `Peak Time`, `Hard Techno`, `Dub Techno`, `Acid`. Alternatief [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) met map `Techno` in [drum-kit-styles](../../tunes/drum-kit-styles.patchkamer-tunes.json).
- Bas: [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Techno & House` in [low-bass-styles](../../tunes/low-bass-styles.patchkamer-tunes.json)), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Techno`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Techno`).
- Stabs en pads: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (mappen `Techno`, `Dub Techno`), [Drone Synth](../../devices/synths/DroneSynth/AGENTS.md) (map `Techno`).
- Sequencers: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md), presets in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json), map `Techno` en `Melodic (notes)`. [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) in [step-sequencer](../../presets/step-sequencer.patchkamer-presets.json), mappen `Bass Lines` en `Drum Triggers`. [Clip Arranger](../../devices/sequencers/ClipArranger/AGENTS.md) in [clip-arranger](../../presets/clip-arranger.patchkamer-presets.json), map `Electronic Dance` (een techno-start staat daarin).
- Effecten: [Pump](../../devices/effects/Pump/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md), [Grit](../../devices/effects/Grit/AGENTS.md). Mastering: [Master Director](../../devices/mastering/MasterDirector/AGENTS.md) heeft een techno-stijl; presets in [master-chain](../../presets/master-chain.patchkamer-presets.json) onder `Club`.

## Minimale startconfiguratie

1. Een drumcomputer (Pulse Drums) met een techno-tune, die op de klok meespeelt.
2. Een Step Sequencer (bas, `len` 16, noot 33, rollend patroon) naar Low Bass.
3. Een Chord Sequencer of Step Sequencer voor een stab, naar Chord Poly, met Room erachter.
4. Een Pump op de bas, getriggerd door de kick.
5. Alles via een Mixer naar Master Chain en Speakers; BPM 130, swing 0.
6. Voeg lagen toe volgens de secties hierboven.
