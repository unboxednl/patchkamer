// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Alle continue regelaars zijn stuurbaar: de vier routehoeveelheden (Route 1 t/m 4, -1 tot +1) stonden niet in params(). Nu wel (standaard uit); een modulator verschuift de
//   hoeveelheid van de route, de knop en de bewaarde routes blijven je basis. Klank en instellingen zijn ongewijzigd. Bewust weggelaten: Testnoot (werkstand) en de keuzelijsten en schakelaars.
// 1.11.0 — Nieuw als Patch Mono (nieuwe id nl.patchkamer.patchmono, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Patch Mono
//   - alleen de code voor dit apparaat zelf: één mono-stem met een of twee oscillatoren en een of twee filters
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - tekenen via host.frame, kleuren uit de host, dubbelklik op een schuif zet hem terug op de beginwaarde
//   - bewaker: de motor begrenst het externe geluid en zet een toestand die niet eindig is terug, zodat een NaN of
//     Infinity op de audio-ingang het apparaat niet meer voor altijd stil kan leggen
//   - keuze Opbouw: 'single' (1 VCO, lowpass) en 'dual' (2 VCO, highpass + lowpass); nieuw: nootprioriteit als keuze
// Een monofone synth: een of twee oscillatoren met ringmodulatie en ruis, resonante filters, LFO met sample & hold,
// vier interne patchroutes (LFO, filter-EG, sample & hold of externe envelope naar pitch, cutoff of pulsbreedte)
// en een ingang voor extern geluid dat door de filters gaat.

