# Patchkamer — Skins contract v0.8 for building agents

This document is the complete, self-contained instruction for building a **skin** for **Patchkamer**: a separate file that changes the look of one device, without touching the device itself or the device contract. An agent that receives this document needs no other context. Deliver a file `name.patchkamer-skin.json` that follows this contract and passes `validate-skin.mjs` without errors.

_This contract exists in two languages: `SKINS-CONTRACT_NL.md` (Dutch, the source text) and `SKINS-CONTRACT_EN.md` (English). Both have the same version and the same content; if they differ, the Dutch text applies. The validator speaks both languages too (`--lang nl|en`)._

_This contract is a contract of its own next to the device contract (`../../contract/PATCHKAMER-CONTRACT_EN.md`, now v1.24) and has its own version number. A skin asks nothing of a device: no change to devices is needed._

| Version | What was added |
|---|---|
| v0.1 | First version, deliberately small: a manifest, appearances with CSS and embedded images, automatic switching on card width and screen class, an icon per skin and per device. The content of a skin is a placeholder; the requirements for artwork, control graphics and layout follow later (§13) |
| v0.2 | Layer 1: the field `design` with design choices that work on all devices (ports mode, colour scheme, haptics, style and size of the host knob), at skin level and per appearance (§4b). Skins of 0.1 keep working unchanged |
| v0.3 | Layer 2, release A "ids and roles": `design.controls`, an ordered list of rules that chooses, per id, role or group, the face (rotary knob, horizontal or vertical slider), size, length, thickness, thumb, colour and value display of controls (§4b). Belongs to device contract v1.15. Skins of 0.1 and 0.2 keep working unchanged |
| v0.4 | Layer 2, release C "meters": `design.meters`, an ordered list of rules that chooses, per id, group or everywhere, the face of a meter (bar, LED ladder or a round VU with a needle that replaces a bar, never beside it), the direction, the length and the width, the ballistics (fall), the peak line, the clip lamp, the scale, the colour and the number of LEDs (§4b). Belongs to device contract v1.18 (`host.ui.meter`). Skins of 0.1 up to 0.3 keep working unchanged |
| v0.5 | Layer 2, release B1 "sections": `design.sections`, an ordered list of rules that chooses, per group or everywhere, a frame (line, raised, inset, floating), columns, spacing, "bare" (the controls lose their own frame), the place of the label (above, or below with the value on top) and the alignment, and `design.size`, the card width that belongs to an appearance (§4b). No device change needed: a group becomes a section when the device's DOM allows it. Skins of 0.1 up to 0.4 keep working unchanged |
| v0.6 | Layer 2, release D "pads and small screen": `design.pads` (shape circle, square, rounded or rectangle; size; colour per pad, per palette or from the device; idle neutral or tinted; active as fill, border, glow or nothing; a lamp in the middle, top, bottom, left or right; click and hit feedback; spacing between step buttons) and `design.display` (the small screen: LCD, OLED, seven-segment or paper instead of a dropdown, with < > and [ok], enlarged by clicking it) (§4b). Belongs to device contract v1.22 (`host.ui.pad`, `host.ui.display`, `host.ui.steps` with options). Skins of 0.1 up to and including 0.5 keep working unchanged |
| v0.7 | Layer 2, release B2 "panels and order": `design.layout`, with which a skin puts the controls of a device in **panels** and in an **order** (`flow` rows/columns/auto; per panel `id`, `title`, `items` with id, `role:<role>`, `group:<group>` or `*`, `style`, `dir`, `cols`, `gap`, `bare`, `labels`, `align`, `width`, `collapsible`, `collapsed`) (§4b). A skin only rearranges and never hides anything: whatever is not named lands in a rest panel. No device change; the device contract stays v1.22 (the ids and groups a device already publishes are now also the addresses for panels). Skins of 0.1 up to and including 0.6 keep working unchanged |
| v0.8 | Faces with type and in-use colour: `activeColor` in `design.controls` (the colour of the pointer, the filled part or the thumb while you use the control, next to `color` for rest) and `design.pads.rules`, a list of rules per pad (id, `role:<role>` or `group:<group>`) with `kind` (`toggle` stays on until you press again, `pad` sounds while you press, `velocity` like `pad` but the host measures the hit), `color` (colour at rest), `activeColor` (colour when the pad is on or pressed) and `led` (§4b). A skin that chooses `kind` changes for the first time what a button **does** and not only how it looks; this holds only for pads the host draws (`host.ui.pad`). Device contract v1.32: `onpress(e, velocity)` and `onchange(on, velocity)` get a second argument (1 to 127). Skins of 0.1 up to and including 0.7 keep working unchanged |

---

## 1. Purpose and scope

- A **skin** changes only the **look** of one device. A skin never touches the state, the sound, the ports or the behavior of the device.
- A skin is **one file** of data (JSON). It contains no script and no device code. The host puts the CSS in it into the shadow root of the device.
- A skin belongs to **one device id** (the field `device`). For another device it is kept but never offered.
- A device does not have to do anything to be able to get skins. If the device has no open shadow root (see §4), the host cannot apply the skin and says so; that is not a fault of the skin or of the device.
- Skins are a new kind of library material next to tunes and presets: they are loaded from sources (a GitHub folder, a local folder, an address), browsed in a panel of their own, chosen per device on the card, saved in the workspace and in the song, and can be dropped on the canvas (§8, §9).
- Version 0.8 stays deliberately small: CSS plus a small set of design choices (`design`, §4b), including the face of controls (`controls`), of meters (`meters`), the layout of sections (`sections`, `size`) the face of pads (`pads`) and small screens (`display`) and the arrangement into panels (`layout`). The format is extensible (unknown fields are ignored, §10); what is not in it yet is in §13.

---

## 2. The file

