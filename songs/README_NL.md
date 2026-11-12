# songs

*English version: [README.md](README.md)*

De songs die met Patchkamer worden meegeleverd.

## Voorbeeldsongs

Drie kleine songs die het bestandsformaat laten zien, elk met een andere sequencer. Het zijn voorbeelden om het formaat te leren, geen afgewerkte nummers, en ze zijn niet beluisterd. Ze zijn in de host geladen en gemeten met [check-song.py](../docs/tools/check-song.py) (exitcode 0, geen NaN, piek tussen -24 en -1 dBFS).

| Bestand | Stijl | Sequencer | Opbouw |
|---|---|---|---|
| [example-house.patchkamer-song.json](example-house.patchkamer-song.json) | house, 124 BPM | Step Sequencer en Chord Sequencer | een lus van vier maten |
| [example-ambient.patchkamer-song.json](example-ambient.patchkamer-song.json) | ambient, 70 BPM | Clip Arranger | intro, main, break, outro (40 maten) |
| [example-hip-hop.patchkamer-song.json](example-hip-hop.patchkamer-song.json) | hiphop, 90 BPM | Pattern Tracker | intro, couplet, hook, outro (44 maten) |

## Hiphop

In de map [hip-hop](hip-hop/) staan vier songs in verschillende substijlen, elk met een Pattern Tracker voor de opbouw. Ze zijn op papier en met metingen gecontroleerd (niveaus, geen clipping, elk kanaal geeft geluid) maar **niet beluisterd**.

| Bestand | Stijl | Opbouw |
|---|---|---|
| [boom-bap](hip-hop/boom-bap.patchkamer-song.json) | boom bap, 90 BPM, C mineur | intro, couplet, hook, couplet, hook, outro (40 maten) |
| [trap](hip-hop/trap.patchkamer-song.json) | trap, half-time op 140 BPM, F mineur | intro, couplet, pre, drop, couplet, pre, drop, outro (44 maten) |
| [lo-fi](hip-hop/lo-fi.patchkamer-song.json) | lo-fi, 75 BPM, D mineur | intro, A, B, break, A, outro (36 maten) |
| [g-funk](hip-hop/g-funk.patchkamer-song.json) | G-funk, 95 BPM, G mineur | intro, hook, couplet, hook, break, hook, outro (44 maten) |

## Jungle, breakbeat en drum and bass

Drie songs waarvan de drums uit een **sample** komen: een break uit het pack [Break Loops](../samples/README_NL.md) staat in de Loop Slicer, en een Pattern Tracker speelt de slices (de patronen van de tunes Loop Slicer Break Chops) samen met de bas en de akkoorden. Het songtempo is gelijk aan het tempo van de break. Op papier en met metingen gecontroleerd (niveaus, geen clipping, elk kanaal geeft geluid), **niet beluisterd**.

| Bestand | Stijl | Break | Opbouw |
|---|---|---|---|
| [rolling-jungle](jungle/rolling-jungle.patchkamer-song.json) | jungle, 168 BPM, E mineur | Skittering Hat Break | intro, build, drop, break, drop, outro (64 maten) |
| [funk-breakbeat](breakbeat/funk-breakbeat.patchkamer-song.json) | breakbeat, 128 BPM, D dorisch | Big Stomp Break | intro, build, main, break, main, outro (64 maten) |
| [liquid-roller](drum-and-bass/liquid-roller.patchkamer-song.json) | liquid drum and bass, 175 BPM, F mineur | Liquid Roller | intro, build, drop, break, build, drop, outro (84 maten) |

## Minimale liquid drum and bass

Een song met gesynthetiseerde drums: een Clip Arranger speelt zachte two-step drums op een Drum Kit, een sub en een basgitaar, elektrische piano, strijkers, fluit, vibrafoon en een vinylkraaktextuur. Op papier en met metingen gecontroleerd (niveaus, geen clipping, elk kanaal geeft geluid), **niet beluisterd**.

