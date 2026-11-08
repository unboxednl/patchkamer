// js/tunes.js — tunes en presets: bibliotheken, toepassen, bewaren, paneel
(function(PK){
const PRKEY='patchkamerPresets', PRFMT='patchkamer-presets', TUFMT='patchkamer-tunes'; PK.PRKEY=PRKEY;
const prSavePrefs=()=>{ try{ localStorage.setItem(PRKEY,JSON.stringify(PK.PR.prefs)); }catch(e){} }; PK.prSavePrefs=prSavePrefs;
const prUid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6); PK.prUid=prUid;
const prClone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const prUser=()=>PK.PR.libs.filter(l=>!l.ro);
const prLib=lid=>PK.PR.libs.find(l=>l.lid===lid)||null; PK.prLib=prLib;
const prOn=l=>!PK.PR.prefs.off.includes(l.lid); PK.prOn=prOn;
const tuLibsFor=(dev,all)=>PK.PR.libs.filter(l=>l.device===dev&&(all||prOn(l)));
// tune = klank van een apparaat dat geluid maakt (kind 'instrument'); preset = instelling van al het andere
// (effect, mixer, uitgang, mastering, sequencer, modulator, controller)
function tuTypeOf(dev,fallback){ const d=PK.Host.latest(dev); if(d) return d.kind==='instrument'?'tune':'preset'; return fallback==='preset'?'preset':'tune'; }
const libType=l=>tuTypeOf(l.device,l.type);
// licenties (SPDX); de maker kiest uit twee, bestaande codes uit bestanden blijven staan en worden getoond
const LIC_ARR='LicenseRef-All-Rights-Reserved'; PK.LIC_ARR=LIC_ARR;
const licName=c=>!c?PK.pkt('m.geen_licentie_opgegeven'):c===LIC_ARR?PK.pkt('m.alle_rechten_voorbehouden'):c; PK.licName=licName;
const licOptions=cur=>PK.LICS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')+(cur&&!PK.LICS.some(x=>x[0]===cur)?`<option value="${PK.esc(cur)}">${PK.esc(cur)}</option>`:''); PK.licOptions=licOptions;
const licLine=(n,l)=>{ const lic=(n&&n.license)||(l&&l.license)||'', au=(n&&n.author)||(l&&l.author)||''; return licName(lic)+(au?' · door '+au:''); }; PK.licLine=licLine;
const tuSep=' › '; PK.tuSep=tuSep;
// alle knopen doorlopen: fn(knoop, pad[], ouderlijst)
function tuWalk(tree,fn,path=[]){ for(const n of tree){ fn(n,path,tree); if(n.type==='folder') tuWalk(n.children,fn,[...path,n.name]); } }
function tuTunes(l,kind){ const out=[]; tuWalk(l.tree,(n,path)=>{ if(n.type==='tune'&&(!kind||n.kind===kind)) out.push({n,path}); }); return out; } PK.tuTunes=tuTunes;
function tuFolders(l){ const out=[{fid:'',name:'(hoofdniveau)',path:[],node:null}]; tuWalk(l.tree,(n,path)=>{ if(n.type==='folder') out.push({fid:n.fid,name:[...path,n.name].join(tuSep),path:[...path,n.name],node:n}); }); return out; }
function tuFind(lid,pid){ const scan=l=>{ let hit=null; tuWalk(l.tree,(n,path,arr)=>{ if(!hit&&n.type==='tune'&&n.pid===pid) hit={l,n,path,arr}; }); return hit; };
  const l=prLib(lid); let h=l&&scan(l); if(h) return h; for(const x of PK.PR.libs){ h=scan(x); if(h) return h; } return null; }
function tuFolderNode(l,fid){ if(!fid) return null; let hit=null; tuWalk(l.tree,n=>{ if(!hit&&n.type==='folder'&&n.fid===fid) hit=n; }); return hit; }
const tuChildren=(l,fid)=>{ const f=tuFolderNode(l,fid); return f?f.children:l.tree; };
PK.prPersistT=0;
const prDump=()=>prUser().map(l=>({lid:l.lid,name:l.name,device:l.device,author:l.author||'',license:l.license||'',description:l.description||'',tags:l.tags||[],type:libType(l),tree:l.tree})); PK.prDump=prDump;
// direct wegschrijven (samengevoegd binnen één taak), en nogmaals bij het verlaten van de pagina
function prPersist(){ if(PK.prPersistT) return; PK.prPersistT=setTimeout(()=>{ PK.prPersistT=0; PK.IDB.set('tunes:user',prDump()); },0); } PK.prPersist=prPersist;
// de state die een tune bewaart: getPreset() als het apparaat die heeft (bv. zonder routing), anders getState()
function presetStateOf(r){ const i=r.inst; try{ return prClone(typeof i.getPreset==='function'?i.getPreset():i.getState?i.getState():{}); }catch(e){ console.warn('tune',r.def.name,e); return {}; } }
const presetKey=r=>{ try{ return JSON.stringify(presetStateOf(r)); }catch(e){ return ''; } };
function presetDirty(r){ return !!(r.preset&&r.presetSnap!=null&&presetKey(r)!==r.presetSnap); } PK.presetDirty=presetDirty;
const tuParts=r=>{ try{ const p=typeof r.inst.parts==='function'?r.inst.parts():null; return Array.isArray(p)?p.filter(x=>x&&typeof x.id==='string'):[]; }catch(e){ return []; } };

// ---- bestanden: tunepack (nieuw) en presetbestand (oud) → bibliotheken per apparaat ----
// tags (contract v1.19): paden als instrument/guitar/acoustic en style/hiphop, kleine letters, cijfers en streepjes, hoogstens 4 niveaus; een tag op een pack of map geldt voor alles daaronder
const TAGRE=/^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*){0,3}$/;
function tuTagsIn(v){ if(!Array.isArray(v)) return []; const out=[]; for(const t of v){ const s=typeof t==='string'?t.trim().toLowerCase():''; if(s.length<=60&&TAGRE.test(s)&&!out.includes(s)) out.push(s); if(out.length>=12) break; } return out; } PK.tuTagsIn=tuTagsIn;
function tuNodeIn(x,depth=0){ if(!x||typeof x!=='object'||depth>8) return null;
  if(typeof x.folder==='string'||x.type==='folder') return {type:'folder',tags:tuTagsIn(x.tags),fid:prUid('f'),name:String(x.folder||x.name||PK.pkt('m.map')).slice(0,60),children:(Array.isArray(x.items||x.children)?(x.items||x.children):[]).map(y=>tuNodeIn(y,depth+1)).filter(Boolean)};
  if(x.state&&typeof x.state==='object') return {type:'tune',pid:prUid('p'),name:String(x.name||PK.pkt('m.naamloos')).slice(0,80),kind:x.kind==='part'?'part':'set',ptype:x.kind==='part'?String(x.part||x.ptype||'').slice(0,40):undefined,author:String(x.author||'').slice(0,60),license:String(x.license||'').slice(0,64),basedOn:x.basedOn&&typeof x.basedOn==='object'?{name:String(x.basedOn.name||'').slice(0,80),author:String(x.basedOn.author||'').slice(0,60),license:String(x.basedOn.license||'').slice(0,64)}:undefined,tags:tuTagsIn(x.tags),ver:String(x.version||x.ver||''),state:x.state,t:+new Date(x.saved||0)||Date.now()};
  return null; }
