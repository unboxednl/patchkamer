// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.14.1 — Lichter voor de processor: elke planeet heeft vanaf het begin dezelfde velden (de motor liep daardoor ruim twee keer sneller), geen nieuwe arrays per audioblok, een sinus minder per planeet per sample en de panning wordt per blok berekend in plaats van per sample. Geluid, state, poorten en uiterlijk bit-identiek (zelfde uitvoer als 1.14.0 gemeten).
// 1.14.0 — Regelaars herkenbaar voor skins (host.ui.adopt, id = state-sleutel, groep per sectie: setup, orbit, spacetime, phenomena, sound; rol param of select), zodat een skin ze als draaiknop kan tonen; oude host: genegeerd. De hoogte van het tekenvlak volgt nu de CSS-hoogte (standaard 340 px, dus zonder skin ongewijzigd), zodat een skin het lager kan maken zonder dat het beeld vervormt. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.13.0 — Uitleg naar about (menu Over Celestial Mechanics); de UI toont geen uitlegtekst meer.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in about.
// 1.11.0 — Nieuw als Celestial Mechanics (nieuwe id nl.patchkamer.celestialmechanics, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Celestial Mechanics
//   - Engelse waarden in de state (scale, life, preset); Nederlandse namen alleen nog als tekst in de UI
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - tekenen via host.frame en een ResizeObserver; dubbelklik op een schuif = beginwaarde (data-pk-default)
//   - bewaker in de worklet: alleen eindige berichten, hemellichamen met een niet-eindige toestand worden weggehaald en een
//     niet-eindig uitgangsmonster wordt 0, zodat één rare waarde de galm en het echo-geheugen niet voor altijd vergiftigt.
//     Het geluid in het normale gebied is ongewijzigd.
/** Celestial Mechanics. Zelfstandig, geen externe bestanden.
 * Een synthesizer die een zonnestelsel is. Elke noot wordt een planeet die om een zon draait; de natuurkunde
 * maakt het geluid:
 *  - toonhoogte = de noot, maar verschoven door het Dopplereffect (naar je toe = hoger, weg = lager) en door
 *    gravitationele roodverschuiving (dicht bij een zwart gat zakt de toon weg tot hij wordt opgeslokt);
 *  - stereo = waar de planeet staat; volume = hoe ver weg;
 *  - planeten die elkaar naderen, moduleren elkaar (FM): metalige botsingsklanken bij elke passage;
 *  - botsen ze echt, dan smelten ze samen tot een nieuwe planeet met een klap;
 *  - vlak langs de zon scheert een planeet door de corona: een zonnevlam van gefilterde ruis op zijn toon;
 *  - een pulsar in de zon tikt op de klok van de host en geeft de banen een zwaartekrachtschok;
 *  - kometen vallen van buiten naar binnen en fluiten voorbij.
 * Op het scherm zie je het stelsel; sleep met de muis om zelf een planeet de ruimte in te slingeren.
 * Noten: {type:'note',note,vel,time,dur}, noteon/noteoff, cc (0..1 op param-id), panic.
 */
