// SPDX-License-Identifier: AGPL-3.0-or-later
// Meet de Gate offline: drempel en hysterese, expander-ratio, range, attack/hold/release, lookahead, ducker, stabiliteit, tikken en rekenlast.
// Gebruik, vanuit de root van de repo:  node docs/tools/measure-gate.mjs
import { loadEngine, SR, db, lin, sine, rmsOf, peakOf, seeded } from './dynamics-harness.mjs';
const make = loadEngine('devices/effects/Gate/gate.patchkamer-device.js');
const base = { mode: 'gate', thr: -40, ratio: 4, range: 60, hyst: 0, att: 1, hold: 0, rel: 100, look: 0, hpf: 20, lpf: 20000, sc: 'int', detect: 'peak', link: 1, on: true };
const f = (x, n = 2) => x.toFixed(n);
const sq = (fr, amp, n) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = (Math.floor(i * 2 * fr / SR) % 2 ? -1 : 1) * amp; return a; };
// stuksgewijs constante blokgolf: levels = [[tot_seconde, dB], ...]
function levels(list, total) { const n = Math.round(total * SR), x = new Float32Array(n); let i = 0; for (const [t, d] of list) { const e = Math.min(n, Math.round(t * SR)); for (; i < e; i++) x[i] = (Math.floor(i * 1000 / SR) % 2 ? -1 : 1) * lin(d); } return x; }
const gainDb = (x, y, i0, i1) => db(peakOf(y, i0, i1)) - db(peakOf(x, i0, i1));
console.log('== Drempel en range (gate, blokgolf, drempel -40 dB, range 60 dB): gemeten demping per ingangsniveau na 1 s');
for (const d of [-60, -45, -41, -39, -35, -20]) { const x = levels([[2, d]], 2), y = make({ ...base }).run(x, x).l; console.log(`  ingang ${d} dB: gain ${f(gainDb(x, y, SR, 2 * SR))} dB`); }
for (const rg of [0, 12, 30, 60, 90]) { const x = levels([[2, -60]], 2), y = make({ ...base, range: rg }).run(x, x).l; console.log(`  range ${rg} dB: gain bij -60 dB ingang ${f(gainDb(x, y, SR, 2 * SR))} dB`); }
console.log('== Hysterese (drempel -40, hysterese 6 dB): open bij > -40, sluit pas onder -46');
{ for (const hy of [0, 6]) { const e = make({ ...base, hyst: hy }); const x = levels([[1, -30], [2, -43], [3, -49]], 3); const y = e.run(x, x).l; console.log(`  hysterese ${hy} dB: na open op -30 dB, bij -43 dB gain ${f(gainDb(x, y, 1.5 * SR, 2 * SR))} dB, bij -49 dB gain ${f(gainDb(x, y, 2.5 * SR, 3 * SR))} dB`); } }
console.log('== Expander-ratio (drempel -40, range 90): demping per dB onder de drempel; verwacht (ratio-1) dB per dB');
for (const R of [1.5, 2, 4]) for (const d of [-44, -50]) { const x = levels([[2, d]], 2), y = make({ ...base, mode: 'expander', ratio: R, range: 90, detect: 'peak' }).run(x, x).l; console.log(`  ratio ${R}:1 ingang ${d} dB: gain ${f(gainDb(x, y, SR, 2 * SR))} dB  verwacht ${f(-(-40 - d) * (R - 1))} dB`); }
function respTrace(cfg, list, total) { const x = levels(list, total), y = make({ ...base, ...cfg }).run(x, x).l; const g = []; for (let i = 0; i + 24 <= x.length; i += 24) g.push(lin(db(peakOf(y, i, i + 24)) - db(peakOf(x, i, i + 24)))); return g; }
const t2 = (g, start, pred) => { for (let k = Math.floor(start * SR / 24); k < g.length; k++) if (pred(g[k])) return (k * 24 - start * SR) / SR * 1000; return NaN; };
console.log('== Attack (amplitude, tijdconstante): 63% van de weg van gesloten (-60 dB) naar open');
for (const att of [0.5, 2, 10, 50]) { const g = respTrace({ att, hold: 0, rel: 100 }, [[0.5, -60], [2, -20]], 2); const fin = g[Math.floor(1.9 * SR / 24)]; console.log(`  attack ${att} ms: 63% na ${f(t2(g, 0.5, v => v >= 0.001 + 0.632 * (fin - 0.001)), 1)} ms, 90% na ${f(t2(g, 0.5, v => v >= 0.001 + 0.9 * (fin - 0.001)), 1)} ms`); }
console.log('== Hold: tijd tussen het zakken van het niveau en het begin van de demping');
for (const hold of [0, 50, 200]) { const g = respTrace({ att: 1, hold, rel: 20 }, [[1, -20], [3, -60]], 3); const ms = t2(g, 1, v => v < 0.9); console.log(`  hold ${hold} ms: gain < 0,9 (-0,9 dB) na ${f(ms, 1)} ms`); }
console.log('== Release (amplitude, tijdconstante): 63% van de weg van open naar gesloten (-60 dB)');
for (const rel of [20, 100, 400]) { const g = respTrace({ att: 1, hold: 0, rel, range: 60 }, [[1, -20], [4, -80]], 4); console.log(`  release ${rel} ms: gain 37% (-8,7 dB) na ${f(t2(g, 1, v => v <= 0.368), 1)} ms; -20 dB na ${f(t2(g, 1, v => v <= 0.1), 1)} ms; -60 dB (range) na ${f(t2(g, 1, v => v <= 0.0011), 0)} ms`); }
console.log('== Lookahead: latency, en of de poort voor de aanzet open is (burst 1 kHz 0 dB na stilte; eerste 2 ms van de burst)');
for (const look of [0, 2, 5, 10]) { const n = SR, x = new Float32Array(n); const b = sine(1000, 0.7, n); for (let i = 24000; i < n; i++) x[i] = b[i]; const y = make({ ...base, att: 5, look, thr: -40 }).run(x, x).l;
  const imp = new Float32Array(n); imp[1000] = 0.5; const yi = make({ ...base, thr: -90, range: 0, look }).run(imp, imp).l; let pk = 0; for (let i = 0; i < n; i++) if (Math.abs(yi[i]) > Math.abs(yi[pk])) pk = i;
  const a0 = 24000 + Math.round(look * 48); console.log(`  lookahead ${look} ms: latency ${(pk - 1000) / SR * 1000} ms; eerste 2 ms van de burst: piek ${f(db(peakOf(y, a0, a0 + 96)))} dBFS (ingang -3,1 dBFS)`); }
