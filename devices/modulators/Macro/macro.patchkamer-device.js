// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.12.0 — Uitleg naar about (menu Over Macro); de UI toont geen uitlegtekst meer.
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang, poortnamen per taal in i18n); kleuren van de invoervelden uit de host (--field, --field-fg);
//          schuiven met data-pk-default. setState negeert onbekende velden, kapt getallen af op hun bereik en geeft bij een ongeldige waarde de beginwaarde;
//          alle uitvoer (knopstanden, sturing, CC-waarden) blijft eindig. Ongebruikte hulpfuncties van de gedeelde code zijn weg; het uitgestuurde signaal is gelijk aan 1.8.0.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// Macro: vier knoppen die elk een groep parameters (ook over apparaten heen) tegelijk draaien; bipolair of unipolair;
// bestuurbaar via CC. Eigen code.
// ---------- Modkit: gedeelde code van de modulatoren (LFO, MSEG, Macro) — elke module bevat een eigen kopie ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, Engels staat hieronder; onbekende taal = Engels
const EN = {
  'naam van knop {0}': 'name of knob {0}', 'bipolair': 'bipolar',
  'bipolair: 50% is de knopstand, links eronder, rechts erboven': 'bipolar: 50% is the centre; left of it goes negative, right of it goes positive',
  'Glijden': 'Glide',
  'Toewijzing · kies per parameter de knop (M1…M4) en de diepte': 'Assignment · choose per parameter the knob (M1…M4) and the depth',
  'Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Macro</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.':
    'Nothing connected yet. Pull a <b>purple cable</b> from the output <b>Macro</b> to the <b>Mod</b> input of a device. Then choose here which parameters move along and by how much.',
  'zoek parameter': 'search parameter', 'alleen actief': 'active only',
  '{0} van {1} toegewezen': '{0} of {1} assigned', '{0} parameters': '{0} parameters', '{0} actief': '{0} active',
  'snel stuurbaar': 'fast control', 'bron voor {0}': 'source for {0}', 'diepte {0}': 'depth {0}',
  'diepte: deel van het bereik van de knop (dubbelklik = 0)': 'depth: share of the knob range (double-click = 0)',
  'snelle sturing: sample-nauwkeurig': 'fast control: sample-accurate',
};

