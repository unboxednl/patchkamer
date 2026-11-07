# Patchkamer — Skins contract v0.4 for building agents

This document is the complete, self-contained instruction for building a **skin** for **Patchkamer**: a separate file that changes the look of one device, without touching the device itself or the device contract. An agent that receives this document needs no other context. Deliver a file `name.patchkamer-skin.json` that follows this contract and passes `validate-skin.mjs` without errors.

_This contract exists in two languages: `SKINS-CONTRACT_NL.md` (Dutch, the source text) and `SKINS-CONTRACT_EN.md` (English). Both have the same version and the same content; if they differ, the Dutch text applies. The validator speaks both languages too (`--lang nl|en`)._

_This contract is a contract of its own next to the device contract (`../../contract/PATCHKAMER-CONTRACT_EN.md`, now v1.18) and has its own version number. A skin asks nothing of a device: no change to devices is needed._

| Version | What was added |
|---|---|
| v0.1 | First version, deliberately small: a manifest, appearances with CSS and embedded images, automatic switching on card width and screen class, an icon per skin and per device. The content of a skin is a placeholder; the requirements for artwork, control graphics and layout follow later (§13) |
| v0.2 | Layer 1: the field `design` with design choices that work on all devices (ports mode, colour scheme, haptics, style and size of the host knob), at skin level and per appearance (§4b). Skins of 0.1 keep working unchanged |
| v0.3 | Layer 2, release A "ids and roles": `design.controls`, an ordered list of rules that chooses, per id, role or group, the face (rotary knob, horizontal or vertical slider), size, length, thickness, thumb, colour and value display of controls (§4b). Belongs to device contract v1.15. Skins of 0.1 and 0.2 keep working unchanged |
| v0.4 | Layer 2, release C "meters": `design.meters`, an ordered list of rules that chooses, per id, group or everywhere, the face of a meter (bar, LED ladder or a round VU with a needle that replaces a bar, never beside it), the direction, the length and the width, the ballistics (fall), the peak line, the clip lamp, the scale, the colour and the number of LEDs (§4b). Belongs to device contract v1.18 (`host.ui.meter`). Skins of 0.1 up to 0.3 keep working unchanged |

---

## 1. Purpose and scope

- A **skin** changes only the **look** of one device. A skin never touches the state, the sound, the ports or the behavior of the device.
- A skin is **one file** of data (JSON). It contains no script and no device code. The host puts the CSS in it into the shadow root of the device.
- A skin belongs to **one device id** (the field `device`). For another device it is kept but never offered.
- A device does not have to do anything to be able to get skins. If the device has no open shadow root (see §4), the host cannot apply the skin and says so; that is not a fault of the skin or of the device.
- Skins are a new kind of library material next to tunes and presets: they are loaded from sources (a GitHub folder, a local folder, an address), browsed in a panel of their own, chosen per device on the card, saved in the workspace and in the song, and can be dropped on the canvas (§8, §9).
- Version 0.4 stays deliberately small: CSS plus a small set of design choices (`design`, §4b), including the face of controls (`controls`) and of meters (`meters`). The format is extensible (unknown fields are ignored, §10); what is not in it yet is in §13.

---

## 2. The file

A skin is a UTF-8 JSON file with one object, named `name.patchkamer-skin.json`: lowercase letters with hyphens, **without a version number** in the name (the version is in `version`, earlier versions are in git). The file is at most 2 MB.

### 2a. Fields at the top level

| Field | Type | Range and rule | Default | Required |
|---|---|---|---|---|
| `format` | text | always `"patchkamer-skin"` | | yes |
| `formatVersion` | integer | now `1` | | yes |
| `skinsContract` | text | `"major.minor"`, now `"0.4"` (`"0.1"`, `"0.2"` and `"0.3"` stay valid); see §10 | | yes |
| `id` | text | 3 to 100 characters from `[a-z0-9.-]`; recommended `<device-id>.<slug>`; unique: the same `id` is the same skin | | yes |
| `device` | text | the `id` of the device the skin is for, for example `nl.patchkamer.duofone` | | yes |
| `name` | text | English name, 1 to 60 characters, brand-free (§11) | | yes |
| `version` | text | semver `x.y.z` of the skin | | yes |
| `author` | text | maker, 1 to 60 characters | | yes |
| `license` | text | SPDX id; in `skins/library/` always `CC0-1.0` (§11) | | yes |
| `description` | text | English, 1 to 300 characters | | yes |
| `created` | text | date `YYYY-MM-DD` | | yes |
| `icon` | text or `null` | `null`, or an image as a data address, at most 200 kB (§6) | `null` | yes (may be `null`) |
| `default` | text | the `id` of the appearance that applies when nothing fits in `auto` (§3) | the first appearance | no |
| `design` | object | design choices for all appearances (§4b); since 0.2 | none | no |
| `appearances` | list | 1 to 12 appearances (§2b) | | yes |

Two skins with the same `id` are the same skin: the newer `version` wins. Together with `device`, `id` identifies the skin.

### 2b. An appearance

An **appearance** is one look of the skin, for example a compact and a wide variant.

| Field | Type | Range and rule | Default | Required |
|---|---|---|---|---|
| `id` | text | 1 to 40 characters from `[a-z0-9-]`, unique within the skin | | yes |
| `name` | text | English name, 1 to 40 characters, brand-free | | yes |
| `description` | text | English, at most 300 characters | empty | no |
| `when` | object | conditions for **automatic** choosing (§2c, §3) | none: never automatic | no |
| `css` | text | CSS for the shadow root of the device, at most 200 kB (§4) | empty | no |
| `assets` | object | name → data address of an image (§5) | `{}` | no |
| `design` | object | design choices for this appearance only; overrides the `design` of the skin per key (§4b) | none | no |

