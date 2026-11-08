// js/cable-draw.js — kabelkleur, tooltips, tekenen en het kabelmenu
(function(PK){
function cssRgb(v){ if(!PK._ccProbe){ PK._ccProbe=document.createElement('span'); PK._ccProbe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:0;height:0'; document.body.appendChild(PK._ccProbe); }
  PK._ccProbe.style.color=''; PK._ccProbe.style.color=v; const m=/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(PK._ccProbe).color); return m?[+m[1],+m[2],+m[3]]:null; }
const relLum=c=>{ const f=x=>{ x/=255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4); }; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
const contrastOf=(a,b)=>{ const x=relLum(a), y=relLum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
function rgb2hsl(c){ const r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn; let h=0,sa=0; if(d){ sa=d/(1-Math.abs(2*l-1)); h=mx===r?((g-b)/d+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; } return [h,sa,l]; }
function hsl2rgb(h,sa,l){ const k=n=>(n+h/30)%12, a=sa*Math.min(l,1-l), f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1))); return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)]; }
// verschuift de lichtheid (HSL) tot de kleur minstens `min`:1 haalt tegen de achtergrond
function fitContrast(rgb,bg,min){ if(contrastOf(rgb,bg)>=min) return rgb; const [h,sa,l0]=rgb2hsl(rgb); let best=rgb, bestC=contrastOf(rgb,bg);
  for(const dir of (relLum(bg)<0.4?[1,-1]:[-1,1])){ for(let l=l0;l>=0&&l<=1;l+=dir*0.02){ const c=hsl2rgb(h,sa,l), q=contrastOf(c,bg); if(q>bestC){ best=c; bestC=q; } if(q>=min) return c; } }
  return best; }
function cabCatColor(cat){ if(!cat||cat==='other') return null; const raw=PK.catColor(cat); if(!raw) return null;
  const key=(document.documentElement.dataset.skin||'dark')+'|'+raw; if(PK._ccCache.has(key)) return PK._ccCache.get(key);
  let out=null; const c=cssRgb(raw), fl=cssRgb('var(--floor)'); if(c&&fl){ const f=fitContrast(c,fl,3); out='rgb('+f[0]+','+f[1]+','+f[2]+')'; }
  if(PK._ccCache.size>400) PK._ccCache.clear(); PK._ccCache.set(key,out); return out; }
// de kleur die een kabel krijgt (of null = de kleur van zijn soort)
const cabSrcColor=id=>{ if(PK.V18.col!=='cat') return null; const r=PK.Host.devices.get(id); return r?cabCatColor(PK.categoryOf(r.def)):null; }; PK.cabSrcColor=cabSrcColor;
// ---- tekst bij een kabel: Bron - Doel ----
function cableTipText(c){ const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); if(!a||!b) return '';
  const pn=(r,dir,port)=>{ const l=PK.portList(r.ports,dir,c.kind); if(l.length<2) return ''; const p=l.find(x=>x.id===port); return p?' ('+p.name+')':''; };
  let t=a.def.name+pn(a,'out',c.from.port)+' - '+b.def.name+pn(b,'in',c.to.port); if(t.length>60) t=t.slice(0,59)+'…';
  const kk={multievent:'m.t_kabel_multievent',multi:'m.t_kabel_multi',mastering:'m.t_kabel_mastering'}[c.kind]; return kk?t+' '+PK.pkt(kk):t; } PK.cableTipText=cableTipText;
