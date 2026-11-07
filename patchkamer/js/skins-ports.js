// js/skins-ports.js — skins: poortenmodi (always, hover, strip) van een kaart; poorten openen bij hover, tik, focus of een kabel erboven
(function(PK){
/* =====================================================================
   POORTENMODI · alleen CSS-attributen op de kaart (data-pk-ports, data-pk-ports-open) plus gedrag hieronder; de poorten blijven in de DOM.
   Dicht = .col's verborgen, kabels hangen aan de strook (PK.portPos). Open = de .col's liggen als laag over de bovenkant van het apparaat.
   hover: open met de muis op de strook, of met een kabel (slepen) boven het apparaat. strip: idem, maar ook met de muis op het hele apparaat.
   Aanraking: tikken op de strook (of Enter/spatie) zet hem vast open of dicht; een kabel boven het apparaat opent hem ook.
   ===================================================================== */
function open(r,on,why){ const was=r.el.hasAttribute('data-pk-ports-open'); if(!!on===was) return; r.el.toggleAttribute('data-pk-ports-open',!!on); if(r.portsEl) r.portsEl.setAttribute('aria-expanded',on?'true':'false'); PK.drawCables(); }
const want=r=>!!(r.skPinned||r.skHov||r.skWire||(r.portsEl&&r.portsEl.contains(document.activeElement)&&r.skFocusOpen));
const sync=r=>open(r,want(r));
function skPortsOn(r,mode){ skPortsOff(r); const el=r.portsEl; if(!el) return; r.skPortsMode=mode; r.el.setAttribute('data-pk-ports',mode);
  if(mode==='bar'){ const bar=r.el.querySelector(':scope > .bar'), ver=bar&&bar.querySelector('select.ver'); if(bar&&el.parentNode!==bar){ r.skPortsHome=el.parentNode; bar.insertBefore(el,ver||null); } PK.drawCables(); return; }   // de poorten wonen als stipjes in de titelbalk, tussen naam en versiekeuze
  if(mode==='always') return;
  el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-expanded','false'); el.setAttribute('aria-label',PK.pkt('m.sk_poorten_aria'));
  const L=[]; const on=(t,ev,fn)=>{ t.addEventListener(ev,fn); L.push([t,ev,fn]); };
  const hoverTarget=mode==='strip'?r.el:el;
  on(hoverTarget,'pointerenter',e=>{ if(e.pointerType!=='mouse') return; r.skHov=true; sync(r); }); on(hoverTarget,'pointerleave',e=>{ if(e.pointerType!=='mouse') return; r.skHov=false; sync(r); });
  on(el,'click',e=>{ if(e.target.closest('.port')) return; r.skPinned=!r.skPinned; sync(r); });
  on(el,'keydown',e=>{ if(e.target!==el) return; if(e.key==='Enter'||e.key===' '){ e.preventDefault(); r.skPinned=!r.skPinned; sync(r); } else if(e.key==='Escape'&&r.skPinned){ r.skPinned=false; sync(r); } });
  on(el,'focus',()=>{ if(el.matches(':focus-visible')){ r.skFocusOpen=true; sync(r); } }); on(el,'blur',()=>{ r.skFocusOpen=false; sync(r); });
  r.skPL=L; PK.drawCables(); } PK.skPortsOn=skPortsOn;
function skPortsOff(r){ (r.skPL||[]).forEach(([t,ev,fn])=>t.removeEventListener(ev,fn)); r.skPL=null; if(r.skPortsHome){ r.skPortsHome.insertBefore(r.portsEl,r.skPortsHome.firstChild); r.skPortsHome=null; } if(!r.skPortsMode&&!r.el.hasAttribute('data-pk-ports')) return;
  r.skPortsMode=null; r.skPinned=r.skHov=r.skWire=r.skFocusOpen=false; r.el.removeAttribute('data-pk-ports'); r.el.removeAttribute('data-pk-ports-open');
  const el=r.portsEl; if(el){ ['tabindex','role','aria-expanded','aria-label'].forEach(a=>el.removeAttribute(a)); } PK.drawCables(); } PK.skPortsOff=skPortsOff;
// kabel slepen: de kaart onder de aanwijzer en de bronkaart houden hun poorten open (alleen kaarten met modus hover of strip)
function skPortsWire(cx,cy){ const wiring=!!PK.wire; let under=null; if(wiring){ const e=document.elementFromPoint(cx,cy); under=e&&e.closest?e.closest('.card'):null; }
  PK.Host.devices.forEach((r,id)=>{ if(!r.skPortsMode||r.skPortsMode==='always') return; const w=wiring&&((under&&under===r.el)||(PK.wire.src&&PK.wire.src.id===id)); if(!!r.skWire!==w){ r.skWire=w; sync(r); } }); } PK.skPortsWire=skPortsWire;
// een tik buiten de poorten laat een vastgezette strook los
document.addEventListener('pointerdown',e=>{ PK.Host.devices.forEach(r=>{ if(r.skPinned&&r.portsEl&&!r.portsEl.contains(e.target)){ r.skPinned=false; sync(r); } }); },true);
})(window.__PK);
