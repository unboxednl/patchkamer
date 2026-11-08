// js/canvas-sections.js — canvassecties (gekleurde vlakken met een naam waar apparaten op "plakken") en jump points (Alt+1 t/m 9)
(function(PK){
/* =====================================================================
   CANVASSECTIES EN JUMP POINTS · alleen een host-functie, geen contractwijziging
   Sectie: {id,name,color,alpha,line,x,y,w,h,min,members:[apparaat-id]}. Ligt boven het canvas en kabels, onder de apparaten (eerste kind van
   .floor). Alleen de titelbalk, de knoppen en de rand-grepen vangen de muis; de rest laat klikken en slepen door naar het canvas.
   Een apparaat hoort bij hoogstens één sectie: laat je het los met zijn midden op een sectie, dan is het lid (en groeit de sectie mee als het
   niet past); laat je het buiten alle secties los, dan is het geen lid meer. Slepen van de sectie neemt de leden mee. Minimaliseren laat alleen
   de titelbalk staan en verbergt de leden (en dus hun kabels) tot je herstelt.
   Jump point: {n 1..9, name, x, y, scale}. Alt+n zet het midden van het scherm op dat punt met de bewaarde zoom.
   Beide leven in de brede indeling (coördinaten van r.x en r.y); in de compacte indeling zijn ze verborgen en doen ze niets.
   Opslaan: patchState().sections en .jumps; laden: secLoad(p); clearFloor ruimt op (secClear).
   ===================================================================== */
const MAXS=40, PAD=28, HDR=54, MINW=180, MINH=110, LINES=['solid','dashed','dotted','none'], H=PK.Host;
H.secs=[]; H.jumps=[];
let layer=null, uid=1, popup=null;
const wideOn=()=>!PK.LAY||PK.LAY.cls==='wide';
const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const num=(v,lo,hi,d)=>{ v=+v; return isFinite(v)?Math.min(hi,Math.max(lo,v)):d; };
const str=(v,n,d)=>{ const s=typeof v==='string'?v.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').trim().slice(0,n):''; return s||d; };
const alive=s=>s.members.filter(id=>H.devices.has(id));
// het vak van een apparaat in vloercoördinaten (uit de getekende kaart: ook goed voor een icoon)
function rectOf(r){ const b=r.el.getBoundingClientRect(); if(!b.width) return null; const a=PK.floorPoint(b.left,b.top), c=PK.floorPoint(b.right,b.bottom); return {x:a.x,y:a.y,w:c.x-a.x,h:c.y-a.y}; }
function bbox(s){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0; alive(s).forEach(id=>{ const b=rectOf(H.devices.get(id)); if(!b) return; n++; x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.w); y1=Math.max(y1,b.y+b.h); }); return n?{x0,y0,x1,y1}:null; }

/* ---------- tekenen ---------- */
function paint(s){ if(!s.el) return; const e=s.el;
  e.style.left=s.x+'px'; e.style.top=s.y+'px'; e.style.width=(s.min?Math.min(s.w,420):s.w)+'px'; e.style.height=(s.min?HDR:s.h)+'px';
  e.style.setProperty('--c',s.color); e.style.setProperty('--a',String(s.alpha)); e.classList.add('sec'); LINES.forEach(l=>e.classList.toggle('line-'+l,l===s.line)); e.classList.toggle('min',!!s.min);
  e.querySelector('.secnm').textContent=s.name; const mb=e.querySelector('.secminb'); mb.textContent=s.min?'+':'–'; mb.title=PK.pkt(s.min?'m.sc_herstel':'m.sc_min_titel'); mb.setAttribute('aria-label',mb.title); }
function sync(){ if(!layer) return; const on=wideOn(); layer.hidden=!on; if(!on) return;
  H.devices.forEach(r=>r.el.classList.remove('secmin')); H.secs.forEach(s=>{ if(s.min) alive(s).forEach(id=>H.devices.get(id).el.classList.add('secmin')); }); }
function layerAdd(el){ layer.appendChild(el); }
function build(s){ const e=document.createElement('div'); s.el=e;
  e.innerHTML='<div class="sechd"><span class="secnm"></span><button type="button" class="secminb"></button><button type="button" class="secmenu">⋯</button></div><i class="secrz e"></i><i class="secrz s"></i><i class="secrz se"></i>';
  const mn=e.querySelector('.secmenu'); mn.textContent='⋯'; mn.title=PK.pkt('m.sc_menu_titel'); mn.setAttribute('aria-label',mn.title);
  e.querySelector('.secminb').onclick=ev=>{ ev.stopPropagation(); toggleMin(s); };
  mn.onclick=ev=>{ ev.stopPropagation(); const b=mn.getBoundingClientRect(); menu(s,b.left,b.bottom+4); };
  const hd=e.querySelector('.sechd'); hd.addEventListener('contextmenu',ev=>{ ev.preventDefault(); ev.stopPropagation(); menu(s,ev.clientX,ev.clientY); }); hd.addEventListener('dblclick',ev=>{ if(!ev.target.closest('button')) edit(s); });
  // titel slepen: sectie en leden samen
  let d=null; hd.addEventListener('pointerdown',ev=>{ if(ev.button!==0||ev.target.closest('button')) return; ev.stopPropagation(); ev.preventDefault();
    d={cx:ev.clientX,cy:ev.clientY,x:s.x,y:s.y,m:alive(s).map(id=>{ const r=H.devices.get(id); return {r,x:r.x,y:r.y}; })}; hd.setPointerCapture(ev.pointerId); e.classList.add('drag'); });
  hd.addEventListener('pointermove',ev=>{ if(!d) return; const k=H.view.scale, dx=(ev.clientX-d.cx)/k, dy=(ev.clientY-d.cy)/k; s.x=Math.round(d.x+dx); s.y=Math.round(d.y+dy);
    d.m.forEach(m=>PK.pkMoveTo(m.r,m.x+dx,m.y+dy)); paint(s); PK.drawCables(); });
  const end=()=>{ if(d){ d=null; e.classList.remove('drag'); PK.drawCables(); if(PK.wslSave) PK.wslSave(); } }; hd.addEventListener('pointerup',end); hd.addEventListener('pointercancel',end);
  // grootte: nooit kleiner dan nodig is voor de leden
  ['e','s','se'].forEach(dir=>{ const g=e.querySelector('.secrz.'+dir); let st=null;
    g.addEventListener('pointerdown',ev=>{ if(ev.button!==0) return; ev.stopPropagation(); ev.preventDefault(); st={cx:ev.clientX,cy:ev.clientY,w:s.w,h:s.h,b:bbox(s)}; g.setPointerCapture(ev.pointerId); });
    g.addEventListener('pointermove',ev=>{ if(!st) return; const k=H.view.scale; let w=st.w,h=st.h; if(dir!=='s') w=st.w+(ev.clientX-st.cx)/k; if(dir!=='e') h=st.h+(ev.clientY-st.cy)/k;
      const minW=st.b?Math.max(MINW,st.b.x1+PAD-s.x):MINW, minH=st.b?Math.max(MINH,st.b.y1+PAD-s.y):MINH; s.w=Math.round(Math.max(minW,Math.min(20000,w))); s.h=Math.round(Math.max(minH,Math.min(20000,h))); paint(s); });
    const done=()=>{ if(st){ st=null; if(PK.wslSave) PK.wslSave(); } }; g.addEventListener('pointerup',done); g.addEventListener('pointercancel',done); });
  layerAdd(e); paint(s); }
function toggleMin(s){ s.min=!s.min; paint(s); sync(); PK.drawCables(); }
// de sectie groeit (nooit kleiner) tot hij de leden met ruimte omsluit
function fit(s){ const b=bbox(s); if(!b) return; const x=Math.min(s.x,Math.round(b.x0-PAD)), y=Math.min(s.y,Math.round(b.y0-HDR-12)), r=Math.max(s.x+s.w,Math.round(b.x1+PAD)), bt=Math.max(s.y+s.h,Math.round(b.y1+PAD));
  s.x=x; s.y=y; s.w=r-x; s.h=bt-y; paint(s); }
function under(cx,cy){ let best=null; H.secs.forEach(s=>{ if(s.min||cx<s.x||cx>s.x+s.w||cy<s.y||cy>s.y+s.h) return; if(!best||s.w*s.h<best.w*best.h) best=s; }); return best; }
function centre(id){ const r=H.devices.get(id), b=r&&rectOf(r); return b?{x:b.x+b.w/2,y:b.y+b.h/2}:null; }
// een apparaat is neergezet of van grootte veranderd: lid van de sectie eronder (of van geen)
function drop(id){ hover(null); if(!wideOn()||!layer) return; const c=centre(id); if(!c) return; const t=under(c.x,c.y);
  H.secs.forEach(s=>{ s.members=s.members.filter(m=>m!==id); }); if(t){ t.members.push(id); fit(t); } sync(); PK.drawCables(); }
function hover(id){ if(!layer) return; let t=null; if(id&&wideOn()){ const c=centre(id); if(c) t=under(c.x,c.y); } H.secs.forEach(s=>s.el&&s.el.classList.toggle('target',s===t)); }
PK.secDrop=drop; PK.secHover=hover;

/* ---------- formulier en menu ---------- */
function form(title,fields,okTxt){ return new Promise(res=>{ const m=document.createElement('div'); m.className='pkmodal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true');
  const box=document.createElement('form'); box.className='box scform'; const h=document.createElement('div'); h.className='scttl'; h.textContent=title; box.appendChild(h); const els={};
  fields.forEach(f=>{ const l=document.createElement('label'), t=document.createElement('span'); t.textContent=f.label; let i;
    if(f.type==='select'){ i=document.createElement('select'); f.opts.forEach(([v,tx])=>{ const o=document.createElement('option'); o.value=v; o.textContent=tx; i.appendChild(o); }); i.value=f.value; }
    else { i=document.createElement('input'); i.type=f.type; i.value=f.value; if(f.type==='text') i.maxLength=f.max||40; if(f.type==='range'){ i.min=f.min; i.max=f.max; i.step=f.step; } }
    els[f.k]=i; l.append(t,i); box.appendChild(l); });
  const row=document.createElement('div'); row.className='wsrow'; const no=document.createElement('button'), ok=document.createElement('button'); no.type='button'; no.className='small'; no.textContent=PK.pkt('m.annuleren'); ok.type='submit'; ok.className='small'; ok.style.borderColor='var(--audio)'; ok.textContent=okTxt; row.append(no,ok); box.appendChild(row); m.appendChild(box);
  const done=v=>{ m.remove(); document.removeEventListener('keydown',key,true); res(v); }, key=e=>{ if(e.key==='Escape'){ e.stopPropagation(); done(null); } };
  box.onsubmit=e=>{ e.preventDefault(); const o={}; fields.forEach(f=>{ o[f.k]=els[f.k].value; }); done(o); }; no.onclick=()=>done(null); m.addEventListener('pointerdown',e=>{ if(e.target===m) done(null); });
  document.addEventListener('keydown',key,true); document.body.appendChild(m); const f0=els[fields[0].k]; f0.focus(); if(f0.select) f0.select(); }); }
function popClose(){ if(!popup) return; document.removeEventListener('pointerdown',popup._o,true); document.removeEventListener('keydown',popup._k,true); popup.remove(); popup=null; }
function pop(x,y,items){ popClose(); const m=document.createElement('div'); m.className='dmenu'; m.setAttribute('role','menu');
  items.forEach(([t,fn])=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('role','menuitem'); const sp=document.createElement('span'); sp.textContent=t; b.appendChild(sp); b.onclick=e=>{ e.stopPropagation(); popClose(); fn(); }; m.appendChild(b); });
  document.body.appendChild(m); m.style.left=Math.max(8,Math.min(x,innerWidth-m.offsetWidth-8))+'px'; m.style.top=Math.max(8,Math.min(y,innerHeight-m.offsetHeight-8))+'px';
  m._o=e=>{ if(!m.contains(e.target)) popClose(); }; m._k=e=>{ if(e.key==='Escape'){ e.stopPropagation(); popClose(); } }; document.addEventListener('pointerdown',m._o,true); document.addEventListener('keydown',m._k,true); popup=m; const f=m.querySelector('button'); if(f) f.focus(); }
