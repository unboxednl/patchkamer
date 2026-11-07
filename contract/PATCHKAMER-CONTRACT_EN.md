# Patchkamer — Instrument contract v1.21 for building agents

This document is the complete, self-contained instruction for building an instrument, effect, modulator or utility device for **Patchkamer**, a modular browser studio on Web Audio. An agent that receives this document needs no other context. Deliver exactly one file `name.patchkamer-device.js` that complies with this contract and passes `validate-instrument.mjs` without errors.

_This contract is offered in two languages: `PATCHKAMER-CONTRACT_NL.md` (Dutch, the source text) and `PATCHKAMER-CONTRACT_EN.md` (English). Both have the same version and the same content; if they differ, the Dutch text prevails. The validator speaks both languages too (`--lang nl|en`)._

_This version was rewritten on the basis of the host code and the library of November 2026; it replaces earlier versions of this document. Everything from v1.0–v1.4 remains valid; v1.5 up to v1.9 are additions. A device that complies with an older version still works, but only devices that comply with v1.6 work well with presets, and only devices that comply with v1.7 keep the studio smooth when many devices are on the floor. v1.8 asks almost nothing of a device: the host improves the controls._

| Version | What was added |
|---|---|
| v1.0 | Basics: default export, ports, clock, events, state |
| v1.1–v1.3 | Card width (`ui.width`, `ui.minWidth`) and `category` (the exact version number is no longer fixed) |
| v1.2 | Ports that change (`host.setPorts`), ports in your own UI (`ui.jacks` + `host.ui.jack`) |
| v1.3 | Modulation: purple cables, `params()` + `modulate()`, modulators (`kind: 'modulator'`) with `host.modulate` |
| v1.4 | Fast modulation (`fast: true`, `modInput`, `host.modSignal`) and AudioWorklets (`host.loadWorklet`) |
| v1.5 | Bundles: one thick green cable with many audio channels (`multiIn`/`multiOut`, `bundles`, `onBundle`, `host.bundleChanged`, `host.isWired`) |
| v1.6 | Presets: `setState` must also update the knobs; optional `getPreset`/`setPreset` to keep routing out of presets |
| v1.7 | Smooth: drawing via the host's clock (`host.frame`, `host.visible`) and rules against stutter (§12b). Control for controllers: `host.peers`, `onPeers`, `host.connect`, `host.disconnect`, `host.cablesFrom` (§13b) |
| v1.8 | Controls by the host: double-click = default value, click the number = type, rotary knob as a choice; `host.ui.knob` gets a 7th argument `{ default, scale }`; `data-pk-default` / `data-pk-noreset` / `data-pk-for` for your own sliders (§12a). Drawing gate as a quick conversion of old drawing loops (§12b) |
| v1.9 | Components: tunes (devices that make sound) and presets (everything else) in libraries per device, with folders and shareable packs; songs as an export of a workspace; a license (SPDX) on every tune, preset and song. Optional for drum machines: instruments (`parts`, `getPart`, `setPart`) for tunes per instrument (§0, §13c) |
| v1.10 | File name `*.patchkamer-device.js` for devices (§2, §16): without a manifest the host now only looks for these files, the validator warns about any other name |
| v1.11 | Language and audio: `host.lang` (`'nl'` or `'en'`) and `host.audio` (`sampleRate`, `quality`, `oversample`, `latency`) for devices; optional `i18n` on the definition for names per language (§2, §12c). The contract and the validator are bilingual (Dutch and English) |
| v1.12 | Mastering: a cable kind of its own (yellow, dotted sine) with triangle ports `masteringIn`/`masteringOut`; `configureMastering` and `onMasteringTargets`; `host.mastering` for a Master Director that sets the settings of mastering devices together (§11b) |
| v1.13 | Multi-MIDI and controls: a cable kind of its own (double dashed orange cable) with `multiEventIn`/`multiEventOut`, `eventBundles`, `onEventBundle` and `host.eventBundleChanged`; the optional fields `ch` and `cc` on events; `host.controls` and `host.setControl` to see and set the controls of other devices (§11c) |
| v1.14 | Note names: a device that maps notes to names (a drum machine) can offer `noteNames()` and call `host.noteNamesChanged`; `host.peers` passes them on as `noteNames`, so a sequencer can name its rows (§13b) |
| v1.15 | Controls recognisable for skins: `id`, `role` and `group` on `host.ui.knob` (in the `options`) and `host.ui.select` (new 6th argument), the attributes `data-pk-id` / `data-pk-role` / `data-pk-group`, `host.ui.adopt` for your own elements and `host.ui.list` for the register; the validator gives a `warning` for duplicate or missing ids and knows `--controls` (§12d). |
| v1.16 | Coverage of `params()`: every continuous control belongs in `params()` (`modExclude` for deliberate exclusions, `on`/`drift` for whatever would sound wrong when it moves unasked, §8); the validator gives a `warning` for a control that is not in `params()`, for a device with controls but no `params()` and for a param id without a control, and `--controls` shows the column `in params()` |
| v1.17 | Clipboard: copying and pasting patterns and clips between devices. Optional `clipInfo()`, `getClip()`, `setClip(clip)` (all three or none) and the exchange format `patchkamer-clip` (JSON, time in ticks); the host puts the Copy and Paste buttons in the card bar and translates between devices; the validator checks the three methods and knows `--clip` (§13d) |
| v1.18 | Meters: `host.ui.meter(parent, label, opts)` lets the host draw the level (bar, LED ladder or a round VU meter with a needle; length and width adjustable by a skin), from one or two `AnalyserNode`s (`source`) or through `set(level)`; a meter is in the register with role `meter`; a device on an older host without `host.ui.meter` falls back to its own drawing; the attribute `data-pk-suffix` (text after the label when linking to MIDI); the validator knows `host.ui.meter` and shows meters in `--controls` (§12e) |
| v1.19 | Tags for tunes and presets: `tags` on a tune, folder or pack (paths such as `instrument/guitar/acoustic` and `style/hiphop`); the host shows them as an indented tree (Tunes and Presets, By instrument and By style). Only the packs change, not the devices (§13c) |
| v1.20 | Samples: sample packs (`*.patchkamer-samples.json`, sound as base64) with a tab of their own in the library, and for devices that load audio the optional method `loadAudio(files, info)` (§13e) |
| v1.21 | Recording and playing settings: `host.watchParams`, `host.setParam`, `host.lockParams` and `host.paramsOf` let a sequencer follow the controls of another device (including what a modulator does), set them to an absolute value and lock them against modulation (§13f) |

---

## 0. The components of Patchkamer

| Component | What it is | File |
|---|---|---|
| **Patchkamer** | The studio (one HTML page): placing and connecting devices, the clock, and the management of all components below. Its own settings (display, cables, scale) are separate under *Settings*, per computer, and are in no other file. | `patchkamer.html` |
| **Contract** | This document (in two languages) plus `validate-instrument.mjs`: what a device looks like, so that an AI can build one too. Belongs to a version of Patchkamer. | `PATCHKAMER-CONTRACT_NL.md`, `PATCHKAMER-CONTRACT_EN.md` |
| **Device library** | Devices in categories (synths, drums, effects, mixers, sequencers, modulation, mastering, utilities). | `*.patchkamer-device.js`, plus `patchkamer-bibliotheek.json` for the layout |
| **Song** | An export of a workspace: all devices **with their code**, their settings and patterns, the cables and the tempo, plus title, author, license and description. Whoever opens it hears it exactly as intended and can keep working. (A recording, e.g. MP3, belongs in the repository next to the song; not in the file.) | `*.patchkamer-song.json` |
| **Tune** | The sound of a device **that makes sound** (`kind: 'instrument'`: synths, drones, drum machines), in a tune library of that device. Drum machines can also have tunes per instrument. | `*.patchkamer-tunes.json` |
| **Preset** | The setting of a device **without a sound of its own** (`effect`, `mixer`, `output`, `utility`, `modulator`: effects, mixers, mastering, sequencers, modulators, controllers), in a preset library of that device. | `*.patchkamer-presets.json` |

Whether your device gets tunes or presets follows from its `kind`. Workspace and song are almost the same: the workspace is where you work (in your browser or as `*.patchkamer.json`), the song is its shareable export.

---

## 1. What Patchkamer is

- A web page (the **host**) with a **floor** on which devices stand as cards, connected with cables.
- Six kinds of cables:
  - **audio** (cyan): AudioNode → AudioNode;
  - **events** (orange): notes, trigs and CC as small JSON objects;
  - **modulation** (purple): a modulator shifts parameters of another device;
  - **bundle** (thick, green): many audio channels at once, each with a name.
  - **mastering** (yellow, dotted sine): a Master Director sets the settings of mastering devices (§11b).
  - **multi-MIDI** (double dashed orange): many tracks with a name in one cable, for example all tracks of a sequencer (§11c).
- One shared **clock** (BPM, swing). The host schedules every sixteenth note ahead of time and reports it to every device that wants to know.
- Devices are **ES modules**. Everything the module needs is in that one file: no imports, no network, no external files.
- Every card has a **preset bar**. The host saves and restores presets with the state of the device (§13).

A device decides for itself how it sounds and what its UI looks like. The host decides about connections, timing, saving, loading and presets.

---

## 2. The file

A device is one ES module with a default export, in a file `name.patchkamer-device.js` (for example `tremolo.patchkamer-device.js`). The content is plain JavaScript. The double extension lets Patchkamer see in a library without a manifest which files are devices and which are not (§16); editors and Node treat the file as `.js`.

```js
export default {
  id: 'nl.yourdomain.name',      // unique, reverse-DNS, lowercase: [a-z0-9] and dots/dashes
  name: 'Readable name',         // short; shown on the card and in the library
  version: '1.0.0',              // semver x.y.z
  kind: 'effect',                // 'instrument' | 'effect' | 'mixer' | 'output' | 'utility' | 'modulator'
  category: 'effect',            // optional: 'synth' | 'groove' | 'sequencer' | 'mod' | 'effect' | 'mix' | 'tool' | 'mastering'
  ui: { width: 360, minWidth: 260, jacks: false },   // optional, see §12
  i18n: { en: { name: 'Readable name', ports: { out: 'Out' } } },   // optional (v1.11): names per language, see §12c
  ports: {
    audioIn:  [{ id: 'in',    name: 'In' }],
    audioOut: [{ id: 'out',   name: 'Out' }],
    eventIn:  [{ id: 'notes', name: 'Notes' }],
    eventOut: [{ id: 'trigs', name: 'Trigs' }],
    modIn:    [],                // modulation in (rarely needed: the host adds 'mod' automatically, see §8)
    modOut:   [],                // modulation out (modulators only)
    multiIn:  [],                // bundle in (v1.5)
    multiOut: [],                // bundle out (v1.5)
    masteringIn:  [],            // mastering in: target of a Master Director (v1.12)
    masteringOut: [],            // mastering out: a Master Director only (v1.12)
    multiEventIn:  [],           // multi-MIDI in: a receiver of tracks (v1.13)
    multiEventOut: [],           // multi-MIDI out: a source of tracks (v1.13)
  },
  create(ctx, host) { /* ... */ return instance; }
};
```

**Identity.** A device is unique by `id` + `version`. The same `id` with a different `version` is a different version of the same device. Both can be loaded at the same time and on a card you can switch between versions: the host saves `getState()`, creates the new version, calls `setState()` and lays the cables again. Therefore keep port ids the same between versions, and let `setState` accept both old and new state. New behavior means a new `version`; the `id` and the file name stay the same.

**`kind`** is a hint for the library and for the validator, not a restriction. Only `kind: 'output'` may connect to `ctx.destination`. A `modulator` has at least one `modOut`.

**`category`** determines where the device is in the library. Without a category the host derives it from `kind`. `'mastering'` (v1.12) is the library group for devices that finish a mix (mastering effects, the Master Director, the mix check and the listening output).

**`i18n`** (v1.11, optional) gives the name of the device and of its ports per language: `{ en: { name: '…', ports: { in: '…' } } }`. The host applies the name in `host.lang` and otherwise uses `name` and the port names from `ports`. See §12c.

---

## 3. Ports

- All twelve lists may be empty or absent. Port ids are unique within their list and consist of `[a-z0-9_-]`.
- Every `audioIn` port has an AudioNode in `instance.inputs`, every `audioOut` port an AudioNode in `instance.outputs`, with the same id.
- **Ports that change (v1.2).** `host.setPorts(this, ports)` replaces your port list while your device is running, for example when the user chooses more channels. First put the new AudioNodes in `inputs`/`outputs` and then call `setPorts`. Cables to ports that disappear are detached by the host.
- **Ports in your own UI (v1.2).** With `ui: { jacks: true }` the host does not draw a port row. You then place every port yourself with `host.ui.jack(this, parent, portId, 'in' | 'out', label)`. This works for all six kinds of cables.

---

## 4. The instance

`create(ctx, host)` receives the shared AudioContext and the host, and returns an object:

| Field | Required | What the host does with it |
|---|---|---|
| `inputs` | yes | `{ portId: AudioNode }` for every `audioIn` |
| `outputs` | yes | `{ portId: AudioNode }` for every `audioOut` |
| `mount(el)` | yes | Build your UI in this empty element. Called once, after `create`. |
| `unmount()` | no | Stop animations (`requestAnimationFrame`) and timers of your UI. |
| `onStep(info)` | no | Clock: every sixteenth note, scheduled ahead (§5). |
| `onTransport({ playing })` | no | Start and stop of the clock. |
| `onEvent(portId, ev)` | no | Incoming event (§6). |
| `getState()` | yes | Everything needed to restore the device exactly, as plain JSON. |
| `setState(s)` | yes | Restore state, **including the knobs in your UI** (§13). |
| `destroy()` | yes | Stop sources, disconnect nodes. Must be callable twice. |
| `params()`, `modulate(o)` | no | Make modulatable (v1.3, §8). Always together. |
| `modInput(paramId)` | with `fast` | Fast modulation (v1.4, §9). |
| `onModTargets(t)`, `onModSources(s)` | modulator | Whom you control, who controls you (§8). |
| `bundles` | with `multiOut` | `{ portId: () => ({ label, channels }) }` (v1.5, §11) |
| `onBundle(portId, key, bundle)` | with `multiIn` | Bundle connected, changed or detached (v1.5, §11) |
| `getPreset()`, `setPreset(p)` | no | Only if a preset should not contain something (v1.6, §13). Always together. |

Order when placing a card: `create` → `mount` → `setState(saved)` (if there is saved state) → cables. When loading a workspace the cables come only afterwards, in a following frame.

