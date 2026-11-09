// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.2.0 — Uitleg naar about (menu Over De-esser); de UI toont geen uitlegtekst meer.
// 1.1.1 — De reductiemeter (en de kromme in het scherm) toont de werkelijke reductie: bij Uit of mix onder 100% meldde hij nog de volle, niet toegepaste reductie. Het geluid is ongewijzigd.
// 1.1.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de omschrijving staat nu in about.
// 1.0.0 — Patchkamer contract v1.28. Eerste versie: de-esser met sibilantendetectie in een instelbare band (3 tot 10 kHz, bandbreedte in octaven), drempel, ratio, maximale reductie,
//          attack en release, de modi split-band (alleen die band wordt gedempt) en wideband (het hele signaal), luistermodus voor de detectieband, parallelle mix en een reductiemeter.
//          Tweetalig (host.lang), tekenen via host.frame, meter door de host (host.ui.meter).
//          Bewaker: de worklet begrenst de ingang (±16 = +24 dB), zet NaN op 0, accepteert alleen eindige parameters en zet een ontspoorde toestand terug.
/** De-esser — dempt de s-klanken in een stem.
 * Detector: een banddoorlaatfilter (2e orde, 0 dB op de middenfrequentie, bandbreedte in octaven) op het signaal, een piekvolger met 0,5 ms release, per kanaal; de grootste van links en rechts telt.
 * Statische curve: drempel, ratio en een vaste zachte knee van 6 dB; de reductie is begrensd op 'max. reductie'. Een gladmaker in dB geeft attack en release (tijdconstanten, 63%).
 * Split-band: y = x + (g - 1) * band(x): alleen de band wordt gedempt (op de middenfrequentie precies met g). Wideband: y = x * g.
 * Latency: geen.
 */

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const NL = {
  mode: 'Modus', split: 'Split-band (alleen de band)', wide: 'Wideband (alles)', on: 'Aan', off: 'Uit (doorlaten)', listen: 'Luister naar detectieband', listenTip: 'Hoor de band die de detector hoort, om de frequentie en bandbreedte in te stellen',
  aria: 'Frequentieverloop van de de-esser', gr: 'Reductie', lvl: 'Band', failed: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.', dbl: 'dubbelklik: standaard',
  g0: 'Detectie', g1: 'Reductie',
  freq: 'Frequentie', freq_t: 'middenfrequentie van de detectieband (en van de demping in split-band)', bw: 'Bandbreedte', bw_t: 'breedte van de band in octaven: klein = smal en gericht, groot = breed',
  thr: 'Drempel', thr_t: 'niveau van de band waarboven gedempt wordt', ratio: 'Ratio', ratio_t: 'hoeveel dB boven de drempel per dB uit; 100 = oneindig', range: 'Max. reductie', range_t: 'de grootste demping in dB',
  att: 'Attack', att_t: 'tijdconstante: 63% van de reductie bereikt', rel: 'Release', rel_t: 'tijdconstante: 63% van het herstel', mix: 'Mix', mix_t: 'deel van het bewerkte signaal (parallel mengen)',
};
const EN = {
  mode: 'Mode', split: 'Split-band (band only)', wide: 'Wideband (everything)', on: 'On', off: 'Off (pass through)', listen: 'Listen to detection band', listenTip: 'Hear the band the detector hears, to set the frequency and bandwidth',
  aria: 'Frequency response of the de-esser', gr: 'Reduction', lvl: 'Band', failed: 'AudioWorklet unavailable: the sound passes through unchanged.', dbl: 'double-click: default',
  g0: 'Detection', g1: 'Reduction',
  freq: 'Frequency', freq_t: 'centre frequency of the detection band (and of the reduction in split-band)', bw: 'Bandwidth', bw_t: 'width of the band in octaves: small = narrow and focused, large = wide',
  thr: 'Threshold', thr_t: 'level of the band above which it reduces', ratio: 'Ratio', ratio_t: 'dB in per dB out above the threshold; 100 = infinite', range: 'Max reduction', range_t: 'the largest reduction in dB',
  att: 'Attack', att_t: 'time constant: 63% of the reduction reached', rel: 'Release', rel_t: 'time constant: 63% of the recovery', mix: 'Mix', mix_t: 'share of the processed signal (parallel mixing)',
};

