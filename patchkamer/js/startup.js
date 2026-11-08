// js/startup.js — startscherm met voortgang bij het opstarten: logo, versie, balk, wat er geladen wordt (Bronnen, Apparaten, Presets, Tunes, Skins, Samples, Werkruimte) en de huidige stap
(function(PK){
/* =====================================================================
   STARTSCHERM · zweeft boven het canvas (in #room), met schaduw zoals de kaarten, en verdwijnt vanzelf als alles geladen is.
   Je kunt het ook wegklikken (klik, ✕ of Escape); het laden gaat dan gewoon door. Zolang het scherm er staat, verbergt #room.splashing de
   kaart van de lege werkruimte eronder.
   Onder de balk staat een rij stappen (Bronnen, Apparaten, Presets, Tunes, Skins, Samples, Werkruimte): wacht, bezig (met teller) of klaar (met aantal),
   daaronder de huidige stap in woorden en het bestand waar hij mee bezig is. Binnen een stap melden de laadlussen (sources, tunes, skins, samples)
   via PK.loadNote(klaar, totaal, naam) hoe ver ze zijn.
   Alleen een weergave: het laden zelf (loadSource, wsaLoad) en de volgorde zijn die van vroeger.
   ===================================================================== */
const KINDS=['dev','pre','tun','ski','sam'];
function startupBegin(){
  const S={el:null,bar:null,txt:null,sub:null,ver:null,chips:new Map(),cur:null,idx:-1,total:PK.SOURCES.length+1,warns:0,gone:false,frac:0};
  const kindsOn=()=>KINDS.filter(k=>PK.WSA[k]&&PK.WSA[k].on);
  if(PK.WSA_START.always) S.total+=kindsOn().length;
  const something=PK.SOURCES.length>0||kindsOn().length>0;
  const room=()=>PK.$('room');
  function paint(){ if(!S.el) return; const p=Math.min(1,Math.max(0,(Math.max(S.idx,0)+S.frac)/S.total)); S.bar.style.width=(p*100).toFixed(1)+'%'; S.pct.textContent=Math.round(p*100)+'%'; S.el.setAttribute('aria-valuenow',String(Math.round(p*100))); }
  function chip(key){ let c=S.chips.get(key); if(c||!S.el) return c;
    const e=document.createElement('span'); e.className='spc'; e.innerHTML='<i></i><b></b><u></u>'; e.querySelector('b').textContent=PK.pkt('m.su_k_'+key); S.chips.set(key,c={e,n:e.querySelector('u'),total:0}); S.el.querySelector('.spsteps').appendChild(e); return c; }
  function mark(key,state,txt){ const c=chip(key); if(!c) return; c.e.dataset.s=state; if(txt!=null) c.n.textContent=txt; }
  function build(){
    const el=document.createElement('div'); el.id='splash'; el.setAttribute('role','progressbar'); el.setAttribute('aria-valuemin','0'); el.setAttribute('aria-valuemax','100'); el.setAttribute('aria-valuenow','0'); el.setAttribute('aria-label','Patchkamer');
    el.innerHTML='<div class="spcard"><button type="button" class="spx"></button><div class="spmark"><img src="icons/icon-192.png" alt="" width="88" height="88"><div class="spname"><h1 class="splogo"><b>Patch</b>kamer</h1><div class="spver"></div></div></div>'
      +'<div class="spprog"><div class="spbar"><i></i></div><span class="sppct">0%</span></div><div class="spsteps"></div>'
      +'<div class="spwell"><div class="sptxt" aria-live="polite"></div><div class="spsub"></div></div><div class="sphint"></div></div>';
    const x=el.querySelector('.spx'); x.textContent='×'; x.title=PK.pkt('m.su_sluiten'); x.setAttribute('aria-label',PK.pkt('m.su_sluiten'));
    el.addEventListener('click',()=>S.close());   // ook een klik naast de kaart S.key=e=>{ if(e.key==='Escape'&&S.el) S.close(); }; document.addEventListener('keydown',S.key);
    S.el=el; S.bar=el.querySelector('.spbar i'); S.txt=el.querySelector('.sptxt'); S.sub=el.querySelector('.spsub'); S.ver=el.querySelector('.spver'); S.pct=el.querySelector('.sppct'); el.querySelector('.sphint').textContent=PK.pkt('m.su_hint'); S.ver.hidden=true; (room()||document.body).appendChild(el); if(room()) room().classList.add('splashing');
    if(PK.SOURCES.length) mark('src','wait'); if(PK.WSA_START.always) kindsOn().forEach(k=>mark(k,'wait'));
    S.txt.textContent=PK.pkt('m.su_start');
    fetch('version.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ if(j&&typeof j.version==='string'&&/^[0-9A-Za-z.+-]{1,32}$/.test(j.version)&&S.ver){ S.ver.textContent=PK.pkt('m.su_versie',j.version); S.ver.hidden=false; } }).catch(()=>{}); }
  const done=key=>{ const c=key&&S.chips.get(key); if(c&&c.e.dataset.s!=='done') mark(key,'done',c.total?String(c.total):''); };
  // een nieuwe stap: de vorige van een andere groep is klaar; label = de zin bij de stap, key = het vakje (src, dev, pre, tun, ski, sam, ws)
  S.step=(label,key)=>{ S.idx++; S.frac=0; if(S.cur&&S.cur!==key) done(S.cur); S.cur=key||null; if(key){ const c=chip(key); if(c&&c.e.dataset.s!=='act'){ mark(key,'act',''); } } if(S.txt) S.txt.textContent=label; if(S.sub) S.sub.textContent=''; paint(); };
  S.note=(klaar,totaal,naam)=>{ if(!S.el||!(totaal>0)) return; S.frac=Math.min(1,klaar/totaal); const c=S.cur&&S.chips.get(S.cur); if(c){ c.total=totaal; c.n.textContent=(klaar+1)+'/'+totaal; }
    if(S.sub) S.sub.textContent=PK.pkt('m.su_telt',klaar+1,totaal)+(naam?' · '+naam:''); paint(); };
  S.warn=()=>{ S.warns++; };
  // de bibliotheken van Instellingen (alleen als ze aan staan); elk is een stap met eigen voortgang
  S.auto=async()=>{ const ks=kindsOn(); if(!PK.WSA_START.always) S.total+=ks.length;
    for(const k of ks){ S.step(PK.pkt('m.su_laden_'+k),k); try{ const src=await PK.wsaLoad(k,false); const st=src&&PK.SRCSTATE.get(src.sid); if(st&&st.state==='err'){ S.warn(); const c=S.chips.get(k); if(c) c.e.dataset.w='1'; } }catch(e){ S.warn(); const c=S.chips.get(k); if(c) c.e.dataset.w='1'; } } };
  S.finish=()=>{ PK.loadNote=null; if(!S.el) return; done(S.cur); S.chips.forEach((c,k)=>{ if(c.e.dataset.s==='wait') c.e.remove(); }); S.idx=S.total; S.frac=0; paint(); S.txt.textContent=S.warns?PK.pkt('m.su_klaar_let_op'):PK.pkt('m.su_klaar'); S.sub.textContent=''; setTimeout(()=>S.close(),S.warns?2800:700); };
  S.close=()=>{ if(S.gone||!S.el) return; S.gone=true; PK.loadNote=null; document.removeEventListener('keydown',S.key); const el=S.el; el.classList.add('out'); if(room()) room().classList.remove('splashing'); setTimeout(()=>el.remove(),400); };
  if(PK.WSA_START.splash&&something){ build(); PK.loadNote=S.note; }
  return S;
}
PK.startupBegin=startupBegin;
})(window.__PK);
