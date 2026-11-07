// js/panels.js — panelen voor skins (skins 0.7, design.layout): regelaars in benoemde panelen en volgorde; verplaatst alleen de regelaar-eenheden (met plaatsmarkering) en zet alles terug
(function(PK){
/* =====================================================================
   PANELEN · de skin bepaalt in welk paneel een regelaar staat en in welke volgorde. Een skin verbergt of schrijft NIETS: wat niet genoemd wordt komt in een restpaneel.
   Regelaar-eenheid ("unit") = het element dat label + invoer + waarde samen bevat:
     - host.ui.knob/select/display: de wrapper (div.k);
     - een geadopteerde of getagde regelaar: het getagde element; is dat het model zelf (input/select/knop), dan klimt de eenheid één niveau op naar een <label> of een element met
       uitsluitend die ene regelaar en hoogstens 4 kinderen (nooit tot een eerste-niveau-element van de UI of een paneel van ons);
     - een stappenrij (data-pk-row): de rij om het raster heen (alleen als die uitsluitend knoppen van dezelfde rij bevat), anders het raster;
     - pads: de knop; meters: het meter-element.
   Een eenheid die een andere eenheid bevat telt niet (de binnenste tellen). Eenheden in een andere shadow root dan die met de meeste eenheden blijven op hun plek.
   Verplaatsen: op de oude plek komt een lege commentaarknoop 'pk-pnl'; bij uitzetten (skin wissen, verschijning wisselen, kaart weg, herbouw) gaat elke eenheid vóór zijn markering terug en verdwijnt de markering.
   Lege omhullende elementen (alle regelaars eruit, geen knop/invoer/canvas/tekst meer) krijgen data-pk-pempty (display:none), een kopje direct ervoor ook; allemaal weer weg bij uitzetten.
   Panelen staan in één element (.pk-pnls) dat vlak vóór de tak van het laagste gemeenschappelijke voorouder-element staat die de eerste eenheid bevat. CSS: één <style> per wortel.
   Toewijzing: eerst alle expliciete items (id, role:, group:) in volgorde van panelen en items (de eerste passende wint), daarna krijgt het eerste paneel met `*` de rest op de plek van `*`;
   ontbreekt `*`, dan komt er achteraan een impliciet restpaneel (id rest, plain, titel Overige/Other). Een leeg paneel wordt niet getekend. Zonder enig expliciet gevulde paneel gebeurt er niets.
   Herbouwt het apparaat zijn UI (andere eenheden), dan zet een MutationObserver (gedebounced) alles terug en past de layout opnieuw toe; eigen mutaties worden niet gezien (disconnect tijdens toepassen).
   Apparaten met een eigen functionele indeling (PNL_OWN) of zonder herkenbare regelaars worden overgeslagen en dat staat in de statistiek.
   Regels: r.skLay = {flow, panels:[{id,title,titlePos,items,style,dir,cols,gap,bare,labels,align,width,collapsible,collapsed}]}.
   ===================================================================== */
const PNL_OWN=['nl.patchkamer.controlsurface'];
const MODEL='input[type=range],input[type=checkbox],select,button';
const INTER='input,select,button,textarea,canvas,svg,img,video,audio,iframe,output,a,[tabindex],[contenteditable],[role=slider],[role=meter],[role=button]';
const CAPT=/^(H[1-6]|LEGEND|CAPTION)$/;
const AT_U=['data-pk-pcell','data-pk-ppt'];
let CSS='.pk-pnls{box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px;width:100%;min-width:0;grid-column:1/-1;flex:1 1 100%}\n'
+'.pk-pnls[data-pk-pflow=rows]{flex-direction:column;flex-wrap:nowrap;align-items:stretch}\n'
+'.pk-pnl{box-sizing:border-box;position:relative;min-width:0;display:flex;flex-direction:column;gap:4px;flex:1 1 220px;--pk-gap:8px;--pk-pad:8px}\n'
+'.pk-pnls[data-pk-pflow=columns]>.pk-pnl{flex:1 1 0;min-width:170px}\n'
+'.pk-pnls>.pk-pnl[data-pk-pw=full]{flex:1 1 100%}\n.pk-pnls>.pk-pnl[data-pk-pw=half]{flex:1 1 calc(50% - 8px)}\n.pk-pnls>.pk-pnl[data-pk-pw=third]{flex:1 1 calc(33.333% - 8px)}\n'
+'.pk-pnls[data-pk-pflow=rows]>.pk-pnl{flex:0 0 auto}\n'
+'.pk-pnl[data-pk-pgap=tight]{--pk-gap:3px;--pk-pad:4px}\n.pk-pnl[data-pk-pgap=wide]{--pk-gap:14px;--pk-pad:14px}\n'
+'.pk-pnl[data-pk-pst=line],.pk-pnl[data-pk-pst=raised],.pk-pnl[data-pk-pst=inset],.pk-pnl[data-pk-pst=floating]{padding:var(--pk-pad);border-radius:8px}\n'
+'.pk-pnl[data-pk-pst=line]{border:1px solid var(--line,#3a404a)}\n'
+'.pk-pnl[data-pk-pst=raised]{border:1px solid color-mix(in srgb,var(--line,#3a404a) 55%,transparent);background:color-mix(in srgb,var(--fg,#ffffff) 6%,var(--card-2,var(--card,#1c2027)));box-shadow:0 1px 4px rgba(0,0,0,.35)}\n'
+'.pk-pnl[data-pk-pst=inset]{border:0;background:color-mix(in srgb,#000000 25%,var(--card,#1c2027));box-shadow:inset 0 2px 6px rgba(0,0,0,.55)}\n'
+'.pk-pnl[data-pk-pst=floating]{border:0;margin:4px;background:var(--card-2,var(--card,#1c2027));box-shadow:0 10px 24px rgba(0,0,0,.5)}\n'
+'.pk-pnl-h{display:flex;align-items:center;gap:4px;min-width:0}\n'
+'.pk-pnl-t{display:inline-flex;align-items:center;gap:5px;min-width:0;margin:0;padding:2px 0;border:0;background:none;color:var(--muted,#9aa3ad);font:600 10px/1.3 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;text-align:left;cursor:default}\n'
+'.pk-pnl-t[role=button]{cursor:pointer}\n.pk-pnl-t[role=button]:focus-visible{outline:2px solid var(--sel,#4ea8ff);outline-offset:1px}\n'
+'.pk-pnl-c{display:inline-block;font-size:11px;line-height:1}\n.pk-pnl[data-pk-pcol] .pk-pnl-c{transform:rotate(-90deg)}\n'
+'.pk-pnl[data-pk-ptp=left]{flex-direction:row;gap:var(--pk-gap)}\n.pk-pnl[data-pk-ptp=left]>.pk-pnl-h{flex:0 0 auto;max-width:35%;align-items:flex-start}\n.pk-pnl[data-pk-ptp=left]>.pk-pnl-b{flex:1 1 0}\n'
// de indeling van het paneel staat laag (:where) zodat secties van skins 0.5 erbinnen voorrang houden voor wat zij zelf zetten
+':where(.pk-pnl-b){display:grid;gap:var(--pk-gap,8px);grid-template-columns:repeat(auto-fill,minmax(var(--pk-cw,110px),1fr));align-items:start;min-width:0}\n'
+':where(.pk-pnl[data-pk-pdir=row]>.pk-pnl-b){display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-start}\n'
+':where(.pk-pnl[data-pk-pdir=column]>.pk-pnl-b){display:flex;flex-direction:column;align-items:stretch}\n'
+':where(.pk-pnl[data-pk-pcols]>.pk-pnl-b){grid-template-columns:repeat(var(--pk-n,1),minmax(0,1fr))}\n'
+':where(.pk-pnl[data-pk-plabels=below][data-pk-pcols=auto]>.pk-pnl-b){--pk-cw:72px}\n'
+':where(.pk-pnl[data-pk-palign=center]>.pk-pnl-b){justify-items:center;justify-content:center}\n'
+'.pk-pnl-b>*{min-width:0;max-width:100%;box-sizing:border-box}\n'
+'.pk-pnl[data-pk-pdir=row]>.pk-pnl-b>*{flex:1 1 110px}\n'
+'.pk-pnl[data-pk-pcol]>.pk-pnl-b{display:none}\n'
+'.pk-pnl[data-pk-pbare]>.pk-pnl-b>[data-pk-pcell]{border:0;background:none;box-shadow:none;border-radius:0;padding:2px 0}\n'
+'.pk-pnl[data-pk-plabels]>.pk-pnl-b>[data-pk-pcell]{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}\n'
+'.pk-pnl[data-pk-plabels]>.pk-pnl-b>[data-pk-pcell] select,.pk-pnl[data-pk-plabels]>.pk-pnl-b>[data-pk-pcell] input[type=text]{max-width:100%;box-sizing:border-box}\n'
+'.pk-pnl[data-pk-plabels][data-pk-palign=center]>.pk-pnl-b>[data-pk-pcell]{align-items:center;text-align:center}\n'
+'.pk-pnl[data-pk-plabels]>.pk-pnl-b>[data-pk-pcell]>[data-pk-ppt]{order:3}\n'
+'.pk-pnl[data-pk-plabels=below]>.pk-pnl-b>[data-pk-pcell]>[data-pk-ppt=v]{order:1}\n.pk-pnl[data-pk-plabels=below]>.pk-pnl-b>[data-pk-pcell]>[data-pk-ppt=c]{order:2}\n'
+'.pk-pnl[data-pk-plabels=above]>.pk-pnl-b>[data-pk-pcell]>[data-pk-ppt=l]{order:1}\n.pk-pnl[data-pk-plabels=above]>.pk-pnl-b>[data-pk-pcell]>[data-pk-ppt=v]{order:2}\n.pk-pnl[data-pk-plabels=above]>.pk-pnl-b>[data-pk-pcell]>[data-pk-ppt=c]{order:3}\n'
+'[data-pk-pempty]{display:none!important}\n'
+'@media (pointer:coarse){.pk-pnl-t[role=button]{min-height:44px;align-items:center}}\n';
function ensureCss(root){ if(!root) return; if(root.nodeType===11){ if(![...root.children].some(x=>x.tagName==='STYLE'&&x.hasAttribute('data-pk-pnlcss'))){ const s=document.createElement('style'); s.setAttribute('data-pk-pnlcss',''); s.textContent=CSS; root.appendChild(s); } }
  else if(!document.getElementById('pkPnlCss')){ const s=document.createElement('style'); s.id='pkPnlCss'; s.textContent=CSS; document.head.appendChild(s); } }

// ---- eenheden vinden ----
const up=n=>n&&(n.parentNode&&n.parentNode.nodeType===11?n.parentNode.host:n.parentNode);
const ours=n=>!!(n&&n.classList&&(n.classList.contains('pk-pnl-b')||n.classList.contains('pk-pnl')||n.classList.contains('pk-pnls')));
const nMod=el=>el.querySelectorAll(MODEL).length+(el.matches&&el.matches(MODEL)?1:0);
function unitOf(e,ui){ let el=e.el;
  if(el.hasAttribute&&el.hasAttribute('data-pk-row')){ const id=el.getAttribute('data-pk-id'), g=el.parentElement, p2=g&&g.parentElement;
    if(p2&&p2!==ui&&!ours(p2)&&p2.parentNode&&[...p2.querySelectorAll(MODEL)].every(m=>m.hasAttribute('data-pk-row')&&m.getAttribute('data-pk-id')===id)) return p2;
    return g&&!ours(g)?g:el; }
  if(e.K||el!==e.m) return el;
  const p=el.parentNode; if(!p||p.nodeType!==1||p===ui||ours(p)||!p.parentNode||p.parentNode.nodeType===11||p.parentNode===ui) return el;
  if(nMod(p)!==1) return el;
  if(p.tagName==='LABEL'||p.children.length<=4) return p;
  return el; }
const docOrder=(a,b)=>{ if(a.el===b.el) return 0; const c=a.el.compareDocumentPosition(b.el); return (c&Node.DOCUMENT_POSITION_FOLLOWING)?-1:(c&Node.DOCUMENT_POSITION_PRECEDING)?1:0; };
// alle eenheden van een kaart: [{el, id, role, group, m}] (nog in volgorde van het document per wortel)
function pnlUnits(r){ const ui=PK.regUi(r), out=[], seen=new Set();
  PK.regEntries(r).forEach(e=>{ const d=PK.regDesc(e.el); if(!d) return; const el=unitOf(e,ui); if(!el||seen.has(el)) return; seen.add(el);
    out.push({el,id:d.id,role:d.role,group:d.group,m:e.m}); });
  if(PK.METERS) PK.METERS.forEach(M=>{ if(M.dead||!M.el.isConnected||PK.cardOf(M.el)!==r||seen.has(M.el)) return; seen.add(M.el); out.push({el:M.el,id:M.o.id||'',role:'meter',group:M.o.group||'',m:null}); });
  const res=out.filter(u=>!out.some(v=>v!==u&&u.el.contains(v.el)));
  const by=new Map(); res.forEach(u=>{ const rt=u.el.getRootNode(); if(!by.has(rt)) by.set(rt,[]); by.get(rt).push(u); });
  const list=[]; by.forEach(l=>{ l.sort(docOrder); list.push(...l); });
  return list; }
function pnlMain(units){ const by=new Map(); units.forEach(u=>{ const rt=u.el.getRootNode(); if(!by.has(rt)) by.set(rt,[]); by.get(rt).push(u); });
  let best=null; by.forEach((l,rt)=>{ if(!best||l.length>best.l.length) best={rt,l}; }); return best; }

// ---- toewijzing ----
const itemHit=(it,u)=>it.startsWith('role:')?u.role===it.slice(5):it.startsWith('group:')?u.group===it.slice(6):(!!u.id&&u.id===it);
const titleOf=t=>{ if(typeof t==='string') return t; if(t&&typeof t==='object') return t[PK.PK_LANG]||t.en||t.nl||String(Object.values(t)[0]||''); return ''; };
// -> {panels:[{P, units, rest:boolean, implicit:boolean}]} (alleen gevulde panelen)
function pnlAssign(lay,units){ const pans=lay.panels, slots=pans.map(P=>P.items.map(()=>[])), taken=new Set(); let star=null;
  pans.forEach((P,i)=>P.items.forEach((it,j)=>{ if(it==='*'){ if(!star) star=[i,j]; return; } units.forEach(u=>{ if(!taken.has(u)&&itemHit(it,u)){ taken.add(u); slots[i][j].push(u); } }); }));
  const left=units.filter(u=>!taken.has(u)); if(star) slots[star[0]][star[1]]=left;
  const out=pans.map((P,i)=>({P,units:slots[i].flat(),rest:!!star&&star[0]===i,implicit:false}));
  const named=out.filter(x=>x.units.length&&!x.rest).length;
  if(!star&&left.length) out.push({P:{id:'rest',title:{nl:PK.I18N.nl['m.pn_overige'],en:PK.I18N.en['m.pn_overige']},style:'plain',items:['*']},units:left,rest:true,implicit:true});
  return {panels:out.filter(x=>x.units.length),named}; }

// ---- bouwen ----
const ckey=(r,id)=>'patchkamer.pnl.'+r.def.id+'.'+id;
const getCol=(r,id)=>{ try{ const v=localStorage.getItem(ckey(r,id)); return v===null?null:v==='1'; }catch(e){ return null; } };
const setCol=(r,id,on)=>{ try{ localStorage.setItem(ckey(r,id),on?'1':'0'); }catch(e){} };
function mkPanel(r,x){ const P=x.P, pn=document.createElement('div'); pn.className='pk-pnl'; pn.setAttribute('data-pk-pn',P.id); pn.setAttribute('role','group');
  const set=(k,v)=>{ if(v!==undefined&&v!==null) pn.setAttribute(k,String(v)); };
  set('data-pk-pst',P.style||'plain'); if(P.dir&&P.dir!=='grid') set('data-pk-pdir',P.dir); if(P.gap&&P.gap!=='normal') set('data-pk-pgap',P.gap);
  if(P.cols!==undefined){ set('data-pk-pcols',P.cols); if(P.cols!=='auto') pn.style.setProperty('--pk-n',String(P.cols)); }
  if(P.bare===true) set('data-pk-pbare',''); if(P.labels&&P.labels!=='default') set('data-pk-plabels',P.labels);
  const al=P.align||(P.labels==='below'?'center':null); if(al&&(P.align||(P.labels&&P.labels!=='default'))) set('data-pk-palign',al);
  if(P.width&&P.width!=='auto') set('data-pk-pw',P.width);
  const title=titleOf(P.title), pos=P.titlePos||'top', col=!!P.collapsible;   // een inklapbaar paneel heeft altijd een zichtbare kop (titlePos hidden telt dan als top)
  const showH=!!title&&pos!=='hidden'||col; if(title&&pos==='left'&&!col) set('data-pk-ptp','left');
  if(title) pn.setAttribute('aria-label',title);
  let body=document.createElement('div'); body.className='pk-pnl-b';
  if(showH){ const h=document.createElement('div'); h.className='pk-pnl-h';
    if(col){ const b=document.createElement('div'); b.setAttribute('role','button'); b.tabIndex=0; b.className='pk-pnl-t';   // geen <button>: host.controls (contract v1.13) mag de kop niet als regelaar van het apparaat zien const c=document.createElement('span'); c.className='pk-pnl-c'; c.setAttribute('aria-hidden','true'); c.textContent='▾'; b.appendChild(c);
      const tx=document.createElement('span'); tx.textContent=title; b.appendChild(tx); if(!title) b.setAttribute('aria-label',PK.pkt('m.pn_inklappen'));
      const st=getCol(r,P.id), on=st===null?!!P.collapsed:st; if(on) pn.setAttribute('data-pk-pcol',''); b.setAttribute('aria-expanded',on?'false':'true');
      b.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); b.click(); } };
      b.onclick=()=>{ const now=!pn.hasAttribute('data-pk-pcol'); pn.toggleAttribute('data-pk-pcol',now); b.setAttribute('aria-expanded',now?'false':'true'); setCol(r,P.id,now); PK.drawCables(); };
      h.appendChild(b); }
    else { const t=document.createElement('div'); t.className='pk-pnl-t'; t.textContent=title; h.appendChild(t); }
    pn.appendChild(h); }
  pn.appendChild(body); return {pn,body}; }
