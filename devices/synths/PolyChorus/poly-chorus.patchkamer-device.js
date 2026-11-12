// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.1 — Prestatie: de parameterobjecten van de motor krijgen al hun sleutels meteen (anders werden ze een woordenboek en was elke lezing in de samplelus traag) en de hoogdoorlaattabel wordt niet meer per stem opnieuw gemaakt. Geluid, state en ids ongewijzigd (uitvoer bit-identiek).
// 1.13.0 — Regelaars herkenbaar voor skins (host.ui.adopt: id = state-sleutel, groep = de sectie, rol param of select) en elke sectie staat in een eigen blok (div.sec met kop en regelaars), zodat een skin ze als draaiknoppen in één kader kan tonen (skin Compact). Geluid, state en params() ongewijzigd; testNote staat nu in modExclude (bewust niet stuurbaar, zoals bij Patch Mono); zonder skin ziet het er hetzelfde uit.
// 1.12.0 — Uitleg naar about (menu Over Poly Chorus); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.11.1 — Versterking (+9,5 dB) achter de compressor: het apparaat en de tunes waren erg zacht (pieken rond −34 tot −10 dBFS). Het plafond rondt de pieken af.
// 1.11.0 — Nieuw als Poly Chorus (nieuwe id nl.patchkamer.polychorus, eigen map), bijgewerkt naar Patchkamer contract v1.11. Het geluid is
//   bit-identiek aan het oude bestand; de motor bevat alleen nog de code voor dit apparaat:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Poly Chorus
//   - setState volgt §13: onbekende velden worden genegeerd, ontbrekende of ongeldige waarden krijgen de standaard, getallen worden afgekapt;
//     de knoppen en keuzes volgen setState zonder dat de UI opnieuw wordt opgebouwd
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default); de scope tekent via host.frame
//   - bewaker tegen niet-eindige waarden: een stem die NaN of Infinity geeft wordt weggehaald, de uitgangstrap herstelt zichzelf en
//     de motor weigert niet-eindige parameters en noten. Voorheen kon één NaN de uitgang voor altijd stil zetten.
//   - de ceiling-vervormer volgt host.audio.oversample (§12c)
//   - de ongebruikte state-velden legato en priority (alleen voor een monosynth) zijn weg
// Een polyfone synth met zes stemmen: per stem een zaagtand, puls (met pulsbreedtemodulatie) en sub-oscillator, ruis, een tweepolig
// lowpass-filter met resonantie, een hoogdoorlaatfilter met vier standen, een filter- en een versterker-envelope, een LFO,
// portamento en een stereo-chorus (twee standen en samen). Achter de stemmen staat een compressor en een zachte begrenzer.

const WNAME = 'nl-patchkamer-polychorus-1-11-0';
// parameters die de motor als getal ontvangt (en tijdens het spelen zacht naar hun doel laat lopen)
const NUM_KEYS = ['cutoff', 'resonance', 'filterEnv', 'keytrack', 'attack', 'decay', 'sustain', 'release', 'pw', 'pwm', 'noise', 'lfoRate',
  'vibrato', 'lfoFilter', 'drive', 'glide', 'transpose', 'saw', 'pulse', 'sub', 'chorusMix', 'width'];

