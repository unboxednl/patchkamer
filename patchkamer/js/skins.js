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
// ---- design (skins 0.2, laag 1): soepel controleren, samenvoegen, kleuren afleiden ----
const SK_HEX=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, SK_COLOUR_KEYS=['bg','surface','text','muted','accent','line'], SK_LVL=['off','light','medium','strong'];
const SK_ENUM={ports:{mode:['default','always','hover','strip']},colors:{scheme:['workspace','custom']},haptics:{click:SK_LVL,turn:SK_LVL,slide:SK_LVL},knobs:{style:['workspace','rotary','slider'],size:['s','m','l']}};
PK.SK_ENUM=SK_ENUM; PK.SK_COLOUR_KEYS=SK_COLOUR_KEYS;
function skHex(v){ if(typeof v!=='string'||!SK_HEX.test(v)) return null; let h=v.slice(1).toLowerCase(); if(h.length===3) h=h.split('').map(c=>c+c).join(''); return '#'+h; } PK.skHex=skHex;
// design.controls (skins 0.3): lijst regels {match, face?, size?, length?, thickness?, thumb?, color?, showValue?}. Een ongeldige eigenschap valt weg met een let-op (face:'none' bestaat niet: een skin verbergt nooit een regelaar); een regel zonder geldige eigenschap of met een ongeldige match valt weg.
const SK_CTL_FACE=['rotary','hslider','vslider','default'], SK_CTL_SIZE=['xs','s','m','l','xl'], SK_CTL_LEN=['short','medium','long'], SK_CTL_THUMB=['round','square','bar','none'], SK_CTL_SHOW=['always','hover','never'], SK_CTL_MAX=64;
const SK_CTL_MATCH=/^(\*|role:[a-z]{1,16}|group:[A-Za-z0-9._-]{1,60}|[A-Za-z0-9._-]{1,60})$/;
PK.SK_CTL_ENUM={face:SK_CTL_FACE,size:SK_CTL_SIZE,length:SK_CTL_LEN,thumb:SK_CTL_THUMB,showValue:SK_CTL_SHOW};
function skControlsClean(list,where,note){ const out=[]; if(!Array.isArray(list)){ note('m.sk_e_veld',where); return out; }
  list.slice(0,SK_CTL_MAX).forEach((x,i)=>{ const P=where+'['+i+']';
    if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.match!=='string'||!SK_CTL_MATCH.test(x.match)){ note('m.sk_e_veld',P+'.match'); return; }
    if(x.match.startsWith('role:')&&!PK.REG_ROLES.includes(x.match.slice(5))){ note('m.sk_e_veld',P+'.match'); return; }
    const o={match:x.match}, num=(v,a,b)=>typeof v==='number'&&isFinite(v)&&v>=a&&v<=b;
    if(x.face!=null){ if(SK_CTL_FACE.includes(x.face)) o.face=x.face; else note('m.sk_e_veld',P+'.face'); }
    if(x.size!=null){ if(SK_CTL_SIZE.includes(x.size)||num(x.size,0.6,2)) o.size=x.size; else note('m.sk_e_veld',P+'.size'); }
    if(x.length!=null){ if(SK_CTL_LEN.includes(x.length)||num(x.length,40,400)) o.length=x.length; else note('m.sk_e_veld',P+'.length'); }
    if(x.thickness!=null){ if(num(x.thickness,2,24)) o.thickness=x.thickness; else note('m.sk_e_veld',P+'.thickness'); }
    if(x.thumb!=null){ if(SK_CTL_THUMB.includes(x.thumb)) o.thumb=x.thumb; else note('m.sk_e_veld',P+'.thumb'); }
    if(x.color!=null){ if(x.color==='accent') o.color='accent'; else { const h=skHex(x.color); if(h) o.color=h; else note('m.sk_e_veld',P+'.color'); } }
    if(x.showValue!=null){ if(SK_CTL_SHOW.includes(x.showValue)) o.showValue=x.showValue; else note('m.sk_e_veld',P+'.showValue'); }
    if(Object.keys(o).length>1) out.push(o); });
  if(list.length>SK_CTL_MAX) note('m.sk_e_veld',where); return out; }
