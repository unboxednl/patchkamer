// SPDX-License-Identifier: AGPL-3.0-or-later
// Meet Reverb offline: RT60 per model en per band, echodichtheid, kleuring, stereo-decorrelatie, latency, rekenlast en stabiliteit.
// Gebruik, vanuit de root van de repo:  node docs/tools/measure-reverb.mjs [rt60|bands|density|stereo|latency|cpu|stable|switch]  (zonder argument: alles)
// De worklet-code wordt uit het apparaat zelf gehaald en in Node draaien; er wordt niets beluisterd.
import * as M from './dsp-measure-lib.mjs';
const { SR } = M;
const { cls } = await M.loadWorkletClass('devices/effects/Reverb/reverb.patchkamer-device.js');
const MODELS = ['hall', 'plate', 'spring', 'room', 'chamber'];
const want = new Set(process.argv.slice(2)); const on = k => !want.size || want.has(k);
const base = { decay: 2.5, mix: 1, early: 0, pd: 0, dampHi: 20000, dampLo: 1, mod: 0, diff: 0.7, size: 0.5, hp: 20, lp: 20000, width: 1, duck: 0, freeze: false };
const mk = P => new cls({ processorOptions: { params: { ...base, ...P } } });
const impulse = (P, sec) => { const N = Math.round(SR * sec); return M.run(mk(P), N, n => n === 0 ? 1 : 0); };
const f = (x, d = 2) => Number.isFinite(x) ? x.toFixed(d) : 'n/a';
const hdr = s => console.log('\n## ' + s);