const MK_CSS = `
:host{all:initial;display:block;container-type:inline-size;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:var(--fg,#e6e9ee)}
*{box-sizing:border-box}
.mk{display:grid;gap:10px;min-width:0}
.box{padding:8px 10px;border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,#161a20);display:grid;gap:8px;min-width:0}
.row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:end}
.ctl{display:grid;gap:2px;min-width:110px;flex:1 1 120px}
.ctl label,.lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a3);display:flex;justify-content:space-between;gap:6px}
.ctl output{color:var(--mod,#b48cff);letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums}
select,input[type=text],input[type=search]{font:inherit;font-size:11px;color:var(--field-fg,var(--fg,#e6e9ee));background:var(--field,var(--card,#1c2128));border:1px solid var(--line,#2a303a);border-radius:4px;padding:4px 8px}
input[type=range]{width:100%;margin:0;accent-color:var(--mod,#b48cff);height:16px;min-width:0}
.ctl input[type=text],.ctl select{width:100%;min-width:0}
input[type=checkbox]{accent-color:var(--mod,#b48cff);margin:0}
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
function mkSlider(parent, label, min, max, step, val, fmt, onin) {
  const w = E('div', 'ctl'), l = E('label'), o = E('output'), i = E('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.setAttribute('aria-label', label); i.setAttribute('data-pk-default', String(val));
  l.append(document.createTextNode(label), o); o.textContent = fmt(+val); i.oninput = () => { onin(+i.value); o.textContent = fmt(+i.value); };
  w.append(l, i); parent.appendChild(w); return { el: w, i, o, set(v) { i.value = v; o.textContent = fmt(+v); } };
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
      o[p.id] = clamp(opt.valueAt(s.s || opt.sources[0][0], t) * s.d, -1, 1); }); host.modulate(me(), T.id, o); });
  }
  function count(T) { return T.params.filter(p => { const s = get(T.id, p.id); return s && s.d; }).length; }
  function paint() {
    const box = A.box; if (!box) return; box.innerHTML = ''; A.rows = [];
    const real = A.targets.filter(T => T.params.length);
    if (!real.length) { const e = E('div', 'empty'); e.innerHTML = tx('Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Macro</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.'); box.appendChild(e); return; }
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

// ---------- Macro: vier knoppen die elk meerdere parameters tegelijk draaien ----------
const N = 4;
const NAME_MAX = 24;
const DEF = () => ({ v: [0, 0, 0, 0], names: ['Macro 1', 'Macro 2', 'Macro 3', 'Macro 4'], bip: [false, false, false, false], glide: 0.05, sel: {} });
const isNum = x => typeof x === 'number' && Number.isFinite(x);

export default {
  id: 'nl.patchkamer.macro',
  name: 'Macro',
  about: { nl: 'Vier knoppen die elk een groep parameters tegelijk draaien, ook over apparaten heen. Kies per parameter welke knop hem stuurt en hoe ver. De CC-ingang accepteert {type:"cc", id:"m1"…"m4", value:0…1}.', en: 'Four knobs that each turn a group of parameters at once, even across devices. Choose per parameter which knob drives it and how far. The CC input accepts {type:"cc", id:"m1"…"m4", value:0…1}.' },
  version: '1.12.0',
  kind: 'modulator',
  category: 'mod',
  ui: { width: 640, minWidth: 360 },
  i18n: { en: { ports: { cc: 'CC', mod: 'Macro' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'cc', name: 'CC' }], eventOut: [], modIn: [], modOut: [{ id: 'mod', name: 'Macro' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const S = DEF(); let self, dead = false, ui = null;
    const out = i => (S.bip[i] ? S.v[i] * 2 - 1 : S.v[i]);
    const srcs = Array.from({ length: N }, () => (typeof ctx.createConstantSource === 'function' ? (() => { const c = ctx.createConstantSource(); c.offset.value = 0; try { c.start(); } catch (e) {} return c; })() : null));
    const push = i => { const c = srcs[i]; if (c) c.offset.setTargetAtTime(out(i), ctx.currentTime, Math.max(0.005, S.glide / 3)); };
    const asg = mkAssign(ctx, host, () => self, { sources: Array.from({ length: N }, (_, i) => ['m' + (i + 1), 'M' + (i + 1)]), valueAt: s => out(clamp(+s.slice(1) - 1, 0, N - 1)), signal: s => srcs[clamp(+String(s).slice(1) - 1, 0, N - 1)], title: 'Macro', tx });
    const timer = setInterval(() => { if (!dead) asg.tick(ctx.currentTime); }, 33);
    function setV(i, v) { S.v[i] = clamp(v, 0, 1); push(i); if (ui) ui.k[i].set(S.v[i]); }
    function build(root) {
      const mk = E('div', 'mk'); root.appendChild(mk); ui = { k: [], n: [], b: [] };
            const b1 = E('div', 'box'), r1 = E('div', 'row'); r1.style.alignItems = 'stretch'; b1.appendChild(r1); mk.appendChild(b1);
      for (let i = 0; i < N; i++) {
        const col = E('div', 'ctl'); col.style.minWidth = '110px'; col.style.flex = '1 1 0'; col.style.gap = '6px';
        const nm = E('input'); nm.type = 'text'; nm.value = S.names[i]; nm.maxLength = NAME_MAX; nm.setAttribute('aria-label', tx('naam van knop {0}', i + 1)); nm.oninput = () => { S.names[i] = nm.value; }; col.appendChild(nm); ui.n[i] = nm;
        ui.k[i] = mkSlider(col, 'M' + (i + 1), 0, 1, 0.001, S.v[i], v => Math.round(v * 100) + '%', v => setV(i, v));
        ui.k[i].i.style.height = '28px'; ui.k[i].i.ondblclick = () => setV(i, 0);
        const bl = E('label', 'lab'), bc = E('input'); bc.type = 'checkbox'; bc.checked = S.bip[i]; bc.onchange = () => { S.bip[i] = bc.checked; push(i); }; bl.title = tx('bipolair: 50% is de knopstand, links eronder, rechts erboven'); bl.append(bc, document.createTextNode(tx('bipolair'))); col.appendChild(bl); ui.b[i] = bc;
        r1.appendChild(col);
      }
      const r2 = E('div', 'row'); b1.appendChild(r2); ui.glide = mkSlider(r2, tx('Glijden'), 0, 2, 0.01, S.glide, v => Math.round(v * 1000) + ' ms', v => { S.glide = v; });
      const b3 = E('div', 'box'); b3.appendChild(E('div', 'lab', tx('Toewijzing · kies per parameter de knop (M1…M4) en de diepte'))); const ab = E('div', 'asg'); b3.appendChild(ab); mk.appendChild(b3);
      asg.mount(ab);
    }
    self = {
      inputs: {}, outputs: {},
      mount(el) { const holder = document.createElement('div'); el.appendChild(holder); const root = holder.attachShadow({ mode: 'open' }); root.addEventListener('pointerdown', e => e.stopPropagation()); const st = document.createElement('style'); st.textContent = MK_CSS; root.appendChild(st); build(root); },
      unmount() { asg.unmount(); ui = null; },
      onEvent(port, ev) { if (port !== 'cc' || !ev || ev.type !== 'cc') return; const m = /^(?:m|macro)\s*([1-4])$/i.exec(String(ev.id || '')); if (m && isNum(ev.value)) setV(+m[1] - 1, ev.value); },
      onModTargets(list) { asg.setTargets(list); },
      getState() { return { v: S.v.slice(), names: S.names.slice(), bip: S.bip.slice(), glide: S.glide, sel: asg.getState() }; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = DEF();
        S.v = d.v.map((x, i) => (Array.isArray(s.v) && isNum(s.v[i]) ? clamp(s.v[i], 0, 1) : x)); S.names = d.names.map((x, i) => (Array.isArray(s.names) && typeof s.names[i] === 'string' ? s.names[i].slice(0, NAME_MAX) : x));
        S.bip = d.bip.map((x, i) => (Array.isArray(s.bip) && typeof s.bip[i] === 'boolean' ? s.bip[i] : x)); S.glide = isNum(s.glide) ? clamp(s.glide, 0, 2) : d.glide;
        for (let i = 0; i < N; i++) push(i); asg.setState(s.sel);
        if (ui) for (let i = 0; i < N; i++) { ui.k[i].set(S.v[i]); ui.n[i].value = S.names[i]; ui.b[i].checked = S.bip[i]; ui.glide.set(S.glide); } },
      // Apparaatgebonden toewijzingen horen bij de werkruimte, niet bij een preset.
      getPreset() { const p = self.getState(); delete p.sel; return p; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), sel: asg.getState() }); },
      destroy() { if (dead) return; dead = true; clearInterval(timer); asg.destroy(); srcs.forEach(c => { if (c) { try { c.stop(); } catch (e) {} try { c.disconnect(); } catch (e) {} } }); },
    };
    return self;
  }
};
