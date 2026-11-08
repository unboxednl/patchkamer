// SPDX-License-Identifier: AGPL-3.0-or-later
// Robuustheidstest van de engine van Bass Finder (export `engine` van het apparaatbestand): stilte, NaN/Infinity, gelijkspanning, clipping, extreem korte en lange invoer,
// 8/22/44,1/48/96 kHz, mono/stereo, ongeldige invoer. Eis: geen throw en geen niet-eindige of buiten het bereik liggende uitvoer; op synthetische baslijnen
// (zaagtand met sterke grondtoon) wordt ook gemeten of de noten gevonden worden.   node docs/tools/check-bass-finder.mjs
import { engine as E } from '../../devices/tools/BassFinder/bass-finder.patchkamer-device.js';

let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('FOUT  ' + msg); } };
const rnd = (() => { let a = 12345; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();

function checkResult(r, name) {
  ok(r && typeof r === 'object', name + ': geen object');
  if (!r || r.error) return;
  ok(Number.isFinite(r.bpm) && r.bpm > 0 && r.bpm < 1000, name + ': bpm ' + r.bpm);
  ok(Number.isInteger(r.length) && r.length >= 1 && r.length <= 12288, name + ': lengte ' + r.length);
  ok(Number.isFinite(r.swing) && r.swing >= 0 && r.swing <= 0.6, name + ': swing ' + r.swing);
  ok(Array.isArray(r.notes) && r.notes.length <= 4096, name + ': aantal noten');
  for (const q of r.notes) ok(Number.isInteger(q.t) && q.t >= 0 && q.t < r.length && Number.isInteger(q.len) && q.len >= 1 && q.t + q.len <= r.length && Number.isInteger(q.n) && q.n >= 0 && q.n <= 127 && Number.isFinite(q.vel) && q.vel >= 0.01 && q.vel <= 1, name + ': noot ' + JSON.stringify(q));
  for (const q of r.raw) ok(Number.isFinite(q.s) && Number.isFinite(q.e) && q.e >= q.s && Number.isFinite(q.midi) && Number.isFinite(q.vel), name + ': ruwe noot');
}
function run(name, chs, sr, opts = {}) {
  let r; const t0 = performance.now();
  try { r = E.analyse(chs, sr, opts); } catch (e) { ok(false, name + ': throw ' + (e && e.message)); return null; }
  checkResult(r, name); return { r, ms: performance.now() - t0 };
}

// synthetic bass line: sawtooth with a strong fundamental, short decay, no click
function line(sr, notes, total) {
  const x = new Float32Array(Math.round(total * sr));
  for (const q of notes) {
    const f = 440 * 2 ** ((q.n - 69) / 12), a = Math.round(q.t * sr), b = Math.min(x.length, Math.round((q.t + q.d) * sr)); let ph = 0;
    for (let i = a; i < b; i++) {
      const u = (i - a) / sr, env = Math.min(1, u / 0.004) * Math.exp(-u * 3) * Math.min(1, (q.t + q.d - i / sr) / 0.02);
      ph += f / sr; x[i] += q.v * env * (0.6 * (2 * (ph % 1) - 1) + 0.4 * Math.sin(2 * Math.PI * ph));
    }
  }
  return x;
}
const NOTES = [28, 28, 35, 33, 40, 31, 36, 28].map((n, k) => ({ n, t: 0.1 + k * 0.45, d: 0.35, v: 0.5 + 0.06 * k }));
function score(r, notes, tolMs = 50) {
  let tp = 0; const used = new Set();
  for (const q of notes) { const j = r.raw.findIndex((d, k) => !used.has(k) && d.midi === q.n && Math.abs(d.s - q.t) * 1000 <= tolMs); if (j >= 0) { used.add(j); tp++; } }
  return { tp, nt: notes.length, nd: r.raw.length };
}

// 1. synthetic lines at several sample rates
for (const sr of [8000, 11025, 22050, 44100, 48000, 96000]) {
  const x = line(sr, NOTES, 4.0), res = run('lijn ' + sr, [x], sr); if (!res || res.r.error) { ok(false, 'lijn ' + sr + ': ' + (res && res.r.error)); continue; }
  const s = score(res.r, NOTES); ok(s.tp >= 7 && s.nd <= 9, `lijn ${sr} Hz: ${s.tp}/${s.nt} gevonden, ${s.nd} gegeven`); console.log(`lijn ${String(sr).padStart(5)} Hz: ${s.tp}/${s.nt} noten, ${s.nd} gegeven, ${res.ms.toFixed(0)} ms`);
}
// 2. no sound, bad numbers
const SR = 44100;
for (const [name, mk] of [
  ['stilte', () => new Float32Array(SR * 3)],
  ['bijna stil (1e-7)', () => new Float32Array(SR * 3).fill(1e-7)],
  ['gelijkspanning 0,5', () => new Float32Array(SR * 3).fill(0.5)],
  ['witte ruis', () => Float32Array.from({ length: SR * 3 }, () => rnd() * 2 - 1)],
  ['te kort (50 ms)', () => line(SR, [{ n: 40, t: 0, d: 0.04, v: 0.8 }], 0.05)],
  ['net lang genoeg (0,12 s)', () => line(SR, [{ n: 40, t: 0, d: 0.1, v: 0.8 }], 0.12)],
  ['één sample', () => new Float32Array([0.5])],
  ['leeg', () => new Float32Array(0)],
  ['clipping (x30)', () => line(SR, NOTES, 4).map(v => Math.max(-1, Math.min(1, v * 30)))],
  ['clipping met DC', () => line(SR, NOTES, 4).map(v => Math.max(-1, Math.min(1, v * 30 + 0.4)))],
  ['NaN verspreid', () => { const x = line(SR, NOTES, 4); for (let i = 0; i < x.length; i += 997) x[i] = NaN; return x; }],
  ['Infinity en 1e30', () => { const x = line(SR, NOTES, 4); for (let i = 0; i < x.length; i += 1013) x[i] = i % 2 ? Infinity : -Infinity; for (let i = 5; i < x.length; i += 2003) x[i] = 1e30; return x; }],
  ['alles NaN', () => new Float32Array(SR * 2).fill(NaN)],
  ['alles Infinity', () => new Float32Array(SR * 2).fill(Infinity)],
  ['piek van 1e9 in de lijn', () => { const x = line(SR, NOTES, 4); x[SR] = 1e9; return x; }],
  ['hoogfrequente sinus 10 kHz', () => Float32Array.from({ length: SR * 2 }, (_, i) => Math.sin(2 * Math.PI * 10000 * i / SR))],
  ['sinus 20 Hz (onder het bereik)', () => Float32Array.from({ length: SR * 2 }, (_, i) => Math.sin(2 * Math.PI * 20 * i / SR))],
  ['sinus 700 Hz (boven het bereik)', () => Float32Array.from({ length: SR * 2 }, (_, i) => Math.sin(2 * Math.PI * 700 * i / SR))],
  ['gelijkmatige sinus 55 Hz, 3 s', () => Float32Array.from({ length: SR * 3 }, (_, i) => 0.5 * Math.sin(2 * Math.PI * 55 * i / SR))],
]) {
  const x = mk(); const res = run(name, [x], SR);
  console.log(name.padEnd(34), res ? (res.r.error ? 'fout: ' + res.r.error : res.r.notes.length + ' noten') : 'GEFAALD');
}
// 3. invalid arguments
for (const [name, chs, sr] of [['null', null, SR], ['geen kanalen', [], SR], ['sr 0', [new Float32Array(SR)], 0], ['sr NaN', [new Float32Array(SR)], NaN], ['sr 1', [new Float32Array(SR)], 1], ['sr 1e9', [new Float32Array(SR)], 1e9], ['kanalen van verschillende lengte', [line(SR, NOTES, 4), line(SR, NOTES, 2)], SR], ['undefined in kanalen', [undefined, line(SR, NOTES, 4)], SR]]) run(name, chs, sr);
// 4. long input
{ const sr = 48000, x = line(sr, NOTES, 8), y = new Float32Array(sr * 120); for (let k = 0; k < 15; k++) y.set(x, k * x.length); const res = run('120 s (wordt 90 s)', [y], sr); console.log(`120 s audio: ${res.ms.toFixed(0)} ms, ${res.r.notes.length} noten, afgekapt ${res.r.truncated}`); ok(res.r.truncated === true, 'lange invoer is niet afgekapt'); }
// 5. options out of range
for (const o of [{ bpm: -5 }, { bpm: NaN }, { bpm: 1e9 }, { bars: -3 }, { bars: 1e6 }, { grid: 'x' }, { swing: 99 }, { swing: NaN }, { sens: -1 }, { sens: 9 }, { sens: 'a' }, { align: {} }, { tuning: 99 }, { grid: 'off', bpm: 40 }, { grid: '16t', bpm: 300 }]) run('opties ' + JSON.stringify(o), [line(SR, NOTES, 4)], SR, o);
// 6. mono/stereo and polarity do not matter
{ const x = line(SR, NOTES, 4), neg = x.map(v => -v), a = run('stereo', [x, neg.map(v => -v)], SR), b = run('omgekeerd', [neg], SR); ok(a && b && a.r.raw.length === b.r.raw.length, 'polariteit verandert het resultaat'); }
console.log(fails ? `\n${fails} van ${checks} controles mislukt` : `\nAlle ${checks} controles zijn goed.`);
process.exit(fails ? 1 : 0);