---

## 5. Clock and timing

```js
onStep({ step, bar, time, stepDur, bpm, swing }) { ... }
```

- The host calls `onStep` for **every sixteenth note**, well before the moment itself (looking ahead about 100 ms).
- `step` runs from 0 to 15, `bar` keeps counting. `time` is AudioContext time; swing is already included.
- Always schedule sound at `time`: `osc.start(time)`, `param.setValueAtTime(v, time)`. Never use `Date.now()` or `setTimeout` for timing.
- Read the tempo from `bpm` and `stepDur`. The clock belongs to the host. `host.setTempo(bpm)` may only be used after a click by the user, for example when choosing a preset that suggests a tempo.
- Do not throw errors in `onStep`: that function runs in the host's scheduler.
- In `onStep` you may also update your UI, such as a step cursor.

---

## 6. Events

Send with `host.emit(this, 'portId', ev)`. The port must be in `eventOut`. You receive in `onEvent(portId, ev)`.

```js
{ type: 'note', note: 60, vel: 0.8, time, dur }    // MIDI note number, velocity 0..1, duration in seconds
{ type: 'trig', vel: 0.9, time, lane: 'kick' }     // a hit; lane says which voice
{ type: 'cc', id: 'cutoff', value: 0.5, time }     // a value 0..1 on a name
// Optional on note, trig and cc (v1.13): ch = MIDI channel 1..16; on cc also cc = controller number 0..127. Ignore unknown fields.
```

- `time` is always AudioContext time. Schedule at `time`, not at the moment of receipt.
- Ignore types you do not know; do not throw an error.

---

## 7. Audio

- The host connects your `outputs[x]` to the `inputs[y]` of another device. You never connect to other devices yourself.
- Never connect to `ctx.destination` unless you are `kind: 'output'`.
- Keep your output around −12 dBFS; the mixer and the output do the rest.
- Do not create your own AudioContext. Use `ctx` from `create`.
- Noise: `host.ui.noise(ctx)` returns a looping BufferSource with white noise. Distortion: `host.ui.curve(k)` returns a WaveShaper curve (k 0..1).

---

## 8. Modulation (v1.3)

Purple cables control parameters, not sound. A modulator (LFO, MSEG, Drift…) makes the parameters of another device move around their knob position.

**Controllable device.** Provide `params()` and `modulate(offsets)`. The host then automatically gives you a modulation input with id `mod`.

```js
params() {
  return [
    { id: 'cut', name: 'Cutoff', lane: 'filter', laneName: 'Filter', min: 80, max: 8000,
      role: 'filter', scale: 'log', drift: 0.10, on: true, fast: false },
  ];
},
modulate(offsets) {   // { paramId: −1..1 } — fraction of the range, on top of the knob
  for (const k in mod) delete mod[k];
  for (const k in offsets) if (known(k)) mod[k] = offsets[k];
  apply();
}
```

- `id` and `name` are required, with `min < max`.
- `lane`/`laneName` group parameters into **lanes**, for example one lane per drum sound.
- `scale` is `'lin'` or `'log'`. `drift` (0..1) is the suggested range for slow movement. `on` says whether the parameter is on by default in a modulator.
- `role` is a free hint (`filter`, `pitch`, `level`, `decay`, …).
- **Effective value** = knob + modulation:
  - linear: `clamp(knob + o × (max − min))`;
  - logarithmic: `clamp(knob × (max/min)^o)`.
- `modulate({})` removes all modulation. You ignore unknown ids.
- After a change of your parameter list, call `host.paramsChanged(this)`.

**Coverage: what belongs in `params()` (v1.16).** A modulator only sees what a device offers in `params()`. A control that is missing does not exist for Drift, LFO and MSEG.

- `params()` contains **every continuous control** of the device (slider, rotary knob, `<input type="range">`, `host.ui.knob`), with `id` equal to the state key (and to the `id` of §12d). A device that has one or more of those controls and no `params()` cannot be controlled.
- **Discrete controls** (select, checkbox, button) are not in it: moving continuously across a choice clicks and rebuilds buffers. To drive one anyway, use `host.setControl` (§11c).
- **Deliberately excluded controls** (test note, base note, pattern length, number of voices, step data, editing tools) are not in it either. Say so with `modExclude: ['testNote', 'baseNote']` on the definition (state keys or control ids); `modExclude: '*'` means the device deliberately offers nothing. Without that statement nobody can tell "forgotten" from "deliberately not".
- **`on` and `drift` make adding safe.** `on` says whether a modulator moves the parameter by itself; without `on` it is off. Set `on: false` (and a small `drift`, 0.05 to 0.10; 0 = do not move) on everything that sounds out of tune or disturbing when it moves unasked: pitch (`pitch`, semitones, fine), master level, gate, octave, ADSR times and lengths. Set `on: true` on sound where movement is nice (cutoff, resonance, mix). Adding a forgotten parameter then changes nothing audible until the user switches it on.
- Who should have `params()`: `instrument`, `effect` and `mixer` with continuous controls (except the categories `sequencer` and `tool`). `utility`, `output` and `modulator` need not; a modulator may be controllable itself (for example LFO rate).
- The validator gives a `warning` (never an error) for: continuous controls that are not in `params()` and not in `modExclude`, an `instrument`, `effect` or `mixer` with continuous controls but no `params()`, and a `params()` id without a control or state key (a typo: `modulate` ignores unknown ids). See §17.

**Modulator.** Use `kind: 'modulator'` and `ports.modOut: [{ id: 'mod', name: 'Mod' }]`. You receive `onModTargets(targets)` with, for each target, `{ id, name, def, version, params }`. That call also comes with an empty list, and again at every change. Control with `host.modulate(this, targetId, { paramId: −1..1 })`. Optionally you receive `onModSources(sources)`: who is controlling you. A modulator may itself be controllable too.

`host.modulate` gives roughly 20 to 30 updates per second: good for slow movement, too coarse for an LFO at 1/16. For that there is §9.

---

## 9. Fast modulation (v1.4)

A parameter can be **fast**: the modulator then delivers an audio signal, sample-accurate.

**Controllable device.** Set `fast: true` in `params()` and implement `modInput(paramId)`. It returns an AudioNode or AudioParam that receives a signal of **−1..1**, as a fraction of the range, just like with `modulate`. You convert it and add it to the knob:

```js
const FAST = { cut: 1200 * Math.log2(8000 / 80), lvl: 1 };   // −1..1 → cents (log) or units (lin)
modInput(id) {
  if (!(id in FAST)) return null;                // null for slow or unknown parameters
  if (fastIn[id]) return fastIn[id];
  const g = ctx.createGain(); g.gain.value = FAST[id];
  ({ cut: [filter.detune], lvl: [out.gain] })[id].forEach(p => g.connect(p));
  return (fastIn[id] = g);
}
```

Tip: for frequencies, `detune` (cents) of BiquadFilter and Oscillator works well as a logarithmic sum.

**Modulator.** First try `host.modSignal(this, targetId, paramId, node)` with your signal (−1..1). It returns `true` if the target can control that parameter fast. If it returns `false`, fall back to `host.modulate` for that parameter. With `node = null` you disconnect.

---

## 10. AudioWorklets (v1.4)

You write your own DSP as an AudioWorklet. The code is in your module as text:

```js
const WNAME = 'nl-yourname-myfx-1';              // unique, with version number
const WORKLET = `
class P extends AudioWorkletProcessor { process(inputs, outputs) { /* ... */ return true; } }
registerProcessor('${WNAME}', P);`;
host.loadWorklet(WNAME, WORKLET).then(() => {
  node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
  // put it in the chain
}).catch(() => { /* fallback */ });
```

- `host.loadWorklet(name, code)` loads each name once per AudioContext and returns a Promise.
- If you change the worklet code, raise the version number in the name: an old registration remains in the AudioContext.
- Make your device work without a worklet too: let the sound pass through unchanged and show a short message in the UI. Check `typeof AudioWorkletNode`.
- A worklet without outputs (`numberOfOutputs: 0`) is processed in Chrome anyway. That is handy for a recorder or meter that passes nothing on.
- You send notes to a worklet with `node.port.postMessage({ note, t, dur })`. In the processor you schedule them at `currentTime`.

---

## 11. Bundles (v1.5)

A **bundle** carries many audio channels in one cable, each with an id and a name. Examples from the library:
- the drum machine sends every drum sound separately (`Separate out`);
- the mixer accepts bundles (`bundle in`) and passes all its channels on as a bundle after mixing (`channels out`);
- the multitrack records a bundle, one track per channel.

**Source.** Set `ports.multiOut: [{ id: 'sep', name: 'Separate out' }]` and provide `bundles`:

```js
bundles: {
  sep: () => ({ label: 'Separate out', channels: [
    { id: 'kick',  name: 'Kick',  node: kickBus },     // one AudioNode per channel; stereo is fine
    { id: 'snare', name: 'Snare', node: snareBus },
  ] }),
},
```

- Use a **function**, so the host always reads the current channels.
- Channel ids are unique and stay the same as long as the channel exists; names may change.
- If the list changes (number of channels, names), call `host.bundleChanged(this, 'sep')`. The host sends the new bundle to everyone attached to that port.
- The nodes in a bundle remain yours: do not connect them to other devices yourself and do not disconnect them because someone uses them.

**Receiver.** Set `ports.multiIn: [{ id: 'in', name: 'Bundle' }]` and implement:

```js
onBundle(portId, key, bundle) { ... }
```

- `key` is unique per cable (form: `"deviceId:portId"` of the source) and stays the same as long as the cable exists.
- `bundle` is `{ key, source: { id, port, name }, label, channels: [{ id, name, node }] }`.
- **The same key again** means the bundle has changed. Then connect again what you had chosen.
- **`bundle === null`** means the cable is detached. Then disconnect everything you had connected from that bundle: `channel.node.disconnect(yourInput)`, never `channel.node.disconnect()` without an argument, because that also detaches the connections of others.
- Save your choice in your state as `key + '|' + channelId`, never the node itself. After loading a workspace the same key comes back and you find your choice again. If the bundle is not (yet) there, leave the choice in place and show "(not connected)".
- If you want to assign new channels automatically, do that only for channels you had not seen before. Then you do not overwrite a choice the user deliberately left empty.
- `host.isWired(this, portId, 'in' | 'out')` says whether an own port is wired. The mixer uses that to avoid putting a bundle on a channel that already has an ordinary cable in it.

---

## 11b. Mastering (v1.12)

**Mastering** is a cable kind of its own, for one task: one device, the **Master Director**, sets the settings of several mastering devices at once. It is not modulation (§8): no values from −1 to 1 travel over the cable but complete settings, and each target keeps its own locks and permission. It is not audio either: the signal path does not change.

- **Ports.** `ports.masteringOut` (the director) and `ports.masteringIn` (a target). The host draws them as a **triangle** instead of a circle, and the cable as a **yellow, dotted sine**. A mastering output only fits a mastering input. It stays an ordinary cable: visible, can be removed, with a colour of its own to choose, and saved in the workspace as `kind: 'mastering'`. Nothing is added to `params()` or `modInput`.
- **Target (`masteringIn`).** A target has `configureMastering(patch)`. If it is missing, the host refuses the cable with a message. `analyseMastering()`, `acceptMasteringProposal()` and `getMasteringReport()` are optional. Each method returns an object, for example `{ ok: true, changed: ['threshold'], skipped: ['ratio'] }`:
  - `configureMastering` takes over known fields only, limits numbers to their range, skips locked fields (`skipped`) and ignores unknown and invalid values. If the user has switched off outside control, return `{ ok: false, reason: '…', changed: [], skipped: [] }` and change nothing;
  - `getMasteringReport()` returns JSON without AudioNodes (the current settings, whether there is a suggestion, a few meter values).
  - A target may put `mastering: { protocol: 1, configure: true }` in its definition. That is an announcement for people and the library; the host looks at the port and the methods.
- **Director (`masteringOut`).** A Master Director has `onMasteringTargets(targets)`: a list `{ id, name, def, version }` of the targets on its cables. That call also comes with an empty list, and again on every change. It uses `kind: 'modulator'`; `masteringController: 1` in the definition is optional. It asks the host to do something with `host.mastering(this, action, options)`:

| Action | `options` | What the host does |
|---|---|---|
| `inspect` | `targetIds` (optional) | Calls `getMasteringReport()`; the result is in `results[].report` |
| `apply` | `settings`: `{ [targetId]: patch }`, `targetIds` | Calls `configureMastering(settings[targetId])` per target and keeps the old state for undo |
| `analyse` | `targetIds` | Calls `analyseMastering()` |
| `accept` | `targetIds` | Calls `acceptMasteringProposal()` and keeps the old state for undo |
| `undo` | — | Puts the last group change back with `setState` (the host keeps twenty per director) |

  `targetIds` limits the action to targets on your cables; if it is missing, that is all of them. The host returns `{ changed, results: [{ id, name, ok, reason, changed, skipped, report }] }`, or `{ error: 'text' }` in the user's language. `changed` counts the devices that changed something. For `apply` and `accept` the host only looks at devices on your cables and not at others.
- **Follow the user.** Change nothing on load, on connecting or when the workspace is restored; only after an action by the user. Put only what the user chose in the director's `getState` (style, situation, strength), no targets and no cables.

---

## 11c. Multi-MIDI and controls of other devices (v1.13)

Three things for sequencers and controllers: two optional fields on events, a cable that carries many tracks at once, and a way to set the controls of other devices.

**The fields `ch` and `cc`.** `note`, `trig` and `cc` may have `ch`: the MIDI channel, an integer from 1 to 16. `cc` may also have `cc`: the MIDI controller number, 0 to 127. A MIDI input sets them as the hardware sends them. A sequencer sets `ch` on the events of its multi-MIDI port to the channel of the track (the track number by default). A device that does not know the fields ignores them.

**The multi-MIDI cable.** A double, dashed orange cable that carries all tracks of a source at once, each with an id and a name.

- **Ports.** `ports.multiEventOut` (the source) and `ports.multiEventIn` (the receiver). A multi-MIDI output only fits a multi-MIDI input.
- **Source.** Give `eventBundles`: per port a function (or an object) with the tracks. Call `host.eventBundleChanged(this, portId)` when a name or the number of tracks changes.

