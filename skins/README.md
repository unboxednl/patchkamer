# skins

*Nederlandse versie: [README_NL.md](README_NL.md)*

A skin changes how one device **looks**, without changing the device or how it sounds. A skin is one small JSON file with one or more appearances (for example a compact and a wide one). Each appearance holds some CSS for the device's interface and, if you like, a few embedded images. On the card of a device you choose a skin and an appearance; **Auto** switches by itself on the width of the card and the size of the screen. Skins sit next to [tunes](../tunes/README.md) and [presets](../presets/README.md) as library material.

This is version 0.8 of the skins contract (layers 1 and 2, releases A, C, B1, D and B2), deliberately small: the file format, the folders and the way skins are loaded and switched are fixed. Besides CSS, since 0.2 a skin can bring a set of design choices (`design`) that work on **all devices**: ports mode, colour scheme, haptics and style and size of the host knob (table below). Since 0.3 a skin can also choose the face, size and colour of the controls a device registers (`design.controls`, below). Since 0.4 it can also choose the face and size of meters that a device has the host draw (`design.meters`: bar, LED ladder or a round VU meter with a needle in the same place, adjustable length and width). Since 0.5 it can also style the groups of controls of a device as sections (`design.sections`: frame, columns, spacing, bare controls, label below) and give an appearance a card width (`design.size`). Since 0.6 it can also choose the shape, size, colour and feedback of pads and steps (`design.pads`) and show choice lists as a small screen with < > and [ok] (`design.display`). Since 0.7 it can also put the controls of a device into panels and an order (`design.layout`: flow, panels with items by id, role or group, frame, columns, collapsible; nothing is ever hidden, what is not named lands in a rest panel). Artwork and an editor do not exist yet. The folder has four example skins for Duofone, three for Filter, two for Mixer, three for Drum Machine and a device icon. Skins of 0.1 to 0.6 keep working.

**The skin editor.** You do not have to write a skin by hand: in Patchkamer (Skins tab, button *Skin editor*) you can design a skin with a live preview on a real card of the device, and save or export it as `*.patchkamer-skin.json`. The editor writes existing skins (skins contract 0.7 or lower), so the formats below still apply. An exported skin contains `author`, `license` (default `CC0-1.0`), `description` and `icon` as soon as you fill them in; the validator requires them for the library.

## What is in here

| Folder | Contents | License |
|---|---|---|
| [`library/`](library/) | The skins, one folder per device id (for example `nl.patchkamer.duofone`), with an optional `icon.*` for the device | CC0-1.0 |
| [`contract/`](contract/) | The skins contract ([English](contract/SKINS-CONTRACT_EN.md), [Dutch](contract/SKINS-CONTRACT_NL.md)) and the validator [`validate-skin.mjs`](contract/validate-skin.mjs) | MIT |

## How to use them

- Load `github.com/unboxednl/patchkamer` as a library in Patchkamer: the skins come with it. Or download a file from a folder in `library/` and import it in the **Skins** panel.
- Then choose a skin, and an appearance, on the card of the device.

## File format

One skin per file, named `name.patchkamer-skin.json`: JSON with `format` (`patchkamer-skin`), `formatVersion` (1), `skinsContract` (`0.8`, `0.7`, `0.6`, `0.5`, `0.4`, `0.3`, `0.2` or `0.1`), `id`, `device` (the exact id of the device), `name`, `version`, `author`, `license`, `description`, `created`, `icon`, `default`, an optional `design` and a list of `appearances` (each possibly with its own `design`). Check a skin with `node contract/validate-skin.mjs file.patchkamer-skin.json`. The full format is in the [contract](contract/SKINS-CONTRACT_EN.md); rules for agents that write skins: [AGENTS.md](AGENTS.md) (in Dutch).

## Design choices (`design`)