const secFields=s=>[
  {k:'name',type:'text',label:PK.pkt('m.sc_naam'),value:s.name,max:40},
  {k:'color',type:'color',label:PK.pkt('m.sc_kleur'),value:s.color},
  {k:'alpha',type:'range',label:PK.pkt('m.sc_dekking'),value:String(Math.round(s.alpha*100)),min:0,max:60,step:1},
  {k:'line',type:'select',label:PK.pkt('m.sc_lijn'),value:s.line,opts:LINES.map(l=>[l,PK.pkt('m.sc_l_'+l)])}];
const secApply=(s,o)=>{ s.name=str(o.name,40,PK.pkt('m.sc_standaardnaam')); s.color=hex(o.color)?o.color.toLowerCase():s.color; s.alpha=num(+o.alpha/100,0,0.6,s.alpha); s.line=LINES.includes(o.line)?o.line:s.line; };

/* ---------- secties ---------- */
async function create(at){ if(!layer||!wideOn()){ return; } if(H.secs.length>=MAXS){ PK.status(PK.pkt('m.sc_max',MAXS),true); return; }
  const s={id:'s'+(uid++),name:PK.pkt('m.sc_standaardnaam')+' '+(H.secs.length+1),color:'#4fd1c5',alpha:0.16,line:'solid',x:Math.round(at.x),y:Math.round(at.y),w:560,h:380,min:false,members:[]};
  const o=await form(PK.pkt('m.sc_titel_nieuw'),secFields(s),PK.pkt('m.sc_ok_maken')); if(!o) return; secApply(s,o); H.secs.push(s); build(s);
  // wat er al op ligt, hoort er nu bij
  H.devices.forEach((r,id)=>{ const c=centre(id); if(c&&under(c.x,c.y)===s){ H.secs.forEach(x=>{ x.members=x.members.filter(m=>m!==id); }); s.members.push(id); } }); fit(s); sync(); PK.drawCables(); if(PK.wslSave) PK.wslSave(); }
