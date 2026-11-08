// js/skin-editor.js — skin-editor (laag 3): de opbouw van het venster (drie kolommen), de kop, ongedaan/opnieuw, concept, validatie, opslaan, exporteren, openen en sluiten
(function(PK){
/* =====================================================================
   SKIN-EDITOR · VENSTER. Zwevend venster (js/skin-editor-window.js) met drie kolommen: links de boom (structuur), midden de werkplek (origineel naast de nieuwe skin), rechts de eigenschappen. Eén object E: m (het model, js/skin-editor-model.js), sel (wat geselecteerd is), view (breedte, scherm, stand), hist (ongedaan/opnieuw als JSON-momentopnamen), els (DOM).
   E.edit(fn,{key,form}) is de enige schrijfroute: fn mag false teruggeven (dan wordt het model hersteld); anders prune, één geschiedenisstap (zelfde key binnen 1 s telt als één), voorbeeld, boom, formulier, controle en concept.
   Opslaan en Exporteren gebruiken dezelfde code als de mini-ontwerper (PK.skAdd/skPersist, PK.saveFileData); validatie is PK.skValidate + controles tegen het register van het apparaat (model.check). De mini-ontwerper blijft bestaan als Eenvoudig formulier.
   ===================================================================== */
const M=PK.skm, F=PK.ske_f, el=F.el, pkt=(...a)=>PK.pkt(...a);
let E=null;
const HMAX=200;
function mkE(){ return {m:null,r:null,ro:null,cardId:null,sel:{k:'skin'},exp:new Map(),capOver:new Map(),els:{},view:{w:412,scr:'auto',mode:'design',auto:false,orig:true,k:1,ko:1,klock:0},past:[],future:[],base:'',ckey:'',srcId:null,dirty:false,regsAt:0,regsC:null,ct:0,timer:0,prev:null,open:true,maxed:false}; }
const phone=()=>matchMedia('(max-width:899px)').matches;
const btn=(box,label,fn,o={})=>{ const b=el('button','small',label); b.type='button'; if(o.title) b.title=b.ariaLabel=pkt(o.title); if(o.cls) b.className+=' '+o.cls; if(o.id) b.dataset.act=o.id; b.onclick=fn; box.appendChild(b); return b; };
// ---- geschiedenis en schrijven ----
function snap(){ return JSON.stringify(E.m); }
function pushHist(before,key){ const now=Date.now(), last=E.past[E.past.length-1]; if(key&&last&&last.key===key&&now-last.t<1000){ last.t=now; E.future=[]; return; } E.past.push({s:before,key,t:now}); if(E.past.length>HMAX) E.past.shift(); E.future=[]; }
function edit(fn,o={}){ if(!E||!E.open) return false; const before=snap(); let res; try{ res=fn(); }catch(e){ console.warn('skin-editor',e); res=false; }
  if(res===false){ E.m=JSON.parse(before); clampSel(); if(o.form!==false) renderForm(); return false; }
  M.pruneAll(E.m); if(snap()===before){ if(o.form!==false) renderForm(); return true; } pushHist(before,o.key); changed(o); return true; }
function undo(){ if(!E.past.length) return; E.future.push({s:snap()}); E.m=JSON.parse(E.past.pop().s); E.past.forEach(x=>{ x.key=null; }); clampSel(); changed({}); }
function redo(){ if(!E.future.length) return; E.past.push({s:snap(),key:null,t:0}); E.m=JSON.parse(E.future.pop().s); clampSel(); changed({}); }
function clampSel(){ const s=E.sel, aps=E.m.aps; if(s.ap&&s.ap!=='*'&&!aps.some(a=>a.id===s.ap)){ E.sel={k:'aps'}; return; } if(s.k==='panel'&&!M.layoutOf(E.m,s.ap).panels.some(p=>p.id===s.pid)) E.sel={k:'ctls',ap:s.ap}; }
function changed(o){ E.dirty=snap()!==E.base; PK.ske_stage.preview(); E.regsC=null; if(o.tree===false) PK.ske_tree.label(); else PK.ske_tree.draw(); if(o.form!==false) renderForm(); syncHead(); info(); concept(); }
// ---- selecteren ----
function select(sel,o={}){ const was=E.sel.ap; E.sel=sel; if(o.swallow) E.swallow=Date.now()+500; const ST=PK.ske_stage;
  PK.ske_tree.draw({reveal:true}); renderForm();
  if(sel.ap!==was){ if(!E.view.auto){ const pa=ST.previewAp(), w=((M.layerOf(E.m,pa)||{}).size||{}).width; if(w&&w!==E.view.w) ST.setWidth(w); } ST.preview(); } else ST.schedule();
  const fk=o.focusKey||(o.reveal&&!phone()?PK.ske_tree.keyOf(sel):null); if(fk){ const r=E.els.tree.querySelector('[data-key="'+fk.replace(/"/g,'\\"')+'"]'); if(r) r.focus({preventScroll:true}); }
  if(o.fromTree) ST.show(); if(phone()&&!o.stay) tab('props'); }
function renderForm(){ const box=E.els.props, a=document.activeElement, fk=a&&box.contains(a)?a.dataset.fk:null, top=box.scrollTop; PK.ske_forms.render(E,box); box.scrollTop=top; if(fk){ const t=box.querySelector('[data-fk="'+fk.replace(/"/g,'\\"')+'"]'); if(t&&!t.disabled) t.focus({preventScroll:true}); } }
function regs(){ const t=performance.now(); if(!E.regsC||t-E.regsAt>400){ E.regsC=M.regOf(E.r); E.regsAt=t; } return E.regsC; }
function say(t,err){ const s=E.els.stat; if(!s) return; s.textContent=t||''; s.classList.toggle('bad',!!err); }
// ---- controle, JSON, concept, kop ----
function info(){ clearTimeout(E.timer); E.timer=setTimeout(()=>{ if(!E||!E.open) return; const c=M.check(E.m,E.r); E.prev=c; const n=c.errs.length, w=c.notes.length;
    E.els.count.textContent=pkt('m.se_teller',n,w); E.els.count.classList.toggle('bad',n>0); E.els.count.classList.toggle('warn',!n&&w>0); E.els.save.disabled=n>0||!E.m.name.trim(); E.els.exp.disabled=n>0||!E.m.name.trim();
    const ul=E.els.probs; ul.innerHTML=''; c.errs.forEach(x=>ul.appendChild(el('li','bad','✖ '+x))); c.notes.forEach(x=>ul.appendChild(el('li','warn','⚠ '+x))); if(!n&&!w) ul.appendChild(el('li','ok','✓ '+pkt('m.se_geen_problemen')));
    E.els.json.textContent=JSON.stringify(c.file,null,2); const st=PK.pnlStats&&E.r?PK.pnlStats(E.r):null; E.els.note.textContent=st&&st.skip==='own'?pkt('m.pn_skip_eigen'):''; PK.ske_stage.fit(); },60); }
function concept(){ clearTimeout(E.ct); E.ct=setTimeout(()=>{ if(!E||!E.open) return; if(E.dirty) M.concept.save(E.ckey,E.m); else M.concept.clear(E.ckey); },400); }
function syncHead(){ const n=E.els.name; if(document.activeElement!==n) n.value=E.m.name; E.els.undo.disabled=!E.past.length; E.els.redo.disabled=!E.future.length; E.els.root.classList.toggle('dirty',E.dirty); E.els.dsel.value=E.m.dev; E.els.load.value=''; }
// ---- opslaan en exporteren ----
function save(){ const c=M.check(E.m,E.r); if(c.errs.length||!E.m.name.trim()) return; const j=c.file, prevU=PK.SK.user.find(e=>e.skin.id===j.id);
  if(prevU){ const v=String(prevU.skin.version).split(/[-+]/)[0].split('.').map(Number); j.version=`${v[0]||1}.${v[1]||0}.${(v[2]||0)+1}`; }
  let sk, notes=[]; try{ sk=PK.skValidate(j,j.id,notes); }catch(e){ say(e.message,true); return; }
  if(!PK.skAdd('user',sk,sk.id+'.patchkamer-skin.json',{notes})){ say(pkt('m.sk_nieuwer_aanwezig'),true); return; }
  PK.skPersist(); PK.skinsChanged(); M.concept.clear(E.ckey); E.m.version=sk.version; E.srcId=sk.id; E.ckey=M.concept.key(E.m.dev,sk.id); E.base=snap(); E.dirty=false; syncHead(); info(); say(pkt('m.dz_opgeslagen',sk.name)); }
async function exportIt(){ const c=M.check(E.m,E.r); if(c.errs.length||!E.m.name.trim()) return; const fn=c.file.id+'.patchkamer-skin.json'; const res=await PK.saveFileData(fn,JSON.stringify(c.file,null,2)+'\n'); say(res==='saved'?pkt('m.dz_geexporteerd',fn):pkt('m.exporteren_geannuleerd')); }
// ---- bevestigen zonder window.confirm ----
function ask(msg,buttons){ const a=E.els.ask; a.innerHTML=''; a.appendChild(el('span','se-askt',msg)); buttons.forEach(([l,fn,cls])=>{ const b=el('button','small'+(cls?' '+cls:''),l); b.type='button'; b.onclick=()=>{ a.hidden=true; fn(); if(E&&E.open&&E.els.root.isConnected) E.els.root.focus({preventScroll:true}); }; a.appendChild(b); }); a.hidden=false; a.querySelector('button').focus(); }
function guard(go){ if(!E.dirty){ go(); return; } ask(pkt('m.se_wijzigingen'),[[pkt('m.se_weggooien'),()=>{ M.concept.clear(E.ckey); go(); },'danger'],[pkt('m.se_doorgaan'),()=>{}]]); }
// ---- skin of apparaat laden ----
function begin(m,srcId,dev){ E.m=m; E.srcId=srcId; E.ckey=M.concept.key(dev,srcId); E.base=snap(); E.past=[]; E.future=[]; E.dirty=false; E.sel={k:'skin'}; E.exp=new Map(); const c=M.concept.load(E.ckey); E.els.banner.hidden=true;
  if(c&&c.m.dev===dev){ E.m=c.m; E.dirty=snap()!==E.base; E.els.banner.hidden=false; E.els.bantxt.textContent=pkt('m.se_concept',new Date(c.t).toLocaleString(PK.PK_LANG)); E.ckey=E.ckey; }
  PK.ske_tree.draw(); renderForm(); syncHead(); PK.ske_stage.preview(); info(); }
function loadSkin(sk,origin){ guard(()=>{ if(sk.device!==E.m.dev&&!switchDev(sk.device,true)) return; begin(M.fromSkin(sk,origin==='user'),origin==='user'?sk.id:sk.id,sk.device); }); }
function switchDev(dev,force){ if(!PK.Host.latest(dev)){ say(pkt('m.sk_apparaat_ontbreekt'),true); return false; } if(!PK.ske_stage.create(dev)){ say(pkt('m.sk_apparaat_ontbreekt'),true); return false; } PK.ske_stage.setWidth(E.view.w); fillLoad(dev); if(!force) begin(M.emptyModel(dev,''),null,dev); return true; }
function fillLoad(dev){ const s=E.els.load; s.innerHTML=''; const o0=el('option',null,pkt('m.se_laad')); o0.value=''; s.appendChild(o0); PK.skinsFor(dev).forEach(e=>{ const o=el('option',null,e.skin.name+(e.origin==='user'?' ★':'')); o.value=e.skin.id; s.appendChild(o); }); }
function devList(q){ const ids=[...new Set([...PK.Host.registry.values()].map(d=>d.id))].map(i=>PK.Host.latest(i)).filter(Boolean); q=(q||'').toLowerCase(); const by=new Map(); ids.filter(d=>!q||d.name.toLowerCase().includes(q)||d.id.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'nl')).forEach(d=>{ const c=PK.categoryOf(d); if(!by.has(c)) by.set(c,[]); by.get(c).push(d); }); return by; }
function fillDev(){ const s=E.els.dsel, cur=E.m?E.m.dev:''; s.innerHTML=''; devList(E.els.dq.value).forEach((l,c)=>{ const g=document.createElement('optgroup'); g.label=(PK.CATS.find(x=>x[0]===c)||[0,c])[1]; l.forEach(d=>{ const o=el('option',null,d.name); o.value=d.id; g.appendChild(o); }); s.appendChild(g); }); if(cur) s.value=cur; }
// ---- bouwen van het venster ----
function tab(t){ E.els.root.dataset.tab=t; E.els.tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.t===t))); if(t==='stage') requestAnimationFrame(()=>{ PK.ske_stage.fit(); PK.ske_stage.schedule(); }); }
function buildDom(){ const R=el('div','skwin'); R.id='skEd'; R.tabIndex=-1; R.setAttribute('role','dialog'); R.setAttribute('aria-modal','true'); R.setAttribute('aria-label',pkt('m.se_titel')); R.dataset.tab='stage'; R.classList.add('hidecheck'); const X=E.els; X.root=R;
  const hd=el('div','se-head'); X.head=hd; const r1=el('div','se-hr');
  X.move=el('button','se-move','⠿'); X.move.type='button'; X.move.title=X.move.ariaLabel=pkt('m.se_venster_verplaats'); X.move.dataset.act='move';
  X.name=document.createElement('input'); X.name.type='text'; X.name.maxLength=60; X.name.className='se-name'; X.name.placeholder=pkt('m.se_naam_ph'); X.name.setAttribute('aria-label',pkt('m.dz_naam'));
  let nt=0; X.name.oninput=()=>{ clearTimeout(nt); nt=setTimeout(()=>edit(()=>{ E.m.name=X.name.value; },{key:'t:name',form:false,tree:false}),100); }; X.name.onchange=()=>{ clearTimeout(nt); edit(()=>{ E.m.name=X.name.value; },{key:'t:name',form:false,tree:false}); };
  X.dq=document.createElement('input'); X.dq.type='search'; X.dq.className='se-dq small'; X.dq.placeholder=pkt('m.se_zoek'); X.dq.setAttribute('aria-label',pkt('m.se_zoek')); X.dq.oninput=fillDev;
  X.dsel=document.createElement('select'); X.dsel.className='small se-dsel'; X.dsel.setAttribute('aria-label',pkt('m.apparaat')); X.dsel.onchange=()=>{ const v=X.dsel.value; if(v===E.m.dev) return; guard(()=>{ if(!switchDev(v)) X.dsel.value=E.m.dev; }); X.dsel.value=E.m.dev; };
  r1.append(X.move,X.name,X.dq,X.dsel); const wb=el('div','se-wbtns'); X.full=btn(wb,'⤢',()=>{ E.maxed=!E.maxed; X.full.setAttribute('aria-pressed',String(E.maxed)); E.win.setFull(E.maxed); },{title:'m.se_venster_vul',id:'full'}); X.full.setAttribute('aria-pressed','false'); btn(wb,pkt('m.dz_sluiten'),requestClose,{id:'close'}); r1.appendChild(wb);
  const bt=el('div','se-hbtns'); X.undo=btn(bt,'↶',undo,{title:'m.se_ongedaan',id:'undo'}); X.redo=btn(bt,'↷',redo,{title:'m.se_opnieuw',id:'redo'}); X.count=btn(bt,'',()=>{ R.classList.toggle('hidecheck'); setTimeout(()=>{ PK.ske_stage.fit(); PK.ske_stage.schedule(); },30); },{id:'count',title:'m.se_controle'});
  X.save=btn(bt,pkt('m.dz_opslaan'),save,{id:'save',cls:'primary'}); X.exp=btn(bt,pkt('m.dz_exporteren'),exportIt,{id:'export'});
  X.load=document.createElement('select'); X.load.className='small'; X.load.setAttribute('aria-label',pkt('m.se_laad')); X.load.onchange=()=>{ const id=X.load.value; if(!id) return; const e=PK.skinFind(id); if(e) loadSkin(e.skin,e.origin); X.load.value=''; }; bt.appendChild(X.load);
  const fi=document.createElement('input'); fi.type='file'; fi.accept='.json,application/json'; fi.hidden=true; fi.id='skEdFile'; fi.onchange=async()=>{ const f=fi.files[0]; fi.value=''; if(!f) return; try{ const notes=[], sk=PK.skParse(await f.text(),f.name,notes); guard(()=>{ if(sk.device!==E.m.dev&&!switchDev(sk.device,true)) return; begin(M.fromSkin(sk,false),null,sk.device); E.dirty=true; syncHead(); say(pkt('m.se_geimporteerd',f.name)); }); }catch(e){ say(e.message,true); } };
  btn(bt,pkt('m.se_importeer'),()=>fi.click(),{id:'import'}); bt.appendChild(fi);
  hd.append(r1,bt); R.appendChild(hd);
  X.tabs=el('div','se-tabs'); X.tabs.setAttribute('role','tablist'); [['tree','m.se_structuur'],['stage','m.se_voorbeeld'],['props','m.se_eigenschappen'],['check','m.se_controle']].forEach(([t,k])=>{ const b=el('button','small',pkt(k)); b.type='button'; b.dataset.t=t; b.setAttribute('role','tab'); b.onclick=()=>tab(t); X.tabs.appendChild(b); }); R.appendChild(X.tabs);
  X.banner=el('div','se-banner'); X.banner.hidden=true; X.bantxt=el('span'); X.banner.appendChild(X.bantxt); btn(X.banner,pkt('m.se_verwerp'),()=>{ M.concept.clear(E.ckey); guard0(); },{id:'discard'}); btn(X.banner,'×',()=>{ X.banner.hidden=true; }); R.appendChild(X.banner);
  const mn=el('div','se-main'); const tw=el('aside','se-treew'); tw.setAttribute('aria-label',pkt('m.se_structuur')); X.ttools=el('div','se-ttools'); X.tree=el('div','se-tree'); tw.append(X.ttools,X.tree); X.props=el('aside','se-props'); X.props.setAttribute('aria-label',pkt('m.se_eigenschappen')); X.props.id='seProps';
  const st=el('section','se-stage'); st.setAttribute('aria-label',pkt('m.se_voorbeeld')); st.appendChild(stageBar()); X.panes=el('div','se-panes');
  const pane=(cls,title)=>{ const p=el('div','se-pane '+cls), h=el('div','se-ph'); const t=el('span','se-pt',title); h.appendChild(t); const v=el('div','se-view'), f=el('div','se-fit'), sl=el('div','se-slot'), sh=el('div','se-shield'), ov=el('div','se-ovl'); f.append(sl,sh); v.append(f,ov); p.append(h,v); return {p,h,t,v,f,sl,sh,ov}; };
  const O=pane('orig',pkt('m.se_origineel')); O.h.appendChild(el('span','se-phint dz-hint',pkt('m.se_orig_hint'))); O.sh.title=pkt('m.se_orig_hint'); X.oview=O.v; X.ofit=O.f; X.oslot=O.sl; X.oshield=O.sh; X.oovl=O.ov;
  const N=pane('new',''); X.nhead=N.t; X.view=N.v; X.fit=N.f; X.slot=N.sl; X.shield=N.sh; X.ovl=N.ov; N.sh.title=pkt('m.se_ontwerp_hint');
  X.zone=el('div','se-zone',pkt('m.se_nieuw_hier')); X.zone.hidden=true; X.dropbar=el('div','se-dropbar'); X.dropbar.hidden=true; X.dropbar.appendChild(X.zone); N.p.appendChild(X.dropbar); X.below=el('div','se-below'); N.f.appendChild(X.below);
  X.sizer=el('div','se-sizer'); X.sizer.tabIndex=0; X.sizer.setAttribute('role','slider'); X.sizer.setAttribute('aria-orientation','horizontal'); X.sizer.setAttribute('aria-valuemin','200'); X.sizer.setAttribute('aria-valuemax','2000'); X.sizer.setAttribute('aria-label',pkt('m.se_kaartbreedte_sleep')); X.sizer.title=pkt('m.se_kaartbreedte_sleep'); X.sizer.dataset.act='sizer'; X.sizer.appendChild(el('span','se-sizer-g'));
  X.corner=el('div','se-corner'); X.corner.title=pkt('m.se_kaartbreedte_sleep'); X.corner.setAttribute('aria-hidden','true'); X.sbub=el('div','se-sbub'); X.sbub.hidden=true; N.f.append(X.sizer,X.corner,X.sbub);
  X.panes.append(O.p,N.p); st.appendChild(X.panes); mn.append(tw,st,X.props); R.appendChild(mn);
  const bo=el('div','se-bottom'); X.probs=el('ul','se-probs'); X.probs.setAttribute('role','status'); const jw=el('div','se-jsonw'); X.json=el('pre','se-json'); X.json.tabIndex=0; X.json.setAttribute('aria-label','JSON'); const cp=btn(jw,pkt('m.se_kopieer'),()=>{ try{ navigator.clipboard.writeText(X.json.textContent).then(()=>say(pkt('m.se_gekopieerd')),()=>say(pkt('m.se_kopieer_mislukt'),true)); }catch(e){ say(pkt('m.se_kopieer_mislukt'),true); } },{id:'copy'}); jw.append(X.json); bo.append(X.probs,cp,jw); R.appendChild(bo);
  const ft=el('div','se-foot'); X.info=el('div','dz-hint se-info'); X.note=el('div','dz-warn se-note'); X.stat=el('div','dz-hint se-stat'); X.stat.setAttribute('role','status'); X.grip=el('button','se-grip-rz','◢'); X.grip.type='button'; X.grip.title=X.grip.ariaLabel=pkt('m.se_venster_formaat'); X.grip.dataset.act='resize'; ft.append(X.info,X.note,X.stat,X.grip); R.appendChild(ft);
  X.ask=el('div','se-ask'); X.ask.hidden=true; X.ask.setAttribute('role','alertdialog'); R.appendChild(X.ask); return R; }
function guard0(){ const m=E.srcId?(()=>{ const e=PK.skinFind(E.srcId); return e?M.fromSkin(e.skin,e.origin==='user'):null; })():null; E.els.banner.hidden=true; const dev=E.m.dev; if(m){ begin(m,E.srcId,dev); E.els.banner.hidden=true; } else begin(M.emptyModel(dev,''),null,dev); E.els.banner.hidden=true; }
function stageBar(){ const X=E.els, b=el('div','se-sbar');
  const mg=el('span','se-seg'); mg.setAttribute('role','group'); mg.setAttribute('aria-label',pkt('m.se_stand')); const mb={}; const setMode=m=>{ E.view.mode=m; Object.keys(mb).forEach(k=>mb[k].setAttribute('aria-pressed',String(k===m))); X.shield.style.pointerEvents=m==='design'?'auto':'none'; X.root.dataset.mode=m; PK.ske_stage.schedule(); };
  ['design','test'].forEach(m=>{ mb[m]=btn(mg,pkt('m.se_stand_'+m),()=>setMode(m),{id:'mode-'+m}); }); b.appendChild(mg); X.setMode=setMode;
  const wl=el('label','se-wl'); wl.appendChild(document.createTextNode(pkt('m.se_breedte_kort')+' ')); X.cw=document.createElement('input'); X.cw.type='number'; X.cw.min=200; X.cw.max=2000; X.cw.value=412; X.cw.className='small se-cw'; X.cw.setAttribute('aria-label',pkt('m.se_breedte')); X.cw.onchange=()=>PK.ske_stage.setWidth(+X.cw.value||412); wl.appendChild(X.cw);
  X.wsel=document.createElement('select'); X.wsel.className='small'; X.wsel.setAttribute('aria-label',pkt('m.se_breedte')); [['412',pkt('m.se_w_telefoon')+' 412'],['820',pkt('m.se_w_tablet')+' 820'],['1280',pkt('m.se_w_desktop')+' 1280'],['custom',pkt('m.se_w_eigen')]].forEach(([v,t])=>{ const o=el('option',null,t); o.value=v; X.wsel.appendChild(o); });
  X.wsel.onchange=()=>{ if(X.wsel.value==='custom'){ X.cw.focus(); return; } PK.ske_stage.setWidth(+X.wsel.value); }; wl.appendChild(X.wsel); b.appendChild(wl);
  const sc=document.createElement('select'); sc.className='small'; sc.setAttribute('aria-label',pkt('m.se_scherm')); [['auto','m.se_scr_uit_breedte'],['phone','m.se_scr_phone'],['compact','m.se_scr_compact'],['wide','m.se_scr_wide']].forEach(([v,k])=>{ const o=el('option',null,pkt(k)); o.value=v; sc.appendChild(o); }); sc.onchange=()=>{ E.view.scr=sc.value; PK.ske_stage.setWidth(E.view.w); }; b.appendChild(sc);
  const ck=(label,get,set,id)=>{ const l=el('label','se-ck'), c=document.createElement('input'); c.type='checkbox'; c.dataset.act=id; c.checked=get(); c.onchange=()=>set(c.checked); l.append(c,document.createTextNode(' '+label)); b.appendChild(l); };
  ck(pkt('m.se_auto_sim'),()=>E.view.auto,v=>{ E.view.auto=v; PK.ske_stage.preview(); },'auto'); ck(pkt('m.se_orig_tonen'),()=>E.view.orig,v=>{ E.view.orig=v; X.panes.classList.toggle('no-orig',!v); requestAnimationFrame(()=>{ PK.ske_stage.fit(); PK.ske_stage.schedule(); }); },'orig'); return b; }
// ---- toetsen ----
function onKey(e){ if(!E||!E.open) return; const t=e.target, txt=t&&((t.tagName==='INPUT'&&/^(text|number|search)$/.test(t.type))||t.tagName==='TEXTAREA');
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.key==='z'||e.key==='Z'||e.key==='y'||e.key==='Y')){ if(txt) return; e.preventDefault(); e.stopPropagation(); if(e.key==='y'||e.key==='Y'||e.shiftKey) redo(); else undo(); return; }
  if(e.key==='Escape'){ if(!E.els.ask.hidden){ E.els.ask.hidden=true; return; } e.preventDefault(); e.stopPropagation(); requestClose(); return; }
  if(e.key==='Tab'){ const f=[...E.els.root.querySelectorAll('button,select,input,[tabindex="0"],textarea')].filter(x=>!x.disabled&&x.offsetParent!==null&&!x.hidden); if(!f.length) return; const a=f[0], z=f[f.length-1]; if(e.shiftKey&&document.activeElement===a){ z.focus(); e.preventDefault(); } else if(!e.shiftKey&&document.activeElement===z){ a.focus(); e.preventDefault(); } } }
// ---- openen en sluiten ----
function skEditorOpen(dev,src,origin){ if(E&&E.open){ if(dev&&dev!==E.m.dev) switchDev(dev); return; } if(PK.skDesigning&&PK.skDesigning()) PK.skDesignClose(); if(!PK.Host.latest(dev)){ PK.status(pkt('m.sk_apparaat_ontbreekt'),true); return; }
  E=mkE(); PK.ske=E; E.opener=document.activeElement; const R=buildDom(); E.els.back=el('div','skw-back'); E.els.back.setAttribute('aria-hidden','true'); E.els.back.onpointerdown=ev=>{ ev.preventDefault(); R.focus({preventScroll:true}); };
  document.body.append(E.els.back,R); document.documentElement.classList.add('se-open'); E.win=PK.ske_win.attach(R,{handle:E.els.head,grip:E.els.grip,move:E.els.move}); E.win.onResize(()=>{ PK.ske_stage.fit(); PK.ske_stage.schedule(); });
  PK.ske_f.init(E); PK.ske_tree.init(E); PK.ske_stage.init(E); E.edit=edit; E.select=select; E.regs=regs; E.say=say; E.tab=tab; E.m=M.emptyModel(dev,'');
  if(!PK.ske_stage.create(dev)){ close(true); PK.status(pkt('m.sk_apparaat_ontbreekt'),true); return; }
  fillDev(); fillLoad(dev); R.addEventListener('click',e=>{ if(E&&E.swallow>Date.now()&&!e.target.closest('.se-stage')){ e.stopPropagation(); e.preventDefault(); } },true);   // na een tik op het voorbeeld wisselt het tabblad op de telefoon: de losse klik erna mag niets op het nieuwe tabblad raken
  R.addEventListener('keydown',onKey,true); ['keydown','keyup','copy','cut','paste'].forEach(t=>R.addEventListener(t,e=>e.stopPropagation()));   // de toetsen van de werkruimte (Delete, Ctrl+C/V) horen hier niet te werken
  E.onResize=()=>{ PK.ske_stage.fit(); PK.ske_stage.schedule(); }; window.addEventListener('resize',E.onResize);
  E.onDocKey=e=>{ if(!E||!E.open||!E.els.root.isConnected) return; const t=e.target; if(t===document.body||t===document.documentElement){ e.stopPropagation(); E.els.root.focus({preventScroll:true}); if(e.type==='keydown') onKey(e); } }; document.addEventListener('keydown',E.onDocKey,true); document.addEventListener('keyup',E.onDocKey,true);   // het focus kan wegvallen (een knop die uitgaat): toetsen komen dan toch niet in de werkruimte
  E.els.dsel.value=dev; E.els.setMode('design'); const own=src&&origin==='user'; begin(src?M.fromSkin(src,own):M.emptyModel(dev,''),src?src.id:null,dev); PK.ske_stage.setWidth(E.view.w); tab(phone()?'tree':'stage');
  (E.els.name).focus({preventScroll:true}); }
function requestClose(){ guard(()=>close()); }
function close(quick){ if(!E) return; const X=E; X.open=false; clearTimeout(X.timer); clearTimeout(X.ct); window.removeEventListener('resize',X.onResize); document.removeEventListener('keydown',X.onDocKey,true); document.removeEventListener('keyup',X.onDocKey,true); if(X.win) X.win.destroy(); try{ PK.ske_stage.destroy(); }catch(e){ console.warn(e); }
  if(X.els.root) X.els.root.remove(); if(X.els.back) X.els.back.remove(); document.documentElement.classList.remove('se-open'); PK.ske=null; E=null; const o=X.opener; if(o&&o.isConnected&&o.focus){ try{ o.focus({preventScroll:true}); }catch(e){} } if(PK.skUiRefresh) PK.skUiRefresh(); }
PK.skEditorOpen=skEditorOpen; PK.skEditorClose=close; PK.skEditing=()=>!!(E&&E.open);
})(window.__PK);