if (on('rt60')) {
  hdr('RT60 (T20 uit Schroeder-integratie, band rond 1 kHz, demping uit, modulatie uit) tegenover de ingestelde decay');
  console.log('model     ' + [0.3, 1, 2.5, 6, 15].map(d => ('set ' + d + 's').padStart(10)).join(''));
  for (const m of MODELS) {
    const row = [];
    for (const d of [0.3, 1, 2.5, 6, 15]) { const r = impulse({ model: m, decay: d }, Math.min(40, d * 2.2 + 1)); row.push(f(M.decayCurve(M.bandpass(r.L, 1000)).rt20).padStart(10)); }
    console.log(m.padEnd(10) + row.join(''));
  }
  console.log('Afwijking per grootte (hall, decay 2,5 s): ' + [0, 0.25, 0.5, 0.75, 1].map(s => 'size ' + s + ' = ' + f(M.decayCurve(M.bandpass(impulse({ model: 'hall', size: s }, 6).L, 1000)).rt20) + ' s').join(', '));
}
if (on('bands')) {
  hdr('RT60 per octaafband bij decay 3 s: demping hoog 3 kHz en lage decay x0,5 / x1 / x1,5 (T20, hall)');
  const bands = [125, 250, 500, 1000, 2000, 4000, 8000];
  console.log('instelling                 ' + bands.map(b => String(b).padStart(7)).join(''));
  for (const [lab, P] of [['geen demping', { dampHi: 20000 }], ['dampHi 3000', { dampHi: 3000 }], ['dampHi 1000', { dampHi: 1000 }], ['dampHi 3000 + dampLo 0.5', { dampHi: 3000, dampLo: 0.5 }], ['dampHi 3000 + dampLo 1.5', { dampHi: 3000, dampLo: 1.5 }]]) {
    const r = impulse({ model: 'hall', decay: 3, ...P }, 7);
    console.log(lab.padEnd(27) + bands.map(b => f(M.decayCurve(M.bandpass(r.L, b)).rt20).padStart(7)).join(''));
  }
}
if (on('density')) {
  hdr('Echodichtheid en kleuring');
  console.log('NED = genormaliseerde echodichtheid (1,0 = ruisachtig diffuus). Tijd tot NED >= 0,9 en spectrale spreiding van de staart (0,3 tot 1,3 s, 200 Hz tot 8 kHz; een diffuse ruisstaart geeft ongeveer 5,6 dB).');
  const spread = (h, a, b) => { const s = Math.round(a * SR), len = Math.round((b - a) * SR); const { p, n } = M.powerSpectrum(h, s, len); const lo = Math.round(200 / SR * n), hi = Math.round(8000 / SR * n), v = []; for (let i = lo; i < hi; i++) v.push(10 * Math.log10(p[i] + 1e-30)); const mean = v.reduce((x, y) => x + y) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - mean) ** 2, 0) / v.length); };
  const ac = (h, a, b) => { const s = Math.round(a * SR), len = Math.round((b - a) * SR); let e = 0; for (let i = 0; i < len; i++) e += h[s + i] ** 2; let best = 0; for (let l = Math.round(0.002 * SR); l < Math.round(0.1 * SR); l++) { let c = 0; for (let i = 0; i < len - l; i++) c += h[s + i] * h[s + i + l]; best = Math.max(best, c / e); } return best; };
  console.log('model/instelling                 NED>=0,9   spreiding dB   max autocorr(2..100 ms)');
  for (const [lab, P] of [...MODELS.map(m => [m, { model: m, decay: 2.5, dampHi: 8000, mod: 0.4 }]), ['hall diff 0, mod 0', { model: 'hall', diff: 0, mod: 0, dampHi: 8000 }], ['hall diff 1, mod 0', { model: 'hall', diff: 1, mod: 0, dampHi: 8000 }], ['hall diff 0.7, mod 0', { model: 'hall', diff: 0.7, mod: 0, dampHi: 8000 }], ['hall diff 0.7, mod 1', { model: 'hall', diff: 0.7, mod: 1, dampHi: 8000 }], ['room diff 0, mod 0', { model: 'room', diff: 0, mod: 0, dampHi: 8000 }], ['room diff 1, mod 0', { model: 'room', diff: 1, mod: 0, dampHi: 8000 }]]) {
    const r = impulse({ decay: 2.5, ...P }, 2); const ned = M.echoDensity(r.L); let t = NaN; for (const [tt, v] of ned) if (v >= 0.9 && tt > 0.005) { t = tt; break; }
    console.log(lab.padEnd(32) + (f(t * 1000, 0) + ' ms').padStart(9) + f(spread(r.L, 0.3, 1.3)).padStart(14) + f(ac(r.L, 0.3, 1.0), 3).padStart(14));
  }
}
if (on('stereo')) {
  hdr('Stereo-decorrelatie (IACC, hoogste kruiscorrelatie binnen +-1 ms) van de staart en breedte-regeling');
  for (const m of MODELS) { const r = impulse({ model: m }, 2); console.log(m.padEnd(10) + 'late staart (0,2 tot 1,2 s): IACC ' + f(M.iacc(r.L, r.R, Math.round(0.2 * SR), SR), 3)); }
  for (const w of [0, 1, 2]) { const r = impulse({ model: 'hall', width: w }, 2); console.log('hall breedte ' + w + ': IACC ' + f(M.iacc(r.L, r.R, Math.round(0.2 * SR), SR), 3) + ', energie S/M ' + f(M.db(M.rms(r.L.map((v, i) => (v - r.R[i]) / 2)) / M.rms(r.L.map((v, i) => (v + r.R[i]) / 2))), 1) + ' dB'); }
}
if (on('latency')) {
  hdr('Latency en pre-delay');
  const d = impulse({ model: 'hall', mix: 0 }, 0.05); let first = -1; for (let i = 0; i < d.L.length; i++) if (Math.abs(d.L[i]) > 1e-6) { first = i; break; }
  console.log('droog pad (mix 0): eerste uitgangssample op index ' + first + ' (latency ' + first + ' samples)');
  for (const m of MODELS) for (const pd of [0, 0.05, 0.1]) { const r = impulse({ model: m, pd, early: 1 }, 0.5); let o = -1; for (let i = 0; i < r.L.length; i++) if (Math.abs(r.L[i]) > 1e-4 || Math.abs(r.R[i]) > 1e-4) { o = i; break; } if (m === 'hall' || pd === 0) console.log(m.padEnd(8) + 'pre-delay ' + (pd * 1000) + ' ms: eerste natte sample op ' + (o / SR * 1000).toFixed(2) + ' ms'); }
}
if (on('cpu')) {
  hdr('Rekenlast: process() per blok van 128 samples, budget 2,667 ms bij 48 kHz (Node, een kern, 4000 blokken ruis)');
  const budget = 128 / SR * 1000;
  for (const [lab, P] of [...MODELS.map(m => [m, { model: m, decay: 3, mod: 0.5, early: 0.3, hp: 100, lp: 8000, duck: 0.5 }]), ['hall, switch bezig', null]]) {
    const proc = mk(P || { model: 'hall' }); const r0 = M.rng(3), t = [], il = new Float32Array(128), ir = new Float32Array(128), ol = new Float32Array(128), orr = new Float32Array(128);
    for (let b = 0; b < 4300; b++) { for (let i = 0; i < 128; i++) { il[i] = M.gauss(r0) * 0.1; ir[i] = M.gauss(r0) * 0.1; } if (!P && b % 50 === 0) M.send(proc, { model: MODELS[(b / 50) % 5 | 0] }); const a = process.hrtime.bigint(); proc.process([[il, ir]], [[ol, orr]], {}); t.push(Number(process.hrtime.bigint() - a) / 1e6); }
    const u = t.slice(300); const mean = u.reduce((x, y) => x + y) / u.length;
    console.log(lab.padEnd(22) + 'gemiddeld ' + f(mean / budget * 100, 1) + '%  p99 ' + f(M.pct(u, 0.99) / budget * 100, 1) + '%  max ' + f(Math.max(...u) / budget * 100, 1) + '% van het budget');
  }
}
if (on('stable')) {
  hdr('Stabiliteit: willekeurige en extreme instellingen, bursts van NaN, +-Infinity, 1e9 en 1e30, daarna herstel, en freeze');
  const MODP = { size: [0, 1], decay: [0.1, 30], pd: [0, 0.5], dampHi: [1000, 20000], dampLo: [0.25, 2], diff: [0, 1], mod: [0, 1], early: [0, 1], hp: [20, 1000], lp: [1000, 20000], width: [0, 2], duck: [0, 1], mix: [0, 1] };
  const r0 = M.rng(11); let bad = 0, runs = 0, maxAbs = 0;
  for (let trial = 0; trial < 60; trial++) {
    const P = { model: MODELS[trial % 5], freeze: r0() < 0.2 }; for (const k in MODP) { const [a, b] = MODP[k], u = r0(); P[k] = u < 0.3 ? a : u < 0.6 ? b : a + (b - a) * r0(); }
    const proc = mk(P), N = SR * 4, noise = M.rng(trial); const burst = [NaN, Infinity, -Infinity, 1e9, 1e30, -1e30];
    const rr = M.run(proc, N, (n, ch) => { const t = n / SR; if (t > 1 && t < 1.05) return burst[(n + ch) % burst.length]; if (t > 2 && t < 2.1) return 1e30 * (ch ? -1 : 1); return M.gauss(noise) * 0.2; }, { block: s => { if (s % (SR / 2) === 0 && trial % 3 === 0) { const q = {}; for (const k in MODP) { const [a, b] = MODP[k]; q[k] = noise() < 0.5 ? (noise() < 0.5 ? a : b) : a + (b - a) * noise(); } q.model = MODELS[(s / 64) % 5 | 0]; M.send(proc, q); } } });
    runs++; for (let i = 0; i < N; i++) { const a = Math.abs(rr.L[i]), b = Math.abs(rr.R[i]); if (!(a < 1e3 && b < 1e3)) { bad++; break; } maxAbs = Math.max(maxAbs, a, b); }
  }
  console.log(runs + ' willekeurige/extreme runs met bursts: ' + bad + ' runs met niet-eindige of absurde uitgang (>1e3), grootste |uitgang| ' + f(maxAbs, 2));
  // herstel: na de burst moet er weer galm uit komen
  for (const m of MODELS) {
    const proc = mk({ model: m, decay: 2, mix: 1 }), noise = M.rng(2);
    const rr = M.run(proc, SR * 3, (n) => n >= SR && n < SR + 2000 ? (n % 3 === 0 ? NaN : n % 3 === 1 ? Infinity : 1e30) : (n > 2 * SR ? M.gauss(noise) * 0.2 : 0));
    let nf = 0; for (let i = 0; i < rr.L.length; i++) if (!Number.isFinite(rr.L[i]) || !Number.isFinite(rr.R[i])) nf++;
    console.log(m.padEnd(8) + 'burst (NaN/Inf/1e30) bij 1 s, ruis vanaf 2 s: niet-eindige samples ' + nf + ', RMS laatste seconde ' + f(M.rms(rr.L.subarray(2 * SR)), 4));
  }
  // freeze: stoot aan, freeze aan, 60 s doorrekenen; het niveau mag niet toenemen
  for (const m of MODELS) {
    const proc = mk({ model: m, decay: 3, mix: 1, dampHi: 4000, mod: 0.5 }), noise = M.rng(9); const rr0 = M.run(proc, SR, n => n < 24000 ? M.gauss(noise) * 0.3 : 0); M.send(proc, { freeze: true });
    const lv = []; for (let s = 0; s < 6; s++) { const rr = M.run(proc, SR * 10, () => 0); lv.push(M.db(M.rms(rr.L.subarray(0, SR)) + 1e-12)); }
    console.log(m.padEnd(8) + 'freeze, niveau (dB RMS) per 10 s over 60 s: ' + lv.map(v => f(v, 1)).join(', ') + '  (eerst stilte na 1 s: ' + f(M.db(M.rms(rr0.L.subarray(SR - 2000))), 1) + ' dB bij het vastzetten)');
  }
  // zonder freeze: staart sterft uit
  const p2 = mk({ model: 'hall', decay: 30, mix: 1 }); M.run(p2, SR, n => n === 0 ? 1 : 0); const t2 = M.run(p2, SR * 60, () => 0); console.log('hall decay 30 s zonder freeze: RMS in 55 tot 60 s = ' + f(M.db(M.rms(t2.L.subarray(SR * 55))), 1) + ' dB (moet ver onder het begin liggen)');
}
if (on('switch')) {
  hdr('Wissel van model tijdens het spelen: grootste sprong tussen twee opeenvolgende samples (sinus 220 Hz, amplitude 0,5)');
  const sine = n => Math.sin(2 * Math.PI * 220 * n / SR) * 0.5; const proc = mk({ model: 'hall', mix: 0.5, decay: 2 }); let prev = 0, maxd = 0, maxRef = 0;
  const r = M.run(proc, SR * 4, sine, { block: s => { if (s > 0 && s % SR === 0) M.send(proc, { model: MODELS[(s / SR) % 5] }); } });
  for (let i = 1; i < r.L.length; i++) { const d = Math.abs(r.L[i] - r.L[i - 1]); if (i > SR / 2) maxd = Math.max(maxd, d); }
  const ref = M.run(mk({ model: 'hall', mix: 0.5, decay: 2 }), SR * 4, sine); for (let i = SR / 2; i < ref.L.length; i++) maxRef = Math.max(maxRef, Math.abs(ref.L[i] - ref.L[i - 1]));
  console.log('grootste sprong met 3 modelwissels ' + f(maxd, 4) + ', zonder wissels ' + f(maxRef, 4));
}
