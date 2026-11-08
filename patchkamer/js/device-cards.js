// js/device-cards.js — vloer, audiocontext, kaarten: toevoegen, verwijderen, formaat, poorten, versies, regelaars (ctl*), frame-klok
(function(PK){
PK.selected=null, PK.armed=null;   // armed = {id,port,dir:'out'|'in',kind}
function ensureCtx(){ if(!PK.Host.ctx){ const AC=window.AudioContext||window.webkitAudioContext; let hint=PK.PK_AUDIO.latency;
    const srq=PK.PK_AUDIO.sampleRate==='auto'?0:+PK.PK_AUDIO.sampleRate; try{ PK.Host.ctx=new AC(srq?{latencyHint:hint,sampleRate:srq}:{latencyHint:hint}); }catch(e){ try{ PK.Host.ctx=new AC({latencyHint:hint}); if(srq) setTimeout(()=>PK.status(PK.pkt('m.samplerate_niet_ondersteund',srq),true),500); }catch(e2){ PK.Host.ctx=new AC(); } } PK.Host.latencyHint=hint; PK.Host.ctx.addEventListener('statechange',pkCtxState); } return PK.Host.ctx; } PK.ensureCtx=ensureCtx;
// De browser zet de audio stil (zonder klik gemaakt, slaapstand, andere audio-uitgang). Alleen Start hervatte hem: met een MIDI-keyboard druk je geen Start.
function pkResumeCtx(){ const c=PK.Host.ctx; if(c&&c.state!=='running'&&c.state!=='closed'){ try{ c.resume().catch(()=>{}); }catch(e){} } } PK.pkResumeCtx=pkResumeCtx;
function pkCtxState(){ const c=PK.Host.ctx; if(!c||c.state==='running'||c.state==='closed'||document.hidden) return; PK.status(PK.pkt('m.audio_staat_uit'),true); pkResumeCtx(); }

// apparaten die maar één keer op de vloer mogen staan (de lamp naast Start hoort bij één opname); een werkruimte die er al meer heeft, laadt gewoon (fixedId)
const SINGLE=new Set(['nl.patchkamer.recorder']);
function addDevice(defId,x,y,state,fixedId,version){
  const def=version?PK.Host.registry.get(PK.Host.key(defId,version)):PK.Host.latest(defId); if(!def) return null;
  if(!fixedId&&SINGLE.has(def.id)){ for(const [k,r] of PK.Host.devices) if(r.def.id===def.id){ PK.select(k); if(PK.showDevice) PK.showDevice(k); PK.status(PK.pkt('m.maar_een',def.name),true); return null; } }
  const ctx=ensureCtx();
  const id=fixedId||('d'+(PK.Host.nextId++)); if(fixedId){const n=parseInt(fixedId.slice(1)); if(n>=PK.Host.nextId) PK.Host.nextId=n+1;}
  let inst; try{ inst=def.create(ctx,PK.Host); }catch(e){ PK.status(PK.pkt('m.create_faalde_voor')+def.name+': '+e.message,true); return null; }
  inst._id=id; inst._def=def;
  const el=document.createElement('div'); el.className='card'+((def.ui&&def.ui.jacks)?' keepui':''); el.dataset.id=id; el.style.left=(x||40)+'px'; el.style.top=(y||40)+'px'; el.style.width=PK.clamp((def.ui&&def.ui.width)||300,200,6000)+'px';
  const bar=document.createElement('div'); bar.className='bar'; bar.innerHTML=`<span class="led"></span>${PK.devIconHTML(def,null)}<span class="nm">${def.name}</span><span class="dim"></span>`;
  const ver=document.createElement('select'); ver.className='ver'; ver.title=PK.pkt('m.versie_wisselen'); ver.setAttribute('aria-label',PK.pkt('m.versie')); ver.addEventListener('pointerdown',e=>e.stopPropagation()); ver.onchange=()=>switchVersion(id,ver.value); bar.appendChild(ver);
  const bf=document.createElement('button'); bf.className='fbtn'; bf.textContent='f'; bf.title=PK.pkt('m.focus_zet_dit_apparaat_in'); bf.setAttribute('aria-label',PK.pkt('m.focus_3')); bf.setAttribute('aria-pressed','false'); bf.onclick=e=>{e.stopPropagation(); PK.setFocus(id,!PK.Host.devices.get(id).focus);};
  const bm=document.createElement('button'); bm.textContent='–'; bm.title=PK.pkt('m.minimaliseer_tot_icoon'); bm.setAttribute('aria-label',PK.pkt('m.minimaliseer')); bm.onclick=e=>{e.stopPropagation(); setMini(id,true);};
  const bx=document.createElement('button'); bx.textContent='×'; bx.title=PK.pkt('m.verwijder'); bx.onclick=e=>{e.stopPropagation(); removeDevice(id);}; bar.append(...PK.clipBtns(id,inst),bf,bm,bx);
  const body=document.createElement('div'); body.className='body';
  const ports=document.createElement('div'); ports.className='ports';
  body.appendChild(ports);
  const mb=document.createElement('div'); mb.className='modbar'; mb.hidden=true; body.appendChild(mb);   // onder de poorten: kabelpoorten staan altijd bovenaan
  const ui=document.createElement('div'); ui.className='ui'; body.appendChild(ui);
  const ic=document.createElement('div'); ic.className='pkicon c-ic-'+PK.categoryOf(def); ic.style.setProperty('--ic',PK.catColor(PK.categoryOf(def))); ic.title=def.name+PK.pkt('m.sleep_om_te_verplaatsen_dubbelklik');
  { const m=PK.devIconParts(def,null); ic.innerHTML=`<span class="led"></span><span class="glyph${m.img?' img':''}">${m.html}</span><span class="lbl">${PK.esc(def.name)}</span>`; el.style.setProperty('--ic',PK.catColor(PK.categoryOf(def))); }
  const br=document.createElement('button'); br.className='restore'; br.textContent='⤢'; br.title=PK.pkt('m.terug_naar_de_vorige_grootte'); br.setAttribute('aria-label',PK.pkt('m.herstel_grootte')); br.onclick=e=>{e.stopPropagation(); setMini(id,false);}; ic.appendChild(br);
  ic.addEventListener('dblclick',e=>{ if(e.target.closest('button')) return; e.stopPropagation(); setMini(id,false); });
  const pb=document.createElement('div'); pb.className='pbar';
  el.append(bar,pb,body,ic); PK.floor.appendChild(el);
  const rec={def,inst,el,x:x||40,y:y||40,verSel:ver,w:null,h:null,mini:false,focus:0,modBar:mb,focusBtn:bf,iconEl:ic,ports:normPorts(def.ports,inst),portsEl:ports,pbarEl:pb,preset:null,presetSnap:null}; PK.Host.devices.set(id,rec); fillVersionSelect(ver,def); renderPorts(id);
  el.addEventListener('scroll',()=>PK.drawCables(),true);   // ports inside a scrolling UI move: keep the cables attached
  ['e','s','se'].forEach(dir=>{ const hd=document.createElement('div'); hd.className='rz '+dir; hd.title=PK.pkt('m.sleep_om_de_grootte_te'); el.appendChild(hd);
    let st=null;
    hd.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); select(id); st={cx:e.clientX,cy:e.clientY,w:el.offsetWidth,h:el.offsetHeight}; hd.setPointerCapture(e.pointerId); el.classList.add('resizing'); showDim(rec); });
    hd.addEventListener('pointermove',e=>{ if(!st) return; const k=PK.Host.view.scale; setSize(id, dir!=='s'?st.w+(e.clientX-st.cx)/k:undefined, dir!=='e'?st.h+(e.clientY-st.cy)/k:undefined); showDim(rec); });
    const end=()=>{ st=null; el.classList.remove('resizing'); }; hd.addEventListener('pointerup',end); hd.addEventListener('pointercancel',end);
    hd.addEventListener('dblclick',e=>{ e.stopPropagation(); setSize(id, dir!=='s'?null:undefined, dir!=='e'?null:undefined); });
  });
  try{ inst.mount&&inst.mount(ui); PK.ctlSnapshot(rec,ui); if(state&&inst.setState) inst.setState(state); }catch(e){ PK.status(PK.pkt('m.mount_faalde_voor')+def.name+': '+e.message,true); }
  if(inst.onStep) PK.Host.stepSubs.add(inst);
  PK.presetCardInit(id); PK.skinCardInit(id); PK.deviceMenuBind(id);
  // drag
  let drag=null; [bar,ic].forEach(h=>{   // the title bar, or the whole icon when minimised, moves the device
    h.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,select,.dmbtn')||el.classList.contains('infocus')) return; drag={cx:e.clientX,cy:e.clientY,x0:rec.x,y0:rec.y}; h.setPointerCapture(e.pointerId); select(id); e.stopPropagation();});
    h.addEventListener('pointermove',e=>{if(!drag) return; rec.x=drag.x0+(e.clientX-drag.cx)/PK.Host.view.scale; rec.y=drag.y0+(e.clientY-drag.cy)/PK.Host.view.scale; el.style.left=rec.x+'px'; el.style.top=rec.y+'px'; PK.setDrop(PK.cableThroughRect({x:rec.x,y:rec.y,w:el.offsetWidth,h:el.offsetHeight},rec.ports,id,k=>!PK.hasCable(id,k))); PK.drawCables();});
    h.addEventListener('pointerup',()=>{ const c=drag&&PK.dropCable; drag=null; if(c){ PK.setDrop(null); PK.insertOnCable(id,c); } else PK.setDrop(null); }); h.addEventListener('pointercancel',()=>{drag=null; PK.setDrop(null);}); });
  el.addEventListener('pointerdown',e=>{select(id); e.stopPropagation();});
  new ResizeObserver(en=>{ for(const x of en){ rec._w=el.offsetWidth; rec._h=el.offsetHeight; } PK.drawCables(); }).observe(el);
  PK.drawCables(); peersChanged(); return id;
} PK.addDevice=addDevice;
function initials(name){ const w=String(name).replace(/[^\p{L}\p{N} ]+/gu,' ').trim().split(/\s+/).filter(Boolean); if(!w.length) return '?'; return (w.length>1?w[0][0]+w[1][0]:w[0].slice(0,2)).toUpperCase(); }
let zTop=10;
const toFront=r=>{ r.el.style.zIndex=String(++zTop); };
// minimise to an icon and back; the size (r.w/r.h) is untouched, so restoring gives the previous size.
// Restoring may overlap other devices on purpose (you want to use it now); nothing is rearranged.
function setMini(id,on){ const r=PK.Host.devices.get(id); if(!r) return; r.mini=!!on; r.el.classList.toggle('mini',r.mini); if(!r.mini) toFront(r); select(id); PK.drawCables(); } PK.setMini=setMini;
function pkMoveTo(r,x,y){ r.x=Math.round(x); r.y=Math.round(y); r.el.style.left=r.x+'px'; r.el.style.top=r.y+'px'; } PK.pkMoveTo=pkMoveTo;
// the part of the floor you are looking at (minus the library window), in floor coordinates
function viewArea(){ const wr=PK.floorwrap.getBoundingClientRect(); let L=wr.left,R=wr.right,T=wr.top,B=wr.bottom;
  const lw=document.getElementById('libwin');
  if(lw&&!lw.hidden&&!lw.classList.contains('min')){ const lb=lw.getBoundingClientRect(); if(lb.width&&lb.bottom>T&&lb.top<B&&lb.right>L&&lb.left<R){ if(lw.classList.contains('sheet')) B=Math.max(T+60,Math.min(B,lb.top)); else if(R-lb.right>=lb.left-L) L=Math.max(L,lb.right); else R=Math.min(R,lb.left); } }
  const a=PK.floorPoint(L,T), b=PK.floorPoint(R,B); return {x0:a.x,y0:a.y,x1:b.x,y1:b.y,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2}; } PK.viewArea=viewArea;
