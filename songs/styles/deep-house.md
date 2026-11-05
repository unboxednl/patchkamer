# Stijlgids: deep house

Dit bestand is voor AI-agents die een song in deze stijl componeren. Het hoort bij [../AGENTS.md](../AGENTS.md) en [../MUSIC-THEORY.md](../MUSIC-THEORY.md); lees die eerst. Rasterleesregel: `X` sterk (0,95 tot 1), `x` normaal (0,7 tot 0,85), `o` zwak (0,45 tot 0,6), `g` ghost (0,25 tot 0,4), `.` rust; 16 tekens zijn één maat in 1/16. Je kunt niet luisteren; alles hieronder is op papier gecontroleerd.

## Kenmerken

- Rustiger, warmer en donkerder dan house. Ronde sub-bas, uitgebreide zevende- en negende-akkoorden, veel ruimte.
- Gedempte kick, zachte hats, pads en een sfeervol akkoordpatroon met lange reverb.
- Luistert als een lange, vloeiende lus; verandering is subtiel.

## Tempo en maatsoort

- 4/4. Bereik 110 tot 124 BPM; typisch 118 tot 122.
- Swing: 0,15 tot 0,25 op hats en percussie; de kick blijft recht.

## Toonsoort en harmonie

- Mineur, dorisch of met jazz-kleuren; veel m7, m9, maj7, maj9.
- Voorbeeld A mineur (A3 = 57): Am9 = 57 60 64 67 71, Dm9 = 50 53 57 60 64, Fmaj7 = 53 57 60 64, Em7 = 52 55 59 62.
- Progressies: `i7 iv7` (Am7 Dm7: 57 60 64 67 / 50 53 57 60), `i7 VI maj7 III maj7 VII` (Am7 Fmaj7 Cmaj7 G: 57 60 64 67 / 53 57 60 64 / 48 52 55 59 / 55 59 62), `ii7 V7 Imaj7` in C (Dm7 G7 Cmaj7).
- Elk akkoord 2 maten; cyclus van 8 maten.

## Ritme

```
kick       X...X...X...X...     (vel 0,9; zachter dan techno, lage frequentie)
clap       ....x.......x...     (vel 0,7; gedempt) of rim ....o.......o...
hat gesl.  o.o.o.o.o.o.o.o.     (achtsten; vel 0,4 / 0,5)
hat open   ..o...o...o...o.     (offbeat, vel 0,5; gate 0,6)
shaker     g.og.og.g.og.og.     (vel 0,3 tot 0,5)
```

- Swing 0,2 op hats en shaker geeft de lome beweging. Ghost-kick op stap 14 (`g`, vel 0,3) soms.
- Basfiguur (A1 = 33): `x..x....x..x....` (stap 0, 3, 8, 11), noten 33, 33, 40, 36, gate 0,7.
- Microtiming: hat 0,03 tot 0,06 stap te laat; humanize `humT` 0,1 en `humV` 0,15.
- Variatie: elke 8 maten een extra percussie-slag; een break-maat zonder kick vóór de overgang.

## Bas

- Ronde sub, sinus-achtig met weinig boventonen; nootnummer 28 tot 45.
- Lange noten (gate 0,7 tot 1) met af en toe een octaafsprong; walking-achtige beweging tussen grondtoon en kwint.
- Sidechain van de kick (Pump) zacht, 2 dB.

## Akkoorden en pads

