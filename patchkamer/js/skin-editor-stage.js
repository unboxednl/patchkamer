// js/skin-editor-stage.js — skin-editor: het voorbeeldvlak (echte kaart van het apparaat buiten de werkruimte, breedte- en schermsimulatie, selecteren en slepen op het voorbeeld)
(function(PK){
/* =====================================================================
   SKIN-EDITOR · VOORBEELD. De voorbeeldinstantie is een gewone kaart (PK.addDevice met vaste id 'pvw1', vlag `pvw`), meteen uit #floor verhuisd naar het voorbeeldvlak: zelfde code als op de werkruimte, geen nagemaakte tekening.
   Ze staat in Host.devices (andere hostcode zoekt kaarten daar), maar patchState, skinsEmbed en Host.peers slaan een kaart met `pvw` over: niets komt in de werkruimte, een song of de buren. Sluiten = removeDevice.
   Skin live toepassen = PK.SK.draft + PK.skinSet (js/skins.js); schermklasse per kaart via `r.skScr`. Standen: Ontwerp (een laag `.se-shield` vangt de aanwijzer; selecteren en slepen) en Test (de laag is uit, het apparaat is bedienbaar; geen kabel dus geen geluid).
   Selecteren: geen DOM-gok op labels maar het register (PK.regEntries, data-pk-id, PK.METERS) en de panelen (data-pk-pn).
   ===================================================================== */
const M=PK.skm, F=PK.ske_f, el=F.el, T=()=>PK.ske_tree;
let E=null, ro=null, raf=0, zone=null;
const PID='pvw1';
const pkt=(...a)=>PK.pkt(...a);
const scrOf=w=>w<700?'phone':w<1100?'compact':'wide';
function create(dev){ destroy(); const before=PK.Host.devices.size; const id=PK.addDevice(dev,0,0,null,PID); if(!id) return null; const r=PK.Host.devices.get(PID); r.pvw=true; r.x=r.y=0;
  E.els.slot.appendChild(r.el); E.r=r; E.cardId=PID; ro=new ResizeObserver(()=>{ fit(); schedule(); }); ro.observe(r.el); ro.observe(E.els.view); return r; }
function destroy(){ if(ro){ ro.disconnect(); ro=null; } cancelAnimationFrame(raf); const r=PK.Host.devices.get(PID); PK.SK.draft=null; if(r){ r.skScr=null; try{ PK.skinSet(PID,'',''); }catch(e){} PK.removeDevice(PID); } E.r=null; E.cardId=null; if(E.els.slot) E.els.slot.innerHTML=''; }
// ---- breedte en scherm ----
function setWidth(w){ const r=E.r; if(!r) return; w=Math.max(200,Math.min(2000,Math.round(w))); E.view.w=w; PK.setSize(PID,w); r.skScr=E.view.scr==='auto'?scrOf(r.el.offsetWidth||w):E.view.scr; preview(); fit(); }
function fit(){ const r=E.r, v=E.els.view; if(!r||!v) return; const W=r.el.offsetWidth||E.view.w, k=Math.min(1,Math.max(0.2,(v.clientWidth-24)/W)); E.view.k=k; E.els.slot.style.transform='scale('+k+')'; E.els.slot.style.width=W+'px';
  E.els.fit.style.width=Math.ceil(W*k)+'px'; E.els.fit.style.height=Math.ceil((r.el.offsetHeight||100)*k)+'px'; const i=E.els.info; if(i) i.textContent=pkt('m.se_maat_info',r.el.offsetWidth,r.skCur||'-',r.skScr||scrOf(r.el.offsetWidth)); }
// ---- skin toepassen op het voorbeeld ----
function preview(){ const r=E.r; if(!r) return; try{ if(E.view.compare){ PK.skinSet(PID,'',''); } else { const file=M.build(E.m,true), sk=PK.skValidate(file,'preview',[]); PK.SK.draft={skin:sk,file:'',origin:'draft'}; if(!r.skHosts||!r.skHosts.length) PK.skinSet(PID,'','');   // zonder shadow root keert skSync bij een leeg ontwerp terug zonder het vorige weg te halen: eerst wegzetten
      const ap=E.view.auto?'auto':(E.sel.ap&&E.sel.ap!=='*'&&E.m.aps.some(a=>a.id===E.sel.ap)?E.sel.ap:(E.m.dflt||E.m.aps[0].id)); r.skScr=E.view.scr==='auto'?scrOf(r.el.offsetWidth||E.view.w):E.view.scr; PK.skinSet(PID,sk.id,ap); } }catch(e){ E.say(e.message,true); }
  fit(); schedule(); setTimeout(schedule,160); setTimeout(()=>{ fit(); schedule(); },420); }
// ---- eenheden en panelen op het voorbeeld ----
function units(){ const r=E.r; if(!r) return []; const out=[]; PK.regEntries(r).forEach(e=>{ const d=PK.regDesc(e.el); if(!d) return; out.push({el:e.el,id:d.id,role:d.role,group:d.group}); });
  if(PK.METERS) PK.METERS.forEach(Mt=>{ if(Mt.dead||!Mt.el.isConnected||PK.cardOf(Mt.el)!==r) return; out.push({el:Mt.el,id:Mt.o.id||'',role:'meter',group:Mt.o.group||''}); });
  const seen=new Set(); return out.filter(u=>{ if(seen.has(u.el)) return false; seen.add(u.el); const b=u.el.getBoundingClientRect(); return b.width>0&&b.height>0; }); }
function panels(){ const r=E.r; if(!r) return []; const roots=[PK.regUi(r),...PK.regRoots(PK.regUi(r))], out=[]; roots.forEach(rt=>rt.querySelectorAll('[data-pk-pn]').forEach(p=>{ const b=p.getBoundingClientRect(); if(b.width>0&&b.height>0) out.push({el:p,pid:p.getAttribute('data-pk-pn')}); })); return out; }
const inside=(b,x,y)=>x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom, area=b=>b.width*b.height;
function hit(x,y){ const us=units().map(u=>({u,b:u.el.getBoundingClientRect()})).filter(o=>inside(o.b,x,y)).sort((a,b)=>area(a.b)-area(b.b)); if(us.length){ const u=us[0].u; return {t:'unit',u}; }
  const ps=panels().map(p=>({p,b:p.el.getBoundingClientRect()})).filter(o=>inside(o.b,x,y)).sort((a,b)=>area(a.b)-area(b.b)); if(ps.length) return {t:'panel',pid:ps[0].p.pid};
  const cb=E.r.el.getBoundingClientRect(); return inside(cb,x,y)?{t:'card'}:null; }
// ---- selectiekader ----
function schedule(){ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; overlay(); }); }
function box(b){ const v=E.els.view, vb=v.getBoundingClientRect(); return {x:b.left-vb.left+v.scrollLeft,y:b.top-vb.top+v.scrollTop,w:b.width,h:b.height}; }
function overlay(){ const o=E.els.ovl; if(!o||!E.r) return; o.innerHTML=''; const s=E.sel; let b=null, name='';
  if(s.k==='ctl'){ const u=units().find(x=>x.id===s.id); if(u){ b=u.el.getBoundingClientRect(); name=s.id; } }
  else if(s.k==='panel'){ const p=panels().find(x=>x.pid===s.pid); if(p){ b=p.el.getBoundingClientRect(); name=s.pid; } }
  else if(s.k==='group'){ const us=units().filter(x=>x.group===s.g); if(us.length){ const bs=us.map(x=>x.el.getBoundingClientRect()); b={left:Math.min(...bs.map(z=>z.left)),top:Math.min(...bs.map(z=>z.top)),right:Math.max(...bs.map(z=>z.right)),bottom:Math.max(...bs.map(z=>z.bottom))}; b.width=b.right-b.left; b.height=b.bottom-b.top; name=s.g; } }
  else if(['ap','colors','ports','haptics','ctls','rest','skin','aps'].includes(s.k)){ b=E.r.el.getBoundingClientRect(); name=s.ap&&s.ap!=='*'?((E.m.aps.find(a=>a.id===s.ap)||{}).name||s.ap):pkt('m.se_voorbeeld'); }
  if(!b) return; const q=box(b), d=el('div','se-sel'); Object.assign(d.style,{left:q.x+'px',top:q.y+'px',width:q.w+'px',height:q.h+'px'}); const c=el('span','se-chip',name); if(q.y<24){ c.style.top='0'; c.style.left='0'; c.style.borderRadius='0 0 3px 0'; } d.appendChild(c); o.appendChild(d); }
