# skins

*Nederlandse versie: [README_NL.md](README_NL.md)*

A skin changes how one device **looks**, without changing the device or how it sounds. A skin is one small JSON file with one or more appearances (for example a compact and a wide one). Each appearance holds some CSS for the device's interface and, if you like, a few embedded images. On the card of a device you choose a skin and an appearance; **Auto** switches by itself on the width of the card and the size of the screen. Skins sit next to [tunes](../tunes/README.md) and [presets](../presets/README.md) as library material.

This is version 0.1 of the skins contract, deliberately small: the file format, the folders and the way skins are loaded and switched are fixed. The content of a skin is still a placeholder; artwork, control graphics and layouts follow in a later version. The folder has one example skin, for Duofone, and a device icon.

## What is in here

| Folder | Contents | License |
|---|---|---|
| [`library/`](library/) | The skins, one folder per device id (for example `nl.patchkamer.duofone`), with an optional `icon.*` for the device | CC0-1.0 |
| [`contract/`](contract/) | The skins contract ([English](contract/SKINS-CONTRACT_EN.md), [Dutch](contract/SKINS-CONTRACT_NL.md)) and the validator [`validate-skin.mjs`](contract/validate-skin.mjs) | MIT |

## How to use them

- Load `github.com/unboxednl/patchkamer` as a library in Patchkamer: the skins come with it. Or download a file from a folder in `library/` and import it in the **Skins** panel.
- Then choose a skin, and an appearance, on the card of the device.

## File format

One skin per file, named `name.patchkamer-skin.json`: JSON with `format` (`patchkamer-skin`), `formatVersion` (1), `skinsContract` (`0.1`), `id`, `device` (the exact id of the device), `name`, `version`, `author`, `license`, `description`, `created`, `icon`, `default` and a list of `appearances`. Check a skin with `node contract/validate-skin.mjs file.patchkamer-skin.json`. The full format is in the [contract](contract/SKINS-CONTRACT_EN.md); rules for agents that write skins: [AGENTS.md](AGENTS.md) (in Dutch).

## License

The skins in `library/` are CC0-1.0 (public domain): you may reuse a skin without naming the author. The contract and validator in `contract/` are MIT. See [LICENSING.md](../LICENSING.md) (in Dutch).
