// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang, TXT-tabel nl/en; poortnaam Door/Through per taal in i18n). Tekenen via host.frame
//          (30×/s, alleen als de kaart te zien is) met een ResizeObserver en een kleurcache: de tekenpoort-omzetting is weg en er wordt per frame
//          geen maat of kleur meer opgevraagd. Geluid, doorvoer en state-velden ongewijzigd.
//          Een burst van NaN, ±Infinity of enorme waarden op de ingang vergiftigt de meting niet meer (niet-eindige samples tellen als 0 in de analyse).
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop. Tekenpoort.
// 1.1.0 — Alle meetinstellingen volgen state/presets.
// Scope: transparante audio-doorvoer met een live analyse (spectrum, golfvorm L/R, spectrogram, stereobeeld, peak/RMS). De instellingen
// zitten in de state; pauze niet.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const MODE_IDS = ['spectrum', 'waveform', 'spectrogram', 'stereo', 'meters'];
const FFTS = [1024, 2048, 4096, 8192], SMOOTHS = [0, 0.4, 0.7, 0.9], FLOORS = [-60, -90, -120], WINDOWS = [5, 10, 25, 50];
const defaults = () => ({ mode: 'spectrum', fft: 2048, smoothing: 0.7, floor: -90, windowMs: 25 });

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { modes: { spectrum: 'Spectrum', waveform: 'Golfvorm L/R', spectrogram: 'Spectrogram', stereo: 'Stereobeeld', meters: 'Peak / RMS' },
    view: 'Beeld', fft: 'FFT', smooth: 'Glad', off: 'uit', light: 'licht', normal: 'normaal', strong: 'sterk', range: 'Bereik', time: 'Tijd',
    pause: 'Pauze', resume: 'Verder', aria: 'Live audio-analyse', newTime: 'nieuw ↑ · tijd ↓', corr: 'correlatie ', metersKey: 'RMS = balk · sample-peak = streep · dBFS' },
  en: { modes: { spectrum: 'Spectrum', waveform: 'Waveform L/R', spectrogram: 'Spectrogram', stereo: 'Stereo image', meters: 'Peak / RMS' },
    view: 'View', fft: 'FFT', smooth: 'Smooth', off: 'off', light: 'light', normal: 'normal', strong: 'strong', range: 'Range', time: 'Time',
    pause: 'Pause', resume: 'Resume', aria: 'Live audio analysis', newTime: 'new ↑ · time ↓', corr: 'correlation ', metersKey: 'RMS = bar · sample peak = line · dBFS' },
};
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id: 'nl.patchkamer.scope', name: 'Scope', version: '1.11.0', kind: 'utility', category: 'tool',
  ui: { width: 580, minWidth: 260 },
  i18n: { en: { ports: { in: 'In', out: 'Through' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Door' }], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    // Dezelfde node aan in/uit: geen extra gain, downmix of vertraging in het audiosignaal.
    const through = ctx.createGain(); through.gain.value = 1;
    const tap = ctx.createGain(); tap.channelCount = 2; tap.channelCountMode = 'explicit'; tap.channelInterpretation = 'speakers';
    const split = ctx.createChannelSplitter(2), left = ctx.createAnalyser(), right = ctx.createAnalyser(), spectrum = ctx.createAnalyser();
    through.connect(tap); tap.connect(split); tap.connect(spectrum); split.connect(left, 0); split.connect(right, 1);
    const nodes = [through, tap, split, left, right, spectrum];
    let state = defaults(), dead = false, root, mountEl, oldRows, plot, canvas, pen, readout, observer, stopDraw = null;
    let controls = {}, paused = false, w = 0, h = 0, ratio = 1, clearHistory = true;
    let a, b, freq, history, historyPen, palette = null, paletteT = 0;
    const db = v => v > 0 ? 20 * Math.log10(v) : -Infinity;
    const dbText = v => Number.isFinite(v) ? v.toFixed(1) : '−∞';
    function paintPause() { if (controls.pause) { controls.pause.textContent = paused ? T.resume : T.pause; controls.pause.setAttribute('aria-pressed', String(paused)); } }
    function apply() {
      [left, right, spectrum].forEach(n => { n.fftSize = state.fft; n.smoothingTimeConstant = state.smoothing; });
      spectrum.minDecibels = state.floor; spectrum.maxDecibels = 0;
      a = new Float32Array(state.fft); b = new Float32Array(state.fft); freq = new Float32Array(state.fft / 2);
      clearHistory = true;
      for (const k of Object.keys(controls)) if (k !== 'pause') controls[k].value = String(state[k]);
      paintPause();
    }
    apply();
    // maat: alleen bij mount en vanuit de ResizeObserver, niet per frame
    function size() {
      if (!plot || !pen) return;
      // Layoutmaten, geen getBoundingClientRect: host-zoom mag niet dubbel meetellen.
      const nw = Math.floor(plot.clientWidth), nh = Math.floor(plot.clientHeight);
      const nr = clamp(globalThis.devicePixelRatio || 1, 1, 2);
      if (nw < 1 || nh < 1) { w = h = 0; return; }
      if (nw === w && nh === h && nr === ratio) return;
      let frozen;
      if (paused && w && h) { frozen = document.createElement('canvas'); frozen.width = canvas.width; frozen.height = canvas.height; frozen.getContext('2d').drawImage(canvas, 0, 0); }
      w = nw; h = nh; ratio = nr;
      canvas.width = Math.max(1, Math.round(w * ratio)); canvas.height = Math.max(1, Math.round(h * ratio));
      pen.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (frozen) pen.drawImage(frozen, 0, 0, w, h);
      history.width = Math.max(1, Math.round(w)); history.height = Math.max(1, Math.round(h)); clearHistory = true;
    }
    // kleuren: hooguit één keer per seconde opgevraagd, of opnieuw na een wisseling van kleurstelling (patchkamer-skin)
    function colors() {
      const css = getComputedStyle(root), val = k => css.getPropertyValue(k).trim();
      return { bg: val('--well') || val('--card') || 'Canvas', fg: val('--fg') || 'CanvasText', muted: val('--muted') || 'GrayText', line: val('--line') || 'GrayText', audio: val('--audio') || 'Highlight', second: val('--event') || 'CanvasText' };
    }
    const onSkin = () => { palette = null; };
    function line(x1, y1, x2, y2, color, alpha = 1) {
      pen.globalAlpha = alpha; pen.strokeStyle = color; pen.beginPath(); pen.moveTo(x1, y1); pen.lineTo(x2, y2); pen.stroke(); pen.globalAlpha = 1;
    }
    function text(t, x, y, color = palette.muted, align = 'left') { pen.fillStyle = color; pen.textAlign = align; pen.fillText(t, x, y); }
    function frame() {
      pen.fillStyle = palette.bg; pen.fillRect(0, 0, w, h); pen.font = '10px monospace'; pen.lineWidth = 1;
    }
    function frequencyGrid() {
      const max = ctx.sampleRate / 2, xOf = f => 34 + Math.log(f / 20) / Math.log(max / 20) * Math.max(1, w - 42);
      [100, 1000, 10000].filter(f => f < max).forEach(f => { const x = xOf(f); line(x, 8, x, h - 20, palette.line, 0.5); text(f < 1000 ? f + ' Hz' : f / 1000 + 'k', x, h - 5, palette.muted, 'center'); });
      return xOf;
    }
    function binAt(x, n) {
      const f = 20 * Math.pow(ctx.sampleRate / 40, x / Math.max(1, n - 1));
      return clamp(Math.round(f * state.fft / ctx.sampleRate), 0, freq.length - 1);
    }
    function drawSpectrum() {
      frequencyGrid();
      const height = Math.max(1, h - 30), width = Math.max(1, w - 42);
      [0, -30, -60].filter(d => d >= state.floor).forEach(d => { const y = 8 + d / state.floor * height; line(34, y, w - 8, y, palette.line, 0.5); text(String(d), 2, y + 9); });
      pen.beginPath();
      for (let x = 0; x <= width; x++) {
        const lo = binAt(x, width), hi = binAt(x + 1, width); let value = state.floor;
        for (let i = lo; i <= hi; i++) if (Number.isFinite(freq[i])) value = Math.max(value, freq[i]);
        const y = 8 + (1 - clamp((value - state.floor) / -state.floor, 0, 1)) * height;
        if (x === 0) pen.moveTo(34 + x, y); else pen.lineTo(34 + x, y);
      }
      pen.strokeStyle = palette.audio; pen.stroke(); text('dB', w - 8, 12, palette.muted, 'right');
    }
    function drawWave() {
      const count = Math.min(a.length / 2, Math.max(16, Math.round(state.windowMs * ctx.sampleRate / 1000)));
      let start = 0;
      for (let i = 1; i < a.length - count; i++) if (a[i - 1] <= 0 && a[i] > 0) { start = i; break; }
      [a, b].forEach((samples, channel) => {
        const cy = h * (channel ? 0.73 : 0.27), amp = h * 0.21;
        line(0, cy, w, cy, palette.line); text(channel ? 'R' : 'L', 5, cy - 4);
        pen.beginPath();
        for (let x = 0; x < w; x++) { const v = samples[start + Math.floor(x / w * count)] || 0, y = cy - clamp(v, -1.2, 1.2) * amp; if (!x) pen.moveTo(x, y); else pen.lineTo(x, y); }
        pen.strokeStyle = channel ? palette.second : palette.audio; pen.stroke();
      });
      text((count / ctx.sampleRate * 1000).toFixed(1) + ' ms', w - 6, h - 6, palette.muted, 'right');
    }
    function drawSpectrogram() {
      if (clearHistory) { historyPen.fillStyle = palette.bg; historyPen.fillRect(0, 0, w, h); clearHistory = false; }
      // Tijd loopt van boven naar beneden; iedere nieuwe rij is één meetframe (~33 ms).
      if (h > 1) historyPen.drawImage(history, 0, 0, w, h - 1, 0, 1, w, h - 1);
      historyPen.fillStyle = palette.bg; historyPen.fillRect(0, 0, w, 1);
      for (let x = 0; x < w; x += 2) {
        const value = freq[binAt(x, w)], strength = Number.isFinite(value) ? clamp((value - state.floor) / -state.floor, 0, 1) : 0;
        historyPen.globalAlpha = strength; historyPen.fillStyle = palette.audio; historyPen.fillRect(x, 0, 2, 1);
      }
      historyPen.globalAlpha = 1; pen.drawImage(history, 0, 0, w, h); frequencyGrid();
      text(T.newTime, w - 6, 14, palette.fg, 'right');
    }
    function drawStereo(correlation) {
      const cx = w / 2, cy = h / 2, radius = Math.max(1, Math.min(w - 40, h - 40) / 2);
      line(cx - radius, cy, cx + radius, cy, palette.line); line(cx, cy - radius, cx, cy + radius, palette.line);
      pen.beginPath(); pen.arc(cx, cy, radius, 0, 2 * Math.PI); pen.strokeStyle = palette.line; pen.stroke();
      pen.fillStyle = palette.audio; pen.globalAlpha = 0.65;
      for (let i = 0; i < a.length; i += 4) { const mid = (a[i] + b[i]) / 2, side = (a[i] - b[i]) / 2; pen.fillRect(cx + clamp(side, -1, 1) * radius, cy - clamp(mid, -1, 1) * radius, 1.5, 1.5); }
      pen.globalAlpha = 1; text('M', cx + 4, 12); text('S', w - 12, cy - 4);
      text(T.corr + (correlation === null ? '—' : correlation.toFixed(2)), 6, h - 6);
    }
    function drawMeters(levels) {
      const top = 24, bottom = h - 25, width = Math.max(1, w - 95), height = Math.max(1, bottom - top);
      [0, -12, -24, -48, state.floor].forEach(d => { const x = 55 + (1 - d / state.floor) * width; line(x, top, x, bottom, palette.line, 0.5); text(String(d), x, h - 8, palette.muted, 'center'); });
      levels.forEach((v, c) => {
        const y = top + c * height / 2 + height * 0.08, bh = height * 0.22;
        text(c ? 'R' : 'L', 6, y + 12);
        pen.fillStyle = palette.audio; pen.globalAlpha = 0.55; pen.fillRect(55, y, clamp((db(v.rms) - state.floor) / -state.floor, 0, 1) * width, bh); pen.globalAlpha = 1;
        const peakX = 55 + clamp((db(v.peak) - state.floor) / -state.floor, 0, 1) * width;
        line(peakX, y, peakX, y + bh, v.peak >= 1 ? palette.second : palette.fg);
      });
      text(T.metersKey, 6, 12);
    }
    // wordt door host.frame (30×/s, alleen zichtbaar) aangeroepen
    function draw() {
      if (dead || !canvas || !w || !h || paused) return;
      const now = performance.now(); if (!palette || now - paletteT > 1000) { palette = colors(); paletteT = now; }
      frame();
      left.getFloatTimeDomainData(a); right.getFloatTimeDomainData(b);
      // NaN of ±Infinity op de ingang (alleen de weergave; de doorvoer blijft ongewijzigd) mag de meting niet vergiftigen
      for (let i = 0; i < a.length; i++) { if (!Number.isFinite(a[i])) a[i] = 0; if (!Number.isFinite(b[i])) b[i] = 0; }
      let cross = 0, aa = 0, bb = 0;
      const levels = [a, b].map(samples => { let peak = 0, sum = 0; for (const value of samples) { peak = Math.max(peak, Math.abs(value)); sum += value * value; } return { peak, rms: Math.sqrt(sum / samples.length) }; });
      for (let i = 0; i < a.length; i++) { aa += a[i] * a[i]; bb += b[i] * b[i]; cross += a[i] * b[i]; }
      const correlation = aa * bb > 1e-16 ? clamp(cross / Math.sqrt(aa * bb), -1, 1) : null;
      if (state.mode === 'spectrum' || state.mode === 'spectrogram') spectrum.getFloatFrequencyData(freq);
      if (state.mode === 'spectrum') drawSpectrum();
      if (state.mode === 'waveform') drawWave();
      if (state.mode === 'spectrogram') drawSpectrogram();
      if (state.mode === 'stereo') drawStereo(correlation);
      if (state.mode === 'meters') drawMeters(levels);
      readout.textContent = levels.map((v, i) => `${i ? 'R' : 'L'} peak ${dbText(db(v.peak))} · RMS ${dbText(db(v.rms))} dBFS${v.peak >= 1 ? ' · CLIP' : ''}`).join('   |   ');
    }
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    function unmount() {
      stopLoop();
      if (observer) observer.disconnect(); observer = null;
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
      if (mountEl) mountEl.style.gridTemplateRows = oldRows;
      if (root) root.remove();
      root = mountEl = plot = canvas = pen = history = historyPen = readout = null; controls = {}; paused = false; w = h = 0; palette = null;
    }
    const self = {
      inputs: { in: through }, outputs: { out: through },
      mount(el) {
        if (dead) return; unmount(); mountEl = el; oldRows = el.style.gridTemplateRows;
        el.style.gridTemplateRows = 'minmax(0, 1fr)';
        root = document.createElement('div');
        Object.assign(root.style, { display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', gap: '6px', height: '100%', minHeight: '0', minWidth: '0', color: 'var(--fg)', font: '11px var(--mono, monospace)' });
        const toolbar = document.createElement('div'); Object.assign(toolbar.style, { display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' });
        function select(key, label, options) {
          const wrap = document.createElement('label'); wrap.textContent = label + ' '; const input = document.createElement('select');
          input.setAttribute('aria-label', label);
          options.forEach(([value, title]) => { const o = document.createElement('option'); o.value = String(value); o.textContent = title; input.appendChild(o); });
          Object.assign(input.style, { maxWidth: '100%', color: 'var(--fg)', background: 'var(--well)', border: '1px solid var(--line)', borderRadius: '4px', font: 'inherit' });
          input.onchange = () => { state[key] = key === 'mode' ? input.value : Number(input.value); apply(); };
          input.addEventListener('pointerdown', e => e.stopPropagation()); wrap.appendChild(input); toolbar.appendChild(wrap); controls[key] = input;
        }
        select('mode', T.view, MODE_IDS.map(id => [id, T.modes[id]])); select('fft', T.fft, FFTS.map(v => [v, String(v)]));
        select('smoothing', T.smooth, [[0, T.off], [0.4, T.light], [0.7, T.normal], [0.9, T.strong]]);
        select('floor', T.range, FLOORS.map(v => [v, -v + ' dB']));
        select('windowMs', T.time, WINDOWS.map(v => [v, v + ' ms']));
        const pause = document.createElement('button'); pause.type = 'button'; controls.pause = pause;
        pause.onclick = () => { paused = !paused; paintPause(); };
        pause.addEventListener('pointerdown', e => e.stopPropagation()); toolbar.appendChild(pause);
        plot = document.createElement('div');
        // Grootte-insluiting geeft een natuurlijke hoogte zonder canvas/ResizeObserver-lus.
        // Zodra de host een hoogte zet, krijgt dit gridvak de overgebleven ruimte, ook bij krimpen.
        Object.assign(plot.style, { position: 'relative', minWidth: '0', minHeight: '0', overflow: 'hidden', contain: 'size', containIntrinsicSize: '560px 180px', background: 'var(--well)', borderRadius: '4px' });
        canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', T.aria);
        Object.assign(canvas.style, { position: 'absolute', inset: '0', display: 'block', width: '100%', height: '100%' }); plot.appendChild(canvas); pen = canvas.getContext('2d');
        history = document.createElement('canvas'); historyPen = history.getContext('2d');
        readout = document.createElement('div'); Object.assign(readout.style, { minWidth: '0', overflowWrap: 'anywhere', color: 'var(--muted)' });
        root.append(toolbar, plot, readout); el.appendChild(root); apply();
        observer = new ResizeObserver(size); observer.observe(plot); size();
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        draw(); stopDraw = tekenLus(host, self, draw, 30);
      },
      unmount,
      getState() { return { ...state }; },
      // §13: onbekende velden weg, ongeldig of ontbrekend = standaard; alle keuzes zijn vaste waarden, dus afkappen is niet nodig
      setState(s) {
        s = s && typeof s === 'object' ? s : {}; const d = defaults();
        state = { mode: MODE_IDS.includes(s.mode) ? s.mode : d.mode,
          fft: FFTS.includes(s.fft) ? s.fft : d.fft,
          smoothing: SMOOTHS.includes(s.smoothing) ? s.smoothing : d.smoothing,
          floor: FLOORS.includes(s.floor) ? s.floor : d.floor,
          windowMs: WINDOWS.includes(s.windowMs) ? s.windowMs : d.windowMs };
        apply();
      },
      destroy() { if (dead) return; dead = true; unmount(); nodes.forEach(n => n.disconnect()); }
    };
    return self;
  }
};
