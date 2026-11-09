// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Uitleg naar about (menu Over Paradox); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (onwaarschijnlijk klankorganisme) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.11.0 — Bijgewerkt naar Patchkamer contract v1.11 (eigen map, nieuwe bestandsnaam zonder versienummer; id, poort-id's en state ongewijzigd):
//   - tweetalig (host.lang): alle teksten in een woordenboek, namen van het apparaat en de poorten per taal in i18n; de universa heten Engels
//   - tekenen via host.frame met een ResizeObserver en een kleurcache (geen eigen animatielus, geen kleuropvraging per frame)
//   - setState volgt §13: ongeldige waarden krijgen de standaard, getallen worden afgekapt; schuiven hebben een beginwaarde (dubbelklik)
//   - bewaker in de klankmotor: een ongeldige toestand wordt geweigerd en een ontspoorde toestand (NaN/Infinity in het geheugen, de galm of een stem)
//     wordt per blok herkend en gewist, zodat het apparaat nooit voor altijd stil blijft of NaN doorgeeft. Normaal geluid is bit-identiek.
//   - de keuzelijst "Delen per" toonde bij 1/16, 1/8 en 1/4 niets na het laden van een state; opgelost
// Een klankorganisme: synthese met een niet-lineaire golfgeleider, een Lorenz-attractor die toonhoogte en klank laat afdrijven, een cellulaire
// automaat die zelf noten verzint en een granulaire stereo-geheugenlus. Zelfstandig: geen samples, geen imports, geen netwerk.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MODES = ['Plasma', 'Glasvlees', 'Machinekoor', 'Zwerm', 'Breuklijn', 'Tijdlek'];
const BEHAVIORS = [['keys', 'Bespeelbaar'], ['drone', 'Drone'], ['organism', 'Organisme']];
const PARAMETERS = [
 ['matter','Materie',0,1,.52,'De verhouding tussen zachte massa en harde, inharmonische boventonen.'],
 ['mutation','Mutatie',0,1,.54,'Lorenz-chaos vervormt fase, stemming en resonanties.'],
 ['friction','Wrijving',0,1,.38,'Voedt de niet-lineaire golfgeleider; verandert de klank in snaar, buis of stroef organisme.'],
 ['fold','Vouwing',0,1,.35,'Vouwt golfvormen terug in zichzelf.'],
 ['fracture','Breuk',0,1,.12,'Verlaagt resolutie en klok: een bestuurbare digitale ontbinding.'],
 ['memory','Geheugen',0,1,.30,'Mengt overlappende korrels uit de eigen stereo-geheugenlus bij.'],
 ['warp','Tijdrichting',0,1,.64,'Links: achteruit. Midden: bijna stilstaand. Rechts: versneld vooruit.'],
 ['size','Korrelgrootte',0,1,.42,'Van nerveuze tijdsplinters tot lange flarden.'],
 ['space','Ruimte',0,1,.32,'Gedempte resonante galm achter het organisme.'],
 ['orbit','Baan',0,1,.6,'Omloopbanen van stemmen in het stereoveld.'],
 ['life','Leven',0,1,.56,'Versnelt de vreemde attractor en maakt het interne ritme grilliger.'],
 ['density','Bevolking',0,1,.56,'Bepaalt kans, duur en onderlinge overlap van autonome stemmen.'],
 ['input','Voeding',0,1,0,'Verwerkt audio uit Eten; voedt resonanties en het geheugen.'],
 ['rate','Celdeling',.12,12,2.8,'Autonome gebeurtenissen per seconde, tenzij Klok aanstaat.'],
 ['root','Grondtoon',24,84,48,'Grondtoon van drones en het interne organisme; externe noten behouden hun toonhoogte.'],
 ['attack','Geboorte',.003,2,.024,'Opkomsttijd van iedere stem.'],
 ['release','Verval',.03,8,1.3,'Uitsterftijd na een noot of autonome gebeurtenis.'],
 ['level','Uitgang',0,1,.55,'Totaalniveau. Randomiseren verandert dit niet.']
];
const EN = {
 'Plasma': 'Plasma', 'Glasvlees': 'Glass flesh', 'Machinekoor': 'Machine choir', 'Zwerm': 'Swarm', 'Breuklijn': 'Fault line', 'Tijdlek': 'Time leak',
 'Bespeelbaar': 'Playable', 'Drone': 'Drone', 'Organisme': 'Organism',
 'Materie': 'Matter', 'Mutatie': 'Mutation', 'Wrijving': 'Friction', 'Vouwing': 'Fold', 'Breuk': 'Fracture', 'Geheugen': 'Memory', 'Tijdrichting': 'Time direction',
 'Korrelgrootte': 'Grain size', 'Ruimte': 'Space', 'Baan': 'Orbit', 'Leven': 'Life', 'Bevolking': 'Population', 'Voeding': 'Feed', 'Celdeling': 'Cell rate',
 'Grondtoon': 'Root', 'Geboorte': 'Birth', 'Verval': 'Decay', 'Uitgang': 'Output',
 'De verhouding tussen zachte massa en harde, inharmonische boventonen.': 'The balance between soft mass and hard, inharmonic overtones.',
 'Lorenz-chaos vervormt fase, stemming en resonanties.': 'Lorenz chaos distorts phase, tuning and resonances.',
 'Voedt de niet-lineaire golfgeleider; verandert de klank in snaar, buis of stroef organisme.': 'Feeds the non-linear waveguide; turns the sound into a string, a tube or a rough organism.',
 'Vouwt golfvormen terug in zichzelf.': 'Folds waveforms back into themselves.',
 'Verlaagt resolutie en klok: een bestuurbare digitale ontbinding.': 'Lowers resolution and clock rate: a controllable digital breakdown.',
 'Mengt overlappende korrels uit de eigen stereo-geheugenlus bij.': 'Mixes in overlapping grains from its own stereo memory loop.',
 'Links: achteruit. Midden: bijna stilstaand. Rechts: versneld vooruit.': 'Left: backwards. Middle: almost standing still. Right: sped-up forwards.',
 'Van nerveuze tijdsplinters tot lange flarden.': 'From nervous time splinters to long streaks.',
 'Gedempte resonante galm achter het organisme.': 'Damped resonant reverb behind the organism.',
 'Omloopbanen van stemmen in het stereoveld.': 'Orbits of the voices in the stereo field.',
 'Versnelt de vreemde attractor en maakt het interne ritme grilliger.': 'Speeds up the strange attractor and makes the internal rhythm more erratic.',
 'Bepaalt kans, duur en onderlinge overlap van autonome stemmen.': 'Sets the probability, duration and overlap of the autonomous voices.',
 'Verwerkt audio uit Eten; voedt resonanties en het geheugen.': 'Processes audio from the Feed input; excites the resonances and the memory.',
 'Autonome gebeurtenissen per seconde, tenzij Klok aanstaat.': 'Autonomous events per second, unless Clock is on.',
 'Grondtoon van drones en het interne organisme; externe noten behouden hun toonhoogte.': 'Root note of the drones and the internal organism; external notes keep their pitch.',
 'Opkomsttijd van iedere stem.': 'Attack time of every voice.',
 'Uitsterftijd na een noot of autonome gebeurtenis.': 'Fade-out time after a note or autonomous event.',
 'Totaalniveau. Randomiseren verandert dit niet.': 'Overall level. Randomizing does not change this.',
 'Een universum kiezen': 'Choose a universe', 'Kies een universum…': 'Choose a universe…',
 'Anatomie': 'Anatomy', 'Gedrag': 'Behavior', 'Leeft': 'Alive', 'Volg Start/Stop': 'Follow Start/Stop', 'Klok': 'Clock', 'Delen per': 'Division', '1 maat': '1 bar', '2 maten': '2 bars',
 'Live golfvorm, vreemde attractor en cellulaire automaat': 'Live waveform, strange attractor and cellular automaton',
 'stemmen': 'voices', 'BEVROREN': 'FROZEN', 'Lorenz-baan · celautomaat · live audio': 'Lorenz orbit · cellular automaton · live audio',
 'Muteer': 'Mutate', 'Celdeling!': 'Cell division!', 'Vouw de tijd': 'Fold time', 'Bevries geheugen': 'Freeze memory', 'Ontdooi geheugen': 'Thaw memory', 'PANIEK / stil': 'PANIC / silence',
 'Speel {0}': 'Play {0}',
 'Wekt het organisme…': 'Waking the organism…', 'levend': 'alive', 'stil': 'idle', ' · geheugen bevroren': ' · memory frozen', ' · tempo ': ' · tempo ',
 'AudioWorklet-engine · Eten actief': 'AudioWorklet engine · Feed active', 'Compatibiliteits-engine · Eten actief': 'Compatibility engine · Feed active',
 'Buffer-engine · Eten niet beschikbaar · extra triggerlatentie': 'Buffer engine · Feed not available · extra trigger latency'
};
const defaults = () => {
 const s = { mode: 0, behavior: 'organism', on: true, follow: false, sync: false, division: 1 };
 for (const [k,,min,max,v] of PARAMETERS) s[k] = v; return s;
};
const PRESETS = [
 ['Quantum Terrarium',{mode:0,matter:.5,mutation:.5,friction:.38,fold:.3,memory:.32,warp:.68,life:.55,density:.58,rate:2.8,root:48}],
 ['Choir of Broken Satellites',{mode:2,behavior:'drone',matter:.72,mutation:.35,friction:.55,fold:.18,memory:.48,warp:.6,space:.6,life:.28,root:45,attack:.8,release:3.5}],
 ['Glass Entrails',{mode:1,matter:.82,mutation:.65,friction:.7,fold:.58,fracture:.09,memory:.25,rate:3.4,root:55,release:1.7}],
 ['Black Hole Fax',{mode:4,matter:.75,mutation:.8,fold:.68,fracture:.85,memory:.26,warp:.16,size:.18,rate:6.3,root:36,release:.22}],
 ['Comet Dentist',{mode:3,matter:.84,mutation:.83,fold:.75,fracture:.22,life:.86,density:.9,rate:9,root:60,release:.35}],
 ['Reversed Time Soup',{mode:5,matter:.35,mutation:.44,fold:.22,memory:.88,warp:.1,size:.79,space:.48,rate:1.3,root:43,release:2.5}],
 ['Dancing Concrete Ants',{mode:3,matter:.4,mutation:.66,friction:.75,fold:.55,fracture:.61,memory:.18,rate:7.3,root:31,release:.15,space:.18}],
 ['Fog With Gears',{mode:2,behavior:'drone',matter:.3,mutation:.4,friction:.73,fold:.27,fracture:.24,memory:.55,warp:.4,size:.8,space:.65,root:38,attack:1.2}],
 ['A Piano Dreaming of Metal',{mode:1,matter:.45,mutation:.17,friction:.52,fold:.11,fracture:.03,memory:.15,rate:1.8,root:60,attack:.004,release:2.8}],
 ['Alien Water Bell',{mode:0,matter:.24,mutation:.48,friction:.44,fold:.18,memory:.42,warp:.82,size:.21,space:.5,rate:1.6,root:57,release:.55}],
 ['Meat Radio on the Moon',{mode:2,matter:.85,mutation:.71,friction:.32,fold:.62,fracture:.48,memory:.32,rate:2.2,root:50,release:.7}],
 ['Organ for Nonexistent Gods',{mode:2,behavior:'drone',matter:.6,mutation:.2,friction:.62,fold:.38,memory:.3,warp:.76,space:.76,life:.18,root:36,attack:1.4}],
 ['Bees in a Moebius Strip',{mode:3,behavior:'drone',matter:.65,mutation:.82,friction:.36,fold:.43,memory:.56,warp:.24,size:.38,orbit:1,life:.88,root:57}],
 ['Fossil of Tomorrow',{mode:5,behavior:'drone',matter:.2,mutation:.36,friction:.8,fold:.15,memory:.84,warp:.44,size:.94,space:.65,root:31,attack:1.5}],
 ['Numeric Sandstorm',{mode:4,matter:.98,mutation:.85,friction:.32,fold:.9,fracture:.96,memory:.2,rate:11,density:.94,root:55,release:.1,space:.14}],
 ['Ritual for a Broken Robot',{mode:4,matter:.3,mutation:.55,friction:.65,fold:.4,fracture:.55,memory:.35,warp:.7,sync:true,division:.5,rate:4,root:36,release:.4}],
 ['The Sea Eats Its Own Echo',{mode:5,matter:.56,mutation:.6,friction:.6,fold:.42,memory:.87,warp:.21,size:.85,life:.3,rate:.8,root:41,attack:.35,release:4.2}],
 ['Whispering Barbed Wire',{mode:1,behavior:'drone',matter:.88,mutation:.75,friction:.77,fold:.3,fracture:.28,memory:.4,warp:.62,space:.5,root:67,attack:1.1}],
 ['Soft Singularity',{mode:0,behavior:'drone',matter:.18,mutation:.25,friction:.3,fold:.08,memory:.61,warp:.57,size:.92,space:.72,life:.15,root:43,attack:1.5}],
 ['A Printer’s Last Thought',{mode:4,matter:.65,mutation:.92,friction:.85,fold:.78,fracture:.72,memory:.74,warp:.31,size:.1,rate:5.7,root:45,release:.55}]
];
const preset = i => ({...defaults(), ...PRESETS[i][1]});
const DIVISIONS = [['0.25','1/16'],['0.5','1/8'],['1','1/4'],['2','1/2'],['4','1 maat'],['8','2 maten']];
function normalize(raw) {
 const s=defaults();raw=raw&&typeof raw==='object'?raw:{};
 for(const[k,,min,max,v]of PARAMETERS) if(typeof raw[k]==='number'&&Number.isFinite(raw[k]))s[k]=clamp(raw[k],min,max);
 s.root=Math.round(s.root);s.mode=Number.isInteger(raw.mode)&&raw.mode>=0&&raw.mode<6?raw.mode:0;
 s.behavior=['organism','drone','keys'].includes(raw.behavior)?raw.behavior:s.behavior;
 for(const k of ['on','follow','sync']) if(typeof raw[k]==='boolean')s[k]=raw[k];
 s.division=[.25,.5,1,2,4,8].includes(raw.division)?raw.division:1;return s;
}

