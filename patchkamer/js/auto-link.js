// js/auto-link.js — automatisch koppelen bij plaatsen (dialoog)
(function(PK){
/* =====================================================================
   AUTOMATISCH KOPPELEN BIJ PLAATSEN · na het plaatsen biedt een dialoog kabels aan naar apparaten die al op de vloer staan.
   Alleen na een eigen handeling van de gebruiker (slepen, Plaatsen, tik op een compacte regel) en alleen als de schakelaar aan staat.
   ===================================================================== */
const AUTOLINK_MAX=7;   // meer mogelijkheden (alle groepen samen, ook uitgevinkte) dan dit: geen dialoog, de gebruiker koppelt zelf
function autoLinkOn(){ let v=PK._alMem; try{ const s=localStorage.getItem('patchkamer.autoLink'); if(s==='1'||s==='0') v=s; }catch(e){} if(v==='1') return true; if(v==='0') return false; return !!PK.PKT.coarse.matches; }   // zonder eigen keuze: aan op een aanraakapparaat, uit op een desktop
function autoLinkSet(on){ PK._alMem=on?'1':'0'; try{ localStorage.setItem('patchkamer.autoLink',PK._alMem); }catch(e){} autoLinkPaint(); } PK.autoLinkSet=autoLinkSet;
function autoLinkPaint(){ const on=autoLinkOn(); ['alMenuCb','alSetCb'].forEach(i=>{ const e=PK.$(i); if(e) e.checked=on; }); } PK.autoLinkPaint=autoLinkPaint;
// rolvolgorde zoals Herschik: bronnen → instrumenten → effecten → mengpaneel → uitgang
function alRankA(r){ const d=r.def,p=r.ports; if(PK.isOutputDef(d)) return 3; if(PK.isMixerDef(d)) return 2; if(p.audioIn.length&&p.audioOut.length) return 1; if(p.audioIn.length) return 2.5; return 0; }
function alRankE(r){ const p=r.ports; if(!p.eventOut.length) return 3; if(!p.eventIn.length) return 0; return (r.def.kind==='instrument'||p.audioOut.length)?3:1; }
function alDirOk(kind,A,B){
  if(kind==='audio'){ const a=alRankA(A), b=alRankA(B); return a<b||(a===1&&b===1); }
  if(kind==='event') return alRankE(A)<alRankE(B);
  if(kind==='mod') return PK.isModDef(A);
  return true; }
function alReach(kind,from,to){ const seen=new Set([from]), st=[from]; while(st.length){ const x=st.pop(); if(x===to) return true; PK.Host.cables.forEach(c=>{ if(c.kind===kind&&c.from.id===x&&!seen.has(c.to.id)){ seen.add(c.to.id); st.push(c.to.id); } }); } return false; }
function alCanReceive(kind,B,port){ const i=B.inst;
  if(kind==='mastering') return typeof i.configureMastering==='function';
  if(kind==='multi') return typeof i.onBundle==='function';
  if(kind==='multievent') return typeof i.onEventBundle==='function';
  return true; }
function alCanSend(kind,A,port){ if(kind==='multi') return !!PK.bundleOf(A,port); if(kind==='multievent') return !!PK.eventBundleOf(A,port); return true; }
const alUse=(kind,id,port,dir)=>PK.Host.cables.filter(c=>c.kind===kind&&(dir==='out'?(c.from.id===id&&c.from.port===port):(c.to.id===id&&c.to.port===port))).length;
function alNm(id){ const r=PK.Host.devices.get(id); if(!r) return id; const same=[...PK.Host.devices.values()].filter(x=>x.def.id===r.def.id).length>1; return r.def.name+(same?' · '+id:''); }
function alBuild(nid){
  const R=PK.Host.devices, N=R.get(nid); if(!N) return null;
  const items=[], claimed=new Set(); let seq=0;
  R.forEach((E,eid)=>{ if(eid===nid) return;
    [[N,nid,E,eid],[E,eid,N,nid]].forEach(([A,aid,B,bid])=>{
      ['audio','event','mod','multi','mastering','multievent'].forEach(kind=>{
        const ao=PK.portList(A.ports,'out',kind), bi=PK.portList(B.ports,'in',kind); if(!ao.length||!bi.length) return;
        if(!alDirOk(kind,A,B)||!alCanReceive(kind,B)) return;
        if(PK.Host.cables.some(c=>c.kind===kind&&c.from.id===aid&&c.to.id===bid)) return;   // al gekoppeld
        if(alReach(kind,bid,aid)) return;                                               // zou een lus maken
        const sendable=ao.filter(p=>alCanSend(kind,A,p.id)); if(!sendable.length) return;
        const strict=(kind==='event'||kind==='multievent')&&sendable.length>1;           // een sequencer met sporen: één kabel per spoorpoort
        const freeSrc=sendable.filter(p=>!alUse(kind,aid,p.id,'out')&&!claimed.has(aid+':'+p.id));
        const sp=freeSrc[0]||(strict?null:sendable[0]);
        const freeDst=bi.filter(p=>!alUse(kind,bid,p.id,'in')), dp=freeDst[0]||bi[0];
        const it={n:seq++,type:'plain',kind,aid,bid,A,B,ao:sendable,bi,strict,sp:sp?sp.id:null,dp:dp.id,dstFree:freeDst.length>0,checked:false,reason:'',
          drum:kind==='event'&&PK.noteNamesOf(B.inst).length>0};
        if(!sp) it.reason=PK.pkt('m.t_al_alle_bezet'); else if(strict) claimed.add(aid+':'+sp.id);
        items.push(it); }); }); });
  // een effect mag ook tussen twee al gekoppelde apparaten (zelfde logica als neerzetten op een kabel)
  if(N.def.kind==='effect'&&PK.insertPorts(N.ports,'audio')) PK.Host.cables.forEach(c=>{ if(c.kind!=='audio'||c.from.id===nid||c.to.id===nid||!R.get(c.from.id)||!R.get(c.to.id)) return;
    items.push({n:seq++,type:'insert',kind:'insert',cable:c,aid:c.from.id,bid:c.to.id,A:R.get(c.from.id),B:R.get(c.to.id),checked:false,reason:''}); });
  if(!items.length||items.length>AUTOLINK_MAX) return null;
  // standaard aan: per bron-apparaat en soort hoogstens één voor de hand liggend voorstel, het volgende in de keten dat nog vrij is
  const dist=it=>Math.hypot(it.A.x-it.B.x,it.A.y-it.B.y), rk=it=>it.kind==='audio'?alRankA(it.B):alRankE(it.B);
  const best=new Map();
  items.filter(i=>i.type==='plain'&&!i.reason&&i.dstFree&&(i.kind==='audio'||i.kind==='event')&&!(i.kind==='audio'&&alRankA(i.B)===2.5)).forEach(i=>{ const k=i.aid+'|'+i.kind+(i.strict?'|'+i.bid:''), b=best.get(k);
    if(!b||rk(i)<rk(b)||(rk(i)===rk(b)&&dist(i)<dist(b))) best.set(k,i); });
  best.forEach(i=>{ i.checked=true; });
  const ins=items.filter(i=>i.type==='insert'); const pick=ins.find(i=>PK.isOutputDef(i.B.def))||ins.find(i=>PK.isMixerDef(i.B.def));
  if(pick){ pick.checked=true; items.forEach(i=>{ if(i.type==='plain'&&i.kind==='audio') i.checked=false; }); }
  return items; }
const alConflict=(x,y)=>x!==y&&((x.type==='insert'&&y.type==='insert')||(x.type==='insert'&&y.type==='plain'&&y.kind==='audio')||(y.type==='insert'&&x.type==='plain'&&x.kind==='audio'));
function alDialog(nid,items){
  const N=PK.Host.devices.get(nid); const GR=[['audio','m.t_al_g_audio','--audio'],['event','m.t_al_g_event','--event'],['mod','m.t_al_g_mod','--mod'],['multi','m.t_al_g_multi','--multi'],['mastering','m.t_al_g_mastering','--mastering'],['multievent','m.t_al_g_multievent','--event'],['insert','m.t_al_g_insert','--sel']];
  const m=document.createElement('div'); m.className='pkmodal aldlg'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-labelledby','alTitle');
  m.innerHTML=`<div class="box"><div><h3 id="alTitle">${PK.esc(PK.pkt('m.t_al_titel'))}</h3><div class="note">${PK.esc(PK.pkt('m.t_al_uitleg',alNm(nid)))}</div></div><div class="albody"></div>
    <div class="alfoot"><label class="alask"><input type="checkbox" id="alNever"> <span>${PK.esc(PK.pkt('m.t_al_nietmeer'))}</span></label><div class="wsrow"><button class="small" data-a="0" type="button">${PK.esc(PK.pkt('m.overslaan'))}</button><button class="small" data-a="1" type="button" style="border-color:var(--audio)">${PK.esc(PK.pkt('m.t_al_ok'))}</button></div></div></div>`;
  const body=m.querySelector('.albody'), rows=new Map();
  const portName=(list,id)=>{ const p=list.find(x=>x.id===id); return p?p.name:(id||'—'); };
  const paintRow=it=>{ const row=rows.get(it), cb=row.querySelector('input[type=checkbox]');
    cb.checked=it.checked&&!it.reason; cb.disabled=!!it.reason;
    let t;
    if(it.type==='insert') t=PK.pkt('m.t_al_tussen','<b>'+PK.esc(alNm(it.aid))+'</b>','<b>'+PK.esc(alNm(it.bid))+'</b>');
    else { const comp=PK.isOutputDef(it.B.def), tag=it.ao.length>1&&it.strict?' <span class="altag">('+PK.esc(it.drum?PK.pkt('m.t_al_drums'):PK.pkt('m.t_al_melodisch'))+')</span>':'';
      t='<b>'+PK.esc(alNm(it.aid))+'</b>'+(comp?'':' · <span class="alp">'+PK.esc(portName(it.ao,it.sp))+'</span>'+tag)+' → <b>'+PK.esc(alNm(it.bid))+'</b>'+(comp?'':' · <span class="alp">'+PK.esc(portName(it.bi,it.dp))+'</span>'); }
    row.querySelector('.altxt').innerHTML=t+(it.reason?' <span class="alwhy">— '+PK.esc(it.reason)+'</span>':'');
    const sels=row.querySelectorAll('select'); sels.forEach(s=>{ const side=s.dataset.side; [...s.options].forEach(o=>{ const busy=side==='src'?(alUse(it.kind,it.aid,o.value,'out')>0||items.some(j=>j!==it&&j.type==='plain'&&j.strict&&j.aid===it.aid&&j.sp===o.value)):false; o.disabled=busy&&o.value!==s.value; }); }); };
  const repaint=()=>items.forEach(paintRow);
  GR.forEach(([g,key,col])=>{ const list=items.filter(i=>i.kind===g); if(!list.length) return;
    const sec=document.createElement('section'); sec.className='algrp'; sec.style.setProperty('--gc','var('+col+')');
    sec.innerHTML=`<h4>${PK.esc(PK.pkt(key))}</h4>`; list.forEach(it=>{
      const row=document.createElement('div'); row.className='alrow'; row.innerHTML=`<label class="alchk"><input type="checkbox"><span class="altxt"></span></label>`;
      if(it.type==='plain'){ const mk=(side,list,cur,lab)=>{ if(list.length<2) return; const w=document.createElement('label'); w.className='alsel'; const s=document.createElement('select'); s.dataset.side=side; s.setAttribute('aria-label',lab+': '+alNm(side==='src'?it.aid:it.bid));
          list.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; s.appendChild(o); }); s.value=cur; w.append(document.createTextNode(lab+' '),s); row.appendChild(w);
          s.onchange=()=>{ if(side==='src'){ it.sp=s.value; } else it.dp=s.value; repaint(); }; };
        mk('src',it.ao,it.sp,PK.pkt('m.t_al_uitgang')); mk('dst',it.bi,it.dp,PK.pkt('m.t_al_ingang')); }
      row.querySelector('input').onchange=e=>{ it.checked=e.target.checked; if(it.checked) items.forEach(j=>{ if(alConflict(it,j)) j.checked=false; }); repaint(); };
      rows.set(it,row); sec.appendChild(row); }); body.appendChild(sec); });
  repaint();
  const done=ok=>{ const never=m.querySelector('#alNever').checked; document.removeEventListener('keydown',key,true); m.remove(); if(never) autoLinkSet(false); if(ok) alApply(nid,items.filter(i=>i.checked&&!i.reason)); };
  const key=e=>{ if(e.key==='Escape'){ e.stopPropagation(); e.preventDefault(); done(false); } };
  m.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) done(b.dataset.a==='1'); else if(e.target===m) done(false); });
  document.addEventListener('keydown',key,true); document.body.appendChild(m); m.querySelector('[data-a="1"]').focus(); }
