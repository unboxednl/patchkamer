// js/skin-editor-stage.js — skin-editor: de werkplek met twee delen naast elkaar (het originele apparaat en de nieuwe skin), breedte- en schermsimulatie, selecteren en slepen, kaartbreedte slepen, pijltjes bij een schermpje
(function(PK){
/* =====================================================================
   SKIN-EDITOR · WERKPLEK. Twee echte kaarten van het apparaat, buiten de werkruimte, naast elkaar: LINKS het origineel (`pvw0`, zonder skin, alleen om uit te slepen) en RECHTS de nieuwe skin (`pvw1`, live, met selectiekader).
   Beide zijn gewone kaarten (PK.addDevice met vaste id, vlag `pvw`), meteen uit #floor verhuisd naar hun vlak: zelfde code als op de werkruimte, geen nagemaakte tekening. Ze staan in Host.devices (andere hostcode zoekt kaarten daar),
   maar patchState, skinsEmbed en Host.peers slaan een kaart met `pvw` over: niets komt in de werkruimte, een song of de buren. Sluiten = removeDevice van beide.
   Skin live toepassen = PK.SK.draft + PK.skinSet (js/skins.js); schermklasse per kaart via `r.skScr`. Standen: Ontwerp (een laag `.se-shield` vangt de aanwijzer; selecteren en slepen) en Test (de laag van de nieuwe skin is uit, het apparaat is bedienbaar; geen kabel dus geen geluid).
   Selecteren: geen DOM-gok op labels maar het register (PK.regEntries, data-pk-id, PK.METERS), de panelen (data-pk-pn) en de schermpjes (PK.DSP). Slepen: uit het origineel of binnen de nieuwe skin naar een paneel, een regelaar, 'Nieuw paneel' of een rij in de boom (doelen: js/skin-editor-tree.js).
   Kaartbreedte: de greep aan de rechterrand en hoek van de nieuwe kaart (ook met pijltjestoetsen) zet de breedte van het voorbeeld en, bij een gekozen verschijning, `design.size.width` van die verschijning (200 tot 1600; in Auto alleen het voorbeeld).
   Schermpje: bij een geselecteerd schermpje staan pijltjes links en rechts ervan (vorige/volgende optie van de verborgen select, met input- en change-gebeurtenis); alleen op de voorbeeldkaart, die aan niets hangt.
   ===================================================================== */
const M=PK.skm, F=PK.ske_f, el=F.el, T=()=>PK.ske_tree;
let E=null, ro=null, raf=0, zone=null, hover=null;
const PID='pvw1', OID='pvw0';
const pkt=(...a)=>PK.pkt(...a);
const scrOf=w=>w<700?'phone':w<1100?'compact':'wide';
const apName=id=>((E.m.aps.find(a=>a.id===id)||{}).name)||id;
function mkCard(dev,id,slot){ if(!PK.addDevice(dev,0,0,null,id)) return null; const r=PK.Host.devices.get(id); if(!r) return null; r.pvw=true; r.x=r.y=0; slot.appendChild(r.el); return r; }
function create(dev){ destroy(); const r=mkCard(dev,PID,E.els.slot); if(!r) return null; E.r=r; E.cardId=PID; const o=mkCard(dev,OID,E.els.oslot); E.ro=o||null; if(o){ try{ PK.skinSet(OID,'',''); }catch(e){} }
  ro=new ResizeObserver(()=>{ fit(); schedule(); }); ro.observe(r.el); if(o) ro.observe(o.el); ro.observe(E.els.view); ro.observe(E.els.oview); return r; }
function destroy(){ if(ro){ ro.disconnect(); ro=null; } cancelAnimationFrame(raf); raf=0; PK.SK.draft=null;
  [PID,OID].forEach(id=>{ const r=PK.Host.devices.get(id); if(r){ r.skScr=null; try{ PK.skinSet(id,'',''); }catch(e){} PK.removeDevice(id); } }); E.r=null; E.ro=null; E.cardId=null; ['slot','oslot'].forEach(k=>{ if(E.els[k]) E.els[k].innerHTML=''; }); }
// ---- welke verschijning het voorbeeld toont, en in welke laag een bewerking schrijft ----
function previewAp(){ if(E.view.auto) return null; return E.sel.ap&&E.sel.ap!=='*'&&E.m.aps.some(a=>a.id===E.sel.ap)?E.sel.ap:(E.m.dflt||E.m.aps[0].id); }
function workAp(){ if(E.sel.ap) return E.sel.ap; const pa=previewAp()||E.m.dflt; return pa&&M.layoutOf(E.m,pa).own?pa:'*'; }   // zonder keuze: de laag die het voorbeeld echt bepaalt
// ---- breedte en scherm ----
function setWidth(w,live){ const r=E.r; if(!r) return; w=Math.max(200,Math.min(2000,Math.round(w))); E.view.w=w; PK.setSize(PID,w); if(E.ro) PK.setSize(OID,w);   // het origineel staat even breed, zodat beide naast elkaar te vergelijken zijn
  r.skScr=E.view.scr==='auto'?scrOf(r.el.offsetWidth||w):E.view.scr; syncWidthUi(); if(live){ fit(); schedule(); } else { preview(); fit(); } }
function syncWidthUi(){ const X=E.els, w=E.view.w; if(X.cw&&document.activeElement!==X.cw) X.cw.value=w; if(X.wsel){ const p=[...X.wsel.options].find(o=>+o.value===w); X.wsel.value=p?p.value:'custom'; } if(X.sizer){ X.sizer.setAttribute('aria-valuenow',w); X.sizer.setAttribute('aria-valuetext',w+' px'); } }
function fitOne(r,view,slot,fe,lock){ if(!r||!view||!view.clientWidth) return 1; const W=r.el.offsetWidth||E.view.w, k=lock||Math.min(1,Math.max(0.2,(view.clientWidth-40)/W)); slot.style.transform='scale('+k+')'; slot.style.width=W+'px'; fe.style.width=Math.ceil(W*k)+'px'; fe.style.height=Math.ceil((r.el.offsetHeight||100)*k)+'px'; return k; }
function fit(){ const X=E.els; if(!E.r||!X.view) return; E.view.k=fitOne(E.r,X.view,X.slot,X.fit,E.view.klock); if(E.ro&&E.view.orig) E.view.ko=fitOne(E.ro,X.oview,X.oslot,X.ofit);
  const i=X.info; if(i) { const w=E.r.el.offsetWidth||E.view.w; i.textContent=pkt('m.se_maat_info',w,E.r.skCur||'-',E.r.skScr||scrOf(w)); } if(X.nhead){ const pa=previewAp(); X.nhead.textContent=pkt('m.se_nieuw_vorm',pa?apName(pa):'Auto'); } }
// ---- skin toepassen op het voorbeeld ----
function preview(){ const r=E.r; if(!r) return; try{ const file=M.build(E.m,true), sk=PK.skValidate(file,'preview',[]); PK.SK.draft={skin:sk,file:'',origin:'draft'}; if(!r.skHosts||!r.skHosts.length) PK.skinSet(PID,'','');   // zonder shadow root keert skSync bij een leeg ontwerp terug zonder het vorige weg te halen: eerst wegzetten
    const ap=E.view.auto?'auto':previewAp(); r.skScr=E.view.scr==='auto'?scrOf(r.el.offsetWidth||E.view.w):E.view.scr; PK.skinSet(PID,sk.id,ap); }catch(e){ E.say(e.message,true); }
  fit(); schedule(); setTimeout(schedule,160); setTimeout(()=>{ fit(); schedule(); },420); }
// ---- eenheden, panelen en schermpjes van een kaart ----
function units(r){ if(!r) return []; const out=[]; PK.regEntries(r).forEach(e=>{ const d=PK.regDesc(e.el); if(!d) return; out.push({el:e.el,id:d.id,role:d.role,group:d.group,m:d.m}); });
  if(PK.METERS) PK.METERS.forEach(Mt=>{ if(Mt.dead||!Mt.el.isConnected||PK.cardOf(Mt.el)!==r) return; out.push({el:Mt.el,id:Mt.o.id||'',role:'meter',group:Mt.o.group||''}); });
  const seen=new Set(); return out.filter(u=>{ if(seen.has(u.el)) return false; seen.add(u.el); const b=u.el.getBoundingClientRect(); return b.width>0&&b.height>0; }); }
function panels(r){ if(!r) return []; const roots=[PK.regUi(r),...PK.regRoots(PK.regUi(r))], out=[]; roots.forEach(rt=>rt.querySelectorAll('[data-pk-pn]').forEach(p=>{ const b=p.getBoundingClientRect(); if(b.width>0&&b.height>0) out.push({el:p,pid:p.getAttribute('data-pk-pn')}); })); return out; }
function displays(r){ const out=[]; if(!r||!PK.DSP) return out; PK.DSP.forEach(D=>{ if(!D.sel.isConnected||PK.cardOf(D.sel)!==r) return; const f=D.face&&D.face.f&&D.face.f.isConnected?D.face.f:D.sel, b=f.getBoundingClientRect(); if(b.width>0&&b.height>0) out.push({D,kind:D.kind,sel:D.sel,el:f}); }); return out; }
const inside=(b,x,y)=>x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom, area=b=>b.width*b.height;
function hit(r,x,y,withPanels){ const ds=displays(r).filter(d=>d.kind!=='select'&&inside(d.el.getBoundingClientRect(),x,y)); if(ds.length) return {t:'dsp',kind:ds[0].kind};
  const us=units(r).map(u=>({u,b:u.el.getBoundingClientRect()})).filter(o=>inside(o.b,x,y)).sort((a,b)=>area(a.b)-area(b.b)); if(us.length) return {t:'unit',u:us[0].u};
  if(withPanels){ const ps=panels(r).map(p=>({p,b:p.el.getBoundingClientRect()})).filter(o=>inside(o.b,x,y)).sort((a,b)=>area(a.b)-area(b.b)); if(ps.length) return {t:'panel',pid:ps[0].p.pid}; }
  return inside(r.el.getBoundingClientRect(),x,y)?{t:'card'}:null; }
// ---- schermpje: vorige/volgende optie ----
function stepSel(s,dir){ const L=[...s.options].filter(o=>!o.disabled); if(!L.length) return null; const i=L.findIndex(o=>o.value===s.value), j=i<0?(dir>0?0:L.length-1):i+dir; if(j<0||j>=L.length) return L[Math.max(0,i)];
  const o=L[j]; s.value=o.value; s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); return o; }
const optText=s=>{ const o=s.options[s.selectedIndex]; return o?o.text:''; };
// ---- selectiekader, plaatsmarkering en pijltjes ----
function schedule(){ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; overlay(); }); }
function box(view,b){ const vb=view.getBoundingClientRect(); return {x:b.left-vb.left+view.scrollLeft,y:b.top-vb.top+view.scrollTop,w:b.width,h:b.height}; }
function rect(b){ return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height}; }
function union(bs){ const b={left:Math.min(...bs.map(z=>z.left)),top:Math.min(...bs.map(z=>z.top)),right:Math.max(...bs.map(z=>z.right)),bottom:Math.max(...bs.map(z=>z.bottom))}; b.width=b.right-b.left; b.height=b.bottom-b.top; return b; }
function frame(o,view,b,name,cls){ const q=box(view,b), d=el('div',cls||'se-sel'); Object.assign(d.style,{left:q.x+'px',top:q.y+'px',width:q.w+'px',height:q.h+'px'}); if(name){ const c=el('span','se-chip',name); if(q.y<24){ c.style.top='0'; c.style.left='0'; c.style.borderRadius='0 0 3px 0'; } d.appendChild(c); } o.appendChild(d); return q; }
function selBox(r,main){ const s=E.sel; if(s.k==='ctl'){ const u=units(r).find(x=>x.id===s.id); if(u) return {b:u.el.getBoundingClientRect(),name:s.id,u,el:u.el}; }
  else if(s.k==='display'){ const d=displays(r).find(x=>x.kind===s.kind); if(d) return {b:d.el.getBoundingClientRect(),name:pkt('m.se_dsp_kop',pkt('m.dz_d_t_'+s.kind)),d,el:d.el}; }
  else if(!main) return null;
  else if(s.k==='panel'){ const p=panels(r).find(x=>x.pid===s.pid); if(p) return {b:p.el.getBoundingClientRect(),name:s.pid,el:p.el}; }
  else if(s.k==='group'){ const us=units(r).filter(x=>x.group===s.g); if(us.length) return {b:union(us.map(x=>x.el.getBoundingClientRect())),name:s.g,el:us[0].el}; }
  else if(['ap','colors','ports','haptics','ctls','rest','skin','aps'].includes(s.k)) return {b:r.el.getBoundingClientRect(),name:'',el:null};
  return null; }