// De motor draait in een AudioWorklet (de klasse wordt als tekst meegegeven) en, als dat niet kan, in een ScriptProcessor.
// Hij mag dus niets uit de omgeving gebruiken.
class PatchMonoEngine {
  constructor(sr, p) {
    this.sr = sr; this.p = {}; this.target = {}; this.queue = []; this.voices = []; this.keys = []; this.serial = 0; this.frame = 0;
    this.seed = 197903; this.lfoPhase = 0; this.sh = 0; this.externalEnv = 0; this.routes = [];
    this.dcL = 0; this.dcR = 0; this.lastL = 0; this.lastR = 0;
    for (const k in p) this.p[k] = typeof p[k] === 'number' && !Number.isFinite(p[k]) ? 0 : p[k];
    this.setParams(p);
  }
  setParams(p) {
    const q = {};
    for (const k in p) if (typeof p[k] !== 'number' || Number.isFinite(p[k])) q[k] = p[k];
    this.target = q;
    for (const k in q) if (typeof q[k] !== 'number') this.p[k] = q[k];
    try { this.routes = JSON.parse(q.routes || '[]').slice(0, 4).filter(r => r && typeof r === 'object'); } catch { this.routes = []; }
    if (this.keys.length) this.updateMono();
  }
  random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  enqueue(e) {
    if (!Number.isFinite(e?.time)) return;
    const v = { ...e };
    if ((v.type === 'note' || v.type === 'noteon' || v.type === 'noteoff') && !Number.isFinite(v.note)) return;
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
      case 'decay': e.value += (s - e.value) * Math.min(1, 6 / (Math.max(0.008, d) * sr)); if (++e.age >= d * sr) { e.stage = 'sustain'; } break;
      case 'sustain': e.value += (s - e.value) * 0.01; break;
      case 'release': e.value *= Math.max(0, 1 - 7 / (Math.max(0.008, r) * sr)); break;
    }
    if (!Number.isFinite(e.value)) e.value = 0;
    return e.value;
  }
  voice(note, vel, token) {
    const f = 440 * 2 ** ((note - 69) / 12);
    return { note, note2: note, vel, token, gate: true, p1: 0, p2: 0, freq: f, freq2: f, amp: this.newEg(), env: this.newEg(), filter: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], g: 0.1, hg: 0.01, k: 1, alive: true };
  }
  event(e) {
    const type = e.type;
    if (type === 'control') { this.setParams(e.params); return; }
    if (type === 'panic' || type === 'allnotesoff') { this.keys = []; for (const v of this.voices) v.gate = false; return; }
    if (type === 'note' || type === 'noteon') {
      if (!(e.vel > 0)) { this.event({ type: 'noteoff', note: e.note }); return; }
      const was = this.keys.length;
      this.keys = this.keys.filter(k => k.note !== e.note); this.keys.push({ note: e.note, vel: e.vel, token: e.token });
      let v = this.voices[0];
      if (!v) { v = this.voice(e.note, e.vel, e.token); this.voices = [v]; }
      this.updateMono(); v.gate = true; v.vel = e.vel; v.token = e.token;
      if (!was || !this.p.legato || e.retrigger) { v.amp = this.newEg(); v.env = this.newEg(); }
      return;
    }
    if (type === 'noteoff' || type === 'autooff') {
      const matches = k => type === 'autooff' ? k.token === e.token : k.note === e.note;
      this.keys = this.keys.filter(k => !matches(k));
      if (!this.keys.length) { for (const v of this.voices) v.gate = false; } else this.updateMono();
    }
  }
  updateMono() {
    const v = this.voices[0];
    if (!v || !this.keys.length) return;
    const sorted = this.keys.slice().sort((a, b) => a.note - b.note);
    const selected = this.p.priority === 'low' ? sorted[0] : this.p.priority === 'high' ? sorted.at(-1) : this.keys.at(-1);
    v.note = selected.note; v.note2 = selected.note; v.vel = selected.vel;
  }
  blep(t, dt) {
    if (t < dt) { t /= dt; return t + t - t * t - 1; }
    if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
    return 0;
  }
  osc(phase, dt, wave, pw) {
    if (wave === 'noise') return this.random();
    if (wave === 'triangle') return 1 - 4 * Math.abs(phase - 0.5);
    if (wave === 'square') {
      const w = Math.max(0.05, Math.min(0.95, pw));
      let v = phase < w ? 1 : -1;
      v += this.blep(phase, dt); v -= this.blep((phase - w + 1) % 1, dt);
      return v;
    }
    return 2 * phase - 1 - this.blep(phase, dt);
  }
  svf(x, s, g, k, high = false) {
    const a = 1 / (1 + g * (g + k)), v1 = (s.x + g * (x - s.y)) * a, v2 = s.y + g * v1;
    s.x = Math.max(-8, Math.min(8, 2 * v1 - s.x)); s.y = Math.max(-8, Math.min(8, 2 * v2 - s.y));
    return high ? x - k * v1 - v2 : v2;
  }
  // 'single': een oscillator, een lowpass-filter en een envelope voor amp en filter; 'dual': twee oscillatoren, highpass + lowpass
  analog(v, lfo, sh, input) {
    const p = this.p, sr = this.sr, two = p.variant === 'dual', oneEG = !two;
    let extraPitch = 0, extraFilter = 0, extraPw = 0;
    const a = this.eg(v.amp, v.gate, p.attack || 0.005, p.decay || 0.3, p.sustain ?? 0.7, p.release || 0.2);
    const e = this.eg(v.env, v.gate, oneEG ? p.attack : p.fAttack ?? p.attack ?? 0.005, oneEG ? p.decay : p.fDecay ?? p.decay ?? 0.3, oneEG ? p.sustain : p.fSustain ?? p.sustain ?? 0.2, oneEG ? p.release : p.fRelease ?? p.release ?? 0.2);
    for (const r of this.routes) {
      const value = r.source === 'lfo' ? lfo : r.source === 'env' ? e : r.source === 'sh' ? sh : r.source === 'external' ? this.externalEnv : 0, amount = Number(r.amount) || 0;
      if (r.dest === 'pitch') extraPitch += value * amount * 24; else if (r.dest === 'cutoff') extraFilter += value * amount * 5; else if (r.dest === 'pw') extraPw += value * amount * 0.4;
    }
    const transpose = (p.transpose || 0) + extraPitch + (p.vibrato || 0) * lfo / 100;
    const freq = 440 * 2 ** ((v.note - 69 + transpose) / 12);
    const freq2 = 440 * 2 ** ((v.note2 - 69 + transpose + (p.osc2Semi || 0) + (p.osc2Fine || 0) / 100) / 12);
    const glide = Math.max(0.0001, p.glide || 0.0001), gcoef = Math.min(1, 5 / (glide * sr));
    v.freq += (freq - v.freq) * gcoef; v.freq2 += (freq2 - v.freq2) * gcoef;
    const pw = Math.max(0.05, Math.min(0.95, (p.pw || 0.5) + (p.pwm || 0) * lfo * 0.43 + extraPw)), dt2 = Math.min(0.45, v.freq2 / sr);
    const b = two ? this.osc(v.p2, dt2, p.wave2 || 'sawtooth', pw) : 0;
    const dt = Math.max(0.00001, Math.min(0.45, (v.freq + (two ? b * (p.fm || 0) * v.freq : 0)) / sr));
    let x = this.osc(v.p1, dt, p.wave || 'sawtooth', pw) * (p.osc1 ?? 0.7);
    if (two) x += b * (p.osc2 || 0);
    if (two) x += (this.osc(v.p1, dt, 'square', 0.5) * this.osc(v.p2, dt2, 'square', 0.5)) * (p.ring || 0);
    x += this.random() * (p.noise || 0);
    x += input * (p.external || 0) * 2;
    v.p1 += dt; v.p1 %= 1; v.p2 = (v.p2 + dt2) % 1;
    if ((this.frame & 15) === 0) {
      const tracking = (p.keytrack ?? 0.5) * (v.note - 60) / 12;
      const cut = Math.max(25, Math.min(sr * 0.43, (p.cutoff || 2500) * 2 ** ((p.filterEnv || 0) * e + (p.lfoFilter || 0) * lfo * 3 + extraFilter + tracking + (two ? b * (p.audioFilter || 0) * 4 : 0))));
      v.g = Math.tan(Math.PI * cut / sr); v.k = Math.max(0.07, 2 - (p.resonance || 0) * 1.93);
      v.hg = Math.tan(Math.PI * Math.min(sr * 0.43, p.highpass || 20) / sr);
    }
    x = Math.tanh(x * (1 + (p.drive || 0) * 5));
    if (two) x = this.svf(x, v.filter[2], v.hg, Math.max(0.1, 2 - (p.hpRes || 0) * 1.9), true);
    x = this.svf(x, v.filter[0], v.g, v.k);
    if (two) x = this.svf(x, v.filter[1], v.g, Math.max(0.35, v.k));
    v.alive = v.gate || a > 0.00001;
    return Math.tanh(x) * a * v.vel * 0.55;
  }
  // bewaker, per blok: een toestand die niet eindig is (NaN of Infinity) herstelt zichzelf nooit; zet alles dan terug
  sane() {
    const f = Number.isFinite;
    let ok = f(this.lfoPhase) && f(this.sh) && f(this.externalEnv) && f(this.dcL) && f(this.dcR) && f(this.lastL) && f(this.lastR) && f(this.seed);
    for (let i = 0; ok && i < this.voices.length; i++) {
      const v = this.voices[i];
      ok = f(v.freq) && f(v.freq2) && f(v.p1) && f(v.p2) && f(v.g) && f(v.hg) && f(v.k) && f(v.vel) && f(v.amp.value) && f(v.env.value) &&
        f(v.filter[0].x) && f(v.filter[0].y) && f(v.filter[1].x) && f(v.filter[1].y) && f(v.filter[2].x) && f(v.filter[2].y);
    }
    if (ok) return;
    this.voices = []; this.keys = []; this.lfoPhase = 0; this.sh = 0; this.externalEnv = 0; this.dcL = 0; this.dcR = 0; this.lastL = 0; this.lastR = 0;
    if (!Number.isFinite(this.seed)) this.seed = 197903;
  }
  process(left, right, input, time) {
    const sr = this.sr;
    this.sane();
    for (let i = 0; i < left.length; i++) {
      const t = time + i / sr;
      while (this.queue.length && this.queue[0].time <= t + 1e-10) this.event(this.queue.shift());
      if ((this.frame & 31) === 0) {
        for (const k in this.target) if (typeof this.target[k] === 'number') this.p[k] += (this.target[k] - this.p[k]) * 0.04;
      }
      const p = this.p, rate = p.lfoRate || 1;
      this.lfoPhase += rate / sr;
      if (this.lfoPhase >= 1) { this.lfoPhase %= 1; this.sh = this.random(); }
      const lfo = p.lfoWave === 'square' ? (this.lfoPhase < 0.5 ? 1 : -1) : p.lfoWave === 'sawtooth' ? this.lfoPhase * 2 - 1 : 1 - 4 * Math.abs(this.lfoPhase - 0.5);
      let ext = input?.[i] || 0;
      if (ext > 16) ext = 16; else if (ext < -16) ext = -16;
      this.externalEnv += (Math.abs(ext) - this.externalEnv) * 0.003;
      let l = 0, r = 0;
      for (const v of this.voices) { const sample = this.analog(v, lfo, this.sh, ext); l += sample; r += sample; }
      for (let j = this.voices.length - 1; j >= 0; j--) if (this.voices[j].alive === false) this.voices.splice(j, 1);
      const yl = l - this.lastL + 0.995 * this.dcL, yr = r - this.lastR + 0.995 * this.dcR;
      this.lastL = l; this.lastR = r; this.dcL = yl; this.dcR = yr;
      left[i] = Number.isFinite(yl) ? 0.9 * Math.tanh(yl / 0.9) : 0; right[i] = Number.isFinite(yr) ? 0.9 * Math.tanh(yr / 0.9) : 0;
      this.frame++;
    }
  }
}

