// js/samples.js — de tab Samples: samplepacks (contract v1.20) bladeren, beluisteren en in een sampler laden
(function(PK){
const SMFMT='patchkamer-samples', MAXB=50*1024*1024, MIME={wav:'audio/wav',mp3:'audio/mpeg',ogg:'audio/ogg',flac:'audio/flac'};
PK.SAM={libs:[]}; PK.SAMVIEW='style'; PK.SAMQ=''; try{ const v=localStorage.getItem('patchkamer.samView'); if(v==='pack') PK.SAMVIEW=v; }catch(e){}
const open=new Set(), uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6), mk=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e; };
const num=(v,lo,hi)=>{ const n=+v; return Number.isFinite(n)&&n>=lo&&n<=hi?n:undefined; };
// een pack lezen: ongeldige knopen worden overgeslagen; het geluid zit als base64 in `audio.data`
function nodeIn(x,depth=0){ if(!x||typeof x!=='object'||depth>8) return null;
  if(typeof x.folder==='string') return {type:'folder',fid:uid('f'),name:String(x.folder).slice(0,60)||'?',tags:PK.tuTagsIn(x.tags),children:(Array.isArray(x.items)?x.items:[]).map(y=>nodeIn(y,depth+1)).filter(Boolean)};
  const a=x.audio; if(!a||typeof a!=='object'||typeof a.data!=='string'||!a.data||!MIME[String(a.format||'').toLowerCase()]) return null;
  if(a.data.length>MAXB*1.4||!/^[A-Za-z0-9+\/]+={0,2}$/.test(a.data)) return null;
  return {type:'sample',sid:uid('s'),name:String(x.name||'?').slice(0,80),bpm:num(x.bpm,20,400),bars:num(x.bars,0.25,64),author:String(x.author||'').slice(0,60),license:String(x.license||'').slice(0,64),tags:PK.tuTagsIn(x.tags),format:String(a.format).toLowerCase(),data:a.data}; }
function normalize(j,fallback){ if(!j||j.format!==SMFMT||!Array.isArray(j.tree)) throw new Error(PK.pkt('m.sm_geen_pack'));
  if(Math.floor(+j.formatVersion)>1) throw new Error(PK.pkt('m.sm_nieuwer_formaat'));
  return {name:String(j.name||fallback||PK.pkt('m.sm_titel')).slice(0,80),author:String(j.author||'').slice(0,80),license:String(j.license||'').slice(0,64),description:String(j.description||'').slice(0,400),tags:PK.tuTagsIn(j.tags),tree:j.tree.map(x=>nodeIn(x)).filter(Boolean)}; } PK.samNormalize=normalize;
function walk(tree,fn,inh=[],path=[]){ for(const n of tree){ if(n.type==='folder') walk(n.children,fn,[...inh,...(n.tags||[])],[...path,n.name]); else fn(n,[...new Set([...inh,...(n.tags||[])])],path); } }
const entries=()=>{ const out=[]; PK.SAM.libs.forEach(l=>walk(l.tree,(n,tags,path)=>out.push({l,n,tags,path}),l.tags||[])); return out; };
const countOf=l=>{ let c=0; walk(l.tree,()=>c++); return c; };
const user=()=>PK.SAM.libs.filter(l=>!l.ro);
function persist(){ clearTimeout(persist.t); persist.t=setTimeout(()=>{ try{ PK.IDB.set('samples:user',user().map(l=>({lid:l.lid,name:l.name,author:l.author,license:l.license,description:l.description,tags:l.tags,tree:l.tree}))); }catch(e){} },0); }
async function fromSource(src,list,errs){ PK.SAM.libs=PK.SAM.libs.filter(l=>!(l.ro&&l.src&&l.src.sid===src.sid));
  for(const w of list){ try{ const j=await w.load(), n=normalize(j,PK.wsNameOf(w.path).replace(/\.patchkamer-samples$/i,'')); PK.SAM.libs.push({lid:'b:'+src.sid+':'+w.path,...n,ro:true,src:{sid:src.sid,label:src.label,path:w.path}}); }
    catch(e){ errs.push(w.path+': '+e.message); } }
  if(PK.libTab&&PK.libTab()==='samples') paint(); } PK.samplesFromSource=fromSource;
