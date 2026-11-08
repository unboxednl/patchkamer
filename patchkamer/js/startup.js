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
// kabels op de achtergrond: elk geladen item (apparaat, tune, preset, skin, sample) is één kabel, en elke kabel hangt in een andere richting
// (links naar rechts, boven naar onder, rechts naar links, onder naar boven en schuin). Vast patroon per kabelnummer, geen willekeur per keer.
const CABS=['--audio','--event','--mod','--multi','--mastering','--sel'], SVGNS='http://www.w3.org/2000/svg', VW=1600, VH=900;
const rng=seed=>()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
const NORM={L:[1,0],R:[-1,0],T:[0,1],B:[0,-1]};
const PAIRS=[['L','R'],['T','B'],['R','L'],['B','T'],['L','B'],['T','R'],['R','T'],['B','L'],['T','L'],['R','B'],['B','R'],['L','T']];   // recht en schuin, in alle richtingen
const edgePt=(e,r)=>e==='L'?[30+r()*80,70+r()*(VH-140)]:e==='R'?[VW-30-r()*80,70+r()*(VH-140)]:e==='T'?[80+r()*(VW-160),30+r()*70]:[80+r()*(VW-160),VH-30-r()*70];
function cableLayer(){
  const svg=document.createElementNS(SVGNS,'svg'); svg.setAttribute('class','spcables'); svg.setAttribute('viewBox','0 0 '+VW+' '+VH); svg.setAttribute('preserveAspectRatio','xMidYMid slice'); svg.setAttribute('aria-hidden','true');
  const L={svg,n:0,els:[]};
  L.grow=target=>{ let k=0; while(L.n<target&&L.n<400){ const i=L.n++, r=rng(i*7919+13), [ea,eb]=PAIRS[i%PAIRS.length], p1=edgePt(ea,r), p2=edgePt(eb,r), dist=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]), d=Math.min(560,dist*(.32+r()*.18)), na=NORM[ea], nb=NORM[eb];
      const g=document.createElementNS(SVGNS,'g'), path=document.createElementNS(SVGNS,'path'), c1=document.createElementNS(SVGNS,'circle'), c2=document.createElementNS(SVGNS,'circle');
      path.setAttribute('d','M'+p1[0].toFixed(0)+' '+p1[1].toFixed(0)+' C'+(p1[0]+na[0]*d).toFixed(0)+' '+(p1[1]+na[1]*d).toFixed(0)+' '+(p2[0]+nb[0]*d).toFixed(0)+' '+(p2[1]+nb[1]*d).toFixed(0)+' '+p2[0].toFixed(0)+' '+p2[1].toFixed(0)); path.setAttribute('pathLength','1'); path.setAttribute('stroke-width',(2.6+r()*2).toFixed(1));
      for(const [c,q] of [[c1,p1],[c2,p2]]){ c.setAttribute('cx',q[0].toFixed(0)); c.setAttribute('cy',q[1].toFixed(0)); c.setAttribute('r','8'); }
      g.setAttribute('class','spcab'); g.style.setProperty('--c','var('+CABS[i%CABS.length]+')'); g.style.setProperty('--d',(k++*0.025).toFixed(3)+'s'); g.append(path,c1,c2); svg.appendChild(g); L.els.push(g);
      requestAnimationFrame(()=>requestAnimationFrame(()=>g.classList.add('in'))); } };
  // aan het eind faden alle kabels samen rustig weg
  L.leave=()=>{ svg.classList.add('leave'); };
  return L; }