const WNAME = 'nl-patchkamer-patchmono-1-11-0';
const WORKLET = PatchMonoEngine.toString() + `
registerProcessor('${WNAME}', class extends AudioWorkletProcessor {
  constructor(options) {
    super(); this.engine = new PatchMonoEngine(sampleRate, options.processorOptions.params); this.closed = false;
    this.port.onmessage = e => { const m = e.data; if (m.type === 'params') this.engine.setParams(m.params); else if (m.type === 'event') this.engine.enqueue(m.event); else if (m.type === 'close') this.closed = true; };
  }
  process(inputs, outputs) {
    if (this.closed) return false;
    const output = outputs[0];
    if (output && output.length) this.engine.process(output[0], output[1] || output[0], inputs[0] && inputs[0][0], currentTime);
    return true;
  }
});`;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;

const EN = {
  'Resonantie': 'Resonance', 'Filter-EG': 'Filter EG', 'Pulsbreedte': 'Pulse width', 'PWM-diepte': 'PWM depth', 'Ruis': 'Noise',
  'LFO-snelheid': 'LFO rate', 'Transpositie': 'Transpose', 'Niveau': 'Level', 'VCO B fijn': 'VCO B fine', 'High-pass resonantie': 'High-pass resonance',
  'Ringmodulatie': 'Ring modulation', 'Extern geluid': 'External audio',
  'Filters': 'Filters', 'Versterker / envelope': 'Amplifier / envelope', 'Oscillatoren': 'Oscillators', 'Modulatie': 'Modulation',
  'Klankbeeld': 'Sound', 'Opbouw': 'Voice layout', '1 VCO · lowpass': '1 VCO · lowpass', '2 VCO · highpass + lowpass': '2 VCO · highpass + lowpass',
  'Nootprioriteit': 'Note priority', 'Laatste': 'Last', 'Laagste': 'Lowest', 'Hoogste': 'Highest',
  'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Driehoek': 'Triangle', 'LFO-vorm': 'LFO shape', 'Aan': 'On', 'Uit': 'Off',
  'Testnoot MIDI': 'Test note (MIDI)', 'Speel noot': 'Play note', 'Houd noot': 'Hold note', 'Alles uit': 'All off',
  'Route {0} hoeveelheid': 'Route {0} amount', 'Vier interne patchroutes': 'Four internal patch routes', 'Bron': 'Source', 'Doel': 'Target', 'Hoeveelheid': 'Amount',
  'Sample & hold': 'Sample & hold', 'Externe envelope': 'External envelope',
  'Monofone synth met één of twee oscillatoren, resonante filters en vier interne patchroutes.': 'Monophonic synth with one or two oscillators, resonant filters and four internal patch routes.',
  'Audiomotor wordt voorbereid…': 'Audio engine loading…', 'Deze omgeving biedt geen audioprocessor.': 'This environment offers no audio processor.',
  'Audiomotor gereed · keyboard en testknoppen beschikbaar': 'Audio engine ready · keyboard and test buttons available',
  'Golfvorm van de uitgang': 'Output waveform',
  'Vier routes verbinden LFO, filter-EG, sample & hold of de externe envelope met pitch, cutoff of pulsbreedte. Extern geluid gaat ook door de klankfilters; zet Extern geluid open en gebruik Houd noot als gate. Dit is een interne matrix, geen elektrische CV/Hz-per-volt-aansluiting.':
    'Four routes connect the LFO, filter EG, sample & hold or the external envelope to pitch, cutoff or pulse width. External audio also runs through the sound filters: open External audio and use Hold note as the gate. This is an internal matrix, not an electrical CV/Hz-per-volt connection.',
  'De paarse Mod-ingang verandert de klank zonder basiswaarden te overschrijven.': 'The purple Mod input changes the sound without overwriting the base values.',
};