// ---- selecteren en slepen op het voorbeeld ----
function target(what){ return (x,y)=>{ const cb=E.r.el.getBoundingClientRect(), zb=zone&&zone.getBoundingClientRect(); const nz=()=>({t:'newpanel',rect:zb?{x:zb.left,y:zb.top,w:zb.width,h:zb.height}:{x:cb.left,y:cb.bottom-4,w:cb.width,h:4},fill:true}); if(zb&&inside(zb,x,y)&&what.t==='ctl') return nz();
    const ps=panels().map(p=>({p,b:p.el.getBoundingClientRect()})).filter(o=>inside(o.b,x,y)).sort((a,b)=>area(a.b)-area(b.b));
    if(what.t==='panel'){ const o=ps.find(z=>z.p.pid!==what.pid); if(!o) return null; const b=o.b, side=b.width<E.r.el.getBoundingClientRect().width*0.75, after=side?x>b.left+b.width/2:y>b.top+b.height/2; return {t:'panelpos',pid:o.p.pid,after,rect:side?{x:after?b.right-2:b.left,y:b.top,w:2,h:b.height}:{x:b.left,y:after?b.bottom-2:b.top,w:b.width,h:2}}; }
    if(!ps.length) return inside(cb,x,y)?nz():null; const o=ps[0], lo=M.layoutOf(E.m,what.ap), pi=lo.panels.findIndex(z=>z.id===o.p.pid); if(pi<0) return {t:'rest',rect:{x:o.b.left,y:o.b.top,w:o.b.width,h:o.b.height},fill:true};
    const kids=[...o.p.el.querySelectorAll('.pk-pnl-b > *')].map(k=>({k,b:k.getBoundingClientRect(),id:k.getAttribute('data-pk-id')||(k.querySelector('[data-pk-id]')||{getAttribute:()=>''}).getAttribute('data-pk-id')})).filter(z=>z.id&&z.id!==what.id&&z.b.width>0);
    if(!kids.length) return {t:'in',pi,beforeId:null,rect:{x:o.b.left,y:o.b.top,w:o.b.width,h:o.b.height},fill:true};
    let best=null, bd=1e9; kids.forEach(z=>{ const d=inside(z.b,x,y)?0:Math.hypot(Math.max(z.b.left-x,0,x-z.b.right),Math.max(z.b.top-y,0,y-z.b.bottom)); if(d<bd){ bd=d; best=z; } });
    const b=best.b, before=y<b.top||(y<=b.bottom&&x<b.left+b.width/2); if(before) return {t:'in',pi,beforeId:best.id,rect:{x:b.left-1,y:b.top,w:2,h:b.height}};
    const nx=kids[kids.indexOf(best)+1]; return {t:'in',pi,beforeId:nx?nx.id:null,rect:{x:b.right-1,y:b.top,w:2,h:b.height}}; }; }