### 2c. The conditions `when`

All conditions given must hold. A field that is missing sets no condition.

| Field | Type | Range and rule | Default | Required |
|---|---|---|---|---|
| `minWidth` | integer | 0 to 10000: the card is at least this wide (CSS pixels, in floor coordinates, without zoom) | 0 | no |
| `maxWidth` | integer | 0 to 10000: the card is at most this wide; `minWidth` must not be greater than `maxWidth` | no limit | no |
| `screens` | list | one or more of `"phone"`, `"compact"`, `"wide"` (see §3) | all screen classes | no |

---

## 3. Choosing appearances

On the card of a device with at least one skin, the user chooses a **Skin** (Default, or a skin) and an **Appearance**: **Auto** or an appearance of the chosen skin.

With **Auto** the host chooses by itself, and chooses again when the width of the card or the screen class changes:

1. Go through the appearances **in the order of the file**; the first one whose `when` holds is chosen. An appearance **without `when`** never fits automatically (only by hand).
2. If none fits, the appearance in `default` applies.
3. If `default` is missing, the first appearance applies.

Choosing an appearance by hand turns Auto off for that device, until the user goes back to Auto.

The width is that of the device card in floor coordinates, without zoom. The screen classes are the ones the host already knows:

| Value | What |
|---|---|
| `phone` | window narrower than 700 px |
| `compact` | window 700 to 1099 px wide |
| `wide` | window 1100 px or wider |

Write `when` so that the ranges do not overlap and complement each other; put the appearance that fits most often last or in `default`. The validator gives a warning for conditions that can never hold or that are always shadowed by an earlier appearance (§12).

---

## 4. CSS

The `css` of the active appearance is put as a stylesheet in the **shadow root of the device** for as long as that appearance is active, and is removed for Default. The host should put that block **after** the device's own styles, so that at equal specificity the skin wins.

**What is not allowed** (the validator rejects it):

- no `@import`;
- no `url(` to anything other than a `data:` address or `var(--skin-asset-…)` (so no relative addresses and no `#fragment` either);
- no `image-set(`, no `</style`, no `javascript:`, `expression(`, `-moz-binding` and `behavior:`;
- at most 200 kB per appearance.

Apart from that, ordinary CSS is allowed, including `@media`, `@container` and `@keyframes`. A skin cannot change the behavior of a device, and CSS reaches nothing outside the shadow root of the device.

**How selectors work in the shadow root.** The stylesheet is inside the shadow root, not in the main document. Therefore:

- `:host` is the element that carries the shadow root (the host element of the device), and `:host(.class)` or `:host([attribute])` selects it only in a certain state. Devices usually set their own CSS variables and their outer styling here.
- Ordinary selectors (`.class`, `button`, `#id`) only reach elements **inside** that shadow root, so only the UI of that one device.
- CSS variables (`--name`) pass through the boundary of the shadow root. A skin can therefore give a variable of the device, or of the host (such as `--fg`, `--line` and `--muted`), another value on `:host`, provided the device uses that variable.
- `::part(name)` only works on parts of a **nested** shadow root that has a `part` of its own. That depends on the device.
- What exactly a device offers **differs per device** and is deliberately marked in this contract as **to be established per device**: which classes, ids, variables and `part` names exist is in the source of that device (and later in the description of the device, §13). **Do not invent classes or variables.** Use only what you see in the device file; a selector that matches nothing is not an error, but it does nothing either.
- A device without an open shadow root (without `attachShadow`, or with a closed one) cannot be given a skin by the host. That is a message, not an error.

---

## 4b. Design choices (`design`, from 0.2; `controls` from 0.3; `meters` from 0.4)

Besides CSS, from version 0.2 a skin can bring a set of **validated design choices** in the field `design`. Unlike CSS, these choices work on **all devices** through the host, without the device having to do anything (with the limits below). `design` sits at skin level (the default for all appearances) and can be overridden per appearance with `appearances[].design`.

```json
"design": {
  "ports":   { "mode": "default|always|hover|strip|bar" },
  "colors":  { "scheme": "workspace|custom",
               "custom": { "bg": "#rrggbb", "surface": "#rrggbb", "text": "#rrggbb", "muted": "#rrggbb", "accent": "#rrggbb", "line": "#rrggbb" } },
  "haptics": { "click": "off|light|medium|strong", "turn": "off|light|medium|strong", "slide": "off|light|medium|strong" },
  "knobs":   { "style": "workspace|rotary|slider", "size": "s|m|l" },
  "controls": [ { "match": "*|<id>|role:<role>|group:<group>", "face": "rotary|hslider|vslider|default", "size": "xs…xl|0.6..2", "length": "short|medium|long|40..400", "thickness": 2, "thumb": "round|square|bar|none", "color": "accent|#rrggbb", "showValue": "always|hover|never" } ],
  "meters": [ { "match": "*|<id>|group:<group>", "face": "bar|ledladder|vu|default", "orientation": "auto|vertical|horizontal", "length": "short|medium|long|24..400", "width": 8, "ballistics": "default|fast|vu|slow", "peakHold": "on|off|default", "clip": "show|hide|default", "scale": "show|hide", "color": "accent|default|#rrggbb", "segments": 20 } ]
}
```

### Overview and merging

