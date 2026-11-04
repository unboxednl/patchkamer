// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang, poortnamen per taal in i18n), nieuwe worklet-naam. setState negeert onbekende velden en kapt getallen af op hun bereik.
//          Bewaker in de worklet: NaN en ±Infinity op de ingang worden 0 en ±16 (+24 dB), een niet-eindige Manual-stuurwaarde wordt begrensd, en een vertraglijn waarin toch iets niet-eindigs
//          terechtkomt, wordt geleegd. Voorheen bleef de terugkoppeling na één NaN voorgoed NaN geven. De vertraglijn is nu groot genoeg voor 96 kHz.
//          Normaal geluid is bit-identiek aan de vorige versie (bij 44,1 en 48 kHz).
// Flanger: stereo flanger als AudioWorklet: korte vertraging (0,2–12 ms) met fractionele interpolatie, terugkoppeling tot ±97% zonder de minimale
// lusvertraging van gewone Web Audio-nodes, LFO (sinus/driehoek) vrij of op tempo, stereo faseverschil. Stuurbaar. Valt terug op doorgeven als
// AudioWorklet niet beschikbaar is. Eigen code.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SYNC = [['free', 'vrij'], ['32', '8 maten'], ['16', '4 maten'], ['8', '2 maten'], ['4', '1 maat'], ['2', '1/2'], ['1', '1/4']];
const MODP = [['rate', 'Snelheid', 0.02, 10, true, 'rate', 0.1, true], ['depth', 'Diepte', 0, 1, false, 'depth', 0.1, true], ['manual', 'Manual', 0.2, 12, true, 'time', 0.1, true],
  ['fb', 'Feedback', -0.97, 0.97, false, 'feedback', 0.08, false], ['stereo', 'Stereo', 0, 1, false, 'width', 0.1, false], ['mix', 'Mix', 0, 1, false, 'send', 0.06, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ rate: 0.15, depth: 0.7, manual: 2.5, fb: 0.6, stereo: 0.25, mix: 0.5, shape: 0, sync: 'free' });
// Engels woordenboek; de Nederlandse tekst is de sleutel (host.lang 'nl'), wat ontbreekt blijft zoals het is
const EN = {
  'Golf': 'Wave', 'Sinus': 'Sine', 'Driehoek': 'Triangle',
  'vrij': 'free', '8 maten': '8 bars', '4 maten': '4 bars', '2 maten': '2 bars', '1 maat': '1 bar',
  'Snelheid': 'Rate', 'Diepte': 'Depth',
  'AudioWorklet actief.': 'AudioWorklet active.', 'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar ({0}); het geluid gaat onbewerkt door.': 'AudioWorklet unavailable ({0}); the sound passes through unprocessed.',
  'geen AudioWorklet': 'no AudioWorklet',
};
const WNAME = 'nl-patchkamer-flanger-1-11-0';
const WORKLET = `
const IN_MAX = 16;
class PkFlanger extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    { name: 'rate', defaultValue: 0.15, minValue: 0, maxValue: 40, automationRate: 'k-rate' },
    { name: 'depth', defaultValue: 0.7, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'manual', defaultValue: 2.5, minValue: 0.05, maxValue: 20, automationRate: 'a-rate' },
    { name: 'fb', defaultValue: 0.6, minValue: -0.99, maxValue: 0.99, automationRate: 'k-rate' },
    { name: 'stereo', defaultValue: 0.25, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'shape', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' } ]; }
  constructor() {
    super();
    // lijn voor de langste vertraging (20 ms x 1,9 = 38 ms): 2048 monsters bij 44,1 en 48 kHz, meer bij een hogere samplefrequentie
    this.n = 2048; while (this.n < sampleRate * 0.039) this.n *= 2;
    this.buf = [new Float32Array(this.n), new Float32Array(this.n)]; this.w = 0; this.ph = 0;
  }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], len = out[0].length, sr = sampleRate;
    const rate = P.rate[0], depth = P.depth[0], fb = P.fb[0], st = P.stereo[0], mix = P.mix[0], tri = P.shape[0] > 0.5, man = P.manual;
    let acc = 0;
    for (let i = 0; i < len; i++) {
      this.ph += rate / sr; if (this.ph >= 1) this.ph -= 1;
      let m = man.length > 1 ? man[i] : man[0]; m = m >= 0.05 ? (m <= 20 ? m : 20) : (m !== m ? 2.5 : 0.05);   // een niet-eindige stuurwaarde zou de leespositie voorgoed vergiftigen
      const w = this.w;
      for (let c = 0; c < 2; c++) {
        let x = inp.length ? (inp[c] || inp[0])[i] : 0;
        if (!(x > -IN_MAX && x < IN_MAX)) x = x !== x ? 0 : x > 0 ? IN_MAX : -IN_MAX;   // NaN, ±Infinity of een absurde waarde zou de terugkoppeling voorgoed vergiftigen
        let p = this.ph + c * st * 0.5; p -= Math.floor(p);
        const l = tri ? (p < 0.5 ? 4 * p - 1 : 3 - 4 * p) : Math.sin(2 * Math.PI * p);
        const dms = Math.max(0.05, m * (1 + 0.9 * depth * l)), d = dms * sr / 1000;
        let r = w - d; while (r < 0) r += this.n; const i0 = Math.floor(r), f = r - i0, b = this.buf[c];
        const y = b[i0 % this.n] * (1 - f) + b[(i0 + 1) % this.n] * f;
        b[w] = x + Math.tanh(y * fb);
        const o = x * (1 - mix) + y * mix; acc += o;
        if (out[c]) out[c][i] = o;
      }
      this.w = (w + 1) % this.n;
    }
    // bewaker: staat er toch iets niet-eindigs in de uitvoer (en dus in de lijn), dan wordt de lijn geleegd in plaats van voorgoed NaN te geven
    if (acc - acc !== 0) { this.buf[0].fill(0); this.buf[1].fill(0); for (const o of out) o.fill(0); }
    return true;
  }
}
registerProcessor('${WNAME}', PkFlanger);
`;

