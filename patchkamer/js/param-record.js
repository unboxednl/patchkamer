// js/param-record.js — regelaars van andere apparaten volgen, absoluut zetten en tegen modulatie vergrendelen (contract v1.21)
// Voor sequencers die instellingen opnemen en afspelen. Alles werkt op de regelaars met een id (data-pk-id, contract §12d) die ook in params() staan (§8):
//   watchParams(inst, doelId, fn)  fn(paramId, waarde 0..1, door) bij elke wijziging; door = 'user' (iemand draait), 'seq' (een andere sequencer zette hem) of 'mod' (modulatie: de effectieve waarde)
//   setParam(inst, doelId, paramId, waarde 0..1)  zet de regelaar zichtbaar; de zetter krijgt zijn eigen wijziging niet terug
//   lockParams(inst, doelId, ids | null)  modulatie op deze regelaars wordt genegeerd zolang het slot er is (null of [] = los)
(function(PK){
const clamp01=x=>Math.max(0,Math.min(1,x));
const isLog=m=>!!(m.dataset&&m.dataset.pkScale==='log');
const lim=m=>({mn:m.min===''?0:+m.min,mx:m.max===''?100:+m.max,st:+m.step||0});
// knopstand 0..1 van een schuif of draaiknop (zonder modulatie)
function toF(m){ const {mn,mx}=lim(m), v=+m.value; if(!(mx>mn)||!Number.isFinite(v)) return 0; return clamp01(isLog(m)&&mn>0?Math.log(v/mn)/Math.log(mx/mn):(v-mn)/(mx-mn)); }
function fromF(m,f){ const {mn,mx,st}=lim(m); let v=isLog(m)&&mn>0&&mx>mn?mn*Math.pow(mx/mn,f):mn+f*(mx-mn); if(st>0) v=mn+Math.round((v-mn)/st)*st; return Math.max(mn,Math.min(mx,+v.toFixed(10))); }
// de schuif of draaiknop met dit id op de kaart; andere soorten (keuzelijst, vinkje, knop) doen niet mee
function prmEl(r,id){ const e=PK.regEntries(r).find(x=>{ const d=PK.regDesc(x.el); return d&&d.id===id&&x.m.tagName==='INPUT'&&x.m.type==='range'; }); return e?e.m:null; }

const W=new Map();   // doelId -> Map(volgerId -> fn)
const L=new Map();   // doelId -> Map(vergrendelaarId -> Set(paramId))
const P=new Map();   // doelId -> Set met de id's waarvoor modulatie het laatst is gemeld
let setter=null;     // id van de instantie die op dit moment een regelaar zet

function emit(tid,id,v,by){ const m=W.get(tid); if(!m) return; m.forEach((fn,wid)=>{ if(wid===setter) return; try{ fn(id,v,by); }catch(e){ console.warn('watchParams',e); } }); }
// een luisteraar per kaart op 'input': ook van draaiknoppen en van regelaars in een shadow root (de gebeurtenis is composed)
function hook(tid){ const r=PK.Host.devices.get(tid); if(!r||r._prmL) return;
  r._prmL=e=>{ const t=e.composedPath&&e.composedPath()[0]; if(!t||t.tagName!=='INPUT'||t.type!=='range') return;
    const ent=PK.regEntries(r).find(x=>x.m===t), d=ent&&PK.regDesc(ent.el); if(!d||!d.id) return; emit(tid,d.id,toF(t),setter?'seq':'user'); };
  r.el.addEventListener('input',r._prmL); }
function prmWatch(inst,tid,fn){ const me=inst&&inst._id, r=PK.Host.devices.get(tid); if(!me||!r||tid===me) return false;
  if(fn==null){ const m=W.get(tid); if(m){ m.delete(me); if(!m.size){ W.delete(tid); P.delete(tid); } } return true; }
  if(typeof fn!=='function') return false;
  let m=W.get(tid); if(!m) W.set(tid,m=new Map()); m.set(me,fn); hook(tid); return true; }
function prmSet(inst,tid,id,f){ const me=inst&&inst._id, r=PK.Host.devices.get(tid); if(!me||!r||tid===me||typeof id!=='string'||!Number.isFinite(f)) return false;
  const m=prmEl(r,id); if(!m||m.disabled) return false; const v=fromF(m,clamp01(f));
  if(String(v)!==m.value){ setter=me; try{ PK.ctlFire(m,v,false); }finally{ setter=null; } }
  clearTimeout(m._pkT); m._pkT=setTimeout(()=>m.dispatchEvent(new Event('change',{bubbles:true,composed:true})),200); return true; }
function prmLock(inst,tid,ids){ const me=inst&&inst._id, r=PK.Host.devices.get(tid); if(!me||!r||tid===me) return false;
  const none=ids==null||(Array.isArray(ids)&&!ids.length); if(!none&&!Array.isArray(ids)) return false;
  let m=L.get(tid);
  if(none){ if(m){ m.delete(me); if(!m.size) L.delete(tid); } }
  else { const s=new Set(ids.filter(x=>typeof x==='string')); if(!m) L.set(tid,m=new Map()); m.set(me,s); PK.Host._dropModSig(v=>v.tid===tid&&s.has(v.pid)); }
  PK.modApply(tid); return true; }
const prmLocked=(tid,pid)=>{ const m=L.get(tid); if(!m) return false; for(const s of m.values()) if(s.has(pid)) return true; return false; };
// door modApply aangeroepen: haalt vergrendelde id's uit de som voor ze naar het apparaat gaan
const prmFilter=(tid,sum)=>{ const m=L.get(tid); if(m) m.forEach(s=>s.forEach(k=>{ delete sum[k]; })); };
// door modApply aangeroepen met de som die het apparaat krijgt: meld de effectieve waarde (knop + modulatie) aan de volgers
function prmModNotify(tid,sum){ const w=W.get(tid); if(!w) return; const r=PK.Host.devices.get(tid); if(!r) return;
  const had=P.get(tid)||new Set(), now=new Set(Object.keys(sum)); new Set([...now,...had]).forEach(id=>{ const m=prmEl(r,id); if(m) emit(tid,id,clamp01(toF(m)+(sum[id]||0)),'mod'); }); P.set(tid,now); }
// de parameterlijst van het doel (params(), contract §8) met de knopstand 0..1; value is null voor een parameter zonder schuif of draaiknop met dit id (die kun je niet opnemen)
function prmList(inst,tid){ const me=inst&&inst._id, r=PK.Host.devices.get(tid); if(!me||!r||tid===me||typeof r.inst.params!=='function') return [];
  let list=[]; try{ list=r.inst.params()||[]; }catch(e){ console.warn('params()',r.def.name,e); return []; }
  return list.slice(0,256).filter(p=>p&&typeof p.id==='string').map(p=>{ const m=prmEl(r,p.id); return {id:p.id,name:String(p.name==null?p.id:p.name).slice(0,60),lane:p.lane==null?'':String(p.lane).slice(0,40),laneName:p.laneName==null?'':String(p.laneName).slice(0,60),min:+p.min,max:+p.max,scale:p.scale==='log'?'log':'lin',value:m?toF(m):null}; }); }
// een apparaat verdwijnt: zijn volgers en sloten gaan mee
function prmCleanup(id){ W.delete(id); P.delete(id); L.delete(id); W.forEach((m,tid)=>{ m.delete(id); if(!m.size) W.delete(tid); });
  L.forEach((m,tid)=>{ if(m.delete(id)){ if(!m.size) L.delete(tid); if(PK.Host.devices.has(tid)) PK.modApply(tid); } }); }
PK.prmList=prmList; PK.prmWatch=prmWatch; PK.prmSet=prmSet; PK.prmLock=prmLock; PK.prmLocked=prmLocked; PK.prmFilter=prmFilter; PK.prmModNotify=prmModNotify; PK.prmCleanup=prmCleanup;
})(window.__PK);
