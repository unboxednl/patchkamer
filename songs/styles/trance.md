# Stijlgids: trance

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Euforisch en opbouwend. Lange opbouwen, een break met melodie en een drop met de supersaw-lead.
- Rollende offbeat-bas, 1/16-arpeggio's of gated pads, grote akkoorden.
- Emotionele mineur-progressie; hoogtepunt in de break.

## Tempo en maatsoort

- 4/4. Bereik 128 tot 140 BPM; uplifting 136 tot 140, progressief 126 tot 132.
- Swing: 0 (recht). Gate-effecten geven het ritme.

## Toonsoort en harmonie

- Natuurlijk mineur; ook frygisch of harmonisch mineur voor spanning.
- Voorbeeld A mineur (A3 = 57): `i VI III VII` = Am F C G (57 60 64 / 53 57 60 / 48 52 55 / 55 59 62), elk akkoord 1 maat (cyclus 4 maten) of 2 maten (cyclus 8).
- Alternatief: `i VII VI VII` (Am G F G) of `i iv VI V` (Am Dm F E; E majeur = 52 56 59).
- Laat de akkoorden dicht bij elkaar (voice leading), neem 1e en 2e omkering.

## Ritme

```
kick       X...X...X...X...     (stap 0,4,8,12; vel 1,0 / 0,95)
clap       ....X.......X...     (vel 0,85) + extra lagen in de drop
hat open   ..X...X...X...X.     (offbeat; vel 0,85; gate 0,5)
hat gesl.  o.o.o.o.o.o.o.o.     (achtsten; vel 0,45)
```

- Bas (A1 = 33): rollend offbeat `.xxx.xxx.xxx.xxx` (de kicks blijven vrij, drie noten tussen de kicks), noot 33, gate 0,4, vel 0,8; accent 1,0 op de eerste noot na de kick.
- Gate-pad: een akkoord (Am 57 60 64) in 1/16, patroon `xx.xx.xx.xx.xx.x` met gate 0,3 voor het "gated" effect.
- Arpeggio (1/16): Am omhoog 57 60 64 69 of via [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) `up`, `rate` 1, `gate` 0,3, accent op de eerste van elke vier.
- Opbouw-fill: snareroll op 1/16 → 1/32, velocity 0,3 → 1,0 over 4 tot 8 maten.

## Bas

- Mono, nootnummer 33 tot 45, rollend op de zestienden tussen de kicks (zie hierboven).
- Volgt de akkoordgrondtonen: A (33), F (29), C (36), G (31) — laat de bas pas veranderen op de eerste tel van de maat.
- [Pump](../../devices/effects/Pump/AGENTS.md) zorgt voor ruimte voor de kick.

## Akkoorden en pads

- Supersaw-akkoorden (breed), lange noten voor de pad: 1 maat (16 stappen) per akkoord, vel 0,5 tot 0,6.
- Stabs op de offbeat: gate 0,3, vel 0,7.
- Pad en akkoord dikker in de break, dunner in de drop zodat de lead boven blijft.

## Melodie en lead

- Het hook-motief zit in de break en keert terug in de drop. 8 tot 16 noten, mineur pentatonisch plus de zevende (A: 69 72 74 76 79 81).
- Stijgende frasen met een sprong naar de kwint, een hoogtepunt (octaaf) en een daling. Gate 0,8 tot 1.
- Lead een octaaf hoger in de laatste herhaling (+12).
- Arpeggio-hook: 1/16 over de akkoordtonen met accent op de zware tel.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | kick, hats; bas na 8 maten |
| Opbouw 1 | 16 | arpeggio en pad erbij, filter opent |
| Break | 16 | geen drums of bas; akkoorden, pad en hook; riser en snareroll in laatste 4 maten |
| Drop | 32 | alle lagen: kick, bas, hats, clap, lead |
| Break 2 | 16 | zoals break maar een octaaf hoger |
| Drop 2 | 32 | extra lagen, lead +12 |
| Outro | 16 | afbouwen |

Totaal 144 maten, bij 138 BPM ongeveer 4 minuten 10.

## Dynamiek en nuances

- Herkenbaar: één spanningsboog per break; velocity stijgt in de opbouw; offbeat-bas altijd aanwezig.
- Veelgemaakte fouten: te weinig contrast tussen break en drop; hook te vroeg; bas die over de kick heen speelt zonder sidechain; geen riser.
- Filter en reverb-automatisering over de opbouw (zie [Multi-Segment Envelope](../../devices/modulators/Mseg/AGENTS.md)).

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md), map `Trance` in [drum-kit-styles](../../tunes/drum-kit-styles.patchkamer-tunes.json) en [drum-machine-styles](../../tunes/drum-machine-styles.patchkamer-tunes.json).
- Lead en pads: [Supersaw Swarm](../../devices/synths/SupersawSwarm/AGENTS.md), map `Trance` in [supersaw-swarm-styles](../../tunes/supersaw-swarm-styles.patchkamer-tunes.json); [Triple Osc Poly](../../devices/synths/TripleOscPoly/AGENTS.md) (map `Trance`); [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (mappen `Trance`, `Progressive Trance`).
- Bas: [Basic Mono](../../devices/synths/BasicMono/AGENTS.md) (map `Trance`), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Trance`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Trance`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (presets map `Trance` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Trance and Dance`), [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) (map `Genre Starters`, o.a. een trance-lead).
- Effecten en mastering: [Pump](../../devices/effects/Pump/AGENTS.md), [Room](../../devices/effects/Room/AGENTS.md); [Master Director](../../devices/mastering/MasterDirector/AGENTS.md) (noemt trance als stijl; zie ook [balance-eq](../../presets/balance-eq.patchkamer-presets.json), map `Festival`).

## Minimale startconfiguratie

1. Drum Kit (map `Trance`), BPM 138, swing 0.
2. Basic Mono of Sub Line met Step Sequencer (noot 33, rollend patroon).
3. Chord Sequencer (spoor A, `minor` of `fifth`, progressie `[0,-4,3,-2]` (Am F C G met `fifth`) of schrijf de akkoorden uit in `notes`) naar Supersaw Swarm.
4. Scale Arpeggiator voor het arpeggio op dezelfde akkoorden.
5. Pump op bas en pad; Room op de lead.
6. Mixer, Master Chain, Speakers; bouw secties via mute/solo of via Pattern Playlist.
