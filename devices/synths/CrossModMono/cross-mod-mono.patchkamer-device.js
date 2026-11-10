// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Regelaars herkenbaar voor skins (host.ui.adopt, id = state-sleutel, groep = spoor of setup/play/seq) en elk spoor in een eigen element (zonder skin display:contents, dus ongewijzigd uiterlijk);
//   de scope volgt zijn CSS-hoogte. Geluid, state, params() en poorten ongewijzigd. Lengte blijft een gewone schuif (een nieuwe lengte bouwt de UI opnieuw op); testNote en length staan bewust in modExclude.
// 1.12.0 — Uitleg naar about (menu Over Cross Mod Mono); de UI toont geen uitlegtekst meer.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Cross Mod Mono en een nieuwe id (nl.patchkamer.crossmodmono); tunes en songs uit de vorige versie verwijzen
//   naar de oude id. Alleen de eigen motor blijft over (geen code meer voor andere varianten); het geluid is bit-identiek aan de vorige versie.
//   - tweetalig (host.lang, namen per taal in i18n); de worklet wordt via host.loadWorklet geladen
//   - setState volgt §13: onbekende velden negeren, getallen afkappen, ongeldige waarden op de standaard, en alle knoppen en keuzes volgen
//   - bewaker: een niet-eindige toestand in de stem of in de uitgangsfilter wordt teruggezet, en parameters worden alleen eindig geaccepteerd
//   - de scope tekent via host.frame (ResizeObserver en kleurcache); kleuren komen uit de host
//   - de modus (keyboard, eigen patroon, arpeggiator), de arp-richting en de nootprioriteit zitten nu echt in de state; een stap kiezen kan niet meer buiten de lengte
//   - een klank kiezen laat het patroon en de modus staan
// Een monofone synth met twee oscillatoren: hard sync, audio-rate kruismodulatie (oscillator B moduleert de toonhoogte van A en de cutoff),
// twee envelopes, een tweepolig lowpass-filter, een LFO, portamento en een eigen 32-staps patroon of arpeggiator.

