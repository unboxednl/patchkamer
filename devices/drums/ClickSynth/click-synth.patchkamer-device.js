// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Verbeterd: de waarnemer van de breedte van de scoop gooide een fout als de kaart werd weggehaald of opnieuw opgebouwd; hij wordt nu losgekoppeld. Het geluid is ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Click Synth en nieuwe id nl.patchkamer.clicksynth (voorheen Klikwerk, nl.patchkamer.klikwerk); tunes en songs uit die tijd verwijzen
//          naar de oude id. Tweetalig (host.lang; namen van het apparaat en de poorten per taal in i18n; alle teksten in TXT). De namen in de state zijn Engels: de klankmotoren
//          (tick, bleep, fm, noise, modal, string, zap, glitch), de kits (Micro Click, Wood & Glass, Bleep Lab, Insects, Glitch Works, Minimal Techno, Custom) en de namen van de sporen,
//          en de standen van "Klik op een stap" (on, accent, chance, ratchet, tone). De audiomotor is ongewijzigd (sample voor sample gelijk) op de nieuwe namen na.
// 1.7.6 — Tekent via de klok van de host (niet buiten beeld), minder layout-werk per frame.
// Click Synth: een percussiesynth voor microgeluiden: kliks, tiks, bleeps, zaps, hout, glas, metaal en glitches. Acht sporen met elk een eigen klankmotor die je boetseert (toon, pitch-envelope,
// kleur, karakter, ruis, decay, drive, crush, filter, pan, niveau en randomness: elke slag net iets anders). Alles wordt sample-nauwkeurig gesynthetiseerd in een AudioWorklet.
// Sequencer: 16 stappen per spoor, met eigen lengte per spoor (polyritme), 4 patronen, per stap velocity, kans, ratchet en toonsprong. Loopt op de klok van de host; zet hem uit om te spelen
// vanuit een ander apparaat. Ingang 'trigger': {type:'trig',lane:'ch1'..'ch8',vel,time} of noten 36..43 / 60..67. Uitgangen: stereo mix, en een bundel met de 8 sporen los.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { title: 'CLICK SYNTH · percussiesynth', sub: 'Acht sporen met elk een eigen klankmotor. Boetseer kliks, tiks, bleeps, zaps, hout, glas, metaal en glitches. Willekeur maakt elke slag net anders; elk spoor kan een eigen lengte hebben (polyritme).',
    p: { pitch: 'Toonhoogte', penv: 'Pitch-envelope', ptime: 'Pitch-tijd', decay: 'Decay', color: 'Kleur', shape: 'Karakter', noise: 'Ruis', drive: 'Drive', crush: 'Crush', cut: 'Filter', res: 'Resonantie', pan: 'Pan', level: 'Niveau', vari: 'Willekeur' },
    groups: ['Toon en tijd', 'Klankvorm', 'Bewerking', 'Mix en leven'],
    engines: { tick: 'Tik (impuls + resonator)', bleep: 'Bleep (oscillator)', fm: 'FM-metaal', noise: 'Ruis (bandfilter)', modal: 'Modaal (hout → glas → metaal → vel)', string: 'Snaar (plukken)', zap: 'Zap (laser)', glitch: 'Glitch (stotter)' },
    hints: { tick: 'Kleur = ruis in de klik · Karakter = resonantie', bleep: 'Kleur = sinus → blok → zaag · Karakter = octaaf-FM', fm: 'Kleur = verhouding modulator · Karakter = FM-diepte', noise: 'Kleur = wit → donker · Karakter = smalheid filter', modal: 'Kleur = materiaal: hout, glas, metaal, vel · Karakter = hoge delen sterven sneller', string: 'Kleur = helderheid · Karakter = vervorming', zap: 'Kleur = sinus → blok · Karakter = fold', glitch: 'Kleur = stotter-snelheid · Karakter = boventonen' },
    ftypes: { lp: 'Laagdoorlaat', bp: 'Banddoorlaat', hp: 'Hoogdoorlaat' }, center: 'midden', custom: 'Eigen kit', kit: 'Kit', pattern: 'Patroon', patTitle: n => 'patroon ' + n + ' · Shift-klik: kopieer het huidige patroon hierheen',
    clickStep: 'Klik op een stap', modes: { on: 'Aan / uit', accent: 'Accent (hard / zacht)', chance: 'Kans (100 → 25%)', ratchet: 'Ratchet (1 → 4)', tone: 'Toonsprong' },
    sequencer: 'Sequencer', runTitle: 'uit: alleen spelen via de ingang (een ander apparaat / keyboard)', on: 'Aan', off: 'Uit', master: 'Master', surpriseKit: 'Verras kit', surpriseKitTitle: 'elk spoor een willekeurige nieuwe klank (patronen blijven)',
    laneTitle: 'kies dit spoor · speelt de klank', mute: 'demp', solo: 'solo', stepAria: (i, j) => `spoor ${i} stap ${j}`, lenTitle: 'lengte van dit spoor (polyritme)', lenAria: i => 'lengte spoor ' + i,
    name: 'Naam', engine: 'Klankmotor', ftype: 'Filtertype', choke: 'Afknijpgroep', none: 'Geen', group: n => 'Groep ' + n, play: 'Speel', surprise: 'Verras', surpriseTitle: 'willekeurige klank binnen deze klankmotor',
    surprisePat: 'Verras patroon', surprisePatTitle: 'willekeurig ritme voor dit spoor', clearPat: 'Wis patroon', scopeAria: 'golfvorm van het gekozen spoor', knobTitle: name => name + ' — dubbelklik voor de waarde uit de kit',
    note: 'Klik op een stap volgens de keuze bovenaan; Shift-klik zet een stap zacht, rechtsklik wist hem. Lengte per spoor maakt polyritmes (bijv. 7 tegen 16). Afknijpgroep: een slag kapt de andere sporen in dezelfde groep af (open/dichte hihat). Sequencer uit: speel vanuit een ander apparaat (drumprotocol trig, ch1–ch8) of met noten 36–43. De bundeluitgang geeft elk spoor los aan de Mixer.',
    noWorklet: 'AudioWorklet niet beschikbaar: Click Synth blijft stil (open Patchkamer in Chrome, Edge of Firefox).', bundle: 'Click Synth' },
  en: { title: 'CLICK SYNTH · percussion synth', sub: 'Eight lanes, each with its own sound engine. Shape clicks, ticks, bleeps, zaps, wood, glass, metal and glitches. Randomness makes every hit a little different; each lane can have its own length (polyrhythm).',
    p: { pitch: 'Pitch', penv: 'Pitch envelope', ptime: 'Pitch time', decay: 'Decay', color: 'Color', shape: 'Character', noise: 'Noise', drive: 'Drive', crush: 'Crush', cut: 'Filter', res: 'Resonance', pan: 'Pan', level: 'Level', vari: 'Randomness' },
    groups: ['Pitch and time', 'Sound shape', 'Processing', 'Mix and life'],
    engines: { tick: 'Tick (impulse + resonator)', bleep: 'Bleep (oscillator)', fm: 'FM metal', noise: 'Noise (band filter)', modal: 'Modal (wood → glass → metal → skin)', string: 'String (pluck)', zap: 'Zap (laser)', glitch: 'Glitch (stutter)' },
    hints: { tick: 'Color = noise in the click · Character = resonance', bleep: 'Color = sine → square → saw · Character = octave FM', fm: 'Color = modulator ratio · Character = FM depth', noise: 'Color = white → dark · Character = filter narrowness', modal: 'Color = material: wood, glass, metal, skin · Character = high parts die faster', string: 'Color = brightness · Character = distortion', zap: 'Color = sine → square · Character = fold', glitch: 'Color = stutter speed · Character = overtones' },
    ftypes: { lp: 'Low-pass', bp: 'Band-pass', hp: 'High-pass' }, center: 'center', custom: 'Custom kit', kit: 'Kit', pattern: 'Pattern', patTitle: n => 'pattern ' + n + ' · Shift-click: copy the current pattern here',
    clickStep: 'Click on a step', modes: { on: 'On / off', accent: 'Accent (hard / soft)', chance: 'Chance (100 → 25%)', ratchet: 'Ratchet (1 → 4)', tone: 'Pitch jump' },
    sequencer: 'Sequencer', runTitle: 'off: only play through the input (another device / keyboard)', on: 'On', off: 'Off', master: 'Master', surpriseKit: 'Surprise kit', surpriseKitTitle: 'a random new sound for every lane (patterns stay)',
    laneTitle: 'select this lane · plays the sound', mute: 'mute', solo: 'solo', stepAria: (i, j) => `lane ${i} step ${j}`, lenTitle: 'length of this lane (polyrhythm)', lenAria: i => 'length of lane ' + i,
    name: 'Name', engine: 'Sound engine', ftype: 'Filter type', choke: 'Choke group', none: 'None', group: n => 'Group ' + n, play: 'Play', surprise: 'Surprise', surpriseTitle: 'a random sound within this sound engine',
    surprisePat: 'Surprise pattern', surprisePatTitle: 'a random rhythm for this lane', clearPat: 'Clear pattern', scopeAria: 'waveform of the selected lane', knobTitle: name => name + ' — double-click for the value from the kit',
    note: 'Click a step according to the choice at the top; Shift-click makes a step soft, right-click clears it. Length per lane makes polyrhythms (e.g. 7 against 16). Choke group: a hit cuts off the other lanes in the same group (open/closed hi-hat). Sequencer off: play from another device (drum protocol trig, ch1–ch8) or with notes 36–43. The bundle output gives every lane separately to the Mixer.',
    noWorklet: 'AudioWorklet is not available: Click Synth stays silent (open Patchkamer in Chrome, Edge or Firefox).', bundle: 'Click Synth' },
};
const WNAME = 'nl-patchkamer-clicksynth-1-11-0';
const WORKLET = `
const TAU=Math.PI*2;
const MAT=[[1,2.57,4.21,6.13],[1,2.32,4.25,6.63],[1,2.76,5.40,8.93],[1,1.59,2.14,2.65]]; // wood, glass, metal, skin/drum
const FMR=[0.5,1,1.41,2,2.76,3.5,5.19,7.3,11.2];
class ClickSynth extends AudioWorkletProcessor{
  constructor(){ super(); this.V=[]; this.q=[]; this.seed=4242;
    this.port.onmessage=e=>{ const m=e.data||{}; if(m.type==='hit') this.q.push(m); else if(m.type==='panic'){ for(const v of this.V) v.kill=1; this.q=[]; } }; }
  rnd(){ this.seed=(this.seed*16807)%2147483647; return this.seed/1073741823.5-1; }
  start(m,off){ const sr=sampleRate, p=m.p, f0=Math.min(sr*0.45,Math.max(10,p.pitch));
    if(p.choke>0){ for(const v of this.V) if(v.choke===p.choke&&!v.kill) v.kill=1; }
    if(this.V.length>=40){ let o=this.V[0]; for(const v of this.V) if(v.age>o.age) o=v; o.kill=1; }
    const decS=Math.max(8,p.decay*sr), v={lane:m.lane,engine:p.engine,off,n:0,age:0,f0,p,vel:m.vel,choke:p.choke,
      kdec:Math.exp(-1/decS),env:1,att:Math.max(2,Math.round(0.00025*sr)),pe:1,kpe:Math.exp(-1/Math.max(4,p.ptime*sr)),ph:0,ph2:0,
      y1:0,y2:0,lp:0,ic1:0,ic2:0,hold:0,hv:0,kill:0,kv:1,gl:1,glN:0,
      gL:Math.cos((p.pan+1)*Math.PI/4)*m.vel*p.level, gR:Math.sin((p.pan+1)*Math.PI/4)*m.vel*p.level};
    if(p.engine==='modal'){ const c=p.color*3, i=Math.min(2,Math.floor(c)), fr=c-i, R=MAT[i].map((x,k)=>x+(MAT[i+1][k]-x)*fr);
      v.modes=R.map((ratio,k)=>{ const f=f0*ratio; if(f>sr*0.45) return null; const d=p.decay*Math.pow(1+p.shape*3,-k)*sr, r=Math.exp(-1/Math.max(4,d)), w=TAU*f/sr; return {a1:2*r*Math.cos(w),a2:-r*r,b0:Math.sin(w)*0.7,y1:0,y2:0,g:[1,0.62,0.42,0.3][k]}; }).filter(Boolean); v.kdec=Math.exp(-1/(p.decay*sr*1.3)); }
    if(p.engine==='string'){ const L=Math.max(2,Math.round(sr/f0)); v.buf=new Float32Array(L); let lp=0; for(let i=0;i<L;i++){ lp+=(this.rnd()-lp)*(0.15+0.85*p.color); v.buf[i]=lp; } v.bi=0; v.prev=0;
      v.fb=Math.pow(0.001,1/Math.max(1,p.decay*f0)); v.kdec=Math.exp(-1/(p.decay*sr*1.4)); }
    // filter (TPT state variable)
    const g=Math.tan(Math.PI*Math.min(sr*0.45,p.cut)/sr), k=2-1.92*p.res; v.fg=g; v.fk=k; v.fa1=1/(1+g*(g+k)); v.fa2=g*v.fa1; v.fa3=g*v.fa2;
    this.V.push(v); }
  process(_i,outs){ const sr=sampleRate, N=outs[0][0].length, end=currentTime+N/sr;
    if(this.q.length){ const keep=[]; for(const m of this.q){ if(m.time<end){ this.start(m,Math.max(0,Math.min(N-1,Math.round((m.time-currentTime)*sr)))); } else keep.push(m); } this.q=keep; }
    const ML=outs[0][0], MR=outs[0][1]||outs[0][0];
    for(const v of this.V){ const p=v.p, o=outs[1+v.lane], OL=o?o[0]:null, OR=o?(o[1]||o[0]):null;
      const hz=v.f0, crushN=p.crush>0?1+Math.floor(p.crush*p.crush*48):1, bits=p.crush>0?Math.pow(2,16-p.crush*13):0, drv=1+p.drive*10, dnorm=1/Math.tanh(drv);
      for(let t=v.off;t<N;t++){ const n=v.n++;
        let env=v.env; v.env*=v.kdec; if(n<v.att) env*=n/v.att; if(v.kill){ v.kv*=0.992; env*=v.kv; }
        const pe=v.pe; v.pe*=v.kpe; const f=Math.min(sr*0.45,hz*Math.pow(2,p.penv*pe/12));
        let s=0;
        switch(v.engine){
          case 'tick':{ const exc=n===0?1:(n<12?this.rnd()*p.color*0.9:0); if((n&7)===0){ const r=Math.exp(-1/Math.max(4,p.decay*sr*0.5)), w=TAU*f/sr; v.a1=2*r*Math.cos(w); v.a2=-r*r; v.b0=Math.sin(w)*0.9; }
            const y=exc*v.b0+v.a1*v.y1+v.a2*v.y2; v.y2=v.y1; v.y1=y; s=y*(0.25+p.shape*0.9)+exc*(1-p.shape)*0.9; env=1; if(v.kill) env=v.kv; if(n>p.decay*sr*4) v.dead=1; break; }
          case 'bleep':{ v.ph+=f/sr; v.ph-=Math.floor(v.ph); const x=Math.sin(TAU*v.ph), c=p.color;
            const sq=Math.tanh(x*8)/Math.tanh(8), saw=2*v.ph-1; s=c<0.5?x+(sq-x)*c*2:sq+(saw-sq)*(c-0.5)*2; s+=p.shape*0.6*Math.sin(TAU*v.ph*2+x); s*=0.8; break; }
          case 'fm':{ const ratio=FMR[Math.min(FMR.length-1,Math.floor(p.color*FMR.length))]; v.ph+=f/sr; v.ph2+=f*ratio/sr; v.ph-=Math.floor(v.ph); v.ph2-=Math.floor(v.ph2);
            const idx=p.shape*9*(0.25+0.75*env*env); s=Math.sin(TAU*v.ph+idx*Math.sin(TAU*v.ph2))*0.8; break; }
          case 'noise':{ const nz=this.rnd(); v.lp+=(nz-v.lp)*(1-p.color*0.92); if((n&7)===0){ const g=Math.tan(Math.PI*Math.min(sr*0.45,f)/sr), k=1/(0.6+p.shape*18); v.bg=g; v.ba1=1/(1+g*(g+k)); v.ba2=g*v.ba1; v.bk=k; }
            const v3=v.lp-v.y2, v1=v.ba1*v.y1+v.ba2*v3, v2=v.y2+v.bg*v1; v.y1=2*v1-v.y1; v.y2=2*v2-v.y2; s=(v1*(1+p.shape*3)*0.9+v.lp*(1-p.shape)*0.3); break; }
          case 'modal':{ const exc=n===0?1:(n<40?this.rnd()*p.noise*0.3*(1-n/40):0); for(const md of v.modes){ const y=exc*md.b0+md.a1*md.y1+md.a2*md.y2; md.y2=md.y1; md.y1=y; s+=y*md.g; } env=v.kill?v.kv:1; if(n>p.decay*sr*5) v.dead=1; break; }
          case 'string':{ const L=v.buf.length, i=v.bi, y=v.buf[i]; const nx=v.buf[(i+1)%L]; const d=0.5+0.45*(1-p.color); v.buf[i]=(y*d+nx*(1-d))*v.fb; v.bi=(i+1)%L; s=y*0.9; if(p.shape>0) s=s*(1-p.shape)+Math.tanh(s*4)*p.shape*0.6; env=v.kill?v.kv:Math.min(1,env*4); if(n>p.decay*sr*5) v.dead=1; break; }
          case 'zap':{ v.ph+=f/sr; v.ph-=Math.floor(v.ph); const x=TAU*v.ph; s=Math.sin(x+p.shape*4*Math.sin(x)); if(p.color>0) s=s*(1-p.color)+(v.ph<0.5?1:-1)*p.color*0.7; s*=0.8; break; }
          case 'glitch':{ if(v.glN--<=0){ v.glN=Math.round((0.0004+Math.pow(1-p.color,2)*0.03)*sr); const opt=[0.5,1,1,1.5,2,3,0.75]; v.gl=opt[Math.floor((this.rnd()*0.5+0.5)*opt.length)%opt.length]; }
            v.ph+=f*v.gl/sr; v.ph-=Math.floor(v.ph); s=(v.ph<0.5?0.7:-0.7)*(1-p.shape*0.5)+Math.sin(TAU*v.ph*3)*p.shape*0.4; break; }
        }
        if(p.noise>0&&v.engine!=='modal'&&v.engine!=='noise') s=s*(1-p.noise*0.6)+this.rnd()*p.noise*env*0.7;
        if(p.drive>0) s=Math.tanh(s*drv)*dnorm*0.9;
        if(crushN>1||bits){ if(v.hold--<=0){ v.hold=crushN-1; v.hv=bits?Math.round(s*bits)/bits:s; } s=v.hv; }
        // filter
        { const v3=s-v.ic2, v1=v.fa1*v.ic1+v.fa2*v3, v2=v.ic2+v.fa2*v.ic1+v.fa3*v3; v.ic1=2*v1-v.ic1; v.ic2=2*v2-v.ic2;
          s=p.ftype==='lp'?v2:p.ftype==='hp'?s-v.fk*v1-v2:v1*v.fk*1.4; }
        s*=env; const l=s*v.gL, r=s*v.gR; ML[t]+=l; MR[t]+=r; if(OL){ OL[t]+=l; OR[t]+=r; }
        if((v.engine!=='tick'&&v.engine!=='modal'&&v.engine!=='string'&&env<0.00005&&n>v.att)||(v.kill&&v.kv<0.0005)) { v.dead=1; break; }
      }
      v.off=0; v.age++; }
    if(this.V.some(v=>v.dead)) this.V=this.V.filter(v=>!v.dead);
    for(let t=0;t<N;t++){ ML[t]=Math.tanh(ML[t]); MR[t]=Math.tanh(MR[t]); }
    return true; } }
registerProcessor('${WNAME}', ClickSynth);`;

