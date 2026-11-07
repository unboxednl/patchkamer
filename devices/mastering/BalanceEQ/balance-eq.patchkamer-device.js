// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Balance EQ met verticale schuiven en 5 tot 12 banden. Drie secties (Frequentie, Gain, Q) met per band een verticale schuif: waarde erboven, bandnummer eronder (klik op het nummer = vergrendelen). Nieuw state-veld `bands` (5..12, standaard 5; zit in de preset) en `layout` (auto/side/stack; zit NIET in de preset). Bands 6..12 zijn bells; boven `bands` zijn ze niet actief en staan ze op hun standaard. Ruimere bereiken: frequentie 20..20000 Hz, gain -18..+18 dB, Q 0,1..20; fijn afstellen met pijltjes (klein), Shift/Page (groot), typen en dubbelklik. params() bevat de regelaars van de actieve banden. Het geluid met `bands:5` is bit-gelijk aan 1.12.2 (DSP: alleen de Q-ondergrens .2 -> .1 en actieve banden 6..12). Oude states en presets zonder `bands` laden als 5 banden.
// 1.12.2 — Alle 17 continue regelaars zijn nu stuurbaar via params/modulate (het apparaat krijgt daarmee een mod-ingang); alles staat standaard uit in Drift. De knopstand, getState, presets, poorten, Masterregie (configureMastering) en het geluid zonder modulatie zijn ongewijzigd; de motor krijgt de gemoduleerde waarde, de state nooit. Bewust niet stuurbaar: de keuzelijsten en vinkjes (dynamic), en 'Auto / suggestion strength' (amount): die regelaar stuurt alleen hoe sterk Volg en Pas voorstel toe de analyse-suggesties overnemen, is geen klankparameter en doet niets zolang Volg uit staat; moduleren zou de volglus (bij Master Chain de gain-integrator) onvoorspelbaar maken en het toepassen van een voorstel laten afhangen van het moment.
// 1.12.0 — contract v1.12: De poort `setup` is nu een mastering-ingang (driehoek, gele gestippelde kabel) in plaats van een modulatie-ingang; de opdrachten van de Master Director komen via host.mastering. Het geluid is ongewijzigd (zelfde DSP, zelfde worklet).
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Balance EQ (nieuwe id, eigen map; voorheen een masteringapparaat met een Nederlandse naam); de motor is sample voor sample gelijk aan het oude bestand.
//          Tweetalig (host.lang: Nederlands en Engels; namen, opties, startprofielen, meldingen en poortnamen per taal). Tekenen via host.frame. Nieuw: getPreset/setPreset (alleen de klank; bypass, A/B-match,
//          Volg, Masterregie-toestemming en vergrendelingen blijven staan). De meldingen uit de DSP zijn codes die de kaart vertaalt.
// Balance EQ: onderdeel van de mastering-apparaten: eigen stereo-DSP (LUFS met K-weging, 4× true peak, spectrum), een analyse van acht seconden die een voorstel doet, en het Masterregie-protocol (Master Director).
// Tekenlus: via host.frame (contract §12b); zonder host.frame een eigen requestAnimationFrame-lus (host.visible bepaalt of de kaart te zien is).
function frameLoop(host, inst, cb, fps) {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
}
const BAND_MIN=5,BAND_MAX=12;
const BAND_F=[90,330,1000,3300,9500,120,450,1500,2600,5000,7500,14000],BAND_Q=[0.707,1,0.8,1,0.707,1,1,1,1,1,1,1];
const SPEC={"key": "eq", "controls": [].concat(...BAND_F.map((f,i)=>[{"id": "f"+(i+1), "value": f, "min": 20, "max": 20000, "unit": "Hz"}, {"id": "g"+(i+1), "value": 0, "min": -18, "max": 18, "unit": "dB"}, {"id": "q"+(i+1), "value": BAND_Q[i], "min": 0.1, "max": 20, "unit": "", "log": true}])).concat([{"id": "dynamic", "value": false, "type": "check"}, {"id": "dynThreshold", "value": -30, "min": -60, "max": -6, "unit": "dB"}, {"id": "dynamicMax", "value": 3, "min": 0, "max": 9, "unit": "dB"}]), "profiles": {"Neutral": {"g1": 0, "g2": 0, "g3": 0, "g4": 0, "g5": 0}, "Warmer": {"g1": 0.7, "g5": -0.7}, "Brighter": {"g1": -0.5, "g5": 1}, "Gentle dynamics": {"dynamic": true, "dynamicMax": 2}}};
const bandN=id=>{const m=/^[fgq](\d+)$/.exec(id);return m?+m[1]:0;};   // bandnummer van een regelaar-id (0 = geen bandregelaar)
const NAME="Balance EQ";
const DESC={"nl": "Vijf tot twaalf parametrische banden met verticale schuiven: low shelf, bells, high shelf. Kleine analysevoorstellen en optionele dynamische banden 2/4.", "en": "Five to twelve parametric bands with vertical faders: low shelf, bells, high shelf. Small analysis suggestions and optional dynamic bands 2/4."};
const LOC=(()=>{const mk=(b,f,g,q)=>{const c={};for(let n=1;n<=BAND_MAX;n++){c['f'+n]=b+n+' '+f;c['g'+n]=b+n+' '+g;c['q'+n]=b+n+' '+q;}return c;};
 return {"nl": {"ctl": {...mk('Band ','frequentie','gain','Q'), "dynamic": "Dynamische banden", "dynThreshold": "Dynamische threshold", "dynamicMax": "Maximale dynamische cut"}, "opt": {}, "prof": {"Neutral": "Neutraal", "Warmer": "Warmer", "Brighter": "Helderder", "Gentle dynamics": "Milde dynamiek"}}, "en": {"ctl": {...mk('Band ','frequency','gain','Q'), "dynamic": "Dynamic bands", "dynThreshold": "Dynamic threshold", "dynamicMax": "Maximum dynamic cut"}, "opt": {}, "prof": {"Neutral": "Neutral", "Warmer": "Warmer", "Brighter": "Brighter", "Gentle dynamics": "Gentle dynamics"}}};})();
