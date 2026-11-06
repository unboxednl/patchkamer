// js/focus.js — focusweergave: apparaten naast, onder of in een raster
(function(PK){
function focusBase(){ let v=null; try{ v=localStorage.getItem('patchkamer.focusLayout'); }catch(e){} return ['row','col','grid','one'].includes(v)?v:(PK.isSheet()?'one':'row'); } PK.focusBase=focusBase;
function focusList(){ if(PK.FOCUS.all){ const ents=[...PK.Host.devices.entries()], pos=id=>PK.Host.devices.get(id); const ord=PK.layoutOrder(ents.map(([id])=>id),pos); return ord.map(id=>[id,PK.Host.devices.get(id)]); } return [...PK.Host.devices.entries()].filter(([,r])=>r.focus).sort((a,b)=>a[1].focus-b[1].focus); } PK.focusList=focusList;
function paintFocusBtn(){ if(!PK.FOCUS) return; const n=[...PK.Host.devices.values()].filter(r=>r.focus).length, b=PK.$('focusBtn'); b.textContent=n?PK.pkt('m.focus_2',n):PK.pkt('m.focus'); b.classList.toggle('on',PK.FOCUS.open); b.setAttribute('aria-pressed',String(PK.FOCUS.open)); } PK.paintFocusBtn=paintFocusBtn;
function setFocus(id,on,orderIdx){ const r=PK.Host.devices.get(id); if(!r) return; r.focus=on?(orderIdx||++PK._focusSeq):0; if(orderIdx) PK._focusSeq=Math.max(PK._focusSeq,orderIdx);
  r.focusBtn.classList.toggle('on',!!on); r.focusBtn.setAttribute('aria-pressed',String(!!on));
  if(PK.FOCUS.open){ if(on) fillFocus(); else { putBack(r); fillFocus(); } }
  paintFocusBtn(); if(!PK.FOCUS.open&&on&&focusList().length===1) PK.status(PK.pkt('m.in_focus_gezet_open_de')); } PK.setFocus=setFocus;
function putBack(r){ r.el.classList.remove('fvoff'); if(!r.el.classList.contains('infocus')) return; r.el.classList.remove('infocus'); PK.floor.appendChild(r.el); r.el.style.left=r.x+'px'; r.el.style.top=r.y+'px'; }
function buildFocusView(){ PK.focusEl=document.createElement('div'); PK.focusEl.className='focusview'; PK.focusEl.setAttribute('role','region'); PK.focusEl.setAttribute('aria-label',PK.pkt('m.focusweergave'));
  PK.focusEl.innerHTML=PK.pkt('m.focus_naast_elkaar_onder_elkaar');
  PK.focusEl.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{ PK.FOCUS.layout=b.dataset.l; try{ localStorage.setItem('patchkamer.focusLayout',PK.FOCUS.layout); }catch(e){} paintLayout(); });
  PK.focusEl.querySelector('[data-a=close]').onclick=closeFocus; PK.focusEl.querySelector('[data-a=all]').onclick=()=>{ focusList().forEach(([k])=>setFocus(k,false)); };
  PK.focusBuildTabs(); PK.focusEl.addEventListener('pointerdown',e=>e.stopPropagation()); PK.$('room').appendChild(PK.focusEl); }
function paintLayout(){ if(!PK.focusEl) return; const body=PK.focusEl.querySelector('.fvbody'); body.className='fvbody '+PK.FOCUS.layout; PK.focusEl.querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l===PK.FOCUS.layout)); PK.focusOneApply(); }
function fillFocus(){ if(!PK.focusEl) return; const body=PK.focusEl.querySelector('.fvbody'); const list=focusList();
  body.querySelectorAll('.fvempty').forEach(x=>x.remove());
  list.forEach(([,r])=>{ r.el.classList.add('infocus'); body.appendChild(r.el); });
  if(!list.length){ const p=document.createElement('div'); p.className='fvempty'; p.textContent=PK.pkt('m.nog_niets_in_focus_klik'); body.appendChild(p); }
  paintLayout(); PK.drawCables(); }
function openFocus(){ if(PK.FOCUS.open) return; PK.FOCUS.open=true; if(!PK.focusEl) buildFocusView(); PK.focusEl.hidden=false; fillFocus(); paintFocusBtn(); } PK.openFocus=openFocus;
function closeFocus(){ if(!PK.FOCUS||!PK.FOCUS.open) return; PK.FOCUS.open=false; PK.Host.devices.forEach(putBack); if(PK.FOCUS.all){ PK.FOCUS.all=false; PK.FOCUS.layout=focusBase(); } if(PK.focusEl) PK.focusEl.hidden=true; paintFocusBtn(); PK.drawCables(); } PK.closeFocus=closeFocus;
})(window.__PK);
