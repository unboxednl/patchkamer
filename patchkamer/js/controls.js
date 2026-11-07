// js/controls.js — regelaars herkenbaar voor skins: register (data-pk-id/role/group), host.ui.adopt en host.ui.list, regels uit design.controls toepassen (gezichten, maat, lengte, kleur)
(function(PK){
/* =====================================================================
   REGELAARS (contract v1.15, skins 0.3) · het model blijft de waarheid: een echte <input type=range>, <select>, checkbox of knop met zijn eigen events; de skin kiest alleen het gezicht.
   Register: geen aparte lijst die kan verouderen. Een regelaar staat erin als hij via host.ui.knob/select is gebouwd, of als hij data-pk-id/-role/-group draagt (zelf gezet of via host.ui.adopt).
   Zo volgt het register ook een apparaat dat zijn UI herbouwt. Zonder skin (geen r.skCtl) raakt dit bestand de DOM van een apparaat niet aan, behalve de data-pk-*-attributen.
   Regels: r.skCtl = geordende lijst {match, face?, size?, length?, thickness?, thumb?, color?, showValue?}; de laatste passende regel wint per eigenschap.
   ===================================================================== */
const ROLES=['param','fader','toggle','button','pad','step','display','select','meter','jack'];
const ID_RE=/^[A-Za-z0-9._-]{1,60}$/, MODEL='input[type=range],input[type=checkbox],select,button';
const DEF_ROLE={range:'param',check:'toggle',select:'select',button:'button'};
const SIZES={xs:0.6,s:0.8,m:1,l:1.3,xl:1.6}, LENS={short:60,medium:120,long:200};
const KEYS=['face','size','length','thickness','thumb','color','showValue'];
const VARS=['--pk-len','--pk-th','--pk-col','--pk-tw','--pk-tht','--pk-tr','--pk-mt','--pk-ml','--pk-f','--pk-dir','--pk-tbg'];
PK.REG_ROLES=ROLES; PK.REG_SIZES=SIZES; PK.REG_LENS=LENS;
let warned=false;
const warn=(m)=>{ if(!warned){ warned=true; try{ console.warn('Patchkamer host.ui: '+m); }catch(e){} } };

// ---- taggen en adopteren ----
function regTag(el,o,dflt){ if(!o||typeof o!=='object') return undefined; let id;
  if(o.id!==undefined){ if(typeof o.id==='string'&&ID_RE.test(o.id)){ el.setAttribute('data-pk-id',o.id); id=o.id; } else warn('id moet [A-Za-z0-9._-] zijn, 1 tot 60 tekens'); }
  if(o.role!==undefined){ if(typeof o.role==='string'&&ROLES.includes(o.role)) el.setAttribute('data-pk-role',o.role); else warn('onbekende rol '+o.role); }
  if(o.group!==undefined){ if(typeof o.group==='string'&&ID_RE.test(o.group)) el.setAttribute('data-pk-group',o.group); else warn('group moet [A-Za-z0-9._-] zijn'); }
  return id; } PK.regTag=regTag;
// host.ui.adopt(el, {id, role, group, label}): zelfde als de attributen zetten; alleen elementen met een model; geeft el terug
function regAdopt(el,o){ if(!el||el.nodeType!==1||!regModel(el)){ warn('adopt: element zonder model (range, checkbox, select of button)'); return el; }
  regTag(el,o); if(o&&typeof o.label==='string'&&o.label) el.setAttribute('data-pk-label',o.label.slice(0,80));
  const r=PK.cardOf(el); if(r&&r.skCtl) PK.regApply(r);
  return el; } PK.regAdopt=regAdopt;

// ---- beschrijven ----
function regModel(el){ if(!el||el.nodeType!==1) return null; return el.matches(MODEL)?el:el.querySelector(MODEL); }
function regType(m){ return m.tagName==='SELECT'?'select':m.tagName==='BUTTON'?'button':m.type==='checkbox'?'check':'range'; }
function regDesc(el){ const m=regModel(el); if(!m) return null; const type=regType(m), ro=el.getAttribute('data-pk-role');
  return {m,type,id:el.getAttribute('data-pk-id')||'',role:ro&&ROLES.includes(ro)?ro:DEF_ROLE[type],group:el.getAttribute('data-pk-group')||''}; }
function regLabel(el,m){ const l=el.getAttribute('data-pk-label')||m.getAttribute('aria-label')||(el.querySelector&&el.querySelector('label')&&el.querySelector('label').textContent)||(m.tagName==='BUTTON'?m.textContent:'')||m.title||''; return String(l).trim(); }
const regUi=r=>r.el.querySelector(':scope > .body > .ui')||r.el;
function regRoots(root){ const out=[]; const walk=n=>{ if(n.shadowRoot){ out.push(n.shadowRoot); walk(n.shadowRoot); } n.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot){ out.push(e.shadowRoot); walk(e.shadowRoot); } }); }; walk(root); return out; }
// alle regelaars van een kaart: host.ui.knob-knoppen (ook zonder id) en alles met data-pk-*; {el (wrapper of model), m (model), K? (hostknop)}
function regEntries(r){ const out=[], seen=new Set();
  PK.PKKNOBS.forEach(K=>{ if(K.w.isConnected&&PK.cardOf(K.w)===r){ out.push({el:K.w,m:K.i,K}); seen.add(K.w); } });
  const scan=root=>{ root.querySelectorAll('[data-pk-id],[data-pk-role],[data-pk-group]').forEach(e=>{ if(seen.has(e)) return; const m=regModel(e); if(!m) return; seen.add(e); out.push({el:e,m}); }); };
  const ui=regUi(r); scan(ui); regRoots(ui).forEach(scan);
  return out; }