const TXT={
 "nl": {
  "ready": "klaar",
  "init": "Initialiseren…",
  "out": "UIT",
  "w_clip": "sampleclipping",
  "w_phase": "controleer mono/fase",
  "w_bal": "L/R-balans > 3 dB",
  "w_limit": "veel limiting: verlaag doel of gain",
  "following": "Volg actief",
  "manual": "Handmatige stand",
  "measured": " s gemeten",
  "compat": "Compatibiliteits-engine",
  "nobypass": "Nood-bypass: DSP niet beschikbaar",
  "usehost": "Gebruik de meegeleverde host of een browser met AudioWorklet/ScriptProcessor.",
  "worklet": "AudioWorklet-engine",
  "profileLabel": "Startprofiel",
  "profilePick": "Kies een startprofiel…",
  "bypass": "Bypass",
  "match": "Match voor A/B",
  "follow": "Volg",
  "remote": "Masterregie toestaan",
  "analyse": "Analyseer 8 s",
  "apply": "Pas voorstel toe",
  "analyseFirst": "Analyseer eerst een representatief fragment.",
  "applied": "Voorstel toegepast; vergrendelde instellingen bleven staan.",
  "resetMeters": "Reset meters",
  "strength": "Auto-/voorstelsterkte",
  "emptyMeter": "Laat audio door het apparaat lopen om te meten.",
  "spectrum": "Ingangsspectrum",
  "proposalHint": "Analyse maakt een voorstel. Volg past alleen ontgrendelde parameters langzaam aan; zet het uit voor vaste instellingen.",
  "lock": "Vast",
  "lockFor": " vergrendelen",
  "secFreq": "Frequentie",
  "secGain": "Gain",
  "secQ": "Q",
  "bandsLabel": "Banden",
  "layoutLabel": "Indeling",
  "layoutAuto": "Automatisch",
  "layoutSide": "Naast elkaar",
  "layoutStack": "Onder elkaar",
  "bandWord": "Band",
  "lockTip": "klik om te vergrendelen",
  "bandsHint": "Band 1 is een low shelf, band 5 een high shelf, de andere banden zijn bells. Klik op een bandnummer om die instelling te vergrendelen (Volg en Masterregie laten haar staan). Pijltjes: kleine stap; Shift of Page: grote stap; dubbelklik: beginwaarde; klik op het getal om te typen.",
  "refFile": "Referentiebestand",
  "refLoaded": "Referentie geladen: ",
  "refClick": " · klik Speel referentie.",
  "refFail": "Kon referentie niet laden: ",
  "playRef": "Speel referentie",
  "loadFirst": "Laad eerst een audiobestand of gebruik de Ref-ingang.",
  "listenMain": "Luister MAIN",
  "listenRef": "Luister REF",
  "stopRef": "Stop referentie",
  "localNote": "Bestanden blijven lokaal. Een geladen referentiebestand wordt niet in presets/werkruimtes opgenomen. Ref-match gebruikt het gemeten niveau van de afgespeelde fragmenten.",
  "learning": "Analyse loopt: speel acht seconden representatieve audio.",
  "suggestion": "Voorstel uit acht seconden analyse; kies Pas voorstel toe.",
  "toolow": "Te weinig audiosignaal voor een voorstel.",
  "portIn": "Stereo in",
  "portSide": "Sidechain",
  "portRef": "Referentie",
  "portOut": "Stereo uit",
  "portSetup": "Masterregie"
 },
 "en": {
  "ready": "ready",
  "init": "Initializing…",
  "out": "OUT",
  "w_clip": "sample clipping",
  "w_phase": "check mono/phase",
  "w_bal": "L/R balance > 3 dB",
  "w_limit": "heavy limiting: lower the target or gain",
  "following": "Follow active",
  "manual": "Manual setting",
  "measured": " s measured",
  "compat": "Compatibility engine",
  "nobypass": "Emergency bypass: DSP not available",
  "usehost": "Use the bundled host or a browser with AudioWorklet/ScriptProcessor.",
  "worklet": "AudioWorklet engine",
  "profileLabel": "Starting profile",
  "profilePick": "Choose a starting profile…",
  "bypass": "Bypass",
  "match": "Match for A/B",
  "follow": "Follow",
  "remote": "Allow Master Director",
  "analyse": "Analyse 8 s",
  "apply": "Apply suggestion",
  "analyseFirst": "First analyse a representative passage.",
  "applied": "Suggestion applied; locked settings were kept.",
  "resetMeters": "Reset meters",
  "strength": "Auto / suggestion strength",
  "emptyMeter": "Play audio through the device to measure.",
  "spectrum": "Input spectrum",
  "proposalHint": "Analysis makes a suggestion. Follow adapts only unlocked parameters slowly; turn it off for fixed settings.",
  "lock": "Lock",
  "lockFor": " lock",
  "secFreq": "Frequency",
  "secGain": "Gain",
  "secQ": "Q",
  "bandsLabel": "Bands",
  "layoutLabel": "Layout",
  "layoutAuto": "Automatic",
  "layoutSide": "Side by side",
  "layoutStack": "Stacked",
  "bandWord": "Band",
  "lockTip": "click to lock",
  "bandsHint": "Band 1 is a low shelf, band 5 a high shelf, the other bands are bells. Click a band number to lock that setting (Follow and Master Director leave it alone). Arrow keys: small step; Shift or Page: large step; double-click: starting value; click the number to type.",
  "refFile": "Reference file",
  "refLoaded": "Reference loaded: ",
  "refClick": " · click Play reference.",
  "refFail": "Could not load the reference: ",
  "playRef": "Play reference",
  "loadFirst": "First load an audio file or use the Ref input.",
  "listenMain": "Listen MAIN",
  "listenRef": "Listen REF",
  "stopRef": "Stop reference",
  "localNote": "Files stay local. A loaded reference file is not saved in presets or workspaces. Ref match uses the measured level of the passages that were played.",
  "learning": "Analysis running: play eight seconds of representative audio.",
  "suggestion": "Suggestion from eight seconds of analysis; choose Apply suggestion.",
  "toolow": "Too little audio signal for a suggestion.",
  "portIn": "Stereo in",
  "portSide": "Sidechain",
  "portRef": "Reference",
  "portOut": "Stereo out",
  "portSetup": "Master Director"
 }
};
// Eigen stereo-DSP. LUFS: K-weging + 400 ms / 75%-overlap / absolute en relatieve gate.
// True peak: 4x windowed-sinc interpolatie; geen claim op formele certificering.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const gain=x=>Math.pow(10,x/20);
const db=x=>20*Math.log10(Math.max(1e-12,x));
const lu=x=>x>1e-12?-.691+10*Math.log10(x):null;
class Biquad{
 constructor(){this.b0=1;this.b1=this.b2=this.a1=this.a2=0;this.z1=this.z2=0;}
 set(b0,b1,b2,a0,a1,a2){this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=a1/a0;this.a2=a2/a0;}
 process(x){const y=this.b0*x+this.z1;this.z1=this.b1*x-this.a1*y+this.z2;this.z2=this.b2*x-this.a2*y;return y;}
 design(type,f,q,d,sr){f=clamp(f,10,sr*.45);const w=2*Math.PI*f/sr,c=Math.cos(w),sn=Math.sin(w),a=sn/(2*Math.max(.1,q)),A=Math.pow(10,d/40),sq=2*Math.sqrt(A)*a;
  if(type==='bell')this.set(1+a*A,-2*c,1-a*A,1+a/A,-2*c,1-a/A);
  else if(type==='low')this.set(A*((A+1)-(A-1)*c+sq),2*A*((A-1)-(A+1)*c),A*((A+1)-(A-1)*c-sq),(A+1)+(A-1)*c+sq,-2*((A-1)+(A+1)*c),(A+1)+(A-1)*c-sq);
  else if(type==='high')this.set(A*((A+1)+(A-1)*c+sq),-2*A*((A-1)+(A+1)*c),A*((A+1)+(A-1)*c-sq),(A+1)-(A-1)*c+sq,2*((A-1)-(A+1)*c),(A+1)-(A-1)*c-sq);
  else if(type==='lp')this.set((1-c)*.5,1-c,(1-c)*.5,1+a,-2*c,1-a);
  else if(type==='hp')this.set((1+c)*.5,-1-c,(1+c)*.5,1+a,-2*c,1-a);
  else if(type==='band')this.set(a,0,-a,1+a,-2*c,1-a);
 }
}
class TruePeak{
 constructor(){this.h=[new Float64Array(32),new Float64Array(32)];this.at=0;this.kernels=[];
  for(let p=1;p<4;p++){const k=new Float64Array(32);let sum=0;for(let j=0;j<32;j++){const x=j-15+p/4,v=Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x),win=.42-.5*Math.cos(2*Math.PI*j/31)+.08*Math.cos(4*Math.PI*j/31);k[j]=v*win;sum+=k[j];}for(let j=0;j<32;j++)k[j]/=sum;this.kernels.push(k);}
 }
 push(l,r){this.h[0][this.at]=l;this.h[1][this.at]=r;let peak=Math.max(Math.abs(l),Math.abs(r));for(let ch=0;ch<2;ch++)for(const k of this.kernels){let v=0;for(let j=0;j<32;j++)v+=this.h[ch][(this.at-j+32)&31]*k[j];peak=Math.max(peak,Math.abs(v));}this.at=(this.at+1)&31;return peak;}
}
class Loudness{
 constructor(sr,truePeak=false){this.sr=sr;this.tp=truePeak?new TruePeak():null;this.pre=[];this.hp=[];
  const K=Math.tan(Math.PI*1681.974450955533/sr),Q=.7071752369554196,Vh=Math.pow(10,3.999843853973347/20),Vb=Math.pow(Vh,.4996667741545416),a0=1+K/Q+K*K;
  const H=Math.tan(Math.PI*38.13547087602444/sr),q=.5003270373238773,h0=1+H/q+H*H;
  for(let c=0;c<2;c++){const b=new Biquad();b.set(Vh+Vb*K/Q+K*K,2*(K*K-Vh),Vh-Vb*K/Q+K*K,a0,2*(K*K-1),1-K/Q+K*K);this.pre.push(b);const hp=new Biquad();hp.set(1,-2,1,1,2*(H*H-1)/h0,(1-H/q+H*H)/h0);this.hp.push(hp);}this.reset();
 }
 reset(){this.sum=0;this.count=0;this.segments=[];this.blocks=[];this.shortBlocks=[];this.totalSegments=0;this.maxPeak=0;this.maxSample=0;this.power=0;this.powerCount=0;this.cross=0;this.ll=0;this.rr=0;this.side=0;this.mid=0;this.momentary=null;this.short=null;this.rms=0;this.correlation=null;this.balance=0;this.sideRatio=0;}
 push(l,r){const a=this.hp[0].process(this.pre[0].process(l)),b=this.hp[1].process(this.pre[1].process(r));this.sum+=a*a+b*b;this.count++;
  this.maxSample=Math.max(this.maxSample,Math.abs(l),Math.abs(r));this.maxPeak=Math.max(this.maxPeak,this.tp?this.tp.push(l,r):Math.abs(l),Math.abs(r));
  this.power+=l*l+r*r;this.powerCount++;this.cross+=l*r;this.ll+=l*l;this.rr+=r*r;this.mid+=(l+r)*(l+r)*.25;this.side+=(l-r)*(l-r)*.25;
  if(this.count>=Math.round(this.sr*.1)){const energy=this.sum/this.count;this.segments.push(energy);if(this.segments.length>30)this.segments.shift();this.totalSegments++;
   if(this.segments.length>=4){let v=0;for(let i=this.segments.length-4;i<this.segments.length;i++)v+=this.segments[i];v/=4;this.momentary=lu(v);if(v>Math.pow(10,(-70+.691)/10))this.blocks.push(v);}
   if(this.segments.length===30){const v=this.segments.reduce((a,b)=>a+b,0)/30;this.short=lu(v);if(this.totalSegments%10===0)this.shortBlocks.push(v);}
   this.rms=Math.sqrt(this.power/(2*Math.max(1,this.powerCount)));this.correlation=this.ll*this.rr>1e-18?clamp(this.cross/Math.sqrt(this.ll*this.rr),-1,1):null;this.balance=db(Math.sqrt((this.ll+1e-18)/(this.rr+1e-18)));this.sideRatio=db(Math.sqrt((this.side+1e-18)/(this.mid+1e-18)));
   this.sum=0;this.count=0;this.power=0;this.powerCount=0;this.cross=this.ll=this.rr=this.side=this.mid=0;
  }
 }
 report(){let integrated=null,lra=null;if(this.blocks.length){const mean=this.blocks.reduce((a,b)=>a+b,0)/this.blocks.length,gate=mean*.1;let n=0,sum=0;for(const v of this.blocks)if(v>=gate){sum+=v;n++;}if(n)integrated=lu(sum/n);}
  if(this.shortBlocks.length>=2){const abs=this.shortBlocks.filter(x=>lu(x)>-70),mean=abs.length?abs.reduce((a,b)=>a+b,0)/abs.length:0,valid=abs.filter(x=>x>mean*.01).map(x=>lu(x)).sort((a,b)=>a-b);if(valid.length>=2){const quantile=p=>{const x=(valid.length-1)*p,i=Math.floor(x);return valid[i]+(valid[Math.min(i+1,valid.length-1)]-valid[i])*(x-i);};lra=quantile(.95)-quantile(.1);}}
  return{m:this.momentary,s:this.short,i:integrated,lra,tp:db(this.maxPeak),samplePeak:db(this.maxSample),rms:db(this.rms),corr:this.correlation,balance:this.balance,side:this.sideRatio,seconds:this.totalSegments*.1};
 }
}
class Spectrum{
 constructor(n=2048){this.n=n;this.l=new Float32Array(n);this.r=new Float32Array(n);this.at=0;this.re=new Float64Array(n);this.im=new Float64Array(n);this.power=new Float64Array(n/2);}
 push(l,r){this.l[this.at]=l;this.r[this.at]=r;this.at=(this.at+1)%this.n;}
 analyse(){const n=this.n;this.power.fill(0);for(const data of [this.l,this.r]){const re=this.re,im=this.im;for(let i=0;i<n;i++){re[i]=data[(this.at+i)%n]*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));im[i]=0;}
   for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){const x=re[i];re[i]=re[j];re[j]=x;}}
   for(let len=2;len<=n;len<<=1){const angle=-2*Math.PI/len,wr0=Math.cos(angle),wi0=Math.sin(angle);for(let start=0;start<n;start+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const a=start+j,b=a+len/2,tr=re[b]*wr-im[b]*wi,ti=re[b]*wi+im[b]*wr;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const nw=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=nw;}}}
   for(let i=0;i<n/2;i++)this.power[i]+=(re[i]*re[i]+im[i]*im[i])/(n*n*.75);
  }return this.power;
 }
}
// Eerste-orde antiderivative antialiasing voor de niet-lineaire trap.
class GentleSaturation{
 constructor(sr){this.sr=sr;this.previous=[0,0];this.previousDrive=[1,1];this.bias=[0,0];this.low=[0,0];this.damp=[0,0];this.dcIn=[0,0];this.dcOut=[0,0];}
 logCosh(x){const a=Math.abs(x);return a+Math.log1p(Math.exp(-2*a))-Math.LN2;}
 process(l,r,p,s){const drive=gain(p.drive),biasTarget=s.character==='tube'?p.color*.32:0,keep=p.protect,coef=1-Math.exp(-2*Math.PI*170/this.sr),lp=1-Math.exp(-2*Math.PI*(2800+p.tone*15000)/this.sr);const out=[0,0];
  for(let ch=0;ch<2;ch++){const x=ch?r:l;this.bias[ch]+=(biasTarget-this.bias[ch])*.001;const bias=this.bias[ch];this.low[ch]+=(x-this.low[ch])*coef;const high=x-this.low[ch]*keep,old=this.previous[ch],difference=high-old;
   let y;if(Math.abs(difference)>1e-7)y=(this.logCosh(drive*high+bias)-this.logCosh(drive*old+bias))/(drive*difference);else y=Math.tanh(drive*(high+old)*.5+bias);
   // DC-afstand en small-signal gaincompensatie; tijdvariërende drive wordt glad toegevoerd.
   y-=Math.tanh(bias);if(s.compensate)y/=drive*Math.max(.7,1-Math.tanh(bias)**2);
   y+=this.low[ch]*keep;this.damp[ch]+=(y-this.damp[ch])*lp;
   const color=s.character==='tape'?p.color*.55:s.character==='soft'?p.color*.15:p.color*.25;y=y*(1-color)+this.damp[ch]*color;
   const pole=Math.exp(-2*Math.PI*12/this.sr),dc=y-this.dcIn[ch]+pole*this.dcOut[ch];this.dcIn[ch]=y;this.dcOut[ch]=dc;this.previous[ch]=high;
   out[ch]=(x*(1-p.mix)+dc*p.mix)*gain(p.trim);
  }return out;
 }
}
class MultiDynamics{
 constructor(sr){this.sr=sr;this.filters=Array.from({length:2},()=>Array.from({length:12},()=>new Biquad()));this.env=[0,0,0];this.reduction=[0,0,0];this.level=[-120,-120,-120];this.output=[0,0];}
 configure(p){const lo=clamp(p.lowSplit,50,this.sr*.15),hi=clamp(Math.max(p.highSplit,lo*2),lo*2,this.sr*.4);
  for(const list of this.filters){for(const [i,type,f]of [[0,'lp',lo],[1,'lp',lo],[2,'hp',lo],[3,'hp',lo],[4,'lp',hi],[5,'lp',hi],[6,'hp',hi],[7,'hp',hi],[8,'lp',hi],[9,'lp',hi],[10,'hp',hi],[11,'hp',hi]])list[i].design(type,f,Math.SQRT1_2,0,this.sr);}
 }
 split(x,ch){const f=this.filters[ch],low=f[1].process(f[0].process(x)),rest=f[3].process(f[2].process(x));return[f[9].process(f[8].process(low))+f[11].process(f[10].process(low)),f[5].process(f[4].process(rest)),f[7].process(f[6].process(rest))];}
 process(l,r,p,s){const a=this.split(l,0),b=this.split(r,1);let left=0,right=0,dryL=0,dryR=0;
  for(let j=0;j<3;j++){const key='b'+(j+1),energy=(a[j]*a[j]+b[j]*b[j])*.5;this.env[j]+=(energy-this.env[j])*(1-Math.exp(-1/(this.sr*.02)));const level=db(Math.sqrt(this.env[j]));this.level[j]=level;
   const ratio=s.mode==='dyneq'?Math.min(2,p[key+'Ratio']):p[key+'Ratio'];let desired=clamp((level-p[key+'Threshold'])*(1-1/Math.max(1,ratio)),0,p[key+'Range']);
   if(!s[key+'On'])desired=0;const coefficient=1-Math.exp(-1/(this.sr*Math.max(.001,desired>this.reduction[j]?p[key+'Attack']:p[key+'Release'])));this.reduction[j]+=(desired-this.reduction[j])*coefficient;
   const g=gain(-this.reduction[j]+(s[key+'On']?p[key+'Gain']:0));left+=a[j]*g;right+=b[j]*g;dryL+=a[j];dryR+=b[j];}
  this.output[0]=(dryL*(1-p.mix)+left*p.mix)*gain(p.trim);this.output[1]=(dryR*(1-p.mix)+right*p.mix)*gain(p.trim);return this.output;
 }
}