// ---------- UI-hulpjes ----------
const UK_CSS = (acc) => `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:${acc};--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:var(--u-acc);border-color:var(--u-acc);color:var(--well,#14100a)}
canvas{display:block;width:100%;border-radius:6px;background:var(--well,#0c0f13)}
.disp{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,230px);gap:10px;align-items:stretch;margin:4px 0 2px}
@container (max-width:430px){.disp{grid-template-columns:minmax(0,1fr)}}
.side{display:flex;flex-direction:column;gap:6px;justify-content:center;min-width:0}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
.stt{font-size:11px;color:var(--mod,#b48cff);margin:4px 0}
.big{font-family:var(--mono,monospace);font-size:22px;color:var(--u-ink)} .small{font-size:11px;color:var(--muted,#97a1ad);line-height:1.4}
.lamp{display:inline-block;min-width:64px;text-align:center;padding:3px 8px;border-radius:5px;border:1px solid var(--line,#39424e);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#97a1ad)} .lamp.lit{background:var(--go,#7ee0a1);border-color:var(--go,#7ee0a1);color:var(--well,#14100a)}`;
const ukClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ukFinite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? ukClamp(x, a, b) : d;
const ukEl = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const ukStop = e => e.stopPropagation();
function ukShadow(hostEl, css) { const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow({ mode: 'open' }); ukEl(sh, 'style').textContent = css; sh.addEventListener('pointerdown', ukStop); sh.addEventListener('keydown', ukStop); return ukEl(sh, 'div', 'app'); }
function ukSelect(p, label, opts, value, change, id) { const box = ukEl(p, 'label', 'sel'); ukEl(box, 'span', '', label); const s = ukEl(box, 'select'); for (const [v, t] of opts) { const o = ukEl(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); if (id) s.setAttribute('data-pk-id', id); return s; }
function ukButton(p, label, tip, id, click) { const b = ukEl(p, 'button', '', label); b.type = 'button'; if (tip) b.title = tip; if (id) b.setAttribute('data-pk-id', id); b.onclick = click; return b; }
const ukToS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
const ukFromS = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function ukFmt(d, v) { const u = d.unit || ''; if (u === '%') return Math.round(v * 100) + '%'; if (u === 'ms') return v < 1 ? v.toFixed(2) + ' ms' : v < 100 ? v.toFixed(1) + ' ms' : Math.round(v) + ' ms';
  if (u === 'Hz') return v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz'; if (u === 'dB') return (v > 0 && !d.noplus ? '+' : '') + v.toFixed(1) + ' dB'; if (u === ':1') return v >= 99.5 ? '∞:1' : v.toFixed(1) + ':1'; if (u === 'oct') return v.toFixed(2) + ' oct'; return v.toFixed(2) + (u ? ' ' + u : ''); }
// schuifregelaars voor een spec {id:{name,min,max,scale,unit,g}} in groepen (groep = {key,label}); set krijgt de nieuwe waarde; elk element krijgt een vast id (contract 12d)
function ukSliders(parent, spec, groups, set, defaults, dbl) { const handles = {};
  groups.forEach((grp, gi) => { ukEl(parent, 'h3', '', grp.label); const g = ukEl(parent, 'div', 'grid');
    for (const [id, d] of Object.entries(spec)) { if (d.g !== gi) continue; const c = ukEl(g, 'div', 'c'), lab = ukEl(c, 'div', 'lab'); ukEl(lab, 'span', '', d.name).title = d.name; const o = ukEl(lab, 'output');
      const inp = ukEl(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', d.name); inp.setAttribute('data-pk-id', id); inp.setAttribute('data-pk-group', grp.key); inp.title = d.name + (d.tip ? ' — ' + d.tip : '') + ' · ' + dbl;
      inp.oninput = () => { const v = ukFromS(d, +inp.value); set(id, v); o.textContent = ukFmt(d, v); };
      inp.ondblclick = () => { set(id, defaults[id]); handles[id].set(defaults[id]); };
      handles[id] = { set(v) { inp.value = String(ukToS(d, v)); o.textContent = ukFmt(d, v); }, el: c }; } });
  return handles; }
// canvas zonder layout-werk per frame: de breedte komt van een ResizeObserver, de hoogte wordt één keer gezet
function ukCanvas(cv, h) { const dpr = ukClamp(globalThis.devicePixelRatio || 1, 1, 3);
  if (!cv._ro) { cv._cw = cv.clientWidth || 300; try { cv._ro = new ResizeObserver(() => { cv._cw = cv.clientWidth || cv._cw; }); cv._ro.observe(cv); } catch { } }
  if (cv._h !== h) { cv.style.height = h + 'px'; cv._h = h; } const w = Math.max(120, cv._cw || 300);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const g = cv._g || (cv._g = cv.getContext('2d')); if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h }; }
// CSS-kleuren hooguit één keer per seconde opvragen (en meteen opnieuw na een wissel van kleurstelling)
let ukVarEpoch = 0; try { window.addEventListener('patchkamer-skin', () => { ukVarEpoch++; }); } catch { }
const ukVar = (el, name, d) => { const c = el._ukv || (el._ukv = {}), now = performance.now(), e = c[name];
  if (e && now - e.t < 1000 && e.ep === ukVarEpoch) return e.v; let v = d; try { v = getComputedStyle(el).getPropertyValue(name).trim() || d; } catch { } c[name] = { v, t: now, ep: ukVarEpoch }; return v; };
// tekenen via de klok van de host (alleen als de kaart in beeld is); terugval voor een host zonder host.frame (contract 12b)
const ukLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false; const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); }; raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); }; };
// reductiemeter door de host laten tekenen (contract 12e); zonder host.ui.meter blijft het getal over
function ukMeter(host, parent, label, id, range, len) { if (!(host && host.ui && typeof host.ui.meter === 'function')) return null;
  try { return host.ui.meter(parent, label, { id, group: 'meters', unit: 'db', range, hold: false, orientation: 'horizontal', length: len || 150, width: 10 }); } catch { return null; } }