A skin is a UTF-8 JSON file with one object, named `name.patchkamer-skin.json`: lowercase letters with hyphens, **without a version number** in the name (the version is in `version`, earlier versions are in git). The file is at most 2 MB.

### 2a. Fields at the top level

| Field | Type | Range and rule | Default | Required |
|---|---|---|---|---|
| `format` | text | always `"patchkamer-skin"` | | yes |
| `formatVersion` | integer | now `1` | | yes |
| `skinsContract` | text | `"major.minor"`, now `"0.8"` (`"0.1"` up to and including `"0.7"` stay valid); see §10 | | yes |
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

## 4b. Design choices (`design`, from 0.2; `controls` from 0.3; `meters` from 0.4; `sections` and `size` from 0.5; `pads` and `display` from 0.6; `layout` from 0.7)

Besides CSS, from version 0.2 a skin can bring a set of **validated design choices** in the field `design`. Unlike CSS, these choices work on **all devices** through the host, without the device having to do anything (with the limits below). `design` sits at skin level (the default for all appearances) and can be overridden per appearance with `appearances[].design`.

```json
"design": {
  "ports":   { "mode": "default|always|hover|strip|bar" },
  "colors":  { "scheme": "workspace|custom",
               "custom": { "bg": "#rrggbb", "surface": "#rrggbb", "text": "#rrggbb", "muted": "#rrggbb", "accent": "#rrggbb", "line": "#rrggbb" } },
  "haptics": { "click": "off|light|medium|strong", "turn": "off|light|medium|strong", "slide": "off|light|medium|strong" },
  "knobs":   { "style": "workspace|rotary|slider", "size": "s|m|l" },
  "controls": [ { "match": "*|<id>|role:<role>|group:<group>", "face": "rotary|hslider|vslider|default", "size": "xs…xl|0.6..2", "length": "short|medium|long|40..400", "thickness": 2, "thumb": "round|square|bar|none", "color": "accent|#rrggbb", "showValue": "always|hover|never" } ],
  "meters": [ { "match": "*|<id>|group:<group>", "face": "bar|ledladder|vu|default", "orientation": "auto|vertical|horizontal", "length": "short|medium|long|24..400", "width": 8, "ballistics": "default|fast|vu|slow", "peakHold": "on|off|default", "clip": "show|hide|default", "scale": "show|hide", "color": "accent|default|#rrggbb", "segments": 20 } ],
  "sections": [ { "match": "*|group:<group>", "frame": "none|line|raised|inset|floating|default", "columns": "auto|1..12", "gap": "tight|normal|wide", "bare": false, "labels": "default|above|below", "align": "start|center" } ],
  "pads":    { "shape": "circle|square|rounded|rect", "size": "xs…xl|0.6..2", "color": "neutral|device|palette", "palette": ["#rrggbb", "…"], "colors": { "<id>|role:step|group:<group>": "#rrggbb" }, "idle": "neutral|tint", "active": "fill|border|glow|none", "led": "none|center|top|bottom|left|right", "hit": "flash|none", "press": "depress|glow|none", "gap": "tight|normal|wide" },
  "display": { "style": "dropdown|lcd|oled|segment|paper", "nav": "arrows|arrows+ok|none", "commit": "live|ok", "lines": 1, "width": "auto|80..400", "expand": "click|button|off", "targets": ["select", "preset", "tune"], "color": "accent|default|#rrggbb" },
  "layout":  { "flow": "auto|rows|columns",
               "panels": [ { "id": "osc", "title": "text|{nl,en}", "titlePos": "top|left|hidden", "items": ["<id>", "role:<rol>", "group:<groep>", "*"], "style": "raised|inset|line|floating|plain", "dir": "row|column|grid", "cols": "auto|1..16", "gap": "tight|normal|wide", "bare": false, "labels": "default|above|below", "align": "start|center", "width": "auto|full|half|third", "collapsible": false, "collapsed": false } ] },
  "size":    { "width": 380 }
}
```

### Overview and merging

- **All keys are optional.** A missing key means: the behaviour of the device itself or of the workspace (the value `default`, `workspace` or `off` below). A skin without `design` (including every 0.1 skin) behaves exactly as before.
- **Merging:** the host takes the `design` of the skin and lays the `design` of the chosen appearance over it, **per key** (and per colour in `colors.custom`). An appearance only has to repeat what differs.
- **Lenient in the host, strict in the validator:** the host ignores an invalid value or unknown key (that one key falls back to the default behaviour) and reports it; the validator gives an **error** for an invalid value and a warning for an unknown key. Unknown keys and sections belong to later versions (§13) and are ignored.
- **Standard clears everything:** if the user picks Standard (no skin) on the card, the card, the device and the cables are exactly as without a skin.
- `design` belongs to `skinsContract` `"0.2"` (`controls` to `"0.3"`, `meters` to `"0.4"`, `sections` and `size` to `"0.5"`, `pads` and `display` to `"0.6"`, `layout` to `"0.7"`, `activeColor` and `pads.rules` to `"0.8"`). In a file with `"0.1"` a 0.1 host ignores it; the validator gives a warning there, and also for `controls` in a 0.2 file, for `meters` in a 0.3 file and for `sections` or `size` in a 0.4 file or lower and for `pads` or `display` in a 0.5 file or lower and for `layout` in a 0.6 file or lower.

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
| `color` | `"accent"` or `#rgb` / `#rrggbb` | Colour of the pointer, the filled part or the thumb, at rest. |
| `activeColor` | `#rgb` / `#rrggbb` | Colour of the same parts while you use the control (mouse or touch pressed; for a rotary knob also with the keyboard). Without `activeColor` the colour stays the same (0.8). |
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

### Sections (`sections`, from 0.5) and card width (`size`)