function markCells(P,units){ const bare=P.bare===true, lab=P.labels&&P.labels!=='default'; if(!bare&&!lab) return [];
  const marked=[]; units.forEach(u=>{ const c=u.el; if(c.nodeType!==1||c===u.m||!c.children.length) return; c.setAttribute('data-pk-pcell',''); marked.push(c);
    if(lab&&u.m) [...c.children].forEach(ch=>{ const p=ch.tagName==='OUTPUT'?'v':(ch===u.m||ch.contains(u.m)||ch.classList.contains('kn')||ch.__pkInput===u.m)?'c':'l'; ch.setAttribute('data-pk-ppt',p); marked.push(ch); }); });
  return marked; }
// lege omhullende elementen (alle regelaars eruit) verbergen
function hasContent(n){ for(const c of n.childNodes){ if(c.nodeType===3){ if(c.data.trim()) return true; continue; } if(c.nodeType!==1) continue; if(c.hasAttribute('data-pk-pempty')||c.tagName==='STYLE'||c.tagName==='SCRIPT'||CAPT.test(c.tagName)) continue; if(c.matches(INTER)||hasContent(c)) return true; } return false; }
function shells(phs,root,ui){ const hidden=[]; let again=true, n=0;
  while(again&&n++<4){ again=false;
    phs.forEach(ph=>{ for(let a=ph.parentNode;a&&a.nodeType===1&&a!==ui&&!a.contains(root);a=a.parentNode){ if(a.hasAttribute('data-pk-pempty')) continue; if(hasContent(a)) break; a.setAttribute('data-pk-pempty',''); hidden.push(a); again=true; } }); }
  [...hidden].forEach(h=>{ const p=h.previousElementSibling; if(!p||!/^H[1-6]$/.test(p.tagName)||p.hasAttribute('data-pk-pempty')) return;
    let q=p.nextElementSibling, ok=true; while(q&&!/^H[1-6]$/.test(q.tagName)){ if(!q.hasAttribute('data-pk-pempty')) ok=false; q=q.nextElementSibling; } if(ok){ p.setAttribute('data-pk-pempty',''); hidden.push(p); } });
  return hidden; }

