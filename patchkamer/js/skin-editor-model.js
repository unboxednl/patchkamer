// js/skin-editor-model.js — skin-editor: het model (één skin-object in skinbestand-vorm), sjablonen, bouwen, valideren, indelingshulp en het concept in localStorage
(function(PK){
/* =====================================================================
   SKIN-EDITOR · MODEL. m = {dev, name, author, version, dflt, design, aps:[{id,name,description?,when?,css,assets,design?}]}: dezelfde vorm als het skinbestand.
   Elk formulier schrijft hierin; het voorbeeld past het toe via PK.SK.draft + PK.skinSet (js/skins.js); alles komt door PK.skValidate. Ontbrekende sleutels blijven weg.
   De basislaag (design op skin-niveau) heet in de editor ap '*'; een verschijning heet bij zijn id.
   ===================================================================== */
const clone=o=>JSON.parse(JSON.stringify(o));
const slug=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
const regOf=r=>r?PK.regList(r):[];
const isPad=x=>x.role==='pad'||x.role==='step';
// ---- sjablonen voor een verschijning ----
const TPL=['standard','compact','wide','phone','touch','custom'], TNAME={standard:'Standard',compact:'Compact',wide:'Wide',phone:'Phone',touch:'Touch',custom:'Custom'};   // namen van verschijningen zijn Engels (bibliotheekregel)
function template(kind,aps,r){ const a={id:kind,name:TNAME[kind],css:'',assets:{}}; let n=2; while(aps.some(x=>x.id===a.id)) a.id=kind+'-'+(n++);
  if(aps.some(x=>x.name===a.name)) a.name=a.name+' '+(n>2?n-1:2);
  if(kind==='compact'){ a.when={maxWidth:480}; a.design={size:{width:380}}; }
  else if(kind==='wide') a.when={minWidth:900};
  else if(kind==='phone') a.when={screens:['phone']};
  else if(kind==='touch'){ a.design={controls:[{match:'*',size:'l'}],haptics:{click:'medium',turn:'light',slide:'light'}}; if(regOf(r).some(isPad)) a.design.pads={size:'l'}; }
  return a; }
function emptyModel(dev,name){ return {dev,name:name||'',author:'',license:'CC0-1.0',description:'',icon:null,version:'1.0.0',dflt:'standard',design:{},aps:[{id:'standard',name:TNAME.standard,css:'',assets:{}}]}; }
function fromSkin(sk,own){ const m={dev:sk.device,name:own?sk.name:PK.pkt('m.se_mijn',sk.name).slice(0,50),author:sk.author||'',license:sk.license||'CC0-1.0',description:sk.description||'',icon:sk.icon||null,version:sk.version||'1.0.0',dflt:sk.default||sk.appearances[0].id,design:sk.design?clone(sk.design):{},aps:clone(sk.appearances)};
  m.aps.forEach(a=>{ if(!a.assets) a.assets={}; if(a.css==null) a.css=''; if(!a.description) delete a.description; }); if(!m.aps.some(a=>a.id===m.dflt)) m.dflt=m.aps[0].id; return m; }
// ---- lagen ----
const layerOf=(m,ap)=>ap==='*'||!ap?m.design:((m.aps.find(a=>a.id===ap)||{}).design);
function layerMake(m,ap){ if(ap==='*'||!ap) return m.design; const a=m.aps.find(x=>x.id===ap); if(!a) return null; return a.design||(a.design={}); }
// verwijder lege objecten en lijsten (niet layout.panels van een verschijning: leeg = de indeling van de skin opheffen)
function prune(o,keepPanels){ Object.keys(o).forEach(k=>{ const v=o[k]; if(Array.isArray(v)){ if(!v.length&&k!=='items'&&!(k==='panels'&&keepPanels)) delete o[k]; else if(k==='panels') v.forEach(p=>prune(p,keepPanels)); } else if(v&&typeof v==='object'){ prune(v,keepPanels); if(!Object.keys(v).length) delete o[k]; } else if(v===undefined) delete o[k]; }); }
function pruneAll(m){ prune(m.design,false); m.aps.forEach(a=>{ if(a.design){ prune(a.design,true); if(!Object.keys(a.design).length) delete a.design; } }); }
// ---- bouwen ----
const hasKey=(m,f)=>[m.design,...m.aps.map(a=>a.design)].some(d=>d&&f(d));
function contractFor(m){ const lay=hasKey(m,d=>d.layout&&d.layout.panels&&d.layout.panels.some(p=>p.items&&p.items.length)), pd=hasKey(m,d=>d.pads||d.display), sec=hasKey(m,d=>(d.sections&&d.sections.length)||d.size), met=hasKey(m,d=>d.meters&&d.meters.length), ctl=hasKey(m,d=>d.controls&&d.controls.length), v8=hasKey(m,d=>(d.controls||[]).some(x=>x.activeColor!==undefined)||(d.pads&&d.pads.rules&&d.pads.rules.length));
  return v8?'0.8':lay?'0.7':pd?'0.6':sec?'0.5':met?'0.4':ctl?'0.3':'0.2'; }
function fin(d){ const c=clone(d); if(c.layout&&c.layout.panels){ const had=c.layout.panels.length; c.layout.panels=c.layout.panels.filter(p=>p.items&&p.items.length); if(!c.layout.panels.length&&had) delete c.layout.panels; if(!Object.keys(c.layout).length) delete c.layout; } return c; }   // een paneel zonder items is nog niet af en gaat niet mee
function build(m,preview){ const name=(m.name||'').trim()||'Untitled', dev=m.dev, id=preview?dev.toLowerCase()+'.draft-preview':dev.toLowerCase()+'.'+(slug(name)||'custom'), t=new Date(), p2=n=>String(n).padStart(2,'0');
  const j={format:'patchkamer-skin',formatVersion:1,skinsContract:contractFor(m),id,device:dev,name:name.slice(0,60),version:m.version||'1.0.0'};
  if((m.author||'').trim()) j.author=m.author.trim().slice(0,60); j.license=m.license||'CC0-1.0'; if((m.description||'').trim()) j.description=m.description.trim().slice(0,300); j.created=`${t.getFullYear()}-${p2(t.getMonth()+1)}-${p2(t.getDate())}`; j.icon=m.icon||null;
  if(m.dflt) j.default=m.dflt; { const dd=fin(m.design); if(Object.keys(dd).length) j.design=dd; }
  j.appearances=m.aps.map(a=>{ const o={id:a.id,name:a.name}; if(a.description) o.description=a.description; if(a.when&&Object.keys(a.when).length) o.when=clone(a.when); o.css=a.css||''; if(a.assets&&Object.keys(a.assets).length) o.assets=clone(a.assets); if(a.design){ const dd=fin(a.design); if(Object.keys(dd).length) o.design=dd; } return o; });
  return j; }
// ---- valideren: skValidate + controles tegen het register van het apparaat ----
function devChecks(sk,r){ const L=regOf(r), out=[], pkt=PK.pkt; const ids=new Set(L.map(x=>x.id)), roles=new Set(L.map(x=>x.role)), groups=new Set(L.map(x=>x.group).filter(Boolean));
  const ok=m=>m==='*'||(m.startsWith('role:')?roles.has(m.slice(5)):m.startsWith('group:')?groups.has(m.slice(6)):ids.has(m)), bad=(w,m)=>out.push(pkt(m.startsWith('role:')?'m.se_dev_rol':m.startsWith('group:')?'m.se_dev_groep':'m.se_dev_id',w,m.replace(/^(role|group):/,'')));
  const lay=[['design',sk.design],...sk.appearances.map((a,i)=>['appearances['+i+'].design',a.design])]; let any=false;
  lay.forEach(([w,d])=>{ if(!d) return; (d.controls||[]).forEach((x,i)=>{ any=true; if(!ok(x.match)) bad(w+'.controls['+i+'].match',x.match); }); (d.meters||[]).forEach((x,i)=>{ any=true; if(!ok(x.match)) bad(w+'.meters['+i+'].match',x.match); });
    (d.sections||[]).forEach((x,i)=>{ any=true; if(!ok(x.match)) bad(w+'.sections['+i+'].match',x.match); }); if(d.pads&&d.pads.colors) Object.keys(d.pads.colors).forEach(k=>{ any=true; if(!ok(k)) bad(w+'.pads.colors',k); }); if(d.pads&&d.pads.rules) d.pads.rules.forEach((x,i)=>{ any=true; if(!ok(x.match)) bad(w+'.pads.rules['+i+'].match',x.match); });
    if(d.layout&&d.layout.panels) d.layout.panels.forEach((p,i)=>p.items.forEach((it,j)=>{ any=true; if(it!=='*'&&!ok(it)) bad(w+'.layout.panels['+i+'].items['+j+']',it); })); });
  if(any&&!L.length) out.unshift(pkt('m.se_dev_leeg')); return out; }
function check(m,r){ const file=build(m,false), notes=[], errs=[]; let sk=null; try{ sk=PK.skValidate(file,'',notes,errs); }catch(e){ errs.push(e.message); }
  const strip=s=>String(s).replace(/^:\s*/,''); const dc=sk?devChecks(sk,r):[], en=errs.map(strip); if(!(m.name||'').trim()) en.unshift(PK.pkt('m.se_naam_leeg')); const nt=[...notes.map(strip)]; if(!(m.author||'').trim()) nt.push(PK.pkt('m.se_let_auteur')); if(!(m.description||'').trim()) nt.push(PK.pkt('m.se_let_beschrijving')); return {file,sk,errs:en,notes:[...nt,...dc]}; }
// ---- indeling: welke regelaar zit in welk paneel (zelfde regels als js/panels.js: expliciete items eerst, de eerste passende wint; '*' krijgt de rest) ----
const itemHit=(it,u)=>it==='*'?false:it.startsWith('role:')?u.role===it.slice(5):it.startsWith('group:')?u.group===it.slice(6):(!!u.id&&u.id===it);
function assign(panels,regs){ const A=new Map(), taken=new Set(); let star=null;
  panels.forEach((P,pi)=>P.items.forEach((it,ii)=>{ if(it==='*'){ if(!star) star=[pi,ii]; return; } regs.forEach(u=>{ if(!taken.has(u)&&itemHit(it,u)){ taken.add(u); A.set(u.id,{pi,ii}); } }); }));
  regs.forEach(u=>{ if(!taken.has(u)) A.set(u.id,star?{pi:star[0],ii:star[1],star:true}:null); }); return A; }
// de effectieve indeling van een laag: een verschijning met eigen layout.panels wint van de skin
function layoutOf(m,ap){ const l=layerOf(m,ap); if(ap!=='*'&&!(l&&l.layout&&l.layout.panels)) return {panels:(m.design.layout&&m.design.layout.panels)||[],own:false,flow:(m.design.layout||{}).flow}; return {panels:(l&&l.layout&&l.layout.panels)||[],own:true,flow:(l&&l.layout||{}).flow}; }
function ensureLayout(m,ap){ const d=layerMake(m,ap); if(!d.layout){ const b=ap==='*'?null:m.design.layout; d.layout=b?clone(b):{panels:[]}; } if(!d.layout.panels) d.layout.panels=(ap!=='*'&&m.design.layout&&m.design.layout.panels)?clone(m.design.layout.panels):[]; return d.layout; }
const uniqPid=(panels,base)=>{ const ids=new Set(panels.map(p=>p.id)); let id=base,n=2; while(ids.has(id)) id=base+'-'+(n++); return id; };
// verplaats een regelaar naar paneel pi (voor regelaar beforeId, of achteraan); pi=null haalt hem uit elk paneel (terug naar het restpaneel). Geeft null bij een mislukking (64 items); de aanroeper herstelt dan het model.
function moveCtl(m,ap,regs,id,pi,beforeId){ const lay=ensureLayout(m,ap), P=lay.panels; P.forEach(p=>{ p.items=p.items.filter(it=>it!==id); }); if(pi!=null&&!P[pi]) return null;
  const tpos=()=>{ if(pi==null) return [1e9,0]; let at=P[pi].items.length; if(beforeId){ const q=assign(P,regs).get(beforeId); if(q&&q.pi===pi&&!q.star) at=q.ii; } return [pi,at]; };
  for(let g=0;g<40;g++){ const A=assign(P,regs), cur=A.get(id), T=tpos(); if(!cur||cur.star) break;   // een groep- of rolitem dat de regelaar vóór de doelplek zou pakken, wordt uitgeschreven in losse id's
    const it=P[cur.pi].items[cur.ii]; if(!(cur.pi<T[0]||(cur.pi===T[0]&&cur.ii<T[1]))) break;
    const rest=regs.filter(u=>{ const q=A.get(u.id); return u.id!==id&&q&&q.pi===cur.pi&&q.ii===cur.ii&&itemHit(it,u); }).map(u=>u.id); P[cur.pi].items.splice(cur.ii,1,...rest); }
  if(pi!=null) P[pi].items.splice(tpos()[1],0,id);
  return P.some(p=>p.items.length>64)?null:{}; }
function newPanel(m,ap,id,titleHint){ const lay=ensureLayout(m,ap), P=lay.panels; if(P.length>=16) return null; const pid=uniqPid(P,'panel'); P.push({id:pid,items:id?[id]:[],style:'line'}); return pid; }
function genLayout(m,ap,regs){ const lay=ensureLayout(m,ap), P=lay.panels, gs=[...new Set(regs.map(x=>x.group).filter(Boolean))].slice(0,15); if(!gs.length) return 0;
  gs.forEach(g=>{ const pid=uniqPid(P,slug(g)||'panel'); P.push({id:pid,title:{nl:g,en:g},items:['group:'+g],style:'line'}); });
  if(regs.some(x=>!x.group)&&P.length<16) P.push({id:uniqPid(P,'rest'),title:{nl:PK.I18N.nl['m.pn_overige']||'Overige',en:PK.I18N.en['m.pn_overige']||'Other'},items:['*'],style:'plain'}); return gs.length; }
// ---- concept (localStorage, per skin-id; elke toegang in try/catch) ----
const CK='patchkamer.sked.draft.';
const concept={ key:(dev,srcId)=>CK+(srcId||('new.'+dev)),
  save(key,m){ try{ localStorage.setItem(key,JSON.stringify({t:Date.now(),m})); }catch(e){} },
  load(key){ try{ const v=JSON.parse(localStorage.getItem(key)||'null'); return v&&v.m&&v.m.dev&&Array.isArray(v.m.aps)&&v.m.aps.length?v:null; }catch(e){ return null; } },
  clear(key){ try{ localStorage.removeItem(key); }catch(e){} } };
PK.skm={clone,slug,regOf,isPad,TPL,template,emptyModel,fromSkin,layerOf,layerMake,prune,pruneAll,build,check,assign,layoutOf,ensureLayout,moveCtl,newPanel,genLayout,concept,uniqPid};
})(window.__PK);