With `design.sections` a skin gives the **groups of controls of a device a layout of their own**: a frame around, for example, the filter, the controls closer together without a frame of their own, a fixed number of columns (3 columns is 3 × 3 with nine controls) and the label below the control. As with `controls` and `meters` it is an **ordered list of rules**; the last matching rule wins per property. With `design.size` an appearance gets a **card width**, so that "Compact" makes the whole device smaller.

```json
"design": {
  "size": { "width": 380 },
  "sections": [
    { "match": "*",           "frame": "line", "columns": 3, "gap": "tight", "bare": true, "labels": "below" },
    { "match": "group:setup", "columns": 2 }
  ]
}
```

| Key | Values | Meaning |
|---|---|---|
| `match` (required) | `"*"` or `"group:<group>"` | Which sections the rule touches: all, or the section of one group from the device's register (`node contract/validate-instrument.mjs <device> --controls`). No id and no `role:`: a section is a group. The group name is 1 to 60 characters from `[A-Za-z0-9._-]`. |
| `frame` | `none`, `line`, `raised`, `inset`, `floating`, `default` | The frame around the section. `line`: a thin border in the line colour (`--line`) with rounded corners. `raised`: a slightly lighter surface colour with a shadow. `inset`: a darker well with an inner shadow. `floating`: floats, with a wide shadow and a small margin. `none`: no frame. `default`: no intervention, the device keeps its own layout. The colours come from the active colours of the skin or the workspace. |
| `columns` | `auto` or a whole number 1 to 12 | The number of columns. `auto` fills the width, with a column width that follows the control; a number gives fixed columns. The section's element then becomes a grid; buttons and other elements in the section take part as a cell. |
| `gap` | `tight`, `normal`, `wide` | The spacing between the cells (about 2 to 4 px for `tight`); the inner margin of the frame follows it. |
| `bare` | `true`, `false` | `true`: the controls in the section lose their **own** frame, background, shadow and large inner margin. Only the device's own surface style is switched off, the control itself stays. |
| `labels` | `default`, `above`, `below` | The place of the label. `below`: per control the value is on top, then the control, then the label, centred (example: "2400 Hz", knob, "Cutoff"). `above` puts the label above the control. `default`: the device. |
| `align` | `start`, `center` | The alignment of controls in their cell. Default `start`, with `labels: "below"` `center`. |
| `size.width` | number 200 to 1600 (px) | The card width that belongs to the appearance (see below). |

**What is a section.** A section is the element that contains **exactly the controls of one group**. The host looks for the lowest common ancestor element of all controls in the register with that group (through open shadow roots too) and accepts it only if all controls in it have the same group. The rule is then not applied, and the Skins panel honestly says "n of m sections applied", when:

- a group has no element of its own, or the element also contains controls of **another** group (the device mixes two groups);
- the group is unknown to the device (the host ignores the rule; the validator gives a warning with `--device`);
- the device does not register its controls (no ids and groups, device contract §12d), or a device's DOM cannot be recognised (then the label stays where it was and the section still counts in the statistics).

Whatever is not a control (buttons, headings, other text) in the section's element stays as it is; only with `columns` does it take part as a cell. For `labels` and `bare` the host recognises the label of a control for `host.ui.knob` and for adopted elements (`host.ui.adopt`).

**What a skin can and cannot do here.**

- The host only sets CSS and attributes on existing elements. **Nothing is rearranged or moved** in the DOM, and a skin **hides nothing** and sets no values.
- **Default** (no skin, or no `sections` or `size`) is everything exactly as it was. If the user chooses Default, the layout is exactly back.
- At most **32 rules** per list; the rules of the appearance come after those of the skin. The validator gives an error for more, and for a value outside the list or range. The host ignores a `match` with an unknown group; the validator gives a warning with `--device`.
- **Scrolling.** Many controls under each other make a tall card that you scroll through for a long time. Guideline: **a skin limits the height itself** by choosing columns (for example 3) and a fitting `size.width`. A skin adds no scroll container of its own; it cannot.

**Card width (`size.width`).** `size` is the card width in pixels that belongs to an appearance (200 to 1600). The host applies it **only** when the user picks the appearance or the skin **by hand**; not with Auto (which switches on width, and would otherwise keep switching) and not again at every sync. After that the user can simply make the card larger or smaller again. So an appearance "Compact" makes the whole device smaller. A `size` at skin level applies to every appearance that has none of its own.

### Pads (`pads`, from 0.6)

With `design.pads` a skin chooses the **shape, size, colour and feedback of pads**: the push buttons a device has the host draw with `host.ui.pad` (device contract §12f), the step buttons of `host.ui.steps` with options and pad buttons of the device's own that it registers with `data-pk-role="pad"` or `"step"`. Unlike `controls` and `meters`, `pads` is **one object** (not a list of rules); a colour of its own per pad goes in `colors`. It only works on pads registered that way; a pad that a device draws entirely by itself stays as it was.

```json
"design": {
  "pads": {
    "shape": "circle", "size": "m", "color": "device", "idle": "tint", "active": "fill", "led": "center", "hit": "flash", "press": "depress", "gap": "normal",
    "colors": { "pat.kick": "#ff5a4f", "role:step": "#8899aa", "group:hat": "#3ddcff" }
  }
}
```