// ---- terugzetten ----
function pnlStrip(r){ const S=r.pnl; if(!S) return;
  S.hidden.forEach(e=>e.removeAttribute('data-pk-pempty')); S.marked.forEach(e=>AT_U.forEach(a=>e.removeAttribute(a)));
  S.moved.forEach(({unit,ph})=>{ if(ph.parentNode){ ph.parentNode.insertBefore(unit,ph); ph.remove(); } else if(unit.parentNode) unit.remove(); });   // markering weg (herbouwd door het apparaat): de oude eenheid is verweesd
  if(S.root.parentNode) S.root.remove();
  r.pnl=null; }
function pnlCssOff(r){ (r.pnlRoots||[]).forEach(rt=>{ if(rt.nodeType===11) [...rt.children].forEach(x=>{ if(x.tagName==='STYLE'&&x.hasAttribute('data-pk-pnlcss')) x.remove(); }); }); r.pnlRoots=[];
  const s=document.getElementById('pkPnlCss'); if(s){ let any=false; PK.Host.devices.forEach(c=>{ if(c.pnl) any=true; }); if(!any) s.remove(); } }
function pnlOff(r){ if(!r) return; if(r.pnlMO){ r.pnlMO.disconnect(); r.pnlMO=null; } clearTimeout(r.pnlT); r.pnlT=0; pnlStrip(r); pnlCssOff(r); r.pnlStat=null; r.pnlHist=null; } PK.pnlOff=pnlOff;

