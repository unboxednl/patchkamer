// js/workspace-auto.js — wat een nieuwe werkruimte automatisch laadt (Instellingen)
(function(PK){
// ---- nieuwe werkruimte: wat er automatisch wordt geladen (Instellingen) en de knop Alles laden in het Tunes- en Presets-paneel ----
// Per soort (apparaten, presets, tunes) één adres; een GitHub-map met alles daaronder. Elk adres is een gewone bron met `only`, dus ze staan ook in de lijst Bronnen.
const WSAKEY='patchkamerWsAuto', WSA_KINDS={dev:'devices',pre:'presets',tun:'tunes'}; PK.WSAKEY=WSAKEY;
const WSA_DEF={dev:{on:true,url:'github.com/unboxednl/patchkamer/tree/main/devices'},pre:{on:true,url:'github.com/unboxednl/patchkamer/tree/main/presets'},tun:{on:true,url:'github.com/unboxednl/patchkamer/tree/main/tunes'}}; PK.WSA_DEF=WSA_DEF;
const saveWsa=()=>{ try{ localStorage.setItem(WSAKEY,JSON.stringify(PK.WSA)); }catch(e){} }; PK.saveWsa=saveWsa;
function wsaSource(k){ let p; try{ p=PK.parseSourceUrl(PK.WSA[k].url); }catch(e){ p=null; }
  if(!p||p.kind!=='github'){ PK.status(PK.pkt('m.werkruimte_laden_adres',WSA_KINDS[k]),true); return null; }
  const only=WSA_KINDS[k], same=PK.SOURCES.find(x=>x.kind==='github'&&x.only===only&&x.owner===p.owner&&x.repo===p.repo&&(!p.ref||(x.ref||'')===p.ref)&&(x.path||'')===(p.path||''));
  if(same) return same;
  const src={sid:PK.newSid(),...p,only,label:`${p.owner}/${p.repo}${p.path?'/'+p.path:''}`,added:Date.now()}; PK.SOURCES.push(src); PK.saveSources(); return src; }
async function wsaLoad(k,force){ const src=wsaSource(k); if(!src) return null; const st=PK.SRCSTATE.get(src.sid);
  if(!force&&st&&(st.state==='ok'||st.state==='warn'||st.state==='busy')) return src;
  await PK.loadSource(src,{interactive:false,fresh:!!force}); return src; } PK.wsaLoad=wsaLoad;
async function wsaAutoLoad(){ for(const k of Object.keys(PK.WSA)) if(PK.WSA[k].on){ try{ await wsaLoad(k,false); }catch(e){} } } PK.wsaAutoLoad=wsaAutoLoad;
function wsaPaint(){ for(const [k,id] of [['dev','Dev'],['pre','Pre'],['tun','Tun']]){ PK.$('wsa'+id).checked=PK.WSA[k].on; PK.$('wsu'+id).value=PK.WSA[k].url; PK.$('wsu'+id).disabled=false; } } PK.wsaPaint=wsaPaint;
})(window.__PK);
