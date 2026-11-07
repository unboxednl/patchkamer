// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.16.0 — Patchkamer contract v1.17: klembord voor patronen. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, kind `drums`, tijd in tikken van 12 per zestiende). Het huidige patroon (A tot D) gaat mee met één baan per kanaal (`chN`, `type`, scheme `gm`); polymeter staat in `lanes[].length` (de clip is zo lang als de langste baan), microtiming in `t` (±0,4 stap). Kans en ratchet gaan mee. Every, phase, fill en locks zijn niet te vertalen en gaan alleen via `native` mee naar een ander exemplaar van dit apparaat; elk ander apparaat negeert ze. Plakken zet de stappen van het actieve patroon binnen de lengte van elke baan; de banenlengtes (seqLength), klank, kit, swing en andere patronen blijven. Gastinstrumenten zonder kanaal worden niet gevuld. getState, presets en geluid zijn gelijk aan 1.15.0.
// 1.15.0 — Regelaars en stappen herkenbaar voor skins (contract v1.22, additief): elke stapknop krijgt via host.ui.adopt rol step, groep chN en als id chN.step.K (K = stapnummer) en dus een unieke sleutel, zodat een skin vorm, maat, kleur en ledje van de stappen kiest; de klassen step, quarter, on en now blijven van het apparaat
//          (paintStep zet ze nu met classList in plaats van className, zodat klassen van de host blijven staan). Alle schuiven krijgen als id de params()-sleutel (master, rumble, ch1.decay, ...) of een vaste naam voor de bewerkregelaars (step.velocity, step.micro, edit.velocity, ...), rol param en een groep; de bewerkregelaars staan bewust in modExclude (geen stuurbare parameters, zoals al in 1.14.3).
//          Een oudere host heeft geen adopt: het apparaat blijft dan zoals het was. Geluid, getState(), presets en tunes ongewijzigd; uiterlijk zonder skin gelijk.
// 1.14.3 — Ontbrekende continue regelaars bestuurbaar via params()/modulate(): Humanize (human), Patroonswing A tot D (patternSwing.0 tot .3) en de swing per kanaal (chN.swing); alle standaard uit (drift 0,05, role swing of humanize).
//          Modulatie komt alleen bovenop de knop (knop + o × bereik, geclampt; swing als som begrensd tot 50%) en is nooit state; getState, presets en tunes gelijk. Zonder modulatie gelijk aan 1.14.2. Niet beluisterd.
//          Bewust weggelaten: lengte per kanaal, pagina, patroon, kit/klankmodel (keuzes), de stapdata (velocity, kans, ratchet, microtiming, conditie per stap) en de bewerk-standaarden (editVelocity, editProbability), filter-aan/mix-vinkjes.
// 1.14.2 — Swing op patroon- en kanaalniveau (patternSwing per patroon A–D, swing per kanaal; 0 … 0,5 van een zestiende, naast de hostswing; de som is begrensd op 0,5) en live inspelen: knop Opname + Kwantiseer schrijft binnenkomende noten en trigs als stap in het actieve patroon op het juiste kanaal, op het dichtstbijzijnde geswingde rasterpunt (kwantiseren uit: stap plus micro-timing). Een gastinstrument (zonder kanaal) klinkt maar wordt niet opgenomen. Met swing 0 en opname uit is het gedrag gelijk aan 1.14.1.
// 1.14.1 — noteNames() geeft ook alle instrumenten uit de instrumentkeuze door die (nog) geen kanaal hebben, met hun standaardnoot; zo'n instrument klinkt als gast op een vrij kanaal (kanaal 12…16), zodat een sequencer de hele lijst kan bespelen. Fabrieksinstellingen en tunes blijven gelijk.
// 1.14.0 — Patchkamer contract v1.14. Geeft de klanknamen met hun noot door (noteNames, contract v1.14), zodat een sequencer zijn rijen kan benoemen; de volgorde, kit en noten volgen de kanalen.
// 1.11.4 — De rumble is minder aanwezig: de fabrieksstand heeft een cutoff van 210 Hz (voorheen 700 Hz) en 20% minder rumble (0,14 in plaats van 0,18; de Techno DNA-kits 0,13, Deep dub 0,2 en Industrial 0,26). Alleen de beginwaarden veranderen; opgeslagen tunes en songs houden hun eigen waarden en het geluid van de rest is ongewijzigd.
// 1.11.3 — De bassdrum klinkt langer door: de body van de kick werd door twee opeenvolgende afbouwen (in de toon en in de envelope) al na ongeveer 60 ms zwak. De toon loopt nu door tot het eind van de envelope en de envelope houdt het niveau even vast (een vijfde van de decay). Andere instrumenten ongewijzigd.
// 1.11.2 — Plafond achter de stereomix: tot 0,8 (−2 dBFS) ongewijzigd, daarboven zacht naar 1,0 in plaats van boven 0 dBFS te komen. Geen vertraging. De uitgangen per kanaal blijven ongewijzigd.
// 1.11.1 — Verbeterd: een nieuw of fabrieks-bassdrumkanaal begint met een lage tuning per klankmodel (voorheen 0, waardoor de kick te hoog klonk). Tunes en bewaarde instellingen houden hun eigen tuning; de motor is ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Pulse Drums en nieuwe id nl.patchkamer.pulsedrums (voorheen Puls Drums, nl.patchkamer.puls-drums); tunes en songs uit die tijd
//          verwijzen naar de oude id. Tweetalig (host.lang; namen van het apparaat en de poorten per taal in i18n; alle teksten in TXT). De twee eerste klankmodellen
//          heten nu Deep en Punch (voorheen met een getal als naam) en de tekst met herkomst is weg. Tekenen via host.frame (de eigen tekenpoort-omzetting is weg).
//          Het geluid is ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen. Tekenlussen alleen op volle snelheid als de kaart te zien is.
// 1.7.4 — Bundel-uitgang "Losse uit" (Separate outs): alle actieve kanalen in één groene kabel, met instrumentnaam per kanaal (zelfde signaal als ch1…ch16).
//         Presets laten de eigen kitlijst, het gekozen kanaal, de pagina, de bewerkte stap en de stap-editwaarden staan; setState bouwt de UI opnieuw op.
// Pulse Drums: een techno-drumworkstation, een zelfstandige uitbreiding van Drum Kit met FM-instrumenten, lagen voor de kick (body, sub, click), een rumble-bus met
// eigen uitgang, grit, per kanaal een eigen patroonlengte (polymetrie, euclidische ritmes), per stap micro-timing, cyclusvoorwaarden, fill-voorwaarden en p-locks.
// Alle geluid wordt lokaal gesynthetiseerd; er zijn geen samples. Modulatie is tijdelijk, vervangt eerdere offsets en verandert de bewaarde waarden nooit.
// Vaste poorten ch1…ch16: het aantal kanalen of een klankwijziging laat de kabels staan. MIDI: General MIDI-percussie per kanaal; trig lane: chN of de naam van het instrument.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: {
    tag: 'KICK / FM / POLYMETER / RUMBLE', dnaNote: 'Techno DNA vervangt kit en patterns.', factory: 'FABRIEKSKIT', custom: 'Eigen', channels: 'KANALEN', seqOn: 'Sequencer aan', seqOff: 'Sequencer uit',
    gridRange: 'GRID BEREIK', steps: 'stappen', page: 'PAGINA', copy: 'Kopieer', paste: 'Plak', clear: 'Wis pattern', chRuler: 'KANAAL / MUTE / SOLO',
    editVel: 'STAP VELOCITY', editProb: 'STAP KANS', hint: 'Klik: aan/uit · Shift-klik / rechtsklik: stapwaarden toepassen',
    chCap: (n, name) => `KANAAL ${n} · ${name}`, audition: '▶ Auditie', laneLen: 'KANAALLENGTE', rotate: 'Roteer +1', euclid: 'EUCLID SLAGEN', euclidGen: 'Genereer Euclid',
    rec: 'Opname', recHint: 'Opname schrijft binnenkomende noten en trigs in het actieve patroon, alleen als de klok loopt.', quant: 'Kwantiseer', patSwing: 'PATROON SWING', chSwing: 'KANAAL SWING', soundModel: 'KLANKMODEL', choke: 'CHOKE GROEP', none: 'Geen', hats: 'hats',
    body: 'BODY / HELDERHEID', metallic: 'METAALKLANK', toneAttack: 'TOON / AANSLAG', wires: 'SNARETAPIJT', beater: 'BEATER / KLIK', noiseTex: 'RUIS / TEXTUUR',
    res: 'RESONANTIE / Q', level: 'NIVEAU', center: 'Midden', inMix: 'In stereomix',
    editStep: 'BEWERK STAP', ofStep: '% stap', everyN: 'ELKE N CYCLI', cycle: 'CYCLUS', fillCond: 'FILL CONDITIE', always: 'Altijd', onlyFill: 'Alleen Fill', noFill: 'Zonder Fill', chance: 'KANS', clearLocks: 'Wis locks op deze stap',
    stepLabNote: 'Bewerk een stap via deze selector. Locks zijn tijdelijke waarden voor één slag; een modulator blijft de basis moduleren. Cutoff/Q volgen de kanaalbus en kunnen nog klinkende slagen op dat kanaal kleuren. Drive-locks werken alleen op de nieuw getriggerde stem.',
    scopeCap: 'MIX OSCILLOSCOOP · KANAALMETERS', hostStart: 'Host transport start de sequencer.', play: (b, s) => `PLAY · maat ${b} · stap ${s}`,
    kitPresets: 'EIGEN KITPRESETS', kitName: 'Naam van je kit', presetName: 'Presetnaam', save: 'Bewaar', savedKits: 'OPGESLAGEN KITS', loadKit: 'Laad kit', del: 'Verwijder',
    presetNote: 'Kitpresets bewaren klanken en kanaalinstellingen. Patterns A–D blijven bij het laden behouden. Alles wordt met de Patchkamer-opstelling opgeslagen.',
    patchbay: 'PATCHBAY · STABIELE UITGANGEN', jackMix: 'STEREO MIX', empty: 'leeg', jackMulti: 'LOSSE UIT · BUNDEL',
    modNone: 'Mod · geen actieve offsets', modActive: n => 'MOD · ' + n + ' actieve parameters',
    modNote: 'Verbind de paarse sturingsuitgang van een modulator met MOD. De modulator toont de beschikbare parameters per drumkanaal. Knoppen en presets bewaren de basiswaarden; modulatie wordt er tijdelijk bij opgeteld. Filter, resonantie, drive, pan en volume bewegen direct. Tuning, decay, attack en klanktextuur gelden vanaf de volgende drumslag.',
    bundleNote: 'Losse uit (bundel) geeft alle actieve kanalen in één groene kabel, met instrumentnaam: trek hem naar “bundel in” van de mixer of naar de multitrack. Mix en kanaaluitgangen zijn tegelijk actief. Zet “In stereomix” uit als je een kanaal extern mixt. Uitgangen volgen kanaalnummer; ongebruikte uitgangen zijn stil. MIDI volgt de notennummers per kanaal; trig lane = ch1…ch16 of instrumentnaam (kick, snare, …).',
    modelNote: 'De klankmodellen zijn originele synthese, geen samples. Tempo en swing komen van de Patchkamer-klok.',
    stepTitle: (k, v, p, r) => `Stap ${k}: velocity ${v}%, kans ${p}%, ${r}×`, multi: 'Losse uit', pGlobal: 'Globaal / performance',
    pn: { tone: 'Toon / helderheid', noise: 'Ruis / textuur', resonance: 'Resonantie / Q', sweep: 'Pitch envelope', level: 'Niveau' } },
  en: {
    tag: 'KICK / FM / POLYMETER / RUMBLE', dnaNote: 'Techno DNA replaces the kit and the patterns.', factory: 'FACTORY KIT', custom: 'Custom', channels: 'CHANNELS', seqOn: 'Sequencer on', seqOff: 'Sequencer off',
    gridRange: 'GRID RANGE', steps: 'steps', page: 'PAGE', copy: 'Copy', paste: 'Paste', clear: 'Clear pattern', chRuler: 'CHANNEL / MUTE / SOLO',
    editVel: 'STEP VELOCITY', editProb: 'STEP PROBABILITY', hint: 'Click: on/off · Shift-click / right-click: apply step values',
    chCap: (n, name) => `CHANNEL ${n} · ${name}`, audition: '▶ Audition', laneLen: 'CHANNEL LENGTH', rotate: 'Rotate +1', euclid: 'EUCLID HITS', euclidGen: 'Generate Euclid',
    rec: 'Record', recHint: 'Record writes incoming notes and trigs into the active pattern, only while the clock runs.', quant: 'Quantize', patSwing: 'PATTERN SWING', chSwing: 'CHANNEL SWING', soundModel: 'SOUND MODEL', choke: 'CHOKE GROUP', none: 'None', hats: 'hats',
    body: 'BODY / BRIGHTNESS', metallic: 'METALLIC TONE', toneAttack: 'TONE / ATTACK', wires: 'SNARE WIRES', beater: 'BEATER / CLICK', noiseTex: 'NOISE / TEXTURE',
    res: 'RESONANCE / Q', level: 'LEVEL', center: 'Center', inMix: 'In stereo mix',
    editStep: 'EDIT STEP', ofStep: '% of step', everyN: 'EVERY N CYCLES', cycle: 'CYCLE', fillCond: 'FILL CONDITION', always: 'Always', onlyFill: 'Fill only', noFill: 'Without fill', chance: 'PROBABILITY', clearLocks: 'Clear locks on this step',
    stepLabNote: 'Edit a step with this selector. Locks are temporary values for one hit; a modulator keeps modulating the base. Cutoff/Q follow the channel bus and can colour hits that are still sounding on that channel. Drive locks only work on the newly triggered voice.',
    scopeCap: 'MIX SCOPE · CHANNEL METERS', hostStart: 'The host transport starts the sequencer.', play: (b, s) => `PLAY · bar ${b} · step ${s}`,
    kitPresets: 'YOUR KIT PRESETS', kitName: 'Name of your kit', presetName: 'Preset name', save: 'Save', savedKits: 'SAVED KITS', loadKit: 'Load kit', del: 'Delete',
    presetNote: 'Kit presets store sounds and channel settings. Patterns A–D are kept when you load one. Everything is saved with your Patchkamer workspace.',
    patchbay: 'PATCHBAY · STABLE OUTPUTS', jackMix: 'STEREO MIX', empty: 'empty', jackMulti: 'SEPARATE OUTS · BUNDLE',
    modNone: 'Mod · no active offsets', modActive: n => 'MOD · ' + n + ' active parameters',
    modNote: 'Connect the purple control output of a modulator to MOD. The modulator shows the available parameters per drum channel. Knobs and presets keep the base values; modulation is added on top temporarily. Filter, resonance, drive, pan and level move immediately. Tuning, decay, attack and sound texture apply from the next hit.',
    bundleNote: 'Separate outs (bundle) gives all active channels on one green cable, with the instrument name: drag it to “bundle in” of the mixer or to the multitrack. The mix and the channel outputs are active at the same time. Turn off “In stereo mix” if you mix a channel externally. Outputs follow the channel number; unused outputs are silent. MIDI follows the note numbers per channel; trig lane = ch1…ch16 or instrument name (kick, snare, …).',
    modelNote: 'The sound models are original synthesis, not samples. Tempo and swing come from the Patchkamer clock.',
    stepTitle: (k, v, p, r) => `Step ${k}: velocity ${v}%, probability ${p}%, ${r}×`, multi: 'Separate outs', pGlobal: 'Global / performance',
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
 metal:['Industrial metal','metal',80,270,.7,.9,.4],sub:['Sub drop','kick',35,38,1.5,.55,.02],fmperc:['FM percussion','fm',81,260,.23,.6,.1],fmmetal:['FM metal','fm',82,430,.42,.85,.06],fmhat:['FM hat','fm',83,1900,.07,.8,.3]
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
const cell=()=>({v:0,p:1,r:1,micro:0,every:1,phase:1,fill:0,locks:{}});
const KICK_TUNE={Punch:-22,Deep:-20,Industrial:-14,Rock:-17,Pop:-22,Jazz:-18,Funk:-23,'Lo-fi':-17};  // een bassdrum begint hoog; deze standaard tuning geeft per klankmodel een echte bassdrum
function lane(type='kick',model='Deep',i=0){const t=TYPES[type],m=MODEL[model];return {type,model,seqLength:16,swing:0,fm:1.5,ratio:2.7,body:.85,sub:.18,click:.2,note:t[2],tune:type==='kick'?(KICK_TUNE[model]??-20):0,decay:t[4]*m.decay,tone:t[5],noise:Math.min(1,t[6]*m.noise),sweep:type==='kick'?.65:.25,attack:.001,cutoff:model==='Lo-fi'?4600:18000,resonance:.7,filter:'lowpass',drive:model==='Industrial'?.55:model==='Lo-fi'?.22:0,level:.7,pan:0,mute:false,solo:false,mix:true,choke:type==='closedhat'||type==='openhat'?1:0,steps:Array.from({length:4},()=>Array.from({length:64},cell))};}
function makeState(kit='Punch'){return {rumble:.14,rumbleTone:210,grit:0,fill:false,patternSwing:[0,0,0,0],record:false,quantize:true,stepEdit:0,kit,channels:KIT[kit].map((t,i)=>lane(t,kit,i)),length:16,pattern:0,bank:0,selected:0,run:true,master:.72,human:0,presets:[],editVelocity:.8,editProbability:1,editRatchet:1};}
function groove(s,style){s.channels.forEach(c=>c.steps[s.pattern]=Array.from({length:64},cell));const put=(type,steps,v=.8)=>{const c=s.channels.find(c=>c.type===type);if(c)steps.forEach((n,i)=>c.steps[s.pattern][n]={...cell(),v:i%2?v*.85:v});};
 if(style==='Jazz'){put('kick',[0,10],.5);put('brush',[4,12],.65);put('ride',[0,4,7,8,12,15],.65);put('closedhat',[4,12],.55);}
 else{put('kick',style==='Rock'?[0,6,8,10]:style==='Funk'?[0,3,6,10]:style==='Lo-fi'?[0,7,10]:[0,4,8,12],.92);put('snare',[4,12],.83);put('clap',[4,12],.48);put('closedhat',style==='Rock'?[0,2,4,6,8,10,12,14]:[0,2,4,6,8,10,12,14],.63);put('openhat',[6,14],.45);put('shaker',[1,3,5,7,9,11,13,15],.4);put('ride',style==='Rock'?[0,4,8,12]:[],.4);}
}
function cleanLocks(x){const out={};if(x&&typeof x==='object')for(const [key,def] of Object.entries(MOD_DEFS))if(typeof x[key]==='number'&&Number.isFinite(x[key]))out[key]=clamp(x[key],def.min,def.max);return out;}
function techno(name='Hypnotic'){
 const s=makeState('Punch');s.kit=name;s.channels=['kick','snare','clap','closedhat','openhat','fmperc','conga','rim','fmmetal','ride','fmhat','shaker'].map((t,i)=>lane(t,'Punch',i));s.rumble=name==='Industrial'?.26:name==='Deep dub'?.2:.13;s.grit=name==='Industrial'?.35:0;
 s.channels[0].decay=name==='Hardgroove'?.22:.4;s.channels[0].sub=.16;s.channels[0].click=.35;s.channels[0].drive=.12;s.channels[8].level=.35;s.channels[10].level=.3;
 for(let p=0;p<4;p++){s.pattern=p;groove(s,'Punch');const put=(i,steps,v)=>steps.forEach((j,k)=>s.channels[i].steps[p][j]={...cell(),v:k%2?v*.8:v});if(name==='Broken')s.channels[0].steps[p]=Array.from({length:64},cell),put(0,[0,3,7,10,14],.9);
 put(5,[1,6,11,14],.5);put(6,name==='Hardgroove'?[0,3,5,7,10,12,15]:[3,10],.5);put(11,[1,3,5,7,9,11,13,15],.35);if(name==='Hypnotic'){s.channels[5].seqLength=15;s.channels[8].seqLength=11;put(8,[0,4,7],.3);}if(name==='Industrial')put(8,[2,7,10,15],.48);if(p===1)put(10,[3,7,11,15],.35);if(p===2){s.channels[4].mute=false;put(9,[0,4,8,12],.4);}if(p===3)put(1,[11,13,14,15],.65);
 const z=s.channels[5].steps[p][6];z.locks={fm:p+1,decay:.13+p*.04};z.every=2;z.phase=2;
 if(name==='Deep dub'){s.channels[5].cutoff=1600;s.channels[8].cutoff=2000;s.channels[0].decay=.5;s.channels[7].steps[p][14]={...cell(),v:.4,p:.5};}}
 s.pattern=0;s.length=64;return s;
}
const PORTS={audioIn:[],audioOut:[{id:'mix',name:'Stereo mix'},{id:'rumble',name:'Rumble'},...Array.from({length:16},(_,i)=>({id:'ch'+(i+1),name:'Drum '+(i+1)}))],eventIn:[{id:'trigger',name:'MIDI / trigs'}],eventOut:[{id:'trigs',name:'Drum trigs'}],modIn:[{id:'mod',name:'Mod'}],modOut:[],multiOut:[{id:'multi',name:'Losse uit (bundel)'}]};
// contract v1.6: werkstand, geen klank — een preset laat dit staan
const PRESET_SKIP=['record','quantize','presets','selected','bank','stepEdit','editVelocity','editProbability','editRatchet'];
// Stable channel-based parameter ids match audio outputs and existing CC names.
// Frequency/time controls use multiplicative log offsets; tuning is semitones (linear).
const GLOBAL_DEFS={master:{name:'Master',min:0,max:1,scale:'lin',role:'level',drift:.005,on:false},rumble:{name:'Rumble amount',min:0,max:1,scale:'lin',role:'level',drift:.01,on:false},rumbleTone:{name:'Rumble cutoff',min:80,max:2500,scale:'log',role:'filter',drift:.01,on:false},grit:{name:'Global grit',min:0,max:1,scale:'lin',role:'drive',drift:.01,on:false}};
const MOD_DEFS={
 fm:{name:'FM depth',min:0,max:8,scale:'lin',role:'timbre',drift:.01,on:false},
 ratio:{name:'FM ratio',min:.25,max:12,scale:'log',role:'timbre',drift:.005,on:false},
 body:{name:'Kick body',min:0,max:1,scale:'lin',role:'level',drift:.01,on:false},
 sub:{name:'Kick sub',min:0,max:1,scale:'lin',role:'sub',drift:.01,on:false},
 click:{name:'Kick click',min:0,max:1,scale:'lin',role:'timbre',drift:.01,on:false},
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
.sw{--bg:var(--card,#14191c);--panel:var(--card-2,#1e2529);--edge:var(--line,#364148);--ink:var(--fg,#e8e9df);--dim:var(--muted,#9aa9ad);--accent:#e68e71;--btn:color-mix(in srgb,var(--card-2,#1e2529) 86%,var(--fg,#e8e9df));--stepbg:var(--step-q,#273036);--screen:var(--well,#101618);color:var(--ink);background:var(--bg);padding:20px;border-radius:10px;font:13px 'IBM Plex Mono',monospace;container-type:inline-size}.sw *{box-sizing:border-box}.sw h1{font:700 32px 'Barlow Condensed',sans-serif;letter-spacing:4px;margin:0}.sw .top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.sw .brand small{color:var(--accent);letter-spacing:2px}.sw .tag{color:var(--dim);font-size:11px}.sw button,.sw select,.sw input{font:inherit;color:inherit}.sw button,.sw select,.sw input[type=text],.sw input[type=number]{background:var(--btn);border:1px solid var(--edge);border-radius:5px;padding:7px;min-height:32px}.sw button{cursor:pointer}.sw button:hover{border-color:var(--accent)}.sw button.active{background:var(--accent);color:#14191c;border-color:var(--accent)}.sw button:focus-visible,.sw input:focus-visible,.sw select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.sw .toolbar{display:flex;gap:9px;align-items:end;flex-wrap:wrap;margin:16px 0}.sw label{display:flex;flex-direction:column;gap:5px;font-size:10px;color:var(--dim);letter-spacing:.5px}.sw .row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.sw .section{border:1px solid var(--edge);background:var(--panel);border-radius:7px;padding:13px;margin:12px 0}.sw .caption{font-size:10px;letter-spacing:2px;color:var(--dim);margin-bottom:10px}.sw .table{overflow-x:auto}.sw .track{display:grid;grid-template-columns:190px repeat(16,minmax(25px,1fr));gap:5px;min-width:740px;margin:5px 0;align-items:center}.sw .lane{display:flex;align-items:center;gap:4px;min-width:0}.sw .lane .choose{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.sw .mini{padding:4px;min-width:25px;font-size:10px}.sw .step{height:34px;padding:0;border-radius:4px;background:var(--stepbg);position:relative}.sw .step.quarter{border-left:2px solid var(--dim)}.sw .step.on{background:linear-gradient(0deg,#b76d2e,var(--accent));color:#14191c}.sw .step .velocity{position:absolute;bottom:2px;left:3px;right:3px;background:color-mix(in srgb,var(--bg) 55%,transparent);height:3px;transform-origin:left}.sw .step.now{outline:2px solid var(--ink);outline-offset:1px}.sw .ruler{font-size:10px;text-align:center;color:var(--dim)}.sw .selected .choose{border-color:var(--accent);color:var(--accent)}.sw .editor{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:15px}.sw input[type=range]{width:100%;accent-color:var(--accent);margin:4px 0}.sw output{color:var(--ink);font-size:12px}.sw .scope{width:100%;height:92px;background:var(--screen);border-radius:5px}.sw .bottom{display:grid;grid-template-columns:2fr 1fr;gap:12px}.sw .ports{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sw .jackbox{border:1px solid var(--edge);border-radius:5px;padding:5px;font-size:10px;color:var(--dim)}.sw .notice{font-size:11px;line-height:1.7;color:var(--dim)}.sw .error{color:var(--stop,#ff9386)}.sw .check{flex-direction:row;align-items:center}.sw .stats{color:var(--accent);font-size:11px}.sw .hr{border-top:1px solid var(--edge);margin:13px 0}@container(max-width:700px){.sw .bottom{grid-template-columns:1fr}.sw h1{font-size:26px}.sw .editor{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}}`;
// Uitgangsniveau: een vaste factor op de stereomix en op de kanaaluitgangen. Gemeten met de standaardgroove (10 s, 120 BPM): met .36 lag de piek op −16 dBFS,
// ruim 13 dB onder andere apparaten; met deze waarde op ongeveer −3 dBFS. De verhouding tussen de kanalen verandert niet.
const OUT_TRIM=.36*4.5;
const CEIL_T=.8,CEIL_CURVE=(()=>{const n=4097,c=new Float32Array(n);for(let i=0;i<n;i++){const x=(i/(n-1)*2-1)*2,a=Math.abs(x),y=a<=CEIL_T?a:CEIL_T+(1-CEIL_T)*Math.tanh((a-CEIL_T)/(1-CEIL_T));c[i]=Math.sign(x)*y/2;}return c;})();  // plafond: onder 0,8 ongewijzigd, daarboven zacht naar 1,0 (geen harde clip)
const __pkDef = {
 id:'nl.patchkamer.pulsedrums',name:'Pulse Drums',version:'1.16.0',kind:'instrument',modExclude:['edit.velocity','edit.probability','step.velocity','step.micro'],category:'groove',ui:{width:1180,minWidth:480,jacks:true},ports:PORTS,
 i18n:{en:{ports:{multi:'Separate outs (bundle)'}}},
 create(ctx,host){
 const T=TXT[host&&host.lang]||TXT.en;
 let state=techno('Hypnotic'),self,root,el,stopDraw=null,dead=false,playing=false,lastStep=-1,lastTime=0,error='',clipboard=null;
 
 let mod=Object.create(null),paramList=[],paramIds=new Set(),paramSignature='',modStatus=null;
 const owned=new Set(),sources=new Set(),voices=new Set(),buses=[],meters=[];
 const own=n=>(owned.add(n),n),gain=()=>own(ctx.createGain());
 const mix=gain();mix.gain.value=state.master*OUT_TRIM;
 const mixMeter=own(ctx.createAnalyser());mixMeter.fftSize=512;mix.connect(mixMeter);
 const ceilPre=gain(),ceilShaper=own(ctx.createWaveShaper()),ceilPost=gain();ceilPre.gain.value=.5;ceilPost.gain.value=2;ceilShaper.curve=CEIL_CURVE;ceilShaper.oversample='none';mix.connect(ceilPre).connect(ceilShaper).connect(ceilPost);
 const outputs={mix:ceilPost};
 const rumbleIn=gain(),room=own(ctx.createConvolver()),rumbleHP=own(ctx.createBiquadFilter()),rumbleLP=own(ctx.createBiquadFilter()),rumbleDrive=own(ctx.createWaveShaper()),duck=gain(),rumbleReturn=gain(),rumbleOut=gain();
 rumbleHP.type='highpass';rumbleHP.frequency.value=35;rumbleLP.type='lowpass';rumbleLP.Q.value=.7;duck.gain.value=1;rumbleOut.gain.value=OUT_TRIM;
 rumbleIn.connect(room).connect(rumbleHP).connect(rumbleLP).connect(rumbleDrive).connect(duck).connect(rumbleReturn);rumbleReturn.connect(mix);rumbleReturn.connect(rumbleOut);outputs.rumble=rumbleOut;
 const ir=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*2.8),ctx.sampleRate);let irSeed=97531;
 for(let ch=0;ch<2;ch++){const data=ir.getChannelData(ch);let smooth=0;for(let j=0;j<data.length;j++){irSeed=(Math.imul(irSeed,1664525)+1013904223)>>>0;smooth=smooth*.7+(irSeed/2147483648-1)*.3;data[j]=smooth*Math.exp(-j/(ctx.sampleRate*.7));}}room.buffer=ir;

 const noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*2),ctx.sampleRate),nd=noiseBuffer.getChannelData(0);let seed=74133;
 for(let i=0;i<nd.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;nd[i]=seed/2147483648-1;}
 const curves=Array.from({length:41},(_,j)=>{const a=new Float32Array(1024),k=j/40*12;for(let i=0;i<a.length;i++){const x=i/(a.length-1)*2-1;a[i]=k?Math.tanh(x*(1+k))/Math.tanh(1+k):x;}return a;});
 rumbleDrive.curve=curves[12];rumbleDrive.oversample='2x';
 for(let i=0;i<16;i++){
  const filter=own(ctx.createBiquadFilter()),shaper=own(ctx.createWaveShaper()),panner=own(ctx.createStereoPanner()),level=gain(),direct=gain(),send=gain(),meter=own(ctx.createAnalyser()),rumbleSend=gain();
  meter.fftSize=256;shaper.oversample='2x';filter.connect(shaper).connect(panner).connect(level);level.connect(direct);level.connect(send).connect(mix);level.connect(meter);level.connect(rumbleSend).connect(rumbleIn);direct.gain.value=OUT_TRIM;
  outputs['ch'+(i+1)]=direct;buses.push({filter,shaper,panner,level,direct,send,rumbleSend});meters.push(meter);
 }
 function refreshParams(notify=true){
  const signature=state.channels.map(c=>c.type+':'+c.model).join('|');
  if(signature===paramSignature)return;
  paramSignature=signature;
  paramList=Object.entries(GLOBAL_DEFS).map(([id,def])=>({id,...def,lane:'master',laneName:T.pGlobal}));
  paramList.push({id:'human',name:'Humanize',min:0,max:.025,scale:'lin',role:'humanize',drift:.05,on:false,lane:'master',laneName:T.pGlobal});
  for(let p=0;p<4;p++)paramList.push({id:'patternSwing.'+p,name:T.patSwing+' '+'ABCD'[p],lane:'swing',laneName:'Swing',min:0,max:.5,scale:'lin',role:'swing',drift:.05,on:false});
  state.channels.forEach((c,i)=>{const lane='ch'+(i+1),family=TYPES[c.type][1],laneName=String(i+1).padStart(2,'0')+' · '+TYPES[c.type][0]+' / '+c.model;
   for(const [key,def] of Object.entries(MOD_DEFS)){
    if(['fm','ratio'].includes(key)&&family!=='fm')continue;
    if(['body','sub','click'].includes(key)&&family!=='kick')continue;
    if(key==='sweep'&&!['kick','tom','zap','metal'].includes(family))continue;
    if(key==='noise'&&['bell','kick'].includes(family))continue;
    paramList.push({id:lane+'.'+key,...def,name:T.pn[key]||def.name,lane,laneName});
   }
   paramList.push({id:lane+'.swing',name:T.chSwing,lane,laneName,min:0,max:.5,scale:'lin',role:'swing',drift:.05,on:false});
  });
  paramIds=new Set(paramList.map(p=>p.id));
  for(const key of Object.keys(mod))if(!paramIds.has(key))delete mod[key];
  if(notify&&self&&typeof host.paramsChanged==='function')host.paramsChanged(self);
 }
 function value(base,key,id){const def=GLOBAL_DEFS[key]||MOD_DEFS[key],offset=mod[id]||0;if(!offset)return base;return clamp(def.scale==='log'?base*Math.pow(def.max/def.min,offset):base+offset*(def.max-def.min),def.min,def.max,base);}
 const swMod=(id,base,range)=>{const o=mod[id]||0;return o?clamp(base+o*range,0,range,base):base;};
 const chSwing=i=>swMod('ch'+(i+1)+'.swing',state.channels[i].swing,.5),patSwingOf=()=>swMod('patternSwing.'+state.pattern,state.patternSwing[state.pattern],.5),humanOf=()=>swMod('human',state.human,.025);
 function effective(i){const c=state.channels[i],out={...c};for(const key of Object.keys(MOD_DEFS))out[key]=value(c[key],key,'ch'+(i+1)+'.'+key);out.drive=Math.min(1,out.drive+value(state.grit,'grit','grit')*.6);return out;}
 function apply(){
  if(dead)return;notesNotify();const solo=state.channels.some(c=>c.solo);
  rumbleReturn.gain.setTargetAtTime(value(state.rumble,'rumble','rumble')*.9,ctx.currentTime,.03);rumbleLP.frequency.setTargetAtTime(value(state.rumbleTone,'rumbleTone','rumbleTone'),ctx.currentTime,.03);
  mix.gain.setTargetAtTime(value(state.master,'master','master')*OUT_TRIM,ctx.currentTime,.02);
  buses.forEach((b,i)=>{if(!state.channels[i]){b.level.gain.setTargetAtTime(0,ctx.currentTime,.01);b.rumbleSend.gain.setTargetAtTime(0,ctx.currentTime,.01);return;}const c=effective(i);
   b.rumbleSend.gain.setTargetAtTime(TYPES[c.type][1]==='kick'?1:0,ctx.currentTime,.02);b.filter.type=c.filter;b.filter.frequency.setTargetAtTime(Math.min(c.cutoff,ctx.sampleRate*.45),ctx.currentTime,.02);b.filter.Q.setTargetAtTime(c.resonance,ctx.currentTime,.02);
   const curveIndex=Math.round(c.drive*40);if(b.curveIndex!==curveIndex){b.shaper.curve=curves[curveIndex];b.curveIndex=curveIndex;}
   b.panner.pan.setTargetAtTime(c.pan,ctx.currentTime,.02);b.level.gain.setTargetAtTime(c.mute||(solo&&!c.solo)?0:c.level/(1+c.drive*.6),ctx.currentTime,.01);b.send.gain.setTargetAtTime(c.mix?1:0,ctx.currentTime,.01);
  });
 }

 const stopLoop=()=>{if(stopDraw){stopDraw();stopDraw=null;}};
 function fail(e){error='Audio: '+(e?.message||String(e));}
 function release(v,t){try{v.env.gain.cancelScheduledValues(t);v.env.gain.setTargetAtTime(.00001,t,.004);v.src.forEach(s=>{try{s.stop(t+.035);}catch{}});}catch{}}
 function stopAll(){voices.forEach(v=>release(v,ctx.currentTime));}
 function hit(i,time,velocity=1,emit=true,locks={},guest=null){
  if(dead||(!guest&&!state.channels[i]))return;const c=guest?{...guest}:{...effective(i)},solo=!guest&&state.channels.some(c=>c.solo);if(c.mute||(solo&&!c.solo)||velocity<=0)return;for(const [k,v] of Object.entries(locks)){if(MOD_DEFS[k]&&Number.isFinite(v))c[k]=clamp(v,MOD_DEFS[k].min,MOD_DEFS[k].max,c[k]);}
  const t=Math.max(ctx.currentTime,Number.isFinite(time)?time:ctx.currentTime),type=TYPES[c.type],family=type[1],model=MODEL[c.model],pitch=Math.pow(2,c.tune/12),f=type[3]*pitch*model.tone;
  // Step locks override the channel target for this hit, without writing the knob state.
  const b=buses[i];b.filter.frequency.setTargetAtTime(Math.min(c.cutoff,ctx.sampleRate*.45),t,.005);b.filter.Q.setTargetAtTime(c.resonance,t,.005);
  const d=Math.max(.02,c.decay),vel=clamp(velocity,0,1,1),env=gain();const spectral=own(ctx.createBiquadFilter());spectral.type=['hat','cymbal','tamb'].includes(family)?'highpass':'lowpass';spectral.frequency.value=['hat','cymbal','tamb'].includes(family)?1200+c.tone*6000:1500*Math.pow(12,c.tone);spectral.Q.value=.55;let voiceShape=null;if(Object.hasOwn(locks,'drive')){voiceShape=own(ctx.createWaveShaper());voiceShape.curve=curves[Math.round(c.drive*40)];voiceShape.oversample='2x';env.connect(voiceShape).connect(spectral);}else env.connect(spectral);spectral.connect(buses[i].filter);
  const v={env,src:[],nodes:new Set([env,spectral,...(voiceShape?[voiceShape]:[])]),i,choke:c.choke,t};voices.add(v);
  if(c.choke)voices.forEach(o=>{if(o!==v&&o.choke===c.choke&&o.t<=t)release(o,t);});
  while(voices.size>128){const old=voices.values().next().value;release(old,t);voices.delete(old);}
  let amp=(family==='kick'?.9:family==='snare'?.62:.45)*vel;
  const hold=family==='kick'?d*.22:0;env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(amp,t+c.attack);if(hold)env.gain.setValueAtTime(amp,t+c.attack+hold);env.gain.exponentialRampToValueAtTime(.00001,t+c.attack+hold+d*1.6);  // een bassdrum houdt zijn body even vast
  const track=n=>{own(n);v.nodes.add(n);return n;};
  const source=(s,end)=>{v.src.push(s);sources.add(s);s.onended=()=>{sources.delete(s);try{s.disconnect();}catch{}owned.delete(s);if(v.src.every(x=>!sources.has(x))){v.nodes.forEach(n=>{try{n.disconnect();}catch{}owned.delete(n);});voices.delete(v);}};s.start(t);s.stop(t+end);};
  const tone=(freq,level=.5,wave='sine',len=d,drop=0,delay=0)=>{const o=track(ctx.createOscillator()),g=track(ctx.createGain());o.type=wave;o.frequency.setValueAtTime(Math.min(freq*(1+drop),20000),t);o.frequency.exponentialRampToValueAtTime(Math.max(12,Math.min(freq,18000)),t+Math.min(len*.55,.25));g.gain.setValueAtTime(.00001,t);g.gain.setValueAtTime(Math.max(.00001,level),t+delay);g.gain.exponentialRampToValueAtTime(.00001,t+Math.max(delay+.01,len));o.connect(g).connect(env);source(o,Math.max(len,d*1.6+c.attack)+.04);};
  const noise=(level,cut,mode='highpass',len=d,delay=0)=>{const n=track(ctx.createBufferSource()),g=track(ctx.createGain()),b=track(ctx.createBiquadFilter());n.buffer=noiseBuffer;n.loop=true;b.type=mode;b.frequency.value=Math.min(cut,ctx.sampleRate*.45);b.Q.value=.7;g.gain.setValueAtTime(.00001,t);g.gain.setValueAtTime(Math.max(.00001,level),t+delay);g.gain.exponentialRampToValueAtTime(.00001,t+Math.max(delay+.01,len));n.connect(b).connect(g).connect(env);source(n,Math.max(len,d*1.6+c.attack)+.04);};
  const acoustic=['Rock','Pop','Jazz','Funk'].includes(c.model),bright=.25+c.tone*.75;
  if(family==='kick'){duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(.04,t);duck.gain.exponentialRampToValueAtTime(1,t+.26);tone(f,.95*c.body,c.model==='Punch'?'triangle':'sine',d*1.9, c.sweep*(c.model==='Punch'?7:4));tone(f*1.48,acoustic?.22:.03,'sine',d*.3,c.sweep);tone(f*.5,c.sub*.5,'sine',d*1.9,c.sweep*.5);noise(c.click*.6,1700+bright*5500,'highpass',.012+c.tone*.018);}
  else if(family==='fm'){
   const carrier=track(ctx.createOscillator()),modulator=track(ctx.createOscillator()),depth=track(ctx.createGain()),amp=track(ctx.createGain());carrier.type='sine';modulator.type='sine';carrier.frequency.value=f;modulator.frequency.value=Math.min(18000,f*c.ratio);depth.gain.setValueAtTime(f*c.fm,t);depth.gain.exponentialRampToValueAtTime(.0001,t+d);amp.gain.value=.7;modulator.connect(depth).connect(carrier.frequency);carrier.connect(amp).connect(env);source(modulator,d*1.6+c.attack+.04);source(carrier,d*1.6+c.attack+.04);noise(c.noise*.6,2000+bright*5000,'highpass',d*.5);
  }
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
 function cleanChannel(x,i){const ty=TYPES[x?.type]?x.type:'kick',mo=MODELS.includes(x?.model)?x.model:'Deep',c=lane(ty,mo,i);for(const [k,a,b] of [['seqLength',1,64],['swing',0,.5],['fm',0,8],['ratio',.25,12],['body',0,1],['sub',0,1],['click',0,1],['note',0,127],['tune',-24,24],['decay',.02,4],['tone',0,1],['noise',0,1],['sweep',0,1],['attack',.001,.15],['cutoff',30,20000],['resonance',.1,12],['drive',0,1],['level',0,1],['pan',-1,1],['choke',0,4]])c[k]=clamp(x?.[k],a,b,c[k]);c.seqLength=Math.round(c.seqLength);c.note=Math.round(c.note);c.choke=Math.round(c.choke);for(const k of ['mute','solo','mix'])if(typeof x?.[k]==='boolean')c[k]=x[k];c.filter=['lowpass','highpass','bandpass','notch'].includes(x?.filter)?x.filter:'lowpass';if(Array.isArray(x?.steps))c.steps=Array.from({length:4},(_,p)=>Array.from({length:64},(_,j)=>{const z=x.steps[p]?.[j];return {...cell(),v:clamp(z?.v,0,1,0),p:clamp(z?.p,0,1,1),r:Math.round(clamp(z?.r,1,4,1)),micro:clamp(z?.micro,-.4,.4,0),every:Math.round(clamp(z?.every,1,8,1)),phase:Math.round(clamp(z?.phase,1,8,1)),fill:Math.round(clamp(z?.fill,0,2,0)),locks:cleanLocks(z?.locks)};}));return c;}
 function restore(s){const d=techno();state={...d};state.kit=typeof s?.kit==='string'?s.kit.slice(0,40):d.kit;state.channels=Array.isArray(s?.channels)&&s.channels.length?s.channels.slice(0,16).map(cleanChannel):d.channels;
 for(const [k,a,b] of [['rumble',0,1],['rumbleTone',80,2500],['grit',0,1],['stepEdit',0,63],['length',1,64],['pattern',0,3],['bank',0,3],['selected',0,state.channels.length-1],['master',0,1],['human',0,.025],['editVelocity',.05,1],['editProbability',0,1],['editRatchet',1,4]])state[k]=clamp(s?.[k],a,b,d[k]);for(const k of ['length','pattern','bank','selected','editRatchet'])state[k]=Math.round(state[k]);state.stepEdit=Math.round(state.stepEdit);state.fill=typeof s?.fill==='boolean'?s.fill:false;state.patternSwing=Array.from({length:4},(_,p)=>clamp(Array.isArray(s?.patternSwing)?s.patternSwing[p]:undefined,0,.5,0));state.record=typeof s?.record==='boolean'?s.record:false;state.quantize=typeof s?.quantize==='boolean'?s.quantize:true;state.run=typeof s?.run==='boolean'?s.run:true;
 state.presets=Array.isArray(s?.presets)?s.presets.slice(0,24).filter(p=>p&&typeof p.name==='string'&&Array.isArray(p.channels)).map(p=>({name:p.name.slice(0,32),channels:p.channels.slice(0,16).map(cleanChannel)})):[];stopAll();apply();render();}
 function setCount(n){n=Math.round(clamp(n,1,16,11));stopAll();while(state.channels.length<n)state.channels.push(lane('kick','Deep'));state.channels.length=n;state.selected=Math.min(state.selected,n-1);state.kit='Custom';apply();render();}
 function changeSound(i,type,model){const old=state.channels[i],fresh=lane(type,model,i);['steps','level','pan','mute','solo','mix','swing'].forEach(k=>fresh[k]=old[k]);state.channels[i]=fresh;state.kit='Custom';releaseLane(i);apply();render();}
 function releaseLane(i){voices.forEach(v=>{if(v.i===i)release(v,ctx.currentTime);});}
 function loadKit(key){stopAll();const old=state.channels;state.channels=KIT[key].map((type,i)=>{const c=lane(type,key,i);if(old[i]){c.steps=copy(old[i].steps);c.swing=old[i].swing;}return c;});state.kit=key;state.selected=Math.min(state.selected,state.channels.length-1);apply();render();}
 function node(tag,parent,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;}
 function button(parent,text,fn,cls=''){const b=node('button',parent,text,cls);b.type='button';b.onclick=fn;return b;}
 function select(parent,label,options,value,fn){const l=node('label',parent,label),s=node('select',l);options.forEach(([v,n])=>{const o=node('option',s,n);o.value=String(v);});s.value=String(value);s.onchange=()=>fn(s.value);return s;}
 // contract v1.22: regelaars herkenbaar voor skins; een oudere host heeft geen adopt
 function adopt(e,o){try{if(e&&host&&host.ui&&typeof host.ui.adopt==='function')host.ui.adopt(e,o);}catch(x){/* oudere host */}return e;}
 function range(parent,label,value,min,max,step,fn,fmt=v=>v.toFixed(2),id,group){const l=node('label',parent,label),o=node('output',l,fmt(value)),r=node('input',l);r.type='range';r.min=min;r.max=max;r.step=step;r.value=value;r.oninput=()=>{o.textContent=fmt(+r.value);fn(+r.value);};if(id)adopt(r,{id,role:'param',group,label});return r;}
 function check(parent,label,value,fn){const l=node('label',parent,undefined,'check'),r=node('input',l);r.type='checkbox';r.checked=value;node('span',l,label);r.onchange=()=>fn(r.checked);}
 let stepButtons=[],cursorLabels=[],scope,status;
 let bundleSig='';
 // De lijst voor een sequencer: eerst de kanalen, daarna elk instrument uit de instrumentkeuze dat nog geen kanaal heeft (gast), met zijn standaardnoot of de eerstvolgende vrije.
 function fullList(){const seen=new Set(),o=[],types=new Set();state.channels.forEach(c=>{types.add(c.type);const n=Math.round(c.note);if(!(n>=0&&n<=127)||seen.has(n))return;seen.add(n);o.push({note:n,name:(TYPES[c.type]||[c.type])[0]});});
  for(const [k,t] of Object.entries(TYPES)){if(types.has(k)||o.length>=128)continue;let n=t[2];for(let g=0;g<128&&seen.has(n);g++)n=(n+1)%128;if(seen.has(n))continue;seen.add(n);o.push({note:n,name:t[0],type:k});}return o;}
 function noteList(){return fullList().map(x=>({note:x.note,name:x.name}));}
 const guestBusy=new Array(16).fill(0);
 // Live inspelen. ref = de laatst ontvangen klokstap (absolute stap, geswingde tijd, duur, hostswing); recSkip = stappen die al live zijn gespeeld en niet nog eens klinken.
 let ref=null;const recSkip=new Set();
 const oddStep=a=>((a%2)+2)%2===1;
 // Dichtstbijzijnde (geswingde) stap voor tijdstip t op kanaal c: een oneven zestiende ligt (hostswing + patroon- + kanaalswing) × stepDur later.
 function nearestStep(c,t){const sd=ref.stepDur,loc=Math.min(.5,patSwingOf()+chSwing(state.channels.indexOf(c))),base=ref.time-(oddStep(ref.abs)?ref.hs*sd:0),at=a=>base+(a-ref.abs)*sd+(oddStep(a)?(ref.hs+loc)*sd:0),k0=ref.abs+Math.round((t-base)/sd);let best=k0,bd=Infinity;for(let a=k0-1;a<=k0+1;a++){const d=Math.abs(t-at(a));if(d<bd){bd=d;best=a;}}return {a:best,off:(t-at(best))/sd};}
 function recordNote(i,t,vel){if(dead||!state.record||!playing||!ref)return;const c=state.channels[i];if(!c||!Number.isFinite(t)||!Number.isFinite(+vel)||!(vel>0)||Math.abs(t-ref.time)>4)return;
  const {a,off}=nearestStep(c,t);if(a<0)return;const idx=((a%c.seqLength)+c.seqLength)%c.seqLength,micro=state.quantize?0:Math.round(clamp(off,-.4,.4,0)*100)/100;
  c.steps[state.pattern][idx]={...cell(),v:clamp(vel,.05,1,.8),micro};if(a>ref.abs){if(recSkip.size>64)recSkip.clear();recSkip.add(i+':'+a);}
  if(root&&idx>=state.bank*16&&idx<state.bank*16+16&&stepButtons[i]&&stepButtons[i][idx-state.bank*16]&&idx<c.seqLength)paintStep(stepButtons[i][idx-state.bank*16],c.steps[state.pattern][idx],idx);}
 // een instrument zonder kanaal klinkt op een vrije bus (index vanaf het aantal kanalen); zijn er 16 kanalen, dan is er geen vrije bus en blijft het stil
 function guestHit(type,time,velocity){if(dead||!TYPES[type]||!(velocity>0))return;const t=Math.max(ctx.currentTime,Number.isFinite(time)?time:ctx.currentTime),free=[];for(let j=state.channels.length;j<16;j++)free.push(j);if(!free.length)return;
  const j=free.find(k=>guestBusy[k]<=t)??free.reduce((a,k)=>guestBusy[k]<guestBusy[a]?k:a,free[0]),model=MODELS.includes(state.channels[0]?.model)?state.channels[0].model:'Deep',g=lane(type,model,j),b=buses[j],now=ctx.currentTime;
  b.rumbleSend.gain.setTargetAtTime(TYPES[type][1]==='kick'?1:0,now,.005);b.filter.type=g.filter;b.filter.frequency.setTargetAtTime(Math.min(g.cutoff,ctx.sampleRate*.45),now,.005);b.filter.Q.setTargetAtTime(g.resonance,now,.005);
  const ci=Math.round(g.drive*40);if(b.curveIndex!==ci){b.shaper.curve=curves[ci];b.curveIndex=ci;}b.panner.pan.setTargetAtTime(g.pan,now,.005);b.level.gain.setTargetAtTime(g.level/(1+g.drive*.6),now,.005);b.send.gain.setTargetAtTime(g.mix?1:0,now,.005);
  guestBusy[j]=t+Math.max(.1,g.decay)+.2;hit(j,t,velocity,false,{},g);}
 let notesSig='';
 function notesNotify(){const sig=JSON.stringify(noteList());if(sig===notesSig)return;notesSig=sig;if(self&&typeof host.noteNamesChanged==='function')try{host.noteNamesChanged(self);}catch(e){}}
 function bundleNotify(){notesNotify();const sig=state.channels.map(c=>c.type).join('|');if(sig===bundleSig)return;bundleSig=sig;if(self&&typeof host.bundleChanged==='function')try{host.bundleChanged(self,'multi');}catch(e){}}
 function render(){refreshParams();bundleNotify();if(!root)return;root.replaceChildren();const style=node('style',root);style.textContent=CSS;const app=node('div',root,undefined,'sw');
 const top=node('div',app,undefined,'top'),brand=node('div',top,undefined,'brand');node('small',brand,'PATCHKAMER · TECHNO RHYTHM ENGINE');node('h1',brand,'PULSE');node('span',top,T.tag,'tag');
 const presetbar=node('div',app,undefined,'toolbar');select(presetbar,'TECHNO DNA',[['Hypnotic','Hypnotic'],['Hardgroove','Hardgroove'],['Industrial','Industrial'],['Deep dub','Deep dub'],['Broken','Broken'],['Custom','Custom']],['Hypnotic','Hardgroove','Industrial','Deep dub','Broken'].includes(state.kit)?state.kit:'Custom',x=>{if(x==='Custom')return;state=techno(x);stopAll();apply();render();});range(presetbar,'RUMBLE',state.rumble,0,1,.01,v=>{state.rumble=v;apply();},v=>Math.round(v*100)+'%','rumble','master');range(presetbar,'RUMBLE TONE',state.rumbleTone,80,2500,10,v=>{state.rumbleTone=v;apply();},v=>Math.round(v)+' Hz','rumbleTone','master');range(presetbar,'GLOBAL GRIT',state.grit,0,1,.01,v=>{state.grit=v;apply();},v=>Math.round(v*100)+'%','grit','master');button(presetbar,state.fill?'FILL ON':'Fill',()=>{state.fill=!state.fill;render();},state.fill?'active':'');node('span',presetbar,T.dnaNote,'notice');
 const toolbar=node('div',app,undefined,'toolbar');select(toolbar,T.factory,MODELS.map(x=>[x,x]).concat([['Custom',T.custom]]),KIT[state.kit]?state.kit:'Custom',x=>{if(KIT[x])loadKit(x);});select(toolbar,T.channels,Array.from({length:16},(_,i)=>[i+1,String(i+1)]),state.channels.length,x=>setCount(+x));button(toolbar,'Demo groove',()=>{groove(state,KIT[state.kit]?state.kit:'Punch');render();});button(toolbar,state.run?T.seqOn:T.seqOff,()=>{state.run=!state.run;if(!state.run)stopAll();render();},state.run?'active':'');
 range(toolbar,'MASTER',state.master,0,1,.01,v=>{state.master=v;apply();},v=>Math.round(v*100)+'%','master','master');range(toolbar,'HUMANIZE',state.human,0,.025,.001,v=>state.human=v,v=>Math.round(v*1000)+' ms','human','master');
 const seq=node('div',app,undefined,'section');const seqbar=node('div',seq,undefined,'row');node('span',seqbar,'PATTERN','caption');['A','B','C','D'].forEach((x,i)=>button(seqbar,x,()=>{state.pattern=i;render();},state.pattern===i?'active':''));select(seqbar,T.gridRange,[[16,'16 '+T.steps],[32,'32 '+T.steps],[64,'64 '+T.steps]],state.length,v=>{state.length=+v;state.bank=0;render();});select(seqbar,T.page,Array.from({length:Math.ceil(state.length/16)},(_,i)=>[i,`${i*16+1}–${Math.min(i*16+16,state.length)}`]),state.bank,v=>{state.bank=+v;render();});button(seqbar,T.rec,()=>{state.record=!state.record;render();},state.record?'active':'').title=T.recHint;check(seqbar,T.quant,state.quantize,v=>{state.quantize=v;});{const sw=range(seqbar,T.patSwing,state.patternSwing[state.pattern],0,.5,.01,v=>{state.patternSwing[state.pattern]=v;},v=>Math.round(v*100)+' %');sw.dataset.pkDefault='0';}button(seqbar,T.copy,()=>{clipboard=state.channels.map(c=>copy(c.steps[state.pattern]));});button(seqbar,T.paste,()=>{if(clipboard){state.channels.forEach((c,i)=>{if(clipboard[i])c.steps[state.pattern]=copy(clipboard[i]);});render();}});button(seqbar,T.clear,()=>{state.channels.forEach(c=>c.steps[state.pattern]=Array.from({length:64},cell));render();});
 const table=node('div',seq,undefined,'table'),ruler=node('div',table,undefined,'track');node('span',ruler,T.chRuler,'ruler');cursorLabels=[];for(let j=0;j<16;j++)cursorLabels.push(node('span',ruler,String(state.bank*16+j+1),'ruler'));
 stepButtons=[];state.channels.forEach((c,i)=>{const row=node('div',table,undefined,'track'+(i===state.selected?' selected':'')),label=node('div',row,undefined,'lane');button(label,`${String(i+1).padStart(2,'0')} ${TYPES[c.type][0]}`,()=>{state.selected=i;render();},'choose');button(label,'M',()=>{c.mute=!c.mute;apply();render();},'mini'+(c.mute?' active':''));button(label,'S',()=>{c.solo=!c.solo;apply();render();},'mini'+(c.solo?' active':''));const btns=[];for(let j=0;j<16;j++){const k=state.bank*16+j,z=c.steps[state.pattern][k],b=button(row,z.r>1?String(z.r):'',ev=>{if(ev?.shiftKey){z.v=state.editVelocity;z.p=state.editProbability;z.r=state.editRatchet;}else if(z.v)z.v=0;else Object.assign(z,{v:state.editVelocity,p:state.editProbability,r:state.editRatchet});paintStep(b,z,k);},'step');b.disabled=k>=state.channels[i].seqLength;b.oncontextmenu=e=>{e.preventDefault();Object.assign(z,{v:state.editVelocity,p:state.editProbability,r:state.editRatchet});paintStep(b,z,k);};adopt(b,{id:'ch'+(i+1)+'.step.'+(k+1),role:'step',group:'ch'+(i+1),label:String(i+1).padStart(2,'0')+' '+TYPES[c.type][0]});paintStep(b,z,k);btns.push(b);}stepButtons.push(btns);});
 const edit=node('div',seq,undefined,'toolbar');range(edit,T.editVel,state.editVelocity,.05,1,.05,v=>state.editVelocity=v,v=>Math.round(v*100)+'%','edit.velocity','edit');range(edit,T.editProb,state.editProbability,0,1,.05,v=>state.editProbability=v,v=>Math.round(v*100)+'%','edit.probability','edit');select(edit,'RATCHET',[[1,'1 ×'],[2,'2 ×'],[3,'3 ×'],[4,'4 ×']],state.editRatchet,v=>state.editRatchet=+v);node('span',edit,T.hint,'notice');
 const c=state.channels[state.selected],family=TYPES[c.type][1],section=node('div',app,undefined,'section'),header=node('div',section,undefined,'top');node('span',header,T.chCap(state.selected+1,TYPES[c.type][0].toUpperCase()),'caption');button(header,T.audition,()=>safeHit(state.selected,ctx.currentTime,.9));
 const laneTools=node('div',section,undefined,'toolbar');select(laneTools,T.laneLen,Array.from({length:64},(_,i)=>[i+1,String(i+1)]),c.seqLength,v=>{c.seqLength=+v;render();});button(laneTools,T.rotate,()=>{const a=c.steps[state.pattern].slice(0,c.seqLength);a.unshift(a.pop());a.forEach((v,i)=>c.steps[state.pattern][i]=v);render();});const pulses=select(laneTools,T.euclid,Array.from({length:c.seqLength+1},(_,i)=>[i,String(i)]),Math.min(5,c.seqLength),()=>{});button(laneTools,T.euclidGen,()=>{const n=+pulses.value;for(let j=0;j<c.seqLength;j++)c.steps[state.pattern][j]={...cell(),v:(j*n)%c.seqLength<n?state.editVelocity:0};render();});
 const choices=node('div',section,undefined,'toolbar');select(choices,'INSTRUMENT',Object.entries(TYPES).map(([k,t])=>[k,t[0]]),c.type,v=>changeSound(state.selected,v,c.model));select(choices,T.soundModel,MODELS.map(x=>[x,x]),c.model,v=>changeSound(state.selected,c.type,v));select(choices,'FILTER',[['lowpass','Low-pass'],['highpass','High-pass'],['bandpass','Band-pass'],['notch','Notch']],c.filter,v=>{c.filter=v;apply();});select(choices,T.choke,[[0,T.none],[1,'1 · '+T.hats],[2,'2'],[3,'3'],[4,'4']],c.choke,v=>c.choke=+v);const ml=node('label',choices,'MIDI NOTE'),mi=node('input',ml);mi.type='number';mi.min=0;mi.max=127;mi.value=c.note;mi.onchange=()=>{c.note=Math.round(clamp(mi.value,0,127,c.note));mi.value=c.note;};
 const controls=node('div',section,undefined,'editor'),pct=v=>Math.round(v*100)+'%',ms=v=>v<1?Math.round(v*1000)+' ms':v.toFixed(2)+' s';const lid='ch'+(state.selected+1),control=(key,label,min,max,step,fmt)=>range(controls,label,c[key],min,max,step,v=>{c[key]=v;apply();},fmt,lid+'.'+key,lid);
 if(family==='kick'){control('body','BODY',0,1,.01,pct);control('sub','SUB LAYER',0,1,.01,pct);control('click','CLICK LAYER',0,1,.01,pct);}if(family==='fm'){control('fm','FM DEPTH',0,8,.05,v=>v.toFixed(2));control('ratio','FM RATIO',.25,12,.05,v=>v.toFixed(2));}
 control('tune','TUNING',-24,24,.1,v=>(v>0?'+':'')+v.toFixed(1)+' st');control('swing',T.chSwing,0,.5,.01,v=>Math.round(v*100)+' %').dataset.pkDefault='0';control('decay','DECAY',.02,4,.005,ms);control('attack','ATTACK',.001,.15,.001,ms);
 if(['kick','tom','zap','metal'].includes(family))control('sweep',family==='kick'?'PITCH ENVELOPE':'PITCH SWEEP',0,1,.01,pct);
 control('tone',family==='snare'?T.body:family==='hat'||family==='cymbal'?T.metallic:T.toneAttack,0,1,.01,pct);
 if(!['bell','kick'].includes(family))control('noise',family==='snare'?T.wires:family==='kick'?T.beater:T.noiseTex,0,1,.01,pct);
 range(controls,'FILTER CUTOFF',Math.log2(c.cutoff),Math.log2(30),Math.log2(20000),.01,v=>{c.cutoff=Math.pow(2,v);apply();},v=>{const f=Math.pow(2,v);return f>=1000?(f/1000).toFixed(1)+' kHz':Math.round(f)+' Hz';},lid+'.cutoff',lid);control('resonance',T.res,.1,12,.1,v=>v.toFixed(1));control('drive','DRIVE',0,1,.01,pct);control('level',T.level,0,1,.01,pct);control('pan','PAN',-1,1,.01,v=>v===0?T.center:Math.round(Math.abs(v)*100)+(v<0?' L':' R'));check(controls,T.inMix,c.mix,v=>{c.mix=v;apply();});
 renderStepInspector(app);
 const bottom=node('div',app,undefined,'bottom'),viz=node('div',bottom,undefined,'section');node('div',viz,T.scopeCap,'caption');scope=node('canvas',viz,undefined,'scope');scope.width=800;scope.height=120;status=node('div',viz,T.hostStart,'stats');
 const presets=node('div',bottom,undefined,'section');node('div',presets,T.kitPresets,'caption');const pr=node('div',presets,undefined,'row'),name=node('input',pr);name.type='text';name.placeholder=T.kitName;name.maxLength=32;name.setAttribute('aria-label',T.presetName);button(pr,T.save,()=>{const nm=name.value.trim();if(!nm)return;const p={name:nm,channels:copy(state.channels)};const i=state.presets.findIndex(x=>x.name===nm);if(i>=0)state.presets[i]=p;else if(state.presets.length<24)state.presets.push(p);render();});if(state.presets.length){select(presets,T.savedKits,state.presets.map((p,i)=>[i,p.name]),0,()=>{});const pick=presets.querySelector('select');button(presets,T.loadKit,()=>{const p=state.presets[+pick.value];if(!p)return;stopAll();state.channels=p.channels.map((x,i)=>{const c=cleanChannel(x,i);if(state.channels[i]){c.steps=copy(state.channels[i].steps);c.swing=state.channels[i].swing;}return c;});state.kit=p.name;state.selected=0;apply();render();});button(presets,T.del,()=>{state.presets.splice(+pick.value,1);render();});}
 node('p',presets,T.presetNote,'notice');
 const ports=node('div',app,undefined,'section');node('div',ports,T.patchbay,'caption');const pp=node('div',ports,undefined,'ports');for(const p of PORTS.audioOut){const box=node('div',pp,undefined,'jackbox');host.ui.jack(self,box,p.id,'out',p.id==='mix'?T.jackMix:p.id==='rumble'?'RUMBLE OUT':`${p.id} · ${state.channels[+p.id.slice(2)-1]?TYPES[state.channels[+p.id.slice(2)-1].type][0]:T.empty}`);}host.ui.jack(self,pp,'multi','out',T.jackMulti);host.ui.jack(self,pp,'trigger','in','MIDI / TRIG');host.ui.jack(self,pp,'trigs','out','TRIG OUT');host.ui.jack(self,pp,'mod','in','MOD');
 modStatus=node('div',ports,T.modNone,'stats');
 node('p',ports,T.modNote,'notice');
 node('p',app,T.bundleNote,'notice');node('p',app,T.modelNote,'notice');
 }
 function renderStepInspector(app){const c=state.channels[state.selected],sec=node('div',app,undefined,'section');node('div',sec,'STEP LAB · LOCKS / MICROTIMING / CONDITIONS','caption');const row=node('div',sec,undefined,'toolbar');select(row,T.editStep,Array.from({length:c.seqLength},(_,i)=>[i,String(i+1)]),Math.min(state.stepEdit,c.seqLength-1),v=>{state.stepEdit=+v;render();});const z=c.steps[state.pattern][Math.min(state.stepEdit,c.seqLength-1)];range(row,'VELOCITY',z.v,0,1,.01,v=>{z.v=v;render();},v=>Math.round(v*100)+'%','step.velocity','step');range(row,'MICROTIMING',z.micro,-.4,.4,.01,v=>z.micro=v,v=>(v*100).toFixed(0)+T.ofStep,'step.micro','step');select(row,T.everyN,Array.from({length:8},(_,i)=>[i+1,String(i+1)]),z.every,v=>{z.every=+v;z.phase=Math.min(z.phase,z.every);render();});select(row,T.cycle,Array.from({length:z.every},(_,i)=>[i+1,String(i+1)]),Math.min(z.phase,z.every),v=>z.phase=+v);select(row,T.fillCond,[[0,T.always],[1,T.onlyFill],[2,T.noFill]],z.fill,v=>z.fill=+v);range(row,T.chance,z.p,0,1,.05,v=>z.p=v,v=>Math.round(v*100)+'%');select(row,'RATCHET',[[1,'1×'],[2,'2×'],[3,'3×'],[4,'4×']],z.r,v=>z.r=+v);
 const locks=node('div',sec,undefined,'editor');for(const key of ['tune','decay','tone','cutoff','resonance','drive','fm']){if(key==='fm'&&TYPES[c.type][1]!=='fm')continue;const def=MOD_DEFS[key],box=node('div',locks),label=key==='drive'?'Extra drive':def.name;check(box,label+' lock',Object.hasOwn(z.locks,key),v=>{if(v)z.locks[key]=key==='drive'?0:c[key];else delete z.locks[key];render();});if(Object.hasOwn(z.locks,key))range(box,label,z.locks[key],def.min,def.max,key==='cutoff'?1:key==='tune'?.1:.01,v=>z.locks[key]=v,v=>v>=1000?Math.round(v)+' Hz':v.toFixed(2),'step.lock.'+key,'step');}button(sec,T.clearLocks,()=>{z.locks={};render();});node('p',sec,T.stepLabNote,'notice');}
 function paintStep(b,z,k){b.classList.add('step');b.classList.toggle('quarter',k%4===0);b.classList.toggle('on',!!z.v);b.classList.remove('now');b.textContent=z.r>1&&z.v?String(z.r):'';const m=node('span',b,undefined,'velocity');m.style.transform=`scaleX(${z.v})`;b.style.opacity=z.v?String(.5+z.v*.5):'1';b.title=T.stepTitle(k+1,Math.round(z.v*100),Math.round(z.p*100),z.r);b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',z.v?'true':'false');}
 const scopeData=new Float32Array(512),meterData=new Float32Array(256),pending=[];
 let col=null,colAt=0;
 function colors(){if(col&&colAt++%30)return col;const cs=scope?getComputedStyle(scope):null,g=(k,d)=>(cs&&cs.getPropertyValue(k).trim())||d;col={screen:g('--screen','#101618'),line:g('--edge','#334149'),accent:g('--accent','#f6b85c'),bar:g('--panel','#29363c'),meter:g('--go','#92c8b1'),clip:g('--stop','#ff7060'),dim:g('--dim','#9aa9ad')};return col;}
 function animate(){if(dead||!root)return;const now=ctx.currentTime;while(pending.length&&pending[0].time<=now){const p=pending.shift();lastStep=p.step;lastTime=p.time;}stepButtons.forEach((btns,i)=>btns.forEach((b,j)=>b.classList.toggle('now',playing&&state.run&&state.bank*16+j===lastStep%state.channels[i].seqLength)));if(scope){const g=scope.getContext('2d'),C=colors();mixMeter.getFloatTimeDomainData(scopeData);g.fillStyle=C.screen;g.fillRect(0,0,800,120);g.strokeStyle=C.line;g.beginPath();g.moveTo(0,38);g.lineTo(800,38);g.stroke();g.strokeStyle=C.accent;g.beginPath();for(let j=0;j<512;j++){const x=j/511*800,y=38+scopeData[j]*90;j?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();for(let i=0;i<state.channels.length;i++){meters[i].getFloatTimeDomainData(meterData);let peak=0;for(const x of meterData)peak=Math.max(peak,Math.abs(x));const w=800/state.channels.length;g.fillStyle=C.bar;g.fillRect(i*w+3,82,w-6,20);g.fillStyle=peak>1?C.clip:C.meter;g.fillRect(i*w+3,82,(w-6)*Math.min(1,peak),20);g.fillStyle=C.dim;g.font='9px monospace';g.fillText(String(i+1),i*w+4,115);}}
 if(modStatus){const count=Object.values(mod).filter(v=>v!==0).length;modStatus.textContent=count?T.modActive(count):T.modNone;}
 if(status){status.textContent=error||(playing&&state.run?T.play(Math.floor(lastStep/16)+1,lastStep%16+1)+(state.record?' · REC':''):T.hostStart);status.className=error?'error':'stats';}}
 // ---- klembord (contract v1.17, §13d): het actieve patroon als `patchkamer-clip`, kind `drums` ----
 const CT={nl:{pat:p=>'Patroon '+p,gone:'Het apparaat is verwijderd.',bad:'Geen geldige clip.',kind:'Dit apparaat neemt alleen drums.'},en:{pat:p=>'Pattern '+p,gone:'The device has been removed.',bad:'Not a valid clip.',kind:'This device only takes drums.'}};
 const CX=CT[host&&host.lang]||CT.en, CLIP_ID='nl.patchkamer.pulsedrums';
 const clipName=()=>CX.pat('ABCD'[state.pattern]||'A');
 const clipLen=()=>Math.max(1,...state.channels.map(c=>c.seqLength))*12;
 const clipLanes=withLen=>{const T=clipLen();return state.channels.map((c,i)=>{const l={id:'ch'+(i+1),name:(TYPES[c.type]||[c.type])[0].slice(0,40),type:c.type,note:Math.round(c.note)};if(withLen&&c.seqLength*12!==T)l.length=c.seqLength*12;return l;});};
 function clipInfo(){try{if(dead)return null;return {name:clipName(),copy:['drums'],paste:['drums'],length:{min:12,max:768,step:12,current:clipLen(),shared:true},grid:[16],poly:16,range:[0,127],scheme:'gm',vel:'continuous',prob:true,ratchet:true,lanes:clipLanes(false),maxEvents:state.channels.length*64};}catch(e){return null;}}
 function getClip(){try{if(dead)return null;const T=clipLen(),hits=[],ex={};
  state.channels.forEach((c,i)=>{const st=c.steps[state.pattern],LL=c.seqLength*12;for(let k=0;k<c.seqLength;k++){const z=st[k],extra=z.every!==1||z.phase!==1||z.fill!==0||Object.keys(z.locks||{}).length>0||z.micro!==0;
   if(z.v>=0.01){const t=Math.max(0,Math.min(LL-1,k*12+Math.round(z.micro*12)));const h={t,lane:i,vel:Math.min(1,z.v)};if(z.p<1)h.prob=z.p;if(z.r>1)h.ratchet=z.r;hits.push(h);if(extra)ex[i+':'+k]={t,micro:z.micro,every:z.every,phase:z.phase,fill:z.fill,locks:copy(z.locks||{})};}
   else if(extra||z.v>0||z.p!==1||z.r!==1)ex[i+':'+k]={off:1,v:z.v,p:z.p,r:z.r,micro:z.micro,every:z.every,phase:z.phase,fill:z.fill,locks:copy(z.locks||{})};}});
  const clip={format:'patchkamer-clip',formatVersion:1,kind:'drums',name:clipName(),length:T,grid:16,source:{device:CLIP_ID,name:'Pulse Drums',version:'1.16.0',scheme:'gm'},lanes:clipLanes(true),hits,native:{device:CLIP_ID,data:{pattern:state.pattern,ex}}};
  if(state.patternSwing[state.pattern]>0)clip.swing=state.patternSwing[state.pattern];
  return copy(clip);}catch(e){return null;}}
 function setClip(clip){try{
  if(dead)return {ok:false,reason:CX.gone};
  if(!clip||typeof clip!=='object'||Array.isArray(clip)||clip.format!=='patchkamer-clip'||(clip.formatVersion!==undefined&&clip.formatVersion!==1))return {ok:false,reason:CX.bad};
  if(clip.kind!=='drums')return {ok:false,reason:CX.kind};
  if(typeof clip.length!=='number'||!Number.isFinite(clip.length))return {ok:false,reason:CX.bad};
  const lanes=Array.isArray(clip.lanes)?clip.lanes.slice(0,64):[],src=Array.isArray(clip.hits)?clip.hits.slice(0,4096):[],map=lanes.map(l=>{const m=l&&typeof l.id==='string'?/^ch(\d+)$/.exec(l.id):null;const i=m?+m[1]-1:-1;return i>=0&&i<state.channels.length?i:-1;});
  const nat=clip.native&&typeof clip.native==='object'&&clip.native.device===CLIP_ID&&clip.native.data&&typeof clip.native.data==='object'&&clip.native.data.pattern===state.pattern&&clip.native.data.ex&&typeof clip.native.data.ex==='object'?clip.native.data.ex:null;
  const next=state.channels.map(c=>Array.from({length:c.seqLength},cell));let dropped=0;
  for(const h of src){if(!h||typeof h!=='object'||typeof h.t!=='number'||!Number.isFinite(h.t)||!Number.isInteger(h.lane)||h.lane<0||h.lane>=map.length)continue;const i=map[h.lane];if(i<0)continue;
   const t=clamp(h.t,0,1e9),k=Math.round(t/12);if(k>=state.channels[i].seqLength){dropped++;continue;}
   const v=h.acc===true?1:clamp(h.vel,0.01,1,0.8),o=next[i][k];if(o.v>=v)continue;
   const z={...cell(),v,p:clamp(h.prob,0,1,1),r:Math.round(clamp(h.ratchet,1,4,1)),micro:Math.round(clamp((t-k*12)/12,-.4,.4,0)*100)/100};
   const e=nat&&Object.hasOwn(nat,i+':'+k)?nat[i+':'+k]:null;
   if(e&&typeof e==='object'&&!e.off&&e.t===h.t){z.micro=clamp(e.micro,-.4,.4,0);z.every=Math.round(clamp(e.every,1,8,1));z.phase=Math.round(clamp(e.phase,1,8,1));z.fill=Math.round(clamp(e.fill,0,2,0));z.locks=cleanLocks(e.locks);}
   next[i][k]=z;}
  if(nat)for(const key of Object.keys(nat)){const m=/^(\d+):(\d+)$/.exec(key),e=nat[key];if(!m||!e||typeof e!=='object'||!e.off)continue;const i=+m[1],k=+m[2];if(i>=state.channels.length||k>=state.channels[i].seqLength||k*12>=clip.length||next[i][k].v>0)continue;
   next[i][k]={...cell(),v:clamp(e.v,0,1,0),p:clamp(e.p,0,1,1),r:Math.round(clamp(e.r,1,4,1)),micro:clamp(e.micro,-.4,.4,0),every:Math.round(clamp(e.every,1,8,1)),phase:Math.round(clamp(e.phase,1,8,1)),fill:Math.round(clamp(e.fill,0,2,0)),locks:cleanLocks(e.locks)};}
  const before=JSON.stringify(state.channels.map(c=>c.steps[state.pattern]));
  state.channels.forEach((c,i)=>{const st=c.steps[state.pattern];for(let k=0;k<c.seqLength;k++)st[k]=next[i][k];});
  if(JSON.stringify(state.channels.map(c=>c.steps[state.pattern]))!==before)render();
  return {ok:true,...(dropped?{dropped}:{})};}catch(e){return {ok:false,reason:CX.bad};}}
 self={inputs:{},outputs,
 params(){return paramList.map(p=>({...p}));},
 modulate(offsets){if(dead)return;const next=Object.create(null);if(offsets&&typeof offsets==='object'&&!Array.isArray(offsets))for(const p of paramList){const v=offsets[p.id];if(typeof v==='number'&&Number.isFinite(v))next[p.id]=clamp(v,-1,1,0);}mod=next;apply();},
 mount(container){el=container;const wrap=document.createElement('div');el.appendChild(wrap);root=wrap;render();stopLoop();stopDraw=tekenLus(host,self,animate,30);animate();},
 unmount(){stopLoop();root=null;scope=null;status=null;modStatus=null;stepButtons=[];},
 onStep(info){try{if(dead)return;const {step,bar,time,stepDur}=info;if(!Number.isFinite(time)||!(stepDur>0))return;const absolute=bar*16+step;if(Number.isFinite(absolute))ref={abs:absolute,time,stepDur,hs:clamp(info.swing,0,.5,0)};if(!state.run)return;const odd=oddStep(absolute),patSwing=patSwingOf(),human=humanOf();pending.push({step:absolute,time});if(pending.length>128)pending.shift();state.channels.forEach((c,i)=>{const idx=((absolute%c.seqLength)+c.seqLength)%c.seqLength,z=c.steps[state.pattern][idx],cycle=Math.floor(absolute/c.seqLength);if(recSkip.delete(i+':'+absolute))return;const at=odd?time+Math.min(.5,patSwing+chSwing(i))*stepDur:time;if(z.v>0&&Math.random()<=z.p&&cycle%z.every===(Math.min(z.phase,z.every)-1)&&(z.fill===0||(z.fill===1&&state.fill)||(z.fill===2&&!state.fill)))for(let r=0;r<z.r;r++){const offset=human*Math.random()+z.micro*stepDur,v=z.v*(1-human*4*Math.random());hit(i,at+r*stepDur/z.r+offset,v,true,z.locks);}});}catch(e){fail(e);}},
 onTransport({playing:p}){playing=!!p;if(!playing){stopAll();pending.length=0;lastStep=-1;ref=null;recSkip.clear();}},
 onEvent(port,ev){try{if(dead||port!=='trigger'||!ev)return;const t=Number.isFinite(ev.time)?ev.time:ctx.currentTime;if(ev.type==='trig'){let i=/^ch\d+$/.test(ev.lane)?+ev.lane.slice(2)-1:state.channels.findIndex(c=>c.type===ev.lane);if(i>=0){hit(i,t,ev.vel??1);recordNote(i,t,ev.vel??1);}else if(Object.hasOwn(TYPES,ev.lane))guestHit(ev.lane,t,ev.vel??1);}else if(ev.type==='note'&&ev.vel>0){let any=false;state.channels.forEach((c,i)=>{if(c.note===Math.round(ev.note)){any=true;hit(i,t,ev.vel);recordNote(i,t,ev.vel);}});if(!any){const gst=fullList().find(x=>x.type&&x.note===Math.round(ev.note));if(gst)guestHit(gst.type,t,ev.vel);}}else if(ev.type==='cc'){const v=clamp(ev.value,0,1),m=/^ch(\d+)\.(cutoff|resonance|level|pan|drive|tune)$/.exec(ev.id);if(m&&state.channels[+m[1]-1]){const c=state.channels[+m[1]-1],k=m[2];c[k]=k==='cutoff'?30*Math.pow(20000/30,v):k==='resonance'?.1+v*11.9:k==='pan'?v*2-1:k==='tune'?v*48-24:v;apply();}else if(ev.id==='master'){state.master=v;apply();}}}catch(e){fail(e);}},
 // contract v1.5: één bundel met de actieve kanalen (zelfde nodes als ch1…ch16)
 bundles:{multi:()=>({label:T.multi,channels:state.channels.map((c,i)=>({id:'ch'+(i+1),name:String(i+1).padStart(2,'0')+' · '+TYPES[c.type][0],node:buses[i].direct}))})},
 // contract v1.6: preset = klank, kanalen en patronen; kitlijst en edit-instellingen blijven staan
 getPreset(){const s=copy(state);PRESET_SKIP.forEach(k=>delete s[k]);return s;},
 setPreset(p){const keep={};PRESET_SKIP.forEach(k=>keep[k]=copy(state[k]));restore({...(p&&typeof p==='object'?p:{}),...keep});},
 clipInfo(){return clipInfo();},getClip(){return getClip();},setClip(c){return setClip(c);},
 noteNames(){return noteList();},
 getState(){return copy(state);},setState(s){restore(s||{});},
 destroy(){if(dead)return;dead=true;self.unmount();sources.forEach(n=>{try{n.stop();}catch{}});sources.clear();owned.forEach(n=>{try{n.disconnect();}catch{}});owned.clear();voices.clear();pending.length=0;}
 };refreshParams(false);apply();return self;
 }
};
export default __pkDef;
