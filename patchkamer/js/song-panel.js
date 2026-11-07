// js/song-panel.js — tab Songs van het bibliotheekvenster: demos en recente songs
(function(PK){
/* =====================================================================
   SONGS · tab Songs in de bibliotheek: demo's van GitHub en recente songs. Een song opent in een nieuwe werkruimte-tab en de apparaten worden daarna herschikt.
   ===================================================================== */
const SONG_ADDR_KEY='patchkamerSongsAddr', SONG_ADDR_DEF='github.com/unboxednl/patchkamer/tree/main/songs', SONGREC_MAX=12, SONG_MAXBYTES=4000000; PK.SONG_ADDR_KEY=SONG_ADDR_KEY; PK.SONG_ADDR_DEF=SONG_ADDR_DEF; PK.SONGREC_MAX=SONGREC_MAX;
PK.SONGREC=[], PK.SONG_DEMO=null, PK.SONG_DEMO_ERR='', PK.SONG_BUSY=false;
function songAddr(){ let a=''; try{ a=localStorage.getItem(SONG_ADDR_KEY)||''; }catch(e){} return a.trim()||SONG_ADDR_DEF; } PK.songAddr=songAddr;
function songRecSave(){ PK.IDB.set('songs:recent',PK.SONGREC); }
function songRecAdd(e){ PK.SONGREC=[e,...PK.SONGREC.filter(x=>x.key!==e.key)].slice(0,SONGREC_MAX); songRecSave(); }
function songTitleOf(o){ return String((o&&(o.title||(o.workspace&&o.workspace.name)||o.name))||PK.pkt('m.naamloos')).slice(0,80); }
function songDevicesOf(o){ const w=o&&o.format==='patchkamer-song'?o.workspace:o; return w&&Array.isArray(w.devices)?w.devices:null; }
async function songOpen(obj,meta){   // obj = song of werkruimte (geparsed); meta = {key,url?,name?,text?}
  if(PK.SONG_BUSY) return false; const devs=songDevicesOf(obj); if(!devs){ PK.status(PK.pkt('m.songs_ongeldig'),true); return false; }
  if(typeof PK.WSL==='undefined'||!PK.WSL.ready){ PK.status(PK.pkt('m.songs_ongeldig'),true); return false; }
  if(PK.WSL.slots.length>=PK.WSL_MAX){ PK.status(PK.pkt('m.songs_vol'),true); return false; }
  PK.SONG_BUSY=true;
  try{ if(devs.some(d=>!PK.Host.latest(d.def))){ PK.status(PK.pkt('m.songs_bibliotheek_laden')); try{ await PK.wsaLoad('dev',false); }catch(e){} }
    await PK.wslAdd(); const ok=await PK.openWorkspace(obj);
    if(ok){ songRecAdd({key:meta.key,title:songTitleOf(obj),author:String((obj&&obj.author)||'').slice(0,60),t:Date.now(),url:meta.url||'',name:meta.name||'',text:meta.text&&meta.text.length<=SONG_MAXBYTES?meta.text:''});
      setTimeout(()=>{ try{ if(PK.Host.devices.size) PK.$('arrange').click(); }catch(e){} },1300); closeSongs(); }
    return ok; }
  catch(e){ PK.status(PK.pkt('m.songs_openen_mislukt',e.message),true); return false; }
  finally{ PK.SONG_BUSY=false; } } PK.songOpen=songOpen;
async function songOpenUrl(url,name){ try{ const x=await fetch(url); if(!x.ok) throw new Error('HTTP '+x.status); const text=await x.text(); return songOpen(JSON.parse(text),{key:url,url,name}); }catch(e){ PK.status(PK.pkt('m.songs_openen_mislukt',e.message),true); return false; } }
async function songDemoLoad(force){ PK.SONG_DEMO_ERR=''; try{ let p=null; try{ p=PK.parseSourceUrl(songAddr()); }catch(e){} if(!p||p.kind!=='github') throw new Error(PK.pkt('m.geen_geldig_adres'));
    if(!p.ref){ const j=await PK.fetchJSON(`https://api.github.com/repos/${p.owner}/${p.repo}`); p.ref=j.default_branch||'main'; }
    if(force) PK.PKAI_TREE.delete(p.owner+'/'+p.repo+'@'+p.ref);
    const t=await PK.pkAiTree({owner:p.owner,repo:p.repo,ref:p.ref}), base=p.path?p.path.replace(/\/$/,'')+'/':'';
    PK.SONG_DEMO=(t.tree||[]).filter(n=>n.type==='blob'&&n.path.startsWith(base)&&/\.patchkamer(-song)?\.json$/i.test(n.path)).map(n=>({path:n.path,url:`https://raw.githubusercontent.com/${p.owner}/${p.repo}/${p.ref}/${n.path.split('/').map(encodeURIComponent).join('/')}`,dir:n.path.slice(base.length).split('/').slice(0,-1),name:PK.wsNameOf(n.path).replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())})).sort((a,b)=>a.name.localeCompare(b.name)); }
  catch(e){ PK.SONG_DEMO=[]; PK.SONG_DEMO_ERR=e.message; } songPaint(); } PK.songDemoLoad=songDemoLoad;
function songPaint(){
  const rec=PK.$('songRecent'), demo=PK.$('songDemo'); rec.innerHTML=''; demo.innerHTML=''; const q=((PK.$('songSearch')||{}).value||'').trim().toLowerCase(), hit=(...t)=>!q||t.join(' ').toLowerCase().includes(q); const lang=(typeof PK.PK_LANG!=='undefined'&&PK.PK_LANG)||'en';
  const item=(title,sub,btns)=>{ const it=document.createElement('div'); it.className='wsitem'; const info=document.createElement('div'); info.style.minWidth='0'; info.innerHTML=`<span class="nm">${PK.esc(title)}</span><small>${PK.esc(sub)}</small>`; const b=document.createElement('div'); b.className='b'; btns.forEach(x=>b.appendChild(x)); it.append(info,b); return it; };
  const btn=(label,title,fn)=>{ const x=document.createElement('button'); x.className='small'; x.textContent=label; if(title) x.title=title; x.onclick=fn; return x; };
  if(!PK.SONGREC.length){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.songs_geen_recent'); rec.appendChild(e); }
  PK.SONGREC.filter(r=>hit(r.title,r.author)).forEach(r=>{ const sub=[r.author,new Date(r.t).toLocaleString(lang)].filter(Boolean).join(' · ');
    const open=btn(PK.pkt('m.openen'),'',async()=>{ if(r.url){ await songOpenUrl(r.url,r.name); } else if(r.text){ try{ await songOpen(JSON.parse(r.text),{key:r.key,name:r.name,text:r.text}); }catch(e){ PK.status(PK.pkt('m.songs_openen_mislukt',e.message),true); } } else PK.status(PK.pkt('m.songs_bestand_opnieuw'),true); });
    const rm=btn('×',PK.pkt('m.songs_verwijder'),()=>{ PK.SONGREC=PK.SONGREC.filter(x=>x!==r); songRecSave(); songPaint(); });
    rec.appendChild(item(r.title,sub||(r.url?'GitHub':''),[open,rm])); });
  if(PK.SONG_DEMO===null){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.songs_laden'); demo.appendChild(e); }
  else if(PK.SONG_DEMO_ERR){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.songs_ophalen_mislukt',PK.SONG_DEMO_ERR); demo.appendChild(e); }
  else if(!PK.SONG_DEMO.length){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.songs_geen_demos'); demo.appendChild(e); }
  // demo's: songs in de hoofdmap eerst, daarna een boom met inspringen per map (songs/hip-hop/…); bij zoeken staat alles open
  { const tree={kids:new Map(),songs:[]}; (PK.SONG_DEMO||[]).filter(d=>hit(d.name,d.path)).forEach(d=>{ let n=tree; (d.dir||[]).forEach(g=>{ if(!n.kids.has(g)) n.kids.set(g,{kids:new Map(),songs:[]}); n=n.kids.get(g); }); n.songs.push(d); });
    const count=n=>n.songs.length+[...n.kids.values()].reduce((a,k)=>a+count(k),0), dictL=(PK.I18N&&PK.I18N[PK.PK_LANG])||{};
    const label=g=>dictL['m.tag_style_'+g.replace(/-/g,'_')]||dictL['m.tag_style_'+g.replace(/-/g,'')]||g.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
    const paint=(n,depth,key)=>{ n.songs.forEach(d=>{ const it=item(d.name,d.path,[btn(PK.pkt('m.openen'),'',()=>songOpenUrl(d.url,d.name))]); if(depth) it.style.paddingLeft=(depth*14)+'px'; demo.appendChild(it); });
      [...n.kids.entries()].sort((a,b)=>label(a[0]).localeCompare(label(b[0]),lang)).forEach(([g,k])=>{ const kk=key+'/'+g, open=!!q||PK.prOpen.has(kk); const h=document.createElement('div'); h.className='wsitem'; h.style.paddingLeft=(depth*14)+'px'; h.style.cursor='pointer';
        const nm=document.createElement('span'); nm.className='nm'; nm.textContent=(open?'▾ ':'▸ ')+label(g); const c=document.createElement('small'); c.textContent=' '+count(k); nm.appendChild(c); h.appendChild(nm);
        h.onclick=()=>{ open?PK.prOpen.delete(kk):PK.prOpen.add(kk); songPaint(); }; demo.appendChild(h); if(open) paint(k,depth+1,kk); }); };
    paint(tree,0,'sg'); }
  if(q&&!rec.querySelector('.wsitem')&&!demo.querySelector('.wsitem')&&(PK.SONGREC.length||(PK.SONG_DEMO||[]).length)){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.songs_niets_gevonden',PK.$('songSearch').value.trim()); rec.appendChild(e); } } PK.songPaint=songPaint;
function songShow(){ songPaint(); if(PK.SONG_DEMO===null) songDemoLoad(false); } PK.songShow=songShow;
function openSongs(){ PK.libOpen('songs'); } PK.openSongs=openSongs;
// na het openen van een song: op een telefoon de lade sluiten, op een computer blijft het venster staan
function closeSongs(){ if(PK.libTab()==='songs'&&PK.isSheet()) PK.libClose(); } PK.closeSongs=closeSongs;
// een song- of werkruimtebestand openen in een nieuwe werkruimte-tab (bestandskiezer in het songs-paneel en bestanden die op het canvas worden losgelaten); quiet: geen eigen foutmelding bij een onleesbaar bestand
async function songOpenFile(f,quiet){ let text, obj; try{ text=await f.text(); obj=JSON.parse(text); }catch(err){ if(!quiet) PK.status(PK.pkt('m.dit_bestand_is_geen_leesbare'),true); return false; }
  if(!obj.name&&obj.format!=='patchkamer-song') obj.name=f.name.replace(/\.patchkamer\.json$|\.json$/i,''); return songOpen(obj,{key:'file:'+f.name+':'+f.size,name:f.name,text}); } PK.songOpenFile=songOpenFile;
})(window.__PK);
