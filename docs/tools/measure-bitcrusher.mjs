// SPDX-License-Identifier: AGPL-3.0-or-later
// Meet Bitcrusher offline (de echte worklet-code, geen browser): SNR per bit, kwantiseerstijlen, dither, sample-rate-reductie met en zonder
// anti-alias-filter, jitter, ruis, niveau, stabiliteit bij NaN/Infinity en rekenlast.
// Gebruik, vanuit de root:  node docs/tools/measure-bitcrusher.mjs
import { loadProcessor, spectrum, db } from './worklet-harness.mjs';
const SR = 48000, N = 65536, SETTLE = 8192;
const H = await loadProcessor('devices/effects/Bitcrusher/bitcrusher.patchkamer-device.js', SR);
const ST = ['tread', 'rise', 'floor', 'mulaw'], IP = ['hold', 'linear'], DT = ['rpdf', 'tpdf', 'shaped'];
const sineK = (k, a, n) => Float32Array.from({ length: n }, (_, i) => a * Math.sin(2 * Math.PI * k * i / N));
const run = (par, x, m = {}) => { const p = H.make({ style: ST.indexOf(m.style || 'tread'), interp: IP.indexOf(m.interp || 'hold'), aa: !!m.aa, dtype: DT.indexOf(m.dtype || 'tpdf') }); return p.run(x, x, par).l; };
const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
const line = (...a) => console.log(a.join('  '));
const K = 1021;     // 1 kHz, coherente bin
const tot = N + SETTLE;
// SNR: vermogen in de grondtoon t.o.v. al het andere (alleen 20 Hz tot 20 kHz, zonder DC)
const snr = (y, k = K) => { const s = spectrum(y.slice(SETTLE)); let sig = 0, rest = 0; for (let b = 3; b < N / 2; b++) { const f = b * SR / N; if (f > 20000) break; if (Math.abs(b - k) <= 0) sig += s[b] * s[b]; else rest += s[b] * s[b]; } return 10 * Math.log10(sig / Math.max(rest, 1e-30)); };
const thd = (y, k) => { const s = spectrum(y.slice(SETTLE)); let h = 0; for (let n = 2; n * k < N / 2; n++) h += s[n * k] ** 2; return 10 * Math.log10(h / s[k] ** 2); };
console.log('Bitcrusher: meetrapport (', SR, 'Hz, worklet in Node, niet beluisterd)\n');

console.log('1. SNR per bit (sinus 1 kHz, amplitude 0,9 = -0,9 dBFS; geen sample-rate-reductie, geen dither). Theorie voor een volle sinus: 6,02*bits + 1,76 dB (hier 0,9 i.p.v. 1: -0,9 dB)');
line(' bits', 'mid-tread', 'mid-rise ', 'truncate ', 'µ-law    ', 'theorie');
const x9 = sineK(K, 0.9, tot);
for (const b of [1, 2, 4, 6, 8, 10, 12, 16]) line(' ' + String(b).padStart(4), ST.map(st => snr(run({ bits: b, rate: 48000 }, x9, { style: st })).toFixed(1).padStart(8) + ' ').join(' '), (6.02 * b + 1.76 - 0.9).toFixed(1));
line(' 7,5 ', ST.map(st => snr(run({ bits: 7.5, rate: 48000 }, x9, { style: st })).toFixed(1).padStart(8) + ' ').join(' '), '(fijne bitdiepte: tussen 7 en 8)');