// 1.7.6: tekent via de klok van de host (niet buiten beeld), minder layout-werk per frame.
const pkLoop = (host, getInst, cb, fps) => {   // tekenen via de klok van de host (alleen als de kaart in beeld is), anders eigen rAF op fps
  const inst = getInst(); if (host && typeof host.frame === 'function' && inst && inst._id) return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false; const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); }; raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); }; };
export default {
  id: 'nl.patchkamer.clicksynth', name: 'Click Synth', version: '1.11.1', kind: 'instrument', category: 'groove',
  ui: { width: 1080, minWidth: 560 },
  i18n: { en: { name: 'Click Synth', ports: { out: 'Stereo mix', trigger: 'Trigs / notes', mod: 'Mod', multi: 'Separate lanes (bundle)' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo mix' }], eventIn: [{ id: 'trigger', name: 'Trigs / noten' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [], multiIn: [], multiOut: [{ id: 'multi', name: 'Sporen los (bundel)' }] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    const NL = 8, NS = 16; let accCol = null, accT = 0;
    let dead = false, node = null, workletOk = false, mod = {}, absStep = -1, stepDur = 0.125, cur = new Array(NL).fill(-1);
    const nodes = new Set(); const own = n => (nodes.add(n), n); const gain = v => { const g = own(ctx.createGain()); g.gain.value = v; return g; };
    // ---------- parameters per spoor ----------
    const PS = {
      pitch: { name: T.p.pitch, min: 20, max: 12000, scale: 'log', unit: 'Hz', g: 0 },
      penv: { name: T.p.penv, min: -48, max: 48, unit: 'st', g: 0 },
      ptime: { name: T.p.ptime, min: 0.001, max: 0.5, scale: 'log', unit: 's', g: 0 },
      decay: { name: T.p.decay, min: 0.004, max: 3, scale: 'log', unit: 's', g: 0 },
      color: { name: T.p.color, min: 0, max: 1, unit: '%', g: 1 },
      shape: { name: T.p.shape, min: 0, max: 1, unit: '%', g: 1 },
      noise: { name: T.p.noise, min: 0, max: 1, unit: '%', g: 1 },
      drive: { name: T.p.drive, min: 0, max: 1, unit: '%', g: 2 },
      crush: { name: T.p.crush, min: 0, max: 1, unit: '%', g: 2 },
      cut: { name: T.p.cut, min: 30, max: 20000, scale: 'log', unit: 'Hz', g: 2 },
      res: { name: T.p.res, min: 0, max: 1, unit: '%', g: 2 },
      pan: { name: T.p.pan, min: -1, max: 1, unit: 'pan', g: 3 },
      level: { name: T.p.level, min: 0, max: 1, unit: '%', g: 3 },
      vari: { name: T.p.vari, min: 0, max: 1, unit: '%', g: 3 },
    };
    const PGROUPS = T.groups;
    const ENGINES = Object.keys(T.engines).map(k => [k, T.engines[k]]);
    const COLOR_HINT = T.hints;
    const FTYPES = Object.keys(T.ftypes).map(k => [k, T.ftypes[k]]);
    const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const sound = (engine, o = {}) => ({ engine, choke: 0, ftype: 'lp', p: { pitch: 400, penv: 0, ptime: 0.02, decay: 0.12, color: 0.3, shape: 0.5, noise: 0, drive: 0, crush: 0, cut: 20000, res: 0, pan: 0, level: 0.8, vari: 0.1, ...o } });
    // patroon uit tekst: X = accent, x = gewoon, o = zacht, ? = halve kans, 2/3/4 = ratchet, . = leeg
    const pat = (txt, tones) => { const a = []; for (let i = 0; i < NS; i++) { const c = txt[i] || '.'; const st = { v: 0, p: 1, r: 1, t: 0 };
        if (c === 'X') st.v = 1; else if (c === 'x') st.v = 0.75; else if (c === 'o') st.v = 0.45; else if (c === '?') { st.v = 0.7; st.p = 0.5; } else if ('234'.includes(c)) { st.v = 0.7; st.r = +c; }
        if (tones && tones[i] !== undefined && st.v) st.t = tones[i]; a.push(st); } return a; };
    const empty = () => pat('');
    const lane = (name, snd, len, pA, pB, extra = {}) => ({ name, engine: snd.engine, choke: snd.choke, ftype: snd.ftype, mute: false, solo: false, len, p: { ...snd.p }, pats: [pA, pB || pA.map(x => ({ ...x })), empty(), empty()], ...extra });
    const KITS = {
      'Micro Click': () => [
        lane('Kick Tick', sound('bleep', { pitch: 52, penv: 30, ptime: 0.025, decay: 0.28, color: 0, shape: 0.1, drive: 0.25, level: 0.9, vari: 0.03 }), 16, pat('X...x.....X..o..'), pat('X..x..x...X.....')),
        lane('Click', sound('tick', { pitch: 3400, decay: 0.012, color: 0.4, shape: 0.6, level: 0.6, pan: 0.2, vari: 0.25 }), 16, pat('..x...x...x.x..x')),
        lane('Ticker', sound('modal', { pitch: 2350, decay: 0.07, color: 0.36, shape: 0.6, level: 0.55, pan: -0.3, vari: 0.3 }), 12, pat('x..o.x..o..?')),
        lane('Wood', sound('modal', { pitch: 820, decay: 0.11, color: 0.02, shape: 0.4, level: 0.6, pan: 0.35, vari: 0.15 }), 16, pat('....x.......x..o')),
        lane('Hiss', sound('noise', { pitch: 8200, decay: 0.03, color: 0.1, shape: 0.35, level: 0.45, pan: -0.15, vari: 0.2, cut: 20000 }), 16, pat('xoxoxoxoxoxoxoxo'), undefined, { choke: 1 }),
        lane('Bleep', sound('bleep', { pitch: 1760, decay: 0.045, color: 0.55, shape: 0.2, level: 0.35, pan: 0.45, vari: 0.05 }), 7, pat('x..?..o', [0, 0, 0, 7, 0, 0, 12])),
        lane('Zap', sound('zap', { pitch: 260, penv: 36, ptime: 0.018, decay: 0.09, color: 0.1, shape: 0.3, level: 0.45, pan: -0.4, vari: 0.2 }), 16, pat('.......x.......?')),
        lane('Glitch', sound('glitch', { pitch: 620, decay: 0.06, color: 0.6, shape: 0.3, crush: 0.35, level: 0.35, pan: 0.1, vari: 0.4 }), 10, pat('..?.....3.')),
      ],
      'Wood & Glass': () => [
        lane('Drum', sound('modal', { pitch: 70, decay: 0.45, color: 1, shape: 0.5, noise: 0.4, level: 0.9, vari: 0.05 }), 16, pat('X.....x...X.....')),
        lane('Block', sound('modal', { pitch: 1180, decay: 0.09, color: 0, shape: 0.5, level: 0.6, pan: -0.3, vari: 0.15 }), 16, pat('..x..x..x...x.x.')),
        lane('Marimba', sound('modal', { pitch: 440, decay: 0.4, color: 0.05, shape: 0.7, level: 0.55, pan: 0.25, vari: 0.02 }), 12, pat('x..x.x..x.o.', [0, 0, 0, 3, 0, 7, 0, 0, 10, 0, 12, 0])),
        lane('Glass', sound('modal', { pitch: 3100, decay: 0.6, color: 0.34, shape: 0.3, level: 0.35, pan: 0.5, vari: 0.25 }), 16, pat('......x.......o.')),
        lane('Bell', sound('modal', { pitch: 1600, decay: 0.9, color: 0.66, shape: 0.2, level: 0.3, pan: -0.5, vari: 0.1 }), 16, pat('x...............')),
        lane('Pluck', sound('string', { pitch: 330, decay: 0.5, color: 0.6, shape: 0, level: 0.5, pan: 0.1, vari: 0.05 }), 5, pat('x.o.?', [0, 0, 7, 0, 12])),
        lane('Crackle', sound('tick', { pitch: 5200, decay: 0.006, color: 0.9, shape: 0.2, level: 0.4, vari: 0.5 }), 16, pat('?.?.?.?.?.?.?.?.')),
        lane('Shake', sound('noise', { pitch: 6000, decay: 0.05, color: 0.3, shape: 0.2, level: 0.35, pan: 0.3, vari: 0.3 }), 16, pat('.ox..ox..ox..ox.')),
      ],
      'Bleep Lab': () => [
        lane('Sub-blip', sound('bleep', { pitch: 41, penv: 24, ptime: 0.04, decay: 0.35, color: 0, level: 0.85 }), 16, pat('X.......X..x....')),
        lane('Blip', sound('bleep', { pitch: 880, decay: 0.05, color: 0.5, shape: 0.1, level: 0.4, pan: 0.3 }), 16, pat('x.x.o.x.?.x.o..x', [0, 0, 7, 0, 3, 0, 12, 0, 10, 0, 5, 0, 7, 0, 0, 15])),
        lane('Bloop', sound('bleep', { pitch: 330, penv: -12, ptime: 0.06, decay: 0.12, color: 0.75, level: 0.35, pan: -0.3, cut: 2400, res: 0.5 }), 9, pat('x...o.?..', [0, 0, 0, 0, 5, 0, -5])),
        lane('Ping', sound('fm', { pitch: 1320, decay: 0.2, color: 0.55, shape: 0.25, level: 0.3, pan: 0.5 }), 16, pat('....x.......x...')),
        lane('Chirp', sound('zap', { pitch: 2400, penv: -24, ptime: 0.01, decay: 0.05, level: 0.3, pan: -0.5, vari: 0.3 }), 6, pat('x..?..')),
        lane('Tick', sound('tick', { pitch: 2800, decay: 0.01, shape: 0.7, level: 0.5 }), 16, pat('oxoxoxoxoxoxoxox')),
        lane('Data', sound('glitch', { pitch: 1200, decay: 0.08, color: 0.9, crush: 0.5, level: 0.3, vari: 0.5 }), 16, pat('..........4.....')),
        lane('Noise', sound('noise', { pitch: 9000, decay: 0.02, shape: 0.3, level: 0.35 }), 16, pat('..x...x...x...x.')),
      ],
      'Insects': () => [
        lane('Beetle', sound('tick', { pitch: 900, decay: 0.02, color: 0.6, shape: 0.8, level: 0.6, vari: 0.6 }), 16, pat('x.?..x?..x.?.x..')),
        lane('Cricket', sound('fm', { pitch: 4300, decay: 0.03, color: 0.85, shape: 0.6, level: 0.3, pan: -0.6, vari: 0.5 }), 16, pat('3...3...3...4...')),
        lane('Gnat', sound('zap', { pitch: 5200, penv: 5, ptime: 0.05, decay: 0.08, color: 0.2, shape: 0.6, level: 0.18, pan: 0.6, vari: 0.7 }), 11, pat('?....?..?..')),
        lane('Grasshopper', sound('noise', { pitch: 7000, decay: 0.015, color: 0, shape: 0.7, level: 0.35, vari: 0.6 }), 16, pat('4.2.4.2.4.2.4.2.')),
        lane('Dung Beetle', sound('modal', { pitch: 260, decay: 0.12, color: 0.9, shape: 0.6, noise: 0.5, level: 0.7, vari: 0.3 }), 16, pat('X.....x....x....')),
        lane('Wing', sound('glitch', { pitch: 180, decay: 0.12, color: 0.95, shape: 0.6, crush: 0.2, level: 0.3, vari: 0.6 }), 13, pat('......?......')),
        lane('Droplet', sound('bleep', { pitch: 1800, penv: 14, ptime: 0.008, decay: 0.04, level: 0.35, pan: 0.2, vari: 0.5 }), 16, pat('..o.....?...o...')),
        lane('Twig', sound('string', { pitch: 2100, decay: 0.05, color: 0.9, shape: 0.5, level: 0.35, pan: -0.2, vari: 0.5 }), 7, pat('x..?...')),
      ],
      'Glitch Works': () => [
        lane('Kick Crush', sound('bleep', { pitch: 55, penv: 40, ptime: 0.02, decay: 0.3, drive: 0.6, crush: 0.25, level: 0.85 }), 16, pat('X..x..X...x.....')),
        lane('Stutter', sound('glitch', { pitch: 400, decay: 0.1, color: 0.8, crush: 0.6, level: 0.4, vari: 0.6 }), 16, pat('....3.......4...')),
        lane('Bit Click', sound('tick', { pitch: 4000, decay: 0.008, color: 0.5, crush: 0.7, level: 0.5, vari: 0.4 }), 16, pat('x.x?x.x?x.x?x.x?')),
        lane('Metal', sound('fm', { pitch: 310, decay: 0.15, color: 0.75, shape: 0.8, level: 0.4, pan: 0.4, vari: 0.3 }), 12, pat('..x.....?...')),
        lane('Laser', sound('zap', { pitch: 120, penv: 48, ptime: 0.03, decay: 0.12, shape: 0.5, crush: 0.3, level: 0.4, pan: -0.4 }), 16, pat('........x......?')),
        lane('Fax', sound('noise', { pitch: 2500, decay: 0.04, color: 0, shape: 0.8, crush: 0.8, level: 0.35, vari: 0.5 }), 16, pat('.2..2...2..2..2.')),
        lane('Error', sound('glitch', { pitch: 90, decay: 0.2, color: 0.4, shape: 0.6, drive: 0.5, level: 0.4, vari: 0.8 }), 15, pat('?..............')),
        lane('Blip', sound('bleep', { pitch: 2640, decay: 0.03, color: 0.5, crush: 0.4, level: 0.3, pan: 0.5 }), 16, pat('x...............')),
      ],
      'Minimal Techno': () => [
        lane('Kick', sound('bleep', { pitch: 48, penv: 34, ptime: 0.03, decay: 0.4, drive: 0.3, level: 0.95, vari: 0 }), 16, pat('X...X...X...X...')),
        lane('Clap', sound('noise', { pitch: 1300, decay: 0.12, color: 0.3, shape: 0.25, level: 0.55, vari: 0.1 }), 16, pat('....3.......3...')),
        lane('Hat', sound('noise', { pitch: 9500, decay: 0.025, color: 0, shape: 0.2, ftype: 'hp', cut: 6000, level: 0.45, pan: 0.2, vari: 0.15 }), 16, pat('..x...x...x...x.'), undefined, { choke: 1, ftype: 'hp' }),
        lane('Open Hat', sound('noise', { pitch: 8000, decay: 0.18, color: 0, shape: 0.2, cut: 5000, level: 0.35, pan: 0.2 }), 16, pat('......x.........'), undefined, { choke: 1, ftype: 'hp' }),
        lane('Rim', sound('tick', { pitch: 1700, decay: 0.03, color: 0.3, shape: 0.7, level: 0.5, pan: -0.25, vari: 0.1 }), 16, pat('...x..x....x..x.')),
        lane('Perc', sound('fm', { pitch: 520, decay: 0.09, color: 0.4, shape: 0.35, level: 0.45, pan: 0.35, vari: 0.15 }), 10, pat('x...o..?..', [0, 0, 0, 0, 7])),
        lane('Shaker', sound('noise', { pitch: 7000, decay: 0.04, color: 0.2, shape: 0.25, level: 0.3, pan: -0.4, vari: 0.3 }), 16, pat('oxoxoxoxoxoxoxox')),
        lane('Blip', sound('bleep', { pitch: 1100, decay: 0.04, color: 0.6, level: 0.3, pan: 0.5 }), 16, pat('...........x....')),
      ],
    };
    const KIT_NAMES = Object.keys(KITS);
    const defaults = () => ({ kit: 'Micro Click', pattern: 0, run: true, sel: 0, mode: 'on', master: 0.55, lanes: KITS['Micro Click']() });
    function cleanStep(s) { s = s && typeof s === 'object' ? s : {}; return { v: finite(s.v, 0, 0, 1), p: finite(s.p, 1, 0, 1), r: Math.round(finite(s.r, 1, 1, 4)), t: Math.round(finite(s.t, 0, -24, 24)) }; }
    function cleanLane(l, i) { const d = KITS['Micro Click']()[i]; l = l && typeof l === 'object' ? l : d; const p = {};
      for (const [id, s] of Object.entries(PS)) p[id] = finite(l.p?.[id], d.p[id], s.min, s.max);
      const pats = [0, 1, 2, 3].map(k => Array.from({ length: NS }, (_, j) => cleanStep(l.pats?.[k]?.[j])));
      return { name: String(l.name ?? d.name).slice(0, 20), engine: ENGINES.some(e => e[0] === l.engine) ? l.engine : d.engine, choke: Math.round(finite(l.choke, 0, 0, 3)), ftype: ['lp', 'bp', 'hp'].includes(l.ftype) ? l.ftype : 'lp',
        mute: !!l.mute, solo: !!l.solo, len: Math.round(finite(l.len, 16, 1, 16)), p, pats }; }
    function normalize(raw) { const d = defaults(), s = raw && typeof raw === 'object' ? raw : {};
      return { kit: KIT_NAMES.includes(s.kit) || s.kit === 'Custom' ? s.kit : d.kit, pattern: Math.round(finite(s.pattern, 0, 0, 3)), run: s.run !== undefined ? !!s.run : true, sel: Math.round(finite(s.sel, 0, 0, NL - 1)),
        mode: ['on', 'accent', 'chance', 'ratchet', 'tone'].includes(s.mode) ? s.mode : 'on', master: finite(s.master, 0.55, 0, 1),
        lanes: Array.from({ length: NL }, (_, i) => cleanLane(Array.isArray(s.lanes) ? s.lanes[i] : undefined, i)) }; }
    let state = normalize({});

    // ---------- audio ----------
    const mixIn = gain(1), master = gain(0.55), comp = own(ctx.createDynamicsCompressor()), out = gain(1);
    comp.threshold.value = -10; comp.ratio.value = 3; comp.knee.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12;
    mixIn.connect(master).connect(comp).connect(out);
    const laneOut = Array.from({ length: NL }, () => gain(1));
    const analyser = own(ctx.createAnalyser()); analyser.fftSize = 2048; let anLane = -1;
    const listenTo = i => { if (anLane === i) return; try { if (anLane >= 0) laneOut[anLane].disconnect(analyser); } catch {} anLane = i; try { laneOut[i].connect(analyser); } catch {} };
    listenTo(state.sel);
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: NL + 1, outputChannelCount: Array(NL + 1).fill(2) }); nodes.add(node);
      node.connect(mixIn, 0); for (let i = 0; i < NL; i++) node.connect(laneOut[i], i + 1); workletOk = true; paintStatus(); })
      .catch(() => { workletOk = false; paintStatus(); });
    function applyMaster() { master.gain.setTargetAtTime(state.master, ctx.currentTime, 0.03); }
    applyMaster();

    // ---------- slagen ----------
    const effP = (i, id) => { const s = PS[id], b = state.lanes[i].p[id], x = mod['l' + (i + 1) + '.' + id] || 0; if (!x) return b; return clamp(s.scale === 'log' ? b * (s.max / s.min) ** x : b + x * (s.max - s.min), s.min, s.max); };
    const flash = new Array(NL).fill(0);
    function hit(i, time, vel = 0.8, tone = 0) { if (!node) return; const L = state.lanes[i], p = {}; for (const id of Object.keys(PS)) p[id] = effP(i, id);
      const r = p.vari, rn = () => Math.random() * 2 - 1;
      if (r > 0) { p.pitch *= 2 ** (rn() * r * 0.6); p.decay *= 2 ** (rn() * r * 0.8); p.color = clamp(p.color + rn() * r * 0.35, 0, 1); p.shape = clamp(p.shape + rn() * r * 0.35, 0, 1); p.pan = clamp(p.pan + rn() * r * 0.4, -1, 1); vel *= 1 - Math.random() * r * 0.35; }
      p.pitch = clamp(p.pitch * 2 ** (tone / 12), 15, 20000); p.engine = L.engine; p.ftype = L.ftype; p.choke = L.choke;
      node.port.postMessage({ type: 'hit', lane: i, time, vel: clamp(vel, 0, 1), p }); flash[i] = performance.now() + Math.max(0, (time - ctx.currentTime) * 1000); }
    const anySolo = () => state.lanes.some(l => l.solo);
    const audible = i => { const L = state.lanes[i]; return !L.mute && (!anySolo() || L.solo); };

    // ---------- UI ----------
    let root = null, ui = {}, raf = null, statusEl = null, cv = null; const stepEls = [], rowEls = [];
    const fmt = (s, v) => s.unit === '%' ? Math.round(v * 100) + '%' : s.unit === 'Hz' ? (v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz') : s.unit === 's' ? (v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : s.unit === 'st' ? (v > 0 ? '+' : '') + Math.round(v) + ' st' : s.unit === 'pan' ? (Math.abs(v) < 0.02 ? T.center : Math.round(Math.abs(v) * 100) + (v < 0 ? ' L' : ' R')) : v.toFixed(2);
    const toS = (s, v) => s.scale === 'log' ? Math.log(v / s.min) / Math.log(s.max / s.min) : (v - s.min) / (s.max - s.min);
    const fromS = (s, x) => s.scale === 'log' ? s.min * (s.max / s.min) ** x : s.min + x * (s.max - s.min);
    const noteOf = hz => { const m = Math.round(69 + 12 * Math.log2(hz / 440)); return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };
    const CSS = `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--k-acc:#ff9d5c;--k-ink:color-mix(in srgb,var(--k-acc) 60%,var(--fg,#e2e6ea))}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px;box-sizing:border-box}
h2{margin:0;font-size:19px;letter-spacing:1.5px;color:var(--k-ink)} .sub{margin:3px 0 10px;color:var(--muted,#97a1ad);font-size:12px;line-height:1.45}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:10px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button,input[type=text]{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;box-sizing:border-box;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--k-acc)} button.on{background:var(--k-acc);border-color:var(--k-acc);color:#1c1006}
.patbtns{display:flex;gap:3px} .patbtns button{min-width:30px;padding:6px 0}
.rows{display:grid;gap:4px}
.row{display:grid;grid-template-columns:minmax(110px,150px) 26px 26px minmax(0,1fr) 54px;gap:5px;align-items:center}
.row.sel .nm{border-color:var(--k-acc);color:var(--k-ink)}
.nm{text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:flex;gap:6px;align-items:center}
.nm .led{width:8px;height:8px;border-radius:50%;background:var(--well,#0c0f13);flex:none;transition:background .05s} .nm .led.hit{background:var(--k-acc);box-shadow:0 0 6px var(--k-acc)}
.nm small{color:var(--muted,#97a1ad);font-size:10px}
.ms{padding:4px 0;font-size:11px} .ms.mute.on{background:var(--stop,#e05a4f);border-color:var(--stop,#e05a4f);color:#fff} .ms.solo.on{background:var(--go,#58c27d);border-color:var(--go,#58c27d);color:#08130b}
.steps{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:3px}
.st{position:relative;height:28px;padding:0;border-radius:3px;background:var(--well,#0c0f13);font-size:9px;color:#1c1006}
.st:nth-child(4n+1){box-shadow:inset 2px 0 0 var(--line,#39424e)} .st.off-len{opacity:.25;pointer-events:none}
.st.v{background:color-mix(in srgb,var(--k-acc) calc(var(--v)*100%),var(--well,#0c0f13))} .st.cur{outline:2px solid var(--fg,#e2e6ea);outline-offset:-2px}
.st .b{position:absolute;right:2px;top:1px;font-weight:700;font-family:var(--mono,monospace)} .st .pr{position:absolute;left:2px;bottom:1px;font-family:var(--mono,monospace)}
.len select{padding:4px;font-size:11px;width:100%}
.ed{margin-top:12px;border-top:1px solid var(--line,#30363f);padding-top:10px;display:grid;gap:8px}
.edtop{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end} .edtop input[type=text]{width:130px}
canvas{display:block;width:100%;height:70px;border-radius:6px;background:var(--well,#0c0f13)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:6px 0 2px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--k-acc)}
.hint{font-size:11px;color:var(--k-ink)} .note{font-size:11px;color:var(--muted,#97a1ad);line-height:1.5;margin:6px 0 0} .stt{font-size:11px;color:var(--mod,#b48cff)}`;
    const el = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; p.appendChild(e); return e; };
    const stop = e => e.stopPropagation();
    function selectBox(p, label, opts, value, change) { const box = el(p, 'label', 'sel'); el(box, 'span', '', label); const s = el(box, 'select'); for (const [v, t] of opts) { const o = el(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); s.addEventListener('pointerdown', stop); return s; }
    function mount(hostEl) {
      unmount(); const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap; root = hostEl;
      el(sh, 'style').textContent = CSS; const app = el(sh, 'div', 'app');
      el(app, 'h2', '', T.title);
      el(app, 'p', 'sub', T.sub);
      const top = el(app, 'div', 'top');
      ui.kit = selectBox(top, T.kit, KIT_NAMES.map(k => [k, k]).concat([['Custom', T.custom]]), state.kit, v => { if (KITS[v]) { const s = normalize({ ...state, kit: v, lanes: KITS[v]() }); self.setState(s); } });
      const pb = el(el(top, 'label', 'sel'), 'span', '', T.pattern).parentElement; const pbx = el(pb, 'div', 'patbtns'); ui.pat = [];
      ['A', 'B', 'C', 'D'].forEach((n, k) => { const b = el(pbx, 'button', '', n); b.type = 'button'; b.title = T.patTitle(n); b.addEventListener('pointerdown', stop);
        b.onclick = e => { if (e.shiftKey && k !== state.pattern) { state.lanes.forEach(L => { L.pats[k] = L.pats[state.pattern].map(x => ({ ...x })); }); } state.pattern = k; paint(); }; ui.pat.push(b); });
      ui.mode = selectBox(top, T.clickStep, Object.keys(T.modes).map(k => [k, T.modes[k]]), state.mode, v => { state.mode = v; });
      const runL = el(top, 'label', 'sel'); el(runL, 'span', '', T.sequencer); ui.run = el(runL, 'button', '', ''); ui.run.type = 'button'; ui.run.title = T.runTitle; ui.run.addEventListener('pointerdown', stop); ui.run.onclick = () => { state.run = !state.run; paint(); };
      const ml = el(top, 'label', 'sel'); el(ml, 'span', '', T.master); ui.master = el(ml, 'input'); ui.master.type = 'range'; ui.master.min = '0'; ui.master.max = '1'; ui.master.step = '0.01'; ui.master.style.width = '110px'; ui.master.setAttribute('aria-label', T.master); ui.master.addEventListener('pointerdown', stop); ui.master.oninput = () => { state.master = +ui.master.value; applyMaster(); };
      const rb = el(top, 'button', '', T.surpriseKit); rb.type = 'button'; rb.title = T.surpriseKitTitle; rb.addEventListener('pointerdown', stop); rb.onclick = () => { for (let i = 0; i < NL; i++) surprise(i); state.kit = 'Custom'; paint(); };
      statusEl = el(app, 'p', 'stt');
      const rows = el(app, 'div', 'rows'); stepEls.length = 0; rowEls.length = 0;
      for (let i = 0; i < NL; i++) { const row = el(rows, 'div', 'row'); rowEls.push(row);
        const nm = el(row, 'button', 'nm'); nm.type = 'button'; nm.title = T.laneTitle; el(nm, 'span', 'led'); el(nm, 'span', 'tx'); nm.addEventListener('pointerdown', stop); nm.onclick = () => { state.sel = i; listenTo(i); hit(i, ctx.currentTime + 0.01, 0.9); paint(); };
        const m = el(row, 'button', 'ms mute', 'M'); m.type = 'button'; m.title = T.mute; m.addEventListener('pointerdown', stop); m.onclick = () => { state.lanes[i].mute = !state.lanes[i].mute; paint(); };
        const s = el(row, 'button', 'ms solo', 'S'); s.type = 'button'; s.title = T.solo; s.addEventListener('pointerdown', stop); s.onclick = () => { state.lanes[i].solo = !state.lanes[i].solo; paint(); };
        const st = el(row, 'div', 'steps'); const arr = [];
        for (let j = 0; j < NS; j++) { const b = el(st, 'button', 'st'); b.type = 'button'; el(b, 'span', 'b'); el(b, 'span', 'pr'); b.setAttribute('aria-label', T.stepAria(i + 1, j + 1)); b.addEventListener('pointerdown', stop);
          b.onclick = e => { editStep(i, j, e.shiftKey); paint(); }; b.oncontextmenu = e => { e.preventDefault(); const S = state.lanes[i].pats[state.pattern][j]; S.v = 0; S.p = 1; S.r = 1; S.t = 0; paint(); }; arr.push(b); }
        stepEls.push(arr);
        const ln = el(row, 'label', 'len'); const ls = el(ln, 'select'); ls.title = T.lenTitle; ls.setAttribute('aria-label', T.lenAria(i + 1)); for (let k = 1; k <= 16; k++) { const o = el(ls, 'option', '', k + ''); o.value = k; } ls.addEventListener('pointerdown', stop); ls.onchange = () => { state.lanes[i].len = +ls.value; paint(); }; row._len = ls; }
      // editor van het gekozen spoor
      const ed = el(app, 'div', 'ed'); const et = el(ed, 'div', 'edtop');
      const nl = el(et, 'label', 'sel'); el(nl, 'span', '', T.name); ui.name = el(nl, 'input'); ui.name.type = 'text'; ui.name.maxLength = 20; ui.name.addEventListener('pointerdown', stop); ui.name.addEventListener('keydown', stop); ui.name.oninput = () => { state.lanes[state.sel].name = ui.name.value; paintRows(); bundleChanged(); };
      ui.engine = selectBox(et, T.engine, ENGINES, state.lanes[state.sel].engine, v => { state.lanes[state.sel].engine = v; markEigen(); paint(); audition(); });
      ui.ftype = selectBox(et, T.ftype, FTYPES, state.lanes[state.sel].ftype, v => { state.lanes[state.sel].ftype = v; markEigen(); audition(); });
      ui.choke = selectBox(et, T.choke, [[0, T.none], [1, T.group(1)], [2, T.group(2)], [3, T.group(3)]], state.lanes[state.sel].choke, v => { state.lanes[state.sel].choke = +v; markEigen(); });
      const b1 = el(et, 'button', '', T.play); b1.type = 'button'; b1.addEventListener('pointerdown', stop); b1.onclick = () => audition();
      const b2 = el(et, 'button', '', T.surprise); b2.type = 'button'; b2.title = T.surpriseTitle; b2.addEventListener('pointerdown', stop); b2.onclick = () => { surprise(state.sel, true); paint(); audition(); };
      const b3 = el(et, 'button', '', T.surprisePat); b3.type = 'button'; b3.title = T.surprisePatTitle; b3.addEventListener('pointerdown', stop); b3.onclick = () => { randomPattern(state.sel); paint(); };
      const b4 = el(et, 'button', '', T.clearPat); b4.type = 'button'; b4.addEventListener('pointerdown', stop); b4.onclick = () => { state.lanes[state.sel].pats[state.pattern] = empty(); paint(); };
      ui.hint = el(ed, 'div', 'hint'); cv = el(ed, 'canvas'); cv.setAttribute('aria-label', T.scopeAria);
      ui.k = {};
      PGROUPS.forEach((gname, gi) => { el(ed, 'h3', '', gname); const g = el(ed, 'div', 'grid');
        for (const [id, s] of Object.entries(PS)) { if (s.g !== gi) continue; const c = el(g, 'div', 'c'), lab = el(c, 'div', 'lab'); el(lab, 'span', '', s.name); const o = el(lab, 'output');
          const inp = el(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = '0.001'; inp.setAttribute('aria-label', s.name); inp.title = T.knobTitle(s.name);
          inp.addEventListener('pointerdown', stop); let lastA = 0;
          inp.oninput = () => { const L = state.lanes[state.sel]; L.p[id] = fromS(s, +inp.value); if (id === 'penv') L.p[id] = Math.round(L.p[id]); o.textContent = fmt(s, L.p[id]) + (id === 'pitch' ? ' · ' + noteOf(L.p[id]) : ''); markEigen(); const now = performance.now(); if (now - lastA > 140) { lastA = now; audition(); } };
          inp.onchange = () => audition();
          inp.ondblclick = () => { const k = KITS[state.kit] ? KITS[state.kit]()[state.sel] : null; if (k) { state.lanes[state.sel].p[id] = k.p[id]; paint(); audition(); } };
          ui.k[id] = { set(v) { inp.value = String(toS(s, v)); o.textContent = fmt(s, v) + (id === 'pitch' ? ' · ' + noteOf(v) : ''); } }; } });
      el(app, 'p', 'note', T.note);
      paint(); paintStatus(); raf = pkLoop(host, () => self, draw, 30);
    }
    function markEigen() { if (state.kit !== 'Custom') { state.kit = 'Custom'; if (ui.kit) ui.kit.value = 'Custom'; } }
    function audition() { hit(state.sel, ctx.currentTime + 0.01, 0.9); }
    function editStep(i, j, shift) { const S = state.lanes[i].pats[state.pattern][j];
      switch (state.mode) {
        case 'on': if (S.v) { S.v = 0; } else { S.v = shift ? 0.45 : 0.75; S.p = 1; S.r = 1; S.t = 0; } break;
        case 'accent': S.v = S.v >= 0.95 ? 0.45 : S.v >= 0.7 ? 1 : S.v > 0 ? 0.75 : 1; break;
        case 'chance': if (!S.v) S.v = 0.75; S.p = S.p > 0.9 ? 0.75 : S.p > 0.6 ? 0.5 : S.p > 0.3 ? 0.25 : 1; break;
        case 'ratchet': if (!S.v) S.v = 0.75; S.r = S.r >= 4 ? 1 : S.r + 1; break;
        case 'tone': { if (!S.v) S.v = 0.75; const T = [0, 3, 5, 7, 12, -5, -12]; const k = T.indexOf(S.t); S.t = T[(k + 1) % T.length]; break; }
      } }
    function surprise(i, keepEngine) { const L = state.lanes[i], R = Math.random; if (!keepEngine) L.engine = ENGINES[Math.floor(R() * ENGINES.length)][0];
      const e = L.engine, lg = (a, b) => a * (b / a) ** R();
      L.p.pitch = e === 'bleep' && R() < 0.3 ? lg(35, 90) : e === 'noise' ? lg(1500, 11000) : e === 'tick' ? lg(800, 7000) : e === 'modal' ? lg(150, 4000) : e === 'string' ? lg(110, 1800) : e === 'zap' ? lg(80, 3000) : lg(200, 4000);
      L.p.penv = e === 'zap' ? Math.round((R() < 0.5 ? 1 : -1) * lg(12, 48)) : R() < 0.35 ? Math.round((R() * 2 - 1) * 24) : 0; L.p.ptime = lg(0.004, 0.12);
      L.p.decay = e === 'tick' ? lg(0.004, 0.05) : e === 'modal' || e === 'string' ? lg(0.05, 0.9) : lg(0.015, 0.35);
      L.p.color = R(); L.p.shape = R(); L.p.noise = R() < 0.3 ? R() * 0.5 : 0; L.p.drive = R() < 0.4 ? R() * 0.6 : 0; L.p.crush = R() < 0.25 ? R() * 0.7 : 0;
      L.ftype = ['lp', 'bp', 'hp'][Math.floor(R() * 3)]; L.p.cut = L.ftype === 'lp' ? lg(1500, 20000) : L.ftype === 'hp' ? lg(80, 4000) : lg(300, 6000); L.p.res = R() * 0.6; L.p.vari = R() * 0.5; markEigen(); }
    function randomPattern(i) { const L = state.lanes[i], d = 0.15 + Math.random() * 0.35; L.pats[state.pattern] = Array.from({ length: NS }, (_, j) => { const on = Math.random() < (j % 4 === 0 ? d + 0.15 : d);
        return on ? { v: Math.random() < 0.3 ? 1 : Math.random() < 0.5 ? 0.75 : 0.45, p: Math.random() < 0.2 ? 0.5 : 1, r: Math.random() < 0.08 ? 2 + Math.floor(Math.random() * 3) : 1, t: Math.random() < 0.15 ? [3, 5, 7, 12, -12][Math.floor(Math.random() * 5)] : 0 } : { v: 0, p: 1, r: 1, t: 0 }; }); }
    function paintStatus() { if (statusEl) statusEl.textContent = workletOk ? '' : T.noWorklet; }
    function paintRows() { if (!root) return; for (let i = 0; i < NL; i++) { const L = state.lanes[i], row = rowEls[i]; if (!row) continue; row.classList.toggle('sel', i === state.sel);
        row.querySelector('.tx').innerHTML = ''; const tx = row.querySelector('.tx'); tx.textContent = (i + 1) + ' · ' + L.name + ' '; const sm = document.createElement('small'); sm.textContent = L.engine; tx.appendChild(sm);
        row.querySelector('.mute').classList.toggle('on', L.mute); row.querySelector('.solo').classList.toggle('on', L.solo); row._len.value = String(L.len);
        const P = L.pats[state.pattern]; stepEls[i].forEach((b, j) => { const S = P[j]; b.classList.toggle('v', S.v > 0); b.style.setProperty('--v', String(0.35 + 0.65 * S.v)); b.classList.toggle('off-len', j >= L.len);
          b.querySelector('.b').textContent = S.v && S.r > 1 ? '×' + S.r : S.v && S.t ? (S.t > 0 ? '+' : '') + S.t : ''; b.querySelector('.pr').textContent = S.v && S.p < 1 ? Math.round(S.p * 100) + '%' : ''; }); } }
    function paint() { if (!root) return; const L = state.lanes[state.sel]; if (ui.kit) ui.kit.value = state.kit; ui.pat.forEach((b, k) => b.classList.toggle('on', k === state.pattern)); ui.mode.value = state.mode;
      ui.run.textContent = state.run ? T.on : T.off; ui.run.classList.toggle('on', state.run); ui.master.value = String(state.master);
      ui.name.value = L.name; ui.engine.value = L.engine; ui.ftype.value = L.ftype; ui.choke.value = String(L.choke); ui.hint.textContent = COLOR_HINT[L.engine] || '';
      for (const [id, k] of Object.entries(ui.k)) k.set(L.p[id]); paintRows(); }
    function draw() { if (dead || !root) return; const now = performance.now();
      rowEls.forEach((row, i) => (row._led || (row._led = row.querySelector('.led'))).classList.toggle('hit', flash[i] > now - 90 && flash[i] <= now + 5));
      stepEls.forEach((arr, i) => arr.forEach((b, j) => b.classList.toggle('cur', j === cur[i])));
      if (cv) { if (!cv._ro) { cv._cw = cv.clientWidth; try { const c = cv; cv._ro = new ResizeObserver(() => { c._cw = c.clientWidth; }); cv._ro.observe(cv); } catch { } } const dpr = clamp(globalThis.devicePixelRatio || 1, 1, 3), w = Math.max(200, cv._cw || 300), h = 70; if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        const g = cv.getContext('2d'); if (g) { g.setTransform(dpr, 0, 0, dpr, 0, 0); if (!accCol || now - accT > 1000) { accCol = getComputedStyle(cv).getPropertyValue('--k-acc').trim() || '#ff9d5c'; accT = now; } g.clearRect(0, 0, w, h); const a = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(a);
          g.strokeStyle = accCol; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < a.length; i++) { const x = i / (a.length - 1) * w, y = h / 2 - clamp(a[i], -1, 1) * h * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } }
      }
    function unmount() { if (raf) raf(); raf = null; if (cv?._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; stepEls.length = 0; rowEls.length = 0; }
    function bundleChanged() { try { if (host && typeof host.bundleChanged === 'function') host.bundleChanged(self, 'multi'); } catch {} }
    const laneOf = e => { if (typeof e.lane === 'string') { const m = e.lane.match(/(\d+)$/); if (m) return +m[1] - 1; } if (Number.isFinite(e.lane)) return e.lane | 0; if (Number.isFinite(e.note)) { const n = Math.round(e.note); if (n >= 36 && n < 44) return n - 36; if (n >= 60 && n < 68) return n - 60; } return -1; };

    const self = {
      inputs: {}, outputs: { out },
      bundles: { multi: () => ({ label: T.bundle, channels: state.lanes.map((L, i) => ({ id: 'ch' + (i + 1), name: `${i + 1} ${L.name}`, node: laneOut[i] })) }) },
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; const sd = finite(info.stepDur, 0.125, 0.01, 2); stepDur = sd; const t = finite(info.time, ctx.currentTime, 0, 1e9);
          const abs = Number.isFinite(info.bar) ? info.bar * 16 + (info.step | 0) : (absStep + 1); absStep = abs;
          for (let i = 0; i < NL; i++) { const L = state.lanes[i], idx = ((abs % L.len) + L.len) % L.len; cur[i] = state.run ? idx : -1; if (!state.run || !audible(i)) continue;
            const S = L.pats[state.pattern][idx]; if (!S.v || Math.random() >= S.p) continue; for (let k = 0; k < S.r; k++) hit(i, t + k * sd / S.r, S.v * (k ? 0.8 : 1), S.t); }
           } catch {} },
      onTransport(info) { try { if (!info?.playing) { absStep = -1; cur.fill(-1); } } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'trigger' || !e) return; const time = Math.max(ctx.currentTime, finite(e.time, ctx.currentTime, 0, 1e9)), type = String(e.type || '').toLowerCase().replace(/[_-]/g, '');
          if (type === 'panic' || type === 'allnotesoff') { if (node) node.port.postMessage({ type: 'panic' }); return; }
          if (type === 'cc' && typeof e.id === 'string') { const m = e.id.match(/^l([1-8])\.(\w+)$/); if (m && PS[m[2]] && Number.isFinite(e.value)) { const s = PS[m[2]]; state.lanes[+m[1] - 1].p[m[2]] = s.min + clamp(e.value, 0, 1) * (s.max - s.min); markEigen(); if (+m[1] - 1 === state.sel) paint(); } return; }
          if (!['trig', 'note', 'noteon'].includes(type) || e.vel === 0) return; const i = laneOf(e); if (i < 0 || i >= NL || !audible(i)) return; hit(i, time, finite(e.vel, 0.8, 0, 1)); } catch {} },
      params() { const list = []; state.lanes.forEach((L, i) => { for (const [id, s] of Object.entries(PS)) list.push({ id: 'l' + (i + 1) + '.' + id, name: s.name, lane: 'l' + (i + 1), laneName: `${i + 1} ${L.name}`, min: s.min, max: s.max, scale: s.scale || 'lin', role: id === 'level' ? 'level' : id === 'pan' ? 'pan' : id === 'pitch' ? 'pitch' : 'color', drift: 0.02, on: !['level', 'pan', 'pitch', 'vari'].includes(id) }); }); return list; },
      modulate(o) { try { if (dead) return; mod = {}; if (o && typeof o === 'object' && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) if (/^l[1-8]\.\w+$/.test(k) && typeof v === 'number' && Number.isFinite(v)) mod[k] = clamp(v, -1, 1); } catch {} },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(raw) { if (dead) return; state = normalize(raw); applyMaster(); listenTo(state.sel); paint(); bundleChanged(); },
      destroy() { if (dead) return; dead = true; unmount(); try { if (node) node.port.postMessage({ type: 'panic' }); } catch {} for (const n of nodes) try { n.disconnect(); } catch {} nodes.clear(); },
    };
    return self;
  },
};
