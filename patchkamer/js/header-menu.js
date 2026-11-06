// js/header-menu.js — hoofdbalkmenu achter de menuknop op een smal scherm
(function(PK){
function hmPlace(narrow){
  const rows={files:PK.$('hmFiles'),sound:PK.$('hmSound'),view:PK.$('hmView'),misc:PK.$('hmMisc')};
  if(narrow){
    rows.files.append(PK.$('wsBtn'),PK.$('songBtn')); rows.sound.append(PK.$('prBtn'),PK.$('psBtn'),PK.$('skBtn'));
    rows.view.append(PK.$('arrange'),PK.$('layoutSel').closest('.tp'),PK.$('fitScreen'),PK.$('focusBtn'),PK.$('browseBtn'),PK.$('skin').closest('.tp'));
    rows.misc.append(PK.$('clear'),PK.$('latBox'),PK.$('setBtn')); PK.$('hmName').append(PK.$('wsName'));
  } else { hmClose(true); PK.HM.tr.append(...PK.HM.orig); document.querySelector('header .note').before(PK.$('wsName')); }
} PK.hmPlace=hmPlace;
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
