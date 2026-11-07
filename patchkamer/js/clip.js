// js/clip.js — klembord voor patronen en clips (ook scènes met meerdere sporen, kind 'multi'): controleren (sanitize), aanpassen aan het doel (fit), kopiëren, plakken, ongedaan maken, kaartbalkknoppen
(function(PK){
/* =====================================================================
   KLEMBORD · formaat `patchkamer-clip` (contract v1.24: clipInfo / getClip / setClip, kind notes, drums en multi)
   Het klembord is onbetrouwbare invoer: alles gaat eerst door clipClean (grenzen, 1 MB, 4096 gebeurtenissen,
   64 banen, namen hoogstens 40 tekens, onbekende velden weg). Namen komen alleen als textContent op het scherm.
   Tijd in tikken: 12 per zestiende, 192 per maat.
   ===================================================================== */
const CLIP_TICK={16:12,32:6,64:3}, CLIP_MAXTEXT=1000000, CLIP_MAXEV=4096, CLIP_MAXLANES=64, CLIP_MAXLEN=12288, CLIP_MAXTRACKS=64, CLIP_MAXEV_ALL=16384, CLIP_UNDO_MS=15000;
// naamgroepen voor het uitlijnen van drumbanen (genormaliseerde naam of type -> groep)
const CLIP_SYN={kick:['kick','bassdrum','bd','bass','kickdrum'],snare:['snare','sd','snaredrum'],clap:['clap','handclap','cp'],
  closedhat:['closedhat','hhclosed','closedhihat','hihatclosed','ch','hat','hh','hihat'],openhat:['openhat','hhopen','openhihat','hihatopen','oh'],
  rim:['rim','rimshot','sidestick','rimclick'],lowtom:['lowtom','tomlow','lotom'],midtom:['midtom','tommid','tom'],hightom:['hightom','hitom','tomhigh','tomhi'],
  crash:['crash','crashcymbal'],ride:['ride','ridecymbal'],shaker:['shaker'],tamb:['tamb','tambourine'],cowbell:['cowbell','cow'],conga:['conga'],bongo:['bongo']};
// Pattern Tracker en Pattern Playlist zijn dezelfde code in twee weergaven met dezelfde native-opmaak: dat zijn zusters
const CLIP_SISTERS={'nl.patchkamer.patterntracker':'tracker','nl.patchkamer.patternplaylist':'tracker'};
function clipSameDev(a,b){ return typeof a==='string'&&typeof b==='string'&&(a===b||(!!CLIP_SISTERS[a]&&CLIP_SISTERS[a]===CLIP_SISTERS[b])); }
const CLIP_SYNMAP=(()=>{ const m={}; for(const g in CLIP_SYN) CLIP_SYN[g].forEach(s=>{ m[s]=g; }); return m; })();

const clipNum=(v,lo,hi,d)=>typeof v==='number'&&isFinite(v)?Math.min(hi,Math.max(lo,v)):d;
const clipInt=(v,lo,hi,d)=>typeof v==='number'&&isFinite(v)?Math.round(Math.min(hi,Math.max(lo,v))):d;
const clipStr=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g,' ').trim().slice(0,n):'';
const clipNorm=s=>String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,'');
const clipCanon=s=>{ const n=clipNorm(s); return n?(CLIP_SYNMAP[n]||n):''; };
const clipGcd=(a,b)=>b?clipGcd(b,a%b):a;
const clipLcm=(a,b)=>a/clipGcd(a,b)*b;