- **All keys are optional.** A missing key means: the behaviour of the device itself or of the workspace (the value `default`, `workspace` or `off` below). A skin without `design` (including every 0.1 skin) behaves exactly as before.
- **Merging:** the host takes the `design` of the skin and lays the `design` of the chosen appearance over it, **per key** (and per colour in `colors.custom`). An appearance only has to repeat what differs.
- **Lenient in the host, strict in the validator:** the host ignores an invalid value or unknown key (that one key falls back to the default behaviour) and reports it; the validator gives an **error** for an invalid value and a warning for an unknown key. Unknown keys and sections belong to later versions (§13) and are ignored.
- **Standard clears everything:** if the user picks Standard (no skin) on the card, the card, the device and the cables are exactly as without a skin.
- `design` belongs to `skinsContract` `"0.2"` (`controls` to `"0.3"`, `meters` to `"0.4"`). In a file with `"0.1"` a 0.1 host ignores it; the validator gives a warning there, and also for `controls` in a 0.2 file and for `meters` in a 0.3 file.

### Ports mode (`ports.mode`)

The cable ports sit at the top of the device, like the back of a device. The mode decides when they are visible:

| Value | What |
|---|---|
| `default` | as now: the behaviour of the host is unchanged |
| `always` | the port bar is always visible at the top of the device (like the mixer panel) |
| `hover` | the ports are hidden; they appear at the top as soon as you drag a cable over the device, or move the mouse over the port strip at the top |
| `strip` | a thin port strip at the top is always visible; the mouse (with or without a cable) over that strip or over the device shows all ports |
| `bar` | the ports are always visible as small dots in the title bar, between the device name and the version selector; the bar does not grow (the name shrinks if space runs out) and cables hang from the dots |

```
 default / always              hover or strip, closed         hover or strip, open
+-------------------------+   +-------------------------+   +-------------------------+
| [in] [in] [out] [mod]   |   |=========== strip ======|   | [in] [in] [out] [mod]   |
+-------------------------+   +-------------------------+   +-------------------------+
|                         |   |                         |   |                         |
|       device UI         |   |       device UI         |   |       device UI         |
|                         |   |                         |   |                         |
+-------------------------+   +-------------------------+   +-------------------------+
 (default: as before;          (hover: no strip, ports       (a cable over the device or
  always: bar never hides)      hidden until needed)          the pointer over the strip)
```

- **Touch** (no hover): `hover` and `strip` open and close by tapping the strip, and also show the ports while a cable is dragged over the device.
- **Cables stay correct:** a hidden port draws its cable to the strip (no cables that end in nothing), and connecting to a hidden port by dragging a cable over the device works: the ports unfold as soon as the cable is above them. This holds for all kinds of ports (audio, midi, mod, mastering, event and the others).
- **Exception:** a device that draws its ports in its own UI (`ui.jacks: true`) keeps the mode `default`; the Skins panel says so.

### Colour scheme (`colors`)

| Key | Values | Default |
|---|---|---|
| `scheme` | `workspace`: the colours of the workspace; `custom`: the colours from `custom` | `workspace` |
| `custom` | object with the six colours below | none |

Each colour is `#rgb` or `#rrggbb` (capitals are fine; the host turns them into six lowercase digits). Other notations (`rgb()`, names, eight digits) are rejected.

| Colour | Meaning |
|---|---|
| `bg` | background of the card and the device |
| `surface` | surfaces on the background (panels, title bar, port bar) |
| `text` | ordinary text |
| `muted` | secondary things, labels and disabled text |
| `accent` | the accent colour (active parts, highlights) |
| `line` | borders and dividing lines |

- **The host applies the colours as CSS variables** on the host element of the device and on the card itself (title bar, port bar), **not** on the workspace. The effect on a device depends on whether the device uses those variables; what the host really sets is below.
- If a colour is missing with `scheme: "custom"`, it falls back to the workspace colour (the panel says so; the skin is not rejected).
- **Contrast:** the validator calculates the contrast of `text` against `bg` and against `surface` (WCAG ratio); below 3:1 it gives a warning. It is not a rejection.

**Which skin colour sets which variable** (only with `scheme:"custom"` and only for colours that are filled in; as inline style on the card and on the device itself, which inherits into the shadow root):

| Skin colour | On the card | On the device |
|---|---|---|
| `bg` | `--card` | `--card`, `--floor`, `--bg`, `--panel` |
| `bg` (derived) | `--well`, `color-scheme` | same |
| `surface` | `--card-2`, `--bar`, `--field` | same, plus `--panel-2` |
| `surface` (derived) | `--step-q` | same |
| `text` | `--fg`, `--bar-fg`, `--field-fg`, `--well-fg` | same |
| `muted` | `--muted` | `--muted` |
| `accent` | `--sel`, `--accent` | same, plus `--audio` |
| `line` | `--line` | `--line` |

A device that uses its own variables or fixed colours follows only what is in this table. `--audio` is set on the device only, so ports and cables keep their colour per kind.

### Haptics (`haptics`)

| Key | When the host vibrates |
|---|---|
| `click` | on buttons and pads (`button`, `[role=button]`, and a press on other clickable parts in the card) |
| `turn` | when turning a host knob (`host.ui.knob`), per step |
| `slide` | when moving a `range` input, per step |

Values: `off` (none), `light` (8 ms), `medium` (15 ms), `strong` (30 ms); default `off`.

- The host uses `navigator.vibrate` (one short pulse). It does **not** vibrate if the device does not support it (for example Safari on iPhone), if the user has `prefers-reduced-motion`, or if the page is in the background.
- **Limits:** at most one pulse per 40 ms per card; for `turn` and `slide` per step (not per pixel) and at most 25 pulses per second.
- The host listens on the card (the events are `composed`), so also for parts in open shadow roots of the device.
- Haptics change neither the sound nor the state.

### Knobs (`knobs`)

| Key | Values | Default |
|---|---|---|
| `style` | `workspace`: the global setting of the workspace; `rotary`: rotary knobs; `slider`: sliders | `workspace` |
| `size` | `s`, `m`, `l`: the host knob at about 0.8, 1 and 1.3 times the normal size | `m` |

