// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — De hulptekst noemt geen apparaat meer bij naam dat niet bestaat (Samplebank) maar spreekt van een sampler. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Vocoder en nieuwe id nl.patchkamer.vocoder (voorheen Stem, nl.patchkamer.stem); presets en songs uit die tijd verwijzen naar de oude id. Tweetalig (host.lang, apparaat- en poortnamen per taal in i18n).
//          Kleuren uit de CSS-variabelen van de host. De golfvorm tekent via host.frame met een ResizeObserver en een kleurcache (de tekenpoort-omzetting is weg); schuiven hebben data-pk-default.
//          setState negeert onbekende velden en kapt getallen af op hun bereik. Bewaker tegen een ontspoord filter: één NaN of Infinity op de ingang (vooral op de externe draaggolf) liet de synthesefilters voor altijd NaN geven; nu worden ze binnen ~50 ms vervangen. De klank is ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop. Tekenpoort.
// Vocoder: 16-bands vocoder. Een stem (of ander signaal) opent 16 banden op een draaggolf: de ingebouwde synth (zaagtand, puls of driehoek, bespeeld met noten),
// ruis, of een externe synth op de tweede audio-ingang. Zonder signaal op de stem-ingang blijft de vocoder stil.
// Alles loopt via native Web Audio-nodes (bandfilters, gelijkrichter, envelope-volgers), zonder worklet.

const EN = {
  'Stemgevoeligheid': 'Voice sensitivity', 'Envelope-reactie': 'Envelope response', 'Formantverschuiving': 'Formant shift', 'Helderheid': 'Brightness',
  'Lucht / ruis': 'Air / noise', 'Interne draaggolf': 'Internal carrier', 'Externe draaggolf': 'External carrier', 'Droge stem': 'Dry voice', 'Vocoder': 'Vocoder',
  'Synth-uitklank': 'Synth release', 'Uitgang': 'Output', 'Klank': 'Tone',
  'VOCODER · 16-bands vocoder': 'VOCODER · 16-band vocoder',
  'Stem / spraaksample → Stem / spraak. Keyboard → Noten draaggolf. Uitgang → mixer.': 'Voice / speech sample → Voice / speech. Keyboard → Carrier notes. Output → mixer.',
  'Klankbeeld': 'Preset', 'Interne golfvorm': 'Internal waveform', 'Zaagtand': 'Sawtooth', 'Puls': 'Pulse', 'Driehoek': 'Triangle',
  'Draagakkoord aan': 'Carrier chord on', 'Draagakkoord uit': 'Carrier chord off',
  'Golfvorm van de uitgang': 'Output waveform',
  'Zonder stemsignaal blijft de vocoder stil: de stem opent de 16 banden. Gebruik een microfoonmodule of een sampler als stembron; deze module vraagt zelf geen microfoontoegang. Een tweede audio-ingang accepteert een externe synth als draaggolf. Zet daarvoor Externe draaggolf open. Droge stem mengt het oorspronkelijke signaal bij.':
    'Without a voice signal the vocoder stays silent: the voice opens the 16 bands. Use a microphone module or a sampler as the voice source; this module does not ask for microphone access itself. The second audio input accepts an external synth as the carrier: turn External carrier up for that. Dry voice mixes in the original signal.'
};