| Key | Values | Meaning |
|---|---|---|
| `shape` | `circle`, `square`, `rounded`, `rect` | The shape: round, square, rounded square (the default face) or a landscape 3 : 2 rectangle. There is no `none`: a skin does not hide a pad. |
| `size` | `xs`, `s`, `m`, `l`, `xl`, or a number 0.6 to 2.0 | The size relative to the device's default size. For step buttons (`.st`) it multiplies their current dimensions. |
| `color` | `neutral`, `device`, `palette` | Where a pad's colour comes from: `neutral` is one colour from the theme for all pads, `device` the colour the device gave per pad (for example per sound), `palette` the colours from `palette`, cycling over the pads. A pad without a device colour falls back to the theme. |
| `palette` | list of 2 to 16 colours `#rgb` / `#rrggbb` | The palette for `color: "palette"`. The validator gives a warning if `color` is anything else. |
| `colors` | object `{ "<key>": "#rrggbb" }`, at most 64 keys | A colour of its own per pad; it wins over `color` and `palette`. The key is an id (`"pat.kick"`), `"role:<role>"` (`"role:step"`) or `"group:<group>"`. A device's ids and groups come from its register (`node contract/validate-instrument.mjs <device> --controls`). |
| `idle` | `neutral`, `tint` | The resting colour: `neutral` keeps a pad neutral at rest and lights it up in its own colour when active; `tint` already tints it lightly in its own colour at rest. |
| `active` | `fill`, `border`, `glow`, `none` | What an active pad (on, or the step is on) looks like: `fill` a fill in the bright colour, `border` a border in the bright colour on a dark fill, `glow` a glow around it, `none` no difference (only the lamp, if one is chosen). |
| `led` | `none`, `center`, `top`, `bottom`, `left`, `right` | A lamp in the pad that burns when active, in its own colour. |
| `hit` | `flash`, `none` | Feedback when the device makes a pad light up without its state changing (`flash()`, a step that fires, the play cursor). |
| `press` | `depress`, `glow`, `none` | Feedback while pressing: the pad sinks, glows or nothing. Visual only. |
| `gap` | `tight`, `normal`, `wide` | The space between the step buttons of `host.ui.steps`. |

**Per pad (`rules`, from 0.8).** Next to the settings for all pads, `rules` can hold a list of rules (at most 64): each rule has a `match` (`"*"`, an id, `"role:<role>"` or `"group:<group>"`) with one or more of these properties. The last matching rule wins per property; rules of the appearance come after those of the skin.

```json
"pads": { "rules": [
  { "match": "group:drums", "kind": "velocity", "color": "#2a3a4a", "activeColor": "#ff5a4f" },
  { "match": "pad.mute",    "kind": "toggle",   "led": "top" }
] }
```

| Key | Values | Meaning |
|---|---|---|
| `kind` | `toggle`, `pad`, `velocity` | The type: `toggle` is on/off (latches and stays on until you press again), `pad` sounds while you press, without velocity, `velocity` is a pad for which the host measures the hit and passes it on. Without `kind` the pad does what the device asks. |
| `color` | `#rgb` / `#rrggbb` | The colour at rest: the pad is lightly tinted in this colour. |
| `activeColor` | `#rgb` / `#rrggbb` | The colour when the pad is on or pressed (the fill, border, glow and lamp). Without `activeColor` it is `color`. |
| `led` | `none`, `center`, `top`, `bottom`, `left`, `right` | The lamp of this pad (wins over `led` in the rest of `pads`). |

- **`kind` changes behaviour, the only place where a skin does.** It only works on pads the host draws with `host.ui.pad`; a pad the device draws itself (also with `data-pk-role="pad"`) and step buttons get the colours but keep their behaviour. The device notices it through its own calls (device contract §12f): a `toggle` on a pad the device knows as press calls `onpress` when it goes on and `onrelease` when it goes off; `pad` or `velocity` on an on/off pad calls `onchange(true)` on pressing and `onchange(false)` on release. If the skin removes the type while a pad is latched, the host releases it.
- **Velocity** is a number from 1 to 127 as the second argument of `onpress(e, velocity)` and `onchange(on, velocity)`: the touch pressure for touch or pen if the screen measures it, otherwise the position of the click in the pad (top soft, bottom hard); the keyboard and `toggle` and `pad` give 100. A device that ignores the argument sounds the same.
- **A skin never hides or disables a pad.** `kind` only chooses how you operate the pad.

- **Merging:** `design.pads` is merged per key (the appearance over the skin), and `colors` per entry.
- **Default** (no skin, or no `pads`): the DOM, classes and look of the device itself, also for step buttons and pad buttons of its own. A new pad from `host.ui.pad` then has the neutral default face from the theme.
- **The host only sets CSS classes, `data-pk-*` and the variables `--pk-pad-color` and `--pk-pad-size`** on the element. The device's classes `on`, `cur` and `q` stay the device's. A skin sets no value and switches nothing.
- **A skin does not hide a pad.** There is no `shape: "none"`; the validator gives an error for it.
- **Contrast:** choose colours that can be seen against the colour scheme; the Skins panel checks colours of your own with the designer's colour picker.
- **Unknown ids:** a key in `colors` that the device does not have is ignored by the host; with `--device` the validator gives a warning (also for an id that is not a pad or step).

### Small screen (`display`, from 0.6)

With `design.display` a skin chooses the **face of a choice list**: instead of a dropdown a small screen like on physical devices, with the current choice and the buttons < and > (and [ok]), and a larger panel when you click it. It works on choices a device has the host draw with `host.ui.select` or `host.ui.display` (device contract §12f) and, if `targets` names it, on the preset and tune picker in the card head. The **model** stays the choice list itself: value, `onchange`, `setState`, presets and songs do not change. Like `pads`, `display` is **one object**.

```json
"design": {
  "display": { "style": "lcd", "nav": "arrows+ok", "commit": "ok", "lines": 3, "width": 220, "expand": "click", "targets": ["select", "preset"], "color": "accent" }
}
```