```js
eventBundles: {
  tracks: () => ({ label: 'My sequencer', tracks: [{ id: 'a', name: 'Bass', ch: 1 }, { id: 'b', name: 'Lead', ch: 2 }] }),
},
// a note on track a:
host.emit(this, 'tracks', { type: 'note', note: 36, vel: 0.9, time, dur: 0.2, track: 'a', ch: 1 });
```

  Every event on a multi-MIDI port carries `track`: the id from the list. You may also keep sending the same events on your ordinary `eventOut` ports; the multi-MIDI cable is an extra.
- **Receiver.** `onEventBundle(portId, key, bundle)` receives `{ key, source: { id, port, name }, label, tracks: [{ id, name, ch }] }`, and `null` when the cable is removed. `ch` is 0 if the track has no channel. The events arrive in `onEvent(portId, ev)` with `track` and `bundle` (the key of the bundle).

**Controls of other devices.** For controllers (§13b). The host finds all controls on the card of another device, also in open shadow roots; that device does not have to do anything.

| Call | What |
|---|---|
| `host.controls(this, targetId)` | A list `{ key, label, type, … }`: `type` is `'range'` (with `min`, `max`, `step`, `value`, `scale`), `'select'` (with `options: [{ value, text }]`), `'check'` or `'button'`. `scale` is `'log'` for a knob from `host.ui.knob` with `{ scale: 'log' }` and otherwise `'lin'`. |
| `host.setControl(this, targetId, key, value)` | Sets the control. `value` is 0..1: a slider or knob gets that part of its range (logarithmic if `scale` is `'log'`), a list gets the option at that position, a checkbox is on from 0.5 and a button is pressed from 0.5. Returns `true` if the control is there. |

- The `key` has the form `type|name#n` and stays the same as long as the card has the same controls. Keep keys in your state, but expect them to be gone when the target device changes its UI; `setControl` then returns `false`. Ask for `controls` again on `onPeers`.
- You cannot control yourself. An unknown device or key gives `[]` or `false`.
- The user stays in charge: the control moves visibly and the user can still turn it by hand.

---

## 12. UI

- `mount(el)` receives an empty element in the card. The card is about 300 px wide by default. With `ui: { width: 200..6000, minWidth }` you get a wider card.
- The user can make every card wider, narrower, taller and shorter. So let your UI flow: auto-fit grids, `minmax(0, 1fr)`, container queries. With a fixed height the host scrolls your UI; the ports stay visible.
- **Helpers** in `host.ui`:
  - `knob(parent, label, [min, max, step], value, fmt, onchange, options?)` → `{ set(v), el, input }`; `options` (v1.8): `{ default: number, scale: 'log' }`; since v1.15 also `{ id, role, group }` (§12d)
  - `select(parent, label, [[value, text], …], value, onchange)` → a `<select>`; set `select.value = v`; since v1.15 a 6th argument `{ id, role, group }` (§12d)
  - `steps(parent, label, array16, onchange)` → `{ paint(), cursor(step) }`; keeps a reference to the array
  - `jack(this, parent, portId, dir, label)` (see §3), `noise(ctx)`, `curve(k)`
  - `adopt(el, { id, role, group, label })` and `list(this)` (v1.15, §12d)
  - `meter(parent, label, opts)` → `{ el, set(level), id, destroy() }` (v1.18, §12e)
- **Keep what `knob` and `select` return.** `setState` must update them (§13).
- Your own HTML is fine too. Use the CSS variables of the host, then your device follows the color scheme (dark, light, retro):
  - colors: `--bg --floor --card --card-2 --line --fg --muted`;
  - cable colors: `--audio --event --mod --multi`;
  - status: `--go --stop --sel`;
  - recessed areas and screens: `--well --well-fg`;
  - input fields: `--field --field-fg`;
  - fonts: `--disp --mono --lcd-font`.

  Fixed colors such as `#0b0d10` look wrong in the light scheme.
- A large UI goes in its own shadow root: `const d = document.createElement('div'); el.appendChild(d); d.attachShadow({ mode: 'open' })`. Styles and ids then stay separate per instance. CSS variables also work in a shadow root.
- Clicks in your UI must not make the card drag: put `e.stopPropagation()` on `pointerdown` in input fields that you build yourself.
- Do not use `alert`, `confirm` or `prompt`: they block the whole studio.

---

## 12a. Controls (v1.8)

The host improves every `<input type="range">` on your card, also in an **open** shadow root. You do not have to do anything for it:

- **Double-click = default value.** The default value is the value the slider has right after `mount()`, before the host calls `setState()`. So build your UI in `mount()` with the default values from `create()`. If you build a slider only later (a tab, a page), put `data-pk-default="value"` on the slider, otherwise the host cannot reset it.
- **Click the number = type.** The number next to a slider (an `<output>` or an element without children, in the same small group with exactly one slider) becomes clickable. The host itself finds the slider position that yields that number, so also with Hz/kHz, ms/s, dB, percent and logarithmic scales. Condition: you update the number **directly** in your `input` handler. If the number is somewhere else, put `data-pk-for="id-of-the-slider"` on the number.
- **Rotary knob.** If the user chooses rotary knobs, `host.ui.knob` shows a rotary knob (drag up/down, Shift = fine). With `{ scale: 'log' }` the knob turns logarithmically; with `{ default: x }`, `x` is the default value. Your own sliders stay sliders.
- If a slider has its own double-click (`ondblclick`, or "double-click" in the `title`), or has `data-pk-noreset` on it, the host stays away.
- The host sends ordinary `input` and `change` events. An `oninput` handler that reads the value is enough.
- A **closed** shadow root (`mode: 'closed'`) cannot be seen by the host. Use `mode: 'open'`.

---

## 12b. Drawing without stutter (v1.7)

Everything your UI does runs on the same thread as MIDI, the cables and the host's clock. A device that draws 60 times per second while nobody is looking makes live playing stutter. Therefore:

**The host's drawing clock.** Draw moving things (meters, scopes, cursors, animations) via `host.frame`:

```js
// in mount()
stopDrawing = host.frame(this, t => drawScope(t), 30);   // at most 30× per second
// in unmount() and destroy()
if (stopDrawing) { stopDrawing(); stopDrawing = null; }
```

- `host.frame(this, cb, fps)` calls `cb(t)` as long as your card is **visible**: not minimized, not outside the visible part of the floor, tab visible (or in the focus view). `fps` is 1–60; use 30 for meters and scopes, 60 only for smooth animation.
- It returns a function that cancels the subscription. Call it in `unmount()` and `destroy()`. The validator checks that nothing remains open after `destroy()`.
- `host.visible(this)` says whether your card is visible now, handy for work you do outside the drawing loop.
- Work that must **always** continue (sound, measuring for an automatic function, modulation via `host.modulate`) does not belong in `host.frame`: that stops when the card is out of view.
- Fallback for older hosts without `host.frame`: your own `requestAnimationFrame` loop that respects `document.hidden` and draws at most `fps` times per second.

```js
const drawLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
```

**No layout work per frame.** Asking for or setting your size every frame forces the browser to re-measure the whole page.
- Read the width of a canvas from a `ResizeObserver`, not every frame from `clientWidth`/`getBoundingClientRect()`.
- Set `canvas.style.height` once, not every frame. Only change `canvas.width/height` when the size really changed.
- Ask for CSS colors (`getComputedStyle(...).getPropertyValue('--audio')`) at most once per second, or after the window event `patchkamer-skin`, and keep them.
- Keep `canvas.getContext('2d')`; do not ask for it again every frame.

**Draw only what changes.** A waveform, grid or background that rarely changes: draw it once on a canvas of its own (not visible) and copy that every frame with `drawImage`. Update text (`textContent`) only if the value is different.

**Other.**
- No `setInterval` shorter than 30 ms for the UI.
- No `JSON.parse(JSON.stringify(...))` or `getState()` per frame.
- Send from a worklet at most 30–60 messages per second to the UI.

### Updating an existing device to v1.7

1. Find every `requestAnimationFrame` loop. Remove the rescheduling from the drawing function (`raf = requestAnimationFrame(draw)` at the end) and start the drawing function in `mount()` with `host.frame(this, draw, 30)` (with the fallback above).
2. Cancel the subscription in `unmount()` and `destroy()`.
3. Replace size and color queries per frame by a `ResizeObserver` and a color cache.
4. Raise `version`. Port ids, `id` and state stay the same, so workspaces and presets keep working.
5. `node validate-instrument.mjs file.patchkamer-device.js` gives `OK … draws via host.frame`. If it says `warning: own requestAnimationFrame`, step 1 is not finished yet.

**Quick conversion: the drawing gate (v1.8).** For a large or old device with many separate loops you may also use the standard drawing gate, instead of converting every loop. Put the block `__pkRaf` / `__pkCaf` / `__pkWrap` at the top of the file (see the library, for example `lfo`), replace `requestAnimationFrame(` with `__pkRaf(` and `cancelAnimationFrame(` with `__pkCaf(`, and write the export as `const __pkDef = { … }; export default { ...__pkWrap(__pkDef) };` (the host recognizes a device by `export default {`). A loop that starts from a method of the device (usually `mount`) then runs at full speed while the card is visible, and about 2× per second when hidden. Do not use for loops that do timing or MIDI: they do not belong in `requestAnimationFrame`.

---

## 12c. Language and audio quality (v1.11)

**Language.** `host.lang` is the user's language: `'nl'` or `'en'` (languages may be added later). It stays fixed as long as your device exists. If the user switches language, the host reloads the studio and creates your device again.

- All text the user sees, you choose on `host.lang`: labels, choice lists, messages, help texts and tooltips. If you do not know the language, use `'en'`.
- Names that the host shows itself (card title, library, port names) you give per language in the `i18n` field of the definition (§2). That field is static: it is read before `create` runs, so do not use it for texts in your UI.
- Do **not** translate: `id`, `kind`, `category`, port ids and the keys and values in your `state`. Names of presets and tunes that are in your `state` you keep language-neutral. Common music-industry terms (preset, tune, sample rate, latency, oversampling, swing) you leave in English in all languages.
- Keep the texts per language together in one table and choose from it on `host.lang`. The validator runs your device with both values of `host.lang` and reports an error in either branch.

```js
export default {
  id: 'nl.example.tremolo', name: 'Tremolo', version: '1.0.0', kind: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [] },
  i18n: { nl: { ports: { in: 'In', out: 'Uit' } } },
  create(ctx, host) {
    const T = { nl: { rate: 'Snelheid', depth: 'Diepte' }, en: { rate: 'Rate', depth: 'Depth' } }[host.lang] || { rate: 'Rate', depth: 'Depth' };
    /* … */ return { mount(el) { host.ui.knob(el, T.rate, [0.1, 20, 0.1], 4, v => v.toFixed(1) + ' Hz', v => {}); /* … */ } };
  }
};
```

**Audio quality.** `host.audio` gives the user's choice. It is read-only and stays fixed as long as your device exists (the host creates your device again if the user changes something).

| Field | Values | Meaning |
|---|---|---|
| `sampleRate` | number (Hz) | The real sample rate of the AudioContext, equal to `ctx.sampleRate` |
| `quality` | `'low'`, `'normal'`, `'high'`, `'custom'` | The chosen quality level; `'custom'` if the user adjusted individual choices |
| `oversample` | `'none'`, `'2x'`, `'4x'` | How much oversampling you may use where you cause aliasing |
| `latency` | `'interactive'`, `'balanced'`, `'playback'` | The chosen buffer size of the browser (small = low latency, larger buffer = more stable) |

- Use `oversample` where you cause aliasing yourself, for example on a `WaveShaperNode` (`shaper.oversample = host.audio.oversample`) or in your own DSP that you can run internally at a higher sample rate. If you do not, your device still works.
- Do not count on a fixed sample rate: read `ctx.sampleRate`.
- Do not change the quality yourself: the user chooses it in Settings. For information: *Normal* is `interactive`, automatic sample rate and `'2x'` (the behavior from before v1.11); *Low* is 44.1 kHz, `playback` and `'none'`; *High* is 96 kHz, `balanced` and `'4x'`.

---

## 12d. Making controls recognisable for skins (v1.15)

A skin (see `skins/`) can choose the face of a control (rotary knob, horizontal or vertical slider), its size, length and colour. For that the host must be able to **point at a control for certain**. Without it, it guesses from the label, and that is translated and changes. Everything below is **optional and additive**: a device that does nothing works as before, and an older host ignores the options and attributes.

**The three pieces of data per control**

| Data | Values | Meaning |
|---|---|---|
| `id` | text, 1 to 60 characters from `[A-Za-z0-9._-]` | Fixed address of the control. Equal to the key in `getState()` or `params()` (`cut`, `kick.tune`, `ch3.vol`), **never the label**. Unique within the device. An id does not change between versions; a new id is fine, removing one only with a new device version. |
| `role` | `param`, `fader`, `toggle`, `button`, `pad`, `step`, `display`, `select`, `meter`, `jack` | The intent of the control. Default: `param` for `host.ui.knob`, `select` for `host.ui.select`. `fader` is a long-throw control (channel volume), `param` an ordinary setting. |
| `group` | text, 1 to 60 characters from `[A-Za-z0-9._-]` | Free section name from the logical layout of your UI (`osc`, `filter`, `env`). A skin can target it (`group:filter`). |

**Three ways to give them (equivalent)**

1. Through the existing calls: `host.ui.knob(parent, label, [min, max, step], value, fmt, onchange, { id, role, group, default, scale })` (the `options` of v1.8 get three more keys) and `host.ui.select(parent, label, options, value, onchange, { id, role, group })` (new 6th argument). The return value stays `{ set, el, input }` or the `<select>`; `knob` also returns `id`.
2. With attributes on your own elements: `data-pk-id`, `data-pk-role`, `data-pk-group`. No call needed, harmless for an older host.
3. With `host.ui.adopt(el, { id, role, group, label })`: sets the attributes and registers the element; returns `el`. Only for elements with a **model**: an `input` of type range or checkbox, a `select` or a `button`. A `div` cannot.

```js
mount(el) {
  ui.cut = host.ui.knob(el, T.cut, [0, 1, 0.001], S.cut, v => Math.round(v * 100) + '%', v => { S.cut = v; apply(); }, { id: 'cut', role: 'param', group: 'filter' });
  ui.mode = host.ui.select(el, T.mode, [['lp', 'LP'], ['hp', 'HP']], S.mode, v => { S.mode = v; apply(); }, { id: 'mode', group: 'filter' });
  host.ui.adopt(mySlider, { id: 'ch1.vol', role: 'fader', group: 'ch1', label: T.vol });   // your own <input type="range">
}
```

