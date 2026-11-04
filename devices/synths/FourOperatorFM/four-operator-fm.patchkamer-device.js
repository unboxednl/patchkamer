// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Nieuw als Four-Operator FM (nieuwe id nl.patchkamer.fouroperatorfm, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Four-Operator FM
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard; alle knoppen en keuzes volgen setState
//   - de motor bevat alleen wat dit apparaat nodig heeft; het geluid is ongewijzigd
//   - bewaker: een niet-eindige waarde in de uitvoer maakt het apparaat niet meer voorgoed stil (stemmen en gelijkspanningsfilter worden teruggezet)
//   - de ceiling-vervormer volgt host.audio.oversample (§12c); de worklet heet nl-patchkamer-four-operator-fm-1-11-0
//   - de scope tekent via host.frame; kleuren komen uit de CSS-variabelen van de host; dubbelklik op een schuif zet hem terug op de beginwaarde
// Een FM-synth met vier sinus-operators, elk met eigen ratio, level, fijnafstemming en envelope (attack, decay, sustain, release),
// acht algoritmes (hoe de operators elkaar moduleren), feedback op operator 4, LFO met vibrato en tremolo, en acht stemmen.

const WNAME = 'nl-patchkamer-four-operator-fm-1-11-0';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;

// Algoritmes: FM_ROUTES[algoritme][operator] = de operators die deze operator moduleren (0-gebaseerd);
// FM_CARRIERS[algoritme] = de operators die je hoort.
const FM_ROUTES = [[[1], [2], [3], []], [[1], [2, 3], [], []], [[1, 2], [], [3], []], [[1, 2], [3], [], []], [[1], [], [3], []], [[3], [3], [3], []], [[], [], [3], []], [[], [], [], []]];
const FM_CARRIERS = [[0], [0], [0], [0], [0, 2], [0, 1, 2], [0, 1, 2], [0, 1, 2, 3]];

