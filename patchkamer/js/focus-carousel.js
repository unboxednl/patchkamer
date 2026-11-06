// js/focus-carousel.js — focus: een tegelijk (carrousel)
(function(PK){
/* =====================================================================
   FOCUS · Een tegelijk (carrousel): wisselen met ◀ ▶, de tabbalk, de pijltjestoetsen of door over de tabbalk te vegen.
   Bewust alleen de tabbalk: een veeg over de kaart zelf zou botsen met schuiven, knoppen en pads van het apparaat.
   ===================================================================== */
function focusStep(d){ const n=PK.focusList().length; if(n<2) return; PK.FOCUS.idx=(PK.FOCUS.idx+d+n)%n; focusOneApply(); const b=PK.focusEl&&PK.focusEl.querySelector('.fvbody'); if(b) b.scrollTop=0; PK.drawCables(); } PK.focusStep=focusStep;
function focusOneApply(){ if(!PK.focusEl) return; const one=PK.FOCUS.layout==='one', list=PK.focusList(), tabs=PK.focusEl.querySelector('.fvtabs'); tabs.classList.toggle('show',one);
  if(PK.FOCUS.idx>=list.length) PK.FOCUS.idx=Math.max(0,list.length-1);
  if(!one){ PK.Host.devices.forEach(r=>r.el.classList.remove('fvoff')); return; }
  list.forEach(([,r],i)=>r.el.classList.toggle('fvoff',i!==PK.FOCUS.idx));
  const strip=tabs.querySelector('.fvstrip'); strip.innerHTML='';
  list.forEach(([id,r],i)=>{ const b=document.createElement('button'); b.className='small'+(i===PK.FOCUS.idx?' on':''); b.innerHTML=PK.devIconHTML(r.def,r)+PK.esc(r.def.name); b.setAttribute('role','tab'); b.setAttribute('aria-selected',String(i===PK.FOCUS.idx)); b.dataset.i=String(i); strip.appendChild(b); });
  tabs.querySelector('.fvcnt').textContent=list.length?PK.pkt('m.t_n_van_m',PK.FOCUS.idx+1,list.length):'';
  const on=strip.querySelector('.on'); if(on) strip.scrollLeft=Math.max(0,on.offsetLeft-strip.clientWidth/2+on.offsetWidth/2); } PK.focusOneApply=focusOneApply;
function focusBuildTabs(){ const bar=PK.focusEl.querySelector('.fvbar'), tabs=document.createElement('div'); tabs.className='fvtabs';
  tabs.innerHTML='<button class="small fvnav" data-d="-1">◀</button><div class="fvstrip" role="tablist"></div><button class="small fvnav" data-d="1">▶</button><span class="fvcnt"></span>';
  tabs.querySelector('[data-d="-1"]').setAttribute('aria-label',PK.pkt('m.t_vorig')); tabs.querySelector('[data-d="1"]').setAttribute('aria-label',PK.pkt('m.t_volgend'));
  tabs.querySelector('[data-d="-1"]').title=PK.pkt('m.t_vorig'); tabs.querySelector('[data-d="1"]').title=PK.pkt('m.t_volgend');
  tabs.querySelectorAll('.fvnav').forEach(b=>b.onclick=()=>focusStep(+b.dataset.d));
  const strip=tabs.querySelector('.fvstrip'); let sw=null, swiped=false;
  strip.addEventListener('pointerdown',e=>{ if(e.button!==0) return; sw={id:e.pointerId,x:e.clientX,cap:false}; swiped=false; });
  strip.addEventListener('pointermove',e=>{ if(!sw||sw.id!==e.pointerId) return; const dx=e.clientX-sw.x; if(!sw.cap&&Math.abs(dx)>10){ sw.cap=true; try{ strip.setPointerCapture(e.pointerId); }catch(_){} } });
  const fin=e=>{ if(!sw||sw.id!==e.pointerId) return; const dx=e.clientX-sw.x, s=sw; sw=null; if(s.cap&&Math.abs(dx)>=40&&e.type==='pointerup'){ swiped=true; focusStep(dx<0?1:-1); } else if(s.cap) swiped=true; };
  strip.addEventListener('pointerup',fin); strip.addEventListener('pointercancel',fin);
  strip.addEventListener('click',e=>{ if(swiped){ swiped=false; return; } const b=e.target.closest('button[data-i]'); if(b){ PK.FOCUS.idx=+b.dataset.i; focusOneApply(); const bd=PK.focusEl.querySelector('.fvbody'); if(bd) bd.scrollTop=0; PK.drawCables(); } });
  bar.appendChild(tabs); } PK.focusBuildTabs=focusBuildTabs;
})(window.__PK);
