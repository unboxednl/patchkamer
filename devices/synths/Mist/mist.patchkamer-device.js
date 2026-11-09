// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.16.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (moduleerbare ambient) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.15.1 — Gecontroleerd op stuurbaarheid: alle klankregelaars stonden al in params(). Bewust niet stuurbaar: Evolutie (het aantal maten per fase, een compositorische stap
//   en geen klank; vandaar modExclude). Geluid en instellingen ongewijzigd.
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Mist (nieuwe id nl.patchkamer.mist, eigen map; voorheen Nevel, nl.patchkamer.nevel);
//   songs uit die tijd verwijzen naar de oude id en laden hier niet in. Het geluid is bit-identiek aan het oude bestand.
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Mist; de namen van de klanken in de keuzelijst zijn Engels
//     (Diepe ruimte is Deep Space, Eigen is Custom enzovoort; de oude namen worden bij het laden herkend)
//   - de modulatie-lane heet Mist
//   - setState volgt §13: onbekende velden worden genegeerd, ontbrekende of ongeldige waarden krijgen de standaard, getallen worden afgekapt
//   - dubbelklik op een regelaar zet hem terug op de beginwaarde (via host.ui.knob)
//   - bewaker tegen een ontspoord filter of een kapotte echo: de ruwe som van de stemmen en de uitgang van de compressor worden gevolgd;
//     geeft een van beide een niet-eindige of absurde waarde, dan worden het toonfilter, het hoogdoorlaatfilter, de echo's, de galm en de
//     compressor (die hun toestand voor altijd houden) vervangen. Normaal geluid blijft bit-identiek.
//   - de uitgangsbegrenzer volgt host.audio.oversample (§12c)
/** Mist — a drone and ambient synth that starts with the host transport. Standalone ES module; no external dependencies.
 * Connect out to a mixer/output. Host transport starts/stops the drone.
 * notes: note (MIDI/dur/vel), trig (bloom), cc (named normalized controls).
 * Warm pad + clocked diatonic ambient melody; 14 sounds; bounded 12-note polyphony.
 * Optional purple mod input; 13 public parameter descriptors and total-offset replacement. Continuous modulation is smoothed
 * and never overwrites saved knobs. Log: cutoff/attack/release. Linear: other parameters. Missing offsets reset to zero.
 * root controls drone + generated melody only; external note pitch is untouched.
 * attack/release are read on the next note/gate; evolve remains a manual setting.
 * Modulator routes/offsets belong to the host and are never stored as base state.
 */