// ---- controleren: geeft {clip} of {err:'bad'|'newer'|'kind'|'big', kind?} ----
function clipClean(o){
  if(!o||typeof o!=='object'||Array.isArray(o)||o.format!=='patchkamer-clip') return {err:'bad'};
  if(typeof o.formatVersion!=='number'||!(o.formatVersion>=1)) return {err:'bad'};
  if(Math.floor(o.formatVersion)>1) return {err:'newer'};
  if(o.kind==='multi') return clipCleanMulti(o);
  if(o.kind!=='notes'&&o.kind!=='drums') return {err:'kind',kind:clipStr(o.kind,20)};
  if(typeof o.length!=='number'||!isFinite(o.length)||o.length<1) return {err:'bad'};
  const len=clipInt(o.length,1,CLIP_MAXLEN,1);
  const c={format:'patchkamer-clip',formatVersion:1,kind:o.kind,name:clipStr(o.name,40),length:len,grid:[16,32,64].includes(o.grid)?o.grid:16};
  if(o.source&&typeof o.source==='object'){ const s=o.source; c.source={device:clipStr(s.device,80),name:clipStr(s.name,60),version:clipStr(s.version,20),trackType:clipStr(s.trackType,20),scheme:s.scheme==='gm'?'gm':'device'}; }
  const sw=clipNum(o.swing,0,0.5,0); if(sw>0) c.swing=sw;
  const ev=x=>{ if(!x||typeof x!=='object') return null; if(typeof x.t!=='number'||!isFinite(x.t)||x.t<0||x.t>=len) return null;
    const e={t:Math.round(x.t),vel:clipNum(x.vel,0.01,1,0.8)}; if(x.acc===true) e.acc=true;
    const p=clipNum(x.prob,0,1,1); if(p<1) e.prob=p; const rt=clipInt(x.ratchet,1,16,1); if(rt>1) e.ratchet=rt; return e; };
  if(o.kind==='notes'){
    const a=Array.isArray(o.notes)?o.notes:[]; c.notes=[];
    for(let i=0;i<a.length&&c.notes.length<CLIP_MAXEV;i++){ const e=ev(a[i]); if(!e) continue; const n=clipInt(a[i].n,0,127,-1); if(n<0) continue;
      e.n=n; e.len=clipInt(a[i].len,1,len,12); if(e.t+e.len>len) e.len=len-e.t; c.notes.push(e); }
    c.notes.sort((p,q)=>p.t-q.t||p.n-q.n);
  } else {
    const a=Array.isArray(o.lanes)?o.lanes.slice(0,CLIP_MAXLANES):[]; c.lanes=a.map((l,i)=>{ l=l&&typeof l==='object'?l:{}; const r={id:clipStr(l.id,40)||('l'+i),name:clipStr(l.name,40),type:clipStr(l.type,30),note:clipInt(l.note,0,127,-1)}; const ll=clipInt(l.length,1,CLIP_MAXLEN,0); if(ll) r.length=ll; return r; });
    const h=Array.isArray(o.hits)?o.hits:[]; c.hits=[];
    for(let i=0;i<h.length&&c.hits.length<CLIP_MAXEV;i++){ const e=ev(h[i]); if(!e) continue; const ln=h[i].lane; if(typeof ln!=='number'||!Number.isInteger(ln)||ln<0||ln>=c.lanes.length) continue; e.lane=ln; c.hits.push(e); }
    c.hits.sort((p,q)=>p.t-q.t||p.lane-q.lane);
  }
  clipCleanNative(o,c);
  return {clip:c};
} PK.clipClean=clipClean;
function clipCleanNative(o,c){
  if(o.native&&typeof o.native==='object'&&typeof o.native.device==='string'&&o.native.data&&typeof o.native.data==='object'){
    try{ c.native={device:clipStr(o.native.device,80),data:JSON.parse(JSON.stringify(o.native.data))}; }catch(e){} }
}
const clipEvs=c=>c.kind==='notes'?c.notes:c.hits;
const clipEvTotal=c=>c.kind==='multi'?c.tracks.reduce((a,t)=>a+clipEvs(t.clip).length,0):clipEvs(c).length;
// multi: hoogstens 64 sporen, elk een gewone clip (geen multi in multi), 16384 gebeurtenissen samen; `slot` wordt de plaats in de lijst
function clipCleanMulti(o){
  if(typeof o.length!=='number'||!isFinite(o.length)||o.length<1) return {err:'bad'};
  const arr=Array.isArray(o.tracks)?o.tracks:[], tracks=[]; let total=0;
  for(let i=0;i<arr.length&&tracks.length<CLIP_MAXTRACKS;i++){
    const x=arr[i]; if(!x||typeof x!=='object'||!x.clip||typeof x.clip!=='object'||Array.isArray(x.clip)||x.clip.kind==='multi') continue;
    const s=clipClean(x.clip); if(s.err) continue; const c=s.clip;
    if(x.kind!==undefined&&x.kind!==c.kind) continue;
    const key=c.kind==='notes'?'notes':'hits', room=Math.max(0,CLIP_MAXEV_ALL-total); if(c[key].length>room) c[key]=c[key].slice(0,room); total+=c[key].length;
    tracks.push({slot:tracks.length,name:clipStr(x.name,40)||c.name,kind:c.kind,role:clipStr(x.role,30),clip:c});
  }
  if(!tracks.length) return {err:'bad'};
  const m={format:'patchkamer-clip',formatVersion:1,kind:'multi',name:clipStr(o.name,40),length:Math.max(...tracks.map(t=>t.clip.length)),grid:[16,32,64].includes(o.grid)?o.grid:16};
  if(o.source&&typeof o.source==='object'){ const s=o.source; m.source={device:clipStr(s.device,80),name:clipStr(s.name,60),version:clipStr(s.version,20),trackType:clipStr(s.trackType,20),scheme:s.scheme==='gm'?'gm':'device'}; }
  m.tracks=tracks; clipCleanNative(o,m);
  return {clip:m};
}

// tekst van het systeemklembord: null = geen clip (negeren), {err} = een clip die we weigeren, {clip}
function clipFromText(text){
  if(typeof text!=='string') return null; const t=text.replace(/^\s+/,'');
  if(t.charAt(0)!=='{') return null;
  if(text.length>CLIP_MAXTEXT) return t.slice(0,400).includes('patchkamer-clip')?{err:'big'}:null;
  let o; try{ o=JSON.parse(t); }catch(e){ return null; }
  if(!o||o.format!=='patchkamer-clip') return null;
  return clipClean(o);
} PK.clipFromText=clipFromText;