// De motor draait in een AudioWorklet: de klasse wordt als tekst meegegeven, dus hij mag niets van buiten de klasse gebruiken
// (behalve NUM_KEYS, dat de worklet-tekst zelf meegeeft).
class PolyChorusEngine {
  constructor(sr, p) {
    this.sr = sr; this.queue = [];
    // p en target hebben vanaf het begin alle sleutels (undefined = nog niet gezet), zodat het object een vaste vorm houdt; een sleutel die
    // pas gaandeweg wordt toegevoegd, maakt van het object een woordenboek en dat maakt elke lezing in de samplelus langzaam.
    // Houd deze lijst gelijk aan NUM_KEYS plus hpf, chorusMode en vcaMode.
    this.p = { cutoff: undefined, resonance: undefined, filterEnv: undefined, keytrack: undefined, attack: undefined, decay: undefined, sustain: undefined, release: undefined, pw: undefined, pwm: undefined, noise: undefined, lfoRate: undefined,
      vibrato: undefined, lfoFilter: undefined, drive: undefined, glide: undefined, transpose: undefined, saw: undefined, pulse: undefined, sub: undefined, chorusMix: undefined, width: undefined, hpf: undefined, chorusMode: undefined, vcaMode: undefined };
    this.target = { cutoff: undefined, resonance: undefined, filterEnv: undefined, keytrack: undefined, attack: undefined, decay: undefined, sustain: undefined, release: undefined, pw: undefined, pwm: undefined, noise: undefined, lfoRate: undefined,
      vibrato: undefined, lfoFilter: undefined, drive: undefined, glide: undefined, transpose: undefined, saw: undefined, pulse: undefined, sub: undefined, chorusMix: undefined, width: undefined };
    this.hpfHz = [20, 80, 180, 400]; this.voices = []; this.serial = 0; this.frame = 0;
    this.seed = 197903; this.lfoPhase = 0;
    this.delayL = new Float32Array(Math.ceil(sr * 0.08)); this.delayR = new Float32Array(this.delayL.length);
    this.delayPos = 0; this.chorusPhase = 0; this.dcL = 0; this.dcR = 0; this.lastL = 0; this.lastR = 0;
    this.setParams(p, true);
  }
  // alleen eindige getallen en geldige keuzes worden overgenomen
  setParams(p, init) {
    if (!p || typeof p !== 'object') return;
    for (const k of NUM_KEYS) {
      const v = p[k];
      if (typeof v === 'number' && Number.isFinite(v)) { this.target[k] = v; if (init || this.p[k] === undefined) this.p[k] = v; }
    }
    if (p.hpf === 0 || p.hpf === 1 || p.hpf === 2 || p.hpf === 3) this.p.hpf = p.hpf;
    if (p.chorusMode === 0 || p.chorusMode === 1 || p.chorusMode === 2 || p.chorusMode === 3) this.p.chorusMode = p.chorusMode;
    if (p.vcaMode === 'env' || p.vcaMode === 'gate') this.p.vcaMode = p.vcaMode;
  }
  random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  enqueue(e) {
    if (!Number.isFinite(e && e.time)) return;
    if ((e.type === 'note' || e.type === 'noteon' || e.type === 'noteoff') && !Number.isFinite(e.note)) return;
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
  voice(note, vel, token) {
    return { note, vel, token, gate: true, p1: 0, sub: 0, freq: 440 * 2 ** ((note - 69) / 12), amp: this.newEg(), env: this.newEg(),
      filter: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], g: 0.1, hg: 0.01, k: 1, alive: true, seed: ++this.serial };
  }
  event(e) {
    const type = e.type;
    if (type === 'control') { this.setParams(e.params); return; }
    if (type === 'panic' || type === 'allnotesoff') { for (const v of this.voices) v.gate = false; return; }
    if (type === 'note' || type === 'noteon') {
      if (!(e.vel > 0)) { this.event({ type: 'noteoff', note: e.note }); return; }
      if (this.voices.length >= 6) { const index = this.voices.findIndex(v => !v.gate); this.voices.splice(index >= 0 ? index : 0, 1); }
      this.voices.push(this.voice(e.note, e.vel, e.token));
      return;
    }
    if (type === 'noteoff' || type === 'autooff') {
      for (const v of this.voices) if (type === 'autooff' ? v.token === e.token : v.note === e.note) v.gate = false;
    }
  }
  blep(t, dt) {
    if (t < dt) { t /= dt; return t + t - t * t - 1; }
    if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
    return 0;
  }
  sawOsc(phase, dt) { return 2 * phase - 1 - this.blep(phase, dt); }
  pulseOsc(phase, dt, pw) {
    const w = Math.max(0.05, Math.min(0.95, pw));
    let v = phase < w ? 1 : -1;
    v += this.blep(phase, dt); v -= this.blep((phase - w + 1) % 1, dt);
    return v;
  }
  // tweepolig statevariabel-filter; de toestand blijft binnen ±8
  svf(x, s, g, k, high) {
    const a = 1 / (1 + g * (g + k)), v1 = (s.x + g * (x - s.y)) * a, v2 = s.y + g * v1;
    s.x = Math.max(-8, Math.min(8, 2 * v1 - s.x)); s.y = Math.max(-8, Math.min(8, 2 * v2 - s.y));
    return high ? x - k * v1 - v2 : v2;
  }
  voiceSample(v, lfo) {
    const p = this.p, sr = this.sr, gateMode = p.vcaMode === 'gate';
    const a = this.eg(v.amp, v.gate, gateMode ? 0.003 : p.attack || 0.005, gateMode ? 0.01 : p.decay || 0.3, gateMode ? 1 : p.sustain ?? 0.7, gateMode ? 0.03 : p.release || 0.2);
    const e = this.eg(v.env, v.gate, p.attack, p.decay, p.sustain, p.release);
    const transpose = (p.transpose || 0) + (p.vibrato || 0) * lfo / 100, freq = 440 * 2 ** ((v.note - 69 + transpose) / 12);
    const glide = Math.max(0.0001, p.glide || 0.0001), gcoef = Math.min(1, 5 / (glide * sr));
    v.freq += (freq - v.freq) * gcoef;
    const pw = Math.max(0.05, Math.min(0.95, (p.pw || 0.5) + (p.pwm || 0) * lfo * 0.43)), dt = Math.max(0.00001, Math.min(0.45, v.freq / sr));
    let x = this.sawOsc(v.p1, dt) * (p.saw || 0) + this.pulseOsc(v.p1, dt, pw) * (p.pulse || 0);
    x += this.pulseOsc(v.sub, Math.min(0.45, dt / 2), 0.5) * (p.sub || 0);
    x += this.random() * (p.noise || 0);
    v.p1 += dt; v.p1 %= 1; v.sub = (v.sub + dt / 2) % 1;
    if ((this.frame & 15) === 0) {
      const tracking = (p.keytrack ?? 0.5) * (v.note - 60) / 12;
      const cut = Math.max(25, Math.min(sr * 0.43, (p.cutoff || 2500) * 2 ** ((p.filterEnv || 0) * e + (p.lfoFilter || 0) * lfo * 3 + tracking)));
      v.g = Math.tan(Math.PI * cut / sr); v.k = Math.max(0.07, 2 - (p.resonance || 0) * 1.93);
      const hpf = this.hpfHz[p.hpf || 0] || 20;
      v.hg = Math.tan(Math.PI * Math.min(sr * 0.43, hpf) / sr);
    }
    x = Math.tanh(x * (1 + (p.drive || 0) * 5));
    x = this.svf(x, v.filter[0], v.g, v.k, false);
    x = this.svf(x, v.filter[1], v.g, Math.max(0.35, v.k), false);
    x = this.svf(x, v.filter[2], v.hg, 1.4, true);
    v.alive = v.gate || a > 0.00001;
    return Math.tanh(x) * a * v.vel * 0.24;
  }
  delayRead(buffer, pos) {
    const len = buffer.length, at = (this.delayPos - pos + len) % len, lo = Math.floor(at), f = at - lo;
    return buffer[lo] * (1 - f) + buffer[(lo + 1) % len] * f;
  }
  // na een ontsporing: alles wat geheugen heeft schoon beginnen
  recover() {
    this.voices.length = 0; this.delayL.fill(0); this.delayR.fill(0);
    this.dcL = 0; this.dcR = 0; this.lastL = 0; this.lastR = 0; this.lfoPhase = 0; this.chorusPhase = 0;
  }
  process(left, right, time) {
    const sr = this.sr;
    for (let i = 0; i < left.length; i++) {
      const t = time + i / sr;
      while (this.queue.length && this.queue[0].time <= t + 1e-10) this.event(this.queue.shift());
      if ((this.frame & 31) === 0) for (const k of NUM_KEYS) { const tv = this.target[k]; if (tv !== undefined) this.p[k] += (tv - this.p[k]) * 0.04; }
      const p = this.p, rate = p.lfoRate || 1;
      this.lfoPhase += rate / sr;
      if (this.lfoPhase >= 1) { this.lfoPhase %= 1; this.random(); }   // de sample-and-hold-trekking blijft de ruisreeks opschuiven
      const lfo = 1 - 4 * Math.abs(this.lfoPhase - 0.5);
      let l = 0, r = 0;
      for (const v of this.voices) {
        let sample = this.voiceSample(v, lfo);
        if (!(sample > -100 && sample < 100)) { sample = 0; v.alive = false; }   // bewaker: een ontspoorde stem gaat weg
        l += sample; r += sample;
      }
      for (let j = this.voices.length - 1; j >= 0; j--) if (this.voices[j].alive === false) this.voices.splice(j, 1);
      if (p.chorusMode) {
        this.delayL[this.delayPos] = l; this.delayR[this.delayPos] = r;
        this.chorusPhase = (this.chorusPhase + (p.chorusMode === 2 ? 0.9 : 0.48) / sr) % 1;
        const wave = Math.sin(this.chorusPhase * Math.PI * 2), depth = p.chorusMode === 3 ? 0.005 : 0.0025, wet = p.chorusMix ?? 0.6, width = p.width ?? 1;
        l = l * (1 - wet * 0.25) + this.delayRead(this.delayL, (0.018 + wave * depth) * sr) * wet;
        r = r * (1 - wet * 0.25) + this.delayRead(this.delayR, (0.022 - wave * depth * width) * sr) * wet;
        this.delayPos = (this.delayPos + 1) % this.delayL.length;
      }
      const yl = l - this.lastL + 0.995 * this.dcL, yr = r - this.lastR + 0.995 * this.dcR;
      if (yl > -1e6 && yl < 1e6 && yr > -1e6 && yr < 1e6) {
        this.lastL = l; this.lastR = r; this.dcL = yl; this.dcR = yr;
        left[i] = 0.9 * Math.tanh(yl / 0.9); right[i] = 0.9 * Math.tanh(yr / 0.9);
      } else { this.recover(); left[i] = 0; right[i] = 0; }   // bewaker: niet-eindige of absurde waarde, schoon herbeginnen
      this.frame++;
    }
  }
}

