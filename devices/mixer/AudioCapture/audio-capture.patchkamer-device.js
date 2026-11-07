// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.19.0 — Eerste versie. Audio Capture haalt het geluid van een ander browsertabblad, een venster of (waar het systeem het toelaat) het hele
//          systeem de studio in. Na een klik op "Start capture" laat de browser je de bron kiezen (de gewone deelkeuze van het scherm); het
//          geluid daarvan komt op de uitgang `out`, die op elke audio-ingang past. Tabgeluid werkt in elke browser die geluid kan delen; systeemgeluid
//          alleen op Windows (en in de app op Windows). Versterking van -24 tot +36 dB, hoogdoorlaat, polariteit, stereo of mono, dempen en meters.
//          Het apparaat start nooit uit zichzelf: een song, een preset of het herstellen van een werkruimte zet de bron nooit aan.
// Audio Capture — geluid van een tab, venster of het systeem als geluidsbron · Patchkamer contract v1.19
// Let op: de browser deelt altijd een beeld mee met het geluid; dat beeld wordt hier niet gebruikt en niet getoond. Dit bestand is niet getest met een
// echte schermdeling (alleen met een nepbron).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const MODES = ['stereo', 'mono'], HPS = [0, 40, 80, 120];
const DEFAULTS = { mode: 'stereo', gain: 0, hp: 0, invert: false, mute: false };

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { title: 'Audio Capture', hint: 'Haalt het geluid van een ander tabblad, een venster of het systeem de studio in. Kies na het starten de bron en vink het delen van geluid aan.',
    start: 'Start capture', stop: 'Stop capture', mode: 'Weergave', modeStereo: 'Stereo', modeMono: 'Mono (kanalen samengeteld)',
    gain: 'Versterking', hp: 'Hoogdoorlaat', hpOff: 'uit', invert: 'Polariteit omkeren', mute: 'Dempen',
    left: 'L', right: 'R', clip: 'clip', idle: 'Capture is uit. Klik op Start capture en kies een bron; vink "geluid delen" aan.',
    live: (s, r) => 'Capture loopt' + (s ? ': ' + s : '') + (r ? ' · ' + r + ' Hz' : ''), muted: ' · gedempt: klik op Dempen om weer te horen',
    unsupported: 'Deze browser kan geen geluid van een tab of scherm delen (getDisplayMedia ontbreekt, of de pagina is niet veilig geladen).',
    cancelled: 'Geen bron gekozen, of de toegang is geweigerd.', noAudio: 'De gekozen bron deelt geen geluid. Kies een tabblad en vink "tabgeluid delen" aan; systeemgeluid kan alleen op Windows.',
    failed: m => 'Starten lukt niet: ' + m, lost: 'De capture is gestopt (het delen is beëindigd).',
    loop: 'Let op: kies je Patchkamer zelf of het systeemgeluid terwijl dit apparaat naar Speakers gaat, dan hoor je jezelf terug (rondzingen). Kies een ander tabblad of gebruik een koptelefoon.',
    platform: 'Systeemgeluid kan alleen op Windows. Op Linux en macOS: kies een tabblad, of gebruik Audio Input met een loopback-ingang.' },
  en: { title: 'Audio Capture', hint: 'Brings the sound of another tab, a window or the system into the studio. After starting, choose the source and tick sharing sound.',
    start: 'Start capture', stop: 'Stop capture', mode: 'Mode', modeStereo: 'Stereo', modeMono: 'Mono (channels summed)',
    gain: 'Gain', hp: 'High-pass', hpOff: 'off', invert: 'Invert polarity', mute: 'Mute',
    left: 'L', right: 'R', clip: 'clip', idle: 'Capture is off. Click Start capture and choose a source; tick "share sound".',
    live: (s, r) => 'Capture running' + (s ? ': ' + s : '') + (r ? ' · ' + r + ' Hz' : ''), muted: ' · muted: click Mute to hear it again',
    unsupported: 'This browser cannot share the sound of a tab or screen (getDisplayMedia is missing, or the page was not loaded securely).',
    cancelled: 'No source chosen, or access was refused.', noAudio: 'The chosen source shares no sound. Choose a tab and tick "share tab audio"; system sound only works on Windows.',
    failed: m => 'Could not start: ' + m, lost: 'The capture stopped (sharing was ended).',
    loop: 'Note: if you choose Patchkamer itself or the system sound while this device feeds Speakers, you hear yourself (feedback). Choose another tab or use headphones.',
    platform: 'System sound only works on Windows. On Linux and macOS: choose a tab, or use Audio Input with a loopback input.' }
};