const WNAME = 'nl-patchkamer-celestialmechanics-1-11-0';
const WORKLET = `
const TAU=Math.PI*2, MAXP=14;
class Planets extends AudioWorkletProcessor{
  constructor(){ super(); this.P=[]; this.q=[]; this.id=1; this.s={gravity:6,hole:0,ecc:0.3,light:6,couple:0.5,grain:0.35,flare:0.5,pulsar:0,time:1,orbit:1,level:0.8,comets:0,life:'long'};
    this.coup=new Float32Array(MAXP*MAXP); this.sa=new Float32Array(MAXP); this.sb=new Float32Array(MAXP); this.gm=1; this.kick=0; this.ping=0; this.pingPh=0; this.frame=0; this.seed=12345; this.events=[]; this.cometT=0;
    this.port.onmessage=e=>{ const m=e.data||{}; if(m.type==='set'){ if(m.s&&typeof m.s==='object') for(const k of Object.keys(m.s)){ const v=m.s[k]; if(k==='life'){ if(v==='short'||v==='long'||v==='forever') this.s.life=v; } else if(k in this.s&&typeof v==='number'&&Number.isFinite(v)) this.s[k]=v; } } else if(m.time===undefined||Number.isFinite(m.time)) this.q.push(m); }; }
  rnd(){ this.seed=(this.seed*16807)%2147483647; return this.seed/2147483647; }
  radiusFor(note){ const k=Math.min(1,Math.max(0,(note-24)/84)); return (0.32+1.45*(1-k))*this.s.orbit; }
  spawn(note,vel,opt={}){ if(this.P.length>=MAXP){ // de oudste wordt de ruimte in geslingerd
      let o=null; for(const p of this.P) if(!p.leaving&&(!o||p.age>o.age)) o=p; if(o){ o.leaving=true; o.rel=0.15; } else return null; }
    const GM=this.s.gravity; const r=opt.r??this.radiusFor(note), a=opt.a??this.rnd()*TAU; const x=opt.x??r*Math.cos(a), y=opt.y??r*Math.sin(a);
    const rr=Math.hypot(x,y)||0.01, vc=Math.sqrt(GM/rr), e=this.s.ecc*(0.4+0.6*this.rnd()), dir=this.rnd()<0.12?-1:1;
    const vx=opt.vx??(-y/rr*vc*(1-e*0.55)*dir+x/rr*vc*e*0.25), vy=opt.vy??(x/rr*vc*(1-e*0.55)*dir+y/rr*vc*e*0.25);
    const p={id:this.id++,note,f0:440*Math.pow(2,(note-69)/12),vel,x,y,vx,vy,m:0.02+0.05*vel,ph:this.rnd(),amp:0,age:0,life:opt.life??1e9,leaving:false,rel:opt.rel??1.6,
      comet:!!opt.comet,fm:0,flare:0,b1:0,b2:0,dead:false,fNow:0,pan:0,gain:0,lastF:0,
      cl:0,cr:0,gainT:0,gainK:0,r:0,gulp:0,clap:0,gone:false,merged:false,swallow:false,flareLock:false,ecl:false,src:NaN}; this.P.push(p); return p; }
  handle(m){ if((m.type==='note'||m.type==='off'||m.type==='throw')&&!Number.isFinite(m.note)) return; if(m.type==='note'&&m.vel!==undefined&&!Number.isFinite(m.vel)) return;
    if(m.type==='throw'&&!(Number.isFinite(m.x)&&Number.isFinite(m.y)&&Number.isFinite(m.vx)&&Number.isFinite(m.vy))) return; if(m.type==='step'&&!(Number.isFinite(m.step)&&Number.isFinite(m.time))) return;
    const lifeOf=dur=>this.s.life==='forever'?1e9:this.s.life==='short'?Math.min(dur??1.5,2):Math.max(dur??4,4);
    if(m.type==='note'){ const p=this.spawn(m.note,m.vel??0.8); if(p){ p.life=lifeOf(m.dur); p.src=m.note; } }
    else if(m.type==='off'){ for(const p of this.P) if(p.src===m.note&&!p.leaving){ p.life=Math.min(p.life,p.age); } }
    else if(m.type==='throw'){ const p=this.spawn(m.note,0.8,{x:m.x,y:m.y,vx:m.vx,vy:m.vy}); if(p) p.life=lifeOf(undefined); }
    else if(m.type==='bang'){ const notes=(Array.isArray(m.notes)?m.notes:[]).filter(Number.isFinite); notes.forEach((n,i)=>{ const p=this.spawn(n,0.7,{a:i/notes.length*TAU+this.rnd()*0.3}); if(p) p.life=lifeOf(6); }); }
    else if(m.type==='comet') this.comet();
    else if(m.type==='sweep'){ for(const p of this.P){ p.swallow=true; } }
    else if(m.type==='panic'){ for(const p of this.P){ p.leaving=true; p.rel=0.05; } }
    else if(m.type==='step'){ if(this.s.pulsar>0.001&&(m.step%4===0||(this.s.pulsar>0.66&&m.step%2===0))) this.events.push({t:m.time,k:'pulse',acc:m.step%16===0}); } }
  comet(){ const a=this.rnd()*TAU, r=3.4, x=r*Math.cos(a), y=r*Math.sin(a), sp=Math.sqrt(this.s.gravity/r)*1.15, off=(this.rnd()-0.5)*1.4;
    const vx=-x/r*sp*0.95+(-y/r)*sp*off, vy=-y/r*sp*0.95+(x/r)*sp*off; const p=this.spawn(84+Math.floor(this.rnd()*14),0.55,{x,y,vx,vy,comet:true}); if(p){ p.life=1e9; p.ecl=true; } }
  physics(dt){ const s=this.s, GMbase=s.gravity*this.gm, hole=s.hole, rs=0.015+hole*0.33, drag=hole*0.35, inter=s.couple;
    const P=this.P, n=P.length;
    for(let i=0;i<n;i++){ const p=P[i]; let ax=0, ay=0; const r2=p.x*p.x+p.y*p.y+1e-4, r=Math.sqrt(r2);
      const g=GMbase/(r2*r); ax-=g*p.x; ay-=g*p.y;
      if(p.swallow){ ax-=p.x*6; ay-=p.y*6; p.vx*=1-dt*2; p.vy*=1-dt*2; }
      if(drag>0){ ax-=p.vx*drag*(0.3+0.7/(r+0.2)); ay-=p.vy*drag*(0.3+0.7/(r+0.2)); }
      if(p.leaving){ ax+=p.x/r*1.8; ay+=p.y/r*1.8; }
      for(let j=0;j<n;j++){ if(j===i) continue; const q=P[j], dx=q.x-p.x, dy=q.y-p.y, d2=dx*dx+dy*dy+0.003; const k=inter*0.8*q.m/(d2*Math.sqrt(d2)); ax+=k*dx; ay+=k*dy; }
      p.vx+=ax*dt; p.vy+=ay*dt; const v=Math.hypot(p.vx,p.vy), vmax=9; if(v>vmax){ p.vx*=vmax/v; p.vy*=vmax/v; } }
    for(const p of P){ p.x+=p.vx*dt; p.y+=p.vy*dt; const r=Math.hypot(p.x,p.y); p.r=r;
      if(r<rs&&!p.dead){ p.dead=true; p.gulp=1; this.post({k:'gulp',x:p.x,y:p.y,id:p.id}); }
      if(r>4.2&&(p.leaving||p.comet)) p.gone=true; }
    // botsingen: samensmelten
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){ const a=P[i], b=P[j]; if(a.dead||b.dead||a.gone||b.gone||a.leaving||b.leaving) continue;
      const d=Math.hypot(a.x-b.x,a.y-b.y); if(d<0.045*(1+inter)){ const M=a.m+b.m; a.vx=(a.vx*a.m+b.vx*b.m)/M; a.vy=(a.vy*a.m+b.vy*b.m)/M; a.x=(a.x*a.m+b.x*b.m)/M; a.y=(a.y*a.m+b.y*b.m)/M;
        const nf=Math.sqrt(a.f0*b.f0)*(this.rnd()<0.5?1:1.5); a.f0=nf; a.m=M; a.vel=Math.min(1,a.vel+b.vel*0.5); a.flare=1; a.clap=1; a.life=Math.max(a.life,b.life); b.gone=true; b.merged=true; this.post({k:'merge',x:a.x,y:a.y,id:a.id}); } } }
  sanitize(){ if(!Number.isFinite(this.gm)) this.gm=1; if(!Number.isFinite(this.ping)) this.ping=0; if(!Number.isFinite(this.pingPh)) this.pingPh=0;
    this.P=this.P.filter(p=>Number.isFinite(p.x+p.y+p.vx+p.vy+p.ph+p.f0+p.m+p.vel+p.gain+p.b1+p.b2+p.flare+(p.clap||0)+p.age+p.rel)); }
  post(e){ this.events2=(this.events2||[]); this.events2.push(e); }
  process(inputs,outputs){ const out=outputs[0], L=out[0], R=out[1]||out[0], N=L.length, sr=sampleRate, s=this.s;
    // geplande berichten
    if(this.q.length){ const keep=[]; for(const m of this.q){ if((m.time??0)<=currentTime+N/sr) this.handle(m); else keep.push(m); } this.q=keep; }
    // pulsar
    const evs=[]; for(const e of this.events){ if(e.t<=currentTime+N/sr){ this.gm=1+s.pulsar*(e.acc?2.4:1.4); this.ping=s.pulsar*(e.acc?0.9:0.55); this.pingPh=0; this.post({k:'pulse'}); } else evs.push(e); } this.events=evs;
    this.gm+= (1-this.gm)*0.12;
    // kometen vanzelf
    if(s.comets>0){ this.cometT+=N/sr; if(this.cometT>1&&this.rnd()<s.comets*0.25*(N/sr)*40){ this.cometT=0; this.comet(); } }
    // natuurkunde, in deelstappen
    const dtAll=N/sr*s.time, sub=4; for(let k=0;k<sub;k++) this.physics(dtAll/sub);
    this.sanitize();
    const P=this.P, n=P.length, holeRs=0.015+s.hole*0.33, c=s.light;
    // per planeet: frequentie, pan, volume, FM-koppeling voor dit blok
    if(this.coup.length<n*n){ this.coup=new Float32Array(n*n); } if(this.sa.length<n){ this.sa=new Float32Array(n); this.sb=new Float32Array(n); }
    const coup=this.coup;
    for(let i=0;i<n;i++){ const p=P[i]; p.age+=N/sr;
      const r=Math.max(1e-3,p.r||Math.hypot(p.x,p.y)), vr=(p.x*p.vx+p.y*p.vy)/r;
      let f=p.f0*Math.min(4,Math.max(0.25,1/(1+vr/c)));                          // Doppler
      const red=Math.sqrt(Math.max(0,1-holeRs/r)); f*=s.hole>0.001?Math.max(0.02,red):1;  // roodverschuiving
      if(p.dead){ p.gulp=(p.gulp||1)*0.93; f*=p.gulp; }
      p.fNow=Math.min(sr*0.45,f);
      p.pan=Math.max(-1,Math.min(1,p.x/1.6)); { const pa=(p.pan+1)*0.25*Math.PI; p.cl=Math.cos(pa); p.cr=Math.sin(pa); }
      let target=p.vel*0.11/(0.55+0.45*r);
      if(p.comet) target*=0.8;
      if(p.age>=p.life&&!p.leaving){ p.leaving=true; }
      if(p.leaving) p.rel=Math.max(p.rel,0.05);
      if(p.leaving) target=0; if(p.gone) target=0; if(p.dead) target=p.vel*0.2*(p.gulp||0);
      p.gainT=target; p.gainK=Math.exp(-1/(sr*(p.leaving||p.gone||p.dead?Math.max(0.02,p.rel*0.4):0.03)));
      // zonnevlam: vlak langs de zon
      if(r<0.3+0.25*s.flare&&s.flare>0.001&&!p.flareLock){ p.flare=Math.max(p.flare,s.flare*(1-r/0.55)); p.flareLock=true; this.post({k:'flare',x:p.x,y:p.y}); } if(r>0.6) p.flareLock=false;
      for(let j=0;j<n;j++){ if(j===i) continue; const q=P[j], d=Math.hypot(p.x-q.x,p.y-q.y); coup[i*n+j]=s.couple*4*q.m*10/(1+d*d*60); } }
    // geluid
    const gr=s.grain*3.2, lvl=s.level;
    let sinv=this.sa, snext=this.sb;
    for(let i=0;i<n;i++) sinv[i]=Math.sin(P[i].ph*TAU);
    for(let t=0;t<N;t++){ let l=0, rr=0;
      for(let i=0;i<n;i++){ const p=P[i]; let fm=0; for(let j=0;j<n;j++) if(j!==i) fm+=coup[i*n+j]*sinv[j];
        p.ph+=p.fNow/sr; if(p.ph>1) p.ph-=Math.floor(p.ph);
        const x=p.ph*TAU, sx=Math.sin(x); snext[i]=sx; let v;                  // korrel: zelf-FM; koppeling: FM van de buren
        if(p.comet) v=sx*0.7+Math.sin(x*2.01)*0.3; else v=Math.sin(x+gr*sx*0.6+fm);
        // zonnevlam / klap: ruis door een resonator op de planeettoon
        if(p.flare>1e-4||p.clap>1e-4){ this.seed=(this.seed*16807)%2147483647; const nz=this.seed/1073741823.5-1;
          const w=TAU*Math.min(0.45,(p.fNow*3)/sr), rq=0.995, cw=2*rq*Math.cos(w); const y=nz*(p.flare*0.08+(p.clap||0)*0.25)+cw*p.b1-rq*rq*p.b2; p.b2=p.b1; p.b1=y; v+=y*0.6;
          p.flare*=0.99994; p.clap=(p.clap||0)*0.9996; if(p.flare<1e-4) p.flare=0; }
        p.gain=p.gainT+(p.gain-p.gainT)*p.gainK;
        const g=p.gain; l+=v*g*p.cl; rr+=v*g*p.cr; }
      { const tmp=sinv; sinv=snext; snext=tmp; }
      if(this.ping>1e-4){ this.pingPh+=1900/sr; const pv=Math.sin(this.pingPh*TAU)*this.ping*0.25; l+=pv; rr+=pv; this.ping*=0.9985; }
      { const a=Math.tanh(l*lvl), b=Math.tanh(rr*lvl); L[t]=a===a?a:0; R[t]=b===b?b:0; } }
    // opruimen
    this.P=P.filter(p=>!((p.gone||p.leaving||p.dead)&&p.gain<1e-4&&p.age>0.05));
    // naar de UI, ~60 keer per seconde
    if(((this.frame+=1)%6)===0){ this.port.postMessage({type:'view',p:this.P.map(p=>[p.id,+p.x.toFixed(3),+p.y.toFixed(3),p.f0,+p.gain.toFixed(3),p.comet?1:0,p.dead?1:0]),hole:s.hole,gm:this.gm,ev:this.events2||[]}); this.events2=[]; }
    return true; } }
registerProcessor('${WNAME}', Planets);`;

