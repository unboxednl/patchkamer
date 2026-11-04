// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Karplus String (voorheen String); de id nl.patchkamer.string blijft gelijk. Tweetalig (host.lang, namen per taal in i18n).
//   - setState volgt §13: getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - bewaker in de worklet: berichten met een niet-eindige waarde worden genegeerd, en een stem waarvan de uitvoer niet eindig of absurd groot wordt, wordt gewist
//     (voorheen kon één NaN een stem en de rest van de studio voorgoed vergiftigen); sturing buiten ±1 wordt begrensd
//   - Stop wist ook de noten die al vooruit zijn gepland maar nog niet zijn begonnen (voorheen klonken die na Stop nog)
//   - nootnummers worden begrensd (0–135); geluid en state in het normale gebied zijn ongewijzigd
// Fysisch snaarmodel (Karplus-Strong) als AudioWorklet, 8 stemmen: plukken (ruisstoot, gekleurd met Helderheid en
// Plukpositie) of strijken (doorgaande aanslag zolang de noot klinkt), demping en galmtijd in de lus, stijfheid
// (dispersie), stereo-spreiding. Speelt noten van de oranje ingang en heeft een eigen klavier. Stuurbaar.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const MODP = [['decay', 'Galmtijd', 0.1, 20, true, 'decay', 0.1, true], ['damp', 'Demping', 0, 1, false, 'tone', 0.1, true], ['bright', 'Helderheid', 0, 1, false, 'filter', 0.1, true],
  ['pos', 'Plukpositie', 0.02, 0.5, false, 'tone', 0.1, false], ['bow', 'Strijken', 0, 1, false, 'level', 0.1, false], ['stiff', 'Stijfheid', 0, 1, false, 'detune', 0.1, false],
  ['tune', 'Stemming', -100, 100, false, 'pitch', 0.03, false], ['lvl', 'Niveau', 0, 1, false, 'level', 0.05, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ decay: 3, damp: 0.4, bright: 0.6, pos: 0.15, bow: 0, stiff: 0, tune: 0, spread: 0.5, lvl: 0.7, oct: 0 });
// snelle instellingen (knoppen bovenaan de kaart); de namen staan in EN voor de Engelse weergave
const RANGE = { decay: [0.1, 20], damp: [0, 1], bright: [0, 1], pos: [0.02, 0.5], bow: [0, 1], stiff: [0, 1], tune: [-100, 100], spread: [0, 1], lvl: [0, 1] };
const EN = {
  'Gitaar': 'Guitar', 'Harp': 'Harp', 'Koto': 'Koto', 'Strijkstok': 'Bowed', 'Metaal': 'Metal', 'Dof': 'Muted',
  'Galmtijd': 'Decay', 'Demping': 'Damping', 'Helderheid': 'Brightness', 'Plukpositie': 'Pluck pos.', 'Strijken': 'Bowing', 'Stijfheid': 'Stiffness', 'Stemming': 'Tuning',
  'Octaaf': 'Octave', 'Niveau': 'Level', 'Stereo': 'Stereo', 'klavier': 'keyboard',
  'AudioWorklet laden…': 'Loading AudioWorklet…', 'AudioWorklet niet beschikbaar: Karplus String kan hier geen geluid maken.': 'AudioWorklet not available: Karplus String cannot make sound here.',
};
const PRESETS = { 'Gitaar': { decay: 3, damp: 0.4, bright: 0.6, pos: 0.15, bow: 0, stiff: 0 }, 'Harp': { decay: 6, damp: 0.25, bright: 0.45, pos: 0.4, bow: 0, stiff: 0.05 },
  'Koto': { decay: 2, damp: 0.55, bright: 0.85, pos: 0.07, bow: 0, stiff: 0.35 }, 'Strijkstok': { decay: 4, damp: 0.5, bright: 0.4, pos: 0.12, bow: 0.65, stiff: 0 },
  'Metaal': { decay: 9, damp: 0.1, bright: 0.9, pos: 0.3, bow: 0, stiff: 0.8 }, 'Dof': { decay: 1, damp: 0.85, bright: 0.25, pos: 0.25, bow: 0, stiff: 0 } };