// push devices out of the way of a newly placed one; whatever gets pushed may push others in turn.
// Devices that already overlapped each other and are not in the way are left alone.
function makeRoom(startId){
  const G=30, box=r=>({x:r.x,y:r.y,w:r.el.offsetWidth,h:r.el.offsetHeight});
  const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
  const S=box(PK.Host.devices.get(startId)), queue=[startId], moved=new Set(); let guard=0;
  while(queue.length&&guard++<600){
    const mid=queue.shift(), M=box(PK.Host.devices.get(mid));
    PK.Host.devices.forEach((c,cid)=>{ if(cid===mid||cid===startId) return; const C=box(c); if(!hit(M,C)) return;
      const right=C.x+C.w/2>=M.x+M.w/2, down=C.y+C.h/2>=M.y+M.h/2;
      const opt=[{x:right?M.x+M.w+G:M.x-G-C.w,y:C.y},{x:C.x,y:down?M.y+M.h+G:M.y-G-C.h}]
        .map(o=>({...o,d:Math.abs(o.x-C.x)+Math.abs(o.y-C.y),back:mid!==startId&&hit({...C,x:o.x,y:o.y},S)}))
        .sort((a,b)=>(a.back-b.back)||(a.d-b.d));
      c.el.classList.add('moving'); pkMoveTo(c,opt[0].x,opt[0].y); moved.add(cid); queue.push(cid); });
  }
  if(moved.size){ const t0=performance.now(); const tick=()=>{ PK.drawCables(); if(performance.now()-t0<450) requestAnimationFrame(tick); else moved.forEach(k=>{const r=PK.Host.devices.get(k); r&&r.el.classList.remove('moving');}); }; requestAnimationFrame(tick); }
  return moved.size;
}
function afterAdd(nid){ const r=PK.Host.devices.get(nid); if(!r) return; toFront(r); const n=makeRoom(nid); select(nid);
  r.el.classList.remove('fresh'); void r.el.offsetWidth; r.el.classList.add('fresh'); setTimeout(()=>r.el.classList.remove('fresh'),1700); PK.drawCables();
  PK.status(PK.pkt('m.geplaatst',r.def.name)+(n?PK.pktp('m.apparaten_opgeschoven_apparaat_opgeschoven',n>1,n):'')); } PK.afterAdd=afterAdd;