// Let op: de klasse wordt als tekst in de worklet gezet (toString); ze mag dus niets uit deze module gebruiken.
class ParadoxEngine {
 constructor(sr,seed=97127) {
  this.sr=sr;this.seed=seed>>>0||1;this.state=null;this.events=[];this.dead=false;this.frozen=false;this.tick=0;this.time=0;
  this.controlValues={matter:.52,mutation:.54,friction:.38,fold:.35,fracture:.12,memory:.3,warp:.64,size:.42,space:.32,orbit:.6,life:.56,density:.56,input:0};
  this.keys=Object.keys(this.controlValues);this.weights=new Float64Array(6);this.weights[0]=1;
  this.x=.18;this.y=.24;this.z=17;this.ca=0x5ac3159d;this.divisionPhase=0;this.age=0;this.spawnCounter=0;this.bpm=120;this.first=true;
  this.voices=Array.from({length:6},()=>({active:false,delay:new Float32Array(Math.ceil(sr/20)+8),pointer:0,phase:0,p2:0,p3:0,p4:0,prev:0,hold:0,holdCounter:0,low:0,env:0,age:0}));
  const length=Math.round(sr*3.2);this.memL=new Float32Array(length);this.memR=new Float32Array(length);this.write=0;
  this.grains=[{phase:0,anchor:0},{phase:.5,anchor:0}];this.dcIn=[0,0];this.dcOut=[0,0];
  this.combs=Array.from({length:6},(_,i)=>({data:new Float32Array(Math.round(sr*([.0313,.0417,.0539][i%3]+(i>2?.0023:0)))),pos:0,low:0}));
  this.numeric=['mode','matter','mutation','friction','fold','fracture','memory','warp','size','space','orbit','life','density','input','rate','root','attack','release'];
 }
 random(){let n=this.seed;n^=n<<13;n^=n>>>17;n^=n<<5;this.seed=n>>>0;return this.seed/4294967296;}
 noise(){return this.random()*2-1;}
 // Een toestand met een ontbrekend of niet-eindig getal wordt geweigerd: de motor houdt de vorige toestand.
 set(s){
  if(!s||typeof s!=='object')return;
  for(const k of this.numeric)if(!Number.isFinite(s[k]))return;
  if(!(s.division>0)||!Number.isFinite(s.division))return;
  if(!this.state||this.state.behavior!==s.behavior)this.first=true;this.state=s;if(typeof s.bpm==='number'&&Number.isFinite(s.bpm))this.bpm=Math.max(20,s.bpm);
 }
 event(e){if(Number.isFinite(e.time)&&this.events.length<256){this.events.push(e);this.events.sort((a,b)=>a.time-b.time);}}
 releaseAll(){for(const v of this.voices)if(v.active)v.releasing=true;}
 // Bewaker: wist alles wat NaN of Infinity kan bevatten en zet de besturing terug. Alleen aangeroepen bij een ontspoorde uitvoer.
 recover(){
  this.memL.fill(0);this.memR.fill(0);this.write=0;
  for(const c of this.combs){c.data.fill(0);c.pos=0;c.low=0;}
  for(const v of this.voices){v.active=false;v.env=0;v.prev=0;v.low=0;v.hold=0;v.delay.fill(0);v.pointer=0;}
  this.dcIn=[0,0];this.dcOut=[0,0];this.x=.18;this.y=.24;this.z=17;this.divisionPhase=0;
  for(const g of this.grains)g.anchor=0;
  const s=this.state;
  for(const k of this.keys){const t=s&&Number.isFinite(s[k])?s[k]:0.5;this.controlValues[k]=t;}
  for(let j=0;j<6;j++)this.weights[j]=s&&j===s.mode?1:0;
  if(!this.ca)this.ca=0x5ac3159d;
 }
 note(note,vel,time,dur=0,tag='key'){
  // Geen afkappen/stealing: een volle populatie laat nieuwe gebeurtenissen voorbijgaan.
  const v=this.voices.find(v=>!v.active);if(!v)return;
  v.active=true;v.tag=tag;v.note=note;v.velocity=Math.max(0,Math.min(1,vel));v.env=0;v.age=0;v.releasing=false;
  v.end=dur>0?time+dur:Infinity;v.freq=440*Math.pow(2,(Math.max(12,Math.min(108,note))-69)/12);v.phase=0;v.p2=this.random()*6.283;v.p3=this.random()*6.283;v.p4=0;v.prev=0;v.low=0;v.hold=0;v.holdCounter=0;
  v.delay.fill(0);v.pointer=0;v.pan=this.noise()*.65;v.detune=this.noise();this.spawnCounter++;
 }
 advanceCA(){const left=(this.ca<<1)|(this.ca>>>31),right=(this.ca>>>1)|(this.ca<<31);this.ca=(left^(this.ca|right))>>>0;if(!this.ca)this.ca=0x5ac3159d;}
 control(t){
  const s=this.state,p=this.controlValues,dt=32/this.sr,blend=1-Math.exp(-dt/.11);
  for(const k of this.keys)p[k]+=(s[k]-p[k])*blend;
  for(let j=0;j<6;j++)this.weights[j]+=((j===s.mode?1:0)-this.weights[j])*blend;
  const rate=.0004+p.life*.005;
  const dx=10*(this.y-this.x),dy=this.x*(28-this.z)-this.y,dz=this.x*this.y-2.6666667*this.z;
  this.x=Math.max(-35,Math.min(35,this.x+dx*rate));this.y=Math.max(-40,Math.min(40,this.y+dy*rate));this.z=Math.max(0,Math.min(65,this.z+dz*rate));
  if(!Number.isFinite(this.x+this.y+this.z)){this.x=.18;this.y=.24;this.z=17;}
  if(s.behavior!=='drone')for(const v of this.voices)if(v.active&&v.tag==='drone')v.releasing=true;
  if(s.behavior==='drone'&&!this.voices.some(v=>v.active&&v.tag==='drone'&&!v.releasing))this.note(s.root,.7,t,0,'drone');
  if(this.first&&s.behavior==='organism'){this.note(s.root+7,.6,t,.3,'cell');this.first=false;}
  this.divisionPhase+=dt*(s.sync?this.bpm/60/s.division:s.rate);
  if(!Number.isFinite(this.divisionPhase))this.divisionPhase=0;
  if(this.divisionPhase>=1){
   this.divisionPhase%=1;this.advanceCA();
   if(s.behavior==='organism'&&this.random()<.2+p.density*.8){
    const scale=[0,3,7,10,14,18,21,24],index=(this.ca>>>6)&7;
    const bend=(p.mutation>.7?this.noise()*(p.mutation-.7)*9:0);
    const duration=(.05+p.density*.55)/(s.sync?Math.max(.2,this.bpm/60/s.division):Math.max(.2,s.rate))+.06;
    this.note(s.root+scale[index]+bend,.45+.4*this.random(),t,duration,'cell');
   }
  }
 }
 read(buffer,pos){const len=buffer.length;pos=((pos%len)+len)%len;const a=Math.floor(pos),f=pos-a;return buffer[a]*(1-f)+buffer[(a+1)%len]*f;}
 render(l,r,start,inL=null,inR=null){
  if(this.dead||!this.state){l.fill(0);r.fill(0);return;}
  let s=this.state;const sr=this.sr,pi2=6.283185307179586,p=this.controlValues;
  for(let i=0;i<l.length;i++){
   const t=start+i/sr;
   while(this.events.length&&this.events[0].time<=t){const e=this.events.shift();
    if(e.type==='state'){this.set(e.state);s=this.state;}
    else if(e.type==='note')this.note(e.note,e.vel,t,e.dur||0,'key');
    else if(e.type==='off'){for(const v of this.voices)if(v.active&&v.tag==='key'&&Math.round(v.note)===Math.round(e.note))v.releasing=true;}
    else if(e.type==='panic')this.releaseAll();
    else if(e.type==='freeze')this.frozen=!!e.value;
    else if(e.type==='bang'){this.advanceCA();for(let j=0;j<3;j++)this.note(s.root+[0,13,25][j],.8,t,.09+j*.07,'cell');}
   }
   if(!(this.tick++%32))this.control(t);
   const extL=Number.isFinite(inL&&inL[i])?Math.max(-2,Math.min(2,inL[i])):0,extR=Number.isFinite(inR&&inR[i])?Math.max(-2,Math.min(2,inR[i])):extL;
   let left=(extL*.35)*p.input,right=(extR*.35)*p.input;
   for(const v of this.voices){
    if(!v.active)continue;
    if(t>=v.end)v.releasing=true;
    if(v.releasing)v.env*=Math.exp(-1/(sr*Math.max(.01,s.release)*.2));else v.env+=(1-v.env)*(1-Math.exp(-1/(sr*s.attack*.23)));
    if(v.releasing&&v.env<.00006){v.active=false;continue;}
    v.age++;
    const target=v.tag==='drone'?440*Math.pow(2,(s.root-69)/12):v.freq;
    if(v.tag==='drone')v.freq+=(target-v.freq)*.001;
    const chaos=this.x/25,other=this.y/30;
    const f=Math.min(sr*.12,v.freq*Math.pow(2,chaos*p.mutation*.14+v.detune*p.orbit*.008));
    v.phase+=pi2*f/sr;v.p2+=pi2*f*(1.41+p.matter*2.73)/sr;v.p3+=pi2*f*(.503+p.matter*.016)/sr;v.p4+=pi2*(.09+p.orbit*.8)/sr;
    if(v.phase>=pi2)v.phase-=pi2;if(v.p2>=pi2)v.p2%=pi2;if(v.p3>=pi2)v.p3-=pi2;if(v.p4>=pi2)v.p4-=pi2;
    const feedback=Math.max(-1,Math.min(1,v.prev))*(.1+p.friction*2.2);
    const mod=Math.sin(v.p2+feedback)*(p.matter*.6+p.mutation*(1+chaos*.4)*5.2);
    const core=Math.sin(v.phase+mod),sub=Math.sin(v.p3);
    const folded=Math.sin((core+sub*.2)*(1+p.fold*12));
    let sound=0;
    if(this.weights[0]>.0001)sound+=this.weights[0]*(Math.sin(v.phase+mod*.55+folded*p.fold*2)*.65+sub*.35);
    if(this.weights[1]>.0001)sound+=this.weights[1]*(Math.sin(v.phase*2+mod*1.2)*.5+Math.sin(v.p2+folded*3)*.32+sub*.18);
    if(this.weights[2]>.0001){const vowel=2.1+p.matter*6+other*p.mutation*2;sound+=this.weights[2]*(Math.sin(v.phase+Math.sin(v.phase*vowel)*(.8+p.fold*3))*.65+Math.sin(v.phase*.5+other)*.25);}
    if(this.weights[3]>.0001)sound+=this.weights[3]*(Math.sin(v.phase+mod)*Math.sin(v.p3*1.997+folded)*.65+Math.sin(v.phase+Math.sin(v.p2)*4)*.3);
    if(this.weights[4]>.0001){const cell=((this.ca>>>(Math.floor(v.phase/pi2*24)&31))&1)?1:-1;sound+=this.weights[4]*(folded*.5+cell*.25+sub*.25);}
    if(this.weights[5]>.0001)sound+=this.weights[5]*(Math.sin(v.phase+feedback*4+Math.sin(v.p2)*chaos)*.5+sub*.4+folded*.1);
    // Pluk/buig een kort geheugen op de nootfrequentie. Verzading houdt feedback begrensd.
    const delay=Math.max(8,Math.min(v.delay.length-2,sr/f*(.75+p.matter*.5)));
    let read=v.pointer-delay;if(read<0)read+=v.delay.length;const lo=Math.floor(read),frac=read-lo;
    const resonance=v.delay[lo]*(1-frac)+v.delay[(lo+1)%v.delay.length]*frac;
    const exciter=sound*.25+(extL+extR)*.16*p.input+this.noise()*.015*p.friction;
    const regen=(exciter+resonance*(.28+p.friction*.67));v.delay[v.pointer]=regen/(1+Math.abs(regen)*.5);v.pointer=(v.pointer+1)%v.delay.length;
    sound=sound*(1-p.friction*.5)+resonance*p.friction*.8;
    // Sample-hold en kwantisatie worden droog/nat gemengd: Fracture=0 is werkelijk schoon.
    if(--v.holdCounter<=0){const bits=15-p.fracture*12.5,steps=Math.pow(2,bits);v.hold=Math.round(sound*steps)/steps;v.holdCounter=1+Math.floor(p.fracture*p.fracture*38);}
    sound=sound*(1-p.fracture)+v.hold*p.fracture;
    v.low+=(sound-v.low)*(.14+.65*(1-p.matter*.65));sound=v.low;
    v.prev=sound;
    const amp=sound*v.env*v.velocity*.24;
    const pan=Math.max(-.95,Math.min(.95,v.pan*(.25+p.orbit*.5)+Math.sin(v.p4+other)*p.orbit*.35));
    left+=amp*Math.sqrt((1-pan)*.5);right+=amp*Math.sqrt((1+pan)*.5);
   }
   // Twee Hann-gewindowde leeskoppen: achteruit, stilstaand of vooruit in eigen verleden.
   const grainFrames=sr*(.025+p.size*p.size*.58),speed=(p.warp-.5)*4;
   let memL=0,memR=0;
   for(const g of this.grains){g.phase+=1/grainFrames;if(g.phase>=1){g.phase-=1;g.anchor=this.write-sr*(.09+p.size*.9);}
    const window=Math.sin(Math.PI*g.phase)**2,pos=g.anchor+g.phase*grainFrames*speed;
    memL+=this.read(this.memL,pos)*window;memR+=this.read(this.memR,pos)*window;
   }
   if(!this.frozen){this.memL[this.write]=Math.tanh(left+memR*p.memory*.22);this.memR[this.write]=Math.tanh(right+memL*p.memory*.22);this.write=(this.write+1)%this.memL.length;}
   const memoryMix=p.memory*(.7+this.weights[5]*.18);
   left=left*(1-memoryMix)+memL*memoryMix;right=right*(1-memoryMix)+memR*memoryMix;
   let wetL=0,wetR=0;
   for(let j=0;j<6;j++){const c=this.combs[j],old=c.data[c.pos];c.low+=(old-c.low)*.22;
    c.data[c.pos]=(j<3?left:right)*.24+c.low*.77;c.pos++;if(c.pos===c.data.length)c.pos=0;if(j<3)wetL+=old;else wetR+=old;}
   left=left*(1-p.space*.3)+wetL*p.space*.5;right=right*(1-p.space*.3)+wetR*p.space*.5;
   const dl=left-this.dcIn[0]+.9978*this.dcOut[0],dr=right-this.dcIn[1]+.9978*this.dcOut[1];this.dcIn[0]=left;this.dcIn[1]=right;this.dcOut[0]=dl;this.dcOut[1]=dr;
   l[i]=.78*Math.tanh(dl*5.2);r[i]=.78*Math.tanh(dr*5.2);
  }
  // Bewaker: de uitvoer is normaal begrensd op 0,78. NaN, Infinity of een absurde waarde betekent een ontspoorde toestand.
  let bad=false;for(let i=0;i<l.length;i++){const a=l[i],b=r[i];if(!(a>-4&&a<4&&b>-4&&b<4)){bad=true;break;}}
  if(bad){this.recover();l.fill(0);r.fill(0);}
  this.time=start+l.length/sr;
 }
}
const WNAME='nl-patchkamer-paradox-1-11-0';
const WORKLET=`${ParadoxEngine.toString()}
class P extends AudioWorkletProcessor {
 constructor(){super();this.engine=new ParadoxEngine(sampleRate,Math.floor(Math.random()*2147483647)+1);this.alive=true;this.frames=0;
 this.port.onmessage=({data})=>{if(!data)return;if(data.type==='state')this.engine.set(data.state);else if(data.type==='event')this.engine.event(data.event);else if(data.type==='close'){this.alive=false;this.engine.dead=true;}};}
 process(inputs,outputs){const out=outputs[0],ins=inputs[0]||[];if(out&&out[0])this.engine.render(out[0],out[1]||out[0],currentTime,ins[0],ins[1]);if(!(this.frames++%16)&&this.alive)this.port.postMessage({x:this.engine.x,y:this.engine.y,z:this.engine.z,ca:this.engine.ca,population:this.engine.voices.filter(v=>v.active).length});return this.alive;}
}registerProcessor('${WNAME}',P);`;

