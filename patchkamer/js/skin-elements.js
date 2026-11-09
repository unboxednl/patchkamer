// js/skin-elements.js — skins 0.9: design.elements (opmaak van elementen van de kaart) en design.decor (toegevoegde blokken, labels en lijnen); de kaart uitlezen tot een boom, sleutels maken en terugvinden
(function(PK){
/* =====================================================================
   SKINS · ELEMENTEN EN DECOR (skins 0.9). De kaart van een apparaat is meer dan wat het apparaat bij de host aanmeldt (host.ui.*): koppen, blokken, knoppen en schermpjes tekent het apparaat zelf.
   Deze module leest die kaart uit (`skScan`: een boom van elementen met een sleutel), vindt een element terug aan zijn sleutel en past twee lijsten uit het skinbestand toe:
   - design.elements: [{root?, target, style}] zet een veilige lijst eigenschappen (kleuren, rand, afronding, ruimte, letter, doorzichtigheid, schaduw) op één element; nooit verbergen of verplaatsen;
   - design.decor: [{id, type: label|box|line, target, root?, place: before|after|start|end, text?, style?}] voegt een label, blok of lijn toe naast of in een element.
   Sleutel (`target`) = een korte CSS-selector vanaf de kinderen van de wortel: `div.sec:nth-of-type(2) > h3`, alleen tag, hoogstens twee klassen, :nth-of-type en [data-pk-id="x"], gescheiden door ' > '. `root` (0 …) is de wortel:
   de open shadow roots van het apparaat in volgorde (zoals js/controls.js ze vindt), of bij een apparaat zonder shadow root het .ui-vlak zelf (dan wordt de CSS vastgemaakt aan de kaart).
   Er komt nooit script of vrije CSS in: alle waarden worden gecontroleerd (kleuren #rgb/#rrggbb, getallen binnen grenzen, lijsten van opties) en pas dan tot CSS gemaakt.
   ===================================================================== */
const EL_MAX=128, DECOR_MAX=32, DEC_TEXT=120, ROOT_MAX=8;
const SEG=/^[a-z][a-z0-9-]{0,30}(?:\.[A-Za-z_][A-Za-z0-9_-]{0,40}){0,2}(?::nth-of-type\(\d{1,3}\))?(?:\[data-pk-id="[A-Za-z0-9._-]{1,60}"\])?$/;
function selOk(s){ if(typeof s!=='string'||!s||s.length>400) return false; const p=s.split(' > '); return p.length<=14&&p.every(x=>SEG.test(x)); }
// ---- eigenschappen: [min, max, 'n'|'f'] = getal (n = geheel, f = met decimalen), andere lijst = keuze, 'col' = kleur ----
const STYLE={background:'col',color:'col',borderColor:'col',borderWidth:[0,8,'n'],borderStyle:['none','solid','dashed','dotted'],radius:[0,48,'n'],padding:[0,40,'n'],fontSize:[8,48,'n'],fontWeight:[400,500,600,700],letterSpacing:[0,.4,'f'],textTransform:['none','uppercase','lowercase','capitalize'],opacity:[.2,1,'f'],shadow:['none','soft','strong','glow']};
const DSTYLE={...STYLE,align:['left','center','right'],height:[1,200,'n']};   // toegevoegde blokken, labels en lijnen
PK.SK_EL_STYLE=STYLE; PK.SK_DECOR_STYLE=DSTYLE; PK.SK_DECOR_TYPE=['label','box','line']; PK.SK_DECOR_PLACE=['before','after','start','end'];
function styleClean(x,where,note,table){ const o={}; if(x==null) return o; if(typeof x!=='object'||Array.isArray(x)){ note('m.sk_e_veld',where); return o; }
  for(const k of Object.keys(table)){ const v=x[k], t=table[k]; if(v==null) continue;
    if(t==='col'){ const h=PK.skHex(v); if(h) o[k]=h; else note('m.sk_e_veld',where+'.'+k); }
    else if(t.length===3&&(t[2]==='n'||t[2]==='f')){ if(typeof v==='number'&&isFinite(v)&&v>=t[0]&&v<=t[1]) o[k]=t[2]==='f'?Math.round(v*100)/100:Math.round(v); else note('m.sk_e_veld',where+'.'+k); }   // getal binnen grenzen (n = geheel, f = met decimalen)
    else if(t.includes(v)) o[k]=v; else note('m.sk_e_veld',where+'.'+k); }
  return o; }
function rootOf(x,where,note){ if(x==null) return 0; if(Number.isInteger(x)&&x>=0&&x<ROOT_MAX) return x; note('m.sk_e_veld',where+'.root'); return 0; }
function skElementsClean(list,where,note){ const out=[]; if(!Array.isArray(list)){ note('m.sk_e_veld',where); return out; }
  list.slice(0,EL_MAX).forEach((x,i)=>{ const P=where+'['+i+']'; if(!x||typeof x!=='object'||Array.isArray(x)){ note('m.sk_e_veld',P); return; }
    if(!selOk(x.target)){ note('m.sk_e_veld',P+'.target'); return; } const st=styleClean(x.style,P+'.style',note,STYLE); if(!Object.keys(st).length) return;
    const o={target:x.target,style:st}, ro=rootOf(x.root,P,note); if(ro) o.root=ro; out.push(o); });
  if(list.length>EL_MAX) note('m.sk_e_veld',where); return out; }
function textClean(t,where,note){ const cut=s=>String(s).replace(/[\u0000-\u001f\u007f<>]/g,' ').trim().slice(0,DEC_TEXT);
  if(typeof t==='string') return cut(t); if(t&&typeof t==='object'&&!Array.isArray(t)){ const o={}; for(const l of ['nl','en']){ if(typeof t[l]==='string'&&t[l].trim()) o[l]=cut(t[l]); } return Object.keys(o).length?o:undefined; }
  if(t!=null) note('m.sk_e_veld',where); return undefined; }
function skDecorClean(list,where,note){ const out=[], ids=new Set(); if(!Array.isArray(list)){ note('m.sk_e_veld',where); return out; }
  list.slice(0,DECOR_MAX).forEach((x,i)=>{ const P=where+'['+i+']'; if(!x||typeof x!=='object'||Array.isArray(x)){ note('m.sk_e_veld',P); return; }
    if(typeof x.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,23}$/.test(x.id)||ids.has(x.id)){ note('m.sk_e_veld',P+'.id'); return; } if(!PK.SK_DECOR_TYPE.includes(x.type)){ note('m.sk_e_veld',P+'.type'); return; }
    const place=x.place==null?'after':x.place; if(!PK.SK_DECOR_PLACE.includes(place)){ note('m.sk_e_veld',P+'.place'); return; }
    const target=x.target==null?'':x.target; if(target!==''&&!selOk(target)){ note('m.sk_e_veld',P+'.target'); return; } if(target===''&&(place==='before'||place==='after')){ note('m.sk_e_veld',P+'.place'); return; }
    ids.add(x.id); const o={id:x.id,type:x.type,target,place}, ro=rootOf(x.root,P,note); if(ro) o.root=ro; if(x.text!=null&&x.type!=='line'){ const t=textClean(x.text,P+'.text',note); if(t) o.text=t; }
    const st=styleClean(x.style,P+'.style',note,DSTYLE); if(Object.keys(st).length) o.style=st; out.push(o); });
  if(list.length>DECOR_MAX) note('m.sk_e_veld',where); return out; }
PK.skElementsClean=skElementsClean; PK.skDecorClean=skDecorClean; PK.skSelOk=selOk;
// ---- naar CSS ----
const SHADOW={none:'none',soft:'0 2px 6px rgba(0,0,0,.25)',strong:'0 4px 14px rgba(0,0,0,.45)',glow:'0 0 10px var(--sel,#9b8cff)'};
function declOf(s){ const d=[]; const add=(p,v)=>d.push(p+':'+v+' !important');
  if(s.background) add('background-color',s.background); if(s.color) add('color',s.color);
  const bs=s.borderStyle||((s.borderColor!=null||s.borderWidth!=null)&&s.borderWidth!==0?'solid':null); if(s.borderColor) add('border-color',s.borderColor); if(s.borderWidth!=null) add('border-width',s.borderWidth+'px'); if(bs) add('border-style',bs);
  if(s.radius!=null) add('border-radius',s.radius+'px'); if(s.padding!=null) add('padding',s.padding+'px'); if(s.fontSize!=null) add('font-size',s.fontSize+'px'); if(s.fontWeight!=null) add('font-weight',String(s.fontWeight));
  if(s.letterSpacing!=null) add('letter-spacing',s.letterSpacing+'em'); if(s.textTransform) add('text-transform',s.textTransform); if(s.opacity!=null) add('opacity',String(s.opacity)); if(s.shadow) add('box-shadow',SHADOW[s.shadow]); return d.join(';'); }
// ---- wortels van een kaart ----
function roots(r){ if(!r||!r.el) return []; const ui=PK.regUi(r), sh=PK.regRoots?PK.regRoots(ui):[]; if(sh.length) return sh.slice(0,ROOT_MAX).map(n=>({kind:'shadow',node:n,ui})); return [{kind:'light',node:ui,ui}]; }
const cidOf=r=>{ if(!r.el.getAttribute('data-pk-cid')) r.el.setAttribute('data-pk-cid',String(r.id||r.def&&r.def.id||'x').replace(/[^A-Za-z0-9_-]/g,'_')); return r.el.getAttribute('data-pk-cid'); };
const prefixOf=(r,rt)=>rt.kind==='light'?'[data-pk-cid="'+cidOf(r)+'"] > .body > .ui > ':'';
function queryAll(rt,sel){ try{ return rt.kind==='light'?[...rt.node.querySelectorAll(':scope > '+sel)]:[...rt.node.querySelectorAll(sel)]; }catch(e){ return []; } }
function resolve(r,ri,key){ const rs=roots(r), rt=rs[ri||0]; if(!rt||!selOk(key)) return null; return queryAll(rt,key)[0]||null; }
function cssOf(r,des){ const rs=roots(r), by=rs.map(()=>[]);
  ((des&&des.elements)||[]).forEach(x=>{ const ri=x.root||0, rt=rs[ri]; if(!rt) return; const d=declOf(x.style); if(d) by[ri].push(prefixOf(r,rt)+x.target+'{'+d+'}'); });
  return by.map(a=>a.join('\n')); }
// ---- toepassen: een <style> per wortel (blijft staan als het apparaat zijn scherm opnieuw opbouwt) en de toegevoegde onderdelen ----
const DECOR_CSS='.pk-decor{box-sizing:border-box;display:block;color:var(--fg);font:inherit}.pk-decor-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:6px 0 2px}.pk-decor-box{min-height:24px;border:1px solid var(--line);border-radius:6px;background:var(--card-2,transparent);padding:8px;margin:6px 0}.pk-decor-line{height:1px;background:var(--line);margin:8px 0;padding:0}';
const L=t=>typeof t==='string'?t:(t&&(t[PK.PK_LANG]||t.nl||t.en))||'';
function decorNode(x){ const n=document.createElement('div'); n.className='pk-decor pk-decor-'+x.type; n.setAttribute('data-pk-decor',x.id); if(x.type!=='line'){ const t=L(x.text); if(t) n.textContent=t; }
  const s=x.style||{}; if(s.align) n.style.textAlign=s.align; if(s.height!=null&&x.type!=='label') n.style.height=s.height+'px'; return n; }
function placeDecor(r){ const st=r.skXel; if(!st) return; const list=st.decor; st.busy=true; const rs=roots(r);
  rs.forEach(rt=>{ rt.node.querySelectorAll('[data-pk-decor]').forEach(n=>n.remove()); });
  const order=[...list.filter(x=>x.place==='before'||x.place==='end'),...[...list].reverse().filter(x=>x.place==='after'||x.place==='start')];   // zo staan meerdere onderdelen op één plek in de volgorde van de lijst
  order.forEach(x=>{ const rt=rs[x.root||0]; if(!rt) return; let t=null; if(x.target) t=queryAll(rt,x.target)[0]; else t=null; const n=decorNode(x);
    if(x.target&&!t) return; if(!x.target){ if(x.place==='start') rt.node.prepend(n); else rt.node.append(n); return; }
    if(x.place==='before') t.before(n); else if(x.place==='after') t.after(n); else if(x.place==='start') t.prepend(n); else t.append(n); });
  st.busy=false; }
const DECOR_CSS_LIGHT=r=>DECOR_CSS.replace(/(^|\})\./g,'$1[data-pk-cid="'+cidOf(r)+'"] .');
// de stijl van een wortel: in een shadow root als laatste kind (na de stijlen van het apparaat), bij een apparaat zonder shadow root in het vlak .body van de kaart
function styleEl(rt,css){ const host=rt.kind==='light'?(rt.ui.parentNode||rt.ui):rt.node; let s=[...host.children].find(c=>c.localName==='style'&&c.hasAttribute('data-pk-skel'));
  if(!css){ if(s) s.remove(); return; } if(!s){ s=document.createElement('style'); s.setAttribute('data-pk-skel',''); host.appendChild(s); } else if(rt.kind==='shadow'&&host.lastChild!==s) host.appendChild(s); if(s.textContent!==css) s.textContent=css; }