// De motor draait in een AudioWorklet (en als terugval in een ScriptProcessor). De klasse moet zelfstandig zijn: ze wordt als tekst in de worklet gezet.
class CrossModEngine {
  constructor(sr, p) {
    this.sr = sr; this.p = { ...p }; this.target = {};
    for (const k in p) if (typeof p[k] === 'number' && Number.isFinite(p[k])) this.target[k] = p[k];
    this.queue = []; this.v = null; this.keys = []; this.serial = 0; this.frame = 0; this.seed = 197903; this.lfoPhase = 0;
    this.dc = 0; this.last = 0;
  }
  setParams(p) {
    if (!p || typeof p !== 'object') return;
    this.target = {};
    for (const k in p) {
      if (typeof p[k] === 'number') { if (Number.isFinite(p[k])) this.target[k] = p[k]; } else this.p[k] = p[k];
    }
    if (this.keys.length) this.updateMono();
  }
  random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  enqueue(e) {
    if (!Number.isFinite(e && e.time)) return;
    const v = { ...e };
    if (v.type === 'panic' || v.type === 'allnotesoff') this.queue = this.queue.filter(x => x.time < v.time);
    if (v.type === 'note' || v.type === 'noteon') {
      v.token = ++this.serial;
      if (!v.held && Number.isFinite(v.dur)) this.queue.push({ type: 'autooff', token: v.token, time: v.time + Math.max(0.005, v.dur) });
    }
    this.queue.push(v); this.queue.sort((a, b) => a.time - b.time);
    if (this.queue.length > 2048) this.queue.splice(0, this.queue.length - 2048);
  }
  newEg() { return { value: 0, stage: 'attack', age: 0 }; }
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
  newVoice(note, vel, token) {
    const f = 440 * 2 ** ((note - 69) / 12);
    return { note, note2: note, vel, token, gate: true, p1: 0, p2: 0, freq: f, freq2: f, amp: this.newEg(), env: this.newEg(),
      filter: [{ x: 0, y: 0 }, { x: 0, y: 0 }], g: 0.1, k: 1, alive: true };
  }
  event(e) {
    const type = e.type;
    if (type === 'control') { this.setParams(e.params); return; }
    if (type === 'panic' || type === 'allnotesoff') { this.keys = []; if (this.v) this.v.gate = false; return; }
    if (type === 'note' || type === 'noteon') {
      if (!(e.vel > 0)) { this.event({ type: 'noteoff', note: e.note }); return; }
      const was = this.keys.length;
      this.keys = this.keys.filter(k => k.note !== e.note); this.keys.push({ note: e.note, vel: e.vel, token: e.token });
      let v = this.v;
      if (!v) { v = this.newVoice(e.note, e.vel, e.token); this.v = v; }
      this.updateMono(); v.gate = true; v.vel = e.vel; v.token = e.token;
      if (!was || !this.p.legato || e.retrigger) { v.amp = this.newEg(); v.env = this.newEg(); }
      return;
    }
    if (type === 'noteoff' || type === 'autooff') {
      const matches = k => type === 'autooff' ? k.token === e.token : k.note === e.note;
      this.keys = this.keys.filter(k => !matches(k));
      if (!this.keys.length) { if (this.v) this.v.gate = false; } else this.updateMono();
    }
  }
  updateMono() {
    const v = this.v; if (!v || !this.keys.length) return;
    const sorted = this.keys.slice().sort((a, b) => a.note - b.note);
    const sel = this.p.priority === 'low' ? sorted[0] : this.p.priority === 'high' ? sorted[sorted.length - 1] : this.keys[this.keys.length - 1];
    v.note = sel.note; v.note2 = sel.note; v.vel = sel.vel;
  }
  blep(t, dt) {
    if (t < dt) { t /= dt; return t + t - t * t - 1; }
    if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
    return 0;
  }
  osc(phase, dt, wave, pw) {
    if (wave === 'triangle') return 1 - 4 * Math.abs(phase - 0.5);
    if (wave === 'square') {
      const w = Math.max(0.05, Math.min(0.95, pw));
      let v = phase < w ? 1 : -1;
      v += this.blep(phase, dt); v -= this.blep((phase - w + 1) % 1, dt);
      return v;
    }
    return 2 * phase - 1 - this.blep(phase, dt);
  }
  svf(x, s, g, k) {
    const a = 1 / (1 + g * (g + k)), v1 = (s.x + g * (x - s.y)) * a, v2 = s.y + g * v1;
    s.x = Math.max(-8, Math.min(8, 2 * v1 - s.x)); s.y = Math.max(-8, Math.min(8, 2 * v2 - s.y));
    return v2;
  }
  // Eén sample van de stem. Oscillator B (v.p2) moduleert de toonhoogte van A (fm) en de cutoff (audioFilter); sync zet B terug bij elke cyclus van A.
  voiceSample(v, lfo) {
    const p = this.p, sr = this.sr;
    const a = this.eg(v.amp, v.gate, p.attack || 0.005, p.decay || 0.3, p.sustain ?? 0.7, p.release || 0.2);
    const e = this.eg(v.env, v.gate, p.fAttack, p.fDecay, p.fSustain, p.fRelease);
    const transpose = (p.transpose || 0) + (p.vibrato || 0) * lfo / 100;
    const freq = 440 * 2 ** ((v.note - 69 + transpose) / 12);
    const freq2 = p.oscBLow ? 0.5 * 2 ** ((p.osc2Semi || 0) / 12) : 440 * 2 ** ((v.note2 - 69 + transpose + (p.osc2Semi || 0) + (p.osc2Fine || 0) / 100) / 12);
    const glide = Math.max(0.0001, p.glide || 0.0001), gcoef = Math.min(1, 5 / (glide * sr));
    v.freq += (freq - v.freq) * gcoef; v.freq2 += (freq2 - v.freq2) * gcoef;
    const pw = Math.max(0.05, Math.min(0.95, (p.pw || 0.5) + (p.pwm || 0) * lfo * 0.43));
    const dt2 = Math.min(0.45, v.freq2 / sr), b = this.osc(v.p2, dt2, p.wave2 || 'sawtooth', pw);
    const dt = Math.max(0.00001, Math.min(0.45, (v.freq + b * (p.fm || 0) * v.freq) / sr));
    let x = this.osc(v.p1, dt, p.wave || 'sawtooth', pw) * (p.osc1 ?? 0.7);
    x += b * (p.osc2 || 0);
    x += this.random() * (p.noise || 0);
    v.p1 += dt; const wrapped = v.p1 >= 1; v.p1 %= 1; v.p2 = (v.p2 + dt2) % 1;
    if (p.sync && wrapped) v.p2 = 0;
    if ((this.frame & 15) === 0) {
      const tracking = (p.keytrack ?? 0.5) * (v.note - 60) / 12;
      const cut = Math.max(25, Math.min(sr * 0.43, (p.cutoff || 2500) * 2 ** ((p.filterEnv || 0) * e + (p.lfoFilter || 0) * lfo * 3 + tracking + b * (p.audioFilter || 0) * 4)));
      v.g = Math.tan(Math.PI * cut / sr); v.k = Math.max(0.07, 2 - (p.resonance || 0) * 1.93);
    }
    x = Math.tanh(x * (1 + (p.drive || 0) * 5));
    x = this.svf(x, v.filter[0], v.g, v.k);
    x = this.svf(x, v.filter[1], v.g, Math.max(0.35, v.k));
    v.alive = v.gate || a > 0.00001;
    return Math.tanh(x) * a * v.vel * 0.55;
  }
  // Bewaker: een stem met een niet-eindige toestand begint opnieuw (de noot blijft gelden)
  heal(v) {
    v.filter[0].x = v.filter[0].y = v.filter[1].x = v.filter[1].y = 0; v.p1 = 0; v.p2 = 0; v.g = 0.1; v.k = 1;
    v.freq = 440 * 2 ** ((v.note - 69) / 12); v.freq2 = v.freq; v.amp = this.newEg(); v.env = this.newEg();
  }
  process(left, right, time) {
    const sr = this.sr;
    for (let i = 0; i < left.length; i++) {
      const t = time + i / sr;
      while (this.queue.length && this.queue[0].time <= t + 1e-10) this.event(this.queue.shift());
      if ((this.frame & 31) === 0) for (const k in this.target) this.p[k] += (this.target[k] - this.p[k]) * 0.04;
      const p = this.p; this.lfoPhase += (p.lfoRate || 1) / sr;
      if (this.lfoPhase >= 1) { this.lfoPhase %= 1; this.random(); }   // trekt uit dezelfde ruisreeks: houdt het geluid gelijk aan de vorige versie
      const lfo = p.lfoWave === 'square' ? (this.lfoPhase < 0.5 ? 1 : -1) : p.lfoWave === 'sawtooth' ? this.lfoPhase * 2 - 1 : 1 - 4 * Math.abs(this.lfoPhase - 0.5);
      let l = 0;
      const v = this.v;
      if (v) {
        l = this.voiceSample(v, lfo);
        if (!Number.isFinite(l) || !Number.isFinite(v.filter[0].x + v.filter[0].y + v.filter[1].x + v.filter[1].y + v.p1 + v.p2 + v.freq + v.freq2)) { l = 0; this.heal(v); }
        if (v.alive === false) this.v = null;
      }
      const y = l - this.last + 0.995 * this.dc;
      this.last = l; this.dc = Number.isFinite(y) ? y : 0;
      const o = Number.isFinite(y) ? 0.9 * Math.tanh(y / 0.9) : 0;
      left[i] = o; right[i] = o; this.frame++;
    }
  }
}