| Option | Values | Works on |
|---|---|---|
| `design.ports.mode` | `default`, `always`, `hover`, `strip` | the port bar at the top of every device (not with `ui.jacks`) |
| `design.colors` | `scheme` `workspace` or `custom` with `bg`, `surface`, `text`, `muted`, `accent`, `line` (`#rgb` or `#rrggbb`) | the card and the host element of every device |
| `design.haptics` | `click`, `turn`, `slide`: `off`, `light`, `medium`, `strong` | every card (only where the device or browser vibrates) |
| `design.knobs` | `style` `workspace`, `rotary`, `slider`; `size` `s`, `m`, `l` | only `host.ui.knob` controls (short form of `controls`) |
| `design.controls` (0.3) | a list of rules `{ match, face, size, length, thickness, thumb, color, activeColor, showValue }`; `match` is `*`, an id, `role:<role>` or `group:<group>`; the last matching rule wins | the controls a device registers with an id, role and group (device contract v1.15, §12d); a skin never hides a control |
| `design.meters` (0.4) | a list of rules `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }`; `match` is `*`, an id or `group:<group>`; `face` is `bar`, `ledladder`, `vu` or `default`; the last matching rule wins | the meters a device has the host draw with `host.ui.meter` (device contract v1.18, §12e); a VU face replaces the bar in the same place; a skin never hides a meter |
| `design.sections` (0.5) | a list of at most 32 rules `{ match, frame, columns, gap, bare, labels, align }`; `match` is `*` or `group:<group>`; the last matching rule wins | groups of controls that sit in one element of their own; a section that cannot be found is skipped and the Skins panel says "n of m sections"; a skin never hides or moves anything |
| `design.size` (0.5) | `{ width }`, 200 to 1600 px | the card width of an appearance, applied only when the skin or appearance is picked by hand (not with Auto) |
| `design.pads` (0.6) | one object `{ shape, size, color, palette, colors, idle, active, led, hit, press, gap, rules }`; `rules` (0.8) is a list of rules per pad `{ match, kind, color, activeColor, led }` with `kind` `toggle`, `pad` or `velocity`; `shape` is `circle`, `square`, `rounded` or `rect`; `colors` gives a colour per pad (id, `role:step` or `group:<group>`) | the pads a device has the host draw with `host.ui.pad`, step buttons of `host.ui.steps` with options and buttons of its own marked `data-pk-role="pad"`/`"step"` (device contract v1.22, §12f); a skin never hides a pad |
| `design.display` (0.6) | one object `{ style, nav, commit, lines, width, expand, targets, color }`; `style` is `dropdown`, `lcd`, `oled`, `segment` or `paper` | choice lists as a small screen with < > and [ok] and an enlarged panel on click; with `targets` also the preset and tune picker in the card head; a skin never hides the choice |
| `design.layout` (0.7) | one object `{ flow, panels }`; `flow` is `rows`, `columns` or `auto`; at most 16 panels with `id`, `items` (an id, `role:<role>`, `group:<group>` or `*`), `title`, `style`, `dir`, `cols`, `gap`, `bare`, `labels`, `align`, `width`, `collapsible`, `collapsed` | all controls a device registers (id/role/group); they are moved, never hidden; whatever is not named lands in a rest panel; devices with a layout of their own (Control Surface) are skipped |

All keys are optional; a missing key lets the device or the workspace keep its own behaviour. The `design` of an appearance overrides that of the skin per key. See [`library/nl.patchkamer.duofone/`](library/nl.patchkamer.duofone/) for `example-back-panel`, `example-touch` and `example-panels` (design.layout), [`library/nl.patchkamer.filter/`](library/nl.patchkamer.filter/) for `example-controls`, `example-sliders` (design.controls) and `example-panels` (design.layout), [`library/nl.patchkamer.mixer/`](library/nl.patchkamer.mixer/) for `example-meters` and `example-vu` (design.meters), and the [contract](contract/SKINS-CONTRACT_EN.md) (§4b) for the details. See which ids, roles and groups a device offers with `node contract/validate-instrument.mjs <device> --controls`, and check a skin against a device with `node skins/contract/validate-skin.mjs <skin> --device <device>`.

## License

The skins in `library/` are CC0-1.0 (public domain): you may reuse a skin without naming the author. The contract and validator in `contract/` are MIT. See [LICENSING.md](../LICENSING.md) (in Dutch).