// bereik, vorm en lane van elke regelaar; de volgorde is de volgorde op de kaart. min/max/scale/step: zie contract §13.
const SPEC = {
  cutoff: { name: 'Cutoff', min: 30, max: 16000, role: 'filter', scale: 'log', unit: 'Hz', lane: 'filter' },
  resonance: { name: 'Resonantie', min: 0, max: 1, role: 'res', lane: 'filter' },
  filterEnv: { name: 'Filter-EG', min: -5, max: 5, role: 'env', lane: 'filter' },
  keytrack: { name: 'Key tracking', min: 0, max: 1, role: 'pitch', lane: 'filter' },
  attack: { name: 'VCA attack', min: 0.001, max: 4, role: 'env', scale: 'log', unit: 's', lane: 'amp' },
  decay: { name: 'VCA decay', min: 0.01, max: 8, role: 'decay', scale: 'log', unit: 's', lane: 'amp' },
  sustain: { name: 'VCA sustain', min: 0, max: 1, role: 'env', lane: 'amp' },
  release: { name: 'VCA release', min: 0.01, max: 8, role: 'decay', scale: 'log', unit: 's', lane: 'amp' },
  pw: { name: 'Pulsbreedte', min: 0.05, max: 0.95, role: 'color', lane: 'source' },
  pwm: { name: 'PWM-diepte', min: 0, max: 1, role: 'color', lane: 'motion' },
  noise: { name: 'Ruis', min: 0, max: 1, role: 'texture', lane: 'source' },
  lfoRate: { name: 'LFO-snelheid', min: 0.05, max: 30, role: 'motion', scale: 'log', unit: 'Hz', lane: 'motion' },
  vibrato: { name: 'LFO → pitch', min: 0, max: 120, role: 'pitch', unit: 'cent', lane: 'motion' },
  lfoFilter: { name: 'LFO → filter', min: 0, max: 1, role: 'filter', lane: 'motion' },
  drive: { name: 'Drive', min: 0, max: 1, role: 'color', lane: 'master' },
  glide: { name: 'Portamento', min: 0.001, max: 1, role: 'glide', scale: 'log', unit: 's', lane: 'motion' },
  transpose: { name: 'Transpositie', min: -24, max: 24, role: 'pitch', unit: 'st', step: 1, lane: 'source' },
  level: { name: 'Niveau', min: 0, max: 1, role: 'level', lane: 'master' },
  fAttack: { name: 'Filter attack', min: 0.001, max: 4, role: 'env', scale: 'log', unit: 's', lane: 'filter' },
  fDecay: { name: 'Filter decay', min: 0.01, max: 8, role: 'decay', scale: 'log', unit: 's', lane: 'filter' },
  fSustain: { name: 'Filter sustain', min: 0, max: 1, role: 'env', lane: 'filter' },
  fRelease: { name: 'Filter release', min: 0.01, max: 8, role: 'decay', scale: 'log', unit: 's', lane: 'filter' },
  osc1: { name: 'VCO A', min: 0, max: 1, role: 'level', lane: 'source' },
  osc2: { name: 'VCO B', min: 0, max: 1, role: 'level', lane: 'source' },
  osc2Semi: { name: 'VCO B interval', min: -24, max: 24, role: 'pitch', unit: 'st', step: 1, lane: 'source' },
  osc2Fine: { name: 'VCO B fijn', min: -35, max: 35, role: 'pitch', unit: 'cent', lane: 'source' },
  fm: { name: 'VCO B → A FM', min: 0, max: 3, role: 'color', lane: 'motion' },
  audioFilter: { name: 'VCO B → filter', min: 0, max: 1, role: 'filter', lane: 'motion' },
  highpass: { name: 'High-pass cutoff', min: 20, max: 8000, role: 'filter', scale: 'log', unit: 'Hz', lane: 'filter' },
  hpRes: { name: 'High-pass resonantie', min: 0, max: 1, role: 'res', lane: 'filter' },
  ring: { name: 'Ringmodulatie', min: 0, max: 1, role: 'color', lane: 'source' },
  external: { name: 'Extern geluid', min: 0, max: 1, role: 'level', lane: 'source' },
};
const LANES = { filter: 'Filters', amp: 'Versterker / envelope', source: 'Oscillatoren', motion: 'Modulatie', master: 'Master' };
// alleen met Opbouw 'dual' bruikbaar: deze regelaars staan dan niet op de kaart
const DUAL_ONLY = ['osc2', 'osc2Semi', 'osc2Fine', 'fm', 'audioFilter', 'ring', 'hpRes', 'highpass', 'fAttack', 'fDecay', 'fSustain', 'fRelease'];
const ROUTE_IDS = ['route0', 'route1', 'route2', 'route3'];   // hoeveelheid per patchroute (-1…+1), alleen als sturing; de bewaarde routes zijn state
const NO_ROUTES = JSON.stringify(Array.from({ length: 4 }, () => ({ source: 'off', dest: 'cutoff', amount: 0 })));
const DEFAULTS = {
  cutoff: 1300, resonance: 0.55, filterEnv: 3, keytrack: 0.5, attack: 0.008, decay: 0.3, sustain: 0.65, release: 0.3, pw: 0.5, pwm: 0.2, noise: 0, lfoRate: 2,
  vibrato: 0, lfoFilter: 0, drive: 0.1, glide: 0.005, transpose: 0, level: 0.75, fAttack: 0.005, fDecay: 0.4, fSustain: 0.15, fRelease: 0.3, osc1: 0.7, osc2: 0.5,
  osc2Semi: 0, osc2Fine: 5, fm: 0, audioFilter: 0, highpass: 80, hpRes: 0.2, ring: 0, external: 0,
  testNote: 48, preset: 'Raw Mono', variant: 'single', wave: 'sawtooth', wave2: 'square', legato: true, priority: 'last', lfoWave: 'triangle', routes: NO_ROUTES,
};
const OPTIONS = {
  variant: ['single', 'dual'], wave: ['sawtooth', 'square', 'triangle', 'noise'], wave2: ['sawtooth', 'square', 'triangle'],
  lfoWave: ['sawtooth', 'square', 'triangle'], priority: ['last', 'low', 'high'],
};
const ROUTE_SOURCES = ['off', 'lfo', 'env', 'sh', 'external'], ROUTE_DESTS = ['pitch', 'cutoff', 'pw'];
// klankbeelden van de keuzelijst: alleen wat afwijkt van DEFAULTS
const SOUNDS = {
  'Raw Mono': { cutoff: 1300, resonance: 0.55, filterEnv: 3 },
  'Screaming Dual': { variant: 'dual', osc2Semi: 7, ring: 0.35, resonance: 0.8, drive: 0.6, highpass: 180, hpRes: 0.65 },
  'External Sculpt': { variant: 'dual', external: 1, osc1: 0, osc2: 0, cutoff: 2800, filterEnv: 0, highpass: 100 },
  'Rubber Cable': { wave: 'square', pw: 0.25, cutoff: 650, resonance: 0.7, filterEnv: 4, fDecay: 0.15 },
  'Industrial Air': { noise: 0.8, osc1: 0.15, cutoff: 3500, resonance: 0.6, attack: 1, release: 2 },
};
const PRESET_SKIP = ['testNote'];   // werkstand, geen klank: een preset laat dit staan
const OPT_LABELS = {
  variant: [['single', '1 VCO · lowpass'], ['dual', '2 VCO · highpass + lowpass']],
  wave: [['sawtooth', 'Zaagtand'], ['square', 'Puls'], ['triangle', 'Driehoek'], ['noise', 'Ruis']],
  wave2: [['sawtooth', 'Zaagtand'], ['square', 'Puls'], ['triangle', 'Driehoek']],
  lfoWave: [['sawtooth', 'Zaagtand'], ['square', 'Puls'], ['triangle', 'Driehoek']],
  priority: [['last', 'Laatste'], ['low', 'Laagste'], ['high', 'Hoogste']],
};
const FIELD_LABELS = { variant: 'Opbouw', wave: 'VCO 1', wave2: 'VCO 2', priority: 'Nootprioriteit', lfoWave: 'LFO-vorm' };

