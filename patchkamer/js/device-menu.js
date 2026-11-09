// js/device-menu.js — menu achter het icoontje op de kaartbalk: apparaat kopiëren en plakken (ook in een andere werkruimte), skin kiezen
(function(PK){
/* =====================================================================
   APPARAAT-KLEMBORD · formaat `patchkamer-apparaat`
   Eén apparaat met zijn state, grootte, preset en skin. Het zit in het geheugen van de pagina en in de kleine IndexedDB-opslag
   (sleutel `deviceClip`), dus het overleeft het wisselen van werkruimte en een herstart. Kabels gaan niet mee. Plakken maakt
   altijd een nieuw apparaat met een nieuw id; de state gaat door setState zoals bij het openen van een werkruimte.
   Het gaat NIET via het systeemklembord: dat is van het klembord voor patronen en clips (clip.js).
   ===================================================================== */
const KEY='deviceClip', MAXB=2000000;
let mem=null, MENU=null;
const clone=o=>JSON.parse(JSON.stringify(o));
function pack(id){ const r=PK.Host.devices.get(id); if(!r) return null;
  let state={}; try{ state=r.inst.getState?clone(r.inst.getState()||{}):{}; }catch(e){ console.warn('getState()',r.def.name,e); return null; }
  const o={format:'patchkamer-apparaat',formatVersion:1,def:r.def.id,version:r.def.version,name:r.def.name,state};
  if(r.w) o.w=r.w; if(r.h) o.h=r.h; if(r.mini) o.mini=true;
  if(r.preset&&!PK.presetDirty(r)) o.preset={lid:r.preset.lid,pid:r.preset.pid,name:r.preset.name};
  const sk=PK.skinState(r); if(sk) o.skin=sk;
  return JSON.stringify(o).length>MAXB?null:o; }
function copyDevice(id){ const o=pack(id); if(!o){ PK.status(PK.pkt('m.dm_kopie_mislukt'),true); return false; }
  mem=o; PK.IDB.set(KEY,o); PK.status(PK.pkt('m.dm_gekopieerd',o.name)); return true; }
// geheugen aanvullen vanuit de opslag (na een herstart); alleen een geldig, klein object
async function load(){ if(mem) return mem; const o=await PK.IDB.get(KEY); if(o&&o.format==='patchkamer-apparaat'&&typeof o.def==='string'&&o.state&&typeof o.state==='object'&&JSON.stringify(o).length<=MAXB) mem=o; return mem; }
// op (x,y) in vloercoördinaten, of in het midden van wat je ziet
async function pasteDevice(at){ const o=await load(); if(!o){ PK.status(PK.pkt('m.dm_niets_gekopieerd'),true); return null; }
  let ver=o.version; if(!PK.Host.registry.has(PK.Host.key(o.def,ver))){ const l=PK.Host.latest(o.def); if(!l){ PK.status(PK.pkt('m.dm_niet_geladen',o.name||o.def),true); return null; } ver=l.version; }
  const A=PK.viewArea(), w=Math.max(200,+o.w||300), x=at?at.x:A.cx-w/2, y=at?at.y:A.cy-120;
  const nid=PK.addDevice(o.def,Math.round(x),Math.round(y),clone(o.state),undefined,ver); if(!nid) return null;
  if(o.w||o.h) PK.setSize(nid,o.w||undefined,o.h||undefined); if(o.mini) PK.setMini(nid,true);
  if(o.preset) PK.presetMark(nid,o.preset); if(o.skin) PK.skinRestore(nid,o.skin);
  PK.afterAdd(nid); return nid; }
PK.deviceCopy=copyDevice; PK.devicePaste=pasteDevice;

function close(focusBack){ const m=MENU; if(!m) return; MENU=null;
  document.removeEventListener('pointerdown',m._out,true); document.removeEventListener('keydown',m._key,true); document.removeEventListener('focusin',m._fin,true); window.removeEventListener('resize',m._res);
  const r=m._id&&PK.Host.devices.get(m._id); if(r&&r.skEl&&r.pbarEl) r.pbarEl.appendChild(r.skEl);   // de skinkeuze gaat terug naar de kaart
  if(m._btn){ m._btn.setAttribute('aria-expanded','false'); if(focusBack) m._btn.focus(); }
  m.remove(); }
// 'Over {apparaat}': de uitleg van het apparaat (`about` in de definitie, contract v1.33) in een venstertje; alinea's gescheiden door een lege regel
function about(def){ const t=PK.aboutOf(def); if(!t) return; document.querySelectorAll('.pkmodal.aboutdlg').forEach(x=>x.remove());
  const m=document.createElement('div'); m.className='pkmodal aboutdlg'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
  const box=document.createElement('div'); box.className='box'; const h=document.createElement('h3'); h.textContent=PK.pkt('m.dm_over',def.name); box.appendChild(h);
  const body=document.createElement('div'); body.className='aboutbody'; t.split(/\n\s*\n/).forEach(p=>{ const e=document.createElement('p'); e.textContent=p.trim(); body.appendChild(e); }); box.appendChild(body);
  const row=document.createElement('div'); row.className='wsrow'; const b=document.createElement('button'); b.type='button'; b.className='small'; b.textContent=PK.pkt('m.sluiten_knop'); row.appendChild(b); box.appendChild(row); m.appendChild(box);
  const done=()=>m.remove(); b.onclick=done; m.addEventListener('click',e=>{ if(e.target===m) done(); }); m.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Escape') done(); });
  document.body.appendChild(m); b.focus(); } PK.deviceAbout=about;
// id: het apparaat waarvan het icoon is aangeklikt (null = lege vloer); anchor: element of punt {left,top,right,bottom}
async function open(id,anchor,btn,floorAt){
  const was=MENU&&MENU._btn===btn&&MENU._id===id&&btn; close(false); if(was) return;
  const r=id&&PK.Host.devices.get(id); await load();
  const m=document.createElement('div'); m.className='dmenu'; m.setAttribute('role','menu'); m._id=id; m._btn=btn;
  const item=(txt,hint,fn,dis,title)=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('role','menuitem'); const t=document.createElement('span'); t.textContent=txt; b.appendChild(t);
    if(hint){ const k=document.createElement('kbd'); k.textContent=hint; b.appendChild(k); } if(dis){ b.disabled=true; } if(title) b.title=title; b.onclick=e=>{ e.stopPropagation(); close(false); fn(); }; m.appendChild(b); return b; };
  if(r){ const ttl=document.createElement('div'); ttl.className='ttl'; ttl.textContent=r.def.name; m.appendChild(ttl);
    if(PK.aboutOf(r.def)) item(PK.pkt('m.dm_over',r.def.name),'',()=>about(r.def));
    if(PK.manualOpen) item(PK.pkt('m.dm_handleiding'),'',()=>PK.manualOpen(r.def));
    item(PK.pkt('m.dm_kopieer'),r.inst&&typeof r.inst.clipInfo==='function'?'⇧Ctrl C':'Ctrl C',()=>{ PK.select(id); copyDevice(id); }); }
  item(PK.pkt('m.dm_plak'),'Ctrl V',()=>{ pasteDevice(floorAt||null); },!mem,mem?PK.pkt('m.dm_plak_titel',mem.name):PK.pkt('m.dm_niets_gekopieerd'));
  if(!r&&floorAt&&PK.secCreate){ item(PK.pkt('m.sc_maken'),'',()=>PK.secCreate(floorAt)); item(PK.pkt('m.jp_maken'),'',()=>PK.jumpCreate(floorAt)); }
  if(r&&r.skEl&&!r.skEl.hidden){ const h=document.createElement('div'); h.className='sec'; h.textContent=PK.pkt('m.sk_skin'); m.appendChild(h); m.appendChild(r.skEl); }
  document.body.appendChild(m);
  const b=anchor.getBoundingClientRect?anchor.getBoundingClientRect():anchor, W=m.offsetWidth, H=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(b.left,innerWidth-W-8))+'px'; const below=b.bottom+4; m.style.top=Math.max(8,Math.min(below+H>innerHeight-8?b.top-H-4:below,innerHeight-H-8))+'px';
  m._out=e=>{ if(m.contains(e.target)||(btn&&btn.contains(e.target))) return; close(false); };
  m._key=e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(true); return; }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ if(document.activeElement&&document.activeElement.tagName==='SELECT') return; const f=[...m.querySelectorAll('button:not([disabled]),select:not([disabled])')]; if(!f.length) return; e.preventDefault(); const i=f.indexOf(document.activeElement); f[(i+(e.key==='ArrowDown'?1:-1)+f.length)%f.length].focus(); } };
  m._fin=e=>{ if(!m.contains(e.target)&&!(btn&&btn.contains(e.target))) close(false); }; m._res=()=>close(false);
  document.addEventListener('pointerdown',m._out,true); document.addEventListener('keydown',m._key,true); document.addEventListener('focusin',m._fin,true); window.addEventListener('resize',m._res);
  if(btn) btn.setAttribute('aria-expanded','true'); MENU=m;
  const first=m.querySelector('button:not([disabled])'); if(first) first.focus(); }