| Key | Values | Meaning |
|---|---|---|
| `style` | `dropdown`, `lcd`, `oled`, `segment`, `paper` | The face: `dropdown` is the device's ordinary choice list (the default), `lcd` a green-grey LCD with dark text, `oled` light text on black, `segment` seven-segment digits and large letters, `paper` dark text on a light strip. There is no `none`: a skin does not hide the choice. |
| `nav` | `arrows`, `arrows+ok`, `none` | The controls next to the screen: `arrows` are < and > (the default), `arrows+ok` adds an [ok] button, `none` leaves only the screen; a click on it opens the panel. |
| `commit` | `live`, `ok` | `live` sets the choice straight away with < and > (the default), `ok` only on [ok] in the panel. |
| `lines` | integer 1 to 3 | The number of lines on the screen: the current choice, with 2 and 3 also the previous and the next. |
| `width` | `auto` or a number 80 to 400 (px) | The width of the screen. |
| `expand` | `click`, `button`, `off` | How the larger panel opens: on a click on the screen (the default), with a button of its own, or not at all. With `nav: "none"` and `expand: "off"` nothing can be operated; the validator gives a warning and the host keeps it operable anyway. |
| `targets` | list of `select`, `preset`, `tune` (not empty, no duplicates) | Where the screen applies: `select` for the device's choice lists (the default), `preset` for the preset picker and `tune` for the tune picker in the card head. If a skin does not name `preset` or `tune`, the card head stays the ordinary choice list. |
| `color` | `"accent"`, `"default"` or `#rgb` / `#rrggbb` | The colour of the text or the LCD light; `default` is the style's own screen colour. |

- **Enlarging.** A click opens a floating panel with the list, a search field (from 12 choices, or the number the device gave in `searchAt`), large < and >, [ok] and [cancel]. Escape closes it and returns the focus; arrows and Enter work. The width is at most 32 rem (or the width minus 2 rem), the height at most 70% of the screen or 28 rem; on a phone it fills almost the whole screen, on a computer never.
- **Accessibility:** the screen is a `combobox` with visible, named < and > buttons; keyboard and screen reader work like with the ordinary choice list.
- **The card head.** For `preset` and `tune` the skin only replaces the face of the choice list and the previous and next buttons; Save, Browse and the part (`ppart`, `ptune`) keep working as they did. Without a skin or without `targets: ["preset"]` the card head is identical to now.
- **Merging:** per key, the appearance over the skin. **Default** (no skin, or no `display`, or `style: "dropdown"`) is the current look.
- **Haptics:** < and > and a choice give the skin's `click` haptic (`haptics.click`).
- **A skin does not hide the choice and sets no value.**

### Panels (`layout`, from 0.7)

With `design.layout` a skin puts the controls of a device in **panels** and decides the **order**: the oscillators in a raised panel, the performance controls and the meter in a row, the rest in a bare rest panel. This is the only part of `design` that **moves** controls (in the DOM, not only in CSS); `sections` (0.5) style a group that already has an element of its own and move nothing.

```json
"design": {
  "layout": {
    "flow": "auto",
    "panels": [
      { "id": "osc",  "title": { "nl": "Oscillator", "en": "Oscillator" }, "items": ["group:osc"], "style": "raised", "cols": 4 },
      { "id": "perf", "items": ["cut", "res", "role:meter"], "style": "line", "dir": "row" },
      { "id": "rest", "items": ["*"], "style": "plain" }
    ]
  }
}
```

| Key | Values | Meaning |
|---|---|---|
| `flow` | `rows`, `columns`, `auto` (default) | How the panels sit on the card. `rows`: one under the other. `columns`: side by side, wrapping at the card width. `auto`: side by side as long as they fit in the card width, otherwise below; the `width` of the panel steers. |
| `panels` | list of at most 16 panels | The panels in the order in which they appear on the card. An empty list or a missing key leaves the device as it is. |
| `panels[].id` (required) | 1 to 40 characters from `[a-z0-9._-]`, unique in the list | The address of the panel (also the key of the collapsed state). A duplicate id is an error. |
| `panels[].items` (required) | list of at most 64 texts | What goes in the panel, in this order: a control `id` (`"cut"`), `"role:<role>"` (a role from the list under `controls`), `"group:<group>"` or `"*"` (everything not placed yet). For a `role:` or `group:` item the order of the device applies. |
| `panels[].title` | text of 1 to 60 characters, or an object `{ "nl": …, "en": … }` | The heading of the panel. Without a title there is no heading. The host picks the language of the workspace and falls back to the other language. |
| `panels[].titlePos` | `top` (default), `left`, `hidden` | The place of the heading. |
| `panels[].style` | `raised`, `inset`, `line`, `floating`, `plain` | The frame, the same forms as `sections.frame` (`plain` is no frame). The colours come from the active colours of the skin or the workspace. |
| `panels[].dir` | `row`, `column`, `grid` (default) | The direction of the controls in the panel. |
| `panels[].cols` | `auto` or a whole number 1 to 16 | The number of columns with `dir: "grid"`. |
| `panels[].gap` | `tight`, `normal`, `wide` | The spacing. |
| `panels[].bare` | `true`, `false` | The controls lose their own frame (like `sections.bare`). |
| `panels[].labels` | `default`, `above`, `below` | The place of the label (like `sections.labels`). |
| `panels[].align` | `start`, `center` | The alignment of controls in their cell. |
| `panels[].width` | `auto`, `full`, `half`, `third` | The width of the panel within the row of the flow. |
| `panels[].collapsible` | `true`, `false` | The panel can be collapsed through its heading. Collapsed, the panel is only made smaller **on screen**: the controls still exist and stay controllable (`host.controls`, `setState`). The collapsed state is a user preference in the browser, per device and panel, and neither state nor preset. |
| `panels[].collapsed` | `true`, `false` | The initial state of a collapsible panel. |

**Rules.**

