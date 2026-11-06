// js/workspace-local.js — werkruimtes in deze browser en de meegeleverde bibliotheek
(function(PK){
// ---- werkruimte in deze browser ----
const PKEY='patchkamerPatches';
const readP=()=>{try{return JSON.parse(localStorage.getItem(PKEY)||'{}');}catch(e){return {};}}; PK.readP=readP;
const writeP=o=>{try{localStorage.setItem(PKEY,JSON.stringify(o)); return true;}catch(e){return false;}}; PK.writeP=writeP;
function paintLibWs(){ const box=PK.$('wsLibList'); if(!box) return; box.innerHTML=''; let any=false;
  PK.SOURCES.forEach(src=>{ (PK.LIBWS.get(src.sid)||[]).forEach(w=>{ any=true; const it=document.createElement('div'); it.className='wsitem'; const info=document.createElement('div'); info.style.minWidth='0';
    info.innerHTML=`<span class="nm">${PK.esc(w.name)}</span><small>${PK.esc(src.label||'')}</small>`; const b=document.createElement('div'); b.className='b';
    const ld=document.createElement('button'); ld.className='small'; ld.textContent=PK.pkt('m.openen'); ld.onclick=async()=>{ try{ const ws=await w.load(); if(!ws.name) ws.name=w.name; await PK.openWorkspace(ws); closeWs(); }catch(e){ PK.status(PK.pkt('m.kon')+w.name+PK.pkt('m.niet_openen')+e.message,true); } };
    b.appendChild(ld); it.append(info,b); box.appendChild(it); }); });
  if(!any){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.geen_werkruimtes_in_je_bibliotheken'); box.appendChild(e); } }
function paintPatches(){ paintLibWs(); const o=readP(), box=PK.$('wsList'); box.innerHTML=''; const names=Object.keys(o).sort((a,b)=>(o[b].t||0)-(o[a].t||0));
  if(!names.length){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.nog_niets_opgeslagen_in_deze'); box.appendChild(e); return; }
  names.forEach(n=>{ const it=document.createElement('div'); it.className='wsitem'; const p=o[n].p||{}; const info=document.createElement('div'); info.style.minWidth='0';
    info.innerHTML=PK.pkt('m.apparaten',PK.esc(n),o[n].t?new Date(o[n].t).toLocaleString('nl-NL',{dateStyle:'medium',timeStyle:'short'}):'',(p.devices||[]).length);
    const b=document.createElement('div'); b.className='b'; const ld=document.createElement('button'); ld.className='small'; ld.textContent=PK.pkt('m.openen'); ld.onclick=async()=>{ const ws={...o[n].p}; ws.name=ws.name||n; await PK.openWorkspace(ws); closeWs(); };
    const rm=document.createElement('button'); rm.className='small'; rm.textContent='×'; rm.title=PK.pkt('m.verwijder_uit_deze_browser');
    rm.onclick=()=>{ if(rm.dataset.arm){ const x=readP(); delete x[n]; writeP(x); paintPatches(); } else { rm.dataset.arm='1'; rm.textContent=PK.pkt('m.weg'); setTimeout(()=>{ if(rm.isConnected){ rm.dataset.arm=''; rm.textContent='×'; } },2500); } };
    b.append(ld,rm); it.append(info,b); box.appendChild(it); }); } PK.paintPatches=paintPatches;
function openWs(){ if(!PK.$('prPanel').hidden){ PK.$('prPanel').hidden=true; PK.$('prBtn').setAttribute('aria-expanded','false'); } PK.wsPanel.hidden=false; PK.$('wsBtn').setAttribute('aria-expanded','true'); paintPatches(); } PK.openWs=openWs; function closeWs(){ PK.wsPanel.hidden=true; PK.$('wsBtn').setAttribute('aria-expanded','false'); } PK.closeWs=closeWs;
async function loadBundled(){ if(!PK.BUNDLED_LIB) return; const known=PK.SOURCES.find(x=>x.kind==='url'&&x.url===PK.BUNDLED_LIB);
  if(known){ await PK.loadSource(known,{interactive:true}); return; } await PK.addSource({sid:PK.newSid(),kind:'url',url:PK.BUNDLED_LIB,label:PK.pkt('m.meegeleverde_bibliotheek'),added:Date.now()}); } PK.loadBundled=loadBundled;
})(window.__PK);
