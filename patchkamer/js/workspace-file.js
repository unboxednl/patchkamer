// js/workspace-file.js — werkruimte opslaan als bestand en openen
(function(PK){
// ---- werkruimte: opslaan ----
const publicSrc=x=>{ const o={sid:x.sid,kind:x.kind,label:x.label}; ['url','owner','repo','ref','path','only'].forEach(k=>{ if(x[k]) o[k]=x[k]; }); return o; };
function workspaceState(embedAll){
  const used=new Map(); PK.Host.devices.forEach(r=>used.set(PK.Host.key(r.def.id,r.def.version),r.def));
  const defs=[...used.values()].filter(d=>!d._builtin).map(d=>{ const o=d._src||{kind:'paste'}, located=['github','url','folder'].includes(o.kind);
    const e={id:d.id,version:d.version,name:d.name}; if(located) e.src={sid:o.sid,kind:o.kind,url:o.url,path:o.path,label:o.label};
    if(embedAll||!located) e.code=d._code; return e; });
  const sids=new Set(defs.map(x=>x.src&&x.src.sid).filter(Boolean));
  return {format:'patchkamer-werkruimte',formatVersion:1,name:PK.WS.name,saved:new Date().toISOString(),
    sources:PK.SOURCES.filter(x=>sids.has(x.sid)).map(publicSrc),defs,...(PK.WS.song?{song:PK.WS.song}:{}),...PK.patchState()}; } PK.workspaceState=workspaceState;
const fileNameOf=n=>(String(n||PK.pkt('m.naamloos')).replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim()||PK.pkt('m.naamloos'))+'.patchkamer.json'; PK.fileNameOf=fileNameOf;
async function saveTextFile(filename,text){ return saveFileData(filename,text); } PK.saveTextFile=saveTextFile;
async function saveFileData(filename,text){
  if(window.claude&&typeof window.claude.use==='function'){ let dl=null; try{ dl=await window.claude.use('downloads'); }catch(e){}
    if(dl){ try{ await dl.save({filename,data:text}); return 'saved'; }catch(e){ if(e&&e.code==='declined') return 'declined'; } } }
  if(window.showSaveFilePicker){ try{ const ext=(filename.match(/\.[a-z0-9]+$/i)||['.json'])[0].toLowerCase(), mt={'.json':'application/json','.webm':'audio/webm','.mp4':'audio/mp4','.wav':'audio/wav','.zip':'application/zip','.txt':'text/plain'}[ext]||'application/octet-stream';
      const h=await window.showSaveFilePicker({suggestedName:filename,types:[{description:ext==='.json'?PK.pkt('m.patchkamer_werkruimte_bestandstype'):PK.pkt('m.bestand'),accept:{[mt]:[ext]}}]}); const w=await h.createWritable(); await w.write(text); await w.close(); return 'saved'; }
    catch(e){ if(e&&e.name==='AbortError') return 'declined'; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(text instanceof Blob?text:new Blob([text],{type:'application/json'})); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); return 'saved'; } PK.saveFileData=saveFileData;
async function openWorkspace(ws){
  let songMeta=null; if(ws&&ws.format==='patchkamer-song'&&ws.workspace&&typeof ws.workspace==='object'){ songMeta={title:String(ws.title||'').slice(0,80),author:String(ws.author||'').slice(0,60),license:String(ws.license||'').slice(0,64),description:String(ws.description||'').slice(0,400),...(ws.basedOn?{basedOn:ws.basedOn}:{})}; ws={...ws.workspace,name:ws.title||ws.workspace.name}; }
  if(!ws||!Array.isArray(ws.devices)){ PK.status(PK.pkt('m.dit_is_geen_patchkamer_werkruimte'),true); return false; }
  PK.WS.song=songMeta||(ws.song&&typeof ws.song==='object'?ws.song:null); if(songMeta) setTimeout(()=>PK.songShow(songMeta),300);
  const notes=[], need=new Map(); ws.devices.forEach(d=>need.set(PK.Host.key(d.def,d.version||''),{id:d.def,version:d.version}));
  const defs=Array.isArray(ws.defs)?ws.defs:[], wsSrc=Array.isArray(ws.sources)?ws.sources:[];
  for(const {id,version} of need.values()){
    if(PK.Host.registry.has(PK.Host.key(id,version))) continue;
    const entry=defs.find(x=>x.id===id&&x.version===version)||defs.find(x=>x.id===id); if(!entry) continue;   // geen info: loadPatch valt terug op een andere versie of meldt hem als ontbrekend
    let ok=false, why='';
    if(entry.src){ const known=PK.SOURCES.find(x=>x.sid===entry.src.sid)||PK.SOURCES.find(x=>x.kind===entry.src.kind&&x.label===entry.src.label);
      // dezelfde bibliotheek kan hier onder een andere vorm geladen zijn (map ↔ meegeleverd): zoek het pad daar
      if(!ok&&entry.src.path){ for(const d of PK.Host.registry.values()){ if(d.id===id&&d._src&&d._src.path===entry.src.path&&d._src.label===entry.src.label){ ok=true; break; } } if(ok) continue; }
      let src=known; if(!src){ const w=wsSrc.find(x=>x.sid===entry.src.sid)||{sid:entry.src.sid||PK.newSid(),kind:entry.src.kind,label:entry.src.label}; src={...publicSrc(w),added:Date.now()}; PK.SOURCES.push(src); PK.saveSources(); }
      const origin={sid:src.sid,kind:entry.src.kind,url:entry.src.url,path:entry.src.path,label:src.label};
      try{
        if(entry.src.url){ const r=await PK.fetchText(entry.src.url); await PK.loadDeviceSource(r.text,origin,true,PK.sameOrigin(entry.src.url)?entry.src.url:null); ok=true; if(r.cached) why=PK.pkt('m.eerder_opgehaalde_kopie_gebruikt'); if(!PK.SRCSTATE.has(src.sid)) PK.SRCSTATE.set(src.sid,{state:'ok',msg:PK.pkt('m.gebruikt_door_deze_werkruimte')}); }
        else if(entry.src.kind==='folder'){ const files=await PK.folderFiles(src,{interactive:true});
          if(!files) why=PK.pkt('m.map_klein')+src.label+PK.pkt('m.niet_gekozen');
          else { const hit=files.find(([pth])=>pth===entry.src.path); if(hit){ await PK.loadDeviceSource(await hit[1](),origin,true); ok=true; PK.SRCSTATE.set(src.sid,{state:'ok',msg:'verbonden'}); } else why=entry.src.path+PK.pkt('m.staat_niet_in_map')+src.label; } }
      }catch(e){ console.warn('werkruimte',entry.id,e); why=/ophalen/.test(e.message)?PK.pkt('m.bron_niet_bereikbaar'):e.message; }
    }
    if(!ok&&entry.code){ try{ await PK.loadDeviceSource(entry.code,entry.src?{...entry.src}:{kind:'embedded'},true); ok=true; if(entry.src) why=(why?why+', ':'')+PK.pkt('m.opgeslagen_code_gebruikt'); }catch(e){ why=e.message; } }
    if(ok&&!PK.Host.registry.has(PK.Host.key(id,version))) why=(why?why+', ':'')+PK.pkt('m.bron_heeft_nu_een_andere')+version;
    if(why) notes.push(`${entry.name||id}: ${why}`);
  }
  PK.paintLib(); PK.refreshVersionSelects(); PK.paintSources();
  PK.setName(ws.name||PK.pkt('m.naamloos')); PK.loadPatch(ws);
  const got=PK.Host.devices.size, want=ws.devices.length, missing=[...new Set(ws.devices.filter(d=>!PK.Host.latest(d.def)).map(d=>(defs.find(x=>x.id===d.def)||{}).name||d.def))];
  const msg=PK.pkt('m.geopend',PK.WS.name,got===want?PK.pktp('m.n_apparaat',want===1,want):PK.pkt('m.n_van_m_apparaten',got,want))+(missing.length?PK.pkt('m.ontbreekt',missing.join(', ')):'')+(notes.length?' · '+notes.join(' · '):'');
  setTimeout(()=>PK.status(msg,missing.length>0),60); return true; } PK.openWorkspace=openWorkspace;
})(window.__PK);