// De klankmotor. Draait in een AudioWorklet (of, als terugval, in een ScriptProcessor) en moet daarom op zichzelf staan:
// de klasse gebruikt alleen FM_ROUTES en FM_CARRIERS, die ook in de workletcode worden gezet.
class FmEngine {
  constructor(sr, p) {
    this.sr = sr; this.p = { ...p }; this.target = { ...p }; this.queue = []; this.voices = []; this.serial = 0; this.frame = 0; this.lfoPhase = 0;
    this.dc = 0; this.last = 0; this.op = Array.from({ length: 4 }, () => ({}));
    this.setParams(p); this.prepareFM();
  }
  setParams(p) { this.target = { ...p }; for (const k in p) if (typeof p[k] !== 'number' || k === 'algorithm') this.p[k] = p[k]; }
  enqueue(e) {
    if (!Number.isFinite(e?.time)) return;
    const v = { ...e };
    if (v.type === 'panic' || v.type === 'allnotesoff') this.queue = this.queue.filter(x => x.time < v.time);
    if (v.type === 'note' || v.type === 'noteon') { v.token = ++this.serial; if (!v.held && Number.isFinite(v.dur)) this.queue.push({ type: 'autooff', token: v.token, time: v.time + Math.max(0.005, v.dur) }); }
    this.queue.push(v); this.queue.sort((a, b) => a.time - b.time);
    if (this.queue.length > 2048) this.queue.splice(0, this.queue.length - 2048);
  }
  prepareFM() {
    for (let i = 0; i < 4; i++) { const key = 'o' + (i + 1), op = this.op[i]; for (const field of ['ratio', 'level', 'a', 'd', 's', 'r']) op[field] = this.p[key + field]; op.tune = 2 ** ((this.p[key + 'detune'] || 0) / 1200); }
  }
  eg(e, gate, a, d, s, r) {
    const sr = this.sr;
    if (!gate && e.stage !== 'release') { e.stage = 'release'; e.age = 0; }
    switch (e.stage) {
      case 'attack': e.value += 1 / (Math.max(0.001, a) * sr); if (e.value >= 1) { e.value = 1; e.stage = 'decay'; e.age = 0; } break;
      case 'decay': e.value += (s - e.value) * Math.min(1, 6 / (Math.max(0.008, d) * sr)); if (++e.age >= d * sr) e.stage = 'sustain'; break;
      case 'sustain': e.value += (s - e.value) * 0.01; break;
      case 'release': e.value *= Math.max(0, 1 - 7 / (Math.max(0.008, r) * sr)); break;
    }
    if (!Number.isFinite(e.value)) e.value = 0;
    return e.value;
  }
  voice(note, vel, token) {
    return { note, vel, token, gate: true, age: 0, ops: Array.from({ length: 4 }, () => ({ value: 0, stage: 'attack', age: 0 })), phases: [0, 0, 0, 0], opOut: [0, 0, 0, 0], inc: [0, 0, 0, 0], fb: 0, fb2: 0 };
  }
  event(e) {
    const type = e.type;
    if (type === 'control') { this.setParams(e.params); return; }
    if (type === 'panic' || type === 'allnotesoff') { for (const v of this.voices) v.gate = false; return; }
    if (type === 'note' || type === 'noteon') {
      if (!(e.vel > 0)) { this.event({ type: 'noteoff', note: e.note }); return; }
      if (this.voices.length >= 8) { const index = this.voices.findIndex(v => !v.gate); this.voices.splice(index >= 0 ? index : 0, 1); }
      this.voices.push(this.voice(e.note, e.vel, e.token)); return;
    }
    if (type === 'noteoff' || type === 'autooff') {
      const matches = k => type === 'autooff' ? k.token === e.token : k.note === e.note;
      for (const v of this.voices) if (matches(v)) v.gate = false;
    }
  }
  fm(v, lfo) {
    const p = this.p, alg = Math.max(0, Math.min(7, Math.round(p.algorithm || 1) - 1)), out = v.opOut, route = FM_ROUTES[alg], carriers = FM_CARRIERS[alg];
    if ((this.frame & 15) === 0 || v.age === 0) {
      const base = 440 * 2 ** ((v.note - 69 + (p.transpose || 0) + (p.vibrato || 0) * lfo / 100) / 12);
      for (let i = 0; i < 4; i++) v.inc[i] = Math.min(this.sr * 0.45, base * this.op[i].ratio * this.op[i].tune) / this.sr;
    }
    v.age++;
    for (let i = 3; i >= 0; i--) {
      const op = this.op[i], env = this.eg(v.ops[i], v.gate, op.a, op.d, op.s, op.r);
      v.phases[i] = (v.phases[i] + v.inc[i]) % 1;
      let phase = 0;
      for (const src of route[i]) phase += out[src] * 6;
      if (i === 3) phase += (v.fb + v.fb2) * 0.5 * (p.feedback || 0) * 0.55;
      out[i] = Math.sin(v.phases[i] * Math.PI * 2 + phase) * env * op.level;
    }
    v.fb2 = v.fb; v.fb = out[3];
    let sample = 0;
    for (const c of carriers) sample += out[c];
    v.alive = v.gate;
    for (const i of carriers) if (v.ops[i].value > 0.00001) v.alive = true;
    return sample / Math.sqrt(carriers.length) * v.vel * 0.3 * (1 - (p.tremolo || 0) * (lfo + 1) * 0.5);
  }
  process(left, right, time) {
    const sr = this.sr;
    for (let i = 0; i < left.length; i++) {
      const t = time + i / sr;
      while (this.queue.length && this.queue[0].time <= t + 1e-10) this.event(this.queue.shift());
      if ((this.frame & 31) === 0) {
        for (const k in this.target) if (typeof this.target[k] === 'number' && k !== 'algorithm') this.p[k] += (this.target[k] - this.p[k]) * 0.04;
        this.prepareFM();
      }
      const p = this.p, rate = p.lfoRate || 1;
      this.lfoPhase += rate / sr; if (this.lfoPhase >= 1) this.lfoPhase %= 1;
      const lfo = 1 - 4 * Math.abs(this.lfoPhase - 0.5);
      let l = 0;
      for (const v of this.voices) l += this.fm(v, lfo);
      for (let j = this.voices.length - 1; j >= 0; j--) if (this.voices[j].alive === false) this.voices.splice(j, 1);
      let y = l - this.last + 0.995 * this.dc;
      // bewaker: een niet-eindige waarde (door een ontspoorde stem) wist de stemmen en het gelijkspanningsfilter, zodat het apparaat niet voorgoed stil blijft
      if (!Number.isFinite(y)) { this.voices.length = 0; this.last = 0; this.dc = 0; y = 0; l = 0; }
      this.last = l; this.dc = y;
      left[i] = right[i] = 0.9 * Math.tanh(y / 0.9);
      this.frame++;
    }
  }
}
const WORKLET = `const FM_ROUTES=${JSON.stringify(FM_ROUTES)};const FM_CARRIERS=${JSON.stringify(FM_CARRIERS)};
${FmEngine.toString()}
registerProcessor('${WNAME}', class extends AudioWorkletProcessor {
  constructor(options) { super(); this.engine = new FmEngine(sampleRate, options.processorOptions.params); this.closed = false;
    this.port.onmessage = e => { const m = e.data; if (m.type === 'params') this.engine.setParams(m.params); else if (m.type === 'event') this.engine.enqueue(m.event); else if (m.type === 'close') this.closed = true; }; }
  process(inputs, outputs) { if (this.closed) return false; const output = outputs[0]; if (output && output.length) this.engine.process(output[0], output[1] || output[0], currentTime); return true; }
});`;

