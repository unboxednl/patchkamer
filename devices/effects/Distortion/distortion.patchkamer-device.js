// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Patchkamer contract v1.28. Distortion: acht vervormingskarakters (soft, hard, tube, tape, diode, fuzz, folder, rectifier) in een AudioWorklet,
//         met drive, bias (asymmetrie), tight (hoogdoorlaat voor de vervorming), tilt (voor-toonkleur), tone (laagdoorlaat) en presence (na-toonkleur),
//         gate en touch (gevoeligheid voor het ingangsniveau), niveau, mix (parallelle verzadiging), automatische niveaucorrectie,
//         1x/2x/4x oversampling met lineaire-fase filters (de droge weg wordt met de vertraging gelijkgetrokken) en een DC-blokkering.
//         Bewaker: ingang begrensd (±16) en NaN naar 0, toestanden per blok op eindigheid gecontroleerd en teruggezet.
//         Zonder AudioWorklet gaat het geluid onbewerkt door (met melding).
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TYPES = ['soft', 'hard', 'tube', 'tape', 'diode', 'fuzz', 'fold', 'rect'];
const OS = [1, 2, 4];
// id, naam nl, naam en, min, max, log, rol, bereik (drift), aan, groep
const MODP = [
  ['drive', 'Drive', 'Drive', 0, 1, false, 'drive', 0.12, true, 'drive'],
  ['bias', 'Bias', 'Bias', -1, 1, false, 'bias', 0.08, false, 'drive'],
  ['lowcut', 'Tight', 'Tight', 20, 1000, true, 'filter', 0.06, false, 'pre'],
  ['tilt', 'Tilt', 'Tilt', -1, 1, false, 'tone', 0.08, false, 'pre'],
  ['gate', 'Gate', 'Gate', 0, 1, false, 'gate', 0.05, false, 'dynamics'],
  ['touch', 'Touch', 'Touch', -1, 1, false, 'depth', 0.08, false, 'dynamics'],
  ['tone', 'Tone', 'Tone', 500, 20000, true, 'filter', 0.10, true, 'post'],
  ['presence', 'Presence', 'Presence', -1, 1, false, 'tone', 0.08, false, 'post'],
  ['out', 'Niveau', 'Level', -24, 12, false, 'level', 0.05, false, 'out'],
  ['mix', 'Mix', 'Mix', 0, 1, false, 'send', 0.08, true, 'out'],
];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ type: 'soft', drive: 0.4, bias: 0, lowcut: 20, tilt: 0, gate: 0, touch: 0, tone: 20000, presence: 0, out: 0, mix: 1, os: 2, auto: true });
const TXT = {
  nl: { type: 'Soort', os: 'Oversample', auto: 'Auto level', autoOn: 'automatisch', autoOff: 'vrij', off: 'uit', note: 'AudioWorklet laden…', fail: 'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.',
    types: ['Zacht', 'Hard', 'Buis', 'Tape', 'Diode', 'Fuzz', 'Folder', 'Gelijkrichter'], lane: 'Distortion' },
  en: { type: 'Type', os: 'Oversample', auto: 'Auto level', autoOn: 'automatic', autoOff: 'free', off: 'off', note: 'Loading AudioWorklet…', fail: 'AudioWorklet unavailable: the sound passes through unprocessed.',
    types: ['Soft', 'Hard', 'Tube', 'Tape', 'Diode', 'Fuzz', 'Folder', 'Rectifier'], lane: 'Distortion' },
};