async function importFiles(files,quiet){ let n=0; const errs=[];
  for(const f of files){ try{ if(f.size>MAXB) throw new Error(PK.pkt('m.sm_te_groot')); const l=normalize(JSON.parse(await f.text()),f.name.replace(/\.patchkamer-samples\.json$|\.json$/i,''));
      let name=l.name; while(PK.SAM.libs.some(x=>x.name===name)) name=name.replace(/( \(\d+\))?$/,m=>' ('+((+(m.match(/\d+/)||[1])[0])+1)+')');
      PK.SAM.libs.push({lid:uid('u'),...l,name,ro:false}); n++; }
    catch(e){ errs.push(f.name+': '+e.message); } }
  persist(); paint(); if(!quiet) PK.status(n?PK.pktp('m.sm_geimporteerd',n>1,n)+(errs.length?' · '+errs.join(' · '):''):errs.join(' · '),!n); return {n,errs}; } PK.importSampleFiles=importFiles;
// geluid: base64 → bytes → File (zoals een bestand dat de gebruiker kiest)
const bytesOf=n=>{ const s=atob(n.data), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; };
const fileOf=n=>new File([bytesOf(n)],n.name.replace(/[\\/:*?"<>|]+/g,' ').trim()+'.'+n.format,{type:MIME[n.format]});
let prev=null; function stopPreview(){ if(prev){ try{ prev.src.stop(); }catch(e){} try{ prev.g.disconnect(); }catch(e){} prev=null; } }
async function preview(n,btn){ if(prev&&prev.sid===n.sid){ stopPreview(); paint(); return; } stopPreview();
  try{ const ctx=PK.ensureCtx(); if(ctx.state==='suspended') await ctx.resume(); const buf=await ctx.decodeAudioData(bytesOf(n).buffer.slice(0)); const src=ctx.createBufferSource(), g=ctx.createGain(); src.buffer=buf; src.loop=false; g.gain.value=0.8; src.connect(g); g.connect(ctx.destination);
    src.onended=()=>{ if(prev&&prev.src===src){ prev=null; paint(); } }; src.start(); prev={sid:n.sid,src,g}; paint(); }
  catch(e){ PK.status(PK.pkt('m.sm_afspelen_mislukt',e.message),true); } }
// naar een sampler: de geselecteerde kaart van dat apparaat, een die al op de vloer staat, of een nieuwe
async function toDevice(n,def){ const dev=PK.Host.latest(def); if(!dev){ PK.status(PK.pkt('m.sm_apparaat_ontbreekt',def),true); return; }
  let id=PK.selected&&PK.Host.devices.get(PK.selected)&&PK.Host.devices.get(PK.selected).def.id===def?PK.selected:null;
  if(!id) for(const [k,r] of PK.Host.devices) if(r.def.id===def){ id=k; break; }
  if(!id){ const before=new Set(PK.Host.devices.keys()); PK.placeNew(def); id=[...PK.Host.devices.keys()].find(k=>!before.has(k)); }
  const r=id&&PK.Host.devices.get(id); if(!r||!r.inst||typeof r.inst.loadAudio!=='function'){ PK.status(PK.pkt('m.sm_geen_loadaudio',dev.name),true); return; }
  try{ await r.inst.loadAudio([fileOf(n)],{name:n.name,bpm:n.bpm,bars:n.bars}); PK.select(id); PK.status(PK.pkt('m.sm_geladen',n.name,dev.name)); }catch(e){ PK.status(PK.pkt('m.sm_laden_mislukt',e.message),true); } }
const TARGETS=[['nl.patchkamer.loopslicer','Loop Slicer'],['nl.patchkamer.samplebank','Samplebank'],['nl.patchkamer.drum-listener','Drum Listener'],['nl.patchkamer.stemsplitter','Stem Splitter']];
function leaf(e){ const n=e.n, it=mk('div','pritem'), nm=mk('span','nm',n.name), sm=document.createElement('small'); sm.textContent=' · '+[n.bpm?Math.round(n.bpm*10)/10+' BPM':'',n.bars?n.bars+' '+PK.pkt(n.bars===1?'m.sm_maat':'m.sm_maten'):'',n.license||e.l.license||''].filter(Boolean).join(' · '); nm.appendChild(sm);
  const bb=mk('div','b'), pv=mk('button','small',prev&&prev.sid===n.sid?'■':'▶'); pv.title=PK.pkt('m.sm_beluister'); pv.onclick=()=>preview(n,pv); bb.appendChild(pv);
  TARGETS.forEach(([def,label])=>{ const b=mk('button','small','→ '+label); b.title=PK.pkt('m.sm_laad_in',label); b.disabled=!PK.Host.latest(def); b.onclick=()=>toDevice(n,def); bb.appendChild(b); }); it.append(nm,bb); return it; }
function labelOf(p){ return PK.tagLabel?PK.tagLabel(p):p.split('/').pop(); }
function foldRow(depth,text,count,key,repaint){ const it=mk('div','pritem fold'); it.style.paddingLeft=(6+depth*14)+'px'; const isOpen=!!PK.SAMQ.trim()||open.has(key), nm=mk('span','nm',(isOpen?'▾ ':'▸ ')+text); nm.style.cursor='pointer'; const c=document.createElement('small'); c.textContent=count; nm.appendChild(c); nm.onclick=()=>{ isOpen?open.delete(key):open.add(key); repaint(); }; it.appendChild(nm); return {it,isOpen}; }
function matches(e,q){ if(!q) return true; const hay=(e.n.name+' '+e.l.name+' '+e.tags.map(labelOf).join(' ')+' '+e.path.join(' ')+' '+(e.n.bpm||'')).toLowerCase(); return q.split(/\s+/).every(w=>hay.includes(w)); }
function paintStyle(out,list){ const top={kids:new Map(),items:[],all:new Set()}, none={items:[]};
  list.forEach(e=>{ let tg=e.tags.filter(t=>t.startsWith('style/')); tg=tg.filter(t=>!tg.some(o=>o!==t&&o.startsWith(t+'/'))); if(!tg.length){ none.items.push(e); return; }
    tg.forEach(t=>{ let node=top; t.split('/').slice(1).forEach((sg,i,a)=>{ if(!node.kids.has(sg)) node.kids.set(sg,{path:'style/'+a.slice(0,i+1).join('/'),kids:new Map(),items:[],all:new Set()}); node=node.kids.get(sg); node.all.add(e.n.sid); }); node.items.push(e); }); });
  const rec=(node,depth)=>{ [...node.kids.values()].sort((a,b)=>labelOf(a.path).localeCompare(labelOf(b.path),PK.PK_LANG)).forEach(k=>{ const {it,isOpen}=foldRow(depth,labelOf(k.path),k.all.size,'sm:'+k.path,paint); out.appendChild(it);
      if(isOpen){ rec(k,depth+1); k.items.sort((a,b)=>a.n.name.localeCompare(b.n.name,PK.PK_LANG)).forEach(e=>{ const l=leaf(e); l.style.paddingLeft=(6+(depth+1)*14)+'px'; out.appendChild(l); }); } }); };
  rec(top,0);
  if(none.items.length){ const {it,isOpen}=foldRow(0,PK.pkt('m.tv_zonder'),none.items.length,'sm:none',paint); out.appendChild(it); if(isOpen) none.items.sort((a,b)=>a.n.name.localeCompare(b.n.name,PK.PK_LANG)).forEach(e=>{ const l=leaf(e); l.style.paddingLeft='20px'; out.appendChild(l); }); } }
function paintPack(out,list){ PK.SAM.libs.forEach(l=>{ const mine=list.filter(e=>e.l===l); if(!mine.length&&PK.SAMQ.trim()) return;
    const h=foldRow(0,l.name,countOf(l),'sl:'+l.lid,paint); out.appendChild(h.it); if(!h.isOpen) return;
    const sub=(tree,depth,key)=>{ tree.forEach(n=>{ if(n.type==='folder'){ const cnt=(()=>{ let c=0; walk(n.children,()=>c++); return c; })(), fr=foldRow(depth,n.name,cnt,key+'/'+n.fid,paint); out.appendChild(fr.it); if(fr.isOpen) sub(n.children,depth+1,key+'/'+n.fid); }
        else{ const e=mine.find(x=>x.n===n); if(!e) return; const lf=leaf(e); lf.style.paddingLeft=(6+depth*14)+'px'; out.appendChild(lf); } }); };
    sub(l.tree,1,'sl:'+l.lid);
    if(!l.ro){ const rm=mk('button','small','× '+PK.pkt('m.sm_verwijder')); rm.onclick=()=>{ PK.SAM.libs=PK.SAM.libs.filter(x=>x!==l); persist(); paint(); }; const row=mk('div','pritem'); row.style.paddingLeft='20px'; row.appendChild(rm); out.appendChild(row); } }); }
function paint(){ const box=PK.$('samLibs'); if(!box) return; box.innerHTML='';
  const vw=mk('div','wsrow tuview'); [['style','m.tv_stijl'],['pack','m.sm_per_pack']].forEach(([k,key])=>{ const b=mk('button','small',PK.pkt(key)); if(PK.SAMVIEW===k) b.classList.add('on'); b.setAttribute('aria-pressed',String(PK.SAMVIEW===k)); b.onclick=()=>{ PK.SAMVIEW=k; try{ localStorage.setItem('patchkamer.samView',k); }catch(e){} paint(); }; vw.appendChild(b); }); box.appendChild(vw);
  const sr=mk('div','wsrow'), inp=document.createElement('input'); inp.type='search'; inp.className='wsurl'; inp.style.width='100%'; inp.value=PK.SAMQ; inp.placeholder=PK.pkt('m.sm_zoek'); inp.setAttribute('aria-label',PK.pkt('m.sm_zoek')); inp.spellcheck=false;
  inp.addEventListener('keydown',e=>e.stopPropagation()); inp.addEventListener('pointerdown',e=>e.stopPropagation()); sr.appendChild(inp); box.appendChild(sr);
  const out=mk('div','prlist'); box.appendChild(out);
  const draw=()=>{ out.innerHTML=''; const q=PK.SAMQ.trim().toLowerCase(), all=entries(); if(!PK.SAM.libs.length){ out.appendChild(mk('div','note',PK.pkt('m.sm_leeg'))); return; }
    const list=all.filter(e=>matches(e,q)); if(!list.length){ out.appendChild(mk('div','note',PK.pkt('m.tv_niets'))); return; } (PK.SAMVIEW==='pack'?paintPack:paintStyle)(out,list); };
  inp.addEventListener('input',()=>{ PK.SAMQ=inp.value; draw(); }); draw(); } PK.samPaint=paint;
function show(){ paint(); } PK.samShow=show;
(async()=>{ try{ const saved=await PK.IDB.get('samples:user'); if(Array.isArray(saved)) saved.forEach(l=>{ try{ if(l&&Array.isArray(l.tree)) PK.SAM.libs.push({lid:String(l.lid||uid('u')),name:String(l.name||'?'),author:l.author||'',license:l.license||'',description:l.description||'',tags:PK.tuTagsIn(l.tags),tree:l.tree,ro:false}); }catch(e){} }); }catch(e){} })();
window.addEventListener('pagehide',()=>stopPreview());
PK.samInit=function(){ const b=PK.$('samImport'), f=PK.$('samFile'); if(!b||!f) return; b.onclick=()=>f.click(); f.onchange=async()=>{ const files=[...f.files]; f.value=''; if(files.length) await importFiles(files,false); }; };
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>PK.samInit()); else PK.samInit();
})(window.__PK);
