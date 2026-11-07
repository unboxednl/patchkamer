// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs in the page (Chromium) of docs/tools/build-tune-index.py and eval-tune-finder.py: renders notes with the real device code in an OfflineAudioContext and analyses them with the shared analysis module of Tune Finder.
window.TFinit = code => { window.TA = new Function(code + ';return TA;')(); return { dims: TA.DIMS, version: TA.VERSION }; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function mkHost(ctx, pend) {
  return new Proxy({ lang: 'en', audio: { sampleRate: ctx.sampleRate, quality: 'normal', oversample: '2x', latency: 0.01 }, bpm: 120, swing: 0, stepDur: () => 0.125, emit() {}, paramsChanged() {}, noteNamesChanged() {}, bundleChanged() {},
    frame() { return () => {}; }, visible() { return false; }, ui: {}, peers() { return []; },
    loadWorklet(n, c) { if (!window.__wl) window.__wl = new Map(); const k = ctx; let m = window.__wl.get(k); if (!m) window.__wl.set(k, m = new Map()); if (m.has(n)) return m.get(n);
      const u = URL.createObjectURL(new Blob([c], { type: 'text/javascript' })); const p = ctx.audioWorklet.addModule(u).then(() => true); m.set(n, p); pend.push(p); return p; } },
    { get: (t, k) => (k in t ? t[k] : () => {}) });
}
window.TFrender = async spec => {
  const SR = spec.sr || 44100, t0 = performance.now(), total = spec.total || 2.0;
  const ctx = new OfflineAudioContext(2, Math.ceil(total * SR), SR), pend = [], host = mkHost(ctx, pend);
  const mod = await import(spec.deviceUrl), d = mod.default, inst = d.create(ctx, host);
  const set = (i, st) => { if (typeof i.setPreset === 'function') i.setPreset(st); else if (i.setState) i.setState(st); };
  if (spec.state) set(inst, JSON.parse(JSON.stringify(spec.state)));
  let tail = inst.outputs[(d.ports.audioOut[0] || {}).id];
  const fxs = [];
  for (const fx of spec.fx || []) {
    const fm = (await import(fx.url)).default, fi = fm.create(ctx, host); if (fx.state) set(fi, fx.state);
    await Promise.all(pend); tail.connect(fi.inputs[fm.ports.audioIn[0].id]); tail = fi.outputs[fm.ports.audioOut[0].id]; fxs.push(fi);
  }
  await Promise.all(pend); await new Promise(r => setTimeout(r, 30));
  let node = tail; if (spec.lpHz) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = spec.lpHz; lp.Q.value = 0.707; tail.connect(lp); node = lp; }
  node.connect(ctx.destination);
  const port = (d.ports.eventIn[0] || {}).id;
  if (spec.transport && inst.onTransport) inst.onTransport({ playing: true });
  const ev = spec.notes.map(n => ({ n: n.note, v: n.vel, t: n.t, dur: n.dur })).sort((a, b) => a.t - b.t);
  let idx = 0; const AHEAD = 0.5, STEP = 0.25;
  const pump = upto => { while (idx < ev.length && ev[idx].t < upto) { const e = ev[idx++]; inst.onEvent(port, { type: 'note', note: e.n, vel: e.v, time: e.t, dur: e.dur }); } };
  pump(AHEAD);
  for (let t = STEP; t < total - 0.01; t += STEP) ctx.suspend(Math.round(t * SR / 128) * 128 / SR).then(() => { pump(ctx.currentTime + AHEAD); ctx.resume(); });
  const buf = await ctx.startRendering();
  let L = buf.getChannelData(0).slice(), R = buf.getChannelData(1).slice(), bad = 0, pk = 0;
  for (const a of [L, R]) for (let i = 0; i < a.length; i++) { const v = a[i]; if (!Number.isFinite(v)) { bad++; a[i] = 0; } else if (Math.abs(v) > pk) pk = Math.abs(v); }
  const tr = performance.now() - t0;
  try { inst.destroy && inst.destroy(); fxs.forEach(f => f.destroy && f.destroy()); } catch (e) {}
  const dg = spec.deg || {}, rnd = mulberry(spec.seed || 1);
  const g = Math.pow(10, (dg.gainDb || 0) / 20);
  if (g !== 1) for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
  if (dg.noiseDb) { const na = Math.pow(10, dg.noiseDb / 20) * Math.sqrt(3); for (let i = 0; i < L.length; i++) { L[i] += (rnd() * 2 - 1) * na; R[i] += (rnd() * 2 - 1) * na; } }
  const chs = dg.mono ? [L.map((v, i) => (v + R[i]) / 2)] : [L, R];
  let audio = null; if (spec.wantAudio) { const b64 = a => { const u = new Uint8Array(a.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }; audio = chs.map(c => b64(Float32Array.from(c))); }
  const ta = performance.now(); const r = await TA.analyse(chs, SR); const tA = performance.now() - ta;
  return { r: r && { vec: Array.from(r.vec), f0: r.f0, f0spread: r.f0spread, voiced: r.voiced, stereo: r.stereo, onsets: r.onsets }, peak: pk, bad, tr, tA, audio };
};
