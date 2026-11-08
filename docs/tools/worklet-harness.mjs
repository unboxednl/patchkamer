// SPDX-License-Identifier: AGPL-3.0-or-later
// Gedeelde hulp voor de meetscripts van Distortion en Bitcrusher: laadt het apparaat met een nep-AudioContext,
// haalt de worklet-code eruit en draait de processor blok voor blok (128 samples) in Node, zonder browser.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : (k === 'value' ? 0 : chain()), apply: () => chain(), set: () => true });
export async function loadProcessor(file, sampleRate = 48000) {
  globalThis.AudioWorkletNode = class { constructor() { this.port = { postMessage() {} }; this.parameters = { get: () => chain() }; this.connect = () => chain(); this.disconnect = () => {}; } };
  const ctx = new Proxy({ sampleRate, currentTime: 0, state: 'running' }, { get: (t, k) => k in t ? t[k] : chain() });
  let code = null;
  const host = new Proxy({ lang: 'en', bpm: 120, loadWorklet: async (n, c) => { code = c; return true; } }, { get: (t, k) => k in t ? t[k] : chain() });
  const def = (await import(pathToFileURL(resolve(file)).href)).default;
  const inst = def.create(ctx, host); await new Promise(r => setTimeout(r, 20));
  if (!code) throw new Error('geen worklet-code gevonden');
  let Cls = null, descr = null;
  const AudioWorkletProcessor = class { constructor() { this.port = { postMessage() {}, onmessage: null }; } };
  new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', code)(AudioWorkletProcessor, (n, c) => { Cls = c; }, sampleRate);
  descr = Cls.parameterDescriptors;
  return {
    def, inst, sampleRate,
    // make() geeft een processor met run(inL, inR, params, msg) -> { l, r }
    make(msg) {
      const p = new Cls(); if (msg) p.port.onmessage({ data: msg });
      const cur = {}; for (const d of descr) cur[d.name] = d.defaultValue;
      return {
        p, cur, msg(m) { p.port.onmessage({ data: m }); },
        run(L, R, params) {
          Object.assign(cur, params || {}); const n = L.length, oL = new Float32Array(n), oR = new Float32Array(n);
          for (let i = 0; i < n; i += 128) {
            const m = Math.min(128, n - i), a = new Float32Array(128), b = new Float32Array(128), ol = new Float32Array(128), or = new Float32Array(128);
            a.set(L.subarray(i, i + m)); b.set((R || L).subarray(i, i + m));
            const P = {}; for (const k in cur) P[k] = [typeof cur[k] === 'function' ? cur[k](i) : cur[k]];
            p.process([[a, b]], [[ol, or]], P); oL.set(ol.subarray(0, m), i); oR.set(or.subarray(0, m), i);
          }
          return { l: oL, r: oR };
        },
      };
    },
  };
}
// FFT (radix-2) -> amplitudes van de eerste N/2 bins, geschaald zodat een sinus met amplitude A een piek A geeft (rechthoekig venster)
export function spectrum(x) {
  const N = x.length, re = Float64Array.from(x), im = new Float64Array(N);
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; } }
  for (let len = 2; len <= N; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = i + k + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
  const a = new Float64Array(N / 2); for (let k = 0; k < N / 2; k++) a[k] = 2 * Math.hypot(re[k], im[k]) / N; a[0] /= 2; return a;
}
export const db = v => 20 * Math.log10(Math.max(v, 1e-12));
