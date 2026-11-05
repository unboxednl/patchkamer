// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.12.2 — Dempen is nu een knop en staat standaard uit (de ingang klinkt meteen); 1.12.1 — bredere kaart. 1.12.0 — Eerste versie. Audio Input haalt geluid van een ingang van de computer in de studio: de standaardingang van de geluidskaart of een
//          audio-interface die het besturingssysteem als ingang aanbiedt (USB-interfaces, ingebouwde lijn-/microfooningang). De lijst met ingangen
//          komt van de browser (namen zoals het systeem ze geeft; er staan geen vaste namen in dit bestand). Kies de ingang, het kanaal of kanaalpaar
//          (bij interfaces met meer dan twee ingangen), mono of stereo, een versterking van -24 tot +36 dB, een hoogdoorlaat tegen dreun, en polariteit.
//          Uit de doos staat de browserbewerking (echo-onderdrukking, ruisonderdrukking, automatisch niveau) uit, zodat het signaal ongemoeid blijft.
//          Het apparaat start pas na een klik op "Start ingang" (de browser vraagt dan toestemming) en staat bij het eerste gebruik gedempt, zodat een
//          microfoon bij de luidsprekers geen rondzingen veroorzaakt. Een song of preset zet de ingang nooit zelf aan.
// Audio Input — een ingang van de computer als geluidsbron · Patchkamer contract v1.12
// Let op: een browser kent geen ASIO. Een interface werkt via het stuurprogramma van het besturingssysteem, en hoeveel kanalen de browser dan ziet, hangt van dat
// stuurprogramma af. Dit bestand is niet getest met echte hardware.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const MODES = ['stereo', 'mono', 'sum'], HPS = [0, 40, 80, 120], CAPS = ['stereo', 'all'];
const DEFAULTS = { device: '', deviceLabel: '', mode: 'stereo', ch: 1, capture: 'stereo', gain: 0, hp: 0, invert: false, mute: false, processing: false };

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { title: 'Audio Input', hint: 'Haalt geluid van een ingang van je computer: de standaardingang of een audio-interface die je systeem kent.',
    start: 'Start ingang', stop: 'Stop ingang', device: 'Ingang', defaultDev: 'Standaardingang van het systeem', unnamed: 'Ingang', capture: 'Kanalen van de ingang', capStereo: '2 (stereo)', capAll: 'Zoveel als de ingang geeft',
    mode: 'Weergave', modeStereo: 'Stereo (een paar)', modeMono: 'Mono (één kanaal naar links en rechts)', modeSum: 'Mono (paar samengeteld)', ch: 'Kanaal', pair: 'Paar',
    gain: 'Versterking', hp: 'Hoogdoorlaat', hpOff: 'uit', invert: 'Polariteit omkeren', mute: 'Dempen', processing: 'Browserbewerking (echo, ruis, automatisch niveau)',
    left: 'L', right: 'R', clip: 'clip', idle: 'Ingang is uit. Klik op Start ingang; de browser vraagt eenmalig toestemming.',
    live: (n, r) => 'Ingang loopt: ' + n + ' ' + (n === 1 ? 'kanaal' : 'kanalen') + (r ? ' · ' + r + ' Hz' : ''), muted: ' · gedempt: klik op Dempen om weer te horen',
    unsupported: 'Deze browser kan geen ingang openen (getUserMedia ontbreekt, of de pagina is niet veilig geladen).', denied: 'Geen toegang tot de ingang: geef toestemming in de browser.',
    notFound: 'De gekozen ingang is er niet (meer). Kies een andere.', busy: 'De ingang is in gebruik door een ander programma, of kon niet starten.', failed: m => 'Starten lukt niet: ' + m,
    feedback: 'Gebruik een koptelefoon of zet het volume laag: een microfoon bij de luidsprekers geeft rondzingen.', channelsNote: n => 'De ingang geeft ' + n + ' ' + (n === 1 ? 'kanaal' : 'kanalen') + '.',
    lost: 'De ingang is gestopt (losgekoppeld of afgenomen).', refresh: 'Ververs lijst' },
  en: { title: 'Audio Input', hint: 'Brings sound in from an input on your computer: the default input or an audio interface your system knows.',
    start: 'Start input', stop: 'Stop input', device: 'Input', defaultDev: 'System default input', unnamed: 'Input', capture: 'Channels of the input', capStereo: '2 (stereo)', capAll: 'As many as the input gives',
    mode: 'Mode', modeStereo: 'Stereo (a pair)', modeMono: 'Mono (one channel to left and right)', modeSum: 'Mono (pair summed)', ch: 'Channel', pair: 'Pair',
    gain: 'Gain', hp: 'High-pass', hpOff: 'off', invert: 'Invert polarity', mute: 'Mute', processing: 'Browser processing (echo, noise, auto level)',
    left: 'L', right: 'R', clip: 'clip', idle: 'The input is off. Click Start input; the browser asks for permission once.',
    live: (n, r) => 'Input running: ' + n + ' channel' + (n === 1 ? '' : 's') + (r ? ' · ' + r + ' Hz' : ''), muted: ' · muted: click Mute to hear it again',
    unsupported: 'This browser cannot open an input (getUserMedia is missing, or the page was not loaded securely).', denied: 'No access to the input: allow it in the browser.',
    notFound: 'The chosen input is not there (any more). Pick another.', busy: 'The input is in use by another program, or could not start.', failed: m => 'Could not start: ' + m,
    feedback: 'Use headphones or keep the volume low: a microphone near the speakers makes feedback.', channelsNote: n => 'The input gives ' + n + ' channel' + (n === 1 ? '' : 's') + '.',
    lost: 'The input stopped (unplugged or taken over).', refresh: 'Refresh list' }
};

