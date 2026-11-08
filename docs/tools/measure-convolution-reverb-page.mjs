// SPDX-License-Identifier: AGPL-3.0-or-later
// Metingen van Convolution Reverb, uitgevoerd in Chromium (de echte ConvolverNode en AudioWorklet). Wordt aangeroepen door measure-convolution-reverb.py.
import * as M from './dsp-measure-lib.mjs';
const SR = 48000, DEV = '/devices/effects/ConvolutionReverb/convolution-reverb.patchkamer-device.js';
const IRS = ['church', 'hall', 'studio', 'booth', 'bathroom', 'stairwell', 'cave', 'tunnel', 'plate', 'spring', 'tube', 'bin', 'gated', 'reverse', 'tank'];
const f = (x, d = 2) => Number.isFinite(x) ? x.toFixed(d) : 'n/a';
const wavBlob = (L, R) => { const n = L.length, b = new ArrayBuffer(44 + n * 4), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  return new File([b], 'test.wav', { type: 'audio/wav' }); };
// maakt een apparaat op een OfflineAudioContext met een echte worklet
async function make(sec, state, opts = {}) {
  const mod = (await import(DEV + '?' + Math.random())).default, oc = new OfflineAudioContext(2, Math.round(SR * sec), SR);
  const host = { lang: 'en', bpm: 120, loadWorklet: async (name, src) => { await oc.audioWorklet.addModule(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); return true; },
    ui: { knob: () => ({ set() { } }), select: () => ({}), pad: () => ({}) } };
  const inst = mod.create(oc, host); await new Promise(r => setTimeout(r, 300)); inst.setState({ mix: 1, ...state }); await new Promise(r => setTimeout(r, opts.wait ?? 150));
  return { oc, inst, mod };
}
async function render(sec, state, input, opts) {
  const { oc, inst } = await make(sec, state, opts); const src = oc.createBuffer(2, oc.length, SR);
  for (let c = 0; c < 2; c++) { const d = src.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = input(i, c); }
  const s = oc.createBufferSource(); s.buffer = src; s.connect(inst.inputs.in); inst.outputs.out.connect(oc.destination); s.start();
  if (opts && opts.during) await opts.during(oc, inst);
  const t0 = performance.now(), r = await oc.startRendering(), ms = performance.now() - t0; inst.destroy();
  return { L: r.getChannelData(0), R: r.getChannelData(1), ms };
}
// de impuls komt op 0,5 s: de mix-, filter- en pre-delaygewichten van het apparaat bereiken dan hun eindwaarde (tijdconstante 30 ms), en de eerste 0,5 s van de uitvoer wordt weggeknipt
const LEAD = SR / 2;
const impulse = async (sec, state) => { const r = await render(sec + 0.5, state, (i) => i === LEAD ? 1 : 0); return { L: r.L.subarray(LEAD), R: r.R.subarray(LEAD), ms: r.ms }; };
const energy = (x, a, b) => { let e = 0; for (let i = Math.max(0, a); i < Math.min(x.length, b); i++) e += x[i] * x[i]; return e; };
const lastAbove = (x, thr) => { for (let i = x.length - 1; i >= 0; i--) if (Math.abs(x[i]) > thr) return i; return 0; };