This works **only on what is built through `host.ui.knob`**. Since 0.3 this is the short form of a `controls` rule (see below); for a device's own `range` inputs, `controls` are the tool, provided the device registers them. The Skins panel says so honestly: "works on devices that use the host knob", with the number of devices that do.

### Controls (`controls`, from 0.3)

With `design.controls` a skin chooses the **face, size and colour of controls**: rotary knobs instead of sliders (or the other way round), vertical or horizontal sliders, length, thickness, thumb, and whether the value is shown. It is an **ordered list of rules**; each rule has a `match` and one or more properties.

```json
"design": {
  "controls": [
    { "match": "*",            "face": "rotary", "size": "m" },
    { "match": "role:fader",   "face": "vslider", "length": "long", "thumb": "bar" },
    { "match": "group:filter", "color": "#ffb000" },
    { "match": "cut",          "size": "xl", "showValue": "always" }
  ]
}
```

| Key | Values | Meaning |
|---|---|---|
| `match` (required) | `"*"`, an id (`"cut"`), `"role:<role>"` or `"group:<group>"` | Which controls the rule touches. Ids, roles and groups are published by the device (device contract §12d). An id is 1 to 60 characters from `[A-Za-z0-9._-]`; roles: `param`, `fader`, `toggle`, `button`, `pad`, `step`, `display`, `select`, `meter`, `jack`. |
| `face` | `rotary`, `hslider`, `vslider`, `default` | The face: rotary knob, horizontal slider, vertical slider, or what the device itself asked for (`default`). A skin cannot touch the model (value, events), only how the control looks. |
| `size` | `xs`, `s`, `m`, `l`, `xl`, or a number 0.6 to 2.0 | Scale relative to the normal size. |
| `length` | `short`, `medium`, `long`, or a number 40 to 400 (px) | Length of a slider. |
| `thickness` | number 2 to 24 (px) | Thickness of the track of a slider. |
| `thumb` | `round`, `square`, `bar`, `none` | The thumb (the grip) of a slider. |
| `color` | `"accent"` or `#rgb` / `#rrggbb` | Colour of the pointer, the filled part or the thumb. |
| `showValue` | `always`, `hover`, `never` | Whether the number next to the control is visible. |

- **Order:** rules are applied in order; per property the **last matching rule** wins. So put the general rules (`"*"`) first and the special ones (`"cut"`) last.
- **Merging:** the rules of the `design` of the chosen appearance come **after** those of the skin, and so win. The maximum is **64 rules** per list; anything above is ignored (the validator gives an error).
- **Short form:** `knobs.style` and `knobs.size` (0.2) keep working and equal a rule `{ "match": "role:param", "face": …, "size": … }` placed before all `controls` rules; a `controls` rule therefore always wins.
- **A skin never hides a control.** There is no `face: "none"` and no key to leave something out. The validator gives an error for it, the host ignores it.
- **Reach:** the rules only work on controls the device registers: what is built through `host.ui.knob` and elements the device registered with `host.ui.adopt` or `data-pk-*` (device contract §12d). Devices that register nothing are left alone; the Skins panel reports "n of m controls" so you see how many take part. `length`, `thickness` and `thumb` only touch sliders; with `face: "rotary"` they do nothing (the validator gives a warning).
- **Unknown ids:** a `match` with an id, role or group the device does not have is silently ignored by the host. The validator cannot see that without the device (a warning for a role that is not in the list); with `--device` it can (see §12).
- **Default:** without a skin, or without `controls`, the device is exactly as it was.
- **Accessibility** stays: another face keeps keyboard, touch, double-click (default value) and typing working. A skin cannot turn that off.

### Meters (`meters`, from 0.4)

With `design.meters` a skin chooses the **face and size of meters**: a bar, a row of LEDs or a round VU meter with a needle that swings from left to right, and how long, how wide and how fast it reacts. A **VU face replaces the bar in the same place**; it does not sit beside it. As with `controls` it is an **ordered list of rules** with a `match` and one or more properties. It only works on meters that the device has the host draw with `host.ui.meter` (device contract §12e); a meter that a device draws itself stays as it was.

```json
"design": {
  "meters": [
    { "match": "*",            "face": "ledladder", "segments": 16, "ballistics": "fast" },
    { "match": "group:meters", "orientation": "vertical", "length": "long", "width": 8 },
    { "match": "met.master",   "face": "vu", "length": 180, "scale": "show", "color": "accent" }
  ]
}
```

