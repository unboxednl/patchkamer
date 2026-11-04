// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Pump en nieuwe id nl.patchkamer.pump (voorheen Pomp · sidechain, nl.patchkamer.pomp); presets en songs uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang, poortnamen per taal in i18n), presetnamen in het Engels (de oude Nederlandse namen worden bij het laden herkend), kleuren uit de host, tekenen via host.frame.
//          Bewaker: de worklet begrenst de ingangen (±16 = +24 dB), zet NaN op 0, accepteert alleen eindige parameters en zet een ontspoorde toestand terug. Normaal geluid is bit-identiek aan de vorige versie.
/** Pump — sidechain-compressor ("ducker"): de kick drukt de bas en pads omlaag, het klassieke pompen.
 * Drie manieren om te pompen:
 *  - Sidechain: luistert naar de ingang 'Sidechain' (bijv. de kick), met een luisterfilter zodat alleen het laag telt;
 *  - Trigger: elke trig of noot op de ingang 'Trigger' start een duik, sample-nauwkeurig;
 *  - Klok: duikt vanzelf op elke tel (of 1/8, 1/2, 1/16) van de host, zonder kabel.
 * Slimmigheden: alleen het laag (of hoog) laten duiken, release op tempo, curvevorm, parallel mengen, luisteren naar de
 * sidechain om het filter in te stellen, en een grafiek met wat er gebeurt.
 */

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const NL = {
  title: 'PUMP', sub: 'Laat de bas en pads wijken voor de kick. Sidechain luistert naar een tweede audio-ingang, Trigger naar trigs of noten, Klok pompt vanzelf op het tempo.',
  preset: 'Preset', source: 'Bron', every: 'Klok: elke', what: 'Wat duikt', all: 'Het hele signaal', lowOnly: 'Alleen het laag', highOnly: 'Alleen het hoog',
  listens: 'Sidechain luistert naar', lf: 'Laag (kick)', full: 'Alles', hf: 'Hoog (hats)',
  on: 'Aan', off: 'Uit (doorlaten)', sync: 'Release volgt tempo', syncTip: 'Trigger en Klok: de duik herstelt precies voor de volgende slag',
  listen: 'Luister naar sidechain', listenTip: 'Hoor wat de detector hoort (om het luisterfilter in te stellen)', test: 'Test duik', aria: 'Verloop van de demping',
  failed: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.', dbl: 'dubbelklik: standaard',
  note: 'Tip: zet Pump op de bas of pads, kies Klok 1/4 en Release volgt tempo: direct het bekende pompen, zonder kabels. Met Alleen het laag blijft de bovenkant van een pad staan terwijl de bas wijkt voor de kick. Sidechain: trek de kick (bijvoorbeeld een losse drumuitgang) naar de ingang Sidechain.',
  g0: 'Duik', g1: 'Sidechain-detector', g2: 'Klank',
  m_sc: 'Sidechain (audio)', m_trig: 'Trigger (events)', m_klok: 'Klok (vanzelf)',
  d16: '1/16', d8: '1/8', d4: '1/4 (elke tel)', d2: '1/2', d1: 'hele maat',
  depth: 'Diepte', depth_t: 'hoe ver het signaal omlaag gaat', rel: 'Release', rel_t: 'hoe snel het terugkomt', att: 'Attack', hold: 'Hold', hold_t: 'Trigger en Klok: zo lang blijft het helemaal omlaag',
  curve: 'Curve', curve_t: '0 = recht terug, 1 = laat en snel terug (strak pompen)', thr: 'Drempel', thr_t: 'Sidechain: vanaf dit niveau duikt het', ratio: 'Ratio', scfreq: 'Luisterfilter',
  xo: 'Kantelpunt', xo_t: 'grens tussen laag en hoog', mix: 'Mix', mix_t: 'parallel: deel van het geduikte signaal', makeup: 'Make-up',
  tail: 'Release op tempo', tail_t: 'deel van de afstand tot de volgende slag, als Release volgt tempo aan staat',
};
const EN = {
  title: 'PUMP', sub: 'Makes the bass and pads give way to the kick. Sidechain listens to a second audio input, Trigger to trigs or notes, Clock pumps by itself on the tempo.',
  preset: 'Preset', source: 'Source', every: 'Clock: every', what: 'What ducks', all: 'The whole signal', lowOnly: 'Low end only', highOnly: 'High end only',
  listens: 'Sidechain listens to', lf: 'Low (kick)', full: 'Everything', hf: 'High (hats)',
  on: 'On', off: 'Off (pass through)', sync: 'Release follows tempo', syncTip: 'Trigger and Clock: the duck recovers right before the next beat',
  listen: 'Listen to sidechain', listenTip: 'Hear what the detector hears (to set the detector filter)', test: 'Test duck', aria: 'Gain reduction over time',
  failed: 'AudioWorklet unavailable: the sound passes through unchanged.', dbl: 'double-click: default',
  note: 'Tip: put Pump on the bass or pads, choose Clock 1/4 and Release follows tempo: the familiar pumping at once, without cables. With Low end only, the top of a pad stays put while the bass gives way to the kick. Sidechain: patch the kick (for example a separate drum output) into the Sidechain input.',
  g0: 'Duck', g1: 'Sidechain detector', g2: 'Tone',
  m_sc: 'Sidechain (audio)', m_trig: 'Trigger (events)', m_klok: 'Clock (automatic)',
  d16: '1/16', d8: '1/8', d4: '1/4 (every beat)', d2: '1/2', d1: 'whole bar',
  depth: 'Depth', depth_t: 'how far the signal ducks', rel: 'Release', rel_t: 'how fast it comes back', att: 'Attack', hold: 'Hold', hold_t: 'Trigger and Clock: how long it stays fully down',
  curve: 'Curve', curve_t: '0 = straight back, 1 = late and fast back (tight pumping)', thr: 'Threshold', thr_t: 'Sidechain: it ducks from this level', ratio: 'Ratio', scfreq: 'Detector filter',
  xo: 'Crossover', xo_t: 'split between low and high', mix: 'Mix', mix_t: 'parallel: share of the ducked signal', makeup: 'Make-up',
  tail: 'Tempo release', tail_t: 'share of the distance to the next beat, when Release follows tempo is on',
};
// presetnamen uit de vorige versie (Nederlands) worden bij het laden herkend
const LEGACY = { 'Klassiek pompen': 'Classic pump', 'Alleen het laag': 'Low end only', 'Kick als sidechain': 'Kick as sidechain', 'Zacht ademen': 'Soft breathing', 'Gated (1/16)': 'Gated (1/16)', 'Trigger van Regie': 'Trigger from sequencer', 'Parallel (subtiel)': 'Parallel (subtle)', 'Eigen': 'Custom' };