function modApply(tid){ const r=PK.Host.devices.get(tid); if(!r||typeof r.inst.modulate!=='function') return; const m=PK.Host._modOff.get(tid), sum={};
  if(m) m.forEach(o=>{ for(const k in o){ const v=+o[k]; if(isFinite(v)) sum[k]=(sum[k]||0)+v; } }); for(const k in sum) sum[k]=PK.clamp(sum[k],-1,1);
  PK.prmFilter(tid,sum); r.modSum=sum; PK.modViewKick(); PK.prmModNotify(tid,sum);
  try{ r.inst.modulate(sum); }catch(e){ console.warn('modulate()',r.def.name,e); } } PK.modApply=modApply;
function modInfo(id){ const r=PK.Host.devices.get(id); let params=[]; try{ params=typeof r.inst.params==='function'?(r.inst.params()||[]):[]; }catch(e){ console.warn('params()',r.def.name,e); }
  return {id,name:r.def.name,def:r.def.id,version:r.def.version,params}; }
// tell every device on a mod cable at `id` who it drives (onModTargets) and who drives it (onModSources)
function modNotify(...ids){ const touched=new Set(ids); PK.Host.cables.forEach(c=>{ if(c.kind==='mod'&&(ids.includes(c.to.id)||ids.includes(c.from.id))){ touched.add(c.from.id); touched.add(c.to.id); } });
  touched.forEach(k=>{ const r=PK.Host.devices.get(k); if(!r) return; const mc=PK.Host.cables.filter(c=>c.kind==='mod');
    if(r.inst.onModTargets){ const t=[...new Set(mc.filter(c=>c.from.id===k).map(c=>c.to.id))].filter(x=>PK.Host.devices.has(x)).map(modInfo); try{ r.inst.onModTargets(t); }catch(e){ console.warn('onModTargets',e); } }
    if(r.inst.onModSources){ const s=mc.filter(c=>c.to.id===k&&PK.Host.devices.has(c.from.id)).map(c=>({id:c.from.id,port:c.to.port,name:PK.Host.devices.get(c.from.id).def.name,def:PK.Host.devices.get(c.from.id).def.id})); try{ r.inst.onModSources(s); }catch(e){ console.warn('onModSources',e); } } }); } PK.modNotify=modNotify;
