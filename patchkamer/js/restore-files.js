// js/restore-files.js — bestanden van internet die bij een geopende song horen (kits, samples) automatisch laden: instelling en aanroep van restoreFiles() (contract v1.36)
(function(PK){
const KEY='patchkamer.restoreFiles';
let mem=null;
function restoreFilesOn(){ let v=mem; try{ const s=localStorage.getItem(KEY); if(s==='1'||s==='0') v=s; }catch(e){} return v!=='0'; } PK.restoreFilesOn=restoreFilesOn;
function restoreFilesPaint(){ const e=PK.$('restoreFilesCb'); if(e) e.checked=restoreFilesOn(); }
function restoreFilesSet(on){ mem=on?'1':'0'; try{ localStorage.setItem(KEY,mem); }catch(e){} restoreFilesPaint(); } PK.restoreFilesSet=restoreFilesSet;
// na het laden van een werkruimte of song: elk apparaat dat restoreFiles() heeft haalt zelf op wat zijn state aanwijst, een voor een
// (kaarten bouwen hun scherm en state eerst op); alleen als dit nog de geladen werkruimte is en de instelling aan staat
let gen=0;
function restoreFilesRun(){ if(!restoreFilesOn()) return; const my=++gen;
  setTimeout(async()=>{ const list=[...PK.Host.devices.entries()].filter(([,r])=>!r.pvw&&r.inst&&typeof r.inst.restoreFiles==='function');
    for(const [id,r] of list){ if(my!==gen||!restoreFilesOn()) return; if(PK.Host.devices.get(id)!==r) continue;
      try{ await r.inst.restoreFiles(); }catch(e){ console.warn('restoreFiles()',r.def.name,e); } } },700); } PK.restoreFilesRun=restoreFilesRun;
function restoreFilesInit(){ const e=PK.$('restoreFilesCb'); if(e) e.onchange=()=>restoreFilesSet(e.checked); restoreFilesPaint(); } PK.restoreFilesInit=restoreFilesInit;
})(window.__PK);
