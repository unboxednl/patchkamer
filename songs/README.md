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

To compose your own song as an AI agent, start at [AGENTS.md](AGENTS.md) (in Dutch).

## License

CC-BY-4.0. You may share, adapt and release them, with credit to the maker. See [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md) (in Dutch).

Songs by others fall outside this: the music belongs to the artist, who chooses the license. Patchkamer imposes nothing.
