// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Nieuw apparaat (contract v1.28): convolutiegalm. De ingebouwde impulsresponsies worden bij het laden deterministisch gegenereerd (gezaaide ruis met een decaycurve per frequentieband, vroege reflecties, flutterecho,
//          een dispersieve veerlus en modale resonanties; geen audiobestanden in het apparaat). Eigen impulsresponsies laden kan met loadAudio(files, info) (contract §13e): de audio komt nooit in de state.
//          Motor: twee ConvolverNodes (A/B) voor een kruisfade bij elke wissel van impulsrespons, trim (begin en lengte), stretch (hersampled), balans vroeg/staart en eigen normalisatie op energie;
//          daarna pre-delay, HP, LP, tilt (twee shelving-filters), breedte (M/S) en mix. Een kleine worklet begrenst de ingang (±16, NaN wordt 0).
//          Gemeten (offline, niet beluisterd): docs/tools/measure-convolution-reverb.mjs en .py.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// id, naam per taal (nl, en), min, max, log, rol, bereik, aan, spoor
const MODP = [
  ['predelay', 'Pre-delay', 'Pre-delay', 0, 250, false, 'time', 0.03, false, 'ir'],
  ['start', 'Begin', 'Start', 0, 1000, false, 'time', 0.03, false, 'ir'],
  ['length', 'Lengte', 'Length', 0.05, 12, true, 'decay', 0.05, false, 'ir'],
  ['stretch', 'Stretch', 'Stretch', 0.5, 2, true, 'decay', 0.05, false, 'ir'],
  ['balance', 'Vroeg/laat', 'Early/tail', -1, 1, false, 'send', 0.06, false, 'ir'],
  ['hp', 'HP', 'HP', 20, 1000, true, 'filter', 0.08, false, 'tone'],
  ['lp', 'LP', 'LP', 1000, 20000, true, 'filter', 0.08, true, 'tone'],
  ['tilt', 'Tilt', 'Tilt', -12, 12, false, 'tone', 0.06, false, 'tone'],
  ['width', 'Breedte', 'Width', 0, 2, false, 'width', 0.06, false, 'output'],
  ['mix', 'Mix', 'Mix', 0, 1, false, 'send', 0.08, true, 'output'],
];
// ingebouwde impulsresponsies: id, naam per taal (nl, en)
const IRS = [['church', 'Kerk', 'Church'], ['hall', 'Concertzaal', 'Concert Hall'], ['studio', 'Studioruimte', 'Studio Room'], ['booth', 'Kleine cabine', 'Small Booth'], ['bathroom', 'Betegelde badkamer', 'Tiled Bathroom'],
  ['stairwell', 'Trappenhuis', 'Stairwell'], ['cave', 'Grot', 'Cave'], ['tunnel', 'Tunnel', 'Tunnel'], ['plate', 'Stalen plaat', 'Steel Plate'], ['spring', 'Veertank', 'Spring Tank'],
  ['tube', 'Metalen buis', 'Metal Tube'], ['bin', 'Metalen ton', 'Metal Bin'], ['gated', 'Gated burst', 'Gated Burst'], ['reverse', 'Omgekeerde swell', 'Reverse Swell'], ['tank', 'Watertank', 'Water Tank']];
const DEF = { ir: 'hall', predelay: 0, start: 0, length: 12, stretch: 1, balance: 0, hp: 20, lp: 20000, tilt: 0, width: 1, mix: 0.3 };
const TXT = {
  nl: { ir: 'IR', user: 'Eigen bestand', load: 'Bestand laden…', ownIr: 'Eigen IR', laneIr: 'Impulsrespons', laneTone: 'Klank', laneOutput: 'Uitgang', own: 'Eigen impulsrespons: {0} ({1} s)', noOwn: 'Nog geen eigen impulsrespons geladen: gebruik Bestand laden of de tab Samples. Tot dan klinkt Concertzaal.',
    errDecode: 'Dit audiobestand kon niet worden gelezen.', errEmpty: 'Dit audiobestand is leeg.', nodes: 'Impulsrespons: {0} s', noworklet: 'AudioWorklet niet beschikbaar: de ingang is niet beschermd tegen NaN en enorme pieken.' },
  en: { ir: 'IR', user: 'Own file', load: 'Load file…', ownIr: 'Own IR', laneIr: 'Impulse response', laneTone: 'Tone', laneOutput: 'Output', own: 'Own impulse response: {0} ({1} s)', noOwn: 'No own impulse response loaded yet: use Load file or the Samples tab. Until then Concert Hall plays.',
    errDecode: 'This audio file could not be read.', errEmpty: 'This audio file is empty.', nodes: 'Impulse response: {0} s', noworklet: 'AudioWorklet unavailable: the input is not protected against NaN and huge peaks.' },
};
const MAX_USER = 12;   // seconden van een eigen impulsrespons