// ---- toepassen ----
function pnlObserve(r){ if(!r.pnlMO){ const rel=ms=>ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.tagName!=='STYLE')||[...m.removedNodes].some(n=>n.nodeType===1||(n.nodeType===8&&n.data==='pk-pnl')));
    r.pnlMO=new MutationObserver(ms=>{ if(rel(ms)) pnlSoon(r); }); }
  r.pnlMO.disconnect(); const ui=PK.regUi(r), base=r.el.querySelector(':scope > .body')||r.el; r.pnlMO.observe(base,{childList:true,subtree:true}); PK.regRoots(ui).forEach(sr=>r.pnlMO.observe(sr,{childList:true,subtree:true})); }
function pnlSoon(r){ if(r.pnlT) return; r.pnlT=setTimeout(()=>{ r.pnlT=0; if(r.skLay&&r.el&&r.el.isConnected) pnlSync(r); },120); }
// is de toegepaste indeling nog geldig? zo niet (het apparaat bouwde zijn UI opnieuw), dan opnieuw toepassen; vangnet tegen een lus: ≥6 keer binnen 1 s = 3 s pauze
function pnlSync(r){ const S=r.pnl, now=performance.now(), u=pnlUnits(r);
  const ok=S?(S.root.isConnected&&u.length===S.all.length&&u.every(x=>S.set.has(x.el))&&S.moved.every(m=>m.ph.isConnected)):(r.pnlStat&&r.pnlStat.m===u.length);
  if(ok) return;
  r.pnlHist=(r.pnlHist||[]).filter(t=>now-t<1000); if(r.pnlFreeze&&now<r.pnlFreeze) { pnlSoon(r); return; } if(r.pnlHist.length>=6){ r.pnlFreeze=now+3000; pnlSoon(r); return; } r.pnlHist.push(now);
  pnlApply(r); }