**The register.** The host keeps per device what was registered, also when your UI rebuilds itself (a `render()` that makes new elements). `host.ui.list(this)` returns it as `[{ id, role, group, label, type, min, max, face }]` (`type`: `'range'`, `'select'`, `'check'` or `'button'`; `face`: the face the control has now). A skin maker sees the same in the table of `validate-instrument.mjs --controls` and in the *Controls* tab of the designer.

**Rules**

- A skin only chooses the **face**; value, `onchange` and `setState` run unchanged through your element. A skin cannot set a value and cannot hide a control.
- Only use ids you know as a state or parameter key. An id that differs per `host.lang` is a label and therefore wrong.
- When you migrate a device, give **all** its knobs and choices an id, not a few: a skin that names a missing id silently does nothing.
- A device that rebuilds its UI (Mixer, Control Surface) derives ids from its layout (`k1.2.3`, `ch3.vol`) and gives every control its role and group, so a skin can target by role or group.
- Sound, state and presets do not change because of ids, roles or groups. Do not change them in the same action.
- **A fixed suffix when linking to MIDI (`data-pk-suffix`).** When many controls on a card share a label (`Trim` on every channel of a mixer), put `data-pk-suffix="T3"` (text, at most 16 characters) on the control or on its enclosing element. When linking to MIDI the host puts the suffix after the visible label (`Trim - T3`). Only the label changes; the `id` (the key) stays the same. An older host ignores the attribute.

**What the validator does.** It only gives a `warning` (never an error) for: an id on two controls (only what is built in `create()`/`mount()`; a later rebuild does not count twice), some controls without an id while others have one (no ids at all = not migrated, no message), a role outside the list, an id or group outside `[A-Za-z0-9._-]{1,60}`, options that are not an object, `adopt` on an element without a model or without an element, a `data-pk-id` on an element that is not attached anywhere in the card, and ids that depend on `host.lang`. With `--controls` it then prints the table `id | role | group | label nl/en | range | face | in params()` (the label from the nl and en rounds; if they are equal it appears once; the last column says whether a continuous control is in `params()`: `yes`, `no`, `excluded`, `?` for cannot be matched and `-` for a choice, checkbox or button).

---

## 12e. Meters (v1.18)

A meter shows a level: a bar with a peak line, a row of LEDs or a round VU meter with a needle. If the device draws it itself, a skin cannot change it. So let **the host draw the meter**: `host.ui.meter` makes it and gives it the face and size the user or the skin chooses (bar, LED ladder, round VU; length and width). A VU face **replaces** the bar in the same place; it does not sit next to it. A meter only reads: it changes no sound, no state and no preset, and a skin cannot hide it, only show it differently. Everything below is **optional and additive**.

| Call | What |
|---|---|
| `host.ui.meter(parent, label, opts)` | Makes a meter in `parent` (also a shadow root) and returns `{ el, set(level), id, destroy() }`. `label` is the `aria-label` and, if the device wants, a visible label |
| `set(level)` | Only without `source`: the level, a number or `[l, r]`; call it from your own draw clock (`host.frame`). Rubbish (`NaN`, not a number) is ignored |
| `destroy()` | Removes the meter and stops measuring; may be called twice, and belongs in the `destroy()`/`unmount()` of your device |
| `el` | The meter's element (the host sets `--pk-meter-len` and `--pk-meter-wid` in px on it so your CSS can match the space) |

| Option | Values | Meaning |
|---|---|---|
| `id` | text, 1 to 60 characters from `[A-Za-z0-9._-]` | Fixed address for skins (`met.master`, `met.t1`). A meter is not a parameter: the id is **not** in `params()` and need not equal a state key, but it does not change between versions |
| `group` | text, as for controls (§12d) | Section name (`meters`) a skin can aim at |
| `source` | an `AnalyserNode`, or a list of 1 or 2 `AnalyserNode`s (left, right) | The host reads them itself (`getFloatTimeDomainData`), only while your card is in view, on the host's draw clock. It **never** creates or connects nodes: the analyser you already have is enough. Without `source` you call `set()` yourself |
| `unit` | `'linear'` (default) or `'db'` | Unit of what you give `set()`: amplitude 0 to 1 and above, or dB |
| `range` | `[minDb, maxDb]` (default `[-60, 0]`; the Mixer uses `[-60, 6]`) | The meter's dB scale |
| `kind` | `'peak'` (default) or `'rms'` | What the host takes from the analyser; `'rms'` only with `source` (over the analysis window) |
| `hold` | `true` (default) or `false` | The peak line that falls slowly |
| `clip` | a dB threshold | Above the threshold a clip lamp lights for 1.5 s. No lamp by default |
| `orientation` | `'vertical'` or `'horizontal'` | Your device's own choice; a skin can override it |
| `length`, `width` | px | The default size of the meter (length in the direction of the deflection, width as thickness). The host sets them as `--pk-meter-len` / `--pk-meter-wid` on `el` |

**The default face (`bar`)** is the Mixer's bar: a gradient from `--audio` through `--go` to `--stop`, a peak line that falls by 0.4 per 66 ms, on a `--well` background. Without a skin a migrated device looks the same and measures the same as with its own drawing: the same dB scale, the same fall. A skin can choose the face, the direction, the size, the fall (ballistics: fast, classic VU or slow), the peak line, the clip lamp, the scale and the colour. A round VU face needs at least 56 × 36 px; the host enlarges `el` for that and your layout may grow with it (a channel strip of a mixer then becomes wider). So build your layout so that a meter may become larger than its default size.

**The host does the damping and the fall.** So pass the raw level (with `source` the host reads the analyser; with `set()` you pass the measured peak or dB). Do not damp or let anything fall yourself: the signal would be slowed twice and a skin with other ballistics could no longer restore it.

**Two ways to feed it**

1. **With an analyser (`source`).** If your device already has an `AnalyserNode` for its meter (most do), pass it. This is the normal way; you draw nothing.
2. **With `set()`.** If you compute the level yourself (a gain reduction, a limiter, an internal peak), call `set(level)` from your own draw clock, with `host.frame` (§12b), at no more than 30 frames per second. There is then no `source`.

```js
mount(el) {
  // 1. with an analyser: the host reads it only while the card is visible
  const an = ctx.createAnalyser(); an.fftSize = 1024; out.connect(an);      // you create and connect the analyser, the host does not
  if (host.ui && typeof host.ui.meter === 'function') {
    ui.level = host.ui.meter(el, T.level, { id: 'met.out', group: 'meters', source: an, range: [-60, 6], clip: 0, orientation: 'vertical', length: 90, width: 8 });
  } else {
    ui.oldMeter = ownMeter(el, an);          // older host: your own drawing as before v1.18 (keep that code in a function of its own)
  }
  // 2. with set(): you compute the level yourself
  if (host.ui && typeof host.ui.meter === 'function') {
    ui.gr = host.ui.meter(el, T.reduction, { id: 'met.gr', group: 'meters', unit: 'db', range: [-24, 0], hold: false, orientation: 'horizontal' });
    ui.off = host.frame(this, () => ui.gr.set(reductionDb()), 30);          // reductionDb() returns dB, 0 or lower
  }
},
destroy() { if (ui.level) ui.level.destroy(); if (ui.gr) ui.gr.destroy(); if (ui.off) ui.off(); }
```

**Degrading for an older host.** A host without v1.18 has no `host.ui.meter`. So always check `if (!host.ui || typeof host.ui.meter !== 'function')` and then draw yourself, as you did before v1.18. Keep that old drawing in a function of its own; do not delete it. That way the same file works on every host.

**The register.** A meter is in `host.ui.list(this)` with `role: 'meter'`, `type: 'meter'`, `min` and `max` from `range`, and `face` = the face it has now (`bar`, `ledladder` or `vu`). `id`, `group` and `label` are those of the call. The attribute path (`data-pk-role="meter"` on an element you draw yourself) is **not** supported: a meter needs the host's face, so use the call.

**Shadow root.** `parent` may sit in a shadow root (a device that builds with `attachShadow`). The host puts its meter CSS in the root of `parent` (`getRootNode()`), as it does for knobs; you need not copy anything.

**Rules**

- Make one call per meter, in `mount()` or in your own `render()`; call the meter's `destroy()` when you remove or rebuild it.
- A meter is not a control: no coverage rule, not in `params()`, not in `getState()`. Sound, state and presets do not change because of a meter.
- Do not create or connect nodes for the host. The `AnalyserNode`s your device already has are enough; a new analyser in the audio path is a change to your device, not to the meter.
- A guard against a broken analyser (silence or `NaN` at an output) stays yours; the host only reads.

**What the validator does.** The fake host knows `host.ui.meter`. A `source` that is not an `AnalyserNode` (or a list of 1 or 2) **throws** and is therefore an error. A `warning` (never an error) comes for: a meter id already used by another control, an invalid id or group, options that are not an object, an invalid `range`, `unit`, `kind`, `hold`, `clip`, `orientation`, `length` or `width`, `kind: 'rms'` without `source`, a `set()` with anything but a finite number or `[l, r]`, `data-pk-role="meter"` on your own element (or `host.ui.adopt` with role `meter`) and a `data-pk-suffix` of more than 16 characters. A `host.ui.meter` without `source` and without `set()` it cannot see. The OK line mentions the number of meters and `--controls` shows them in the table with role `meter`.

---

## 13. State, versions and presets (v1.6)

**State.** `getState()` returns everything needed to restore the sound and the behavior exactly: knobs, patterns and choices. The result must be plain JSON, without AudioNodes.
- `setState(s)` receives that later: when loading, at a version switch and with a preset.
- You ignore unknown fields; missing fields get a default value. `setState({})` must work.
- `setState(getState())` must produce exactly the same state.

**The knobs follow.** The host also uses `setState` for presets, while your UI is already on screen. So in `setState` update the sound and your UI:

```js
setState(s) {
  /* ... normalize state ... */
  apply();                                   // sound
  ui.rate.set(S.rate);                       // knobs from host.ui.knob
  ui.shape.value = S.shape;                  // choices from host.ui.select
  rows.kick.paint();                         // steps from host.ui.steps (replace the array in place!)
}
```

- The validator checks this for everything you make with `host.ui.knob` and `host.ui.select`: after `setState(getState())` each of them must be updated. A complete rebuild of your UI in `setState` also counts.
- With `host.ui.steps`: replace the contents of the array with `splice`, not the array itself. The step row keeps a reference to the original array.

**`getPreset` / `setPreset`.** If something in your state does *not* belong in a preset, implement both:
- `getPreset()` returns a copy of your state without those fields;
- `setPreset(p)` restores only the other fields and leaves the rest in place.

Use it for:
- **routing and source choices**: which bundle channel is on which channel (mixer, multitrack);
- **running positions**: where a slow movement is now (Drift · the modulator does not keep its clock position in a preset);
- **data of this session**: recordings, names of takes.

Without these two functions the host uses `getState`/`setState`. Also `setPreset(getPreset())` must produce the same preset, and `setPreset({})` must not throw.

**Preset files.** The host saves presets in preset libraries. You can export them as `.patchkamer-presets.json`:

```json
{ "format": "patchkamer-presets", "formatVersion": 1, "name": "Starter presets",
  "presets": [ { "name": "Acid bass", "device": "nl.patchkamer.mono", "version": "1.2.0", "state": { "cut": 320, "res": 16 } } ] }
```

`state` is exactly what `getPreset()` (or otherwise `getState()`) returns. A preset from an older version simply goes to your current `setState`/`setPreset`. Another reason to accept old state.

---

## 13b. Control: seeing other devices and laying cables (v1.7)

For controllers (such as a MIDI device that couples pads to devices). Ordinary instruments and effects do not need this.

| Call | What |
|---|---|
| `host.peers(this)` | List of the other devices on the floor: `{ id, name, def, version, kind, category, eventIn:[{id,name}], mod, selected, noteNames:[{note,name}] }`. Read-only. `mod` = has a Mod input; `selected` = last clicked. |
| `onPeers(list)` | Optional on your instance: the host calls this when devices are added, removed, selected or when cables change. |
| `host.connect(this, ownOutput, targetId, targetInput, kind)` | Lays an ordinary, visible cable from **your own** output to an input of another device. `kind` = `'event'`, `'mod'` or `'audio'`. Returns `true` if the cable is there. |
| `host.disconnect(this, ownOutput?, targetId?, targetInput?)` | Removes cables that leave **your** outputs (filters are optional). Returns the number. |
| `host.cablesFrom(this, ownOutput?)` | The cables from your outputs: `[{ port, to, toPort, kind }]`. Use this to see whether the user has detached a cable. |

- You can only lay or remove cables from your own outputs; the host refuses the rest.
- The user stays in charge: he can detach every cable himself. Show that in your UI ("cable detached") instead of quietly laying it again.
- Keep in your state **which device id** you coupled to. The workspace keeps the cables themselves; do not lay them again when loading.
- Do not give `onPeers` heavy work: it can come a few times per second.

**Note names (v1.14).** A device whose notes have names (a drum machine: 36 = bass drum, 38 = snare, etc.) can show them to sequencers.

| Call | What |
|---|---|
| `noteNames()` | Optional on your instance. Returns a list `[{ note: 0..127, name: 'Snare' }]` in the order in which your device shows its sounds. At most 128 items, `name` at most 40 characters; the host skips invalid items. Return only the sounds that have a note right now |
| `host.noteNamesChanged(this)` | Call this when the list changes (another kit, another order, another note, a tune loaded). The host tells the other devices through `onPeers` |
| `host.ui.knob(…, { id, role, group })`, `host.ui.select(…, { id, role, group })` | v1.15 | Make a control recognisable for skins (§12d) |
| `host.ui.adopt(el, { id, role, group, label })` | v1.15 | Register your own element as a control; returns `el` (§12d) |
| `host.ui.list(this)` | v1.15 | The register: `[{ id, role, group, label, type, min, max, face }]` (§12d) |
| `data-pk-id`, `data-pk-role`, `data-pk-group` | v1.15 | The same data as attributes on your own elements (§12d) |
| `host.ui.meter(parent, label, opts)` | v1.18 | Have the host draw a meter (bar, LED ladder or round VU, chosen by a skin); returns `{ el, set, id, destroy }` (§12e) |
| `data-pk-suffix` | v1.18 | Text (at most 16 characters) the host puts after the label when linking to MIDI: ` - suffix` (§12d) |
| `peers[].noteNames` | In the list from `host.peers(this)`: the cleaned list of that device, or `[]` if it has none |

