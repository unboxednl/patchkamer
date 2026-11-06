// js/library-view.js — bibliotheek: kaartjes of compact, lang indrukken en slepen, onderlade
(function(PK){
function paintLibView(){ const cur=PK.libViewNow(); document.querySelectorAll('#libView button').forEach(b=>{ const on=b.dataset.v===cur; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); }); } PK.paintLibView=paintLibView;
const LIBP={timer:0,id:null,x:0,y:0,on:false,moved:false,def:null}; PK.LIBP=LIBP;
// op aanraking: het zachtjes slepen scrolt de lijst; pas na ±500 ms stilhouden pak je het apparaat op om het naar de vloer te slepen
function libPress(e,def,ver,row){ clearTimeout(LIBP.timer); LIBP.id=e.pointerId; LIBP.x=e.clientX; LIBP.y=e.clientY; LIBP.on=false; LIBP.moved=false; LIBP.def=def;
  LIBP.timer=setTimeout(()=>{ if(LIBP.id==null) return; LIBP.on=true; PK.libDrag={def,ver,x0:LIBP.x,y0:LIBP.y,ghost:null,touch:true};
    const g=document.createElement('div'); g.className='libghost'; g.textContent=def.name; document.body.appendChild(g); PK.libDrag.ghost=g; g.style.left=LIBP.x+'px'; g.style.top=LIBP.y+'px'; try{ navigator.vibrate&&navigator.vibrate(12); }catch(_){} },500); } PK.libPress=libPress;
})(window.__PK);
