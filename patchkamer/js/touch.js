// js/touch.js — aanraking: knijpzoom, tweevingerschuiven, lang indrukken, dubbeltik
(function(PK){
/* =====================================================================
   TOUCH · knijpzoom, tweevingerschuiven, lang indrukken, dubbeltik
   Eén vinger blijft wat de muis is (schuiven op lege vloer, kabel trekken, kaart slepen). Twee vingers op de vloer = zoomen en schuiven;
   een lopende sleepactie met de eerste vinger wordt dan netjes afgebroken. Twee vingers in de UI van één apparaat doen niets met de vloer
   (zodat je met twee vingers op een toetsenbord of pads van een apparaat kunt spelen).
   ===================================================================== */
const TOUCH={pts:new Map(),pinch:null,silent:false,last:-1e9,lastDbl:-1e9,tap:null,downs:new Map()}; PK.TOUCH=TOUCH;
const isFormEl=n=>n&&n.nodeType===1&&/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName); PK.isFormEl=isFormEl;
function touchEligible(path){ for(const n of path){ if(n===PK.floorwrap) break; if(!n||n.nodeType!==1) continue; if(n.classList.contains('port')) return true;
    if(n.classList.contains('viewctl')||n.classList.contains('toast')||n.classList.contains('standpop')||isFormEl(n)) return false;
    if(n.classList.contains('ui')&&n.parentElement&&n.parentElement.classList.contains('body')&&n.closest('.card')) return false; }
  return true; } PK.touchEligible=touchEligible;
// de dichtstbijzijnde poort (stip) binnen r schermpixels; filter(info) mag poorten uitsluiten
function nearestPort(cx,cy,r,filter){ let best=null,bd=r; PK.floor.querySelectorAll('.port').forEach(pe=>{ const dot=pe.querySelector('.dot')||pe, b=dot.getBoundingClientRect(); if(!b.width) return;
    const d=Math.hypot(b.left+b.width/2-cx,b.top+b.height/2-cy); if(d>=bd) return; const inf=PK.portInfo(pe); if(!inf||(filter&&!filter(inf))) return; bd=d; best=inf; }); return best; } PK.nearestPort=nearestPort;
const reducedMotion=()=>{ try{ return matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){ return false; } };
function viewCancelAnim(){ PK.VANIM=0; } PK.viewCancelAnim=viewCancelAnim;
function viewTo(x,y,scale,instant){ const v0={...PK.Host.view}; scale=PK.clamp(scale,0.1,2.5);
  if(instant||reducedMotion()||!window.requestAnimationFrame){ PK.Host.view={x,y,scale}; PK.applyView(); return; }
  const id=++PK.VANIM, t0=performance.now(), D=280, ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const step=now=>{ if(PK.VANIM!==id) return; const t=Math.min(1,(now-t0)/D), k=ease(t), s=v0.scale*Math.pow(scale/v0.scale,k);
    PK.Host.view={x:v0.x+(x-v0.x)*k,y:v0.y+(y-v0.y)*k,scale:t>=1?scale:s}; PK.applyView(); if(t<1) requestAnimationFrame(step); };
  requestAnimationFrame(step); } PK.viewTo=viewTo;
function pinchStart(){ const ok=[...TOUCH.pts].filter(([,p])=>p.ok).slice(0,2); if(ok.length<2) return;
  viewCancelAnim(); lpCancel();
  if(PK.wire) PK.endWire(false); PK.setDrop(null); PK.cgrab=null; PK.pan=null; PK.floorwrap.classList.remove('panning');
  TOUCH.silent=true;   // laat elke lopende sleepactie (kaart, rand, regelaar) weten dat hij afgebroken is
  try{ TOUCH.pts.forEach((p,id)=>{ if(p.target&&p.target.dispatchEvent) p.target.dispatchEvent(new PointerEvent('pointercancel',{pointerId:id,pointerType:'touch',bubbles:true,composed:true})); }); }catch(e){}
  TOUCH.silent=false;
  const [a,b]=[ok[0][1],ok[1][1]], r=PK.floorwrap.getBoundingClientRect();
  TOUCH.pinch={ids:[ok[0][0],ok[1][0]],d0:Math.max(12,Math.hypot(a.x-b.x,a.y-b.y)),c0:{x:(a.x+b.x)/2-r.left,y:(a.y+b.y)/2-r.top},v0:{...PK.Host.view}};
  PK.floorwrap.classList.add('pinching'); document.body.classList.remove('wiring'); } PK.pinchStart=pinchStart;
function pinchUpdate(){ const pc=TOUCH.pinch; if(!pc) return; const a=TOUCH.pts.get(pc.ids[0]), b=TOUCH.pts.get(pc.ids[1]); if(!a||!b) return; const r=PK.floorwrap.getBoundingClientRect();
  const d=Math.max(12,Math.hypot(a.x-b.x,a.y-b.y)), cx=(a.x+b.x)/2-r.left, cy=(a.y+b.y)/2-r.top, s0=pc.v0.scale, ns=PK.clamp(s0*d/pc.d0,0.1,2.5);
  const fx=(pc.c0.x-pc.v0.x)/s0, fy=(pc.c0.y-pc.v0.y)/s0;   // het punt van de vloer onder het beginmidden blijft onder het midden van de vingers
  PK.Host.view.scale=ns; PK.Host.view.x=cx-fx*ns; PK.Host.view.y=cy-fy*ns; PK.applyView(); } PK.pinchUpdate=pinchUpdate;
function pinchEnd(goneId){ const pc=TOUCH.pinch; TOUCH.pinch=null; PK.floorwrap.classList.remove('pinching');
  const left=[...TOUCH.pts].filter(([id,p])=>id!==goneId&&p.ok&&pc.ids.includes(id))[0];
  if(left){ const p=left[1]; PK.pan={cx:p.x,cy:p.y,x0:PK.Host.view.x,y0:PK.Host.view.y}; PK.floorwrap.classList.add('panning'); } }   // de vinger die blijft, schuift verder
function touchGone(e){ if(e.pointerType!=='touch'||TOUCH.silent) return; TOUCH.downs.delete(e.pointerId);
  if(TOUCH.pinch&&TOUCH.pinch.ids.includes(e.pointerId)){ pinchEnd(e.pointerId); }
  TOUCH.pts.delete(e.pointerId); } PK.touchGone=touchGone;

/* ---- lang indrukken (±500 ms, zonder bewegen): de contextactie van rechtsklik/hover op aanraking ---- */
const LP={timer:0,id:null,x:0,y:0,path:null,swallow:false,off:0}; PK.LP=LP;
function lpCancel(){ clearTimeout(LP.timer); LP.timer=0; LP.id=null; } PK.lpCancel=lpCancel;
function lpArm(e,path){ lpCancel(); if(e.button>0) return; LP.id=e.pointerId; LP.x=e.clientX; LP.y=e.clientY; LP.path=path; LP.timer=setTimeout(lpFire,500); } PK.lpArm=lpArm;
function lpFire(){ const path=LP.path||[]; LP.timer=0; if(LP.id==null||TOUCH.pinch) return;
  const has=f=>path.find(n=>n&&n.nodeType===1&&f(n)), cls=(n,c)=>n.classList&&n.classList.contains(c);
  if(has(n=>cls(n,'libdev'))) return;   // de bibliotheek heeft zijn eigen lang indrukken (slepen)
  let did=false;
  const hit=path.find(n=>n&&n._cable);
  if(hit){ if(PK.wire) PK.endWire(false); PK.cgrab=null; PK.cableMenu(hit._cable,LP.x,LP.y); { const t=PK.cableTipText(hit._cable); if(t) PK.status(t); } did=true; }
  else { const pe=has(n=>cls(n,'port'));
    if(pe){ if(PK.wire) PK.endWire(false); if(pe.title) PK.status(pe.title); did=!!pe.title; }
    else { const bar=has(n=>cls(n,'bar')&&n.closest('.card')), ic=has(n=>cls(n,'pkicon')), card=(bar||ic)&&(bar||ic).closest('.card');
      if(card&&PK.Host.devices.has(card.dataset.id)){ const r=PK.Host.devices.get(card.dataset.id); PK.status(`${r.def.name} · v${r.def.version} · ${r.def.id}`); did=true; }
      else { const t=has(n=>n.getAttribute&&n.getAttribute('title')&&!isFormEl(n)); if(t){ PK.status(t.getAttribute('title')); did=true; } } } }
  if(did){ LP.swallow=true; try{ navigator.vibrate&&navigator.vibrate(12); }catch(e){} } }

/* ---- touch-hulp bij kabels: loslaten op een poort mag een stuk ernaast ---- */
function nearCompatiblePort(cx,cy){ return PK.wire?nearestPort(cx,cy,28,inf=>PK.compatible(PK.wire.src,inf)):null; } PK.nearCompatiblePort=nearCompatiblePort;
// vergrote, onzichtbare raakstrook langs kabels (alleen aanraking); de breedte volgt de zoom zodat hij ±28 schermpixels blijft
function hitWidthRefresh(){ PK._hwS=PK.Host.view.scale; if(!PK.PKT.coarse.matches) return; const w=PK.clamp(28/PK.Host.view.scale,14,120)+'px'; PK.svg.querySelectorAll('path.hit').forEach(h=>{ h.style.strokeWidth=w; }); } PK.hitWidthRefresh=hitWidthRefresh;
function hitWidthSoon(){ if(!PK.PKT.coarse.matches||PK.Host.view.scale===PK._hwS) return; PK._hwS=PK.Host.view.scale; clearTimeout(PK._hwT); PK._hwT=setTimeout(hitWidthRefresh,120); } PK.hitWidthSoon=hitWidthSoon;
})(window.__PK);
