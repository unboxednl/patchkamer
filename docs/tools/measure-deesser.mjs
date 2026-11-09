// SPDX-License-Identifier: AGPL-3.0-or-later
// Meet de De-esser offline: drempel en ratio, frequentieselectiviteit, split-band tegenover wideband, attack/release, stabiliteit, tikken en rekenlast.
// Gebruik, vanuit de root van de repo:  node docs/tools/measure-deesser.mjs
import { loadEngine, SR, db, lin, sine, rmsOf, peakOf, seeded } from './dynamics-harness.mjs';
const make = loadEngine('devices/effects/DeEsser/deesser.patchkamer-device.js');
const base = { mode: 'split', freq: 6500, bw: 1, thr: -30, ratio: 4, range: 12, att: 0.5, rel: 50, mix: 1, on: true };
const f = (x, n = 2) => x.toFixed(n);
const tail = (y, n) => rmsOf(y, n - 9600, n);
function tone(cfg, fr, d) { const n = SR, x = sine(fr, lin(d), n); const y = make({ ...base, ...cfg }).run(x, x).l; return db(tail(y, n)) - db(tail(x, n)); }
console.log('== Drempel en ratio (toon op de middenfrequentie 6,5 kHz, piek = niveau van de band; drempel -30 dB, ratio 4:1, knee 6 dB, max 12 dB): gemeten reductie');
for (const d of [-50, -40, -34, -30, -27, -20, -10]) { const o = d + 30, W = 6, want = Math.min(12, 2 * o < -W ? 0 : 2 * Math.abs(o) <= W ? 0.75 * (o + W / 2) ** 2 / (2 * W) : o * 0.75); console.log(`  piek ${d} dB: gemeten ${f(-tone({}, 6500, d))} dB  verwacht ${f(want)} dB`); }
console.log('== Ratio en max. reductie bij piek -10 dB');
for (const R of [2, 4, 10, 100]) console.log(`  ratio ${R >= 99.5 ? 'oneindig' : R + ':1'}, max 24: ${f(-tone({ ratio: R, range: 24 }, 6500, -10))} dB  verwacht ${f(Math.min(24, 20 * (1 - 1 / R)))} dB`);
for (const rg of [3, 6, 12]) console.log(`  max. reductie ${rg} dB (ratio 100, piek -10): ${f(-tone({ ratio: 100, range: rg }, 6500, -10))} dB`);
console.log('== Frequentieselectiviteit (split-band, 6,5 kHz, 1 oct): reductie van een toon van -10 dB piek bij andere frequenties wanneer de band reduceert (de band wordt aangedreven door een toon op 6,5 kHz van -10 dB)');
{ const n = SR, a = sine(6500, lin(-10), n); for (const fr of [200, 1000, 3000, 4600, 6500, 9200, 13000]) { const probe = sine(fr, lin(-40), n); const mixd = new Float32Array(n); for (let i = 0; i < n; i++) mixd[i] = a[i] + probe[i];
    const yA = make({ ...base, ratio: 100, range: 12 }).run(a, a).l, yM = make({ ...base, ratio: 100, range: 12 }).run(mixd, mixd).l; const dd = new Float32Array(n), du = new Float32Array(n); for (let i = 0; i < n; i++) { dd[i] = yM[i] - yA[i]; du[i] = probe[i]; }
    if (fr === 6500) { console.log(`  6500 Hz (middenfrequentie, drive zelf): ${f(db(tail(yA, n)) - db(tail(a, n)))} dB`); continue; } console.log(`  ${fr} Hz: probe ${f(db(tail(dd, n)) - db(tail(du, n)))} dB`); } }
