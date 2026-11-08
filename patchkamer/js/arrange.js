// js/arrange.js — herschikken: bronnen, instrumenten, effecten, mengpaneel, uitgang
(function(PK){
const isOutputDef=d=>d.kind==='output'; PK.isOutputDef=isOutputDef;
const isMixerDef=d=>d.kind==='mixer'||/(^|\.)mixer$/.test(d.id); PK.isMixerDef=isMixerDef;
const isModDef=(r)=>r.def.kind==='modulator'||(r.ports.modOut.length>0&&!r.ports.audioOut.length&&!r.ports.eventOut.length); PK.isModDef=isModDef;
// één groep apparaten in kolommen leggen met de linkerbovenhoek op (X0,Y0); kabels naar apparaten buiten de groep tellen niet mee
function arrangeSet(ids,X0,Y0){ const R=PK.Host.devices, set=new Set(ids), cab=PK.Host.cables.filter(c=>set.has(c.from.id)&&set.has(c.to.id)&&c.from.id!==c.to.id);
  const isOut=id=>isOutputDef(R.get(id).def), isMix=id=>isMixerDef(R.get(id).def), isMod=id=>isModDef(R.get(id));
  const preds=new Map(ids.map(i=>[i,[]])), succ=new Map(ids.map(i=>[i,[]]));
  cab.forEach(c=>{ if(c.kind==='mod') return; if(isMix(c.from.id)||isOut(c.from.id)) return; preds.get(c.to.id).push(c.from.id); succ.get(c.from.id).push(c.to.id); });
  const connected=new Set(); cab.forEach(c=>{ connected.add(c.from.id); connected.add(c.to.id); });
  // terugvoer-effecten: alleen gevoed door het mengpaneel → in de kolom van het mengpaneel
  const fromMixOnly=new Set(ids.filter(i=>!isMix(i)&&!isOut(i)&&!preds.get(i).length&&cab.some(c=>c.to.id===i&&isMix(c.from.id))));
  const rank=new Map(), busy=new Set();
  const rk=i=>{ if(rank.has(i)) return rank.get(i); if(busy.has(i)) return 0; busy.add(i); let r=0; for(const p of preds.get(i)) if(!isMix(p)&&!isOut(p)&&!isMod(p)) r=Math.max(r,rk(p)+1); busy.delete(i); rank.set(i,r); return r; };
  const normal=ids.filter(i=>connected.has(i)&&!isOut(i)&&!isMix(i)&&!isMod(i)&&!fromMixOnly.has(i)); normal.forEach(rk);
  ids.filter(i=>connected.has(i)&&isMod(i)).forEach(i=>{ const t=cab.filter(c=>c.from.id===i).map(c=>c.to.id).filter(x=>rank.has(x)).map(x=>rank.get(x)); rank.set(i,t.length?Math.max(0,Math.min(...t)-1):0); });
  const M=Math.max(0,...[...rank.values()]), hasMix=ids.some(i=>isMix(i)&&connected.has(i));
  ids.forEach(i=>{ if(!connected.has(i)) return; if(isMix(i)||fromMixOnly.has(i)) rank.set(i,M+1); else if(isOut(i)) rank.set(i,M+(hasMix?2:1)); });
  const cols=[]; rank.forEach((r,i)=>{ (cols[r]=cols[r]||[]).push(i); });
  // volgorde in een kolom: naar het gemiddelde van de bronnen links (minder kruisende kabels); mengpaneel boven zijn terugvoer
  const order=new Map(); const box=i=>({w:R.get(i).el.offsetWidth,h:R.get(i).el.offsetHeight});
  cols.forEach((col,ci)=>{ if(!col) return; const key=i=>{ if(fromMixOnly.has(i)) return 1e6+R.get(i).y; if(isMod(i)) return 1e5;
      const ps=cab.filter(c=>c.to.id===i&&order.has(c.from.id)).map(c=>order.get(c.from.id)); return ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:R.get(i).y/1e4; };
    col.sort((a,b)=>(key(a)-key(b))||(R.get(a).y-R.get(b).y)); col.forEach((i,k)=>order.set(i,k)); });
  // modulatoren krijgen een volgorde na hun doel: nog een ronde voor kolommen met modulatoren
  cols.forEach(col=>{ if(!col||!col.some(isMod)) return; const key=i=>{ if(isMod(i)) return 1e5; return order.get(i); }; col.sort((a,b)=>key(a)-key(b)); col.forEach((i,k)=>order.set(i,k)); });
  // plaatsen: elke kolom van boven naar beneden; een apparaat zakt naar de hoogte van zijn bron (ketens vormen rijen).
  // Een kolom die hoger wordt dan MAXH gaat verder in een volgende subkolom.
  const CG=110, RG=50, MAXH=Math.max(1800,...ids.map(i=>box(i).h+200)); let x=X0, bottom=Y0; const placedY=new Map();
  cols.forEach(col=>{ if(!col||!col.length) return;
    const want=i=>{ if(isMix(i)) return Y0; const ps=cab.filter(c=>c.to.id===i&&placedY.has(c.from.id)&&c.kind!=='mod').map(c=>placedY.get(c.from.id));
      if(isMod(i)){ const t=cab.filter(c=>c.from.id===i&&placedY.has(c.to.id)).map(c=>placedY.get(c.to.id)); return t.length?Math.min(...t):Y0; }
      return ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:Y0; };
    let cy=Y0, w=0;
    col.forEach(i=>{ const r=R.get(i), b=box(i); let y=Math.max(cy,want(i)); if(y+b.h>Y0+MAXH&&cy>Y0){ x+=w+CG*0.6; w=0; cy=Y0; y=Math.max(Y0,Math.min(want(i),Y0+MAXH-b.h)); }
      r.el.classList.add('moving'); PK.pkMoveTo(r,x,y); placedY.set(i,y); cy=y+b.h+RG; w=Math.max(w,b.w); bottom=Math.max(bottom,cy); });
    x+=w+CG; });
  // losse apparaten (zonder kabels): een rij onderaan
  let lx=X0; const ly=bottom+80; ids.filter(i=>!connected.has(i)).sort((a,b)=>R.get(a).x-R.get(b).x).forEach(i=>{ const r=R.get(i); r.el.classList.add('moving'); PK.pkMoveTo(r,lx,ly); lx+=box(i).w+60; });
  return {cols:cols.filter(Boolean).length,loose:ids.filter(i=>!connected.has(i)).length}; }
function arrangeDevices(){ PK.liteHold(1);
  PK.closeFocus(); const R=PK.Host.devices; if(!R.size) return;
  if(PK.secUnhide) PK.secUnhide();   // de leden van een geminimaliseerde sectie zijn verborgen en dus 0 groot: even tonen om te meten
  const all=[...R.keys()], prev=new Map(all.map(i=>[i,{x:R.get(i).x,y:R.get(i).y}])), secPrev=PK.secSnapshot?PK.secSnapshot():[];
  // secties: elke sectie is een eigen groep die binnen zijn eigen vlak wordt ingedeeld; het vlak krijgt daarna precies de maat van zijn groep.
  // Wat bij geen sectie hoort, staat bovenaan; de secties daaronder, in de volgorde waarin ze nu staan.
  const groups=PK.secGroups?PK.secGroups():[], inSec=new Set(); groups.forEach(g=>g.ids.forEach(i=>inSec.add(i)));
  const rest=all.filter(i=>!inSec.has(i)); let cols=0, loose=0, Y=40;
  const run=(ids,X0,Y0)=>{ const o=arrangeSet(ids,X0,Y0); cols+=o.cols; loose+=o.loose; let r=0,b=0; ids.forEach(i=>{ const d=R.get(i); r=Math.max(r,d.x+d.el.offsetWidth); b=Math.max(b,d.y+d.el.offsetHeight); }); return {r,b}; };
  if(rest.length){ const e=run(rest,40,Y); Y=e.b+120; }
  groups.forEach(g=>{ if(!g.ids.length) return; const o=PK.secOrigin(g.s), X0=40+o.x, Y0=Y+o.y, e=run(g.ids,X0,Y0); PK.secPlace(g.s,X0,Y0,e.r-X0,e.b-Y0); Y=g.s.y+g.s.h+120; });
  PK._lastLayout=prev; PK._lastSec=secPrev; PK._alUndo=null;
  const t0=performance.now(); const tick=()=>{ PK.drawCables(); if(performance.now()-t0<450) requestAnimationFrame(tick); else { R.forEach(r=>r.el.classList.remove('moving')); PK.drawCables(); PK.$('zoomFit').click(); PK.liteHold(-1); } }; requestAnimationFrame(tick);
  PK.status(PK.pkt('m.herschikt_in_kolommen',cols)+(loose?PK.pktp('m.losse_apparaaten_onderaan_los_apparaat',loose>1,loose):'')+PK.pkt('m.ctrl_z_zet_terug'));
} PK.arrangeDevices=arrangeDevices;
function undoArrange(){ if(!PK._lastLayout) return false; const L=PK._lastLayout; PK._lastLayout=null; if(PK._lastSec&&PK.secRestore){ PK.secRestore(PK._lastSec); PK._lastSec=null; } L.forEach((p,i)=>{ const r=PK.Host.devices.get(i); if(r){ r.el.classList.add('moving'); PK.pkMoveTo(r,p.x,p.y); } });
  const t0=performance.now(); const tick=()=>{ PK.drawCables(); if(performance.now()-t0<450) requestAnimationFrame(tick); else PK.Host.devices.forEach(r=>r.el.classList.remove('moving')); }; requestAnimationFrame(tick); PK.status(PK.pkt('m.oude_opstelling_teruggezet')); return true; } PK.undoArrange=undoArrange;
})(window.__PK);
