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

Zelf een song componeren als AI-agent? Begin bij [AGENTS.md](AGENTS.md).

## Licentie

CC-BY-4.0. Je mag ze delen, bewerken en uitbrengen, met vermelding van de maker. Zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).

Songs van anderen vallen hier buiten: de muziek is van de artiest en die kiest zelf de licentie. Patchkamer legt niets op.
