// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.12.0 — Eerste versie. Audio Output stuurt het geluid naar een uitgang van de computer die je zelf kiest: de standaarduitgang, een koptelefoonuitgang of een
//          audio-interface die het besturingssysteem als uitgang aanbiedt (USB-interfaces, ingebouwde lijnuitgang). De lijst met uitgangen komt van de browser (namen
//          zoals het systeem ze geeft; er staan geen vaste namen in dit bestand). Naast Speakers kun je zo meerdere uitgangen tegelijk gebruiken, bijvoorbeeld de mix naar
//          de monitors en een luistermix naar de koptelefoon. Met een volume van -60 tot +6 dB, mono, een begrenzer, dempen en meters. Heeft de standaarduitgang meer dan
//          twee kanalen, dan kies je het paar (1+2, 3+4 …). Achter de begrenzer ligt een harde grens op 0 dBFS. De begrenzer en het volume zijn bewaakt tegen niet-eindige waarden: een NaN of Infinity van een ander apparaat
//          vergiftigt de begrenzer niet blijvend.
// Audio Output — een uitgang van de computer kiezen · Patchkamer contract v1.12
// Let op: een browser kent geen ASIO. Een interface werkt via het stuurprogramma van het besturingssysteem. Een gekozen uitgang is stereo. Het kiezen van een paar werkt alleen
// op de standaarduitgang en alleen als de browser meer dan twee kanalen toont. Dit bestand is niet getest met echte hardware.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
const DEFAULTS = { device: '', deviceLabel: '', level: -6, mono: false, limiter: true, mute: false, pair: 1 };

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { title: 'Audio Output', hint: 'Stuurt het geluid naar een uitgang van je computer: de standaarduitgang of een audio-interface die je systeem kent.',
    device: 'Uitgang', defaultDev: 'Standaarduitgang van het systeem', unnamed: 'Uitgang', choose: 'Kies uitgang…', refresh: 'Ververs lijst', pair: 'Paar',
    level: 'Volume', mono: 'Mono', limiter: 'Begrenzer', mute: 'Gedempt', left: 'L', right: 'R', clip: 'clip', toDefault: 'Speelt naar de standaarduitgang van het systeem.',
    toDevice: n => 'Speelt naar: ' + n, toPair: p => 'Speelt naar de standaarduitgang, kanalen ' + p + '.', paired: 'Een gekozen uitgang is stereo; een paar kiezen kan alleen op de standaarduitgang.',
    unsupported: 'Deze browser kan het geluid niet naar een gekozen uitgang sturen (setSinkId ontbreekt). Het geluid gaat naar de standaarduitgang.',
    denied: 'Geen toestemming voor deze uitgang. Kies hem opnieuw met Kies uitgang…', notFound: 'De gekozen uitgang is er niet (meer). Het geluid gaat naar de standaarduitgang.',
    blocked: 'De browser houdt het geluid tegen tot je ergens in Patchkamer klikt (druk op Start).', failed: m => 'Deze uitgang lukt niet: ' + m,
    guard: 'Er kwam een ongeldig signaal binnen; de begrenzer is hersteld.', loud: 'Pas op: het volume staat boven 0 dB.' },
  en: { title: 'Audio Output', hint: 'Sends the sound to an output on your computer: the default output or an audio interface your system knows.',
    device: 'Output', defaultDev: 'System default output', unnamed: 'Output', choose: 'Choose output…', refresh: 'Refresh list', pair: 'Pair',
    level: 'Volume', mono: 'Mono', limiter: 'Limiter', mute: 'Muted', left: 'L', right: 'R', clip: 'clip', toDefault: 'Playing to the default output of the system.',
    toDevice: n => 'Playing to: ' + n, toPair: p => 'Playing to the default output, channels ' + p + '.', paired: 'A chosen output is stereo; picking a pair only works on the default output.',
    unsupported: 'This browser cannot send the sound to a chosen output (setSinkId is missing). The sound goes to the default output.',
    denied: 'No permission for this output. Choose it again with Choose output…', notFound: 'The chosen output is not there (any more). The sound goes to the default output.',
    blocked: 'The browser holds back the sound until you click somewhere in Patchkamer (press Start).', failed: m => 'This output does not work: ' + m,
    guard: 'An invalid signal came in; the limiter was restored.', loud: 'Careful: the volume is above 0 dB.' }
};

