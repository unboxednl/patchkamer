// js/rec-lamp.js — rood lampje met de opnametijd naast Start (contract v1.25, §13h): host.recording(inst, on)
(function(PK){
/* Een apparaat dat opneemt (de Recorder) meldt het met host.recording(this, true) en bij het stoppen met host.recording(this, false).
   De host onthoudt per apparaat het moment van de melding en toont het oudste lopende apparaat: een lampje dat langzaam knippert en de
   tijd als mm:ss (boven het uur gewoon doortellen: 75:03). Een klik op lampje of tijd schuift het hele canvas zodat dat apparaat midden in beeld staat
   (het apparaat zelf blijft staan, de zoom ook). Een apparaat dat verdwijnt zonder af te melden, valt vanzelf weg. */
const REC=new Map();   // id -> tijdstip van de melding
let T=0;
const el=()=>PK.$('recLamp');
const fmt=ms=>{ const s=Math.max(0,Math.floor(ms/1000)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
function first(){ let best=null; REC.forEach((t,id)=>{ if(!PK.Host.devices.has(id)){ REC.delete(id); return; } if(!best||t<best.t) best={id,t}; }); return best; }
function paint(){ const b=el(); if(!b) return; const f=first(); b.hidden=!f;
  if(!f){ clearInterval(T); T=0; return; }
  const txt=fmt(Date.now()-f.t), s=b.querySelector('.t'); if(s.textContent!==txt) s.textContent=txt;
  const r=PK.Host.devices.get(f.id); b.title=PK.pkt('m.reclamp_titel',r?r.def.name:'',txt); b.setAttribute('aria-label',b.title);
  if(!T) T=setInterval(paint,250); }
PK.Host.recording=function(inst,on){ const id=inst&&inst._id; if(!id||!PK.Host.devices.has(id)) return false;
  if(on){ if(!REC.has(id)) REC.set(id,Date.now()); } else REC.delete(id); paint(); return true; };
// het canvas schuift; het apparaat en de zoom blijven zoals ze zijn
function show(){ const f=first(); if(!f) return; const r=PK.Host.devices.get(f.id); if(!r) return; PK.select(f.id);
  const wr=PK.floorwrap.getBoundingClientRect(), s=PK.Host.view.scale, w=r.el.offsetWidth||300, h=r.el.offsetHeight||200, cx=r.x+w/2, cy=r.y+Math.min(h,wr.height/s)/2;
  PK.viewTo(wr.width/2-cx*s,wr.height/2-cy*s,s); }
PK.recLampInit=function(){ const b=el(); if(b) b.addEventListener('click',show); };
})(window.__PK);
