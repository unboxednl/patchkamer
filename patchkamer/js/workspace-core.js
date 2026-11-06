// js/workspace-core.js — werkruimtenaam, kleine IndexedDB-opslag, vraagdialoog
(function(PK){
const pkIsUntitled=n=>Object.values(PK.I18N).some(d=>d['m.naamloos']===String(n||'').trim());
function setName(n){ PK.WS.name=(pkIsUntitled(n)?'':String(n||'').trim()).slice(0,60)||PK.pkt('m.naamloos'); PK.$('wsName').value=PK.WS.name; if(typeof PK.wslPaint==='function') PK.wslPaint(); PK.$('wsNameEcho').textContent=PK.WS.name; document.title=PK.WS.name+' · Patchkamer'; } PK.setName=setName;

// ---- kleine IndexedDB-opslag: maphandles en de laatst opgehaalde code per adres (werkt dan ook offline) ----
const IDB={ p:null,
  open(){ return this.p||(this.p=new Promise((res,rej)=>{ const r=indexedDB.open('patchkamer',1); r.onupgradeneeded=()=>r.result.createObjectStore('kv'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); })); },
  async get(k){ try{ const db=await this.open(); return await new Promise((res,rej)=>{ const q=db.transaction('kv').objectStore('kv').get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); }catch(e){ return undefined; } },
  async set(k,v){ try{ const db=await this.open(); await new Promise((res,rej)=>{ const t=db.transaction('kv','readwrite'); t.objectStore('kv').put(v,k); t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); }); return true; }catch(e){ return false; } },
  async del(k){ try{ const db=await this.open(); await new Promise(res=>{ const t=db.transaction('kv','readwrite'); t.objectStore('kv').delete(k); t.oncomplete=()=>res(); t.onerror=()=>res(); }); }catch(e){} } }; PK.IDB=IDB;

// ---- een eenvoudige vraag aan de gebruiker (geen alert/confirm: die blokkeren de pagina) ----
function askUser(html,okLabel,cancelLabel){ return new Promise(res=>{ const m=document.createElement('div'); m.className='pkmodal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
  m.innerHTML=`<div class="box"><div>${html}</div><div class="wsrow"><button class="small" data-a="0">${PK.esc(cancelLabel||PK.pkt('m.overslaan'))}</button><button class="small" data-a="1" style="border-color:var(--audio)">${PK.esc(okLabel||'Ja')}</button></div></div>`;
  const done=v=>{ m.remove(); document.removeEventListener('keydown',key,true); res(v); }; const key=e=>{ if(e.key==='Escape'){ e.stopPropagation(); done(false); } };
  m.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) done(b.dataset.a==='1'); else if(e.target===m) done(false); }); document.addEventListener('keydown',key,true);
  document.body.appendChild(m); m.querySelector('[data-a="1"]').focus(); }); } PK.askUser=askUser;
})(window.__PK);
