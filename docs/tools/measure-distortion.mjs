// SPDX-License-Identifier: AGPL-3.0-or-later
// Meet Distortion offline (de echte worklet-code, geen browser): vertraging, doorlaatrespons van de oversampling, harmonischen per soort,
// aliasing met en zonder oversampling, niveau bij drive, DC-offset, gate/touch, toonregelaars, stabiliteit bij NaN/Infinity en rekenlast.
// Gebruik, vanuit de root:  node docs/tools/measure-distortion.mjs
import { loadProcessor, spectrum, db } from './worklet-harness.mjs';
const SR = 48000, N = 65536, SETTLE = 16384, K = 4099;           // K: coherente bin, f = K*SR/N = 3002 Hz (harmonischen vallen nooit op elkaar na vouwen)
const H = await loadProcessor('devices/effects/Distortion/distortion.patchkamer-device.js', SR);
const TYPES = ['soft', 'hard', 'tube', 'tape', 'diode', 'fuzz', 'fold', 'rect'];
const sine = (f, a, n, ph = 0) => Float32Array.from({ length: n }, (_, i) => a * Math.sin(2 * Math.PI * f * i / SR + ph));
const tot = SETTLE + N;
const run = (t, os, par, x, auto = false) => { const p = H.make({ type: TYPES.indexOf(t), os, auto }); return p.run(x, x, par).l; };
const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
const line = (...a) => console.log(a.join('  '));
console.log('Distortion: meetrapport (', SR, 'Hz, worklet in Node, niet beluisterd)\n');

// 1. vertraging
console.log('1. Vertraging (impuls; de droge weg wordt gelijkgetrokken)');
for (const os of [1, 2, 4]) { const x = new Float32Array(2048); x[100] = 1e-3;
  const w = run('soft', os, { drive: 0, mix: 1 }, x), d = run('soft', os, { drive: 0, mix: 0 }, x); const pk = a => { let m = 0, j = 0; a.forEach((v, i) => { if (Math.abs(v) > m) { m = Math.abs(v); j = i; } }); return j - 100; };
  line(' os', os + 'x', 'nat piek op +' + pk(w), 'samples (' + (pk(w) / SR * 1000).toFixed(2) + ' ms), droog op +' + pk(d)); }

// 2. doorlaatrespons van de oversampling (zacht, drive 0, amplitude 1e-3 zodat tanh lineair is)
console.log('\n2. Respons van de oversampling (dB t.o.v. 1x, sinus 1e-3, drive 0)');
for (const f of [1000, 8000, 15000, 18000, 20000, 22000]) { const x = sine(f, 1e-3, 8192), g = (os) => { const y = run('soft', os, { drive: 0, mix: 1 }, x); return rms(y.slice(4096)) / rms(x.slice(4096)); };
  line(' ', String(f).padStart(5) + ' Hz', ' 1x', db(g(1)).toFixed(2), ' 2x', db(g(2)).toFixed(2), ' 4x', db(g(4)).toFixed(2)); }

// 3. harmonischen per soort (os 4, drive 0.5 = +20 dB, ingang -12 dBFS, auto uit, tone uit)
console.log('\n3. Harmonischen per soort (3002 Hz, -12 dBFS in, drive +20 dB, 4x, DC-blokkering aan; THD+F = harmonischen t.o.v. het totaal, ook als de grondtoon verdwijnt)');
line(' soort    ', 'THD+F% ', 'even/oneven (dB, begrensd op ±120)', 'H2 dB   H3 dB   H5 dB (t.o.v. grondtoon)', 'DC');
const harm = (y) => { const s = spectrum(y), f = s[K]; let e = 0, o = 0, h = 0; const m = Math.floor((N / 2) / K); const hv = [];
  for (let n = 2; n <= m; n++) { const a = s[n * K]; h += a * a; if (n % 2) o += a * a; else e += a * a; hv[n] = a; }
  return { thd: Math.sqrt(h / (h + f * f)) * 100, eo: Math.max(-120, Math.min(120, 10 * Math.log10(Math.max(e, 1e-24) / Math.max(o, 1e-24)))), h2: db(hv[2] / f), h3: db(hv[3] / f), h5: db(hv[5] / f), fund: f }; };