| Bestand | Stijl | Opbouw |
|---|---|---|
| [amber-hours](drum-and-bass/amber-hours.patchkamer-song.json) | minimale liquid drum and bass, 172 BPM, A mineur | intro, groove, break, groove met een extra laag, outro (112 maten) |

## Dancefloor drum and bass

Een drum and bass-song in big-room-stijl met gesynthetiseerde drums en een Neuro Bass (een schone sub onder een vervormde mid-bas), een supersaw-hook, pompende akkoordpads die door de kick worden ingedrukt, vocal chops, risers en impacts, gespeeld door een Clip Arranger. Op papier en met metingen gecontroleerd (niveaus, geen clipping, elk kanaal geeft geluid), **niet beluisterd**.

| Bestand | Stijl | Opbouw |
|---|---|---|
| [stadium-daybreak](drum-and-bass/stadium-daybreak.patchkamer-song.json) | dancefloor drum and bass, 174 BPM, A mineur | intro, build, drop, break, build, drop met een extra laag, outro (128 maten) |

## Donkere neurofunk

Een donkere, technische neurofunk-song met gesynthetiseerde drums (een droge, gated Drum Kit), een constant morphende Neuro Bass met een schone sub, een tweede detune-stack-baslaag in de tweede drop, metalen stabs, risers, impacts, stutter-fills en een drone en dissonant cluster voor de intro en de break, gespeeld door een Clip Arranger. Op papier en met metingen gecontroleerd (niveaus, geen clipping, elk kanaal geeft geluid), **niet beluisterd**.

| Bestand | Stijl | Opbouw |
|---|---|---|
| [iron-cathedral](drum-and-bass/iron-cathedral.patchkamer-song.json) | donkere neurofunk, 174 BPM, E frygisch | intro, build, drop, break, build, drop met een extra baslaag, outro (128 maten) |

## Dance: techno, house, trance, EDM, progressive en een top 40 song

Zes songs met een Clip Arranger voor de structuur, Pulse Drums of Drum Kit met een lage, lange kick (een grondtoon rond 50 tot 65 Hz en een staart van een derde seconde, zodat hij niet als een bongo klinkt) en een sidechain-pomp. Gecontroleerd op papier en met metingen (niveaus, geen clipping, elk spoor en elk drumkanaal klinkt), **niet beluisterd**. De top 40 song is gestart met het apparaat [Remix](../devices/tools/Remix/AGENTS.md) (recept *Nieuwe song*, stijl Pop).

| Bestand | Stijl | Opbouw |
|---|---|---|
| [concrete-meridian](techno/concrete-meridian.patchkamer-song.json) | techno, 130 BPM, A mineur | intro, build, main, breakdown, rebuild, peak met een acid-lead, outro (144 maten, 4:26) |
| [late-train-home](house/late-train-home.patchkamer-song.json) | house, 124 BPM, A mineur | intro, build, drop, break, rise, tweede peak, outro (136 maten, 4:23) |
| [skyline-ascent](trance/skyline-ascent.patchkamer-song.json) | trance, 138 BPM, A mineur | intro, build, break, riser, drop, groove, break, riser, drop, outro (200 maten, 5:48) |
| [skyline-ignition](edm/skyline-ignition.patchkamer-song.json) | EDM, 128 BPM, E mineur | intro, build-up, drop, breakdown, build-up, drop, outro (136 maten, 4:15) |
| [slow-horizon](progressive/slow-horizon.patchkamer-song.json) | progressive house en trance, 126 BPM, A mineur | intro, bas erin, build, drie pieken rond een lange break, outro (224 maten, 7:07) |
| [golden-hour-lights](pop/golden-hour-lights.patchkamer-song.json) | top 40 pop, 102 BPM, G majeur | intro, couplet, refrein, couplet, refrein, breakdown, laatste refrein, outro (80 maten, 3:08) |

Zelf een song componeren als AI-agent? Begin bij [AGENTS.md](AGENTS.md).

## Licentie

CC-BY-4.0. Je mag ze delen, bewerken en uitbrengen, met vermelding van de maker. Zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).

Songs van anderen vallen hier buiten: de muziek is van de artiest en die kiest zelf de licentie. Patchkamer legt niets op.