function paint(r,des,decor){ const rs=roots(r), css=cssOf(r,des); rs.forEach((rt,i)=>{ let t=css[i]||''; if(decor.some(x=>(x.root||0)===i)) t+=(t?'\n':'')+(rt.kind==='light'?DECOR_CSS_LIGHT(r):DECOR_CSS); styleEl(rt,t); }); }
function skElApply(r,des){ skElOff(r); const els=(des&&des.elements)||[], decor=(des&&des.decor)||[]; if(!els.length&&!decor.length) return; const st=r.skXel={decor,mos:[],busy:false,t:0};
  const run=()=>{ st.busy=true; try{ paint(r,des,decor); placeDecor(r); }finally{ st.busy=false; } }; run();
  st.mos=roots(r).map(rt=>{ const mo=new MutationObserver(ms=>{ if(st.busy||r.skXel!==st) return; const own=n=>n.nodeType===1&&(n.hasAttribute('data-pk-decor')||n.hasAttribute('data-pk-skel')||n.hasAttribute('data-pk-skin')), real=ms.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>!own(n)));
      if(!real) return; clearTimeout(st.t); st.t=setTimeout(()=>{ if(r.skXel===st){ run(); } },60); }); mo.observe(rt.node,{childList:true,subtree:true}); return mo; }); }
