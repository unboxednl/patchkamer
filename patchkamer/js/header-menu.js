// js/header-menu.js — hoofdbalkmenu achter de menuknop ☰ (alle schermbreedten): openen en sluiten
(function(PK){
function hmOpen(){
  if(PK.HM.open) return; PK.HM.open=true;
  const f=parseFloat(getComputedStyle(document.body).getPropertyValue('--pkfs'))||1, b=document.querySelector('header').getBoundingClientRect().bottom;
  PK.HM.menu.style.top=Math.max(0,b)/f+'px'; PK.HM.menu.style.maxHeight='calc((100dvh - '+Math.max(0,b)+'px - 8px)/'+f+')';
  PK.HM.menu.hidden=false; PK.HM.btn.setAttribute('aria-expanded','true');
  try{ history.pushState({pkmenu:1},''); PK.HM.pushed=true; }catch(e){}
} PK.hmOpen=hmOpen;
function hmClose(quiet){
  if(!PK.HM.open) return; PK.HM.open=false; PK.HM.menu.hidden=true; PK.HM.btn.setAttribute('aria-expanded','false');
  if(PK.HM.pushed){ PK.HM.pushed=false; if(!quiet&&history.state&&history.state.pkmenu){ try{ history.back(); }catch(e){} } }
} PK.hmClose=hmClose;
})(window.__PK);