const WNAME = 'nl-patchkamer-distortion-1-0-0';
const WORKLET = `
const IN_MAX = 16, OUT_MAX = 64, TYPES = 8;
const fin = (v, d, a, b) => (typeof v === 'number' && v >= a && v <= b) ? v : (v > b ? b : v < a ? a : d);
function I0(x) { let s = 1, t = 1; for (let k = 1; k < 40; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; }
// half-band FIR (Kaiser), DC gain 1; the centre tap is 0.5 and all other even taps are 0
function design(M, beta) {
  const N = 2 * M + 1, h = new Float64Array(N); let s = 0;
  for (let n = 0; n < N; n++) { const k = n - M; const sinc = k === 0 ? 1 : (k % 2 === 0 ? 0 : Math.sin(Math.PI * k / 2) / (Math.PI * k / 2)); const r = k / M; h[n] = 0.5 * sinc * I0(beta * Math.sqrt(Math.max(0, 1 - r * r))) / I0(beta); s += h[n]; }
  for (let n = 0; n < N; n++) h[n] /= s;
  const odd = new Float64Array(M); for (let k = 0; k < M; k++) odd[k] = h[2 * k + 1];
  return { M, odd, c: h[M] };
}
const HA = design(24, 8), HB = design(16, 8);
class Up2 {
  constructor(H) { this.H = H; this.b = new Float64Array(32); this.w = 0; this.o0 = 0; this.o1 = 0; }
  reset() { this.b.fill(0); this.w = 0; }
  put(x) {
    const b = this.b, H = this.H, w = this.w = (this.w + 1) & 31; b[w] = x;
    let s = 0; for (let k = 0; k < H.M; k++) s += H.odd[k] * b[(w - k) & 31];
    this.o0 = 2 * H.c * b[(w - (H.M >> 1)) & 31]; this.o1 = 2 * s;
  }
}
class Down2 {
  constructor(H) { this.H = H; this.b = new Float64Array(64); this.w = 0; }
  reset() { this.b.fill(0); this.w = 0; }
  get(a, c) {
    const b = this.b, H = this.H; let w = (this.w + 1) & 63; b[w] = a; w = (w + 1) & 63; b[w] = c; this.w = w;
    // y[n] = sum h[j] v[2n - j]: v[2n] is one position behind the newest sample
    let s = H.c * b[(w - 1 - H.M) & 63]; for (let k = 0; k < H.M; k++) s += H.odd[k] * b[(w - 2 - 2 * k) & 63];
    return s;
  }
}
class Bq { constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.s1 = 0; this.s2 = 0; this.on = false; }
  reset() { this.s1 = this.s2 = 0; }
  run(x) { const y = this.b0 * x + this.s1; this.s1 = this.b1 * x - this.a1 * y + this.s2; this.s2 = this.b2 * x - this.a2 * y; return y; }
  set(b0, b1, b2, a0, a1, a2) { this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0; }
  hp(f, q) { const w = 2 * Math.PI * f / sampleRate, c = Math.cos(w), al = Math.sin(w) / (2 * q); this.set((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al); }
  lp(f, q) { const w = 2 * Math.PI * f / sampleRate, c = Math.cos(w), al = Math.sin(w) / (2 * q); this.set((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + al, -2 * c, 1 - al); }
  low(f, db) { const A = Math.pow(10, db / 40), w = 2 * Math.PI * f / sampleRate, c = Math.cos(w), al = Math.sin(w) / 2 * Math.SQRT2, r = 2 * Math.sqrt(A) * al;
    this.set(A * ((A + 1) - (A - 1) * c + r), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - r), (A + 1) + (A - 1) * c + r, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - r); }
  high(f, db) { const A = Math.pow(10, db / 40), w = 2 * Math.PI * f / sampleRate, c = Math.cos(w), al = Math.sin(w) / 2 * Math.SQRT2, r = 2 * Math.sqrt(A) * al;
    this.set(A * ((A + 1) + (A - 1) * c + r), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - r), (A + 1) - (A - 1) * c + r, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - r); }
}
// the eight characters. u is the signal after drive and bias; every function is 0 at u = 0 (together with the static offset correction)
function diode(x) { const a = x < 0 ? -x : x; let y = Math.asinh(10 * a) / 5; for (let i = 0; i < 4; i++) y -= (y + 0.1 * Math.sinh(5 * y) - a) / (1 + 0.5 * Math.cosh(5 * y)); return x < 0 ? -y : y; }
function shape(t, u) {
  switch (t) {
    case 0: return Math.tanh(u);
    case 1: return u > 1 ? 1 : u < -1 ? -1 : u;
    case 2: return u >= 0 ? 1 - Math.exp(-u) : -0.625 * (1 - Math.exp(1.6 * u));
    case 3: return u > 1.5 ? 1 : u < -1.5 ? -1 : u - (4 / 27) * u * u * u;
    case 4: return diode(u);
    case 5: return Math.tanh(2.2 * (Math.tanh(3 * u + 0.3) - 0.28794992175));
    case 6: return Math.sin(1.5707963267948966 * u);
    default: return 1.5 * Math.tanh(u < 0 ? -u : u);
  }
}
const BASE = [1, 1, 1, 1, 1, 0.25, 1, 1];   // base gain per character (fuzz is already hard at drive 0)
class Chan { constructor() { this.pre = [new Bq(), new Bq(), new Bq()]; this.post = [new Bq(), new Bq(), new Bq()]; this.uA = new Up2(HA); this.dA = new Down2(HA); this.uB = new Up2(HB); this.dB = new Down2(HB); this.dcx = 0; this.dcy = 0; this.dl = new Float64Array(128); }
  reset() { for (const f of this.pre) f.reset(); for (const f of this.post) f.reset(); this.uA.reset(); this.dA.reset(); this.uB.reset(); this.dB.reset(); this.dcx = this.dcy = 0; this.dl.fill(0); }
  resetOs() { this.uA.reset(); this.dA.reset(); this.uB.reset(); this.dB.reset(); } }
class PkDistortion extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const k = (name, d, a, b) => ({ name, defaultValue: d, minValue: a, maxValue: b, automationRate: 'k-rate' });
    return [k('drive', 0.4, 0, 1), k('bias', 0, -1, 1), k('lowcut', 20, 20, 1000), k('tilt', 0, -1, 1), k('gate', 0, 0, 1), k('touch', 0, -1, 1), k('tone', 20000, 500, 20000), k('presence', 0, -1, 1), k('out', 0, -24, 12), k('mix', 1, 0, 1)];
  }
  constructor() {
    super(); this.ch = [new Chan(), new Chan()]; this.type = 0; this.os = 2; this.auto = true; this.wp = 0;
    this.gS = 1; this.cS = 1; this.oS = 1; this.mS = 1; this.env = 0; this.gate = 1; this.key = ''; this.comp = 1; this.compKey = ''; this.dly = 0;
    this.sm = 1 - Math.exp(-1 / (sampleRate * 0.006)); this.ea = 1 - Math.exp(-1 / (sampleRate * 0.002)); this.er = 1 - Math.exp(-1 / (sampleRate * 0.08));
    this.dcR = 1 - 2 * Math.PI * 8 / sampleRate;
    this.port.onmessage = e => { const d = e.data || {};
      if (typeof d.type === 'number' && d.type >= 0 && d.type < TYPES) { this.type = d.type | 0; this.key = ''; }
      if (d.os === 1 || d.os === 2 || d.os === 4) { if (d.os !== this.os) for (const c of this.ch) c.resetOs(); this.os = d.os; }
      if (typeof d.auto === 'boolean') this.auto = d.auto; };
  }
  // level compensation: gain that brings the RMS of a -12 dBFS sine back to its input RMS after shaping
  calcComp(g, b) {
    if (!this.auto) return 1;
    const t = this.type, off = b * 0.8, f0 = shape(t, off); let s = 0, m = 0; const N = 128, v = new Float64Array(N);
    for (let i = 0; i < N; i++) { v[i] = shape(t, g * 0.25 * Math.sin(2 * Math.PI * i / N) + off) - f0; m += v[i]; }
    m /= N; for (let i = 0; i < N; i++) s += (v[i] - m) * (v[i] - m);
    const r = Math.sqrt(s / N); return r > 1e-6 ? Math.min(4, Math.max(0.0631, 0.1767767 / r)) : 4;
  }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], len = out[0].length, sr = sampleRate, nch = out.length;
    const drive = fin(P.drive[0], 0.4, 0, 1), bias = fin(P.bias[0], 0, -1, 1), lowcut = fin(P.lowcut[0], 20, 20, 1000), tilt = fin(P.tilt[0], 0, -1, 1), gateP = fin(P.gate[0], 0, 0, 1),
      touch = fin(P.touch[0], 0, -1, 1), tone = fin(P.tone[0], 20000, 500, 20000), pres = fin(P.presence[0], 0, -1, 1), outDb = fin(P.out[0], 0, -24, 12), mix = fin(P.mix[0], 1, 0, 1);
    const t = this.type, os = this.os, ch = this.ch;
    const key = [lowcut, tilt, tone, pres, t].join();
    if (key !== this.key) { this.key = key;
      for (const c of ch) {
        const [h, l, s] = c.pre; c.pre[0].on = lowcut > 20.5; if (c.pre[0].on) h.hp(lowcut, 0.7071);
        c.pre[1].on = Math.abs(tilt) > 0.001; c.pre[2].on = c.pre[1].on; if (c.pre[1].on) { l.low(500, -tilt * 9); s.high(2500, tilt * 9); }
        const [lp, sh, te] = c.post; lp.on = tone < 19990; if (lp.on) lp.lp(Math.min(tone, sr * 0.45), 0.7071);
        sh.on = Math.abs(pres) > 0.001; if (sh.on) sh.high(4000, pres * 9);
        te.on = t === 3; if (te.on) te.low(110, 3);
      } }
    const gDb = drive * 40, g0 = Math.pow(10, gDb / 20) * BASE[t], off = bias * 0.8;
    const ck = [t, drive, bias, this.auto].join(); if (ck !== this.compKey) { this.compKey = ck; this.comp = this.calcComp(g0, bias); }
    const f0 = shape(t, off), outG = Math.pow(10, outDb / 20) * this.comp;
    // gate and touch work on the input level (linked stereo)
    let envMax = this.env; const thr = gateP > 0 ? -80 + 50 * gateP : -200;
    const sm = this.sm, ea = this.ea, er = this.er, dcR = this.dcR;
    const lat = os === 1 ? 0 : os === 2 ? 24 : 32;
    let gS = this.gS, cS = this.cS, oS = this.oS, mS = this.mS, env = this.env, gate = this.gate, wp = this.wp;
    if (!this.init) { this.init = true; gS = 0; }   // first block: snap the smoothed values to their targets
    // per block targets from the level at the start of the block
    const envDb = env > 1e-9 ? 20 * Math.log10(env) : -180;
    const lvl = Math.min(1, Math.max(0, (envDb + 50) / 50)); const touchDb = touch * 24 * (lvl - 0.5);
    const gT = g0 * Math.pow(10, touchDb / 20);
    gate = gateP > 0 ? (envDb > thr ? 1 : envDb < thr - 4 ? 0 : (this.gateOpen ? 1 : 0)) : 1; this.gateOpen = gate > 0.5;
    if (gS === 0 && this.init === true) { gS = gT; cS = 1; oS = outG; mS = mix; this.init = 2; }
    let bad = false;
    for (let i = 0; i < len; i++) {
      let a = inp.length ? (inp[0][i] || 0) : 0; let b = inp.length > 1 ? (inp[1][i] || 0) : a;
      if (!(a > -IN_MAX && a < IN_MAX)) a = a !== a ? 0 : a > 0 ? IN_MAX : -IN_MAX;
      if (!(b > -IN_MAX && b < IN_MAX)) b = b !== b ? 0 : b > 0 ? IN_MAX : -IN_MAX;
      const lv = Math.max(a < 0 ? -a : a, b < 0 ? -b : b); env += (lv - env) * (lv > env ? ea : er);
      gS += (gT - gS) * sm; cS += (gate - cS) * (gate > cS ? 0.02 : 0.004); oS += (outG - oS) * sm; mS += (mix - mS) * sm;
      const rp = (wp - lat) & 127; wp = (wp + 1) & 127;
      for (let c = 0; c < nch; c++) {
        const C = ch[c < 2 ? c : 1]; const x0 = c === 0 ? a : b; C.dl[wp - 1 & 127] = x0; const dry = C.dl[rp];
        let x = x0 * cS;
        if (C.pre[0].on) x = C.pre[0].run(x); if (C.pre[1].on) { x = C.pre[1].run(x); x = C.pre[2].run(x); }
        const u = x * gS; let y;
        if (os === 1) y = shape(t, u + off) - f0;
        else {
          const A = C.uA; A.put(u);
          if (os === 2) { y = C.dA.get(shape(t, A.o0 + off) - f0, shape(t, A.o1 + off) - f0); }
          else { const B = C.uB; B.put(A.o0); const p0 = shape(t, B.o0 + off) - f0, p1 = shape(t, B.o1 + off) - f0; B.put(A.o1); const p2 = shape(t, B.o0 + off) - f0, p3 = shape(t, B.o1 + off) - f0;
            y = C.dA.get(C.dB.get(p0, p1), C.dB.get(p2, p3)); }
        }
        // DC blocker (8 Hz), then the post-tone filters
        const dc = y - C.dcx + dcR * C.dcy; C.dcx = y; C.dcy = dc; y = dc;
        if (C.post[0].on) y = C.post[0].run(y); if (C.post[1].on) y = C.post[1].run(y); if (C.post[2].on) y = C.post[2].run(y);
        y *= oS;
        let o = dry * (1 - mS) + y * mS;
        if (!(o > -OUT_MAX && o < OUT_MAX)) { o = 0; bad = true; }
        out[c][i] = o;
      }
    }
    this.gS = gS; this.cS = cS; this.oS = oS; this.mS = mS; this.env = env; this.gate = gate; this.wp = wp;
    // guard: a state that is no longer finite is cleared instead of silencing the sound for good
    let ok = bad || !(Number.isFinite(env) && Number.isFinite(gS) && Number.isFinite(cS) && Number.isFinite(oS) && Number.isFinite(mS));
    if (!ok) for (const C of ch) { if (!(Number.isFinite(C.dcx) && Number.isFinite(C.dcy))) { ok = true; break; } for (const f of C.pre.concat(C.post)) if (!(Number.isFinite(f.s1) && Number.isFinite(f.s2) && Math.abs(f.s1) < 1e6 && Math.abs(f.s2) < 1e6)) { ok = true; break; } if (ok) break; if (!(Number.isFinite(C.uA.b[C.uA.w]) && Number.isFinite(C.dA.b[C.dA.w]) && Number.isFinite(C.uB.b[C.uB.w]) && Number.isFinite(C.dB.b[C.dB.w]))) { ok = true; break; } }
    if (ok) { for (const C of ch) C.reset(); this.env = 0; this.gS = gT; this.cS = 1; this.oS = outG; this.mS = mix; this.key = ''; this.compKey = ''; }
    return true;
  }
}
registerProcessor('${WNAME}', PkDistortion);
`;