function skElOff(r){ const st=r.skXel; if(!st) return; r.skXel=null; clearTimeout(st.t); st.mos.forEach(m=>m.disconnect()); const rs=roots(r); rs.forEach(rt=>{ rt.node.querySelectorAll('[data-pk-decor]').forEach(n=>n.remove()); }); r.el.querySelectorAll('style[data-pk-skel]').forEach(s=>s.remove()); rs.forEach(rt=>{ if(rt.kind==='shadow') rt.node.querySelectorAll('style[data-pk-skel]').forEach(s=>s.remove()); }); }
PK.skElApply=skElApply; PK.skElOff=skElOff; PK.skRoots=roots; PK.skElResolve=resolve; PK.skElCssOf=cssOf;
// ---- de kaart uitlezen: een boom van elementen met een sleutel (voor de editor) ----
const DYN=new Set(['on','off','active','sel','selected','hover','focus','focused','open','closed','hidden','disabled','running','queued','dragging','dropok','droptarget','chosen','empty','own','cont','covered','stretched','insong','unused','playing','armed','mute','muted','solo','dim','warn','error','ok','busy','live','rec','recording','previewcov','dropbefore','dropafter','dropafter','pk-hl']);
const SKIP=new Set(['style','script','template','link','meta','br','svg-defs']);
function segOf(e,full){ const tag=e.localName; if(!/^[a-z][a-z0-9-]{0,30}$/.test(tag)) return null; let s=tag;
  if(!full){ const c=[...e.classList].find(x=>/^[A-Za-z_][A-Za-z0-9_-]{0,40}$/.test(x)&&!DYN.has(x)&&!/\d{2,}/.test(x)); if(c) s+='.'+c; }
  const par=e.parentNode, sibs=par&&par.children?[...par.children].filter(x=>x.localName===tag):[e]; if(sibs.length>1||full) s+=':nth-of-type('+(sibs.indexOf(e)+1)+')';
  const id=e.getAttribute('data-pk-id'); if(!full&&id&&/^[A-Za-z0-9._-]{1,60}$/.test(id)) s+='[data-pk-id="'+id+'"]'; return s; }