console.log('\n2. Dither bij een zacht signaal (-40 dBFS sinus, 8 bit, mid-tread): harmonische vervorming en ruisniveau');
line(' dither      ', 'THD (dB)', 'ruis 0-4 kHz', 'ruis 16-24 kHz', '(dB t.o.v. de grondtoon)');
{ const x = sineK(K, 0.01, tot);
  for (const [name, par, dt] of [['uit', { dither: 0 }, 'tpdf'], ['RPDF 100%', { dither: 1 }, 'rpdf'], ['TPDF 100%', { dither: 1 }, 'tpdf'], ['gevormd 100%', { dither: 1 }, 'shaped']]) {
    const y = run({ bits: 8, rate: 48000, ...par }, x, { dtype: dt }), s = spectrum(y.slice(SETTLE)); const band = (a, b) => { let e = 0; for (let k = Math.floor(a / SR * N); k < Math.floor(b / SR * N); k++) if (Math.abs(k - K) > 2 && k > 3) e += s[k] ** 2; return 10 * Math.log10(e / s[K] ** 2); };
    line(' ' + name.padEnd(13), thd(y, K).toFixed(1).padStart(8), band(100, 4000).toFixed(1).padStart(12), band(16000, 24000).toFixed(1).padStart(14)); } }

console.log('\n3. Sample-rate-reductie en aliasing (sinus 9,0 kHz, bij 12 kHz samplerate: vouwt naar 12-9 = 3 kHz). Niveaus in dBFS, 16 bit');
{ const k9 = Math.round(9000 / SR * N), k3 = Math.round(3000 / SR * N), x = sineK(k9, 0.5, tot); line(' ', 'anti-alias', 'tussen', ' 9 kHz', ' 3 kHz (alias)', '12-9 kHz...');
  for (const aa of [false, true]) for (const ip of ['hold', 'linear']) { const y = run({ bits: 16, rate: 12000 }, x, { aa, interp: ip }), s = spectrum(y.slice(SETTLE)); line(' ', (aa ? 'aan ' : 'uit ').padEnd(9), ip.padEnd(7), db(s[k9]).toFixed(1).padStart(6), db(s[k3]).toFixed(1).padStart(10)); }
  console.log('   zelfde bij een 2,0 kHz sinus (ver onder de Nyquist van 6 kHz): niveau na reductie (hold, aa uit/aan)');
  const k2 = Math.round(2000 / SR * N), x2 = sineK(k2, 0.5, tot); for (const aa of [false, true]) { const s = spectrum(run({ bits: 16, rate: 12000 }, x2, { aa }).slice(SETTLE)); line(' ', 'aa', aa ? 'aan' : 'uit', '2 kHz:', db(s[k2]).toFixed(2), 'dBFS'); } }

console.log('\n4. Exact zonder reductie (rate 48 kHz, 16 bit, mix 100%): fout t.o.v. de ingang (SNR) en vertraging');
line(' SNR 16 bit:', snr(run({ bits: 16, rate: 48000 }, x9)).toFixed(1), 'dB (theorie ' + (6.02 * 16 + 1.76 - 0.9).toFixed(1) + ' dB)');
{ const imp = new Float32Array(1024); imp[100] = 0.5; for (const ip of ['hold', 'linear']) for (const r of [48000, 12000]) { const y = run({ bits: 16, rate: r }, imp, { interp: ip }); let m = 0, j = 0; y.forEach((v, i) => { if (Math.abs(v) > m) { m = Math.abs(v); j = i; } }); line(' impuls, ' + ip + ', ' + r + ' Hz: piek op +' + (j - 100) + ' samples'); } }

console.log('\n5. Jitter (sinus 1 kHz, 24 kHz samplerate, 16 bit, aa aan): SNR bij 0, 25, 50 en 100% jitter');
line(' ', [0, 0.25, 0.5, 1].map(j => (j * 100 + '%: ' + snr(run({ bits: 16, rate: 24000, jitter: j }, x9, { aa: true })).toFixed(1) + ' dB').padEnd(18)).join(''));

console.log('\n6. Ruis (stille ingang): uitgangs-RMS in dBFS bij noise 25/50/100% (instelling toont 20·log10(noise²·0,1)), 16 bit, 48 kHz');
line(' ', [0.25, 0.5, 1].map(nz => (Math.round(nz * 100) + '%: ' + db(rms(run({ bits: 16, rate: 48000, noise: nz }, new Float32Array(32768)).slice(8192))).toFixed(1) + ' dBFS (instelling ' + Math.round(20 * Math.log10(nz * nz * 0.1)) + ' dB)').padEnd(40)).join(''));

