// js/camera-views.js — semantisch zoomen en camerastanden
(function(PK){

/* =====================================================================
   CAMERASTANDEN · bladwijzers van de vloer, per werkruimte (patchState.views)
   x,y = het midden van de uitsnede in vloercoördinaten, scale = zoom t.o.v. de schermschaal (1 = 100%). Zo klopt een stand ook op een ander scherm.
   ===================================================================== */
function viewsClean(list){ if(!Array.isArray(list)) return []; const out=[]; for(const s of list){ if(out.length>=30) break; if(!s||typeof s!=='object') continue; const x=+s.x, y=+s.y, sc=+s.scale; if(!isFinite(x)||!isFinite(y)||!isFinite(sc)||sc<=0) continue;
    out.push({name:String(s.name||PK.pkt('m.t_stand_n',out.length+1)).slice(0,40),x:Math.round(PK.clamp(x,-1e6,1e6)),y:Math.round(PK.clamp(y,-1e6,1e6)),scale:+PK.clamp(sc,0.04,10).toFixed(3)}); } return out; } PK.viewsClean=viewsClean;
function viewNow(){ const wr=PK.floorwrap.getBoundingClientRect(), v=PK.Host.view; return {x:Math.round((wr.width/2-v.x)/v.scale),y:Math.round((wr.height/2-v.y)/v.scale),scale:+(v.scale/PK.PKS.f).toFixed(3)}; }
function standGo(i){ const s=PK.Host.views[i]; if(!s) return false; const wr=PK.floorwrap.getBoundingClientRect(), sc=PK.clamp(s.scale*PK.PKS.f,0.1,2.5);
  PK.viewTo(wr.width/2-s.x*sc,wr.height/2-s.y*sc,sc); PK.status(PK.pkt('m.t_stand_spring',s.name)); return true; } PK.standGo=standGo;
function standSave(i){ const v=viewNow(); let n;
  if(i!=null&&i>=0&&i<PK.Host.views.length){ PK.Host.views[i]={...PK.Host.views[i],...v}; n=i; }
  else { if(PK.Host.views.length>=30){ PK.status(PK.pkt('m.t_stand_vol'),true); return -1; } PK.Host.views.push({name:PK.pkt('m.t_stand_n',PK.Host.views.length+1),...v}); n=PK.Host.views.length-1; }
  PK.status(PK.pkt('m.t_stand_bewaard',PK.Host.views[n].name)); standPaint(); return n; } PK.standSave=standSave;
function standClose(){ if(PK.STANDPOP){ PK.STANDPOP.remove(); PK.STANDPOP=null; PK.$('standBtn').classList.remove('on'); PK.$('standBtn').setAttribute('aria-expanded','false'); } } PK.standClose=standClose;
function standPaint(){ if(!PK.STANDPOP) return; const box=PK.STANDPOP; box.innerHTML='';
  const h=document.createElement('h4'); h.textContent=PK.pkt('m.t_standen_kop'); box.appendChild(h);
  if(!PK.Host.views.length){ const e=document.createElement('div'); e.className='note'; e.textContent=PK.pkt('m.t_standen_leeg'); box.appendChild(e); }
  PK.Host.views.forEach((s,i)=>{ const row=document.createElement('div'); row.className='strow'; const k=document.createElement('kbd'); k.textContent=i<9?String(i+1):'·';
    const go=document.createElement('button'); go.className='go2'; go.textContent=s.name; go.title=PK.pkt('m.t_stand_spring_titel'); go.onclick=()=>standGo(i);
    const ed=document.createElement('button'); ed.textContent='✎'; ed.title=PK.pkt('m.t_stand_hernoem'); ed.setAttribute('aria-label',PK.pkt('m.t_stand_hernoem'));
    ed.onclick=()=>{ const inp=document.createElement('input'); inp.type='text'; inp.value=s.name; inp.maxLength=40; inp.setAttribute('aria-label',PK.pkt('m.t_stand_hernoem')); go.replaceWith(inp); inp.focus(); inp.select(); let done=false;
      const fin=ok=>{ if(done) return; done=true; if(ok&&inp.value.trim()) s.name=inp.value.trim().slice(0,40); standPaint(); };
      inp.addEventListener('keydown',ev=>{ ev.stopPropagation(); if(ev.key==='Enter') fin(true); else if(ev.key==='Escape') fin(false); }); inp.addEventListener('blur',()=>fin(true)); };
    const rm=document.createElement('button'); rm.textContent='×'; rm.title=PK.pkt('m.t_stand_verwijder'); rm.setAttribute('aria-label',PK.pkt('m.t_stand_verwijder')); rm.onclick=()=>{ PK.Host.views.splice(i,1); standPaint(); };
    const ov=document.createElement('button'); ov.textContent='⤓'; ov.title=PK.pkt('m.t_stand_overschrijf'); ov.setAttribute('aria-label',PK.pkt('m.t_stand_overschrijf')); ov.onclick=()=>standSave(i);
    row.append(k,go,ed,rm); row.appendChild(ov); row.style.gridTemplateColumns='auto minmax(0,1fr) auto auto auto'; box.appendChild(row); });
  const sv=document.createElement('button'); sv.className='small'; sv.textContent=PK.pkt('m.t_stand_bewaar_nu'); sv.onclick=()=>standSave(); box.appendChild(sv);
  const n=document.createElement('div'); n.className='note'; n.textContent=PK.pkt('m.t_standen_toets'); box.appendChild(n); } PK.standPaint=standPaint;
})(window.__PK);