function arrows(o,view,q,D,name){ const mkb=(dir,x)=>{ const b=el('button','se-arr',dir<0?'◀':'▶'); b.type='button'; b.title=b.ariaLabel=pkt(dir<0?'m.se_pijl_vorige':'m.se_pijl_volgende'); b.dataset.act='dsp-'+(dir<0?'prev':'next');
    b.style.left=Math.max(2,x)+'px'; b.style.top=Math.max(2,q.y+q.h/2-13)+'px'; b.onpointerdown=e=>e.stopPropagation(); b.onclick=e=>{ e.stopPropagation(); const op=stepSel(D.sel,dir); E.say(op?pkt('m.se_pijl_nu',op.text):''); setTimeout(schedule,60); setTimeout(()=>{ fit(); schedule(); },300); }; o.appendChild(b); };
  mkb(-1,q.x-28); mkb(1,q.x+q.w+4); }
// een paneel zonder regelaars komt niet in het skinbestand (items is verplicht) en dus niet op de kaart: de editor toont het als lege dropzone onder de kaart
function empties(){ const B=E.els.below; [...B.querySelectorAll('.se-empty')].forEach(n=>n.remove()); const ap=workAp(); M.layoutOf(E.m,ap).panels.forEach((p,pi)=>{ if(p.items.length) return; const d=el('div','se-empty',p.id+' · '+pkt('m.se_leeg_paneel')); d.dataset.pi=pi; d.dataset.pid=p.id; d.tabIndex=0; d.onclick=()=>E.select({k:'panel',ap,pid:p.id},{reveal:true}); d.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); d.click(); } }; B.appendChild(d); }); }
function overlay(){ const X=E.els; if(!E.r||!X.ovl) return; empties();
  { const o=X.ovl; o.innerHTML=''; const sb=selBox(E.r,true); if(sb){ const nm=sb.d?sb.name+' · '+optText(sb.d.sel):(sb.u&&sb.u.m&&sb.u.m.tagName==='SELECT'?sb.name+' · '+optText(sb.u.m):sb.name), q=frame(o,X.view,sb.b,nm);
      const sl=sb.d?sb.d.sel:(sb.u&&sb.u.m&&sb.u.m.tagName==='SELECT'?sb.u.m:null); if(sl) arrows(o,X.view,q,{sel:sl},nm); }
    if(hover&&hover.which==='n') frame(o,X.view,hover.b,'', 'se-hov'); }
  if(E.ro&&E.view.orig&&X.oovl){ const o=X.oovl; o.innerHTML=''; const lo=M.layoutOf(E.m,workAp()), A=lo.panels.length?M.assign(lo.panels,E.regs()):null;
    if(A) units(E.ro).forEach(u=>{ const q=u.id&&A.get(u.id); if(q&&!q.star)frame(o,X.oview,u.el.getBoundingClientRect(),'','se-placed'); });
    const sb=selBox(E.ro,false); if(sb) frame(o,X.oview,sb.b,sb.name); if(hover&&hover.which==='o') frame(o,X.oview,hover.b,'','se-hov'); } }
