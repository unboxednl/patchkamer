// js/library-layout.js — bibliotheekindeling: eigen categorieen, iconen, bewaren als bibliotheekbestand
(function(PK){
/* =====================================================================
   BIBLIOTHEEK-INDELING · eigen categorieën, bewaren als patchkamer-bibliotheek.json in de bibliotheekmap
   ===================================================================== */
function paintIcons(){ PK.Host.devices.forEach(r=>{ const c=PK.categoryOf(r.def), col=PK.catColor(c); r.iconEl.className='pkicon c-ic-'+c; r.iconEl.style.setProperty('--ic',col); r.el.style.setProperty('--ic',col);
    const m=PK.devIconParts(r.def,r), sig=c+'|'+m.html; if(r._icSig===sig) return; r._icSig=sig;
    const g=r.iconEl.querySelector('.glyph'); if(g){ g.className='glyph'+(m.img?' img':''); g.innerHTML=m.html; }
    const b=r.el.querySelector('.bar .cicon'); if(b){ b.className='cicon'+(m.img?' img':''); b.dataset.ik=c; b.innerHTML=m.html; } });
  if(typeof PK.focusEl!=='undefined'&&PK.focusEl&&PK.FOCUS.layout==='one') try{ PK.focusOneApply(); }catch(e){} } PK.paintIcons=paintIcons;
function catsChanged(){ PK.LIB.layoutT=Date.now(); PK.LIB.catList=PK.cleanCatList(PK.LIB.catList||PK.CATS.map(([key,label])=>({key,label}))); PK.applyCats(); PK.saveLib(); PK.paintLib(); paintIcons(); }
function ensureCatList(){ if(!PK.LIB.catList||!PK.LIB.catList.length) PK.LIB.catList=PK.CATS.map(([key,label])=>({key,label})); }
function catCount(key){ const ids=[...new Set([...PK.Host.registry.values()].map(d=>d.id))]; return ids.filter(id=>PK.categoryOf(PK.Host.versionsOf(id)[0])===key).length; }
function addCat(label){ label=String(label||'').trim().slice(0,60); if(!label) return null; ensureCatList();
  if(PK.LIB.catList.some(c=>c.label.toLowerCase()===label.toLowerCase())){ PK.status(PK.pkt('m.er_is_al_een_categorie',label),true); return null; }
  let key=label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30)||'cat'; if(PK.BUILTIN_CATS.has(key)||PK.LIB.catList.some(c=>c.key===key)) key=key+'-'+Math.random().toString(36).slice(2,6);
  const i=PK.LIB.catList.findIndex(c=>c.key==='other'); const used=new Set(PK.LIB.catList.map(c=>PK.catColor(c.key))); const color=PK.CAT_PALETTE.find(c=>!used.has(c))||PK.CAT_PALETTE[PK.LIB.catList.length%PK.CAT_PALETTE.length];
  PK.LIB.catList.splice(i<0?PK.LIB.catList.length:i,0,{key,label,color}); catsChanged(); PK.status(PK.pkt('m.categorie_toegevoegd_sleep_apparaten_erop',label)); return key; }
function setCatIcon(key,icon){ ensureCatList(); const c=PK.LIB.catList.find(x=>x.key===key); if(!c) return; const v=icon?PK.cleanIcon(icon):undefined; if(icon&&!v) return;
  if(v) c.icon=v; else delete c.icon; catsChanged(); PK.status(PK.pkt(v?'m.t_icoon_gezet':'m.t_icoon_standaard_gezet',c.label)); }
async function setCatIconUrl(key,raw){ raw=String(raw||'').trim(); if(!raw){ setCatIcon(key,null); return; }
  if(!PK.cleanIcon(raw)||PK.isBuiltinIcon(raw)||!PK.iconUrlAllowed(raw)){ PK.status(PK.pkt('m.t_icoon_bron'),true); return; }
  if(!(await PK.imgLoads(raw))){ PK.status(PK.pkt('m.t_icoon_ongeldig'),true); return; } setCatIcon(key,raw); }
function pickCatIconFile(key){ const i=document.createElement('input'); i.type='file'; i.accept='.png,.svg,.webp,.jpg,.jpeg,image/png,image/svg+xml,image/webp,image/jpeg';
  i.onchange=async()=>{ const f=i.files[0]; if(!f) return; if(f.size>PK.ICONMAX){ PK.status(PK.pkt('m.t_icoon_groot'),true); return; }
    const ext=(/\.([a-z0-9]+)$/i.exec(f.name)||[])[1]; const e=String(ext||'').toLowerCase().replace('jpeg','jpg'); if(!PK.ICONTYPES[e]){ PK.status(PK.pkt('m.t_icoon_ongeldig'),true); return; }
    let u=null; try{ u=await PK.iconToDataUrl(f,e); }catch(x){} if(!u){ PK.status(PK.pkt('m.t_icoon_ongeldig'),true); return; } setCatIcon(key,u); };
  i.click(); }
function iconPicker(c){ const box=document.createElement('div'); box.className='ipick'; box.dataset.for=c.key;
  const grid=document.createElement('div'); grid.className='igrid';
  PK.ICON_ORDER.forEach(id=>{ const b=document.createElement('button'); b.type='button'; b.dataset.icon=id; b.className=PK.CATICON[c.key]===id?'cur':''; b.innerHTML='<span class="cicon" aria-hidden="true">'+PK.svgOfIcon(id)+'</span>'; b.firstChild.style.setProperty('--ic',PK.catColor(c.key));
    b.title=PK.pkt('m.t_ic_'+id); b.setAttribute('aria-label',PK.pkt('m.t_ic_'+id)); b.onclick=()=>setCatIcon(c.key,id); grid.appendChild(b); });
  const std=document.createElement('button'); std.type='button'; std.className='small'; std.textContent=PK.pkt('m.t_icoon_standaard'); std.onclick=()=>setCatIcon(c.key,null); grid.appendChild(std);
  const r2=document.createElement('div'); r2.className='addrow'; const u=document.createElement('input'); u.type='text'; u.placeholder=PK.pkt('m.t_icoon_url'); u.setAttribute('aria-label',PK.pkt('m.t_icoon_url')); u.maxLength=500;
  u.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') setCatIconUrl(c.key,u.value); }); u.addEventListener('pointerdown',e=>e.stopPropagation());
  const ub=document.createElement('button'); ub.type='button'; ub.className='small'; ub.textContent=PK.pkt('m.t_icoon_url_knop'); ub.onclick=()=>setCatIconUrl(c.key,u.value);
  const fb=document.createElement('button'); fb.type='button'; fb.className='small'; fb.textContent=PK.pkt('m.t_icoon_bestand'); fb.onclick=()=>pickCatIconFile(c.key);
  r2.append(u,ub); const r3=document.createElement('div'); r3.className='wsrow'; r3.appendChild(fb);
  box.append(grid,r2,r3); return box; }
function renameCat(key,label){ label=String(label||'').trim().slice(0,60); ensureCatList(); const c=PK.LIB.catList.find(x=>x.key===key); if(!c||!label||c.label===label) return; c.label=label; catsChanged(); }
async function deleteCat(key){ if(key==='other'){ PK.status(PK.pkt('m.overig_blijft_altijd_bestaan_daar'),true); return; } ensureCatList(); const c=PK.LIB.catList.find(x=>x.key===key); if(!c) return; const n=catCount(key);
  if(n&&!(await PK.askUser(PK.pkt('m.categorie_verwijderen_de_apparaten_erin',PK.esc(c.label),n),PK.pkt('m.verwijderen'),PK.pkt('m.annuleren')))) return;
  PK.LIB.catList=PK.LIB.catList.filter(x=>x.key!==key); PK.LIB.catList.forEach(x=>{ if(x.parent===key){ x.color=x.color||PK.catColor(x.key); delete x.parent; } }); for(const k of Object.keys(PK.LIB.cats)) if(PK.LIB.cats[k]===key) delete PK.LIB.cats[k]; catsChanged(); PK.status(PK.pkt('m.categorie_verwijderd',c.label)); }
function moveCat(key,d){ ensureCatList(); let L=PK.LIB.catList; const c=L.find(x=>x.key===key); if(!c) return;
  const sibs=L.filter(x=>(x.parent||'')===(c.parent||'')), i=sibs.indexOf(c), t=sibs[i+d]; if(!t) return;   // een hoofdcategorie schuift met zijn subcategorieën mee; een subcategorie schuift tussen zijn zusters
  const grp=r=>r.parent?[r]:[r,...L.filter(x=>x.parent===r.key)], mine=grp(c), tgt=grp(t);
  L=L.filter(x=>!mine.includes(x)); L.splice(d<0?L.indexOf(tgt[0]):L.indexOf(tgt[tgt.length-1])+1,0,...mine); PK.LIB.catList=L; catsChanged(); }
// ↳: maak van een hoofdcategorie een subcategorie van de hoofdcategorie erboven (alleen als hij zelf geen subcategorieën heeft); ↰: weer een hoofdcategorie, direct onder zijn groep
function indentCat(key){ ensureCatList(); let L=PK.LIB.catList; const c=L.find(x=>x.key===key); if(!c||c.key==='other'||c.parent||L.some(x=>x.parent===key)) return;
  const p=L.slice(0,L.indexOf(c)).reverse().find(x=>!x.parent); if(!p) return; c.color=c.color||PK.catColor(key); c.parent=p.key;
  L=L.filter(x=>x!==c); const last=[p,...L.filter(x=>x.parent===p.key)].pop(); L.splice(L.indexOf(last)+1,0,c); PK.LIB.catList=L; PK.LIBOPEN.add(p.key); catsChanged(); PK.status(PK.pkt('m.t_sub_gezet',c.label,p.label)); }
function outdentCat(key){ ensureCatList(); let L=PK.LIB.catList; const c=L.find(x=>x.key===key); if(!c||!c.parent) return;
  const pk=c.parent; c.color=c.color||PK.catColor(key); delete c.parent; L=L.filter(x=>x!==c); const last=[...L.filter(x=>x.key===pk||x.parent===pk)].pop(); L.splice(last?L.indexOf(last)+1:L.length,0,c); PK.LIB.catList=L; catsChanged(); PK.status(PK.pkt('m.t_sub_los_gezet',c.label)); }
function recolorCat(key){ ensureCatList(); const c=PK.LIB.catList.find(x=>x.key===key); if(!c) return; const cur=PK.catColor(key), i=PK.CAT_PALETTE.indexOf(cur); c.color=PK.CAT_PALETTE[(i+1)%PK.CAT_PALETTE.length]; catsChanged(); }
function renameCatInline(key,head){ const lab=PK.CATS.find(x=>x[0]===key); if(!lab) return; const i=document.createElement('input'); i.type='text'; i.value=PK.CATLABEL[key]||lab[1]; i.maxLength=60; i.setAttribute('aria-label',PK.pkt('m.nieuwe_naam'));
  i.style.cssText='flex:1;min-width:0;font:inherit;background:var(--field);color:var(--field-fg);border:1px solid var(--line);border-radius:4px;padding:3px 6px';
  head.replaceWith(i); i.focus(); i.select(); let done=false; const fin=ok=>{ if(done) return; done=true; if(ok) renameCat(key,i.value); else PK.paintLib(); };
  i.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') fin(true); if(e.key==='Escape') fin(false); }); i.addEventListener('blur',()=>fin(true)); i.addEventListener('pointerdown',e=>e.stopPropagation()); } PK.renameCatInline=renameCatInline;
function layoutState(){ ensureCatList(); return {format:'patchkamer-bibliotheek',formatVersion:1,catV:2,saved:new Date().toISOString(),
  categories:PK.LIB.catList.map(c=>({key:c.key,label:c.label,color:PK.catColor(c.key),...(c.parent?{parent:c.parent}:{}),...(c.icon?{icon:c.icon}:{})})),folders:[...new Set(PK.latestDefs().map(PK.dirOf).filter(Boolean))].sort(),assign:Object.fromEntries(Object.entries(PK.LIB.cats).filter(([,c])=>!String(c).startsWith('dir-'))),closed:PK.CATS.map(x=>x[0]).filter(k=>!PK.LIBOPEN.has(k))}; }
// L = inhoud van patchkamer-bibliotheek.json. force=false bij het laden van een bron: alleen toepassen als het bestand nieuw of gewijzigd is
function applyLayout(L,src,force){ if(!L||L.format!=='patchkamer-bibliotheek'||!Array.isArray(L.categories)) throw new Error(PK.pkt('m.geen_bibliotheekindeling_format_patchkamer_bibliotheek'));
  { const o=src&&PK.SRCLAYOUT.get(src.sid); if(o) o.folders=Array.isArray(L.folders)?L.folders.map(String):null; }
  const stamp=String(L.saved||'')+'|'+L.categories.length+'|'+Object.keys(L.assign||{}).length, k=src?src.sid:'file';
  if(!force&&PK.LIB.layoutSeen[k]===stamp) return '';
  if(!force&&src&&PK.LIB.layoutT&&!(Date.parse(L.saved||'')>=PK.LIB.layoutT)){ PK.LIB.layoutSeen[k]=stamp; PK.saveLib(); return PK.pkt('m.indeling_in_deze_browser_is')+PK.LAYOUT_FILE+PK.pkt('m.en_blijft_staan'); }
  const warn=[]; PK.LIB.catList=PK.cleanCatList(L.categories,!(L.catV>=2),warn); PK.LIB.cats={}; const keys=new Set(PK.LIB.catList.map(c=>c.key));
  if(L.assign&&typeof L.assign==='object') for(const [id,cat] of Object.entries(L.assign)) if(typeof id==='string'&&keys.has(cat)) PK.LIB.cats[id]=cat;
  PK.CAT_OVR=PK.LIB.cats; PK.LIB.layoutSeen[k]=stamp; PK.LIB.layoutT=Date.parse(L.saved||'')||Date.now(); PK.applyCats(); PK.saveLib(); PK.paintLib(); paintIcons();
  return PK.pkt('m.indeling_categorie_n',PK.LIB.catList.length)+(warn.length?' · '+PK.pkt('m.indeling_parent_genegeerd',warn.join(', ')):''); } PK.applyLayout=applyLayout;
async function downloadLayout(){ const r=await PK.saveFileData(PK.LAYOUT_FILE,JSON.stringify(layoutState(),null,2)); PK.status(r==='saved'?PK.LAYOUT_FILE+PK.pkt('m.bewaard_zet_het_in_de'):PK.pkt('m.bewaren_geannuleerd')); return; 
  PK.status(PK.pkt('m.gedownload_zet_het_in_de',PK.LAYOUT_FILE)); }
function tellUser(html){ const p=PK.askUser(html,'OK','OK'); const ms=document.querySelectorAll('.pkmodal'); const b=ms.length&&ms[ms.length-1].querySelector('button[data-a="0"]'); if(b) b.hidden=true; return p; }
async function saveLayoutToFolder(src){ const L=layoutState(), text=JSON.stringify(L,null,2), stamp=String(L.saved)+'|'+L.categories.length+'|'+Object.keys(L.assign).length, nc=L.categories.length, na=Object.keys(L.assign).length;
  const viaDownload=async why=>{ const r=await PK.saveFileData(PK.LAYOUT_FILE,text); if(r==='saved'){ await tellUser(PK.pkt('m.daarom_heb_ik_als_download',why,PK.LAYOUT_FILE,nc,na,PK.esc(src.label))); } else PK.status(PK.pkt('m.bewaren_geannuleerd')); return r==='saved'; };
  let h=null; try{ h=await PK.IDB.get('dir:'+src.sid); }catch(e){}
  if(!h||!h.requestPermission){
    if(window.showDirectoryPicker){ try{ h=await window.showDirectoryPicker({id:'patchkamer-bron',mode:'readwrite'}); if(h&&h.name===src.label) try{ await PK.IDB.set('dir:'+src.sid,h); }catch(e){} }catch(e){ if(e&&e.name==='AbortError'){ PK.status(PK.pkt('m.bewaren_geannuleerd')); return false; } h=null; } }
    if(!h||!h.requestPermission) return viaDownload(PK.pkt('m.patchkamer_kan_hier_niet_rechtstreeks')); }
  let st='denied'; try{ st=await h.queryPermission({mode:'readwrite'}); if(st!=='granted') st=await h.requestPermission({mode:'readwrite'}); }catch(e){ st='denied'; }
  if(st!=='granted') return viaDownload(PK.pkt('m.de_map_gaf_geen_schrijftoestemming'));
  try{ const fh=await h.getFileHandle(PK.LAYOUT_FILE,{create:true}), w=await fh.createWritable(); await w.write(text); await w.close();
    PK.LIB.layoutSeen[src.sid]=stamp; PK.saveLib(); PK.status(PK.pkt('m.indeling_bewaard_in',h.name||src.label,PK.LAYOUT_FILE)); await tellUser(PK.pkt('m.indeling_bewaard_in_categorie_n',PK.esc(h.name||src.label),PK.LAYOUT_FILE,nc,na)); return true; }
  catch(e){ return viaDownload(PK.pkt('m.schrijven_in_de_map_lukte')+PK.esc(e.message)+').'); } }
function paintLibCfg(){ const box=PK.$('libCfg'); box.innerHTML=''; ensureCatList();
  const h=document.createElement('h4'); h.textContent=PK.pkt('m.categorie_n'); box.appendChild(h);
  PK.LIB.catList.forEach((c,i)=>{ const row=document.createElement('div'); row.className='crow'+(c.parent?' sub':''); const sibs=PK.LIB.catList.filter(x=>(x.parent||'')===(c.parent||'')), si=sibs.indexOf(c);
    const sw=document.createElement('button'); sw.className='sw'; sw.type='button'; sw.style.background=PK.catColor(c.key); sw.title=PK.pkt('m.andere_kleur'); sw.setAttribute('aria-label',PK.pkt('m.kleur_van')+c.label); sw.onclick=()=>recolorCat(c.key);
    const inp=document.createElement('input'); inp.type='text'; inp.value=c.label; inp.maxLength=60; inp.setAttribute('aria-label',PK.pkt('m.naam_van_categorie')); inp.addEventListener('change',()=>renameCat(c.key,inp.value)); inp.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') inp.blur(); }); inp.addEventListener('pointerdown',e=>e.stopPropagation());
    const n=document.createElement('span'); n.className='n'; n.textContent=catCount(c.key); n.title=PK.pkt('m.aantal_apparaten');
    const up=document.createElement('button'); up.textContent='▲'; up.title=PK.pkt('m.omhoog'); up.disabled=si===0; up.onclick=()=>moveCat(c.key,-1);
    const dn=document.createElement('button'); dn.textContent='▼'; dn.title=PK.pkt('m.omlaag'); dn.disabled=si===sibs.length-1; dn.onclick=()=>moveCat(c.key,1);
    const del=document.createElement('button'); del.textContent='×'; del.title=c.key==='other'?PK.pkt('m.overig_kan_niet_weg'):PK.pkt('m.categorie_verwijderen'); del.disabled=c.key==='other'; del.onclick=()=>deleteCat(c.key);
    const ib=document.createElement('button'); ib.type='button'; ib.className='ibtn'; ib.innerHTML=PK.catIconHTML(c.key); ib.firstChild.style.setProperty('--ic',PK.catColor(c.key)); ib.title=PK.pkt('m.t_icoon_kies'); ib.setAttribute('aria-label',PK.pkt('m.t_icoon_kies')+': '+c.label); ib.setAttribute('aria-expanded',String(PK.ICFG===c.key));
    ib.onclick=()=>{ PK.ICFG=PK.ICFG===c.key?null:c.key; paintLibCfg(); };
    const ind=document.createElement('button'); ind.type='button'; const isSub=!!c.parent, prevRoot=PK.LIB.catList.slice(0,i).some(x=>!x.parent);
    ind.textContent=isSub?'↰':'↳'; ind.title=PK.pkt(isSub?'m.t_sub_los':'m.t_sub_maken'); ind.setAttribute('aria-label',PK.pkt(isSub?'m.t_sub_los':'m.t_sub_maken')+': '+c.label);
    ind.disabled=isSub?false:(c.key==='other'||!prevRoot||PK.LIB.catList.some(x=>x.parent===c.key)); ind.onclick=()=>isSub?outdentCat(c.key):indentCat(c.key);
    row.append(sw,ib,inp,n,ind,up,dn,del); box.appendChild(row); if(PK.ICFG===c.key) box.appendChild(iconPicker(c)); });
  const add=document.createElement('div'); add.className='addrow'; add.innerHTML=PK.pkt('m.toevoegen');
  const ai=add.querySelector('input'); const go=()=>{ if(addCat(ai.value)) ai.value=''; }; add.querySelector('button').onclick=go; ai.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') go(); }); ai.addEventListener('pointerdown',e=>e.stopPropagation()); box.appendChild(add);
  const h2=document.createElement('h4'); h2.textContent=PK.pkt('m.bewaren_en_laden'); box.appendChild(h2);
  const folders=PK.SOURCES.filter(x=>x.kind==='folder'); const r1=document.createElement('div'); r1.className='wsrow';
  if(folders.length){ const sel=document.createElement('select'); sel.setAttribute('aria-label',PK.pkt('m.bibliotheekmap')); folders.forEach(f=>{ const o=document.createElement('option'); o.value=f.sid; o.textContent=f.label; sel.appendChild(o); });
    const b=document.createElement('button'); b.className='small'; b.textContent=PK.pkt('m.bewaren_in_map'); b.title=PK.pkt('m.schrijft_in_de_hoofdmap_van',PK.LAYOUT_FILE); b.onclick=()=>{ const f=folders.find(x=>x.sid===sel.value); if(f) saveLayoutToFolder(f); };
    if(folders.length>1) r1.append(sel); r1.append(b); }
  const dl=document.createElement('button'); dl.className='small'; dl.textContent=PK.pkt('m.downloaden_json'); dl.onclick=downloadLayout;
  const ld=document.createElement('button'); ld.className='small'; ld.textContent=PK.pkt('m.laden_uit_bestand'); ld.onclick=()=>{ const i=document.createElement('input'); i.type='file'; i.accept='.json,application/json'; i.onchange=async()=>{ const f=i.files[0]; if(!f) return; try{ const r=applyLayout(JSON.parse(await f.text()),null,true); PK.status(PK.pkt('m.geladen',f.name,r)); }catch(e){ PK.status(f.name+': '+e.message,true); } }; i.click(); };
  const rs=document.createElement('button'); rs.className='small'; rs.textContent=PK.pkt('m.standaardindeling'); rs.title=PK.pkt('m.de_oorspronkelijke_categorie_n_eigen'); rs.onclick=async()=>{ if(!(await PK.askUser(PK.pkt('m.terug_naar_de_standaardcategorie_n'),PK.pkt('m.terugzetten'),PK.pkt('m.annuleren')))) return; PK.LIB.catList=null; PK.LIB.cats={}; PK.CAT_OVR=PK.LIB.cats; PK.applyCats(); PK.saveLib(); PK.paintLib(); paintIcons(); };
  r1.append(dl,ld,rs); box.appendChild(r1);
  const note=document.createElement('div'); note.className='note'; note.innerHTML=PK.pkt('m.de_indeling_categorie_n_namen',PK.LAYOUT_FILE); box.appendChild(note);
  const note2=document.createElement('div'); note2.className='note'; note2.innerHTML=PK.pkt('m.t_icoon_noot'); box.appendChild(note2);
  const note3=document.createElement('div'); note3.className='note'; note3.innerHTML=PK.pkt('m.t_sub_noot'); box.appendChild(note3); } PK.paintLibCfg=paintLibCfg;
})(window.__PK);
