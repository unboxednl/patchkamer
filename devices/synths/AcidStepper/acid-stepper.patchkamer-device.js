// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Uitleg naar about (menu Over Acid Stepper); de UI toont geen uitlegtekst meer.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de omschrijving staat nu in about.
// 1.11.0 — Nieuw als Acid Stepper (nieuwe id nl.patchkamer.acidstepper, eigen map; voorheen Zuur, nl.patchkamer.zuur), bijgewerkt naar Patchkamer contract v1.11.
//   Het geluid is ongewijzigd; tunes en songs uit die tijd verwijzen naar de oude id en laden hier niet in.
//   - tweetalig (host.lang, apparaat- en poortnamen per taal in i18n)
//   - bewaker tegen een ontspoord filter: om de 50 ms wordt de ruwe filteruitvoer gecontroleerd; bij NaN, Infinity of een absurde waarde
//     worden de filters vervangen en gaat het geluid door
//   - de scope tekent via host.frame, met een ResizeObserver en een kleurcache; geen eigen tekenpoort meer
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
// Een acid-basssynth: zaagtand of puls plus sub, een vierpolig lowpass-filter met resonantie, filter-envelope met accent en slide,
// vervorming, compressor en begrenzer. Eigen 16-staps patroon met accent en slide en zes startpatronen; speelt ook noten van een
// extern keyboard of een externe sequencer.

const EN = {
  'Uit': 'Off', 'Aan': 'On',
  'Patroon': 'Pattern', 'Besturing': 'Control', 'Interne klok / patroon': 'Internal clock / pattern', 'Extern keyboard / sequencer': 'External keyboard / sequencer',
  'Golfvorm': 'Waveform', 'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Nootdeling': 'Note division', 'Patroonlengte': 'Pattern length',
  'Test noot': 'Test note', 'Alles uit': 'All off', 'rust': 'rest', 'Bewerk stap {0}': 'Edit step {0}', 'MIDI-noot': 'MIDI note',
  'Speelt': 'Plays', 'Slide naar deze stap': 'Slide to this step', 'Golfvorm van de uitgang': 'Output waveform',
  'Wacht op interne klok.': 'Waiting for the internal clock.', 'Interne klok · {0} BPM · stap {1}': 'Internal clock · {0} BPM · step {1}',
  'Resonantie': 'Resonance', 'Envelope-intensiteit': 'Envelope amount', 'Slide-tijd': 'Slide time', 'Transpositie': 'Transpose', 'Uitgang': 'Output', 'Klank': 'Sound',
};

