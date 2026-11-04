# Presets: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

A **preset** is a saved setting of one device that makes no sound of its own: an effect, a mixer, a modulator or a tool. You pick a preset from a list on the device's card and every knob and choice moves to the saved value. This page explains how to use presets, how to import, export and share a pack, which packs come with Patchkamer, and how to make your own. Devices that make sound (synths, drum machines) have **tunes** instead: see the [tunes manual](../tunes/USER-MANUAL_EN.md). For the basics of Patchkamer (start, loading a library, cables), see the [main manual](../USER-MANUAL_EN.md).

## Contents

1. [What a preset is](#what-a-preset-is)
2. [Choose a preset on the card](#choose-a-preset-on-the-card)
3. [Save your own preset](#save-your-own-preset)
4. [The Presets menu: libraries and folders](#the-presets-menu-libraries-and-folders)
5. [Import and export a pack](#import-and-export-a-pack)
6. [Share a pack: the file and the license](#share-a-pack-the-file-and-the-license)
7. [The packs that come with Patchkamer](#the-packs-that-come-with-patchkamer)
8. [Effect Chain: complete chains](#effect-chain-complete-chains)
9. [Make your own pack](#make-your-own-pack)
10. [If it does not work](#if-it-does-not-work)

## What a preset is

A preset is the **setting of one device**: all its knobs, choices and, where the device has them, its patterns. It does not contain cables, and the sources a mixer channel listens to are not part of it either. Presets are for devices without a sound of their own: effects, mixers, mastering, sequencers, modulators and controllers. Devices that make sound have tunes.

Presets are kept per device. A preset made for Chorus only shows up on a Chorus card. Every card with that device gets its own copy of the values when you load a preset, so changing one Chorus does not change another.

## Choose a preset on the card

Every card that can have presets has a bar under its title with ◀ ▶ buttons, a list, **Save** and a **≡** button. Here is a Chorus with the preset **Subtle › Subtle Double**:

![The Chorus card with the preset Subtle > Subtle Double chosen in the preset bar](../images/en/effects/chorus.png)

- **The list** shows the presets of all libraries for this device. The list is grouped by library, and each entry is written as *folder › name*. Hover over the list to see the author and license of the current preset.
- **◀ ▶** step to the previous or next preset in the list. They are greyed out when the device has no presets yet; the list then reads "— no presets —".
- **Save** stores the current setting (see below). It lights up when you have changed something since you loaded the preset.
- **≡** opens the **Presets** panel for this device (see [The Presets menu](#the-presets-menu-libraries-and-folders)).
- An asterisk (*) behind the name in the list, and an *italic* name on the card, mean: you changed something since you loaded the preset. The list also marks (⧉) a preset that another card of the same device is using.

If you do not see the bar, switch on **Show the tune and preset bar on the cards** in **Settings**.

To try a preset: place a Chorus, connect it between a source and your speakers, open the list and choose **Subtle › Subtle Double**. Then use ▶ to step through the presets while the sound plays.

## Save your own preset

1. Set the device the way you want it.
2. Click **Save** on the card.
3. In the window that opens, give the preset a **name**. Pick the **library** and **folder** it goes into (or choose **+ New library…** and **+ New folder…**), and fill in the **author** and the **license**: CC-BY-4.0 or all rights reserved.
4. Click **Save**.

If a preset with that name already exists in the folder, it is replaced. Other cards that use it keep their own copy. You can only save into a library that is yours: libraries that come from a source (a GitHub address or a folder on your computer) are read-only. Make a copy first with **Copy** in the Presets panel.

Your own presets are kept in your browser. Export a library to put it in a file (see [Import and export a pack](#import-and-export-a-pack)). **Clear browser storage…** in Settings removes them.

## The Presets menu: libraries and folders

The **Presets ▾** menu at the top opens the **Preset libraries** panel. It lists the libraries per device. A library belongs to one device and can have folders, and folders can have folders.

![The Presets panel with the library Chorus Basics](../images/en/presets/presets-panel.png)

| Control | What it does |
|---|---|
| **Device** | Filters the panel on one device. **All devices** shows everything. |
| **New library** | Makes an empty library for the chosen device. |
| **Import…** | Reads a pack from a file (see below). |
| Tick box | A ticked library is visible in the list on the cards. Untick it to hide it without deleting it. |
| Library name | Click it to open or close the library and see its folders and presets. |
| **Export** | Writes the library to a pack file. |
| **+ folder** | Adds a folder at the top level of the library. Every folder in your own libraries has its own **+ folder**, **Name** (rename), a move list and **×**. |
| **Info** | Shows and edits the name, author, license and description of the library. |
| **Copy** | Only on read-only libraries: makes an editable copy of the library. |
| **×** | Deletes the library. The button asks you to click a second time before it deletes. |

Open a library to see its folders and presets. Next to each preset, **Load** puts it on the selected card of that device (otherwise on the first one; if the device is not on the floor yet, it is placed). Presets in your own libraries also have **Name** (rename), a move list and **×**. In a read-only library, a button **→ library name** copies the preset to your own library.

## Import and export a pack

A **pack** is one library in one file, `name.patchkamer-presets.json`.

- **Import:** open **Presets ▾**, click **Import…** and choose one or more pack files. Each pack becomes a library of your own for the device named in the file, so you can edit it. If you already have a library with the same name for that device, the new one gets a number: "Chorus Basics (2)". The device does not have to be on the floor, but the presets only show on a card once that device is placed.
- **Export:** open **Presets ▾** and click **Export** next to a library. Patchkamer saves it as *Device - Library name.patchkamer-presets.json*.
- **Automatically:** a library that you load from GitHub or from a folder brings its pack files along: every `*.patchkamer-presets.json` and `*.patchkamer-tunes.json` in it appears in the panels on its own, as a read-only library. The address `github.com/unboxednl/patchkamer` loads the packs of this repository (see [the main manual](../USER-MANUAL_EN.md#4-load-a-library)).

## Share a pack: the file and the license

A pack is a plain JSON file. You can send it, put it on GitHub or in the library folder of a project. The short version of the format:

```json
{
  "format": "patchkamer-presets",
  "formatVersion": 2,
  "device": "nl.patchkamer.chorus",
  "name": "Chorus Basics",
  "author": "Freek van Gool",
  "license": "CC0-1.0",
  "description": "Starting points for Chorus: …",
  "tree": [
    { "folder": "Subtle", "items": [
      { "name": "Subtle Double", "kind": "set", "version": "1.0.0", "state": { "mode": "chorus", "rate": 0.4 } }
    ] }
  ]
}
```

- `format` is `patchkamer-presets` and `formatVersion` is `2`.
- `device` is the exact id of the device the pack is for. A wrong id gives a pack that belongs to no device.
- `tree` holds **folders** (`folder` with `items`) and presets. A folder can sit in a folder. Every preset has a `name`, `kind: "set"` (the whole setting of the device) and a `state` with the device's own values. Values that the device does not know are ignored; missing values get the starting value.
- Older files with a flat `presets` list can still be imported.

The packs that come with Patchkamer are **CC0-1.0**: public domain. You may use, change and share them without naming the author. The license of a pack of your own is yours to choose when you save and export. The whole `presets/` folder is CC0-1.0; see [LICENSING.md](../../LICENSING.md).

## The packs that come with Patchkamer

This repository has 14 packs with **178 presets** in total, one per device. Each is named after its device ("Chorus Basics" and so on) and is licensed CC0-1.0.

| Device | Pack | Presets | Folders | File |
|---|---|---|---|---|
| [Chorus](../../devices/effects/Chorus/) | Chorus Basics | 12 | Subtle (3), Ensemble (3), Movement (3), Extreme (3) | [`chorus.patchkamer-presets.json`](../../presets/chorus.patchkamer-presets.json) |
| [Effect Chain](../../devices/effects/EffectChain/) | Effect Chain Basics | 14 | Atmosphere (4), Studio (4), Club (4), Sound Design (2) | [`effect-chain.patchkamer-presets.json`](../../presets/effect-chain.patchkamer-presets.json) |
| [Filter](../../devices/effects/Filter/) | Filter Basics | 14 | Basics (5), Movement (5), Aggressive (4) | [`filter.patchkamer-presets.json`](../../presets/filter.patchkamer-presets.json) |
| [Flanger](../../devices/effects/Flanger/) | Flanger Basics | 12 | Classic (4), Subtle (2), Tempo (2), Extreme (4) | [`flanger.patchkamer-presets.json`](../../presets/flanger.patchkamer-presets.json) |
| [Follower](../../devices/modulators/Follower/) | Follower Basics | 14 | Level (6), Onsets (4), Extreme (4) | [`follower.patchkamer-presets.json`](../../presets/follower.patchkamer-presets.json) |
| [Frequency Shifter](../../devices/effects/FrequencyShifter/) | Frequency Shifter Basics | 13 | Subtle (4), Inharmonic (5), Feedback (4) | [`frequency-shifter.patchkamer-presets.json`](../../presets/frequency-shifter.patchkamer-presets.json) |
| [Grit](../../devices/effects/Grit/) | Grit Basics | 12 | Warm (3), Motion (4), Extreme (5) | [`grit.patchkamer-presets.json`](../../presets/grit.patchkamer-presets.json) |
| [Leveler](../../devices/mixer/Leveler/) | Leveler Basics | 11 | Sources (6), Mix (4), Utility (1) | [`leveler.patchkamer-presets.json`](../../presets/leveler.patchkamer-presets.json) |
| [Phaser](../../devices/effects/Phaser/) | Phaser Basics | 11 | Classic (4), Tempo (3), Extreme (4) | [`phaser.patchkamer-presets.json`](../../presets/phaser.patchkamer-presets.json) |
| [Pump](../../devices/effects/Pump/) | Pump Basics | 13 | Clock (6), Sidechain (3), Split and Mix (4) | [`pump.patchkamer-presets.json`](../../presets/pump.patchkamer-presets.json) |
| [Resonator](../../devices/effects/Resonator/) | Resonator Basics | 13 | Subtle (4), Chords (6), Extreme (3) | [`resonator.patchkamer-presets.json`](../../presets/resonator.patchkamer-presets.json) |
| [Room](../../devices/effects/Room/) | Room Basics | 12 | Spaces (4), Delays (4), Space FX (4) | [`room.patchkamer-presets.json`](../../presets/room.patchkamer-presets.json) |
| [Tremolo](../../devices/effects/Tremolo/) | Tremolo Basics | 13 | Classic (4), Slow (3), Rhythmic (3), Extreme (3) | [`tremolo.patchkamer-presets.json`](../../presets/tremolo.patchkamer-presets.json) |
| [Vocoder](../../devices/effects/Vocoder/) | Vocoder Basics | 14 | Voices (4), Textures (4), Extreme (4), External (2) | [`vocoder.patchkamer-presets.json`](../../presets/vocoder.patchkamer-presets.json) |

Mixer, Speakers, Multitrack, Notes, Recorder, Scope and other devices can also have presets, but no pack comes with them yet: save your own with **Save**.

To use them: either load `github.com/unboxednl/patchkamer` as a library (the packs come with it, read-only), or download a file from the [presets folder](../../presets/) and use **Import…**.

## Effect Chain: complete chains

Most packs are a set of starting points for one effect. The **Effect Chain Basics** pack is different. Effect Chain holds up to eight effects one after the other, and **every preset in this pack is a complete chain** of 4 to 8 effects, built for one use: ambient soundscape, cinematic, techno, dub, lo-fi and so on. Each slot has its own effect, its own effect mix and its own settings, and several chains end with a limiter or compressor to keep the level in check.

![The Effect Chain card with the chain Atmosphere › Drifting Soundscape](../images/en/effects/effect-chain.png)

When you load a preset, the chain list on the card (**Chain**) shows **Custom chain**: the settings are yours to change. The card has its own built-in chains in that list; they are part of the device and not a preset pack.

The 14 chains in four folders. **Slots** is the number of slots in use; **In / out** is the input and output level that the preset sets, in dB. The signal goes through the slots from left to right, slot 1 first:

| Folder | Chain | Built for | Slots | In / out (dB) | Slot effects, from slot 1 to slot 8 |
|---|---|---|---|---|---|
| Atmosphere | **Drifting Soundscape** | ambient soundscape | 6 | 0 / +9 | Granular Delay → Shimmer Reverb → Cosmos · ambient → Chorus → Auto-pan → Stereo Image |
| Atmosphere | **Cinematic Dread** | cinematic dread | 8 | -2 / 0 | Warm saturation → Harmonic Resonators → Ring Modulator → Frequency Echo → Phaser → Reverb → Stereo Image → Limiter · peak |
| Atmosphere | **Psychedelic Trip** | psychedelic sound design | 6 | 0 / +6 | Phaser → Flanger → Tremolo → Frequency Echo → Cosmos · ambient → Auto-pan |
| Atmosphere | **Dream Voice** | a dreamy voice | 7 | 0 / +1 | Compressor → EQ · three bands → Chorus → Ping-pong echo → Reverb → Shimmer Reverb → Stereo Image |
| Studio | **Tape Slapback** | a tape slapback echo | 4 | 0 / 0 | Warm saturation → Ping-pong echo → Filter → Reverb |
| Studio | **Lo-Fi Tape Memory** | lo-fi tape | 5 | 0 / 0 | Digital Crush → Vinyl Dust → Filter → Chorus → Reverb |
| Studio | **Drum Bus Glue** | a drum bus | 5 | 0 / 0 | Compressor → Warm saturation → Multiband Drive → Hybrid Reverb → Limiter · peak |
| Studio | **Dub Chamber** | dub | 6 | -1 / 0 | Warm saturation → Tempo Delay → Ping-pong echo → Auto Filter → Reverb → Compressor |
| Club | **Basement Techno** | basement techno | 7 | 0 / +6 | Filter → Warm saturation → Pumping / Duck → Tempo Delay → Reverb → Multiband Drive → EQ · three bands |
| Club | **Squelch Bus** | a squelchy bass bus | 6 | -3 / -3 | Distortion → Filter → Wobble Filter → Phaser → Tempo Delay → EQ · three bands |
| Club | **Neon Nights** | synthwave | 5 | 0 / +3 | Chorus → Overdrive → Tempo Delay → Shimmer Reverb → Reverb |
| Club | **Trance Ascent** | trance | 7 | 0 / +6 | Trance Gate → Auto Filter → Pumping / Duck → Tempo Delay → Shimmer Reverb → Reverb → Stereo Image |
| Sound Design | **Glitch Lab** | glitch | 4 | 0 / +4 | Beat Stutter → Digital Crush → Frequency Echo → Ping-pong echo |
| Sound Design | **Industrial Warehouse** | industrial | 8 | -6 / +4 | EQ · three bands → Overdrive → Distortion → Multiband Drive → Ring Modulator → Reverb → Frequency Echo → Limiter · peak |

How to use them:

- Put Effect Chain after a source or on a mixer output. It is stereo: **Stereo in** and **Stereo out**.
- Open the list on the card and choose a chain. Move through them with ◀ ▶.
- Set **Total mix** or the **Effect mix** of a slot to taste; every knob stays yours. Use the arrows on a slot to move it, and **Effect on** / **Bypass on** to skip it. Changing the chain this way marks the preset as changed.
- The tempo-based effects (pumping, trance gate, beat stutter, tempo delay, wobble filter) follow the clock of Patchkamer: press Start. In this pack that applies to Dub Chamber, Basement Techno, Squelch Bus, Neon Nights, Trance Ascent and Glitch Lab.
- Some of the effects in the chain run on the main thread of the browser and add a little latency. On a slow computer, use chains with fewer of them, or hide slots.
- The chain levels were set on paper and have not been listened to. Check the loudness with your own source and use **Input**, **Output** and **Total mix**.

## Make your own pack

**Without an agent.** Place the device, set a sound, click **Save** and choose **+ New library…** to start a library. Repeat for every preset, use folders to sort them, and click **Info** to fill in the author, the license and a description. Then click **Export**. The file is your pack.

**With an AI agent.** An agent can write a pack file directly. Give it:

- the `AGENTS.md` in the device's folder (for example `devices/effects/Chorus/AGENTS.md`): it lists the device's id, its values and their ranges;
- [`tunes/AGENTS.md`](../../tunes/AGENTS.md): the file layout and the rules for the license. It is written for tunes; for presets the layout is the same, except that `formatVersion` is `2` and the file is named `name.patchkamer-presets.json` in `presets/`.

Ask the agent to use only values that the device knows, to keep names in English and free of brand names, and to say that it did not listen to the result. Then import the pack, step through it and listen yourself.

## If it does not work

- **The bar is not on the card.** Switch on **Show the tune and preset bar on the cards** in Settings.
- **The list says "— no presets —".** There is no library for this device, or it is unticked in the Presets panel. Import a pack or load a library.
- **I imported a pack but it does not show.** The pack is for another device: its `device` id has to match the card's device. The Presets panel groups libraries per device; check there.
- **Import says "not a Patchkamer tune or preset file".** The file is not a pack, or the JSON is damaged. A pack file without a `device` is refused.
- **I cannot save into a library.** It is read-only (loaded from GitHub or a folder). Make a copy with **Copy** and save there.
- **The preset changed after I loaded it.** The name is in italics: you moved a knob. **Save** stores your version, or choose the preset again to go back.
