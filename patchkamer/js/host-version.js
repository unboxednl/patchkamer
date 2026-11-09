// js/host-version.js — versiecontrole van de host tegen GitHub bij het opstarten
(function(PK){
// ---------- bij het opstarten: staat er een andere versie van Patchkamer op GitHub? ----------
// Vergelijkt de git-blob-hashes van alle eigen bestanden die de pagina laadt (de pagina zelf en de css/-, i18n/- en js/-bestanden uit de DOM; zoals de server ze levert, regeleinden genormaliseerd) met die van main op GitHub, in één aanroep (git trees API voor de map patchkamer/). Alleen bij http(s); een bestand dat je via file:// opent kan zichzelf niet lezen.
const HOSTCHK={repo:'unboxednl/patchkamer',path:'patchkamer',page:'patchkamer.html',ref:'main',key:'patchkamerHostSeen'};
async function gitBlobSha(buf){ const txt=new TextDecoder().decode(buf).replace(/\r\n/g,'\n'), body=new TextEncoder().encode(txt), head=new TextEncoder().encode('blob '+body.length+'\0'), all=new Uint8Array(head.length+body.length); all.set(head); all.set(body,head.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1',all))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function showHostUpdate(sha,urls){ if(PK.$('pkHostUpdate')) return; const b=document.createElement('div'); b.id='pkHostUpdate'; b.setAttribute('role','status');
  b.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;max-width:420px;padding:12px 14px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);box-shadow:0 6px 24px rgba(0,0,0,.35);font-size:13px;line-height:1.45';
  const t=document.createElement('div'); t.textContent=PK.pkt('m.host_andere_versie'); const row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
  const a=document.createElement('a'); a.href=`https://github.com/${HOSTCHK.repo}/commits/${HOSTCHK.ref}/${HOSTCHK.path}`; a.target='_blank'; a.rel='noopener'; a.textContent=PK.pkt('m.host_bekijken'); a.className='small'; a.style.cssText='padding:4px 10px;border:1px solid var(--line);border-radius:6px;color:inherit;text-decoration:none';
  const later=document.createElement('button'); later.className='small'; later.type='button'; later.textContent=PK.pkt('m.host_later'); later.onclick=()=>b.remove();
  const never=document.createElement('button'); never.className='small'; never.type='button'; never.textContent=PK.pkt('m.host_niet_meer'); never.onclick=()=>{ try{ localStorage.setItem(HOSTCHK.key,sha); }catch(e){} b.remove(); };
  const load=document.createElement('button'); load.className='small'; load.type='button'; load.textContent=PK.pkt('m.host_laad'); /* fetch every own file past the browser cache, then reload, so the newest version is what starts */
  load.onclick=async()=>{ load.disabled=true; load.textContent=PK.pkt('m.host_laden'); try{ /* clear what the browser keeps for Patchkamer: Cache Storage, service workers, then every own file past the HTTP cache (also files that load later, such as vendor/ and icons/) */
    try{ if(window.caches){ for(const k of await caches.keys()) await caches.delete(k); } }catch(e){}
    try{ if(navigator.serviceWorker){ for(const g of await navigator.serviceWorker.getRegistrations()) await g.unregister(); } }catch(e){}
    await Promise.all((urls||[]).map(u=>fetch(u,{cache:'reload'}).catch(()=>null))); }catch(e){} location.reload(); };
  row.append(load,a,later,never); b.append(t,row); document.body.appendChild(b); }
async function checkHostVersion(){ try{ if(window.pkNative) return; /* the app has its own check (Settings > Version) and serves a page with one extra script tag */ if(!/^https?:$/.test(location.protocol)||!(window.crypto&&crypto.subtle)||navigator.onLine===false) return;
  const pageUrl=location.href.split('#')[0].split('?')[0], base=new URL('.',pageUrl).href;
  const own=[...new Set([pageUrl,...[...document.querySelectorAll('link[rel=stylesheet][href],script[src]')].map(e=>new URL(e.getAttribute('href')||e.getAttribute('src'),pageUrl).href)])].filter(u=>u===pageUrl||u.startsWith(base));
  const [mine,remote]=await Promise.all([Promise.all(own.map(u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.arrayBuffer():null))), PK.fetchJSON(`https://api.github.com/repos/${HOSTCHK.repo}/git/trees/${HOSTCHK.ref}:${HOSTCHK.path}?recursive=1`)]);
  if(mine.includes(null)||!remote||!Array.isArray(remote.tree)||remote.truncated) return;
  const rel=u=>u===pageUrl?HOSTCHK.page:decodeURIComponent(u.slice(base.length)), sha=new Map(remote.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
  const names=own.map(rel), hashes=await Promise.all(mine.map(gitBlobSha)), all=a=>gitBlobSha(new TextEncoder().encode(a.join('\n')));
  const own1=await all(names.map((n,i)=>n+':'+hashes[i])), rem=await all(names.map(n=>n+':'+(sha.get(n)||''))); if(own1===rem) return;
  let seen=''; try{ seen=localStorage.getItem(HOSTCHK.key)||''; }catch(e){} if(seen===rem) return; const more=remote.tree.filter(x=>x.type==='blob'&&!/\.(md|txt)$/i.test(x.path)&&!/^LICENSE/.test(x.path)).map(x=>new URL(x.path.split('/').map(encodeURIComponent).join('/'),base).href); showHostUpdate(rem,[...new Set([...own,...more,new URL('version.json',base).href])]); }catch(e){} } PK.checkHostVersion=checkHostVersion;
// ---------- Instellingen > Versie: het nummer van deze host; in de app ook dat van de app en de nieuwste uitgave op GitHub ----------
const VERREL='unboxednl/patchkamer';
const okVer=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);
function cmpVer(a,b){ const x=a.split('.').map(Number), y=b.split('.').map(Number); for(let i=0;i<3;i++){ const d=x[i]-y[i]; if(d) return d>0?1:-1; } return 0; }
async function initVersion(){
  const panel=PK.$('setPanel'), inner=panel&&panel.querySelector(':scope > div'); if(!inner||PK.$('pkVersion')) return;
  const box=document.createElement('div'); box.id='pkVersion';
  const h=document.createElement('h3'); h.style.marginTop='12px'; h.textContent=PK.pkt('m.ver_titel');
  const row=()=>{ const d=document.createElement('div'); d.className='note'; return d; }; /* same look as the lines under Contract & setup */
  const rHost=row(), rApp=row(), rNew=row(), rLog=row();
  const link=(href,txt)=>{ const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener'; a.textContent=txt; return a; };
  rLog.append(link(`https://github.com/${VERREL}/blob/main/${PK.PK_LANG==='nl'?'CHANGELOG_NL.md':'CHANGELOG.md'}`,PK.pkt('m.ver_changelog')));
  rHost.textContent=PK.pkt('m.ver_host','…'); const nat=window.pkNative&&window.pkNative.app;
  box.append(h,rHost); if(nat) box.append(rApp,rNew); box.append(rLog);
  const after=PK.$('wipeBtn'), anchor=after&&after.parentElement&&after.parentElement.nextElementSibling; /* between Browser storage and Contract & setup */
  if(anchor&&anchor.parentElement) anchor.parentElement.insertBefore(box,anchor); else inner.append(box);
  let hv='–'; try{ const r=await fetch('version.json',{cache:'no-cache'}); if(r.ok){ const j=await r.json(); if(okVer(j.version)) hv=j.version; } }catch(e){}
  rHost.textContent=PK.pkt('m.ver_host',hv);
  if(!nat) return;
  const av=okVer(nat.version)?nat.version:'–'; rApp.textContent=PK.pkt('m.ver_app',av); rNew.textContent=PK.pkt('m.ver_zoeken');
  try{ const j=await PK.fetchJSON(`https://api.github.com/repos/${VERREL}/releases/latest`), nv=String(j.tag_name||'').replace(/^v/,'');
    if(!okVer(nv)) throw new Error('tag'); rNew.textContent=PK.pkt('m.ver_nieuwste',nv)+' · ';
    if(okVer(av)&&cmpVer(nv,av)<=0) rNew.append(PK.pkt('m.ver_actueel'));
    else { const u=String(j.html_url||''); rNew.append(PK.pkt('m.ver_nieuwer')+' '); if(u.startsWith('https://github.com/')) rNew.append(link(u,PK.pkt('m.ver_download'))); }
  }catch(e){ rNew.textContent=PK.pkt('m.ver_onbekend'); }
}
(function(){ const b=PK.$('setBtn'); if(b) b.addEventListener('click',initVersion,{once:true}); })();
})(window.__PK);