// v1.12: mastering. Wie hangt er aan de mastering-uitgang van `id`? (onMasteringTargets)
function masteringTargets(id){ const seen=new Set(), all=[...PK.Host.devices.entries()], cnt=new Map(); all.forEach(([,r])=>cnt.set(r.def.id,(cnt.get(r.def.id)||0)+1));
  return PK.Host.cables.filter(c=>c.kind==='mastering'&&c.from.id===id&&PK.Host.devices.has(c.to.id)).map(c=>c.to.id).filter(x=>!seen.has(x)&&seen.add(x))
    .map(x=>{ const r=PK.Host.devices.get(x); return {id:x,name:r.def.name+(cnt.get(r.def.id)>1?' · '+x:''),def:r.def.id,version:r.def.version}; }); } PK.masteringTargets=masteringTargets;
function masteringNotify(id){ const r=PK.Host.devices.get(id); if(r&&typeof r.inst.onMasteringTargets==='function'){ try{ r.inst.onMasteringTargets(masteringTargets(id)); }catch(e){ console.warn('onMasteringTargets',e); } } } PK.masteringNotify=masteringNotify;
// ---------- regelaars van een apparaat (contract v1.13) ----------
function ctlUi(rec){ return rec.el.querySelector(':scope > .body > .ui')||rec.el; }
function ctlAllEls(root){ const out=[]; const walk=r=>{ r.querySelectorAll('input[type=range],select,input[type=checkbox],button').forEach(x=>out.push(x)); r.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot) walk(e.shadowRoot); }); }; if(root){ walk(root); if(root.shadowRoot) walk(root.shadowRoot); } return out; }
function ctlKind(x){ return x.tagName==='SELECT'?'select':x.tagName==='BUTTON'?'button':x.type==='checkbox'?'check':'range'; }
function ctlLabel(x,kind){ let t=''; if(kind==='button') t=x.getAttribute('aria-label')||x.textContent||x.title||''; else t=PK.ctlBase(x); return String(t||'').replace(/\s+/g,' ').trim().slice(0,48); }
function ctlList(rec){ const els0=ctlAllEls(ctlUi(rec)), els=PK.pnlOrder?PK.pnlOrder(rec,els0):els0, n=new Map(), list=[]; rec._ctlEls=new Map();
  els.forEach(x=>{ const kind=ctlKind(x); if(kind!=='range'&&(x.disabled||x.hidden)) return; const label=ctlLabel(x,kind); if(kind==='button'&&!label) return; const base=kind+'|'+label, c=n.get(base)||0; n.set(base,c+1); const key=base+'#'+c;
    const sfx=x.dataset&&x.dataset.pkSuffix?String(x.dataset.pkSuffix).replace(/\s+/g,' ').trim().slice(0,16):'';   // zichtbare naam: 'Trim - T3'; de sleutel blijft gelijk, dus bestaande koppelingen blijven werken
    const d={key,label:(label||(kind+' '+(c+1)))+(sfx?' - '+sfx:''),type:kind}; if(kind==='range'){ d.min=+x.min||0; d.max=x.max===''?100:+x.max; d.step=+x.step||0; d.value=+x.value; d.scale=x.dataset&&x.dataset.pkScale==='log'?'log':'lin'; }
    else if(kind==='select'){ d.options=[...x.options].map(o=>({value:o.value,text:o.textContent})); d.value=x.value; } else if(kind==='check') d.value=!!x.checked;
    rec._ctlEls.set(key,x); list.push({d,el:x}); });
  return list; } PK.ctlList=ctlList;