console.log('== Ducker: sidechain luid -> hoofdsignaal gedempt (range 12 dB, drempel -30, ratio oneindig, externe sidechain)');
{ const n = 3 * SR, x = sine(1000, 0.5, n), sc = new Float32Array(n); const s2 = sq(200, 0.3, n); for (let i = SR; i < 2 * SR; i++) sc[i] = s2[i];
  const y = make({ ...base, mode: 'ducker', thr: -30, ratio: 100, range: 12, att: 10, rel: 100, sc: 'ext', detect: 'peak' }).run(x, x, sc, sc);
  console.log(`  sidechain stil: gain ${f(db(rmsOf(y.l, 0, 24000)) - db(rmsOf(x, 0, 24000)))} dB; sidechain luid: gain ${f(db(rmsOf(y.l, 72000, 96000)) - db(rmsOf(x, 72000, 96000)))} dB; daarna: ${f(db(rmsOf(y.l, 2.8 * SR, 3 * SR)) - db(rmsOf(x, 2.8 * SR, 3 * SR)))} dB`);
  const yn = make({ ...base, mode: 'ducker', thr: -30, ratio: 100, range: 12, sc: 'ext' }).run(x, x); console.log(`  ext zonder sidechain-signaal: gain ${f(db(rmsOf(yn.l, 24000, 48000)) - db(rmsOf(x, 24000, 48000)))} dB (geen demping)`); }
console.log('== Sidechain-filter: 80 Hz-bonk (-20 dB) naast stilte; gate drempel -30: hoogdoorlaat 20 Hz of 400 Hz');
{ const n = SR, x = sine(80, lin(-20) * Math.SQRT2, n); for (const hpf of [20, 400]) { const y = make({ ...base, thr: -30, hpf }).run(x, x).l; console.log(`  hpf ${hpf} Hz: gain ${f(gainDb(x, y, 24000, n))} dB`); } }
console.log('== Stabiliteit: bursts van NaN, Infinity, 1e9 en 1e30 op de ingang en de sidechain; daarna gelijk aan een run zonder burst');
{ const cfg = { ...base, thr: -50, hold: 20, look: 10, hpf: 300, lpf: 2000, att: 0.05, rel: 5 }; const n = SR * 2, x = sine(440, 0.3, n), s2 = sine(80, 0.5, n), xb = x.slice(), sb = s2.slice(); const bad = [NaN, Infinity, -Infinity, 1e9, -1e9, 1e30, -1e30]; for (let i = 20000; i < 20256; i++) { xb[i] = bad[i % bad.length]; sb[i] = bad[(i + 3) % bad.length]; }
  for (const sc of ['int', 'ext']) for (const mode of ['gate', 'ducker']) { const yb = make({ ...cfg, sc, mode }).run(xb, xb, sb, sb), yc = make({ ...cfg, sc, mode }).run(x, x, s2, s2); let nf = 0; for (let i = 0; i < n; i++) if (!Number.isFinite(yb.l[i]) || !Number.isFinite(yb.r[i])) nf++;
    console.log(`  ${mode}/${sc}: niet-eindige samples ${nf}; RMS laatste 0,5 s met burst ${f(db(rmsOf(yb.l, n - 24000, n)))} dBFS, zonder ${f(db(rmsOf(yc.l, n - 24000, n)))} dBFS`); } }