function tuNodeOut(n){ return n.type==='folder'?{folder:n.name,...(n.tags&&n.tags.length?{tags:n.tags}:{}),items:n.children.map(tuNodeOut)}:{name:n.name,kind:n.kind,...(n.kind==='part'?{part:n.ptype||''}:{}),...(n.author?{author:n.author}:{}),...(n.license?{license:n.license}:{}),...(n.basedOn?{basedOn:n.basedOn}:{}),...(n.tags&&n.tags.length?{tags:n.tags}:{}),version:n.ver||'',saved:new Date(n.t||Date.now()).toISOString(),state:n.state}; }
function prNormalize(j,fallbackName){
  if(j&&j.format===TUFMT){ if(typeof j.device!=='string'||!j.device) throw new Error(PK.pkt('m.tunepack_zonder_apparaat_id_device'));
    return [{name:String(j.name||fallbackName||PK.pkt('m.tunes')).slice(0,80),device:j.device,type:'tune',author:String(j.author||'').slice(0,80),license:String(j.license||'').slice(0,64),description:String(j.description||'').slice(0,400),tags:tuTagsIn(j.tags),tree:(Array.isArray(j.tree)?j.tree:Array.isArray(j.tunes)?j.tunes:[]).map(x=>tuNodeIn(x)).filter(Boolean)}]; }
  if(j&&j.format===PRFMT&&typeof j.device==='string'&&Array.isArray(j.tree))
    return [{name:String(j.name||fallbackName||PK.pkt('m.presets')).slice(0,80),device:j.device,type:'preset',author:String(j.author||'').slice(0,80),license:String(j.license||'').slice(0,64),description:String(j.description||'').slice(0,400),tags:tuTagsIn(j.tags),tree:j.tree.map(x=>tuNodeIn(x)).filter(Boolean)}];
  if(!j||(j.format&&j.format!==PRFMT)||!Array.isArray(j.presets)) throw new Error(PK.pkt('m.geen_patchkamer_tune_of_presetbestand'));
  const by=new Map(); j.presets.filter(p=>p&&typeof p.device==='string'&&p.state&&typeof p.state==='object').forEach(p=>{ if(!by.has(p.device)) by.set(p.device,[]); by.get(p.device).push(tuNodeIn(p)); });
  return [...by.entries()].map(([device,tree])=>({name:String(j.name||fallbackName||PK.pkt('m.presets')).slice(0,80),device,author:'',license:'',description:'',tree})); } PK.prNormalize=prNormalize;
function tuExportJSON(l){ const T=libType(l); return JSON.stringify({format:T==='tune'?TUFMT:PRFMT,formatVersion:T==='tune'?1:2,device:l.device,deviceName:devName(l.device),name:l.name,author:l.author||'',license:l.license||'',description:l.description||'',...(l.tags&&l.tags.length?{tags:l.tags}:{}),saved:new Date().toISOString(),tree:l.tree.map(tuNodeOut)},null,1); }
async function presetsFromSource(src,list,errs){
  { const sm=list.filter(w=>/\.patchkamer-samples\.json$/i.test(w.path)); list=list.filter(w=>!/\.patchkamer-samples\.json$/i.test(w.path)); if(PK.samplesFromSource) await PK.samplesFromSource(src,sm,errs); }   // samplepacks horen bij de tab Samples
  PK.PR.libs=PK.PR.libs.filter(l=>!(l.ro&&l.src&&l.src.sid===src.sid));
  let pdone=0; for(const w of list){ if(PK.loadNote) PK.loadNote(pdone++,list.length,String(w.path).split('/').pop()); try{ const libs=prNormalize(await w.load(),PK.wsNameOf(w.path).replace(/\.patchkamer-(presets|tunes)$/i,''));
      libs.forEach(n=>{ const lid='b:'+src.sid+':'+w.path+':'+n.device; PK.PR.libs=PK.PR.libs.filter(l=>l.lid!==lid); PK.PR.libs.push({lid,...n,ro:true,src:{sid:src.sid,label:src.label,path:w.path}}); }); }
    catch(e){ errs.push(w.path+': '+e.message); } }
  presetRefreshAll(); } PK.presetsFromSource=presetsFromSource;

// ---- kaart: tunebalk (set) en, bij drumcomputers, een instrumentregel (part) ----
function tuOptions(r,kind){ return tuLibsFor(r.def.id).map(l=>({l,ts:tuTunes(l,kind)})).filter(x=>x.ts.length); }
function presetOptionsFor(def){ return tuLibsFor(def.id).map(l=>({l,ps:tuTunes(l,'set').map(x=>x.n)})).filter(x=>x.ps.length); }   // oude naam, voor tests
function tuOthers(id,pid){ const r=PK.Host.devices.get(id); const o=[]; PK.Host.devices.forEach((x,k)=>{ if(k!==id&&x.def.id===r.def.id&&x.preset&&x.preset.pid===pid) o.push(x); }); return o; }
function presetCardInit(id){ const r=PK.Host.devices.get(id); if(!r||!r.pbarEl) return; const pb=r.pbarEl; const W=PK.TW[tuTypeOf(r.def.id)];
  pb.innerHTML=PK.pkt('m.bewaar_instrument_bewaar',W.one,W.one,W.one,W.one,W.one,PK.esc(r.def.name),W.one,W.libs,PK.esc(r.def.name));
  pb.querySelector('.ps').onchange=e=>{ const v=e.target.value; if(!v) return; const [lid,pid]=v.split('|'); presetApply(id,lid,pid); };
  pb.querySelector('.pp').onclick=()=>presetStep(id,-1); pb.querySelector('.pn').onclick=()=>presetStep(id,1);
  pb.querySelector('.psv').onclick=()=>presetSaveDialog(id,'set');
  pb.querySelector('.pbrowse').onclick=()=>{ PK.TUFILTER=r.def.id; prOpenPanel(tuTypeOf(r.def.id)); };
  pb.querySelector('.ppart').onchange=()=>{ r.partSel=pb.querySelector('.ppart').value; presetPaint(id); };
  pb.querySelector('.ptune').onchange=e=>{ const v=e.target.value; if(!v) return; const [lid,pid]=v.split('|'); partApply(id,r.partSel,lid,pid); };
  pb.querySelector('.ppsv').onclick=()=>presetSaveDialog(id,'part');
  pb.addEventListener('pointerdown',e=>e.stopPropagation());
  // na een wijziging in de kaart: kijken of de klank nog gelijk is aan de tune
  let t=0; const chk=()=>{ clearTimeout(t); t=setTimeout(()=>presetPaint(id),350); };
  ['input','change','pointerup','keyup'].forEach(ev=>r.el.addEventListener(ev,e=>{ if(!pb.contains(e.target)) chk(); },true));
  presetPaint(id);
  if(PK.displayAttach){ PK.displayAttach(pb.querySelector('.ps'),{kind:'preset',prev:pb.querySelector('.pp'),next:pb.querySelector('.pn')}); PK.displayAttach(pb.querySelector('.ptune'),{kind:'tune'}); } } PK.presetCardInit=presetCardInit;   // schermpje (skins 0.6): alleen registreren, de DOM blijft zoals hij was
