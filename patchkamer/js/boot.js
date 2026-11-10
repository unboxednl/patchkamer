// js/boot.js — toestand en bedrading: alle top-level statements die bij het laden uitvoeren, in de oorspronkelijke volgorde (één script: uitvoering is atomair)
(function(PK){
// ===== core =====
// ---------- schaal per scherm (v1.8) ----------
PK.PKS={mode:'auto',pct:100,f:1,ui:1};
try{ PK.PKS.mode=localStorage.getItem('patchkamer.scaleMode')||'auto'; PK.PKS.pct=+(localStorage.getItem('patchkamer.scalePct')||100)||100; }catch(e){}
PK.PKS.f=PK.pksTarget(); PK.PKS.ui=Math.max(0.7,PK.PKS.f);
(function(){ const st=document.createElement('style'); st.textContent='.focusview,.libwin{zoom:var(--pkui,1)} header,.wspanel{zoom:calc(var(--pkui,1)*var(--pkfs,1))}'; document.head.appendChild(st); document.documentElement.style.setProperty('--pkui',String(PK.PKS.ui)); })();
// ===== device-loader =====
/* =====================================================================
   CONTRACT v1 (as text, shown in the UI)
   ===================================================================== */


const TEMPLATE=PK.pkt('m.sjabloon');
PK.$('tmpl').textContent=TEMPLATE;
PK.$('copyTmpl').onclick=()=>{navigator.clipboard.writeText(TEMPLATE).catch(()=>{});};

// Patchkamer heeft zelf geen apparaten: alles komt uit bibliotheken (bronnen).
PK.BUILTIN.forEach(d=>PK.Host.registry.set(PK.Host.key(d.id,d.version),d));

/* =====================================================================
   LOADING EXTERNAL DEVICES
   ===================================================================== */
PK.BUILTIN.forEach(d=>{ d._builtin=true; });
PK.$('devFile').addEventListener('change',async e=>{const f=e.target.files[0]; if(!f) return; await PK.openDeviceFile(f); e.target.value='';});
PK.$('devPaste').onclick=async()=>{try{const def=await PK.loadDeviceSource(PK.$('devText').value,{kind:'paste'}); PK.status(PK.pkt('m.geladen_2',def.name,def.version)); PK.$('devText').value='';}catch(err){PK.status(err.message,true);}};
// ===== device-cards =====
/* =====================================================================
   FLOOR: cards, ports, cables
   ===================================================================== */
const floor=PK.$('floor'), floorwrap=PK.$('floorwrap'), svg=PK.$('cables'); PK.floor=floor; PK.floorwrap=floorwrap; PK.svg=svg;
['pointerdown','keydown','touchend'].forEach(t=>document.addEventListener(t,PK.pkResumeCtx,true));
// ===== cable-drag =====
// ---------- kabel trekken: indrukken op een poort, slepen, loslaten op een passende poort ----------
const wireSvg=PK.$('wire'); PK.wireSvg=wireSvg;
document.addEventListener('pointermove',e=>{ if(!PK.cgrab||PK.wire) return; if(Math.hypot(e.clientX-PK.cgrab.x0,e.clientY-PK.cgrab.y0)<5) return; const g=PK.cgrab; PK.cgrab=null; PK.startRewire(g,e); });
document.addEventListener('pointerup',()=>{ PK.cgrab=null; }); document.addEventListener('pointercancel',()=>{ PK.cgrab=null; });
document.addEventListener('pointermove',e=>{ if(!PK.wire) return; PK.wire.cx=e.clientX; PK.wire.cy=e.clientY; if(Math.hypot(e.clientX-PK.wire.x0,e.clientY-PK.wire.y0)>4) PK.wire.moved=true; PK.hoverAt(e.clientX,e.clientY); PK.drawWire(); });
document.addEventListener('pointerup',e=>{ if(!PK.wire) return;
  if(!PK.wire.moved){ const s=PK.wire.src; PK.endWire(false); PK.portClick(s.id,s.port,s.dir,s.kind); return; }   // a plain click still works: click out, then click in
  PK.hoverAt(e.clientX,e.clientY); PK.endWire(true); });
document.addEventListener('pointercancel',()=>{ PK.endWire(false); PK.setDrop(null); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&PK.wire){ PK.endWire(false); e.preventDefault(); } });
window.addEventListener('blur',()=>PK.endWire(false));
// ===== patching =====
PK._clipCache;
// ===================== v1.8: regelaars en kabels =====================
PK.V18={ cab:'curve', op:1, knob:'slider', col:'cat' };
try{ PK.V18.col=localStorage.getItem('patchkamer.cabColor')==='kind'?'kind':'cat'; }catch(e){}
try{ PK.V18.cab=localStorage.getItem('patchkamer.cables')||'curve'; PK.V18.op=+(localStorage.getItem('patchkamer.cableOp')||1)||1; PK.V18.knob=localStorage.getItem('patchkamer.knobs')||'slider'; }catch(e){}
// ===== knobs =====
// ---------- host.ui.knob: schuif of draaiknop ----------
PK.PKKNOBS=new Set();

// ---------- beginwaarden (dubbelklik) ----------
PK.CTLDEF=new WeakMap();
document.addEventListener('dblclick',e=>{ const path=e.composedPath(); const rec=PK.ctlCard(path); if(!rec) return;
  let inp=null; for(const x of path){ if(x===rec.el) break; if(x&&x.__pkInput){ inp=x.__pkInput; break; } if(x&&x.tagName==='INPUT'&&x.type==='range'){ inp=x; break; } }
  if(!inp||inp.disabled||inp.ondblclick||(inp.dataset&&inp.dataset.pkNoreset!==undefined)||/dubbelklik/i.test(inp.title||'')) return;
  const d=PK.ctlDefault(rec,inp); if(d===null){ PK.status(PK.pkt('m.geen_beginwaarde_bekend_voor_deze')); return; }
  e.preventDefault(); e.stopPropagation(); PK.ctlFire(inp,d,true); },true);
PK._pkEntry=null;
document.addEventListener('click',e=>{ if(e.button!==0||e.detail>1) return; const path=e.composedPath(); const rec=PK.ctlCard(path); if(!rec) return; const P=PK.ctlPair(path,rec); if(!P||P.inp.disabled) return;
  e.preventDefault(); e.stopPropagation(); PK.ctlEntry(rec,P.ro,P.inp); },true);
document.addEventListener('pointerover',e=>{ const t=e.composedPath()[0]; if(!t||t.nodeType!==1||t.classList.contains('pknum')) return; if(t.children&&t.children.length===0&&PK.ctlLooksNum(t.textContent)){ const rec=PK.ctlCard(e.composedPath()); if(rec&&PK.ctlPair(e.composedPath(),rec)){ t.classList.add('pknum'); if(!t.title) t.title=PK.pkt('m.klik_om_een_waarde_te'); t.style.cursor='text'; } } },true);
// ===== cable-routing =====
PK._routeCache=new Map(), PK._obsSig='', PK._obsT=0, PK._obsTimer=0;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',PK.v18Init); else setTimeout(PK.v18Init,0);
// =====================================================================
// ===== library-scan =====
// ---------- bibliotheekmappen: nieuwe apparaten vanzelf herkennen ----------
PK.FOLDERSIG=new Map(), PK._scanBusy=false, PK._scanT=0;
PK.LIBMARK={nw:new Set(),ch:new Set(),t:0};   // apparaten die de laatste scan nieuw of gewijzigd vond: een badge in de bibliotheek
window.addEventListener('focus',()=>PK.autoScan()); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) PK.autoScan(); });
setInterval(()=>{ if(!document.hidden&&document.hasFocus()) PK.autoScan(); },15000);
// ===== host-version =====
setTimeout(PK.checkHostVersion,4000);
// ===== screen-scale =====
var _pksT=0; window.addEventListener('resize',()=>{ if(PK.PKS.mode!=='auto') return; clearTimeout(_pksT); _pksT=setTimeout(()=>{ if(Math.abs(PK.pksAuto()-PK.PKS.f)>=0.05) PK.applyScale(); else PK.paintScaleUI(); },400); });
// ===== cable-draw =====

// ---- kabelkleur per categorie: de kleur van de categorie van het apparaat waar de kabel vandaan komt, per kleurstelling zo bijgesteld dat hij ≥3:1 tegen de vloer haalt ----
PK._ccCache=new Map(), PK._ccProbe=null;
window.addEventListener('patchkamer-skin',()=>PK._ccCache.clear());
PK.CABTIP={el:null,cable:null,timer:0};
svg.addEventListener('pointermove',e=>{ if(e.pointerType==='touch') return; if(e.buttons){ PK.cabTipHide(); return; } const h=e.target&&e.target._cable?e.target:null; if(h) PK.cabTipShow(h._cable,e.clientX,e.clientY); else PK.cabTipLater(); });
svg.addEventListener('pointerout',e=>{ if(e.target&&e.target._cable) PK.cabTipLater(); });
document.addEventListener('pointermove',e=>{ if(PK.CABTIP.el&&!(e.target&&e.target._cable)) PK.cabTipLater(); },true);
['pointerdown','wheel','keydown','dragstart','blur'].forEach(t=>window.addEventListener(t,()=>PK.cabTipHide(),true));
// ---------- kabelkleur (rechtermuisknop) ----------
PK.CABLE_COLORS=['#4fd1c5','#f4a261','#b48cff','#8bdb6a','#ff6b6b','#ffd166','#4ea8ff','#ff8fd1','#2ec27e','#e76f51','#a0a8b4','#ffffff'];
PK._cmenu=null;
floorwrap.addEventListener('click',e=>{ if(e.target===floorwrap||e.target===floor||e.target===svg){ PK.armed=null; PK.paintArmed(); } });
// ===== floor-view =====
/* =====================================================================
   AANRAKING EN SCHERMKLASSEN · toestand die al nodig is voor de bibliotheek en het opslaan (de rest staat verderop, bij TOUCH)
   ===================================================================== */