// het icoontje op de balk wordt een knop; gebeurtenissen die de balk laten slepen blijven eruit (zie device-cards.js)
function bind(id){ const r=PK.Host.devices.get(id); if(!r) return; const ic=r.el.querySelector('.bar .cicon'); if(!ic) return;
  ic.setAttribute('role','button'); ic.tabIndex=0; ic.setAttribute('aria-haspopup','menu'); ic.setAttribute('aria-expanded','false'); ic.setAttribute('aria-label',PK.pkt('m.dm_menu',r.def.name)); ic.title=PK.pkt('m.dm_menu_titel'); ic.classList.add('dmbtn');
  ic.addEventListener('click',e=>{ e.stopPropagation(); PK.select(id); open(id,ic,ic); });
  ic.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); PK.select(id); open(id,ic,ic); } }); }
PK.deviceMenuBind=bind;

function init(){
  // rechtsklik op de lege vloer: alleen Plak, op die plek
  let rd=null; PK.floorwrap.addEventListener('pointerdown',e=>{ rd={x:e.clientX,y:e.clientY}; },true);   // rechts slepen verschuift het canvas: dan geen menu bij loslaten
  PK.floorwrap.addEventListener('contextmenu',e=>{ const path=e.composedPath(); if(path.some(n=>n&&n.nodeType===1&&(n.classList.contains('card')||PK.isFormEl(n)))) return;
    e.preventDefault(); const show=(x,y)=>open(null,{left:x,top:y,right:x,bottom:y},null,PK.floorPoint(x,y));
    // Windows geeft de contextmenu-gebeurtenis bij loslaten, Linux en Mac al bij indrukken: dan wachten we op het loslaten, en bij slepen (canvas verschuiven) geen menu
    if(e.buttons&2){ const x=e.clientX, y=e.clientY, up=ev=>{ document.removeEventListener('pointerup',up,true); if(Math.hypot(ev.clientX-x,ev.clientY-y)<=5) show(ev.clientX,ev.clientY); }; document.addEventListener('pointerup',up,true); return; }
    if(rd&&Math.hypot(e.clientX-rd.x,e.clientY-rd.y)>5) return; show(e.clientX,e.clientY); });
  // Ctrl/Cmd+C en +V op het gekozen apparaat. Heeft het apparaat een eigen klembord voor patronen en clips (clip.js), dan blijft
  // gewoon Ctrl+C/V daarvoor; het apparaat zelf kopieer je dan met Shift+Ctrl+C en plak je met het menu of op een apparaat zonder clips.
  document.addEventListener('keydown',e=>{ if(!(e.ctrlKey||e.metaKey)||e.altKey||PK.textEntry(e)||document.querySelector('.pkmodal')) return; const k=(e.key||'').toLowerCase(); if(k!=='c'&&k!=='v') return;
    const id=PK.selected, r=id&&PK.Host.devices.get(id), inf=r&&PK.clipInfoOf?(()=>{ try{ return PK.clipInfoOf(id); }catch(x){ return null; } })():null,
      canCopyClip=!!(inf&&Array.isArray(inf.copy)&&inf.copy.length), canPasteClip=!!(inf&&Array.isArray(inf.paste)&&inf.paste.length);
    if(k==='c'){ if(!r||(canCopyClip&&!e.shiftKey)) return;
      const sel=window.getSelection&&window.getSelection(); if(sel&&!sel.isCollapsed){ try{ sel.removeAllRanges(); }catch(x){} }   // een achtergebleven tekstselectie (bijvoorbeeld na het slepen van een kaart) houdt het kopiëren van het apparaat niet tegen
      e.preventDefault(); copyDevice(id); return; }
    if(canPasteClip) return;   // patroon plakken (en Shift: direct) is van clip.js
    if(mem){ e.preventDefault(); pasteDevice(null); } else load().then(o=>{ if(o) pasteDevice(null); }); });
  // een klik op een kaart kiest het apparaat, ook als een regelaar erin de klik zelf afhandelt (anders blijft het vorige apparaat gekozen en kopieer je dat)
  document.addEventListener('pointerdown',e=>{ if(e.button!==0&&e.button!==2) return; const c=e.target&&e.target.closest&&e.target.closest('.card'); if(!c||!c.dataset||!PK.Host.devices.has(c.dataset.id)||PK.selected===c.dataset.id) return; PK.select(c.dataset.id); },true);
}
PK.deviceMenuInit=init;
})(window.__PK);
