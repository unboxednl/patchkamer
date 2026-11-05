# Stijlgids: ambient

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Sfeer boven ritme. Lange, evoluerende pads en drones; weinig of geen drums.
- Langzame verandering, veel ruimte, zachte aanslag.
- Een stuk kan zonder duidelijke maat voelen; Patchkamer blijft wel in maten tellen.

## Tempo en maatsoort

- 4/4 als raster, tempo 50 tot 90 BPM; vaak 60 tot 72. Als je geen puls wilt, laat je de drums weg.
- Swing: 0.

## Toonsoort en harmonie

- Lydisch, majeur pentatonisch, dorisch of mineur. Weinig akkoordwisselingen: 1 akkoord per 4 tot 8 maten.
- Voorbeeld C lydisch (C3 = 48): Cmaj7 = 48 52 55 59, D = 50 54 57 (D majeur, lydische II), Fmaj7#11 = 53 57 60 64 + 59 (B) of Am7 = 57 60 64 67.
- Open kwinten en sus-akkoorden (Csus2: 48 50 55, Csus4: 48 53 55).
- Voorbeeldprogressie `Cmaj7 D Cmaj7 Am7` (48 52 55 59 / 50 54 57 / 48 52 55 59 / 57 60 64 67), elk akkoord 4 maten.

## Ritme

Meestal geen vast drumpatroon. Als je een zachte puls wilt:

```
perc       o...............     (één zachte tel per maat, vel 0,3)
shaker     ..g...g...g...g.     (vel 0,2)
```

- Gebruik lange loops (8 tot 16 maten) met willekeurige elementen: Wanderer `density` 0,3 en `gate` 1,2.
- Alternatief: [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) met `steps` 32 en `pulses` 3 om één keer per twee maten een klik te laten klinken.
- Microtiming en swing: niet nodig; `humT` 0,2 voor een organisch gevoel.

## Bas

- Subdrone of grondtoon (C2 = 36), nootlengte 8 tot 16 stappen (halve tot hele maat) of langer.
- Velocity 0,4 tot 0,6, laag gefilterd.
- Laat de bas soms weg om ruimte te geven.

## Akkoorden en pads

- Lange noten (4 tot 16 stappen, gate 1) met trage attack; twee of drie pads in verschillende registers (48 / 60 / 72).
- Moduleer de klank: [Swell](../../devices/modulators/Swell/AGENTS.md) of [Drift](../../devices/modulators/Drift/AGENTS.md) laat filter en volume langzaam bewegen.
- Gebruik reverb met lange staart ([Room](../../devices/effects/Room/AGENTS.md)).

## Melodie en lead

- Spaarzaam: één noot per maat of per twee maten, uit C majeur pentatonisch (72 74 76 79 81), gate 1,5.
- Glasachtige belklank, lange delay.
- Generatief: [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) in lydisch, `density` 0,25, `mut` 0,15, `reps` 4.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | één pad, dan een tweede |
| Ontwikkeling 1 | 16 | derde laag, lage drone, filter opent |
| Midden | 32 | melodiedruppels, extra reverb |
| Ontwikkeling 2 | 16 | akkoordwissel, lagen tegelijk dunner |
| Outro | 16 | lagen één voor één eruit |

Totaal 96 maten; bij 64 BPM ongeveer 6 minuten.

## Dynamiek en nuances

- Herkenbaar: lange attack en release, trage filterbeweging, weinig velocity-verschil, veel stilte.
- Veelgemaakte fouten: te veel noten; geen modulatie (klinkt statisch); te korte noten; een duidelijk drumpatroon (wordt een andere stijl); hall te kort.

## Passende devices, tunes en presets

- Synths: [Drone Synth](../../devices/synths/DroneSynth/AGENTS.md) (mappen `Ambient`, `Drone`), [Layered Landscape](../../devices/synths/LayeredLandscape/AGENTS.md) (map `Ambient`), [Mist](../../devices/synths/Mist/AGENTS.md) (map `Ambient`), [Biotope](../../devices/synths/Biotope/AGENTS.md) (mappen `Ambient`, `Nature`), [Celestial Mechanics](../../devices/synths/CelestialMechanics/AGENTS.md) (map `Ambient`), [Paradox](../../devices/synths/Paradox/AGENTS.md) (map `Ambient`), [Grain Cloud](../../devices/synths/GrainCloud/AGENTS.md) (map `Ambient`).
- Sequencers: [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md) (map `Ambient` in [chord-sequencer](../../presets/chord-sequencer.patchkamer-presets.json)), [Wanderer](../../devices/sequencers/Wanderer/AGENTS.md) (map `Ambient and Slow` in [wanderer](../../presets/wanderer.patchkamer-presets.json)), [Scale Arpeggiator](../../devices/sequencers/ScaleArpeggiator/AGENTS.md) (map `Ambient and Cinematic`), [Step Sequencer](../../devices/sequencers/StepSequencer/AGENTS.md) (map `Long Notes & Pads`), [Pattern Playlist](../../devices/sequencers/PatternPlaylist/AGENTS.md) (map `Ambient and Cinematic`).
- Modulatie: [Swell](../../devices/modulators/Swell/AGENTS.md), [Drift](../../devices/modulators/Drift/AGENTS.md). Tunes: [drone-synth-styles](../../tunes/drone-synth-styles.patchkamer-tunes.json), [layered-landscape-styles](../../tunes/layered-landscape-styles.patchkamer-tunes.json), [mist-styles](../../tunes/mist-styles.patchkamer-tunes.json), [biotope-styles](../../tunes/biotope-styles.patchkamer-tunes.json).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Chorus](../../devices/effects/Chorus/AGENTS.md), [Resonator](../../devices/effects/Resonator/AGENTS.md).

## Minimale startconfiguratie

1. Chord Sequencer: spoor A `major` of `fifth`, `division: 8`, root 48, 1 akkoord per 4 maten; naar Layered Landscape of Mist.
2. Tweede pad: Drone Synth op root 36 met één lange noot.
3. Wanderer (`lydian`, `density` 0,25) naar een belklank (Celestial Mechanics).
4. Swell op de pads, Room met lange hall.
5. Mixer, Master Chain, Speakers; BPM 64, geen drums.

## Aanvullende werkafspraken

- Schrijf de akkoorden uit als lange noten (`ln` 16 of meer bij Step Sequencer, `division: 8` bij Chord Sequencer) en laat de modulatie het werk doen.
- Controleer dat geen enkele stap velocity 0 heeft en dat alle lijsten de volledige lengte hebben (zie [MUSIC-THEORY](../MUSIC-THEORY.md#13-controlelijst)).
- Eindig met een uitklinkende laag: de laatste noot langer dan de rest, geen abrupte stop.