const WNAME = 'nl-patchkamer-karplusstring-1-11-0';
const WORKLET = `
class PkString extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ['decay:3:0.05:30', 'damp:0.4:0:1', 'bright:0.6:0:1', 'pos:0.15:0.01:0.5', 'bow:0:0:1', 'stiff:0:0:1', 'tune:0:-1200:1200', 'spread:0.5:0:1', 'lvl:0.7:0:1']
    .map(s => { const [name, d, mn, mx] = s.split(':'); return { name, defaultValue: +d, minValue: +mn, maxValue: +mx, automationRate: 'k-rate' }; }); }
  constructor() { super(); this.q = []; this.v = Array.from({ length: 8 }, () => ({ on: false, buf: new Float32Array(4096), w: 0, lp: 0, ap: 0, apx: 0, ex: 0, exN: 0, bowOn: false, gateEnd: 0, age: 0, pan: 0, f: 110, vel: 1, lpEx: 0, rel: false, prev: new Float32Array(1) }));
    this.seed = 12345; this.port.onmessage = e => { const m = e.data; if (m && m.type === 'note') { if (!(isFinite(m.note) && isFinite(m.vel) && isFinite(m.t) && isFinite(m.dur))) return; this.q.push(m); this.q.sort((a, b) => a.t - b.t); } else if (m && m.type === 'stop') { this.q.length = 0; this.v.forEach(v => { v.rel = true; v.gateEnd = 0; }); } }; }
  rnd() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 1073741823.5 - 1; }
  start(m, P) { let v = this.v.find(x => !x.on) || this.v.reduce((a, b) => (a.age > b.age ? a : b)); const sr = sampleRate;
    v.on = true; v.age = 0; v.rel = false; v.f = 440 * Math.pow(2, (m.note - 69) / 12 + P.tune[0] / 1200); v.vel = m.vel; v.gateEnd = m.t + m.dur; v.pan = (Math.random() * 2 - 1) * P.spread[0];
    const L = Math.min(4000, sr / v.f); v.L = L; { const aa = 0.5 + (1 - P.damp[0]) * 0.5, st = P.stiff[0] * 0.7; v.Leff = Math.max(2, Math.min(4000, L - ((1 - aa) / aa + (1 - st) / (1 + st)))); } v.exN = Math.max(8, Math.round(L)); v.ex = v.exN; v.lpEx = 0; v.w = 0; v.buf.fill(0); v.lp = 0; v.ap = 0; v.apx = 0;
    const pd = Math.max(1, Math.round(L * P.pos[0])); v.posD = pd; v.exHist = new Float32Array(pd + 1); v.exI = 0; }
  process(inputs, outputs, P) {
    const out = outputs[0], len = out[0].length, sr = sampleRate, t0 = currentTime;
    const decay = P.decay[0], damp = P.damp[0], br = 0.05 + P.bright[0] * 0.95, bow = P.bow[0], st = P.stiff[0] * 0.7, lvl = P.lvl[0];
    out[0].fill(0); if (out[1]) out[1].fill(0);
    // stemming: de demping (éénpoler) en de dispersie (allpass) voegen samen vertraging toe; die gaat van de luslengte af
    const aa = 0.5 + (1 - damp) * 0.5, extra = (1 - aa) / aa + (1 - st) / (1 + st);
    for (const v of this.v) if (v.on) v.Leff = Math.max(2, Math.min(4000, sr / v.f - extra));
    for (let i = 0; i < len; i++) {
      const t = t0 + i / sr;
      while (this.q.length && this.q[0].t <= t) this.start(this.q.shift(), P);
      for (const v of this.v) { if (!v.on) continue;
        if (!v.rel && t >= v.gateEnd) v.rel = true;
        // aanslag: ruis gekleurd door Helderheid, met kamfilter voor Plukpositie; strijken = doorgaande ruis zolang de noot klinkt
        let e = 0; if (v.ex > 0) { v.lpEx += br * (this.rnd() - v.lpEx); e = v.lpEx * v.vel; v.ex--; }
        if (bow > 0 && !v.rel) { v.lpEx += br * (this.rnd() - v.lpEx); e += v.lpEx * bow * 0.08 * v.vel; }
        const hist = v.exHist; hist[v.exI] = e; const eOut = e - 0.9 * hist[(v.exI + 1) % hist.length]; v.exI = (v.exI + 1) % hist.length;
        // lus: vertraging L met lineaire interpolatie, demping (éénpoler), dispersie (allpass), verval per periode
        const L = v.Leff; let r = v.w - L; while (r < 0) r += 4096; const i0 = Math.floor(r), f = r - i0;
        const y = v.buf[i0 & 4095] * (1 - f) + v.buf[(i0 + 1) & 4095] * f;
        const a = 0.5 + (1 - damp) * 0.5; v.lp = a * y + (1 - a) * v.lp;
        const apOut = -st * v.lp + v.apx + st * v.ap; v.apx = v.lp; v.ap = apOut;
        const g = Math.pow(0.001, (1 / v.f) / (v.rel ? Math.min(decay, 0.25) : decay));
        v.buf[v.w] = apOut * g + eOut; v.w = (v.w + 1) & 4095; v.age++;
        const s = y * lvl * 0.8, pl = 0.5 - v.pan * 0.5, pr = 0.5 + v.pan * 0.5;
        if (!(Math.abs(s) < 100)) { v.on = false; v.buf.fill(0); continue; }   // bewaker: NaN, Infinity of een absurde waarde wist de stem
        out[0][i] += s * pl * 1.4; if (out[1]) out[1][i] += s * pr * 1.4;
        if (v.rel && v.age % 512 === 0) { let m = 0; for (let k = 0; k < 64; k++) m = Math.max(m, Math.abs(v.buf[(v.w - k) & 4095])); if (m < 1e-4) v.on = false; }
      }
    }
    return true;
  }
}
registerProcessor('${WNAME}', PkString);
`;