const WNAME = 'nl-patchkamer-crossmodmono-1-11-0';
const WORKLET = CrossModEngine.toString() + `
registerProcessor(${JSON.stringify(WNAME)}, class extends AudioWorkletProcessor {
  constructor(options) {
    super(); this.engine = new CrossModEngine(sampleRate, options.processorOptions.params); this.closed = false;
    this.port.onmessage = e => {
      const m = e.data; if (!m) return;
      if (m.type === 'params') this.engine.setParams(m.params); else if (m.type === 'event') this.engine.enqueue(m.event); else if (m.type === 'close') this.closed = true;
    };
  }
  process(inputs, outputs) {
    if (this.closed) return false;
    const out = outputs[0]; if (out && out.length) this.engine.process(out[0], out[1] || out[0], currentTime);
    return true;
  }
});`;

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, het Engels staat in dit woordenboek; wat er niet in staat, blijft gelijk.
const EN = {
  'Resonantie': 'Resonance', 'Filter-EG': 'Filter envelope', 'Pulsbreedte': 'Pulse width', 'PWM-diepte': 'PWM depth', 'Ruis': 'Noise',
  'LFO-snelheid': 'LFO rate', 'Transpositie': 'Transpose', 'Uitgang': 'Output level', 'Osc A niveau': 'Osc A level', 'Osc B niveau': 'Osc B level',
  'Osc B fijn': 'Osc B fine', 'Gatelengte': 'Gate length', 'Versterker / envelope': 'Amplifier / envelope', 'Versterker': 'Amplifier', 'Oscillatoren': 'Oscillators', 'Modulatie': 'Modulation',
  'Filters': 'Filter', 'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Driehoek': 'Triangle', 'Osc A golf': 'Osc A wave', 'Osc B golf': 'Osc B wave',
  'Osc B laag': 'Osc B low', 'LFO-vorm': 'LFO shape', 'Uit': 'Off', 'Aan': 'On', 'Klank': 'Sound', 'Nootprioriteit': 'Note priority',
  'Laatste': 'Last', 'Laagste': 'Lowest', 'Hoogste': 'Highest', 'Testnoot (MIDI)': 'Test note (MIDI)', 'Speel noot': 'Play note', 'Houd noot': 'Hold note',
  'Alles uit': 'All off', 'Besturing': 'Control', 'Keyboard / externe sequencer': 'Keyboard / external sequencer', 'Eigen patroon': 'Own pattern',
  'Nootdeling': 'Note division', 'Arp-richting': 'Arp direction', 'Omhoog': 'Up', 'Omlaag': 'Down', 'Lengte': 'Length', 'Stap {0}': 'Step {0}',
  'Noot': 'Note', 'Speelt': 'Plays', 'Rust': 'Rest', 'rust': 'rest',
  'Golfvorm van de uitgang': 'Output waveform',
  'Audiomotor wordt voorbereid…': 'Preparing audio engine…', 'Deze omgeving biedt geen audioprocessor.': 'This environment has no audio processor.',
  'Audiomotor gereed · interne klok loopt': 'Audio engine ready · internal clock running',
  'Audiomotor gereed · keyboard en testknoppen beschikbaar': 'Audio engine ready · keyboard and test buttons available',
  'Interne klok · {0} BPM · stap {1}': 'Internal clock · {0} BPM · step {1}',
};