// na een keuze in de boom: laat het gekozen element in het voorbeeld zien (scrollt de werkplek, niet de pagina)
function show(){ if(!E.r) return; [[E.r,E.els.view,true],[E.ro,E.els.oview,false]].forEach(([r,v,main])=>{ if(!r||(!main&&!E.view.orig)) return; const sb=selBox(r,main); if(!sb||!sb.el) return; const b=sb.b, vb=v.getBoundingClientRect(); if(b.top<vb.top||b.bottom>vb.bottom) v.scrollTop+=b.top<vb.top?b.top-vb.top-24:b.bottom-vb.bottom+24; if(b.left<vb.left||b.right>vb.right) v.scrollLeft+=b.left<vb.left?b.left-vb.left-24:b.right-vb.right+24; }); schedule(); }
function hoverMove(ev,which){ if(document.documentElement.classList.contains('se-dragging')) return; const r=which==='o'?E.ro:E.r; if(!r) return; const h=hit(r,ev.clientX,ev.clientY,false); let b=null; if(h&&h.t==='unit') b=rect(h.u.el.getBoundingClientRect()); else if(h&&h.t==='dsp'){ const d=displays(r).find(x=>x.kind===h.kind); if(d) b=rect(d.el.getBoundingClientRect()); }
  const was=hover; hover=b?{which,b}:null; if((was&&was.b.left)!==(hover&&hover.b.left)||(was&&was.b.top)!==(hover&&hover.b.top)) schedule(); }
