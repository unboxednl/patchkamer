// js/skin-editor-tree.js — skin-editor: de structuurboom (role=tree, toetsenbord, slepen met pointer events) en de gedeelde sleephulp voor boom en voorbeeld
(function(PK){
/* =====================================================================
   SKIN-EDITOR · BOOM EN SLEPEN. De boom: Skin > Verschijningen > per verschijning Kleuren, Poorten, Haptiek en Regelaars (panelen met regelaars, of zonder indeling de groepen van het apparaat).
   Slepen werkt met pointer events (muis en aanraking, geen HTML5-DnD): een regelaar of paneel pakken aan het handvat (⠿) en loslaten op een paneel, een regelaar of 'Nieuw paneel'; Escape annuleert.
   De sleephulp (`drag`) is gedeeld met het voorbeeld (js/skin-editor-stage.js): wie sleept geeft een functie (x,y) -> doel of null; doel = {t:'in',pi,beforeId}|{t:'rest'}|{t:'newpanel'}|{t:'panelpos',pid,after} + rect voor de markering.
   ===================================================================== */
const M=PK.skm, F=PK.ske_f, el=F.el;
let E=null, nodeMap=new Map(), cap=80, roots=[];
const pkt=(...a)=>PK.pkt(...a);
const keyOf=s=>({skin:()=>'skin',aps:()=>'aps',ap:()=>'ap:'+s.ap,colors:()=>'colors:'+s.ap,ports:()=>'ports:'+s.ap,haptics:()=>'haptics:'+s.ap,ctls:()=>'ctls:'+s.ap,rest:()=>'rest:'+s.ap,panel:()=>'pn:'+s.ap+':'+s.pid,group:()=>'g:'+s.ap+':'+(s.g||''),display:()=>'d:'+s.ap+':'+s.kind,ctl:()=>'c:'+s.ap+':'+s.id,domall:()=>'dom:'+s.ap,dom:()=>'e:'+s.ap+':'+(s.ri||0)+':'+(s.key||''),decor:()=>'dc:'+s.ap+':'+s.id}[s.k]||(()=>'skin'))();
const curAp=()=>E.sel.ap||(E.r?PK.ske_stage.workAp():'*');   // zonder keuze: de laag die het voorbeeld toont
const defOpen=k=>{ const ap=curAp(); return k==='skin'||k==='aps'||k==='ap:'+ap||k==='dom:'+ap; };
const isOpen=n=>E.exp.has(n.key)?E.exp.get(n.key):(n.dom?n.depth<2:(defOpen(n.key)||(n.leaves<=40&&n.key.split(':')[1]===curAp()&&n.key.split(':')[0]!=='ctls')));
function leaf(ap,x,pi){ return {key:'c:'+ap+':'+x.id,label:PK.ske_forms.regLabel(x),sel:{k:'ctl',ap,id:x.id},drag:{t:'ctl',id:x.id,ap},pi,id:x.id,role:x.role}; }
function ctlsNodes(ap){ const regs=E.regs(), lo=M.layoutOf(E.m,ap), A=M.assign(lo.panels,regs), kids=[];
  if(lo.panels.length){ lo.panels.forEach((P,pi)=>{ const ls=regs.filter(x=>{ const q=A.get(x.id); return q&&q.pi===pi; }).map(x=>leaf(ap,x,pi)); const t=typeof P.title==='string'?P.title:(P.title&&(P.title[PK.PK_LANG]||P.title.nl))||'';
      kids.push({key:'pn:'+ap+':'+P.id,label:P.id+(t?' · '+t:'')+(P.items.length?'':' ('+pkt('m.se_leeg')+')'),sel:{k:'panel',ap,pid:P.id},drag:{t:'panel',pid:P.id,ap},pi,panel:true,children:ls,leaves:ls.length}); });
    const rest=regs.filter(x=>!A.get(x.id)).map(x=>leaf(ap,x,null)); if(rest.length||true) kids.push({key:'rest:'+ap,label:pkt('m.se_rest'),sel:{k:'rest',ap},pi:null,rest:true,children:rest,leaves:rest.length}); }
  else { const gs=[...new Set(regs.map(x=>x.group||''))]; gs.forEach(g=>{ const ls=regs.filter(x=>(x.group||'')===g).map(x=>leaf(ap,x,undefined)); kids.push({key:'g:'+ap+':'+g,label:g?pkt('m.dz_r_groep_x',g):pkt('m.se_zonder_groep'),sel:g?{k:'group',ap,g}:{k:'ctls',ap},children:ls,leaves:ls.length,group:true}); }); }
  { const hd=E.r?PK.ske_stage.displays(E.r).filter(d=>d.kind!=='select'):[]; const seen=new Set(); hd.forEach(d=>{ if(seen.has(d.kind)) return; seen.add(d.kind); kids.push({key:'d:'+ap+':'+d.kind,label:pkt('m.se_dsp_kop',pkt('m.dz_d_t_'+d.kind)),sel:{k:'display',ap,kind:d.kind},leaves:0}); }); }
  return kids; }
// ---- de opbouw van de kaart (skins 0.9): de elementen die de kaart echt tekent, uitgelezen uit de voorbeeldkaart, met het toegevoegde decor van deze laag ----
function scanGet(){ if(!E.r) return null; try{ E.scan=PK.skScan(E.r); }catch(e){ E.scan={roots:[],count:0,truncated:false}; } return E.scan; }
const tagName=n=>n.tag+(n.label?' · '+n.label:'');
function domKids(ap){ const sc=scanGet(), kids=[]; if(!sc) return kids; let uid=0;
  const dl=PK.ske_forms.decorList(ap,E); if(dl.length) kids.push({key:'dcs:'+ap,label:pkt('m.se_dc_toegevoegd_kop'),sel:{k:'domall',ap},leaves:dl.length,showcount:true,children:dl.map(x=>({key:'dc:'+ap+':'+x.id,label:PK.ske_forms.decorLabel(x),sel:{k:'decor',ap,id:x.id},leaves:0,dom:true,depth:9}))});
  const conv=(n,depth)=>({key:'e:'+ap+':'+n.ri+':'+(n.key||('~'+(uid++))),label:tagName(n),sel:{k:'dom',ap,ri:n.ri,key:n.key},children:n.kids.map(c=>conv(c,depth+1)),leaves:0,dom:true,depth,kind:n.kind});
  sc.roots.forEach(rt=>{ if(sc.roots.length>1) kids.push({key:'er:'+ap+':'+rt.ri,label:pkt('m.se_wortel',rt.ri+1),sel:{k:'domall',ap},children:rt.kids.map(c=>conv(c,1)),leaves:0,dom:true,depth:0}); else rt.kids.forEach(c=>kids.push(conv(c,0))); });
  return kids; }
function build(){ const m=E.m, aps=['*',...m.aps.map(a=>a.id)], name=ap=>ap==='*'?pkt('m.se_basis'):(m.aps.find(a=>a.id===ap)||{}).name;
  const apNodes=aps.map(ap=>{ const ch=[{key:'colors:'+ap,label:pkt('m.dz_kleuren'),sel:{k:'colors',ap}},{key:'ports:'+ap,label:pkt('m.dz_poorten'),sel:{k:'ports',ap}},{key:'haptics:'+ap,label:pkt('m.dz_haptiek'),sel:{k:'haptics',ap}}];
    { const dk=ap===curAp()?domKids(ap):[]; ch.push({key:'dom:'+ap,label:pkt('m.se_opbouw'),sel:{k:'domall',ap},children:dk,leaves:E.scan?E.scan.count:0,showcount:true,dom:false}); }
    const kids=ctlsNodes(ap); ch.push({key:'ctls:'+ap,label:pkt('m.se_regelaars'),sel:{k:'ctls',ap},children:kids,leaves:kids.reduce((n,x)=>n+(x.leaves||0),0),newzone:true});
    return {key:'ap:'+ap,label:name(ap)+(ap===m.dflt?' ★':''),sel:{k:'ap',ap},children:ch,leaves:0}; });
  return [{key:'skin',label:(m.name||'—'),sel:{k:'skin'},children:[{key:'aps',label:pkt('m.se_vormen'),sel:{k:'aps'},children:apNodes,leaves:0}],leaves:0}]; }
function index(nodes,parent){ nodes.forEach(n=>{ nodeMap.set(n.key,n); n.parent=parent; if(n.children) index(n.children,n); }); }
// de boom klapt open tot het geselecteerde knooppunt en houdt het zichtbaar (ook voorbij de eerste 80 regelaars van een lijst)
function reveal(sel){ const n=nodeMap.get(keyOf(sel)); if(!n) return false; for(let p=n.parent;p;p=p.parent) E.exp.set(p.key,true);
  if(n.id&&n.parent){ const need=n.parent.children.slice(0,n.parent.children.indexOf(n)+1).filter(c=>c.id).length; if(need>cap) E.capOver.set(n.parent.key,need); } return true; }
function draw(o){ o=o||{}; const box=E.els.tree; const had=box.contains(document.activeElement), fk=had&&document.activeElement.dataset?document.activeElement.dataset.key:null; box.innerHTML=''; nodeMap=new Map(); roots=build(); index(roots,null);
  if(o.reveal) reveal(E.sel); const cur=keyOf(E.sel); const ul=el('ul'); ul.setAttribute('role','tree'); ul.setAttribute('aria-label',pkt('m.se_structuur')); box.appendChild(ul);
  const walk=(n,par,lvl,parent)=>{ const li=el('li'); li.setAttribute('role','treeitem'); li.setAttribute('aria-level',lvl); const kids=(n.children||[]); const open=kids.length?isOpen(n):false; if(kids.length) li.setAttribute('aria-expanded',String(open));
    const row=el('div','se-trow'+(n.key===cur?' on':'')); row.dataset.key=n.key; row.tabIndex=(fk?n.key===fk:n.key===cur)?0:-1; li.setAttribute('aria-selected',String(n.key===cur)); row.style.paddingLeft=(6+(lvl-1)*14)+'px';
    const tg=el('span','se-tg',kids.length?(open?'▾':'▸'):''); tg.onclick=e=>{ e.stopPropagation(); E.exp.set(n.key,!open); draw(); }; row.appendChild(tg);
    if(n.drag){ const g=el('span','se-grip','⠿'); g.title=pkt('m.se_sleep'); g.setAttribute('aria-hidden','true'); g.onpointerdown=ev=>startTree(ev,n); row.appendChild(g); }
    row.appendChild(el('span','se-lb',n.label)); if(n.leaves!=null&&(n.panel||n.group||n.rest||n.newzone||n.showcount)) row.appendChild(el('span','se-ct',String(n.leaves)));
    row.onmouseenter=()=>PK.ske_stage.hoverNode(n); row.onmouseleave=()=>PK.ske_stage.hoverNode(null); row.onclick=()=>{ E.select(n.sel,{fromTree:true}); }; row.ondblclick=()=>{ if(n.panel) rename(); }; li.appendChild(row);
    if(kids.length&&open){ const sub=el('ul'); sub.setAttribute('role','group'); let shown=0; const lim=E.capOver.get(n.key)||cap; kids.forEach(k=>{ if(!k.panel&&!k.group&&!k.rest&&k.id&&shown>=lim){ return; } if(k.id) shown++; walk(k,sub,lvl+1,n); }); const hidden=kids.filter(k=>k.id).length-shown; if(hidden>0){ const m2=el('li'); m2.appendChild(el('div','se-more','… +'+hidden)); m2.setAttribute('role','none'); sub.appendChild(m2); } li.appendChild(sub); }
    par.appendChild(li); };
  roots.forEach(n=>walk(n,ul,1,null));
  if(!ul.querySelector('[tabindex="0"]')){ const r=ul.querySelector('.se-trow'); if(r) r.tabIndex=0; }
  if(had||o.focus){ const f=box.querySelector('[data-key="'+((o.focus?cur:fk)||cur).replace(/"/g,'\\"')+'"]'); if(f) f.focus({preventScroll:true}); }
  if(o.reveal){ const on=box.querySelector('.se-trow.on'); if(on) on.scrollIntoView({block:'nearest'}); }
  tools(); }
function rows(){ return [...E.els.tree.querySelectorAll('.se-trow')]; }
function onKey(e){ const row=e.target.closest&&e.target.closest('.se-trow'); if(!row) return; const rs=rows(), i=rs.indexOf(row), n=nodeMap.get(row.dataset.key); let t=null;
  if(e.key==='ArrowDown') t=rs[i+1]; else if(e.key==='ArrowUp') t=rs[i-1]; else if(e.key==='Home') t=rs[0]; else if(e.key==='End') t=rs[rs.length-1];
  else if(e.key==='ArrowRight'){ if(n.children&&n.children.length&&!isOpen(n)){ E.exp.set(n.key,true); draw(); e.preventDefault(); return; } t=rs[i+1]; }
  else if(e.key==='ArrowLeft'){ if(n.children&&n.children.length&&isOpen(n)){ E.exp.set(n.key,false); draw(); e.preventDefault(); return; } t=n.parent&&rs.find(r=>r.dataset.key===n.parent.key); }
  else if(e.key==='Enter'||e.key===' '){ E.select(n.sel,{fromTree:true}); e.preventDefault(); return; }
  else if(e.key==='F2'){ if(n.panel){ E.select(n.sel,{fromTree:true,stay:true}); rename(); e.preventDefault(); } return; }
  else if(e.key==='Delete'||e.key==='Backspace'){ if(PK.ske_forms.removeRule(E)) e.preventDefault(); return; }
  if(t){ e.preventDefault(); const nn=nodeMap.get(t.dataset.key); E.select(nn.sel,{focusKey:t.dataset.key,stay:true,fromTree:true}); } }
// ---- slepen ----
let G=null;
function drag(ev,what,resolve,o){ if(G) return; const touch=ev.pointerType==='touch'; G={what,resolve,x0:ev.clientX,y0:ev.clientY,on:false,t:null,touchHold:touch&&!!(o&&o.hold)};
  const mk=()=>{ if(G.ghost) return; if(o&&o.onStart) o.onStart(); G.ghost=el('div','se-ghost',what.label||''); G.mark=el('div','se-mark'); document.body.append(G.ghost,G.mark); document.documentElement.classList.add('se-dragging'); };
  const mv=e=>{ if(!G) return; if(!G.on){ const dd=Math.hypot(e.clientX-G.x0,e.clientY-G.y0); if(G.touchHold){ if(dd>10){ clearTimeout(G.t0); end(false); } return; } if(dd<4) return; G.on=true; } mk(); G.ghost.style.left=(e.clientX+12)+'px'; G.ghost.style.top=(e.clientY+12)+'px'; const t=resolve(e.clientX,e.clientY); G.t=t;
    if(t&&t.rect){ const r=t.rect; Object.assign(G.mark.style,{display:'block',left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'}); G.mark.className='se-mark'+(t.fill?' fill':''); } else if(G.mark) G.mark.style.display='none'; if(G.ghost) G.ghost.classList.toggle('no',!t); e.preventDefault(); };
  const end=ok=>{ if(!G) return; const g=G; G=null; window.removeEventListener('pointermove',mv,true); window.removeEventListener('pointerup',up,true); window.removeEventListener('pointercancel',cx,true); window.removeEventListener('keydown',kd,true); window.removeEventListener('touchmove',tm,{capture:true});
    document.documentElement.classList.remove('se-dragging'); clearTimeout(g.t0); if(g.ghost){ g.ghost.remove(); g.mark.remove(); if(o&&o.onEnd) o.onEnd(); } if(g.on&&ok&&g.t&&o&&o.drop) o.drop(g.what,g.t); else if(!g.on&&ok&&o&&o.click) o.click(); };
  const up=e=>{ if(G) mv(e); end(true); }, cx=()=>end(false), kd=e=>{ if(e.key==='Escape'){ e.stopPropagation(); e.preventDefault(); end(false); } }, tm=e=>{ if(G&&G.on&&e.cancelable) e.preventDefault(); };
  window.addEventListener('pointermove',mv,true); window.addEventListener('pointerup',up,true); window.addEventListener('pointercancel',cx,true); window.addEventListener('keydown',kd,true); window.addEventListener('touchmove',tm,{capture:true,passive:false});
  if(G.touchHold){ G.t0=setTimeout(()=>{ if(G&&!G.on){ G.on=true; mk(); G.ghost.style.left=(G.x0+12)+'px'; G.ghost.style.top=(G.y0+12)+'px'; } },o.hold); } }
const R=r=>({x:r.left,y:r.top,w:r.width,h:r.height});
function treeTarget(what){ return (x,y)=>{ const row=document.elementFromPoint(x,y); const r0=row&&row.closest&&row.closest('.se-trow'); if(!r0||!E.els.tree.contains(r0)) return null; const n=nodeMap.get(r0.dataset.key); if(!n) return null; const rc=r0.getBoundingClientRect(), top=y<rc.top+rc.height/2, ap=what.ap;
    if(what.t==='ctl'){ if(n.sel.ap!==ap&&n.sel.ap!==undefined) return null; if(n.newzone||n.key==='ctls:'+ap) return {t:'newpanel',rect:R(rc),fill:true};
      if(n.panel) return {t:'in',pi:n.pi,beforeId:null,rect:R(rc),fill:true}; if(n.rest) return {t:'rest',rect:R(rc),fill:true};
      if(n.id&&n.pi!=null){ if(top) return {t:'in',pi:n.pi,beforeId:n.id,rect:{x:rc.left,y:rc.top-1,w:rc.width,h:2}}; const sib=n.parent.children, k=sib.indexOf(n), nx=sib.slice(k+1).find(s=>s.id); return {t:'in',pi:n.pi,beforeId:nx?nx.id:null,rect:{x:rc.left,y:rc.bottom-1,w:rc.width,h:2}}; }
      if(n.id&&n.pi===null) return {t:'rest',rect:R(rc),fill:true}; return null; }
    if(what.t==='panel'){ if(!n.panel||n.sel.ap!==ap||n.sel.pid===what.pid) return null; return {t:'panelpos',pid:n.sel.pid,after:!top,rect:{x:rc.left,y:top?rc.top-1:rc.bottom-1,w:rc.width,h:2}}; }
    return null; }; }
function startTree(ev,n){ ev.preventDefault(); ev.stopPropagation(); const what={...n.drag,label:n.label}; try{ ev.currentTarget.setPointerCapture(ev.pointerId); }catch(e){} drag(ev,what,(x,y)=>treeTarget(what)(x,y)||PK.ske_stage.target(what)(x,y),{onStart:()=>PK.ske_stage.dragState(true,what),onEnd:()=>PK.ske_stage.dragState(false,what),drop:(w,t)=>apply(w,t),click:()=>E.select(n.sel,{fromTree:true})}); }
// ---- toepassen: één bewerking = één geschiedenisstap ----
function apply(what,t){ const ap=what.ap; if(what.t==='ctl'){ let made=null;
    const ok=E.edit(()=>{ const regs=E.regs(); let pi=t.t==='in'?t.pi:null; if(t.t==='newpanel'){ made=M.newPanel(E.m,ap); if(!made) return false; pi=M.layoutOf(E.m,ap).panels.length-1; }
      return M.moveCtl(E.m,ap,regs,what.id,pi,t.t==='in'?t.beforeId:null)?undefined:false; });
    if(!ok){ E.say(pkt('m.se_sleep_mislukt')); return; } if(made) E.say(pkt('m.se_nieuw_paneel',made)); E.select({k:'ctl',ap,id:what.id}); }
  else if(what.t==='panel'){ E.edit(()=>{ const P=M.ensureLayout(E.m,ap).panels, i=P.findIndex(p=>p.id===what.pid); let j=P.findIndex(p=>p.id===t.pid); if(i<0||j<0) return false; const [x]=P.splice(i,1); j=P.findIndex(p=>p.id===t.pid); P.splice(t.after?j+1:j,0,x); }); } }
// ---- gereedschap boven de boom: paneel toevoegen, verplaatsen, verwijderen, titel wijzigen ----
const selPanel=()=>E.sel.k==='panel'?E.sel:null;
function addPanel(){ const ap=E.sel.ap||PK.ske_stage.workAp(); let pid=null; E.edit(()=>{ pid=M.newPanel(E.m,ap); return !!pid; }); if(pid){ E.select({k:'panel',ap,pid},{fromTree:true,reveal:true,stay:true}); E.say(pkt('m.se_nieuw_paneel',pid)); } else E.say(pkt('m.se_sleep_mislukt')); }
function movePanel(d){ const s=selPanel(); if(!s) return; E.edit(()=>{ const a=M.ensureLayout(E.m,s.ap).panels, i=a.findIndex(p=>p.id===s.pid), j=i+d; if(i<0||j<0||j>=a.length) return false; [a[i],a[j]]=[a[j],a[i]]; }); }
function delPanel(){ const s=selPanel(); if(!s) return; E.edit(()=>{ const lay=M.ensureLayout(E.m,s.ap), i=lay.panels.findIndex(p=>p.id===s.pid); if(i<0) return false; lay.panels.splice(i,1); }); E.select({k:'ctls',ap:s.ap},{fromTree:true,reveal:true,stay:true}); }
function rename(){ if(!selPanel()) return; if(matchMedia('(max-width:899px)').matches) E.tab('props'); const f=E.els.props.querySelector('[data-fk='+(PK.PK_LANG==='en'?'ten':'tnl')+']'); if(f){ f.focus(); f.select&&f.select(); } }
function tools(){ const b=E.els.ttools; if(!b) return; const s=selPanel(), ap=E.sel.ap||PK.ske_stage.workAp(), lo=M.layoutOf(E.m,ap), i=s?lo.panels.findIndex(p=>p.id===s.pid):-1;
  const set=(a,dis)=>{ const x=b.querySelector('[data-act='+a+']'); if(x) x.disabled=!!dis; }; set('pn-add',lo.panels.length>=16); set('pn-up',!s||i<=0); set('pn-down',!s||i<0||i>=lo.panels.length-1); set('pn-del',(!s||i<0)&&E.sel.k!=='decor'); set('pn-ren',!s||i<0); const n=PK.ske_forms.decorList(ap,E).length; ['label','box','line'].forEach(t=>set('dc-'+t,n>=32)); }
function buildTools(){ const b=E.els.ttools; b.innerHTML=''; const mk=(act,txt,title,fn)=>{ const x=el('button','small',txt); x.type='button'; x.dataset.act=act; x.title=x.ariaLabel=title; x.onclick=fn; b.appendChild(x); return x; };
  mk('pn-add','+ '+pkt('m.se_paneel'),pkt('m.dz_pn_toevoegen'),addPanel); mk('pn-up','↑',pkt('m.dz_r_omhoog'),()=>movePanel(-1)); mk('pn-down','↓',pkt('m.dz_r_omlaag'),()=>movePanel(1)); mk('pn-ren','✎',pkt('m.se_hernoem'),rename); mk('pn-del','×',pkt('m.dz_pn_weg'),()=>{ if(selPanel()) delPanel(); else PK.ske_forms.removeRule(E); });
  ['label','box','line'].forEach(t=>mk('dc-'+t,'+ '+pkt('m.se_dc_'+t),pkt('m.se_dc_toevoegen_titel'),()=>PK.ske_forms.addDecor(t,E.sel))); b.setAttribute('role','toolbar'); b.setAttribute('aria-label',pkt('m.se_boom_gereedschap')); }
function init(e){ E=e; F.init(e); if(!e.capOver) e.capOver=new Map(); e.els.tree.onkeydown=onKey; buildTools(); }
function label(){ const r=E.els.tree.querySelector('[data-key="skin"] .se-lb'); if(r) r.textContent=E.m.name||'—'; tools(); }   // alleen de naam van de skin veranderde: de boom blijft staan (een klik die net begon, gaat niet verloren)
PK.ske_tree={init,draw,drag,apply,keyOf,R,treeTarget,reveal,label};
})(window.__PK);