// ---------- UI-hulpjes ----------
const UK_CSS = (acc) => `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:${acc};--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px}
h2{margin:0;font-size:18px;letter-spacing:1.5px;color:var(--u-ink)} .sub{margin:3px 0 10px;color:var(--muted,#97a1ad);font-size:12px;line-height:1.45}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:var(--u-acc);border-color:var(--u-acc);color:var(--well,#14100a)}
canvas{display:block;width:100%;border-radius:6px;background:var(--well,#0c0f13)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
.note{font-size:11px;color:var(--muted,#97a1ad);line-height:1.5;margin:8px 0 0} .stt{font-size:11px;color:var(--mod,#b48cff);margin:4px 0}
.big{font-family:var(--mono,monospace);font-size:20px;color:var(--u-ink)}`;
const ukClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ukFinite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? ukClamp(x, a, b) : d;
const ukEl = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const ukStop = e => e.stopPropagation();
function ukShadow(hostEl, css) { const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow({ mode: 'open' }); ukEl(sh, 'style').textContent = css; sh.addEventListener('pointerdown', ukStop); sh.addEventListener('keydown', ukStop); return ukEl(sh, 'div', 'app'); }
function ukSelect(p, label, opts, value, change) { const box = ukEl(p, 'label', 'sel'); ukEl(box, 'span', '', label); const s = ukEl(box, 'select'); for (const [v, t] of opts) { const o = ukEl(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); return s; }
const ukToS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
const ukFromS = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function ukFmt(d, v) { const u = d.unit || ''; if (u === '%') return Math.round(v * 100) + '%'; if (u === 'ms') return v < 1 ? v.toFixed(2) + ' ms' : v < 100 ? v.toFixed(1) + ' ms' : Math.round(v) + ' ms';
  if (u === 'Hz') return v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz'; if (u === 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB'; if (u === ':1') return v.toFixed(1) + ':1'; return v.toFixed(2) + (u ? ' ' + u : ''); }
// schuifregelaars voor een spec {id:{name,min,max,scale,unit,g}} in groepen; set krijgt de nieuwe waarde
function ukSliders(parent, spec, groups, set, defaults, dbl) { const handles = {};
  groups.forEach((gname, gi) => { ukEl(parent, 'h3', '', gname); const g = ukEl(parent, 'div', 'grid');
    for (const [id, d] of Object.entries(spec)) { if (d.g !== gi) continue; const c = ukEl(g, 'div', 'c'), lab = ukEl(c, 'div', 'lab'); ukEl(lab, 'span', '', d.name).title = d.name; const o = ukEl(lab, 'output');
      const inp = ukEl(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', d.name); inp.title = d.name + (d.tip ? ' — ' + d.tip : '') + ' · ' + dbl;
      inp.oninput = () => { const v = ukFromS(d, +inp.value); set(id, v); o.textContent = ukFmt(d, v); };
      inp.ondblclick = () => { set(id, defaults[id]); handles[id].set(defaults[id]); };
      handles[id] = { set(v) { inp.value = String(ukToS(d, v)); o.textContent = ukFmt(d, v); }, el: c }; } });
  return handles; }
// canvas zonder layout-werk per frame: de breedte komt van een ResizeObserver, de hoogte wordt één keer gezet
function ukCanvas(cv, h) { const dpr = ukClamp(globalThis.devicePixelRatio || 1, 1, 3);
  if (!cv._ro) { cv._cw = cv.clientWidth || 300; try { cv._ro = new ResizeObserver(() => { cv._cw = cv.clientWidth || cv._cw; }); cv._ro.observe(cv); } catch { } }
  if (cv._h !== h) { cv.style.height = h + 'px'; cv._h = h; } const w = Math.max(160, cv._cw || 300);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const g = cv._g || (cv._g = cv.getContext('2d')); if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h }; }
// CSS-kleuren hooguit één keer per seconde opvragen (en meteen opnieuw na een wissel van kleurstelling)
let ukVarEpoch = 0; try { window.addEventListener('patchkamer-skin', () => { ukVarEpoch++; }); } catch { }
const ukVar = (el, name, d) => { const c = el._ukv || (el._ukv = {}), now = performance.now(), e = c[name];
  if (e && now - e.t < 1000 && e.ep === ukVarEpoch) return e.v; let v = d; try { v = getComputedStyle(el).getPropertyValue(name).trim() || d; } catch { } c[name] = { v, t: now, ep: ukVarEpoch }; return v; };
// tekenen via de klok van de host (alleen als de kaart in beeld is); terugval voor een host zonder host.frame (contract §12b)
const ukLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false; const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); }; raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); }; };

