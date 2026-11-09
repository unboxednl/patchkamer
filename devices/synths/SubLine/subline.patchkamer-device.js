// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.12.0 — Uitleg naar about (menu Over Sub Line); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.11.0 — Nieuw als Sub Line (nieuwe id nl.patchkamer.subline, eigen map), bijgewerkt naar Patchkamer contract v1.11. Het geluid is ongewijzigd:
//   - tweetalig (host.lang, namen per taal in i18n)
//   - de audiomotor is een AudioWorklet via host.loadWorklet; de motor bevat alleen nog wat een monofone synth nodig heeft
//   - bewaker: een niet-eindige waarde in een stem of in de uitgang wordt hersteld in plaats van het apparaat voor altijd stil te zetten
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard, en alle regelaars volgen;
//     Besturing (mode) en Arp-richting (arpDirection) worden nu ook bewaard en teruggezet
//   - de lengte-schuif en de stappenrij worden niet meer bij elke wijziging helemaal opnieuw opgebouwd
//   - het kiezen van een klank laat het patroon, de besturing en de testnoot staan
//   - de scope tekent via host.frame; kleuren komen uit de host; de UI staat in een open shadow root
//   - oversampling van de begrenzer volgt host.audio.oversample (§12c)
// Een monofone synth: zaagtand, puls, sub-oscillator en ruis, pulsbreedtemodulatie, een filter van twee trappen met
// resonantie, een envelope voor filter en versterker, portamento en een LFO. Met een eigen patroon van 32 stappen en
// een arpeggiator; speelt ook noten van een externe sequencer of keyboard.

const WNAME = 'nl-patchkamer-subline-1-11-0';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => (typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d);