function lcaOf(els){ let a=els[0].parentNode; while(a&&!els.every(e=>a.contains(e))) a=a.parentNode; while(a&&a.nodeType===1&&/^(TABLE|TBODY|THEAD|TFOOT|TR|UL|OL|DL|SELECT|LABEL|BUTTON|DATALIST)$/.test(a.tagName)&&a.parentNode) a=a.parentNode; return a; }
function pnlApply(r){ if(!r||!r.el) return; const keepMO=!!r.pnlMO; if(r.pnlMO) r.pnlMO.disconnect(); pnlStrip(r);
  const lay=r.skLay; if(!lay||!lay.panels||!lay.panels.length){ pnlOff(r); return; }
  if(PNL_OWN.includes(r.def.id)){ pnlCssOff(r); r.pnlStat={skip:'own',n:0,m:0,k:0,p:0,o:0}; pnlObserve(r); return; }
  const units=pnlUnits(r), main=pnlMain(units);
  if(!main){ pnlCssOff(r); r.pnlStat={skip:'none',n:0,m:0,k:0,p:0,o:0}; pnlObserve(r); return; }
  const asg=pnlAssign(lay,main.l), other=units.length-main.l.length;
  const base={skip:null,n:0,m:units.length,k:0,p:0,o:other};
  if(!asg.named){ pnlCssOff(r); r.pnlStat=base; pnlObserve(r); return; }   // niets expliciet geplaatst: niets doen
  const ui=PK.regUi(r), els=main.l.map(u=>u.el), lca=lcaOf(els); if(!lca){ r.pnlStat=base; pnlObserve(r); return; }
  let br=els[0]; while(br&&br.parentNode!==lca) br=br.parentNode; if(!br){ r.pnlStat=base; pnlObserve(r); return; }
  const root=document.createElement('div'); root.className='pk-pnls'; root.setAttribute('data-pk-pflow',lay.flow||'auto'); root.setAttribute('role','group'); root.setAttribute('aria-label',PK.pkt('m.pn_groep'));
  lca.insertBefore(root,br);
  const S={root,moved:[],marked:[],hidden:[],all:units,set:new Set(units.map(u=>u.el))}; r.pnl=S; const phs=[];
  let nn=0,kk=0;
  asg.panels.forEach(x=>{ const {pn,body}=mkPanel(r,x); root.appendChild(pn);
    x.units.forEach(u=>{ const ph=document.createComment('pk-pnl'); u.el.parentNode.insertBefore(ph,u.el); S.moved.push({unit:u.el,ph}); phs.push(ph); body.appendChild(u.el); });
    S.marked.push(...markCells(x.P,x.units)); if(x.rest) kk+=x.units.length; else nn+=x.units.length; });
  S.hidden=shells(phs,root,ui);
  ensureCss(main.rt); (r.pnlRoots||[]).forEach(rt=>{ if(rt!==main.rt&&rt.nodeType===11) [...rt.children].forEach(x=>{ if(x.tagName==='STYLE'&&x.hasAttribute('data-pk-pnlcss')) x.remove(); }); }); r.pnlRoots=[main.rt];
  r.pnlStat={skip:null,n:nn,m:units.length,k:kk,p:asg.panels.length,o:other};
  pnlObserve(r); PK.drawCables(); } PK.pnlApply=pnlApply;

