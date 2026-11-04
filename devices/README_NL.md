# devices

*English version: [README.md](README.md)*

De meegeleverde apparaten van Patchkamer: instrumenten, effecten en andere bouwstenen, gebouwd volgens het [contract](../contract/). De apparaten staan in mappen per soort. Elke soort heeft een eigen README en een eigen gebruikershandleiding.

| Soort | Waar het voor dient | README | Handleiding |
|---|---|---|---|
| `synths/` | Geluid maken uit noten | [synths](synths/README_NL.md) | [handleiding](../docs/synths/USER-MANUAL_NL.md) |
| `drums/` | Drumgeluiden en ritme | [drums](drums/README_NL.md) | [handleiding](../docs/drums/USER-MANUAL_NL.md) |
| `effects/` | Het geluid vormgeven | [effects](effects/README_NL.md) | [handleiding](../docs/effects/USER-MANUAL_NL.md) |
| `mixer/` | Mixen, het niveau gelijk houden, afspelen | [mixer](mixer/README_NL.md) | [handleiding](../docs/mixer/USER-MANUAL_NL.md) |
| `modulators/` | De regelaars van andere apparaten bewegen | [modulators](modulators/README_NL.md) | [handleiding](../docs/modulators/USER-MANUAL_NL.md) |
| `tools/` | Spelen, opnemen, meten en notities maken | [tools](tools/README_NL.md) | [handleiding](../docs/tools/USER-MANUAL_NL.md) |

Kant-en-klare klanken en instellingen voor deze apparaten staan in [tunes](../tunes/README_NL.md) (apparaten die geluid maken) en [presets](../presets/README_NL.md) (apparaten zonder eigen geluid).

## Een apparaat toevoegen

Houd je aan het contract en geef het apparaat één stabiele bestandsnaam zonder versienummer, die eindigt op `.patchkamer-device.js`. De geschiedenis staat in Git. Elk apparaat staat in een eigen map binnen de map van zijn soort, bijvoorbeeld `synths/Duofone/duofone.patchkamer-device.js`. In die map kan ook een `AGENTS.md` staan met uitleg voor agents die het apparaat configureren, zoals tunes of presets maken. Namen en id's zijn Engels en bevatten geen merk- of modelnamen van bestaande apparatuur. Zie [AGENTS.md](../AGENTS.md) voor wat een apparaat moet doorstaan voordat het wordt toegevoegd.

## Licentie

AGPL-3.0-or-later: niemand kan deze apparaten gesloten doorverkopen. Wil je ze liever vrij hergebruiken in je eigen apparaten, kies dan voor MIT bij een eigen apparaat. Apparaten die anderen in hun eigen bron publiceren, hebben hun eigen licentie. Zie [LICENSE](LICENSE) en [LICENSING.md](../LICENSING.md).