function ukResolve(spec, state, mod) { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = d.nomod ? 0 : (mod[id] || 0); if (!x) continue; e[id] = ukClamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } return e; }
function ukParams(spec, lane, laneName) { return Object.entries(spec).filter(([, d]) => !d.nomod).map(([id, d]) => ({ id, name: d.name, lane, laneName, min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: d.drift ?? 0.015, on: d.on ?? (!d.role || !['level', 'pitch'].includes(d.role)) })); }

const DE_KNEE = 6;
function deGr(d, T, iR) { const o = d - T, W = DE_KNEE; if (2 * o < -W) return 0; if (2 * Math.abs(o) <= W) { const t = o + W / 2; return (1 - iR) * t * t / (2 * W); } return o * (1 - iR); }
// grootte van het banddoorlaatfilter (RBJ, 0 dB in het midden) als complex getal bij frequentie f
function deBand(f, f0, bw, sr) { const w0 = 2 * Math.PI * Math.min(f0, 0.45 * sr) / sr, s = Math.sin(w0), al = s * Math.sinh(Math.LN2 / 2 * bw * w0 / s), a0 = 1 + al, b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w0) / a0, a2 = (1 - al) / a0;
  const w = 2 * Math.PI * f / sr, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
  const nr = b0 + b2 * c2, ni = -b2 * s2, dr = 1 + a1 * c1 + a2 * c2, di = -a1 * s1 - a2 * s2, dd = dr * dr + di * di; return [(nr * dr + ni * di) / dd, (ni * dr - nr * di) / dd]; }

