// js/clock.js — klok (lookahead-scheduler), start en stop
(function(PK){
/* =====================================================================
   CLOCK (lookahead scheduler)
   ===================================================================== */
let pos=0, nextT=0, timer=null;
function pkScheduler(){
  if(!PK.Host.running) return; const ctx=PK.Host.ctx, now=ctx.currentTime, sd=PK.Host.stepDur();
  while(nextT<now+0.1){ const step=pos%16, bar=Math.floor(pos/16), time=nextT+(step%2?sd*PK.Host.swing:0);
    const info={step,bar,time:Math.max(time,now+0.001),stepDur:sd,bpm:PK.Host.bpm,swing:PK.Host.swing};
    PK.Host.stepSubs.forEach(inst=>{ try{ inst.onStep(info); }catch(e){ console.warn(inst._def?.name,e); } });
    const ids=[...PK.Host.devices.values()]; setTimeout(()=>{ids.forEach(r=>{ if(r.inst.onStep){ r.el.classList.add('active'); setTimeout(()=>r.el.classList.remove('active'),60);} });},Math.max(0,(time-now)*1000));
    pos++; nextT+=sd; }
  timer=setTimeout(pkScheduler,25);
}
async function start(){ const ctx=PK.ensureCtx(); if(ctx.state==='suspended') await ctx.resume(); PK.Host.running=true; pos=0; nextT=ctx.currentTime+0.05; PK.Host.devices.forEach(r=>r.inst.onTransport&&r.inst.onTransport({playing:true})); pkScheduler(); PK.$('play').textContent=PK.pkt('m.stop'); PK.$('play').classList.add('on'); } PK.start=start;
function pkStop(){ PK.Host.running=false; clearTimeout(timer); PK.Host.devices.forEach(r=>r.inst.onTransport&&r.inst.onTransport({playing:false})); PK.$('play').textContent=PK.pkt('m.start'); PK.$('play').classList.remove('on'); } PK.pkStop=pkStop;
})(window.__PK);