// Regelaars: id, Nederlandse naam, min, max, rol, schaal, eenheid, spoor, stap
const LANES = { filter: 'Filters', amp: 'Versterker / envelope', source: 'Oscillatoren', motion: 'Modulatie', master: 'Master' };
const SPEC = [
  ['cutoff', 'Cutoff', 30, 16000, 'filter', 'log', 'Hz', 'filter', 0.01],
  ['resonance', 'Resonantie', 0, 1, 'res', 'lin', '', 'filter', 0.01],
  ['filterEnv', 'Filter-EG', -5, 5, 'env', 'lin', '', 'filter', 0.01],
  ['keytrack', 'Key tracking', 0, 1, 'pitch', 'lin', '', 'filter', 0.01],
  ['attack', 'VCA attack', 0.001, 4, 'env', 'log', 's', 'amp', 0.01],
  ['decay', 'VCA decay', 0.01, 8, 'decay', 'log', 's', 'amp', 0.01],
  ['sustain', 'VCA sustain', 0, 1, 'env', 'lin', '', 'amp', 0.01],
  ['release', 'VCA release', 0.01, 8, 'decay', 'log', 's', 'amp', 0.01],
  ['pw', 'Pulsbreedte', 0.05, 0.95, 'color', 'lin', '', 'source', 0.01],
  ['pwm', 'PWM-diepte', 0, 1, 'color', 'lin', '', 'motion', 0.01],
  ['noise', 'Ruis', 0, 1, 'texture', 'lin', '', 'source', 0.01],
  ['lfoRate', 'LFO-snelheid', 0.05, 30, 'motion', 'log', 'Hz', 'motion', 0.01],
  ['vibrato', 'LFO → pitch', 0, 120, 'pitch', 'lin', 'cent', 'motion', 0.01],
  ['lfoFilter', 'LFO → filter', 0, 1, 'filter', 'lin', '', 'filter', 0.01],
  ['drive', 'Drive', 0, 1, 'color', 'lin', '', 'master', 0.01],
  ['glide', 'Portamento', 0.001, 1, 'glide', 'log', 's', 'motion', 0.01],
  ['transpose', 'Transpositie', -24, 24, 'pitch', 'lin', 'st', 'source', 1],
  ['level', 'Uitgang', 0, 1, 'level', 'lin', '', 'master', 0.01],
  ['fAttack', 'Filter attack', 0.001, 4, 'env', 'log', 's', 'filter', 0.01],
  ['fDecay', 'Filter decay', 0.01, 8, 'decay', 'log', 's', 'filter', 0.01],
  ['fSustain', 'Filter sustain', 0, 1, 'env', 'lin', '', 'filter', 0.01],
  ['fRelease', 'Filter release', 0.01, 8, 'decay', 'log', 's', 'filter', 0.01],
  ['osc1', 'Osc A niveau', 0, 1, 'level', 'lin', '', 'source', 0.01],
  ['osc2', 'Osc B niveau', 0, 1, 'level', 'lin', '', 'source', 0.01],
  ['osc2Semi', 'Osc B interval', -24, 24, 'pitch', 'lin', 'st', 'source', 1],
  ['osc2Fine', 'Osc B fijn', -35, 35, 'pitch', 'lin', 'cent', 'source', 0.01],
  ['fm', 'Osc B → A FM', 0, 3, 'color', 'lin', '', 'motion', 0.01],
  ['audioFilter', 'Osc B → filter', 0, 1, 'filter', 'lin', '', 'motion', 0.01],
  ['gate', 'Gatelengte', 0.1, 1, 'env', 'lin', '', 'motion', 0.01],
].map(([id, name, min, max, role, scale, unit, lane, step]) => ({ id, name, min, max, role, scale, unit, lane, step }));
const SPEC_BY_ID = Object.fromEntries(SPEC.map(d => [d.id, d]));

