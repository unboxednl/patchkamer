// js/tune-browse.js — Tunes en Presets op instrument of stijl: een boom met inspringen, gebouwd uit de tags (contract v1.19)
(function(PK){
const dict=()=>(PK.I18N&&PK.I18N[PK.PK_LANG])||{};
// naam van een tag: uit het woordenboek (m.tag_<pad>), anders het laatste deel met een hoofdletter
function tagLabel(path){ const d=dict()['m.tag_'+path.replace(/[\/-]/g,'_')]; if(d) return d; const w=path.split('/').pop().replace(/-/g,' '); return w.charAt(0).toUpperCase()+w.slice(1); } PK.tagLabel=tagLabel;
// de boom voor één wortel (instrument of style): elke tune staat bij de diepste tag van elke tak, een knoop telt alles eronder
function buildTree(entries,root){ const top={seg:'',path:'',kids:new Map(),items:[],all:new Set()}, none={seg:'',path:'',kids:new Map(),items:[],all:new Set()};
  entries.forEach(e=>{ let tg=e.tags.filter(t=>t===root||t.startsWith(root+'/')); tg=tg.filter(t=>!tg.some(o=>o!==t&&o.startsWith(t+'/')));
    if(!tg.length){ none.items.push(e); none.all.add(e.n.pid); return; }
    tg.forEach(t=>{ let node=top; const segs=t.split('/').slice(1); top.all.add(e.n.pid);
      segs.forEach((sg,i)=>{ if(!node.kids.has(sg)) node.kids.set(sg,{seg:sg,path:root+'/'+segs.slice(0,i+1).join('/'),kids:new Map(),items:[],all:new Set()}); node=node.kids.get(sg); node.all.add(e.n.pid); });
      if(node!==top&&!node.items.includes(e)) node.items.push(e); }); });
  return {top,none}; }
function matches(e,q){ if(!q) return true; const hay=(e.n.name+' '+PK.tuDevName(e.l.device)+' '+e.tags.map(tagLabel).join(' ')+' '+e.path.join(' ')).toLowerCase(); return q.split(/\s+/).every(w=>hay.includes(w)); }
function leaf(e){ const it=PK.mk('div','pritem'); const nm=PK.mk('span','nm'); nm.textContent=e.n.name; const sm=document.createElement('small'); sm.textContent=' · '+PK.tuDevName(e.l.device); nm.appendChild(sm);
  const bb=PK.mk('div','b'); const ap=PK.mk('button','small'); ap.textContent=PK.pkt('m.laden'); ap.title=PK.pkt('m.tv_laden_titel'); ap.disabled=!PK.Host.latest(e.l.device); ap.onclick=()=>PK.prApplyFromPanel(e.l.lid,e.n.pid); bb.appendChild(ap); it.append(nm,bb); return it; }
function paintNode(box,node,depth,view,q,open){ const kids=[...node.kids.values()].sort((a,b)=>tagLabel(a.path).localeCompare(tagLabel(b.path),PK.PK_LANG));
  kids.forEach(k=>{ const key='tb:'+view+':'+k.path, isOpen=q?true:open.has(key); const it=PK.mk('div','pritem fold'); it.style.paddingLeft=(6+depth*14)+'px';
    const nm=PK.mk('span','nm'); nm.style.cursor='pointer'; nm.textContent=(isOpen?'▾ ':'▸ ')+tagLabel(k.path); const c=document.createElement('small'); c.textContent=k.all.size; nm.appendChild(c);
    nm.onclick=()=>{ isOpen?open.delete(key):open.add(key); PK.prPaintPanel(); }; it.appendChild(nm); box.appendChild(it);
    if(isOpen){ paintNode(box,k,depth+1,view,q,open); const items=[...k.items].sort((a,b)=>a.n.name.localeCompare(b.n.name,PK.PK_LANG)); items.forEach(e=>{ const l=leaf(e); l.style.paddingLeft=(6+(depth+1)*14)+'px'; box.appendChild(l); }); } }); }
// box: de lijst van het Tunes-/Presets-paneel; view: 'instrument' of 'style'
function tuBrowse(box,view){ const all=PK.tuTagged(); const q0=(PK.TUQ||'').trim().toLowerCase();
  const sr=PK.mk('div','wsrow'); const inp=document.createElement('input'); inp.type='search'; inp.className='wsurl'; inp.style.width='100%'; inp.value=PK.TUQ||''; inp.placeholder=PK.pkt('m.tv_zoek'); inp.setAttribute('aria-label',PK.pkt('m.tv_zoek')); inp.spellcheck=false;
  inp.addEventListener('keydown',e=>e.stopPropagation()); inp.addEventListener('pointerdown',e=>e.stopPropagation()); sr.appendChild(inp); box.appendChild(sr);
  const out=PK.mk('div','prlist'); box.appendChild(out);
  const draw=()=>{ out.innerHTML=''; const q=(PK.TUQ||'').trim().toLowerCase(), open=PK.prOpen, entries=all.filter(e=>matches(e,q)), {top,none}=buildTree(entries,view);
    if(!all.length){ out.appendChild(PK.mk('div','note',PK.pkt('m.tv_leeg'))); return; }
    if(!entries.length){ out.appendChild(PK.mk('div','note',PK.pkt('m.tv_niets'))); return; }
    paintNode(out,top,0,view,q,open);
    if(none.items.length){ const key='tb:'+view+':none', isOpen=q?true:open.has(key), it=PK.mk('div','pritem fold'); it.style.paddingLeft='6px'; const nm=PK.mk('span','nm'); nm.style.cursor='pointer'; nm.textContent=(isOpen?'▾ ':'▸ ')+PK.pkt('m.tv_zonder'); const c=document.createElement('small'); c.textContent=none.items.length; nm.appendChild(c);
      nm.onclick=()=>{ isOpen?open.delete(key):open.add(key); PK.prPaintPanel(); }; it.appendChild(nm); out.appendChild(it);
      if(isOpen) [...none.items].sort((a,b)=>a.n.name.localeCompare(b.n.name,PK.PK_LANG)).forEach(e=>{ const l=leaf(e); l.style.paddingLeft='20px'; out.appendChild(l); }); } };
  inp.addEventListener('input',()=>{ PK.TUQ=inp.value; draw(); }); draw(); } PK.tuBrowse=tuBrowse;
})(window.__PK);
