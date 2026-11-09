// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.22.0 — Uitleg naar about (menu Over Loop Slicer); de UI toont geen uitlegtekst meer.
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de omschrijving staat nu in het definitieveld about.
// 1.20.0 — loadAudio(files): de tab Samples van de host laadt een sample in deze loop (contract v1.20); verder gelijk aan 1.11.0.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Loop Slicer (nieuwe id nl.patchkamer.loopslicer, eigen map; voorheen Snede, nl.patchkamer.snede);
//   songs uit die tijd verwijzen naar de oude id en laden hier niet in. Het geluid is bit-identiek aan het oude bestand.
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Loop Slicer
//   - de UI draait in een open shadow root op de kleuren van de host (donker, licht, retro); schuiven: dubbelklik = beginwaarde
//   - nieuw veld demoLoop: de ingebouwde demo-loop wordt bij het laden gesynthetiseerd en hoeft niet meer als audio in de state
//   - getPreset/setPreset: een tune bewaart de slice-instellingen en het patroon, niet de geladen audio (die blijft staan)
//   - bankbestanden heten nu loop-slicer-bank (format patchkamer-loopslicer-1); het oude format patchkamer-snede-1 wordt nog gelezen
//   - setState volgt §13: onbekende velden worden genegeerd, ontbrekende of ongeldige waarden krijgen de standaard, getallen worden afgekapt;
//     een kapotte of te grote PCM-reeks geeft een melding in de kaart in plaats van een fout
//   - de uitvoerbegrenzer volgt host.audio.oversample; alle ingangen (noten, tempo, sturing) worden op eindigheid gecontroleerd
/** Loop Slicer 1.20.0. Standalone, no external files.
 * Loads a WAV or MP3 loop (or the built-in demo loop), cuts it into 4, 8, 16 or 32 slices and plays them from keys,
 * trigs or a 16-step pattern on the clock. The audio is saved as PCM16 with the setup (max. 120 s, 16 MiB PCM16, 50 MiB input, 32 voices).
 */
const EN = {
  'Uitgang': 'Output', 'Filter': 'Filter', 'Transpositie': 'Transpose', 'Slice-lengte': 'Slice length', 'Panorama': 'Pan',
  'Klank': 'Sound',
  'Demo-loop laden': 'Load demo loop', 'Speel slice': 'Play slice', 'Alles uit': 'All off', 'Aantal slices': 'Slice count', 'Gelijk verdelen': 'Divide evenly',
  'Zoek transiënten': 'Find transients', 'Loop laden': 'Load loop', 'Golfvorm: sleep een interne slicegrens': 'Waveform: drag an inner slice boundary',
  'Slice past in klokstap': 'Fit slice to clock step', 'Omgekeerd': 'Reverse', 'Patroon afspelen': 'Play pattern', 'Willekeurige slices': 'Random slices',
  'Uit': 'Off', 'Aan': 'On', 'Patroon-nootdeling': 'Pattern note length', 'Retrigger': 'Retrigger', 'Eerste slice MIDI': 'First slice MIDI',
  'Patroon · klik een stap, kies daarna een slice of rust': 'Pattern · click a step, then choose a slice or rest',
  'rust': 'rest', 'Rust': 'Rest', 'Slice {0}': 'Slice {0}', 'Slice op stap {0}': 'Slice on step {0}', '{0} · MIDI {1}': '{0} · MIDI {1}',
  'Bewaar loop + patroon': 'Save loop + pattern', 'Exporteer slice WAV': 'Export slice WAV', 'Loop Slicer-bank laden': 'Load Loop Slicer bank',
  'Geen loop geladen': 'No loop loaded', 'Audio laden…': 'Loading audio…', 'Demo loop · 120 BPM / 1 maat': 'Demo loop · 120 BPM / 1 bar',
  'Laad WAV / MP3 of kies Demo-loop': 'Load WAV / MP3 or choose Demo loop',
  'Maximaal 16 MiB PCM16. Kies een kortere loop.': 'Maximum 16 MiB PCM16. Choose a shorter loop.',
  'Ongeldige PCM-audio.': 'Invalid PCM audio.', 'Loop te lang: maximaal 120 seconden.': 'Loop too long: maximum 120 seconds.',
  'Maximaal 50 MiB per audiobestand.': 'Maximum 50 MiB per audio file.', 'Maximaal 120 seconden per loop.': 'Maximum 120 seconds per loop.',
  'Dit audiobestand kon niet worden gelezen.': 'This audio file could not be read.',
  'Bankbestand ontbreekt of is te groot.': 'Bank file is missing or too large.', 'Geen Loop Slicer-bank.': 'Not a Loop Slicer bank.',
  'Bankbestand kon niet worden gelezen.': 'The bank file could not be read.',
};
const CSS = `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px;--acc:var(--audio,#4fd1c5)}

p{line-height:1.5;color:var(--muted,#97a1ad);margin:8px 0}
.row{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#39424e);border-radius:7px;min-width:0}
.control span{font-size:11px;color:var(--muted,#97a1ad)}
button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:7px;max-width:100%}
button{cursor:pointer;touch-action:none}
button:hover{border-color:var(--acc)}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--acc)}
button.active{background:var(--acc);border-color:var(--acc);color:var(--card,#15181d)}
button.cur{border-color:var(--event,#f4a261);box-shadow:inset 0 0 0 1px var(--event,#f4a261)}
input[type=range]{width:100%;padding:0;accent-color:var(--acc)}
input[type=file]{width:100%}
output{font:12px var(--mono,monospace);color:var(--event,#f4a261)}
.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
.pads button{min-height:64px;text-align:left;white-space:pre-line}
canvas{display:block;width:100%;background:var(--well,#0c0f13);border:1px solid var(--line,#39424e);border-radius:6px;touch-action:none}
h3{font-size:13px;color:var(--muted,#97a1ad);margin:14px 0 8px}
`;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
const add = (parent, tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; parent.appendChild(el); return el; };
let skinEpoch = 0; try { window.addEventListener('patchkamer-skin', () => { skinEpoch++; }); } catch { }
const LIMIT = 16 * 1024 * 1024;
const DEMO_OLD_NAME = 'Eigen demo · 120 BPM / 1 maat', DEMO_NAME = 'Demo loop · 120 BPM / 1 bar', NONE_OLD_NAME = 'Geen loop geladen';

