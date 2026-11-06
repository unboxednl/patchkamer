// js/mod-view.js — modulatie zichtbaar op de apparaten
(function(PK){
function modViewKick(){ if(!PK.MODVIEW||!PK.MODVIEW.on||PK.MODVIEW.raf) return; PK.MODVIEW.raf=setTimeout(()=>requestAnimationFrame(modViewTick),100); } PK.modViewKick=modViewKick;
const mvNorm=(p,v)=>p.scale==='log'&&p.min>0?Math.log(v/p.min)/Math.log(p.max/p.min):(v-p.min)/(p.max-p.min);
const mvDenorm=(p,x)=>p.scale==='log'&&p.min>0?p.min*(p.max/p.min)**x:p.min+x*(p.max-p.min);
function mvFmt(v){ const a=Math.abs(v); return a>=10000?(v/1000).toFixed(1)+'k':a>=1000?(v/1000).toFixed(2)+'k':a>=100?v.toFixed(0):a>=10?v.toFixed(1):v.toFixed(2); }
function mvParams(r){ const now=performance.now(); if(r._mvP&&now-r._mvP.t<2000) return r._mvP.list; let list=[]; try{ list=typeof r.inst.params==='function'?(r.inst.params()||[]):[]; }catch(e){} r._mvP={t:now,list}; return list; }
// schuifregelaars per apparaat (host-knoppen en eigen UI in een shadow root), gekoppeld op naam van de parameter
function mvInputs(r){ const now=performance.now(); if(r._mvI&&now-r._mvI.t<2500) return r._mvI.map; const map=new Map();
  const scan=root=>{ root.querySelectorAll('input[type=range]').forEach(i=>{ let nm=i.getAttribute('aria-label')||''; if(!nm){ const k=i.closest('.k,.control,.c,label'); const l=k&&k.querySelector('label,span'); nm=l?l.textContent:''; }
      nm=nm.trim().toLowerCase(); if(nm&&!map.has(nm)) map.set(nm,i); }); root.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot) scan(e.shadowRoot); }); };
  try{ scan(r.el.querySelector('.ui')||r.el); }catch(e){} r._mvI={t:now,map}; return map; }
function mvMark(r,inp,pos,label){ let m=inp._pkMark; if(pos==null){ if(m){ m.remove(); inp._pkMark=null; } return; }
  const key=pos.toFixed(3)+'|'+PK.Host.view.scale+'|'+(r.el.classList.contains('infocus')?1:0)+'|'+(r._w||0); if(m&&m._key===key) return;
  const par=inp.parentElement; if(!par) return;
  if(!m){ m=document.createElement('span'); m.className='pkmodmark'; m.style.cssText='position:absolute;width:10px;height:10px;border-radius:50%;background:var(--mod,#b48cff);box-shadow:0 0 0 2px var(--card,#171b22);pointer-events:none;transform:translate(-50%,-50%);z-index:3';
    if(getComputedStyle(par).position==='static') par.style.position='relative'; par.appendChild(m); inp._pkMark=m; }
  const k=r.el.classList.contains('infocus')?1:PK.Host.view.scale, ib=inp.getBoundingClientRect(), pb=par.getBoundingClientRect(); if(!ib.width){ m.style.display='none'; return; } m.style.display='';
  const th=8*k; m.style.left=((ib.left-pb.left+th+(ib.width-2*th)*pos)/k)+'px'; m.style.top=((ib.top-pb.top+ib.height/2)/k)+'px'; m.title=label; m._key=key; }
