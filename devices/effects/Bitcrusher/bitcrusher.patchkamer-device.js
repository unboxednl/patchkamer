// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.1.0 — Met een skin (compacte indeling in panelen, `.pk-pnls` naast het scherm) is het golfvormscherm lager (56 px i.p.v. 84); zonder skin, geluid, state, ids en poorten ongewijzigd.
// 1.0.0 — Patchkamer contract v1.28. Bitcrusher: bitdiepte (1 tot 16, ook fijn), sample-rate-reductie (vasthouden of lineair, met jitter),
//         vier kwantiseerstijlen (mid-tread, mid-rise, afkappen, µ-law), dither (RPDF, TPDF, gevormd), ruis, een anti-alias-voorfilter dat je aan of uit zet
//         (aliasing is dan een keuze), hoog- en laagdoorlaat na het crushen, mix en niveau. AudioWorklet, tweekanaals met één gedeelde samplekloktik.
//         Een klein scherm toont de gekwantiseerde golfvorm (rekenmodel) met het echte signaal erdoorheen. Tekenen via host.frame.
//         Bewaker: ingang begrensd (±16) en NaN naar 0, toestanden per blok op eindigheid gecontroleerd en teruggezet.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const STYLES = ['tread', 'rise', 'floor', 'mulaw'], INTERP = ['hold', 'linear'], DITH = ['rpdf', 'tpdf', 'shaped'];
// id, naam nl, naam en, min, max, log, rol, bereik (drift), aan, groep
const MODP = [
  ['bits', 'Bits', 'Bits', 1, 16, false, 'depth', 0.10, true, 'crush'],
  ['rate', 'Samplerate', 'Sample rate', 100, 48000, true, 'rate', 0.10, true, 'crush'],
  ['jitter', 'Jitter', 'Jitter', 0, 1, false, 'depth', 0.05, false, 'crush'],
  ['input', 'Ingang', 'Input', -12, 24, false, 'level', 0.06, false, 'crush'],
  ['dither', 'Dither', 'Dither', 0, 1, false, 'depth', 0.05, false, 'noise'],
  ['noise', 'Ruis', 'Noise', 0, 1, false, 'depth', 0.05, false, 'noise'],
  ['hp', 'Hoogdoorl.', 'Highpass', 20, 4000, true, 'filter', 0.06, false, 'post'],
  ['post', 'Laagdoorl.', 'Lowpass', 500, 20000, true, 'filter', 0.10, true, 'post'],
  ['out', 'Niveau', 'Level', -24, 12, false, 'level', 0.05, false, 'out'],
  ['mix', 'Mix', 'Mix', 0, 1, false, 'send', 0.08, true, 'out'],
];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ bits: 8, rate: 16000, style: 'tread', interp: 'hold', aa: false, jitter: 0, input: 0, dither: 0, dtype: 'tpdf', noise: 0, hp: 20, post: 20000, out: 0, mix: 1 });
const TXT = {
  nl: { style: 'Kwantiser', interp: 'Houdmodus', aa: 'Anti-alias', dtype: 'Dither PDF', off: 'uit', on: 'aan', note: 'AudioWorklet laden…', fail: 'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.',
    styles: ['Mid-tread', 'Mid-rise', 'Afkappen', 'µ-law'], interps: ['Vasthouden', 'Lineair'], dithers: ['RPDF', 'TPDF', 'Gevormd'], screen: 'Gekwantiseerde golfvorm', lane: 'Bitcrusher' },
  en: { style: 'Quantiser', interp: 'Hold mode', aa: 'Anti-alias', dtype: 'Dither PDF', off: 'off', on: 'on', note: 'Loading AudioWorklet…', fail: 'AudioWorklet unavailable: the sound passes through unprocessed.',
    styles: ['Mid-tread', 'Mid-rise', 'Truncate', 'µ-law'], interps: ['Hold', 'Linear'], dithers: ['RPDF', 'TPDF', 'Shaped'], screen: 'Quantised waveform', lane: 'Bitcrusher' },
};