// ---------- impulsresponsies genereren (deterministisch, gezaaid) ----------
function rng32(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(6.283185307179586 * r());
// ruisstaart in drie banden (laag < 250 Hz, midden, hoog > 3,2 kHz), elk met een eigen RT60, een opbouw (tau) en een stilte (pre) aan het begin
function tail(n, sr, spec, seed) {
  const r = rng32(seed), y = new Float32Array(n), k1 = 1 - Math.exp(-6.283185307179586 * 250 / sr), k2 = 1 - Math.exp(-6.283185307179586 * 3200 / sr), rt = spec.rt;
  const pre = Math.round((spec.pre || 0) * sr); let l1 = 0, l2 = 0;
  const ln = Math.log(10) * 3;
  for (let i = 0; i < n; i++) {
    const x = gauss(r); l1 += k1 * (x - l1); l2 += k2 * (x - l2);
    if (i < pre) continue;
    const t = (i - pre) / sr, ramp = spec.tau ? 1 - Math.exp(-t / spec.tau) : 1;
    y[i] = (l1 * Math.exp(-ln * t / rt[0]) + (l2 - l1) * Math.exp(-ln * t / rt[1]) + (x - l2) * Math.exp(-ln * t / rt[2])) * ramp;
  }
  return y;
}
function addTap(y, pos, amp) { const i = Math.floor(pos), f = pos - i; if (i >= 0 && i + 3 < y.length) { y[i] += amp * 0.25 * (1 - f); y[i + 1] += amp * (0.5 * (1 - f) + 0.25 * f); y[i + 2] += amp * (0.25 * (1 - f) + 0.5 * f); y[i + 3] += amp * 0.25 * f; } }
function earlyTaps(y, sr, e, seed) {
  const r = rng32(seed);
  for (let k = 0; k < e.n; k++) { const t = e.t0 + (e.t1 - e.t0) * Math.pow(r(), 0.6), a = (e.a || 5) * Math.exp(-(t - e.t0) / (e.tau || 0.1)) * (r() < 0.5 ? -1 : 1); addTap(y, t * sr, a); }
}
function flutter(y, sr, f, seed, ch) { const r = rng32(seed); for (let k = 1; k <= f.n; k++) addTap(y, k * f.p * sr * (ch ? 1.037 : 1), (f.a || 6) * Math.pow(f.g, k) * (k % 2 ? 1 : -1) * (0.8 + 0.4 * r())); }
function springLoop(n, sr, ch, T) {
  const D = Math.round((ch ? 0.0413 : 0.0347) * sr), K = 48, a = 0.62, z = new Float64Array(K), buf = new Float64Array(D), y = new Float32Array(n);
  const g = Math.pow(10, -3 * D / sr / T), lk = 1 - Math.exp(-6.283185307179586 * 3800 / sr); let lp = 0, w = 0;
  for (let i = 0; i < n; i++) {
    let v = buf[w]; for (let k = 0; k < K; k++) { const o = a * v + z[k]; z[k] = v - a * o; v = o; }
    lp += lk * (v - lp); const out = v; v = g * lp; v = v / (1 + 0.3 * v * v);
    buf[w] = (i === 0 ? 1 : 0) + v; if (++w >= D) w = 0; y[i] = out;
  }
  return y;
}
function combTube(n, sr, ch) {
  const D = Math.round((ch ? 0.0133 : 0.0121) * sr), buf = new Float64Array(D), y = new Float32Array(n), lk = 1 - Math.exp(-6.283185307179586 * 2600 / sr); let lp = 0, w = 0;
  const g = -Math.pow(10, -3 * D / sr / 1.7);
  for (let i = 0; i < n; i++) { const v = buf[w]; lp += lk * (v - lp); y[i] = v; buf[w] = (i === 0 ? 1 : 0) + g * lp; if (++w >= D) w = 0; }
  return y;
}
function modal(n, sr, ch, seed) {
  const r = rng32(seed + (ch ? 77 : 0)), y = new Float32Array(n), base = 290 + 40 * r();
  for (let k = 0; k < 14; k++) {
    const f = base * (1 + 0.43 * k + 0.12 * (r() - 0.5)), rt = 1.5 / (1 + 0.35 * k) + 0.15, amp = 1 / Math.sqrt(k + 1), ph = r() * 6.283185307179586, w = 6.283185307179586 * f / sr, dec = Math.log(10) * 3 / rt / sr;
    if (f > sr * 0.45) continue;
    for (let i = 0; i < n; i++) y[i] += amp * Math.exp(-dec * i) * Math.sin(w * i + ph);
  }
  return y;
}
const SPECS = {
  church: { len: 6, rt: [7, 5.5, 2.6], pre: 0.025, tau: 0.09, er: { n: 14, t0: 0.03, t1: 0.14, a: 5, tau: 0.25 } },
  hall: { len: 3.2, rt: [2.8, 2.3, 1.4], pre: 0.012, tau: 0.05, er: { n: 20, t0: 0.015, t1: 0.09, a: 6, tau: 0.08 } },
  studio: { len: 0.7, rt: [0.45, 0.38, 0.22], pre: 0.002, tau: 0.006, er: { n: 22, t0: 0.004, t1: 0.04, a: 8, tau: 0.03 } },
  booth: { len: 0.3, rt: [0.18, 0.12, 0.07], pre: 0.0005, tau: 0.002, er: { n: 12, t0: 0.001, t1: 0.012, a: 8, tau: 0.01 } },
  bathroom: { len: 1.8, rt: [1.2, 1.5, 1.4], pre: 0.001, tau: 0.008, er: { n: 26, t0: 0.003, t1: 0.035, a: 9, tau: 0.04 }, fl: { p: 0.0073, g: 0.62, n: 14, a: 8 } },
  stairwell: { len: 3.4, rt: [2.8, 3, 2], pre: 0.004, tau: 0.03, er: { n: 16, t0: 0.006, t1: 0.06, a: 6, tau: 0.1 }, fl: { p: 0.028, g: 0.62, n: 30, a: 7 } },
  cave: { len: 5.2, rt: [5.5, 4.6, 2.4], pre: 0.04, tau: 0.12, slaps: [[0.09, 0.5], [0.19, 0.4], [0.31, 0.3], [0.47, 0.22]] },
  tunnel: { len: 4.2, rt: [4.5, 3.8, 2], pre: 0.01, tau: 0.1, fl: { p: 0.43, g: 0.55, n: 8, a: 10 } },
  plate: { len: 3.2, rt: [1.8, 2.4, 3], pre: 0, tau: 0.002 },
  tank: { len: 5.8, rt: [8, 6, 2.2], pre: 0.02, tau: 0.08, er: { n: 8, t0: 0.025, t1: 0.1, a: 4, tau: 0.1 } },
  gated: { len: 0.55, rt: [10, 10, 7], pre: 0, tau: 0.004, gate: 0.5 },
  reverse: { len: 1.6, rt: [1.1, 0.95, 0.55], pre: 0.004, tau: 0.01, rev: true },
};
function genIR(id, sr) {
  const ch = [0, 1].map(c => {
    const seed = 1000 + IRS.findIndex(x => x[0] === id) * 31 + c * 7919;
    if (id === 'spring') { const y = springLoop(Math.round(2.6 * sr), sr, c, 2.4), t = tail(y.length, sr, { rt: [0.9, 0.7, 0.4], pre: 0.02, tau: 0.03 }, seed); for (let i = 0; i < y.length; i++) y[i] = y[i] + 0.04 * t[i]; return y; }
    if (id === 'tube') { const n = Math.round(2.4 * sr), y = combTube(n, sr, c), t = tail(n, sr, { rt: [1.4, 1.1, 0.5], pre: 0.003, tau: 0.01 }, seed); for (let i = 0; i < n; i++) y[i] += 0.5 * t[i]; return y; }
    if (id === 'bin') { const n = Math.round(1.9 * sr), y = modal(n, sr, c, seed), t = tail(n, sr, { rt: [0.9, 0.8, 0.45], pre: 0.001, tau: 0.004 }, seed); for (let i = 0; i < n; i++) y[i] = y[i] * 0.9 + t[i] * 0.5; earlyTaps(y, sr, { n: 6, t0: 0.001, t1: 0.01, a: 6, tau: 0.01 }, seed + 5); return y; }
    const s = SPECS[id] || SPECS.hall, n = Math.round(s.len * sr), y = tail(n, sr, s, seed);
    if (s.er) earlyTaps(y, sr, s.er, seed + 1);
    if (s.fl) flutter(y, sr, s.fl, seed + 2, c);
    if (s.slaps) for (const [t, g] of s.slaps) addTap(y, t * sr * (c ? 1.02 : 1), 14 * g);
    if (s.gate) { const g0 = Math.round(s.gate * sr), f = Math.round(0.02 * sr); for (let i = 0; i < n; i++) y[i] *= i < g0 - f ? 1 : i < g0 ? (g0 - i) / f : 0; }
    if (s.rev) { y.reverse(); const f = Math.round(0.004 * sr); for (let i = 0; i < n; i++) if (i > n - f) y[i] *= (n - i) / f; }
    return y;
  });
  return { L: ch[0], R: ch[1] };
}

// bereken de buffer die de ConvolverNode krijgt: trim, stretch, balans vroeg/staart, fades en normalisatie op energie
function shapeIR(src, sr, st) {
  const n0 = src.L.length, s0 = clamp(Math.round(st.start * 0.001 * sr), 0, Math.max(0, n0 - 64)), cut = Math.max(32, Math.min(n0 - s0, Math.round(st.length * sr)));
  const r = st.stretch, m = Math.max(32, Math.round(cut * r)), out = [new Float32Array(m), new Float32Array(m)];
  const split = 0.08 * sr, ge = st.balance > 0 ? 1 - st.balance : 1, gt = st.balance < 0 ? 1 + st.balance : 1, ramp = 0.016 * sr;
  const fin = Math.max(1, Math.round(0.001 * sr)), fout = Math.max(8, Math.min(Math.round(0.05 * sr), Math.round(m * 0.05)));
  for (let c = 0; c < 2; c++) {
    const a = c ? src.R : src.L, o = out[c];
    for (let i = 0; i < m; i++) {
      const p = s0 + i / r, j = Math.floor(p), f = p - j, v = j + 1 < n0 ? a[j] * (1 - f) + a[j + 1] * f : (j < n0 ? a[j] : 0);
      const u = clamp((i - (split - ramp)) / (2 * ramp), 0, 1), gain = ge + (gt - ge) * u, e = i < fin && s0 > 0 ? i / fin : 1, d = i > m - fout ? (m - i) / fout : 1;
      o[i] = v * gain * e * d;
    }
  }
  let en = 0; for (let c = 0; c < 2; c++) for (let i = 0; i < m; i++) en += out[c][i] * out[c][i];
  const sc = en > 1e-20 ? 1 / Math.sqrt(en / 2) : 0;
  for (let c = 0; c < 2; c++) for (let i = 0; i < m; i++) out[c][i] *= sc;
  return out;
}

const WNAME = 'nl-patchkamer-convolutionreverb-1-0-0';
const WORKLET = `
const IN_MAX = 16;
class ConvGuard extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const a = inputs[0], b = outputs[0];
    for (let c = 0; c < b.length; c++) { const x = a[c]; if (!x) continue; const y = b[c];
      for (let n = 0; n < x.length; n++) { const v = x[n]; y[n] = (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX); } }
    return true;
  }
}
registerProcessor('${WNAME}', ConvGuard);`;

export default {
  id: 'nl.patchkamer.convolutionreverb', name: 'Convolution Reverb', version: '1.0.0', category: 'effect', kind: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ui: { width: 460, minWidth: 400 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', T = nl ? TXT.nl : TXT.en, NI = nl ? 1 : 2, sr = ctx.sampleRate || 48000;
    const fmt = (s, ...a) => a.reduce((x, v, i) => x.replace('{' + i + '}', v), s);
    const input = ctx.createGain(), inG = ctx.createGain(), dry = ctx.createGain(), pre = ctx.createDelay(0.5), wetIn = ctx.createGain();
    const cA = ctx.createConvolver(), cB = ctx.createConvolver(), gA = ctx.createGain(), gB = ctx.createGain(), sum = ctx.createGain();
    const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), lo = ctx.createBiquadFilter(), hi = ctx.createBiquadFilter();
    const split = ctx.createChannelSplitter(2), merge = ctx.createChannelMerger(2), m1 = ctx.createGain(), m2 = ctx.createGain(), s1 = ctx.createGain(), s2 = ctx.createGain(), mid = ctx.createGain(), side = ctx.createGain(), sideN = ctx.createGain();
    const wet = ctx.createGain(), out = ctx.createGain();
    for (const c of [cA, cB]) { c.normalize = false; c.channelCount = 2; c.channelCountMode = 'explicit'; }
    hp.type = 'highpass'; lp.type = 'lowpass'; lo.type = 'lowshelf'; hi.type = 'highshelf'; lo.frequency.value = 700; hi.frequency.value = 2200;
    m1.gain.value = 0.5; m2.gain.value = 0.5; s1.gain.value = 0.5; s2.gain.value = -0.5; sideN.gain.value = -1; gA.gain.value = 1; gB.gain.value = 0;
    input.connect(inG); inG.connect(dry).connect(out);
    inG.connect(pre).connect(wetIn); wetIn.connect(cA).connect(gA).connect(sum); wetIn.connect(cB).connect(gB).connect(sum);
    sum.connect(hp).connect(lp).connect(lo).connect(hi).connect(split);
    split.connect(m1, 0).connect(mid); split.connect(m2, 1).connect(mid); split.connect(s1, 0).connect(side); split.connect(s2, 1).connect(side); side.connect(sideN);
    mid.connect(merge, 0, 0); mid.connect(merge, 0, 1); side.connect(merge, 0, 0); sideN.connect(merge, 0, 1);
    merge.connect(wet).connect(out);
    const state = { ...DEF }, defaults = { ...DEF }, mod = {}; let dead = false, guard = null, clean = null, cleaner = 0, active = 0, userIR = null, userName = '', lastSwap = -1e9, pending = null, timer = 0, builtLen = 0, key = '', ui = {}, note = null, lenNote = null, errMsg = '';
    const cache = new Map();
    const E = k => { const m = MODP.find(x => x[0] === k), b = state[k], o = mod[k] || 0; if (!o) return b; return m[5] ? clamp(b * Math.pow(m[4] / m[3], o), m[3], m[4]) : clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    const source = () => state.ir === 'user' && userIR ? userIR : (cache.get(state.ir === 'user' ? 'hall' : state.ir) || (cache.set(state.ir === 'user' ? 'hall' : state.ir, genIR(state.ir === 'user' ? 'hall' : state.ir, sr)), cache.get(state.ir === 'user' ? 'hall' : state.ir)));
    const clock = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
    function applyLive(init) {
      const t = ctx.currentTime, r = 0.03, w = E('mix'), tl = E('tilt');
      const set = (param, v, tc) => { if (init) param.value = v; else param.setTargetAtTime(v, t, tc); };
      set(pre.delayTime, E('predelay') / 1000, 0.08); set(hp.frequency, E('hp') <= 20.5 ? 0 : E('hp'), r); set(lp.frequency, E('lp') >= 19990 ? sr / 2 : E('lp'), r);   // aan de uiteinden doen de filters niets (hoogdoorlaat op 0 Hz en laagdoorlaat op Nyquist zijn transparant) set(lo.gain, -tl / 2, r); set(hi.gain, tl / 2, r); set(side.gain, E('width'), r);
      set(wet.gain, Math.sin(w * Math.PI / 2), r); set(dry.gain, Math.cos(w * Math.PI / 2), r);
    }
    // wissel naar een nieuwe impulsrespons met een kruisfade tussen A en B (geen tik); de oude convolver wordt daarna vrijgegeven
    function swap(first) {
      const st = { start: E('start'), length: E('length'), stretch: E('stretch'), balance: E('balance') };
      const data = shapeIR(source(), sr, st), buf = ctx.createBuffer(2, data[0].length, sr); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); d.set(data[c].length > d.length ? data[c].subarray(0, d.length) : data[c]); }
      const nowC = ctx.currentTime, idle = active ? cA : cB, idleG = active ? gA : gB, cur = active ? cB : cA, curG = active ? gB : gA;
      idle.buffer = buf; builtLen = data[0].length / sr;
      if (first) { idleG.gain.setValueAtTime(1, nowC); curG.gain.setValueAtTime(0, nowC); } else { idleG.gain.setTargetAtTime(1, nowC, 0.015); curG.gain.setTargetAtTime(0, nowC, 0.015); }
      active = active ? 0 : 1; lastSwap = clock();
      if (!first) { clean = { node: cur, at: nowC + 0.5 }; if (!cleaner) cleaner = setInterval(sweep, 100); }
      if (lenNote) lenNote.textContent = fmt(T.nodes, builtLen.toFixed(2));
    }
    // de oude convolver gaat pas na 0,5 s audiotijd leeg (na de kruisfade); we kijken naar ctx.currentTime en niet naar de klok, zodat dit ook klopt als een offline context stilstaat
    function sweep() { if (dead || !clean) { clearInterval(cleaner); cleaner = 0; return; } if (ctx.currentTime >= clean.at) { try { if (clean.node !== (active ? cB : cA)) clean.node.buffer = null; } catch { } clean = null; clearInterval(cleaner); cleaner = 0; } }
    function wanted() { return [state.ir, userIR ? userName : '', E('start').toFixed(0), E('length').toFixed(2), E('stretch').toFixed(3), E('balance').toFixed(2)].join('|'); }
    function rebuild(now) {
      if (dead) return; const k = wanted(); if (k === key && !now) return;
      if (timer) clearTimeout(timer);
      const wait = now ? 0 : Math.max(120, 330 - (clock() - lastSwap));
      timer = setTimeout(() => { timer = 0; if (dead) return; if (clock() - lastSwap < 300 && !now) { rebuild(false); return; } const k2 = wanted(); if (k2 === key) return; key = k2; try { swap(false); } catch { } }, wait);
    }
    // eerste opbouw direct (zonder kruisfade)
    key = wanted(); swap(true); applyLive(true);
    if (host && typeof host.loadWorklet === 'function') host.loadWorklet(WNAME, WORKLET).then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('no worklet');
      const g = new AudioWorkletNode(ctx, WNAME); guard = g; input.disconnect(inG); input.connect(g).connect(inG);
    }).catch(() => { if (note && !dead) note.textContent = T.noworklet; });
    const showNote = () => { if (!note) return; note.textContent = errMsg || (state.ir === 'user' ? (userIR ? fmt(T.own, userName, (userIR.L.length / sr).toFixed(2)) : T.noOwn) : ''); };
    async function loadFile(file) {
      errMsg = '';
      try {
        let a; try { a = await ctx.decodeAudioData(await file.arrayBuffer()); } catch { throw new Error(T.errDecode); }
        if (!a || !a.length) throw new Error(T.errEmpty);
        const n = Math.min(a.length, Math.round(MAX_USER * a.sampleRate)), L = new Float32Array(n), R = new Float32Array(n);
        L.set(a.getChannelData(0).subarray(0, n)); R.set(a.numberOfChannels > 1 ? a.getChannelData(1).subarray(0, n) : a.getChannelData(0).subarray(0, n));
        let pk = 0; for (let i = 0; i < n; i++) { if (!Number.isFinite(L[i])) L[i] = 0; if (!Number.isFinite(R[i])) R[i] = 0; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
        if (pk < 1e-9) throw new Error(T.errEmpty);
        userIR = { L, R }; userName = String(file.name || 'IR').slice(0, 60); state.ir = 'user';
        if (ui.ir) ui.ir.value = 'user'; key = wanted(); swap(false); applyLive();
      } catch (e) { errMsg = e && e.message ? e.message : String(e); }
      showNote();
    }
    const knob = (el, k, f, step) => { const m = MODP.find(x => x[0] === k); return host.ui.knob(el, m[NI], [m[3], m[4], step], state[k], f, v => { state[k] = v; applyLive(); if (['start', 'length', 'stretch', 'balance'].includes(k)) rebuild(false); }, { default: defaults[k], id: k, group: m[9], scale: m[5] ? 'log' : undefined }); };
    const pct = v => Math.round(v * 100) + '%', hz = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' kHz' : Math.round(v) + ' Hz';
    return {
      inputs: { in: input }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        const opts = IRS.map(x => [x[0], x[NI]]).concat([['user', T.user]]);
        ui.ir = host.ui.select(el, T.ir, opts, state.ir, v => { if (v === 'user' || IRS.some(x => x[0] === v)) { state.ir = v; rebuild(true); showNote(); } }, { id: 'ir', group: 'ir' });
        const file = document.createElement('input'); file.type = 'file'; file.accept = 'audio/*,.wav,.mp3,.ogg,.flac'; file.style.display = 'none'; file.setAttribute('aria-label', T.load);
        file.onchange = () => { const f = file.files && file.files[0]; if (f) loadFile(f); file.value = ''; }; el.appendChild(file);
        const row = document.createElement('div'); row.className = 'k'; row.style.gridTemplateColumns = '70px minmax(0,1fr)'; const lab = document.createElement('label'); lab.textContent = T.ownIr; const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = T.load; btn.onclick = () => file.click(); row.append(lab, btn); el.appendChild(row);
        ui.predelay = knob(el, 'predelay', v => Math.round(v) + ' ms', 1);
        ui.start = knob(el, 'start', v => Math.round(v) + ' ms', 1);
        ui.length = knob(el, 'length', v => v >= 11.99 ? (nl ? 'alles' : 'full') : v.toFixed(2) + ' s', 0.01);
        ui.stretch = knob(el, 'stretch', v => '×' + v.toFixed(2), 0.01);
        ui.balance = knob(el, 'balance', v => v === 0 ? '0' : (v < 0 ? (nl ? 'vroeg ' : 'early ') + Math.round(-v * 100) : (nl ? 'staart ' : 'tail ') + Math.round(v * 100)) + (v === 0 ? '' : '%'), 0.01);
        ui.hp = knob(el, 'hp', hz, 5); ui.lp = knob(el, 'lp', hz, 50);
        ui.tilt = knob(el, 'tilt', v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', 0.1);
        ui.width = knob(el, 'width', pct, 0.01); ui.mix = knob(el, 'mix', pct, 0.01);
        lenNote = document.createElement('div'); lenNote.style.cssText = 'font-size:11px;color:var(--muted,#97a1ad);margin-top:4px'; lenNote.textContent = fmt(T.nodes, builtLen.toFixed(2)); el.appendChild(lenNote);
        note = document.createElement('div'); note.style.cssText = 'font-size:11px;color:var(--muted,#97a1ad);margin-top:2px'; el.appendChild(note); showNote();
        if (typeof AudioWorkletNode === 'undefined') note.textContent = T.noworklet;
      },
      params() { return MODP.map(m => ({ id: m[0], name: m[NI], lane: m[9], laneName: T['lane' + m[9][0].toUpperCase() + m[9].slice(1)], min: m[3], max: m[4], role: m[6], scale: m[5] ? 'log' : 'lin', drift: m[7], on: m[8] })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODP.some(x => x[0] === k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); applyLive(); rebuild(false); },
      loadAudio(files) { const f = Array.from(files || [])[0]; return f ? loadFile(f) : Promise.resolve(); },
      getState() { return { ...state }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        for (const k of Object.keys(defaults)) {
          const d = defaults[k], v = s[k];
          if (k === 'ir') state.ir = v === 'user' || IRS.some(x => x[0] === v) ? v : d;
          else { const m = MODP.find(p => p[0] === k); state[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, m[3], m[4]) : d; }
        }
        applyLive(); rebuild(false);
        if (ui.ir) { ui.ir.value = state.ir; for (const k of Object.keys(ui)) if (k !== 'ir' && ui[k].set) ui[k].set(state[k]); showNote(); }
      },
      destroy() { if (dead) return; dead = true; if (timer) clearTimeout(timer); if (cleaner) clearInterval(cleaner); [input, inG, dry, pre, wetIn, cA, cB, gA, gB, sum, hp, lp, lo, hi, split, merge, m1, m2, s1, s2, mid, side, sideN, wet, out, guard].forEach(n => { try { if (n) n.disconnect(); } catch { } }); cA.buffer = null; cB.buffer = null; userIR = null; cache.clear(); }
    };
  }
};