PK.PKT={coarse:matchMedia('(pointer:coarse)'),narrow:matchMedia('(max-width:699px)')};
PK.LIBV={v:null,picked:false}; try{ const v=localStorage.getItem('patchkamer.libView'); if(v==='cards'||v==='compact') PK.LIBV={v,picked:true}; }catch(e){}
PK.LIBEXP=new Set();    // regels die je in de compacte bibliotheek openklapte (per apparaat-id)
PK.LAY={mode:'auto',cls:'wide',sets:{wide:{},compact:{}},cam:{wide:null}};   // schermklasse: de brede indeling zit in de apparaten zelf, de andere klasse in LAY.sets
try{ const m=localStorage.getItem('patchkamer.layoutMode'); if(m==='wide'||m==='compact'||m==='auto') PK.LAY.mode=m; }catch(e){}
PK.LAY.cls=PK.layoutTarget();
PK.LITE={on:true,state:false}; try{ PK.LITE.on=localStorage.getItem('patchkamer.liteZoom')!=='0'; }catch(e){}
PK.Host.views=[];           // camerastanden van deze werkruimte: [{name,x,y,scale}] (x,y = midden van de uitsnede in vloercoördinaten, scale t.o.v. de schermschaal)
PK.$('zoomIn').onclick=()=>PK.zoomAt(1.25,...PK.wrapCenter()); PK.$('zoomOut').onclick=()=>PK.zoomAt(0.8,...PK.wrapCenter());
PK.$('zoomHome').onclick=()=>{PK.Host.view={x:40,y:40,scale:PK.PKS.f}; PK.applyView();};
PK.$('zoomFit').onclick=()=>{ PK.liteHold(1); try{ PK.zoomFitNow(); }finally{ PK.liteHold(-1); } };
floorwrap.addEventListener('wheel',e=>{ if(!e.ctrlKey&&!e.metaKey){ const sc=(e.composedPath?e.composedPath():[]).find(n=>n.classList&&n.classList.contains('ui')&&n.closest&&n.closest('.card.sized-h')); if(sc&&sc.scrollHeight>sc.clientHeight){ const atTop=sc.scrollTop<=0&&e.deltaY<0, atEnd=sc.scrollTop+sc.clientHeight>=sc.scrollHeight-1&&e.deltaY>0; if(!atTop&&!atEnd) return; } } e.preventDefault(); const r=floorwrap.getBoundingClientRect(); if(e.ctrlKey||e.metaKey){ PK.zoomAt(e.deltaY<0?1.1:0.9,e.clientX-r.left,e.clientY-r.top); } else { PK.Host.view.x-=e.deltaX; PK.Host.view.y-=e.deltaY; PK.applyView(); } },{passive:false});
floorwrap.addEventListener('pointerdown',e=>{ if(e.target!==floorwrap&&e.target!==floor&&e.target!==svg) return; PK.pan={cx:e.clientX,cy:e.clientY,x0:PK.Host.view.x,y0:PK.Host.view.y}; floorwrap.classList.add('panning'); floorwrap.setPointerCapture(e.pointerId); });
floorwrap.addEventListener('pointermove',e=>{ if(!PK.pan) return; PK.Host.view.x=PK.pan.x0+(e.clientX-PK.pan.cx); PK.Host.view.y=PK.pan.y0+(e.clientY-PK.pan.cy); PK.applyView(); });
floorwrap.addEventListener('pointerup',PK.endPan); floorwrap.addEventListener('pointercancel',PK.endPan);
// rechtermuisknop ingedrukt houden en slepen verschuift het canvas: bij loslaten op de achtergrond geen contextmenu van de browser (kabels en kaarten houden het hunne)
floorwrap.addEventListener('contextmenu',e=>{ const path=e.composedPath(); if(path.some(n=>n&&n.nodeType===1&&(n.classList.contains('card')||PK.isFormEl(n)))) return; e.preventDefault(); });
document.addEventListener('keydown',e=>{ if(PK.typing(e)) return; if(e.key==='+'||e.key==='='){PK.zoomAt(1.25,...PK.wrapCenter());} if(e.key==='-'){PK.zoomAt(0.8,...PK.wrapCenter());} if(e.key==='0'){PK.Host.view={x:40,y:40,scale:PK.PKS.f}; PK.applyView();} });
PK.applyView();
// ===== library-categories =====
// ---------- bibliotheek: categorieën, zoeken, slepen naar de vloer ----------
const CAT_DEFAULT=[['synth',PK.pkt('m.synths'),'var(--event)'],['groove',PK.pkt('m.drums_grooveboxen'),'#e4574a'],['sequencer',PK.pkt('m.sequencers'),'#f4d35e'],['mod',PK.pkt('m.modulatie'),'var(--mod)'],['effect',PK.pkt('m.effecten'),'var(--audio)'],['mastering',PK.pkt('m.mastering_categorie'),'var(--mastering)'],['mix',PK.pkt('m.mixen_uitgang'),'var(--sel)'],['tool',PK.pkt('m.meten_hulpmiddelen'),'var(--muted)'],['other',PK.pkt('m.overig'),'var(--muted)']]; PK.CAT_DEFAULT=CAT_DEFAULT;
const BUILTIN_CATS=new Set(CAT_DEFAULT.map(x=>x[0])); PK.BUILTIN_CATS=BUILTIN_CATS;
PK.CATS=CAT_DEFAULT.map(x=>[x[0],x[1]]), PK.CATCOL=Object.fromEntries(CAT_DEFAULT.map(x=>[x[0],x[2]]));
// ---- categorie-iconen: eigen ontwerp, 24×24, lijntekening in currentColor; een categorie kan ook een eigen afbeelding hebben (als <img>, nooit als markup) ----
PK.CATICON={}, PK.CATDIR={}, PK.DIRICON=new Map(), PK.BADICON=new Set();   // key -> gekozen icoon · key -> ['sid|map',…] · 'sid|map' -> data-adres · afbeeldingen die niet laadden
PK.CAT_ICONS={
 synth:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M7.25 12.5V19M12 12.5V19M16.75 12.5V19"/><rect x="6.05" y="5" width="2.4" height="7.5" fill="currentColor"/><rect x="10.8" y="5" width="2.4" height="7.5" fill="currentColor"/><rect x="15.55" y="5" width="2.4" height="7.5" fill="currentColor"/>',
 groove:'<ellipse cx="12" cy="10" rx="8" ry="3"/><path d="M4 10v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V10"/><path d="M6 3.5l5.2 4.6M18 3.5l-5.2 4.6"/>',
 sequencer:'<rect x="2" y="8" width="4.2" height="8" rx="1" fill="currentColor"/><rect x="7.4" y="8" width="4.2" height="8" rx="1"/><rect x="12.8" y="8" width="4.2" height="8" rx="1" fill="currentColor"/><rect x="18.2" y="8" width="3.8" height="8" rx="1"/><path d="M2 20h20"/>',
 mod:'<path d="M2 12c2.2-7.2 4.4-7.2 6.6 0s4.4 7.2 6.6 0 3.2-5.4 6.8-1"/>',
 effect:'<circle cx="12" cy="13.5" r="6.5"/><path d="M12 13.5l3-3.4M4.6 5.6l1.7 1.5M19.4 5.6l-1.7 1.5M12 2.8v2.2"/>',
 mastering:'<path d="M2.5 4.5h19"/><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="16" y="10.5" width="4" height="9.5" rx="1"/>',
 mix:'<path d="M6 4v16M12 4v16M18 4v16"/><rect x="3.4" y="13" width="5.2" height="3.4" rx="1" fill="currentColor"/><rect x="9.4" y="6.5" width="5.2" height="3.4" rx="1" fill="currentColor"/><rect x="15.4" y="10" width="5.2" height="3.4" rx="1" fill="currentColor"/>',
 tool:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M5.5 13h2.6l1.8-4.2 3 7.4 2-5.2 1.4 2h2.7"/>',
 other:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
 folder:'<path d="M3 7.5A2 2 0 0 1 5 5.5h4l2 2.2h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 sampler:'<path d="M3.5 10v4M7.7 7v10M11.9 3.5v17M16.1 7.5v9M20.3 10v4"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/>',
 speaker:'<path d="M4 9.5h3.6L13 5v14l-5.4-4.5H4z"/><path d="M16.3 9a4.2 4.2 0 0 1 0 6M19 6.3a8 8 0 0 1 0 11.4"/>',
 bolt:'<path d="M13.5 2.5 5 13.5h6.2L10.5 21.5 19 10.5h-6.2z"/>',
 note:'<path d="M9 17.5V5.5l11-2v12"/><circle cx="6.2" cy="17.5" r="2.8"/><circle cx="17.2" cy="15.5" r="2.8"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'};