- A sequencer or controller finds its target with `host.cablesFrom(this, ownOutput)` and looks the `id` up in `host.peers(this)`. Without a cable or without a list it behaves as always.
- `noteNames()` must not throw and must be light: the host calls it on every `peers` request. Call `host.noteNamesChanged` only when the list really differs (compare with the previous one).

**MIDI and timing.** If you use Web MIDI (only after a click, without sysex), do not schedule notes at "now" but via the timestamp of the message. Then every key press gets the same small delay, even if the page is busy for a moment:

```js
const o = ctx.getOutputTimestamp();   // { contextTime, performanceTime }
const t = Math.max(ctx.currentTime, o.contextTime + (midiEvent.timeStamp - o.performanceTime) / 1000 + 0.012);
```

**Latency.** The host chooses the latency of the AudioContext (Low / Balanced / Stable, in Settings → Audio, together with the sample rate and the quality level, §12c). Never create your own AudioContext; use `ctx` from `create`.

---

## 13c. Tunes, presets, songs, licenses and instruments (v1.9)

**Tunes and presets.** For you as a builder they work the same: the host uses `getPreset`/`setPreset` (or `getState`/`setState`) as in §13. A device with `kind: 'instrument'` gets tunes, all others get presets (§0). The host saves them in libraries that belong to one device id, with folders within folders. Each instance gets its own copy when loading. So never change your `id` or your `kind`: your users' tunes and presets hang on them.

**Pack**, for sharing; in a library folder or on GitHub it loads automatically. A tune pack is called `name.patchkamer-tunes.json` (`"format": "patchkamer-tunes"`, `formatVersion` 1), a preset pack `name.patchkamer-presets.json` (`"format": "patchkamer-presets"`, `formatVersion` 2, otherwise the same):

```json
{ "format": "patchkamer-tunes", "formatVersion": 1, "device": "nl.yourname.device", "name": "Trance basics",
  "author": "…", "license": "CC-BY-4.0", "description": "…",
  "tree": [ { "folder": "Leads", "items": [ { "name": "Uplifting", "kind": "set", "version": "1.0.0", "state": { } } ] },
            { "name": "Deep kick", "kind": "part", "part": "kick", "author": "…", "license": "LicenseRef-All-Rights-Reserved", "state": { } } ] }
```

**Tags (v1.19, optional).** A tune or preset may have `tags`, and so may a folder or the whole pack; what is on a folder or the pack applies to everything below it. The host builds a tree from them on the Tunes and Presets tabs (**By instrument** and **By style**, indented), so a guitar or a jungle sound can be found without knowing which device it belongs to. A tag is a path of lowercase letters, digits and hyphens, separated by `/` (at most 4 levels, 60 characters, 12 tags per node): `instrument/guitar/acoustic`, `style/hiphop`. An invalid tag is ignored. The root is `instrument` (tunes only) or `style`; the host shows a tune at the deepest tag of each branch. Standard names, translated by the host (other names are allowed and shown with a capital): instruments `keys`, `piano` (`acoustic`, `electric`, `toy`, `harpsichord`), `organ`, `mallet` (`vibes`, `marimba`, `bell`), `guitar` (`acoustic`, `nylon`, `steel`, `electric`), `plucked` (`harp`, `koto`, `lute`), `bass` (`sub`, `pluck`, `synth`, `acid`), `strings` (`violin`, `cello`, `ensemble`, `pizzicato`), `brass` (`trumpet`, `trombone`, `section`), `woodwind` (`flute`, `clarinet`, `oboe`, `sax`), `voice` (`choir`), `lead`, `pad`, `pluck`, `drums` (`kit`, `kick`, `snare`, `hat`, `tom`, `cymbal`), `percussion`, `fx` (`riser`, `impact`), `chords`, `texture`, `drone`; styles `ambient`, `dark-ambient`, `cinematic`, `film-score`, `neo-classical`, `synthwave`, `techno`, `dub-techno`, `trance`, `electro`, `house`, `deep-house`, `pop`, `lofi`, `hiphop`, `trap`, `drum-and-bass`, `jungle`, `breakbeat`, `big-room`, `acid`, `dub`, `dubstep`, `funk`, `disco`, `soul`, `jazz`, `ballad`, `rock`, `garage`, `future-bass`, `glitch`, `noise`, `minimal`, `industrial`, `chiptune`, `sci-fi`, `experimental`, `hardstyle`, `eurodance`, `folk`, `world`, `flamenco`, `metallic`, `generative`, `meditation`, `horror`, `bass-music`.

```json
{ "format": "patchkamer-tunes", "formatVersion": 1, "device": "nl.yourname.string", "name": "Strings",
  "tags": ["instrument/plucked"],
  "tree": [ { "folder": "Folk", "tags": ["style/folk"], "items": [ { "name": "Open Guitar", "kind": "set", "tags": ["instrument/guitar"], "state": { } } ] } ] }
```