function down(ev){ if(ev.button>0||!E.r) return; ev.preventDefault(); const h=hit(ev.clientX,ev.clientY); if(!h) return; const ap=E.sel.ap||'*'; let sel, what=null;
  if(h.t==='unit'){ sel=h.u.id?{k:'ctl',ap,id:h.u.id}:{k:'ap',ap}; if(h.u.id) what={t:'ctl',id:h.u.id,ap,label:h.u.id}; }
  else if(h.t==='panel'){ const lo=M.layoutOf(E.m,ap); sel=lo.panels.some(p=>p.id===h.pid)?{k:'panel',ap,pid:h.pid}:{k:'rest',ap}; if(sel.k==='panel') what={t:'panel',pid:h.pid,ap,label:h.pid}; }
  else sel={k:'ap',ap};
  const click=()=>E.select(sel,{swallow:ev.pointerType==='touch'}); if(!what){ click(); return; } try{ ev.currentTarget.setPointerCapture(ev.pointerId); }catch(e){}
  T().drag(ev,what,target(what),{hold:ev.pointerType==='touch'?350:0,onStart:()=>{ zone.hidden=what.t!=='ctl'; E.els.view.classList.add('dragging'); },onEnd:()=>{ zone.hidden=true; E.els.view.classList.remove('dragging'); },drop:(w,t)=>T().apply(w,t),click}); }
function init(e){ E=e; zone=e.els.zone; e.els.shield.onpointerdown=down; }
PK.ske_stage={init,create,destroy,setWidth,fit,preview,schedule,units,panels};
})(window.__PK);
