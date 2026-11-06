// js/settings.js — instellingenpaneel en browsergeheugen wissen
(function(PK){
function closeSettings(){ if(!PK.setPanel) return; PK.setPanel.hidden=true; PK.$('setBtn').setAttribute('aria-expanded','false'); PK.$('setBtn').classList.remove('on'); } PK.closeSettings=closeSettings;
function openSettings(){ if(!PK.setPanel) return; if(!PK.wsPanel.hidden) PK.closeWs(); PK.prClosePanel(); PK.setPanel.hidden=false; PK.$('setBtn').setAttribute('aria-expanded','true'); PK.$('setBtn').classList.add('on'); try{ if(typeof PK.paintScaleUI==='function') PK.paintScaleUI(); }catch(e){} } PK.openSettings=openSettings;
PK.PK_WIPING=false;
})(window.__PK);