// Tekst: Nederlandse bron, Engels via het woordenboek (Engelse muziekvaktermen blijven Engels)
const EN = {
  'Vier operators, eigen envelopes, acht algoritmen en achtstemmige polyfonie.': 'Four operators, their own envelopes, eight algorithms and eight-voice polyphony.',
  'Klankbeeld': 'Sound', 'Algoritme': 'Algorithm', 'Algoritme {0}': 'Algorithm {0}',
  'Testnoot MIDI': 'Test note MIDI', 'Speel noot': 'Play note', 'Houd noot': 'Hold note', 'Test akkoord': 'Test chord', 'Alles uit': 'All off',
  'FM-algoritme': 'FM algorithm', 'Onderste rij = hoorbare carriers · OP 4 heeft feedback': 'Bottom row = audible carriers · OP 4 has feedback',
  'Fijnafstemming': 'Fine tune', 'Transpositie': 'Transpose', 'Uitgang': 'Output', 'Klank': 'Sound',
  'Golfvorm van de uitgang': 'Output waveform',
  'Audiomotor wordt voorbereid…': 'Preparing the audio engine…', 'Deze omgeving biedt geen audioprocessor.': 'This environment has no audio processor.',
  'Audiomotor gereed · keyboard en testknoppen beschikbaar': 'Audio engine ready · keyboard and test buttons available',
  'OP 4 heeft feedback. De onderste rij van het schema is hoorbaar; de andere operators kleuren die carriers. Envelopes werken met tijden en een sustainniveau.': 'OP 4 has feedback. The bottom row of the diagram is what you hear; the other operators colour those carriers. Envelopes use times and a sustain level.',
  'Eigen klanksynthese. De Mod-ingang verandert de klank zonder de basiswaarden te overschrijven.': 'Own sound synthesis. The Mod input changes the sound without overwriting the base values.',
};

// Parameters: [naam, min, max, rol, schaal, eenheid, stap]
const OPK = [['Ratio', 0.5, 16, 'pitch', 'log', '×'], ['Level', 0, 1, 'level', 'lin', '%'], ['Fijnafstemming', -12, 12, 'pitch', 'lin', 'cent'], ['Attack', 0.001, 4, 'env', 'log', 's'], ['Decay', 0.02, 8, 'decay', 'log', 's'], ['Sustain', 0, 1, 'env', 'lin', '%'], ['Release', 0.02, 8, 'decay', 'log', 's']];
const OPF = ['ratio', 'level', 'detune', 'a', 'd', 's', 'r'];
const OPDEF = [[1, 0.85, 0, 0.005, 0.5, 0, 0.25], [1, 0.8, 0, 0.005, 0.16, 0.1, 0.25], [1, 0.55, 0, 0.005, 0.3, 0.1, 0.25], [1, 0.3, 0, 0.005, 0.2, 0, 0.25]];
const GLOB = [['feedback', 'Feedback OP 4', 0, 7, 'color', 'lin', '', 2, 0.01], ['lfoRate', 'LFO', 0.05, 20, 'motion', 'log', 'Hz', 4, 0.01], ['vibrato', 'Vibrato', 0, 80, 'pitch', 'lin', 'cent', 0, 0.01],
  ['tremolo', 'Tremolo', 0, 1, 'color', 'lin', '', 0, 0.01], ['transpose', 'Transpositie', -24, 24, 'pitch', 'lin', 'st', 0, 1], ['level', 'Uitgang', 0, 1, 'level', 'lin', '%', 0.8, 0.01]];
