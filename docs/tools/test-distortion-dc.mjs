// SPDX-License-Identifier: AGPL-3.0-or-later
// Test voor de DC-blokkering van Distortion: gemiddelde (DC) van de uitgang in rust en na een wissel van soort.
// Gebruik, vanuit de root:  node docs/tools/test-distortion-dc.mjs   (exit 0 = groen)
import { loadProcessor } from './worklet-harness.mjs';
const SR = 48000, H = await loadProcessor('devices/effects/Distortion/distortion.patchkamer-device.js', SR);
const TYPES = ['soft', 'hard', 'tube', 'tape', 'diode', 'fuzz', 'fold', 'rect'];
const mean = (a, i, j) => { let s = 0; for (let k = i; k < j; k++) s += a[k]; return s / (j - i); };
let fail = 0; const t = (n, ok, x = '') => { if (!ok) fail++; console.log((ok ? 'OK     ' : 'FOUT   ') + n + ' ' + x); };
const sig = (n, a = 0.3) => Float32Array.from({ length: n }, (_, i) => a * Math.sin(2 * Math.PI * 110 * i / SR));
// 1. rust: DC in de uitgang na de blokkering, met asymmetrie (bias), alle soorten
for (const ty of TYPES) { const x = sig(SR * 2), y = H.make({ type: TYPES.indexOf(ty), os: 2, auto: false }).run(x, x, { drive: 0.6, bias: 0.6, mix: 1 }).l;
  const dc = Math.abs(mean(y, SR, 2 * SR)); t(`DC in rust, ${ty}, bias +60%`, dc < 1e-4, dc.toExponential(1)); }
// 2. wissel van soort tijdens het spelen: de eerste 20 ms mogen geen DC-bult van de nieuwe soort laten horen
for (const [a, b, lim] of [['soft', 'rect', 0.2], ['soft', 'tube', 0.1], ['tube', 'soft', 0.1], ['soft', 'fuzz', 0.15]]) {
  const x = sig(SR * 2), p = H.make({ type: TYPES.indexOf(a), os: 2, auto: false }), par = { drive: 0.6, bias: 0.6, mix: 1 };
  p.run(x.subarray(0, SR), x.subarray(0, SR), par); p.msg({ type: TYPES.indexOf(b) }); const y = p.run(x.subarray(SR), x.subarray(SR), par).l;
  const m = Math.abs(mean(y, 0, 960)), end = Math.abs(mean(y, SR - 4800, SR));
  t(`wissel ${a} -> ${b}: gemiddelde eerste 20 ms`, m < lim, `${m.toFixed(3)} (grens ${lim}); daarna ${end.toExponential(1)}`); }
process.exit(fail ? 1 : 0);