async function edit(s){ const o=await form(PK.pkt('m.sc_titel_edit'),secFields(s),PK.pkt('m.sc_ok_opslaan')); if(!o) return; secApply(s,o); paint(s); if(PK.wslSave) PK.wslSave(); }
function remove(s){ alive(s).forEach(id=>H.devices.get(id).el.classList.remove('secmin')); H.secs=H.secs.filter(x=>x!==s); if(s.el) s.el.remove(); PK.drawCables(); if(PK.wslSave) PK.wslSave(); }
function menu(s,x,y){ pop(x,y,[[PK.pkt('m.sc_bewerken'),()=>edit(s)],[PK.pkt(s.min?'m.sc_herstel':'m.sc_minimaliseer'),()=>toggleMin(s)],[PK.pkt('m.sc_verwijder'),()=>remove(s)]]); }

/* ---------- jump points ---------- */
function jpPaint(j){ const e=j.el; e.style.left=j.x+'px'; e.style.top=j.y+'px'; e.querySelector('b').textContent=j.n; e.querySelector('span').textContent=j.name; e.title=PK.pkt('m.jp_titel',j.n); }
function jpBuild(j){ const e=document.createElement('div'); j.el=e; e.className='jp'; e.innerHTML='<b></b><span></span>'; e.tabIndex=0; e.setAttribute('role','button');
  let d=null; e.addEventListener('pointerdown',ev=>{ if(ev.button!==0) return; ev.stopPropagation(); d={cx:ev.clientX,cy:ev.clientY,x:j.x,y:j.y,moved:false}; e.setPointerCapture(ev.pointerId); });
  e.addEventListener('pointermove',ev=>{ if(!d) return; const dx=ev.clientX-d.cx, dy=ev.clientY-d.cy; if(!d.moved&&Math.hypot(dx,dy)<5) return; d.moved=true; j.x=Math.round(d.x+dx/H.view.scale); j.y=Math.round(d.y+dy/H.view.scale); jpPaint(j); });
  const end=ev=>{ if(!d) return; const was=d; d=null; if(!was.moved&&ev.type==='pointerup') jump(j); else if(was.moved&&PK.wslSave) PK.wslSave(); }; e.addEventListener('pointerup',end); e.addEventListener('pointercancel',()=>{ d=null; });
  e.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); jump(j); } });
  e.addEventListener('contextmenu',ev=>{ ev.preventDefault(); ev.stopPropagation(); pop(ev.clientX,ev.clientY,[[PK.pkt('m.sc_bewerken'),()=>jpEdit(j)],[PK.pkt('m.jp_verwijder'),()=>{ H.jumps=H.jumps.filter(x=>x!==j); e.remove(); if(PK.wslSave) PK.wslSave(); }]]); });
  layerAdd(e); jpPaint(j); }