const SPEC = {}; const DEFAULTS = {};
for (let i = 0; i < 4; i++) OPF.forEach((f, j) => { const k = OPK[j], id = 'o' + (i + 1) + f; SPEC[id] = { name: k[0], op: i + 1, min: k[1], max: k[2], role: k[3], scale: k[4], unit: k[5], step: 0.01 }; DEFAULTS[id] = OPDEF[i][j]; });
for (const g of GLOB) { SPEC[g[0]] = { name: g[1], min: g[2], max: g[3], role: g[4], scale: g[5], unit: g[6], step: g[8] }; DEFAULTS[g[0]] = g[7]; }
Object.assign(DEFAULTS, { testNote: 48, preset: 'Rubber Bass', algorithm: 1, operator: 0 });
const PRESETS = {
  'Rubber Bass': { algorithm: 1, o1s: 0, o1d: 0.5, o2ratio: 1, o2level: 0.8, o2d: 0.16, o3ratio: 1, o3level: 0.55, o4level: 0.3 },
  'Digital Tines': { algorithm: 5, o2ratio: 14, o2level: 0.5, o2d: 0.15, o1s: 0, o3s: 0, o1d: 2.2, o3d: 1.5 },
  'Hollow Organ': { algorithm: 8, o1s: 1, o2s: 1, o3s: 1, o4s: 1, o2ratio: 2, o3ratio: 3, o4ratio: 4, feedback: 0 },
  'Metal Bells': { algorithm: 6, o4ratio: 3.5, feedback: 4, o1s: 0, o2s: 0, o3s: 0, o1d: 2, o2d: 1.8, o3d: 2.5 },
  'Stab Chord': { algorithm: 5, o2ratio: 2, o4ratio: 1.5, o1s: 0.6, o3s: 0.4, o1r: 1.2, o3r: 1.2 },
  'Glass Marimba': { algorithm: 2, o1s: 0, o1d: 0.35, o2d: 0.08, o4ratio: 7, feedback: 1 },
  'Breathing Pad': { algorithm: 7, o1a: 1.2, o2a: 1, o3a: 0.9, o1r: 2.5, o2r: 2, o3r: 2, tremolo: 0.2, lfoRate: 0.2 },
  'Wire Pluck': { algorithm: 3, o1s: 0, o1d: 0.4, o3ratio: 3.14, o4ratio: 6.28, feedback: 5 },
};
const PRESET_SKIP = ['testNote', 'operator'];   // werkstand, geen klank: een preset laat dit staan

const CSS = `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:var(--audio,#91e0d4);--x-acc2:var(--event,#e8c991);--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}
.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}
h2{margin:0 0 5px;font-size:20px;letter-spacing:1px;color:var(--x-ink)}
p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:8px 0}
.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}
.control span{font-size:11px;color:var(--muted,#adc3c9)}
button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}
button{cursor:pointer;touch-action:none}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}
button.active{background:color-mix(in srgb,var(--x-acc) 38%,var(--field,#223640));border-color:var(--x-acc)}
input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}
output{font:12px monospace;color:var(--x-ink2)}
canvas{display:block;width:100%;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px;touch-action:none;box-sizing:border-box}
label{min-width:0}`;