class ProcessorEngine{
 constructor(sr,kind){this.sr=sr;this.kind=kind;this.state=null;this.p={};this.proposal=null;this.learning=0;this.learnCount=0;this.learnPower=new Float64Array(1024);this.learnRms=0;this.learnMeter=null;this.learnBandEnergy=new Float64Array(3);this.learnBandPeak=new Float64Array(3);this.learnBandFrames=0;
  this.inputMeter=new Loudness(sr);this.outputMeter=new Loudness(sr,kind==='master'||kind==='control');this.refMeter=new Loudness(sr);this.spectrum=new Spectrum();this.filters=Array.from({length:2},()=>Array.from({length:12},()=>new Biquad()));this.act=[1,1,1,1,1,0,0,0,0,0,0,0];this.detectors=Array.from({length:2},()=>[new Biquad(),new Biquad()]);
  this.saturator=kind==='sat'?new GentleSaturation(sr):null;this.multiband=kind==='multiband'?new MultiDynamics(sr):null;this.spaceHigh=[new Biquad(),new Biquad()];this.spaceSide=new Biquad();this.detEnv=[0,0];this.gr=0;this.env=0;this.makeup=1;this.limiterGain=1;this.tpDetector=kind==='master'?new TruePeak():null;this.look=Math.round(sr*.006);this.lookL=new Float32Array(this.look+1);this.lookR=new Float32Array(this.look+1);this.lookDryL=new Float32Array(this.look+1);this.lookDryR=new Float32Array(this.look+1);this.lookAt=0;this.peakHistory=new Float64Array(this.look+32);this.peakAt=0;this.sampleCount=0;this.tick=0;this.active=1;this.matchGain=1;this.refGain=1;this.mainRefGain=1;this.wetPower=0;this.refSelect=0;this.monitorRef=false;this.osc=0;this.low=[0,0];this.bpm=120;this.closed=false;
  this.delays=Array.from({length:2},()=>new Float32Array(Math.ceil(sr*.3)));this.delayAt=0;this.ap=Array.from({length:8},(_,i)=>({data:new Float32Array(Math.round(sr*([.0043,.0067,.0091,.0137][i%4]+(i>=4?.0009:0)))),pos:0}));this.messages=[];this.statistics=null;this.lastAuto=null;this.autoGain=0;
 }
 set(s){const old=this.state;if(this.kind==='master'&&(!old||old.gain!==s.gain||(!old.auto&&s.auto)))this.autoGain=s.gain;this.state=s;if(Number.isFinite(s.bpm))this.bpm=s.bpm;for(const[k,v]of Object.entries(s))if(typeof v==='number'&&!(k in this.p))this.p[k]=v;}
 event(e){if(e.type==='learn'){this.learning=Math.round(this.sr*8);this.learnCount=0;this.learnPower.fill(0);this.learnRms=0;this.learnMeter=new Loudness(this.sr);this.learnBandEnergy.fill(0);this.learnBandPeak.fill(0);this.learnBandFrames=0;this.messages.push({type:'notice',text:'learning'});}if(e.type==='reset'){this.inputMeter.reset();this.outputMeter.reset();this.refMeter.reset();}if(e.type==='reference')this.monitorRef=!!e.value;}
 suggest(power,report){const s=this.state,proposal={};const ranges=[[25,90],[90,250],[250,800],[800,2500],[2500,7000],[7000,16000]],bands=ranges.map(([lo,hi])=>{let sum=0,n=0;for(let i=Math.max(1,Math.floor(lo*this.spectrum.n/this.sr));i<Math.min(power.length,Math.ceil(hi*this.spectrum.n/this.sr));i++){sum+=power[i];n++;}return 10*Math.log10(Math.max(1e-16,sum/Math.max(1,n)));});
  if(this.kind==='eq'){
   proposal.g1=bands[0]>bands[1]+9?-Math.min(3,(bands[0]-bands[1]-9)*.3):0;
   proposal.g2=clamp(((bands[1]+bands[3])/2-bands[2])*.25,-3,.7);proposal.g3=0;proposal.g4=clamp(((bands[3]+bands[5])/2-bands[4])*.22,-3,.7);proposal.g5=bands[5]>bands[4]+5?-1:0;
   // Zoek een lokaal spectraal uitsteeksel; het voorstel blijft een kleine correctie.
   for(const[b,lo,hi]of [[2,180,1100],[4,1800,6500]]){let best=0,index=0;for(let i=Math.max(5,Math.floor(lo*2048/this.sr));i<Math.min(power.length-5,Math.ceil(hi*2048/this.sr));i++){const around=(power[i-4]+power[i+4]+power[i-3]+power[i+3])*.25,score=10*Math.log10((power[i]+1e-16)/(around+1e-16));if(score>best){best=score;index=i;}}if(best>10){proposal['f'+b]=index*this.sr/2048;proposal['g'+b]=-clamp((best-8)*.12,.5,2.5);proposal['q'+b]=2.2;}}
   proposal.dynThreshold=clamp(report.rms-8,-55,-12);
  }else if(this.kind==='comp'){const crest=report.samplePeak-report.rms;proposal.threshold=clamp(report.rms-1,-40,-8);proposal.ratio=crest>13?3:1.8;proposal.attack=crest>13?.012:.03;proposal.release=clamp(60/this.bpm*.45,.08,.45);}
  else if(this.kind==='master'){const target=s.target,measured=report.i??report.s??report.m;proposal.gain=measured===null?0:clamp(target-measured,-12,18);proposal.threshold=clamp(report.rms+2,-32,-10);proposal.ratio=s.profile==='club'?2.2:1.5;proposal.attack=.025;proposal.release=.24;proposal.low=bands[0]>bands[1]+10?-1:0;proposal.mid=clamp(((bands[1]+bands[3])/2-bands[2])*.12,-1.5,.5);proposal.high=s.profile==='warm'?-.6:0;}
  else if(this.kind==='space'){const c=report.corr??1;proposal.width=c<.1?.95:c>.8?1.45:1.15;proposal.mix=c<0?.08:.26;proposal.depth=c>.7?.55:.35;proposal.fullness=.3;}
  else if(this.kind==='sat'){const crest=report.samplePeak-report.rms;proposal.drive=clamp(8-crest*.35,.5,6);proposal.mix=clamp(.4-crest*.008,.15,.35);proposal.color=.35;proposal.protect=.7;}
  else if(this.kind==='multiband'){for(let j=0;j<3;j++){const k='b'+(j+1),level=power===this.learnPower&&this.learnBandFrames?db(Math.sqrt(this.learnBandEnergy[j]/this.learnBandFrames)):this.multiband.level[j];proposal[k+'Threshold']=clamp(level-3,-50,-8);proposal[k+'Ratio']=[1.8,1.5,1.6][j];proposal[k+'Range']=Math.min(this.state[k+'Range'],3);proposal[k+'Release']=[.28,.18,.12][j];}}
  else if(this.kind==='control'){proposal.dim=report.samplePeak>-.5?-3:0;}
  return proposal;
 }
 blockControl(){
  const s=this.state;const power=this.spectrum.analyse(),report=this.inputMeter.report();
  if(this.learning>0){for(let i=0;i<power.length;i++)this.learnPower[i]+=power[i];this.learnCount++;this.learnRms+=Math.pow(10,report.rms/10);}
  if(s.auto&&report.rms>-65){this.lastAuto=this.suggest(power,report);if(this.kind==='master'&&!s.bypass&&!s.match&&!s.locks?.gain&&s.amount>0){const recent=this.outputMeter.short??this.outputMeter.momentary;if(recent!==null)this.autoGain=clamp(this.autoGain+clamp((s.target-recent)*.1*s.amount,-.35,.35),-12,18);}}
  this.statistics={input:report,output:this.outputMeter.report(),reference:this.refMeter.report(),gr:this.gr,limiter:db(this.limiterGain),engine:'DSP',proposal:this.proposal,bandGR:this.multiband?[...this.multiband.reduction]:null,bandLevels:this.multiband?[...this.multiband.level]:null,spectrum:[...power].filter((v,i)=>i%8===0).map(x=>10*Math.log10(Math.max(1e-15,x)))};
  this.messages.push({type:'stats',data:this.statistics});
 }
 coefficients(){
  const s=this.state,p=this.p;
  const locks=s.locks||{};
  for(const[k,v]of Object.entries(s))if(typeof v==='number'){let target=v;if(s.auto&&this.lastAuto&&Number.isFinite(this.lastAuto[k])&&!locks[k])target=this.kind==='master'&&k==='gain'&&s.amount>0?this.autoGain:v+(this.lastAuto[k]-v)*s.amount;const smooth=['ceiling','amount'].includes(k)?.25:.035;p[k]+=(target-p[k])*smooth;}
  if(this.multiband)this.multiband.configure(p);
  // Balance EQ: banden 1-5 altijd; 6..bands erbij; een verwijderde band blijft doorlopen tot zijn gain is uitgegleden (geen klik).
  if(this.kind==='eq'){const nb=Math.max(5,Math.min(12,Math.round(Number.isFinite(s.bands)?s.bands:5)));for(let j=0;j<12;j++)this.act[j]=j<nb||Math.abs(p['g'+(j+1)]||0)>.0005?1:0;}
  for(let ch=0;ch<2;ch++){
   if(this.kind==='eq'){for(let j=0;j<12;j++){if(!this.act[j])continue;let g=p['g'+(j+1)];if(s.dynamic&&(j===1||j===3)){const detector=db(Math.sqrt(this.detEnv[j===1?0:1]));g-=clamp((detector-p.dynThreshold)*.4,0,p.dynamicMax);}this.filters[ch][j].design(j===0?'low':j===4?'high':'bell',p['f'+(j+1)],p['q'+(j+1)],g,this.sr);}this.detectors[ch][0].design('band',p.f2,2,0,this.sr);this.detectors[ch][1].design('band',p.f4,2,0,this.sr);}
   else if(this.kind==='space'){this.spaceHigh[ch].design('hp',p.bass,.707,0,this.sr);if(ch===0)this.spaceSide.design('hp',p.bass,.707,0,this.sr);}
   else if(this.kind==='master'){this.filters[ch][0].design('low',100,.707,p.low,this.sr);this.filters[ch][1].design('bell',700,.8,p.mid,this.sr);this.filters[ch][2].design('high',7000,.707,p.high,this.sr);}
  }
 }
 compress(l,r,sideL,sideR){const p=this.p,s=this.state;const det=s.detector==='side'?Math.max(Math.abs(sideL),Math.abs(sideR)):Math.max(Math.abs(l),Math.abs(r));this.env+=(det-this.env)*(det>this.env?1-Math.exp(-1/(this.sr*.001)):1-Math.exp(-1/(this.sr*.045)));
  const over=db(this.env)-p.threshold,knee=p.knee??6,ratio=p.ratio;let desired=0;if(over>knee/2)desired=over*(1-1/ratio);else if(over> -knee/2)desired=(over+knee/2)**2/(2*Math.max(.01,knee))*(1-1/ratio);
  const alpha=1-Math.exp(-1/(this.sr*Math.max(.0005,desired>this.gr?p.attack:p.release)));this.gr+=(desired-this.gr)*alpha;
  const g=gain(-this.gr+(p.makeup||0)),mix=p.compMix??1;return[l*(1-mix)+l*g*mix,r*(1-mix)+r*g*mix];
 }
 spatial(l,r){const p=this.p,s=this.state;const coeff=1-Math.exp(-2*Math.PI*p.bass/this.sr);this.low[0]+=coeff*(l-this.low[0]);this.low[1]+=coeff*(r-this.low[1]);const lowMid=(this.low[0]+this.low[1])*.5;
  this.osc+=2*Math.PI*(.04+p.motion*.25)/this.sr;if(this.osc>2*Math.PI)this.osc-=2*Math.PI;
  this.delays[0][this.delayAt]=this.spaceHigh[0].process(l);this.delays[1][this.delayAt]=this.spaceHigh[1].process(r);
  const read=(buffer,delay)=>{let x=this.delayAt-delay;while(x<0)x+=buffer.length;const i=Math.floor(x),f=x-i;return buffer[i]*(1-f)+buffer[(i+1)%buffer.length]*f;};
  let wetL=read(this.delays[0],this.sr*(.009+p.depth*.035+Math.sin(this.osc)*p.motion*.0007)),wetR=read(this.delays[1],this.sr*(.015+p.depth*.047+Math.sin(this.osc+1.4)*p.motion*.0007));this.delayAt=(this.delayAt+1)%this.delays[0].length;
  for(let j=0;j<8;j++){const ap=this.ap[j],x=j<4?wetL:wetR,delayed=ap.data[ap.pos],y=delayed-x*.57;ap.data[ap.pos]=x+y*.57;ap.pos=(ap.pos+1)%ap.data.length;if(j<4)wetL=y;else wetR=y;}
  // Verwijder laag uit reflecties; houd het originele midden herkenbaar.
  const highL=l-this.low[0],highR=r-this.low[1],mid=(highL+highR)*.5,side=(highL-highR)*.5;
  const correlation=this.outputMeter.correlation;const protect=s.guard&&correlation!==null?clamp((correlation+.15)/.6,0,1):1;
  const width=1+(p.width-1)*protect;const lowL=s.monoBass?lowMid:this.low[0],lowR=s.monoBass?lowMid:this.low[1];
  const processedL=lowL+mid+side*width+(wetL-wetR*.25)*p.fullness*protect,processedR=lowR+mid-side*width+(wetR-wetL*.25)*p.fullness*protect;
  let a=l*(1-p.mix)+processedL*p.mix,b=r*(1-p.mix)+processedR*p.mix;const m=(a+b)*.5,sideHigh=this.spaceSide.process((a-b)*.5);if(s.monoBass){a=m+sideHigh;b=m-sideHigh;}return[a,b];
 }
 limit(l,r,dryL,dryR){const p=this.p,det=this.tpDetector.push(l,r),window=this.peakHistory;window[this.peakAt]=det;
  // Een monotone piek-envelop: onmiddellijk omlaag, traag omhoog, met 6 ms audiovoorraad.
  if(!this.peakHold||det>=this.peakHold){this.peakHold=det;this.holdLeft=this.look+20;}else if(--this.holdLeft<=0){this.peakHold=0;for(const v of window)this.peakHold=Math.max(this.peakHold,v);this.holdLeft=32;}
  this.peakAt=(this.peakAt+1)%window.length;
  const ceiling=gain(p.ceiling-.9),wanted=Math.min(1,ceiling/Math.max(1e-12,this.peakHold));this.limiterGain+=(wanted-this.limiterGain)*(wanted<this.limiterGain?.5:1-Math.exp(-1/(this.sr*.12)));
  const at=this.lookAt,ol=this.lookL[at],or=this.lookR[at],dl=this.lookDryL[at],dr=this.lookDryR[at];this.lookL[at]=l;this.lookR[at]=r;this.lookDryL[at]=dryL;this.lookDryR[at]=dryR;this.lookAt=(at+1)%this.lookL.length;
  return[ol*this.limiterGain,or*this.limiterGain,dl,dr];
 }
 render(l,r,inL,inR,auxL=null,auxR=null){
  if(this.closed||!this.state){l.fill(0);r.fill(0);return;}const s=this.state,p=this.p;
  for(let i=0;i<l.length;i++){
   const il=Number.isFinite(inL&&inL[i])?clamp(inL[i],-32,32):0,ir=Number.isFinite(inR&&inR[i])?clamp(inR[i],-32,32):il,al=Number.isFinite(auxL&&auxL[i])?clamp(auxL[i],-32,32):0,ar=Number.isFinite(auxR&&auxR[i])?clamp(auxR[i],-32,32):al;
   if(!(this.tick++%128))this.coefficients();this.inputMeter.push(il,ir);if(this.learning>0&&this.learnMeter)this.learnMeter.push(il,ir);this.refMeter.push(al,ar);this.spectrum.push(il,ir);
   let x=il,y=ir,dl=il,dr=ir;
   if(this.kind==='eq'){for(let ch=0;ch<2;ch++)for(let j=0;j<2;j++){const z=this.detectors[ch][j].process(ch?ir:il);this.detEnv[j]+=(z*z-this.detEnv[j])*.001;}
    for(let j=0;j<12;j++)if(this.act[j]){x=this.filters[0][j].process(x);y=this.filters[1][j].process(y);}}
   if(this.kind==='sat')[x,y]=this.saturator.process(x,y,p,s);
   if(this.kind==='multiband'){[x,y]=this.multiband.process(x,y,p,s);if(this.learning>0){for(let j=0;j<3;j++){this.learnBandEnergy[j]+=this.multiband.env[j];this.learnBandPeak[j]=Math.max(this.learnBandPeak[j],this.multiband.env[j]);}this.learnBandFrames++;}}
   if(this.kind==='comp')[x,y]=this.compress(x,y,al,ar);
   if(this.kind==='space')[x,y]=this.spatial(x,y);
   if(this.kind==='master'){
    x*=gain(p.gain);y*=gain(p.gain);if(s.eq)for(let j=0;j<3;j++){x=this.filters[0][j].process(x);y=this.filters[1][j].process(y);}if(s.compress)[x,y]=this.compress(x,y,0,0);
    if(s.limit)[x,y,dl,dr]=this.limit(x,y,il,ir);
   }
   if(this.kind==='control'){
    const a=this.inputMeter.short??this.inputMeter.momentary,b=this.refMeter.short??this.refMeter.momentary;const refTarget=s.refMatch&&a!==null&&b!==null?Math.min(1,gain(clamp(a-b,-12,12))):1,mainTarget=s.refMatch&&a!==null&&b!==null?Math.min(1,gain(clamp(b-a,-12,12))):1;this.refGain+=(refTarget-this.refGain)*.0001;this.mainRefGain+=(mainTarget-this.mainRefGain)*.0001;this.refSelect+=((this.monitorRef?1:0)-this.refSelect)*.001;
    x=il*this.mainRefGain*(1-this.refSelect)+al*this.refGain*this.refSelect;y=ir*this.mainRefGain*(1-this.refSelect)+ar*this.refGain*this.refSelect;
    if(s.monitor==='mono')x=y=(x+y)*.5;else if(s.monitor==='left')y=x;else if(s.monitor==='right')x=y;else if(s.monitor==='side'){x=(x-y)*.5;y=x;}x*=gain(p.dim);y*=gain(p.dim);
   }
   // Optionele A/B-matching verlaagt alleen de luidere variant; nooit een verborgen boost.
   const inPower=this.inputMeter.rms*this.inputMeter.rms,outPower=this.wetPower;this.wetPower+=(((x*x+y*y)*.5)-this.wetPower)*.0001;
   const match=s.match?Math.min(1,Math.sqrt((inPower+1e-12)/(outPower+1e-12))):1;this.matchGain+=(match-this.matchGain)*.00005;x*=this.matchGain;y*=this.matchGain;
   const dryMatch=s.match?Math.min(1,Math.sqrt((outPower+1e-12)/(inPower+1e-12))):1;this.active+=((s.bypass?0:1)-this.active)*.002;l[i]=x*this.active+dl*dryMatch*(1-this.active);r[i]=y*this.active+dr*dryMatch*(1-this.active);this.outputMeter.push(l[i],r[i]);
   this.sampleCount++;if(this.learning>0&&--this.learning===0){if(this.learnCount&&this.learnMeter&&this.learnMeter.report().i!==null){this.proposal=this.suggest(this.learnPower,this.learnMeter.report());this.messages.push({type:'proposal',values:this.proposal,text:'suggestion'});}else this.messages.push({type:'notice',text:'toolow'});}
   if(this.sampleCount%Math.round(this.sr*.25)===0)this.blockControl();
  }
 }
}

