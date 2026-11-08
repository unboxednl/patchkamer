// SPDX-License-Identifier: AGPL-3.0-or-later
// Meet de Compressor offline: drempelnauwkeurigheid, ratio, knee, attack/release, lookahead-latency, stabiliteit en rekenlast.
// Gebruik, vanuit de root van de repo:  node docs/tools/measure-compressor.mjs
import { loadEngine, SR, BLOCK, db, lin, sine, rmsOf, peakOf, seeded } from './dynamics-harness.mjs';
const make = loadEngine('devices/effects/Compressor/compressor.patchkamer-device.js');
const base = { thr: -20, ratio: 4, knee: 0, att: 10, rel: 100, auto: false, makeup: 0, autoMk: false, detect: 'rms', look: 0, hpf: 20, lpf: 20000, sc: 'int', mix: 1, link: 1, chmode: 'stereo', on: true };
const f = (x, n = 2) => (x >= 0 && x !== Infinity ? '' : '') + x.toFixed(n);
const n1 = 2 * SR; // 2 s sinus
function steady(cfg, inDb, freq = 1000) { const e = make({ ...base, ...cfg }); const x = sine(freq, lin(inDb) * Math.SQRT2, n1); const y = e.run(x, x).l; return db(rmsOf(y, n1 - 9600, n1)) - db(rmsOf(x, n1 - 9600, n1)); }
console.log('== Drempel en ratio (RMS-detectie, 1 kHz sinus, knee 0, drempel -20 dB, ratio 4:1): gewenste en gemeten reductie');
for (const inDb of [-40, -30, -21, -20, -19, -10, 0]) { const want = inDb > -20 ? (inDb + 20) * (1 - 1 / 4) : 0; console.log(`  ingang ${inDb} dB  gemeten reductie ${f(-steady({}, inDb))} dB  verwacht ${f(want)} dB`); }
console.log('== Ratio-verhouding bij ingang 0 dB, drempel -20 dB (verwacht uit = -20 + 20/R)');
for (const R of [1, 2, 4, 8, 20, 100]) { const y = steady({ ratio: R }, 0); const outDb = 0 + y; const wantOut = R >= 99.5 ? -20 : -20 + 20 / R; console.log(`  ratio ${R >= 99.5 ? 'oneindig' : R + ':1'}  uitgang ${f(outDb)} dB  verwacht ${f(wantOut)} dB`); }
console.log('== Knee (drempel -20 dB, ratio 4:1, knee 12 dB): reductie rond de drempel; verwacht (1-1/R)(x-T+W/2)^2/(2W) in de knee');
for (const inDb of [-28, -26, -20, -14, -10]) { const T = -20, W = 12, o = inDb - T; const want = 2 * o < -W ? 0 : 2 * Math.abs(o) <= W ? (1 - 0.25) * (o + W / 2) ** 2 / (2 * W) : o * 0.75; console.log(`  ingang ${inDb} dB  gemeten ${f(-steady({ knee: 12 }, inDb))} dB  verwacht ${f(want)} dB`); }
console.log('== Peak- tegenover RMS-detectie (sinus met piek 0 dBFS)');
{ console.log(`  peak ${f(-steady({ detect: 'peak', thr: -20 }, -3.01))} dB reductie, rms ${f(-steady({ detect: 'rms', thr: -20 }, -3.01))} dB reductie (peak ziet de top van elke periode en reageert dus op een hoger niveau)`); }
// attack en release: stap van -40 naar -10 dB met een blokgolf (constant |x|, dus een zuivere stap in de detector), reductie-envelop in dB
const sq = (f, amp, n) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = (Math.floor(i * 2 * f / SR) % 2 ? -1 : 1) * amp; return a; };
function stepResponse(cfg, loDb = -40, hiDb = -10, tHi = 0.5, tDown = 2.5, tTotal = 7) { const e = make({ ...base, detect: 'peak', ...cfg }); const n = Math.round(tTotal * SR), i0 = Math.round(tHi * SR), i1 = Math.round(tDown * SR);
  const s1 = sq(500, lin(loDb), n), s2 = sq(500, lin(hiDb), n), x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = i < i0 ? s1[i] : (i < i1 ? s2[i] : s1[i]);
  const y = e.run(x, x).l; const gr = []; for (let i = 0; i + 96 <= n; i += 96) gr.push(-(db(peakOf(y, i, i + 96)) - db(peakOf(x, i, i + 96)))); return { gr, i0, i1 }; }
