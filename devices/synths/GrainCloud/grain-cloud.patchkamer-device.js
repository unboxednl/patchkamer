// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Uitleg naar about (menu Over Grain Cloud); de UI toont geen uitlegtekst meer.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in about.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Grain Cloud (nieuwe id nl.patchkamer.graincloud, eigen map; voorheen Korrel, nl.patchkamer.korrel);
//   songs uit die tijd verwijzen naar de oude id en laden hier niet in. Het geluid is bit-identiek aan het oude bestand.
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Grain Cloud
//   - Engelse namen in de state: bron live / frozen / wave, golf choir / organ / saw / glass / noise / sine, toonsprongen free / octaves /
//     fifths / octfifth, het veld wolk heet cloud en de klanken in de keuzelijst zijn Engels; de oude namen worden bij het laden herkend
//   - de modulatie-lane heet Grain Cloud
//   - setState volgt §13: onbekende velden worden genegeerd, ontbrekende of ongeldige waarden krijgen de standaard, getallen worden afgekapt
//   - tekenen via host.frame (met een ResizeObserver en een kleurcache); dubbelklik op een schuif zet hem terug op de beginwaarde
//   - bewaker: de worklet begrenst de ingang (NaN wordt 0, ±16 is het plafond), schrijft alleen eindige waarden in de opname, accepteert
//     alleen eindige parameters en noten, en zet een ontspoorde toestand terug. Normaal geluid blijft bit-identiek.
/** Grain Cloud 1.12.0. Standalone, no external files.
 * Granular: cuts sound into grains (5 ms – 1 s) and scatters them again, with their own pitch, direction and position.
 * Source:
 *  - Live: everything that arrives on the input (Grain Cloud as an effect: clouds, frozen echoes, stutters);
 *  - Frozen: the recording stands still and you play around in it (Freeze button, or Record for 4 seconds);
 *  - Wave: a built-in sound source (choir, organ, saw, glass, noise, sine), then Grain Cloud is a synth.
 * Playing: notes make a cloud at that pitch (C4 = original, polyphonic), or switch Cloud on for an endless drone.
 * Extras: pitch jumps in octaves/fifths, scanning through the recording, feedback, reverse chance, waveform on screen.
 */
// ---------- UI-kit ----------
const UK_CSS = (acc) => `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:${acc};--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button,input[type=text],input[type=number]{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:var(--u-acc);border-color:var(--u-acc);color:#14100a}
canvas{display:block;width:100%;border-radius:6px;background:var(--well,#0c0f13)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
.stt{font-size:11px;color:var(--mod,#b48cff);margin:4px 0}`;
const ukClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ukFinite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? ukClamp(x, a, b) : d;
const ukEl = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const ukStop = e => e.stopPropagation();
function ukShadow(hostEl, css) { const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap; ukEl(sh, 'style').textContent = css; sh.addEventListener('pointerdown', ukStop); sh.addEventListener('keydown', ukStop); return ukEl(sh, 'div', 'app'); }
function ukSelect(p, label, opts, value, change) { const box = ukEl(p, 'label', 'sel'); ukEl(box, 'span', '', label); const s = ukEl(box, 'select'); for (const [v, t] of opts) { const o = ukEl(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); return s; }
const ukToS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
const ukFromS = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function ukFmt(d, v) { const u = d.unit || ''; if (u === '%') return Math.round(v * 100) + '%'; if (u === 'ms') return v < 1 ? v.toFixed(2) + ' ms' : v < 100 ? v.toFixed(1) + ' ms' : Math.round(v) + ' ms';
  if (u === 'Hz') return v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz'; if (u === 's') return v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
  if (u === 'st') return (v > 0 ? '+' : '') + (Number.isInteger(v) ? v : v.toFixed(1)) + ' st'; if (u === 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB'; if (u === ':1') return v.toFixed(1) + ':1';
  if (u === '/s') return v.toFixed(v < 10 ? 1 : 0) + '/s'; if (u === 'x') return v.toFixed(2) + '×'; if (u === 'int') return String(Math.round(v)); return v.toFixed(2) + (u ? ' ' + u : ''); }
// sliders for a spec {id:{name,min,max,scale,unit,g}} in groups; get/set read and write the value
function ukSliders(parent, spec, groups, get, set, defaults, dbl) { const handles = {};
  groups.forEach((gname, gi) => { if (gname) ukEl(parent, 'h3', '', gname); const g = ukEl(parent, 'div', 'grid');
    for (const [id, d] of Object.entries(spec)) { if ((d.g || 0) !== gi) continue; const c = ukEl(g, 'div', 'c'), lab = ukEl(c, 'div', 'lab'); ukEl(lab, 'span', '', d.name).title = d.name; const o = ukEl(lab, 'output');
      const inp = ukEl(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', d.name); inp.title = d.name + (d.tip ? ' — ' + d.tip : '') + ' · ' + dbl;
      inp.oninput = () => { const v = ukFromS(d, +inp.value); set(id, v); o.textContent = ukFmt(d, v); };
      inp.ondblclick = () => { set(id, defaults[id]); handles[id].set(defaults[id]); };
      handles[id] = { set(v) { inp.value = String(ukToS(d, v)); o.textContent = ukFmt(d, v); }, el: c }; } });
  return handles; }
// canvas without layout work per frame: the width comes from a ResizeObserver, the height is set once
function ukCanvas(cv, h) { const dpr = ukClamp(globalThis.devicePixelRatio || 1, 1, 3);
  if (!cv._ro) { cv._cw = cv.clientWidth || 300; try { cv._ro = new ResizeObserver(() => { cv._cw = cv.clientWidth || cv._cw; }); cv._ro.observe(cv); } catch { } }
  if (cv._h !== h) { cv.style.height = h + 'px'; cv._h = h; } const w = Math.max(160, cv._cw || 300);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const g = cv._g || (cv._g = cv.getContext('2d')); if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h }; }
// CSS colours at most once per second (and again right after a skin change)
let ukVarEpoch = 0; try { window.addEventListener('patchkamer-skin', () => { ukVarEpoch++; }); } catch { }
const ukVar = (el, name, d) => { const c = el._ukv || (el._ukv = {}), now = performance.now(), e = c[name];
  if (e && now - e.t < 1000 && e.ep === ukVarEpoch) return e.v; let v = d; try { v = getComputedStyle(el).getPropertyValue(name).trim() || d; } catch { } c[name] = { v, t: now, ep: ukVarEpoch }; return v; };
const ukLoop = (host, inst, cb, fps) => {   // draw on the host clock (only while the card is visible); fallback for an older host
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false; const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); }; raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); }; };