export async function measure(want) {
  const out = [], P = s => out.push(s), on = k => !want.length || want.includes(k);
  if (on('ir')) {
    P('## Ingebouwde impulsresponsies (impuls door het apparaat, mix 100%, ConvolverNode in Chromium)');
    P('naam        lengte(s)  energie  RT60 T20 per band (125, 250, 500, 1k, 2k, 4k, 8k)            C80(dB)  NED>=0,9(ms)  IACC(0,2 s..)');
    for (const id of IRS) {
      const r = await impulse(7, { ir: id }), len = lastAbove(r.L, 1e-4) / SR; const bands = [125, 250, 500, 1000, 2000, 4000, 8000];
      const rts = bands.map(b => { const h = M.bandpass(r.L.subarray(0, Math.round(SR * Math.min(6.5, len + 0.3))), b); return f(M.decayCurve(h).rt20, 2); });
      const e80 = energy(r.L, 0, SR * 0.08), eAll = energy(r.L, 0, r.L.length), c80 = M.db(Math.sqrt(e80 / Math.max(1e-30, eAll - e80)));
      const ned = M.echoDensity(r.L.subarray(0, Math.round(SR * Math.min(3, len)))); let t = NaN; for (const [tt, v] of ned) if (v >= 0.9 && tt > 0.003) { t = tt; break; }
      const ic = len > 0.35 ? M.iacc(r.L, r.R, Math.round(SR * 0.2), Math.min(Math.round(SR * 0.3), r.L.length - Math.round(SR * 0.2))) : NaN;
      P(id.padEnd(11) + f(len, 2).padStart(8) + f((energy(r.L, 0, r.L.length) + energy(r.R, 0, r.R.length)) / 2, 3).padStart(9) + '  ' + rts.map(x => x.padStart(6)).join('') + f(c80, 1).padStart(10) + f(t * 1000, 0).padStart(12) + f(ic, 3).padStart(10));
    }
  }
  if (on('controls')) {
    P('\n## Regelaars (hall, impuls): stretch, trim, balans, tilt, HP/LP, breedte, pre-delay');
    const base = await impulse(5, { ir: 'hall' }), bl = lastAbove(base.L, 1e-4) / SR, brt = M.decayCurve(M.bandpass(base.L, 1000)).rt20;
    P('basis: lengte ' + f(bl) + ' s, RT60(1 kHz) ' + f(brt) + ' s');
    for (const s of [0.5, 0.75, 1.5, 2]) { const r = await impulse(8, { ir: 'hall', stretch: s }); P('stretch x' + s + ': lengte ' + f(lastAbove(r.L, 1e-4) / SR) + ' s, RT60(1 kHz) ' + f(M.decayCurve(M.bandpass(r.L, 1000 * s)).rt20) + ' s (gemeten op 1 kHz x stretch, want de klank schuift mee)'); }
    for (const [a, b] of [[0, 1], [300, 12], [0, 0.5]]) { const r = await impulse(5, { ir: 'hall', start: a, length: b }); P('trim begin ' + a + ' ms, lengte ' + b + ' s: eerste gemeten sample op ' + f(r.L.findIndex(v => Math.abs(v) > 1e-3) / SR * 1000, 1) + ' ms, einde ' + f(lastAbove(r.L, 1e-4) / SR) + ' s'); }
    for (const b of [-1, -0.5, 0, 0.5, 1]) { const r = await impulse(5, { ir: 'hall', balance: b }), ee = energy(r.L, 0, SR * 0.08), tt = energy(r.L, SR * 0.1, r.L.length); P('balans ' + b + ': energie vroeg(0..80 ms) ' + f(10 * Math.log10(ee + 1e-30), 1) + ' dB, staart(>100 ms) ' + f(10 * Math.log10(tt + 1e-30), 1) + ' dB'); }
    const band = (x, a, b) => { const { p, n } = M.powerSpectrum(x, 0, x.length), lo = Math.round(a / SR * n), hi = Math.round(b / SR * n); let s = 0; for (let i = lo; i < hi; i++) s += p[i]; return 10 * Math.log10(s / (hi - lo) + 1e-30); };
    const flat = await impulse(5, { ir: 'plate' }); const b0 = [band(flat.L, 100, 300), band(flat.L, 6000, 12000)];
    for (const t of [-12, -6, 6, 12]) { const r = await impulse(5, { ir: 'plate', tilt: t }); P('tilt ' + t + ' dB: laag(100-300 Hz) ' + f(band(r.L, 100, 300) - b0[0], 1) + ' dB, hoog(6-12 kHz) ' + f(band(r.L, 6000, 12000) - b0[1], 1) + ' dB t.o.v. vlak'); }
    for (const [h, l] of [[200, 20000], [800, 20000], [20, 8000], [20, 2000]]) { const r = await impulse(5, { ir: 'plate', hp: h, lp: l }); P('HP ' + h + ' / LP ' + l + ': 50 Hz ' + f(band(r.L, 40, 60) - band(flat.L, 40, 60), 1) + ' dB, 100 Hz ' + f(band(r.L, 90, 110) - band(flat.L, 90, 110), 1) + ' dB, 10 kHz ' + f(band(r.L, 9000, 11000) - band(flat.L, 9000, 11000), 1) + ' dB, 4 kHz ' + f(band(r.L, 3800, 4200) - band(flat.L, 3800, 4200), 1) + ' dB (t.o.v. vlak)'); }
    for (const w of [0, 1, 2]) { const r = await impulse(4, { ir: 'hall', width: w }); const m = r.L.map((v, i) => (v + r.R[i]) / 2), s = r.L.map((v, i) => (v - r.R[i]) / 2); P('breedte ' + w + ': IACC ' + f(M.iacc(r.L, r.R, SR * 0.2, SR), 3) + ', S/M ' + f(M.db(M.rms(s) / (M.rms(m) + 1e-30)), 1) + ' dB'); }
    for (const pd of [0, 50, 200]) { const r = await impulse(2, { ir: 'booth', predelay: pd }); P('pre-delay ' + pd + ' ms (booth): eerste uitgangssample op ' + f(r.L.findIndex(v => Math.abs(v) > 1e-3) / SR * 1000, 2) + ' ms'); }
  }
  if (on('latency')) {
    P('\n## Latency: een eigen impulsrespons (WAV: eenheidsimpuls op sample 0 en een echo van 0,5 op sample 100) via loadAudio');
    const { oc, inst } = await make(1, { ir: 'user' }); await inst.loadAudio([wavBlob(Float32Array.from({ length: 2000 }, (_, i) => i === 0 ? 1 : i === 100 ? 0.5 : 0), Float32Array.from({ length: 2000 }, (_, i) => i === 0 ? 1 : i === 100 ? 0.5 : 0))]);
    inst.setState({ ir: 'user', mix: 1, predelay: 0 }); await new Promise(r => setTimeout(r, 600));
    const src = oc.createBuffer(2, oc.length, SR); src.getChannelData(0)[24000] = 1; src.getChannelData(1)[24000] = 1; const s = oc.createBufferSource(); s.buffer = src; s.connect(inst.inputs.in); inst.outputs.out.connect(oc.destination); s.start();
    const r = await oc.startRendering(), L = r.getChannelData(0); const pk = (a, b) => { let m = 0, at = a; for (let i = 24000 + a; i < 24000 + b; i++) if (Math.abs(L[i]) > m) { m = Math.abs(L[i]); at = i - 24000; } return [at, +m.toFixed(3)]; }; const idx = [pk(-50, 20), pk(80, 130)];
    P('impuls op sample 24000 in; pieken in de uitgang (offset t.o.v. de ingang, hoogte): ' + JSON.stringify(idx) + ' => latency ' + idx[0][0] + ' samples (de eerste piek ligt op ' + idx[0][0] + ' en de echo op ' + idx[1][0] + '; verwacht 0 en 100)');
  }
  if (on('cpu')) {
    P('\n## Rekenlast: OfflineAudioContext, 20 s stereo ruis door het hele apparaat (render-tijd / audio-tijd = deel van een realtime-kern; minimum van 3 runs)');
    const noise = (() => { const r0 = M.rng(5); return () => M.gauss(r0) * 0.1; })();
    const best = async (state, extra) => { let m = 1e9; for (let k = 0; k < 3; k++) { const r = await render(20, state, () => noise(), extra); m = Math.min(m, r.ms); } return m; };
    const user12 = (() => { const r0 = M.rng(8), n = SR * 12; const L = new Float32Array(n), R = new Float32Array(n); for (let i = 0; i < n; i++) { const e = Math.exp(-3 * 2.3 * i / n); L[i] = M.gauss(r0) * e; R[i] = M.gauss(r0) * e; } return wavBlob(L, R); })();
    for (const id of ['booth', 'hall', 'church']) P(id.padEnd(8) + 'render ' + f(await best({ ir: id }), 0) + ' ms voor 20000 ms audio = ' + f(await best({ ir: id }) / 200, 1) + '% van een realtime-kern');
    let m = 1e9; for (let k = 0; k < 3; k++) { const { oc, inst } = await make(20, {}); await inst.loadAudio([user12]); inst.setState({ ir: 'user', mix: 1 }); await new Promise(r => setTimeout(r, 400)); const src = oc.createBuffer(2, oc.length, SR); for (let c = 0; c < 2; c++) { const d = src.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = noise(); } const s = oc.createBufferSource(); s.buffer = src; s.connect(inst.inputs.in); inst.outputs.out.connect(oc.destination); s.start(); const t0 = performance.now(); await oc.startRendering(); m = Math.min(m, performance.now() - t0); }
    P('eigen IR van 12 s (langste toegestane): render ' + f(m, 0) + ' ms voor 20000 ms audio = ' + f(m / 200, 1) + '% van een realtime-kern');
    const base = await (async () => { let b = 1e9; for (let k = 0; k < 3; k++) { const oc = new OfflineAudioContext(2, SR * 20, SR), buf = oc.createBuffer(2, SR * 20, SR); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = noise(); } const s = oc.createBufferSource(); s.buffer = buf; s.connect(oc.destination); s.start(); const t0 = performance.now(); await oc.startRendering(); b = Math.min(b, performance.now() - t0); } return b; })();
    P('referentie zonder apparaat (alleen een bron naar de uitgang): ' + f(base, 0) + ' ms');
  }
  if (on('stable')) {
    P('\n## Stabiliteit en wissel van impulsrespons');
    for (const id of ['hall', 'plate', 'church']) {
      const burst = [NaN, Infinity, -Infinity, 1e9, 1e30, -1e30], rn = M.rng(4);
      const r = await render(4, { ir: id }, (i, c) => i > SR && i < SR + 3000 ? burst[(i + c) % 6] : (i > 2 * SR ? M.gauss(rn) * 0.2 : 0), { wait: 300 });
      let nf = 0, mx = 0; for (let i = 0; i < r.L.length; i++) { if (!Number.isFinite(r.L[i]) || !Number.isFinite(r.R[i])) nf++; else mx = Math.max(mx, Math.abs(r.L[i]), Math.abs(r.R[i])); }
      P(id.padEnd(8) + 'burst NaN/Inf/1e9/1e30 bij 1 s, ruis vanaf 2 s: niet-eindige samples ' + nf + ', grootste |uitgang| ' + f(mx, 2) + ', RMS laatste seconde ' + f(M.rms(r.L.subarray(3 * SR)), 4));
    }
    const rr = M.rng(21); let bad = 0;
    for (let t = 0; t < 12; t++) {
      const st = { ir: IRS[t % 15], predelay: [0, 250][t & 1], start: [0, 1000][(t >> 1) & 1], length: [0.05, 12][(t >> 2) & 1], stretch: [0.5, 2][t & 1], balance: [-1, 1][(t >> 1) & 1], hp: [20, 1000][t & 1], lp: [1000, 20000][(t >> 1) & 1], tilt: [-12, 12][(t >> 2) & 1], width: [0, 2][t & 1], mix: 1 };
      const r = await render(2, st, () => M.gauss(rr) * 0.3, { wait: 200 }); for (let i = 0; i < r.L.length; i++) if (!(Math.abs(r.L[i]) < 1e3 && Math.abs(r.R[i]) < 1e3)) { bad++; break; }
    }
    P('12 runs met extreme combinaties van alle regelaars (minimum/maximum): ' + bad + ' met niet-eindige of absurde uitgang');
    const sine = (i) => Math.sin(2 * Math.PI * 220 * i / SR) * 0.5, jump = x => { let m = 0; for (let i = SR / 2; i < x.length; i++) m = Math.max(m, Math.abs(x[i] - x[i - 1])); return m; };
    const ref = await render(4, { ir: 'hall', mix: 0.5 }, sine); const sw = await render(4, { ir: 'hall', mix: 0.5 }, sine, { during: async (oc, inst) => { for (const [t, id] of [[1, 'church'], [2, 'plate'], [3, 'bathroom']]) oc.suspend(t).then(async () => { inst.setState({ ir: id, mix: 0.5 }); await new Promise(r => setTimeout(r, 500)); oc.resume(); }); } });
    P('wissel van impulsrespons tijdens het spelen (hall -> church -> plate -> bathroom, sinus 220 Hz): grootste sprong tussen twee samples ' + f(jump(sw.L), 4) + ' (zonder wissel ' + f(jump(ref.L), 4) + ')');
    const diff = sw.L.some((v, i) => Math.abs(v - ref.L[i]) > 1e-3 && i > 3.5 * SR); P('  (de wissel heeft effect gehad: ' + diff + ')');
  }
  return out.join('\n');
}