- **A skin hides nothing and sets no values.** A control goes in at most **one** panel; the **first match** wins (so an id can be in an earlier panel than its group). Whatever fits nowhere lands in a rest panel by itself. If `"*"` is missing, the host adds a rest panel at the end itself (`id: "rest"`, `style: plain`, title "Overige"/"Other"). Nothing is ever left out.
- **Lenient in the host, strict in the validator.** An unknown id, an unknown group or role, or an invalid value is silently ignored by the host (the item or the panel falls back); the validator gives an **error** for an invalid form or a value out of range and, with `--device`, a warning for an id, group or role that the device does not publish.
- **Merging.** `layout` merges per key: `appearances[].design.layout.panels` then replaces the whole list of panels of the skin, `flow` replaces `flow`. That way an appearance can have a layout of its own (compact versus wide). A skin without `layout`, or with an empty `layout`, gives exactly the behaviour of the device.
- **Moving, not replacing.** The host moves the existing control units (label, input and value together) into the panel; they stay the same elements with the same `id`s, handlers and `host.controls`. Without a skin, after choosing Default, or after switching appearance everything is back at its original place and in its original order.
- **Devices with a layout of their own.** A device that decides its own layout (Control Surface, devices with functional sections of their own) is not rearranged; the Skins panel says so. For the other behaviours (devices that rebuild their UI, cards in mini view) what the host's Skins panel reports applies: "n of m controls in panels, k in rest".
- **`layout` and `sections`.** A panel is a container of the host. `sections` (0.5) work inside a panel on a group only if that group still forms an element of its own in the panel; otherwise the host applies the panel's own `bare`, `labels` and `cols`. Prefer one or the other per group.
- **Scrolling.** A long row of panels one under the other makes a tall card. Limit the height with `flow: "columns"` or `"auto"`, `width` and `collapsible`; the host reports the number of panels.
- **Ids and groups are contract.** A skin aims at the ids, roles and groups a device publishes (device contract §12d). A device that renames or removes an id or group breaks panels aimed at it; the control then falls into the rest panel and is therefore not lost.
- Meters (`host.ui.meter`), pads and small screens count as controls and can be in panels.

### What "works on all devices" means

| Part | Reach in layer 1 |
|---|---|
| `ports.mode` | all devices with a port bar drawn by the host; not with `ui.jacks: true` (stays `default`) |
| `colors` | all devices for the card (title bar, port bar) and for the host element; the UI inside a device only follows where it uses the variables |
| `haptics` | all devices with an open shadow root or plain UI in the card; not visible inside a closed shadow root |
| `knobs` | only what is built through `host.ui.knob` |
| `controls` | only controls the device registers (`host.ui.knob`, `host.ui.adopt`, `data-pk-*`; device contract §12d); the rest is left alone |
| `meters` | only meters the device has the host draw with `host.ui.meter` (device contract §12e); the rest is left alone |
| `sections` | only groups whose controls sit in one element of their own (see "What is a section" above); the rest is not styled |
| `size` | the card width, only for an appearance or skin picked by hand |
| `layout` | only controls that the device registers (id/role/group); they are moved, not replaced; devices with a layout of their own (Control Surface) are skipped |

**Not yet available** (layer 3, §13): artwork for front panels and a full editor. `design` changes nothing about how a device is built.

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

This contract has a version `major.minor` (now **0.8**), recorded in the field `skinsContract` of every skin.

| Difference with the version of the host | What the host does |
|---|---|
| Same major, same or lower minor | loads the skin |
| Same major, higher minor | loads the skin and **ignores unknown fields** |
| Another major | rejects the skin with a message |

- A new **minor** only adds things (new fields, new values that old hosts may ignore). A change that breaks old skins raises the **major**.
- Unknown fields, also inside an appearance or in `when`, **are ignored** and not rejected. The validator reports them with a warning to catch typos.
- `formatVersion` (now `1`) is the version of the file layout itself; `skinsContract` is the version of this contract.
- Keep `id` and `device` the same in a new version of a skin and raise `version`: the newer `version` wins.
- This contract, the validator (`validate-skin.mjs`) and the host belong to the same version. The first lines of `SKINS-CONTRACT_NL.md`, `SKINS-CONTRACT_EN.md` and `validate-skin.mjs` each name "v0.8".

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

**Changes from 0.4 to 0.5:**

| Part | 0.4 | 0.5 |
|---|---|---|
| `skinsContract` | `"0.4"` | `"0.5"`; `"0.1"` up to and including `"0.4"` stay valid |
| `design.sections` | does not exist | new, optional: ordered list of rules (at most 32) `{ match, frame, columns, gap, bare, labels, align }` (§4b) |
| `design.size` | does not exist | new, optional: `{ width }` (200 to 1600 px), the card width for an appearance; only applied for a skin or appearance picked by hand |
| Pointing at sections | not possible | via `"*"` or `"group:<group>"` from the device's register; the host styles a section only if there is one element with exactly the controls of that group |
| Device change | | none; device contract stays v1.18 |
| Validator | checks `design`, `controls` and `meters` | also checks `sections` (shape, ranges, at most 32 rules, a `match` other than `group:` or `*` is an error) and `size.width` (outside 200 to 1600 is an error), gives a warning for `sections` or `size` in a file below 0.5 and, with `--device`, for an unknown group |
| Existing skins from 0.1 up to and including 0.4 | | keep working unchanged |

**Changes from 0.5 to 0.6:**

| Item | 0.5 | 0.6 |
|---|---|---|
| `skinsContract` | `"0.5"` | `"0.6"`; `"0.1"` up to and including `"0.5"` stay valid |
| `design.pads` | does not exist | new, optional: one object `{ shape, size, color, palette, colors, idle, active, led, hit, press, gap }` (§4b); `colors` gives a colour of its own per pad (at most 64 keys) |
| `design.display` | does not exist | new, optional: one object `{ style, nav, commit, lines, width, expand, targets, color }` (§4b): a small screen with < > and [ok] instead of a choice list, with an enlarged panel |
| Addressing pads and steps | not possible | pads from `host.ui.pad`, step buttons from `host.ui.steps` with options and buttons of its own with `data-pk-role="pad"` or `"step"`; per pad through `colors` (id, `role:<role>` or `group:<group>`) |
| Device change | | device contract v1.22 (`host.ui.pad`, `host.ui.display`, `host.ui.steps` with a 5th argument); a device that does nothing keeps working and gets no pad or small-screen face |
| Validator | checks `design`, `controls`, `meters` and `sections` | also checks `pads` (values, a palette of 2 to 16 colours, `colors` with at most 64 keys, `shape: "none"` is an error) and `display` (values, `style: "none"` is an error), gives a warning for `pads` or `display` in a file below 0.6 and, with `--device`, for unknown ids, groups and roles in `pads.colors` |
| Existing skins of 0.1 up to and including 0.5 | | keep working unchanged |