// De audiomotor. Deze klasse wordt als tekst in de worklet gezet en mag dus niets van buiten gebruiken.
class SubLineEngine {
  constructor(sr, p) {
    this.sr = sr; this.p = { ...p }; this.target = {}; this.queue = []; this.voices = []; this.keys = [];
    this.serial = 0; this.frame = 0; this.seed = 197903; this.lfoPhase = 0; this.dcL = 0; this.lastL = 0;
    this.setParams(p);
  }
  setParams(p) {
    const t = {};
    for (const k in p) {
      const v = p[k];
      if (typeof v === 'number' && !Number.isFinite(v)) continue;
      t[k] = v;
      if (typeof v !== 'number' || k === 'subOctave') this.p[k] = v;
    }
    this.target = t;
    if (this.keys.length) this.updateMono();
  }
  random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  enqueue(e) {
    if (!Number.isFinite(e?.time)) return;
    const v = { ...e };
    if (v.type === 'panic' || v.type === 'allnotesoff') this.queue = this.queue.filter(x => x.time < v.time);
    if (v.type === 'note' || v.type === 'noteon') {
      v.token = ++this.serial;
      if (!v.held && Number.isFinite(v.dur)) this.queue.push({ type: 'autooff', token: v.token, time: v.time + Math.max(0.005, v.dur) });
    }
    this.queue.push(v);
    this.queue.sort((a, b) => a.time - b.time);
    if (this.queue.length > 2048) this.queue.splice(0, this.queue.length - 2048);
  }
  newEg() { return { value: 0, stage: 'attack', age: 0 }; }
  eg(e, gate, a, d, s, r) {
    const sr = this.sr;
    if (!gate && e.stage !== 'release') { e.stage = 'release'; e.age = 0; }
    switch (e.stage) {
      case 'attack': e.value += 1 / (Math.max(0.001, a) * sr); if (e.value >= 1) { e.value = 1; e.stage = 'decay'; e.age = 0; } break;
      case 'decay': e.value += (s - e.value) * Math.min(1, 6 / (Math.max(0.008, d) * sr)); if (++e.age >= d * sr) { e.stage = 'sustain'; } break;
      case 'sustain': e.value += (s - e.value) * 0.01; break;
      case 'release': e.value *= Math.max(0, 1 - 7 / (Math.max(0.008, r) * sr)); break;
    }
    if (!Number.isFinite(e.value)) e.value = 0;
    return e.value;
  }
  voice(note, vel, token) {
    const f = 440 * 2 ** ((note - 69) / 12);
    return { note, vel, token, gate: true, p1: 0, sub: 0, freq: f, amp: this.newEg(), env: this.newEg(), filter: [{ x: 0, y: 0 }, { x: 0, y: 0 }], g: 0.1, k: 1 };
  }
  event(e) {
    const type = e.type;
    if (type === 'control') { this.setParams(e.params); return; }
    if (type === 'panic' || type === 'allnotesoff') { this.keys = []; for (const v of this.voices) v.gate = false; return; }
    if (type === 'note' || type === 'noteon') {
      if (!(e.vel > 0)) { this.event({ type: 'noteoff', note: e.note }); return; }
      const was = this.keys.length;
      this.keys = this.keys.filter(k => k.note !== e.note);
      this.keys.push({ note: e.note, vel: e.vel, token: e.token });
      let v = this.voices[0];
      if (!v) { v = this.voice(e.note, e.vel, e.token); this.voices = [v]; }
      this.updateMono(); v.gate = true; v.vel = e.vel; v.token = e.token;
      if (!was || !this.p.legato || e.retrigger) { v.amp = this.newEg(); v.env = this.newEg(); }
      return;
    }
    if (type === 'noteoff' || type === 'autooff') {
      const matches = k => (type === 'autooff' ? k.token === e.token : k.note === e.note);
      this.keys = this.keys.filter(k => !matches(k));
      if (!this.keys.length) { for (const v of this.voices) v.gate = false; } else this.updateMono();
    }
  }
  updateMono() {
    const v = this.voices[0];
    if (!v || !this.keys.length) return;
    const sorted = this.keys.slice().sort((a, b) => a.note - b.note);
    const sel = this.p.priority === 'low' ? sorted[0] : this.p.priority === 'high' ? sorted.at(-1) : this.keys.at(-1);
    v.note = sel.note; v.vel = sel.vel;
  }
  blep(t, dt) { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }
  saw(phase, dt) { return 2 * phase - 1 - this.blep(phase, dt); }
  square(phase, dt, pw) {
    const w = Math.max(0.05, Math.min(0.95, pw));
    let v = phase < w ? 1 : -1;
    v += this.blep(phase, dt); v -= this.blep((phase - w + 1) % 1, dt);
    return v;
  }
  svf(x, s, g, k) {
    const a = 1 / (1 + g * (g + k)), v1 = (s.x + g * (x - s.y)) * a, v2 = s.y + g * v1;
    s.x = Math.max(-8, Math.min(8, 2 * v1 - s.x)); s.y = Math.max(-8, Math.min(8, 2 * v2 - s.y));
    return v2;
  }
  calm(v) {   // bewaker: zet een stem terug op een veilige toestand
    v.filter[0].x = v.filter[0].y = v.filter[1].x = v.filter[1].y = 0; v.p1 = 0; v.sub = 0; v.freq = 440 * 2 ** ((v.note - 69) / 12);
    if (!Number.isFinite(v.vel)) v.vel = 0.8;
    v.g = 0.1; v.k = 1;
  }
  sample(v, lfo) {
    const p = this.p, sr = this.sr;
    const a = this.eg(v.amp, v.gate, p.attack || 0.005, p.decay || 0.3, p.sustain ?? 0.7, p.release || 0.2);
    const e = this.eg(v.env, v.gate, p.attack, p.decay, p.sustain, p.release);
    const transpose = (p.transpose || 0) + (p.vibrato || 0) * lfo / 100, freq = 440 * 2 ** ((v.note - 69 + transpose) / 12);
    const glide = Math.max(0.0001, p.glide || 0.0001), gcoef = Math.min(1, 5 / (glide * sr));
    v.freq += (freq - v.freq) * gcoef;
    const pw = Math.max(0.05, Math.min(0.95, (p.pw || 0.5) + (p.pwm || 0) * lfo * 0.43));
    const dt = Math.max(0.00001, Math.min(0.45, v.freq / sr));
    let x = this.saw(v.p1, dt) * (p.saw || 0) + this.square(v.p1, dt, pw) * (p.pulse || 0);
    x += this.square(v.sub, Math.min(0.45, dt / (p.subOctave || 2)), 0.5) * (p.sub || 0);
    x += this.random() * (p.noise || 0);
    v.p1 += dt; v.p1 %= 1; v.sub = (v.sub + dt / (p.subOctave || 2)) % 1;
    if ((this.frame & 15) === 0) {
      const tracking = (p.keytrack ?? 0.5) * (v.note - 60) / 12;
      const cut = Math.max(25, Math.min(sr * 0.43, (p.cutoff || 2500) * 2 ** ((p.filterEnv || 0) * e + (p.lfoFilter || 0) * lfo * 3 + tracking)));
      v.g = Math.tan(Math.PI * cut / sr); v.k = Math.max(0.07, 2 - (p.resonance || 0) * 1.93);
    }
    x = Math.tanh(x * (1 + (p.drive || 0) * 5));
    x = this.svf(x, v.filter[0], v.g, v.k);
    x = this.svf(x, v.filter[1], v.g, Math.max(0.35, v.k));
    v.alive = v.gate || a > 0.00001;
    return Math.tanh(x) * a * v.vel * 0.55;
  }
  process(left, right, time) {
    const sr = this.sr;
    for (let i = 0; i < left.length; i++) {
      const t = time + i / sr;
      while (this.queue.length && this.queue[0].time <= t + 1e-10) this.event(this.queue.shift());
      if ((this.frame & 31) === 0) {
        for (const k in this.target) if (typeof this.target[k] === 'number' && k !== 'subOctave') this.p[k] += (this.target[k] - this.p[k]) * 0.04;
      }
      const p = this.p, rate = p.lfoRate || 1;
      this.lfoPhase += rate / sr;
      if (this.lfoPhase >= 1) { this.lfoPhase %= 1; this.random(); }   // een trek uit de gedeelde reeks, zodat de ruis gelijk blijft aan eerdere versies
      const lfo = 1 - 4 * Math.abs(this.lfoPhase - 0.5);
      let l = 0;
      for (const v of this.voices) {
        let s = this.sample(v, lfo);
        if (!Number.isFinite(s)) { this.calm(v); s = 0; }
        l += s;
      }
      for (let j = this.voices.length - 1; j >= 0; j--) if (this.voices[j].alive === false) this.voices.splice(j, 1);
      let yl = l - this.lastL + 0.995 * this.dcL;
      if (!Number.isFinite(yl)) { yl = 0; l = 0; }
      this.lastL = l; this.dcL = yl;
      left[i] = right[i] = 0.9 * Math.tanh(yl / 0.9);
      this.frame++;
    }
  }
}
const WORKLET = SubLineEngine.toString() + `
registerProcessor(${JSON.stringify(WNAME)}, class extends AudioWorkletProcessor {
  constructor(options) { super(); this.engine = new SubLineEngine(sampleRate, options.processorOptions.params); this.closed = false;
    this.port.onmessage = e => { const m = e.data; if (m.type === 'params') this.engine.setParams(m.params); else if (m.type === 'event') this.engine.enqueue(m.event); else if (m.type === 'close') this.closed = true; }; }
  process(inputs, outputs) { if (this.closed) return false; const o = outputs[0]; if (o && o.length) this.engine.process(o[0], o[1] || o[0], currentTime); return true; }
});`;