const WNAME = 'nl-patchkamer-deesser-1-0-1';
const WORKLET = `
const IN_MAX = 16, LN = 20 / Math.LN10, DB2LIN = Math.LN10 / 20;
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
const fin = (v, lo, hi) => v > lo ? (v < hi ? v : hi) : lo;
// RBJ-biquads (Q vast); coefficienten {b0,b1,b2,a1,a2}
function bqHP(f, sr, Q) { const w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return { b0: (1 + c) / 2 / a0, b1: -(1 + c) / a0, b2: (1 + c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 }; }
function bqLP(f, sr, Q) { const w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return { b0: (1 - c) / 2 / a0, b1: (1 - c) / a0, b2: (1 - c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 }; }
function bqBP(f, sr, bwOct) { const w = 2 * Math.PI * f / sr, s = Math.sin(w), al = s * Math.sinh(Math.LN2 / 2 * bwOct * w / s), a0 = 1 + al; return { b0: al / a0, b1: 0, b2: -al / a0, a1: -2 * Math.cos(w) / a0, a2: (1 - al) / a0 }; }
const BND = { freq: [1000, 16000], bw: [0.1, 4], thr: [-80, 0], ratio: [1, 100], range: [0, 48], att: [0.02, 200], rel: [2, 2000], mix: [0, 1] };
const ENUM = { mode: ['split', 'wide'] };
const KNEE = 6;
function grS(d, T, iR) { const o = d - T; if (2 * o < -KNEE) return 0; if (2 * Math.abs(o) <= KNEE) { const t = o + KNEE / 2; return (1 - iR) * t * t / (2 * KNEE); } return o * (1 - iR); }
class DeEss extends AudioWorkletProcessor{
  constructor(){ super();
    this.s={mode:'split',freq:6500,bw:1,thr:-30,ratio:4,range:10,att:0.5,rel:50,mix:1,on:true,listen:false};
    this.g=0; this.mx=0; this.env=[0,0]; this.z=new Float64Array(4); this.bp=null; this.dirty=true; this.grMax=0; this.lvMax=-180; this.n=0;
    this.port.onmessage=e=>{ const m=e.data||{}; if(m.type!=='set') return; const o=m.s||{}; for(const k in o){ if(!(k in this.s)) continue; const v=o[k], cur=this.s[k];
        if(typeof cur==='number'){ if(typeof v==='number'&&Number.isFinite(v)){ const b=BND[k]; this.s[k]=b?fin(v,b[0],b[1]):v; if(k==='freq'||k==='bw') this.dirty=true; } }
        else if(typeof cur==='boolean'){ if(typeof v==='boolean') this.s[k]=v; }
        else if(ENUM[k]&&ENUM[k].includes(v)) this.s[k]=v; } }; }
  process(ins,outs){ const s=this.s, sr=sampleRate, I=ins[0], O=outs[0], N=O[0].length;
    if(this.dirty){ this.bp=bqBP(Math.min(s.freq,0.45*sr),sr,s.bw); this.dirty=false; }
    const iL=I&&I[0]?I[0]:null, iR=I&&I[1]?I[1]:iL, oL=O[0], oR=O[1]||O[0], bp=this.bp, z=this.z, env=this.env;
    const ca=Math.exp(-1/(Math.max(0.02,s.att)*0.001*sr)), cr=Math.exp(-1/(Math.max(2,s.rel)*0.001*sr)), dk=Math.exp(-1/(0.0005*sr)), ks=1-Math.exp(-1/(0.005*sr));
    const T=s.thr, iRt=s.ratio>=99.5?0:1/s.ratio, rg=s.range, split=s.mode==='split', listen=s.listen, mixT=s.on?s.mix:0;
    let g=this.g, mx=this.mx, grMax=this.grMax, lvMax=this.lvMax;
    for(let t=0;t<N;t++){
      const xl=iL?cl(iL[t]):0, xr=iR?cl(iR[t]):0;
      let bl=bp.b0*xl+z[0]; z[0]=-bp.a1*bl+z[1]; z[1]=-bp.a2*bl+bp.b2*xl;
      let br=bp.b0*xr+z[2]; z[2]=-bp.a1*br+z[3]; z[3]=-bp.a2*br+bp.b2*xr;
      const pa=bl<0?-bl:bl, pb=br<0?-br:br; env[0]=pa>env[0]?pa:env[0]*dk; env[1]=pb>env[1]?pb:env[1]*dk;
      const e=env[0]>env[1]?env[0]:env[1], d=LN*Math.log(e+1e-9); if(d>lvMax) lvMax=d;
      let r=grS(d,T,iRt); if(r>rg) r=rg;
      g=r>g?r+(g-r)*ca:r+(g-r)*cr; if(g>grMax) grMax=g;
      mx+=(mixT-mx)*ks;
      if(listen){ oL[t]=bl; oR[t]=br; continue; }
      const h=Math.exp(-g*DB2LIN);
      let yl,yr; if(split){ yl=xl+(h-1)*bl; yr=xr+(h-1)*br; } else { yl=xl*h; yr=xr*h; }
      oL[t]=xl+(yl-xl)*mx; oR[t]=xr+(yr-xr)*mx; }
    this.g=g; this.mx=mx; this.grMax=grMax; this.lvMax=lvMax;
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    for(let i=0;i<4;i++) if(!(Math.abs(z[i])<1e6)) z[i]=0;
    for(let i=0;i<2;i++) if(!(env[i]>=0&&env[i]<1e6)) env[i]=0;
    if(!(this.g>=0&&this.g<400)) this.g=0; if(!(this.mx>=0&&this.mx<=1.0001)) this.mx=0; if(!(this.grMax>=0&&this.grMax<400)) this.grMax=0; if(!(this.lvMax>-1e4&&this.lvMax<1e4)) this.lvMax=-180;
    // de meter toont wat er werkelijk met het geluid gebeurt: bij mix < 100% of Uit is de reductie op de middenfrequentie kleiner dan de berekende
    if((this.n+=1)%10===0){ const gE=-20*Math.log10(Math.max(1e-6,1+this.mx*(Math.exp(-this.grMax*DB2LIN)-1))); this.port.postMessage({gr:gE>0?gE:0,lv:this.lvMax}); this.grMax=0; this.lvMax=-180; }
    return true; } }
registerProcessor('${WNAME}', DeEss);`;

