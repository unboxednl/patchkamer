// js/device-group.js — een groep apparaten, kabels en canvas-secties kopiëren en plakken (formaat `patchkamer-apparaten`)
(function(PK){
/* =====================================================================
   GROEPSKLEMBORD · formaat `patchkamer-apparaten`, formatVersion 1
   {format, formatVersion, w, h, items:[pack()+{x,y}], cables:[{from:{i,port},to:{i,port},kind,color?}], sections:[{name,color,alpha,line,fs,n,x,y,w,h,min,members:[i]}]}
   Elk item is wat device-menu.js pack() voor één apparaat maakt (definitie, versie, state, grootte, preset, skin) met zijn plek ten opzichte van de linkerbovenhoek van de groep.
   Een gekozen sectie neemt al zijn leden mee; een apparaat dat los én als lid gekozen is, komt één keer mee. Kabels gaan alleen mee als beide uiteinden in de groep zitten.
   Het klembord is hetzelfde als dat van één apparaat (device-menu.js: geheugen + IndexedDB `deviceClip`), dus het werkt ook tussen werkruimtes en na herladen.
   Plakken is alles of niets: ontbreekt een definitie, is een limiet bereikt of lukt een apparaat niet, dan blijft de werkruimte zoals ze was.
   ===================================================================== */
const H=PK.Host, FORMAT='patchkamer-apparaten', MAXN=64, MAXC=512, MAXG=8000000, GAP=24, STEP=40, RING=50, UNDO_MS=20000;
const num=(v,lo,hi,d)=>{ v=+v; return isFinite(v)?Math.min(hi,Math.max(lo,v)):d; };
let undo=null, undoT=0;
PK.groupFormat=FORMAT;
const devSize=r=>({w:r.el.offsetWidth||+r.w||300,h:r.el.offsetHeight||+r.h||200});

function copy(sel){
  sel=sel||PK.selection(); const ids=new Set(sel.ids); sel.secs.forEach(s=>PK.secMembers(s).forEach(i=>ids.add(i)));
  const list=[...ids].filter(i=>H.devices.has(i)&&!H.devices.get(i).pvw);
  if(list.length>MAXN){ PK.status(PK.pkt('m.dg_te_veel',list.length,MAXN),true); return false; }
  if(!list.length&&!sel.secs.length){ PK.status(PK.pkt('m.dg_niets_gekozen'),true); return false; }
  const items=[], at=new Map();
  for(const id of list){ const o=PK.devicePack(id); if(!o){ PK.status(PK.pkt('m.dg_kopie_mislukt',H.devices.get(id).def.name),true); return false; } at.set(id,items.length); items.push(o); }
  // plek ten opzichte van de linkerbovenhoek van alles wat meegaat (kaarten en secties, met de titel die half boven een sectie staat)
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; const ext=(a,b,c,d)=>{ x0=Math.min(x0,a); y0=Math.min(y0,b); x1=Math.max(x1,c); y1=Math.max(y1,d); };
  list.forEach(id=>{ const r=H.devices.get(id), z=devSize(r); ext(r.x,r.y,r.x+z.w,r.y+z.h); });
  sel.secs.forEach(s=>ext(s.x,s.y-Math.round(s.fs*0.75),s.x+s.w,s.y+s.h));
  list.forEach(id=>{ const r=H.devices.get(id), o=items[at.get(id)]; o.x=Math.round(r.x-x0); o.y=Math.round(r.y-y0); });
  const cables=H.cables.filter(c=>at.has(c.from.id)&&at.has(c.to.id)).map(c=>({from:{i:at.get(c.from.id),port:c.from.port},to:{i:at.get(c.to.id),port:c.to.port},kind:c.kind,...(c.color?{color:c.color}:{})}));
  if(cables.length>MAXC){ PK.status(PK.pkt('m.dg_te_veel_kabels',cables.length,MAXC),true); return false; }
  const sections=sel.secs.map(s=>({name:s.name,color:s.color,alpha:s.alpha,line:s.line,fs:s.fs,...(s.n?{n:s.n}:{}),x:Math.round(s.x-x0),y:Math.round(s.y-y0),w:s.w,h:s.h,...(s.min?{min:true}:{}),members:PK.secMembers(s).filter(i=>at.has(i)).map(i=>at.get(i))}));
  const o={format:FORMAT,formatVersion:1,w:Math.round(x1-x0),h:Math.round(y1-y0),items,cables,sections}, size=JSON.stringify(o).length;
  if(size>MAXG){ PK.status(PK.pkt('m.dg_te_groot',(size/1e6).toFixed(1),(MAXG/1e6).toFixed(0)),true); return false; }
  PK.deviceClipSet(o); PK.status(PK.pkt('m.dg_gekopieerd',items.length,cables.length,sections.length)); return true; }

// een klembord uit de opslag mag niets kapotmaken: alleen geldige vormen en getallen
function valid(o){ return !!o&&o.format===FORMAT&&Array.isArray(o.items)&&Array.isArray(o.cables)&&Array.isArray(o.sections)&&o.items.length<=MAXN&&o.cables.length<=MAXC&&o.sections.length<=40
  &&o.items.every(it=>it&&typeof it.def==='string'&&it.state&&typeof it.state==='object'&&isFinite(+it.x)&&isFinite(+it.y))&&JSON.stringify(o).length<=MAXG; } PK.groupValid=valid;

const hit=(a,b)=>a.x0-GAP<b.x1&&b.x0<a.x1+GAP&&a.y0-GAP<b.y1&&b.y0<a.y1+GAP;
// de dichtstbijzijnde verschuiving (in stappen) waarbij de groep niets raakt; null als er geen is
function freeOffset(mine,fixedDev,mySecs,fixedSecs){
  const bb=a=>a.reduce((u,r)=>({x0:Math.min(u.x0,r.x0),y0:Math.min(u.y0,r.y0),x1:Math.max(u.x1,r.x1),y1:Math.max(u.y1,r.y1)}),{x0:1e9,y0:1e9,x1:-1e9,y1:-1e9}), U=bb(mine.concat(mySecs));
  const shifted=(r,dx,dy)=>({x0:r.x0+dx,y0:r.y0+dy,x1:r.x1+dx,y1:r.y1+dy});
  const ok=(dx,dy)=>{ const u=shifted(U,dx,dy); if(!fixedDev.some(f=>hit(u,f))&&!fixedSecs.some(f=>hit(u,f))) return true;
    return !mine.some(m=>{ const a=shifted(m,dx,dy); return fixedDev.some(f=>hit(a,f)); })&&!mySecs.some(m=>{ const a=shifted(m,dx,dy); return fixedDev.some(f=>hit(a,f))||fixedSecs.some(f=>hit(a,f)); }); };
  if(ok(0,0)) return {dx:0,dy:0};
  const pts=[]; for(let i=-RING;i<=RING;i++) for(let j=-RING;j<=RING;j++) pts.push([i,j]); pts.sort((a,b)=>(a[0]*a[0]+a[1]*a[1])-(b[0]*b[0]+b[1]*b[1]));
  for(const [i,j] of pts){ if(ok(i*STEP,j*STEP)) return {dx:i*STEP,dy:j*STEP}; } return null; }

function paste(o,at){
  if(!valid(o)){ PK.status(PK.pkt('m.dg_ongeldig'),true); return null; }
  // 1. alles vooraf controleren, zodat er nooit een halve plak ontstaat
  const vers=[], missing=new Set();
  for(const it of o.items){ let v=it.version; if(!H.registry.has(H.key(it.def,v))){ const l=H.latest(it.def); if(!l){ missing.add(it.name||it.def); v=null; } else v=l.version; } vers.push(v); }
  if(missing.size){ PK.status(PK.pkt('m.dg_niet_geladen',[...missing].join(', ')),true); return null; }
  const lim=PK.secLimits?PK.secLimits():{n:0,max:0,wide:false}; let secs=o.sections, note='';
  if(secs.length&&!lim.wide){ secs=[]; note=PK.pkt('m.dg_geen_secties'); }
  if(secs.length&&lim.n+secs.length>lim.max){ PK.status(PK.pkt('m.dg_te_veel_secties',lim.n,secs.length,lim.max),true); return null; }
  // 2. de toestand van vóór het plakken, voor Ongedaan
  const before={pos:[...H.devices.entries()].map(([k,r])=>({k,x:r.x,y:r.y})), secs:PK.secSnapshot?PK.secSnapshot():[]};
  const fixedDev=[...H.devices.values()].filter(r=>!r.pvw&&r.el.offsetWidth>0).map(r=>({x0:r.x,y0:r.y,x1:r.x+r.el.offsetWidth,y1:r.y+r.el.offsetHeight}));
  const fixedSecs=PK.secBoxes?PK.secBoxes():[];
  // 3. de apparaten, eerst op een voorlopige plek zodat hun echte afmeting bekend is
  if(!at&&PK.mouseOnFloor) at=PK.mouseOnFloor();   // Ctrl+V: het midden van de groep op de muis, anders in het midden van wat je ziet
  const A=PK.viewArea(), cx=at?at.x:A.cx, cy=at?at.y:A.cy, ox=Math.round(cx-o.w/2), oy=Math.round(cy-o.h/2), made=[];
  const undoAll=()=>{ made.forEach(id=>PK.removeDevice(id)); };
  let failed=null;
  for(let i=0;i<o.items.length&&!failed;i++){ const it=o.items[i];
    const nid=PK.addDevice(it.def,Math.round(ox+num(it.x,-1e6,1e6,0)),Math.round(oy+num(it.y,-1e6,1e6,0)),JSON.parse(JSON.stringify(it.state)),undefined,vers[i]);
    if(!nid){ failed=it.name||it.def; break; } made.push(nid);
    if(it.w||it.h) PK.setSize(nid,it.w||undefined,it.h||undefined); if(it.mini) PK.setMini(nid,true); if(it.preset) PK.presetMark(nid,it.preset); if(it.skin) PK.skinRestore(nid,it.skin); }
  if(failed){ undoAll(); PK.status(PK.pkt('m.dg_plak_mislukt',failed),true); return null; }
  // 4. een plek zonder overlap, zo dicht mogelijk bij het gewenste midden
  const rects=made.map(id=>{ const r=H.devices.get(id), z=devSize(r); return {x0:r.x,y0:r.y,x1:r.x+z.w,y1:r.y+z.h}; });
  const secRects=secs.map(s=>({x0:ox+num(s.x,-1e6,1e6,0),y0:oy+num(s.y,-1e6,1e6,0)-Math.round(num(s.fs,16,96,32)*0.75),x1:ox+num(s.x,-1e6,1e6,0)+num(s.w,180,20000,560),y1:oy+num(s.y,-1e6,1e6,0)+num(s.h,110,20000,380)}));
  const off=freeOffset(rects,fixedDev,secRects,fixedSecs); if(!off){ note=(note?note+' ':'')+PK.pkt('m.dg_geen_plek'); }
  const dx=off?off.dx:0, dy=off?off.dy:0;
  made.forEach(id=>{ const r=H.devices.get(id); PK.pkMoveTo(r,r.x+dx,r.y+dy); });
  // 5. secties met hun nieuwe leden
  const newSecs=[]; secs.forEach(s=>{ const members=(Array.isArray(s.members)?s.members:[]).map(i=>made[i]).filter(Boolean), ns=PK.secPaste(s,members,ox+dx,oy+dy); if(ns) newSecs.push(ns); });
  // 6. kabels, alleen tussen de nieuwe apparaten
  let cabled=0, lost=0; o.cables.forEach(c=>{ const a=made[c.from&&c.from.i], b=made[c.to&&c.to.i]; if(!a||!b||typeof c.from.port!=='string'||typeof c.to.port!=='string') { lost++; return; }
    const before=H.cables.length; PK.patch({from:{id:a,port:c.from.port},to:{id:b,port:c.to.port},kind:c.kind,...(typeof c.color==='string'&&/^#[0-9a-f]{3,8}$/i.test(c.color)?{color:c.color}:{})}); if(H.cables.length>before) cabled++; else lost++; });
  // 7. losse apparaten kunnen bij een sectie eronder horen; alles naar voren; het geplakte geheel is de selectie
  const inNew=new Set(); newSecs.forEach(s=>s.members.forEach(i=>inNew.add(i))); made.forEach(id=>{ if(!inNew.has(id)&&PK.secDrop) PK.secDrop(id); });
  made.forEach(id=>{ const r=H.devices.get(id); if(r&&PK.toFront) PK.toFront(r); r.el.classList.remove('fresh'); void r.el.offsetWidth; r.el.classList.add('fresh'); setTimeout(()=>r.el.classList.remove('fresh'),1700); });
  PK.mselSet(made,newSecs,true); PK.drawCables(); requestAnimationFrame(()=>PK.drawCables()); if(PK.wslSave) PK.wslSave();
  undo={made:made.slice(),secs:newSecs,before}; clearTimeout(undoT); undoT=setTimeout(()=>{ undo=null; },UNDO_MS);
  const msg=PK.pkt('m.dg_geplakt',made.length,cabled,newSecs.length)+(lost?PK.pkt('m.dg_kabels_kwijt',lost):'')+(note?' · '+note:'');
  PK.toastAction(msg,[{label:PK.pkt('m.clip_ongedaan'),fn:()=>undoPaste()}],{ms:UNDO_MS,err:!!lost||!off});
  return made; } PK.groupPaste=paste;

function undoPaste(){ const u=undo; if(!u) return false; undo=null; clearTimeout(undoT);
  u.secs.forEach(s=>PK.secRemove(s)); u.made.forEach(id=>{ if(H.devices.has(id)) PK.removeDevice(id); });
  u.before.pos.forEach(p=>{ const r=H.devices.get(p.k); if(r) PK.pkMoveTo(r,p.x,p.y); }); if(PK.secRestore) PK.secRestore(u.before.secs);
  PK.mselSet([],[],true); PK.drawCables(); if(PK.wslSave) PK.wslSave(); PK.status(PK.pkt('m.dg_ongedaan')); return true; }
PK.groupUndo=undoPaste;

function init(){
  document.addEventListener('keydown',e=>{ if(!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey||(e.key||'').toLowerCase()!=='z'||!undo||PK.textEntry(e)||document.querySelector('.pkmodal')) return;
    e.preventDefault(); e.stopImmediatePropagation(); undoPaste(); },true);
}
PK.groupInit=init;
PK.groupCopy=copy;
})(window.__PK);