for (const t of TYPES) { const x = sine(K * SR / N, 0.25, tot), y = run(t, 4, { drive: 0.5 }, x).slice(SETTLE); const r = harm(y);
  line(' ' + t.padEnd(9), r.thd.toFixed(1).padStart(6), String(r.eo.toFixed(1)).padStart(8), '        ', r.h2.toFixed(1).padStart(7), r.h3.toFixed(1).padStart(7), r.h5.toFixed(1).padStart(7), '  ', (y.reduce((s, v) => s + v, 0) / y.length).toExponential(1)); }

console.log('   met bias +40% (asymmetrie): tweede harmonische (H2) t.o.v. de grondtoon');
for (const t of ['soft', 'hard', 'tape', 'diode', 'tube']) { const x = sine(K * SR / N, 0.25, tot), y = run(t, 4, { drive: 0.5, bias: 0.4 }, x).slice(SETTLE), r = harm(y); line(' ' + t.padEnd(9), 'H2', r.h2.toFixed(1), 'dB   H3', r.h3.toFixed(1), 'dB   even/oneven', r.eo.toFixed(1), 'dB'); }

// 4. aliasing
console.log('\n4. Aliasing (vermogen buiten de harmonischen, dB t.o.v. het totale uitgangsvermogen; 3002 Hz, -12 dBFS, drive 100% = +40 dB)');
line(' soort    ', '1x      ', '2x      ', '4x');
const alias = (y) => { const s = spectrum(y), m = Math.floor((N / 2) / K); const isH = new Uint8Array(N / 2); for (let n = 1; n <= m; n++) isH[n * K] = 1; let a = 0, all = 0; for (let k = 4; k < N / 2; k++) { all += s[k] * s[k]; if (!isH[k]) a += s[k] * s[k]; } return 10 * Math.log10(Math.max(a, 1e-24) / Math.max(all, 1e-24)); };
const aliasTab = {};
for (const t of TYPES) { const x = sine(K * SR / N, 0.25, tot); const r = [1, 2, 4].map(os => alias(run(t, os, { drive: 1 }, x).slice(SETTLE))); aliasTab[t] = r;
  line(' ' + t.padEnd(9), r.map(v => (v.toFixed(1) + ' dB').padEnd(9)).join(' ')); }
console.log('   dezelfde meting bij drive 50% (+20 dB):');
for (const t of ['hard', 'fuzz', 'fold', 'rect']) { const x = sine(K * SR / N, 0.25, tot); const r = [1, 2, 4].map(os => alias(run(t, os, { drive: 0.5 }, x).slice(SETTLE))); line(' ' + t.padEnd(9), r.map(v => (v.toFixed(1) + ' dB').padEnd(9)).join(' ')); }

// 5. niveau bij drive: uitgangs-RMS (dBFS) van een -12 dBFS sinus (RMS -15 dBFS), auto uit en aan
console.log('\n5. Niveau: RMS van de uitgang in dBFS voor een sinus van -12 dBFS (ingang-RMS = -15.05 dBFS); auto uit | auto aan');
line(' soort    ', [0, 0.25, 0.5, 0.75, 1].map(d => ('drive ' + Math.round(d * 100) + '%').padEnd(17)).join(''));
for (const t of TYPES) { const x = sine(1000, 0.25, 24000), cells = [0, 0.25, 0.5, 0.75, 1].map(d => { const a = rms(run(t, 2, { drive: d }, x, false).slice(8000)), b = rms(run(t, 2, { drive: d }, x, true).slice(8000)); return (db(a).toFixed(1) + ' | ' + db(b).toFixed(1)).padEnd(17); });
  line(' ' + t.padEnd(9), cells.join('')); }

// 6. DC-offset (gemiddelde van de uitgang na 0,3 s) met bias 0,6 en drive 50%
console.log('\n6. DC-offset met bias +60% (gemiddelde uitgang / uitgangs-RMS), na de DC-blokkering');
for (const t of TYPES) { const x = sine(200, 0.25, 48000), y = run(t, 2, { drive: 0.5, bias: 0.6 }, x).slice(24000); const mean = y.reduce((s, v) => s + v, 0) / y.length; line(' ' + t.padEnd(9), mean.toExponential(1), ' /', rms(y).toFixed(3)); }
{ const y = run('tube', 2, { drive: 0.5, bias: 0.6 }, new Float32Array(48000)); line('  stilte in, bias +60%, tube: max |uit| =', Math.max(...y.map(Math.abs)).toExponential(1)); }

