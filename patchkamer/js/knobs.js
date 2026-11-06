// js/knobs.js — host.ui.knob (schuif of draaiknop), beginwaarden en waarde typen
(function(PK){
function pkKnob(parent,label,mn,mx,st,val,fmt,onchange,opts){
  const w=document.createElement('div'); w.className='k'; const l=document.createElement('label'); l.textContent=label;
  const i=document.createElement('input'); i.type='range'; i.min=mn; i.max=mx; i.step=st; i.value=val; i.setAttribute('aria-label',label);
  if(opts.default!==undefined&&isFinite(+opts.default)) i.dataset.pkDefault=String(+opts.default);
  const o=document.createElement('output'); o.textContent=fmt(val);
  const kn=document.createElement('span'); kn.className='kn'; kn.tabIndex=0; kn.setAttribute('role','slider'); kn.setAttribute('aria-label',label); kn.__pkInput=i;
  kn.style.cssText='display:none;width:30px;height:30px;cursor:ns-resize;touch-action:none;justify-self:start;outline-offset:2px';
  kn.innerHTML='<svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true"><path class="tr" fill="none" stroke="var(--line,#3a404a)" stroke-width="3.2" stroke-linecap="round"/><path class="vl" fill="none" stroke="var(--audio,#4fd1c5)" stroke-width="3.2" stroke-linecap="round"/><circle cx="15" cy="15" r="8.2" fill="var(--panel-2,var(--panel,#1c2027))" stroke="var(--line,#3a404a)"/><line class="pt" x1="15" y1="15" stroke="var(--fg,#ddd)" stroke-width="2" stroke-linecap="round"/></svg>';
  const log=opts.scale==='log'&&+mn>0&&+mx>+mn; if(log) i.dataset.pkScale='log';
  const toF=v=>{ v=+v; if(log) return Math.log(v/mn)/Math.log(mx/mn); return (v-mn)/((mx-mn)||1); };
  const fromF=f=>{ f=Math.max(0,Math.min(1,f)); let v=log?mn*Math.pow(mx/mn,f):mn+f*(mx-mn); if(+st>0) v=+mn+Math.round((v-mn)/st)*st; return Math.max(mn,Math.min(mx,+v.toFixed(10))); };
  const P=(a,r)=>{ const t=a*Math.PI/180; return [(15+r*Math.cos(t)).toFixed(2),(15+r*Math.sin(t)).toFixed(2)]; };
  const arc=(a0,a1,r)=>{ const [x0,y0]=P(a0,r),[x1,y1]=P(a1,r); return `M${x0},${y0} A${r},${r} 0 ${a1-a0>180?1:0} 1 ${x1},${y1}`; };
  const svgE=kn.firstChild; svgE.querySelector('.tr').setAttribute('d',arc(135,405,12.5));
  const paint=v=>{ const f=Math.max(0,Math.min(1,toF(v))), a=135+270*f; svgE.querySelector('.vl').setAttribute('d',f>0.002?arc(135,a,12.5):''); const [x,y]=P(a,7); const pt=svgE.querySelector('.pt'); pt.setAttribute('x2',x); pt.setAttribute('y2',y); kn.setAttribute('aria-valuenow',String(v)); };
  const fire=v=>{ i.value=v; i.dispatchEvent(new Event('input',{bubbles:true})); if(PK.hapticTick) PK.hapticTick(kn,'turn'); };
  i.oninput=()=>{ o.textContent=fmt(+i.value); paint(+i.value); onchange(+i.value); };
  i.addEventListener('change',()=>paint(+i.value));
  let dr=null;
  kn.addEventListener('pointerdown',e=>{ if(e.button!==0) return; e.preventDefault(); e.stopPropagation(); try{ kn.setPointerCapture(e.pointerId); }catch(_){} kn.focus({preventScroll:true}); dr={y:e.clientY,f:toF(+i.value)}; });
  kn.addEventListener('pointermove',e=>{ if(!dr) return; const k=e.shiftKey?0.1:1; dr.f=Math.max(0,Math.min(1,dr.f+(dr.y-e.clientY)/180*k)); dr.y=e.clientY; const v=fromF(dr.f); if(String(v)!==i.value) fire(v); });
  const end=()=>{ if(dr){ dr=null; i.dispatchEvent(new Event('change',{bubbles:true})); } }; kn.addEventListener('pointerup',end); kn.addEventListener('pointercancel',end);
  kn.addEventListener('keydown',e=>{ const d={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:10,PageDown:-10}[e.key]; if(!d) return; e.preventDefault(); e.stopPropagation(); fire(fromF(toF(+i.value)+d*(e.shiftKey?0.002:0.01))); });
  kn.addEventListener('wheel',e=>{ if(!kn.matches(':focus')) return; e.preventDefault(); fire(fromF(toF(+i.value)+(e.deltaY<0?1:-1)*(e.shiftKey?0.002:0.01))); },{passive:false});
  w.append(l,i,kn,o); parent.appendChild(w); paint(val);
  const K={w,i,kn}; PK.PKKNOBS.add(K); knobLook(K);
  return {set(v){ i.value=v; o.textContent=fmt(v); paint(v); }, el:w, input:i};
} PK.pkKnob=pkKnob;
// stijl en grootte per kaart: een skin (design.knobs) kan de globale instelling overschrijven (r.skKnob 'rotary'|'slider', r.skKs schaal)
function knobCard(K){ for(let n=K.w;n;){ if(n.classList&&n.classList.contains('card')&&n.dataset&&PK.Host.devices.has(n.dataset.id)) return PK.Host.devices.get(n.dataset.id); n=n.parentNode&&n.parentNode.nodeType===11?n.parentNode.host:n.parentNode; } return null; }
function knobsRefresh(r){ PK.PKKNOBS.forEach(K=>{ if(!K.w.isConnected){ PK.PKKNOBS.delete(K); return; } if(knobCard(K)===r) knobLook(K); }); PK.drawCables(); } PK.knobsRefresh=knobsRefresh;
function knobCount(r){ let n=0; PK.PKKNOBS.forEach(K=>{ if(K.w.isConnected&&knobCard(K)===r) n++; }); return n; } PK.knobCount=knobCount;
function knobStats(){ let n=0,m=0; PK.Host.devices.forEach(r=>{ m++; if(knobCount(r)) n++; }); return {n,m}; } PK.knobStats=knobStats;
function knobLook(K){ const c=knobCard(K); if(!c&&!K.w.isConnected&&PK.SK&&!K.late){ K.late=true; requestAnimationFrame(()=>{ K.late=false; if(K.w.isConnected&&knobCard(K)&&knobCard(K).skKnob) knobLook(K); }); }
  const r=(c&&c.skKnob?c.skKnob:PK.V18.knob)==='rotary', zs=c&&c.skKs; if(zs) K.w.style.zoom=String(zs); else if(K.w.style.zoom) K.w.style.removeProperty('zoom'); K.kn.style.display=r?'inline-block':'none'; K.i.style.cssText=r?'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;margin:0':''; K.w.style.position=r?'relative':''; }
function setKnobStyle(m){ PK.V18.knob=m==='rotary'?'rotary':'slider'; try{ localStorage.setItem('patchkamer.knobs',PK.V18.knob); }catch(e){} PK.PKKNOBS.forEach(K=>{ if(!K.w.isConnected){ PK.PKKNOBS.delete(K); return; } knobLook(K); }); PK.drawCables(); } PK.setKnobStyle=setKnobStyle;
function ctlRanges(root){ const out=[]; const walk=r=>{ r.querySelectorAll('input[type=range]').forEach(x=>out.push(x)); r.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot) walk(e.shadowRoot); }); }; if(root) walk(root); return out; }
function ctlBase(inp){ let t=inp.getAttribute('aria-label')||inp.name||inp.id||inp.title||'';
  if(!t&&inp.labels&&inp.labels[0]) t=inp.labels[0].textContent;
  if(!t&&inp.previousElementSibling) t=inp.previousElementSibling.textContent;
  if(!t&&inp.parentElement&&inp.parentElement.previousElementSibling) t=inp.parentElement.previousElementSibling.textContent;
  return String(t||'').replace(/[-+−\d.,:%]+/g,' ').replace(/\s+/g,' ').trim().slice(0,48); } PK.ctlBase=ctlBase;