function tuFillSelect(sel,groups,curPid,dirty,emptyText,usedBy){ sel.innerHTML=''; const o0=document.createElement('option'); o0.value=''; o0.textContent=groups.length?emptyText[0]:emptyText[1]; sel.appendChild(o0); let found=false;
  groups.forEach(({label,items})=>{ const g=document.createElement('optgroup'); g.label=label;
    items.forEach(({l,n,path})=>{ const o=document.createElement('option'); o.value=l.lid+'|'+n.pid; const cur=curPid&&curPid===n.pid; if(cur) found=true;
      o.textContent=(path.length?path.join(tuSep)+tuSep:'')+n.name+(cur&&dirty?' *':'')+(usedBy&&usedBy(n)?' ⧉':''); g.appendChild(o); }); sel.appendChild(g); });
  return found; }
function presetPaint(id){ const r=PK.Host.devices.get(id); if(!r||!r.pbarEl) return; const sel=r.pbarEl.querySelector('.ps'); if(!sel) return;
  const groups=tuOptions(r,'set').map(({l,ts})=>({label:l.name+(l.ro?' (alleen-lezen)':''),items:ts.map(x=>({l,...x}))})), dirty=presetDirty(r);
  const W=PK.TW[tuTypeOf(r.def.id)]; const found=tuFillSelect(sel,groups,r.preset&&r.preset.pid,dirty,[PK.pkt('m.kies_een')+W.one+' —',PK.pkt('m.nog_geen')+W.many+' —'],n=>tuOthers(id,n.pid).length>0);
  { const h=r.preset&&tuFind(r.preset.lid,r.preset.pid); sel.title=h?PK.pkt('m.licentie',h.n.name,licLine(h.n,h.l)):''; }
  if(r.preset&&!found){ const o=document.createElement('option'); o.value=''; o.disabled=true; o.textContent=r.preset.name+(dirty?' *':'')+PK.pkt('m.bibliotheek_niet_geladen'); sel.appendChild(o); sel.selectedIndex=sel.options.length-1; }
  else sel.value=r.preset&&found?(tuFind(r.preset.lid,r.preset.pid)?.l.lid||r.preset.lid)+'|'+r.preset.pid:'';
  sel.classList.toggle('none',!r.preset); r.pbarEl.classList.toggle('dirty',dirty);
  const sv=r.pbarEl.querySelector('.psv'); sv.classList.toggle('on',dirty); sv.title=dirty?PK.pkt('m.gewijzigd_sinds')+r.preset.name+PK.pkt('m.afsluiter_bewaren'):PK.pkt('m.huidige_instelling_bewaren_als')+W.one;
  const n=groups.reduce((a,g)=>a+g.items.length,0); r.pbarEl.querySelector('.pp').disabled=!n; r.pbarEl.querySelector('.pn').disabled=!n;
  // instrumenten (drumcomputers, v1.9)
  const parts=tuParts(r), pr=r.pbarEl.querySelector('.pparts'); pr.hidden=!parts.length; r.pbarEl.classList.toggle('hasparts',parts.length>0);
  if(parts.length){ if(!r.partSel||!parts.some(p=>p.id===r.partSel)) r.partSel=parts[0].id; const ps=pr.querySelector('.ppart'); ps.innerHTML='';
    parts.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; const cur=r.partTunes&&r.partTunes[p.id]; o.textContent=p.name+(cur?' · '+cur.name:''); ps.appendChild(o); }); ps.value=r.partSel;
    const part=parts.find(p=>p.id===r.partSel), all=tuOptions(r,'part').flatMap(({l,ts})=>ts.map(x=>({l,...x}))),
      same=all.filter(x=>(x.n.ptype||'')===(part.type||'')), other=all.filter(x=>(x.n.ptype||'')!==(part.type||''));
    const grp=[]; if(same.length) grp.push({label:PK.pkt('m.past_bij')+(part.type||part.name),items:same}); if(other.length) grp.push({label:PK.pkt('m.andere_instrumenten'),items:other});
    const pt=pr.querySelector('.ptune'); tuFillSelect(pt,grp,r.partTunes&&r.partTunes[r.partSel]&&r.partTunes[r.partSel].pid,false,[PK.pkt('m.instrument_tune_laden'),PK.pkt('m.nog_geen_instrument_tunes')]);
    pt.querySelectorAll('option').forEach(o=>{ const h=o.value&&tuFind(...o.value.split('|')); if(h&&h.n.ptype&&h.n.ptype!==(part.type||'')) o.textContent+=' ('+h.n.ptype+')'; });
    const cur=r.partTunes&&r.partTunes[r.partSel]; pt.value=cur?(tuFind(cur.lid,cur.pid)?.l.lid||cur.lid)+'|'+cur.pid:''; } }
