// js/file-drop.js — bestanden (songs, werkruimtes, apparaten, tunes, presets, indelingen) op het canvas of de bibliotheek loslaten
(function(PK){
/* =====================================================================
   BESTANDEN DROPPEN · alleen een drop van BESTANDEN op #room (vloer, kaarten, bibliotheekvenster). Interne sleepacties (kaarten, bibliotheekapparaten, kabels,
   tekst) worden niet geraakt. Registratie in de bubbelfase; een gebeurtenis die een apparaat al afhandelde (defaultPrevented) wordt overgeslagen.
   Herkende bestanden gaan door de bestaande routes: apparaten openDeviceFile (#devFile), tunes/presets importTuneFiles (#prFile), indeling applyLayout,
   songs en werkruimtes songOpenFile (songs-paneel: altijd een nieuwe werkruimte-tab). Alles anders blijft ongemoeid (geen preventDefault).
   ===================================================================== */
const DROP_MAX_FILES=50, DROP_MAX_BYTES=50*1024*1024;
let dropDepth=0, dropOv=null, dropWatch=0, dropChain=Promise.resolve();
const dropHasFiles=e=>{ const t=e.dataTransfer&&e.dataTransfer.types; return !!t&&Array.prototype.includes.call(t,'Files'); };
const dropInRoom=e=>{ const room=document.getElementById('room'); return !!room&&e.target instanceof Node&&room.contains(e.target); };
const dropOk=e=>!e.defaultPrevented&&dropHasFiles(e)&&dropInRoom(e);
function dropOverlay(){ if(dropOv) return dropOv; const room=document.getElementById('room'); if(!room) return null;
  const o=document.createElement('div'); o.className='pkdrop'; o.id='dropOverlay'; o.setAttribute('role','status'); o.setAttribute('aria-live','polite'); o.hidden=true; o.innerHTML='<div class="box"><b></b><span></span></div>'; room.appendChild(o); dropOv=o; return o; }
function dropShow(){ const o=dropOverlay(); if(!o) return;
  if(o.hidden){ o.querySelector('b').textContent=PK.pkt('ui.t_drop_titel'); o.querySelector('span').textContent=PK.pkt('ui.t_drop_sub'); o.hidden=false; }
  clearTimeout(dropWatch); dropWatch=setTimeout(dropReset,1500); }   // vangnet: geen dragover meer = het slepen is voorbij
function dropReset(){ dropDepth=0; clearTimeout(dropWatch); if(dropOv&&!dropOv.hidden){ dropOv.hidden=true; dropOv.querySelector('b').textContent=''; dropOv.querySelector('span').textContent=''; } }
// soort bepalen: eerst de inhoud (format), zonder format de naam
function dropKind(name,text){
  if(/\.m?js$/i.test(name)) return PK.looksLikeDevice(text)?'device':null;
  let j; try{ j=JSON.parse(text); }catch(e){ return null; } if(!j||typeof j!=='object') return null;
  const fm=j.format;
  if(fm==='patchkamer-song') return 'song'; if(fm==='patchkamer-werkruimte') return 'ws'; if(fm==='patchkamer-tunes') return 'tune'; if(fm==='patchkamer-presets') return 'preset'; if(fm==='patchkamer-bibliotheek') return 'layout';
  if(fm) return null;
  if(/\.patchkamer-tunes\.json$/i.test(name)) return 'tune'; if(/\.patchkamer-presets\.json$/i.test(name)||Array.isArray(j.presets)) return 'preset';
  if(Array.isArray(j.devices)) return 'ws'; return null; }
const dropCandidate=f=>/\.m?js$/i.test(f.name)||(/\.json$/i.test(f.name)&&/patchkamer/i.test(f.name));
async function dropProcess(files,skipped,dirs){
  const errs=[]; let many=0;
  try{
    if(dirs.length) errs.push(PK.pkt('m.t_drop_map',dirs.join(', ')));
    skipped.forEach(n=>errs.push(PK.pkt('m.t_drop_onbekend',n)));
    if(files.length>DROP_MAX_FILES){ many=files.length-DROP_MAX_FILES; files=files.slice(0,DROP_MAX_FILES); errs.push(PK.pkt('m.t_drop_veel',DROP_MAX_FILES)); }
    const groups={device:[],tune:[],preset:[],layout:[],song:[],ws:[]};
    for(const f of files){
      if(f.size>DROP_MAX_BYTES){ errs.push(PK.pkt('m.t_drop_groot',f.name)); continue; }
      let text; try{ text=await f.text(); }catch(e){ errs.push(f.name+': '+e.message); continue; }
      const k=dropKind(f.name,text); if(!k){ errs.push(PK.pkt('m.t_drop_onbekend',f.name)); continue; } groups[k].push({f,text}); }
    const n={device:0,tune:0,preset:0,layout:0,song:0,ws:0};
    for(const {f} of groups.device){ const r=await PK.openDeviceFile(f,true); if(r.def) n.device++; else errs.push(f.name+': '+(r.err&&r.err.message||'?')); }
    for(const k of ['tune','preset']) for(const {f} of groups[k]){ try{ const r=await PK.importTuneFiles([f],true); n[k]+=r.n; r.errs.forEach(x=>errs.push(x)); }catch(e){ errs.push(f.name+': '+e.message); } }
    for(const {f,text} of groups.layout){ try{ PK.applyLayout(JSON.parse(text),null,true); n.layout++; }catch(e){ errs.push(f.name+': '+e.message); } }
    for(const k of ['song','ws']) for(const {f} of groups[k]){ try{ if(await PK.songOpenFile(f,true)) n[k]++; else errs.push(PK.pkt('m.t_drop_mislukt',f.name)); }catch(e){ errs.push(f.name+': '+e.message); } }
    const parts=[]; const one=x=>x===1;
    if(n.device) parts.push(PK.pktp('m.t_drop_dev',one(n.device),n.device)); if(n.tune) parts.push(PK.pktp('m.t_drop_tune',one(n.tune),n.tune)); if(n.preset) parts.push(PK.pktp('m.t_drop_preset',one(n.preset),n.preset));
    if(n.layout) parts.push(PK.pkt('m.t_drop_layout')); if(n.song) parts.push(PK.pktp('m.t_drop_song',one(n.song),n.song)); if(n.ws) parts.push(PK.pktp('m.t_drop_ws',one(n.ws),n.ws));
    const msg=parts.concat(errs.slice(0,6)).join(' · ')+(errs.length>6?' · …':''); if(msg) setTimeout(()=>PK.status(msg,!parts.length),(n.song||n.ws)?1600:0);   // een geopende song herschikt de kaarten na 1,3 s en meldt dat: de eindmelding komt daarna
  }catch(e){ PK.status(PK.pkt('m.t_drop_mislukt',e&&e.message||'?'),true); } }
function initFileDrop(){
  document.addEventListener('dragenter',e=>{ if(!dropOk(e)) return; e.preventDefault(); dropDepth++; dropShow(); });
  document.addEventListener('dragover',e=>{ if(!dropOk(e)){ if(e.defaultPrevented&&dropOv&&!dropOv.hidden) dropReset(); return; } e.preventDefault(); try{ e.dataTransfer.dropEffect='copy'; }catch(err){} dropShow(); });
  document.addEventListener('dragleave',e=>{ if(!dropHasFiles(e)||!dropInRoom(e)) return; if(dropDepth>0) dropDepth--; if(!dropDepth) dropReset(); });
  document.addEventListener('dragend',dropReset);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') dropReset(); });
  document.addEventListener('drop',e=>{ if(!dropOk(e)){ dropReset(); return; } dropReset();
    const picked=[], dirs=[], its=e.dataTransfer.items?[...e.dataTransfer.items].filter(i=>i.kind==='file'):[];
    if(its.length) its.forEach(i=>{ const en=i.webkitGetAsEntry?i.webkitGetAsEntry():null, f=i.getAsFile(); if(en&&en.isDirectory) dirs.push(en.name); else if(f) picked.push(f); });
    else [...e.dataTransfer.files].forEach(f=>picked.push(f));
    const cand=picked.filter(dropCandidate);
    if(!cand.length){ if(dirs.length) PK.status(PK.pkt('m.t_drop_map',dirs.join(', ')),true); return; }   // niets herkenbaars: geen preventDefault, de browser doet zijn gewone ding
    e.preventDefault(); dropChain=dropChain.then(()=>dropProcess(cand,picked.filter(f=>!dropCandidate(f)).map(f=>f.name),dirs)); }); } PK.initFileDrop=initFileDrop;
})(window.__PK);
