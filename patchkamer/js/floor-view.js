// js/floor-view.js — schermklassen en vloerweergave: zoomen, pannen, toetsen
(function(PK){
const isSheet=()=>PK.PKT.narrow.matches; PK.isSheet=isSheet;
const libViewNow=()=>PK.LIBV.picked?PK.LIBV.v:((window.innerWidth<700||PK.PKT.coarse.matches)?'compact':'cards'); PK.libViewNow=libViewNow;
const layoutTarget=()=>PK.LAY.mode==='wide'?'wide':PK.LAY.mode==='compact'?'compact':(window.innerWidth<1100?'compact':'wide'); PK.layoutTarget=layoutTarget;
function liteHold(d){ PK.LITE.hold=Math.max(0,(PK.LITE.hold||0)+d); if(d>0&&PK.LITE.state){ PK.LITE.state=false; PK.floor.classList.remove('lite'); } if(!PK.LITE.hold) liteUpdate(); } PK.liteHold=liteHold;
function liteUpdate(){ if(PK.LITE.hold) return; const rel=PK.Host.view.scale/PK.PKS.f, want=PK.LITE.on&&(PK.LITE.state?rel<0.6:rel<0.55);
  if(want!==PK.LITE.state){ PK.LITE.state=want; PK.floor.classList.toggle('lite',want); PK.drawCables(); requestAnimationFrame(()=>PK.drawCables()); } } PK.liteUpdate=liteUpdate;
function applyView(){ const v=PK.Host.view; PK.floor.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.scale})`; PK.floorwrap.style.backgroundSize=`${40*v.scale}px ${40*v.scale}px`; PK.floorwrap.style.backgroundPosition=`${v.x}px ${v.y}px`; PK.$('zoomOut_v').textContent=Math.round(v.scale/PK.PKS.f*100)+'%'; PK.$('zoomOut_v').title=PK.pkt('m.zoom_ten_opzichte_van_de')+Math.round(PK.PKS.f*100)+'%)'; liteUpdate(); PK.hitWidthSoon(); } PK.applyView=applyView;
function zoomAt(factor,cx,cy){ const v=PK.Host.view, ns=PK.clamp(v.scale*factor,0.1,2.5), k=ns/v.scale; v.x=cx-(cx-v.x)*k; v.y=cy-(cy-v.y)*k; v.scale=ns; applyView(); } PK.zoomAt=zoomAt;
function wrapCenter(){ const r=PK.floorwrap.getBoundingClientRect(); return [r.width/2,r.height/2]; } PK.wrapCenter=wrapCenter;
function zoomFitNow(){ const rs=[...PK.Host.devices.values()]; if(!rs.length) return; const minX=Math.min(...rs.map(r=>r.x)), minY=Math.min(...rs.map(r=>r.y)), maxX=Math.max(...rs.map(r=>r.x+r.el.offsetWidth)), maxY=Math.max(...rs.map(r=>r.y+r.el.offsetHeight)); const wr=PK.floorwrap.getBoundingClientRect(); const sc=PK.clamp(Math.min((wr.width-60)/(maxX-minX),(wr.height-60)/(maxY-minY)),0.1,1.5); PK.Host.view={scale:sc,x:(wr.width-(maxX-minX)*sc)/2-minX*sc,y:(wr.height-(maxY-minY)*sc)/2-minY*sc}; applyView(); } PK.zoomFitNow=zoomFitNow;
PK.pan=null;
const endPan=()=>{PK.pan=null; PK.floorwrap.classList.remove('panning');}; PK.endPan=endPan;
const typing=e=>{const t=(e.composedPath&&e.composedPath()[0])||e.target; return !!t&&(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(t.tagName)||t.isContentEditable);}; PK.typing=typing;
})(window.__PK);
