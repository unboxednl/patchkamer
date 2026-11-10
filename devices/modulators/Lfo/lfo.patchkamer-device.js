// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Regelaars herkenbaar voor skins (host.ui.adopt, id = state-sleutel, groep wave/env; rol param of select), zodat een skin ze als draaiknop kan tonen (compacte skin). Geluid, state en params() zijn gelijk aan 1.12.0.
// 1.12.0 — Uitleg naar about (menu Over LFO); de UI toont geen uitlegtekst meer.
// 1.11.1 — Zelf bestuurbaar (contract §8): params() + modulate() voor de continue regelaars Hz, Vervorm, Fase, Sterkte, Glijden en de envelope-tijden/-niveaus (alle standaard uit). Modulatie is nooit state en komt alleen
//          bovenop de knop; een tweede modulator die de LFO stuurt geeft geen lus (modulate() roept zelf geen host.modulate aan). Bewust weggelaten: aantal stappen (geheel getal, discreet), vorm/snelheidsdeling (keuzes), vinkjes. De uitvoer zonder modulatie is gelijk aan 1.11.0.
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang), kleuren uit de CSS-variabelen van de host, tekenen via host.frame met een ResizeObserver en een kleurcache (de tekenpoort is weg),
//          schuiven met data-pk-default. De uitvoer is altijd eindig (een ongeldig tempo, tijd of fase geeft 0 in plaats van NaN). setState negeert onbekende velden en kapt getallen af op hun bereik.
//          De moduleerwaarden zijn gelijk aan 1.8.0.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// LFO op het tempo van de klok: 8 vormen (ook zelf getekende stappen), vervorming, fase, unipolair, DAHDSR-envelope
// op de Trigger-ingang. Stuurt sample-nauwkeurig waar het doel snelle sturing biedt (⚡), anders 30× per seconde.
// ---------- Modkit: gedeelde code van de modulatoren (LFO, multi-segment envelope, Macro) — elke module bevat een eigen kopie ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, Engels staat hieronder; onbekende taal = Engels
const EN = {
  'Sinus': 'Sine', 'Driehoek': 'Triangle', 'Zaag op': 'Saw up', 'Zaag neer': 'Saw down', 'Blok': 'Square', 'S&H (stappen toeval)': 'S&H (random steps)', 'Glad toeval': 'Smooth random', 'Stappen (zelf tekenen)': 'Steps (draw your own)',
  '8 maten': '8 bars', '4 maten': '4 bars', '2 maten': '2 bars', '1 maat': '1 bar', '1/4 triool': '1/4 triplet', '1/8 triool': '1/8 triplet', '1/16 triool': '1/16 triplet', '1/4 punt': '1/4 dotted', '1/8 punt': '1/8 dotted', 'vrij (Hz)': 'free (Hz)',
  'Vorm': 'Shape', 'Snelheid': 'Rate', 'Vervorm': 'Warp', 'Fase': 'Phase', 'Sterkte': 'Amount',
  'Unipolair (0…+)': 'Unipolar (0…+)', 'alleen naar boven bewegen': 'only moves upward',
  'Fase herstarten bij trigger': 'Restart phase on trigger', 'elke gebeurtenis op de Trigger-ingang zet de LFO op het begin': 'every event on the Trigger input restarts the LFO',
  'Envelope (DAHDSR)': 'Envelope (DAHDSR)', 'de LFO volgt een envelope die start op de Trigger-ingang': 'the LFO follows an envelope that starts on the Trigger input',
  'vorm van de LFO': 'shape of the LFO', 'Aantal stappen': 'Steps', 'Glijden': 'Glide', 'teken de stappen in de golf hierboven': 'draw the steps in the wave above',
  'Envelope · start op de Trigger-ingang (noten of trigs), gate = lengte van de noot': 'Envelope · starts on the Trigger input (notes or trigs), gate = length of the note',
  'Toewijzing · diepte als deel van het bereik van elke knop': 'Assignment · depth as a share of each knob range',
  'Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>LFO</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.':
    'Nothing connected yet. Pull a <b>purple cable</b> from the output <b>LFO</b> to the <b>Mod</b> input of a device. Then choose here which parameters move along and by how much.',
  'LFO': 'LFO', 'Envelope': 'Envelope', 'Sustain': 'Sustain', 'Hz': 'Hz', 'Delay': 'Delay', 'Attack': 'Attack', 'Hold': 'Hold', 'Decay': 'Decay', 'Release': 'Release',
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
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
// def = de standaardstand van de schuif (dubbelklik zet hem daarop terug, ook als de UI later met andere waarden wordt gebouwd)
// skins (contract §12d): meldt een eigen regelaar aan zodat een skin hem als draaiknop kan tonen; a = { h: host, id: state-sleutel, g: groep }
const adopt = (el, a, role, label) => { if (a && a.h && a.h.ui && typeof a.h.ui.adopt === 'function') { try { a.h.ui.adopt(el, { id: a.id, role, group: a.g, label }); } catch (e) { /* oud contract */ } } };
function mkSlider(parent, label, min, max, step, val, fmt, onin, def, a) {
  const w = E('div', 'ctl'), l = E('label'), o = E('output'), i = E('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.setAttribute('aria-label', label);
  if (def != null) i.setAttribute('data-pk-default', String(def)); adopt(i, a, 'param', label);
  l.append(document.createTextNode(label), o); o.textContent = fmt(+val); i.oninput = () => { onin(+i.value); o.textContent = fmt(+i.value); };
  w.append(l, i); parent.appendChild(w); return { el: w, i, o, set(v) { i.value = v; o.textContent = fmt(+v); } };
}
function mkSelect(parent, label, opts, val, onch, a) {
  const w = E('div', 'ctl'), l = E('label', '', label), s = E('select'); s.setAttribute('aria-label', label); adopt(s, a, 'select', label);
  opts.forEach(([v, t]) => { const o = E('option', '', t); o.value = v; s.appendChild(o); }); s.value = val; s.onchange = () => onch(s.value);
  w.append(l, s); parent.appendChild(w); return { el: w, s, set(v) { s.value = v; } };
}
// tempo: houdt bij welke tel het is, ook als de klok stilstaat (dan loopt hij door op het ingestelde tempo)
function mkClock(ctx, host) {
  const c = { t: 0, b: 0, bpm: 120, running: false };
  const ok = v => typeof v === 'number' && Number.isFinite(v) && v > 0;
  const hostBpm = () => { const v = host ? +host.bpm : NaN; return ok(v) ? v : 0; };
  return {
    step({ step, bar, time, bpm }) { if (ok(bpm)) c.bpm = bpm; if (!Number.isFinite(step) || !Number.isFinite(bar) || !Number.isFinite(time)) return; if (step % 4 === 0) { c.t = time; c.b = bar * 4 + step / 4; } c.running = true; },
    transport(p) { const t = ctx.currentTime, b = this.beatsAt(t); c.t = t; c.b = b; c.running = !!p; },
    beatsAt(t) { const bpm = c.running ? c.bpm : hostBpm() || c.bpm; return c.b + (t - c.t) * bpm / 60; },
    bpm() { return c.running ? c.bpm : hostBpm() || c.bpm; },
    get running() { return c.running; },
  };
}
// toewijzing: welke parameters van welk doel deze modulator stuurt, met diepte (−100..100% van het bereik)
function mkAssign(ctx, host, selfRef, opt) {
  const tx = opt.tx, me = () => (typeof selfRef === 'function' ? selfRef() : selfRef);
  // opt: { sources:[[id,naam]], valueAt(src, t) -> −1..1, signal(src) -> AudioNode|null, tx }
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
      o[p.id] = clamp(fin(opt.valueAt(s.s || opt.sources[0][0], t), 0) * s.d, -1, 1); }); host.modulate(me(), T.id, o); });
  }
  function count(T) { return T.params.filter(p => { const s = get(T.id, p.id); return s && s.d; }).length; }
  function paint() {
    const box = A.box; if (!box) return; box.innerHTML = ''; A.rows = [];
    const real = A.targets.filter(T => T.params.length);
    if (!real.length) { const e = E('div', 'empty'); e.innerHTML = tx('Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>LFO</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.'); box.appendChild(e); return; }
    const bar = E('div', 'asgbar'), q = E('input'); q.type = 'search'; q.placeholder = tx('zoek parameter'); q.value = A.filter; q.setAttribute('aria-label', tx('zoek parameter'));
    q.oninput = () => { A.filter = q.value.toLowerCase(); applyFilter(); };
    const lo = E('label', 'lab'), cb = E('input'); cb.type = 'checkbox'; cb.checked = A.onlyOn; cb.onchange = () => { A.onlyOn = cb.checked; applyFilter(); }; lo.append(cb, document.createTextNode(tx('alleen actief')));
    bar.append(q, lo); box.appendChild(bar);
    real.forEach(T => {
      const sec = E('section', 'tg'), hd = E('h3', '', '→ ' + T.name), sm = E('small'); hd.appendChild(sm); sec.appendChild(hd);
      const cnt = () => { const n = count(T); sm.textContent = n ? tx('{0} van {1} toegewezen', n, T.params.length) : tx('{0} parameters', T.params.length); }; cnt();
      const lanes = new Map(); T.params.forEach(p => { const k = p.lane || '-'; if (!lanes.has(k)) lanes.set(k, { name: p.laneName || p.lane || 'Parameters', ps: [] }); lanes.get(k).ps.push(p); });
      lanes.forEach(L => {
        const d = E('details', 'lane'), su = E('summary', '', L.name), ls = E('small'); su.appendChild(ls); d.appendChild(su);
        const lcnt = () => { const n = L.ps.filter(p => { const s = get(T.id, p.id); return s && s.d; }).length; ls.textContent = n ? tx('{0} actief', n) : ''; return n; };
        d.open = lanes.size <= 3 || lcnt() > 0; lcnt();
        L.ps.forEach(p => {
          const s0 = get(T.id, p.id) || { d: 0, s: opt.sources[0][0] };
          const r = E('div', 'prow' + (s0.d ? ' on' : '')), nm = E('span', 'nm', p.name), out = E('output'), rg = E('input'), fl = E('span', 'fast');
          nm.title = `${p.name} · ${p.min}…${p.max}${p.scale === 'log' ? ' (log)' : ''}${p.fast ? ' · ' + tx('snel stuurbaar') : ''}`;
          let srcSel = E('span');
          if (opt.sources.length > 1) { srcSel = E('select'); opt.sources.forEach(([v, t]) => { const o = E('option', '', t); o.value = v; srcSel.appendChild(o); }); srcSel.value = s0.s || opt.sources[0][0]; srcSel.setAttribute('aria-label', tx('bron voor {0}', p.name));
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
      for (let i = 0; i < n; i++) c[i] = fin(valueAt(start + (i / (n - 1)) * (until - start)), 0);
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

// ---------- LFO op tempo ----------
const SHAPES = [['sin', 'Sinus'], ['tri', 'Driehoek'], ['saw', 'Zaag op'], ['ramp', 'Zaag neer'], ['sqr', 'Blok'], ['sh', 'S&H (stappen toeval)'], ['noise', 'Glad toeval'], ['steps', 'Stappen (zelf tekenen)']];
const DIVS = [['32', '8 maten', 32], ['16', '4 maten', 16], ['8', '2 maten', 8], ['4', '1 maat', 4], ['2', '1/2', 2], ['1', '1/4', 1], ['0.5', '1/8', 0.5], ['0.25', '1/16', 0.25], ['0.125', '1/32', 0.125],
  ['0.6667', '1/4 triool', 2 / 3], ['0.3333', '1/8 triool', 1 / 3], ['0.1667', '1/16 triool', 1 / 6], ['1.5', '1/4 punt', 1.5], ['0.75', '1/8 punt', 0.75], ['free', 'vrij (Hz)', 0]];
const h32 = n => { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const DEF = () => ({ shape: 'sin', div: '1', hz: 1, deform: 0, phase: 0, amp: 1, uni: false, retrig: false, steps: [1, 0.5, 0, -0.5, -1, -0.5, 0, 0.5, 1, 0.25, -0.25, 0.75, -0.75, 0, 0.5, -1], nsteps: 16, glide: 0,
  env: false, eDel: 0, eAtk: 0.01, eHold: 0, eDec: 0.3, eSus: 0.6, eRel: 0.4, sel: {} });
// bereiken voor setState (§13)
const LIMITS = { hz: [0.01, 20], deform: [-1, 1], phase: [0, 1], amp: [0, 1], nsteps: [2, 16], glide: [0, 1], eDel: [0, 2], eAtk: [0.001, 4], eHold: [0, 2], eDec: [0.001, 4], eSus: [0, 1], eRel: [0.001, 6] };
// Bestuurbare regelaars: [id, naam, min, max, log, role, drift, aan]
const MODP = [['hz', 'Hz', 0.01, 20, true, 'rate', 0.05, false], ['deform', 'Vervorm', -1, 1, false, 'shape', 0.05, false], ['phase', 'Fase', 0, 1, false, 'phase', 0.05, false], ['amp', 'Sterkte', 0, 1, false, 'depth', 0.05, false],
  ['glide', 'Glijden', 0, 1, false, 'glide', 0.05, false], ['eDel', 'Delay', 0, 2, false, 'env', 0.05, false], ['eAtk', 'Attack', 0.001, 4, true, 'env', 0.05, false], ['eHold', 'Hold', 0, 2, false, 'env', 0.05, false],
  ['eDec', 'Decay', 0.001, 4, true, 'env', 0.05, false], ['eSus', 'Sustain', 0, 1, false, 'env', 0.05, false], ['eRel', 'Release', 0.001, 6, true, 'env', 0.05, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const hzPos = hz => Math.log(hz / 0.01) / Math.log(2000);

export default {
  id: 'nl.patchkamer.lfo',
  name: 'LFO',
  about: { nl: 'Een LFO op het tempo van de klok. Trek de paarse uitgang naar de Mod-ingang van een apparaat en kies hieronder wat er meebeweegt. Parameters met ⚡ worden sample-nauwkeurig gestuurd.', en: 'An LFO at the tempo of the clock. Pull the purple output to the Mod input of a device and choose below what moves along. Parameters with ⚡ are controlled sample-accurately.' },
  version: '1.13.0',
  kind: 'modulator',
  modExclude: ['nsteps'],   // geheel getal (aantal stappen), bewust niet stuurbaar
  category: 'mod',
  ui: { width: 760, minWidth: 380 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'trig', name: 'Trigger' }], eventOut: [], modIn: [], modOut: [{ id: 'mod', name: 'LFO' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const D = DEF(); const A = (id, g) => ({ h: host, id, g });
    const S = DEF(); const mod = {}; let self, dead = false, ui = null, stopDraw = null, trigT = -1, gateEnd = -1, trigB = 0;
    let cw = 0, ch = 0, ro = null, col = null, colT = 0;
    const clock = mkClock(ctx, host);
    // effectieve waarde = knop + modulatie (lineair: knop + o × bereik; log: knop × (max/min)^o), geclampt; de knop (S) blijft ongemoeid
    const V = k => { const o = mod[k], b = S[k]; if (!o) return b; const m = MODBY[k], mn = m[2], mx = m[3]; return m[4] ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    const periodBeats = () => { const d = DIVS.find(x => x[0] === S.div); return d && d[2] ? d[2] : 0; };
    function phaseAt(t) {   // fase in cycli (niet modulo), op tempo of vrij
      const pb = periodBeats(), b = clock.beatsAt(t);
      let ph = pb ? b / pb : (b * 60 / clock.bpm()) * V('hz');
      if (S.retrig && trigT >= 0 && t >= trigT) ph = pb ? (b - trigB) / pb : (t - trigT) * V('hz');
      return ph + V('phase');
    }
    function wave(ph) {
      const cyc = Math.floor(ph), x = ph - cyc, k = V('deform');
      switch (S.shape) {
        case 'sin': { const sk = clamp(0.5 + k * 0.45, 0.05, 0.95), y = x < sk ? x / sk * 0.5 : 0.5 + (x - sk) / (1 - sk) * 0.5; return Math.sin(2 * Math.PI * y); }
        case 'tri': { const sk = clamp(0.5 + k * 0.48, 0.02, 0.98); return x < sk ? -1 + 2 * x / sk : 1 - 2 * (x - sk) / (1 - sk); }
        case 'saw': { const e = Math.pow(2, k * 3); return -1 + 2 * Math.pow(x, e); }
        case 'ramp': { const e = Math.pow(2, k * 3); return 1 - 2 * Math.pow(x, e); }
        case 'sqr': return x < clamp(0.5 + k * 0.48, 0.02, 0.98) ? 1 : -1;
        case 'sh': return h32(cyc * 7919 + 13) * 2 - 1;
        case 'noise': { const a = h32(cyc * 7919 + 13) * 2 - 1, b = h32((cyc + 1) * 7919 + 13) * 2 - 1, sm = 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(x, Math.pow(2, -k))); return a + (b - a) * sm; }
        case 'steps': { const n = clamp(S.nsteps | 0, 2, 16), p = x * n, i = Math.floor(p), f = p - i, a = S.steps[i] || 0, b = S.steps[(i + 1) % n] || 0, g = V('glide');
          return g > 0 && f > 1 - g ? a + (b - a) * ((f - (1 - g)) / g) : a; }
      }
      return 0;
    }
    function envAt(t) {   // DAHDSR na de laatste trigger; de gate duurt tot gateEnd
      if (trigT < 0 || t < trigT) return 0; let u = t - trigT; const De = V('eDel'), Ak = Math.max(0.001, V('eAtk')), H = V('eHold'), Dc = Math.max(0.001, V('eDec')), Su = V('eSus');
      const sustainAt = u2 => { if (u2 < De) return 0; u2 -= De; if (u2 < Ak) return u2 / Ak; u2 -= Ak; if (u2 < H) return 1; u2 -= H; return u2 < Dc ? 1 - (1 - Su) * (u2 / Dc) : Su; };
      if (gateEnd < 0 || t < gateEnd) return sustainAt(u);
      const lv = sustainAt(gateEnd - trigT), r = (t - gateEnd) / Math.max(0.001, V('eRel')); return r >= 1 ? 0 : lv * (1 - r);
    }
    // de uitvoer is altijd eindig en ligt in −1…+1
    function valueAt(t) { let v = wave(phaseAt(t)) * V('amp'); if (S.uni) v = (v + V('amp')) / 2; if (S.env) v *= envAt(t); return Number.isFinite(v) ? clamp(v, -1, 1) : 0; }
    const sig = mkSignal(ctx, valueAt);
    const asg = mkAssign(ctx, host, () => self, { sources: [['lfo', 'LFO']], valueAt: (s, t) => valueAt(t), signal: () => sig && sig.node, tx });
    const timer = setInterval(() => { if (dead) return; if (sig) sig.plan(); asg.tick(ctx.currentTime); }, 33);
    const changed = () => { if (sig) sig.reset(); };

    // ---------- UI ----------
    const onSkin = () => { col = null; };
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    function readColors() { const cs = getComputedStyle(ui.cv); colT = performance.now(); col = [cs.getPropertyValue('--mod').trim() || '#b48cff', cs.getPropertyValue('--audio').trim() || '#4fd1c5', cs.getPropertyValue('--muted').trim() || '#8a93a3']; }
    function drawWave() {
      if (dead || !ui) return;
      const cv = ui.cv, w = cw, hh = ch; if (!w || !hh) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      const g = ui.g; if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, hh); const mid = hh / 2, yOf = v => mid - v * (mid - 6);
      g.globalAlpha = 0.4; g.strokeStyle = col[2]; g.beginPath(); g.moveTo(0, mid); g.lineTo(w, mid); g.stroke(); g.globalAlpha = 1;
      const cycles = 2, now = ctx.currentTime, ph = phaseAt(now), base = Math.floor(ph - V('phase'));
      g.strokeStyle = col[0]; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= w; i += 2) { const p = base + V('phase') + (i / w) * cycles; let v = wave(p) * V('amp'); if (S.uni) v = (v + V('amp')) / 2; if (!Number.isFinite(v)) v = 0; i ? g.lineTo(i, yOf(v)) : g.moveTo(i, yOf(v)); } g.stroke();
      const x = ((ph - base - V('phase')) / cycles) * w, v = valueAt(now); g.fillStyle = col[1]; g.beginPath(); g.arc(Number.isFinite(x) ? x : 0, yOf(v), 4, 0, 6.2832); g.fill();
      if (S.shape === 'steps') { const n = clamp(S.nsteps | 0, 2, 16); g.fillStyle = col[0]; g.globalAlpha = 0.18; for (let c = 0; c < cycles; c++) for (let i = 0; i < n; i++) { const x0 = ((c + i / n) / cycles) * w, ww = w / cycles / n - 2, y = yOf(S.steps[i] || 0); g.fillRect(x0 + 1, Math.min(y, mid), ww, Math.abs(y - mid)); } g.globalAlpha = 1; }
      ui.val.textContent = (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + '%' + (S.env ? ' · env ' + Math.round(envAt(now) * 100) + '%' : '');
    }
    function stepEdit(e) { if (S.shape !== 'steps') return; const r = ui.cv.getBoundingClientRect(), n = clamp(S.nsteps | 0, 2, 16), cyc = 2;
      const xi = Math.floor(((e.clientX - r.left) / r.width) * cyc * n) % n, y = clamp(1 - 2 * (e.clientY - r.top) / r.height, -1, 1); if (!Number.isFinite(xi) || xi < 0 || !Number.isFinite(y)) return; S.steps[xi] = Math.round(y * 20) / 20; changed(); }
    function build(root) {
      const mk = E('div', 'mk'); root.appendChild(mk); ui = {};
            const b1 = E('div', 'box'), r1 = E('div', 'row'); b1.appendChild(r1); mk.appendChild(b1);
      ui.shape = mkSelect(r1, tx('Vorm'), SHAPES.map(([v, t]) => [v, tx(t)]), S.shape, v => { S.shape = v; ui.stepsRow.style.display = v === 'steps' ? '' : 'none'; changed(); }, A('shape', 'wave'));
      ui.div = mkSelect(r1, tx('Snelheid'), DIVS.map(d => [d[0], tx(d[1])]), S.div, v => { S.div = v; ui.hz.el.style.display = v === 'free' ? '' : 'none'; changed(); }, A('div', 'wave'));
      ui.hz = mkSlider(r1, 'Hz', 0, 1, 0.001, hzPos(S.hz), x => (0.01 * Math.pow(2000, x)).toFixed(2) + ' Hz', x => { S.hz = 0.01 * Math.pow(2000, x); changed(); }, hzPos(D.hz), A('hz', 'wave'));
      ui.hz.el.style.display = S.div === 'free' ? '' : 'none';
      const pct = v => Math.round(v * 100) + '%';
      ui.deform = mkSlider(r1, tx('Vervorm'), -1, 1, 0.01, S.deform, pct, v => { S.deform = v; changed(); }, D.deform, A('deform', 'wave'));
      ui.phase = mkSlider(r1, tx('Fase'), 0, 1, 0.01, S.phase, v => Math.round(v * 360) + '°', v => { S.phase = v; changed(); }, D.phase, A('phase', 'wave'));
      ui.amp = mkSlider(r1, tx('Sterkte'), 0, 1, 0.01, S.amp, pct, v => { S.amp = v; changed(); }, D.amp, A('amp', 'wave'));
      const r2 = E('div', 'row'); b1.appendChild(r2);
      const chk = (label, k, title) => { const l = E('label', 'lab'), c = E('input'); c.type = 'checkbox'; c.checked = !!S[k]; c.onchange = () => { S[k] = c.checked; changed(); }; l.title = tx(title || ''); l.append(c, document.createTextNode(tx(label))); r2.appendChild(l); ui['c_' + k] = c; };
      chk('Unipolair (0…+)', 'uni', 'alleen naar boven bewegen'); chk('Fase herstarten bij trigger', 'retrig', 'elke gebeurtenis op de Trigger-ingang zet de LFO op het begin'); chk('Envelope (DAHDSR)', 'env', 'de LFO volgt een envelope die start op de Trigger-ingang');
      ui.val = E('span', 'lab'); ui.val.style.marginLeft = 'auto'; r2.appendChild(ui.val);
      ui.cv = E('canvas'); ui.cv.style.height = '110px'; ui.cv.setAttribute('role', 'img'); ui.cv.setAttribute('aria-label', tx('vorm van de LFO')); b1.appendChild(ui.cv); ui.g = ui.cv.getContext('2d');
      let drag = false; ui.cv.addEventListener('pointerdown', e => { if (S.shape !== 'steps') return; drag = true; ui.cv.setPointerCapture(e.pointerId); stepEdit(e); });
      ui.cv.addEventListener('pointermove', e => { if (drag) stepEdit(e); }); ui.cv.addEventListener('pointerup', () => { drag = false; });
      ui.stepsRow = E('div', 'row'); b1.appendChild(ui.stepsRow); ui.stepsRow.style.display = S.shape === 'steps' ? '' : 'none';
      ui.nsteps = mkSlider(ui.stepsRow, tx('Aantal stappen'), 2, 16, 1, S.nsteps, v => String(v), v => { S.nsteps = v; changed(); }, D.nsteps, A('nsteps', 'wave'));
      ui.glide = mkSlider(ui.stepsRow, tx('Glijden'), 0, 1, 0.01, S.glide, pct, v => { S.glide = v; changed(); }, D.glide, A('glide', 'wave'));
      ui.stepsRow.appendChild(E('span', 'lab', tx('teken de stappen in de golf hierboven')));
      const b2 = E('div', 'box'), r3 = E('div', 'row'); b2.appendChild(E('div', 'lab', tx('Envelope · start op de Trigger-ingang (noten of trigs), gate = lengte van de noot'))); b2.appendChild(r3); mk.appendChild(b2);
      const sec = v => v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
      [['eDel', 'Delay', 0, 2], ['eAtk', 'Attack', 0.001, 4], ['eHold', 'Hold', 0, 2], ['eDec', 'Decay', 0.001, 4]].forEach(([k, l, mn, mx]) => { ui[k] = mkSlider(r3, l, mn, mx, 0.001, S[k], sec, v => { S[k] = v; changed(); }, D[k], A(k, 'env')); });
      ui.eSus = mkSlider(r3, 'Sustain', 0, 1, 0.01, S.eSus, pct, v => { S.eSus = v; changed(); }, D.eSus, A('eSus', 'env'));
      ui.eRel = mkSlider(r3, 'Release', 0.001, 6, 0.001, S.eRel, sec, v => { S.eRel = v; changed(); }, D.eRel, A('eRel', 'env'));
      const b3 = E('div', 'box'); b3.appendChild(E('div', 'lab', tx('Toewijzing · diepte als deel van het bereik van elke knop'))); const ab = E('div', 'asg'); b3.appendChild(ab); mk.appendChild(b3);
      asg.mount(ab);
      cw = ui.cv.clientWidth; ch = ui.cv.clientHeight; col = null;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const r = es[0] && es[0].contentRect; if (r) { cw = r.width; ch = r.height; } }); ro.observe(ui.cv); }
      if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
      stopLoop(); stopDraw = tekenLus(host, self, drawWave, 30);
    }
    function paintUi() { if (!ui) return; ['shape', 'div'].forEach(k => ui[k].set(S[k])); ui.hz.set(hzPos(S.hz)); ['deform', 'phase', 'amp', 'nsteps', 'glide', 'eDel', 'eAtk', 'eHold', 'eDec', 'eSus', 'eRel'].forEach(k => ui[k].set(S[k]));
      ['uni', 'retrig', 'env'].forEach(k => ui['c_' + k].checked = !!S[k]); ui.hz.el.style.display = S.div === 'free' ? '' : 'none'; ui.stepsRow.style.display = S.shape === 'steps' ? '' : 'none'; }
    function teardownUi() { stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); }

    self = {
      inputs: {}, outputs: {},
      mount(el) { const holder = document.createElement('div'); el.appendChild(holder); const root = holder.attachShadow({ mode: 'open' }); root.addEventListener('pointerdown', e => e.stopPropagation()); const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); build(root); },
      unmount() { teardownUi(); asg.unmount(); ui = null; },
      onStep(info) { if (info && typeof info === 'object') clock.step(info); },
      onTransport(p) { clock.transport(!!(p && p.playing)); if (p && p.playing && S.retrig) { trigT = ctx.currentTime; trigB = clock.beatsAt(trigT); } changed(); },
      onEvent(port, ev) { if (port !== 'trig' || !ev || (ev.type !== 'note' && ev.type !== 'trig')) return; const t = fin(ev.time, ctx.currentTime);
        trigT = t; trigB = clock.beatsAt(t); gateEnd = t + fin(ev.dur, 60 / clock.bpm() / 4); changed(); },
      onModTargets(list) { asg.setTargets(list); },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: id.startsWith('e') ? 'env' : 'lfo', laneName: tx(id.startsWith('e') ? 'Envelope' : 'LFO'), min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(offsets) { for (const k in mod) delete mod[k]; for (const k in offsets || {}) if (MODBY[k] && Number.isFinite(+offsets[k])) mod[k] = clamp(+offsets[k], -1, 1); changed(); },
      getState() { const o = {}; Object.keys(DEF()).forEach(k => { if (k !== 'sel') o[k] = Array.isArray(S[k]) ? S[k].slice() : S[k]; }); o.sel = asg.getState(); return o; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = DEF(); Object.keys(d).forEach(k => { if (k === 'sel') return; const v = s[k];
          if (Array.isArray(d[k])) S[k] = Array.isArray(v) ? d[k].map((x, i) => typeof v[i] === 'number' && isFinite(v[i]) ? clamp(v[i], -1, 1) : x) : d[k].slice();
          else if (typeof d[k] === 'number') S[k] = typeof v === 'number' && isFinite(v) ? v : d[k]; else if (typeof d[k] === 'boolean') S[k] = typeof v === 'boolean' ? v : d[k];
          else S[k] = typeof v === 'string' ? v : d[k]; });
        if (!SHAPES.some(x => x[0] === S.shape)) S.shape = 'sin'; if (!DIVS.some(x => x[0] === S.div)) S.div = '1';
        Object.entries(LIMITS).forEach(([k, r]) => S[k] = clamp(S[k], ...r)); S.nsteps = Math.round(S.nsteps);
        asg.setState(s.sel); changed(); paintUi(); },
      // Apparaatgebonden toewijzingen horen bij de werkruimte, niet bij een preset.
      getPreset() { const p = self.getState(); delete p.sel; return p; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), sel: asg.getState() }); },
      destroy() { if (dead) return; dead = true; clearInterval(timer); teardownUi(); asg.destroy(); if (sig) sig.stop(); },
    };
    return self;
  }
};
