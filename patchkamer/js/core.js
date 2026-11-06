// js/core.js — schaal per scherm (PKS) en de kleine helpers $, clamp, cmpVer
(function(PK){
function pksAuto(){ const h=window.innerHeight||1000, w=window.innerWidth||1400; return Math.max(0.55,Math.min(1,Math.round(Math.min(h/700,w/1100)*20)/20)); } PK.pksAuto=pksAuto;   // 100%, behalve op een erg klein scherm (tablet, telefoon: onder ±700 px hoog of ±1100 px breed)
function pksTarget(){ return PK.PKS.mode==='auto'?pksAuto():Math.max(0.5,Math.min(1.5,PK.PKS.pct/100)); } PK.pksTarget=pksTarget;

const $=id=>document.getElementById(id); PK.$=$;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); PK.clamp=clamp;
const cmpVer=(a,b)=>{const pa=String(a).split('.').map(Number),pb=String(b).split('.').map(Number); for(let i=0;i<3;i++){const d=(pa[i]||0)-(pb[i]||0); if(d) return d;} return 0;}; PK.cmpVer=cmpVer;
})(window.__PK);