const CSS = `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:#91e0d4;--x-acc2:#e8c991;--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px}
p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}
.row{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}
.control span{font-size:11px;color:var(--muted,#adc3c9)}
button,select{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%}
input[type=range]{width:100%;margin:0;padding:0;accent-color:var(--x-acc)}
button{cursor:pointer;touch-action:none}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}
output{font:12px monospace;color:var(--x-ink2)}
h3{font-size:13px;color:var(--x-ink2);margin:14px 0 8px}
canvas{display:block;width:100%;height:64px;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px}
label{min-width:0}`;

export default {
  id: 'nl.patchkamer.patchmono',
  name: 'Patch Mono',
  version: '1.11.1',
  modExclude: ['testNote'],   // werkstand, geen klank
  kind: 'instrument',
  category: 'synth',
  ui: { width: 920, minWidth: 380 },
  ports: {
    audioIn: [{ id: 'in', name: 'External audio / envelope' }],
    audioOut: [{ id: 'out', name: 'Stereo' }],
    eventIn: [{ id: 'notes', name: 'Keyboard / notes' }],
    eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }],
    modOut: [],
  },
  i18n: { nl: { ports: { in: 'Extern geluid / envelope', notes: 'Keyboard / noten' } } },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let state = { ...DEFAULTS }, mod = {}, effective = {};
    let dead = false, mountHost = null, panel = null, handles = {}, engineText = null, scope = null, stopDraw = null, ro = null, cw = 600, col = null, colT = 0;
    const nodes = new Set();
    const own = n => (nodes.add(n), n);
    const gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);
    const dispose = () => { for (const n of nodes) try { n.disconnect(); } catch (e) {} nodes.clear(); };

    function resolve() {
      const e = { ...state };
      for (const [id, d] of Object.entries(SPEC)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); }
      if (ROUTE_IDS.some(id => mod[id])) { try { const rs = JSON.parse(state.routes); e.routes = JSON.stringify(rs.map((r, i) => (r && typeof r === 'object' ? { ...r, amount: clamp((Number(r.amount) || 0) + (mod['route' + i] || 0) * 2, -1, 1) } : r))); } catch (err) { /* routes blijven zoals ze zijn */ } }
      effective = e; return e;
    }
    resolve();

    // ---------- geluid ----------
    // ingang -> motor (worklet of ScriptProcessor) -> volume -> compressor -> begrenzer -> uitgang (en een meter voor de scope)
    let backend = null, backendType = 'loading', pending = [], generation = 0, heldDemo = false;
    const input = gain(1), volume = gain(state.level), analyser = own(ctx.createAnalyser());
    const comp = own(ctx.createDynamicsCompressor());
    comp.threshold.value = -10; comp.ratio.value = 5; comp.knee.value = 8; comp.attack.value = 0.003; comp.release.value = 0.18;
    const out = own(ctx.createWaveShaper());
    { const c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); out.curve = c; out.oversample = (host.audio && host.audio.oversample) || '2x'; }
    volume.connect(comp).connect(out); out.connect(analyser); analyser.fftSize = 1024;
    const localEngine = new PatchMonoEngine(ctx.sampleRate, effective);

    function engineMessage(m) {
      if (dead) return;
      if (backendType === 'worklet') backend.port.postMessage(m);
      else if (m.type === 'params') localEngine.setParams(m.params);
      else if (m.type === 'event') { localEngine.enqueue(m.event); if (backendType === 'loading') { pending.push(m.event); if (pending.length > 1024) pending.shift(); } }
    }
    function tellEngine() {
      if (engineText) engineText.textContent = tx(backendType === 'loading' ? 'Audiomotor wordt voorbereid…' : backendType === 'unavailable' ? 'Deze omgeving biedt geen audioprocessor.' : 'Audiomotor gereed · keyboard en testknoppen beschikbaar');
    }
    function apply() {
      if (dead) return;
      resolve(); smooth(volume.gain, effective.level); engineMessage({ type: 'params', params: effective });
    }
    async function init() {
      const id = ++generation;
      try {
        if (ctx.audioWorklet && typeof globalThis.AudioWorkletNode === 'function') {
          if (typeof host.loadWorklet === 'function') await host.loadWorklet(WNAME, WORKLET);
          else { const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' })); try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); } }
          if (dead || id !== generation) return;
          backend = own(new globalThis.AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { params: effective } }));
          backendType = 'worklet'; backend.connect(volume); input.connect(backend);
          for (const e of pending) backend.port.postMessage({ type: 'event', event: e });
          pending = []; tellEngine(); return;
        }
      } catch (e) {}
      if (dead || id !== generation) return;
      if (typeof ctx.createScriptProcessor === 'function') {
        backend = own(ctx.createScriptProcessor(1024, 1, 2)); backendType = 'script';
        backend.onaudioprocess = e => {
          if (dead) return;
          const audio = e.inputBuffer && e.inputBuffer.getChannelData(0);
          localEngine.process(e.outputBuffer.getChannelData(0), e.outputBuffer.getChannelData(1), audio, Number.isFinite(e.playbackTime) ? e.playbackTime : ctx.currentTime);
        };
        input.connect(backend); backend.connect(volume); pending = [];
      } else backendType = 'unavailable';
      tellEngine();
    }
    const send = e => engineMessage({ type: 'event', event: e });
    function panic(t = ctx.currentTime) { heldDemo = false; send({ type: 'allnotesoff', time: t }); }
    function note(n, vel, t, dur, held = false) { send({ type: 'note', note: Math.round(clamp(n, 0, 127)), vel: clamp(vel, 0, 1), time: t, dur, held }); }

    // ---------- state (contract §13) ----------
    function numericState(raw) {
      const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}, next = { ...DEFAULTS };
      for (const [id, d] of Object.entries(SPEC)) next[id] = finite(s[id], DEFAULTS[id], d.min, d.max);
      for (const [id, values] of Object.entries(OPTIONS)) if (values.includes(s[id])) next[id] = s[id];
      next.legato = typeof s.legato === 'boolean' ? s.legato : DEFAULTS.legato;
      next.preset = typeof s.preset === 'string' && Object.hasOwn(SOUNDS, s.preset) ? s.preset : DEFAULTS.preset;
      next.testNote = Math.round(finite(s.testNote, DEFAULTS.testNote, 24, 96));
      let routes = s.routes;
      if (typeof routes === 'string') { try { routes = JSON.parse(routes); } catch { routes = null; } }
      next.routes = JSON.stringify(Array.from({ length: 4 }, (_, i) => {
        const r = Array.isArray(routes) && routes[i] && typeof routes[i] === 'object' ? routes[i] : {};
        return { source: ROUTE_SOURCES.includes(r.source) ? r.source : 'off', dest: ROUTE_DESTS.includes(r.dest) ? r.dest : 'cutoff', amount: finite(r.amount, 0, -1, 1) };
      }));
      return next;
    }

    // ---------- gebeurtenissen ----------
    function event(port, e) {
      try {
        if (dead || port !== 'notes' || !Number.isFinite(e?.time)) return;
        const type = String(e?.type || '').toLowerCase().replace(/[_-]/g, ''), time = Math.max(ctx.currentTime, e.time);
        if (type === 'panic' || type === 'allnotesoff') { panic(time); return; }
        if (type === 'cc' && SPEC[e.id] && Number.isFinite(e.value)) {
          const d = SPEC[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min);
          resolve(); smooth(volume.gain, effective.level, time); send({ type: 'control', params: { ...effective }, time });
          if (handles[e.id]) handles[e.id].refresh();
          return;
        }
        if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(e.note)) return;
        send({ type: type === 'noteoff' || e.vel === 0 ? 'noteoff' : type, note: Math.round(clamp(e.note, 0, 127)), vel: finite(e.vel, 0.8, 0, 1), time,
          held: e.held === true || type === 'noteon' && !Number.isFinite(e.dur), dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1 });
      } catch (err) {}
    }

    // ---------- UI ----------
    const add = (parent, tag, text) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; parent.appendChild(el); return el; };
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const b = add(parent, 'button', tx(label)); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(label));
      const el = add(box, 'select');
      for (const [v, text] of options) { const o = add(el, 'option', tx(text)); o.value = String(v); }
      el.value = String(value); el.onchange = () => change(el.value); return el;
    }
    // schuif; get/set lezen en schrijven de waarde in de state (bij een logaritmische schuif loopt de schuif 0..1)
    function knob(parent, id, label, bounds, value, change, format, dflt) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(label));
      const out2 = add(box, 'output', format(value)), el = add(box, 'input');
      el.type = 'range'; [el.min, el.max, el.step] = bounds.map(String); el.value = String(value); if (dflt !== undefined) el.dataset.pkDefault = String(dflt);
      if (/^route\d$/.test(id)) el.dataset.pkId = id;   // koppelt de routehoeveelheid aan zijn stuurbare parameter
      el.oninput = () => { const n = Number(el.value); out2.textContent = format(n); change(n); };
      return { el, out: out2 };
    }
    function control(parent, id) {
      const d = SPEC[id], fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
      if (d.scale === 'log') {
        const pos = v => Math.log(v / d.min) / Math.log(d.max / d.min), val = x => d.min * (d.max / d.min) ** x;
        const k = knob(parent, id, d.name, [0, 1, 0.001], pos(state[id]), x => { state[id] = val(x); apply(); }, x => fmt(val(x)), pos(DEFAULTS[id]));
        handles[id] = { refresh() { k.el.value = String(pos(state[id])); k.out.textContent = fmt(state[id]); } };
      } else {
        const k = knob(parent, id, d.name, [d.min, d.max, d.step || 0.01], state[id], x => { state[id] = x; apply(); }, fmt, DEFAULTS[id]);
        handles[id] = { refresh() { k.el.value = String(state[id]); k.out.textContent = fmt(state[id]); } };
      }
    }
    function readColors() {
      if (!scope) return;
      const cs = getComputedStyle(scope), v = (n, d) => cs.getPropertyValue(n).trim() || d; colT = performance.now();
      col = { well: v('--well', '#0b171d'), fg: v('--well-fg', '#c7dbe0') };
    }
    const data = new Float32Array(analyser.fftSize);
    function draw() {
      if (dead || !scope) return;
      const g = scope.getContext('2d'); if (!g) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const w = Math.max(260, Math.min(1200, cw)), h = 64, dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4);
      if (scope.width !== Math.round(w * dpr) || scope.height !== Math.round(h * dpr)) { scope.width = Math.round(w * dpr); scope.height = Math.round(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      analyser.getFloatTimeDomainData(data);
      g.fillStyle = col.well; g.fillRect(0, 0, w, h); g.strokeStyle = col.fg; g.beginPath();
      for (let i = 0; i < data.length; i++) { const x = i / (data.length - 1) * w, y = h / 2 - clamp(data[i], -1, 1) * h * 0.46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    const onSkin = () => { col = null; };
    const frameLoop = (cb, fps) => {
      if (typeof host.frame === 'function') return host.frame(self, cb, fps);   // contract §12b; terugval voor een oudere host
      let raf = 0, last = 0, stop = false;
      const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
      raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
    };
    function clearUI() {
      if (stopDraw) { stopDraw(); stopDraw = null; }
      if (ro) { ro.disconnect(); ro = null; }
      if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
      if (mountHost) mountHost.innerHTML = '';
      mountHost = null; panel = null; scope = null; engineText = null; handles = {};
    }
    function routesUI(parent) {
      const routes = JSON.parse(state.routes);
      add(parent, 'h3', tx('Vier interne patchroutes'));
      for (let i = 0; i < 4; i++) {
        const r = row(parent), entry = routes[i]; add(r, 'span', String(i + 1));
        const update = () => { state.routes = JSON.stringify(routes); apply(); };
        select(r, 'Bron', [['off', 'Uit'], ['lfo', 'LFO'], ['env', 'Filter-EG'], ['sh', 'Sample & hold'], ['external', 'Externe envelope']], entry.source, v => { entry.source = v; update(); });
        select(r, 'Doel', [['pitch', 'Pitch'], ['cutoff', 'Cutoff'], ['pw', 'Pulsbreedte']], entry.dest, v => { entry.dest = v; update(); });
        knob(r, 'route' + i, 'Hoeveelheid', [-1, 1, 0.01], entry.amount, v => { entry.amount = v; update(); }, v => Number(v).toFixed(2), 0);
      }
    }
    function render(el) {
      clearUI(); mountHost = el;
      const wrap = add(el, 'div'), shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', CSS);
      panel = add(shadow, 'div'); panel.className = 'app';
      add(panel, 'p', tx('Monofone synth met één of twee oscillatoren, resonante filters en vier interne patchroutes.'));
      const top = row(panel);
      select(top, 'Klankbeeld', Object.keys(SOUNDS).map(k => [k, k]), state.preset, v => self.setState({ ...DEFAULTS, ...SOUNDS[v], preset: v }));
      for (const id of ['variant', 'wave', 'wave2', 'priority', 'lfoWave']) {
        if (id === 'wave2' && state.variant === 'single') continue;
        select(top, FIELD_LABELS[id], OPT_LABELS[id], state[id], v => { state[id] = v; apply(); if (id === 'variant') render(el); });
      }
      select(top, 'Legato', [[0, 'Uit'], [1, 'Aan']], +state.legato, v => { state.legato = v === '1'; apply(); });
      const play = row(panel);
      knob(play, 'testNote', 'Testnoot MIDI', [24, 96, 1], state.testNote, v => { state.testNote = v; }, v => String(v), DEFAULTS.testNote);
      button(play, 'Speel noot', () => note(state.testNote, 0.85, ctx.currentTime, 1));
      button(play, 'Houd noot', () => { heldDemo = !heldDemo; if (heldDemo) note(state.testNote, 0.8, ctx.currentTime, undefined, true); else panic(); });
      button(play, 'Alles uit', () => panic());
      for (const lane of Object.keys(LANES)) {
        add(panel, 'h3', tx(LANES[lane]));
        control0(panel, Object.keys(SPEC).filter(id => SPEC[id].lane === lane && !(state.variant === 'single' && DUAL_ONLY.includes(id))));
      }
      routesUI(panel);
      scope = add(panel, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang')); col = null;
      cw = scope.clientWidth || cw;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) cw = w; }); ro.observe(scope); }
      if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
      engineText = add(panel, 'p'); tellEngine();
      add(panel, 'p', tx('Vier routes verbinden LFO, filter-EG, sample & hold of de externe envelope met pitch, cutoff of pulsbreedte. Extern geluid gaat ook door de klankfilters; zet Extern geluid open en gebruik Houd noot als gate. Dit is een interne matrix, geen elektrische CV/Hz-per-volt-aansluiting.'));
      add(panel, 'p', tx('De paarse Mod-ingang verandert de klank zonder basiswaarden te overschrijven.'));
      stopDraw = frameLoop(draw, 30);
    }
    function control0(parent, ids) { const g = grid(parent); for (const id of ids) control(g, id); }

    const descriptors = () => Object.entries(SPEC).map(([id, d]) => ({ id, name: tx(d.name), lane: d.lane, laneName: tx(LANES[d.lane]), min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role, drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })).concat(ROUTE_IDS.map((id, i) => ({ id, name: tx('Route {0} hoeveelheid', i + 1), lane: 'motion', laneName: tx(LANES.motion), min: -1, max: 1, scale: 'lin', role: 'depth', drift: 0.08, on: false })));
    function receiveMod(raw) {
      mod = {};
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id of Object.keys(SPEC).concat(ROUTE_IDS)) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1);
      apply();
    }

    const self = {
      inputs: { in: input }, outputs: { out },
      mount: render,
      unmount() { clearUI(); },
      onEvent: event,
      onTransport(e) { if (dead) return; if (!(e && e.playing)) panic(); },
      params: descriptors,
      modulate: receiveMod,
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) {
        if (dead) return;
        const keep = {}; for (const k of PRESET_SKIP) if (k in state) keep[k] = state[k];
        self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep });
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return;
        panic(); state = numericState(raw); apply();
        if (mountHost) render(mountHost);
      },
      destroy() {
        if (dead) return;
        panic(); generation++;
        if (backendType === 'worklet') { try { backend.port.postMessage({ type: 'close' }); backend.port.close(); } catch (e) {} }
        if (backend) backend.onaudioprocess = null;
        pending = []; localEngine.voices = []; localEngine.queue = []; localEngine.keys = [];
        dead = true; clearUI(); dispose();
      },
    };
    apply(); init();
    return self;
  },
};
