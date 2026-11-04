// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Recorder en nieuwe id nl.patchkamer.recorder (voorheen Opname, nl.patchkamer.opname);
//          presets en songs uit die tijd verwijzen naar de oude id. Tweetalig (host.lang, poortnamen per taal in i18n). Tekenen via host.frame
//          met een terugval (de tekenpoort-omzetting is weg). setState negeert onbekende velden en geeft ongeldige waarden de standaard
//          (de standaardnaam is nu Recording); opnemen en doorvoer zijn ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// 1.0.0 — Eerste versie (als Opname).
// Recorder: neemt op wat er binnenkomt (bijvoorbeeld de mix) en laat het ongewijzigd doorlopen naar de uitgang.
// Takes blijven deze sessie in het geheugen; met "Bewaar" krijg je een audiobestand (webm/opus of mp4).
// Bewaren gaat via host.saveFile als de host dat biedt, anders via een gewone download.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { name: 'Naam van de opname', rec: '● Opnemen', stop: '■ Stop', withT: 'Opnemen met Start/Stop van de klok', play: 'beluister', save: 'Bewaar', take: 'Take',
    none: 'Nog geen takes. Takes blijven tot je de pagina sluit; bewaar wat je wilt houden.', unsupported: 'Opnemen wordt niet ondersteund in deze browser.',
    failed: m => 'Opnemen lukt niet in deze browser: ' + m, declined: 'Niet bewaard.', saved: f => 'Bewaard: ' + f, saveFailed: m => 'Bewaren mislukt: ' + m, locale: 'nl-NL' },
  en: { name: 'Recording name', rec: '● Record', stop: '■ Stop', withT: 'Record with Start/Stop of the clock', play: 'listen', save: 'Save', take: 'Take',
    none: 'No takes yet. Takes stay until you close the page; save what you want to keep.', unsupported: 'Recording is not supported in this browser.',
    failed: m => 'Recording does not work in this browser: ' + m, declined: 'Not saved.', saved: f => 'Saved: ' + f, saveFailed: m => 'Saving failed: ' + m, locale: 'en-GB' },
};
const fmtT = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id: 'nl.patchkamer.recorder',
  name: 'Recorder',
  version: '1.11.0',
  kind: 'utility',
  category: 'tool',
  ui: { width: 340, minWidth: 260 },
  i18n: { en: { ports: { in: 'In', out: 'Through' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Door' }], eventIn: [], eventOut: [] },

  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const inG = ctx.createGain(), out = ctx.createGain(), an = ctx.createAnalyser(); an.fftSize = 1024;
    inG.connect(out); inG.connect(an);
    const dest = typeof ctx.createMediaStreamDestination === 'function' ? ctx.createMediaStreamDestination() : null; if (dest) inG.connect(dest);
    const canRec = !!(dest && typeof MediaRecorder !== 'undefined');
    const mime = canRec ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '' : '';
    const ext = /mp4/.test(mime) ? 'mp4' : 'webm';
    const DEF = () => ({ name: 'Recording', withTransport: false });
    const state = DEF();
    let rec = null, chunks = [], t0 = 0, takes = [], el = null, f = {}, stopDraw = null, dead = false, n = 0, lastW = '', lastT = '';
    const data = new Uint8Array(512);
    function start() {
      if (!canRec || rec) return; chunks = [];
      try { rec = new MediaRecorder(dest.stream, mime ? { mimeType: mime, audioBitsPerSecond: 256000 } : undefined); } catch (e) { rec = null; msg(T.failed(e.message)); return; }
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => { const dur = (performance.now() - t0) / 1000; const blob = new Blob(chunks, { type: rec && rec.mimeType || mime || 'audio/webm' }); rec = null;
        if (blob.size) { n++; takes.unshift({ n, dur, blob, at: new Date() }); } paint(); };
      t0 = performance.now(); rec.start(500); paint();
    }
    function stop() { if (rec && rec.state !== 'inactive') rec.stop(); }
    async function keep(tk) {
      const base = (state.name || 'Recording').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'Recording';
      const filename = `${base} take ${tk.n}.${ext}`;
      try {
        if (host && typeof host.saveFile === 'function') { const r = await host.saveFile(filename, tk.blob); msg(r === 'declined' ? T.declined : T.saved(filename)); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(tk.blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); msg(T.saved(filename));
      } catch (e) { msg(T.saveFailed(e.message)); }
    }
    const E = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    function msg(t) { if (f.msg) f.msg.textContent = t; }
    function paint() {
      if (!el) return; const on = !!rec;
      f.btn.textContent = on ? T.stop : T.rec; f.btn.style.background = on ? 'var(--stop,#e4574a)' : ''; f.btn.style.color = on ? '#140707' : ''; f.btn.disabled = !canRec;
      f.list.innerHTML = '';
      if (!takes.length) f.list.appendChild(E('div', 'font-size:11px;color:var(--muted)', canRec ? T.none : T.unsupported));
      takes.forEach(tk => { const row = E('div', 'display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center;border:1px solid var(--line);border-radius:3px;padding:4px 6px;background:var(--card-2)');
        row.appendChild(E('span', 'font-size:12px', `${T.take} ${tk.n} · ${fmtT(tk.dur)} · ${tk.at.toLocaleTimeString(T.locale, { hour: '2-digit', minute: '2-digit' })}`));
        const pl = E('button', 'font-size:10px;padding:2px 6px', '▶'); pl.title = T.play; pl.onclick = () => { const a = new Audio(URL.createObjectURL(tk.blob)); a.play().catch(() => {}); };
        const sv = E('button', 'font-size:10px;padding:2px 6px', T.save); sv.onclick = () => keep(tk);
        row.append(pl, sv); f.list.appendChild(row); });
    }
    function loop() {
      if (dead || !el) return;
      an.getByteTimeDomainData(data); let pk = 0; for (let i = 0; i < data.length; i++) pk = Math.max(pk, Math.abs(data[i] - 128) / 128);
      const w = Math.round(Math.min(1, pk) * 100) + '%'; if (w !== lastW) { lastW = w; f.bar.style.width = w; f.bar.style.background = pk > 0.98 ? 'var(--stop,#e4574a)' : 'var(--audio)'; }
      const tt = rec ? fmtT((performance.now() - t0) / 1000) : '00:00'; if (tt !== lastT) { lastT = tt; f.time.textContent = tt; }
    }
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    const self = {
      inputs: { in: inG }, outputs: { out },
      mount(root) {
        el = E('div', 'display:grid;gap:8px'); root.appendChild(el); lastW = ''; lastT = '';
        const nm = E('label', 'display:grid;gap:2px'); nm.appendChild(E('span', 'font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)', T.name));
        f.name = E('input', 'background:var(--card-2);color:var(--fg);border:1px solid var(--line);border-radius:3px;font-family:var(--mono);font-size:12px;padding:5px 7px;min-width:0'); f.name.value = state.name; f.name.oninput = () => { state.name = f.name.value.slice(0, 80); }; nm.appendChild(f.name); el.appendChild(nm);
        const row = E('div', 'display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center');
        f.btn = E('button', 'font-size:13px;padding:6px 12px;min-width:110px'); f.btn.onclick = () => (rec ? stop() : start());
        const meter = E('div', 'height:8px;background:var(--line);border-radius:4px;overflow:hidden'); f.bar = E('i', 'display:block;height:100%;width:0;background:var(--audio)'); meter.appendChild(f.bar);
        f.time = E('span', 'font-family:var(--mono);font-size:14px;font-variant-numeric:tabular-nums', '00:00');
        row.append(f.btn, meter, f.time); el.appendChild(row);
        const tr = E('label', 'display:flex;gap:6px;align-items:center;font-size:11px;color:var(--muted);cursor:pointer'); const cb = E('input'); cb.type = 'checkbox'; cb.checked = state.withTransport; cb.onchange = () => { state.withTransport = cb.checked; }; f.wt = cb;
        tr.append(cb, document.createTextNode(T.withT)); el.appendChild(tr);
        f.list = E('div', 'display:grid;gap:4px'); el.appendChild(f.list);
        f.msg = E('div', 'font-size:10px;color:var(--muted)'); el.appendChild(f.msg);
        paint(); stopLoop(); stopDraw = tekenLus(host, self, loop, 30);
      },
      unmount() { stopLoop(); el = null; f = {}; },
      onTransport({ playing }) { if (!state.withTransport) return; if (playing) start(); else stop(); },
      getState() { return { name: state.name, withTransport: state.withTransport }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {}; const d = DEF();
        state.name = typeof s.name === 'string' ? s.name.slice(0, 80) : d.name; state.withTransport = typeof s.withTransport === 'boolean' ? s.withTransport : d.withTransport;
        if (f.name) { f.name.value = state.name; f.wt.checked = state.withTransport; }
      },
      destroy() { if (dead) return; dead = true; stopLoop(); stop(); try { inG.disconnect(); out.disconnect(); } catch (e) {} },
    };
    return self;
  },
};
