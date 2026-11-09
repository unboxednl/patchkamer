// js/pads.js — host.ui.pad en host.ui.steps(…, opts) (contract v1.22): pads en stapknoppen; design.pads (skins 0.6) toepassen op eigen pads, stappen en geadopteerde knoppen (data-pk-role pad|step)
(function(PK){
/* =====================================================================
   PADS · een pad is een gewone <button>: pointer (muis en touch, met pointer capture), toetsenbord (Spatie/Enter), aria-pressed bij toggle. De host zet alleen CSS-klassen, data-pk-*-attributen en CSS-variabelen
   (--pk-pad-color, --pk-pad-fg, --pk-pad-size, --pk-pad-h0) op het element; .on, .cur en .now blijven van het apparaat (of van het pad zelf). Eén stijlblok per wortel (document of shadow root), alleen waar een pad staat.
   Zonder skin is er geen enkele aanpassing aan de DOM van host.ui.steps of van geadopteerde knoppen (data-pk-role blijft het enige verschil, en dat zet het apparaat zelf).
   Skin: r.skPad = {shape,size,color,palette,colors,idle,active,led,hit,press,gap}: één object (geen regellijst; een eigen kleur per pad staat in colors, skins 0.6).
   Kleur per pad: eigen kleur uit colors (id > group:<g> > role:<r>) wint; anders color: neutral (thema), device (data-pk-color van het element), palette (cyclisch per pad of, bij stappen, per rij/groep).
   ===================================================================== */
const ID_RE=/^[A-Za-z0-9._-]{1,60}$/, HEX_RE=/^#[0-9a-fA-F]{6}$/;
const SIZES={xs:0.6,s:0.8,m:1,l:1.3,xl:1.6};
const KEYS=['shape','size','color','idle','active','led','hit','press'];
const AT=['data-pk-skp','data-pk-ps','data-pk-psz','data-pk-pi','data-pk-pa','data-pk-pl','data-pk-ph','data-pk-pp','data-pk-pgap','data-pk-kd','data-pk-pr','data-pk-pd'];
const VARS=['--pk-pad-color','--pk-pad-fg','--pk-pad-size','--pk-pad-h0','--pk-pad-rest'];
PK.PAD_SIZES=SIZES;
let warned=false;
const warn=m=>{ if(!warned){ warned=true; try{ console.warn('Patchkamer host.ui.pad: '+m); }catch(e){} } };
const call=(f,...a)=>{ if(typeof f!=='function') return; try{ f(...a); }catch(e){ try{ console.warn('pad callback',e); }catch(x){} } };

// ---- stijl ----
const CSS=`
.pk-pad{--pk-b:40px;box-sizing:border-box;position:relative;display:inline-flex;align-items:center;justify-content:center;width:calc(var(--pk-b) * var(--pk-pad-size,1));height:calc(var(--pk-b) * var(--pk-pad-size,1));margin:0;padding:0;border:1px solid var(--line,#3a404a);border-radius:8px;background:var(--panel-2,var(--panel,#1c2027));color:var(--fg,#dddddd);font:600 12px/1 system-ui,sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;vertical-align:middle;transition:background .06s,box-shadow .06s,transform .06s,border-color .06s}
.pk-pad:focus-visible{outline:2px solid var(--sel,#4ea8ff);outline-offset:2px}
.pk-pad .pk-pad-t{pointer-events:none;max-width:100%;overflow:hidden;text-overflow:clip;white-space:nowrap}
.pk-pad.pk-down{filter:brightness(1.25)}
.pk-pad.on{background:color-mix(in srgb,var(--pk-pad-color,var(--accent,#4fd1c5)) 62%,var(--panel-2,var(--panel,#1c2027)));border-color:var(--pk-pad-color,var(--accent,#4fd1c5))}
.pk-pad.pk-hit{box-shadow:0 0 0 2px var(--fg,#dddddd)}
.pk-pad[data-pk-ps=circle]{border-radius:50%}
.pk-pad[data-pk-ps=square]{border-radius:2px}
.pk-pad[data-pk-ps=rounded]{border-radius:8px}
.pk-pad[data-pk-ps=rect]{border-radius:6px;width:calc(var(--pk-b) * var(--pk-pad-size,1) * 1.5)}
[data-pk-skp]:not(.pk-pad)[data-pk-ps=circle]{border-radius:50%}
[data-pk-skp]:not(.pk-pad)[data-pk-ps=square]{border-radius:1px}
[data-pk-skp]:not(.pk-pad)[data-pk-ps=rounded]{border-radius:6px}
[data-pk-skp]:not(.pk-pad)[data-pk-ps=rect]{border-radius:4px}
[data-pk-skp]:not(.pk-pad):not([data-pk-role=step])[data-pk-ps=circle],[data-pk-skp]:not(.pk-pad):not([data-pk-role=step])[data-pk-ps=square]{aspect-ratio:1/1;height:auto}
[data-pk-skp]:not(.pk-pad):not([data-pk-role=step])[data-pk-ps=rect]{aspect-ratio:3/2;height:auto}
[data-pk-skp]:not(.pk-pad):not([data-pk-role=step])[data-pk-psz]{width:calc(100% * var(--pk-pad-size,1));max-width:100%;justify-self:center;align-self:center}
[data-pk-skp][data-pk-role=step][data-pk-psz]{height:calc(var(--pk-pad-h0,16px) * var(--pk-pad-size,1));justify-self:center;align-self:center}
[data-pk-skp][data-pk-role=step][data-pk-ps=circle],[data-pk-skp][data-pk-role=step][data-pk-ps=square]{aspect-ratio:1/1;height:auto;width:min(100%,var(--pk-pad-h1,var(--pk-pad-h0,16px)));min-width:0;justify-self:center;align-self:center}
[data-pk-skp][data-pk-role=step][data-pk-ps=rect]{aspect-ratio:3/2;height:auto;width:min(100%,calc(var(--pk-pad-h1,var(--pk-pad-h0,16px)) * 1.5));min-width:0;justify-self:center;align-self:center}
[data-pk-skp][data-pk-role=step][data-pk-psz]{--pk-pad-h1:calc(var(--pk-pad-h0,16px) * var(--pk-pad-size,1))}
[data-pk-skp][data-pk-pi=tint]:not(.on){background:color-mix(in srgb,var(--pk-pad-color,var(--accent,#4fd1c5)) 22%,var(--card-2,var(--panel-2,#1c2027)));border-color:color-mix(in srgb,var(--pk-pad-color,var(--accent,#4fd1c5)) 55%,var(--line,#3a404a))}
[data-pk-skp][data-pk-pa=fill].on{background:var(--pk-pad-color,var(--accent,#4fd1c5));border-color:var(--pk-pad-color,var(--accent,#4fd1c5));color:var(--pk-pad-fg,var(--card,#111111))}
[data-pk-skp][data-pk-pa=border].on{background:var(--well,#0b0d10);border:2px solid var(--pk-pad-color,var(--accent,#4fd1c5));color:var(--pk-pad-color,var(--accent,#4fd1c5))}
[data-pk-skp][data-pk-pa=glow].on{background:color-mix(in srgb,var(--pk-pad-color,var(--accent,#4fd1c5)) 40%,var(--well,#0b0d10));border-color:var(--pk-pad-color,var(--accent,#4fd1c5));box-shadow:0 0 10px 1px var(--pk-pad-color,var(--accent,#4fd1c5))}
[data-pk-skp][data-pk-pa=none].on{background:var(--panel-2,var(--card-2,#1c2027));border-color:var(--line,#3a404a);box-shadow:none}
[data-pk-skp][data-pk-pl]:not([data-pk-pl=none]){position:relative}
[data-pk-skp][data-pk-pl]:not([data-pk-pl=none])::after{content:'';position:absolute;pointer-events:none;border-radius:99px;background:color-mix(in srgb,var(--pk-pad-color,var(--accent,#4fd1c5)) 22%,transparent);transition:background .06s,box-shadow .06s}
[data-pk-skp][data-pk-pl=center]::after{left:50%;top:50%;width:26%;height:26%;min-width:3px;min-height:3px;transform:translate(-50%,-50%)}
[data-pk-skp][data-pk-pl=top]::after{left:50%;top:12%;width:44%;height:12%;min-height:2px;transform:translateX(-50%)}
[data-pk-skp][data-pk-pl=bottom]::after{left:50%;bottom:12%;width:44%;height:12%;min-height:2px;transform:translateX(-50%)}
[data-pk-skp][data-pk-pl=left]::after{top:50%;left:12%;width:12%;height:44%;min-width:2px;transform:translateY(-50%)}
[data-pk-skp][data-pk-pl=right]::after{top:50%;right:12%;width:12%;height:44%;min-width:2px;transform:translateY(-50%)}
[data-pk-skp][data-pk-pl]:not([data-pk-pl=none]).on::after{background:var(--pk-pad-color,var(--accent,#4fd1c5));box-shadow:0 0 6px var(--pk-pad-color,var(--accent,#4fd1c5))}
[data-pk-skp][data-pk-pa=fill][data-pk-pl]:not([data-pk-pl=none]).on::after{background:var(--pk-pad-fg,var(--card,#111111));box-shadow:none}
[data-pk-skp][data-pk-ph=flash].cur,[data-pk-skp][data-pk-ph=flash].now,[data-pk-skp][data-pk-ph=flash].pk-hit{box-shadow:0 0 0 2px var(--fg,#dddddd),0 0 8px var(--pk-pad-color,var(--accent,#4fd1c5))}
[data-pk-skp][data-pk-ph=none].cur,[data-pk-skp][data-pk-ph=none].now,[data-pk-skp][data-pk-ph=none].pk-hit{box-shadow:none}
[data-pk-skp][data-pk-pp=depress]:active,[data-pk-skp][data-pk-pp=depress].pk-down{transform:translateY(1px) scale(.94);filter:none}
[data-pk-skp][data-pk-pp=glow]:active,[data-pk-skp][data-pk-pp=glow].pk-down{box-shadow:0 0 12px 2px var(--pk-pad-color,var(--accent,#4fd1c5));filter:none}
[data-pk-skp][data-pk-pp=none]:active,[data-pk-skp][data-pk-pp=none].pk-down{transform:none;filter:none}
[data-pk-skp][data-pk-pr]:not(.on){background:color-mix(in srgb,var(--pk-pad-rest) 70%,var(--card-2,var(--panel-2,#1c2027)));border-color:var(--pk-pad-rest)}
[data-pk-skp][data-pk-pd].pk-down,[data-pk-skp][data-pk-pd]:active{background:var(--pk-pad-color);border-color:var(--pk-pad-color);color:var(--pk-pad-fg,#111111)}
[data-pk-pgap=tight][data-pk-pgap]{gap:1px}
[data-pk-pgap=normal][data-pk-pgap]{gap:2px}
[data-pk-pgap=wide][data-pk-pgap]{gap:6px}
`;
PK.PAD_CSS=CSS;
function ensureCss(root){ if(!root) return; if(root.nodeType===11){ if(![...root.children].some(x=>x.tagName==='STYLE'&&x.hasAttribute('data-pk-pads'))){ const s=document.createElement('style'); s.setAttribute('data-pk-pads',''); s.textContent=CSS; root.appendChild(s); } }
  else if(!document.getElementById('pkPadCss')){ const s=document.createElement('style'); s.id='pkPadCss'; s.textContent=CSS; document.head.appendChild(s); } }

// ---- hulp ----
const hexOf=v=>(typeof v==='string'&&HEX_RE.test(v))?v.toLowerCase():null;
const fgFor=hex=>{ try{ return PK.cpLum(hex)<0.45?'#ffffff':'#111111'; }catch(e){ return '#111111'; } };
function setColour(el,hex){ if(hex){ el.style.setProperty('--pk-pad-color',hex); el.style.setProperty('--pk-pad-fg',fgFor(hex)); } else { el.style.removeProperty('--pk-pad-color'); el.style.removeProperty('--pk-pad-fg'); } }
// de kleur die het apparaat zelf opgaf, terug op een host-pad (na een skin die kleur overschreef)
const devColour=el=>hexOf(el.getAttribute('data-pk-color'));

// ---- host.ui.pad ----
function padBuild(parent,label,o){
  o=o&&typeof o==='object'?o:{};
  const mode=o.mode==='toggle'?'toggle':'momentary', devToggle=mode==='toggle';
  const el=document.createElement('button'); el.type='button'; el.className='pk-pad'; el.setAttribute('role','button');
  const lab=String(label==null?'':label); el.setAttribute('aria-label',lab); el.title=typeof o.title==='string'?o.title:lab;
  if(typeof o.text==='string'&&o.text){ const t=document.createElement('span'); t.className='pk-pad-t'; t.textContent=o.text.slice(0,8); el.appendChild(t); }
  const id=PK.regTag(el,{id:o.id,role:o.role===undefined?'pad':o.role,group:o.group},'pad');
  if(o.color!==undefined){ const h=hexOf(o.color); if(h){ el.setAttribute('data-pk-color',h); setColour(el,h); } else warn('color moet #rrggbb zijn'); }
  let on=false, down=false, ptr=null, kdown=false, lastPtr=-1e9, ft=0, dead=false;
  // type van een skin (data-pk-kd, skins 0.8): toggle = vastklikken, pad = indrukken zonder velocity, velocity = indrukken met velocity; zonder skin het gedrag van het apparaat (mode)
  const kd=()=>el.getAttribute('data-pk-kd'), asToggle=()=>{ const k=kd(); return k?k==='toggle':devToggle; };
  const paint=()=>{ el.classList.toggle('on',on); if(asToggle()) el.setAttribute('aria-pressed',on?'true':'false'); else el.removeAttribute('aria-pressed'); };
  const set=v=>{ if(dead) return; on=!!v; paint(); };
  // velocity 1..127: aanraakdruk van een touch of pen als die echt gemeten wordt, anders de plek van de klik (boven zacht, onder hard); toetsenbord en overige 100
  const velOf=e=>{ if(!e||e.pointerId===undefined) return 100; if((e.pointerType==='touch'||e.pointerType==='pen')&&e.pressure>0&&e.pressure!==0.5) return Math.max(1,Math.min(127,Math.round(e.pressure*126)+1));
    const r=el.getBoundingClientRect(); if(!(r.height>0)) return 100; return Math.max(1,Math.min(127,Math.round(20+Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*107))); };
  const press=e=>{ if(dead) return; el.classList.add('pk-down'); const v=kd()==='velocity'?velOf(e):100;
    if(asToggle()){ on=!on; paint(); if(devToggle) call(o.onchange,on,v); else if(on) call(o.onpress,e,v); else call(o.onrelease,e); }
    else { down=true; if(devToggle){ on=true; paint(); call(o.onchange,true,v); } else call(o.onpress,e,v); } };
  const release=e=>{ el.classList.remove('pk-down'); if(asToggle()||!down) return; down=false; if(devToggle){ on=false; paint(); call(o.onchange,false); } else call(o.onrelease,e); };
  // een skin die het type wisselt of wegvalt terwijl het pad vastzit: laat het los (alleen een pad dat het apparaat als indrukken kent; een aan/uit-pad houdt zijn stand)
  el.__pkRelax=()=>{ if(!devToggle&&on){ on=false; paint(); call(o.onrelease,{type:'skin'}); } down=false; };
  el.__pkRepaint=paint;
  el.addEventListener('pointerdown',e=>{ if(dead||ptr!==null) return; if(e.pointerType==='mouse'&&e.button!==0) return; ptr=e.pointerId; lastPtr=performance.now(); try{ el.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); try{ el.focus({preventScroll:true}); }catch(x){} press(e); });
  const up=e=>{ if(e.pointerId!==ptr) return; ptr=null; lastPtr=performance.now(); release(e); };
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('lostpointercapture',e=>{ if(e.pointerId===ptr) up(e); });
  el.addEventListener('keydown',e=>{ if(dead||(e.key!=='Enter'&&e.key!==' ')||e.ctrlKey||e.metaKey||e.altKey) return; e.preventDefault(); if(e.repeat||kdown) return; kdown=true; press(e); });
  el.addEventListener('keyup',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; e.preventDefault(); if(!kdown) return; kdown=false; release(e); });
  el.addEventListener('blur',()=>{ if(kdown){ kdown=false; release({type:'blur'}); } });
  // een klik die niet van pointer of toetsenbord komt (bijvoorbeeld host.setControl of el.click()): indrukken en loslaten achter elkaar
  el.addEventListener('click',e=>{ if(dead) return; if(performance.now()-lastPtr<800){ return; } e.preventDefault(); press(e); release(e); });
  const flash=()=>{ if(dead) return; el.classList.add('pk-hit'); clearTimeout(ft); ft=setTimeout(()=>el.classList.remove('pk-hit'),120); };
  const destroy=()=>{ if(dead) return; dead=true; clearTimeout(ft); down=false; el.remove(); };
  if(o.on!==undefined) set(o.on); else paint();
  parent.appendChild(el); const css=()=>ensureCss(el.getRootNode()); css(); if(el.getRootNode().nodeType===1) Promise.resolve().then(css);   // nog niet aan een document of shadow root gehangen: een microtaak later nog eens
  padSoon(PK.cardOf&&PK.cardOf(el));
  return {el,set,flash,id,destroy};
}
PK.padBuild=padBuild;

// ---- host.ui.steps(parent, label, arr, onchange, opts?) ----
// zonder opts exact de oude DOM; met opts {id, group, role:'step', color} krijgen de stapknoppen data-pk-role|id|group|color
function stepsBuild(parent,label,arr,onchange,opts){
  const row=document.createElement('div'); row.className='rowlab'; const l=document.createElement('span'); l.textContent=label; const g=document.createElement('div'); g.className='grid16'; const btns=[];
  for(let s=0;s<16;s++){ const b=document.createElement('button'); b.className='st'+(s%4===0?' q':'')+(arr[s]?' on':''); b.setAttribute('aria-label',PK.pkt('m.stap',label,s+1));
    b.onclick=()=>{ arr[s]=arr[s]?0:1; b.classList.toggle('on',!!arr[s]); onchange&&onchange(s,arr[s]); }; g.appendChild(b); btns.push(b); }
  row.append(l,g); parent.appendChild(row);
  let id;
  if(opts&&typeof opts==='object'){
    const o={id:opts.id,role:opts.role===undefined?'step':opts.role,group:opts.group}, hex=opts.color===undefined?null:hexOf(opts.color);
    if(opts.color!==undefined&&!hex) warn('color moet #rrggbb zijn');
    btns.forEach(b=>{ const x=PK.regTag(b,o,'step'); if(x!==undefined) id=x; if(!b.hasAttribute('data-pk-role')) b.setAttribute('data-pk-role','step'); b.setAttribute('data-pk-row',''); if(hex) b.setAttribute('data-pk-color',hex); });
    padSoon(PK.cardOf&&PK.cardOf(row));
  }
  const out={btns,paint(){btns.forEach((b,s)=>b.classList.toggle('on',!!arr[s]));},cursor(s){btns.forEach((b,i)=>b.classList.toggle('cur',i===s));}};
  if(id!==undefined) out.id=id; return out;
}
PK.stepsBuild=stepsBuild;

// ---- vinden: alle pads en stappen van een kaart (host.ui.pad, host.ui.steps met opts, geadopteerde knoppen), ook in open shadow roots ----
const SEL='[data-pk-role=pad],[data-pk-role=step]';
function padEls(r){ const out=[]; if(!r||!r.el) return out; const ui=PK.regUi(r), roots=[ui,...(PK.regRoots?PK.regRoots(ui):[])];
  roots.forEach(rt=>{ rt.querySelectorAll(SEL).forEach(e=>{ if(e.tagName==='BUTTON'||e.matches('button,[role=button]')) out.push(e); }); }); return out; }
PK.padEls=padEls;
const stepKey=e=>e.getAttribute('data-pk-group')||e.getAttribute('data-pk-id')||'';

// ---- regels ----
function propsOf(P){ const p={}; for(const k of KEYS) if(P[k]!==undefined) p[k]=P[k]; return p; }
const descOf=e=>({role:e.getAttribute('data-pk-role')||'pad',id:e.getAttribute('data-pk-id')||'',group:e.getAttribute('data-pk-group')||''});
function colourOf(P,p,d,e,idx){ const cm=P.colors||{}; let h=null;
  if(d.id&&cm[d.id]) h=cm[d.id]; else if(d.group&&cm['group:'+d.group]) h=cm['group:'+d.group]; else if(cm['role:'+d.role]) h=cm['role:'+d.role];
  if(h) return hexOf(h);
  const c=p.color;
  if(hexOf(c)) return hexOf(c);
  if(c==='neutral') return null;
  if(c==='palette'){ const pal=Array.isArray(P.palette)?P.palette.filter(x=>hexOf(x)):[]; if(pal.length>=2) return hexOf(pal[idx%pal.length]); return devColour(e); }
  return devColour(e); }   // device (standaard)

// ---- toepassen en terugzetten ----
// regels van een skin (design.pads.rules, skins 0.8): de laatste passende regel wint per eigenschap
function ruleOf(P,d){ const q={}; (Array.isArray(P.rules)?P.rules:[]).forEach(ru=>{ const m=ru.match; if(m==='*'||(m.startsWith('role:')?d.role===m.slice(5):m.startsWith('group:')?d.group===m.slice(6):d.id===m)) for(const k of ['kind','color','activeColor','led']) if(ru[k]!==undefined) q[k]=ru[k]; }); return q; }
function kindSync(e,kd){ if(e.__pkKd==='toggle'&&kd!=='toggle'&&e.__pkRelax) e.__pkRelax(); e.__pkKd=kd; }
function padStrip(r){ (r.padMarked||[]).forEach(e=>{ AT.forEach(a=>e.removeAttribute(a)); VARS.forEach(v=>e.style.removeProperty(v)); delete e.__pkH0; if(e.classList.contains('pk-pad')){ const h=devColour(e); if(h) setColour(e,h); }
    if(e.hasAttribute('style')&&!(e.getAttribute('style')||'').trim()) e.removeAttribute('style'); }); r.padMarked=[]; }
function padOff(r){ (r.padMarked||[]).forEach(e=>kindSync(e,null)); padStrip(r); if(r.padMO){ r.padMO.disconnect(); r.padMO=null; }
  (r.padRoots||[]).forEach(rt=>{ if(rt.nodeType===11) [...rt.children].forEach(x=>{ if(x.tagName==='STYLE'&&x.hasAttribute('data-pk-pads')&&!(r.padHost&&r.padHost.has(rt))) x.remove(); }); }); r.padRoots=[]; }
function padApply(r){ if(!r||!r.el) return; const P=r.skPad, prev=r.padMarked||[]; padStrip(r);
  const els=padEls(r); const roots=new Set(); els.forEach(e=>{ const rt=e.getRootNode(); if(rt) roots.add(rt); });
  if(!P||!Object.keys(P).length){ prev.forEach(e=>kindSync(e,null)); if(r.padMO){ r.padMO.disconnect(); r.padMO=null; } return; }
  roots.forEach(ensureCss); r.padRoots=[...roots];
  const marked=[], seen=new Map(); r.padStat={n:0,m:0};
  // eerst alle h0 meten (de huidige hoogte van stappen, zonder onze maat) zodat de maat de huidige afmeting vermenigvuldigt
  els.forEach(e=>{ if(e.getAttribute('data-pk-role')==='step'&&!e.classList.contains('pk-pad')){ const h=e.offsetHeight; if(h>0) e.__pkH0=h; } });
  els.forEach(e=>{ const d=descOf(e), p=propsOf(P), key=d.role==='step'?stepKey(e):(d.id||('#'+marked.length)), k2=d.role+'|'+key; if(!seen.has(k2)) seen.set(k2,seen.size); const idx=seen.get(k2);
    r.padStat.m++; marked.push(e); e.setAttribute('data-pk-skp','');
    if(p.shape) e.setAttribute('data-pk-ps',p.shape);
    if(p.size!==undefined){ const z=typeof p.size==='number'?p.size:(SIZES[p.size]||1); e.style.setProperty('--pk-pad-size',String(z)); e.setAttribute('data-pk-psz',''); if(e.__pkH0) e.style.setProperty('--pk-pad-h0',e.__pkH0+'px'); }
    else if(d.role==='step'&&e.__pkH0&&p.shape&&p.shape!=='rounded') e.style.setProperty('--pk-pad-h0',e.__pkH0+'px');
    const q=ruleOf(P,d); e.setAttribute('data-pk-pi',p.idle||'neutral'); e.setAttribute('data-pk-pa',p.active||'fill'); e.setAttribute('data-pk-pl',q.led||p.led||'none'); e.setAttribute('data-pk-ph',p.hit||'flash'); e.setAttribute('data-pk-pp',p.press||'depress');
    let h=colourOf(P,p,d,e,idx); if(q.color) e.style.setProperty('--pk-pad-rest',q.color); if(q.color||q.activeColor){ h=q.activeColor||q.color; if(q.color) e.setAttribute('data-pk-pr',''); if(q.activeColor) e.setAttribute('data-pk-pd',''); }
    setColour(e,h); r.padStat.n++;
    { const kd=e.classList.contains('pk-pad')?(q.kind||null):null; if(kd) e.setAttribute('data-pk-kd',kd); kindSync(e,kd); if(e.classList.contains('pk-pad')&&e.__pkRepaint) e.__pkRepaint(); }
    if(d.role==='step'&&P.gap&&e.parentElement&&!marked.includes(e.parentElement)){ e.parentElement.setAttribute('data-pk-pgap',P.gap); marked.push(e.parentElement); } });
  r.padMarked=marked;
  // een herbouwde UI (nieuwe elementen) volgt: alleen toegevoegde elementen tellen
  if(!r.padMO){ let q=false; r.padMO=new MutationObserver(ms=>{ if(q||!ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.tagName!=='STYLE'))) return; q=true; requestAnimationFrame(()=>{ q=false; if(r.skPad&&r.el.isConnected) padApply(r); }); }); }
  r.padMO.disconnect(); const ui=PK.regUi(r), base=r.el.querySelector(':scope > .body')||r.el; r.padMO.observe(base,{childList:true,subtree:true}); (PK.regRoots?PK.regRoots(ui):[]).forEach(sr=>r.padMO.observe(sr,{childList:true,subtree:true}));
  PK.drawCables(); }