function timeTo(gr, start, frac, target, from) { for (let k = Math.floor(start / 96); k < gr.length; k++) { const v = gr[k]; if (target > from ? v >= from + frac * (target - from) : v <= from + frac * (target - from)) return (k * 96 - start) / SR * 1000; } return NaN; }
console.log('== Attack/release (peak, stap -40 -> -10 dB met blokgolf, drempel -20, ratio 4:1, knee 0; tijdconstanten van de reductie in dB; verwachte reductie 7,5 dB)');
for (const [att, rel] of [[2, 50], [10, 100], [30, 300], [50, 1000]]) { const { gr, i0, i1 } = stepResponse({ att, rel }); const finalGr = gr[Math.floor((i1 - 200) / 96)];
  const t63 = timeTo(gr, i0, 0.632, finalGr, 0), t10 = timeTo(gr, i0, 0.1, finalGr, 0), t90 = timeTo(gr, i0, 0.9, finalGr, 0);
  const r63 = timeTo(gr, i1, 0.632, 0, finalGr), r90 = timeTo(gr, i1, 0.9, 0, finalGr);
  console.log(`  attack ${att} ms: 63% na ${f(t63, 1)} ms (10%: ${f(t10, 1)} ms, 90%: ${f(t90, 1)} ms), reductie ${f(finalGr)} dB | release ${rel} ms: 63% hersteld na ${f(r63, 1)} ms, 90% na ${f(r90, 1)} ms`); }
{ const { gr, i1 } = stepResponse({ att: 5, rel: 100, auto: true }); const g0 = gr[Math.floor((i1 - 200) / 96)]; const at = ms => gr[Math.floor((i1 + ms * 48) / 96)];
  console.log(`  auto-release: reductie ${f(g0)} dB; na 30 ms ${f(at(30))}, 100 ms ${f(at(100))}, 400 ms ${f(at(400))}, 1000 ms ${f(at(1000))} dB (herstel in twee fasen: 30 ms en 400 ms)`); }
console.log('== Lookahead: latency en piek voor/na (impuls-sinusburst van -40 naar 0 dB, attack 1 ms)');
for (const look of [0, 2, 5, 10]) { const e = make({ ...base, detect: 'peak', thr: -30, ratio: 20, att: 1, rel: 100, look }); const n = SR; const x = new Float32Array(n); const b = sine(1000, 1, n); for (let i = 0; i < n; i++) x[i] = i < 24000 ? 0.01 * b[i] : b[i];
  const y = e.run(x, x).l; let first = -1; for (let i = 0; i < n; i++) if (Math.abs(y[i]) > 0.5 * 0.01 * 0 + 0.0) { first = i; break; } // eerste niet-nul sample
  // latency uit een impuls
  const imp = new Float32Array(n); imp[1000] = 0.01; const e2 = make({ ...base, thr: -10, ratio: 1, look }); const yi = e2.run(imp, imp).l; let pk = 0; for (let i = 0; i < n; i++) if (Math.abs(yi[i]) > Math.abs(yi[pk])) pk = i;
  // piek binnen de eerste 5 ms na de aanzet van de burst, uitgedrukt in dB tegen de ingangspiek (1.0)
  const pAfter = peakOf(y, 24000 + Math.round(look * 48), 24000 + Math.round(look * 48) + 240);
  console.log(`  lookahead ${look} ms: gemeten latency ${(pk - 1000) / SR * 1000} ms; eerste 5 ms van de burst: piek ${f(db(pAfter))} dBFS (zonder lookahead breekt de piek door de attack heen)`); }