// onbekende groepen en sleutels worden stil genegeerd (uitbreidbaar); een bekende sleutel met een ongeldige waarde geeft een let-op en valt weg
function skDesignClean(d,where,note){ if(d==null) return null; if(typeof d!=='object'||Array.isArray(d)){ note('m.sk_e_veld',where); return null; }
  const out={};
  for(const g of Object.keys(SK_ENUM)){ const s=d[g]; if(s==null) continue; if(typeof s!=='object'||Array.isArray(s)){ note('m.sk_e_veld',where+'.'+g); continue; }
    const o={}; for(const k of Object.keys(SK_ENUM[g])){ if(s[k]==null) continue; if(SK_ENUM[g][k].includes(s[k])) o[k]=s[k]; else note('m.sk_e_veld',where+'.'+g+'.'+k); }
    if(g==='colors'&&s.custom!=null){ if(typeof s.custom==='object'&&!Array.isArray(s.custom)){ const c={}; for(const k of SK_COLOUR_KEYS){ if(s.custom[k]==null) continue; const h=skHex(s.custom[k]); if(h) c[k]=h; else note('m.sk_e_veld',where+'.colors.custom.'+k); } if(Object.keys(c).length) o.custom=c; } else note('m.sk_e_veld',where+'.colors.custom'); }
    if(Object.keys(o).length) out[g]=o; }
  if(d.controls!=null){ const c=skControlsClean(d.controls,where+'.controls',note); if(c.length) out.controls=c; }
  return Object.keys(out).length?out:null; }
// skin-niveau en verschijning-niveau samenvoegen: per sleutel wint de verschijning
function skDesignMerge(a,b){ const o={}; for(const g of Object.keys(SK_ENUM)){ const x=a&&a[g], y=b&&b[g]; if(!x&&!y) continue; o[g]={...x,...y}; if(g==='colors'&&((x&&x.custom)||(y&&y.custom))) o[g].custom={...(x&&x.custom),...(y&&y.custom)}; }
  const cx=(a&&a.controls)||[], cy=(b&&b.controls)||[]; if(cx.length||cy.length) o.controls=[...cx,...cy];   // regels: eerst die van de skin, daarna die van de verschijning (de laatste passende regel wint)
  return o; } PK.skDesignMerge=skDesignMerge;
const skEff=(sk,ap)=>skDesignMerge(sk&&sk.design,ap&&ap.design); PK.skEff=skEff;
// let-op's bij een samengevoegd ontwerp: eigen kleuren die ontbreken (vallen terug op de werkruimte) en te weinig contrast tussen tekst en achtergrond
function skDesignNotes(d,where,note){ const c=d&&d.colors; if(!c||c.scheme!=='custom') return; const cu=c.custom||{}, miss=SK_COLOUR_KEYS.filter(k=>!cu[k]);
  if(miss.length) note('m.sk_n_kleur_ontbreekt',where,miss.join(', '));
  if(cu.text&&cu.bg){ const q=PK.cpContrast(cu.text,cu.bg); if(q<3) note('m.sk_n_contrast',where,q.toFixed(1)); } } PK.skDesignNotes=skDesignNotes;
