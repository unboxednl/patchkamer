// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Verbeterd: een nieuw of fabrieks-bassdrumkanaal begint met een lage tuning per klankmodel (voorheen 0, waardoor de kick te hoog klonk). Tunes en bewaarde instellingen houden hun eigen tuning; de motor is ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Drum Kit en nieuwe id nl.patchkamer.drumkit (voorheen Slagwerk, nl.patchkamer.slagwerk); tunes en songs uit die tijd
//          verwijzen naar de oude id. Tweetalig (host.lang; namen van het apparaat en de poorten per taal in i18n; alle teksten in TXT). De twee eerste
//          klankmodellen heten nu Deep en Punch (voorheen met een getal als naam) en de tekst met herkomst is weg. Tekenen via host.frame (de eigen
//          tekenpoort-omzetting is weg). Het geluid is ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen. Tekenlussen alleen op volle snelheid als de kaart te zien is.
// 1.7.4 — Bundel-uitgang "Losse uit" (Separate outs): alle actieve kanalen in één groene kabel, met instrumentnaam per kanaal (zelfde signaal als ch1…ch16).
//         Presets: getPreset/setPreset laten je eigen kitlijst, het gekozen kanaal, de pagina en de stap-editwaarden staan; setState bouwt de hele UI opnieuw op.
//         Kleuren volgen de kleurstelling van Patchkamer (donker, licht, sampler); de oranje accentkleur blijft.
// Drum Kit: een drumkit met 16 kanalen, 30 gesynthetiseerde instrumenten, acht klankmodellen, een sequencer (4 patronen, tot 64 stappen, kans en ratchet),
// losse uitgangen per kanaal en een bundel-uitgang. Alle geluid wordt lokaal gesynthetiseerd; er zijn geen samples.
// Modulatie is tijdelijk, vervangt eerdere offsets en verandert de bewaarde waarden nooit. Vaste poorten ch1…ch16: het aantal kanalen of een klankwijziging
// laat de kabels staan. MIDI: General MIDI-percussie per kanaal; trig lane: chN of de naam van het instrument.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: {
    tag: '16 STEMMEN / LOSSE UITGANGEN / SYNTHESE', factory: 'FABRIEKSKIT', custom: 'Eigen', channels: 'KANALEN', seqOn: 'Sequencer aan', seqOff: 'Sequencer uit',
    length: 'LENGTE', steps: 'stappen', page: 'PAGINA', copy: 'Kopieer', paste: 'Plak', clear: 'Wis pattern', chRuler: 'KANAAL / MUTE / SOLO',
    editVel: 'STAP VELOCITY', editProb: 'STAP KANS', hint: 'Klik: aan/uit · Shift-klik / rechtsklik: stapwaarden toepassen',
    chCap: (n, name) => `KANAAL ${n} · ${name}`, audition: '▶ Auditie', soundModel: 'KLANKMODEL', choke: 'CHOKE GROEP', none: 'Geen', hats: 'hats',
    body: 'BODY / HELDERHEID', metallic: 'METAALKLANK', toneAttack: 'TOON / AANSLAG', wires: 'SNARETAPIJT', beater: 'BEATER / KLIK', noiseTex: 'RUIS / TEXTUUR',
    res: 'RESONANTIE / Q', level: 'NIVEAU', center: 'Midden', inMix: 'In stereomix',
    scopeCap: 'MIX OSCILLOSCOOP · KANAALMETERS', hostStart: 'Host transport start de sequencer.', play: (s, n) => `PLAY · stap ${s} / ${n}`,
    kitPresets: 'EIGEN KITPRESETS', kitName: 'Naam van je kit', presetName: 'Presetnaam', save: 'Bewaar', savedKits: 'OPGESLAGEN KITS', loadKit: 'Laad kit', del: 'Verwijder',
    presetNote: 'Kitpresets bewaren klanken en kanaalinstellingen. Patterns A–D blijven bij het laden behouden. Alles wordt met de Patchkamer-opstelling opgeslagen.',
    patchbay: 'PATCHBAY · STABIELE UITGANGEN', jackMix: 'STEREO MIX', empty: 'leeg', jackMulti: 'LOSSE UIT · BUNDEL',
    modNone: 'Mod · geen actieve offsets', modActive: n => 'MOD · ' + n + ' actieve parameters',
    modNote: 'Verbind de paarse sturingsuitgang van een modulator met MOD. De modulator toont de beschikbare parameters per drumkanaal. Knoppen en presets bewaren de basiswaarden; modulatie wordt er tijdelijk bij opgeteld. Filter, resonantie, drive, pan en volume bewegen direct. Tuning, decay, attack en klanktextuur gelden vanaf de volgende drumslag.',
    bundleNote: 'Losse uit (bundel) geeft alle actieve kanalen in één groene kabel, met instrumentnaam: trek hem naar “bundel in” van de mixer of naar de multitrack. Mix en kanaaluitgangen zijn tegelijk actief. Zet “In stereomix” uit als je een kanaal extern mixt. Uitgangen volgen kanaalnummer; ongebruikte uitgangen zijn stil. MIDI volgt de notennummers per kanaal; trig lane = ch1…ch16 of instrumentnaam (kick, snare, …).',
    modelNote: 'De klankmodellen zijn originele synthese, geen samples. Tempo en swing komen van de Patchkamer-klok.',
    stepTitle: (k, v, p, r) => `Stap ${k}: velocity ${v}%, kans ${p}%, ${r}×`, multi: 'Losse uit', pMaster: 'Master', pMasterLane: 'Master / stereomix',
    pn: { tone: 'Toon / helderheid', noise: 'Ruis / textuur', resonance: 'Resonantie / Q', sweep: 'Pitch envelope', level: 'Niveau' } },
  en: {
    tag: '16 VOICES / INDIVIDUAL OUTS / SYNTHESIS', factory: 'FACTORY KIT', custom: 'Custom', channels: 'CHANNELS', seqOn: 'Sequencer on', seqOff: 'Sequencer off',
    length: 'LENGTH', steps: 'steps', page: 'PAGE', copy: 'Copy', paste: 'Paste', clear: 'Clear pattern', chRuler: 'CHANNEL / MUTE / SOLO',
    editVel: 'STEP VELOCITY', editProb: 'STEP PROBABILITY', hint: 'Click: on/off · Shift-click / right-click: apply step values',
    chCap: (n, name) => `CHANNEL ${n} · ${name}`, audition: '▶ Audition', soundModel: 'SOUND MODEL', choke: 'CHOKE GROUP', none: 'None', hats: 'hats',
    body: 'BODY / BRIGHTNESS', metallic: 'METALLIC TONE', toneAttack: 'TONE / ATTACK', wires: 'SNARE WIRES', beater: 'BEATER / CLICK', noiseTex: 'NOISE / TEXTURE',
    res: 'RESONANCE / Q', level: 'LEVEL', center: 'Center', inMix: 'In stereo mix',
    scopeCap: 'MIX SCOPE · CHANNEL METERS', hostStart: 'The host transport starts the sequencer.', play: (s, n) => `PLAY · step ${s} / ${n}`,
    kitPresets: 'YOUR KIT PRESETS', kitName: 'Name of your kit', presetName: 'Preset name', save: 'Save', savedKits: 'SAVED KITS', loadKit: 'Load kit', del: 'Delete',
    presetNote: 'Kit presets store sounds and channel settings. Patterns A–D are kept when you load one. Everything is saved with your Patchkamer workspace.',
    patchbay: 'PATCHBAY · STABLE OUTPUTS', jackMix: 'STEREO MIX', empty: 'empty', jackMulti: 'SEPARATE OUTS · BUNDLE',
    modNone: 'Mod · no active offsets', modActive: n => 'MOD · ' + n + ' active parameters',
    modNote: 'Connect the purple control output of a modulator to MOD. The modulator shows the available parameters per drum channel. Knobs and presets keep the base values; modulation is added on top temporarily. Filter, resonance, drive, pan and level move immediately. Tuning, decay, attack and sound texture apply from the next hit.',
    bundleNote: 'Separate outs (bundle) gives all active channels on one green cable, with the instrument name: drag it to “bundle in” of the mixer or to the multitrack. The mix and the channel outputs are active at the same time. Turn off “In stereo mix” if you mix a channel externally. Outputs follow the channel number; unused outputs are silent. MIDI follows the note numbers per channel; trig lane = ch1…ch16 or instrument name (kick, snare, …).',
    modelNote: 'The sound models are original synthesis, not samples. Tempo and swing come from the Patchkamer clock.',
    stepTitle: (k, v, p, r) => `Step ${k}: velocity ${v}%, probability ${p}%, ${r}×`, multi: 'Separate outs', pMaster: 'Master', pMasterLane: 'Master / stereo mix',
    pn: {} },
};
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
const clamp=(v,a,b,d=a)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
const copy=x=>JSON.parse(JSON.stringify(x));
const TYPES={
 kick:['Bass drum','kick',36,55,.55,.9,.18],snare:['Snare','snare',38,185,.22,.5,.72],
 clap:['Handclap','clap',39,1100,.18,.35,.9],closedhat:['Closed hat','hat',42,7000,.065,.7,.85],
 openhat:['Open hat','hat',46,6500,.48,.65,.85],lowtom:['Low tom','tom',45,110,.32,.55,.12],
 midtom:['Mid tom','tom',47,165,.27,.55,.12],hitom:['High tom','tom',50,230,.22,.55,.12],
 rim:['Rim / cross stick','rim',37,850,.055,.7,.1],cowbell:['Cowbell','bell',56,560,.17,.7,.05],
 crash:['Crash cymbal','cymbal',49,6200,1.8,.75,.65],ride:['Ride cymbal','cymbal',51,4800,.9,.6,.45],
 shaker:['Shaker','shaker',70,6500,.09,.35,1],tamb:['Tambourine','tamb',54,5600,.18,.65,.8],
 conga:['Conga','tom',64,250,.2,.32,.16],bongo:['Bongo','tom',60,390,.12,.35,.14],
 clave:['Claves','rim',75,1850,.06,.8,0],wood:['Woodblock','rim',76,720,.1,.55,.06],
 brush:['Brush snare','brush',40,1500,.32,.2,.95],brushswirl:['Brush sweep','brush',69,1700,.85,.1,1],
 clapdigital:['Digital clap','clap',31,1800,.12,.7,.8],zap:['Laser / zap','zap',78,180,.32,1,.05],
 metal:['Industrial metal','metal',80,270,.7,.9,.4],sub:['Sub drop','kick',35,38,1.5,.55,.02]
};
const MODELS=['Deep','Punch','Rock','Pop','Jazz','Funk','Lo-fi','Industrial'];
const MODEL={ Deep:{tone:1,noise:1,decay:1},Punch:{tone:1.15,noise:.9,decay:.8},Rock:{tone:.82,noise:1.25,decay:1.1},Pop:{tone:1.15,noise:1.08,decay:.78},Jazz:{tone:.9,noise:.8,decay:.8},Funk:{tone:1.2,noise:1.1,decay:.65},'Lo-fi':{tone:.85,noise:.85,decay:.85},Industrial:{tone:.7,noise:1.2,decay:1.35}};
const KIT={
 Deep:['kick','snare','clap','closedhat','openhat','lowtom','midtom','hitom','rim','cowbell','crash'],
 Punch:['kick','snare','clap','closedhat','openhat','lowtom','midtom','hitom','rim','crash','ride'],
 Rock:['kick','snare','closedhat','openhat','lowtom','midtom','hitom','crash','ride','tamb'],
 Pop:['kick','snare','clap','closedhat','openhat','shaker','tamb','lowtom','crash'],
 Jazz:['kick','brush','closedhat','ride','lowtom','hitom','rim','brushswirl','crash'],
 Funk:['kick','snare','closedhat','openhat','rim','cowbell','conga','bongo','tamb'],
 'Lo-fi':['kick','snare','closedhat','openhat','rim','shaker','wood','brush'],
 Industrial:['kick','snare','closedhat','openhat','metal','zap','clapdigital','sub','crash']
};
const cell=()=>({v:0,p:1,r:1});
const KICK_TUNE={Punch:-22,Deep:-20,Industrial:-14,Rock:-17,Pop:-22,Jazz:-18,Funk:-23,'Lo-fi':-17};  // een bassdrum begint hoog; deze standaard tuning geeft per klankmodel een echte bassdrum
function lane(type='kick',model='Deep',i=0){const t=TYPES[type],m=MODEL[model];return {type,model,note:t[2],tune:type==='kick'?(KICK_TUNE[model]??-20):0,decay:t[4]*m.decay,tone:t[5],noise:Math.min(1,t[6]*m.noise),sweep:type==='kick'?.65:.25,attack:.001,cutoff:model==='Lo-fi'?4600:18000,resonance:.7,filter:'lowpass',drive:model==='Industrial'?.55:model==='Lo-fi'?.22:0,level:.7,pan:0,mute:false,solo:false,mix:true,choke:type==='closedhat'||type==='openhat'?1:0,steps:Array.from({length:4},()=>Array.from({length:64},cell))};}
function makeState(kit='Punch'){return {kit,channels:KIT[kit].map((t,i)=>lane(t,kit,i)),length:16,pattern:0,bank:0,selected:0,run:true,master:.72,human:0,presets:[],editVelocity:.8,editProbability:1,editRatchet:1};}
function groove(s,style){s.channels.forEach(c=>c.steps[s.pattern]=Array.from({length:64},cell));const put=(type,steps,v=.8)=>{const c=s.channels.find(c=>c.type===type);if(c)steps.forEach((n,i)=>c.steps[s.pattern][n]={v:i%2?v*.85:v,p:1,r:1});};
 if(style==='Jazz'){put('kick',[0,10],.5);put('brush',[4,12],.65);put('ride',[0,4,7,8,12,15],.65);put('closedhat',[4,12],.55);}
 else{put('kick',style==='Rock'?[0,6,8,10]:style==='Funk'?[0,3,6,10]:style==='Lo-fi'?[0,7,10]:[0,4,8,12],.92);put('snare',[4,12],.83);put('clap',[4,12],.48);put('closedhat',style==='Rock'?[0,2,4,6,8,10,12,14]:[0,2,4,6,8,10,12,14],.63);put('openhat',[6,14],.45);put('shaker',[1,3,5,7,9,11,13,15],.4);put('ride',style==='Rock'?[0,4,8,12]:[],.4);}
}
const PORTS={audioIn:[],audioOut:[{id:'mix',name:'Stereo mix'},...Array.from({length:16},(_,i)=>({id:'ch'+(i+1),name:'Drum '+(i+1)}))],eventIn:[{id:'trigger',name:'MIDI / trigs'}],eventOut:[{id:'trigs',name:'Drum trigs'}],modIn:[{id:'mod',name:'Mod'}],modOut:[],multiOut:[{id:'multi',name:'Losse uit (bundel)'}]};
// contract v1.6: deze velden horen bij het werken met het apparaat, niet bij de klank; een preset laat ze staan
const PRESET_SKIP=['presets','selected','bank','editVelocity','editProbability','editRatchet'];
// Stable channel-based parameter ids match audio outputs and existing CC names.
// Frequency/time controls use multiplicative log offsets; tuning is semitones (linear).
const MOD_DEFS={
 tune:{name:'Tuning',min:-24,max:24,scale:'lin',role:'pitch',drift:.002,on:true},
 decay:{name:'Decay',min:.02,max:4,scale:'log',role:'decay',drift:.015,on:true},
 attack:{name:'Attack',min:.001,max:.15,scale:'log',role:'env',drift:.01,on:false},
 sweep:{name:'Pitch envelope',min:0,max:1,scale:'lin',role:'env',drift:.01,on:false},
 tone:{name:'Tone / brightness',min:0,max:1,scale:'lin',role:'timbre',drift:.02,on:true},
 noise:{name:'Noise / texture',min:0,max:1,scale:'lin',role:'timbre',drift:.02,on:false},
 cutoff:{name:'Filter cutoff',min:30,max:20000,scale:'log',role:'filter',drift:.01,on:true},
 resonance:{name:'Resonance / Q',min:.1,max:12,scale:'lin',role:'res',drift:.005,on:false},
 drive:{name:'Drive',min:0,max:1,scale:'lin',role:'drive',drift:.01,on:false},
 level:{name:'Level',min:0,max:1,scale:'lin',role:'level',drift:.01,on:false},
 pan:{name:'Pan',min:-1,max:1,scale:'lin',role:'pan',drift:.025,on:false}
};
const CSS=`
.sw{--bg:var(--card,#14191c);--panel:var(--card-2,#1e2529);--edge:var(--line,#364148);--ink:var(--fg,#e8e9df);--dim:var(--muted,#9aa9ad);--accent:#f6b85c;--btn:color-mix(in srgb,var(--card-2,#1e2529) 86%,var(--fg,#e8e9df));--stepbg:var(--step-q,#273036);--screen:var(--well,#101618);color:var(--ink);background:var(--bg);padding:20px;border-radius:10px;font:13px 'IBM Plex Mono',monospace;container-type:inline-size}.sw *{box-sizing:border-box}.sw h1{font:700 32px 'Barlow Condensed',sans-serif;letter-spacing:4px;margin:0}.sw .top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.sw .brand small{color:var(--accent);letter-spacing:2px}.sw .tag{color:var(--dim);font-size:11px}.sw button,.sw select,.sw input{font:inherit;color:inherit}.sw button,.sw select,.sw input[type=text],.sw input[type=number]{background:var(--btn);border:1px solid var(--edge);border-radius:5px;padding:7px;min-height:32px}.sw button{cursor:pointer}.sw button:hover{border-color:var(--accent)}.sw button.active{background:var(--accent);color:#14191c;border-color:var(--accent)}.sw button:focus-visible,.sw input:focus-visible,.sw select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.sw .toolbar{display:flex;gap:9px;align-items:end;flex-wrap:wrap;margin:16px 0}.sw label{display:flex;flex-direction:column;gap:5px;font-size:10px;color:var(--dim);letter-spacing:.5px}.sw .row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.sw .section{border:1px solid var(--edge);background:var(--panel);border-radius:7px;padding:13px;margin:12px 0}.sw .caption{font-size:10px;letter-spacing:2px;color:var(--dim);margin-bottom:10px}.sw .table{overflow-x:auto}.sw .track{display:grid;grid-template-columns:190px repeat(16,minmax(25px,1fr));gap:5px;min-width:740px;margin:5px 0;align-items:center}.sw .lane{display:flex;align-items:center;gap:4px;min-width:0}.sw .lane .choose{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.sw .mini{padding:4px;min-width:25px;font-size:10px}.sw .step{height:34px;padding:0;border-radius:4px;background:var(--stepbg);position:relative}.sw .step.quarter{border-left:2px solid var(--dim)}.sw .step.on{background:linear-gradient(0deg,#b76d2e,var(--accent));color:#14191c}.sw .step .velocity{position:absolute;bottom:2px;left:3px;right:3px;background:color-mix(in srgb,var(--bg) 55%,transparent);height:3px;transform-origin:left}.sw .step.now{outline:2px solid var(--ink);outline-offset:1px}.sw .ruler{font-size:10px;text-align:center;color:var(--dim)}.sw .selected .choose{border-color:var(--accent);color:var(--accent)}.sw .editor{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:15px}.sw input[type=range]{width:100%;accent-color:var(--accent);margin:4px 0}.sw output{color:var(--ink);font-size:12px}.sw .scope{width:100%;height:92px;background:var(--screen);border-radius:5px}.sw .bottom{display:grid;grid-template-columns:2fr 1fr;gap:12px}.sw .ports{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sw .jackbox{border:1px solid var(--edge);border-radius:5px;padding:5px;font-size:10px;color:var(--dim)}.sw .notice{font-size:11px;line-height:1.7;color:var(--dim)}.sw .error{color:var(--stop,#ff9386)}.sw .check{flex-direction:row;align-items:center}.sw .stats{color:var(--accent);font-size:11px}.sw .hr{border-top:1px solid var(--edge);margin:13px 0}@container(max-width:700px){.sw .bottom{grid-template-columns:1fr}.sw h1{font-size:26px}.sw .editor{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}}`;
// Uitgangsniveau: een vaste factor op de stereomix en op de kanaaluitgangen. Gemeten met de standaardgroove (10 s, 120 BPM): met .36 lag de piek op −18 dBFS,
// ruim 15 dB onder andere apparaten; met deze waarde op ongeveer −3 dBFS. De verhouding tussen de kanalen verandert niet.
const OUT_TRIM=.36*5.5;
const __pkDef = {
 id:'nl.patchkamer.drumkit',name:'Drum Kit',version:'1.11.1',kind:'instrument',category:'groove',ui:{width:1180,minWidth:480,jacks:true},ports:PORTS,
 i18n:{en:{ports:{multi:'Separate outs (bundle)'}}},
 create(ctx,host){
 const T=TXT[host&&host.lang]||TXT.en;
 let state=makeState(),self,root,el,stopDraw=null,dead=false,playing=false,lastStep=-1,lastTime=0,error='',clipboard=null;
 groove(state,'Punch');
 let mod=Object.create(null),paramList=[],paramIds=new Set(),paramSignature='',modStatus=null;
 const owned=new Set(),sources=new Set(),voices=new Set(),buses=[],meters=[];
 const own=n=>(owned.add(n),n),gain=()=>own(ctx.createGain());
 const mix=gain();mix.gain.value=state.master*OUT_TRIM;
 const mixMeter=own(ctx.createAnalyser());mixMeter.fftSize=512;mix.connect(mixMeter);
 const outputs={mix};
 const noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*2),ctx.sampleRate),nd=noiseBuffer.getChannelData(0);let seed=74133;
 for(let i=0;i<nd.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;nd[i]=seed/2147483648-1;}
 const curves=Array.from({length:41},(_,j)=>{const a=new Float32Array(1024),k=j/40*12;for(let i=0;i<a.length;i++){const x=i/(a.length-1)*2-1;a[i]=k?Math.tanh(x*(1+k))/Math.tanh(1+k):x;}return a;});
 for(let i=0;i<16;i++){
  const filter=own(ctx.createBiquadFilter()),shaper=own(ctx.createWaveShaper()),panner=own(ctx.createStereoPanner()),level=gain(),direct=gain(),send=gain(),meter=own(ctx.createAnalyser());
  meter.fftSize=256;shaper.oversample='2x';filter.connect(shaper).connect(panner).connect(level);level.connect(direct);level.connect(send).connect(mix);level.connect(meter);direct.gain.value=OUT_TRIM;
  outputs['ch'+(i+1)]=direct;buses.push({filter,shaper,panner,level,direct,send});meters.push(meter);
 }
 function refreshParams(notify=true){
  const signature=state.channels.map(c=>c.type+':'+c.model).join('|');
  if(signature===paramSignature)return;
  paramSignature=signature;
  paramList=[{id:'master',name:T.pMaster,lane:'master',laneName:T.pMasterLane,min:0,max:1,scale:'lin',role:'level',drift:.005,on:false}];
  state.channels.forEach((c,i)=>{const lane='ch'+(i+1),family=TYPES[c.type][1],laneName=String(i+1).padStart(2,'0')+' · '+TYPES[c.type][0]+' / '+c.model;
   for(const [key,def] of Object.entries(MOD_DEFS)){
    if(key==='sweep'&&!['kick','tom','zap','metal'].includes(family))continue;
    if(key==='noise'&&family==='bell')continue;
    paramList.push({id:lane+'.'+key,...def,name:T.pn[key]||def.name,lane,laneName});
   }
  });
  paramIds=new Set(paramList.map(p=>p.id));
  for(const key of Object.keys(mod))if(!paramIds.has(key))delete mod[key];
  if(notify&&self&&typeof host.paramsChanged==='function')host.paramsChanged(self);
 }
 function value(base,key,id){const def=key==='master'?{min:0,max:1,scale:'lin'}:MOD_DEFS[key],offset=mod[id]||0;if(!offset)return base;return clamp(def.scale==='log'?base*Math.pow(def.max/def.min,offset):base+offset*(def.max-def.min),def.min,def.max,base);}
 function effective(i){const c=state.channels[i],out={...c};for(const key of Object.keys(MOD_DEFS))out[key]=value(c[key],key,'ch'+(i+1)+'.'+key);return out;}
 function apply(){
  if(dead)return;const solo=state.channels.some(c=>c.solo);
  mix.gain.setTargetAtTime(value(state.master,'master','master')*OUT_TRIM,ctx.currentTime,.02);
  buses.forEach((b,i)=>{if(!state.channels[i]){b.level.gain.setTargetAtTime(0,ctx.currentTime,.01);return;}const c=effective(i);
   b.filter.type=c.filter;b.filter.frequency.setTargetAtTime(Math.min(c.cutoff,ctx.sampleRate*.45),ctx.currentTime,.02);b.filter.Q.setTargetAtTime(c.resonance,ctx.currentTime,.02);
   const curveIndex=Math.round(c.drive*40);if(b.curveIndex!==curveIndex){b.shaper.curve=curves[curveIndex];b.curveIndex=curveIndex;}
   b.panner.pan.setTargetAtTime(c.pan,ctx.currentTime,.02);b.level.gain.setTargetAtTime(c.mute||(solo&&!c.solo)?0:c.level/(1+c.drive*.6),ctx.currentTime,.01);b.send.gain.setTargetAtTime(c.mix?1:0,ctx.currentTime,.01);
  });
 }

 const stopLoop=()=>{if(stopDraw){stopDraw();stopDraw=null;}};
 function fail(e){error='Audio: '+(e?.message||String(e));}
 function release(v,t){try{v.env.gain.cancelScheduledValues(t);v.env.gain.setTargetAtTime(.00001,t,.004);v.src.forEach(s=>{try{s.stop(t+.035);}catch{}});}catch{}}
 function stopAll(){voices.forEach(v=>release(v,ctx.currentTime));}
 function hit(i,time,velocity=1,emit=true){
  if(dead||!state.channels[i])return;const c=effective(i),solo=state.channels.some(c=>c.solo);if(c.mute||(solo&&!c.solo)||velocity<=0)return;
  const t=Math.max(ctx.currentTime,Number.isFinite(time)?time:ctx.currentTime),type=TYPES[c.type],family=type[1],model=MODEL[c.model],pitch=Math.pow(2,c.tune/12),f=type[3]*pitch*model.tone;
  const d=Math.max(.02,c.decay),vel=clamp(velocity,0,1,1),env=gain();const spectral=own(ctx.createBiquadFilter());spectral.type=['hat','cymbal','tamb'].includes(family)?'highpass':'lowpass';spectral.frequency.value=['hat','cymbal','tamb'].includes(family)?1200+c.tone*6000:1500*Math.pow(12,c.tone);spectral.Q.value=.55;env.connect(spectral).connect(buses[i].filter);
  const v={env,src:[],nodes:new Set([env,spectral]),i,choke:c.choke,t};voices.add(v);
  if(c.choke)voices.forEach(o=>{if(o!==v&&o.choke===c.choke&&o.t<=t)release(o,t);});
  while(voices.size>128){const old=voices.values().next().value;release(old,t);voices.delete(old);}
  let amp=(family==='kick'?.9:family==='snare'?.62:.45)*vel;
  env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(amp,t+c.attack);env.gain.exponentialRampToValueAtTime(.00001,t+c.attack+d*1.6);
  const track=n=>{own(n);v.nodes.add(n);return n;};
  const source=(s,end)=>{v.src.push(s);sources.add(s);s.onended=()=>{sources.delete(s);try{s.disconnect();}catch{}owned.delete(s);if(v.src.every(x=>!sources.has(x))){v.nodes.forEach(n=>{try{n.disconnect();}catch{}owned.delete(n);});voices.delete(v);}};s.start(t);s.stop(t+end);};
  const tone=(freq,level=.5,wave='sine',len=d,drop=0,delay=0)=>{const o=track(ctx.createOscillator()),g=track(ctx.createGain());o.type=wave;o.frequency.setValueAtTime(Math.min(freq*(1+drop),20000),t);o.frequency.exponentialRampToValueAtTime(Math.max(12,Math.min(freq,18000)),t+Math.min(len*.55,.25));g.gain.setValueAtTime(.00001,t);g.gain.setValueAtTime(Math.max(.00001,level),t+delay);g.gain.exponentialRampToValueAtTime(.00001,t+Math.max(delay+.01,len));o.connect(g).connect(env);source(o,Math.max(len,d*1.6+c.attack)+.04);};
  const noise=(level,cut,mode='highpass',len=d,delay=0)=>{const n=track(ctx.createBufferSource()),g=track(ctx.createGain()),b=track(ctx.createBiquadFilter());n.buffer=noiseBuffer;n.loop=true;b.type=mode;b.frequency.value=Math.min(cut,ctx.sampleRate*.45);b.Q.value=.7;g.gain.setValueAtTime(.00001,t);g.gain.setValueAtTime(Math.max(.00001,level),t+delay);g.gain.exponentialRampToValueAtTime(.00001,t+Math.max(delay+.01,len));n.connect(b).connect(g).connect(env);source(n,Math.max(len,d*1.6+c.attack)+.04);};
  const acoustic=['Rock','Pop','Jazz','Funk'].includes(c.model),bright=.25+c.tone*.75;
  if(family==='kick'){tone(f,.95,c.model==='Punch'?'triangle':'sine',d, c.sweep*(c.model==='Punch'?7:4));tone(f*1.48,acoustic?.22:.03,'sine',d*.3,c.sweep);noise(c.noise*.6,1700+bright*5500,'highpass',.012+c.tone*.018);}
  else if(family==='snare'){tone(f,.6,'sine',d*.65,.25);tone(f*1.58,acoustic?.35:.16,'triangle',d*.42);noise(c.noise*1.25,800+bright*2600,'highpass',d);if(c.model==='Punch')tone(f*2.2,.13,'triangle',.04);}
  else if(family==='clap'){[0,.012,.025].forEach((del,k)=>noise(c.noise*(k===2?.8:.55),700+bright*1600,'bandpass',k===2?d:.011+del,del));}
  else if(family==='hat'||family==='cymbal'||family==='tamb'||family==='metal'){
   const base=family==='metal'?f:family==='tamb'?f/9:f/20;
   [1,1.342,1.786,2.421,2.891,3.789].forEach((r,j)=>tone(base*r,.1*(.3+c.tone),c.model==='Deep'?'square':'triangle',d*(j%2?.63:1),family==='metal'?c.sweep*2:0));
   noise(c.noise*.8,f*(.35+bright*.4),'highpass',d);if(acoustic&&family==='cymbal')tone(f*.6,.12,'sine',.035);
  }else if(family==='tom'){tone(f,.8,'sine',d,c.sweep*2);tone(f*1.55,acoustic?.28:.1,'sine',d*.55,.13);noise(c.noise*.6,1700+bright*2500,'bandpass',.04);}
  else if(family==='rim'){tone(f,.7,'triangle',d);tone(f*2.63,.25,'sine',d*.55);noise(c.noise,3000,'highpass',.018);}
  else if(family==='bell'){tone(f,.25+c.tone*.25,'square',d);tone(f*1.48,.1+c.tone*.35,'square',d*.7);}
  else if(family==='shaker'||family==='brush'){noise(c.noise, family==='brush'?600+bright*1500:f*.7,'highpass',d);if(family==='brush'){noise(c.tone*.4,2300,'bandpass',d*.7);tone(180*pitch,.09,'sine',.05);}}
  else if(family==='zap'){tone(f,.7,'sawtooth',d,c.sweep*18);tone(f*.5,.4,'sine',d,c.sweep*5);noise(c.noise,3200,'highpass',.04);}
  if(emit)host.emit(self,'trigs',{type:'trig',lane:'ch'+(i+1),instrument:c.type,note:c.note,vel,time:t});
 }
 function safeHit(...a){try{hit(...a);}catch(e){fail(e);}}
 function cleanChannel(x,i){const ty=TYPES[x?.type]?x.type:'kick',mo=MODELS.includes(x?.model)?x.model:'Deep',c=lane(ty,mo,i);for(const [k,a,b] of [['note',0,127],['tune',-24,24],['decay',.02,4],['tone',0,1],['noise',0,1],['sweep',0,1],['attack',.001,.15],['cutoff',30,20000],['resonance',.1,12],['drive',0,1],['level',0,1],['pan',-1,1],['choke',0,4]])c[k]=clamp(x?.[k],a,b,c[k]);c.note=Math.round(c.note);c.choke=Math.round(c.choke);for(const k of ['mute','solo','mix'])if(typeof x?.[k]==='boolean')c[k]=x[k];c.filter=['lowpass','highpass','bandpass','notch'].includes(x?.filter)?x.filter:'lowpass';if(Array.isArray(x?.steps))c.steps=Array.from({length:4},(_,p)=>Array.from({length:64},(_,j)=>{const z=x.steps[p]?.[j];return {v:clamp(z?.v,0,1,0),p:clamp(z?.p,0,1,1),r:Math.round(clamp(z?.r,1,4,1))};}));return c;}
 function restore(s){const d=makeState();state={...d};state.kit=typeof s?.kit==='string'?s.kit.slice(0,40):d.kit;state.channels=Array.isArray(s?.channels)&&s.channels.length?s.channels.slice(0,16).map(cleanChannel):d.channels;
 for(const [k,a,b] of [['length',1,64],['pattern',0,3],['bank',0,3],['selected',0,state.channels.length-1],['master',0,1],['human',0,.025],['editVelocity',.05,1],['editProbability',0,1],['editRatchet',1,4]])state[k]=clamp(s?.[k],a,b,d[k]);for(const k of ['length','pattern','bank','selected','editRatchet'])state[k]=Math.round(state[k]);state.run=typeof s?.run==='boolean'?s.run:true;
 state.presets=Array.isArray(s?.presets)?s.presets.slice(0,24).filter(p=>p&&typeof p.name==='string'&&Array.isArray(p.channels)).map(p=>({name:p.name.slice(0,32),channels:p.channels.slice(0,16).map(cleanChannel)})):[];stopAll();apply();render();}
 function setCount(n){n=Math.round(clamp(n,1,16,11));stopAll();while(state.channels.length<n)state.channels.push(lane('kick','Deep'));state.channels.length=n;state.selected=Math.min(state.selected,n-1);state.kit='Custom';apply();render();}
 function changeSound(i,type,model){const old=state.channels[i],fresh=lane(type,model,i);['steps','level','pan','mute','solo','mix'].forEach(k=>fresh[k]=old[k]);state.channels[i]=fresh;state.kit='Custom';releaseLane(i);apply();render();}
 function releaseLane(i){voices.forEach(v=>{if(v.i===i)release(v,ctx.currentTime);});}
 function loadKit(key){stopAll();const old=state.channels;state.channels=KIT[key].map((type,i)=>{const c=lane(type,key,i);if(old[i])c.steps=copy(old[i].steps);return c;});state.kit=key;state.selected=Math.min(state.selected,state.channels.length-1);apply();render();}
 function node(tag,parent,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;}
 function button(parent,text,fn,cls=''){const b=node('button',parent,text,cls);b.type='button';b.onclick=fn;return b;}
 function select(parent,label,options,value,fn){const l=node('label',parent,label),s=node('select',l);options.forEach(([v,n])=>{const o=node('option',s,n);o.value=String(v);});s.value=String(value);s.onchange=()=>fn(s.value);return s;}
 function range(parent,label,value,min,max,step,fn,fmt=v=>v.toFixed(2)){const l=node('label',parent,label),o=node('output',l,fmt(value)),r=node('input',l);r.type='range';r.min=min;r.max=max;r.step=step;r.value=value;r.oninput=()=>{o.textContent=fmt(+r.value);fn(+r.value);};return r;}
 function check(parent,label,value,fn){const l=node('label',parent,undefined,'check'),r=node('input',l);r.type='checkbox';r.checked=value;node('span',l,label);r.onchange=()=>fn(r.checked);}
 let stepButtons=[],cursorLabels=[],scope,status;
 let bundleSig='';
 function bundleNotify(){const sig=state.channels.map(c=>c.type).join('|');if(sig===bundleSig)return;bundleSig=sig;if(self&&typeof host.bundleChanged==='function')try{host.bundleChanged(self,'multi');}catch(e){}}
 function render(){refreshParams();bundleNotify();if(!root)return;root.replaceChildren();const style=node('style',root);style.textContent=CSS;const app=node('div',root,undefined,'sw');
 const top=node('div',app,undefined,'top'),brand=node('div',top,undefined,'brand');node('small',brand,'PATCHKAMER · DRUM WORKSTATION');node('h1',brand,'DRUM KIT');node('span',top,T.tag,'tag');
 const toolbar=node('div',app,undefined,'toolbar');select(toolbar,T.factory,MODELS.map(x=>[x,x]).concat([['Custom',T.custom]]),KIT[state.kit]?state.kit:'Custom',x=>{if(KIT[x])loadKit(x);});select(toolbar,T.channels,Array.from({length:16},(_,i)=>[i+1,String(i+1)]),state.channels.length,x=>setCount(+x));button(toolbar,'Demo groove',()=>{groove(state,KIT[state.kit]?state.kit:'Punch');render();});button(toolbar,state.run?T.seqOn:T.seqOff,()=>{state.run=!state.run;if(!state.run)stopAll();render();},state.run?'active':'');
 range(toolbar,'MASTER',state.master,0,1,.01,v=>{state.master=v;apply();},v=>Math.round(v*100)+'%');range(toolbar,'HUMANIZE',state.human,0,.025,.001,v=>state.human=v,v=>Math.round(v*1000)+' ms');
 const seq=node('div',app,undefined,'section');const seqbar=node('div',seq,undefined,'row');node('span',seqbar,'PATTERN','caption');['A','B','C','D'].forEach((x,i)=>button(seqbar,x,()=>{state.pattern=i;render();},state.pattern===i?'active':''));select(seqbar,T.length,[[16,'16 '+T.steps],[32,'32 '+T.steps],[64,'64 '+T.steps]],state.length,v=>{state.length=+v;state.bank=0;render();});select(seqbar,T.page,Array.from({length:Math.ceil(state.length/16)},(_,i)=>[i,`${i*16+1}–${Math.min(i*16+16,state.length)}`]),state.bank,v=>{state.bank=+v;render();});button(seqbar,T.copy,()=>{clipboard=state.channels.map(c=>copy(c.steps[state.pattern]));});button(seqbar,T.paste,()=>{if(clipboard){state.channels.forEach((c,i)=>{if(clipboard[i])c.steps[state.pattern]=copy(clipboard[i]);});render();}});button(seqbar,T.clear,()=>{state.channels.forEach(c=>c.steps[state.pattern]=Array.from({length:64},cell));render();});
 const table=node('div',seq,undefined,'table'),ruler=node('div',table,undefined,'track');node('span',ruler,T.chRuler,'ruler');cursorLabels=[];for(let j=0;j<16;j++)cursorLabels.push(node('span',ruler,String(state.bank*16+j+1),'ruler'));
 stepButtons=[];state.channels.forEach((c,i)=>{const row=node('div',table,undefined,'track'+(i===state.selected?' selected':'')),label=node('div',row,undefined,'lane');button(label,`${String(i+1).padStart(2,'0')} ${TYPES[c.type][0]}`,()=>{state.selected=i;render();},'choose');button(label,'M',()=>{c.mute=!c.mute;apply();render();},'mini'+(c.mute?' active':''));button(label,'S',()=>{c.solo=!c.solo;apply();render();},'mini'+(c.solo?' active':''));const btns=[];for(let j=0;j<16;j++){const k=state.bank*16+j,z=c.steps[state.pattern][k],b=button(row,z.r>1?String(z.r):'',ev=>{if(ev?.shiftKey){z.v=state.editVelocity;z.p=state.editProbability;z.r=state.editRatchet;}else if(z.v)z.v=0;else Object.assign(z,{v:state.editVelocity,p:state.editProbability,r:state.editRatchet});paintStep(b,z,k);},'step');b.disabled=k>=state.length;b.oncontextmenu=e=>{e.preventDefault();Object.assign(z,{v:state.editVelocity,p:state.editProbability,r:state.editRatchet});paintStep(b,z,k);};paintStep(b,z,k);btns.push(b);}stepButtons.push(btns);});
 const edit=node('div',seq,undefined,'toolbar');range(edit,T.editVel,state.editVelocity,.05,1,.05,v=>state.editVelocity=v,v=>Math.round(v*100)+'%');range(edit,T.editProb,state.editProbability,0,1,.05,v=>state.editProbability=v,v=>Math.round(v*100)+'%');select(edit,'RATCHET',[[1,'1 ×'],[2,'2 ×'],[3,'3 ×'],[4,'4 ×']],state.editRatchet,v=>state.editRatchet=+v);node('span',edit,T.hint,'notice');
 const c=state.channels[state.selected],family=TYPES[c.type][1],section=node('div',app,undefined,'section'),header=node('div',section,undefined,'top');node('span',header,T.chCap(state.selected+1,TYPES[c.type][0].toUpperCase()),'caption');button(header,T.audition,()=>safeHit(state.selected,ctx.currentTime,.9));
 const choices=node('div',section,undefined,'toolbar');select(choices,'INSTRUMENT',Object.entries(TYPES).map(([k,t])=>[k,t[0]]),c.type,v=>changeSound(state.selected,v,c.model));select(choices,T.soundModel,MODELS.map(x=>[x,x]),c.model,v=>changeSound(state.selected,c.type,v));select(choices,'FILTER',[['lowpass','Low-pass'],['highpass','High-pass'],['bandpass','Band-pass'],['notch','Notch']],c.filter,v=>{c.filter=v;apply();});select(choices,T.choke,[[0,T.none],[1,'1 · '+T.hats],[2,'2'],[3,'3'],[4,'4']],c.choke,v=>c.choke=+v);const ml=node('label',choices,'MIDI NOTE'),mi=node('input',ml);mi.type='number';mi.min=0;mi.max=127;mi.value=c.note;mi.onchange=()=>{c.note=Math.round(clamp(mi.value,0,127,c.note));mi.value=c.note;};
 const controls=node('div',section,undefined,'editor'),pct=v=>Math.round(v*100)+'%',ms=v=>v<1?Math.round(v*1000)+' ms':v.toFixed(2)+' s';const control=(key,label,min,max,step,fmt)=>range(controls,label,c[key],min,max,step,v=>{c[key]=v;apply();},fmt);
 control('tune','TUNING',-24,24,.1,v=>(v>0?'+':'')+v.toFixed(1)+' st');control('decay','DECAY',.02,4,.005,ms);control('attack','ATTACK',.001,.15,.001,ms);
 if(['kick','tom','zap','metal'].includes(family))control('sweep',family==='kick'?'PITCH ENVELOPE':'PITCH SWEEP',0,1,.01,pct);
 control('tone',family==='snare'?T.body:family==='hat'||family==='cymbal'?T.metallic:T.toneAttack,0,1,.01,pct);
 if(!['bell'].includes(family))control('noise',family==='snare'?T.wires:family==='kick'?T.beater:T.noiseTex,0,1,.01,pct);
 range(controls,'FILTER CUTOFF',Math.log2(c.cutoff),Math.log2(30),Math.log2(20000),.01,v=>{c.cutoff=Math.pow(2,v);apply();},v=>{const f=Math.pow(2,v);return f>=1000?(f/1000).toFixed(1)+' kHz':Math.round(f)+' Hz';});control('resonance',T.res,.1,12,.1,v=>v.toFixed(1));control('drive','DRIVE',0,1,.01,pct);control('level',T.level,0,1,.01,pct);control('pan','PAN',-1,1,.01,v=>v===0?T.center:Math.round(Math.abs(v)*100)+(v<0?' L':' R'));check(controls,T.inMix,c.mix,v=>{c.mix=v;apply();});
 const bottom=node('div',app,undefined,'bottom'),viz=node('div',bottom,undefined,'section');node('div',viz,T.scopeCap,'caption');scope=node('canvas',viz,undefined,'scope');scope.width=800;scope.height=120;status=node('div',viz,T.hostStart,'stats');
 const presets=node('div',bottom,undefined,'section');node('div',presets,T.kitPresets,'caption');const pr=node('div',presets,undefined,'row'),name=node('input',pr);name.type='text';name.placeholder=T.kitName;name.maxLength=32;name.setAttribute('aria-label',T.presetName);button(pr,T.save,()=>{const nm=name.value.trim();if(!nm)return;const p={name:nm,channels:copy(state.channels)};const i=state.presets.findIndex(x=>x.name===nm);if(i>=0)state.presets[i]=p;else if(state.presets.length<24)state.presets.push(p);render();});if(state.presets.length){select(presets,T.savedKits,state.presets.map((p,i)=>[i,p.name]),0,()=>{});const pick=presets.querySelector('select');button(presets,T.loadKit,()=>{const p=state.presets[+pick.value];if(!p)return;stopAll();state.channels=p.channels.map((x,i)=>{const c=cleanChannel(x,i);if(state.channels[i])c.steps=copy(state.channels[i].steps);return c;});state.kit=p.name;state.selected=0;apply();render();});button(presets,T.del,()=>{state.presets.splice(+pick.value,1);render();});}
 node('p',presets,T.presetNote,'notice');
 const ports=node('div',app,undefined,'section');node('div',ports,T.patchbay,'caption');const pp=node('div',ports,undefined,'ports');for(const p of PORTS.audioOut){const box=node('div',pp,undefined,'jackbox');host.ui.jack(self,box,p.id,'out',p.id==='mix'?T.jackMix:`${p.id} · ${state.channels[+p.id.slice(2)-1]?TYPES[state.channels[+p.id.slice(2)-1].type][0]:T.empty}`);}host.ui.jack(self,pp,'multi','out',T.jackMulti);host.ui.jack(self,pp,'trigger','in','MIDI / TRIG');host.ui.jack(self,pp,'trigs','out','TRIG OUT');host.ui.jack(self,pp,'mod','in','MOD');
 modStatus=node('div',ports,T.modNone,'stats');
 node('p',ports,T.modNote,'notice');
 node('p',app,T.bundleNote,'notice');node('p',app,T.modelNote,'notice');
 }
 function paintStep(b,z,k){b.className='step'+(k%4===0?' quarter':'')+(z.v?' on':'');b.textContent=z.r>1&&z.v?String(z.r):'';const m=node('span',b,undefined,'velocity');m.style.transform=`scaleX(${z.v})`;b.style.opacity=z.v?String(.5+z.v*.5):'1';b.title=T.stepTitle(k+1,Math.round(z.v*100),Math.round(z.p*100),z.r);b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',z.v?'true':'false');}
 const scopeData=new Float32Array(512),meterData=new Float32Array(256),pending=[];
 let col=null,colAt=0;
 function colors(){if(col&&colAt++%30)return col;const cs=scope?getComputedStyle(scope):null,g=(k,d)=>(cs&&cs.getPropertyValue(k).trim())||d;col={screen:g('--screen','#101618'),line:g('--edge','#334149'),accent:g('--accent','#f6b85c'),bar:g('--panel','#29363c'),meter:g('--go','#92c8b1'),clip:g('--stop','#ff7060'),dim:g('--dim','#9aa9ad')};return col;}
 function animate(){if(dead||!root)return;const now=ctx.currentTime;while(pending.length&&pending[0].time<=now){const p=pending.shift();lastStep=p.step;lastTime=p.time;}stepButtons.forEach(btns=>btns.forEach((b,j)=>b.classList.toggle('now',playing&&state.run&&state.bank*16+j===lastStep)));if(scope){const g=scope.getContext('2d'),C=colors();mixMeter.getFloatTimeDomainData(scopeData);g.fillStyle=C.screen;g.fillRect(0,0,800,120);g.strokeStyle=C.line;g.beginPath();g.moveTo(0,38);g.lineTo(800,38);g.stroke();g.strokeStyle=C.accent;g.beginPath();for(let j=0;j<512;j++){const x=j/511*800,y=38+scopeData[j]*90;j?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();for(let i=0;i<state.channels.length;i++){meters[i].getFloatTimeDomainData(meterData);let peak=0;for(const x of meterData)peak=Math.max(peak,Math.abs(x));const w=800/state.channels.length;g.fillStyle=C.bar;g.fillRect(i*w+3,82,w-6,20);g.fillStyle=peak>1?C.clip:C.meter;g.fillRect(i*w+3,82,(w-6)*Math.min(1,peak),20);g.fillStyle=C.dim;g.font='9px monospace';g.fillText(String(i+1),i*w+4,115);}}
 if(modStatus){const count=Object.values(mod).filter(v=>v!==0).length;modStatus.textContent=count?T.modActive(count):T.modNone;}
 if(status){status.textContent=error||(playing&&state.run?T.play(lastStep+1,state.length):T.hostStart);status.className=error?'error':'stats';}}
 self={inputs:{},outputs,
 // contract v1.5: één bundel met de actieve kanalen (zelfde nodes als de uitgangen ch1…ch16)
 bundles:{multi:()=>({label:T.multi,channels:state.channels.map((c,i)=>({id:'ch'+(i+1),name:String(i+1).padStart(2,'0')+' · '+TYPES[c.type][0],node:buses[i].direct}))})},
 // contract v1.6: preset = klank, kanalen en patronen; je eigen kitlijst en edit-instellingen blijven staan
 getPreset(){const s=copy(state);PRESET_SKIP.forEach(k=>delete s[k]);return s;},
 setPreset(p){const keep={};PRESET_SKIP.forEach(k=>keep[k]=copy(state[k]));restore({...(p&&typeof p==='object'?p:{}),...keep});},
 params(){return paramList.map(p=>({...p}));},
 modulate(offsets){if(dead)return;const next=Object.create(null);if(offsets&&typeof offsets==='object'&&!Array.isArray(offsets))for(const p of paramList){const v=offsets[p.id];if(typeof v==='number'&&Number.isFinite(v))next[p.id]=clamp(v,-1,1,0);}mod=next;apply();},
 mount(container){el=container;const wrap=document.createElement('div');el.appendChild(wrap);root=wrap;render();stopLoop();stopDraw=tekenLus(host,self,animate,30);animate();},
 unmount(){stopLoop();root=null;scope=null;status=null;modStatus=null;stepButtons=[];},
 onStep(info){try{if(dead||!state.run)return;const {step,bar,time,stepDur}=info,idx=((bar*16+step)%state.length+state.length)%state.length;pending.push({step:idx,time});if(pending.length>128)pending.shift();state.channels.forEach((c,i)=>{const z=c.steps[state.pattern][idx];if(z.v>0&&Math.random()<=z.p)for(let r=0;r<z.r;r++){const offset=state.human*Math.random(),v=z.v*(1-state.human*4*Math.random());hit(i,time+r*stepDur/z.r+offset,v);}});}catch(e){fail(e);}},
 onTransport({playing:p}){playing=!!p;if(!playing){stopAll();pending.length=0;lastStep=-1;}},
 onEvent(port,ev){try{if(dead||port!=='trigger'||!ev)return;const t=Number.isFinite(ev.time)?ev.time:ctx.currentTime;if(ev.type==='trig'){let i=/^ch\d+$/.test(ev.lane)?+ev.lane.slice(2)-1:state.channels.findIndex(c=>c.type===ev.lane);if(i>=0)hit(i,t,ev.vel??1);}else if(ev.type==='note'&&ev.vel>0){state.channels.forEach((c,i)=>{if(c.note===Math.round(ev.note))hit(i,t,ev.vel);});}else if(ev.type==='cc'){const v=clamp(ev.value,0,1),m=/^ch(\d+)\.(cutoff|resonance|level|pan|drive|tune)$/.exec(ev.id);if(m&&state.channels[+m[1]-1]){const c=state.channels[+m[1]-1],k=m[2];c[k]=k==='cutoff'?30*Math.pow(20000/30,v):k==='resonance'?.1+v*11.9:k==='pan'?v*2-1:k==='tune'?v*48-24:v;apply();}else if(ev.id==='master'){state.master=v;apply();}}}catch(e){fail(e);}},
 getState(){return copy(state);},setState(s){restore(s||{});},
 destroy(){if(dead)return;dead=true;self.unmount();sources.forEach(n=>{try{n.stop();}catch{}});sources.clear();owned.forEach(n=>{try{n.disconnect();}catch{}});owned.clear();voices.clear();pending.length=0;}
 };refreshParams(false);apply();return self;
 }
};
export default __pkDef;