// Teksten: Nederlandse bron, Engels op host.lang
const EN = {
  'Klank': 'Sound', 'Suboctaaf': 'Sub octave', '1 octaaf lager': '1 octave lower', '2 octaven lager': '2 octaves lower',
  'Prioriteit': 'Priority', 'Laatste': 'Last', 'Laagste': 'Lowest', 'Hoogste': 'Highest', 'Uit': 'Off', 'Aan': 'On',
  'Testnoot': 'Test note', 'Speel noot': 'Play note', 'Houd noot': 'Hold note', 'Alles uit': 'All notes off',
  'Sequencer': 'Sequencer', 'Besturing': 'Control', 'Keyboard / externe sequencer': 'Keyboard / external sequencer', 'Eigen patroon': 'Own pattern',
  'Nootdeling': 'Note division', 'Arp-richting': 'Arp direction', 'Omhoog': 'Up', 'Omlaag': 'Down', 'Lengte': 'Length',
  'Stap {0}': 'Step {0}', 'Noot': 'Note', 'Speelt': 'Plays', 'Rust': 'Rest', 'rust': 'rest',
  'Golfvorm van de uitgang': 'Output waveform',
  'Audiomotor wordt voorbereid…': 'Preparing the audio engine…', 'Deze omgeving biedt geen audioprocessor.': 'This environment has no audio processor.',
  'Audiomotor gereed · ': 'Audio engine ready · ', 'interne klok loopt': 'internal clock running', 'keyboard en testknoppen beschikbaar': 'keyboard and test buttons available',
  'Interne klok · {0} BPM · stap {1}': 'Internal clock · {0} BPM · step {1}',
  'Filters': 'Filters', 'Versterker / envelope': 'Amp / envelope', 'Oscillatoren': 'Oscillators', 'Modulatie': 'Modulation', 'Master': 'Master',
  'Resonantie': 'Resonance', 'Filter-EG': 'Filter envelope', 'Pulsbreedte': 'Pulse width', 'PWM-diepte': 'PWM depth', 'Ruis': 'Noise',
  'LFO-snelheid': 'LFO rate', 'Transpositie': 'Transpose', 'Uitgang': 'Output', 'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Sequencer-gate': 'Sequencer gate',
};

// Regelaars: [id, naam, min, max, rol, schaal, eenheid, spoor, stap]
const LANES = { filter: 'Filters', amp: 'Versterker / envelope', source: 'Oscillatoren', motion: 'Modulatie', master: 'Master' };
const SPEC = Object.fromEntries([
  ['cutoff', 'Cutoff', 30, 16000, 'filter', 'log', 'Hz', 'filter'],
  ['resonance', 'Resonantie', 0, 1, 'res', 'lin', '', 'filter'],
  ['filterEnv', 'Filter-EG', -5, 5, 'env', 'lin', '', 'filter'],
  ['keytrack', 'Key tracking', 0, 1, 'pitch', 'lin', '', 'filter'],
  ['attack', 'VCA attack', 0.001, 4, 'env', 'log', 's', 'amp'],
  ['decay', 'VCA decay', 0.01, 8, 'decay', 'log', 's', 'amp'],
  ['sustain', 'VCA sustain', 0, 1, 'env', 'lin', '', 'amp'],
  ['release', 'VCA release', 0.01, 8, 'decay', 'log', 's', 'amp'],
  ['pw', 'Pulsbreedte', 0.05, 0.95, 'color', 'lin', '', 'source'],
  ['pwm', 'PWM-diepte', 0, 1, 'color', 'lin', '', 'motion'],
  ['noise', 'Ruis', 0, 1, 'texture', 'lin', '', 'source'],
  ['lfoRate', 'LFO-snelheid', 0.05, 30, 'motion', 'log', 'Hz', 'motion'],
  ['vibrato', 'LFO → pitch', 0, 120, 'pitch', 'lin', 'cent', 'motion'],
  ['lfoFilter', 'LFO → filter', 0, 1, 'filter', 'lin', '', 'motion'],
  ['drive', 'Drive', 0, 1, 'color', 'lin', '', 'master'],
  ['glide', 'Portamento', 0.001, 1, 'glide', 'log', 's', 'motion'],
  ['transpose', 'Transpositie', -24, 24, 'pitch', 'lin', 'st', 'source', 1],
  ['level', 'Uitgang', 0, 1, 'level', 'lin', '', 'master'],
  ['saw', 'Zaagtand', 0, 1, 'level', 'lin', '', 'source'],
  ['pulse', 'Puls', 0, 1, 'level', 'lin', '', 'source'],
  ['sub', 'Sub', 0, 1, 'sub', 'lin', '', 'source'],
  ['gate', 'Sequencer-gate', 0.1, 1, 'env', 'lin', '', 'motion'],
].map(([id, name, min, max, role, scale, unit, lane, step]) => [id, { name, min, max, role, scale, unit, lane, step: step || 0.01 }]));
// parameters die de motor gebruikt
const ENGINE_KEYS = ['cutoff', 'resonance', 'filterEnv', 'keytrack', 'attack', 'decay', 'sustain', 'release', 'pw', 'pwm', 'noise', 'lfoRate', 'vibrato', 'lfoFilter', 'drive', 'glide', 'transpose', 'saw', 'pulse', 'sub', 'subOctave', 'legato', 'priority'];