export default {
  id: 'nl.patchkamer.deesser', name: 'De-esser', version: '1.2.0', kind: 'effect', category: 'effect',
  about: { nl: 'Dempt scherpe s-klanken in een stem. Een detectieband (3 tot 10 kHz) bepaalt wanneer; in split-band dempt alleen die band, in wideband het hele signaal.\n\nTip: zet Luister naar detectieband aan, zoek de frequentie waar de s het scherpst klinkt en zet de band daar. Verlaag dan de drempel tot de reductiemeter alleen bij s-klanken beweegt (2 tot 6 dB). Split-band laat de rest van de stem ongemoeid; Wideband klinkt meer als een gewone compressor op de s. Voor mannen ligt de s meestal rond 4 tot 7 kHz, voor vrouwen rond 6 tot 9 kHz.', en: 'Tames harsh s sounds in a voice. A detection band (3 to 10 kHz) decides when; in split-band only that band is reduced, in wideband the whole signal.\n\nTip: turn on Listen to detection band, find the frequency where the s sounds sharpest and put the band there. Then lower the threshold until the reduction meter only moves on s sounds (2 to 6 dB). Split-band leaves the rest of the voice alone; Wideband sounds more like an ordinary compressor on the s. For male voices the s is usually around 4 to 7 kHz, for female voices around 6 to 9 kHz.' },
  ui: { width: 720, minWidth: 360 },
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const D = host && host.lang === 'nl' ? NL : EN;
    const tx = (k, ...a) => { let s = D[k] !== undefined ? D[k] : k; a.forEach((v, i) => { s = s.replace('{' + i + '}', v); }); return s; };
    const clamp = ukClamp;
    let dead = false, node = null, ok = false, mod = {}, eff = {}, meter = { gr: 0, lv: -120 }, listen = false;
    const input = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); bypass.gain.value = 1; input.connect(bypass).connect(out);
    const spec = {
      freq: { name: tx('freq'), min: 3000, max: 10000, scale: 'log', unit: 'Hz', g: 0, tip: tx('freq_t'), role: 'filter', drift: 0.1, on: false },
      bw: { name: tx('bw'), min: 0.25, max: 3, unit: 'oct', g: 0, tip: tx('bw_t') },
      thr: { name: tx('thr'), min: -60, max: 0, unit: 'dB', g: 0, tip: tx('thr_t'), role: 'level', on: true, drift: 0.1 },
      ratio: { name: tx('ratio'), min: 1, max: 100, scale: 'log', unit: ':1', g: 1, tip: tx('ratio_t'), drift: 0.1 },
      range: { name: tx('range'), min: 0, max: 24, unit: 'dB', noplus: true, g: 1, tip: tx('range_t'), role: 'level', on: false },
      att: { name: tx('att'), min: 0.05, max: 20, scale: 'log', unit: 'ms', g: 1, tip: tx('att_t') },
      rel: { name: tx('rel'), min: 5, max: 500, scale: 'log', unit: 'ms', g: 1, tip: tx('rel_t'), role: 'decay', drift: 0.1 },
      mix: { name: tx('mix'), min: 0, max: 1, unit: '%', g: 1, tip: tx('mix_t') },
    };
    const defaults = { mode: 'split', freq: 6500, bw: 1, thr: -30, ratio: 4, range: 10, att: 0.5, rel: 50, mix: 1, on: true };
    const ENUMS = { mode: ['split', 'wide'] }, BOOLS = ['on'];
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max);
      for (const k of Object.keys(ENUMS)) n[k] = ENUMS[k].includes(s[k]) ? s[k] : defaults[k];
      for (const k of BOOLS) n[k] = typeof s[k] === 'boolean' ? s[k] : defaults[k];
      return n; }
    let state = normalize({});
    function apply() { eff = ukResolve(spec, state, mod);
      if (node) node.port.postMessage({ type: 'set', s: { mode: state.mode, freq: eff.freq, bw: eff.bw, thr: eff.thr, ratio: eff.ratio, range: eff.range, att: eff.att, rel: eff.rel, mix: eff.mix, on: state.on, listen } }); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.connect(node); input.disconnect(bypass); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (!m || !Number.isFinite(m.gr) || !Number.isFinite(m.lv)) return; meter = m; }; apply(); paintStatus(); })
      .catch(() => { ok = false; paintStatus(); });
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, stopDraw = null, statusEl = null, grM = null;
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('var(--audio,#7ee0a1)'));
      const top = ukEl(app, 'div', 'top');
      ui.mode = ukSelect(top, tx('mode'), [['split', tx('split')], ['wide', tx('wide')]], state.mode, v => { state.mode = v; apply(); }, 'mode');
      ui.on = ukButton(top, '', '', 'on', () => { state.on = !state.on; apply(); paint(); });
      ui.listen = ukButton(top, tx('listen'), tx('listenTip'), 'listen', () => { listen = !listen; apply(); paint(); });
      const disp = ukEl(app, 'div', 'disp');
      cv = ukEl(disp, 'canvas'); cv.setAttribute('aria-label', tx('aria'));
      const side = ukEl(disp, 'div', 'side');
      ukEl(side, 'div', 'small', tx('gr')); ui.gr = ukEl(side, 'div', 'big', '0.0 dB');
      grM = ukMeter(host, side, tx('gr'), 'met.gr', [-24, 0], 150);
      ui.lvl = ukEl(side, 'div', 'small', '');
      statusEl = ukEl(app, 'p', 'stt');
      ui.k = ukSliders(app, spec, [{ key: 'detection', label: tx('g0') }, { key: 'reduction', label: tx('g1') }], (id, v) => { state[id] = v; apply(); }, defaults, tx('dbl'));
      paint(); paintStatus(); stopDraw = ukLoop(host, self, draw, 30); }
    function paintStatus() { if (statusEl) statusEl.textContent = ok ? '' : tx('failed'); }
    function paint() { if (!root) return; ui.mode.value = state.mode; ui.on.textContent = state.on ? tx('on') : tx('off'); ui.on.classList.toggle('on', state.on); ui.listen.classList.toggle('on', listen); for (const [id, k] of Object.entries(ui.k)) k.set(state[id]); }
    let grTxt = '', lvTxt = '';
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, 170); const F = eff.freq !== undefined ? eff.freq : state.freq, BW = eff.bw !== undefined ? eff.bw : state.bw, gr = clamp(meter.gr || 0, 0, 48), gl = Math.pow(10, -gr / 20), split = state.mode === 'split', sr = ctx.sampleRate || 48000;
      if (g) { const acc = ukVar(cv, '--u-acc', '#7ee0a1'), line = ukVar(cv, '--line', '#333'), mut = ukVar(cv, '--muted', '#888'); g.clearRect(0, 0, w, h);
        const L = 30, B = 16, pw = w - L - 8, ph = h - B - 8, f0 = 1000, f1 = 16000, ylo = -24, yhi = 3, X = f => L + Math.log(f / f0) / Math.log(f1 / f0) * pw, Y = d => 8 + (yhi - d) / (yhi - ylo) * ph;
        g.strokeStyle = line; g.lineWidth = 1; g.fillStyle = mut; g.font = '9px monospace';
        for (const f of [1000, 2000, 4000, 8000, 16000]) { g.beginPath(); g.moveTo(X(f), Y(ylo)); g.lineTo(X(f), Y(yhi)); g.stroke(); g.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), X(f) - 6, h - 4); }
        for (let d = -24; d <= 0; d += 6) { g.beginPath(); g.moveTo(X(f0), Y(d)); g.lineTo(X(f1), Y(d)); g.stroke(); g.fillText(String(d), 2, Y(d) + 3); }
        const resp = f => { if (!split) return 20 * Math.log10(gl); const [re, im] = deBand(f, F, BW, sr), yr = 1 + (gl - 1) * re, yi = (gl - 1) * im; return 10 * Math.log10(Math.max(1e-6, yr * yr + yi * yi)); };
        g.fillStyle = acc; g.globalAlpha = 0.14; g.beginPath(); for (let i = 0; i <= 160; i++) { const f = f0 * (f1 / f0) ** (i / 160), [re, im] = deBand(f, F, BW, sr), m = Math.hypot(re, im), x = X(f), y = Y(ylo + m * 18); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.lineTo(X(f1), Y(ylo)); g.lineTo(X(f0), Y(ylo)); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = acc; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 160; i++) { const f = f0 * (f1 / f0) ** (i / 160), y = Y(clamp(resp(f), ylo, yhi)); i ? g.lineTo(X(f), y) : g.moveTo(X(f), y); } g.stroke(); }
      const t = (meter.gr || 0).toFixed(1) + ' dB'; if (ui.gr && t !== grTxt) { grTxt = t; ui.gr.textContent = (meter.gr >= 0.05 ? '−' : '') + t; }
      if (grM) grM.set(-clamp(meter.gr || 0, 0, 24));
      const l = tx('lvl') + ': ' + (meter.lv > -150 ? meter.lv.toFixed(1) + ' dB' : '−∞'); if (ui.lvl && l !== lvTxt) { lvTxt = l; ui.lvl.textContent = l; } }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (grM) { try { grM.destroy(); } catch { } grM = null; } if (cv && cv._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; }
    const self = {
      inputs: { in: input }, outputs: { out },
      mount, unmount,
      params() { return ukParams(spec, 'deesser', 'De-esser'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { input.disconnect(); bypass.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } out.disconnect(); } catch {} },
    };
    apply();
    return self;
  },
};
