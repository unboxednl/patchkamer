// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.19.3 — Lichtere pagina: de markering van de huidige stap op de stapknoppen wordt alleen nog bijgewerkt als de stap verandert (voorheen elke beeldframe op alle knoppen). Geluid, state en uiterlijk ongewijzigd.
// 1.19.2 — Elke slag klinkt nu gelijk, ook bij 135 BPM: de start van een slag wordt naar boven afgerond op een grens van 128 samples (zoals Pulse Drums 1.20.1); de kick had een vaste cyclus van drie slagen met een verschillende aanzet. Niet beluisterd.
// 1.19.1 — Plop bij het afkappen van een open hat door een gesloten hat (choke) hersteld: de release gebruikt cancelAndHoldAtTime, zodat de uitklinkende envelope niet terugspringt naar zijn piek. Niet beluisterd.
// 1.19.0 — Herkenbaar voor skins (contract v1.15, additief): alle schuiven (master, humanize, patroonswing, stapwaarden en de regelaars van het gekozen kanaal) melden zich via host.ui.adopt aan met id (state-sleutel, of chN.<sleutel> zoals in params()), rol param en groep; een oudere host negeert dat. Met een skin die draaiknoppen kiest (data-pk-face/.kn) krijgt het apparaat extra opmaak voor de skin Compact (strakke werkbalken, kleiner stappenraster, knoppen in een rij); zonder skin ongewijzigd. Geluid, state, presets, params(), poorten en ids ongewijzigd.
// 1.18.1 — De stijl gebruikt geen algemene klasse `sw` meer maar `dk-app`: die regel (achtergrond, opvulling, afronding) raakte in de pagina elk ander element met die naam, zoals een hoekgreep van een canvas-sectie.
// 1.18.0 — Uitleg naar about (menu Over Drum Kit); de UI toont geen uitlegtekst meer.
// 1.17.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in about.
// 1.16.0 — Patchkamer contract v1.26: `clipInfo().length.settable`; `setClip` zet de gedeelde lengte uit `clip.length` (de host vraagt dat alleen met "Pas lengte aan de clip aan").
// 1.15.0 — Patchkamer contract v1.17: klembord voor patronen. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, kind `drums`, tijd in tikken van 12 per zestiende). Het huidige patroon (A tot D) wordt gekopieerd met één baan per kanaal (`chN`, `type` is het instrument, scheme `gm`); velocity, kans en ratchet gaan mee. Plakken zet alleen de stappen van het actieve patroon op de kanalen (kanalen zonder slagen worden leeg); de lengte is gedeeld en blijft van het apparaat, kit, klank, swing en andere patronen blijven. Gastinstrumenten zonder kanaal worden niet gevuld. Verder niets gewijzigd: getState, presets en geluid gelijk aan 1.14.2. De twee stapbewerkwaarden (editVelocity, editProbability) staan nu in `modExclude` (alleen metadata; de validator-melding is weg).
// 1.14.2 — Ontbrekende continue regelaars bestuurbaar via params()/modulate(): Humanize (human), Patroonswing A tot D (patternSwing.0 tot .3) en de swing per kanaal (chN.swing); alle standaard uit (drift 0,05, role swing of humanize).
//          Modulatie komt alleen bovenop de knop (knop + o × bereik, geclampt; swing als som begrensd tot 50%) en is nooit state; getState, presets en tunes gelijk. Zonder modulatie gelijk aan 1.14.1. Niet beluisterd.
//          Bewust weggelaten: lengte, pagina, patroon, kit/klankmodel (keuzes), de stapdata (velocity, kans, ratchet per stap) en het Auditie-/Opname-gedrag.
// 1.14.1 — Swing op patroon- en kanaalniveau (patternSwing per patroon A–D, swing per kanaal; 0 … 0,5 van een zestiende, naast de hostswing; de som is begrensd op 0,5), live inspelen (knop Opname: binnenkomende noten en trigs worden als stap in het actieve patroon op het juiste kanaal geschreven, op de dichtstbijzijnde geswingde zestiende), noteNames() geeft alle instrumenten uit de instrumentkeuze door en een instrument zonder kanaal klinkt als gast op een vrij kanaal (zoals Pulse Drums). Met swing 0 en opname uit is het gedrag gelijk aan 1.14.0.
// 1.14.0 — Patchkamer contract v1.14. Geeft de klanknamen met hun noot door (noteNames, contract v1.14), zodat een sequencer zijn rijen kan benoemen; de volgorde, kit en noten volgen de kanalen.
// 1.11.3 — De bassdrum klinkt langer door: de body van de kick werd door twee opeenvolgende afbouwen (in de toon en in de envelope) al na ongeveer 60 ms zwak. De toon loopt nu door tot het eind van de envelope en de envelope houdt het niveau even vast (een vijfde van de decay). Andere instrumenten ongewijzigd.
// 1.11.2 — Plafond achter de stereomix: tot 0,8 (−2 dBFS) ongewijzigd, daarboven zacht naar 1,0 in plaats van boven 0 dBFS te komen. Geen vertraging. De uitgangen per kanaal blijven ongewijzigd.
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
    factory: 'FABRIEKSKIT', custom: 'Eigen', channels: 'KANALEN', seqOn: 'Sequencer aan', seqOff: 'Sequencer uit',
    length: 'LENGTE', steps: 'stappen', page: 'PAGINA', copy: 'Kopieer', paste: 'Plak', clear: 'Wis pattern', chRuler: 'KANAAL / MUTE / SOLO',
    editVel: 'STAP VELOCITY', editProb: 'STAP KANS',
    chCap: (n, name) => `KANAAL ${n} · ${name}`, audition: '▶ Auditie', rec: 'Opname', patSwing: 'PATROON SWING', chSwing: 'KANAAL SWING', soundModel: 'KLANKMODEL', choke: 'CHOKE GROEP', none: 'Geen', hats: 'hats',
    body: 'BODY / HELDERHEID', metallic: 'METAALKLANK', toneAttack: 'TOON / AANSLAG', wires: 'SNARETAPIJT', beater: 'BEATER / KLIK', noiseTex: 'RUIS / TEXTUUR',
    res: 'RESONANTIE / Q', level: 'NIVEAU', center: 'Midden', inMix: 'In stereomix',
    scopeCap: 'MIX OSCILLOSCOOP · KANAALMETERS', hostStart: 'Host transport start de sequencer.', play: (s, n) => `PLAY · stap ${s} / ${n}`,
    kitPresets: 'EIGEN KITPRESETS', kitName: 'Naam van je kit', presetName: 'Presetnaam', save: 'Bewaar', savedKits: 'OPGESLAGEN KITS', loadKit: 'Laad kit', del: 'Verwijder',
    patchbay: 'PATCHBAY · STABIELE UITGANGEN', jackMix: 'STEREO MIX', empty: 'leeg', jackMulti: 'LOSSE UIT · BUNDEL',
    modNone: 'Mod · geen actieve offsets', modActive: n => 'MOD · ' + n + ' actieve parameters',
    stepTitle: (k, v, p, r) => `Stap ${k}: velocity ${v}%, kans ${p}%, ${r}×`, multi: 'Losse uit', pMaster: 'Master', pMasterLane: 'Master / stereomix',
    pn: { tone: 'Toon / helderheid', noise: 'Ruis / textuur', resonance: 'Resonantie / Q', sweep: 'Pitch envelope', level: 'Niveau' } },
  en: {
    factory: 'FACTORY KIT', custom: 'Custom', channels: 'CHANNELS', seqOn: 'Sequencer on', seqOff: 'Sequencer off',
    length: 'LENGTH', steps: 'steps', page: 'PAGE', copy: 'Copy', paste: 'Paste', clear: 'Clear pattern', chRuler: 'CHANNEL / MUTE / SOLO',
    editVel: 'STEP VELOCITY', editProb: 'STEP PROBABILITY',
    chCap: (n, name) => `CHANNEL ${n} · ${name}`, audition: '▶ Audition', rec: 'Record', patSwing: 'PATTERN SWING', chSwing: 'CHANNEL SWING', soundModel: 'SOUND MODEL', choke: 'CHOKE GROUP', none: 'None', hats: 'hats',
    body: 'BODY / BRIGHTNESS', metallic: 'METALLIC TONE', toneAttack: 'TONE / ATTACK', wires: 'SNARE WIRES', beater: 'BEATER / CLICK', noiseTex: 'NOISE / TEXTURE',
    res: 'RESONANCE / Q', level: 'LEVEL', center: 'Center', inMix: 'In stereo mix',
    scopeCap: 'MIX SCOPE · CHANNEL METERS', hostStart: 'The host transport starts the sequencer.', play: (s, n) => `PLAY · step ${s} / ${n}`,
    kitPresets: 'YOUR KIT PRESETS', kitName: 'Name of your kit', presetName: 'Preset name', save: 'Save', savedKits: 'SAVED KITS', loadKit: 'Load kit', del: 'Delete',
    patchbay: 'PATCHBAY · STABLE OUTPUTS', jackMix: 'STEREO MIX', empty: 'empty', jackMulti: 'SEPARATE OUTS · BUNDLE',
    modNone: 'Mod · no active offsets', modActive: n => 'MOD · ' + n + ' active parameters',
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
function lane(type='kick',model='Deep',i=0){const t=TYPES[type],m=MODEL[model];return {type,model,swing:0,note:t[2],tune:type==='kick'?(KICK_TUNE[model]??-20):0,decay:t[4]*m.decay,tone:t[5],noise:Math.min(1,t[6]*m.noise),sweep:type==='kick'?.65:.25,attack:.001,cutoff:model==='Lo-fi'?4600:18000,resonance:.7,filter:'lowpass',drive:model==='Industrial'?.55:model==='Lo-fi'?.22:0,level:.7,pan:0,mute:false,solo:false,mix:true,choke:type==='closedhat'||type==='openhat'?1:0,steps:Array.from({length:4},()=>Array.from({length:64},cell))};}
function makeState(kit='Punch'){return {kit,channels:KIT[kit].map((t,i)=>lane(t,kit,i)),patternSwing:[0,0,0,0],record:false,length:16,pattern:0,bank:0,selected:0,run:true,master:.72,human:0,presets:[],editVelocity:.8,editProbability:1,editRatchet:1};}
function groove(s,style){s.channels.forEach(c=>c.steps[s.pattern]=Array.from({length:64},cell));const put=(type,steps,v=.8)=>{const c=s.channels.find(c=>c.type===type);if(c)steps.forEach((n,i)=>c.steps[s.pattern][n]={v:i%2?v*.85:v,p:1,r:1});};
 if(style==='Jazz'){put('kick',[0,10],.5);put('brush',[4,12],.65);put('ride',[0,4,7,8,12,15],.65);put('closedhat',[4,12],.55);}
 else{put('kick',style==='Rock'?[0,6,8,10]:style==='Funk'?[0,3,6,10]:style==='Lo-fi'?[0,7,10]:[0,4,8,12],.92);put('snare',[4,12],.83);put('clap',[4,12],.48);put('closedhat',style==='Rock'?[0,2,4,6,8,10,12,14]:[0,2,4,6,8,10,12,14],.63);put('openhat',[6,14],.45);put('shaker',[1,3,5,7,9,11,13,15],.4);put('ride',style==='Rock'?[0,4,8,12]:[],.4);}
}
const PORTS={audioIn:[],audioOut:[{id:'mix',name:'Stereo mix'},...Array.from({length:16},(_,i)=>({id:'ch'+(i+1),name:'Drum '+(i+1)}))],eventIn:[{id:'trigger',name:'MIDI / trigs'}],eventOut:[{id:'trigs',name:'Drum trigs'}],modIn:[{id:'mod',name:'Mod'}],modOut:[],multiOut:[{id:'multi',name:'Losse uit (bundel)'}]};
// contract v1.6: deze velden horen bij het werken met het apparaat, niet bij de klank; een preset laat ze staan
const PRESET_SKIP=['record','presets','selected','bank','editVelocity','editProbability','editRatchet'];
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
.dk-app{--bg:var(--card,#14191c);--panel:var(--card-2,#1e2529);--edge:var(--line,#364148);--ink:var(--fg,#e8e9df);--dim:var(--muted,#9aa9ad);--accent:#f6b85c;--btn:color-mix(in srgb,var(--card-2,#1e2529) 86%,var(--fg,#e8e9df));--stepbg:var(--step-q,#273036);--screen:var(--well,#101618);color:var(--ink);background:var(--bg);padding:20px;border-radius:10px;font:13px 'IBM Plex Mono',monospace;container-type:inline-size}.dk-app *{box-sizing:border-box}.dk-app button,.dk-app select,.dk-app input{font:inherit;color:inherit}.dk-app button,.dk-app select,.dk-app input[type=text],.dk-app input[type=number]{background:var(--btn);border:1px solid var(--edge);border-radius:5px;padding:7px;min-height:32px}.dk-app button{cursor:pointer}.dk-app button:hover{border-color:var(--accent)}.dk-app button.active{background:var(--accent);color:#14191c;border-color:var(--accent)}.dk-app button:focus-visible,.dk-app input:focus-visible,.dk-app select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.dk-app .toolbar{display:flex;gap:9px;align-items:end;flex-wrap:wrap;margin:16px 0}.dk-app label{display:flex;flex-direction:column;gap:5px;font-size:10px;color:var(--dim);letter-spacing:.5px}.dk-app .row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.dk-app .section{border:1px solid var(--edge);background:var(--panel);border-radius:7px;padding:13px;margin:12px 0}.dk-app .caption{font-size:10px;letter-spacing:2px;color:var(--dim);margin-bottom:10px}.dk-app .table{overflow-x:auto}.dk-app .track{display:grid;grid-template-columns:190px repeat(16,minmax(25px,1fr));gap:5px;min-width:740px;margin:5px 0;align-items:center}.dk-app .lane{display:flex;align-items:center;gap:4px;min-width:0}.dk-app .lane .choose{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.dk-app .mini{padding:4px;min-width:25px;font-size:10px}.dk-app .step{height:34px;padding:0;border-radius:4px;background:var(--stepbg);position:relative}.dk-app .step.quarter{border-left:2px solid var(--dim)}.dk-app .step.on{background:linear-gradient(0deg,#b76d2e,var(--accent));color:#14191c}.dk-app .step .velocity{position:absolute;bottom:2px;left:3px;right:3px;background:color-mix(in srgb,var(--bg) 55%,transparent);height:3px;transform-origin:left}.dk-app .step.now{outline:2px solid var(--ink);outline-offset:1px}.dk-app .ruler{font-size:10px;text-align:center;color:var(--dim)}.dk-app .selected .choose{border-color:var(--accent);color:var(--accent)}.dk-app .editor{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:15px}.dk-app input[type=range]{width:100%;accent-color:var(--accent);margin:4px 0}.dk-app output{color:var(--ink);font-size:12px}.dk-app .scope{width:100%;height:92px;background:var(--screen);border-radius:5px}.dk-app .bottom{display:grid;grid-template-columns:2fr 1fr;gap:12px}.dk-app .ports{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.dk-app .jackbox{border:1px solid var(--edge);border-radius:5px;padding:5px;font-size:10px;color:var(--dim)}.dk-app .error{color:var(--stop,#ff9386)}.dk-app .check{flex-direction:row;align-items:center}.dk-app .stats{color:var(--accent);font-size:11px}.dk-app .hr{border-top:1px solid var(--edge);margin:13px 0}@container(max-width:700px){.dk-app .bottom{grid-template-columns:1fr}.dk-app .editor{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}}`;
// Uitgangsniveau: een vaste factor op de stereomix en op de kanaaluitgangen. Gemeten met de standaardgroove (10 s, 120 BPM): met .36 lag de piek op −18 dBFS,
// ruim 15 dB onder andere apparaten; met deze waarde op ongeveer −3 dBFS. De verhouding tussen de kanalen verandert niet.
const OUT_TRIM=.36*5.5;
const CEIL_T=.8,CEIL_CURVE=(()=>{const n=4097,c=new Float32Array(n);for(let i=0;i<n;i++){const x=(i/(n-1)*2-1)*2,a=Math.abs(x),y=a<=CEIL_T?a:CEIL_T+(1-CEIL_T)*Math.tanh((a-CEIL_T)/(1-CEIL_T));c[i]=Math.sign(x)*y/2;}return c;})();  // plafond: onder 0,8 ongewijzigd, daarboven zacht naar 1,0 (geen harde clip)
// Opmaak voor de skin Compact: alleen actief als de host draaiknoppen (.kn) heeft geplaatst; zonder skin telt hij niet mee.
const CSK=['button,select,input[type=text],input[type=number]{min-height:24px;padding:2px 6px;border-radius:4px;font-size:11px}',
 '.toolbar{margin:3px 0;gap:3px 6px;align-items:end}.section{padding:5px;margin:4px 0;border-radius:5px}.caption{margin-bottom:3px;letter-spacing:1px;font-size:9px}.top{display:flex;align-items:center;gap:8px}.top .caption{margin:0}',
 'label{gap:1px;font-size:8px;letter-spacing:0;line-height:1.1}label:has(>.kn){align-items:center;text-align:center;width:58px;min-width:0}.check{font-size:9px;letter-spacing:0}.editor label:has(>.kn){width:auto}label>.kn{order:-2;justify-self:center!important}label>output{order:-1;font-size:9px;line-height:1.1}',
 '.table{overflow:visible}.track{grid-template-columns:136px repeat(16,minmax(22px,1fr));gap:2px;min-width:0;margin:1px 0}.lane{gap:2px}.lane .choose{font-size:9px;padding:1px 3px;letter-spacing:-.03em}.row .caption{display:none}.row{gap:3px}.row button{padding:2px 5px;font-size:10px;letter-spacing:0}.row select{padding:2px 3px}.mini{min-width:22px;padding:1px;font-size:9px}',
 '.step{height:22px;min-height:22px;padding:0;border-radius:3px;font-size:9px}.step .velocity{bottom:1px;height:2px}.ruler{font-size:8px}',
 '.editor{grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px 2px;align-items:start}.editor .check{grid-column:span 2;align-self:center}',
 '.bottom{grid-template-columns:1fr 1fr;gap:6px}.bottom .section{margin:4px 0}.scope{height:36px}.stats{font-size:9px}.ports{gap:3px}.jackbox{padding:1px 3px;font-size:9px}.hr{margin:6px 0}',
 'input[type=text]{width:120px}'].map(r=>r.replace(/(^|\})([^{}]+)\{/g,(m,a,b)=>a+b.split(',').map(x=>'.dk-app:has(.kn) '+x).join(',')+'{')).join('')+'.dk-app:has(.kn){padding:6px;border-radius:5px}';
const __pkDef = {
 id:'nl.patchkamer.drumkit',name:'Drum Kit',version:'1.19.3',kind:'instrument',about:{ nl: 'Een drumworkstation met 16 stemmen, losse uitgangen en synthese.\n\nDe klankmodellen zijn originele synthese, geen samples. Tempo en swing komen van de Patchkamer-klok.\n\nKlik op een stap om hem aan of uit te zetten; Shift-klik of rechtsklik past de stapwaarden (velocity, kans, ratchet) toe. Opname schrijft binnenkomende noten en trigs in het actieve patroon, alleen als de klok loopt.\n\nKitpresets bewaren klanken en kanaalinstellingen. Patronen A tot D blijven bij het laden behouden. Alles wordt met de Patchkamer-opstelling opgeslagen.\n\nVerbind de paarse sturingsuitgang van een modulator met MOD. De modulator toont de beschikbare parameters per drumkanaal. Knoppen en presets bewaren de basiswaarden; modulatie wordt er tijdelijk bij opgeteld. Filter, resonantie, drive, pan en volume bewegen direct. Tuning, decay, attack en klanktextuur gelden vanaf de volgende drumslag.\n\nLosse uit (bundel) geeft alle actieve kanalen in één groene kabel, met instrumentnaam: trek hem naar bundel in van de mixer of naar de multitrack. De mix en de kanaaluitgangen zijn tegelijk actief. Zet In stereomix uit als je een kanaal extern mixt. Uitgangen volgen het kanaalnummer; ongebruikte uitgangen zijn stil. MIDI volgt de notennummers per kanaal; trig lane = ch1 tot ch16 of de instrumentnaam (kick, snare, …).', en: 'A drum workstation with 16 voices, individual outputs and synthesis.\n\nThe sound models are original synthesis, not samples. Tempo and swing come from the Patchkamer clock.\n\nClick a step to turn it on or off; Shift-click or right-click applies the step values (velocity, probability, ratchet). Record writes incoming notes and trigs into the active pattern, only while the clock runs.\n\nKit presets store sounds and channel settings. Patterns A to D are kept when you load one. Everything is saved with your Patchkamer workspace.\n\nConnect the purple control output of a modulator to MOD. The modulator shows the available parameters per drum channel. Knobs and presets keep the base values; modulation is added on top temporarily. Filter, resonance, drive, pan and level move immediately. Tuning, decay, attack and sound texture apply from the next hit.\n\nSeparate outs (bundle) gives all active channels on one green cable, with the instrument name: drag it to bundle in of the mixer or to the multitrack. The mix and the channel outputs are active at the same time. Turn off In stereo mix if you mix a channel externally. Outputs follow the channel number; unused outputs are silent. MIDI follows the note numbers per channel; trig lane = ch1 to ch16 or the instrument name (kick, snare, …).' },modExclude:['editVelocity','editProbability'],category:'groove',ui:{width:1180,minWidth:480,jacks:true},ports:PORTS,
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
 const ceilPre=gain(),ceilShaper=own(ctx.createWaveShaper()),ceilPost=gain();ceilPre.gain.value=.5;ceilPost.gain.value=2;ceilShaper.curve=CEIL_CURVE;ceilShaper.oversample='none';mix.connect(ceilPre).connect(ceilShaper).connect(ceilPost);
 const outputs={mix:ceilPost};
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
  paramList=[{id:'master',name:T.pMaster,lane:'master',laneName:T.pMasterLane,min:0,max:1,scale:'lin',role:'level',drift:.005,on:false},
   {id:'human',name:'Humanize',lane:'master',laneName:T.pMasterLane,min:0,max:.025,scale:'lin',role:'humanize',drift:.05,on:false}];
  for(let p=0;p<4;p++)paramList.push({id:'patternSwing.'+p,name:T.patSwing+' '+'ABCD'[p],lane:'swing',laneName:'Swing',min:0,max:.5,scale:'lin',role:'swing',drift:.05,on:false});
  state.channels.forEach((c,i)=>{const lane='ch'+(i+1),family=TYPES[c.type][1],laneName=String(i+1).padStart(2,'0')+' · '+TYPES[c.type][0]+' / '+c.model;
   for(const [key,def] of Object.entries(MOD_DEFS)){
    if(key==='sweep'&&!['kick','tom','zap','metal'].includes(family))continue;
    if(key==='noise'&&family==='bell')continue;
    paramList.push({id:lane+'.'+key,...def,name:T.pn[key]||def.name,lane,laneName});
   }
   paramList.push({id:lane+'.swing',name:T.chSwing,lane,laneName,min:0,max:.5,scale:'lin',role:'swing',drift:.05,on:false});
  });
  paramIds=new Set(paramList.map(p=>p.id));
  for(const key of Object.keys(mod))if(!paramIds.has(key))delete mod[key];
  if(notify&&self&&typeof host.paramsChanged==='function')host.paramsChanged(self);
 }
 function value(base,key,id){const def=key==='master'?{min:0,max:1,scale:'lin'}:MOD_DEFS[key],offset=mod[id]||0;if(!offset)return base;return clamp(def.scale==='log'?base*Math.pow(def.max/def.min,offset):base+offset*(def.max-def.min),def.min,def.max,base);}
 const swMod=(id,base,range)=>{const o=mod[id]||0;return o?clamp(base+o*range,0,range,base):base;};
 const chSwing=i=>swMod('ch'+(i+1)+'.swing',state.channels[i].swing,.5),patSwingOf=()=>swMod('patternSwing.'+state.pattern,state.patternSwing[state.pattern],.5),humanOf=()=>swMod('human',state.human,.025);
 function effective(i){const c=state.channels[i],out={...c};for(const key of Object.keys(MOD_DEFS))out[key]=value(c[key],key,'ch'+(i+1)+'.'+key);return out;}
 function apply(){
  if(dead)return;notesNotify();const solo=state.channels.some(c=>c.solo);
  mix.gain.setTargetAtTime(value(state.master,'master','master')*OUT_TRIM,ctx.currentTime,.02);
  buses.forEach((b,i)=>{if(!state.channels[i]){b.level.gain.setTargetAtTime(0,ctx.currentTime,.01);return;}const c=effective(i);
   b.filter.type=c.filter;b.filter.frequency.setTargetAtTime(Math.min(c.cutoff,ctx.sampleRate*.45),ctx.currentTime,.02);b.filter.Q.setTargetAtTime(c.resonance,ctx.currentTime,.02);
   const curveIndex=Math.round(c.drive*40);if(b.curveIndex!==curveIndex){b.shaper.curve=curves[curveIndex];b.curveIndex=curveIndex;}
   b.panner.pan.setTargetAtTime(c.pan,ctx.currentTime,.02);b.level.gain.setTargetAtTime(c.mute||(solo&&!c.solo)?0:c.level/(1+c.drive*.6),ctx.currentTime,.01);b.send.gain.setTargetAtTime(c.mix?1:0,ctx.currentTime,.01);
  });
 }

 const stopLoop=()=>{if(stopDraw){stopDraw();stopDraw=null;}};
 function fail(e){error='Audio: '+(e?.message||String(e));}
 function release(v,t){try{const g=v.env.gain;if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(t);else g.cancelScheduledValues(t);v.env.gain.setTargetAtTime(.00001,t,.004);v.src.forEach(s=>{try{s.stop(t+.035);}catch{}});}catch{}}
 function stopAll(){voices.forEach(v=>release(v,ctx.currentTime));}
 // De start van elke slag valt op een grens van het renderblok (128 samples), naar boven afgerond (hooguit 2,7 ms later, nooit eerder dan gepland): midden in een blok klinken ruis en aanzet anders, en bij sommige tempo's (135 BPM) loopt die plek in een vaste cyclus van drie slagen.
 const quantumStart=x=>Math.ceil(x*ctx.sampleRate/128-1e-6)*128/ctx.sampleRate;
 function hit(i,time,velocity=1,emit=true,guest=null){
  if(dead||(!guest&&!state.channels[i]))return;const c=guest?{...guest}:effective(i),solo=!guest&&state.channels.some(c=>c.solo);if(c.mute||(solo&&!c.solo)||velocity<=0)return;
  const t=quantumStart(Math.max(ctx.currentTime,Number.isFinite(time)?time:ctx.currentTime)),type=TYPES[c.type],family=type[1],model=MODEL[c.model],pitch=Math.pow(2,c.tune/12),f=type[3]*pitch*model.tone;
  const d=Math.max(.02,c.decay),vel=clamp(velocity,0,1,1),env=gain();const spectral=own(ctx.createBiquadFilter());spectral.type=['hat','cymbal','tamb'].includes(family)?'highpass':'lowpass';spectral.frequency.value=['hat','cymbal','tamb'].includes(family)?1200+c.tone*6000:1500*Math.pow(12,c.tone);spectral.Q.value=.55;env.connect(spectral).connect(buses[i].filter);
  const v={env,src:[],nodes:new Set([env,spectral]),i,choke:c.choke,t};voices.add(v);
  if(c.choke)voices.forEach(o=>{if(o!==v&&o.choke===c.choke&&o.t<=t)release(o,t);});
  while(voices.size>128){const old=voices.values().next().value;release(old,t);voices.delete(old);}
  let amp=(family==='kick'?.9:family==='snare'?.62:.45)*vel;
  const hold=family==='kick'?d*.22:0;env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(amp,t+c.attack);if(hold)env.gain.setValueAtTime(amp,t+c.attack+hold);env.gain.exponentialRampToValueAtTime(.00001,t+c.attack+hold+d*1.6);  // een bassdrum houdt zijn body even vast
  const track=n=>{own(n);v.nodes.add(n);return n;};
  const source=(s,end)=>{v.src.push(s);sources.add(s);s.onended=()=>{sources.delete(s);try{s.disconnect();}catch{}owned.delete(s);if(v.src.every(x=>!sources.has(x))){v.nodes.forEach(n=>{try{n.disconnect();}catch{}owned.delete(n);});voices.delete(v);}};s.start(t);s.stop(t+end);};
  const tone=(freq,level=.5,wave='sine',len=d,drop=0,delay=0)=>{const o=track(ctx.createOscillator()),g=track(ctx.createGain());o.type=wave;o.frequency.setValueAtTime(Math.min(freq*(1+drop),20000),t);o.frequency.exponentialRampToValueAtTime(Math.max(12,Math.min(freq,18000)),t+Math.min(len*.55,.25));g.gain.setValueAtTime(.00001,t);g.gain.setValueAtTime(Math.max(.00001,level),t+delay);g.gain.exponentialRampToValueAtTime(.00001,t+Math.max(delay+.01,len));o.connect(g).connect(env);source(o,Math.max(len,d*1.6+c.attack)+.04);};
  const noise=(level,cut,mode='highpass',len=d,delay=0)=>{const n=track(ctx.createBufferSource()),g=track(ctx.createGain()),b=track(ctx.createBiquadFilter());n.buffer=noiseBuffer;n.loop=true;b.type=mode;b.frequency.value=Math.min(cut,ctx.sampleRate*.45);b.Q.value=.7;g.gain.setValueAtTime(.00001,t);g.gain.setValueAtTime(Math.max(.00001,level),t+delay);g.gain.exponentialRampToValueAtTime(.00001,t+Math.max(delay+.01,len));n.connect(b).connect(g).connect(env);source(n,Math.max(len,d*1.6+c.attack)+.04);};
  const acoustic=['Rock','Pop','Jazz','Funk'].includes(c.model),bright=.25+c.tone*.75;
  if(family==='kick'){tone(f,.95,c.model==='Punch'?'triangle':'sine',d*1.9, c.sweep*(c.model==='Punch'?7:4));tone(f*1.48,acoustic?.22:.03,'sine',d*.3,c.sweep);noise(c.noise*.6,1700+bright*5500,'highpass',.012+c.tone*.018);}
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
 function cleanChannel(x,i){const ty=TYPES[x?.type]?x.type:'kick',mo=MODELS.includes(x?.model)?x.model:'Deep',c=lane(ty,mo,i);for(const [k,a,b] of [['swing',0,.5],['note',0,127],['tune',-24,24],['decay',.02,4],['tone',0,1],['noise',0,1],['sweep',0,1],['attack',.001,.15],['cutoff',30,20000],['resonance',.1,12],['drive',0,1],['level',0,1],['pan',-1,1],['choke',0,4]])c[k]=clamp(x?.[k],a,b,c[k]);c.note=Math.round(c.note);c.choke=Math.round(c.choke);for(const k of ['mute','solo','mix'])if(typeof x?.[k]==='boolean')c[k]=x[k];c.filter=['lowpass','highpass','bandpass','notch'].includes(x?.filter)?x.filter:'lowpass';if(Array.isArray(x?.steps))c.steps=Array.from({length:4},(_,p)=>Array.from({length:64},(_,j)=>{const z=x.steps[p]?.[j];return {v:clamp(z?.v,0,1,0),p:clamp(z?.p,0,1,1),r:Math.round(clamp(z?.r,1,4,1))};}));return c;}
 function restore(s){const d=makeState();state={...d};state.kit=typeof s?.kit==='string'?s.kit.slice(0,40):d.kit;state.channels=Array.isArray(s?.channels)&&s.channels.length?s.channels.slice(0,16).map(cleanChannel):d.channels;
 for(const [k,a,b] of [['length',1,64],['pattern',0,3],['bank',0,3],['selected',0,state.channels.length-1],['master',0,1],['human',0,.025],['editVelocity',.05,1],['editProbability',0,1],['editRatchet',1,4]])state[k]=clamp(s?.[k],a,b,d[k]);for(const k of ['length','pattern','bank','selected','editRatchet'])state[k]=Math.round(state[k]);state.patternSwing=Array.from({length:4},(_,p)=>clamp(Array.isArray(s?.patternSwing)?s.patternSwing[p]:undefined,0,.5,0));state.record=typeof s?.record==='boolean'?s.record:false;state.run=typeof s?.run==='boolean'?s.run:true;
 state.presets=Array.isArray(s?.presets)?s.presets.slice(0,24).filter(p=>p&&typeof p.name==='string'&&Array.isArray(p.channels)).map(p=>({name:p.name.slice(0,32),channels:p.channels.slice(0,16).map(cleanChannel)})):[];stopAll();apply();render();}
 function setCount(n){n=Math.round(clamp(n,1,16,11));stopAll();while(state.channels.length<n)state.channels.push(lane('kick','Deep'));state.channels.length=n;state.selected=Math.min(state.selected,n-1);state.kit='Custom';apply();render();}
 function changeSound(i,type,model){const old=state.channels[i],fresh=lane(type,model,i);['steps','level','pan','mute','solo','mix','swing'].forEach(k=>fresh[k]=old[k]);state.channels[i]=fresh;state.kit='Custom';releaseLane(i);apply();render();}
 function releaseLane(i){voices.forEach(v=>{if(v.i===i)release(v,ctx.currentTime);});}
 function loadKit(key){stopAll();const old=state.channels;state.channels=KIT[key].map((type,i)=>{const c=lane(type,key,i);if(old[i]){c.steps=copy(old[i].steps);c.swing=old[i].swing;}return c;});state.kit=key;state.selected=Math.min(state.selected,state.channels.length-1);apply();render();}
 function node(tag,parent,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;}
 function button(parent,text,fn,cls=''){const b=node('button',parent,text,cls);b.type='button';b.onclick=fn;return b;}
 function select(parent,label,options,value,fn){const l=node('label',parent,label),s=node('select',l);options.forEach(([v,n])=>{const o=node('option',s,n);o.value=String(v);});s.value=String(value);s.onchange=()=>fn(s.value);return s;}
 function range(parent,label,value,min,max,step,fn,fmt=v=>v.toFixed(2),sk){const l=node('label',parent,label),o=node('output',l,fmt(value)),r=node('input',l);r.type='range';r.min=min;r.max=max;r.step=step;r.value=value;r.oninput=()=>{o.textContent=fmt(+r.value);fn(+r.value);};if(sk&&typeof host.ui.adopt==='function'){try{host.ui.adopt(r,{id:sk[0],role:'param',group:sk[1],label:label});}catch(e){/* oudere host */}}return r;}
 function check(parent,label,value,fn){const l=node('label',parent,undefined,'check'),r=node('input',l);r.type='checkbox';r.checked=value;node('span',l,label);r.onchange=()=>fn(r.checked);}
 let stepButtons=[],cursorLabels=[],scope,status;
 let nowFor=null,nowKey=-2;
 let bundleSig='';
 // De lijst voor een sequencer: eerst de kanalen, daarna elk instrument uit de instrumentkeuze dat nog geen kanaal heeft (gast), met zijn standaardnoot of de eerstvolgende vrije.
 function fullList(){const seen=new Set(),o=[],types=new Set();state.channels.forEach(c=>{types.add(c.type);const n=Math.round(c.note);if(!(n>=0&&n<=127)||seen.has(n))return;seen.add(n);o.push({note:n,name:(TYPES[c.type]||[c.type])[0]});});
  for(const [k,t] of Object.entries(TYPES)){if(types.has(k)||o.length>=128)continue;let n=t[2];for(let g=0;g<128&&seen.has(n);g++)n=(n+1)%128;if(seen.has(n))continue;seen.add(n);o.push({note:n,name:t[0],type:k});}return o;}
 function noteList(){return fullList().map(x=>({note:x.note,name:x.name}));}
 const guestBusy=new Array(16).fill(0);
 // een instrument zonder kanaal klinkt op een vrije bus (index vanaf het aantal kanalen); zijn er 16 kanalen, dan is er geen vrije bus en blijft het stil
 function guestHit(type,time,velocity){if(dead||!TYPES[type]||!(velocity>0))return;const t=Math.max(ctx.currentTime,Number.isFinite(time)?time:ctx.currentTime),free=[];for(let j=state.channels.length;j<16;j++)free.push(j);if(!free.length)return;
  const j=free.find(k=>guestBusy[k]<=t)??free.reduce((a,k)=>guestBusy[k]<guestBusy[a]?k:a,free[0]),model=MODELS.includes(state.channels[0]?.model)?state.channels[0].model:'Deep',g=lane(type,model,j),b=buses[j],now=ctx.currentTime;
  b.filter.type=g.filter;b.filter.frequency.setTargetAtTime(Math.min(g.cutoff,ctx.sampleRate*.45),now,.005);b.filter.Q.setTargetAtTime(g.resonance,now,.005);
  const ci=Math.round(g.drive*40);if(b.curveIndex!==ci){b.shaper.curve=curves[ci];b.curveIndex=ci;}b.panner.pan.setTargetAtTime(g.pan,now,.005);b.level.gain.setTargetAtTime(g.level/(1+g.drive*.6),now,.005);b.send.gain.setTargetAtTime(g.mix?1:0,now,.005);
  guestBusy[j]=t+Math.max(.1,g.decay)+.2;hit(j,t,velocity,false,g);}
 // Live inspelen. ref = de laatst ontvangen klokstap (absolute stap, geswingde tijd, duur, hostswing); recSkip = stappen die al live zijn gespeeld en niet nog eens klinken.
 // Drum Kit kent alleen het zestiende-raster: een ingespeelde noot gaat altijd naar de dichtstbijzijnde (geswingde) zestiende.
 let ref=null;const recSkip=new Set();
 const oddStep=a=>((a%2)+2)%2===1;
 function nearestStep(c,t){const sd=ref.stepDur,loc=Math.min(.5,patSwingOf()+chSwing(state.channels.indexOf(c))),base=ref.time-(oddStep(ref.abs)?ref.hs*sd:0),at=a=>base+(a-ref.abs)*sd+(oddStep(a)?(ref.hs+loc)*sd:0),k0=ref.abs+Math.round((t-base)/sd);let best=k0,bd=Infinity;for(let a=k0-1;a<=k0+1;a++){const d=Math.abs(t-at(a));if(d<bd){bd=d;best=a;}}return best;}
 function recordNote(i,t,vel){if(dead||!state.record||!playing||!ref)return;const c=state.channels[i];if(!c||!Number.isFinite(t)||!Number.isFinite(+vel)||!(vel>0)||Math.abs(t-ref.time)>4)return;
  const a=nearestStep(c,t);if(a<0)return;const idx=((a%state.length)+state.length)%state.length;
  c.steps[state.pattern][idx]={...cell(),v:clamp(vel,.05,1,.8)};if(a>ref.abs){if(recSkip.size>64)recSkip.clear();recSkip.add(i+':'+a);}
  if(root&&idx>=state.bank*16&&idx<state.bank*16+16&&stepButtons[i]&&stepButtons[i][idx-state.bank*16])paintStep(stepButtons[i][idx-state.bank*16],c.steps[state.pattern][idx],idx);}
 let notesSig='';
 function notesNotify(){const sig=JSON.stringify(noteList());if(sig===notesSig)return;notesSig=sig;if(self&&typeof host.noteNamesChanged==='function')try{host.noteNamesChanged(self);}catch(e){}}
 function bundleNotify(){notesNotify();const sig=state.channels.map(c=>c.type).join('|');if(sig===bundleSig)return;bundleSig=sig;if(self&&typeof host.bundleChanged==='function')try{host.bundleChanged(self,'multi');}catch(e){}}
 function render(){refreshParams();bundleNotify();if(!root)return;root.replaceChildren();const style=node('style',root);style.textContent=CSS+CSK;const app=node('div',root,undefined,'dk-app');
 
 const toolbar=node('div',app,undefined,'toolbar');select(toolbar,T.factory,MODELS.map(x=>[x,x]).concat([['Custom',T.custom]]),KIT[state.kit]?state.kit:'Custom',x=>{if(KIT[x])loadKit(x);});select(toolbar,T.channels,Array.from({length:16},(_,i)=>[i+1,String(i+1)]),state.channels.length,x=>setCount(+x));button(toolbar,'Demo groove',()=>{groove(state,KIT[state.kit]?state.kit:'Punch');render();});button(toolbar,state.run?T.seqOn:T.seqOff,()=>{state.run=!state.run;if(!state.run)stopAll();render();},state.run?'active':'');
 range(toolbar,'MASTER',state.master,0,1,.01,v=>{state.master=v;apply();},v=>Math.round(v*100)+'%',['master','master']);range(toolbar,'HUMANIZE',state.human,0,.025,.001,v=>state.human=v,v=>Math.round(v*1000)+' ms',['human','master']);
 const seq=node('div',app,undefined,'section');const seqbar=node('div',seq,undefined,'row');node('span',seqbar,'PATTERN','caption');['A','B','C','D'].forEach((x,i)=>button(seqbar,x,()=>{state.pattern=i;render();},state.pattern===i?'active':''));select(seqbar,T.length,[[16,'16 '+T.steps],[32,'32 '+T.steps],[64,'64 '+T.steps]],state.length,v=>{state.length=+v;state.bank=0;render();});select(seqbar,T.page,Array.from({length:Math.ceil(state.length/16)},(_,i)=>[i,`${i*16+1}–${Math.min(i*16+16,state.length)}`]),state.bank,v=>{state.bank=+v;render();});button(seqbar,T.rec,()=>{state.record=!state.record;render();},state.record?'active':'').title=T.recHint;{const sw=range(seqbar,T.patSwing,state.patternSwing[state.pattern],0,.5,.01,v=>{state.patternSwing[state.pattern]=v;},v=>Math.round(v*100)+' %',['patternSwing.'+state.pattern,'pattern']);sw.dataset.pkDefault='0';}button(seqbar,T.copy,()=>{clipboard=state.channels.map(c=>copy(c.steps[state.pattern]));});button(seqbar,T.paste,()=>{if(clipboard){state.channels.forEach((c,i)=>{if(clipboard[i])c.steps[state.pattern]=copy(clipboard[i]);});render();}});button(seqbar,T.clear,()=>{state.channels.forEach(c=>c.steps[state.pattern]=Array.from({length:64},cell));render();});
 const table=node('div',seq,undefined,'table'),ruler=node('div',table,undefined,'track');node('span',ruler,T.chRuler,'ruler');cursorLabels=[];for(let j=0;j<16;j++)cursorLabels.push(node('span',ruler,String(state.bank*16+j+1),'ruler'));
 stepButtons=[];state.channels.forEach((c,i)=>{const row=node('div',table,undefined,'track'+(i===state.selected?' selected':'')),label=node('div',row,undefined,'lane');button(label,`${String(i+1).padStart(2,'0')} ${TYPES[c.type][0]}`,()=>{state.selected=i;render();},'choose');button(label,'M',()=>{c.mute=!c.mute;apply();render();},'mini'+(c.mute?' active':''));button(label,'S',()=>{c.solo=!c.solo;apply();render();},'mini'+(c.solo?' active':''));const btns=[];for(let j=0;j<16;j++){const k=state.bank*16+j,z=c.steps[state.pattern][k],b=button(row,z.r>1?String(z.r):'',ev=>{if(ev?.shiftKey){z.v=state.editVelocity;z.p=state.editProbability;z.r=state.editRatchet;}else if(z.v)z.v=0;else Object.assign(z,{v:state.editVelocity,p:state.editProbability,r:state.editRatchet});paintStep(b,z,k);},'step');b.disabled=k>=state.length;b.oncontextmenu=e=>{e.preventDefault();Object.assign(z,{v:state.editVelocity,p:state.editProbability,r:state.editRatchet});paintStep(b,z,k);};paintStep(b,z,k);btns.push(b);}stepButtons.push(btns);});
 const edit=node('div',seq,undefined,'toolbar');range(edit,T.editVel,state.editVelocity,.05,1,.05,v=>state.editVelocity=v,v=>Math.round(v*100)+'%',['editVelocity','edit']);range(edit,T.editProb,state.editProbability,0,1,.05,v=>state.editProbability=v,v=>Math.round(v*100)+'%',['editProbability','edit']);select(edit,'RATCHET',[[1,'1 ×'],[2,'2 ×'],[3,'3 ×'],[4,'4 ×']],state.editRatchet,v=>state.editRatchet=+v);
 const c=state.channels[state.selected],family=TYPES[c.type][1],section=node('div',app,undefined,'section'),header=node('div',section,undefined,'top');node('span',header,T.chCap(state.selected+1,TYPES[c.type][0].toUpperCase()),'caption');button(header,T.audition,()=>safeHit(state.selected,ctx.currentTime,.9));
 const choices=node('div',section,undefined,'toolbar');select(choices,'INSTRUMENT',Object.entries(TYPES).map(([k,t])=>[k,t[0]]),c.type,v=>changeSound(state.selected,v,c.model));select(choices,T.soundModel,MODELS.map(x=>[x,x]),c.model,v=>changeSound(state.selected,c.type,v));select(choices,'FILTER',[['lowpass','Low-pass'],['highpass','High-pass'],['bandpass','Band-pass'],['notch','Notch']],c.filter,v=>{c.filter=v;apply();});select(choices,T.choke,[[0,T.none],[1,'1 · '+T.hats],[2,'2'],[3,'3'],[4,'4']],c.choke,v=>c.choke=+v);const ml=node('label',choices,'MIDI NOTE'),mi=node('input',ml);mi.type='number';mi.min=0;mi.max=127;mi.value=c.note;mi.onchange=()=>{c.note=Math.round(clamp(mi.value,0,127,c.note));mi.value=c.note;};
 const controls=node('div',section,undefined,'editor'),pct=v=>Math.round(v*100)+'%',ms=v=>v<1?Math.round(v*1000)+' ms':v.toFixed(2)+' s';const control=(key,label,min,max,step,fmt)=>range(controls,label,c[key],min,max,step,v=>{c[key]=v;apply();},fmt,['ch'+(state.selected+1)+'.'+key,'channel']);
 control('tune','TUNING',-24,24,.1,v=>(v>0?'+':'')+v.toFixed(1)+' st');control('swing',T.chSwing,0,.5,.01,v=>Math.round(v*100)+' %').dataset.pkDefault='0';control('decay','DECAY',.02,4,.005,ms);control('attack','ATTACK',.001,.15,.001,ms);
 if(['kick','tom','zap','metal'].includes(family))control('sweep',family==='kick'?'PITCH ENVELOPE':'PITCH SWEEP',0,1,.01,pct);
 control('tone',family==='snare'?T.body:family==='hat'||family==='cymbal'?T.metallic:T.toneAttack,0,1,.01,pct);
 if(!['bell'].includes(family))control('noise',family==='snare'?T.wires:family==='kick'?T.beater:T.noiseTex,0,1,.01,pct);
 range(controls,'FILTER CUTOFF',Math.log2(c.cutoff),Math.log2(30),Math.log2(20000),.01,v=>{c.cutoff=Math.pow(2,v);apply();},v=>{const f=Math.pow(2,v);return f>=1000?(f/1000).toFixed(1)+' kHz':Math.round(f)+' Hz';},['ch'+(state.selected+1)+'.cutoff','channel']);control('resonance',T.res,.1,12,.1,v=>v.toFixed(1));control('drive','DRIVE',0,1,.01,pct);control('level',T.level,0,1,.01,pct);control('pan','PAN',-1,1,.01,v=>v===0?T.center:Math.round(Math.abs(v)*100)+(v<0?' L':' R'));check(controls,T.inMix,c.mix,v=>{c.mix=v;apply();});
 const bottom=node('div',app,undefined,'bottom'),viz=node('div',bottom,undefined,'section');node('div',viz,T.scopeCap,'caption');scope=node('canvas',viz,undefined,'scope');scope.width=800;scope.height=120;status=node('div',viz,T.hostStart,'stats');
 const presets=node('div',bottom,undefined,'section');node('div',presets,T.kitPresets,'caption');const pr=node('div',presets,undefined,'row'),name=node('input',pr);name.type='text';name.placeholder=T.kitName;name.maxLength=32;name.setAttribute('aria-label',T.presetName);button(pr,T.save,()=>{const nm=name.value.trim();if(!nm)return;const p={name:nm,channels:copy(state.channels)};const i=state.presets.findIndex(x=>x.name===nm);if(i>=0)state.presets[i]=p;else if(state.presets.length<24)state.presets.push(p);render();});if(state.presets.length){select(presets,T.savedKits,state.presets.map((p,i)=>[i,p.name]),0,()=>{});const pick=presets.querySelector('select');button(presets,T.loadKit,()=>{const p=state.presets[+pick.value];if(!p)return;stopAll();state.channels=p.channels.map((x,i)=>{const c=cleanChannel(x,i);if(state.channels[i]){c.steps=copy(state.channels[i].steps);c.swing=state.channels[i].swing;}return c;});state.kit=p.name;state.selected=0;apply();render();});button(presets,T.del,()=>{state.presets.splice(+pick.value,1);render();});}
 const ports=node('div',app,undefined,'section');node('div',ports,T.patchbay,'caption');const pp=node('div',ports,undefined,'ports');for(const p of PORTS.audioOut){const box=node('div',pp,undefined,'jackbox');host.ui.jack(self,box,p.id,'out',p.id==='mix'?T.jackMix:`${p.id} · ${state.channels[+p.id.slice(2)-1]?TYPES[state.channels[+p.id.slice(2)-1].type][0]:T.empty}`);}host.ui.jack(self,pp,'multi','out',T.jackMulti);host.ui.jack(self,pp,'trigger','in','MIDI / TRIG');host.ui.jack(self,pp,'trigs','out','TRIG OUT');host.ui.jack(self,pp,'mod','in','MOD');
 modStatus=node('div',ports,T.modNone,'stats');
 }
 function paintStep(b,z,k){b.className='step'+(k%4===0?' quarter':'')+(z.v?' on':'');b.textContent=z.r>1&&z.v?String(z.r):'';const m=node('span',b,undefined,'velocity');m.style.transform=`scaleX(${z.v})`;b.style.opacity=z.v?String(.5+z.v*.5):'1';b.title=T.stepTitle(k+1,Math.round(z.v*100),Math.round(z.p*100),z.r);b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',z.v?'true':'false');}
 const scopeData=new Float32Array(512),meterData=new Float32Array(256),pending=[];
 let col=null,colAt=0;
 function colors(){if(col&&colAt++%30)return col;const cs=scope?getComputedStyle(scope):null,g=(k,d)=>(cs&&cs.getPropertyValue(k).trim())||d;col={screen:g('--screen','#101618'),line:g('--edge','#334149'),accent:g('--accent','#f6b85c'),bar:g('--panel','#29363c'),meter:g('--go','#92c8b1'),clip:g('--stop','#ff7060'),dim:g('--dim','#9aa9ad')};return col;}
 function animate(){if(dead||!root)return;const now=ctx.currentTime;while(pending.length&&pending[0].time<=now){const p=pending.shift();lastStep=p.step;lastTime=p.time;}{const nk=playing&&state.run?lastStep-state.bank*16:-1;if(nowFor!==stepButtons||nowKey!==nk){nowFor=stepButtons;nowKey=nk;stepButtons.forEach(btns=>btns.forEach((b,j)=>b.classList.toggle('now',j===nk)));}}if(scope){const g=scope.getContext('2d'),C=colors();mixMeter.getFloatTimeDomainData(scopeData);g.fillStyle=C.screen;g.fillRect(0,0,800,120);g.strokeStyle=C.line;g.beginPath();g.moveTo(0,38);g.lineTo(800,38);g.stroke();g.strokeStyle=C.accent;g.beginPath();for(let j=0;j<512;j++){const x=j/511*800,y=38+scopeData[j]*90;j?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();for(let i=0;i<state.channels.length;i++){meters[i].getFloatTimeDomainData(meterData);let peak=0;for(const x of meterData)peak=Math.max(peak,Math.abs(x));const w=800/state.channels.length;g.fillStyle=C.bar;g.fillRect(i*w+3,82,w-6,20);g.fillStyle=peak>1?C.clip:C.meter;g.fillRect(i*w+3,82,(w-6)*Math.min(1,peak),20);g.fillStyle=C.dim;g.font='9px monospace';g.fillText(String(i+1),i*w+4,115);}}
 if(modStatus){const count=Object.values(mod).filter(v=>v!==0).length;modStatus.textContent=count?T.modActive(count):T.modNone;}
 if(status){status.textContent=error||(playing&&state.run?T.play(lastStep+1,state.length)+(state.record?' · REC':''):T.hostStart);status.className=error?'error':'stats';}}
 // ---- klembord (contract v1.17, §13d): het actieve patroon als `patchkamer-clip`, kind `drums` ----
 const CT={nl:{pat:p=>'Patroon '+p,gone:'Het apparaat is verwijderd.',bad:'Geen geldige clip.',kind:'Dit apparaat neemt alleen drums.'},en:{pat:p=>'Pattern '+p,gone:'The device has been removed.',bad:'Not a valid clip.',kind:'This device only takes drums.'}};
 const CX=CT[host&&host.lang]||CT.en, CLIP_ID='nl.patchkamer.drumkit';
 const clipLanes=()=>state.channels.map((c,i)=>({id:'ch'+(i+1),name:(TYPES[c.type]||[c.type])[0].slice(0,40),type:c.type,note:Math.round(c.note)}));
 const clipName=()=>CX.pat('ABCD'[state.pattern]||'A');
 function clipInfo(){try{if(dead)return null;return {name:clipName(),copy:['drums'],paste:['drums'],length:{min:12,max:768,step:12,current:state.length*12,shared:true,settable:true},grid:[16],poly:16,range:[0,127],scheme:'gm',vel:'continuous',prob:true,ratchet:true,lanes:clipLanes(),maxEvents:state.channels.length*64};}catch(e){return null;}}
 function getClip(){try{if(dead)return null;const L=state.length,hits=[];
  state.channels.forEach((c,i)=>{const st=c.steps[state.pattern];for(let k=0;k<L;k++){const z=st[k];if(!(z.v>=0.01))continue;const h={t:k*12,lane:i,vel:Math.min(1,z.v)};if(z.p<1)h.prob=z.p;if(z.r>1)h.ratchet=z.r;hits.push(h);}});
  const clip={format:'patchkamer-clip',formatVersion:1,kind:'drums',name:clipName(),length:L*12,grid:16,source:{device:CLIP_ID,name:'Drum Kit',version:'1.18.0',scheme:'gm'},lanes:clipLanes(),hits};
  if(state.patternSwing[state.pattern]>0)clip.swing=state.patternSwing[state.pattern];
  return copy(clip);}catch(e){return null;}}
 function setClip(clip){try{
  if(dead)return {ok:false,reason:CX.gone};
  if(!clip||typeof clip!=='object'||Array.isArray(clip)||clip.format!=='patchkamer-clip'||(clip.formatVersion!==undefined&&clip.formatVersion!==1))return {ok:false,reason:CX.bad};
  if(clip.kind!=='drums')return {ok:false,reason:CX.kind};
  if(typeof clip.length!=='number'||!Number.isFinite(clip.length))return {ok:false,reason:CX.bad};
  const oldLen=state.length,newLen=Math.round(clamp(clip.length,12,768,state.length*12)/12);   // v1.26: length.settable, de gedeelde lengte volgt de clip
  state.length=newLen;
  const lanes=Array.isArray(clip.lanes)?clip.lanes.slice(0,64):[],src=Array.isArray(clip.hits)?clip.hits.slice(0,4096):[],map=lanes.map(l=>{const m=l&&typeof l.id==='string'?/^ch(\d+)$/.exec(l.id):null;const i=m?+m[1]-1:-1;return i>=0&&i<state.channels.length?i:-1;});
  const next=state.channels.map(()=>Array.from({length:state.length},cell));
  for(const h of src){if(!h||typeof h!=='object'||typeof h.t!=='number'||!Number.isFinite(h.t)||!Number.isInteger(h.lane)||h.lane<0||h.lane>=map.length)continue;const i=map[h.lane];if(i<0)continue;
   const k=Math.round(clamp(h.t,0,1e9)/12);if(k>=state.length)continue;const v=h.acc===true?1:clamp(h.vel,0.01,1,0.8),o=next[i][k];if(o.v>=v)continue;
   next[i][k]={v,p:clamp(h.prob,0,1,1),r:Math.round(clamp(h.ratchet,1,4,1))};}
  const before=JSON.stringify(state.channels.map(c=>c.steps[state.pattern]));
  state.channels.forEach((c,i)=>{const st=c.steps[state.pattern];for(let k=0;k<state.length;k++)st[k]=next[i][k];});
  if(oldLen!==newLen||JSON.stringify(state.channels.map(c=>c.steps[state.pattern]))!==before)render();
  return {ok:true};}catch(e){return {ok:false,reason:CX.bad};}}
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
 onStep(info){try{if(dead)return;const {step,bar,time,stepDur}=info,absolute=bar*16+step;if(Number.isFinite(time)&&stepDur>0&&Number.isFinite(absolute))ref={abs:absolute,time,stepDur,hs:clamp(info.swing,0,.5,0)};if(!state.run)return;const idx=((absolute%state.length)+state.length)%state.length,odd=oddStep(absolute),patSwing=patSwingOf(),human=humanOf();pending.push({step:idx,time});if(pending.length>128)pending.shift();state.channels.forEach((c,i)=>{const z=c.steps[state.pattern][idx];if(recSkip.delete(i+':'+absolute))return;const at=odd?time+Math.min(.5,patSwing+chSwing(i))*stepDur:time;if(z.v>0&&Math.random()<=z.p)for(let r=0;r<z.r;r++){const offset=human*Math.random(),v=z.v*(1-human*4*Math.random());hit(i,at+r*stepDur/z.r+offset,v);}});}catch(e){fail(e);}},
 onTransport({playing:p}){playing=!!p;if(!playing){stopAll();pending.length=0;lastStep=-1;ref=null;recSkip.clear();}},
 onEvent(port,ev){try{if(dead||port!=='trigger'||!ev)return;const t=Number.isFinite(ev.time)?ev.time:ctx.currentTime;if(ev.type==='trig'){let i=/^ch\d+$/.test(ev.lane)?+ev.lane.slice(2)-1:state.channels.findIndex(c=>c.type===ev.lane);if(i>=0){hit(i,t,ev.vel??1);recordNote(i,t,ev.vel??1);}else if(Object.hasOwn(TYPES,ev.lane))guestHit(ev.lane,t,ev.vel??1);}else if(ev.type==='note'&&ev.vel>0){let any=false;state.channels.forEach((c,i)=>{if(c.note===Math.round(ev.note)){any=true;hit(i,t,ev.vel);recordNote(i,t,ev.vel);}});if(!any){const gst=fullList().find(x=>x.type&&x.note===Math.round(ev.note));if(gst)guestHit(gst.type,t,ev.vel);}}else if(ev.type==='cc'){const v=clamp(ev.value,0,1),m=/^ch(\d+)\.(cutoff|resonance|level|pan|drive|tune)$/.exec(ev.id);if(m&&state.channels[+m[1]-1]){const c=state.channels[+m[1]-1],k=m[2];c[k]=k==='cutoff'?30*Math.pow(20000/30,v):k==='resonance'?.1+v*11.9:k==='pan'?v*2-1:k==='tune'?v*48-24:v;apply();}else if(ev.id==='master'){state.master=v;apply();}}}catch(e){fail(e);}},
 
 clipInfo(){return clipInfo();},getClip(){return getClip();},setClip(c){return setClip(c);},
 noteNames(){return noteList();},
 getState(){return copy(state);},setState(s){restore(s||{});},
 destroy(){if(dead)return;dead=true;self.unmount();sources.forEach(n=>{try{n.stop();}catch{}});sources.clear();owned.forEach(n=>{try{n.disconnect();}catch{}});owned.clear();voices.clear();pending.length=0;}
 };refreshParams(false);apply();return self;
 }
};
export default __pkDef;