function presetRefreshAll(){ PK.Host.devices.forEach((r,id)=>presetPaint(id)); if(!PK.$('prPanel').hidden) prPaintPanel(); } PK.presetRefreshAll=presetRefreshAll;
function presetMark(id,p){ const r=PK.Host.devices.get(id); if(!r||!p) return; const h=tuFind(p.lid,p.pid); r.preset={lid:h?h.l.lid:p.lid,pid:p.pid,name:h?h.n.name:p.name}; r.presetSnap=presetKey(r); presetPaint(id); } PK.presetMark=presetMark;
// Master Director: staat de Director op een stijl, situatie en sterkte die precies een preset uit zijn eigen pack is (bijvoorbeeld "Situations › Club", na een preset laden of door dezelfde keuzes te maken),
// dan laden de doelen aan zijn gele kabels (ids in `ids`) hun eigen preset met dezelfde mapnaam en naam in plaats van het rekenrecept, zodat die in hun presetvak staat en hun waarden die van de preset zijn.
// Geeft de ids terug die zo zijn ingesteld; een doel zonder gelijknamige preset (en elke andere keuze of sterkte) valt terug op het recept van de Director.
function presetFollowMastering(did,ids){ const d=PK.Host.devices.get(did), done=[]; if(!d) return done; let st={}; try{ st=d.inst.getState()||{}; }catch(e){ return done; }
  let want=null; for(const l of PK.PR.libs){ if(l.device!==d.def.id) continue; tuWalk(l.tree,(m,path)=>{ const s=m.state; if(!want&&m.type==='tune'&&m.kind==='set'&&s&&s.style===st.style&&s.situation===st.situation&&Math.abs((+s.strength)-(+st.strength))<1e-9) want=[...path,m.name].join('/'); }); if(want) break; }
  if(!want) return done;
  (ids||[]).forEach(id=>{ const r=PK.Host.devices.get(id); if(!r||r.def.id==='nl.patchkamer.mixcheck') return; let hit=null;
    for(const l of PK.PR.libs){ if(l.device!==r.def.id) continue; tuWalk(l.tree,(m,path)=>{ if(!hit&&m.type==='tune'&&m.kind==='set'&&[...path,m.name].join('/')===want) hit={l,m}; }); if(hit) break; }
    if(hit&&presetApply(id,hit.l.lid,hit.m.pid,true)) done.push(id); });
  return done; } PK.presetFollowMastering=presetFollowMastering;
function presetApply(id,lid,pid,quiet){
  const r=PK.Host.devices.get(id), h=tuFind(lid,pid); if(!r||!h) return false; const p=h.n;
  if(h.l.device!==r.def.id){ PK.status(PK.pkt('m.is_een_tune_voor_niet',p.name,devName(h.l.device),r.def.name),true); return false; }
  if(p.kind==='part'){ const parts=tuParts(r); return partApply(id,r.partSel||(parts[0]&&parts[0].id),h.l.lid,pid,quiet); }
  const st=prClone(p.state);   // eigen kopie per exemplaar
  try{ if(typeof r.inst.setPreset==='function') r.inst.setPreset(st); else if(r.inst.setState) r.inst.setState(st); }
  catch(e){ PK.status(PK.pkt('m.tune_laden_mislukt',r.def.name,p.name,e.message),true); return false; }
  r.preset={lid:h.l.lid,pid,name:p.name}; r.presetSnap=presetKey(r); r.partTunes={}; presetPaint(id); PK.Host.devices.forEach((x,k)=>{ if(k!==id&&x.def.id===r.def.id) presetPaint(k); }); requestAnimationFrame(PK.drawCables);
  if(typeof PK.Host.paramsChanged==='function') PK.Host.paramsChanged(r.inst);
  const others=tuOthers(id,pid);
  if(!quiet) PK.status(`${r.def.name}: “${p.name}” · ${licLine(p,h.l)}`+(p.ver&&p.ver!==r.def.version?PK.pkt('m.gemaakt_met_v',p.ver):'')+(others.length?PK.pktp('m.ook_geladen_op_andere_exemplaren',others.length>1,others.length):''));
  return true; } PK.presetApply=presetApply;
function partApply(id,partId,lid,pid,quiet){ const r=PK.Host.devices.get(id), h=tuFind(lid,pid); if(!r||!h||!partId) return false;
  if(typeof r.inst.setPart!=='function'){ PK.status(PK.pkt('m.kent_geen_instrument_tunes',r.def.name),true); return false; }
  try{ r.inst.setPart(partId,prClone(h.n.state)); }catch(e){ PK.status(PK.pkt('m.instrument_tune_laden_mislukt',r.def.name,e.message),true); return false; }
  if(!r.partTunes) r.partTunes={}; r.partTunes[partId]={lid:h.l.lid,pid,name:h.n.name}; r.partSel=partId; presetPaint(id); if(typeof PK.Host.paramsChanged==='function') PK.Host.paramsChanged(r.inst);
  const part=tuParts(r).find(p=>p.id===partId); if(!quiet) PK.status(`${r.def.name} · ${part?part.name:partId}: “${h.n.name}” · ${licLine(h.n,h.l)}`); return true; } PK.partApply=partApply;
function presetStep(id,dir){ const r=PK.Host.devices.get(id); if(!r) return; const flat=tuOptions(r,'set').flatMap(({l,ts})=>ts.map(x=>[l.lid,x.n.pid])); if(!flat.length) return;
  let i=r.preset?flat.findIndex(([a,b])=>b===r.preset.pid):-1; i=i<0?(dir>0?0:flat.length-1):(i+dir+flat.length)%flat.length; presetApply(id,...flat[i]); }

