// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.3.0 — Uitleg naar about (menu Over Compressor); de UI toont geen uitlegtekst meer.
// 1.2.0 — Patchkamer contract v1.34: latency() meldt de lookahead aan de host (alleen weergave; de host compenseert niet).
// 1.1.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de omschrijving staat nu in about.
// 1.0.0 — Patchkamer contract v1.28. Eerste versie: compressor met drempel, ratio (1:1 tot oneindig), knee, attack, release (ook automatisch), make-up (ook automatisch),
//          peak- of RMS-detectie, lookahead tot 10 ms, sidechain-filter (hoog- en laagdoorlaat), externe sidechain-ingang, parallelle mix, stereo-koppeling en mid/side,
//          een reductiemeter en een overdrachtscurve. Tweetalig (host.lang), tekenen via host.frame, meter door de host (host.ui.meter).
//          Bewaker: de worklet begrenst de ingangen (±16 = +24 dB), zet NaN op 0, accepteert alleen eindige parameters en zet een ontspoorde toestand terug.
/** Compressor — maakt het verschil tussen zacht en luid kleiner.
 * Signaalweg: ingang -> (vertraging voor lookahead) -> versterking -> make-up -> mix met het droge signaal -> uitgang.
 * Detector: peak of RMS van de ingang (of van de externe sidechain), door een hoog- en laagdoorlaatfilter, per kanaal (of per mid en side),
 * gekoppeld met 'Link'. Daarna de statische curve (drempel, ratio, knee) en een gladmaker in dB met attack en release (tijdconstanten, 63%).
 * Automatische release: twee releases tegelijk (30 ms en 400 ms) die samen het herstel bepalen.
 * Latency: gelijk aan de lookahead (de host compenseert dat niet); met lookahead 0 is er geen vertraging.
 */

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const NL = {
  detect: 'Detectie', peak: 'Peak', rms: 'RMS', chmode: 'Kanalen', stereo: 'Stereo (L/R)', ms: 'Mid/Side', src: 'Sidechain', int: 'Intern', ext: 'Extern (ingang Sidechain)',
  on: 'Aan', off: 'Uit (doorlaten)', auto: 'Auto-release', autoTip: 'Twee releases tegelijk (30 en 400 ms): snel herstel na een piek, traag na aanhoudend geluid', autoMk: 'Auto make-up', autoMkTip: 'Telt de reductie bij een ingang van −12 dB bij de make-up op',
  listen: 'Luister naar sidechain', listenTip: 'Hoor wat de detector hoort (na de filters), om ze in te stellen', aria: 'Overdrachtscurve: ingangsniveau tegen uitgangsniveau', gr: 'Reductie', lvl: 'Detector', latency: 'Latency: {0} ms', latencyTip: 'Door de lookahead loopt het geluid achter; de host compenseert dat niet',
  extNone: 'Extern: zonder kabel op de ingang Sidechain wordt er niet gecomprimeerd.', failed: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.', dbl: 'dubbelklik: standaard',
  g0: 'Compressie', g1: 'Uitgang', g2: 'Sidechain',
  thr: 'Drempel', thr_t: 'vanaf dit niveau wordt gecomprimeerd', ratio: 'Ratio', ratio_t: 'ver boven de drempel: dB erboven per dB uit; 100 = oneindig (limiter)', knee: 'Knee', knee_t: '0 = hard, groter = zachte overgang rond de drempel',
  att: 'Attack', att_t: 'tijdconstante: 63% van de reductie bereikt', rel: 'Release', rel_t: 'tijdconstante: 63% van het herstel; niet in gebruik bij Auto-release',
  makeup: 'Make-up', makeup_t: 'extra versterking na de compressie', mix: 'Mix', mix_t: 'deel van het gecomprimeerde signaal; 100% = alles, minder = parallelle compressie',
  look: 'Lookahead', look_t: 'het geluid wordt zoveel vertraagd, zodat de compressor pieken vóór ziet', link: 'Link', link_t: '100% = beide kanalen krijgen dezelfde reductie, 0% = elk kanaal apart',
  hpf: 'Hoogdoorlaat', hpf_t: 'laag onder deze frequentie telt niet mee voor de detector; 20 Hz = uit', lpf: 'Laagdoorlaat', lpf_t: 'hoog boven deze frequentie telt niet mee voor de detector; 20 kHz = uit',
};
const EN = {
  detect: 'Detection', peak: 'Peak', rms: 'RMS', chmode: 'Channels', stereo: 'Stereo (L/R)', ms: 'Mid/Side', src: 'Sidechain', int: 'Internal', ext: 'External (Sidechain input)',
  on: 'On', off: 'Off (pass through)', auto: 'Auto release', autoTip: 'Two releases at once (30 and 400 ms): fast recovery after a peak, slow after sustained sound', autoMk: 'Auto make-up', autoMkTip: 'Adds the reduction at an input of −12 dB to the make-up',
  listen: 'Listen to sidechain', listenTip: 'Hear what the detector hears (after the filters), to set them', aria: 'Transfer curve: input level against output level', gr: 'Reduction', lvl: 'Detector', latency: 'Latency: {0} ms', latencyTip: 'Lookahead delays the sound; the host does not compensate for it',
  extNone: 'External: without a cable on the Sidechain input nothing is compressed.', failed: 'AudioWorklet unavailable: the sound passes through unchanged.', dbl: 'double-click: default',
  g0: 'Compression', g1: 'Output', g2: 'Sidechain',
  thr: 'Threshold', thr_t: 'compression starts from this level', ratio: 'Ratio', ratio_t: 'far above the threshold: dB in per dB out; 100 = infinite (limiter)', knee: 'Knee', knee_t: '0 = hard, larger = soft transition around the threshold',
  att: 'Attack', att_t: 'time constant: 63% of the reduction reached', rel: 'Release', rel_t: 'time constant: 63% of the recovery; unused with Auto release',
  makeup: 'Make-up', makeup_t: 'extra gain after the compression', mix: 'Mix', mix_t: 'share of the compressed signal; 100% = all of it, less = parallel compression',
  look: 'Lookahead', look_t: 'the sound is delayed by this much so the compressor sees peaks in advance', link: 'Link', link_t: '100% = both channels get the same reduction, 0% = each channel on its own',
  hpf: 'Highpass', hpf_t: 'low end below this frequency does not count for the detector; 20 Hz = off', lpf: 'Lowpass', lpf_t: 'high end above this frequency does not count for the detector; 20 kHz = off',
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

// de statische curve: reductie in dB (>= 0) bij een detectorniveau d; gelijk aan die in de worklet
function cpGr(d, T, W, invR) { const o = d - T; if (W > 0) { if (2 * o < -W) return 0; if (2 * Math.abs(o) <= W) { const t = o + W / 2; return (1 - invR) * t * t / (2 * W); } } else if (o <= 0) return 0; return o * (1 - invR); }

const WNAME = 'nl-patchkamer-compressor-1-0-0';
const WORKLET = `
const IN_MAX = 16, LN = 20 / Math.LN10, DB2LIN = Math.LN10 / 20;
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
const fin = (v, lo, hi) => v > lo ? (v < hi ? v : hi) : lo;
// RBJ-biquads (Q vast); coefficienten {b0,b1,b2,a1,a2}
function bqHP(f, sr, Q) { const w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return { b0: (1 + c) / 2 / a0, b1: -(1 + c) / a0, b2: (1 + c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 }; }
function bqLP(f, sr, Q) { const w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return { b0: (1 - c) / 2 / a0, b1: (1 - c) / a0, b2: (1 - c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 }; }
function bqBP(f, sr, bwOct) { const w = 2 * Math.PI * f / sr, s = Math.sin(w), al = s * Math.sinh(Math.LN2 / 2 * bwOct * w / s), a0 = 1 + al; return { b0: al / a0, b1: 0, b2: -al / a0, a1: -2 * Math.cos(w) / a0, a2: (1 - al) / a0 }; }
const BND = { thr: [-80, 0], ratio: [1, 100], knee: [0, 36], att: [0.02, 500], rel: [2, 5000], makeup: [0, 36], look: [0, 10], hpf: [20, 4000], lpf: [200, 20000], mix: [0, 1], link: [0, 1] };
const ENUM = { detect: ['peak', 'rms'], sc: ['int', 'ext'], chmode: ['stereo', 'ms'] };
function grS(d, T, W, iR) { const o = d - T; if (W > 0) { if (2 * o < -W) return 0; if (2 * Math.abs(o) <= W) { const t = o + W / 2; return (1 - iR) * t * t / (2 * W); } } else if (o <= 0) return 0; return o * (1 - iR); }
class Comp extends AudioWorkletProcessor{
  constructor(){ super(); const sr=sampleRate;
    this.s={thr:-18,ratio:4,knee:6,att:10,rel:120,auto:false,makeup:0,autoMk:false,detect:'peak',look:0,hpf:20,lpf:20000,sc:'int',mix:1,link:1,chmode:'stereo',on:true,listen:false};
    this.Nb=Math.ceil(sr*0.0125)+8; this.bl=new Float32Array(this.Nb); this.br=new Float32Array(this.Nb); this.w=0; this.dly=0; this.init=false;
    this.ga=[0,0]; this.gF=[0,0]; this.gS=[0,0]; this.m=[0,0]; this.z=new Float64Array(8); this.mk=1; this.mx=0; this.dirty=true; this.hp=null; this.lp=null; this.hpOn=false; this.lpOn=false;
    this.grMax=0; this.lvMax=-180; this.n=0;
    this.port.onmessage=e=>{ const m=e.data||{}; if(m.type!=='set') return; const o=m.s||{}; for(const k in o){ if(!(k in this.s)) continue; const v=o[k], cur=this.s[k];
        if(typeof cur==='number'){ if(typeof v==='number'&&Number.isFinite(v)){ const b=BND[k]; this.s[k]=b?fin(v,b[0],b[1]):v; if(k==='hpf'||k==='lpf') this.dirty=true; } }
        else if(typeof cur==='boolean'){ if(typeof v==='boolean') this.s[k]=v; }
        else if(ENUM[k]&&ENUM[k].includes(v)) this.s[k]=v; }
      if(!this.init){ this.dly=this.s.look*0.001*sampleRate; this.init=true; } }; }
  coefs(){ const s=this.s, sr=sampleRate; this.hpOn=s.hpf>20.5; this.lpOn=s.lpf<19500&&s.lpf<0.45*sr;
    this.hp=bqHP(Math.min(s.hpf,0.45*sr),sr,0.7071); this.lp=bqLP(Math.min(s.lpf,0.45*sr),sr,0.7071); this.dirty=false; }
  process(ins,outs){ const s=this.s, sr=sampleRate, I=ins[0], S=ins[1], O=outs[0], N=O[0].length;
    if(this.dirty) this.coefs();
    const iL=I&&I[0]?I[0]:null, iR=I&&I[1]?I[1]:iL, oL=O[0], oR=O[1]||O[0];
    const ext=s.sc==='ext', dL=ext?(S&&S[0]?S[0]:null):iL, dR=ext?(S&&S[1]?S[1]:(S&&S[0]?S[0]:null)):iR;
    const ca=Math.exp(-1/(Math.max(0.02,s.att)*0.001*sr)), cr=Math.exp(-1/(Math.max(2,s.rel)*0.001*sr)), cF=Math.exp(-1/(0.03*sr)), cS=Math.exp(-1/(0.4*sr));
    const kr=1-Math.exp(-1/(0.010*sr)), ks=1-Math.exp(-1/(0.005*sr));
    const T=s.thr, W=s.knee, iR_=s.ratio>=99.5?0:1/s.ratio, rms=s.detect==='rms', ms=s.chmode==='ms', link=s.link, auto=s.auto, listen=s.listen;
    const mkT=Math.pow(10,(s.makeup+(s.autoMk?Math.max(0,grS(-12,T,W,iR_)):0))/20), mixT=s.on?s.mix:0, dT=s.look*0.001*sr;
    const bl=this.bl, br=this.br, Nb=this.Nb, z=this.z, hp=this.hp, lp=this.lp, hpOn=this.hpOn, lpOn=this.lpOn;
    let w=this.w, dly=this.dly, mk=this.mk, mx=this.mx, g0=this.ga[0], g1=this.ga[1], f0=this.gF[0], f1=this.gF[1], s0=this.gS[0], s1=this.gS[1], m0=this.m[0], m1=this.m[1], grMax=this.grMax, lvMax=this.lvMax;
    for(let t=0;t<N;t++){
      const xl=iL?cl(iL[t]):0, xr=iR?cl(iR[t]):0;
      bl[w]=xl; br[w]=xr;
      if(dly<dT) dly=Math.min(dT,dly+0.004); else if(dly>dT) dly=Math.max(dT,dly-0.004);
      let rp=w-dly; if(rp<0) rp+=Nb; const i0=rp|0, fr=rp-i0, i1=i0+1>=Nb?0:i0+1;
      const yl=bl[i0]+(bl[i1]-bl[i0])*fr, yr=br[i0]+(br[i1]-br[i0])*fr;
      w=w+1>=Nb?0:w+1;
      // detector: bron, mid/side, filters
      let a=ext?(dL?cl(dL[t]):0):xl, b=ext?(dR?cl(dR[t]):0):xr;
      if(ms){ const p=(a+b)*0.5, q=(a-b)*0.5; a=p; b=q; }
      if(hpOn){ let y=hp.b0*a+z[0]; z[0]=hp.b1*a-hp.a1*y+z[1]; z[1]=hp.b2*a-hp.a2*y; a=y; y=hp.b0*b+z[2]; z[2]=hp.b1*b-hp.a1*y+z[3]; z[3]=hp.b2*b-hp.a2*y; b=y; }
      if(lpOn){ let y=lp.b0*a+z[4]; z[4]=lp.b1*a-lp.a1*y+z[5]; z[5]=lp.b2*a-lp.a2*y; a=y; y=lp.b0*b+z[6]; z[6]=lp.b1*b-lp.a1*y+z[7]; z[7]=lp.b2*b-lp.a2*y; b=y; }
      let la,lb;
      if(rms){ m0+=(a*a-m0)*kr; m1+=(b*b-m1)*kr; la=LN*0.5*Math.log(m0>1e-18?m0:1e-18); lb=LN*0.5*Math.log(m1>1e-18?m1:1e-18); }
      else { la=LN*Math.log((a<0?-a:a)+1e-9); lb=LN*Math.log((b<0?-b:b)+1e-9); }
      const hi=la>lb?la:lb; la+=(hi-la)*link; lb+=(hi-lb)*link; if(hi>lvMax) lvMax=hi;
      const ra=grS(la,T,W,iR_), rb=grS(lb,T,W,iR_);
      if(auto){ f0=ra>f0?ra+(f0-ra)*ca:ra+(f0-ra)*cF; s0=ra>s0?ra+(s0-ra)*ca:ra+(s0-ra)*cS; g0=0.5*(f0+s0);
                f1=rb>f1?rb+(f1-rb)*ca:rb+(f1-rb)*cF; s1=rb>s1?rb+(s1-rb)*ca:rb+(s1-rb)*cS; g1=0.5*(f1+s1); }
      else { g0=ra>g0?ra+(g0-ra)*ca:ra+(g0-ra)*cr; g1=rb>g1?rb+(g1-rb)*ca:rb+(g1-rb)*cr; }
      const gr=(g0+g1)*0.5; if(gr>grMax) grMax=gr;
      mk+=(mkT-mk)*ks; mx+=(mixT-mx)*ks;
      const h0=Math.exp(-g0*DB2LIN), h1=Math.exp(-g1*DB2LIN);
      let wl,wr;
      if(ms){ const p=(yl+yr)*0.5*h0, q=(yl-yr)*0.5*h1; wl=(p+q)*mk; wr=(p-q)*mk; }
      else { wl=yl*h0*mk; wr=yr*h1*mk; }
      if(listen){ if(ms){ oL[t]=a+b; oR[t]=a-b; } else { oL[t]=a; oR[t]=b; } }
      else { oL[t]=yl+(wl-yl)*mx; oR[t]=yr+(wr-yr)*mx; } }
    this.w=w; this.dly=dly; this.mk=mk; this.mx=mx; this.ga[0]=g0; this.ga[1]=g1; this.gF[0]=f0; this.gF[1]=f1; this.gS[0]=s0; this.gS[1]=s1; this.m[0]=m0; this.m[1]=m1; this.grMax=grMax; this.lvMax=lvMax;
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    let bad=false; for(let i=0;i<8;i++) if(!(Math.abs(z[i])<1e6)){ z[i]=0; bad=true; }
    for(let i=0;i<2;i++){ if(!(this.ga[i]>=0&&this.ga[i]<400)) this.ga[i]=0; if(!(this.gF[i]>=0&&this.gF[i]<400)) this.gF[i]=0; if(!(this.gS[i]>=0&&this.gS[i]<400)) this.gS[i]=0; if(!(this.m[i]>=0&&this.m[i]<1e6)) this.m[i]=0; }
    if(!(this.mk>=0&&this.mk<1e4)) this.mk=1; if(!(this.mx>=0&&this.mx<=1.0001)) this.mx=0; if(!(this.dly>=0&&this.dly<this.Nb-2)) this.dly=0; if(!(this.grMax>=0&&this.grMax<400)) this.grMax=0; if(!(this.lvMax>-1e4&&this.lvMax<1e4)) this.lvMax=-180;
    if(bad) for(let i=0;i<this.Nb;i++){ this.bl[i]=0; this.br[i]=0; }
    if((this.n+=1)%10===0){ this.port.postMessage({gr:this.grMax,lv:this.lvMax}); this.grMax=0; this.lvMax=-180; }
    return true; } }
registerProcessor('${WNAME}', Comp);`;

export default {
  id: 'nl.patchkamer.compressor', name: 'Compressor', version: '1.3.0', kind: 'effect', category: 'effect',
  about: { nl: 'Maakt het verschil tussen zacht en luid kleiner. Drempel, ratio en knee bepalen hoeveel, attack en release hoe snel; met sidechain-filter, lookahead, parallelle mix en mid/side.\n\nTip: begin met ratio 4:1, attack 10 ms en release 120 ms en verlaag de drempel tot de reductiemeter 3 tot 6 dB beweegt. Zet Mix op 40 tot 60% voor parallelle compressie. Met Lookahead hoort de compressor een piek al voor hij komt (kost latency). Een hoogdoorlaat van 80 tot 150 Hz op de sidechain voorkomt dat de bas het pompen veroorzaakt.', en: 'Narrows the gap between soft and loud. Threshold, ratio and knee set how much, attack and release how fast; with a sidechain filter, lookahead, parallel mix and mid/side.\n\nTip: start with ratio 4:1, attack 10 ms and release 120 ms and lower the threshold until the reduction meter moves 3 to 6 dB. Set Mix to 40 to 60% for parallel compression. With Lookahead the compressor sees a peak before it arrives (costs latency). A highpass of 80 to 150 Hz on the sidechain stops the bass from causing the pumping.' },
  ui: { width: 720, minWidth: 360 },
  i18n: { en: { ports: { in: 'In', sc: 'Sidechain', out: 'Out', mod: 'Mod' } } },
  modExclude: ['look'],
  ports: { audioIn: [{ id: 'in', name: 'In' }, { id: 'sc', name: 'Sidechain' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const D = host && host.lang === 'nl' ? NL : EN;
    const tx = (k, ...a) => { let s = D[k] !== undefined ? D[k] : k; a.forEach((v, i) => { s = s.replace('{' + i + '}', v); }); return s; };
    const clamp = ukClamp;
    let dead = false, node = null, ok = false, mod = {}, eff = {}, meter = { gr: 0, lv: -120 }, listen = false;
    const input = ctx.createGain(), sc = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); bypass.gain.value = 1; input.connect(bypass).connect(out);
    const spec = {
      thr: { name: tx('thr'), min: -60, max: 0, unit: 'dB', g: 0, tip: tx('thr_t'), role: 'level', on: true, drift: 0.1 },
      ratio: { name: tx('ratio'), min: 1, max: 100, scale: 'log', unit: ':1', g: 0, tip: tx('ratio_t'), drift: 0.1 },
      knee: { name: tx('knee'), min: 0, max: 24, unit: 'dB', noplus: true, g: 0, tip: tx('knee_t') },
      att: { name: tx('att'), min: 0.05, max: 200, scale: 'log', unit: 'ms', g: 0, tip: tx('att_t') },
      rel: { name: tx('rel'), min: 5, max: 2000, scale: 'log', unit: 'ms', g: 0, tip: tx('rel_t'), role: 'decay', drift: 0.1 },
      makeup: { name: tx('makeup'), min: 0, max: 24, unit: 'dB', g: 1, tip: tx('makeup_t'), role: 'level', on: false },
      mix: { name: tx('mix'), min: 0, max: 1, unit: '%', g: 1, tip: tx('mix_t') },
      look: { name: tx('look'), min: 0, max: 10, unit: 'ms', g: 1, tip: tx('look_t'), nomod: true },
      link: { name: tx('link'), min: 0, max: 1, unit: '%', g: 1, tip: tx('link_t') },
      hpf: { name: tx('hpf'), min: 20, max: 1000, scale: 'log', unit: 'Hz', g: 2, tip: tx('hpf_t'), role: 'filter', drift: 0.1, on: false },
      lpf: { name: tx('lpf'), min: 1000, max: 20000, scale: 'log', unit: 'Hz', g: 2, tip: tx('lpf_t'), role: 'filter', drift: 0.1, on: false },
    };
    const defaults = { thr: -18, ratio: 4, knee: 6, att: 10, rel: 120, auto: false, makeup: 0, autoMk: false, detect: 'peak', look: 0, hpf: 20, lpf: 20000, sc: 'int', mix: 1, link: 1, chmode: 'stereo', on: true };
    const ENUMS = { detect: ['peak', 'rms'], sc: ['int', 'ext'], chmode: ['stereo', 'ms'] }, BOOLS = ['auto', 'autoMk', 'on'];
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max);
      for (const k of Object.keys(ENUMS)) n[k] = ENUMS[k].includes(s[k]) ? s[k] : defaults[k];
      for (const k of BOOLS) n[k] = typeof s[k] === 'boolean' ? s[k] : defaults[k];
      return n; }
    let state = normalize({});
    // contract v1.34: vertraging = lookahead (seconden); alleen als de worklet draait, anders gaat het geluid onvertraagd door
    let latLast = 0;
    const latNow = () => ok ? (eff.look !== undefined ? eff.look : state.look) / 1000 : 0;
    function latNote() { const l = latNow(); if (l !== latLast) { latLast = l; if (host && typeof host.latencyChanged === 'function') { try { host.latencyChanged(self); } catch { } } } }
    function apply() { eff = ukResolve(spec, state, mod);
      if (node) node.port.postMessage({ type: 'set', s: { thr: eff.thr, ratio: eff.ratio, knee: eff.knee, att: eff.att, rel: eff.rel, auto: state.auto, makeup: eff.makeup, autoMk: state.autoMk, detect: state.detect, look: eff.look, hpf: eff.hpf, lpf: eff.lpf, sc: state.sc, mix: eff.mix, link: eff.link, chmode: state.chmode, on: state.on, listen } }); latNote(); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.connect(node, 0, 0); sc.connect(node, 0, 1); input.disconnect(bypass); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (!m || !Number.isFinite(m.gr) || !Number.isFinite(m.lv)) return; meter = m; }; apply(); paintStatus(); })
      .catch(() => { ok = false; paintStatus(); });
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, stopDraw = null, statusEl = null, grM = null;
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('var(--audio,#7ee0a1)'));
      const top = ukEl(app, 'div', 'top');
      ui.detect = ukSelect(top, tx('detect'), [['peak', tx('peak')], ['rms', tx('rms')]], state.detect, v => { state.detect = v; apply(); }, 'detect');
      ui.chmode = ukSelect(top, tx('chmode'), [['stereo', tx('stereo')], ['ms', tx('ms')]], state.chmode, v => { state.chmode = v; apply(); }, 'chmode');
      ui.sc = ukSelect(top, tx('src'), [['int', tx('int')], ['ext', tx('ext')]], state.sc, v => { state.sc = v; apply(); paint(); }, 'sc');
      const t2 = ukEl(app, 'div', 'top');
      ui.on = ukButton(t2, '', '', 'on', () => { state.on = !state.on; apply(); paint(); });
      ui.auto = ukButton(t2, tx('auto'), tx('autoTip'), 'auto', () => { state.auto = !state.auto; apply(); paint(); });
      ui.autoMk = ukButton(t2, tx('autoMk'), tx('autoMkTip'), 'autoMk', () => { state.autoMk = !state.autoMk; apply(); paint(); });
      ui.listen = ukButton(t2, tx('listen'), tx('listenTip'), 'listen', () => { listen = !listen; apply(); paint(); });
      const disp = ukEl(app, 'div', 'disp');
      cv = ukEl(disp, 'canvas'); cv.setAttribute('aria-label', tx('aria'));
      const side = ukEl(disp, 'div', 'side');
      const r1 = ukEl(side, 'div', 'small', tx('gr')); ui.gr = ukEl(side, 'div', 'big', '0.0 dB');
      grM = ukMeter(host, side, tx('gr'), 'met.gr', [-30, 0], 150);
      ui.lvl = ukEl(side, 'div', 'small', ''); ui.lat = ukEl(side, 'div', 'small', ''); ui.lat.title = tx('latencyTip'); ui.ext = ukEl(side, 'div', 'small', tx('extNone'));
      statusEl = ukEl(app, 'p', 'stt');
      ui.k = ukSliders(app, spec, [{ key: 'dynamics', label: tx('g0') }, { key: 'output', label: tx('g1') }, { key: 'sidechain', label: tx('g2') }], (id, v) => { state[id] = v; apply(); paint(true); }, defaults, tx('dbl'));
      paint(); paintStatus(); stopDraw = ukLoop(host, self, draw, 30); }
    function paintStatus() { if (statusEl) statusEl.textContent = ok ? '' : tx('failed'); }
    function paint(light) { if (!root) return; if (!light) { ui.detect.value = state.detect; ui.chmode.value = state.chmode; ui.sc.value = state.sc;
        ui.on.textContent = state.on ? tx('on') : tx('off'); ui.on.classList.toggle('on', state.on); ui.auto.classList.toggle('on', state.auto); ui.autoMk.classList.toggle('on', state.autoMk); ui.listen.classList.toggle('on', listen);
        for (const [id, k] of Object.entries(ui.k)) k.set(state[id]); ui.ext.style.display = state.sc === 'ext' ? '' : 'none'; }
      ui.k.rel.el.style.opacity = state.auto ? 0.35 : 1; ui.lat.textContent = tx('latency', (eff.look !== undefined ? eff.look : state.look).toFixed(1)); }
    let grTxt = '', lvTxt = '';
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, 190); const T = eff.thr !== undefined ? eff.thr : state.thr, W = eff.knee !== undefined ? eff.knee : state.knee, R = eff.ratio !== undefined ? eff.ratio : state.ratio, iR = R >= 99.5 ? 0 : 1 / R;
      if (g) { const acc = ukVar(cv, '--u-acc', '#7ee0a1'), line = ukVar(cv, '--line', '#333'), mut = ukVar(cv, '--muted', '#888'); g.clearRect(0, 0, w, h);
        const L = 30, B = 16, pw = w - L - 8, ph = h - B - 8, lo = -60, hi = 0, X = d => L + (d - lo) / (hi - lo) * pw, Y = d => 8 + (hi - d) / (hi - lo) * ph;
        g.strokeStyle = line; g.lineWidth = 1; g.fillStyle = mut; g.font = '9px monospace';
        for (let d = -60; d <= 0; d += 12) { g.beginPath(); g.moveTo(X(d), Y(lo)); g.lineTo(X(d), Y(hi)); g.stroke(); g.beginPath(); g.moveTo(X(lo), Y(d)); g.lineTo(X(hi), Y(d)); g.stroke(); g.fillText(String(d), X(d) - 6, h - 4); g.fillText(String(d), 2, Y(d) + 3); }
        g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(lo), Y(lo)); g.lineTo(X(hi), Y(hi)); g.stroke(); g.setLineDash([]);
        if (W > 0) { g.fillStyle = acc; g.globalAlpha = 0.12; g.fillRect(X(T - W / 2), 8, X(T + W / 2) - X(T - W / 2), ph); g.globalAlpha = 1; }
        g.strokeStyle = acc; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 120; i++) { const d = lo + (hi - lo) * i / 120, o = d - cpGr(d, T, W, iR), x = X(d), y = Y(Math.max(lo, o)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        const lv = clamp(meter.lv, lo, hi), gr = clamp(meter.gr || 0, 0, 60); g.fillStyle = ukVar(cv, '--fg', '#eee'); g.beginPath(); g.arc(X(lv), Y(Math.max(lo, lv - gr)), 4, 0, 6.2832); g.fill(); }
      const t = (meter.gr || 0).toFixed(1) + ' dB'; if (ui.gr && t !== grTxt) { grTxt = t; ui.gr.textContent = (meter.gr >= 0.05 ? '−' : '') + t; }
      if (grM) grM.set(clamp((meter.gr || 0), 0, 30) - 30);
      const l = tx('lvl') + ': ' + (meter.lv > -150 ? meter.lv.toFixed(1) + ' dB' : '−∞'); if (ui.lvl && l !== lvTxt) { lvTxt = l; ui.lvl.textContent = l; } }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (grM) { try { grM.destroy(); } catch { } grM = null; } if (cv && cv._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; }
    const self = {
      inputs: { in: input, sc }, outputs: { out },
      mount, unmount,
      params() { return ukParams(spec, 'compressor', 'Compressor'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      latency() { return latNow(); },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { input.disconnect(); sc.disconnect(); bypass.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } out.disconnect(); } catch {} },
    };
    apply();
    return self;
  },
};
