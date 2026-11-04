// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11: eigen map en bestandsnaam zonder versienummer. Tweetalig (host.lang, poortnamen per taal in i18n).
//   setState volgt §13: onbekende velden genegeerd, ongeldige waarden op de standaard, getallen afgekapt op hun bereik; een ongeldige tijd
//   op een noot-gebeurtenis laat het apparaat niet meer struikelen.
//   Bewaker: de ingang wordt begrensd (±16) en NaN wordt 0, en de geheugens van de resonatoren worden per blok op eindigheid gecontroleerd en
//   bij een ontsporing leeggemaakt, zodat één foutieve sample het apparaat niet voor altijd vergiftigt. Normaal geluid is bit-identiek aan 1.8.0.
// Resonator: bank van vier gestemde resonatoren (terugkoppelende kammen met demping in de lus) als AudioWorklet. Stem ze op
// een grondtoon met een akkoord (unisono, octaven, kwint, groot, klein, sus, kwarten); laat de grondtoon desgewenst
// binnenkomende noten volgen. Maakt van ritme of ruis een zingende, gestemde klank. Stuurbaar.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const CHORDS = [['uni', 'Unisono', [0, 0, 0, 0]], ['oct', 'Octaven', [0, 12, 24, -12]], ['fifth', 'Kwinten', [0, 7, 12, 19]], ['maj', 'Groot', [0, 4, 7, 12]], ['min', 'Klein', [0, 3, 7, 12]],
  ['sus', 'Sus4', [0, 5, 7, 12]], ['min7', 'Klein 7', [0, 3, 7, 10]], ['fourth', 'Kwarten', [0, 5, 10, 15]], ['cluster', 'Cluster', [0, 1, 2, 3]]];
const MODP = [['decay', 'Galmtijd', 0.05, 8, true, 'decay', 0.1, true], ['damp', 'Demping', 0, 1, false, 'tone', 0.1, true], ['detune', 'Ontstemming', 0, 50, false, 'detune', 0.15, false],
  ['tune', 'Stemming', -12, 12, false, 'pitch', 0.02, false], ['mix', 'Mix', 0, 1, false, 'send', 0.06, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ root: 45, chord: 'min', decay: 1.5, damp: 0.35, detune: 6, tune: 0, mix: 0.5, gain: 1, follow: false });
const EN = {
  'Grondtoon': 'Root', 'Akkoord': 'Chord', 'Galmtijd': 'Decay', 'Demping': 'Damping', 'Ontstemming': 'Detune', 'Stemming': 'Tuning', 'Niveau': 'Level',
  'Noten': 'Notes', 'negeren': 'ignore', 'grondtoon volgt de noten': 'root follows the notes',
  'Unisono': 'Unison', 'Octaven': 'Octaves', 'Kwinten': 'Fifths', 'Groot': 'Major', 'Klein': 'Minor', 'Klein 7': 'Minor 7', 'Kwarten': 'Fourths',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.': 'AudioWorklet unavailable: the sound passes through unprocessed.',
};
const WNAME = 'nl-patchkamer-resonator-1-11-0';
const WORKLET = `
const IN_MAX = 16;
class PkReson extends AudioWorkletProcessor {
  static get parameterDescriptors() { const p = [{ name: 'decay', defaultValue: 1.5, minValue: 0.01, maxValue: 20, automationRate: 'k-rate' }, { name: 'damp', defaultValue: 0.35, minValue: 0, maxValue: 1, automationRate: 'k-rate' }];
    for (let i = 0; i < 4; i++) p.push({ name: 'f' + i, defaultValue: 110, minValue: 16, maxValue: 8000, automationRate: 'k-rate' }); return p; }
  constructor() { super(); this.n = 8192; this.b = []; this.lp = []; for (let k = 0; k < 8; k++) { this.b.push(new Float32Array(this.n)); this.lp.push(0); } this.w = 0; }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], len = out[0].length, sr = sampleRate;
    let dec = P.decay[0], dp = P.damp[0];
    if (!(dec >= 0.01 && dec <= 20)) dec = 1.5;
    if (!(dp >= 0 && dp <= 1)) dp = 0.35;
    const damp = 0.05 + (1 - dp) * 0.95;
    const d = [], g = []; for (let k = 0; k < 4; k++) { let f = P['f' + k][0]; if (!(f >= 16 && f <= 8000)) f = 110; d[k] = Math.min(this.n - 2, sr / f); g[k] = Math.pow(0.001, (1 / f) / dec); }
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < out.length; c++) {
        let x = inp.length ? (inp[c] || inp[0])[i] : 0; let y = 0;
        // vangnet: NaN, ±Infinity of een absurde waarde zou de geheugens voorgoed vergiftigen
        if (!(x > -IN_MAX && x < IN_MAX)) x = x !== x ? 0 : x > 0 ? IN_MAX : -IN_MAX;
        for (let k = 0; k < 4; k++) { const bi = c * 4 + k, b = this.b[bi]; let r = this.w - d[k]; while (r < 0) r += this.n; const i0 = Math.floor(r), f = r - i0;
          const v = b[i0 % this.n] * (1 - f) + b[(i0 + 1) % this.n] * f; this.lp[bi] += damp * (v - this.lp[bi]); const nv = x * 0.25 + this.lp[bi] * g[k]; b[this.w] = Math.tanh(nv); y += this.lp[bi]; }
        out[c][i] = y * 0.35;
      }
      this.w = (this.w + 1) % this.n;
    }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    for (let k = 0; k < 8; k++) if (!(this.lp[k] > -4 && this.lp[k] < 4)) { for (let j = 0; j < 8; j++) { this.b[j].fill(0); this.lp[j] = 0; } break; }
    return true;
  }
}
registerProcessor('${WNAME}', PkReson);
`;