const __pkDef = {
  id: 'nl.patchkamer.acidstepper', name: 'Acid Stepper', version: '1.13.0', kind: 'instrument', category: 'synth', ui: { width: 840, minWidth: 380 },
  about: { nl: 'Een acid-basssynthesizer met een eigen 16-staps patroon met accent en slide. Zaagtand of puls plus sub, een vierpolig lowpass-filter met resonantie, filter-envelope, vervorming, compressor en begrenzer. Zes startpatronen; het apparaat speelt ook noten van een extern keyboard of een externe sequencer.\n\nSlide, accent en een eigen patroon. De interne klok bepaalt tempo en swing. Slide verbindt vanaf de voorgaande actieve stap. In externe modus: legato:true of slide:true glijdt; accent:true accentueert. Het filter is een eigen vierpolige benadering.', en: 'An acid bass synthesizer with its own 16-step pattern with accent and slide. Sawtooth or pulse plus sub, a four-pole lowpass filter with resonance, filter envelope, distortion, compressor and limiter. Six starter patterns; the device also plays notes from an external keyboard or sequencer.\n\nSlide, accent and your own pattern. The internal clock sets tempo and swing. Slide connects from the previous active step. In external mode: legato:true or slide:true glides; accent:true accents. The filter is a custom four-pole approximation.' },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Externe noten' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'External notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let mountHost = null, panel = null;
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function mountUI(el) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:#91e0d4;--x-acc2:#e8c991;--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted,#adc3c9)}button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}button.active{background:color-mix(in srgb,var(--x-acc) 38%,var(--field,#223640));border-color:var(--x-acc)}button:disabled{opacity:.4;cursor:default}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pads button{min-height:64px;text-align:left;white-space:pre-line}canvas{display:block;width:100%;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px;touch-action:none}h3{font-size:13px;color:var(--x-ink2);margin:14px 0 8px}label{min-width:0}`);
      panel = add(shadow, 'div', undefined); panel.className = 'app'; return panel;
    }
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; }
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, label, bounds, value, change, format = v => Number(v).toFixed(2), start = value) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.dataset.pkDefault = String(start);
      input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; return input;
    }

    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    let dead = false, mod = {}, state, effective = {}, scope = null, stopDraw = null, ro = null, skinHandler = null;
    const nodes = new Set(), sources = new Set();
    const own = n => (nodes.add(n), n), gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const filter = (type, hz, q = 0.7) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = Math.min(ctx.sampleRate * 0.45, hz); n.Q.value = q; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    const start = (n, t = ctx.currentTime) => { sources.add(n); n.start(t); return n; };
    const stopSource = (n, t = ctx.currentTime) => { try { n.stop(t); } catch {} };
    function dispose() { for (const n of sources) stopSource(n); for (const n of nodes) try { n.disconnect(); } catch {} sources.clear(); nodes.clear(); }
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } effective = e; return e; }
    function descriptors() { return Object.entries(spec).map(([id, d]) => ({ id, name: tx(d.name), lane: d.lane || 'klank', laneName: tx(d.laneName || 'Klank'), min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); }
    function receiveMod(raw) { mod = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in spec) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1); apply(); }
    function numeric(raw, defaults) { const next = { ...defaults }; for (const [id, d] of Object.entries(spec)) next[id] = finite(raw?.[id], defaults[id], d.min, d.max); return next; }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    function controls(parent, ids = Object.keys(spec)) {
      for (const id of ids) {
        const d = spec[id], format = v => d.unit === '%' ? Math.round(v * 100) + '%' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
        if (d.scale === 'log') knob(parent, tx(d.name), [0, 1, 0.001], Math.log(state[id] / d.min) / Math.log(d.max / d.min), x => { state[id] = d.min * (d.max / d.min) ** x; apply(); }, x => format(d.min * (d.max / d.min) ** x), Math.log(defaults[id] / d.min) / Math.log(d.max / d.min));
        else knob(parent, tx(d.name), [d.min, d.max, d.step || 0.01], state[id], x => { state[id] = x; apply(); }, format, defaults[id]);
      }
    }
    // tekenen: breedte uit een ResizeObserver, kleuren uit een cache (ververst na een kleurwissel van de host)
    const SCOPE_H = 64; let scopeW = 600, scopeCtx = null, col = null;
    const pal = () => { if (col) return col; const cs = panel ? getComputedStyle(panel) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d; col = { well: v('--well', '#0b171d'), wellFg: v('--well-fg', '#c7dbe0') }; return col; };
    function sizeScope(w) { if (!scope) return; w = Math.max(260, Math.min(1200, Math.round(w))); const dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4), pw = Math.round(w * dpr), ph = Math.round(SCOPE_H * dpr); scopeW = w; if (scope.width !== pw || scope.height !== ph) { scope.width = pw; scope.height = ph; } if (scopeCtx) scopeCtx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function drawLoop(cb, fps) {
      if (host && typeof host.frame === 'function') return host.frame(self, cb, fps);
      let raf = 0, last = 0, stop = false;
      const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
      raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
    }
    function scopeMount(parent, node) {
      scope = add(parent, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang')); scope.style.height = SCOPE_H + 'px'; scopeCtx = scope.getContext('2d'); col = null;
      const data = new Float32Array(node.fftSize || 1024);
      sizeScope(scope.clientWidth || 600);
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) sizeScope(w); }); ro.observe(scope); }
      skinHandler = () => { col = null; }; if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('patchkamer-skin', skinHandler);
      stopDraw = drawLoop(() => {
        if (dead || !scope || !scopeCtx) return;
        const g = scopeCtx, w = scopeW, h = SCOPE_H; node.getFloatTimeDomainData(data); const P = pal();
        g.fillStyle = P.well; g.fillRect(0, 0, w, h); g.strokeStyle = P.wellFg; g.beginPath();
        for (let i = 0; i < data.length; i++) { const x = i / (data.length - 1) * w, y = h / 2 - clamp(data[i], -1, 1) * h * 0.46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }, 20);
    }
    function unmount() {
      if (stopDraw) { stopDraw(); stopDraw = null; } if (ro) { ro.disconnect(); ro = null; }
      if (skinHandler && typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('patchkamer-skin', skinHandler); skinHandler = null;
      scope = null; scopeCtx = null; col = null; clearUI();
    }
    function ceiling() { const sh = own(ctx.createWaveShaper()), c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); sh.curve = c; sh.oversample = '2x'; return sh; }
    function compressor() { const n = own(ctx.createDynamicsCompressor()); n.threshold.value = -10; n.ratio.value = 5; n.knee.value = 8; n.attack.value = 0.003; n.release.value = 0.18; return n; }
    function stepDuration(info) { return Number.isFinite(info?.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info?.bpm) && info.bpm > 0 ? 15 / info.bpm : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0; }

    const spec = { cutoff: { name: 'Cutoff', min: 70, max: 10000, scale: 'log', role: 'filter', unit: 'Hz' }, resonance: { name: 'Resonantie', min: 0.4, max: 9, role: 'res' }, env: { name: 'Envelope-intensiteit', min: 0, max: 5 }, decay: { name: 'Decay', min: 0.03, max: 2, scale: 'log', role: 'decay', unit: 's' }, accent: { name: 'Accent', min: 0, max: 1, unit: '%' }, glide: { name: 'Slide-tijd', min: 0.005, max: 0.4, scale: 'log', role: 'glide', unit: 's' }, gate: { name: 'Gate', min: 0.1, max: 1, role: 'env', unit: '%' }, drive: { name: 'Drive', min: 0, max: 1, unit: '%' }, sub: { name: 'Sub', min: 0, max: 1, role: 'sub', unit: '%' }, transpose: { name: 'Transpositie', min: -24, max: 24, role: 'pitch', step: 1, unit: 'st' }, level: { name: 'Uitgang', min: 0, max: 1, role: 'level', unit: '%' } };
    const initialNotes = [36, 36, 48, 39, 36, 43, 46, 36, 36, 48, 43, 39, 36, 34, 43, 46], initialOn = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0], initialAccent = [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0], initialSlide = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    const defaults = { cutoff: 800, resonance: 4.3, env: 3, decay: 0.22, accent: 0.65, glide: 0.065, gate: 0.6, drive: 0.45, sub: 0.12, transpose: 0, level: 0.7, wave: 'sawtooth', mode: 'sequence', division: 1, length: 16, selected: 0, pattern: 'Warehouse Acid', notes: initialNotes, steps: initialOn, accents: initialAccent, slides: initialSlide };
    const patterns = { 'Warehouse Acid': {}, 'Octave Engine': { notes: [36, 48, 36, 48, 36, 48, 39, 51, 36, 48, 36, 48, 43, 55, 34, 46], steps: Array(16).fill(1) }, 'Dark Rubber': { notes: [29, 29, 41, 32, 29, 36, 39, 29, 29, 41, 36, 32, 29, 27, 36, 39], cutoff: 400, resonance: 6, env: 4, drive: 0.6 }, 'Open Skyline': { notes: [48, 55, 60, 55, 51, 58, 63, 58, 46, 53, 58, 53, 43, 50, 55, 50], cutoff: 2200, resonance: 2, decay: 0.45, drive: 0.15 }, 'Sparse Pulse': { steps: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], cutoff: 450, env: 4.5, decay: 0.12 }, 'Broken Staircase': { notes: [36, 37, 48, 43, 42, 35, 47, 36, 39, 51, 38, 45, 34, 46, 41, 35], resonance: 7, drive: 0.8, env: 3.5 } };
    state = { ...defaults, notes: initialNotes.slice(), steps: initialOn.slice(), accents: initialAccent.slice(), slides: initialSlide.slice() }; resolve(); let playing = null, last = '', tickIndex = 0, gateEnd = 0, envelope = null, clockText = null, buttons = [], activeNote = 36;
    const osc = own(ctx.createOscillator()), subOsc = own(ctx.createOscillator()), subGain = gain(0.12), source = gain(0.18); let f1 = filter('lowpass', 800, 4.3), f2 = filter('lowpass', 800, 0.7); const amp = gain(0), pre = gain(2), sh = own(ctx.createWaveShaper()), volume = gain(0.7), comp = compressor(), out = ceiling(), analyser = own(ctx.createAnalyser()), mon = own(ctx.createAnalyser());
    osc.type = 'sawtooth'; subOsc.type = 'square'; osc.frequency.value = hz(36); subOsc.frequency.value = hz(24); osc.connect(source); subOsc.connect(subGain).connect(source);
    function wireFilters() { source.connect(f1); f1.connect(f2); f2.connect(amp); f2.connect(mon); }
    wireFilters(); amp.connect(pre).connect(sh).connect(volume).connect(comp).connect(out); out.connect(analyser); analyser.fftSize = 1024; mon.fftSize = 256;
    const curve = new Float32Array(4097); for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh((i / (curve.length - 1) * 2 - 1) * 3) / Math.tanh(3); sh.curve = curve; sh.oversample = '2x'; start(osc); start(subOsc);
    // bewaker: kijkt naar de ruwe filteruitvoer (vóór de vervormer, die een ontsporing verbergt). Een instabiel filter geeft Infinity en daarna NaN
    // en herstelt nooit meer; dan worden de filters vervangen. Alleen in een live context: een offline render loopt niet in wandkloktijd.
    const chk = new Float32Array(256);
    function rebuildFilters() {
      for (const f of [f1, f2]) { try { f.disconnect(); } catch {} nodes.delete(f); }
      try { source.disconnect(f1); } catch {}
      f1 = filter('lowpass', effective.cutoff, effective.resonance); f2 = filter('lowpass', effective.cutoff, 0.7); wireFilters();
    }
    function guard() { if (dead) return; mon.getFloatTimeDomainData(chk); for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) { rebuildFilters(); return; } }
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();
    function ampLevel(t) { if (!envelope || t < envelope.t) return 0; const e = envelope; if (t >= e.off) return e.offValue * Math.max(0, 1 - (t - e.off) / 0.04); return e.peak * Math.min(1, (t - e.t) / 0.003); }
    function close(t) { const value = ampLevel(t); amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(value, t); amp.gain.linearRampToValueAtTime(0, t + 0.04); if (envelope) { envelope.off = t; envelope.offValue = value; } gateEnd = t; }
    function filterEnvelope(t, accent = false) { const base = effective.cutoff, peak = Math.min(ctx.sampleRate * 0.45, base * 2 ** (effective.env * (accent ? 1 + effective.accent * 0.35 : 1))); for (const f of [f1, f2]) { f.frequency.cancelScheduledValues(t); f.frequency.setValueAtTime(peak, t); f.frequency.exponentialRampToValueAtTime(Math.min(ctx.sampleRate * 0.45, base), t + effective.decay); } smooth(f1.Q, effective.resonance, t); }
    function sound(note, vel, t, duration, slide = false, accent = false, tie = false) {
      activeNote = note; const freq = hz(note); for (const [o, r] of [[osc, 1], [subOsc, 0.5]]) { o.frequency.cancelScheduledValues(t); if (slide) smooth(o.frequency, freq * r, t, effective.glide / 3); else o.frequency.setValueAtTime(freq * r, t); } const connected = slide && gateEnd >= t - 0.001, peak = clamp(vel * (0.6 + (accent ? effective.accent * 0.4 : 0)), 0, 1);
      amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(connected ? ampLevel(t) : 0, t); amp.gain.linearRampToValueAtTime(peak, t + 0.003); const off = t + duration; envelope = { t, peak, off: Infinity, offValue: peak }; gateEnd = off; if (!tie) { amp.gain.setValueAtTime(peak, off); amp.gain.linearRampToValueAtTime(0, off + 0.04); envelope.off = off; } filterEnvelope(t, accent);
    }
    function apply() { const before = effective; resolve(); osc.type = state.wave; smooth(subGain.gain, effective.sub); smooth(pre.gain, 1 + effective.drive * 7); smooth(volume.gain, effective.level); smooth(f1.Q, effective.resonance); if (before.cutoff !== effective.cutoff) { for (const f of [f1, f2]) smooth(f.frequency, Math.min(ctx.sampleRate * 0.45, effective.cutoff)); } if (before.transpose !== effective.transpose) { smooth(osc.detune, effective.transpose * 100); smooth(subOsc.detune, effective.transpose * 100); } }
    function reset() { last = ''; tickIndex = 0; close(ctx.currentTime); }
    function selectPattern(name) { self.setState({ ...defaults, ...patterns[name], pattern: name }); }
    function render(el) {
      unmount(); mountUI(el); const top = row(panel); select(top, tx('Patroon'), Object.keys(patterns).map(k => [k, k]), state.pattern, selectPattern); select(top, tx('Besturing'), [['sequence', tx('Interne klok / patroon')], ['notes', tx('Extern keyboard / sequencer')]], state.mode, v => { reset(); state.mode = v; render(el); }); select(top, tx('Golfvorm'), [['sawtooth', tx('Zaagtand')], ['square', tx('Puls')]], state.wave, v => { state.wave = v; apply(); }); select(top, tx('Nootdeling'), [[1, '1/16'], [2, '1/8'], [4, '1/4']], state.division, v => { state.division = +v; tickIndex = 0; }); knob(top, tx('Patroonlengte'), [1, 16, 1], state.length, v => state.length = v, v => String(v), 16); button(top, tx('Test noot'), () => sound(36, 0.8, ctx.currentTime, 0.3)); button(top, tx('Alles uit'), () => close(ctx.currentTime));
      const steps = add(panel, 'div'); steps.className = 'pads'; buttons = state.notes.map((n, i) => { const b = button(steps, (i + 1) + ' · ' + (state.steps[i] ? 'MIDI ' + n : tx('rust')) + (state.accents[i] ? ' !' : '') + (state.slides[i] ? ' ↗' : ''), () => { state.selected = i; render(el); }); if (i === state.selected) b.classList.add('active'); return b; }); const edit = grid(panel), i = state.selected; add(panel, 'h3', tx('Bewerk stap {0}', i + 1)); knob(edit, tx('MIDI-noot'), [24, 84, 1], state.notes[i], v => { state.notes[i] = v; buttons[i].textContent = (i + 1) + ' · MIDI ' + v; }, v => String(v), defaults.notes[i]); for (const [key, label] of [['steps', 'Speelt'], ['accents', 'Accent'], ['slides', 'Slide naar deze stap']]) select(edit, tx(label), [[0, tx('Uit')], [1, tx('Aan')]], state[key][i], v => { state[key][i] = +v; render(el); }); scopeMount(panel, analyser); controls(grid(panel)); clockText = add(panel, 'p', tx('Wacht op interne klok.'));
    }
    const PRESET_SKIP = ['selected'];  // contract v1.6: werkstand, geen klank — een preset laat dit staan
    const self = { inputs: {}, outputs: { out }, mount: render, unmount() { clockText = null; buttons = []; unmount(); }, onStep(info) { try { if (dead || playing === false || state.mode !== 'sequence' || !Number.isFinite(info?.time) || !Number.isInteger(info.step)) return; const sd = stepDuration(info); if (!sd) return; const key = info.time + ':' + info.step; if (last === key) return; last = key; if (info.step % state.division) return; const i = tickIndex++ % state.length, t = info.time, d = sd * state.division; if (clockText) clockText.textContent = tx('Interne klok · {0} BPM · stap {1}', Math.round(15 / sd), i + 1); for (let j = 0; j < buttons.length; j++) buttons[j].style.borderColor = j === i ? 'var(--x-acc2)' : ''; if (!state.steps[i]) { close(t); return; } const next = (i + 1) % state.length, tie = !!state.steps[next] && !!state.slides[next]; sound(state.notes[i], 0.8, t, tie ? d + 0.003 : d * effective.gate, !!state.slides[i], !!state.accents[i], tie); } catch {} }, onTransport(e) { if (dead) return; playing = !!e?.playing; reset(); }, onEvent(port, e) { try { if (dead || port !== 'notes' || !Number.isFinite(e?.time)) return; const t = Math.max(ctx.currentTime, e.time), type = cleanType(e); if (type === 'panic' || type === 'allnotesoff') { close(t); return; } if (state.mode !== 'notes') return; if (type === 'noteoff' || e.vel === 0) { if (e.note === activeNote) close(t); } else if (['note', 'noteon'].includes(type) && Number.isFinite(e.note)) sound(Math.round(clamp(e.note, 0, 127)), finite(e.vel, 0.8, 0, 1), t, e.held ? 120 : finite(e.dur, 0.3, 0.005, 120), !!(e.legato || e.slide), e.accent === true || e.vel > 0.9, !!e.held); } catch {} }, params: descriptors, modulate: receiveMod, getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; }, setPreset(p) { if (dead) return; const keep = {}; for (const k of PRESET_SKIP) if (k in state) keep[k] = state[k]; self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); }, getState() { return { ...state, notes: state.notes.slice(), steps: state.steps.slice(), accents: state.accents.slice(), slides: state.slides.slice() }; }, setState(raw) { if (dead) return; reset(); const s = raw && typeof raw === 'object' ? raw : {}; state = numeric(s, defaults); state.wave = ['square', 'sawtooth'].includes(s.wave) ? s.wave : defaults.wave; state.mode = s.mode === 'notes' ? 'notes' : 'sequence'; state.division = [1, 2, 4].includes(s.division) ? s.division : 1; state.length = Math.round(finite(s.length, 16, 1, 16)); state.selected = Math.round(finite(s.selected, 0, 0, 15)); state.pattern = typeof s.pattern === 'string' && Object.hasOwn(patterns, s.pattern) ? s.pattern : defaults.pattern; for (const k of ['notes', 'steps', 'accents', 'slides']) state[k] = Array.from({ length: 16 }, (_, i) => Math.round(finite(Array.isArray(s[k]) ? s[k][i] : undefined, defaults[k][i], k === 'notes' ? 24 : 0, k === 'notes' ? 84 : 1))); apply(); if (mountHost) render(mountHost); }, destroy() { if (dead) return; dead = true; if (guardT) clearInterval(guardT); self.unmount(); dispose(); } }; apply(); return self;
  },
};
export default __pkDef;