function ukResolve(spec, state, mod) { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = d.nomod ? 0 : (mod[id] || 0); if (!x) continue; e[id] = ukClamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } return e; }
function ukParams(spec, lane, laneName) { return Object.entries(spec).filter(([, d]) => !d.nomod).map(([id, d]) => ({ id, name: d.name, lane, laneName, min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: !d.role || !['level', 'pitch'].includes(d.role) })); }

const WNAME = 'nl-patchkamer-pump-1-11-0';
const WORKLET = `
const IN_MAX = 16;
const ENUM = { mode: ['sc', 'trig', 'klok'], band: ['alles', 'laag', 'hoog'], scf: ['lp', 'hp', 'full'] };
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
class Pump extends AudioWorkletProcessor{
  constructor(){ super(); this.s={mode:'sc',depth:0.8,thr:-24,ratio:6,att:3,hold:20,rel:180,curve:0.5,band:'alles',xo:120,mix:1,makeup:0,listen:false,scf:'lp',scfreq:150};
    this.env=0; this.lp=[0,0]; this.sl=0; this.sh=0; this.q=[]; this.duckAt=-1; this.n=0; this.minG=1; this.scPk=0; this.g=1;
    this.port.onmessage=e=>{ const m=e.data||{};
      if(m.type==='set'){ const o=m.s||{}; for(const k in o){ if(!(k in this.s)) continue; const v=o[k], cur=this.s[k];
          if(typeof cur==='number'){ if(typeof v==='number'&&Number.isFinite(v)) this.s[k]=v; }
          else if(typeof cur==='boolean'){ if(typeof v==='boolean') this.s[k]=v; }
          else if(ENUM[k]&&ENUM[k].includes(v)) this.s[k]=v; } }
      else if(m.type==='duck'&&typeof m.time==='number'&&Number.isFinite(m.time)) this.q.push(m.time); }; }
  process(ins,outs){ const s=this.s, sr=sampleRate, I=ins[0], S=ins[1], O=outs[0], N=O[0].length;
    const iL=I&&I[0]?I[0]:null, iR=I&&I[1]?I[1]:iL, sL=S&&S[0]?S[0]:null, sR=S&&S[1]?S[1]:sL, oL=O[0], oR=O[1]||O[0];
    const ka=Math.exp(-1/(Math.max(0.05,s.att)*0.001*sr)), kr=Math.exp(-1/(Math.max(5,s.rel)*0.001*sr));
    const cx=1-Math.exp(-2*Math.PI*s.xo/sr), cs=1-Math.exp(-2*Math.PI*s.scfreq/sr);
    let starts=[]; if(this.q.length){ const keep=[]; for(const t of this.q){ if(t<currentTime+N/sr) starts.push(Math.max(0,Math.round((t-currentTime)*sr))); else keep.push(t); } this.q=keep; starts.sort((a,b)=>a-b); }
    let si=0; const attS=Math.max(1,s.att*0.001*sr), holdS=s.hold*0.001*sr, relS=Math.max(1,s.rel*0.001*sr), ex=1+s.curve*3;
    for(let t=0;t<N;t++){
      const xl=iL?cl(iL[t]):0, xr=iR?cl(iR[t]):0;
      // sidechain-detector met luisterfilter
      let sc=0; if(sL){ const m=(cl(sL[t])+(sR?cl(sR[t]):cl(sL[t])))*0.5; this.sl+=(m-this.sl)*cs; sc=s.scf==='lp'?this.sl:s.scf==='hp'?m-this.sl:m; }
      const a=Math.abs(sc); if(a>this.scPk) this.scPk=a;
      let g=1;
      if(s.mode==='sc'){ this.env=a>this.env?a+(this.env-a)*ka:a+(this.env-a)*kr; const db=20*Math.log10(this.env+1e-9), over=db-s.thr; const gr=over>0?Math.min(48,over*(1-1/s.ratio)):0; g=Math.pow(10,-gr*s.depth/20); }
      else { while(si<starts.length&&starts[si]<=t){ this.duckAt=0; si++; }
        if(this.duckAt>=0){ const u=this.duckAt++; let d; if(u<attS) d=u/attS; else if(u<attS+holdS) d=1; else { const r=(u-attS-holdS)/relS; d=r<1?Math.pow(1-r,ex):0; if(r>=1) this.duckAt=-1; }
          g=1-s.depth*d; } }
      this.g=g; if(g<this.minG) this.minG=g;
      let yl, yr;
      if(s.listen){ yl=yr=sc; }
      else { if(s.band==='alles'){ yl=xl*g; yr=xr*g; }
        else { this.lp[0]+=(xl-this.lp[0])*cx; this.lp[1]+=(xr-this.lp[1])*cx; const hl=xl-this.lp[0], hr=xr-this.lp[1];
          if(s.band==='laag'){ yl=this.lp[0]*g+hl; yr=this.lp[1]*g+hr; } else { yl=this.lp[0]+hl*g; yr=this.lp[1]+hr*g; } }
        const mk=Math.pow(10,s.makeup/20); yl=(xl*(1-s.mix)+yl*s.mix)*mk; yr=(xr*(1-s.mix)+yr*s.mix)*mk; }
      oL[t]=yl; oR[t]=yr; }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    if(!(this.env>=0&&this.env<1e6)) this.env=0;
    if(!(Math.abs(this.sl)<1e6)) this.sl=0;
    if(!(Math.abs(this.lp[0])<1e6)) this.lp[0]=0;
    if(!(Math.abs(this.lp[1])<1e6)) this.lp[1]=0;
    if(!(this.g>=0&&this.g<=1)) this.g=1;
    if(!(this.minG>=0&&this.minG<=1)) this.minG=1;
    if(!(this.scPk>=0&&this.scPk<1e6)) this.scPk=0;
    if(!(this.duckAt>-2&&this.duckAt<1e9)) this.duckAt=-1;
    if((this.n+=1)%10===0){ this.port.postMessage({gr:-20*Math.log10(this.minG+1e-9),sc:20*Math.log10(this.scPk+1e-9)}); this.minG=1; this.scPk=0; }
    return true; } }
registerProcessor('${WNAME}', Pump);`;

