// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Uitleg naar about (menu Over Low Bass); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (basssynthesizer) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.11.0 — Nieuw als Low Bass (nieuwe id nl.patchkamer.lowbass, eigen map; voorheen Laag Bass, nl.patchkamer.laag), bijgewerkt naar Patchkamer contract v1.11.
//   Het geluid is ongewijzigd; tunes en songs uit die tijd verwijzen naar de oude id en laden hier niet in.
//   - tweetalig (host.lang, apparaat- en poortnamen per taal in i18n)
//   - bewaker tegen een ontspoord filter: om de 50 ms wordt de ruwe filteruitvoer gecontroleerd; bij NaN, Infinity of een absurde waarde
//     worden de filters vervangen en gaat het geluid door
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard; de preset-naam
//     "Eigen" heet nu "Custom" (de oude naam wordt nog gelezen)
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
//   - in het Mod-spoor staan nu alle parameters standaard aan behalve Pitchbend en Volume (voorheen ook zeven tijd- en envelope-knoppen uit); het geluid is ongewijzigd
// Een mono basssynth: twee licht tegen elkaar gestemde oscillatoren plus sub, optioneel FM, een vierpolig lowpass-filter met envelope,
// drive, glide, ADSR, legato en zeven presets. Geen sequencer: speelt noten van een extern keyboard of een externe sequencer.

const EN = {
  'Eigen': 'Custom', 'Aan': 'On', 'Uit': 'Off', 'Proefbas': 'Test bass', 'Alles uit': 'All off',
  'Golfvorm': 'Waveform', 'Resonantie': 'Resonance', 'Zweving': 'Detune', 'FM-diepte': 'FM depth', 'Filter-envelope': 'Filter envelope',
};
const LABELS = { cutoff: 'Cutoff', resonance: 'Resonantie', sub: 'Sub', detune: 'Zweving', drive: 'Drive', fm: 'FM-diepte', env: 'Filter-envelope', glide: 'Glide', attack: 'Attack', decay: 'Decay', sustain: 'Sustain', release: 'Release', accent: 'Accent', level: 'Volume', bend: 'Pitchbend' };