export default {
  id: 'nl.patchkamer.vocoder', name: 'Vocoder', version: '1.11.1', kind: 'effect', category: 'effect', ui: { width: 840, minWidth: 380 },
  i18n: { nl: { ports: { voice: 'Stem / spraak', carrier: 'Externe draaggolf', out: 'Vocoder', notes: 'Noten draaggolf' } } },
  ports: { audioIn: [{ id: 'voice', name: 'Voice / speech' }, { id: 'carrier', name: 'External carrier' }], audioOut: [{ id: 'out', name: 'Vocoder' }], eventIn: [{ id: 'notes', name: 'Carrier notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.split('{' + i + '}').join(v); }); return t; };
    const tekenLus = (inst, cb, fps) => {
      if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
      let raf = 0, last = 0, stop = false;
      const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
      raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
    };
    let mountHost = null, panel = null;
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function mountUI(el, title, subtitle) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif}.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}h2{margin:0 0 5px;font-size:20px;letter-spacing:1px;color:var(--audio,#91e0d4)}p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted,#adc3c9)}button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--sel,#8de4d3)}input[type=range]{width:100%;padding:0;accent-color:var(--audio,#8ee4d3)}output{font:12px var(--mono,monospace);color:var(--fg,#f0d6a7)}canvas{display:block;width:100%;height:64px;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px;touch-action:none}label{min-width:0}`);
      panel = add(shadow, 'div', undefined); panel.className = 'app'; add(panel, 'h2', title); if (subtitle) add(panel, 'p', subtitle); return panel;
    }
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; }
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, label, bounds, value, dflt, change, format) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.dataset.pkDefault = String(dflt);
      input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; return input;
    }

    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    let dead = false, mod = {}, state, effective = {}, scope = null, sg = null, stopDraw = null, ro = null, cw = 600, col = null, colT = 0;
    const nodes = new Set(), sources = new Set();
    const own = n => (nodes.add(n), n), gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const filter = (type, hz, q = 0.7) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = Math.min(ctx.sampleRate * 0.45, hz); n.Q.value = q; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.025) => p.setTargetAtTime(v, t, tc);
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    const start = (n, t = ctx.currentTime) => { sources.add(n); n.start(t); return n; };
    const stopSource = (n, t = ctx.currentTime) => { try { n.stop(t); } catch { } };
    function dispose() { for (const n of sources) stopSource(n); for (const n of nodes) try { n.disconnect(); } catch { } sources.clear(); nodes.clear(); }
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } effective = e; return e; }
    function descriptors() { return Object.entries(spec).map(([id, d]) => ({ id, name: tx(d.name), lane: 'klank', laneName: tx('Klank'), min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); }
    function receiveMod(raw) { mod = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in spec) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1); apply(); }
    function numeric(raw, defaults) { const next = { ...defaults }; for (const [id, d] of Object.entries(spec)) next[id] = finite(raw?.[id], defaults[id], d.min, d.max); return next; }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    function controls(parent) {
      for (const id of Object.keys(spec)) {
        const d = spec[id], format = v => d.unit === '%' ? Math.round(v * 100) + '%' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)) + (d.unit ? ' ' + d.unit : '');
        if (d.scale === 'log') knob(parent, tx(d.name), [0, 1, 0.0001], Math.log(state[id] / d.min) / Math.log(d.max / d.min), Math.log(defaults[id] / d.min) / Math.log(d.max / d.min), x => { state[id] = d.min * (d.max / d.min) ** x; apply(); }, x => format(d.min * (d.max / d.min) ** x));
        else knob(parent, tx(d.name), [d.min, d.max, d.step || 0.01], state[id], defaults[id], x => { state[id] = x; apply(); }, format);
      }
    }
    function readColors() {
      if (!scope) return; const cs = getComputedStyle(scope), v = (n, d) => cs.getPropertyValue(n).trim() || d; colT = performance.now();
      col = { bg: v('--well', '#0b171d'), au: v('--audio', '#91e0d4') };
    }
    const onSkin = () => { col = null; };
    function drawScope() {
      if (dead || !scope || !sg) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const w = Math.max(260, Math.min(1200, cw)), h = 64, dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 4);
      if (scope.width !== Math.round(w * dpr) || scope.height !== Math.round(h * dpr)) { scope.width = Math.round(w * dpr); scope.height = Math.round(h * dpr); }
      sg.setTransform(dpr, 0, 0, dpr, 0, 0); analyser.getFloatTimeDomainData(scopeData);
      sg.fillStyle = col.bg; sg.fillRect(0, 0, w, h); sg.strokeStyle = col.au; sg.beginPath();
      for (let i = 0; i < scopeData.length; i++) { const x = i / (scopeData.length - 1) * w, y = h / 2 - clamp(scopeData[i], -1, 1) * h * 0.46; i ? sg.lineTo(x, y) : sg.moveTo(x, y); }
      sg.stroke();
    }
    function stopLoop() { if (stopDraw) { stopDraw(); stopDraw = null; } }
    function unmount() {
      stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('patchkamer-skin', onSkin);
      scope = null; sg = null; col = null; clearUI();
    }
    function ceiling() { const sh = own(ctx.createWaveShaper()), c = new Float32Array(2049); for (let i = 0; i < c.length; i++) c[i] = 0.92 * Math.tanh((i / (c.length - 1) * 2 - 1) / 0.92); sh.curve = c; sh.oversample = '2x'; return sh; }
    function compressor() { const n = own(ctx.createDynamicsCompressor()); n.threshold.value = -10; n.ratio.value = 5; n.knee.value = 8; n.attack.value = 0.003; n.release.value = 0.18; return n; }

    const spec = { sensitivity: { name: 'Stemgevoeligheid', min: 0.5, max: 24, scale: 'log' }, response: { name: 'Envelope-reactie', min: 5, max: 80, scale: 'log', role: 'env', unit: 'Hz' }, formant: { name: 'Formantverschuiving', min: -12, max: 12, role: 'pitch', unit: 'st' }, brightness: { name: 'Helderheid', min: 0, max: 1, unit: '%' }, noise: { name: 'Lucht / ruis', min: 0, max: 1, unit: '%' }, carrier: { name: 'Interne draaggolf', min: 0, max: 1, role: 'level', unit: '%' }, external: { name: 'Externe draaggolf', min: 0, max: 1, role: 'level', unit: '%' }, dry: { name: 'Droge stem', min: 0, max: 1, role: 'level', unit: '%' }, wet: { name: 'Vocoder', min: 0, max: 1, unit: '%' }, release: { name: 'Synth-uitklank', min: 0.02, max: 3, scale: 'log', role: 'decay', unit: 's' }, level: { name: 'Uitgang', min: 0, max: 1, role: 'level', unit: '%' } };
    const defaults = { sensitivity: 8, response: 25, formant: 0, brightness: 0.6, noise: 0.12, carrier: 0.8, external: 0, dry: 0.12, wet: 0.85, release: 0.2, level: 0.75, wave: 'sawtooth', preset: 'Warm Robot' };
    const presets = { 'Warm Robot': {}, 'Whisper Choir': { sensitivity: 14, response: 12, noise: 0.65, brightness: 0.8, dry: 0.08 }, 'Hard Machine': { sensitivity: 10, response: 60, formant: -4, noise: 0.03, dry: 0, brightness: 0.9 }, 'Ghost Choir': { sensitivity: 12, response: 8, formant: 5, release: 1.5, brightness: 0.35 }, 'Subtle Voice': { sensitivity: 5, response: 30, wet: 0.45, dry: 0.65 }, 'External Synth': { carrier: 0, external: 1, dry: 0.1, noise: 0.02 } };
    state = { ...defaults }; resolve();
    const input = gain(1), external = gain(0), externalInput = gain(1), internal = gain(0.8), carrierBus = gain(1), dry = gain(0.12), wet = gain(0.85), volume = gain(0.75);
    let comp = compressor();
    const out = ceiling(), analyser = own(ctx.createAnalyser()), voiceBus = gain(1), noiseGain = gain(0.01);
    const voices = new Set(), bands = [];
    input.connect(dry).connect(volume); voiceBus.connect(internal).connect(carrierBus); externalInput.connect(external).connect(carrierBus); wet.connect(volume); volume.connect(comp).connect(out);
    out.connect(analyser); analyser.fftSize = 1024;
    const scopeData = new Float32Array(analyser.fftSize);
    const abs = new Float32Array(2049); for (let i = 0; i < abs.length; i++) abs[i] = Math.abs(i / (abs.length - 1) * 2 - 1);
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = nb.getChannelData(0); let seed = 8921; for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; data[i] = (seed >>> 0) / 2147483648 - 1; }
    const ns = own(ctx.createBufferSource()); ns.buffer = nb; ns.loop = true; ns.connect(noiseGain).connect(carrierBus); start(ns);
    // Native envelope followers: full-wave rectification followed by a
    // two-pole low-pass drives each synthesis band's zero-based VCA.
    function buildBands() {
      for (const b of bands.splice(0)) {
        try { input.disconnect(b.analysis); } catch { } try { carrierBus.disconnect(b.synthesis); } catch { }
        for (const n of b.all) { try { n.disconnect(); } catch { } nodes.delete(n); }
      }
      for (let i = 0; i < 16; i++) {
        const center = 110 * (7000 / 110) ** (i / 15), analysis = filter('bandpass', center, 4.5), rect = own(ctx.createWaveShaper()), follow = filter('lowpass', 25, 0.5), sens = gain(8), synthesis = filter('bandpass', center, 4.5), vca = gain(0), trim = gain(1);
        rect.curve = abs;
        input.connect(analysis).connect(rect).connect(follow).connect(sens).connect(vca.gain); carrierBus.connect(synthesis).connect(vca).connect(trim).connect(wet);
        bands.push({ center, analysis, follow, sens, synthesis, trim, all: [analysis, rect, follow, sens, synthesis, vca, trim] });
      }
    }
    buildBands();
    function apply() {
      resolve(); smooth(internal.gain, effective.carrier); smooth(external.gain, effective.external); smooth(noiseGain.gain, effective.noise * 0.12); smooth(dry.gain, effective.dry); smooth(wet.gain, effective.wet * 3); smooth(volume.gain, effective.level);
      for (const b of bands) { smooth(b.sens.gain, effective.sensitivity); smooth(b.follow.frequency, effective.response); smooth(b.synthesis.frequency, Math.min(ctx.sampleRate * 0.45, b.center * 2 ** (effective.formant / 12))); smooth(b.trim.gain, (0.35 + effective.brightness * b.center / 7000) * 1.7); }
      for (const v of voices) v.osc.type = state.wave;
    }
    // Bewaker: een biquad-filter met NaN in zijn geheugen herstelt nooit meer. De uitgang is begrensd (<1), dus alles dat niet eindig is of boven 2 uitkomt, is een ontsporing:
    // dan worden de bandfilters en de compressor vervangen. Niet in een offline context: daar loopt de klok niet mee met de render.
    function guard() {
      if (dead) return; analyser.getFloatTimeDomainData(scopeData);
      for (let i = 0; i < scopeData.length; i++) if (!(Math.abs(scopeData[i]) < 2)) {
        buildBands(); volume.disconnect(comp); comp.disconnect(); nodes.delete(comp); comp = compressor(); volume.connect(comp).connect(out); apply(); return;
      }
    }
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();
    function cleanup(v) { if (!voices.delete(v)) return; for (const n of [v.osc, v.gain]) { try { n.disconnect(); } catch { } sources.delete(n); nodes.delete(n); } }
    function off(v, t) { if (v.end <= t) return; v.end = t + effective.release; if (v.gain.gain.cancelAndHoldAtTime) v.gain.gain.cancelAndHoldAtTime(t); else v.gain.gain.cancelScheduledValues(t); v.gain.gain.setTargetAtTime(0, t, Math.max(0.005, effective.release / 5)); stopSource(v.osc, v.end + 0.02); }
    function note(n, vel, t, dur) { if ([...voices].filter(v => v.end > t + 0.01).length >= 12) { const oldest = [...voices].find(v => v.end > t + 0.01); off(oldest, t); } if (voices.size >= 20) { const oldest = [...voices].sort((a, b) => a.end - b.end)[0]; stopSource(oldest.osc); cleanup(oldest); } const osc = own(ctx.createOscillator()), g = gain(0); osc.type = state.wave; osc.frequency.setValueAtTime(hz(n), t); osc.connect(g).connect(voiceBus); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.15, t + 0.01); const v = { osc, gain: g, n, end: Infinity }; voices.add(v); osc.onended = () => cleanup(v); start(osc, t); if (Number.isFinite(dur)) off(v, t + dur); }
    function panic(t = ctx.currentTime) { for (const v of voices) off(v, t); }
    function render(el) {
      unmount(); mountUI(el, tx('VOCODER · 16-bands vocoder'), tx('Stem / spraaksample → Stem / spraak. Keyboard → Noten draaggolf. Uitgang → mixer.'));
      const top = row(panel);
      select(top, tx('Klankbeeld'), Object.keys(presets).map(k => [k, k]), state.preset, v => self.setState({ ...defaults, ...presets[v], preset: v }));
      select(top, tx('Interne golfvorm'), [['sawtooth', tx('Zaagtand')], ['square', tx('Puls')], ['triangle', tx('Driehoek')]], state.wave, v => { state.wave = v; apply(); });
      button(top, tx('Draagakkoord aan'), () => { panic(); for (const n of [48, 55, 60, 63]) note(n, 0.8, ctx.currentTime); });
      button(top, tx('Draagakkoord uit'), () => panic());
      scope = add(panel, 'canvas'); scope.setAttribute('aria-label', tx('Golfvorm van de uitgang')); sg = scope.getContext('2d'); cw = scope.clientWidth || 600; col = null;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) cw = w; }); ro.observe(scope); }
      if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('patchkamer-skin', onSkin);
      controls(grid(panel));
      add(panel, 'p', tx('Zonder stemsignaal blijft de vocoder stil: de stem opent de 16 banden. Gebruik een microfoonmodule of een sampler als stembron; deze module vraagt zelf geen microfoontoegang. Een tweede audio-ingang accepteert een externe synth als draaggolf. Zet daarvoor Externe draaggolf open. Droge stem mengt het oorspronkelijke signaal bij.'));
      stopDraw = tekenLus(self, drawScope, 20);
    }
    const self = {
      inputs: { voice: input, carrier: externalInput }, outputs: { out }, mount: render, unmount,
      onEvent(port, e) { try { if (dead || port !== 'notes' || !Number.isFinite(e?.time)) return; const t = Math.max(ctx.currentTime, e.time), type = cleanType(e); if (type === 'panic' || type === 'allnotesoff') panic(t); else if (type === 'noteoff' || e.vel === 0) { for (const v of voices) if (v.n === e.note) off(v, t); } else if (['note', 'noteon'].includes(type) && Number.isFinite(e.note)) note(Math.round(clamp(e.note, 0, 127)), finite(e.vel, 0.8, 0, 1), t, e.held || type === 'noteon' && !Number.isFinite(e.dur) ? undefined : Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 1); } catch { } },
      onTransport(e) { if (!e?.playing) panic(); },
      params: descriptors, modulate: receiveMod,
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; panic(); const s = raw && typeof raw === 'object' ? raw : {};
        state = numeric(s, defaults); state.wave = ['sawtooth', 'square', 'triangle'].includes(s.wave) ? s.wave : defaults.wave; state.preset = Object.hasOwn(presets, s.preset) ? s.preset : defaults.preset;
        apply(); if (mountHost) render(mountHost);
      },
      destroy() { if (dead) return; dead = true; if (guardT) clearInterval(guardT); unmount(); dispose(); voices.clear(); }
    };
    apply(); return self;
  }
};