const WORKLET = 'const NUM_KEYS=' + JSON.stringify(NUM_KEYS) + ';\n' + PolyChorusEngine.toString() + '\n' +
  'registerProcessor(' + JSON.stringify(WNAME) + ', class extends AudioWorkletProcessor {\n' +
  ' constructor(options){super();this.engine=new PolyChorusEngine(sampleRate,options.processorOptions.params);this.closed=false;\n' +
  '  this.port.onmessage=e=>{const m=e.data;if(!m)return;if(m.type==="params")this.engine.setParams(m.params);else if(m.type==="event")this.engine.enqueue(m.event);else if(m.type==="close")this.closed=true;};}\n' +
  ' process(inputs,outputs){if(this.closed)return false;const o=outputs[0];if(o&&o.length)this.engine.process(o[0],o[1]||o[0],currentTime);return true;}\n' +
  '});';

const EN = {
  'Cutoff': 'Cutoff', 'Resonantie': 'Resonance', 'Filter-EG': 'Filter envelope', 'Key tracking': 'Key tracking',
  'VCA attack': 'VCA attack', 'VCA decay': 'VCA decay', 'VCA sustain': 'VCA sustain', 'VCA release': 'VCA release',
  'Pulsbreedte': 'Pulse width', 'PWM-diepte': 'PWM depth', 'Ruis': 'Noise', 'LFO-snelheid': 'LFO rate', 'LFO → pitch': 'LFO → pitch', 'LFO → filter': 'LFO → filter',
  'Drive': 'Drive', 'Portamento': 'Portamento', 'Transpositie': 'Transpose', 'Uitgang': 'Output', 'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Sub': 'Sub',
  'Chorus-mix': 'Chorus mix', 'Chorusbreedte': 'Chorus width',
  'Filters': 'Filters', 'Versterker / envelope': 'Amplifier / envelope', 'Oscillatoren': 'Oscillators', 'Modulatie': 'Modulation', 'Master': 'Master',
  'Oscillator': 'Oscillator', 'Filter': 'Filter', 'Versterker': 'Amplifier', 'Chorus': 'Chorus',
  'Klank': 'Sound', 'High-pass': 'High-pass', 'VCA': 'VCA', '0 · diep': '0 · deep', '3 · dun': '3 · thin', 'Uit': 'Off', 'Envelope': 'Envelope', 'Gate': 'Gate',
  'Testnoot MIDI': 'Test note (MIDI)', 'Speel noot': 'Play note', 'Houd noot': 'Hold note', 'Test akkoord': 'Test chord', 'Alles uit': 'All off',
  'Golfvorm van de uitgang': 'Output waveform',
  'Audiomotor wordt voorbereid…': 'Preparing the audio engine…', 'Deze omgeving biedt geen audioprocessor.': 'This environment has no audio processor.',
  'Audiomotor gereed · keyboard en testknoppen beschikbaar': 'Audio engine ready · keyboard and test buttons available',
};

