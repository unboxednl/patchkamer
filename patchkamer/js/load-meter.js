// js/load-meter.js — laten zien of de audiodraad het bijhoudt (realtime-snelheid van de audioklok)
(function(PK){
/* Alle apparaten worden op één realtime-draad van de browser uitgerekend. Haalt die draad een bufferblok niet op tijd, dan hapert het geluid en loopt de audioklok
   (ctx.currentTime telt alleen blokken die echt klaar waren) achter op de wandklok. De host vergelijkt elke seconde beide klokken over de laatste drie seconden:
   100 % = de draad houdt het bij; eronder ontbreekt zoveel geluid per seconde. Dit meldt dus pas iets bij (bijna) vol, niet de ruimte die er nog is.
   AudioRenderCapacity zou dat wel kunnen, maar bestaat in de browsers niet (Chrome heeft hem niet uitgerold). De host leest alleen; hij verandert niets aan het geluid.
   Zichtbaar op twee plekken: de regel Realtime in het menu en het lampje #loadLamp naast Start (alleen bij haperingen, 6 s lang). */
const WARN=0.97, HIGH=0.9, STALE=3500, KEEP=6000, WIN=3, WARM=2;   // onder WARN: haperingen; onder HIGH: ernstig; ms zonder meting; ms dat het lampje blijft; seconden venster; seconden opstart die niet meetellen (de eerste blokken na Start zijn altijd traag)
let ring=[], last=null, lastAt=0, hot=0, ctxSeen=null, runSince=0;
const pct=x=>Math.round(x*100)+' %';
const COL={lo:'var(--go)',mid:'var(--event)',hi:'var(--stop)'};
const level=r=>r<HIGH?'hi':r<WARN?'mid':'lo';
function sample(){
  const c=PK.Host.ctx; if(!c||c.state!=='running'||document.hidden){ ring=[]; runSince=0; return; }
  if(c!==ctxSeen){ ctxSeen=c; ring=[]; runSince=0; }
  const now=performance.now()/1000, t=c.currentTime; if(!runSince) runSince=now; if(now-runSince<WARM) return; ring.push([now,t]); if(ring.length>WIN+1) ring.shift();
  if(ring.length>=3){ const a=ring[0], b=ring[ring.length-1], dw=b[0]-a[0]; if(dw>=1.5){ last=Math.min(1,Math.max(0,(b[1]-a[1])/dw)); lastAt=Date.now(); } }
}
function paint(){
  const out=document.getElementById('loadVal'), lamp=document.getElementById('loadLamp'), now=Date.now(), fresh=last!==null&&now-lastAt<=STALE;
  if(out){
    if(!fresh){ out.textContent='–'; out.style.color=''; out.title=PK.pkt('m.belasting_geen_meting'); }
    else{ out.textContent=pct(last); out.style.color=COL[level(last)]; out.title=PK.pkt('m.belasting_titel',pct(last),Math.round((1-last)*1000)); }
  }
  if(lamp){
    if(fresh&&level(last)!=='lo') hot=now;
    const show=hot&&now-hot<KEEP; if(lamp.hidden===show) lamp.hidden=!show;
    if(show&&fresh){ const t=pct(last); if(lamp.textContent!==t) lamp.textContent=t; lamp.title=PK.pkt('m.belasting_lamp',pct(last),Math.round((1-last)*1000)); lamp.setAttribute('aria-label',lamp.title); }
  }
}
PK.loadRatio=()=>last;
setInterval(()=>{ sample(); paint(); },1000);
paint();
})(window.__PK);