const DSP_SOURCE="// Eigen stereo-DSP. LUFS: K-weging + 400 ms / 75%-overlap / absolute en relatieve gate.\n// True peak: 4x windowed-sinc interpolatie; geen claim op formele certificering.\nconst clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\nconst gain=x=>Math.pow(10,x/20);\nconst db=x=>20*Math.log10(Math.max(1e-12,x));\nconst lu=x=>x>1e-12?-.691+10*Math.log10(x):null;\nclass Biquad{\n constructor(){this.b0=1;this.b1=this.b2=this.a1=this.a2=0;this.z1=this.z2=0;}\n set(b0,b1,b2,a0,a1,a2){this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=a1/a0;this.a2=a2/a0;}\n process(x){const y=this.b0*x+this.z1;this.z1=this.b1*x-this.a1*y+this.z2;this.z2=this.b2*x-this.a2*y;return y;}\n design(type,f,q,d,sr){f=clamp(f,10,sr*.45);const w=2*Math.PI*f/sr,c=Math.cos(w),sn=Math.sin(w),a=sn/(2*Math.max(.1,q)),A=Math.pow(10,d/40),sq=2*Math.sqrt(A)*a;\n  if(type==='bell')this.set(1+a*A,-2*c,1-a*A,1+a/A,-2*c,1-a/A);\n  else if(type==='low')this.set(A*((A+1)-(A-1)*c+sq),2*A*((A-1)-(A+1)*c),A*((A+1)-(A-1)*c-sq),(A+1)+(A-1)*c+sq,-2*((A-1)+(A+1)*c),(A+1)+(A-1)*c-sq);\n  else if(type==='high')this.set(A*((A+1)+(A-1)*c+sq),-2*A*((A-1)+(A+1)*c),A*((A+1)+(A-1)*c-sq),(A+1)-(A-1)*c+sq,2*((A-1)-(A+1)*c),(A+1)-(A-1)*c-sq);\n  else if(type==='lp')this.set((1-c)*.5,1-c,(1-c)*.5,1+a,-2*c,1-a);\n  else if(type==='hp')this.set((1+c)*.5,-1-c,(1+c)*.5,1+a,-2*c,1-a);\n  else if(type==='band')this.set(a,0,-a,1+a,-2*c,1-a);\n }\n}\nclass TruePeak{\n constructor(){this.h=[new Float64Array(32),new Float64Array(32)];this.at=0;this.kernels=[];\n  for(let p=1;p<4;p++){const k=new Float64Array(32);let sum=0;for(let j=0;j<32;j++){const x=j-15+p/4,v=Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x),win=.42-.5*Math.cos(2*Math.PI*j/31)+.08*Math.cos(4*Math.PI*j/31);k[j]=v*win;sum+=k[j];}for(let j=0;j<32;j++)k[j]/=sum;this.kernels.push(k);}\n }\n push(l,r){this.h[0][this.at]=l;this.h[1][this.at]=r;let peak=Math.max(Math.abs(l),Math.abs(r));for(let ch=0;ch<2;ch++)for(const k of this.kernels){let v=0;for(let j=0;j<32;j++)v+=this.h[ch][(this.at-j+32)&31]*k[j];peak=Math.max(peak,Math.abs(v));}this.at=(this.at+1)&31;return peak;}\n}\nclass Loudness{\n constructor(sr,truePeak=false){this.sr=sr;this.tp=truePeak?new TruePeak():null;this.pre=[];this.hp=[];\n  const K=Math.tan(Math.PI*1681.974450955533/sr),Q=.7071752369554196,Vh=Math.pow(10,3.999843853973347/20),Vb=Math.pow(Vh,.4996667741545416),a0=1+K/Q+K*K;\n  const H=Math.tan(Math.PI*38.13547087602444/sr),q=.5003270373238773,h0=1+H/q+H*H;\n  for(let c=0;c<2;c++){const b=new Biquad();b.set(Vh+Vb*K/Q+K*K,2*(K*K-Vh),Vh-Vb*K/Q+K*K,a0,2*(K*K-1),1-K/Q+K*K);this.pre.push(b);const hp=new Biquad();hp.set(1,-2,1,1,2*(H*H-1)/h0,(1-H/q+H*H)/h0);this.hp.push(hp);}this.reset();\n }\n reset(){this.sum=0;this.count=0;this.segments=[];this.blocks=[];this.shortBlocks=[];this.totalSegments=0;this.maxPeak=0;this.maxSample=0;this.power=0;this.powerCount=0;this.cross=0;this.ll=0;this.rr=0;this.side=0;this.mid=0;this.momentary=null;this.short=null;this.rms=0;this.correlation=null;this.balance=0;this.sideRatio=0;}\n push(l,r){const a=this.hp[0].process(this.pre[0].process(l)),b=this.hp[1].process(this.pre[1].process(r));this.sum+=a*a+b*b;this.count++;\n  this.maxSample=Math.max(this.maxSample,Math.abs(l),Math.abs(r));this.maxPeak=Math.max(this.maxPeak,this.tp?this.tp.push(l,r):Math.abs(l),Math.abs(r));\n  this.power+=l*l+r*r;this.powerCount++;this.cross+=l*r;this.ll+=l*l;this.rr+=r*r;this.mid+=(l+r)*(l+r)*.25;this.side+=(l-r)*(l-r)*.25;\n  if(this.count>=Math.round(this.sr*.1)){const energy=this.sum/this.count;this.segments.push(energy);if(this.segments.length>30)this.segments.shift();this.totalSegments++;\n   if(this.segments.length>=4){let v=0;for(let i=this.segments.length-4;i<this.segments.length;i++)v+=this.segments[i];v/=4;this.momentary=lu(v);if(v>Math.pow(10,(-70+.691)/10))this.blocks.push(v);}\n   if(this.segments.length===30){const v=this.segments.reduce((a,b)=>a+b,0)/30;this.short=lu(v);if(this.totalSegments%10===0)this.shortBlocks.push(v);}\n   this.rms=Math.sqrt(this.power/(2*Math.max(1,this.powerCount)));this.correlation=this.ll*this.rr>1e-18?clamp(this.cross/Math.sqrt(this.ll*this.rr),-1,1):null;this.balance=db(Math.sqrt((this.ll+1e-18)/(this.rr+1e-18)));this.sideRatio=db(Math.sqrt((this.side+1e-18)/(this.mid+1e-18)));\n   this.sum=0;this.count=0;this.power=0;this.powerCount=0;this.cross=this.ll=this.rr=this.side=this.mid=0;\n  }\n }\n report(){let integrated=null,lra=null;if(this.blocks.length){const mean=this.blocks.reduce((a,b)=>a+b,0)/this.blocks.length,gate=mean*.1;let n=0,sum=0;for(const v of this.blocks)if(v>=gate){sum+=v;n++;}if(n)integrated=lu(sum/n);}\n  if(this.shortBlocks.length>=2){const abs=this.shortBlocks.filter(x=>lu(x)>-70),mean=abs.length?abs.reduce((a,b)=>a+b,0)/abs.length:0,valid=abs.filter(x=>x>mean*.01).map(x=>lu(x)).sort((a,b)=>a-b);if(valid.length>=2){const quantile=p=>{const x=(valid.length-1)*p,i=Math.floor(x);return valid[i]+(valid[Math.min(i+1,valid.length-1)]-valid[i])*(x-i);};lra=quantile(.95)-quantile(.1);}}\n  return{m:this.momentary,s:this.short,i:integrated,lra,tp:db(this.maxPeak),samplePeak:db(this.maxSample),rms:db(this.rms),corr:this.correlation,balance:this.balance,side:this.sideRatio,seconds:this.totalSegments*.1};\n }\n}\nclass Spectrum{\n constructor(n=2048){this.n=n;this.l=new Float32Array(n);this.r=new Float32Array(n);this.at=0;this.re=new Float64Array(n);this.im=new Float64Array(n);this.power=new Float64Array(n/2);}\n push(l,r){this.l[this.at]=l;this.r[this.at]=r;this.at=(this.at+1)%this.n;}\n analyse(){const n=this.n;this.power.fill(0);for(const data of [this.l,this.r]){const re=this.re,im=this.im;for(let i=0;i<n;i++){re[i]=data[(this.at+i)%n]*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));im[i]=0;}\n   for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){const x=re[i];re[i]=re[j];re[j]=x;}}\n   for(let len=2;len<=n;len<<=1){const angle=-2*Math.PI/len,wr0=Math.cos(angle),wi0=Math.sin(angle);for(let start=0;start<n;start+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const a=start+j,b=a+len/2,tr=re[b]*wr-im[b]*wi,ti=re[b]*wi+im[b]*wr;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const nw=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=nw;}}}\n   for(let i=0;i<n/2;i++)this.power[i]+=(re[i]*re[i]+im[i]*im[i])/(n*n*.75);\n  }return this.power;\n }\n}\n// Eerste-orde antiderivative antialiasing voor de niet-lineaire trap.\nclass GentleSaturation{\n constructor(sr){this.sr=sr;this.previous=[0,0];this.previousDrive=[1,1];this.bias=[0,0];this.low=[0,0];this.damp=[0,0];this.dcIn=[0,0];this.dcOut=[0,0];}\n logCosh(x){const a=Math.abs(x);return a+Math.log1p(Math.exp(-2*a))-Math.LN2;}\n process(l,r,p,s){const drive=gain(p.drive),biasTarget=s.character==='tube'?p.color*.32:0,keep=p.protect,coef=1-Math.exp(-2*Math.PI*170/this.sr),lp=1-Math.exp(-2*Math.PI*(2800+p.tone*15000)/this.sr);const out=[0,0];\n  for(let ch=0;ch<2;ch++){const x=ch?r:l;this.bias[ch]+=(biasTarget-this.bias[ch])*.001;const bias=this.bias[ch];this.low[ch]+=(x-this.low[ch])*coef;const high=x-this.low[ch]*keep,old=this.previous[ch],difference=high-old;\n   let y;if(Math.abs(difference)>1e-7)y=(this.logCosh(drive*high+bias)-this.logCosh(drive*old+bias))/(drive*difference);else y=Math.tanh(drive*(high+old)*.5+bias);\n   // DC-afstand en small-signal gaincompensatie; tijdvari\u00ebrende drive wordt glad toegevoerd.\n   y-=Math.tanh(bias);if(s.compensate)y/=drive*Math.max(.7,1-Math.tanh(bias)**2);\n   y+=this.low[ch]*keep;this.damp[ch]+=(y-this.damp[ch])*lp;\n   const color=s.character==='tape'?p.color*.55:s.character==='soft'?p.color*.15:p.color*.25;y=y*(1-color)+this.damp[ch]*color;\n   const pole=Math.exp(-2*Math.PI*12/this.sr),dc=y-this.dcIn[ch]+pole*this.dcOut[ch];this.dcIn[ch]=y;this.dcOut[ch]=dc;this.previous[ch]=high;\n   out[ch]=(x*(1-p.mix)+dc*p.mix)*gain(p.trim);\n  }return out;\n }\n}\nclass MultiDynamics{\n constructor(sr){this.sr=sr;this.filters=Array.from({length:2},()=>Array.from({length:12},()=>new Biquad()));this.env=[0,0,0];this.reduction=[0,0,0];this.level=[-120,-120,-120];this.output=[0,0];}\n configure(p){const lo=clamp(p.lowSplit,50,this.sr*.15),hi=clamp(Math.max(p.highSplit,lo*2),lo*2,this.sr*.4);\n  for(const list of this.filters){for(const [i,type,f]of [[0,'lp',lo],[1,'lp',lo],[2,'hp',lo],[3,'hp',lo],[4,'lp',hi],[5,'lp',hi],[6,'hp',hi],[7,'hp',hi],[8,'lp',hi],[9,'lp',hi],[10,'hp',hi],[11,'hp',hi]])list[i].design(type,f,Math.SQRT1_2,0,this.sr);}\n }\n split(x,ch){const f=this.filters[ch],low=f[1].process(f[0].process(x)),rest=f[3].process(f[2].process(x));return[f[9].process(f[8].process(low))+f[11].process(f[10].process(low)),f[5].process(f[4].process(rest)),f[7].process(f[6].process(rest))];}\n process(l,r,p,s){const a=this.split(l,0),b=this.split(r,1);let left=0,right=0,dryL=0,dryR=0;\n  for(let j=0;j<3;j++){const key='b'+(j+1),energy=(a[j]*a[j]+b[j]*b[j])*.5;this.env[j]+=(energy-this.env[j])*(1-Math.exp(-1/(this.sr*.02)));const level=db(Math.sqrt(this.env[j]));this.level[j]=level;\n   const ratio=s.mode==='dyneq'?Math.min(2,p[key+'Ratio']):p[key+'Ratio'];let desired=clamp((level-p[key+'Threshold'])*(1-1/Math.max(1,ratio)),0,p[key+'Range']);\n   if(!s[key+'On'])desired=0;const coefficient=1-Math.exp(-1/(this.sr*Math.max(.001,desired>this.reduction[j]?p[key+'Attack']:p[key+'Release'])));this.reduction[j]+=(desired-this.reduction[j])*coefficient;\n   const g=gain(-this.reduction[j]+(s[key+'On']?p[key+'Gain']:0));left+=a[j]*g;right+=b[j]*g;dryL+=a[j];dryR+=b[j];}\n  this.output[0]=(dryL*(1-p.mix)+left*p.mix)*gain(p.trim);this.output[1]=(dryR*(1-p.mix)+right*p.mix)*gain(p.trim);return this.output;\n }\n}\n\nclass ProcessorEngine{\n constructor(sr,kind){this.sr=sr;this.kind=kind;this.state=null;this.p={};this.proposal=null;this.learning=0;this.learnCount=0;this.learnPower=new Float64Array(1024);this.learnRms=0;this.learnMeter=null;this.learnBandEnergy=new Float64Array(3);this.learnBandPeak=new Float64Array(3);this.learnBandFrames=0;\n  this.inputMeter=new Loudness(sr);this.outputMeter=new Loudness(sr,kind==='master'||kind==='control');this.refMeter=new Loudness(sr);this.spectrum=new Spectrum();this.filters=Array.from({length:2},()=>Array.from({length:12},()=>new Biquad()));this.act=[1,1,1,1,1,0,0,0,0,0,0,0];this.detectors=Array.from({length:2},()=>[new Biquad(),new Biquad()]);\n  this.saturator=kind==='sat'?new GentleSaturation(sr):null;this.multiband=kind==='multiband'?new MultiDynamics(sr):null;this.spaceHigh=[new Biquad(),new Biquad()];this.spaceSide=new Biquad();this.detEnv=[0,0];this.gr=0;this.env=0;this.makeup=1;this.limiterGain=1;this.tpDetector=kind==='master'?new TruePeak():null;this.look=Math.round(sr*.006);this.lookL=new Float32Array(this.look+1);this.lookR=new Float32Array(this.look+1);this.lookDryL=new Float32Array(this.look+1);this.lookDryR=new Float32Array(this.look+1);this.lookAt=0;this.peakHistory=new Float64Array(this.look+32);this.peakAt=0;this.sampleCount=0;this.tick=0;this.active=1;this.matchGain=1;this.refGain=1;this.mainRefGain=1;this.wetPower=0;this.refSelect=0;this.monitorRef=false;this.osc=0;this.low=[0,0];this.bpm=120;this.closed=false;\n  this.delays=Array.from({length:2},()=>new Float32Array(Math.ceil(sr*.3)));this.delayAt=0;this.ap=Array.from({length:8},(_,i)=>({data:new Float32Array(Math.round(sr*([.0043,.0067,.0091,.0137][i%4]+(i>=4?.0009:0)))),pos:0}));this.messages=[];this.statistics=null;this.lastAuto=null;this.autoGain=0;\n }\n set(s){const old=this.state;if(this.kind==='master'&&(!old||old.gain!==s.gain||(!old.auto&&s.auto)))this.autoGain=s.gain;this.state=s;if(Number.isFinite(s.bpm))this.bpm=s.bpm;for(const[k,v]of Object.entries(s))if(typeof v==='number'&&!(k in this.p))this.p[k]=v;}\n event(e){if(e.type==='learn'){this.learning=Math.round(this.sr*8);this.learnCount=0;this.learnPower.fill(0);this.learnRms=0;this.learnMeter=new Loudness(this.sr);this.learnBandEnergy.fill(0);this.learnBandPeak.fill(0);this.learnBandFrames=0;this.messages.push({type:'notice',text:'learning'});}if(e.type==='reset'){this.inputMeter.reset();this.outputMeter.reset();this.refMeter.reset();}if(e.type==='reference')this.monitorRef=!!e.value;}\n suggest(power,report){const s=this.state,proposal={};const ranges=[[25,90],[90,250],[250,800],[800,2500],[2500,7000],[7000,16000]],bands=ranges.map(([lo,hi])=>{let sum=0,n=0;for(let i=Math.max(1,Math.floor(lo*this.spectrum.n/this.sr));i<Math.min(power.length,Math.ceil(hi*this.spectrum.n/this.sr));i++){sum+=power[i];n++;}return 10*Math.log10(Math.max(1e-16,sum/Math.max(1,n)));});\n  if(this.kind==='eq'){\n   proposal.g1=bands[0]>bands[1]+9?-Math.min(3,(bands[0]-bands[1]-9)*.3):0;\n   proposal.g2=clamp(((bands[1]+bands[3])/2-bands[2])*.25,-3,.7);proposal.g3=0;proposal.g4=clamp(((bands[3]+bands[5])/2-bands[4])*.22,-3,.7);proposal.g5=bands[5]>bands[4]+5?-1:0;\n   // Zoek een lokaal spectraal uitsteeksel; het voorstel blijft een kleine correctie.\n   for(const[b,lo,hi]of [[2,180,1100],[4,1800,6500]]){let best=0,index=0;for(let i=Math.max(5,Math.floor(lo*2048/this.sr));i<Math.min(power.length-5,Math.ceil(hi*2048/this.sr));i++){const around=(power[i-4]+power[i+4]+power[i-3]+power[i+3])*.25,score=10*Math.log10((power[i]+1e-16)/(around+1e-16));if(score>best){best=score;index=i;}}if(best>10){proposal['f'+b]=index*this.sr/2048;proposal['g'+b]=-clamp((best-8)*.12,.5,2.5);proposal['q'+b]=2.2;}}\n   proposal.dynThreshold=clamp(report.rms-8,-55,-12);\n  }else if(this.kind==='comp'){const crest=report.samplePeak-report.rms;proposal.threshold=clamp(report.rms-1,-40,-8);proposal.ratio=crest>13?3:1.8;proposal.attack=crest>13?.012:.03;proposal.release=clamp(60/this.bpm*.45,.08,.45);}\n  else if(this.kind==='master'){const target=s.target,measured=report.i??report.s??report.m;proposal.gain=measured===null?0:clamp(target-measured,-12,18);proposal.threshold=clamp(report.rms+2,-32,-10);proposal.ratio=s.profile==='club'?2.2:1.5;proposal.attack=.025;proposal.release=.24;proposal.low=bands[0]>bands[1]+10?-1:0;proposal.mid=clamp(((bands[1]+bands[3])/2-bands[2])*.12,-1.5,.5);proposal.high=s.profile==='warm'?-.6:0;}\n  else if(this.kind==='space'){const c=report.corr??1;proposal.width=c<.1?.95:c>.8?1.45:1.15;proposal.mix=c<0?.08:.26;proposal.depth=c>.7?.55:.35;proposal.fullness=.3;}\n  else if(this.kind==='sat'){const crest=report.samplePeak-report.rms;proposal.drive=clamp(8-crest*.35,.5,6);proposal.mix=clamp(.4-crest*.008,.15,.35);proposal.color=.35;proposal.protect=.7;}\n  else if(this.kind==='multiband'){for(let j=0;j<3;j++){const k='b'+(j+1),level=power===this.learnPower&&this.learnBandFrames?db(Math.sqrt(this.learnBandEnergy[j]/this.learnBandFrames)):this.multiband.level[j];proposal[k+'Threshold']=clamp(level-3,-50,-8);proposal[k+'Ratio']=[1.8,1.5,1.6][j];proposal[k+'Range']=Math.min(this.state[k+'Range'],3);proposal[k+'Release']=[.28,.18,.12][j];}}\n  else if(this.kind==='control'){proposal.dim=report.samplePeak>-.5?-3:0;}\n  return proposal;\n }\n blockControl(){\n  const s=this.state;const power=this.spectrum.analyse(),report=this.inputMeter.report();\n  if(this.learning>0){for(let i=0;i<power.length;i++)this.learnPower[i]+=power[i];this.learnCount++;this.learnRms+=Math.pow(10,report.rms/10);}\n  if(s.auto&&report.rms>-65){this.lastAuto=this.suggest(power,report);if(this.kind==='master'&&!s.bypass&&!s.match&&!s.locks?.gain&&s.amount>0){const recent=this.outputMeter.short??this.outputMeter.momentary;if(recent!==null)this.autoGain=clamp(this.autoGain+clamp((s.target-recent)*.1*s.amount,-.35,.35),-12,18);}}\n  this.statistics={input:report,output:this.outputMeter.report(),reference:this.refMeter.report(),gr:this.gr,limiter:db(this.limiterGain),engine:'DSP',proposal:this.proposal,bandGR:this.multiband?[...this.multiband.reduction]:null,bandLevels:this.multiband?[...this.multiband.level]:null,spectrum:[...power].filter((v,i)=>i%8===0).map(x=>10*Math.log10(Math.max(1e-15,x)))};\n  this.messages.push({type:'stats',data:this.statistics});\n }\n coefficients(){\n  const s=this.state,p=this.p;\n  const locks=s.locks||{};\n  for(const[k,v]of Object.entries(s))if(typeof v==='number'){let target=v;if(s.auto&&this.lastAuto&&Number.isFinite(this.lastAuto[k])&&!locks[k])target=this.kind==='master'&&k==='gain'&&s.amount>0?this.autoGain:v+(this.lastAuto[k]-v)*s.amount;const smooth=['ceiling','amount'].includes(k)?.25:.035;p[k]+=(target-p[k])*smooth;}\n  if(this.multiband)this.multiband.configure(p);\n  // Balance EQ: banden 1-5 altijd; 6..bands erbij; een verwijderde band blijft doorlopen tot zijn gain is uitgegleden (geen klik).\n  if(this.kind==='eq'){const nb=Math.max(5,Math.min(12,Math.round(Number.isFinite(s.bands)?s.bands:5)));for(let j=0;j<12;j++)this.act[j]=j<nb||Math.abs(p['g'+(j+1)]||0)>.0005?1:0;}\n  for(let ch=0;ch<2;ch++){\n   if(this.kind==='eq'){for(let j=0;j<12;j++){if(!this.act[j])continue;let g=p['g'+(j+1)];if(s.dynamic&&(j===1||j===3)){const detector=db(Math.sqrt(this.detEnv[j===1?0:1]));g-=clamp((detector-p.dynThreshold)*.4,0,p.dynamicMax);}this.filters[ch][j].design(j===0?'low':j===4?'high':'bell',p['f'+(j+1)],p['q'+(j+1)],g,this.sr);}this.detectors[ch][0].design('band',p.f2,2,0,this.sr);this.detectors[ch][1].design('band',p.f4,2,0,this.sr);}\n   else if(this.kind==='space'){this.spaceHigh[ch].design('hp',p.bass,.707,0,this.sr);if(ch===0)this.spaceSide.design('hp',p.bass,.707,0,this.sr);}\n   else if(this.kind==='master'){this.filters[ch][0].design('low',100,.707,p.low,this.sr);this.filters[ch][1].design('bell',700,.8,p.mid,this.sr);this.filters[ch][2].design('high',7000,.707,p.high,this.sr);}\n  }\n }\n compress(l,r,sideL,sideR){const p=this.p,s=this.state;const det=s.detector==='side'?Math.max(Math.abs(sideL),Math.abs(sideR)):Math.max(Math.abs(l),Math.abs(r));this.env+=(det-this.env)*(det>this.env?1-Math.exp(-1/(this.sr*.001)):1-Math.exp(-1/(this.sr*.045)));\n  const over=db(this.env)-p.threshold,knee=p.knee??6,ratio=p.ratio;let desired=0;if(over>knee/2)desired=over*(1-1/ratio);else if(over> -knee/2)desired=(over+knee/2)**2/(2*Math.max(.01,knee))*(1-1/ratio);\n  const alpha=1-Math.exp(-1/(this.sr*Math.max(.0005,desired>this.gr?p.attack:p.release)));this.gr+=(desired-this.gr)*alpha;\n  const g=gain(-this.gr+(p.makeup||0)),mix=p.compMix??1;return[l*(1-mix)+l*g*mix,r*(1-mix)+r*g*mix];\n }\n spatial(l,r){const p=this.p,s=this.state;const coeff=1-Math.exp(-2*Math.PI*p.bass/this.sr);this.low[0]+=coeff*(l-this.low[0]);this.low[1]+=coeff*(r-this.low[1]);const lowMid=(this.low[0]+this.low[1])*.5;\n  this.osc+=2*Math.PI*(.04+p.motion*.25)/this.sr;if(this.osc>2*Math.PI)this.osc-=2*Math.PI;\n  this.delays[0][this.delayAt]=this.spaceHigh[0].process(l);this.delays[1][this.delayAt]=this.spaceHigh[1].process(r);\n  const read=(buffer,delay)=>{let x=this.delayAt-delay;while(x<0)x+=buffer.length;const i=Math.floor(x),f=x-i;return buffer[i]*(1-f)+buffer[(i+1)%buffer.length]*f;};\n  let wetL=read(this.delays[0],this.sr*(.009+p.depth*.035+Math.sin(this.osc)*p.motion*.0007)),wetR=read(this.delays[1],this.sr*(.015+p.depth*.047+Math.sin(this.osc+1.4)*p.motion*.0007));this.delayAt=(this.delayAt+1)%this.delays[0].length;\n  for(let j=0;j<8;j++){const ap=this.ap[j],x=j<4?wetL:wetR,delayed=ap.data[ap.pos],y=delayed-x*.57;ap.data[ap.pos]=x+y*.57;ap.pos=(ap.pos+1)%ap.data.length;if(j<4)wetL=y;else wetR=y;}\n  // Verwijder laag uit reflecties; houd het originele midden herkenbaar.\n  const highL=l-this.low[0],highR=r-this.low[1],mid=(highL+highR)*.5,side=(highL-highR)*.5;\n  const correlation=this.outputMeter.correlation;const protect=s.guard&&correlation!==null?clamp((correlation+.15)/.6,0,1):1;\n  const width=1+(p.width-1)*protect;const lowL=s.monoBass?lowMid:this.low[0],lowR=s.monoBass?lowMid:this.low[1];\n  const processedL=lowL+mid+side*width+(wetL-wetR*.25)*p.fullness*protect,processedR=lowR+mid-side*width+(wetR-wetL*.25)*p.fullness*protect;\n  let a=l*(1-p.mix)+processedL*p.mix,b=r*(1-p.mix)+processedR*p.mix;const m=(a+b)*.5,sideHigh=this.spaceSide.process((a-b)*.5);if(s.monoBass){a=m+sideHigh;b=m-sideHigh;}return[a,b];\n }\n limit(l,r,dryL,dryR){const p=this.p,det=this.tpDetector.push(l,r),window=this.peakHistory;window[this.peakAt]=det;\n  // Een monotone piek-envelop: onmiddellijk omlaag, traag omhoog, met 6 ms audiovoorraad.\n  if(!this.peakHold||det>=this.peakHold){this.peakHold=det;this.holdLeft=this.look+20;}else if(--this.holdLeft<=0){this.peakHold=0;for(const v of window)this.peakHold=Math.max(this.peakHold,v);this.holdLeft=32;}\n  this.peakAt=(this.peakAt+1)%window.length;\n  const ceiling=gain(p.ceiling-.9),wanted=Math.min(1,ceiling/Math.max(1e-12,this.peakHold));this.limiterGain+=(wanted-this.limiterGain)*(wanted<this.limiterGain?.5:1-Math.exp(-1/(this.sr*.12)));\n  const at=this.lookAt,ol=this.lookL[at],or=this.lookR[at],dl=this.lookDryL[at],dr=this.lookDryR[at];this.lookL[at]=l;this.lookR[at]=r;this.lookDryL[at]=dryL;this.lookDryR[at]=dryR;this.lookAt=(at+1)%this.lookL.length;\n  return[ol*this.limiterGain,or*this.limiterGain,dl,dr];\n }\n render(l,r,inL,inR,auxL=null,auxR=null){\n  if(this.closed||!this.state){l.fill(0);r.fill(0);return;}const s=this.state,p=this.p;\n  for(let i=0;i<l.length;i++){\n   const il=Number.isFinite(inL&&inL[i])?clamp(inL[i],-32,32):0,ir=Number.isFinite(inR&&inR[i])?clamp(inR[i],-32,32):il,al=Number.isFinite(auxL&&auxL[i])?clamp(auxL[i],-32,32):0,ar=Number.isFinite(auxR&&auxR[i])?clamp(auxR[i],-32,32):al;\n   if(!(this.tick++%128))this.coefficients();this.inputMeter.push(il,ir);if(this.learning>0&&this.learnMeter)this.learnMeter.push(il,ir);this.refMeter.push(al,ar);this.spectrum.push(il,ir);\n   let x=il,y=ir,dl=il,dr=ir;\n   if(this.kind==='eq'){for(let ch=0;ch<2;ch++)for(let j=0;j<2;j++){const z=this.detectors[ch][j].process(ch?ir:il);this.detEnv[j]+=(z*z-this.detEnv[j])*.001;}\n    for(let j=0;j<12;j++)if(this.act[j]){x=this.filters[0][j].process(x);y=this.filters[1][j].process(y);}}\n   if(this.kind==='sat')[x,y]=this.saturator.process(x,y,p,s);\n   if(this.kind==='multiband'){[x,y]=this.multiband.process(x,y,p,s);if(this.learning>0){for(let j=0;j<3;j++){this.learnBandEnergy[j]+=this.multiband.env[j];this.learnBandPeak[j]=Math.max(this.learnBandPeak[j],this.multiband.env[j]);}this.learnBandFrames++;}}\n   if(this.kind==='comp')[x,y]=this.compress(x,y,al,ar);\n   if(this.kind==='space')[x,y]=this.spatial(x,y);\n   if(this.kind==='master'){\n    x*=gain(p.gain);y*=gain(p.gain);if(s.eq)for(let j=0;j<3;j++){x=this.filters[0][j].process(x);y=this.filters[1][j].process(y);}if(s.compress)[x,y]=this.compress(x,y,0,0);\n    if(s.limit)[x,y,dl,dr]=this.limit(x,y,il,ir);\n   }\n   if(this.kind==='control'){\n    const a=this.inputMeter.short??this.inputMeter.momentary,b=this.refMeter.short??this.refMeter.momentary;const refTarget=s.refMatch&&a!==null&&b!==null?Math.min(1,gain(clamp(a-b,-12,12))):1,mainTarget=s.refMatch&&a!==null&&b!==null?Math.min(1,gain(clamp(b-a,-12,12))):1;this.refGain+=(refTarget-this.refGain)*.0001;this.mainRefGain+=(mainTarget-this.mainRefGain)*.0001;this.refSelect+=((this.monitorRef?1:0)-this.refSelect)*.001;\n    x=il*this.mainRefGain*(1-this.refSelect)+al*this.refGain*this.refSelect;y=ir*this.mainRefGain*(1-this.refSelect)+ar*this.refGain*this.refSelect;\n    if(s.monitor==='mono')x=y=(x+y)*.5;else if(s.monitor==='left')y=x;else if(s.monitor==='right')x=y;else if(s.monitor==='side'){x=(x-y)*.5;y=x;}x*=gain(p.dim);y*=gain(p.dim);\n   }\n   // Optionele A/B-matching verlaagt alleen de luidere variant; nooit een verborgen boost.\n   const inPower=this.inputMeter.rms*this.inputMeter.rms,outPower=this.wetPower;this.wetPower+=(((x*x+y*y)*.5)-this.wetPower)*.0001;\n   const match=s.match?Math.min(1,Math.sqrt((inPower+1e-12)/(outPower+1e-12))):1;this.matchGain+=(match-this.matchGain)*.00005;x*=this.matchGain;y*=this.matchGain;\n   const dryMatch=s.match?Math.min(1,Math.sqrt((outPower+1e-12)/(inPower+1e-12))):1;this.active+=((s.bypass?0:1)-this.active)*.002;l[i]=x*this.active+dl*dryMatch*(1-this.active);r[i]=y*this.active+dr*dryMatch*(1-this.active);this.outputMeter.push(l[i],r[i]);\n   this.sampleCount++;if(this.learning>0&&--this.learning===0){if(this.learnCount&&this.learnMeter&&this.learnMeter.report().i!==null){this.proposal=this.suggest(this.learnPower,this.learnMeter.report());this.messages.push({type:'proposal',values:this.proposal,text:'suggestion'});}else this.messages.push({type:'notice',text:'toolow'});}\n   if(this.sampleCount%Math.round(this.sr*.25)===0)this.blockControl();\n  }\n }\n}\n";
const WNAME='nl-patchkamer-balanceeq-1-13-0';
const WORKLET=DSP_SOURCE+`\nclass P extends AudioWorkletProcessor{constructor(options){super();this.e=new ProcessorEngine(sampleRate,options.processorOptions.kind);this.live=true;this.port.onmessage=({data})=>{if(data.type==='state')this.e.set(data.state);else if(data.type==='event')this.e.event(data.event);else if(data.type==='close'){this.live=false;this.e.closed=true;}};}process(inputs,outputs){const a=inputs[0]||[],b=inputs[1]||[],o=outputs[0];if(o&&o[0])this.e.render(o[0],o[1]||o[0],a[0],a[1],b[0],b[1]);while(this.e.messages.length)this.port.postMessage(this.e.messages.shift());return this.live;}}registerProcessor('${WNAME}',P);`;
function defaults(){const s={bypass:false,match:false,auto:false,amount:.7,remote:true,locks:{},bands:BAND_MIN,layout:'auto'};for(const c of SPEC.controls)s[c.id]=c.value;return s;}
function normalize(raw){const s=defaults();raw=raw&&typeof raw==='object'?raw:{};for(const k of ['bypass','match','auto','remote'])if(typeof raw[k]==='boolean')s[k]=raw[k];if(Number.isFinite(raw.amount))s.amount=clamp(raw.amount,0,1);if(Number.isFinite(raw.bands))s.bands=clamp(Math.round(raw.bands),BAND_MIN,BAND_MAX);if(['auto','side','stack'].includes(raw.layout))s.layout=raw.layout;for(const c of SPEC.controls){if(c.type==='check'){if(typeof raw[c.id]==='boolean')s[c.id]=raw[c.id];}else if(c.type==='select'){if(c.options.some(o=>o[0]===raw[c.id]))s[c.id]=raw[c.id];}else if(typeof raw[c.id]==='number'&&Number.isFinite(raw[c.id]))s[c.id]=clamp(raw[c.id],c.min,c.max);}if(raw.locks&&typeof raw.locks==='object')for(const c of SPEC.controls)if(raw.locks[c.id]===true)s.locks[c.id]=true;
 // banden boven `bands` zijn niet actief: standaardwaarde en geen vergrendeling
 for(const c of SPEC.controls)if(bandN(c.id)>s.bands){s[c.id]=c.value;delete s.locks[c.id];}
 return s;}