export default {
  id: 'nl.patchkamer.lowbass', name: 'Low Bass', version: '1.13.0', kind: 'instrument', category: 'synth', ui: { width: 680, minWidth: 340 },
  about: { nl: 'Basssynthesizer: monofoon met laatste-noot-prioriteit, legato, sub-oscillator en FM.\n\nVerbind een keyboard of sequencer met de ingang Noten.\n\nEen paarse Mod-kabel laat klankparameters bewegen. Enveloppen en glide worden bij de volgende noot gelezen.', en: 'A bass synthesizer: monophonic with last-note priority, legato, sub oscillator and FM.\n\nConnect a keyboard or sequencer to the Notes input.\n\nA purple Mod cable moves sound parameters. Envelopes and glide are read at the next note.' },
  i18n: { nl: { ports: { out: 'Bass uit', notes: 'Noten' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Bass out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const finite = (v, d, a, b) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
    let mountHost = null, panel = null, uiHandles = {};
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function mountUI(el, title) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:#91e0d4;--x-acc2:#e8c991;--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted,#adc3c9)}button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}label{min-width:0}`);
      panel = add(shadow, 'div', undefined); panel.className = 'app'; uiHandles = {}; return panel;
    }
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; uiHandles = {}; }
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, id, label, bounds, value, change, format = v => Number(v).toFixed(2), start = value) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input'); input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.dataset.pkDefault = String(start); input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; uiHandles[id] = { set(v) { input.value = String(v); out.textContent = format(v); } }; return input; }

    const spec = { cutoff: [40, 10000, 10, 650, 'log', 'filter'], resonance: [0.2, 7, 0.1, 1.2, 'lin', 'res'], sub: [0, 1, 0.01, 0.5, 'lin', 'sub'], detune: [0, 20, 0.1, 3, 'lin', 'pitch'], drive: [1, 16, 0.1, 2, 'log', 'color'], fm: [0, 1200, 1, 0, 'lin', 'color'], env: [0, 5, 0.01, 2, 'lin', 'env'], glide: [0.001, 1.5, 0.001, 0.04, 'log', 'glide'], attack: [0.001, 2, 0.001, 0.008, 'log', 'env'], decay: [0.02, 3, 0.01, 0.3, 'log', 'decay'], sustain: [0, 1, 0.01, 0.7, 'lin', 'env'], release: [0.01, 6, 0.01, 0.2, 'log', 'decay'], accent: [0, 1, 0.01, 0.4, 'lin', 'level'], level: [0, 1, 0.01, 0.75, 'lin', 'level'], bend: [-12, 12, 0.01, 0, 'lin', 'pitch'] };
    const defaults = { ...Object.fromEntries(Object.entries(spec).map(([k, d]) => [k, d[3]])), wave: 'sawtooth', legato: true, preset: 'Analog Bass' };
    const presets = { 'Analog Bass': {}, 'Deep Sub': { wave: 'triangle', sub: 1, cutoff: 280, resonance: 0.7, env: 0.5, drive: 1.3 }, 'Acid Slide': { wave: 'sawtooth', cutoff: 450, resonance: 4.5, env: 3.5, decay: 0.18, glide: 0.09, sub: 0.2, drive: 3 }, 'Square Punch': { wave: 'square', cutoff: 1800, resonance: 0.8, env: 2.5, attack: 0.002, decay: 0.15, sustain: 0.4, sub: 0.6 }, 'FM Growl': { fm: 650, cutoff: 2800, drive: 5, sub: 0.5, detune: 0, env: 1.2 }, 'Rumble Bass': { wave: 'triangle', cutoff: 300, drive: 6, sub: 1, release: 0.6, env: 0.4 }, 'Pluck Bass': { cutoff: 1600, env: 2, decay: 0.12, sustain: 0.05, release: 0.08, legato: false } };
    let state = { ...defaults }, effective = {}, mod = {}, dead = false, held = [], current = null, envData = null; const nodes = [], sources = [];
    const own = n => (nodes.push(n), n), g = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; }, f = (type, freq) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = freq; return n; };
    const a = own(ctx.createOscillator()), b = own(ctx.createOscillator()), sub = own(ctx.createOscillator()), ma = g(0.6), mb = g(0.35), ms = g(0.5), fm = g(0), mix = g(1); let lp = f('lowpass', 650), lp2 = f('lowpass', 650); const pre = g(2), shape = own(ctx.createWaveShaper()), hp = f('highpass', 25), amp = g(0), level = g(0.75), out = own(ctx.createDynamicsCompressor()), mon = own(ctx.createAnalyser());
    function wireFilters() { mix.connect(lp); lp.connect(lp2); lp2.connect(pre); lp2.connect(mon); }
    a.connect(ma).connect(mix); b.connect(mb).connect(mix); sub.connect(ms).connect(mix); b.connect(fm).connect(a.frequency); wireFilters(); pre.connect(shape).connect(hp).connect(amp).connect(level).connect(out); sub.type = 'sine'; a.frequency.value = b.frequency.value = 110; sub.frequency.value = 55; mon.fftSize = 256;
    const curve = new Float32Array(4097); for (let i = 0; i < curve.length; i++) { const x = 2 * i / (curve.length - 1) - 1; curve[i] = Math.tanh(x * 2) / Math.tanh(2); } shape.curve = curve; shape.oversample = '2x'; out.threshold.value = -9; out.knee.value = 8; out.ratio.value = 5; out.attack.value = 0.004; out.release.value = 0.15;
    for (const o of [a, b, sub]) { o.start(); sources.push(o); } const target = (p, v, t = ctx.currentTime) => p.setTargetAtTime(v, t, 0.02);
    // bewaker: kijkt naar de ruwe filteruitvoer (vóór de vervormer, die een ontsporing verbergt). Een instabiel filter geeft Infinity en daarna NaN
    // en herstelt nooit meer; dan worden de filters vervangen. Alleen in een live context: een offline render loopt niet in wandkloktijd.
    const chk = new Float32Array(256);
    function rebuildFilters() {
      for (const x of [lp, lp2]) { try { x.disconnect(); } catch {} const i = nodes.indexOf(x); if (i >= 0) nodes.splice(i, 1); }
      try { mix.disconnect(lp); } catch {}
      lp = f('lowpass', 650); lp2 = f('lowpass', 650); wireFilters(); apply();
    }
    function guard() { if (dead) return; mon.getFloatTimeDomainData(chk); for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) { rebuildFilters(); return; } }
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();
    function apply(t = ctx.currentTime) { effective = { ...state }; for (const [k, d] of Object.entries(spec)) effective[k] = clamp(d[4] === 'log' ? state[k] * (d[1] / d[0]) ** (mod[k] || 0) : state[k] + (mod[k] || 0) * (d[1] - d[0]), d[0], d[1]); a.type = b.type = state.wave; target(lp.frequency, effective.cutoff, t); target(lp2.frequency, effective.cutoff, t); target(lp.Q, effective.resonance, t); target(lp2.Q, 0.65, t); target(ms.gain, effective.sub * 0.65, t); target(b.detune, effective.detune + effective.bend * 100, t); target(a.detune, -effective.detune + effective.bend * 100, t); target(sub.detune, effective.bend * 100, t); target(pre.gain, effective.drive, t); target(level.gain, effective.level / Math.sqrt(effective.drive), t); target(fm.gain, effective.fm, t); }
    function at(t) { if (!envData) return 0; const e = envData, x = t - e.t; if (x <= 0) return 0; if (Number.isFinite(e.off) && t >= e.off) return Math.max(0, e.releaseLevel * (1 - (t - e.off) / e.release)); if (x < e.a) return e.peak * x / e.a; if (x < e.a + e.d) return e.peak * (1 - (1 - e.s) * (x - e.a) / e.d); return e.peak * e.s; }
    function off(t) { const value = at(t); if (envData) { envData.off = t; envData.release = effective.release; envData.releaseLevel = value; } amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(value, t); amp.gain.linearRampToValueAtTime(0, t + effective.release); lp.detune.cancelScheduledValues(t); lp.detune.setTargetAtTime(0, t, Math.max(0.01, effective.release / 3)); current = null; }
    function play(n, v, t, duration) {
      held = held.filter(x => x.end > t && x.note !== n); const legato = state.legato && current && current.end > t; const entry = { note: n, start: t, end: Number.isFinite(duration) ? t + duration : Infinity, vel: v }; held.push(entry); current = entry;
      for (const [o, ratio] of [[a, 1], [b, 1], [sub, 0.5]]) { o.frequency.cancelScheduledValues(t); o.frequency.setTargetAtTime(440 * 2 ** ((n - 69) / 12) * ratio, t, legato ? effective.glide : 0.002); }
      amp.gain.cancelScheduledValues(t); const peak = 0.3 * (0.65 + v * 0.35 + effective.accent * v * 0.2);
      if (!legato) { envData = { t, a: effective.attack, d: effective.decay, s: effective.sustain, peak }; amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(peak, t + effective.attack); amp.gain.linearRampToValueAtTime(peak * effective.sustain, t + effective.attack + effective.decay); } else { amp.gain.setValueAtTime(at(t), t); amp.gain.setTargetAtTime(peak * effective.sustain, t, 0.02); envData = { t, a: 0.001, d: 0.02, s: effective.sustain, peak }; }
      lp.detune.cancelScheduledValues(t); lp.detune.setValueAtTime(effective.env * 1200 * (0.5 + v * 0.5), t); lp.detune.setTargetAtTime(0, t, Math.max(0.01, effective.decay / 3)); if (Number.isFinite(duration)) { const end = t + duration; const saved = current; off(end); current = saved; }
    }
    function releaseNote(n, t) { held = held.filter(x => x.note !== n && x.end > t); if (current?.note !== n) return; const next = held.filter(x => x.start <= t).at(-1); if (next) play(next.note, next.vel, t, Number.isFinite(next.end) ? next.end - t : undefined); else off(t); }
    function panic(t = ctx.currentTime) { held = []; off(t); }
    function paint() { for (const k in uiHandles) uiHandles[k].set(state[k]); }
    function render(el) {
      mountUI(el, ''); const top = row(panel);
      select(top, 'Preset', Object.keys(presets).map(k => [k, k]).concat([['Custom', tx('Eigen')]]), state.preset, v => { if (presets[v]) { self.setState({ ...defaults, ...presets[v], preset: v }); render(el); } });
      select(top, tx('Golfvorm'), [['sawtooth', 'Saw'], ['square', 'Square'], ['triangle', 'Triangle']], state.wave, v => { state.wave = v; state.preset = 'Custom'; apply(); });
      select(top, 'Legato', [['1', tx('Aan')], ['0', tx('Uit')]], state.legato ? '1' : '0', v => state.legato = v === '1');
      const box = grid(panel); for (const [k, d] of Object.entries(spec)) knob(box, k, tx(LABELS[k]), d.slice(0, 3), state[k], v => { state[k] = Number(v.toFixed(6)); state.preset = 'Custom'; apply(); }, v => k === 'cutoff' ? Math.round(v) + ' Hz' : v.toFixed(2), d[3]);
      button(row(panel), tx('Proefbas'), () => play(36, 0.85, ctx.currentTime, 0.6)); button(row(panel), tx('Alles uit'), () => panic());
    }
    const self = { inputs: {}, outputs: { out }, mount: render, unmount: clearUI, onTransport(info) { if (!dead && !info?.playing) panic(); }, onEvent(port, e) { try { if (dead || port !== 'notes' || !e || !Number.isFinite(e.time)) return; const t = Math.max(ctx.currentTime, e.time), type = String(e.type).toLowerCase().replace(/[_-]/g, ''); if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(e.note)) { const n = clamp(e.note, 0, 127); if (type === 'noteoff' || e.vel === 0) releaseNote(n, t); else play(n, finite(e.vel, 0.8, 0, 1), t, e.held === true ? undefined : Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : undefined); } else if (type === 'cc' && spec[e.id] && Number.isFinite(e.value)) { const d = spec[e.id]; state[e.id] = d[0] + clamp(e.value, 0, 1) * (d[1] - d[0]); state.preset = 'Custom'; apply(t); paint(); } else if (type === 'panic' || type === 'allnotesoff') panic(t); } catch {} }, params() { return Object.entries(spec).map(([id, d]) => ({ id, name: tx(LABELS[id]), lane: 'bass', laneName: 'Bass', min: d[0], max: d[1], scale: d[4], role: d[5], drift: 0.015, on: !['bend', 'level'].includes(id) })); }, modulate(o) { if (dead) return; mod = {}; if (o && typeof o === 'object') for (const k in spec) if (Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); }, getState() { return { ...state }; }, setState(raw) { if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults }; for (const [k, d] of Object.entries(spec)) next[k] = finite(s[k], d[3], d[0], d[1]); if (['sawtooth', 'square', 'triangle'].includes(s.wave)) next.wave = s.wave; if (typeof s.legato === 'boolean') next.legato = s.legato; if (s.preset === 'Custom' || s.preset === 'Eigen') next.preset = 'Custom'; else if (typeof s.preset === 'string' && Object.hasOwn(presets, s.preset)) next.preset = s.preset; state = next; apply(); if (mountHost) render(mountHost); }, destroy() { if (dead) return; dead = true; if (guardT) clearInterval(guardT); clearUI(); for (const n of sources) try { n.stop(); } catch {} for (const n of nodes) try { n.disconnect(); } catch {} held = []; } }; apply(); return self;
  },
};
