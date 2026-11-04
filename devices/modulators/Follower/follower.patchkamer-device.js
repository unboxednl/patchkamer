// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Follower en nieuwe id nl.patchkamer.follower (voorheen Volger, nl.patchkamer.volger); presets en songs uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang, poortnamen per taal in i18n). Tekenen via host.frame met een ResizeObserver en een kleurcache; de kleuren komen uit de host.
//          De worklet begrenst de ingang (NaN wordt 0, ±16 is het plafond), accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug; normaal geluid en de drie stuursignalen
//          zijn bit-identiek aan 1.8.0. setState negeert onbekende velden en kapt getallen af op hun bereik.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// Follower: een envelope follower. Hij zet audio om in sturing: drie signalen uit één ingang,
//   Niveau (hoe luid), Transiënt (een tik bij elke aanslag) en Helderheid (hoeveel hoog er in zit).
// Kies per doelparameter welk signaal en hoe diep (zoals bij een LFO). Stuurt sample-nauwkeurig waar het doel
// snelle sturing biedt (⚡), anders 30× per seconde. Bij elke aanslag gaat er ook een trig of noot naar buiten,
// zodat een drum of synth op de maat van een ander geluid kan meespelen. Het geluid zelf gaat ongewijzigd door.
// Zonder AudioWorklet gaat het geluid wel door, maar stuurt Follower niets.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, Engels staat hieronder; onbekende taal = Engels
const EN = {
  'Alles': 'All', 'Laag (kick, bas)': 'Low (kick, bass)', 'Midden (snare, stem)': 'Mid (snare, voice)', 'Hoog (hats)': 'High (hats)', 'Eigen frequentie': 'Custom frequency',
  'Niveau': 'Level', 'Transiënt': 'Transient', 'Helderheid': 'Brightness',
  'Focus': 'Focus', 'Versterking': 'Gain', 'Aanzet': 'Attack', 'Loslaten': 'Release', 'Vloer': 'Floor', 'Bereik': 'Range', 'Uitslag': 'Output range',
  '0 … +1 (alleen omhoog)': '0 … +1 (upward only)', '−1 … +1 (rond het midden)': '−1 … +1 (around the centre)',
  'Richting': 'Direction', 'Luider = meer': 'Louder = more', 'Luider = minder (omgekeerd)': 'Louder = less (inverted)',
  'Aanslag-gevoeligheid': 'Onset sensitivity', 'Transiënt-verval': 'Transient decay', 'Minimale afstand': 'Minimum spacing', 'Poort': 'Gate',
  'Aanslagen sturen': 'Send onsets as', 'Trig spoor {0}': 'Trig lane {0}', 'Noot': 'Note',
  'niveau, transiënt en helderheid': 'level, transient and brightness',
  'Trek een <b>audiokabel</b> naar <b>Luistert naar</b> (bijvoorbeeld de drums), en een <b>paarse kabel</b> van <b>Follower</b> naar de Mod-ingang van een apparaat. Kies onderaan per parameter: Niveau, Transiënt of Helderheid, en hoe diep. Bij elke aanslag gaat er ook een trig uit via <b>Aanslagen</b>.':
    'Pull an <b>audio cable</b> to <b>Listens to</b> (for example the drums), and a <b>purple cable</b> from <b>Follower</b> to the Mod input of a device. Below, choose per parameter: Level, Transient or Brightness, and how deep. On every onset a trig also goes out through <b>Onsets</b>.',
  'AudioWorklet niet beschikbaar: Follower stuurt niets (het geluid gaat wel door).': 'AudioWorklet unavailable: Follower controls nothing (the sound still passes through).',
  'Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Follower</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.':
    'Nothing connected yet. Pull a <b>purple cable</b> from the output <b>Follower</b> to the <b>Mod</b> input of a device. Then choose here which parameters move along and by how much.',
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
.mk .intro{color:var(--muted,#8a93a3);font-size:11px;line-height:1.45;margin:0}
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
// toewijzing: welke parameters van welk doel deze modulator stuurt, met diepte (−100..100% van het bereik)
function mkAssign(ctx, host, selfRef, opt) {
  const tx = opt.tx, me = () => (typeof selfRef === 'function' ? selfRef() : selfRef);
  // opt: { sources:[[id,naam]], valueAt(src) -> −1..1, signal(src) -> AudioNode|null, title, tx }
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
  function tick() {   // trage route: 30× per seconde voor alles wat niet snel verbonden is
    A.targets.forEach(T => { const o = {}; T.params.forEach(p => { const s = get(T.id, p.id); if (!s || !s.d) return; const f = A.fastNodes.get(key(T.id, p.id)); if (f && f.ok) return;
      o[p.id] = clamp(opt.valueAt(s.s || opt.sources[0][0]) * s.d, -1, 1); }); host.modulate(me(), T.id, o); });
  }
  function count(T) { return T.params.filter(p => { const s = get(T.id, p.id); return s && s.d; }).length; }
  function paint() {
    const box = A.box; if (!box) return; box.innerHTML = ''; A.rows = [];
    const real = A.targets.filter(T => T.params.length);
    if (!real.length) { const e = h('div', 'empty'); e.innerHTML = tx('Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Follower</b> naar de ingang <b>Mod</b> van een apparaat. Kies daarna hier welke parameters meebewegen en hoeveel.'); box.appendChild(e); return; }
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

// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

const WNAME = 'nl-patchkamer-follower-1-11-0';
const WORKLET = `
const IN_MAX = 16;
const GUARD = ['x1','x2','e','ef','es','b1','b2','lp','hp','eh','ea','tr'];
class Follower extends AudioWorkletProcessor{
  constructor(){ super(); this.s={att:5,rel:150,gain:0,floor:-50,range:40,focus:'alles',freq:1000,pol:'uni',inv:false,tsens:0.5,tdec:120,hold:60,gate:-60};
    this.x1=0; this.x2=0; this.e=0; this.ef=0; this.es=0; this.b1=0; this.b2=0; this.lp=0; this.hp=0; this.eh=0; this.ea=0; this.tr=0; this.since=1e9; this.n=0; this.l1=0; this.l2=0; this.l3=0; this.onsets=[];
    this.port.onmessage=e=>{ const m=e.data||{}; if(m.type!=='set'||!m.s) return;
      for(const k in m.s){ if(!(k in this.s)) continue; const v=m.s[k], cur=this.s[k];
        if(typeof cur==='number'){ if(typeof v==='number'&&Number.isFinite(v)) this.s[k]=v; }
        else if(typeof cur==='boolean'){ if(typeof v==='boolean') this.s[k]=v; }
        else if(k==='focus'){ if(v==='alles'||v==='laag'||v==='midden'||v==='hoog'||v==='eigen') this.s[k]=v; }
        else if(k==='pol'){ if(v==='uni'||v==='bi') this.s[k]=v; } } }; }
  process(ins,outs){ const s=this.s, sr=sampleRate, I=ins[0], L=I&&I[0]?I[0]:null, R=I&&I[1]?I[1]:L, N=outs[0][0].length;
    const T=outs[0], O1=outs[1][0], O2=outs[2][0], O3=outs[3][0];
    const ka=Math.exp(-1/(Math.max(0.1,s.att)*0.001*sr)), kr=Math.exp(-1/(Math.max(1,s.rel)*0.001*sr)), kf=Math.exp(-1/(0.0008*sr)), ks=Math.exp(-1/(0.03*sr)), kd=Math.exp(-1/(Math.max(5,s.tdec)*0.001*sr));
    const kh=Math.exp(-1/(0.02*sr)), g=Math.pow(10,s.gain/20);
    // focusfilter (banddoorlaat, laag of hoog)
    const f=s.focus==='laag'?150:s.focus==='hoog'?5000:s.focus==='midden'?1000:s.freq, w=2*Math.PI*Math.min(sr*0.45,f)/sr, q=s.focus==='eigen'?4:0.9, al=Math.sin(w)/(2*q), cw=Math.cos(w), a0=1+al;
    const c1=1-Math.exp(-2*Math.PI*f/sr), c2=1-Math.exp(-2*Math.PI*2500/sr);
    const thr=1.6+(1-s.tsens)*3.5, holdS=s.hold*0.001*sr, gateLin=Math.pow(10,s.gate/20);
    for(let t=0;t<N;t++){ let xl=L?L[t]:0, xr=R?R[t]:0;
      // vangnet: NaN, ±Infinity of een absurde waarde zou de volgers voorgoed vergiftigen
      if(!(xl>-IN_MAX&&xl<IN_MAX)) xl=xl!==xl?0:xl>0?IN_MAX:-IN_MAX;
      if(!(xr>-IN_MAX&&xr<IN_MAX)) xr=xr!==xr?0:xr>0?IN_MAX:-IN_MAX;
      T[0][t]=xl; if(T[1]) T[1][t]=xr; const m=(xl+xr)*0.5*g;
      let y=m; if(s.focus==='laag'){ this.lp+=(m-this.lp)*c1; y=this.lp; } else if(s.focus==='hoog'){ this.lp+=(m-this.lp)*c1; y=m-this.lp; } else if(s.focus==='midden'||s.focus==='eigen'){ const yb=(al*m-al*this.x2-(-2*cw)*this.b1-(1-al)*this.b2)/a0; this.x2=this.x1; this.x1=m; this.b2=this.b1; this.b1=yb; y=yb; }
      const a=Math.abs(y);
      this.e=a>this.e?a+(this.e-a)*ka:a+(this.e-a)*kr;
      // transiënt: snelle tegen trage omhullende
      this.ef=a>this.ef?a:a+(this.ef-a)*kf; this.es=a+(this.es-a)*ks; this.since++;
      if(this.ef>gateLin&&this.ef>this.es*thr&&this.since>holdS){ this.tr=1; this.since=0; this.onsets.push({o:t,v:Math.min(1,this.ef*2)}); }
      this.tr*=kd;
      // helderheid: hoog-aandeel
      this.hp+=(m-this.hp)*c2; const hi=Math.abs(m-this.hp), all=Math.abs(m); this.eh+=(hi-this.eh)*(1-kh); this.ea+=(all-this.ea)*(1-kh);
      let lv=0; if(this.e>gateLin){ const db=20*Math.log10(this.e+1e-9); lv=Math.min(1,Math.max(0,(db-s.floor)/Math.max(1,s.range))); }
      let br=this.ea>1e-5?Math.min(1,this.eh/this.ea*1.4):0;
      let v1=lv, v2=this.tr, v3=br;
      if(s.inv){ v1=1-v1; v2=1-v2; v3=1-v3; }
      if(s.pol==='bi'){ v1=v1*2-1; v2=v2*2-1; v3=v3*2-1; }
      if(!(v1>=-1&&v1<=1)) v1=0; if(!(v2>=-1&&v2<=1)) v2=0; if(!(v3>=-1&&v3<=1)) v3=0;
      O1[t]=v1; O2[t]=v2; O3[t]=v3; this.l1=v1; this.l2=v2; this.l3=v3; }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van de sturing voorgoed te vergiftigen
    for(let i=0;i<GUARD.length;i++){ const k=GUARD[i]; if(!(Math.abs(this[k])<1e6)) this[k]=0; }
    if((this.n+=1)%4===0||this.onsets.length){ this.port.postMessage({v:[this.l1,this.l2,this.l3],on:this.onsets.map(x=>({t:currentTime+x.o/sr,v:x.v}))}); this.onsets=[]; }
    return true; } }
registerProcessor('${WNAME}', Follower);`;

const SRC_IDS = ['niveau', 'transient', 'helder'];   // sleutels in de state (blijven gelijk voor oude presets)
const SRC_NAMES = ['Niveau', 'Transiënt', 'Helderheid'];
const FOCUS = [['alles', 'Alles'], ['laag', 'Laag (kick, bas)'], ['midden', 'Midden (snare, stem)'], ['hoog', 'Hoog (hats)'], ['eigen', 'Eigen frequentie']];
const DEF = () => ({ att: 5, rel: 150, gain: 0, floor: -50, range: 40, focus: 'alles', freq: 1000, pol: 'uni', inv: false, tsens: 0.5, tdec: 120, hold: 60, gate: -60, trigOut: 'ch1', trigNote: 60, sel: {} });
// bereiken voor setState (§13)
const RANGE = { att: [0.1, 200], rel: [5, 3000], gain: [-24, 36], floor: [-90, -10], range: [6, 80], freq: [40, 16000], tsens: [0, 1], tdec: [10, 1000], hold: [10, 500], gate: [-90, -10], trigNote: [24, 96] };

export default {
  id: 'nl.patchkamer.follower', name: 'Follower', version: '1.11.0', kind: 'modulator', category: 'mod',
  ui: { width: 760, minWidth: 380 },
  i18n: { en: { ports: { in: 'Listens to', out: 'Through', trig: 'Onsets' } } },
  ports: { audioIn: [{ id: 'in', name: 'Luistert naar' }], audioOut: [{ id: 'out', name: 'Door' }], eventIn: [], eventOut: [{ id: 'trig', name: 'Aanslagen' }], modIn: [], modOut: [{ id: 'mod', name: 'Follower' }] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const SRC = SRC_IDS.map((id, i) => [id, tx(SRC_NAMES[i])]);
    const S = DEF(); let self, dead = false, node = null, ok = false, ui = null, stopDraw = null; const last = { niveau: 0, transient: 0, helder: 0 }; const hist = [[], [], []]; let lastFlash = -1e9;
    let cw = 0, ch = 0, ro = null, col = null, colT = 0;
    const input = ctx.createGain(), out = ctx.createGain(), thru = ctx.createGain(); input.connect(thru).connect(out);
    const sig = [ctx.createGain(), ctx.createGain(), ctx.createGain()];   // vaste bronknopen voor de snelle route
    const asg = mkAssign(ctx, host, () => self, { sources: SRC, valueAt: s => last[s] || 0, signal: s => sig[Math.max(0, SRC.findIndex(x => x[0] === s))], title: 'Follower', tx });
    const send = () => { if (node) node.port.postMessage({ type: 'set', s: { att: S.att, rel: S.rel, gain: S.gain, floor: S.floor, range: S.range, focus: S.focus, freq: S.freq, pol: S.pol, inv: S.inv, tsens: S.tsens, tdec: S.tdec, hold: S.hold, gate: S.gate } }); };
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 4, outputChannelCount: [2, 1, 1, 1], channelCount: 2, channelCountMode: 'explicit' });
      input.disconnect(thru); input.connect(node); node.connect(out, 0); for (let i = 0; i < 3; i++) node.connect(sig[i], i + 1);
      node.port.onmessage = e => { const m = e.data; if (!m) return;
        if (Array.isArray(m.v) && m.v.every(Number.isFinite)) { last.niveau = m.v[0]; last.transient = m.v[1]; last.helder = m.v[2]; }
        if (m.on && m.on.length) for (const o of m.on) { if (!Number.isFinite(o.t) || !Number.isFinite(o.v)) continue; lastFlash = performance.now(); emitOnset(o.t, o.v); } };
      ok = true; send(); asg.rewire(); paintStatus(); }).catch(() => { ok = false; paintStatus(); });
    // de laatste waarden in een geschiedenis voor de grafiek; ook de trage sturing loopt hier
    const timer = setInterval(() => { if (dead) return; asg.tick(); hist.forEach((hh, i) => { hh.push(last[SRC_IDS[i]]); if (hh.length > 300) hh.shift(); }); }, 33);
    function emitOnset(t, v) { try { const time = Math.max(ctx.currentTime, t + 0.005), vel = clamp(0.4 + v * 0.6, 0, 1);
        if (S.trigOut === 'noot') host.emit(self, 'trig', { type: 'note', note: S.trigNote, vel, time, dur: 0.12 }); else host.emit(self, 'trig', { type: 'trig', lane: S.trigOut, vel, time }); } catch (e) {} }
    // ---------- UI ----------
    function build(root) { const mk = h('div', 'mk'); root.appendChild(mk);
      const intro = h('p', 'intro'); intro.innerHTML = tx('Trek een <b>audiokabel</b> naar <b>Luistert naar</b> (bijvoorbeeld de drums), en een <b>paarse kabel</b> van <b>Follower</b> naar de Mod-ingang van een apparaat. Kies onderaan per parameter: Niveau, Transiënt of Helderheid, en hoe diep. Bij elke aanslag gaat er ook een trig uit via <b>Aanslagen</b>.'); mk.appendChild(intro);
      const cv = h('canvas'); cv.style.height = '96px'; cv.setAttribute('aria-label', tx('niveau, transiënt en helderheid')); mk.appendChild(cv);
      const st = h('div', 'intro'); mk.appendChild(st);
      const b1 = h('div', 'box'), r1 = h('div', 'row'), r2 = h('div', 'row'), r3 = h('div', 'row'); b1.append(r1, r2, r3); mk.appendChild(b1);
      const fs = mkSelect(r1, tx('Focus'), FOCUS.map(([v, t]) => [v, tx(t)]), S.focus, v => { S.focus = v; send(); });
      const fq = mkSlider(r1, tx('Eigen frequentie'), 0, 1, 0.001, Math.log(S.freq / 40) / Math.log(400), x => Math.round(40 * 400 ** x) + ' Hz', x => { S.freq = 40 * 400 ** x; send(); });
      const gn = mkSlider(r1, tx('Versterking'), -24, 36, 0.5, S.gain, v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', v => { S.gain = v; send(); });
      const at = mkSlider(r2, tx('Aanzet'), 0, 1, 0.001, Math.log(S.att / 0.1) / Math.log(2000), x => (0.1 * 2000 ** x).toFixed(1) + ' ms', x => { S.att = 0.1 * 2000 ** x; send(); });
      const rl = mkSlider(r2, tx('Loslaten'), 0, 1, 0.001, Math.log(S.rel / 5) / Math.log(600), x => Math.round(5 * 600 ** x) + ' ms', x => { S.rel = 5 * 600 ** x; send(); });
      const fl = mkSlider(r2, tx('Vloer'), -90, -10, 1, S.floor, v => v + ' dB', v => { S.floor = v; send(); });
      const rg = mkSlider(r2, tx('Bereik'), 6, 80, 1, S.range, v => v + ' dB', v => { S.range = v; send(); });
      const pl = mkSelect(r3, tx('Uitslag'), [['uni', tx('0 … +1 (alleen omhoog)')], ['bi', tx('−1 … +1 (rond het midden)')]], S.pol, v => { S.pol = v; send(); });
      const iv = mkSelect(r3, tx('Richting'), [['n', tx('Luider = meer')], ['i', tx('Luider = minder (omgekeerd)')]], S.inv ? 'i' : 'n', v => { S.inv = v === 'i'; send(); });
      const b2 = h('div', 'box'), r4 = h('div', 'row'), r5 = h('div', 'row'); b2.append(r4, r5); mk.appendChild(b2);
      const ts = mkSlider(r4, tx('Aanslag-gevoeligheid'), 0, 1, 0.01, S.tsens, v => Math.round(v * 100) + '%', v => { S.tsens = v; send(); });
      const td = mkSlider(r4, tx('Transiënt-verval'), 0, 1, 0.001, Math.log(S.tdec / 10) / Math.log(100), x => Math.round(10 * 100 ** x) + ' ms', x => { S.tdec = 10 * 100 ** x; send(); });
      const ho = mkSlider(r4, tx('Minimale afstand'), 10, 500, 1, S.hold, v => v + ' ms', v => { S.hold = v; send(); });
      const gt = mkSlider(r4, tx('Poort'), -90, -10, 1, S.gate, v => v + ' dB', v => { S.gate = v; send(); });
      const tr = mkSelect(r5, tx('Aanslagen sturen'), [...Array.from({ length: 8 }, (_, i) => ['ch' + (i + 1), tx('Trig spoor {0}', i + 1)]), ['noot', tx('Noot')]], S.trigOut, v => { S.trigOut = v; });
      const tn = mkSlider(r5, tx('Noot'), 24, 96, 1, S.trigNote, v => { const n = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']; return n[v % 12] + (Math.floor(v / 12) - 1); }, v => { S.trigNote = v; });
      const ab = h('div', 'box asg'); mk.appendChild(ab); asg.mount(ab);
      ui = { cv, g: cv.getContext('2d'), st, set: () => { fs.set(S.focus); fq.set(Math.log(S.freq / 40) / Math.log(400)); gn.set(S.gain); at.set(Math.log(S.att / 0.1) / Math.log(2000)); rl.set(Math.log(S.rel / 5) / Math.log(600)); fl.set(S.floor); rg.set(S.range); pl.set(S.pol); iv.set(S.inv ? 'i' : 'n'); ts.set(S.tsens); td.set(Math.log(S.tdec / 10) / Math.log(100)); ho.set(S.hold); gt.set(S.gate); tr.set(S.trigOut); tn.set(S.trigNote); } };
      cw = cv.clientWidth; ch = cv.clientHeight; col = null;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const r = es[0] && es[0].contentRect; if (r) { cw = r.width; ch = r.height; } }); ro.observe(cv); }
      if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
      paintStatus(); stopLoop(); stopDraw = tekenLus(host, self, draw, 30); }
    const onSkin = () => { col = null; };
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    function paintStatus() { if (ui && ui.st) ui.st.textContent = ok ? '' : tx('AudioWorklet niet beschikbaar: Follower stuurt niets (het geluid gaat wel door).'); }
    function readColors() { const cs = getComputedStyle(ui.cv); colT = performance.now(); col = [cs.getPropertyValue('--mod').trim() || '#b48cff', cs.getPropertyValue('--event').trim() || '#f4a261', cs.getPropertyValue('--audio').trim() || '#4fd1c5']; }
    function draw() { if (dead || !ui) return; const cv = ui.cv, w = cw, hh = ch; if (!w || !hh) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      const g = ui.g; if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, hh);
      const bi = S.pol === 'bi', y = v => bi ? hh / 2 - v * hh * 0.45 : hh - 4 - v * (hh - 8);
      hist.forEach((s, k) => { g.strokeStyle = col[k]; g.lineWidth = k === 0 ? 2 : 1.3; g.beginPath(); s.forEach((v, i) => { const x = i / 299 * w; i ? g.lineTo(x, y(v)) : g.moveTo(x, y(v)); }); g.stroke(); });
      g.font = '10px monospace'; SRC_NAMES.forEach((t, k) => { g.fillStyle = col[k]; g.fillText(tx(t), 6 + k * 80, 12); });
      if (performance.now() - lastFlash < 250) { g.fillStyle = col[1]; g.globalAlpha = 0.25; g.fillRect(w - 14, 0, 14, hh); g.globalAlpha = 1; } }
    self = {
      inputs: { in: input }, outputs: { out },
      mount(el) { const holder = document.createElement('div'); el.appendChild(holder); const root = holder.attachShadow({ mode: 'open' }); root.addEventListener('pointerdown', e => e.stopPropagation()); const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); build(root); },
      unmount() { stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); asg.unmount(); ui = null; },
      onModTargets(list) { asg.setTargets(list); },
      getState() { const o = {}; Object.keys(DEF()).forEach(k => { if (k !== 'sel') o[k] = S[k]; }); o.sel = asg.getState(); return o; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = DEF();
        for (const k in RANGE) S[k] = typeof s[k] === 'number' && Number.isFinite(s[k]) ? clamp(s[k], RANGE[k][0], RANGE[k][1]) : d[k];
        S.trigNote = Math.round(S.trigNote);
        S.focus = FOCUS.some(f => f[0] === s.focus) ? s.focus : d.focus; S.pol = s.pol === 'uni' || s.pol === 'bi' ? s.pol : d.pol; S.inv = typeof s.inv === 'boolean' ? s.inv : d.inv;
        S.trigOut = typeof s.trigOut === 'string' && /^(ch[1-8]|noot)$/.test(s.trigOut) ? s.trigOut : d.trigOut;
        asg.setState(s.sel); send(); if (ui) ui.set(); },
      destroy() { if (dead) return; dead = true; clearInterval(timer); stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); asg.destroy(); try { input.disconnect(); thru.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } sig.forEach(x => x.disconnect()); out.disconnect(); } catch (e) {} },
    };
    return self;
  },
};
