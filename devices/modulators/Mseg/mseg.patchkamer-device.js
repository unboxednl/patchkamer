// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.12.0 — Uitleg naar about (menu Over Multi-Segment Envelope); de UI toont geen uitlegtekst meer.
// 1.11.1 — Zelf bestuurbaar (contract §8): params() + modulate() voor Sterkte (standaard uit); de knop en getState blijven ongewijzigd, modulatie is nooit state en komt alleen bovenop de knop. Geen lus: modulate() roept zelf geen host.modulate aan.
//          Bewust weggelaten: Lengte en Afspelen (keuzes), op raster (vinkje), de curvepunten (patroondata). Zonder modulatie gelijk aan 1.11.0.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Multi-Segment Envelope (de id nl.patchkamer.mseg blijft). Tweetalig (host.lang, poortnamen per taal in i18n).
//          Tekenen via host.frame met een ResizeObserver en een kleurcache; de kleuren komen uit de host. De curve, de klok en elke uitvoer zijn tegen NaN en Infinity beschermd
//          (een ongeldig tempo, tijdstip of punt kan de sturing niet meer vergiftigen); de uitgestuurde waarden zijn bit-identiek aan 1.8.0.
//          setState negeert onbekende velden, valt bij ongeldige waarden terug op de standaard en kapt getallen af op hun bereik.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// Multi-Segment Envelope: een zelf getekende curve over 1 tot 64 maten, herhalend of één keer vanaf Start/Trigger.
// Voorbeelden: Opbouw, Golf, Trap, Ademen, Break. De curve loopt van −1 tot +1; per doelparameter kies je de diepte (zoals bij een LFO).
// ---------- Modkit: gedeelde code van de modulatoren — elke module bevat een eigen kopie ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fin = v => typeof v === 'number' && Number.isFinite(v);

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, Engels staat hieronder; onbekende taal = Engels
const EN = {
  'Curve': 'Curve',
  'Lengte': 'Length', '{0} maat': '{0} bar', '{0} maten': '{0} bars',
  'Afspelen': 'Playback', 'herhalen': 'loop', 'één keer': 'once',
  'Sterkte': 'Strength', 'Curve': 'Curve', 'Voorbeeld': 'Example', 'kies…': 'choose…',
  'Opbouw': 'Build-up', 'Golf': 'Wave', 'Trap': 'Steps', 'Ademen': 'Breathing', 'Break': 'Break', 'Plat': 'Flat',
  'op raster (1/16)': 'snap to grid (1/16)',
  'maat {0} van {1}': 'bar {0} of {1}', 'wacht op start': 'waiting for start',
  'Toewijzing · diepte als deel van het bereik van elke knop': 'Assignment · depth as a share of each knob\'s range',
  'Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Curve</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.':
    'Nothing connected yet. Pull a <b>purple cable</b> from the output <b>Curve</b> to the <b>Mod</b> input of a device. Then choose here which parameters move along and by how much.',
  'zoek parameter': 'search parameter', 'alleen actief': 'active only',
  '{0} van {1} toegewezen': '{0} of {1} assigned', '{0} parameters': '{0} parameters', '{0} actief': '{0} active',
  'snel stuurbaar': 'fast control', 'bron voor {0}': 'source for {0}', 'diepte {0}': 'depth {0}',
  'diepte: deel van het bereik van de knop (dubbelklik = 0)': 'depth: share of the knob range (double-click = 0)',
  'snelle sturing: sample-nauwkeurig': 'fast control: sample-accurate',
};

