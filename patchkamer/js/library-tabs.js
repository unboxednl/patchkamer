// js/library-tabs.js — bibliotheekvenster met tabs: Apparaten, Tunes, Presets, Songs, Skins
(function(PK){
/* =====================================================================
   BIBLIOTHEEK · tabs. Het venster #libwin toont één soort tegelijk: Apparaten (#libPaneDev), Tunes en Presets (delen #prPanel),
   Songs (#songPanel) en Skins (#skPanel). Op een brede, voldoende grote venster zijn het tabs, op een smal scherm (lade) of als de
   tabs niet passen een keuzelijst (#libSel). De laatst gekozen tab staat in localStorage 'patchkamer.libTab'.
   Elke ingang (menuknoppen Tunes/Presets/Songs/Skins, de knop Bladeren op een kaart, bestanden loslaten) opent het venster via libOpen(tab).
   ===================================================================== */
const TABS=['devices','tunes','presets','samples','songs','skins'], KEY='patchkamer.libTab';
const PANE={devices:'libPaneDev',tunes:'prPanel',presets:'prPanel',samples:'samPanel',songs:'songPanel',skins:'skPanel'};
const MENU={tunes:'prBtn',presets:'psBtn',songs:'songBtn',skins:'skBtn'};
let tab='devices', lastKey='';
try{ const v=localStorage.getItem(KEY); if(TABS.includes(v)) tab=v; }catch(e){}
PK.libTab=()=>tab; PK.LIBTABS=TABS;
// tekent de inhoud van de actieve tab (aangeroepen als de tab of het venster verandert)
function activate(){
  if(tab==='devices') PK.paintLib();
  else if(tab==='tunes') PK.prShowMode('tune'); else if(tab==='presets') PK.prShowMode('preset');
  else if(tab==='samples') PK.samShow(); else if(tab==='songs') PK.songShow(); else if(tab==='skins') PK.skPaintPanel();
}
// tabs of keuzelijst: een smal scherm altijd een keuzelijst; anders alleen als de tabs niet passen
function libFit(){ const bar=PK.$('libTabs'), tl=PK.$('libTabList'); if(!bar||!tl) return;
  if(PK.isSheet()){ bar.classList.add('dd'); return; }
  bar.classList.remove('dd'); if(tl.scrollWidth>tl.clientWidth+1) bar.classList.add('dd'); } PK.libFit=libFit;
// zet de weergave gelijk aan de toestand: venster, actieve tab, panen, menuknoppen
function libSync(){ const w=PK.libwin; if(!w) return; const shown=!!PK.LIB.shown;
  w.dataset.tab=tab;
  TABS.forEach(t=>{ const b=PK.$('libTab_'+t); if(b){ const on=t===tab; b.setAttribute('aria-selected',String(on)); b.tabIndex=on?0:-1; b.classList.toggle('on',on); } });
  const sel=PK.$('libSel'); if(sel&&sel.value!==tab) sel.value=tab;
  const pane=PANE[tab]; new Set(Object.values(PANE)).forEach(id=>{ const el=PK.$(id); if(el) el.hidden=id!==pane; });
  const pr=PK.$('prPanel'); if(pr) pr.setAttribute('aria-labelledby','libTab_'+(tab==='presets'?'presets':'tunes'));
  Object.keys(MENU).forEach(t=>{ const b=PK.$(MENU[t]); if(!b) return; const on=shown&&t===tab; b.classList.toggle('on',on); b.setAttribute('aria-expanded',String(on)); });
  if(!shown&&PK.skDesigning&&PK.skDesigning()) PK.skDesignClose();
  const key=shown?tab:''; if(key&&key!==lastKey&&PK.LIBREADY){ lastKey=key; libFit(); activate(); } else if(!key) lastKey='';
} PK.libSync=libSync;
// open het venster op een tab (ook als het al open staat: de inhoud wordt opnieuw getekend, bijvoorbeeld met een ander apparaatfilter)
function libOpen(t){ if(!TABS.includes(t)) t='devices'; tab=t; try{ localStorage.setItem(KEY,t); }catch(e){}
  PK.LIB.shown=true; PK.LIB.min=false; lastKey=''; PK.placeLib(); PK.saveLib(); } PK.libOpen=libOpen;
function libClose(){ PK.LIB.shown=false; PK.placeLib(); PK.saveLib(); } PK.libClose=libClose;
// bedrading (aangeroepen uit boot.js na het aanmaken van het venster)
PK.libTabsInit=function(){
  PK.$('libTabList').addEventListener('click',e=>{ const b=e.target.closest('[data-tab]'); if(b) libOpen(b.dataset.tab); });
  PK.$('libTabList').addEventListener('keydown',e=>{ const i=TABS.indexOf(tab); let n=-1;
    if(e.key==='ArrowRight') n=(i+1)%TABS.length; else if(e.key==='ArrowLeft') n=(i+TABS.length-1)%TABS.length; else if(e.key==='Home') n=0; else if(e.key==='End') n=TABS.length-1;
    if(n<0) return; e.preventDefault(); libOpen(TABS[n]); const b=PK.$('libTab_'+TABS[n]); if(b) b.focus(); });
  PK.$('libSel').addEventListener('change',()=>libOpen(PK.$('libSel').value));
  if(typeof ResizeObserver==='function') new ResizeObserver(()=>libFit()).observe(PK.libwin);
  PK.PKT.narrow.addEventListener('change',libFit);
};   // boot.js zet PK.LIBREADY aan als alle panelen bestaan en roept dan libSync aan
})(window.__PK);