// 7. toonregelaars: gain bij 100 Hz / 1 kHz / 8 kHz (soft, drive 0, 1e-3)
console.log('\n7. Toonregelaars (dB, amplitude 1e-3, drive 0, soft)');
const gainAt = (f, par) => { const x = sine(f, 1e-3, 16384), y = run('soft', 1, { drive: 0, ...par }, x); return db(rms(y.slice(8192)) / rms(x.slice(8192))); };
const row = (name, par) => line(' ' + name.padEnd(22), [100, 1000, 8000].map(f => (f + ' Hz ' + gainAt(f, par).toFixed(1)).padEnd(15)).join(''));
row('tilt -100%', { tilt: -1 }); row('tilt +100%', { tilt: 1 }); row('tight 300 Hz', { lowcut: 300 }); row('tone 2 kHz', { tone: 2000 }); row('presence +100%', { presence: 1 }); row('presence -100%', { presence: -1 });

// 8. gate en touch
console.log('\n8. Gate en touch (soft, drive 60%)');
{ const rn = n => { let s = 12345; return Float32Array.from({ length: n }, () => { s = (s * 1664525 + 1013904223) >>> 0; return (s / 4294967296 * 2 - 1); }); };
  for (const g of [0, 0.5, 1]) { const x = rn(48000).map(v => v * 0.002), y = run('soft', 2, { drive: 0.6, gate: g }, x); line(' ruis -54 dBFS, gate ' + Math.round(g * 100) + '% (drempel ' + (g ? Math.round(-80 + 50 * g) : '-') + ' dB): uitgangs-RMS', db(rms(y.slice(24000))).toFixed(1), 'dBFS'); }
  for (const tc of [-1, 0, 1]) { const out = [0.01, 0.1, 0.5].map(a => db(rms(run('soft', 2, { drive: 0.4, touch: tc }, sine(1000, a, 48000), false).slice(24000)))); line(' touch ' + (tc > 0 ? '+' : '') + tc * 100 + '%: uitgang bij ingang -40/-20/-6 dBFS:', out.map(v => v.toFixed(1)).join(' / '), 'dBFS RMS'); } }

// 9. stabiliteit
console.log('\n9. Stabiliteit (NaN, ±Infinity, 1e9, 1e30 op de ingang; willekeurige en extreme instellingen)');
{ let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; let bad = 0, runs = 0, worst = 0;
  const ranges = { drive: [0, 1], bias: [-1, 1], lowcut: [20, 1000], tilt: [-1, 1], gate: [0, 1], touch: [-1, 1], tone: [500, 20000], presence: [-1, 1], out: [-24, 12], mix: [0, 1] };
  for (let r = 0; r < 160; r++) { const par = {}; for (const k in ranges) { const [a, b] = ranges[k], q = rnd(); par[k] = q < 0.2 ? a : q < 0.4 ? b : a + (b - a) * rnd(); }
    const t = TYPES[r % 8], os = [1, 2, 4][r % 3]; const x = Float32Array.from({ length: 24000 }, (_, i) => i < 12000 ? 0.9 * Math.sin(i * (0.01 + rnd() * 0.3)) * (rnd() < 0.01 ? 4 : 1) : 0.3 * Math.sin(i * 0.05));
    const y = run(t, os, par, x, rnd() < 0.5); runs++; let nb = 0; for (const v of y) if (!Number.isFinite(v)) nb++; bad += nb; worst = Math.max(worst, ...y.map(Math.abs)); }
  line(' ' + runs + ' willekeurige/extreme runs: niet-eindige samples =', bad, ', grootste |uit| =', worst.toFixed(2));
  const burstVals = [NaN, Infinity, -Infinity, 1e9, -1e9, 1e30], clean = sine(1000, 0.25, 48000);
  for (const t of TYPES) { const ref = run(t, 2, { drive: 0.5 }, clean), x = Float32Array.from(clean); for (let i = 0; i < 600; i++) x[24000 + i] = burstVals[i % 6];
    const y = run(t, 2, { drive: 0.5 }, x); let nb = 0, mx = 0; for (const v of y) { if (!Number.isFinite(v)) nb++; else mx = Math.max(mx, Math.abs(v)); }
    line(' burst', t.padEnd(8), 'niet-eindig:', nb, ' max |uit|:', mx.toFixed(2), ' RMS 0,35 s na de burst t.o.v. zonder burst:', (rms(y.slice(40800)) / rms(ref.slice(40800))).toFixed(3)); } }