// ---- bewaren: naam, bibliotheek (van dit apparaat) en map; dezelfde naam in dezelfde map = overschrijven ----
function presetSaveDialog(id,kind='set'){ const r=PK.Host.devices.get(id); if(!r) return;
  const parts=tuParts(r), part=kind==='part'?parts.find(p=>p.id===r.partSel)||parts[0]:null; if(kind==='part'&&!part) return;
  const writable=tuLibsFor(r.def.id,true).filter(l=>!l.ro); const curRef=kind==='part'?(r.partTunes&&r.partTunes[part.id]):r.preset, curH=curRef&&tuFind(curRef.lid,curRef.pid);
  const defLib=curH&&!curH.l.ro?curH.l:prLib(PK.PR.prefs.last[r.def.id])&&!prLib(PK.PR.prefs.last[r.def.id]).ro&&prLib(PK.PR.prefs.last[r.def.id]).device===r.def.id?prLib(PK.PR.prefs.last[r.def.id]):writable[0];
  const m=document.createElement('div'); m.className='pkmodal prdlg'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
  const W=PK.TW[tuTypeOf(r.def.id)];
  m.innerHTML=PK.pkt('m.naam_van_naam_nieuwe_bibliotheek',kind==='part'?PK.pkt('m.instrument_tune_bewaren')+PK.esc(r.def.name)+' · '+PK.esc(part.name):PK.pkt('m.soort_bewaren_titel',W.One,PK.esc(r.def.name)),W.Lib,PK.esc(r.def.name));
  const q=s=>m.querySelector(s), nm=q('.nm'), lb=q('.lb'), nl=q('.nl'), nln=q('.nln'), fd=q('.fd'), nf=q('.nf'), nfn=q('.nfn'), hint=q('.hint:not(.based)'), ok=q('[data-a="1"]'), au=q('.au'), li=q('.li');
  // maker en licentie: van de tune die je overschrijft, anders je vorige keuze; "gebaseerd op" bij een tune van iemand anders
  const mine=curH&&!curH.l.ro&&(!curH.n.author||curH.n.author===PK.PR.prefs.author);
  au.value=PK.PR.prefs.author||''; const defLic=(mine&&curH.n.license)||PK.PR.prefs.license||'CC-BY-4.0'; li.innerHTML=licOptions(defLic); li.value=defLic;
  const based=curH&&!mine?{name:curH.n.name,author:curH.n.author||curH.l.author||'',license:curH.n.license||curH.l.license||''}:null;
  if(based) q('.based').textContent=PK.pkt('m.gebaseerd_op_dat_gaat_mee_2',based.name,licLine({author:based.author,license:based.license}),W.one)+(based.license===LIC_ARR?PK.pkt('m.let_op_het_origineel_heeft'):'');
  lb.innerHTML=writable.map(l=>`<option value="${PK.esc(l.lid)}">${PK.esc(l.name)}</option>`).join('')+PK.pkt('m.nieuwe_bibliotheek_2');
  nln.value=r.def.name+' tunes'; nm.value=curRef?curRef.name:(kind==='part'?part.name+' '+(tuOptions(r,'part').reduce((a,g)=>a+g.ts.length,0)+1):r.def.name+' '+(tuOptions(r,'set').reduce((a,g)=>a+g.ts.length,0)+1));
  lb.value=defLib?defLib.lid:'__new';
  const fillFolders=()=>{ const l=prLib(lb.value); const fs=l?tuFolders(l):[{fid:'',name:'(hoofdniveau)'}]; const keep=fd.value;
    fd.innerHTML=fs.map(f=>`<option value="${PK.esc(f.fid)}">${PK.esc(f.name)}</option>`).join('')+PK.pkt('m.nieuwe_map_2');
    const curFid=curH&&curH.l===l?(()=>{ let fid=''; tuWalk(l.tree,(n,path,arr)=>{ if(n.type==='folder'&&n.children.includes(curH.n)) fid=n.fid; }); return fid; })():'';
    fd.value=fs.some(f=>f.fid===keep)?keep:curFid; };
  const upd=()=>{ nl.hidden=lb.value!=='__new'; nf.hidden=fd.value!=='__new'; const l=prLib(lb.value); const list=l?(fd.value==='__new'?[]:tuChildren(l,fd.value)):[];
    const ex=list.find(n=>n.type==='tune'&&n.kind===kind&&n.name.trim().toLowerCase()===nm.value.trim().toLowerCase());
    ok.textContent=ex?PK.pkt('m.overschrijven'):PK.pkt('m.bewaren'); hint.textContent=ex?PK.pkt('m.bestaat_al_in_deze_map',ex.name):(curH&&curH.l.ro?PK.pkt('m.is_alleen_lezen_je_bewaart',curH.l.name):''); ok.disabled=!nm.value.trim()||(fd.value==='__new'&&!nfn.value.trim()); };
  nm.oninput=upd; lb.onchange=()=>{ fillFolders(); upd(); }; fd.onchange=upd; nfn.oninput=upd; fillFolders(); upd();
  const done=v=>{ m.remove(); document.removeEventListener('keydown',key,true); if(v){ PK.PR.prefs.author=au.value.trim(); PK.PR.prefs.license=li.value; prSavePrefs(); presetSave(id,nm.value.trim(),lb.value,nln.value.trim(),{kind,partId:part&&part.id,fid:fd.value==='__new'?'':fd.value,newFolder:fd.value==='__new'?nfn.value.trim():'',author:au.value.trim(),license:li.value,basedOn:based}); } };
  const key=e=>{ if(e.key==='Escape'){ e.stopPropagation(); done(false); } if(e.key==='Enter'&&!ok.disabled&&!['SELECT'].includes(document.activeElement&&document.activeElement.tagName)){ e.preventDefault(); done(true); } };
  m.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) done(b.dataset.a==='1'); else if(e.target===m) done(false); }); document.addEventListener('keydown',key,true);
  document.body.appendChild(m); nm.focus(); nm.select(); }
function tuNewLib(dev,name){ const T=tuTypeOf(dev); const l={lid:prUid('u'),name:name||devName(dev)+' '+PK.TW[T].many,device:dev,type:T,author:PK.PR.prefs.author||'',license:PK.PR.prefs.license||'CC-BY-4.0',description:'',ro:false,tree:[]}; PK.PR.libs.push(l); return l; } PK.tuNewLib=tuNewLib;
function presetSave(id,name,lid,newLibName,opt={}){ const r=PK.Host.devices.get(id); if(!r||!name) return null; const kind=opt.kind||'set';
  let l=lid&&lid!=='__new'?prLib(lid):null; if(l&&(l.ro||l.device!==r.def.id)) l=null;
  if(!l&&lid!=='__new'){ const pl=prLib(PK.PR.prefs.last[r.def.id]); l=pl&&!pl.ro&&pl.device===r.def.id?pl:tuLibsFor(r.def.id,true).find(x=>!x.ro)||null; }
  if(!l) l=tuNewLib(r.def.id,newLibName);
  PK.PR.prefs.last[r.def.id]=l.lid; if(PK.PR.prefs.off.includes(l.lid)) PK.PR.prefs.off=PK.PR.prefs.off.filter(x=>x!==l.lid); prSavePrefs();
  let list=tuChildren(l,opt.fid||'');
  if(opt.newFolder){ let f=list.find(n=>n.type==='folder'&&n.name.toLowerCase()===opt.newFolder.toLowerCase()); if(!f){ f={type:'folder',fid:prUid('f'),name:opt.newFolder.slice(0,60),children:[]}; list.push(f); } list=f.children; }
  let state, ptype;
  if(kind==='part'){ const part=tuParts(r).find(p=>p.id===opt.partId); if(!part) return null; ptype=part.type||''; try{ state=prClone(r.inst.getPart(part.id)); }catch(e){ PK.status(PK.pkt('m.instrument_lezen_mislukt')+e.message,true); return null; } }
  else state=presetStateOf(r);
  let p=list.find(x=>x.type==='tune'&&x.kind===kind&&x.name.trim().toLowerCase()===name.toLowerCase());
  const meta={author:opt.author!==undefined?opt.author:(PK.PR.prefs.author||''),license:opt.license||PK.PR.prefs.license||'CC-BY-4.0',...(opt.basedOn?{basedOn:opt.basedOn}:{})};
  if(p){ p.state=state; p.ver=r.def.version; p.t=Date.now(); p.name=name; if(kind==='part') p.ptype=ptype; Object.assign(p,meta); if(!opt.basedOn) delete p.basedOn; }
  else { p={type:'tune',pid:prUid('p'),name,kind,ptype,tags:[],ver:r.def.version,state,t:Date.now(),...meta}; list.push(p); }
  if(kind==='part'){ if(!r.partTunes) r.partTunes={}; r.partTunes[opt.partId]={lid:l.lid,pid:p.pid,name}; }
  else { r.preset={lid:l.lid,pid:p.pid,name:p.name}; r.presetSnap=JSON.stringify(state); }
  prPersist(); presetRefreshAll(); PK.status(PK.pkt('m.bewaard_in',kind==='part'?'Instrument-tune':PK.TW[libType(l)].One,name,l.name,licName(meta.license))); return p; } PK.presetSave=presetSave;
