// SPDX-License-Identifier: AGPL-3.0-or-later
// Meetscript voor Pitch Shifter, Harmonizer en Pitch Correction: toonhoogtefout (cent), artefactniveau (THD+N), latentie, rekenlast,
// detectienauwkeurigheid, gedrag bij de toonladder, snelheid, vibratobehoud, robuustheid (NaN/Infinity) en gedrag op eigen synthgeluid.
// Gebruik, vanuit de root van de repo:
//   node docs/tools/measure-pitch.mjs [shifter|harmonizer|correction|all] [--material <map>]
// De map met materiaal mag singer.f32 bevatten (mono, 48 kHz, float32; maak hem met docs/tools/render-singer-material.py). Piano en Guitar
// worden hier zelf offline gerenderd uit hun worklet. Alles draait in Node met een nep-AudioWorkletProcessor: er is niets beluisterd.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SR = 48000, BUDGET_US = 128 / SR * 1e6;
const args = process.argv.slice(2), which = args.find(a => !a.startsWith('--')) || 'all';
const matDir = args.includes('--material') ? args[args.indexOf('--material') + 1] : null;
const DEV = { shifter: 'devices/effects/PitchShifter/pitch-shifter.patchkamer-device.js', harmonizer: 'devices/effects/Harmonizer/harmonizer.patchkamer-device.js', correction: 'devices/effects/PitchCorrection/pitch-correction.patchkamer-device.js' };

// ---------- hulpmiddelen ----------
function workletSrc(file) { const t = readFileSync(resolve(file), 'utf8'); const m = t.match(/const WORKLET = `([\s\S]*?)`;\n/); if (!m) throw new Error('geen WORKLET in ' + file); return m[1].replace(/\$\{WNAME\}/g, 'x'); }
function load(src, sr = SR) {
  let Cls = null; globalThis.sampleRate = sr; globalThis.currentTime = 0;
  class AWP { constructor() { this.port = { postMessage: m => { (this.msgs ||= []).push(m); }, onmessage: null }; } }
  const lib = new Function('AudioWorkletProcessor', 'registerProcessor', src + '\nreturn { FFT, Yin, GrainEngine, PVEngine, st2r };')(AWP, (n, c) => { Cls = c; });
  return { lib, make() { const p = new Cls(); p.send = d => p.port.onmessage && p.port.onmessage({ data: d }); return p; } };
}
function run(p, inL, inR, hook) {
  const n = inL.length, oL = new Float32Array(n), oR = new Float32Array(n);
  for (let s = 0; s < n; s += 128) {
    const len = Math.min(128, n - s); globalThis.currentTime = s / SR;
    const O = [[new Float32Array(len), new Float32Array(len)]];
    p.process([[inL.subarray(s, s + len), inR.subarray(s, s + len)]], O, {}); oL.set(O[0][0], s); oR.set(O[0][1], s);
    if (hook) hook(s, p);
  }
  return [oL, oR];
}
const cents = (a, b) => 1200 * Math.log2(a / b), mid = f => 69 + 12 * Math.log2(f / 440), hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 1; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
function sine(f, n, a = 0.3) { const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = a * Math.sin(2 * Math.PI * f * i / SR); return x; }
function saw(f, n, a = 0.3) { const x = new Float32Array(n), K = Math.floor(Math.min(12000, SR / 2 - 500) / f); for (let k = 1; k <= K; k++) { const w = 2 * Math.PI * f * k / SR, g = a * 0.6366 / k; for (let i = 0; i < n; i++) x[i] -= g * Math.sin(w * i); } return x; }
function chord(f, n) { const x = new Float32Array(n); [1, 1.25, 1.5].forEach(m => { const w = 2 * Math.PI * f * m / SR; for (let i = 0; i < n; i++) x[i] += 0.12 * Math.sin(w * i); }); return x; }
// zangachtig: pulstrein door drie parallelle resonatoren (a-klinker: ca. 650, 1100 en 2500 Hz); de omhullende ligt vast, ongeacht f0
function voice(f0fn, n) {
  const x = new Float32Array(n); let ph = 0; const F = [[650, 80, 1], [1100, 90, 0.7], [2500, 140, 0.3]], st = F.map(() => [0, 0]), co = F.map(([fc, bw]) => { const r = Math.exp(-Math.PI * bw / SR), c = 2 * r * Math.cos(2 * Math.PI * fc / SR); return [c, -r * r]; });
  for (let i = 0; i < n; i++) { ph += f0fn(i) / SR; let pulse = 0; if (ph >= 1) { ph -= 1; pulse = 1; } let o = 0; for (let k = 0; k < 3; k++) { const s = st[k], v = pulse * F[k][2] * 0.05 + co[k][0] * s[0] + co[k][1] * s[1]; s[1] = s[0]; s[0] = v; o += v; } x[i] = o * 4; }
  return x;
}
function addNoise(x, snrDb) { let e = 0; for (const v of x) e += v * v; const sg = Math.sqrt(e / x.length) / Math.pow(10, snrDb / 20); const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] + sg * gauss(); return y; }
function spec(lib, x, n = 1 << 16) {
  const f = new lib.FFT(n), re = new Float64Array(n), im = new Float64Array(n), s = Math.max(0, x.length - n), L = Math.min(n, x.length);
  for (let i = 0; i < L; i++) { const t = i / L, w = 0.35875 - 0.48829 * Math.cos(2 * Math.PI * t) + 0.14128 * Math.cos(4 * Math.PI * t) - 0.01168 * Math.cos(6 * Math.PI * t); re[i] = x[s + i] * w; }
  f.run(re, im, false); const m = new Float64Array(n / 2); for (let k = 0; k < n / 2; k++) m[k] = re[k] * re[k] + im[k] * im[k]; return { m, n, L };
}
function peakNear(lib, x, fe, tol = 0.04) {
  const { m, n } = spec(lib, x); let lo = Math.max(2, Math.floor(fe * (1 - tol) * n / SR)), hi = Math.min(n / 2 - 3, Math.ceil(fe * (1 + tol) * n / SR)), b = lo;
  for (let k = lo; k <= hi; k++) if (m[k] > m[b]) b = k;
  const a = Math.log(m[b - 1] + 1e-30), c = Math.log(m[b] + 1e-30), d = Math.log(m[b + 1] + 1e-30);
  return { f: (b + 0.5 * (a - d) / (a - 2 * c + d)) * SR / n, bin: b, m, n };
}
// ruis plus vervorming rond de grondtoon, in dB t.o.v. de grondtoon (alles buiten ±6 bins van de grondtoon en zijn harmonischen op fe*k telt niet mee als harmonische: THD+N)
function thdn(lib, x, fe) { const { m, n } = spec(lib, x); const b = Math.round(fe * n / SR); let sig = 0, tot = 0; for (let k = 3; k < n / 2; k++) tot += m[k]; for (let k = b - 6; k <= b + 6; k++) sig += m[k]; return 10 * Math.log10(Math.max(1e-30, tot - sig) / sig); }
const stats = a => { const s = a.slice().sort((x, y) => x - y); return { mean: a.reduce((p, q) => p + q, 0) / a.length, p99: s[Math.floor(s.length * 0.99)], max: s[s.length - 1] }; };
function lagOf(lib, ref, out, maxLag) {  // kruiscorrelatie via FFT; positieve lag = uitgang loopt achter
  let n = 1; while (n < ref.length + maxLag + 8) n <<= 1; const f = new lib.FFT(n), ar = new Float64Array(n), ai = new Float64Array(n), br = new Float64Array(n), bi = new Float64Array(n);
  for (let i = 0; i < ref.length; i++) ar[i] = ref[i]; for (let i = 0; i < Math.min(out.length, n); i++) br[i] = out[i]; f.run(ar, ai, false); f.run(br, bi, false);
  for (let k = 0; k < n; k++) { const r = br[k] * ar[k] + bi[k] * ai[k], i2 = bi[k] * ar[k] - br[k] * ai[k]; br[k] = r; bi[k] = i2; } f.run(br, bi, true);
  let best = 0, bv = -1e30; for (let l = 0; l <= maxLag; l++) if (br[l] > bv) { bv = br[l]; best = l; } return best;
}
function envOf(x, win = 240) { const y = new Float64Array(x.length); let a = 0; const k = 1 / win; for (let i = 0; i < x.length; i++) { a += k * (Math.abs(x[i]) - a); y[i] = a; } return y; }
const fmt = (v, d = 2) => (v >= 0 ? '+' : '') + v.toFixed(d);
const out = [];
const log = (...a) => { const s = a.join(' '); console.log(s); out.push(s); };

