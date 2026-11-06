// js/device-loader.js — contracttekst (sjabloon), ingebouwde apparaten en het laden van apparaatcode uit bron, bestand of tekst
(function(PK){

/* =====================================================================
   BUILT-IN DEVICES (each follows the contract)
   ===================================================================== */
const BUILTIN=[]; PK.BUILTIN=BUILTIN;
// origin: where this code came from ({sid,kind:'github'|'url'|'folder',url?,path?,label} | {kind:'file',name} | {kind:'paste'} | {kind:'embedded'})
async function loadDeviceSource(src,origin,quiet,importUrl){
  let def=null, err=null;
  if(importUrl){ try{ const mod=await import(importUrl+(importUrl.includes('?')?'&':'?')+'pk='+Date.now()); if(mod&&mod.default) def=mod.default; }catch(e){} }   // met een eigen tijdstempel, anders geeft de browser bij een nieuwe scan de oude module uit zijn cache
  if(!def) try{ const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'})); const mod=await import(url); URL.revokeObjectURL(url); def=mod.default; }
  catch(e){ err=e; try{ const body=src.replace(/export\s+default\s+/,'return '); def=(new Function(body))(); err=null; }catch(e2){ err=e2; } }
  if(def) err=null;
  if(err) throw new Error(PK.pkt('m.kon_de_module_niet_uitvoeren')+err.message+PK.pkt('m.in_de_artifact_weergave_kan'));
  validateDef(def); PK.pkApplyI18n(def); def._src=origin||{kind:'paste'}; def._code=src; delete def._builtin;
  const k=PK.Host.key(def.id,def.version), existed=PK.Host.registry.has(k); PK.Host.registry.set(k,def); if(!quiet){ PK.paintLib(); PK.refreshVersionSelects(); } def._replaced=existed; return def;
} PK.loadDeviceSource=loadDeviceSource;
function validateDef(d){
  const need=k=>{ if(!d||d[k]===undefined) throw new Error(PK.pkt('m.contract_veld_ontbreekt',k)); };
  ['id','name','version','kind','ports','create'].forEach(need);
  if(typeof d.create!=='function') throw new Error(PK.pkt('m.contract_create_moet_een_functie'));
  ['audioIn','audioOut','eventIn','eventOut','modIn','modOut','multiIn','multiOut','masteringIn','masteringOut','multiEventIn','multiEventOut'].forEach(k=>{ if(!Array.isArray(d.ports[k])) d.ports[k]=[]; });
  if(!['instrument','effect','mixer','output','utility','modulator'].includes(d.kind)) throw new Error(PK.pkt('m.contract_onbekende_kind')+d.kind+'"');
}
let _toastT=0; const status=(msg,err)=>{const el=PK.$('devStatus'); el.textContent=msg; el.classList.remove('act'); el.classList.toggle('err',!!err); el.classList.toggle('show',!!msg); clearTimeout(_toastT); if(msg) _toastT=setTimeout(()=>el.classList.remove('show'),err?7000:3500);}; PK.status=status;
// toast met knoppen: actions=[{label,fn}], o={ms (0 = blijft staan), err}; de gewone status() blijft werken en haalt de knoppen weer weg
function toastAction(msg,actions,o){ o=o||{}; const el=PK.$('devStatus'); el.textContent=''; const sp=document.createElement('span'); sp.className='tmsg'; sp.textContent=msg; el.appendChild(sp);
  (actions||[]).forEach(a=>{ const b=document.createElement('button'); b.type='button'; b.className='tact'; b.textContent=a.label; b.addEventListener('pointerdown',e=>e.stopPropagation()); b.addEventListener('click',e=>{ e.stopPropagation(); try{ a.fn(); }catch(err){ console.warn(err); } }); el.appendChild(b); });
  el.classList.toggle('err',!!o.err); el.classList.toggle('act',!!(actions&&actions.length)); el.classList.add('show'); clearTimeout(_toastT);
  const ms=o.ms==null?(o.err?7000:3500):o.ms; if(ms>0) _toastT=setTimeout(()=>{ el.classList.remove('show'); el.classList.remove('act'); },ms); } PK.toastAction=toastAction;
// het laden van één apparaatbestand (bestandskiezer #devFile en bestanden die op het canvas worden losgelaten); quiet: geen melding, alleen het resultaat
async function openDeviceFile(f,quiet){ try{ const def=await loadDeviceSource(await f.text(),{kind:'file',name:f.name}); if(!quiet) status(PK.pkt('m.versie_s_beschikbaar',def._replaced?PK.pkt('m.vervangen'):PK.pkt('m.geladen_3'),def.name,def.version,def.id,PK.Host.versionsOf(def.id).length)); return {def}; }catch(err){ if(!quiet) status(err.message,true); return {err}; } } PK.openDeviceFile=openDeviceFile;
})(window.__PK);
