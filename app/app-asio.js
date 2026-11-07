// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs in the page of the host, inside the desktop app only (the wrapper adds it to the page it serves).
// 1. With ASIO on: the AudioContext of the host gets a silent output ("none"); everything that is connected to its
//    destination goes to a worklet that writes the audio into shared memory; a worker passes it to the main
//    process, where the native addon plays it through the ASIO driver.
// 2. A small button with a panel to choose driver, buffer and output pair.
(function () {
  'use strict';
  const N = window.pkNative && window.pkNative.asio;
  if (!N) return;
  const info = N.info || { ok: false };
  const lang = (() => { try { const p = localStorage.getItem('patchkamer.lang'); if (p === 'nl' || p === 'en') return p; } catch (e) {} return /^nl\b/i.test(navigator.language || '') ? 'nl' : 'en'; })();
  const T = {
    en: { off: 'ASIO off', on: 'ASIO', title: 'Audio through ASIO (this app only)', use: 'Use ASIO', driver: 'Driver', buffer: 'Buffer (frames)', auto: 'Auto (driver)',
      pair: 'Output pair', margin: 'Margin', rate: 'Sample rate', apply: 'Apply', panel: 'Driver panel', close: 'Close', none: 'No ASIO driver found',
      note: 'Applying reloads the audio; the app asks first and keeps your workspace.', failed: 'ASIO did not start: ', built: 'This build has no ASIO (test clock only).',
      reported: 'driver reports', ring: 'ring', gaps: 'gaps', ms: 'ms', est: 'estimated delay', reset: 'The driver asks for a reset: apply again.', test: 'Test clock (no sound)' },
    nl: { off: 'ASIO uit', on: 'ASIO', title: 'Audio via ASIO (alleen in deze app)', use: 'Gebruik ASIO', driver: 'Driver', buffer: 'Buffer (frames)', auto: 'Automatisch (driver)',
      pair: 'Uitgangspaar', margin: 'Marge', rate: 'Sample rate', apply: 'Toepassen', panel: 'Driverpaneel', close: 'Sluiten', none: 'Geen ASIO-driver gevonden',
      note: 'Toepassen laadt de audio opnieuw; de app vraagt eerst en bewaart je werkruimte.', failed: 'ASIO startte niet: ', built: 'Deze build heeft geen ASIO (alleen de testklok).',
      reported: 'driver meldt', ring: 'ring', gaps: 'haperingen', ms: 'ms', est: 'geschatte vertraging', reset: 'De driver vraagt om een reset: pas opnieuw toe.', test: 'Testklok (geen geluid)' },
  }[lang];

  let created = 0, live = null, cur = info;   // cur: the device as it is now (it can change while the page runs)   // live: the state of the ASIO route of the current context

  // ---------- 1. the route ----------
  if (info.ok) {
    const CAP = 16384;   // frames in shared memory
    const WORKLET = `class PKSink extends AudioWorkletProcessor {
      constructor(o) { super(); const p = o.processorOptions; this.h = new Int32Array(p.sab, 0, 4); this.d = new Float32Array(p.sab, 16); this.mask = p.cap - 1; }
      process(inputs, outputs) {
        const n = outputs[0][0].length, i0 = inputs[0] || [], L = i0[0], R = i0[1] || i0[0], d = this.d, mask = this.mask;
        const w = Atomics.load(this.h, 0);
        for (let i = 0; i < n; i++) { const k = ((w + i) & mask) * 2; d[k] = L ? L[i] : 0; d[k + 1] = R ? R[i] : 0; }
        Atomics.store(this.h, 0, (w + n) | 0); Atomics.notify(this.h, 0);
        return true;
      } }
      registerProcessor('pk-asio-sink', PKSink);`;
    const WORKER = `onmessage = e => {
      const { sab, cap, port } = e.data, h = new Int32Array(sab, 0, 4), d = new Float32Array(sab, 16), mask = cap - 1; let r = Atomics.load(h, 0);
      for (;;) {
        const w = Atomics.load(h, 0); let n = (w - r) | 0;
        if (n > cap - 256) { r = (w - 128) | 0; n = 128; }            // the worker fell far behind: skip ahead
        if (n >= 128) { const out = new Float32Array(n * 2); for (let i = 0; i < n; i++) { const k = ((r + i) & mask) * 2; out[2 * i] = d[k]; out[2 * i + 1] = d[k + 1]; }
          r = (r + n) | 0; port.postMessage(out); }  // a copy: a transfer of the buffer to the main process arrives empty
        else Atomics.wait(h, 0, w, 2);
      } };`;
    const blobUrl = src => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const origConnect = AudioNode.prototype.connect, origDisconnect = AudioNode.prototype.disconnect;
    // everything the host connects to the destination of the context goes to our tap instead
    AudioNode.prototype.connect = function (dest, ...rest) {
      const c = this.context;
      if (c && c.__pkTap && dest === c.destination) { origConnect.call(this, c.__pkTap, ...rest); return dest; }
      return origConnect.call(this, dest, ...rest);
    };
    AudioNode.prototype.disconnect = function (dest, ...rest) {
      const c = this.context;
      if (c && c.__pkTap && dest === c.destination) return origDisconnect.call(this, c.__pkTap, ...rest);
      return origDisconnect.call(this, dest, ...rest);
    };
    const Orig = window.AudioContext || window.webkitAudioContext;
    class PKContext extends Orig {
      constructor(opts) {
        // the sound card is played by the native part: this context has no output of its own and runs at the rate of the driver
        super(Object.assign({}, opts || {}, { sampleRate: info.sampleRate, sinkId: { type: 'none' } }));
        created++; const ctx = this;
        const tap = ctx.createGain(); Object.defineProperty(ctx, '__pkTap', { value: tap });
        const state = { ctx, ready: false, delayMs: null };
        live = state;
        // the host shows base + output latency; for this route that is the ring and the driver
        Object.defineProperty(ctx, 'baseLatency', { get: () => 128 / ctx.sampleRate });
        Object.defineProperty(ctx, 'outputLatency', { get: () => (state.delayMs == null ? 0.01 : Math.max(0, state.delayMs / 1000 - 128 / ctx.sampleRate)) });
        (async () => {
          try {
            await ctx.audioWorklet.addModule(blobUrl(WORKLET));
            const sab = new SharedArrayBuffer(16 + CAP * 2 * 4);
            const sink = new AudioWorkletNode(ctx, 'pk-asio-sink', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit', processorOptions: { sab, cap: CAP } });
            const mute = ctx.createGain(); mute.gain.value = 0;        // keeps the worklet in the graph; it makes no sound itself
            origConnect.call(tap, sink); origConnect.call(sink, mute); origConnect.call(mute, ctx.destination);
            const port = await new Promise(res => { const on = ev => { if (ev.data && ev.data.pkAsio === 'port') { window.removeEventListener('message', on); res(ev.ports[0]); } }; window.addEventListener('message', on); window.postMessage({ pkAsio: 'want' }, '*'); });
            const worker = new Worker(blobUrl(WORKER)); worker.postMessage({ sab, cap: CAP, port }, [port]);
            state.ready = true; state.sink = sink; state.worker = worker;
          } catch (e) { console.error('ASIO route failed', e); state.error = String(e); }
        })();
      }
    }
    window.AudioContext = PKContext; if (window.webkitAudioContext) window.webkitAudioContext = PKContext;
  }

  // ---------- 2. button and panel ----------
  window.__pkAsio = { info, get live() { return live; }, get created() { return created; } };
  const css = `.pkasio-b{position:fixed;left:12px;bottom:12px;z-index:60;font:12px/1.2 var(--mono,ui-monospace,monospace);background:var(--panel,#1b1e24);color:var(--text,#d8dde4);border:1px solid var(--line,#363b44);border-radius:14px;padding:6px 11px;cursor:pointer}
  .pkasio-b.on{border-color:var(--go,#5fe0a0)}.pkasio-b:hover{filter:brightness(1.15)}
  .pkasio-p{position:fixed;left:12px;bottom:46px;z-index:61;width:320px;max-width:calc(100vw - 24px);font:12px/1.4 var(--mono,ui-monospace,monospace);background:var(--panel,#1b1e24);color:var(--text,#d8dde4);border:1px solid var(--line,#363b44);border-radius:10px;padding:12px;box-shadow:0 8px 30px #0008}
  .pkasio-p h4{margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase}.pkasio-p label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}
  .pkasio-p select,.pkasio-p button{font:inherit;color:inherit;background:var(--bg,#12141a);border:1px solid var(--line,#363b44);border-radius:6px;padding:3px 6px}
  .pkasio-p select{max-width:190px}.pkasio-p .row{display:flex;gap:8px;margin-top:10px}.pkasio-p .note{opacity:.7;margin-top:8px}.pkasio-p .err{color:var(--stop,#ff7a7a);margin-top:6px}
  .pkasio-p .stat{margin-top:8px;opacity:.85;white-space:pre-line}`;
  const el = (tag, props, ...kids) => { const e = document.createElement(tag); Object.assign(e, props || {}); kids.forEach(k => e.append(k)); return e; };
  function build() {
    document.head.append(el('style', { textContent: css }));
    const btn = el('button', { className: 'pkasio-b', type: 'button', title: T.title }); document.body.append(btn);
    let panel = null, timer = null;
    const paint = async () => {
      let st = null; try { st = await N.stats(); } catch (e) {}
      if (cur.ok && st && st.stats) {
        const fs = st.stats.sampleRate || cur.sampleRate, delay = (st.stats.fill + (cur.outputLatency || 0)) / fs * 1000;
        if (live) live.delayMs = delay;
        btn.className = 'pkasio-b on'; btn.textContent = `${T.on} · ${cur.driver.replace(/ ASIO$/, '')} · ~${delay.toFixed(0)} ${T.ms}`;
        if (panel) panel.querySelector('.stat').textContent = `${T.reported}: ${((cur.outputLatency || 0) / fs * 1000).toFixed(1)} ${T.ms} · ${T.ring}: ${(st.stats.fill / fs * 1000).toFixed(1)} ${T.ms}\n${T.est}: ~${delay.toFixed(0)} ${T.ms} · ${T.gaps}: ${st.stats.underruns}${st.stats.resetRequested ? '\n' + T.reset : ''}`;
      } else { btn.className = 'pkasio-b'; btn.textContent = T.off; if (panel) panel.querySelector('.stat').textContent = ''; }
    };
    const open = async () => {
      const g = await N.getConfig(); if (!g) return; const cfg = g.cfg, drivers = (await N.list()).filter(d => !(d === 'Test clock (no sound)' && g.built && false));
      const sel = (opts, val) => { const s = el('select'); opts.forEach(([v, t]) => s.append(el('option', { value: String(v), textContent: t }))); s.value = String(val); return s; };
      const names = drivers.map(d => [d, d === 'Test clock (no sound)' ? T.test : d]);
      const use = el('input', { type: 'checkbox', checked: cfg.enabled });
      const drv = sel(names.length ? names : [['', T.none]], cfg.driver || (names.find(n => n[0] !== 'Test clock (no sound)') || names[0] || [''])[0]);
      const buf = sel([[0, T.auto], ...[32, 64, 128, 256, 512, 1024].map(v => [v, String(v)])], cfg.buffer);
      const pair = sel([0, 1, 2, 3, 4, 5, 6, 7].map(p => [p, `${2 * p + 1}–${2 * p + 2}`]), cfg.pair);
      const rate = sel([44100, 48000, 88200, 96000].map(r => [r, String(r)]), cfg.sampleRate);
      const mar = sel([2, 4, 6, 8, 12, 16, 24, 40].map(m => [m, m + ' ' + T.ms]), cfg.targetMs);
      const err = el('div', { className: 'err' }); if (!info.ok && info.error) err.textContent = T.failed + info.error; // (shown for the device of the start of the page) if (!g.built) err.textContent = T.built;
      const apply = el('button', { type: 'button', textContent: T.apply }), pbtn = el('button', { type: 'button', textContent: T.panel }), cls = el('button', { type: 'button', textContent: T.close });
      panel = el('div', { className: 'pkasio-p', role: 'dialog', 'aria-label': T.title }, el('h4', { textContent: T.title }),
        el('label', {}, el('span', { textContent: T.use }), use), el('label', {}, el('span', { textContent: T.driver }), drv),
        el('label', {}, el('span', { textContent: T.buffer }), buf), el('label', {}, el('span', { textContent: T.pair }), pair),
        el('label', {}, el('span', { textContent: T.rate }), rate), el('label', {}, el('span', { textContent: T.margin }), mar),
        el('div', { className: 'stat' }), err, el('div', { className: 'row' }, apply, pbtn, cls), el('div', { className: 'note', textContent: T.note }));
      document.body.append(panel);
      cls.onclick = () => { panel.remove(); panel = null; };
      pbtn.onclick = () => N.panel();
      apply.onclick = async () => {
        const r = await N.setConfig({ enabled: use.checked, driver: drv.value, buffer: +buf.value, pair: +pair.value, sampleRate: +rate.value, targetMs: +mar.value });
        if (r && !r.info.ok && use.checked) { err.textContent = T.failed + (r.info.error || r.info.reason); return; }
        // the context of the host was made for the old route: reload (the host asks first and keeps the workspace)
        const same = (!!(r && r.info.ok) === info.ok) && (!info.ok || (r.info.sampleRate === info.sampleRate));
        if (same && created) { cur = r.info; panel.remove(); panel = null; paint(); return; }
        const lat = document.getElementById('latHint');
        if (created && lat) lat.dispatchEvent(new Event('change')); else location.reload();
      };
      paint();
    };
    btn.onclick = () => { if (panel) { panel.remove(); panel = null; } else open(); };
    paint(); timer = setInterval(paint, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
