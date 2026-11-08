// SPDX-License-Identifier: AGPL-3.0-or-later
// Metingen aan het effect Delay, offline in Node (geen browser, niets beluisterd).
// Gebruik, vanuit de root van de repo:  node docs/tools/measure-delay.mjs [sectie ...]
// Secties: time sync tempo swing decay filters stable nan modes reverse click presets load  (zonder argument: alle)
// Het apparaat wordt geladen met een nep-AudioContext; de echte worklet-code draait in Node, blok voor blok van 128 samples.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SR = 48000, BLK = 128;
globalThis.sampleRate = SR; globalThis.currentTime = 0;
let ProcClass = null;
globalThis.AudioWorkletProcessor = class { constructor() { this.port = { onmessage: null, postMessage() {} }; } };
globalThis.registerProcessor = (n, c) => { ProcClass = c; };
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : (k === 'value' ? 0 : chain()), apply: () => chain(), set: () => true });
globalThis.AudioWorkletNode = class {
  constructor() { this.proc = new ProcClass(); this.port = { onmessage: null, postMessage: m => this.proc.port.onmessage && this.proc.port.onmessage({ data: JSON.parse(JSON.stringify(m)) }) }; this.proc.port.postMessage = m => this.port.onmessage && this.port.onmessage({ data: m }); this.connect = () => {}; this.disconnect = () => {}; }
};
const ctx = new Proxy({ sampleRate: SR, currentTime: 0, state: 'running', audioWorklet: { addModule: async () => {} } }, { get: (t, k) => k in t ? t[k] : chain() });
const def = (await import(pathToFileURL(resolve('devices/effects/Delay/delay.patchkamer-device.js')).href)).default;

// een apparaat met zijn worklet; host.bpm en host.swing zijn aan te passen
async function rig(state = {}, hostOver = {}) {
  let nodeRef = null;
  const origNode = globalThis.AudioWorkletNode;
  const host = { lang: 'en', bpm: 120, swing: 0, loadWorklet: async (n, c) => { (0, eval)(c); return true; }, frame: () => () => {}, ...hostOver };
  const inst = def.create(ctx, host);
  inst.setState({ mix: 1, fb: 0, hp: 20, lp: 20000, ...state });   // zoals de host: eerst de state, de worklet start daarna
  await new Promise(r => setTimeout(r, 5));
  // de nep-node staat verstopt in de worklet-lader; haal de processor via een eigen AudioWorkletNode-instantie
  const proc = lastProc;
  return { inst, host, proc, state: s => inst.setState({ ...inst.getState(), ...s }) };
}
let lastProc = null;
{ const C = globalThis.AudioWorkletNode; globalThis.AudioWorkletNode = class extends C { constructor(...a) { super(...a); lastProc = this.proc; } }; }

// render n samples met invoerfuncties fl(i), fr(i); geeft [L, R]
function render(r, n, fl, fr, hook) {
  const L = new Float32Array(n), R = new Float32Array(n), a = new Float32Array(BLK), b = new Float32Array(BLK), oa = new Float32Array(BLK), ob = new Float32Array(BLK);
  for (let i = 0; i < n; i += BLK) {
    if (hook) hook(i);
    const m = Math.min(BLK, n - i);
    for (let k = 0; k < BLK; k++) { a[k] = fl ? fl(i + k) : 0; b[k] = fr ? fr(i + k) : (fl ? fl(i + k) : 0); }
    r.proc.process([[a, b]], [[oa, ob]]);
    L.set(oa.subarray(0, m), i); R.set(ob.subarray(0, m), i);
  }
  return [L, R];
}
const peakAt = (x, from, to) => { let m = 0, k = from; for (let i = from; i < to; i++) { const a = Math.abs(x[i]); if (a > m) { m = a; k = i; } } return [k, m]; };
// fractionele piekpositie met parabolische interpolatie
function peakFrac(x, from, to) { const [k] = peakAt(x, from, to); const a = Math.abs(x[k - 1]), b = Math.abs(x[k]), c = Math.abs(x[k + 1]); const d = a - 2 * b + c; return k + (d ? 0.5 * (a - c) / d : 0); }
const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / (b - a)); };
const db = v => 20 * Math.log10(v + 1e-20);
const impulse = at => i => i === at ? 1 : 0;
const hdr = t => console.log('\n== ' + t + ' ==');
let fails = 0; const check = (ok, msg) => { if (!ok) { fails++; console.log('  MISLUKT: ' + msg); } };

// vergelijkbaar met de eigen formule van het apparaat, maar onafhankelijk opgebouwd uit tellen van tellen
const beatsOf = (den, feel) => (4 / den) * (feel === 'dotted' ? 1.5 : feel === 'triplet' ? 2 / 3 : 1);
async function measureOne(cfg, hostBpm, expectedSec, hostOver) {
  const r = await rig(cfg, { bpm: hostBpm, ...hostOver });
  const at = 2000, n = Math.round(expectedSec * SR) + 6000;
  const [L, R] = render(r, n, impulse(at));
  r.inst.destroy();
  return [peakFrac(L, at + 20, n - 10) - at, peakFrac(R, at + 20, n - 10) - at];
}