const CSS = `
:host{all:initial;display:block;container-type:inline-size;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:var(--fg,#e6e9ee)}
*{box-sizing:border-box}
.mk{display:grid;gap:10px;min-width:0}
.box{padding:8px 10px;border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,#161a20);display:grid;gap:8px;min-width:0}
.row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:end}
.ctl{display:grid;gap:2px;min-width:110px;flex:1 1 120px}
.ctl label,.lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a3);display:flex;justify-content:space-between;gap:6px}
.ctl output{color:var(--mod,#b48cff);letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums}
select,input[type=search]{font:inherit;font-size:11px;color:var(--field-fg,var(--fg,#e6e9ee));background:var(--field,var(--card,#1c2128));border:1px solid var(--line,#2a303a);border-radius:4px;padding:4px 8px}
input[type=range]{width:100%;margin:0;accent-color:var(--mod,#b48cff);height:16px;min-width:0}
.ctl select{width:100%;min-width:0}
input[type=checkbox]{accent-color:var(--mod,#b48cff);margin:0}
canvas{display:block;width:100%;background:var(--well,var(--card-2,#0d1014));border:1px solid var(--line,#2a303a);border-radius:4px}
.empty{border:1px dashed var(--line,#2a303a);border-radius:5px;padding:12px;color:var(--muted,#8a93a3);line-height:1.5}
.empty b{color:var(--mod,#b48cff);font-weight:500}
.asg{display:grid;gap:8px}
.asgbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.asgbar input[type=search]{flex:1 1 160px;min-width:0}
.tg h3{margin:0 0 4px;font-family:var(--disp,sans-serif);font-size:14px;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:8px;align-items:baseline}
.tg h3 small{font-family:var(--mono,monospace);font-size:10px;letter-spacing:0;text-transform:none;color:var(--muted,#8a93a3)}
details.lane{border:1px solid var(--line,#2a303a);border-radius:4px;background:var(--card-2,#161a20);padding:4px 8px}
details.lane>summary{cursor:pointer;font-family:var(--disp,sans-serif);font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:3px 0}
details.lane>summary small{font-family:var(--mono,monospace);letter-spacing:0;text-transform:none;color:var(--mod,#b48cff);margin-left:6px}
.prow{display:grid;grid-template-columns:minmax(80px,1fr) auto minmax(90px,1.6fr) 48px 14px;gap:8px;align-items:center;min-height:24px}
.prow .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prow output{font-variant-numeric:tabular-nums;text-align:right;font-size:11px;color:var(--muted,#8a93a3)}
.prow.on .nm{color:var(--fg,#e6e9ee);font-weight:500} .prow.on output{color:var(--mod,#b48cff)} .prow:not(.on) .nm{color:var(--muted,#8a93a3)}
.prow .fast{font-size:9px;color:var(--audio,#4fd1c5)} .prow select{padding:2px 4px}
@container (max-width:520px){ .prow{grid-template-columns:minmax(70px,1fr) minmax(80px,1.4fr) 44px 12px} .prow select{grid-column:1/-1} }
`;
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function mkSlider(parent, label, min, max, step, val, fmt, onin) {
  const w = h('div', 'ctl'), l = h('label'), o = h('output'), i = h('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.setAttribute('aria-label', label);
  l.append(document.createTextNode(label), o); o.textContent = fmt(+val); i.oninput = () => { onin(+i.value); o.textContent = fmt(+i.value); };
  w.append(l, i); parent.appendChild(w); return { el: w, i, o, set(v) { i.value = v; o.textContent = fmt(+v); } };
}
function mkSelect(parent, label, opts, val, onch) {
  const w = h('div', 'ctl'), l = h('label', '', label), s = h('select'); s.setAttribute('aria-label', label);
  opts.forEach(([v, t]) => { const o = h('option', '', t); o.value = v; s.appendChild(o); }); s.value = val; s.onchange = () => onch(s.value);
  w.append(l, s); parent.appendChild(w); return { el: w, s, set(v) { s.value = v; } };
}
// tempo: houdt bij welke tel het is, ook als de klok stilstaat (dan loopt hij door op het ingestelde tempo)
function mkClock(ctx, host) {
  const c = { t: 0, b: 0, bpm: 120, running: false };
  const okBpm = v => fin(v) && v > 0;
  return {
    step(info) {
      if (!info || typeof info !== 'object') return; const { step, bar, time, bpm } = info;
      if (okBpm(bpm)) c.bpm = bpm;
      if (fin(step) && fin(bar) && fin(time) && step % 4 === 0) { c.t = time; c.b = bar * 4 + step / 4; }
      c.running = true;
    },
    transport(p) { const t = ctx.currentTime, b = this.beatsAt(t); c.t = t; c.b = b; c.running = !!p; },
    beatsAt(t) { const b = c.b + (t - c.t) * this.bpm() / 60; return fin(b) ? b : 0; },
    bpm() { if (c.running) return c.bpm; const hb = host && +host.bpm; return okBpm(hb) ? hb : c.bpm; },
    get running() { return c.running; },
  };
}
// toewijzing: welke parameters van welk doel deze modulator stuurt, met diepte (−100..100% van het bereik)
function mkAssign(ctx, host, selfRef, opt) {
  const tx = opt.tx, me = () => (typeof selfRef === 'function' ? selfRef() : selfRef);
  // opt: { sources:[[id,naam]], valueAt(src, t) -> −1..1, signal(src) -> AudioNode|null, title, tx }
  const A = { targets: [], sel: {}, fastNodes: new Map(), filter: '', onlyOn: false, box: null, rows: [] };
  const key = (tid, pid) => tid + '|' + pid;
  const get = (tid, pid) => (A.sel[tid] && A.sel[tid][pid]) || null;
  function set(tid, pid, v) { const t = A.sel[tid] || (A.sel[tid] = {}); if (!v || (!v.d && !v.keep)) delete t[pid]; else t[pid] = { d: v.d, s: v.s }; if (!Object.keys(t).length) delete A.sel[tid]; }
  function rewire() {   // snelle route: een GainNode per toewijzing, gevoed door het bronsignaal
    const want = new Set();
    A.targets.forEach(T => T.params.forEach(p => { const s = get(T.id, p.id); if (!s || !s.d || !p.fast) return; const src = opt.signal(s.s || opt.sources[0][0]); if (!src) return;
      const k = key(T.id, p.id); want.add(k); let f = A.fastNodes.get(k);
      if (!f || f.src !== src) { if (f) { host.modSignal && host.modSignal(me(), T.id, p.id, null); try { f.src.disconnect(f.g); } catch (e) {} try { f.g.disconnect(); } catch (e) {} } const g = ctx.createGain(); src.connect(g); f = { g, src, ok: false }; A.fastNodes.set(k, f); }
      f.g.gain.setTargetAtTime(s.d, ctx.currentTime, 0.02); f.ok = !!(host.modSignal && host.modSignal(me(), T.id, p.id, f.g)); }));
    [...A.fastNodes.entries()].forEach(([k, f]) => { if (want.has(k)) return; const [tid, pid] = k.split('|'); host.modSignal && host.modSignal(me(), tid, pid, null); try { f.src.disconnect(f.g); } catch (e) {} try { f.g.disconnect(); } catch (e) {} A.fastNodes.delete(k); });
  }
  function tick(t) {   // trage route: 30× per seconde voor alles wat niet snel verbonden is
    A.targets.forEach(T => { const o = {}; T.params.forEach(p => { const s = get(T.id, p.id); if (!s || !s.d) return; const f = A.fastNodes.get(key(T.id, p.id)); if (f && f.ok) return;
      const v = opt.valueAt(s.s || opt.sources[0][0], t) * s.d; o[p.id] = fin(v) ? clamp(v, -1, 1) : 0; }); host.modulate(me(), T.id, o); });
  }
  function count(T) { return T.params.filter(p => { const s = get(T.id, p.id); return s && s.d; }).length; }
  function paint() {
    const box = A.box; if (!box) return; box.innerHTML = ''; A.rows = [];
    const real = A.targets.filter(T => T.params.length);
    if (!real.length) { const e = h('div', 'empty'); e.innerHTML = tx('Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Curve</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.'); box.appendChild(e); return; }
    const bar = h('div', 'asgbar'), q = h('input'); q.type = 'search'; q.placeholder = tx('zoek parameter'); q.value = A.filter; q.setAttribute('aria-label', tx('zoek parameter'));
    q.oninput = () => { A.filter = q.value.toLowerCase(); applyFilter(); };
    const lo = h('label', 'lab'), cb = h('input'); cb.type = 'checkbox'; cb.checked = A.onlyOn; cb.onchange = () => { A.onlyOn = cb.checked; applyFilter(); }; lo.append(cb, document.createTextNode(tx('alleen actief')));
    bar.append(q, lo); box.appendChild(bar);
    real.forEach(T => {
      const sec = h('section', 'tg'), hd = h('h3', '', '→ ' + T.name), sm = h('small'); hd.appendChild(sm); sec.appendChild(hd);
      const cnt = () => { const n = count(T); sm.textContent = n ? tx('{0} van {1} toegewezen', n, T.params.length) : tx('{0} parameters', T.params.length); }; cnt();
      const lanes = new Map(); T.params.forEach(p => { const k = p.lane || '-'; if (!lanes.has(k)) lanes.set(k, { name: p.laneName || p.lane || 'Parameters', ps: [] }); lanes.get(k).ps.push(p); });
      lanes.forEach(L => {
        const d = h('details', 'lane'), su = h('summary', '', L.name), ls = h('small'); su.appendChild(ls); d.appendChild(su);
        const lcnt = () => { const n = L.ps.filter(p => { const s = get(T.id, p.id); return s && s.d; }).length; ls.textContent = n ? tx('{0} actief', n) : ''; return n; };
        d.open = lanes.size <= 3 || lcnt() > 0; lcnt();
        L.ps.forEach(p => {
          const s0 = get(T.id, p.id) || { d: 0, s: opt.sources[0][0] };
          const r = h('div', 'prow' + (s0.d ? ' on' : '')), nm = h('span', 'nm', p.name), out = h('output'), rg = h('input'), fl = h('span', 'fast');
          nm.title = `${p.name} · ${p.min}…${p.max}${p.scale === 'log' ? ' (log)' : ''}${p.fast ? ' · ' + tx('snel stuurbaar') : ''}`;
          let srcSel = h('span');
          if (opt.sources.length > 1) { srcSel = h('select'); opt.sources.forEach(([v, t]) => { const o = h('option', '', t); o.value = v; srcSel.appendChild(o); }); srcSel.value = s0.s || opt.sources[0][0]; srcSel.setAttribute('aria-label', tx('bron voor {0}', p.name));
            srcSel.onchange = () => { const s = get(T.id, p.id) || { d: 0 }; s.s = srcSel.value; set(T.id, p.id, { ...s, keep: true }); rewire(); }; }
          rg.type = 'range'; rg.min = -1; rg.max = 1; rg.step = 0.01; rg.value = s0.d; rg.setAttribute('aria-label', tx('diepte {0}', p.name)); rg.title = tx('diepte: deel van het bereik van de knop (dubbelklik = 0)');
          const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.round(Math.abs(v) * 100) + '%'; out.textContent = fmt(s0.d);
          const upd = v => { const s = get(T.id, p.id) || { s: srcSel.value || opt.sources[0][0] }; s.d = v; if (!s.s) s.s = opt.sources[0][0]; set(T.id, p.id, s); r.classList.toggle('on', !!v); out.textContent = fmt(v); cnt(); lcnt(); rewire(); };
          rg.oninput = () => upd(Math.abs(+rg.value) < 0.015 ? 0 : +rg.value); rg.ondblclick = () => { rg.value = 0; upd(0); };
          fl.textContent = p.fast ? '⚡' : ''; fl.title = p.fast ? tx('snelle sturing: sample-nauwkeurig') : '';
          r.append(nm, srcSel, rg, out, fl); d.appendChild(r); A.rows.push({ r, p, T, lane: d });
        });
        sec.appendChild(d);
      });
      box.appendChild(sec);
    });
    applyFilter();
  }
  function applyFilter() { A.rows.forEach(x => { const s = get(x.T.id, x.p.id); const hit = (!A.filter || (x.p.name + ' ' + (x.p.laneName || '')).toLowerCase().includes(A.filter)) && (!A.onlyOn || (s && s.d)); x.r.style.display = hit ? '' : 'none'; if (A.filter && hit) x.lane.open = true; }); }
  return {
    mount(box) { A.box = box; paint(); },
    unmount() { A.box = null; A.rows = []; },
    setTargets(list) { const ids = new Set((list || []).filter(Boolean).map(T => T.id)); A.targets.forEach(T => { if (!ids.has(T.id)) host.modulate(me(), T.id, {}); }); A.targets = (list || []).filter(T => T && Array.isArray(T.params)).map(T => ({ id: T.id, name: T.name, params: T.params })); rewire(); paint(); },
    tick, rewire,
    getState() { return JSON.parse(JSON.stringify(A.sel)); },
    setState(s) { A.sel = {}; if (s && typeof s === 'object') Object.entries(s).forEach(([tid, ps]) => { if (!ps || typeof ps !== 'object') return; Object.entries(ps).forEach(([pid, x]) => { if (x && typeof x.d === 'number' && isFinite(x.d)) set(tid, pid, { d: clamp(x.d, -1, 1), s: opt.sources.some(src => src[0] === x.s) ? x.s : opt.sources[0][0], keep: true }); }); }); rewire(); paint(); },
    destroy() { [...A.fastNodes.entries()].forEach(([k, f]) => { const [tid, pid] = k.split('|'); try { host.modSignal && host.modSignal(me(), tid, pid, null); } catch (e) {} try { f.src.disconnect(f.g); } catch (e) {} try { f.g.disconnect(); } catch (e) {} }); A.fastNodes.clear(); A.targets.forEach(T => host.modulate(me(), T.id, {})); A.targets = []; },
  };
}
// bronsignaal voor de snelle route: een ConstantSource waarop we stukjes curve vooruit plannen
function mkSignal(ctx, valueAt) {
  if (typeof ctx.createConstantSource !== 'function') return null;
  const cs = ctx.createConstantSource(); cs.offset.value = 0; try { cs.start(); } catch (e) {}
  let end = 0, last = 0;
  return {
    node: cs,
    plan() {   // vul de curve tot ~150 ms vooruit (langer als de pagina op de achtergrond trager tikt)
      const now = ctx.currentTime, gap = last ? now - last : 0.03; last = now;
      const ahead = Math.min(1.5, Math.max(0.15, gap * 2.5)); let start = Math.max(end + 1 / (ctx.sampleRate || 48000), now + 0.01);
      const until = now + ahead; if (until - start < 0.01) return;
      const n = Math.max(2, Math.ceil((until - start) * 400)), c = new Float32Array(n);
      for (let i = 0; i < n; i++) c[i] = valueAt(start + (i / (n - 1)) * (until - start));
      try { cs.offset.setValueCurveAtTime(c, start, until - start); end = until; } catch (e) { end = 0; }
    },
    reset() { try { cs.offset.cancelScheduledValues(ctx.currentTime); } catch (e) {} end = 0; },
    stop() { try { cs.stop(); } catch (e) {} try { cs.disconnect(); } catch (e) {} },
  };
}
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

// ---------- Multi-Segment Envelope: zelf getekende curve over maten ----------
const LENS = [1, 2, 4, 8, 16, 32, 64];
const MAXPTS = 256;
const EXAMPLES = {
  'Opbouw': [{ x: 0, y: -1, c: 0 }, { x: 0.85, y: 0.8, c: 0.5 }, { x: 0.95, y: 1, c: 0 }, { x: 1, y: -1, c: 0 }],
  'Golf': [{ x: 0, y: 0, c: 0.4 }, { x: 0.25, y: 1, c: -0.4 }, { x: 0.5, y: 0, c: 0.4 }, { x: 0.75, y: -1, c: -0.4 }, { x: 1, y: 0, c: 0 }],
  'Trap': [{ x: 0, y: -1, c: 0 }, { x: 0.25, y: -1, c: 0 }, { x: 0.2501, y: -0.33, c: 0 }, { x: 0.5, y: -0.33, c: 0 }, { x: 0.5001, y: 0.33, c: 0 }, { x: 0.75, y: 0.33, c: 0 }, { x: 0.7501, y: 1, c: 0 }, { x: 1, y: 1, c: 0 }],
  'Ademen': [{ x: 0, y: -0.6, c: 0.6 }, { x: 0.4, y: 0.7, c: -0.3 }, { x: 0.55, y: 0.6, c: 0.5 }, { x: 1, y: -0.6, c: 0 }],
  'Break': [{ x: 0, y: 0, c: 0 }, { x: 0.7, y: 0, c: 0 }, { x: 0.75, y: -1, c: 0.6 }, { x: 0.97, y: 0.6, c: 0 }, { x: 1, y: 0, c: 0 }],
  'Plat': [{ x: 0, y: 0, c: 0 }, { x: 1, y: 0, c: 0 }],
};
const DEF = () => ({ pts: EXAMPLES['Opbouw'].map(p => ({ ...p })), len: 16, mode: 'loop', snap: true, amp: 1 });
function segShape(t, c) { if (Math.abs(c) < 0.01) return t; const k = c * 6; return (Math.exp(k * t) - 1) / (Math.exp(k) - 1); }

export default {
  id: 'nl.patchkamer.mseg',
  name: 'Multi-Segment Envelope',
  about: { nl: 'Teken een curve over 1 tot 64 maten: klik om een punt te maken, sleep om te verplaatsen, dubbelklik om weg te halen, Shift + slepen op een stuk lijn om het te krommen. Zo bouw je een opbouw of break over het hele nummer. Bij één keer start de curve met Start of een trigger.', en: 'Draw a curve over 1 to 64 bars: click to add a point, drag to move it, double-click to remove it, Shift + drag on a piece of line to bend it. This is how you build a build-up or a break across the whole song. With once, the curve starts on Start or a trigger.' },
  version: '1.12.0',
  kind: 'modulator',
  category: 'mod',
  ui: { width: 760, minWidth: 380 },
  i18n: { en: { ports: { trig: 'Trigger', mod: 'Curve' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'trig', name: 'Trigger' }], eventOut: [], modIn: [], modOut: [{ id: 'mod', name: 'Curve' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const S = DEF(); let self, dead = false, ui = null, stopDraw = null, startB = 0, started = false;
    let cw = 0, ch = 0, ro = null, col = null, colT = 0, lastPos = '';
    const clock = mkClock(ctx, host);
    function curveAt(x) {   // x in 0..1
      const P = S.pts; if (x <= P[0].x) return P[0].y; for (let i = 1; i < P.length; i++) { if (x <= P[i].x) { const a = P[i - 1], b = P[i], w = b.x - a.x; const t = w > 0 ? (x - a.x) / w : 1; return a.y + (b.y - a.y) * segShape(t, a.c); } }
      return P[P.length - 1].y;
    }
    function posAt(t) { const beats = S.len * 4, b = clock.beatsAt(t);
      if (S.mode === 'loop') { const x = (b / beats) % 1; return x < 0 ? x + 1 : x; }
      if (!started) return 0; return clamp((b - startB) / beats, 0, 1); }
    const valueAt = t => { const v = clamp(curveAt(posAt(t)) * AMP(), -1, 1); return fin(v) ? v : 0; };
    const sig = mkSignal(ctx, valueAt);
    const asg = mkAssign(ctx, host, () => self, { sources: [['mseg', tx('Curve')]], valueAt: (s, t) => valueAt(t), signal: () => sig && sig.node, title: 'Curve', tx });
    const timer = setInterval(() => { if (dead) return; if (sig) sig.plan(); asg.tick(ctx.currentTime); }, 33);
    const mod = {}; const AMP = () => { const o = mod.amp; return o ? clamp(S.amp + o, 0, 1) : S.amp; };   // effectieve waarde = knop + o × bereik (0..1), geclampt
    const changed = () => { if (sig) sig.reset(); };
    const restart = t => { startB = clock.beatsAt(t); started = true; changed(); };

    // ---------- editor ----------
    let drag = null;
    const toXY = e => { const r = ui.cv.getBoundingClientRect(); if (!(r.width > 0 && r.height > 16)) return null; let x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp(1 - 2 * (e.clientY - r.top - 8) / (r.height - 16), -1, 1);
      if (S.snap) { const g = 1 / (S.len * 4 * 4); x = Math.round(x / g) * g; y = Math.round(y * 8) / 8; } return { x, y }; };
    const hit = e => { const r = ui.cv.getBoundingClientRect(); let best = -1, bd = 12; S.pts.forEach((p, i) => { const px = r.left + p.x * r.width, py = r.top + 8 + (1 - (p.y + 1) / 2) * (r.height - 16); const d = Math.hypot(px - e.clientX, py - e.clientY); if (d < bd) { bd = d; best = i; } }); return best; };
    const segAt = x => { for (let i = 1; i < S.pts.length; i++) if (x <= S.pts[i].x) return i - 1; return S.pts.length - 2; };
    function onDown(e) { e.preventDefault(); ui.cv.setPointerCapture(e.pointerId); const i = hit(e);
      if (i >= 0) { drag = { i, mode: 'pt' }; return; }
      const xy = toXY(e); if (!xy) return; const { x, y } = xy;
      if (e.shiftKey || e.altKey) { drag = { i: segAt(x), mode: 'curve', y0: e.clientY, c0: S.pts[segAt(x)].c }; return; }
      if (S.pts.length >= MAXPTS) return;
      const j = segAt(x) + 1; S.pts.splice(j, 0, { x, y, c: 0 }); drag = { i: j, mode: 'pt' }; changed(); }
    function onMove(e) { if (!drag) return; if (drag.mode === 'curve') { S.pts[drag.i].c = clamp(drag.c0 + (drag.y0 - e.clientY) / 80, -1, 1); changed(); return; }
      const xy = toXY(e); if (!xy) return; const i = drag.i, p = S.pts[i], { x, y } = xy, last = S.pts.length - 1;
      p.y = y; if (i > 0 && i < last) p.x = clamp(x, S.pts[i - 1].x, S.pts[i + 1].x); changed(); }
    function onUp() { drag = null; }
    function onDbl(e) { const i = hit(e); if (i > 0 && i < S.pts.length - 1) { S.pts.splice(i, 1); changed(); } }
    const onSkin = () => { col = null; };
    function readColors() { const cs = getComputedStyle(ui.cv); colT = performance.now(); const g = (n, d) => cs.getPropertyValue(n).trim() || d; col = { mod: g('--mod', '#b48cff'), fg: g('--fg', '#e6e9ee'), muted: g('--muted', '#8a93a3'), audio: g('--audio', '#4fd1c5') }; }
    function draw() {
      if (dead || !ui) return; const cv = ui.cv, w = cw, hh = ch; if (!w || !hh) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      const g = ui.g; if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, hh); const yOf = v => 8 + (1 - (v + 1) / 2) * (hh - 16);
      const bars = S.len; g.lineWidth = 1; g.strokeStyle = col.muted;
      for (let b = 0; b <= bars; b++) { const x = (b / bars) * w; g.globalAlpha = b % 4 === 0 ? 0.35 : 0.12; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hh); g.stroke(); }
      g.globalAlpha = 0.25; g.beginPath(); g.moveTo(0, yOf(0)); g.lineTo(w, yOf(0)); g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = col.mod; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= w; i += 1) { const v = curveAt(i / w); i ? g.lineTo(i, yOf(v)) : g.moveTo(i, yOf(v)); } g.stroke();
      S.pts.forEach((p, i) => { g.fillStyle = i === 0 || i === S.pts.length - 1 ? col.muted : col.fg; g.beginPath(); g.arc(p.x * w, yOf(p.y), 4.5, 0, 6.2832); g.fill(); });
      const now = ctx.currentTime, x = posAt(now) * w; g.strokeStyle = col.audio; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hh); g.stroke();
      const v = valueAt(now); g.fillStyle = col.audio; g.beginPath(); g.arc(x, yOf(v / (AMP() || 1)), 4, 0, 6.2832); g.fill();
      const b = clock.beatsAt(now);
      const txt = S.mode === 'loop' ? tx('maat {0} van {1}', Math.floor(((b / 4) % S.len + S.len) % S.len) + 1, S.len) : (started ? tx('maat {0} van {1}', Math.min(S.len, Math.floor((b - startB) / 4) + 1), S.len) : tx('wacht op start'));
      if (txt !== lastPos) { lastPos = txt; ui.pos.textContent = txt; }
    }
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    function build(root) {
      const mk = h('div', 'mk'); root.appendChild(mk); ui = {};
            const b1 = h('div', 'box'), r1 = h('div', 'row'); b1.appendChild(r1); mk.appendChild(b1);
      ui.len = mkSelect(r1, tx('Lengte'), LENS.map(n => [String(n), tx(n === 1 ? '{0} maat' : '{0} maten', n)]), String(S.len), v => { S.len = +v; changed(); });
      ui.mode = mkSelect(r1, tx('Afspelen'), [['loop', tx('herhalen')], ['once', tx('één keer')]], S.mode, v => { S.mode = v; changed(); });
      ui.amp = mkSlider(r1, tx('Sterkte'), 0, 1, 0.01, S.amp, v => Math.round(v * 100) + '%', v => { S.amp = v; changed(); });
      const pr = mkSelect(r1, tx('Voorbeeld'), [['', tx('kies…')], ...Object.keys(EXAMPLES).map(k => [k, tx(k)])], '', v => { if (EXAMPLES[v]) { S.pts = EXAMPLES[v].map(p => ({ ...p })); changed(); } pr.set(''); });
      const sl = h('label', 'lab'), sc = h('input'); sc.type = 'checkbox'; sc.checked = S.snap; sc.onchange = () => { S.snap = sc.checked; }; sl.append(sc, document.createTextNode(tx('op raster (1/16)'))); r1.appendChild(sl); ui.snap = sc;
      ui.cv = h('canvas'); ui.cv.style.height = '170px'; ui.cv.style.touchAction = 'none'; ui.cv.setAttribute('role', 'img'); ui.cv.setAttribute('aria-label', tx('Curve')); b1.appendChild(ui.cv); ui.g = ui.cv.getContext('2d');
      ui.cv.addEventListener('pointerdown', onDown); ui.cv.addEventListener('pointermove', onMove); ui.cv.addEventListener('pointerup', onUp); ui.cv.addEventListener('dblclick', onDbl);
      ui.pos = h('div', 'lab'); b1.appendChild(ui.pos); lastPos = '';
      const b3 = h('div', 'box'); b3.appendChild(h('div', 'lab', tx('Toewijzing · diepte als deel van het bereik van elke knop'))); const ab = h('div', 'asg'); b3.appendChild(ab); mk.appendChild(b3);
      asg.mount(ab);
      cw = ui.cv.clientWidth; ch = ui.cv.clientHeight; col = null;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const r = es[0] && es[0].contentRect; if (r) { cw = r.width; ch = r.height; } }); ro.observe(ui.cv); }
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
      stopLoop(); stopDraw = tekenLus(host, self, draw, 30);
    }
    const dropObs = () => { if (ro) { ro.disconnect(); ro = null; } if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); };
    self = {
      inputs: {}, outputs: {},
      mount(el) { const holder = document.createElement('div'); el.appendChild(holder); const root = holder.attachShadow({ mode: 'open' }); root.addEventListener('pointerdown', e => e.stopPropagation()); const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); build(root); },
      unmount() { stopLoop(); dropObs(); asg.unmount(); ui = null; },
      onStep(info) { clock.step(info); },
      onTransport(info) { clock.transport(!!(info && info.playing)); if (info && info.playing) restart(ctx.currentTime); else changed(); },
      onEvent(port, ev) { if (port === 'trig' && ev && (ev.type === 'note' || ev.type === 'trig')) restart(fin(ev.time) ? ev.time : ctx.currentTime); },
      onModTargets(list) { asg.setTargets(list); },
      params() { return [{ id: 'amp', name: tx('Sterkte'), lane: 'env', laneName: tx('Curve'), min: 0, max: 1, role: 'depth', scale: 'lin', drift: 0.05, on: false }]; },
      modulate(offsets) { for (const k in mod) delete mod[k]; const o = offsets && +offsets.amp; if (offsets && Number.isFinite(o)) mod.amp = clamp(o, -1, 1); changed(); },
      getState() { return { pts: S.pts.map(p => ({ x: +p.x.toFixed(5), y: +p.y.toFixed(4), c: +p.c.toFixed(3) })), len: S.len, mode: S.mode, snap: S.snap, amp: S.amp, sel: asg.getState() }; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = DEF();
        let pts = Array.isArray(s.pts) ? s.pts.filter(p => p && fin(p.x) && fin(p.y)).map(p => ({ x: clamp(p.x, 0, 1), y: clamp(p.y, -1, 1), c: fin(p.c) ? clamp(p.c, -1, 1) : 0 })).sort((a, b) => a.x - b.x) : d.pts;
        if (pts.length < 2) pts = d.pts; if (pts.length > MAXPTS) pts = [...pts.slice(0, MAXPTS - 1), pts[pts.length - 1]]; pts[0].x = 0; pts[pts.length - 1].x = 1; S.pts = pts;
        S.len = fin(s.len) && LENS.includes(s.len) ? s.len : d.len; S.mode = s.mode === 'once' ? 'once' : 'loop'; S.snap = typeof s.snap === 'boolean' ? s.snap : d.snap; S.amp = fin(s.amp) ? clamp(s.amp, 0, 1) : d.amp;
        asg.setState(s.sel); changed(); if (ui) { ui.len.set(String(S.len)); ui.mode.set(S.mode); ui.amp.set(S.amp); ui.snap.checked = S.snap; } },
      // Apparaatgebonden toewijzingen horen bij de werkruimte, niet bij een preset.
      getPreset() { const p = self.getState(); delete p.sel; return p; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), sel: asg.getState() }); },
      destroy() { if (dead) return; dead = true; clearInterval(timer); stopLoop(); dropObs(); asg.destroy(); if (sig) sig.stop(); },
    };
    return self;
  }
};
