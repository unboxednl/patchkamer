// js/audio-settings.js — audiokwaliteitsniveaus (PK_QUALITY) en de bewaarde audio-instellingen (PK_AUDIO)
(function(PK){
/* ===== audio-instellingen: kwaliteitsniveaus. "normal" is het gedrag van vóór deze instelling bestond. ===== */
const PK_QUALITY={low:{latency:'playback',sampleRate:'44100',oversample:'none'},normal:{latency:'interactive',sampleRate:'auto',oversample:'2x'},high:{latency:'balanced',sampleRate:'96000',oversample:'4x'}}; PK.PK_QUALITY=PK_QUALITY;
const PK_AUDIO=(()=>{ const g=(k,ok,d)=>{ try{ const v=localStorage.getItem('patchkamer.'+k); return ok.includes(v)?v:d; }catch(e){ return d; } }; const n=PK_QUALITY.normal; return {latency:g('latency',['interactive','balanced','playback'],n.latency),sampleRate:g('sampleRate',['auto','44100','48000','96000'],n.sampleRate),oversample:g('oversample',['none','2x','4x'],n.oversample)}; })(); PK.PK_AUDIO=PK_AUDIO;
function pkQualityOf(a){ for(const k of Object.keys(PK_QUALITY)){ const p=PK_QUALITY[k]; if(p.latency===a.latency&&p.sampleRate===a.sampleRate&&p.oversample===a.oversample) return k; } return 'custom'; } PK.pkQualityOf=pkQualityOf;
})(window.__PK);