const PRESET_SKIP=['bypass','match','auto','remote','locks','layout'];  // werkstand en weergave, geen klank: een preset laat dit staan (`bands` hoort wel bij de klank)
const __pkDef ={
 id:'nl.patchkamer.balanceeq',name:'Balance EQ',version:'1.13.0',modExclude:['amount'],mastering:{protocol:1,configure:true},i18n:{nl:{ports:{in:'Stereo in',out:'Stereo uit',setup:'Master Director'}}},kind:SPEC.key==='control'?'utility':'effect',category:'mastering',collection:'mastering',ui:{width:660,minWidth:320},
 ports:{audioIn:[{id:'in',name:'Stereo in'},...(SPEC.key==='comp'?[{id:'side',name:'Sidechain'}]:SPEC.key==='control'?[{id:'ref',name:'Reference'}]:[])],audioOut:[{id:'out',name:'Stereo out'}],eventIn:[],eventOut:[],modIn:[],modOut:[],multiIn:[],multiOut:[],masteringIn:[{id:'setup',name:'Master Director'}],masteringOut:[]},
 create(ctx,host){
  const TX=TXT[host&&host.lang]||TXT.en,LC=LOC[host&&host.lang]||LOC.en;const ctlName=c=>LC.ctl[c.id]||c.id,optName=(c,v)=>LC.opt[v]||v;
  const CONT=SPEC.controls.filter(c=>!c.type),mod={},NLG=!!host&&host.lang==='nl';
  const logOf=c=>(c.unit==='Hz'||c.unit==='s'||c.log===true)&&c.min>0;
  // modulatie is nooit state: de motor krijgt knop + offset × bereik (lineair) of knop × (max/min)^offset (log), geclampt; getState blijft de knopstand
  const eff=()=>{const e={...state};for(const c of CONT){const o=mod[c.id];if(!o)continue;e[c.id]=logOf(c)?clamp(state[c.id]*Math.pow(c.max/c.min,o),c.min,c.max):clamp(state[c.id]+o*(c.max-c.min),c.min,c.max);}return e;};
  const ROLE={f:'filter',g:'level',q:'res',lowSplit:'filter',highSplit:'filter',bass:'filter',threshold:'level',Threshold:'level',dynThreshold:'level',makeup:'level',Gain:'level',trim:'level',gain:'level',target:'level',ceiling:'level',ratio:'depth',Ratio:'depth',Range:'depth',dynamicMax:'depth',depth:'depth',fullness:'depth',width:'pan',motion:'motion',attack:'env',Attack:'env',release:'decay',Release:'decay',mix:'send',compMix:'send',drive:'drive',color:'color',tone:'tone',low:'tone',mid:'tone',high:'tone',protect:'param',knee:'param'};
  const roleOf=id=>{const m=/^b\d(.+)$/.exec(id),k=m?m[1]:/^[fgq]\d+$/.test(id)?id[0]:id;return ROLE[k]||'param';};
  const LN={band:['Band ','Band '],dyn:['Dynamisch','Dynamic'],main:['Algemeen','General'],comp:['Compressor','Compressor'],master:['Master','Master'],eq:['EQ','EQ'],space:['Ruimte','Space'],sat:['Verzadiging','Saturation']};
  const laneOf=id=>{let m=/^[fgq](\d+)$/.exec(id)||/^b(\d)/.exec(id);if(m)return['band'+m[1],LN.band[NLG?0:1]+m[1]];let k;
   if(SPEC.key==='eq')k='dyn';else if(SPEC.key==='multiband')k='main';else if(SPEC.key==='comp')k='comp';else if(SPEC.key==='space')k='space';else if(SPEC.key==='sat')k='sat';
   else k=['target','gain','ceiling'].includes(id)?'master':['low','mid','high'].includes(id)?'eq':'comp';return[k,LN[k][NLG?0:1]];};

  let bandsSel=null,layoutSel=null,eqs=null,secBox={},bandCtl=new Map(),lastBands=BAND_MIN;let state=defaults(),dead=false,backend=null,local=null,shell=null,shadow=null,status=null,meter=null,proposalBox=null,controls=[],autoControls=[],locks=[],pen=null,canvas=null,ro=null,raf=null,lastStats=null,proposal=null,referenceBuffer=null,referenceSource=null,refPlaying=false;
  function configure(patch){if(dead||!state.remote)return{ok:false,reason:dead?'removed':'remote control not allowed',changed:[],skipped:[]};const next=JSON.parse(JSON.stringify(state)),changed=[],skipped=[];const allowed=[...SPEC.controls,{id:'auto',type:'check'},{id:'match',type:'check'},{id:'bypass',type:'check'},{id:'amount',min:0,max:1}];for(const c of allowed){if(!Object.hasOwn(patch||{},c.id))continue;if(bandN(c.id)>state.bands)continue;if(state.locks[c.id]){skipped.push(c.id);continue;}const v=patch[c.id];let value;if(c.type==='check'){if(typeof v!=='boolean')continue;value=v;}else if(c.type==='select'){if(!c.options.some(o=>o[0]===v))continue;value=v;}else{if(typeof v!=='number'||!Number.isFinite(v))continue;value=clamp(v,c.min,c.max);}if(next[c.id]!==value){next[c.id]=value;changed.push(c.id);}}state=normalize(next);proposal=null;syncUI();return{ok:true,changed,skipped};}
  function acceptProposal(){if(!proposal)return{ok:false,reason:'no suggestion',changed:[]};const patch={};for(const[k,v]of Object.entries(proposal))if(typeof state[k]==='number')patch[k]=state[k]+(v-state[k])*state.amount;return configure(patch);}
  let lastBpm=Number.isFinite(host.bpm)?host.bpm:120,refGeneration=0;let engineLabel=TX.init;const nodes=[],sources=new Set();
  const input=ctx.createGain(),aux=ctx.createGain(),output=ctx.createGain();nodes.push(input,aux,output);input.gain.value=aux.gain.value=output.gain.value=1;input.channelCount=aux.channelCount=2;input.channelCountMode=aux.channelCountMode='explicit';input.channelInterpretation=aux.channelInterpretation='speakers';
  const fmt=(v,n=1)=>typeof v==='number'&&Number.isFinite(v)?v.toFixed(n):'—';
  function notice(text){if(status)status.textContent=engineLabel+' · '+text;}
  function receive(msg){if(dead)return;if(msg.type==='stats'){lastStats=msg.data;paintStats();}else if(msg.type==='proposal'){proposal=msg.values;if(proposalBox)proposalBox.textContent=(TX[msg.text]||msg.text)+' '+Object.entries(proposal).map(([k,v])=>k+'='+fmt(v,2)).join(' · ');}else if(msg.type==='notice')notice(TX[msg.text]||msg.text);}
  function event(e){if(dead)return;if(backend&&backend.port)backend.port.postMessage({type:'event',event:e});else if(local){local.event(e);while(local.messages.length)receive(local.messages.shift());}}
  function apply(){if(dead)return;if(backend&&backend.port)backend.port.postMessage({type:'state',state:{...eff(),bpm:lastBpm}});if(local)local.set({...eff(),bpm:lastBpm});}
  // --- schuiven: positie <-> waarde. Frequentie en Q zijn logaritmisch (positie 0..n); gain is lineair in dB (stap 0,1). De state houdt altijd de exacte waarde; alleen een schuifbeweging rondt af.
  const rnd=(v,d)=>Math.round(v*d)/d;
  const MODEL={
   // frequentie: 8000 posities over 20..20000 Hz (stap 0,086 %, ruim onder de afronding), waarde op 3 significante cijfers; zo kan de host elk getypt getal vinden
   f:{min:0,max:8000,step:1,small:12,big:267,unit:'Hz',toPos:v=>clamp(Math.round(8000*Math.log(v/20)/Math.log(1000)),0,8000),fromPos:p=>clamp(Number((20*Math.pow(1000,p/8000)).toPrecision(3)),20,20000),fmt:v=>v<100?v.toFixed(1):String(Math.round(v))},
   g:{min:-18,max:18,step:.1,small:.1,big:1,unit:'dB',toPos:v=>clamp(rnd(v,10),-18,18),fromPos:p=>clamp(rnd(p,10),-18,18),fmt:v=>{const r=rnd(v,10);return r===0?'0.0':(r>0?'+':'')+r.toFixed(1);}},
   q:{min:0,max:6000,step:1,small:10,big:450,unit:'',toPos:v=>clamp(Math.round(6000*Math.log(v/.1)/Math.log(200)),0,6000),fromPos:p=>{const v=.1*Math.pow(200,p/6000);return clamp(v<10?rnd(v,100):rnd(v,10),.1,20);},fmt:v=>v<10?v.toFixed(2):v.toFixed(1)}
  };
  const SECS=[{k:'f',group:'frequency',title:TX.secFreq,unit:'Hz'},{k:'g',group:'gain',title:TX.secGain,unit:'dB'},{k:'q',group:'q',title:TX.secQ,unit:''}];
  const adoptEl=(e,o)=>{try{return host&&host.ui&&typeof host.ui.adopt==='function'?host.ui.adopt(e,o):e;}catch(_){return e;}};
  function bandTitle(n){return TX.bandWord+' '+n+(n===1?' · low shelf':n===5?' · high shelf':'');}
  // bouwt de cellen van de actieve banden (6..bands komen erbij, boven `bands` verdwijnen ze uit de pagina en het register van de host)
  function buildCells(){if(!shadow||!eqs)return;eqs.dataset.layout=state.layout;
   for(const s of SECS){const box=secBox[s.k];box.sec.style.setProperty('--n',String(state.bands));
    for(let n=1;n<=BAND_MAX;n++){const id=s.k+n,have=bandCtl.get(id);
     if(n>state.bands){if(have){have.cell.remove();bandCtl.delete(id);}continue;}
     if(have)continue;
     const c=SPEC.controls.find(x=>x.id===id),M=MODEL[s.k],name=ctlName(c);
     const cell=document.createElement('div');cell.className='cell';
     const out=document.createElement('output');out.className='val';cell.appendChild(out);
     const inp=document.createElement('input');inp.type='range';inp.className='vs';inp.min=M.min;inp.max=M.max;inp.step=M.step;inp.setAttribute('aria-orientation','vertical');inp.setAttribute('aria-label',name);inp.dataset.pkDefault=String(M.toPos(c.value));cell.appendChild(inp);
     adoptEl(inp,{id,role:'param',group:s.group,label:name});
     const lab=document.createElement('label');lab.className='num';lab.dataset.n=String(n);lab.title=bandTitle(n)+' · '+TX.lockTip;
     const lk=document.createElement('input');lk.type='checkbox';lk.setAttribute('aria-label',name+TX.lockFor);lab.appendChild(lk);cell.appendChild(lab);
     adoptEl(lk,{id:'locks.'+id,role:'toggle',group:s.group,label:name+TX.lockFor});
     lk.onchange=()=>{state.locks[id]=lk.checked;lab.classList.toggle('on',lk.checked);apply();};
     inp.addEventListener('input',()=>{const p=Number(inp.value);let v;if(p===M.toPos(c.value))v=c.value;else if(p===M.toPos(state[id]))v=state[id];else v=M.fromPos(p);state[id]=clamp(v,c.min,c.max);syncUI();});
     inp.addEventListener('keydown',e=>{const big=e.key==='PageUp'||e.key==='PageDown'||e.shiftKey;let d=0;if(e.key==='ArrowUp'||e.key==='ArrowRight'||e.key==='PageUp')d=1;else if(e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='PageDown')d=-1;if(!d)return;e.preventDefault();e.stopPropagation();
      const next=clamp(rnd(Number(inp.value)+d*(big?M.big:M.small),1000),M.min,M.max);if(String(next)===inp.value)return;inp.value=String(next);inp.dispatchEvent(new Event('input',{bubbles:true}));});
     box.cells.appendChild(cell);bandCtl.set(id,{cell,inp,out,lab,lk,M,c,unit:M.unit});}}
  }
  // het aantal actieve banden is veranderd: onbruikbare modulatie weg en de host vraagt params() opnieuw
  function noteBands(){if(state.bands===lastBands)return;lastBands=state.bands;for(const k of Object.keys(mod))if(bandN(k)>state.bands)delete mod[k];try{if(host&&typeof host.paramsChanged==='function')host.paramsChanged(self);}catch(_){}}
  function syncUI(){buildCells();for(const c of controls){const v=state[c.key];if(c.check)c.el.checked=v;else c.el.value=String(v);if(c.output)c.output.textContent=c.format(v);}for(const b of bandCtl.values()){const v=state[b.c.id],t=b.M.fmt(v),l=!!state.locks[b.c.id];b.inp.value=String(b.M.toPos(v));b.out.textContent=t;b.inp.setAttribute('aria-valuetext',t+(b.unit?' '+b.unit:''));b.lk.checked=l;b.lab.classList.toggle('on',l);}
   for(const c of autoControls)c.el.checked=state[c.key];for(const c of locks)c.el.checked=!!state.locks[c.key];if(bandsSel)bandsSel.value=String(state.bands);if(layoutSel)layoutSel.value=state.layout;noteBands();apply();}
  function paintStats(){if(!meter||!lastStats)return;const a=lastStats.input,b=lastStats.output,ref=lastStats.reference;meter.textContent='IN '+fmt(a.i)+' LUFS-I   →   '+TX.out+' '+fmt(b.i)+' LUFS-I\nM '+fmt(b.m)+'   S '+fmt(b.s)+'   LRA '+fmt(b.lra)+' LU\n'+(['master','control'].includes(SPEC.key)?'TP 4× ':'Sample peak ')+fmt(b.tp)+' dB'+(['master','control'].includes(SPEC.key)?'TP':'FS')+'   corr '+fmt(b.corr,2)+'   L/R '+fmt(b.balance)+' dB\nGR '+fmt(lastStats.gr)+' dB   limiter '+fmt(-lastStats.limiter)+' dB'+(lastStats.bandGR?'\nBAND GR '+lastStats.bandGR.map(v=>fmt(v)).join(' / ')+' dB':'')+(SPEC.key==='control'?'\nREF '+fmt(ref.i)+' LUFS-I  · '+fmt(ref.s)+' LUFS-S':'');
   const warnings=[];if(b.samplePeak>-.01)warnings.push(TX.w_clip);if(b.corr!==null&&b.corr<-.1)warnings.push(TX.w_phase);if(Math.abs(b.balance)>3&&b.rms>-65)warnings.push(TX.w_bal);if(SPEC.key==='master'&& -lastStats.limiter>6)warnings.push(TX.w_limit);notice(warnings.length?warnings.join(' · '):(state.auto?TX.following:TX.manual)+' · '+fmt(b.seconds,0)+TX.measured);
  }
  function stopReference(){if(referenceSource){const source=referenceSource;referenceSource=null;source.onended=null;try{source.stop();}catch(_){}source.disconnect();sources.delete(source);}refPlaying=false;event({type:'reference',value:false});}
  function fallback(){if(dead)return;try{if(typeof ctx.createScriptProcessor!=='function')throw Error('no compatibility engine');
    local=new ProcessorEngine(ctx.sampleRate,SPEC.key);local.set({...eff(),bpm:lastBpm});backend=ctx.createScriptProcessor(2048,4,2);nodes.push(backend);
    const a=ctx.createChannelSplitter(2),b=ctx.createChannelSplitter(2),merge=ctx.createChannelMerger(4);nodes.push(a,b,merge);input.connect(a);aux.connect(b);a.connect(merge,0,0);a.connect(merge,1,1);b.connect(merge,0,2);b.connect(merge,1,3);merge.connect(backend);backend.connect(output);
    backend.onaudioprocess=e=>{if(dead)return;const i=e.inputBuffer,o=e.outputBuffer;local.render(o.getChannelData(0),o.getChannelData(1),i.getChannelData(0),i.getChannelData(1),i.getChannelData(2),i.getChannelData(3));while(local.messages.length)receive(local.messages.shift());};engineLabel=TX.compat;notice(TX.ready);
   }catch(_){local=null;if(backend){backend.disconnect();backend=null;}input.connect(output);engineLabel=TX.nobypass;notice(TX.usehost);}
  }
  if(typeof host.loadWorklet==='function'&&typeof AudioWorkletNode==='function')Promise.resolve().then(()=>host.loadWorklet(WNAME,WORKLET)).then(loaded=>{if(dead)return;if(loaded===false){fallback();return;}try{
    backend=new AudioWorkletNode(ctx,WNAME,{numberOfInputs:2,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{kind:SPEC.key}});nodes.push(backend);input.connect(backend,0,0);aux.connect(backend,0,1);backend.connect(output);backend.port.onmessage=({data})=>receive(data);backend.port.postMessage({type:'state',state:{...eff(),bpm:lastBpm}});backend.onprocessorerror=()=>{if(dead||!backend)return;const old=backend;backend=null;old.onprocessorerror=null;try{input.disconnect(old);aux.disconnect(old);}catch(_){}old.disconnect();old.port.close();fallback();};engineLabel=TX.worklet;notice(TX.ready);
   }catch(_){if(backend){try{input.disconnect(backend);aux.disconnect(backend);}catch(_){}backend.disconnect();if(backend.port)backend.port.close();backend=null;}fallback();}}).catch(()=>{if(!dead)fallback();});else fallback();
  function unmount(){if(raf){raf();raf=null;}if(ro)ro.disconnect();ro=null;if(shell)shell.remove();shell=shadow=status=meter=proposalBox=canvas=pen=bandsSel=layoutSel=eqs=null;secBox={};bandCtl=new Map();controls=[];autoControls=[];locks=[];}
  const self={
   inputs:{in:input,...(SPEC.key==='comp'?{side:aux}:SPEC.key==='control'?{ref:aux}:{})},outputs:{out:output},
   mount(el){if(dead)return;unmount();shell=document.createElement('div');el.appendChild(shell);shadow=shell.attachShadow({mode:'open'});const style=document.createElement('style');style.textContent=`
    :host{display:block;min-width:0;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:9px;background:var(--card);padding:12px;border:1px solid var(--line);border-radius:9px}h2{font:700 22px var(--disp,sans-serif);letter-spacing:.06em;margin:0}h3{font:700 11px var(--disp,sans-serif);letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;color:var(--muted)}h3 small{font:10px var(--mono,monospace);letter-spacing:0;text-transform:none;margin-left:4px}.hint,.status,.proposal{font-size:11px;line-height:1.5;color:var(--muted);overflow-wrap:anywhere}.row{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,175px),1fr));gap:6px}
    select,button,input[type=file]{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);padding:5px;border-radius:4px;min-width:0;max-width:100%}button{cursor:pointer}button:hover{border-color:var(--audio)}input{accent-color:var(--audio)}input[type=range]{width:100%;min-width:0}.control{padding:8px;border:1px solid var(--line);border-radius:5px;background:var(--card-2)}.line{display:flex;justify-content:space-between;gap:5px;align-items:center}.lock{font-size:10px;color:var(--muted)}output{font-size:10px;color:var(--audio)}pre{font:11px/1.6 var(--mono,monospace);margin:0;padding:10px;background:var(--well);color:var(--well-fg,var(--fg));border-radius:6px;white-space:pre-wrap}.screen{height:95px;position:relative;min-width:0;overflow:hidden;background:var(--well);border-radius:5px}canvas{position:absolute;width:100%;height:100%;inset:0}.proposal{padding:7px;border-left:2px solid var(--audio)}
    .view label{display:inline-flex;gap:6px;align-items:center}
    .eqs{--len:200px;display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;overflow-x:auto;min-width:0}.eqs[data-layout=side]{flex-wrap:nowrap}.eqs[data-layout=stack]{flex-direction:column;overflow-x:auto}
    .sec{flex:1 1 calc(var(--n)*32px + 20px);min-width:calc(var(--n)*30px + 20px);padding:8px 6px;border:1px solid var(--line);border-radius:6px;background:var(--card-2)}.eqs[data-layout=stack] .sec{flex:none}
    .cells{display:flex;justify-content:space-evenly;gap:2px}.cell{flex:1 1 30px;min-width:30px;max-width:60px;display:grid;justify-items:center;align-content:start;gap:4px}
    .cell output.val{font:10px var(--mono,monospace);letter-spacing:-.02em;color:var(--audio);min-height:1.4em;line-height:1.4;cursor:text;text-align:center;white-space:nowrap}
    .cell input.vs{writing-mode:vertical-lr;direction:rtl;height:var(--len);width:24px;margin:0;padding:0;touch-action:none}
    .num{position:relative;display:inline-grid;place-items:center;min-width:22px;height:20px;padding:0 4px;border:1px solid var(--line);border-radius:10px;font-size:11px;color:var(--muted);cursor:pointer;user-select:none}.num::before{content:attr(data-n)}.num input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}.num.on{background:var(--audio);border-color:var(--audio);color:var(--card);font-weight:700}.num:focus-within{outline:2px solid var(--audio);outline-offset:1px}
   `;shadow.appendChild(style);
    function make(tag,text,parent,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;if(parent)parent.appendChild(e);return e;}
    const adopt=(e,o)=>{try{return host&&host.ui&&typeof host.ui.adopt==='function'?host.ui.adopt(e,o):e;}catch(_){return e;}};
    const app=make('div',null,shadow,'app');make('h2',NAME+' · MASTERING',app);make('div',DESC[host&&host.lang]||DESC.en,app,'hint');
    const row=make('div',null,app,'row');
    const profile=make('select',null,row);profile.setAttribute('aria-label',TX.profileLabel);const blank=make('option',TX.profilePick,profile);blank.value='';for(const[name,values]of Object.entries(SPEC.profiles)){const o=make('option',LC.prof[name]||name,profile);o.value=name;}
    adopt(profile,{id:'profile',role:'select',group:'preset',label:TX.profileLabel});
    profile.onchange=()=>{const p=SPEC.profiles[profile.value];if(p){for(const[k,v]of Object.entries(p))if(!state.locks[k])state[k]=v;syncUI();}profile.value='';};
    for(const[key,title]of [['bypass',TX.bypass],['match',TX.match],['auto',TX.follow],['remote',TX.remote]]){const label=make('label',null,row),i=make('input',null,label);i.type='checkbox';make('span',title,label);adopt(i,{id:key,role:'toggle',group:'mode',label:title});i.onchange=()=>{state[key]=i.checked;syncUI();};autoControls.push({el:i,key});}
    function button(title,fn,id,parent=row){const b=make('button',title,parent);b.type='button';b.onclick=fn;adopt(b,{id,role:'button',group:'analysis',label:title});return b;}
    button(TX.analyse,()=>event({type:'learn'}),'analyse');button(TX.apply,()=>{if(!proposal){notice(TX.analyseFirst);return;}const remote=state.remote;state.remote=true;acceptProposal();state.remote=remote;syncUI();notice(TX.applied);},'apply');button(TX.resetMeters,()=>event({type:'reset'}),'resetMeters');
    const strength=make('label',null,app,'line');make('span',TX.strength,strength);const amount=make('input',null,strength);amount.type='range';amount.min=0;amount.max=1;amount.step=.01;amount.setAttribute('aria-label',TX.strength);adopt(amount,{id:'amount',role:'param',group:'follow',label:TX.strength});amount.oninput=()=>{state.amount=Number(amount.value);syncUI();};controls.push({el:amount,key:'amount'});
    // Balance EQ: drie secties (Frequentie, Gain, Q) met verticale schuiven per band; Banden en Indeling kiezen het aantal en de plaatsing.
    const view=make('div',null,app,'row view');
    const bl=make('label',null,view);make('span',TX.bandsLabel,bl);bandsSel=make('select',null,bl);for(let n=BAND_MIN;n<=BAND_MAX;n++){const o=make('option',String(n),bandsSel);o.value=String(n);}bandsSel.setAttribute('aria-label',TX.bandsLabel);adopt(bandsSel,{id:'bands',role:'select',group:'layout',label:TX.bandsLabel});
    bandsSel.onchange=()=>{state.bands=Number(bandsSel.value);state=normalize(state);syncUI();};
    const ll=make('label',null,view);make('span',TX.layoutLabel,ll);layoutSel=make('select',null,ll);for(const[v,t]of [['auto',TX.layoutAuto],['side',TX.layoutSide],['stack',TX.layoutStack]]){const o=make('option',t,layoutSel);o.value=v;}layoutSel.setAttribute('aria-label',TX.layoutLabel);adopt(layoutSel,{id:'layout',role:'select',group:'layout',label:TX.layoutLabel});
    layoutSel.onchange=()=>{state.layout=layoutSel.value;syncUI();};
    eqs=make('div',null,app,'eqs');eqs.setAttribute('role','group');eqs.setAttribute('aria-label',NAME);
    secBox={};for(const s of SECS){const sec=make('section',null,eqs,'sec');sec.setAttribute('data-sec',s.group);const h=make('h3',s.title,sec);if(s.unit)make('small',s.unit,h);secBox[s.k]={sec,cells:make('div',null,sec,'cells')};}
    make('div',TX.bandsHint,app,'hint');
    const dyn=make('div',null,app,'grid');
    for(const id of ['dynamic','dynThreshold','dynamicMax']){const c=SPEC.controls.find(x=>x.id===id),wrap=make('div',null,dyn,'control'),head=make('div',null,wrap,'line');make('span',ctlName(c),head);
     if(c.type==='check'){const i=make('input',null,head);i.type='checkbox';i.setAttribute('aria-label',ctlName(c));adopt(i,{id:c.id,role:'toggle',group:'dynamic',label:ctlName(c)});i.onchange=()=>{state[c.id]=i.checked;syncUI();};controls.push({el:i,key:c.id,check:true});}
     else{const output=make('output',null,head),input=make('input',null,wrap);input.type='range';input.min=c.min;input.max=c.max;input.step=c.step||(c.max-c.min)/1000;input.setAttribute('aria-label',ctlName(c));adopt(input,{id:c.id,role:'param',group:'dynamic',label:ctlName(c)});input.oninput=()=>{state[c.id]=Number(input.value);syncUI();};controls.push({el:input,key:c.id,output,format:v=>fmt(v,1)+' dB'});
      const label=make('label',null,wrap,'lock'),lock=make('input',null,label);lock.type='checkbox';make('span',TX.lock,label);lock.setAttribute('aria-label',ctlName(c)+TX.lockFor);adopt(lock,{id:'locks.'+c.id,role:'toggle',group:'dynamic',label:ctlName(c)+TX.lockFor});lock.onchange=()=>{state.locks[c.id]=lock.checked;apply();};locks.push({el:lock,key:c.id});}
    }
    proposalBox=make('div',TX.proposalHint,app,'proposal');
    meter=make('pre',TX.emptyMeter,app);const screen=make('div',null,app,'screen');canvas=make('canvas',null,screen);canvas.setAttribute('aria-label',TX.spectrum);pen=canvas.getContext('2d');
    function resize(){if(!canvas)return;const d=Math.min(2,globalThis.devicePixelRatio||1);canvas.width=Math.max(1,screen.clientWidth*d);canvas.height=Math.max(1,screen.clientHeight*d);}ro=new ResizeObserver(resize);ro.observe(screen);resize();
    function draw(){if(!canvas||dead)return;const d=Math.min(2,globalThis.devicePixelRatio||1),w=canvas.width/d,h=canvas.height/d,css=getComputedStyle(shell);pen.setTransform(d,0,0,d,0,0);pen.fillStyle=css.getPropertyValue('--well').trim()||'Canvas';pen.fillRect(0,0,w,h);const values=lastStats?.spectrum;if(!values)return;pen.strokeStyle=css.getPropertyValue('--audio').trim()||'Highlight';pen.beginPath();for(let i=0;i<values.length;i++){const x=i/(values.length-1)*w,y=h-clamp((values[i]+100)/90,0,1)*h;if(i)pen.lineTo(x,y);else pen.moveTo(x,y);}pen.stroke();}draw();raf=frameLoop(host,self,draw,20);
    status=make('div',engineLabel,app,'status');shadow.addEventListener('pointerdown',e=>e.stopPropagation());syncUI();paintStats();
   },unmount,
   configureMastering(patch){return configure(patch);},
   getMasteringReport(){return{settings:JSON.parse(JSON.stringify(state)),proposal:!!proposal,stats:lastStats?{i:lastStats.output.i,s:lastStats.output.s,tp:lastStats.output.tp,gr:lastStats.gr}:null};},
   analyseMastering(){if(dead||!state.remote||(!local&&!backend?.port))return{ok:false,reason:'no active engine or no permission'};event({type:'learn'});return{ok:true};},
   acceptMasteringProposal(){return acceptProposal();},
   params(){return CONT.filter(c=>bandN(c.id)<=state.bands).map(c=>{const r=roleOf(c.id),l=laneOf(c.id);return{id:c.id,name:ctlName(c),lane:l[0],laneName:l[1],min:c.min,max:c.max,role:r,scale:logOf(c)?'log':'lin',drift:['level','env','decay'].includes(r)?.05:.08,on:false};});},
   modulate(o){for(const k in mod)delete mod[k];for(const k in o||{})if(CONT.some(c=>c.id===k)&&bandN(k)<=state.bands&&typeof o[k]==='number'&&Number.isFinite(o[k]))mod[k]=clamp(o[k],-1,1);apply();},
   getState(){return JSON.parse(JSON.stringify(state));},setState(s){if(dead)return;state=normalize(s);syncUI();},
   getPreset(){const p=JSON.parse(JSON.stringify(state));for(const k of PRESET_SKIP)delete p[k];return p;},
   setPreset(p){if(dead)return;const keep={};for(const k of PRESET_SKIP)keep[k]=state[k];state=normalize({...(p&&typeof p==='object'?p:{}),...keep});syncUI();},
   onStep(info){if(dead||!info)return;if(Number.isFinite(info.bpm)&&info.bpm!==lastBpm){lastBpm=info.bpm;apply();}},
   destroy(){if(dead)return;stopReference();dead=true;refGeneration++;unmount();if(backend){backend.onprocessorerror=null;backend.onaudioprocess=null;if(backend.port){backend.port.postMessage({type:'close'});backend.port.close();}}if(local)local.closed=true;referenceBuffer=null;sources.forEach(s=>{s.onended=null;try{s.stop();}catch(_){}s.disconnect();});sources.clear();nodes.forEach(n=>{try{n.disconnect();}catch(_){}});backend=local=null;}
  };
  return self;
 }
};
export default __pkDef;