// kleuren afleiden: welke skinkleur welke CSS-variabele zet (tabel in AGENTS.md); card = op de kaart (titelbalk, poortenbalk, pbar), ui = op het hostelement van het apparaat (erft door tot in de shadow root)
const skMix=(a,b,t)=>{ const x=PK.cpRgb(a), y=PK.cpRgb(b); return PK.cpHex([0,1,2].map(i=>x[i]+(y[i]-x[i])*t)); };
function skColourVars(c){ const card={}, ui={}, both=(p,v)=>{ card[p]=v; ui[p]=v; };
  if(c.bg){ both('--card',c.bg); ['--floor','--bg','--panel'].forEach(p=>{ ui[p]=c.bg; }); const dark=PK.cpLum(c.bg)<0.4; both('color-scheme',dark?'dark':'light'); both('--well',skMix(c.bg,'#000000',dark?0.55:0.06)); if(!c.text) both('--well-fg',dark?'#b9c3d0':'#26303c'); }
  if(c.surface){ ['--card-2','--bar','--field'].forEach(p=>both(p,c.surface)); ui['--panel-2']=c.surface; both('--step-q',skMix(c.surface,c.text||(PK.cpLum(c.surface)<0.4?'#ffffff':'#000000'),0.12)); }
  if(c.text){ ['--fg','--bar-fg','--field-fg','--well-fg'].forEach(p=>both(p,c.text)); }
  if(c.muted) both('--muted',c.muted);
  if(c.accent){ both('--sel',c.accent); both('--accent',c.accent); ui['--audio']=c.accent; }
  if(c.line) both('--line',c.line);
  return {card,ui}; } PK.skColourVars=skColourVars;
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
    { const dz=skDesignClean(a.design,P+'design',(k,...x)=>note(k,...x)); if(dz) o.design=dz; }
    const css=a.css==null?'':a.css; if(typeof css!=='string'||css.length>SK_CSSMAX||new TextEncoder().encode(css).length>SK_CSSMAX) fld(P+'css'); skCssCheck(css,F+': '+P+'css'); o.css=css;
    const as={}; if(a.assets!=null&&typeof a.assets==='object'&&!Array.isArray(a.assets)){ let tot=0;
      Object.keys(a.assets).slice(0,40).forEach(k=>{ const v=a.assets[k]; if(!/^[a-z0-9-]{1,40}$/.test(k)||typeof v!=='string'||v.length>SK_ICONMAX||!SK_IMG_RE.test(v)||tot+v.length>SK_ASSETSTOT){ note('m.sk_e_veld',P+'assets.'+k); return; } tot+=v.length; as[k]=v; }); } o.assets=as;
    ids.add(o.id); appearances.push(o); }catch(e){ if(errs||notes) (errs||notes).push(e.message); else throw e; } });   // verboden CSS of een ongeldige id: alleen deze verschijningsvorm weigeren

  if(!appearances.length) fld('appearances');
  const design=skDesignClean(j.design,'design',note); if(design) skDesignNotes(design,'design',(k,...x)=>note(k,...x)); appearances.forEach(a=>{ if(a.design) skDesignNotes(skDesignMerge(design,a.design),'appearances['+a.id+'].design',(k,...x)=>note(k,...x)); });
  let dflt=null; if(j.default!=null){ if(typeof j.default==='string'&&ids.has(j.default)) dflt=j.default; else note('m.sk_e_veld','default'); }
  return {format:SK_FMT,formatVersion:j.formatVersion,skinsContract:j.skinsContract,id,device,name,version,author,license,description,created,icon,default:dflt,...(design?{design}:{}),appearances}; } PK.skValidate=skValidate;
function skParse(text,file,notes,errs){ if(typeof text!=='string'||new Blob([text]).size>SK_FILEMAX) throw new Error(file+': '+PK.pkt('m.sk_e_groot','2 MB')); let j; try{ j=JSON.parse(text); }catch(e){ throw new Error(file+': '+PK.pkt('m.sk_e_json')); } return skValidate(j,file,notes||[],errs); } PK.skParse=skParse;