export default {
  id: 'nl.patchkamer.audiocapture', name: 'Audio Capture', version: '1.19.0', kind: 'utility', category: 'mix', ui: { width: 440, minWidth: 380 },
  i18n: { nl: { ports: { out: 'Uit' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = { ...DEFAULTS }, dead = false, stream = null, src = null, errText = '', srcLabel = '', rate = 0, shell = null, ui = null, stopFrame = null, clipUntil = [0, 0], peak = [0, 0];
    // Geluidsketen: bron -> naar 2 kanalen -> splitsen -> gl/gr -> samenvoeger -> hoogdoorlaat -> versterking (+ polariteit) -> meter -> uitgang (gedempt of niet)
    const up = ctx.createGain(), split = ctx.createChannelSplitter(2), gl = ctx.createGain(), gr = ctx.createGain(), merger = ctx.createChannelMerger(2), hp = ctx.createBiquadFilter(), trim = ctx.createGain(), out = ctx.createGain();
    const meterSplit = ctx.createChannelSplitter(2), anL = ctx.createAnalyser(), anR = ctx.createAnalyser();
    up.channelCount = 2; up.channelCountMode = 'explicit'; up.channelInterpretation = 'speakers';
    hp.type = 'highpass'; hp.Q.value = 0.707; hp.frequency.value = 10; anL.fftSize = anR.fftSize = 1024;
    up.connect(split); gl.connect(merger, 0, 0); gr.connect(merger, 0, 1); merger.connect(hp); hp.connect(trim); trim.connect(out); trim.connect(meterSplit); meterSplit.connect(anL, 0); meterSplit.connect(anR, 1);
    const bufL = new Float32Array(1024), bufR = new Float32Array(1024);
    const soft = (p, v, tc) => { try { p.setTargetAtTime(v, ctx.currentTime, tc || 0.02); } catch (e) { p.value = v; } };
    function applyStage() {
      soft(trim.gain, Math.pow(10, state.gain / 20) * (state.invert ? -1 : 1));
      soft(out.gain, state.mute ? 0 : 1, 0.03);
      soft(hp.frequency, state.hp || 10); hp.type = 'highpass';
    }
    function route() {   // kanalen van de bron naar links en rechts
      try { split.disconnect(); } catch (e) { /* niets verbonden */ }
      if (state.mode === 'mono') { gl.gain.value = 0.5; gr.gain.value = 0.5; split.connect(gl, 0, 0); split.connect(gl, 1, 0); split.connect(gr, 0, 0); split.connect(gr, 1, 0); }
      else { gl.gain.value = 1; gr.gain.value = 1; split.connect(gl, 0, 0); split.connect(gr, 1, 0); }
    }
    const supported = () => !!(typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
    function stopStream() {
      if (stream) { for (const t of stream.getTracks()) { t.onended = null; try { t.stop(); } catch (e) { /* al gestopt */ } } }
      stream = null; try { if (src) src.disconnect(); } catch (e) { /* ok */ } src = null; srcLabel = ''; rate = 0;
    }
    async function start() {
      if (dead) return; if (!supported()) { errText = T.unsupported; paint(); return; }
      stopStream(); errText = '';
      // De browser eist een beeldspoor bij het delen; het blijft ongebruikt (laag beeldtempo) en het stoppen van het delen beëindigt beide sporen.
      const opts = {
        video: { frameRate: { ideal: 1, max: 5 } },
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 2 }, systemAudio: 'include', restrictOwnAudio: true },
        selfBrowserSurface: 'exclude', surfaceSwitching: 'include', preferCurrentTab: false
      };
      try {
        const s = await navigator.mediaDevices.getDisplayMedia(opts);
        if (dead) { for (const t of s.getTracks()) t.stop(); return; }
        const at = s.getAudioTracks()[0];
        if (!at) { for (const t of s.getTracks()) t.stop(); errText = T.noAudio; paint(); return; }
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume().catch(() => {});
        stream = s; const st = at.getSettings ? at.getSettings() : {}; rate = st.sampleRate || 0;
        const vt = s.getVideoTracks()[0]; srcLabel = ((vt && vt.label) || at.label || '').slice(0, 120);
        const ended = () => { if (stream === s) { stopStream(); errText = T.lost; paint(); } };
        for (const t of s.getTracks()) t.onended = ended;
        src = ctx.createMediaStreamSource(new MediaStream([at])); src.connect(up);
      } catch (e) {
        const nm = e && e.name; errText = nm === 'NotAllowedError' || nm === 'AbortError' || nm === 'SecurityError' ? T.cancelled : nm === 'NotSupportedError' || nm === 'TypeError' ? T.unsupported : T.failed((e && e.message) || String(e));
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
      ui.mode.value = state.mode; ui.hp.value = String(state.hp); ui.invert.checked = state.invert;
      ui.mute.classList.toggle('on', state.mute); ui.mute.setAttribute('aria-pressed', state.mute ? 'true' : 'false'); ui.gain.set && ui.gain.set(state.gain);
      ui.status.textContent = errText || (running() ? T.live(srcLabel, rate) + (state.mute ? T.muted : '') : T.idle);
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
        const r2 = el('div', null, app, 'row'); const l2 = el('label', T.mode, r2); const mode = el('select', null, l2); mode.setAttribute('aria-label', T.mode);
        for (const [v, t] of [['stereo', T.modeStereo], ['mono', T.modeMono]]) { const o = el('option', t, mode); o.value = v; } mode.onchange = () => { state.mode = pick(mode.value, MODES, 'stereo'); route(); };
        const gainHost = el('div', null, app, 'gain'); const gain = host.ui.knob(gainHost, T.gain, [-24, 36, 0.5], state.gain, v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', v => { state.gain = v; applyStage(); }, { default: 0, id: 'gain', group: 'input' });
        const r3 = el('div', null, app, 'row'); const l3 = el('label', T.hp, r3); const hpSel = el('select', null, l3); hpSel.setAttribute('aria-label', T.hp);
        for (const f of HPS) { const o = el('option', f ? f + ' Hz' : T.hpOff, hpSel); o.value = String(f); } hpSel.onchange = () => { state.hp = pick(parseInt(hpSel.value, 10), HPS, 0); applyStage(); };
        const l4 = el('label', null, r3); const inv = el('input', null, l4); inv.type = 'checkbox'; el('span', T.invert, l4); inv.onchange = () => { state.invert = inv.checked; applyStage(); };
        const r4 = el('div', null, app, 'row'); const mute = el('button', T.mute, r4); mute.type = 'button'; mute.onclick = () => { state.mute = !state.mute; applyStage(); paint(); };
        const bars = [], clips = []; for (const side of [T.left, T.right]) { const m = el('div', null, app, 'meter'); el('span', side, m); const b = el('div', null, m, 'bar'); bars.push(el('i', null, b)); clips.push(el('span', T.clip, m, 'clip')); }
        el('div', T.loop, app, 'warn'); el('div', T.platform, app, 'warn'); const status = el('div', null, app, 'status'); sh.addEventListener('pointerdown', e => e.stopPropagation());
        ui = { startBtn, mode, gain, hp: hpSel, invert: inv, mute, bars, clips, status }; paint();
        stopFrame = host.frame(self, frame, 30);
      },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = ui = null; },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) {
        if (dead) return; s = s && typeof s === 'object' ? s : {};
        state = { mode: pick(s.mode, MODES, DEFAULTS.mode), gain: num(s.gain, -24, 36, DEFAULTS.gain), hp: pick(s.hp, HPS, DEFAULTS.hp),
          invert: typeof s.invert === 'boolean' ? s.invert : DEFAULTS.invert, mute: typeof s.mute === 'boolean' ? s.mute : DEFAULTS.mute };
        applyStage(); route(); paint();   // de bron start nooit uit zichzelf
      },
      getPreset() { const p = self.getState(); delete p.mute; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, ...p, mute: s.mute }); },
      destroy() { if (dead) return; dead = true; self.unmount(); stopStream(); for (const n of [up, split, gl, gr, merger, hp, trim, out, meterSplit, anL, anR]) { try { n.disconnect(); } catch (e) { /* ok */ } } }
    };
    applyStage(); route();
    return self;
  }
};
