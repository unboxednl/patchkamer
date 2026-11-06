// js/library-categories.js — plaatsen van een nieuw apparaat, categorieen en categorie-iconen, bronnen van indeling
(function(PK){
/* =====================================================================
   LIBRARY
   ===================================================================== */
// place a new device to the right of everything on the floor (no overlap, whatever the card width), then bring it into view
function placeNew(id,version){
  const va=PK.viewArea(), nid=PK.addDevice(id,Math.round(va.cx),Math.round(va.cy),null,null,version); if(!nid) return;
  const r=PK.Host.devices.get(nid), w=r.el.offsetWidth, h=r.el.offsetHeight, m=30/PK.Host.view.scale;
  // centred in what you see; a device larger than the view starts at its top-left corner
  PK.pkMoveTo(r, w>va.x1-va.x0-2*m?va.x0+m:va.cx-w/2, h>va.y1-va.y0-2*m?va.y0+m:va.cy-h/2);
  PK.afterAdd(nid); PK.autoLinkOffer(nid);
} PK.placeNew=placeNew;
const CAT_PALETTE=['#5f8dff','#ff8fd1','#8bdb6a','#c9b080','#2ec27e','#e76f51','#7fd6ff','#d98cff','#f4a261','#e4574a','#f4d35e','#a0a8b4']; PK.CAT_PALETTE=CAT_PALETTE;
const catColor=k=>PK.CATCOL[k]||'var(--muted)'; PK.catColor=catColor;
const ICONMAX=200*1024; PK.ICONMAX=ICONMAX;
const ICON_ORDER=['synth','groove','sequencer','mod','effect','mastering','mix','tool','other','sampler','mic','speaker','note','bolt','star','folder']; PK.ICON_ORDER=ICON_ORDER;
const isBuiltinIcon=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(PK.CAT_ICONS,id); PK.isBuiltinIcon=isBuiltinIcon;
const ICON_DATA_RE=/^data:image\/(png|svg\+xml|webp|jpeg|gif);base64,[A-Za-z0-9+\/=]+$/;
// een bewaard icoon: een ingebouwd id, een data-adres of een adres (waar het vandaan mag komen controleren we pas bij het tonen)
function cleanIcon(v){ if(typeof v!=='string') return undefined; v=v.trim(); if(isBuiltinIcon(v)) return v; if(v.length>280000) return undefined; if(ICON_DATA_RE.test(v)) return v;
  if(v.length<=500&&(/^https?:\/\/[^\s"'<>]+$/i.test(v)||/^[\w.\/-][^\s"'<>:]*$/.test(v))) return v; return undefined; } PK.cleanIcon=cleanIcon;
// een afbeelding mag alleen van dezelfde bron als de bibliotheek komen: dezelfde herkomst als deze pagina, of de raw-adressen/herkomst van een bron die je toevoegde
function iconUrlAllowed(u){ if(typeof u!=='string') return false; if(ICON_DATA_RE.test(u)) return true;
  let x; try{ x=new URL(u,location.href); }catch(e){ return false; } if(!/^https?:$/.test(x.protocol)) return false;
  if(PK.sameOrigin(x.href)) return true;
  return PK.SOURCES.some(src=>{ if(src.kind==='github') return x.hostname==='raw.githubusercontent.com'&&x.pathname.startsWith('/'+src.owner+'/'+src.repo+'/');
    if(src.kind==='url'){ try{ return new URL(src.url).origin===x.origin; }catch(e){ return false; } } return false; }); } PK.iconUrlAllowed=iconUrlAllowed;
function dirIconFor(key){ for(const id of (PK.CATDIR[key]||[])){ const u=PK.DIRICON.get(id); if(u) return u; } return null; }
// welk icoon een categorie heeft: eigen keuze (Indeling; ook uit het indelingsbestand) > icon.* in de map > ingebouwd icoon > neutraal
function catIconSrc(key){ const o=PK.CATICON[key]; if(o){ if(isBuiltinIcon(o)) return o; if(!PK.BADICON.has(o)&&iconUrlAllowed(o)) return o; }
  const d=dirIconFor(key); if(d&&!PK.BADICON.has(d)) return d; return isBuiltinIcon(key)?key:'folder'; }
const svgOfIcon=id=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+PK.CAT_ICONS[id]+'</svg>'; PK.svgOfIcon=svgOfIcon;
function catIconParts(key){ const src=catIconSrc(key); return isBuiltinIcon(src)?{img:false,html:svgOfIcon(src)}:{img:true,html:'<img src="'+esc(src)+'" alt="" decoding="async" draggable="false">'}; } PK.catIconParts=catIconParts;
function catIconHTML(key,cls){ const m=catIconParts(key); return '<span class="cicon'+(m.img?' img':'')+(cls?' '+cls:'')+'" data-ik="'+esc(key)+'" aria-hidden="true">'+m.html+'</span>'; } PK.catIconHTML=catIconHTML;
const CAT_HINTS={'nl.patchkamer.drums':'groove','nl.patchkamer.seq':'sequencer','nl.patchkamer.mono':'synth','nl.patchkamer.ruimte':'effect','nl.patchkamer.roest':'effect','nl.patchkamer.mixer':'mix','nl.patchkamer.speakers':'mix','nl.patchkamer.scope':'tool','nl.patchkamer.drone':'synth','nl.patchkamer.acid303':'synth','nl.patchkamer.takt12':'groove','nl.patchkamer.drift':'groove','nl.voorbeeld.tremolo':'effect','nl.voorbeeld.klik':'tool','nl.patchkamer.driftmod':'mod'};
// mappen als categorieën: zonder indelingsbestand is de eerste map van een apparaat in zijn bron zijn categorie; met een bestand komen de mappen die het niet kent erbij
const SRCLAYOUT=new Map(), SRCDEPTH=new Map(); PK.SRCLAYOUT=SRCLAYOUT; PK.SRCDEPTH=SRCDEPTH;   // sid -> {has, folders} ; sid -> aantal gedeelde bovenste mappen dat wegvalt
const dirSlug=t=>String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function pathSegs(def){ const p=def&&def._src&&def._src.path; return p?String(p).split('/').filter(Boolean):[]; } PK.pathSegs=pathSegs;
function dirOf(def){ const sg=pathSegs(def), d=SRCDEPTH.get(def._src&&def._src.sid)||0; return sg.length>d+1?sg[d]:''; } PK.dirOf=dirOf;
function dirCatKey(def){ const f=dirOf(def), slug=f&&dirSlug(f); if(!slug) return null; const L=SRCLAYOUT.get(def._src.sid);
  if(L&&L.has){ const sl=x=>dirSlug(x).replace(/s$/,''), m=PK.CATS.find(c=>!c[0].startsWith('dir-')&&(sl(c[0])===sl(f)||sl(c[1])===sl(f))); if(m) return m[0];
    if(L.folders?L.folders.some(x=>dirSlug(x)===slug):(def.category||CAT_HINTS[def.id])) return null; }
  return 'dir-'+slug; } PK.dirCatKey=dirCatKey;
function latestDefs(){ return [...new Set([...PK.Host.registry.values()].map(d=>d.id))].map(id=>PK.Host.versionsOf(id)[0]).filter(Boolean); } PK.latestDefs=latestDefs;
function syncDirCats(){ const defs=latestDefs(), per=new Map();
  defs.forEach(d=>{ const sid=d._src&&d._src.sid; if(!sid) return; const sg=pathSegs(d), o=per.get(sid)||{tops:new Set(),deep:true}; if(sg.length<2) o.deep=false; else o.tops.add(sg[0]); per.set(sid,o); });
  SRCDEPTH.clear(); per.forEach((o,sid)=>{ if(o.tops.size===1&&o.deep) SRCDEPTH.set(sid,1); });
  PK.CATS=PK.CATS.filter(c=>!c[0].startsWith('dir-')); const found=new Map(); defs.forEach(d=>{ const k=dirCatKey(d); if(k&&k.startsWith('dir-')&&!found.has(k)) found.set(k,dirOf(d)); });
  const i=PK.CATS.findIndex(c=>c[0]==='other'), add=[...found].sort((a,b)=>a[1].localeCompare(b[1],'nl')).map(([k,f],n)=>{ PK.CATCOL[k]=CAT_PALETTE[n%CAT_PALETTE.length]; return [k,f.charAt(0).toUpperCase()+f.slice(1)]; });
  PK.CATS.splice(i<0?PK.CATS.length:i,0,...add);
  PK.CATDIR={}; defs.forEach(d=>{ const k=dirCatKey(d), f=dirOf(d); if(k&&f&&d._src){ const id=d._src.sid+'|'+f, L=PK.CATDIR[k]||(PK.CATDIR[k]=[]); if(!L.includes(id)) L.push(id); } }); } PK.syncDirCats=syncDirCats;
function categoryOf(def){ const o=PK.CAT_OVR&&PK.CAT_OVR[def.id]; if(o&&PK.CATS.some(x=>x[0]===o)) return o; const dk=dirCatKey(def); if(dk&&PK.CATS.some(x=>x[0]===dk)) return dk; const b=baseCategory(def); return PK.CATS.some(x=>x[0]===b)?b:'other'; } PK.categoryOf=categoryOf;
function baseCategory(def){ const c=def.category||CAT_HINTS[def.id]; if(c&&PK.BUILTIN_CATS.has(c)) return c; return {instrument:'synth',effect:'effect',mixer:'mix',output:'mix',utility:'tool',modulator:'mod'}[def.kind]||'other'; } PK.baseCategory=baseCategory;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); PK.esc=esc;
function portsLine(def){ const P=def.ports, nm=a=>esc(a.map(x=>x.name||x.id).join(', ')), parts=[];
  if(P.audioIn.length) parts.push(PK.pkt('m.audio_in',P.audioIn.length>3?P.audioIn.length+'×':nm(P.audioIn)));
  if(P.eventIn.length) parts.push(PK.pkt('m.events_in',nm(P.eventIn)));
  if(P.audioOut.length) parts.push(PK.pkt('m.audio_uit',P.audioOut.length>3?P.audioOut.length+'×':nm(P.audioOut)));
  if(P.eventOut.length) parts.push(PK.pkt('m.events_uit',nm(P.eventOut)));
  if((P.modIn||[]).length) parts.push(PK.pkt('m.sturing_in',nm(P.modIn)));
  if((P.modOut||[]).length) parts.push(PK.pkt('m.sturing_uit',nm(P.modOut)));
  if((P.multiEventIn||[]).length) parts.push(PK.pkt('m.multievent_in',nm(P.multiEventIn)));
  if((P.multiEventOut||[]).length) parts.push(PK.pkt('m.multievent_uit',nm(P.multiEventOut)));
  if((P.masteringIn||[]).length) parts.push(PK.pkt('m.mastering_in',nm(P.masteringIn)));
  if((P.masteringOut||[]).length) parts.push(PK.pkt('m.mastering_uit',nm(P.masteringOut)));
  if((P.multiIn||[]).length) parts.push(PK.pkt('m.bundel_in',nm(P.multiIn)));
  if((P.multiOut||[]).length) parts.push(PK.pkt('m.bundel_uit',nm(P.multiOut)));
  return parts.join(' · ')||PK.pkt('m.geen_poorten'); } PK.portsLine=portsLine;
})(window.__PK);