- Akkoordspoor met `minor7` of mineur 9 in 1/4 of 1/8; pad onder het akkoordspoor, vel 0,4 tot 0,5.
- Voices: wissel omkeringen om de noten dicht bij elkaar te houden (voice leading, zie [MUSIC-THEORY](../MUSIC-THEORY.md#3-akkoorden-omkeringen-en-voicings)).
- Elektrische-piano- of orgelachtige toon, filter half gesloten; lange hall.

## Melodie en lead

- Spaarzaam: een zachte motief van 3 tot 6 noten, hoog gespeeld, pentatonisch (A: 57 60 62 64 67 + octaaf), dichtheid 15 tot 30 procent.
- Lange noten (gate 0,9 tot 1,2, 2 tot 4 stappen) met veel ruimte; delay-staarten vullen op.
- Een vocale chop of fluitachtige klank op een enkele noot per twee maten werkt als hook.

## Arrangement en songstructuur

| Sectie | Maten | Wat erbij komt / weggaat |
|---|---|---|
| Intro | 16 | kick, pad en percussie; geen bas |
| Opbouw | 8 | bas in, akkoorden in |
| Hoofdgedeelte A | 32 | alle lagen; elke 8 maten kleine wijziging (percussie of filter) |
| Break | 16 | drums weg, pad en akkoorden; melodie alleen |
| Hoofdgedeelte B | 32 | bas en drums terug, extra laag |
| Outro | 16 | lagen eruit, pad laatste |

Totaal 120 maten, bij 120 BPM 4 minuten.

## Dynamiek en nuances

- Herkenbaar: lange noten, lage dichtheid, grote ruimte, subtiele velocity-verschillen (0,05 tot 0,15).
- Veelgemaakte fouten: te veel energie in de hats; te weinig lengte in de akkoorden; een bas die tegen de kick vecht; te veel lagen waardoor de ruimte verdwijnt.
- Gebruik filterautomatisering over 16 tot 32 maten (Multi-Segment Envelope) als vooruitgang.

## Passende devices, tunes en presets

- Drums: [Drum Kit](../../devices/drums/DrumKit/AGENTS.md) en [Drum Machine](../../devices/drums/DrumMachine/AGENTS.md) (map `House`), [Euclidean Rhythms](../../devices/sequencers/EuclideanRhythms/AGENTS.md) in [euclidean-rhythms](../../presets/euclidean-rhythms.patchkamer-presets.json), map `House` (er staat een `Deep House`-preset in).
- Bas: [Low Bass](../../devices/synths/LowBass/AGENTS.md) (map `Sub`), [Sub Line](../../devices/synths/SubLine/AGENTS.md) (map `Deep House`), [Acid Stepper](../../devices/synths/AcidStepper/AGENTS.md) (map `Deep House`).
- Akkoorden: [Chord Poly](../../devices/synths/ChordPoly/AGENTS.md) (map `Deep House`), [Poly Chorus](../../devices/synths/PolyChorus/AGENTS.md) (map `Deep House`), [Bowed Ensemble](../../devices/synths/BowedEnsemble/AGENTS.md) (map `Deep House`), [Stage Keys](../../devices/synths/StageKeys/AGENTS.md).
- Chord Sequencer: [presets](../../presets/chord-sequencer.patchkamer-presets.json), map `Deep House`; [Chord Sequencer](../../devices/sequencers/ChordSequencer/AGENTS.md).
- Effecten: [Room](../../devices/effects/Room/AGENTS.md), [Pump](../../devices/effects/Pump/AGENTS.md), [Chorus](../../devices/effects/Chorus/AGENTS.md); mastering: [Balance EQ](../../devices/mastering/BalanceEQ/AGENTS.md) heeft in [balance-eq](../../presets/balance-eq.patchkamer-presets.json) een `Deep house`-preset in de map `Club`.

## Minimale startconfiguratie

1. Drum Kit of Drum Machine (map `House`), BPM 120, swing 0,2.
2. Chord Sequencer: spoor A `minor7` op root 57 (pad/akkoord), spoor B `single` voor de bas op root 33, naar Chord Poly en Low Bass.
3. Room met lange hall op de akkoorden.
4. Pump zacht op de bas.
5. Mixer, Master Chain, Speakers.

## Aanvullende werkafspraken

- Controleer dat de akkoorden zevenden of negenden zijn en dat de hall lang genoeg is.
- Houd de dichtheid laag: een noot in elke tweede tot vierde stap is genoeg.
- Laat de filterautomatisering minimaal 16 maten duren.