const DEF = {
  cutoff: 1200, resonance: 0.25, filterEnv: 3, keytrack: 0.5, attack: 0.008, decay: 0.3, sustain: 0.65, release: 0.3, pw: 0.5, pwm: 0.2, noise: 0,
  lfoRate: 2, vibrato: 0, lfoFilter: 0, drive: 0.1, glide: 0.005, transpose: 0, level: 0.75, fAttack: 0.005, fDecay: 0.25, fSustain: 0.15, fRelease: 0.3,
  osc1: 0.7, osc2: 0.5, osc2Semi: 0, osc2Fine: 5, fm: 0, audioFilter: 0, gate: 0.65,
  testNote: 48, preset: 'Twin Saw Bass', wave: 'sawtooth', wave2: 'sawtooth', legato: true, sync: false, oscBLow: false, priority: 'last', lfoWave: 'triangle',
  mode: 'notes', division: 1, length: 16, selected: 0, arpDirection: 'up',
  seqNotes: [36, 36, 48, 43, 39, 36, 46, 43, 36, 48, 39, 43, 34, 36, 43, 46, 36, 36, 48, 43, 39, 36, 46, 43, 36, 48, 39, 43, 34, 36, 43, 46],
  seqOn: [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
};
const OPTIONS = {   // sleutel: [[waarde, Nederlandse tekst], …]
  wave: [['sawtooth', 'Zaagtand'], ['square', 'Puls']],
  wave2: [['sawtooth', 'Zaagtand'], ['square', 'Puls'], ['triangle', 'Driehoek']],
  lfoWave: [['sawtooth', 'Zaagtand'], ['square', 'Puls'], ['triangle', 'Driehoek']],
  priority: [['last', 'Laatste'], ['low', 'Laagste'], ['high', 'Hoogste']],
  mode: [['notes', 'Keyboard / externe sequencer'], ['sequence', 'Eigen patroon'], ['arp', 'Arpeggiator']],
  arpDirection: [['up', 'Omhoog'], ['down', 'Omlaag']],
};
const LABELS = { wave: 'Osc A golf', wave2: 'Osc B golf', lfoWave: 'LFO-vorm', priority: 'Nootprioriteit', sync: 'Hard sync', oscBLow: 'Osc B laag', legato: 'Legato' };
const SHORT = { amp: 'Versterker' };   // kortere titel voor een skin (data-t)
const BOOLEANS = ['legato', 'sync', 'oscBLow'];
// Klanken (state-waarden, taalneutraal): alleen wat afwijkt van de standaard
const PRESETS = {
  'Twin Saw Bass': { cutoff: 1200, filterEnv: 3, fDecay: 0.25 },
  'Sync Blade': { sync: true, osc2Semi: 19, osc2Fine: 0, osc1: 0.2, osc2: 0.9, cutoff: 5200 },
  'Cross Mod Metal': { fm: 1.1, osc2Semi: 7, osc2: 0.2, cutoff: 7000 },
  'Low B Motion': { oscBLow: true, fm: 0.2, audioFilter: 0.5, osc2: 0, osc2Semi: -12 },
  'Detroit Pluck': { cutoff: 800, filterEnv: 3.5, sustain: 0, decay: 0.3, fDecay: 0.16 },
  'Long Unison Lead': { cutoff: 6000, filterEnv: 1, glide: 0.09, osc2Fine: 12, release: 0.8 },
};
const PERFORMANCE = ['mode', 'division', 'length', 'selected', 'arpDirection', 'seqNotes', 'seqOn', 'testNote', 'priority'];   // blijft staan als je een klank kiest
const PRESET_SKIP = ['testNote', 'selected'];   // werkstand, geen klank
const ENGINE_KEYS = [...SPEC.map(d => d.id).filter(id => id !== 'level' && id !== 'gate'), 'wave', 'wave2', 'lfoWave', 'legato', 'sync', 'oscBLow', 'priority'];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
const copyState = s => { const c = { ...s }; for (const k in c) if (Array.isArray(c[k])) c[k] = c[k].slice(); return c; };
// terugval voor een host zonder host.frame (contract §12b)
const drawLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

const CSS = `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:var(--audio,#4fd1c5);--x-acc2:var(--event,#f4a261);--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}
.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}
p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted,#adc3c9)}
button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}
button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}
button.active{background:color-mix(in srgb,var(--x-acc) 38%,var(--field,#223640));border-color:var(--x-acc)}
input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}
.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pads button{min-height:64px;text-align:left;white-space:pre-line}.pads button.cur{border-color:var(--sel,#9b8cff);border-width:2px}
h3{font-size:13px;color:var(--x-ink2);margin:14px 0 8px}label{min-width:0}.grp{display:contents}
canvas{display:block;width:100%;height:64px;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px}`;

export default {
  id: 'nl.patchkamer.crossmodmono',
  name: 'Cross Mod Mono',
  version: '1.13.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 920, minWidth: 380 },
  modExclude: ['testNote', 'length'],
  about: { nl: 'Een monofone synth met twee oscillatoren, hard sync, kruismodulatie op audiosnelheid, twee envelopes, een tweepolig lowpass-filter, een LFO, portamento en een eigen patroon van 32 stappen of een arpeggiator.\n\nOscillator B kan de toonhoogte van A en het filter moduleren. Osc B laag maakt B tot een langzame modulator. Sync zet de fase van B terug bij elke cyclus van A. De Mod-ingang verandert de klank zonder de basiswaarden te overschrijven.', en: 'A monophonic synth with two oscillators, hard sync, audio-rate cross modulation, two envelopes, a two-pole lowpass filter, an LFO, portamento and its own 32-step pattern or an arpeggiator.\n\nOscillator B can modulate the pitch of A and the filter. Osc B low turns B into a slow modulator. Sync resets the phase of B at every cycle of A. The Mod input changes the sound without overwriting the base values.' },
  i18n: { en: { ports: { notes: 'Keyboard / notes' } } },
  ports: {
    audioIn: [], audioOut: [{ id: 'out', name: 'Stereo' }],
    eventIn: [{ id: 'notes', name: 'Keyboard / noten' }], eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }], modOut: [],
  },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let state = copyState(DEF), mod = {}, effective = {}, dead = false;
    const nodes = new Set();
    const own = n => (nodes.add(n), n);
    const dispose = () => { for (const n of nodes) try { n.disconnect(); } catch (e) {} nodes.clear(); };

    function resolve() {
      const e = { ...state };
      for (const d of SPEC) { const x = mod[d.id] || 0; e[d.id] = clamp(d.scale === 'log' ? state[d.id] * (d.max / d.min) ** x : state[d.id] + x * (d.max - d.min), d.min, d.max); }
      effective = e; return e;
    }
    resolve();
    const engineParams = () => { const o = {}; for (const k of ENGINE_KEYS) o[k] = effective[k]; return o; };

    // ---- geluidsketen: motor → volume → compressor → begrenzer (uitgang) ----
    const volume = own(ctx.createGain()); volume.gain.value = state.level;
    const comp = own(ctx.createDynamicsCompressor());
    comp.threshold.value = -10; comp.ratio.value = 5; comp.knee.value = 8; comp.attack.value = 0.003; comp.release.value = 0.18;
    const out = own(ctx.createWaveShaper());
    { const c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); out.curve = c; }
    out.oversample = (host.audio && host.audio.oversample) || '2x';
    const analyser = own(ctx.createAnalyser()); analyser.fftSize = 1024;
    volume.connect(comp); comp.connect(out); out.connect(analyser);

    // ---- motor: AudioWorklet, of een ScriptProcessor als terugval ----
    let backend = null, backendType = 'loading', pending = [], generation = 0, localEngine = null;
    function engineMessage(m) {
      if (dead) return;
      if (backendType === 'worklet') backend.port.postMessage(m);
      else if (backendType === 'script') { if (m.type === 'params') localEngine.setParams(m.params); else localEngine.enqueue(m.event); }
      else if (backendType === 'loading' && m.type === 'event') { pending.push(m.event); if (pending.length > 1024) pending.shift(); }
    }
    const send = e => engineMessage({ type: 'event', event: e });
    function apply() { if (dead) return; resolve(); volume.gain.setTargetAtTime(effective.level, ctx.currentTime, 0.025); engineMessage({ type: 'params', params: engineParams() }); }
    async function init() {
      const id = ++generation;
      try {
        if (typeof host.loadWorklet === 'function' && ctx.audioWorklet && typeof globalThis.AudioWorkletNode === 'function') {
          await host.loadWorklet(WNAME, WORKLET);
          if (dead || id !== generation) return;
          backend = own(new globalThis.AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { params: engineParams() } }));
          backendType = 'worklet'; backend.connect(volume);
          for (const e of pending) backend.port.postMessage({ type: 'event', event: e });
          pending = []; tellEngine(); return;
        }
      } catch (e) { /* terugval hieronder */ }
      if (dead || id !== generation) return;
      if (typeof ctx.createScriptProcessor === 'function') {
        localEngine = new CrossModEngine(ctx.sampleRate, engineParams());
        backend = own(ctx.createScriptProcessor(1024, 0, 2)); backendType = 'script';
        backend.onaudioprocess = ev => { if (!dead) localEngine.process(ev.outputBuffer.getChannelData(0), ev.outputBuffer.getChannelData(1), Number.isFinite(ev.playbackTime) ? ev.playbackTime : ctx.currentTime); };
        backend.connect(volume);
        for (const e of pending) localEngine.enqueue(e);
        pending = [];
      } else backendType = 'unavailable';
      tellEngine();
    }

    // ---- noten, klok, patroon ----
    let playing = null, lastStep = '', sequenceCounter = 0, arpQueue = [], arpKeys = new Map(), arpToken = 0, heldDemo = false;
    const stepDuration = info => Number.isFinite(info && info.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info && info.bpm) && info.bpm > 0 ? 15 / info.bpm : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0;
    function panic(t = ctx.currentTime) { heldDemo = false; if (ui.hold) ui.hold.classList.remove('active'); arpQueue = []; arpKeys.clear(); send({ type: 'allnotesoff', time: t }); }
    function note(n, vel, t, dur, held = false) { send({ type: 'note', note: Math.round(clamp(n, 0, 127)), vel: clamp(vel, 0, 1), time: t, dur, held }); }
    const cleanType = e => String(e && e.type || '').toLowerCase().replace(/[_-]/g, '');

    function onEvent(port, e) {
      try {
        if (dead || port !== 'notes' || !Number.isFinite(e && e.time)) return;
        const type = cleanType(e), time = Math.max(ctx.currentTime, e.time);
        if (type === 'panic' || type === 'allnotesoff') { panic(time); return; }
        if (type === 'cc' && Object.hasOwn(SPEC_BY_ID, e.id) && Number.isFinite(e.value)) {
          const d = SPEC_BY_ID[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min);
          resolve(); volume.gain.setTargetAtTime(effective.level, time, 0.025); send({ type: 'control', params: engineParams(), time });
          if (ui[e.id]) ui[e.id].set(state[e.id]);
          return;
        }
        if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(e.note)) return;
        const n = {
          type: type === 'noteoff' || e.vel === 0 ? 'noteoff' : type, note: Math.round(clamp(e.note, 0, 127)), vel: finite(e.vel, 0.8, 0, 1), time,
          held: e.held === true || type === 'noteon' && !Number.isFinite(e.dur), dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1,
        };
        if (state.mode === 'arp') {
          n.token = ++arpToken; arpQueue.push(n);
          if (n.type !== 'noteoff' && !n.held) arpQueue.push({ type: 'autooff', token: n.token, note: n.note, time: time + n.dur });
          arpQueue.sort((a, b) => a.time - b.time); if (arpQueue.length > 512) arpQueue.splice(0, arpQueue.length - 512);
          return;
        }
        if (state.mode === 'sequence') return;
        send(n);
      } catch (err) { /* nooit gooien uit onEvent */ }
    }
    function onStep(info) {
      try {
        if (dead || playing === false || !Number.isFinite(info && info.time) || !Number.isInteger(info.step)) return;
        const sd = stepDuration(info); if (!sd) return;
        const key = info.time + ':' + info.step; if (key === lastStep) return; lastStep = key;
        if (state.mode === 'notes' || info.step % state.division) return;
        const i = sequenceCounter++ % state.length;
        if (state.mode === 'sequence') { if (state.seqOn[i]) note(state.seqNotes[i], 0.85, info.time, sd * state.division * effective.gate); }
        else {
          while (arpQueue.length && arpQueue[0].time <= info.time) {
            const e = arpQueue.shift();
            if (e.type === 'noteoff') arpKeys.delete(e.note);
            else if (e.type === 'autooff') { if (arpKeys.get(e.note) && arpKeys.get(e.note).token === e.token) arpKeys.delete(e.note); }
            else arpKeys.set(e.note, { vel: e.vel, token: e.token });
          }
          const notes = [...arpKeys.keys()].sort((a, b) => a - b);
          if (notes.length) { const j = state.arpDirection === 'down' ? notes.length - 1 - i % notes.length : i % notes.length; note(notes[j], arpKeys.get(notes[j]).vel, info.time, sd * state.division * effective.gate); }
        }
        stepButtons.forEach((b, j) => b.classList.toggle('cur', j === i));
        if (ui.status) ui.status.textContent = tx('Interne klok · {0} BPM · stap {1}', Math.round(15 / sd), i + 1);
      } catch (err) { /* nooit gooien uit onStep */ }
    }

    // ---- state ----
    function normalize(raw) {
      const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}, next = copyState(DEF);
      for (const d of SPEC) next[d.id] = finite(s[d.id], DEF[d.id], d.min, d.max);
      for (const id in OPTIONS) next[id] = typeof s[id] === 'string' && OPTIONS[id].some(([v]) => v === s[id]) ? s[id] : DEF[id];
      for (const id of BOOLEANS) next[id] = typeof s[id] === 'boolean' ? s[id] : DEF[id];
      next.preset = typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset) ? s.preset : DEF.preset;
      next.testNote = Math.round(finite(s.testNote, DEF.testNote, 24, 96));
      next.division = [1, 2, 4].includes(s.division) ? s.division : DEF.division;
      next.length = Math.round(finite(s.length, DEF.length, 1, 32));
      next.selected = Math.min(next.length - 1, Math.round(finite(s.selected, DEF.selected, 0, 31)));
      const arr = (a, d, lo, hi) => Array.from({ length: 32 }, (_, i) => Math.round(finite(Array.isArray(a) ? a[i] : undefined, d[i], lo, hi)));
      next.seqNotes = arr(s.seqNotes, DEF.seqNotes, 24, 96); next.seqOn = arr(s.seqOn, DEF.seqOn, 0, 1);
      return next;
    }

    // ---- UI ----
    let wrap = null, panel = null, ui = {}, stepButtons = [], scope = null, scopeCtx = null, scopeData = null, scopeW = 300, scopeH = 64, ro = null, col = null, colT = 0, stopDraw = null;
    const add = (parent, tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; parent.appendChild(el); return el; };
    const row = parent => add(parent, 'div', undefined, 'row');
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    const adopt = (el, id, role, label, group) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    function select(parent, label, options, value, change, meta) {
      const box = add(parent, 'label', undefined, 'control'); add(box, 'span', label);
      const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); }
      el.value = String(value); el.onchange = () => change(el.value); if (meta) adopt(el, meta[0], 'select', label, meta[1]); return el;
    }
    // schuif met getal ernaast; logaritmische parameters lopen over een schuif van 0…1; dubbelklik = beginwaarde via data-pk-default
    function knob(parent, id, label, [min, max, step], value, def, change, format, log, group) {
      const box = add(parent, 'label', undefined, 'control'); add(box, 'span', label);
      const o = add(box, 'output'), input = add(box, 'input'); input.type = 'range';
      const pos = v => log ? Math.log(v / log.min) / Math.log(log.max / log.min) : v, val = x => log ? log.min * (log.max / log.min) ** x : x;
      input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(pos(value)); input.dataset.pkDefault = String(pos(def));
      o.textContent = format(value); if (group) adopt(input, id, 'param', label, group);
      input.oninput = () => { const v = val(Number(input.value)); o.textContent = format(v); change(v); };
      ui[id] = { set(v) { input.value = String(pos(v)); o.textContent = format(v); } };
    }
    function controls(parent, ids) {
      for (const id of ids) {
        const d = SPEC_BY_ID[id], fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
        const change = v => { state[id] = v; apply(); };
        if (d.scale === 'log') knob(parent, id, tx(d.name), [0, 1, 0.001], state[id], DEF[id], change, fmt, d, d.lane);
        else knob(parent, id, tx(d.name), [d.min, d.max, d.step], state[id], DEF[id], change, fmt, undefined, d.lane);
      }
    }
    function tellEngine() {
      if (!ui.status) return;
      ui.status.textContent = backendType === 'loading' ? tx('Audiomotor wordt voorbereid…') : backendType === 'unavailable' ? tx('Deze omgeving biedt geen audioprocessor.')
        : tx(playing ? 'Audiomotor gereed · interne klok loopt' : 'Audiomotor gereed · keyboard en testknoppen beschikbaar');
    }
    function sequenceUI(parent) {
      const settings = row(parent);
      select(settings, tx('Besturing'), OPTIONS.mode.map(([v, t]) => [v, tx(t)]), state.mode, v => { panic(); state.mode = v; sequenceCounter = 0; buildUI(); }, ['mode', 'seq']);
      select(settings, tx('Nootdeling'), [[1, '1/16'], [2, '1/8'], [4, '1/4']], state.division, v => { state.division = +v; }, ['division', 'seq']);
      select(settings, tx('Arp-richting'), OPTIONS.arpDirection.map(([v, t]) => [v, tx(t)]), state.arpDirection, v => { state.arpDirection = v; }, ['arpDirection', 'seq']);
      knob(settings, 'length', tx('Lengte'), [1, 32, 1], state.length, DEF.length, v => { state.length = v; state.selected = Math.min(state.selected, v - 1); sequenceCounter = 0; buildUI(); }, v => String(v));
      if (state.mode !== 'sequence') return;
      const pads = add(parent, 'div', undefined, 'pads');
      stepButtons = state.seqNotes.slice(0, state.length).map((n, i) => button(pads, (i + 1) + ' · ' + (state.seqOn[i] ? n : tx('rust')), () => { state.selected = i; buildUI(); }));
      const editor = row(parent), i = state.selected;
      add(editor, 'span', tx('Stap {0}', i + 1));
      knob(editor, 'seqNote', tx('Noot'), [24, 96, 1], state.seqNotes[i], state.seqNotes[i], v => { state.seqNotes[i] = v; stepButtons[i].textContent = (i + 1) + ' · ' + (state.seqOn[i] ? v : tx('rust')); }, v => String(v), undefined, 'seq');
      select(editor, tx('Speelt'), [[0, tx('Rust')], [1, tx('Noot')]], state.seqOn[i], v => { state.seqOn[i] = +v; buildUI(); }, ['seqOn', 'seq']);
    }
    function buildUI() {
      if (!panel) return;
      panel.textContent = ''; ui = {}; stepButtons = []; scope = null; scopeCtx = null;
      const top = row(panel);
      select(top, tx('Klank'), Object.keys(PRESETS).map(k => [k, k]), state.preset, v => {
        const keep = {}; for (const k of PERFORMANCE) keep[k] = state[k];
        self.setState({ ...DEF, ...keep, ...PRESETS[v], preset: v });
      }, ['preset', 'setup']);
      for (const id of ['wave', 'wave2', 'lfoWave', 'priority']) select(top, tx(LABELS[id]), OPTIONS[id].map(([v, t]) => [v, tx(t)]), state[id], v => { state[id] = v; apply(); }, [id, 'setup']);
      for (const id of BOOLEANS) select(top, tx(LABELS[id]), [[0, tx('Uit')], [1, tx('Aan')]], +state[id], v => { state[id] = v === '1'; apply(); }, [id, 'setup']);
      const play = row(panel);
      knob(play, 'testNote', tx('Testnoot (MIDI)'), [24, 96, 1], state.testNote, DEF.testNote, v => { state.testNote = v; }, v => String(v), undefined, 'play');
      button(play, tx('Speel noot'), () => note(state.testNote, 0.85, ctx.currentTime, 1));
      ui.hold = button(play, tx('Houd noot'), () => { heldDemo = !heldDemo; ui.hold.classList.toggle('active', heldDemo); if (heldDemo) note(state.testNote, 0.8, ctx.currentTime, undefined, true); else panic(); });
      ui.hold.classList.toggle('active', heldDemo);
      button(play, tx('Alles uit'), () => panic());
      sequenceUI(panel);
      for (const lane of Object.keys(LANES)) { const gp = add(panel, 'div', undefined, 'grp'); gp.dataset.g = lane; gp.dataset.t = tx(SHORT[lane] || LANES[lane]); add(gp, 'h3', tx(LANES[lane])); const g = add(gp, 'div', undefined, 'grid'); controls(g, SPEC.filter(d => d.lane === lane).map(d => d.id)); }
      scope = add(panel, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang'));
      scopeCtx = scope.getContext && scope.getContext('2d'); scopeData = new Float32Array(analyser.fftSize || 1024);
      sizeScope();
      ui.status = add(panel, 'p'); tellEngine();
      if (ro) { ro.disconnect(); if (scope && typeof ro.observe === 'function') ro.observe(scope); }
    }
    function sizeScope() {
      if (!scope) return;
      const dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4), w = Math.max(260, Math.min(1200, scopeW));
      if (scope.width !== Math.round(w * dpr) || scope.height !== Math.round(scopeH * dpr)) { scope.width = Math.round(w * dpr); scope.height = Math.round(scopeH * dpr); }
      if (scopeCtx) scopeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function readColors() {
      const cs = panel ? getComputedStyle(panel) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d; colT = performance.now();
      col = { well: v('--well', '#0b171d'), fg: v('--well-fg', '#c7dbe0') };
    }
    function draw() {
      if (dead || !scope || !scopeCtx) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const g = scopeCtx, w = Math.max(260, Math.min(1200, scopeW)), h = scopeH;
      analyser.getFloatTimeDomainData(scopeData);
      g.fillStyle = col.well; g.fillRect(0, 0, w, h); g.strokeStyle = col.fg; g.beginPath();
      for (let i = 0; i < scopeData.length; i++) { const x = i / (scopeData.length - 1) * w, y = h / 2 - clamp(scopeData[i], -1, 1) * h * 0.46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    const onSkin = () => { col = null; };
    function unmountUI() {
      stopLoop(); if (ro) { ro.disconnect(); ro = null; }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null; panel = null; scope = null; scopeCtx = null; ui = {}; stepButtons = [];
    }

    // ---- sturing (paarse kabel) ----
    function receiveMod(raw) {
      mod = {};
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const d of SPEC) if (typeof raw[d.id] === 'number' && Number.isFinite(raw[d.id])) mod[d.id] = clamp(raw[d.id], -1, 1);
      apply();
    }

    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        wrap = add(el, 'div'); const root = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
        add(root, 'style', CSS); panel = add(root, 'div', undefined, 'app');
        buildUI();
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) { scopeW = w; scopeH = Math.max(20, Math.min(200, es[0].contentRect.height || 64)); sizeScope(); } }); if (scope) ro.observe(scope); }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        stopLoop(); stopDraw = drawLoop(host, self, draw, 20);
      },
      unmount() { unmountUI(); },
      onEvent, onStep,
      onTransport(e) { if (dead) return; playing = !!(e && e.playing); lastStep = ''; sequenceCounter = 0; if (!playing) panic(); tellEngine(); },
      params() { return SPEC.map(d => ({ id: d.id, name: tx(d.name), lane: d.lane, laneName: tx(LANES[d.lane]), min: d.min, max: d.max, scale: d.scale, role: d.role, drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); },
      modulate: receiveMod,
      getState() { return copyState(state); },
      setState(raw) {
        if (dead) return;
        panic(); state = normalize(raw); lastStep = ''; sequenceCounter = 0; apply(); buildUI();
      },
      getPreset() { const p = copyState(state); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) {
        if (dead) return;
        const keep = {}; for (const k of PRESET_SKIP) keep[k] = state[k];
        self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep });
      },
      destroy() {
        if (dead) return;
        panic(); generation++;
        if (backendType === 'worklet') { try { backend.port.postMessage({ type: 'close' }); backend.port.close(); } catch (e) {} }
        if (backend) backend.onaudioprocess = null;
        dead = true; pending = []; localEngine = null; unmountUI(); dispose();
      },
    };
    apply(); init();
    return self;
  },
};