PK.prOpen=new Set(), PK.TUFILTER='', PK.TUMODE='tune', PK.TUQ=''; PK.TUVIEW='device'; try{ const v=localStorage.getItem('patchkamer.tuView'); if(v==='instrument'||v==='style') PK.TUVIEW=v; }catch(e){}
// de tabs Tunes en Presets van het bibliotheekvenster delen één paneel (#prPanel); prShowMode zet de soort en tekent hem
function prShowMode(mode){ if(mode==='tune'||mode==='preset'){ if(mode!==PK.TUMODE&&PK.TUFILTER&&tuTypeOf(PK.TUFILTER)!==mode) PK.TUFILTER=''; PK.TUMODE=mode; }
  const t=PK.$('prTitle'); if(t) t.textContent=PK.TW[PK.TUMODE].libs.replace(/^./,c=>c.toUpperCase()); PK.prPanel.setAttribute('aria-label',PK.TW[PK.TUMODE].Many); prPaintPanel(); } PK.prShowMode=prShowMode;
function prOpenPanel(mode){ PK.libOpen(mode==='preset'?'presets':'tunes'); } PK.prOpenPanel=prOpenPanel;
function prClosePanel(){ if(PK.libTab()==='tunes'||PK.libTab()==='presets') PK.libClose(); } PK.prClosePanel=prClosePanel;
const devName=d=>(PK.Host.latest(d)||{}).name||d;
function armBtn(b,label,ask,fn){ b.textContent=label; b.onclick=()=>{ if(b.dataset.arm){ fn(); } else { b.dataset.arm='1'; b.textContent=ask; setTimeout(()=>{ if(b.isConnected){ b.dataset.arm=''; b.textContent=label; } },2500); } }; }
function tuInline(el,value,fin){ const i=document.createElement('input'); i.type='text'; i.value=value; i.maxLength=80; el.replaceWith(i); i.focus(); i.select(); let doneF=false; const f=ok=>{ if(doneF) return; doneF=true; fin(ok&&i.value.trim()?i.value.trim():null); }; i.onkeydown=e=>{ e.stopPropagation(); if(e.key==='Enter') f(true); if(e.key==='Escape') f(false); }; i.onblur=()=>f(true); i.onpointerdown=e=>e.stopPropagation(); }
function mk(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; } PK.mk=mk;
function mbtn(label,title,fn){ const b=mk('button','small'); b.textContent=label; if(title) b.title=title; if(fn) b.onclick=fn; return b; }
function tuInfoDialog(l){ const m=mk('div','pkmodal prdlg'); m.setAttribute('role','dialog');
  m.innerHTML=PK.pkt('m.naam_maker_standaardlicentie_voor_nieuwe',PK.TW[libType(l)].Lib,PK.esc(devName(l.device)),PK.TW[libType(l)].many,licOptions(l.license),PK.TW[libType(l)].one,PK.TW[libType(l)].one);
  const q=s=>m.querySelector(s); q('.a').value=l.name; q('.b').value=l.author||''; q('.c').value=l.license||'CC-BY-4.0'; q('.d').value=l.description||'';
  const done=v=>{ m.remove(); if(v){ l.name=q('.a').value.trim()||l.name; l.author=q('.b').value.trim(); l.license=q('.c').value; l.description=q('.d').value.trim(); prPersist(); presetRefreshAll(); } };
  m.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) done(b.dataset.a==='1'); else if(e.target===m) done(false); }); m.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Escape') done(false); });
  document.body.appendChild(m); q('.a').focus(); }
function tuMoveSelect(l,node){ const s=mk('select','small mv'); s.title=PK.pkt('m.verplaats_naar_een_andere_map'); s.innerHTML='<option value="">verplaats…</option>'+tuFolders(l).filter(f=>!(node.type==='folder'&&(f.node===node||(()=>{ let inside=false; if(f.node) tuWalk(node.children,n=>{ if(n===f.node) inside=true; }); return inside; })()))).map(f=>`<option value="${PK.esc(f.fid||'__root')}">${PK.esc(f.name)}</option>`).join('');
  s.onchange=()=>{ if(!s.value) return; const dest=s.value==='__root'?l.tree:tuChildren(l,s.value); tuWalk(l.tree,(n,p,arr)=>{ if(n===node){ const i=arr.indexOf(n); if(i>=0) arr.splice(i,1); } }); dest.push(node); prPersist(); presetRefreshAll(); }; s.onpointerdown=e=>e.stopPropagation(); return s; }