const WNAME = 'nl-patchkamer-bitcrusher-1-0-0';
const WORKLET = `
const IN_MAX = 16, OUT_MAX = 64, MU = 255, LMU = Math.log(1 + MU);
const fin = (v, d, a, b) => (typeof v === 'number' && v >= a && v <= b) ? v : (v > b ? b : v < a ? a : d);
class Bq { constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.s1 = 0; this.s2 = 0; this.on = false; }
  reset() { this.s1 = this.s2 = 0; }
  run(x) { const y = this.b0 * x + this.s1; this.s1 = this.b1 * x - this.a1 * y + this.s2; this.s2 = this.b2 * x - this.a2 * y; return y; }
  set(b0, b1, b2, a0, a1, a2) { this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0; }
  hp(f, q) { const w = 2 * Math.PI * f / sampleRate, c = Math.cos(w), al = Math.sin(w) / (2 * q); this.set((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al); }
  lp(f, q) { const w = 2 * Math.PI * f / sampleRate, c = Math.cos(w), al = Math.sin(w) / (2 * q); this.set((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + al, -2 * c, 1 - al); } }
// quantiser: x in [-1, 1], L = number of levels (2^bits, may be fractional), n = dither in LSB
function quant(x, L, st, n) {
  if (!(x > -1)) x = x !== x ? 0 : -1; else if (x > 1) x = 1;
  const d = 2 / L;
  if (st === 0) { let q = Math.round(x / d + n) * d; return q > 1 - d ? 1 - d : q < -1 ? -1 : q; }
  if (st === 1) { const m = 1 - d / 2; let q = (Math.floor(x / d + n) + 0.5) * d; q = q > m ? m : q < -m ? -m : q; return q / m; }
  if (st === 2) { let q = Math.floor(x / d + n) * d; return q > 1 - d ? 1 - d : q < -1 ? -1 : q; }
  const c = (x < 0 ? -1 : 1) * Math.log(1 + MU * (x < 0 ? -x : x)) / LMU, m = 1 - d / 2; let q = (Math.floor(c / d + n) + 0.5) * d; q = q > m ? m : q < -m ? -m : q; q /= m;
  return (q < 0 ? -1 : 1) * (Math.exp((q < 0 ? -q : q) * LMU) - 1) / MU;
}
class Chan { constructor(seed) { this.aa = [new Bq(), new Bq()]; this.hp = new Bq(); this.lp = new Bq(); this.held = 0; this.prev = 0; this.dcx = 0; this.dcy = 0; this.rng = seed; this.e1 = 0; this.xa = 0; this.dcInit = false; }
  reset() { for (const f of this.aa) f.reset(); this.hp.reset(); this.lp.reset(); this.held = this.prev = this.dcx = this.dcy = this.e1 = this.xa = 0; this.dcInit = false; }
  rnd() { let x = this.rng; x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; this.rng = x || 1; return x / 4294967296; } }
class PkCrush extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' });
    return [k('bits', 8, 1, 16), k('rate', 16000, 100, 48000), k('jitter', 0, 0, 1), k('input', 0, -12, 24), k('dither', 0, 0, 1), k('noise', 0, 0, 1), k('hp', 20, 20, 4000), k('post', 20000, 500, 20000), k('out', 0, -24, 12), k('mix', 1, 0, 1)];
  }
  constructor() {
    super(); this.ch = [new Chan(2463534242), new Chan(1812433253)]; this.style = 0; this.interp = 0; this.aaOn = false; this.dtype = 1;
    this.phase = 0; this.period = 1; this.lastPeriod = 1; this.rngJ = 88172645; this.key = ''; this.inS = 1; this.outS = 1; this.mixS = 1; this.init = false;
    this.sm = 1 - Math.exp(-1 / (sampleRate * 0.006)); this.dcR = 1 - 2 * Math.PI * 8 / sampleRate;
    this.port.onmessage = e => { const d = e.data || {};
      if (typeof d.style === 'number' && d.style >= 0 && d.style < 4) this.style = d.style | 0;
      if (d.interp === 0 || d.interp === 1) this.interp = d.interp;
      if (typeof d.aa === 'boolean') { this.aaOn = d.aa; this.key = ''; }
      if (typeof d.dtype === 'number' && d.dtype >= 0 && d.dtype < 3) this.dtype = d.dtype | 0; };
  }
  jr() { let x = this.rngJ; x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; this.rngJ = x || 1; return x / 4294967296; }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], len = out[0].length, sr = sampleRate, nch = out.length, ch = this.ch;
    const bits = fin(P.bits[0], 8, 1, 16), rate = fin(P.rate[0], 16000, 100, 48000), jit = fin(P.jitter[0], 0, 0, 1), inDb = fin(P.input[0], 0, -12, 24), dith = fin(P.dither[0], 0, 0, 1), noise = fin(P.noise[0], 0, 0, 1),
      hp = fin(P.hp[0], 20, 20, 4000), post = fin(P.post[0], 20000, 500, 20000), outDb = fin(P.out[0], 0, -24, 12), mix = fin(P.mix[0], 1, 0, 1);
    const ratio = Math.max(1, sr / rate), L = Math.pow(2, bits), st = this.style, ip = this.interp, dt = this.dtype, aaOn = this.aaOn && ratio > 1.001;
    const key = [rate, hp, post, aaOn].join();
    if (key !== this.key) { this.key = key; const fc = Math.min(0.45 * rate, 0.45 * sr);
      for (const c of ch) { c.aa[0].on = c.aa[1].on = aaOn; if (aaOn) { c.aa[0].lp(fc, 0.5412); c.aa[1].lp(fc, 1.3066); }
        c.hp.on = hp > 20.5; if (c.hp.on) c.hp.hp(hp, 0.7071); c.lp.on = post < 19990; if (c.lp.on) c.lp.lp(Math.min(post, sr * 0.45), 0.7071); } }
    const inG = Math.pow(10, inDb / 20), outG = Math.pow(10, outDb / 20), nAmp = noise * noise * 0.1, d = 2 / L, sm = this.sm, dcR = this.dcR;
    if (!this.init) { this.init = true; this.inS = inG; this.outS = outG; this.mixS = mix; }
    let { phase, period, lastPeriod, inS, outS, mixS } = this; let bad = false;
    for (let i = 0; i < len; i++) {
      inS += (inG - inS) * sm; outS += (outG - outS) * sm; mixS += (mix - mixS) * sm;
      phase += 1; const tick = phase >= period;
      if (tick) { phase -= period; lastPeriod = period; period = ratio * (1 + jit * (this.jr() - 0.5)); if (!(period >= 1)) period = 1; if (phase >= period) phase = 0; }
      const fr = ip === 1 ? (phase / lastPeriod > 1 ? 1 : phase / lastPeriod) : 0;
      for (let c = 0; c < nch; c++) {
        const C = ch[c < 2 ? c : 1]; let x0 = inp.length ? ((inp[c] || inp[0])[i] || 0) : 0;
        if (!(x0 > -IN_MAX && x0 < IN_MAX)) x0 = x0 !== x0 ? 0 : x0 > 0 ? IN_MAX : -IN_MAX;
        let x = x0 * inS; if (C.aa[0].on) x = C.aa[1].run(C.aa[0].run(x));
        if (tick) {
          let n = 0;   // dither in LSB (before the quantiser, in the companded domain for mu-law)
          if (dith > 0) { if (dt === 0) n = (C.rnd() - 0.5) * dith; else { const t = C.rnd() - C.rnd(); if (dt === 1) n = t * dith; else { n = (t - C.e1) * 0.5 * dith; C.e1 = t; } } }
          if (nAmp > 0) x += (C.rnd() * 2 - 1) * nAmp;
          C.prev = C.held; C.held = quant(x, L, st, n);
        }
        let y = ip === 1 ? C.prev + (C.held - C.prev) * fr : C.held;
        if (!C.dcInit) { C.dcInit = true; C.dcx = y; C.dcy = 0; }   // begin in rust: een mid-rise-quantiser heeft in stilte een vaste gelijkspanning
        const dc = y - C.dcx + dcR * C.dcy; C.dcx = y; C.dcy = dc; y = dc;
        if (C.hp.on) y = C.hp.run(y); if (C.lp.on) y = C.lp.run(y);
        let o = x0 * (1 - mixS) + y * outS * mixS;
        if (!(o > -OUT_MAX && o < OUT_MAX)) { o = 0; bad = true; }
        out[c][i] = o;
      }
    }
    this.phase = phase; this.period = period; this.lastPeriod = lastPeriod; this.inS = inS; this.outS = outS; this.mixS = mixS;
    let ok = bad || !(Number.isFinite(phase) && Number.isFinite(period) && period >= 1 && Number.isFinite(inS) && Number.isFinite(outS) && Number.isFinite(mixS));
    if (!ok) for (const C of ch) { if (!(Number.isFinite(C.held) && Number.isFinite(C.prev) && Number.isFinite(C.dcx) && Number.isFinite(C.dcy) && Number.isFinite(C.e1))) { ok = true; break; }
      for (const f of [C.aa[0], C.aa[1], C.hp, C.lp]) if (!(Number.isFinite(f.s1) && Number.isFinite(f.s2) && Math.abs(f.s1) < 1e6 && Math.abs(f.s2) < 1e6)) ok = true; }
    if (ok) { for (const C of ch) C.reset(); this.phase = 0; this.period = 1; this.lastPeriod = 1; this.inS = inG; this.outS = outG; this.mixS = mix; this.key = ''; }
    return true;
  }
}
registerProcessor('${WNAME}', PkCrush);
`;