// een afbeelding die niet laadt: niet meer gebruiken en opnieuw tekenen
document.addEventListener('error',e=>{ const t=e.target; if(!t||t.tagName!=='IMG'||!t.closest||!t.closest('.cicon, .glyph')) return; const u=t.getAttribute('src'); if(!u||PK.BADICON.has(u)) return; PK.BADICON.add(u); try{ PK.paintLib(); PK.paintIcons(); }catch(x){} },true);
PK.LAYOUT_FILE='patchkamer-bibliotheek.json';
PK.CAT_OVR={};   // your own category per device id (kept in the library settings)
// ===== skins =====
/* ---------- skins: register, apparaaticonen en het paneel Skins (js/skins.js, js/skins-ui.js, js/device-icons.js) ---------- */
PK.SK={user:[],src:[],emb:[]}, PK.SKICON=new Map(), PK.DEVICON=new Map(), PK.skOpen=new Set(), PK.SKFILTER='';   // skins per herkomst · 'bron|apparaat-id' -> icoon uit skins/library · 'bron|map' -> icoon uit de apparaatmap
{ const skPanel=PK.$('skPanel'); PK.skPanel=skPanel; let skRT=0;
  PK.$('skBtn').onclick=e=>{ e.stopPropagation(); PK.skOpenPanel(); };   // de knop in het ☰-menu opent de bibliotheek op de tab Skins
  PK.$('skImport').onclick=()=>{ PK.$('skFile').value=''; PK.$('skFile').click(); };
  PK.$('skFile').addEventListener('change',async e=>{ await PK.skinsImport(e.target.files); });
  PK.$('skLoadAll').onclick=async()=>{ const b=PK.$('skLoadAll'); b.disabled=true;
    try{ const src=await PK.wsaLoad('ski',true); if(src){ const st=PK.SRCSTATE.get(src.sid)||{}; PK.status(`${PK.srcLabel(src)}: ${st.msg||''}`,st.state==='err'); } }catch(e){ PK.status(e.message,true); } finally{ b.disabled=false; PK.skPaintPanel(); } };
  window.addEventListener('resize',()=>{ clearTimeout(skRT); skRT=setTimeout(PK.skScreenCheck,150); });   // schermklasse gewisseld: Auto opnieuw bepalen
  PK.skinsLoadUser(); }
// ===== library-window =====
try{ Object.assign(PK.LIB,JSON.parse(localStorage.getItem(PK.LIBKEY)||'{}')); }catch(e){}
try{ if(PK.isSheet()&&!localStorage.getItem(PK.LIBKEY)) PK.LIB.shown=false; }catch(e){}
PK.LIB.cats=(PK.LIB.cats&&typeof PK.LIB.cats==='object')?PK.LIB.cats:{}; PK.CAT_OVR=PK.LIB.cats;
PK.LIB.layoutSeen=(PK.LIB.layoutSeen&&typeof PK.LIB.layoutSeen==='object')?PK.LIB.layoutSeen:{};
PK.LIB.catList=PK.LIB.catList?PK.cleanCatList(PK.LIB.catList,!(PK.LIB.catV>=2)):null; PK.LIB.catV=2; PK.applyCats();
document.addEventListener('pointermove',e=>{ if(!PK.libDrag) return;
  if(!PK.libDrag.ghost){ if(Math.hypot(e.clientX-PK.libDrag.x0,e.clientY-PK.libDrag.y0)<5) return; const g=document.createElement('div'); g.className='libghost'; g.textContent=PK.libDrag.def.name; document.body.appendChild(g); PK.libDrag.ghost=g; document.body.style.cursor='grabbing'; }
  const g=PK.libDrag.ghost; g.style.left=e.clientX+'px'; g.style.top=e.clientY+'px';
  const ct=PK.catTarget(e.clientX,e.clientY), cur=PK.categoryOf(PK.libDrag.def); document.querySelectorAll('#lib .cat.drop').forEach(x=>x.classList.remove('drop'));
  if(ct&&ct.dataset.cat!==cur){ ct.classList.add('drop'); g.textContent=`${PK.libDrag.def.name} → ${PK.CATS.find(x=>x[0]===ct.dataset.cat)[1]}`; g.classList.remove('no'); }
  else { const onFloor=PK.overFloor(e.clientX,e.clientY), cb=onFloor?PK.cableNearPoint(PK.floorPoint(e.clientX,e.clientY),18/PK.Host.view.scale,PK.libDrag.def.ports,null):null; PK.setDrop(cb); const sc=PK.secHoverPoint&&onFloor?PK.secHoverPoint(e.clientX,e.clientY):(PK.secHoverPoint&&PK.secHoverPoint(null),null);
    g.textContent=PK.libDrag.def.name+(cb?' → '+PK.pkt('m.in_de_kabel'):sc?' → '+sc.name:''); g.classList.toggle('no',!onFloor); } });
document.addEventListener('pointerup',e=>{ if(!PK.libDrag) return; const d=PK.libDrag, dc=PK.dropCable; PK.libDrag=null; document.body.style.cursor=''; PK.setDrop(null); if(PK.secHoverPoint) PK.secHoverPoint(null);
  if(!d.ghost) return; PK.LIBCLK.drag=performance.now(); d.ghost.remove(); document.querySelectorAll('#lib .cat.drop').forEach(x=>x.classList.remove('drop'));
  const ct=PK.catTarget(e.clientX,e.clientY); if(ct){ if(ct.dataset.cat!==PK.categoryOf(d.def)) PK.setCategory(d.def.id,ct.dataset.cat); return; }
  if(PK.overFloor(e.clientX,e.clientY)){ const p=PK.floorPoint(e.clientX,e.clientY); const nid=PK.addDevice(d.def.id,Math.round(p.x-20),Math.round(p.y-14),null,null,d.ver()); if(nid){ PK.afterAdd(nid); if(PK.secAssignAt) PK.secAssignAt(nid,e.clientX,e.clientY); if(dc) PK.insertOnCable(nid,dc); else PK.autoLinkOffer(nid); } } });
const libwin=PK.$('libwin'), room=PK.$('room'); PK.libwin=libwin; PK.room=room;
PK.libGesture(PK.$('libbar'),(st,dx,dy)=>{ if(PK.isSheet()){ libwin.style.transform=dy>0?`translateY(${dy}px)`:''; libwin._dy=dy; return; } PK.LIB.x=st.x+dx; PK.LIB.y=st.y+dy; },()=>{ if(PK.isSheet()){ const dy=libwin._dy||0; libwin.style.transform=''; libwin._dy=0; if(dy>90){ PK.LIB.shown=false; PK.placeLib(); PK.saveLib(); } } });
PK.libGesture(libwin.querySelector('.rz.e'),(st,dx)=>{ PK.LIB.w=st.w+dx; });
PK.libGesture(libwin.querySelector('.rz.s'),(st,dx,dy)=>{ PK.LIB.h=st.h+dy; });
PK.libGesture(libwin.querySelector('.rz.se'),(st,dx,dy)=>{ PK.LIB.w=st.w+dx; PK.LIB.h=st.h+dy; });
PK.libGesture(libwin.querySelector('.rz.w'),(st,dx)=>{ const w=PK.clamp(st.w-dx,260,4000); PK.LIB.x=st.x+(st.w-w); PK.LIB.w=w; });
PK.$('libbar').addEventListener('dblclick',e=>{ if(e.target.closest('button')||PK.isSheet()) return; PK.LIB.min=!PK.LIB.min; PK.placeLib(); PK.saveLib(); });
PK.$('libMin').onclick=()=>{ PK.LIB.min=!PK.LIB.min; PK.placeLib(); PK.saveLib(); };
PK.$('libFsUp').onclick=()=>{ PK.LIB.fs=PK.clamp(PK.LIB.fs+1,11,18); PK.placeLib(); PK.saveLib(); PK.paintLibFs(); };
PK.$('libFsDown').onclick=()=>{ PK.LIB.fs=PK.clamp(PK.LIB.fs-1,11,18); PK.placeLib(); PK.saveLib(); PK.paintLibFs(); };
PK.paintLibFs();
PK.$('libToggle').onclick=()=>{ PK.LIB.shown=!PK.LIB.shown; PK.placeLib(); PK.saveLib(); };
PK.$('libSearch').addEventListener('input',PK.paintLib);
PK.$('libRetired').checked=!!PK.LIB.retired; PK.$('libRetired').onchange=()=>{ PK.LIB.retired=PK.$('libRetired').checked; PK.saveLib(); PK.paintLib(); };
libwin.addEventListener('pointerdown',e=>e.stopPropagation());
window.addEventListener('resize',PK.placeLib);
document.addEventListener('keydown',e=>{ if(PK.textEntry(e)) return; if(e.code==='KeyB'&&e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){ e.preventDefault(); PK.LIB.shown=!PK.LIB.shown; PK.placeLib(); PK.saveLib(); } });
PK.libTabsInit();
PK.placeLib();
PK.paintLib();
// ===== clock =====
PK.$('play').onclick=()=>PK.Host.running?PK.pkStop():PK.start();
PK.$('bpm').addEventListener('input',()=>{PK.Host.bpm=PK.clamp(+PK.$('bpm').value||126,40,200);});
PK.$('swing').addEventListener('input',()=>{PK.Host.swing=+PK.$('swing').value;});
document.addEventListener('keydown',e=>{ if(PK.typing(e)) return; if(e.key===' '){PK.$('play').click(); e.preventDefault();} if((e.key==='Delete'||e.key==='Backspace')&&PK.selected&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){PK.removeDevice(PK.selected);} });
// ===== clip =====
PK.multiInit(); PK.groupInit(); PK.secInit(); PK.recLampInit(); PK.deviceMenuInit(); PK.clipInit(); PK.clipMenuInit();   // Ctrl/Cmd+C, Ctrl/Cmd+V en Ctrl+Z (kort na plakken) op het gekozen apparaat; plus de instelling en het plakmenu (clip-menu.js)
// ===== workspace-core =====
/* =====================================================================
   WERKRUIMTE · naam, bestand, browser — en BRONNEN · GitHub, URL, lokale map
   ===================================================================== */