console.log('== Split-band tegenover wideband: stem 200 Hz (-12 dB) + s-burst 7 kHz (-12 dB); verandering van de 200 Hz-component');
{ const n = SR, v = sine(200, lin(-12), n), s = sine(7000, lin(-12), n), x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = v[i] + s[i];
  for (const mode of ['split', 'wide']) { const y = make({ ...base, mode, ratio: 100, range: 12, thr: -30 }).run(x, x).l; // 200 Hz-component via correlatie met de sinus
    let c = 0, c0 = 0; for (let i = n - 9600; i < n; i++) { c += y[i] * Math.sin(2 * Math.PI * 200 * i / SR); c0 += x[i] * Math.sin(2 * Math.PI * 200 * i / SR); } console.log(`  ${mode}: 200 Hz ${f(db(Math.abs(c)) - db(Math.abs(c0)))} dB`); } }
console.log('== Attack/release (tijdconstanten; burst 6,5 kHz van -50 naar -10 dB piek, ratio 100, max 24 dB, drempel -30): reductie in dB per 1 ms');
{ for (const [att, rel] of [[1, 20], [5, 100], [10, 300]]) { const n = 4 * SR, x = new Float32Array(n), a = sine(6500, 1, n); for (let i = 0; i < n; i++) x[i] = a[i] * lin(i >= SR * 0.5 && i < SR * 2.5 ? -10 : -50);
    const y = make({ ...base, ratio: 100, range: 24, att, rel }).run(x, x).l; const gr = []; for (let i = 0; i + 96 <= n; i += 48) gr.push(-(db(peakOf(y, i, i + 96)) - db(peakOf(x, i, i + 96))));
    const fin = gr[Math.floor(2.4 * SR / 48)], t = (start, fr, from, to) => { for (let k = Math.floor(start * SR / 48); k < gr.length; k++) if (to > from ? gr[k] >= from + fr * (to - from) : gr[k] <= from + fr * (to - from)) return (k * 48 - start * SR) / SR * 1000; return NaN; };
    console.log(`  attack ${att} ms: 63% na ${f(t(0.5, 0.632, 0, fin), 1)} ms (reductie ${f(fin)} dB, verwacht 20 dB) | release ${rel} ms: 63% hersteld na ${f(t(2.502, 0.632, fin, 0) + 2, 1)} ms`); } }
console.log('== Mix en bypass: mix 50% bij -12 dB reductie; Uit = doorlaten');
{ const n = SR, x = sine(6500, lin(-10), n); console.log(`  mix 50%: ${f(-tone({ ratio: 100, range: 12, mix: 0.5 }, 6500, -10))} dB reductie (verwacht ${f(-db((1 + lin(-12)) / 2))} dB); Uit: ${f(tone({ on: false }, 6500, -10))} dB`); }
console.log('== Stabiliteit: bursts van NaN, Infinity, 1e9 en 1e30 op de ingang; daarna gelijk aan een run zonder burst');
{ const n = SR * 2, x = sine(6500, 0.3, n), xb = x.slice(); const bad = [NaN, Infinity, -Infinity, 1e9, -1e9, 1e30, -1e30]; for (let i = 20000; i < 20256; i++) xb[i] = bad[i % bad.length];
  for (const mode of ['split', 'wide']) { const yb = make({ ...base, mode, att: 0.05, rel: 5, ratio: 100 }).run(xb, xb).l, yc = make({ ...base, mode, att: 0.05, rel: 5, ratio: 100 }).run(x, x).l; let nf = 0; for (let i = 0; i < n; i++) if (!Number.isFinite(yb[i])) nf++;
    console.log(`  ${mode}: niet-eindige samples ${nf}; RMS laatste 0,5 s met burst ${f(db(tail(yb, n)))} dBFS, zonder ${f(db(tail(yc, n)))} dBFS`); } }
