// js/cable-routing.js — kabelvormen: boog, rechte hoeken, om apparaten heen
(function(PK){
// ---------- kabels: boog, recht met hoeken, of om de apparaten heen ----------
function setCabColor(m){ PK.V18.col=m==='kind'?'kind':'cat'; try{ localStorage.setItem('patchkamer.cabColor',PK.V18.col); }catch(e){} PK.drawCablesNow(); }
function setCableStyle(m){ PK.V18.cab=['curve','orth','route'].includes(m)?m:'curve'; try{ localStorage.setItem('patchkamer.cables',PK.V18.cab); }catch(e){} PK._routeCache.clear(); PK.drawCablesNow(); }
function setCableOp(v){ PK.V18.op=Math.max(0.15,Math.min(1,+v||1)); try{ localStorage.setItem('patchkamer.cableOp',String(PK.V18.op)); }catch(e){} document.documentElement.style.setProperty('--cableOp',String(PK.V18.op)); const o=PK.$('cabOpV'); if(o) o.textContent=Math.round(PK.V18.op*100)+'%'; }
function polyD(pts,rad){ if(pts.length<2) return ''; let d=`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for(let i=1;i<pts.length-1;i++){ const a=pts[i-1], b=pts[i], c=pts[i+1]; const l1=Math.hypot(b.x-a.x,b.y-a.y), l2=Math.hypot(c.x-b.x,c.y-b.y), r=Math.min(rad,l1/2,l2/2);
    if(r<0.5){ d+=` L${b.x.toFixed(1)},${b.y.toFixed(1)}`; continue; }
    const p=({x:b.x+(a.x-b.x)*r/l1,y:b.y+(a.y-b.y)*r/l1}), q=({x:b.x+(c.x-b.x)*r/l2,y:b.y+(c.y-b.y)*r/l2});
    d+=` L${p.x.toFixed(1)},${p.y.toFixed(1)} Q${b.x.toFixed(1)},${b.y.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`; }
  const z=pts[pts.length-1]; return d+` L${z.x.toFixed(1)},${z.y.toFixed(1)}`; }
function simplify(pts){ const o=[]; for(const p of pts){ if(o.length&&Math.abs(o[o.length-1].x-p.x)<0.01&&Math.abs(o[o.length-1].y-p.y)<0.01) continue; o.push(p); if(o.length>=3){ const a=o[o.length-3], b=o[o.length-2], c=o[o.length-1]; if((Math.abs(a.x-b.x)<0.01&&Math.abs(b.x-c.x)<0.01)||(Math.abs(a.y-b.y)<0.01&&Math.abs(b.y-c.y)<0.01)) o.splice(o.length-2,1); } } return o; }
function densify(pts){ const o=[]; for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4)); for(let j=0;j<n;j++) o.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n}); } o.push(pts[pts.length-1]); return o; }
function orthPts(p1,p2,ra,rb){ const G=18; const x1=Math.max(p1.x+G,ra?ra.r+10:p1.x+G), x2=Math.min(p2.x-G,rb?rb.l-10:p2.x-G);
  if(x2>=x1){ const mx=(x1+x2)/2; return [p1,{x:mx,y:p1.y},{x:mx,y:p2.y},p2]; }
  let my=(p1.y+p2.y)/2; if(ra&&rb&&(rb.t-ra.b>=12||ra.t-rb.b>=12)){ my=rb.t>ra.b?(ra.b+rb.t)/2:(rb.b+ra.t)/2; } else if(ra&&rb){ const top=Math.min(ra.t,rb.t), bot=Math.max(ra.b,rb.b); my=(Math.abs(p1.y-top)+Math.abs(p2.y-top)<Math.abs(p1.y-bot)+Math.abs(p2.y-bot))?top-16:bot+16; }
  return [p1,{x:x1,y:p1.y},{x:x1,y:my},{x:x2,y:my},{x:x2,y:p2.y},p2]; }
function cardRect(r){ const e=r.el; if(!e||!e.isConnected||e.classList.contains('infocus')) return null; const w=e.offsetWidth, h=e.offsetHeight; if(!w||!h) return null; return {l:e.offsetLeft,t:e.offsetTop,r:e.offsetLeft+w,b:e.offsetTop+h}; }
function obstacles(){ const L=[]; PK.Host.devices.forEach((r,id)=>{ const q=cardRect(r); if(q) L.push({id,...q}); }); return L; }
// A* op een raster van 10 px; bochten kosten extra, apparaten (met 8 px marge) zijn verboden terrein.
function routeAstar(a,b,obs){ const C=10, M=8; let L=Math.min(a.x,b.x)-160, T=Math.min(a.y,b.y)-160, R=Math.max(a.x,b.x)+160, B=Math.max(a.y,b.y)+160;
  const W=Math.ceil((R-L)/C)+1, H=Math.ceil((B-T)/C)+1; if(W*H>160000) return null;
  const block=new Uint8Array(W*H);
  for(const o of obs){ const i0=Math.max(0,Math.floor((o.l-M-L)/C)), i1=Math.min(W-1,Math.ceil((o.r+M-L)/C)), j0=Math.max(0,Math.floor((o.t-M-T)/C)), j1=Math.min(H-1,Math.ceil((o.b+M-T)/C)); for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) block[j*W+i]=1; }
  const ci=p=>Math.max(0,Math.min(W-1,Math.round((p.x-L)/C))), cj=p=>Math.max(0,Math.min(H-1,Math.round((p.y-T)/C)));
  const si=ci(a), sj=cj(a), ti=ci(b), tj=cj(b); block[sj*W+si]=0; block[tj*W+ti]=0;
  const N=W*H*4, g=new Float32Array(N).fill(Infinity), from=new Int32Array(N).fill(-1), DX=[1,0,-1,0], DY=[0,1,0,-1];
  const heap=[], push=(f,s)=>{ heap.push([f,s]); let k=heap.length-1; while(k>0){ const p=(k-1)>>1; if(heap[p][0]<=heap[k][0]) break; [heap[p],heap[k]]=[heap[k],heap[p]]; k=p; } };
  const pop=()=>{ const top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; let k=0; for(;;){ const l=2*k+1, r=l+1; let m=k; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===k) break; [heap[m],heap[k]]=[heap[k],heap[m]]; k=m; } } return top; };
  const hh=(i,j)=>Math.abs(i-ti)+Math.abs(j-tj); const s0=(sj*W+si)*4+0; g[s0]=0; push(hh(si,sj),s0); let end=-1, it=0;
  while(heap.length&&it++<400000){ const [,s]=pop(); const cell=s>>2, d=s&3, i=cell%W, j=(cell/W)|0; if(i===ti&&j===tj&&d===0){ end=s; break; }
    if(i===ti&&j===tj){ end=s; break; }
    for(let nd=0;nd<4;nd++){ if(nd===((d+2)&3)) continue; const ni=i+DX[nd], nj=j+DY[nd]; if(ni<0||nj<0||ni>=W||nj>=H||block[nj*W+ni]) continue;
      const ns=((nj*W+ni)<<2)|nd, cost=g[s]+1+(nd!==d?6:0); if(cost<g[ns]){ g[ns]=cost; from[ns]=s; push(cost+hh(ni,nj),ns); } } }
  if(end<0) return null; const pts=[]; for(let s=end;s>=0;s=from[s]){ const cell=s>>2; pts.push({x:L+(cell%W)*C,y:T+((cell/W)|0)*C}); if(s===s0) break; }
  pts.reverse(); return pts; }
function cableRoute(c,p1,p2){ if(PK.V18.cab==='curve'){ const P=PK.bez(p1,p2); return {P,d:`M${p1.x},${p1.y} C${P[1].x},${P[1].y} ${P[2].x},${P[2].y} ${p2.x},${p2.y}`}; }
  const A=PK.Host.devices.get(c.from.id), B=PK.Host.devices.get(c.to.id), ra=A&&cardRect(A), rb=B&&cardRect(B); let pts=null;
  if(PK.V18.cab==='route'){ const obs=obstacles(); const sig=obs.map(o=>o.id+':'+o.l+','+o.t+','+o.r+','+o.b).join('|'); const now=performance.now();
    if(sig!==PK._obsSig){ PK._obsSig=sig; PK._obsT=now; PK._routeCache.clear(); }
    if(now-PK._obsT<180){ clearTimeout(PK._obsTimer); PK._obsTimer=setTimeout(()=>PK.drawCablesNow(),200); }   // tijdens slepen: eenvoudige hoeken, daarna de echte route
    else { const key=[c.from.id,c.from.port,c.to.id,c.to.port,Math.round(p1.x),Math.round(p1.y),Math.round(p2.x),Math.round(p2.y)].join(';');
      if(PK._routeCache.has(key)) pts=PK._routeCache.get(key);
      else { const ex={x:(ra?ra.r:p1.x)+14,y:p1.y}, en={x:(rb?rb.l:p2.x)-14,y:p2.y}; const mid=routeAstar(ex,en,obs);
        if(mid&&mid.length){ mid[0]={x:mid[0].x,y:mid[0].y}; pts=simplify([p1,{x:ex.x,y:p1.y},{x:ex.x,y:mid[0].y},...mid,{x:en.x,y:mid[mid.length-1].y},{x:en.x,y:p2.y},p2]); }
        PK._routeCache.set(key,pts); if(PK._routeCache.size>600) PK._routeCache.clear(); } } }
  if(!pts) pts=simplify(orthPts(p1,p2,ra,rb));
  return {P:PK.bez(p1,p2),d:polyD(pts,9),pts:densify(pts)}; } PK.cableRoute=cableRoute;
function v18Init(){ const cc=PK.$('cabColor'); if(cc){ cc.value=PK.V18.col; cc.onchange=()=>setCabColor(cc.value); }
  const cs=PK.$('cabStyle'); if(cs){ cs.value=PK.V18.cab; cs.onchange=()=>setCableStyle(cs.value); }
  const co=PK.$('cabOp'); if(co){ co.value=PK.V18.op; co.oninput=()=>setCableOp(co.value); co.ondblclick=()=>{ co.value=1; setCableOp(1); }; } setCableOp(PK.V18.op);
  const ks=PK.$('knobStyle'); if(ks){ ks.value=PK.V18.knob; ks.onchange=()=>PK.setKnobStyle(ks.value); }
  const sc=PK.$('scaleSel'); if(sc){ PK.paintScaleUI(); sc.onchange=()=>PK.setScale(sc.value); } } PK.v18Init=v18Init;
})(window.__PK);
