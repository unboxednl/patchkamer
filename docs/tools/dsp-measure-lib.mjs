// SPDX-License-Identifier: AGPL-3.0-or-later
// Gedeelde hulpfuncties voor de meetscripts van de galmapparaten: apparaat laden met een nep-host, de echte worklet draaien in Node, en analyse (FFT, Schroeder-integratie, echodichtheid, kruiscorrelatie).

export const SR = 48000;
// Laad een apparaat en geef de worklet-processorklasse terug (de code die de host zou laden, dus het echte geluid)
export async function loadWorkletClass(file, sampleRate = SR) {
  const { resolve } = await import('node:path'), { pathToFileURL } = await import('node:url');   // alleen in Node (de bibliotheek wordt ook in de browser gebruikt)
  globalThis.sampleRate = sampleRate; globalThis.currentTime = 0;
  let cls = null;
  globalThis.AudioWorkletProcessor = class { constructor() { this.port = { onmessage: null, postMessage() { } }; } };
  globalThis.registerProcessor = (n, c) => { cls = c; };
  const chain = () => new Proxy(function () { }, { get: (t, k) => k === 'then' ? undefined : (k === 'value' ? 0 : chain()), apply: () => chain(), set: () => true });
  const ctx = new Proxy({ sampleRate, currentTime: 0, state: 'running' }, { get: (t, k) => k in t ? t[k] : chain() });
  const def = (await import(pathToFileURL(resolve(file)).href + '?' + Math.random())).default;
  let code = null;
  const host = new Proxy({ lang: 'en', bpm: 120, loadWorklet: async (name, src) => { code = src; return true; } }, { get: (t, k) => k in t ? t[k] : chain() });
  def.create(ctx, host); await new Promise(r => setTimeout(r, 20));
  (0, eval)(code);
  return { cls, def, code };
}
// Draai een processor over een lijst blokken. input(n, ch) geeft sample n van kanaal ch. Geeft { L, R } terug.
export function run(proc, total, input, hooks = {}) {
  const B = 128, L = new Float32Array(total), R = new Float32Array(total);
  const il = new Float32Array(B), ir = new Float32Array(B), ol = new Float32Array(B), orr = new Float32Array(B);
  for (let s = 0; s < total; s += B) {
    const n = Math.min(B, total - s);
    if (hooks.block) hooks.block(s);
    for (let i = 0; i < B; i++) { il[i] = i < n ? input(s + i, 0) : 0; ir[i] = i < n ? input(s + i, 1) : 0; }
    proc.process([[il, ir]], [[ol, orr]], {});
    for (let i = 0; i < n; i++) { L[s + i] = ol[i]; R[s + i] = orr[i]; }
  }
  return { L, R };
}
export const send = (proc, p) => proc.port.onmessage({ data: { type: 'set', p } });
// ruis (deterministisch)
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(6.283185307179586 * r()); }
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) {
      const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
      re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
}
export const nextPow2 = n => { let p = 1; while (p < n) p <<= 1; return p; };
// magnitudespectrum (power) van een segment, met Hann-venster
export function powerSpectrum(x, start, len) {
  const n = nextPow2(len), re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < len; i++) re[i] = (x[start + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (len - 1)));
  fft(re, im); const p = new Float64Array(n / 2); for (let i = 0; i < n / 2; i++) p[i] = re[i] * re[i] + im[i] * im[i]; return { p, n };
}
// bandfilter (RBJ bandpass, tweede orde) voor octaafbanden
export function bandpass(x, f0, q = 1.41, sr = SR) {
  const w = 2 * Math.PI * f0 / sr, al = Math.sin(w) / (2 * q), a0 = 1 + al, b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0;
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i], o = b0 * v + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; }
  return y;
}
// Schroeder: omgekeerde integratie van de energie. Geeft de afnamecurve in dB en RT60 uit T20 (-5..-25 dB) en T30 (-5..-35) extrapolatie
export function decayCurve(h, sr = SR) {
  const n = h.length, e = new Float64Array(n); let acc = 0; for (let i = n - 1; i >= 0; i--) { acc += h[i] * h[i]; e[i] = acc; }
  const db = new Float64Array(n); const e0 = e[0] || 1e-30; for (let i = 0; i < n; i++) db[i] = 10 * Math.log10(e[i] / e0 + 1e-30);
  const t = (a, b) => { let ia = -1, ib = -1; for (let i = 0; i < n; i++) { if (ia < 0 && db[i] <= a) ia = i; if (ib < 0 && db[i] <= b) { ib = i; break; } } if (ia < 0 || ib < 0 || ib <= ia) return NaN; return (ib - ia) / sr * (60 / (a - b)); };
  return { db, rt20: t(-5, -25), rt30: t(-5, -35), edt: t(0, -10) };
}
// genormaliseerde echodichtheid (Abel & Huang): deel van de samples dat buiten de lopende standaardafwijking valt, gedeeld door 0,3173 (Gauss)
export function echoDensity(h, sr = SR, win = 0.02) {
  const w = Math.round(win * sr), half = w >> 1, out = []; const erfc = 0.3173;
  for (let c = half; c < h.length - half; c += Math.round(sr * 0.005)) {
    let ss = 0; for (let i = c - half; i <= c + half; i++) ss += h[i] * h[i]; const sd = Math.sqrt(ss / (w + 1)); if (sd < 1e-12) { out.push([c / sr, 0]); continue; }
    let cnt = 0; for (let i = c - half; i <= c + half; i++) if (Math.abs(h[i]) > sd) cnt++; out.push([c / sr, cnt / (w + 1) / erfc]);
  }
  return out;
}
// kruiscorrelatie met vertraging ±1 ms (IACC) tussen twee kanalen over een segment
export function iacc(a, b, start, len, sr = SR) {
  let ea = 0, eb = 0; for (let i = 0; i < len; i++) { ea += a[start + i] ** 2; eb += b[start + i] ** 2; }
  const lag = Math.round(sr * 0.001); let best = 0; const d = Math.sqrt(ea * eb) || 1;
  for (let l = -lag; l <= lag; l++) { let s = 0; for (let i = Math.max(0, -l); i < len - Math.max(0, l); i++) s += a[start + i] * b[start + i + l]; best = Math.max(best, Math.abs(s) / d); }
  return best;
}
export const db = x => 20 * Math.log10(Math.max(1e-30, x));
export const rms = x => { let s = 0; for (const v of x) s += v * v; return Math.sqrt(s / (x.length || 1)); };
export const pct = (a, q) => { const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