**Licenses.** Every tune, preset and song has a field `license` with an [SPDX](https://spdx.org/licenses/) code, and usually `author`. In Patchkamer the author chooses when saving between `CC-BY-4.0` (free to use with attribution) or `LicenseRef-All-Rights-Reserved` (all rights reserved). Other valid SPDX codes from files are shown and kept. At library level `license` is the default for new items. If a tune or song was made on the basis of someone else's, the host keeps that in `basedOn: { name|title, author, license }`. The host shows the license when loading or opening.

**Song** (`name.patchkamer-song.json`), an export of a workspace:

```json
{ "format": "patchkamer-song", "formatVersion": 1, "title": "Night flight", "author": "…", "license": "CC-BY-4.0",
  "description": "…", "created": "2026-11-04T…", "patchkamer": "1.14",
  "workspace": { "format": "patchkamer-werkruimte", "formatVersion": 1, "defs": [ { "id": "…", "version": "…", "code": "…" } ],
                 "devices": [ ], "cables": [ ], "bpm": 126 } }
```

`workspace` is an ordinary workspace, always with the code of all devices (`defs[].code`), so the song also works for someone who does not have your library. For you as a builder this means: what is in `getState()` determines whether a song sounds exactly the same for someone else.

`state` of a tune or preset (`kind: 'set'`) is exactly what `getPreset()` (or `getState()`) returns; of an instrument tune (`kind: 'part'`) what `getPart(id)` returns. Old preset files (`formatVersion` 1, with a list `presets`) keep working.

**Instruments** (optional, for drum machines and other devices with separate sounds). Give the instance three methods:

| Method | What |
|---|---|
| `parts()` | `[{ id, name, type }]`: one line per instrument. `type` is a short kind name (`'kick'`, `'snare'`, `'closedhat'`…); the host puts tunes of the same kind at the top. |
| `getPart(id)` | A JSON copy of the **sound** of that instrument: no pattern, no mute/solo, no routing. |
| `setPart(id, data)` | Sets that sound on that instrument, even if `data` comes from another instrument. Update the knobs, just like `setState`. You ignore unknown fields. |

Rules: `setPart(id, getPart(id))` leaves the setting unchanged, and `setPart(a, getPart(b))` changes only instrument `a`. If your device has the sound per pattern (such as Takt Twaalf), `getPart`/`setPart` work on the active pattern. A ready-made layer that does this via `getPreset`/`setPreset` is in the library (`__pkPartsWrap`, for example in Slagwerk).

---

## 13d. Clipboard: copying and pasting patterns and clips (v1.17)

For devices that have a pattern or a clip (sequencers, drum machines). Optional: without these methods your device does not take part and nothing changes. The host puts **Copy** and **Paste** buttons in the card bar (and knows Ctrl/Cmd+C and Ctrl/Cmd+V on the selected device) and does all the translating between devices; **your device only supplies and accepts**. So a device contains no translation logic.

| Call | What |
|---|---|
| `clipInfo()` | Light, does not throw, changes nothing. Returns `null` (nothing to copy or paste right now) or an object that describes what the device can do **now** with its current pattern. Dynamic: the answer depends on selection and cabling (a keys lane or a drum lane, a connected drum machine). The host calls it often |
| `getClip()` | A JSON copy of the current pattern as `patchkamer-clip` (see below), or `null`. No side effects. A generator (Euclidean, random walk) may return a snapshot of what it plays now |
| `setClip(clip)` | Puts the clip (already adapted and sanitised by the host) on the current pattern. Returns `{ ok: true }` or `{ ok: false, reason }` (`reason` is text in the language of `host.lang`, for the message to the user). Never throws, sets nothing halfway, clamps all values again itself, updates the UI like `setState`, and sends **no** events itself |

`clipInfo`, `getClip` and `setClip` belong together: all three or none. The validator says so when one is missing.

**The `patchkamer-clip` format (JSON, `formatVersion` 1).** Time is in whole **ticks**: 12 ticks per sixteenth, so 192 per bar. That is exact for 1/16, 1/32, 1/64 and the three triplet grids, without fractions.

```json
{ "format": "patchkamer-clip", "formatVersion": 1,
  "kind": "notes",
  "name": "Bass A",
  "length": 192,
  "grid": 16,
  "source": { "device": "nl.patchkamer.seq", "name": "Step Sequencer", "version": "1.17.0", "trackType": "notes", "scheme": "gm" },
  "swing": 0,
  "notes": [ { "t": 0, "n": 45, "len": 12, "vel": 0.9, "acc": true, "prob": 1, "ratchet": 1 } ],
  "native": { "device": "nl.patchkamer.seq", "data": { } } }
```

A clip with `kind: "drums"` has two fields instead of `notes`:

```json
{ "format": "patchkamer-clip", "formatVersion": 1, "kind": "drums", "length": 192,
  "lanes": [ { "id": "kick", "name": "Kick", "type": "kick", "note": 36, "length": 192 } ],
  "hits":  [ { "t": 0, "lane": 0, "vel": 0.9, "acc": true, "prob": 1, "ratchet": 1 } ] }
```

| Field | Meaning and rules |
|---|---|
| `format`, `formatVersion` | Required: `"patchkamer-clip"` and `1`. A newer `formatVersion` or an unknown `kind` is refused by the reader; unknown fields are ignored |
| `kind` | `"notes"` (pitches, polyphonic or mono) or `"drums"` (lanes with a hit). A chord lane is simply several notes at the same place |
| `name` | Optional, text. The host shows it with `textContent` and cuts it at 40 characters |
| `length` | Required: length of the clip in ticks, an integer from 1 to 12288 (64 bars) |
| `grid` | Optional: 16, 32 or 64, the grid hint of the source (only for the target's editor) |
| `source` | Optional: who made the clip (`device` = `id`, `name`, `version`, `trackType` for a lane with a type, `scheme` is `"gm"` or `"device"`). Information for the message and for aligning lanes only |
| `swing` | Optional: clip swing, 0 to 0.5 sixteenths; receivers without swing ignore it |
| `notes[].t` | Start tick, an integer from 0 to `length`−1. Micro-timing (a step's offset) is folded into `t` |
| `notes[].n` | MIDI note number, an integer from 0 to 127 |
| `notes[].len` | Length in ticks, at least 1 (`hits` have no length) |
| `vel` | 0.01 to 1, default 0.8 |
| `acc` | Optional, `true` if the source has an accent; `vel` is then also 1. A receiver with an accent uses `acc` or `vel` ≥ 0.9; a receiver without an accent uses only `vel` |
| `prob`, `ratchet` | Optional (default 1). A receiver that does not know them leaves them out and the host says so |
| `lanes` | `drums` only: at most 64 lanes `{ id, name, type, note, length }`. `type` is the canonical instrument (like `parts()[].type`, §13c) or empty; `note` is the lane's note number; `length` only for polymeter (the clip is then as long as the longest lane) |
| `hits[]` | `drums` only: `t` as with notes, `lane` is the index in `lanes` (0 to count−1), plus `vel`, `acc`, `prob`, `ratchet` |
| `native` | Optional: device-specific extras `{ device, data }`. The host passes them only to a device with the same `id` (`device`); every other device ignores them. Pasting between two copies of the same device is then lossless |

Current pitches are copied **as stored**: the transposition of a lane (octave, `transpose`) belongs to the lane and not to the pattern.

**Limits.** `length` 1 to 12288 ticks; at most 4096 notes or hits; at most 64 lanes; `name` at most 40 characters; the whole clipboard (the JSON text) at most 1 MB. The host keeps to these limits when reading and writing; keep to them in `getClip` and clamp them in `setClip`.

**`clipInfo()` returns** (all fields except `copy` and `paste` optional):

| Field | Meaning |
|---|---|
| `name` | What your device calls the current pattern ("Lane 2 · Bass, clip 3") |
| `copy`, `paste` | Lists with `"notes"` and/or `"drums"`: what you can give now (`getClip`) and what you can receive now (`setClip`). A generator without a step list returns `paste: []`. The kind depends on the device (on a lane type where the lane decides) and can differ from moment to moment |
| `length` | `{ min, max, step, current, shared }` in ticks: how long the pattern may be. `shared: true` if the length applies to all patterns of the device: the host then adapts the clip to the device's length and does not change the length |
| `grid` | List of grids the device can handle (16, 32, 64) |
| `poly` | How many notes at once (1 = mono) |
| `range` | `[lowest, highest]` MIDI note the device can do |
| `scheme` | `"gm"` (note numbers per General MIDI) or `"device"` (own numbering: align on `type` or name, not on number) |
| `vel`, `prob`, `ratchet` | What velocity can do (`"continuous"`, `"accent"` or `"binary"`) and whether `prob` and `ratchet` exist |
| `lanes` | For drums: `[{ id, name, type, note }]`, the lanes of the target |
| `maxEvents` | How many notes or hits fit in the pattern |

**What the host does (short).**

- Copying puts the clip in the host's memory and as JSON text on the system clipboard; pasting reads the system clipboard first and falls back on the memory. One pattern or clip at a time.
- Only between devices of the same kind: `notes` to `notes`, `drums` to `drums`. With a difference in kind the host does nothing and says why. It **never** changes the type of a lane itself.
- Before `setClip` the host sanitises the clip strictly (ranges, counts, unknown fields removed) and adapts it to the target based on `clipInfo()`: the target keeps its own length (a short clip is repeated if the length is a multiple, otherwise silence follows; a long one is cut), notes go to the nearest grid point, a mono target keeps the loudest note, notes outside `range` are folded in per octave. Drum lanes are aligned on `native.device`, then `type`, then name, and by note number only with `"gm"` on both sides; what does not fit is left out and reported. Never by order and never an automatic transposition.
- While the clock runs the host pastes at the start of the next bar by default (with Cancel); Ctrl+Shift+V pastes immediately.
- The host undoes with `getState()` before and `setState()` after pasting. That is why `getState`/`setState` must be exact (§13); an own history is not needed.

**Rules for devices.**

1. All three methods or none. Only a device with a real pattern takes part; if your device only sends chords or an arpeggio without a step list, `getClip` may return a snapshot and `clipInfo().paste` returns an empty list.
2. `clipInfo()` is light, does not throw and does not change the state. Return `null` when there is nothing now.
3. `getClip()` returns JSON without AudioNodes, with a valid `kind`, a `length` of 1 to 12288 ticks, notes and hits within range and within the counts above, or `null`. It is a copy: what the host does with it does not touch your state.
4. `setClip(clip)` is the **only** writer: clamp and sanitise everything yourself, even though the host already did (a device in a song can get a clip from elsewhere). Ignore unknown fields, invalid values to the default or drop the note, never `NaN` or `Infinity` in the state. With `ok: false` the state stays exactly as it was.
5. `setClip(getClip())` leaves `getState()` unchanged (like `setPart(id, getPart(id))` and `setPreset(getPreset())`).
6. `setClip` updates the UI like `setState` (all knobs, step rows and the piano roll) and sends no events itself; only the clock makes sound.
7. With `ok: false` always give a `reason` in the language of `host.lang`.
8. A clip does not have to fit the current lane: prefer `ok: false` with a clear reason over silently doing something else.

**Safety.** The clipboard is untrusted input: anyone can put text on it. The host sanitises strictly, but your `setClip` trusts nothing: check every number, every type and every length; never evaluate text from a clip; set names only with `textContent` (never `innerHTML`); read `native` only if `native.device` equals your `id`; and build no unbounded lists (at most 4096 notes or hits, 64 lanes).

---

## 13e. Samples (v1.20)

A **sample** is a piece of sound (a drum loop, a stab, a single hit) in a **sample pack**, `name.patchkamer-samples.json`. The host shows them on the **Samples** tab of the library, by style or by pack, lets you listen to them and loads them into a device that makes sound from them (the Loop Slicer, the Samplebank). A sample pack carries the sound itself, as base64, so it stays one file that works anywhere (GitHub, a folder, dropped on the floor).

```json
{ "format": "patchkamer-samples", "formatVersion": 1, "name": "Jungle loops", "author": "…", "license": "CC0-1.0",
  "description": "…", "tags": ["style/jungle"],
  "tree": [ { "folder": "Rollers", "tags": ["style/drum-and-bass"],
              "items": [ { "name": "Rolling Ghost Break", "bpm": 170, "bars": 2, "tags": ["style/jungle"],
                           "author": "…", "license": "CC0-1.0",
                           "audio": { "format": "wav", "data": "<base64>" } } ] } ] }
```

| Field | Rules |
|---|---|
| `format`, `formatVersion` | `"patchkamer-samples"` and `1`; the host refuses a higher `formatVersion` with a message |
| `tree` | folders (`folder`, `items`, may be nested) and samples; whatever is not valid is skipped |
| `name` | at most 80 characters |
| `audio` | `format` is `wav`, `mp3`, `ogg` or `flac` (what the browser's `decodeAudioData` reads), `data` is base64; a file is at most 50 MiB |
| `bpm`, `bars` | optional: the tempo (20 to 400) and the length in bars (0.25 to 64). A loop that repeats seamlessly has both |
| `tags` | as for tunes (§13c): paths such as `style/jungle`; on the pack, a folder or the sample itself. Samples use the root `style` |
| `author`, `license` | as for tunes (SPDX; CC0-1.0 for your own samples). Samples from someone else stay theirs: add the maker's license |

**Samples from someone else's recording** (a well-known break, a piece of a song) are protected by copyright. Only put them in a pack if you own the rights or the license allows it.

**For devices (optional).** A device that can load audio gives the instance `loadAudio(files, info)`: `files` is a list of `File` objects, as the user would choose them; `info` is `{ name, bpm, bars }` (all optional). The method does the same as your own Choose file button, returns a promise and reports errors in the card. The host calls it when the user clicks → *device*; a device without `loadAudio` gets no sample and the host says so. The Loop Slicer loads the first file; the Samplebank loads them from the selected pad.

---

## 13f. Recording and playing settings (v1.21)

For sequencers and controllers that record the settings of another device while the user turns them (or a modulator moves them) and play them back exactly. The target device does not have to do anything: the host reads and sets the controls itself.

**What takes part.** Only sliders and rotary knobs (`<input type="range">`, also `host.ui.knob`) with an `id` (§12d) that are also in `params()` (§8), so the controls that Drift, LFO and MSEG work on. Selects, checkboxes and buttons do not take part. A value is always a number from 0 to 1: the part of the control's range, logarithmic for `scale: 'log'`.

| Call | What |
|---|---|
| `host.watchParams(this, targetId, fn)` | Reports every change of a control of the target to `fn(paramId, value, by)`. `by` is `'user'` (someone turns or types), `'seq'` (another sequencer set it with `setParam`) or `'mod'` (a modulator; `value` is then the effective value: knob position plus modulation, limited to 0..1). One `fn` per caller per target; a new one replaces the old one. `fn` equal to `null` stops following. Returns `true` if the target exists and is not you, otherwise `false`. |
| `host.setParam(this, targetId, paramId, value)` | Sets the control visibly (it moves on the card), to `value` from 0 to 1, rounded to the step of the control. Returns `true` if it was set, `false` for an unknown target or id, a control that is not a slider, a disabled control or a value that is not a number. A value outside 0..1 is limited. You do not get the change back through `watchParams`; other followers get `by: 'seq'`. |
| `host.lockParams(this, targetId, ids)` | While the lock exists, the target ignores modulation on these `paramId`s, the fast kind too (§9: `host.modSignal` then returns `false` and the modulator falls back to `host.modulate`, which is also ignored for these ids). `ids` is a list; a second call replaces your previous list; `null` or `[]` removes your lock. Returns `true` if the target exists and is not you. |
| `host.paramsOf(this, targetId)` | The parameter list of the target, from its `params()`: `[{ id, name, lane, laneName, min, max, scale, value }]` (at most 256). `value` is the knob position from 0 to 1, or `null` if there is no slider or rotary knob with this `id` (you cannot record or set that parameter). `[]` for an unknown target, yourself or a target without `params()`. Meant for a view with a line per control. |

- **Calls come from you.** The host calls `fn` on the main thread, often: a turn gives many reports per second, and a modulator on every update it sends (about 20 to 30 times per second per modulator). Thin them out before you store them.
- **Fast control** (§9, audio rate) is not reported. Only what goes through `host.modulate` arrives as `'mod'`.
- **Cleaning up.** If the target or you disappear, following stops and your lock lapses. Release a lock yourself when you stop playing (`lockParams(this, targetId, null)`), otherwise the modulation stays off.
- **The user stays in charge.** A control that you set can simply be turned by the user; you see that as `by: 'user'`.
- **Smooth transitions.** `setParam` jumps to the value. Call it per tick (and send in-between values for a gliding line); the host commits the final change 200 ms after the last call.

Recommended behaviour for a sequencer that uses this:

1. **Record as latch.** A reported value stays until the next change; store the line per control as points (time, value) and leave the rest of the recording (notes, drums, chords) alone.
2. **Play.** On every tick set the value on the line with `setParam`. A user who turns a control during playback wins until they let go or the recording takes over.
3. **Who plays the settings.** Let the user choose per song: the sequencer plays them exactly (set `lockParams` on the controls that have a line) or the modulators may steer on top (no lock, the line is the base position). A recording made with a modulator active stores the effective value (`'mod'`) and fits the exact mode.
4. **Nothing by itself.** Loading, restoring or opening a song sets no lock and sets no control; that only happens when the transport runs.

```js
// record
host.watchParams(this, targetId, (id, value, by) => { if (recording) points[id].push({ t: now(), v: value }); });
// play, exact: modulation on these controls off
host.lockParams(this, targetId, ['cutoff', 'res']);
host.setParam(this, targetId, 'cutoff', 0.62);
// stop
host.lockParams(this, targetId, null); host.watchParams(this, targetId, null);
```

A device that is only a target does nothing: the coverage of `params()` (§8, v1.16) decides which controls a sequencer can record.

## 14. Host API at a glance

| Call | Since | What |
|---|---|---|
| `host.bpm`, `host.swing`, `host.stepDur()` | v1.0 | Current tempo, swing, duration of a sixteenth in seconds |
| `host.emit(this, port, ev)` | v1.0 | Send an event (§6) |
| `host.setTempo(bpm)` | v1.0 | Suggest a tempo, only after a click |
| `host.ui.knob / select / steps / noise / curve` | v1.0 | UI helpers (§12) |
| `host.setPorts(this, ports)` | v1.2 | Replace ports (§3) |
| `host.ui.jack(this, parent, port, dir, label)` | v1.2 | Port in your own UI (§3) |
| `host.modulate(this, targetId, offsets)` | v1.3 | Control, slow (§8) |
| `host.paramsChanged(this)` | v1.3 | Your parameter list has changed |
| `host.modSignal(this, targetId, paramId, node)` | v1.4 | Control, fast; `true`/`false` (§9) |
| `host.loadWorklet(name, code)` | v1.4 | Load an AudioWorklet; Promise (§10) |
| `host.saveFile(fileName, data)` | — | Give a file to the user (string or Blob); returns `'saved'` or `'declined'` |
| `host.bundleChanged(this, port)` | v1.5 | Your bundle has changed (§11) |
| `host.isWired(this, port, dir)` | v1.5 | Is this own port wired? |
| `host.ui.knob(…, options)` | v1.8 | `{ default, scale: 'log' }`; rotary knob if the user chooses so (§12a) |
| `data-pk-default`, `data-pk-noreset`, `data-pk-for` | v1.8 | Hints on your own sliders and numbers (§12a) |
| `parts()`, `getPart(id)`, `setPart(id, data)` | v1.9 | Instruments for tunes per instrument, optional (§13c) |
| `loadAudio(files, info)` | v1.20 | Load a sample from the library, like Choose file; optional (§13e) |
| `host.tunes.list / apply / save / applyPart` | v1.9 | Tunes and presets without UI (for tests and controllers); `host.presets` is the same |
| `host.frame(this, cb, fps)` | v1.7 | Draw on the host's clock, only if your card is visible; returns a cancel function (§12b) |
| `host.visible(this)` | v1.7 | Is your card visible now? |
| `host.lang` | v1.11 | The user's language: `'nl'` or `'en'`; fixed as long as your device exists (§12c) |
| `host.audio` | v1.11 | `{ sampleRate, quality, oversample, latency }`: the user's audio choice, read-only (§12c) |
| `host.peers(this)`, `onPeers(list)` | v1.7 | See other devices (read-only) (§13b) |
| `host.connect / disconnect / cablesFrom` | v1.7 | Lay, remove and query cables from your own outputs (§13b) |
| `host.mastering(this, action, options)` | v1.12 | A Master Director directs the devices on its mastering cables (§11b) |
| `host.eventBundleChanged(this, port)` | v1.13 | The tracks of your multi-MIDI port have changed (§11c) |
| `host.controls(this, targetId)` | v1.13 | The controls on the card of another device (§11c) |
| `host.setControl(this, targetId, key, value)` | v1.13 | Set a control of another device, value 0..1 (§11c) |
| `host.watchParams(this, targetId, fn)` | v1.21 | Follow changes of the controls of another device, also those of modulation; `fn(paramId, value, by)` (§13f) |
| `host.setParam(this, targetId, paramId, value)` | v1.21 | Set a control (from `params()`) of another device visibly, value 0..1 (§13f) |
| `host.lockParams(this, targetId, ids)` | v1.21 | Ignore modulation on these controls of another device; `null` removes the lock (§13f) |
| `host.paramsOf(this, targetId)` | v1.21 | The parameter list of another device with the knob position of every control (§13f) |
| `host.noteNamesChanged(this)` | v1.14 | Your `noteNames()` changed; other devices hear it through `onPeers` (§13b) |
| `clipInfo()`, `getClip()`, `setClip(clip)` | v1.17 | Copy and paste patterns and clips, optional and all three together; format `patchkamer-clip` (§13d) |
| `host.ui.meter(parent, label, opts)` | v1.18 | Have the host draw a meter (bar, LED ladder or round VU, chosen by a skin); returns `{ el, set, id, destroy }` (§12e) |
| `data-pk-suffix` | v1.18 | Text (at most 16 characters) the host puts after the label when linking to MIDI: ` - suffix` (§12d) |

Use nothing else of the host. What is not listed here may change without notice.

---

## 15. Hygiene

- `destroy()` stops oscillators and sources, disconnects your nodes (`disconnect()`), stops timers, animations and subscriptions on `host.frame`, and disconnects bundle channels that you connected. Calling `destroy()` twice must not throw.
- No global variables. Multiple instances of your device must be able to exist side by side. If you deliberately want to share between instances, such as the groups of Drift, do that in a variable at module level and clean it up.
- No browser storage (`localStorage`, `sessionStorage`, `indexedDB`): state goes via `getState`/`setState`.
- No network (`fetch`, `XMLHttpRequest`, `WebSocket`), no `import`, no own AudioContext.
- Do not throw errors from `onStep`, `onEvent`, `onBundle` or `modulate`.

---

## 16. A library

A library is a folder (local, on GitHub or at a web address) with modules and a `patchkamer.json`:

```json
{
  "name": "Patchkamer library",
  "version": "1.0.0",
  "modules": ["instruments/my-synth.patchkamer-device.js", "effects/my-effect.patchkamer-device.js"],
  "workspaces": [{ "name": "Starting point", "path": "workspaces/start.patchkamer.json" }],
  "presets": [{ "name": "Starter presets", "path": "presets/starter.patchkamer-presets.json" }]
}
```

- Patchkamer only loads the modules listed in `modules`.
- Workspaces (`*.patchkamer.json`) and preset libraries (`*.patchkamer-presets.json`) are optional. Preset libraries from a library are read-only; the user can make a copy.
- Without `patchkamer.json`, Patchkamer itself looks for `*.patchkamer-device.js`, `*.patchkamer.json`, `*.patchkamer-presets.json` and `*.patchkamer-tunes.json`. Other `.js` files in the folder, such as helper scripts, are then ignored. Modules listed in `patchkamer.json` may have any file name.
- If you change an existing device: raise `version` and keep `id`, port ids and file name the same. Then saved workspaces and presets find it again.

---

## 17. The validator

```
node validate-instrument.mjs my-device.patchkamer-device.js
node validate-instrument.mjs my-device.patchkamer-device.js --lang en   # output in English (default Dutch)
node validate-instrument.mjs my-device.patchkamer-device.js --controls  # also print the table of controls and meters (v1.15, v1.18)
node validate-instrument.mjs my-device.patchkamer-device.js --clip      # also show the output of clipInfo() and getClip() (v1.17)
```

The validator loads your module with a fake AudioContext, a fake DOM (with shadow roots) and a fake host. It ends with one `OK` line (exit 0) or with the first error (exit 1). It checks:

1. **File**: file name `*.patchkamer-device.js` (any other name gives a warning, not an error); default export with `id` (reverse-DNS), `name`, `version` (semver), `kind`, `ports`, `create`; valid `category` and `ui`; no `ctx.destination` (except for `output`), no browser storage, no network, no imports, no own AudioContext.
2. **Ports**: all twelve lists, valid and unique ids, an AudioNode per audio port, `setPorts` with nodes ready, `jack` only for existing ports, `ui.jacks` only together with at least one `jack`.
3. **Life cycle**: `create` → `getState` before `mount` → `mount` → two bars of `onStep` → every event type plus an unknown type → `onTransport` → `getState`/`setState` round → `setState({})` → `destroy` twice; `emit` only on own `eventOut` ports.
4. **Modulation (v1.3)**: `params` and `modulate` together; valid parameter list; `modulate` with +1, −1, 0.37, unknown ids and `{}`. A modulator has `modOut` (with `onModTargets`) or `masteringOut`; it first receives `[]` and then targets twice.
5. **Fast and worklets (v1.4)**: `fast: true` requires `modInput(id)` with an AudioNode or AudioParam, and `null` for unknown ids; `host.modSignal` receives a real AudioNode; `host.loadWorklet` receives a name and code with `registerProcessor(...)`.
6. **Bundles (v1.5)**: every `multiOut` has `bundles[id]` with channels (unique id, name, AudioNode). Every `multiIn` has `onBundle`; it receives a bundle, the same key with one more channel, a second bundle and then `null` twice. After that no channel may still be connected and no AudioNode may be in the state. `host.bundleChanged` only for own `multiOut` ports.
7. **Presets (v1.6)**: every knob and choice from `host.ui.knob`/`select` is updated by `setState(getState())`. `getPreset`/`setPreset` only together, JSON without AudioNodes, `setPreset(getPreset())` gives the same preset, `setPreset({})` works.
8. **Smooth and control (v1.7)**: `host.frame` receives a function; every drawing function is called a few times and must not throw; after `destroy()` no subscription remains open. An own `requestAnimationFrame` without `host.frame` gives a warning in the OK line (not an error). `onPeers` receives `[]` and a list with two devices. `host.connect` only from own outputs of the right kind.
9. **Controls and drawing gate (v1.8)**: a device with the drawing gate (`__pkWrap`) no longer gives a warning. Double-click and typing cannot be tested by the validator (the host does that with the real UI).
10. **Instruments (v1.9)**: if the instance has `parts`, then also `getPart` and `setPart`; every instrument a unique `id` and a `name`; `getPart` gives JSON; `setPart(id, getPart(id))` leaves the setting the same; setting crosswise takes over the sound and touches no other instrument.
11. **Language and audio (v1.11)**: an optional `i18n` is an object with, per language, a `name` and/or `ports` (port id → name) of existing ports; `host.lang` and `host.audio` are present; the whole device is run through twice, with `host.lang` `'nl'` and `'en'`, and an error in either branch is an error.
12. **Mastering (v1.12)**: a device with `masteringIn` has `configureMastering(patch)` (and optionally `analyseMastering`, `acceptMasteringProposal`, `getMasteringReport`); they receive `{}`, `null` and unknown or invalid fields and return an object (or nothing), and `getMasteringReport` returns JSON without AudioNodes. A device with `masteringOut` has `onMasteringTargets(targets)`; it receives `[]`, a list with one target (twice) and `[]` again. The fake host checks `host.mastering` for a known action and an existing `masteringOut` port. A modulator has `modOut` or `masteringOut`.
13. **Multi-MIDI (v1.13)**: a device with `multiEventOut` has `eventBundles[portId]` with a list `tracks` (unique text ids, a `name`, an optional `ch` from 1 to 16); a device with `multiEventIn` has `onEventBundle`; it receives a bundle, the same key with another track added, and then `null`. Events with `ch` or `cc` have values in range; on a multi-MIDI port every event carries a `track` from the list. The fake host knows `host.eventBundleChanged`, `host.controls` and `host.setControl`.
14. **Note names (v1.14)**: a device with `noteNames()` returns a list of `{ note, name }` (note 0 to 127, a non-empty `name`); `noteNames()` does not throw and `host.noteNamesChanged(this)` may be called without error.
15. **Controls for skins (v1.15)**: the fake host knows `host.ui.knob(…, options)`, `host.ui.select(…, options)`, `host.ui.adopt` and `host.ui.list`, and also reads `data-pk-*` attributes on your own elements. Only a `warning` (never an error) for a duplicate id, some ids missing, a role outside the list, an invalid id or group, options that are not an object, `adopt` on an element without a model, an id on an element that is not attached anywhere, and ids that differ per `host.lang`. `--controls` prints the table `id | role | group | label nl/en | range | face | in params()` (see §12d).
16. **Coverage of `params()` (v1.16, §8)**: every continuous control (`<input type="range">`, `host.ui.knob`, `host.ui.adopt`; not the roles `step`, `display`, `meter`, `jack`, `pad`, `button`) is matched to `params()`: first by its `id` (options or `data-pk-id`), then by the `getState` key that changes when the validator moves the value and calls the `input`/`change` handling (numbered keys such as `osc.0.fine` count if they occur at several positions; step data and a single selected position do not), then by a label equal to exactly one parameter name. Only a `warning` (never an error) for: continuous controls that are not in `params()` and not in `modExclude`; an `instrument`, `effect` or `mixer` (not the categories `sequencer` and `tool`) with continuous controls but no `params()`; a `params()` id without a control or state key; a `modExclude` that is not a list of strings (or `'*'`). What the validator cannot match, it leaves silent (`?` in `--controls`). Controls built through `innerHTML` or drawn on a canvas it does not see.
17. **Clipboard (v1.17, §13d)**: `clipInfo`, `getClip` and `setClip` all three or none. `clipInfo()` returns `null` or a JSON object (`copy`/`paste` with `notes` and/or `drums`, numbers in `length`), does not throw and does not change the state. `getClip()` returns `null` or a valid `patchkamer-clip` as JSON without AudioNodes (`format`, `formatVersion` 1, `kind` `notes` or `drums`, `length` 1 to 12288 whole ticks, at most 4096 notes or hits and 64 lanes, `t`, `n`, `lane` and `vel` in range) and does not change the state. `setClip(getClip())` leaves `getState()` unchanged. `setClip` gets junk, empty and extreme clips (other types, `NaN`, length 0 or 1e9, 100000 notes, lanes that do not exist) and does not throw; it always returns `{ ok, reason }` (`reason` text with `ok: false`); with `ok: false` the state stays the same, with `ok: true` the state is JSON without `NaN`/`Infinity` and stable under `setState(getState())`; it sends no events itself. A device that rejects its own `getClip()` (`ok: false`) gets a `warning`. A device without these methods gets no message. `--clip` shows what `clipInfo()` and `getClip()` return.
18. **Meters (v1.18, §12e)**: the fake host knows `host.ui.meter(parent, label, opts)` and returns `{ el, set, id, destroy }`. A `source` that is not an `AnalyserNode` or a list of 1 or 2 `AnalyserNode`s throws and is therefore an error. Only a `warning` (never an error) for: a duplicate meter id, an invalid id or group, options that are not an object, an invalid `range`/`unit`/`kind`/`hold`/`clip`/`orientation`/`length`/`width`, `kind: 'rms'` without `source`, a `set()` with anything but a finite number or `[l, r]`, `data-pk-role="meter"` on your own element and a `data-pk-suffix` of more than 16 characters. A meter does not count towards the coverage of `params()`. `--controls` shows meters with role `meter`.
19. **Recording settings (v1.21, §13f)**: the fake host knows `host.watchParams`, `host.setParam`, `host.lockParams` and `host.paramsOf` and returns `false` (`[]` for `paramsOf`); the validator checks nothing else about them (test a sequencer that uses them in the host).

What the validator can *not* see: whether your texts are well translated, whether it sounds good, whether your own HTML knobs (outside `host.ui`) move along, and whether your timing is right. Test that in Patchkamer itself: set a preset, change a knob, choose the preset again and see whether everything jumps back.

---

## 18. Checklist for delivery

1. One file `name.patchkamer-device.js`, default export, `id` reverse-DNS, `version` semver, correct `kind` and `category`.
2. All audio ports have a node; no `ctx.destination` (except `output`).
3. Sound scheduled at `time` from `onStep`/`onEvent`; no `setTimeout` for timing.
4. `getState()` is plain JSON and complete; `setState({})` gives default values.
5. `setState()` updates the sound **and all knobs, choices and step rows**.
6. No routing, source choices or running positions in a preset: if needed `getPreset`/`setPreset`.
7. Bundle out: `bundles[port]` as a function, stable channel ids, `host.bundleChanged` on change.
8. Bundle in: choice saved as `key|channelId`, reconnect on the same key, disconnect everything on `null`.
9. Modulatable (optional): `params` + `modulate`, knob + modulation, `modulate({})` = no modulation.
10. Fast (optional): `fast: true` only where `modInput(id)` gives a real input.
11. Worklet (optional): unique name with version, and a fallback without worklet.
12. UI flows with the card width and uses the host's CSS variables (no fixed colors).
13. `destroy()` cleans up everything and can be called twice.
14. Moving UI via `host.frame` (with fallback), no size or color queries per frame (§12b).
15. Sliders are at their default value after `mount()`; numbers next to sliders are updated directly in the `input` handler; open shadow root (§12a).
16. Instruments (optional): `parts`/`getPart`/`setPart` together, only sound in `getPart`, restoring leaves the setting the same (§13c).
17. All text for the user is chosen on `host.lang` (`'nl'` and `'en'`, otherwise `'en'`); names per language in `i18n`; `oversample` of `host.audio` used where you cause aliasing yourself (§12c).
18. Controls (v1.15, recommended): every `host.ui.knob`/`select` and every own slider has an `id` (= state/parameter key, never the label), a `role` and a `group`; `node validate-instrument.mjs file.patchkamer-device.js --controls` shows the table without `warning` (§12d).
19. Coverage (v1.16): `params()` contains every continuous control with `id` = state key, except what is in `modExclude` (test note, base note, length, voices, step data); choices and checkboxes do not belong in it; parameters that must not move unasked (pitch, master, gate, octave, times) have `on: false` (§8). `--controls` shows no `no` in the `in params()` column.
20. Clipboard (v1.17, optional): `clipInfo`/`getClip`/`setClip` together; `getClip()` returns a valid `patchkamer-clip` or `null`; `setClip` clamps everything itself, returns `{ ok, reason }`, sets nothing halfway and sends no events; `setClip(getClip())` leaves `getState()` the same (§13d).
21. Meters (v1.18, optional): whoever shows a level uses `host.ui.meter` (with `source` for an existing `AnalyserNode`, otherwise with `set()`), with `id` and `group`, `if (!host.ui || typeof host.ui.meter !== 'function')` as a fallback to the own drawing, no damping of your own, the meter's `destroy()` in the device's `destroy()`, and a layout that lets the meter grow (§12e).
22. `node validate-instrument.mjs file.patchkamer-device.js` gives `OK`, without `warning`.

---

## 19. Common mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| `setState` sets only the sound, not the knob | After a preset or version switch the knob is wrong; the next touch jumps back | Keep what `host.ui.knob/select` returns and put `.set(v)` / `.value` in `setState` |
| New array in `setState` for a step row | The row shows the old pattern | `arr.splice(0, 16, ...new)` and then `row.paint()` |
| Running value (clock, phase, position) in the state | Every preset jumps back in time; "changed" is always on | Leave that value out of `getPreset` and do not restore it in `setPreset` |
| Source choice or routing in a preset | A preset throws cables or bundle choices around | `getPreset` without those fields; `setPreset` leaves them in place |
| `channel.node.disconnect()` without an argument | Other receivers of that bundle also lose their signal | `channel.node.disconnect(yourInput)` |
| AudioNode in the state | Saving fails | Keep `key|channelId` |
| `setTimeout` for notes | Sloppy timing, especially with a busy page | Schedule at `time` with the Web Audio clock |
| Fixed dark colors in your own CSS | Unreadable in the light scheme | `var(--card)`, `var(--fg)`, `var(--well)` … |
| `bundles.x` as a fixed object | The host sees no new channels | A function that gives the current list, plus `host.bundleChanged` |
| Old state not accepted | Workspaces and presets of a previous version do not load | Ignore unknown fields, give missing ones a default |
| Worklet name without version | Changed worklet code is not loaded | `'nl-name-fx-2'` at every change |
| Own `requestAnimationFrame` loop at 60 fps | Also draws out of view and minimized; MIDI and cables start to stutter | `host.frame(this, draw, 30)` (§12b) |
| `clientWidth` / `getComputedStyle` in the drawing function | The browser recalculates the layout every frame | `ResizeObserver` and a color cache |
| `host.frame` not cancelled | A removed device keeps drawing | Call the cancel function in `unmount()` and `destroy()` |
| Building the UI after `mount()` with the saved values | Double-click resets the slider to the saved value instead of the default | Show the default values in `mount()`; `setState()` then sets the rest (§12a), or `data-pk-default` |
| Updating the number only in a following frame | Typing does not work: the host does not see the number move along | Set the number directly in the `input` handler |
| Own double-click reset on every slider | Double work; the host already does it | Leave it out, or `data-pk-noreset` if the slider must *not* go back |
| Texts hard-coded in one language | Users of the other language see foreign text | Choose all texts on `host.lang` and give names per language in `i18n` (§12c) |
| The label as the `id` of a control | The label is translated and changes: a skin no longer hits the control; the validator gives a `warning` if it differs per language | `id` = the key in `getState()`/`params()` (§12d) |
| A few controls with an id, the rest without | A skin can only target the registered ones; the rest stays default | Give all knobs, choices and sliders an id |
| `host.ui.adopt` on a `div` or a drawing | No model: the host cannot put another face on it | Only on `input` (range/checkbox), `select` or `button` |
| Drawing your own meter while `host.ui.meter` exists | A skin cannot choose the face and size; the meter stays a bar | `host.ui.meter`, with your old drawing as the fallback for an old host (§12e) |
| `host.ui.meter` without checking that it exists | The device throws on an older host | `if (!host.ui || typeof host.ui.meter !== 'function')` and then draw yourself |
| Damping the level yourself before `set()` | The signal slows twice; a skin with other ballistics no longer helps | Pass the raw level, the host does the fall |
| Dropping `source` and still reading your own analyser into `set()` | Double work, also out of view | Pass the `AnalyserNode` as `source`; the host reads only when the card is visible |

---

## 20. Complete examples

All three pass the validator.

### 20a. Effect with knobs, choice, modulation and fast modulation — `tremolo.patchkamer-device.js`

```js
// tremolo.patchkamer-device.js — example effect · Patchkamer contract v1.21
// Shows: audio in/out, knobs and a choice that follow setState (presets), modulatable (params + modulate),
// one fast parameter (fast + modInput), cleaning up in destroy, and texts per language (host.lang + i18n).
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEF = () => ({ rate: 4, depth: 0.5, shape: 'sine' });
const MODP = [['rate', 'rate', 0.1, 20, true], ['depth', 'depth', 0, 1, false]];   // [id, text key, min, max, log]
const TXT = {
  nl: { shape: 'Vorm', rate: 'Snelheid', depth: 'Diepte', sine: 'sinus', triangle: 'driehoek', square: 'blok' },
  en: { shape: 'Shape', rate: 'Rate', depth: 'Depth', sine: 'sine', triangle: 'triangle', square: 'square' },
};

export default {
  id: 'nl.example.tremolo2',
  name: 'Tremolo',
  version: '2.0.0',
  kind: 'effect',
  category: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [] },
  i18n: { nl: { ports: { in: 'In', out: 'Uit' } } },   // names that the host shows itself, per language

  create(ctx, host) {
    const T = TXT[host.lang] || TXT.en;   // texts in your UI: choose on host.lang
    const S = DEF(), mod = {}; let dead = false;
    const inG = ctx.createGain(), out = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain(), fastDepth = ctx.createGain();
    out.gain.value = 1; lfo.connect(depth).connect(out.gain); inG.connect(out); lfo.start();
    fastDepth.gain.value = 1; fastDepth.connect(depth.gain);   // fast signal −1..1 adds to the depth
    // effective value = knob + modulation (fraction of the range; log parameters in octaves)
    const E = k => { const m = MODP.find(x => x[0] === k), b = S[k], o = mod[k] || 0; if (!o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    function apply() { if (dead) return; const t = ctx.currentTime; lfo.type = S.shape; lfo.frequency.setTargetAtTime(E('rate'), t, 0.03); depth.gain.setTargetAtTime(E('depth') * 0.5, t, 0.03); out.gain.setTargetAtTime(1 - E('depth') * 0.5, t, 0.03); }
    apply();
    const ui = {};   // keep what host.ui returns: setState restores these
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        ui.shape = host.ui.select(el, T.shape, [['sine', T.sine], ['triangle', T.triangle], ['square', T.square]], S.shape, v => { S.shape = v; apply(); }, { id: 'shape', group: 'lfo' });
        ui.rate = host.ui.knob(el, T.rate, [0.1, 20, 0.1], S.rate, v => v.toFixed(1) + ' Hz', v => { S.rate = v; apply(); }, { id: 'rate', role: 'param', group: 'lfo' });
        ui.depth = host.ui.knob(el, T.depth, [0, 1, 0.01], S.depth, v => Math.round(v * 100) + '%', v => { S.depth = v; apply(); }, { id: 'depth', role: 'param', group: 'lfo' });
      },
      params() { return MODP.map(([id, key, min, max, log]) => ({ id, name: T[key], lane: 'trem', laneName: 'Tremolo', min, max, role: id === 'rate' ? 'rate' : 'depth', scale: log ? 'log' : 'lin', drift: 0.1, on: true, fast: id === 'depth' })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODP.some(m => m[0] === k)) mod[k] = o[k]; apply(); },
      modInput(id) { return id === 'depth' ? fastDepth : null; },
      getState() { return { ...S }; },
      setState(s) {
        s = s || {}; const d = DEF();
        S.rate = typeof s.rate === 'number' ? clamp(s.rate, 0.1, 20) : d.rate;
        S.depth = typeof s.depth === 'number' ? clamp(s.depth, 0, 1) : d.depth;
        S.shape = ['sine', 'triangle', 'square'].includes(s.shape) ? s.shape : d.shape;
        apply();
        if (ui.rate) { ui.rate.set(S.rate); ui.depth.set(S.depth); ui.shape.value = S.shape; }   // knobs follow (v1.6)
      },
      destroy() { if (dead) return; dead = true; try { lfo.stop(); } catch (e) {} inG.disconnect(); out.disconnect(); fastDepth.disconnect(); },
    };
  }
};
```

### 20b. Instrument with clock, events and a bundle output — `tweeklank.patchkamer-device.js`

```js
// tweeklank.patchkamer-device.js — example instrument · Patchkamer contract v1.21
// Shows: scheduling on the clock (onStep), sending events (host.emit), a bundle output with every
// voice separately (ports.multiOut + bundles), step patterns that follow setState (presets), texts per language.
const VOICES = ['tik', 'toon'];
const TXT = {
  nl: { tik: 'Tik', toon: 'Toon', pitch: 'Toonhoogte', lvl: 'Niveau', sep: 'Losse uit' },
  en: { tik: 'Tick', toon: 'Tone', pitch: 'Pitch', lvl: 'Level', sep: 'Separate out' },
};
const DEF = () => ({ pat: { tik: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], toon: [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0] }, pitch: 220, lvl: 0.7 });

export default {
  id: 'nl.example.tweeklank',
  name: 'Two-tone',
  version: '1.0.0',
  kind: 'instrument',
  category: 'groove',
  modExclude: '*',   // this example shows the bundle, not modulation: deliberately no params() (§8)
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Trigs' }],
    multiOut: [{ id: 'sep', name: 'Separate out' }] },
  i18n: { nl: { name: 'Tweeklank', ports: { out: 'Uit', sep: 'Losse uit' } } },

  create(ctx, host) {
    const T = TXT[host.lang] || TXT.en;
    const S = DEF(); let self, dead = false; const rows = {}, ui = {};
    const out = ctx.createGain(); out.gain.value = S.lvl;
    const bus = {}; VOICES.forEach(k => { bus[k] = ctx.createGain(); bus[k].connect(out); });   // one node per voice: these go in the bundle
    function hit(k, t) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g).connect(bus[k]);
      if (k === 'tik') { o.type = 'square'; o.frequency.value = 2400; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.start(t); o.stop(t + 0.04); }
      else { o.type = 'sine'; o.frequency.setValueAtTime(S.pitch, t); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.start(t); o.stop(t + 0.42); }
    }
    self = {
      inputs: {}, outputs: { out },
      // v1.5: the bundle. A function, so the host always gets the current channels.
      bundles: { sep: () => ({ label: T.sep, channels: VOICES.map(k => ({ id: k, name: T[k], node: bus[k] })) }) },
      mount(el) {
        VOICES.forEach(k => { rows[k] = host.ui.steps(el, T[k], S.pat[k]); });
        ui.pitch = host.ui.knob(el, T.pitch, [80, 880, 1], S.pitch, v => Math.round(v) + ' Hz', v => { S.pitch = v; });
        ui.lvl = host.ui.knob(el, T.lvl, [0, 1, 0.01], S.lvl, v => Math.round(v * 100) + '%', v => { S.lvl = v; out.gain.setTargetAtTime(v, ctx.currentTime, 0.02); });
      },
      onStep({ step, time }) {
        VOICES.forEach(k => { if (S.pat[k][step]) { hit(k, time); host.emit(self, 'trigs', { type: 'trig', lane: k, vel: 1, time }); } });
        Object.values(rows).forEach(r => r.cursor(step));
      },
      onTransport({ playing }) { if (!playing) Object.values(rows).forEach(r => r.cursor(-1)); },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) {
        s = s || {}; const d = DEF();
        // replace patterns in place: host.ui.steps keeps a reference to these arrays
        VOICES.forEach(k => { const src = Array.isArray(s.pat && s.pat[k]) ? s.pat[k].slice(0, 16) : d.pat[k]; S.pat[k].splice(0, 16, ...src); });
        S.pitch = typeof s.pitch === 'number' ? s.pitch : d.pitch; S.lvl = typeof s.lvl === 'number' ? s.lvl : d.lvl;
        out.gain.value = S.lvl;
        Object.values(rows).forEach(r => r.paint()); if (ui.pitch) { ui.pitch.set(S.pitch); ui.lvl.set(S.lvl); }
      },
      destroy() { if (dead) return; dead = true; out.disconnect(); VOICES.forEach(k => bus[k].disconnect()); },
    };
    return self;
  }
};
```

### 20c. Receiver of a bundle, with a choice per output and its own preset — `bundelkeuze.patchkamer-device.js`

```js
// bundelkeuze.patchkamer-device.js — example receiver · Patchkamer contract v1.21
// Shows: receiving a bundle (ports.multiIn + onBundle), choosing per output which bundle channel goes to it,
// keeping the choice as "key|channel-id" so that it comes back after loading, disconnecting everything on null,
// keeping routing out of presets (getPreset/setPreset), and texts per language.
const OUTS = ['a', 'b'];
const TXT = {
  nl: { none: '— niets', gone: '(niet verbonden)', out: 'Uit ', lvl: 'Niveau' },
  en: { none: '— nothing', gone: '(not connected)', out: 'Out ', lvl: 'Level' },
};
const DEF = () => ({ src: { a: '', b: '' }, lvl: 0.8 });

export default {
  id: 'nl.example.bundelkeuze',
  name: 'Bundle chooser',
  version: '1.0.0',
  kind: 'utility',
  category: 'mix',
  ports: { audioIn: [], audioOut: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], eventIn: [], eventOut: [], multiIn: [{ id: 'in', name: 'Bundle' }] },
  i18n: { nl: { name: 'Bundelkeuze', ports: { in: 'Bundel' } } },

  create(ctx, host) {
    const T = TXT[host.lang] || TXT.en;
    const S = DEF(); let self, dead = false, root = null, lvlK = null;
    const outs = {}; OUTS.forEach(k => { outs[k] = ctx.createGain(); outs[k].gain.value = S.lvl; });
    const bundles = new Map();                  // key -> bundle from the host
    const linked = { a: null, b: null };        // which bundle channel (AudioNode) is now attached to each output
    const find = src => { if (!src) return null; const i = src.lastIndexOf('|'), b = bundles.get(src.slice(0, i)); return b ? b.channels.find(c => c.id === src.slice(i + 1)) || null : null; };
    function link(k) {                          // connect exactly what the state asks for, and nothing else
      const want = find(S.src[k]), n = want ? want.node : null;
      if (linked[k] === n) return;
      if (linked[k]) { try { linked[k].disconnect(outs[k]); } catch (e) {} }   // detach only OUR connection
      linked[k] = n; if (n) n.connect(outs[k]);
    }
    function paint() {
      if (!root) return; root.innerHTML = '';
      OUTS.forEach(k => {
        const opts = [['', T.none]]; bundles.forEach(b => b.channels.forEach(c => opts.push([b.key + '|' + c.id, b.source.name + ' · ' + c.name])));
        if (S.src[k] && !find(S.src[k])) opts.push([S.src[k], T.gone]);
        host.ui.select(root, T.out + k.toUpperCase(), opts, S.src[k], v => { S.src[k] = v; link(k); });
      });
      lvlK = host.ui.knob(root, T.lvl, [0, 1, 0.01], S.lvl, v => Math.round(v * 100) + '%', v => { S.lvl = v; OUTS.forEach(k => outs[k].gain.setTargetAtTime(v, ctx.currentTime, 0.02)); });
    }
    self = {
      inputs: {}, outputs: outs,
      mount(el) { root = document.createElement('div'); el.appendChild(root); paint(); },
      unmount() { root = null; },
      // v1.5: bundle connected, changed (same key, other channels) or detached (null)
      onBundle(port, key, b) {
        if (b) bundles.set(key, b); else bundles.delete(key);
        OUTS.forEach(k => { if (b && !S.src[k] && b.channels[OUTS.indexOf(k)]) S.src[k] = key + '|' + b.channels[OUTS.indexOf(k)].id; link(k); });   // fill empty outputs automatically
        paint();
      },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) {
        s = s || {}; const d = DEF();
        OUTS.forEach(k => { S.src[k] = typeof (s.src && s.src[k]) === 'string' ? s.src[k] : d.src[k]; link(k); });
        S.lvl = typeof s.lvl === 'number' ? s.lvl : d.lvl; OUTS.forEach(k => { outs[k].gain.value = S.lvl; });
        paint();   // rebuilds the choices with the new values; counts as "knobs follow"
      },
      // v1.6: a preset contains the level, not which channels you chose (that is routing)
      getPreset() { const s = self.getState(); delete s.src; return s; },
      setPreset(p) { self.setState({ ...(p || {}), src: { ...S.src } }); },
      destroy() { if (dead) return; dead = true; OUTS.forEach(k => { if (linked[k]) { try { linked[k].disconnect(outs[k]); } catch (e) {} } outs[k].disconnect(); }); },
    };
    return self;
  }
};
```

Try them together: put Two-tone and Bundle chooser on the floor, draw a bundle cable from **Separate out** to **Bundle**, and hang **A** and **B** on two channels of the mixer.

---

## 21. Assignment format

Always give a build assignment to an agent in this form, with this document attached:

```
ASSIGNMENT: build a Patchkamer device according to PATCHKAMER-CONTRACT_EN.md v1.21.
Name / id:        <Readable name> / nl.<yourname>.<device>
Kind:             instrument | effect | mixer | output | utility | modulator   (category: …)
What it does:     <one paragraph: sound, behavior, purpose>
Ports:            audio in: …   audio out: …   events in: …   events out: …   bundle in: …   bundle out: …
Controls:         <knobs and choices with range and unit>
Modulatable:      <which parameters, which fast>   (or: no)
Presets:          <what does not belong in a preset, or: everything>
Card width:       <px, or default>
Languages:        nl + en (via host.lang)   (or: only one language)
Deliver:          one .patchkamer-device.js file + the OK line of validate-instrument.mjs.
```