function ctlSet(rec,key,f){ if(!Number.isFinite(f)) return false; f=Math.max(0,Math.min(1,f)); let x=rec._ctlEls&&rec._ctlEls.get(key); if(!x||!x.isConnected){ ctlList(rec); x=rec._ctlEls.get(key); } if(!x) return false;
  const kind=ctlKind(x);
  if(kind==='range'){ const mn=+x.min||0, mx=x.max===''?100:+x.max, st=+x.step||0, log=x.dataset&&x.dataset.pkScale==='log'&&mn>0&&mx>mn; let v=log?mn*Math.pow(mx/mn,f):mn+f*(mx-mn); if(st>0) v=mn+Math.round((v-mn)/st)*st; v=Math.max(mn,Math.min(mx,+v.toFixed(10)));
    if(String(v)!==x.value){ PK.ctlFire(x,v,false); } clearTimeout(x._pkT); x._pkT=setTimeout(()=>x.dispatchEvent(new Event('change',{bubbles:true,composed:true})),200); return true; }
  if(kind==='select'){ const o=[...x.options]; if(!o.length) return false; const v=o[Math.min(o.length-1,Math.round(f*(o.length-1)))].value; if(x.value!==v){ x.value=v; x.dispatchEvent(new Event('input',{bubbles:true,composed:true})); x.dispatchEvent(new Event('change',{bubbles:true,composed:true})); } return true; }
  if(kind==='check'){ const want=f>=0.5; if(x.checked!==want) x.click(); return true; }
  if(f>=0.5){ x.click(); return true; } return false; } PK.ctlSet=ctlSet;