PK.regUi=regUi; PK.regEntries=regEntries; PK.regDesc=regDesc;   // voor js/sections.js
// het register zoals host.ui.list het geeft: alleen regelaars met een id
function regList(r){ if(!r) return []; return regEntries(r).map(e=>{ const d=regDesc(e.el); if(!d||!d.id) return null; const p=regProps(r,e.el), range=d.type==='range';
    const face=!range?'default':(p&&p.face&&p.face!=='default'?p.face:((e.K?e.K.kn.style.display!=='none':!!e.m.__pkRot)?'rotary':'hslider'));
    const L={id:d.id,role:d.role,group:d.group,label:regLabel(e.el,e.m),type:d.type,min:range?(e.m.min===''?0:+e.m.min):null,max:range?(e.m.max===''?100:+e.m.max):null,face}; return L; }).filter(Boolean).concat(PK.meterList?PK.meterList(r):[]); } PK.regList=regList;   // + meters (js/meters.js)

// ---- regels ----
function regMatch(m,d){ if(m==='*') return true; if(m.startsWith('role:')) return d.role===m.slice(5); if(m.startsWith('group:')) return d.group===m.slice(6); return d.id===m; }
const sizeNum=v=>typeof v==='number'?v:(SIZES[v]||1);
function regProps(r,el){ if(!r||!r.skCtl||!r.skCtl.length) return null; const d=regDesc(el); if(!d) return null; let p=null;
  for(const ru of r.skCtl){ if(!regMatch(ru.match,d)) continue; p=p||{}; for(const k of KEYS) if(ru[k]!==undefined) p[k]=ru[k]; }
  return p; } PK.regProps=regProps;
const applied=p=>!!p&&Object.keys(p).some(k=>!(k==='face'&&p[k]==='default'));
function regStats(r){ let n=0,m=0; regEntries(r).forEach(e=>{ const d=regDesc(e.el); if(!d||d.type!=='range') return; m++; if(applied(regProps(r,e.el))) n++; }); return {n,m}; } PK.regStats=regStats;

