# skins

*Nederlandse versie: [README_NL.md](README_NL.md)*

A skin changes how one device **looks**, without changing the device or how it sounds. A skin is one small JSON file with one or more appearances (for example a compact and a wide one). Each appearance holds some CSS for the device's interface and, if you like, a few embedded images. On the card of a device you choose a skin and an appearance; **Auto** switches by itself on the width of the card and the size of the screen. Skins sit next to [tunes](../tunes/README.md) and [presets](../presets/README.md) as library material.

This is version 0.4 of the skins contract (layers 1 and 2, releases A and C), deliberately small: the file format, the folders and the way skins are loaded and switched are fixed. Besides CSS, since 0.2 a skin can bring a set of design choices (`design`) that work on **all devices**: ports mode, colour scheme, haptics and style and size of the host knob (table below). Since 0.3 a skin can also choose the face, size and colour of the controls a device registers (`design.controls`, below). Since 0.4 it can also choose the face and size of meters that a device has the host draw (`design.meters`: bar, LED ladder or a round VU meter with a needle in the same place, adjustable length and width). Artwork, pads, panels and an editor do not exist yet. The folder has three example skins for Duofone, two for Filter, two for Mixer and a device icon. Skins of 0.1 to 0.3 keep working.

## What is in here

| Folder | Contents | License |
|---|---|---|
| [`library/`](library/) | The skins, one folder per device id (for example `nl.patchkamer.duofone`), with an optional `icon.*` for the device | CC0-1.0 |
| [`contract/`](contract/) | The skins contract ([English](contract/SKINS-CONTRACT_EN.md), [Dutch](contract/SKINS-CONTRACT_NL.md)) and the validator [`validate-skin.mjs`](contract/validate-skin.mjs) | MIT |

## How to use them

- Load `github.com/unboxednl/patchkamer` as a library in Patchkamer: the skins come with it. Or download a file from a folder in `library/` and import it in the **Skins** panel.
- Then choose a skin, and an appearance, on the card of the device.

## File format

One skin per file, named `name.patchkamer-skin.json`: JSON with `format` (`patchkamer-skin`), `formatVersion` (1), `skinsContract` (`0.4`, `0.3`, `0.2` or `0.1`), `id`, `device` (the exact id of the device), `name`, `version`, `author`, `license`, `description`, `created`, `icon`, `default`, an optional `design` and a list of `appearances` (each possibly with its own `design`). Check a skin with `node contract/validate-skin.mjs file.patchkamer-skin.json`. The full format is in the [contract](contract/SKINS-CONTRACT_EN.md); rules for agents that write skins: [AGENTS.md](AGENTS.md) (in Dutch).

## Design choices (`design`)

| Option | Values | Works on |
|---|---|---|
| `design.ports.mode` | `default`, `always`, `hover`, `strip` | the port bar at the top of every device (not with `ui.jacks`) |
| `design.colors` | `scheme` `workspace` or `custom` with `bg`, `surface`, `text`, `muted`, `accent`, `line` (`#rgb` or `#rrggbb`) | the card and the host element of every device |
| `design.haptics` | `click`, `turn`, `slide`: `off`, `light`, `medium`, `strong` | every card (only where the device or browser vibrates) |
| `design.knobs` | `style` `workspace`, `rotary`, `slider`; `size` `s`, `m`, `l` | only `host.ui.knob` controls (short form of `controls`) |
| `design.controls` (0.3) | a list of rules `{ match, face, size, length, thickness, thumb, color, showValue }`; `match` is `*`, an id, `role:<role>` or `group:<group>`; the last matching rule wins | the controls a device registers with an id, role and group (device contract v1.15, §12d); a skin never hides a control |
| `design.meters` (0.4) | a list of rules `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }`; `match` is `*`, an id or `group:<group>`; `face` is `bar`, `ledladder`, `vu` or `default`; the last matching rule wins | the meters a device has the host draw with `host.ui.meter` (device contract v1.18, §12e); a VU face replaces the bar in the same place; a skin never hides a meter |

All keys are optional; a missing key lets the device or the workspace keep its own behaviour. The `design` of an appearance overrides that of the skin per key. See [`library/nl.patchkamer.duofone/`](library/nl.patchkamer.duofone/) for `example-back-panel` and `example-touch`, [`library/nl.patchkamer.filter/`](library/nl.patchkamer.filter/) for `example-controls` and `example-sliders` (design.controls), [`library/nl.patchkamer.mixer/`](library/nl.patchkamer.mixer/) for `example-meters` and `example-vu` (design.meters), and the [contract](contract/SKINS-CONTRACT_EN.md) (§4b) for the details. See which ids, roles and groups a device offers with `node contract/validate-instrument.mjs <device> --controls`, and check a skin against a device with `node skins/contract/validate-skin.mjs <skin> --device <device>`.

## License

The skins in `library/` are CC0-1.0 (public domain): you may reuse a skin without naming the author. The contract and validator in `contract/` are MIT. See [LICENSING.md](../LICENSING.md) (in Dutch).
