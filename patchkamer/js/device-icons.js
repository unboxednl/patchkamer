// js/device-icons.js — apparaaticoon: skin-icoon, icon.* in de apparaatmap, icon.* in skins/library/<id>/; zonder eigen icoon het categorie-icoon
(function(PK){
/* =====================================================================
   APPARAATICOON · volgorde van winst: (1) icon van de actieve skin op die kaart, (2) icoon dat de gebruiker voor dit apparaat koos (bestaat nog niet),
   (3) icon.* in de apparaatmap van de bibliotheek, (4) icon.* in skins/library/<apparaat-id>/, (5) het icoon van de categorie, (6) neutraal.
   Een eigen icoon staat altijd als <img> (data-adres) in hetzelfde vakje als het categorie-icoon; zonder eigen icoon is de uitvoer gelijk aan catIconParts.
   ===================================================================== */
// de map van het apparaatbestand (relatief aan de bron), alleen als die dieper ligt dan de categoriemap: <bron>/<categorie>/<Naam>/<naam>.patchkamer-device.js
function devDirOf(def){ const o=def&&def._src; if(!o||!o.sid||!o.path) return ''; const sg=PK.pathSegs(def), d=PK.SRCDEPTH.get(o.sid)||0; return sg.length>=d+3?sg.slice(0,-1).join('/'):''; } PK.devDirOf=devDirOf;
const iconOk=u=>!!u&&!PK.BADICON.has(u);
function devIconUrl(def,rec){
  const sk=rec&&PK.skinActive?PK.skinActive(rec):null; if(sk&&iconOk(sk.icon)) return sk.icon;
  const d=devDirOf(def); if(d){ const u=PK.DEVICON.get(def._src.sid+'|'+d); if(iconOk(u)) return u; }
  for(const [k,u] of PK.SKICON) if(k.slice(k.indexOf('|')+1)===def.id&&iconOk(u)) return u;
  return null; } PK.devIconUrl=devIconUrl;
function devIconParts(def,rec){ const u=devIconUrl(def,rec); return u?{img:true,html:'<img src="'+PK.esc(u)+'" alt="" decoding="async" draggable="false">'}:PK.catIconParts(PK.categoryOf(def)); } PK.devIconParts=devIconParts;
function devIconHTML(def,rec,cls){ const m=devIconParts(def,rec); return '<span class="cicon'+(m.img?' img':'')+(cls?' '+cls:'')+'" data-ik="'+PK.esc(PK.categoryOf(def))+'" aria-hidden="true">'+m.html+'</span>'; } PK.devIconHTML=devIconHTML;
// icon.* in de apparaatmappen van één bron (zoals loadDirIcons voor categorieen); find(prefix,naam) geeft een Blob/File of null. Niet voor URL-bronnen: daar zou elk apparaat vier verzoeken kosten.
async function loadDevIcons(src,find){
  for(const k of [...PK.DEVICON.keys()]) if(k.startsWith(src.sid+'|')) PK.DEVICON.delete(k);
  if(!find||src.kind==='url') return; PK.syncDirCats(); const seen=new Set();
  for(const def of PK.latestDefs()){ if(!def._src||def._src.sid!==src.sid) continue; const d=devDirOf(def); if(!d||seen.has(d)) continue; seen.add(d);
    for(const ext of Object.keys(PK.ICONTYPES)){ let blob=null; try{ blob=await find(d+'/','icon.'+ext); }catch(e){} if(!blob) continue;
      let u=null; try{ u=await PK.iconToDataUrl(blob,ext); }catch(e){} if(u){ PK.DEVICON.set(src.sid+'|'+d,u); break; } } } } PK.loadDevIcons=loadDevIcons;
})(window.__PK);