export default {
  id: 'nl.patchkamer.distortion', name: 'Distortion', version: '1.0.0', category: 'effect', kind: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ui: { width: 340, minWidth: 300 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', NI = nl ? 1 : 2, T = nl ? TXT.nl : TXT.en;
    const osHint = host && host.audio && host.audio.oversample;
    const S = DEF(); S.os = osHint === 'none' ? 1 : osHint === '4x' ? 4 : 2;
    const defaults = { ...S };
    const mod = {}; let dead = false, node = null, failed = false, note = null; const ui = {};
    const inG = ctx.createGain(), out = ctx.createGain(); inG.connect(out);   // zonder worklet gaat het geluid onbewerkt door
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!o) return b; return m[5] ? clamp(b * Math.pow(m[4] / m[3], o), m[3], m[4]) : clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    function paintNote() { if (note) note.textContent = node ? '' : failed ? T.fail : T.note; }
    function post() { if (node) try { node.port.postMessage({ type: TYPES.indexOf(S.type), os: S.os, auto: S.auto }); } catch { } }
    function apply() {
      if (!node) return; const t = ctx.currentTime, r = 0.02;
      for (const m of MODP) { const p = node.parameters.get(m[0]); if (p) p.setTargetAtTime(E(m[0]), t, r); }
    }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead) return; if (typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      inG.disconnect(out); inG.connect(node).connect(out); post(); apply(); paintNote();
    }).catch(() => { if (dead) return; failed = true; paintNote(); });
    const pct = v => Math.round(v * 100) + '%', sgn = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
    const FMT = { drive: v => '+' + Math.round(v * 40) + ' dB', bias: sgn, lowcut: v => Math.round(v) + ' Hz', tilt: sgn, gate: v => v <= 0 ? T.off : Math.round(-80 + 50 * v) + ' dB', touch: sgn,
      tone: v => v >= 19990 ? T.off : (v >= 10000 ? Math.round(v / 1000) + ' kHz' : v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : Math.round(v) + ' Hz'), presence: sgn, out: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', mix: pct };
    const STEP = { drive: 0.01, bias: 0.01, lowcut: 1, tilt: 0.01, gate: 0.01, touch: 0.01, tone: 10, presence: 0.01, out: 0.1, mix: 0.01 };
    function paint() { if (!ui.drive) return; ui.type.value = S.type; ui.os.value = String(S.os); ui.auto.value = S.auto ? 'on' : 'off'; for (const m of MODP) ui[m[0]].set(S[m[0]]); }
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'minmax(0, 1fr)';
        ui.type = host.ui.select(el, T.type, TYPES.map((id, i) => [id, T.types[i]]), S.type, v => { if (TYPES.includes(v)) { S.type = v; post(); } }, { id: 'type', group: 'drive' });
        for (const m of MODP) { const k = m[0]; ui[k] = host.ui.knob(el, m[NI], [m[3], m[4], STEP[k]], S[k], FMT[k], v => { S[k] = v; apply(); }, { default: defaults[k], id: k, group: m[9], ...(m[5] ? { scale: 'log' } : {}) }); }
        ui.os = host.ui.select(el, T.os, [['1', 'off'], ['2', '2x'], ['4', '4x']].map(([v, t]) => [v, t === 'off' ? T.off : t]), String(S.os), v => { S.os = +v; post(); }, { id: 'os', group: 'out' });
        ui.auto = host.ui.select(el, T.auto, [['on', T.autoOn], ['off', T.autoOff]], S.auto ? 'on' : 'off', v => { S.auto = v === 'on'; post(); }, { id: 'auto', group: 'out' });
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
      },
      unmount() { note = null; for (const k of Object.keys(ui)) delete ui[k]; },
      params() { return MODP.map(m => ({ id: m[0], name: m[NI], lane: 'distortion', laneName: T.lane, min: m[3], max: m[4], role: m[6], scale: m[5] ? 'log' : 'lin', drift: m[7], on: m[8] })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...S }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        for (const m of MODP) { const k = m[0]; S[k] = typeof s[k] === 'number' && Number.isFinite(s[k]) ? clamp(s[k], m[3], m[4]) : defaults[k]; }
        S.type = typeof s.type === 'string' && TYPES.includes(s.type) ? s.type : defaults.type;
        S.os = OS.includes(s.os) ? s.os : defaults.os;
        S.auto = typeof s.auto === 'boolean' ? s.auto : defaults.auto;
        post(); apply(); paint();
      },
      destroy() { if (dead) return; dead = true; [inG, out, node].forEach(n => { try { if (n) n.disconnect(); } catch { } }); },
    };
  }
};
