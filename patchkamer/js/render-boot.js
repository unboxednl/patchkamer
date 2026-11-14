// js/render-boot.js — draait vóór al het andere, en doet alleen iets in de verborgen kopie van de host die "Snel opnemen" gebruikt (js/render.js)
// De kopie heet 'pk-render:{json}' (window.name). Hier krijgt hij een OfflineAudioContext in plaats van een echte, en kan hij niets bewaren
// (localStorage, sessionStorage en IndexedDB zijn alleen-lezen), zodat de opgeslagen werkruimten en instellingen van de gebruiker onaangeroerd blijven.
(function(){
  var m=/^pk-render:(.*)$/.exec(window.name||''); if(!m) return;
  var cfg; try{ cfg=JSON.parse(m[1]); }catch(e){ return; }
  if(!cfg||!(cfg.dur>0)||!(cfg.sr>0)) return;
  window.__PK_RENDER=cfg;
  class OfflineHostContext extends OfflineAudioContext{
    constructor(){ super(2,Math.round(cfg.sr*cfg.dur),cfg.sr); window.__PK_RCTX=this; }
    resume(){ return Promise.resolve(); }   // de klok van de host wacht op resume(); de render zelf loopt via suspend() in js/render.js
  }
  window.AudioContext=OfflineHostContext; window.webkitAudioContext=OfflineHostContext;
  var noop=function(){};
  try{ Storage.prototype.setItem=noop; Storage.prototype.removeItem=noop; Storage.prototype.clear=noop; }catch(e){}
  try{ ['put','add','delete','clear'].forEach(function(k){ IDBObjectStore.prototype[k]=function(){ return {}; }; }); }catch(e){}
  // vaste reeks voor Math.random: een tweede keer opnemen geeft dezelfde opname (live blijft willekeurig)
  var seed=(cfg.seed>>>0)||1; Math.random=function(){ seed=(seed+0x6D2B79F5)>>>0; var t=seed; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
  window.__PK_RENDER_ERRS=[]; window.addEventListener('error',function(e){ window.__PK_RENDER_ERRS.push(String(e.message)); });
})();
