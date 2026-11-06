// js/skins-design.js — skins: mini-ontwerper (nieuwe eigen skin of kopie, live voorbeeld op een kaart, opslaan als gebruikersskin, exporteren)
(function(PK){
/* =====================================================================
   MINI-ONTWERPER · zaadje van de editor van laag 3. Bewerkt alleen `design` (poorten, kleuren, haptiek, knoppen); bij een kopie blijven CSS, assets en verschijningen van het origineel behouden.
   Model D = {dev, cardId, name, author, design (skin-niveau), aps[] (verschijningen met eigen design-overschrijving), dflt, tab}. Tab 0 = skin-niveau (geldt voor alle verschijningen).
   Voorbeeld: een tijdelijke skin PK.SK.draft (id <apparaat>.draft-preview) op de gekozen kaart; Sluiten zet de vorige skin van die kaart terug. Een draft komt nooit in song of werkruimte.
   ===================================================================== */
let D=null;
const clone=o=>JSON.parse(JSON.stringify(o));
const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
const slug=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
const EXTRA={compact:{id:'compact',name:'Compact',when:{maxWidth:360}},full:{id:'full',name:'Full',when:{minWidth:361}}};
const draftId=()=>D.dev.toLowerCase()+'.draft-preview';
const card=()=>D&&PK.Host.devices.get(D.cardId);
const isPristine=a=>a.id==='standard'&&!a.design&&!a.css&&!Object.keys(a.assets||{}).length&&!a.when;
const visAps=()=>D.aps.filter((a,i)=>!(i===0&&isPristine(a)));
const ctxDesign=()=>D.tab===0?D.design:(visAps()[D.tab-1].design||(visAps()[D.tab-1].design={}));
const ctxAp=()=>D.tab===0?null:visAps()[D.tab-1];
function getv(g,k){ const x=D.tab===0?D.design:(ctxAp().design||{}); return x[g]&&x[g][k]; }
function setv(g,k,v){ const d=ctxDesign(); if(v===''||v==null){ if(d[g]){ delete d[g][k]; if(!Object.keys(d[g]).length) delete d[g]; } } else { d[g]=d[g]||{}; d[g][k]=v; }
  if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
function getc(k){ const x=D.tab===0?D.design:(ctxAp().design||{}); return x.colors&&x.colors.custom&&x.colors.custom[k]; }
function setc(k,v){ const d=ctxDesign(); d.colors=d.colors||{}; d.colors.custom=d.colors.custom||{}; if(v) d.colors.custom[k]=v; else delete d.colors.custom[k]; if(!Object.keys(d.colors.custom).length) delete d.colors.custom; if(!Object.keys(d.colors).length) delete d.colors; if(D.tab>0&&!Object.keys(d).length) delete ctxAp().design; }
const effScheme=()=>getv('colors','scheme')||(D.tab>0&&D.design.colors&&D.design.colors.scheme)||'workspace';
const effColour=k=>getc(k)||(D.tab>0&&D.design.colors&&D.design.colors.custom&&D.design.colors.custom[k])||null;

// ---- bouwen en voorbeeld ----
function build(preview){ const name=D.name.trim()||'Untitled', id=preview?draftId():D.dev.toLowerCase()+'.'+(slug(name)||'custom'), today=new Date(), pad=n=>String(n).padStart(2,'0');
  const j={format:'patchkamer-skin',formatVersion:1,skinsContract:'0.2',id,device:D.dev,name:name.slice(0,60),version:D.version||'1.0.0'};
  if(D.author.trim()) j.author=D.author.trim().slice(0,100); j.created=`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  if(D.dflt) j.default=D.dflt; if(Object.keys(D.design).length) j.design=clone(D.design);
  j.appearances=D.aps.map(a=>{ const o={id:a.id,name:a.name}; if(a.description) o.description=a.description; if(a.when) o.when=clone(a.when); o.css=a.css||''; if(a.assets&&Object.keys(a.assets).length) o.assets=clone(a.assets); if(a.design&&Object.keys(a.design).length) o.design=clone(a.design); return o; });
  return j; }
function preview(){ const r=card(); if(!r) return; try{ const sk=PK.skValidate(build(true),'preview',[]); PK.SK.draft={skin:sk,file:'',origin:'draft'};
    const ap=D.tab===0?(D.dflt||D.aps[0].id):ctxAp().id; PK.skinSet(D.cardId,sk.id,ap); }catch(e){ PK.status(e.message,true); } }

// ---- formulier ----
const portsDef=()=>{ const d=PK.Host.latest(D.dev); return !!(d&&d.ui&&d.ui.jacks); };
function selRow(box,label,g,k,opts,hint,disabled){ const row=el('div','dz-row'), lb=el('label',null,label), sel=document.createElement('select'); sel.className='small'; sel.setAttribute('aria-label',label);
  if(D.tab>0){ const o=el('option',null,PK.pkt('m.dz_zoals_skin')); o.value=''; sel.appendChild(o); }
  opts.forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; sel.appendChild(o); }); const cur=getv(g,k); sel.value=cur||(D.tab>0?'':opts[0][0]); sel.disabled=!!disabled;
  sel.onchange=()=>{ const v=sel.value, dflt=opts[0][0]; if(D.tab===0&&v===dflt) setv(g,k,''); else setv(g,k,v); if(g==='colors'&&k==='scheme'){ if(v==='custom') prefill(); paint(); } preview(); };
  row.append(lb,sel); box.appendChild(row); if(hint) box.appendChild(el('div','dz-hint',hint)); return sel; }
// uitgangswaarden voor eigen kleuren: wat de kaart nu toont
function prefill(){ const r=card(); if(!r) return; const pr=document.createElement('span'); pr.style.cssText='position:absolute;visibility:hidden;width:0;height:0'; r.el.appendChild(pr);
  const rd=v=>{ pr.style.color=''; pr.style.color='var('+v+')'; const m=/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(pr).color); return m?PK.cpHex([+m[1],+m[2],+m[3]]):null; };
  const map={bg:'--card',surface:'--card-2',text:'--fg',muted:'--muted',accent:'--sel',line:'--line'}; for(const k in map){ if(!effColour(k)){ const h=rd(map[k]); if(h) setc(k,h); } } pr.remove(); }
function colourRows(box){ const bgOf=()=>effColour('bg'); let openKey=null, pk=null, pkRow=null;
  PK.SK_COLOUR_KEYS.forEach(k=>{ const row=el('div','dz-row'), lb=el('label',null,PK.pkt('m.dz_c_'+k)), cell=el('div','dz-col'), sw=el('button','dz-sw'), hx=el('span','dz-hint'), clr=el('button','small','×');
    sw.type='button'; clr.type='button'; sw.setAttribute('aria-label',PK.pkt('m.dz_c_'+k)); clr.title=PK.pkt('m.dz_c_leeg'); clr.setAttribute('aria-label',PK.pkt('m.dz_c_leeg'));
    const paintSw=()=>{ const v=effColour(k); sw.style.background=v||''; sw.classList.toggle('empty',!v); sw.classList.toggle('on',openKey===k); hx.textContent=v||PK.pkt('m.dz_c_werkruimte'); clr.hidden=!getc(k); };
    sw.onclick=()=>{ if(pk){ pk.destroy(); pk=null; } const was=openKey; openKey=was===k?null:k; box.querySelectorAll('.dz-sw').forEach(b=>b.classList.remove('on'));
      if(openKey){ pk=PK.colourPicker({value:effColour(k)||'#808080',label:PK.pkt('m.dz_c_'+k),against:(k==='text'||k==='muted'||k==='accent')?bgOf:null,min:3,onChange:h=>{ setc(k,h); paintSw(); preview(); },onCommit:h=>{ setc(k,h); paintSw(); preview(); contrastNote(); }}); row.after(pk.el); pkRow=row; sw.classList.add('on'); if(!effColour(k)){ setc(k,pk.get()); paintSw(); preview(); } } paintSw(); };
    clr.onclick=()=>{ setc(k,''); paintSw(); preview(); contrastNote(); }; cell.append(sw,hx,clr); row.append(lb,cell); box.appendChild(row); paintSw(); });
  const note=el('div','dz-warn'); note.setAttribute('role','status'); box.appendChild(note);
  function contrastNote(){ const t=effColour('text'), b=effColour('bg'); const q=t&&b?PK.cpContrast(t,b):null; note.textContent=q&&q<3?PK.pkt('m.dz_contrast',q.toFixed(1)):''; const miss=PK.SK_COLOUR_KEYS.filter(k=>!effColour(k)); if(!note.textContent&&miss.length) { note.className='dz-hint'; note.textContent=PK.pkt('m.dz_c_ontbreekt',miss.map(k=>PK.pkt('m.dz_c_'+k)).join(', ')); } else note.className='dz-warn'; }
  contrastNote(); }
function paint(){ const box=PK.$('skDesign'); if(!box||!D) return; box.innerHTML=''; const r=card(), dv=PK.Host.latest(D.dev), pkt=PK.pkt;
  const h=el('h3',null,pkt('m.dz_titel',dv?dv.name:D.dev)); box.appendChild(h);
  box.appendChild(el('div','note',pkt('m.dz_uitleg',r?r.def.name:'')));
  const nm=el('div','dz-row'), nl=el('label',null,pkt('m.dz_naam')), ni=document.createElement('input'); ni.type='text'; ni.maxLength=60; ni.value=D.name; ni.setAttribute('aria-label',pkt('m.dz_naam')); ni.oninput=()=>{ D.name=ni.value; sv.disabled=ex.disabled=!D.name.trim(); }; nm.append(nl,ni); box.appendChild(nm);
  const au=el('div','dz-row'), al=el('label',null,pkt('m.dz_auteur')), ai=document.createElement('input'); ai.type='text'; ai.maxLength=100; ai.value=D.author; ai.setAttribute('aria-label',pkt('m.dz_auteur')); ai.oninput=()=>{ D.author=ai.value; aw.hidden=!!D.author.trim(); }; au.append(al,ai); box.appendChild(au);
  const aw=el('div','dz-hint',pkt('m.dz_auteur_leeg')); aw.hidden=!!D.author.trim(); box.appendChild(aw);
  // verschijningen
  const tabs=el('div','dz-tabs'); tabs.setAttribute('role','group'); tabs.setAttribute('aria-label',pkt('m.sk_verschijning'));
  const aps=visAps(), tb=(label,i,rm)=>{ const b=el('button','small'+(D.tab===i?' on':''),label); b.type='button'; b.setAttribute('aria-pressed',String(D.tab===i)); b.onclick=()=>{ D.tab=i; paint(); preview(); }; tabs.appendChild(b); if(rm){ const x=el('button','small','×'); x.type='button'; x.title=pkt('m.dz_verschijning_weg'); x.setAttribute('aria-label',pkt('m.dz_verschijning_weg')+' '+label); x.onclick=()=>{ D.aps=D.aps.filter(a=>a!==rm); if(D.tab>aps.length-1) D.tab=0; paint(); preview(); }; tabs.appendChild(x); } };
  tb('Standard',0); aps.forEach((a,i)=>tb(a.name,i+1,(!a.css&&!Object.keys(a.assets||{}).length&&EXTRA[a.id])?a:null));
  const free=Object.keys(EXTRA).filter(k=>!D.aps.some(a=>a.id===k)); if(free.length){ const add=document.createElement('select'); add.className='small'; add.setAttribute('aria-label',pkt('m.dz_verschijning_toevoegen')); const o0=el('option',null,pkt('m.dz_verschijning_toevoegen')); o0.value=''; add.appendChild(o0); free.forEach(k=>{ const o=el('option',null,EXTRA[k].name); o.value=k; add.appendChild(o); });
    add.onchange=()=>{ if(!add.value) return; D.aps.push({...clone(EXTRA[add.value]),css:'',assets:{}}); D.tab=visAps().length; paint(); preview(); }; tabs.appendChild(add); }
  box.appendChild(tabs);
  const ap=ctxAp(); box.appendChild(el('div','dz-hint',ap?(ap.when?pkt('m.dz_when_hint',ap.name,PK_when(ap.when)):pkt('m.dz_tab_alleen')):pkt('m.dz_tab_skin')));
  // poorten
  box.appendChild(el('h4',null,pkt('m.dz_poorten')));
  selRow(box,pkt('m.dz_modus'),'ports','mode',[['default',pkt('m.dz_p_default')],['always',pkt('m.dz_p_always')],['hover',pkt('m.dz_p_hover')],['strip',pkt('m.dz_p_strip')]],null,portsDef());
  if(portsDef()) box.appendChild(el('div','dz-warn',pkt('m.sk_jacks_paneel')));
  // kleuren
  box.appendChild(el('h4',null,pkt('m.dz_kleuren')));
  selRow(box,pkt('m.dz_schema'),'colors','scheme',[['workspace',pkt('m.dz_s_workspace')],['custom',pkt('m.dz_s_custom')]]);
  if(effScheme()==='custom') colourRows(box);
  // haptiek
  box.appendChild(el('h4',null,pkt('m.dz_haptiek')));
  const lv=[['off',pkt('m.dz_h_off')],['light',pkt('m.dz_h_light')],['medium',pkt('m.dz_h_medium')],['strong',pkt('m.dz_h_strong')]];
  selRow(box,pkt('m.dz_h_click'),'haptics','click',lv); selRow(box,pkt('m.dz_h_turn'),'haptics','turn',lv); selRow(box,pkt('m.dz_h_slide'),'haptics','slide',lv);
  box.appendChild(el('div','dz-hint',typeof navigator.vibrate==='function'?pkt('m.dz_h_ok'):pkt('m.dz_h_nee')));
  // knoppen
  box.appendChild(el('h4',null,pkt('m.dz_knoppen')));
  selRow(box,pkt('m.dz_k_stijl'),'knobs','style',[['workspace',pkt('m.dz_k_workspace')],['rotary',pkt('m.dz_k_rotary')],['slider',pkt('m.dz_k_slider')]]);
  selRow(box,pkt('m.dz_k_maat'),'knobs','size',[['m','M'],['s','S'],['l','L']]);
  box.appendChild(el('div','dz-hint',pkt('m.dz_k_hint',r?PK.knobCount(r):0)));
  const btns=el('div','dz-btns'), sv=el('button','small',pkt('m.dz_opslaan')), ex=el('button','small',pkt('m.dz_exporteren')), cl=el('button','small',pkt('m.dz_sluiten'));
  sv.type=ex.type=cl.type='button'; sv.disabled=ex.disabled=!D.name.trim(); sv.onclick=save; ex.onclick=exportIt; cl.onclick=()=>skDesignClose(); btns.append(sv,ex,cl); box.appendChild(btns);
  const st=el('div','dz-hint'); st.id='dzStatus'; st.setAttribute('role','status'); box.appendChild(st); }
function PK_when(w){ const p=[]; if(w.minWidth!=null) p.push('≥ '+w.minWidth+' px'); if(w.maxWidth!=null) p.push('≤ '+w.maxWidth+' px'); if(w.screens) p.push(w.screens.join(' / ')); return p.join(' · '); }
function say(t){ const s=PK.$('dzStatus'); if(s) s.textContent=t; PK.status(t); }

// ---- opslaan en exporteren ----
function save(){ if(!D||!D.name.trim()) return; const j=build(false), prevU=PK.SK.user.find(e=>e.skin.id===j.id);
  if(prevU){ const v=String(prevU.skin.version).split(/[-+]/)[0].split('.').map(Number); j.version=`${v[0]||1}.${v[1]||0}.${(v[2]||0)+1}`; }
  let sk, notes=[]; try{ sk=PK.skValidate(j,j.id,notes); }catch(e){ PK.status(e.message,true); return; }
  if(!PK.skAdd('user',sk,sk.id+'.patchkamer-skin.json',{notes})){ PK.status(PK.pkt('m.sk_nieuwer_aanwezig'),true); return; }
  PK.skPersist(); const cid=D.cardId, r=card(); if(r) r.skPrev=null; PK.SK.draft=null; if(r) PK.skinSet(cid,sk.id,'auto'); PK.skinsChanged();
  PK.status(PK.pkt('m.dz_opgeslagen',sk.name)); finish(); }
async function exportIt(){ if(!D||!D.name.trim()) return; const j=build(false); const fn=j.id+'.patchkamer-skin.json';
  const res=await PK.saveFileData(fn,JSON.stringify(j,null,2)+'\n'); say(res==='saved'?PK.pkt('m.dz_geexporteerd',fn):PK.pkt('m.exporteren_geannuleerd')); }

// ---- openen en sluiten ----
function skDesignOpen(dev,src){ if(D) skDesignClose(true); const def=PK.Host.latest(dev); if(!def){ PK.status(PK.pkt('m.sk_apparaat_ontbreekt'),true); return; }
  const cid=PK.skCardFor(dev); if(!cid){ PK.status(PK.pkt('m.sk_apparaat_ontbreekt'),true); return; } const r=PK.Host.devices.get(cid);
  D={dev,cardId:cid,tab:0,name:src?src.name.slice(0,50)+PK.pkt('m.dz_kopie'):'',author:src?src.author:'',design:src&&src.design?clone(src.design):{},aps:src?clone(src.appearances):[{id:'standard',name:'Standard',css:'',assets:{}}],dflt:src?src.default:'standard',version:'1.0.0'};
  D.aps.forEach(a=>{ if(!a.assets) a.assets={}; }); if(!D.dflt||!D.aps.some(a=>a.id===D.dflt)) D.dflt=D.aps[0].id;
  r.skPrev=r.skin?{id:r.skin.id,appearance:r.skin.appearance}:null; PK.select(cid);
  PK.$('skLibs').hidden=true; PK.$('skDesign').hidden=false; paint(); preview(); const first=PK.$('skDesign').querySelector('input'); if(first) first.focus({preventScroll:true}); } PK.skDesignOpen=skDesignOpen;
function finish(){ D=null; const b=PK.$('skDesign'); if(b){ b.hidden=true; b.innerHTML=''; } const l=PK.$('skLibs'); if(l) l.hidden=false; if(PK.skPaintPanel) PK.skPaintPanel(); }
function skDesignClose(quiet){ if(!D) return; const cid=D.cardId, r=card(), prev=r&&r.skPrev; PK.SK.draft=null;
  if(r){ r.skPrev=null; PK.skinSet(cid,'',''); if(prev) PK.skinRestore(cid,prev); }
  finish(); } PK.skDesignClose=skDesignClose;
PK.skDesigning=()=>!!D;
})(window.__PK);