// terugval voor een host zonder host.frame (contract §12b)
const drawLoop = (host, inst, cb, fps) => {
 if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
 let raf = 0, last = 0, stop = false;
 const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
 raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
 id:'nl.patchkamer.paradox',name:'Paradox',version:'1.13.0',kind:'instrument',category:'synth',ui:{width:860,minWidth:320},about:{nl:'Onwaarschijnlijk klankorganisme.\n\nGeef het een noot. Voer het audio. Of laat het zichzelf verzinnen.\n\nKlavier: externe noten houden hun toonhoogte. Kies Bespeelbaar om het interne organisme uit te zetten.\n\nEten is de audio-ingang. Geheugen bevriest alleen deze sessie; de inhoud wordt niet in tunes opgeslagen.',en:'An improbable sound organism.\n\nGive it a note. Feed it audio. Or let it invent itself.\n\nKeyboard: external notes keep their pitch. Choose Playable to switch the internal organism off.\n\nFeed is the audio input. Freezing the memory only lasts this session; its contents are not stored in tunes.'},
 i18n:{nl:{ports:{feed:'Eten',out:'Ontsnapping',notes:'Noten / CC'}}},
 ports:{audioIn:[{id:'feed',name:'Feed'}],audioOut:[{id:'out',name:'Escape'}],eventIn:[{id:'notes',name:'Notes / CC'}],eventOut:[],modIn:[],modOut:[],multiIn:[],multiOut:[]},
 create(ctx,host){
  const tx=(k,...a)=>{let t=host.lang==='nl'?k:(EN[k]??k);a.forEach((v,i)=>{t=t.replace('{'+i+'}',v);});return t;};
  let state=defaults(),offsets={},effective,dead=false,transport=false,bpm=Number.isFinite(host.bpm)?host.bpm:120;
  let backend=null,local=null,timer=null,nextTime=0,frozen=false,label='Wekt het organisme…';const queued=[],sources=new Set(),uiHeld=new Set();let telemetry=null;const trail=[];
  let shell=null,root=null,controls=[],presetSelect=null,status=null,freezeButton=null,cv=null,g=null,stopDraw=null,observer=null;
  let cw=300,ch=190,col=null,colT=0;
  const feed=ctx.createGain(),out=ctx.createGain(),an=ctx.createAnalyser();out.gain.value=0;an.fftSize=512;out.connect(an);const waveform=new Float32Array(512);
  const descriptors=PARAMETERS.map(([id,name,min,max])=>({id,name:tx(name),min,max,lane:'paradox',laneName:'Paradox',role:id==='level'?'level':id==='rate'?'rate':'depth',scale:'lin',drift:.1,on:id!=='level'&&id!=='input',fast:false}));
  function statusText(){if(status)status.textContent=tx(label)+' · '+tx(state.on&&(!state.follow||transport)?'levend':'stil')+(frozen?tx(' · geheugen bevroren'):'')+(state.sync?tx(' · tempo ')+Math.round(bpm):'');}
  function syncUI(){for(const c of controls){const value=state[c.key];if(c.check)c.el.checked=value;else c.el.value=String(value);if(c.output)c.output.textContent=c.format(value);}if(presetSelect)presetSelect.value='';if(freezeButton){freezeButton.textContent=tx(frozen?'Ontdooi geheugen':'Bevries geheugen');freezeButton.setAttribute('aria-pressed',String(frozen));}statusText();}
  function send(event){if(dead)return;event.time=Number.isFinite(event.time)?Math.max(ctx.currentTime,event.time):ctx.currentTime;if(backend&&backend.port)backend.port.postMessage({type:'event',event});else if(local)local.event(event);else if(queued.length<256)queued.push(event);}
  function apply(time=ctx.currentTime){
   if(dead)return;effective={...state,bpm};for(const p of descriptors)effective[p.id]=clamp(state[p.id]+(offsets[p.id]||0)*(p.max-p.min),p.min,p.max);
   const at=Number.isFinite(time)?Math.max(ctx.currentTime,time):ctx.currentTime;
   out.gain.setTargetAtTime(state.on&&(!state.follow||transport)?effective.level:0,at,.055);
   if(at>ctx.currentTime)send({type:'state',state:effective,time:at});else{if(backend&&backend.port)backend.port.postMessage({type:'state',state:effective});if(local)local.set(effective);}statusText();
  }
  function pump(){
   if(dead||!local||ctx.state==='suspended'||ctx.state==='closed')return;
   const now=ctx.currentTime,frames=Math.round(ctx.sampleRate*.08),duration=frames/ctx.sampleRate;if(nextTime<now)nextTime=now+.015;let count=0;
   while(nextTime<now+.16&&count++<4){const buffer=ctx.createBuffer(2,frames,ctx.sampleRate);local.render(buffer.getChannelData(0),buffer.getChannelData(1),nextTime);
    const node=ctx.createBufferSource();node.buffer=buffer;node.connect(out);sources.add(node);node.onended=()=>{sources.delete(node);node.disconnect();};node.start(nextTime);node.stop(nextTime+duration);nextTime+=duration;}
  }
  function fallback(){
   if(dead)return;local=new ParadoxEngine(ctx.sampleRate,Math.floor(Math.random()*2147483647)+1);local.set(effective);local.frozen=frozen;queued.splice(0).forEach(e=>local.event(e));
   if(typeof ctx.createScriptProcessor==='function'){
    try{backend=ctx.createScriptProcessor(1024,2,2);backend.onaudioprocess=e=>{if(dead||!local)return;const input=e.inputBuffer,output=e.outputBuffer;local.render(output.getChannelData(0),output.getChannelData(1),Number.isFinite(e.playbackTime)?e.playbackTime:ctx.currentTime,input.getChannelData(0),input.numberOfChannels>1?input.getChannelData(1):input.getChannelData(0));};feed.connect(backend);backend.connect(out);label='Compatibiliteits-engine · Eten actief';statusText();return;}catch(_){if(backend){try{feed.disconnect(backend);}catch(_){}backend.disconnect();}backend=null;}
   }
   label='Buffer-engine · Eten niet beschikbaar · extra triggerlatentie';nextTime=ctx.currentTime+.02;pump();timer=setInterval(pump,35);statusText();
  }
  apply();
  if(typeof host.loadWorklet==='function'&&typeof AudioWorkletNode==='function'){
   Promise.resolve().then(()=>host.loadWorklet(WNAME,WORKLET)).then(loaded=>{
    if(dead)return;if(loaded===false){fallback();return;}
    try{backend=new AudioWorkletNode(ctx,WNAME,{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]});feed.connect(backend);backend.connect(out);backend.port.onmessage=({data})=>{telemetry=data;};backend.port.postMessage({type:'state',state:effective});queued.splice(0).forEach(event=>backend.port.postMessage({type:'event',event}));
     backend.onprocessorerror=()=>{if(dead||!backend)return;const old=backend;backend=null;old.onprocessorerror=null;feed.disconnect(old);old.disconnect();old.port.close();fallback();};label='AudioWorklet-engine · Eten actief';statusText();
    }catch(_){if(backend){try{feed.disconnect(backend);}catch(_){}backend.disconnect();if(backend.port)backend.port.close();backend=null;}fallback();}
   }).catch(()=>{if(!dead)fallback();});
  }else fallback();
  const onSkin=()=>{col=null;};
  const stopLoop=()=>{if(stopDraw){stopDraw();stopDraw=null;}};
  function unmount(){for(const note of uiHeld)send({type:'off',note,time:ctx.currentTime});uiHeld.clear();trail.length=0;stopLoop();if(observer)observer.disconnect();observer=null;if(typeof window.removeEventListener==='function')window.removeEventListener('patchkamer-skin',onSkin);if(shell)shell.remove();shell=root=status=cv=g=freezeButton=presetSelect=null;controls=[];}
  function noteOn(note,vel=.7,dur=0){send({type:'note',note,vel,dur,time:ctx.currentTime});}
  const api={
   inputs:{feed},outputs:{out},
   mount(el){
    if(dead)return;unmount();shell=document.createElement('div');el.appendChild(shell);root=shell.attachShadow({mode:'open'});
    const style=document.createElement('style');style.textContent=`
     :host{display:block;min-width:0;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}
     .lab{border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--card)}
     .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
     .status{color:var(--muted);font-size:11px;line-height:1.5}
     select,button{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:5px;padding:6px;max-width:100%;min-width:0}
     select{flex:1}button{cursor:pointer}button:hover{border-color:var(--audio)}input{accent-color:var(--audio)}
     .screen{position:relative;height:190px;min-width:0;margin:12px 0;background:var(--well);border:1px solid var(--line);border-radius:8px;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
     .parameters{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:7px;margin:12px 0}
     .control{min-width:0;padding:9px;border:1px solid var(--line);border-radius:6px;background:var(--card-2)}.label{display:flex;justify-content:space-between;gap:8px;margin-bottom:7px}.value{color:var(--audio)}input[type=range]{display:block;width:100%;margin:0}
     .keyboard{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:3px;margin:10px 0}.key{padding:15px 0 8px;font-size:10px;border-bottom:4px solid var(--audio);touch-action:none}.key.black{background:var(--card-2);border-bottom-color:var(--mod)}
     .separator{height:1px;background:var(--line);margin:12px 0}label.switch{display:flex;gap:4px;align-items:center}.status{margin-top:9px;overflow-wrap:anywhere}.actions{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0}
    `;root.appendChild(style);
    function make(tag,text,parent,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;if(parent)parent.appendChild(e);return e;}
    const lab=make('div',null,root,'lab');
    
    const bar=make('div',null,lab,'row');presetSelect=make('select',null,bar);presetSelect.setAttribute('aria-label',tx('Een universum kiezen'));const blank=make('option',tx('Kies een universum…'),presetSelect);blank.value='';
    PRESETS.forEach((p,i)=>{const o=make('option',p[0],presetSelect);o.value=String(i);});presetSelect.onchange=()=>{if(presetSelect.value!=='')api.setState(preset(Number(presetSelect.value)));};
    function select(parent,key,title,options){const wrap=make('label',null,parent,'row');make('span',title,wrap);const input=make('select',null,wrap);options.forEach(([value,name])=>{const o=make('option',name,input);o.value=String(value);});input.onchange=()=>{state[key]=['mode','division'].includes(key)?Number(input.value):input.value;apply();syncUI();};controls.push({el:input,key});return input;}
    const row=make('div',null,lab,'row');select(row,'mode',tx('Anatomie'),MODES.map((name,i)=>[i,tx(name)]));select(row,'behavior',tx('Gedrag'),BEHAVIORS.map(([v,n])=>[v,tx(n)]));
    function check(parent,key,title){const label=make('label',null,parent,'switch'),input=make('input',null,label);input.type='checkbox';make('span',title,label);input.onchange=()=>{state[key]=input.checked;apply();syncUI();};controls.push({key,el:input,check:true});}
    const switches=make('div',null,lab,'row');check(switches,'on',tx('Leeft'));check(switches,'follow',tx('Volg Start/Stop'));check(switches,'sync',tx('Klok'));select(switches,'division',tx('Delen per'),DIVISIONS.map(([v,n])=>[v,/[a-z]/.test(n)?tx(n):n]));
    const screen=make('div',null,lab,'screen');cv=make('canvas',null,screen);cv.setAttribute('role','img');cv.setAttribute('aria-label',tx('Live golfvorm, vreemde attractor en cellulaire automaat'));g=cv.getContext('2d');
    function resize(w,h){if(!cv||!(w>0)||!(h>0))return;cw=w;ch=h;const dpr=Math.min(2,globalThis.devicePixelRatio||1);cv.width=Math.max(1,Math.round(w*dpr));cv.height=Math.max(1,Math.round(h*dpr));}
    observer=new ResizeObserver(es=>{const r=es[0]&&es[0].contentRect;if(r)resize(r.width,r.height);});observer.observe(screen);resize(screen.clientWidth||300,screen.clientHeight||190);
    if(typeof window.addEventListener==='function')window.addEventListener('patchkamer-skin',onSkin);
    function readColors(){if(!shell)return;const css=getComputedStyle(shell),c=k=>css.getPropertyValue(k).trim();colT=performance.now();col={well:c('--well')||'Canvas',audio:c('--audio')||'Highlight',muted:c('--muted')||'GrayText',ink:c('--fg')||'CanvasText'};}
    function draw(){if(dead||!cv||!g)return;
     if(!col||performance.now()-colT>1000)readColors();
     const dpr=Math.min(2,globalThis.devicePixelRatio||1),w=cw,h=ch;g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle=col.well;g.fillRect(0,0,w,h);an.getFloatTimeDomainData(waveform);
     const audio=col.audio,muted=col.muted,ink=col.ink;g.lineWidth=1;g.strokeStyle=audio;g.beginPath();
     for(let i=0;i<waveform.length;i++){const x=i/(waveform.length-1)*w,y=h*.72-waveform[i]*h*.9;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();
     const live=local||telemetry;
     if(live&&Number.isFinite(live.x)&&Number.isFinite(live.z)){trail.push([live.x,live.z]);if(trail.length>160)trail.shift();}
     g.strokeStyle=muted;g.globalAlpha=.7;g.beginPath();
     for(let i=0;i<trail.length;i++){const x=w*.5+trail[i][0]/35*Math.min(w*.35,170),y=h*.10+trail[i][1]/65*h*.43;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();g.globalAlpha=1;
     const cell=live&&Number.isFinite(live.ca)?live.ca:0;for(let j=0;j<32;j++){g.globalAlpha=(cell>>>j)&1?.9:.13;g.fillStyle=audio;g.fillRect(10+j*Math.max(2,(w-20)/32),h*.55,Math.max(1,(w-20)/32-2),5);}g.globalAlpha=1;
     const population=local?local.voices.filter(v=>v.active).length:telemetry?telemetry.population:0;
     const behaviorName=tx((BEHAVIORS.find(b=>b[0]===state.behavior)||BEHAVIORS[2])[1]);
     g.fillStyle=ink;g.font='10px monospace';g.fillText(tx(MODES[state.mode])+' / '+behaviorName+' / '+population+' '+tx('stemmen')+(frozen?' / '+tx('BEVROREN'):''),10,16);g.fillStyle=muted;g.fillText(tx('Lorenz-baan · celautomaat · live audio'),10,h-8);
    }
    stopLoop();stopDraw=drawLoop(host,api,draw,30);
    const actions=make('div',null,lab,'actions');
    function button(text,fn){const b=make('button',text,actions);b.type='button';b.onclick=fn;return b;}
    button(tx('Muteer'),()=>{for(const p of descriptors)if(!['level','input','root','attack','release','rate'].includes(p.id))state[p.id]=clamp(state[p.id]+(Math.random()-.5)*.5,p.min,p.max);apply();syncUI();});
    button(tx('Celdeling!'),()=>send({type:'bang',time:ctx.currentTime}));
    button(tx('Vouw de tijd'),()=>{state.warp=1-state.warp;apply();syncUI();});
    freezeButton=button(tx('Bevries geheugen'),()=>{frozen=!frozen;send({type:'freeze',value:frozen,time:ctx.currentTime});syncUI();});
    button(tx('PANIEK / stil'),()=>{state.on=false;send({type:'panic',time:ctx.currentTime});apply();syncUI();});
    const grid=make('div',null,lab,'parameters');
    for(const[key,name,min,max,def,hint]of PARAMETERS){const control=make('label',null,grid,'control');control.title=tx(hint);const label=make('div',null,control,'label');make('span',tx(name),label);const output=make('span',null,label,'value');const input=make('input',null,control);input.type='range';input.min=min;input.max=max;input.step=key==='root'?1:(max-min)/500;input.value=String(def);input.setAttribute('data-pk-default',String(def));input.setAttribute('aria-label',tx(name));
     const format=v=>key==='root'?Math.round(v):key==='rate'?v.toFixed(2)+' Hz':['attack','release'].includes(key)?v.toFixed(2)+' s':Math.round(v*100)+'%';
     output.textContent=format(def);
     input.oninput=()=>{state[key]=Number(input.value);apply();syncUI();};controls.push({el:input,key,output,format});}
    
    const keyboard=make('div',null,lab,'keyboard'),names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B','C'];
    names.forEach((name,index)=>{const key=make('button',name,keyboard,'key'+([1,3,6,8,10].includes(index)?' black':''));key.type='button';key.setAttribute('aria-label',tx('Speel {0}',name));
     let held=null;const release=()=>{if(held!==null){send({type:'off',note:held,time:ctx.currentTime});uiHeld.delete(held);held=null;}};
     key.onpointerdown=e=>{e.preventDefault();e.stopPropagation();key.setPointerCapture(e.pointerId);held=state.root+index;uiHeld.add(held);noteOn(held);};key.onblur=release;key.onpointerup=release;key.onpointercancel=release;key.onlostpointercapture=release;
     key.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();held=state.root+index;uiHeld.add(held);noteOn(held);}};key.onkeyup=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release();}};
    });
    status=make('div',null,lab,'status');root.addEventListener('pointerdown',e=>e.stopPropagation());syncUI();
   },
   unmount,
   getState(){return {...state};},setState(s){state=normalize(s);apply();syncUI();},
   params(){return descriptors.map(p=>({...p}));},
   modulate(o){offsets={};for(const p of descriptors){const v=o&&o[p.id];if(typeof v==='number'&&Number.isFinite(v))offsets[p.id]=clamp(v,-1,1);}apply();},
   onStep(info){if(dead||!info)return;if(Number.isFinite(info.bpm)&&info.bpm!==bpm){bpm=clamp(info.bpm,20,400);apply();}if(!transport){transport=true;apply();}},
   onTransport(info){if(dead)return;transport=!!(info&&info.playing);if(!transport)send({type:'panic',time:ctx.currentTime});apply();},
   onEvent(port,e){if(dead||port!=='notes'||!e)return;
    if(e.type==='cc'){const p=descriptors.find(p=>p.id===e.id);if(p&&typeof e.value==='number'&&Number.isFinite(e.value)){state[p.id]=p.min+clamp(e.value,0,1)*(p.max-p.min);if(p.id==='root')state.root=Math.round(state.root);apply(e.time);syncUI();}return;}
    if(e.type==='panic'||e.type==='allnotesoff'){send({type:'panic',time:e.time});return;}
    if(e.type==='trig'){send({type:'bang',time:e.time});return;}
    if(!['note','noteon','noteoff'].includes(e.type)||!Number.isFinite(e.note))return;
    const off=e.type==='noteoff'||e.off||e.vel===0;
    send({type:off?'off':'note',note:clamp(e.note,0,127),vel:typeof e.vel==='number'&&Number.isFinite(e.vel)?clamp(e.vel,0,1):.75,dur:typeof e.dur==='number'&&Number.isFinite(e.dur)?clamp(e.dur,0,120):0,time:e.time});
   },
   destroy(){if(dead)return;dead=true;unmount();if(timer!==null)clearInterval(timer);timer=null;
    if(backend){backend.onprocessorerror=null;backend.onaudioprocess=null;if(backend.port){backend.port.postMessage({type:'close'});backend.port.close();}backend.disconnect();backend=null;}
    if(local){local.dead=true;local.events=[];}local=null;queued.length=0;sources.forEach(s=>{s.onended=null;try{s.stop();}catch(_){}s.disconnect();});sources.clear();feed.disconnect();out.disconnect();an.disconnect();
   }
  };return api;
 }
};