function ukResolve(spec, state, mod) { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = d.nomod ? 0 : (mod[id] || 0); if (!x) continue; e[id] = ukClamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } return e; }
function ukParams(spec, lane, laneName) { return Object.entries(spec).filter(([, d]) => !d.nomod).map(([id, d]) => ({ id, name: d.name, lane, laneName, min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: !d.role || !['level', 'pitch'].includes(d.role) })); }
// ---------- end of UI kit ----------

const EN = {
  'Positie': 'Position', 'Spreiding': 'Spread', 'Scannen': 'Scan', 'Korrelgrootte': 'Grain size', 'Dichtheid': 'Density', 'Toon': 'Pitch', 'Toonspreiding': 'Pitch spread',
  'Achteruit': 'Reverse', 'Breedte': 'Width', 'Venster': 'Window', 'Terugkoppeling': 'Feedback', 'Mix': 'Mix', 'Aanzet': 'Attack', 'Uitklank': 'Release', 'Uitgang': 'Output',
  'waar in de opname (Live: 0 = zojuist)': 'where in the recording (Live: 0 = just now)',
  'positie schuift vanzelf (vooruit of achteruit)': 'position moves by itself (forward or backward)',
  '0 = zacht (Hann), 1 = hoekig (tik)': '0 = soft (Hann), 1 = angular (click)',
  'Live: de wolk gaat terug de opname in': 'Live: the cloud goes back into the recording',
  'Live (ingang)': 'Live (input)', 'Bevroren opname': 'Frozen recording', 'Golf (ingebouwd)': 'Wave (built-in)',
  'Koor (aah)': 'Choir (aah)', 'Orgel': 'Organ', 'Zaagtand': 'Sawtooth', 'Glas': 'Glass', 'Ruis': 'Noise', 'Sinus': 'Sine',
  'Vrij': 'Free', 'Octaven': 'Octaves', 'Kwinten': 'Fifths', 'Octaaf + kwint': 'Octave + fifth',
  'Eigen': 'Custom', 'Klankbeeld': 'Soundscape', 'Bron': 'Source', 'Golf': 'Wave', 'Toonsprongen': 'Pitch jumps',
  'Wolk (drone)': 'Cloud (drone)', 'Bevries': 'Freeze', 'Neem 4 s op': 'Record 4 s', 'Opnemen…': 'Recording…', 'Test noot': 'Test note',
  'zonder noten: een eindeloze wolk op de oorspronkelijke toon': 'without notes: an endless cloud at the original pitch',
  'Live ↔ Bevroren: de opname staat stil': 'Live ↔ Frozen: the recording stands still',
  'neemt 4 seconden van de ingang op en bevriest dan': 'records 4 seconds from the input and then freezes',
  'de bron met de korrels die nu klinken': 'the source with the grains that are sounding now',
  'Waar en hoe vaak': 'Where and how often', 'Elke korrel': 'Every grain', 'Wolk en mix': 'Cloud and mix',
  'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.': 'AudioWorklet unavailable: the sound passes through unchanged.',
  'dubbelklik: standaard': 'double-click: default',
  '← ouder        opname (8 s)        zojuist →': '← older        recording (8 s)        just now →',
  'golf: ': 'wave: ', 'bevroren opname': 'frozen recording',
  '{0} stemmen · {1} korrels': '{0} voices · {1} grains',
  'choir': 'Choir', 'organ': 'Organ', 'saw': 'Saw', 'glass': 'Glass', 'noise': 'Noise', 'sine': 'Sine',
};
const WNAME = 'nl-patchkamer-graincloud-1-11-0';
const WORKLET = `
const BL_S=8, MAXG=160, IN_MAX=16;
const lim=v=>(v>-IN_MAX&&v<IN_MAX)?v:(v!==v?0:v>0?IN_MAX:-IN_MAX);
class GrainCloud extends AudioWorkletProcessor{
  constructor(){ super(); const sr=sampleRate; this.BL=Math.round(BL_S*sr); this.buf=[new Float32Array(this.BL),new Float32Array(this.BL)]; this.w=0; this.filled=0;
    this.tab=null; this.tabType=''; this.G=[]; this.V=[]; this.q=[]; this.seed=99; this.scanPh=0; this.recLeft=0; this.n=0; this.fbL=0; this.fbR=0;
    this.s={src:'live',wave:'choir',pos:0.3,spread:0.2,size:120,dens:20,pitch:0,pspread:0,steps:'free',rev:0,pan:0.6,shape:0.3,scan:0,fb:0,mix:1,att:0.3,rel:1.5,level:0.8,cloud:true};
    this.port.onmessage=e=>{ const m=e.data||{}; if(m.type==='set'){ const s=m.s||{}; for(const k in s){ if(!(k in this.s)) continue; const v=s[k], cur=this.s[k]; if(typeof cur==='number'?(typeof v==='number'&&Number.isFinite(v)):(typeof v===typeof cur&&(k!=='src'||v==='live'||v==='frozen'||v==='wave'))) this.s[k]=v; } } else if(m.type==='rec'){ this.recLeft=Math.round(4*sampleRate); this.filled=0; this.w=0; } else if(m.type==='note'){ if(Number.isFinite(m.note)&&Number.isFinite(m.vel)&&(m.dur==null||Number.isFinite(m.dur))) this.q.push(m); } else this.q.push(m); }; }
  rnd(){ this.seed=(this.seed*16807)%2147483647; return this.seed/2147483647; }
  makeTab(type){ const sr=sampleRate, L=sr, t=new Float32Array(L), f=220; let ph=0, lp=0, seed=7; const nz=()=>{ seed=(seed*16807)%2147483647; return seed/1073741823.5-1; };
    let b=[[0,0],[0,0],[0,0]];
    for(let i=0;i<L;i++){ const x=i/sr; let v=0;
      if(type==='sine') v=Math.sin(2*Math.PI*f*x);
      else if(type==='organ'){ [1,2,3,4,6,8].forEach((h,k)=>{ v+=Math.sin(2*Math.PI*f*h*x)*[1,.6,.4,.3,.2,.15][k]; }); v*=0.4; }
      else if(type==='saw'){ ph+=f/sr; ph-=Math.floor(ph); v=(2*ph-1)*0.6; }
      else if(type==='glass'){ [1,2.76,5.4,8.93,13.3].forEach((h,k)=>{ v+=Math.sin(2*Math.PI*f*h*x+k)*[1,.5,.3,.2,.1][k]; }); v*=0.45; }
      else if(type==='noise'){ lp+=(nz()-lp)*0.25; v=lp*1.5; }
      else { ph+=f*(1+0.004*Math.sin(2*Math.PI*5*x))/sr; ph-=Math.floor(ph); const src=2*ph-1+nz()*0.04; v=0;   // choir: a saw through three formants 'aah'
        [[730,0.08],[1090,0.05],[2440,0.03]].forEach(([F,bw],k)=>{ const w=2*Math.PI*F/sr, r=Math.exp(-Math.PI*F*bw/sr), y=src*(1-r)*1.6+2*r*Math.cos(w)*b[k][0]-r*r*b[k][1]; b[k][1]=b[k][0]; b[k][0]=y; v+=y*[1,.7,.4][k]; }); v*=0.9; }
      t[i]=v; }
    // make it seamless: crossfade the last 20 ms into the first
    const X=Math.round(0.02*sr); for(let i=0;i<X;i++){ const a=i/X; t[i]=t[i]*a+t[L-X+i]*(1-a); }
    this.tab=t; this.tabType=type; }
  voice(m){ if(this.V.length>=8){ this.V.shift(); } this.V.push({note:m.note,semi:m.note-(this.s.src==='wave'?57:60),vel:m.vel,env:0,on:true,until:m.dur!=null?currentTime+m.dur:1e9,acc:0}); }
  spawn(v){ const s=this.s, sr=sampleRate; if(this.G.length>=MAXG) return;
    const L=Math.max(32,Math.round(s.size*0.001*sr)); let ps=0; if(s.pspread>0){ const r=(this.rnd()*2-1)*s.pspread;
      if(s.steps==='free') ps=r; else { const opts=s.steps==='octaves'?[-24,-12,0,12,24]:s.steps==='fifths'?[-12,-5,0,7,12,19]:[-12,0,7,12,19,24]; const c=opts.filter(o=>Math.abs(o)<=Math.max(1,s.pspread)); ps=c[Math.floor(this.rnd()*c.length)]; } }
    const rate=Math.pow(2,(s.pitch+v.semi+ps)/12)*(this.rnd()<s.rev?-1:1);
    let start; const jit=(this.rnd()*2-1)*s.spread*0.5;
    if(s.src==='wave'){ const T=this.tab.length; start=((s.pos+this.scanPh+jit)%1+1)%1*T; }
    else { const avail=Math.max(1,Math.min(this.filled,this.BL)-1); const need=L*Math.abs(rate)+256;
      if(s.src==='live'){ const back=need+((s.pos+jit+1)%1)*Math.max(0,Math.min(avail,this.BL*0.92)-need); start=this.w-back; if(rate<0) start+=L*Math.abs(rate); }
      else { const p=((s.pos+this.scanPh+jit)%1+1)%1; start=(this.w-avail)+p*Math.max(1,avail-need); if(rate<0) start+=L*Math.abs(rate); } }
    const pan=(this.rnd()*2-1)*s.pan, a=(pan+1)*Math.PI/4;
    this.G.push({p:start,rate,L,i:0,gL:Math.cos(a)*v.env*v.vel,gR:Math.sin(a)*v.env*v.vel}); }
  process(ins,outs){ const s=this.s, sr=sampleRate, I=ins[0], iL=I&&I[0]?I[0]:null, iR=I&&I[1]?I[1]:iL, O=outs[0], oL=O[0], oR=O[1]||O[0], N=oL.length, BL=this.BL;
    if(s.src==='wave'&&(this.tabType!==s.wave||!this.tab)) this.makeTab(s.wave);
    if(this.q.length){ const keep=[]; for(const m of this.q){ if((m.time||0)<currentTime+N/sr){ if(m.type==='note') this.voice(m); else if(m.type==='off'){ for(const v of this.V) if(v.note===m.note) v.on=false; } else if(m.type==='panic'){ this.V.forEach(v=>v.on=false); } } else keep.push(m); } this.q=keep; }
    // cloud voice (drone) on or off
    const hasW=this.V.find(v=>v.cloud); if(s.cloud&&!hasW) this.V.push({cloud:true,note:-1,semi:0,vel:0.8,env:0,on:true,until:1e9,acc:0}); if(!s.cloud&&hasW) hasW.on=false;
    const ka=Math.exp(-1/(Math.max(0.005,s.att)*sr/ N)), kr=Math.exp(-1/(Math.max(0.01,s.rel)*sr/N));
    for(const v of this.V){ if(v.on&&currentTime>=v.until) v.on=false; const tgt=v.on?1:0; v.env=tgt+(v.env-tgt)*(v.on?ka:kr);
      v.acc+=N*s.dens/sr; let k=0; while(v.acc>=1&&k<16){ v.acc-=1+(this.rnd()-0.5)*0.6; if(v.env>0.002) this.spawn(v); k++; } }
    this.V=this.V.filter(v=>v.on||v.env>0.002);
    this.scanPh=(this.scanPh+s.scan*0.15*N/sr)%1;
    if(!Number.isFinite(this.scanPh)) this.scanPh=0;
    const src=s.src==='wave'?null:this.buf, T=this.tab, TL=T?T.length:1, sh=s.shape;
    const wL=new Float32Array(N), wR=new Float32Array(N);
    for(const g of this.G){ for(let t=0;t<N&&g.i<g.L;t++,g.i++){ const x=g.i/g.L; let w=0.5-0.5*Math.cos(2*Math.PI*x); if(sh>0){ const tr=Math.min(1,Math.min(x,1-x)/Math.max(0.02,0.5*(1-sh))); w=w*(1-sh)+tr*sh; }
        const pos=g.p+g.i*g.rate; let l, r;
        if(src){ let i0=Math.floor(pos), f=pos-i0; i0=((i0%BL)+BL)%BL; const i1=(i0+1)%BL; l=src[0][i0]+(src[0][i1]-src[0][i0])*f; r=src[1][i0]+(src[1][i1]-src[1][i0])*f; }
        else { let i0=Math.floor(pos), f=pos-i0; i0=((i0%TL)+TL)%TL; const i1=(i0+1)%TL; l=r=T[i0]+(T[i1]-T[i0])*f; }
        wL[t]+=l*w*g.gL; wR[t]+=r*w*g.gR; } }
    this.G=this.G.filter(g=>g.i<g.L);
    const norm=0.9/Math.sqrt(Math.max(1,s.dens*s.size*0.001));
    const rec=(s.src==='live'||this.recLeft>0);
    for(let t=0;t<N;t++){ const xl=iL?lim(iL[t]):0, xr=iR?lim(iR[t]):0; const yl=wL[t]*norm, yr=wR[t]*norm;
      if(rec){ this.buf[0][this.w]=lim(xl+yl*s.fb); this.buf[1][this.w]=lim(xr+yr*s.fb); this.w=(this.w+1)%BL; if(this.filled<BL) this.filled++; if(this.recLeft>0){ this.recLeft--; if(this.recLeft===0) this.port.postMessage({recDone:true}); } }
      const dry=s.src==='wave'?0:(1-s.mix);
      oL[t]=Math.tanh((xl*dry+yl*s.mix)*s.level*1.2); oR[t]=Math.tanh((xr*dry+yr*s.mix)*s.level*1.2); }
    if((this.n+=1)%10===0){ const view={type:'view',g:this.G.slice(0,80).map(g=>{ const P=g.p+g.i*g.rate; return src?[(((P-(this.w-Math.min(this.filled,BL)))%BL)+BL)%BL/Math.max(1,Math.min(this.filled,BL)),g.i/g.L]:[(((P%TL)+TL)%TL)/TL,g.i/g.L]; }),voices:this.V.length};
      if(this.n%60===0){ const n=160, pk=new Float32Array(n); if(src){ const len=Math.min(this.filled,BL), st=this.w-len; for(let b=0;b<n;b++){ let m=0; const a=Math.floor(b*len/n), e=Math.floor((b+1)*len/n); for(let i=a;i<e;i+=8){ const v=Math.abs(this.buf[0][(((st+i)%BL)+BL)%BL]); if(v>m) m=v; } pk[b]=m; } } else if(T){ for(let b=0;b<n;b++){ let m=0; for(let i=Math.floor(b*TL/n);i<Math.floor((b+1)*TL/n);i+=8) m=Math.max(m,Math.abs(T[i])); pk[b]=m; } } view.peaks=Array.from(pk); }
      this.port.postMessage(view); }
    return true; } }
registerProcessor('${WNAME}', GrainCloud);`;

