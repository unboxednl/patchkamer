// js/skins-ui.js — skins: paneel Skins, keuzelijsten Skin en Verschijning op de kaart
(function(PK){
/* =====================================================================
   SKINS · gebruikersinterface. Paneel #skPanel (zelfde opzet als Tunes en Presets): per apparaat de skins en hun verschijningsvormen,
   Importeren, Alles laden uit de standaardbron, verwijderen (alleen geïmporteerde). Op de kaart staan in .pbar twee keuzelijsten (.pskin), alleen als er voor dit apparaat-id een skin is.
   ===================================================================== */
const skDev=d=>(PK.Host.latest(d)||{}).name||d;
function skOpenPanel(){ PK.libOpen('skins'); } PK.skOpenPanel=skOpenPanel;
function skClosePanel(){ if(PK.skDesigning&&PK.skDesigning()) PK.skDesignClose(); if(PK.libTab()==='skins') PK.libClose(); } PK.skClosePanel=skClosePanel;
function skWhen(a){ const w=a.when; if(!w) return PK.pkt('m.sk_alleen_handmatig'); const p=[]; if(w.minWidth!=null) p.push('≥ '+w.minWidth+' px'); if(w.maxWidth!=null) p.push('≤ '+w.maxWidth+' px'); if(w.screens) p.push(w.screens.join(' / ')); return p.join(' · ')||PK.pkt('m.sk_altijd'); }
function skOrigin(e){ return e.origin==='user'?PK.pkt('m.sk_bron_import'):e.origin==='src'?(e.src&&e.src.label)||'':PK.pkt('m.sk_bron_ingesloten'); }
// op welke kaart: de geselecteerde kaart van dit apparaat, anders de eerste, anders een nieuwe op de vloer
function skCardFor(dev){ const sel=PK.selected&&PK.Host.devices.get(PK.selected); if(sel&&sel.def.id===dev) return PK.selected;
  for(const [k,r] of PK.Host.devices) if(r.def.id===dev) return k;
  if(!PK.Host.latest(dev)) return null; const before=new Set(PK.Host.devices.keys()); PK.placeNew(dev); return [...PK.Host.devices.keys()].find(k=>!before.has(k))||null; }
PK.skCardFor=skCardFor;
function skApplyFromPanel(dev,skinId,ap){ const id=skCardFor(dev); if(!id){ PK.status(PK.pkt('m.sk_apparaat_ontbreekt'),true); return; } PK.skinSet(id,skinId,ap,true); PK.select(id); }
function skArm(b,label,ask,fn){ b.textContent=label; b.onclick=()=>{ if(b.dataset.arm){ fn(); } else { b.dataset.arm='1'; b.textContent=ask; setTimeout(()=>{ if(b.isConnected){ b.dataset.arm=''; b.textContent=label; } },2500); } }; }
function skPaintPanel(){ const box=PK.$('skLibs'); if(!box) return; box.innerHTML=''; const mk=PK.mk, all=PK.skinAll();
  const devs=[...new Set(all.map(e=>e.skin.device))].sort((a,b)=>skDev(a).localeCompare(skDev(b),'nl'));
  const top=mk('div','wsrow'), fsel=mk('select','small'); fsel.setAttribute('aria-label',PK.pkt('m.apparaat')); fsel.innerHTML=PK.pkt('m.alle_apparaten')+devs.map(d=>`<option value="${PK.esc(d)}">${PK.esc(skDev(d))} (${PK.skinsFor(d).length})</option>`).join(''); fsel.value=devs.includes(PK.SKFILTER)?PK.SKFILTER:''; fsel.onchange=()=>{ PK.SKFILTER=fsel.value; skPaintPanel(); };
  top.append(mk('span','note',PK.pkt('m.apparaat')),fsel); box.appendChild(top);
  // nieuw ontwerp: voor elk geladen apparaat
  { const ids=[...new Set([...PK.Host.registry.values()].map(d=>d.id))].filter(i=>PK.Host.latest(i)).sort((a,b)=>skDev(a).localeCompare(skDev(b),'nl')), nr=mk('div','wsrow'), ns=mk('select','small'), nb=mk('button','small');
    ns.setAttribute('aria-label',PK.pkt('m.dz_nieuw_voor')); ns.innerHTML=ids.map(d=>`<option value="${PK.esc(d)}">${PK.esc(skDev(d))}</option>`).join(''); if(PK.SKFILTER&&ids.includes(PK.SKFILTER)) ns.value=PK.SKFILTER;
    nb.textContent=PK.pkt('m.dz_ontwerpen'); nb.title=PK.pkt('m.dz_ontwerpen_titel'); nb.disabled=!ids.length; nb.onclick=()=>PK.skDesignOpen(ns.value,null);
    const eb=mk('button','small primary'); eb.textContent=PK.pkt('m.se_open'); eb.title=PK.pkt('m.se_open_titel'); eb.dataset.act='skEdOpen'; eb.disabled=!ids.length; eb.onclick=()=>PK.skEditorOpen(ns.value,null); nr.append(mk('span','note',PK.pkt('m.dz_nieuw')),ns,eb,nb); box.appendChild(nr); }
  if(!all.length){ box.appendChild(mk('div','note',PK.pkt('m.sk_nog_geen'))); return; }
  devs.filter(d=>!PK.SKFILTER||d===PK.SKFILTER).forEach(dev=>{ const h=mk('h4','tudev'); h.textContent=skDev(dev)+(PK.Host.latest(dev)?'':PK.pkt('m.apparaat_niet_geladen')); box.appendChild(h);
    PK.skinsFor(dev).forEach(e=>{ const sk=e.skin, key=sk.id, open=PK.skOpen.has(key), row=mk('div','prlib sklib'), info=mk('div'), b=mk('div','b'); info.style.minWidth='0';
      info.innerHTML=`<span class="nm" title="${PK.esc(sk.id)}">${open?'▾':'▸'} ${PK.esc(sk.name)}</span><small>v${PK.esc(sk.version)}${sk.author?' · '+PK.esc(PK.pkt('m.sk_door',sk.author)):''} · ${PK.esc(PK.licName(sk.license))} · ${PK.esc(PK.pktp('m.sk_n_vormen',sk.appearances.length===1,sk.appearances.length))} · ${PK.esc(skOrigin(e))}</small>`;
      if(e.notes&&e.notes.length){ const sm=info.querySelector('small'); sm.insertAdjacentText('beforeend',' · ⚠ '+e.notes.length); sm.title=PK.pkt('m.sk_let_op')+e.notes.join('\n'); }
      info.querySelector('.nm').onclick=()=>{ open?PK.skOpen.delete(key):PK.skOpen.add(key); skPaintPanel(); };
      const ap=mk('button','small'); ap.textContent=PK.pkt('m.sk_toepassen'); ap.title=PK.pkt('m.sk_toepassen_titel'); ap.disabled=!PK.Host.latest(dev); ap.onclick=()=>skApplyFromPanel(dev,sk.id,'auto'); b.appendChild(ap);
      if(e.origin==='user'){ const rm=mk('button','small'); rm.title=PK.pkt('m.sk_verwijderen'); skArm(rm,'×',PK.pkt('m.weg'),()=>{ PK.SK.user=PK.SK.user.filter(x=>x!==e); PK.skPersist(); PK.skinsChanged(); PK.status(PK.pkt('m.sk_verwijderd',sk.name)); }); b.appendChild(rm); }
      row.append(info,b); box.appendChild(row);
      const cp=mk('button','small'); cp.textContent=PK.pkt('m.dz_kopie_knop'); cp.title=PK.pkt('m.dz_kopie_titel'); cp.disabled=!PK.Host.latest(dev); cp.onclick=()=>PK.skDesignOpen(dev,sk); b.insertBefore(cp,b.firstChild);
      { const ed=mk('button','small'); ed.textContent=PK.pkt('m.se_bewerk'); ed.title=PK.pkt('m.se_bewerk_titel'); ed.dataset.act='skEdEdit'; ed.disabled=!PK.Host.latest(dev); ed.onclick=()=>PK.skEditorOpen(dev,sk,e.origin); b.insertBefore(ed,b.firstChild); }
      if(open){ const dz=sk.design||{}; { const jk=PK.Host.latest(dev); const modes=[(dz.ports||{}).mode,...sk.appearances.map(a=>a.design&&a.design.ports&&a.design.ports.mode)].filter(m=>m&&m!=='default'); if(jk&&jk.ui&&jk.ui.jacks&&modes.length) box.appendChild(mk('div','note',PK.pkt('m.sk_jacks_paneel')));
          const kn=[dz.knobs,...sk.appearances.map(a=>a.design&&a.design.knobs)].filter(Boolean); if(kn.length){ const st=PK.knobStats(); box.appendChild(mk('div','note',PK.pkt('m.sk_knop_stat',st.n,st.m))); }
          const hc=[dz.controls,...sk.appearances.map(a=>a.design&&a.design.controls)].some(c=>c&&c.length); if(hc){ let cr=null; for(const [,r] of PK.Host.devices) if(r.def.id===dev){ cr=r; break; } if(cr){ const st=PK.regStats(cr); box.appendChild(mk('div','note',PK.pkt('m.sk_ctl_stat',st.n,st.m))); } } }
        { const hm=[dz.meters,...sk.appearances.map(a=>a.design&&a.design.meters)].some(c=>c&&c.length); if(hm){ let cr=null; for(const [,r] of PK.Host.devices) if(r.def.id===dev){ cr=r; break; } if(cr){ const st=PK.meterStats(cr); box.appendChild(mk('div','note',PK.pkt('m.sk_met_stat',st.n,st.m))); } } }
        { const hp=[dz.pads,...sk.appearances.map(a=>a.design&&a.design.pads)].some(Boolean); if(hp){ let cr=null; for(const [,r] of PK.Host.devices) if(r.def.id===dev){ cr=r; break; } if(cr){ const st=PK.padStats(cr); box.appendChild(mk('div','note',PK.pkt('m.sk_pad_stat',st.n,st.m))); } } }
        { const hd=[dz.display,...sk.appearances.map(a=>a.design&&a.design.display)].some(Boolean); if(hd){ let cr=null; for(const [,r] of PK.Host.devices) if(r.def.id===dev){ cr=r; break; } if(cr){ const st=PK.displayStats(cr); box.appendChild(mk('div','note',PK.pkt('m.sk_dsp_stat',st.n,st.m))); } } }
        { const hl=[dz.layout,...sk.appearances.map(a=>a.design&&a.design.layout)].some(c=>c&&c.panels&&c.panels.length); if(hl){ let cr=null; for(const [,r] of PK.Host.devices) if(r.def.id===dev){ cr=r; break; } if(cr) box.appendChild(mk('div','note',PK.pkt('m.sk_pn_stat',PK.pnlText(cr)))); } }
        { const hs=[dz.sections,...sk.appearances.map(a=>a.design&&a.design.sections)].some(c=>c&&c.length); if(hs){ let cr=null; for(const [,r] of PK.Host.devices) if(r.def.id===dev){ cr=r; break; } if(cr){ const st=PK.secStats(cr); box.appendChild(mk('div','note',PK.pkt('m.sk_sec_stat',st.n,st.m))); } } }
        const list=mk('div','prlist'); const item=(label,sub,fn,cur)=>{ const it=mk('div','pritem'), nm=mk('span','nm'), bb=mk('div','b'), bt=mk('button','small'); nm.textContent=label; if(sub){ const s=mk('small'); s.textContent=sub; nm.appendChild(s); } bt.textContent=PK.pkt('m.sk_kies'); bt.disabled=!PK.Host.latest(dev); bt.onclick=fn; if(cur) it.classList.add('cur'); bb.appendChild(bt); it.append(nm,bb); list.appendChild(it); };
        item('Auto',PK.pkt('m.sk_auto_uitleg'),()=>skApplyFromPanel(dev,sk.id,'auto'));
        sk.appearances.forEach(a=>item(a.name,[a.description,skWhen(a)].filter(Boolean).join(' · '),()=>skApplyFromPanel(dev,sk.id,a.id))); box.appendChild(list); } }); }); } PK.skPaintPanel=skPaintPanel;
// ---- kaart: Skin en Verschijning ----
function skinCardInit(id){ const r=PK.Host.devices.get(id); if(!r||!r.pbarEl) return; const el=document.createElement('div'); el.className='pskin'; el.hidden=true;
  el.innerHTML='<label><span class="pl"></span><select class="sksel"></select></label><label><span class="pl"></span><select class="skap"></select></label><button type="button" class="small skedit"></button>';
  const [l1,l2]=el.querySelectorAll('.pl'), s1=el.querySelector('.sksel'), s2=el.querySelector('.skap');
  l1.textContent=PK.pkt('m.sk_skin'); l2.textContent=PK.pkt('m.sk_verschijning'); s1.setAttribute('aria-label',PK.pkt('m.sk_skin')); s2.setAttribute('aria-label',PK.pkt('m.sk_verschijning')); s1.title=PK.pkt('m.sk_skin_titel'); s2.title=PK.pkt('m.sk_verschijning_titel');
  const eb=el.querySelector('.skedit'); eb.textContent=PK.pkt('m.se_kaart'); eb.title=PK.pkt('m.se_kaart_titel'); eb.onclick=()=>{ const cur=r.skin&&PK.skinFind(r.skin.id), ok=cur&&cur.skin.device===r.def.id; PK.skEditorOpen(r.def.id,ok?cur.skin:null,ok?cur.origin:null); };
  s1.onchange=()=>{ if(!r.skin||s1.value!==r.skin.id) PK.skinSet(id,s1.value,'auto',true); }; s2.onchange=()=>{ if(r.skin) PK.skinSet(id,r.skin.id,s2.value,true); };
  r.pbarEl.appendChild(el); r.skEl=el; skPaintPick(r); } PK.skinCardInit=skinCardInit;
function skPaintPick(r){ const el=r.skEl; if(!el) return; const list=PK.skinsFor(r.def.id), show=list.length>0||!!r.skin, was=!el.hidden, s1=el.querySelector('.sksel'), s2=el.querySelector('.skap');
  el.hidden=!show; if(!show){ if(was) requestAnimationFrame(PK.drawCables); return; }
  const cur=r.skin&&PK.skinFind(r.skin.id), ok=!!(cur&&cur.skin.device===r.def.id);
  s1.innerHTML=''; const add=(s,v,t,dis)=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; if(dis) o.disabled=true; s.appendChild(o); };
  add(s1,'',PK.pkt('m.sk_standaard')); list.forEach(e=>add(s1,e.skin.id,e.skin.name)); if(r.skin&&!list.some(e=>e.skin.id===r.skin.id)) add(s1,r.skin.id,r.skin.id+PK.pkt('m.sk_niet_geladen'),true);
  s1.value=r.skin?r.skin.id:''; s2.innerHTML='';
  if(ok){ const act=cur.skin.appearances.find(a=>a.id===r.skCur); add(s2,'auto','Auto'+(act?' · '+act.name:'')); cur.skin.appearances.forEach(a=>add(s2,a.id,a.name)); s2.value=cur.skin.appearances.some(a=>a.id===r.skin.appearance)?r.skin.appearance:'auto'; }
  else add(s2,'auto','Auto');
  s2.disabled=!ok; if(!was) requestAnimationFrame(PK.drawCables); } PK.skPaintPick=skPaintPick;
function skUiRefresh(){ PK.Host.devices.forEach(skPaintPick); if(PK.skPanel&&!PK.skPanel.hidden) skPaintPanel(); } PK.skUiRefresh=skUiRefresh;
})(window.__PK);