function cabTipHide(){ clearTimeout(PK.CABTIP.timer); PK.CABTIP.timer=0; PK.CABTIP.cable=null; if(PK.CABTIP.el){ PK.CABTIP.el.remove(); PK.CABTIP.el=null; } } PK.cabTipHide=cabTipHide;
function cabTipShow(c,x,y){ if(PK.wire||document.body.classList.contains('wiring')||PK.dropCable){ cabTipHide(); return; } clearTimeout(PK.CABTIP.timer); PK.CABTIP.timer=0;
  const t=cableTipText(c); if(!t){ cabTipHide(); return; }
  if(!PK.CABTIP.el){ PK.CABTIP.el=document.createElement('div'); PK.CABTIP.el.className='cabtip'; PK.CABTIP.el.setAttribute('role','tooltip'); document.body.appendChild(PK.CABTIP.el); }
  const el=PK.CABTIP.el; if(PK.CABTIP.cable!==c||el.textContent!==t){ el.textContent=t; PK.CABTIP.cable=c; }
  const W=el.offsetWidth, H=el.offsetHeight; el.style.left=Math.max(6,Math.min(x+14,innerWidth-W-6))+'px'; el.style.top=Math.max(6,Math.min(y+18,innerHeight-H-6))+'px'; } PK.cabTipShow=cabTipShow;
