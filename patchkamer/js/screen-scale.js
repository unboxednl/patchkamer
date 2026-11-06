// js/screen-scale.js — schaal per scherm toepassen
(function(PK){
// ---------- schaal per scherm: toepassen (v1.8) ----------
function applyScale(){ const old=PK.PKS.f, f=PK.pksTarget(); PK.PKS.f=f; PK.PKS.ui=Math.max(0.7,f); document.documentElement.style.setProperty('--pkui',String(PK.PKS.ui));
  if(Math.abs(old-f)>1e-6&&typeof PK.applyView==='function'){ const fw=document.getElementById('floorwrap'), r=fw?fw.getBoundingClientRect():{width:0,height:0}, cx=r.width/2, cy=r.height/2, k=f/old, v=PK.Host.view; v.x=cx-(cx-v.x)*k; v.y=cy-(cy-v.y)*k; v.scale*=k; PK.applyView(); }
  if(typeof PK.placeLib==='function') try{ PK.placeLib(); }catch(e){} PK.drawCables(); paintScaleUI(); } PK.applyScale=applyScale;
function setScale(val){ if(val==='auto') PK.PKS.mode='auto'; else { PK.PKS.mode='manual'; PK.PKS.pct=+val||100; } try{ localStorage.setItem('patchkamer.scaleMode',PK.PKS.mode); localStorage.setItem('patchkamer.scalePct',String(PK.PKS.pct)); }catch(e){} applyScale(); } PK.setScale=setScale;
function paintScaleUI(){ const sel=document.getElementById('scaleSel'); if(!sel) return; const a=Math.round(PK.pksAuto()*100);
  sel.innerHTML=PK.pkt('m.automatisch',a)+[50,60,70,80,90,100,110,125,150].map(p=>`<option value="${p}">${p}%</option>`).join(''); sel.value=PK.PKS.mode==='auto'?'auto':String(PK.PKS.pct);
  if(sel.value!==(PK.PKS.mode==='auto'?'auto':String(PK.PKS.pct))){ const o=document.createElement('option'); o.value=String(PK.PKS.pct); o.textContent=PK.PKS.pct+'%'; sel.appendChild(o); sel.value=o.value; }
  const n=document.getElementById('scaleNote'); if(n) n.textContent=PK.pkt('m.dit_venster_px_onthouden_per',window.innerWidth,window.innerHeight); } PK.paintScaleUI=paintScaleUI;
})(window.__PK);
