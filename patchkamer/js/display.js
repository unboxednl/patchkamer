// js/display.js — host.ui.display (contract v1.22): keuzelijst met een schermpje (lcd, oled, segment, paper) met < > en [ok], vergroten tot een paneel; design.display (skins 0.6) voor host.ui.select, host.ui.display en de kaartkop (preset, tune)
(function(PK){
/* =====================================================================
   SCHERMPJE · het MODEL blijft een verborgen <select>: de waarde gaat via select.value + een input- en change-gebeurtenis, dus bestaande code, host.controls en host.ui.list merken niets.
   Zonder skin (of met style dropdown) is de DOM identiek aan host.ui.select: displayAttach registreert alleen het select-element. Met een skin (r.skDsp) komt er een eigen element naast de select te staan en wordt de select verborgen (inline display:none, weer teruggezet).
   Het schermpje is een role=combobox met echte knoppen < en > (aria-label); een klik opent een zwevend paneel (lijst, zoekveld vanaf searchAt, grote < >, OK/Annuleren, Escape, toetsenbord) in document.body: op een brede pagina bewust NIET gemaximaliseerd (min(32rem, 100% - 2rem) bij min(70vh, 28rem)), op PK.PKT.narrow bijna volledig scherm.
   Eén waarde-hook per select (value en selectedIndex op het exemplaar, gezet zolang er een schermpje is) en één MutationObserver op de opties; geen rAF of timer. Kaartkop: PK.displayAttach(select, {kind:'preset'|'tune', prev, next}) vanuit tunes.js; de knoppen .pp/.pn blijven de bestaande handlers gebruiken.
   ===================================================================== */
const DSP=new Set(); PK.DSP=DSP;
const STYLES=['dropdown','lcd','oled','segment','paper'];
PK.DSP_STYLES=STYLES;
let PANEL=null;
const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };

// ---- stijl: het gezicht per wortel (document of shadow root), het paneel in het document ----
const CSS=`
.pk-dsp{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto auto;gap:3px;align-items:stretch;min-width:0;box-sizing:border-box;font-family:system-ui,sans-serif}
.pk-dsp-b{box-sizing:border-box;min-width:24px;margin:0;padding:0 7px;border:1px solid var(--line,#3a404a);border-radius:4px;background:var(--card-2,var(--panel-2,#1c2027));color:var(--fg,#dddddd);font:700 14px/1 system-ui,sans-serif;cursor:pointer}
.pk-dsp-b:disabled{opacity:.35;cursor:default}
.pk-dsp-b:focus-visible,.pk-dsp-scr:focus-visible{outline:2px solid var(--sel,#4ea8ff);outline-offset:1px}
.pk-dsp-b.t{font-size:11px;letter-spacing:.04em}
.pk-dsp-scr,.pk-dsp-big{box-sizing:border-box;min-width:0;max-width:100%;padding:3px 8px;border:1px solid var(--line,#3a404a);border-radius:4px;overflow:hidden;font:600 12px/1.3 ui-monospace,Consolas,"DejaVu Sans Mono",monospace;text-align:left;position:relative}
.pk-dsp-scr{width:var(--pk-dsp-w,auto);cursor:pointer;justify-self:start;display:grid;align-content:center}
.pk-dsp[data-pk-dw] .pk-dsp-scr{width:var(--pk-dsp-w)}
.pk-dsp:not([data-pk-dw]) .pk-dsp-scr{width:100%}
.pk-dsp-ln{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:1.3em}
.pk-dsp-ln.g{opacity:.45;font-size:.85em}
.pk-dsp-scr.pk-pending{border-style:dashed;font-style:italic}
[data-pk-dstyle=lcd] .pk-dsp-scr,.pk-dsp-big[data-pk-dstyle=lcd]{background:linear-gradient(#c3d2ab,#a8ba90);color:var(--pk-dsp-col,#1d2a12);border-color:#5b6a44;box-shadow:inset 0 1px 4px rgba(0,0,0,.4);text-shadow:1px 1px 0 rgba(255,255,255,.2)}
[data-pk-dstyle=oled] .pk-dsp-scr,.pk-dsp-big[data-pk-dstyle=oled]{background:#000;color:var(--pk-dsp-col,#9be7ff);border-color:#1f2c33;text-shadow:0 0 6px color-mix(in srgb,var(--pk-dsp-col,#9be7ff) 55%,transparent);font-weight:500;letter-spacing:.02em}
[data-pk-dstyle=segment] .pk-dsp-scr,.pk-dsp-big[data-pk-dstyle=segment]{background:#130806;color:var(--pk-dsp-col,#ff4a2a);border-color:#3b1b14;text-transform:uppercase;letter-spacing:.14em;text-shadow:0 0 5px color-mix(in srgb,var(--pk-dsp-col,#ff4a2a) 70%,transparent);font-weight:700}
[data-pk-dstyle=paper] .pk-dsp-scr,.pk-dsp-big[data-pk-dstyle=paper]{background:#f4efe1;color:var(--pk-dsp-col,#2b2418);border-color:#c9bd9c;font-family:Georgia,"Times New Roman",serif;font-weight:600;box-shadow:0 1px 0 rgba(0,0,0,.25)}
.pk-dsp-bd{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:1rem;box-sizing:border-box;background:var(--scrim,rgba(0,0,0,.55))}
.pk-dsp-bd.narrow{padding:.5rem}
.pk-dsp-pn{box-sizing:border-box;width:min(32rem,calc(100% - 2rem));height:min(70vh,28rem);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:8px;padding:10px;background:var(--card,#1c2027);color:var(--fg,#dddddd);border:1px solid var(--line,#3a404a);border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.55);font:13px/1.35 system-ui,sans-serif}
.pk-dsp-bd.narrow .pk-dsp-pn{width:100%;height:calc(100dvh - 1rem);max-height:100%}
.pk-dsp-hd{display:flex;gap:8px;align-items:center;justify-content:space-between}
.pk-dsp-hd .tt{font-weight:700;letter-spacing:.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-dsp-pn input[type=search]{box-sizing:border-box;width:100%;padding:6px 8px;border:1px solid var(--line,#3a404a);border-radius:4px;background:var(--field,var(--panel,#0b0d10));color:var(--field-fg,var(--fg,#dddddd));font:inherit}
.pk-dsp-ls{overflow:auto;border:1px solid var(--line,#3a404a);border-radius:4px;background:var(--well,#0b0d10);min-height:0}
.pk-dsp-ls:focus-visible{outline:2px solid var(--sel,#4ea8ff);outline-offset:1px}
.pk-dsp-gh{padding:4px 8px 2px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a0)}
.pk-dsp-o{padding:7px 10px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-dsp-o:hover{background:color-mix(in srgb,var(--fg,#dddddd) 8%,transparent)}
.pk-dsp-o.hl{outline:1px solid var(--sel,#4ea8ff);outline-offset:-1px}
.pk-dsp-o.cur{background:color-mix(in srgb,var(--sel,#4ea8ff) 28%,transparent)}
.pk-dsp-o.dis{opacity:.4;cursor:default}
.pk-dsp-bn{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:stretch}
.pk-dsp-big{font-size:14px;display:flex;align-items:center;padding:6px 10px}
.pk-dsp-big .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-dsp-ft{display:flex;gap:8px;justify-content:flex-end}
.pk-dsp-pn button{min-height:34px}
@media (pointer:coarse){.pk-dsp-b{min-width:36px;min-height:36px}.pk-dsp-pn button{min-height:44px}.pk-dsp-o{padding:11px 10px}}
`;
function ensureCss(root){ if(!root) return; if(root.nodeType===11){ if(![...root.children].some(x=>x.tagName==='STYLE'&&x.hasAttribute('data-pk-dsp'))){ const s=document.createElement('style'); s.setAttribute('data-pk-dsp',''); s.textContent=CSS; root.appendChild(s); } }
  else if(!document.getElementById('pkDspCss')){ const s=document.createElement('style'); s.id='pkDspCss'; s.textContent=CSS; document.head.appendChild(s); } }

// ---- het model: de opties van de select ----
function itemsOf(sel){ const out=[]; const opt=(o,g)=>out.push({v:o.value,t:o.textContent,g,dis:o.disabled});
  [...sel.children].forEach(c=>{ if(c.tagName==='OPTGROUP') [...c.children].forEach(o=>{ if(o.tagName==='OPTION') opt(o,c.label); }); else if(c.tagName==='OPTION') opt(c,''); }); return out; }
const pickable=L=>L.filter(x=>!x.dis&&x.v!=='');
const textOf=(L,v)=>{ const x=L.find(y=>y.v===v); return x?x.t:''; };
function apply(D,v){ const sel=D.sel; if(sel.value===v) return; sel.value=v; sel.dispatchEvent(new Event('input',{bubbles:true})); sel.dispatchEvent(new Event('change',{bubbles:true})); }
const click=D=>{ if(PK.hapticClick) PK.hapticClick(D.sel); };

// ---- de waarde van de select in de gaten houden (programmatisch gezet zonder gebeurtenis) ----
function watchOn(D){ if(D.watch) return; const sel=D.sel, vd=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value'), id=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'selectedIndex');
  const q=()=>soon(D);
  Object.defineProperty(sel,'value',{configurable:true,get(){ return vd.get.call(sel); },set(v){ vd.set.call(sel,v); D.pending=null; q(); }});
  Object.defineProperty(sel,'selectedIndex',{configurable:true,get(){ return id.get.call(sel); },set(v){ id.set.call(sel,v); D.pending=null; q(); }});
  const onch=()=>{ D.pending=null; q(); }; sel.addEventListener('change',onch);
  const mo=new MutationObserver(q); mo.observe(sel,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','label']});
  D.watch={mo,onch}; }
function watchOff(D){ const W=D.watch; if(!W) return; D.watch=null; W.mo.disconnect(); D.sel.removeEventListener('change',W.onch); delete D.sel.value; delete D.sel.selectedIndex; }
function soon(D){ if(D.q) return; D.q=true; Promise.resolve().then(()=>{ D.q=false; if(D.face) paint(D); }); }

// ---- het gezicht ----
function faceOn(D,p){ faceOff(D,true); const sel=D.sel; if(!sel.isConnected) return; ensureCss(sel.getRootNode());
  const F={p}, f=el('div','pk-dsp'); f.setAttribute('data-pk-dstyle',p.style); f.setAttribute('data-pk-dnav',p.nav); if(p.width!=='auto'){ f.setAttribute('data-pk-dw',''); f.style.setProperty('--pk-dsp-w',p.width+'px'); }
  const col=p.color==='accent'?'var(--accent,#4fd1c5)':(/^#/.test(p.color)?p.color:''); if(col) f.style.setProperty('--pk-dsp-col',col);
  const lab=D.label||sel.getAttribute('aria-label')||'';
  const pb=el('button','pk-dsp-b','‹'); pb.type='button'; pb.setAttribute('aria-label',PK.pkt('m.dsp_vorige')); pb.title=PK.pkt('m.dsp_vorige');
  const nb=el('button','pk-dsp-b','›'); nb.type='button'; nb.setAttribute('aria-label',PK.pkt('m.dsp_volgende')); nb.title=PK.pkt('m.dsp_volgende');
  const sc=el('div','pk-dsp-scr'); sc.tabIndex=0; sc.setAttribute('role','combobox'); sc.setAttribute('aria-haspopup','listbox'); sc.setAttribute('aria-expanded','false'); sc.setAttribute('aria-label',lab); sc.title=lab;
  for(let i=0;i<3;i++) sc.appendChild(el('div','pk-dsp-ln'));
  const deferred=p.nav==='arrows+ok'||p.commit==='ok';
  const ok=deferred?el('button','pk-dsp-b t','OK'):null; if(ok){ ok.type='button'; ok.setAttribute('aria-label',PK.pkt('m.dsp_ok')); ok.title=PK.pkt('m.dsp_ok'); }
  const ex=(p.expand==='button')?el('button','pk-dsp-b','⤢'):null; if(ex){ ex.type='button'; ex.setAttribute('aria-label',PK.pkt('m.dsp_open')); ex.title=PK.pkt('m.dsp_open'); }
  const kids=[]; if(p.nav!=='none') kids.push(pb); kids.push(sc); if(p.nav!=='none') kids.push(nb); if(ok) kids.push(ok); if(ex) kids.push(ex);
  f.append(...kids);
  Object.assign(F,{f,pb,nb,sc,ok,ex,deferred,lab,opens:p.expand==='click'||p.nav==='none'});
  // schermpje: < >, [ok], vergroten, toetsenbord
  pb.onclick=()=>{ stepTo(D,-1); }; nb.onclick=()=>{ stepTo(D,1); };
  if(ok) ok.onclick=()=>{ commit(D); click(D); };
  if(ex) ex.onclick=()=>openPanel(D);
  sc.addEventListener('click',()=>{ if(F.opens) openPanel(D); });
  sc.addEventListener('keydown',e=>{ if(e.ctrlKey||e.metaKey||e.altKey) return; const k=e.key;
    if(k==='ArrowLeft'||k==='ArrowUp'){ e.preventDefault(); stepTo(D,-1); } else if(k==='ArrowRight'||k==='ArrowDown'){ e.preventDefault(); stepTo(D,1); }
    else if(k==='Home'||k==='End'){ e.preventDefault(); stepTo(D,k==='Home'?-Infinity:Infinity); }
    else if(k==='Enter'){ e.preventDefault(); if(D.pending!=null&&D.pending!==sel.value) { commit(D); click(D); } else if(p.expand!=='off'||p.nav==='none') openPanel(D); }
    else if(k===' '){ e.preventDefault(); if(p.expand!=='off'||p.nav==='none') openPanel(D); }
    else if(k==='Escape'&&D.pending!=null){ e.preventDefault(); D.pending=null; paint(D); } });
  D.hid={had:sel.hasAttribute('style'),disp:sel.style.display}; sel.style.display='none';
  D.hidB=[D.prev,D.next].filter(Boolean).map(b=>({b,disp:b.style.display})); D.hidB.forEach(x=>{ x.b.style.display='none'; });
  sel.after(f); D.face=F; watchOn(D); paint(D); }
function faceOff(D,keep){ if(D.panel) closePanel(false); const F=D.face; if(!F){ if(!keep) watchOff(D); return; }
  F.f.remove(); D.face=null; D.pending=null; watchOff(D);
  const sel=D.sel; if(D.hid){ sel.style.display=D.hid.disp; if(!D.hid.had&&!(sel.getAttribute('style')||'').trim()) sel.removeAttribute('style'); D.hid=null; }
  if(D.hidB){ D.hidB.forEach(x=>{ x.b.style.display=x.disp; if(!(x.b.getAttribute('style')||'').trim()) x.b.removeAttribute('style'); }); D.hidB=null; } }
function paint(D){ const F=D.face; if(!F||!D.sel.isConnected) return; const sel=D.sel, L=itemsOf(sel), P=pickable(L), shown=D.pending!=null?D.pending:sel.value, i=P.findIndex(x=>x.v===shown), lines=F.p.lines;
  const here=textOf(L,shown)||(sel.selectedOptions[0]?sel.selectedOptions[0].textContent:''), prev=i>0?P[i-1].t:(i<0?'':''), next=i>=0?(P[i+1]?P[i+1].t:''):(P[0]?P[0].t:'');
  const ln=F.sc.children; const set=(k,t,ghost)=>{ ln[k].textContent=t||' '; ln[k].className='pk-dsp-ln'+(ghost?' g':''); ln[k].hidden=false; };
  if(lines===1){ set(0,here,false); ln[1].hidden=true; ln[2].hidden=true; }
  else if(lines===2){ set(0,here,false); set(1,next,true); ln[2].hidden=true; }
  else { set(0,prev,true); set(1,here,false); set(2,next,true); }
  F.sc.classList.toggle('pk-pending',D.pending!=null&&D.pending!==sel.value);
  F.sc.setAttribute('aria-expanded',D.panel?'true':'false');
  const wrap=!!D.o.wrap, live=!F.deferred&&D.prev&&D.next;
  const canP=live?!D.prev.disabled:(wrap?P.length>0:i>0), canN=live?!D.next.disabled:(wrap?P.length>0:(i<0?P.length>0:i<P.length-1));
  F.pb.disabled=!canP; F.nb.disabled=!canN; if(F.ok) F.ok.disabled=!(D.pending!=null&&D.pending!==sel.value);
  if(D.panel) panelRefresh(D); }

// ---- bladeren met < > ----
function stepTo(D,dir){ const F=D.face, sel=D.sel; if(!F) return; const L=pickable(itemsOf(sel)); if(!L.length) return;
  if(!F.deferred&&D.prev&&D.next&&Math.abs(dir)===1){ const b=dir<0?D.prev:D.next; if(b.disabled) return; click(D); b.click(); return; }
  const base=D.pending!=null?D.pending:sel.value, i=L.findIndex(x=>x.v===base); let j;
  if(dir===-Infinity) j=0; else if(dir===Infinity) j=L.length-1; else j=i<0?(dir>0?0:L.length-1):i+dir;
  if(j<0||j>=L.length){ if(D.o.wrap&&Math.abs(dir)===1) j=(j+L.length)%L.length; else return; }
  click(D); if(F.deferred){ D.pending=L[j].v; paint(D); } else { apply(D,L[j].v); } }
function commit(D){ if(D.pending==null) return; const v=D.pending; D.pending=null; apply(D,v); paint(D); }

// ---- het paneel ----
function openPanel(D){ const F=D.face; if(!F) return; closePanel(false); const sel=D.sel, p=F.p, opener=(document.activeElement&&F.f.contains(document.activeElement))?document.activeElement:F.sc;
  const bd=el('div','pk-dsp-bd'), pn=el('div','pk-dsp-pn'); bd.classList.toggle('narrow',!!(PK.PKT&&PK.PKT.narrow.matches));
  pn.setAttribute('role','dialog'); pn.setAttribute('aria-modal','true'); pn.setAttribute('aria-label',F.lab||PK.pkt('m.dsp_kies'));
  const hd=el('div','pk-dsp-hd'), tt=el('span','tt',F.lab||PK.pkt('m.dsp_kies')), xb=el('button','pk-dsp-b','×'); xb.type='button'; xb.setAttribute('aria-label',PK.pkt('m.dsp_sluiten')); xb.title=PK.pkt('m.dsp_sluiten'); hd.append(tt,xb);
  const L0=pickable(itemsOf(sel)), search=L0.length>=(D.o.searchAt||12)?el('input'):null; if(search){ search.type='search'; search.setAttribute('aria-label',PK.pkt('m.dsp_zoek')); search.placeholder=PK.pkt('m.dsp_zoek'); }
  const ls=el('div','pk-dsp-ls'); ls.setAttribute('role','listbox'); ls.tabIndex=0; ls.setAttribute('aria-label',F.lab||PK.pkt('m.dsp_kies'));
  const bn=el('div','pk-dsp-bn'), pb=el('button','pk-dsp-b','‹'), nb=el('button','pk-dsp-b','›'), big=el('div','pk-dsp-big'), bt=el('span','t'); big.appendChild(bt); big.setAttribute('data-pk-dstyle',p.style); const col=F.f.style.getPropertyValue('--pk-dsp-col'); if(col) big.style.setProperty('--pk-dsp-col',col);
  pb.type=nb.type='button'; pb.setAttribute('aria-label',PK.pkt('m.dsp_vorige')); nb.setAttribute('aria-label',PK.pkt('m.dsp_volgende')); bn.append(pb,big,nb);
  const ft=el('div','pk-dsp-ft'), cb=el('button',null,PK.pkt('m.dsp_annuleren')), ob=el('button',null,'OK'); cb.type=ob.type='button'; ob.setAttribute('aria-label',PK.pkt('m.dsp_ok')); ft.append(cb,ob);
  pn.append(hd); if(search) pn.append(search); else pn.append(el('div')); pn.append(ls,bn,ft); bd.appendChild(pn); document.body.appendChild(bd);
  const P={D,bd,pn,ls,search,bt,pb,nb,ob,cb,opener,start:sel.value,sel:D.pending!=null?D.pending:sel.value,hl:null,q:'',deferred:p.commit==='ok'}; P.hl=P.sel; D.panel=P; PANEL=P; ensureCss(document);
  const close=(ok)=>{ if(ok) finish(P); else closePanel(true); };
  xb.onclick=()=>{ click(D); closePanel(true); }; cb.onclick=()=>{ click(D); closePanel(true); }; ob.onclick=()=>{ click(D); finish(P); };
  bd.addEventListener('pointerdown',e=>{ if(e.target===bd) { e.preventDefault(); closePanel(true); } });
  pb.onclick=()=>pstep(P,-1); nb.onclick=()=>pstep(P,1);
  if(search) search.addEventListener('input',()=>{ P.q=search.value.trim().toLowerCase(); render(P); });
  pn.addEventListener('keydown',e=>{ const k=e.key;
    if(k==='Escape'){ e.preventDefault(); e.stopPropagation(); closePanel(true); return; }
    if(k==='Tab'){ const f=[...pn.querySelectorAll('button:not(:disabled),input,[tabindex="0"]')].filter(x=>x.offsetParent!==null||x===document.activeElement); if(!f.length) return; const a=f.indexOf(document.activeElement); if(e.shiftKey&&a<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&(a===f.length-1)){ e.preventDefault(); f[0].focus(); } return; }
    const inList=e.target===ls||e.target===search;
    if(k==='ArrowDown'||k==='ArrowUp'){ if(!inList) return; e.preventDefault(); hmove(P,k==='ArrowDown'?1:-1); }
    else if(k==='Enter'&&inList){ e.preventDefault(); if(P.hl!=null){ choose(P,P.hl); } finish(P); }
    else if((k==='ArrowLeft'||k==='ArrowRight')&&e.target===ls){ e.preventDefault(); pstep(P,k==='ArrowLeft'?-1:1); } });
  render(P); F.sc.setAttribute('aria-expanded','true'); (search||ls).focus({preventScroll:true}); }
function visible(P){ const L=itemsOf(P.D.sel); return L.filter(x=>!P.q||x.t.toLowerCase().includes(P.q)); }
function render(P){ const sel=P.D.sel, L=visible(P), ls=P.ls; ls.innerHTML=''; let g=null;
  L.forEach((x,i)=>{ if(x.g&&x.g!==g){ g=x.g; ls.appendChild(el('div','pk-dsp-gh',g)); } else if(!x.g) g=null;
    const o=el('div','pk-dsp-o',x.t); o.setAttribute('role','option'); o.dataset.v=x.v; o.id='pkdsp'+i; o.setAttribute('aria-selected',x.v===P.sel?'true':'false'); if(x.v===P.sel) o.classList.add('cur'); if(x.v===P.hl) o.classList.add('hl'); if(x.dis||x.v===''){ o.classList.add('dis'); o.setAttribute('aria-disabled','true'); }
    else { o.onclick=()=>{ choose(P,x.v); }; o.ondblclick=()=>{ choose(P,x.v); finish(P); }; } ls.appendChild(o); });
  const cur=ls.querySelector('.hl')||ls.querySelector('.cur'); if(cur){ ls.setAttribute('aria-activedescendant',cur.id); cur.scrollIntoView({block:'nearest'}); } else ls.removeAttribute('aria-activedescendant');
  const all=itemsOf(sel); P.bt.textContent=textOf(all,P.sel)||(sel.selectedOptions[0]?sel.selectedOptions[0].textContent:'');
  const pk=pickable(all), i=pk.findIndex(x=>x.v===P.sel), wrap=!!P.D.o.wrap; P.pb.disabled=wrap?!pk.length:!(i>0); P.nb.disabled=wrap?!pk.length:!(i<pk.length-1&&pk.length); }
function panelRefresh(D){ const P=D.panel; if(P&&document.body.contains(P.bd)) render(P); }
function hmove(P,d){ const L=visible(P).filter(x=>!x.dis&&x.v!==''); if(!L.length) return; const i=L.findIndex(x=>x.v===P.hl); const j=Math.max(0,Math.min(L.length-1,i<0?(d>0?0:L.length-1):i+d)); P.hl=L[j].v; render(P); }
function choose(P,v){ P.sel=v; P.hl=v; click(P.D); if(!P.deferred) apply(P.D,v); render(P); }
function pstep(P,d){ const L=pickable(itemsOf(P.D.sel)); if(!L.length) return; const i=L.findIndex(x=>x.v===P.sel); let j=i<0?(d>0?0:L.length-1):i+d; if(j<0||j>=L.length){ if(P.D.o.wrap) j=(j+L.length)%L.length; else return; } choose(P,L[j].v); }
function finish(P){ const D=P.D; if(P.deferred&&P.sel!==P.start) apply(D,P.sel); D.pending=null; closePanel(false); }
function closePanel(revert){ const P=PANEL; if(!P) return; PANEL=null; const D=P.D; D.panel=null;
  if(revert&&!P.deferred&&D.sel.value!==P.start) apply(D,P.start);
  P.bd.remove(); const F=D.face; if(F){ F.sc.setAttribute('aria-expanded','false'); paint(D); }
  const t=(P.opener&&P.opener.isConnected)?P.opener:(F&&F.sc.isConnected?F.sc:null); if(t) try{ t.focus({preventScroll:true}); }catch(e){} }

// ---- registreren, regels, toepassen ----
// regels van een samengevoegd ontwerp: alleen een schermpje-stijl anders dan dropdown telt
function effective(P,kind){ if(!P||!P.style||P.style==='dropdown') return null; const t=Array.isArray(P.targets)&&P.targets.length?P.targets:['select']; if(!t.includes(kind)) return null;
  return {style:P.style,nav:P.nav||'arrows',commit:P.commit||'live',lines:P.lines||1,width:P.width===undefined?'auto':P.width,expand:P.expand||'click',color:P.color||'default'}; }
function look(D){ if(!D.sel.isConnected){ faceOff(D); DSP.delete(D); return; } const r=PK.cardOf(D.sel), p=r?effective(r.skDsp,D.kind):null; if(p){ if(D.face&&D.face.f.isConnected&&D.face.f.previousElementSibling===D.sel&&JSON.stringify(D.face.p)===JSON.stringify(p)) { paint(D); return; } faceOn(D,p); } else faceOff(D); }   // zelfde ontwerp en nog op zijn plek: niets afbreken (een open paneel blijft staan)
function displayAttach(sel,o){ if(!sel||sel.nodeType!==1||sel.tagName!=='SELECT') return null; o=o&&typeof o==='object'?o:{};
  let D=[...DSP].find(x=>x.sel===sel);
  if(!D){ D={sel,kind:o.kind==='preset'||o.kind==='tune'?o.kind:'select',label:o.label||'',prev:o.prev||null,next:o.next||null,o:{wrap:!!o.wrap,searchAt:(Number.isInteger(o.searchAt)&&o.searchAt>=1)?o.searchAt:12},face:null,pending:null,watch:null,panel:null,q:false}; DSP.add(D); }
  else { if(o.prev) D.prev=o.prev; if(o.next) D.next=o.next; if(o.label) D.label=o.label; if(o.wrap!==undefined) D.o.wrap=!!o.wrap; if(Number.isInteger(o.searchAt)&&o.searchAt>=1) D.o.searchAt=o.searchAt; }
  const r=PK.cardOf(sel); if(r&&r.skDsp) look(D);
  return D; }
PK.displayAttach=displayAttach;
function displayApply(r){ if(!r||!r.el) return; DSP.forEach(D=>{ if(!D.sel.isConnected){ faceOff(D); DSP.delete(D); return; } if(PK.cardOf(D.sel)===r) look(D); });
  if(r.skDsp){ if(!r.dspMO){ let q=false; r.dspMO=new MutationObserver(ms=>{ if(q||!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!/^(STYLE|OPTION|OPTGROUP)$/.test(n.tagName)&&!(n.classList&&n.classList.contains('pk-dsp'))))) return; q=true; Promise.resolve().then(()=>{ q=false; if(r.skDsp&&r.el.isConnected) displayApply(r); }); }); }
    r.dspMO.disconnect(); const base=r.el.querySelector(':scope > .body')||r.el; r.dspMO.observe(base,{childList:true,subtree:true});
    const pb=r.pbarEl; if(pb) r.dspMO.observe(pb,{childList:true,subtree:true}); (PK.regRoots?PK.regRoots(PK.regUi(r)):[]).forEach(sr=>r.dspMO.observe(sr,{childList:true,subtree:true})); }
  else if(r.dspMO){ r.dspMO.disconnect(); r.dspMO=null; } }
PK.displayApply=displayApply;
PK.displaySoon=r=>{ if(!r||!r.skDsp||r.dspQ) return; r.dspQ=true; Promise.resolve().then(()=>{ r.dspQ=false; if(r.skDsp&&r.el&&r.el.isConnected) displayApply(r); }); };
PK.displayFace=sel=>{ const D=[...DSP].find(x=>x.sel===sel); return D&&D.face?D.face.p.style:'dropdown'; };
PK.displayStats=r=>{ let n=0,m=0; DSP.forEach(D=>{ if(!D.sel.isConnected||PK.cardOf(D.sel)!==r) return; m++; if(D.face) n++; }); return {n,m}; };
PK.displayRules=d=>(d&&d.display&&typeof d.display==='object'&&Object.keys(d.display).length)?d.display:null;

// ---- host.ui.display(parent, label, opts) ----
function displayBuild(parent,label,o){ o=o&&typeof o==='object'?o:{};
  const orig=new Map(), set0=list=>{ orig.clear(); return (Array.isArray(list)?list:[]).filter(x=>Array.isArray(x)&&x.length>=1).map(x=>{ const v=String(x[0]); orig.set(v,x[0]); return [v,String(x.length>1?x[1]:x[0])]; }); };
  const items=set0(o.items), has=v=>items.some(x=>x[0]===v);
  const start=o.value!==undefined&&has(String(o.value))?String(o.value):(items[0]?items[0][0]:'');
  const sel=PK.pkSelect(parent,label,items,start,v=>{ if(typeof o.onchange==='function'){ try{ o.onchange(orig.has(v)?orig.get(v):v); }catch(e){ try{ console.warn('display onchange',e); }catch(x){} } } },{id:o.id,role:o.role,group:o.group});
  const w=sel.parentElement; w.select=sel; let dead=false;
  const D=displayAttach(sel,{kind:'select',label,wrap:o.wrap,searchAt:o.searchAt});
  const id=sel.parentElement.getAttribute('data-pk-id')||undefined;
  const api={ el:w, id,
    set(v){ if(dead) return; const s=String(v); if([...sel.options].some(x=>x.value===s)) sel.value=s; },
    get(){ const v=sel.value; return orig.has(v)?orig.get(v):v; },
    items(list){ if(dead) return; const cur=sel.value, L=set0(list); sel.innerHTML=''; L.forEach(([v,t])=>{ const op=document.createElement('option'); op.value=v; op.textContent=t; sel.appendChild(op); }); sel.value=L.some(x=>x[0]===cur)?cur:(L[0]?L[0][0]:''); },
    destroy(){ if(dead) return; dead=true; if(D){ faceOff(D); DSP.delete(D); } w.remove(); } };
  Object.defineProperty(api,'value',{get(){ return api.get(); },set(v){ api.set(v); },enumerable:true});
  return api; }
PK.displayBuild=displayBuild;
})(window.__PK);