console.log('== Make-up, auto make-up en mix');
console.log(`  make-up +6 dB: ${f(steady({ makeup: 6, thr: 0 }, -20) + 20 * 0 + 0)} dB (verwacht +6; sinus -20 dB)`);
{ const T = -30, R = 4; const w = (-12 - T) * (1 - 1 / R); console.log(`  auto make-up (drempel ${T}, ratio ${R}:1): ${f(steady({ thr: T, ratio: R, autoMk: true }, -40))} dB bij -40 dB ingang (onder de drempel: gelijk aan de make-up ${f(w)} dB)`); }
console.log(`  mix 50% bij 30 dB reductie: ${f(steady({ thr: -40, ratio: 100, mix: 0.5 }, -10))} dB (verwacht ongeveer ${f(db((1 + lin(-30)) / 2) - 0)})`);
console.log('== Sidechain-filter: 60 Hz-bas met 3 kHz-sinus; hoogdoorlaat 150 Hz op de detector, reductie op de bas');
{ const n = SR; const bas = sine(60, lin(-6), n); const mid = sine(3000, lin(-26), n); const mixd = new Float32Array(n); for (let i = 0; i < n; i++) mixd[i] = bas[i] + mid[i];
  for (const hpf of [20, 150, 400]) { const e = make({ ...base, thr: -20, ratio: 8, hpf }); const y = e.run(mixd, mixd).l; console.log(`  hpf ${hpf} Hz: uitgang ${f(db(rmsOf(y, n - 9600, n)) - db(rmsOf(mixd, n - 9600, n)))} dB`); } }
console.log('== Mid/Side en link: links luid, rechts stil');
{ const n = SR; const L = sine(1000, lin(-6), n), R = sine(1000, lin(-40), n); for (const link of [1, 0]) { const e = make({ ...base, thr: -20, ratio: 8, link, detect: 'rms' }); const y = e.run(L, R); console.log(`  link ${link * 100}%: rechts ${f(db(rmsOf(y.r, n - 9600, n)) - db(rmsOf(R, n - 9600, n)))} dB, links ${f(db(rmsOf(y.l, n - 9600, n)) - db(rmsOf(L, n - 9600, n)))} dB`); }
  const M = sine(1000, lin(-6), n); const ms = make({ ...base, thr: -20, ratio: 8, chmode: 'ms', link: 0 }); const y = ms.run(M, M); console.log(`  mid/side, alleen mid (L=R), link 0%: ${f(db(rmsOf(y.l, n - 9600, n)) - db(rmsOf(M, n - 9600, n)))} dB`);
  const S1 = sine(1000, lin(-6), n), S2 = S1.map(v => -v); const ms2 = make({ ...base, thr: -20, ratio: 8, chmode: 'ms', link: 0 }); const y2 = ms2.run(S1, S2); console.log(`  mid/side, alleen side (L=-R), link 0%: ${f(db(rmsOf(y2.l, n - 9600, n)) - db(rmsOf(S1, n - 9600, n)))} dB`); }
console.log('== Stabiliteit: bursts van NaN, Infinity, 1e9 en 1e30 op de ingang en op de sidechain; daarna moet het geluid gelijk zijn aan een run zonder burst');
{ const cfg = { ...base, thr: -30, ratio: 100, att: 0.05, rel: 5, look: 10, autoMk: true, hpf: 300, lpf: 2000 };
  const n = SR * 2; const x = sine(440, 0.3, n); const sc2 = sine(80, 0.5, n); const xb = x.slice(), sb = sc2.slice(); const bad = [NaN, Infinity, -Infinity, 1e9, -1e9, 1e30, -1e30]; for (let i = 20000; i < 20000 + 256; i++) { xb[i] = bad[i % bad.length]; sb[i] = bad[(i + 3) % bad.length]; }
  for (const sc of ['int', 'ext']) { const yb = make({ ...cfg, sc }).run(xb, xb, sb, sb), yc = make({ ...cfg, sc }).run(x, x, sc2, sc2); let nonfinite = 0; for (let i = 0; i < n; i++) if (!Number.isFinite(yb.l[i]) || !Number.isFinite(yb.r[i])) nonfinite++;
    console.log(`  sidechain ${sc}: niet-eindige samples ${nonfinite}; RMS in de laatste 0,5 s: met burst ${f(db(rmsOf(yb.l, n - 24000, n)))} dBFS, zonder burst ${f(db(rmsOf(yc.l, n - 24000, n)))} dBFS; maximum |y| ${peakOf(yb.l).toFixed(2)} (de burst zelf is tot +24 dB begrensd)`); } }