function tuPaintTree(box,l,list,depth){
  const sorted=[...list].sort((a,b)=>(a.type===b.type?a.name.localeCompare(b.name,'nl'):a.type==='folder'?-1:1));
  sorted.forEach(n=>{ const it=mk('div','pritem'+(n.type==='folder'?' fold':'')); it.style.paddingLeft=(6+depth*14)+'px';
    const nm=mk('span','nm'); const bb=mk('div','b');
    if(n.type==='folder'){ const open=PK.prOpen.has(n.fid); nm.innerHTML=`${open?'▾':'▸'} 📁 ${PK.esc(n.name)}<small>${tuTunes({tree:n.children}).length}</small>`; nm.style.cursor='pointer'; nm.onclick=()=>{ open?PK.prOpen.delete(n.fid):PK.prOpen.add(n.fid); prPaintPanel(); };
      if(!l.ro){ bb.append(mbtn(PK.pkt('m.plus_map'),PK.pkt('m.map_hierbinnen'),()=>{ n.children.push({type:'folder',fid:prUid('f'),name:PK.pkt('m.nieuwe_map'),children:[]}); PK.prOpen.add(n.fid); prPersist(); prPaintPanel(); }), mbtn(PK.pkt('m.naam'),'',()=>tuInline(nm,n.name,v=>{ if(v){ n.name=v.slice(0,60); prPersist(); } presetRefreshAll(); })), tuMoveSelect(l,n));
        const rm=mbtn('×',PK.pkt('m.map_met_inhoud_verwijderen')); armBtn(rm,'×','Weg?',()=>{ tuWalk(l.tree,(x,p,arr)=>{ if(x===n) arr.splice(arr.indexOf(x),1); }); prPersist(); presetRefreshAll(); }); bb.append(rm); }
      it.append(nm,bb); box.appendChild(it); if(open) tuPaintTree(box,l,n.children,depth+1); return; }
    nm.innerHTML=`${PK.esc(n.name)}<small>${n.kind==='part'?'instrument'+(n.ptype?' · '+PK.esc(n.ptype):''):PK.TW[libType(l)].one} · v${PK.esc(n.ver||'?')} · ${PK.esc(licLine(n,l))}${n.basedOn?PK.pkt('m.gebaseerd_op_2')+PK.esc(n.basedOn.name):''}</small>`;
    const ap=mbtn(PK.pkt('m.laden'),PK.pkt('m.op_de_geselecteerde_kaart_van'),()=>prApplyFromPanel(l.lid,n.pid)); ap.disabled=!PK.Host.latest(l.device); bb.appendChild(ap);
    if(!l.ro){ bb.append(mbtn(PK.pkt('m.naam'),'',()=>tuInline(nm,n.name,v=>{ if(v){ n.name=v; PK.Host.devices.forEach(r=>{ if(r.preset&&r.preset.pid===n.pid) r.preset.name=v; }); prPersist(); } presetRefreshAll(); })), tuMoveSelect(l,n));
      const rm=mbtn('×'); armBtn(rm,'×','Weg?',()=>{ tuWalk(l.tree,(x,p,arr)=>{ if(x===n) arr.splice(arr.indexOf(x),1); }); prPersist(); presetRefreshAll(); }); bb.append(rm); }
    else { const own=tuLibsFor(l.device,true).filter(x=>!x.ro); if(own.length){ const cp=mbtn('→ '+own[0].name,PK.pkt('m.kopieer_naar_je_eigen_bibliotheek'),()=>{ own[0].tree.push({...prClone(n),pid:prUid('p'),t:Date.now()}); prPersist(); presetRefreshAll(); PK.status(PK.pkt('m.gekopieerd_naar',n.name,own[0].name)); }); bb.appendChild(cp); } }
    it.append(nm,bb); box.appendChild(it); }); }