const COUNTS_KEY='patchkamerStartCounts', EST_DEF={dev:96,tun:42,pre:43,ski:12,sam:1};
function startupBegin(){
  const S={el:null,bar:null,txt:null,sub:null,ver:null,pct:null,cab:null,chips:new Map(),segs:new Map(),pend:{},last:'',warns:0,gone:false,est:{...EST_DEF}};
  try{ const o=JSON.parse(localStorage.getItem(COUNTS_KEY)||'null'); if(o&&typeof o==='object') for(const k of KINDS) if(Number.isFinite(o[k])&&o[k]>=0&&o[k]<=5000) S.est[k]=o[k]; }catch(e){}   // wat de vorige start laadde, als schatting voor wat nog komt
  const kindsOn=()=>KINDS.filter(k=>PK.WSA[k]&&PK.WSA[k].on);
  const something=PK.SOURCES.length>0||kindsOn().length>0;
  const room=()=>PK.$('room');
  // voortgang = geladen items (apparaten, tunes, presets, skins, samples) gedeeld door alle items; wat nog niet geteld is, schat de vorige start
  function totals(){ let tot=0,done=0; for(const [k,c] of S.chips){ if(k==='ws') continue; const ss=[...S.segs.values()].filter(x=>x.key===k), t=ss.reduce((a,x)=>a+x.total,0); tot+=t>0?t:S.est[k]; done+=ss.reduce((a,x)=>a+x.done,0); }
    return {tot:Math.max(tot,1),done}; }
  function paint(){ if(!S.el) return; const {tot,done}=totals(), p=Math.min(1,done/tot); S.bar.style.width=(p*100).toFixed(1)+'%'; S.pct.textContent=Math.round(p*100)+'%'; S.el.setAttribute('aria-valuenow',String(Math.round(p*100))); if(S.cab) S.cab.grow(Math.floor(done)); }
  function chip(key){ let c=S.chips.get(key); if(c||!S.el) return c;
    const e=document.createElement('span'); e.className='spc'; e.dataset.s='wait'; e.innerHTML='<i></i><b></b><u></u>'; e.querySelector('b').textContent=PK.pkt('m.su_k_'+key); S.chips.set(key,c={e,n:e.querySelector('u'),total:0});
    // vaste volgorde: Apparaten, Tunes, Presets, Skins, Samples, Werkruimte
    const order=[...KINDS,'ws'], box=S.el.querySelector('.spsteps'), after=[...S.chips.keys()].filter(k=>order.indexOf(k)>order.indexOf(key)).sort((a,b)=>order.indexOf(a)-order.indexOf(b))[0];
    if(after) box.insertBefore(e,S.chips.get(after).e); else box.appendChild(e); return c; }
  function mark(key,state,txt){ const c=chip(key); if(!c) return; c.e.dataset.s=state; if(txt!=null) c.n.textContent=txt; }
  function build(){
    const el=document.createElement('div'); el.id='splash'; el.setAttribute('role','progressbar'); el.setAttribute('aria-valuemin','0'); el.setAttribute('aria-valuemax','100'); el.setAttribute('aria-valuenow','0'); el.setAttribute('aria-label','Patchkamer');
    S.cab=cableLayer(); el.appendChild(S.cab.svg);
    el.insertAdjacentHTML('beforeend','<div class="spcard"><button type="button" class="spx"></button><div class="spmark"><img src="icons/icon-192.png" alt="" width="88" height="88"><div class="spname"><h1 class="splogo"><b>Patch</b>kamer</h1><div class="spver"></div></div></div>'
      +'<div class="spprog"><div class="spbar"><i></i></div><span class="sppct">0%</span></div><div class="spsteps"></div>'
      +'<div class="spwell"><div class="sptxt" aria-live="polite"></div><div class="spsub"></div></div><div class="sphint"></div></div>');
    const x=el.querySelector('.spx'); x.textContent='×'; x.title=PK.pkt('m.su_sluiten'); x.setAttribute('aria-label',PK.pkt('m.su_sluiten'));
    el.addEventListener('click',()=>S.close(false));   // ook een klik naast de kaart
    S.key=e=>{ if(e.key==='Escape'&&S.el) S.close(); }; document.addEventListener('keydown',S.key);
    S.el=el; S.bar=el.querySelector('.spbar i'); S.txt=el.querySelector('.sptxt'); S.sub=el.querySelector('.spsub'); S.ver=el.querySelector('.spver'); S.pct=el.querySelector('.sppct'); el.querySelector('.sphint').textContent=PK.pkt('m.su_hint'); S.ver.hidden=true;
    (room()||document.body).appendChild(el); if(room()) room().classList.add('splashing');
    new Set([...kindsOn(),...PK.SOURCES.map(kindOf)]).forEach(k=>chip(k)); chip('ws'); S.txt.textContent=PK.pkt('m.su_start'); S.cab.grow(3); paint();
    fetch('version.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ if(j&&typeof j.version==='string'&&/^[0-9A-Za-z.+-]{1,32}$/.test(j.version)&&S.ver){ S.ver.textContent=PK.pkt('m.su_versie',j.version); S.ver.hidden=false; } }).catch(()=>{}); }
  const segsOf=k=>[...S.segs.values()].filter(x=>x.key===k);
  const done=key=>{ const c=key&&S.chips.get(key); if(c&&c.e.dataset.s!=='done'){ segsOf(key).forEach(x=>{ x.done=x.total; }); mark(key,'done',c.total?String(c.total):''); say(); paint(); } };
  // wat er nu geladen wordt: de soorten die bezig zijn (er kunnen er twee tegelijk zijn)
  function say(){ if(!S.txt) return; const act=[...S.chips].filter(([k,c])=>c.e.dataset.s==='act').map(([k])=>PK.pkt('m.su_laden_'+k)); if(act.length) S.txt.textContent=act.join(' · '); }
  // een soort is bezig (dev, tun, pre, ski, sam, ws); andere soorten blijven zoals ze zijn, want er kunnen er twee tegelijk bezig zijn
  S.step=(label,key)=>{ if(!S.el) return; const c=key?chip(key):null; if(c&&c.e.dataset.s==='done') return; if(c&&c.e.dataset.s!=='act') mark(key,'act',''); say(); paint(); };
  S.note=(klaar,totaal,naam,src)=>{ if(!S.el||!(totaal>0)||!src) return; const k=kindOf(src); let g=S.segs.get(src.sid); if(!g){ g={key:k,done:0,total:0}; S.segs.set(src.sid,g); } g.total=totaal; g.done=klaar;
    const c=S.chips.get(k); if(c){ const ss=segsOf(k); c.total=ss.reduce((a,x)=>a+x.total,0); c.n.textContent=(ss.reduce((a,x)=>a+x.done,0)+1)+'/'+c.total; if(c.e.dataset.s==='wait') mark(k,'act'); }
    S.sub.textContent=PK.pkt('m.su_telt',klaar+1,totaal)+(naam?' · '+naam:''); say(); paint(); };
  S.warn=key=>{ S.warns++; const c=key&&S.chips.get(key); if(c) c.e.dataset.w='1'; };
  // een lijst met hoogstens `limit` tegelijk afwerken (twee soorten parallel: de lange lijst apparaten naast de rest)
  S.each=async(list,limit,fn)=>{ const q=[...list]; await Promise.all(Array.from({length:Math.min(limit,q.length)},async()=>{ while(q.length){ await fn(q.shift()); } })); };
  PK.SOURCES.forEach(x=>{ const k=kindOf(x); S.pend[k]=(S.pend[k]||0)+1; });
  // een onthouden bron telt voor zijn soort; het vinkje komt als alle bronnen van die soort klaar zijn
  S.src=src=>{ const k=kindOf(src); S.step(PK.pkt('m.su_laden_'+k),k); };
  S.srcEnd=src=>{ if(!S.el) return; const k=kindOf(src); if(--S.pend[k]<=0) done(k); };
  // de bibliotheken van Instellingen (alleen als ze aan staan), twee soorten tegelijk; elke soort krijgt zijn vinkje zodra hij klaar is
  S.auto=async()=>{ await S.each(kindsOn(),2,async k=>{ S.step(PK.pkt('m.su_laden_'+k),k); try{ const src=await PK.wsaLoad(k,false); const st=src&&PK.SRCSTATE.get(src.sid); if(st&&st.state==='err') S.warn(k); }catch(e){ S.warn(k); } done(k); }); };
  S.finish=()=>{ PK.loadNote=null; if(!S.el) return; S.chips.forEach((c,k)=>{ if(c.e.dataset.s==='act') done(k); else if(c.e.dataset.s==='wait') c.e.remove(); }); S.chips.forEach((c,k)=>{ if(!c.e.isConnected) S.chips.delete(k); });
    try{ const o={}; for(const k of KINDS){ const t=segsOf(k).reduce((a,x)=>a+x.total,0); if(t>0) o[k]=t; } localStorage.setItem(COUNTS_KEY,JSON.stringify({...S.est,...o})); }catch(e){}   // voor de schatting van de volgende start
    const {done:n}=totals(); if(S.cab) S.cab.grow(Math.floor(n)); S.bar.style.width='100%'; S.pct.textContent='100%'; S.txt.textContent=S.warns?PK.pkt('m.su_klaar_let_op'):PK.pkt('m.su_klaar'); S.sub.textContent='';
    // even laten zien dat alles is aangesloten, dan faden de kabels weg en daarna het scherm
    setTimeout(()=>{ if(S.cab&&!S.gone) S.cab.leave(); },S.warns?1800:400); setTimeout(()=>S.close(true),S.warns?2800:1000); };
  // zacht (slow) als het vanzelf klaar is, snel als je het zelf wegklikt
  S.close=slow=>{ if(S.gone||!S.el) return; S.gone=true; PK.loadNote=null; document.removeEventListener('keydown',S.key); const el=S.el; if(slow===true) el.classList.add('slow'); el.classList.add('out'); if(room()) room().classList.remove('splashing'); setTimeout(()=>el.remove(),slow===true?1500:450); };
  if(PK.WSA_START.splash&&something){ build(); PK.loadNote=S.note; }
  return S;
}
PK.startupBegin=startupBegin;
})(window.__PK);
