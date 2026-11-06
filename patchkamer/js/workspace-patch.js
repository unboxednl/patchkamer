// js/workspace-patch.js — werkruimtetoestand opslaan en laden (patchState, loadPatch)
(function(PK){
/* =====================================================================
   PATCH SAVE / LOAD
   ===================================================================== */
function patchState(){ const ents=[...PK.Host.devices.entries()], lc={};
  ents.forEach(([id,r])=>{ const c=PK.layCompactFor(id,r); if(c) lc[id]={x:c.x,y:c.y,w:c.w,h:c.h,...(c.mini?{mini:true}:{})}; });
  const vw=(PK.LAY.cls==='wide'||!PK.LAY.cam.wide)?PK.Host.view:PK.LAY.cam.wide;   // de gewone velden zijn altijd de brede indeling
  return {v:2,bpm:PK.Host.bpm,swing:PK.Host.swing,view:{...vw,scale:vw.scale/PK.PKS.f,rel:1},devices:ents.map(([id,r])=>{ const W=PK.layWideFor(id,r); return {id,def:r.def.id,version:r.def.version,x:W.x,y:W.y,w:W.w,h:W.h,mini:W.mini||undefined,focus:r.focus||undefined,preset:r.preset&&!PK.presetDirty(r)?{lid:r.preset.lid,pid:r.preset.pid,name:r.preset.name}:undefined,state:r.inst.getState?r.inst.getState():{}}; }),cables:PK.Host.cables.map(c=>({from:c.from,to:c.to,kind:c.kind,...(c.color?{color:c.color}:{})})),
    ...(PK.Host.views.length?{views:PK.Host.views.map(v=>({name:v.name,x:v.x,y:v.y,scale:v.scale}))}:{}),...(Object.keys(lc).length?{layouts:{compact:lc}}:{})}; } PK.patchState=patchState;
function clearFloor(){ PK.closeFocus(); [...PK.Host.devices.keys()].forEach(PK.removeDevice); PK.Host.cables=[]; PK.Host.views=[]; PK.LAY.sets={wide:{},compact:{}}; PK.LAY.cam.wide=null; PK.LAY.cls=PK.layoutTarget(); PK.drawCables(); } PK.clearFloor=clearFloor;
function loadPatch(p){ clearFloor(); PK.Host.bpm=p.bpm||126; PK.$('bpm').value=PK.Host.bpm; PK.Host.swing=p.swing??0.08; PK.$('swing').value=PK.Host.swing;
  if(p.view){PK.Host.view={x:+p.view.x||0,y:+p.view.y||0,scale:(+p.view.scale||1)*PK.PKS.f}; PK.applyView();}
  PK.Host.views=PK.viewsClean(p.views);
  const missing=[], fallback=[]; p.devices.forEach(d=>{ let ver=d.version; if(ver&&!PK.Host.registry.has(PK.Host.key(d.def,ver))){ const l=PK.Host.latest(d.def); if(l){fallback.push(`${l.name} v${ver}→v${l.version}`); ver=l.version;} } if(!PK.Host.latest(d.def)){missing.push(d.def); return;} const nid=PK.addDevice(d.def,d.x,d.y,d.state,d.id,ver); if(nid&&(d.w||d.h)) PK.setSize(nid, d.w||undefined, d.h||undefined); if(nid&&d.mini) PK.setMini(nid,true); if(nid&&d.focus) PK.setFocus(nid,true,+d.focus); if(nid&&d.preset) PK.presetMark(nid,d.preset); });
  PK.layoutLoad(p);
  if(fallback.length) PK.status(PK.pkt('m.versie_niet_aanwezig_nieuwste_gebruikt')+fallback.join(', '));
  // rAF staat stil in een tab op de achtergrond: dan zouden de kabels (en dus het geluid) ontbreken; een timer vangt dat op
  let cabled=false; const cableUp=()=>{ if(cabled) return; cabled=true; p.cables.forEach(c=>{ if(PK.Host.devices.has(c.from.id)&&PK.Host.devices.has(c.to.id)) PK.patch({from:c.from,to:c.to,kind:c.kind,...(typeof c.color==='string'&&/^#[0-9a-f]{3,8}$/i.test(c.color)?{color:c.color}:{})}); }); PK.drawCables(); setTimeout(PK.drawCables,250); setTimeout(PK.drawCables,1200); };
  requestAnimationFrame(cableUp); setTimeout(cableUp,300);
  setTimeout(()=>{ if(PK.Host.devices.size&&PK.Host.ctx){ PK.pkResumeCtx(); if(PK.Host.ctx.state!=='running') PK.status(PK.pkt('m.audio_staat_uit'),true); } },700);
  if(missing.length) PK.status(PK.pkt('m.ontbrekende_instrumenten_laad_ze_eerst')+[...new Set(missing)].join(', '),true); } PK.loadPatch=loadPatch;
})(window.__PK);
