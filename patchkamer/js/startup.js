// js/startup.js — startscherm met voortgang bij het opstarten: logo, versie, balk en per soort wat er geladen wordt (Apparaten, Tunes, Presets, Skins, Samples, Werkruimte)
(function(PK){
/* =====================================================================
   STARTSCHERM · zweeft boven het canvas (in #room), met schaduw zoals de kaarten, en verdwijnt vanzelf als alles geladen is.
   Je kunt het ook wegklikken (klik, ✕ of Escape); het laden gaat dan gewoon door. Zolang het scherm er staat, verbergt #room.splashing de
   kaart van de lege werkruimte eronder.
   Per soort een regel (Apparaten, Tunes, Presets, Skins, Samples, Werkruimte): wacht, bezig (met teller) of klaar (groen vinkje met aantal), en dat vinkje komt
   zodra die soort klaar is, niet pas aan het eind. Een onthouden bron telt mee voor zijn soort (`src.only`; een bron zonder soort voor Apparaten).
   Daaronder de huidige stap in woorden en het bestand waar hij mee bezig is. Binnen een stap melden de laadlussen (sources, tunes, skins, samples)
   via PK.loadNote(klaar, totaal, naam) hoe ver ze zijn.
   Alleen een weergave: het laden zelf (loadSource, wsaLoad) en de volgorde zijn die van vroeger.
   ===================================================================== */
const KINDS=['dev','tun','pre','ski','sam'], KMAP={devices:'dev',tunes:'tun',presets:'pre',skins:'ski',samples:'sam'};
const kindOf=src=>KMAP[src&&src.only]||'dev';
// een wirwar van kabels op de achtergrond, in de kleuren van de echte kabels (audio, events, modulatie, bundels, mastering); vast patroon, geen willekeur per keer
const CABS=['--audio','--event','--mod','--multi','--mastering','--audio','--event','--sel','--audio','--mod'];
function cablesSvg(){ let a=11; const r=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
  // twee rijen aansluitingen (links en rechts, als een patchpaneel) en kabels die daartussen hangen
  const W=1600, H=900, SL=9, ys=Array.from({length:SL},(_,i)=>110+i*(H-220)/(SL-1)), LX=[70,150], RX=[W-150,W-70], parts=[], sock=[];
  const free={L:[],R:[]}; for(const side of ['L','R']) for(let c=0;c<2;c++) for(let i=0;i<SL;i++){ const x=(side==='L'?LX:RX)[c], y=ys[i]; sock.push('<circle class="spsk" cx="'+x+'" cy="'+y.toFixed(0)+'" r="9"/>'); free[side].push({x,y}); }
  const take=side=>{ const l=free[side]; return l.splice(Math.floor(r()*l.length),1)[0]; };
  for(let i=0;i<16;i++){ const p1=take('L'), p2=take('R'), len=p2.x-p1.x, dx=len*(.3+r()*.12), sag=len*(.04+r()*.07)+20+r()*45, c=CABS[i%CABS.length], w=3.5+r()*2, dur=10+r()*10, del=-r()*14, ph=(r()-.5)*10;
    parts.push('<g class="spcab" style="--c:var('+c+');animation-duration:'+dur.toFixed(1)+'s;animation-delay:'+del.toFixed(1)+'s;--ph:'+ph.toFixed(1)+'px">'
      +'<path d="M'+p1.x+' '+p1.y.toFixed(0)+' C'+(p1.x+dx).toFixed(0)+' '+(p1.y+sag).toFixed(0)+' '+(p2.x-dx).toFixed(0)+' '+(p2.y+sag).toFixed(0)+' '+p2.x+' '+p2.y.toFixed(0)+'" stroke-width="'+w.toFixed(1)+'"/>'
      +'<circle cx="'+p1.x+'" cy="'+p1.y.toFixed(0)+'" r="12"/><circle cx="'+p2.x+'" cy="'+p2.y.toFixed(0)+'" r="12"/></g>'); }
  return '<svg class="spcables" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+sock.join('')+parts.join('')+'</svg>'; }
function startupBegin(){
  const S={el:null,bar:null,txt:null,sub:null,ver:null,pct:null,chips:new Map(),cur:null,warns:0,gone:false,frac:0};
  const kindsOn=()=>KINDS.filter(k=>PK.WSA[k]&&PK.WSA[k].on);
  const something=PK.SOURCES.length>0||kindsOn().length>0;
  const room=()=>PK.$('room');
  function paint(){ if(!S.el) return; let n=0,d=0; S.chips.forEach(c=>{ n++; if(c.e.dataset.s==='done') d++; }); const f=S.cur&&S.chips.get(S.cur)&&S.chips.get(S.cur).e.dataset.s==='act'?S.frac:0;
    const p=n?Math.min(1,(d+f)/n):0; S.bar.style.width=(p*100).toFixed(1)+'%'; S.pct.textContent=Math.round(p*100)+'%'; S.el.setAttribute('aria-valuenow',String(Math.round(p*100))); }
  function chip(key){ let c=S.chips.get(key); if(c||!S.el) return c;
    const e=document.createElement('span'); e.className='spc'; e.dataset.s='wait'; e.innerHTML='<i></i><b></b><u></u>'; e.querySelector('b').textContent=PK.pkt('m.su_k_'+key); S.chips.set(key,c={e,n:e.querySelector('u'),total:0});
    // vaste volgorde: Apparaten, Tunes, Presets, Skins, Samples, Werkruimte
    const order=[...KINDS,'ws'], box=S.el.querySelector('.spsteps'), after=[...S.chips.keys()].filter(k=>order.indexOf(k)>order.indexOf(key)).sort((a,b)=>order.indexOf(a)-order.indexOf(b))[0];
    if(after) box.insertBefore(e,S.chips.get(after).e); else box.appendChild(e); return c; }
  function mark(key,state,txt){ const c=chip(key); if(!c) return; c.e.dataset.s=state; if(txt!=null) c.n.textContent=txt; }
  function build(){
    const el=document.createElement('div'); el.id='splash'; el.setAttribute('role','progressbar'); el.setAttribute('aria-valuemin','0'); el.setAttribute('aria-valuemax','100'); el.setAttribute('aria-valuenow','0'); el.setAttribute('aria-label','Patchkamer');
    el.innerHTML=cablesSvg()+'<div class="spcard"><button type="button" class="spx"></button><div class="spmark"><img src="icons/icon-192.png" alt="" width="88" height="88"><div class="spname"><h1 class="splogo"><b>Patch</b>kamer</h1><div class="spver"></div></div></div>'
      +'<div class="spprog"><div class="spbar"><i></i></div><span class="sppct">0%</span></div><div class="spsteps"></div>'
      +'<div class="spwell"><div class="sptxt" aria-live="polite"></div><div class="spsub"></div></div><div class="sphint"></div></div>';
    const x=el.querySelector('.spx'); x.textContent='×'; x.title=PK.pkt('m.su_sluiten'); x.setAttribute('aria-label',PK.pkt('m.su_sluiten'));
    el.addEventListener('click',()=>S.close());   // ook een klik naast de kaart
    S.key=e=>{ if(e.key==='Escape'&&S.el) S.close(); }; document.addEventListener('keydown',S.key);
    S.el=el; S.bar=el.querySelector('.spbar i'); S.txt=el.querySelector('.sptxt'); S.sub=el.querySelector('.spsub'); S.ver=el.querySelector('.spver'); S.pct=el.querySelector('.sppct'); el.querySelector('.sphint').textContent=PK.pkt('m.su_hint'); S.ver.hidden=true;
    (room()||document.body).appendChild(el); if(room()) room().classList.add('splashing');
    new Set([...kindsOn(),...PK.SOURCES.map(kindOf)]).forEach(k=>chip(k)); chip('ws'); S.txt.textContent=PK.pkt('m.su_start'); paint();
    fetch('version.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ if(j&&typeof j.version==='string'&&/^[0-9A-Za-z.+-]{1,32}$/.test(j.version)&&S.ver){ S.ver.textContent=PK.pkt('m.su_versie',j.version); S.ver.hidden=false; } }).catch(()=>{}); }
  const done=key=>{ const c=key&&S.chips.get(key); if(c&&c.e.dataset.s!=='done'){ mark(key,'done',c.total?String(c.total):''); paint(); } };
  // een stap voor een soort (dev, tun, pre, ski, sam, ws): de vorige soort is klaar; een soort die al klaar is blijft klaar
  S.step=(label,key)=>{ if(!S.el) return; const c=key?chip(key):null; if(c&&c.e.dataset.s==='done') return;
    if(S.cur&&S.cur!==key) done(S.cur); S.cur=key||null; S.frac=0; if(c&&c.e.dataset.s!=='act') mark(key,'act',''); S.txt.textContent=label; S.sub.textContent=''; paint(); };
  S.note=(klaar,totaal,naam)=>{ if(!S.el||!(totaal>0)) return; S.frac=Math.min(1,klaar/totaal); const c=S.cur&&S.chips.get(S.cur); if(c){ c.total=totaal; c.n.textContent=(klaar+1)+'/'+totaal; }
    S.sub.textContent=PK.pkt('m.su_telt',klaar+1,totaal)+(naam?' · '+naam:''); paint(); };
  S.warn=key=>{ S.warns++; const c=key&&S.chips.get(key); if(c) c.e.dataset.w='1'; };
  // een onthouden bron telt voor zijn soort; het vinkje komt als er geen latere bron van die soort meer is
  S.src=src=>{ const k=kindOf(src); S.step(PK.pkt('m.su_laden_'+k),k); };
  S.srcEnd=src=>{ if(!S.el) return; const k=kindOf(src), i=PK.SOURCES.indexOf(src); if(PK.SOURCES.slice(i+1).some(x=>kindOf(x)===k)) return; done(k); };
  // de bibliotheken van Instellingen (alleen als ze aan staan); elke soort krijgt zijn vinkje zodra hij klaar is
  S.auto=async()=>{ for(const k of kindsOn()){ S.step(PK.pkt('m.su_laden_'+k),k); try{ const src=await PK.wsaLoad(k,false); const st=src&&PK.SRCSTATE.get(src.sid); if(st&&st.state==='err') S.warn(k); }catch(e){ S.warn(k); } done(k); } };
  S.finish=()=>{ PK.loadNote=null; if(!S.el) return; S.chips.forEach((c,k)=>{ if(c.e.dataset.s==='act') done(k); else if(c.e.dataset.s==='wait') c.e.remove(); }); S.chips.forEach((c,k)=>{ if(!c.e.isConnected) S.chips.delete(k); });
    S.cur=null; paint(); S.bar.style.width='100%'; S.pct.textContent='100%'; S.txt.textContent=S.warns?PK.pkt('m.su_klaar_let_op'):PK.pkt('m.su_klaar'); S.sub.textContent=''; setTimeout(()=>S.close(),S.warns?2800:900); };
  S.close=()=>{ if(S.gone||!S.el) return; S.gone=true; PK.loadNote=null; document.removeEventListener('keydown',S.key); const el=S.el; el.classList.add('out'); if(room()) room().classList.remove('splashing'); setTimeout(()=>el.remove(),400); };
  if(PK.WSA_START.splash&&something){ build(); PK.loadNote=S.note; }
  return S;
}
PK.startupBegin=startupBegin;
})(window.__PK);