function prPaintPanel(){ const box=PK.$('prLibs'); box.innerHTML=''; { const la=PK.$('prLoadAll'); la.textContent=PK.pkt(PK.TUMODE==='tune'?'m.alle_tunes_laden':'m.alle_presets_laden'); la.title=PK.pkt(PK.TUMODE==='tune'?'m.alles_laden_titel_tunes':'m.alles_laden_titel_presets'); } PK.$('prShowBar').checked=PK.PR.prefs.bar!==false;
  const view=PK.TUMODE==='preset'&&PK.TUVIEW==='instrument'?'style':PK.TUVIEW;   // presets (effecten, mixers, …) hebben geen instrument
  { const vw=mk('div','wsrow tuview'); [['device','m.tv_apparaat'],['instrument','m.tv_instrument'],['style','m.tv_stijl']].filter(([k])=>k!=='instrument'||PK.TUMODE==='tune').forEach(([k,key])=>{ const b=mbtn(PK.pkt(key),'',()=>{ PK.TUVIEW=k; try{ localStorage.setItem('patchkamer.tuView',k); }catch(e){} prPaintPanel(); }); if(view===k) b.classList.add('on'); b.setAttribute('aria-pressed',String(view===k)); vw.appendChild(b); }); box.appendChild(vw); }
  if(view!=='device'&&PK.tuBrowse){ PK.tuBrowse(box,view); return; }
  const W=PK.TW[PK.TUMODE];
  const devs=[...new Set([...PK.PR.libs.map(l=>l.device),...[...PK.Host.devices.values()].map(r=>r.def.id)])].filter(d=>tuTypeOf(d,(PK.PR.libs.find(l=>l.device===d)||{}).type)===PK.TUMODE).sort((a,b)=>devName(a).localeCompare(devName(b),'nl'));
  const top=mk('div','wsrow'); const fsel=mk('select','small'); fsel.innerHTML=PK.pkt('m.alle_apparaten')+devs.map(d=>`<option value="${PK.esc(d)}">${PK.esc(devName(d))} (${tuLibsFor(d,true).length})</option>`).join(''); fsel.value=devs.includes(PK.TUFILTER)?PK.TUFILTER:''; fsel.onchange=()=>{ PK.TUFILTER=fsel.value; prPaintPanel(); };
  const nb=mbtn(PK.pkt('m.nieuwe_bibliotheek'),W.lib+PK.pkt('m.voor_het_gekozen_apparaat'),()=>{ const sd=PK.selected&&PK.Host.devices.get(PK.selected)&&PK.Host.devices.get(PK.selected).def.id; const dev=PK.TUFILTER||(sd&&tuTypeOf(sd)===PK.TUMODE?sd:''); if(!dev){ PK.status(PK.pkt('m.kies_eerst_een_apparaat_filter'),true); return; } const l=tuNewLib(dev); PK.prOpen.add(l.lid); PK.TUFILTER=dev; prPersist(); presetRefreshAll(); });
  top.append(mk('span','note',PK.pkt('m.apparaat')),fsel,nb); box.appendChild(top);
  const shown=devs.filter(d=>!PK.TUFILTER||d===PK.TUFILTER).filter(d=>tuLibsFor(d,true).length||d===PK.TUFILTER);
  if(!shown.length){ box.appendChild(mk('div','note',PK.pkt('m.nog_geen_bewaar_een_via',W.libs,W.one,W.one)+(PK.TUMODE==='tune'?PK.pkt('m.tunes_zijn_voor_apparaten_die'):PK.pkt('m.presets_zijn_voor_apparaten_zonder')))); return; }
  shown.forEach(dev=>{ const h=mk('h4','tudev'); h.textContent=devName(dev)+(PK.Host.latest(dev)?'':PK.pkt('m.apparaat_niet_geladen')); box.appendChild(h);
    const libs=tuLibsFor(dev,true); if(!libs.length) box.appendChild(mk('div','note',PK.pkt('m.nog_geen_bibliotheek_voor_dit')));
    libs.forEach(l=>{ const row=mk('div','prlib'); const sp=mk('span'); const cb=mk('input'); cb.type='checkbox'; cb.checked=prOn(l); cb.title=PK.pkt('m.zichtbaar_in_de_keuzelijst_op'); cb.onchange=()=>{ PK.PR.prefs.off=cb.checked?PK.PR.prefs.off.filter(x=>x!==l.lid):[...new Set([...PK.PR.prefs.off,l.lid])]; prSavePrefs(); presetRefreshAll(); };
      const info=mk('div'); info.style.minWidth='0'; const nT=tuTunes(l).length, nP=tuTunes(l,'part').length;
      info.innerHTML=PK.pktp('m.tekst',PK.prOpen.has(l.lid),PK.esc(l.name),nT,nT===1?W.one:W.many,nP?' (waarvan '+nP+' instrument)':'',l.author?' · '+PK.esc(l.author):'',l.license?' · '+PK.esc(licName(l.license)):'',l.ro?PK.pkt('m.alleen_lezen')+PK.esc(l.src&&l.src.label||''):'');
      info.querySelector('.nm').onclick=()=>{ PK.prOpen.has(l.lid)?PK.prOpen.delete(l.lid):PK.prOpen.add(l.lid); prPaintPanel(); };
      const b=mk('div','b');
      const EXT=libType(l)==='tune'?'.patchkamer-tunes.json':'.patchkamer-presets.json'; b.appendChild(mbtn(PK.pkt('m.exporteer'),PK.pkt('m.bewaar_als')+W.one+'pack ('+EXT+PK.pkt('m.om_te_delen'),async()=>{ const fn=(String(devName(l.device)+' - '+l.name).replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').trim()||W.many)+EXT; const r=await PK.saveFileData(fn,tuExportJSON(l)); PK.status(r==='saved'?'Geëxporteerd: '+fn:PK.pkt('m.exporteren_geannuleerd')); }));
      if(l.ro) b.appendChild(mbtn(PK.pkt('m.kopie'),PK.pkt('m.eigen_aanpasbare_kopie_maken'),()=>{ const n={...prClone({...l,src:undefined}),lid:prUid('u'),name:l.name+PK.pkt('m.kopie_suffix'),ro:false}; tuWalk(n.tree,x=>{ if(x.type==='tune') x.pid=prUid('p'); else x.fid=prUid('f'); }); PK.PR.libs.push(n); prPersist(); PK.prOpen.add(n.lid); presetRefreshAll(); PK.status(PK.pkt('m.kopie_gemaakt')+n.name); }));
      else { b.append(mbtn(PK.pkt('m.plus_map'),PK.pkt('m.map_op_het_hoogste_niveau'),()=>{ l.tree.push({type:'folder',fid:prUid('f'),name:PK.pkt('m.nieuwe_map'),children:[]}); PK.prOpen.add(l.lid); prPersist(); prPaintPanel(); }), mbtn(PK.pkt('m.info'),PK.pkt('m.naam_maker_licentie_en_omschrijving'),()=>tuInfoDialog(l)));
        const rm=mbtn('×',PK.pkt('m.bibliotheek_verwijderen')); armBtn(rm,'×','Weg?',()=>{ PK.PR.libs=PK.PR.libs.filter(x=>x!==l); prPersist(); presetRefreshAll(); PK.status(PK.pkt('m.bibliotheek_verwijderd')+l.name); }); b.appendChild(rm); }
      row.append(sp,cb,info,b); box.appendChild(row);
      if(PK.prOpen.has(l.lid)){ const list=mk('div','prlist'); if(!l.tree.length) list.appendChild(mk('div','note',PK.pkt('m.leeg_bewaar')+W.many+PK.pkt('m.via_bewaar_op_een_kaart')+PK.esc(devName(dev))+'.')); else tuPaintTree(list,l,l.tree,0); box.appendChild(list); } }); }); } PK.prPaintPanel=prPaintPanel;
// alle tunes (of presets, volgens het tabblad) van bibliotheken die aanstaan, met hun geldende tags: die van het pack, van de mappen erboven en van de tune zelf; instrumenten (kind part) tellen niet mee
function tuTagged(){ const out=[]; PK.PR.libs.filter(l=>libType(l)===PK.TUMODE&&prOn(l)).forEach(l=>{ const walk=(list,inh,path)=>{ for(const n of list){ if(n.type==='folder') walk(n.children,[...inh,...(n.tags||[])],[...path,n.name]); else if(n.kind!=='part') out.push({l,n,path,tags:[...new Set([...inh,...(n.tags||[])])]}); } }; walk(l.tree,l.tags||[],[]); }); return out; } PK.tuTagged=tuTagged; PK.tuDevName=devName;
function prApplyFromPanel(lid,pid){ const h=tuFind(lid,pid); if(!h) return; const dev=h.l.device;
  let id=PK.selected&&PK.Host.devices.get(PK.selected)&&PK.Host.devices.get(PK.selected).def.id===dev?PK.selected:null;
  if(!id) for(const [k,r] of PK.Host.devices) if(r.def.id===dev){ id=k; break; }
  if(!id){ const before=new Set(PK.Host.devices.keys()); PK.placeNew(dev); id=[...PK.Host.devices.keys()].find(k=>!before.has(k)); }
  if(id){ presetApply(id,h.l.lid,pid); PK.select(id); } } PK.prApplyFromPanel=prApplyFromPanel;
// tune- en presetbestanden importeren (knop Importeren en bestanden die op het canvas worden losgelaten); quiet: geen melding, alleen {n,errs}
async function importTuneFiles(files,quiet){ let n=0; const errs=[];
  for(const f of files){ try{ const libs=prNormalize(JSON.parse(await f.text()),f.name.replace(/\.patchkamer-(presets|tunes)\.json$|\.json$/i,''));
      libs.forEach(j=>{ let name=j.name; while(PK.PR.libs.some(l=>l.device===j.device&&l.name===name)) name=name.replace(/( \(\d+\))?$/,m=>' ('+((+(m.match(/\d+/)||[1])[0])+1)+')');
        const l={lid:prUid('u'),...j,name,ro:false}; PK.PR.libs.push(l); PK.prOpen.add(l.lid); n++; }); }
    catch(err){ errs.push(f.name+': '+err.message); } }
  prPersist(); presetRefreshAll(); if(!quiet) PK.status(n?PK.pktp('m.tunebibliotheken_ge_mporteerd_tunebibliotheek_ge',n>1,n)+(errs.length?' · '+errs.join(' · '):''):errs.join(' · '),!n); return {n,errs}; } PK.importTuneFiles=importTuneFiles;
})(window.__PK);