console.log('== Willekeurige en extreme instellingen (inclusief wissels tijdens het draaien): niet-eindige samples');
{ const r = seeded(5); let bad = 0, cnt = 0, mx = 0; const pick = (a, b) => a + (b - a) * r(), ext = (a, b) => r() < 0.4 ? (r() < 0.5 ? a : b) : pick(a, b);
  for (let k = 0; k < 120; k++) { const e = make({ mode: r() < 0.5 ? 'split' : 'wide', freq: ext(3000, 10000), bw: ext(0.25, 3), thr: ext(-60, 0), ratio: ext(1, 100), range: ext(0, 24), att: ext(0.05, 20), rel: ext(5, 500), mix: ext(0, 1), on: r() < 0.9 });
    const n = 24000, x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = (r() * 2 - 1) * (r() < 0.01 ? 16 : 1) * Math.sin(i * 0.01 * (1 + k));
    for (let seg = 0; seg < 4; seg++) { e.set({ freq: ext(3000, 10000), bw: ext(0.25, 3), thr: ext(-60, 0), range: ext(0, 24), mode: r() < 0.5 ? 'split' : 'wide' }); const o = e.run(x.subarray(seg * 6000, seg * 6000 + 6000), x.subarray(seg * 6000, seg * 6000 + 6000)); for (const ch of [o.l, o.r]) for (let i = 0; i < ch.length; i++) { cnt++; if (!Number.isFinite(ch[i])) bad++; mx = Math.max(mx, Math.abs(ch[i])); } } }
  console.log(`  ${cnt} samples, niet-eindig ${bad}, maximum |y| ${mx.toFixed(2)}`); }
console.log('== Tikken: een sinus van 7 kHz die aan en uit gaat (attack 0,5 ms, release 50 ms, drempel -30): grootste sprong tussen opeenvolgende samples tegen de ingang');
{ const n = 2 * SR, x = sine(7000, 0.5, n); for (let i = 0; i < n; i++) if (Math.floor(i / 12000) % 2) x[i] *= 0.01; const y = make({ ...base, ratio: 100, range: 24 }).run(x, x).l; let mj = 0, mi = 0; for (let i = 1; i < n; i++) { mj = Math.max(mj, Math.abs(y[i] - y[i - 1])); mi = Math.max(mi, Math.abs(x[i] - x[i - 1])); } console.log(`  grootste sprong uitgang ${mj.toFixed(4)}, ingang ${mi.toFixed(4)}`); }
console.log('== Rekenlast (blokken van 128, budget 2,67 ms)');
{ const e = make({ ...base }); const xs = new Float32Array(128), xr = new Float32Array(128); const times = []; let t = 0; for (let b = 0; b < 4000; b++) { for (let i = 0; i < 128; i++) { xs[i] = 0.5 * Math.sin((t + i) * 0.9) * Math.sin((t + i) * 0.0003); xr[i] = xs[i]; } t += 128; const ol = new Float32Array(128), or = new Float32Array(128); const t0 = process.hrtime.bigint(); e.p.process([[xs, xr]], [[ol, or]]); times.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  const s = times.slice(500).sort((a, b) => a - b), mean = s.reduce((a, b) => a + b, 0) / s.length, bud = 128 / SR * 1000; console.log(`  gemiddeld ${(mean / bud * 100).toFixed(2)}% van het budget, p99 ${(s[Math.floor(s.length * 0.99)] / bud * 100).toFixed(2)}%, maximum ${(s[s.length - 1] / bud * 100).toFixed(2)}%`); }
console.log('== Sibilantruis: klinker (harmonischen van 140 Hz) met een burst hoogdoorlaatruis (0,5 tot 0,9 s), -32 dB drempel, ratio 4, max 10 dB: verandering van het RMS-niveau per stuk (dB)');
{ const r = seeded(3), n = 2 * SR, x = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) { let v = 0; for (let k = 1; k <= 20; k++) v += Math.sin(2 * Math.PI * 140 * k * i / SR) / k; const w = r() * 2 - 1, hp = w - prev; prev = w; x[i] = 0.1 * v + (i > SR * 0.5 && i < SR * 0.9 ? 0.25 * hp : 0); }
  for (const mode of ['split', 'wide']) { const y = make({ ...base, mode, bw: 1.2, thr: -32, ratio: 4, range: 10 }).run(x, x).l, seg = (a, b) => f(db(rmsOf(y, a * SR | 0, b * SR | 0)) - db(rmsOf(x, a * SR | 0, b * SR | 0)));
    console.log(`  ${mode}: klinker voor ${seg(0.1, 0.45)}, burst ${seg(0.6, 0.9)}, klinker erna ${seg(1.2, 1.9)}`); } }
