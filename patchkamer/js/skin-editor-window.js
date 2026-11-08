// js/skin-editor-window.js — skin-editor: het zwevende venster (verslepen aan de titelbalk, formaat aan de hoek, positie en maat onthouden, volledig scherm op een smal scherm)
(function(PK){
/* =====================================================================
   SKIN-EDITOR · VENSTER. Het venster staat vast (position:fixed) met de maat en plaats uit localStorage `patchkamer.sked.win` ({x,y,w,h}); zonder bewaarde waarde een standaardmaat in het midden.
   Slepen en formaat werken met pointer events (muis en aanraking) en met het toetsenbord (pijltjes op de knoppen Verplaatsen en Formaat; Shift = grotere stap). Op een smal scherm (max-width 899px) vult het venster het scherm,
   net als het bibliotheekvenster; de knop Vullen doet dat ook op een breed scherm (alleen voor deze sessie, de bewaarde maat blijft). Elke toegang tot localStorage zit in try/catch.
   attach(root, {handle, grip, move}) geeft {reflow, setFull, isFull, destroy}; onResize(fn) wordt aangeroepen na elke maatwijziging.
   ===================================================================== */
const KEY='patchkamer.sked.win', MINW=720, MINH=440;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const narrow=()=>matchMedia('(max-width:899px)').matches;
function load(){ try{ const o=JSON.parse(localStorage.getItem(KEY)||'null'); if(o&&[o.x,o.y,o.w,o.h].every(v=>typeof v==='number'&&isFinite(v))) return o; }catch(e){} return null; }
function save(r){ try{ localStorage.setItem(KEY,JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.w),h:Math.round(r.h)})); }catch(e){} }
function dflt(){ const vw=innerWidth, vh=innerHeight, w=Math.min(1280,vw-48), h=Math.min(800,vh-48); return {x:Math.round((vw-w)/2),y:Math.round((vh-h)/2),w,h}; }
function fix(r){ const vw=innerWidth, vh=innerHeight; const w=clamp(r.w,Math.min(MINW,vw),vw), h=clamp(r.h,Math.min(MINH,vh),vh); return {w,h,x:clamp(r.x,0,Math.max(0,vw-w)),y:clamp(r.y,0,Math.max(0,vh-h))}; }
function attach(root,o){ let rect=fix(load()||dflt()), full=false, dead=false, onResize=null; const STEP=16;
  const put=()=>{ const f=full||narrow(); root.classList.toggle('full',f); if(f){ root.style.left=root.style.top=root.style.width=root.style.height=''; } else { Object.assign(root.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'}); } };
  const after=()=>{ put(); if(onResize) onResize(); };
  const commit=()=>{ rect=fix(rect); save(rect); after(); };
  const canDo=()=>!(full||narrow());
  // titelbalk: slepen op een leeg stuk (niet op knoppen, velden en keuzelijsten)
  const dragStart=(ev,mode)=>{ if(ev.button>0||!canDo()) return; ev.preventDefault(); const x0=ev.clientX, y0=ev.clientY, r0={...rect}; const src=ev.currentTarget; try{ src.setPointerCapture(ev.pointerId); }catch(e){}
    root.classList.add('moving');
    const mv=e=>{ const dx=e.clientX-x0, dy=e.clientY-y0; rect=mode==='move'?{...r0,x:r0.x+dx,y:r0.y+dy}:{...r0,w:r0.w+dx,h:r0.h+dy}; rect=fix(rect); put(); if(mode==='size'&&onResize) onResize(); };
    const up=()=>{ src.removeEventListener('pointermove',mv); src.removeEventListener('pointerup',up); src.removeEventListener('pointercancel',up); root.classList.remove('moving'); commit(); };
    src.addEventListener('pointermove',mv); src.addEventListener('pointerup',up); src.addEventListener('pointercancel',up); };
  o.handle.addEventListener('pointerdown',ev=>{ if(ev.target.closest('button,input,select,textarea,label,a,[tabindex="0"]')&&ev.target!==o.move) return; dragStart(ev,'move'); });
  o.handle.addEventListener('dblclick',ev=>{ if(ev.target.closest('button,input,select,textarea,label,a')) return; setFull(!full); });
  o.grip.addEventListener('pointerdown',ev=>dragStart(ev,'size'));
  const keys=mode=>ev=>{ const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key]; if(!d||!canDo()) return; ev.preventDefault(); ev.stopPropagation(); const s=ev.shiftKey?STEP*4:STEP;
    rect=mode==='move'?{...rect,x:rect.x+d[0]*s,y:rect.y+d[1]*s}:{...rect,w:rect.w+d[0]*s,h:rect.h+d[1]*s}; commit(); };
  if(o.move) o.move.addEventListener('keydown',keys('move')); o.grip.addEventListener('keydown',keys('size'));
  const setFull=v=>{ full=!!v; put(); if(onResize) onResize(); };
  const rf=()=>{ if(dead) return; rect=fix(rect); after(); }; window.addEventListener('resize',rf); put();
  return {reflow:rf,setFull,isFull:()=>full||narrow(),onResize:fn=>{ onResize=fn; },destroy(){ dead=true; window.removeEventListener('resize',rf); },rect:()=>({...rect})}; }
PK.ske_win={attach,KEY,load,save,dflt,fix,narrow};
})(window.__PK);
