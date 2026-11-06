// js/haptics.js — skins: haptiek (navigator.vibrate) bij klikken, draaien en schuiven op een kaart
(function(PK){
/* =====================================================================
   HAPTIEK · per kaart met r.skHap = {click,turn,slide} (off|light|medium|strong). Eén luisteraar per kaart (capture, composed: werkt ook uit open shadow roots).
   Geen trilling zonder navigator.vibrate, bij prefers-reduced-motion of als de pagina op de achtergrond staat. Hoogstens 1 puls per 40 ms per kaart (max 25/s).
   Schuiven: een puls per stap (bij fijne schuiven per 1/50 van het bereik), niet per pixel. Draaien aan de hostknop: PK.hapticTick vanuit knobs.js.
   ===================================================================== */
const PULSE={light:8,medium:15,strong:30};
const CLICKABLE='button,[role=button],[role=switch],[role=checkbox],input[type=checkbox],input[type=radio],input[type=button],summary,a[href],.st,.pad,[data-pad]';
function pulse(r,kind){ const h=r.skHap, lvl=h&&h[kind]; if(!lvl||lvl==='off'||!PULSE[lvl]) return false; if(typeof navigator.vibrate!=='function'||document.hidden) return false;
  try{ if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return false; }catch(e){}
  const now=performance.now(); if(now-(r.skHapT||-1e9)<40) return false; r.skHapT=now; try{ navigator.vibrate(PULSE[lvl]); }catch(e){} return true; }
const step=new WeakMap();
function onDown(r,e){ if(!e.isPrimary&&e.pointerType==='touch') return; const path=e.composedPath(), ui=r.el.querySelector(':scope > .body > .ui'); if(!ui||!path.includes(ui)) return;
  for(let i=0;i<path.length&&path[i]!==ui;i++){ const n=path[i]; if(!n||n.nodeType!==1) continue; if(n.matches('input[type=range],.kn')) return;
    if(n.matches(CLICKABLE)){ pulse(r,'click'); return; } if(i<4){ let c=''; try{ c=getComputedStyle(n).cursor; }catch(x){} if(c==='pointer'){ pulse(r,'click'); return; } } } }
function onInput(r,e){ const t=e.composedPath()[0]; if(!t||t.nodeType!==1||t.tagName!=='INPUT'||t.type!=='range') return;
  const sib=t.parentElement&&t.parentElement.querySelector(':scope > .kn'); if(sib&&sib.style.display!=='none') return;   // rotary hostknop: dat is "draaien"
  const mn=+t.min||0, mx=t.max===''?100:+t.max, st=+t.step>0?+t.step:0, n=st?Math.min(50,Math.max(1,(mx-mn)/st)):50, idx=Math.round((+t.value-mn)/((mx-mn)||1)*n);
  if(step.get(t)===idx) return; step.set(t,idx); pulse(r,'slide'); }
function hapticsAttach(r){ hapticsDetach(r); const d=e=>onDown(r,e), i=e=>onInput(r,e); r.el.addEventListener('pointerdown',d,true); r.el.addEventListener('input',i,true); r.skHapL=[d,i]; } PK.hapticsAttach=hapticsAttach;
function hapticsDetach(r){ if(!r.skHapL) return; r.el.removeEventListener('pointerdown',r.skHapL[0],true); r.el.removeEventListener('input',r.skHapL[1],true); r.skHapL=null; r.skHap=null; } PK.hapticsDetach=hapticsDetach;
// vanuit knobs.js: de hostknop is gedraaid
function hapticTick(el){ const r=PK.ctlCard&&PK.ctlCard(pathUp(el)); if(r&&r.skHap) pulse(r,'turn'); } PK.hapticTick=hapticTick;
function pathUp(el){ const p=[]; for(let n=el;n;){ p.push(n); n=n.parentNode&&n.parentNode.nodeType===11?n.parentNode.host:n.parentNode; } return p; }
})(window.__PK);