// rekenmodel voor het scherm (zelfde kwantiseerders als de worklet, zonder dither en ruis)
function quantModel(x, L, st) {
  x = clamp(x, -1, 1); const d = 2 / L;
  if (st === 0) return clamp(Math.round(x / d) * d, -1, 1 - d);
  if (st === 1) { const m = 1 - d / 2; return clamp((Math.floor(x / d) + 0.5) * d, -m, m) / m; }
  if (st === 2) return clamp(Math.floor(x / d) * d, -1, 1 - d);
  const LMU = Math.log(256), c = Math.sign(x) * Math.log(1 + 255 * Math.abs(x)) / LMU, m = 1 - d / 2, q = clamp((Math.floor(c / d) + 0.5) * d, -m, m) / m;
  return Math.sign(q) * (Math.exp(Math.abs(q) * LMU) - 1) / 255;
}

export default {
  id: 'nl.patchkamer.bitcrusher', name: 'Bitcrusher', version: '1.1.0', category: 'effect', kind: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ui: { width: 340, minWidth: 300 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', NI = nl ? 1 : 2, T = nl ? TXT.nl : TXT.en;
    const S = DEF(), defaults = { ...S }, mod = {}; let dead = false, node = null, failed = false, note = null, canvas = null, pen = null, offFrame = null, ro = null, size = [300, 84], colors = null, colorAt = 0;
    const ui = {};
    const inG = ctx.createGain(), out = ctx.createGain(), an = ctx.createAnalyser(); inG.connect(out); an.fftSize = 1024; out.connect(an);   // zonder worklet gaat het geluid onbewerkt door
    const tbuf = new Float32Array(an.fftSize);
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!o) return b; return m[5] ? clamp(b * Math.pow(m[4] / m[3], o), m[3], m[4]) : clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    function paintNote() { if (note) note.textContent = node ? '' : failed ? T.fail : T.note; }
    function post() { if (node) try { node.port.postMessage({ style: STYLES.indexOf(S.style), interp: INTERP.indexOf(S.interp), aa: !!S.aa, dtype: DITH.indexOf(S.dtype) }); } catch { } }
    function apply() { if (!node) return; const t = ctx.currentTime, r = 0.02; for (const m of MODP) { const p = node.parameters.get(m[0]); if (p) p.setTargetAtTime(E(m[0]), t, r); } }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead) return; if (typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      inG.disconnect(out); inG.connect(node).connect(out); post(); apply(); paintNote();
    }).catch(() => { if (dead) return; failed = true; paintNote(); });
    const pct = v => Math.round(v * 100) + '%';
    const FMT = { bits: v => (Math.abs(v - Math.round(v)) < 0.05 ? Math.round(v) : v.toFixed(1)) + ' bit', rate: v => v >= 10000 ? Math.round(v / 1000) + ' kHz' : v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : Math.round(v) + ' Hz', jitter: pct, input: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB',
      dither: v => v <= 0 ? T.off : pct(v), noise: v => v <= 0 ? T.off : Math.round(20 * Math.log10(v * v * 0.1)) + ' dB', hp: v => v <= 20.5 ? T.off : Math.round(v) + ' Hz', post: v => v >= 19990 ? T.off : (v >= 10000 ? Math.round(v / 1000) + ' kHz' : v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : Math.round(v) + ' Hz'),
      out: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', mix: pct };
    const STEP = { bits: 0.1, rate: 10, jitter: 0.01, input: 0.1, dither: 0.01, noise: 0.01, hp: 1, post: 10, out: 0.1, mix: 0.01 };
    function paint() { if (!ui.bits) return; ui.style.value = S.style; ui.interp.value = S.interp; ui.aa.value = S.aa ? 'on' : 'off'; ui.dtype.value = S.dtype; for (const m of MODP) ui[m[0]].set(S[m[0]]); }
    // het scherm: rekenmodel (1 kHz bij 48 kHz, twee perioden) met het echte signaal erdoorheen
    function draw() {
      if (dead || !canvas || !pen) return; const now = Date.now();
      if (!colors || now - colorAt > 2000) { const cs = getComputedStyle(canvas); colors = { bg: cs.getPropertyValue('--well').trim() || '#111', line: cs.getPropertyValue('--line').trim() || '#555', hot: cs.getPropertyValue('--audio').trim() || '#6cf', dim: cs.getPropertyValue('--muted').trim() || '#888' }; colorAt = now; }
      const d = Math.min(2, globalThis.devicePixelRatio || 1), W = size[0], H = size[1]; if (canvas.width !== Math.round(W * d) || canvas.height !== Math.round(H * d)) { canvas.width = Math.round(W * d); canvas.height = Math.round(H * d); }
      pen.setTransform(d, 0, 0, d, 0, 0); pen.fillStyle = colors.bg; pen.fillRect(0, 0, W, H);
      const bits = E('bits'), ratio = Math.max(1, 48000 / E('rate')), L = Math.pow(2, bits), st = STYLES.indexOf(S.style), lin = S.interp === 'linear', n = 96, amp = 0.9 * Math.pow(10, E('input') / 20);
      const X = i => i / n * W, Y = v => H / 2 - clamp(v, -1.1, 1.1) * (H / 2 - 4);
      pen.strokeStyle = colors.line; pen.lineWidth = 1; pen.beginPath(); pen.moveTo(0, H / 2); pen.lineTo(W, H / 2); pen.stroke();
      // ideaal signaal
      pen.strokeStyle = colors.dim; pen.globalAlpha = 0.5; pen.beginPath(); for (let i = 0; i <= n; i++) { const y = Y(amp * Math.sin(2 * Math.PI * i / 48)); i ? pen.lineTo(X(i), y) : pen.moveTo(X(i), y); } pen.stroke(); pen.globalAlpha = 1;
      // gekwantiseerd en vastgehouden
      const pts = []; for (let i = 0; i <= n; i++) pts.push(quantModel(amp * Math.sin(2 * Math.PI * Math.floor(i / ratio) * ratio / 48), L, st));
      pen.strokeStyle = colors.hot; pen.lineWidth = 1.6; pen.beginPath();
      if (lin) { const pk = []; for (let k = 0; k * ratio <= n + ratio; k++) pk.push([k * ratio, quantModel(amp * Math.sin(2 * Math.PI * k * ratio / 48), L, st)]); pk.forEach(([i, v], j) => j ? pen.lineTo(X(i), Y(v)) : pen.moveTo(X(i), Y(v))); }
      else { let prev = null; for (let i = 0; i <= n; i++) { const y = Y(pts[i]); if (prev === null) pen.moveTo(X(i), y); else { pen.lineTo(X(i), prev); pen.lineTo(X(i), y); } prev = y; } pen.lineTo(X(n), prev); }
      pen.stroke();
      // het echte signaal (alleen als er iets binnenkomt)
      try { an.getFloatTimeDomainData(tbuf); let pk = 0; for (let i = 0; i < tbuf.length; i++) { const a = Math.abs(tbuf[i]); if (a > pk) pk = a; }
        if (pk > 0.003 && pk < 1e3) { let s0 = 0; for (let i = 1; i < 512; i++) if (tbuf[i - 1] < 0 && tbuf[i] >= 0) { s0 = i; break; }
          pen.strokeStyle = colors.hot; pen.globalAlpha = 0.35; pen.lineWidth = 1; pen.beginPath(); for (let i = 0; i < 400; i++) { const y = Y(tbuf[s0 + i] / Math.max(0.2, pk) * 0.9); const x = i / 400 * W; i ? pen.lineTo(x, y) : pen.moveTo(x, y); } pen.stroke(); pen.globalAlpha = 1; } } catch { }
    }
    const inst = {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'minmax(0, 1fr)';
        const box = document.createElement('div'); box.className = 'bc-scr'; const sty = document.createElement('style'); sty.textContent = '.bc-scr:has(~ .pk-pnls){height:56px !important}'; el.appendChild(sty); box.style.cssText = 'height:84px;position:relative;min-width:0;overflow:hidden;border-radius:5px;background:var(--well,#111)';
        canvas = document.createElement('canvas'); canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', T.screen); box.appendChild(canvas); el.appendChild(box); pen = canvas.getContext('2d');
        if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { size = [Math.max(10, box.clientWidth), Math.max(10, box.clientHeight)]; }); ro.observe(box); } size = [Math.max(10, box.clientWidth || 300), 84];
        ui.style = host.ui.select(el, T.style, STYLES.map((id, i) => [id, T.styles[i]]), S.style, v => { if (STYLES.includes(v)) { S.style = v; post(); } }, { id: 'style', group: 'crush' });
        ui.interp = host.ui.select(el, T.interp, INTERP.map((id, i) => [id, T.interps[i]]), S.interp, v => { if (INTERP.includes(v)) { S.interp = v; post(); } }, { id: 'interp', group: 'crush' });
        ui.aa = host.ui.select(el, T.aa, [['off', T.off], ['on', T.on]], S.aa ? 'on' : 'off', v => { S.aa = v === 'on'; post(); }, { id: 'aa', group: 'crush' });
        ui.dtype = host.ui.select(el, T.dtype, DITH.map((id, i) => [id, T.dithers[i]]), S.dtype, v => { if (DITH.includes(v)) { S.dtype = v; post(); } }, { id: 'dtype', group: 'noise' });
        for (const m of MODP) { const k = m[0]; ui[k] = host.ui.knob(el, m[NI], [m[3], m[4], STEP[k]], S[k], FMT[k], v => { S[k] = v; apply(); }, { default: defaults[k], id: k, group: m[9], ...(m[5] ? { scale: 'log' } : {}) }); }
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
        offFrame = typeof host.frame === 'function' ? host.frame(inst, draw, 30) : null; draw();
      },
      unmount() { if (offFrame) { offFrame(); offFrame = null; } if (ro) { ro.disconnect(); ro = null; } note = null; canvas = null; pen = null; colors = null; for (const k of Object.keys(ui)) delete ui[k]; },
      params() { return MODP.map(m => ({ id: m[0], name: m[NI], lane: 'bitcrusher', laneName: T.lane, min: m[3], max: m[4], role: m[6], scale: m[5] ? 'log' : 'lin', drift: m[7], on: m[8] })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...S }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        for (const m of MODP) { const k = m[0]; S[k] = typeof s[k] === 'number' && Number.isFinite(s[k]) ? clamp(s[k], m[3], m[4]) : defaults[k]; }
        S.style = STYLES.includes(s.style) ? s.style : defaults.style; S.interp = INTERP.includes(s.interp) ? s.interp : defaults.interp; S.dtype = DITH.includes(s.dtype) ? s.dtype : defaults.dtype;
        S.aa = typeof s.aa === 'boolean' ? s.aa : defaults.aa;
        post(); apply(); paint();
      },
      destroy() { if (dead) return; dead = true; if (offFrame) { offFrame(); offFrame = null; } if (ro) ro.disconnect(); [inG, out, an, node].forEach(n => { try { if (n) n.disconnect(); } catch { } }); },
    };
    return inst;
  }
};