// id, naam, min, max, standaard, rol, schaal, eenheid, spoor, stap — de volgorde is de volgorde van params()
const SPEC_LIST = [
  ['cutoff', 'Cutoff', 30, 16000, 2400, 'filter', 'log', 'Hz', 'filter', 0.01],
  ['resonance', 'Resonantie', 0, 1, 0.25, 'res', 'lin', '', 'filter', 0.01],
  ['filterEnv', 'Filter-EG', -5, 5, 2, 'env', 'lin', '', 'filter', 0.01],
  ['keytrack', 'Key tracking', 0, 1, 0.5, 'pitch', 'lin', '', 'filter', 0.01],
  ['attack', 'VCA attack', 0.001, 4, 0.008, 'env', 'log', 's', 'amp', 0.01],
  ['decay', 'VCA decay', 0.01, 8, 0.3, 'decay', 'log', 's', 'amp', 0.01],
  ['sustain', 'VCA sustain', 0, 1, 0.65, 'env', 'lin', '', 'amp', 0.01],
  ['release', 'VCA release', 0.01, 8, 0.3, 'decay', 'log', 's', 'amp', 0.01],
  ['pw', 'Pulsbreedte', 0.05, 0.95, 0.5, 'color', 'lin', '', 'source', 0.01],
  ['pwm', 'PWM-diepte', 0, 1, 0.2, 'color', 'lin', '', 'motion', 0.01],
  ['noise', 'Ruis', 0, 1, 0, 'texture', 'lin', '', 'source', 0.01],
  ['lfoRate', 'LFO-snelheid', 0.05, 30, 2, 'motion', 'log', 'Hz', 'motion', 0.01],
  ['vibrato', 'LFO → pitch', 0, 120, 0, 'pitch', 'lin', 'cent', 'motion', 0.01],
  ['lfoFilter', 'LFO → filter', 0, 1, 0, 'filter', 'lin', '', 'motion', 0.01],
  ['drive', 'Drive', 0, 1, 0.1, 'color', 'lin', '', 'master', 0.01],
  ['glide', 'Portamento', 0.001, 1, 0.005, 'glide', 'log', 's', 'motion', 0.01],
  ['transpose', 'Transpositie', -24, 24, 0, 'pitch', 'lin', 'st', 'source', 1],
  ['level', 'Uitgang', 0, 1, 0.75, 'level', 'lin', '', 'master', 0.01],
  ['saw', 'Zaagtand', 0, 1, 0.8, 'level', 'lin', '', 'source', 0.01],
  ['pulse', 'Puls', 0, 1, 0.35, 'level', 'lin', '', 'source', 0.01],
  ['sub', 'Sub', 0, 1, 0.3, 'sub', 'lin', '', 'source', 0.01],
  ['chorusMix', 'Chorus-mix', 0, 1, 0.65, 'color', 'lin', '', 'motion', 0.01],
  ['width', 'Chorusbreedte', 0, 1, 1, 'pan', 'lin', '', 'motion', 0.01],
];
const SPEC = Object.fromEntries(SPEC_LIST.map(([id, name, min, max, def, role, scale, unit, lane, step]) => [id, { name, min, max, def, role, scale, unit, lane, step }]));
const LANES = { filter: 'Filters', amp: 'Versterker / envelope', source: 'Oscillatoren', motion: 'Modulatie', master: 'Master' };

