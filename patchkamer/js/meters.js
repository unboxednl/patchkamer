// js/meters.js — host.ui.meter (contract v1.18): meters met de gezichten bar, ledladder en vu, ballistiek, piekstreepje, clip-lampje; design.meters (skins 0.4) toepassen
(function(PK){
/* =====================================================================
   METERS · een meter LEEST alleen: AnalyserNodes die het apparaat al heeft (opts.source) of waarden die het apparaat zelf geeft (set). De host maakt of verbindt nooit nodes.
   Eén canvas per meter; tekenen en meten lopen via de tekenklok van de host (Host._frames, dezelfde rAF-lus als host.frame): alleen zolang de kaart in beeld is, 30 keer per seconde, één gedeelde buffer.
   Een meter waarvan het element uit elke kaart is verdwenen (UI herbouwd, apparaat weg) ruimt zichzelf na 2,5 s op, ook als het apparaat destroy() vergat.
   Zonder skin: gezicht bar (de Mixer-look), maat en richting van het apparaat. Skin (r.skMet = regels uit design.meters, de laatste passende wint per eigenschap) verandert alleen het gezicht, nooit het meetwerk of de waarden.
   ===================================================================== */
const ID_RE=/^[A-Za-z0-9._-]{1,60}$/;
const FACES=['bar','ledladder','vu'], LENS_B={short:48,medium:96,long:160}, LENS_V={short:72,medium:120,long:200}, KEYS=['face','orientation','length','width','ballistics','peakHold','clip','scale','color','segments'];
PK.MET_FACES=FACES; PK.MET_LENS_B=LENS_B; PK.MET_LENS_V=LENS_V;
const HOLD_FALL=0.4, VU_TAU=0.065, DEF_LEN=96, DEF_WID=10, FPS=30, ORPHAN_MS=2500;   // piekstreepje valt 0,4 van het bereik per seconde; VU: 99 % na 300 ms (tau 65 ms)
const METERS=new Set(); PK.METERS=METERS;
let SH=new Float32Array(2048), warned=false, RO=null;
const warn=m=>{ if(!warned){ warned=true; try{ console.warn('Patchkamer host.ui.meter: '+m); }catch(e){} } };
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dbOf=x=>{ const v=20*Math.log10(x+1e-9); return v!==v?-200:clamp(v,-200,200); };
// één meting van een AnalyserNode: [piek, rms] (lineair); de buffer is gedeeld
function meas(an){ const n=an.fftSize; if(SH.length<n) SH=new Float32Array(n); an.getFloatTimeDomainData(SH); let p=0,s=0;
  for(let i=0;i<n;i++){ const x=SH[i], a=x<0?-x:x; if(a>p) p=a; s+=x*x; } const r=Math.sqrt(s/n); return [p,r>=0?r:0]; }
const isAn=a=>!!a&&typeof a.getFloatTimeDomainData==='function'&&typeof a.fftSize==='number';

// ---- bouwen ----
function meterBuild(parent,label,o){
  o=o&&typeof o==='object'?o:{};
  const num=(v,a,b)=>typeof v==='number'&&isFinite(v)&&v>=a&&v<=b;
  const range=Array.isArray(o.range)&&o.range.length===2&&isFinite(o.range[0])&&isFinite(o.range[1])&&o.range[0]<o.range[1]?[+o.range[0],+o.range[1]]:[-60,0];
  const O={ id:(typeof o.id==='string'&&ID_RE.test(o.id))?o.id:'', group:(typeof o.group==='string'&&ID_RE.test(o.group))?o.group:'', unit:o.unit==='db'?'db':'linear', lo:range[0], hi:range[1],
    kind:o.kind==='rms'?'rms':'peak', hold:o.hold!==false, clip:num(o.clip,-200,200)?o.clip:null, orientation:o.orientation==='horizontal'?'horizontal':'vertical',
    length:num(o.length,3,2000)?Math.round(o.length):0, width:num(o.width,3,2000)?Math.round(o.width):0, label:String(label==null?'':label) };
  if(o.id!==undefined&&!O.id) warn('id moet [A-Za-z0-9._-] zijn, 1 tot 60 tekens');
  if(o.group!==undefined&&!O.group) warn('group moet [A-Za-z0-9._-] zijn');
  let src=null;
  if(o.source!=null){ const a=(Array.isArray(o.source)?o.source:[o.source]).slice(0,2); if(a.length&&a.every(isAn)) src=a; else warn('source moet een AnalyserNode zijn (of een lijst van 1 of 2): de meter wacht nu op set()'); }
  const el=document.createElement('div'); el.className='pk-meter'; el.setAttribute('role','meter'); el.setAttribute('aria-label',O.label);
  el.setAttribute('aria-valuemin',String(O.lo)); el.setAttribute('aria-valuemax',String(O.hi)); el.setAttribute('aria-valuenow',String(O.lo));
  if(O.id) el.setAttribute('data-pk-meter',O.id);
  el.style.cssText='position:relative;display:block;box-sizing:border-box;overflow:hidden';
  const cv=document.createElement('canvas'); cv.setAttribute('aria-hidden','true'); cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;display:block'; el.appendChild(cv);
  const nch=src?src.length:1;
  const M={el,cv,o:O,src,n:nch,raw:[O.lo,O.lo],pk:[O.lo,O.lo],val:[O.lo,O.lo],hold:[0,0],pend:[null,null],lastSet:[O.lo,O.lo],last:0,clipUntil:0,sig:'',dirty:true,cw:0,ch:0,rev:-1,eff:null,col:null,colT:0,ariaT:0,ariaV:null,orph:0,dead:false};
  el.__pkM=M;
  // het gezicht, de maat en de richting: zonder skin die van het apparaat
  const E={ iv:1000/FPS, last:0, cb:t=>tick(M,t),
    get inst(){ const r=PK.cardOf(el); if(r){ M.orph=0; return r.inst; } const now=performance.now(); if(!M.orph) M.orph=now; else if(now-M.orph>ORPHAN_MS) destroy(); return null; } };
  M.E=E;
  function set(level){ if(M.dead) return; const arr=Array.isArray(level)?level.slice(0,2):[level]; if(arr.length===2&&M.n<2) M.n=2;
    for(let i=0;i<arr.length;i++){ let v=+arr[i]; if(!isFinite(v)&&v!==Infinity) v=NaN; const d=O.unit==='db'?(v!==v?-200:clamp(v,-200,200)):dbOf(v!==v?0:Math.abs(v)); M.pend[i]=M.pend[i]==null?d:Math.max(M.pend[i],d); }
    if(arr.length===1&&M.n===2) M.pend[1]=M.pend[0]; }
  function destroy(){ if(M.dead) return; M.dead=true; METERS.delete(M); PK.Host._frames.delete(E); if(RO) try{ RO.unobserve(el); }catch(e){} el.remove(); }
  M.set=set; M.destroy=destroy; METERS.add(M);
  parent.appendChild(el);
  if(!RO&&typeof ResizeObserver==='function') RO=new ResizeObserver(es=>es.forEach(en=>{ const m=en.target.__pkM; if(m){ m.cw=Math.round(en.contentRect.width); m.ch=Math.round(en.contentRect.height); m.dirty=true; } }));
  if(RO) RO.observe(el);
  restyle(M); M.cw=el.clientWidth; M.ch=el.clientHeight;
  PK.Host._frames.add(E); PK.frameKick();
  return {el,set,id:O.id,destroy};
}
PK.meterBuild=meterBuild;

// ---- regels uit de skin ----
function matchRule(ru,M){ const m=ru.match; return m==='*'||(M.o.id&&m===M.o.id)||(M.o.group&&m==='group:'+M.o.group); }
function resolve(M,r){ const o=M.o, p={}, rules=r&&r.skMet; if(rules) for(const ru of rules){ if(!matchRule(ru,M)) continue; for(const k of KEYS) if(ru[k]!==undefined) p[k]=ru[k]; }
  const face=p.face&&p.face!=='default'?p.face:'bar', vu=face==='vu';
  const orient=vu?'horizontal':(p.orientation&&p.orientation!=='auto'?p.orientation:o.orientation);
  const tbl=vu?LENS_V:LENS_B, lenOf=v=>v===undefined?null:(typeof v==='number'?clamp(Math.round(v),24,400):tbl[v]||null);
  const e={ face, orient, len:lenOf(p.length), wid:vu||p.width===undefined?null:clamp(Math.round(p.width),3,48),
    bal:p.ballistics&&p.ballistics!=='default'?p.ballistics:(vu?'vu':'instant'),
    hold:p.peakHold==='on'?true:p.peakHold==='off'?false:o.hold,
    clip:p.clip==='hide'?null:p.clip==='show'?(o.clip!=null?o.clip:o.hi):o.clip,
    scale:p.scale?p.scale==='show':vu, color:/^#[0-9a-f]{6}$/i.test(p.color||'')?p.color:null, segs:clamp(Math.round(p.segments||20),8,40),
    skinned:!!Object.keys(p).length };
  return e; }
function layout(M){ const e=M.eff, o=M.o, s=M.el.style, px=v=>v+'px', devV=o.orientation!=='horizontal';
  const dev=()=>{ s.flex=''; s.minWidth=s.minHeight=''; s.width=devV?(o.width?px(o.width):'100%'):(o.length?px(o.length):'100%'); s.height=devV?(o.length?px(o.length):'100%'):(o.width?px(o.width):'100%'); };
  const vars=(a,b)=>{ if(a) s.setProperty('--pk-meter-len',px(a)); else s.removeProperty('--pk-meter-len'); if(b) s.setProperty('--pk-meter-wid',px(b)); else s.removeProperty('--pk-meter-wid'); };
  dev();
  if(e.face==='vu'){ const w=Math.max(56,e.len||DEF_LEN), h=Math.max(36,Math.round(w*0.6)); s.flex='none'; s.width=px(w); s.height=px(h); vars(w,h); return; }   // een VU-gezicht heeft minstens 56x36 px: het element groeit mee
  const turned=e.orient!==o.orientation;
  if(!turned&&e.len==null&&e.wid==null){ vars(devV?o.length:o.length,o.width); return; }
  const nw=M.el.clientWidth, nh=M.el.clientHeight, dLen=(devV?nh:nw)||DEF_LEN, dWid=(devV?nw:nh)||DEF_WID;
  const along=e.len!=null?e.len:(turned?dLen:(o.length||0)), across=e.wid!=null?e.wid:(turned?dWid:(o.width||0)), v=e.orient==='vertical';
  s.flex='none'; s.width=v?(across?px(across):'100%'):(along?px(along):'100%'); s.height=v?(along?px(along):'100%'):(across?px(across):'100%'); vars(along,across); }
function restyle(M){ if(M.dead) return; const r=PK.cardOf(M.el); M.rev=r?(r.skMetRev||0):0; M.eff=resolve(M,r); if(M.el.dataset.face!==M.eff.face) M.el.dataset.face=M.eff.face;   // het huidige gezicht (bar, ledladder, vu), zodat een apparaat zijn indeling erop kan afstemmen
  layout(M); M.col=null; M.dirty=true; M.sig=''; }
// een skin kwam of ging: alle meters van deze kaart opnieuw stylen
function meterApply(r){ if(!r) return; r.skMetRev=(r.skMetRev||0)+1; METERS.forEach(M=>{ if(PK.cardOf(M.el)===r) restyle(M); }); } PK.meterApply=meterApply;
PK.meterRules=d=>(d&&Array.isArray(d.meters))?d.meters:[];
// register: meters met een id, zoals host.ui.list ze geeft
PK.meterList=r=>{ const out=[]; METERS.forEach(M=>{ if(!M.o.id||PK.cardOf(M.el)!==r) return; const e=M.eff||resolve(M,r); out.push({id:M.o.id,role:'meter',group:M.o.group,label:M.o.label,type:'meter',min:M.o.lo,max:M.o.hi,face:e.face}); }); return out; };
PK.meterStats=r=>{ let n=0,m=0; METERS.forEach(M=>{ if(PK.cardOf(M.el)!==r) return; m++; if((M.eff||resolve(M,r)).skinned) n++; }); return {n,m}; };

// ---- meten, ballistiek, tekenen ----
function tick(M,t){ if(M.dead) return;
  const r=PK.cardOf(M.el); if(r&&(r.skMetRev||0)!==M.rev) restyle(M);
  const e=M.eff, o=M.o, n=M.n; let dt=M.last?(t-M.last)/1000:1/FPS; M.last=t; if(!(dt>0)) dt=1/FPS; if(dt>0.25) dt=0.25;
  if(M.src){ for(let i=0;i<M.src.length;i++){ try{ const m=meas(M.src[i]); M.pk[i]=dbOf(m[0]); M.raw[i]=o.kind==='rms'?dbOf(m[1]):M.pk[i]; }catch(er){ M.pk[i]=M.raw[i]=-200; } } }
  else for(let i=0;i<n;i++){ const p=M.pend[i]; if(p!=null){ M.lastSet[i]=p; M.pend[i]=null; } M.raw[i]=M.pk[i]=M.lastSet[i]; }
  let top=-200, sig=e.face+e.orient+(e.hold?'h':'')+(M.clipUntil>t?'c':'');
  for(let i=0;i<n;i++){ const x=M.raw[i]; let v=M.val[i];
    if(e.bal==='instant') v=x;
    else if(e.bal==='vu'){ const a=1-Math.exp(-dt/VU_TAU), cur=Math.pow(10,v/20), lin=Math.pow(10,x/20); v=dbOf(cur+(lin-cur)*a-1e-9); }
    else { const rate=e.bal==='slow'?6:24; v=x>=v?x:Math.max(x,v-rate*dt); }
    M.val[i]=v; const f=(v-o.lo)/(o.hi-o.lo), rf=clamp((x-o.lo)/(o.hi-o.lo),0,1);
    M.hold[i]=Math.max(rf,M.hold[i]-dt*HOLD_FALL); if(v>top) top=v; sig+='|'+Math.round(clamp(f,0,1)*600)+','+Math.round(M.hold[i]*600); }
  if(e.clip!=null){ for(let i=0;i<n;i++) if(M.pk[i]>=e.clip){ M.clipUntil=t+1500; break; } }
  const lit=e.clip!=null&&M.clipUntil>t; sig+=lit?'C':'';
  if(t-M.ariaT>=250){ M.ariaT=t; const v=String(Math.round(clamp(top,o.lo,o.hi))); if(v!==M.ariaV){ M.ariaV=v; M.el.setAttribute('aria-valuenow',v); M.el.setAttribute('aria-valuetext',v+' dB'); } }
  if(sig===M.sig&&!M.dirty) return; M.sig=sig; M.dirty=false; draw(M,lit); }
function colors(M){ const now=performance.now(); if(M.col&&now-M.colT<2000) return M.col; const cs=getComputedStyle(M.el), g=(k,d)=>cs.getPropertyValue(k).trim()||d;
  const c={audio:g('--audio','#4fd1c5'),go:g('--go','#6bd98a'),stop:g('--stop','#e4574a'),well:g('--well','#0b0d10'),fg:g('--fg','#dddddd'),line:g('--line','#3a404a'),muted:g('--muted','#8a93a0')};
  if(M.col&&Object.keys(c).some(k=>c[k]!==M.col[k])) M.dirty=true; M.col=c; M.colT=now; return c; }
function draw(M,lit){ const w=M.cw||M.el.clientWidth, h=M.ch||M.el.clientHeight; if(!(w>0&&h>0)) return;
  const dpr=window.devicePixelRatio||1, pw=Math.round(w*dpr), ph=Math.round(h*dpr), cv=M.cv; if(cv.width!==pw||cv.height!==ph){ cv.width=pw; cv.height=ph; }
  const g=cv.getContext('2d'); if(!g) return; g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h); const C=colors(M), e=M.eff;
  if(e.face==='vu') drawVu(M,g,w,h,C,e,lit); else if(e.face==='ledladder') drawLed(M,g,w,h,C,e,lit); else drawBar(M,g,w,h,C,e,lit); }
const fOf=(M,db)=>clamp((db-M.o.lo)/(M.o.hi-M.o.lo),0,1);
function well(g,w,h,C){ g.fillStyle=C.well; g.fillRect(0,0,w,h); g.strokeStyle=C.line; g.lineWidth=1; g.strokeRect(0.5,0.5,w-1,h-1); }
function lampEnd(g,x,y,w,h,C,lit,vert,on){ if(!on) return; g.globalAlpha=lit?1:0.22; g.fillStyle=C.stop; if(vert) g.fillRect(x,y,w,3); else g.fillRect(x+w-3,y,3,h); g.globalAlpha=1; }
function zoneColor(C,base,p){ return p<0.7?base:p<0.88?C.go:C.stop; }
function marks(M,max){ const lo=M.o.lo, hi=M.o.hi, span=hi-lo; const st=[1,2,3,5,6,10,12,20,30,60].find(s=>span/s<=Math.max(2,max))||60, out=[]; for(let v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st) out.push(v); return out; }
function drawBar(M,g,w,h,C,e,lit){ well(g,w,h,C); const x0=1,y0=1,iw=w-2,ih=h-2; if(iw<=0||ih<=0) return; const vert=e.orient==='vertical', n=M.n, base=e.color||C.audio;
  const gr=vert?g.createLinearGradient(0,y0+ih,0,y0):g.createLinearGradient(x0,0,x0+iw,0); gr.addColorStop(0,base); gr.addColorStop(0.6,base); gr.addColorStop(0.8,C.go); gr.addColorStop(0.96,C.stop); gr.addColorStop(1,C.stop);
  for(let i=0;i<n;i++){ const f=fOf(M,M.val[i]), hf=M.hold[i], cw=vert?(iw-(n-1))/n:iw, chh=vert?ih:(ih-(n-1))/n, cx=vert?x0+i*(cw+1):x0, cy=vert?y0:y0+i*(chh+1);
    g.fillStyle=gr; if(vert) g.fillRect(cx,cy+chh*(1-f),cw,chh*f); else g.fillRect(cx,cy,iw*f,chh);
    if(e.hold){ g.fillStyle=C.fg; if(vert) g.fillRect(cx,Math.max(cy,cy+chh*(1-hf)-2),cw,2); else g.fillRect(Math.min(cx+iw-2,cx+iw*hf),cy,2,chh); } }
  lampEnd(g,x0,y0,iw,ih,C,lit,vert,e.clip!=null); }
function drawLed(M,g,w,h,C,e,lit){ const vert=e.orient==='vertical', n=M.n, S=e.segs, base=e.color||C.audio; g.fillStyle=C.well; g.fillRect(0,0,w,h);
  const txt=e.scale&&(vert?w>=30:h>=22), strip=txt?(vert?16:11):0, ax=vert?h:w, cross=(vert?w-strip:h-strip), gap=(ax/S>4)?1:0, cell=(ax-gap*(S-1))/S, ch=(cross-(n-1))/n;
  if(!(cell>0&&ch>0)) return;
  for(let c=0;c<n;c++){ const f=fOf(M,M.val[c]), hf=M.hold[c], hi=Math.min(S-1,Math.floor(hf*S)), on=Math.ceil(f*S-1e-9);
    for(let i=0;i<S;i++){ const p=(i+0.5)/S, col=zoneColor(C,base,p), isOn=i<on, isHold=e.hold&&hf>0&&i===hi&&i>=on;
      g.fillStyle=col; g.globalAlpha=(isOn||isHold)?1:0.16; const a=vert?h-(i+1)*cell-i*gap:i*(cell+gap);
      if(vert) g.fillRect(c*(ch+1),a,ch,cell); else g.fillRect(a,c*(ch+1),cell,ch); } }
  g.globalAlpha=1;
  if(e.scale){ g.fillStyle=C.muted; g.strokeStyle=C.muted; g.lineWidth=1; g.font='8px system-ui, sans-serif'; g.textBaseline='middle';
    marks(M,Math.floor((vert?h:w)/(vert?20:34))).forEach(v=>{ const f=fOf(M,v), pos=vert?h-f*h:f*w;
      if(vert){ const x=w-strip; g.beginPath(); g.moveTo(x+0.5,pos); g.lineTo(x+(txt?3:0)+2.5,pos); g.stroke(); if(txt){ g.textAlign='left'; g.fillText(String(v),x+5,Math.min(h-4,Math.max(4,pos))); } }
      else { const y=h-strip; g.beginPath(); g.moveTo(pos,y+0.5); g.lineTo(pos,y+3.5); g.stroke(); if(txt){ g.textAlign='center'; const tw=g.measureText(String(v)).width/2; g.fillText(String(v),Math.min(w-tw,Math.max(tw,pos)),y+8); } } }); }
  lampEnd(g,0,0,vert?w-strip:w-0,vert?h:h-strip,C,lit,vert,e.clip!=null); }
function drawVu(M,g,w,h,C,e,lit){ well(g,w,h,C); const al=Math.PI/4, cx=w/2, cy=h*1.05, pad=Math.max(5,w*0.06), r=Math.max(10,Math.min((w/2-pad)/Math.sin(al),cy-(e.scale&&w>=96?14:9))), base=e.color||C.fg;
  const ang=f=>-Math.PI/2+(f-0.5)*2*al, pt=(f,rr)=>[cx+rr*Math.cos(ang(f)),cy+rr*Math.sin(ang(f))], fRed=fOf(M,M.o.hi-3);
  g.save(); g.beginPath(); g.rect(1,1,w-2,h-2); g.clip(); g.lineCap='butt';
  g.lineWidth=Math.max(2,w/40); g.strokeStyle=base; g.globalAlpha=0.85; g.beginPath(); g.arc(cx,cy,r,ang(0),ang(fRed)); g.stroke();
  g.strokeStyle=C.stop; g.globalAlpha=1; g.beginPath(); g.arc(cx,cy,r,ang(fRed),ang(1)); g.stroke();
  if(e.scale){ g.fillStyle=C.muted; g.strokeStyle=C.muted; g.lineWidth=1; g.font=Math.max(7,Math.min(10,w/12))+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    marks(M,w>=200?9:w>=140?6:w>=96?4:3).forEach(v=>{ const f=fOf(M,v), a=pt(f,r-2), b=pt(f,r-7); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); if(w>=96){ const t=pt(f,r-14); g.fillText(String(v),t[0],t[1]); } }); }
  const nd=[base,C.audio];
  for(let i=0;i<M.n;i++){ const f=fOf(M,M.val[i]), p=pt(f,r+2); g.strokeStyle=M.n>1?(i===0?C.fg:C.audio):(e.color||C.fg); g.lineWidth=1.5; g.beginPath(); g.moveTo(cx,cy); g.lineTo(p[0],p[1]); g.stroke();
    if(e.hold&&M.hold[i]>0){ const q=pt(M.hold[i],r+4); g.fillStyle=nd[i%2]; g.beginPath(); g.arc(q[0],q[1],1.6,0,6.3); g.fill(); } }
  g.restore();
  if(e.clip!=null){ g.globalAlpha=lit?1:0.22; g.fillStyle=C.stop; g.beginPath(); g.arc(w-7,7,3,0,6.3); g.fill(); g.globalAlpha=1; } }
})(window.__PK);
