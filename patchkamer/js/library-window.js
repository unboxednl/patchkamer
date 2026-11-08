// js/library-window.js — bibliotheekvenster: opslag, tekenen, slepen, formaat, zoeken
(function(PK){
const LIBOPEN=new Set(); PK.LIBOPEN=LIBOPEN;   // categorieën die je in deze sessie openklapte: bij elke start staat alles ingeklapt
const LIBKEY='patchkamerLib'; PK.LIBKEY=LIBKEY; PK.LIB={x:16,y:16,w:420,h:620,fs:14,min:false,shown:true,closed:[]};
// eigen categorieën: LIB.catList = [{key,label,color}] in volgorde; 'other' (Overig) blijft altijd bestaan
function cleanCatList(list,addMastering,warn){ const out=[], seen=new Set(), par=new Map();   // par: key -> parent uit het bestand (optioneel veld `parent`: één niveau subcategorieën)
  (Array.isArray(list)?list:[]).forEach(c=>{ if(!c||typeof c!=='object') return; const key=String(c.key||'').trim().slice(0,40), label=String(c.label||'').trim().slice(0,60);
    if(!/^[a-z0-9_-]+$/i.test(key)||!label||seen.has(key)) return; seen.add(key); const color=typeof c.color==='string'&&/^(#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))$/i.test(c.color)?c.color:undefined; const icon=PK.cleanIcon(c.icon); out.push({key,label,...(color?{color}:{}),...(icon?{icon}:{})}); if(c.parent!=null&&c.parent!=='') par.set(key,typeof c.parent==='string'?c.parent.trim().slice(0,40):''); });
  if(addMastering&&!seen.has('mastering')){ const m={key:'mastering',label:PK.pkt('m.mastering_categorie')}, i=out.findIndex(c=>c.key==='effect'), o=out.findIndex(c=>c.key==='other'); out.splice(i>=0?i+1:(o>=0?o:out.length),0,m); }   // een oudere opgeslagen indeling kent de categorie Mastering (v1.12) nog niet
  if(!seen.has('other')) out.push({key:'other',label:PK.pkt('m.overig')});
  // parent: moet een andere, bekende categorie zijn die zelf geen parent heeft (dus hoogstens één niveau; zo kan een cyclus niet bestaan); Overig blijft bovenaan. Anders genegeerd en gemeld in warn
  const keys=new Set(out.map(c=>c.key)), cand=new Map(), bad=[]; par.forEach((p,k)=>{ if(p&&p!==k&&k!=='other'&&keys.has(p)) cand.set(k,p); else bad.push(k); });
  const ok=new Map(); cand.forEach((p,k)=>{ if(cand.has(p)) bad.push(k); else ok.set(k,p); });
  if(!ok.size){ if(warn) warn.push(...bad); return out; }
  out.forEach(c=>{ if(ok.has(c.key)) c.parent=ok.get(c.key); });
  const res=[]; out.filter(c=>!c.parent).forEach(r=>{ res.push(r); out.forEach(c=>{ if(c.parent===r.key) res.push(c); }); });   // kinderen direct na hun parent
  if(warn) warn.push(...bad); return res; } PK.cleanCatList=cleanCatList;
const CAT_KEYS={synth:'m.synths',groove:'m.drums_grooveboxen',sequencer:'m.sequencers',mod:'m.modulatie',effect:'m.effecten',mastering:'m.mastering_categorie',mix:'m.mixen_uitgang',tool:'m.meten_hulpmiddelen',other:'m.overig','fx-mod':'m.cat_fx_mod','fx-space':'m.cat_fx_space','fx-dyn':'m.cat_fx_dyn','fx-drive':'m.cat_fx_drive','fx-pitch':'m.cat_fx_pitch','fx-chain':'m.cat_fx_chain'};
function pkCatLabel(c){ const k=CAT_KEYS[c.key]; return k&&Object.values(PK.I18N).some(d=>d[k]===c.label)?PK.pkt(k):c.label; }
function applyCats(){ const list=PK.LIB.catList&&PK.LIB.catList.length?PK.LIB.catList:PK.CAT_DEFAULT.map(x=>({key:x[0],label:x[1]}));
  const byKey=new Map(list.map(c=>[c.key,c])); PK.CATPARENT={}; PK.CATLABEL={}; list.forEach(c=>{ const p=c.parent&&byKey.get(c.parent); if(p&&!p.parent) PK.CATPARENT[c.key]=c.parent; PK.CATLABEL[c.key]=pkCatLabel(c); });
  PK.CATS=list.map(c=>[c.key,PK.CATPARENT[c.key]?PK.CATLABEL[c.parent]+' › '+PK.CATLABEL[c.key]:PK.CATLABEL[c.key]]);   // een subcategorie heet buiten de bibliotheek "Parent › Sub" (keuzelijsten, meldingen); PK.CATLABEL heeft de korte naam
  PK.CATICON={}; list.forEach(c=>{ if(c.icon) PK.CATICON[c.key]=c.icon; }); PK.CATCOL={}; list.forEach((c,i)=>{ PK.CATCOL[c.key]=c.color||(PK.CAT_DEFAULT.find(x=>x[0]===c.key)||[])[2]||(PK.CATPARENT[c.key]&&PK.CATCOL[c.parent])||PK.CAT_PALETTE[i%PK.CAT_PALETTE.length]; });
  for(const k of Object.keys(PK.LIB.cats)) if(!String(PK.LIB.cats[k]).startsWith('dir-')&&!PK.CATS.some(x=>x[0]===PK.LIB.cats[k])) delete PK.LIB.cats[k];
  PK.syncDirCats(); } PK.applyCats=applyCats;
const saveLib=()=>{ try{ localStorage.setItem(LIBKEY,JSON.stringify(PK.LIB)); }catch(e){} }; PK.saveLib=saveLib;
function setCategory(defId,cat){ const def=PK.Host.latest(defId); if(!def||!PK.CATS.some(x=>x[0]===cat)) return;
  if(cat===PK.baseCategory(def)) delete PK.LIB.cats[defId]; else PK.LIB.cats[defId]=cat; PK.LIB.layoutT=Date.now(); saveLib();
  LIBOPEN.add(cat); if(PK.CATPARENT&&PK.CATPARENT[cat]) LIBOPEN.add(PK.CATPARENT[cat]); paintLib();
  PK.paintIcons();
  PK.status(`${def.name} → ${PK.CATS.find(x=>x[0]===cat)[1]}`); } PK.setCategory=setCategory;
function paintLib(){
  PK.syncDirCats(); const lib=PK.$('lib'), q=(PK.$('libSearch').value||'').trim().toLowerCase(); lib.innerHTML=''; lib.classList.toggle('cmp',PK.libViewNow()==='compact'); PK.paintLibView();
  const ids=[...new Set([...PK.Host.registry.values()].map(d=>d.id))]; let shown=0;
  const par=PK.CATPARENT||{};
  const drawCat=([cat,label])=>{   // tekent een (sub)categorie met zijn subcategorieën; geeft {box,total} of null als hij niet getoond wordt
    const items=ids.map(id=>PK.Host.versionsOf(id)[0]).filter(def=>PK.categoryOf(def)===cat)
      .filter(def=>def.status!=='retired'||PK.LIB.retired).filter(def=>!q||[def.name,def.id,def.kind,label].some(t=>String(t).toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name,'nl'));
    const subs=PK.CATS.filter(x=>par[x[0]]===cat).map(drawCat).filter(Boolean), total=items.length+subs.reduce((a,x)=>a+x.total,0), short=PK.CATLABEL[cat]||label;
    if(!items.length&&!subs.length&&(q||PK.BUILTIN_CATS.has(cat)||cat.startsWith('dir-'))) return null; shown+=items.length;
    const box=document.createElement('div'); box.className='cat'+(par[cat]?' sub':'')+(!LIBOPEN.has(cat)&&!q?' closed':''); box.dataset.cat=cat; box.style.setProperty('--catc',PK.catColor(cat));
    const head=document.createElement('button'); head.className='cathead'; head.setAttribute('aria-expanded',String(!box.classList.contains('closed')));
    head.innerHTML=`<span class="chev">▾</span>${PK.catIconHTML(cat)}${PK.esc(short)}<span class="n">${total}</span>`; { const ci=head.querySelector('.cicon'); ci.style.setProperty('--ic','var(--catc,var(--muted))'); if(ci.classList.contains('img')) ci.insertAdjacentHTML('beforebegin','<span class="cdot"></span>'); } head.title=PK.pkt('m.klik_in_of_uitklappen_dubbelklik'); head.addEventListener('dblclick',e=>{ e.preventDefault(); PK.renameCatInline(cat,head); });
    head.onclick=()=>{ box.classList.toggle('closed'); const c=box.classList.contains('closed'); head.setAttribute('aria-expanded',String(!c)); if(c) LIBOPEN.delete(cat); else LIBOPEN.add(cat); };
    const devs=document.createElement('div'); devs.className='devs'; if(!items.length&&!subs.length){ const e=document.createElement('div'); e.className='note'; e.style.cssText='padding:6px 10px;font-size:11px'; e.textContent=PK.pkt('m.nog_leeg_sleep_een_apparaat'); devs.appendChild(e); }
    items.forEach(def=>{ const vers=PK.Host.versionsOf(def.id);
      const d=document.createElement('div'); d.className='libdev c-'+cat; d.dataset.id=def.id; d.title=PK.pkt('m.sleep_naar_de_vloer');
      d.innerHTML=`<span class="nm">${PK.devIconHTML(def,null)}${PK.esc(def.name)}</span><span class="id">${PK.esc(def.id)} · ${PK.esc(def.kind)}</span><span class="pt">${PK.portsLine(def)}</span>`+(def._src?`<span class="src">${PK.esc(PK.srcLabel(def._src))}</span>`:'')+`<span class="kd">${PK.esc(def.kind)}</span><span class="vr">v${PK.esc(def.version)}</span>`;
      if(def.status==='retired'){ d.classList.add('retired'); d.querySelector('.nm').insertAdjacentHTML('beforeend','<span class="lbadge ret">'+PK.esc(PK.pkt('m.badge_retired'))+'</span>'); }   // teruggetrokken: staat standaard niet in de lijst, maar werkruimtes en songs laden hem nog
      { const mk=PK.LIBMARK.nw.has(def.id)?'new':PK.LIBMARK.ch.has(def.id)?'changed':''; if(mk){ d.classList.add('mark-'+mk); d.querySelector('.nm').insertAdjacentHTML('beforeend','<span class="lbadge">'+PK.esc(PK.pkt(mk==='new'?'m.badge_nieuw':'m.badge_gewijzigd'))+'</span>'); } }
      const act=document.createElement('div'); act.className='act';
      const vs=document.createElement('select'); vs.setAttribute('aria-label',PK.pkt('m.versie_van')+def.name); vers.forEach(v=>{const o=document.createElement('option'); o.value=v.version; o.textContent='v'+v.version; vs.appendChild(o);}); vs.disabled=vers.length<2;
      const b=document.createElement('button'); b.className='small'; b.textContent=PK.pkt('m.plaatsen'); b.title=PK.pkt('m.zet_midden_in_je_beeld'); b.onclick=()=>PK.placeNew(def.id,vs.value);
      const cs=document.createElement('select'); cs.className='catsel'; cs.title=PK.pkt('m.verplaats_naar_een_andere_categorie'); cs.setAttribute('aria-label',PK.pkt('m.categorie_van')+def.name);
      const base=PK.baseCategory(def); PK.CATS.forEach(([k,l])=>{ const o=document.createElement('option'); o.value=k; o.textContent=par[k]?'↳ '+(PK.CATLABEL[k]||l):l; if(par[k]) o.title=l; o.selected=k===cat; cs.appendChild(o); });   // een subcategorie staat als "↳ Naam" (kort, past in het keuzevak) onder zijn parent
      const baseNow=PK.CATS.some(x=>x[0]===base)?base:'other'; if(cat!==baseNow){ const o=document.createElement('option'); o.value=baseNow; o.textContent=PK.pkt('m.terug_naar')+PK.CATS.find(x=>x[0]===baseNow)[1]; cs.appendChild(o); }
      cs.onchange=()=>setCategory(def.id,cs.value);
      act.append(vs,cs,b); d.appendChild(act);
      { const xp=document.createElement('button'); xp.className='xp'; xp.type='button'; xp.textContent='▸'; xp.setAttribute('aria-label',PK.pkt('m.t_meer_minder')); xp.title=PK.pkt('m.t_meer_minder'); const op=PK.LIBEXP.has(def.id); xp.setAttribute('aria-expanded',String(op)); if(op) d.classList.add('open');
        xp.onclick=e=>{ e.stopPropagation(); const o=d.classList.toggle('open'); if(o) PK.LIBEXP.add(def.id); else PK.LIBEXP.delete(def.id); xp.setAttribute('aria-expanded',String(o)); }; d.appendChild(xp);
        d.addEventListener('click',e=>{ if(PK.libViewNow()!=='compact'||e.target.closest('select,button,.act')) return; const n=performance.now(); if(n-PK.LIBCLK.drag<400||n-PK.LIBCLK.placed<600) return; PK.LIBCLK.placed=n; PK.placeNew(def.id,vs.value); }); }
      devs.appendChild(d);
      d.addEventListener('pointerdown',e=>{ if(e.button!==0||e.target.closest('select,button')) return; if(e.pointerType==='touch'&&PK.PKT.coarse.matches){ PK.libPress(e,def,()=>vs.value,d); return; } PK.libDrag={def,ver:()=>vs.value,x0:e.clientX,y0:e.clientY,ghost:null}; e.preventDefault(); });
    });
    if(items.length||!subs.length) box.append(head,devs); else box.append(head);
    if(subs.length){ const sc=document.createElement('div'); sc.className='subcats'; sc.setAttribute('role','group'); sc.setAttribute('aria-label',PK.pkt('m.t_sub_van',short)); subs.forEach(x=>sc.appendChild(x.box)); box.appendChild(sc); }
    return {box,total}; };
  PK.CATS.filter(x=>!par[x[0]]).forEach(e=>{ const r=drawCat(e); if(r) lib.appendChild(r.box); });
  if(!ids.length){ lib.innerHTML=PK.pkt('m.nog_geen_instrumenten_kies_hieronder',PK.BUNDLED_LIB?PK.pkt('m.meegeleverde_bibliotheek_laden'):'');
    lib.querySelector('[data-act="dir"]').onclick=()=>PK.$('srcAddDir').click(); const bb=lib.querySelector('[data-act="bundled"]'); if(bb) bb.onclick=PK.loadBundled; }
  else if(!shown) lib.innerHTML=PK.pkt('m.niets_gevonden_voor',PK.esc(q));
  PK.$('libCount').textContent=PK.pkt('m.apparaten_2',ids.length);
  if(!PK.$('libCfg').hidden) PK.paintLibCfg();
} PK.paintLib=paintLib;
// drag a device from the library onto the floor
PK.libDrag=null;
function overFloor(cx,cy){ const el=document.elementFromPoint(cx,cy); return !!el&&!!el.closest('#floorwrap')&&!el.closest('#libwin'); } PK.overFloor=overFloor;
function catTarget(cx,cy){ const el=document.elementFromPoint(cx,cy); return el&&el.closest('#lib .cat'); } PK.catTarget=catTarget;
function placeLib(){ const sheet=PK.isSheet(); PK.libwin.classList.toggle('sheet',sheet); document.body.classList.toggle('libsheet',sheet&&!!PK.LIB.shown);
  if(sheet){ PK.libwin.style.setProperty('--libfs',PK.LIB.fs+'px'); PK.libwin.classList.remove('min'); PK.libwin.hidden=!PK.LIB.shown; PK.$('libToggle').classList.toggle('on',!!PK.LIB.shown); if(PK.libSync) PK.libSync(); return; }
  const r0=PK.room.getBoundingClientRect(), r={width:r0.width/PK.PKS.ui,height:r0.height/PK.PKS.ui};
  PK.LIB.w=PK.clamp(PK.LIB.w,260,Math.max(260,r.width-8)); PK.LIB.h=PK.clamp(PK.LIB.h,160,Math.max(160,r.height-8));
  PK.LIB.x=PK.clamp(PK.LIB.x,-(PK.LIB.w-120),Math.max(0,r.width-120)); PK.LIB.y=PK.clamp(PK.LIB.y,0,Math.max(0,r.height-44));
  Object.assign(PK.libwin.style,{left:PK.LIB.x+'px',top:PK.LIB.y+'px',width:PK.LIB.w+'px',height:PK.LIB.h+'px'});
  PK.libwin.style.setProperty('--libfs',PK.LIB.fs+'px'); PK.libwin.classList.toggle('min',!!PK.LIB.min); PK.libwin.hidden=!PK.LIB.shown;
  PK.$('libMin').textContent=PK.LIB.min?'▢':'—'; PK.$('libMin').title=PK.LIB.min?PK.pkt('m.uitklappen'):PK.pkt('m.inklappen'); PK.$('libToggle').classList.toggle('on',!!PK.LIB.shown); if(PK.libSync) PK.libSync(); } PK.placeLib=placeLib;
function libGesture(handle,apply,onEnd){ let st=null;
  handle.addEventListener('pointerdown',e=>{ if(e.button!==0||e.target.closest('button')) return; e.preventDefault(); e.stopPropagation(); st={cx:e.clientX,cy:e.clientY,...PK.LIB}; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove',e=>{ if(!st) return; apply(st,(e.clientX-st.cx)/PK.PKS.ui,(e.clientY-st.cy)/PK.PKS.ui); placeLib(); });
  const end=()=>{ if(st){ st=null; saveLib(); if(onEnd) onEnd(); } }; handle.addEventListener('pointerup',end); handle.addEventListener('pointercancel',end); } PK.libGesture=libGesture;
function paintLibFs(){ PK.LIB.fs=PK.clamp(+PK.LIB.fs||14,11,18); document.documentElement.style.setProperty('--pkfs',String(PK.LIB.fs/14)); PK.$('libFsV').textContent=PK.LIB.fs+' px'; PK.$('libFsDown').disabled=PK.LIB.fs<=11; PK.$('libFsUp').disabled=PK.LIB.fs>=18; } PK.paintLibFs=paintLibFs;
const textEntry=e=>{const t=(e.composedPath&&e.composedPath()[0])||e.target; return !!t&&((t.tagName==='INPUT'&&!['button','checkbox','radio','range','file'].includes(t.type))||['SELECT','TEXTAREA'].includes(t.tagName)||t.isContentEditable);}; PK.textEntry=textEntry;
})(window.__PK);