console.log('== Willekeurige en extreme instellingen: aantal niet-eindige samples');
{ const r = seeded(7); let bad = 0, runs = 0, maxv = 0; const pick = (a, b) => a + (b - a) * r(); const ext = (a, b) => r() < 0.4 ? (r() < 0.5 ? a : b) : pick(a, b);
  for (let k = 0; k < 120; k++) { const cfg = { thr: ext(-60, 0), ratio: ext(1, 100), knee: ext(0, 24), att: ext(0.05, 200), rel: ext(5, 2000), auto: r() < 0.5, makeup: ext(0, 24), autoMk: r() < 0.5, detect: r() < 0.5 ? 'peak' : 'rms', look: ext(0, 10), hpf: ext(20, 1000), lpf: ext(1000, 20000), mix: ext(0, 1), link: ext(0, 1), chmode: r() < 0.5 ? 'stereo' : 'ms', on: r() < 0.9 };
    const e = make(cfg); const n = 24000; const x = new Float32Array(n), y2 = new Float32Array(n); for (let i = 0; i < n; i++) { x[i] = (r() * 2 - 1) * (r() < 0.01 ? 16 : 1) * Math.sin(i * 0.01 * (1 + k)); y2[i] = (r() * 2 - 1) * 0.5; }
    // parameterwissels tijdens het draaien
    const out = []; for (let seg = 0; seg < 4; seg++) { e.set({ thr: ext(-60, 0), ratio: ext(1, 100), look: ext(0, 10), att: ext(0.05, 200), sc: r() < 0.5 ? 'int' : 'ext' }); const a = seg * 6000; const o = e.run(x.subarray(a, a + 6000), x.subarray(a, a + 6000), y2.subarray(a, a + 6000)); out.push(o.l, o.r); }
    for (const o of out) for (let i = 0; i < o.length; i++) { runs++; if (!Number.isFinite(o[i])) bad++; maxv = Math.max(maxv, Math.abs(o[i])); } }
  console.log(`  ${runs} samples, niet-eindig ${bad}, maximum |y| ${maxv.toFixed(2)}`); }
console.log('== Tikken: stap in aanzet (sinus 1 kHz, attack 10 ms, drempel -20 dB): maximale sprong tussen opeenvolgende samples, tegen de sinus zelf');
{ const e = make({ ...base, thr: -30, ratio: 4, att: 10, rel: 100, detect: 'peak' }); const n = SR; const x = sine(220, 0.8, n); const xs = x.map((v, i) => i < 24000 ? v * 0.02 : v); const y = e.run(xs, xs).l;
  let maxj = 0, maxs = 0; for (let i = 1; i < n; i++) { maxj = Math.max(maxj, Math.abs(y[i] - y[i - 1])); maxs = Math.max(maxs, Math.abs(xs[i] - xs[i - 1])); }
  let ref = 0; { const e0 = make({ ...base, ratio: 1 }); const y0 = e0.run(xs, xs).l; for (let i = 1; i < n; i++) ref = Math.max(ref, Math.abs(y0[i] - y0[i - 1])); }
  console.log(`  grootste sprong met compressie ${maxj.toFixed(4)}; zonder compressie (ratio 1) ${ref.toFixed(4)}; ingang ${maxs.toFixed(4)} (de sprong blijft binnen de golfvorm zelf)`); }
console.log('== Rekenlast (blokken van 128, budget 2,67 ms)');
for (const [label, cfg] of [['standaard', {}], ['alles aan: rms, auto, ms, filters, lookahead 10 ms', { detect: 'rms', auto: true, chmode: 'ms', hpf: 200, lpf: 8000, look: 10, autoMk: true, knee: 12, mix: 0.7, link: 0.5, sc: 'ext' }]]) {
  const e = make({ ...base, ...cfg }); const xs = new Float32Array(128), xr = new Float32Array(128); const times = []; let t = 0; for (let b = 0; b < 4000; b++) { for (let i = 0; i < 128; i++) { xs[i] = 0.5 * Math.sin((t + i) * 0.05) * Math.sin((t + i) * 0.0003); xr[i] = xs[i]; } t += 128;
    const ol = new Float32Array(128), or = new Float32Array(128); const t0 = process.hrtime.bigint(); e.p.process([[xs, xr], [xs, xr]], [[ol, or]]); times.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  const s = times.slice(500).sort((a, b) => a - b), mean = s.reduce((a, b) => a + b, 0) / s.length, bud = 128 / SR * 1000;
  console.log(`  ${label}: gemiddeld ${(mean / bud * 100).toFixed(2)}% van het budget, p99 ${(s[Math.floor(s.length * 0.99)] / bud * 100).toFixed(2)}%, maximum ${(s[s.length - 1] / bud * 100).toFixed(2)}%`); }
