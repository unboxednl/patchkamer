// js/manual.js — handleiding-venster: de handleiding van een apparaat (uit de docs-map op GitHub) in een zwevend venster binnen de host
(function(PK){
/* =====================================================================
   HANDLEIDING · menu achter het icoon op de kaartbalk > Handleiding. Het venster haalt docs/<soort>/USER-MANUAL_<NL|EN>.md van GitHub (raw), zoekt de kop met de
   naam van het apparaat (kop van niveau 2 tot 4) en toont alleen dat deel, met de plaatjes erbij; "Hele handleiding" toont het hele bestand.
   De taal volgt de taal van de host; ontbreekt die (of de kop), dan Engels. Lukt GitHub niet (offline), dan het bestand naast de host (../docs/...).
   Markdown wordt hier zelf omgezet naar DOM (alleen tekstknopen, nooit innerHTML), dus een handleiding kan geen script uitvoeren.
   Alleen wat de handleidingen gebruiken: koppen, alinea's, lijsten, tabellen, codeblokken, citaten, streep, vet, cursief, code, links en plaatjes.
   ===================================================================== */
const REPO={owner:'unboxednl',repo:'patchkamer',ref:'main'};
const ALL=['synths','drums','samplers','sequencers','effects','mastering','mixer','modulators','tools'];
const CATDIR={synth:'synths',groove:'drums',sequencer:'sequencers',mod:'modulators',effect:'effects',mix:'mixer',tool:'tools',mastering:'mastering'};
const CACHE=new Map();   // url -> Promise<{text,base}>
let W=null;               // het venster
// ---- ophalen ----
const rawUrl=p=>`https://raw.githubusercontent.com/${REPO.owner}/${REPO.repo}/${REPO.ref}/${p}`;
function localUrl(p){ try{ return new URL('../'+p,location.href).href; }catch(e){ return ''; } }
function fetchManual(folder,lang){ const p=`docs/${folder}/USER-MANUAL_${lang.toUpperCase()}.md`, key=folder+'|'+lang;
  if(!CACHE.has(key)) CACHE.set(key,(async()=>{ let err=null;
    for(const [u,base] of [[rawUrl(p),rawUrl('docs/'+folder+'/')],[localUrl(p),localUrl('docs/'+folder+'/')]]){ if(!u) continue;
      try{ const r=await fetch(u); if(!r.ok){ err=new Error('HTTP '+r.status); continue; } return {text:await r.text(),base}; }catch(e){ err=e; } }
    throw err||new Error('fetch'); })().catch(e=>{ CACHE.delete(key); throw e; }));
  return CACHE.get(key); }
// ---- markdown: blokken ----
const slug=t=>String(t).toLowerCase().replace(/<[^>]*>/g,'').replace(/[`*_]/g,'').trim().replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,'-');
function headings(lines){ const out=[]; let fence=false; lines.forEach((l,i)=>{ if(/^```/.test(l)) fence=!fence; if(fence) return; const m=/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l); if(m) out.push({i,level:m[1].length,text:m[2].replace(/[`*_]/g,'').trim()}); }); return out; }
// het deel van de kop met deze naam tot de volgende kop van gelijk of hoger niveau; null als hij er niet is
function section(text,names){ const lines=text.replace(/<!--[\s\S]*?-->/g,'').split('\n'), hs=headings(lines), want=names.filter(Boolean).map(n=>n.toLowerCase());
  const h=hs.find(x=>x.level>=2&&x.level<=4&&want.includes(x.text.toLowerCase())); if(!h) return null;
  const next=hs.find(x=>x.i>h.i&&x.level<=h.level); return lines.slice(h.i,next?next.i:lines.length).join('\n'); }
function inline(parent,s,ctx){ // **vet**, *cursief*, `code`, [tekst](url), ![alt](url), <https://…>
  const re=/(`+)([\s\S]*?[^`])\1(?!`)|!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<(https?:\/\/[^>\s]+)>|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([^\s*][\s\S]*?)\*(?!\*)|(?<![\p{L}\p{N}])_([^\s_][\s\S]*?)_(?![\p{L}\p{N}])/gu; let last=0, m;
  const text=t=>{ if(t) parent.appendChild(document.createTextNode(t)); };
  while((m=re.exec(s))){ text(s.slice(last,m.index)); last=re.lastIndex;
    if(m[1]){ const c=document.createElement('code'); c.textContent=m[2].trim(); parent.appendChild(c); }
    else if(m[4]!==undefined){ const im=document.createElement('img'); im.alt=m[3]; im.loading='lazy'; im.src=resolve(m[4],ctx); parent.appendChild(im); }
    else if(m[6]!==undefined){ const a=document.createElement('a'); inline(a,m[5],ctx); link(a,m[6],ctx); parent.appendChild(a); }
    else if(m[7]){ const a=document.createElement('a'); a.textContent=m[7]; link(a,m[7],ctx); parent.appendChild(a); }
    else if(m[8]!==undefined||m[9]!==undefined){ const b=document.createElement('strong'); inline(b,m[8]??m[9],ctx); parent.appendChild(b); }
    else { const e=document.createElement('em'); inline(e,m[10]??m[11],ctx); parent.appendChild(e); } }
  text(s.slice(last)); }
function resolve(u,ctx){ try{ return new URL(u,ctx.base).href; }catch(e){ return u; } }
// een link: http(s) opent in een nieuw tabblad, #anker scrolt in het venster, een ander .md-bestand uit docs/ opent in hetzelfde venster, de rest is gewone tekst
function link(a,u,ctx){ a.dataset.u=u;
  if(/^https?:\/\//i.test(u)){ a.href=u; a.target='_blank'; a.rel='noopener noreferrer'; }
  else if(u.startsWith('#')){ a.href=u; a.dataset.anchor=slug(decodeURIComponent(u.slice(1))); }
  else { const m=/(?:^|\/)(?:docs\/)?([a-z]+)\/USER-MANUAL_(NL|EN)\.md(?:#(.*))?$/i.exec(u)||/^(?:\.\.\/)?([a-z]+)\/USER-MANUAL_(NL|EN)\.md(?:#(.*))?$/i.exec(u); if(m&&ALL.includes(m[1])){ a.href='#'; a.dataset.folder=m[1]; if(m[3]) a.dataset.anchor=slug(decodeURIComponent(m[3])); } else a.removeAttribute('href'); } }
function cells(l){ return l.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|')); }
function render(md,ctx){ const root=document.createElement('div'); root.className='mdbody'; const L=md.split('\n'); let i=0;
  const para=[]; const flush=()=>{ if(!para.length) return; const p=document.createElement('p'); inline(p,para.join(' '),ctx); root.appendChild(p); para.length=0; };
  const indentOf=l=>/^(\s*)/.exec(l)[1].replace(/\t/g,'    ').length;
  const isItem=l=>/^\s*([-*+]|\d+[.)])\s+/.test(l);
  function list(parentEl,base){ const first=/^\s*(\d+)[.)]\s+/.test(L[i]), ul=document.createElement(first?'ol':'ul'); parentEl.appendChild(ul);
    while(i<L.length&&isItem(L[i])&&indentOf(L[i])>=base){ const ind=indentOf(L[i]); if(ind>base&&ul.lastChild){ list(ul.lastChild,ind); continue; } if(ind<base) break;
      const li=document.createElement('li'); ul.appendChild(li); let t=L[i].replace(/^\s*([-*+]|\d+[.)])\s+/,''); i++;
      while(i<L.length&&L[i].trim()&&!isItem(L[i])&&indentOf(L[i])>base&&!/^```/.test(L[i].trim())){ t+=' '+L[i].trim(); i++; }
      inline(li,t,ctx); } }
  while(i<L.length){ const l=L[i];
    if(/^```/.test(l)){ flush(); const code=[]; i++; while(i<L.length&&!/^```/.test(L[i])) code.push(L[i++]); i++; const pre=document.createElement('pre'), c=document.createElement('code'); c.textContent=code.join('\n'); pre.appendChild(c); root.appendChild(pre); continue; }
    const h=/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l); if(h){ flush(); const e=document.createElement('h'+Math.min(6,h[1].length+1)); inline(e,h[2],ctx); e.id='man-'+slug(h[2]); root.appendChild(e); i++; continue; }
    if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){ flush(); root.appendChild(document.createElement('hr')); i++; continue; }
    if(/^\s*\|/.test(l)&&i+1<L.length&&/^\s*\|?\s*:?-{2,}/.test(L[i+1])){ flush(); const t=document.createElement('table'), head=cells(l); i+=2; const th=document.createElement('thead'), tr=document.createElement('tr'); head.forEach(c=>{ const e=document.createElement('th'); inline(e,c,ctx); tr.appendChild(e); }); th.appendChild(tr); t.appendChild(th);
      const tb=document.createElement('tbody'); while(i<L.length&&/^\s*\|/.test(L[i])){ const r=document.createElement('tr'); cells(L[i]).forEach(c=>{ const e=document.createElement('td'); inline(e,c,ctx); r.appendChild(e); }); tb.appendChild(r); i++; } t.appendChild(tb); const wrap=document.createElement('div'); wrap.className='mdtable'; wrap.appendChild(t); root.appendChild(wrap); continue; }
    if(/^>\s?/.test(l)){ flush(); const q=[]; while(i<L.length&&/^>\s?/.test(L[i])) q.push(L[i++].replace(/^>\s?/,'')); const b=document.createElement('blockquote'); b.appendChild(render(q.join('\n'),ctx)); root.appendChild(b); continue; }
    if(isItem(l)){ flush(); list(root,indentOf(l)); continue; }
    if(!l.trim()){ flush(); i++; continue; }
    para.push(l.trim()); i++; }
  flush(); return root; }
PK.mdRender=render; PK.mdSection=section;
// ---- venster ----
const el=(t,c,txt)=>{ const e=document.createElement(t); if(c) e.className=c; if(txt!=null) e.textContent=txt; return e; };
function build(){ const w=el('div','manwin'); w.setAttribute('role','dialog'); w.setAttribute('aria-label',PK.pkt('m.man_titel')); w.hidden=true;
  const bar=el('div','manbar'), ttl=el('span','mantitle'), sw=el('button','small manswitch'), back=el('button','small manback','←'), x=el('button','small manclose','×');
  [sw,back,x].forEach(b=>b.type='button'); x.title=PK.pkt('m.sluiten_knop'); x.setAttribute('aria-label',PK.pkt('m.sluiten_knop')); back.title=PK.pkt('m.man_terug'); back.setAttribute('aria-label',PK.pkt('m.man_terug'));
  bar.append(back,ttl,sw,x); const body=el('div','manscroll'); body.tabIndex=0; const rz=el('div','manrz'); rz.title=PK.pkt('m.sleep_om_de_grootte_te'); w.append(bar,body,rz); document.body.appendChild(w);
  x.onclick=close; back.onclick=()=>{ const h=W.hist.pop(); if(h) go(h,true); };
  sw.onclick=()=>{ if(W.cur) go({...W.cur,whole:!W.cur.whole,anchor:W.cur.whole?'':slug(W.cur.names[0])},false); };
  w.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Escape') close(); });
  body.addEventListener('click',e=>{ const a=e.target.closest&&e.target.closest('a[data-folder],a[data-anchor]'); if(!a) return; e.preventDefault();
    if(a.dataset.folder) go({folder:a.dataset.folder,names:[],whole:true,anchor:a.dataset.anchor||'',title:W.cur?W.cur.title:''},false); else scrollTo(a.dataset.anchor); });
  // slepen aan de balk, formaat aan de hoek
  let d=null; bar.addEventListener('pointerdown',e=>{ if(e.target.closest('button')||w.classList.contains('docked')) return; const r=w.getBoundingClientRect(); d={x:e.clientX-r.left,y:e.clientY-r.top}; bar.setPointerCapture(e.pointerId); });
  bar.addEventListener('pointermove',e=>{ if(!d) return; w.style.left=Math.max(0,Math.min(innerWidth-80,e.clientX-d.x))+'px'; w.style.top=Math.max(0,Math.min(innerHeight-40,e.clientY-d.y))+'px'; w.style.right='auto'; w.style.bottom='auto'; });
  bar.addEventListener('pointerup',()=>{ d=null; }); bar.addEventListener('pointercancel',()=>{ d=null; });
  let z=null; rz.addEventListener('pointerdown',e=>{ const r=w.getBoundingClientRect(); z={x:e.clientX,y:e.clientY,w:r.width,h:r.height}; rz.setPointerCapture(e.pointerId); e.preventDefault(); });
  rz.addEventListener('pointermove',e=>{ if(!z) return; w.style.width=Math.max(300,Math.min(innerWidth-20,z.w+e.clientX-z.x))+'px'; w.style.height=Math.max(220,Math.min(innerHeight-20,z.h+e.clientY-z.y))+'px'; });
  rz.addEventListener('pointerup',()=>{ z=null; }); rz.addEventListener('pointercancel',()=>{ z=null; });
  return {el:w,title:ttl,sw,back,body,hist:[],cur:null,seq:0}; }
function close(){ if(W) W.el.hidden=true; }
function scrollTo(a){ if(!W||!a) return; const t=W.body.querySelector('[id="man-'+a.replace(/"/g,'')+'"]'); if(t) t.scrollIntoView({block:'start'}); }
async function go(req,isBack){ if(!W) return; const seq=++W.seq; if(!isBack&&W.cur) W.hist.push(W.cur); W.cur=req; W.back.disabled=!W.hist.length;
  W.title.textContent=req.title||''; W.sw.textContent=req.whole?PK.pkt('m.man_deze'):PK.pkt('m.man_hele'); W.sw.hidden=!req.names.length; W.body.replaceChildren(el('p','manmsg',PK.pkt('m.man_laden')));
  const lang=PK.PK_LANG==='nl'?'nl':'en', langs=lang==='nl'?['nl','en']:['en']; let lastErr=null;
  // mapcandidaten: de opgegeven map, daarna de rest; per taal eerst de taal van de host, dan Engels
  const folders=req.folder?[req.folder]:req.folders;
  for(const L of langs) for(const f of folders){ let got; try{ got=await fetchManual(f,L); }catch(e){ lastErr=e; continue; } if(seq!==W.seq) return;
    let md=got.text; if(!req.whole){ md=section(md,req.names); if(!md) continue; }
    const ctx={base:got.base}; W.body.replaceChildren(render(md,ctx)); W.cur.folder=f; W.cur.lang=L; W.el.dataset.lang=L; W.body.scrollTop=0; if(req.whole&&req.anchor) scrollTo(req.anchor); return; }
  if(seq!==W.seq) return;
  const box=el('div','manmsg'); box.appendChild(el('p',null,lastErr?PK.pkt('m.man_fout',String(lastErr.message||lastErr)):PK.pkt('m.man_geen',req.title||''))); const rb=el('button','small',PK.pkt('m.man_opnieuw')); rb.type='button'; rb.onclick=()=>{ CACHE.clear(); go(req,true); }; box.appendChild(rb); W.body.replaceChildren(box); }
// open de handleiding van een apparaat (definitie) in het venster
function open(def){ if(!W) W=build(); const names=[def.name,def.i18n&&def.i18n.nl&&def.i18n.nl.name,def.i18n&&def.i18n.en&&def.i18n.en.name].filter(Boolean);
  const first=(PK.dirOf&&PK.dirOf(def))||'', folders=[...new Set([first,CATDIR[def.category]||'',...ALL].filter(f=>ALL.includes(f)))];
  W.hist=[]; W.el.hidden=false; if(!W.el.style.width) { /* standaardmaat uit de CSS */ } go({folders,names,whole:false,anchor:'',title:def.name},true); W.back.disabled=true; W.body.focus(); }
PK.manualOpen=open; PK.manualClose=close;
})(window.__PK);
