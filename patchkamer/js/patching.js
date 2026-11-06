// js/patching.js — koppelen en ontkoppelen, bundels en multi-MIDI, poortposities, SVG-hulpfuncties
(function(PK){
// ---------- bundels (contract v1.5) ----------
function bundleOf(r,port){ const b=r&&r.inst&&r.inst.bundles&&r.inst.bundles[port]; if(!b) return null; try{ return typeof b==='function'?b():b; }catch(e){ console.warn('bundles.'+port,r.def.name,e); return null; } } PK.bundleOf=bundleOf;
// ---------- multi-MIDI (contract v1.13): veel sporen met namen in één kabel; de gebeurtenissen dragen `track` ----------
function eventBundleOf(r,port){ const b=r&&r.inst&&r.inst.eventBundles&&r.inst.eventBundles[port]; if(!b) return null; try{ return typeof b==='function'?b():b; }catch(e){ console.warn('eventBundles.'+port,r.def.name,e); return null; } } PK.eventBundleOf=eventBundleOf;
function eventBundleKey(c){ return c.from.id+':'+c.from.port; } PK.eventBundleKey=eventBundleKey;
function deliverEventBundle(c){ const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); if(!a||!b||typeof b.inst.onEventBundle!=='function') return;
  const raw=eventBundleOf(a,c.from.port); if(!raw) return;
  const same=[...PK.Host.devices.values()].filter(r=>r.def.id===a.def.id).length>1, src=(a.def.name)+(same?' '+c.from.id.slice(1):'');
  const bundle={key:eventBundleKey(c),source:{id:c.from.id,port:c.from.port,name:src},label:String(raw.label||src),
    tracks:(raw.tracks||[]).filter(x=>x&&x.id!=null).map(x=>({id:String(x.id),name:String(x.name!=null?x.name:x.id),ch:Number.isFinite(+x.ch)?PK.clamp(Math.round(+x.ch),1,16):0}))};
  try{ b.inst.onEventBundle(c.to.port,bundle.key,bundle); }catch(e){ console.warn('onEventBundle()',b.def.name,e); } } PK.deliverEventBundle=deliverEventBundle;
function bundleKey(c){ return c.from.id+':'+c.from.port; }
function deliverBundle(c){ const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); if(!a||!b||typeof b.inst.onBundle!=='function') return;
  const raw=bundleOf(a,c.from.port); if(!raw) return;
  const same=[...PK.Host.devices.values()].filter(r=>r.def.id===a.def.id).length>1;
  const src=(a.def.name)+(same?' '+c.from.id.slice(1):'');
  const bundle={key:bundleKey(c),source:{id:c.from.id,port:c.from.port,name:src},label:raw.label||src,
    channels:(raw.channels||[]).filter(x=>x&&x.node).map(x=>({id:String(x.id),name:String(x.name!=null?x.name:x.id),node:x.node}))};
  try{ b.inst.onBundle(c.to.port,bundle.key,bundle); }catch(e){ console.warn('onBundle()',b.def.name,e); } } PK.deliverBundle=deliverBundle;
function unpatch(c){
  const i=PK.Host.cables.indexOf(c); if(i<0) return; PK.Host.cables.splice(i,1);
  if(c.kind==='audio'){ const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); try{ a.inst.outputs[c.from.port].disconnect(b.inst.inputs[c.to.port]); }catch(e){} }
  if(c.kind==='multi'){ const b=PK.Host.devices.get(c.to.id); if(b&&typeof b.inst.onBundle==='function'){ try{ b.inst.onBundle(c.to.port,bundleKey(c),null); }catch(e){ console.warn('onBundle()',b.def.name,e); } } }
  if(c.kind==='mod'){ const still=PK.Host.cables.some(x=>x.kind==='mod'&&x.from.id===c.from.id&&x.to.id===c.to.id); const m=PK.Host._modOff.get(c.to.id); if(m&&!still){ m.delete(c.from.id); PK.modApply(c.to.id); }
    if(!still) PK.Host._dropModSig(v=>v.sid===c.from.id&&v.tid===c.to.id); PK.modNotify(c.from.id,c.to.id); }
  if(c.kind==='multievent'){ const b=PK.Host.devices.get(c.to.id); if(b&&typeof b.inst.onEventBundle==='function'){ try{ b.inst.onEventBundle(c.to.port,eventBundleKey(c),null); }catch(e){ console.warn('onEventBundle()',b.def.name,e); } } }
  if(c.kind==='mastering') PK.masteringNotify(c.from.id);
  PK.drawCables(); PK.peersChanged();
} PK.unpatch=unpatch;
function portPos(id,port,dir){ const r=PK.Host.devices.get(id); if(!r) return null; const el=r.el.querySelector(`.port[data-port="${port}"][data-dir="${dir}"] .dot`); if(!el) return null; const fr=PK.floor.getBoundingClientRect(), b=el.getBoundingClientRect(), k=PK.Host.view.scale;
  if(r.mini){ const ib=r.iconEl.getBoundingClientRect(), kd=el.closest('.port').dataset.kind; return {x:((dir==='out'?ib.right:ib.left)-fr.left)/k,y:(ib.top-fr.top+ib.height*(kd==='event'?0.62:kd==='mod'?0.84:kd==='multi'?0.5:kd==='mastering'?0.7:kd==='multievent'?0.62:0.38))/k}; }
  // de stip kan buiten beeld zijn: in een scrollend deel van de kaart (vaste hoogte, interne scroll) of verborgen.
  // Dan hangt de kabel aan de rand van het zichtbare deel, met een open rondje als teken.
  let cx=b.left+b.width/2, cy=b.top+b.height/2, clipped=false; const cb=r.el.getBoundingClientRect();
  if(!b.width&&!b.height){ const sr=r.skPortsMode&&r.portsEl&&r.portsEl.getBoundingClientRect(); if(sr&&sr.width){ cx=dir==='out'?sr.right-8:sr.left+8; cy=sr.top+sr.height/2; } else { cx=dir==='out'?cb.right:cb.left; cy=cb.top+Math.min(cb.height/2,40); } clipped=true; }   // verborgen poort (poortenmodus van een skin): de kabel hangt aan de poortenstrook
  else { let L=cb.left,T=cb.top,R=cb.right,B=cb.bottom;
    for(const a of clipAncestors(el,r.el)){ const q=a.getBoundingClientRect(); L=Math.max(L,q.left); T=Math.max(T,q.top); R=Math.min(R,q.right); B=Math.min(B,q.bottom); }
    if(R>L&&B>T){ const nx=PK.clamp(cx,L,R), ny=PK.clamp(cy,T,B); if(nx!==cx||ny!==cy){ clipped=true; cx=nx; cy=ny; } } }
  return {x:(cx-fr.left)/k,y:(cy-fr.top)/k,clipped}; } PK.portPos=portPos;
