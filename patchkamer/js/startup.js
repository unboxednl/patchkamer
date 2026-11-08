// js/startup.js — startscherm met voortgang bij het opstarten: logo, versie, balk en wat er nu geladen wordt (bronnen, bibliotheken, werkruimte)
(function(PK){
/* =====================================================================
   STARTSCHERM · zweeft boven het canvas (in #room), met schaduw zoals de kaarten, en verdwijnt vanzelf als alles geladen is.
   Je kunt het ook wegklikken (klik, ✕ of Escape); het laden gaat dan gewoon door.
   Stappen: elke onthouden bron, dan de bibliotheken van Instellingen (devices, presets, tunes, skins, samples), dan de werkruimte.
   Binnen een stap melden de laadlussen (sources, tunes, skins, samples) via PK.loadNote(klaar, totaal, naam) hoe ver ze zijn.
   Alleen een weergave: het laden zelf (loadSource, wsaLoad) en de volgorde zijn die van vroeger.
   ===================================================================== */
const KINDS=['dev','pre','tun','ski','sam'];
function startupBegin(){
  const S={el:null,bar:null,txt:null,ver:null,idx:-1,total:PK.SOURCES.length+1,label:'',warns:0,gone:false,frac:0};
  const kindsOn=()=>KINDS.filter(k=>PK.WSA[k]&&PK.WSA[k].on);
  if(PK.WSA_START.always) S.total+=kindsOn().length;
  const something=PK.SOURCES.length>0||kindsOn().length>0;
  function paint(){ if(!S.el) return; const p=Math.min(1,Math.max(0,(Math.max(S.idx,0)+S.frac)/S.total)); S.bar.style.width=(p*100).toFixed(1)+'%'; S.el.setAttribute('aria-valuenow',String(Math.round(p*100))); }
  function say(t){ if(S.txt) S.txt.textContent=t; }
  function build(){
    const el=document.createElement('div'); el.id='splash'; el.setAttribute('role','progressbar'); el.setAttribute('aria-valuemin','0'); el.setAttribute('aria-valuemax','100'); el.setAttribute('aria-valuenow','0'); el.setAttribute('aria-label','Patchkamer');
    el.innerHTML='<button type="button" class="spx"></button><div class="spmark"><img src="icons/icon-192.png" alt="" width="96" height="96"><div class="spname"><h1 class="splogo"><b>Patch</b>kamer</h1><div class="spver">&nbsp;</div></div></div><div class="spbar"><i></i></div><div class="sptxt" aria-live="polite"></div>';
    const x=el.querySelector('.spx'); x.textContent='×'; x.title=PK.pkt('m.su_sluiten'); x.setAttribute('aria-label',PK.pkt('m.su_sluiten'));
    el.addEventListener('click',()=>S.close()); S.key=e=>{ if(e.key==='Escape'&&S.el) S.close(); }; document.addEventListener('keydown',S.key);
    S.el=el; S.bar=el.querySelector('.spbar i'); S.txt=el.querySelector('.sptxt'); S.ver=el.querySelector('.spver'); (PK.$('room')||document.body).appendChild(el);
    say(PK.pkt('m.su_start'));
    fetch('version.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ if(j&&typeof j.version==='string'&&/^[0-9A-Za-z.+-]{1,32}$/.test(j.version)&&S.ver) S.ver.textContent=PK.pkt('m.su_versie',j.version); }).catch(()=>{}); }
  S.step=label=>{ S.idx++; S.frac=0; S.label=label; say(label); paint(); };
  S.note=(done,total,name)=>{ if(!S.el||!(total>0)) return; S.frac=Math.min(1,done/total); say(S.label+' · '+PK.pkt('m.su_telt',done+1,total)+(name?' · '+name:'')); paint(); };
  S.warn=()=>{ S.warns++; };
  // de bibliotheken van Instellingen (alleen als ze aan staan); elk is een stap met eigen voortgang
  S.auto=async()=>{ const ks=kindsOn(); if(!PK.WSA_START.always) S.total+=ks.length;
    for(const k of ks){ S.step(PK.pkt('m.su_laden_'+k)); try{ const src=await PK.wsaLoad(k,false); const st=src&&PK.SRCSTATE.get(src.sid); if(st&&st.state==='err') S.warn(); }catch(e){ S.warn(); } } };
  S.finish=()=>{ PK.loadNote=null; if(!S.el){ return; } S.idx=S.total; S.frac=0; paint(); say(S.warns?PK.pkt('m.su_klaar_let_op'):PK.pkt('m.su_klaar')); setTimeout(()=>S.close(),S.warns?2800:700); };
  S.close=()=>{ if(S.gone||!S.el) return; S.gone=true; PK.loadNote=null; document.removeEventListener('keydown',S.key); const el=S.el; el.classList.add('out'); setTimeout(()=>el.remove(),400); };
  if(PK.WSA_START.splash&&something){ build(); PK.loadNote=S.note; }
  return S;
}
PK.startupBegin=startupBegin;
})(window.__PK);