const WS={name:PK.pkt('m.naamloos')}; PK.WS=WS;
PK.$('wsName').addEventListener('input',()=>{ WS.name=PK.$('wsName').value.trim()||PK.pkt('m.naamloos'); if(typeof PK.wslPaint==='function') PK.wslPaint(); PK.$('wsNameEcho').textContent=WS.name; document.title=WS.name+' · Patchkamer'; });
PK.$('wsName').addEventListener('change',()=>PK.setName(PK.$('wsName').value));
PK.$('wsName').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); PK.$('wsName').blur(); } });
// ===== sources =====
try{ PK.SOURCES=JSON.parse(localStorage.getItem(PK.SKEY)||'[]').filter(x=>x&&x.sid&&x.kind); }catch(e){ PK.SOURCES=[]; }
const NETMSG=PK.pkt('m.in_de_gepubliceerde_artifact_weergave'); PK.NETMSG=NETMSG;
PK.$('srcAddUrl').onclick=async()=>{ let src; try{ src={sid:PK.newSid(),...PK.parseSourceUrl(PK.$('srcUrl').value),added:Date.now()}; }catch(e){ PK.status(e.message,true); return; } if(!src.label) src.label=src.kind==='github'?`${src.owner}/${src.repo}${src.path?'/'+src.path:''}`:src.url; PK.$('srcUrl').value=''; await PK.addSource(src); };
PK.$('srcUrl').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); PK.$('srcAddUrl').click(); } });
if(!window.showDirectoryPicker) PK.$('srcDirHint').hidden=false;
PK.$('srcAddDir').onclick=async()=>{ const pk=await PK.pickFolder(null); if(!pk) return; const src={sid:PK.newSid(),kind:'folder',label:pk.name,added:Date.now()};
  if(pk.handle){ await PK.IDB.set('dir:'+src.sid,pk.handle); src.persist=true; } else PK.DIRFILES.set(src.sid,pk.files);
  await PK.addSource(src); };
// ===== workspace-file =====
PK.$('wsSaveFile').onclick=async()=>{ const ws=PK.workspaceState(PK.$('wsEmbed').checked); const r=await PK.saveTextFile(PK.fileNameOf(WS.name),JSON.stringify(ws,null,1));
  const ext=ws.defs.length, emb=ws.defs.filter(d=>d.code).length;
  if(r==='saved') PK.status(PK.pkt('m.opgeslagen_als_bestand_apparaten',WS.name,ws.devices.length)+(ext?PK.pkt('m.extern',ext,emb?emb+PK.pkt('m.met_code'):PK.pkt('m.alleen_locatie')):'')); else PK.status(PK.pkt('m.opslaan_geannuleerd')); };

// ---- werkruimte: openen ----
PK.$('wsOpenFile').onclick=()=>{ PK.$('wsFileInput').value=''; PK.$('wsFileInput').click(); };
PK.$('wsFileInput').addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return; let ws; try{ ws=JSON.parse(await f.text()); }catch(err){ PK.status(PK.pkt('m.dit_bestand_is_geen_leesbare'),true); return; }
  if(!ws.name) ws.name=f.name.replace(/\.patchkamer\.json$|\.json$/i,''); await PK.openWorkspace(ws); });
// ===== workspace-local =====
PK.$('wsSaveLocal').onclick=()=>{ const b=PK.$('wsSaveLocal'), o=PK.readP(), name=WS.name;
  if(o[name]&&!b.dataset.arm){ b.dataset.arm='1'; b.firstChild.textContent=PK.pkt('m.vervang'); setTimeout(()=>{ b.dataset.arm=''; b.firstChild.textContent=PK.pkt('m.opslaan_als'); },2500); return; }
  b.dataset.arm=''; b.firstChild.textContent=PK.pkt('m.opslaan_als');
  o[name]={t:Date.now(),p:PK.workspaceState(true)}; if(PK.writeP(o)){ PK.paintPatches(); PK.status(PK.pkt('m.opgeslagen_in_deze_browser',name)); } else PK.status(PK.pkt('m.de_browseropslag_is_vol_of'),true); };
const wsPanel=PK.$('wsPanel'); PK.wsPanel=wsPanel;
PK.$('wsBtn').onclick=e=>{ e.stopPropagation(); wsPanel.hidden?PK.openWs():PK.closeWs(); }; PK.$('wsClose').onclick=PK.closeWs;
document.addEventListener('pointerdown',e=>{ if(!wsPanel.hidden&&!e.target.closest('#wsPanel,#wsBtn,.pkmodal')) PK.closeWs(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!wsPanel.hidden) PK.closeWs(); });
PK.$('wsNew').onclick=()=>{ const b=PK.$('wsNew'); if(!b.dataset.arm){ b.dataset.arm='1'; b.textContent=PK.pkt('m.zeker_niet_opgeslagen_werk_verdwijnt'); setTimeout(()=>{ b.dataset.arm=''; b.textContent=PK.pkt('m.nieuwe_lege_werkruimte'); },3000); return; }
  b.dataset.arm=''; b.textContent=PK.pkt('m.nieuwe_lege_werkruimte'); PK.clearFloor(); PK.setName(PK.pkt('m.naamloos')); PK.Host.view={x:40,y:40,scale:PK.PKS.f}; PK.applyView(); PK.closeWs(); PK.status(PK.pkt('m.nieuwe_lege_werkruimte')); };
PK.$('clear').onclick=()=>{ if(PK.$('clear').dataset.arm){PK.clearFloor(); PK.wsaAutoLoad(); PK.$('clear').dataset.arm=''; PK.$('clear').textContent=PK.pkt('m.leeg');} else {PK.$('clear').dataset.arm='1'; PK.$('clear').textContent=PK.pkt('m.zeker'); setTimeout(()=>{PK.$('clear').dataset.arm=''; PK.$('clear').textContent=PK.pkt('m.leeg');},2500);} };
PK.$('exportPatch').onclick=()=>{PK.$('patchText').value=JSON.stringify(PK.workspaceState(PK.$('wsEmbed').checked));};
PK.$('importPatch').onclick=async()=>{ let ws; try{ ws=JSON.parse(PK.$('patchText').value); }catch(e){ PK.status(PK.pkt('m.kon_de_werkruimte_niet_lezen'),true); return; } if(await PK.openWorkspace(ws)) PK.$('patchText').value=''; };
PK.BUNDLED_LIB=null;   // var: paintLib kan eerder draaien
(async()=>{ if(location.protocol==='file:') return; try{ const u=new URL('bibliotheek/patchkamer.json',location.href).href; const r=await fetch(u,{cache:'no-cache'}); if(!r.ok) return; const m=await r.json(); if(!Array.isArray(m.modules)) return;
  PK.BUNDLED_LIB=u; PK.$('feBundled').hidden=false; PK.$('feHint').textContent=PK.pkt('m.de_meegeleverde_bibliotheek_bevat')+PK.pktp('m.n_apparaat',m.modules.length===1,m.modules.length)+(m.workspaces&&m.workspaces.length?PK.pkt('m.en_n_startwerkruimtes',m.workspaces.length):'')+'.'; PK.paintLib(); }catch(e){} })();
PK.$('feLib').onclick=()=>PK.$('srcAddDir').click(); PK.$('feBundled').onclick=PK.loadBundled; PK.$('feOpen').onclick=()=>{ PK.$('wsFileInput').value=''; PK.$('wsFileInput').click(); };
// bij het openen: onthouden bronnen weer laden (mappen alleen als de browser de toestemming nog heeft)
// ===== workspace-auto =====
PK.WSA=JSON.parse(JSON.stringify(PK.WSA_DEF)); PK.WSA_START={always:true,splash:true};
try{ const o=JSON.parse(localStorage.getItem(PK.WSA_START_KEY)||'null'); if(o&&typeof o==='object'){ PK.WSA_START={always:o.always!==false,splash:o.splash!==false}; } }catch(e){}
try{ const o=JSON.parse(localStorage.getItem(PK.WSAKEY)||'null'); if(o&&typeof o==='object') for(const k of Object.keys(PK.WSA)) if(o[k]&&typeof o[k]==='object') PK.WSA[k]={on:o[k].on!==false,url:typeof o[k].url==='string'&&o[k].url.trim()?o[k].url.trim().slice(0,400):PK.WSA_DEF[k].url}; }catch(e){}
for(const [k,id] of [['dev','Dev'],['pre','Pre'],['tun','Tun'],['ski','Ski'],['sam','Sam']]){
  PK.$('wsa'+id).onchange=()=>{ PK.WSA[k].on=PK.$('wsa'+id).checked; PK.saveWsa(); };
  PK.$('wsu'+id).onchange=()=>{ const v=PK.$('wsu'+id).value.trim(); PK.WSA[k].url=v||PK.WSA_DEF[k].url; PK.$('wsu'+id).value=PK.WSA[k].url; PK.saveWsa(); }; }
PK.$('wsaStart').onchange=()=>{ PK.WSA_START.always=PK.$('wsaStart').checked; PK.saveWsaStart(); };
PK.$('wsaSplash').onchange=()=>{ PK.WSA_START.splash=PK.$('wsaSplash').checked; PK.saveWsaStart(); };
PK.$('wsaReset').onclick=()=>{ PK.WSA=JSON.parse(JSON.stringify(PK.WSA_DEF)); PK.WSA_START={always:true,splash:true}; PK.saveWsa(); PK.saveWsaStart(); PK.wsaPaint(); };
PK.wsaPaint();
PK.$('prLoadAll').onclick=async()=>{ const k=PK.TUMODE==='tune'?'tun':'pre', b=PK.$('prLoadAll'); b.disabled=true;
  try{ const src=await PK.wsaLoad(k,true); if(src){ const st=PK.SRCSTATE.get(src.sid)||{}; PK.status(`${PK.srcLabel(src)}: ${st.msg||''}`,st.state==='err'); } }catch(e){ PK.status(e.message,true); } finally{ b.disabled=false; PK.prPaintPanel(); } };