export default {
  id: 'nl.patchkamer.string',
  name: 'Karplus String',
  version: '1.11.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 520, minWidth: 320 },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [{ id: 'notes', name: 'Noten' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  i18n: { en: { ports: { out: 'Out', notes: 'Notes', mod: 'Mod' } } },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const S = DEF(), mod = {}; let dead = false, ui = {}, node = null, note = null; const pending = [];
    const out = ctx.createGain(); out.gain.value = 1;
    const E = k => { const m = MODBY[k], b = S[k], o = clamp(mod[k] || 0, -1, 1); if (!m || !o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    function apply() { if (!node) return; const t = ctx.currentTime, P = node.parameters; ['decay', 'damp', 'bright', 'pos', 'bow', 'stiff', 'tune', 'lvl'].forEach(k => P.get(k).setValueAtTime(E(k), t)); P.get('spread').setValueAtTime(S.spread, t); }
    function send(n, vel, t, dur) { if (!isFinite(n)) return; const m = { type: 'note', note: clamp(n + 12 * S.oct, 0, 135), vel: isFinite(vel) ? clamp(vel, 0.05, 1) : 0.8, t: isFinite(t) ? t : ctx.currentTime, dur: isFinite(dur) ? Math.min(dur, 3600) : 0.3 }; if (node) node.port.postMessage(m); else if (pending.length < 64) pending.push(m); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet'); node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.connect(out); apply(); pending.splice(0).forEach(m => { if (m.t > ctx.currentTime) node.port.postMessage(m); }); if (note) note.textContent = ''; })
      .catch(() => { if (note) note.textContent = tx('AudioWorklet niet beschikbaar: Karplus String kan hier geen geluid maken.'); });
    const pct = v => Math.round(v * 100) + '%';
    const held = new Map();
    return {
      inputs: {}, outputs: { out },
      mount(el) {
        const pr = document.createElement('div'); pr.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap'; Object.keys(PRESETS).forEach(n => { const b = document.createElement('button'); b.className = 'small'; b.textContent = tx(n); b.onclick = () => { Object.assign(S, PRESETS[n]); apply(); paint(); }; pr.appendChild(b); }); el.appendChild(pr);
        ui.decay = host.ui.knob(el, tx('Galmtijd'), [0.1, 20, 0.05], S.decay, v => v.toFixed(1) + ' s', v => { S.decay = v; apply(); });
        ui.damp = host.ui.knob(el, tx('Demping'), [0, 1, 0.01], S.damp, pct, v => { S.damp = v; apply(); });
        ui.bright = host.ui.knob(el, tx('Helderheid'), [0, 1, 0.01], S.bright, pct, v => { S.bright = v; apply(); });
        ui.pos = host.ui.knob(el, tx('Plukpositie'), [0.02, 0.5, 0.01], S.pos, v => Math.round(v * 100) + '%', v => { S.pos = v; apply(); });
        ui.bow = host.ui.knob(el, tx('Strijken'), [0, 1, 0.01], S.bow, pct, v => { S.bow = v; apply(); });
        ui.stiff = host.ui.knob(el, tx('Stijfheid'), [0, 1, 0.01], S.stiff, pct, v => { S.stiff = v; apply(); });
        ui.tune = host.ui.knob(el, tx('Stemming'), [-100, 100, 1], S.tune, v => (v > 0 ? '+' : '') + v + ' ct', v => { S.tune = v; apply(); });
        ui.oct = host.ui.select(el, tx('Octaaf'), [[-2, '−2'], [-1, '−1'], [0, '0'], [1, '+1'], [2, '+2']], S.oct, v => { S.oct = +v; });
        ui.spread = host.ui.knob(el, tx('Stereo'), [0, 1, 0.01], S.spread, pct, v => { S.spread = v; apply(); });
        ui.lvl = host.ui.knob(el, tx('Niveau'), [0, 1, 0.01], S.lvl, pct, v => { S.lvl = v; apply(); });
        const kb = document.createElement('div'); kb.style.cssText = 'display:flex;gap:2px;user-select:none;touch-action:none;margin-top:4px'; kb.setAttribute('aria-label', tx('klavier'));
        for (let n = 48; n < 72; n++) { const b = document.createElement('button'), bl = [1, 3, 6, 8, 10].includes(n % 12); b.title = NOTE[n % 12] + (Math.floor(n / 12) - 1); b.setAttribute('aria-label', b.title);
          b.style.cssText = bl ? 'flex:0 0 14px;margin:0 -8px;z-index:1;height:30px;padding:0;background:#1c2128;border-color:#444' : 'flex:1 0 16px;height:46px;padding:0;background:#e8e6df;border-color:#999';
          b.addEventListener('pointerdown', e => { e.preventDefault(); b.style.outline = '2px solid var(--event)'; send(n, 0.85, ctx.currentTime + 0.01, 4); held.set(n, 1); });
          const up = () => { b.style.outline = ''; held.delete(n); }; b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); kb.appendChild(b); }
        el.appendChild(kb);
        note = document.createElement('div'); note.className = 'note'; note.textContent = node ? '' : tx('AudioWorklet laden…'); el.appendChild(note);
      },
      unmount() { note = null; },
      onEvent(port, ev) { if (port !== 'notes' || !ev || ev.type !== 'note') return; send(ev.note | 0, typeof ev.vel === 'number' ? ev.vel : 0.8, typeof ev.time === 'number' ? ev.time : ctx.currentTime, typeof ev.dur === 'number' ? ev.dur : 0.3); },
      onTransport({ playing }) { if (!playing && node) node.port.postMessage({ type: 'stop' }); },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'string', laneName: 'Karplus String', min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && isFinite(o[k])) mod[k] = clamp(+o[k], -1, 1); apply(); },
      getState() { return { ...S }; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = DEF(); Object.keys(d).forEach(k => { S[k] = typeof s[k] === 'number' && isFinite(s[k]) ? (RANGE[k] ? clamp(s[k], RANGE[k][0], RANGE[k][1]) : s[k]) : d[k]; }); if (![-2, -1, 0, 1, 2].includes(S.oct)) S.oct = d.oct; apply(); paint(); },
      destroy() { if (dead) return; dead = true; try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) {} },
    };
    function paint() { if (!ui.decay) return; ['decay', 'damp', 'bright', 'pos', 'bow', 'stiff', 'tune', 'spread', 'lvl'].forEach(k => ui[k].set(S[k])); ui.oct.value = S.oct; }
  }
};
