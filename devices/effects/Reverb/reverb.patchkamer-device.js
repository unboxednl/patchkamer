// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Nieuw apparaat (contract v1.28): een algoritmische galm met vijf modellen (Hall, Plate, Spring, Room, Chamber) in één AudioWorklet.
//          Hall, Plate, Room en Chamber zijn een feedback-delay-network van 8 gemoduleerde lijnen (Householder-matrix) met vier ingangsdiffusers, een tabel vroege reflecties en per lijn een
//          demping in twee banden (decaytijd per frequentie volgens de RT60-regel); Spring is twee lussen met een keten van 60 allpass-secties (dispersie, de "boing") en een zachte begrenzer.
//          Regelaars: grootte, decay (RT60), pre-delay (vrij of op tempo), demping hoog en laag, diffusie, modulatie, vroeg/laat, ingangs-HP en -LP, breedte, ducking, freeze en mix.
//          Bewaker: de ingang wordt begrensd (±16) en NaN wordt 0, parameters worden alleen eindig geaccepteerd, en een motor met een niet-eindige of absurde uitgang wordt gewist en herstart.
//          Gemeten (offline, niet beluisterd): zie docs/tools/measure-reverb.mjs.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// id, naam per taal (nl, en), min, max, log, rol, bereik, aan, spoor
const MODP = [
  ['size', 'Grootte', 'Size', 0, 1, false, 'decay', 0.05, false, 'space'],
  ['decay', 'Decay', 'Decay', 0.1, 30, true, 'decay', 0.06, false, 'space'],
  ['predelay', 'Pre-delay', 'Pre-delay', 0, 250, false, 'time', 0.03, false, 'space'],
  ['dampHi', 'Demping', 'Damping', 1000, 20000, true, 'tone', 0.10, true, 'tone'],
  ['dampLo', 'Lage decay', 'Low decay', 0.25, 2, true, 'tone', 0.06, false, 'tone'],
  ['diff', 'Diffusie', 'Diffusion', 0, 1, false, 'tone', 0.05, false, 'tone'],
  ['mod', 'Modulatie', 'Modulation', 0, 1, false, 'modulation', 0.08, false, 'tone'],
  ['early', 'Vroeg/laat', 'Early/late', 0, 1, false, 'send', 0.06, false, 'tone'],
  ['hp', 'Ingang HP', 'Input HP', 20, 1000, true, 'filter', 0.08, false, 'input'],
  ['lp', 'Ingang LP', 'Input LP', 1000, 20000, true, 'filter', 0.08, false, 'input'],
  ['width', 'Breedte', 'Width', 0, 2, false, 'width', 0.06, false, 'output'],
  ['duck', 'Ducking', 'Ducking', 0, 1, false, 'depth', 0.06, false, 'output'],
  ['mix', 'Mix', 'Mix', 0, 1, false, 'send', 0.08, true, 'output'],
];
const MODELS = ['hall', 'plate', 'spring', 'room', 'chamber'];
const DIVS = [['32', 0.5], ['16', 1], ['8', 2], ['4', 4], ['2', 8]];   // noot-waarde (1/n) en het aantal zestienden
const TXT = {
  nl: { model: 'Model', hall: 'Hall', plate: 'Plate', spring: 'Spring', room: 'Room', chamber: 'Chamber', pdmode: 'Pre sync', free: 'vrij', sync: 'op tempo', div: 'Noot', freeze: 'Freeze', off: 'uit', on: 'vast',
    laneSpace: 'Ruimte', laneTone: 'Klank', laneInput: 'Ingang', laneOutput: 'Uitgang', noworklet: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.' },
  en: { model: 'Model', hall: 'Hall', plate: 'Plate', spring: 'Spring', room: 'Room', chamber: 'Chamber', pdmode: 'Pre sync', free: 'free', sync: 'to tempo', div: 'Note', freeze: 'Freeze', off: 'off', on: 'hold',
    laneSpace: 'Space', laneTone: 'Tone', laneInput: 'Input', laneOutput: 'Output', noworklet: 'AudioWorklet unavailable: the sound passes through unchanged.' },
};
const DEF = { model: 'hall', size: 0.5, decay: 2.5, predelay: 20, sync: false, div: '16', dampHi: 6000, dampLo: 1, diff: 0.7, mod: 0.4, early: 0.3, hp: 20, lp: 20000, width: 1, duck: 0, freeze: false, mix: 0.3 };

const WNAME = 'nl-patchkamer-reverb-1-0-0';
const WORKLET = `
const IN_MAX = 16, TWO_PI = 6.283185307179586;
const P0 = { model: 'hall', size: 0.5, decay: 2.5, pd: 0.02, dampHi: 6000, dampLo: 1, diff: 0.7, mod: 0.4, early: 0.3, hp: 20, lp: 20000, width: 1, duck: 0, freeze: false, mix: 0.3 };
const RNG = { size: [0, 1], decay: [0.1, 30], pd: [0, 0.5], dampHi: [1000, 20000], dampLo: [0.25, 2], diff: [0, 1], mod: [0, 1], early: [0, 1], hp: [20, 1000], lp: [1000, 20000], width: [0, 2], duck: [0, 1], mix: [0, 1] };
const MODELS = ['hall', 'plate', 'spring', 'room', 'chamber'];
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
const pow2 = n => { let p = 1; while (p < n) p <<= 1; return p; };
function herm(buf, mask, pos) {
  const i = Math.floor(pos), f = pos - i, y0 = buf[(i - 1) & mask], y1 = buf[i & mask], y2 = buf[(i + 1) & mask], y3 = buf[(i + 2) & mask];
  return ((((y3 - y0) * 0.5 + (y1 - y2) * 1.5) * f + (y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3)) * f + (y2 - y0) * 0.5) * f + y1;
}
function lin(buf, mask, pos) { const i = Math.floor(pos), f = pos - i; return buf[i & mask] * (1 - f) + buf[(i + 1) & mask] * f; }

// afstemming per model: lijnlengtes (ms, bij grootte 0,5), vier ingangsdiffusers (ms), vroege reflecties [ms, links, rechts], begin van de late galm, modulatie, klankverschuiving
const CFG = {
  hall: { lines: [43.1, 53.9, 63.7, 77.3, 89.9, 101.3, 117.7, 131.1], ap: [5.3, 7.9, 11.7, 17.3], apMax: 0.62, late: 14, mod: 0.0024, modRate: [0.31, 0.43, 0.53, 0.67, 0.79, 0.89, 1.03, 1.13], hi: 1, erG: 0.9, lateG: 1,
    taps: [[19, 0.8, 0.5], [31, 0.5, 0.8], [47, 0.6, 0.4], [63, 0.4, 0.6], [79, 0.4, 0.3], [97, 0.3, 0.4]] },
  plate: { lines: [17.3, 21.1, 25.9, 29.3, 33.7, 38.9, 43.1, 47.9], ap: [1.9, 3.1, 4.3, 6.1], apMax: 0.78, late: 0, mod: 0.0012, modRate: [0.5, 0.71, 0.93, 1.13, 1.31, 1.49, 1.67, 1.87], hi: 1.5, erG: 0.5, lateG: 1.1,
    taps: [[3, 0.6, 0.5], [5, 0.5, 0.6], [7.5, 0.5, 0.4], [10, 0.4, 0.5], [13, 0.4, 0.3], [17, 0.3, 0.4], [21, 0.3, 0.3], [26, 0.2, 0.3]] },
  room: { lines: [6.1, 7.9, 9.7, 11.3, 13.1, 14.9, 17.3, 19.7], ap: [0.9, 1.7, 2.9, 4.3], apMax: 0.6, late: 2, mod: 0.0004, modRate: [0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1], hi: 0.9, erG: 1.2, lateG: 0.9,
    taps: [[4.1, 0.9, 0.5], [6.7, 0.5, 0.9], [9.1, 0.7, 0.4], [11.9, 0.4, 0.7], [14.3, 0.5, 0.3], [17.9, 0.3, 0.5], [21.7, 0.3, 0.2], [26.3, 0.2, 0.3]] },
  chamber: { lines: [19.1, 23.3, 28.7, 33.1, 38.9, 44.3, 51.7, 57.9], ap: [3.1, 5.3, 8.9, 12.7], apMax: 0.68, late: 6, mod: 0.0016, modRate: [0.37, 0.47, 0.59, 0.71, 0.83, 0.97, 1.09, 1.21], hi: 0.8, erG: 1, lateG: 1,
    taps: [[8, 0.7, 0.5], [13, 0.5, 0.7], [19, 0.6, 0.4], [27, 0.4, 0.6], [36, 0.4, 0.3], [47, 0.3, 0.4], [60, 0.2, 0.3]] },
  spring: { springs: [34.7, 41.3], sections: 60, hi: 0.55, erG: 1, lateG: 1 },
};
// versterking van de uitgang per model: gemeten zo dat ruis op de ingang ongeveer even hard uit de galm komt (zie measure-reverb.mjs)
const WETNORM = { hall: 1, plate: 1, spring: 1.6, room: 0.7, chamber: 0.9 };
const tcomp = T => Math.pow(2.5 / (T < 0.3 ? 0.3 : T > 20 ? 20 : T), 0.2);   // lange decay wordt iets zachter, zodat de galm niet met de decay mee blijft aanzwellen

// dempingsfilter per lijn (Jot): de gewenste RT60 bij het midden, een apart langere of kortere laag, en een eenpolig laagdoorlaat zo dat de RT60 bij fc de helft is
function lineCoefs(d, T, fc, loMul, freeze) {
  if (freeze) return [0.99995, 0, 0];
  const km = Math.pow(10, -3 * d / T);
  let kl = Math.pow(10, -3 * d / (T * loMul)); kl = Math.min(kl, 0.9998);
  const la = Math.max(-0.95, kl / km - 1);
  const w = TWO_PI * Math.min(fc, sampleRate * 0.49) / sampleRate, cw = Math.cos(w);
  let p = 0;
  if (fc < sampleRate * 0.45) {
    const f = q => (1 - q) / Math.sqrt(1 - 2 * q * cw + q * q);
    if (km < 1) { let lo = 0, hi = 0.9999; for (let it = 0; it < 28; it++) { const mid = (lo + hi) / 2; if (f(mid) > km) lo = mid; else hi = mid; } p = (lo + hi) / 2; }
  }
  return [Math.min(km, 0.99995), p, la];
}
class BQ {
  constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0; this.bypass = true; }
  set(type, f) {
    const w = TWO_PI * Math.min(f, sampleRate * 0.45) / sampleRate, c = Math.cos(w), al = Math.sin(w) / (2 * 0.7071), a0 = 1 + al;
    if (type === 'hp') { this.b0 = (1 + c) / 2 / a0; this.b1 = -(1 + c) / a0; this.b2 = this.b0; } else { this.b0 = (1 - c) / 2 / a0; this.b1 = (1 - c) / a0; this.b2 = this.b0; }
    this.a1 = -2 * c / a0; this.a2 = (1 - al) / a0;
  }
  run(x, y, N) {
    let x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2; const b0 = this.b0, b1 = this.b1, b2 = this.b2, a1 = this.a1, a2 = this.a2;
    for (let n = 0; n < N; n++) { const v = x[n], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[n] = o; }
    this.x1 = x1; this.x2 = x2; this.y1 = y1; this.y2 = y2;
  }
  reset() { this.x1 = this.x2 = this.y1 = this.y2 = 0; }
}

class FDN {
  constructor(model, P) {
    const sr = sampleRate, c = this.c = CFG[model]; this.model = model;
    this.pdN = pow2(Math.ceil(0.9 * sr)); this.pdL = new Float32Array(this.pdN); this.pdR = new Float32Array(this.pdN); this.pdW = 0;
    this.ap = [[], []];
    for (let ch = 0; ch < 2; ch++) for (let k = 0; k < 4; k++) { const len = Math.max(2, Math.round(c.ap[k] * 0.001 * sr * (ch ? 1.09 : 1))); this.ap[ch].push({ b: new Float32Array(len), i: 0 }); }
    this.bufs = []; this.masks = []; this.len = new Float64Array(8); this.tgt = new Float64Array(8); this.ph = new Float64Array(8); this.rate = new Float64Array(8);
    for (let i = 0; i < 8; i++) { const maxLen = Math.ceil(c.lines[i] * 0.001 * sr * 2.1) + Math.ceil(c.mod * sr) + 16, n = pow2(maxLen); this.bufs.push(new Float32Array(n)); this.masks.push(n - 1); this.ph[i] = (i * 0.37) % 1; this.rate[i] = c.modRate[i] / sr; }
    this.g = new Float64Array(8); this.gT = new Float64Array(8); this.p = new Float64Array(8); this.pT = new Float64Array(8); this.la = new Float64Array(8); this.laT = new Float64Array(8);
    this.s1 = new Float64Array(8); this.s2 = new Float64Array(8); this.ys = new Float64Array(8);
    this.w = 0; this.cl = 1 - Math.exp(-TWO_PI * 250 / sr);
    this.erN = c.taps.length; this.pdc = P.pd * sr; this.fz = P.freeze ? 0 : 1; this.last = ''; this.sm = { diff: P.diff, mod: P.mod, early: P.early };
    this.retune(P, true);
  }
  retune(P, snap) {
    const sr = sampleRate, scale = 0.5 * Math.pow(4, P.size), key = [P.size, P.decay, P.dampHi, P.dampLo, P.freeze].join();
    if (key === this.last && !snap) return; this.last = key;
    for (let i = 0; i < 8; i++) {
      this.tgt[i] = Math.max(8, this.c.lines[i] * 0.001 * sr * scale); if (snap) this.len[i] = this.tgt[i];
      const co = lineCoefs(this.tgt[i] / sr, P.decay, P.dampHi * this.c.hi, P.dampLo, P.freeze);
      this.gT[i] = co[0]; this.pT[i] = co[1]; this.laT[i] = co[2];
      if (snap) { this.g[i] = co[0]; this.p[i] = co[1]; this.la[i] = co[2]; }
    }
  }
  reset() { for (let i = 0; i < 8; i++) { this.bufs[i].fill(0); this.s1[i] = 0; this.s2[i] = 0; } for (const ch of this.ap) for (const a of ch) a.b.fill(0); this.pdL.fill(0); this.pdR.fill(0); }
  revive(P) { this.reset(); this.pdc = P.pd * sampleRate; this.fz = P.freeze ? 0 : 1; this.sm = { diff: P.diff, mod: P.mod, early: P.early }; this.retune(P, true); }
  process(inL, inR, oL, oR, N, P) {
    const sr = sampleRate, c = this.c, S = this.sm, scale = 0.5 * Math.pow(4, P.size);
    this.retune(P, false);
    for (let i = 0; i < 8; i++) { this.g[i] += (this.gT[i] - this.g[i]) * 0.3; this.p[i] += (this.pT[i] - this.p[i]) * 0.3; this.la[i] += (this.laT[i] - this.la[i]) * 0.3; }
    S.diff += (P.diff - S.diff) * 0.3; S.mod += (P.mod - S.mod) * 0.3; S.early += (P.early - S.early) * 0.3;
    const fz0 = this.fz, fz1 = P.freeze ? 0 : 1; this.fz = fz1;
    const apg = Math.min(0.85, S.diff * c.apMax), md = S.mod * c.mod * sr, eAng = S.early * Math.PI / 2, eG = Math.sin(eAng) * c.erG * 1.4, lG = Math.cos(eAng) * c.lateG * WETNORM[this.model] * tcomp(P.decay);
    const pdMask = this.pdN - 1, lateS = c.late * 0.001 * sr, erS = Math.pow(scale, 0.7), taps = c.taps, tapS = new Float64Array(taps.length);
    for (let k = 0; k < taps.length; k++) tapS[k] = taps[k][0] * 0.001 * sr * erS;
    const len = this.len, tgt = this.tgt, ph = this.ph, rate = this.rate, bufs = this.bufs, masks = this.masks, g = this.g, p = this.p, la = this.la, s1 = this.s1, s2 = this.s2, ys = this.ys, cL = this.cl;
    const pdL = this.pdL, pdR = this.pdR, apL = this.ap[0], apR = this.ap[1];
    const tpd = P.pd * sr; let w = this.w, pw = this.pdW, pdc = this.pdc;
    for (let n = 0; n < N; n++) {
      const fz = fz0 + (fz1 - fz0) * (n / N), xl = inL[n] * fz, xr = inR[n] * fz;
      pdL[pw & pdMask] = xl; pdR[pw & pdMask] = xr;
      pdc += (tpd - pdc) * 0.002;
      // late: pre-delayed input through the diffusers
      let dl = lin(pdL, pdMask, pw - pdc - lateS), dr = lin(pdR, pdMask, pw - pdc - lateS);
      for (let k = 0; k < 4; k++) {
        let a = apL[k], d = a.b[a.i], v = dl - apg * d; a.b[a.i] = v; dl = d + apg * v; if (++a.i >= a.b.length) a.i = 0;
        a = apR[k]; d = a.b[a.i]; v = dr - apg * d; a.b[a.i] = v; dr = d + apg * v; if (++a.i >= a.b.length) a.i = 0;
      }
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        let t = tgt[i] - len[i]; if (t > 0.1) t = 0.1; else if (t < -0.1) t = -0.1; len[i] += t;
        ph[i] += rate[i]; if (ph[i] >= 1) ph[i] -= 1;
        const r = herm(bufs[i], masks[i], w - (len[i] + md * Math.sin(TWO_PI * ph[i])));
        s2[i] += cL * (r - s2[i]);
        s1[i] = (1 - p[i]) * (r + la[i] * s2[i]) + p[i] * s1[i];
        const y = g[i] * s1[i]; ys[i] = y; sum += y;
      }
      const h = sum * 0.25;
      for (let i = 0; i < 8; i++) {
        const inj = (i & 1 ? dr * 0.8 + dl * 0.4 : dl * 0.8 + dr * 0.4) * ((i & 2) ? -1 : 1) * 0.35;
        bufs[i][w & masks[i]] = ys[i] - h + inj;
      }
      // output: two orthogonal Hadamard rows
      const lt = (ys[0] - ys[1] + ys[2] - ys[3] + ys[4] - ys[5] + ys[6] - ys[7]) * 0.3536, rt = (ys[0] + ys[1] - ys[2] - ys[3] + ys[4] + ys[5] - ys[6] - ys[7]) * 0.3536;
      // early reflections
      let el = 0, er = 0;
      for (let k = 0; k < taps.length; k++) { const pos = pw - pdc - tapS[k]; if (k & 1) { const v = lin(pdR, pdMask, pos), u = lin(pdL, pdMask, pos); el += v * taps[k][1]; er += u * taps[k][2]; } else { const v = lin(pdL, pdMask, pos), u = lin(pdR, pdMask, pos); el += v * taps[k][1]; er += u * taps[k][2]; } }
      oL[n] = lt * lG + el * eG * 0.6; oR[n] = rt * lG + er * eG * 0.6;
      w = (w + 1) & 4194303; pw = (pw + 1) & 4194303;
    }
    this.w = w; this.pdW = pw; this.pdc = pdc;
  }
}

class Spring {
  constructor(model, P) {
    const sr = sampleRate, c = this.c = CFG.spring; this.model = 'spring'; this.K = c.sections;
    this.bufs = []; this.masks = []; this.len = new Float64Array(2); this.tgt = new Float64Array(2);
    for (let i = 0; i < 2; i++) { const n = pow2(Math.ceil(c.springs[i] * 0.001 * sr * 1.8) + 400); this.bufs.push(new Float32Array(n)); this.masks.push(n - 1); }
    this.z = [new Float64Array(this.K), new Float64Array(this.K)]; this.ze = [new Float64Array(this.K), new Float64Array(this.K)];
    this.g = new Float64Array(2); this.gT = new Float64Array(2); this.p = new Float64Array(2); this.pT = new Float64Array(2); this.la = new Float64Array(2); this.laT = new Float64Array(2);
    this.s1 = new Float64Array(2); this.s2 = new Float64Array(2); this.ph = new Float64Array([0, 0.41]); this.hpS = new Float64Array(2); this.lpS = new Float64Array(2);
    this.w = 0; this.cl = 1 - Math.exp(-TWO_PI * 180 / sr); this.last = ''; this.sm = { diff: P.diff, mod: P.mod, early: P.early }; this.fz = P.freeze ? 0 : 1;
    this.retune(P, true);
  }
  retune(P, snap) {
    const sr = sampleRate, scale = 0.6 + 1.1 * P.size, key = [P.size, P.decay, P.dampHi, P.dampLo, P.freeze].join(); if (key === this.last && !snap) return; this.last = key;
    for (let i = 0; i < 2; i++) {
      this.tgt[i] = this.c.springs[i] * 0.001 * sr * scale; if (snap) this.len[i] = this.tgt[i];
      const co = lineCoefs(this.tgt[i] / sr, P.decay, P.dampHi * this.c.hi, P.dampLo, P.freeze);
      this.gT[i] = co[0]; this.pT[i] = co[1]; this.laT[i] = co[2]; if (snap) { this.g[i] = co[0]; this.p[i] = co[1]; this.la[i] = co[2]; }
    }
  }
  reset() { for (let i = 0; i < 2; i++) { this.bufs[i].fill(0); this.z[i].fill(0); this.ze[i].fill(0); this.s1[i] = this.s2[i] = this.hpS[i] = this.lpS[i] = 0; } }
  revive(P) { this.reset(); this.fz = P.freeze ? 0 : 1; this.sm = { diff: P.diff, mod: P.mod, early: P.early }; this.retune(P, true); }
  process(inL, inR, oL, oR, N, P) {
    const sr = sampleRate, S = this.sm, K = this.K; this.retune(P, false);
    for (let i = 0; i < 2; i++) { this.g[i] += (this.gT[i] - this.g[i]) * 0.3; this.p[i] += (this.pT[i] - this.p[i]) * 0.3; this.la[i] += (this.laT[i] - this.la[i]) * 0.3; }
    S.diff += (P.diff - S.diff) * 0.3; S.mod += (P.mod - S.mod) * 0.3; S.early += (P.early - S.early) * 0.3;
    const fz0 = this.fz, fz1 = P.freeze ? 0 : 1; this.fz = fz1;
    const a = 0.3 + 0.42 * S.diff, md = S.mod * 0.0005 * sr, early = S.early, hpk = 1 - Math.exp(-TWO_PI * 90 / sr), lpk = 1 - Math.exp(-TWO_PI * 5200 / sr);
    const bufs = this.bufs, masks = this.masks, len = this.len, tgt = this.tgt, g = this.g, p = this.p, la = this.la, s1 = this.s1, s2 = this.s2, z = this.z, ze = this.ze, ph = this.ph, cL = this.cl, hpS = this.hpS, lpS = this.lpS;
    let w = this.w; const outs = [oL, oR], ins = [inL, inR];
    const wn = WETNORM.spring * tcomp(P.decay);
    for (let n = 0; n < N; n++) {
      const fz = fz0 + (fz1 - fz0) * (n / N);
      for (let ch = 0; ch < 2; ch++) {
        // input: band limit (lo-fi) and, per spring, a dispersed copy for the first pass
        let x = ins[ch][n] * fz; hpS[ch] += hpk * (x - hpS[ch]); x -= hpS[ch]; lpS[ch] += lpk * (x - lpS[ch]); x = lpS[ch];
        let e = x; const zc = ze[ch];
        for (let k = 0; k < K; k++) { const v = a * e + zc[k]; zc[k] = e - a * v; e = v; }
        let t = tgt[ch] - len[ch]; if (t > 0.1) t = 0.1; else if (t < -0.1) t = -0.1; len[ch] += t;
        ph[ch] += (ch ? 0.43 : 0.31) / sr + 0.0; if (ph[ch] >= 1) ph[ch] -= 1;
        let y = herm(bufs[ch], masks[ch], w - (len[ch] + md * Math.sin(TWO_PI * ph[ch])));
        const zz = z[ch];
        for (let k = 0; k < K; k++) { const v = a * y + zz[k]; zz[k] = y - a * v; y = v; }
        const late = y;
        s2[ch] += cL * (y - s2[ch]);
        s1[ch] = (1 - p[ch]) * (y + la[ch] * s2[ch]) + p[ch] * s1[ch];
        let l = g[ch] * s1[ch]; l = l / (1 + 0.5 * l * l);
        bufs[ch][w & masks[ch]] = x * 0.5 + l;
        outs[ch][n] = (late * (1 - early) * 0.9 + e * early * 0.9) * wn;
      }
      w = (w + 1) & 4194303;
    }
    this.w = w;
  }
}

class Reverb extends AudioWorkletProcessor {
  constructor(options) {
    super(); const o = (options && options.processorOptions) || {};
    this.T = { ...P0 }; this.C = { ...P0 }; this.apply(o.params || {}, true);
    this.hp = [new BQ(), new BQ()]; this.lp = [new BQ(), new BQ()]; this.pool = {}; for (const m of MODELS) this.pool[m] = m === 'spring' ? new Spring(m, this.C) : new FDN(m, this.C); this.eng = this.pool[this.C.model]; this.old = null; this.xf = 0; this.xfN = 1; this.n = 0; this.bs = 0;
    this.env = 0; this.duckG = 1; this.mixC = this.T.mix; this.bad = 0;
    this.port.onmessage = e => { const m = e.data || {}; if (m.type === 'set') this.apply(m.p || {}, false); };
  }
  apply(o, snap) {
    for (const k in o) {
      if (k === 'model') { if (MODELS.includes(o.model)) this.T.model = o.model; continue; }
      if (k === 'freeze') { if (typeof o.freeze === 'boolean') this.T.freeze = o.freeze; continue; }
      const r = RNG[k]; if (!r) continue; const v = o[k];
      if (typeof v === 'number' && Number.isFinite(v)) this.T[k] = v < r[0] ? r[0] : v > r[1] ? r[1] : v;
    }
    if (snap) this.C = { ...this.T };
  }
  get(model) { return this.pool[model]; }
  alloc(N) { this.bs = N; this.xl = new Float32Array(N); this.xr = new Float32Array(N); this.fl = new Float32Array(N); this.fr = new Float32Array(N); this.wl = new Float32Array(N); this.wr = new Float32Array(N); this.ol = new Float32Array(N); this.or = new Float32Array(N); this.vl = new Float32Array(N); this.vr = new Float32Array(N); }
  process(inputs, outputs) {
    const out = outputs[0], oL = out[0], oR = out[1] || out[0], N = oL.length, I = inputs[0];
    if (N !== this.bs) this.alloc(N);
    const iL = I && I[0] ? I[0] : null, iR = I && I[1] ? I[1] : iL, xl = this.xl, xr = this.xr;
    let pk = 0;
    for (let n = 0; n < N; n++) { const a = iL ? cl(iL[n]) : 0, b = iR ? cl(iR[n]) : a; xl[n] = a; xr[n] = b; const m = (a < 0 ? -a : a) > (b < 0 ? -b : b) ? (a < 0 ? -a : a) : (b < 0 ? -b : b); if (m > pk) pk = m; }
    const T = this.T, C = this.C;
    for (const k in RNG) C[k] += (T[k] - C[k]) * 0.3;
    C.model = T.model; C.freeze = T.freeze; C.pd = T.pd;
    if (this.eng.model !== C.model) { const nx = this.pool[C.model]; if (nx === this.old) this.old = null; nx.revive(C); this.old = this.eng; this.eng = nx; this.xf = 0; this.xfN = Math.round(0.08 * sampleRate); }
    // input filters
    let fl = xl, fr = xr;
    if (C.hp > 20.5 || C.lp < 19990) {
      if (C.hp > 20.5) { for (let c = 0; c < 2; c++) this.hp[c].set('hp', C.hp); this.hp[0].run(fl, this.fl, N); this.hp[1].run(fr, this.fr, N); fl = this.fl; fr = this.fr; }
      if (C.lp < 19990) { for (let c = 0; c < 2; c++) this.lp[c].set('lp', C.lp); this.lp[0].run(fl, this.ol, N); this.lp[1].run(fr, this.or, N); fl = this.ol; fr = this.or; }
    }
    const wl = this.wl, wr = this.wr;
    this.eng.process(fl, fr, wl, wr, N, C);
    if (this.old) {
      const ol = this.vl, orr = this.vr;
      this.old.process(fl, fr, ol, orr, N, C);
      for (let n = 0; n < N; n++) { const t = Math.min(1, (this.xf + n) / this.xfN), a = Math.cos(t * Math.PI / 2), b = Math.sin(t * Math.PI / 2); wl[n] = wl[n] * b + ol[n] * a; wr[n] = wr[n] * b + orr[n] * a; }
      this.xf += N; if (this.xf >= this.xfN) this.old = null;
    }
    // bewaker: een niet-eindige of absurde uitgang wist de motor
    let bad = false;
    for (let n = 0; n < N; n++) { const a = wl[n], b = wr[n]; if (!(a > -64 && a < 64 && b > -64 && b < 64)) { bad = true; break; } }
    if (bad) { this.eng.reset(); if (this.old) this.old.reset(); wl.fill(0); wr.fill(0); this.bad++; }
    // ducking, breedte, mix
    const sr = sampleRate, ka = Math.exp(-N / (0.01 * sr)), kr = Math.exp(-N / (0.3 * sr));
    this.env = pk > this.env ? pk + (this.env - pk) * ka : pk + (this.env - pk) * kr;
    const db = 20 * Math.log10(this.env + 1e-9), xd = Math.min(1, Math.max(0, (db + 36) / 24)), dg = 1 - C.duck * xd;
    const dg0 = this.duckG; this.duckG = dg;
    const mix0 = this.mixC, mix1 = C.mix; this.mixC = mix1;
    const wd = C.width;
    for (let n = 0; n < N; n++) {
      const t = n / N, mx = (mix0 + (mix1 - mix0) * t) * Math.PI / 2, dry = Math.cos(mx), wet = Math.sin(mx) * (dg0 + (dg - dg0) * t);
      const m = (wl[n] + wr[n]) * 0.5, s = (wl[n] - wr[n]) * 0.5 * wd;
      oL[n] = xl[n] * dry + (m + s) * wet; if (out[1]) oR[n] = xr[n] * dry + (m - s) * wet;
    }
    if (!(this.env >= 0 && this.env < 1e6)) this.env = 0;
    for (const f of this.hp.concat(this.lp)) if (!(Math.abs(f.y1) < 1e6 && Math.abs(f.y2) < 1e6)) f.reset();
    return true;
  }
}
registerProcessor('${WNAME}', Reverb);`;

export default {
  id: 'nl.patchkamer.reverb', name: 'Reverb', version: '1.0.0', category: 'effect', kind: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ui: { width: 340, minWidth: 300 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', T = nl ? TXT.nl : TXT.en, NI = nl ? 1 : 2;
    const input = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain();
    input.connect(bypass).connect(out);
    const state = { ...DEF }, defaults = { ...DEF }, mod = {}; let dead = false, node = null, ui = {}, note = null, stepDur = 0.125;
    const bpm = +(host && host.bpm); if (Number.isFinite(bpm) && bpm > 0) stepDur = 60 / bpm / 4;
    const E = k => { const m = MODP.find(x => x[0] === k), b = state[k], o = mod[k] || 0; if (!o) return b; return m[5] ? clamp(b * Math.pow(m[4] / m[3], o), m[3], m[4]) : clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    const divSteps = () => (DIVS.find(d => d[0] === state.div) || DIVS[1])[1];
    const pdSeconds = () => state.sync ? clamp(stepDur * divSteps(), 0, 0.5) : E('predelay') / 1000;
    const snapshot = () => ({ model: state.model, size: E('size'), decay: E('decay'), pd: pdSeconds(), dampHi: E('dampHi'), dampLo: E('dampLo'), diff: E('diff'), mod: E('mod'), early: E('early'), hp: E('hp'), lp: E('lp'), width: E('width'), duck: E('duck'), freeze: state.freeze, mix: E('mix') });
    const apply = () => { if (node) node.port.postMessage({ type: 'set', p: snapshot() }); };
    if (host && typeof host.loadWorklet === 'function') host.loadWorklet(WNAME, WORKLET).then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('no worklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit', processorOptions: { params: snapshot() } });
      input.connect(node); input.disconnect(bypass); node.connect(out); if (note) note.textContent = '';
    }).catch(() => { if (note && !dead) note.textContent = T.noworklet; });
    else setTimeout(() => { if (note && !dead) note.textContent = T.noworklet; }, 0);
    const knob = (el, k, fmt, step) => { const m = MODP.find(x => x[0] === k); return host.ui.knob(el, m[NI], [m[3], m[4], step], state[k], fmt, v => { state[k] = v; apply(); }, { default: defaults[k], id: k, group: m[9], scale: m[5] ? 'log' : undefined }); };
    const pct = v => Math.round(v * 100) + '%', hz = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' kHz' : Math.round(v) + ' Hz';
    return {
      inputs: { in: input }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        ui.model = host.ui.select(el, T.model, MODELS.map(m => [m, T[m]]), state.model, v => { if (MODELS.includes(v)) { state.model = v; apply(); } }, { id: 'model', group: 'space' });
        ui.size = knob(el, 'size', pct, 0.01);
        ui.decay = knob(el, 'decay', v => v < 10 ? v.toFixed(2) + ' s' : v.toFixed(1) + ' s', 0.05);
        ui.sync = host.ui.select(el, T.pdmode, [['free', T.free], ['sync', T.sync]], state.sync ? 'sync' : 'free', v => { state.sync = v === 'sync'; apply(); }, { id: 'sync', group: 'space' });
        ui.predelay = knob(el, 'predelay', v => Math.round(v) + ' ms', 1);
        ui.div = host.ui.select(el, T.div, DIVS.map(d => [d[0], '1/' + d[0]]), state.div, v => { if (DIVS.some(d => d[0] === v)) { state.div = v; apply(); } }, { id: 'div', group: 'space' });
        ui.dampHi = knob(el, 'dampHi', hz, 50);
        ui.dampLo = knob(el, 'dampLo', v => '×' + v.toFixed(2), 0.01);
        ui.diff = knob(el, 'diff', pct, 0.01);
        ui.mod = knob(el, 'mod', pct, 0.01);
        ui.early = knob(el, 'early', pct, 0.01);
        ui.hp = knob(el, 'hp', hz, 5);
        ui.lp = knob(el, 'lp', hz, 50);
        ui.width = knob(el, 'width', pct, 0.01);
        ui.duck = knob(el, 'duck', pct, 0.01);
        ui.freeze = host.ui.select(el, T.freeze, [['off', T.off], ['on', T.on]], state.freeze ? 'on' : 'off', v => { state.freeze = v === 'on'; apply(); }, { id: 'freeze', group: 'output' });
        ui.mix = knob(el, 'mix', pct, 0.01);
        note = document.createElement('div'); note.style.cssText = 'font-size:11px;color:var(--muted,#97a1ad);margin-top:4px'; el.appendChild(note);
        if (!node && typeof AudioWorkletNode === 'undefined') note.textContent = T.noworklet;
      },
      onStep(info) { if (!info) return; const sd = info.stepDur; if (!Number.isFinite(sd) || sd <= 0) return; if (Math.abs(sd - stepDur) > 1e-5) { stepDur = sd; if (state.sync) apply(); } },
      params() { return MODP.map(m => ({ id: m[0], name: m[NI], lane: m[9], laneName: T['lane' + m[9][0].toUpperCase() + m[9].slice(1)], min: m[3], max: m[4], role: m[6], scale: m[5] ? 'log' : 'lin', drift: m[7], on: m[8] })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODP.some(x => x[0] === k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...state }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        for (const k of Object.keys(defaults)) {
          const d = defaults[k], v = s[k];
          if (k === 'model') state.model = MODELS.includes(v) ? v : d;
          else if (k === 'div') state.div = DIVS.some(x => x[0] === v) ? v : d;
          else if (k === 'sync' || k === 'freeze') state[k] = typeof v === 'boolean' ? v : d;
          else { const m = MODP.find(p => p[0] === k); state[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, m[3], m[4]) : d; }
        }
        apply();
        if (ui.model) {
          ui.model.value = state.model; ui.sync.value = state.sync ? 'sync' : 'free'; ui.div.value = state.div; ui.freeze.value = state.freeze ? 'on' : 'off';
          for (const k of Object.keys(ui)) if (!['model', 'sync', 'div', 'freeze'].includes(k)) ui[k].set(state[k]);
        }
      },
      destroy() { if (dead) return; dead = true; [input, out, bypass, node].forEach(n => { try { if (n) n.disconnect(); } catch { } }); }
    };
  }
};