// ===== workspace-tabs =====
// ---- meerdere werkruimtes: tabbalk, F1 t/m F10, toevoegen en sluiten ----
// Elke werkruimte is een gewone werkruimte (zoals Bewaar/Open als bestand); wisselen bewaart de huidige, ruimt de vloer op en opent de gekozen. De afspeelstand stopt bij het wisselen.
// De lijst wordt in IndexedDB bewaard (sleutel wslots) en weer geopend bij het starten.
PK.PK_PENDING=false;   // na een taalwissel zet de host zelf de werkruimte terug
PK.WSL={ready:false,busy:false,cur:0,slots:[]};
document.addEventListener('keydown',e=>{ if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!PK.WSL.ready) return; const m=/^F(\d{1,2})$/.exec(e.key); if(!m) return; const n=+m[1]; if(n<1||n>PK.WSL.slots.length) return;
  e.preventDefault(); if(document.querySelector('.pkmodal')) return; PK.wslSwitch(n-1); });
setInterval(PK.wslSave,15000); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') PK.wslSave(); }); window.addEventListener('pagehide',()=>{ PK.wslSave(); });
PK.paintSources(); (async()=>{ const SP=PK.startupBegin();   // het startscherm met voortgang (js/startup.js)
  await SP.each(PK.SOURCES,2,async src=>{ SP.src(src); try{ await PK.loadSource(src,{interactive:false}); if(src.kind==='folder'){ const sg=await PK.folderSig(src); if(sg) PK.FOLDERSIG.set(src.sid,sg); } }catch(e){ SP.warn(); } SP.srcEnd(src); });   // twee bronnen tegelijk
  await PK.wslInit({auto:()=>SP.auto(),always:PK.WSA_START.always,ws:()=>SP.step(PK.pkt('m.su_werkruimte'),'ws')}); SP.finish(); })();
PK.paintPatches();
// ===== tunes =====
/* =====================================================================
   TUNES · klankinstellingen per apparaat, in tunebibliotheken met mappen (contract v1.9; vervangt de presets van v1.6)
   Een tunebibliotheek hoort bij één apparaat-id: {lid, name, device, author, license, description, ro, src?, tree:[knoop]}.
   Knoop: map {type:'folder', fid, name, children:[]} of tune {type:'tune', pid, name, kind:'set'|'part', ptype?, author, tags, ver, state, t}.
   'set' = de hele instelling (getPreset/getState); 'part' = één instrument van een drumcomputer (getPart/setPart, v1.9).
   Laden geeft ieder exemplaar een eigen kopie: twee exemplaren met dezelfde tune beïnvloeden elkaar niet.
   Eigen bibliotheken staan in IndexedDB ('tunes:user'); oude presetbibliotheken worden bij de eerste start omgezet.
   Bestanden: *.patchkamer-tunes.json (tunepack) en, voor oude bestanden, *.patchkamer-presets.json.
   ===================================================================== */
PK.PR={libs:[],prefs:{active:null,off:[],bar:true,last:{}}};
try{ Object.assign(PK.PR.prefs,JSON.parse(localStorage.getItem(PK.PRKEY)||'{}')); }catch(e){}
if(!Array.isArray(PK.PR.prefs.off)) PK.PR.prefs.off=[]; if(!PK.PR.prefs.last||typeof PK.PR.prefs.last!=='object') PK.PR.prefs.last={};
const TW={tune:{one:PK.pkt('m.tw_tune_one'),many:PK.pkt('m.tw_tune_many'),One:PK.pkt('m.tune'),Many:PK.pkt('m.tunes'),lib:PK.pkt('m.tw_tune_lib'),Lib:PK.pkt('m.tunebibliotheek'),libs:PK.pkt('m.tw_tune_libs')},preset:{one:PK.pkt('m.tw_preset_one'),many:PK.pkt('m.tw_preset_many'),One:PK.pkt('m.preset'),Many:PK.pkt('m.presets'),lib:PK.pkt('m.tw_preset_lib'),Lib:PK.pkt('m.presetbibliotheek'),libs:PK.pkt('m.tw_preset_libs')}}; PK.TW=TW;
const LICS=[['CC-BY-4.0',PK.pkt('m.cc_by_4_0_vrij')],[PK.LIC_ARR,PK.pkt('m.alle_rechten_voorbehouden_2')]]; PK.LICS=LICS;
window.addEventListener('pagehide',()=>{ if(typeof PK.PK_WIPING!=='undefined'&&PK.PK_WIPING) return; if(PK.prPersistT){ clearTimeout(PK.prPersistT); PK.prPersistT=0; PK.IDB.set('tunes:user',PK.prDump()); } });

// ---- paneel: tunebibliotheken per apparaat, met mappen ----
const prPanel=PK.$('prPanel'); PK.prPanel=prPanel;
PK.$('prBtn').onclick=e=>{ e.stopPropagation(); PK.prOpenPanel('tune'); }; PK.$('psBtn').onclick=e=>{ e.stopPropagation(); PK.prOpenPanel('preset'); };   // knoppen in het ☰-menu: open de bibliotheek op de tab Tunes of Presets
PK.$('prNew').onclick=()=>{ const dev=PK.TUFILTER||(PK.selected&&PK.Host.devices.get(PK.selected)&&PK.Host.devices.get(PK.selected).def.id); if(!dev){ PK.status(PK.pkt('m.kies_eerst_een_apparaat_in'),true); return; } const l=PK.tuNewLib(dev); PK.prOpen.add(l.lid); PK.TUFILTER=dev; PK.prPersist(); PK.prPaintPanel(); };
PK.$('prImport').onclick=()=>{ PK.$('prFile').value=''; PK.$('prFile').click(); };
PK.$('prFile').addEventListener('change',async e=>{ await PK.importTuneFiles(e.target.files); });
PK.$('prShowBar').onchange=()=>{ PK.PR.prefs.bar=PK.$('prShowBar').checked; PK.prSavePrefs(); document.body.classList.toggle('nopbar',!PK.PR.prefs.bar); requestAnimationFrame(PK.drawCables); };
document.body.classList.toggle('nopbar',PK.PR.prefs.bar===false);
// eigen bibliotheken uit IndexedDB laden; de eerste keer de oude presets omzetten (die blijven als reserve staan)
(async()=>{ let saved=await PK.IDB.get('tunes:user');
  if(!Array.isArray(saved)){ const old=await PK.IDB.get('presets:user'); saved=[];
    if(Array.isArray(old)) old.forEach(l=>{ if(!l||!Array.isArray(l.presets)) return; const by=new Map(); l.presets.forEach(p=>{ if(!p||!p.dev) return; if(!by.has(p.dev)) by.set(p.dev,[]); by.get(p.dev).push({type:'tune',pid:p.pid||PK.prUid('p'),name:p.name||PK.pkt('m.naamloos'),kind:'set',author:'',tags:[],ver:p.ver||'',state:p.state,t:p.t||Date.now()}); });
      by.forEach((tree,dev)=>saved.push({lid:l.lid+'~'+dev,name:l.name||PK.pkt('m.presets'),device:dev,tree})); });   // soort volgt het apparaat (tuTypeOf)
    if(saved.length){ PK.IDB.set('tunes:user',saved); setTimeout(()=>PK.status(PK.pktp('m.presets_omgezet_naar_tunebibliotheken_n',saved.length>1,saved.length)),800); } }
  saved.forEach(l=>{ if(l&&l.lid&&l.device&&Array.isArray(l.tree)&&!PK.prLib(l.lid)) PK.PR.libs.unshift({lid:l.lid,name:l.name||PK.pkt('m.tunes'),device:l.device,type:l.type,author:l.author||'',license:l.license||'',description:l.description||'',ro:false,tree:l.tree}); });
  PK.PR.libs.sort((a,b)=>(a.ro-b.ro)); PK.presetRefreshAll(); })();
// voor apparaten en tests: bewaren en kiezen zonder de UI
PK.Host.presets={ list:dev=>PK.PR.libs.filter(PK.prOn).filter(l=>!dev||l.device===dev).flatMap(l=>PK.tuTunes(l).map(({n,path})=>({lib:l.name,lid:l.lid,pid:n.pid,name:n.name,path:path.join(PK.tuSep),kind:n.kind,part:n.ptype,device:l.device}))),
  apply:(inst,lid,pid)=>PK.presetApply(inst&&inst._id,lid,pid), save:(inst,name,lid,opt)=>{ const p=PK.presetSave(inst&&inst._id,name,lid||null,'',opt||{}); return p&&{pid:p.pid}; },
  applyPart:(inst,partId,lid,pid)=>PK.partApply(inst&&inst._id,partId,lid,pid) };
PK.Host.tunes=PK.Host.presets;
// ===== songs =====
const _wsSongBtn=document.getElementById('wsSong'); if(_wsSongBtn) _wsSongBtn.onclick=()=>PK.songExportDialog();
// ===== settings =====
/* =====================================================================
   INSTELLINGEN · instellingen van Patchkamer zelf (weergave, kabels, schaal, knoppen, balken), los van tunes en presets
   ===================================================================== */
const setPanel=PK.$('setPanel'); PK.setPanel=setPanel;
PK.$('wipeBtn').onclick=async()=>{ if(!(await PK.askUser(PK.pkt('m.browsergeheugen_wissen_vraag'),PK.pkt('m.wissen'),PK.pkt('m.annuleren')))) return;
  PK.PK_WIPING=true;
  for(const st of [localStorage,sessionStorage]){ try{ Object.keys(st).filter(k=>k.startsWith('patchkamer')).forEach(k=>st.removeItem(k)); }catch(e){} }
  try{ const db=await PK.IDB.open(); db.close(); }catch(e){}
  await new Promise(res=>{ try{ const r=indexedDB.deleteDatabase('patchkamer'); r.onsuccess=r.onerror=r.onblocked=()=>res(); }catch(e){ res(); } });
  location.reload(); };
