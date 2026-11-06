// js/library-scan.js — bibliotheekmappen: nieuwe apparaten vanzelf herkennen
(function(PK){
async function folderSig(src){ let h=null; try{ h=await PK.IDB.get('dir:'+src.sid); }catch(e){} if(!h||!h.queryPermission) return null;
  try{ if(await h.queryPermission({mode:'read'})!=='granted') return null; }catch(e){ return null; }
  const list=[]; const walk=async(d,pre,dep)=>{ for await (const [n,e] of d.entries()){ if(n.startsWith('.')||n==='node_modules') continue;
      if(e.kind==='file'){ if(/\.m?js$|\.json$/i.test(n)){ let m=0, z=0; try{ const f=await e.getFile(); m=f.lastModified; z=f.size; }catch(_){} list.push(pre+n+':'+m+':'+z); } }
      else if(dep<3) await walk(e,pre+n+'/',dep+1); } };
  try{ await walk(h,'',0); }catch(e){ return null; } return list.sort().join('|'); } PK.folderSig=folderSig;
const pkSig=l=>{ const t=JSON.stringify([l.name,l.device,l.tree],(k,v)=>(k==='pid'||k==='fid'||k==='t')?undefined:v); let h=5381; for(let i=0;i<t.length;i++) h=((h<<5)+h+t.charCodeAt(i))|0; return t.length+':'+h; };
async function rescanSource(src,interactive){
  const before=new Map([...PK.Host.registry.entries()].map(([k,d])=>[k,d._code||''])), libsBefore=new Map(PK.PR.libs.filter(l=>l.ro&&l.src&&l.src.sid===src.sid).map(l=>[l.lid,pkSig(l)]));
  const r=await PK.loadSource(src,{interactive,fresh:true});
  const nw=[], ch=[]; PK.Host.registry.forEach((d,k)=>{ if(!before.has(k)) nw.push(d); else if(d._src&&d._src.sid===src.sid&&before.get(k)!==(d._code||'')) ch.push(d); });
  let pn=0, pc=0; PK.PR.libs.filter(l=>l.ro&&l.src&&l.src.sid===src.sid).forEach(l=>{ if(!libsBefore.has(l.lid)) pn++; else if(libsBefore.get(l.lid)!==pkSig(l)) pc++; });
  const total=nw.length+ch.length+pn+pc;
  PK.LIBMARK.nw=new Set(total<=25?nw.map(d=>d.id):[]); PK.LIBMARK.ch=new Set(total<=25?ch.map(d=>d.id):[]); clearTimeout(PK.LIBMARK.t); if(PK.LIBMARK.nw.size||PK.LIBMARK.ch.size) PK.LIBMARK.t=setTimeout(()=>{ PK.LIBMARK.nw=new Set(); PK.LIBMARK.ch=new Set(); PK.paintLib(); },120000);
  const upd=(ch.length||nw.length)?PK.updatePlaced(new Set(nw.map(d=>PK.Host.key(d.id,d.version)))):0;
  PK.paintLib(); PK.refreshVersionSelects(); PK.presetRefreshAll(); if(PK.wsPanel&&!PK.wsPanel.hidden) PK.paintPatches();   // de bibliotheek meteen opnieuw tekenen
  if(src.kind==='folder'){ const sg=await folderSig(src); if(sg) PK.FOLDERSIG.set(src.sid,sg); }
  const errs=(r&&r.errs)||[], parts=[];
  if(nw.length) parts.push(PK.pkt('m.scan_nieuw_n',nw.length)); if(ch.length) parts.push(PK.pkt('m.scan_gewijzigd_n',ch.length)); if(pn) parts.push(PK.pkt('m.scan_packs_nieuw',pn)); if(pc) parts.push(PK.pkt('m.scan_packs_gewijzigd',pc)); if(upd) parts.push(PK.pkt('m.scan_bijgewerkt_n',upd));
  const names=[...nw,...ch].map(d=>d.name).filter((x,i,a)=>a.indexOf(x)===i), nm=names.length&&total<=25?' ('+names.slice(0,6).join(', ')+(names.length>6?PK.pkt('m.en_nog',names.length-6):'')+')':'';
  PK.status(`${PK.srcLabel(src)}: `+(total?PK.pktp('m.scan_n_wijzigingen',total===1,total)+' · '+parts.join(', ')+nm:PK.pkt('m.scan_geen'))+(errs.length?PK.pktp('m.fouten_fout',errs.length>1,errs.length,errs[0]):''),errs.length>0);
  if(src.kind==='folder'&&!PK.FOLDERSIG.has(src.sid)&&interactive) PK.status(PK.pkt('m.deze_map_is_gekoppeld_zonder',PK.srcLabel(src)),true);
  return r; } PK.rescanSource=rescanSource;
async function autoScan(){ if(PK._scanBusy||document.hidden||Date.now()-PK._scanT<2500) return; PK._scanBusy=true; PK._scanT=Date.now();
  try{ for(const src of PK.SOURCES){ if(src.kind!=='folder') continue; const sg=await folderSig(src); if(!sg) continue; const old=PK.FOLDERSIG.get(src.sid); if(old===undefined){ PK.FOLDERSIG.set(src.sid,sg); continue; } if(old!==sg) await rescanSource(src,false); } }
  catch(e){} finally{ PK._scanBusy=false; } } PK.autoScan=autoScan;
})(window.__PK);