console.log('\n7. Niveau en stilte');
{ const x = sineK(K, 0.5, tot); line(' ingang -6 dBFS: 1 bit mid-rise -> piek', db(Math.max(...run({ bits: 1, rate: 48000 }, x, { style: 'rise' }).slice(SETTLE).map(Math.abs))).toFixed(1), 'dBFS (een vierkante golf van ±1; een 1-bit-crusher maakt een stille toon dus hard)');
  for (const st of ST) { const y = run({ bits: 4, rate: 48000 }, new Float32Array(24000), { style: st }); line(' stille ingang, 4 bit', st.padEnd(7), ': max |uit| na 0,25 s =', Math.max(...y.slice(12000).map(Math.abs)).toExponential(1), '; piek eerste 50 ms =', Math.max(...y.slice(0, 2400).map(Math.abs)).toFixed(3)); }
  line(' mix 50% + out -6 dB, 8 bit: RMS', db(rms(run({ bits: 8, rate: 48000, mix: 0.5, out: -6 }, x).slice(SETTLE))).toFixed(1), 'dBFS (ingang', db(rms(x)).toFixed(1) + ')'); }

console.log('\n8. Filters (gain in dB, sinus 1e-3, 16 bit, 48 kHz)');
{ const g = (f, par) => { const k = Math.round(f / SR * N), x = sineK(k, 0.2, tot), y = run({ bits: 16, rate: 48000, ...par }, x); return db(rms(y.slice(SETTLE)) / rms(x.slice(SETTLE))); };
  line(' hoogdoorlaat 1 kHz:', [200, 1000, 4000].map(f => f + ' Hz ' + g(f, { hp: 1000 }).toFixed(1)).join('   '));
  line(' laagdoorlaat 2 kHz:', [500, 2000, 8000].map(f => f + ' Hz ' + g(f, { post: 2000 }).toFixed(1)).join('   '));
  line(' anti-alias bij 12 kHz samplerate (alleen het filter, 16 bit; hold):', [1000, 4000, 5400, 9000].map(f => { const k = Math.round(f / SR * N), x = sineK(k, 0.2, tot); const y = run({ bits: 16, rate: 12000 }, x, { aa: true }); const s = spectrum(y.slice(SETTLE)); return f + ' Hz ' + db(s[k] / 0.2).toFixed(1); }).join('   ')); }

console.log('\n9. Stabiliteit (NaN, ±Infinity, 1e9, 1e30 op de ingang; willekeurige en extreme instellingen)');
{ let seed = 11; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; let bad = 0, runs = 0, worst = 0;
  const ranges = { bits: [1, 16], rate: [100, 48000], jitter: [0, 1], input: [-12, 24], dither: [0, 1], noise: [0, 1], hp: [20, 4000], post: [500, 20000], out: [-24, 12], mix: [0, 1] };
  for (let r = 0; r < 160; r++) { const par = {}; for (const k in ranges) { const [a, b] = ranges[k], q = rnd(); par[k] = q < 0.2 ? a : q < 0.4 ? b : a + (b - a) * rnd(); }
    const x = Float32Array.from({ length: 24000 }, (_, i) => i < 12000 ? 0.9 * Math.sin(i * (0.01 + rnd() * 0.3)) * (rnd() < 0.01 ? 4 : 1) : 0.3 * Math.sin(i * 0.05));
    const y = run(par, x, { style: ST[r % 4], interp: IP[r % 2], aa: rnd() < 0.5, dtype: DT[r % 3] }); runs++; for (const v of y) { if (!Number.isFinite(v)) bad++; else worst = Math.max(worst, Math.abs(v)); } }
  line(' ' + runs + ' willekeurige/extreme runs: niet-eindige samples =', bad, ', grootste |uit| =', worst.toFixed(2));
  const burst = [NaN, Infinity, -Infinity, 1e9, -1e9, 1e30], clean = sineK(K, 0.25, 48000);
  for (const st of ST) { const par = { bits: 6, rate: 12000, jitter: 0.3, dither: 0.5, noise: 0.3 }, ref = run({ ...par, jitter: 0, noise: 0 }, clean, { style: st, aa: true }), x = Float32Array.from(clean); for (let i = 0; i < 600; i++) x[24000 + i] = burst[i % 6];
    const y = run({ ...par, jitter: 0, noise: 0 }, x, { style: st, aa: true }); let nb = 0, mx = 0; for (const v of y) { if (!Number.isFinite(v)) nb++; else mx = Math.max(mx, Math.abs(v)); }
    line(' burst', st.padEnd(7), 'niet-eindig:', nb, ' max |uit|:', mx.toFixed(2), ' RMS 0,35 s na de burst t.o.v. zonder burst:', (rms(y.slice(40800)) / rms(ref.slice(40800))).toFixed(3)); } }