if(setPanel){ PK.$('setBtn').onclick=e=>{ e.stopPropagation(); setPanel.hidden?PK.openSettings():PK.closeSettings(); }; PK.$('setClose').onclick=PK.closeSettings;
  document.addEventListener('pointerdown',e=>{ if(!setPanel.hidden&&!e.target.closest('#setPanel,#setBtn,.pkmodal')) PK.closeSettings(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!setPanel.hidden&&!document.querySelector('.pkmodal')) PK.closeSettings(); });
  PK.$('wsBtn').addEventListener('click',()=>PK.closeSettings(),true); }
// ===== start =====
/* =====================================================================
   START: een lege werkruimte (Patchkamer heeft zelf geen apparaten)
   ===================================================================== */
PK.setName(PK.pkt('m.naamloos')); PK.paintFloorEmpty();
// ---------- kleurstelling ----------
(()=>{ const sel=PK.$('skin'), ok=v=>['dark','light','s1000','aurora','paper'].includes(v); let v='dark'; try{ const x=localStorage.getItem('patchkamer.skin'); if(ok(x)) v=x; }catch(e){}
  const set=x=>{ document.documentElement.dataset.skin=x; sel.value=x; try{ localStorage.setItem('patchkamer.skin',x); }catch(e){} requestAnimationFrame(PK.drawCables); window.dispatchEvent(new CustomEvent('patchkamer-skin',{detail:x})); };
  sel.onchange=()=>set(sel.value); set(v); })();
window.addEventListener('resize',PK.drawCables); floorwrap.addEventListener('scroll',PK.drawCables);
// ===== latency =====
/* =====================================================================
   LATENCY · meter in de kopbalk en keuze Laag / Gebalanceerd / Stabiel
   ===================================================================== */
(function(){ const lat=PK.$('latHint'), out=PK.$('latVal'), qs=PK.$('qualSel'), sr=PK.$('srSel'), os=PK.$('osSel'), lg=PK.$('langSel'), P=PK.PK_AUDIO;
  const store=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };
  lat.value=P.latency; sr.value=P.sampleRate; os.value=P.oversample; lg.value=PK.PK_LANGPREF;
  const paintQ=()=>{ qs.value=PK.pkQualityOf(P); qs.querySelector('option[value=custom]').disabled=qs.value!=='custom'; };
  paintQ();
  function show(){ const c=PK.Host.ctx; if(!c){ out.textContent='–'; out.title=PK.pkt('m.nog_geen_geluid_gestart'); return; } const b=+c.baseLatency||0, o=+c.outputLatency||0;
    out.textContent=o?Math.round((b+o)*1000)+' ms':(b?Math.round(b*1000)+' ms + ?':PK.pkt('m.onbekend'));
    out.title=PK.pkt('m.browser_ms_uitgang_os_geluidskaart',(b*1000).toFixed(1),o?(o*1000).toFixed(1)+' ms':PK.pkt('m.niet_opgegeven_door_deze_browser'),c.sampleRate,lat.options[lat.selectedIndex].text);
    out.style.color=o&&b+o>0.04?'var(--stop)':o&&b+o>0.02?'var(--event)':'var(--go)';
    PK.$('srNote').textContent=c.sampleRate?PK.pkt('m.nu_actief_hz',c.sampleRate):''; }
  setInterval(show,1000); show();
  // een andere taal of audio-instelling geldt voor een nieuwe AudioContext en nieuwe apparaten: werkruimte bewaren, pagina herladen, werkruimte terugzetten
  async function reloadFlow(){
    if(!PK.Host.ctx||!PK.Host.devices.size){ if(!PK.Host.ctx&&!PK.Host.devices.size&&!PK.PK_RELOAD_ALWAYS) { PK.status(PK.pkt('m.instelling_bewaard')); return; } location.reload(); return; }
    if(!(await PK.askUser(PK.pkt('m.een_wijziging_laadt_opnieuw'),PK.pkt('m.herladen'),PK.pkt('m.later')))) { PK.status(PK.pkt('m.geldt_bij_de_volgende_keer')); return; }
    try{ sessionStorage.setItem('patchkamer.reloadWs',JSON.stringify(PK.workspaceState(true))); location.reload(); }
    catch(e){ PK.status(PK.pkt('m.kon_de_werkruimte_niet_tijdelijk'),true); } }
  lg.onchange=()=>{ store('patchkamer.lang',lg.value); PK.PK_RELOAD_ALWAYS=true; reloadFlow(); };
  lat.onchange=()=>{ P.latency=lat.value; store('patchkamer.latency',P.latency); paintQ(); reloadFlow(); };
  sr.onchange=()=>{ P.sampleRate=sr.value; store('patchkamer.sampleRate',P.sampleRate); paintQ(); reloadFlow(); };
  os.onchange=()=>{ P.oversample=os.value; store('patchkamer.oversample',P.oversample); paintQ(); reloadFlow(); };
  qs.onchange=()=>{ const p=PK.PK_QUALITY[qs.value]; if(!p){ paintQ(); return; } Object.assign(P,p); store('patchkamer.latency',P.latency); store('patchkamer.sampleRate',P.sampleRate); store('patchkamer.oversample',P.oversample);
    lat.value=P.latency; sr.value=P.sampleRate; os.value=P.oversample; paintQ(); reloadFlow(); };
  // na herladen: werkruimte terugzetten
  let pend=null; try{ pend=sessionStorage.getItem('patchkamer.reloadWs'); sessionStorage.removeItem('patchkamer.reloadWs'); }catch(e){} PK.PK_PENDING=!!pend;
  if(pend){ setTimeout(async()=>{ try{ await PK.openWorkspace(JSON.parse(pend)); PK.status(PK.pkt('m.werkruimte_teruggezet_na_wijziging')); }catch(e){ PK.status(PK.pkt('m.terugzetten_mislukt')+e.message,true); } },300); }
  // contract: links naar GitHub; eigen taal eerst
  (function(){ const a=PK.$('manA'), b=PK.$('manB'); if(PK.PK_LANG==='en'){ const h=a.href, x=a.textContent; a.href=b.href; a.textContent=b.textContent; b.href=h; b.textContent=x; } })();
  (function(){ const a=PK.$('ctrA'), b=PK.$('ctrB'); if(PK.PK_LANG==='en'){ const h=a.href, x=a.textContent; a.href=b.href; a.textContent=b.textContent; b.href=h; b.textContent=x; } })();
})();
// ===== mod-view =====
/* =====================================================================
   MODULATIE ZICHTBAAR · wat Drift, LFO en andere modulatoren nu doen, op het apparaat dat ze sturen
   ===================================================================== */
PK.MODVIEW={on:true,raf:0,last:0}; try{ if(localStorage.getItem('patchkamer.modview')==='0') PK.MODVIEW.on=false; }catch(e){}
document.body.classList.toggle('nomodview',!PK.MODVIEW.on);
{ const cb=PK.$('modViewCb'); if(cb){ cb.checked=PK.MODVIEW.on; cb.onchange=()=>PK.setModView(cb.checked); } }
PK.modViewKick();
// ===== library-layout =====
PK.ICFG=null;   // categorie waarvan de icoonkiezer openstaat
PK.$('libCfgBtn').onclick=()=>{ const b=PK.$('libCfg'); b.hidden=!b.hidden; PK.$('libCfgBtn').classList.toggle('on',!b.hidden); PK.$('libCfgBtn').setAttribute('aria-expanded',String(!b.hidden)); if(!b.hidden) PK.paintLibCfg(); };
// ===== arrange =====
/* =====================================================================
   HERSCHIKKEN · van links naar rechts: bronnen → instrumenten → effecten → mengpaneel → uitgang
   ===================================================================== */
PK._lastLayout=null;
PK.$('arrange').onclick=PK.arrangeDevices;
document.addEventListener('keydown',e=>{ if(PK.typing(e)) return; if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==='z'||e.key==='Z')&&PK._lastLayout){ if(PK.undoArrange()) e.preventDefault(); } });
// handmatig verplaatsen maakt 'ongedaan maken' van herschikken ongeldig
// ===== auto-link =====
PK._alMem=null, PK._alUndo=null;
['alMenuCb','alSetCb'].forEach(i=>{ const e=PK.$(i); if(e) e.onchange=()=>PK.autoLinkSet(e.checked); });
PK.PKT.coarse.addEventListener('change',PK.autoLinkPaint); PK.autoLinkPaint();
{ const e=PK.$('skDefSel'); if(e) e.onchange=()=>PK.skDefSet(e.value); PK.skDefPaint(); }
document.addEventListener('keydown',e=>{ if(PK.typing(e)||document.querySelector('.pkmodal')) return; if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==='z'||e.key==='Z')&&PK._alUndo){ if(PK.alUndo()) e.preventDefault(); } });
// ===== focus =====
/* =====================================================================
   FOCUS · apparaten met [f] naast, onder of in een raster, zonder ze op het canvas te verplaatsen
   ===================================================================== */
