// js/cable-drag.js — kabel trekken, omhangen en een apparaat op een kabel leggen
(function(PK){
PK.wire=null;
function floorPoint(cx,cy){ const fr=PK.floor.getBoundingClientRect(), k=PK.Host.view.scale; return {x:(cx-fr.left)/k,y:(cy-fr.top)/k}; } PK.floorPoint=floorPoint;
function curve(p1,p2,fromOut){ const dx=Math.max(40,Math.abs(p2.x-p1.x)*0.5)*(fromOut?1:-1); return `M${p1.x},${p1.y} C${p1.x+dx},${p1.y} ${p2.x-dx},${p2.y} ${p2.x},${p2.y}`; }
function portInfo(elp){ const card=elp&&elp.closest('.card'); return card?{id:card.dataset.id,port:elp.dataset.port,dir:elp.dataset.dir,kind:elp.dataset.kind,el:elp}:null; } PK.portInfo=portInfo;
function compatible(a,b){ return b&&b.kind===a.kind&&b.dir!==a.dir&&b.id!==a.id; } PK.compatible=compatible;
function startWire(id,port,dir,kind,e){
  PK.armed=null; paintArmed();
  const src={id,port,dir,kind}; src.el=PK.Host.devices.get(id).el.querySelector(`.port[data-port="${port}"][data-dir="${dir}"]`);
  PK.wire={src,cx:e.clientX,cy:e.clientY,x0:e.clientX,y0:e.clientY,moved:false,hover:null,raf:0,touch:e.pointerType==='touch'};
  const path=document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('class',kind); PK.wireSvg.appendChild(path);
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle'); dot.setAttribute('r','4'); PK.wireSvg.appendChild(dot);
  PK.wire.path=path; PK.wire.dot=dot;
  document.body.classList.add('wiring'); src.el.classList.add('source');
  PK.floor.querySelectorAll('.port').forEach(pe=>{ const inf=portInfo(pe); const ok=compatible(src,inf); pe.classList.toggle('target',ok); pe.classList.toggle('dim',!ok&&pe!==src.el); });
  drawWire(); PK.wire.raf=requestAnimationFrame(edgePan);
} PK.startWire=startWire;
function drawWire(){
  if(!PK.wire) return; const a=PK.portPos(PK.wire.src.id,PK.wire.src.port,PK.wire.src.dir); if(!a) return;
  const b=PK.wire.hover?PK.portPos(PK.wire.hover.id,PK.wire.hover.port,PK.wire.hover.dir):floorPoint(PK.wire.cx,PK.wire.cy);
  const fromOut=PK.wire.src.dir==='out'; PK.wire.path.setAttribute('d',curve(a,b,fromOut));
  { const sid=fromOut?PK.wire.src.id:(PK.wire.hover?PK.wire.hover.id:null), col=(PK.wire.replace&&PK.wire.replace.color)||(sid?PK.cabSrcColor(sid):null); PK.wire.path.style.stroke=col||''; } PK.wire.path.classList.toggle('snap',!!PK.wire.hover);
  PK.wire.dot.setAttribute('cx',b.x); PK.wire.dot.setAttribute('cy',b.y); PK.wire.dot.style.display=PK.wire.hover?'none':'';
} PK.drawWire=drawWire;
function hoverAt(cx,cy){
  if(PK.skPortsWire) PK.skPortsWire(cx,cy);   // poortenmodus hover/strip van een skin: poorten openen onder de kabel
  const elp=document.elementFromPoint(cx,cy); const pe=elp&&elp.closest?elp.closest('.port'):null; const inf=portInfo(pe);
  let ok=compatible(PK.wire.src,inf)?inf:null; if(!ok&&PK.wire.touch) ok=PK.nearCompatiblePort(cx,cy);
  if(PK.wire.hover&&(!ok||ok.el!==PK.wire.hover.el)) PK.wire.hover.el.classList.remove('hover');
  if(ok) ok.el.classList.add('hover'); PK.wire.hover=ok;
} PK.hoverAt=hoverAt;
// keep the far end reachable: near the edge of the floor the view scrolls along
function edgePan(){
  if(!PK.wire) return; const r=PK.floorwrap.getBoundingClientRect(), m=48, sp=18; let dx=0, dy=0;
  if(PK.wire.moved){ if(PK.wire.cx<r.left+m) dx=sp; else if(PK.wire.cx>r.right-m) dx=-sp; if(PK.wire.cy<r.top+m) dy=sp; else if(PK.wire.cy>r.bottom-m) dy=-sp; }
  if(dx||dy){ PK.Host.view.x+=dx; PK.Host.view.y+=dy; PK.applyView(); hoverAt(PK.wire.cx,PK.wire.cy); drawWire(); }
  PK.wire.raf=requestAnimationFrame(edgePan);
}
function endWire(connect){
  if(!PK.wire) return; cancelAnimationFrame(PK.wire.raf);
  const w=PK.wire; PK.wire=null; let done=false;
  if(connect&&w.hover){ const out=w.src.dir==='out'?w.src:w.hover, inn=w.src.dir==='out'?w.hover:w.src, o=w.replace;
    const same=!!o&&o.from.id===out.id&&o.from.port===out.port&&o.to.id===inn.id&&o.to.port===inn.port;
    if(same) done=true;   // teruggebracht op dezelfde plek: niets verandert
    else { if(o) PK.unpatch(o);   // de oude kabel pas los als de nieuwe plek vaststaat
      const before=PK.Host.cables.length; patch({from:{id:out.id,port:out.port},to:{id:inn.id,port:inn.port},kind:w.src.kind,...(o&&o.color?{color:o.color}:{})});
      if(PK.Host.cables.length>before){ const a=PK.Host.devices.get(out.id).def.name, b=PK.Host.devices.get(inn.id).def.name; PK.status(PK.pkt('m.verbonden',a,out.port,b,inn.port)); } done=true; } }
  if(w.replace){ PK.lastRewire=performance.now(); if(!done) PK.status(PK.pkt('m.kabel_teruggezet')); PK.drawCables(); }
  while(PK.wireSvg.firstChild) PK.wireSvg.removeChild(PK.wireSvg.firstChild);
  document.body.classList.remove('wiring');
  PK.floor.querySelectorAll('.port').forEach(pe=>pe.classList.remove('target','dim','hover','source'));
  if(PK.skPortsWire) PK.skPortsWire(0,0);
} PK.endWire=endWire;
// ---------- een kabel aan één kant oppakken en omhangen ----------
// Slepen aan een kabel maakt de dichtstbijzijnde kant los; de andere kant blijft zitten. Loslaten op een passende poort hangt de kabel om,
// loslaten ergens anders (of Esc) zet hem terug. De oude kabel blijft tot dan gewoon aangesloten, dus het geluid loopt door.
PK.cgrab=null, PK.lastRewire=0, PK.dropCable=null;
function startRewire(g,e){ const c=g.c, p1=PK.portPos(c.from.id,c.from.port,'out'), p2=PK.portPos(c.to.id,c.to.port,'in'); if(!p1||!p2) return;
  const gp=floorPoint(g.x0,g.y0), takeFrom=Math.hypot(gp.x-p1.x,gp.y-p1.y)<=Math.hypot(gp.x-p2.x,gp.y-p2.y);   // de dichtstbijzijnde kant komt los
  const fixed=takeFrom?{id:c.to.id,port:c.to.port,dir:'in'}:{id:c.from.id,port:c.from.port,dir:'out'};
  startWire(fixed.id,fixed.port,fixed.dir,c.kind,e); PK.wire.replace=c; PK.wire.moved=true; PK.drawCables(); hoverAt(e.clientX,e.clientY); drawWire(); } PK.startRewire=startRewire;
// ---------- een apparaat op een kabel leggen: de kabel splitst en het apparaat hangt erin ----------
const insertPorts=(ports,kind)=>{ if(kind!=='audio'&&kind!=='event') return null; const i=PK.portList(ports,'in',kind)[0], o=PK.portList(ports,'out',kind)[0]; return i&&o?{i:i.id,o:o.id}:null; }; PK.insertPorts=insertPorts;
function cableSamples(path){ const d=path.getAttribute('d'); if(path._smp&&path._smpD===d) return path._smp; const L=path.getTotalLength(), n=Math.max(8,Math.ceil(L/10)), a=[];
  for(let i=0;i<=n;i++){ const q=path.getPointAtLength(L*i/n); a.push([q.x,q.y]); } path._smp=a; path._smpD=d; return a; }
// de kabel dichtbij een punt (vloercoördinaten) waar dit apparaat in past
function cableNearPoint(fp,tol,ports,nid){ let best=null, bd=Infinity;
  PK.svg.querySelectorAll('g.cable path.hit').forEach(h=>{ const c=h._cable; if(!c||c.from.id===nid||c.to.id===nid||!insertPorts(ports,c.kind)) return;
    for(const [x,y] of cableSamples(h)){ const d=Math.hypot(x-fp.x,y-fp.y); if(d<bd){ bd=d; best=c; } } });
  return bd<=tol?best:null; } PK.cableNearPoint=cableNearPoint;
// de kabel die door de kaart loopt, en het dichtst bij het midden ervan
function cableThroughRect(rc,ports,nid,fresh){ let best=null, bd=Infinity; const cx=rc.x+rc.w/2, cy=rc.y+rc.h/2;
  PK.svg.querySelectorAll('g.cable path.hit').forEach(h=>{ const c=h._cable; if(!c||c.from.id===nid||c.to.id===nid||!insertPorts(ports,c.kind)||!fresh(c.kind)) return;
    for(const [x,y] of cableSamples(h)){ if(x>rc.x+6&&x<rc.x+rc.w-6&&y>rc.y+6&&y<rc.y+rc.h-6){ const d=Math.hypot(x-cx,y-cy); if(d<bd){ bd=d; best=c; } } } });
  return best; } PK.cableThroughRect=cableThroughRect;
function setDrop(c){ if(PK.dropCable===c) return; PK.dropCable=c; PK.drawCables(); } PK.setDrop=setDrop;
const hasCable=(nid,kind)=>PK.Host.cables.some(c=>c.kind===kind&&(c.from.id===nid||c.to.id===nid)); PK.hasCable=hasCable;
function insertOnCable(nid,c){ const r=PK.Host.devices.get(nid), a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); if(!r||!a||!b||c.from.id===nid||c.to.id===nid) return false;
  const ip=insertPorts(r.ports,c.kind); if(!ip||!PK.Host.cables.includes(c)) return false;
  const col=c.color?{color:c.color}:{}, n0=PK.Host.cables.length;
  PK.unpatch(c);
  const c1={from:c.from,to:{id:nid,port:ip.i},kind:c.kind,...col}, c2={from:{id:nid,port:ip.o},to:c.to,kind:c.kind,...col};
  patch(c1); patch(c2);
  if(!PK.Host.cables.some(x=>x.from.id===c1.from.id&&x.from.port===c1.from.port&&x.to.id===nid&&x.to.port===c1.to.port)||!PK.Host.cables.some(x=>x.from.id===nid&&x.from.port===c2.from.port&&x.to.id===c.to.id&&x.to.port===c.to.port)){
    [c1,c2].forEach(n=>{ const f=PK.Host.cables.find(x=>x.from.id===n.from.id&&x.from.port===n.from.port&&x.to.id===n.to.id&&x.to.port===n.to.port); if(f) PK.unpatch(f); }); patch(c);   // terugdraaien: de oude kabel komt terug
    PK.status(PK.pkt('m.kabel_niet_gesplitst',r.def.name),true); return false; }
  PK.status(PK.pkt('m.in_kabel_gezet',r.def.name,a.def.name,b.def.name)); return true; } PK.insertOnCable=insertOnCable;
function portClick(id,port,dir,kind){
  if(!PK.armed){ PK.armed={id,port,dir,kind}; paintArmed(); return; }
  if(PK.armed.id===id&&PK.armed.port===port){ PK.armed=null; paintArmed(); return; }
  if(PK.armed.kind!==kind||PK.armed.dir===dir){ PK.armed={id,port,dir,kind}; paintArmed(); return; }
  const from=PK.armed.dir==='out'?PK.armed:{id,port}, to=PK.armed.dir==='out'?{id,port}:PK.armed;
  patch({from:{id:from.id,port:from.port},to:{id:to.id,port:to.port},kind}); PK.armed=null; paintArmed();
} PK.portClick=portClick;
function paintArmed(){ PK.floor.querySelectorAll('.port').forEach(p=>{const card=p.closest('.card'); const id=[...PK.Host.devices.entries()].find(([k,r])=>r.el===card)?.[0]; p.classList.toggle('armed',!!PK.armed&&PK.armed.id===id&&PK.armed.port===p.dataset.port&&PK.armed.dir===p.dataset.dir);}); } PK.paintArmed=paintArmed;
function patch(c){
  if(PK.Host.cables.some(x=>x.from.id===c.from.id&&x.from.port===c.from.port&&x.to.id===c.to.id&&x.to.port===c.to.port)) return;
  const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); if(!a||!b) return;
  if(c.kind==='audio'){ const o=a.inst.outputs&&a.inst.outputs[c.from.port], i=b.inst.inputs&&b.inst.inputs[c.to.port]; if(!o||!i){PK.status(PK.pkt('m.audiopoort_ontbreekt_in_instance'),true); return;} try{o.connect(i);}catch(e){PK.status(PK.pkt('m.connect_faalde')+e.message,true); return;} }
  if(c.kind==='multievent'){ if(!PK.eventBundleOf(a,c.from.port)){ PK.status(PK.pkt('m.multievent_poort_levert_niets')+c.from.port+PK.pkt('m.ontbreekt_haakje'),true); return; } if(typeof b.inst.onEventBundle!=='function'){ PK.status(b.def.name+PK.pkt('m.kan_geen_multievent_ontvangen'),true); return; } }
  if(c.kind==='mastering'&&typeof b.inst.configureMastering!=='function'){ PK.status(b.def.name+PK.pkt('m.kan_geen_mastering_ontvangen'),true); return; }
  if(c.kind==='multi'){ if(!PK.bundleOf(a,c.from.port)){ PK.status(PK.pkt('m.bundelpoort_levert_geen_bundel_bundles')+c.from.port+PK.pkt('m.ontbreekt_haakje'),true); return; } if(typeof b.inst.onBundle!=='function'){ PK.status(b.def.name+PK.pkt('m.kan_geen_bundel_ontvangen_onbundle'),true); return; } }
  PK.Host.cables.push(c); PK.drawCables(); PK.peersChanged();
  if(c.kind==='mod') PK.modNotify(c.from.id,c.to.id);
  if(c.kind==='mastering') PK.masteringNotify(c.from.id);
  if(c.kind==='multi') PK.deliverBundle(c);
  if(c.kind==='multievent') PK.deliverEventBundle(c);
} PK.patch=patch;
})(window.__PK);