// ---- doelen bij slepen ----
function target(what){ return (x,y)=>{ const cb=E.r.el.getBoundingClientRect(), zb=zone&&!zone.hidden&&zone.getBoundingClientRect(); const nz=()=>({t:'newpanel',rect:zb?{x:zb.left,y:zb.top,w:zb.width,h:zb.height}:{x:cb.left,y:cb.bottom-4,w:cb.width,h:4},fill:true}); if(zb&&inside(zb,x,y)&&what.t==='ctl') return nz();
    if(what.t==='ctl'){ const em=[...E.els.dropbar.querySelectorAll('.se-empty'),...E.els.below.querySelectorAll('.se-empty')].find(n=>!n.closest('[hidden]')&&inside(n.getBoundingClientRect(),x,y)); if(em){ const b=em.getBoundingClientRect(); return {t:'in',pi:+em.dataset.pi,beforeId:null,rect:{x:b.left,y:b.top,w:b.width,h:b.height},fill:true}; } }
    const ps=panels(E.r).map(p=>({p,b:p.el.getBoundingClientRect()})).filter(o=>inside(o.b,x,y)).sort((a,b)=>area(a.b)-area(b.b));
    if(what.t==='panel'){ const o=ps.find(z=>z.p.pid!==what.pid); if(!o) return null; const b=o.b, side=b.width<cb.width*0.75, after=side?x>b.left+b.width/2:y>b.top+b.height/2; return {t:'panelpos',pid:o.p.pid,after,rect:side?{x:after?b.right-2:b.left,y:b.top,w:2,h:b.height}:{x:b.left,y:after?b.bottom-2:b.top,w:b.width,h:2}}; }
    if(!ps.length) return inside(cb,x,y)?nz():null; const o=ps[0], lo=M.layoutOf(E.m,what.ap), pi=lo.panels.findIndex(z=>z.id===o.p.pid); if(pi<0) return {t:'rest',rect:{x:o.b.left,y:o.b.top,w:o.b.width,h:o.b.height},fill:true};
    const kids=[...o.p.el.querySelectorAll('.pk-pnl-b > *')].map(k=>({k,b:k.getBoundingClientRect(),id:k.getAttribute('data-pk-id')||(k.querySelector('[data-pk-id]')||{getAttribute:()=>''}).getAttribute('data-pk-id')})).filter(z=>z.id&&z.id!==what.id&&z.b.width>0);
    if(!kids.length) return {t:'in',pi,beforeId:null,rect:{x:o.b.left,y:o.b.top,w:o.b.width,h:o.b.height},fill:true};
    let best=null, bd=1e9; kids.forEach(z=>{ const d=inside(z.b,x,y)?0:Math.hypot(Math.max(z.b.left-x,0,x-z.b.right),Math.max(z.b.top-y,0,y-z.b.bottom)); if(d<bd){ bd=d; best=z; } });
    const b=best.b, before=y<b.top||(y<=b.bottom&&x<b.left+b.width/2); if(before) return {t:'in',pi,beforeId:best.id,rect:{x:b.left-1,y:b.top,w:2,h:b.height}};
    const nx=kids[kids.indexOf(best)+1]; return {t:'in',pi,beforeId:nx?nx.id:null,rect:{x:b.right-1,y:b.top,w:2,h:b.height}}; }; }
