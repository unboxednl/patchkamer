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
  // alle kabels trekken zich terug, in willekeurige volgorde, binnen ruim een halve seconde
  L.leave=()=>{ const r=rng(99); L.els.forEach(g=>{ g.style.setProperty('--o',(r()*.7).toFixed(2)+'s'); g.classList.add('out'); }); };
  return L; }
const COUNTS_KEY='patchkamerStartCounts', EST_DEF={dev:96,tun:42,pre:43,ski:12,sam:1};
function startupBegin(){
  const S={el:null,bar:null,txt:null,sub:null,ver:null,pct:null,cab:null,chips:new Map(),cur:null,seg:null,segs:[],warns:0,gone:false,frac:0,est:{...EST_DEF}};
  try{ const o=JSON.parse(localStorage.getItem(COUNTS_KEY)||'null'); if(o&&typeof o==='object') for(const k of KINDS) if(Number.isFinite(o[k])&&o[k]>=0&&o[k]<=5000) S.est[k]=o[k]; }catch(e){}   // wat de vorige start laadde, als schatting voor wat nog komt
  const kindsOn=()=>KINDS.filter(k=>PK.WSA[k]&&PK.WSA[k].on);
  const something=PK.SOURCES.length>0||kindsOn().length>0;
  const room=()=>PK.$('room');
  // voortgang = geladen items (apparaten, tunes, presets, skins, samples) gedeeld door alle items; wat nog niet geteld is, schat de vorige start
  function totals(){ let tot=0,done=0; for(const [k,c] of S.chips){ if(k==='ws') continue; const ss=S.segs.filter(x=>x.key===k), t=ss.reduce((a,x)=>a+x.total,0); tot+=t>0?t:S.est[k]; done+=ss.reduce((a,x)=>a+x.done,0); }
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
    el.addEventListener('click',()=>S.close());   // ook een klik naast de kaart
    S.key=e=>{ if(e.key==='Escape'&&S.el) S.close(); }; document.addEventListener('keydown',S.key);
    S.el=el; S.bar=el.querySelector('.spbar i'); S.txt=el.querySelector('.sptxt'); S.sub=el.querySelector('.spsub'); S.ver=el.querySelector('.spver'); S.pct=el.querySelector('.sppct'); el.querySelector('.sphint').textContent=PK.pkt('m.su_hint'); S.ver.hidden=true;
    (room()||document.body).appendChild(el); if(room()) room().classList.add('splashing');
    new Set([...kindsOn(),...PK.SOURCES.map(kindOf)]).forEach(k=>chip(k)); chip('ws'); S.txt.textContent=PK.pkt('m.su_start'); S.cab.grow(3); paint();
    fetch('version.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ if(j&&typeof j.version==='string'&&/^[0-9A-Za-z.+-]{1,32}$/.test(j.version)&&S.ver){ S.ver.textContent=PK.pkt('m.su_versie',j.version); S.ver.hidden=false; } }).catch(()=>{}); }
  const done=key=>{ const c=key&&S.chips.get(key); if(c&&c.e.dataset.s!=='done'){ S.segs.forEach(x=>{ if(x.key===key) x.done=x.total; }); mark(key,'done',c.total?String(c.total):''); paint(); } };
  // een stap voor een soort (dev, tun, pre, ski, sam, ws): de vorige soort is klaar; een soort die al klaar is blijft klaar
  S.step=(label,key,newSeg)=>{ if(!S.el) return; const c=key?chip(key):null; if(c&&c.e.dataset.s==='done') return;
    if(S.cur&&S.cur!==key) done(S.cur); S.cur=key||null; S.frac=0; if(key&&key!=='ws'&&(newSeg||!S.seg||S.seg.key!==key)){ S.seg={key,done:0,total:0}; S.segs.push(S.seg); }
    if(c&&c.e.dataset.s!=='act') mark(key,'act',''); S.txt.textContent=label; S.sub.textContent=''; paint(); };
  S.note=(klaar,totaal,naam)=>{ if(!S.el||!(totaal>0)) return; S.frac=Math.min(1,klaar/totaal); const c=S.cur&&S.chips.get(S.cur); if(c){ c.total=S.segs.filter(x=>x.key===S.cur).reduce((a,x)=>a+(x===S.seg?totaal:x.total),0); c.n.textContent=(klaar+1)+'/'+totaal; }
    if(S.seg){ S.seg.total=totaal; S.seg.done=klaar; } S.sub.textContent=PK.pkt('m.su_telt',klaar+1,totaal)+(naam?' · '+naam:''); paint(); };
  S.warn=key=>{ S.warns++; const c=key&&S.chips.get(key); if(c) c.e.dataset.w='1'; };
  // een onthouden bron telt voor zijn soort; het vinkje komt als er geen latere bron van die soort meer is
  S.src=src=>{ const k=kindOf(src); S.step(PK.pkt('m.su_laden_'+k),k,true); };
  S.srcEnd=src=>{ if(!S.el) return; const k=kindOf(src), i=PK.SOURCES.indexOf(src); if(PK.SOURCES.slice(i+1).some(x=>kindOf(x)===k)) return; done(k); };
  // de bibliotheken van Instellingen (alleen als ze aan staan); elke soort krijgt zijn vinkje zodra hij klaar is
  S.auto=async()=>{ for(const k of kindsOn()){ S.step(PK.pkt('m.su_laden_'+k),k,true); try{ const src=await PK.wsaLoad(k,false); const st=src&&PK.SRCSTATE.get(src.sid); if(st&&st.state==='err') S.warn(k); }catch(e){ S.warn(k); } done(k); } };
  S.finish=()=>{ PK.loadNote=null; if(!S.el) return; S.chips.forEach((c,k)=>{ if(c.e.dataset.s==='act') done(k); else if(c.e.dataset.s==='wait') c.e.remove(); }); S.chips.forEach((c,k)=>{ if(!c.e.isConnected) S.chips.delete(k); });
    try{ const o={}; for(const k of KINDS){ const t=S.segs.filter(x=>x.key===k).reduce((a,x)=>a+x.total,0); if(t>0) o[k]=t; } localStorage.setItem(COUNTS_KEY,JSON.stringify({...S.est,...o})); }catch(e){}   // voor de schatting van de volgende start
    const {done:n}=totals(); if(S.cab) S.cab.grow(Math.floor(n)); S.cur=null; S.bar.style.width='100%'; S.pct.textContent='100%'; S.txt.textContent=S.warns?PK.pkt('m.su_klaar_let_op'):PK.pkt('m.su_klaar'); S.sub.textContent='';
    // even laten zien dat alles is aangesloten, dan trekken de kabels zich terug en verdwijnt het scherm
    setTimeout(()=>{ if(S.cab&&!S.gone) S.cab.leave(); },S.warns?1800:500); setTimeout(()=>S.close(),S.warns?3000:1500); };
  S.close=()=>{ if(S.gone||!S.el) return; S.gone=true; PK.loadNote=null; document.removeEventListener('keydown',S.key); const el=S.el; el.classList.add('out'); if(room()) room().classList.remove('splashing'); setTimeout(()=>el.remove(),450); };
  if(PK.WSA_START.splash&&something){ build(); PK.loadNote=S.note; }
  return S;
}
PK.startupBegin=startupBegin;
})(window.__PK);