function keyFor(rt,e,full){ const parts=[]; let n=e; for(let g=0;n&&n!==rt.node&&n.nodeType===1&&g<14;g++){ const s=segOf(n,full); if(!s) return null; parts.unshift(s); n=n.parentNode; } if(n!==rt.node) return null; const k=parts.join(' > '); return selOk(k)?k:null; }
function uniqueKey(rt,e){ let k=keyFor(rt,e,false); if(k){ const q=queryAll(rt,k); if(q.length===1&&q[0]===e) return k; } k=keyFor(rt,e,true); if(k){ const q=queryAll(rt,k); if(q.length===1&&q[0]===e) return k; } return null; }
function labelOf(e){ const t=s=>String(s||'').replace(/\s+/g,' ').trim(); let own=''; for(const n of e.childNodes){ if(n.nodeType===3&&t(n.textContent)){ own=t(n.textContent); break; } }
  const tag=e.localName, v=e.getAttribute('data-pk-label')||e.getAttribute('aria-label')||e.title||''; let l=own||t(v);
  if(!l&&tag==='select'){ const o=e.options&&e.options[e.selectedIndex]; l=o?t(o.text):''; } if(!l&&tag==='input') l=t(e.value||e.type); if(!l&&!e.children.length) l=t(e.textContent);
  const cls=()=>{ const c=[...e.classList].find(x=>!DYN.has(x)); return c?'.'+c:''; }, first=()=>{ const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())){ const x=t(n.textContent); if(x) return x; } return ''; };
  if(!l){ if(['label','button','summary','legend','a','option'].includes(tag)||/^h[1-6]$/.test(tag)) l=first()||cls(); else l=cls()||first(); }   // een omhulling zonder eigen tekst: de klasse, of bij een label of knop de eerste tekst erin
  return l.slice(0,30); }
