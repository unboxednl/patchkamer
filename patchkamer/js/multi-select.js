// js/multi-select.js — meerdere kaarten (en secties) tegelijk kiezen: Shift/Ctrl+klik, selectiekader, Escape, de groep samen slepen
(function(PK){
/* =====================================================================
   MULTI-SELECTIE · alleen een host-functie, geen contractwijziging
   Eén gekozen kaart blijft PK.selected (zoals altijd). Zodra er meer zijn (of een sectie erbij), is PK.selected null en staan de kaarten in MSEL
   (klasse .msel, zelfde markering als .sel); gekozen secties staan in Host.secsel (canvas-sections.js). Een gewone klik op een kaart, een nieuw apparaat
   of een ander PK.select() maakt de groep weer los (hook mselOnSelect in device-cards.js).
   Kiezen: Shift- of Ctrl/Cmd-klik op de titelbalk, het icoon of het deel van de kaart buiten de regelaars; Shift+slepen op de lege vloer (of op het vlak van een
   sectie) trekt een kader (met Ctrl erbij: aanvullen); Shift/Ctrl-klik op de titel van een sectie. Aanraking: menu "Selecteer meer", dan tikken. Escape of klikken op de
   lege vloer wist de groep. Sleep je een gekozen kaart, dan schuift de hele groep (gekozen secties met hun leden mee).
   Kopiëren en plakken van de groep staat in device-group.js.
   ===================================================================== */
const H=PK.Host, MSEL=new Set(); let KEEP=false, ADD=false, rb=null, gd=null;
const secs=()=>PK.secSelected?PK.secSelected():[];
function paint(){ H.devices.forEach((r,k)=>r.el.classList.toggle('msel',MSEL.has(k))); }
// wat er nu gekozen is, en of dat een groep is (meer dan één ding, of een sectie)
function selection(){ const ids=MSEL.size?[...MSEL]:(PK.selected&&H.devices.has(PK.selected)?[PK.selected]:[]), s=secs(); return {ids,secs:s,group:s.length>=1||ids.length>=2}; } PK.selection=selection;
function say(){ const ids=MSEL.size, sn=secs().length, txt=ids+sn>=2?(sn?PK.pkt('m.ms_n_sec',ids,sn):PK.pktp('m.ms_n',ids!==1,ids)):'';
  if(ADD){ PK.toastAction(PK.pkt('m.ms_modus')+(txt?' · '+txt:''),[{label:PK.pkt('m.ms_klaar'),fn:()=>addMode(false)}],{ms:0}); return; }
  if(txt) PK.status(txt); }
// zet de selectie naar precies deze kaarten en secties; één kaart zonder sectie is gewoon de enkele selectie
function setSel(ids,sl,quiet){ KEEP=true; try{
    MSEL.clear(); (ids||[]).forEach(i=>{ if(H.devices.has(i)) MSEL.add(i); });
    if(PK.selected) PK.select(null); else H.devices.forEach(r=>r.el.classList.remove('sel'));
    if(PK.secSelect) PK.secSelect(sl||[]);
    if(MSEL.size===1&&!(sl&&sl.length)){ const only=[...MSEL][0]; MSEL.clear(); PK.select(only); }
  } finally{ KEEP=false; } paint(); if(!quiet) say(); } PK.mselSet=setSel;
// de enkele selectie wordt het eerste lid van de groep (Shift-klik op een sectie terwijl een kaart gekozen is)
PK.mselFromSingle=()=>{ if(MSEL.size||!PK.selected) return; KEEP=true; try{ MSEL.add(PK.selected); PK.select(null); } finally{ KEEP=false; } paint(); };
// na een wijziging van de secties in de selectie: opruimen, markeren, melden
PK.mselChanged=()=>{ const keep=MSEL.size===1&&!secs().length?[...MSEL][0]:null; if(keep){ MSEL.clear(); KEEP=true; try{ PK.select(keep); } finally{ KEEP=false; } } paint(); say(); };
PK.mselClear=()=>{ if(!MSEL.size) return; MSEL.clear(); paint(); };
PK.mselHas=id=>MSEL.has(id);
PK.mselOnSelect=id=>{ if(KEEP) return; if(MSEL.size){ MSEL.clear(); paint(); } if(id&&PK.secSelect&&secs().length) PK.secSelect([]); };
PK.mselDrop=id=>{ if(MSEL.delete(id)){ paint(); } };
function toggle(id){ const cur=new Set(MSEL.size?MSEL:(PK.selected?[PK.selected]:[])); if(cur.has(id)) cur.delete(id); else cur.add(id); setSel([...cur],secs()); }
// aanraking: het menu "Selecteer meer" zet een stand aan waarin tikken een kaart toevoegt of weghaalt
function addMode(on,id){ ADD=!!on; document.body.classList.toggle('ms-add',ADD);
  if(ADD){ if(id&&!MSEL.has(id)&&PK.selected!==id) toggle(id); say(); }
  else PK.status(PK.pkt('m.ms_modus_uit')); } PK.mselAddMode=addMode; PK.mselAdding=()=>ADD;
function clearAll(){ ADD=false; document.body.classList.remove('ms-add'); setSel([],[],true); }

/* ---------- selectiekader ---------- */
function rbStart(e){ const add=e.ctrlKey||e.metaKey, base=add?selection():{ids:[],secs:[]}, el=document.createElement('div'); el.className='rubber'; document.body.appendChild(el);
  rb={x:e.clientX,y:e.clientY,add,base:new Set(base.ids),bs:base.secs,el,id:e.pointerId,moved:false}; try{ PK.floorwrap.setPointerCapture(e.pointerId); }catch(x){} }
function rbMove(e){ if(!rb||e.pointerId!==rb.id) return; const x0=Math.min(rb.x,e.clientX), y0=Math.min(rb.y,e.clientY), x1=Math.max(rb.x,e.clientX), y1=Math.max(rb.y,e.clientY);
  if(!rb.moved&&Math.hypot(e.clientX-rb.x,e.clientY-rb.y)<4) return; rb.moved=true; const s=rb.el.style; s.left=x0+'px'; s.top=y0+'px'; s.width=(x1-x0)+'px'; s.height=(y1-y0)+'px';
  const hit=new Set(rb.base); H.devices.forEach((r,k)=>{ if(r.pvw||r.el.classList.contains('secmin')) return; const b=r.el.getBoundingClientRect(); if(!b.width||!b.height) return; if(b.left<x1&&b.right>x0&&b.top<y1&&b.bottom>y0) hit.add(k); });
  setSel([...hit],rb.bs,true); }
function rbEnd(e){ if(!rb||(e&&e.pointerId!==rb.id)) return; const o=rb; rb=null; o.el.remove(); try{ PK.floorwrap.releasePointerCapture(o.id); }catch(x){}
  if(!o.moved){ if(!o.add) clearAll(); return; } say(); }

/* ---------- de groep samen slepen ---------- */
function gdStart(e,id,handle){ const s=secs(), inSec=new Set(); s.forEach(x=>PK.secMembers(x).forEach(i=>inSec.add(i)));
  const dev=[...MSEL].filter(i=>!inSec.has(i)).map(i=>H.devices.get(i)).filter(Boolean).map(r=>({r,x:r.x,y:r.y})), sec=s.map(x=>({s:x,x:x.x,y:x.y}));
  gd={id:e.pointerId,cx:e.clientX,cy:e.clientY,dev,sec,clicked:id,moved:false,handle}; try{ handle.setPointerCapture(e.pointerId); }catch(x){} }
function gdMove(e){ if(!gd||e.pointerId!==gd.id) return; const dx=(e.clientX-gd.cx)/H.view.scale, dy=(e.clientY-gd.cy)/H.view.scale; if(!gd.moved&&Math.hypot(dx,dy)<4/H.view.scale) return; gd.moved=true;
  gd.dev.forEach(m=>PK.pkMoveTo(m.r,m.x+dx,m.y+dy)); gd.sec.forEach(m=>PK.secOffset(m.s,Math.round(m.x+dx)-m.s.x,Math.round(m.y+dy)-m.s.y)); PK.drawCables(); }
function gdEnd(e){ if(!gd||e.pointerId!==gd.id) return; const g=gd; gd=null;
  if(!g.moved){ if(e.type==='pointerup') PK.select(g.clicked); return; }   // een klik zonder slepen kiest alleen deze kaart
  if(PK.secDrop) g.dev.forEach(m=>{ const k=m.r.el.dataset.id; if(H.devices.has(k)) PK.secDrop(k); }); if(PK.secSpread) PK.secSpread(g.sec.map(m=>m.s).filter(x=>H.secs.includes(x))); if(PK.wslSave) PK.wslSave(); }

function init(){
  document.addEventListener('pointerdown',e=>{
    if(e.button!==0||document.querySelector('.pkmodal')||(PK.FOCUS&&PK.FOCUS.open)) return;
    const path=e.composedPath?e.composedPath():[], el=path.find(n=>n&&n.nodeType===1&&n.classList.contains('card')), mod=e.shiftKey||e.ctrlKey||e.metaKey;
    if(el&&el.dataset&&H.devices.has(el.dataset.id)&&!el.classList.contains('infocus')){
      const id=el.dataset.id, inUi=path.some(n=>n&&n.nodeType===1&&n.classList.contains('ui')), ctl=path.some(n=>PK.isFormEl(n)||(n&&n.nodeType===1&&n.matches&&n.matches('button,.port,.rz,.dmbtn,select')));
      if((mod&&!inUi&&!ctl)||(ADD&&!(path.some(n=>n&&n.nodeType===1&&n.matches&&n.matches('.dmbtn,.bar button'))))){ e.stopImmediatePropagation(); e.preventDefault(); toggle(id); return; }
      // een kaart uit de groep slepen: de hele groep gaat mee
      if(!mod&&MSEL.has(id)&&!ctl&&!inUi&&path.some(n=>n&&n.nodeType===1&&(n.classList.contains('bar')||n.classList.contains('pkicon')))){
        const handle=path.find(n=>n&&n.nodeType===1&&(n.classList.contains('bar')||n.classList.contains('pkicon'))); e.stopImmediatePropagation(); e.stopPropagation(); gdStart(e,id,handle); }
      return; }
    // het selectiekader: Shift+slepen op de lege vloer of op het vlak van een sectie
    const t=path[0], empty=t&&(t===PK.floorwrap||t===PK.floor||t.tagName==='svg'||(t.classList&&t.classList.contains('sec')&&t===path.find(n=>n&&n.classList&&n.classList.contains('sec'))));
    if(empty&&e.shiftKey&&e.pointerType!=='touch'){ e.stopImmediatePropagation(); e.preventDefault(); rbStart(e); return; }
    // een klik (zonder slepen) op de lege vloer wist de groep
    if(empty&&!mod&&(MSEL.size||secs().length>1)&&!ADD&&t!==undefined&&!(t.classList&&t.classList.contains('sec'))){ const x=e.clientX, y=e.clientY, up=u=>{ document.removeEventListener('pointerup',up,true); if(Math.hypot(u.clientX-x,u.clientY-y)<4) clearAll(); }; document.addEventListener('pointerup',up,true); }
  },true);
  document.addEventListener('pointermove',e=>{ rbMove(e); gdMove(e); },true);
  document.addEventListener('pointerup',e=>{ rbEnd(e); gdEnd(e); },true); document.addEventListener('pointercancel',e=>{ rbEnd(e); gdEnd(e); },true);
  document.addEventListener('keydown',e=>{ if(e.key!=='Escape'||document.querySelector('.pkmodal')||PK.textEntry(e)) return; if(MSEL.size||secs().length>1||ADD) clearAll(); },true);
}
// de laatste plek van de muis op de vloer (voor het midden van een groep die je plakt met Ctrl+V)
let pt=null; PK.mouseOnFloor=()=>{ if(!pt||performance.now()-pt.t>60000) return null; const wr=PK.floorwrap.getBoundingClientRect(); if(pt.x<wr.left||pt.x>wr.right||pt.y<wr.top||pt.y>wr.bottom) return null; return PK.floorPoint(pt.x,pt.y); };
PK.multiInit=function(){ init(); document.addEventListener('pointermove',e=>{ if(e.pointerType!=='touch') pt={x:e.clientX,y:e.clientY,t:performance.now()}; },{capture:true,passive:true}); };
})(window.__PK);
