// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.17.0 — Compacte skin mogelijk (skins/library/nl.patchkamer.bowedensemble): kop, groepskoppen en statusregel krijgen class sk-x en verdwijnen alleen als een skin de regelaars een ander gezicht geeft (data-pk-face); zonder skin ongewijzigd. Geluid, state, presets, poorten en ids ongewijzigd.
// 1.16.0 — Uitleg naar about (menu Over Bowed Ensemble); de UI toont geen uitlegtekst meer.
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — Versterking (+8 dB) achter de compressor: het apparaat en de tunes waren erg zacht (piek rond −14 tot −7 dBFS bij vierstemmige akkoorden). De uitgangsbegrenzer blijft de pieken afronden.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Bowed Ensemble (nieuwe id nl.patchkamer.bowedensemble, eigen map; voorheen Strijk Ensemble, nl.patchkamer.strijk);
//   songs uit die tijd verwijzen naar de oude id en laden hier niet in. Het geluid is bit-identiek aan het oude bestand.
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Bowed Ensemble; de preset-namen zijn Engels
//     (Fluwelen Strijkers is Velvet Strings, Donkere Celli is Dark Cellos, Eigen is Custom; de oude namen worden bij het laden herkend)
//   - setState volgt §13: onbekende velden worden genegeerd, ontbrekende of ongeldige waarden krijgen de standaard, getallen worden afgekapt
//   - dubbelklik op een regelaar zet hem terug op de beginwaarde (via host.ui.knob); kleuren volgen de CSS-variabelen van de host
//   - bewaker tegen een ontspoord filter: de ruwe som van de stemmen en de uitgang van de compressor worden gevolgd; geeft een van beide een
//     niet-eindige of absurde waarde, dan worden de stemfilters, de drie filters daarachter, de galm en de compressor (die hun toestand voor
//     altijd houden) vervangen. Normaal geluid blijft bit-identiek.
//   - de uitgangsvervormer volgt host.audio.oversample (§12c)
/** Bowed Ensemble — a polyphonic strings ensemble. Stereo; 16 fixed voices, 4 oscillators + bow noise per voice.
 * The note input accepts {type:'note',note,vel,time,dur} from any keyboard/sequencer. Extra noteon/noteoff and
 * note-without-dur support held keys. No internal sequencer and no sound until an event arrives. Transport stop and
 * panic release/cancel held and future notes. The purple mod input exposes 20 controls.
 * ADSR respects short gates; modulation changes base-independent timbre/expression, while ADSR settings affect
 * subsequent notes. All resources belong to the supplied ctx.
 */
