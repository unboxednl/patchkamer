// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.9.0 — Patchkamer contract v1.9 (gevalideerd met validate-instrument v1.10). Nieuwe naam Speakers en id nl.patchkamer.speakers; poorten ongewijzigd.
//   - setState volgt nu het contract (§13): onbekende velden worden genegeerd, een ontbrekende of ongeldige lvl wordt de standaard (0.8), lvl blijft tussen 0 en 1
//   - setState zet het volume zacht (setTargetAtTime), zodat een preset tijdens het spelen niet knakt
// 1.8.0 — Patchkamer contract v1.8: de host geeft elke schuif dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// Speakers — naar de luidsprekers, met begrenzer en meter · Patchkamer contract v1.9
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export default {
  id:'nl.patchkamer.speakers', name:'Speakers', version:'1.9.0', category:'mix', kind:'output',
  ports:{audioIn:[{id:'in',name:'In'}],audioOut:[],eventIn:[],eventOut:[]},
  create(ctx,host){
    const inG=ctx.createGain(), lim=ctx.createDynamicsCompressor(), an=ctx.createAnalyser(); lim.threshold.value=-3; lim.ratio.value=12; lim.knee.value=0; lim.attack.value=0.002; an.fftSize=512;
    inG.connect(lim).connect(an).connect(ctx.destination);
    const state={lvl:0.8}; inG.gain.value=state.lvl; let bar, raf, knob, data=new Uint8Array(512), vis=true, io=null;
    function tick(){ if(!bar) return; an.getByteTimeDomainData(data); let pk=0; for(let i=0;i<data.length;i++) pk=Math.max(pk,Math.abs(data[i]-128)/128); const wv=Math.round(pk*100)+'%'; if(bar.style.width!==wv) bar.style.width=wv; }
    const self={
      inputs:{in:inG}, outputs:{},
      mount(el){ knob=host.ui.knob(el,'Volume',[0,1,0.01],state.lvl,v=>Math.round(v*100)+'%',v=>{state.lvl=v; inG.gain.setTargetAtTime(v,ctx.currentTime,0.02);}); const m=document.createElement('div'); m.className='meter'; bar=document.createElement('i'); m.appendChild(bar); el.appendChild(m); if(host&&typeof host.frame==='function'&&self._id) raf=host.frame(self,tick,30); else { let last=0; const f=t=>{ if(!bar) return; io=requestAnimationFrame(f); if(document.hidden||t-last<31) return; last=t; tick(); }; io=requestAnimationFrame(f); raf=()=>cancelAnimationFrame(io); } },
      unmount(){ if(typeof raf==='function') raf(); raf=null; bar=null;},
      getState(){return {...state};}, setState(s){ state.lvl=typeof (s&&s.lvl)==='number'&&Number.isFinite(s.lvl)?clamp(s.lvl,0,1):0.8; inG.gain.setTargetAtTime(state.lvl,ctx.currentTime,0.02); if(knob) knob.set(state.lvl); },
      destroy(){ if(typeof raf==='function') raf(); raf=null; bar=null; inG.disconnect(); an.disconnect();}
    };
    return self;
  }
};