export default {
  id: 'nl.patchkamer.audioinput', name: 'Audio Input', version: '1.12.2', kind: 'utility', category: 'mix', ui: { width: 480, minWidth: 400 },
  i18n: { nl: { ports: { out: 'Uit' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = { ...DEFAULTS }, dead = false, stream = null, src = null, split = null, nCh = 0, rate = 0, errText = '', devices = [], shell = null, ui = null, stopFrame = null, clipUntil = [0, 0], peak = [0, 0];
    // Geluidsketen: gl/gr -> samenvoeger -> hoogdoorlaat -> versterking (+ polariteit) -> meter -> uitgang (gedempt of niet)
    const gl = ctx.createGain(), gr = ctx.createGain(), merger = ctx.createChannelMerger(2), hp = ctx.createBiquadFilter(), trim = ctx.createGain(), out = ctx.createGain();
    const meterSplit = ctx.createChannelSplitter(2), anL = ctx.createAnalyser(), anR = ctx.createAnalyser();
    hp.type = 'highpass'; hp.Q.value = 0.707; hp.frequency.value = 10; anL.fftSize = anR.fftSize = 1024;
    gl.connect(merger, 0, 0); gr.connect(merger, 0, 1); merger.connect(hp); hp.connect(trim); trim.connect(out); trim.connect(meterSplit); meterSplit.connect(anL, 0); meterSplit.connect(anR, 1);
    const bufL = new Float32Array(1024), bufR = new Float32Array(1024);
    const soft = (p, v, tc) => { try { p.setTargetAtTime(v, ctx.currentTime, tc || 0.02); } catch (e) { p.value = v; } };
    function applyStage() {
      soft(trim.gain, Math.pow(10, state.gain / 20) * (state.invert ? -1 : 1));
      soft(out.gain, state.mute ? 0 : 1, 0.03);
      soft(hp.frequency, state.hp || 10); hp.type = 'highpass';
    }
    function route() {   // verbind de kanalen van de ingang met links en rechts
      if (!split) return;
      try { split.disconnect(); } catch (e) { /* niets verbonden */ }
      const n = nCh, a = clamp(state.ch - 1, 0, Math.max(0, n - 1)), b = Math.min(a + 1, n - 1);
      const to = (ch, g) => { if (ch < n) split.connect(g, ch, 0); };
      if (state.mode === 'mono') { gl.gain.value = 1; gr.gain.value = 1; to(a, gl); to(a, gr); }
      else if (state.mode === 'sum') { gl.gain.value = 0.5; gr.gain.value = 0.5; to(a, gl); to(b, gl); to(a, gr); to(b, gr); }
      else { gl.gain.value = 1; gr.gain.value = 1; to(a, gl); to(b === a ? a : b, gr); }
    }
    const supported = () => !!(typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
    async function refreshDevices() {
      if (!supported() || typeof navigator.mediaDevices.enumerateDevices !== 'function') return;
      try { const all = await navigator.mediaDevices.enumerateDevices(); if (dead) return; devices = all.filter(d => d.kind === 'audioinput' && d.deviceId !== 'default' && d.deviceId !== 'communications').map((d, i) => ({ id: d.deviceId, label: d.label || T.unnamed + ' ' + (i + 1) })); paint(); } catch (e) { /* lijst blijft zoals hij was */ }
    }
    function stopStream() {
      if (stream) { for (const t of stream.getTracks()) { t.onended = null; try { t.stop(); } catch (e) { /* al gestopt */ } } }
      stream = null; try { if (src) src.disconnect(); } catch (e) { /* ok */ } try { if (split) split.disconnect(); } catch (e) { /* ok */ } src = split = null; nCh = 0; rate = 0;
    }
    async function start() {
      if (dead) return; if (!supported()) { errText = T.unsupported; paint(); return; }
      stopStream(); errText = '';
      const audio = { echoCancellation: state.processing, noiseSuppression: state.processing, autoGainControl: state.processing, channelCount: { ideal: state.capture === 'all' ? 32 : 2 }, latency: { ideal: 0 } };
      if (state.device) audio.deviceId = { exact: state.device };
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio });
        if (dead) { for (const t of s.getTracks()) t.stop(); return; }
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume().catch(() => {});
        stream = s; const tr = s.getAudioTracks()[0], st = tr && tr.getSettings ? tr.getSettings() : {};
        nCh = Math.max(1, Math.min(32, st.channelCount || 2)); rate = st.sampleRate || 0;
        if (tr) tr.onended = () => { if (stream === s) { stopStream(); errText = T.lost; paint(); } };
        src = ctx.createMediaStreamSource(s); split = ctx.createChannelSplitter(nCh); src.connect(split); route();
        const lab = tr && tr.label; if (!state.device && lab) state.deviceLabel = lab;
        await refreshDevices();
      } catch (e) {
        const nm = e && e.name; errText = nm === 'NotAllowedError' || nm === 'SecurityError' ? T.denied : nm === 'NotFoundError' || nm === 'OverconstrainedError' ? T.notFound : nm === 'NotReadableError' || nm === 'AbortError' ? T.busy : T.failed((e && e.message) || String(e));
      }
      paint();
    }
    function stop() { stopStream(); errText = ''; peak = [0, 0]; paint(); }
    const running = () => !!stream;
    // ---- UI ----
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    function paint() {
      if (!ui) return;
      ui.startBtn.textContent = running() ? T.stop : T.start; ui.startBtn.classList.toggle('on', running());
      // lijst met ingangen
      const keep = state.device; ui.dev.replaceChildren(); const o0 = el('option', T.defaultDev, ui.dev); o0.value = '';
      let found = !keep; for (const d of devices) { const o = el('option', d.label, ui.dev); o.value = d.id; if (d.id === keep) found = true; }
      if (!found) { const o = el('option', state.deviceLabel || T.unnamed, ui.dev); o.value = keep; }
      ui.dev.value = keep; ui.cap.value = state.capture; ui.mode.value = state.mode;
      // kanaal- of paarkeuze
      const n = running() ? nCh : (state.capture === 'all' ? 8 : 2), pairs = state.mode !== 'mono';
      ui.ch.replaceChildren(); const count = pairs ? Math.max(1, Math.floor(n / 2)) : Math.max(1, n);
      for (let i = 1; i <= count; i++) { const o = el('option', pairs ? (2 * i - 1) + '+' + Math.min(2 * i, Math.max(n, 2 * i - 1)) : String(i), ui.ch); o.value = String(pairs ? 2 * i - 1 : i); }
      const want = pairs ? (state.ch % 2 === 0 ? state.ch - 1 : state.ch) : state.ch; ui.ch.value = String(want); if (ui.ch.value !== String(want)) ui.ch.value = ui.ch.options[0].value;
      ui.chLabel.textContent = pairs ? T.pair : T.ch;
      ui.hp.value = String(state.hp); ui.invert.checked = state.invert; ui.mute.classList.toggle('on', state.mute); ui.mute.setAttribute('aria-pressed', state.mute ? 'true' : 'false'); ui.proc.checked = state.processing; ui.gain.set && ui.gain.set(state.gain);
      ui.status.textContent = errText || (running() ? T.live(nCh, rate) + (state.mute ? T.muted : '') : T.idle);
      ui.status.classList.toggle('err', !!errText);
    }
    function frame() {
      if (!ui) return; const now = performance.now();
      [[anL, bufL], [anR, bufR]].forEach(([an, buf], i) => { an.getFloatTimeDomainData(buf); let p = 0; for (let k = 0; k < buf.length; k++) { const a = Math.abs(buf[k]); if (a > p) p = a; } if (!Number.isFinite(p)) p = 0; peak[i] = Math.max(p, peak[i] * 0.85); if (p >= 0.98) clipUntil[i] = now + 1500;
        const db = peak[i] > 0 ? 20 * Math.log10(peak[i]) : -90, w = Math.round(clamp((db + 60) / 60, 0, 1) * 100) + '%'; if (ui.bars[i].style.width !== w) ui.bars[i].style.width = w; ui.clips[i].classList.toggle('on', now < clipUntil[i]); });
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(root) {
        if (dead) return; self.unmount(); shell = el('div', null, root); const sh = shell.attachShadow({ mode: 'open' });
        const css = el('style', null, sh); css.textContent = ':host{display:block;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--card)}h2{margin:0;font:700 20px var(--disp,sans-serif);letter-spacing:.06em}.hint,.status,.warn{color:var(--muted);font-size:11px;line-height:1.4}.status.err{color:var(--stop,#e0584a)}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}label{display:flex;gap:6px;align-items:center}select,button{font:inherit;background:var(--field,var(--well));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:4px;padding:5px 8px;min-width:0;max-width:100%}button{cursor:pointer}button.on{background:var(--audio);color:#06222a;border-color:var(--audio)}.meter{display:grid;grid-template-columns:14px 1fr 34px;gap:6px;align-items:center}.bar{height:8px;background:var(--well,#0007);border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--audio)}.clip{font-size:9px;text-align:center;color:var(--muted);border:1px solid var(--line);border-radius:3px;padding:1px 0}.clip.on{background:var(--stop,#e0584a);color:#fff;border-color:var(--stop,#e0584a)}.gain{min-height:44px}';
        const app = el('div', null, sh, 'app'); el('h2', T.title, app); el('div', T.hint, app, 'hint');
        const r1 = el('div', null, app, 'row'); const startBtn = el('button', T.start, r1); startBtn.type = 'button'; startBtn.onclick = () => (running() ? stop() : start());
        const dev = el('select', null, r1); dev.setAttribute('aria-label', T.device); dev.onchange = () => { state.device = dev.value; const o = dev.options[dev.selectedIndex]; state.deviceLabel = dev.value ? (o ? o.textContent : '') : ''; if (running()) start(); };
        const rf = el('button', T.refresh, r1); rf.type = 'button'; rf.onclick = () => refreshDevices();
        const r2 = el('div', null, app, 'row'); const l2 = el('label', T.capture, r2); const cap = el('select', null, l2); cap.setAttribute('aria-label', T.capture);
        for (const [v, t] of [['stereo', T.capStereo], ['all', T.capAll]]) { const o = el('option', t, cap); o.value = v; } cap.onchange = () => { state.capture = pick(cap.value, CAPS, 'stereo'); if (running()) start(); else paint(); };
        const r3 = el('div', null, app, 'row'); const l3 = el('label', T.mode, r3); const mode = el('select', null, l3); mode.setAttribute('aria-label', T.mode);
        for (const [v, t] of [['stereo', T.modeStereo], ['mono', T.modeMono], ['sum', T.modeSum]]) { const o = el('option', t, mode); o.value = v; } mode.onchange = () => { state.mode = pick(mode.value, MODES, 'stereo'); route(); paint(); };
        const l4 = el('label', null, r3); const chLabel = el('span', T.ch, l4); const chSel = el('select', null, l4); chSel.setAttribute('aria-label', T.ch); chSel.onchange = () => { state.ch = clamp(parseInt(chSel.value, 10) || 1, 1, 32); route(); };
        const gainHost = el('div', null, app, 'gain'); const gain = host.ui.knob(gainHost, T.gain, [-24, 36, 0.5], state.gain, v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', v => { state.gain = v; applyStage(); }, { default: 0 });
        const r5 = el('div', null, app, 'row'); const l5 = el('label', T.hp, r5); const hpSel = el('select', null, l5); hpSel.setAttribute('aria-label', T.hp);
        for (const f of HPS) { const o = el('option', f ? f + ' Hz' : T.hpOff, hpSel); o.value = String(f); } hpSel.onchange = () => { state.hp = pick(parseInt(hpSel.value, 10), HPS, 0); applyStage(); };
        const l6 = el('label', null, r5); const inv = el('input', null, l6); inv.type = 'checkbox'; el('span', T.invert, l6); inv.onchange = () => { state.invert = inv.checked; applyStage(); };
        const r6 = el('div', null, app, 'row'); const mute = el('button', T.mute, r6); mute.type = 'button'; mute.onclick = () => { state.mute = !state.mute; applyStage(); paint(); };
        const l8 = el('label', null, r6); const proc = el('input', null, l8); proc.type = 'checkbox'; el('span', T.processing, l8); proc.onchange = () => { state.processing = proc.checked; if (running()) start(); };
        const bars = [], clips = []; for (const side of [T.left, T.right]) { const m = el('div', null, app, 'meter'); el('span', side, m); const b = el('div', null, m, 'bar'); bars.push(el('i', null, b)); clips.push(el('span', T.clip, m, 'clip')); }
        el('div', T.feedback, app, 'warn'); const status = el('div', null, app, 'status'); sh.addEventListener('pointerdown', e => e.stopPropagation());
        ui = { startBtn, dev, cap, mode, ch: chSel, chLabel, gain, hp: hpSel, invert: inv, mute, proc, bars, clips, status }; paint(); refreshDevices();
        stopFrame = host.frame(self, frame, 30);
      },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = ui = null; },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) {
        if (dead) return; s = s && typeof s === 'object' ? s : {}; const was = state;
        state = { device: typeof s.device === 'string' ? s.device.slice(0, 300) : DEFAULTS.device, deviceLabel: typeof s.deviceLabel === 'string' ? s.deviceLabel.slice(0, 200) : DEFAULTS.deviceLabel,
          mode: pick(s.mode, MODES, DEFAULTS.mode), ch: Math.round(num(s.ch, 1, 32, DEFAULTS.ch)), capture: pick(s.capture, CAPS, DEFAULTS.capture), gain: num(s.gain, -24, 36, DEFAULTS.gain),
          hp: pick(s.hp, HPS, DEFAULTS.hp), invert: typeof s.invert === 'boolean' ? s.invert : DEFAULTS.invert, mute: typeof s.mute === 'boolean' ? s.mute : DEFAULTS.mute, processing: typeof s.processing === 'boolean' ? s.processing : DEFAULTS.processing };
        applyStage(); route(); paint();
        // een andere ingang of andere opties: alleen opnieuw starten als de ingang al liep (nooit uit zichzelf aanzetten)
        if (running() && (was.device !== state.device || was.capture !== state.capture || was.processing !== state.processing)) start();
      },
      getPreset() { const p = self.getState(); delete p.device; delete p.deviceLabel; delete p.mute; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, ...p, device: s.device, deviceLabel: s.deviceLabel, mute: s.mute }); },
      destroy() { if (dead) return; dead = true; self.unmount(); stopStream(); try { if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) navigator.mediaDevices.removeEventListener('devicechange', refreshDevices); } catch (e) { /* ok */ } for (const n of [gl, gr, merger, hp, trim, out, meterSplit, anL, anR]) { try { n.disconnect(); } catch (e) { /* ok */ } } }
    };
    applyStage();
    try { if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', refreshDevices); } catch (e) { /* ok */ }
    return self;
  }
};