function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  const ranges = { root: [24, 84], gain: [0, 2], ...Object.fromEntries(MODP.map(p => [p[0], [p[2], p[3]]])) };
  Object.keys(d).forEach(k => {
    const v = s[k];
    S[k] = typeof d[k] === 'number' ? (typeof v === 'number' && Number.isFinite(v) ? clamp(v, ...ranges[k]) : d[k]) : (typeof v === typeof d[k] ? v : d[k]);
  });
  if (!CHORDS.some(c => c[0] === S.chord)) S.chord = d.chord;
}

export default {
  id: 'nl.patchkamer.resonator',
  name: 'Resonator',
  version: '1.11.0',
  kind: 'effect',
  category: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', notes: 'Notes', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [{ id: 'notes', name: 'Noten' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const S = DEF(), mod = {}; let dead = false, ui = {}, node = null, note = null, root = S.root, failed = false;
    const inG = ctx.createGain(), out = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(); inG.connect(dry).connect(out); wet.connect(out);
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    function paintNote() { if (note) note.textContent = node ? '' : failed ? tx('AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.') : tx('AudioWorklet laden…'); }
    function apply(t) { t = t ?? ctx.currentTime; const r = 0.03, mx = E('mix'); wet.gain.setTargetAtTime((node ? mx : 0) * S.gain, t, r); dry.gain.setTargetAtTime(node ? 1 - mx : 1, t, r); if (!node) return;
      const ch = (CHORDS.find(c => c[0] === S.chord) || CHORDS[0])[2], tu = E('tune'), dt = E('detune'), P = node.parameters;
      ch.forEach((iv, k) => { const cents = (k - 1.5) * dt * 0.66; P.get('f' + k).setTargetAtTime(clamp(440 * Math.pow(2, (root + iv + tu - 69) / 12 + cents / 1200), 16, 8000), t, 0.005); });
      P.get('decay').setTargetAtTime(E('decay'), t, r); P.get('damp').setTargetAtTime(E('damp'), t, r); }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead) return; if (typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet'); node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); inG.connect(node).connect(wet); apply(); paintNote(); })
      .catch(() => { if (dead) return; failed = true; apply(); paintNote(); });
    apply();
    const pct = v => Math.round(v * 100) + '%', nn = m => NOTE[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
    const self = {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'minmax(0, 1fr)';   // lange keuzetekst mag de kaart niet breder maken
        ui.root = host.ui.knob(el, tx('Grondtoon'), [24, 84, 1], S.root, nn, v => { S.root = v; root = v; apply(); });
        ui.chord = host.ui.select(el, tx('Akkoord'), CHORDS.map(c => [c[0], tx(c[1])]), S.chord, v => { S.chord = v; apply(); });
        ui.decay = host.ui.knob(el, tx('Galmtijd'), [0.05, 8, 0.01], S.decay, v => v.toFixed(2) + ' s', v => { S.decay = v; apply(); });
        ui.damp = host.ui.knob(el, tx('Demping'), [0, 1, 0.01], S.damp, pct, v => { S.damp = v; apply(); });
        ui.detune = host.ui.knob(el, tx('Ontstemming'), [0, 50, 0.5], S.detune, v => v + ' ct', v => { S.detune = v; apply(); });
        ui.tune = host.ui.knob(el, tx('Stemming'), [-12, 12, 0.01], S.tune, v => (v > 0 ? '+' : '') + v.toFixed(2) + ' st', v => { S.tune = v; apply(); });
        ui.mix = host.ui.knob(el, 'Mix', [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); });
        ui.gain = host.ui.knob(el, tx('Niveau'), [0, 2, 0.01], S.gain, pct, v => { S.gain = v; apply(); });
        ui.follow = host.ui.select(el, tx('Noten'), [['0', tx('negeren')], ['1', tx('grondtoon volgt de noten')]], S.follow ? '1' : '0', v => { S.follow = v === '1'; if (!S.follow) { root = S.root; apply(); } });
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
      },
      unmount() { note = null; ui = {}; },
      onEvent(port, ev) { if (port === 'notes' && ev && ev.type === 'note' && S.follow) { root = clamp(ev.note | 0, 12, 108); apply(typeof ev.time === 'number' && Number.isFinite(ev.time) ? Math.max(ev.time, ctx.currentTime) : undefined); } },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'reso', laneName: 'Resonator', min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...S, noteRoot: root }; },
      getPreset() { return { ...S }; },
      setPreset(p) { self.setState(p); },
      setState(s) { restoreValues(S, s); root = s && typeof s === 'object' && typeof s.noteRoot === 'number' && Number.isFinite(s.noteRoot) ? clamp(s.noteRoot, 12, 108) : S.root; apply();
        if (ui.root) { ['root', 'decay', 'damp', 'detune', 'tune', 'mix', 'gain'].forEach(k => ui[k].set(S[k])); ui.chord.value = S.chord; ui.follow.value = S.follow ? '1' : '0'; } },
      destroy() { if (dead) return; dead = true; [inG, out, dry, wet, node].forEach(n => { if (n) try { n.disconnect(); } catch { } }); },
    };
    return self;
  }
};