function kindOf(e){ const tag=e.localName; if(e.hasAttribute('data-pk-id')) return 'ctl'; if(tag==='button') return 'button'; if(['input','select','textarea'].includes(tag)) return 'input'; if(tag==='canvas') return 'canvas'; if(tag==='svg') return 'svg'; if(tag==='img') return 'img';
  if(/^h[1-6]$/.test(tag)||tag==='label'||tag==='legend') return 'heading'; if(!e.children.length&&e.textContent.trim()) return 'text'; return 'box'; }
function skScan(r,max){ max=max||700; const out={roots:[],count:0,truncated:false}, rs=roots(r);
  rs.forEach((rt,ri)=>{ const top={ri,kind:rt.kind,kids:[]}; const walk=(parent,list,depth)=>{ for(const e of parent.children){ if(out.count>=max){ out.truncated=true; return; } const tag=e.localName; if(SKIP.has(tag)||e.hasAttribute('data-pk-decor')||e.hasAttribute('data-pk-skin')||e.hasAttribute('data-pk-skel')) continue;
        const cs=getComputedStyle(e); if(cs.display==='none') continue; const b=e.getBoundingClientRect(); if(b.width<=0&&b.height<=0&&!e.children.length) continue; const n={ri,el:e,tag,kind:kindOf(e),label:labelOf(e),kids:[],key:null};
        walk(e,n.kids,depth+1); const own=[...e.childNodes].some(c=>c.nodeType===3&&c.textContent.trim());
        if(n.kids.length===1&&!own&&n.kind==='box'&&!e.hasAttribute('data-pk-id')){ const bg=cs.backgroundColor!=='rgba(0, 0, 0, 0)'||parseFloat(cs.borderTopWidth)>0||parseFloat(cs.paddingTop)>0; if(!bg){ list.push(n.kids[0]); continue; } }   // een lege omhulling zonder eigen uiterlijk telt niet mee
        out.count++; n.key=uniqueKey(rt,e); list.push(n); } };
    walk(rt.node,top.kids,0); out.roots.push(top); }); return out; }
// element onder een punt (schermcoördinaten), in de wortels van een kaart: de diepste die een sleutel heeft
function skElAt(r,x,y){ const rs=roots(r); for(let ri=0;ri<rs.length;ri++){ const rt=rs[ri]; let list=[]; try{ list=(rt.kind==='shadow'?rt.node:document).elementsFromPoint(x,y); }catch(e){ list=[]; }
    for(const e of list){ if(!e||e===rt.node||e.nodeType!==1||!rt.node.contains(e)||(rt.kind==='light'&&e===rt.ui)||e.hasAttribute('data-pk-decor')&&false) continue; if(['style','script'].includes(e.localName)) continue; const dec=e.closest&&e.closest('[data-pk-decor]'); if(dec&&rt.node.contains(dec)) return {ri,el:dec,decor:dec.getAttribute('data-pk-decor')}; const k=uniqueKey(rt,e); if(k) return {ri,el:e,key:k}; } }
  return null; }
PK.skScan=skScan; PK.skElAt=skElAt; PK.skKeyFor=uniqueKey; PK.skElLabel=labelOf;
})(window.__PK);