// ---- register ----
function skinAll(){ const best=new Map(); for(const o of ['user','src','emb']) for(const e of PK.SK[o]){ const c=best.get(e.skin.id); if(!c||skCmp(e.skin.version,c.skin.version)>0) best.set(e.skin.id,e); } return [...best.values()]; } PK.skinAll=skinAll;
const skinsFor=dev=>skinAll().filter(e=>e.skin.device===dev).sort((a,b)=>a.skin.name.localeCompare(b.skin.name)); PK.skinsFor=skinsFor;
const skinFind=id=>(PK.SK.draft&&PK.SK.draft.skin.id===id)?PK.SK.draft:(skinAll().find(e=>e.skin.id===id)||null); PK.skinFind=skinFind;   // PK.SK.draft = het voorbeeld van de mini-ontwerper (niet in lijsten, niet in song of werkruimte)
function skAdd(origin,skin,file,extra){ return skAdd0(origin,skin,file,extra); } PK.skAdd=skAdd;
function skAdd0(origin,skin,file,extra){ const L=PK.SK[origin], i=L.findIndex(e=>e.skin.id===skin.id); if(i>=0){ if(skCmp(L[i].skin.version,skin.version)>0) return false; L.splice(i,1); } L.push({skin,file:file||'',origin,...extra}); return true; }
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
function skinsEmbed(){ const out=[], seen=new Set(); PK.Host.devices.forEach(r=>{ if(!r.skin||seen.has(r.skin.id)||out.length>=SK_EMBEDMAX) return; const e=skinFind(r.skin.id); if(!e||e===PK.SK.draft) return; seen.add(r.skin.id); if(JSON.stringify(e.skin).length<=SK_FILEMAX) out.push(e.skin); }); return out.length?{skins:out}:{}; } PK.skinsEmbed=skinsEmbed;
function skinsFromWorkspace(list){ if(!Array.isArray(list)) return; let n=0;
  for(const x of list.slice(0,SK_EMBEDMAX)){ try{ if(JSON.stringify(x).length>SK_FILEMAX) continue; if(skAdd('emb',skValidate(x,'skins[]'),'',{})) n++; }catch(e){ console.warn('skin',e.message); } }
  if(n) skinsChanged(); } PK.skinsFromWorkspace=skinsFromWorkspace;

// ---- toepassen op een kaart: <style data-pk-skin> in de open shadow root(s) van het apparaat, assets als --skin-asset-* op het hostelement ----
function skHosts(r){ const ui=r.el.querySelector(':scope > .body > .ui'), out=[]; if(!ui) return out; if(ui.shadowRoot) out.push(ui); ui.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot) out.push(e); }); return out; }
function skStrip(r){ (r.skMO||[]).forEach(m=>m.disconnect()); r.skMO=[]; (r.skHosts||[]).forEach(h=>{ if(h.shadowRoot) h.shadowRoot.querySelectorAll('style[data-pk-skin]').forEach(s=>s.remove()); (r.skProps||[]).forEach(p=>h.style.removeProperty('--skin-asset-'+p)); if(h.hasAttribute('style')&&!h.getAttribute('style').trim()) h.removeAttribute('style'); }); r.skHosts=[]; r.skProps=[]; }
// ---- design toepassen: kleuren als CSS-variabelen op de kaart en het apparaat-hostelement, poortenmodus, knoppen, haptiek; alles weer weg bij Standaard ----
const skUiEl=r=>r.el.querySelector(':scope > .body > .ui');
function skDesignStrip(r){ const d=r.skDes; if(!d) return; if(PK.skPortsOff) PK.skPortsOff(r); if(PK.hapticsDetach) PK.hapticsDetach(r);
  d.card.forEach(p=>r.el.style.removeProperty(p)); const ui=skUiEl(r); if(ui){ d.ui.forEach(p=>ui.style.removeProperty(p)); if(ui.hasAttribute('style')&&!ui.getAttribute('style').trim()) ui.removeAttribute('style'); }
  const had=!!r.skCtl; r.skDes=null; r.skCtl=null; r.skHap=null; if(had) PK.regApply(r); }
function skDesignApply(r,d){ skDesignStrip(r); if(!d||!Object.keys(d).length) return; const rec={card:[],ui:[]}; r.skDes=rec, ui=skUiEl(r);
  const c=d.colors; if(c&&c.scheme==='custom'&&c.custom&&Object.keys(c.custom).length){ const v=PK.skColourVars(c.custom);
    for(const p in v.card){ r.el.style.setProperty(p,v.card[p]); rec.card.push(p); } if(ui) for(const p in v.ui){ ui.style.setProperty(p,v.ui[p]); rec.ui.push(p); } }
  const mode=d.ports&&d.ports.mode; if(mode&&mode!=='default'){ if(r.def.ui&&r.def.ui.jacks){ if(!r.skJackWarn){ r.skJackWarn=true; PK.status(PK.pkt('m.sk_jacks',r.def.name),true); } } else if(PK.skPortsOn) PK.skPortsOn(r,mode); }
  { const rules=PK.regRules(d); r.skCtl=rules.length?rules:null; }   // knobs.style/size = korte vorm (role:param), design.controls erna
  const h=d.haptics; if(h&&(h.click||h.turn||h.slide)){ const o={click:h.click||'off',turn:h.turn||'off',slide:h.slide||'off'}; if(o.click!=='off'||o.turn!=='off'||o.slide!=='off'){ r.skHap=o; if(PK.hapticsAttach) PK.hapticsAttach(r); } }
  if(r.skCtl) PK.regApply(r); }
