// js/sources.js — bronnen: GitHub, URL en lokale map laden en tonen
(function(PK){
// ---- bronnen ----
const SKEY='patchkamerSources'; PK.SKEY=SKEY; PK.SOURCES=[]; const SRCSTATE=new Map(); PK.SRCSTATE=SRCSTATE;   // sid -> {state:'ok'|'warn'|'err'|'busy', msg, n}
const saveSources=()=>{ try{ localStorage.setItem(SKEY,JSON.stringify(PK.SOURCES)); }catch(e){} }; PK.saveSources=saveSources;
const newSid=()=>'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); PK.newSid=newSid;
function srcLabel(o){ if(!o) return ''; if(o.kind==='github') return 'GitHub · '+(o.label||''); if(o.kind==='url') return 'URL · '+(o.label||o.url||''); if(o.kind==='folder') return PK.pkt('m.map_voorvoegsel')+(o.label||'')+(o.path?' / '+o.path:''); if(o.kind==='file') return PK.pkt('m.los_bestand')+(o.name||''); if(o.kind==='embedded') return PK.pkt('m.uit_werkruimtebestand'); return PK.pkt('m.geplakte_code'); } PK.srcLabel=srcLabel;
// raw.githubusercontent.com bewaart een bestand tot 5 minuten in zijn cache, ook als de browser om verversen vraagt: tijdens en vlak na een scan voegen we een tijdstempel toe, zodat een scan altijd de nieuwste versie ziet
let _freshUntil=0; const rawBust=u=>Date.now()<_freshUntil&&/^https:\/\/raw\.githubusercontent\.com\//.test(u)?u+(u.includes('?')?'&':'?')+'pk='+Date.now():u;
async function fetchText(url){
  try{ const r=await fetch(rawBust(url),{cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); const t=await r.text(); PK.IDB.set('code:'+url,{t:Date.now(),code:t}); return {text:t,cached:false}; }
  catch(e){ const c=await PK.IDB.get('code:'+url); if(c&&c.code) return {text:c.code,cached:true}; throw new Error('kon '+url+PK.pkt('m.niet_ophalen')+e.message+PK.NETMSG); } } PK.fetchText=fetchText;
// parallel ophalen: start alle taken met een vast maximum tegelijk en geeft de beloften in dezelfde volgorde terug; de verwerking blijft in volgorde, dus de bibliotheek ziet er hetzelfde uit
const LOADPAR=8;
function ahead(items,fn,limit){ limit=limit||LOADPAR; let run=0, k=0; const out=items.map(()=>null), starts=[];
  const pump=()=>{ while(run<limit&&k<items.length){ const i=k++; run++; starts[i](); } };
  items.forEach((it,i)=>{ out[i]=new Promise((res,rej)=>{ starts[i]=()=>{ let p; try{ p=Promise.resolve(fn(it,i)); }catch(e){ p=Promise.reject(e); } p.then(res,rej).finally(()=>{ run--; pump(); }); }; }); out[i].catch(()=>{}); });
  pump(); return out; } PK.ahead=ahead;
const TREEMEMO=new Map();   // één GitHub-aanroep per repo en boom, ook als apparaten, presets en tunes als aparte bronnen laden
async function fetchJSON(url){ const r=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:Date.now()<_freshUntil?'no-cache':'default'}); if(!r.ok) throw new Error((r.status===403?PK.pkt('m.github_limiet_bereikt_of_geen'):'HTTP '+r.status)+PK.pkt('m.bij')+url); return r.json(); } PK.fetchJSON=fetchJSON;
const looksLikeDevice=t=>/export\s+default\b/.test(t)&&/\bcreate\s*\(/.test(t); PK.looksLikeDevice=looksLikeDevice;
const isModulePath=p=>/\.patchkamer-device\.js$/i.test(p)&&!/(^|\/)(node_modules|tests?|\.github|dist\/vendor)\//i.test(p)&&!/validate-instrument|\.test\.m?js$|\.config\.m?js$/i.test(p);

// adres uitpluizen: GitHub-repo/-map/-bestand, raw-bestand, manifest of losse module
function parseSourceUrl(raw){ let u; const t=String(raw||'').trim(); try{ u=new URL(/^[a-z]+:\/\//i.test(t)?t:'https://'+t); }catch(e){ throw new Error(PK.pkt('m.geen_geldig_adres')); }
  if(u.hostname==='github.com'){ const seg=u.pathname.split('/').filter(Boolean); if(seg.length<2) throw new Error(PK.pkt('m.geef_een_repo_op_github'));
    const [owner,repo0,mode,ref,...rest]=seg, repo=repo0.replace(/\.git$/,'');
    if(mode==='blob'&&ref){ const path=rest.join('/'); return {kind:'url',url:`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`,label:`${owner}/${repo}/${path}`}; }
    return {kind:'github',owner,repo,ref:mode==='tree'?ref:'',path:mode==='tree'?rest.join('/'):''}; }
  return {kind:'url',url:u.href,label:(u.hostname+u.pathname).replace(/\/$/,'')}; } PK.parseSourceUrl=parseSourceUrl;

// alle modules van één bron laden; geeft het aantal geladen apparaten
const LIBWS=new Map(); PK.LIBWS=LIBWS;   // sid -> [{name, path, load: async()=>werkruimte}]  — startwerkruimtes uit een bibliotheek
// icon.svg / icon.png / icon.webp / icon.jpg in de map van een categorie (de eerste map onder de bron). find(prefix,naam) geeft een Blob/File of null.
// De afbeelding wordt een data-adres, alleen getoond via <img> (een SVG draait zo nooit scripts), hoogstens 200 kB en alleen als ze laadt.
const ICONTYPES={svg:'image/svg+xml',png:'image/png',webp:'image/webp',jpg:'image/jpeg'}; PK.ICONTYPES=ICONTYPES;
const blobToDataUrl=b=>new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(String(fr.result)); fr.onerror=()=>rej(fr.error); fr.readAsDataURL(b); });
const imgLoads=url=>new Promise(res=>{ const im=new Image(), t=setTimeout(()=>res(false),4000); im.onload=()=>{ clearTimeout(t); res(true); }; im.onerror=()=>{ clearTimeout(t); res(false); }; im.src=url; }); PK.imgLoads=imgLoads;
async function iconToDataUrl(blob,ext){ if(!blob||!blob.size||blob.size>PK.ICONMAX) return null; const u=await blobToDataUrl(new Blob([blob],{type:ICONTYPES[ext]})); return (await imgLoads(u))?u:null; } PK.iconToDataUrl=iconToDataUrl;
async function loadDirIcons(src,find){
  for(const k of [...PK.DIRICON.keys()]) if(k.startsWith(src.sid+'|')) PK.DIRICON.delete(k);
  if(!find) return; PK.syncDirCats(); const seen=new Set(), depth=PK.SRCDEPTH.get(src.sid)||0;
  for(const def of PK.latestDefs()){ if(!def._src||def._src.sid!==src.sid) continue; const f=PK.dirOf(def); if(!f||seen.has(f)||!PK.dirCatKey(def)) continue; seen.add(f);
    const prefix=PK.pathSegs(def).slice(0,depth+1).join('/')+'/';
    for(const ext of Object.keys(ICONTYPES)){ let blob=null; try{ blob=await find(prefix,'icon.'+ext); }catch(e){} if(!blob) continue;
      let u=null; try{ u=await iconToDataUrl(blob,ext); }catch(e){} if(u){ PK.DIRICON.set(src.sid+'|'+f,u); break; } } } }
const sameOrigin=u=>{ try{ const x=new URL(u,location.href); return location.protocol!=='file:'&&x.origin===location.origin; }catch(e){ return false; } }; PK.sameOrigin=sameOrigin;
const wsNameOf=pth=>decodeURIComponent(String(pth).split('/').pop()).replace(/\.patchkamer(-song)?\.json$/i,''); PK.wsNameOf=wsNameOf;
const prEntry=x=>({path:String(typeof x==='string'?x:(x&&x.path)||'').replace(/^\.\//,''),name:typeof x==='string'?'':((x&&x.name)||'')});
const wsEntry=x=>typeof x==='string'?{path:x.replace(/^\.\//,''),name:wsNameOf(x)}:{path:String(x&&x.path||'').replace(/^\.\//,''),name:(x&&x.name)||wsNameOf(x&&x.path||'')};
async function loadSource(src,opts={}){
  if(opts.fresh) _freshUntil=Date.now()+90000;
  SRCSTATE.set(src.sid,{state:'busy',msg:PK.pkt('m.laden_ellipsis')}); paintSources(); let n=0, skipped=0, cached=0, layoutNote='', iconFind=null; const errs=[], wss=[], prs=[], skl=[], ski=[];   // skl: skinbestanden, ski: iconen uit skins/library/<apparaat-id>/
  const one=async(text,origin,imp)=>{ if(!looksLikeDevice(text)){ skipped++; if(/export\s+default/.test(text)) errs.push((origin.path||origin.url)+PK.pkt('m.overgeslagen_geen_apparaat_herkend_export')); return; } try{ await PK.loadDeviceSource(text,origin,true,imp); n++; }catch(e){ errs.push((origin.path||origin.url)+': '+e.message); } };
  const isWs=pth=>/\.patchkamer(-song)?\.json$/i.test(pth), isPr=pth=>/\.patchkamer-(presets|tunes|samples)\.json$/i.test(pth); let layout=null;
  const SKICON_RE=/^([A-Za-z0-9._-]+)\/icon\.(svg|png|webp|jpg)$/i, skIconOf=(p,rel)=>{ let m=/(?:^|\/)skins\/library\/([A-Za-z0-9._-]+)\/icon\.(svg|png|webp|jpg)$/i.exec(p); if(!m&&src.only==='skins') m=SKICON_RE.exec(rel); return m?{dev:m[1],ext:m[2].toLowerCase()}:null; }, isSk=pth=>/\.patchkamer-skin\.json$/i.test(pth);
  try{
    if(src.kind==='github'){
      const api=`https://api.github.com/repos/${src.owner}/${src.repo}`; if(!src.ref) src.ref=(await fetchJSON(api)).default_branch||'main';
      src.label=`${src.owner}/${src.repo}${src.path?'/'+src.path:''}@${src.ref}`;
      const tkey=api+'@'+src.ref; if(opts.fresh) TREEMEMO.delete(tkey); if(!TREEMEMO.has(tkey)) TREEMEMO.set(tkey,fetchJSON(`${api}/git/trees/${encodeURIComponent(src.ref)}?recursive=1`).catch(e=>{ TREEMEMO.delete(tkey); throw e; })); const tree=await TREEMEMO.get(tkey); const base=src.path?src.path.replace(/\/$/,'')+'/':'';
      const blobs=(tree.tree||[]).filter(x=>x.type==='blob'&&x.path.startsWith(base)); const rawOf=p=>`https://raw.githubusercontent.com/${src.owner}/${src.repo}/${src.ref}/${p}`;
      let paths, wpaths; const man=blobs.find(x=>x.path===base+'patchkamer.json');
      { const lc=new Map(blobs.map(x=>[x.path.toLowerCase(),x])); iconFind=async(prefix,name)=>{ const b=lc.get((base+prefix+name).toLowerCase()); if(!b||(b.size||0)>PK.ICONMAX) return null; const r=await fetch(rawBust(rawOf(b.path)),{cache:'no-cache'}); return r.ok?r.blob():null; }; }
      let ppaths, skpaths;
      if(man){ const m=JSON.parse((await fetchText(rawOf(man.path))).text); paths=(m.modules||[]).map(x=>base+String(x).replace(/^\.\//,'')); wpaths=(m.workspaces||[]).map(wsEntry).map(w=>({...w,path:base+w.path})); ppaths=[...(m.presets||[]),...(m.tunes||[]),...(m.samples||[])].map(prEntry).map(w=>({...w,path:base+w.path})); skpaths=(m.skins||[]).map(prEntry).map(w=>base+w.path); if(m.name) src.label=m.name+' · '+src.label; }
      else { paths=blobs.map(x=>x.path).filter(isModulePath).slice(0,500); wpaths=blobs.map(x=>x.path).filter(isWs).map(wsEntry); ppaths=blobs.map(x=>x.path).filter(isPr).map(prEntry); skpaths=blobs.map(x=>x.path).filter(isSk); }
      if(src.only&&src.only!=='skins') skpaths=[];
      if(src.only){ if(src.only!=='devices') paths=[]; wpaths=[]; ppaths=ppaths.filter(w=>src.only==='tunes'?/\.patchkamer-tunes\.json$/i.test(w.path):src.only==='presets'?/\.patchkamer-presets\.json$/i.test(w.path):src.only==='samples'?/\.patchkamer-samples\.json$/i.test(w.path):false); }   // een bron voor één soort: alleen apparaten, alleen presets of alleen tunes
      { const lb=blobs.find(x=>x.path===base+PK.LAYOUT_FILE)||blobs.find(x=>x.path===base+'devices/'+PK.LAYOUT_FILE); if(lb) layout=async()=>JSON.parse((await fetchText(rawOf(lb.path))).text); }
      ppaths.forEach(w=>prs.push({path:w.path.slice(base.length),load:async()=>JSON.parse((await fetchText(rawOf(w.path))).text)}));
      { const bz=new Map(blobs.map(x=>[x.path,x.size])); skpaths.forEach(p=>skl.push({path:p.slice(base.length),size:bz.get(p),load:async()=>(await fetchText(rawOf(p))).text}));
        if(!src.only||src.only==='skins') blobs.forEach(x=>{ const k=skIconOf(x.path,x.path.slice(base.length)); if(k&&(x.size||0)<=PK.ICONMAX) ski.push({...k,get:async()=>{ const r=await fetch(rawBust(rawOf(x.path)),{cache:'no-cache'}); return r.ok?r.blob():null; }}); }); }
      let pdone=0; const pre=ahead(paths,p=>fetchText(rawOf(p))); for(const [pi,pth] of paths.entries()){ if(PK.loadNote) PK.loadNote(pdone++,paths.length,pth.split('/').pop(),src); try{ const r=await pre[pi]; if(r.cached) cached++; await one(r.text,{sid:src.sid,kind:'github',url:rawOf(pth),path:pth.slice(base.length),label:src.label}); }catch(e){ errs.push(e.message); } }
      wpaths.forEach(w=>wss.push({name:w.name,path:w.path.slice(base.length),load:async()=>JSON.parse((await fetchText(rawOf(w.path))).text)}));
    } else if(src.kind==='url'){
      if(/\.json(\?|$)/i.test(src.url)||!/\.m?js(\?|$)/i.test(src.url)){
        const murl=/\.json(\?|$)/i.test(src.url)?src.url:src.url.replace(/\/?$/,'/')+'patchkamer.json'; iconFind=async(prefix,name)=>{ const u=new URL(prefix+name,murl); if(u.origin!==new URL(murl).origin) return null; const r=await fetch(u.href,{cache:'no-cache'}); return r.ok?r.blob():null; }; const r=await fetchText(murl); if(r.cached) cached++; const m=JSON.parse(r.text); if(m.name) src.label=m.name;
        if(m.format==='patchkamer-skin') skl.push({path:murl.split('/').pop().split('?')[0],load:async()=>r.text});   // een adres rechtstreeks naar één skinbestand
        { const seenDev=new Set(); (m.skins||[]).map(prEntry).forEach(w=>{ const u=new URL(w.path,murl); if(u.origin!==new URL(murl).origin){ errs.push(w.path+PK.pkt('m.sk_andere_bron')); return; }
            skl.push({path:w.path,load:async()=>(await fetchText(u.href)).text}); const sg=w.path.split('/'), dev=sg[sg.length-2];
            if(dev&&/^[A-Za-z0-9._-]+$/.test(dev)&&!seenDev.has(dev)){ seenDev.add(dev); for(const ext of Object.keys(ICONTYPES)) ski.push({dev,ext,get:async()=>{ const r2=await fetch(new URL('icon.'+ext,u).href,{cache:'no-cache'}); return r2.ok?r2.blob():null; }}); } }); }
        const mpre=ahead((m.modules||[]).map(x=>new URL(x,murl).href),u=>fetchText(u)); for(const [mi,x] of (m.modules||[]).entries()){ const u=new URL(x,murl).href; try{ const r2=await mpre[mi]; if(r2.cached) cached++; await one(r2.text,{sid:src.sid,kind:'url',url:u,path:String(x),label:src.label},sameOrigin(u)?u:null); }catch(e){ errs.push(e.message); } }
        (m.workspaces||[]).map(wsEntry).forEach(w=>{ const u=new URL(w.path,murl).href; wss.push({name:w.name,path:w.path,load:async()=>JSON.parse((await fetchText(u)).text)}); });
        [...(m.presets||[]),...(m.tunes||[]),...(m.samples||[])].map(prEntry).forEach(w=>{ const u=new URL(w.path,murl).href; prs.push({path:w.path,load:async()=>JSON.parse((await fetchText(u)).text)}); });
        if(typeof m.library==='string'){ const u=new URL(m.library,murl).href; layout=async()=>JSON.parse((await fetchText(u)).text); } }
      else { const r=await fetchText(src.url); if(r.cached) cached++; await one(r.text,{sid:src.sid,kind:'url',url:src.url,label:src.label},sameOrigin(src.url)?src.url:null); }
    } else if(src.kind==='folder'){
      const files=await folderFiles(src,opts); if(!files){ SRCSTATE.set(src.sid,{state:'warn',msg:PK.pkt('m.opnieuw_verbinden_nodig')}); paintSources(); return {n:0,errs:[]}; }
      const byPath=new Map(files); let mods, wps; const man=byPath.get('patchkamer.json');
      { const lf=new Map(files.map(f=>[f[0].toLowerCase(),f[2]])); iconFind=async(prefix,name)=>{ const g=lf.get((prefix+name).toLowerCase()); return g?g():null; }; }
      let pps, sks;
      if(man){ const m=JSON.parse(await man()); if(m.name) src.label=m.name; sks=(m.skins||[]).map(prEntry).map(w=>w.path); mods=(m.modules||[]).map(x=>String(x).replace(/^\.\//,'')); wps=(m.workspaces||[]).map(wsEntry); pps=[...(m.presets||[]),...(m.tunes||[]),...(m.samples||[])].map(prEntry); }
      else { mods=files.map(f=>f[0]).filter(isModulePath); wps=files.map(f=>f[0]).filter(isWs).map(wsEntry); pps=files.map(f=>f[0]).filter(isPr).map(prEntry); sks=files.map(f=>f[0]).filter(isSk); }
      sks.forEach(pth=>{ const get=byPath.get(pth); if(get) skl.push({path:pth,load:async()=>get()}); });
      files.forEach(f=>{ const k=skIconOf(f[0],f[0]); if(k) ski.push({...k,get:async()=>{ const b=f[2]?await f[2]():null; return b&&b.size<=PK.ICONMAX?b:null; }}); });
      { const lg=byPath.get(PK.LAYOUT_FILE); if(lg) layout=async()=>JSON.parse(await lg()); }
      if(src.only){ if(src.only!=='devices') mods=[]; wps=[]; pps=pps.filter(w=>src.only==='tunes'?/\.patchkamer-tunes\.json$/i.test(w.path):src.only==='presets'?/\.patchkamer-presets\.json$/i.test(w.path):src.only==='samples'?/\.patchkamer-samples\.json$/i.test(w.path):false); }
      pps.forEach(w=>{ const get=byPath.get(w.path); if(get) prs.push({path:w.path,load:async()=>JSON.parse(await get())}); });
      const fpre=ahead(mods,pth=>byPath.has(pth)?byPath.get(pth)():null); for(const [fi,pth] of mods.entries()){ const get=byPath.get(pth); if(!get){ errs.push(pth+PK.pkt('m.staat_in_patchkamer_json_maar')); continue; } try{ await one(await fpre[fi],{sid:src.sid,kind:'folder',path:pth,label:src.label}); }catch(e){ errs.push(pth+': '+e.message); } }
      wps.forEach(w=>{ const get=byPath.get(w.path); if(get) wss.push({name:w.name,path:w.path,load:async()=>JSON.parse(await get())}); });
    }
    LIBWS.set(src.sid,wss);
    await PK.presetsFromSource(src,prs,errs);
    const nsk=await PK.skinsFromSource(src,skl,ski,errs), skOnly=src.only==='skins';
    PK.SRCLAYOUT.set(src.sid,{has:!!layout,folders:null});
    if(layout){ try{ const L=await layout(); const r=PK.applyLayout(L,src,false); if(r) layoutNote=r; }catch(e){ errs.push(PK.LAYOUT_FILE+': '+e.message); } }
    try{ await loadDirIcons(src,iconFind); }catch(e){}
    try{ await PK.loadDevIcons(src,iconFind); }catch(e){}
    SRCSTATE.set(src.sid,{state:errs.length&&!(skOnly?nsk:n)?'err':errs.length||(skOnly&&!nsk)?'warn':'ok',n,msg:(skOnly?(nsk?PK.pktp('m.sk_n_skins',nsk===1,nsk):PK.pkt('m.sk_geen_gevonden')):PK.pktp('m.n_apparaat',n===1,n)+(nsk?' · '+PK.pktp('m.sk_n_skins',nsk===1,nsk):''))+(wss.length?PK.pktp('m.werkruimtes_werkruimte',wss.length>1,wss.length):'')+(prs.length?PK.pktp('m.presetbibliotheken_presetbibliotheek',prs.length>1,prs.length):'')+(cached?PK.pkt('m.uit_eerder_opgehaalde_kopie',cached):'')+(layoutNote?' · '+layoutNote:'')+(skipped?PK.pktp('m.bestanden_overgeslagen_bestand_overgeslagen',skipped>1,skipped):'')+(errs.length?PK.pktp('m.fouten_fout',errs.length>1,errs.length):''),errs});
  }catch(e){ SRCSTATE.set(src.sid,{state:'err',msg:e.message,errs:[e.message]}); errs.push(e.message); }
  saveSources(); PK.paintLib(); PK.paintIcons(); PK.refreshVersionSelects(); paintSources(); if(!PK.$('wsPanel').hidden) PK.paintPatches(); return {n,errs}; } PK.loadSource=loadSource;

// ---- lokale map: File System Access waar het kan (blijft onthouden), anders een mapkiezer die je opnieuw doet ----
const DIRFILES=new Map(); PK.DIRFILES=DIRFILES;   // sid -> Map(path -> File), voor mappen zonder blijvende handle (deze sessie)
async function walkDir(h,prefix,out,depth){ for await (const [name,e] of h.entries()){ if(name.startsWith('.')||name==='node_modules') continue; const pth=prefix+name;
  if(e.kind==='file') out.push([pth,async()=>(await e.getFile()).text(),()=>e.getFile()]); else if(depth<3) await walkDir(e,pth+'/',out,depth+1); } return out; }
async function dirHandle(src,interactive){ const h=await PK.IDB.get('dir:'+src.sid); if(!h||!h.queryPermission) return null;
  let st=await h.queryPermission({mode:'read'}); if(st==='granted') return h;
  if(!interactive) return null;
  try{ st=await h.requestPermission({mode:'read'}); }catch(e){ st='prompt'; }
  if(st==='granted') return h;
  if(await PK.askUser(PK.pkt('m.de_map_heeft_opnieuw_toestemming',PK.esc(src.label)),PK.pkt('m.toestaan'),PK.pkt('m.overslaan'))){ try{ st=await h.requestPermission({mode:'read'}); }catch(e){} }
  return st==='granted'?h:null; }
async function folderFiles(src,opts){
  const h=await dirHandle(src,!!opts.interactive); if(h) return walkDir(h,'',[],0);
  const mem=DIRFILES.get(src.sid), asList=m=>[...m.entries()].map(([p,f])=>[p,()=>f.text(),()=>f]);
  // zonder blijvende toegang is mem een vaste momentopname: bij Scannen (fresh) vragen we de map opnieuw
  if(mem&&!(opts.fresh&&opts.interactive)) return asList(mem);
  if(!opts.interactive) return null;
  const picked=await pickFolder(PK.pkt(mem?'m.kies_de_map_opnieuw_om_te_scannen':'m.kies_de_map_om_de',PK.esc(src.label))); if(!picked) return mem?asList(mem):null;
  if(picked.handle){ await PK.IDB.set('dir:'+src.sid,picked.handle); return walkDir(picked.handle,'',[],0); }
  DIRFILES.set(src.sid,picked.files); return [...picked.files.entries()].map(([p,f])=>[p,()=>f.text(),()=>f]); } PK.folderFiles=folderFiles;
// kies een map; geeft {handle,name} of {files:Map,name}
async function pickFolder(question){
  if(question&&!(await PK.askUser(question,PK.pkt('m.map_kiezen'),PK.pkt('m.overslaan')))) return null;
  if(window.showDirectoryPicker){ try{ const h=await window.showDirectoryPicker({id:'patchkamer-bron',mode:'read'}); return {handle:h,name:h.name}; }catch(e){ if(e&&e.name==='AbortError') return null; } }
  return new Promise(res=>{ const inp=PK.$('srcDirInput'); inp.value=''; const on=()=>{ inp.removeEventListener('change',on); const fs=[...inp.files]; if(!fs.length) return res(null);
    const root=(fs[0].webkitRelativePath||fs[0].name).split('/')[0]; const m=new Map(); fs.forEach(f=>{ const rp=(f.webkitRelativePath||f.name).split('/').slice(1).join('/')||f.name; m.set(rp,f); }); res({files:m,name:root}); };
    inp.addEventListener('change',on); inp.click(); }); } PK.pickFolder=pickFolder;

async function addSource(src){ const same=PK.SOURCES.find(x=>x.kind===src.kind&&(src.kind==='folder'?x.label===src.label&&!src._handle:(x.url||'')===(src.url||'')&&(x.owner||'')===(src.owner||'')&&(x.repo||'')===(src.repo||'')&&(x.path||'')===(src.path||'')&&(!src.ref||x.ref===src.ref)));
  if(same&&src.kind!=='folder'){ PK.status(PK.pkt('m.deze_bron_staat_er_al')); return loadSource(same,{interactive:true}); }
  PK.SOURCES.push(src); saveSources(); const r=await loadSource(src,{interactive:true}); PK.status(`${srcLabel(src)}: ${SRCSTATE.get(src.sid)?.msg||''}`,!!(r&&r.errs&&r.errs.length&&!r.n)); return r; } PK.addSource=addSource;
function paintSources(){ const box=PK.$('srcList'); if(!box) return; box.innerHTML='';
  if(!PK.SOURCES.length){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.nog_geen_bronnen_de_ingebouwde'); box.appendChild(e); return; }
  PK.SOURCES.forEach(src=>{ const st=SRCSTATE.get(src.sid)||{state:'',msg:src.kind==='folder'?PK.pkt('m.nog_niet_verbonden'):PK.pkt('m.nog_niet_geladen')};
    const it=document.createElement('div'); it.className='srcitem'+(st.state==='warn'?' warn':st.state==='err'?' err':'');
    const kind={github:'GitHub',url:'URL',folder:PK.pkt('m.map')}[src.kind]||src.kind; const info=document.createElement('div'); info.style.minWidth='0';
    info.innerHTML=`<span class="nm"><span class="kind">${kind}</span>${PK.esc(src.label||'')}</span><small title="${PK.esc((st.errs||[]).join('\n'))}">${PK.esc(st.msg||'')}</small>`;
    const b=document.createElement('div'); b.className='b';
    const rl=document.createElement('button'); rl.className='small'; rl.textContent=st.state==='warn'&&src.kind==='folder'&&!st.n?PK.pkt('m.verbinden'):PK.pkt('m.scannen'); rl.title=PK.pkt('m.opnieuw_inlezen_nieuwe_en_gewijzigde'); rl.onclick=()=>PK.rescanSource(src,true);
    const rm=document.createElement('button'); rm.className='small'; rm.textContent='×'; rm.title=PK.pkt('m.bron_vergeten_geladen_apparaten_blijven');
    rm.onclick=()=>{ if(rm.dataset.arm){ PK.SOURCES=PK.SOURCES.filter(x=>x!==src); saveSources(); PK.IDB.del('dir:'+src.sid); SRCSTATE.delete(src.sid); paintSources(); } else { rm.dataset.arm='1'; rm.textContent=PK.pkt('m.vergeten'); setTimeout(()=>{ if(rm.isConnected){ rm.dataset.arm=''; rm.textContent='×'; } },2500); } };
    b.append(rl,rm); it.append(info,b); box.appendChild(it); }); } PK.paintSources=paintSources;
})(window.__PK);