// ---- hulp: een eigenschap 'value' die meekijkt (voor schuiven die het apparaat zelf zet zonder event) ----
function watchValue(i,fn){ let W=i.__pkW; if(!W){ const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'); W=i.__pkW={fns:new Set(),d}; Object.defineProperty(i,'value',{configurable:true,get(){ return d.get.call(i); },set(v){ d.set.call(i,v); W.fns.forEach(f=>f()); }}); } W.fns.add(fn); }
function unwatchValue(i,fn){ const W=i.__pkW; if(!W) return; W.fns.delete(fn); if(!W.fns.size){ delete i.value; delete i.__pkW; } }

// ---- stijl: één blok per wortel (document of shadow root), alleen zolang er een skin met regels is ----
const CSS=`
.k[data-pk-sv=never] output{display:none}
.k[data-pk-sv=hover] output{opacity:0}
.k[data-pk-sv=hover]:hover output,.k[data-pk-sv=hover]:focus-within output{opacity:1}
.k[data-pk-face=vslider]{grid-template-columns:minmax(0,1fr);justify-items:center;row-gap:4px}
.k[data-pk-face=vslider] output{text-align:center}
[data-pk-colset] .kn .vl,.kn[data-pk-colset] .vl{stroke:var(--pk-col)}
input[type=range][data-pk-fx=h]{width:var(--pk-len,100%);max-width:100%;justify-self:start}
input[type=range][data-pk-fx=v]{writing-mode:vertical-lr;direction:rtl;height:var(--pk-len,90px);width:20px;justify-self:center}
input[type=range][data-pk-cs]{-webkit-appearance:none;appearance:none;background:transparent;margin:0;padding:0}
input[type=range][data-pk-cs]::-webkit-slider-runnable-track{border-radius:var(--pk-th,4px);background:linear-gradient(var(--pk-dir,to right),var(--pk-col,var(--audio,#4fd1c5)) var(--pk-f,0%),var(--line,#3a404a) var(--pk-f,0%))}
input[type=range][data-pk-fx=h][data-pk-cs]::-webkit-slider-runnable-track{height:var(--pk-th,4px)}
input[type=range][data-pk-fx=v][data-pk-cs]::-webkit-slider-runnable-track{width:var(--pk-th,4px)}
input[type=range][data-pk-cs]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;border:0;width:var(--pk-tw,14px);height:var(--pk-tht,14px);border-radius:var(--pk-tr,50%);background:var(--pk-tbg,var(--pk-col,var(--audio,#4fd1c5)));margin-top:var(--pk-mt,0);margin-left:var(--pk-ml,0)}
input[type=range][data-pk-cs]::-moz-range-track{height:var(--pk-th,4px);border-radius:var(--pk-th,4px);background:var(--line,#3a404a)}
input[type=range][data-pk-cs]::-moz-range-progress{height:var(--pk-th,4px);border-radius:var(--pk-th,4px);background:var(--pk-col,var(--audio,#4fd1c5))}
input[type=range][data-pk-cs]::-moz-range-thumb{border:0;width:var(--pk-tw,14px);height:var(--pk-tht,14px);border-radius:var(--pk-tr,50%);background:var(--pk-tbg,var(--pk-col,var(--audio,#4fd1c5)))}
`;
function ensureCss(root){ if(!root) return; if(root.nodeType===11){ if(![...root.children].some(x=>x.tagName==='STYLE'&&x.hasAttribute('data-pk-ctl'))){ const s=document.createElement('style'); s.setAttribute('data-pk-ctl',''); s.textContent=CSS; root.appendChild(s); } }
  else if(root===document&&!document.getElementById('pkCtlCss')){ const s=document.createElement('style'); s.id='pkCtlCss'; s.textContent=CSS; document.head.appendChild(s); } }

// ---- één regelaar: gezicht, maat, lengte, dikte, duim, kleur, waarde ----
// w = wrapper (host.ui.knob: .k) of het model zelf; inp = de range-input; kn = draaiknop-element of null; p = eigenschappen of null; rot = draaiknop wordt getoond
function regStrip(w,inp,kn,final){ if(!w.__pkFx&&!inp.__pkFx) return;
  ['data-pk-face','data-pk-sv','data-pk-colset'].forEach(a=>w.removeAttribute(a)); ['data-pk-fx','data-pk-cs'].forEach(a=>inp.removeAttribute(a));
  VARS.forEach(v=>{ w.style.removeProperty(v); inp.style.removeProperty(v); }); if(w.style.zoom) w.style.removeProperty('zoom');
  if(kn){ kn.removeAttribute('data-pk-colset'); kn.style.removeProperty('--pk-col'); }
  if(inp.__pkFill){ inp.removeEventListener('input',inp.__pkFill); unwatchValue(inp,inp.__pkFill); inp.__pkFill=null; }
  if(final){ [[w,'__pkHad'],[inp,'__pkHadI']].forEach(([x,k])=>{ if(x[k]===false&&!(x.getAttribute('style')||'').trim()) x.removeAttribute('style'); delete x[k]; }); w.__pkFx=inp.__pkFx=false; } }
function regLook(w,inp,kn,p,rot){
  if(!applied(p)){ regStrip(w,inp,kn,true); return false; }
  if(w.__pkHad===undefined) w.__pkHad=w.hasAttribute('style'); if(inp.__pkHadI===undefined) inp.__pkHadI=inp.hasAttribute('style');
  regStrip(w,inp,kn,false); w.__pkFx=inp.__pkFx=true; ensureCss(w.getRootNode());
  const face=p.face&&p.face!=='default'?p.face:null, anySl=p.length!==undefined||p.thickness!==undefined||p.thumb!==undefined||(p.color!==undefined&&p.color!=='accent');
  const orient=face==='vslider'?'v':face==='hslider'?'h':(!rot&&anySl?'h':null);
  if(face&&w!==inp) w.setAttribute('data-pk-face',face);
  if(p.size!==undefined){ const z=sizeNum(p.size); if(z!==1) w.style.zoom=String(z); }
  if(p.showValue&&p.showValue!=='always'&&w!==inp) w.setAttribute('data-pk-sv',p.showValue);
  if(p.color!==undefined&&p.color!=='accent'){ w.style.setProperty('--pk-col',p.color); if(rot){ w.setAttribute('data-pk-colset',''); if(kn){ kn.setAttribute('data-pk-colset',''); kn.style.setProperty('--pk-col',p.color); } } }
  if(orient){ inp.setAttribute('data-pk-fx',orient);
    const L=p.length===undefined?null:(typeof p.length==='number'?p.length:LENS[p.length]); if(L) inp.style.setProperty('--pk-len',L+'px');
    if(p.thickness!==undefined||p.thumb!==undefined||(p.color!==undefined&&p.color!=='accent')){ inp.setAttribute('data-pk-cs','');
      const th=p.thickness!==undefined?p.thickness:4, thumb=p.thumb||'round';
      let tw=14,tht=14,tr='50%'; if(thumb==='square') tr='2px'; else if(thumb==='bar'){ tr='2px'; if(orient==='h'){ tw=6; tht=18; } else { tw=18; tht=6; } }
      inp.style.setProperty('--pk-th',th+'px'); inp.style.setProperty('--pk-tw',tw+'px'); inp.style.setProperty('--pk-tht',tht+'px'); inp.style.setProperty('--pk-tr',tr);
      if(orient==='h') inp.style.setProperty('--pk-mt',((th-tht)/2)+'px'); else inp.style.setProperty('--pk-ml',((th-tw)/2)+'px');
      inp.style.setProperty('--pk-dir',orient==='h'?'to right':'to top'); if(thumb==='none') inp.style.setProperty('--pk-tbg','transparent');
      if(p.color!==undefined&&p.color!=='accent') inp.style.setProperty('--pk-col',p.color);
      const fill=()=>{ const mn=inp.min===''?0:+inp.min, mx=inp.max===''?100:+inp.max, f=Math.max(0,Math.min(1,(+inp.value-mn)/((mx-mn)||1))); inp.style.setProperty('--pk-f',(f*100).toFixed(2)+'%'); };
      inp.__pkFill=fill; inp.addEventListener('input',fill); watchValue(inp,fill); fill(); } }
  return true; }
PK.regLook=regLook;

// ---- geadopteerde schuif (geen hostknop): eventueel een draaiknop-gezicht ernaast ----
function regAdopted(e,p){ const inp=e.m; if(regType(inp)!=='range') return; const want=!!p&&p.face==='rotary';
  if(want&&!inp.__pkRot){ const mn=inp.min===''?0:+inp.min, mx=inp.max===''?100:+inp.max, st=inp.step==='any'||inp.step===''?(inp.step===''?1:0):+inp.step, label=regLabel(e.el,inp)||'';
    const R=PK.buildRotary(inp,label,mn,mx,st,false), paint=()=>R.paint(+inp.value); R.bind(); inp.addEventListener('input',paint); watchValue(inp,paint);
    inp.__pkRot={R,paint,had:inp.hasAttribute('style'),disp:inp.style.display}; R.kn.style.display='inline-block'; inp.after(R.kn); inp.style.display='none'; paint(); }
  else if(!want&&inp.__pkRot){ const X=inp.__pkRot; inp.removeEventListener('input',X.paint); unwatchValue(inp,X.paint); X.R.kn.remove(); inp.style.display=X.disp; if(!X.had&&!(inp.getAttribute('style')||'').trim()) inp.removeAttribute('style'); inp.__pkRot=null; }
  regLook(inp,inp,inp.__pkRot?inp.__pkRot.R.kn:null,p,want); }

// ---- toepassen op een kaart (bij een skin, een herbouwde UI of een nieuwe adopt) ----
function regApply(r){ if(!r||!r.el) return; const on=!!(r.skCtl&&r.skCtl.length);
  regEntries(r).forEach(e=>{ if(e.K) PK.knobLook(e.K); else regAdopted(e,on?regProps(r,e.el):null); });
  const ui=regUi(r), roots=regRoots(ui);
  if(on){ regWatch(r,ui,roots); } else { if(r.ctlMO){ r.ctlMO.disconnect(); r.ctlMO=null; } roots.forEach(sr=>{ [...sr.children].forEach(x=>{ if(x.tagName==='STYLE'&&x.hasAttribute('data-pk-ctl')) x.remove(); }); }); }
  PK.drawCables(); } PK.regApply=regApply;
// een herbouwde UI (nieuwe elementen) volgt: alleen toegevoegde elementen tellen, tekstwissels van uitlezingen niet
function regWatch(r,ui,roots){ if(!r.ctlMO){ let q=false; r.ctlMO=new MutationObserver(ms=>{ if(q||!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!(n.tagName==='STYLE')))) return; q=true; requestAnimationFrame(()=>{ q=false; if(r.skCtl&&r.el.isConnected) regApply(r); }); }); }
  const root=r.el.querySelector(':scope > .body')||r.el; r.ctlMO.observe(root,{childList:true,subtree:true}); roots.forEach(sr=>r.ctlMO.observe(sr,{childList:true,subtree:true})); }
// de regels van een samengevoegd ontwerp: knobs.style/size zijn de korte vorm (eerst), design.controls erna (wint)
function regRules(d){ const out=[]; const k=d&&d.knobs;
  if(k){ if(k.style==='rotary') out.push({match:'role:param',face:'rotary'}); else if(k.style==='slider') out.push({match:'role:param',face:'hslider'}); if(k.size==='s'||k.size==='l') out.push({match:'role:param',size:k.size}); }
  if(d&&Array.isArray(d.controls)) d.controls.forEach(x=>out.push(x)); return out; } PK.regRules=regRules;
})(window.__PK);