console.log('\n10. Rekenlast (stereo, blokken van 128 samples; budget 2,67 ms bij 48 kHz; Node op deze machine)');
for (const [name, m, par] of [['basis (aa uit)', { aa: false }, { bits: 8, rate: 16000 }], ['aa aan, jitter, dither, ruis, filters', { aa: true, dtype: 'shaped' }, { bits: 8, rate: 16000, jitter: 0.5, dither: 1, noise: 0.5, hp: 200, post: 8000 }], ['µ-law, linear', { aa: true, style: 'mulaw', interp: 'linear' }, { bits: 6, rate: 8000 }]]) {
  const p = H.make({ style: ST.indexOf(m.style || 'tread'), interp: IP.indexOf(m.interp || 'hold'), aa: !!m.aa, dtype: DT.indexOf(m.dtype || 'tpdf') }); const a = new Float32Array(128).map((_, i) => 0.3 * Math.sin(i * 0.2)), ol = new Float32Array(128), orr = new Float32Array(128);
  const P = {}; const full = { ...p.cur, ...par }; for (const k in full) P[k] = [full[k]]; for (let i = 0; i < 300; i++) p.p.process([[a, a]], [[ol, orr]], P);
  const ts = []; for (let i = 0; i < 4000; i++) { const t0 = process.hrtime.bigint(); p.p.process([[a, a]], [[ol, orr]], P); ts.push(Number(process.hrtime.bigint() - t0) / 1e6); } ts.sort((x, y) => x - y);
  const mean = ts.reduce((s, v) => s + v, 0) / ts.length; line(' ' + name.padEnd(38), 'gemiddeld', (mean / 2.667 * 100).toFixed(1) + '%', ' p99', (ts[Math.floor(ts.length * 0.99)] / 2.667 * 100).toFixed(1) + '%', ' max', (ts[ts.length - 1] / 2.667 * 100).toFixed(1) + '%'); }

// 11. de meegeleverde presets: niveauverschil en niet-eindige samples (sinus 1 kHz op -12 dBFS)
console.log('\n11. Presets (1 kHz, -12 dBFS): niveauverschil in dB');
{ const { readFileSync, existsSync } = await import('node:fs'); const f = 'presets/bitcrusher.patchkamer-presets.json';
  if (existsSync(f)) { const pack = JSON.parse(readFileSync(f, 'utf8')), items = []; const walk = l => l.forEach(x => x.folder ? walk(x.items) : items.push(x)); walk(pack.tree);
    const x = sineK(K, 0.25, tot); let lo = 99, hi = -99;
    for (const it of items) { const s = it.state, par = { ...s }; for (const k of ['style', 'interp', 'aa', 'dtype']) delete par[k]; const y = run(par, x, s).slice(SETTLE); let nb = 0; for (const v of y) if (!Number.isFinite(v)) nb++;
      const d = db(rms(y) / rms(x.slice(SETTLE))); lo = Math.min(lo, d); hi = Math.max(hi, d); line(' ' + it.name.padEnd(20), 'niveau', d.toFixed(1).padStart(6), 'dB', nb ? '  NIET-EINDIG: ' + nb : ''); }
    line(' kleinste en grootste niveauverschil:', lo.toFixed(1), 'en', hi.toFixed(1), 'dB'); } }
