// i18n/engine.js — taalkeuze (PK_LANG), pkt/pktp en het toepassen van data-i18n op de pagina; laadt na nl.js en en.js
(function(PK){
const PK_LANGS=['nl','en'];
PK.PK_LANGPREF='auto'; try{ PK.PK_LANGPREF=localStorage.getItem('patchkamer.lang')||'auto'; }catch(e){}
if(PK.PK_LANGPREF!=='auto'&&!PK_LANGS.includes(PK.PK_LANGPREF)) PK.PK_LANGPREF='auto';
const PK_LANG=PK.PK_LANGPREF!=='auto'?PK.PK_LANGPREF:(()=>{ for(const l of (navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''])){ const b=String(l).toLowerCase().split('-')[0]; if(PK_LANGS.includes(b)) return b; } return 'en'; })(); PK.PK_LANG=PK_LANG;
PK.PK_RELOAD_ALWAYS=false;
function pkt(key,...args){ const d=PK.I18N[PK_LANG]; let s=d&&d[key]; if(s==null) s=PK.I18N.nl[key]; if(s==null) return '\u27e6'+key+'\u27e7'; return args.length?s.replace(/\{(\d+)\}/g,(m,i)=>String(args[+i])):s; } PK.pkt=pkt;
function pktp(key,cond,...args){ return pkt(key+(cond?'.t':'.f'),...args); } PK.pktp=pktp;
(function(){ document.documentElement.lang=PK_LANG; if(PK_LANG==='nl') return; const d=PK.I18N[PK_LANG]; if(!d) return;
  const each=(sel,fn)=>document.querySelectorAll(sel).forEach(fn);
  each('[data-i18n]',e=>{ const v=d[e.getAttribute('data-i18n')]; if(v!=null) e.textContent=v; });
  each('[data-i18n-html]',e=>{ const v=d[e.getAttribute('data-i18n-html')]; if(v!=null) e.innerHTML=v; });
  each('[data-i18n-title]',e=>{ const v=d[e.getAttribute('data-i18n-title')]; if(v!=null) e.title=v; });
  each('[data-i18n-ph]',e=>{ const v=d[e.getAttribute('data-i18n-ph')]; if(v!=null) e.placeholder=v; });
  each('[data-i18n-aria]',e=>{ const v=d[e.getAttribute('data-i18n-aria')]; if(v!=null) e.setAttribute('aria-label',v); }); })();
})(window.__PK);