const DEFAULTS = { ...Object.fromEntries(SPEC_LIST.map(s => [s[0], s[4]])), testNote: 48, preset: 'Warm Poly', hpf: 0, chorusMode: 1, vcaMode: 'env' };
const OPTIONS = {
  hpf: [[0, '0 · diep'], [1, '1'], [2, '2'], [3, '3 · dun']],
  chorusMode: [[0, 'Uit'], [1, 'I'], [2, 'II'], [3, 'I + II']],
  vcaMode: [['env', 'Envelope'], ['gate', 'Gate']],
};
const LABELS = { hpf: 'High-pass', chorusMode: 'Chorus', vcaMode: 'VCA' };
// klanken in het apparaat zelf: een keuze zet alle knoppen (op wat hier staat na) op hun beginwaarde
const SOUNDS = {
  'Warm Poly': {},
  'Rave Chords': { cutoff: 1800, filterEnv: 3.1, decay: 0.22, sustain: 0.2, release: 0.25, resonance: 0.4 },
  'Silk Strings': { cutoff: 2200, attack: 1.1, release: 2.5, filterEnv: 0.5, chorusMode: 2 },
  'Deep Sub': { saw: 0.2, pulse: 0, sub: 0.9, cutoff: 600, filterEnv: 1, chorusMode: 0 },
  'PWM Cloud': { saw: 0, pulse: 0.9, pwm: 0.8, lfoRate: 0.25, attack: 0.8, release: 3 },
  'Slow Brass': { filterEnv: 3, attack: 0.25, decay: 1, sustain: 0.6, chorusMix: 0.35 },
  'Muted Pluck': { cutoff: 800, filterEnv: 2, decay: 0.2, sustain: 0, release: 0.1 },
  'Wide Organ': { cutoff: 7000, filterEnv: 0, attack: 0.003, sustain: 1, chorusMode: 3 },
};
// indeling van de kaart (alleen de UI; de state en de sporen van params() staan hierboven)
const SECTIONS = [
  ['Oscillator', ['saw', 'pulse', 'sub', 'noise', 'pw', 'transpose'], 'oscillator'],
  ['Filter', ['@hpf', 'cutoff', 'resonance', 'filterEnv', 'keytrack', 'drive'], 'filter'],
  ['Versterker', ['@vcaMode', 'attack', 'decay', 'sustain', 'release'], 'amp'],
  ['Modulatie', ['lfoRate', 'vibrato', 'lfoFilter', 'pwm', 'glide'], 'modulation'],
  ['Chorus', ['@chorusMode', 'chorusMix', 'width'], 'chorus'],
  ['Uitgang', ['level'], 'output'],
];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => (typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d);
const cleanType = e => String(e && e.type || '').toLowerCase().replace(/[_-]/g, '');
const hz = n => 440 * 2 ** ((n - 69) / 12);

const CSS = `
:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:#91e0d4;--x-acc2:#e8c991;--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px}
p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}
.control span{font-size:11px;color:var(--muted,#adc3c9)}
button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%}
button{cursor:pointer;touch-action:none}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}
input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}
output{font:12px monospace;color:var(--x-ink2)}
h3{font-size:13px;color:var(--x-ink2);margin:14px 0 8px}
canvas{display:block;width:100%;height:64px;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px;touch-action:none}
label{min-width:0}`;