const EN = {
  'Helderheid': 'Brightness', 'Wind': 'Wind', 'Beweging': 'Motion', 'Warmte': 'Warmth', 'Zweving': 'Detune', 'Galm': 'Reverb', 'Echo': 'Echo',
  'Melodieniveau': 'Melody level', 'Melodiedichtheid': 'Melody density', 'Niveau': 'Level', 'Grondtoon': 'Root', 'Opkomst': 'Attack', 'Uitklank': 'Release',
  'Melodie': 'Melody', 'Dichtheid': 'Density', 'Evolutie': 'Evolve',
  'Klankbeeld': 'Soundscape', 'Spel': 'Play', 'Akkoord': 'Chord', 'Eigen klank': 'Custom sound',
  'Drone + noten': 'Drone + notes', 'Alleen noten': 'Notes only',
  'Open kwinten': 'Open fifths', 'Mineur 7': 'Minor 7', 'Majeur 7': 'Major 7', 'Sus / zwevend': 'Sus / floating', 'Open add9': 'Open add9',
  'Mineur 9': 'Minor 9', 'Majeur 9': 'Major 9', 'Majeur 6': 'Major 6',
  'Mod actief · {0} parameters · knoppen blijven de basis': 'Mod active · {0} parameters · knobs stay the base',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'Start transport voor akkoorden + melodie. Start drone speelt een stilstaand akkoord zonder klok. Melodieniveau = balans; dichtheid = ruimte tussen tonen. Stereo uit → mixer/output.':
    'Start the transport for chords + melody. Start drone plays a static chord without the clock. Melody level = balance; density = space between tones. Stereo out → mixer/output.',
  'Paarse Mod-kabel → bijvoorbeeld Drift. Helderheid en tijden bewegen logaritmisch. Grondtoon stuurt drone en automatische melodie; opkomst/uitklank gelden bij de volgende noot. Evolutie blijft handmatig.':
    'Purple Mod cable → for example Drift. Brightness and times move logarithmically. Root controls the drone and the automatic melody; attack/release apply from the next note. Evolve stays manual.',
};
export default {
  id: 'nl.patchkamer.mist', name: 'Mist', version: '1.16.0', modExclude: ['evolve'], kind: 'instrument', category: 'synth', ui: { width: 560, minWidth: 300 },
  about: { nl: 'Moduleerbaar ambientapparaat: drone en noten met een langzaam evoluerende klank.', en: 'A modulatable ambient device: drone and notes with a slowly evolving sound.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo out' }], eventIn: [{ id: 'notes', name: 'Notes / CC' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo uit', notes: 'Noten / CC' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const defaults = { root: 48, chord: 'open', mode: 'drone', level: 0.65, cutoff: 1800, air: 0.22, motion: 0.45, space: 0.65, echo: 0.3, attack: 4, release: 9, evolve: 4, melody: 0.65, density: 0.35, warmth: 0.65, detune: 5, preset: 'Mist' };
    const ranges = { melody:[0,1,0.01], density:[0,1,0.01], warmth:[0,1,0.01], detune:[0,14,0.1], root:[24,84,1], level:[0,1,0.01], cutoff:[150,8000,10], air:[0,1,0.01], motion:[0,1,0.01], space:[0,1,0.01], echo:[0,0.75,0.01], attack:[0.2,12,0.1], release:[1,24,0.1], evolve:[1,16,1] };
    const GRP = { root:'voicing', detune:'voicing', warmth:'voicing', melody:'melody', density:'melody', evolve:'melody', cutoff:'tone', air:'tone', motion:'tone', space:'space', echo:'space', attack:'env', release:'env', level:'out' };   // sectie per regelaar (voor skins)
    // Public ids stay identical to the knob/CC ids. evolve is deliberately
    // excluded: changing the measure counter is a compositional action.
    const modulationMeta={
      cutoff:['Helderheid','log','filter',0.025,true],air:['Wind','lin','texture',0.025,true],motion:['Beweging','lin','motion',0.025,true],
      warmth:['Warmte','lin','color',0.025,true],detune:['Zweving','lin','pitch',0.02,true],space:['Galm','lin','space',0.025,true],echo:['Echo','lin','delay',0.02,true],
      melody:['Melodieniveau','lin','level',0.025,true],density:['Melodiedichtheid','lin','density',0.02,false],
      level:['Niveau','lin','level',0.015,false],root:['Grondtoon','lin','pitch',0.003,false],attack:['Opkomst','log','env',0.02,false],release:['Uitklank','log','decay',0.02,false]
    };
    let modulation={},effective={};
    const limit=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
    function resolve(){const next={...state};for(const [id,meta] of Object.entries(modulationMeta)){const [lo,hi]=ranges[id],offset=modulation[id]||0;next[id]=limit(meta[1]==='log'?state[id]*(hi/lo)**offset:state[id]+offset*(hi-lo),lo,hi);}return next;}
    const chords = { open:[0,7,12,19], minor:[0,7,10,15], major:[0,7,11,16], suspended:[0,5,7,14], add9:[0,7,12,14], minor9:[0,3,10,14], major9:[0,4,11,14], sixth:[0,4,7,9] };
    let state = {...defaults}, destroyed = false, playing = false, manual = false, phase = 0, rootEl = null;
    const nodes = new Set(), sources = new Set(), voices = new Set();
    let controls = {}, selects = {}, button, modStatus;
    const own = n => { nodes.add(n); return n; };
    const gain = v => { const n=own(ctx.createGain()); n.gain.value=v; return n; };
    const filter = (type,f,q=0.5) => { const n=own(ctx.createBiquadFilter()); n.type=type; n.frequency.value=f; n.Q.value=q; return n; };
    const start = n => { sources.add(n); n.start(); return n; };
    const hz = n => 440 * 2 ** ((n-69)/12);
    const target = (p,v,t=ctx.currentTime,tc=0.04) => p.setTargetAtTime(v,t,tc);
    // Hold automation at its computed value when supported (real Web Audio).
    const hold = (p,t) => { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); };
    const bus=gain(3.2), droneGate=gain(0), out=gain(0.65);
    const melodyBus=gain(0.65);melodyBus.connect(bus);
    const dry=gain(0.7), wet=gain(0.5), echoWet=gain(0.3);
    // Seeded data makes restored timbres identical; never uses wall-clock randomness.
    let seed=0x4e455645;
    const random=()=> { seed ^= seed<<13; seed ^= seed>>>17; seed ^= seed<<5; return (seed>>>0)/4294967296*2-1; };
    // the ceiling: a bounded soft limiter after the compressor
    const ceiling=own(ctx.createWaveShaper()), ceilingCurve=new Float32Array(4097);
    for(let i=0;i<ceilingCurve.length;i++){const x=i/(ceilingCurve.length-1)*2-1; ceilingCurve[i]=0.8*Math.tanh(x/0.8);}
    ceiling.curve=ceilingCurve; ceiling.oversample=(host.audio&&host.audio.oversample)||'2x'; out.connect(ceiling);
    const ir=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*6),ctx.sampleRate);
    for(let c=0;c<2;c++){ const a=ir.getChannelData(c); let smooth=0; for(let i=0;i<a.length;i++){ smooth=smooth*0.45+random()*0.55; a[i]=smooth*Math.exp(-i/(ctx.sampleRate*1.45))*0.55; } }
    // The filters, echoes, reverb and compressor keep their state, so the guard can replace them (makeChain).
    let tone=null, highpass=null, convolver=null, compressor=null, chain=[], delays=[];
    const lfo=own(ctx.createOscillator()), filterDepth=gain(350), windDepth=gain(0.01); lfo.frequency.value=0.035;
    function makeChain(){
      for(const n of chain){try{n.disconnect();}catch{}nodes.delete(n);}
      for(const n of [bus,dry,wet,echoWet]){try{n.disconnect();}catch{}}
      try{filterDepth.disconnect();}catch{}
      chain=[];const mk=n=>{chain.push(n);return n;};
      tone=mk(filter('lowpass',1800)); highpass=mk(filter('highpass',35));
      convolver=mk(own(ctx.createConvolver())); compressor=mk(own(ctx.createDynamicsCompressor()));
      compressor.threshold.value=-15; compressor.knee.value=12; compressor.ratio.value=4; compressor.attack.value=0.01; compressor.release.value=0.4;
      convolver.buffer=ir;
      bus.connect(tone).connect(highpass); highpass.connect(dry).connect(compressor);
      highpass.connect(convolver).connect(wet).connect(compressor); // More pre-compressor gain; a bounded soft ceiling catches extreme layering.
      delays=[];
      for(let i=0;i<2;i++) { const d=mk(own(ctx.createDelay(2))), fb=mk(gain(0.35)), lp=mk(filter('lowpass',2300)), pan=mk(own(ctx.createStereoPanner())); d.delayTime.value=i?0.79:0.57; pan.pan.value=i?0.7:-0.7; highpass.connect(d); d.connect(lp).connect(fb).connect(d); lp.connect(pan).connect(echoWet); delays.push({fb}); }
      echoWet.connect(compressor); compressor.connect(out);
      filterDepth.connect(tone.frequency);
      if(mon2)compressor.connect(mon2);
    }
    let mon2=null;
    const drone=[], droneGains=[];
    for(let i=0;i<8;i++) { const o=own(ctx.createOscillator()), g=gain(0.022), p=own(ctx.createStereoPanner()); o.type=i%2?'triangle':'sine'; o.detune.value=i%2?5:-5; p.pan.value=(i/7*2-1)*0.75; o.connect(g).connect(p).connect(droneGate); start(o); drone.push(o); droneGains.push(g); }
    const noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*5,ctx.sampleRate), data=noiseBuffer.getChannelData(0); let brown=0;
    for(let i=0;i<data.length;i++){ brown=(brown+0.025*random())/1.025; data[i]=brown*3.5; }
    const noise=own(ctx.createBufferSource()), windFilter=filter('bandpass',650,0.65), wind=gain(0.02);
    noise.buffer=noiseBuffer; noise.loop=true; noise.connect(windFilter).connect(wind).connect(droneGate); start(noise);
    makeChain();
    lfo.connect(filterDepth); lfo.connect(windDepth).connect(wind.gain); start(lfo);
    const panLfo=own(ctx.createOscillator()), panDepth=gain(0.15), moving=own(ctx.createStereoPanner()); panLfo.frequency.value=0.017;
    // Pan drone before bus, separate from reverb stereo field.
    droneGate.connect(moving).connect(bus); panLfo.connect(panDepth).connect(moving.pan); start(panLfo);
    // Keep every evolving chord and melody in the same diatonic key.
    function harmony(index=phase){
      const minor=['minor','minor9'].includes(state.chord);
      const scale=minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
      const degree=[0,5,3,4,0,3,5,4][index%8];
      const pitch=d=>scale[d%7]+12*Math.floor(d/7);
      let notes;
      if(index%8===0)notes=chords[state.chord].slice();
      else if(state.chord==='open')notes=[pitch(degree),pitch(degree+4),pitch(degree+7),pitch(degree+11)];
      else if(state.chord==='suspended'||state.chord==='add9')notes=[pitch(degree),pitch(degree+4),pitch(degree+7),pitch(degree+8)];
      else notes=[pitch(degree),pitch(degree+2),pitch(degree+4),pitch(degree+(state.chord==='sixth'?5:6))];
      // Gentle voice leading: upper harmony remains within two octaves.
      return notes.map(n=>n>=24?n-12:n);
    }
    function tune(t,tc=1.8) { const notes=harmony(); drone.forEach((o,i)=>target(o.frequency,hz(effective.root+notes[Math.floor(i/2)]),t,tc)); }
    function gate(t) { hold(droneGate.gain,t); target(droneGate.gain, state.mode==='drone'&&(playing||manual)?1:0,t,state.mode==='drone'&&(playing||manual)?effective.attack/3:effective.release/4); }
    function paint(){ for(const k in controls) controls[k].set(state[k]); for(const k in selects) selects[k].value=state[k]; if(button) button.textContent=manual?'Stop drone':'Start drone'; }
    function apply(t=ctx.currentTime,force=false){
      if(destroyed)return;const before=effective;effective=resolve();const changed=(...ids)=>force||ids.some(id=>before[id]!==effective[id]);
      if(changed('level'))target(out.gain,effective.level,t);
      if(changed('melody'))target(melodyBus.gain,effective.melody,t);
      if(changed('detune','warmth'))drone.forEach((o,i)=>{if(changed('detune'))target(o.detune,(i%2?1:-1)*effective.detune,t);if(changed('warmth'))target(droneGains[i].gain,i%2?0.008+effective.warmth*0.022:0.032,t);});
      if(changed('cutoff'))target(tone.frequency,effective.cutoff,t);
      if(changed('cutoff','motion'))target(filterDepth.gain,effective.cutoff*0.45*effective.motion,t);
      if(changed('motion')){target(lfo.frequency,0.008+effective.motion*0.07,t);target(panDepth.gain,effective.motion*0.4,t);}
      if(changed('air'))target(wind.gain,effective.air*0.085,t);
      if(changed('air','motion'))target(windDepth.gain,effective.air*0.025*effective.motion,t);
      if(changed('space')){target(dry.gain,1-effective.space*0.45,t);target(wet.gain,effective.space*0.85,t);}
      if(changed('echo')){target(echoWet.gain,effective.echo*0.7,t);delays.forEach(d=>target(d.fb.gain,0.12+effective.echo*0.58,t));}
      if(changed('root','chord'))tune(t,force?1.8:0.08);
      // Continuous control never restarts the drone or reschedules note envelopes.
      // Envelope offsets apply at the next note or transport/manual gate change.
      if(force||before.mode!==effective.mode)gate(t);
    }
    function showModulation(){if(!modStatus)return;const count=Object.values(modulation).filter(v=>v!==0).length;modStatus.textContent=count?tx('Mod actief · {0} parameters · knoppen blijven de basis',count):tx('Mod gereed · verbind een paarse sturingskabel');}
    function clean(v){ if(!voices.delete(v))return; for(const n of v.nodes){ try{n.disconnect();}catch{} nodes.delete(n); sources.delete(n); } }
    function note(n,vel,t,dur,automatic=false){
      if(voices.size>=12)return; // Bound CPU; existing ambient tails are preserved.
      const o=own(ctx.createOscillator()), sub=own(ctx.createOscillator()), g=gain(0), p=own(ctx.createStereoPanner());
      o.type='sine'; sub.type='triangle'; o.frequency.value=hz(n); sub.frequency.value=hz(n)*1.002;
      p.pan.value=Math.sin(n*1.7)*0.65; o.connect(g); sub.connect(g); g.connect(p).connect(automatic?melodyBus:bus);
      const attack=Math.min(effective.attack,dur*0.8), end=t+dur+effective.release;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vel*0.045,t+attack); g.gain.setValueAtTime(vel*0.045,t+dur); g.gain.exponentialRampToValueAtTime(0.00001,end);
      const v={nodes:[o,sub,g,p],g,end}; voices.add(v); sources.add(o); sources.add(sub); sub.onended=()=>clean(v); o.start(t); sub.start(t); o.stop(end+0.05); sub.stop(end+0.05);
    }
    function stopNotes(t){ for(const v of voices){ hold(v.g.gain,t); target(v.g.gain,0,t,effective.release/5); for(const n of v.nodes.slice(0,2))try{n.stop(t+effective.release);}catch{} } }
    function change(k,v){ if(ranges[k]) state[k]=Math.min(ranges[k][1],Math.max(ranges[k][0],Number(v))); else state[k]=v; state.preset='Custom'; apply(); paint(); }
    const presets={
      'Mist':{},
      'Deep Space':{root:36,chord:'open',cutoff:900,air:0.1,space:0.9,motion:0.25,echo:0.45,attack:7,release:16,melody:0.3,density:0.12},
      'Tides':{root:45,chord:'suspended',cutoff:2600,air:0.6,motion:0.75,space:0.7,echo:0.42,melody:0.45},
      'Twilight':{root:50,chord:'minor',cutoff:1400,air:0.18,motion:0.35,space:0.8,echo:0.5},
      'Morning Light':{root:48,chord:'major9',cutoff:3200,air:0.05,space:0.72,echo:0.35,melody:0.8,density:0.45,warmth:0.8},
      'Velvet Sky':{root:43,chord:'sixth',cutoff:2100,air:0.04,space:0.8,attack:6,release:14,melody:0.65,warmth:0.95,detune:3},
      'Starfield':{root:55,chord:'add9',cutoff:4800,air:0.08,space:0.85,echo:0.6,attack:1.5,release:12,melody:0.9,density:0.6,warmth:0.25},
      'Quiet Piano':{root:48,chord:'major',cutoff:4200,air:0,space:0.7,echo:0.25,attack:0.4,release:10,melody:1,density:0.45,warmth:0.3,detune:1},
      'Moon Water':{root:45,chord:'minor9',cutoff:2400,air:0.12,space:0.85,echo:0.55,attack:3,release:16,melody:0.8,density:0.3},
      'Warm Memory':{root:41,chord:'major9',cutoff:1600,air:0.02,space:0.65,echo:0.3,attack:5,release:14,melody:0.7,warmth:1,detune:4},
      'Floating Islands':{root:50,chord:'suspended',cutoff:3000,air:0.06,space:0.9,echo:0.5,melody:0.85,density:0.5,evolve:8},
      'Northern Lights':{root:47,chord:'minor9',cutoff:3800,air:0.2,motion:0.65,space:0.85,echo:0.55,melody:0.8,density:0.55},
      'Cathedral':{root:36,chord:'major',cutoff:2200,air:0.02,space:1,echo:0.2,attack:8,release:22,melody:0.55,density:0.15,warmth:0.9,evolve:8},
      'Breathing Room':{root:48,chord:'add9',cutoff:1700,air:0.16,motion:0.2,space:0.75,attack:8,release:18,melody:0.35,density:0.1,evolve:12}
    };
    // names from the old file are recognised when a state is loaded
    const legacy={'Eigen':'Custom','Diepe ruimte':'Deep Space','Getijden':'Tides','Schemer':'Twilight','Ochtendlicht':'Morning Light','Fluwelen hemel':'Velvet Sky','Sterrenveld':'Starfield','Stille piano':'Quiet Piano','Maanwater':'Moon Water','Warme herinnering':'Warm Memory','Zwevende eilanden':'Floating Islands','Noorderlicht':'Northern Lights','Kathedraal':'Cathedral','Ademruimte':'Breathing Room'};
    // Guard: watches the raw voice sum (normally far below 2) and the compressor output, before the ceiling that would hide a runaway.
    // A runaway filter goes to Infinity and then NaN and never recovers (the echoes, reverb and compressor keep their state too);
    // then the chain is replaced. The timer is off in an offline render.
    const mon1=ctx.createAnalyser(); mon1.fftSize=256; bus.connect(mon1);
    mon2=ctx.createAnalyser(); mon2.fftSize=256; compressor.connect(mon2);
    const chk=new Float32Array(256);
    function guard(){if(destroyed)return;for(const m of [mon1,mon2]){m.getFloatTimeDomainData(chk);for(let i=0;i<chk.length;i++)if(!(Math.abs(chk[i])<100)){makeChain();apply(ctx.currentTime,true);return;}}}
    const offline=typeof OfflineAudioContext!=='undefined'&&ctx instanceof OfflineAudioContext;
    const guardT=!offline&&typeof setInterval==='function'?setInterval(guard,50):null;if(guardT&&guardT.unref)guardT.unref();
    let lastStep=-1;
    const instance={ inputs:{}, outputs:{out:ceiling},
      mount(el){ if(rootEl)instance.unmount();rootEl=el; controls={}; selects={}; 
        selects.preset=host.ui.select(el,tx('Klankbeeld'),Object.keys(presets).map(k=>[k,k]).concat([['Custom',tx('Eigen klank')]]),state.preset,v=>{if(presets[v])instance.setState({...defaults,...presets[v],preset:v});}, { id:'preset',group:'preset' });
        selects.mode=host.ui.select(el,tx('Spel'),[['drone',tx('Drone + noten')],['notes',tx('Alleen noten')]],state.mode,v=>change('mode',v), { id:'mode',group:'play' });
        selects.chord=host.ui.select(el,tx('Akkoord'),[['open',tx('Open kwinten')],['minor',tx('Mineur 7')],['major',tx('Majeur 7')],['suspended',tx('Sus / zwevend')],['add9',tx('Open add9')],['minor9',tx('Mineur 9')],['major9',tx('Majeur 9')],['sixth',tx('Majeur 6')]],state.chord,v=>change('chord',v), { id:'chord',group:'voicing' });
        const labels={melody:tx('Melodie'),density:tx('Dichtheid'),warmth:tx('Warmte'),detune:tx('Zweving'),root:tx('Grondtoon'),level:tx('Niveau'),cutoff:tx('Helderheid'),air:tx('Wind'),motion:tx('Beweging'),space:tx('Galm'),echo:tx('Echo'),attack:tx('Opkomst'),release:tx('Uitklank'),evolve:tx('Evolutie')};
        const knobs=document.createElement('div');knobs.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:8px;align-items:start';el.appendChild(knobs);
        for(const k in ranges) controls[k]=host.ui.knob(knobs,labels[k],ranges[k],state[k],v=> k==='root'?['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][Math.round(v)%12]+(Math.floor(v/12)-1):k==='detune'?v.toFixed(1)+' ct':k==='cutoff'?Math.round(v)+' Hz':k==='attack'||k==='release'?v.toFixed(1)+' s':k==='evolve'?Math.round(v).toString():Math.round(v*100)+'%',v=>change(k,v),{default:defaults[k], id:k,group:GRP[k] });
        button=document.createElement('button'); button.type='button'; button.addEventListener('click',()=>{manual=!manual; gate(ctx.currentTime); paint();}); el.appendChild(button);
        const tip=document.createElement('p'); tip.className='note'; tip.textContent=tx('Start transport voor akkoorden + melodie. Start drone speelt een stilstaand akkoord zonder klok. Melodieniveau = balans; dichtheid = ruimte tussen tonen. Stereo uit → mixer/output.'); el.appendChild(tip);
        modStatus=document.createElement('p');modStatus.style.cssText='font-size:12px;color:var(--mod);line-height:1.5';el.appendChild(modStatus);
        const modTip=document.createElement('p');modTip.className='note';modTip.textContent=tx('Paarse Mod-kabel → bijvoorbeeld Drift. Helderheid en tijden bewegen logaritmisch. Grondtoon stuurt drone en automatische melodie; opkomst/uitklank gelden bij de volgende noot. Evolutie blijft handmatig.');el.appendChild(modTip);paint();showModulation();
      },
      unmount(){ controls={}; selects={}; button=null; modStatus=null; if(rootEl)rootEl.innerHTML=''; rootEl=null; },
      onStep(info){try{
        if(destroyed||!playing||state.mode!=='drone'||!info||!Number.isFinite(info.time)||!Number.isInteger(info.bar)||!Number.isInteger(info.step)||!(info.stepDur>0))return;
        const absolute=info.bar*16+info.step; if(absolute===lastStep)return; lastStep=absolute;
        const t=Math.max(ctx.currentTime,info.time);
        phase=Math.floor(info.bar/state.evolve)%8;
        if(info.step===0&&info.bar%state.evolve===0)tune(t);
        const spacing=effective.density<0.2?32:effective.density<0.45?16:effective.density<0.75?8:4;
        if(effective.melody>0&&effective.density>0&&absolute%spacing===0){
          const pattern=[0,2,1,3,2,1,0,1,3,2,1,2,0,3,1,0];
          const index=Math.floor(absolute/spacing), chord=harmony();
          const pitch=effective.root+chord[pattern[index%pattern.length]]+12;
          const duration=Math.max(2,spacing*info.stepDur*0.9);
          note(pitch,0.48+0.12*Math.sin(index*1.3),t,duration,true);
        }
      }catch{} },
      onTransport(info){ if(destroyed)return; playing=!!info.playing; lastStep=-1; if(!playing){manual=false; stopNotes(ctx.currentTime);} gate(ctx.currentTime); paint(); },
      onEvent(port,ev){try{ if(destroyed||port!=='notes'||!ev||!Number.isFinite(ev.time))return; const t=Math.max(ctx.currentTime,ev.time);
        if(ev.type==='note'&&Number.isFinite(ev.note)) note(Math.max(0,Math.min(127,ev.note)),Number.isFinite(ev.vel)?Math.max(0,Math.min(1,ev.vel)):0.7,t,Number.isFinite(ev.dur)?Math.max(0.05,Math.min(60,ev.dur)):4);
        else if(ev.type==='trig')note(effective.root+12+(harmony()[phase%4]),0.6,t,4);
        else if(ev.type==='cc'&&ranges[ev.id]&&Number.isFinite(ev.value)){ const [lo,hi,step]=ranges[ev.id]; state.preset='Custom'; state[ev.id]=Number((Math.round((lo+Math.max(0,Math.min(1,ev.value))*(hi-lo))/step)*step).toFixed(6)); apply(t); paint(); }
      }catch{} },
      params(){return Object.entries(modulationMeta).map(([id,m])=>({id,name:tx(m[0]),lane:'mist',laneName:'Mist',min:ranges[id][0],max:ranges[id][1],scale:m[1],role:m[2],drift:m[3],on:m[4]}));},
      modulate(offsets){
        if(destroyed)return;const next={};if(offsets&&typeof offsets==='object'&&!Array.isArray(offsets))for(const id of Object.keys(modulationMeta)){const value=offsets[id];if(typeof value==='number'&&Number.isFinite(value))next[id]=limit(value,-1,1);}
        modulation=next;apply();showModulation();
      },
      getState(){return {...state};},
      setState(s){ if(destroyed)return; s=s&&typeof s==='object'?s:{}; const next={...defaults}; for(const k in ranges){ const n=s[k]; if(typeof n==='number'&&Number.isFinite(n)){const [lo,hi,step]=ranges[k]; next[k]=Math.min(hi,Math.max(lo,Number((Math.round(n/step)*step).toFixed(6))));} } if(typeof s.chord==='string'&&Object.hasOwn(chords,s.chord))next.chord=s.chord; if(['drone','notes'].includes(s.mode))next.mode=s.mode; const pn=typeof s.preset==='string'&&Object.hasOwn(legacy,s.preset)?legacy[s.preset]:s.preset; if(pn==='Custom'||(typeof pn==='string'&&Object.hasOwn(presets,pn)))next.preset=pn; state=next; phase=0; lastStep=-1; apply(ctx.currentTime,true); paint();showModulation(); },
      destroy(){ if(destroyed)return; destroyed=true; if(guardT)clearInterval(guardT); instance.unmount(); for(const n of sources){ n.onended=null; try{n.stop();}catch{} } for(const n of nodes)try{n.disconnect();}catch{} try{mon1.disconnect();}catch{} try{mon2.disconnect();}catch{} sources.clear(); nodes.clear(); voices.clear(); }
    };
    apply(ctx.currentTime,true); return instance;
  }
};
