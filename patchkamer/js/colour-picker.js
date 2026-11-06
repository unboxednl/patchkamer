// js/colour-picker.js — kleurkiezer: kleurvlak (verzadiging/helderheid), tintbalk, hex-invoer, voorbeeldkleuren en recent gebruikt, contrastmelding
(function(PK){
/* =====================================================================
   COLOUR PICKER · herbruikbaar (de mini-ontwerper gebruikt hem; de editor van laag 3 later ook). Geen <input type=color>.
   PK.colourPicker({value:'#rrggbb', label:'…', against:()=>'#rrggbb'|null, min:3, onChange(hex), onCommit(hex)}) -> {el, get(), set(hex,silent), destroy()}
   - kleurvlak = role=slider (pijltjes: verzadiging ←→, helderheid ↑↓; Shift = grote stap); tintbalk = role=slider (←→, Shift = grote stap)
   - onChange tijdens slepen (live voorbeeld), onCommit bij loslaten, Enter in het hexveld of een keuze uit de voorbeeldkleuren (hier komt "recent gebruikt" vandaan)
   - hulpfuncties: PK.cpRgb(hex), PK.cpHex([r,g,b]), PK.cpLum(hex), PK.cpContrast(a,b), PK.cpParse(tekst)
   ===================================================================== */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function cpParse(t){ t=String(t==null?'':t).trim(); const m=/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(t); if(!m) return null; let h=m[1].toLowerCase(); if(h.length===3) h=h.split('').map(c=>c+c).join(''); return '#'+h; } PK.cpParse=cpParse;
const cpRgb=hex=>{ const h=cpParse(hex)||'#000000'; return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }; PK.cpRgb=cpRgb;
const cpHex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join(''); PK.cpHex=cpHex;
function cpLum(hex){ const f=x=>{ x/=255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4); }, c=cpRgb(hex); return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); } PK.cpLum=cpLum;
function cpContrast(a,b){ const x=cpLum(a), y=cpLum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); } PK.cpContrast=cpContrast;
function rgb2hsv(c){ const r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; let h=0; if(d){ h=mx===r?((g-b)/d+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; } return [h,mx?d/mx:0,mx]; }
function hsv2rgb(h,s,v){ const f=n=>{ const k=(n+h/60)%6; return v-v*s*Math.max(0,Math.min(k,4-k,1)); }; return [f(5)*255,f(3)*255,f(1)*255]; }
const PRESETS=['#0c0e11','#171b22','#2a3039','#7d8794','#dce1e8','#ffffff','#4fd1c5','#f4a261','#9b8cff','#e4574a','#6bd98a','#f2cf3b','#e9ecf0','#d9d5ca','#45433e','#2d5f8c'];
const RECKEY='patchkamer.recentColours';
function recentGet(){ try{ const a=JSON.parse(localStorage.getItem(RECKEY)||'[]'); return Array.isArray(a)?a.map(cpParse).filter(Boolean).slice(0,8):[]; }catch(e){ return []; } }
function recentAdd(hex){ try{ const a=[hex,...recentGet().filter(x=>x!==hex)].slice(0,8); localStorage.setItem(RECKEY,JSON.stringify(a)); }catch(e){} }
let cpSeq=0;
function colourPicker(o){ o=o||{}; const id='cp'+(++cpSeq), pkt=PK.pkt;
  let hex=cpParse(o.value)||'#808080', [H,S,V]=rgb2hsv(cpRgb(hex)), dead=false;
  const root=document.createElement('div'); root.className='cp'; root.setAttribute('role','group'); root.setAttribute('aria-label',o.label||pkt('m.cp_kleur'));
  root.innerHTML=`<div class="cp-sv" tabindex="0" role="slider" aria-label="${PK.esc(pkt('m.cp_vlak'))}"><span class="cp-svt"></span></div>
    <div class="cp-hue" tabindex="0" role="slider" aria-label="${PK.esc(pkt('m.cp_tint'))}" aria-valuemin="0" aria-valuemax="360"><span class="cp-hut"></span></div>
    <div class="cp-row"><span class="cp-prev" aria-hidden="true"></span><label class="cp-hexl"><span>${PK.esc(pkt('m.cp_hex'))}</span><input class="cp-hex" type="text" inputmode="text" maxlength="7" spellcheck="false" autocomplete="off"></label><button type="button" class="small cp-eye" hidden></button></div>
    <div class="cp-msg" role="status" aria-live="polite"></div>
    <div class="cp-sw" role="group" aria-label="${PK.esc(pkt('m.cp_voorbeeld'))}"></div>
    <div class="cp-rl"><span class="cp-rt">${PK.esc(pkt('m.cp_recent'))}</span><div class="cp-sw cp-rec" role="group" aria-label="${PK.esc(pkt('m.cp_recent'))}"></div></div>`;
  const sv=root.querySelector('.cp-sv'), svt=root.querySelector('.cp-svt'), hu=root.querySelector('.cp-hue'), hut=root.querySelector('.cp-hut'), inp=root.querySelector('.cp-hex'), prev=root.querySelector('.cp-prev'), msg=root.querySelector('.cp-msg'), eye=root.querySelector('.cp-eye'), swBox=root.querySelector('.cp-sw'), recBox=root.querySelector('.cp-rec'), recRow=root.querySelector('.cp-rl');
  const swBtn=(c)=>{ const b=document.createElement('button'); b.type='button'; b.className='cp-s'; b.style.background=c; b.title=c; b.setAttribute('aria-label',c); b.onclick=()=>{ set(c,true); commit(); }; return b; };
  PRESETS.forEach(c=>swBox.appendChild(swBtn(c)));
  const paintRecent=()=>{ recBox.innerHTML=''; const a=recentGet(); recRow.hidden=!a.length; a.forEach(c=>recBox.appendChild(swBtn(c))); };
  function paint(skipInput){ hex=cpHex(hsv2rgb(H,S,V));
    sv.style.background=`linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${H.toFixed(1)} 100% 50%))`; svt.style.left=(S*100)+'%'; svt.style.top=((1-V)*100)+'%';
    hut.style.left=(H/360*100)+'%'; prev.style.background=hex; if(!skipInput) inp.value=hex; inp.removeAttribute('aria-invalid');
    sv.setAttribute('aria-valuenow',String(Math.round(S*100))); sv.setAttribute('aria-valuetext',pkt('m.cp_vlak_tekst',Math.round(S*100),Math.round(V*100))); hu.setAttribute('aria-valuenow',String(Math.round(H))); hu.setAttribute('aria-valuetext',Math.round(H)+'°');
    const ag=typeof o.against==='function'?o.against():o.against, min=o.min||3;
    if(ag&&cpParse(ag)){ const q=cpContrast(hex,cpParse(ag)); msg.className='cp-msg'+(q<min?' bad':''); msg.textContent=q<min?pkt('m.cp_contrast_laag',q.toFixed(1),min):pkt('m.cp_contrast_ok',q.toFixed(1)); } else { msg.className='cp-msg'; msg.textContent=''; } }
  const emit=()=>{ if(o.onChange) o.onChange(hex); }, commit=()=>{ recentAdd(hex); paintRecent(); if(o.onCommit) o.onCommit(hex); };
  function set(h,fire){ const p=cpParse(h); if(!p) return; [H,S,V]=rgb2hsv(cpRgb(p)); paint(); if(fire) emit(); }
  // kleurvlak en tintbalk: aanwijzer (muis, aanraking, pen)
  function drag(el,fn){ let on=false; const mv=e=>{ const b=el.getBoundingClientRect(); fn(clamp((e.clientX-b.left)/b.width,0,1),clamp((e.clientY-b.top)/b.height,0,1)); paint(); emit(); };
    el.addEventListener('pointerdown',e=>{ if(e.button!==0) return; e.preventDefault(); on=true; try{ el.setPointerCapture(e.pointerId); }catch(_){} el.focus({preventScroll:true}); mv(e); });
    el.addEventListener('pointermove',e=>{ if(on) mv(e); }); const end=()=>{ if(on){ on=false; commit(); } }; el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end); }
  drag(sv,(x,y)=>{ S=x; V=1-y; }); drag(hu,(x)=>{ H=x*360; if(H>=360) H=359.99; });
  sv.addEventListener('keydown',e=>{ const st=e.shiftKey?0.1:0.01, d={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,st],ArrowDown:[0,-st]}[e.key]; if(!d) return; e.preventDefault(); S=clamp(S+d[0],0,1); V=clamp(V+d[1],0,1); paint(); emit(); });
  sv.addEventListener('keyup',e=>{ if(/^Arrow/.test(e.key)) commit(); });
  hu.addEventListener('keydown',e=>{ const st=e.shiftKey?10:1, d={ArrowLeft:-st,ArrowDown:-st,ArrowRight:st,ArrowUp:st,PageUp:30,PageDown:-30,Home:-360,End:360}[e.key]; if(d==null) return; e.preventDefault(); H=e.key==='Home'?0:e.key==='End'?359.99:(H+d+360)%360; paint(); emit(); });
  hu.addEventListener('keyup',e=>{ if(/^(Arrow|Page|Home|End)/.test(e.key)) commit(); });
  // hexveld: tijdens typen alleen een geldige waarde overnemen, bij Enter of verlaten vastleggen
  inp.addEventListener('input',()=>{ const p=cpParse(inp.value); if(p){ inp.removeAttribute('aria-invalid'); [H,S,V]=rgb2hsv(cpRgb(p)); paint(true); emit(); } else inp.setAttribute('aria-invalid','true'); });
  const fin=()=>{ const p=cpParse(inp.value); if(p){ set(p,false); commit(); } else { inp.value=hex; inp.removeAttribute('aria-invalid'); } };
  inp.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); fin(); } }); inp.addEventListener('blur',()=>{ if(inp.value!==hex) fin(); });
  // pipet waar de browser die heeft
  if(window.EyeDropper){ eye.hidden=false; eye.textContent=pkt('m.cp_pipet'); eye.title=pkt('m.cp_pipet_titel'); eye.onclick=async()=>{ try{ const r=await new window.EyeDropper().open(); set(r.sRGBHex,true); commit(); }catch(e){} }; }
  paintRecent(); paint();
  return {el:root,get:()=>hex,set,destroy(){ dead=true; root.remove(); }}; } PK.colourPicker=colourPicker;
})(window.__PK);