// ---- aanpassen aan het doel: {clip,report,count} of {err:'kind'|'none'|'nolanes'|'nomatch', ...} ----
function clipFit(c,inf,ctx){
  ctx=ctx||{};
  if(c.kind==='multi') return clipFitMulti(c,inf,ctx);
  const rep={lenIgn:'',extra:[],cut:0,shortened:0,tiled:0,padded:0,moved:0,merged:0,folded:0,dropped:[],lanesUnplaced:[]};
  if(!inf||typeof inf!=='object') return {err:'none'};
  const paste=Array.isArray(inf.paste)?inf.paste:[];
  if(!paste.includes(c.kind)) return {err:'kind',kind:c.kind,paste};
  const dropAdd=(kind,n)=>{ if(n>0) rep.dropped.push({kind,n}); };
  const L=inf.length&&typeof inf.length==='object'?inf.length:{};
  const origLen=c.length;
  let S=c.length, ev=(c.kind==='notes'?c.notes:c.hits).map(e=>({...e}));
  let outLanes=null;
  const same=!!(ctx.same||(ctx.devId&&c.native&&clipSameDev(c.native.device,ctx.devId)));   // native alleen bij hetzelfde apparaat (of de zusterweergave, zie clipSameDev)
  // drums: banen van de bron naar de banen van het doel (type, naam, nootnummer; nooit op volgorde, behalve hetzelfde apparaat)
  if(c.kind==='drums'){
    const tl=Array.isArray(inf.lanes)?inf.lanes.slice(0,CLIP_MAXLANES):[]; if(!tl.length) return {err:'nolanes'};
    // polymeter naar monometer: banen met eigen lengte herhalen tot het kleinste gemene veelvoud (begrensd)
    const ls=c.lanes.map(l=>l.length||S);
    if(ls.some(x=>x!==S)){ const cap=L.shared&&typeof L.current==='number'?clipInt(L.current,1,CLIP_MAXLEN,CLIP_MAXLEN):clipInt(L.max,1,CLIP_MAXLEN,CLIP_MAXLEN);
      let m=1; for(const x of ls){ m=clipLcm(m,x); if(m>=cap){ m=cap; break; } } m=Math.max(m,S);
      if(ls.some(x=>m%x!==0)) dropAdd('poly',1);
      const out=[]; ev.forEach(e=>{ const ll=ls[e.lane]; for(let t=e.t;t<m;t+=ll) out.push({...e,t}); }); ev=out; S=m; }
    const map=new Array(c.lanes.length).fill(-1), used=new Set(), pass=(fn)=>{ c.lanes.forEach((sl,i)=>{ if(map[i]>=0) return; const j=tl.findIndex((tg,j)=>!used.has(j)&&fn(sl,tg)); if(j>=0){ map[i]=j; used.add(j); } }); };
    if(same||ctx.byOrder) c.lanes.forEach((sl,i)=>{ if(i<tl.length){ map[i]=i; used.add(i); } });   // zelfde apparaat of "uitlijnen op volgorde": op positie
    if(!ctx.byOrder){
      pass((s,t)=>{ const a=clipCanon(s.type), b=clipCanon(t.type); return !!a&&a===b; });
      pass((s,t)=>{ const a=clipCanon(s.name)||clipCanon(s.type), b=clipCanon(t.name)||clipCanon(t.type); return !!a&&(a===b||a===clipCanon(t.name)||clipCanon(s.name)===clipCanon(t.type)); });
      if(c.source&&c.source.scheme==='gm'&&inf.scheme==='gm') pass((s,t)=>s.note>=0&&typeof t.note==='number'&&s.note===t.note); }
    const hasHits=new Set(ev.map(e=>e.lane)); let placed=0;
    c.lanes.forEach((sl,i)=>{ if(map[i]<0&&hasHits.has(i)) rep.lanesUnplaced.push(sl.name||sl.type||sl.id); });
    ev=ev.filter(e=>map[e.lane]>=0).map(e=>{ placed++; return {...e,lane:map[e.lane]}; });
    if(!placed&&hasHits.size) return {err:'nomatch',names:rep.lanesUnplaced.slice()};
    outLanes=tl.map((l,j)=>({id:clipStr(l&&l.id,40)||('l'+j),name:clipStr(l&&l.name,40),type:clipStr(l&&l.type,30),note:clipInt(l&&l.note,0,127,-1)}));
  }
  // lengte: eigen lengte volgen (binnen min/max/stap), gedeelde lengte houden
  const min=clipInt(L.min,1,CLIP_MAXLEN,1), max=clipInt(L.max,min,CLIP_MAXLEN,CLIP_MAXLEN), step=clipInt(L.step,1,CLIP_MAXLEN,1);
  let T;
  if(L.shared&&typeof L.current==='number') T=clipInt(L.current,1,CLIP_MAXLEN,S);
  else { T=Math.min(Math.max(S,min),max); if(step>1){ T=Math.ceil(T/step)*step; if(T>max) T=Math.floor(max/step)*step; if(T<min) T=min; } }
  T=Math.max(1,T);
  if(ctx.matchLen&&T!==S) rep.lenIgn=L.shared?'shared':(min===max?'fixed':'');   // "pas lengte aan de clip aan": kan alleen als het apparaat zijn lengte per patroon volgt (dat doet het al); anders melden
  let tiledNow=false;
  if(T>S){
    if(T%S===0){ const f=T/S, base=ev; ev=[]; for(let k=0;k<f;k++) base.forEach(e=>ev.push({...e,t:e.t+k*S})); tiledNow=true; }
    else rep.padded=T-S;
  } else if(T<S){
    const keep=[]; ev.forEach(e=>{ if(e.t>=T) rep.cut++; else keep.push(e); }); ev=keep; }
  if(S!==origLen||tiledNow) rep.tiled=Math.round(T/origLen); if(rep.tiled<2) rep.tiled=0;
  if(c.kind==='notes') ev.forEach(e=>{ if(e.t+e.len>T){ e.len=T-e.t; rep.shortened++; } });
  // raster: het grofste raster van het doel waarop alles blijft staan, anders het fijnste met afronden
  let grid=c.grid;
  const grids=Array.isArray(inf.grid)?inf.grid.filter(g=>CLIP_TICK[g]).sort((a,b)=>a-b):[];
  if(grids.length){ let pick=grids.find(g=>ev.every(e=>e.t%CLIP_TICK[g]===0));
    if(!pick&&same) pick=grids[grids.length-1];   // hetzelfde apparaat: de tijden blijven staan, het apparaat zet het origineel terug via native
    if(!pick){ pick=grids[grids.length-1]; const q=CLIP_TICK[pick]; const last=Math.floor((T-1)/q)*q;
      ev.forEach(e=>{ const nt=Math.min(last,Math.round(e.t/q)*q); if(nt!==e.t){ e.t=nt; rep.moved++; if(c.kind==='notes'&&e.t+e.len>T) e.len=T-e.t; } }); }
    grid=pick; }
  // bereik (noten): per octaaf naar binnen
  if(c.kind==='notes'&&Array.isArray(inf.range)&&inf.range.length===2&&typeof inf.range[0]==='number'&&typeof inf.range[1]==='number'){
    const lo=inf.range[0], hi=inf.range[1], keep=[]; let out=0;
    ev.forEach(e=>{ const n0=e.n; while(e.n<lo) e.n+=12; while(e.n>hi) e.n-=12; if(e.n<lo||e.n>hi){ out++; return; } if(e.n!==n0) rep.folded++; keep.push(e); });
    ev=keep; dropAdd('range',out); }
  // samenvallen: dezelfde plek en noot of baan, de hardste wint
  { const key=e=>e.t+'|'+(c.kind==='notes'?e.n:e.lane), best=new Map(), vv=e=>e.acc?1:e.vel;
    ev.forEach(e=>{ const k=key(e), b=best.get(k); if(!b) best.set(k,e); else { rep.merged++; if(vv(e)>vv(b)) best.set(k,e); } });
    if(rep.merged){ const keepSet=new Set(best.values()); ev=ev.filter(e=>keepSet.has(e)); } }
  ev.sort((p,q)=>p.t-q.t||(c.kind==='notes'?p.n-q.n:p.lane-q.lane));
  // mono: per starttik de hardste noot, overlappende noten inkorten
  if(c.kind==='notes'&&inf.poly===1){
    const byT=new Map(); ev.forEach(e=>{ const b=byT.get(e.t); if(!b||(e.acc?1:e.vel)>(b.acc?1:b.vel)) byT.set(e.t,e); });
    const keep=[...byT.values()].sort((p,q)=>p.t-q.t); dropAdd('mono',ev.length-keep.length);
    keep.forEach((e,i)=>{ const nx=keep[i+1]; if(nx&&e.t+e.len>nx.t) e.len=nx.t-e.t; }); ev=keep; }
  // kans en ratchet: weg als het doel ze niet kent
  if(!inf.prob){ const n=ev.filter(e=>e.prob!=null).length; ev.forEach(e=>{ delete e.prob; }); dropAdd('prob',n); }
  if(!inf.ratchet){ const n=ev.filter(e=>e.ratchet!=null).length; ev.forEach(e=>{ delete e.ratchet; }); dropAdd('ratchet',n); }
  // velocity
  if(inf.vel==='binary') ev.forEach(e=>{ e.vel=1; delete e.acc; });
  else if(inf.vel==='accent') ev.forEach(e=>{ if(e.acc||e.vel>=0.85){ e.acc=true; e.vel=1; } else delete e.acc; });
  // maximum aantal gebeurtenissen
  const mx=clipInt(inf.maxEvents,1,CLIP_MAXEV,0); if(mx&&ev.length>mx){ rep.cut+=ev.length-mx; ev=ev.slice(0,mx); }
  const out={format:'patchkamer-clip',formatVersion:1,kind:c.kind,name:c.name,length:T,grid};
  if(c.source) out.source={...c.source}; if(c.swing) out.swing=c.swing;
  if(c.kind==='notes') out.notes=ev; else { out.lanes=outLanes; out.hits=ev; }
  if(same&&c.native) out.native={device:ctx.devId,data:JSON.parse(JSON.stringify(c.native.data))};
  return {clip:out,report:rep,count:ev.length};
} PK.clipFit=clipFit;