const SEQ_N = [36, 36, 48, 43, 39, 36, 46, 43, 36, 48, 39, 43, 34, 36, 43, 46, 36, 36, 48, 43, 39, 36, 46, 43, 36, 48, 39, 43, 34, 36, 43, 46];
const SEQ_ON = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0];
const DEFAULTS = {
  cutoff: 900, resonance: 0.25, filterEnv: 3, keytrack: 0.5, attack: 0.008, decay: 0.22, sustain: 0.25, release: 0.3, pw: 0.5, pwm: 0.2, noise: 0,
  lfoRate: 2, vibrato: 0, lfoFilter: 0, drive: 0.1, glide: 0.005, transpose: 0, level: 0.75, saw: 0.8, pulse: 0.35, sub: 0.3, gate: 0.65,
  testNote: 48, preset: 'Rubber Bass', subOctave: 2, legato: true, priority: 'last', mode: 'notes', division: 1, length: 16, selected: 0, arpDirection: 'up',
  seqNotes: SEQ_N, seqOn: SEQ_ON,
};
const freshState = () => { const s = { ...DEFAULTS }; s.seqNotes = SEQ_N.slice(); s.seqOn = SEQ_ON.slice(); return s; };
const OPTIONS = {
  subOctave: [[2, '1 octaaf lager'], [4, '2 octaven lager']],
  priority: [['last', 'Laatste'], ['low', 'Laagste'], ['high', 'Hoogste']],
  mode: [['notes', 'Keyboard / externe sequencer'], ['sequence', 'Eigen patroon'], ['arp', 'Arpeggiator']],
  arpDirection: [['up', 'Omhoog'], ['down', 'Omlaag']],
};
const PRESETS = {
  'Rubber Bass': { cutoff: 900, filterEnv: 3, sustain: 0.25, decay: 0.22 },
  'Square Runner': { saw: 0, pulse: 0.85, sub: 0.25, cutoff: 1800, resonance: 0.5 },
  'Soft Triangle Feel': { saw: 0, pulse: 0.35, sub: 0.8, cutoff: 650, filterEnv: 0.5 },
  'Squelch': { cutoff: 400, resonance: 0.8, filterEnv: 4, sustain: 0.1 },
  'Bright Sequence': { cutoff: 3200, filterEnv: 2, sub: 0.15, decay: 0.15, sustain: 0.2 },
  'Noise Percussion': { saw: 0, pulse: 0, sub: 0, noise: 0.9, cutoff: 7000, decay: 0.08, sustain: 0 },
};
const PRESET_SKIP = ['testNote', 'selected'];   // werkstand, geen klank: een tune laat dit staan
const KEEP_ON_SOUND = ['testNote', 'selected', 'mode', 'division', 'length', 'arpDirection', 'seqNotes', 'seqOn'];   // kiezen van een klank raakt het patroon niet

const CSS = `
:host{display:block;--s-acc:var(--audio,#4fd1c5);--s-ink:color-mix(in srgb,var(--s-acc) 65%,var(--fg,#d9e6e7));--s-cur:var(--event,#f4a261)}
*{box-sizing:border-box}
.app{font:12px/1.4 var(--mono,ui-monospace,monospace);color:var(--fg,#d9e6e7);display:grid;gap:8px;container-type:inline-size}
.note{margin:0;color:var(--muted,#aabec5);font-size:11px}
.bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:end}
label.sel{display:grid;gap:3px;color:var(--muted,#aabec5);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
select,button,input[type=text]{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:4px;padding:4px 7px;max-width:100%}
button{cursor:pointer}
button:hover{border-color:var(--s-acc)}
button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--s-acc);outline-offset:1px}
.sec{background:var(--card-2,var(--card,#142129));border:1px solid var(--line,#344953);border-radius:6px;padding:8px 10px;display:grid;gap:8px;min-width:0}
.sec h4{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--s-ink);border-bottom:1px solid var(--line,#344953);padding-bottom:4px;font-weight:500}
.knobs{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:6px 18px}
.k{display:grid;grid-template-columns:112px minmax(0,1fr) 76px;gap:8px;align-items:center;min-width:0}
.k label{color:var(--muted,#aabec5);font-size:10px;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
input[type=range]{width:100%;min-width:0;margin:0;accent-color:var(--s-acc)}
.pads{display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:4px}
.pads button{padding:6px 2px;font-size:11px;text-align:center}
.pads button.sel{border-color:var(--s-acc);background:color-mix(in srgb,var(--s-acc) 30%,var(--field,#223640))}
.pads button.rest{opacity:.55}
.pads button.cur{box-shadow:inset 0 0 0 2px var(--s-cur)}
canvas{display:block;width:100%;height:64px;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:5px}
[hidden]{display:none!important}
`;