function removeDevice(id){ const r=PK.Host.devices.get(id); if(!r) return; PK.Host.cables.filter(c=>c.from.id===id||c.to.id===id).forEach(PK.unpatch); PK.Host._modOff.delete(id); PK.Host._dropModSig(v=>v.sid===id||v.tid===id); PK.prmCleanup(id); if(PK.pnlOff) PK.pnlOff(r); try{r.inst.unmount&&r.inst.unmount(); r.inst.destroy&&r.inst.destroy();}catch(e){} PK.Host.stepSubs.delete(r.inst); r.el.remove(); PK.Host.devices.delete(id); if(PK.selected===id) PK.selected=null; PK.drawCables(); if(typeof PK.paintFocusBtn==='function') PK.paintFocusBtn(); peersChanged(); } PK.removeDevice=removeDevice;
// size: null = the device's own default (width from def.ui.width, height follows the content)
function defWidth(def){ return PK.clamp((def.ui&&def.ui.width)||300,200,6000); } PK.defWidth=defWidth;
function minWidth(def){ return PK.clamp((def.ui&&def.ui.minWidth)||200,200,defWidth(def)); } PK.minWidth=minWidth;
function setSize(id,w,h){
  const r=PK.Host.devices.get(id); if(!r) return;
  if(w!==undefined){ r.w=w===null?null:Math.round(PK.clamp(w,minWidth(r.def),6000)); r.el.style.width=(r.w??defWidth(r.def))+'px'; }
  if(h!==undefined){ r.h=h===null?null:Math.round(PK.clamp(h,120,20000)); r.el.style.height=r.h===null?'':r.h+'px'; r.el.classList.toggle('sized-h',r.h!==null); }
  PK.drawCables();
} PK.setSize=setSize;
function showDim(r){ const d=r.el.querySelector('.bar .dim'); if(d) d.textContent=`${r.el.offsetWidth} × ${r.el.offsetHeight}`; }
function pkApplyI18n(d){ const o=d&&d.i18n&&d.i18n[PK.PK_LANG]; if(!o||typeof o!=='object') return d; if(typeof o.name==='string'&&o.name) d.name=o.name; if(o.ports&&typeof o.ports==='object'&&d.ports) for(const k of ['audioIn','audioOut','eventIn','eventOut','modIn','modOut','multiIn','multiOut','masteringIn','masteringOut','multiEventIn','multiEventOut']) if(Array.isArray(d.ports[k])) d.ports[k].forEach(p=>{ if(p&&typeof o.ports[p.id]==='string') p.name=o.ports[p.id]; }); return d; } PK.pkApplyI18n=pkApplyI18n;
function normPorts(P,inst){ P=P||{}; const L=k=>(Array.isArray(P[k])?P[k]:[]).map(x=>({id:String(x.id),name:x.name!=null?String(x.name):String(x.id)}));
  const r={audioIn:L('audioIn'),audioOut:L('audioOut'),eventIn:L('eventIn'),eventOut:L('eventOut'),modIn:L('modIn'),modOut:L('modOut'),multiIn:L('multiIn'),multiOut:L('multiOut'),masteringIn:L('masteringIn'),masteringOut:L('masteringOut'),multiEventIn:L('multiEventIn'),multiEventOut:L('multiEventOut')};
  if(inst&&typeof inst.params==='function'&&!r.modIn.some(x=>x.id==='mod')) r.modIn.push({id:'mod',name:'Mod'});   // contract v1.3
  return r; } PK.normPorts=normPorts;
const portList=(P,dir,kind)=>P[({audio:'audio',event:'event',mod:'mod',multi:'multi',mastering:'mastering',multievent:'multiEvent'}[kind]||'mod')+(dir==='out'?'Out':'In')]||[]; PK.portList=portList;
function makePortEl(id,p,kind,dir,label){ const d=document.createElement('div'); d.className=`port ${kind}`; d.dataset.port=p.id; d.dataset.kind=kind; d.dataset.dir=dir; d.title=PK.pkt('m.poort_titel',p.name,kind==='audio'?PK.pkt('m.soort_audio'):kind==='event'?PK.pkt('m.soort_events'):kind==='multi'?PK.pkt('m.soort_bundel'):kind==='mastering'?PK.pkt('m.soort_mastering'):kind==='multievent'?PK.pkt('m.soort_multievent'):PK.pkt('m.soort_sturing'),dir==='in'?PK.pkt('m.richting_in'):PK.pkt('m.richting_uit'));
  const dot=document.createElement('span'); dot.className='dot'; const t=document.createElement('span'); t.textContent=label!=null?label:p.name; d.append(dot,t);
  d.addEventListener('pointerdown',e=>{ if(e.button!==0) return; e.stopPropagation(); e.preventDefault(); PK.startWire(id,p.id,dir,kind,e); }); d.addEventListener('click',e=>e.stopPropagation()); return d; } PK.makePortEl=makePortEl;
