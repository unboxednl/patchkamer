// js/skins.js — skins: bestand controleren, register en opslag, toepassen op een kaart, automatisch kiezen, meebewaren in werkruimte en song
(function(PK){
/* =====================================================================
   SKINS · een skin verandert alleen het uiterlijk van één apparaat (CSS in de open shadow root + afbeeldingen als --skin-asset-*), nooit state, geluid of gedrag.
   Bestand: *.patchkamer-skin.json (skins/contract/SKINS-CONTRACT_NL.md). Register: PK.SK = {user, src, emb}; elk item {skin, file, origin, src?}.
   user = geïmporteerd (IndexedDB 'skins:user'), src = uit een bron (alleen-lezen, per scan opnieuw), emb = ingesloten in een werkruimte of song (alleen geheugen).
   Per id wint de hoogste version; bij gelijke version user > src > emb. Kaart: r.skin = {id, appearance:'auto'|verschijning-id}; opslaan als devices[].skin en skins[].
   ===================================================================== */
const SK_FMT='patchkamer-skin', SK_MAJOR=0, SK_FILEMAX=2*1024*1024, SK_ICONMAX=200*1024, SK_CSSMAX=200*1024, SK_ASSETSTOT=1024*1024, SK_EMBEDMAX=20; PK.SK_FILEMAX=SK_FILEMAX;
const SK_IMG_RE=/^data:image\/(?:(?:png|webp|jpeg);base64,[A-Za-z0-9+\/=]+|svg\+xml(?:;charset=[A-Za-z0-9-]+)?(?:;base64,[A-Za-z0-9+\/=]+|,[^\s"\\<>]*))$/i;   // zoals het contract: svg+xml (base64 of procent-gecodeerd), png, webp, jpeg (base64); geen gif
const skNums=v=>String(v).split(/[-+]/)[0].split('.').map(Number);
function skCmp(a,b){ const x=skNums(a), y=skNums(b); for(let i=0;i<3;i++){ const d=(x[i]||0)-(y[i]||0); if(d) return d; } return (/-/.test(String(b))?1:0)-(/-/.test(String(a))?1:0); } PK.skCmp=skCmp;
// CSS-controle: geen @import, url( alleen naar data: of var(--skin-asset-…), geen image-set/src/cross-fade met een tekenreeks (laden ook van buiten). Dit is een controle, geen sandbox.
function skCssCheck(css,where){
  const dec=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\\([0-9a-fA-F]{1,6})\s?/g,(m,h)=>{ try{ return String.fromCodePoint(parseInt(h,16)); }catch(e){ return ''; } }).replace(/\\([\s\S])/g,'$1').replace(/\/\*[\s\S]*?\*\//g,'');
  if(/<\/style|javascript:|expression\s*\(|-moz-binding|behavior\s*:/i.test(dec)||/<\/style/i.test(css)) throw new Error(PK.pkt('m.sk_e_css',where,'</style, javascript:, expression('));
  if(/@import/i.test(dec)) throw new Error(PK.pkt('m.sk_e_css',where,'@import'));
  const re=/url\(\s*(["']?)\s*([^"')]*)/gi; let m; while((m=re.exec(dec))){ const u=m[2].trim(); if(!/^data:/i.test(u)&&!/^var\(\s*--skin-asset-/i.test(u)) throw new Error(PK.pkt('m.sk_e_css',where,'url('+u.slice(0,40)+')')); }
  const f=/(^|[^a-z0-9_])(image-set|cross-fade|image|src|element)\s*\(/i.exec(dec); if(f) throw new Error(PK.pkt('m.sk_e_css',where,f[2]+'(')); }
// één skin controleren en opschonen. De host eist alleen wat nodig is om te laden (format, formatVersion, skinsContract-major, id, device, name, verschijningsvormen met geldige id);
// al het andere wat ontbreekt of ongeldig is valt terug op een standaard (let op in notes). Een verschijningsvorm met verboden CSS wordt geweigerd, de rest van de skin laadt. Onbekende velden worden genegeerd.
function skValidate(j,file,notes,errs){ const F=file||'?', note=(k,...a)=>{ if(notes) notes.push(F+': '+PK.pkt(k,...a)); }, bad=(k,...a)=>{ throw new Error(F+': '+PK.pkt(k,...a)); }, fld=p=>bad('m.sk_e_veld',p);
  if(!j||typeof j!=='object'||Array.isArray(j)) bad('m.sk_e_object'); if(j.format!==SK_FMT) bad('m.sk_e_format');
  if(!Number.isInteger(j.formatVersion)||j.formatVersion<1) fld('formatVersion');
  const sc=typeof j.skinsContract==='string'&&/^(\d+)\.(\d+)$/.exec(j.skinsContract); if(!sc) fld('skinsContract'); if(+sc[1]!==SK_MAJOR) bad('m.sk_e_contract',j.skinsContract);
  const str=(v,p,mn,mx)=>{ if(typeof v!=='string'||v.length<mn||v.length>mx) fld(p); return v; }, soft=(v,p,mx)=>{ if(v==null) return ''; if(typeof v!=='string'||v.length>mx){ note('m.sk_e_veld',p); return ''; } return v; };
  const id=str(j.id,'id',3,100); if(!/^[a-z0-9.-]+$/.test(id)) fld('id');
  const device=str(j.device,'device',1,200); if(!/^[A-Za-z0-9._-]+$/.test(device)) fld('device');
  const name=str(j.name,'name',1,60); let version=j.version; if(typeof version!=='string'||!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(version)){ note('m.sk_e_veld','version'); version='0.0.0'; }
  const author=soft(j.author,'author',100), license=soft(j.license,'license',64), description=soft(j.description,'description',300); let created=soft(j.created,'created',10);
  if(created&&(!/^\d{4}-\d{2}-\d{2}$/.test(created)||isNaN(Date.parse(created)))){ note('m.sk_e_veld','created'); created=''; }
  let icon=null; if(j.icon!=null){ if(typeof j.icon==='string'&&j.icon.length<=SK_ICONMAX&&SK_IMG_RE.test(j.icon)) icon=j.icon; else note('m.sk_e_veld','icon'); }
  if(!Array.isArray(j.appearances)||!j.appearances.length) fld('appearances');
  const ids=new Set(), appearances=[];
  j.appearances.slice(0,12).forEach((a,i)=>{ const P='appearances['+i+'].'; try{
    if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(a.id)||ids.has(a.id)) fld(P+'id');
    const o={id:a.id,name:(typeof a.name==='string'&&a.name&&a.name.length<=40)?a.name:a.id,description:soft(a.description,P+'description',300)};
    if(a.when!=null&&typeof a.when==='object'&&!Array.isArray(a.when)){ const w=a.when, when={}, okw=v=>Number.isInteger(v)&&v>=0&&v<=10000;
      for(const k of ['minWidth','maxWidth']) if(w[k]!=null){ if(okw(w[k])) when[k]=w[k]; else note('m.sk_e_veld',P+'when.'+k); }
      if(w.screens!=null){ if(Array.isArray(w.screens)&&w.screens.length&&w.screens.every(x=>['phone','compact','wide'].includes(x))) when.screens=[...new Set(w.screens)]; else note('m.sk_e_veld',P+'when.screens'); }
      if(when.minWidth!=null&&when.maxWidth!=null&&when.minWidth>when.maxWidth) note('m.sk_e_veld',P+'when'); else if(Object.keys(when).length) o.when=when; }
    else if(a.when!=null) note('m.sk_e_veld',P+'when');
    const css=a.css==null?'':a.css; if(typeof css!=='string'||css.length>SK_CSSMAX||new TextEncoder().encode(css).length>SK_CSSMAX) fld(P+'css'); skCssCheck(css,F+': '+P+'css'); o.css=css;
    const as={}; if(a.assets!=null&&typeof a.assets==='object'&&!Array.isArray(a.assets)){ let tot=0;
      Object.keys(a.assets).slice(0,40).forEach(k=>{ const v=a.assets[k]; if(!/^[a-z0-9-]{1,40}$/.test(k)||typeof v!=='string'||v.length>SK_ICONMAX||!SK_IMG_RE.test(v)||tot+v.length>SK_ASSETSTOT){ note('m.sk_e_veld',P+'assets.'+k); return; } tot+=v.length; as[k]=v; }); } o.assets=as;
    ids.add(o.id); appearances.push(o); }catch(e){ if(errs||notes) (errs||notes).push(e.message); else throw e; } });   // verboden CSS of een ongeldige id: alleen deze verschijningsvorm weigeren

  if(!appearances.length) fld('appearances');
  let dflt=null; if(j.default!=null){ if(typeof j.default==='string'&&ids.has(j.default)) dflt=j.default; else note('m.sk_e_veld','default'); }
  return {format:SK_FMT,formatVersion:j.formatVersion,skinsContract:j.skinsContract,id,device,name,version,author,license,description,created,icon,default:dflt,appearances}; } PK.skValidate=skValidate;
function skParse(text,file,notes,errs){ if(typeof text!=='string'||new Blob([text]).size>SK_FILEMAX) throw new Error(file+': '+PK.pkt('m.sk_e_groot','2 MB')); let j; try{ j=JSON.parse(text); }catch(e){ throw new Error(file+': '+PK.pkt('m.sk_e_json')); } return skValidate(j,file,notes||[],errs); } PK.skParse=skParse;

// ---- register ----
function skinAll(){ const best=new Map(); for(const o of ['user','src','emb']) for(const e of PK.SK[o]){ const c=best.get(e.skin.id); if(!c||skCmp(e.skin.version,c.skin.version)>0) best.set(e.skin.id,e); } return [...best.values()]; } PK.skinAll=skinAll;
const skinsFor=dev=>skinAll().filter(e=>e.skin.device===dev).sort((a,b)=>a.skin.name.localeCompare(b.skin.name)); PK.skinsFor=skinsFor;
const skinFind=id=>skinAll().find(e=>e.skin.id===id)||null; PK.skinFind=skinFind;
function skAdd(origin,skin,file,extra){ const L=PK.SK[origin], i=L.findIndex(e=>e.skin.id===skin.id); if(i>=0){ if(skCmp(L[i].skin.version,skin.version)>0) return false; L.splice(i,1); } L.push({skin,file:file||'',origin,...extra}); return true; }
let skPT=0; function skPersist(){ clearTimeout(skPT); skPT=setTimeout(()=>PK.IDB.set('skins:user',PK.SK.user.map(e=>({file:e.file,skin:e.skin}))),0); } PK.skPersist=skPersist;
function skinsChanged(){ PK.Host.devices.forEach(r=>{ if(r.skin) skSync(r); }); if(PK.skUiRefresh) PK.skUiRefresh(); PK.paintIcons(); } PK.skinsChanged=skinsChanged;
async function skinsLoadUser(){ const v=await PK.IDB.get('skins:user'); if(!Array.isArray(v)) return;
  v.forEach(x=>{ try{ skAdd('user',skValidate(x&&x.skin,(x&&x.file)||'?'),x.file); }catch(e){ console.warn('skin',e.message); } }); skinsChanged(); } PK.skinsLoadUser=skinsLoadUser;
// importeren: bestandskiezer van het Skins-paneel en bestanden die op het canvas worden losgelaten; quiet: geen melding, alleen {n,errs}
async function skinsImport(files,quiet){ let n=0; const errs=[];
  for(const f of files){ try{ const notes=[], sk=skParse(await f.text(),f.name,notes,errs); if(skAdd('user',sk,f.name,{notes})) n++; else errs.push(f.name+': '+PK.pkt('m.sk_nieuwer_aanwezig')); }catch(e){ errs.push(e.message); } }
  if(n) skPersist(); skinsChanged(); if(!quiet) PK.status(n?PK.pktp('m.sk_geladen',n===1,n)+(errs.length?' · '+errs.join(' · '):''):errs.join(' · '),!n); return {n,errs}; } PK.skinsImport=skinsImport;
// uit een bron: list = [{path,size?,load}], icons = [{dev,ext,get}] (uit skins/library/<apparaat-id>/icon.*); geeft het aantal geladen skins
async function skinsFromSource(src,list,icons,errs){
  PK.SK.src=PK.SK.src.filter(e=>e.src.sid!==src.sid); let n=0;
  for(const w of list){ try{ if(w.size&&w.size>SK_FILEMAX) throw new Error(w.path+': '+PK.pkt('m.sk_e_groot','2 MB')); const notes=[], sk=skParse(await w.load(),w.path,notes,errs); if(skAdd('src',sk,w.path,{notes,src:{sid:src.sid,label:src.label,path:w.path}})) n++; }catch(e){ errs.push(e.message); } }
  for(const k of [...PK.SKICON.keys()]) if(k.startsWith(src.sid+'|')) PK.SKICON.delete(k);
  const by=new Map(); (icons||[]).forEach(x=>{ if(!by.has(x.dev)) by.set(x.dev,[]); by.get(x.dev).push(x); });
  for(const [dev,xs] of by) for(const ext of Object.keys(PK.ICONTYPES)){ const x=xs.find(y=>y.ext===ext); if(!x) continue; let u=null; try{ const b=await x.get(); u=b?await PK.iconToDataUrl(b,ext):null; }catch(e){} if(u){ PK.SKICON.set(src.sid+'|'+dev,u); break; } }
  skinsChanged(); return n; } PK.skinsFromSource=skinsFromSource;
// ingesloten skins van een werkruimte of song: stil opnemen (geen melding), nieuwere versie wint
function skinsEmbed(){ const out=[], seen=new Set(); PK.Host.devices.forEach(r=>{ if(!r.skin||seen.has(r.skin.id)||out.length>=SK_EMBEDMAX) return; const e=skinFind(r.skin.id); if(!e) return; seen.add(r.skin.id); if(JSON.stringify(e.skin).length<=SK_FILEMAX) out.push(e.skin); }); return out.length?{skins:out}:{}; } PK.skinsEmbed=skinsEmbed;
function skinsFromWorkspace(list){ if(!Array.isArray(list)) return; let n=0;
  for(const x of list.slice(0,SK_EMBEDMAX)){ try{ if(JSON.stringify(x).length>SK_FILEMAX) continue; if(skAdd('emb',skValidate(x,'skins[]'),'',{})) n++; }catch(e){ console.warn('skin',e.message); } }
  if(n) skinsChanged(); } PK.skinsFromWorkspace=skinsFromWorkspace;

// ---- toepassen op een kaart: <style data-pk-skin> in de open shadow root(s) van het apparaat, assets als --skin-asset-* op het hostelement ----
function skHosts(r){ const ui=r.el.querySelector(':scope > .body > .ui'), out=[]; if(!ui) return out; if(ui.shadowRoot) out.push(ui); ui.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot) out.push(e); }); return out; }
function skStrip(r){ (r.skMO||[]).forEach(m=>m.disconnect()); r.skMO=[]; (r.skHosts||[]).forEach(h=>{ if(h.shadowRoot) h.shadowRoot.querySelectorAll('style[data-pk-skin]').forEach(s=>s.remove()); (r.skProps||[]).forEach(p=>h.style.removeProperty('--skin-asset-'+p)); if(h.hasAttribute('style')&&!h.getAttribute('style').trim()) h.removeAttribute('style'); }); r.skHosts=[]; r.skProps=[]; }
function skClear(r){ skStrip(r); r.skCur=null; r.skSkin=null; r.el.removeAttribute('data-pk-skin'); r.el.removeAttribute('data-pk-ap'); }
function skScreen(){ const w=window.innerWidth; return w<700?'phone':w<1100?'compact':'wide'; } PK.skScreen=skScreen;
// automatisch: de eerste verschijningsvorm waarvan alle voorwaarden kloppen; anders `default`; anders de eerste. Invoer = kaartbreedte in vloercoördinaten (zonder zoom) en schermklasse; beide hangen niet af van wat de skin tekent.
function skAuto(sk,w,cls){ const hit=sk.appearances.find(a=>a.when&&(a.when.minWidth==null||w>=a.when.minWidth)&&(a.when.maxWidth==null||w<=a.when.maxWidth)&&(!a.when.screens||a.when.screens.includes(cls)));
  return hit||sk.appearances.find(a=>a.id===sk.default)||sk.appearances[0]; } PK.skAuto=skAuto;
function skActive(r){ if(!r||!r.skin||!r.skSkin) return null; return r.skSkin; } PK.skinActive=skActive;
// de verschijningsvorm die nu hoort bij r.skin; null = laten zoals het is
function skTarget(r,sk){ const st=r.skin; let ap=st.appearance==='auto'?null:sk.appearances.find(a=>a.id===st.appearance);
  if(ap) return ap; const w=r.el.offsetWidth; if((r.mini||!w)&&r.skCur) return sk.appearances.find(a=>a.id===r.skCur)||null; return skAuto(sk,w,skScreen()); }
function skSync(r,force){ const st=r.skin; if(!st){ if(r.skCur||(r.skHosts&&r.skHosts.length)) skClear(r); return; }
  const e=skinFind(st.id); if(!e||e.skin.device!==r.def.id){ if(r.skCur||(r.skHosts&&r.skHosts.length)){ skClear(r); PK.paintIcons(); } return; }
  const sk=e.skin, ap=skTarget(r,sk); if(!ap) return;
  const ok=r.skCur===ap.id&&r.skSkin===sk&&r.skHosts&&r.skHosts.length&&r.skHosts.every(h=>{ const st=h.isConnected&&h.shadowRoot&&h.shadowRoot.querySelector('style[data-pk-skin]'); return st&&h.shadowRoot.lastChild===st; });   // het skinblok staat als laatste in de shadow root, dus na de eigen stijlen van het apparaat
  if(ok&&!force) return;
  const now=performance.now(), flip=r.skCur&&r.skCur!==ap.id&&st.appearance==='auto';   // vangnet tegen heen-en-weer: ≥6 wissels binnen 1 s in Auto = even niet meer wisselen
  if(flip){ r.skHist=(r.skHist||[]).filter(t=>now-t<1000); if(r.skFreeze&&now<r.skFreeze) return; if(r.skHist.length>=6){ r.skFreeze=now+3000; setTimeout(()=>skSync(r),3100); return; } r.skHist.push(now); }
  const hs=skHosts(r); if(!hs.length){ if(!r.skWarn){ r.skWarn=true; PK.status(PK.pkt('m.sk_geen_shadow',r.def.name),true); } return; }
  const newSkin=r.skSkin!==sk; skStrip(r);
  hs.forEach(h=>{ const s=document.createElement('style'); s.setAttribute('data-pk-skin',''); s.textContent=ap.css; h.shadowRoot.appendChild(s); Object.keys(ap.assets).forEach(k=>h.style.setProperty('--skin-asset-'+k,'url("'+ap.assets[k]+'")')); });
  r.skMO=hs.map(h=>{ let q=false; const mo=new MutationObserver(()=>{ const sr=h.shadowRoot, st=sr&&sr.querySelector('style[data-pk-skin]'); if(st){ if(sr.lastChild!==st) sr.appendChild(st); } else if(!q){ q=true; Promise.resolve().then(()=>{ q=false; if(r.skHosts&&r.skHosts.includes(h)) skSync(r,true); }); } }); mo.observe(h.shadowRoot,{childList:true}); return mo; });
  r.skHosts=hs; r.skProps=Object.keys(ap.assets); r.skCur=ap.id; r.skSkin=sk; r.el.setAttribute('data-pk-skin',sk.id); r.el.setAttribute('data-pk-ap',ap.id);
  if(newSkin) PK.paintIcons(); if(PK.skPaintPick) PK.skPaintPick(r); PK.drawCables(); }
let skRO=null, skROT=0; const skWatched=new Set();
function skWatch(r){ if(!skRO) skRO=new ResizeObserver(()=>{ clearTimeout(skROT); skROT=setTimeout(skEvalAll,120); }); if(!skWatched.has(r)){ skWatched.add(r); skRO.observe(r.el); } }
function skUnwatch(r){ if(skWatched.delete(r)&&skRO) skRO.unobserve(r.el); }
let skCls=''; function skEvalAll(){ skCls=skScreen(); skWatched.forEach(r=>{ if(!r.el.isConnected||!r.skin){ skUnwatch(r); return; } skSync(r); }); } PK.skEvalAll=skEvalAll;
function skScreenCheck(){ if(skScreen()!==skCls) skEvalAll(); } PK.skScreenCheck=skScreenCheck;
// keuze van de gebruiker: skinId '' = Standaard (eigen uiterlijk); appearance 'auto' of een verschijning-id
function skinSet(id,skinId,appearance){ const r=PK.Host.devices.get(id); if(!r) return;
  if(!skinId){ r.skin=null; skUnwatch(r); skClear(r); } else { r.skin={id:skinId,appearance:appearance||'auto'}; r.skWarn=false; skWatch(r); skSync(r,true); }
  if(PK.skPaintPick) PK.skPaintPick(r); PK.paintIcons(); PK.drawCables(); } PK.skinSet=skinSet;
// uit een bewaarde werkruimte of song: {id, appearance}; een skin die (nog) niet bestaat blijft staan en wordt bij het opslaan weer meegenomen
function skinRestore(id,st){ const r=PK.Host.devices.get(id); if(!r||!st||typeof st.id!=='string'||st.id.length>100) return;
  r.skin={id:st.id,appearance:typeof st.appearance==='string'&&/^(auto|[a-z0-9-]{1,40})$/.test(st.appearance)?st.appearance:'auto'}; skWatch(r); skSync(r,true); if(PK.skPaintPick) PK.skPaintPick(r); PK.paintIcons(); } PK.skinRestore=skinRestore;
const skinState=r=>r.skin?{id:r.skin.id,appearance:r.skin.appearance}:undefined; PK.skinState=skinState;
})(window.__PK);