export default {
  id: 'nl.patchkamer.polychorus',
  name: 'Poly Chorus',
  version: '1.13.1',
  modExclude: ['testNote'],   // werkstand, geen klank (de testnoot is nu een aangemelde regelaar; zo blijft hij bewust buiten params())
  kind: 'instrument',
  category: 'synth',
  ui: { width: 920, minWidth: 380 },
  about: { nl: 'Zesstemmige synth: zaagtand, puls met PWM, sub en ruis, met een stereo-chorus.\n\nDe zaagtand, puls en sub worden gemengd. De hoogdoorlaat heeft vier standen. Chorus I en II zijn twee eigen delaymodulaties; samen geven ze een bredere chorus.\n\nHet apparaat heeft eigen klanken en klanksynthese. De paarse Mod-ingang verandert de klank zonder de basiswaarden te overschrijven.', en: 'A six-voice synth: sawtooth, pulse with PWM, sub and noise, with a stereo chorus.\n\nThe sawtooth, pulse and sub are mixed. The high-pass has four settings. Chorus I and II are two delay modulations; together they give a wider chorus.\n\nThe device has its own sounds and sound synthesis. The purple Mod input changes the sound without overwriting the base values.' },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },
  ports: {
    audioIn: [],
    audioOut: [{ id: 'out', name: 'Out' }],
    eventIn: [{ id: 'notes', name: 'Notes' }],
    eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }],
    modOut: [],
  },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let dead = false, state = { ...DEFAULTS }, mod = {}, effective = {};
    let wrapEl = null, root = null, panel = null, scope = null, scopeCtx = null, statusEl = null, refreshers = [], stopDraw = null, ro = null, cw = 600, col = null, colT = 0;
    let backend = null, backendType = 'loading', pending = [], heldDemo = false;
    const nodes = new Set();
    const own = n => (nodes.add(n), n);

    function resolve() {
      const e = { ...state };
      for (const id in SPEC) { const d = SPEC[id], x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); }
      effective = e; return e;
    }
    resolve();
    const engineParams = () => {
      const o = {}; for (const k of NUM_KEYS) o[k] = effective[k];
      o.hpf = effective.hpf; o.chorusMode = effective.chorusMode; o.vcaMode = effective.vcaMode; return o;
    };

    // ---------- audio: motor (worklet) -> volume -> compressor -> ceiling -> uitgang ----------
    const volume = own(ctx.createGain()); volume.gain.value = state.level;
    const comp = own(ctx.createDynamicsCompressor());
    comp.threshold.value = -10; comp.ratio.value = 5; comp.knee.value = 8; comp.attack.value = 0.003; comp.release.value = 0.18;
    const out = own(ctx.createWaveShaper());
    { const c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); out.curve = c; }
    out.oversample = (host.audio && host.audio.oversample) || '2x';
    const analyser = own(ctx.createAnalyser()); analyser.fftSize = 1024;
    const trim = own(ctx.createGain()); trim.gain.value = 3;   // +9,5 dB achter de compressor: de tunes waren erg zacht; het plafond rondt de pieken af
    volume.connect(comp).connect(trim).connect(out); out.connect(analyser);
    const scopeData = new Float32Array(analyser.fftSize);

    function send(message) {
      if (dead) return;
      if (backendType === 'worklet') backend.port.postMessage(message);
      else if (backendType === 'loading' && message.type === 'event') { pending.push(message.event); if (pending.length > 1024) pending.shift(); }
    }
    function status() { if (statusEl) statusEl.textContent = backendType === 'loading' ? tx('Audiomotor wordt voorbereid…') : backendType === 'unavailable' ? tx('Deze omgeving biedt geen audioprocessor.') : tx('Audiomotor gereed · keyboard en testknoppen beschikbaar'); }
    function apply() {
      if (dead) return; resolve();
      volume.gain.setTargetAtTime(effective.level, ctx.currentTime, 0.025);
      send({ type: 'params', params: engineParams() });
    }
    const loader = host && typeof host.loadWorklet === 'function' && typeof AudioWorkletNode === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('no worklet'));
    loader.then(() => {
      if (dead) return;
      backend = own(new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { params: engineParams() } }));
      backendType = 'worklet'; backend.connect(volume);
      for (const e of pending) backend.port.postMessage({ type: 'event', event: e });
      pending = []; status();
    }).catch(() => { if (dead) return; backendType = 'unavailable'; status(); });

    const panic = (t = ctx.currentTime) => { heldDemo = false; send({ type: 'event', event: { type: 'allnotesoff', time: t } }); };
    const note = (n, vel, t, dur, held = false) => send({ type: 'event', event: { type: 'note', note: Math.round(clamp(n, 0, 127)), vel: clamp(vel, 0, 1), time: t, dur, held } });

    // ---------- state ----------
    function normalize(raw) {
      const s = raw && typeof raw === 'object' ? raw : {}, next = { ...DEFAULTS };
      for (const id in SPEC) next[id] = finite(s[id], DEFAULTS[id], SPEC[id].min, SPEC[id].max);
      for (const id in OPTIONS) if (OPTIONS[id].some(([v]) => String(v) === String(s[id]))) next[id] = typeof DEFAULTS[id] === 'number' ? Number(s[id]) : String(s[id]);
      next.preset = Object.hasOwn(SOUNDS, s.preset) ? s.preset : DEFAULTS.preset;
      next.testNote = Math.round(finite(s.testNote, DEFAULTS.testNote, 24, 96));
      return next;
    }

    // ---------- UI ----------
    const add = (parent, tag, text) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; parent.appendChild(el); return el; };
    const fmtOf = id => { const d = SPEC[id]; return v => (Math.abs(v) >= 100 ? v.toFixed(0) : Number(v).toFixed(2)) + (d.unit ? ' ' + d.unit : ''); };
    // meldt een regelaar aan bij de host, zodat een skin hem herkent (contract v1.15); een oudere host negeert dit
    const adopt = (el, id, role, group, label) => { if (host && host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    function knob(parent, id, group) {
      const d = SPEC[id], log = d.scale === 'log', fmt = fmtOf(id);
      const toVal = x => (log ? d.min * (d.max / d.min) ** x : x), toPos = v => (log ? Math.log(v / d.min) / Math.log(d.max / d.min) : v);
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(d.name));
      const o = add(box, 'output', fmt(state[id])), i = add(box, 'input'); i.type = 'range';
      [i.min, i.max, i.step] = (log ? [0, 1, 0.001] : [d.min, d.max, d.step]).map(String);
      i.value = String(toPos(state[id])); i.dataset.pkDefault = String(toPos(d.def)); adopt(i, id, 'param', group, tx(d.name));
      i.addEventListener('input', () => { state[id] = toVal(Number(i.value)); o.textContent = fmt(state[id]); apply(); });
      refreshers.push(() => { i.value = String(toPos(state[id])); o.textContent = fmt(state[id]); });
    }
    function choose(parent, label, options, get, set, id, group) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label);
      const el = add(box, 'select'); adopt(el, id, 'select', group, label);
      for (const [v, t] of options) { const o = add(el, 'option', tx(t)); o.value = String(v); }
      el.value = String(get()); el.addEventListener('change', () => set(el.value));
      refreshers.push(() => { el.value = String(get()); });
    }
    function readColors() {
      if (!scope) return; const cs = getComputedStyle(scope), v = (n, d) => cs.getPropertyValue(n).trim() || d; colT = performance.now();
      col = { well: v('--well', '#0b171d'), fg: v('--well-fg', '#c7dbe0') };
    }
    function draw() {
      if (dead || !scope || !scopeCtx) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const w = Math.max(260, Math.min(1200, cw)), h = 64, dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4);
      if (scope.width !== Math.round(w * dpr)) { scope.width = Math.round(w * dpr); scope.height = Math.round(h * dpr); }
      const g = scopeCtx; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      analyser.getFloatTimeDomainData(scopeData);
      g.fillStyle = col.well; g.fillRect(0, 0, w, h); g.strokeStyle = col.fg; g.beginPath();
      for (let i = 0; i < scopeData.length; i++) { const x = i / (scopeData.length - 1) * w, y = h / 2 - clamp(scopeData[i], -1, 1) * h * 0.46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    const onSkin = () => { col = null; };
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    const drawLoop = (inst, cb, fps) => {   // terugval voor een host zonder host.frame (§12b)
      if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
      let raf = 0, last = 0, stop = false;
      const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
      raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
    };
    function unmountUI() {
      stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
      if (wrapEl) { wrapEl.remove(); wrapEl = null; }
      root = null; panel = null; scope = null; scopeCtx = null; statusEl = null; refreshers = []; col = null;
    }

    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        unmountUI();
        const wrap = add(el, 'div'), shadow = wrap.attachShadow({ mode: 'open' }); wrapEl = wrap;
        add(shadow, 'style', CSS); root = shadow;
        panel = add(shadow, 'div'); panel.className = 'app';
        const top = add(panel, 'div'); top.className = 'row';
        choose(top, tx('Klank'), Object.keys(SOUNDS).map(k => [k, k]), () => state.preset, v => self.setState({ ...DEFAULTS, ...SOUNDS[v], preset: v, testNote: state.testNote }), 'preset', 'setup');
        const play = add(panel, 'div'); play.className = 'row';
        { // testnoot
          const box = add(play, 'label'); box.className = 'control'; add(box, 'span', tx('Testnoot MIDI'));
          const o = add(box, 'output', String(state.testNote)), i = add(box, 'input'); i.type = 'range'; i.min = '24'; i.max = '96'; i.step = '1'; i.value = String(state.testNote); i.dataset.pkDefault = String(DEFAULTS.testNote); adopt(i, 'testNote', 'param', 'setup', tx('Testnoot MIDI'));
          i.addEventListener('input', () => { state.testNote = Number(i.value); o.textContent = String(state.testNote); });
          refreshers.push(() => { i.value = String(state.testNote); o.textContent = String(state.testNote); });
        }
        const btn = (label, fn) => { const b = add(play, 'button', tx(label)); b.type = 'button'; b.onclick = fn; return b; };
        btn('Speel noot', () => note(state.testNote, 0.85, ctx.currentTime, 1));
        btn('Houd noot', () => { heldDemo = !heldDemo; if (heldDemo) note(state.testNote, 0.8, ctx.currentTime, undefined, true); else panic(); });
        btn('Test akkoord', () => { for (const n of [0, 3, 7]) note(state.testNote + n, 0.7, ctx.currentTime, 1.6); });
        btn('Alles uit', () => panic());
        for (const [title, ids, group] of SECTIONS) {
          const sec = add(panel, 'div'); sec.className = 'sec'; sec.dataset.lane = group;
          add(sec, 'h3', tx(title));
          const g = add(sec, 'div'); g.className = 'grid';
          for (const id of ids) {
            if (id[0] === '@') { const k = id.slice(1); choose(g, tx(LABELS[k]), OPTIONS[k], () => state[k], v => { state[k] = typeof DEFAULTS[k] === 'number' ? Number(v) : v; apply(); }, k, group); } else knob(g, id, group);
          }
        }
        add(panel, 'h3', tx('Golfvorm van de uitgang'));
        scope = add(panel, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang')); scopeCtx = scope.getContext('2d'); cw = scope.clientWidth || 600;
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) cw = w; }); ro.observe(scope); }
        if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        statusEl = add(panel, 'p'); status();
        stopLoop(); stopDraw = drawLoop(self, draw, 20);
      },
      unmount() { unmountUI(); },
      onEvent(port, e) {
        try {
          if (dead || port !== 'notes' || !Number.isFinite(e && e.time)) return;
          const type = cleanType(e), time = Math.max(ctx.currentTime, e.time);
          if (type === 'panic' || type === 'allnotesoff') { panic(time); return; }
          if (type === 'cc' && Object.hasOwn(SPEC, e.id) && Number.isFinite(e.value)) {
            const d = SPEC[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min); resolve();
            volume.gain.setTargetAtTime(effective.level, time, 0.025);
            send({ type: 'event', event: { type: 'control', params: engineParams(), time } }); refreshers.forEach(f => f()); return;
          }
          if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(e.note)) return;
          send({ type: 'event', event: {
            type: type === 'noteoff' || e.vel === 0 ? 'noteoff' : type, note: Math.round(clamp(e.note, 0, 127)), vel: finite(e.vel, 0.8, 0, 1), time,
            held: e.held === true || type === 'noteon' && !Number.isFinite(e.dur), dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1 } });
        } catch (err) { /* een rare gebeurtenis mag het apparaat niet stoppen */ }
      },
      onTransport(e) { if (!dead && e && e.playing === false) panic(); },
      params() {
        return SPEC_LIST.map(([id, name, min, max, , role, scale, , lane]) => ({ id, name: tx(name), lane, laneName: tx(LANES[lane]), min, max, scale, role, drift: 0.015, on: role !== 'level' && role !== 'pitch' }));
      },
      modulate(raw) {
        mod = {};
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in SPEC) if (Object.hasOwn(raw, id) && typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1);
        apply();
      },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; panic(); state = normalize(raw); apply(); refreshers.forEach(f => f()); },
      getPreset() { const p = self.getState(); delete p.testNote; return p; },   // de testnoot is een werkstand, geen klank
      setPreset(p) { if (dead) return; self.setState({ ...(p && typeof p === 'object' ? p : {}), testNote: state.testNote }); },
      destroy() {
        if (dead) return; panic();
        if (backendType === 'worklet') { try { backend.port.postMessage({ type: 'close' }); backend.port.close(); } catch (err) { /* al weg */ } }
        dead = true; pending = []; unmountUI();
        for (const n of nodes) try { n.disconnect(); } catch (err) { /* al los */ }
        nodes.clear();
      },
    };
    apply();
    return self;
  },
};