function renderPorts(id){ const r=PK.Host.devices.get(id); if(!r) return; const box=r.portsEl; box.innerHTML='';
  if(r.def.ui&&r.def.ui.jacks){ box.hidden=true; return; } box.hidden=false;
  const cin=document.createElement('div'); cin.className='col in'; const cout=document.createElement('div'); cout.className='col out';
  r.ports.audioIn.forEach(x=>cin.appendChild(makePortEl(id,x,'audio','in'))); r.ports.eventIn.forEach(x=>cin.appendChild(makePortEl(id,x,'event','in'))); r.ports.modIn.forEach(x=>cin.appendChild(makePortEl(id,x,'mod','in'))); r.ports.multiIn.forEach(x=>cin.appendChild(makePortEl(id,x,'multi','in'))); r.ports.masteringIn.forEach(x=>cin.appendChild(makePortEl(id,x,'mastering','in'))); r.ports.multiEventIn.forEach(x=>cin.appendChild(makePortEl(id,x,'multievent','in')));
  r.ports.audioOut.forEach(x=>cout.appendChild(makePortEl(id,x,'audio','out'))); r.ports.eventOut.forEach(x=>cout.appendChild(makePortEl(id,x,'event','out'))); r.ports.modOut.forEach(x=>cout.appendChild(makePortEl(id,x,'mod','out'))); r.ports.multiOut.forEach(x=>cout.appendChild(makePortEl(id,x,'multi','out'))); r.ports.masteringOut.forEach(x=>cout.appendChild(makePortEl(id,x,'mastering','out'))); r.ports.multiEventOut.forEach(x=>cout.appendChild(makePortEl(id,x,'multievent','out')));
  box.append(cin,cout); } PK.renderPorts=renderPorts;
function fillVersionSelect(sel,def){ sel.innerHTML=''; PK.Host.versionsOf(def.id).forEach(d=>{const o=document.createElement('option'); o.value=d.version; o.textContent='v'+d.version; sel.appendChild(o);}); sel.value=def.version; sel.disabled=sel.children.length<2; }
function refreshVersionSelects(){ PK.Host.devices.forEach(r=>fillVersionSelect(r.verSel,r.def)); } PK.refreshVersionSelects=refreshVersionSelects;
function switchVersion(id,version){
  const r=PK.Host.devices.get(id); if(!r||r.def.version===version) return; const def=PK.Host.registry.get(PK.Host.key(r.def.id,version)); if(!def) return;
  const state=r.inst.getState?r.inst.getState():{}; const cables=PK.Host.cables.filter(c=>c.from.id===id||c.to.id===id).map(c=>({...c})); const {x,y,w,h,mini}=r;
  removeDevice(id); const nid=addDevice(def.id,x,y,state,id,version); if(!nid){PK.status(PK.pkt('m.versiewissel_mislukt_apparaat_verwijderd'),true); return;}
  if(r.skin) PK.skinRestore(nid,r.skin);
  if(w!==null||h!==null) setSize(nid, w===null?undefined:w, h===null?undefined:h);
  if(mini) setMini(nid,true);
  const dropped=[]; requestAnimationFrame(()=>{ cables.forEach(c=>{ const ok=(c.from.id!==id||portExists(nid,c.from.port,'out'))&&(c.to.id!==id||portExists(nid,c.to.port,'in')); if(ok) PK.patch(c); else dropped.push(c.from.id===id?c.from.port:c.to.port); });
    PK.status(`${def.name}: v${r.def.version} → v${version}`+(dropped.length?PK.pkt('m.kabels_losgehaald_poort_bestaat_niet',dropped.join(', ')):''),dropped.length>0); select(nid); });
}
// na een scan: een geplaatst apparaat waarvan de code is gewijzigd (zelfde versienummer) wordt opnieuw gemaakt met zijn state, kabels, grootte en stand
function reloadDevice(id){
  const r=PK.Host.devices.get(id); if(!r) return false; const def=PK.Host.registry.get(PK.Host.key(r.def.id,r.def.version)); if(!def||def===r.def) return false;
  const wasSel=PK.selected===id, state=r.inst.getState?r.inst.getState():{}, cables=PK.Host.cables.filter(c=>c.from.id===id||c.to.id===id).map(c=>({...c})), {x,y,w,h,mini}=r;
  removeDevice(id); const nid=addDevice(def.id,x,y,state,id,def.version); if(!nid) return true;
  if(r.skin) PK.skinRestore(nid,r.skin);
  if(w!==null||h!==null) setSize(nid, w===null?undefined:w, h===null?undefined:h);
  if(mini) setMini(nid,true);
  requestAnimationFrame(()=>{ cables.forEach(c=>{ const ok=(c.from.id!==id||portExists(nid,c.from.port,'out'))&&(c.to.id!==id||portExists(nid,c.to.port,'in')); if(ok) PK.patch(c); }); if(wasSel) select(nid); });
  return true; }