export default {
  id: 'nl.patchkamer.fouroperatorfm',
  name: 'Four-Operator FM',
  version: '1.11.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 1000, minWidth: 380 },
  i18n: { en: { ports: { out: 'Stereo', notes: 'Keyboard / notes' } } },
  ports: {
    audioIn: [], audioOut: [{ id: 'out', name: 'Stereo' }],
    eventIn: [{ id: 'notes', name: 'Keyboard / noten' }], eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }], modOut: [],
  },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const specName = id => { const d = SPEC[id]; return d.op ? 'OP ' + d.op + ' · ' + tx(d.name) : tx(d.name); };
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    const OPTIONS = { algorithm: [1, 2, 3, 4, 5, 6, 7, 8] };

    let dead = false, mod = {}, state = { ...DEFAULTS }, effective = {};
    let rootEl = null, panel = null, ui = {}, opGrid = null, engineText = null, stopDraw = null, ro = null;
    let scope = null, scopeG = null, graph = null, graphG = null, cw = 600, dpr = 1, graphDraw = null, graphKey = '';
    let palT = -1, palC = null, heldDemo = false;
    const data = new Float32Array(1024);
    const nodes = new Set();
    const own = n => (nodes.add(n), n);
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);

    function resolve() {
      const e = { ...state };
      for (const [id, d] of Object.entries(SPEC)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); }
      effective = e; return e;
    }
    function normalize(raw) {
      const s = raw && typeof raw === 'object' ? raw : {}, next = { ...DEFAULTS };
      for (const [id, d] of Object.entries(SPEC)) next[id] = finite(s[id], DEFAULTS[id], d.min, d.max);
      if (OPTIONS.algorithm.includes(Number(s.algorithm)) && s.algorithm !== '' && s.algorithm !== null && typeof s.algorithm !== 'boolean') next.algorithm = Number(s.algorithm);
      next.preset = typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset) ? s.preset : DEFAULTS.preset;
      next.testNote = Math.round(finite(s.testNote, DEFAULTS.testNote, 24, 96));
      next.operator = Math.round(finite(s.operator, 0, 0, 3));
      return next;
    }

    // audioketen: motor -> volume -> compressor -> ceiling
    const volume = own(ctx.createGain()); volume.gain.value = DEFAULTS.level;
    const comp = own(ctx.createDynamicsCompressor()); comp.threshold.value = -10; comp.ratio.value = 5; comp.knee.value = 8; comp.attack.value = 0.003; comp.release.value = 0.18;
    const ceil = own(ctx.createWaveShaper()); { const c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); ceil.curve = c; ceil.oversample = (host.audio && host.audio.oversample) || '2x'; }
    const analyser = own(ctx.createAnalyser()); analyser.fftSize = 1024;
    volume.connect(comp); comp.connect(ceil); ceil.connect(analyser);

    // motor: worklet (terugval: ScriptProcessor)
    let backend = null, backendType = 'loading', localEngine = null, pending = [];
    function send(message) {
      if (dead) return;
      if (backendType === 'worklet') backend.port.postMessage(message);
      else if (backendType === 'script') { if (message.type === 'params') localEngine.setParams(message.params); else localEngine.enqueue(message.event); }
      else if (message.type === 'event') { pending.push(message.event); if (pending.length > 1024) pending.shift(); }
    }
    function tellEngine() { if (engineText) engineText.textContent = tx(backendType === 'loading' ? 'Audiomotor wordt voorbereid…' : backendType === 'unavailable' ? 'Deze omgeving biedt geen audioprocessor.' : 'Audiomotor gereed · keyboard en testknoppen beschikbaar'); }
    function useScript() {
      if (dead) return;
      if (typeof ctx.createScriptProcessor === 'function') {
        localEngine = new FmEngine(ctx.sampleRate, effective);
        backend = own(ctx.createScriptProcessor(1024, 1, 2)); backendType = 'script';
        backend.onaudioprocess = e => { if (dead) return; localEngine.process(e.outputBuffer.getChannelData(0), e.outputBuffer.getChannelData(1), Number.isFinite(e.playbackTime) ? e.playbackTime : ctx.currentTime); };
        backend.connect(volume);
        for (const e of pending) localEngine.enqueue(e);
        pending = [];
      } else backendType = 'unavailable';
      tellEngine();
    }
    function useWorklet() {
      if (dead) return;
      try {
        backend = own(new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { params: effective } }));
        backendType = 'worklet'; backend.connect(volume);
        for (const e of pending) backend.port.postMessage({ type: 'event', event: e });
        pending = []; tellEngine();
      } catch (err) { useScript(); }
    }
    {
      const loader = host && typeof host.loadWorklet === 'function' && typeof AudioWorkletNode === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('no worklet'));
      loader.then(useWorklet, useScript);
    }

    function apply() { if (dead) return; resolve(); smooth(volume.gain, effective.level); send({ type: 'params', params: effective }); }
    function panic(t = ctx.currentTime) { heldDemo = false; send({ type: 'event', event: { type: 'allnotesoff', time: t } }); }
    function note(n, vel, t, dur, held = false) { send({ type: 'event', event: { type: 'note', note: Math.round(clamp(n, 0, 127)), vel: clamp(vel, 0, 1), time: t, dur, held } }); }
    function pushEvent(e) { send({ type: 'event', event: e }); }

    // ---- UI ----
    function pal() {
      const now = performance.now(); if (palC && now - palT < 1000) return palC; palT = now;
      const cs = panel && typeof getComputedStyle === 'function' ? getComputedStyle(panel) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d;
      palC = { well: v('--well', '#0b171d'), wellFg: v('--well-fg', '#c7dbe0'), line: v('--line', '#39434c'), audio: v('--audio', '#4fd1c5'), muted: v('--muted', '#aabec5') };
      palC.key = palC.well + palC.wellFg + palC.audio; return palC;
    }
    function layout() {
      dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4);
      for (const [cv, h] of [[scope, 64], [graph, 130]]) { if (!cv) continue; const pw = Math.round(cw * dpr), ph = Math.round(h * dpr); if (cv.width !== pw) cv.width = pw; if (cv.height !== ph) cv.height = ph; }
      if (graphDraw) graphDraw();
    }
    function drawGraph() {
      const g = graphG; if (!g || !graph) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = cw, h = 130, P = pal(); graphKey = P.key;
      g.fillStyle = P.well; g.fillRect(0, 0, w, h);
      const routes = FM_ROUTES[state.algorithm - 1], carriers = FM_CARRIERS[state.algorithm - 1];
      const depth = i => carriers.includes(i) ? 0 : 1 + Math.max(0, ...routes.map((r, j) => r.includes(i) ? depth(j) : 0));
      const pos = Array.from({ length: 4 }, (_, i) => ({ x: 55 + i * (w - 110) / 3, y: 96 - depth(i) * 26 }));
      g.strokeStyle = P.muted; g.lineWidth = 1;
      for (let to = 0; to < 4; to++) for (const from of routes[to]) { g.beginPath(); g.moveTo(pos[from].x, pos[from].y); g.lineTo(pos[to].x, pos[to].y); g.stroke(); }
      g.font = '12px system-ui'; g.textAlign = 'center';
      for (let i = 0; i < 4; i++) {
        const p = pos[i], car = carriers.includes(i);
        g.globalAlpha = 0.25; g.fillStyle = car ? P.audio : P.muted; g.fillRect(p.x - 24, p.y - 13, 48, 26); g.globalAlpha = 1;
        g.strokeStyle = car ? P.audio : P.muted; g.lineWidth = car ? 2.5 : 1.5; g.strokeRect(p.x - 24, p.y - 13, 48, 26);
        g.fillStyle = P.wellFg; g.fillText('OP ' + (i + 1), p.x, p.y + 4);
      }
      g.textAlign = 'left'; g.fillStyle = P.wellFg; g.fillText(tx('Onderste rij = hoorbare carriers · OP 4 heeft feedback'), 10, 124);
    }
    function drawScope() {
      if (dead || !scope || !scopeG) return;
      analyser.getFloatTimeDomainData(data);
      const P = pal(); if (graphDraw && P.key !== graphKey) graphDraw();
      const g = scopeG, w = cw, h = 64;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = P.well; g.fillRect(0, 0, w, h); g.strokeStyle = P.wellFg; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < data.length; i++) { const x = i / (data.length - 1) * w, y = h / 2 - clamp(data[i], -1, 1) * h * 0.46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    const onSkin = () => { palC = null; };

    function select(parent, label, options, value, change) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label);
      const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); }
      el.value = String(value); el.onchange = () => change(el.value); return el;
    }
    // schuif met het getal ernaast; log: de schuif loopt van 0 tot 1
    function knob(parent, id, label, min, max, step, value, def, change, format, toSlider, fromSlider) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label);
      const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(toSlider(value)); input.setAttribute('data-pk-default', String(toSlider(def)));
      input.oninput = () => { const v = fromSlider(Number(input.value)); out.textContent = format(v); change(v); };
      return { set(v) { input.value = String(toSlider(v)); out.textContent = format(v); } };
    }
    function control(parent, id) {
      const d = SPEC[id], format = v => d.unit === '%' ? Math.round(v * 100) + '%' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
      const lg = d.scale === 'log', r = d.max / d.min;
      ui[id] = lg
        ? knob(parent, id, specName(id), 0, 1, 0.001, state[id], DEFAULTS[id], x => { state[id] = x; apply(); }, format, v => Math.log(v / d.min) / Math.log(r), x => d.min * r ** x)
        : knob(parent, id, specName(id), d.min, d.max, d.step, state[id], DEFAULTS[id], x => { state[id] = x; apply(); }, format, v => v, x => x);
    }
    function buildOpGrid() {
      if (!opGrid) return; opGrid.innerHTML = '';
      const prefix = 'o' + (state.operator + 1);
      for (const id of Object.keys(SPEC)) if (id.startsWith(prefix)) control(opGrid, id);
    }
    function refresh() {
      if (!panel) return;
      ui.preset.value = state.preset; ui.algorithm.value = String(state.algorithm); ui.operator.value = String(state.operator);
      ui.testNote.set(state.testNote); buildOpGrid();
      for (const g of GLOB) ui[g[0]].set(state[g[0]]);
      if (graphDraw) graphDraw();
    }

    const self = {
      inputs: {}, outputs: { out: ceil },
      mount(el) {
        rootEl = el; el.innerHTML = '';
        const wrap = add(el, 'div'), shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
        add(shadow, 'style', CSS);
        panel = add(shadow, 'div'); panel.className = 'app'; ui = {};
        add(panel, 'h2', 'Four-Operator FM'); add(panel, 'p', tx('Vier operators, eigen envelopes, acht algoritmen en achtstemmige polyfonie.'));
        const top = add(panel, 'div'); top.className = 'row';
        ui.preset = select(top, tx('Klankbeeld'), Object.keys(PRESETS).map(k => [k, k]), state.preset, v => self.setState({ ...DEFAULTS, ...PRESETS[v], preset: v, testNote: state.testNote, operator: state.operator }));
        ui.algorithm = select(top, tx('Algoritme'), OPTIONS.algorithm.map(n => [n, tx('Algoritme {0}', n)]), state.algorithm, v => { state.algorithm = Number(v); apply(); if (graphDraw) graphDraw(); });
        const play = add(panel, 'div'); play.className = 'row';
        ui.testNote = knob(play, 'testNote', tx('Testnoot MIDI'), 24, 96, 1, state.testNote, DEFAULTS.testNote, v => { state.testNote = v; }, v => String(v), v => v, x => x);
        const btn = (label, fn) => { const b = add(play, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
        btn(tx('Speel noot'), () => note(state.testNote, 0.85, ctx.currentTime, 1));
        btn(tx('Houd noot'), () => { heldDemo = !heldDemo; if (heldDemo) note(state.testNote, 0.8, ctx.currentTime, undefined, true); else panic(); });
        btn(tx('Test akkoord'), () => { for (const n of [0, 3, 7]) note(state.testNote + n, 0.7, ctx.currentTime, 1.6); });
        btn(tx('Alles uit'), () => panic());
        graph = add(panel, 'canvas'); graph.setAttribute('aria-label', tx('FM-algoritme')); graph.style.height = '130px'; graphG = graph.getContext ? graph.getContext('2d') : null;
        graphDraw = drawGraph;
        const opRow = add(panel, 'div'); opRow.className = 'row';
        ui.operator = select(opRow, 'Operator', [0, 1, 2, 3].map(i => [i, 'OP ' + (i + 1)]), state.operator, v => { state.operator = Number(v); buildOpGrid(); });
        opGrid = add(panel, 'div'); opGrid.className = 'grid'; buildOpGrid();
        const globals = add(panel, 'div'); globals.className = 'grid'; for (const g of GLOB) control(globals, g[0]);
        scope = add(panel, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang')); scope.style.height = '64px'; scopeG = scope.getContext ? scope.getContext('2d') : null;
        engineText = add(panel, 'p'); tellEngine();
        add(panel, 'p', tx('OP 4 heeft feedback. De onderste rij van het schema is hoorbaar; de andere operators kleuren die carriers. Envelopes werken met tijden en een sustainniveau.'));
        add(panel, 'p', tx('Eigen klanksynthese. De Mod-ingang verandert de klank zonder de basiswaarden te overschrijven.'));
        palC = null; layout();
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect && es[0].contentRect.width; if (w) { const n = Math.max(260, Math.min(1200, w)); if (n !== cw) { cw = n; layout(); } } }); ro.observe(scope); }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        if (stopDraw) stopDraw();
        stopDraw = host && typeof host.frame === 'function' ? host.frame(self, drawScope, 20) : null;
      },
      unmount() {
        if (stopDraw) { stopDraw(); stopDraw = null; }
        if (ro) { ro.disconnect(); ro = null; }
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
        rootEl = null; panel = null; opGrid = null; engineText = null; scope = null; scopeG = null; graph = null; graphG = null; graphDraw = null; ui = {};
      },
      onEvent(port, e) {
        try {
          if (dead || port !== 'notes' || !e || !Number.isFinite(e.time)) return;
          const type = String(e.type || '').toLowerCase().replace(/[_-]/g, ''), time = Math.max(ctx.currentTime, e.time);
          if (type === 'panic' || type === 'allnotesoff') { panic(time); return; }
          if (type === 'cc' && SPEC[e.id] && Number.isFinite(e.value)) {
            const d = SPEC[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min);
            resolve(); smooth(volume.gain, effective.level, time); send({ type: 'event', event: { type: 'control', params: { ...effective }, time } });
            if (ui[e.id]) ui[e.id].set(state[e.id]);
            return;
          }
          if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(e.note)) return;
          pushEvent({ type: type === 'noteoff' || e.vel === 0 ? 'noteoff' : type, note: Math.round(clamp(e.note, 0, 127)), vel: finite(e.vel, 0.8, 0, 1), time, held: e.held === true || type === 'noteon' && !Number.isFinite(e.dur), dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1 });
        } catch (err) { /* een foute gebeurtenis mag het apparaat niet stoppen */ }
      },
      onTransport(e) { if (dead) return; if (!(e && e.playing)) panic(); },
      params() {
        return Object.entries(SPEC).map(([id, d]) => ({ id, name: specName(id), lane: d.op ? 'OP ' + d.op : 'klank', laneName: d.op ? 'OP ' + d.op : tx('Klank'), min: d.min, max: d.max, scale: d.scale, role: d.role, drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' }));
      },
      modulate(raw) {
        mod = {};
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in SPEC) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1);
        apply();
      },
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) { if (dead) return; const keep = {}; for (const k of PRESET_SKIP) keep[k] = state[k]; self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return;
        panic(); state = normalize(raw); apply(); refresh();
      },
      destroy() {
        if (dead) return;
        panic(); dead = true;
        if (stopDraw) { stopDraw(); stopDraw = null; }
        if (ro) { ro.disconnect(); ro = null; }
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
        try { if (backendType === 'worklet') { backend.port.postMessage({ type: 'close' }); backend.port.close(); } } catch (err) { /* al gesloten */ }
        if (backend) backend.onaudioprocess = null;
        pending = []; localEngine = null;
        for (const n of nodes) { try { n.disconnect(); } catch (err) { /* al losgekoppeld */ } }
        nodes.clear();
        rootEl = null; panel = null; opGrid = null; engineText = null; scope = null; scopeG = null; graph = null; graphG = null; graphDraw = null; ui = {};
      },
    };
    apply();
    return self;
  },
};