// ---- multi: sporen van de bron toewijzen aan de sporen van het doel (per soort, op volgorde), elk paar door clipFit ----
// geeft {clip (multi, slot = index in clipInfo().tracks),report,count,nTracks} of {err:'none'|'multi1'|'notracks'|'multinone', ...}
function clipFitMulti(c,inf,ctx){
  ctx=ctx||{};
  if(!inf||typeof inf!=='object') return {err:'none'};
  const paste=Array.isArray(inf.paste)?inf.paste:[];
  if(!paste.includes('multi')) return {err:'multi1',n:c.tracks.length,paste};
  const tt=Array.isArray(inf.tracks)?inf.tracks.slice(0,CLIP_MAXTRACKS).filter(x=>x&&typeof x==='object'):[];
  if(!tt.length) return {err:'notracks'};
  const same=!!(ctx.devId&&((c.native&&clipSameDev(c.native.device,ctx.devId))||c.tracks.some(t=>t.clip.native&&clipSameDev(t.clip.native.device,ctx.devId))));
  const tk=j=>tt[j].kind==='drums'?'drums':'notes', trName=(t,i)=>t.name||t.role||('#'+(i+1));
  const pairs=[], usedS=new Set(), usedT=new Set(), take=(i,j)=>{ pairs.push([i,j]); usedS.add(i); usedT.add(j); };
  if(same){ for(let i=0;i<c.tracks.length&&i<tt.length;i++) take(i,i); }
  else for(const kind of ['notes','drums']){
    const S=[], T=[]; c.tracks.forEach((t,i)=>{ if(t.clip.kind===kind) S.push(i); }); tt.forEach((t,j)=>{ if(tk(j)===kind) T.push(j); });
    if(kind==='drums'){   // eerst een spoor met één baan op gelijk type of gelijke naam, de rest op volgorde
      const keys=(t,l)=>[t.name,t.role,l&&l.type,l&&l.name].map(clipCanon).filter(Boolean);
      S.forEach(i=>{ const st=c.tracks[i]; if(st.clip.lanes.length!==1) return; const a=keys(st,st.clip.lanes[0]);
        const j=T.find(j=>!usedT.has(j)&&Array.isArray(tt[j].lanes)&&tt[j].lanes.length===1&&keys(tt[j],tt[j].lanes[0]).some(k=>a.includes(k))); if(j!==undefined) take(i,j); }); }
    const S2=S.filter(i=>!usedS.has(i)), T2=T.filter(j=>!usedT.has(j)); for(let k=0;k<S2.length&&k<T2.length;k++) take(S2[k],T2[k]);
  }
  pairs.sort((a,b)=>a[1]-b[1]);
  const base={grid:inf.grid,poly:inf.poly,range:inf.range,scheme:inf.scheme,vel:inf.vel,prob:inf.prob,ratchet:inf.ratchet,maxEvents:inf.maxEvents,length:inf.length};
  const rep={lenIgn:'',extra:[],cut:0,shortened:0,tiled:0,padded:0,moved:0,merged:0,folded:0,dropped:[],lanesUnplaced:[],tracksDropped:[],tracksKept:0};
  const out=[]; let count=0;
  const addDropped=(k,n)=>{ if(!(n>0)) return; const d=rep.dropped.find(x=>x.kind===k); if(d) d.n+=n; else rep.dropped.push({kind:k,n}); };
  c.tracks.forEach((st,i)=>{ if(!usedS.has(i)&&clipEvs(st.clip).length) rep.tracksDropped.push(trName(st,i)); });
  for(const [i,j] of pairs){
    const st=c.tracks[i], t=tt[j], ti={...base,...t,paste:same?[...new Set([tk(j),st.clip.kind])]:[tk(j)]};
    if(same&&st.clip.kind==='drums'&&tk(j)!=='drums') ti.lanes=st.clip.lanes;
    const cl={...st.clip}; if(cl.native&&!(ctx.devId&&clipSameDev(cl.native.device,ctx.devId))) delete cl.native;
    const f=clipFit(cl,ti,{devId:ctx.devId,byOrder:ctx.byOrder,matchLen:ctx.matchLen,same});
    if(f.err){ if(clipEvs(st.clip).length||f.err==='nolanes') rep.tracksDropped.push(trName(st,i)); continue; }
    const r=f.report; ['cut','shortened','padded','moved','merged','folded'].forEach(k=>{ rep[k]+=r[k]; }); rep.tiled=Math.max(rep.tiled,r.tiled);
    if(!rep.lenIgn&&r.lenIgn) rep.lenIgn=r.lenIgn; r.dropped.forEach(d=>addDropped(d.kind,d.n));
    r.lanesUnplaced.forEach(n=>rep.lanesUnplaced.push(trName(st,i)+': '+n));
    out.push({slot:j,name:st.name,kind:st.clip.kind,role:st.role||'',clip:f.clip}); count+=f.count;
  }
  if(!out.length) return {err:'multinone',names:rep.tracksDropped.slice()};
  rep.tracksKept=tt.length-out.length;
  const res={format:'patchkamer-clip',formatVersion:1,kind:'multi',name:c.name,length:Math.max(...out.map(o=>o.clip.length)),grid:out[0].clip.grid,tracks:out};
  if(c.source) res.source={...c.source};
  if(c.native&&ctx.devId&&clipSameDev(c.native.device,ctx.devId)) res.native={device:ctx.devId,data:JSON.parse(JSON.stringify(c.native.data))};
  return {clip:res,report:rep,count,nTracks:out.length};
} PK.clipFitMulti=clipFitMulti;