const EN = {
  'het zonnestelsel; sleep om een planeet weg te slingeren': 'the solar system; drag to sling a planet away',
  'Heelal': 'Universe', 'Eigen heelal': 'Custom universe',
  'Zonnestelsel': 'Solar System', 'Glazen sferen': 'Glass Spheres', 'Zwart gat': 'Black hole', 'Pulsar-dans': 'Pulsar Dance', 'Kometenregen': 'Comet Shower', 'Chaosnevel': 'Chaos Nebula', 'Ruimtewalvissen': 'Space Whales',
  'Toonladder (slingeren)': 'Scale (slinging)', 'Grondtoon': 'Root note', 'Levensduur': 'Lifetime',
  'Mineur pentatonisch': 'Minor pentatonic', 'Chromatisch': 'Chromatic', 'Hele-toon (droom)': 'Whole tone (dream)', 'Lydisch (zweven)': 'Lydian (floating)', 'Boventoonreeks': 'Overtone series',
  'Kort (meteoren)': 'Short (meteors)', 'Lang (manen)': 'Long (moons)', 'Eeuwig (tot opgeslokt)': 'Forever (until swallowed)',
  'Oerknal': 'Big Bang', 'vijf planeten tegelijk, uit de toonladder': 'five planets at once, from the scale',
  'Komeet': 'Comet', 'een komeet valt van buiten naar binnen': 'a comet falls in from the outside',
  'Zwart gat: slik alles': 'Black hole: swallow everything', 'alle planeten storten in de zon, met dalende toon': 'all planets plunge into the sun, pitch falling',
  'Stilte': 'Silence', 'alle planeten verdwijnen': 'all planets disappear',
  'Baanmechaniek': 'Orbital mechanics', 'Ruimte-tijd': 'Space-time', 'Hemelverschijnselen': 'Celestial phenomena', 'Klank': 'Sound',
  'Zwaartekracht': 'Gravity', 'Baanmaat': 'Orbit size', 'Excentriciteit': 'Eccentricity', 'Tijd': 'Time', 'Lichtsnelheid': 'Speed of light', 'Wisselwerking': 'Interaction', 'Korrel': 'Grain',
  'Zonnevlammen': 'Solar flares', 'Kometen': 'Comets', 'Ether (galm)': 'Ether (reverb)', 'Echo uit de diepte': 'Echo from the deep', 'Uitgang': 'Output',
  '{0} hemellichamen in de ruimte': '{0} celestial bodies in space',
  'AudioWorklet niet beschikbaar: dit heelal blijft stil (open Patchkamer in Chrome, Edge of Firefox).': 'AudioWorklet not available: this universe stays silent (open Patchkamer in Chrome, Edge or Firefox).',
  'Heelal (modulatie)': 'Universe',
};

