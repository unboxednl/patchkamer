// js/sections.js — secties voor skins (skins 0.5, design.sections): kader, kolommen, tussenruimte, kale regelaars en labelplaats per groep regelaars; alleen attributen en één stijlblok per wortel
(function(PK){
/* =====================================================================
   SECTIES · "sectie" = het element dat PRECIES de regelaars van één groep bevat: het laagste gemeenschappelijke voorouder-element van alle registerregelaars met group = X (shadow roots meegenomen).
   Het wordt alleen gestyled als alle registerregelaars in dat element dezelfde groep hebben en de groep minstens twee regelaars telt; anders blijft de sectie ongemoeid en telt ze niet mee in "n van m secties".
   Er wordt niets herschikt, verplaatst of verborgen: alleen attributen (data-pk-sec, -frame, -cols, -gap, -bare, -labels, -align op de sectie; data-pk-cell op de cel van een regelaar; data-pk-p op de delen van die cel)
   en één <style data-pk-secs> per wortel (document of shadow root). Verwijderen zet alles exact terug (de kaart houdt zijn eigen stijl en inline-stijlen ongemoeid).
   Regels: r.skSec = geordende lijst {match, frame?, columns?, gap?, bare?, labels?, align?}; de laatste passende regel wint per eigenschap.
   ===================================================================== */
const KEYS=['frame','columns','gap','bare','labels','align'];
const AT=['data-pk-sec','data-pk-frame','data-pk-cols','data-pk-gap','data-pk-bare','data-pk-labels','data-pk-align','data-pk-cell','data-pk-p'];
let CSS='[data-pk-sec]{box-sizing:border-box;--pk-gap:8px;--pk-pad:8px}\n'
+'[data-pk-sec][data-pk-gap=tight]{--pk-gap:3px;--pk-pad:4px}\n[data-pk-sec][data-pk-gap=wide]{--pk-gap:14px;--pk-pad:14px}\n[data-pk-sec][data-pk-gap]{gap:var(--pk-gap)}\n'
+'[data-pk-sec][data-pk-frame=none]{border:0;box-shadow:none;background:none}\n'
+'[data-pk-sec][data-pk-frame=line],[data-pk-sec][data-pk-frame=raised],[data-pk-sec][data-pk-frame=inset],[data-pk-sec][data-pk-frame=floating]{padding:var(--pk-pad);border-radius:8px}\n'
+'[data-pk-sec][data-pk-frame=line]{border:1px solid var(--line,#3a404a)}\n'
+'[data-pk-sec][data-pk-frame=raised]{border:1px solid color-mix(in srgb,var(--line,#3a404a) 55%,transparent);background:color-mix(in srgb,var(--fg,#ffffff) 6%,var(--card-2,var(--card,#1c2027)));box-shadow:0 1px 4px rgba(0,0,0,.35)}\n'
+'[data-pk-sec][data-pk-frame=inset]{border:0;background:color-mix(in srgb,#000000 25%,var(--card,#1c2027));box-shadow:inset 0 2px 6px rgba(0,0,0,.55)}\n'
+'[data-pk-sec][data-pk-frame=floating]{border:0;margin:4px;background:var(--card-2,var(--card,#1c2027));box-shadow:0 10px 24px rgba(0,0,0,.5)}\n'
+'[data-pk-sec][data-pk-cols]{display:grid;--pk-cw:110px}\n[data-pk-sec][data-pk-cols=auto]{grid-template-columns:repeat(auto-fill,minmax(var(--pk-cw),1fr))}\n[data-pk-sec][data-pk-cols=auto][data-pk-labels=below]{--pk-cw:72px}\n'
+'[data-pk-sec][data-pk-cols]:not([data-pk-cols=auto]){grid-template-columns:repeat(var(--pk-n,1),minmax(0,1fr))}\n'
+'[data-pk-sec][data-pk-cols][data-pk-align=center]>[data-pk-cell]{max-width:100%;box-sizing:border-box}\n'
+'[data-pk-sec][data-pk-align=center]{justify-items:center}\n[data-pk-sec][data-pk-align=center]:not([data-pk-cols]){justify-content:center}\n'
+'[data-pk-sec][data-pk-bare]>[data-pk-cell]{border:0;background:none;box-shadow:none;border-radius:0;padding:2px 0}\n'
+'[data-pk-sec][data-pk-labels]>[data-pk-cell]{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}\n'
+'[data-pk-sec][data-pk-labels]>[data-pk-cell] select,[data-pk-sec][data-pk-labels]>[data-pk-cell] input[type=text]{max-width:100%;box-sizing:border-box}\n'
+'[data-pk-sec][data-pk-labels][data-pk-align=center]>[data-pk-cell]{align-items:center;text-align:center}\n'
+'[data-pk-sec][data-pk-labels]>[data-pk-cell]>[data-pk-p]{order:3}\n'
+'[data-pk-sec][data-pk-labels=below]>[data-pk-cell]>[data-pk-p=v]{order:1}\n[data-pk-sec][data-pk-labels=below]>[data-pk-cell]>[data-pk-p=c]{order:2}\n'
+'[data-pk-sec][data-pk-labels=above]>[data-pk-cell]>[data-pk-p=l]{order:1}\n[data-pk-sec][data-pk-labels=above]>[data-pk-cell]>[data-pk-p=v]{order:2}\n[data-pk-sec][data-pk-labels=above]>[data-pk-cell]>[data-pk-p=c]{order:3}\n';
for(let n=1;n<=12;n++) CSS+='[data-pk-sec][data-pk-cols="'+n+'"]{--pk-n:'+n+'}\n';
function ensureCss(root){ if(!root) return; if(root.nodeType===11){ if(![...root.children].some(x=>x.tagName==='STYLE'&&x.hasAttribute('data-pk-secs'))){ const s=document.createElement('style'); s.setAttribute('data-pk-secs',''); s.textContent=CSS; root.appendChild(s); } }
  else if(!document.getElementById('pkSecCss')){ const s=document.createElement('style'); s.id='pkSecCss'; s.textContent=CSS; document.head.appendChild(s); } }

// ---- vinden ----
const up=n=>n&&(n.parentNode&&n.parentNode.nodeType===11?n.parentNode.host:n.parentNode);
const inside=(n,a)=>{ for(let x=up(n);x;x=up(x)) if(x===a) return true; return false; };
// per groep: {g, xs (registerregelaars), el (de sectie of null)}
function secDetect(r){ const ui=PK.regUi(r), by=new Map();
  const ents=PK.regEntries(r).map(e=>({e,d:PK.regDesc(e.el)})).filter(x=>x.d);
  ents.forEach(x=>{ const g=x.d.group; if(!g) return; if(!by.has(g)) by.set(g,[]); by.get(g).push(x); });
  const out=[];
  by.forEach((xs,g)=>{ let el=null;
    if(xs.length>=2){ const els=xs.map(x=>x.e.el);
      for(let c=up(els[0]);c&&c!==ui&&inside(c,ui);c=up(c)){ if(els.every(x=>inside(x,c))){ if(ents.every(y=>y.d.group===g||!inside(y.e.el,c))) el=c; break; } } }
    out.push({g,xs,el}); });
  return out; }
function secProps(rules,g){ let p=null; for(const ru of rules){ if(ru.match!=='*'&&ru.match!=='group:'+g) continue; p=p||{}; for(const k of KEYS) if(ru[k]!==undefined) p[k]=ru[k]; } return p; }
function secAttrs(p){ const a={}; if(!p) return a;
  if(p.frame&&p.frame!=='default') a['data-pk-frame']=p.frame;
  if(p.columns!==undefined) a['data-pk-cols']=String(p.columns);
  if(p.gap) a['data-pk-gap']=p.gap;
  if(p.bare===true) a['data-pk-bare']='';
  if(p.labels&&p.labels!=='default') a['data-pk-labels']=p.labels;
  const al=p.align||(a['data-pk-labels']==='below'?'center':null); if(al&&(p.align||a['data-pk-labels'])) a['data-pk-align']=al;
  return a; }

// ---- toepassen en terugzetten ----
function secStrip(r){ (r.secEls||[]).forEach(e=>AT.forEach(a=>e.removeAttribute(a))); r.secEls=[]; }
function secOff(r){ secStrip(r); if(r.secMO){ r.secMO.disconnect(); r.secMO=null; }
  (r.secRoots||[]).forEach(rt=>{ if(rt.nodeType===11) [...rt.children].forEach(x=>{ if(x.tagName==='STYLE'&&x.hasAttribute('data-pk-secs')) x.remove(); }); }); r.secRoots=[];
  const s=document.getElementById('pkSecCss'); if(s){ let any=false; PK.Host.devices.forEach(c=>{ if(c.skSec) any=true; }); if(!any) s.remove(); } }
function secApply(r){ if(!r||!r.el) return; secStrip(r); if(!r.skSec||!r.skSec.length){ secOff(r); return; }
  const roots=new Set(), marked=[]; r.secStat={n:0,m:0};
  secDetect(r).forEach(s=>{ r.secStat.m++; if(!s.el) return; const at=secAttrs(secProps(r.skSec,s.g)); if(!Object.keys(at).length) return;
    r.secStat.n++; roots.add(s.el.getRootNode()); s.el.setAttribute('data-pk-sec',''); for(const k in at) s.el.setAttribute(k,at[k]); marked.push(s.el);
    if(at['data-pk-bare']!==undefined||at['data-pk-labels']){ s.xs.forEach(x=>{ let cell=x.e.el; while(cell&&up(cell)!==s.el) cell=up(cell); if(!cell||cell===x.e.m||cell.nodeType!==1) return; cell.setAttribute('data-pk-cell',''); marked.push(cell);
      if(at['data-pk-labels']) [...cell.children].forEach(ch=>{ const p=ch.tagName==='OUTPUT'?'v':(ch===x.e.m||ch.contains(x.e.m)||ch.classList.contains('kn')||ch.__pkInput===x.e.m)?'c':'l'; ch.setAttribute('data-pk-p',p); marked.push(ch); }); }); } });
  r.secEls=marked; r.secRoots=[...roots]; roots.forEach(ensureCss);
  // een herbouwde UI (nieuwe elementen) volgt: alleen toegevoegde elementen tellen
  if(!r.secMO){ let q=false; r.secMO=new MutationObserver(ms=>{ if(q||!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.tagName!=='STYLE'))) return; q=true; requestAnimationFrame(()=>{ q=false; if(r.skSec&&r.el.isConnected) secApply(r); }); }); }
  r.secMO.disconnect(); const ui=PK.regUi(r), base=r.el.querySelector(':scope > .body')||r.el; r.secMO.observe(base,{childList:true,subtree:true}); secShadows(ui).forEach(sr=>r.secMO.observe(sr,{childList:true,subtree:true}));
  PK.drawCables(); } PK.secApply=secApply;
function secShadows(root){ const out=[]; const walk=n=>{ if(n.shadowRoot){ out.push(n.shadowRoot); walk(n.shadowRoot); } n.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot){ out.push(e.shadowRoot); walk(e.shadowRoot); } }); }; walk(root); return out; }
// statistiek voor het paneel en de ontwerper: n secties toegepast van m groepen met regelaars (nu, zonder iets te veranderen)
PK.secStats=r=>{ if(!r) return {n:0,m:0}; const rules=r.skSec||[]; let n=0,m=0; secDetect(r).forEach(s=>{ m++; if(s.el&&Object.keys(secAttrs(secProps(rules,s.g))).length) n++; }); return {n,m}; };
// lijst groepen van een kaart (voor de ontwerper)
PK.secGroups=r=>{ const out=new Set(); if(r) PK.regEntries(r).forEach(e=>{ const d=PK.regDesc(e.el); if(d&&d.group) out.add(d.group); }); return [...out]; };
})(window.__PK);
