# Tools: user manual

*Nederlandse versie: [USER-MANUAL_NL.md](USER-MANUAL_NL.md)*

This manual covers the seven **tools** of Patchkamer. Tools are helpers: you use them to play, keep time, record, measure, take notes or control other devices. They are not effects, and apart from the Metronome click they make no sound of their own. For the basics (starting Patchkamer, loading a library, drawing cables) see the [main manual](../USER-MANUAL_EN.md). The list of tools is in the [tools folder](../../devices/tools/README.md).

## Which tool for which goal

| I want to… | Use | It has |
|---|---|---|
| play notes with the screen keyboard, my computer keys or a MIDI keyboard | [Keys / MIDI](#keys--midi) | a **Notes / CC** event out |
| control many devices from a grid of 40 pads on a MIDI controller | [Pad Controller](#pad-controller) | a **MIDI (raw)** event in, 40 **Pad** event outs and a **Buttons** modulation out |
| record the finished mix (or any sound) into one file | [Recorder](#recorder) | **In** and **Through** audio |
| record many tracks at once, one file per track | [Multitrack](#multitrack) | a **Bundle** in |
| see the sound: spectrum, waveform, level | [Scope](#scope) | **In** and **Through** audio |
| hear a click in time with the clock, or let a drum play on the beats | [Metronome](#metronome) | a click on **Out** and trigs on **Trigs** |
| write down ideas, the key and a to-do list | [Notes](#notes) | no ports |

## How you connect tools

- **Keys / MIDI** and **Pad Controller** send *events* (notes). Their orange event ports connect to the notes input of a synth, a sampler or an arpeggiator.
- **Recorder** and **Scope** are audio devices that let the sound through unchanged. Put them in the audio path, for example between the Mixer and Speakers. Recorder and Scope can also hang on the end of a cable that continues to other devices.
- **Multitrack** listens to a *bundle* (the thick green cable with many channels) and does not pass sound on. It sits next to the Mixer, not in the path.
- **Metronome** has an audio out (the click) and an event out (**Trigs**). Connect **Out** to your mixer to hear the click, and **Trigs** to a drum machine or sampler to let it play on the beats.
- **Notes** is not connected to anything.

Apart from the click of Metronome, none of these tools adds to your sound: they play, look, record or note.

---

## Keys / MIDI

**What it is for.** A keyboard that makes no sound of its own. You play with it and it sends the notes to another device: a synth, a sampler or an arpeggiator. You can play on the on-screen piano, with the keys of your computer keyboard, or with a MIDI keyboard.

![The Keys / MIDI card](../images/en/tools/keys.png)

**Controls**

- **Connect MIDI** asks the browser once for permission to use MIDI. Afterwards the button reads **Reconnect MIDI**. You need a browser with Web MIDI (Chrome or Edge).
- **All off** silences every note that is still sounding.
- **MIDI input** chooses one MIDI keyboard or **All MIDI inputs**. **Channel** chooses one MIDI channel (1 to 16) or **All channels**.
- **Play mode:** **Pulse · note + dur** sends a note with a fixed length. **Hold key · noteoff** keeps the note as long as you hold the key and sends a note-off when you let go; the sustain pedal of a MIDI keyboard works in this mode. Use Hold for devices that understand held keys, and Pulse for devices that work from a note length.
- **Lowest key (MIDI)** sets the first note of the keyboard: C1 to C6, in steps of an octave (it starts at C3).
- **Velocity** (0.05 to 1, start 0.80) is how hard the notes are played, for the screen and computer keys. A MIDI keyboard sends its own velocity.
- **Pulse length (s)** (0.05 to 8 seconds, start 0.50) is the length of a note in Pulse mode.
- **Pitchbend** and **Bend centre**: the slider bends the pitch; the button puts it back in the middle. A MIDI keyboard's pitch wheel moves it as well.
- **Modulation wheel** sends the modulation (vibrato) value. A MIDI keyboard's wheel moves it as well.
- **Computer keys:** click the piano first so it has focus. The row A W S E D F T G Y H U J K O L P ; ' plays notes upward from the lowest key (A is the lowest key itself, W is the black key above it, and so on).
- From a MIDI keyboard, controllers 1, 11, 74 and 7 are passed on as vibrato, expression, cutoff and volume; the pitch wheel becomes pitchbend.

**Ports.** One event out, **Notes / CC**. It sends notes, note-offs and these controllers. No audio, no inputs.

**Example patch.** Place Keys, a synth and Speakers. Connect **Notes / CC** of Keys to the notes input of the synth, and the synth's audio out to Speakers. Press **Start**, click a piano key (or press A) and you play the synth. For a MIDI keyboard: **Connect MIDI**, allow access, pick the keyboard under **MIDI input**.

**Presets.** No preset pack for Keys is included yet. The **Presets** menu on the card works as always (see [Tunes and presets](../USER-MANUAL_EN.md#7-tunes-and-presets)): **Save** keeps your own. A preset holds the lowest key, velocity, pulse length and play mode. The MIDI channel, the MIDI input and the bend and wheel positions are not part of a preset.

**Tips and limits.** MIDI is only asked for after you click **Connect MIDI**, and no system-exclusive messages are used. If your MIDI keyboard is not found, check that the page is in Chrome or Edge and that you allowed access. Keys has no sound: with nothing connected to **Notes / CC** you hear nothing.

---

## Pad Controller

**What it is for.** A control device for a MIDI controller that has a grid of 40 pads (8 across, 5 high), a row of knobs, and keys. You link a device to a pad. Pressing **Shift** and a pad on the controller picks which device you play; the keys then play that device. The pads light up in the colour of the device's category. You choose the MIDI input and the output for the lights yourself; Pad Controller does not look at the name of the MIDI port.

![The Pad Controller card](../images/en/tools/pad-controller.png)

**Controls**

- **CONNECT MIDI** asks the browser for permission to use MIDI; next to it the card says how many MIDI inputs it found ("not connected yet" before that).
- **Timing:** **tight (+12 ms, even)** gives every hit the same small fixed delay, based on the time stamp of the MIDI message, so the timing stays even when the page is busy. **direct (as fast as possible)** plays at once.
- **SHIFT** imitates the Shift key of the controller with the mouse.
- **The grid** shows pads 1 to 40, pad 1 at the bottom left and the rows going up. A linked pad shows its device and lights up in the colour of the device's category; the pad you play pulses. Click a pad to select it; double-click (or Shift + pad on the controller) to play it.
- **The pad row** under the grid (for example "Pad 1") has a list **— not linked —** to choose a device. Next to it appear buttons when they apply: **Link …** (links the device you last clicked on the canvas), **Play** and **Unlink** (for a linked pad) and **Lay cable again** (when the cable has gone). Linking lays the cables for you.
- **Per MIDI input** you choose what it sends: **keys**, **pads + buttons** or **ignore**. Choose the role yourself before you press pads; otherwise the pads are played as notes. An input that sends the knob or button messages is marked as **pads + buttons** automatically.
- **LEDs to** is the MIDI output for the lights. It starts at **— none —**: the lights stay off until you choose an output.

**What the controller must send.** Pad Controller does not know controllers by name. It expects this layout; if your controller sends something else, linking will not work.

| What | Message |
|---|---|
| Pad 1 to 40 (bottom left = 1, rows going up) | note on, note number 0 to 39 |
| Shift | note 98 |
| The eight knobs | controllers 48 to 55, relative values |
| Keys | ordinary note on and note off |
| Lights (the output you choose) | note on on the pad's note number, colour as velocity |

**Ports.** **MIDI (raw)** is an event in for raw MIDI messages. **Pad 1** to **Pad 40** are 40 event outs, one per pad. **Buttons** is a purple modulation out for the knobs. There is no audio.

**Example patch.** Place Pad Controller, a synth and Speakers, and connect the synth's audio to Speakers. Click **CONNECT MIDI** and allow access. Set your pad input to **pads + buttons** (and, if you want the lights, choose the output under **LEDs to**). Open the list on pad 1, choose the synth: Patchkamer lays the cable from **Pad 1** to its notes input. Press Shift + pad 1 on the controller, then play the synth with the keys.

**Presets.** No preset pack is included. A preset holds only the **Timing**. The links, the MIDI roles, the light output and the chosen pad are not part of a preset: they belong to your patch and are saved with the workspace or song.

**Tips and limits**

- The knobs are only shown for now. They do not control parameters yet (the card says so); the fixed layout per kind of device, such as drum pads, comes later.
- The links are the cables of the patch. If a cable is removed, the pad shows "cable loose"; **Lay cable again** restores it. Pad Controller only removes its own cables.
- It was tested with simulated MIDI messages, not with a real controller. Without MIDI access you can still link and play by clicking pads on the card.
- It needs a Patchkamer that can lay cables for devices; an older one says so on the card.

---

## Recorder

**What it is for.** Records what comes in, usually the whole mix, and passes it on unchanged. You use it to make an audio file of your music: WAV for the best quality, MP3 for a small file.

![The Recorder card](../images/en/tools/recorder.png)

**Controls**

- **Recording name** is the start of the file name; a saved take is called `<name> take <n>`.
- **Format** (choose it before you record; it is locked while recording):
  - **WebM/Opus** (or **MP4/AAC**, depending on your browser): small files.
  - **WAV 16-bit** and **WAV 24-bit**: lossless.
  - **MP3**: small files. A **Bitrate** list appears with 128, 192, 256 or 320 kbps (start 192).
- **● Record** and **■ Stop** control the recording. A level meter and the time show what is happening.
- **Record with Start/Stop of the clock** makes the recording follow Start and Stop of the clock.
- Every take appears in a list with its length, format and size, with a button to listen (**▶**) and **Save**. Takes stay in memory until you close the page. **Save** gives you the audio file.

**Ports.** **In** is the audio in, **Through** the audio out: the sound passes unchanged.

**Example patch.** Connect the Mixer to Recorder **In**, and Recorder **Through** to Speakers. Choose **WAV 24-bit**, press **● Record**, play your music, press **■ Stop**, then **Save**.

**Presets.** No preset pack is included. A preset holds the name, the clock option, the format and the bitrate. Takes are never part of a preset.

**Tips and limits**

- A WAV or MP3 take keeps the raw sound in memory, about 23 MB per minute at 48 kHz stereo. The file is only made when you press **Save**; an MP3 takes a moment and a message shows the progress.
- MP3 works at 8 to 48 kHz and at multiples of 48, 44.1 or 32 kHz (for example 96 kHz, which Recorder brings back to 48 kHz). At another sample rate Recorder says MP3 is not possible; WAV always works. A WAV file cannot be longer than 4 GB; pick MP3 for very long recordings.
- WAV and MP3 need AudioWorklet in the browser; if it is missing, pick another format.
- Whether a recording sounds right depends on what you send in: Recorder does not change it.

**License of the MP3 encoder.** Recorder makes MP3 files with [lamejs](https://github.com/zhuker/lamejs) 1.2.1, a JavaScript version of the LAME encoder. lamejs is free software under the [LGPL-3.0](../../LICENSES/LGPL-3.0-only.txt) and sits unchanged in the Recorder file, as one separate piece of text (`LAME_SRC`, at the bottom). You can replace it with another version or your own build of lamejs. The rest of Recorder is AGPL-3.0-or-later. See [LICENSING.md](../../LICENSING.md) (in Dutch).

---

## Multitrack

**What it is for.** A recorder for up to 16 tracks at once, sample-aligned, for when you want every instrument or channel as its own file, for example to mix elsewhere. Each track is a stereo WAV.

![The Multitrack card](../images/en/tools/multitrack.png)

**Controls**

- **● RECORD** starts a take, **■ Stop** ends it. The text field next to it is the name of the session (the start of the file names). The timer shows the length.
- The line under it shows how many tracks are armed, the format, the sample rate and about how much memory a minute takes.
- **TRACKS** (1 to 16, start 8) sets the number of tracks. **WAV** chooses **16 bit**, **24 bit** or **32 bit float** (start 24 bit).
- **WITH CLOCK START/STOP** makes the recording follow Start and Stop of the clock.
- **ASSIGN NEW CHANNELS AUTOMATICALLY**: new bundle channels go onto free tracks, and tracks are added when needed (up to 16). **ARM ALL** arms every track.
- **Per track:** a red button (arm: record on this track or not), a name field (becomes the file name), a list for the source (a channel of the bundle, or **— none**) and a level meter.
- After a take, a list shows your takes. **Save all (.zip)** saves one stereo WAV per track in a single zip. **Per track** saves single tracks. A **×** discards a take to free memory.

**Ports.** One bundle in, **Bundle** (the thick green cable). No audio, events or modulation. Multitrack only listens; it does not pass the sound on.

**Example patch.** Connect the green bundle out (**Channels out**) of the Mixer to **Bundle** of Multitrack. Leave **ASSIGN NEW CHANNELS AUTOMATICALLY** on: the Mixer channels appear on the tracks. Press **● RECORD**, play, press **■ Stop** and then **Save all (.zip)**.

**Presets.** No preset pack is included. A preset holds the settings of the session and the tracks (the number of tracks, the format, the names and which tracks are armed). The source of each track is routing and is not part of a preset.

**Tips and limits**

- Takes stay in memory until you close the page; save what you want to keep.
- The information line shows how much memory a minute needs with the tracks that are armed. A long take of 16 tracks at 32 bit takes a lot.
- Each track file is a stereo WAV.

---

## Scope

**What it is for.** A window on the sound. The audio goes from **In** to **Through** unchanged, while the card shows what passes: a spectrum, the waveform, a spectrogram, the stereo image or the levels. You use it to check a mix, find a hum, or see whether something clips.

![The Scope card](../images/en/tools/scope.png)

**Controls**

- **View** chooses what you see: **Spectrum**, **Waveform L/R**, **Spectrogram**, **Stereo image** or **Peak / RMS**.
- **FFT** (1024, 2048, 4096 or 8192) sets the detail of the spectrum: more detail is slower to react. **Smooth** (**off**, **light**, **normal**, **strong**) sets how calmly it moves. **Range** (60, 90 or 120 dB) sets how many dB you see.
- **Time** (5, 10, 25 or 50 ms) sets the length of the waveform you see.
- **Pause** freezes the picture; the button then reads **Resume**.
- The line below the picture gives the peak and RMS level of left and right in dBFS. When the signal goes over the limit, it says CLIP.
- In the other views you find: the spectrogram runs from new (top) to older (down); the stereo image also shows the correlation; the **Peak / RMS** view shows RMS as a bar and the sample peak as a line.

**Ports.** Audio **In** and audio **Through**. The sound passes with a gain of exactly 1, without delay.

**Example patch.** Place Scope between the Mixer and Speakers: Mixer out to **In**, **Through** to Speakers. Press **Start** and choose **Spectrum**; the picture moves with the sound.

**Presets.** No preset pack is included. A preset holds the view, FFT, smoothing, range and time. Pause is not part of a preset.

**Tips and limits.** The card draws about 30 times a second and only while you can see it. Scope does not change the sound; it only measures. If a signal contains broken values (NaN or infinity), Scope counts them as silence in its analysis.

---

## Metronome

**What it is for.** A click that keeps time with the clock of the studio: a short beep on every bar, beat, eighth or sixteenth. Use it to practise or record in time, or let the same beats play along with a drum machine or sampler. The first step of every bar is louder and higher than the other clicks.

![The Metronome card](../images/en/tools/metronome.png)

**Controls**

- **Every** chooses how often a click sounds: every **Bar**, **Beat**, **8th** or **16th**. The start is **Beat**.
- **Level** (0 to 100%, start 50%) is the volume of the click on the audio output.
- **Step** shows the 16 steps of the bar and lights the current one while the clock runs.

**Ports.** Two outputs and no inputs. **Out** is the click as audio (teal). **Trigs** (orange) sends a trigger at every click, so a drum machine or a sampler can play on the same beats. The trigger on the first step of the bar is stronger than the others. The level knob only affects **Out**, not **Trigs**.

**Example patch.** Place Metronome, a **Mixer** and **Speakers**. Connect **Out** of Metronome to an input of the Mixer and **Out** of the Mixer to **In** on Speakers. Press **Start**: you hear a click on every beat, with a higher one on the first beat of each bar. Choose **Practice › Bar Only Quiet** from the presets for a soft click once per bar. To let a drum play on the beats, also connect **Trigs** to a drum machine.

**Presets.** The pack **Metronome Basics** has 9 presets in three folders: **Practice** (Bar Only, Bar Only Quiet, Quarter Beats, Quarter Beats Quiet), **Subdivisions** (Eighth Notes, Eighth Notes Quiet, Sixteenth Ticks) and **Loud** (Quarter Beats Loud, Stage Click). The file is [`presets/metronome.patchkamer-presets.json`](../../presets/metronome.patchkamer-presets.json). Load it from a library (see the main manual) or with the **Presets ▾** menu → **Import…**. A preset holds **Every** and **Level**.

**Tips and limits.** Metronome only clicks while the clock runs (after **Start**); it follows the tempo of the studio and has no tempo of its own. A click is a short sine beep of 1000 Hz (1600 Hz on the first step of the bar). Not listened to: set **Level** by ear, for example with headphones.

---

## Notes

**What it is for.** A notepad on the floor for ideas, the key, the structure and what you still want to do. It makes no sound and has no ports; the text is saved with the workspace or song.

![The Notes card](../images/en/tools/notes.png)

**Controls**

- **KEY** and **TEMPO / FEEL** are short fields, for example "A minor" and "128, hypnotic". Both hold up to 200 characters.
- **SECTION** has the buttons **INTRO**, **BUILD**, **BREAK**, **DROP** and **OUTRO**. Each one puts a heading with that name in the text.
- The large field is for free text (ideas, structure, what to try tomorrow).
- **TO DO:** type a task under "new task, Enter" and press **Enter** (or **+**). Tick it off when it is done and remove it with the cross.
- A line at the bottom shows when you last changed the notes.

**Ports.** None.

**Example.** Place Notes next to your patch. Fill in the key and the tempo, press **INTRO** and **DROP** to set up the structure, write what each part needs, and add a to-do for each loose end.

**Presets.** No preset pack is included. A preset holds everything on the card except the time of the last change, so you can save an empty song template with headings and tasks.

**Tips and limits.** The notes hold up to 100,000 characters and up to 200 tasks of up to 500 characters each.

---

## If it does not work

- **No sound from the synth I play.** Keys and Pad Controller only send notes. Check the cable from **Notes / CC** (or **Pad N**) to the notes input of a sound-making device, and from that device to Speakers. See also [Troubleshooting](../USER-MANUAL_EN.md#13-troubleshooting).
- **Keys does not react to my MIDI keyboard.** Use Chrome or Edge, click **Connect MIDI** and allow access. Check **MIDI input** and **Channel**: choose **All MIDI inputs** and **All channels** to be sure.
- **The computer keys do nothing.** Click the piano on the card first; the keys only work when the card has focus and not while you are typing in a field.
- **Pad Controller plays notes instead of using the pads.** Choose **pads + buttons** for that MIDI input before you press the pads. For the lights, choose an output under **LEDs to**.
- **Recorder or Multitrack records silence.** Recorder needs sound on **In**. Multitrack needs a bundle on **Bundle** and a source on each armed track (**— none** records nothing). Check that **Start** has been pressed.
- **Metronome does not click.** It only clicks while the clock runs: press **Start**. Connect **Out** to a mixer or to Speakers.
- **MP3 is not possible.** Your sample rate is not supported by MP3. Choose WAV, or change the sample rate under Settings.