export default {
  id: 'nl.patchkamer.audiooutput', name: 'Audio Output', version: '1.12.0', kind: 'output', category: 'mix', ui: { width: 380, minWidth: 300 },
  i18n: { nl: { ports: { in: 'In' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = { ...DEFAULTS }, dead = false, devices = [], shell = null, ui = null, stopFrame = null, peak = [0, 0], clipUntil = [0, 0], note = '', guardUntil = 0, destChanged = false, audioEl = null, mediaDest = null, sinkReq = 0;
    // Keten: in -> toegangspoort -> kruismatrix (stereo/mono) -> volume -> begrenzer -> uitgang; meters zitten achter de begrenzer.
    const input = ctx.createGain(), entry = ctx.createGain(), spl = ctx.createChannelSplitter(2), mrg = ctx.createChannelMerger(2), trim = ctx.createGain(), sink = ctx.createGain();
    const gLL = ctx.createGain(), gLR = ctx.createGain(), gRL = ctx.createGain(), gRR = ctx.createGain();
    const tapIn = ctx.createAnalyser(), tapOut = ctx.createAnalyser(), mSplit = ctx.createChannelSplitter(2), anL = ctx.createAnalyser(), anR = ctx.createAnalyser();
    tapIn.fftSize = tapOut.fftSize = anL.fftSize = anR.fftSize = 1024;
    const bufIn = new Float32Array(1024), bufOut = new Float32Array(1024), bufL = new Float32Array(1024), bufR = new Float32Array(1024);
    const clipper = ctx.createWaveShaper(); clipper.curve = new Float32Array([-1, 1]);   // harde grens op 0 dBFS: een enorme piek gaat nooit naar de uitgang
    let lim = null, limOn = true, entryOn = false;
    const soft = (p, v, tc) => { try { p.setTargetAtTime(v, ctx.currentTime, tc || 0.02); } catch (e) { p.value = v; } };
    function makeLimiter() {
      const c = ctx.createDynamicsCompressor(); c.threshold.value = -1; c.knee.value = 0; c.ratio.value = 20; c.attack.value = 0.001; c.release.value = 0.1; return c;
    }
    input.connect(tapIn);
    spl.connect(gLL, 0); spl.connect(gLR, 0); spl.connect(gRL, 1); spl.connect(gRR, 1);
    gLL.connect(mrg, 0, 0); gRL.connect(mrg, 0, 0); gLR.connect(mrg, 0, 1); gRR.connect(mrg, 0, 1);
    mrg.connect(trim);
    function wireLimiter() {   // trim -> (begrenzer) -> sink, plus de meters
      try { trim.disconnect(); } catch (e) { /* niets verbonden */ } try { if (lim) lim.disconnect(); } catch (e) { /* ok */ }
      lim = makeLimiter(); limOn = state.limiter;
      if (state.limiter) { trim.connect(lim); lim.connect(clipper); } else trim.connect(clipper);
    }
    clipper.connect(sink); clipper.connect(tapOut); clipper.connect(mSplit);
    mSplit.connect(anL, 0); mSplit.connect(anR, 1);
    function connectEntry(on) {
      if (on === entryOn) return; entryOn = on;
      try { if (on) { input.connect(entry); entry.connect(spl); } else { input.disconnect(entry); entry.disconnect(); } } catch (e) { /* ok */ }
    }
    function applyStage() {
      const lv = state.mute ? 0 : Math.pow(10, state.level / 20);
      soft(trim.gain, lv, 0.03);
      const m = state.mono ? 0.5 : 1, x = state.mono ? 0.5 : 0;
      for (const [g, v] of [[gLL, m], [gRR, m], [gLR, x], [gRL, x]]) soft(g.gain, v, 0.02);
    }
    // ---- uitgang kiezen ----
    const maxCh = () => { try { return Math.max(2, ctx.destination.maxChannelCount || 2); } catch (e) { return 2; } };
    function resetDestination() {
      if (!destChanged) return; destChanged = false;
      try { ctx.destination.channelCount = 2; ctx.destination.channelInterpretation = 'speakers'; } catch (e) { /* ok */ }
    }
    let pairNodes = null;
    function dropRoute() {
      try { sink.disconnect(); } catch (e) { /* ok */ }
      if (pairNodes) { for (const n of pairNodes) { try { n.disconnect(); } catch (e) { /* ok */ } } pairNodes = null; }
      if (audioEl) { try { audioEl.pause(); audioEl.srcObject = null; } catch (e) { /* ok */ } audioEl = null; }
      if (mediaDest) { try { mediaDest.disconnect(); } catch (e) { /* ok */ } mediaDest = null; }
    }
    async function route() {
      if (dead) return; const my = ++sinkReq; dropRoute(); note = '';
      const n = maxCh(), pair = clamp(Math.round(state.pair), 1, Math.max(1, Math.floor(n / 2)));
      if (state.device) {
        resetDestination();
        const canSink = typeof Audio !== 'undefined' && typeof ctx.createMediaStreamDestination === 'function' && typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
        if (!canSink) { note = T.unsupported; sink.connect(ctx.destination); paint(); return; }
        try {
          mediaDest = ctx.createMediaStreamDestination(); mediaDest.channelCount = 2; sink.connect(mediaDest);
          const el = new Audio(); el.srcObject = mediaDest.stream; audioEl = el;
          await el.setSinkId(state.device); if (dead || my !== sinkReq) return;
          const p = el.play(); if (p && p.catch) await p.catch(e => { if (e && e.name === 'NotAllowedError') note = T.blocked; else throw e; });
          if (!note) note = T.toDevice(state.deviceLabel || T.unnamed);
        } catch (e) {
          if (dead || my !== sinkReq) return; dropRoute(); sink.connect(ctx.destination);
          const nm = e && e.name; note = nm === 'NotFoundError' || nm === 'OverconstrainedError' ? T.notFound : nm === 'NotAllowedError' || nm === 'SecurityError' ? T.denied : T.failed((e && e.message) || String(e));
        }
      } else if (pair > 1 && n > 2) {
        try {
          ctx.destination.channelCount = n; ctx.destination.channelInterpretation = 'discrete'; destChanged = true;
          const sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(n); sink.connect(sp); sp.connect(mg, 0, 2 * pair - 2); sp.connect(mg, 1, 2 * pair - 1); mg.connect(ctx.destination); pairNodes = [sp, mg];
          note = T.toPair((2 * pair - 1) + '+' + (2 * pair));
        } catch (e) { resetDestination(); sink.connect(ctx.destination); note = T.failed((e && e.message) || String(e)); }
      } else { resetDestination(); sink.connect(ctx.destination); note = T.toDefault; }
      paint();
    }
    const supported = () => !!(typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function');
    async function refreshDevices() {
      if (!supported()) return;
      try { const all = await navigator.mediaDevices.enumerateDevices(); if (dead) return; devices = all.filter(d => d.kind === 'audiooutput' && d.deviceId !== 'default' && d.deviceId !== 'communications').map((d, i) => ({ id: d.deviceId, label: d.label || T.unnamed + ' ' + (i + 1) })); paint(); } catch (e) { /* lijst blijft */ }
    }
    async function choose() {   // vraagt de browser om een uitgang te kiezen (geeft toestemming en de namen)
      try {
        if (typeof navigator.mediaDevices.selectAudioOutput !== 'function') { refreshDevices(); return; }
        const d = await navigator.mediaDevices.selectAudioOutput(); if (dead || !d) return;
        state.device = d.deviceId; state.deviceLabel = d.label || ''; await refreshDevices(); route();
      } catch (e) { const nm = e && e.name; if (nm !== 'AbortError') { note = nm === 'NotAllowedError' ? T.denied : T.failed((e && e.message) || String(e)); paint(); } }
    }
    // ---- UI ----
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    function paint() {
      if (!ui) return;
      const keep = state.device; ui.dev.replaceChildren(); const o0 = el('option', T.defaultDev, ui.dev); o0.value = '';
      let found = !keep; for (const d of devices) { const o = el('option', d.label, ui.dev); o.value = d.id; if (d.id === keep) found = true; }
      if (!found) { const o = el('option', state.deviceLabel || T.unnamed, ui.dev); o.value = keep; }
      ui.dev.value = keep;
      const n = maxCh(), pairs = Math.max(1, Math.floor(n / 2)); ui.pair.replaceChildren(); for (let i = 1; i <= pairs; i++) { const o = el('option', (2 * i - 1) + '+' + (2 * i), ui.pair); o.value = String(i); }
      ui.pair.value = String(clamp(Math.round(state.pair), 1, pairs)); ui.pairRow.hidden = n <= 2; ui.pair.disabled = !!state.device;
      ui.choose.hidden = !(supported() && typeof navigator.mediaDevices.selectAudioOutput === 'function');
      ui.mono.checked = state.mono; ui.limiter.checked = state.limiter; ui.mute.checked = state.mute; ui.gain.set && ui.gain.set(state.level);
      ui.status.textContent = (performance.now() < guardUntil ? T.guard + ' ' : '') + (note || '') + (n > 2 && state.device ? ' ' + T.paired : '') + (state.level > 0 ? ' ' + T.loud : '');
    }
    // De bewaking: een NaN of Infinity (of een absurde waarde) van een ander apparaat mag de begrenzer niet blijvend vergiftigen.
    const bad = buf => { for (let i = 0; i < buf.length; i++) { const v = buf[i]; if (!Number.isFinite(v) || v > 1e6 || v < -1e6) return true; } return false; };
    function guard() {
      tapIn.getFloatTimeDomainData(bufIn); tapOut.getFloatTimeDomainData(bufOut);
      const inBad = bad(bufIn), outBad = bad(bufOut);
      if (inBad) { connectEntry(false); guardUntil = performance.now() + 4000; }
      if (outBad) { wireLimiter(); applyStage(); guardUntil = performance.now() + 4000; }
      if (!inBad && !entryOn) connectEntry(true);
    }
    function frame() {
      guard();
      if (!ui) return; const now = performance.now();
      [[anL, bufL], [anR, bufR]].forEach(([an, buf], i) => { an.getFloatTimeDomainData(buf); let p = 0; for (let k = 0; k < buf.length; k++) { const a = Math.abs(buf[k]); if (a > p) p = a; } if (!Number.isFinite(p)) p = 0; peak[i] = Math.max(p, peak[i] * 0.85); if (p >= 0.98) clipUntil[i] = now + 1500;
        const db = peak[i] > 0 ? 20 * Math.log10(peak[i]) : -90, w = Math.round(clamp((db + 60) / 60, 0, 1) * 100) + '%'; if (ui.bars[i].style.width !== w) ui.bars[i].style.width = w; ui.clips[i].classList.toggle('on', now < clipUntil[i]); });
      if (guardUntil && now > guardUntil) { guardUntil = 0; paint(); }
    }
    const self = {
      inputs: { in: input }, outputs: {},
      mount(root) {
        if (dead) return; self.unmount(); shell = el('div', null, root); const sh = shell.attachShadow({ mode: 'open' });
        const css = el('style', null, sh); css.textContent = ':host{display:block;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--card)}h2{margin:0;font:700 20px var(--disp,sans-serif);letter-spacing:.06em}.hint,.status{color:var(--muted);font-size:11px;line-height:1.4}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}label{display:flex;gap:6px;align-items:center}select,button{font:inherit;background:var(--field,var(--well));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:4px;padding:5px 8px;min-width:0;max-width:100%}button{cursor:pointer}.meter{display:grid;grid-template-columns:14px 1fr 34px;gap:6px;align-items:center}.bar{height:8px;background:var(--well,#0007);border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--audio)}.clip{font-size:9px;text-align:center;color:var(--muted);border:1px solid var(--line);border-radius:3px;padding:1px 0}.clip.on{background:var(--stop,#e0584a);color:#fff;border-color:var(--stop,#e0584a)}.gain{min-height:44px}[hidden]{display:none!important}';
        const app = el('div', null, sh, 'app'); el('h2', T.title, app); el('div', T.hint, app, 'hint');
        const r1 = el('div', null, app, 'row'); const dev = el('select', null, r1); dev.setAttribute('aria-label', T.device);
        dev.onchange = () => { state.device = dev.value; const o = dev.options[dev.selectedIndex]; state.deviceLabel = dev.value ? (o ? o.textContent : '') : ''; route(); };
        const choose_ = el('button', T.choose, r1); choose_.type = 'button'; choose_.onclick = choose; const rf = el('button', T.refresh, r1); rf.type = 'button'; rf.onclick = () => refreshDevices();
        const pairRow = el('div', null, app, 'row'); const lp = el('label', T.pair, pairRow); const pair = el('select', null, lp); pair.setAttribute('aria-label', T.pair); pair.onchange = () => { state.pair = Math.round(num(parseInt(pair.value, 10), 1, 16, 1)); route(); };
        const gainHost = el('div', null, app, 'gain'); const gain = host.ui.knob(gainHost, T.level, [-60, 6, 0.5], state.level, v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', v => { state.level = v; applyStage(); paint(); }, { default: -6 });
        const r3 = el('div', null, app, 'row');
        const lm = el('label', null, r3); const mono = el('input', null, lm); mono.type = 'checkbox'; el('span', T.mono, lm); mono.onchange = () => { state.mono = mono.checked; applyStage(); };
        const ll = el('label', null, r3); const limiter = el('input', null, ll); limiter.type = 'checkbox'; el('span', T.limiter, ll); limiter.onchange = () => { state.limiter = limiter.checked; wireLimiter(); applyStage(); };
        const lmu = el('label', null, r3); const mute = el('input', null, lmu); mute.type = 'checkbox'; el('span', T.mute, lmu); mute.onchange = () => { state.mute = mute.checked; applyStage(); };
        const bars = [], clips = []; for (const side of [T.left, T.right]) { const m = el('div', null, app, 'meter'); el('span', side, m); const b = el('div', null, m, 'bar'); bars.push(el('i', null, b)); clips.push(el('span', T.clip, m, 'clip')); }
        const status = el('div', null, app, 'status'); sh.addEventListener('pointerdown', e => e.stopPropagation());
        ui = { dev, choose: choose_, pair, pairRow, gain, mono, limiter, mute, bars, clips, status }; paint(); refreshDevices();
        stopFrame = host.frame(self, frame, 30);
      },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = ui = null; },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) {
        if (dead) return; s = s && typeof s === 'object' ? s : {}; const was = state;
        state = { device: typeof s.device === 'string' ? s.device.slice(0, 300) : DEFAULTS.device, deviceLabel: typeof s.deviceLabel === 'string' ? s.deviceLabel.slice(0, 200) : DEFAULTS.deviceLabel,
          level: num(s.level, -60, 6, DEFAULTS.level), mono: typeof s.mono === 'boolean' ? s.mono : DEFAULTS.mono, limiter: typeof s.limiter === 'boolean' ? s.limiter : DEFAULTS.limiter,
          mute: typeof s.mute === 'boolean' ? s.mute : DEFAULTS.mute, pair: Math.round(num(s.pair, 1, 16, DEFAULTS.pair)) };
        if (was.limiter !== state.limiter) wireLimiter();
        applyStage(); if (was.device !== state.device || was.pair !== state.pair) route(); else paint();
      },
      getPreset() { const p = self.getState(); delete p.device; delete p.deviceLabel; delete p.mute; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, ...p, device: s.device, deviceLabel: s.deviceLabel, mute: s.mute }); },
      destroy() { if (dead) return; dead = true; self.unmount(); dropRoute(); resetDestination(); for (const n of [input, entry, spl, mrg, trim, clipper, sink, gLL, gLR, gRL, gRR, tapIn, tapOut, mSplit, anL, anR, lim]) { try { if (n) n.disconnect(); } catch (e) { /* ok */ } } }
    };
    wireLimiter(); connectEntry(true); applyStage(); route();
    return self;
  }
};