// 10. rekenlast
console.log('\n10. Rekenlast (stereo, blokken van 128 samples; budget 2,67 ms bij 48 kHz; Node op deze machine)');
for (const t of ['soft', 'diode', 'fold']) for (const os of [1, 2, 4]) { const p = H.make({ type: TYPES.indexOf(t), os, auto: true }); const blk = 128; const a = new Float32Array(blk).map((_, i) => 0.3 * Math.sin(i * 0.2)), ol = new Float32Array(blk), orr = new Float32Array(blk);
  const P = { drive: [0.7], bias: [0.2], lowcut: [80], tilt: [0.3], gate: [0.2], touch: [0.3], tone: [8000], presence: [0.3], out: [0], mix: [0.8] };   // alle tien stuurbare parameters for (let i = 0; i < 300; i++) p.p.process([[a, a]], [[ol, orr]], P);
  const ts = []; for (let i = 0; i < 4000; i++) { const t0 = process.hrtime.bigint(); p.p.process([[a, a]], [[ol, orr]], P); ts.push(Number(process.hrtime.bigint() - t0) / 1e6); } ts.sort((x, y) => x - y);
  const mean = ts.reduce((s, v) => s + v, 0) / ts.length; line(' ' + t.padEnd(6), os + 'x', 'gemiddeld', (mean / 2.667 * 100).toFixed(1) + '%', ' p99', (ts[Math.floor(ts.length * 0.99)] / 2.667 * 100).toFixed(1) + '%', ' max', (ts[ts.length - 1] / 2.667 * 100).toFixed(1) + '%'); }

// 11. de meegeleverde presets: niveau (RMS uit t.o.v. in) en harmonische inhoud bij een sinus van 220 Hz op -12 dBFS
console.log('\n11. Presets (220 Hz, -12 dBFS): niveauverschil in dB en THD+F in %');
{ const { readFileSync, existsSync } = await import('node:fs'); const f = 'presets/distortion.patchkamer-presets.json';
  if (existsSync(f)) { const pack = JSON.parse(readFileSync(f, 'utf8')), items = []; const walk = l => l.forEach(x => x.folder ? walk(x.items) : items.push(x)); walk(pack.tree);
    const k = Math.round(220 / SR * N), x = sine(k * SR / N, 0.25, tot); let lo = 99, hi = -99;
    for (const it of items) { const s = it.state, p = H.make({ type: TYPES.indexOf(s.type), os: s.os, auto: s.auto }), par = { ...s }; delete par.type; delete par.os; delete par.auto; const y = p.run(x, x, par).l.slice(SETTLE);
      let nb = 0; for (const v of y) if (!Number.isFinite(v)) nb++; const d = db(rms(y) / rms(x.slice(SETTLE))); lo = Math.min(lo, d); hi = Math.max(hi, d);
      const sp = spectrum(y); let hh = 0, all = 0; for (let b = 3; b < N / 2; b++) { all += sp[b] ** 2; if (b !== k) hh += sp[b] ** 2; }
      line(' ' + it.name.padEnd(24), s.type.padEnd(6), 'niveau', d.toFixed(1).padStart(6), 'dB   THD+F', (Math.sqrt(hh / all) * 100).toFixed(1).padStart(5) + '%', nb ? '  NIET-EINDIG: ' + nb : ''); }
    line(' kleinste en grootste niveauverschil:', lo.toFixed(1), 'en', hi.toFixed(1), 'dB'); } }