// ---- meldingen ----
function clipKindText(k){ return PK.pkt('m.clip_k_'+(k==='drums'?'drums':k==='multi'?'multi':'notes')); }
// de soorten die een doel kan ontvangen: paste, plus de soorten van zijn sporen als het multi neemt
function clipPasteKinds(inf){ const s=new Set(Array.isArray(inf&&inf.paste)?inf.paste:[]); if(s.has('multi')&&Array.isArray(inf.tracks)) inf.tracks.forEach(t=>{ if(t&&(t.kind==='drums'||t.kind==='notes')) s.add(t.kind); }); return s; } PK.clipPasteKinds=clipPasteKinds;
function clipAcceptText(inf){ const p=inf&&Array.isArray(inf.paste)?inf.paste:[]; return p.length?p.map(clipKindText).join(' / '):PK.pkt('m.clip_niets'); }
function clipLabel(r,inf){ return inf&&inf.name?r.def.name+' · '+inf.name:r.def.name; }
function clipErrText(f,c,r,inf){
  const lbl=clipLabel(r,inf);
  if(f.err==='kind') return PK.pkt('m.clip_niet_soort',clipKindText(c.kind),lbl,clipAcceptText(inf));
  if(f.err==='nolanes') return PK.pkt('m.clip_geen_banen',lbl);
  if(f.err==='multi1') return PK.pkt('m.clip_multi_enkel',f.n==null?(c.tracks?c.tracks.length:0):f.n,lbl);
  if(f.err==='notracks') return PK.pkt('m.clip_geen_sporen',lbl);
  if(f.err==='multinone') return PK.pkt('m.clip_geen_spoor_past',f.names&&f.names.length?f.names.slice(0,6).join(', '):'-');
  if(f.err==='nomatch') return PK.pkt('m.clip_geen_baan_past',f.names&&f.names.length?f.names.slice(0,6).join(', '):'-');
  return PK.pkt('m.clip_kan_niets',lbl);
}
function clipSrcErr(e){ return e.err==='newer'?PK.pkt('m.clip_nieuwer'):e.err==='big'?PK.pkt('m.clip_te_groot'):e.err==='kind'?PK.pkt('m.clip_onbekende_soort',e.kind||'?'):PK.pkt('m.clip_ongeldig'); }
function clipCountText(c,n){ if(c.kind==='multi') return PK.pktp('m.clip_n_sporen',c.tracks.length!==1,c.tracks.length)+', '+PK.pktp('m.clip_n_gebeurt',n!==1,n); return c.kind==='drums'?PK.pktp('m.clip_n_slagen',n!==1,n):PK.pktp('m.clip_n_noten',n!==1,n); }
function clipBars(T){ const b=T/192; const v=Math.round(b*100)/100; return PK.pktp('m.clip_n_maten',v!==1,String(v).replace('.',PK.PK_LANG==='nl'?',':'.')); }
function clipReportText(rep){
  const p=(rep.extra||[]).slice();
  if(rep.lenIgn) p.push(PK.pkt(rep.lenIgn==='shared'?'m.clip_r_len_gedeeld':'m.clip_r_len_vast'));
  if(rep.tiled) p.push(PK.pkt('m.clip_r_herhaald',rep.tiled));
  if(rep.padded) p.push(PK.pkt('m.clip_r_stilte'));
  if(rep.cut) p.push(PK.pktp('m.clip_r_afgekapt',rep.cut!==1,rep.cut));
  if(rep.moved) p.push(PK.pktp('m.clip_r_raster',rep.moved!==1,rep.moved));
  if(rep.merged) p.push(PK.pktp('m.clip_r_samengevallen',rep.merged!==1,rep.merged));
  if(rep.folded) p.push(PK.pktp('m.clip_r_octaaf',rep.folded!==1,rep.folded));
  rep.dropped.forEach(d=>{ p.push(d.kind==='mono'?PK.pktp('m.clip_r_mono',d.n!==1,d.n):d.kind==='range'?PK.pktp('m.clip_r_bereik',d.n!==1,d.n):d.kind==='poly'?PK.pkt('m.clip_r_poly'):d.kind==='prob'?PK.pktp('m.clip_r_kans',d.n!==1,d.n):PK.pktp('m.clip_r_ratchet',d.n!==1,d.n)); });
  if(rep.tracksDropped&&rep.tracksDropped.length){ const l=rep.tracksDropped; p.push(PK.pkt('m.clip_r_sporen_weg',l.slice(0,6).join(', ')+(l.length>6?'…':''))); }
  if(rep.tracksKept) p.push(PK.pktp('m.clip_r_sporen_blijven',rep.tracksKept!==1,rep.tracksKept));
  if(rep.lanesUnplaced.length){ const l=rep.lanesUnplaced; p.push(PK.pkt('m.clip_r_banen',l.slice(0,6).join(', ')+(l.length>6?'…':''))); }
  return p.join('; ');
} PK.clipReportText=clipReportText;