PK._focusSeq=0, PK.FOCUS={open:false,layout:'row',idx:0,all:false}, PK.FOCUS_PICKED=false; try{ const v=localStorage.getItem('patchkamer.focusLayout'); if(['row','col','grid','one'].includes(v)){ PK.FOCUS.layout=v; PK.FOCUS_PICKED=true; } }catch(e){}
if(!PK.FOCUS_PICKED&&PK.isSheet()) PK.FOCUS.layout='one';
PK.focusEl=null;
PK.$('focusBtn').onclick=()=>{ PK.FOCUS.open?PK.closeFocus():PK.openFocus(); };
document.addEventListener('keydown',e=>{ if(!PK.textEntry(e)&&e.code==='KeyF'&&e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){ PK.FOCUS.open?PK.closeFocus():PK.openFocus(); e.preventDefault(); } if(PK.typing(e)) return; if(e.key==='Escape'&&PK.FOCUS.open&&!document.querySelector('.pkmodal')){ PK.closeFocus(); } });
PK.paintFocusBtn();
// ===== touch =====
// animatie van de camera (zacht, tenzij prefers-reduced-motion)
PK.VANIM=0;
document.addEventListener('pointerdown',e=>{ if(e.pointerType!=='touch') return; const now=performance.now(); PK.TOUCH.last=now; const path=e.composedPath();
  PK.TOUCH.downs.set(e.pointerId,{x:e.clientX,y:e.clientY,t:now});
  if(path.includes(floorwrap)){
    if(PK.TOUCH.pinch){ e.stopPropagation(); e.preventDefault(); return; }   // een derde vinger doet niets
    PK.viewCancelAnim(); const ok=PK.touchEligible(path); PK.TOUCH.pts.set(e.pointerId,{x:e.clientX,y:e.clientY,target:path[0],ok});
    if([...PK.TOUCH.pts.values()].filter(p=>p.ok).length>=2){ PK.pinchStart(); e.stopPropagation(); e.preventDefault(); return; }
    // een vinger naast een poort op de rand van een kaart pakt die poort (de stip is klein onder een vingertop)
    const t0=path[0];
    if(ok&&t0&&t0.nodeType===1&&!t0.closest('.port,.rz,button,select,.pbar,.bar')&&t0.closest('.card .body')&&!path.some(n=>n&&n.classList&&n.classList.contains('ui'))){
      const pi=PK.nearestPort(e.clientX,e.clientY,22); if(pi){ e.stopPropagation(); e.preventDefault(); PK.select(pi.id); PK.startWire(pi.id,pi.port,pi.dir,pi.kind,e); return; } } }
  PK.lpArm(e,path); },true);
document.addEventListener('pointermove',e=>{ if(e.pointerType!=='touch') return; const p=PK.TOUCH.pts.get(e.pointerId); if(!p) return; p.x=e.clientX; p.y=e.clientY;
  if(PK.TOUCH.pinch&&PK.TOUCH.pinch.ids.includes(e.pointerId)){ e.stopPropagation(); PK.pinchUpdate(); } },true);
document.addEventListener('pointerup',PK.touchGone,true); document.addEventListener('pointercancel',PK.touchGone,true);
document.addEventListener('pointermove',e=>{ if(PK.LP.id===e.pointerId&&Math.hypot(e.clientX-PK.LP.x,e.clientY-PK.LP.y)>10) PK.lpCancel(); },true);
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,e=>{ if(PK.LP.id===e.pointerId) PK.lpCancel(); if(PK.LP.swallow&&e.pointerType==='touch'){ clearTimeout(PK.LP.off); PK.LP.off=setTimeout(()=>{ PK.LP.swallow=false; },120); } },true));
document.addEventListener('click',e=>{ if(PK.LP.swallow){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); PK.LP.swallow=false; } },true);   // het loslaten na lang indrukken telt niet als klik
// het contextmenu van de browser (aanraking: lang indrukken) alleen onderdrukken waar de host het zelf afhandelt
document.addEventListener('contextmenu',e=>{ if(performance.now()-PK.TOUCH.last>1500) return; const path=e.composedPath();
  if(path.some(n=>PK.isFormEl(n)||(n&&n.nodeType===1&&n.classList.contains('ui')))) return;
  if(path.some(n=>n&&n.nodeType===1&&(n===floorwrap||n.id==='libwin'||n.tagName==='HEADER'||n.classList.contains('focusview')))) e.preventDefault(); },true);

/* ---- dubbeltik: een eigen dblclick, want de browser stuurt hem op aanraking niet altijd ----
   Alles wat nu op dblclick luistert (beginwaarde van een schuif, kaartrand = standaardmaat, icoon terugzetten, categorie hernoemen,
   bibliotheekbalk) werkt zo ook met de vinger, ook voor de regelaars van apparaten. Een eigen dblclick van de browser wordt onderdrukt. */
window.addEventListener('dblclick',e=>{ if(e.isTrusted&&performance.now()-PK.TOUCH.lastDbl<900){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
document.addEventListener('pointerup',e=>{ if(e.pointerType!=='touch') return; const d=PK.TOUCH.downs.get(e.pointerId); const now=performance.now(); if(!d) return;
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>12||now-d.t>450||PK.TOUCH.pinch||PK.LP.swallow){ PK.TOUCH.tap=null; return; }
  const path=e.composedPath(), tg=path[0]; if(!tg||tg.nodeType!==1||PK.isFormEl(tg)){ PK.TOUCH.tap=null; return; }
  const lt=PK.TOUCH.tap;
  if(lt&&now-lt.t<350&&Math.hypot(e.clientX-lt.x,e.clientY-lt.y)<30){ PK.TOUCH.tap=null; PK.TOUCH.lastDbl=now;
    try{ tg.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,composed:true,clientX:e.clientX,clientY:e.clientY,screenX:e.screenX,screenY:e.screenY,detail:2,view:window})); }catch(err){} }
  else PK.TOUCH.tap={t:now,x:e.clientX,y:e.clientY}; },true);
PK._hwT=0, PK._hwS=0;
floorwrap.addEventListener('pointerdown',PK.viewCancelAnim,true); floorwrap.addEventListener('wheel',PK.viewCancelAnim,true);
// ===== camera-views =====
/* =====================================================================
   SEMANTISCH ZOOMEN · onder ±55% van de schermschaal tonen de kaarten alleen titelbalk en poorten (CSS .floor.lite)
   De apparaten blijven bestaan en luisteren door; alleen het tekenen van hun binnenkant wordt overgeslagen en hun host.frame-teken-
   klok staat stil (zoals bij een kaart buiten beeld). Dubbelklik of dubbeltik op zo'n kaart zoomt erop in.
   ===================================================================== */
floorwrap.addEventListener('dblclick',e=>{ if(!PK.LITE.state) return; const path=e.composedPath();
  if(path.some(n=>n&&n.nodeType===1&&(n.matches&&n.matches('button,select,input,.rz,.viewctl')))) return;
  const card=path.find(n=>n&&n.nodeType===1&&n.classList.contains('card')); if(!card||card.classList.contains('mini')||!PK.Host.devices.has(card.dataset.id)) return;
  const r=PK.Host.devices.get(card.dataset.id); e.stopPropagation(); e.preventDefault(); PK.select(card.dataset.id);
  const wr=floorwrap.getBoundingClientRect(), s=Math.max(PK.Host.view.scale,PK.PKS.f,PK.PKT.coarse.matches?1:0), cx=r.x+(r.el.offsetWidth||300)/2, cy=r.y+Math.min(r.el.offsetHeight||200,wr.height/s)/2;
  PK.viewTo(wr.width/2-cx*s,wr.height/2-cy*s,s); },true);
PK.STANDPOP=null;
PK.$('standBtn').onclick=e=>{ e.stopPropagation(); if(PK.STANDPOP){ PK.standClose(); return; } PK.STANDPOP=document.createElement('div'); PK.STANDPOP.className='standpop'; PK.STANDPOP.setAttribute('role','dialog'); PK.STANDPOP.setAttribute('aria-label',PK.pkt('m.t_standen_kop'));
  PK.STANDPOP.addEventListener('pointerdown',ev=>ev.stopPropagation()); PK.$('room').appendChild(PK.STANDPOP); PK.$('standBtn').classList.add('on'); PK.$('standBtn').setAttribute('aria-expanded','true'); PK.standPaint(); };
document.addEventListener('pointerdown',e=>{ if(PK.STANDPOP&&!e.target.closest('.standpop,#standBtn')) PK.standClose(); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&PK.STANDPOP) PK.standClose();
  const m=/^Digit([1-9])$/.exec(e.code||''); if(!m||e.ctrlKey||e.metaKey||e.altKey||PK.textEntry(e)||document.querySelector('.pkmodal')||(typeof PK.FOCUS!=='undefined'&&PK.FOCUS.open)) return;
  const path=e.composedPath?e.composedPath():[]; if(path.some(n=>n&&n.nodeType===1&&n.classList.contains('ui'))) return;   // een apparaat met toetsenbordfocus houdt zijn eigen toetsen
  const n=+m[1]; e.preventDefault();
  if(e.shiftKey) PK.standSave(n-1<PK.Host.views.length?n-1:-1); else if(!PK.standGo(n-1)) PK.status(PK.pkt('m.t_stand_geen',n),true); });
// ===== screen-layout =====
PK.$('layoutSel').onchange=()=>{ const m=PK.$('layoutSel').value; PK.LAY.mode=(m==='wide'||m==='compact')?m:'auto'; try{ localStorage.setItem('patchkamer.layoutMode',PK.LAY.mode); }catch(e){} PK.layoutSwitch(PK.layoutTarget(),{fit:PK.LAY.mode!=='wide'}); PK.layoutPaintSel(); };
PK.$('fitScreen').onclick=PK.layoutFitScreen;
var _layT=0; window.addEventListener('resize',()=>{ clearTimeout(_layT); _layT=setTimeout(()=>{ if(PK.LAY.mode==='auto'&&PK.Host.devices.size&&PK.layoutTarget()!==PK.LAY.cls) PK.layoutSwitch(PK.layoutTarget(),{fit:true}); else if(PK.LAY.mode==='auto'&&!PK.Host.devices.size) PK.LAY.cls=PK.layoutTarget(); },350); });
PK.layoutPaintSel();

