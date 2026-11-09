// js/latency.js — vertraging van apparaten tonen (contract v1.34, §13j): latency() en host.latencyChanged
(function(PK){
/* Een apparaat dat het geluid vertraagt (lookahead, oversampling, een korrelmotor) meldt dat met de optionele methode latency() (seconden).
   De host COMPENSEERT NIET: hij laat de vertraging alleen zien, op de titelbalk van de kaart en in de tekst bij een kabel ("vertraging tot hier").
   Waarom niet compenseren: de host weet niet welke takken bedoeld zijn om weer samen te komen (Mixer, sends, groepen) en welke niet; een extra vertraging
   in elke parallelle tak kan een terugkoppelingslus of een tempo-gesynchroniseerd apparaat breken; en de waarde mag tijdens het spelen veranderen. */
const MAX=10;   // seconden; meer is geen vertraging maar een fout
function secOf(r){ const f=r&&r.inst&&r.inst.latency; if(typeof f!=='function') return 0;
  try{ const x=f.call(r.inst); return typeof x==='number'&&Number.isFinite(x)&&x>0?Math.min(x,MAX):0; }catch(e){ return 0; } }
PK.latencyOf=secOf;
// tekst voor een vertraging in seconden: "0,7 ms", "12 ms", "1,3 s"
function fmt(s){ const ms=s*1000, c=x=>PK.PK_LANG==='nl'?x.replace('.',','):x; if(ms>=1000) return c((ms/1000).toFixed(2))+' s'; if(ms>=10) return Math.round(ms)+' ms'; return c(ms.toFixed(1))+' ms'; }
PK.latencyFmt=fmt;
const sr=()=>{ try{ return PK.Host.ctx&&PK.Host.ctx.sampleRate||48000; }catch(e){ return 48000; } };
function paint(r){ if(!r||!r.el) return; const b=r.el.querySelector('.bar .lat'); if(!b) return; const s=secOf(r), t=s>=0.00005?fmt(s):'';
  if(b.textContent!==t){ b.textContent=t; b.hidden=!t; b.title=t?PK.pkt('m.latency_titel',t,Math.round(s*sr())):''; b.setAttribute('aria-label',t?b.title:''); if(PK.CABTIP&&PK.CABTIP.cable) PK.CABTIP.cable=null; } }
PK.latencyPaint=paint;
// bij het plaatsen van een kaart: alleen een apparaat met latency() krijgt een etiket
PK.latencyInit=function(r){ if(!r||!r.inst||typeof r.inst.latency!=='function') return; const bar=r.el.querySelector('.bar'), dim=bar&&bar.querySelector('.dim'); if(!bar) return;
  const b=document.createElement('span'); b.className='lat'; b.hidden=true; if(dim) dim.after(b); else bar.appendChild(b); paint(r); };
PK.Host.latencyChanged=function(inst){ const r=inst&&inst._id&&PK.Host.devices.get(inst._id); if(!r) return false; paint(r); return true; };
// de langste vertraging langs de audiokabels naar dit apparaat (inclusief zijn eigen), in seconden; lussen worden niet dubbel geteld
function upstream(id,seen){ const r=PK.Host.devices.get(id); if(!r||seen.has(id)) return 0; seen.add(id);
  let best=0; PK.Host.cables.forEach(c=>{ if(c.to.id===id&&(c.kind==='audio'||c.kind==='multi')) best=Math.max(best,upstream(c.from.id,seen)); }); seen.delete(id);
  return best+secOf(r); }
PK.latencyUpTo=function(id){ return upstream(id,new Set()); };
PK.latencyCableText=function(c){ if(!c||(c.kind!=='audio'&&c.kind!=='multi')) return ''; const s=upstream(c.from.id,new Set()); return s>=0.00005?PK.pkt('m.t_kabel_latency',fmt(s)):''; };
// de waarde kan door een regelaar, een preset of een moduleerder veranderen zonder dat het apparaat het meldt: één keer per seconde bijlezen
setInterval(()=>{ if(document.hidden) return; PK.Host.devices.forEach(r=>{ if(r.inst&&typeof r.inst.latency==='function') paint(r); }); },1000);
})(window.__PK);