// ---- toestand van het klembord (alleen in dit bestand) ----
const CL={mem:null,pend:new Map(),undo:null,undoT:0,kb:null};
const clipHasApi=i=>!!i&&typeof i.clipInfo==='function'&&typeof i.getClip==='function'&&typeof i.setClip==='function';
function clipInfoOf(id){ const r=PK.Host.devices.get(id); if(!r||!clipHasApi(r.inst)) return null; try{ const i=r.inst.clipInfo(); return i&&typeof i==='object'?i:null; }catch(e){ return null; } }

// ---- kopiëren ----
function clipCopy(id,o){
  const r=PK.Host.devices.get(id); if(!r||!clipHasApi(r.inst)) return false; const inf=clipInfoOf(id), lbl=clipLabel(r,inf);
  if(!inf||!(Array.isArray(inf.copy)&&inf.copy.length)){ PK.status(PK.pkt('m.clip_niet_kopieerbaar',lbl),true); return false; }
  // alle sporen: bij Shift-klik of de menuknop, of altijd als het apparaat alleen multi geeft; anders de gewone aanroep (zonder argument)
  const multi=inf.copy.includes('multi')&&((o&&o.multi)||!inf.copy.some(k=>k!=='multi'));
  let raw=null; try{ raw=multi?r.inst.getClip({kind:'multi'}):r.inst.getClip(); }catch(e){ raw=null; }
  if(!raw){ PK.status(PK.pkt('m.clip_niets_te_kopieren',lbl),true); return false; }
  const s=clipClean(raw); if(s.err){ PK.status(PK.pkt('m.clip_kopie_ongeldig',lbl),true); return false; }
  let json=JSON.stringify(s.clip), stripped=false;
  if(json.length>CLIP_MAXTEXT){   // te groot voor het systeemklembord: eerst de apparaat-eigen gegevens (native) weglaten
    const w={...s.clip}; delete w.native; if(w.tracks) w.tracks=w.tracks.map(t=>{ const c={...t.clip}; delete c.native; return {...t,clip:c}; });
    const j2=JSON.stringify(w); if(j2.length>CLIP_MAXTEXT){ PK.status(PK.pkt('m.clip_kopie_te_groot',lbl),true); return false; }
    s.clip=w; json=j2; stripped=true; }
  CL.mem={json,clip:s.clip,from:id};
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ const p=navigator.clipboard.writeText(json); if(p&&p.catch) p.catch(()=>{}); } }catch(e){}
  const n=clipEvTotal(s.clip);
  PK.status(PK.pkt('m.clip_gekopieerd',s.clip.name||lbl,clipCountText(s.clip,n),clipBars(s.clip.length))+(stripped?' ('+PK.pkt('m.clip_kopie_zonder_native')+')':''));
  clipRefreshAll(); return true;
} PK.clipCopy=clipCopy;