export default {
  id: 'nl.patchkamer.subline',
  name: 'Sub Line',
  version: '1.12.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 920, minWidth: 380 },
  about: { nl: 'Mono: zaagtand, puls, sub en ruis · PWM · portamento · patroon van 32 stappen en arpeggiator.\n\nBesturing kiest keyboard, eigen patroon of arpeggiator. De host bepaalt tempo en swing. De prioriteit bepaalt welke toets klinkt bij overlappende noten.\n\nDe paarse Mod-ingang verandert de klank zonder de basiswaarden te overschrijven.', en: 'Mono: sawtooth, pulse, sub and noise · PWM · portamento · 32-step pattern and arpeggiator.\n\nControl selects keyboard, own pattern or arpeggiator. The host sets tempo and swing. Priority decides which key sounds when notes overlap.\n\nThe purple Mod input changes the sound without overwriting the base values.' },
  ports: {
    audioIn: [],
    audioOut: [{ id: 'out', name: 'Out' }],
    eventIn: [{ id: 'notes', name: 'Keyboard / notes' }],
    eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }],
    modOut: [],
  },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Keyboard / noten' } } },

  create(ctx, host) {
    const lang = host && host.lang;
    const tx = (k, ...a) => { let t = lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let dead = false, state = freshState(), mod = {}, effective = {};
    const nodes = new Set();
    const own = n => (nodes.add(n), n);
    const gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);

    function resolve() {
      const e = { ...state };
      for (const [id, d] of Object.entries(SPEC)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); }
      effective = e; return e;
    }
    resolve();
    const engineParams = () => Object.fromEntries(ENGINE_KEYS.map(k => [k, effective[k]]));

    // ---------- geluid ----------
    // motor (worklet) -> volume -> compressor -> begrenzer (uitgang) -> meter
    const volume = gain(state.level);
    const comp = own(ctx.createDynamicsCompressor());
    comp.threshold.value = -10; comp.ratio.value = 5; comp.knee.value = 8; comp.attack.value = 0.003; comp.release.value = 0.18;
    const out = own(ctx.createWaveShaper());
    { const c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); out.curve = c; out.oversample = (host.audio && host.audio.oversample) || '2x'; }
    const analyser = own(ctx.createAnalyser()); analyser.fftSize = 1024;
    volume.connect(comp).connect(out); out.connect(analyser);

    let backend = null, backendType = 'loading', pending = [], engineText = null;
    function engineMessage(m) {
      if (dead) return;
      if (backendType === 'worklet') backend.port.postMessage(m);
      else if (backendType === 'loading' && m.type === 'event') { pending.push(m.event); if (pending.length > 1024) pending.shift(); }
    }
    function apply() { if (dead) return; resolve(); smooth(volume.gain, effective.level); engineMessage({ type: 'params', params: engineParams() }); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      backend = own(new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { params: engineParams() } }));
      backendType = 'worklet'; backend.connect(volume);
      for (const e of pending) backend.port.postMessage({ type: 'event', event: e });
      pending = []; tellEngine();
    }).catch(() => { if (!dead) { backendType = 'unavailable'; pending = []; tellEngine(); } });

    // ---------- noten ----------
    const send = e => engineMessage({ type: 'event', event: e });
    let playing = null, lastStep = '', sequenceCounter = 0, arpQueue = [], arpKeys = new Map(), heldDemo = false, arpToken = 0;
    function panic(t = ctx.currentTime) { heldDemo = false; arpQueue = []; arpKeys.clear(); send({ type: 'allnotesoff', time: t }); }
    function note(n, vel, t, dur, held = false) { send({ type: 'note', note: Math.round(clamp(n, 0, 127)), vel: clamp(vel, 0, 1), time: t, dur, held }); }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    const stepDuration = info => (Number.isFinite(info?.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info?.bpm) && info.bpm > 0 ? 15 / info.bpm : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0);

    function event(port, e) {
      try {
        if (dead || port !== 'notes' || !Number.isFinite(e?.time)) return;
        const type = cleanType(e), time = Math.max(ctx.currentTime, e.time);
        if (type === 'panic' || type === 'allnotesoff') { panic(time); return; }
        if (type === 'cc' && SPEC[e.id] && Number.isFinite(e.value)) {
          const d = SPEC[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min);
          resolve(); smooth(volume.gain, effective.level, time); send({ type: 'control', params: engineParams(), time }); refreshAll(); return;
        }
        if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(e.note)) return;
        const n = {
          type: type === 'noteoff' || e.vel === 0 ? 'noteoff' : type, note: Math.round(clamp(e.note, 0, 127)), vel: finite(e.vel, 0.8, 0, 1), time,
          held: e.held === true || (type === 'noteon' && !Number.isFinite(e.dur)), dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1,
        };
        if (state.mode === 'arp') {
          n.token = ++arpToken; arpQueue.push(n);
          if (n.type !== 'noteoff' && !n.held) arpQueue.push({ type: 'autooff', token: n.token, note: n.note, time: time + n.dur });
          arpQueue.sort((a, b) => a.time - b.time); if (arpQueue.length > 512) arpQueue.splice(0, arpQueue.length - 512); return;
        }
        if (state.mode === 'sequence') return;
        send(n);
      } catch (err) { /* een gebeurtenis mag nooit gooien */ }
    }
    function step(info) {
      try {
        if (dead || playing === false || !Number.isFinite(info?.time) || !Number.isInteger(info.step)) return;
        const sd = stepDuration(info); if (!sd) return;
        const key = info.time + ':' + info.step; if (key === lastStep) return; lastStep = key;
        if (state.mode === 'notes' || info.step % state.division) return;
        const i = sequenceCounter++ % state.length;
        if (state.mode === 'sequence') { if (state.seqOn[i]) note(state.seqNotes[i], 0.85, info.time, sd * state.division * effective.gate); }
        else {
          while (arpQueue.length && arpQueue[0].time <= info.time) {
            const e = arpQueue.shift();
            if (e.type === 'noteoff') arpKeys.delete(e.note);
            else if (e.type === 'autooff') { if (arpKeys.get(e.note)?.token === e.token) arpKeys.delete(e.note); }
            else arpKeys.set(e.note, { vel: e.vel, token: e.token });
          }
          const notes = [...arpKeys.keys()].sort((a, b) => a - b);
          if (notes.length) { const j = state.arpDirection === 'down' ? notes.length - 1 - i % notes.length : i % notes.length; note(notes[j], arpKeys.get(notes[j]).vel, info.time, sd * state.division * effective.gate); }
        }
        markStep(state.mode === 'sequence' ? i : -1);
        if (engineText && state.mode !== 'notes') engineText.textContent = tx('Interne klok · {0} BPM · stap {1}', Math.round(15 / sd), i + 1);
      } catch (err) { /* idem */ }
    }

    // ---------- state ----------
    function normalize(raw) {
      const s = raw && typeof raw === 'object' ? raw : {}, next = freshState();
      for (const [id, d] of Object.entries(SPEC)) next[id] = finite(s[id], DEFAULTS[id], d.min, d.max);
      for (const [id, values] of Object.entries(OPTIONS)) if (values.some(([v]) => String(v) === String(s[id]))) next[id] = typeof DEFAULTS[id] === 'number' ? Number(s[id]) : String(s[id]);
      next.legato = typeof s.legato === 'boolean' ? s.legato : DEFAULTS.legato;
      next.preset = typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset) ? s.preset : DEFAULTS.preset;
      next.testNote = Math.round(finite(s.testNote, DEFAULTS.testNote, 24, 96));
      next.division = [1, 2, 4].includes(s.division) ? s.division : DEFAULTS.division;
      next.length = Math.round(finite(s.length, DEFAULTS.length, 1, 32));
      next.selected = Math.round(finite(s.selected, DEFAULTS.selected, 0, 31));
      const nn = s.seqNotes, oo = s.seqOn;
      next.seqNotes = Array.from({ length: 32 }, (_, i) => Math.round(finite(Array.isArray(nn) ? nn[i] : undefined, SEQ_N[i], 24, 96)));
      next.seqOn = Array.from({ length: 32 }, (_, i) => Math.round(finite(Array.isArray(oo) ? oo[i] : undefined, SEQ_ON[i], 0, 1)));
      return next;
    }

    // ---------- UI ----------
    let shadow = null, mountHost = null, refreshers = [], stepsBox = null, stepBtns = [], editorBox = null, cv = null, g2 = null, stopDraw = null, ro = null;
    let cw = 600, col = null, colT = 0, scopeData = null, lastMarked = -1;
    const add = (parent, tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; parent.appendChild(el); return el; };
    const refreshAll = () => refreshers.forEach(f => f());
    const fmtNum = (v, unit) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) > 0 && Math.abs(v) < 0.1 ? v.toFixed(3) : v.toFixed(2)) + (unit ? ' ' + unit : '');

    function knob(parent, label, min, max, step, getV, setV, fmt, def, id) {
      const w = add(parent, 'div', undefined, 'k'), l = add(w, 'label', label), i = add(w, 'input'), o = add(w, 'output');
      const uid = 'k-' + id; l.htmlFor = uid; i.id = uid; i.type = 'range'; i.min = String(min); i.max = String(max); i.step = String(step);
      i.dataset.pkDefault = String(def);
      i.oninput = () => { const n = Number(i.value); setV(n); o.textContent = fmt(n); };
      const paint = () => { i.value = String(getV()); o.textContent = fmt(getV()); };
      paint(); refreshers.push(paint); return i;
    }
    function paramKnob(parent, id) {
      const d = SPEC[id], lg = d.scale === 'log', span = Math.log(d.max / d.min);
      const toPos = v => (lg ? Math.log(v / d.min) / span : v), fromPos = x => (lg ? d.min * Math.exp(x * span) : x);
      const fmt = v => fmtNum(v, d.unit);
      const w = add(parent, 'div', undefined, 'k'), l = add(w, 'label', tx(d.name)), i = add(w, 'input'), o = add(w, 'output');
      const uid = 'p-' + id; l.htmlFor = uid; i.id = uid; l.title = tx(d.name); i.type = 'range';
      i.min = String(lg ? 0 : d.min); i.max = String(lg ? 1 : d.max); i.step = String(lg ? 0.001 : d.step); i.dataset.pkDefault = String(toPos(DEFAULTS[id]));
      i.oninput = () => { state[id] = lg ? d.min * (d.max / d.min) ** Number(i.value) : Number(i.value); o.textContent = fmt(state[id]); apply(); };
      const paint = () => { i.value = String(toPos(state[id])); o.textContent = fmt(state[id]); };
      paint(); refreshers.push(paint);
    }
    function choose(parent, label, id, opts, onChange) {
      const w = add(parent, 'label', undefined, 'sel'); w.append(document.createTextNode(label));
      const s = add(w, 'select');
      opts.forEach(([v, t]) => { const o = add(s, 'option', t); o.value = String(v); });
      s.onchange = () => onChange(s.value);
      const paint = () => { s.value = String(id === 'legato' ? Number(state.legato) : state[id]); };
      paint(); refreshers.push(paint); return s;
    }

    function stepLabel(i) { return (i + 1) + ' · ' + (state.seqOn[i] ? state.seqNotes[i] : tx('rust')); }
    function buildSteps() {
      if (!stepsBox) return;
      stepsBox.textContent = ''; editorBox.textContent = ''; stepBtns = []; lastMarked = -1;
      const isSeq = state.mode === 'sequence'; stepsBox.hidden = editorBox.hidden = !isSeq; if (!isSeq) return;
      const sel = Math.min(state.selected, state.length - 1);
      for (let i = 0; i < state.length; i++) {
        const b = add(stepsBox, 'button', stepLabel(i)); b.type = 'button'; b.title = tx('Stap {0}', i + 1);
        b.classList.toggle('sel', i === sel); b.classList.toggle('rest', !state.seqOn[i]);
        b.onclick = () => { state.selected = i; buildSteps(); }; stepBtns.push(b);
      }
      add(editorBox, 'span', tx('Stap {0}', sel + 1));
      const kn = document.createElement('div'); kn.className = 'k'; editorBox.appendChild(kn);
      const l = add(kn, 'label', tx('Noot')), inp = add(kn, 'input'), out2 = add(kn, 'output');
      l.htmlFor = inp.id = 'step-note';
      inp.type = 'range'; inp.min = '24'; inp.max = '96'; inp.step = '1'; inp.value = String(state.seqNotes[sel]); inp.dataset.pkDefault = String(SEQ_N[sel]); inp.setAttribute('aria-label', tx('Noot')); out2.textContent = String(state.seqNotes[sel]);
      inp.oninput = () => { const n = Number(inp.value); state.seqNotes[sel] = n; out2.textContent = String(n); stepBtns[sel].textContent = stepLabel(sel); };
      const s = add(editorBox, 'label', undefined, 'sel'); s.append(document.createTextNode(tx('Speelt')));
      const se = add(s, 'select'); [[0, tx('Rust')], [1, tx('Noot')]].forEach(([v, t]) => { const o = add(se, 'option', t); o.value = String(v); });
      se.value = String(state.seqOn[sel]);
      se.onchange = () => { state.seqOn[sel] = Number(se.value); stepBtns[sel].textContent = stepLabel(sel); stepBtns[sel].classList.toggle('rest', !state.seqOn[sel]); };
    }
    function markStep(i) {
      if (i === lastMarked) return;
      if (stepBtns[lastMarked]) stepBtns[lastMarked].classList.remove('cur');
      if (stepBtns[i]) stepBtns[i].classList.add('cur');
      lastMarked = i;
    }
    function tellEngine() {
      if (!engineText) return;
      engineText.textContent = backendType === 'loading' ? tx('Audiomotor wordt voorbereid…') : backendType === 'unavailable' ? tx('Deze omgeving biedt geen audioprocessor.')
        : tx('Audiomotor gereed · ') + (playing ? tx('interne klok loopt') : tx('keyboard en testknoppen beschikbaar'));
    }

    // scope: tekent op de klok van de host, alleen als de kaart te zien is
    function readColors() {
      if (!cv) return; const cs = getComputedStyle(cv), v = (n, d) => cs.getPropertyValue(n).trim() || d; colT = performance.now();
      col = { well: v('--well', '#0b171d'), fg: v('--well-fg', '#c7dbe0') };
    }
    function resizeCanvas() {
      if (!cv) return; const dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 3), w = Math.max(200, Math.round(cw * dpr));
      if (cv.width !== w) { cv.width = w; cv.height = Math.round(64 * dpr); }
    }
    function draw() {
      if (dead || !cv || !g2) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const W = cv.width, H = cv.height; if (!scopeData) scopeData = new Float32Array(analyser.fftSize || 1024);
      analyser.getFloatTimeDomainData(scopeData);
      g2.fillStyle = col.well; g2.fillRect(0, 0, W, H); g2.strokeStyle = col.fg; g2.lineWidth = Math.max(1, H / 64); g2.beginPath();
      for (let i = 0; i < scopeData.length; i++) { const x = i / (scopeData.length - 1) * W, y = H / 2 - clamp(Number.isFinite(scopeData[i]) ? scopeData[i] : 0, -1, 1) * H * 0.46; i ? g2.lineTo(x, y) : g2.moveTo(x, y); }
      g2.stroke();
    }
    const drawLoop = (inst, cb, fps) => {
      if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
      let raf = 0, last = 0, stop = false;
      const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
      raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
    };
    const onSkin = () => { col = null; };
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    function teardownUI() {
      stopLoop(); if (ro) { ro.disconnect(); ro = null; }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
      if (mountHost) mountHost.textContent = '';
      mountHost = null; shadow = null; refreshers = []; stepsBox = editorBox = cv = g2 = engineText = null; stepBtns = []; col = null; scopeData = null; lastMarked = -1;
    }

    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        teardownUI(); mountHost = el;
        const wrap = document.createElement('div'); el.appendChild(wrap);
        shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
        add(shadow, 'style', CSS);
        const app = add(shadow, 'div', undefined, 'app');
        const top = add(app, 'div', undefined, 'bar');
        choose(top, tx('Klank'), 'preset', Object.keys(PRESETS).map(k => [k, k]), v => {
          const keep = {}; for (const k of KEEP_ON_SOUND) keep[k] = state[k];
          self.setState({ ...freshState(), ...PRESETS[v], preset: v, ...keep });
        });
        choose(top, tx('Suboctaaf'), 'subOctave', OPTIONS.subOctave.map(([v, t]) => [v, tx(t)]), v => { state.subOctave = Number(v); apply(); });
        choose(top, tx('Prioriteit'), 'priority', OPTIONS.priority.map(([v, t]) => [v, tx(t)]), v => { state.priority = v; apply(); });
        choose(top, 'Legato', 'legato', [[0, tx('Uit')], [1, tx('Aan')]], v => { state.legato = v === '1'; apply(); });
        const play = add(app, 'div', undefined, 'bar');
        const tk = add(play, 'div'); tk.style.cssText = 'min-width:220px;flex:1 1 220px';
        knob(tk, tx('Testnoot'), 24, 96, 1, () => state.testNote, v => { state.testNote = v; }, v => String(v), DEFAULTS.testNote, 'test');
        const b1 = add(play, 'button', tx('Speel noot')); b1.type = 'button'; b1.onclick = () => note(state.testNote, 0.85, ctx.currentTime, 1);
        const b2 = add(play, 'button', tx('Houd noot')); b2.type = 'button';
        b2.onclick = () => { heldDemo = !heldDemo; if (heldDemo) note(state.testNote, 0.8, ctx.currentTime, undefined, true); else panic(); };
        const b3 = add(play, 'button', tx('Alles uit')); b3.type = 'button'; b3.onclick = () => panic();

        const sq = add(app, 'div', undefined, 'sec'); add(sq, 'h4', tx('Sequencer'));
        const sbar = add(sq, 'div', undefined, 'bar');
        choose(sbar, tx('Besturing'), 'mode', OPTIONS.mode.map(([v, t]) => [v, tx(t)]), v => { panic(); state.mode = v; sequenceCounter = 0; buildSteps(); });
        choose(sbar, tx('Nootdeling'), 'division', [[1, '1/16'], [2, '1/8'], [4, '1/4']], v => { state.division = Number(v); });
        choose(sbar, tx('Arp-richting'), 'arpDirection', OPTIONS.arpDirection.map(([v, t]) => [v, tx(t)]), v => { state.arpDirection = v; });
        const lw = add(sbar, 'div'); lw.style.cssText = 'min-width:200px;flex:1 1 200px';
        knob(lw, tx('Lengte'), 1, 32, 1, () => state.length, v => { state.length = v; buildSteps(); }, v => String(v), DEFAULTS.length, 'length');
        stepsBox = add(sq, 'div', undefined, 'pads'); editorBox = add(sq, 'div', undefined, 'bar'); buildSteps();

        for (const lane of Object.keys(LANES)) {
          const sec = add(app, 'div', undefined, 'sec'); add(sec, 'h4', tx(LANES[lane]));
          const kn = add(sec, 'div', undefined, 'knobs');
          for (const id of Object.keys(SPEC)) if (SPEC[id].lane === lane) paramKnob(kn, id);
        }
        cv = add(app, 'canvas'); cv.setAttribute('aria-label', tx('Golfvorm van de uitgang')); g2 = cv.getContext('2d'); cw = cv.clientWidth || 600; resizeCanvas();
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) { cw = w; resizeCanvas(); } }); ro.observe(cv); }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        engineText = add(app, 'p', undefined, 'note'); tellEngine();
        stopLoop(); stopDraw = drawLoop(self, draw, 30);
      },
      unmount() { teardownUI(); },
      onEvent: event,
      onStep: step,
      onTransport(e) { if (dead) return; playing = !!(e && e.playing); lastStep = ''; sequenceCounter = 0; if (!playing) { panic(); markStep(-1); } tellEngine(); },
      params() {
        return Object.entries(SPEC).map(([id, d]) => ({ id, name: tx(d.name), lane: d.lane, laneName: tx(LANES[d.lane]), min: d.min, max: d.max, scale: d.scale, role: d.role, drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' }));
      },
      modulate(raw) {
        mod = {};
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in SPEC) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1);
        apply();
      },
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) {
        if (dead) return;
        const keep = {}; for (const k of PRESET_SKIP) keep[k] = state[k];
        self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep });
      },
      getState() { const copy = { ...state }; copy.seqNotes = state.seqNotes.slice(); copy.seqOn = state.seqOn.slice(); return copy; },
      setState(raw) {
        if (dead) return;
        panic(); state = normalize(raw); lastStep = ''; sequenceCounter = 0; apply();
        refreshAll(); buildSteps(); markStep(-1);
      },
      destroy() {
        if (dead) return;
        panic(); dead = true; teardownUI();
        if (backendType === 'worklet') { try { backend.port.postMessage({ type: 'close' }); backend.port.close(); } catch (err) { /* al dicht */ } }
        pending = [];
        for (const n of nodes) { try { n.disconnect(); } catch (err) { /* al los */ } }
        nodes.clear();
      },
    };
    apply();
    return self;
  },
};