function jump(j){ if(!wideOn()) return; const wr=PK.floorwrap.getBoundingClientRect(), s=j.scale*PK.PKS.f; PK.viewTo(wr.width/2-j.x*s,wr.height/2-j.y*s,s); }
function jpFields(j){ const free=[1,2,3,4,5,6,7,8,9].map(n=>{ const u=H.jumps.find(x=>x.n===n&&x!==j); return [String(n),u?PK.pkt('m.jp_vervangt',n,u.name):String(n)]; });
  return [{k:'name',type:'text',label:PK.pkt('m.sc_naam'),value:j.name,max:40},{k:'n',type:'select',label:PK.pkt('m.jp_nummer'),value:String(j.n),opts:free}]; }
function jpApply(j,o){ j.name=str(o.name,40,PK.pkt('m.jp_standaardnaam')); const n=Math.round(+o.n); if(n>=1&&n<=9){ H.jumps.filter(x=>x!==j&&x.n===n).forEach(x=>{ x.el.remove(); }); H.jumps=H.jumps.filter(x=>x===j||x.n!==n); j.n=n; } }
async function jpCreate(at){ if(!layer||!wideOn()) return; const used=new Set(H.jumps.map(j=>j.n)); let n=1; while(used.has(n)&&n<9) n++;
  const j={n,name:PK.pkt('m.jp_standaardnaam'),x:Math.round(at.x),y:Math.round(at.y),scale:H.view.scale/PK.PKS.f};
  const o=await form(PK.pkt('m.jp_titel_nieuw'),jpFields(j),PK.pkt('m.sc_ok_maken')); if(!o) return; jpApply(j,o); H.jumps.push(j); jpBuild(j); if(PK.wslSave) PK.wslSave(); }
