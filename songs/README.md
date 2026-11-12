# songs

*Nederlandse versie: [README_NL.md](README_NL.md)*

The songs that come with Patchkamer. You can also export your own workspace as a song (see the [user manual](../docs/USER-MANUAL_EN.md#8-save-open-and-share)).

## Example songs

Three small songs that show the file format, each built with a different sequencer. They are examples for learning the format, not finished tracks, and they have not been listened to. They were loaded in the host and measured with [check-song.py](../docs/tools/check-song.py) (exit code 0, no NaN, peak between -24 and -1 dBFS).

| File | Style | Sequencer | Structure |
|---|---|---|---|
| [example-house.patchkamer-song.json](example-house.patchkamer-song.json) | house, 124 BPM | Step Sequencer and Chord Sequencer | a four-bar loop |
| [example-ambient.patchkamer-song.json](example-ambient.patchkamer-song.json) | ambient, 70 BPM | Clip Arranger | intro, main, break, outro (40 bars) |
| [example-hip-hop.patchkamer-song.json](example-hip-hop.patchkamer-song.json) | hip-hop, 90 BPM | Pattern Tracker | intro, verse, hook, outro (44 bars) |

## Hip-hop

In the folder [hip-hop](hip-hop/), four songs in different sub-styles, each with a Pattern Tracker for the structure. They have been checked on paper and with measurements (levels, no clipping, every channel makes sound) but **not listened to**.

| File | Style | Structure |
|---|---|---|
| [boom-bap](hip-hop/boom-bap.patchkamer-song.json) | boom bap, 90 BPM, C minor | intro, verse, hook, verse, hook, outro (40 bars) |
| [trap](hip-hop/trap.patchkamer-song.json) | trap, half-time at 140 BPM, F minor | intro, verse, pre, drop, verse, pre, drop, outro (44 bars) |
| [lo-fi](hip-hop/lo-fi.patchkamer-song.json) | lo-fi, 75 BPM, D minor | intro, A, B, break, A, outro (36 bars) |
| [g-funk](hip-hop/g-funk.patchkamer-song.json) | G-funk, 95 BPM, G minor | intro, hook, verse, hook, break, hook, outro (44 bars) |

## Jungle, breakbeat and drum and bass

Three songs whose drums come from a **sample**: a break from the [Break Loops](../samples/README.md) pack sits in the Loop Slicer, and a Pattern Tracker plays its slices (the patterns of the Loop Slicer Break Chops tunes) together with the bass and the chords. The song tempo equals the tempo of the break. Checked on paper and by measurement (levels, no clipping, every channel makes sound), **not listened to**.

| File | Style | Break | Structure |
|---|---|---|---|
| [rolling-jungle](jungle/rolling-jungle.patchkamer-song.json) | jungle, 168 BPM, E minor | Skittering Hat Break | intro, build, drop, break, drop, outro (64 bars) |
| [funk-breakbeat](breakbeat/funk-breakbeat.patchkamer-song.json) | breakbeat, 128 BPM, D dorian | Big Stomp Break | intro, build, main, break, main, outro (64 bars) |
| [liquid-roller](drum-and-bass/liquid-roller.patchkamer-song.json) | liquid drum and bass, 175 BPM, F minor | Liquid Roller | intro, build, drop, break, build, drop, outro (84 bars) |

## Minimal liquid drum and bass

A song with synthesized drums: a Clip Arranger plays soft two-step drums on a Drum Kit, a sub and a bass guitar, electric piano, strings, flute, vibraphone and a vinyl crackle texture. Checked on paper and by measurement (levels, no clipping, every channel makes sound), **not listened to**.

| File | Style | Structure |
|---|---|---|
| [amber-hours](drum-and-bass/amber-hours.patchkamer-song.json) | minimal liquid drum and bass, 172 BPM, A minor | intro, groove, break, groove with an extra layer, outro (112 bars) |

## Dancefloor drum and bass

A big-room style drum and bass song with synthesized drums and a Neuro Bass (a clean sub under a distorted mid bass), a supersaw hook, pumping chord pads ducked by the kick, vocal chops, risers and impacts, played by a Clip Arranger. Checked on paper and by measurement (levels, no clipping, every channel makes sound), **not listened to**.

| File | Style | Structure |
|---|---|---|
| [stadium-daybreak](drum-and-bass/stadium-daybreak.patchkamer-song.json) | dancefloor drum and bass, 174 BPM, A minor | intro, build, drop, break, build, drop with an extra layer, outro (128 bars) |

## Dark neurofunk

A dark, technical neurofunk song with synthesized drums (a dry, gated Drum Kit), a constantly morphing Neuro Bass with a clean sub, a second detune-stack bass layer in the second drop, metal stabs, risers, impacts, stutter fills, and a drone and dissonant cluster for the intro and the break, played by a Clip Arranger. Checked on paper and by measurement (levels, no clipping, every channel makes sound), **not listened to**.

| File | Style | Structure |
|---|---|---|
| [iron-cathedral](drum-and-bass/iron-cathedral.patchkamer-song.json) | dark neurofunk, 174 BPM, E phrygian | intro, build, drop, break, build, drop with an extra bass layer, outro (128 bars) |

## Dance: techno, house, trance, EDM, progressive and a top 40 song

Six songs with a Clip Arranger for the structure, Pulse Drums or Drum Kit with a kick tuned low and long (a fundamental around 50 to 65 Hz and a tail of a third of a second, so it does not sound like a bongo), and a sidechain pump. Checked on paper and by measurement (levels, no clipping, every track and every drum channel sounds), **not listened to**. The top 40 song was started with the [Remix](../devices/tools/Remix/AGENTS.md) device (recipe *New song*, style Pop).

| File | Style | Structure |
|---|---|---|
| [concrete-meridian](techno/concrete-meridian.patchkamer-song.json) | techno, 130 BPM, A minor | intro, build, main, breakdown, rebuild, peak with an acid lead, outro (144 bars, 4:26) |
| [late-train-home](house/late-train-home.patchkamer-song.json) | house, 124 BPM, A minor | intro, build, drop, break, rise, second peak, outro (136 bars, 4:23) |
| [skyline-ascent](trance/skyline-ascent.patchkamer-song.json) | trance, 138 BPM, A minor | intro, build, break, riser, drop, groove, break, riser, drop, outro (200 bars, 5:48) |
| [skyline-ignition](edm/skyline-ignition.patchkamer-song.json) | EDM, 128 BPM, E minor | intro, build-up, drop, breakdown, build-up, drop, outro (136 bars, 4:15) |
| [slow-horizon](progressive/slow-horizon.patchkamer-song.json) | progressive house and trance, 126 BPM, A minor | intro, bass in, build, three peaks around a long break, outro (224 bars, 7:07) |
| [golden-hour-lights](pop/golden-hour-lights.patchkamer-song.json) | top 40 pop, 102 BPM, G major | intro, verse, chorus, verse, chorus, breakdown, final chorus, outro (80 bars, 3:08) |

To compose your own song as an AI agent, start at [AGENTS.md](AGENTS.md) (in Dutch).

## License

CC-BY-4.0. You may share, adapt and release them, with credit to the maker. See [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md) (in Dutch).

Songs by others fall outside this: the music belongs to the artist, who chooses the license. Patchkamer imposes nothing.