// statistiek voor het paneel en de ontwerper: n van m regelaars in panelen, k in rest (nu, zonder iets te veranderen)
PK.pnlStats=r=>{ if(!r) return {skip:null,n:0,m:0,k:0,p:0,o:0}; if(r.pnlStat) return r.pnlStat;
  if(PNL_OWN.includes(r.def.id)) return {skip:'own',n:0,m:0,k:0,p:0,o:0};
  const u=pnlUnits(r); return {skip:u.length?null:'none',n:0,m:u.length,k:0,p:0,o:0}; };
PK.pnlText=r=>{ const s=PK.pnlStats(r); if(s.skip==='own') return PK.pkt('m.pn_skip_eigen'); if(s.skip==='none') return PK.pkt('m.pn_skip_geen');
  return PK.pkt('m.pn_stat',s.n,s.m,s.k,s.p)+(s.o?' '+PK.pkt('m.pn_andere_wortel',s.o):''); };
// host.controls (contract v1.13) geeft sleutels op label + volgnummer in documentvolgorde; met panelen moet die volgorde die van het apparaat blijven (anders wisselen gelijknamige regelaars van sleutel):
// de elementen worden gesorteerd alsof de eenheden nog op hun oude plek (plaatsmarkering) stonden; per wortel, in de volgorde waarin de wortels voorkomen
PK.pnlOrder=(r,els)=>{ const S=r&&r.pnl; if(!S||!S.moved.length||els.length<2) return els;
  const anchor=new Map(); S.moved.forEach(({unit,ph})=>{ if(ph.isConnected) anchor.set(unit,ph); });
  const anc=el=>{ for(let n=el;n&&n!==S.root;n=n.parentNode) if(anchor.has(n)) return anchor.get(n); return el; };
  const ord=(a,b)=>{ if(a===b) return 0; const c=a.compareDocumentPosition(b); return (c&Node.DOCUMENT_POSITION_FOLLOWING)?-1:(c&Node.DOCUMENT_POSITION_PRECEDING)?1:0; };
  const by=new Map(); els.forEach(e=>{ const rt=e.getRootNode(); if(!by.has(rt)) by.set(rt,[]); by.get(rt).push({e,a:anc(e)}); });
  const out=[]; by.forEach(l=>{ l.sort((x,y)=>x.a===y.a?ord(x.e,y.e):ord(x.a,y.a)); l.forEach(x=>out.push(x.e)); }); return out; };
// voor de ontwerper: de adresseerbare regelaars (id, rol, groep) van een kaart
PK.pnlChoices=r=>{ const list=r?PK.regList(r):[]; return {ids:list.filter(x=>x.id),roles:[...new Set(list.map(x=>x.role))],groups:[...new Set(list.map(x=>x.group).filter(Boolean))]}; };
})(window.__PK);