// ---------- eigen synthmateriaal ----------
function synthMaterial() {
  const mat = {};
  for (const [name, file] of [['piano', 'devices/synths/Piano/piano.patchkamer-device.js'], ['guitar', 'devices/synths/Guitar/guitar.patchkamer-device.js']]) {
    const t = readFileSync(resolve(file), 'utf8'); let Cls = null;
    // het apparaat is een module: neem alles voor 'export default' en laat de WORKLET-tekst (met zijn sjabloon-waarden) uitrekenen
    const wsrc = new Function(t.slice(0, t.indexOf('export default')) + '\nreturn WORKLET;')().replace(/registerProcessor\([^,]+,/, 'registerProcessor("x",');
    globalThis.sampleRate = SR; globalThis.currentTime = 0; class AWP { constructor() { this.port = { postMessage() { }, onmessage: null }; } }
    new Function('AudioWorkletProcessor', 'registerProcessor', wsrc)(AWP, (n, c) => { Cls = c; });
    const p = new Cls(), notes = name === 'piano' ? [48, 55, 60, 64, 69, 72, 76, 81] : [40, 45, 50, 55, 59, 64], seg = 1.6, n = Math.round(SR * (0.1 + seg * notes.length)), L = new Float32Array(n);
    notes.forEach((nt, i) => p.port.onmessage({ data: { type: 'note', note: nt, vel: 0.8, t: 0.1 + i * seg, dur: seg * 0.85 } }));
    for (let s = 0; s < n; s += 128) { const len = Math.min(128, n - s), l = new Float32Array(len), r = new Float32Array(len); globalThis.currentTime = s / SR; p.process([], [[l, r]], {}); L.set(l, s); }
    mat[name] = { x: L, notes, seg, t0: 0.1 };
  }
  if (matDir && existsSync(resolve(matDir, 'singer.f32'))) { const b = readFileSync(resolve(matDir, 'singer.f32')); mat.singer = { x: new Float32Array(b.buffer, b.byteOffset, b.length / 4), notes: [57, 60, 64, 62, 55, 67, 48, 72], seg: 1.5, t0: 0.2 }; }
  return mat;
}

// ---------- Pitch Shifter ----------
function shifter() {
  const W = load(workletSrc(DEV.shifter)), lib = W.lib; log('\n=== Pitch Shifter ===');
  const n = SR * 2.4, SIG = { sine: f => sine(f, n), saw: f => saw(f, n), chord: f => chord(f, n) };
  const INTS = [-24, -12, -7, -3, -1, 0.5, 1, 3, 5.5, 7, 12, 19, 24];
  log('Toonhoogtefout (cent) en artefactniveau over 13 intervallen (-24 ... +24 st, ook 0,5 en 5,5) en grondtonen 110, 220 en 440 Hz; THD+N van een verschoven sinus (alles buiten de grondtoon, dB t.o.v. de grondtoon; formantbehoud uit):');
  for (const [mode, win, name] of [[1, 1, 'Korrel normaal'], [1, 0, 'Korrel snel'], [2, 1, 'Vocoder normaal'], [2, 0, 'Vocoder snel'], [2, 2, 'Vocoder hoog']]) {
    for (const sg of ['sine', 'saw', 'chord']) {
      const errs = [], dbs = [];
      for (const f of (sg === 'chord' ? [220, 440] : [110, 220, 440])) for (const st of INTS) {
        const fe = f * Math.pow(2, st / 12), x = SIG[sg](f), p = W.make(); p.send({ type: 'cfg', c: { mode, win, st, mix: 1, glide: 0, fa: 0, fs: 0, fb: 0 } });
        const [y] = run(p, x, x);
        (sg === 'chord' ? [1, 1.25, 1.5] : [1]).forEach(mu => { const e = peakNear(lib, y.subarray(SR * 0.8), f * mu * Math.pow(2, st / 12), 0.03); errs.push(Math.abs(cents(e.f, f * mu * Math.pow(2, st / 12)))); });
        if (sg === 'sine') dbs.push(thdn(lib, y.subarray(SR * 0.8), fe));
      }
      const s = stats(errs); log(`  ${name.padEnd(16)} ${sg.padEnd(6)} fout gemiddeld ${s.mean.toFixed(2)} ct, p99 ${s.p99.toFixed(2)} ct, max ${s.max.toFixed(2)} ct` + (dbs.length ? `  | THD+N gemiddeld ${(dbs.reduce((a, b) => a + b, 0) / dbs.length).toFixed(1)} dB (beste ${Math.min(...dbs).toFixed(1)}, slechtste ${Math.max(...dbs).toFixed(1)})` : '') + (sg === 'chord' ? '  (akkoord van 3 sinussen; bij lage toonhoogte en grote afstand vloeien pieken ineen)' : ''));
    }
  }
  // formantbehoud aan op een sinus: het niveau valt (er is geen omhullende die de toon nabootst)
  { const x = sine(220, n), lvl = fa => { const p = W.make(); p.send({ type: 'cfg', c: { mode: 2, win: 1, st: 7, mix: 1, glide: 0, fa } }); const [y] = run(p, x, x); let e = 0; for (let i = SR; i < y.length; i++) e += y[i] * y[i]; return 10 * Math.log10(e / (y.length - SR) / (0.3 * 0.3 / 2)); };
    log(`  Vocoder normaal, sinus +7 st: uitgangsniveau t.o.v. de ingang met formantbehoud 0%: ${lvl(0).toFixed(1)} dB, 50%: ${lvl(0.5).toFixed(1)} dB, 100%: ${lvl(1).toFixed(1)} dB (een zuivere toon heeft geen formanten: zet het behoud lager)`); }
  // percussieve motor: de korrels zijn niet aansluitend, dus meet de gemiddelde frequentie met nuldoorgangen (sinus, laatste seconde)
  { const errs = [];
    for (const win of [0, 1, 2]) for (const st of [-12, -5, 5, 7, 12]) for (const f of [220, 440]) {
      const x = sine(f, SR * 2), p = W.make(); p.send({ type: 'cfg', c: { mode: 0, win, st, mix: 1, glide: 0 } }); const [y] = run(p, x, x);
      let zc = 0; for (let i = SR + 1; i < y.length; i++) if ((y[i - 1] < 0) !== (y[i] < 0)) zc++; errs.push(cents(zc / 2 / ((y.length - SR) / SR), f * Math.pow(2, st / 12)));
    }
    log(`  Percussief (3 vensters, gemiddelde frequentie via nuldoorgangen, sinus): gemiddelde fout ${(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(1)} ct, grootste ${Math.max(...errs.map(Math.abs)).toFixed(1)} ct; de toon is ruw (korrels sluiten niet aan): bedoeld voor drums`);
  }
  // latentie
  log('Latentie (kruiscorrelatie met witte ruis, st=0; envelop bij ±12 st):');
  for (const [mode, win, name] of [[0, 0, 'Percussief snel'], [0, 1, 'Percussief normaal'], [0, 2, 'Percussief hoog'], [1, 0, 'Korrel snel'], [1, 1, 'Korrel normaal'], [1, 2, 'Korrel hoog'], [2, 0, 'Vocoder snel'], [2, 1, 'Vocoder normaal'], [2, 2, 'Vocoder hoog']]) {
    const nn = SR * 2, x = new Float32Array(nn); for (let i = 0; i < nn; i++) x[i] = 0.3 * gauss();
    const p = W.make(); p.send({ type: 'cfg', c: { mode, win, st: 0, mix: 1, glide: 0 } }); const [y] = run(p, x, x); const l0 = lagOf(lib, x, y, 9000);
    // bursttrein voor de envelop bij ±12
    const bx = new Float32Array(SR * 4); for (let i = 0; i < bx.length; i++) bx[i] = ((i / 4800) | 0) % 8 === 0 ? 0.3 * gauss() : 0;
    const lat = st => { const q = W.make(); q.send({ type: 'cfg', c: { mode, win, st, mix: 1, glide: 0 } }); const [o] = run(q, bx, bx); return lagOf(lib, envOf(bx), envOf(o), 9000); };
    const a = lat(12), b = lat(-12);
    log(`  ${name.padEnd(19)} st=0: ${l0} samples = ${(1000 * l0 / SR).toFixed(1)} ms | melding ${(1000 * p.lat / SR).toFixed(1)} ms | envelop +12 st: ${(1000 * a / SR).toFixed(1)} ms, -12 st: ${(1000 * b / SR).toFixed(1)} ms`);
  }
  // rekenlast
  log('Rekenlast (stereo ruis, blokken van 128, budget 2,67 ms; gemiddeld / p99 / max in % van het budget):');
  for (const [mode, win, name, fb] of [[0, 1, 'Percussief normaal', 0], [1, 1, 'Korrel normaal', 0], [1, 2, 'Korrel hoog', 0], [2, 0, 'Vocoder snel', 0], [2, 1, 'Vocoder normaal', 0], [2, 2, 'Vocoder hoog', 0], [2, 1, 'Vocoder normaal + terugkoppeling 0,6', 0.6]]) {
    const p = W.make(); p.send({ type: 'cfg', c: { mode, win, st: 7, mix: 0.7, glide: 20, fb, fa: 1 } }); const nb = 5200, t = []; const I = [[new Float32Array(128), new Float32Array(128)]], O = [[new Float32Array(128), new Float32Array(128)]];
    for (let b = 0; b < nb; b++) { for (let i = 0; i < 128; i++) { I[0][0][i] = 0.3 * gauss(); I[0][1][i] = 0.3 * gauss(); } const t0 = process.hrtime.bigint(); p.process(I, O, {}); const d = Number(process.hrtime.bigint() - t0) / 1000; if (b >= 400) t.push(d); }
    const s = stats(t); log(`  ${name.padEnd(38)} ${(100 * s.mean / BUDGET_US).toFixed(1)}% / ${(100 * s.p99 / BUDGET_US).toFixed(1)}% / ${(100 * s.max / BUDGET_US).toFixed(1)}%`);
  }
  robust(W, 'Pitch Shifter', { mode: [0, 2], win: [0, 2], st: [-36, 36], fa: [0, 1], fs: [-12, 12], mix: [0, 1], fb: [0, 0.92], fbtone: [200, 20000], glide: [0, 2000] });
  // formantbehoud: sterkste harmonische tussen 300 en 1500 Hz van een a-klinker (F1 ca. 650 Hz), f0 130 Hz, na +7 st
  { log('Formantbehoud (a-klinker met F1 ca. 650 Hz, f0 130 Hz, +7 st): frequentie van de sterkste harmonische tussen 300 en 1500 Hz; zonder behoud schuift F1 mee naar ca. 975 Hz:');
    const nn = SR * 3, x = voice(() => 130, nn), top = y => { const { m, n } = spec(lib, y); let b = 0; for (let k = Math.floor(300 * n / SR); k < 1500 * n / SR; k++) if (m[k] > m[b] || b === 0) b = k; return b * SR / n; };
    log(`  invoer: ${top(x).toFixed(0)} Hz`);
    for (const [mode, fa, name] of [[1, 0, 'Korrel (geen behoud)'], [2, 0, 'Vocoder, behoud 0%'], [2, 1, 'Vocoder, behoud 100%']]) { const p = W.make(); p.send({ type: 'cfg', c: { mode, win: 1, st: 7, mix: 1, glide: 0, fa } }); const [y] = run(p, x, x); log(`  ${name.padEnd(24)} ${top(y.subarray(SR)).toFixed(0)} Hz`); }
  }
  material(W, 'shifter');
}

// ---------- robuustheid ----------
function robust(W, name, ranges, extra = () => { }) {
  seed = 7; const bad = [], N = 40; let nonfinite = 0, recovered = 0;
  for (let r = 0; r < N; r++) {
    const c = {}; for (const k in ranges) { const [a, b] = ranges[k]; const u = rnd(); c[k] = u < 0.3 ? a : u < 0.6 ? b : a + rnd() * (b - a); } extra(c);
    const p = W.make(); p.send({ type: 'cfg', c }); const n = SR * 3, x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = 0.5 * Math.sin(2 * Math.PI * (150 + 150 * rnd()) * i / SR) + 0.1 * gauss();
    const burst = [NaN, Infinity, -Infinity, 1e9, 1e30, -1e30, 1e38]; for (let b = 0; b < 6; b++) { const at = Math.floor((0.3 + 0.2 * b) * SR) + (rnd() * 4000 | 0); for (let i = 0; i < 40; i++) x[at + i] = burst[(b + i) % burst.length]; }
    const [l, rr] = run(p, x, x); let nf = 0; for (let i = 0; i < n; i++) if (!Number.isFinite(l[i]) || !Number.isFinite(rr[i]) || Math.abs(l[i]) > 1e3) nf++; nonfinite += nf;
    // terugkomen: 1,4 s na de laatste burst op een schone sinus
    const y = new Float32Array(SR * 2); for (let i = 0; i < y.length; i++) y[i] = 0.3 * Math.sin(2 * Math.PI * 200 * i / SR);
    const [yl] = run(p, y, y); let e = 0; for (let i = SR; i < y.length; i++) e += yl[i] * yl[i]; const rms = Math.sqrt(e / SR);
    // referentie: dezelfde instelling op dezelfde schone sinus zonder bursts; het geluid is terug als het niveau er redelijk bij past
    const q = W.make(); q.send({ type: 'cfg', c }); const [rl] = run(q, y, y); let e2 = 0; for (let i = SR; i < y.length; i++) e2 += rl[i] * rl[i]; const ref = Math.sqrt(e2 / SR);
    if (ref < 1e-4 ? rms < 1e-3 : (rms > 0.4 * ref && rms < 2.5 * ref)) recovered++; else bad.push(JSON.stringify(c) + ` rms ${rms.toFixed(3)} ref ${ref.toFixed(3)}`);
  }
  log(`Robuustheid ${name}: ${N} willekeurige/extreme instellingen met bursts van NaN, ±Infinity, ±1e9, ±1e30: niet-eindige of absurde samples ${nonfinite}; geluid terug na de bursts in ${recovered}/${N}` + (bad.length ? ' | NIET TERUG: ' + bad.slice(0, 3).join(' ') : ''));
}

// ---------- materiaal ----------
let MAT = null;
function material(W, kind) {
  MAT ||= synthMaterial(); const lib = W.lib;
  if (kind === 'shifter') {
    // de toonhoogte van synthnoten heeft vibrato en inharmoniciteit; meet daarom met een onafhankelijke YIN en vergelijk de mediaan van de uitvoer met die van de ingang
    const track = y => { const yn = new lib.Yin(SR), r = []; for (let s = 0; s < y.length; s += 128) { for (let i = s; i < Math.min(y.length, s + 128); i++) yn.push(y[i]); const f = yn.detect(); r.push(f > 0 && yn.conf > 0.6 ? mid(f) : -1); } return r; };
    const med = a => { a = a.filter(v => v > 0).sort((p, q) => p - q); return a.length ? a[a.length >> 1] : NaN; };
    log('Op eigen synthgeluid (Piano, Guitar' + (MAT.singer ? ', Formant Singer' : '') + '), +7 st: mediaan van de gevolgde uitvoertoonhoogte min die van de ingang, min 700 ct (cent per noot; YIN op ingang en uitvoer):');
    for (const [key, d] of Object.entries(MAT)) for (const [mode, nm] of [[1, 'Korrel'], [2, 'Vocoder']]) {
      const errs = []; d.notes.forEach((nt, i) => {
        const a = Math.round(SR * (d.t0 + i * d.seg)), b = a + Math.round(SR * d.seg * 0.8), seg = d.x.subarray(a, b); const p = W.make(); p.send({ type: 'cfg', c: { mode, win: 1, st: 7, mix: 1, glide: 0, fa: 1 } });
        const [y] = run(p, seg, seg), k0 = Math.round(0.55 * SR / 128); errs.push(100 * (med(track(y).slice(k0)) - med(track(seg).slice(k0))) - 700);
      });
      log(`  ${key.padEnd(7)} ${nm.padEnd(8)} ${errs.map(e => fmt(e, 1)).join(' ')}  | max |fout| ${Math.max(...errs.map(Math.abs)).toFixed(1)} ct`);
    }
  }
}

// ---------- Harmonizer ----------
function harmonizer() {
  const W = load(workletSrc(DEV.harmonizer)), lib = W.lib; log('\n=== Harmonizer ===');
  const n = SR * 3;
  for (const [mode, name] of [[0, 'Korrel'], [1, 'Vocoder']]) {
    for (const sg of ['sine', 'saw']) {
      const errs = [], rows = [];
      for (const f of [110, 220, 440]) for (const iv of [-12, -7, -3, 3, 4, 7, 12]) {
        const x = sg === 'sine' ? sine(f, n) : saw(f, n), p = W.make();
        p.send({ type: 'cfg', c: { mode, win: 1, follow: 0, dry: 0, harm: 1, glide: 0, voices: [{ on: 1, iv, lv: 1, pan: 0, dt: 0, dly: 0 }, { on: 0 }, { on: 0 }, { on: 0 }] } });
        const [y] = run(p, x, x), fe = f * Math.pow(2, iv / 12), e = peakNear(lib, y.subarray(SR), fe, 0.04); errs.push(Math.abs(cents(e.f, fe)));
      }
      const s = stats(errs); log(`${name.padEnd(8)} ${sg.padEnd(5)} toonhoogtefout per stem (21 combinaties): gemiddeld ${s.mean.toFixed(2)} ct, max ${s.max.toFixed(2)} ct`);
    }
  }
  // toonladder: expected shifts. Bron A3 (57) in C majeur: graden +2 => C4 (+3 st), +4 => E4 (+7 st), -2 => F3 (-4), +7 => A4 (+12)
  const maskC = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
  const cases = [[57, 2, 3], [57, 4, 7], [57, -2, -4], [57, 7, 12], [60, 2, 4], [61, 1, 3], [66, 3, 6], [59, -1, -2]];  // 61 en 66 liggen buiten de toonladder: de bron wordt eerst omhoog naar de dichtstbijzijnde toonladdernoot gesnapt (gelijke afstand: de hogere)
  for (const [follow, nm] of [[2, 'noten (event)'], [1, 'detectie']]) {
    let ok = 0; const bad = [];
    for (const [src, deg, want] of cases) {
      const f = hz(src), x = sine(f, n), p = W.make(); p.send({ type: 'cfg', c: { mode: 1, win: 1, follow, mask: maskC, dry: 0, harm: 1, glide: 0, voices: [{ on: 1, iv: deg, lv: 1, pan: 0, dt: 0, dly: 0 }, { on: 0 }, { on: 0 }, { on: 0 }] } }); p.send({ type: 'note', note: src });
      const [y] = run(p, x, x), fe = hz(src + want), e = peakNear(lib, y.subarray(SR), fe, 0.04), err = cents(e.f, fe);
      if (Math.abs(err) < 5) ok++; else bad.push(`${src}/${deg}: ${err.toFixed(0)} ct`);
    }
    log(`Toonladder C majeur, bron via ${nm}: ${ok}/${cases.length} stemmen op de verwachte toonladdernoot (binnen 5 ct)` + (bad.length ? ' | afwijkend: ' + bad.join('; ') : ''));
  }
  // tijduitlijning
  log('Tijdsuitlijning (kruiscorrelatie met ruis): droog vs een stem op unisono en +7 st (envelop):');
  for (const [mode, name] of [[0, 'Korrel'], [1, 'Vocoder']]) {
    const nn = SR * 2, x = new Float32Array(nn); for (let i = 0; i < nn; i++) x[i] = 0.3 * gauss();
    const mk = (dry, iv) => { const p = W.make(); p.send({ type: 'cfg', c: { mode, win: 1, follow: 0, dry, harm: 1, glide: 0, voices: [{ on: 1, iv, lv: 1, pan: 0, dt: 0, dly: 0 }, { on: 0 }, { on: 0 }, { on: 0 }] } }); return p; };
    const pd = mk(1, 0); pd.send({ type: 'cfg', c: { harm: 0 } }); const [yd] = run(pd, x, x), ld = lagOf(lib, x, yd, 9000);
    const pu = mk(0, 0), [yu] = run(pu, x, x), lu = lagOf(lib, x, yu, 9000);
    const bx = new Float32Array(SR * 4); for (let i = 0; i < bx.length; i++) bx[i] = ((i / 4800) | 0) % 8 === 0 ? 0.3 * gauss() : 0;
    const p7 = mk(0, 7), [y7] = run(p7, bx, bx), l7 = lagOf(lib, envOf(bx), envOf(y7), 9000), lat = p7.T;
    log(`  ${name.padEnd(8)} droog ${(1000 * ld / SR).toFixed(1)} ms | stem unisono ${(1000 * lu / SR).toFixed(1)} ms | stem +7 st (envelop) ${(1000 * l7 / SR).toFixed(1)} ms | gemelde latentie ${(1000 * lat / SR).toFixed(1)} ms`);
  }
  log('Rekenlast (4 stemmen aan, ruis, scale-modus detectie; gemiddeld / p99 / max in % van 2,67 ms):');
  for (const [mode, win, name, nv, follow] of [[0, 1, 'Korrel normaal, 4 stemmen', 4, 0], [0, 1, 'Korrel normaal, 4 stemmen + detectie', 4, 1], [1, 0, 'Vocoder snel, 4 stemmen', 4, 0], [1, 1, 'Vocoder normaal, 4 stemmen', 4, 0], [1, 1, 'Vocoder normaal, 4 stemmen + detectie', 4, 1], [1, 2, 'Vocoder hoog, 4 stemmen', 4, 0], [1, 1, 'Vocoder normaal, 1 stem', 1, 0]]) {
    const p = W.make(); p.send({ type: 'cfg', c: { mode, win, follow, mask: maskC, dry: 1, harm: 1, glide: 40, fa: 1, voices: [0, 1, 2, 3].map(i => ({ on: i < nv ? 1 : 0, iv: [3, 5, -4, 12][i], lv: 0.7, pan: i / 2 - 0.75, dt: 5, dly: 10 })) } });
    const t = [], I = [[new Float32Array(128), new Float32Array(128)]], O = [[new Float32Array(128), new Float32Array(128)]];
    for (let b = 0; b < 5200; b++) { for (let i = 0; i < 128; i++) { const v = 0.3 * Math.sin(2 * Math.PI * 220 * (b * 128 + i) / SR) + 0.05 * gauss(); I[0][0][i] = v; I[0][1][i] = v; } const t0 = process.hrtime.bigint(); p.process(I, O, {}); const d = Number(process.hrtime.bigint() - t0) / 1000; if (b >= 400) t.push(d); }
    const s = stats(t); log(`  ${name.padEnd(40)} ${(100 * s.mean / BUDGET_US).toFixed(1)}% / ${(100 * s.p99 / BUDGET_US).toFixed(1)}% / ${(100 * s.max / BUDGET_US).toFixed(1)}%`);
  }
  robust(W, 'Harmonizer', { mode: [0, 1], win: [0, 2], follow: [0, 2], dry: [0, 1.5], harm: [0, 1.5], glide: [0, 2000], fa: [0, 1], hum: [0, 1] }, c => { c.voices = [0, 1, 2, 3].map(() => ({ on: rnd() < 0.8 ? 1 : 0, iv: Math.round(-48 + 96 * rnd()), lv: rnd(), pan: -1 + 2 * rnd(), dt: -100 + 200 * rnd(), dly: 100 * rnd() })); c.mask = Array.from({ length: 12 }, () => (rnd() < 0.5 ? 1 : 0)); });
}

// ---------- Pitch Correction ----------
function correction() {
  const W = load(workletSrc(DEV.correction)), lib = W.lib; log('\n=== Pitch Correction ===');
  const RANGEDEF = { low: [0, 70, 420], mid: [1, 80, 800], wide: [2, 150, 1000] };
  const allow = new Array(12).fill(1);
  // 1. detectie via de echte processor (p.detM per blok)
  log('Detectienauwkeurigheid (testset: 36 stemhoogten per bereik, logaritmisch verdeeld, willekeurige afwijking van ±50 ct; frames na 0,35 s; % binnen 10 en 50 ct van de ware toonhoogte, octaaffouten, % frames met toon):');
  for (const [rn, [ri, lo, hi]] of Object.entries(RANGEDEF)) {
    for (const [wf, cond] of [['sinus', 'schoon'], ['zaagtand', 'schoon'], ['zang', 'schoon'], ['zang', 'ruis 20 dB'], ['zang', 'ruis 10 dB'], ['zang', 'vibrato ±50 ct 5,5 Hz'], ['zaagtand', 'ruis 10 dB']]) {
      seed = 42; let tot = 0, w10 = 0, w50 = 0, oct = 0, voiced = 0, frames = 0;
      for (let j = 0; j < 36; j++) {
        const f0 = lo * Math.pow(hi / lo, j / 35) * Math.pow(2, (rnd() * 100 - 50) / 1200), n = SR * 1.4, vib = cond.startsWith('vibrato');
        const fi = i => f0 * (vib ? Math.pow(2, 50 * Math.sin(2 * Math.PI * 5.5 * i / SR) / 1200) : 1);
        let x = wf === 'sinus' ? (() => { const y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { ph += fi(i) / SR; y[i] = 0.3 * Math.sin(2 * Math.PI * ph); } return y; })()
          : wf === 'zaagtand' ? (() => { const y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { ph += fi(i) / SR; ph -= Math.floor(ph); y[i] = 0.3 * (2 * ph - 1); } return y; })() : voice(fi, n);
        if (cond.startsWith('ruis')) x = addNoise(x, +cond.split(' ')[1]);
        const p = W.make(); p.send({ type: 'cfg', c: { mode: 0, win: 1, range: ri, speed: 0, amount: 1, keep: 0, notes: allow, mix: 1, ref: 440, gate: 0.0005 } });
        run(p, x, x, (s, q) => { if (s < SR * 0.35) return; frames++; if (q.detM < 0) return; voiced++; const t = (s + 128) / SR - 0.017, ft = vib ? f0 * Math.pow(2, 50 * Math.sin(2 * Math.PI * 5.5 * t) / 1200) : f0, e = Math.abs(100 * (q.detM - mid(ft))); tot++; if (e <= 10) w10++; if (e <= 50) w50++; if (Math.abs(q.detM - mid(ft)) > 10) oct++; });
      }
      log(`  bereik ${rn.padEnd(4)} (${lo}-${hi} Hz) ${wf.padEnd(8)} ${cond.padEnd(23)} binnen 10 ct ${(100 * w10 / tot).toFixed(1)}%  binnen 50 ct ${(100 * w50 / tot).toFixed(1)}%  octaaf/grote fout ${(100 * oct / tot).toFixed(2)}%  frames met toon ${(100 * voiced / frames).toFixed(0)}%`);
    }
  }
  // 2. eind tot eind: uitgangstoonhoogte tegenover de dichtstbijzijnde noot, snelheid 0
  log('Correctie eind tot eind (chromatisch, snelheid 0, mate 100%, vibrato 0%): fout van de uitgangstoonhoogte t.o.v. de dichtstbijzijnde halve toon:');
  for (const [mode, nm] of [[0, 'Korrel'], [1, 'Vocoder']]) {
    for (const wf of ['sinus', 'zaagtand', 'zang']) {
      seed = 5; const errs = [], before = [];
      for (let j = 0; j < 24; j++) {
        const note = 45 + Math.floor(rnd() * 30), off = (rnd() * 70 - 35), f0 = hz(note + off / 100), n = SR * 1.6;
        const x = wf === 'sinus' ? sine(f0, n) : wf === 'zaagtand' ? saw(f0, n) : voice(() => f0, n);
        const p = W.make(); p.send({ type: 'cfg', c: { mode, win: 1, range: 1, speed: 0, amount: 1, keep: 0, notes: allow, mix: 1, fa: 1, ref: 440, gate: 0.0005 } });
        const [y] = run(p, x, x), e = peakNear(lib, y.subarray(Math.round(SR * 0.9)), hz(note), 0.04); errs.push(cents(e.f, hz(note))); before.push(Math.abs(off));
      }
      log(`  ${nm.padEnd(8)} ${wf.padEnd(8)} voor: gemiddeld ${(before.reduce((a, b) => a + b, 0) / before.length).toFixed(1)} ct afwijking; na: gemiddeld ${(errs.reduce((a, b) => a + Math.abs(b), 0) / errs.length).toFixed(2)} ct, max ${Math.max(...errs.map(Math.abs)).toFixed(2)} ct, binnen 10 ct ${(100 * errs.filter(e => Math.abs(e) <= 10).length / errs.length).toFixed(0)}%`);
    }
  }
  // 3. toonladder-snap
  const maskC = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
  { log('Toonladder-snap (C majeur, snelheid 0): invoer (MIDI-noot, met decimalen) -> verwachte doelnoot -> gemeten uitvoer:');
    const near = x => { let best = 0, bd = 1e9; for (let n = 40; n < 90; n++) if (maskC[n % 12]) { const d = Math.abs(n - x); if (d < bd) { bd = d; best = n; } } return best; };
    const cases = [60, 60.3, 60.6, 60.9, 61.1, 61.4, 62.4, 62.9, 63.1, 63.6, 65.4, 66.1, 66.6, 67.8, 68.1, 68.4, 69.2, 70.1, 70.8, 71.3].map(x => [x, near(x)]);
    const bad = [];
    for (const [inp, want] of cases) { const x = saw(hz(inp), SR * 1.6), p = W.make(); p.send({ type: 'cfg', c: { mode: 1, win: 1, range: 1, speed: 0, amount: 1, keep: 0, notes: maskC, mix: 1, fa: 1, ref: 440, gate: 0.0005 } });
      const [y] = run(p, x, x), e = peakNear(lib, y.subarray(Math.round(SR * 0.9)), hz(want), 0.06), err = cents(e.f, hz(want)); if (Math.abs(err) > 10) bad.push(`${inp}->${want}: ${err.toFixed(0)} ct`); }
    log(`  ${cases.length - bad.length}/${cases.length} binnen 10 ct van de verwachte toonladdernoot` + (bad.length ? ' | afwijkend: ' + bad.join('; ') : '')); // gevallen precies halverwege twee toonladdernoten zijn weggelaten (daar is de keuze willekeurig)
  }
  // 4. snelheid (stap van 40 ct), 5. vibratobehoud
  { log('Snelheid (invoer springt 40 ct naast een noot; tijd tot de correctie 90% van 40 ct heeft bereikt, gemeten aan de interne verschuiving):');
    for (const sp of [0, 20, 50, 100, 200]) {
      const f1 = hz(60), f2 = hz(60.4), n = SR * 2, x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { ph += (i < SR ? f1 : f2) / SR; x[i] = 0.3 * Math.sin(2 * Math.PI * ph); }
      // een noot van 60.0 naar 60.4 is binnen dezelfde noot, dus de correctie moet van 0 naar -40 ct gaan
      const p = W.make(); p.send({ type: 'cfg', c: { mode: 0, win: 1, range: 1, speed: sp, amount: 1, keep: 0, notes: new Array(12).fill(0).map((v, i) => (i === 0 ? 1 : 0)), mix: 1, ref: 440, gate: 0.0005 } });
      let tHit = null; run(p, x, x, (s, q) => { if (s >= SR && tHit === null && q.stc < -0.4 * 0.9) tHit = (s - SR) / SR * 1000; });
      log(`  snelheid ${String(sp).padStart(3)} ms: 90% na ${tHit === null ? '>1000' : tHit.toFixed(0)} ms (detectie bijdrage ~${(1000 * 128 / SR).toFixed(1)} ms per blok en ca. 20 ms venster)`);
    }
  }
  { log('Vibratobehoud (zang, f0 220 Hz met ±60 ct vibrato 5,5 Hz; uitvoertoonhoogte = detectie + verschuiving; standaardafwijking van de uitvoer t.o.v. die van de invoer):');
    for (const [keep, sp] of [[0, 0], [0, 20], [0.5, 0], [1, 0]]) {
      const n = SR * 3, f0 = 220, fi = i => f0 * Math.pow(2, 60 * Math.sin(2 * Math.PI * 5.5 * i / SR) / 1200), x = voice(fi, n), p = W.make();
      p.send({ type: 'cfg', c: { mode: 1, win: 1, range: 1, speed: sp, amount: 1, keep, notes: allow, mix: 1, ref: 440, gate: 0.0005 } });
      const a = [], b = []; run(p, x, x, (s, q) => { if (s > SR && q.detM >= 0) { a.push(q.detM); b.push(q.detM + q.stc); } });
      const sd = v => { const m = v.reduce((x, y) => x + y, 0) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length) * 100; };
      log(`  vibrato behouden ${Math.round(keep * 100)}%, snelheid ${sp} ms: invoer sd ${sd(a).toFixed(1)} ct, uitvoer sd ${sd(b).toFixed(1)} ct (${(100 * sd(b) / sd(a)).toFixed(0)}% behouden)`);
    }
  }
  // 6. onstemhebbend
  { log('Onstemhebbende stukken: stilte, ruis en een zeer korte toon; uitvoer t.o.v. de invoer (RMS-verhouding, niet-eindig aantal):');
    for (const [mode, nm] of [[0, 'Korrel'], [1, 'Vocoder']]) {
      const n = SR * 1, noise = new Float32Array(n); for (let i = 0; i < n; i++) noise[i] = 0.2 * gauss();
      const p = W.make(); p.send({ type: 'cfg', c: { mode, win: 1, range: 1, speed: 0, amount: 1, keep: 0, notes: allow, mix: 1, hold: 100, ref: 440 } });
      const [y] = run(p, noise, noise), rms = v => Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length); const sil = new Float32Array(n), [ys] = run(W.make(), sil, sil);
      log(`  ${nm.padEnd(8)} ruis: uitgangs-RMS / ingangs-RMS = ${(rms(y.subarray(SR * 0.5)) / rms(noise)).toFixed(2)}; stilte: max |uit| ${Math.max(...ys.map(Math.abs)).toExponential(1)}; niet-eindig ${y.filter(v => !Number.isFinite(v)).length}`);
    }
  }
  // 7. latentie, rekenlast
  log('Latentie (kruiscorrelatie met ruis, correctie neutraal):');
  for (const [mode, win, nm] of [[0, 0, 'Korrel snel'], [0, 1, 'Korrel normaal'], [0, 2, 'Korrel hoog'], [1, 0, 'Vocoder snel'], [1, 1, 'Vocoder normaal'], [1, 2, 'Vocoder hoog']]) {
    const nn = SR * 2, x = new Float32Array(nn); for (let i = 0; i < nn; i++) x[i] = 0.3 * gauss(); const p = W.make(); p.send({ type: 'cfg', c: { mode, win, amount: 0, mix: 1 } }); const [y] = run(p, x, x), l = lagOf(lib, x, y, 9000);
    log(`  ${nm.padEnd(16)} ${l} samples = ${(1000 * l / SR).toFixed(1)} ms (gemeld ${(1000 * p.lat / SR).toFixed(1)} ms)`);
  }
  log('Rekenlast (zang als invoer, blokken van 128; gemiddeld / p99 / max in % van 2,67 ms):');
  for (const [mode, win, nm] of [[0, 1, 'Korrel normaal'], [1, 0, 'Vocoder snel'], [1, 1, 'Vocoder normaal'], [1, 2, 'Vocoder hoog']]) {
    const nb = 5200, v = voice(() => 220, nb * 128), p = W.make(); p.send({ type: 'cfg', c: { mode, win, range: 1, speed: 20, amount: 1, keep: 0.5, notes: maskC, mix: 1, fa: 1 } }); const t = [], I = [[new Float32Array(128), new Float32Array(128)]], O = [[new Float32Array(128), new Float32Array(128)]];
    for (let b = 0; b < nb; b++) { I[0][0].set(v.subarray(b * 128, b * 128 + 128)); I[0][1].set(I[0][0]); const t0 = process.hrtime.bigint(); p.process(I, O, {}); const d = Number(process.hrtime.bigint() - t0) / 1000; if (b >= 400) t.push(d); }
    const s = stats(t); log(`  ${nm.padEnd(16)} ${(100 * s.mean / BUDGET_US).toFixed(1)}% / ${(100 * s.p99 / BUDGET_US).toFixed(1)}% / ${(100 * s.max / BUDGET_US).toFixed(1)}%`);
  }
  robust(W, 'Pitch Correction', { mode: [0, 1], win: [0, 2], speed: [0, 1000], amount: [0, 1], keep: [0, 1], fa: [0, 1], gate: [0, 1], hold: [0, 1000], range: [0, 2], mix: [0, 1], ref: [400, 480] }, c => { c.notes = Array.from({ length: 12 }, () => (rnd() < 0.5 ? 1 : 0)); });
  // 8. eigen materiaal: de uitgangstoonhoogte wordt gevolgd met een onafhankelijke YIN op de uitvoer (de toon van de synths heeft vibrato of lichte afwijkingen)
  MAT ||= synthMaterial();
  const track = y => { const yn = new lib.Yin(SR), r = []; for (let s = 0; s < y.length; s += 128) { for (let i = s; i < Math.min(y.length, s + 128); i++) yn.push(y[i]); const f = yn.detect(); r.push(f > 0 && yn.conf > 0.6 ? mid(f) : -1); } return r; };
  log('Op eigen synthgeluid (' + Object.keys(MAT).join(', ') + '): correctie eind tot eind (chromatisch, snelheid 0, vibrato 0%, Vocoder normaal, 440 Hz). Uitvoertoonhoogte gevolgd met een onafhankelijke YIN (frames 0,55 s na de start van de noot); % binnen 10 ct van de dichtstbijzijnde halve toon, voor en na, en detectie op de ingang t.o.v. de gespeelde noot:');
  for (const [key, d] of Object.entries(MAT)) {
    let tot = 0, w10 = 0, w50 = 0, voiced = 0, frames = 0, oa = 0, ob = 0, on = 0, ia = 0, ib = 0, ino = 0;
    d.notes.forEach((nt, i) => {
      const a = Math.round(SR * (d.t0 + i * d.seg)), b = a + Math.round(SR * d.seg * 0.8), seg = d.x.subarray(a, b), p = W.make();
      p.send({ type: 'cfg', c: { mode: 1, win: 1, range: 1, speed: 0, amount: 1, keep: 0, notes: allow, mix: 1, ref: 440, fa: 1, gate: 0.0005 } });
      const [y] = run(p, seg, seg, (s, q) => { if (s < SR * 0.35) return; frames++; if (q.detM < 0) return; voiced++; tot++; const e = Math.abs(100 * (q.detM - nt)); if (e <= 10) w10++; if (e <= 50) w50++; });
      const first = Math.round(0.55 * SR / 128);
      track(y).forEach((m, k) => { if (k < first || m < 0) return; const e = Math.abs(100 * (m - Math.round(m))); on++; if (e <= 10) oa++; });
      track(seg).forEach((m, k) => { if (k < first || m < 0) return; const e = Math.abs(100 * (m - Math.round(m))); ino++; if (e <= 10) ia++; });
    });
    log(`  ${key.padEnd(7)} detectie t.o.v. de gespeelde noot: binnen 10 ct ${(100 * w10 / Math.max(1, tot)).toFixed(0)}%, binnen 50 ct ${(100 * w50 / Math.max(1, tot)).toFixed(0)}%, frames met toon ${(100 * voiced / frames).toFixed(0)}% | op een halve toon (10 ct): ingang ${(100 * ia / Math.max(1, ino)).toFixed(0)}% -> uitvoer ${(100 * oa / Math.max(1, on)).toFixed(0)}%`);
  }
}

if (which === 'all' || which === 'shifter') shifter();
if (which === 'all' || which === 'harmonizer') harmonizer();
if (which === 'all' || which === 'correction') correction();
