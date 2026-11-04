# devices

*Nederlandse versie: [README_NL.md](README_NL.md)*

The devices that come with Patchkamer: instruments, effects and other building blocks, built to the [contract](../contract/). Devices are grouped in folders by kind. Every kind has its own README and its own user manual.

| Kind | What it is for | README | Manual |
|---|---|---|---|
| `synths/` | Make sound from notes | [synths](synths/README.md) | [manual](../docs/synths/USER-MANUAL_EN.md) |
| `drums/` | Drum sounds and rhythm | [drums](drums/README.md) | [manual](../docs/drums/USER-MANUAL_EN.md) |
| `effects/` | Shape the sound | [effects](effects/README.md) | [manual](../docs/effects/USER-MANUAL_EN.md) |
| `mixer/` | Mix, keep the level steady, play out | [mixer](mixer/README.md) | [manual](../docs/mixer/USER-MANUAL_EN.md) |
| `modulators/` | Move the controls of other devices | [modulators](modulators/README.md) | [manual](../docs/modulators/USER-MANUAL_EN.md) |
| `tools/` | Play, record, measure and take notes | [tools](tools/README.md) | [manual](../docs/tools/USER-MANUAL_EN.md) |

Ready-made sounds and settings for these devices are in [tunes](../tunes/README.md) (devices that make sound) and [presets](../presets/README.md) (devices without a sound of their own).

## Add a device

Follow the contract and give the device one stable file name without a version number, ending in `.patchkamer-device.js`. The history is in Git. Every device has a folder of its own inside its kind folder, for example `synths/Duofone/duofone.patchkamer-device.js`. That folder can also hold an `AGENTS.md` with instructions for agents that configure the device, such as making tunes or presets. Names and ids are in English and contain no brand or model names of existing equipment. See [AGENTS.md](../AGENTS.md) for what a device must pass before it is added.

## License

AGPL-3.0-or-later: nobody can resell these devices closed. If you would rather have others reuse your own device freely, choose MIT for it. Devices that others publish in their own source have their own license. See [LICENSE](LICENSE) and [LICENSING.md](../LICENSING.md).