function ctlKeys(list){ const n=new Map(); return list.map(x=>{ const b=ctlBase(x), c=n.get(b)||0; n.set(b,c+1); return b+'#'+c; }); }
function ctlSnapshot(rec,ui){ try{ const L=ctlRanges(ui), K=ctlKeys(L); rec._ctlDef=new Map(); L.forEach((x,j)=>{ PK.CTLDEF.set(x,x.value); rec._ctlDef.set(K[j],x.value); }); }catch(e){} } PK.ctlSnapshot=ctlSnapshot;
function ctlDefault(rec,inp){ if(inp.dataset&&inp.dataset.pkDefault!==undefined) return inp.dataset.pkDefault; if(PK.CTLDEF.has(inp)) return PK.CTLDEF.get(inp);
  if(rec&&rec._ctlDef){ const L=ctlRanges(rec.el.querySelector(':scope > .body > .ui')||rec.el), K=ctlKeys(L), j=L.indexOf(inp); if(j>=0&&rec._ctlDef.has(K[j])) return rec._ctlDef.get(K[j]); }
  const a=inp.getAttribute('value'); return a!==null?a:null; } PK.ctlDefault=ctlDefault;
function pathUp(el){ const p=[]; for(let n=el;n;){ p.push(n); n=n.parentNode&&n.parentNode.nodeType===11?n.parentNode.host:n.parentNode; } return p; }
function ctlCard(path){ for(const e of path){ if(e&&e.classList&&e.classList.contains('card')&&e.dataset&&PK.Host.devices.has(e.dataset.id)) return PK.Host.devices.get(e.dataset.id); } return null; } PK.ctlCard=ctlCard;
function ctlFire(inp,v,change){ inp.value=String(v); inp.dispatchEvent(new Event('input',{bubbles:true,composed:true})); if(change) inp.dispatchEvent(new Event('change',{bubbles:true,composed:true})); } PK.ctlFire=ctlFire;