PK.padApply=padApply;
// samengebundeld: veel pads in één keer gebouwd of geadopteerd geeft één scan, niet één per pad
function padSoon(r){ if(!r||!r.skPad||r.padQ) return; r.padQ=true; Promise.resolve().then(()=>{ r.padQ=false; if(r.skPad&&r.el&&r.el.isConnected) padApply(r); }); } PK.padSoon=padSoon;
// de regels van een samengevoegd ontwerp
PK.padRules=d=>(d&&d.pads&&typeof d.pads==='object'&&Object.keys(d.pads).length)?d.pads:null;
// n van m pads aangepast op deze kaart
PK.padStats=r=>{ if(!r) return {n:0,m:0}; const els=padEls(r); return {n:r.skPad?els.length:0,m:els.length}; };
// register: één regel per pad, en één per stappenrij (id), zoals host.ui.list ze geeft
PK.padList=(r,entries)=>{ const out=[], rows=new Set();
  entries.forEach(({el,d,label})=>{ if(d.role!=='pad'&&d.role!=='step') return;
    const isRow=el.hasAttribute('data-pk-row'); if(isRow){ if(rows.has(d.id)) return; rows.add(d.id); }
    out.push({id:d.id,role:d.role,group:d.group,label,type:isRow?'steps':'pad',min:null,max:null,face:el.getAttribute('data-pk-ps')||(d.role==='step'?'rect':'rounded')}); });
  return out; };
})(window.__PK);