function skClear(r){ skStrip(r); skDesignStrip(r); r.skCur=null; r.skSkin=null; r.el.removeAttribute('data-pk-skin'); r.el.removeAttribute('data-pk-ap'); }
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
  const same=r.skCur===ap.id&&r.skSkin===sk, ok=same&&r.skHosts&&r.skHosts.length&&r.skHosts.every(h=>{ const st=h.isConnected&&h.shadowRoot&&h.shadowRoot.querySelector('style[data-pk-skin]'); return st&&h.shadowRoot.lastChild===st; });   // het skinblok staat als laatste in de shadow root, dus na de eigen stijlen van het apparaat
  if(ok&&!force) return;
  if(!force&&same&&r.skNoHost&&!skHosts(r).length) return;   // alleen ontwerp (geen CSS) en nog steeds geen shadow root: niets te doen
  const now=performance.now(), flip=r.skCur&&r.skCur!==ap.id&&st.appearance==='auto';   // vangnet tegen heen-en-weer: ≥6 wissels binnen 1 s in Auto = even niet meer wisselen
  if(flip){ r.skHist=(r.skHist||[]).filter(t=>now-t<1000); if(r.skFreeze&&now<r.skFreeze) return; if(r.skHist.length>=6){ r.skFreeze=now+3000; setTimeout(()=>skSync(r),3100); return; } r.skHist.push(now); }
  const des=skEff(sk,ap), hasDes=!!Object.keys(des).length, hs=skHosts(r);
  if(!hs.length){ if(!hasDes){ if(!r.skWarn&&e!==PK.SK.draft){ r.skWarn=true; PK.status(PK.pkt('m.sk_geen_shadow',r.def.name),true); } return; }
    if((ap.css||Object.keys(ap.assets).length)&&!r.skWarn){ r.skWarn=true; PK.status(PK.pkt('m.sk_geen_shadow',r.def.name),true); } }   // zonder open shadow root: wel het ontwerp (kleuren, poorten, haptiek), niet de CSS
  const newSkin=r.skSkin!==sk; skStrip(r);
  hs.forEach(h=>{ const s=document.createElement('style'); s.setAttribute('data-pk-skin',''); s.textContent=ap.css; h.shadowRoot.appendChild(s); Object.keys(ap.assets).forEach(k=>h.style.setProperty('--skin-asset-'+k,'url("'+ap.assets[k]+'")')); });
  r.skMO=hs.map(h=>{ let q=false; const mo=new MutationObserver(()=>{ const sr=h.shadowRoot, st=sr&&sr.querySelector('style[data-pk-skin]'); if(st){ if(sr.lastChild!==st) sr.appendChild(st); } else if(!q){ q=true; Promise.resolve().then(()=>{ q=false; if(r.skHosts&&r.skHosts.includes(h)) skSync(r,true); }); } }); mo.observe(h.shadowRoot,{childList:true}); return mo; });
  r.skHosts=hs; r.skNoHost=!hs.length; r.skProps=Object.keys(ap.assets); r.skCur=ap.id; r.skSkin=sk; skDesignApply(r,des); r.el.setAttribute('data-pk-skin',sk.id); r.el.setAttribute('data-pk-ap',ap.id);
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
const skinState=r=>{ const st=(r.skin&&PK.SK.draft&&r.skin.id===PK.SK.draft.skin.id)?r.skPrev:r.skin; return st?{id:st.id,appearance:st.appearance}:undefined; }; PK.skinState=skinState;
})(window.__PK);
