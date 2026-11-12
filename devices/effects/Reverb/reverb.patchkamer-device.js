// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.2 — Lichtere processor: de acht sinussen van de modulatie per sample zijn vervangen door een rotatie die per blok exact wordt hersteld. De uitvoer wijkt hierdoor hoogstens één Float32-stap af (1,5e-8, -156 dBFS), onhoorbaar; verder ongewijzigd.
// 1.0.1 — Lichtere processor: de acht lijnen van het feedback-delay-network staan tijdens het blok als losse getallen in plaats van in arrays, links en rechts delen positie en breuk bij de pre-delay en de vroege reflecties, zonder vroege reflecties (Early 0) vallen de taps weg, de tapposities en -versterkingen staan vooraf in arrays die bij het maken al bestaan (geen nieuwe array per blok), de gelijk-vermogen mix rekent bij een stabiele mix niet meer per sample en een lijnlengte die zijn doel heeft bereikt wordt niet meer bijgesteld. Geluid, state, poorten en uiterlijk bit-identiek (zelfde uitvoer als 1.0.0 gemeten).
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

const WNAME = 'nl-patchkamer-reverb-1-0-2';
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
    this.cd = new Float64Array(8); this.sdn = new Float64Array(8); for (let i = 0; i < 8; i++) { this.cd[i] = Math.cos(TWO_PI * this.rate[i]); this.sdn[i] = Math.sin(TWO_PI * this.rate[i]); }
    this.g = new Float64Array(8); this.gT = new Float64Array(8); this.p = new Float64Array(8); this.pT = new Float64Array(8); this.la = new Float64Array(8); this.laT = new Float64Array(8);
    this.s1 = new Float64Array(8); this.s2 = new Float64Array(8); this.ys = new Float64Array(8);
    this.w = 0; this.cl = 1 - Math.exp(-TWO_PI * 250 / sr);
    this.erN = c.taps.length; this.tapS = new Float64Array(this.erN); this.tg1 = new Float64Array(this.erN); this.tg2 = new Float64Array(this.erN); for (let k = 0; k < this.erN; k++) { this.tg1[k] = c.taps[k][1]; this.tg2[k] = c.taps[k][2]; } this.pdc = P.pd * sr; this.fz = P.freeze ? 0 : 1; this.last = ''; this.sm = { diff: P.diff, mod: P.mod, early: P.early };
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
    const pdMask = this.pdN - 1, lateS = c.late * 0.001 * sr, erS = Math.pow(scale, 0.7), taps = c.taps, tapS = this.tapS, tg1 = this.tg1, tg2 = this.tg2, nt = taps.length;
    for (let k = 0; k < nt; k++) tapS[k] = taps[k][0] * 0.001 * sr * erS;
    const len = this.len, tgt = this.tgt, ph = this.ph, rate = this.rate, bufs = this.bufs, masks = this.masks, g = this.g, p = this.p, la = this.la, s1 = this.s1, s2 = this.s2, cL = this.cl;
    const pdL = this.pdL, pdR = this.pdR, apL = this.ap[0], apR = this.ap[1];
    // de acht lijnen als losse getallen in de lus (geen arrays per lijn); na de lus gaan de toestanden terug
    let len0 = len[0]; let len1 = len[1]; let len2 = len[2]; let len3 = len[3]; let len4 = len[4]; let len5 = len[5]; let len6 = len[6]; let len7 = len[7];
    let ph0 = ph[0]; let ph1 = ph[1]; let ph2 = ph[2]; let ph3 = ph[3]; let ph4 = ph[4]; let ph5 = ph[5]; let ph6 = ph[6]; let ph7 = ph[7];
    let s10 = s1[0]; let s11 = s1[1]; let s12 = s1[2]; let s13 = s1[3]; let s14 = s1[4]; let s15 = s1[5]; let s16 = s1[6]; let s17 = s1[7];
    let s20 = s2[0]; let s21 = s2[1]; let s22 = s2[2]; let s23 = s2[3]; let s24 = s2[4]; let s25 = s2[5]; let s26 = s2[6]; let s27 = s2[7];
    const tgt0 = tgt[0]; const tgt1 = tgt[1]; const tgt2 = tgt[2]; const tgt3 = tgt[3]; const tgt4 = tgt[4]; const tgt5 = tgt[5]; const tgt6 = tgt[6]; const tgt7 = tgt[7];
    const rate0 = rate[0]; const rate1 = rate[1]; const rate2 = rate[2]; const rate3 = rate[3]; const rate4 = rate[4]; const rate5 = rate[5]; const rate6 = rate[6]; const rate7 = rate[7];
    const g0 = g[0]; const g1 = g[1]; const g2 = g[2]; const g3 = g[3]; const g4 = g[4]; const g5 = g[5]; const g6 = g[6]; const g7 = g[7];
    const p0 = p[0]; const p1 = p[1]; const p2 = p[2]; const p3 = p[3]; const p4 = p[4]; const p5 = p[5]; const p6 = p[6]; const p7 = p[7];
    const la0 = la[0]; const la1 = la[1]; const la2 = la[2]; const la3 = la[3]; const la4 = la[4]; const la5 = la[5]; const la6 = la[6]; const la7 = la[7];
    const masks0 = masks[0]; const masks1 = masks[1]; const masks2 = masks[2]; const masks3 = masks[3]; const masks4 = masks[4]; const masks5 = masks[5]; const masks6 = masks[6]; const masks7 = masks[7];
    const bufs0 = bufs[0]; const bufs1 = bufs[1]; const bufs2 = bufs[2]; const bufs3 = bufs[3]; const bufs4 = bufs[4]; const bufs5 = bufs[5]; const bufs6 = bufs[6]; const bufs7 = bufs[7];
    const cd = this.cd, sd = this.sdn;
    let sn0 = Math.sin(TWO_PI * ph0), cs0 = Math.cos(TWO_PI * ph0); const cd0 = cd[0], sd0 = sd[0];
    let sn1 = Math.sin(TWO_PI * ph1), cs1 = Math.cos(TWO_PI * ph1); const cd1 = cd[1], sd1 = sd[1];
    let sn2 = Math.sin(TWO_PI * ph2), cs2 = Math.cos(TWO_PI * ph2); const cd2 = cd[2], sd2 = sd[2];
    let sn3 = Math.sin(TWO_PI * ph3), cs3 = Math.cos(TWO_PI * ph3); const cd3 = cd[3], sd3 = sd[3];
    let sn4 = Math.sin(TWO_PI * ph4), cs4 = Math.cos(TWO_PI * ph4); const cd4 = cd[4], sd4 = sd[4];
    let sn5 = Math.sin(TWO_PI * ph5), cs5 = Math.cos(TWO_PI * ph5); const cd5 = cd[5], sd5 = sd[5];
    let sn6 = Math.sin(TWO_PI * ph6), cs6 = Math.cos(TWO_PI * ph6); const cd6 = cd[6], sd6 = sd[6];
    let sn7 = Math.sin(TWO_PI * ph7), cs7 = Math.cos(TWO_PI * ph7); const cd7 = cd[7], sd7 = sd[7];
    const tpd = P.pd * sr; let w = this.w, pw = this.pdW, pdc = this.pdc;
    const fzc = fz0 === fz1, noEarly = eG === 0;
    for (let n = 0; n < N; n++) {
      const fz = fzc ? fz0 : fz0 + (fz1 - fz0) * (n / N), xl = inL[n] * fz, xr = inR[n] * fz;
      pdL[pw & pdMask] = xl; pdR[pw & pdMask] = xr;
      pdc += (tpd - pdc) * 0.002;
      // late: pre-delayed input through the diffusers (links en rechts delen positie en breuk)
      const lp = pw - pdc - lateS, li = Math.floor(lp), lf = lp - li, l0 = li & pdMask, l1 = (li + 1) & pdMask, lm = 1 - lf;
      let dl = pdL[l0] * lm + pdL[l1] * lf, dr = pdR[l0] * lm + pdR[l1] * lf;
      for (let k = 0; k < 4; k++) {
        let a = apL[k], d = a.b[a.i], v = dl - apg * d; a.b[a.i] = v; dl = d + apg * v; if (++a.i >= a.b.length) a.i = 0;
        a = apR[k]; d = a.b[a.i]; v = dr - apg * d; a.b[a.i] = v; dr = d + apg * v; if (++a.i >= a.b.length) a.i = 0;
      }
      let t0 = tgt0 - len0; if (t0 !== 0) { if (t0 > 0.1) t0 = 0.1; else if (t0 < -0.1) t0 = -0.1; len0 += t0; }
      ph0 += rate0; if (ph0 >= 1) ph0 -= 1;
      { const ns = sn0 * cd0 + cs0 * sd0; cs0 = cs0 * cd0 - sn0 * sd0; sn0 = ns; }
      const hp0 = w - (len0 + md * sn0), hi0 = Math.floor(hp0), hf0 = hp0 - hi0, m0 = masks0, b0 = bufs0;
      const u0 = b0[(hi0 - 1) & m0], v0 = b0[hi0 & m0], x0 = b0[(hi0 + 1) & m0], q0 = b0[(hi0 + 2) & m0];
      const r0 = ((((q0 - u0) * 0.5 + (v0 - x0) * 1.5) * hf0 + (u0 - 2.5 * v0 + 2 * x0 - 0.5 * q0)) * hf0 + (x0 - u0) * 0.5) * hf0 + v0;
      s20 += cL * (r0 - s20);
      s10 = (1 - p0) * (r0 + la0 * s20) + p0 * s10;
      const y0 = g0 * s10;
      let t1 = tgt1 - len1; if (t1 !== 0) { if (t1 > 0.1) t1 = 0.1; else if (t1 < -0.1) t1 = -0.1; len1 += t1; }
      ph1 += rate1; if (ph1 >= 1) ph1 -= 1;
      { const ns = sn1 * cd1 + cs1 * sd1; cs1 = cs1 * cd1 - sn1 * sd1; sn1 = ns; }
      const hp1 = w - (len1 + md * sn1), hi1 = Math.floor(hp1), hf1 = hp1 - hi1, m1 = masks1, b1 = bufs1;
      const u1 = b1[(hi1 - 1) & m1], v1 = b1[hi1 & m1], x1 = b1[(hi1 + 1) & m1], q1 = b1[(hi1 + 2) & m1];
      const r1 = ((((q1 - u1) * 0.5 + (v1 - x1) * 1.5) * hf1 + (u1 - 2.5 * v1 + 2 * x1 - 0.5 * q1)) * hf1 + (x1 - u1) * 0.5) * hf1 + v1;
      s21 += cL * (r1 - s21);
      s11 = (1 - p1) * (r1 + la1 * s21) + p1 * s11;
      const y1 = g1 * s11;
      let t2 = tgt2 - len2; if (t2 !== 0) { if (t2 > 0.1) t2 = 0.1; else if (t2 < -0.1) t2 = -0.1; len2 += t2; }
      ph2 += rate2; if (ph2 >= 1) ph2 -= 1;
      { const ns = sn2 * cd2 + cs2 * sd2; cs2 = cs2 * cd2 - sn2 * sd2; sn2 = ns; }
      const hp2 = w - (len2 + md * sn2), hi2 = Math.floor(hp2), hf2 = hp2 - hi2, m2 = masks2, b2 = bufs2;
      const u2 = b2[(hi2 - 1) & m2], v2 = b2[hi2 & m2], x2 = b2[(hi2 + 1) & m2], q2 = b2[(hi2 + 2) & m2];
      const r2 = ((((q2 - u2) * 0.5 + (v2 - x2) * 1.5) * hf2 + (u2 - 2.5 * v2 + 2 * x2 - 0.5 * q2)) * hf2 + (x2 - u2) * 0.5) * hf2 + v2;
      s22 += cL * (r2 - s22);
      s12 = (1 - p2) * (r2 + la2 * s22) + p2 * s12;
      const y2 = g2 * s12;
      let t3 = tgt3 - len3; if (t3 !== 0) { if (t3 > 0.1) t3 = 0.1; else if (t3 < -0.1) t3 = -0.1; len3 += t3; }
      ph3 += rate3; if (ph3 >= 1) ph3 -= 1;
      { const ns = sn3 * cd3 + cs3 * sd3; cs3 = cs3 * cd3 - sn3 * sd3; sn3 = ns; }
      const hp3 = w - (len3 + md * sn3), hi3 = Math.floor(hp3), hf3 = hp3 - hi3, m3 = masks3, b3 = bufs3;
      const u3 = b3[(hi3 - 1) & m3], v3 = b3[hi3 & m3], x3 = b3[(hi3 + 1) & m3], q3 = b3[(hi3 + 2) & m3];
      const r3 = ((((q3 - u3) * 0.5 + (v3 - x3) * 1.5) * hf3 + (u3 - 2.5 * v3 + 2 * x3 - 0.5 * q3)) * hf3 + (x3 - u3) * 0.5) * hf3 + v3;
      s23 += cL * (r3 - s23);
      s13 = (1 - p3) * (r3 + la3 * s23) + p3 * s13;
      const y3 = g3 * s13;
      let t4 = tgt4 - len4; if (t4 !== 0) { if (t4 > 0.1) t4 = 0.1; else if (t4 < -0.1) t4 = -0.1; len4 += t4; }
      ph4 += rate4; if (ph4 >= 1) ph4 -= 1;
      { const ns = sn4 * cd4 + cs4 * sd4; cs4 = cs4 * cd4 - sn4 * sd4; sn4 = ns; }
      const hp4 = w - (len4 + md * sn4), hi4 = Math.floor(hp4), hf4 = hp4 - hi4, m4 = masks4, b4 = bufs4;
      const u4 = b4[(hi4 - 1) & m4], v4 = b4[hi4 & m4], x4 = b4[(hi4 + 1) & m4], q4 = b4[(hi4 + 2) & m4];
      const r4 = ((((q4 - u4) * 0.5 + (v4 - x4) * 1.5) * hf4 + (u4 - 2.5 * v4 + 2 * x4 - 0.5 * q4)) * hf4 + (x4 - u4) * 0.5) * hf4 + v4;
      s24 += cL * (r4 - s24);
      s14 = (1 - p4) * (r4 + la4 * s24) + p4 * s14;
      const y4 = g4 * s14;
      let t5 = tgt5 - len5; if (t5 !== 0) { if (t5 > 0.1) t5 = 0.1; else if (t5 < -0.1) t5 = -0.1; len5 += t5; }
      ph5 += rate5; if (ph5 >= 1) ph5 -= 1;
      { const ns = sn5 * cd5 + cs5 * sd5; cs5 = cs5 * cd5 - sn5 * sd5; sn5 = ns; }
      const hp5 = w - (len5 + md * sn5), hi5 = Math.floor(hp5), hf5 = hp5 - hi5, m5 = masks5, b5 = bufs5;
      const u5 = b5[(hi5 - 1) & m5], v5 = b5[hi5 & m5], x5 = b5[(hi5 + 1) & m5], q5 = b5[(hi5 + 2) & m5];
      const r5 = ((((q5 - u5) * 0.5 + (v5 - x5) * 1.5) * hf5 + (u5 - 2.5 * v5 + 2 * x5 - 0.5 * q5)) * hf5 + (x5 - u5) * 0.5) * hf5 + v5;
      s25 += cL * (r5 - s25);
      s15 = (1 - p5) * (r5 + la5 * s25) + p5 * s15;
      const y5 = g5 * s15;
      let t6 = tgt6 - len6; if (t6 !== 0) { if (t6 > 0.1) t6 = 0.1; else if (t6 < -0.1) t6 = -0.1; len6 += t6; }
      ph6 += rate6; if (ph6 >= 1) ph6 -= 1;
      { const ns = sn6 * cd6 + cs6 * sd6; cs6 = cs6 * cd6 - sn6 * sd6; sn6 = ns; }
      const hp6 = w - (len6 + md * sn6), hi6 = Math.floor(hp6), hf6 = hp6 - hi6, m6 = masks6, b6 = bufs6;
      const u6 = b6[(hi6 - 1) & m6], v6 = b6[hi6 & m6], x6 = b6[(hi6 + 1) & m6], q6 = b6[(hi6 + 2) & m6];
      const r6 = ((((q6 - u6) * 0.5 + (v6 - x6) * 1.5) * hf6 + (u6 - 2.5 * v6 + 2 * x6 - 0.5 * q6)) * hf6 + (x6 - u6) * 0.5) * hf6 + v6;
      s26 += cL * (r6 - s26);
      s16 = (1 - p6) * (r6 + la6 * s26) + p6 * s16;
      const y6 = g6 * s16;
      let t7 = tgt7 - len7; if (t7 !== 0) { if (t7 > 0.1) t7 = 0.1; else if (t7 < -0.1) t7 = -0.1; len7 += t7; }
      ph7 += rate7; if (ph7 >= 1) ph7 -= 1;
      { const ns = sn7 * cd7 + cs7 * sd7; cs7 = cs7 * cd7 - sn7 * sd7; sn7 = ns; }
      const hp7 = w - (len7 + md * sn7), hi7 = Math.floor(hp7), hf7 = hp7 - hi7, m7 = masks7, b7 = bufs7;
      const u7 = b7[(hi7 - 1) & m7], v7 = b7[hi7 & m7], x7 = b7[(hi7 + 1) & m7], q7 = b7[(hi7 + 2) & m7];
      const r7 = ((((q7 - u7) * 0.5 + (v7 - x7) * 1.5) * hf7 + (u7 - 2.5 * v7 + 2 * x7 - 0.5 * q7)) * hf7 + (x7 - u7) * 0.5) * hf7 + v7;
      s27 += cL * (r7 - s27);
      s17 = (1 - p7) * (r7 + la7 * s27) + p7 * s17;
      const y7 = g7 * s17;
      const sum = 0 + y0 + y1 + y2 + y3 + y4 + y5 + y6 + y7;
      const h = sum * 0.25;
      b0[w & m0] = y0 - h + (dl * 0.8 + dr * 0.4) * 1 * 0.35;
      b1[w & m1] = y1 - h + (dr * 0.8 + dl * 0.4) * 1 * 0.35;
      b2[w & m2] = y2 - h + (dl * 0.8 + dr * 0.4) * -1 * 0.35;
      b3[w & m3] = y3 - h + (dr * 0.8 + dl * 0.4) * -1 * 0.35;
      b4[w & m4] = y4 - h + (dl * 0.8 + dr * 0.4) * 1 * 0.35;
      b5[w & m5] = y5 - h + (dr * 0.8 + dl * 0.4) * 1 * 0.35;
      b6[w & m6] = y6 - h + (dl * 0.8 + dr * 0.4) * -1 * 0.35;
      b7[w & m7] = y7 - h + (dr * 0.8 + dl * 0.4) * -1 * 0.35;
      // output: two orthogonal Hadamard rows
      const lt = (y0 - y1 + y2 - y3 + y4 - y5 + y6 - y7) * 0.3536, rt = (y0 + y1 - y2 - y3 + y4 + y5 - y6 - y7) * 0.3536;
      // early reflections (zonder vroege reflecties, eG = 0, vallen de taps weg)
      let el = 0, er = 0;
      if (!noEarly) for (let k = 0; k < nt; k++) {
        const pos = pw - pdc - tapS[k], ti = Math.floor(pos), tf = pos - ti, t0 = ti & pdMask, t1 = (ti + 1) & pdMask, tm = 1 - tf;
        const vl = pdL[t0] * tm + pdL[t1] * tf, vr = pdR[t0] * tm + pdR[t1] * tf;
        if (k & 1) { el += vr * tg1[k]; er += vl * tg2[k]; } else { el += vl * tg1[k]; er += vr * tg2[k]; }
      }
      oL[n] = lt * lG + el * eG * 0.6; oR[n] = rt * lG + er * eG * 0.6;
      w = (w + 1) & 4194303; pw = (pw + 1) & 4194303;
    }
    len[0] = len0; len[1] = len1; len[2] = len2; len[3] = len3; len[4] = len4; len[5] = len5; len[6] = len6; len[7] = len7;
    ph[0] = ph0; ph[1] = ph1; ph[2] = ph2; ph[3] = ph3; ph[4] = ph4; ph[5] = ph5; ph[6] = ph6; ph[7] = ph7;
    s1[0] = s10; s1[1] = s11; s1[2] = s12; s1[3] = s13; s1[4] = s14; s1[5] = s15; s1[6] = s16; s1[7] = s17;
    s2[0] = s20; s2[1] = s21; s2[2] = s22; s2[3] = s23; s2[4] = s24; s2[5] = s25; s2[6] = s26; s2[7] = s27;
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
    const steady = mix0 === mix1 && dg0 === dg, mx0 = mix0 * Math.PI / 2, dry0 = Math.cos(mx0), wet0 = Math.sin(mx0) * dg0, st = out[1];
    for (let n = 0; n < N; n++) {
      let dry, wet;
      if (steady) { dry = dry0; wet = wet0; } else { const t = n / N, mx = (mix0 + (mix1 - mix0) * t) * Math.PI / 2; dry = Math.cos(mx); wet = Math.sin(mx) * (dg0 + (dg - dg0) * t); }
      const m = (wl[n] + wr[n]) * 0.5, s = (wl[n] - wr[n]) * 0.5 * wd;
      oL[n] = xl[n] * dry + (m + s) * wet; if (st) oR[n] = xr[n] * dry + (m - s) * wet;
    }
    if (!(this.env >= 0 && this.env < 1e6)) this.env = 0;
    for (const f of this.hp.concat(this.lp)) if (!(Math.abs(f.y1) < 1e6 && Math.abs(f.y2) < 1e6)) f.reset();
    return true;
  }
}
registerProcessor('${WNAME}', Reverb);`;

export default {
  id: 'nl.patchkamer.reverb', name: 'Reverb', version: '1.0.2', category: 'effect', kind: 'effect',
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