| Key | Values | Meaning |
|---|---|---|
| `match` (required) | `"*"`, an id (`"met.master"`) or `"group:<group>"` | Which meters the rule touches. Ids and groups are published by the device (device contract §12e). There is no `role:`; every meter has role `meter`. An id is 1 to 60 characters from `[A-Za-z0-9._-]`. |
| `face` | `bar`, `ledladder`, `vu`, `default` | The face: bar (the device's usual look), a row of separate LEDs (green, yellow, red with the same thresholds as the bar), a half-round scale with a needle (`vu`; red from 3 dB below the maximum; with two channels two needles in a different tint on one scale), or what the device itself asked for (`default`). |
| `orientation` | `auto`, `vertical`, `horizontal` | The direction of a bar or LED ladder; `auto` is the device's choice. A `vu` ignores it, because its scale is always horizontal. |
| `length` | `short`, `medium`, `long`, or a number 24 to 400 (px) | The length in the direction of the deflection: the height with `vertical`, the width with `horizontal`; with `vu` the width of the dial (the height is then 0.6 times the length). |
| `width` | number 3 to 48 (px) | The thickness of a bar or LED ladder. Ignored with `vu` (the validator gives a warning). |
| `ballistics` | `default`, `fast`, `vu`, `slow` | How the deflection falls: `default` is the device, `fast` jumps up at once and falls at about 24 dB per second (the current Mixer look), `vu` is a classic VU (300 ms integration, calm rise and fall), `slow` jumps up at once and falls at about 6 dB per second. With face `vu` and no value given it is `vu`, otherwise `default`. The host computes this in one place; the sound does not change. |
| `peakHold` | `on`, `off`, `default` | The peak line that falls slowly. |
| `clip` | `show`, `hide`, `default` | The clip lamp. It stays visible only if the device set a clip threshold, or if the skin chooses `show` (the threshold is then the maximum of the scale). |
| `scale` | `show`, `hide` | Ticks and dB numbers. Only with `vu` and `ledladder`; by default the scale is visible on `vu` and not on `bar`. |
| `color` | `"accent"`, `"default"` or `#rgb` / `#rrggbb` | Colour of the ordinary part of the meter. The thresholds for yellow and red stay. |
| `segments` | whole number 8 to 40 | The number of LEDs of a `ledladder` (default 20). |

- **Order and merging** are as with `controls`: the **last matching rule wins per property**; the rules of the appearance come after those of the skin; at most **64 rules** per list (the validator gives an error for more).
- **A skin never hides or sets anything.** There is no `face: "none"` and no key to leave a meter out; a skin does not touch a value either. The validator gives an error for it, the host ignores it.
- **Default:** without a skin, or without `meters`, the face and size are those of the device itself.
- **Space:** a `vu` needs at least 56 × 36 px. The host enlarges the meter's element for that, and the device's layout grows with it (a channel strip of the Mixer then becomes wider). The Skins panel says so. On a mixer with many channels, rather choose `ledladder` or a short `bar` if the card becomes too wide.
- **Unknown ids:** a `match` with an id or group the device does not have is silently ignored by the host. The validator cannot see that without the device; with `--device` it can, as a warning (see §12). The Skins panel reports "n of m meters".
- **Accessibility:** every face stays a `role="meter"` with value, minimum, maximum and label for screen readers.

### What "works on all devices" means

| Part | Reach in layer 1 |
|---|---|
| `ports.mode` | all devices with a port bar drawn by the host; not with `ui.jacks: true` (stays `default`) |
| `colors` | all devices for the card (title bar, port bar) and for the host element; the UI inside a device only follows where it uses the variables |
| `haptics` | all devices with an open shadow root or plain UI in the card; not visible inside a closed shadow root |
| `knobs` | only what is built through `host.ui.knob` |
| `controls` | only controls the device registers (`host.ui.knob`, `host.ui.adopt`, `data-pk-*`; device contract §12d); the rest is left alone |
| `meters` | only meters the device has the host draw with `host.ui.meter` (device contract §12e); the rest is left alone |

**Not yet available** (further steps of layer 2 and layer 3, §13): panels and layout, pads, a small screen, and an editor. `design` changes nothing about how a device is built.

---

## 5. Images in a skin (`assets`)

An image goes in `assets` as a data address. The host sets every image as the CSS property `--skin-asset-<name>: url("data:…")` on the host element of the device, so that the CSS can use them:

```css
:host { background: var(--skin-asset-face) center / cover no-repeat; }
```

- `name`: 1 to 40 characters from `[a-z0-9-]`.
- Allowed types: `data:image/svg+xml`, `data:image/png;base64,…`, `data:image/webp;base64,…`, `data:image/jpeg;base64,…`. An SVG (also an embedded one) may contain no script, no `foreignObject` and no external reference.
- At most 200 kB per image and 1 MB together in the whole skin.
- The CSS refers to an image with `var(--skin-asset-<name>)` (or `url(data:…)` directly). A `--skin-asset-<name>` in the CSS without a matching `assets` item is an error; an `assets` item the CSS does not use is a warning.

---

## 6. Icons

There are two kinds of icons, and a **device** gets its icon from six places. What wins, from high to low:

| Priority | Source |
|---|---|
| 1 | the `icon` of the **active skin** of that device on that card (if the skin has one) |
| 2 | the icon the user chose for that device (does not exist yet; do not build) |
| 3 | `icon.*` in the **device folder** of the device library (`devices/<category>/<Name>/`) |
| 4 | `icon.*` in `skins/library/<device-id>/` |
| 5 | the icon of the **category** of the device (user choice, layout file, `icon.*` in the category folder, built-in) |
| 6 | the neutral default icon |

- **The `icon` field of a skin** is `null` or an image as a data address (`data:image/svg+xml…`, `data:image/png;base64,…`, `…/webp;base64,…`, `…/jpeg;base64,…`), at most 200 kB.
- **An icon file** is `icon.svg`, `icon.png`, `icon.webp` or `icon.jpg` in the device folder or in `skins/library/<device-id>/`. A folder has at most one `icon.*`.
- **A device icon of its own** is shown as it is (not recolored), in the same slot as the category icon. A device without an icon of its own shows the category icon in the category color.
- **Style** for an `icon.svg`: a simple icon of your own with `viewBox="0 0 24 24"`, line art with `stroke="currentColor"`, `stroke-linecap="round"` and `stroke-linejoin="round"`, in the style of the category icons. Brand-free: no logos and no pictures of existing products.
- **Safety:** an icon is only shown as an image (`<img>`/data address), never as inline markup. An SVG therefore contains no `<script>`, no `<foreignObject>`, no event attributes (`onload=` and the like), no `href` or `url(` to anything outside the file and no `@import`. An icon only comes from the same source as the library.
- **Size:** at most 200 kB.

---

## 7. Folders and file names

```
skins/
  AGENTS.md                         for agents that build skins
  README.md, README_NL.md
  contract/
    SKINS-CONTRACT_NL.md            this contract (source text)
    SKINS-CONTRACT_EN.md
    validate-skin.mjs               the validator
  library/
    <device-id>/                    one folder per unique device id, for example nl.patchkamer.duofone
      icon.svg|png|webp|jpg         optional: the icon of the device
      <name>.patchkamer-skin.json   one or more skins for this device
```

| Rule | What |
|---|---|
| Folder name | In `skins/library/<device-id>/` the folder name equals the field `device` of the skins in it. The validator gives an **error** on a difference |
| Elsewhere | If a skin is outside `skins/library/<device-id>/`, the validator gives a warning: the host will not find it by itself (loading, dropping and importing do work) |
| File name | `<name>.patchkamer-skin.json`, lowercase with hyphens, without a version number |
| Icons | `icon.svg`, `icon.png`, `icon.webp` or `icon.jpg`, at most one per folder |

---

## 8. Library and loading

- The host finds skins in a source (GitHub folder, local folder or address) as `skins/library/<device-id>/*.patchkamer-skin.json`, and with them the `icon.*` in those folders. The default source is the folder `skins/library` of `github.com/unboxednl/patchkamer`.
- Skins appear in a panel of their own (**Skins**) next to Tunes and Presets, per device. A skin can also be **dropped** on the canvas or **imported**: `*.patchkamer-skin.json`, or JSON with `format: "patchkamer-skin"`.
- A skin for another device id is kept but never offered.
- A skin with an unknown major of `skinsContract` is rejected, with a message.
- Invalid fields give a message with the file name; the rest of the library is loaded as usual.
- On the card the lists **Skin** and **Appearance** only appear if there is at least one skin for the device id.
- A skin never changes the state, the sound or the behavior of the device.

---

## 9. Saving in workspace and song

- Per device a workspace or song keeps an optional field `skin: { id, appearance }`. `appearance` is `"auto"` or the `id` of an appearance.
- The skins in use are **embedded** in the export of the workspace or song, as a list `skins: [ … ]` (at most 20, each at most 2 MB), so that a song keeps the same look without the library.
- An old workspace or song without `skin` or `skins` loads unchanged.
- A song that uses a skin is still an ordinary song: the sound and the device state are the same with or without the skin.

---

## 10. Versions

This contract has a version `major.minor` (now **0.4**), recorded in the field `skinsContract` of every skin.

| Difference with the version of the host | What the host does |
|---|---|
| Same major, same or lower minor | loads the skin |
| Same major, higher minor | loads the skin and **ignores unknown fields** |
| Another major | rejects the skin with a message |

- A new **minor** only adds things (new fields, new values that old hosts may ignore). A change that breaks old skins raises the **major**.
- Unknown fields, also inside an appearance or in `when`, **are ignored** and not rejected. The validator reports them with a warning to catch typos.
- `formatVersion` (now `1`) is the version of the file layout itself; `skinsContract` is the version of this contract.
- Keep `id` and `device` the same in a new version of a skin and raise `version`: the newer `version` wins.
- This contract, the validator (`validate-skin.mjs`) and the host belong to the same version. The first lines of `SKINS-CONTRACT_NL.md`, `SKINS-CONTRACT_EN.md` and `validate-skin.mjs` each name "v0.4".

**Changes from 0.1 to 0.2:**

| Part | 0.1 | 0.2 |
|---|---|---|
| `skinsContract` | `"0.1"` | `"0.2"`; `"0.1"` stays valid |
| Field `design` (skin and appearance) | does not exist | new, optional (§4b) |
| Ports mode | only the behaviour of the host | `ports.mode`: `default`, `always`, `hover`, `strip`, `bar` |
| Colours | only via CSS variables in the skin | `colors`: scheme `workspace` or `custom` with six colours |
| Haptics | none | `haptics`: `click`, `turn`, `slide` |
| Host knob | none | `knobs`: `style` and `size` |
| Validator | no check on `design` | checks `design` (stricter than the host) and has test cases |
| Existing 0.1 skins | | keep working unchanged |

**Changes from 0.2 to 0.3:**

| Part | 0.2 | 0.3 |
|---|---|---|
| `skinsContract` | `"0.2"` | `"0.3"`; `"0.1"` and `"0.2"` stay valid |
| `design.controls` | does not exist | new, optional: ordered list of rules `{ match, face, size, length, thickness, thumb, color, showValue }` (§4b) |
| Pointing at controls | only by label (fragile) | by `id`, `role:<role>` and `group:<group>` that the device publishes (device contract v1.15, §12d) |
| `knobs.style` / `knobs.size` | style and size of the host knob | keep working as the short form of a `controls` rule on `role:param` |
| Validator | checks `design` | also checks `controls` (shape, ranges, `face: "none"` is an error, a warning for an unknown role or a property that does not fit) and knows `--device <device>` for ids, roles and groups |
| Existing 0.1 and 0.2 skins | | keep working unchanged |

**Changes from 0.3 to 0.4:**

| Part | 0.3 | 0.4 |
|---|---|---|
| `skinsContract` | `"0.3"` | `"0.4"`; `"0.1"`, `"0.2"` and `"0.3"` stay valid |
| `design.meters` | does not exist | new, optional: ordered list of rules `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }` (§4b) |
| Pointing at meters | not possible | by `id` or `group:<group>` that the device publishes with `host.ui.meter` (device contract v1.18, §12e); `role:` does not exist here |
| Faces of a meter | only what the device draws | `bar`, `ledladder` and `vu` (round, with a needle; replaces the bar in the same place) |
| Validator | checks `design` and `controls` | also checks `meters` (shape, ranges, `face: "none"` is an error, a warning for a property that does not fit the face) and knows the device's meters in `--device` |
| Existing skins of 0.1 up to 0.3 | | keep working unchanged |

---

## 11. Names, language and license

- **Names are English and brand-free**: `name`, `description`, the `id`s, the appearance names, the file name, the folder name and the comments. No brand names or product names of existing instruments. A description such as "inspired by classic analog synths" is allowed. The validator gives an error on a brand name from the project's list and a warning on Dutch words in `name` and `description`.
- A skin is **not** per language: there is one English name and one English description. The host does not translate the names.
- **License:** everything in `skins/library/` is `CC0-1.0` (public domain); put `"license": "CC0-1.0"` on every skin. `skins/contract/` is `MIT`, like the device contract. `skins/AGENTS.md` and the READMEs follow the root license. See `../../LICENSING.md` (in Dutch).
- Put no secrets, keys or personal data in a skin.

---

## 12. The validator

```
node skins/contract/validate-skin.mjs [--lang nl|en] <file.patchkamer-skin.json>
node skins/contract/validate-skin.mjs [--lang nl|en] --dir <library folder>
node skins/contract/validate-skin.mjs [--lang nl|en] <file> --device <device.patchkamer-device.js>
```

- Node only, no packages. `--lang` chooses the language of the messages (default `nl`).
- A skin that passes gives one line `OK …`, followed by any warnings (`· let op: …`, with `--lang en`: `· warning: …`), and exit code 0.
- On errors every error is on a line of its own (`FOUT: …`, with `--lang en`: `ERROR: …`) and the exit code is 1. (Unlike the validator of the device contract, this one reports **all** errors, not only the first.)
- You can also pass an `icon.svg|png|webp|jpg`: the icon file is then checked.
- With `--dir` all `*.patchkamer-skin.json` and `icon.*` in the folder (and the folders below it) are checked, with a summary.

What the validator checks:

| Check | Result |
|---|---|
| File larger than 2 MB, not valid JSON, not an object | error |
| `format`, `formatVersion`, `skinsContract` (major 0, form `major.minor`) | error |
| `id`, `device`, `name`, `version`, `author`, `license`, `description`, `created` (form and length) | error |
| `icon`: `null` or an allowed data address, at most 200 kB, no unsafe SVG | error |
| `default` refers to an existing appearance | error |
| `appearances`: 1 to 12, unique `id`, `name` | error |
| `when`: `minWidth`/`maxWidth` 0 to 10000 and `minWidth` not greater than `maxWidth`; `screens` only `phone`, `compact`, `wide` | error |
| `css`: text, at most 200 kB, no `@import`, no `url(` to anything other than `data:` or `var(--skin-asset-…)`, no `image-set(` | error |
| `assets`: names `[a-z0-9-]`, allowed data addresses, at most 200 kB each and 1 MB together | error |
| The CSS uses `--skin-asset-<name>` without a matching `assets` item | error |
| Brand name in `name`, `description`, `id`, appearance names or file name | error |
| `device` is not equal to the folder name in `skins/library/<device-id>/` | error |
| File name not `*.patchkamer-skin.json` or with a version number in it | warning |
| Skin is not in `skins/library/<device-id>/` | warning |
| `license` is not `CC0-1.0` in `skins/library/` | warning |
| `id` does not start with the `device` | warning |
| Dutch words in `name`, `description` or appearance names | warning |
| `when` that can never hold (`screens` empty, `maxWidth` 0), `when` without conditions, or an appearance that is always unreachable behind an earlier one | warning |
| An appearance without `when` while `default` is missing (only choosable by hand) | warning |
| An `assets` item the CSS does not use; an unknown field | warning |
| Two skins with the same `id` in one library, more than one `icon.*` in a folder, an icon file without `viewBox="0 0 24 24"` (only with `--dir` or for an icon) | warning |
| Icon file: allowed extension, content matches the extension, at most 200 kB, SVG without script or external reference | error |
| `design` (skin or appearance) or a section in it is not an object; a value outside the list (`ports.mode`, `colors.scheme`, `haptics.*`, `knobs.style`, `knobs.size`); a colour that is not `#rgb` or `#rrggbb` | error |
| An unknown key in `design` or in a section of it | warning |
| `scheme: "custom"` with missing colours (after merging with the appearance); `colors.custom` while `scheme` is not `custom` | warning |
| Contrast between `text` and `bg` or `surface` below 3:1 | warning |
| `design` in a file with `skinsContract` `"0.1"` | warning |
| `design.controls`: a rule with a wrong shape (not an object, `match` missing or of an invalid form), a value outside the range (`face`, `size`, `length`, `thickness`, `thumb`, `color`, `showValue`), `face: "none"`, the list is not a list or has more than 64 rules | error |
| `design.controls`: a role in `match` that is not in the list; a rule with no property besides `match`; `length`, `thickness` or `thumb` with `face: "rotary"`; an unknown key in a rule; `controls` in a file with `skinsContract` `"0.2"` or `"0.1"` | warning |
| With `--device <device>`: an id, group or role in `match` that the device does not publish; a device without ids while rules aim at an id or group; a device that does not load; a skin for another device | warning |
| `design.meters`: a rule with a wrong shape (not an object, `match` missing, of an invalid shape or starting with `role:`), a value outside the range (`face`, `orientation`, `length`, `width`, `ballistics`, `peakHold`, `clip`, `scale`, `color`, `segments`), `face: "none"`, the list is not a list or has more than 64 rules | error |
| `design.meters`: a rule without a property besides `match`; `width` with `face: "vu"`; `orientation` other than `auto` with `face: "vu"`; `scale` with `face: "bar"`; `segments` with a face other than `ledladder`; an unknown key in a rule; `meters` in a file with `skinsContract` `"0.3"` or lower | warning |
| With `--device <device>`: a meter id or group in `design.meters` that the device does not publish; meter rules for a device without meters (no `host.ui.meter`); a control id in a meter rule and the other way round | warning |

**Checking against a device (`--device`).** With `--device <device.patchkamer-device.js>` the validator loads the device (through `contract/validate-instrument.mjs`, which knows the register of ids, roles and groups) and gives a warning for every `match` that touches nothing: an unknown id, an unknown group, a role the device does not have. For `design.meters` it only looks at the device's meters (role `meter`) and reports an unknown meter id, a group without a meter and a device without meters. It is always a warning and never an error, because a newer device version may add an id later. A table of what a device registers comes from `node contract/validate-instrument.mjs <device> --controls`.

```
node skins/contract/validate-skin.mjs skins/library/nl.patchkamer.filter/example-controls.patchkamer-skin.json --device devices/effects/Filter/filter.patchkamer-device.js
```

The validator checks `design` more strictly than the host: the host ignores what it does not understand, the validator rejects it. The test cases are in `skins/contract/test-validate-skin.mjs` (`node skins/contract/test-validate-skin.mjs`; limits, colours, contrast, unknown keys, both languages). Skins of 0.1 stay `OK`.

The validator cannot see whether the CSS looks right or whether a selector matches anything, nor whether a device draws its ports in its own UI or uses the host knob. Test that in the host if you have a browser; if you do not, write in your delivery that it is **not tested**.

---

## 13. What is not in version 0.4 yet

Version 0.1 fixes the format and the way to the user; version 0.2 (layer 1) adds the design choices that work on all devices (§4b); version 0.3 (layer 2, release A "ids and roles") adds `design.controls`: face, size and colour of the controls that a device registers; version 0.4 (layer 2, release C "meters") adds `design.meters`: face (bar, LED ladder, round VU), direction, length, width, ballistics, scale and colour of the meters that a device has the host draw. Beyond that, the content of a skin is still a **placeholder**: CSS and images without further requirements. Deliberately later, in a next version, in this order:

- **pads and small screen** (release D): `host.ui.pad` and `host.ui.display`, with `design.pads` (shape, colour, feedback) and `design.display` (style, navigation, enlarging);
- **panels and layout** (release B): `design.layout.panels` with `host.ui.group`: rearranging and grouping controls with a graphic separation. A skin can only **move** controls, never hide them;
- artwork for front panels, with the positions of the controls on it;
- a contract per device for style hooks: which classes, variables and `part` names a device fixes and keeps stable (for now that is to be established per device, §4).

Freek still has to supply the requirements for these. Until then, invent nothing: build a skin with only what is in this contract.

**Outlook (not yet available).** Layer 2 further brings building blocks, layout, sections, pads and a small screen: a skin can then also decide how a device is built, not only the colour and behaviour of the host. Layer 3 is an editor in which you compose a skin. Neither exists now (except `design.controls` and `design.meters`); `design` stays extensible for them (new sections next to `ports`, `colors`, `haptics`, `knobs` and `controls`), and the designer in the Skins panel is a first step. Do not write anything for them.

---

## 14. A minimal example

This is `skins/library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json`: two appearances that only put a thin outline around the device and change the accent color of Duofone. It is a 0.1 skin and stays valid. Examples of layer 1 with `design`: `example-back-panel.patchkamer-skin.json` (port strip and own colours, dark compact and light full) and `example-touch.patchkamer-skin.json` (`hover`, haptics and large knobs) in the same folder.

```json
{
  "format": "patchkamer-skin",
  "formatVersion": 1,
  "skinsContract": "0.1",
  "id": "nl.patchkamer.duofone.example-plain",
  "device": "nl.patchkamer.duofone",
  "name": "Example plain",
  "version": "1.0.0",
  "author": "Freek van Gool",
  "license": "CC0-1.0",
  "description": "A minimal example skin: a thin outline around the device, with one appearance for narrow cards and one for wide cards. It shows the file format only.",
  "created": "2026-11-06",
  "icon": null,
  "default": "normal",
  "appearances": [
    {
      "id": "compact",
      "name": "Compact",
      "description": "For narrow cards.",
      "when": { "maxWidth": 420 },
      "css": ":host{outline:2px solid #4fd1b8;outline-offset:-2px}",
      "assets": {}
    },
    {
      "id": "normal",
      "name": "Normal",
      "description": "For wide cards.",
      "when": { "minWidth": 421 },
      "css": ":host{outline:2px solid #4fd1b8;outline-offset:-2px;--x-acc:#4fd1b8}",
      "assets": {}
    }
  ]
}
```

---

## 15. Checklist for delivery

- The file is named `<name>.patchkamer-skin.json` (without a version number) and is in `skins/library/<device-id>/`, with that folder equal to `device`.
- `skinsContract` is `"0.4"` (or `"0.3"`/`"0.2"`/`"0.1"` if the skin has no `meters`/`controls`/`design`), `format` is `"patchkamer-skin"`, `formatVersion` is `1`.
- `id`, `name`, `description` and the appearance names are English and brand-free; `license` is `CC0-1.0`.
- Any `design` contains only keys from §4b with valid values; colours are `#rgb` or `#rrggbb`.
- Any `design.controls` has at most 64 rules, aims only at ids, roles and groups the device publishes (`node skins/contract/validate-skin.mjs <skin> --device <device>` without a warning) and hides nothing.
- Any `design.meters` has at most 64 rules, aims only at meter ids and groups the device publishes (`--device` without a warning), uses no `role:`, gives no `width` or `orientation` to a `vu` and hides nothing.
- The CSS has no `@import` and no external `url(`; images are in `assets` and used with `var(--skin-asset-<name>)`.
- It contains only selectors, classes and variables you have seen in the device file.
- `node skins/contract/validate-skin.mjs <file>` gives one `OK` line without a warning.
- Any `icon.svg` is 24×24 line art without script or external reference and at most 200 kB.
- There are no secrets or personal data in it.
- You have stated in your delivery what you could not test (for example how the skin looks in the host).
