// js/host-version.js — versiecontrole van de host tegen GitHub bij het opstarten
(function(PK){
// ---------- bij het opstarten: staat er een andere versie van Patchkamer op GitHub? ----------
// Vergelijkt de git-blob-hashes van alle eigen bestanden die de pagina laadt (de pagina zelf en de css/-, i18n/- en js/-bestanden uit de DOM; zoals de server ze levert, regeleinden genormaliseerd) met die van main op GitHub, in één aanroep (git trees API voor de map patchkamer/). Alleen bij http(s); een bestand dat je via file:// opent kan zichzelf niet lezen.
const HOSTCHK={repo:'unboxednl/patchkamer',path:'patchkamer',page:'patchkamer.html',ref:'main',key:'patchkamerHostSeen'};
async function gitBlobSha(buf){ const txt=new TextDecoder().decode(buf).replace(/\r\n/g,'\n'), body=new TextEncoder().encode(txt), head=new TextEncoder().encode('blob '+body.length+'\0'), all=new Uint8Array(head.length+body.length); all.set(head); all.set(body,head.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1',all))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function showHostUpdate(sha){ if(PK.$('pkHostUpdate')) return; const b=document.createElement('div'); b.id='pkHostUpdate'; b.setAttribute('role','status');
  b.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;max-width:420px;padding:12px 14px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);box-shadow:0 6px 24px rgba(0,0,0,.35);font-size:13px;line-height:1.45';
  const t=document.createElement('div'); t.textContent=PK.pkt('m.host_andere_versie'); const row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
  const a=document.createElement('a'); a.href=`https://github.com/${HOSTCHK.repo}/commits/${HOSTCHK.ref}/${HOSTCHK.path}`; a.target='_blank'; a.rel='noopener'; a.textContent=PK.pkt('m.host_bekijken'); a.className='small'; a.style.cssText='padding:4px 10px;border:1px solid var(--line);border-radius:6px;color:inherit;text-decoration:none';
  const later=document.createElement('button'); later.className='small'; later.type='button'; later.textContent=PK.pkt('m.host_later'); later.onclick=()=>b.remove();
  const never=document.createElement('button'); never.className='small'; never.type='button'; never.textContent=PK.pkt('m.host_niet_meer'); never.onclick=()=>{ try{ localStorage.setItem(HOSTCHK.key,sha); }catch(e){} b.remove(); };
  row.append(a,later,never); b.append(t,row); document.body.appendChild(b); }
async function checkHostVersion(){ try{ if(!/^https?:$/.test(location.protocol)||!(window.crypto&&crypto.subtle)||navigator.onLine===false) return;
  const pageUrl=location.href.split('#')[0].split('?')[0], base=new URL('.',pageUrl).href;
  const own=[...new Set([pageUrl,...[...document.querySelectorAll('link[rel=stylesheet][href],script[src]')].map(e=>new URL(e.getAttribute('href')||e.getAttribute('src'),pageUrl).href)])].filter(u=>u===pageUrl||u.startsWith(base));
  const [mine,remote]=await Promise.all([Promise.all(own.map(u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.arrayBuffer():null))), PK.fetchJSON(`https://api.github.com/repos/${HOSTCHK.repo}/git/trees/${HOSTCHK.ref}:${HOSTCHK.path}?recursive=1`)]);
  if(mine.includes(null)||!remote||!Array.isArray(remote.tree)||remote.truncated) return;
  const rel=u=>u===pageUrl?HOSTCHK.page:decodeURIComponent(u.slice(base.length)), sha=new Map(remote.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
  const names=own.map(rel), hashes=await Promise.all(mine.map(gitBlobSha)), all=a=>gitBlobSha(new TextEncoder().encode(a.join('\n')));
  const own1=await all(names.map((n,i)=>n+':'+hashes[i])), rem=await all(names.map(n=>n+':'+(sha.get(n)||''))); if(own1===rem) return;
  let seen=''; try{ seen=localStorage.getItem(HOSTCHK.key)||''; }catch(e){} if(seen===rem) return; showHostUpdate(rem); }catch(e){} } PK.checkHostVersion=checkHostVersion;
})(window.__PK);