function down(ev,which){ if(ev.button>0) return; const r=which==='o'?E.ro:E.r; if(!r) return; ev.preventDefault(); const h=hit(r,ev.clientX,ev.clientY,which==='n'); if(!h) return; const ap=workAp(); let sel, what=null;
  if(h.t==='unit'){ sel=h.u.id?{k:'ctl',ap,id:h.u.id}:{k:'ap',ap}; if(h.u.id) what={t:'ctl',id:h.u.id,ap,label:h.u.id,from:which}; }
  else if(h.t==='dsp') sel={k:'display',ap,kind:h.kind};
  else if(h.t==='panel'){ const lo=M.layoutOf(E.m,ap); sel=lo.panels.some(p=>p.id===h.pid)?{k:'panel',ap,pid:h.pid}:{k:'rest',ap}; if(sel.k==='panel') what={t:'panel',pid:h.pid,ap,label:h.pid,from:which}; }
  else if(which==='o') return; else sel={k:'ap',ap};
  const click=()=>E.select(sel,{swallow:ev.pointerType==='touch',reveal:true}); if(!what){ click(); return; } try{ ev.currentTarget.setPointerCapture(ev.pointerId); }catch(e){}
  const tg=target(what), tt=T().treeTarget(what);
  T().drag(ev,what,(x,y)=>tg(x,y)||tt(x,y),{hold:ev.pointerType==='touch'?350:0,onStart:()=>dragState(true,what),onEnd:()=>dragState(false,what),drop:(w,t)=>T().apply(w,t),click}); }