/* ---- instelling: kaarten vereenvoudigen bij uitzoomen ---- */
(function(){ const cb=PK.$('liteCb'); cb.checked=PK.LITE.on; cb.onchange=()=>{ PK.LITE.on=cb.checked; try{ localStorage.setItem('patchkamer.liteZoom',PK.LITE.on?'1':'0'); }catch(e){} PK.liteUpdate(); }; })();
// ===== library-view =====
/* =====================================================================
   BIBLIOTHEEK · weergave kaartjes/compact, lang indrukken + slepen op aanraking, onderlade op een smal scherm
   ===================================================================== */
PK.LIBCLK={drag:0,placed:0};
document.querySelectorAll('#libView button').forEach(b=>{ b.onclick=()=>{ PK.LIBV={v:b.dataset.v,picked:true}; try{ localStorage.setItem('patchkamer.libView',PK.LIBV.v); }catch(e){} PK.paintLib(); }; });
PK.$('libClose').onclick=()=>{ PK.LIB.shown=false; PK.placeLib(); PK.saveLib(); };
document.addEventListener('pointermove',e=>{ if(PK.LIBP.id!==e.pointerId) return; if(Math.hypot(e.clientX-PK.LIBP.x,e.clientY-PK.LIBP.y)>10){ PK.LIBP.moved=true; if(!PK.LIBP.on){ clearTimeout(PK.LIBP.timer); PK.LIBP.id=null; } } },true);
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,e=>{ if(PK.LIBP.id!==e.pointerId) return; clearTimeout(PK.LIBP.timer); const was=PK.LIBP.on&&!PK.LIBP.moved&&t==='pointerup'; const d=PK.LIBP.def; PK.LIBP.id=null; PK.LIBP.on=false;
  if(was||(t==='pointercancel'&&PK.libDrag&&PK.libDrag.touch)){ if(PK.libDrag&&PK.libDrag.ghost) PK.libDrag.ghost.remove(); PK.libDrag=null; document.querySelectorAll('#lib .cat.drop').forEach(x=>x.classList.remove('drop')); PK.setDrop(null);
    if(was&&d){ PK.status(`${d.name} · v${d.version} · ${d.kind} · ${d.id}`); PK.LIBCLK.drag=performance.now(); } } },true));
document.addEventListener('touchmove',e=>{ if(PK.libDrag&&PK.libDrag.touch&&e.cancelable) e.preventDefault(); },{passive:false});
PK.PKT.narrow.addEventListener('change',()=>{ PK.placeLib(); PK.paintLib(); if(typeof PK.FOCUS!=='undefined'&&!PK.FOCUS.open&&!PK.FOCUS_PICKED) PK.FOCUS.layout=PK.focusBase(); });
PK.PKT.coarse.addEventListener('change',()=>{ PK.paintLib(); PK.hitWidthRefresh(); });
// ===== header-menu =====
/* ---------- menu achter ☰ op alle schermbreedten: de balk houdt logo, werkruimtenaam, Start, BPM, Swing, Bibliotheek en ☰; al het andere staat in het menu ---------- */
const HM={menu:PK.$('hdrMenu'),btn:PK.$('menuBtn'),open:false,pushed:false}; PK.HM=HM;
HM.btn.addEventListener('click',()=>HM.open?PK.hmClose():PK.hmOpen());
HM.menu.addEventListener('click',e=>{ if(e.target.closest('button')) setTimeout(PK.hmClose,0); },true);
HM.menu.addEventListener('change',e=>{ if(e.target.closest('select')) PK.hmClose(); });
document.addEventListener('pointerdown',e=>{ if(HM.open&&!HM.menu.contains(e.target)&&!HM.btn.contains(e.target)) PK.hmClose(); },true);
document.addEventListener('keydown',e=>{ if(HM.open&&e.key==='Escape'){ e.preventDefault(); PK.hmClose(); HM.btn.focus(); } });
window.addEventListener('popstate',()=>{ if(HM.open){ HM.pushed=false; PK.hmClose(true); } });
(function(){ const lab=(id,span)=>{ const el=PK.$(id), t=span&&span.textContent.trim(); if(el&&t){ el.title=t; el.setAttribute('aria-label',t); } };
  lab('bpm',PK.$('bpm').closest('.tp').firstElementChild); lab('swing',PK.$('swing').closest('.tp').firstElementChild); lab('libToggle',PK.$('libToggle')); })();
PK.paintLibView();
// ===== focus-carousel =====
PK.$('browseBtn').onclick=()=>{ if(PK.FOCUS.open&&PK.FOCUS.all){ PK.closeFocus(); return; } if(PK.FOCUS.open) PK.closeFocus();
  if(!PK.Host.devices.size){ PK.status(PK.pkt('m.t_bladeren_leeg'),true); return; }
  PK.FOCUS.all=true; PK.FOCUS.layout='one'; const si=PK.focusList().findIndex(([id])=>id===PK.selected); PK.FOCUS.idx=si>=0?si:0; PK.openFocus(); };
document.addEventListener('keydown',e=>{ if(!PK.FOCUS.open||PK.FOCUS.layout!=='one'||PK.typing(e)||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey) return;
  if(e.key==='ArrowLeft'){ PK.focusStep(-1); e.preventDefault(); } else if(e.key==='ArrowRight'){ PK.focusStep(1); e.preventDefault(); } });
// ===== ai-chat =====

// ---- instellingen: sectie AI-assistent ----
(function(){ if(!document.getElementById('aiProv')) return; const $=id=>document.getElementById(id); let c=PK.pkAiCfg();
  const paint=()=>{ c=PK.pkAiCfg(); $('aiProv').value=c.provider; $('aiKey').value=c.keys[c.provider]||''; $('aiModel').value=c.models[c.provider]||''; $('aiBase').value=c.base||''; $('aiBaseRow').hidden=c.provider!=='compat'; $('aiRepo').value=c.repo||''; $('aiCustom').value=c.custom||''; $('aiUse').checked=!!c.useCustom; $('aiCustom').disabled=!c.useCustom; };
  const keep=()=>{ c=PK.pkAiCfg(); c.provider=$('aiProv').value; c.keys[c.provider]=$('aiKey').value.trim(); c.models[c.provider]=$('aiModel').value.trim(); c.base=$('aiBase').value.trim(); c.repo=$('aiRepo').value.trim()||PK.PKAI_DEF.repo; c.custom=$('aiCustom').value; c.useCustom=$('aiUse').checked; PK.pkAiSave(c); $('aiCustom').disabled=!c.useCustom; };
  $('aiProv').onchange=()=>{ const prev=PK.pkAiCfg(); const nxt=$('aiProv').value; PK.pkAiSave({...prev,provider:nxt}); paint(); };
  for(const id of ['aiKey','aiModel','aiBase','aiRepo','aiCustom','aiUse']) $(id).addEventListener('change',keep);
  $('aiModelsBtn').onclick=async()=>{ keep(); const n=$('aiModelsNote'); n.textContent='…'; try{ const l=await PK.pkAiModels(PK.pkAiCfg()); $('aiModelList').innerHTML=l.map(x=>`<option value="${PK.esc(x)}">`).join(''); n.textContent=PK.pktp('m.ai_models_n',l.length===1,l.length); }catch(e){ n.textContent=PK.pkt('m.ai_err',e.message); } };
  $('aiClear').onclick=()=>{ const cc=PK.pkAiCfg(); cc.keys={anthropic:'',openai:'',compat:''}; PK.pkAiSave(cc); paint(); PK.status(PK.pkt('m.ai_keys_cleared')); };
  paint(); })();

{ const d=PK.pkAiDef(); d._builtin=true; PK.Host.registry.set(PK.Host.key(d.id,d.version),d); PK.paintLib(); }
// ===== song-panel =====
const songPanel=PK.$('songPanel'), songBtn=PK.$('songBtn'); PK.songPanel=songPanel; PK.songBtn=songBtn;
songBtn.onclick=e=>{ e.stopPropagation(); PK.openSongs(); };
PK.$('songSearch').addEventListener('input',PK.songPaint);
PK.$('songSave').onclick=()=>PK.songExportDialog();   // opslaan als song, ook vanaf de tab Songs
PK.$('songRefresh').onclick=()=>{ PK.SONG_DEMO=null; PK.songPaint(); PK.songDemoLoad(true); };
PK.$('songFileBtn').onclick=()=>{ PK.$('songFile').value=''; PK.$('songFile').click(); };
PK.$('songFile').addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return; await PK.songOpenFile(f); });
{ const a=PK.$('songAddr'); if(a){ a.value=PK.songAddr(); a.onchange=()=>{ const v=a.value.trim(); try{ if(v&&v!==PK.SONG_ADDR_DEF) localStorage.setItem(PK.SONG_ADDR_KEY,v); else localStorage.removeItem(PK.SONG_ADDR_KEY); }catch(e){} a.value=PK.songAddr(); PK.SONG_DEMO=null; }; }
  const r=PK.$('songAddrReset'); if(r) r.onclick=()=>{ try{ localStorage.removeItem(PK.SONG_ADDR_KEY); }catch(e){} PK.$('songAddr').value=PK.SONG_ADDR_DEF; PK.SONG_DEMO=null; }; }
PK.IDB.get('songs:recent').then(v=>{ PK.SONGREC=Array.isArray(v)?v.filter(x=>x&&x.key&&x.title).slice(0,PK.SONGREC_MAX):[]; if(!songPanel.hidden) PK.songPaint(); });
// ===== bibliotheektabs =====
PK.LIBREADY=true; PK.libSync();   // alle panelen bestaan: teken de tab die vorige keer open stond
// ===== file-drop =====
PK.initFileDrop();
})(window.__PK);