function clipAncestors(el,stop){ if(!PK._clipCache) PK._clipCache=new WeakMap(); let c=PK._clipCache.get(el); if(c&&c.ok&&c.ok===el.isConnected) return c.list; const list=[];
  for(let a=el.parentElement||el.getRootNode()?.host; a&&a!==stop; a=a.parentElement||(a.getRootNode&&a.getRootNode().host)){ const cs=getComputedStyle(a); if(/(auto|scroll|hidden|clip)/.test(cs.overflow+cs.overflowX+cs.overflowY)) list.push(a); }
  const ui=stop.querySelector(':scope > .body > .ui'); if(ui&&ui.contains(el)&&!list.includes(ui)) list.push(ui);
  PK._clipCache.set(el,{ok:true,list}); return list; }
function paintFloorEmpty(){ const fe=document.getElementById('floorEmpty'); if(fe) fe.hidden=PK.Host.devices.size>0; } PK.paintFloorEmpty=paintFloorEmpty;
function cableLabel(c){ const a=PK.Host.devices.get(c.from.id), b=PK.Host.devices.get(c.to.id); const pn=(r,port,dir)=>{ const L=r?['audio','event','mod','multi','mastering','multievent'].flatMap(k=>PK.portList(r.ports,dir,k)):[]; const p=L.find(x=>x.id===port); return p?p.name:port; };
  return `${a?a.def.name:c.from.id} · ${pn(a,c.from.port,'out')}  →  ${b?b.def.name:c.to.id} · ${pn(b,c.to.port,'in')}`; } PK.cableLabel=cableLabel;
function bez(p1,p2){ const dx=Math.max(40,Math.abs(p2.x-p1.x)*0.5); return [p1,{x:p1.x+dx,y:p1.y},{x:p2.x-dx,y:p2.y},p2]; } PK.bez=bez;
function bezAt(P,t){ const u=1-t; return {x:u*u*u*P[0].x+3*u*u*t*P[1].x+3*u*t*t*P[2].x+t*t*t*P[3].x, y:u*u*u*P[0].y+3*u*u*t*P[1].y+3*u*t*t*P[2].y+t*t*t*P[3].y}; }
// sturing: een sinuslijn die de kabelbocht volgt (golflengte 18, amplitude 3.5, rustig aan de uiteinden)
function wavePath(P){ const N=160, raw=[]; for(let i=0;i<=N;i++) raw.push(bezAt(P,i/N)); return wavePts(raw); } PK.wavePath=wavePath;
function wavePts(raw){ const pts=[]; let len=0, prev=null; for(const q of raw){ if(prev) len+=Math.hypot(q.x-prev.x,q.y-prev.y); pts.push({x:q.x,y:q.y,s:len}); prev=q; }
  const A=3.5, lam=18, n=Math.max(24,Math.min(900,Math.round(len/3))); let d='', j=0;
  for(let i=0;i<=n;i++){ const s=len*i/n; while(j<pts.length-2&&pts[j+1].s<s) j++; const a=pts[j], b=pts[j+1], f=b.s>a.s?(s-a.s)/(b.s-a.s):0;
    const x=a.x+(b.x-a.x)*f, y=a.y+(b.y-a.y)*f, tl=Math.hypot(b.x-a.x,b.y-a.y)||1, nx=-(b.y-a.y)/tl, ny=(b.x-a.x)/tl, taper=Math.min(1,s/14,(len-s)/14), o=A*taper*Math.sin(2*Math.PI*s/lam);
    d+=(i?'L':'M')+(x+nx*o).toFixed(1)+','+(y+ny*o).toFixed(1); }
  return d; } PK.wavePts=wavePts;
function svgEl(tag,attrs,parent){ const e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; } PK.svgEl=svgEl;
})(window.__PK);