// ---------- klik op het getal: waarde typen ----------
function ctlParse(t){ t=String(t||'').trim().replace(/−/g,'-'); const m=t.match(/^([+-]?\s*\d+(?:[.,]\d+)?|[+-]?\s*[.,]\d+)/); if(!m) return null; const v=parseFloat(m[1].replace(/\s/g,'').replace(',','.')); const u=t.slice(m[0].length).trim(); let k=1;
  if(/^ms\b/i.test(u)) k=1e-3; else if(/^(µs|us)\b/i.test(u)) k=1e-6; else if(/^min\b/.test(u)) k=60; else if(/^[kK](?![a-z]{2})/.test(u)) k=1e3; else if(/^M(?![a-z]{2})/.test(u)) k=1e6;
  return isFinite(v)?{v,k,unit:u.length>0}:null; }
function ctlNum(t){ const p=ctlParse(t); return p?p.v*p.k:NaN; }   // genormaliseerd: ms→s, k→×1000
function ctlLooksNum(t){ t=String(t||'').trim(); return t.length>0&&t.length<=16&&/^[+\-−]?\s*[.,]?\d[\d.,]*\s*[kKM]?\s*[a-zA-Zµ°%²/'"·]{0,5}\s*$/.test(t); } PK.ctlLooksNum=ctlLooksNum;
function ctlPair(path,rec){ let ro=null, k=0;
  for(;k<path.length;k++){ const x=path[k]; if(x===rec.el||!x||x.nodeType!==1) break; const tg=x.tagName;
    if(/^(INPUT|SELECT|BUTTON|TEXTAREA|A|CANVAS|svg)$/i.test(tg)||x.isContentEditable||x.onclick||x.getAttribute('role')==='button') return null;
    if(!ro){ if((x.children.length===0||tg==='OUTPUT')&&ctlLooksNum(x.textContent)) ro=x; else return null; continue; }
    if(x.dataset&&x.dataset.pkFor){ const r=x.getRootNode(); const t=r.getElementById&&r.getElementById(x.dataset.pkFor); if(t) return {ro,inp:t}; }
    const L=x.querySelectorAll('input[type=range]'); if(L.length>1) return null;
    if(L.length===1){ let dep=0; for(let a=L[0].parentElement;a&&a!==x;a=a.parentElement) dep++; return (dep<=1&&k<=3&&x.querySelectorAll('*').length<=14)?{ro,inp:L[0]}:null; }
    if(k>=3) return null; }
  return null; } PK.ctlPair=ctlPair;
// Kaarten die zichzelf opnieuw opbouwen (nieuwe elementen na een wijziging): zoek de schuif op zijn sleutel en het getal
// op dezelfde plek in dezelfde groep terug.
function ctlLocator(rec,inp,ro){ if(!rec) return null; const root=rec.el.querySelector(':scope > .body > .ui')||rec.el; const L=ctlRanges(root), K=ctlKeys(L), j=L.indexOf(inp); if(j<0) return null;
  let up=0, box=inp.parentElement; while(box&&!box.contains(ro)&&up<4){ box=box.parentElement; up++; } if(!box||!box.contains(ro)) return null;
  const idx=[...box.querySelectorAll('*')].indexOf(ro); return {root,key:K[j],up,idx}; }
function ctlRelocate(Lc){ const L=ctlRanges(Lc.root), K=ctlKeys(L), j=K.indexOf(Lc.key); if(j<0) return null; const inp=L[j]; let box=inp.parentElement; for(let u=0;u<Lc.up&&box;u++) box=box.parentElement; if(!box) return null; const ro=box.querySelectorAll('*')[Lc.idx]; return ro?{inp,ro}:null; }
function ctlSolve(inp,ro,target,rec){ const mn=inp.min===''?0:+inp.min, mx=inp.max===''?100:+inp.max, st=inp.step==='any'?0:(inp.step===''?1:+inp.step), orig=inp.value;
  const Lc=ctlLocator(rec||ctlCard(pathUp(inp)),inp,ro);
  const read=v=>{ if(!inp.isConnected||!ro.isConnected){ const n=Lc&&ctlRelocate(Lc); if(!n) return NaN; inp=n.inp; ro=n.ro; } ctlFire(inp,v,false); if(!ro.isConnected&&Lc){ const n=ctlRelocate(Lc); if(!n) return NaN; inp=n.inp; ro=n.ro; } return ctlNum(ro.textContent); };
  const snap=v=>{ v=Math.max(mn,Math.min(mx,v)); if(st>0) v=mn+Math.round((v-mn)/st)*st; return +Math.max(mn,Math.min(mx,v)).toFixed(10); };
  let lo=mn, hi=mx, a=read(lo), b=read(hi);
  if(!isFinite(a)){ lo=snap(mn+(mx-mn)*0.01); a=read(lo); } if(!isFinite(b)){ hi=snap(mx-(mx-mn)*0.01); b=read(hi); }
  if(!isFinite(a)||!isFinite(b)||a===b){ ctlFire(inp,orig,false); return false; }
  const up=b>a; if(up?target<=a:target>=a){ ctlFire(inp,snap(lo),true); return true; } if(up?target>=b:target<=b){ ctlFire(inp,snap(hi),true); return true; }
  for(let n=0;n<40;n++){ const m=(lo+hi)/2, d=read(m); if(!isFinite(d)) break; if((d<target)===up) lo=m; else hi=m; }
  let best=snap((lo+hi)/2), bd=Infinity; const cand=st>0?[best-st,best,best+st]:[best];
  for(const c of cand){ const v=snap(c), d=read(v); if(isFinite(d)&&Math.abs(d-target)<bd){ bd=Math.abs(d-target); best=v; } }
  ctlFire(inp,best,true); return true; }
function ctlEntry(rec,ro,inp){ if(PK._pkEntry) PK._pkEntry.remove(); const b=ro.getBoundingClientRect(); const f=document.createElement('input'); f.className='pkentry'; f.type='text'; f.value=String(ro.textContent).trim();
  f.style.left=Math.round(b.left-4)+'px'; f.style.top=Math.round(b.top-3)+'px'; f.style.width=Math.max(56,Math.round(b.width+28))+'px'; f.setAttribute('aria-label',PK.pkt('m.waarde_typen')); f.title=PK.pkt('m.typ_een_waarde_bijv_440');
  document.body.appendChild(f); PK._pkEntry=f; f.focus(); f.select();
  const done=ok=>{ if(PK._pkEntry!==f) return; PK._pkEntry=null; const t=f.value; f.remove(); if(!ok) return; const P=ctlParse(t), Q=ctlParse(ro.textContent), v=P?P.v*(P.unit?P.k:(Q?Q.k:1)):NaN; if(!isFinite(v)){ PK.status(PK.pkt('m.geen_getal')+t,true); return; } if(!ctlSolve(inp,ro,v,rec)) PK.status(PK.pkt('m.deze_schuif_laat_geen_getal'),true); };
  f.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); done(true); } else if(e.key==='Escape'){ e.preventDefault(); done(false); } });
  f.addEventListener('blur',()=>done(false)); } PK.ctlEntry=ctlEntry;
})(window.__PK);
