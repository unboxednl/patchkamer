// js/skin-editor-forms.js — skin-editor: het eigenschappenformulier per soort (skin, verschijningen, kleuren, poorten, haptiek, paneel, regelaar, meter, pad, schermpje, sectie)
(function(PK){
/* =====================================================================
   SKIN-EDITOR · FORMULIEREN. render(E, box) tekent het formulier voor E.sel. Elke wijziging loopt via E.edit(fn) op E.m (het model); regels staan per laag (ap '*' = skin-niveau).
   Een regelaar toont welke regels er voor gelden ("komt van regel 3") en heeft Maak een regel voor alleen dit element en Verwijder regel.
   ===================================================================== */
const M=PK.skm, F=PK.ske_f, el=F.el;
let E=null;
const pkt=(...a)=>PK.pkt(...a);
const apName=ap=>ap==='*'?pkt('m.se_basis'):((E.m.aps.find(a=>a.id===ap)||{}).name||ap);
const layer=ap=>M.layerMake(E.m,ap), read=ap=>M.layerOf(E.m,ap)||{};
const head=(box,t,sub)=>{ box.appendChild(el('h3','se-h',t)); if(sub) box.appendChild(el('div','dz-hint',sub)); };
const btn=(box,label,fn,o={})=>{ const b=el('button','small',label); b.type='button'; if(o.title) b.title=b.ariaLabel=o.title; if(o.dis) b.disabled=true; if(o.fk) b.dataset.fk=o.fk; b.onclick=fn; box.appendChild(b); return b; };
const setIn=(o,path,v)=>{ let x=o; for(let i=0;i<path.length-1;i++){ if(v===undefined&&!x[path[i]]) return; x=x[path[i]]=x[path[i]]||{}; } if(v===undefined) delete x[path[path.length-1]]; else x[path[path.length-1]]=v; };
const getIn=(o,path)=>path.reduce((x,k)=>x==null?x:x[k],o);
const proxy=(rd,wr)=>new Proxy({},{get:(_,k)=>(rd()||{})[k],set:(_,k,v)=>{ wr()[k]=v; return true; },deleteProperty:(_,k)=>{ delete wr()[k]; return true; }});
const matchRule=(m,d)=>m==='*'||(m.startsWith('role:')?d.role===m.slice(5):m.startsWith('group:')?d.group===m.slice(6):d.id===m);
const regLabel=x=>x.id+(x.label&&x.label!==x.id?' · '+x.label:'');
const isDisp=x=>x.role==='display'||x.role==='select';
// ---- skin en verschijningen ----
function formSkin(box){ const m=E.m; head(box,pkt('m.se_skin'),pkt('m.se_skin_uitleg'));
  F.txt(box,{k:'name',label:pkt('m.dz_naam'),max:60,get:()=>m.name,set:v=>{ E.m.name=v; }}); F.txt(box,{k:'author',label:pkt('m.dz_auteur'),max:60,get:()=>m.author,set:v=>{ E.m.author=v; }});
  if(!m.author.trim()) box.appendChild(el('div','dz-hint',pkt('m.dz_auteur_leeg')));
  F.txt(box,{k:'desc',label:pkt('m.se_omschrijving'),max:300,get:()=>m.description,set:v=>{ E.m.description=v; }});
  F.sel(box,{k:'license',label:pkt('m.se_licentie'),blank:false,get:()=>m.license,set:v=>{ if(v) E.m.license=v; },opts:['CC0-1.0','CC-BY-4.0','CC-BY-SA-4.0','MIT','AGPL-3.0-or-later'].map(x=>[x,x])});
  F.sel(box,{k:'dflt',label:pkt('m.se_standaardvorm'),blank:false,get:()=>m.dflt,set:v=>{ if(v) E.m.dflt=v; },opts:m.aps.map(a=>[a.id,a.name])});
  box.appendChild(el('div','dz-hint',pkt('m.se_id_hint',m.dev.toLowerCase()+'.'+(M.slug(m.name)||'custom')))); }
function formAps(box){ const m=E.m; head(box,pkt('m.se_vormen'),pkt('m.se_vormen_uitleg'));
  const tb=el('div','se-bar'); const ts=document.createElement('select'); ts.className='small'; ts.dataset.fk='tpl'; ts.setAttribute('aria-label',pkt('m.se_sjabloon'));
  M.TPL.forEach(k=>{ const o=el('option',null,pkt('m.se_t_'+k)+' — '+pkt('m.se_td_'+k)); o.value=k; ts.appendChild(o); }); tb.appendChild(ts);
  btn(tb,pkt('m.se_toevoegen'),()=>{ let nid=null; E.edit(()=>{ if(E.m.aps.length>=12) return false; const a=M.template(ts.value,E.m.aps,E.r); E.m.aps.push(a); nid=a.id; }); if(nid) E.select({k:'ap',ap:nid}); },{fk:'tpl-add',dis:m.aps.length>=12}); box.appendChild(tb);
  m.aps.forEach((a,i)=>{ const r=el('div','se-item'); r.append(el('span','se-nm',a.name+(a.id===m.dflt?' ★':'')),el('span','dz-hint',a.id)); const bb=el('span','se-btns');
    btn(bb,'↑',()=>E.edit(()=>{ const x=E.m.aps; [x[i-1],x[i]]=[x[i],x[i-1]]; }),{title:pkt('m.dz_r_omhoog'),dis:i===0}); btn(bb,'↓',()=>E.edit(()=>{ const x=E.m.aps; [x[i+1],x[i]]=[x[i],x[i+1]]; }),{title:pkt('m.dz_r_omlaag'),dis:i===m.aps.length-1});
    btn(bb,'⧉',()=>{ let nid=null; E.edit(()=>{ if(E.m.aps.length>=12) return false; const c=M.clone(a); c.id=M.uniqPid(E.m.aps,(a.id.replace(/-\d+$/,'')+'-copy').slice(0,40)); c.name=(a.name+' '+pkt('m.se_kopie')).slice(0,40); E.m.aps.splice(i+1,0,c); nid=c.id; }); if(nid) E.select({k:'ap',ap:nid}); },{title:pkt('m.se_dupliceer'),dis:m.aps.length>=12});
    btn(bb,'×',()=>{ E.edit(()=>{ if(E.m.aps.length<2) return false; E.m.aps.splice(i,1); if(E.m.dflt===a.id) E.m.dflt=E.m.aps[0].id; }); if(!E.m.aps.some(x=>x.id===E.sel.ap)) E.select({k:'aps'}); },{title:pkt('m.se_vorm_weg'),dis:m.aps.length<2});
    r.appendChild(bb); box.appendChild(r); }); }
function formAp(box,ap){ const a=E.m.aps.find(x=>x.id===ap); if(ap==='*'||!a){ head(box,pkt('m.se_basis'),pkt('m.se_basis_uitleg')); return; } head(box,a.name,pkt('m.se_vorm_hint'));
  F.txt(box,{k:'apname',label:pkt('m.dz_naam'),max:40,get:()=>a.name,set:v=>{ a.name=v.trim()?v.slice(0,40):a.id; }}); F.txt(box,{k:'apdesc',label:pkt('m.se_omschrijving'),max:300,get:()=>a.description||'',set:v=>{ if(v) a.description=v; else delete a.description; }});
  box.appendChild(el('h4',null,pkt('m.se_wanneer'))); box.appendChild(el('div','dz-hint',pkt('m.se_wanneer_uitleg')));
  const W=k=>({k:'w'+k,label:pkt(k==='minWidth'?'m.se_vanaf':'m.se_tot'),min:0,max:10000,get:()=>a.when&&a.when[k],set:v=>{ if(v==null||v<0){ if(a.when){ delete a.when[k]; if(!Object.keys(a.when).length) delete a.when; } } else { a.when=a.when||{}; a.when[k]=v; } }});
  F.num(box,W('minWidth')); F.num(box,W('maxWidth'));
  { const cell=el('div','se-col'); ['phone','compact','wide'].forEach(s=>{ const l=el('label'), c=document.createElement('input'); c.type='checkbox'; c.dataset.fk='scr-'+s; c.checked=!!(a.when&&a.when.screens&&a.when.screens.includes(s)); c.setAttribute('aria-label',pkt('m.se_scr_'+s));
      c.onchange=()=>E.edit(()=>{ const cur=new Set((a.when&&a.when.screens)||[]); if(c.checked) cur.add(s); else cur.delete(s); const arr=['phone','compact','wide'].filter(x=>cur.has(x)); if(arr.length){ a.when=a.when||{}; a.when.screens=arr; } else if(a.when){ delete a.when.screens; if(!Object.keys(a.when).length) delete a.when; } },{form:false});
      l.append(c,document.createTextNode(' '+pkt('m.se_scr_'+s)+'  ')); cell.appendChild(l); }); F.row(box,pkt('m.se_schermen'),cell); }
  if(!a.when) box.appendChild(el('div','dz-hint',pkt('m.sk_alleen_handmatig')));
  box.appendChild(el('h4',null,pkt('m.dz_breedte')));
  F.num(box,{k:'size',label:pkt('m.dz_breedte'),min:200,max:1600,step:10,get:()=>(read(ap).size||{}).width,set:v=>{ if(v>=200&&v<=1600) layer(ap).size={width:v}; else if(layer(ap)) delete layer(ap).size; }}); box.appendChild(el('div','dz-hint',pkt('m.dz_breedte_hint')));
  box.appendChild(el('div','dz-hint',a.css?pkt('m.se_css_aanwezig',a.css.length):pkt('m.se_css_geen'))); }
// ---- kleuren, poorten, haptiek ----
function formColors(box,ap){ const d=()=>layer(ap), rd=()=>read(ap), base=()=>E.m.design; head(box,pkt('m.dz_kleuren'),apName(ap));
  const eff=k=>getIn(rd(),['colors','custom',k])||(ap!=='*'&&getIn(base(),['colors','custom',k]))||null, scheme=()=>getIn(rd(),['colors','scheme'])||(ap!=='*'&&getIn(base(),['colors','scheme']))||'workspace';
  const prefill=()=>{ const r=E.r; if(!r) return; const pr=document.createElement('span'); pr.style.cssText='position:absolute;visibility:hidden;width:0;height:0'; r.el.appendChild(pr); const map={bg:'--card',surface:'--card-2',text:'--fg',muted:'--muted',accent:'--sel',line:'--line'};
    for(const k in map){ if(eff(k)) continue; pr.style.color=''; pr.style.color='var('+map[k]+')'; const mm=/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(pr).color); if(mm) setIn(d(),['colors','custom',k],PK.cpHex([+mm[1],+mm[2],+mm[3]])); } pr.remove(); };
  F.sel(box,{k:'scheme',label:pkt('m.dz_schema'),get:()=>getIn(rd(),['colors','scheme']),opts:[['workspace','m.dz_s_workspace'],['custom','m.dz_s_custom']],blank:ap!=='*',set:v=>{ setIn(d(),['colors','scheme'],v==='workspace'&&ap==='*'?undefined:v); if(v==='custom') prefill(); }});
  if(scheme()!=='custom') return; const note=el('div','dz-warn'); note.setAttribute('role','status');
  const contrast=()=>{ const t=eff('text'), b=eff('bg'), q=t&&b?PK.cpContrast(t,b):null; note.textContent=q&&q<3?pkt('m.dz_contrast',q.toFixed(1)):''; const miss=PK.SK_COLOUR_KEYS.filter(k=>!eff(k)); if(!note.textContent&&miss.length){ note.className='dz-hint'; note.textContent=pkt('m.dz_c_ontbreekt',miss.map(k=>pkt('m.dz_c_'+k)).join(', ')); } else note.className='dz-warn'; };
  PK.SK_COLOUR_KEYS.forEach(k=>F.swatch(box,{k:'col-'+k,label:pkt('m.dz_c_'+k),get:()=>eff(k)||'',set:v=>setIn(d(),['colors','custom',k],v||undefined),none:pkt('m.dz_c_werkruimte'),against:(k==='text'||k==='muted'||k==='accent')?(()=>eff('bg')):null,after:contrast})); box.appendChild(note); contrast(); }
function formPorts(box,ap){ const dv=PK.Host.latest(E.m.dev), jk=!!(dv&&dv.ui&&dv.ui.jacks); head(box,pkt('m.dz_poorten'),apName(ap));
  F.sel(box,{k:'pmode',label:pkt('m.dz_modus'),get:()=>getIn(read(ap),['ports','mode']),opts:[['default','m.dz_p_default'],['always','m.dz_p_always'],['hover','m.dz_p_hover'],['strip','m.dz_p_strip'],['bar','m.dz_p_bar']],disabled:jk,set:v=>setIn(layer(ap),['ports','mode'],v)}); if(jk) box.appendChild(el('div','dz-warn',pkt('m.sk_jacks_paneel'))); }
function formHaptics(box,ap){ head(box,pkt('m.dz_haptiek'),apName(ap)); const lv=[['off','m.dz_h_off'],['light','m.dz_h_light'],['medium','m.dz_h_medium'],['strong','m.dz_h_strong']];
  [['click','m.dz_h_click'],['turn','m.dz_h_turn'],['slide','m.dz_h_slide']].forEach(([k,l])=>F.sel(box,{k:'h'+k,label:pkt(l),get:()=>getIn(read(ap),['haptics',k]),opts:lv,set:v=>setIn(layer(ap),['haptics',k],v)}));
  box.appendChild(el('div','dz-hint',typeof navigator.vibrate==='function'?pkt('m.dz_h_ok'):pkt('m.dz_h_nee'))); }
// ---- indeling: het knooppunt Regelaars en een paneel ----
function itemLabel(it,regs){ if(it==='*') return pkt('m.dz_pn_rest'); if(it.startsWith('group:')) return pkt('m.dz_r_groep_x',it.slice(6)); if(it.startsWith('role:')) return pkt('m.dz_r_rol_x',it.slice(5)); const x=regs.find(y=>y.id===it); return x?regLabel(x):it; }
function formCtls(box,ap){ head(box,pkt('m.se_regelaars'),apName(ap)); box.appendChild(el('div','dz-hint',pkt('m.se_regelaars_uitleg'))); if(E.r) box.appendChild(el('div','dz-hint',PK.pnlText(E.r)));
  const lo=M.layoutOf(E.m,ap), regs=E.regs(); const bar=el('div','se-bar');
  btn(bar,pkt('m.dz_pn_toevoegen'),()=>{ let pid=null; E.edit(()=>{ pid=M.newPanel(E.m,ap); return !!pid; }); if(pid) E.select({k:'panel',ap,pid}); },{fk:'newpanel',dis:lo.panels.length>=16});
  btn(bar,pkt('m.se_genereer'),()=>{ let n=0; E.edit(()=>{ n=M.genLayout(E.m,ap,regs); return n>0; }); },{fk:'gen',title:pkt('m.se_genereer_titel'),dis:!regs.some(x=>x.group)}); box.appendChild(bar);
  if(ap!=='*'){ const own=lo.own; box.appendChild(el('div','dz-hint',own?pkt('m.dz_pn_eigen'):pkt('m.dz_pn_van_skin'))); const b2=el('div','se-bar');
    btn(b2,own?pkt('m.dz_pn_terug'):pkt('m.dz_pn_maak_eigen'),()=>E.edit(()=>{ const d=layer(ap); if(own){ delete d.layout; } else d.layout=M.clone(E.m.design.layout||{panels:[]}); if(d.layout&&!d.layout.panels) d.layout.panels=[]; }),{fk:'own'}); box.appendChild(b2); }
  F.sel(box,{k:'flow',label:pkt('m.dz_pn_flow'),blank:false,get:()=>lo.flow||'auto',opts:[['auto','m.dz_pn_f_auto'],['rows','m.dz_pn_f_rows'],['columns','m.dz_pn_f_columns']],set:v=>{ const l=M.ensureLayout(E.m,ap); if(!v||v==='auto') delete l.flow; else l.flow=v; }}); }
function formPanel(box,ap,pid){ const lo=M.layoutOf(E.m,ap), idx=lo.panels.findIndex(p=>p.id===pid), P=lo.panels[idx]; if(!P){ box.appendChild(el('div','dz-hint',pkt('m.se_niets'))); return; } const regs=E.regs();
  const wr=()=>M.ensureLayout(E.m,ap).panels.find(p=>p.id===pid), px=proxy(()=>M.layoutOf(E.m,ap).panels.find(p=>p.id===pid),wr);
  head(box,pkt('m.dz_pn_n',idx+1)+' · '+pid,apName(ap)); if(ap!=='*'&&!lo.own) box.appendChild(el('div','dz-hint',pkt('m.dz_pn_van_skin')));
  const bar=el('div','se-bar'); btn(bar,'↑ '+pkt('m.dz_r_omhoog'),()=>E.edit(()=>{ const a=M.ensureLayout(E.m,ap).panels; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; }),{dis:idx===0,fk:'pup'}); btn(bar,'↓ '+pkt('m.dz_r_omlaag'),()=>E.edit(()=>{ const a=M.ensureLayout(E.m,ap).panels; [a[idx+1],a[idx]]=[a[idx],a[idx+1]]; }),{dis:idx===lo.panels.length-1,fk:'pdn'});
  btn(bar,'× '+pkt('m.dz_pn_weg'),()=>{ E.edit(()=>{ M.ensureLayout(E.m,ap).panels.splice(idx,1); }); E.select({k:'ctls',ap}); },{fk:'pdel'}); box.appendChild(bar);
  F.txt(box,{k:'pid',label:pkt('m.dz_pn_id'),max:40,get:()=>pid,set:v=>{ const lay=M.ensureLayout(E.m,ap), me=lay.panels.find(p=>p.id===pid); let n=v.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||pid; if(n!==pid&&lay.panels.some(p=>p!==me&&p.id===n)) n=M.uniqPid(lay.panels.filter(p=>p!==me),n); me.id=n; E.sel.pid=n; },only:true});
  const tt=P.title, tl=l=>typeof tt==='string'?tt:(tt&&tt[l])||'', setT=(l,v)=>{ const p=wr(), cur=p.title, o=(cur&&typeof cur==='object')?{...cur}:(typeof cur==='string'&&cur?{nl:cur,en:cur}:{}); if(v) o[l]=v; else delete o[l]; if(Object.keys(o).length) p.title=o; else delete p.title; };
  F.txt(box,{k:'tnl',label:pkt('m.dz_pn_titel_nl'),get:()=>tl('nl'),set:v=>setT('nl',v.trim())}); F.txt(box,{k:'ten',label:pkt('m.dz_pn_titel_en'),get:()=>tl('en'),set:v=>setT('en',v.trim())});
  F.specs(box,px,F.S.panel(P));
  box.appendChild(el('h4',null,pkt('m.dz_pn_items'))); if(!P.items.length) box.appendChild(el('div','dz-hint',pkt('m.dz_pn_leeg')));
  P.items.forEach((it,j)=>{ const r=el('div','se-item'); r.appendChild(el('span','se-nm',itemLabel(it,regs))); const bb=el('span','se-btns'); const mv=d=>E.edit(()=>{ const a=wr().items; [a[j],a[j+d]]=[a[j+d],a[j]]; });
    btn(bb,'↑',()=>mv(-1),{title:pkt('m.dz_r_omhoog'),dis:j===0}); btn(bb,'↓',()=>mv(1),{title:pkt('m.dz_r_omlaag'),dis:j===P.items.length-1}); btn(bb,'×',()=>E.edit(()=>{ wr().items.splice(j,1); }),{title:pkt('m.dz_pn_item_weg')}); r.appendChild(bb); box.appendChild(r); });
  const have=new Set(P.items), ch=PK.pnlChoices(E.r), opts=[]; if(!have.has('*')) opts.push(['*',pkt('m.dz_pn_rest')]); ch.groups.forEach(g=>{ if(!have.has('group:'+g)) opts.push(['group:'+g,pkt('m.dz_r_groep_x',g)]); }); ch.roles.forEach(g=>{ if(!have.has('role:'+g)) opts.push(['role:'+g,pkt('m.dz_r_rol_x',g)]); }); ch.ids.forEach(x=>{ if(!have.has(x.id)) opts.push([x.id,regLabel(x)]); });
  F.sel(box,{k:'additem',label:pkt('m.dz_pn_item_toevoegen'),blank:true,get:()=>'',opts,set:v=>{ if(!v) return false; const a=wr().items; if(a.length>=64||a.includes(v)) return false; a.push(v); }});
  F.txt(box,{k:'ownitem',label:pkt('m.se_eigen_item'),max:61,ph:'id | group:x | role:x',get:()=>'',set:v=>{ v=v.trim(); if(!v||!/^(role:|group:)?[A-Za-z0-9._-]{1,60}$/.test(v)) return false; const a=wr().items; if(a.length<64&&!a.includes(v)) a.push(v); },only:true}); }
// ---- een regelaar, meter, pad of schermpje ----
function chainOf(kind,reg,ap){ const out=[]; const push=(a,arr)=>(arr||[]).forEach((ru,i)=>{ if(matchRule(ru.match,reg)) out.push({ap:a,i,ru}); }); push('*',E.m.design[kind]); if(ap!=='*') push(ap,(read(ap))[kind]); return out; }
function effective(box,chain){ if(!chain.length){ box.appendChild(el('div','dz-hint',pkt('m.se_geen_regel'))); return {}; } const eff={};
  chain.forEach(c=>{ Object.keys(c.ru).forEach(k=>{ if(k!=='match') eff[k]={v:c.ru[k],from:pkt('m.se_regel_van',c.i+1,apName(c.ap),c.ru.match)}; }); });
  const ul=el('div','se-eff'); ul.appendChild(el('div','dz-hint',pkt('m.se_komt_van'))); Object.keys(eff).forEach(k=>ul.appendChild(el('div','se-effl',k+': '+eff[k].v+'  ←  '+eff[k].from))); box.appendChild(ul); return eff; }
function ruleBlocks(box,kind,reg,ap,mkSpecs,own){ const d=read(ap), arr=d[kind]||[], eff=effective(box,chainOf(kind,reg,ap)); const matching=arr.map((ru,i)=>({ru,i})).filter(x=>matchRule(x.ru.match,reg));
  const mine=arr.find(r=>r.match===own);
  if(!mine) btn(box,pkt('m.se_maak_regel'),()=>E.edit(()=>{ const dd=layer(ap), a=dd[kind]=dd[kind]||[]; if(a.length>=64) return false; const seed={}; Object.keys(eff).forEach(k=>{ seed[k]=eff[k].v; }); if(!Object.keys(seed).length) seed.face='default'; a.push({match:own,...seed}); }),{fk:'mkrule',title:pkt('m.se_maak_regel_titel')});
  matching.forEach(({ru,i})=>{ const b=el('div','se-rule'), h=el('div','se-rhead'); h.appendChild(el('span','dz-rn',pkt('m.se_regel_n',i+1)+' · '+ru.match+(ru.match===own?' ★':'')));
    btn(h,'↑',()=>E.edit(()=>{ const a=layer(ap)[kind]; [a[i-1],a[i]]=[a[i],a[i-1]]; }),{title:pkt('m.dz_r_omhoog'),dis:i===0}); btn(h,'↓',()=>E.edit(()=>{ const a=layer(ap)[kind]; [a[i+1],a[i]]=[a[i],a[i+1]]; }),{title:pkt('m.dz_r_omlaag'),dis:i===arr.length-1});
    btn(h,'× '+pkt('m.se_regel_weg'),()=>E.edit(()=>{ layer(ap)[kind].splice(i,1); }),{title:pkt('m.se_regel_weg'),fk:'rmrule'+i}); b.appendChild(h); F.specs(b,ru,mkSpecs(ru),pkt('m.dz_r_n',i+1)); box.appendChild(b); }); }
function sectionBlock(box,g,ap){ const arr=read(ap).sections||[], key='group:'+g; box.appendChild(el('h4',null,pkt('m.se_sectie',g)));
  const ru={group:g}, matching=arr.map((r,i)=>({r,i})).filter(x=>x.r.match===key||x.r.match==='*'); if(!matching.some(x=>x.r.match===key)) btn(box,pkt('m.se_maak_regel'),()=>E.edit(()=>{ const dd=layer(ap), a=dd.sections=dd.sections||[]; if(a.length>=32) return false; a.push({match:key,frame:'line'}); }),{fk:'mksec'});
  matching.forEach(({r,i})=>{ const b=el('div','se-rule'), h=el('div','se-rhead'); h.appendChild(el('span','dz-rn',pkt('m.se_regel_n',i+1)+' · '+r.match)); btn(h,'× '+pkt('m.se_regel_weg'),()=>E.edit(()=>{ layer(ap).sections.splice(i,1); }),{fk:'rmsec'+i}); b.appendChild(h); F.specs(b,r,F.S.sections(),pkt('m.dz_r_n',i+1)); box.appendChild(b); }); }
function padBlock(box,reg,ap){ const o=()=>layer(ap).pads||(layer(ap).pads={}), rd=()=>read(ap).pads||{}; box.appendChild(el('div','dz-hint',pkt('m.se_pads_een')));
  F.specs(box,proxy(rd,o),F.S.pads()); box.appendChild(el('h4',null,pkt('m.dz_p_eigen')));
  [reg.id,...(reg.group?['group:'+reg.group]:[])].forEach(k=>F.swatch(box,{k:'pc-'+k,label:k,get:()=>(rd().colors||{})[k]||'',set:v=>{ setIn(layer(ap),['pads','colors',k],v||undefined); }}));
  const pal=rd().palette||[]; box.appendChild(el('div','dz-hint',pkt('m.dz_p_palet'))); pal.forEach((c,i)=>{ F.swatch(box,{k:'pal'+i,label:pkt('m.dz_p_palet_n',i+1),clearable:false,get:()=>(rd().palette||[])[i],set:v=>{ const q=(rd().palette||[]).slice(); if(v) q[i]=v; setIn(layer(ap),['pads','palette'],q); }}); });
  const bb=el('div','se-bar'); btn(bb,pkt('m.dz_p_palet_plus'),()=>E.edit(()=>{ const q=(rd().palette||[]).slice(); while(q.length<2) q.push('#4fd1c5'); q.push('#e4574a'); setIn(layer(ap),['pads','palette'],q.slice(0,16)); }),{dis:pal.length>=16,fk:'palplus'});
  if(pal.length) btn(bb,pkt('m.dz_r_weg'),()=>E.edit(()=>{ const q=pal.slice(0,-1); setIn(layer(ap),['pads','palette'],q.length>=2?q:undefined); }),{fk:'palmin'}); box.appendChild(bb); }
function displayBlock(box,ap){ const rd=()=>read(ap).display||{}, o=()=>layer(ap).display||(layer(ap).display={}); F.specs(box,proxy(rd,o),F.S.display());
  { const cell=el('div','se-col'); const cur=()=>rd().targets||['select']; ['select','preset','tune'].forEach(t=>{ const l=el('label'), c=document.createElement('input'); c.type='checkbox'; c.dataset.fk='tg-'+t; c.checked=cur().includes(t); c.setAttribute('aria-label',pkt('m.dz_d_t_'+t));
      c.onchange=()=>E.edit(()=>{ let a=cur().slice(); if(c.checked){ if(!a.includes(t)) a.push(t); } else a=a.filter(x=>x!==t); if(!a.length) return false; setIn(layer(ap),['display','targets'],a.length===1&&a[0]==='select'?undefined:a); }); l.append(c,document.createTextNode(' '+pkt('m.dz_d_t_'+t)+'  ')); cell.appendChild(l); }); F.row(box,pkt('m.dz_d_doel'),cell); }
  F.swatch(box,{k:'dcol',label:pkt('m.dz_d_eigenkleur'),get:()=>/^#/.test(rd().color||'')?rd().color:'',set:v=>setIn(layer(ap),['display','color'],v||undefined)}); }
function formCtl(box,ap,id){ const regs=E.regs(), reg=regs.find(x=>x.id===id); if(!reg){ head(box,id||pkt('m.se_zonder_id'),null); box.appendChild(el('div','dz-hint',pkt('m.se_ctl_zonder_id'))); return; }
  head(box,regLabel(reg),pkt('m.se_ctl_kop',reg.role,reg.group||'-',reg.type)); const lo=M.layoutOf(E.m,ap), A=M.assign(lo.panels,regs), q=A.get(id);
  { const opts=[['',pkt('m.se_rest')],...lo.panels.map((p,i)=>[String(i),p.id+(typeof p.title==='string'&&p.title?' · '+p.title:(p.title&&(p.title[PK.PK_LANG]||p.title.nl))?' · '+(p.title[PK.PK_LANG]||p.title.nl):'')])];
    F.sel(box,{k:'moveto',label:pkt('m.se_naar_paneel'),blank:false,opts,get:()=>q&&!q.star?String(q.pi):'',set:v=>{ const r=M.moveCtl(E.m,ap,regs,id,v===''||v==null?null:+v,null); return r?undefined:false; }}); }
  if(reg.role==='meter') ruleBlocks(box,'meters',reg,ap,F.S.meters,id);
  else if(reg.role==='pad'||reg.role==='step') padBlock(box,reg,ap);
  else if(isDisp(reg)) displayBlock(box,ap);
  else if(reg.type==='range') ruleBlocks(box,'controls',reg,ap,F.S.controls,id);
  else box.appendChild(el('div','dz-hint',pkt('m.se_alleen_register')));
  if(reg.group) sectionBlock(box,reg.group,ap); }
function formGroup(box,ap,g){ head(box,pkt('m.dz_r_groep_x',g),pkt('m.se_groep_uitleg')); sectionBlock(box,g,ap); }
function render(e,box){ E=e; F.init(e); const s=e.sel; box.innerHTML='';
  switch(s.k){ case 'skin': formSkin(box); break; case 'aps': formAps(box); break; case 'ap': formAp(box,s.ap); break; case 'colors': formColors(box,s.ap); break; case 'ports': formPorts(box,s.ap); break; case 'haptics': formHaptics(box,s.ap); break;
    case 'ctls': case 'rest': formCtls(box,s.ap); break; case 'panel': formPanel(box,s.ap,s.pid); break; case 'ctl': formCtl(box,s.ap,s.id); break; case 'group': formGroup(box,s.ap,s.g); break; default: formSkin(box); } }
// Delete op de selectie: de eigen regel van dit element (of het paneel); nooit het element zelf
function removeRule(e){ E=e; const s=e.sel; if(s.k==='panel'){ e.edit(()=>{ const lay=M.ensureLayout(e.m,s.ap), i=lay.panels.findIndex(p=>p.id===s.pid); if(i<0) return false; lay.panels.splice(i,1); }); e.select({k:'ctls',ap:s.ap}); return true; }
  if(s.k==='ctl'||s.k==='group'){ const key=s.k==='group'?'group:'+s.g:s.id, d=M.layerOf(e.m,s.ap)||{}, kinds=s.k==='group'?['sections']:['controls','meters']; let hit=false;
    kinds.forEach(kd=>{ if((d[kd]||[]).some(r=>r.match===key)) hit=true; }); const pc=d.pads&&d.pads.colors&&d.pads.colors[key]; if(!hit&&!pc) return false;
    e.edit(()=>{ const dd=M.layerMake(e.m,s.ap); kinds.forEach(kd=>{ if(dd[kd]) dd[kd]=dd[kd].filter(r=>r.match!==key); }); if(pc) delete dd.pads.colors[key]; }); return true; }
  return false; }
PK.ske_forms={render,removeRule,regLabel,itemLabel};
})(window.__PK);