async function jpEdit(j){ const o=await form(PK.pkt('m.jp_titel_edit'),jpFields(j),PK.pkt('m.sc_ok_opslaan')); if(!o) return; jpApply(j,o); jpPaint(j); if(PK.wslSave) PK.wslSave(); }
PK.secCreate=create; PK.jumpCreate=jpCreate;

/* ---------- opslaan en laden ---------- */
function secState(){ const o={}; if(H.secs.length) o.sections=H.secs.map(s=>({id:s.id,name:s.name,color:s.color,alpha:+s.alpha.toFixed(2),line:s.line,x:s.x,y:s.y,w:s.w,h:s.h,...(s.min?{min:true}:{}),members:alive(s)}));
  if(H.jumps.length) o.jumps=H.jumps.map(j=>({n:j.n,name:j.name,x:j.x,y:j.y,scale:+j.scale.toFixed(3)})); return o; } PK.secState=secState;
function secClear(){ popClose(); H.secs.forEach(s=>s.el&&s.el.remove()); H.jumps.forEach(j=>j.el&&j.el.remove()); H.secs=[]; H.jumps=[]; uid=1; } PK.secClear=secClear;
function secLoad(p){ secClear(); if(!layer||!p) return; const seen=new Set();
  (Array.isArray(p.sections)?p.sections:[]).slice(0,MAXS).forEach(x=>{ if(!x||typeof x!=='object') return; const w=num(x.w,MINW,20000,560), h=num(x.h,MINH,20000,380);
    const s={id:'s'+(uid++),name:str(x.name,40,PK.pkt('m.sc_standaardnaam')),color:hex(x.color)?x.color.toLowerCase():'#4fd1c5',alpha:num(x.alpha,0,0.6,0.16),line:LINES.includes(x.line)?x.line:'solid',
      x:Math.round(num(x.x,-1e6,1e6,0)),y:Math.round(num(x.y,-1e6,1e6,0)),w:Math.round(w),h:Math.round(h),min:!!x.min,members:[]};
    (Array.isArray(x.members)?x.members:[]).slice(0,300).forEach(id=>{ if(typeof id==='string'&&/^d\d+$/.test(id)&&!seen.has(id)){ seen.add(id); s.members.push(id); } }); H.secs.push(s); build(s); });
  const nn=new Set(); (Array.isArray(p.jumps)?p.jumps:[]).slice(0,9).forEach(x=>{ if(!x||typeof x!=='object') return; const n=Math.round(+x.n); if(!(n>=1&&n<=9)||nn.has(n)) return; nn.add(n);
    const j={n,name:str(x.name,40,PK.pkt('m.jp_standaardnaam')),x:Math.round(num(x.x,-1e6,1e6,0)),y:Math.round(num(x.y,-1e6,1e6,0)),scale:num(x.scale,0.04,10,1)}; H.jumps.push(j); jpBuild(j); });
  sync(); } PK.secLoad=secLoad;

function init(){ layer=document.createElement('div'); layer.className='seclayer'; PK.floor.insertBefore(layer,PK.floor.firstChild);
  const pf=PK.paintFloorEmpty; PK.paintFloorEmpty=function(){ pf.apply(this,arguments); sync(); };   // loopt mee met elke kabeltekening: indeling gewisseld, apparaat vervangen
  document.addEventListener('keydown',e=>{ if(!e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||PK.typing(e)||document.querySelector('.pkmodal')) return; const m=/^Digit([1-9])$/.exec(e.code||''); if(!m) return;
    e.preventDefault(); const j=H.jumps.find(x=>x.n===+m[1]); if(j) jump(j); else PK.status(PK.pkt('m.jp_geen',m[1]),true); }); }
PK.secInit=init;
})(window.__PK);
