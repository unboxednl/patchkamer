// js/render.js — Snel opnemen: het lied zonder geluid en sneller dan realtime opnemen in de Multitrack
(function(PK){
/* =====================================================================
   SNEL OPNEMEN
   De knop naast Start zet de werkruimte in een verborgen kopie van de host (een iframe met dezelfde bestanden). Die kopie krijgt geen echte
   audiouitgang maar een OfflineAudioContext (js/render-boot.js) en een virtuele klok: setTimeout, setInterval, Date.now en performance.now
   lopen mee met de audiotijd, en de host stapt in blokjes van 25 ms door het lied (suspend/resume). De apparaten merken geen verschil; ze
   plannen zoals live, alleen sneller dan de klok. Het lied klinkt niet uit je luidsprekers en de zichtbare host blijft gewoon bruikbaar.
   Een apparaat dat opneemt (nu de Multitrack) biedt drie methoden aan; de host zoekt ze op naam (zie devices/tools/Multitrack/AGENTS.md):
     offlineRecord({at,frames}) → Promise  neemt precies `frames` frames op vanaf audiotijd `at` (sample-exact)
     offlineTake()              → Promise  de opgenomen take: {name,frames,sr,tracks:[{i,name,from,L:[Float32Array],R:[Float32Array]}]}
     offlineAdd(take)                      zet zo'n take in de takelijst van het apparaat in de gewone host
   De kopie bewaart niets: opslag staat daar op alleen-lezen. Alleen de take komt terug.
   ===================================================================== */
const CFG=window.__PK_RENDER;
const ORIGIN=location.origin==='null'?'*':location.origin;
const recorders=()=>[...PK.Host.devices.values()].filter(r=>r.inst&&typeof r.inst.offlineRecord==='function');

/* ---------------------------------------------------------------------
   De kopie (iframe): werkruimte openen, virtuele klok, opnemen, take terugsturen
   --------------------------------------------------------------------- */
function child(){
  const par=window.parent, post=(m,tr)=>par.postMessage(Object.assign({pkRender:m.kind},m),ORIGIN,tr||[]);
  window.addEventListener('message',async e=>{ if(e.source!==par||!e.data||e.data.pkRender!=='run') return;
    try{ await go(e.data); }catch(err){ console.warn('snel opnemen',err); post({kind:'error',msg:String(err&&err.message||err)}); } });
  const yieldNow=(()=>{ const mc=new MessageChannel(); return ()=>new Promise(r=>{ mc.port1.onmessage=()=>r(); mc.port2.postMessage(0); }); })();   // geen setTimeout: dat wordt in een achtergrondtab vertraagd

  async function go(d){
    const real={now:performance.now.bind(performance),setTimeout:window.setTimeout.bind(window)};
    // virtuele klok vanaf het begin: ook de timers die apparaten bij het maken starten lopen mee met de audiotijd (anders hangt de opname af van de wandklok)
    const Q=[]; let seq=0, ctxRef=null; const vnow=()=>(ctxRef?ctxRef.currentTime:0)*1000, t0=real.now(), d0=Date.now();
    window.setTimeout=(fn,ms=0,...a)=>{ const id=++seq; Q.push({id,due:vnow()+Math.max(0,+ms||0),fn:()=>fn(...a),seq:id}); return id; };
    window.setInterval=(fn,ms=0,...a)=>{ const id=++seq, p=Math.max(1,+ms||1); Q.push({id,due:vnow()+p,fn:()=>fn(...a),seq:id,every:p}); return id; };
    window.clearTimeout=window.clearInterval=id=>{ const i=Q.findIndex(x=>x.id===id); if(i>=0) Q.splice(i,1); };
    performance.now=()=>t0+vnow(); Date.now=()=>d0+vnow();
    await PK.openWorkspace(d.ws);
    await new Promise(r=>real.setTimeout(r,400));   // worklets en bestanden van de apparaten laden echt en hebben even nodig
    const recs=recorders(); if(!recs.length) throw new Error(PK.pkt('m.snelopname_geen_recorder'));
    const ctx=PK.ensureCtx(); ctxRef=ctx; const sr=ctx.sampleRate, frames=Math.round(d.len*sr), PRE=1;   // de eerste seconde is inlooptijd: apparaten rondden hun eigen timers af, daarna begint de klok

    const STEP=0.025, total=ctx.length/sr, R=OfflineAudioContext.prototype.resume; let started=false, stopped=false, stopAt=0, lastP=0, errs=0;
    const tick=async()=>{ const t=ctx.currentTime;
      if(!started&&t>=PRE){ started=true; const at=ctx.currentTime+0.05; stopAt=at+d.songEnd; await Promise.all(recs.map(r=>r.inst.offlineRecord({at,frames}))); await PK.start(); }   // de klok begint op audiotijd + 0,05 (zie js/clock.js), de opname op hetzelfde moment; eerst de opname, zodat een Multitrack met 'met klok' niet zelf nog een keer begint
      if(started&&!stopped&&t>=stopAt){ stopped=true; try{ PK.pkStop(); }catch(e){ errs++; } }
      for(let g=0;g<20000;g++){ Q.sort((a,b)=>a.due-b.due||a.seq-b.seq); if(!Q.length||Q[0].due>t*1000+1e-6) break; const it=Q.shift(); if(it.every){ it.due+=it.every; Q.push(it); }
        try{ const r=it.fn(); if(r&&r.then) await r; }catch(e){ errs++; console.warn('timer',e); } }
      await yieldNow();
      const nr=real.now(); if(nr-lastP>250){ lastP=nr; post({kind:'progress',t}); }
      const next=Math.ceil((t+STEP)*sr/128)*128/sr;
      if(next<total-0.01) ctx.suspend(next).then(tick);
      R.call(ctx); };
    ctx.suspend(Math.ceil(STEP*sr/128)*128/sr).then(tick);
    const w0=real.now(), buf=await ctx.startRendering(); const wall=(real.now()-w0)/1000;
    const out=[], tr=[];
    for(const r of recs){ const take=await Promise.race([r.inst.offlineTake(),new Promise(res=>real.setTimeout(()=>res(null),8000))]);
      if(take){ out.push({def:r.def.id,take}); take.tracks.forEach(t=>{ tr.push(t.L.buffer,t.R.buffer); }); } else out.push({def:r.def.id,take:null}); }
    post({kind:'done',takes:out,stats:{wall,dur:buf.duration,errs:errs+(window.__PK_RENDER_ERRS||[]).length}},tr);
  }
  post({kind:'hello'});
}

/* ---------------------------------------------------------------------
   De zichtbare host: knop, vraag, voortgang, take ontvangen
   --------------------------------------------------------------------- */
function parent(){
  const btn=PK.$('renderBtn'); if(!btn) return;
  let job=null;   // {frame, t0, len}
  const fmt=s=>{ s=Math.max(0,Math.round(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const parseT=v=>{ v=String(v||'').trim().replace(',','.'); const m=/^(\d+):(\d{1,2}(?:\.\d+)?)$/.exec(v); if(m) return (+m[1])*60+(+m[2]); const n=parseFloat(v); return n>0?n:0; };
  // lengte van het lied volgens de Clip Arranger (als die in songmodus staat): maten × 16 stappen
  function songSeconds(){ let best=0;
    PK.Host.devices.forEach(r=>{ if(r.def.id!=='nl.patchkamer.cliparranger'||!r.inst.getState) return;
      try{ const s=r.inst.getState(); if(s&&s.mode==='song'&&Array.isArray(s.arrangement)){ const bars=s.arrangement.reduce((a,x)=>a+(+x.bars||0)*Math.max(1,+x.repeats||1),0); best=Math.max(best,bars*16*PK.Host.stepDur()); } }catch(e){} });
    return best; }
  function finish(msg,err){ if(!job) return; try{ job.frame.remove(); }catch(e){} window.removeEventListener('message',job.onmsg); job=null; btn.classList.remove('on'); btn.textContent=PK.pkt('ui.snel_opnemen'); btn.title=PK.pkt('attr.snel_opnemen'); if(msg) PK.status(msg,!!err); }
  async function ask(){
    const recs=recorders(), s=songSeconds(), def=s?Math.ceil(s)+4:120;
    const names=recs.map(r=>PK.esc(r.def.name)).join(', ');
    const p=PK.askUser(`<b>${PK.esc(PK.pkt('ui.snel_opnemen'))}</b><br>${PK.pkt('m.snelopname_vraag',names)}<br><br>`+
      `<label>${PK.esc(PK.pkt('m.snelopname_lengte'))} <input id="rdLen" value="${fmt(def)}" size="6" style="width:6em"></label><br>`+
      `<label>${PK.esc(PK.pkt('m.snelopname_einde'))} <input id="rdEnd" value="${s?fmt(s):''}" placeholder="${PK.esc(PK.pkt('m.snelopname_einde_ph'))}" size="12" style="width:10em"></label><br>`+
      `<small>${PK.esc(PK.pkt('m.snelopname_uitleg'))}</small>`,PK.pkt('m.snelopname_ok'),PK.pkt('m.snelopname_annuleer'));
    const iLen=document.getElementById('rdLen'), iEnd=document.getElementById('rdEnd');
    if(!(await p)) return null;
    const len=parseT(iLen&&iLen.value); if(!(len>=1)) return null;
    const end=parseT(iEnd&&iEnd.value); return {len:Math.min(len,3600),songEnd:end>0&&end<len?end:len}; }
  async function go(){
    if(job){ finish(PK.pkt('m.snelopname_afgebroken')); return; }
    if(!recorders().length){ PK.status(PK.pkt('m.snelopname_geen_recorder'),true); return; }
    if(PK.Host.running){ PK.status(PK.pkt('m.snelopname_stop_eerst'),true); return; }
    const o=await ask(); if(!o) return;
    const ctx=PK.ensureCtx(), cfg={dur:o.len+1.3,sr:ctx.sampleRate};   // 1 s inlooptijd, 0,05 s aanloop van de klok en wat marge
    const frame=document.createElement('iframe'); frame.name='pk-render:'+JSON.stringify(cfg); frame.setAttribute('aria-hidden','true'); frame.tabIndex=-1; frame.style.cssText='display:none';
    const t0=performance.now(); let ws; try{ ws=PK.workspaceState(true); }catch(e){ PK.status(PK.pkt('m.snelopname_mislukt',e.message),true); return; }
    const onmsg=e=>{ if(!job||e.source!==frame.contentWindow||!e.data||!e.data.pkRender) return; const d=e.data;
      if(d.kind==='hello') frame.contentWindow.postMessage({pkRender:'run',ws,len:o.len,songEnd:o.songEnd},ORIGIN);
      else if(d.kind==='progress'){ const p=Math.min(99,Math.round(Math.max(0,d.t-1)/o.len*100)); btn.title=PK.pkt('m.snelopname_bezig',p,fmt(d.t),fmt(o.len)); PK.status(btn.title,false); }
      else if(d.kind==='error') finish(PK.pkt('m.snelopname_mislukt',d.msg),true);
      else if(d.kind==='done'){ const wall=(performance.now()-t0)/1000; let n=0, got=0; const seen=new Map();
        d.takes.forEach(x=>{ const k=seen.get(x.def)||0; seen.set(x.def,k+1); const r=recorders().filter(q=>q.def.id===x.def)[k]; if(r&&x.take){ try{ r.inst.offlineAdd(x.take); got++; }catch(er){ console.warn(er); } } n++; });
        if(!got) finish(PK.pkt('m.snelopname_leeg'),true);
        else finish(PK.pkt('m.snelopname_klaar',fmt(o.len),fmt(wall),(o.len/wall).toFixed(1))+(d.stats.errs?PK.pkt('m.snelopname_fouten',d.stats.errs):'')); } };
    job={frame,onmsg}; window.addEventListener('message',onmsg);
    btn.classList.add('on'); btn.textContent=PK.pkt('m.snelopname_annuleer'); PK.status(PK.pkt('m.snelopname_bezig',0,'0:00',fmt(o.len)),false);
    frame.src=location.href.split('#')[0].split('?')[0]; document.body.appendChild(frame);
  }
  btn.onclick=go;
  btn.title=PK.pkt('attr.snel_opnemen');
}
if(CFG) child(); else parent();
})(window.__PK);
