// SPDX-License-Identifier: AGPL-3.0-or-later
// Gedeelde hulp voor de meetscripts van Compressor, Gate en De-esser: haalt de worklet uit het apparaatbestand en draait hem
// in Node, blok voor blok van 128 samples (zoals de browser), met een nep-AudioWorkletProcessor.
import { readFileSync } from 'node:fs';
export const SR = 48000, BLOCK = 128;
export function loadEngine(devicePath, sr = SR) {
  const src = readFileSync(devicePath, 'utf8');
  const name = /const WNAME = '([^']+)'/.exec(src)[1];
  const code = /const WORKLET = `([\s\S]*?)`;/.exec(src)[1].replace('${WNAME}', name);
  return function make(settings = {}) {
    let Cls = null;
    class AudioWorkletProcessor { constructor() { this.port = { onmessage: null, posted: [], postMessage(m) { this.posted.push(m); } }; } }
    new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', 'currentTime', code)(AudioWorkletProcessor, (n, c) => { Cls = c; }, sr, 0);
    const p = new Cls(); const set = s => p.port.onmessage({ data: { type: 'set', s } }); set(settings);
    return { p, set, sr,
      // draait ingang (en optioneel sidechain) door; geeft { l, r } terug; l, r, scL, scR zijn Float32Array of Float64Array
      run(l, r, scl = null, scr = null) { const n = l.length, oL = new Float32Array(n), oR = new Float32Array(n);
        for (let i = 0; i < n; i += BLOCK) { const m = Math.min(BLOCK, n - i), bl = new Float32Array(BLOCK), br = new Float32Array(BLOCK); bl.set(l.subarray(i, i + m)); br.set((r || l).subarray(i, i + m));
          const ins = [[bl, br]]; if (scl) { const sl = new Float32Array(BLOCK), sr2 = new Float32Array(BLOCK); sl.set(scl.subarray(i, i + m)); sr2.set((scr || scl).subarray(i, i + m)); ins.push([sl, sr2]); } else ins.push([]);
          const ol = new Float32Array(BLOCK), or = new Float32Array(BLOCK); p.process(ins, [[ol, or]]); oL.set(ol.subarray(0, m), i); oR.set(or.subarray(0, m), i); }
        return { l: oL, r: oR }; } };
  };
}
export const db = x => 20 * Math.log10(Math.max(x, 1e-12));
export const lin = d => Math.pow(10, d / 20);
export function sine(f, amp, n, sr = SR, ph = 0) { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = amp * Math.sin(2 * Math.PI * f * i / sr + ph); return a; }
export function rmsOf(a, i0 = 0, i1 = a.length) { let s = 0; for (let i = i0; i < i1; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, i1 - i0)); }
export function peakOf(a, i0 = 0, i1 = a.length) { let m = 0; for (let i = i0; i < i1; i++) m = Math.max(m, Math.abs(a[i])); return m; }
export function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// gain-envelope: kwadratisch gemiddelde van uitgang/ingang in vensters van win samples, in dB
export function gainTrace(inp, outp, win = 48) { const g = []; for (let i = 0; i + win <= inp.length; i += win) g.push(db(rmsOf(outp, i, i + win) / Math.max(1e-12, rmsOf(inp, i, i + win)))); return g; }