// ---- plakken ----
async function clipPaste(id,o){
  o=o||{}; let r=PK.Host.devices.get(id); if(!r||!clipHasApi(r.inst)) return false;
  let text=o.text;
  if(typeof text!=='string'&&navigator.clipboard&&navigator.clipboard.readText){ try{ text=await navigator.clipboard.readText(); }catch(e){ text=null; } }
  r=PK.Host.devices.get(id); if(!r) return false;
  const inf=clipInfoOf(id), t=clipFromText(text); let c=null;
  if(t&&t.err){ PK.status(PK.pkt('m.clip_niet_geplakt',clipSrcErr(t)),true); return false; }
  if(t) c=t.clip; else if(CL.mem) c=CL.mem.clip; else { PK.status(PK.pkt('m.clip_leeg'),true); return false; }
  const op=PK.clipOptsPrep?PK.clipOptsPrep(c,o.opts):{clip:c,notes:[],byOrder:false,matchLen:false};   // plakopties (clip-menu.js): octaaf, volgorde, lengte
  if(op.err){ PK.status(PK.pkt('m.clip_niet_geplakt',op.err),true); return false; }
  c=op.clip;
  const f=clipFit(c,inf,{devId:r.def.id,byOrder:op.byOrder,matchLen:op.matchLen}); if(f.err){ PK.status(PK.pkt('m.clip_niet_geplakt',clipErrText(f,c,r,inf)),true); return false; }
  if(PK.Host.running&&!o.direct&&(!PK.clipBarOn||PK.clipBarOn())){
    CL.pend.set(id,{clip:c,op});
    PK.toastAction(PK.pkt('m.clip_wacht',clipLabel(r,inf)),[{label:PK.pkt('m.annuleren'),fn:()=>{ CL.pend.delete(id); PK.status(PK.pkt('m.clip_geannuleerd')); }}],{ms:0});
    return true; }
  return clipApply(id,c,op);
} PK.clipPaste=clipPaste;

function clipApply(id,c,op){
  const r=PK.Host.devices.get(id); if(!r||!clipHasApi(r.inst)) return false; const inf=clipInfoOf(id), lbl=clipLabel(r,inf);
  op=op||{};
  const f=clipFit(c,inf,{devId:r.def.id,byOrder:op.byOrder,matchLen:op.matchLen}); if(f.err){ PK.status(PK.pkt('m.clip_niet_geplakt',clipErrText(f,c,r,inf)),true); return false; }
  if(op.notes&&op.notes.length) f.report.extra=op.notes.slice();
  let snap=null; try{ snap=JSON.parse(JSON.stringify(r.inst.getState())); }catch(e){ snap=null; }
  let res; try{ res=r.inst.setClip(f.clip); }catch(e){ res={ok:false,reason:e&&e.message}; }
  if(!res||res.ok!==true){ if(res&&res.ok!==false&&snap){ try{ r.inst.setState(snap); }catch(e){} }
    PK.status(PK.pkt('m.clip_niet_geplakt',PK.pkt('m.clip_geweigerd',lbl)+(res&&typeof res.reason==='string'&&res.reason?': '+res.reason.slice(0,120):'')),true); return false; }
  clearTimeout(CL.undoT); CL.undo=snap?{id,snap,label:lbl}:null; if(CL.undo) CL.undoT=setTimeout(()=>{ CL.undo=null; },CLIP_UNDO_MS);
  const rt=clipReportText(f.report), msg=PK.pkt('m.clip_geplakt',lbl,clipCountText(f.clip,f.count),clipBars(f.clip.length))+(rt?' ('+rt+')':'');
  PK.toastAction(msg,CL.undo?[{label:PK.pkt('m.clip_ongedaan'),fn:()=>{ clipUndo(); }}]:[],{ms:CLIP_UNDO_MS});
  return true;
}

function clipUndo(){
  const u=CL.undo; if(!u) return false; const r=PK.Host.devices.get(u.id); CL.undo=null; clearTimeout(CL.undoT); if(!r) return false;
  try{ r.inst.setState(JSON.parse(JSON.stringify(u.snap))); }catch(e){ PK.status(PK.pkt('m.clip_ongedaan_mislukt',u.label),true); return false; }
  PK.status(PK.pkt('m.clip_ongedaan_gemaakt',u.label)); return true;
} PK.clipUndo=clipUndo;

// wachtende plakacties: aan het begin van de maat (haakje in clock.js) of bij stoppen
function clipFlush(){ if(!CL.pend.size) return; const l=[...CL.pend.entries()]; CL.pend.clear(); let ok=false; l.forEach(([id,p])=>{ try{ if(clipApply(id,p.clip,p.op)) ok=true; }catch(e){ console.warn('clip',e); } }); if(!ok&&l.length) PK.status(''); }
function clipBar(info){ if(!CL.pend.size) return; clipFlush(); } PK.clipBar=clipBar;
function clipOnStop(){ clipFlush(); } PK.clipOnStop=clipOnStop;

