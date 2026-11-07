# Mixer: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

This page covers the devices that bring your sounds together and send them out: **Mixer**, **Leveler**, **Speakers**, **Audio Input**, **Audio Capture** and **Audio Output**. For the basics (opening Patchkamer, loading a library, drawing cables) see the [main user manual](../USER-MANUAL_EN.md). The folder with the devices is described in [devices/mixer](../../devices/mixer/README.md).

## Contents

1. [What these devices do](#what-these-devices-do)
2. [Which device for which goal](#which-device-for-which-goal)
3. [Mixer](#mixer)
4. [Leveler](#leveler)
5. [Speakers](#speakers)
6. [Audio Input](#audio-input)
7. [Audio Capture](#audio-capture)
8. [Audio Output](#audio-output)
9. [If it does not work](#if-it-does-not-work)

## What these devices do

Most patches end the same way: several sound makers (synths, a drum machine, effects) go into a **Mixer**, the Mixer goes through a **Leveler** if you want a steady volume, and the last cable goes into **Speakers**. Speakers is the output device that plays sound on your computer: without an output you hear nothing.

```
synths, drums …  →  Mixer  →  Leveler (optional)  →  Speakers
```

All cables here are teal audio cables. The Mixer also has a green **bundle** cable (many channels in one cable), which is described below.

**Presets.** These devices do not make sound themselves, so they have **presets** and not tunes. See [Presets](../presets/USER-MANUAL_EN.md) for how to use and share them.

## Which device for which goal

| I want to… | Use |
|---|---|
| Set the balance between several sounds, pan them, mute or solo one | [Mixer](#mixer) |
| Send some of a sound to an effect, such as Room, and bring it back | [Mixer](#mixer) (**Send** and **Return**) |
| Put sounds in groups, for example all drums, and control them with one fader | [Mixer](#mixer) (groups) |
| Bring many sources to the same volume at once | [Mixer](#mixer) (**Level match**) |
| Keep a source that slowly gets louder and softer at a steady volume | [Leveler](#leveler) |
| Hear the result and set the final volume | [Speakers](#speakers) |
| Bring in a microphone, an instrument or an audio interface | [Audio Input](#audio-input) |
| Bring in the sound of another tab, a window or (on Windows) the system, to sample or record it | [Audio Capture](#audio-capture) |
| Send sound to a chosen output, such as an audio interface or headphones | [Audio Output](#audio-output) |

## Mixer

### What it is for

A mixing desk with 1 to 32 channels and 0 to 8 groups, and a master. Each channel has trim, an EQ, send and return, pan, a fader, and mute and solo buttons. Groups and the master have an EQ, send, return and a fader too. Behind the master sits a limiter.

![The Mixer card](../images/en/mixer/mixer.png)

### The controls

Double-click a slider to go back to its starting value. Click the number to type a value.

**Top bar**

| Control | What it does |
|---|---|
| **Channels** | How many channels there are, 1 to 32 (start: 8). The ports on the card appear and disappear with it. |
| **Groups** | How many groups there are, 0 to 8 (start: 2). |
| **EQ** | **3 bands** or **5 bands** for all channels, groups and the master. |
| **Level match** | Measures for 4 seconds and sets the **Trim** of every channel so that all sources arrive at the **Target** level. It needs sound coming in, so press **Start** first. If there is no signal the Mixer says so. |
| **Continuous** | Keeps the trims at the target level, slowly (at most 3 dB per second). |
| **Target** | The level that **Level match** aims for, −30 to −6 dB (start: −18). |
| **bundle in**, **channels out** | The two bundle ports (see below). |
| **+ groups and mix** | Adds the groups and the total mix to the **channels out** bundle. |

**A channel** (from top to bottom)

| Control | What it does |
|---|---|
| Number (**1**, **2**, …) | The audio input of the channel. |
| Name field | Type a name for the channel. The name goes with the bundle. Up to 24 characters. |
| Source list | Shows **— cable** (use the cable on the input), or lets you choose a channel of a bundle that arrives on **bundle in**. |
| **SEND**, **RET** (round ports) | The channel's send output and return input. |
| **TRIM** | Input gain, −24 to +24 dB (0). |
| **LOW**, **MID**, **HIGH** | EQ gain, −15 to +15 dB (0). With 3 bands: a low shelf at 120 Hz, a peak at 1 kHz and a high shelf at 6 kHz. With 5 bands the controls are **LOW**, **LO-MID**, **MID**, **HI-MID** and **HIGH**, at 80 Hz, 300 Hz, 1 kHz, 3.5 kHz and 10 kHz (shelves for the lowest and the highest). |
| **SEND** | How much of the channel goes to the send output, 0 to 100% (0%). |
| **RETURN** | How much of the sound on the return input is added, 0 to 100% (80%). |
| **→ M** | Where the channel goes: to the master (**→ M**) or to a group. |
| **PAN** | Left (−1) to right (+1), centre is **C**. |
| Fader and meter | The channel volume, −60 to +6 dB (−6). The bar next to it is a level meter. |
| **M**, **S** | Mute and solo. If any channel has solo on, the channels without solo are silent. |

**Groups** have a name, send and return ports, an EQ, **SEND**, **RETURN**, a fader (0 dB at the start) and **M**. **Master** has the output port **OUT**, send and return ports, an EQ, **SEND**, **RETURN** and a fader. There is a limiter behind the master.

### How the signal flows

Each channel goes input → **TRIM** → EQ → fader → **PAN** → mute → group or master. The **SEND** output takes its sound after the fader, pan and mute. The **RETURN** input is added behind the fader and mute of the same channel, so muting a channel does not mute what comes back on its return.

### Ports

| Port | Kind | Use |
|---|---|---|
| **1**, **2**, … | audio in | The sound of a device. |
| **RET** under a channel (**Return 1**, …) | audio in | Sound coming back from an effect. |
| **SEND** under a channel (**Send 1**, …) | audio out | Sound that goes to an effect. |
| **Group 1 send**, **Group 1 return**, **Master send**, **Master return** | audio out and in | The same, for a group and for the master. |
| **Out** | audio out | The mix. Connect to **Speakers**. |
| **bundle in** | bundle in (green) | A bundle with many channels, for example the separate outputs of a drum machine. Choose per channel which bundle channel arrives there, in the source list under the name. |
| **channels out** | bundle out (green) | All channels after mixing, as one bundle, for example into a recorder. |

### An example

1. Place **Duofone**, **Acid Baselines**, **Mixer**, **Room** and **Speakers**.
2. Connect **Stereo** of Duofone to input **1** and **Out** of Acid Baselines to input **2** of the Mixer.
3. Connect **Out** of the Mixer to **In** on Speakers.
4. Press **Start**. Pull **PAN** of channel 1 a little to the left and of channel 2 a little to the right.
5. For reverb: connect the **SEND** port of channel 1 to **In** on Room, and **Out** of Room to the **RET** port of channel 1. Raise **SEND** on channel 1 to about 30%.
6. Press **S** on channel 2 to hear only the bass, and press it again to hear both.

### Presets

The Mixer has presets: a preset keeps the settings of the desk, but not the source choices of the channels. No preset pack comes with the Mixer. Use **Save** on the card to keep your own settings, and see [Presets](../presets/USER-MANUAL_EN.md) for importing and sharing.

### Tips and limits

- Cables to a channel that you remove (a lower **Channels** number) are removed with it.
- An older Mixer setting (version 1, without groups) is converted when you load it.
- A burst of not-a-number or enormous values from another device is caught: every 100 ms the Mixer replaces an EQ or limiter that has run away and the sound comes back.

## Leveler

### What it is for

Leveler keeps the average volume of a source steady. It measures the level over a set time and slowly turns the volume up or down towards a target level, within a range you choose. Behind it sits a limiter that catches short peaks. Use it for sources that slowly get louder and softer, for example when a modulator moves them, or on the whole mix before **Speakers**.

![The Leveler card](../images/en/mixer/leveler.png)

### The controls

| Control | What it does | Range (start) |
|---|---|---|
| **Mode** | **Leveling** or **Pass through** (the sound goes through unchanged) | Leveling |
| **Target** | The level it aims for | −36 to −6 dB (−18) |
| **Response** | How fast the volume moves up. Down it moves three times faster. | 0.2 to 20 s (3) |
| **Window** | The time over which it measures | 0.1 to 3 s (0.8) |
| **Range ±** | The most it may turn the volume up or down | 0 to 24 dB (12) |
| **Gate** | Below this level the volume stays where it is, so reverb tails and pauses are not blown up | −80 to −30 dB (−55) |
| **Ceiling** | The limit of the limiter behind it | −12 to 0 dB (−1) |

Two buttons: **Current level = target** sets the target to the level that comes in now, and **Reset gain** sets the correction back to 0.

The meter shows **IN**, **OUT** and **GAIN** (the correction in dB), with a lamp for the limiter (**limiter idle** when it is not working).

### Ports

| Port | Kind | Use |
|---|---|---|
| **In** | audio in | The sound to keep steady. |
| **Out** | audio out | The steady sound. |

### An example

1. Place **Acid Baselines**, **Leveler** and **Speakers**.
2. Connect **Out** of Acid Baselines to **In** on Leveler, and **Out** of Leveler to **In** on Speakers.
3. Press **Start**. Choose the preset **Sources › Bass Control**.
4. Look at the **GAIN** meter: it shows how many dB the Leveler adds or takes away. Change **Cutoff** or **Level** on the synth and watch the meter follow slowly.

### Presets

Leveler has the pack **Leveler Basics**: 11 presets in three folders, **Sources** (Gentle Leveling, Drift Tamer, Pad Smoother, Bass Control, Lead Steady, Quiet Rescue), **Mix** (Mix Bus Safety, Slow Ride, Fast Catch, Loud and Tight) and **Utility** (Meter Only). The file is [`presets/leveler.patchkamer-presets.json`](../../presets/leveler.patchkamer-presets.json). Load it from a library (see the main manual) or with the **Presets** tab of the library → **Import…**, then pick a preset in the list on the card.

### Tips and limits

- The limiter looks ahead 5 ms, so the sound is delayed by 5 ms.
- Without AudioWorklet support in your browser Leveler passes the sound through unchanged and tells you so on the card.
- Very high or not-a-number values from another device are limited at the input, so one bad value does not stay in the device.

## Speakers

### What it is for

Speakers is the output of the studio: the sound goes to the speakers or headphones of your computer, through a limiter, with a meter. It has one control, the volume.

![The Speakers card](../images/en/mixer/speakers.png)

### The controls

| Control | What it does | Range (start) |
|---|---|---|
| **Volume** | The volume | 0 to 100% (80%) |

Under the slider is a small bar that shows the level that goes out. Behind the volume sits a limiter (threshold −3 dB, ratio 12:1), so a very high volume does not clip.

### Ports

| Port | Kind | Use |
|---|---|---|
| **In** | audio in | Connect the Mixer, a Leveler, a Recorder or a synth. |

### An example

Connect **Out** of the Mixer to **In** on Speakers. Start with **Volume** at 80% and set your computer volume low, then raise it.

### Presets

Speakers has the preset bar like every device, but no preset pack comes with it: there is only one setting, and it is a personal choice.

### Tips and limits

- Speakers has an input and no output. The volume moves smoothly when you change it or load a preset.
- A volume above 100% is not possible.

## Audio Input

### What it is for

Audio Input brings sound from the outside into the studio: the default input of your sound card, or an audio interface that your computer knows (USB interfaces, the line or microphone input of a sound card). Patchkamer asks the browser for a list of inputs and shows them with the names your system gives them. Use it to play a guitar, a keyboard or a microphone through effects, or to record it with the **Recorder**.

![The Audio Input card](../images/en/mixer/audio-input.png)

### The controls

| Control | What it does | Range (start) |
|---|---|---|
| **Start input** / **Stop input** | Opens or closes the input. The browser asks for permission the first time. Nothing starts by itself, also not when you load a song or a preset. | off |
| **Input** (list) | The input to use. **System default input** follows the choice of your computer. After the first start the list shows the real names. | system default |
| **Refresh list** | Reads the list of inputs again. The list also updates when you plug in or unplug an interface. | |
| **Channels of the input** | **2 (stereo)** opens two channels. **As many as the input gives** asks for all channels of an interface, so you can pick a pair or a single input. | 2 (stereo) |
| **Mode** | **Stereo (a pair)**, **Mono (one channel to left and right)** or **Mono (pair summed)**. | Stereo |
| **Pair** / **Channel** | Which pair (1+2, 3+4 …) or which single channel is used. | 1+2 |
| **Gain** | Raises or lowers the input. | −24 to +36 dB (0 dB) |
| **High-pass** | Cuts low rumble: off, 40, 80 or 120 Hz. | off |
| **Invert polarity** | Turns the signal upside down. Use it when two microphones on one source cancel each other. | off |
| **Mute** | A button that silences the output; it lights up while it is on. It is off at first, so the input sounds right away. | off |
| **Browser processing** | Echo cancelling, noise suppression and automatic level of the browser. Off keeps the signal untouched; switch it on for a voice call. | off |
| **L** / **R** meters | The level after the gain. **clip** lights up for a moment when the signal reaches full scale. | |

### Ports

| Port | Kind | Use |
|---|---|---|
| **Out** | audio out | Stereo sound. Connect to a Mixer channel, an effect, the **Recorder** or **Speakers**. |

### An example

1. Place **Audio Input**, **Room** and **Speakers**. Connect **Out** of Audio Input to the effect and the effect to **Speakers**.
2. Use headphones, or turn your computer volume low.
3. Click **Start input** and allow the input in the browser. Choose your interface in the list.
4. Play something and watch the meters. Raise **Gain** until the meter reaches about three quarters and the **clip** light stays off.
5. Press **Mute** to silence it, and again to hear it.

### Presets

The **Audio Input Basics** pack has 31 presets in five folders: **Line Level**, **Voice**, **Instruments**, **Interface Channels** and **Utility**. A preset sets the mode, the channel, the gain, the high-pass, the polarity and the browser processing. It does not set the input itself, and it does not unmute. See [Presets](../presets/USER-MANUAL_EN.md).

### Tips and limits

- A browser has no ASIO. An interface works through the driver of your operating system, and how many channels the browser sees depends on that driver and on the system: some systems show only two channels in the browser. The card shows how many channels came in.
- The sound of an input goes through the browser, so there is a delay. The size depends on the interface, its driver and your **Latency** setting under Settings → Audio.
- A microphone in a room with speakers gives feedback. Use headphones, or press **Mute** until you have set the volume.
- The sample rate of the input can differ from the sample rate of Patchkamer. The browser converts it.
- If another program has the input, the browser may not be able to open it. Close that program and click **Start input** again.

## Audio Capture

### What it is for

Audio Capture brings the sound of another browser tab, a window or (on Windows) the whole system into the studio, so you can sample it, record it or run it through effects. It has one audio output, **Out**, that fits every audio input in Patchkamer: connect it to the **Recorder**, a sampler, an effect, a Mixer channel or **Speakers**. After you click **Start capture** the browser shows its own dialog where you choose the source and tick sharing sound.

![The Audio Capture card](../images/en/mixer/audio-capture.png)

### The controls

| Control | What it does | Range (start) |
|---|---|---|
| **Start capture** / **Stop capture** | Opens the share dialog of the browser, or ends the capture. Nothing starts by itself, also not when you load a song or a preset. | off |
| **Mode** | **Stereo** keeps left and right. **Mono (channels summed)** puts both channels together on left and right. | Stereo |
| **Gain** | Raises or lowers the captured sound. | −24 to +36 dB (0 dB) |
| **High-pass** | Cuts low rumble: off, 40, 80 or 120 Hz. | off |
| **Invert polarity** | Turns the signal upside down. | off |
| **Mute** | A button that silences the output; it lights up while it is on. It is off at first, so the capture sounds right away. | off |
| **L** / **R** meters | The level after the gain. **clip** lights up for a moment when the signal reaches full scale. | |

### Ports

| Port | Kind | Use |
|---|---|---|
| **Out** | audio out | Stereo sound of the chosen source. Connect to the **Recorder**, a sampler, an effect, a Mixer channel or **Speakers**. |

### An example

1. Open the music or video you want to capture in another tab and start it.
2. Place **Audio Capture** and **Recorder** in Patchkamer and connect **Out** to the **In** of the Recorder. Use headphones.
3. Click **Start capture**, choose the **tab**, tick **Share tab audio** and confirm. The status line names the source and the meters move.
4. Record a part with the Recorder and save it as WAV. Load that file in a sampler such as Samplebank, where you can cut and edit it.
5. Click **Stop capture** (or end the sharing in the browser) when you are done.

### Presets

The **Audio Capture Basics** pack has 12 presets in three folders: **Stereo**, **Mono** and **Cleanup**. A preset sets the mode, the gain, the high-pass and the polarity. It does not choose the source and does not unmute. See [Presets](../presets/USER-MANUAL_EN.md).

### Tips and limits

- The browser always shares a picture together with the sound. Patchkamer does not use or show that picture. Ending the sharing, for example with the button of the browser, also ends the capture.
- **Tab sound** works in browsers based on Chromium (such as Chrome and Edge) on every system. Choose the tab and tick sharing sound. Firefox and Safari do not share sound.
- **System sound** (the whole screen) only works on Windows, also in the desktop app. On Linux and macOS choose a tab, or use **Audio Input** with a loopback input of your sound system.
- A capture of Patchkamer itself, or of the whole system sound while this device is connected to **Speakers**, plays itself back and gives feedback. Choose another tab, use headphones, or keep the output away from Speakers.
- The browser cannot capture the sound of one single program. Use a tab for that.
- Sound that you capture can be protected. Use it only for what you are allowed to do with it.
- The sound goes through the browser, so there is a delay. It does not matter for sampling.

## Audio Output

### What it is for

Audio Output sends the sound to an output of your computer that you choose: the default output, a headphone output or an audio interface that your computer knows. Next to **Speakers** (which always plays to the default output) you can use several Audio Outputs at the same time, for example the mix to the monitors and a listening mix to the headphones. Patchkamer asks the browser for a list of outputs and shows them with the names your system gives them.

![The Audio Output card](../images/en/mixer/audio-output.png)

### The controls

| Control | What it does | Range (start) |
|---|---|---|
| **Output** (list) | The output to play to. **System default output** is the output your computer uses. | system default |
| **Choose output…** | Lets the browser show its own output picker and gives Patchkamer the name. It only appears in browsers that have this function. | |
| **Refresh list** | Reads the list of outputs again. The list also updates when you plug in or unplug an interface. | |
| **Pair** | Which pair of channels (1+2, 3+4 …) the sound goes to. It only appears when the default output has more than two channels, and it only works on the default output. | 1+2 |
| **Volume** | The volume. | −60 to +6 dB (−6 dB) |
| **Mono** | Plays left and right as one mono signal. Use it to check a mix or for a single speaker. | off |
| **Limiter** | A limiter (threshold −1 dB, ratio 20:1) behind the volume. Behind it sits a hard limit at 0 dBFS. | on |
| **Muted** | Silences the output. | off |
| **L** / **R** meters | The level that goes out. **clip** lights up for a moment at full scale. | |

### Ports

| Port | Kind | Use |
|---|---|---|
| **In** | audio in | Connect the Mixer, a Leveler, a Recorder or a synth. |

### An example

1. Place two **Audio Output** devices and a **Mixer** with at least two channels.
2. Connect **Out** of the Mixer to **In** of the first Audio Output and choose your monitors in its list.
3. Connect a second source, for example a click or a cue sound, to the second Audio Output and choose your headphones. Set the **Mono** switch if you want one ear only.
4. Start with the **Volume** low and raise it.

### Presets

The **Audio Output Basics** pack has 16 presets in four folders: **Main Out**, **Headphones**, **Interface Pairs** and **Checks**. A preset sets the volume, mono, the limiter and the pair. It does not set the output itself and it does not mute. See [Presets](../presets/USER-MANUAL_EN.md).

### Tips and limits

- A browser has no ASIO. An interface works through the driver of your operating system. A chosen output is stereo. Picking a pair of channels only works on the default output, and only if the browser shows more than two channels.
- A chosen output goes through a second path in the browser, so it can have a little more delay than the default output.
- The sound of Audio Output goes to the output you chose and no longer through the default output. Speakers keeps playing to the default output, so use only one of them for the same signal unless you want it on both.
- The browser may hold back the sound of a chosen output until you click in Patchkamer once (press **Start**). The card then says so.
- If the chosen output is gone, for example because an interface was unplugged, the sound goes to the default output and the card says so.
- A signal that is not a number (NaN) or infinite from another device is stopped, and the limiter is restored.

## If it does not work

- **I hear nothing.** Press **Start**, or click anywhere in Patchkamer once: browsers pause audio until you do. Check that a teal cable runs from your sound makers to a Mixer channel, from **Out** of the Mixer to **Speakers**, and that **Volume** on Speakers and on your computer is up.
- **One channel is silent.** Look at **M** and **S**: if any channel has **S** on, all other channels are silent. Also check its fader (−60 dB is off) and that it goes to **→ M** or to a group that is not muted.
- **Level match says there is no signal.** Press **Start** so the sources play, and measure again.
- **The reverb or effect is not heard.** Check that **SEND** is above 0%, that the effect output goes to the **RET** port of the same channel and that **RETURN** is not at 0%.
- **A bundle channel does not arrive.** Check that the green cable is on **bundle in** and that you chose a channel in the source list of the channel.
- **Crackles.** Open Settings → Audio and choose a larger latency, or a lower quality. See the [main manual](../USER-MANUAL_EN.md#13-troubleshooting).
