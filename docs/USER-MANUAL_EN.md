# Patchkamer user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

Patchkamer is a modular music studio that runs in your browser. You place devices (synths, sequencers, effects, outputs) on a floor, connect them with cables, press Start and make music. This manual is for people who want to use it. If you want to build devices, see [Make your own devices](#12-make-your-own-devices).

![Patchkamer with a keyboard, a bass synth and speakers connected](images/en/03-patch.png)

## Contents

1. [What you need](#1-what-you-need)
2. [Open Patchkamer](#2-open-patchkamer)
3. [A tour of the studio](#3-a-tour-of-the-studio)
4. [Load a library](#4-load-a-library)
5. [Your first patch](#5-your-first-patch)
6. [The devices](#6-the-devices)
7. [Tunes and presets](#7-tunes-and-presets)
8. [Save, open and share](#8-save-open-and-share)
9. [Find your way around the floor](#9-find-your-way-around-the-floor)
10. [Settings](#10-settings)
11. [Keyboard shortcuts](#11-keyboard-shortcuts)
12. [Make your own devices](#12-make-your-own-devices)
13. [Troubleshooting](#13-troubleshooting)
14. [Licenses](#14-licenses)

## 1. What you need

- A computer with a modern browser. **Chrome or Edge** gives the best experience: they can remember a folder on your computer and have Web MIDI for a MIDI keyboard. Other modern browsers work for the basics.
- Headphones or speakers.
- Optional: a MIDI keyboard.

There is nothing to install, no account and no upload. Everything runs on your own computer. Patchkamer only goes online when you tell it to load devices from GitHub or from a web address.

## 2. Open Patchkamer

Patchkamer is one HTML file.

1. Download this repository: on GitHub choose **Code → Download ZIP** and unpack it, or run `git clone https://github.com/unboxednl/patchkamer`.
2. Open `patchkamer/patchkamer.html` in your browser.

For the smoothest start, serve the folder from your own computer instead of double-clicking the file. In a terminal, in the folder you unpacked:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080/patchkamer/patchkamer.html`. Over `localhost` Chrome and Edge give you the proper folder picker (section 4).

Patchkamer follows the language of your browser: Dutch or English. You can change that in Settings (section 10).

## 3. A tour of the studio

![The empty studio](images/en/01-start.png)

| Part | What it does |
|---|---|
| **Start** | Starts and stops the clock. Devices with a sequencer play along. |
| **BPM**, **Swing** | Tempo (40–200) and swing of the clock. |
| **Workspace** | Save, open and export your setup (section 8). |
| **Tunes**, **Presets** | The libraries of sounds and settings (section 7). |
| **Settings** | Language, audio quality, display and more (section 10). |
| **Arrange** | Puts your devices neatly in order, from left to right. |
| **Focus** | Shows the devices you flagged with **F** next to each other (section 9). |
| **Clear** | Empties the floor (click twice to confirm). |
| **Library** | Shows or hides the library window. |
| **Latency** | The delay between a sound being calculated and you hearing it, as reported by your browser. |
| **Color** | Dark, light or retro (section 10). |
| The name at the top | The name of your workspace. Click it to rename. |
| **F1**, **F2**… tabs | The bar under the top bar holds your workspaces. Click a tab or press **F1** to **F10** to switch; **+** adds one and **×** closes one (section 8). |

The big area is the **floor**. Your devices live there. The window on the left is the **library**, the list of devices you can place. Bottom right you find the zoom controls.

## 4. Load a library

Patchkamer comes without devices of its own. A **library** is a collection of devices. This repository contains one in the `devices` folder. In the library window, under **Sources**, you add one or more sources. There are three kinds:

| Source | How |
|---|---|
| **GitHub** | Type `github.com/unboxednl/patchkamer` in the address field and click **Add**. The devices and the tune packs load straight from GitHub. This is the easiest way to start. |
| **Folder** | Click **Choose local folder…** and pick the folder with devices (for example the `devices` folder of this repository). |
| **Web address** | Paste the address of a single `.patchkamer-device.js` file, or of a `patchkamer.json` list, and click **Add**. |

![The library with devices, ready to place](images/en/02-library.png)

A device is a file that ends in `.patchkamer-device.js`. Sources are remembered, so next time they load by themselves.

**It can also happen by itself.** Under **Settings → New workspace** Patchkamer can load the device library, the presets and the tunes from GitHub whenever you start with an empty workspace. You can change the three addresses there (section 10). Each one becomes a source of its own in the list, with a **Scan** button.

**Choosing a folder.** On `localhost` or over https, Chrome and Edge remember the folder and Patchkamer sees new devices when you come back to the window. In other cases the browser takes a one-time snapshot of the folder and its prompt says something like "Upload 7 files". Nothing is uploaded, and the number counts every file in the folder, not only devices. Patchkamer reads only the files that end in `.patchkamer-device.js` and then shows the real number of devices. With a snapshot, **Scan** asks you to pick the folder again to see new files.

**Categories.** Devices are grouped by category. Click a category name to fold it. The **Layout** button opens a panel where you can add, rename and delete your own categories and save or load the layout.

![Library layout](images/en/10-library-layout.png)

## 5. Your first patch

You will make a keyboard play a bass synth through your speakers.

1. In the library, click **Place** on **Keys / MIDI**, on **Acid Baselines** and on **Speakers**. Each device lands in the middle of your view. Anything in the way moves aside. You can also drag a device from the library onto the floor.
2. Click **Arrange** to put them in a tidy row.
3. Connect them with cables. Press on a port (the little circle on a card) and drag to a matching port on another card, then release:
   - from **Notes / CC** on Keys to **Notes** on Acid Baselines;
   - from **Out** on Acid Baselines to **In** on Speakers.
4. Click **Arrange** again, so the cables flow from left to right.
5. Press **Start**. The sequencer in Acid Baselines starts playing. Click the piano keys on Keys, or press the keys **A W S E D F T G Y H U J K O L P** on your computer keyboard.

![Keys, Acid Baselines and Speakers connected with cables](images/en/03-patch.png)

**Cables.** The color of a cable tells what it carries: **audio** (teal), **events** such as notes (orange), **modulation** (purple), **mastering** (a yellow, dotted wave, between the triangle ports of the Master Director and the mastering devices), **multi-MIDI** (a double dashed orange cable with all tracks of a sequencer, for the MIDI Hub) and **bundles** (thick, green: many channels in one cable). A cable only connects ports of the same kind. Press **Esc** while dragging to cancel. Click a cable to remove it.

**Move a cable.** Drag a cable by one end to another matching port. The end nearest to where you grab comes loose and the other end stays where it is. Let go on a matching port to hang the cable there. Let go anywhere else, or press **Esc**, and the cable goes back where it was. The old cable stays connected until you let go, so the sound keeps playing.

**Put a device on a cable.** Drag a device from the library, or a device that has no cables yet, onto a cable. The cable lights up, and when you let go it splits: the device sits between the two ends. This works for devices that have both an input and an output of that kind of cable (audio or notes), such as the effects. If a cable does not light up, the device does not fit in it.

**Volume.** Use the slider on Speakers. It has a limiter, but keep the volume modest at first.

## 6. The devices

Devices come in kinds. Every kind has its own README and its own user manual, with a section per device: what it is for, the controls, the ports, an example patch, and the presets or tunes that come with it. A patch usually runs from left to right: **tools** and **drums** send notes, **synths** make the sound, **effects** shape it, the **mixer** combines it and **Speakers** plays it. The **Arrange** button puts your devices in that order.

| Kind | What it is for | Devices | Manual |
|---|---|---|---|
| **Synths** | Make sound from notes | Acid Baselines, Acid Stepper, Basic Mono, Biotope, Bowed Ensemble, Celestial Mechanics, Chord Poly, Cinematic Synth, Cross Mod Mono, Dissonant Cluster, Drone Synth, Duofone, Formant Singer, Foundry, Four-Operator FM, Grain Cloud, Karplus String, Ladder Mono, Layered Landscape, Low Bass, Mist, Paradox, Patch Mono, Patchbay Synth, Poly Chorus, Stage Keys, Sub Line, Supersaw Swarm, Triple Osc Poly | [Synths manual](synths/USER-MANUAL_EN.md) · [README](../devices/synths/README.md) |
| **Samplers** | Play your own sounds: pads and slices from loaded audio | Samplebank, Loop Slicer | [Samplers manual](samplers/USER-MANUAL_EN.md) · [README](../devices/samplers/README.md) |
| **Sequencers** | Play notes and chords on other devices | Chord Sequencer, Clip Arranger, Euclidean Rhythms, Pattern Playlist, Pattern Tracker, Scale Arpeggiator, Step Sequencer, Wanderer | [Sequencers manual](sequencers/USER-MANUAL_EN.md) · [README](../devices/sequencers/README.md) |
| **Drums** | Drum sounds and rhythm | Drum Machine, Drum Kit, Groovebox 12, Pulse Drums, Latin Percussion, Click Synth | [Drums manual](drums/USER-MANUAL_EN.md) · [README](../devices/drums/README.md) |
| **Effects** | Shape the sound: modulation, distortion, space, filters, rhythm, voice, chains | Chorus, Effect Chain, Filter, Flanger, Frequency Shifter, Grit, Phaser, Pump, Resonator, Room, Tremolo, Vocoder | [Effects manual](effects/USER-MANUAL_EN.md) · [README](../devices/effects/README.md) |
| **Mastering** | Finish a mix: tone, dynamics, saturation, width, loudness and checking | Balance EQ, Multiband Balance, Bus Compressor, Patina, Stereo Space, Master Chain, Mix Check, Master Director, Listening Output | [Mastering manual](mastering/USER-MANUAL_EN.md) · [README](../devices/mastering/README.md) |
| **Mixer** | Bring in, mix, keep the level steady, play out | Mixer, Leveler, Speakers, Audio Input, Audio Output | [Mixer manual](mixer/USER-MANUAL_EN.md) · [README](../devices/mixer/README.md) |
| **Modulators** | Move the controls of other devices | Drift, Follower, LFO, Macro, Multi-Segment Envelope, Swell | [Modulators manual](modulators/USER-MANUAL_EN.md) · [README](../devices/modulators/README.md) |
| **Tools** | Play, record, measure and take notes | Control Surface, Keys / MIDI, Metronome, MIDI Hub, Multitrack, Notes, Pad Controller, Recorder, Scope | [Tools manual](tools/USER-MANUAL_EN.md) · [README](../devices/tools/README.md) |

**AI Chat (built in).** Besides the kinds above, the library has one device that comes with Patchkamer itself: **AI Chat**, under *Metering & utilities*. Place it, and ask in your own words for a device, a tune pack, a preset pack or a song. It needs a provider, an API key and a model under **Settings → AI assistant**; the provider bills the usage to you. The AI reads the documentation of this repository on GitHub by itself (the AGENTS.md files, the contract, the style guides) and hands you everything as a **proposal**: **Add** puts a device in the library and on the floor, or a tune or preset pack in your libraries, and **Open** opens a song in a new workspace tab. Nothing is added without your click. Read the code of a device before you add it: a device is not isolated from the page, and the check on the card only warns about network, storage and eval. The conversation stays when you switch workspace; **New chat** starts again. Not tested with real providers or keys: the flow with all three provider formats was tested with simulated answers. The AI cannot listen: tell it what you hear.

Their ready-made sounds and settings have their own manuals: [Tunes](tunes/USER-MANUAL_EN.md) for devices that make sound and [Presets](presets/USER-MANUAL_EN.md) for the rest (also section 7).

## 7. Tunes and presets

A **tune** is a complete setting of one device that makes sound: all knobs, patterns and choices. A **preset** is the same for a device without a sound of its own, such as an effect or a mixer. Neither contains cables.

On every card you see a bar with ◀ ▶ buttons and a list. Pick a tune or preset from the list, or step through them with the arrows. **Save** stores the current setting in a library, with your name as author and a license (CC-BY-4.0 or all rights reserved). A tune whose name is in *italics* has been changed since you loaded it.

![Tune libraries](images/en/09-tunes-panel.png)

The **Load all** button at the top of the Tunes and Presets panel loads every tune pack, or every preset pack, from the address you set under **Settings → New workspace** (by default the `tunes` and `presets` folders of this repository on GitHub). Everything below that folder is read.

The **Tunes** and **Presets** menus manage your libraries: create a new one, put tunes in folders, import a pack (`.patchkamer-tunes.json` or `.patchkamer-presets.json`) and export one to share. Packs in a library you load from GitHub or a folder appear automatically. The packs that come with this repository are listed in the [tunes manual](tunes/USER-MANUAL_EN.md) and the [presets manual](presets/USER-MANUAL_EN.md).

For the whole story, with the list of included packs and how to make your own, see the [presets manual](presets/USER-MANUAL_EN.md) and the [tunes manual](tunes/USER-MANUAL_EN.md).

## 8. Save, open and share

![The Workspace menu](images/en/06-workspace.png)

Your **workspace** is the whole setup: devices and their settings and patterns, cables, tempo and name.

- **Save as file** downloads your workspace as a file. **Open file…** loads one again.
- Tick **Include the code of all external instruments** if you want a file that opens even without access to the sources the devices came from.
- **In this browser** keeps a copy in your browser, so you can pick it up later on the same computer.
- **Export as song…** makes a shareable file (`.patchkamer-song.json`) that holds all device code, a title, the author and a license. Someone else can open it without any library.
- **New empty workspace** starts again.

**More than one workspace.** The tab bar under the top bar holds up to ten workspaces. Click a tab, or press **F1** to **F10**, to switch. **+** adds a new empty workspace; **×** closes one (Patchkamer asks first if it holds devices, and the last one cannot be closed: use **Clear**). Every workspace has its own devices, cables, tempo and name, and everything in this section works on the workspace you are in. When you switch, the clock stops and you start it again yourself. A new workspace loads what you chose under **Settings → New workspace**. Patchkamer keeps your workspaces in your browser and opens them again the next time.

![The tab bar with three workspaces](images/en/11-workspaces.png)

## 9. Find your way around the floor

- **Move around:** drag the floor to pan. **Ctrl + scroll** zooms between 10% and 250%. The buttons bottom right zoom out, zoom in, fit everything (**All**) and go back to the start (⌂).
- **Cards:** drag a card by its title bar. Drag an edge or corner to resize it, and double-click an edge for the default size. **–** turns a card into a small icon and **⤢** restores it. **×** removes it. The version list lets you switch to another version of a device.
- **Arrange** orders your devices from left to right: sources, instruments, effects, mixer, output. **Ctrl+Z** undoes it.
- **Focus view:** press **F** on a card's title bar to flag it, then click **Focus**. The flagged devices show next to each other, stacked or in a grid, without moving them on the floor. **Back to canvas** returns.

![Focus view](images/en/08-focus.png)

## 10. Settings

![The Settings panel](images/en/07-settings.png)

- **Language:** automatic (your browser), Nederlands or English. Patchkamer reloads and keeps your workspace.
- **Audio:** pick **Low**, **Normal** or **High** quality, or set **sample rate**, **latency** and **oversampling** yourself. Higher quality asks more of your computer. A change reloads Patchkamer and keeps your workspace. If you hear crackles, choose a larger latency buffer (*Balanced* or *Stable*).
- **New workspace:** tick what Patchkamer loads when you start with an empty workspace: **Load the device library**, **Load presets**, **Load tunes**. Under each tick is the address, by default the `devices`, `presets` and `tunes` folders of `github.com/unboxednl/patchkamer`. Everything below the folder is read. **Restore default addresses** puts the three back. The **Load all** button in the Tunes and Presets panel uses the same addresses. Only GitHub addresses work here; a web address or local folder is added as a source in the library instead.
- **AI assistant:** choose a provider (**Anthropic**, **OpenAI** or a **custom address** for any OpenAI-compatible service, such as your own proxy, OpenRouter or a local model), paste your **API key** and choose a **model** (**Fetch models** fills the list). The key is stored only in this browser (localStorage) and goes only to the provider you chose. Under it you can change which GitHub repository the AI reads its documentation from, or tick **Use my own agent instructions** and write your own: the AI then uses those instead of the GitHub documentation. **Clear keys** removes all keys. See *AI Chat* in section 6.
- **Display:** the style of the cables, their opacity, the scale of the whole interface, slider or rotary knobs for the host controls, and the text size of menus and library.
- **Color** (top right): dark, light or retro.

![The light and retro color schemes](images/en/03-patch-light.png)

![Retro](images/en/03-patch-retro.png)

- **Browser storage:** Patchkamer remembers your settings, library layout, sources, workspace and your own tunes and presets in your browser. **Clear browser storage…** wipes all of that and starts fresh. Files on your computer and on GitHub stay as they are.

## 11. Keyboard shortcuts

| Keys | What it does |
|---|---|
| **Space** | Start or stop |
| **F1** to **F10** | Switch to workspace 1 to 10 (tab bar) |
| **Alt+F** | Open or close the focus view |
| **Alt+B** | Show or hide the library |
| **+** / **−** / **0** | Zoom in / zoom out / reset zoom |
| **Ctrl + scroll** | Zoom the floor |
| **Delete** | Remove the selected device |
| **Ctrl+Z** | Undo Arrange |
| **Esc** | Cancel a cable you are dragging, or close a panel |
| Double-click a slider | Back to its starting value |
| Click the number next to a slider | Type a value, then press Enter |
| **A W S E D F T G Y H U J K O L P** | Play notes on Keys (when the keyboard has focus) |

The letter keys A–P belong to Keys, which is why the host shortcuts use Alt.

## 12. Make your own devices

A device is one `.patchkamer-device.js` file that follows the **contract**: a complete, self-contained description of what a device must do. The contract exists in English ([PATCHKAMER-CONTRACT_EN.md](../contract/PATCHKAMER-CONTRACT_EN.md)) and Dutch ([PATCHKAMER-CONTRACT_NL.md](../contract/PATCHKAMER-CONTRACT_NL.md)). A validator checks your device:

```
node contract/validate-instrument.mjs devices/synths/Duofone/duofone.patchkamer-device.js
```

Patchkamer is made to be built by AI agents as well as by people. Point your agent at [AGENTS.md](../AGENTS.md): it explains what to read, where to put things and what to check. Under **Settings → Contract & setup** you also find a template you can copy.

## 13. Troubleshooting

**I hear nothing.**
- Press **Start**, or click anywhere in Patchkamer. Browsers pause audio until you interact with the page, and after sleep or when you change the audio output. Patchkamer shows "The sound is off" when that happens and resumes by itself on your next click or key press.
- Check the cables: audio must run from the sound-making device to **Speakers**. Notes must run from Keys (or a sequencer) to the instrument.
- Check the volume on Speakers and on your computer.

**The library is empty or my new device is missing.**
- Add a source (section 4).
- With a folder that Patchkamer cannot remember, click **Scan** and choose the folder again. Only files that end in `.patchkamer-device.js` count.

**My MIDI keyboard is not found.** Use Chrome or Edge, click **Connect MIDI** on Keys and allow access. Pick the keyboard under **MIDI input**.

**Crackles or dropouts.** Open Settings → Audio and choose *Balanced* or *Stable* latency, or lower the quality to *Low*.

**The folder prompt says "Upload 7 files".** See section 4: nothing is uploaded and the number counts all files in the folder.

**Everything looks wrong or stuck.** Settings → **Clear browser storage…** starts Patchkamer fresh.

## 14. Licenses

Each folder has its own license: the host and the devices are AGPL-3.0-or-later, the contract is MIT, tunes and presets are CC0-1.0 and the songs are CC-BY-4.0. See [LICENSING.md](../LICENSING.md).