const EN = {
  'Helderheid': 'Brightness', 'Resonantie': 'Resonance', 'Corpus': 'Body', 'Strijkstok / lucht': 'Bow / air', 'Ensemblezweving': 'Ensemble detune',
  'Stereobreedte': 'Stereo width', 'Vibratosnelheid': 'Vibrato rate', 'Organische drift': 'Organic drift', 'Concertgalm': 'Hall',
  'Balans': 'Balance', 'Expressie': 'Expression', 'Uitgang': 'Output', 'Opkomst': 'Attack', 'Uitklank': 'Release',
  'Aanslaggevoeligheid': 'Touch response', 'Transpositie': 'Transpose',
  'Klank & articulatie': 'Sound & articulation', 'Ensemble & ruimte': 'Ensemble & space', 'Spel & niveau': 'Playing & level',
  'Eigen klank': 'Custom sound', 'Proefakkoord': 'Test chord', 'Alles uit': 'All off', 'Midden': 'Centre',
  'BOWED ENSEMBLE · polyfoon strijkersensemble': 'BOWED ENSEMBLE · polyphonic strings ensemble',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  '16-stemmig · keyboard/sequencer → oranje Noten · stereo uit → mixer': '16 voices · keyboard/sequencer → orange Notes · stereo out → mixer'
};
export default {
  id:'nl.patchkamer.bowedensemble',name:'Bowed Ensemble',version:'1.17.0',kind:'instrument',
  about:{nl:'Een polyfoon strijkersensemble: stereo, 16 vaste stemmen, per stem 4 oscillatoren plus strijkruis. Er is geen interne sequencer en er klinkt niets totdat er een noot binnenkomt.\n\nSpeelt alleen ontvangen noten. Note + dur werkt met sequencers; noteon/noteoff met aangehouden toetsen. Expressie maakt swells. Een paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis. MIDI-hardware sluit je via een keyboard/MIDI-apparaat van Patchkamer aan.\n\nSluit een keyboard of sequencer aan op de oranje Noten-ingang en de stereo-uitgang op een mixer.',en:'A polyphonic strings ensemble: stereo, 16 fixed voices, 4 oscillators plus bow noise per voice. There is no internal sequencer and nothing sounds until a note arrives.\n\nPlays received notes only. Note + dur works with sequencers; noteon/noteoff with held keys. Expression makes swells. A purple Mod cable controls sound parameters; the knobs stay the base. Connect MIDI hardware through a keyboard/MIDI device in Patchkamer.\n\nConnect a keyboard or sequencer to the orange Notes input and the stereo output to a mixer.'},
  category:'synth',
  ui:{width:720,minWidth:340},
  ports:{audioIn:[],audioOut:[{id:'out',name:'Stereo strings'}],eventIn:[{id:'notes',name:'Keyboard / notes'}],eventOut:[],modIn:[{id:'mod',name:'Mod'}],modOut:[]},
  i18n:{nl:{ports:{out:'Stereo strijkers',notes:'Keyboard / noten'}}},
  create(ctx,host){
    const tx=(k,...a)=>{let t=host.lang==='nl'?k:(EN[k]??k);a.forEach((v,i)=>{t=t.replace('{'+i+'}',v);});return t;};
    const spec={
      cutoff:['Helderheid',200,14000,10,4200,'Hz','log','filter',0.025,true],resonance:['Resonantie',0.2,3,0.1,0.7,'Q','lin','res',0.01,false],
      body:['Corpus',0,1,0.01,0.55,'%','lin','color',0.025,true],bow:['Strijkstok / lucht',0,1,0.01,0.14,'%','lin','texture',0.02,true],
      detune:['Ensemblezweving',0,20,0.1,6,'cent','lin','pitch',0.015,true],width:['Stereobreedte',0,1,0.01,0.8,'%','lin','pan',0.02,true],
      vibrato:['Vibrato',0,1,0.01,0.2,'%','lin','pitch',0.015,true],rate:['Vibratosnelheid',3,8,0.1,5.1,'Hz','log','motion',0.01,false],
      human:['Organische drift',0,1,0.01,0.35,'%','lin','pitch',0.02,true],ensemble:['Chorus',0,1,0.01,0.5,'%','lin','motion',0.025,true],
      space:['Concertgalm',0,1,0.01,0.3,'%','lin','space',0.025,true],pan:['Balans',-1,1,0.01,0,'pan','lin','pan',0.015,false],
      expression:['Expressie',0,1,0.01,0.9,'%','lin','level',0.025,true],level:['Uitgang',0,1,0.01,0.8,'%','lin','level',0.015,false],
      attack:['Opkomst',0.005,5,0.005,0.32,'s','log','env',0.02,false],decay:['Decay',0.03,4,0.01,0.8,'s','log','env',0.02,false],
      sustain:['Sustain',0,1,0.01,0.82,'%','lin','env',0.02,false],release:['Uitklank',0.05,12,0.05,1.8,'s','log','decay',0.02,false],
      velocity:['Aanslaggevoeligheid',0,1,0.01,0.7,'%','lin','level',0.015,false],transpose:['Transpositie',-24,24,1,0,'st','lin','pitch',0.001,false]
    };
    for(const d of Object.values(spec))d[0]=tx(d[0]);
    const defaults=Object.fromEntries(Object.entries(spec).map(([k,d])=>[k,d[4]]));defaults.preset='Chamber Ensemble';
    const presets={
      'Chamber Ensemble':{},
      'Cinematic Strings':{cutoff:6500,body:0.65,bow:0.22,attack:0.55,release:3.4,ensemble:0.65,space:0.6,detune:7,width:1},
      'Velvet Strings':{cutoff:2200,body:0.9,bow:0.04,attack:0.8,release:3.2,space:0.45,detune:4},
      'Vintage String Machine':{cutoff:5200,body:0.25,bow:0,attack:0.12,release:1.5,vibrato:0.12,ensemble:0.95,detune:8,space:0.2},
      'Disco Strings':{cutoff:8000,body:0.35,bow:0.1,attack:0.035,decay:0.35,sustain:0.7,release:0.35,ensemble:0.7,space:0.2},
      'Slow Bloom':{cutoff:3200,body:0.7,bow:0.08,attack:3.2,decay:1.5,sustain:1,release:7,space:0.75,ensemble:0.8,human:0.5},
      'Spiccato':{cutoff:7500,body:0.4,bow:0.55,attack:0.01,decay:0.18,sustain:0.18,release:0.15,ensemble:0.2,space:0.18},
      'Pizzicato':{cutoff:5200,body:0.85,bow:0.02,attack:0.005,decay:0.24,sustain:0,release:0.2,ensemble:0.15,space:0.25,vibrato:0.02},
      'Dark Cellos':{transpose:-12,cutoff:2600,body:0.85,bow:0.2,attack:0.22,release:1.9,detune:4.5,vibrato:0.35,ensemble:0.3,space:0.35},
      'Glass Strings':{cutoff:11500,body:0.1,bow:0.08,attack:0.65,release:4.5,detune:9,ensemble:0.8,space:0.65,width:1},
      'Wide Legato':{cutoff:4000,body:0.7,attack:0.18,release:1.6,detune:5.5,ensemble:0.65,space:0.35,width:1,vibrato:0.3},
      'String Lead':{cutoff:7200,resonance:1.1,body:0.4,attack:0.03,release:0.4,detune:3,ensemble:0.3,space:0.2,vibrato:0.4,width:0.35}
    };
    // namen uit het oude bestand worden bij het laden van een state herkend
    const legacy={'Eigen':'Custom','Fluwelen Strijkers':'Velvet Strings','Donkere Celli':'Dark Cellos'};
    let state={...defaults},effective={},mod={},dead=false,root=null,controls={},presetSelect=null,status=null;
    const nodes=new Set(),sources=new Set(),voices=[];
    const own=n=>{nodes.add(n);return n;},gain=v=>{const n=own(ctx.createGain());n.gain.value=v;return n;};
    const biquad=(type,f,q=0.7)=>{const n=own(ctx.createBiquadFilter());n.type=type;n.frequency.value=f;n.Q.value=q;return n;};
    const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),hz=n=>440*2**((n-69)/12),target=(p,v,t=ctx.currentTime)=>p.setTargetAtTime(v,t,0.035);
    const start=(n,...args)=>{sources.add(n);n.start(...args);return n;};
    let seed=0x53545247;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;};
    const noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*3),ctx.sampleRate),noiseData=noiseBuffer.getChannelData(0);for(let i=0;i<noiseData.length;i++)noiseData[i]=random();
    const ir=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*5.5),ctx.sampleRate);for(let c=0;c<2;c++){const a=ir.getChannelData(c);let low=0;for(let i=0;i<a.length;i++){low=0.55*low+0.45*random();a[i]=low*Math.min(1,i/(ctx.sampleRate*0.014))*Math.exp(-i/(ctx.sampleRate*0.92))*0.45;}}
    const bus=gain(1.8),chorusDry=gain(0.8),chorusWet=gain(0.4),sum=gain(1);
    let hp,body,presence,mon=null;
    // de drie filters achter de stemmen: ze houden hun toestand, dus de bewaker kan ze vervangen
    function makeTail(){
      for(const n of [hp,body,presence])if(n){try{n.disconnect();}catch{}nodes.delete(n);}
      try{bus.disconnect();}catch{}
      hp=biquad('highpass',35);body=biquad('peaking',330,0.65);presence=biquad('peaking',2100,0.8);
      bus.connect(hp).connect(body).connect(presence);presence.connect(chorusDry);
      for(const c of chorus)presence.connect(c.delay);
      if(mon)bus.connect(mon);
    }
    const chorus=[];
    bus.connect(hp=biquad('highpass',35)).connect(body=biquad('peaking',330,0.65)).connect(presence=biquad('peaking',2100,0.8));presence.connect(chorusDry).connect(sum);
    for(let j=0;j<3;j++){const d=own(ctx.createDelay(0.1)),lfo=own(ctx.createOscillator()),depth=gain(0.004),pan=own(ctx.createStereoPanner()),tap=gain(0.34);d.delayTime.value=0.018+j*0.006;lfo.frequency.value=[0.21,0.37,0.63][j];lfo.connect(depth).connect(d.delayTime);presence.connect(d).connect(pan).connect(tap).connect(chorusWet);start(lfo);chorus.push({depth,pan,j,delay:d});}chorusWet.connect(sum);
    const dry=gain(0.9),roomGain=gain(0.25),trim=gain(2.5),expression=gain(0.9),pan=own(ctx.createStereoPanner()),volume=gain(0.8),out=own(ctx.createWaveShaper());
    let room=null,compressor=null;
    // galm en compressor houden hun toestand; de bewaker kan ze vervangen
    function makeCore(){
      for(const n of [room,compressor])if(n){try{n.disconnect();}catch{}nodes.delete(n);}
      try{sum.disconnect(room);}catch{}try{dry.disconnect();}catch{}try{roomGain.disconnect();}catch{}
      room=own(ctx.createConvolver());room.buffer=ir;compressor=own(ctx.createDynamicsCompressor());
      sum.connect(dry).connect(compressor);sum.connect(room).connect(roomGain).connect(compressor);compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=3;compressor.attack.value=0.012;compressor.release.value=0.3;
      compressor.connect(trim);
    }
    makeCore();
    trim.connect(expression).connect(pan).connect(volume).connect(out);  // +8 dB versterking na de compressor: de strijkers waren erg zacht
    const curve=new Float32Array(4097);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=0.9*Math.tanh(x/0.9);}out.curve=curve;out.oversample=(host.audio&&host.audio.oversample)||'2x';
    const vibrato=own(ctx.createOscillator()),vibratoDepth=gain(4),drift=own(ctx.createOscillator()),driftDepth=gain(1);vibrato.frequency.value=5.1;drift.frequency.value=0.173;vibrato.connect(vibratoDepth);drift.connect(driftDepth);start(vibrato);start(drift);
    // Fixed pool: no resource growth during rapid sequences or voice stealing.
    for(let i=0;i<16;i++){
      const envelope=gain(0),panner=own(ctx.createStereoPanner()),filter=biquad('lowpass',4200),noise=own(ctx.createBufferSource()),bowFilter=biquad('bandpass',3800,0.6),bowGain=gain(0.01),oscs=[],mix=[];
      filter.connect(envelope).connect(panner).connect(bus);noise.buffer=noiseBuffer;noise.loop=true;noise.connect(bowFilter).connect(bowGain).connect(filter);start(noise,ctx.currentTime,(i*0.173)%3);
      for(let j=0;j<4;j++){const o=own(ctx.createOscillator()),g=gain(j===3?0.2:0.3);o.type=j===3?'triangle':'sawtooth';o.frequency.value=220;vibratoDepth.connect(o.detune);driftDepth.connect(o.detune);o.connect(g).connect(filter);start(o);oscs.push(o);mix.push(g);}
      voices.push({envelope,panner,filter,bowGain,oscs,mix,index:i,note:60,t0:-1,off:-1,until:0,peak:0,attack:0.32,decay:0.8,sustain:0.82});
    }
    function resolve(){const result={...state};for(const [id,d] of Object.entries(spec)){const offset=mod[id]||0;result[id]=clamp(d[6]==='log'?state[id]*(d[2]/d[1])**offset:state[id]+offset*(d[2]-d[1]),d[1],d[2]);}return result;}
    function voiceTone(v,t=ctx.currentTime){
      const spread=[-1,-0.2,1,0.15];for(let j=0;j<4;j++){target(v.oscs[j].detune,effective.transpose*100+spread[j]*effective.detune,t);target(v.mix[j].gain,j===3?effective.body*0.45:[0.48,0.32,0.2][j]*(1-effective.body*0.25),t);}
      target(v.filter.frequency,Math.min(ctx.sampleRate*0.45,effective.cutoff*2**((v.note-60)/48)),t);target(v.filter.Q,effective.resonance,t);target(v.bowGain.gain,effective.bow*0.045,t);target(v.panner.pan,((v.index%7)/6*2-1)*effective.width*0.72,t);
    }
    function apply(t=ctx.currentTime){if(dead)return;effective=resolve();target(volume.gain,effective.level,t);target(expression.gain,effective.expression,t);target(pan.pan,effective.pan,t);target(body.gain,effective.body*5-1,t);target(presence.gain,-1.5-effective.body*2,t);target(vibrato.frequency,effective.rate,t);target(vibratoDepth.gain,effective.vibrato*20,t);target(driftDepth.gain,effective.human*3.5,t);
      target(chorusDry.gain,1-effective.ensemble*0.4,t);target(chorusWet.gain,effective.ensemble*0.8,t);for(const s of chorus){target(s.depth.gain,0.001+effective.ensemble*0.004,t);target(s.pan.pan,(s.j-1)*effective.width*0.9,t);}target(dry.gain,1-effective.space*0.35,t);target(roomGain.gain,effective.space*0.8,t);for(const v of voices)voiceTone(v,t);
    }
    function envelopeAt(v,t){if(t<=v.t0)return 0;const age=t-v.t0;if(age<v.attack)return v.peak*age/v.attack;if(age<v.attack+v.decay)return v.peak*(1-(1-v.sustain)*(age-v.attack)/v.decay);return v.peak*v.sustain;}
    function releaseVoice(v,t,seconds=effective.release){
      if(v.t0<0||v.until<=t)return;
      const p=v.envelope.gain;
      if(t<v.t0){p.cancelScheduledValues(t);p.setValueAtTime(0,t);v.until=t;v.off=t;return;}
      // Releasing again never raises an already-decaying voice.
      let level=envelopeAt(v,t);if(v.off>=v.t0&&t>v.off){const progress=clamp((t-v.off)/(v.until-v.off),0,1);level=v.releaseLevel*(1-progress);}
      p.cancelScheduledValues(t);p.setValueAtTime(Math.max(0,level),t);p.linearRampToValueAtTime(0,t+seconds);v.off=t;v.releaseLevel=level;v.until=t+seconds+0.01;
    }
    function noteOn(note,vel,t,duration){
      if(vel<=0){noteOff(note,t);return;}
      let v=voices.find(v=>v.until<=t);if(!v)v=voices.reduce((a,b)=>a.until<b.until||(a.until===b.until&&a.t0<b.t0)?a:b);
      const stealing=v.until>t;
      if(stealing){const p=v.envelope.gain;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else p.cancelScheduledValues(t);p.linearRampToValueAtTime(0,t+0.006);t+=0.006;}
      v.note=note;v.t0=t;v.off=-1;v.until=Infinity;v.peak=0.11*(1-effective.velocity+effective.velocity*vel);v.attack=effective.attack;v.decay=effective.decay;v.sustain=effective.sustain;
      const p=v.envelope.gain;if(!stealing)p.cancelScheduledValues(t);p.setValueAtTime(0,t);p.linearRampToValueAtTime(v.peak,t+v.attack);p.linearRampToValueAtTime(v.peak*v.sustain,t+v.attack+v.decay);
      for(const o of v.oscs)o.frequency.setValueAtTime(hz(note),t);voiceTone(v,t);
      if(Number.isFinite(duration))releaseVoice(v,t+duration);
    }
    function noteOff(note,t){for(const v of voices)if(v.note===note&&v.t0<=t&&v.until>t&&(v.off<0||v.off>t))releaseVoice(v,t);}
    function panic(t=ctx.currentTime){for(const v of voices)releaseVoice(v,t,Math.min(effective.release,0.35));}
    // bewaker: kijkt naar de ruwe som van de stemmen (normaal ver onder 2) en naar de uitgang van de compressor, voor de vervormer die een
    // ontsporing verbergt. Een ontspoord filter loopt naar Infinity en daarna NaN en herstelt nooit meer (ook de compressor en de galm houden
    // hun toestand); dan worden de stemfilters, de drie filters daarachter, de galm en de compressor vervangen. De timer staat uit in een offline render.
    mon=ctx.createAnalyser();mon.fftSize=256;bus.connect(mon);const mon2=ctx.createAnalyser();mon2.fftSize=256;volume.connect(mon2);
    const chk=new Float32Array(256);
    function rebuildFilters(){
      for(const v of voices){
        const old=v.filter,f=biquad('lowpass',4200);
        for(const g of [v.bowGain,...v.mix])try{g.disconnect(old);}catch{}
        try{old.disconnect();}catch{}nodes.delete(old);
        for(const g of [v.bowGain,...v.mix])g.connect(f);f.connect(v.envelope);v.filter=f;
      }
      makeTail();makeCore();apply();
    }
    function guard(){if(dead)return;for(const m of [mon,mon2]){m.getFloatTimeDomainData(chk);for(let i=0;i<chk.length;i++)if(!(Math.abs(chk[i])<100)){rebuildFilters();return;}}}
    const offline=typeof OfflineAudioContext!=='undefined'&&ctx instanceof OfflineAudioContext;
    const guardT=!offline&&typeof setInterval==='function'?setInterval(guard,50):null;if(guardT&&guardT.unref)guardT.unref();
    function paint(){for(const k in controls)controls[k].set(state[k]);if(presetSelect)presetSelect.value=state.preset;if(status){const active=Object.values(mod).filter(v=>v!==0).length;status.textContent=active?tx('Mod actief · {0} parameters',active):tx('16-stemmig · keyboard/sequencer → oranje Noten · stereo uit → mixer');}}
    function change(id,value){const d=spec[id];if(!d||!Number.isFinite(+value))return;state[id]=Number(clamp(Math.round(+value/d[3])*d[3],d[1],d[2]).toFixed(6));state.preset='Custom';apply();paint();}
    const self={inputs:{},outputs:{out},
      mount(el){if(root)self.unmount();root=el;const css=document.createElement('style');css.textContent=`.sk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px 18px;margin-top:4px}.sk-grid .k{grid-template-columns:124px minmax(90px,1fr) 62px;gap:8px;min-height:30px}.sk-grid .k label{font-size:10px;letter-spacing:.04em}.sk-grid .k output{font-size:11px;white-space:nowrap}.sk-grid input[type=range]{width:100%;min-width:90px;height:24px;margin:0;cursor:pointer;accent-color:var(--audio,#e4c697)}.sk-grid input[type=range]::-webkit-slider-thumb{width:16px;height:16px}.sk-grid input[type=range]::-moz-range-thumb{width:16px;height:16px}:has(.k[data-pk-face]) > .sk-x{display:none!important}`;el.appendChild(css);const heading=document.createElement('div');heading.textContent=tx('BOWED ENSEMBLE · polyfoon strijkersensemble');heading.className='sk-x';heading.style.cssText='font-size:14px;letter-spacing:1px;color:color-mix(in srgb,var(--audio) 60%,var(--fg));padding:8px 0';el.appendChild(heading);
        presetSelect=host.ui.select(el,'Ensemble',Object.keys(presets).map(k=>[k,k]).concat([['Custom',tx('Eigen klank')]]),state.preset,name=>{if(Object.hasOwn(presets,name))self.setState({...defaults,...presets[name],preset:name});}, { id:'preset',group:'preset' });
        const groups=[[tx('Klank & articulatie'),['cutoff','resonance','body','bow','attack','decay','sustain','release','velocity'],'tone'],[tx('Ensemble & ruimte'),['detune','vibrato','rate','human','ensemble','width','space','pan'],'ensemble'],[tx('Spel & niveau'),['transpose','expression','level'],'play']];
        for(const [label,ids,grp] of groups){const h=document.createElement('div');h.className='sk-x';h.textContent=label;h.style.cssText='font-size:12px;opacity:.8;border-top:1px solid var(--line);padding-top:8px;margin-top:9px';el.appendChild(h);const grid=document.createElement('div');grid.className='sk-grid';el.appendChild(grid);
          for(const id of ids){const d=spec[id];const before=grid.children.length;controls[id]=host.ui.knob(grid,d[0],[d[1],d[2],d[3]],state[id],v=>d[5]==='%'?Math.round(v*100)+'%':d[5]==='s'?(v<0.1?Math.round(v*1000)+' ms':v.toFixed(2)+' s'):d[5]==='pan'?(Math.abs(v)<0.01?tx('Midden'):Math.round(Math.abs(v)*100)+(v<0?' L':' R')):v.toFixed(d[5]==='Hz'&&v>100?0:1)+' '+d[5],v=>change(id,v),{default:defaults[id], id:id,group:grp });const row=grid.children[before];if(row)row.title=d[0];}
        }
        const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:10px';el.appendChild(actions);
        const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);actions.appendChild(b);};
        button(tx('Proefakkoord'),()=>{const t=ctx.currentTime;[48,55,60,64].forEach(n=>noteOn(n,0.78,t,2));});button(tx('Alles uit'),()=>panic());
        status=document.createElement('p');status.className='sk-x';status.style.cssText='font-size:12px;color:var(--mod);line-height:1.5';el.appendChild(status);paint();
      },
      unmount(){if(root)root.innerHTML='';root=null;controls={};presetSelect=null;status=null;},
      onEvent(port,event){try{if(dead||port!=='notes'||!event||!Number.isFinite(event.time))return;const t=Math.max(ctx.currentTime,event.time),type=String(event.type).toLowerCase().replace(/[_-]/g,'');
        if(['note','noteon','noteoff'].includes(type)&&Number.isFinite(event.note)){const n=clamp(event.note,0,127);if(type==='noteoff'||event.vel===0)noteOff(n,t);else noteOn(n,Number.isFinite(event.vel)?clamp(event.vel,0,1):0.8,t,Number.isFinite(event.dur)?clamp(event.dur,0.005,120):undefined);}
        else if(type==='cc'&&Object.hasOwn(spec,event.id)&&Number.isFinite(event.value)){const d=spec[event.id];state[event.id]=Number(clamp(Math.round((d[1]+clamp(event.value,0,1)*(d[2]-d[1]))/d[3])*d[3],d[1],d[2]).toFixed(6));state.preset='Custom';apply(t);paint();}
        else if(type==='panic'||type==='allnotesoff')panic(t);
      }catch{}},
      onTransport(info){if(!dead&&!info?.playing)panic();},
      params(){return Object.entries(spec).map(([id,d])=>({id,name:d[0],lane:'strings',laneName:'Strings',min:d[1],max:d[2],scale:d[6],role:d[7],drift:d[8],on:d[9]}));},
      modulate(offsets){if(dead)return;const next={};if(offsets&&typeof offsets==='object'&&!Array.isArray(offsets))for(const id of Object.keys(spec)){const v=offsets[id];if(typeof v==='number'&&Number.isFinite(v))next[id]=clamp(v,-1,1);}mod=next;apply();if(status){const active=Object.values(mod).filter(v=>v!==0).length;status.textContent=active?tx('Mod actief · {0} parameters',active):tx('Mod gereed · verbind een paarse sturingskabel');}},
      getState(){return {...state};},
      setState(raw){if(dead)return;const s=raw&&typeof raw==='object'?raw:{},next={...defaults};for(const [id,d] of Object.entries(spec))if(typeof s[id]==='number'&&Number.isFinite(s[id]))next[id]=Number(clamp(Math.round(s[id]/d[3])*d[3],d[1],d[2]).toFixed(6));const pn=typeof s.preset==='string'&&Object.hasOwn(legacy,s.preset)?legacy[s.preset]:s.preset;if(pn==='Custom'||(typeof pn==='string'&&Object.hasOwn(presets,pn)))next.preset=pn;state=next;apply();paint();},
      destroy(){if(dead)return;dead=true;if(guardT)clearInterval(guardT);self.unmount();for(const n of sources)try{n.stop();}catch{}for(const n of nodes)try{n.disconnect();}catch{}try{mon.disconnect();}catch{}try{mon2.disconnect();}catch{}sources.clear();nodes.clear();voices.length=0;}
    };
    apply();return self;
  }
};
