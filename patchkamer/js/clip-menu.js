// js/clip-menu.js — klembord, fase 4: instelling "Plakken op de maatgrens", plakmenu (octaaf, uitlijnen op volgorde, lengte, direct) bij de knop Plak
(function(PK){
/* =====================================================================
   PLAKOPTIES · gelden voor één plak, behalve de instelling (localStorage `patchkamer.clipBar`, standaard aan).
   Het menu is een klein dialoogje (rol dialog) bij de pijl naast Plak; ook te openen met rechtsklik op Plak.
   clip.js roept PK.clipOptsPrep (octaaf verschuiven, opties controleren), PK.clipBarOn en PK.clipMoreBtn.
   ===================================================================== */
const KEY='patchkamer.clipBar', OCT_MAX=4;
let mem=null, MENU=null;

// ---- instelling ----
function clipBarOn(){ let v=mem; try{ const s=localStorage.getItem(KEY); if(s==='1'||s==='0') v=s; }catch(e){} return v!=='0'; } PK.clipBarOn=clipBarOn;
function clipBarPaint(){ const e=PK.$('clipBarCb'); if(e) e.checked=clipBarOn(); }
function clipBarSet(on){ mem=on?'1':'0'; try{ localStorage.setItem(KEY,mem); }catch(e){} clipBarPaint(); if(!on&&PK.clipOnStop) PK.clipOnStop(); } PK.clipBarSet=clipBarSet;   // uit: wat nog wacht plakt nu meteen

// ---- opties toepassen op de clip (vóór clipFit) ----
// geeft {clip, notes:[tekst], byOrder, matchLen} of {err:tekst}
function clipOptsPrep(c,o){
  o=o||{}; const r={clip:c,notes:[],byOrder:false,matchLen:false};
  const oct=Math.max(-OCT_MAX,Math.min(OCT_MAX,Math.round(+o.octave||0)));
  if(oct){
    if(c.kind!=='notes') r.notes.push(PK.pkt('m.clip_o_oct_drums'));
    else {
      const keep=[]; let out=0; c.notes.forEach(e=>{ const n=e.n+oct*12; if(n<0||n>127) out++; else keep.push({...e,n}); });
      if(!keep.length&&c.notes.length) return {err:PK.pkt('m.clip_o_oct_alles',(oct>0?'+':'−')+Math.abs(oct))};
      r.clip={...c,notes:keep}; r.notes.push(PK.pkt('m.clip_o_oct_gedaan',(oct>0?'+':'−')+Math.abs(oct)));
      if(out) r.notes.push(PK.pktp('m.clip_o_oct_buiten',out!==1,out)); }
  }
  if(o.byOrder){ if(c.kind==='drums') r.byOrder=true; else r.notes.push(PK.pkt('m.clip_o_volgorde_noten')); }
  r.matchLen=!!o.matchLen;
  return r;
} PK.clipOptsPrep=clipOptsPrep;

// ---- menu ----
function menuClose(back){
  const m=MENU; if(!m) return; MENU=null;
  document.removeEventListener('pointerdown',m._out,true); document.removeEventListener('keydown',m._key,true); document.removeEventListener('focusin',m._fin,true); window.removeEventListener('resize',m._res);
  if(m._btn) m._btn.setAttribute('aria-expanded','false'); m.remove();
  if(back&&m._btn&&m._btn.isConnected) m._btn.focus();
} PK.clipMenuClose=menuClose;

function menuOpen(id,anchor,btn){
  const wasOpen=MENU&&MENU._id===id; menuClose(false); if(wasOpen) return;
  const r=PK.Host.devices.get(id); if(!r) return; const inf=PK.clipInfoOf(id), paste=inf&&Array.isArray(inf.paste)?inf.paste:[];
  const st={octave:0,byOrder:false,matchLen:false};
  const m=document.createElement('div'); m.className='clipmenu'; m.setAttribute('role','dialog'); m.setAttribute('aria-label',PK.pkt('m.clip_o_titel')); m._id=id; m._btn=btn;
  const mkBtn=(txt,cls,fn,label)=>{ const b=document.createElement('button'); b.type='button'; b.className=cls||''; b.textContent=txt; if(label) b.setAttribute('aria-label',label); b.onclick=e=>{ e.stopPropagation(); fn(); }; return b; };
  const ttl=document.createElement('div'); ttl.className='ttl'; ttl.textContent=PK.pkt('m.clip_o_voor',r.def.name+(inf&&inf.name?' · '+inf.name:'')); m.appendChild(ttl);
  // octaafstapper
  const row=document.createElement('div'); row.className='row oct'; const lab=document.createElement('span'); lab.textContent=PK.pkt('m.clip_o_octaaf'); const val=document.createElement('output'); val.setAttribute('aria-live','polite');
  const show=()=>{ val.textContent=st.octave?(st.octave>0?'+':'−')+Math.abs(st.octave):'0'; dn.disabled=st.octave<=-OCT_MAX; up.disabled=st.octave>=OCT_MAX; };
  const dn=mkBtn('−','',()=>{ st.octave=Math.max(-OCT_MAX,st.octave-1); show(); },PK.pkt('m.clip_o_oct_lager')), up=mkBtn('+','',()=>{ st.octave=Math.min(OCT_MAX,st.octave+1); show(); },PK.pkt('m.clip_o_oct_hoger'));
  row.append(lab,dn,val,up); m.appendChild(row); show();
  const noNotes=!paste.includes('notes'), noDrums=!paste.includes('drums');
  if(noNotes){ dn.disabled=up.disabled=true; row.classList.add('dis'); row.title=PK.pkt('m.clip_o_alleen_noten'); }
  const chk=(key,txt,dis,why)=>{ const l=document.createElement('label'); const c=document.createElement('input'); c.type='checkbox'; c.onchange=()=>{ st[key]=c.checked; }; const s=document.createElement('span'); s.textContent=txt; l.append(c,s); if(dis){ c.disabled=true; l.classList.add('dis'); l.title=why; } m.appendChild(l); return c; };
  chk('byOrder',PK.pkt('m.clip_o_volgorde'),noDrums,PK.pkt('m.clip_o_alleen_drums'));
  chk('matchLen',PK.pkt('m.clip_o_lengte'),false,'');
  const hint=document.createElement('div'); hint.className='hint'; hint.textContent=PK.pkt('m.clip_o_hint'); m.appendChild(hint);
  const go=direct=>{ menuClose(true); PK.select(id); PK.clipPaste(id,{direct,opts:{octave:st.octave,byOrder:st.byOrder,matchLen:st.matchLen}}); };
  const acts=document.createElement('div'); acts.className='row act'; acts.append(mkBtn(PK.pkt('m.clip_plak'),'go',()=>go(false)),mkBtn(PK.pkt('m.clip_o_direct'),'go',()=>go(true))); m.appendChild(acts);
  document.body.appendChild(m);
  const place=()=>{ const b=anchor.getBoundingClientRect(), W=m.offsetWidth, H=m.offsetHeight; m.style.left=Math.max(8,Math.min(b.left,innerWidth-W-8))+'px'; const below=b.bottom+4, top=(below+H>innerHeight-8)?b.top-H-4:below; m.style.top=Math.max(8,Math.min(top,innerHeight-H-8))+'px'; };   // altijd binnen het scherm, ook als de kaart half buiten beeld staat
  place();
  m._out=e=>{ if(m.contains(e.target)||e.target===btn) return; menuClose(false); };
  m._key=e=>{
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); menuClose(true); return; }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ const f=[...m.querySelectorAll('button:not([disabled]),input:not([disabled])')]; if(!f.length) return; e.preventDefault(); const i=f.indexOf(document.activeElement); f[(i+(e.key==='ArrowDown'?1:-1)+f.length)%f.length].focus(); return; }
    if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&row.contains(document.activeElement)){ e.preventDefault(); (e.key==='ArrowLeft'?dn:up).click(); }
  };
  m._fin=e=>{ if(!m.contains(e.target)&&e.target!==btn) menuClose(false); };
  m._res=()=>menuClose(false);
  document.addEventListener('pointerdown',m._out,true); document.addEventListener('keydown',m._key,true); document.addEventListener('focusin',m._fin,true); window.addEventListener('resize',m._res);
  if(btn) btn.setAttribute('aria-expanded','true'); MENU=m;
  const first=m.querySelector('button:not([disabled]),input:not([disabled])'); if(first) first.focus();
}

// pijl naast Plak (aanraking, toetsenbord) en rechtsklik op Plak of de pijl
function clipMoreBtn(id,pasteBtn){
  const b=document.createElement('button'); b.type='button'; b.className='clipbtn clipmore'; b.textContent='▾'; b.setAttribute('aria-haspopup','dialog'); b.setAttribute('aria-expanded','false'); b.setAttribute('aria-label',PK.pkt('m.clip_o_titel'));
  b.onclick=e=>{ e.stopPropagation(); PK.select(id); menuOpen(id,b,b); };
  [b,pasteBtn].forEach(x=>x.addEventListener('contextmenu',e=>{ e.preventDefault(); e.stopPropagation(); PK.select(id); menuOpen(id,b,b); }));
  return b;
} PK.clipMoreBtn=clipMoreBtn;

function clipMenuInit(){ const e=PK.$('clipBarCb'); if(e) e.onchange=()=>clipBarSet(e.checked); clipBarPaint(); } PK.clipMenuInit=clipMenuInit;
})(window.__PK);