**Changes from 0.6 to 0.7:**

| Item | 0.6 | 0.7 |
|---|---|---|
| `skinsContract` | `"0.6"` | `"0.7"`; `"0.1"` up to and including `"0.6"` stay valid |
| `design.layout` | does not exist | new, optional: `{ flow, panels }` with at most 16 panels of at most 64 items each (§4b) |
| Rearranging controls | not possible | the skin puts controls in panels and decides the order; whatever is not named lands in a rest panel, nothing is ever hidden |
| Addressing controls | | by id, `role:<role>`, `group:<group>` or `*`, the data a device already publishes |
| Device change | | none; the device contract stays v1.22 |
| Validator | checks `design` up to and including `pads` and `display` | also checks `layout` (form, ranges, at most 16 panels and 64 items, a duplicate panel id or an invalid item is an error) and gives a warning for an item in two panels, an empty list of panels, `collapsible` without a heading, `layout` in a file below 0.7 and, with `--device`, for unknown ids, groups and roles in `items` |
| Existing skins of 0.1 up to and including 0.6 | | keep working unchanged |

**Changes from 0.7 to 0.8:**

| Item | 0.7 | 0.8 |
|---|---|---|
| `skinsContract` | `"0.7"` | `"0.8"`; `"0.1"` up to and including `"0.7"` stay valid |
| `controls[].activeColor` | does not exist | new, optional: colour while you use the control (§4b) |
| `design.pads.rules` | does not exist | new, optional: a list of at most 64 rules per pad with `kind`, `color`, `activeColor`, `led` (§4b) |
| Behaviour through a skin | never | only `kind` on pads from `host.ui.pad`: on/off, pad or pad with velocity |
| Device change | | device contract v1.32: a second argument `velocity` for `onpress` and `onchange` |
| Validator | checks `design` up to and including `layout` | also checks `activeColor` and `pads.rules` (form, `kind`, colours, `led`; an invalid value is an error) and gives a warning for a rule with only a `match`, an unknown key and both new fields in a file below 0.8 |
| Existing skins of 0.1 up to and including 0.7 | | keep working unchanged |

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
| `design.sections`: a rule with a wrong shape (not an object, `match` missing or anything other than `"*"` or `"group:<group>"`), a value outside the range (`frame`, `columns`, `gap`, `bare`, `labels`, `align`), the list is not a list or has more than 32 rules | error |
| `design.size`: not an object, or `width` not a number from 200 to 1600 | error |
| `design.sections`: a rule without a property besides `match`; an unknown key in a rule; `design.size` without `width`; `sections` or `size` in a file with `skinsContract` `"0.4"` or lower | warning |
| With `--device <device>`: a group in `design.sections` that the device does not publish (every group in the register counts, meters too) | warning |
| `design.pads`: not an object (a list too), a value outside the list or range (`shape`, `size`, `color`, `idle`, `active`, `led`, `hit`, `press`, `gap`), `shape: "none"`, a `palette` that is not a list of 2 to 16 colours, `colors` that is not an object, more than 64 keys in `colors` or a value that is not a colour | error |
| `design.pads`: an empty object; an unknown key; a key in `colors` with an invalid form or a `role:` other than `pad` or `step`; `palette` while `color` is not `palette`; `color: "palette"` without `palette`; `pads` or `display` in a file with `skinsContract` `"0.5"` or lower | warning |
| `design.display`: not an object, a value outside the list or range (`style`, `nav`, `commit`, `lines`, `width`, `expand`, `targets`, `color`), `style: "none"`, `targets` empty, with duplicates or with an unknown name | error |
| `design.display`: an empty object; an unknown key; `nav: "none"` with `expand: "off"`; `nav`, `commit`, `lines`, `width`, `expand` or `color` with `style: "dropdown"`; `targets` with `preset` or `tune` with `style: "dropdown"` | warning |
| With `--device <device>`: an id, group or role in `pads.colors` that the device does not publish as a pad or step; `pads` for a device without pads or steps; `display` with `select` in `targets` for a device without a choice list | warning |
| `design.layout`: not an object, `flow` outside the list, `panels` not a list or more than 16 panels, a panel that is not an object or lacks a valid `id` (`[a-z0-9._-]`, 1 to 40) or has a duplicate `id`, `items` missing, not a list or more than 64 items, an item that is not `"*"`, `"role:<role>"` (a role from the list), `"group:<group>"` or an id, a `title` outside 1 to 60 characters or an object without `nl`/`en`, a value outside the list (`titlePos`, `style`, `dir`, `gap`, `labels`, `align`, `width`), `cols` outside `auto` or 1 to 16, `bare`/`collapsible`/`collapsed` not a boolean | error |
| `design.layout`: an item in two panels or twice in one panel; `"*"` in more than one panel; an empty `layout` or empty list of panels; a panel without items; `titlePos` without `title`; `collapsible` without a heading (or with `titlePos: "hidden"`); `collapsed` without `collapsible`; an unknown key; `layout` in a file with `skinsContract` `"0.6"` or lower. A missing `"*"` is **not** reported: the host adds a rest panel | warning |
| With `--device <device>`: an id, group or role in `layout.panels[].items` that the device does not publish (every control and meter in the register counts) | warning |