function alApply(nid,sel){
  const made=[], removed=[];
  sel.forEach(it=>{
    if(it.type==='insert'){ const c=it.cable; if(!PK.Host.cables.includes(c)) return; const before=new Set(PK.Host.cables); if(PK.insertOnCable(nid,c)){ removed.push(c); PK.Host.cables.forEach(x=>{ if(!before.has(x)) made.push(x); }); } }
    else { const c={from:{id:it.aid,port:it.sp},to:{id:it.bid,port:it.dp},kind:it.kind}; PK.patch(c); if(PK.Host.cables.includes(c)) made.push(c); } });
  if(made.length){ PK._alUndo={made,removed}; PK._lastLayout=null; }
  PK.drawCables(); PK.status(PK.pktp('m.t_al_gemaakt',made.length!==1,made.length)+PK.pkt('m.ctrl_z_zet_terug')); }
function alUndo(){ if(!PK._alUndo) return false; const U=PK._alUndo; PK._alUndo=null; U.made.forEach(c=>{ if(PK.Host.cables.includes(c)) PK.unpatch(c); }); U.removed.forEach(c=>{ if(PK.Host.devices.has(c.from.id)&&PK.Host.devices.has(c.to.id)) PK.patch(c); }); PK.drawCables(); PK.status(PK.pkt('m.t_al_teruggedraaid')); return true; } PK.alUndo=alUndo;
function autoLinkOffer(nid){ if(!autoLinkOn()||document.querySelector('.pkmodal')) return; const items=alBuild(nid); if(items) alDialog(nid,items); } PK.autoLinkOffer=autoLinkOffer;
})(window.__PK);