// tijdens het slepen van een regelaar staat boven de nieuwe kaart een strook met 'Nieuw paneel' en de lege panelen, ook bij een hoge kaart (de kaart zelf schuift niet mee)
function dragState(on,what){ const D=E.els.dropbar, show=on&&what.t==='ctl'; zone.hidden=!show; D.hidden=!show; [...D.querySelectorAll('.se-empty')].forEach(n=>n.remove());
  if(show) M.layoutOf(E.m,workAp()).panels.forEach((p,pi)=>{ if(p.items.length) return; const d=el('div','se-empty',p.id); d.dataset.pi=pi; D.appendChild(d); });
  E.els.root.classList.toggle('dragging',on); if(on) hover=null; schedule(); }
// ---- kaartbreedte slepen (rechterrand en hoek van de nieuwe kaart) ----
function commitWidth(w){ const pa=previewAp(); if(!pa){ E.say(pkt('m.se_breedte_auto')); return; } if(w<200||w>1600){ E.say(pkt('m.se_breedte_groot')); return; }
  E.edit(()=>{ M.layerMake(E.m,pa).size={width:w}; },{key:'size'}); E.say(pkt('m.se_breedte_vorm',apName(pa),w)); }
function sizerDown(ev){ if(ev.button>0||!E.r) return; ev.preventDefault(); ev.stopPropagation(); const src=ev.currentTarget, k=E.view.k||1, left=E.r.el.getBoundingClientRect().left; E.view.klock=k; E.els.sbub.hidden=false; E.els.root.classList.add('sizing'); try{ src.setPointerCapture(ev.pointerId); }catch(e){} let last=E.view.w;
  const mv=e=>{ const w=Math.max(200,Math.min(2000,Math.round((e.clientX-left)/k/2)*2)); if(w!==last){ last=w; setWidth(w,true); } E.els.sbub.textContent=last+' px'; };
  const up=()=>{ src.removeEventListener('pointermove',mv); src.removeEventListener('pointerup',up); src.removeEventListener('pointercancel',up); E.view.klock=0; E.els.sbub.hidden=true; E.els.root.classList.remove('sizing'); fit(); preview(); commitWidth(last); };
  src.addEventListener('pointermove',mv); src.addEventListener('pointerup',up); src.addEventListener('pointercancel',up); }
function sizerKey(ev){ const d={ArrowLeft:-1,ArrowRight:1}[ev.key]; if(!d||!E.r) return; ev.preventDefault(); ev.stopPropagation(); const w=Math.max(200,Math.min(2000,E.view.w+d*(ev.shiftKey?50:10))); setWidth(w); commitWidth(w); }
function init(e){ E=e; const X=e.els; zone=X.zone; X.shield.onpointerdown=ev=>down(ev,'n'); X.oshield.onpointerdown=ev=>down(ev,'o');
  X.shield.onpointermove=ev=>hoverMove(ev,'n'); X.oshield.onpointermove=ev=>hoverMove(ev,'o'); [X.shield,X.oshield].forEach(s=>{ s.onpointerleave=()=>{ if(hover){ hover=null; schedule(); } }; });
  [X.sizer,X.corner].forEach(s=>{ s.onpointerdown=sizerDown; }); X.sizer.onkeydown=sizerKey; [X.view,X.oview].forEach(v=>v.addEventListener('scroll',schedule,{passive:true})); }
PK.ske_stage={init,create,destroy,setWidth,fit,preview,schedule,units,panels,displays,previewAp,workAp,stepSel,syncWidthUi,target,dragState,show};
})(window.__PK);
