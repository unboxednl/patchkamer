# Patchkamer — Skins contract v0.1 for building agents

This document is the complete, self-contained instruction for building a **skin** for **Patchkamer**: a separate file that changes the look of one device, without touching the device itself or the device contract. An agent that receives this document needs no other context. Deliver a file `name.patchkamer-skin.json` that follows this contract and passes `validate-skin.mjs` without errors.

_This contract exists in two languages: `SKINS-CONTRACT_NL.md` (Dutch, the source text) and `SKINS-CONTRACT_EN.md` (English). Both have the same version and the same content; if they differ, the Dutch text applies. The validator speaks both languages too (`--lang nl|en`)._

_This contract is a contract of its own next to the device contract (`../../contract/PATCHKAMER-CONTRACT_EN.md`, now v1.14) and has its own version number. A skin asks nothing of a device: no change to devices is needed._

| Version | What was added |
|---|---|
| v0.1 | First version, deliberately small: a manifest, appearances with CSS and embedded images, automatic switching on card width and screen class, an icon per skin and per device. The content of a skin is a placeholder; the requirements for artwork, control graphics and layout follow later (§13) |

---

## 1. Purpose and scope

- A **skin** changes only the **look** of one device. A skin never touches the state, the sound, the ports or the behavior of the device.
- A skin is **one file** of data (JSON). It contains no script and no device code. The host puts the CSS in it into the shadow root of the device.
- A skin belongs to **one device id** (the field `device`). For another device it is kept but never offered.
- A device does not have to do anything to be able to get skins. If the device has no open shadow root (see §4), the host cannot apply the skin and says so; that is not a fault of the skin or of the device.
- Skins are a new kind of library material next to tunes and presets: they are loaded from sources (a GitHub folder, a local folder, an address), browsed in a panel of their own, chosen per device on the card, saved in the workspace and in the song, and can be dropped on the canvas (§8, §9).
- Version 0.1 is deliberately small. The format is extensible (unknown fields are ignored, §10); what is not in it yet is in §13.

---

## 2. The file

A skin is a UTF-8 JSON file with one object, named `name.patchkamer-skin.json`: lowercase letters with hyphens, **without a version number** in the name (the version is in `version`, earlier versions are in git). The file is at most 2 MB.

### 2a. Fields at the top level

| Field | Type | Range and rule | Default | Required |
|---|---|---|---|---|
| `format` | text | always `"patchkamer-skin"` | | yes |
| `formatVersion` | integer | now `1` | | yes |
| `skinsContract` | text | `"major.minor"`, now `"0.1"`; see §10 | | yes |
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

This contract has a version `major.minor` (now **0.1**), recorded in the field `skinsContract` of every skin.

| Difference with the version of the host | What the host does |
|---|---|
| Same major, same or lower minor | loads the skin |
| Same major, higher minor | loads the skin and **ignores unknown fields** |
| Another major | rejects the skin with a message |

- A new **minor** only adds things (new fields, new values that old hosts may ignore). A change that breaks old skins raises the **major**.
- Unknown fields, also inside an appearance or in `when`, **are ignored** and not rejected. The validator reports them with a warning to catch typos.
- `formatVersion` (now `1`) is the version of the file layout itself; `skinsContract` is the version of this contract.
- Keep `id` and `device` the same in a new version of a skin and raise `version`: the newer `version` wins.
- This contract, the validator (`validate-skin.mjs`) and the host belong to the same version. The first lines of `SKINS-CONTRACT_NL.md`, `SKINS-CONTRACT_EN.md` and `validate-skin.mjs` each name "v0.1".

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

The validator cannot see whether the CSS looks right or whether a selector matches anything. Test that in the host if you have a browser; if you do not, write in your delivery that it is **not tested**.

---

## 13. What is not in version 0.1 yet

Version 0.1 fixes the format and the way to the user. The content of a skin is a **placeholder**: CSS and images without further requirements. Deliberately later, in a next version:

- artwork for front panels, with the positions of the controls on it;
- a graphic for controls (knobs, sliders), possibly with sprites;
- other layouts of a device (a different placement of parts);
- a contract per device for style hooks: which classes, variables and `part` names a device fixes and keeps stable (for now that is to be established per device, §4).

Freek still has to supply the requirements for these. Until then, invent nothing: build a skin with only what is in this contract.

---

## 14. A minimal example

This is `skins/library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json`: two appearances that only put a thin outline around the device and change the accent color of Duofone.

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
- `skinsContract` is `"0.1"`, `format` is `"patchkamer-skin"`, `formatVersion` is `1`.
- `id`, `name`, `description` and the appearance names are English and brand-free; `license` is `CC0-1.0`.
- The CSS has no `@import` and no external `url(`; images are in `assets` and used with `var(--skin-asset-<name>)`.
- It contains only selectors, classes and variables you have seen in the device file.
- `node skins/contract/validate-skin.mjs <file>` gives one `OK` line without a warning.
- Any `icon.svg` is 24×24 line art without script or external reference and at most 200 kB.
- There are no secrets or personal data in it.
- You have stated in your delivery what you could not test (for example how the skin looks in the host).
