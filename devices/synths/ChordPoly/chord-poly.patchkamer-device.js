// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Uitleg naar about (menu Over Chord Poly); de UI toont geen uitlegtekst meer.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in about.
// 1.11.0 — Nieuw als Chord Poly (nieuwe id nl.patchkamer.chordpoly, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Chord Poly
//   - setState volgt §13 en de knoppen en keuzes volgen setState en cc (de UI wordt niet meer opnieuw opgebouwd)
//   - de scope tekent via host.frame, met een ResizeObserver en een kleurcache (geen eigen tekenlus)
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
/** Chord Poly: polyfone akkoordsynth. Zelfstandig, geen externe bestanden.
 * Per noot twee ontstemde oscillatoren (zaagtand, puls, driehoek of sinus) en een sub, door een laagdoorlaatfilter met envelope;
 * daarna chorus, drive, compressor en plafond. Akkoordgeheugen voegt intervallen toe aan elke inkomende noot. */
const EN = {
  'Resonantie': 'Resonance', 'Filter-envelope': 'Filter envelope', 'Unison spreiding': 'Unison spread', 'Suboscillator': 'Sub oscillator',
  'Stereobreedte': 'Stereo width', 'Transpositie': 'Transpose', 'Uitgang': 'Output', 'Klank': 'Sound',
  'Klankbeeld': 'Preset', 'Golfvorm': 'Waveform', 'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Driehoek': 'Triangle', 'Sinus': 'Sine',
  'Akkoordgeheugen': 'Chord memory', 'Losse noten': 'Single notes', 'Majeur': 'Major', 'Mineur': 'Minor', 'Mineur 7': 'Minor 7', 'Eigen intervallen': 'Custom intervals',
  'Eigen intervallen (0,4,7)': 'Custom intervals (0,4,7)', 'Test akkoord': 'Test chord', 'Alles uit': 'All off', 'Golfvorm van de uitgang': 'Output waveform',
};
const CLAMP = (x, a, b) => Math.min(b, Math.max(a, x));
// terugval voor een host zonder host.frame (contract §12b)
const drawLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
export default {
  id: 'nl.patchkamer.chordpoly', name: 'Chord Poly', version: '1.13.0', kind: 'instrument', category: 'synth',
  ui: { width: 840, minWidth: 380 },
  about: { nl: 'Een polyfone akkoordsynth: twee ontstemde oscillatoren en een sub per noot, met akkoordgeheugen. Warme akkoorden, scherpe stabs en brede leads. Keyboard / sequencer → Noten.\n\nTot 24 gelijktijdige stemmen, ieder met twee ontstemde oscillatoren en een sub. Akkoordgeheugen voegt intervallen toe aan elke inkomende noot; kies Losse noten voor volledige akkoorden uit een sequencer. Mod stuurt de basisregelaars zonder ze te overschrijven.', en: 'A polyphonic chord synth: two detuned oscillators and a sub per note, with chord memory. Warm chords, sharp stabs and wide leads. Keyboard / sequencer → Notes.\n\nUp to 24 simultaneous voices, each with two detuned oscillators and a sub. Chord memory adds intervals to every incoming note; choose Single notes for full chords from a sequencer. Mod moves the basic controls without overwriting them.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let mountHost = null, panel = null, ui = {}, scope = null, scopeG = null, stopDraw = null, cw = 0, ro = null, col = null;
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    const noDrag = el => { el.addEventListener('pointerdown', e => e.stopPropagation()); return el; };
    const CSS = `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:#91e0d4;--x-acc2:#e8c991;--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted,#adc3c9)}button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}canvas{display:block;width:100%;height:64px;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px;touch-action:none}label{min-width:0}`;

    const clamp = CLAMP;
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    let dead = false, mod = {}, state, effective = {};
    const nodes = new Set(), sources = new Set();
    const own = n => (nodes.add(n), n), gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const filter = (type, hz, q = 0.7) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = Math.min(ctx.sampleRate * 0.45, hz); n.Q.value = q; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    const start = (n, t = ctx.currentTime) => { sources.add(n); n.start(t); return n; };
    const stopSource = (n, t = ctx.currentTime) => { try { n.stop(t); } catch {} };
    function dispose() { for (const n of sources) stopSource(n); for (const n of nodes) try { n.disconnect(); } catch {} sources.clear(); nodes.clear(); }
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } effective = e; return e; }
    function descriptors() { return Object.entries(spec).map(([id, d]) => ({ id, name: tx(d.name), lane: 'sound', laneName: tx('Klank'), min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); }
    function receiveMod(raw) { mod = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in spec) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1); apply(); }
    function numeric(raw, defaults) { const next = { ...defaults }; for (const [id, d] of Object.entries(spec)) next[id] = finite(raw?.[id], defaults[id], d.min, d.max); return next; }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    function ceiling() { const sh = own(ctx.createWaveShaper()), c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); sh.curve = c; sh.oversample = '2x'; return sh; }
    function compressor() { const n = own(ctx.createDynamicsCompressor()); n.threshold.value = -10; n.ratio.value = 5; n.knee.value = 8; n.attack.value = 0.003; n.release.value = 0.18; return n; }

    const spec = { cutoff: { name: 'Filter', min: 80, max: 16000, scale: 'log', role: 'filter', unit: 'Hz' }, resonance: { name: 'Resonantie', min: 0.2, max: 5, role: 'res' }, env: { name: 'Filter-envelope', min: 0, max: 4 }, detune: { name: 'Unison spreiding', min: 0, max: 35, unit: 'cent' }, sub: { name: 'Suboscillator', min: 0, max: 1, role: 'sub', unit: '%' }, attack: { name: 'Attack', min: 0.002, max: 4, scale: 'log', role: 'env', unit: 's' }, decay: { name: 'Decay', min: 0.02, max: 4, scale: 'log', role: 'decay', unit: 's' }, sustain: { name: 'Sustain', min: 0, max: 1, role: 'env', unit: '%' }, release: { name: 'Release', min: 0.03, max: 8, scale: 'log', role: 'decay', unit: 's' }, chorus: { name: 'Chorus', min: 0, max: 1, unit: '%' }, width: { name: 'Stereobreedte', min: 0, max: 1, role: 'pan', unit: '%' }, drive: { name: 'Drive', min: 0, max: 1, unit: '%' }, transpose: { name: 'Transpositie', min: -24, max: 24, role: 'pitch', unit: 'st', step: 1 }, level: { name: 'Uitgang', min: 0, max: 1, role: 'level', unit: '%' } };
    const defaults = { cutoff: 4200, resonance: 0.8, env: 1.2, detune: 12, sub: 0.18, attack: 0.015, decay: 0.5, sustain: 0.65, release: 1.1, chorus: 0.45, width: 0.8, drive: 0.15, transpose: 0, level: 0.7, wave: 'sawtooth', chord: 'none', memory: '0,4,7', preset: 'Warehouse Chords' };
    const chords = { none: [0], major: [0, 4, 7], minor: [0, 3, 7], sus: [0, 5, 7], seventh: [0, 3, 7, 10] };
    const presets = { 'Warehouse Chords': {}, 'Warm Horizon': { cutoff: 2400, env: 0.4, attack: 0.7, release: 3, chorus: 0.7, detune: 8 }, 'Rave Stab': { cutoff: 1800, resonance: 1.5, env: 2.7, attack: 0.003, decay: 0.22, sustain: 0.08, release: 0.2, drive: 0.35 }, 'Glass Pulse': { wave: 'square', cutoff: 5200, env: 2, sub: 0, detune: 5, decay: 0.3, sustain: 0.1, release: 0.5 }, 'Soft Organ': { wave: 'triangle', sub: 0.4, env: 0, chorus: 0.6, attack: 0.01, decay: 0.2, sustain: 1, release: 0.1 }, 'Wide Lead': { cutoff: 7000, resonance: 1.2, env: 0.4, detune: 22, chorus: 0.5, attack: 0.008, sustain: 0.8 }, 'Night Pad': { cutoff: 1300, env: 0.8, attack: 2, decay: 2, sustain: 0.7, release: 5, detune: 17, chorus: 0.8 }, 'Electric Chimes': { wave: 'triangle', cutoff: 9000, env: 0.3, attack: 0.002, decay: 1, sustain: 0, release: 1.5, chorus: 0.25 } };
    state = { ...defaults }; resolve();
    const voices = new Set(), bus = gain(1), dry = gain(0.8), wet = gain(0.3), pre = gain(1), shaper = own(ctx.createWaveShaper()), volume = gain(0.7);
    const comp = compressor();
    const out = ceiling(), analyser = own(ctx.createAnalyser());
    const curve = new Float32Array(2049); for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh((i / (curve.length - 1) * 2 - 1) * 2) / Math.tanh(2); shaper.curve = curve; shaper.oversample = '2x';
    bus.connect(dry).connect(pre); wet.connect(pre); pre.connect(shaper).connect(volume).connect(comp).connect(out); out.connect(analyser); analyser.fftSize = 1024;
    const chorus = []; for (let i = 0; i < 2; i++) { const delay = own(ctx.createDelay(0.1)), lfo = own(ctx.createOscillator()), depth = gain(0.002), pan = own(ctx.createStereoPanner()); delay.delayTime.value = 0.018 + i * 0.007; lfo.frequency.value = 0.27 + i * 0.11; lfo.connect(depth).connect(delay.delayTime); bus.connect(delay).connect(pan).connect(wet); start(lfo); chorus.push({ delay, lfo, depth, pan, i }); }
    function voiceLevel(v, t) { const age = t - v.t; if (age < 0) return 0; if (Number.isFinite(v.off) && t >= v.off) return v.offValue * Math.max(0, 1 - (t - v.off) / v.rel); if (age < v.a) return v.peak * age / v.a; if (age < v.a + v.d) return v.peak * (1 - (1 - v.s) * (age - v.a) / v.d); return v.peak * v.s; }
    function release(v, t, seconds = effective.release) { if (v.ended || t >= v.end) return; const value = voiceLevel(v, t); v.amp.gain.cancelScheduledValues(t); v.amp.gain.setValueAtTime(value, t); v.amp.gain.linearRampToValueAtTime(0, t + seconds); v.off = t; v.offValue = value; v.rel = seconds; v.end = t + seconds; for (const o of v.osc) stopSource(o, t + seconds + 0.01); }
    function cleanup(v) { if (v.ended) return; v.ended = true; voices.delete(v); for (const n of v.owned) { try { n.disconnect(); } catch {} nodes.delete(n); sources.delete(n); } }
    function filterVoice(v, t) { const age = Math.max(0, t - v.t), base = effective.cutoff, env = effective.env; v.filter.frequency.cancelScheduledValues(t); const peak = Math.min(ctx.sampleRate * 0.45, base * 2 ** env), sustain = Math.min(ctx.sampleRate * 0.45, base * 2 ** (env * v.s)); if (age < v.a) { v.filter.frequency.setValueAtTime(base, t); v.filter.frequency.exponentialRampToValueAtTime(peak, v.t + v.a); v.filter.frequency.exponentialRampToValueAtTime(sustain, v.t + v.a + v.d); } else smooth(v.filter.frequency, sustain, t); smooth(v.filter.Q, effective.resonance, t); }
    function apply() { const old = effective; resolve(); smooth(volume.gain, effective.level); smooth(pre.gain, 1 + effective.drive * 2.5); smooth(dry.gain, 1 - effective.chorus * 0.25); smooth(wet.gain, effective.chorus * 0.65); for (const c of chorus) { smooth(c.depth.gain, 0.0003 + effective.chorus * 0.003); smooth(c.pan.pan, (c.i ? 1 : -1) * effective.width); } for (const v of voices) { if (v.end <= ctx.currentTime) continue; for (let i = 0; i < v.osc.length; i++) { smooth(v.osc[i].detune, effective.transpose * 100 + (i === 0 ? -effective.detune : i === 1 ? effective.detune : 0)); if (i < 2) v.osc[i].type = state.wave; } smooth(v.subGain.gain, effective.sub * 0.5); if (old.cutoff !== effective.cutoff || old.env !== effective.env || old.resonance !== effective.resonance) filterVoice(v, Math.max(ctx.currentTime, v.t)); } }
    function playSingle(note, vel, t, duration, root = note) {
      if (dead) return; for (const v of [...voices]) if (v.end < ctx.currentTime - 0.05) cleanup(v); if ([...voices].filter(v => v.end > t + 0.01).length >= 24) { const oldest = [...voices].filter(v => v.end > t + 0.01).sort((a, b) => a.t - b.t)[0]; release(oldest, Math.max(ctx.currentTime, t), 0.008); } if (voices.size >= 32) { const oldest = [...voices].sort((a, b) => a.end - b.end)[0]; for (const o of oldest.osc) stopSource(o, ctx.currentTime); cleanup(oldest); }
      const amp = gain(0), f = filter('lowpass', effective.cutoff, effective.resonance), p = own(ctx.createStereoPanner()), s = gain(effective.sub * 0.5), osc = [own(ctx.createOscillator()), own(ctx.createOscillator()), own(ctx.createOscillator())];
      osc[0].type = osc[1].type = state.wave; osc[2].type = 'square'; for (let i = 0; i < 3; i++) { osc[i].frequency.setValueAtTime(hz(note) * (i === 2 ? 0.5 : 1), t); osc[i].detune.value = effective.transpose * 100 + (i === 0 ? -effective.detune : i === 1 ? effective.detune : 0); if (i === 2) osc[i].connect(s).connect(f); else osc[i].connect(f); start(osc[i], t); } f.connect(amp).connect(p).connect(bus); p.pan.value = ((note % 7) / 3 - 1) * effective.width * 0.3;
      const v = { osc, amp, filter: f, subGain: s, root, t, a: effective.attack, d: effective.decay, s: effective.sustain, peak: 0.12 * vel, end: Infinity, owned: [...osc, amp, f, p, s], ended: false }; voices.add(v); osc[0].onended = () => cleanup(v); amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(v.peak, t + v.a); amp.gain.linearRampToValueAtTime(v.peak * v.s, t + v.a + v.d); filterVoice(v, t); if (Number.isFinite(duration)) release(v, t + Math.max(0.005, duration));
    }
    function play(note, vel, t, dur) { const intervals = state.chord === 'memory' ? state.memory.split(',').map(Number) : chords[state.chord] || [0]; for (const interval of intervals) if (note + interval >= 0 && note + interval <= 127) playSingle(note + interval, vel / Math.sqrt(intervals.length), t, dur, note); }
    function panic(t = ctx.currentTime) { for (const v of voices) release(v, t, 0.035); }
    function parseMemory(s) { const a = String(s || '0,4,7').split(',').map(Number).filter(Number.isFinite).map(x => Math.round(clamp(x, -24, 36))); return [...new Set(a)].slice(0, 6).join(',') || '0'; }

    // ---------- UI ----------
    const fmtOf = d => v => d.unit === '%' ? Math.round(v * 100) + '%' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
    const toPos = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : v;
    function selectBox(parent, label, options, value, change) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = noDrag(add(box, 'select')); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, id, d) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(d.name)); const fmt = fmtOf(d), log = d.scale === 'log';
      const out = add(box, 'output', fmt(state[id])), input = noDrag(add(box, 'input')); input.type = 'range';
      [input.min, input.max, input.step] = (log ? [0, 1, 0.001] : [d.min, d.max, d.step || 0.01]).map(String); input.value = String(toPos(d, state[id])); input.setAttribute('data-pk-default', String(toPos(d, defaults[id])));
      input.oninput = () => { const n = Number(input.value); state[id] = log ? d.min * (d.max / d.min) ** n : n; out.textContent = fmt(state[id]); apply(); };
      ui.k[id] = { set(v) { input.value = String(toPos(d, v)); out.textContent = fmt(v); } };
    }
    function paint() {
      if (!panel) return; for (const [id, k] of Object.entries(ui.k)) k.set(state[id]);
      ui.preset.value = state.preset; ui.wave.value = state.wave; ui.chord.value = state.chord; ui.memory.value = state.memory;
    }
    function sizeScope() { if (!scope || !cw) return; const dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4); scope.width = Math.round(cw * dpr); scope.height = Math.round(64 * dpr); if (scopeG) scopeG.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function readColors() { const cs = getComputedStyle(panel), v = (n, d) => cs.getPropertyValue(n).trim() || d; col = { well: v('--well', '#0b171d'), wellFg: v('--well-fg', '#c7dbe0') }; }
    const onSkin = () => { col = null; };
    const data = new Float32Array(analyser.fftSize || 1024);
    function draw() {
      if (dead || !scope || !scopeG || !cw) return; if (!col) readColors();
      const w = cw, h = 64, g = scopeG; analyser.getFloatTimeDomainData(data);
      g.fillStyle = col.well; g.fillRect(0, 0, w, h); g.strokeStyle = col.wellFg; g.beginPath();
      for (let i = 0; i < data.length; i++) { const x = i / (data.length - 1) * w, y = h / 2 - clamp(data[i], -1, 1) * h * 0.46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    function mount(el) {
      unmount(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap; ui = { k: {} };
      add(shadow, 'style', CSS); panel = add(shadow, 'div'); panel.className = 'app';
      const top = add(panel, 'div'); top.className = 'row';
      ui.preset = selectBox(top, tx('Klankbeeld'), Object.keys(presets).map(k => [k, k]), state.preset, v => self.setState({ ...defaults, ...presets[v], preset: v }));
      ui.wave = selectBox(top, tx('Golfvorm'), [['sawtooth', tx('Zaagtand')], ['square', tx('Puls')], ['triangle', tx('Driehoek')], ['sine', tx('Sinus')]], state.wave, v => { state.wave = v; apply(); });
      ui.chord = selectBox(top, tx('Akkoordgeheugen'), [['none', tx('Losse noten')], ['major', tx('Majeur')], ['minor', tx('Mineur')], ['sus', 'Sus4'], ['seventh', tx('Mineur 7')], ['memory', tx('Eigen intervallen')]], state.chord, v => { state.chord = v; });
      { const box = add(top, 'label'); box.className = 'control'; add(box, 'span', tx('Eigen intervallen (0,4,7)')); const input = noDrag(add(box, 'input')); input.type = 'text'; input.value = state.memory; input.onchange = () => { state.memory = parseMemory(input.value); input.value = state.memory; }; ui.memory = input; }
      for (const [label, fn] of [[tx('Test akkoord'), () => { for (const n of [48, 55, 60, 64]) playSingle(n, 0.8, ctx.currentTime, 1.2); }], [tx('Alles uit'), () => panic()]]) { const b = noDrag(add(top, 'button', label)); b.type = 'button'; b.onclick = fn; }
      scope = add(panel, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang')); scopeG = scope.getContext('2d');
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) { cw = Math.max(260, Math.min(1200, w)); sizeScope(); } }); ro.observe(scope); }
      const g = add(panel, 'div'); g.className = 'grid'; for (const [id, d] of Object.entries(spec)) knob(g, id, d);
      if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
      stopDraw = drawLoop(host, self, draw, 30);
    }
    function unmount() {
      if (stopDraw) { stopDraw(); stopDraw = null; } if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
      if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; scope = null; scopeG = null; col = null; cw = 0; ui = { k: {} };
    }
    const self = {
      inputs: {}, outputs: { out }, mount, unmount,
      onEvent(port, e) { try { if (dead || port !== 'notes' || !Number.isFinite(e?.time)) return; const t = Math.max(ctx.currentTime, e.time), type = cleanType(e); if (type === 'panic' || type === 'allnotesoff') panic(t); else if (type === 'noteoff' || e.vel === 0) { for (const v of voices) if (v.root === e.note) release(v, t); } else if (['note', 'noteon'].includes(type) && Number.isFinite(e.note)) play(Math.round(clamp(e.note, 0, 127)), finite(e.vel, 0.8, 0, 1), t, e.held || type === 'noteon' && !Number.isFinite(e.dur) ? undefined : Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1); else if (type === 'cc' && Object.hasOwn(spec, e.id) && Number.isFinite(e.value)) { const d = spec[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min); apply(); paint(); } } catch {} },
      onTransport(e) { if (!e?.playing) panic(); },
      params: descriptors, modulate: receiveMod,
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; panic(); const s = raw && typeof raw === 'object' ? raw : {}; state = numeric(s, defaults);
        state.wave = ['sawtooth', 'square', 'triangle', 'sine'].includes(s.wave) ? s.wave : defaults.wave;
        state.chord = Object.hasOwn(chords, s.chord) || s.chord === 'memory' ? s.chord : 'none';
        state.memory = parseMemory(typeof s.memory === 'string' ? s.memory : defaults.memory); state.preset = Object.hasOwn(presets, s.preset) ? s.preset : defaults.preset; apply(); paint();
      },
      destroy() { if (dead) return; dead = true; unmount(); dispose(); voices.clear(); },
    };
    apply(); return self;
  },
};
