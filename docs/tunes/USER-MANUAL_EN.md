# Tunes: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

A **tune** is a saved sound of one device that makes sound: a synth or a drum machine. You pick a tune from a list on the device's card and all its knobs, choices and patterns move to the saved values. This page explains how to use tunes, how to import, export and share a pack, which packs come with Patchkamer, and how to make your own. Devices without a sound of their own (effects, mixers, tools) have **presets** instead: see the [presets manual](../presets/USER-MANUAL_EN.md). For the basics of Patchkamer (start, loading a library, cables), see the [main manual](../USER-MANUAL_EN.md).

## Contents

1. [What a tune is](#what-a-tune-is)
2. [Choose a tune on the card](#choose-a-tune-on-the-card)
3. [Save your own tune](#save-your-own-tune)
4. [Drum machines: the Instrument row](#drum-machines-the-instrument-row)
5. [The Tunes menu: libraries and folders](#the-tunes-menu-libraries-and-folders)
6. [Import and export a pack](#import-and-export-a-pack)
7. [Share a pack: the file and the license](#share-a-pack-the-file-and-the-license)
8. [The packs that come with Patchkamer](#the-packs-that-come-with-patchkamer)
9. [Make your own pack](#make-your-own-pack)
10. [If it does not work](#if-it-does-not-work)

## What a tune is

A tune is the **sound of one device**: all its knobs, choices and patterns. It does not contain cables. Tunes are for devices that make sound (in the contract: `instrument` devices): synths, drones and drum machines. A device without a sound of its own has presets, not tunes.

Tunes are kept per device. A tune made for Duofone only shows up on a Duofone card. Every card with that device gets its own copy of the values when you load a tune, so changing one Duofone does not change another.

## Choose a tune on the card

Every card of a sound-making device has a bar under its title with ◀ ▶ buttons, a list, **Save** and a **≡** button. Here is the bar of a Duofone with the tune **House › Deep House Bass**:

![The tune bar of the Duofone card with House > Deep House Bass chosen](../images/en/tunes/duofone-tune-bar.png)

- **The list** shows the tunes of all libraries for this device, grouped by library. Each entry is written as *folder › name*. Hover over the list to see the author and license of the current tune. Until you add a library, the list reads "— no tunes —".
- **◀ ▶** step to the previous or next tune.
- **Save** stores the current setting (see below). It lights up when you have changed something since you loaded the tune.
- **≡** opens the **Tunes** panel for this device (see [The Tunes menu](#the-tunes-menu-libraries-and-folders)).
- An asterisk (*) behind the name in the list, and an *italic* name on the card, mean: you changed something since you loaded the tune. A (⧉) marks a tune that another card of the same device is using.

If you do not see the bar, switch on **Show the tune and preset bar on the cards** in **Settings**.

To try one: place Duofone, connect a Keys device to its **Keyboard / notes** input and its output to your speakers, open the list and choose a tune. Play a few notes, then step through the tunes with ▶.

## Save your own tune

1. Make the sound you want.
2. Click **Save** on the card.
3. In the window that opens, give the tune a **name**. Pick the **library** and **folder** it goes into (or choose **+ New library…** and **+ New folder…**), and fill in the **author** and the **license**: CC-BY-4.0 or all rights reserved.
4. Click **Save**.

If a tune with that name already exists in the folder, it is replaced. Other cards that use it keep their own copy. You can only save into a library that is yours: libraries that come from a source (a GitHub address or a folder on your computer) are read-only. Make a copy first with **Copy** in the Tunes panel.

Your own tunes are kept in your browser. Export a library to put it in a file (see [Import and export a pack](#import-and-export-a-pack)). **Clear browser storage…** in Settings removes them.

## Drum machines: the Instrument row

Patchkamer's host has a second feature for drum machines. A drum machine that offers separate instruments (for example a kick and a snare) gets a **second row** on its tune bar, named **Instrument**. There you choose an instrument, then **load or save one sound** (such as the kick) as a tune of its own, next to the tunes of the whole machine. In a pack file such an item has `kind: "part"` and names the instrument in `part`.

What I could check in this repository: the drum devices that come with it (Drum Kit, Drum Machine and Groovebox 12) do not offer separate instruments, so you will not see this row on them, and the three drum packs contain whole-machine tunes only (`kind: "set"`). The row is there for drum machines that do offer instruments.

## The Tunes menu: libraries and folders

The **Tunes ▾** menu at the top opens the **Tune libraries** panel. It lists the libraries per device. A library belongs to one device and can have folders, and folders can have folders. The panel is the same as the Presets panel; it only shows the sound-making devices.

![The Tunes panel with the library Duofone Styles](../images/en/tunes/tunes-panel.png)

| Control | What it does |
|---|---|
| **Device** | Filters the panel on one device. **All devices** shows everything. |
| **New library** | Makes an empty library for the chosen device. |
| **Import…** | Reads a pack from a file (see below). |
| Tick box | A ticked library is visible in the list on the cards. Untick it to hide it without deleting it. |
| Library name | Click it to open or close the library and see its folders and tunes. The line under it shows how many tunes it has, the author and the license. |
| **Export** | Writes the library to a pack file. |
| **+ folder** | Adds a folder at the top level of the library. Every folder in your own libraries has its own **+ folder**, **Name** (rename), a move list and **×**. |
| **Info** | Shows and edits the name, author, license and description of the library. |
| **Copy** | Only on read-only libraries: makes an editable copy of the library. |
| **×** | Deletes the library. The button asks you to click a second time before it deletes. |

Open a library to see its folders and tunes. Next to each tune, **Load** puts it on the selected card of that device (otherwise on the first one; if the device is not on the floor yet, it is placed). Tunes in your own libraries also have **Name** (rename), a move list and **×**. In a read-only library, a button **→ library name** copies the tune to your own library.

## Import and export a pack

A **pack** is one library in one file, `name.patchkamer-tunes.json`.

- **Import:** open **Tunes ▾**, click **Import…** and choose one or more pack files. Each pack becomes a library of your own for the device named in the file, so you can edit it. If you already have a library with the same name for that device, the new one gets a number: "Duofone Styles (2)". The tunes show on a card once that device is placed.
- **Export:** open **Tunes ▾** and click **Export** next to a library. Patchkamer saves it as *Device - Library name.patchkamer-tunes.json*.
- **Automatically:** a library that you load from GitHub or from a folder brings its pack files along: every `*.patchkamer-tunes.json` and `*.patchkamer-presets.json` in it appears in the panels on its own, as a read-only library. The address `github.com/unboxednl/patchkamer` loads the packs of this repository (see [the main manual](../USER-MANUAL_EN.md#4-load-a-library)).

## Share a pack: the file and the license

A pack is a plain JSON file. You can send it, put it on GitHub or in the library folder of a project. The short version of the format:

```json
{
  "format": "patchkamer-tunes",
  "formatVersion": 1,
  "device": "nl.patchkamer.duofone",
  "name": "Duofone Styles",
  "author": "Freek van Gool",
  "license": "CC0-1.0",
  "description": "Tunes for Duofone by music style: …",
  "tree": [
    { "folder": "Techno", "items": [
      { "name": "Rolling Bass", "kind": "set", "version": "1.0.0", "state": { "cutoff": 420, "resonance": 0.35 } }
    ] }
  ]
}
```

- `format` is `patchkamer-tunes` and `formatVersion` is `1`.
- `device` is the exact id of the device the pack is for. A tune hangs on that id; a wrong id gives a pack that belongs to no device.
- `tree` holds **folders** (`folder` with `items`) and tunes. A folder can sit in a folder. Every tune has a `name`, `kind: "set"` (the whole sound of the device) and a `state` with the device's own values. Values that the device does not know are ignored; missing values get the starting value.

The packs that come with Patchkamer are **CC0-1.0**: public domain. You may use, change and share them without naming the author. The license of a pack of your own is yours to choose when you save and export. The whole `tunes/` folder is CC0-1.0; see [LICENSING.md](../../LICENSING.md).

## The packs that come with Patchkamer

This repository has 5 packs with **221 tunes** in total, one per device. All are licensed CC0-1.0, and the names of packs, folders and tunes are English.

| Device | Pack | Tunes | Folders | File |
|---|---|---|---|---|
| [Duofone](../../devices/synths/Duofone/) | Duofone Styles | 60 | Techno (5), House (5), Trance (5), Ambient (5), Drum & Bass (5), Dubstep (5), Synthwave (5), Funk & Disco (5), Hip-hop (5), Electro (5), Pop (5), Chiptune (5) | [`duofone-styles.patchkamer-tunes.json`](../../tunes/duofone-styles.patchkamer-tunes.json) |
| [Acid Baselines](../../devices/synths/AcidBaselines/) | Acid Baselines Classics | 49 | Chicago Origins (5), Frankfurt Rolling (5), Minimal Acid (5), Squelch Anthems (5), Acid Techno (5), Acid Trance (5), Electro Acid (5), Deep Acid (5), AIcid (9) | [`acid-baselines-classics.patchkamer-tunes.json`](../../tunes/acid-baselines-classics.patchkamer-tunes.json) |
| [Drum Kit](../../devices/drums/DrumKit/) | Drum Kit Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-kit-styles.patchkamer-tunes.json`](../../tunes/drum-kit-styles.patchkamer-tunes.json) |
| [Drum Machine](../../devices/drums/DrumMachine/) | Drum Machine Styles | 36 | Techno (3), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-machine-styles.patchkamer-tunes.json`](../../tunes/drum-machine-styles.patchkamer-tunes.json) |
| [Groovebox 12](../../devices/drums/Groovebox12/) | Groovebox 12 Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`groovebox-12-styles.patchkamer-tunes.json`](../../tunes/groovebox-12-styles.patchkamer-tunes.json) |

### Duofone Styles

60 tunes in 12 styles, 5 per style: bass, lead, pad and a few colours. For example **Techno**: Rolling Bass, Acid Squelch, Dark Stab, Industrial Hit. **House**: Deep House Bass, Piano Stab, Organ Stab, Filter Pad. **Ambient**: Slow Drift, Glass Bells, Deep Space, Wind Over Water. The other folders are Trance, Drum & Bass, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop and Chiptune. See the [synths manual](../synths/USER-MANUAL_EN.md) for the controls of Duofone.

### Acid Baselines Classics

49 tunes in 9 folders. Eight folders have 5 tunes each and are named after eras and styles of acid music: Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid and Deep Acid. For example **Chicago Origins**: Warehouse Squelch, Raw Saw, Basement Tape, Square Pulse. Each tune comes with its own bassline, so the sequencer fills with a pattern when you load it. The ninth folder, **AIcid** (9 tunes), goes further: it uses the extra oscillators, filter types and distortions of Acid Baselines version 1.11.2 (Sub, Noise, Osc 2, Ring, Filter 2 and the distortion types). Its tunes are named Neural Squelch, Gradient Descent, Hallucination, Latent Space and so on.

### Drum packs

Three packs have tunes for the drum devices, all in the same 12 styles: techno, house, trance, drum & bass, dubstep, hip-hop, funk & disco, electro, pop, rock, jazz and synthwave.

- **Drum Kit Styles** (device Drum Kit): 38 kits; techno has 5 and every other style 3. Each kit combines instruments, sound models and a one-bar groove.
- **Drum Machine Styles** (device Drum Machine): 36 kits, 3 per style. Each has a groove and matching sound settings.
- **Groovebox 12 Styles** (device Groovebox 12): 38 kits; techno has 5 and every other style 3. Each kit sets the tempo, the drum sounds, a one-bar groove and a bass line, with pads and leads where the style calls for them.

A tune for a drum device is a whole machine: sounds and pattern together. See the [drums manual](../drums/USER-MANUAL_EN.md) for those devices.

### How to use them

Either load `github.com/unboxednl/patchkamer` as a library (the packs come with it, read-only), or download a file from the [tunes folder](../../tunes/) and use **Import…**.

## Make your own pack

**Without an agent.** Place the device, make a sound, click **Save** and choose **+ New library…** to start a library. Repeat for every tune, use folders to sort them, and click **Info** to fill in the author, the license and a description. Then click **Export**. The file is your pack.

**With an AI agent.** An agent can write a pack file directly. Give it:

- [`tunes/AGENTS.md`](../../tunes/AGENTS.md): the file layout, the rules for `state` and the license (always `CC0-1.0` in this repository);
- the `AGENTS.md` in the device's folder (for example `devices/synths/Duofone/AGENTS.md`): it lists the device's id, its values and their ranges.

The pack goes in `tunes/` as `name.patchkamer-tunes.json`, and the tune names are English and free of brand names. Ask the agent to use only values that the device knows and to say that it did not listen to the result. Then import the pack, step through it and listen yourself.

## If it does not work

- **The bar is not on the card.** Switch on **Show the tune and preset bar on the cards** in Settings.
- **The list says "— no tunes —".** There is no library for this device, or it is unticked in the Tunes panel. Import a pack or load a library.
- **I imported a pack but it does not show.** The pack is for another device: its `device` id has to match the card's device. The Tunes panel groups libraries per device; check there.
- **Import says "not a Patchkamer tune or preset file".** The file is not a pack, or the JSON is damaged. A pack file without a `device` is refused.
- **I cannot save into a library.** It is read-only (loaded from GitHub or a folder). Make a copy with **Copy** and save there.
- **A tune loads but there is no sound.** A tune sets the device only. It does not make cables, and it does not play notes. Check the cables and the notes or clock that drive the device (see the manual of the device).
- **The tune changed after I loaded it.** The name is in italics: you moved a knob or changed a pattern. **Save** stores your version, or choose the tune again to go back.