export default {
  id: 'nl.patchkamer.celestialmechanics', name: 'Celestial Mechanics', version: '1.14.1', kind: 'instrument', category: 'synth',
  ui: { width: 860, minWidth: 380 },
  about: { nl: 'Een zwaartekrachtsynth: elke noot wordt een planeet die om een zon draait.\n\nDoppler buigt de toon, het zwarte gat trekt hem omlaag, planeten die elkaar naderen kleuren elkaars klank. Sleep in het heelal om zelf een planeet weg te slingeren.\n\nTips: Zwart gat omhoog en de banen krimpen, de tonen zakken en worden opgeslokt. Lichtsnelheid omlaag en elke baan wordt een jankende Doppler-sirene. Wisselwerking hoog en planeten trekken aan elkaar: chaos, botsingen en samensmeltingen. Pulsar en Echo volgen het tempo als de klok loopt. Paarse Mod-kabel: Drift op Zwaartekracht of Tijd laat het hele stelsel ademen.', en: 'A gravity synth: every note becomes a planet orbiting a sun.\n\nDoppler bends the pitch, the black hole pulls it down, planets that approach each other colour each other\'s sound. Drag in the universe to sling a planet away yourself.\n\nTips: turn Black hole up and the orbits shrink, the pitches sink and get swallowed. Turn Speed of light down and every orbit becomes a wailing Doppler siren. Turn Interaction up and planets pull at each other: chaos, collisions and mergers. Pulsar and Echo follow the tempo when the clock runs. Purple Mod cable: Drift on Gravity or Time makes the whole system breathe.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    let dead = false, mod = {}, state, eff = {}, node = null, workletOk = false, view = { p: [], hole: 0, gm: 1, ev: [] };
    const nodes = new Set(); const own = n => (nodes.add(n), n); const gain = v => { const g = own(ctx.createGain()); g.gain.value = v; return g; };
    const spec = {
      gravity: { name: 'Zwaartekracht', min: 0.5, max: 30, scale: 'log', unit: '', g: 0 },
      orbit: { name: 'Baanmaat', min: 0.4, max: 1.8, unit: '×', g: 0 },
      ecc: { name: 'Excentriciteit', min: 0, max: 1, unit: '%', g: 0 },
      time: { name: 'Tijd', min: 0.05, max: 4, scale: 'log', unit: '×', g: 0 },
      hole: { name: 'Zwart gat', min: 0, max: 1, unit: '%', g: 1 },
      light: { name: 'Lichtsnelheid', min: 0.6, max: 40, scale: 'log', unit: '', g: 1 },
      couple: { name: 'Wisselwerking', min: 0, max: 1, unit: '%', g: 1 },
      grain: { name: 'Korrel', min: 0, max: 1, unit: '%', g: 1 },
      flare: { name: 'Zonnevlammen', min: 0, max: 1, unit: '%', g: 2 },
      pulsar: { name: 'Pulsar', min: 0, max: 1, unit: '%', g: 2 },
      comets: { name: 'Kometen', min: 0, max: 1, unit: '%', g: 2 },
      ether: { name: 'Ether (galm)', min: 0, max: 1, unit: '%', g: 3 },
      echo: { name: 'Echo uit de diepte', min: 0, max: 1, unit: '%', g: 3 },
      level: { name: 'Uitgang', min: 0, max: 1, unit: '%', role: 'level', g: 3 },
    };
    const GROUPS = ['Baanmechaniek', 'Ruimte-tijd', 'Hemelverschijnselen', 'Klank'];
    const SCALES = { minorPentatonic: [0, 3, 5, 7, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], wholeTone: [0, 2, 4, 6, 8, 10], harmonics: [0, 12, 19, 24, 28, 31, 34, 36, 38, 40], lydian: [0, 2, 4, 6, 7, 9, 11] };
    const SCALE_NAMES = [['minorPentatonic', 'Mineur pentatonisch'], ['chromatic', 'Chromatisch'], ['wholeTone', 'Hele-toon (droom)'], ['lydian', 'Lydisch (zweven)'], ['harmonics', 'Boventoonreeks']];
    const LIFE = [['short', 'Kort (meteoren)'], ['long', 'Lang (manen)'], ['forever', 'Eeuwig (tot opgeslokt)']];
    const defaults = { gravity: 6, orbit: 1, ecc: 0.3, time: 1, hole: 0, light: 6, couple: 0.45, grain: 0.35, flare: 0.5, pulsar: 0, comets: 0, ether: 0.45, echo: 0.25, level: 0.8,
      scale: 'minorPentatonic', life: 'long', root: 45, preset: 'Solar System' };
    const presets = {
      'Solar System': {},
      'Glass Spheres': { gravity: 3, ecc: 0.05, couple: 0.15, grain: 0, flare: 0.2, ether: 0.7, echo: 0.35, light: 30, scale: 'lydian', life: 'forever' },
      'Black Hole': { gravity: 9, hole: 0.55, ecc: 0.45, couple: 0.6, grain: 0.5, flare: 0.8, ether: 0.55, life: 'forever', light: 3 },
      'Pulsar Dance': { gravity: 8, pulsar: 0.75, ecc: 0.5, couple: 0.5, grain: 0.55, flare: 0.3, ether: 0.3, echo: 0.4, time: 1.4, life: 'long' },
      'Comet Shower': { gravity: 5, comets: 0.7, couple: 0.35, light: 2.5, ether: 0.6, echo: 0.45, scale: 'wholeTone' },
      'Chaos Nebula': { gravity: 14, couple: 1, ecc: 0.9, grain: 0.85, flare: 0.9, light: 1.2, time: 2.2, ether: 0.4, scale: 'chromatic', life: 'forever' },
      'Space Whales': { gravity: 1.2, time: 0.25, orbit: 1.5, ecc: 0.7, couple: 0.8, grain: 0.15, light: 0.9, ether: 0.85, echo: 0.6, root: 33, life: 'forever' },
    };
    const PRESET_LABELS = { 'Solar System': 'Zonnestelsel', 'Glass Spheres': 'Glazen sferen', 'Black Hole': 'Zwart gat', 'Pulsar Dance': 'Pulsar-dans', 'Comet Shower': 'Kometenregen', 'Chaos Nebula': 'Chaosnevel', 'Space Whales': 'Ruimtewalvissen' };
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } eff = e; return e; }
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = finite(s[id], defaults[id], d.min, d.max);
      n.scale = Object.hasOwn(SCALES, s.scale) ? s.scale : defaults.scale; n.life = LIFE.some(x => x[0] === s.life) ? s.life : defaults.life;
      n.root = Math.round(finite(s.root, defaults.root, 24, 72)); n.preset = s.preset === 'Custom' || Object.hasOwn(presets, s.preset) ? s.preset : defaults.preset; return n; }
    state = normalize({}); resolve();

    // ---------- audio: worklet → ether (galm) + echo → uit ----------
    const pre = gain(1), dry = gain(1), wet = gain(0.4), echoSend = gain(0.2), conv = own(ctx.createConvolver()), dl = own(ctx.createDelay(3)), fb = gain(0.55), dlp = own(ctx.createBiquadFilter()), dhp = own(ctx.createBiquadFilter()), sum = gain(1), lim = own(ctx.createDynamicsCompressor()), out = gain(0.7);
    dlp.type = 'lowpass'; dlp.frequency.value = 2600; dhp.type = 'highpass'; dhp.frequency.value = 180;
    pre.connect(dry).connect(sum); pre.connect(wet).connect(conv).connect(sum); pre.connect(echoSend).connect(dl); dl.connect(dlp).connect(dhp).connect(fb).connect(dl); dhp.connect(sum); fb.connect(wet);
    lim.threshold.value = -14; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = 0.003; lim.release.value = 0.25; sum.connect(lim).connect(out);
    (function buildIR() { const sr = ctx.sampleRate, len = Math.round(sr * 5.5), b = ctx.createBuffer(2, len, sr);
      for (let c = 0; c < 2; c++) { const a = b.getChannelData(c); let seed = 777 + c * 31, lp = 0; for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; const nz = seed / 1073741823.5 - 1, t = i / len; lp += (nz - lp) * (0.75 - 0.6 * t);
          a[i] = lp * Math.pow(1 - t, 1.6) * (0.6 + 0.4 * Math.sin(i / sr * (3.1 + c))); } }   // langzaam zwevende staart
      conv.normalize = true; conv.buffer = b; })();
    const send = () => { if (node) node.port.postMessage({ type: 'set', s: { gravity: eff.gravity, orbit: eff.orbit, ecc: eff.ecc, time: eff.time, hole: eff.hole, light: eff.light, couple: eff.couple, grain: eff.grain, flare: eff.flare, pulsar: eff.pulsar, comets: eff.comets, level: eff.level, life: state.life } }); };
    function apply() { resolve(); const t = ctx.currentTime; wet.gain.setTargetAtTime(eff.ether * 0.9, t, 0.05); dry.gain.setTargetAtTime(1 - eff.ether * 0.35, t, 0.05); echoSend.gain.setTargetAtTime(eff.echo * 0.7, t, 0.05); fb.gain.setTargetAtTime(0.25 + eff.echo * 0.5, t, 0.05); send(); }
    let echoStep = 0.375; const setEcho = sd => { const dt = clamp(sd * 6, 0.05, 2.9); if (Math.abs(dt - echoStep) > 1e-3) { echoStep = dt; dl.delayTime.setTargetAtTime(dt, ctx.currentTime, 0.1); } }; dl.delayTime.value = 0.375;
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] }); nodes.add(node); node.connect(pre); workletOk = true;
      node.port.onmessage = e => { const m = e.data; if (m && m.type === 'view') { view = m; for (const ev of m.ev || []) flashes.push({ ...ev, t: performance.now() }); } };
      apply(); paintStatus(); }).catch(() => { workletOk = false; paintStatus(); });
    const postNode = m => { if (node) node.port.postMessage(m); };

    // ---------- toonladder ----------
    function quantize(semi) { const sc = SCALES[state.scale]; const oct = Math.floor(semi / 12); let best = sc[0], bd = 99;
      if (state.scale === 'harmonics') { for (const v of sc) { const d = Math.abs(v - semi); if (d < bd) { bd = d; best = v; } } return state.root + best; }
      const s = ((semi % 12) + 12) % 12; for (const v of sc) { const d = Math.abs(v - s); if (d < bd) { bd = d; best = v; } } return state.root + oct * 12 + best; }
    const randomNote = () => quantize(Math.floor(Math.random() * 30));

    // ---------- UI ----------
    let root = null, ui = {}, canvas = null, raf = null, ro = null, cw = 600, statusEl = null, drag = null; const trails = new Map(); let flashes = [];
    const fmt = (d, v) => d.unit === '%' ? Math.round(v * 100) + '%' : d.unit === '×' ? v.toFixed(2) + '×' : (v >= 10 ? v.toFixed(1) : v.toFixed(2));
    const toS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
    const fromS = (d, x) => d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min);
    const CSS = `:host{display:block;color:var(--fg,#e3e6ee);font:13px system-ui,sans-serif;--h-acc:#ffcf6b;--h-ink:color-mix(in srgb,var(--h-acc) 60%,var(--fg,#e3e6ee))}
.app{container-type:inline-size;background:var(--card,#12141c);border-radius:10px;padding:14px;box-sizing:border-box}
.top{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#9aa3b5)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#1f2433);border:1px solid var(--line,#3a4256);border-radius:5px;padding:6px 8px;box-sizing:border-box;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--h-acc)} .acts{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
canvas{display:block;width:100%;height:340px;border-radius:8px;background:#05060b;cursor:crosshair;touch-action:none}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#9aa3b5);font-weight:600;margin:14px 0 6px;padding-top:9px;border-top:1px solid var(--line,#2c3344)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#9aa3b5)}
.c output{font-size:11px;color:var(--fg,#e3e6ee);white-space:nowrap;text-transform:none}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--h-acc)}
.st{font-size:11px;color:var(--mod,#b48cff);margin:6px 0 0}`;
    const el = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; p.appendChild(e); return e; };
    const adopt = (e, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(e, { id, role, group, label }); } catch (err) { /* oud contract */ } } return e; };
    const GROUP_IDS = ['orbit', 'spacetime', 'phenomena', 'sound'];   // sectie-id per groep van de regelaars (voor skins)
    function selectBox(p, label, opts, value, change, id) { const box = el(p, 'label', 'sel'); el(box, 'span', '', label); const s = el(box, 'select'); for (const [v, t] of opts) { const o = el(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); s.addEventListener('pointerdown', e => e.stopPropagation()); return id ? adopt(s, id, 'select', 'setup', label) : s; }
    const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    function mount(hostEl) {
      unmount(); const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow({ mode: 'open' }); root = hostEl;
      el(sh, 'style').textContent = CSS; const app = el(sh, 'div', 'app');
      const top = el(app, 'div', 'top');
      ui.preset = selectBox(top, tx('Heelal'), Object.keys(presets).map(k => [k, tx(PRESET_LABELS[k])]).concat([['Custom', tx('Eigen heelal')]]), state.preset, v => { if (Object.hasOwn(presets, v)) self.setState({ ...defaults, ...presets[v], preset: v }); }, 'preset');
      ui.scale = selectBox(top, tx('Toonladder (slingeren)'), SCALE_NAMES.map(([v, t]) => [v, tx(t)]), state.scale, v => { state.scale = v; state.preset = 'Custom'; paint(); }, 'scale');
      ui.root = selectBox(top, tx('Grondtoon'), Array.from({ length: 49 }, (_, i) => [24 + i, NOTE_NAMES[(24 + i) % 12] + (Math.floor((24 + i) / 12) - 1)]), state.root, v => { state.root = +v; state.preset = 'Custom'; paint(); }, 'root');
      ui.life = selectBox(top, tx('Levensduur'), LIFE.map(([v, t]) => [v, tx(t)]), state.life, v => { state.life = v; state.preset = 'Custom'; apply(); paint(); }, 'life');
      canvas = el(app, 'canvas'); canvas.setAttribute('aria-label', tx('het zonnestelsel; sleep om een planeet weg te slingeren'));
      cw = canvas.clientWidth || 600; try { ro = new ResizeObserver(() => { cw = canvas.clientWidth || cw; }); ro.observe(canvas); } catch { ro = null; }
      canvas.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch {} drag = { a: toWorld(e), b: toWorld(e) }; });
      canvas.addEventListener('pointermove', e => { if (drag) drag.b = toWorld(e); });
      const endDrag = e => { if (!drag) return; const d = drag; drag = null; const r = Math.hypot(d.a.x, d.a.y); if (r < 0.08) return;
        const k = Math.min(1, Math.max(0, (r / Math.max(0.4, state.orbit) - 0.32) / 1.45)), semi = Math.round((1 - k) * 30);
        const vx = (d.b.x - d.a.x) * 2.2, vy = (d.b.y - d.a.y) * 2.2; let ux = vx, uy = vy;
        if (Math.hypot(vx, vy) < 0.05) { const vc = Math.sqrt(eff.gravity / r); ux = -d.a.y / r * vc; uy = d.a.x / r * vc; }
        postNode({ type: 'throw', x: d.a.x, y: d.a.y, vx: ux, vy: uy, note: quantize(semi) }); };
      canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', () => { drag = null; });
      const acts = el(app, 'div', 'acts');
      const btn = (t, title, fn) => { const b = el(acts, 'button', '', tx(t)); b.type = 'button'; b.title = tx(title); b.onclick = fn; b.addEventListener('pointerdown', e => e.stopPropagation()); return b; };
      btn('Oerknal', 'vijf planeten tegelijk, uit de toonladder', () => { const ns = []; for (let i = 0; i < 5; i++) ns.push(randomNote()); postNode({ type: 'bang', notes: ns }); });
      btn('Komeet', 'een komeet valt van buiten naar binnen', () => postNode({ type: 'comet' }));
      btn('Zwart gat: slik alles', 'alle planeten storten in de zon, met dalende toon', () => postNode({ type: 'sweep' }));
      btn('Stilte', 'alle planeten verdwijnen', () => postNode({ type: 'panic' }));
      statusEl = el(app, 'p', 'st');
      ui.k = {};
      GROUPS.forEach((gname, gi) => { el(app, 'h3', '', tx(gname)); const g = el(app, 'div', 'grid');
        for (const [id, d] of Object.entries(spec)) { if (d.g !== gi) continue; const c = el(g, 'div', 'c'), lab = el(c, 'div', 'lab'); el(lab, 'span', '', tx(d.name)); const o = el(lab, 'output');
          const inp = el(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = '0.001'; inp.setAttribute('aria-label', tx(d.name)); inp.title = tx(d.name);
          inp.value = String(toS(d, defaults[id])); inp.dataset.pkDefault = inp.value; o.textContent = fmt(d, defaults[id]);
          inp.addEventListener('pointerdown', e => e.stopPropagation()); adopt(inp, id, 'param', GROUP_IDS[d.g] || 'sound', tx(d.name));
          inp.oninput = () => { state[id] = fromS(d, +inp.value); state.preset = 'Custom'; o.textContent = fmt(d, state[id]); if (ui.preset) ui.preset.value = 'Custom'; apply(); };
          ui.k[id] = { set(v) { inp.value = String(toS(d, v)); o.textContent = fmt(d, v); } }; } });
      paint(); paintStatus(); raf = host.frame(self, draw, 60);
    }
    function toWorld(e) { const b = canvas.getBoundingClientRect(), sc = Math.min(b.width, b.height) / 2 / 2.1; return { x: (e.clientX - b.left - b.width / 2) / sc, y: (e.clientY - b.top - b.height / 2) / sc }; }
    function paintStatus() { if (!statusEl) return; statusEl.textContent = workletOk ? tx('{0} hemellichamen in de ruimte', view.p.length) : tx('AudioWorklet niet beschikbaar: dit heelal blijft stil (open Patchkamer in Chrome, Edge of Firefox).'); }
    let lastStatus = 0;
    function draw(ts) { if (dead || !canvas) return;
      const dpr = clamp(globalThis.devicePixelRatio || 1, 1, 3), w = Math.max(200, cw), h = Math.max(120, canvas.clientHeight || 340);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      const g = canvas.getContext('2d'); if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = 'rgba(5,6,11,0.32)'; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 2 / 2.1;
      // sterren
      if (!draw.stars) { draw.stars = Array.from({ length: 90 }, () => [Math.random(), Math.random(), Math.random()]); }
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (const [x, y, b] of draw.stars) { g.globalAlpha = 0.2 + 0.5 * b * (0.7 + 0.3 * Math.sin(ts / 900 + x * 40)); g.fillRect(x * w, y * h, 1.2, 1.2); } g.globalAlpha = 1;
      // zon of zwart gat
      const hole = view.hole || 0, pulse = view.gm || 1, rs = (0.015 + hole * 0.33) * sc;
      if (hole > 0.02) { const grd = g.createRadialGradient(cx, cy, rs * 0.8, cx, cy, rs * 3.2); grd.addColorStop(0, 'rgba(255,140,40,0.9)'); grd.addColorStop(0.35, 'rgba(180,60,255,0.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, rs * 3.2, 0, 7); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, rs, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,200,120,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, rs * 1.9, rs * 0.45, ts / 4000, 0, 7); g.stroke(); }
      else { const R = 14 * (0.9 + 0.25 * (pulse - 1)); const grd = g.createRadialGradient(cx, cy, 2, cx, cy, R * 3); grd.addColorStop(0, '#fff6d0'); grd.addColorStop(0.25, '#ffcf6b'); grd.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, R * 3, 0, 7); g.fill(); }
      // planeten met staart
      const seen = new Set();
      for (const [id, x, y, f0, amp, comet, gulped] of view.p) { seen.add(id); const px = cx + x * sc, py = cy + y * sc; let tr = trails.get(id); if (!tr) trails.set(id, tr = []); tr.push([px, py]); if (tr.length > (comet ? 60 : 36)) tr.shift();
        const hue = (Math.log2(f0 / 55) * 120) % 360; g.strokeStyle = `hsla(${hue},90%,65%,0.45)`; g.lineWidth = comet ? 1.2 : 2; g.beginPath(); tr.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
        const rad = comet ? 2.5 : 3 + 14 * Math.min(1, amp * 6); g.fillStyle = gulped ? '#ff6a3d' : `hsl(${hue},90%,${comet ? 92 : 68}%)`; g.shadowColor = g.fillStyle; g.shadowBlur = 12; g.beginPath(); g.arc(px, py, rad, 0, 7); g.fill(); g.shadowBlur = 0; }
      for (const k of [...trails.keys()]) if (!seen.has(k)) trails.delete(k);
      // gebeurtenissen: botsing, vlam, opgeslokt, pulsar
      const now = performance.now(); flashes = flashes.filter(f => now - f.t < 700);
      for (const f of flashes) { const a = 1 - (now - f.t) / 700; if (f.k === 'pulse') { g.strokeStyle = `rgba(150,200,255,${a * 0.6})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, (1 - a) * sc * 2, 0, 7); g.stroke(); continue; }
        const px = cx + f.x * sc, py = cy + f.y * sc; g.strokeStyle = f.k === 'merge' ? `rgba(255,255,255,${a})` : f.k === 'flare' ? `rgba(255,170,60,${a})` : `rgba(190,90,255,${a})`; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 4 + (1 - a) * 30, 0, 7); g.stroke(); }
      // sleeppijl
      if (drag) { const ax = cx + drag.a.x * sc, ay = cy + drag.a.y * sc, bx = cx + drag.b.x * sc, by = cy + drag.b.y * sc; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([]); g.fillStyle = '#fff'; g.beginPath(); g.arc(ax, ay, 5, 0, 7); g.fill(); }
      if (ts - lastStatus > 500) { lastStatus = ts; paintStatus(); }
    }
    function paint() { if (!root) return; for (const [id, k] of Object.entries(ui.k || {})) k.set(state[id]); if (ui.preset) ui.preset.value = state.preset; if (ui.scale) ui.scale.value = state.scale; if (ui.root) ui.root.value = String(state.root); if (ui.life) ui.life.value = state.life; }
    function unmount() { if (raf) raf(); raf = null; if (ro) { try { ro.disconnect(); } catch { } ro = null; } if (root) root.innerHTML = ''; root = null; canvas = null; ui = {}; statusEl = null; }

    const self = {
      inputs: {}, outputs: { out },
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; const sd = finite(info.stepDur, 0.125, 0.01, 2); setEcho(sd); postNode({ type: 'step', step: (info.step | 0) % 16, time: finite(info.time, ctx.currentTime, 0, 1e9) }); } catch {} },
      onTransport(info) { try { if (!info?.playing && state.life !== 'forever') postNode({ type: 'panic' }); } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'notes' || !e) return; const time = Math.max(ctx.currentTime, finite(e.time, ctx.currentTime, 0, 1e9)), type = String(e.type || '').toLowerCase().replace(/[_-]/g, '');
          if (type === 'panic' || type === 'allnotesoff') postNode({ type: 'panic', time });
          else if ((type === 'noteoff' || ((type === 'note' || type === 'noteon') && e.vel === 0)) && Number.isFinite(e.note)) postNode({ type: 'off', note: Math.round(e.note), time });
          else if ((type === 'note' || type === 'noteon') && Number.isFinite(e.note)) postNode({ type: 'note', note: Math.round(clamp(e.note, 0, 127)), vel: finite(e.vel, 0.8, 0, 1), dur: Number.isFinite(e.dur) ? clamp(e.dur, 0.01, 120) : undefined, time });
          else if (type === 'cc' && Object.hasOwn(spec, e.id) && Number.isFinite(e.value)) { const d = spec[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min); state.preset = 'Custom'; apply(); paint(); }
        } catch {} },
      params() { return Object.entries(spec).map(([id, d]) => ({ id, name: tx(d.name), lane: 'universe', laneName: tx('Heelal'), min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.02, on: d.role !== 'level' })); },
      modulate(o) { try { if (dead) return; mod = {}; if (o && typeof o === 'object' && !Array.isArray(o)) for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { if (node) { node.port.onmessage = null; node.port.postMessage({ type: 'panic' }); } } catch {} for (const n of nodes) try { n.disconnect(); } catch {} nodes.clear(); },
    };
    apply();
    return self;
  },
};