// ongeldige of ontbrekende waarden krijgen de standaard, getallen worden binnen hun bereik gehouden
function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  for (const k of Object.keys(d)) {
    const v = s[k], m = MODBY[k], r = m ? [m[2], m[3]] : k === 'shape' ? [0, 1] : null;
    S[k] = typeof d[k] === 'number' ? (typeof v === 'number' && Number.isFinite(v) ? (r ? clamp(v, r[0], r[1]) : v) : d[k]) : (typeof v === typeof d[k] ? v : d[k]);
  }
  S.shape = S.shape > 0.5 ? 1 : 0;   // twee golfvormen; dezelfde drempel als de worklet
  if (!SYNC.some(x => x[0] === S.sync)) S.sync = d.sync;
}

export default {
  id: 'nl.patchkamer.flanger',
  name: 'Flanger',
  version: '1.11.0',
  kind: 'effect',
  category: 'effect',
  i18n: { en: { name: 'Flanger', ports: { in: 'In', out: 'Out' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let s = (host && host.lang === 'nl') ? k : (EN[k] ?? k); a.forEach((v, i) => { s = s.replace('{' + i + '}', v); }); return s; };
    const S = DEF(), mod = {}; let bpm = (host && +host.bpm) || 120, dead = false, ui = {}, node = null, note = null, manIn = null, noteKey = ['AudioWorklet laden…'];
    if (!(Number.isFinite(bpm) && bpm > 0)) bpm = 120;
    const inG = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); inG.connect(bypass).connect(out);
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    const rateHz = () => S.sync === 'free' ? E('rate') : bpm / 60 / +S.sync;
    function apply() { if (!node) return; const t = ctx.currentTime, r = 0.03, p = node.parameters;
      p.get('rate').setTargetAtTime(rateHz(), t, r); p.get('depth').setTargetAtTime(E('depth'), t, r); p.get('manual').setTargetAtTime(E('manual'), t, r); p.get('fb').setTargetAtTime(E('fb'), t, r);
      p.get('stereo').setTargetAtTime(E('stereo'), t, r); p.get('mix').setTargetAtTime(E('mix'), t, r); p.get('shape').setValueAtTime(S.shape, t); }
    const paintNote = () => { if (note) note.textContent = tx(...noteKey); };
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('geen AudioWorklet'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') return; node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      inG.disconnect(bypass); inG.connect(node).connect(out); if (manIn) manIn.connect(node.parameters.get('manual')); apply(); noteKey = ['AudioWorklet actief.']; paintNote(); })
      .catch(e => { if (dead) return; noteKey = ['AudioWorklet niet beschikbaar ({0}); het geluid gaat onbewerkt door.', tx((e && e.message) || String(e))]; paintNote(); });
    const pct = v => Math.round(v * 100) + '%';
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        ui.sync = host.ui.select(el, 'Tempo', SYNC.map(([v, n]) => [v, tx(n)]), S.sync, v => { S.sync = v; apply(); });
        ui.shape = host.ui.select(el, tx('Golf'), [[0, tx('Sinus')], [1, tx('Driehoek')]], S.shape, v => { S.shape = +v; apply(); });
        ui.rate = host.ui.knob(el, tx('Snelheid'), [0.02, 10, 0.01], S.rate, v => v.toFixed(2) + ' Hz', v => { S.rate = v; apply(); });
        ui.depth = host.ui.knob(el, tx('Diepte'), [0, 1, 0.01], S.depth, pct, v => { S.depth = v; apply(); });
        ui.manual = host.ui.knob(el, 'Manual', [0.2, 12, 0.05], S.manual, v => v.toFixed(2) + ' ms', v => { S.manual = v; apply(); });
        ui.fb = host.ui.knob(el, 'Feedback', [-0.97, 0.97, 0.01], S.fb, pct, v => { S.fb = v; apply(); });
        ui.stereo = host.ui.knob(el, 'Stereo', [0, 1, 0.01], S.stereo, v => Math.round(v * 180) + '°', v => { S.stereo = v; apply(); });
        ui.mix = host.ui.knob(el, 'Mix', [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); });
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
      },
      unmount() { note = null; },
      onStep({ bpm: b }) { if (Number.isFinite(b) && b > 0 && b !== bpm) { bpm = b; if (S.sync !== 'free') apply(); } },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'flanger', laneName: 'Flanger', min, max, role, scale: log ? 'log' : 'lin', drift, on, fast: id === 'manual' })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      // snelle sturing van Manual: signaal −1..1 → ±6 ms bovenop de knop
      modInput(id) { if (id !== 'manual') return null; if (!manIn) { manIn = ctx.createGain(); manIn.gain.value = 6; if (node) manIn.connect(node.parameters.get('manual')); } return manIn; },
      getState() { return { ...S }; },
      setState(s) {
        restoreValues(S, s); apply();
        ['rate', 'depth', 'manual', 'fb', 'stereo', 'mix'].forEach(k => ui[k] && ui[k].set(S[k])); if (ui.sync) ui.sync.value = S.sync; if (ui.shape) ui.shape.value = S.shape;
      },
      destroy() { if (dead) return; dead = true; [inG, out, bypass, node, manIn].forEach(n => { if (n) try { n.disconnect(); } catch {} }); },
    };
  }
};
