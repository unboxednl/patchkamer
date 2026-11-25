// js/master-volume.js — master volume in de bovenste balk: het volume van de Speakers op het canvas
(function(PK){
/* Staat er minstens één Speakers (nl.patchkamer.speakers) op het canvas, dan verschijnt naast Swing een schuif Volume. Hij toont het hoogste volume van alle Speakers
   en zet bij slepen allemaal mee, in dezelfde verhouding (twee Speakers op 80 % en 40 % blijven een verhouding van 2 : 1). Het volume zelf blijft van het apparaat: de host
   leest en schrijft alleen via getState en setState, dus de regelaar op de kaart, een preset en de werkruimte blijven gelijk lopen. Zonder Speakers is de schuif verborgen. */
const ID='nl.patchkamer.speakers', POLL=400, HOLD=600;
let lastInput=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function speakers(){ const out=[]; PK.Host.devices.forEach(r=>{ if(r&&r.def&&r.def.id===ID&&!r.pvw&&r.inst&&typeof r.inst.getState==='function'&&typeof r.inst.setState==='function') out.push(r); }); return out; }
const lvlOf=r=>{ try{ const v=r.inst.getState().lvl; return typeof v==='number'&&Number.isFinite(v)?clamp(v,0,1):0.8; }catch(e){ return 0.8; } };
function paint(){
  const box=PK.$('masterTp'), sl=PK.$('masterVol'); if(!box||!sl) return;
  const list=speakers(); if(box.hidden===!!list.length) box.hidden=!list.length;
  if(!list.length||Date.now()-lastInput<HOLD) return;   // tijdens het slepen niet terugschrijven
  const top=Math.max(...list.map(lvlOf)); if(Math.abs(+sl.value-top)>0.005) sl.value=top;
  const t=Math.round(top*100)+'%'; if(sl.dataset.v!==t){ sl.dataset.v=t; sl.title=PK.pkt('m.master_volume_titel',t,list.length); }
}
function apply(v){
  const list=speakers(); if(!list.length) return; lastInput=Date.now();
  const cur=list.map(lvlOf), top=Math.max(...cur);
  list.forEach((r,i)=>{ const to=top<0.001?v:clamp(cur[i]*v/top,0,1); try{ r.inst.setState({ ...r.inst.getState(), lvl:to }); }catch(e){ console.warn('master volume',r.def.name,e); } });
}
PK.masterVolumeInit=function(){ const sl=PK.$('masterVol'); if(sl) sl.addEventListener('input',()=>apply(+sl.value)); paint(); };
setInterval(paint,POLL);
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',PK.masterVolumeInit); else PK.masterVolumeInit();
})(window.__PK);