**Checking against a device (`--device`).** With `--device <device.patchkamer-device.js>` the validator loads the device (through `contract/validate-instrument.mjs`, which knows the register of ids, roles and groups) and gives a warning for every `match` that touches nothing: an unknown id, an unknown group, a role the device does not have. For `design.meters` it only looks at the device's meters (role `meter`) and reports an unknown meter id, a group without a meter and a device without meters. It is always a warning and never an error, because a newer device version may add an id later. A table of what a device registers comes from `node contract/validate-instrument.mjs <device> --controls`.

```
node skins/contract/validate-skin.mjs skins/library/nl.patchkamer.filter/example-controls.patchkamer-skin.json --device devices/effects/Filter/filter.patchkamer-device.js
```

The validator checks `design` more strictly than the host: the host ignores what it does not understand, the validator rejects it. The test cases are in `skins/contract/test-validate-skin.mjs` (`node skins/contract/test-validate-skin.mjs`; limits, colours, contrast, unknown keys, both languages). Skins of 0.1 stay `OK`.

The validator cannot see whether the CSS looks right or whether a selector matches anything, nor whether a device draws its ports in its own UI or uses the host knob. Test that in the host if you have a browser; if you do not, write in your delivery that it is **not tested**.

---

## 13. What is not in version 0.8 yet

Version 0.1 fixes the format and the way to the user; version 0.2 (layer 1) adds the design choices that work on all devices (§4b); version 0.3 (layer 2, release A "ids and roles") adds `design.controls`: face, size and colour of the controls that a device registers; version 0.4 (layer 2, release C "meters") adds `design.meters`: face (bar, LED ladder, round VU), direction, length, width, ballistics, scale and colour of the meters that a device has the host draw; version 0.5 (layer 2, release B1 "sections") adds `design.sections` and `design.size`: frame, columns, spacing, bare, label place and alignment of the groups of controls of a device, and a card width per appearance; version 0.6 (layer 2, release D "pads and small screen") adds `design.pads` and `design.display`: shape, size, colour and feedback of pads and steps, and a small screen instead of a choice list; version 0.7 (layer 2, release B2 "panels and order") adds `design.layout`: putting the controls of a device in panels and in an order, without hiding anything. Beyond that, the content of a skin is still a **placeholder**: CSS and images without further requirements. Deliberately later, in a next version, in this order:

- artwork for front panels, with the positions of the controls on it;
- a contract per device for style hooks: which classes, variables and `part` names a device fixes and keeps stable (for now that is to be established per device, §4).

Freek still has to supply the requirements for these. Until then, invent nothing: build a skin with only what is in this contract.

**Outlook (not yet available).** Layer 2 further brings building blocks and layout: a skin can then also decide how a device is built, not only the colour and behaviour of the host. Layer 3 is an editor in which you compose a skin. Neither exists now (except `design.controls`, `design.meters`, `design.sections`, `design.size`, `design.pads`, `design.display` and `design.layout`); `design` stays extensible for them (new sections next to `ports`, `colors`, `haptics`, `knobs` and `controls`), and the designer in the Skins panel is a first step. Do not write anything for them.

---

## 14. A minimal example

This is `skins/library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json`: two appearances that only put a thin outline around the device and change the accent color of Duofone. It is a 0.1 skin and stays valid. Examples of layer 1 with `design`: `example-back-panel.patchkamer-skin.json` (port strip, a dark colour scheme and two really different appearances: a small Compact with frames around 3 columns of rotary knobs and a wide Full with raised sections and sliders; uses `design.sections` and `design.size`) and `example-touch.patchkamer-skin.json` (`hover`, haptics and large knobs) in the same folder. Examples of panels (0.7): `skins/library/nl.patchkamer.duofone/example-panels.patchkamer-skin.json` (a compact layout with collapsible panels one under the other and a wide layout with panels side by side) and `skins/library/nl.patchkamer.filter/example-panels.patchkamer-skin.json`.

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
- `skinsContract` is `"0.8"` (or `"0.7"`/`"0.6"`/`"0.5"`/`"0.4"`/`"0.3"`/`"0.2"`/`"0.1"` if the skin has no `layout`/`pads`/`display`/`sections`/`size`/`meters`/`controls`/`design`), `format` is `"patchkamer-skin"`, `formatVersion` is `1`.
- `id`, `name`, `description` and the appearance names are English and brand-free; `license` is `CC0-1.0`.
- Any `design` contains only keys from §4b with valid values; colours are `#rgb` or `#rrggbb`.
- Any `design.controls` has at most 64 rules, aims only at ids, roles and groups the device publishes (`node skins/contract/validate-skin.mjs <skin> --device <device>` without a warning) and hides nothing.
- Any `design.meters` has at most 64 rules, aims only at meter ids and groups the device publishes (`--device` without a warning), uses no `role:`, gives no `width` or `orientation` to a `vu` and hides nothing.
- Any `design.sections` has at most 32 rules, a `match` of `"*"` or `"group:<group>"` with a group the device publishes (`--device` without a warning) and limits the height of the card by choosing columns; any `design.size.width` is between 200 and 1600.
- Any `design.pads` is one object (not a list), chooses a `shape` from the list (never `none`), has a `palette` of 2 to 16 colours only with `color: "palette"`, at most 64 keys in `colors` that only target pads, steps and groups that the device publishes (`--device` without a warning); any `design.display` chooses a `style` from the list (never `none`), leaves the small screen operable (not `nav: "none"` with `expand: "off"`) and names `preset` or `tune` in `targets` only with a screen style.
- The CSS has no `@import` and no external `url(`; images are in `assets` and used with `var(--skin-asset-<name>)`.
- It contains only selectors, classes and variables you have seen in the device file.
- `node skins/contract/validate-skin.mjs <file>` gives one `OK` line without a warning.
- Any `icon.svg` is 24×24 line art without script or external reference and at most 200 kB.
- There are no secrets or personal data in it.
- You have stated in your delivery what you could not test (for example how the skin looks in the host).