function modViewTick(t){ PK.MODVIEW.raf=0; if(!PK.MODVIEW.on) return; let active=false;
  PK.MODVIEW.last=t; const vk=PK.Host.view.x+'|'+PK.Host.view.y+'|'+PK.Host.view.scale;
  const fast=new Map(); PK.Host._modSig.forEach(v=>{ if(!v.tap) return; const a=new Float32Array(v.tap.fftSize); try{ v.tap.getFloatTimeDomainData(a); }catch(e){ return; } const o=fast.get(v.tid)||{}; o[v.pid]=(o[v.pid]||0)+a[a.length-1]; fast.set(v.tid,o); });
  PK.Host.devices.forEach((r,id)=>{ const mb=r.modBar; if(!mb) return;
    const driven=PK.Host.cables.some(c=>c.kind==='mod'&&c.to.id===id&&PK.Host.devices.has(c.from.id));
    const sum={...(r.modSum||{})}; const f=fast.get(id); if(f) for(const k in f) sum[k]=PK.clamp((sum[k]||0)+f[k],-1,1);
    const keys=Object.keys(sum).filter(k=>Math.abs(sum[k])>0.0005);
    if(!driven||(!keys.length&&!f)){ if(!mb.hidden){ mb.hidden=true; mb.innerHTML=''; mvInputs(r).forEach(i=>mvMark(r,i,null)); } return; }
    active=true; if(!PK.deviceVisible(id)) return;
    const P=mvParams(r), ins=mvInputs(r); const nowS=performance.now(); if(!r._mvS||nowS-r._mvS.t>600){ let st0={}; try{ st0=r.inst.getState?r.inst.getState():{}; }catch(e){} const flat={}; for(const k in st0) if(typeof st0[k]==='number') flat[k]=st0[k]; r._mvS={t:nowS,st:flat}; } const st=r._mvS.st;
    mb.hidden=false; if(!mb.firstChild){ const h=document.createElement('button'); h.className='mh'; h.type='button'; h.title=PK.pkt('m.klik_om_de_modulatie_in'); h.onclick=()=>{ mb.classList.toggle('closed'); r.mvClosed=mb.classList.contains('closed'); }; mb.appendChild(h); if(r.mvClosed) mb.classList.add('closed'); }
    const h=mb.firstChild; h.textContent=PK.pkt('m.mod',keys.length);
    const seen=new Set();
    keys.forEach(pid=>{ const p=P.find(x=>x.id===pid); const name=p?p.name||pid:pid, off=sum[pid]; seen.add(pid);
      let chip=mb.querySelector(`.mc[data-p="${CSS.escape(pid)}"]`); if(!chip){ chip=document.createElement('div'); chip.className='mc'; chip.dataset.p=pid; chip.innerHTML='<span class="nm"></span><span class="tr"><span class="ln"></span><span class="b"></span><span class="e"></span></span><span class="v"></span>'; mb.appendChild(chip); }
      const base=p&&typeof st[pid]==='number'&&isFinite(st[pid])&&p.max>p.min?PK.clamp(mvNorm(p,st[pid]),0,1):0.5, eff=PK.clamp(base+off,0,1);
      chip.querySelector('.nm').textContent=name; chip.querySelector('.b').style.left=(base*100)+'%'; chip.querySelector('.e').style.left=(eff*100)+'%';
      const ln=chip.querySelector('.ln'); ln.style.left=(Math.min(base,eff)*100)+'%'; ln.style.width=(Math.abs(eff-base)*100)+'%';
      chip.querySelector('.v').textContent=(off>=0?'+':'')+Math.round(off*100)+'%';
      chip.title=p&&typeof st[pid]==='number'?PK.pktp('m.van_het_bereik_van_het',off>=0,name,mvFmt(st[pid]),mvFmt(mvDenorm(p,eff)),Math.round(off*100)):PK.pktp('m.van_het_bereik_van_het',off>=0,name,Math.round(off*100));
      // stip op de bijbehorende schuifregelaar
      const inp=ins.get(String(name).trim().toLowerCase()); if(inp&&p){ const mn=+inp.min, mx=+inp.max; let pos=null;
        if(Math.abs(mn-p.min)<1e-6*Math.max(1,Math.abs(p.min))+1e-9&&Math.abs(mx-p.max)<1e-6*Math.max(1,Math.abs(p.max))+1e-9){ const b=+inp.value; pos=PK.clamp((mvDenorm(p,PK.clamp(mvNorm(p,b)+off,0,1))-mn)/(mx-mn),0,1); }
        else if(mn===0&&mx===1) pos=PK.clamp(+inp.value+off,0,1);
        mvMark(r,inp,pos,chip.title); } });
    mb.querySelectorAll('.mc').forEach(c=>{ if(!seen.has(c.dataset.p)){ c.remove(); const p=P.find(x=>x.id===c.dataset.p); const inp=p&&ins.get(String(p.name||p.id).trim().toLowerCase()); if(inp) mvMark(r,inp,null); } });
  });
  if(active||PK.Host._modSig.size) modViewKick(); }
function setModView(on){ PK.MODVIEW.on=!!on; try{ localStorage.setItem('patchkamer.modview',on?'1':'0'); }catch(e){} document.body.classList.toggle('nomodview',!on); const cb=PK.$('modViewCb'); if(cb) cb.checked=!!on; if(on) modViewKick(); } PK.setModView=setModView;
})(window.__PK);