export default {
  id: 'nl.patchkamer.loopslicer', name: 'Loop Slicer', version: '1.22.0', about: { nl: 'WAV of MP3 laden, in slices knippen en de slices spelen met toetsen of als klokgestuurd patroon. \n\nSync gebruikt afspeelsnelheid: de toonhoogte verandert mee; geen onafhankelijke timestretch. Transpositie wijzigt ook de duur. WAV-export bevat de gekozen slice en omkering, zonder masterfilter, gain of temposync. Maximaal 120 s, 16 MiB PCM16 en 50 MiB invoer.', en: 'Load a WAV or MP3, cut it into slices and play the slices from keys or as a clock-driven pattern. The audio is saved with the setup.\n\nSync works through playback speed: the pitch changes with it; there is no independent time stretch. Transpose also changes the duration. The WAV export holds the chosen slice and its reversal, without master filter, gain or tempo sync. Maximum 120 s, 16 MiB PCM16 and 50 MiB input.' }, kind: 'instrument', category: 'groove',
  ui: { width: 900, minWidth: 380 },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo slices' }], eventIn: [{ id: 'notes', name: 'Slice notes / trigs' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo slices', notes: 'Slice-noten / trigs', mod: 'Mod' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let mountHost = null, panel = null, shadow = null;
    function mountUI(el) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', CSS); shadow.addEventListener('pointerdown', e => e.stopPropagation()); shadow.addEventListener('keydown', e => e.stopPropagation());
      panel = add(shadow, 'div', undefined, 'app'); 
      return panel;
    }
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; shadow = null; }
    const row = parent => add(parent, 'div', undefined, 'row');
    const grid = parent => add(parent, 'div', undefined, 'grid');
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) { const box = add(parent, 'label', undefined, 'control'); add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, label, bounds, value, def, change, format) {
      const box = add(parent, 'label', undefined, 'control'); add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.dataset.pkDefault = String(def);
      input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; return input;
    }
    function download(name, blob) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

    let dead = false, mod = {}, state, effective = {};
    const nodes = new Set(), sources = new Set();
    const own = n => (nodes.add(n), n), gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const filter = (type, hz, q = 0.7) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = Math.min(ctx.sampleRate * 0.45, hz); n.Q.value = q; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);
    const stopSource = (n, t = ctx.currentTime) => { try { n.stop(t); } catch { } };
    function dispose() { for (const n of sources) stopSource(n); for (const n of nodes) try { n.disconnect(); } catch { } sources.clear(); nodes.clear(); }
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } effective = e; return e; }
    function descriptors() { return Object.entries(spec).map(([id, d]) => ({ id, name: d.name, lane: 'slicer', laneName: 'Loop Slicer', min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); }
    function receiveMod(raw) { mod = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in spec) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1); apply(); }
    function numeric(raw, defaults) { const next = { ...defaults }; for (const [id, d] of Object.entries(spec)) next[id] = finite(raw?.[id], defaults[id], d.min, d.max); return next; }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    const fmtOf = d => v => d.unit === '%' ? Math.round(v * 100) + '%' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
    function controls(parent) {
      for (const [id, d] of Object.entries(spec)) {
        const format = fmtOf(d);
        if (d.scale === 'log') { const pos = v => Math.log(v / d.min) / Math.log(d.max / d.min); knob(parent, d.name, [0, 1, 0.001], pos(state[id]), pos(defaults[id]), x => { state[id] = d.min * (d.max / d.min) ** x; apply(); }, x => format(d.min * (d.max / d.min) ** x)); }
        else knob(parent, d.name, [d.min, d.max, d.step || 0.01], state[id], defaults[id], x => { state[id] = x; apply(); }, format);
      }
    }
    const cvs = { cw: 0, h: 0, ro: null };
    function canvasSize(cv, height) {
      const dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4);
      if (!cvs.ro) { cvs.cw = cv.clientWidth || 600; try { cvs.ro = new ResizeObserver(() => { const w = cv.clientWidth; if (w && w !== cvs.cw) { cvs.cw = w; drawWave(); } }); cvs.ro.observe(cv); } catch { } }
      const w = Math.max(260, Math.min(1200, cvs.cw || 600));
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(height * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(height * dpr); }
      if (cvs.h !== height) { cv.style.height = height + 'px'; cvs.h = height; }
      const g = cv.getContext('2d'); if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h: height };
    }
    let pal = null;   // CSS-kleuren hooguit één keer per seconde (en direct na een wissel van kleurenschema)
    function palette() {
      const now = performance.now(); if (pal && pal.ep === skinEpoch && now - pal.t < 1000) return pal;
      const q = (n, d) => { try { return getComputedStyle(wave).getPropertyValue(n).trim() || d; } catch { return d; } };
      return pal = { ep: skinEpoch, t: now, well: q('--well', '#0c0f13'), fg: q('--well-fg', '#b9c3d0'), audio: q('--audio', '#4fd1c5'), ev: q('--event', '#f4a261') };
    }
    function unmount() { if (cvs.ro) { try { cvs.ro.disconnect(); } catch { } } cvs.ro = null; cvs.cw = 0; cvs.h = 0; try { window.removeEventListener('patchkamer-skin', onSkin); } catch { } clearUI(); }
    const onSkin = () => { skinEpoch++; drawWave(); };
    function ceiling() { const sh = own(ctx.createWaveShaper()), c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); sh.curve = c; const o = host.audio && host.audio.oversample; sh.oversample = o === 'none' || o === '4x' ? o : '2x'; return sh; }
    function compressor() { const n = own(ctx.createDynamicsCompressor()); n.threshold.value = -10; n.ratio.value = 5; n.knee.value = 8; n.attack.value = 0.003; n.release.value = 0.18; return n; }
    function stepDuration(info) { return Number.isFinite(info?.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info?.bpm) && info.bpm > 0 ? 15 / info.bpm : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0; }

    const spec = {
      level: { name: tx('Uitgang'), min: 0, max: 1, role: 'level', unit: '%' },
      cutoff: { name: tx('Filter'), min: 100, max: 18000, scale: 'log', role: 'filter', unit: 'Hz' },
      tune: { name: tx('Transpositie'), min: -24, max: 24, role: 'pitch', unit: 'st', step: 1 },
      gate: { name: tx('Slice-lengte'), min: 0.1, max: 1, role: 'env', unit: '%' },
      pan: { name: tx('Panorama'), min: -1, max: 1, role: 'pan' }
    };
    const defaults = { level: 0.8, cutoff: 16000, tune: 0, gate: 0.95, pan: 0, name: '', pcm: '', sampleRate: 44100, channels: 1, demoLoop: false, cuts: '0,0.0625,0.125,0.1875,0.25,0.3125,0.375,0.4375,0.5,0.5625,0.625,0.6875,0.75,0.8125,0.875,0.9375,1', selected: 0, editStep: 0, baseNote: 36, sync: true, reverse: false, sequence: false, division: 1, retrigger: 1, random: false, seed: 9137, pattern: Array.from({ length: 16 }, (_, i) => i) };
    const FLAGS = ['sync', 'reverse', 'sequence', 'random'];
    const PRESET_SKIP = ['pcm', 'sampleRate', 'channels', 'name', 'selected', 'editStep'];   // geladen audio en lopende keuzes horen niet in een tune
    state = { ...defaults, pattern: defaults.pattern.slice() }; resolve();
    let buffer = null, reversed = null, cutPoints = defaults.cuts.split(',').map(Number), wave = null, status = null, playing = null, last = '', counter = 0, gen = 9137, tempoStep = 0.125, token = 0, peaks = null, buttons = [], message = '';
    const voices = new Set(), f = filter('lowpass', 16000), volume = gain(0.8), panner = own(ctx.createStereoPanner()), comp = compressor(), out = ceiling(); f.connect(volume).connect(panner).connect(comp).connect(out);
    const shownName = () => state.name || tx('Geen loop geladen');
    function tell(s) { message = s; if (status) status.textContent = s; }
    function apply() { resolve(); smooth(volume.gain, effective.level); smooth(f.frequency, Math.min(ctx.sampleRate * 0.45, effective.cutoff)); smooth(panner.pan, effective.pan); }
    function encode(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 16384) s += String.fromCharCode(...bytes.subarray(i, i + 16384)); return btoa(s); }
    function decode(s) { const text = atob(s), a = new Uint8Array(text.length); for (let i = 0; i < a.length; i++) a[i] = text.charCodeAt(i); return a; }
    function pcm(audio) { const channels = Math.min(2, audio.numberOfChannels), bytes = new Uint8Array(audio.length * channels * 2); if (bytes.length > LIMIT) throw Error(tx('Maximaal 16 MiB PCM16. Kies een kortere loop.')); const view = new DataView(bytes.buffer); for (let ch = 0; ch < channels; ch++) { const a = audio.getChannelData(ch); for (let i = 0; i < audio.length; i++) { const v = clamp(Number.isFinite(a[i]) ? a[i] : 0, -1, 1); view.setInt16((i * channels + ch) * 2, Math.round(v * (v < 0 ? 32768 : 32767)), true); } } return { pcm: encode(bytes), channels, sampleRate: audio.sampleRate || ctx.sampleRate }; }
    // De ingebouwde demo-loop: 2 s, 120 BPM, kick + hat + snare, gesynthetiseerd en op PCM16 afgerond zoals een geladen bestand.
    function demoBytes() {
      const rate = ctx.sampleRate, frames = rate * 2, bytes = new Uint8Array(frames * 2), view = new DataView(bytes.buffer); let seed = 1783;
      for (let i = 0; i < frames; i++) {
        const t = i / rate, beat = t % 0.5, hat = t % 0.25, snare = (t + 0.5) % 1;
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0; const noise = (seed >>> 0) / 2147483648 - 1;
        const kick = Math.sin(2 * Math.PI * (48 * beat + 14 * (1 - Math.exp(-beat * 38)))) * Math.exp(-beat * 20), h = noise * Math.exp(-hat * 110) * 0.16, s = noise * Math.exp(-snare * 35) * 0.28;
        const v = Math.fround(clamp(kick * 0.7 + h + s, -1, 1)); view.setInt16(i * 2, Math.round(v * (v < 0 ? 32768 : 32767)), true);
      }
      return { bytes, rate };
    }
    function rebuild() {
      buffer = null; reversed = null; peaks = null; let bytes, rate, channels;
      if (state.pcm) { bytes = decode(state.pcm); rate = state.sampleRate; channels = state.channels; if (!bytes.length || bytes.length > LIMIT || bytes.length % (channels * 2)) throw Error(tx('Ongeldige PCM-audio.')); }
      else if (state.demoLoop) { const d = demoBytes(); bytes = d.bytes; rate = d.rate; channels = 1; }
      else return;
      const frames = bytes.length / (channels * 2); if (frames / rate > 120) throw Error(tx('Loop te lang: maximaal 120 seconden.'));
      const view = new DataView(bytes.buffer); buffer = ctx.createBuffer(channels, frames, rate); reversed = ctx.createBuffer(channels, frames, rate);
      for (let ch = 0; ch < channels; ch++) { const a = buffer.getChannelData(ch), b = reversed.getChannelData(ch); for (let i = 0; i < frames; i++) { const v = view.getInt16((i * channels + ch) * 2, true) / 32768; a[i] = v; b[frames - 1 - i] = v; } }
      peaks = new Float32Array(512); const a = buffer.getChannelData(0);
      for (let j = 0; j < 512; j++) { let v = 0, lo = Math.floor(j * frames / 512), hi = Math.floor((j + 1) * frames / 512); for (let i = lo; i < hi; i += Math.max(1, Math.floor((hi - lo) / 32))) v = Math.max(v, Math.abs(a[i])); peaks[j] = v; }
    }
    function cuts(raw) { const a = String(raw || '').split(',').map(Number); if (a.length < 3 || a.length > 33 || a.some(x => !Number.isFinite(x)) || a[0] !== 0 || a.at(-1) !== 1 || a.some((x, i) => i > 0 && x - a[i - 1] < 0.00001)) return defaults.cuts.split(',').map(Number); return a; }
    function equal(count) { cutPoints = Array.from({ length: count + 1 }, (_, i) => i / count); state.cuts = cutPoints.join(','); state.selected = Math.min(state.selected, count - 1); state.pattern = state.pattern.map(x => x < 0 ? -1 : x % count); }
    function detect() {
      if (!buffer) return; const a = buffer.getChannelData(0), hop = Math.max(64, Math.round(buffer.sampleRate * 0.008)), scores = []; let previous = 0;
      for (let i = 0; i < a.length; i += hop) { let energy = 0; for (let j = i; j < Math.min(i + hop, a.length); j++) energy += a[j] * a[j]; energy = Math.sqrt(energy / hop); scores.push({ x: i / a.length, score: Math.max(0, energy - previous) }); previous = energy; }
      const target = cutPoints.length - 1, chosen = [0, 1], gap = Math.min(0.02, 0.4 / target); scores.sort((a, b) => b.score - a.score);
      for (const c of scores) { if (chosen.length >= target + 1) break; if (c.score > 0.002 && chosen.every(x => Math.abs(x - c.x) >= gap)) chosen.push(c.x); }
      for (let i = 1; i < target && chosen.length < target + 1; i++) if (chosen.every(x => Math.abs(x - i / target) > 0.00001)) chosen.push(i / target);
      cutPoints = chosen.sort((a, b) => a - b); state.cuts = cutPoints.join(','); state.selected = Math.min(state.selected, cutPoints.length - 2);
    }
    async function load(file) {
      const id = ++token;
      try {
        if (!file) return; if (file.size > 50 * 1024 * 1024) throw Error(tx('Maximaal 50 MiB per audiobestand.'));
        tell(tx('Audio laden…')); let audio; try { audio = await ctx.decodeAudioData(await file.arrayBuffer()); } catch { throw Error(tx('Dit audiobestand kon niet worden gelezen.')); }
        if (dead || id !== token) return; if (audio.length / (audio.sampleRate || ctx.sampleRate) > 120) throw Error(tx('Maximaal 120 seconden per loop.'));
        const data = pcm(audio); panic(); Object.assign(state, data, { name: String(file.name || 'Loop').slice(0, 100), demoLoop: false }); equal(16); rebuild(); message = ''; if (mountHost) render(mountHost);
      } catch (e) { tell(e.message); }
    }
    function demo() { panic(); Object.assign(state, { pcm: '', sampleRate: defaults.sampleRate, channels: 1, demoLoop: true, name: DEMO_NAME }); equal(16); message = ''; try { rebuild(); } catch (e) { message = e.message; } if (mountHost) render(mountHost); }
    function cleanup(v) { if (!voices.delete(v)) return; for (const n of [v.source, v.gain]) { try { n.disconnect(); } catch { } nodes.delete(n); sources.delete(n); } }
    function stop(v, t) { if (v.end <= t) return; v.end = t + 0.012; if (v.gain.gain.cancelAndHoldAtTime) v.gain.gain.cancelAndHoldAtTime(t); else v.gain.gain.cancelScheduledValues(t); v.gain.gain.setTargetAtTime(0, t, 0.003); stopSource(v.source, t + 0.015); }
    function panic(t = ctx.currentTime) { for (const v of voices) stop(v, t); }
    function play(index, t = ctx.currentTime, vel = 1, span = (stepDuration({}) || tempoStep) * state.division) {
      if (dead || !buffer || !Number.isFinite(t) || !Number.isFinite(span) || !(span > 0) || index < 0 || index >= cutPoints.length - 1) return;
      for (const v of [...voices]) if (v.end < ctx.currentTime - 0.05) cleanup(v);
      if (voices.size >= 32) return;
      const lo = cutPoints[index], hi = cutPoints[index + 1], seconds = (hi - lo) * buffer.length / buffer.sampleRate, rate = clamp((state.sync ? seconds / span : 1) * 2 ** (effective.tune / 12), 0.01, 128), natural = seconds / rate, duration = natural * effective.gate;
      if (!Number.isFinite(rate) || !Number.isFinite(duration) || !(duration > 0)) return;
      const source = own(ctx.createBufferSource()), g = gain(0); source.buffer = state.reverse ? reversed : buffer; source.playbackRate.value = rate; source.connect(g).connect(f);
      const fade = Math.min(0.004, duration / 3), v0 = clamp(vel, 0, 1) * 0.8; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v0, t + fade); g.gain.setValueAtTime(v0, t + Math.max(fade, duration - fade)); g.gain.linearRampToValueAtTime(0, t + duration);
      const v = { source, gain: g, end: t + duration }; voices.add(v); source.onended = () => cleanup(v); sources.add(source);
      source.start(t, (state.reverse ? 1 - hi : lo) * buffer.length / buffer.sampleRate, seconds); stopSource(source, t + duration + 0.001);
    }
    function drawWave() {
      if (!wave || !mountHost) return; const { g, w, h } = canvasSize(wave, 120); if (!g) return;
      const { well, fg, audio, ev } = palette();
      g.fillStyle = well; g.fillRect(0, 0, w, h);
      if (!peaks) { g.fillStyle = fg; g.font = '13px system-ui'; g.fillText(tx('Laad WAV / MP3 of kies Demo-loop'), 12, 62); return; }
      g.globalAlpha = 0.28; g.fillStyle = audio; g.fillRect(cutPoints[state.selected] * w, 0, (cutPoints[state.selected + 1] - cutPoints[state.selected]) * w, h); g.globalAlpha = 1;
      g.strokeStyle = audio; g.beginPath(); for (let i = 0; i < peaks.length; i++) { const x = i / (peaks.length - 1) * w, v = peaks[i] * h * 0.43; g.moveTo(x, h / 2 - v); g.lineTo(x, h / 2 + v); } g.stroke();
      g.strokeStyle = ev; for (const x of cutPoints) { g.beginPath(); g.moveTo(x * w, 0); g.lineTo(x * w, h); g.stroke(); }
    }
    function exportSlice() {
      if (!buffer) return; const i = state.selected, lo = Math.floor(cutPoints[i] * buffer.length), hi = Math.floor(cutPoints[i + 1] * buffer.length), frames = hi - lo, ch = buffer.numberOfChannels, rate = buffer.sampleRate;
      const bytes = new ArrayBuffer(44 + frames * ch * 2), v = new DataView(bytes), str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      str(0, 'RIFF'); v.setUint32(4, bytes.byteLength - 8, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, rate, true); v.setUint32(28, rate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, frames * ch * 2, true);
      for (let c = 0; c < ch; c++) { const a = buffer.getChannelData(c); for (let j = 0; j < frames; j++) v.setInt16(44 + (j * ch + c) * 2, Math.round(clamp(a[state.reverse ? hi - 1 - j : lo + j], -1, 1) * 32767), true); }
      download('loop-slicer-' + (i + 1) + '.wav', new Blob([bytes], { type: 'audio/wav' }));
    }
    async function importBank(file) {
      const id = ++token;
      try {
        if (!file || file.size > 24 * 1024 * 1024) throw Error(tx('Bankbestand ontbreekt of is te groot.'));
        let b; try { b = JSON.parse(await file.text()); } catch { throw Error(tx('Bankbestand kon niet worden gelezen.')); }
        if (dead || id !== token) return; if (!b || (b.format !== 'patchkamer-loopslicer-1' && b.format !== 'patchkamer-snede-1')) throw Error(tx('Geen Loop Slicer-bank.')); self.setState(b.state);
      } catch (e) { tell(e.message); }
    }
    function render(el) {
      unmount(); mountUI(el); try { window.addEventListener('patchkamer-skin', onSkin); } catch { }
      const top = row(panel); button(top, tx('Demo-loop laden'), demo); button(top, tx('Speel slice'), () => play(state.selected)); button(top, tx('Alles uit'), () => panic());
      select(top, tx('Aantal slices'), [[4, '4'], [8, '8'], [16, '16'], [32, '32']], cutPoints.length - 1, v => { equal(+v); render(el); });
      button(top, tx('Gelijk verdelen'), () => { equal(cutPoints.length - 1); render(el); }); button(top, tx('Zoek transiënten'), () => { detect(); render(el); });
      const file = add(panel, 'input'); file.type = 'file'; file.accept = '.wav,.mp3,audio/wav,audio/mpeg'; file.setAttribute('aria-label', tx('Loop laden')); file.onchange = () => load(file.files[0]);
      wave = add(panel, 'canvas'); wave.setAttribute('aria-label', tx('Golfvorm: sleep een interne slicegrens')); wave.ondragover = e => e.preventDefault(); wave.ondrop = e => { e.preventDefault(); load(e.dataTransfer.files[0]); };
      let drag = -1;
      wave.onpointerdown = e => { const r = wave.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width, 0, 1); drag = cutPoints.map((v, i) => ({ i, d: Math.abs(v - x) })).filter(v => v.i > 0 && v.i < cutPoints.length - 1).sort((a, b) => a.d - b.d)[0]?.i ?? -1; wave.setPointerCapture?.(e.pointerId); };
      wave.onpointermove = e => { if (drag < 0) return; const r = wave.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width, cutPoints[drag - 1] + 0.00001, cutPoints[drag + 1] - 0.00001); cutPoints[drag] = x; state.cuts = cutPoints.join(','); drawWave(); };
      wave.onpointerup = wave.onpointercancel = () => drag = -1;
      const pads = add(panel, 'div', undefined, 'pads');
      for (let i = 0; i < cutPoints.length - 1; i++) { const b = button(pads, tx('{0} · MIDI {1}', i + 1, state.baseNote + i), () => { state.selected = i; play(i); render(el); }); if (i === state.selected) b.classList.add('active'); }
      const settings = grid(panel);
      for (const [id, label] of [['sync', 'Slice past in klokstap'], ['reverse', 'Omgekeerd'], ['sequence', 'Patroon afspelen'], ['random', 'Willekeurige slices']]) select(settings, tx(label), [[0, tx('Uit')], [1, tx('Aan')]], +state[id], v => state[id] = v === '1');
      select(settings, tx('Patroon-nootdeling'), [[1, '1/16'], [2, '1/8'], [4, '1/4']], state.division, v => state.division = +v);
      select(settings, tx('Retrigger'), [[1, '1×'], [2, '2×'], [4, '4×']], state.retrigger, v => state.retrigger = +v);
      knob(settings, tx('Eerste slice MIDI'), [0, 95, 1], state.baseNote, defaults.baseNote, v => state.baseNote = v, v => String(v)); controls(settings);
      add(panel, 'h3', tx('Patroon · klik een stap, kies daarna een slice of rust'));
      const steps = add(panel, 'div', undefined, 'pads'); buttons = state.pattern.map((n, i) => button(steps, (i + 1) + ' · ' + (n < 0 ? tx('rust') : n + 1), () => { state.editStep = i; render(el); }));
      select(row(panel), tx('Slice op stap {0}', state.editStep + 1), [[-1, tx('Rust')], ...Array.from({ length: cutPoints.length - 1 }, (_, i) => [i, tx('Slice {0}', i + 1)])], state.pattern[state.editStep], v => { state.pattern[state.editStep] = +v; render(el); });
      const bank = row(panel); button(bank, tx('Bewaar loop + patroon'), () => download('loop-slicer-bank.json', new Blob([JSON.stringify({ format: 'patchkamer-loopslicer-1', state: self.getState() })], { type: 'application/json' }))); button(bank, tx('Exporteer slice WAV'), exportSlice);
      const bankFile = add(bank, 'input'); bankFile.type = 'file'; bankFile.accept = '.json'; bankFile.setAttribute('aria-label', tx('Loop Slicer-bank laden')); bankFile.onchange = () => importBank(bankFile.files[0]);
      status = add(panel, 'p', message || shownName());
      drawWave();
    }
    // Zet een (ongeldige) state om in een geldige. keepAudio: het geladen geluid blijft, alleen de slice-instellingen komen uit raw (setPreset).
    function applyRaw(raw, keepAudio) {
      const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}, next = numeric(s, defaults);
      cutPoints = cuts(s.cuts ?? defaults.cuts); next.cuts = cutPoints.join(',');
      if (keepAudio) { next.name = state.name; next.sampleRate = state.sampleRate; next.channels = state.channels; next.pcm = state.pcm; next.demoLoop = state.demoLoop; }
      else {
        next.name = typeof s.name === 'string' && s.name !== NONE_OLD_NAME ? (s.name === DEMO_OLD_NAME ? DEMO_NAME : s.name.slice(0, 100)) : defaults.name;
        next.sampleRate = Math.round(finite(s.sampleRate, 44100, 8000, 96000)); next.channels = Math.round(finite(s.channels, 1, 1, 2));
        next.pcm = typeof s.pcm === 'string' && s.pcm.length % 4 === 0 && s.pcm.length <= Math.ceil(LIMIT * 4 / 3) + 4 && /^[A-Za-z0-9+/]*={0,2}$/.test(s.pcm) ? s.pcm : '';
        next.demoLoop = !next.pcm && s.demoLoop === true; if (next.demoLoop && !next.name) next.name = DEMO_NAME;
      }
      next.selected = Math.round(finite(s.selected, keepAudio ? state.selected : 0, 0, cutPoints.length - 2)); next.editStep = Math.round(finite(s.editStep, keepAudio ? state.editStep : 0, 0, 15));
      next.baseNote = Math.round(finite(s.baseNote, 36, 0, 95)); next.division = [1, 2, 4].includes(s.division) ? s.division : 1; next.retrigger = [1, 2, 4].includes(s.retrigger) ? s.retrigger : 1;
      for (const key of FLAGS) next[key] = typeof s[key] === 'boolean' ? s[key] : defaults[key];
      next.seed = Math.round(finite(s.seed, 9137, 0, 4294967295)); next.pattern = Array.from({ length: 16 }, (_, i) => Math.round(finite(s.pattern?.[i], i % (cutPoints.length - 1), -1, cutPoints.length - 2)));
      return next;
    }
    function adopt(next, rebuilt) {
      panic(); token++; state = next; message = '';
      if (rebuilt) { try { rebuild(); } catch (e) { state.pcm = ''; state.demoLoop = false; buffer = null; reversed = null; peaks = null; message = e.message; } }
      last = ''; counter = 0; gen = state.seed; apply(); if (mountHost) render(mountHost);
    }
    const self = {
      inputs: {}, outputs: { out }, mount: render,
      unmount() { wave = null; status = null; buttons = []; unmount(); },
      onEvent(port, e) {
        try {
          if (dead || port !== 'notes' || !Number.isFinite(e?.time)) return; const t = Math.max(ctx.currentTime, e.time), type = cleanType(e);
          if (type === 'panic' || type === 'allnotesoff') panic(t);
          else if (['note', 'noteon'].includes(type) && e.vel !== 0 && Number.isFinite(e.note)) play(Math.round(e.note) - state.baseNote, t, finite(e.vel, 0.8, 0, 1));
          else if (type === 'trig') { const m = String(e.lane).match(/^(?:slice)?(\d+)$/); if (m) play(+m[1] - 1, t, finite(e.vel, 1, 0, 1)); }
        } catch { }
      },
      onTransport(e) { playing = !!e?.playing; last = ''; counter = 0; gen = state.seed; if (!playing) panic(); },
      onStep(info) {
        try {
          if (dead || playing === false || !Number.isFinite(info?.time) || !Number.isInteger(info.step)) return; const sd = stepDuration(info); if (!sd) return; tempoStep = sd; if (!state.sequence) return;
          const key = info.time + ':' + info.step; if (key === last) return; last = key; if (info.step % state.division) return;
          const j = counter++ % 16; for (let i = 0; i < buttons.length; i++) buttons[i].classList.toggle('cur', i === j);
          let index = state.pattern[j]; if (index < 0) return;
          if (state.random) { gen = (Math.imul(gen, 1664525) + 1013904223) >>> 0; index = Math.floor(gen / 4294967296 * (cutPoints.length - 1)); }
          const span = sd * state.division / state.retrigger; for (let r = 0; r < state.retrigger; r++) play(index, info.time + r * span, 0.9, span);
        } catch { }
      },
      params: descriptors, modulate: receiveMod,
      async loadAudio(files) { const f = Array.from(files || [])[0]; if (f) await load(f); },   // v1.20: een sample uit de bibliotheek, zoals Bestand kiezen
      getState() { return { ...state, pattern: state.pattern.slice() }; },
      setState(raw) { if (dead) return; adopt(applyRaw(raw, false), true); },
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
        if (s.demoLoop === true) { adopt(applyRaw({ ...s, pcm: '', name: DEMO_NAME }, false), true); return; }   // de ingebouwde loop vervangt de geladen audio
        adopt(applyRaw(s, true), false);
      },
      destroy() { if (dead) return; dead = true; token++; self.unmount(); dispose(); voices.clear(); buffer = null; reversed = null; }
    };
    apply(); return self;
  }
};
