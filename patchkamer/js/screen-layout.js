// js/screen-layout.js — schermindeling breed of compact, per werkruimte
(function(PK){
/* =====================================================================
   SCHERMINDELING · breed of compact, per werkruimte (patchState.layouts.compact)
   De apparaten zelf (r.x, r.y, r.w, r.h, r.mini) zijn altijd de indeling van de schermklasse die nu aan staat; de andere klasse staat
   in LAY.sets. Opslaan zet de brede indeling in de gewone velden en de compacte in layouts.compact.
   ===================================================================== */
const layRec=r=>({x:r.x,y:r.y,w:r.w,h:r.h,mini:!!r.mini});
function layCompactFor(id,r){ return PK.LAY.cls==='compact'?layRec(r):PK.LAY.sets.compact[id]||null; } PK.layCompactFor=layCompactFor;
function layWideFor(id,r){ return PK.LAY.cls==='wide'?layRec(r):(PK.LAY.sets.wide[id]||layRec(r)); } PK.layWideFor=layWideFor;
function layApplyRec(id,r,e){ if(!e) return; r.x=+e.x||0; r.y=+e.y||0; r.el.style.left=r.x+'px'; r.el.style.top=r.y+'px';
  PK.setSize(id,e.w==null?null:e.w,e.h==null?null:e.h); r.mini=!!e.mini; r.el.classList.toggle('mini',r.mini); }
function layoutSwitch(target,o){ o=o||{}; if(target===PK.LAY.cls||(target!=='wide'&&target!=='compact')) return false;
  const from=PK.LAY.cls; PK.LAY.sets[from]={}; PK.Host.devices.forEach((r,id)=>{ PK.LAY.sets[from][id]=layRec(r); });
  if(from==='wide') PK.LAY.cam.wide={...PK.Host.view};
  PK.Host.devices.forEach((r,id)=>{ r.el.classList.remove('moving'); layApplyRec(id,r,PK.LAY.sets[target][id]||PK.LAY.sets[from][id]); });
  PK.LAY.cls=target; PK.drawCables(); requestAnimationFrame(()=>PK.drawCables());
  if(target==='wide'&&PK.LAY.cam.wide&&!o.fit){ PK.Host.view={...PK.LAY.cam.wide}; PK.applyView(); }
  else if(o.fit!==false&&PK.Host.devices.size) setTimeout(()=>PK.$('zoomFit').click(),60);
  if(!o.silent) PK.status(PK.pkt('m.t_klasse_gewisseld',PK.pkt(target==='wide'?'m.t_klasse_wide':'m.t_klasse_compact')));
  layoutPaintSel(); return true; } PK.layoutSwitch=layoutSwitch;
function layoutSanitize(src){ const out={}; if(!src||typeof src!=='object') return out; for(const id of Object.keys(src)){ const e=src[id]; if(!e||typeof e!=='object'||!/^d\d+$/.test(id)) continue; const x=+e.x, y=+e.y; if(!isFinite(x)||!isFinite(y)) continue;
    const w=e.w==null?null:(isFinite(+e.w)?PK.clamp(Math.round(+e.w),200,6000):null), h=e.h==null?null:(isFinite(+e.h)?PK.clamp(Math.round(+e.h),120,20000):null);
    out[id]={x:PK.clamp(Math.round(x),-1e6,1e6),y:PK.clamp(Math.round(y),-1e6,1e6),w,h,mini:!!e.mini}; } return out; }
function layoutLoad(p){ PK.LAY.cls='wide'; PK.LAY.cam.wide=null; PK.LAY.sets={wide:{},compact:layoutSanitize(p.layouts&&p.layouts.compact)};
  const tg=PK.layoutTarget(); if(tg==='compact'){ const had=Object.keys(PK.LAY.sets.compact).length>0; layoutSwitch('compact',{silent:true,fit:true}); if(!had&&window.innerWidth<700) setTimeout(()=>PK.status(PK.pkt('m.t_tip_pas_aan')),900); } else layoutPaintSel(); } PK.layoutLoad=layoutLoad;
// signaalvolgorde: bronnen eerst, dan wat ze voeden; zonder kabels (of bij een lus) op positie
function layoutOrder(ids,pos){ const succ=new Map(ids.map(i=>[i,new Set()])), indeg=new Map(ids.map(i=>[i,0]));
  PK.Host.cables.forEach(c=>{ if(!succ.has(c.from.id)||!succ.has(c.to.id)||c.from.id===c.to.id||succ.get(c.from.id).has(c.to.id)) return; succ.get(c.from.id).add(c.to.id); indeg.set(c.to.id,indeg.get(c.to.id)+1); });
  const cmp=(a,b)=>(pos(a).x-pos(b).x)||(pos(a).y-pos(b).y), rest=new Set(ids), out=[];
  while(rest.size){ let ready=[...rest].filter(i=>indeg.get(i)===0).sort(cmp); const nxt=ready.length?ready[0]:[...rest].sort(cmp)[0];
    rest.delete(nxt); out.push(nxt); succ.get(nxt).forEach(s=>indeg.set(s,indeg.get(s)-1)); }
  return out; } PK.layoutOrder=layoutOrder;
function layoutFitScreen(){ if(!PK.Host.devices.size) return; PK.liteHold(1);
  if(PK.LAY.cls!=='compact'){ layoutSwitch('compact',{silent:true,fit:false}); }
  if(PK.LAY.mode!=='compact'){ PK.LAY.mode='compact'; try{ localStorage.setItem('patchkamer.layoutMode','compact'); }catch(e){} }
  const wr=PK.floorwrap.getBoundingClientRect(), W=wr.width, H=wr.height, M=24, G=28, ents=[...PK.Host.devices.entries()];
  const connected=new Set(); PK.Host.cables.forEach(c=>{ connected.add(c.from.id); connected.add(c.to.id); });
  const start=new Map(ents.map(([id,r])=>[id,{x:r.x,y:r.y}]));
  const cids=ents.map(([id])=>id).filter(id=>connected.has(id)), loose=ents.map(([id])=>id).filter(id=>!connected.has(id));
  const order=layoutOrder(cids,id=>start.get(id)); loose.sort((a,b)=>(start.get(a).x-start.get(b).x)||(start.get(a).y-start.get(b).y));
  // unieke breedte: de huidige breedte, nooit breder dan het scherm op schaal 1
  const full=[], icons=[];
  order.forEach(id=>{ const r=PK.Host.devices.get(id); const w=PK.clamp(Math.min(r.w??PK.defWidth(r.def),Math.max(200,W-2*M)),PK.minWidth(r.def),6000); PK.setSize(id,w,undefined); full.push(id); });
  loose.forEach(id=>{ const r=PK.Host.devices.get(id); r.mini=true; r.el.classList.add('mini'); icons.push(id); });
  const box=id=>{ const r=PK.Host.devices.get(id); return {w:r.el.offsetWidth||300,h:r.el.offsetHeight||200}; };
  const sim=cols=>{ const sizes=full.map(box), total=sizes.reduce((a,b)=>a+b.h+G,0), target=total/cols, cs=[[]], hs=[0];
    full.forEach((id,i)=>{ let c=cs.length-1; if(hs[c]>0&&hs[c]+sizes[i].h>target*1.02&&cs.length<cols){ cs.push([]); hs.push(0); c++; } cs[c].push(id); hs[c]+=sizes[i].h+G; });
    const cw=cs.map(c=>Math.max(...c.map(id=>box(id).w),0)), tw=cw.reduce((a,b)=>a+b,0)+(cs.length-1)*G+2*M;
    const per=Math.max(1,Math.floor((tw-2*M+G)/(124+G))), irows=icons.length?Math.ceil(icons.length/per):0, th=Math.max(...hs,0)+2*M+irows*(110+G);
    return {cs,cw,tw,th,per,irows,fit:Math.min(W/tw,H/th,1.5)}; };
  let best=null; if(full.length){ for(let c=1;c<=Math.min(6,full.length);c++){ const s=sim(c); if(!best||s.fit>best.fit*1.03) best=s; } }
  else best={cs:[],cw:[],tw:W,th:0,per:Math.max(1,Math.floor((W-2*M+G)/(124+G))),irows:0,fit:1};
  let x=M, bottom=M;
  best.cs.forEach((col,ci)=>{ let y=M; col.forEach(id=>{ const r=PK.Host.devices.get(id); r.el.classList.remove('moving'); PK.pkMoveTo(r,x,y); y+=box(id).h+G; }); bottom=Math.max(bottom,y); x+=best.cw[ci]+G; });
  let ix=M, iy=Math.max(bottom,M), n=0; icons.forEach(id=>{ const r=PK.Host.devices.get(id); r.el.classList.remove('moving'); PK.pkMoveTo(r,ix,iy); n++; ix+=124+G; if(n%best.per===0){ ix=M; iy+=110+G; } });
  PK.drawCables(); setTimeout(()=>{ PK.$('zoomFit').click(); PK.drawCables(); PK.liteHold(-1); },80);
  layoutPaintSel(); PK.status(PK.pkt('m.t_pas_aan_klaar',best.cs.length,icons.length)); } PK.layoutFitScreen=layoutFitScreen;
function layoutPaintSel(){ const s=PK.$('layoutSel'); if(s) s.value=PK.LAY.mode; } PK.layoutPaintSel=layoutPaintSel;
})(window.__PK);