const sections = {
  async time() {
    hdr('Vrije tijd (ms): gemeten tegen ingesteld, in samples (48 kHz). De lusfilters (HP 20 Hz, LP 20 kHz) leveren een vaste vertraging; die is eraf gehaald met een referentie van 100 ms');
    const refM = (await measureOne({ timing: 'free', msL: 100 }, 120, 0.1))[0] - 4800;
    console.log('  filtervertraging (referentie 100 ms): ' + refM.toFixed(3) + ' samples = ' + (refM / SR * 1e6).toFixed(1) + ' µs');
    let worst = 0;
    for (const ms of [1, 5, 10, 33.3, 100, 250, 375, 1000, 1234.5, 2500, 4000]) {
      const [m] = await measureOne({ timing: 'free', msL: ms }, 120, ms / 1000);
      const e = m - refM - ms * SR / 1000; worst = Math.max(worst, Math.abs(e));
      console.log('  ' + String(ms).padStart(7) + ' ms: gemeten ' + ((m - refM) / SR * 1000).toFixed(4) + ' ms, fout ' + e.toFixed(3) + ' samples');
    }
    console.log('  grootste fout: ' + worst.toFixed(3) + ' samples (' + (worst / SR * 1e6).toFixed(1) + ' µs)'); check(worst < 0.1, 'vrije tijd wijkt meer dan 0,1 sample af');
    this.ref = refM;
  },
  async sync() {
    hdr('Sync op de klok van de host: alle notenwaarden en soorten bij 8 tempi, gemeten tegen de formule 60/bpm x kwartnoten');
    const refM = (await measureOne({ timing: 'free', msL: 100 }, 120, 0.1))[0] - 4800;
    let worst = 0, count = 0, big = 0;
    const notes = [['2bar', 0, 32 / 4 * 4 / 4], ['1bar', 0, 4], ['1/2', 2, 2], ['1/4', 4, 1], ['1/8', 8, 0.5], ['1/16', 16, 0.25], ['1/32', 32, 0.125], ['1/64', 64, 0.0625]];
    for (const bpm of [60, 90, 100, 120, 126, 140, 174, 200]) {
      for (const [div, den] of [['2bar', 0], ['1bar', 1], ['1/2', 2], ['1/4', 4], ['1/8', 8], ['1/16', 16], ['1/32', 32], ['1/64', 64]]) for (const feel of ['straight', 'dotted', 'triplet']) {
        const beats = div === '2bar' ? 8 * (feel === 'dotted' ? 1.5 : feel === 'triplet' ? 2 / 3 : 1) : beatsOf(den, feel);
        const sec = beats * 60 / bpm; if (sec > 8) { big++; continue; }
        const [m] = await measureOne({ timing: 'sync', divL: div, feelL: feel, linked: true }, bpm, sec);
        const e = m - refM - sec * SR; worst = Math.max(worst, Math.abs(e)); count++;
      }
      for (const st of [3, 5, 7]) { const sec = st / 4 * 60 / bpm; const [m] = await measureOne({ timing: 'sync', divL: 'steps', stepsL: st, feelL: 'straight' }, bpm, sec); const e = m - refM - sec * SR; worst = Math.max(worst, Math.abs(e)); count++; }
    }
    console.log('  ' + count + ' combinaties gemeten (' + big + ' langer dan 8 s overgeslagen: die worden gehalveerd), grootste fout ' + worst.toFixed(3) + ' samples = ' + (worst / SR * 1e6).toFixed(1) + ' µs');
    check(worst < 0.1, 'sync-tijd wijkt meer dan 0,1 sample af');
    // lange tijden: 2 maten bij 40 BPM = 12 s, wordt gehalveerd naar 6 s
    const [m] = await measureOne({ timing: 'sync', divL: '2bar', feelL: 'straight' }, 40, 6);
    console.log('  2 maten bij 40 BPM (12 s): gehalveerd, echo op ' + ((m - refM) / SR).toFixed(4) + ' s (verwacht 6 s)');
    // eigen tempo (tap)
    const [m2] = await measureOne({ timing: 'tap', bpm: 133.3, divL: '1/8', feelL: 'straight' }, 90, 0.5 * 60 / 133.3);
    console.log('  eigen tempo 133,3 BPM met host 90 BPM, 1/8: fout ' + (m2 - refM - 0.5 * 60 / 133.3 * SR).toFixed(3) + ' samples');
    // rechts onafhankelijk en offset
    const r = await rig({ timing: 'sync', linked: false, divL: '1/8', feelL: 'straight', divR: '1/4', feelR: 'dotted', spread: 7 }, { bpm: 120 });
    const [L, R] = render(r, 60000, impulse(2000));
    const eL = peakFrac(L, 2020, 40000) - 2000 - refM, eR = peakFrac(R, 2020, 40000) - 2000 - refM;
    console.log('  L 1/8 bij 120 BPM: ' + (eL / SR * 1000).toFixed(3) + ' ms (verwacht 250); R 1/4 punt + 7 ms: ' + (eR / SR * 1000).toFixed(3) + ' ms (verwacht 757)');
    check(Math.abs(eL / SR * 1000 - 250) < 0.01 && Math.abs(eR / SR * 1000 - 757) < 0.01, 'links/rechts onafhankelijk'); r.inst.destroy();
  },
  async tempo() {
    hdr('Tempowissel tijdens het spelen: via onStep (klok loopt) en via host.bpm zonder klok (timer)');
    const r = await rig({ timing: 'sync', divL: '1/8', feelL: 'straight', linked: true, mix: 1 }, { bpm: 120 });
    // 1) via onStep
    let t = 0; const out = [];
    for (const bpm of [120, 90, 174, 60]) {
      r.inst.onStep({ step: 0, bar: 0, time: 0, stepDur: 60 / bpm / 4, bpm, swing: 0 });
      const [L] = render(r, SR, impulse(1000)); // 1 s per tempo; impuls op 1000; echo moet op 0.5*60/bpm s
      const k = peakFrac(L, 1100, SR - 10) - 1000; out.push([bpm, k / SR * 1000, 0.5 * 60 / bpm * 1000]);
      void t;
    }
    out.forEach(([b, m, e]) => console.log('  onStep ' + String(b).padStart(3) + ' BPM: echo op ' + m.toFixed(3) + ' ms, verwacht ' + e.toFixed(3) + ' ms'));
    check(out.every(([, m, e]) => Math.abs(m - e) < 0.03), 'tempo via onStep');
    // 2) via host.bpm met stilstaande klok (geen onStep): de timer van 40 ms moet het zien
    const o2 = [];
    for (const bpm of [100, 150, 80]) {
      r.host.bpm = bpm; await new Promise(res => setTimeout(res, 120));
      const [L] = render(r, SR, impulse(1000)); const k = peakFrac(L, 1100, SR - 10) - 1000; o2.push([bpm, k / SR * 1000, 0.5 * 60 / bpm * 1000]);
    }
    o2.forEach(([b, m, e]) => console.log('  host.bpm ' + String(b).padStart(3) + ' BPM (klok uit): echo op ' + m.toFixed(3) + ' ms, verwacht ' + e.toFixed(3) + ' ms'));
    check(o2.every(([, m, e]) => Math.abs(m - e) < 0.03), 'tempo via host.bpm zonder klok');
    r.inst.destroy();
  },
  async swing() {
    hdr('Swing van de host op de gesynchroniseerde delay (alleen bij een oneven aantal zestienden)');
    for (const [div, feel, steps] of [['1/16', 'straight', 1], ['1/8', 'dotted', 3]]) {
      const bpm = 120, sd = 60 / bpm / 4, sw = 0.08;
      const r = await rig({ timing: 'sync', divL: div, feelL: feel, linked: true, swing: 1, fb: 0.8, mix: 1 }, { bpm, swing: sw });
      const [L] = render(r, SR * 2, impulse(2000));
      const pk = []; let from = 2100;
      for (let e = 1; e <= 4; e++) { const exp = (e % 2 ? Math.ceil(e / 2) * 2 * steps - steps + (e % 2 ? sw : 0) : 0); void exp; }
      // echo-tijden: 1: n+sw, 2: 2n, 3: 3n+sw, 4: 4n (in zestienden)
      const times = [];
      for (let e = 1; e <= 4; e++) { const lo = 2000 + (e * steps * sd * SR) - 0.4 * steps * sd * SR, hi = 2000 + (e * steps * sd * SR) + 0.4 * steps * sd * SR; times.push((peakFrac(L, Math.floor(lo), Math.floor(hi)) - 2000) / SR); }
      const expect = [1, 2, 3, 4].map(e => (e * steps + (e % 2 ? sw : 0)) * sd);
      console.log('  ' + div + (feel === 'dotted' ? ' punt' : '') + ' @120 BPM, swing 0,08: echo\'s op ' + times.map(x => (x * 1000).toFixed(2)).join(', ') + ' ms; verwacht ' + expect.map(x => (x * 1000).toFixed(2)).join(', ') + ' ms');
      check(times.every((t, i) => Math.abs(t - expect[i]) < 0.0003), 'swing ' + div);
      r.inst.destroy();
      void from; void pk;
    }
    const r = await rig({ timing: 'sync', divL: '1/8', feelL: 'straight', linked: true, swing: 1, mix: 1 }, { bpm: 120, swing: 0.2 });
    const [L] = render(r, 30000, impulse(2000)); console.log('  1/8 (even aantal zestienden): geen swing, echo op ' + ((peakFrac(L, 2100, 20000) - 2000) / SR * 1000).toFixed(3) + ' ms (verwacht 250)'); r.inst.destroy();
  },
  async decay() {
    hdr('Feedbackverloop: toonburst van 1 kHz, afname per herhaling in dB tegen 20 log(fb)');
    const burst = i => (i >= 1000 && i < 1000 + 480) ? Math.sin(2 * Math.PI * 1000 * i / SR) * 0.5 : 0;
    for (const fb of [0.2, 0.5, 0.8, 0.95]) {
      const r = await rig({ timing: 'free', msL: 100, fb, linked: true }, {});
      const [L] = render(r, 6 * 4800 + 4000, burst);
      const e = []; for (let k = 1; k <= 5; k++) e.push(rms(L, 1000 + k * 4800, 1000 + k * 4800 + 480));
      const steps = []; for (let k = 1; k < 5; k++) steps.push(db(e[k] / e[k - 1]));
      console.log('  fb ' + String(Math.round(fb * 100)).padStart(3) + '%: per herhaling ' + steps.map(s => s.toFixed(3)).join(', ') + ' dB; verwacht ' + (20 * Math.log10(fb)).toFixed(3) + ' dB');
      check(steps.every(s => Math.abs(s - 20 * Math.log10(fb)) < 0.05), 'decay fb ' + fb); r.inst.destroy();
    }
  },
  async filters() {
    hdr('Filters in de lus: versterking van de eerste echo (fb 0) bij sinussen, tegen het digitale Butterworth-ontwerp (2e orde)');
    // digitaal ontwerp (bilinear, Q = 1/wortel 2): |H(e^jw)| uit de coefficienten; op fc is dat precies -3,01 dB
    const ideal = (f, fc, hp) => {
      const w0 = 2 * Math.PI * fc / SR, c = Math.cos(w0), a = Math.sin(w0) / (2 * 0.70710678), a0 = 1 + a;
      const b0 = (hp ? (1 + c) / 2 : (1 - c) / 2) / a0, b1 = (hp ? -(1 + c) : (1 - c)) / a0, a1 = -2 * c / a0, a2 = (1 - a) / a0, w = 2 * Math.PI * f / SR;
      const re = (b0 + b1 * Math.cos(w) + b0 * Math.cos(2 * w)) , im = -(b1 * Math.sin(w) + b0 * Math.sin(2 * w));
      const dr = 1 + a1 * Math.cos(w) + a2 * Math.cos(2 * w), di = -(a1 * Math.sin(w) + a2 * Math.sin(2 * w));
      return 10 * Math.log10((re * re + im * im) / (dr * dr + di * di));
    };
    for (const [hp, lp] of [[200, 20000], [20, 2000], [500, 4000]]) {
      const row = [];
      for (const f of [100, 200, 400, 1000, 2000, 4000, 8000]) {
        const r = await rig({ timing: 'free', msL: 50, hp, lp, fb: 0.0 }, {});
        const n = 48000, [L] = render(r, n, i => Math.sin(2 * Math.PI * f * i / SR) * 0.5);
        const g = db(rms(L, 20000, 46000) / (0.5 / Math.SQRT2)); r.inst.destroy();
        const id = ideal(f, hp, true) + ideal(f, lp, false); row.push(f + ' Hz: ' + g.toFixed(2) + ' (ideaal ' + id.toFixed(2) + ')');
        check(Math.abs(g - id) < 0.3, 'filterrespons ' + hp + '/' + lp + ' bij ' + f + ' Hz');
      }
      console.log('  HP ' + hp + ' Hz, LP ' + lp + ' Hz [dB]: ' + row.join('; '));
    }
    // twee herhalingen: respons wordt per herhaling toegepast (fc geeft -3 dB bij echo 1, -6 dB bij echo 2)
    const f = 1000, r = await rig({ timing: 'free', msL: 100, hp: 20, lp: 1000, fb: 1.0 }, {});
    const [L] = render(r, 5 * 4800 + 2000, i => (i >= 1000 && i < 1480) ? Math.sin(2 * Math.PI * f * i / SR) * 0.5 : 0);
    const e = [1, 2, 3].map(k => rms(L, 1000 + k * 4800, 1000 + k * 4800 + 480));
    console.log('  LP 1 kHz, toon 1 kHz, fb 100%: echo 1 ' + db(e[0] / (0.5 / Math.SQRT2)).toFixed(2) + ' dB, echo 2 ' + db(e[1] / (0.5 / Math.SQRT2)).toFixed(2) + ' dB, echo 3 ' + db(e[2] / (0.5 / Math.SQRT2)).toFixed(2) + ' dB (per herhaling -3 dB: filter in de lus)'); r.inst.destroy();
    // verzadiging
    for (const sat of ['tape', 'tube']) {
      const r2 = await rig({ timing: 'free', msL: 50, sat, drive: 1, fb: 0 }, {});
      const mk = a => i => Math.sin(2 * Math.PI * 1000 * i / SR) * a;
      const [A] = render(r2, 48000, mk(0.05)); const g1 = db(rms(A, 20000, 46000) / (0.05 / Math.SQRT2));
      const [B] = render(r2, 48000, mk(0.7)); const g2 = db(rms(B, 20000, 46000) / (0.7 / Math.SQRT2));
      console.log('  ' + sat + ' drive 100%: kleine amplitude ' + g1.toFixed(2) + ' dB, grote amplitude (0,7) ' + g2.toFixed(2) + ' dB (compressie in de lus)'); r2.inst.destroy();
    }
  },
  async stable() {
    hdr('Stabiliteit bij feedback >= 100 %: 60 s, burst van 0,5 s dan stilte; maximum van de uitvoer');
    for (const [mode, fb, extra] of [['stereo', 1.0, {}], ['stereo', 1.2, {}], ['pingpong', 1.2, { xfeed: 1 }], ['dual', 1.2, { fbR: 1.2 }], ['mono', 1.2, {}], ['stereo', 1.2, { sat: 'tube', drive: 1, diffusion: 1, modType: 'tape', modDepth: 1, hp: 20, lp: 20000 }], ['stereo', 1.2, { reverse: true, glide: 'tape' }]]) {
      const r = await rig({ timing: 'free', msL: 120, msR: 170, linked: false, mode, fb, mix: 1, ...extra }, {});
      let max = 0, maxLate = 0, fin = true; const burst = i => i < 24000 ? (Math.random() * 2 - 1) * 0.8 : 0;
      for (let s = 0; s < 60; s++) { const [L, R] = render(r, SR, s === 0 ? burst : null); for (let i = 0; i < SR; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (!(a < 1e9) || !(b < 1e9)) fin = false; if (a > max) max = a; if (b > max) max = b; if (s >= 5) { if (a > maxLate) maxLate = a; if (b > maxLate) maxLate = b; } } }
      console.log('  ' + mode.padEnd(8) + ' fb ' + Math.round(fb * 100) + '% ' + JSON.stringify(extra) + ': max ' + max.toFixed(3) + ' (' + db(max).toFixed(1) + ' dBFS) tijdens de burst, ' + maxLate.toFixed(3) + ' (' + db(maxLate).toFixed(1) + ' dBFS) na 5 s; eindig: ' + fin);
      check(fin && max < 4 && maxLate < 1.45, 'stabiliteit ' + mode + ' fb ' + fb); r.inst.destroy();
    }
    // freeze: een toon vasthouden
    const r = await rig({ timing: 'free', msL: 200, hp: 20, lp: 20000, fb: 0.5, mix: 1 }, {});
    render(r, 48000, i => i < 24000 ? Math.sin(2 * Math.PI * 440 * i / SR) * 0.5 : 0);
    r.state({ freeze: true }); render(r, 9600);
    const a = render(r, 9600)[0]; render(r, 30 * SR); const b = render(r, 9600)[0];
    console.log('  freeze: niveau na 0,2 s ' + db(rms(a, 0, 9600)).toFixed(2) + ' dBFS, na 30 s ' + db(rms(b, 0, 9600)).toFixed(2) + ' dBFS (verschil ' + (db(rms(b, 0, 9600)) - db(rms(a, 0, 9600))).toFixed(2) + ' dB)');
    check(Math.abs(db(rms(b, 0, 9600)) - db(rms(a, 0, 9600))) < 1, 'freeze houdt niveau'); r.inst.destroy();
  },
  async nan() {
    hdr('NaN, Infinity en enorme waarden op de ingang; daarna moet het geluid terugkomen (feedback 50 %, dan 100 % met begrenzer)');
    for (const [fb, mode] of [[0.5, 'stereo'], [0.5, 'pingpong'], [1.2, 'stereo'], [0.9, 'mono']]) for (const bad of [NaN, Infinity, -Infinity, 1e9, -1e9, 1e30, -1e30]) {
      const r = await rig({ timing: 'free', msL: 80, fb, mode, mix: 0.5, sat: 'tube', drive: 0.5, diffusion: 0.5, modDepth: 0.5, duck: 0.5 }, {});
      const tone = i => Math.sin(2 * Math.PI * 440 * i / SR) * 0.3;
      render(r, 20000, tone);
      render(r, 1500, () => bad);
      const [L] = render(r, 20 * SR / (fb >= 1 ? 4 : 1), tone);
      let fin = true, mx = 0; for (const v of L) { if (!Number.isFinite(v)) fin = false; if (Math.abs(v) > mx) mx = Math.abs(v); }
      const [T] = render(r, 24000, tone); const lvl = rms(T, 12000, 24000);
      const ok = fin && mx < 20 && lvl > 0.1;
      console.log('  fb ' + Math.round(fb * 100) + '% ' + mode.padEnd(8) + ' burst ' + String(bad).padEnd(9) + ': eindig ' + fin + ', max ' + mx.toFixed(2) + ', toon daarna rms ' + lvl.toFixed(3) + (ok ? '' : '  <-- fout'));
      check(ok, 'burst ' + bad + ' fb ' + fb); r.inst.destroy();
    }
    // ongeldige berichten aan de worklet
    const r = await rig({ timing: 'free', msL: 80, fb: 0.4 }, {});
    r.proc.port.onmessage({ data: { type: 'set', s: { fbL: NaN, hp: Infinity, lp: 'x', t: [NaN, 1, 2, 3], mode: 'nope', md: -5, lvl: 1e9 } } });
    r.proc.port.onmessage({ data: null }); r.proc.port.onmessage({ data: { type: 'set', s: null } });
    const [L] = render(r, 24000, i => Math.sin(2 * Math.PI * 440 * i / SR) * 0.3); console.log('  ongeldige berichten: uitvoer eindig ' + L.every(Number.isFinite) + ', rms ' + rms(L, 12000, 24000).toFixed(3)); check(L.every(Number.isFinite), 'ongeldige berichten'); r.inst.destroy();
    // ongeldige state op het apparaat
    const r3 = await rig({}, {}); r3.inst.setState({ fb: NaN, msL: 'x', mode: 5, divL: {}, bpm: Infinity, linked: 'ja', stepsL: -9, spread: 1e30 }); const gs = r3.inst.getState();
    console.log('  setState met rommel: fb ' + gs.fb + ', msL ' + gs.msL + ', mode ' + gs.mode + ', divL ' + gs.divL + ', bpm ' + gs.bpm + ', linked ' + gs.linked + ', stepsL ' + gs.stepsL + ', spread ' + gs.spread); r3.inst.destroy();
  },
  async modes() {
    hdr('Modi: ping-pong wisselt van kant, kruisfeedback, dual met eigen feedback per kant');
    const fl = i => i === 2000 ? 1 : 0, fr = () => 0;
    const e = (x, k, T) => rms(x, 2000 + k * T - 12, 2000 + k * T + 12);
    const T = 4800;
    let r = await rig({ timing: 'free', msL: 100, mode: 'pingpong', fb: 0.7 }, {}); let [L, R] = render(r, 7 * T, fl, fr);
    console.log('  ping-pong (invoer links): echo 1..5 L/R [dB]: ' + [1, 2, 3, 4, 5].map(k => db(e(L, k, T)).toFixed(1) + '/' + db(e(R, k, T)).toFixed(1)).join('  '));
    check(e(L, 1, T) > 0.03 && e(R, 1, T) < 1e-3 && e(R, 2, T) > 0.02 && e(L, 2, T) < 1e-3 && e(L, 3, T) > 0.01 && e(R, 3, T) < 1e-3, 'ping-pong wisselt van kant'); r.inst.destroy();
    r = await rig({ timing: 'free', msL: 100, mode: 'stereo', fb: 0.7, xfeed: 0 }, {}); [L, R] = render(r, 7 * T, fl, fr);
    console.log('  stereo, kruisfeedback 0 (invoer links): R blijft stil: max R ' + Math.max(...R.map(Math.abs)).toExponential(1)); check(Math.max(...R.map(Math.abs)) < 1e-6, 'stereo links/rechts gescheiden'); r.inst.destroy();
    r = await rig({ timing: 'free', msL: 100, mode: 'stereo', fb: 0.7, xfeed: 1 }, {}); [L, R] = render(r, 7 * T, fl, fr);
    console.log('  stereo, kruisfeedback 100 %: echo 1..4 L/R [dB]: ' + [1, 2, 3, 4].map(k => db(e(L, k, T)).toFixed(1) + '/' + db(e(R, k, T)).toFixed(1)).join('  '));
    check(e(R, 3, T) > 0.03, 'kruisfeedback brengt echo naar rechts'); r.inst.destroy();
    r = await rig({ timing: 'free', msL: 100, linked: true, mode: 'dual', fb: 0.2, fbR: 0.8 }, {}); [L, R] = render(r, 7 * T, i => i === 2000 ? 1 : 0, i => i === 2000 ? 1 : 0);
    const sl = [1, 2, 3].map(k => db(e(L, k + 1, T) / e(L, k, T))), sr = [1, 2, 3].map(k => db(e(R, k + 1, T) / e(R, k, T)));
    console.log('  dual (fb L 20 %, R 80 %): afname per herhaling L ' + sl.map(x => x.toFixed(2)).join(', ') + ' dB (verwacht ' + db(0.2).toFixed(2) + '), R ' + sr.map(x => x.toFixed(2)).join(', ') + ' dB (verwacht ' + db(0.8).toFixed(2) + ')');
    check(Math.abs(sl[1] - db(0.2)) < 0.3 && Math.abs(sr[1] - db(0.8)) < 0.3, 'dual onafhankelijke feedback'); r.inst.destroy();
    r = await rig({ timing: 'free', msL: 100, mode: 'mono', fb: 0.5 }, {}); [L, R] = render(r, 5 * T, fl, fl);
    console.log('  mono: L en R gelijk: ' + L.every((v, i) => v === R[i])); check(L.every((v, i) => v === R[i]), 'mono'); r.inst.destroy();
    // dry/wet
    r = await rig({ timing: 'free', msL: 100, mix: 1 }, {}); [L] = render(r, 2 * T + 3000, fl, fr); console.log('  mix 100 %: droog bij het begin ' + Math.abs(L[2000]).toExponential(1) + ' (moet 0 zijn), echo ' + Math.abs(L[2000 + T]).toFixed(3)); check(Math.abs(L[2000]) < 1e-6, '100% wet heeft geen droog signaal'); r.inst.destroy();
    r = await rig({ timing: 'free', msL: 100, mix: 0 }, {}); [L] = render(r, 2 * T + 3000, fl, fr); console.log('  mix 0 %: droog ' + L[2000].toFixed(3) + ', echo ' + Math.abs(L[2000 + T]).toExponential(1)); r.inst.destroy();
    // ducking
    r = await rig({ timing: 'free', msL: 50, fb: 0.5, mix: 1, duck: 1, duckThr: -30, duckRel: 200 }, {});
    const tone = i => i < 24000 ? Math.sin(2 * Math.PI * 440 * i / SR) * 0.5 : 0; [L] = render(r, 60000, tone);
    const during = rms(L, 12000, 24000), after = rms(L, 24000 + 14400, 24000 + 14400 + 4800);
    console.log('  ducking 100 %: echo terwijl de bron speelt ' + db(during).toFixed(1) + ' dBFS, 0,3 s nadat de bron stopt ' + db(after).toFixed(1) + ' dBFS'); check(after > during * 1.5 || during < 0.02, 'ducking drukt de echo tijdens de bron'); r.inst.destroy();
    // diffusie: de piek van een impuls wordt uitgesmeerd
    r = await rig({ timing: 'free', msL: 100, diffusion: 1 }, {}); [L] = render(r, 2 * T + 3000, fl, fr); const pk = Math.max(...L.map(Math.abs)); console.log('  diffusie 100 %: piek van een impuls ' + pk.toFixed(3) + ' (zonder diffusie 1,0), energie behouden: ' + (L.reduce((a, v) => a + v * v, 0)).toFixed(3)); r.inst.destroy();
  },
  async reverse() {
    hdr('Reverse: twee impulsen komen in omgekeerde volgorde terug, op de plek die het venstermodel voorspelt (W = delaytijd, twee koppen met sin2-venster)');
    const W = 4800, r = await rig({ timing: 'free', msL: 100, reverse: true }, {});
    const [L] = render(r, 5 * W, i => i === 5000 || i === 6000 ? 1 : 0);
    // kop 1: fase p = (n - kW)/W, vertraging 2Wp + 4; kop 2 is een halve venster verschoven. Impuls op t verschijnt waar n - d(n) = t.
    const pred = t => { const out = []; for (const off of [0, 0.5]) { const k = Math.ceil((t + 4) / W - off); const n = 2 * (k + off) * W - 4 - t; const p = (n - (k + off) * W) / W; out.push([n, Math.pow(Math.sin(Math.PI * p), 2)]); } return out; };
    for (const t of [5000, 6000]) {
      const pr = pred(t).sort((a, b) => b[1] - a[1])[0]; const [k, m] = peakAt(L, Math.floor(pr[0]) - 40, Math.floor(pr[0]) + 40);
      console.log('  impuls op ' + t + ': voorspeld op ' + pr[0] + ' (gewicht ' + pr[1].toFixed(3) + '), gemeten op ' + k + ' (' + m.toFixed(3) + ')');
      check(Math.abs(k - pr[0]) <= 1 && Math.abs(m - pr[1]) < 0.02, 'reverse-impuls ' + t);
    }
    const a = peakAt(L, 9000, 9800)[0], b = peakAt(L, 8000, 8800)[0]; console.log('  de latere impuls (6000) komt vroeger (' + b + ') dan de eerdere (5000, ' + a + '): volgorde omgekeerd = ' + (b < a)); check(b < a, 'volgorde omgekeerd'); r.inst.destroy();
  },
  async click() {
    hdr('Tikken: sinus van 1 kHz door de delay, grootste tweede verschil rond een tijd- of tempowissel, uitgedrukt in het maximum van een zuivere sinus (1,0 = geen sprong)');
    const A = 0.5, f = 1000, w = 2 * Math.PI * f / SR, base = A * w * w;
    const sine = i => A * Math.sin(w * i);
    const d2 = (x, a, b) => { let m = 0, pk = 1e-9; for (let i = a + 2; i < b; i++) { m = Math.max(m, Math.abs(x[i] - 2 * x[i - 1] + x[i - 2])); pk = Math.max(pk, Math.abs(x[i])); } return m / (pk / A); };   // genormeerd op de lokale piek, zodat versterking door feedback niet meetelt
    const CH = 2 * SR;   // de wissel valt na 2 s, als de lijnen vol zijn
    async function run(label, cfg, hook, after = 0.4) {
      const r = await rig(cfg.state, cfg.host || {});
      const amp = cfg.amp || 1, [L] = render(r, CH + SR, i => sine(i) * amp, null, i => { if (i === CH) hook(r); });
      const stat = d2(L, CH - 12000, CH - 100), during = d2(L, CH, CH + Math.round(after * SR));
      console.log('  ' + label.padEnd(60) + ' vlak ervoor ' + (stat / base).toFixed(3) + ', rond de wissel ' + (during / base).toFixed(3));
      r.inst.destroy(); return during / base;
    }
    const v = [];
    v.push(await run('tempowissel 120 -> 97 BPM (kruisfade), 1/8', { state: { timing: 'sync', divL: '1/8', feelL: 'straight' }, host: { bpm: 120 } }, r => r.inst.onStep({ stepDur: 60 / 97 / 4, bpm: 97, swing: 0 })));
    v.push(await run('tempowissel 120 -> 200 BPM (kruisfade), 1/4', { state: { timing: 'sync', divL: '1/4', feelL: 'straight' }, host: { bpm: 120 } }, r => r.inst.onStep({ stepDur: 60 / 200 / 4, bpm: 200, swing: 0 })));
    v.push(await run('tempowissel 174 -> 60 BPM (kruisfade), 1/8 punt', { state: { timing: 'sync', divL: '1/8', feelL: 'dotted' }, host: { bpm: 174 } }, r => r.inst.onStep({ stepDur: 60 / 60 / 4, bpm: 60, swing: 0 })));
    v.push(await run('vrije tijd 80,25 -> 313,4 ms (kruisfade)', { state: { timing: 'free', msL: 80.25 } }, r => r.state({ msL: 313.4 })));
    v.push(await run('vrije tijd 1500,5 -> 7,37 ms (kruisfade)', { state: { timing: 'free', msL: 1500.5 } }, r => r.state({ msL: 7.37 })));
    v.push(await run('notenwaarde 1/8 -> 1/16 triool', { state: { timing: 'sync', divL: '1/8', feelL: 'straight' } }, r => r.state({ divL: '1/16', feelL: 'triplet' })));
    v.push(await run('feedback 40 % -> 80 % (zachte invoer, onder de begrenzer)', { amp: 0.15, state: { timing: 'free', msL: 90, fb: 0.4 } }, r => r.state({ fb: 0.8 })));
    v.push(await run('modus stereo -> ping-pong (korte demping, geen sprong)', { state: { timing: 'free', msL: 80, fb: 0.5 } }, r => r.state({ mode: 'pingpong' })));
    v.push(await run('freeze aan', { state: { timing: 'free', msL: 80, fb: 0.5 } }, r => r.state({ freeze: true })));
    v.push(await run('reverse aan', { state: { timing: 'free', msL: 80, fb: 0.5 } }, r => r.state({ reverse: true })));
    check(v.every(x => x < 2.2), 'een wissel veroorzaakt een sprong (> 2,2 x het sinusmaximum)');
    // ter vergelijking: een harde sprong van de delaytijd (geen fade), zoals een ongeglad DelayNode
    const hard = new Float32Array(CH + SR); { const d1 = Math.round(0.31325 * SR), d0 = Math.round(0.080 * SR); for (let i = 0; i < hard.length; i++) hard[i] = sine(i < CH ? i - d1 : i - d0); }
    console.log('  ter vergelijking, harde sprong 313,25 -> 80 ms zonder fade: ' + (d2(hard, CH - 50, CH + 50) / base).toFixed(2) + ' x het sinusmaximum');
    // tape: bewuste toonhoogtegleed. Delay 300 -> 200 ms met glijtijd 250 ms; frequentie uit nuldoorgangen
    const r = await rig({ timing: 'free', msL: 300, glide: 'tape', glideTime: 250 }, {});
    const [L] = render(r, CH + 2 * SR, sine, null, i => { if (i === CH) r.state({ msL: 200 }); });
    const freqAt = (a, b) => { let c = 0; for (let i = CH + a + 1; i < CH + b; i++) if ((L[i - 1] < 0) !== (L[i] < 0)) c++; return c / 2 / ((b - a) / SR); };
    const f1 = freqAt(1000, 3400), f2 = freqAt(Math.round(1.6 * SR), Math.round(1.95 * SR)), f0 = (() => { let c = 0; for (let i = CH - 9999; i < CH; i++) if ((L[i - 1] < 0) !== (L[i] < 0)) c++; return c / 2 / (9999 / SR); })();
    console.log('  tape 300 -> 200 ms, glijtijd 250 ms: toonhoogte ervoor ' + f0.toFixed(0) + ' Hz, 0,02-0,07 s erna ' + f1.toFixed(0) + ' Hz (theorie 1+0,4*exp(-t/0,25) = ' + (1000 * (1 + 0.1 / 0.25 * Math.exp(-0.045 / 0.25))).toFixed(0) + ' Hz), na 1,6 s ' + f2.toFixed(0) + ' Hz');
    check(f1 > 1250 && f1 < 1400 && Math.abs(f2 - 1000) < 4 && Math.abs(f0 - 1000) < 4, 'tape glijdt toonhoogte en keert terug');
    const dd = d2(L, CH, CH + 2 * SR) / base; console.log('  tape: grootste tweede verschil tijdens het glijden ' + dd.toFixed(3) + ' (glijdt zonder sprong; de hoogere frequentie geeft zelf al tot ' + ((1.4 * 1.4)).toFixed(2) + ' x)'); check(dd < 2.2, 'tape zonder sprongen'); r.inst.destroy();
  },
  async presets() {
    hdr('Alle presets van presets/delay.patchkamer-presets.json: 12 s ruis- en toonburst, daarna stilte; eindig, maximum, echo klinkt');
    const { readFileSync } = await import('node:fs'); const pack = JSON.parse(readFileSync('presets/delay.patchkamer-presets.json', 'utf8'));
    const items = []; const walk = l => l.forEach(x => x.folder ? walk(x.items) : items.push(x)); walk(pack.tree);
    let worst = 0;
    for (const it of items) {
      const r = await rig({ ...it.state, mix: it.state.mix }, { bpm: 126, swing: 0.08 });
      const [L, R] = render(r, 12 * SR, i => i < 12000 ? (Math.random() * 2 - 1) * 0.6 : (i > 48000 && i < 60000 ? Math.sin(2 * Math.PI * 330 * i / SR) * 0.5 : 0));
      let fin = true, mx = 0; for (let i = 0; i < L.length; i++) { if (!Number.isFinite(L[i]) || !Number.isFinite(R[i])) fin = false; mx = Math.max(mx, Math.abs(L[i]), Math.abs(R[i])); }
      const tail = Math.max(rms(L, 7 * SR, 8 * SR), rms(R, 7 * SR, 8 * SR)); worst = Math.max(worst, mx);
      console.log('  ' + it.name.padEnd(26) + ' eindig ' + fin + ', max ' + mx.toFixed(2) + ', staart na 7 s rms ' + db(tail).toFixed(0) + ' dBFS');
      check(fin && mx < 1.5 + 0.7, 'preset ' + it.name); r.inst.destroy();
    }
    console.log('  grootste piek over alle presets (inclusief droog signaal): ' + worst.toFixed(2));
  },
  async load() {
    hdr('Rekenlast: gemiddelde, p99 en maximum per blok van 128 samples bij 48 kHz (budget 2,667 ms), Node-JIT, ruisinvoer');
    const budget = BLK / SR * 1000;
    const cases = {
      'stereo, filters (standaard)': { mode: 'stereo' },
      'ping-pong': { mode: 'pingpong' },
      'dual met kruisfeedback': { mode: 'dual', xfeed: 0.5 },
      'mono': { mode: 'mono' },
      'zwaarste: tube + diffusie + tape-mod + ducking + reverse': { mode: 'stereo', sat: 'tube', drive: 1, diffusion: 1, modType: 'tape', modDepth: 1, duck: 1, reverse: true, fb: 0.9 },
      'zwaarste + tape-glijden (steeds nieuwe tijd)': { mode: 'stereo', sat: 'tube', drive: 1, diffusion: 1, modType: 'tape', modDepth: 1, duck: 1, reverse: true, fb: 0.9, glide: 'tape' },
    };
    for (const [name, st] of Object.entries(cases)) {
      const r = await rig({ timing: 'free', msL: 250, msR: 333, linked: false, fb: 0.5, mix: 0.5, ...st }, {});
      const a = new Float32Array(BLK), b = new Float32Array(BLK), oa = new Float32Array(BLK), ob = new Float32Array(BLK); const ts = [];
      for (let k = 0; k < 60000; k++) {
        for (let i = 0; i < BLK; i++) { a[i] = Math.random() * 2 - 1; b[i] = Math.random() * 2 - 1; }
        if (st.glide === 'tape' && k % 400 === 0) r.state({ msL: 200 + (k / 400 % 2) * 150 });
        const t0 = process.hrtime.bigint(); r.proc.process([[a, b]], [[oa, ob]]); ts.push(Number(process.hrtime.bigint() - t0) / 1e6);
      }
      const warm = ts.slice(5000).sort((x, y) => x - y); const avg = warm.reduce((x, y) => x + y, 0) / warm.length, p99 = warm[Math.floor(warm.length * 0.99)], mx = warm[warm.length - 1];
      console.log('  ' + name.padEnd(62) + ' gem ' + (avg / budget * 100).toFixed(2) + '%  p99 ' + (p99 / budget * 100).toFixed(2) + '%  max ' + (mx / budget * 100).toFixed(2) + '%');
      r.inst.destroy();
    }
  },
};
const want = process.argv.slice(2), names = want.length ? want : Object.keys(sections);
for (const n of names) { if (!sections[n]) { console.log('onbekende sectie ' + n); continue; } await sections[n].call({}); }
console.log(fails ? '\n' + fails + ' controle(s) MISLUKT' : '\nalle controles OK');
process.exit(fails ? 1 : 0);