// newKeys: de apparaat@versie-sleutels die deze scan voor het eerst zag. Staat er een apparaat op de vloer met een lagere versie en bracht de scan een hogere, dan gaat het mee omhoog (state, kabels en grootte blijven).
function updatePlaced(newKeys){ let n=0; [...PK.Host.devices.keys()].forEach(id=>{ try{
    const r=PK.Host.devices.get(id); if(!r) return; const top=PK.Host.latest(r.def.id);
    if(newKeys&&top&&top.version!==r.def.version&&PK.cmpVer(top.version,r.def.version)>0&&newKeys.has(PK.Host.key(top.id,top.version))){ switchVersion(id,top.version); n++; }
    else if(reloadDevice(id)) n++; }catch(e){ console.warn('reloadDevice()',e); } }); return n; } PK.updatePlaced=updatePlaced;
function portExists(id,port,dir){ const r=PK.Host.devices.get(id); return !!(r&&r.el.querySelector(`.port[data-port="${port}"][data-dir="${dir}"]`)); }
function select(id){ const ch=PK.selected!==id; PK.selected=id; PK.Host.devices.forEach((r,k)=>r.el.classList.toggle('sel',k===id)); if(ch) peersChanged(); } PK.select=select;
let _frameRaf=0, _vis={t:-1,wr:null};
function deviceVisible(id){ const r=PK.Host.devices.get(id); if(!r||r.mini) return false; if(document.hidden) return false;
  if(r.el.classList.contains('infocus')) return !r.el.classList.contains('fvoff'); if(typeof PK.FOCUS!=='undefined'&&PK.FOCUS&&PK.FOCUS.open) return false;
  if(PK.LITE.state&&!r.el.classList.contains('keepui')) return false;
  const now=performance.now(); if(now-_vis.t>100||!_vis.wr){ _vis.wr=PK.floorwrap.getBoundingClientRect(); _vis.t=now; }
  const v=PK.Host.view, k=v.scale, x=v.x+r.x*k, y=v.y+r.y*k, w=(r._w||r.el.offsetWidth)*k, h=(r._h||r.el.offsetHeight)*k, W=_vis.wr.width, H=_vis.wr.height;
  return x<W&&y<H&&x+w>0&&y+h>0; } PK.deviceVisible=deviceVisible;
function frameKick(){ if(!_frameRaf&&PK.Host._frames.size) _frameRaf=requestAnimationFrame(frameRun); } PK.frameKick=frameKick;
function frameRun(t){ _frameRaf=0; if(!PK.Host._frames.size) return; const seen=new Map();
  for(const e of [...PK.Host._frames]){ if(t-e.last<e.iv-1) continue; const id=e.inst&&e.inst._id; let vis=seen.get(id); if(vis===undefined){ vis=deviceVisible(id); seen.set(id,vis); } if(!vis) continue; e.last=t; try{ e.cb(t); }catch(err){ console.warn('frame()',err); } }
  _frameRaf=requestAnimationFrame(frameRun); }
// contract v1.14: optionele noteNames() van een apparaat, gezuiverd tot hoogstens 128 items { note 0..127, name } in de volgorde van het apparaat
function noteNamesOf(inst){ try{ if(!inst||typeof inst.noteNames!=='function') return []; const l=inst.noteNames(); if(!Array.isArray(l)) return []; const seen=new Set(), o=[];
  for(const x of l){ if(o.length>=128) break; const n=Math.round(Number(x&&x.note)); if(!(n>=0&&n<=127)||typeof x.name!=='string'||!x.name) continue; o.push({note:n,name:x.name.slice(0,40)}); seen.add(n); } return o; }catch(e){ return []; } } PK.noteNamesOf=noteNamesOf;
function peersChanged(){ if(peersChanged.raf) return; peersChanged.raf=requestAnimationFrame(()=>{ peersChanged.raf=0; PK.Host.devices.forEach(r=>{ if(typeof r.inst.onPeers==='function'){ try{ r.inst.onPeers(PK.Host.peers(r.inst)); }catch(e){ console.warn('onPeers()',r.def.name,e); } } }); }); } PK.peersChanged=peersChanged;
})(window.__PK);
