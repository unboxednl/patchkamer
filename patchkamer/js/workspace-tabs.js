// js/workspace-tabs.js — meerdere werkruimtes: tabbalk, wisselen, toevoegen, sluiten, herstel bij opstarten
(function(PK){
const WSL_MAX=10, wslUid=()=>'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); PK.WSL_MAX=WSL_MAX;
function wslSnap(){ const sl=PK.WSL.slots[PK.WSL.cur]; if(!sl) return; sl.name=PK.WS.name; sl.state=PK.Host.devices.size?PK.workspaceState(false):null; }
async function wslSave(){ if((typeof PK.PK_WIPING!=='undefined'&&PK.PK_WIPING)||!PK.WSL.ready||PK.WSL.busy) return; try{ wslSnap(); await PK.IDB.set('wslots',{cur:PK.WSL.cur,slots:JSON.parse(JSON.stringify(PK.WSL.slots))}); }catch(e){} } PK.wslSave=wslSave;
function wslPaint(){ const nav=PK.$('wsTabs'); if(!nav||!PK.WSL.slots.length) return; nav.innerHTML='';
  PK.WSL.slots.forEach((sl,i)=>{ const on=i===PK.WSL.cur, name=on?PK.WS.name:(sl.name||PK.pkt('m.naamloos'));
    const t=document.createElement('div'); t.className='wstab'+(on?' on':''); t.setAttribute('role','group');
    const b=document.createElement('button'); b.className='nm'; b.setAttribute('aria-pressed',on?'true':'false'); b.innerHTML='<kbd>F'+(i+1)+'</kbd><span>'+PK.esc(name)+'</span>'; b.title=name+' (F'+(i+1)+')'; b.onclick=()=>wslSwitch(i);
    const x=document.createElement('button'); x.className='x'; x.textContent='×'; x.title=PK.pkt('m.werkruimte_sluiten'); x.setAttribute('aria-label',PK.pkt('m.werkruimte_sluiten')+': '+name); x.onclick=()=>wslClose(i);
    t.append(b,x); nav.appendChild(t); });
  if(PK.WSL.slots.length<WSL_MAX){ const a=document.createElement('button'); a.className='add'; a.textContent='+'; a.title=PK.pkt('m.werkruimte_toevoegen'); a.setAttribute('aria-label',PK.pkt('m.werkruimte_toevoegen')); a.onclick=wslAdd; nav.appendChild(a); } } PK.wslPaint=wslPaint;
async function wslShow(i){   // de vloer leegmaken en werkruimte i openen (of een nieuwe, lege starten)
  if(PK.Host.running) PK.pkStop(); PK.clearFloor(); PK.WS.song=null; PK.WSL.cur=i; const t=PK.WSL.slots[i];
  if(t.state&&Array.isArray(t.state.devices)&&t.state.devices.length) await PK.openWorkspace(t.state); else { PK.setName(t.name||''); await PK.wsaAutoLoad(); }
  wslPaint(); }
async function wslSwitch(i){ if(PK.WSL.busy||i===PK.WSL.cur||i<0||i>=PK.WSL.slots.length) return; PK.WSL.busy=true; try{ wslSnap(); await wslShow(i); }finally{ PK.WSL.busy=false; } wslSave(); } PK.wslSwitch=wslSwitch;
async function wslAdd(){ if(PK.WSL.busy) return; if(PK.WSL.slots.length>=WSL_MAX){ PK.status(PK.pkt('m.werkruimte_maximum'),true); return; } PK.WSL.busy=true;
  try{ wslSnap(); PK.WSL.slots.push({id:wslUid(),name:PK.pkt('m.naamloos'),state:null}); await wslShow(PK.WSL.slots.length-1); }finally{ PK.WSL.busy=false; } wslSave(); } PK.wslAdd=wslAdd;
async function wslClose(i){ if(PK.WSL.busy) return; if(PK.WSL.slots.length<2){ PK.status(PK.pkt('m.werkruimte_laatste'),true); return; }
  const sl=PK.WSL.slots[i], name=i===PK.WSL.cur?PK.WS.name:(sl.name||PK.pkt('m.naamloos')), full=i===PK.WSL.cur?PK.Host.devices.size>0:!!(sl.state&&sl.state.devices&&sl.state.devices.length);
  if(full&&!(await PK.askUser(PK.pkt('m.werkruimte_sluiten_vraag',PK.esc(name)),PK.pkt('m.sluiten_knop'),PK.pkt('m.annuleren')))) return;
  PK.WSL.busy=true; try{ if(i===PK.WSL.cur){ const next=i>0?i-1:1; wslSnap(); const keep=PK.WSL.slots[next]; PK.WSL.slots.splice(i,1); PK.WSL.cur=-1; await wslShow(PK.WSL.slots.indexOf(keep)); }
    else { wslSnap(); const keep=PK.WSL.slots[PK.WSL.cur]; PK.WSL.slots.splice(i,1); PK.WSL.cur=PK.WSL.slots.indexOf(keep); wslPaint(); } }finally{ PK.WSL.busy=false; } wslSave(); }
async function wslInit(o){ const auto=o&&o.auto?o.auto:()=>PK.wsaAutoLoad(); let saved=await PK.IDB.get('wslots');
  if(saved&&Array.isArray(saved.slots)&&saved.slots.length){ PK.WSL.slots=saved.slots.filter(x=>x&&x.id).slice(0,WSL_MAX).map(x=>({id:x.id,name:String(x.name||'').slice(0,60),state:x.state||null})); PK.WSL.cur=Math.min(Math.max(0,saved.cur|0),PK.WSL.slots.length-1); }
  if(!PK.WSL.slots.length){ PK.WSL.slots=[{id:wslUid(),name:PK.pkt('m.naamloos'),state:null}]; PK.WSL.cur=0; }
  const t=PK.WSL.slots[PK.WSL.cur];
  if(!PK.PK_PENDING&&PK.Host.devices.size===0&&t.state&&Array.isArray(t.state.devices)&&t.state.devices.length){ if(o&&o.always) await auto(); if(o&&o.ws) await o.ws(); await PK.openWorkspace(t.state); }   // eerst de bibliotheken (devices, skins, presets), dan de werkruimte die ze gebruikt
  else if(PK.Host.devices.size===0){ if(o&&o.none) o.none(); await auto(); }
  PK.WSL.ready=true; wslPaint(); } PK.wslInit=wslInit;
})(window.__PK);