console.log('== Willekeurige en extreme instellingen (inclusief wissels tijdens het draaien): niet-eindige samples');
{ const r = seeded(11); let bad = 0, cnt = 0, mx = 0; const pick = (a, b) => a + (b - a) * r(), ext = (a, b) => r() < 0.4 ? (r() < 0.5 ? a : b) : pick(a, b); const modes = ['gate', 'expander', 'ducker'];
  for (let k = 0; k < 120; k++) { const e = make({ mode: modes[k % 3], thr: ext(-90, 0), ratio: ext(1, 100), range: ext(0, 90), hyst: ext(0, 24), att: ext(0.05, 100), hold: ext(0, 500), rel: ext(5, 3000), look: ext(0, 10), hpf: ext(20, 1000), lpf: ext(1000, 20000), link: ext(0, 1), detect: r() < 0.5 ? 'peak' : 'rms', on: r() < 0.9 });
    const n = 24000, x = new Float32Array(n), s2 = new Float32Array(n); for (let i = 0; i < n; i++) { x[i] = (r() * 2 - 1) * (r() < 0.01 ? 16 : 1) * Math.sin(i * 0.01 * (1 + k)); s2[i] = (r() * 2 - 1) * 0.5; }
    for (let seg = 0; seg < 4; seg++) { e.set({ thr: ext(-90, 0), range: ext(0, 90), look: ext(0, 10), att: ext(0.05, 100), sc: r() < 0.5 ? 'int' : 'ext', mode: modes[(k + seg) % 3] }); const a = seg * 6000; const o = e.run(x.subarray(a, a + 6000), x.subarray(a, a + 6000), s2.subarray(a, a + 6000)); for (const ch of [o.l, o.r]) for (let i = 0; i < ch.length; i++) { cnt++; if (!Number.isFinite(ch[i])) bad++; mx = Math.max(mx, Math.abs(ch[i])); } } }
  console.log(`  ${cnt} samples, niet-eindig ${bad}, maximum |y| ${mx.toFixed(2)}`); }
console.log('== Tikken: gate open/dicht met een sinus van 220 Hz vlak boven en onder de drempel (attack 5 ms, release 50 ms, hold 20 ms): grootste sprong tussen opeenvolgende samples');
{ const n = 2 * SR, x = sine(220, 0.5, n); for (let i = 0; i < n; i++) if (Math.floor(i / 12000) % 2) x[i] *= 0.001; const y = make({ ...base, att: 5, rel: 50, hold: 20, thr: -30, hyst: 3 }).run(x, x).l;
  let mj = 0, mi = 0; for (let i = 1; i < n; i++) { mj = Math.max(mj, Math.abs(y[i] - y[i - 1])); mi = Math.max(mi, Math.abs(x[i] - x[i - 1])); } console.log(`  grootste sprong uitgang ${mj.toFixed(4)}, ingang ${mi.toFixed(4)} (sinus 220 Hz, amplitude 0,5: hoogste helling ${(2 * Math.PI * 220 / SR * 0.5).toFixed(4)})`); }
console.log('== Rekenlast (blokken van 128, budget 2,67 ms)');
for (const [label, cfg] of [['standaard', {}], ['alles aan: rms, filters, lookahead 10 ms, extern', { detect: 'rms', hpf: 200, lpf: 8000, look: 10, hyst: 6, hold: 100, sc: 'ext', link: 0.5 }]]) {
  const e = make({ ...base, ...cfg }); const xs = new Float32Array(128), xr = new Float32Array(128); const times = []; let t = 0; for (let b = 0; b < 4000; b++) { for (let i = 0; i < 128; i++) { xs[i] = 0.5 * Math.sin((t + i) * 0.05) * Math.sin((t + i) * 0.0003); xr[i] = xs[i]; } t += 128;
    const ol = new Float32Array(128), or = new Float32Array(128); const t0 = process.hrtime.bigint(); e.p.process([[xs, xr], [xs, xr]], [[ol, or]]); times.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  const s = times.slice(500).sort((a, b) => a - b), mean = s.reduce((a, b) => a + b, 0) / s.length, bud = 128 / SR * 1000;
  console.log(`  ${label}: gemiddeld ${(mean / bud * 100).toFixed(2)}% van het budget, p99 ${(s[Math.floor(s.length * 0.99)] / bud * 100).toFixed(2)}%, maximum ${(s[s.length - 1] / bud * 100).toFixed(2)}%`); }