function cabTipLater(){ if(!PK.CABTIP.el||PK.CABTIP.timer) return; PK.CABTIP.timer=setTimeout(cabTipHide,90); } PK.cabTipLater=cabTipLater;
let _dcRaf=0;
function drawCables(){ if(_dcRaf) return; _dcRaf=requestAnimationFrame(()=>{ _dcRaf=0; drawCablesNow(); }); } PK.drawCables=drawCables;
function drawCablesNow(){ if(_dcRaf){ cancelAnimationFrame(_dcRaf); _dcRaf=0; } PK.paintFloorEmpty();
  while(PK.svg.firstChild) PK.svg.removeChild(PK.svg.firstChild);
  PK.floor.querySelectorAll('.port').forEach(p=>{ p.classList.remove('wired'); const d=p.querySelector('.dot'); if(d&&d.dataset.cc){ d.style.background=''; d.style.borderColor=''; delete d.dataset.cc; } });
  const srcCol=new Map(), colOf=id=>{ if(!srcCol.has(id)) srcCol.set(id,cabSrcColor(id)); return srcCol.get(id); };
  if(PK.CABTIP.cable&&!PK.Host.cables.includes(PK.CABTIP.cable)) cabTipHide();
  PK.Host.cables.forEach(c=>{ const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); if(!a||!b) return;
    if(PK.wire&&PK.wire.replace===c) return;   // een kabel die je omhangt, tekenen we als de losse kabel van het slepen
    if(a.el.classList.contains('infocus')||b.el.classList.contains('infocus')) return;   // in de focusweergave: geen kabels
    if(PK.secSame&&PK.secSame(c.from.id,c.to.id)) return;   // beide uiteinden in dezelfde geminimaliseerde sectie: niets te tekenen
    const p1=PK.portPos(c.from.id,c.from.port,'out'), p2=PK.portPos(c.to.id,c.to.port,'in'); if(!p1||!p2) return;
    const R=PK.cableRoute(c,p1,p2), P=R.P, d=R.d;
    const g=PK.svgEl('g',{class:'cable'+(PK.dropCable===c?' drop':'')},PK.svg);
    const hit=PK.svgEl('path',{d,class:'hit'},g); hit._cable=c; if(PK.PKT.coarse.matches) hit.style.strokeWidth=PK.clamp(28/PK.Host.view.scale,14,120)+'px'; hit.addEventListener('pointerdown',e=>{ if(e.button===0) PK.cgrab={c,x0:e.clientX,y0:e.clientY}; }); 
    hit.onclick=()=>{ if(performance.now()-PK.lastRewire<400) return; PK.unpatch(c); }; hit.addEventListener('contextmenu',e=>{ e.preventDefault(); e.stopPropagation(); cableMenu(c,e.clientX,e.clientY); });
    const vis=PK.svgEl('path',{d:c.kind==='mod'||c.kind==='mastering'?(R.pts?PK.wavePts(R.pts):PK.wavePath(P)):d,class:c.kind},g); const cc=c.color||colOf(c.from.id); if(cc) vis.style.stroke=cc;
    if(c.kind==='multi') PK.svgEl('path',{d,class:'multicore'},g);
    if(c.kind==='multievent') PK.svgEl('path',{d,class:'eventcore'},g);
    [[p1,c.from.id,c.from.port,'out'],[p2,c.to.id,c.to.port,'in']].forEach(([p,did,port,dir])=>{
      if(p.clipped){ const ci=PK.svgEl('circle',{cx:p.x,cy:p.y,r:5,class:'clip'},g); ci.style.stroke=cc||`var(--${c.kind==='event'?'event':c.kind==='mod'?'mod':c.kind==='multi'?'multi':c.kind==='mastering'?'mastering':c.kind==='multievent'?'event':'audio'})`; }
      const pe=PK.Host.devices.get(did).el.querySelector(`.port[data-port="${port}"][data-dir="${dir}"]`); if(!pe) return; pe.classList.add('wired');
      if(c.color){ const dot=pe.querySelector('.dot'); if(dot){ dot.style.background=c.color; dot.style.borderColor=c.color; dot.dataset.cc='1'; } } }); });
} PK.drawCablesNow=drawCablesNow;
function closeCableMenu(){ if(PK._cmenu){ PK._cmenu.remove(); PK._cmenu=null; document.removeEventListener('pointerdown',_cmOut,true); document.removeEventListener('keydown',_cmKey,true); } }
const _cmOut=e=>{ if(PK._cmenu&&!PK._cmenu.contains(e.target)) closeCableMenu(); }, _cmKey=e=>{ if(e.key==='Escape'){ e.stopPropagation(); closeCableMenu(); } };
function cableMenu(c,x,y){ closeCableMenu(); const a=PK.Host.devices.get(c.from.id); const m=document.createElement('div'); m.className='cablemenu'; m.setAttribute('role','dialog'); m.setAttribute('aria-label',PK.pkt('m.kabelkleur'));
  const kindName={audio:PK.pkt('m.audiokabel_vast'),event:PK.pkt('m.gebeurteniskabel_gestreept'),mod:PK.pkt('m.sturingskabel_golvend'),multi:PK.pkt('m.bundelkabel_dubbel')}[c.kind]||c.kind;
  m.innerHTML=PK.pkt('m.alle_kabels_van_standaardkleur_kabel',PK.esc(kindName),PK.esc(PK.cableLabel(c)),PK.esc(a?a.def.name:PK.pkt('m.deze_bron')));
  const sw=m.querySelector('.sw'), all=m.querySelector('.all');
  const targets=()=>all.checked?PK.Host.cables.filter(x=>x.from.id===c.from.id):[c];
  const setCol=col=>{ targets().forEach(x=>{ if(col) x.color=col; else delete x.color; }); drawCables(); paintSw(); };
  const paintSw=()=>sw.querySelectorAll('button').forEach(b=>b.classList.toggle('cur',b.dataset.c===c.color));
  PK.CABLE_COLORS.forEach(col=>{ const b=document.createElement('button'); b.type='button'; b.dataset.c=col; b.style.background=col; b.title=col; b.setAttribute('aria-label',PK.pkt('m.kleur')+col); b.onclick=()=>setCol(col); sw.appendChild(b); });
  m.querySelector('.std').onclick=()=>{ setCol(null); };
  m.querySelector('.del').onclick=()=>{ closeCableMenu(); PK.unpatch(c); };
  document.body.appendChild(m); paintSw(); const W=m.offsetWidth, Hh=m.offsetHeight; m.style.left=Math.max(8,Math.min(x,innerWidth-W-8))+'px'; m.style.top=Math.max(8,Math.min(y,innerHeight-Hh-8))+'px';
  PK._cmenu=m; setTimeout(()=>{ document.addEventListener('pointerdown',_cmOut,true); document.addEventListener('keydown',_cmKey,true); },0); } PK.cableMenu=cableMenu;
})(window.__PK);
