// js/stems.js — stems splitsen via een dienst op internet (contract v1.23, §13g): register van diensten, instellingen (sleutels), aanroep met wachtrij, mp3-omzetting (lamejs uit vendor/, alleen op aanvraag), zip-lezer
(function(PK){
/* =====================================================================
   STEMS · host.stems(inst, actie, opties). Een apparaat mag geen netwerk gebruiken; deze aanroep zit daarom in de host.
   - Sleutels staan alleen in deze browser (localStorage, sleutel patchkamerStems), nooit in een song, werkruimte of preset, en gaan alleen naar de gekozen dienst.
   - Een aanroep start alleen na een klik van de gebruiker in het apparaat; de host vraagt de eerste keer per sessie (per dienst en model) om bevestiging.
   - Protocol van de diensten: wachtrij met indienen, status en resultaat (POST naar basis/eindpunt, dan de status- en resultaat-adressen uit het antwoord).
   - Een dienst is een regel in SERVICES; "custom" is een eigen dienst met hetzelfde protocol (basisadres, eindpunt, sleutel, model).
   ===================================================================== */
const KEY='patchkamerStems', MB=1024*1024;
const LIM={zipBytes:400*MB, entries:64, entryBytes:250*MB, totalBytes:800*MB, stems:12, jsonBytes:2*MB, pollMax:3000, timeoutMs:20*60*1000};
const SERVICES={
  a:{id:'a', endpoint:'mureka/api/song/stem', base:'https://queue.fal.run', accept:['mp3','m4a'], maxBytes:10*MB, midi:true, models:[{id:'audio-separation-1',price:0.06,k:'m.st_a1'},{id:'audio-separation-2',price:0.20,k:'m.st_a2'},{id:'audio-separation-3',price:0.70,k:'m.st_a3'}], dflt:'audio-separation-3',
     input:(url,model)=>({audio_url:url,model})},
  b:{id:'b', endpoint:'fal-ai/demucs', base:'https://queue.fal.run', accept:['mp3','m4a','wav','flac','ogg'], maxBytes:25*MB, midi:false, models:[{id:'htdemucs',price:null,k:'m.st_b1'},{id:'htdemucs_ft',price:null,k:'m.st_b2'},{id:'htdemucs_6s',price:null,k:'m.st_b3'}], dflt:'htdemucs_6s',
     input:(url,model)=>({audio_url:url,model,output_format:'wav'})},
  custom:{id:'custom', endpoint:'', base:'', accept:['mp3','m4a','wav','flac','ogg'], maxBytes:25*MB, midi:true, models:[], dflt:'', input:(url,model)=>(model?{audio_url:url,model}:{audio_url:url})}
};
const IDS=['a','b','custom'];
const str=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const numOr=(v,lo,hi,d)=>{ const n=typeof v==='string'&&v.trim()!==''?+v.replace(',','.'):v; return typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi?n:d; };
function cfg(){ let o={}; try{ o=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ o={}; }
  const s=o&&typeof o.services==='object'&&o.services?o.services:{}, out={services:{}};
  IDS.forEach(id=>{ const v=s[id]&&typeof s[id]==='object'?s[id]:{}; out.services[id]={key:str(v.key,500),model:str(v.model,100),price:numOr(v.price,0,1000,null),base:str(v.base,300),endpoint:str(v.endpoint,200),maxMb:numOr(v.maxMb,1,100,25)}; }); return out; }
function save(c){ try{ localStorage.setItem(KEY,JSON.stringify(c)); }catch(e){} }
const labelOf=id=>PK.pkt(id==='a'?'m.st_svc_a':id==='b'?'m.st_svc_b':'m.st_svc_c');
const modelOf=(svc,c)=>{ const m=svc.models.find(x=>x.id===c.model); return m?m.id:(c.model&&!svc.models.length?c.model:svc.dflt); };
const priceOf=(svc,c,model)=>{ if(c.price!=null) return c.price; const m=svc.models.find(x=>x.id===model); return m&&m.price!=null?m.price:null; };
const money=p=>p==null?PK.pkt('m.st_prijs_onbekend'):'$'+p.toLocaleString(PK.PK_LANG==='nl'?'nl-NL':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function urlOk(u,allowHttpLocal){ let x; try{ x=new URL(u); }catch(e){ return null; } if(x.username||x.password) return null;
  if(x.protocol==='https:') return x; if(allowHttpLocal&&x.protocol==='http:'&&(x.hostname==='localhost'||x.hostname==='127.0.0.1'||x.hostname==='[::1]')) return x; return null; }
// beschrijving van een dienst voor het apparaat: nooit de sleutel zelf
function describe(id){ const svc=SERVICES[id], c=cfg().services[id], model=modelOf(svc,c);
  const models=svc.models.map(m=>({id:m.id,label:PK.pkt(m.k),price:priceOf(svc,c,m.id)}));
  const conf=!!c.key&&(id!=='custom'||!!urlOk(c.base,true)&&!!c.endpoint);
  return {id,label:labelOf(id),configured:conf,models,model,price:priceOf(svc,c,model),currency:'USD',accept:svc.accept.slice(),maxBytes:id==='custom'?Math.round(c.maxMb*MB):svc.maxBytes,midi:svc.midi}; }

// ---------- fouten ----------
function fail(code,msg,extra){ const e=new Error(msg||code); e.code=code; if(extra) Object.assign(e,extra); return e; }
const isAbort=e=>e&&(e.name==='AbortError'||e.code==='aborted'||e.code==='timeout');

// ---------- formaat herkennen aan de eerste bytes ----------
function sniff(u){ if(u.length>=3&&u[0]===0x49&&u[1]===0x44&&u[2]===0x33) return 'mp3'; if(u.length>=2&&u[0]===0xFF&&(u[1]&0xE0)===0xE0) return 'mp3';
  const t=(a,b)=>String.fromCharCode(...u.subarray(a,b)); if(u.length>=12&&t(4,8)==='ftyp') return 'm4a'; if(u.length>=12&&t(0,4)==='RIFF'&&t(8,12)==='WAVE') return 'wav'; if(u.length>=4&&t(0,4)==='fLaC') return 'flac'; if(u.length>=4&&t(0,4)==='OggS') return 'ogg'; return ''; }

// ---------- zip-lezer (opgeslagen en deflate; geen zip64, geen versleuteling) ----------
let CRC=null; function crc32(u){ if(!CRC){ CRC=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; CRC[n]=c>>>0; } } let c=0xFFFFFFFF; for(let i=0;i<u.length;i++) c=CRC[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
const AUDIOEXT=/\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i;
async function inflateRaw(src,expect){   // geeft precies `expect` bytes, of een fout; stopt zodra er meer uitkomt dan de zip zegt (zipbom)
  if(typeof DecompressionStream!=='function') throw fail('unsupported','DecompressionStream');
  const out=new Uint8Array(expect); let n=0; const rd=new Blob([src]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  try{ for(;;){ const {done,value}=await rd.read(); if(done) break; if(n+value.length>expect){ try{ await rd.cancel(); }catch(e){} throw fail('zip','size'); } out.set(value,n); n+=value.length; } }
  catch(e){ if(e&&e.code) throw e; throw fail('zip','inflate'); }
  if(n!==expect) throw fail('zip','size'); return out; }
async function readZip(buf){
  const u=buf instanceof Uint8Array?buf:new Uint8Array(buf), dv=new DataView(u.buffer,u.byteOffset,u.byteLength), len=u.length;
  if(len>LIM.zipBytes) throw fail('zip','big'); if(len<22) throw fail('zip','short');
  let eocd=-1; for(let i=len-22;i>=Math.max(0,len-22-65535);i--){ if(dv.getUint32(i,true)===0x06054b50){ eocd=i; break; } } if(eocd<0) throw fail('zip','eocd');
  const count=dv.getUint16(eocd+10,true), cdSize=dv.getUint32(eocd+12,true), cdOff=dv.getUint32(eocd+16,true);
  if(count===0xFFFF||cdSize===0xFFFFFFFF||cdOff===0xFFFFFFFF) throw fail('zip','zip64');
  if(count>LIM.entries) throw fail('zip','many'); if(cdOff+cdSize>eocd) throw fail('zip','cd');
  const dec=new TextDecoder('utf-8'), list=[]; let p=cdOff, total=0;
  for(let i=0;i<count;i++){
    if(p+46>len||dv.getUint32(p,true)!==0x02014b50) throw fail('zip','cd');
    const flags=dv.getUint16(p+8,true), method=dv.getUint16(p+10,true), crc=dv.getUint32(p+16,true), cs=dv.getUint32(p+20,true), us=dv.getUint32(p+24,true), nl=dv.getUint16(p+28,true), el=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), lho=dv.getUint32(p+42,true);
    if(p+46+nl+el+cl>len) throw fail('zip','cd');
    const name=dec.decode(u.subarray(p+46,p+46+nl)).replace(/\\/g,'/'); p+=46+nl+el+cl;
    // zip-slip: een naam met .., een absoluut pad, een station of een NUL-teken maakt de hele zip onbetrouwbaar
    if(name.startsWith('/')||/^[A-Za-z]:/.test(name)||name.includes('\0')||name.split('/').some(s=>s==='..')) throw fail('zip','unsafe');
    if(flags&1) throw fail('zip','encrypted'); if(name.endsWith('/')) continue;
    if(us>LIM.entryBytes) throw fail('zip','big'); total+=us; if(total>LIM.totalBytes) throw fail('zip','big');
    list.push({name,method,crc,cs,us,lho}); }
  const files=[];
  for(const e of list){
    const base=e.name.split('/').pop(); if(e.name.startsWith('__MACOSX/')||base.startsWith('.')||!AUDIOEXT.test(base)) continue;
    if(e.lho+30>len||dv.getUint32(e.lho,true)!==0x04034b50) throw fail('zip','lh');
    const start=e.lho+30+dv.getUint16(e.lho+26,true)+dv.getUint16(e.lho+28,true); if(start+e.cs>len) throw fail('zip','lh');
    const raw=u.subarray(start,start+e.cs); let data;
    if(e.method===0){ if(e.cs!==e.us) throw fail('zip','size'); data=raw.slice(); } else if(e.method===8) data=await inflateRaw(raw,e.us); else throw fail('zip','method');
    if(crc32(data)!==e.crc) throw fail('zip','crc'); files.push({name:e.name,base,data}); }
  return files; }

// ---------- stemnamen ----------
const ALIAS={vocal:'vocals',vocals:'vocals',voice:'vocals',voices:'vocals',singer:'vocals',drum:'drums',drums:'drums',percussion:'drums',bass:'bass',bassline:'bass',other:'other',others:'other',rest:'other',guitar:'guitar',guitars:'guitar',piano:'piano',keys:'piano',keyboard:'piano',strings:'strings',string:'strings',wind:'wind',winds:'wind',brass:'brass',synth:'synth',synths:'synth',instrumental:'instrumental',instrumentals:'instrumental',no_vocals:'instrumental',novocals:'instrumental',accompaniment:'instrumental',backing:'instrumental',backingtrack:'instrumental',music:'instrumental'};
const ORDER=['vocals','drums','bass','guitar','piano','strings','synth','brass','wind','other','instrumental'];
function stemId(raw){ let b=String(raw||'').split('/').pop().replace(/\.[A-Za-z0-9]{2,5}$/,'').toLowerCase().replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,''); if(!b) b='stem';
  if(ALIAS[b]) return ALIAS[b]; const t=b.split(/[_-]/); for(let i=t.length-1;i>=0;i--) if(ALIAS[t[i]]) return ALIAS[t[i]]; b=b.slice(0,24); return b==='all'||b==='in'?b+'_stem':b; }
// Een dienst stuurt soms de invoer zelf mee ("song.wav" en "song.mp3" bij de Mureka-dienst, gemeten 07-11) en hetzelfde stem in twee formaten: de invoer is geen stem, en van twee formaten blijft het verliesvrije over.
function cleanItems(list){ const key=n=>String(n).split('/').pop().replace(/\.[A-Za-z0-9]{2,5}$/,'').toLowerCase(), ext=n=>((/\.([A-Za-z0-9]{2,5})$/.exec(String(n))||[])[1]||'').toLowerCase(), rank={wav:0,flac:1,ogg:2,m4a:3,mp3:4}, drop=new Set(['song','original','mix','input']), best=new Map();
  for(const x of list){ const k=key(x.name); if(drop.has(k)) continue; const r=rank[ext(x.name)]??9, b=best.get(k); if(!b||r<b.r) best.set(k,{x,r}); }
  const out=[...best.values()].map(v=>v.x); return out.length?out:list; }
function nameStems(list){ const used=new Set(), out=[]; for(const x of list){ let id=stemId(x.name), k=2; const base=id; while(used.has(id)) id=base+'_'+(k++); used.add(id); out.push({...x,id}); }
  out.sort((a,b)=>{ const ia=ORDER.indexOf(a.id.replace(/_\d+$/,'')), ib=ORDER.indexOf(b.id.replace(/_\d+$/,'')); return (ia<0?99:ia)-(ib<0?99:ib)||(a.id<b.id?-1:a.id>b.id?1:0); }); return out; }

// ---------- omzetten naar mp3 (alleen als de dienst geen wav aanneemt) ----------
// lamejs 1.2.1 staat ongewijzigd in vendor/lame.min.js (LGPL-3.0) en wordt pas bij de eerste omzetting geladen. Het coderen gebeurt in een worker (blokken 16-bit, per blok een bevestiging),
// zonder worker in de pagina in kleine stukken met een pauze ertussen. De duur van het nummer bepaalt de bitrate (CBR, dus vooraf te schatten).
const LAME_URL='vendor/lame.min.js', CONV_FMT=['wav','flac','ogg'], CONV_IN=200*MB, MP3_CHUNK=1152*16;
const MP3_RATES=[8000,11025,12000,16000,22050,24000,32000,44100,48000];
const MP3_WORKER=`
let enc=null;
onmessage=e=>{ const m=e.data;
  if(m.t==='init'){ try{ enc=new (new Function(m.lame+';return lamejs;')().Mp3Encoder)(m.ch,m.rate,m.kbps); postMessage({t:'ready'}); }catch(x){ postMessage({t:'error',m:String(x&&x.message||x)}); } }
  else if(m.t==='pcm'){ try{ const b=m.r?enc.encodeBuffer(new Int16Array(m.l),new Int16Array(m.r)):enc.encodeBuffer(new Int16Array(m.l)); const u=new Uint8Array(b.length); u.set(b); postMessage({t:'mp3',d:u},[u.buffer]); }catch(x){ postMessage({t:'error',m:String(x&&x.message||x)}); } }
  else if(m.t==='end'){ try{ const b=enc.flush(), u=new Uint8Array(b.length); u.set(b); postMessage({t:'done',d:u},[u.buffer]); }catch(x){ postMessage({t:'error',m:String(x&&x.message||x)}); } }
};`;
let lamePromise=null;
function loadLame(){ if(!lamePromise){ lamePromise=(async()=>{
    let r; try{ r=await fetch(new URL(LAME_URL,document.baseURI).href,{credentials:'omit',referrerPolicy:'no-referrer'}); }catch(e){ throw fail('mp3','load'); }
    if(!r.ok) throw fail('mp3','load'); const t=await r.text(); if(t.length<10000||!t.includes('Mp3Encoder')) throw fail('mp3','load'); return t; })();
    lamePromise.catch(()=>{ lamePromise=null; }); }
  return lamePromise; }
const tick=()=>new Promise(r=>setTimeout(r,0));
function wavRate(u){ if(u.length>=28&&String.fromCharCode(u[0],u[1],u[2],u[3])==='RIFF'){ const r=new DataView(u.buffer,u.byteOffset,u.byteLength).getUint32(24,true); return r>=8000&&r<=96000?r:0; } return 0; }
// het bronbestand decoderen op zijn eigen samplerate (een wav: uit de kop; anders die van de studio), naar kanalen (1 of 2) die lamejs aankan
async function decodeSource(blob,fmt,sig){
  const ab=await blob.arrayBuffer(); if(sig.aborted) throw fail('aborted');
  const want=fmt==='wav'?wavRate(new Uint8Array(ab,0,Math.min(ab.byteLength,64))):0; let oc;
  try{ oc=new OfflineAudioContext(1,1,want||PK.ensureCtx().sampleRate); }catch(e){ try{ oc=new OfflineAudioContext(1,1,PK.ensureCtx().sampleRate); }catch(e2){ throw fail('indecode'); } }
  let buf; try{ buf=await oc.decodeAudioData(ab); }catch(e){ throw fail('indecode'); }
  if(sig.aborted) throw fail('aborted'); if(!buf||!buf.length||!buf.numberOfChannels) throw fail('indecode');
  let rate=buf.sampleRate, chs=[buf.getChannelData(0)]; if(buf.numberOfChannels>1) chs.push(buf.getChannelData(1));
  if(!MP3_RATES.includes(rate)){   // een samplerate die lamejs niet kent (96 kHz, 88,2 kHz, ...): netjes omrekenen
    const to=rate>48000?48000:(MP3_RATES.find(r=>r>=rate)||48000), n=Math.max(1,Math.ceil(buf.length*to/rate)), o2=new OfflineAudioContext(chs.length,n,to), src=o2.createBufferSource();
    src.buffer=buf; src.connect(o2.destination); src.start(); let out; try{ out=await o2.startRendering(); }catch(e){ throw fail('indecode'); }
    rate=to; chs=[out.getChannelData(0)]; if(out.numberOfChannels>1) chs.push(out.getChannelData(1)); if(sig.aborted) throw fail('aborted'); }
  return {rate,chs,frames:chs[0].length}; }
// bitrates van hoog naar laag; de grootste die (met wat marge) onder de grens van de dienst blijft
function ladder(rate,ch){ const a=ch===1?[128,96,64,48,32]:[192,160,128,96,64]; return rate<32000?a.filter(k=>k<=160):a; }
const mp3Limit=maxBytes=>Math.floor(maxBytes*0.97)-16384;
function pickKbps(src,maxBytes){ const sec=src.frames/src.rate, lim=mp3Limit(maxBytes), l=ladder(src.rate,src.chs.length), fit=l.filter(k=>k*125*sec<=lim);
  if(!fit.length) throw fail('mp3big',null,{seconds:Math.round(sec),maxSeconds:Math.max(0,Math.floor(lim/(l[l.length-1]*125)))}); return {sec,fit}; }
const i16=(x,a,b)=>{ const o=new Int16Array(b-a); for(let i=a;i<b;i++){ const v=x[i]; o[i-a]=v!==v||v===Infinity||v===-Infinity?0:v>=1?32767:v<=-1?-32768:Math.round(v*32767); } return o; };
async function encodeMp3(src,kbps,sig,progress){
  const lame=await loadLame(); if(sig.aborted) throw fail('aborted'); const ch=src.chs.length, N=src.frames, parts=[]; let w=null,url='',ac=null;
  try{ if(typeof Worker==='function'){ url=URL.createObjectURL(new Blob([MP3_WORKER],{type:'text/javascript'})); w=new Worker(url); } }catch(e){ w=null; }
  const done=()=>{ if(w){ w.terminate(); w=null; } if(url){ URL.revokeObjectURL(url); url=''; } if(ac){ sig.removeEventListener('abort',ac); ac=null; } };
  try{
    if(w){
      const wait=()=>new Promise((res,rej)=>{ w.onmessage=e=>{ const m=e.data||{}; if(m.t==='error') rej(fail('mp3',String(m.m).slice(0,100))); else { if(m.d&&m.d.length) parts.push(m.d); res(m.t); } }; w.onerror=()=>rej(fail('mp3','worker')); ac=()=>rej(fail('aborted')); sig.addEventListener('abort',ac,{once:true}); });
      const ask=(msg,tr)=>{ const p=wait(); w.postMessage(msg,tr||[]); return p.finally(()=>{ if(ac){ sig.removeEventListener('abort',ac); ac=null; } }); };
      const init=wait(); w.postMessage({t:'init',lame,ch,rate:src.rate,kbps}); await init; if(sig.aborted) throw fail('aborted');
      for(let a=0;a<N;a+=MP3_CHUNK){ if(sig.aborted) throw fail('aborted'); const b=Math.min(N,a+MP3_CHUNK), l=i16(src.chs[0],a,b), r=ch>1?i16(src.chs[1],a,b):null;
        await ask(r?{t:'pcm',l:l.buffer,r:r.buffer}:{t:'pcm',l:l.buffer},r?[l.buffer,r.buffer]:[l.buffer]); progress(b/N); }
      await ask({t:'end'});
    } else {
      let enc; try{ enc=new (new Function(lame+';return lamejs;')().Mp3Encoder)(ch,src.rate,kbps); }catch(e){ throw fail('mp3','init'); }
      for(let a=0;a<N;a+=MP3_CHUNK){ if(sig.aborted) throw fail('aborted'); const b=Math.min(N,a+MP3_CHUNK);
        try{ const o=ch>1?enc.encodeBuffer(i16(src.chs[0],a,b),i16(src.chs[1],a,b)):enc.encodeBuffer(i16(src.chs[0],a,b)); if(o.length){ const u=new Uint8Array(o.length); u.set(o); parts.push(u); } }catch(e){ throw fail('mp3','encode'); }
        progress(b/N); await tick(); }
      try{ const o=enc.flush(); const u=new Uint8Array(o.length); u.set(o); parts.push(u); }catch(e){ throw fail('mp3','encode'); }
    }
  } finally { done(); }
  if(sig.aborted) throw fail('aborted'); return new Blob(parts,{type:'audio/mpeg'}); }
// kiest de bitrate en codeert; valt het resultaat toch te groot uit, dan een trap lager
async function toMp3(src,maxBytes,sig,progress,kbps0){
  const {fit}=pickKbps(src,maxBytes); const start=Math.max(0,fit.indexOf(kbps0)); const list=fit.slice(start);
  for(let i=0;i<list.length;i++){ const b=await encodeMp3(src,list[i],sig,progress); if(b.size<=maxBytes) return {blob:b,kbps:list[i]}; }
  throw fail('mp3big',null,{seconds:Math.round(src.frames/src.rate),maxSeconds:Math.max(0,Math.floor(mp3Limit(maxBytes)/(ladder(src.rate,src.chs.length).slice(-1)[0]*125)))}); }

// ---------- netwerk ----------
const sleep=(ms,sig)=>new Promise((res,rej)=>{ const t=setTimeout(res,ms); sig.addEventListener('abort',()=>{ clearTimeout(t); rej(fail('aborted')); },{once:true}); });
async function http(url,init,sig){
  let r; try{ r=await fetch(url,{...init,signal:sig}); }catch(e){ if(sig.aborted) throw fail(sig.reason&&sig.reason.code==='timeout'?'timeout':'aborted'); throw fail('network',String(e&&e.message||e),{host:new URL(url).host}); }
  if(r.ok) return r;
  let detail=''; try{ const j=JSON.parse((await r.text()).slice(0,4000)); const d=j&&(j.detail!==undefined?j.detail:j.error!==undefined?j.error:j.message); detail=typeof d==='string'?d:d!==undefined?JSON.stringify(d):''; }catch(e){}
  const s=r.status; throw fail(s===401||s===403?'auth':s===402?'credit':s===404?'notfound':s===400||s===422?'input':s===429?'rate':s>=500?'server':'http',detail.slice(0,200),{status:s}); }
async function jsonOf(r){ const t=await r.text(); if(t.length>LIM.jsonBytes) throw fail('response'); try{ const j=JSON.parse(t); if(!j||typeof j!=='object') throw 0; return j; }catch(e){ throw fail('response'); } }
async function bytesOf(url,sig,cap,allowLocal){
  if(!urlOk(url,allowLocal)) throw fail('response','url');
  const r=await http(url,{credentials:'omit',referrerPolicy:'no-referrer'},sig); const cl=+r.headers.get('content-length'); if(cl>cap) throw fail('zip','big');
  const rd=r.body.getReader(), parts=[]; let n=0; for(;;){ const {done,value}=await rd.read(); if(done) break; n+=value.length; if(n>cap){ try{ await rd.cancel(); }catch(e){} throw fail('zip','big'); } parts.push(value); }
  const out=new Uint8Array(n); let o=0; for(const q of parts){ out.set(q,o); o+=q.length; } return out; }
function toDataUri(blob){ return new Promise((res,rej)=>{ const f=new FileReader(); f.onload=()=>res(String(f.result)); f.onerror=()=>rej(fail('read')); f.readAsDataURL(blob); }); }

// de wachtrij: indienen, status pollen, resultaat; sleutel alleen naar het adres van de gekozen dienst
async function queueRun(svc,c,model,dataUri,sig,prog){
  const baseS=svc.id==='custom'?c.base:svc.base, endpoint=svc.id==='custom'?c.endpoint:svc.endpoint, bu=urlOk(baseS,true); if(!bu) throw fail('config');
  const origin=bu.origin, base=bu.href.replace(/\/+$/,''), ep=String(endpoint).replace(/^\/+|\/+$/g,'');
  if(!ep||/[?#\s]/.test(ep)) throw fail('config');
  const hdr={'Authorization':'Key '+c.key,'Content-Type':'application/json','Accept':'application/json'}, same=u=>{ const x=urlOk(u,true); return x&&x.origin===origin?x.href:null; };
  prog({phase:'submit'});
  const sub=await jsonOf(await http(base+'/'+ep,{method:'POST',headers:hdr,body:JSON.stringify(svc.input(dataUri,model)),credentials:'omit',referrerPolicy:'no-referrer'},sig));
  const rid=typeof sub.request_id==='string'&&/^[\w-]{1,100}$/.test(sub.request_id)?sub.request_id:''; if(!rid) throw fail('response','request_id');
  const stUrl=same(sub.status_url)||base+'/'+ep+'/requests/'+rid+'/status', reUrl=same(sub.response_url)||base+'/'+ep+'/requests/'+rid, caUrl=same(sub.cancel_url)||base+'/'+ep+'/requests/'+rid+'/cancel';
  const cancel=()=>{ try{ fetch(caUrl,{method:'PUT',headers:hdr,credentials:'omit',referrerPolicy:'no-referrer',keepalive:true}).catch(()=>{}); }catch(e){} };
  sig.addEventListener('abort',cancel,{once:true});
  for(let i=0;;i++){
    const st=await jsonOf(await http(stUrl,{headers:hdr,credentials:'omit',referrerPolicy:'no-referrer'},sig)), s=String(st.status||'').toUpperCase();
    if(s==='COMPLETED') break;
    if(s==='IN_QUEUE') prog({phase:'queue',queue:Number.isFinite(st.queue_position)?st.queue_position:null}); else if(s==='IN_PROGRESS') prog({phase:'run'}); else throw fail('failed',String(st.error||st.status||'').slice(0,200));
    await sleep(i<10?1500:LIM.pollMax,sig); }
  return jsonOf(await http(reUrl,{headers:hdr,credentials:'omit',referrerPolicy:'no-referrer'},sig)); }

// uitvoer van de dienst: een zip (zip_url) of losse bestanden per stem ({naam:{url}}); optioneel een midi-zip
function parseOut(j){ const out={zip:null,files:[],midi:null};
  if(typeof j.zip_url==='string') out.zip=j.zip_url; if(typeof j.midi_zip_url==='string') out.midi=j.midi_zip_url;
  for(const [k,v] of Object.entries(j)){ if(k==='zip_url'||k==='midi_zip_url') continue; const u=v&&typeof v==='object'&&!Array.isArray(v)?v.url:typeof v==='string'&&AUDIOEXT.test(v.split('?')[0])?v:null; if(typeof u==='string'&&!/midi/i.test(k)) out.files.push({name:k,url:u}); }
  return out; }

const confirmed=new Set();
async function split(inst,o){
  o=o&&typeof o==='object'?o:{}; const id=SERVICES[o.service]?o.service:null; if(!id) throw fail('service');
  const svc=SERVICES[id], conf=cfg().services[id], model=o.model?String(o.model).slice(0,100):modelOf(svc,conf), d=describe(id), sig0=o.signal;
  if(id==='custom'&&!(urlOk(conf.base,true)&&conf.endpoint)) throw fail('config'); if(!conf.key) throw fail('nokey');
  if(id!=='custom'&&!svc.models.some(m=>m.id===model)) throw fail('service');
  let blob=o.audio; if(!(blob instanceof Blob)) throw fail('format');
  if(blob.size<=0) throw fail('format');
  const head=new Uint8Array(await blob.slice(0,16).arrayBuffer()), fmt=sniff(head); if(!fmt) throw fail('format',null,{accept:d.accept,found:fmt});
  // de dienst neemt alleen mp3/m4a aan, maar de invoer is wav/flac/ogg: eerst naar mp3 omzetten (hier uitgezocht, het coderen zelf start na de bevestiging)
  const conv=!d.accept.includes(fmt)&&d.accept.includes('mp3')&&CONV_FMT.includes(fmt);
  if(!conv&&!d.accept.includes(fmt)) throw fail('format',null,{accept:d.accept,found:fmt});
  if(blob.size>(conv?CONV_IN:d.maxBytes)) throw fail('size',null,{max:conv?CONV_IN:d.maxBytes,size:blob.size});
  const prog=p=>{ try{ if(typeof o.onProgress==='function') o.onProgress(p); }catch(e){} };
  const ac=new AbortController(), sig=ac.signal, link=()=>ac.abort(fail('aborted')); if(sig0){ if(sig0.aborted) link(); else sig0.addEventListener('abort',link,{once:true}); }
  let timer=0;
  try{
    let pre=null; if(conv){ prog({phase:'upload'}); const src=await decodeSource(blob,fmt,sig); pre={src,kbps:pickKbps(src,d.maxBytes).fit[0]}; }
    const ck=id+'|'+model; if(!confirmed.has(ck)){
      const price=priceOf(svc,conf,model), host=new URL(id==='custom'?conf.base:svc.base).host;
      const html='<b>'+PK.esc(PK.pkt('m.st_bevestig_titel'))+'</b><br>'+PK.esc(PK.pkt('m.st_bevestig_tekst',d.label,host,money(price)))+(pre?'<br>'+PK.esc(PK.pkt('m.st_bevestig_mp3',pre.kbps)):'')+'<br><br>'+PK.esc(PK.pkt('m.st_bevestig_recht'));
      prog({phase:'confirm'}); const yes=await PK.askUser(html,PK.pkt('m.st_bevestig_ok'),PK.pkt('m.annuleren')); if(!yes) throw fail('declined'); if(sig.aborted) throw fail('aborted'); confirmed.add(ck); }
    timer=setTimeout(()=>{ ac.abort(fail('timeout')); },LIM.timeoutMs);
    if(pre){ prog({phase:'mp3',progress:0}); const r=await toMp3(pre.src,d.maxBytes,sig,f=>prog({phase:'mp3',progress:f}),pre.kbps); blob=r.blob; pre=null; }
    prog({phase:'upload'}); const uri=await toDataUri(blob); if(sig.aborted) throw fail('aborted');
    const res=await queueRun(svc,conf,model,uri,sig,prog), out=parseOut(res), local=id==='custom';
    prog({phase:'download'}); let items=[];
    if(out.zip){ const zb=await bytesOf(out.zip,sig,LIM.zipBytes,local); prog({phase:'unzip'}); items=await readZip(zb); }
    else if(out.files.length){ if(out.files.length>LIM.stems) throw fail('zip','many'); let total=0; for(const f of out.files){ const b=await bytesOf(f.url,sig,LIM.entryBytes,local); total+=b.length; if(total>LIM.totalBytes) throw fail('zip','big'); items.push({name:f.name,base:f.name,data:b}); } }
    else throw fail('response','no-output');
    if(!items.length) throw fail('zip','empty'); if(items.length>LIM.stems) throw fail('zip','many');
    let midi=null; if(out.midi&&svc.midi){ try{ const mb=await bytesOf(out.midi,sig,50*MB,local); midi=new Blob([mb],{type:'application/zip'}); }catch(e){ if(isAbort(e)) throw e; midi=null; } }
    prog({phase:'decode'}); const ctx=PK.ensureCtx(), stems=[];
    for(const it of nameStems(cleanItems(items))){ let buffer; try{ buffer=await ctx.decodeAudioData(it.data.buffer.slice(it.data.byteOffset,it.data.byteOffset+it.data.byteLength)); }catch(e){ throw fail('decode',it.base); } if(sig.aborted) throw fail('aborted'); stems.push({id:it.id,file:it.base,buffer}); }
    return {service:id,model,price:priceOf(svc,conf,model),currency:'USD',stems,midi}; }
  catch(e){ if(sig.aborted) throw sig.reason&&sig.reason.code?sig.reason:fail('aborted'); throw e; }
  finally{ if(timer) clearTimeout(timer); if(sig0) sig0.removeEventListener('abort',link); }
}

// geluid aan een ander apparaat geven dat loadAudio heeft (zoals de knop → apparaat in de tab Samples): het gekozen exemplaar, een bestaand of een nieuw
async function send(inst,o){ o=o&&typeof o==='object'?o:{}; const def=String(o.def||''); if(!/^[a-z0-9.-]{1,80}$/.test(def)||!(o.file instanceof Blob)||!PK.Host.latest(def)) return false;
  const file=o.file instanceof File?o.file:new File([o.file],'audio'), H=PK.Host, sel=PK.selected&&H.devices.get(PK.selected);
  let id=sel&&sel.def.id===def&&PK.selected!==inst._id?PK.selected:null;
  if(!id) for(const [k,r] of H.devices) if(r.def.id===def&&k!==inst._id&&!r.pvw){ id=k; break; }
  if(!id){ const before=new Set(H.devices.keys()); PK.placeNew(def); id=[...H.devices.keys()].find(k=>!before.has(k)); }
  const r=id&&H.devices.get(id); if(!r||!r.inst||typeof r.inst.loadAudio!=='function') return false;
  const i=o.info&&typeof o.info==='object'?o.info:{}, info={name:str(i.name,80)}; const bpm=numOr(i.bpm,20,400,null), bars=numOr(i.bars,0.25,64,null); if(bpm!=null) info.bpm=bpm; if(bars!=null) info.bars=bars;
  try{ await r.inst.loadAudio([file],info); PK.select(id); return true; }catch(e){ return false; } }

// ---------- de aanroep voor apparaten ----------
PK.Host.stems=function(inst,action,opts){
  if(!inst||!inst._id) return action==='services'?[]:Promise.reject(fail('service'));
  switch(String(action)){
    case 'services': return IDS.map(describe);
    case 'settings': try{ PK.openSettings(); const e=PK.$('stemsSet'); if(e&&e.scrollIntoView) e.scrollIntoView({block:'start'}); }catch(e){} return true;
    case 'split': return split(inst,opts);
    case 'send': return send(inst,opts);
    default: return Promise.reject(fail('action'));
  }
};

// ---------- bestanden van internet voor een apparaat: host.fetchFile(inst, url, opts) (nog niet in het contract; een apparaat controleert eerst of de functie bestaat) ----------
// Een apparaat mag geen netwerk gebruiken (contract §15). Deze aanroep haalt één https-bestand op, alleen als het apparaat het na een klik van de gebruiker vraagt: zonder inloggegevens,
// zonder referrer, zonder adressen op het eigen netwerk, met een grens aan de grootte en annuleren via een AbortSignal. opts: { as: 'arraybuffer' | 'text' | 'json', maxBytes, signal, onProgress(ontvangen, totaal) }.
// Fouten hebben een `code`: url, aborted, network (geen verbinding, of de server staat de aanroep vanuit de browser niet toe), http (met status), size, response.
PK.Host.fetchFile=async function(inst,url,opts){
  const fail=(code,extra)=>Object.assign(new Error(code),{code},extra||{});
  if(!inst||!inst._id) throw fail('url');
  opts=opts&&typeof opts==='object'?opts:{};
  let u; try{ u=new URL(String(url)); }catch(e){ throw fail('url'); }
  const h=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.username||u.password||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||/^\d+\.\d+\.\d+\.\d+$/.test(h)||h.indexOf(':')>=0||h.charAt(0)==='[') throw fail('url');
  const as=opts.as==='json'||opts.as==='text'?opts.as:'arraybuffer', max=numOr(opts.maxBytes,1,250*MB,50*MB), sig=typeof AbortSignal!=='undefined'&&opts.signal instanceof AbortSignal?opts.signal:undefined;
  if(sig&&sig.aborted) throw fail('aborted');
  let res; try{ res=await fetch(u.href,{credentials:'omit',referrerPolicy:'no-referrer',redirect:'follow',signal:sig}); }catch(e){ throw fail(sig&&sig.aborted?'aborted':'network'); }
  if(!res.ok) throw fail('http',{status:res.status});
  const total=+res.headers.get('content-length')||0; if(total>max) throw fail('size',{max});
  const chunks=[]; let got=0;
  try{
    if(res.body&&res.body.getReader){ const rd=res.body.getReader();
      for(;;){ const r=await rd.read(); if(r.done) break; got+=r.value.length; if(got>max){ try{ rd.cancel(); }catch(e){} throw fail('size',{max}); } chunks.push(r.value); if(typeof opts.onProgress==='function'){ try{ opts.onProgress(got,total); }catch(e){} } } }
    else { const b=new Uint8Array(await res.arrayBuffer()); if(b.length>max) throw fail('size',{max}); chunks.push(b); got=b.length; }
  }catch(e){ if(e&&e.code) throw e; throw fail(sig&&sig.aborted?'aborted':'network'); }
  const all=new Uint8Array(got); let o=0; for(const c of chunks){ all.set(c,o); o+=c.length; }
  if(as==='arraybuffer') return all.buffer;
  const text=new TextDecoder('utf-8').decode(all);
  if(as==='text') return text;
  try{ return JSON.parse(text); }catch(e){ throw fail('response'); }
};

// ---------- instellingen (Instellingen, onder de AI-assistent) ----------
function mkEl(tag,txt,cls,parent){ const e=document.createElement(tag); if(txt!=null) e.textContent=txt; if(cls) e.className=cls; if(parent) parent.appendChild(e); return e; }
function buildSettings(){ const box=PK.$('stemsSet'); if(!box||box.dataset.built) return; box.dataset.built='1';
  mkEl('div',PK.pkt('ui.st_note'),'note',box).style.marginBottom='6px';
  const fld=(parent,label,input)=>{ const row=mkEl('div',null,'wsrow',parent), l=mkEl('label',null,null,row); mkEl('span',label,null,l); l.append(' ',input); return row; };
  IDS.forEach(id=>{ const svc=SERVICES[id], sec=mkEl('div',null,'stemsvc',box); sec.style.cssText='margin:6px 0;padding:6px 0;border-top:1px solid var(--line)';
    mkEl('b',labelOf(id),null,sec).style.display='block';
    const get=()=>cfg().services[id], put=(k,v)=>{ const c=cfg(); c.services[id][k]=v; save(c); };
    if(id==='custom'){
      const base=mkEl('input',null,'wsurl'); base.type='url'; base.spellcheck=false; base.placeholder='https://…'; base.value=get().base; base.setAttribute('aria-label',PK.pkt('ui.st_base')); base.onchange=()=>put('base',base.value.trim()); fld(sec,PK.pkt('ui.st_base'),base);
      const ep=mkEl('input',null,'wsurl'); ep.type='text'; ep.spellcheck=false; ep.value=get().endpoint; ep.setAttribute('aria-label',PK.pkt('ui.st_endpoint')); ep.onchange=()=>put('endpoint',ep.value.trim()); fld(sec,PK.pkt('ui.st_endpoint'),ep); }
    const key=mkEl('input',null,'wsurl'); key.type='password'; key.autocomplete='off'; key.spellcheck=false; key.value=get().key; key.setAttribute('aria-label',PK.pkt('ui.st_key')); key.onchange=()=>put('key',key.value.trim()); fld(sec,PK.pkt('ui.st_key'),key);
    if(svc.models.length){ const sel=mkEl('select'); sel.setAttribute('aria-label',PK.pkt('ui.st_model'));
      svc.models.forEach(m=>{ const o=mkEl('option',PK.pkt(m.k)+(m.price!=null?' · '+money(m.price):''),null,sel); o.value=m.id; }); sel.value=modelOf(svc,get()); sel.onchange=()=>put('model',sel.value); fld(sec,PK.pkt('ui.st_model'),sel); }
    else { const md=mkEl('input',null,'wsurl'); md.type='text'; md.spellcheck=false; md.value=get().model; md.setAttribute('aria-label',PK.pkt('ui.st_model')); md.onchange=()=>put('model',md.value.trim()); fld(sec,PK.pkt('ui.st_model'),md); }
    const pr=mkEl('input'); pr.type='text'; pr.inputMode='decimal'; pr.size=8; pr.value=get().price==null?'':String(get().price); pr.placeholder=svc.models.length&&svc.models[0].price!=null?'':'?'; pr.setAttribute('aria-label',PK.pkt('ui.st_price'));
    pr.onchange=()=>{ const v=numOr(pr.value,0,1000,null); put('price',v); pr.value=v==null?'':String(v); }; fld(sec,PK.pkt('ui.st_price'),pr);
    if(id==='custom'){ const mx=mkEl('input'); mx.type='text'; mx.inputMode='numeric'; mx.size=5; mx.value=String(get().maxMb); mx.setAttribute('aria-label',PK.pkt('ui.st_maxmb')); mx.onchange=()=>{ const v=numOr(mx.value,1,100,25); put('maxMb',v); mx.value=String(v); }; fld(sec,PK.pkt('ui.st_maxmb'),mx); } });
  const clr=mkEl('button',PK.pkt('ui.st_clear'),'small',mkEl('div',null,'wsrow',box)); clr.type='button';
  clr.onclick=()=>{ const c=cfg(); IDS.forEach(i=>{ c.services[i].key=''; }); save(c); box.querySelectorAll('input[type=password]').forEach(i=>{ i.value=''; }); PK.status(PK.pkt('m.st_sleutels_gewist')); }; }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildSettings); else buildSettings();
})(window.__PK);