// ---- kaartbalkknoppen ----
function clipRefresh(id){
  const r=PK.Host.devices.get(id); if(!r||!r._clipBtns) return; const inf=clipInfoOf(id), lbl=clipLabel(r,inf), b=r._clipBtns;
  const cp=!!(inf&&Array.isArray(inf.copy)&&inf.copy.length);
  b.copy.setAttribute('aria-disabled',cp?'false':'true'); b.copy.classList.toggle('dis',!cp);
  const both=cp&&inf.copy.includes('multi')&&inf.copy.some(k=>k!=='multi');
  b.copy.title=cp?PK.pkt('m.clip_t_kopieer',lbl)+(both?' · '+PK.pkt('m.clip_t_kopieer_alle'):''):PK.pkt('m.clip_niet_kopieerbaar',lbl);
  let why='';
  if(!inf||!(Array.isArray(inf.paste)&&inf.paste.length)) why=PK.pkt('m.clip_kan_niets',lbl);
  else if(CL.mem&&!inf.paste.includes(CL.mem.clip.kind)) why=clipErrText({err:CL.mem.clip.kind==='multi'?'multi1':'kind'},CL.mem.clip,r,inf);
  b.paste.setAttribute('aria-disabled',why?'true':'false'); b.paste.classList.toggle('dis',!!why);
  b.paste.title=why?PK.pkt('m.clip_niet_geplakt',why):PK.pkt('m.clip_t_plak',lbl);
  if(b.more) b.more.title=PK.pkt('m.clip_t_opties',lbl);
}
function clipRefreshAll(){ PK.Host.devices.forEach((r,id)=>{ if(r._clipBtns) clipRefresh(id); }); }
// geeft [] voor een apparaat zonder de drie methoden: de kaartbalk blijft dan precies zoals hij was
function clipBtns(id,inst){
  if(!clipHasApi(inst)) return [];
  const mk=(cls,txt)=>{ const b=document.createElement('button'); b.type='button'; b.className='clipbtn '+cls; b.textContent=PK.pkt(txt); ['pointerenter','focus','pointerdown'].forEach(ev=>b.addEventListener(ev,()=>clipRefresh(id))); return b; };
  const bc=mk('clipcopy','m.clip_kopieer'), bp=mk('clippaste','m.clip_plak');
  bc.onclick=e=>{ e.stopPropagation(); PK.select(id); clipCopy(id,{multi:e.shiftKey}); };
  bp.onclick=e=>{ e.stopPropagation(); PK.select(id); clipPaste(id,{direct:e.shiftKey}); };
  const bm=PK.clipMoreBtn?PK.clipMoreBtn(id,bp):null;   // pijl en rechtsklikmenu met plakopties (clip-menu.js)
  const hold={copy:bc,paste:bp,more:bm};
  requestAnimationFrame(()=>{ const rr=PK.Host.devices.get(id); if(rr){ rr._clipBtns=hold; clipRefresh(id); } });
  return bm?[bc,bp,bm]:[bc,bp];
} PK.clipBtns=clipBtns;

// ---- sneltoetsen (aangeroepen vanuit boot.js) ----
function clipTarget(e){
  if(PK.textEntry(e)||document.querySelector('.pkmodal')) return null;
  const id=PK.selected, r=id&&PK.Host.devices.get(id); if(!r||!clipHasApi(r.inst)) return null; return id;
}
function clipInit(){
  document.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||e.altKey) return; const k=(e.key||'').toLowerCase();
    if(k==='z'){ if(!CL.undo||e.shiftKey||PK.textEntry(e)||document.querySelector('.pkmodal')) return; e.preventDefault(); e.stopImmediatePropagation(); clipUndo(); return; }
    if(k!=='c'&&k!=='v') return;
    const id=clipTarget(e); if(!id) return; const inf=clipInfoOf(id);
    if(k==='c'){ if(e.shiftKey) return; const sel=window.getSelection&&window.getSelection(); if(sel&&!sel.isCollapsed&&String(sel).length) return;
      if(!inf||!(Array.isArray(inf.copy)&&inf.copy.length)) return; e.preventDefault(); clipCopy(id); return; }
    if(!inf||!(Array.isArray(inf.paste)&&inf.paste.length)) return;
    // geen preventDefault: de browser stuurt een paste-gebeurtenis (zonder toestemmingsvraag); komt die niet, dan lezen we het klembord zelf
    const t=performance.now(), direct=e.shiftKey; CL.kb={t,id,direct};
    setTimeout(()=>{ if(CL.kb&&CL.kb.t===t){ CL.kb=null; clipPaste(id,{direct}); } },200);
  },true);
  document.addEventListener('paste',e=>{
    const kb=CL.kb; const id=clipTarget(e); if(!id) return; const inf=clipInfoOf(id); if(!inf||!(Array.isArray(inf.paste)&&inf.paste.length)) return;
    let text=''; try{ text=e.clipboardData?e.clipboardData.getData('text/plain'):''; }catch(x){}
    e.preventDefault(); CL.kb=null; clipPaste(id,{text:text||'',direct:!!(kb&&kb.direct)});
  });
} PK.clipInit=clipInit;

PK.clipInfoOf=clipInfoOf;
PK.clip={clean:clipClean,fit:clipFit,fitMulti:clipFitMulti,pasteKinds:clipPasteKinds,sameDev:clipSameDev,fromText:clipFromText,reportText:clipReportText,copy:clipCopy,paste:clipPaste,undo:clipUndo,canon:clipCanon};
})(window.__PK);