export default {
  id: 'nl.patchkamer.graincloud', name: 'Grain Cloud', version: '1.13.0', kind: 'instrument', category: 'synth',
  ui: { width: 820, minWidth: 380 },
  about: { nl: 'Een granulaire synth en effect: knipt geluid in korreltjes en strooit ze opnieuw uit. Als effect: zet een audiokabel op de ingang en kies Live. Als synth: kies Golf en speel noten, of laat de wolk eindeloos zweven.\n\nNoten spelen een wolk op hun toonhoogte: C4 is de oorspronkelijke toon van de opname, bij Golf is dat A3.\n\nTips: Korrelgrootte klein en Dichtheid hoog = ruisachtig zoemen; groot en laag = losse brokjes. Toonsprongen Octaven met Toonspreiding 12 maakt van elk geluid een glinsterend koor. Paarse Mod: Drift op Positie laat de wolk vanzelf door de opname dwalen.', en: 'A granular synth and effect: cuts sound into tiny grains and scatters them again. As an effect: connect an audio cable to the input and choose Live. As a synth: choose Wave and play notes, or let the cloud float on endlessly.\n\nNotes play a cloud at their pitch: C4 is the original pitch of the recording, with Wave it is A3.\n\nTips: small Grain size and high Density = noisy buzzing; large and low = separate chunks. Pitch jumps Octaves with Pitch spread 12 turns any sound into a glittering choir. Purple Mod: Drift on Position lets the cloud wander through the recording by itself.' },
  ports: { audioIn: [{ id: 'in', name: 'In (source)' }], audioOut: [{ id: 'out', name: 'Stereo' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { in: 'In (bron)', notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = ukClamp;
    let dead = false, node = null, ok = false, mod = {}, eff = {}, view = { g: [], voices: 0 }, peaks = [];
    const input = ctx.createGain(), out = ctx.createGain(), thru = ctx.createGain(); input.connect(thru).connect(out);
    const spec = {
      pos: { name: tx('Positie'), min: 0, max: 1, unit: '%', g: 0, tip: tx('waar in de opname (Live: 0 = zojuist)') },
      spread: { name: tx('Spreiding'), min: 0, max: 1, unit: '%', g: 0 },
      scan: { name: tx('Scannen'), min: -1, max: 1, unit: 'x', g: 0, tip: tx('positie schuift vanzelf (vooruit of achteruit)') },
      size: { name: tx('Korrelgrootte'), min: 5, max: 1000, scale: 'log', unit: 'ms', g: 0 },
      dens: { name: tx('Dichtheid'), min: 1, max: 150, scale: 'log', unit: '/s', g: 0 },
      pitch: { name: tx('Toon'), min: -24, max: 24, unit: 'st', g: 1, role: 'pitch' },
      pspread: { name: tx('Toonspreiding'), min: 0, max: 24, unit: 'st', g: 1 },
      rev: { name: tx('Achteruit'), min: 0, max: 1, unit: '%', g: 1 },
      pan: { name: tx('Breedte'), min: 0, max: 1, unit: '%', g: 1, role: 'pan' },
      shape: { name: tx('Venster'), min: 0, max: 1, unit: '%', g: 1, tip: tx('0 = zacht (Hann), 1 = hoekig (tik)') },
      fb: { name: tx('Terugkoppeling'), min: 0, max: 0.9, unit: '%', g: 2, tip: tx('Live: de wolk gaat terug de opname in') },
      mix: { name: tx('Mix'), min: 0, max: 1, unit: '%', g: 2 },
      att: { name: tx('Aanzet'), min: 0.005, max: 8, scale: 'log', unit: 's', g: 2 },
      rel: { name: tx('Uitklank'), min: 0.01, max: 12, scale: 'log', unit: 's', g: 2 },
      level: { name: tx('Uitgang'), min: 0, max: 1, unit: '%', g: 2, role: 'level' },
    };
    const SRCS = [['live', tx('Live (ingang)')], ['frozen', tx('Bevroren opname')], ['wave', tx('Golf (ingebouwd)')]], WAVES = [['choir', tx('Koor (aah)')], ['organ', tx('Orgel')], ['saw', tx('Zaagtand')], ['glass', tx('Glas')], ['noise', tx('Ruis')], ['sine', tx('Sinus')]];
    const STEPS = [['free', tx('Vrij')], ['octaves', tx('Octaven')], ['fifths', tx('Kwinten')], ['octfifth', tx('Octaaf + kwint')]];
    const defaults = { pos: 0.3, spread: 0.25, scan: 0, size: 120, dens: 22, pitch: 0, pspread: 0, rev: 0, pan: 0.6, shape: 0.2, fb: 0, mix: 0.7, att: 0.4, rel: 2, level: 0.8, src: 'wave', wave: 'choir', steps: 'free', cloud: true, preset: 'Choir Sea' };
    const presets = {
      'Choir Sea': {},
      'Glass Rain': { wave: 'glass', size: 35, dens: 60, pspread: 12, steps: 'octaves', pan: 1, shape: 0.6, spread: 0.6, rel: 3 },
      'Organ Cloud': { wave: 'organ', size: 400, dens: 12, spread: 0.5, scan: 0.1, att: 2, rel: 5 },
      'Stutter': { src: 'live', size: 60, dens: 40, spread: 0.05, pos: 0.05, shape: 0.9, mix: 0.6, cloud: true },
      'Frozen Time': { src: 'frozen', size: 300, dens: 18, spread: 0.15, scan: 0.05, mix: 1, att: 1, rel: 4 },
      'Reverse Echo': { src: 'live', rev: 1, size: 250, dens: 10, pos: 0.25, spread: 0.2, mix: 0.5, fb: 0.35 },
      'Crystals': { src: 'live', pitch: 12, pspread: 12, steps: 'octfifth', size: 90, dens: 30, pan: 1, mix: 0.5, fb: 0.3 },
      'Noise Storm': { wave: 'noise', size: 20, dens: 120, pspread: 24, pan: 1, shape: 0.8, scan: 0.6 },
    };
    // names from the old file are recognised when a state is loaded
    const legacyPreset = { 'Eigen': 'Custom', 'Koorzee': 'Choir Sea', 'Glasregen': 'Glass Rain', 'Orgelwolk': 'Organ Cloud', 'Stotter': 'Stutter', 'Bevroren tijd': 'Frozen Time', 'Omgekeerde echo': 'Reverse Echo', 'Kristallen': 'Crystals', 'Ruisstorm': 'Noise Storm' };
    const legacySrc = { bevroren: 'frozen', golf: 'wave' }, legacyWave = { koor: 'choir', orgel: 'organ', zaag: 'saw', glas: 'glass', ruis: 'noise', sinus: 'sine' }, legacySteps = { vrij: 'free', octaven: 'octaves', kwinten: 'fifths', okt5: 'octfifth' };
    const pick = (list, legacy, v, d) => { const k = typeof v === 'string' && Object.hasOwn(legacy, v) ? legacy[v] : v; return list.some(x => x[0] === k) ? k : d; };
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max);
      n.src = pick(SRCS, legacySrc, s.src, defaults.src); n.wave = pick(WAVES, legacyWave, s.wave, defaults.wave); n.steps = pick(STEPS, legacySteps, s.steps, defaults.steps);
      const c = s.cloud !== undefined ? s.cloud : s.wolk; n.cloud = c !== undefined ? !!c : defaults.cloud;
      const pn = typeof s.preset === 'string' && Object.hasOwn(legacyPreset, s.preset) ? legacyPreset[s.preset] : s.preset;
      n.preset = pn === 'Custom' || (typeof pn === 'string' && Object.hasOwn(presets, pn)) ? pn : defaults.preset; return n; }
    let state = normalize({});
    function apply() { eff = ukResolve(spec, state, mod); if (node) node.port.postMessage({ type: 'set', s: { ...eff, src: state.src, wave: state.wave, steps: state.steps, cloud: state.cloud } }); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('no loadWorklet'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('no AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.disconnect(thru); input.connect(node); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (!m) return; if (m.recDone) { state.src = 'frozen'; apply(); paint(); } if (m.type === 'view') { view = m; if (m.peaks) peaks = m.peaks; } };
      apply(); paintStatus(); }).catch(() => { ok = false; paintStatus(); });
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, stopDraw = null, statusEl = null, recTimer = 0;
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('#e7b6ff'));
      const top = ukEl(app, 'div', 'top');
      ui.preset = ukSelect(top, tx('Klankbeeld'), Object.keys(presets).map(k => [k, k]).concat([['Custom', tx('Eigen')]]), state.preset, v => { if (presets[v]) self.setState({ ...defaults, ...presets[v], preset: v }); });
      ui.src = ukSelect(top, tx('Bron'), SRCS, state.src, v => { state.src = v; custom(); apply(); paint(); });
      ui.wave = ukSelect(top, tx('Golf'), WAVES, state.wave, v => { state.wave = v; custom(); apply(); });
      ui.steps = ukSelect(top, tx('Toonsprongen'), STEPS, state.steps, v => { state.steps = v; custom(); apply(); });
      const t2 = ukEl(app, 'div', 'top');
      ui.cloud = ukEl(t2, 'button', '', tx('Wolk (drone)')); ui.cloud.type = 'button'; ui.cloud.title = tx('zonder noten: een eindeloze wolk op de oorspronkelijke toon'); ui.cloud.onclick = () => { state.cloud = !state.cloud; custom(); apply(); paint(); };
      ui.freeze = ukEl(t2, 'button', '', tx('Bevries')); ui.freeze.type = 'button'; ui.freeze.title = tx('Live ↔ Bevroren: de opname staat stil'); ui.freeze.onclick = () => { state.src = state.src === 'frozen' ? 'live' : 'frozen'; custom(); apply(); paint(); };
      ui.rec = ukEl(t2, 'button', '', tx('Neem 4 s op')); ui.rec.type = 'button'; ui.rec.title = tx('neemt 4 seconden van de ingang op en bevriest dan'); ui.rec.onclick = () => { if (node) { node.port.postMessage({ type: 'rec' }); state.src = 'live'; apply(); paint(); ui.rec.textContent = tx('Opnemen…'); clearTimeout(recTimer); recTimer = setTimeout(() => { if (ui.rec) ui.rec.textContent = tx('Neem 4 s op'); }, 4100); } };
      const t3 = ukEl(t2, 'button', '', tx('Test noot')); t3.type = 'button'; t3.onclick = () => post({ type: 'note', note: 60, vel: 0.8, time: ctx.currentTime, dur: 1.5 });
      cv = ukEl(app, 'canvas'); cv.setAttribute('aria-label', tx('de bron met de korrels die nu klinken'));
      statusEl = ukEl(app, 'p', 'stt');
      ui.k = ukSliders(app, spec, [tx('Waar en hoe vaak'), tx('Elke korrel'), tx('Wolk en mix')], id => state[id], (id, v) => { state[id] = v; custom(); apply(); }, defaults, tx('dubbelklik: standaard'));
      paint(); paintStatus(); stopDraw = ukLoop(host, self, draw, 30); }
    const post = m => { if (node) node.port.postMessage(m); };
    function custom() { if (state.preset !== 'Custom') { state.preset = 'Custom'; if (ui.preset) ui.preset.value = 'Custom'; } }
    function paintStatus() { if (statusEl) statusEl.textContent = ok ? '' : tx('AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.'); }
    function paint() { if (!root) return; ui.preset.value = state.preset; ui.src.value = state.src; ui.wave.value = state.wave; ui.steps.value = state.steps; ui.wave.parentElement.style.opacity = state.src === 'wave' ? 1 : 0.4;
      ui.cloud.classList.toggle('on', state.cloud); ui.freeze.classList.toggle('on', state.src === 'frozen'); for (const [id, k] of Object.entries(ui.k)) k.set(state[id]); }
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, 110); if (g) { const acc = ukVar(cv, '--u-acc', '#e7b6ff'); g.clearRect(0, 0, w, h);
        const pk = peakImg(w, h, ukVar(cv, '--muted', '#888')); if (pk) g.drawImage(pk, 0, 0, w, h);
        for (const [p, ph] of view.g || []) { const x = p * w, a = Math.sin(Math.PI * ph); g.fillStyle = acc; g.globalAlpha = 0.25 + 0.6 * a; g.beginPath(); g.arc(x, h / 2 + (Math.sin(x * 13.7) * 0.35) * h, 2 + 4 * a, 0, 7); g.fill(); } g.globalAlpha = 1;
        g.fillStyle = ukVar(cv, '--muted', '#888'); g.font = '10px monospace'; g.fillText(state.src === 'live' ? tx('← ouder        opname (8 s)        zojuist →') : state.src === 'wave' ? tx('golf: ') + tx(state.wave) : tx('bevroren opname'), 6, 12); g.fillText(tx('{0} stemmen · {1} korrels', view.voices || 0, (view.g || []).length), 6, h - 6); }
      }
    let pkCache = null, pkKey = '';
    function peakImg(w, h, col) { const key = w + '|' + h + '|' + col + '|' + peaks.length + '|' + (peaks.length ? peaks[0] + peaks[peaks.length >> 1] + peaks[peaks.length - 1] : 0); if (pkCache && key === pkKey) return pkCache;
      try { const c = pkCache || document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.clearRect(0, 0, w, h); g.fillStyle = col; g.globalAlpha = 0.5; const n = peaks.length; for (let i = 0; i < n; i++) { const a = Math.min(1, peaks[i] * 1.5) * h * 0.45; g.fillRect(i / n * w, h / 2 - a, Math.max(1, w / n - 1), a * 2); } pkCache = c; pkKey = key; return c; } catch { return null; } }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } clearTimeout(recTimer); if (cv && cv._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; }
    const self = {
      inputs: { in: input }, outputs: { out },
      mount, unmount,
      onTransport(info) { try { if (!info?.playing) post({ type: 'panic' }); } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'notes' || !e) return; const time = Math.max(ctx.currentTime, ukFinite(e.time, ctx.currentTime, 0, 1e9)), type = String(e.type || '').toLowerCase().replace(/[_-]/g, '');
          if (type === 'panic' || type === 'allnotesoff') post({ type: 'panic', time });
          else if ((type === 'noteoff' || ((type === 'note' || type === 'noteon') && e.vel === 0)) && Number.isFinite(e.note)) post({ type: 'off', note: Math.round(e.note), time });
          else if ((type === 'note' || type === 'noteon') && Number.isFinite(e.note)) post({ type: 'note', note: Math.round(clamp(e.note, 0, 127)), vel: ukFinite(e.vel, 0.8, 0, 1), time, dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.01, 60) : (type === 'note' ? 0.5 : null) });
          else if (type === 'cc' && spec[e.id] && Number.isFinite(e.value)) { const d = spec[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min); custom(); apply(); paint(); } } catch {} },
      params() { return ukParams(spec, 'graincloud', 'Grain Cloud'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { input.disconnect(); thru.disconnect(); if (node) { node.port.onmessage = null; node.port.postMessage({ type: 'panic' }); node.disconnect(); } out.disconnect(); } catch {} },
    };
    apply();
    return self;
  },
};