export default {
  id: 'nl.patchkamer.pump', name: 'Pump', version: '1.11.0', kind: 'effect', category: 'effect',
  ui: { width: 720, minWidth: 360 },
  i18n: { en: { ports: { in: 'In', sc: 'Sidechain', out: 'Out', trig: 'Trigger', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }, { id: 'sc', name: 'Sidechain' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [{ id: 'trig', name: 'Trigger' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const D = host && host.lang === 'nl' ? NL : EN;
    const tx = (k, ...a) => { let s = D[k] !== undefined ? D[k] : k; a.forEach((v, i) => { s = s.replace('{' + i + '}', v); }); return s; };
    const clamp = ukClamp;
    let dead = false, node = null, ok = false, mod = {}, eff = {}, meter = { gr: 0, sc: -120 }, hist = [];
    const input = ctx.createGain(), sc = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); bypass.gain.value = 1; input.connect(bypass).connect(out);
    const spec = {
      depth: { name: tx('depth'), min: 0, max: 1, unit: '%', g: 0, tip: tx('depth_t') },
      rel: { name: tx('rel'), min: 20, max: 1500, scale: 'log', unit: 'ms', g: 0, tip: tx('rel_t') },
      att: { name: tx('att'), min: 0.1, max: 60, scale: 'log', unit: 'ms', g: 0 },
      hold: { name: tx('hold'), min: 0, max: 300, unit: 'ms', g: 0, tip: tx('hold_t') },
      curve: { name: tx('curve'), min: 0, max: 1, unit: '%', g: 0, tip: tx('curve_t') },
      thr: { name: tx('thr'), min: -60, max: 0, unit: 'dB', g: 1, tip: tx('thr_t') },
      ratio: { name: tx('ratio'), min: 1, max: 20, scale: 'log', unit: ':1', g: 1 },
      scfreq: { name: tx('scfreq'), min: 40, max: 8000, scale: 'log', unit: 'Hz', g: 1, nomod: true },
      xo: { name: tx('xo'), min: 40, max: 1000, scale: 'log', unit: 'Hz', g: 2, tip: tx('xo_t') },
      mix: { name: tx('mix'), min: 0, max: 1, unit: '%', g: 2, tip: tx('mix_t') },
      makeup: { name: tx('makeup'), min: 0, max: 12, unit: 'dB', g: 2, role: 'level' },
      tail: { name: tx('tail'), min: 0.1, max: 1, unit: '%', g: 2, nomod: true, tip: tx('tail_t') },
    };
    const MODES = [['sc', tx('m_sc')], ['trig', tx('m_trig')], ['klok', tx('m_klok')]], DIVS = [['16', tx('d16')], ['8', tx('d8')], ['4', tx('d4')], ['2', tx('d2')], ['1', tx('d1')]];
    const defaults = { depth: 0.8, rel: 180, att: 3, hold: 20, curve: 0.5, thr: -24, ratio: 6, scfreq: 150, xo: 120, mix: 1, makeup: 0, tail: 0.85, mode: 'klok', div: '4', band: 'alles', scf: 'lp', relSync: true, on: true, preset: 'Classic pump' };
    const presets = {
      'Classic pump': {},
      'Low end only': { band: 'laag', xo: 160, depth: 0.9, curve: 0.6 },
      'Kick as sidechain': { mode: 'sc', scf: 'lp', scfreq: 140, thr: -30, ratio: 10, att: 1, rel: 160, relSync: false },
      'Soft breathing': { depth: 0.35, curve: 0.2, tail: 1, hold: 0 },
      'Gated (1/16)': { div: '16', depth: 1, hold: 30, tail: 0.6, curve: 0.9, att: 0.5 },
      'Trigger from sequencer': { mode: 'trig', depth: 0.85, rel: 220, relSync: false },
      'Parallel (subtle)': { mix: 0.5, depth: 1, makeup: 2 },
    };
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max);
      n.mode = MODES.some(m => m[0] === s.mode) ? s.mode : defaults.mode; n.div = DIVS.some(m => m[0] === s.div) ? s.div : defaults.div;
      n.band = ['alles', 'laag', 'hoog'].includes(s.band) ? s.band : defaults.band; n.scf = ['lp', 'vol', 'hp'].includes(s.scf) ? s.scf : defaults.scf;
      n.relSync = typeof s.relSync === 'boolean' ? s.relSync : defaults.relSync; n.on = typeof s.on === 'boolean' ? s.on : defaults.on;
      const p = typeof s.preset === 'string' && Object.hasOwn(LEGACY, s.preset) ? LEGACY[s.preset] : s.preset;
      n.preset = p === 'Custom' || (typeof p === 'string' && Object.hasOwn(presets, p)) ? p : defaults.preset; return n; }
    let state = normalize({}), listen = false, stepDur = 0.125;
    function relMs() { return state.relSync && state.mode !== 'sc' ? clamp(stepDur * (+state.div ? 16 / +state.div : 4) * 1000 * eff.tail - eff.att - eff.hold, 20, 4000) : eff.rel; }
    function apply() { eff = ukResolve(spec, state, mod);
      if (node) node.port.postMessage({ type: 'set', s: { mode: state.mode, depth: state.on ? eff.depth : 0, thr: eff.thr, ratio: eff.ratio, att: eff.att, hold: eff.hold, rel: relMs(), curve: eff.curve, band: state.band, xo: eff.xo, mix: eff.mix, makeup: eff.makeup, listen, scf: state.scf === 'vol' ? 'full' : state.scf, scfreq: eff.scfreq } }); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.connect(node, 0, 0); sc.connect(node, 0, 1); input.disconnect(bypass); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (!m || !Number.isFinite(m.gr) || !Number.isFinite(m.sc)) return; meter = m; hist.push(m.gr); if (hist.length > 240) hist.shift(); }; apply(); paintStatus(); })
      .catch(() => { ok = false; paintStatus(); });
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, stopDraw = null, statusEl = null;
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('var(--audio,#7ee0a1)'));
      ukEl(app, 'h2', '', tx('title'));
      ukEl(app, 'p', 'sub', tx('sub'));
      const top = ukEl(app, 'div', 'top');
      ui.preset = ukSelect(top, tx('preset'), Object.keys(presets).map(k => [k, k]).concat([['Custom', 'Custom']]), state.preset, v => { if (presets[v]) self.setState({ ...defaults, ...presets[v], preset: v }); });
      ui.mode = ukSelect(top, tx('source'), MODES, state.mode, v => { state.mode = v; eigen(); apply(); paint(); });
      ui.div = ukSelect(top, tx('every'), DIVS, state.div, v => { state.div = v; eigen(); apply(); });
      ui.band = ukSelect(top, tx('what'), [['alles', tx('all')], ['laag', tx('lowOnly')], ['hoog', tx('highOnly')]], state.band, v => { state.band = v; eigen(); apply(); });
      ui.scf = ukSelect(top, tx('listens'), [['lp', tx('lf')], ['vol', tx('full')], ['hp', tx('hf')]], state.scf, v => { state.scf = v; eigen(); apply(); });
      const t2 = ukEl(app, 'div', 'top');
      ui.on = ukEl(t2, 'button', '', ''); ui.on.type = 'button'; ui.on.onclick = () => { state.on = !state.on; apply(); paint(); };
      ui.sync = ukEl(t2, 'button', '', tx('sync')); ui.sync.type = 'button'; ui.sync.title = tx('syncTip'); ui.sync.onclick = () => { state.relSync = !state.relSync; eigen(); apply(); paint(); };
      ui.listen = ukEl(t2, 'button', '', tx('listen')); ui.listen.type = 'button'; ui.listen.title = tx('listenTip'); ui.listen.onclick = () => { listen = !listen; apply(); paint(); };
      ui.test = ukEl(t2, 'button', '', tx('test')); ui.test.type = 'button'; ui.test.onclick = () => { if (node) node.port.postMessage({ type: 'duck', time: ctx.currentTime + 0.01 }); };
      ui.gr = ukEl(t2, 'span', 'big', '0.0 dB');
      cv = ukEl(app, 'canvas'); cv.setAttribute('aria-label', tx('aria'));
      statusEl = ukEl(app, 'p', 'stt');
      ui.k = ukSliders(app, spec, [tx('g0'), tx('g1'), tx('g2')], (id, v) => { state[id] = v; eigen(); apply(); }, defaults, tx('dbl'));
      ukEl(app, 'p', 'note', tx('note'));
      paint(); paintStatus(); stopDraw = ukLoop(host, self, draw, 30); }
    function eigen() { if (state.preset !== 'Custom') { state.preset = 'Custom'; if (ui.preset) ui.preset.value = 'Custom'; } }
    function paintStatus() { if (statusEl) statusEl.textContent = ok ? '' : tx('failed'); }
    function paint() { if (!root) return; ui.preset.value = state.preset; ui.mode.value = state.mode; ui.div.value = state.div; ui.band.value = state.band; ui.scf.value = state.scf;
      ui.on.textContent = state.on ? tx('on') : tx('off'); ui.on.classList.toggle('on', state.on); ui.sync.classList.toggle('on', state.relSync); ui.listen.classList.toggle('on', listen);
      ui.div.parentElement.style.opacity = state.mode === 'klok' ? 1 : 0.4; ui.scf.parentElement.style.opacity = state.mode === 'sc' ? 1 : 0.4;
      for (const [id, k] of Object.entries(ui.k)) { k.set(state[id]); const show = !(['thr', 'ratio', 'scfreq'].includes(id) && state.mode !== 'sc') && !(id === 'xo' && state.band === 'alles') && !(id === 'hold' && state.mode === 'sc') && !(id === 'tail' && (!state.relSync || state.mode === 'sc')) && !(id === 'rel' && state.relSync && state.mode !== 'sc'); k.el.style.opacity = show ? 1 : 0.35; } }
    let grTxt = '';
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, 90); if (g) { const acc = ukVar(cv, '--u-acc', '#7ee0a1'); g.clearRect(0, 0, w, h);
        g.strokeStyle = ukVar(cv, '--line', '#333'); g.lineWidth = 1; [6, 12, 24].forEach(db => { const y = db / 30 * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillStyle = ukVar(cv, '--muted', '#888'); g.font = '9px monospace'; g.fillText('−' + db + ' dB', 4, y - 2); });
        g.fillStyle = acc; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(0, 0); hist.forEach((v, i) => g.lineTo(i / 239 * w, Math.min(1, v / 30) * h)); g.lineTo((hist.length - 1) / 239 * w, 0); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = acc; g.lineWidth = 2; g.beginPath(); hist.forEach((v, i) => { const x = i / 239 * w, y = Math.min(1, v / 30) * h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
      const t = '−' + (meter.gr || 0).toFixed(1) + ' dB'; if (ui.gr && t !== grTxt) { grTxt = t; ui.gr.textContent = t; }
      }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (cv && cv._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; }
    const self = {
      inputs: { in: input, sc }, outputs: { out },
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; const sd = ukFinite(info.stepDur, 0.125, 0.01, 2); if (Math.abs(sd - stepDur) > 1e-4) { stepDur = sd; apply(); }
          if (state.mode === 'klok' && node && state.on) { const every = 16 / +state.div; if ((info.step | 0) % every === 0) node.port.postMessage({ type: 'duck', time: ukFinite(info.time, ctx.currentTime, 0, 1e9) }); } } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'trig' || !e || !node) return; const type = String(e.type || '').toLowerCase(); if (!['trig', 'note', 'noteon'].includes(type) || e.vel === 0) return;
          if (state.mode !== 'trig') return; node.port.postMessage({ type: 'duck', time: Math.max(ctx.currentTime, ukFinite(e.time, ctx.currentTime, 0, 1e9)) }); } catch {} },
      params() { return ukParams(spec, 'pump', 'Pump'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { input.disconnect(); sc.disconnect(); bypass.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } out.disconnect(); } catch {} },
    };
    apply();
    return self;
  },
};
