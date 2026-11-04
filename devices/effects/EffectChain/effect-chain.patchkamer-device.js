// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — De kaart kan niet smaller dan 960 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Effect Chain en nieuwe id nl.patchkamer.effect-chain (voorheen Schakel FX, nl.patchkamer.schakel); songs en presets uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang; poortnamen per taal in i18n), kleuren uit de CSS-variabelen van de host, tekenen via host.frame met een ResizeObserver en een kleurcache (de tekenpoort-omzetting is weg).
//          De namen van de ketenpresets zijn Engels (oude Nederlandse namen in een bewaarde state worden herkend). setState negeert onbekende velden en kapt getallen af op hun bereik.
//          Bewakers: de eigen DSP begrenst de ingang (NaN wordt 0, Infinity en absurde waarden worden begrensd) en zet een ontspoorde toestand terug; een bewaker bouwt een slot met een ontspoord
//          filter of delaylus om en vervangt de beveiligingscompressor. Normaal geluid is bit-identiek aan 1.8.0.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
/** Effect Chain — seriële stereo-multi-effectketen.
 * Audio in -> slots 1..N -> stereo uit. 1 tot 8 slots (horizontaal scrollen), per slot een effect met eigen
 * regelaars, slotmix en bypass, pijltjes om te verplaatsen, ketenpresets en een algemene ingang/uitgang/mix.
 * 33 effecten plus doorvoer, 12 galmruimtes, 17 ketenpresets, live visuals (spectrum, golfvorm, stereobeeld, meters).
 * Mod-ingang: de master en alle doorlopende effectparameters hebben een vast id per fysiek slot (bijvoorbeeld
 * slot2.delay.time); keuzes (ruimte, patroon, deling, freeze …) blijven handmatig. Modulatie wordt niet bewaard.
 * Vlakke state: count/input/output/blend/preset + types[], bypass[], mixes[], settings[] (JSON-tekst per slot met
 * de parametergeheugens van elk effect), plus viewMode.
 * Eigen interpretaties, eigen ontwerpen: Stereo Image (M/S + decorrelatie), Vinyl Dust
 * (wow/flutter, slijtage, ruis, tikjes), Frequency Echo (63-taps analytische SSB-verschuiving in de feedback),
 * Cosmos (8-lijns gemoduleerd Householder-delaynetwerk), Digital Crush (bitdiepte, sample-hold, rate-LFO, jitter).
 * De streaming-DSP gebruikt ScriptProcessor/1024 (extra blokvertraging, hoofdthread); gebruik op trage machines weinig DSP-slots.
 * Ritmische effecten (pumping, trance gate, stutter, tempo delay, wobble) volgen de hostklok: start het transport.
 * Limiter: sample-peak, geen true-peak; 5 ms lookahead plus DSP-buffer. Zet hem laatst, slot- en totale mix 100%, uitgang 0 dB.
 * Galmtijden zijn synthetische IR-lengtes, geen gemeten RT60. Geen externe code, bestanden of netwerk.
 */
// Engels woordenboek; de Nederlandse tekst is de sleutel (host.lang === 'nl' gebruikt hem zelf)
const EN = {
  // effectnamen
  'Doorvoer': 'Pass-through', 'EQ · drie banden': 'EQ · three bands', 'Pingpong echo': 'Ping-pong echo', 'Reverb / Galm': 'Reverb',
  'Warme saturatie': 'Warm saturation', 'Stereo Beeld': 'Stereo Image', 'Vinylstof': 'Vinyl Dust', 'Frequentie Echo': 'Frequency Echo',
  'Kosmos · ambient': 'Cosmos · ambient', 'Digitale Gruis': 'Digital Crush', 'Harmonische Resonators': 'Harmonic Resonators',
  'Hybride Reverb': 'Hybrid Reverb', 'Freeze / Klankwolk': 'Freeze / Sound Cloud', 'Ringmodulator': 'Ring Modulator',
  // parameters
  'Frequentie': 'Frequency', 'Resonantie': 'Resonance', 'Laag': 'Low', 'Midden': 'Mid', 'Hoog': 'High', 'Middenfrequentie': 'Mid frequency',
  'Tijd': 'Time', 'Echohelderheid': 'Echo brightness', 'Tijd per kant': 'Time per side', 'Stereobreedte': 'Stereo width', 'Ruimte': 'Room',
  'Voorvertraging': 'Pre-delay', 'Galmhelderheid': 'Reverb brightness', 'Snelheid': 'Rate', 'Diepte': 'Depth', 'Breedte': 'Width',
  'Helderheid': 'Brightness', 'Compensatie': 'Compensation', 'Uitgang': 'Output', 'Asymmetrie': 'Asymmetry', 'Plafond': 'Ceiling',
  'Herstel': 'Release', 'Ingangsboost': 'Input boost', 'Decorrelatie': 'Decorrelation', 'Slijtage': 'Wear', 'Ruis': 'Noise', 'Tikjes': 'Crackle',
  'Toerental': 'Speed', 'Verschuiving': 'Shift', 'Echotijd': 'Echo time', 'Vertraging': 'Delay', 'Staart / feedback': 'Tail / feedback',
  'Diffusie': 'Diffusion', 'Modulatie': 'Modulation', 'Bitdiepte': 'Bit depth', 'Samplefrequentie': 'Sample rate', 'Rate-modulatie': 'Rate modulation',
  'Modulatiesnelheid': 'Modulation rate', 'Basisfrequentie': 'Base frequency', 'Beweging': 'Movement', 'LFO-diepte': 'LFO depth', 'Filtertype': 'Filter type',
  'Grondtoon (MIDI)': 'Root note (MIDI)', 'Akkoord': 'Chord', 'Uitklank': 'Decay', 'Transpositie': 'Transposition', 'Korrelgrootte': 'Grain size',
  'Verspreiding': 'Spread', 'Algoritmisch aandeel': 'Algorithmic share', 'Algoritmische ruimte': 'Algorithmic room', 'Algoritmische staart': 'Algorithmic tail',
  'Live / bevroren': 'Live / frozen', 'Opnamelengte': 'Recording length', 'Afspeelsnelheid': 'Playback speed', 'Draagfrequentie': 'Carrier frequency',
  'Puls': 'Pulse', 'Ducking-diepte': 'Ducking depth', 'Herstelcurve': 'Recovery curve', 'Patroon': 'Pattern', 'Gate-lengte': 'Gate length',
  'Herhaalfragment': 'Repeat fragment', 'Herhalen per maat': 'Repeat per bar', 'Richting': 'Direction', 'Echo-ritme': 'Echo rhythm',
  'Filtercyclus': 'Filter cycle', 'Laag-drive': 'Low drive', 'Midden-drive': 'Mid drive', 'Hoog-drive': 'High drive', 'Drempel': 'Threshold', 'Verhouding': 'Ratio',
  // keuzes
  '1 maat': '1 bar', 'Syncopen': 'Syncopated', '1/8 gepunt': 'Dotted 1/8', '1/4 gepunt': 'Dotted 1/4', '1/2 gepunt': 'Dotted 1/2',
  'Vooruit': 'Forward', 'Achteruit': 'Backward', 'Live opnemen': 'Live recording', 'Bevroren': 'Frozen',
  'Open / majeur': 'Open / major', 'Mineur 9': 'Minor 9', 'Majeur 9': 'Major 9',
  'Kamer': 'Room', 'Hal': 'Hall', 'Hemel': 'Heaven', 'Badkamer': 'Bathroom', 'Houten zaal': 'Wooden hall', 'Kerk': 'Church', 'Kathedraal': 'Cathedral',
  'Grot': 'Cave', 'Bevroren wolk': 'Frozen cloud',
  // weergave
  'Spectrum · lijn': 'Spectrum · line', 'Spectrum · balken': 'Spectrum · bars', 'Golfvorm': 'Waveform', 'Stereobeeld': 'Stereo image',
  'Niveaumeters': 'Level meters', 'Uit / minder CPU': 'Off / less CPU', 'Weergave': 'View', 'UITGANG · ': 'OUTPUT · ',
  'Live uitgang: ': 'Live output: ', 'Piek': 'Peak', 'Effectgrafiek slot {0}': 'Effect graph slot {0}', 'Ritme': 'Rhythm',
  'Basisfiltercurve': 'Base filter curve', 'Filtercurve': 'Filter curve', 'IR-envelope · model': 'IR envelope · model', 'Echo-taps · schema': 'Echo taps · diagram',
  'Uitgang · golfvorm': 'Output · waveform', 'Start hosttransport': 'Start host transport', ' · hoog ↑ / tijd →': ' · high ↑ / time →',
  ' · boven piek / onder RMS': ' · top peak / bottom RMS', ' · correlatie ': ' · correlation ', ' · stereoanalyse niet beschikbaar': ' · stereo analysis unavailable',
  // bediening
  'Ingang': 'Input', 'Master': 'Master', 'Totale mix': 'Total mix', 'Slot': 'Slot', 'Effectmix': 'Effect mix', 'Keten': 'Chain', 'Eigen keten': 'Custom chain',
  'Aantal': 'Slots', 'Parameters': 'Parameters', 'Bypass aan': 'Bypass on', 'Effect aan': 'Effect on',
  'Verplaats slot {0} links': 'Move slot {0} left', 'Verplaats slot {0} rechts': 'Move slot {0} right',
  'Effectketen van links naar rechts': 'Effect chain from left to right',
  'Onbewerkt signaal naar het volgende slot.': 'Unprocessed signal to the next slot.',
  'Paarse Mod-ingang → Master en effectparameters per slot. Knoppen blijven de basis; keuzelijsten worden niet gemoduleerd.': 'Purple Mod input → Master and effect parameters per slot. The knobs stay the base; choice lists are not modulated.',
  'IN → 1 → 2 → … → UIT · schuif horizontaal voor alle slots': 'IN → 1 → 2 → … → OUT · scroll sideways for all slots',
  'Mix per slot mengt droog en effect. Verborgen slots blijven bewaard. Effectwissels onthouden hun parameters; wisselen of verplaatsen wist de effectstaart. Galm/echo lopen door als transport stopt. Limiter: zet slotmix en totale mix op 100%, uitgang op 0 dB; plaats hem als laatste.':
    'Mix per slot blends dry and effect. Hidden slots are kept. Effect changes remember their parameters; switching or moving clears the effect tail. Reverb and echo keep ringing when the transport stops. Limiter: set slot mix and total mix to 100% and output to 0 dB; put it last.',
  'Deze effecten vereisen ScriptProcessor-ondersteuning in de browser.': 'These effects need ScriptProcessor support in the browser.',
};
const DESC_NL = {
  pump: 'Tempo-ducking zonder kick-ingang. Zet de mix op 100% en start transport.',
  trancegate: '16-staps amplitude-patroon op de hostklok. Mix 100% voor volledige gates.',
  stutter: 'Neemt per maat het laatste fragment over en herhaalt het tijdelijk. De eerste maat vult de buffer.',
  tempodelay: 'Echo in notenwaarden; volgt de BPM van Patchkamer.',
  wobble: 'Tempo-gesynchroniseerde filterbeweging. Start het hosttransport.',
  multiband: 'Eigen drive voor lage, midden- en hoge frequenties; geen mastering-crossover.',
  freeze: 'Neemt de afgelopen audio op. Kies Bevroren nadat er geluid binnenkomt. Dit is een granulaire tijdlus, geen spectrale freeze.',
  grains: 'Overlappende Hann-korrels met transpositie, spreiding en feedback.',
  shimmer: 'Granulaire octaaftranspositie gevolgd door een diffuus ambientnetwerk.',
  hybrid: 'Parallelle combinatie van de gekozen convolutionruimte en algoritmische ambientstaart.',
  resonator: 'Vijf op akkoord gestemde comb-resonators kleuren het inkomende geluid.',
  autofilter: 'Een LFO beweegt het filter rond de basisfrequentie.',
  imager: 'Mid/side-breedte. Mono → stereo voegt decorrelatie toe; controleer ook in mono.',
  vinyl: 'Gesynthetiseerde slijtage, ruis, tikjes en mechanische wow/flutter.',
  freqecho: 'Verschuift boventonen in Hz bij elke echo; geen transpositie in halve tonen.',
  cosmos: 'Acht gemoduleerde delaylijnen met diffusie voor lange, dichte ambientstaarten.',
  crush: 'Echte bitkwantisatie en sample-hold, met jitter, drop-outs en rate-modulatie.',
  limiter: '5 ms lookahead + sampleplafond (geen true-peak). Laatste slot, alle mixes 100%, uitgang 0 dB.'
};
const DESC_EN = {
  pump: 'Tempo ducking without a kick input. Set the mix to 100% and start the transport.',
  trancegate: '16-step amplitude pattern on the host clock. Mix 100% for full gates.',
  stutter: 'Takes over the last fragment of each bar and repeats it for a while. The first bar fills the buffer.',
  tempodelay: 'Echo in note values; follows the BPM of Patchkamer.',
  wobble: 'Tempo-synced filter movement. Start the host transport.',
  multiband: 'Separate drive for low, mid and high frequencies; not a mastering crossover.',
  freeze: 'Records the audio of the last moments. Choose Frozen once sound is coming in. This is a granular time loop, not a spectral freeze.',
  grains: 'Overlapping Hann grains with transposition, spread and feedback.',
  shimmer: 'Granular octave transposition followed by a diffuse ambient network.',
  hybrid: 'Parallel combination of the chosen convolution room and an algorithmic ambient tail.',
  resonator: 'Five comb resonators tuned to a chord colour the incoming sound.',
  autofilter: 'An LFO moves the filter around the base frequency.',
  imager: 'Mid/side width. Mono → stereo adds decorrelation; also check in mono.',
  vinyl: 'Synthesised wear, noise, crackle and mechanical wow/flutter.',
  freqecho: 'Shifts the overtones in Hz with every echo; not a transposition in semitones.',
  cosmos: 'Eight modulated delay lines with diffusion for long, dense ambient tails.',
  crush: 'True bit quantisation and sample-and-hold, with jitter, drop-outs and rate modulation.',
  limiter: '5 ms lookahead + sample ceiling (not true-peak). Last slot, all mixes 100%, output 0 dB.'
};
const LEGACY_PRESET = {
  'Ambient ruimte':'Ambient Space',
  'Heldere hemel':'Bright Sky',
  'Diepe mist':'Deep Mist',
  'Warme tape':'Warm Tape',
  'Langzame golven':'Slow Waves',
  'Kosmische zee':'Cosmic Sea',
  'Vergeten plaat':'Forgotten Record',
  'Psychedelische echo':'Psychedelic Echo',
  'Digitale dromen':'Digital Dreams',
  'Kristallen tuin':'Crystal Garden',
  'Oneindige wolk':'Endless Cloud',
  'Lege keten':'Empty Chain',
  'Eigen':'Custom'
};
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id:'nl.patchkamer.effect-chain', name:'Effect Chain', version:'1.11.1', kind:'effect', category:'effect', ui:{width:1080,minWidth:960},
  i18n:{nl:{ports:{in:'Stereo in',out:'Stereo uit',mod:'Mod'}}},
  ports:{audioIn:[{id:'in',name:'Stereo in'}],audioOut:[{id:'out',name:'Stereo out'}],eventIn:[],eventOut:[],modIn:[{id:'mod',name:'Mod'}],modOut:[]},
  create(ctx,host){
    const tx=(k,...a)=>{let t=host.lang==='nl'?k:(EN[k]??k);a.forEach((v,i)=>{t=t.replace('{'+i+'}',v);});return t;};
    const nm=type=>tx(defs[type].name);
    const MAX=8, nodes=new Set(), sources=new Set(), retired=[];
    let dead=false, root=null, frame=null, slots=[], ui={}, config, stopDraw=null, ro=null, col=null, colT=0, watch=null, overview=null, viewMode='spectrum', slotViews=[], modulation={},knownShape='',hostReady=false;
    // Streaming DSP uses the native ScriptProcessor (no external worklet file); the validator's host has no such API and gets a silent stub.
    // Parameter descriptor: label, min, max, step, default, unit.
    const clock={playing:false,bpm:120,stepDur:0.125,last:-1,origin:0};
    const grids=[1,2,4,8,16],gridNames=['1/16','1/8','1/4','1/2','1 maat'];
    const rhythms=[[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],[1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,0],[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],[1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,0]];
    const defs={
      none:{name:'Doorvoer',p:{}},
      filter:{name:'Filter',p:{cutoff:['Frequentie',40,16000,10,2400,'Hz'],resonance:['Resonantie',0.1,8,0.1,0.7,'Q'],mode:['Type: LP / HP / BP',0,2,1,0,'mode']}},
      eq:{name:'EQ · drie banden',p:{low:['Laag',-12,12,0.5,0,'dB'],mid:['Midden',-12,12,0.5,0,'dB'],high:['Hoog',-12,12,0.5,0,'dB'],freq:['Middenfrequentie',150,6000,10,1000,'Hz']}},
      delay:{name:'Stereo delay',p:{time:['Tijd',0.03,2,0.01,0.55,'s'],feedback:['Feedback',0,0.82,0.01,0.35,'%'],tone:['Echohelderheid',200,12000,10,3500,'Hz']}},
      pingpong:{name:'Pingpong echo',p:{time:['Tijd per kant',0.05,1.5,0.01,0.4,'s'],feedback:['Feedback',0,0.8,0.01,0.45,'%'],tone:['Echohelderheid',200,12000,10,3200,'Hz'],width:['Stereobreedte',0,1,0.01,0.85,'%']}},
      reverb:{name:'Reverb / Galm',p:{size:['Ruimte',0,11,1,1,'size'],predelay:['Voorvertraging',0,0.25,0.005,0.035,'s'],tone:['Galmhelderheid',300,14000,10,6500,'Hz']}},
      chorus:{name:'Chorus',p:{rate:['Snelheid',0.03,4,0.01,0.22,'Hz'],depth:['Diepte',0,1,0.01,0.5,'%'],width:['Stereobreedte',0,1,0.01,0.8,'%']}},
      flanger:{name:'Flanger',p:{rate:['Snelheid',0.02,2,0.01,0.15,'Hz'],depth:['Diepte',0,1,0.01,0.55,'%'],feedback:['Feedback',-0.75,0.75,0.01,0.3,'%']}},
      phaser:{name:'Phaser',p:{rate:['Snelheid',0.02,3,0.01,0.15,'Hz'],depth:['Diepte',0,1,0.01,0.6,'%'],center:['Middenfrequentie',200,2400,10,800,'Hz']}},
      tremolo:{name:'Tremolo',p:{rate:['Snelheid',0.05,12,0.05,1.5,'Hz'],depth:['Diepte',0,1,0.01,0.5,'%']}},
      autopan:{name:'Auto-pan',p:{rate:['Snelheid',0.02,5,0.01,0.12,'Hz'],depth:['Breedte',0,1,0.01,0.75,'%']}},
      saturation:{name:'Warme saturatie',p:{drive:['Drive',0,24,0.5,6,'dB'],tone:['Helderheid',400,16000,10,6000,'Hz'],trim:['Compensatie',-18,6,0.5,-3,'dB']}},
      distortion:{name:'Distortion',p:{drive:['Drive',0,36,0.5,18,'dB'],tone:['Helderheid',300,14000,10,4500,'Hz'],trim:['Uitgang',-24,0,0.5,-12,'dB']}},
      overdrive:{name:'Overdrive',p:{drive:['Drive',0,30,0.5,12,'dB'],tone:['Helderheid',300,14000,10,6000,'Hz'],bias:['Asymmetrie',0,0.5,0.01,0.15,'%'],trim:['Uitgang',-24,0,0.5,-6,'dB']}},
      limiter:{name:'Limiter · peak',p:{ceiling:['Plafond',-18,-0.1,0.1,-1,'dB'],release:['Herstel',0.02,1,0.01,0.15,'s'],boost:['Ingangsboost',0,18,0.5,0,'dB']}},
      imager:{name:'Stereo Beeld',p:{width:['Stereobreedte',0,2,0.01,1.3,'x'],stereoize:['Mono → stereo',0,1,0.01,0,'%'],delay:['Decorrelatie',0.003,0.035,0.001,0.012,'s']}},
      vinyl:{name:'Vinylstof',p:{wear:['Slijtage',0,1,0.01,0.35,'%'],warp:['Wow / flutter',0,1,0.01,0.3,'%'],dust:['Ruis',0,1,0.01,0.15,'%'],crackle:['Tikjes',0,1,0.01,0.2,'%'],rpm:['Toerental',0,2,1,0,'rpm']}},
      freqecho:{name:'Frequentie Echo',p:{shift:['Verschuiving',-200,200,0.5,8,'Hz'],time:['Echotijd',0.03,2,0.01,0.45,'s'],feedback:['Feedback',0,0.85,0.01,0.5,'%'],tone:['Helderheid',300,12000,10,4500,'Hz']}},
      cosmos:{name:'Kosmos · ambient',p:{time:['Vertraging',0.08,2,0.01,0.65,'s'],feedback:['Staart / feedback',0,0.97,0.01,0.88,'%'],diffusion:['Diffusie',0,1,0.01,0.85,'%'],mod:['Modulatie',0,1,0.01,0.4,'%'],tone:['Helderheid',300,14000,10,5000,'Hz'],width:['Breedte',0,1,0.01,0.8,'%']}},
      crush:{name:'Digitale Gruis',p:{bits:['Bitdiepte',2,16,1,8,'bit'],rate:['Samplefrequentie',400,48000,100,10000,'Hz'],drive:['Drive',0,24,0.5,3,'dB'],glitch:['Glitch / jitter',0,1,0.01,0.1,'%'],mod:['Rate-modulatie',0,1,0.01,0,'%'],speed:['Modulatiesnelheid',0.05,8,0.05,0.3,'Hz'],tone:['Helderheid',300,16000,10,7000,'Hz']}},
      autofilter:{name:'Auto Filter',p:{cutoff:['Basisfrequentie',60,12000,10,1800,'Hz'],resonance:['Resonantie',0.1,5,0.1,0.7,'Q'],rate:['Beweging',0.01,5,0.01,0.12,'Hz'],depth:['LFO-diepte',0,3,0.01,1.5,'oct'],mode:['Filtertype',0,2,1,0,'mode']}},
      resonator:{name:'Harmonische Resonators',p:{root:['Grondtoon (MIDI)',36,84,1,48,'MIDI'],chord:['Akkoord',0,3,1,0,'chord'],decay:['Uitklank',0.1,8,0.1,2.5,'s'],tone:['Helderheid',400,12000,10,4500,'Hz'],width:['Breedte',0,1,0.01,0.8,'%']}},
      grains:{name:'Granular Delay',p:{pitch:['Transpositie',-12,24,1,7,'st'],grain:['Korrelgrootte',0.04,0.5,0.01,0.18,'s'],time:['Vertraging',0.05,1.5,0.01,0.4,'s'],spray:['Verspreiding',0,0.5,0.01,0.15,'s'],feedback:['Feedback',0,0.75,0.01,0.3,'%']}},
      shimmer:{name:'Shimmer Reverb',p:{pitch:['Transpositie',0,24,12,12,'st'],grain:['Korrelgrootte',0.08,0.5,0.01,0.25,'s'],time:['Ruimte',0.08,1.5,0.01,0.4,'s'],feedback:['Uitklank',0,0.95,0.01,0.85,'%'],tone:['Helderheid',500,12000,10,5000,'Hz']}},
      hybrid:{name:'Hybride Reverb',p:{size:['Ruimte',0,11,1,7,'size'],balance:['Algoritmisch aandeel',0,1,0.01,0.5,'%'],time:['Algoritmische ruimte',0.08,1.5,0.01,0.4,'s'],feedback:['Algoritmische staart',0,0.95,0.01,0.85,'%'],tone:['Helderheid',400,12000,10,5500,'Hz']}},
      freeze:{name:'Freeze / Klankwolk',p:{freeze:['Live / bevroren',0,1,1,0,'freeze'],length:['Opnamelengte',0.1,2,0.05,0.8,'s'],speed:['Afspeelsnelheid',0.25,2,0.01,1,'x']}},
      ringmod:{name:'Ringmodulator',p:{frequency:['Draagfrequentie',0.1,2000,0.1,40,'Hz'],depth:['Diepte',0,1,0.01,1,'%']}},
      pump:{name:'Pumping / Duck',p:{grid:['Puls',0,4,1,2,'grid'],depth:['Ducking-diepte',0,1,0.01,0.85,'%'],recovery:['Herstelcurve',0.2,4,0.05,1.5,'x']}},
      trancegate:{name:'Trance Gate',p:{pattern:['Patroon',0,3,1,0,'pattern'],depth:['Diepte',0,1,0.01,1,'%'],length:['Gate-lengte',0.1,1,0.01,0.65,'%']}},
      stutter:{name:'Beat Stutter',p:{grid:['Herhaalfragment',0,4,1,0,'grid'],duty:['Herhalen per maat',0.1,1,0.01,0.5,'%'],reverse:['Richting',0,1,1,0,'reverse']}},
      tempodelay:{name:'Tempo Delay',p:{division:['Echo-ritme',0,7,1,3,'division'],feedback:['Feedback',0,0.85,0.01,0.45,'%'],tone:['Helderheid',300,12000,10,4000,'Hz']}},
      wobble:{name:'Wobble Filter',p:{grid:['Filtercyclus',0,4,1,2,'grid'],cutoff:['Basisfrequentie',80,8000,10,700,'Hz'],depth:['Beweging',0,3,0.01,2,'oct'],resonance:['Resonantie',0.1,5,0.1,1.2,'Q']}},
      multiband:{name:'Multiband Drive',p:{low:['Laag-drive',0,24,0.5,3,'dB'],mid:['Midden-drive',0,36,0.5,12,'dB'],high:['Hoog-drive',0,24,0.5,6,'dB'],trim:['Uitgang',-18,0,0.5,-6,'dB']}},
      compressor:{name:'Compressor',p:{threshold:['Drempel',-48,0,1,-20,'dB'],ratio:['Verhouding',1,12,0.5,3,':1'],attack:['Attack',0.001,0.2,0.001,0.025,'s'],release:['Release',0.05,2,0.01,0.35,'s'],makeup:['Make-up',0,12,0.5,0,'dB']}}
    };
    const own=(n,bag)=>{nodes.add(n);if(bag)bag.push(n);return n;};
    const gain=(v=1,bag)=>{const n=own(ctx.createGain(),bag);n.gain.value=v;return n;};
    const filter=(type,f,bag)=>{const n=own(ctx.createBiquadFilter(),bag);n.type=type;n.frequency.value=f;n.Q.value=0.7;return n;};
    const db=v=>10**(v/20), clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
    const number=(v,lo,hi,fallback,step=0)=>{if(typeof v!=='number'||!Number.isFinite(v))return fallback;v=clamp(v,lo,hi);return step?Number((Math.round(v/step)*step).toFixed(6)):v;};
    const target=(p,v,t=ctx.currentTime)=>p.setTargetAtTime(v,t,0.02);
    function params(type,raw){const result={};for(const [k,d] of Object.entries(defs[type].p))result[k]=number(raw?.[k],d[1],d[2],d[4],d[3]);return result;}
    function slot(type='none',mix=0.4){return {type,mix,bypass:false,bank:{[type]:params(type)}};}
    function initial(){return {count:4,input:0,output:0,blend:1,preset:'Ambient Space',slots:[slot('chorus',0.3),slot('delay',0.25),slot('reverb',0.35),...Array.from({length:5},()=>slot())]};}
    config=initial();
    const choices=new Set(['size','mode','rpm','freeze','chord','grid','pattern','division','reverse']);
    const prefix=i=>'slot'+(i+1);
    const scaleFor=d=>d[1]>0&&['Hz','s'].includes(d[5])?'log':'lin';
    function roleFor(key){if(['cutoff','tone','freq','center'].includes(key))return 'filter';if(key==='resonance')return 'res';if(['root','pitch','shift'].includes(key))return 'pitch';if(['release','decay','feedback'].includes(key))return 'decay';if(['attack','length','recovery'].includes(key))return 'env';if(['width','pan'].includes(key))return 'pan';if(['level','trim','makeup','boost','drive','low','mid','high'].includes(key))return 'level';if(['time','predelay','delay'].includes(key))return 'delay';return 'motion';}
    function descriptors(){
      const list=[{id:'input',name:tx('Ingang'),lane:'master',laneName:tx('Master'),min:-12,max:12,scale:'lin',role:'level',drift:0.005,on:false},{id:'output',name:tx('Uitgang'),lane:'master',laneName:tx('Master'),min:-12,max:12,scale:'lin',role:'level',drift:0.005,on:false},{id:'blend',name:tx('Totale mix'),lane:'master',laneName:tx('Master'),min:0,max:1,scale:'lin',role:'mix',drift:0.015,on:false}];
      for(let i=0;i<config.count;i++){const c=config.slots[i];if(c.type==='none')continue;const lane=prefix(i),laneName=tx('Slot')+' '+(i+1)+' · '+nm(c.type);
        list.push({id:lane+'.mix',name:tx('Effectmix'),lane,laneName,min:0,max:1,scale:'lin',role:'mix',drift:0.02,on:true});
        for(const [key,d] of Object.entries(defs[c.type].p)){if(choices.has(d[5]))continue;const role=roleFor(key);list.push({id:lane+'.'+c.type+'.'+key,name:tx(d[0]),lane,laneName,min:d[1],max:d[2],scale:scaleFor(d),role,drift:['level','pitch','res','decay'].includes(role)?0.008:0.02,on:!['level','pitch','res','decay'].includes(role)});}
      }return list;
    }
    function value(id,base,lo,hi,scale='lin'){const offset=modulation[id]||0;return clamp(scale==='log'?base*(hi/lo)**offset:base+offset*(hi-lo),lo,hi);}
    function slotValues(i){const c=config.slots[i],base=c.bank[c.type]||params(c.type),result={...base};for(const [key,d] of Object.entries(defs[c.type].p)){if(choices.has(d[5]))continue;let n=value(prefix(i)+'.'+c.type+'.'+key,base[key],d[1],d[2],scaleFor(d));if(key==='bits')n=Math.round(n);result[key]=n;}return result;}
    function notifyParameters(){
      const shape=config.count+':'+config.slots.slice(0,config.count).map(c=>c.type).join(',');if(shape===knownShape)return;knownShape=shape;
      const allowed=new Set(descriptors().map(p=>p.id));for(const id of Object.keys(modulation))if(!allowed.has(id))delete modulation[id];
      if(hostReady&&typeof host.paramsChanged==='function')host.paramsChanged(self);
    }

    // Preserve old room indices 0..2 for projects saved with v1.0.
    const rooms=[['Kamer',1.4,0.25],['Hal',4.5,0.7],['Hemel',9,1],['Studio',0.45,0.1],['Badkamer',0.85,0.05],['Houten zaal',2.2,0.8],['Plate',3.2,0.2],['Kerk',6,0.7],['Kathedraal',12,0.85],['Grot',7,0.9],['Tunnel',4,0.3],['Bevroren wolk',16,1]];
    const impulses=[],irEnvelopes=[];
    function impulse(index){if(impulses[index])return impulses[index];const [,seconds,dark]=rooms[index],b=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate);let seed=74213+index;
      for(let c=0;c<2;c++){const a=b.getChannelData(c);let smooth=0;const pole=0.15+dark*0.65;
        for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;smooth=smooth*pole+((seed>>>0)/2147483648-1)*(1-pole);const fade=Math.min(1,i/(ctx.sampleRate*(index===6?0.002:0.012)));a[i]=smooth*fade*Math.exp(-i/(ctx.sampleRate*seconds/6.9));}
        const reflections=index===10?[0.07,0.14,0.21,0.28,0.35]:index===9?[0.043,0.119,0.231]:[0.017,0.031,0.053];
        reflections.forEach((t,j)=>{const i=Math.floor((t+c*0.0017)*ctx.sampleRate);if(i<a.length)a[i]+=0.35/(j+1);});
      }const data=b.getChannelData(0),env=new Float32Array(96);for(let j=0;j<96;j++){const from=Math.floor(j*data.length/96),to=Math.floor((j+1)*data.length/96);let energy=0,n=0;for(let i=from;i<to;i+=16){energy+=data[i]*data[i];n++;}env[j]=Math.sqrt(energy/Math.max(1,n));}irEnvelopes[index]=env;impulses[index]=b;return b;
    }
    const satCurve=new Float32Array(2049);for(let i=0;i<satCurve.length;i++){const x=2*i/(satCurve.length-1)-1;satCurve[i]=Math.tanh(x*2)/Math.tanh(2);}
    const input=gain(), pre=gain(), dry=gain(0), wet=gain(1), post=gain(), output=gain();
    const makeProtection=()=>{const n=own(ctx.createDynamicsCompressor());n.threshold.value=-3;n.knee.value=3;n.ratio.value=20;n.attack.value=0.003;n.release.value=0.15;return n;};
    let protection=makeProtection();
    input.connect(pre);pre.connect(dry).connect(post);wet.connect(post);post.connect(protection).connect(output);
    // Measured output displays. Analysis branches never change the audio route.
    const monitor=own(ctx.createAnalyser());monitor.fftSize=1024;monitor.smoothingTimeConstant=0.75;output.connect(monitor);
    const leftMonitor=own(ctx.createAnalyser()),rightMonitor=own(ctx.createAnalyser());leftMonitor.fftSize=1024;rightMonitor.fftSize=1024;
    const hasStereo=typeof ctx.createChannelSplitter==='function';
    if(hasStereo){const split=own(ctx.createChannelSplitter(2));output.connect(split);split.connect(leftMonitor,0);split.connect(rightMonitor,1);}
    else{output.connect(leftMonitor);output.connect(rightMonitor);}
    const spectrum=new Uint8Array(512),wave=new Float32Array(1024),waveL=new Float32Array(1024),waveR=new Float32Array(1024);
    const visualModes=[['spectrum','Spectrum · lijn'],['bars','Spectrum · balken'],['spectrogram','Spectrogram'],['wave','Golfvorm'],['stereo','Stereobeeld'],['levels','Niveaumeters'],['off','Uit / minder CPU']];
    const GUARD_MAX=100;   // a sample above this (+40 dBFS) or not finite counts as a runaway filter
    function canvas(parent,width,height,label,fixedDark){const c=document.createElement('canvas');c._plotWidth=width;c._plotHeight=height;c._baseWidth=width;c.style.cssText='display:block;width:100%;max-width:'+width+'px;height:'+height+'px;border-radius:6px;background:'+(fixedDark?'#101c20':'var(--well)')+';margin:4px 0';c.setAttribute('role','img');c.setAttribute('aria-label',label);parent.appendChild(c);if(ro)ro.observe(c);prepareCanvas(c);return c;}
    function prepareCanvas(c){const dpr=Math.min(4,Math.max(1,Number(globalThis.devicePixelRatio)||1)),w=c._cw>0?Math.min(c._cw,c._baseWidth):c._baseWidth,h=c._plotHeight;
      c._plotWidth=w;const bw=Math.round(w*dpr),bh=Math.round(h*dpr);if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}const g=c._g||(c._g=c.getContext('2d'));if(g)g.setTransform(bw/w,0,0,bh/h,0,0);return g;
    }
    // colours come from the host's CSS variables, read at most once a second and after a skin change
    function ensureColors(){const now=performance.now();if(col&&now-colT<1000)return;colT=now;const cs=getComputedStyle(root),v=(n,d)=>cs.getPropertyValue(n).trim()||d;
      col={bg:v('--well','#101c20'),fg:v('--well-fg','#b7d9d7'),au:v('--audio','#88e3d1'),md:v('--mod','#a6adff'),ev:v('--event','#ffc985'),st:v('--stop','#ff9985'),ln:v('--line','#294149')};}
    const stopDrawing=()=>{if(stopDraw){stopDraw();stopDraw=null;}};
    const startDraw=()=>{stopDrawing();if(dead||!root||viewMode==='off')return;stopDraw=tekenLus(host,self,drawVisuals,30);};
    const onSkin=()=>{col=null;};
    function mountOverview(){
      host.ui.select(root,tx('Weergave'),visualModes.map(([k,n])=>[k,tx(n)]),viewMode,v=>{if(visualModes.some(([key])=>key===v)){viewMode=v;render();}});
      if(viewMode==='off'){overview=null;return;}
      const title=text('div',tx('UITGANG · ')+tx(visualModes.find(([key])=>key===viewMode)[1]),root,'font:11px system-ui,sans-serif;color:var(--fg);margin-top:6px');
      const c=canvas(root,256,66,tx('Live uitgang: ')+viewMode,viewMode==='spectrogram');
      const stats=text('div',tx('Piek')+' — · RMS —',root,'font:11px system-ui,sans-serif;font-variant-numeric:tabular-nums;color:var(--fg);line-height:1.4;margin-bottom:5px');
      overview={canvas:c,title,stats};
    }
    function mountSlotView(card,i){if(viewMode==='off')return;const c=canvas(card,218,100,tx('Effectgrafiek slot {0}',i+1));slotViews.push({canvas:c,index:i,wave:new Float32Array(512),freq:new Float32Array(128),mag:new Float32Array(128),phase:new Float32Array(128),response:new Float32Array(128)});}
    function background(c,title){const g=prepareCanvas(c);if(!g)return null;const w=c._plotWidth,h=c._plotHeight;g.clearRect(0,0,w,h);g.fillStyle=col.bg;g.fillRect(0,0,w,h);g.strokeStyle=col.ln;g.lineWidth=1;for(let j=1;j<4;j++){g.beginPath();g.moveTo(0,j*h/4);g.lineTo(w,j*h/4);g.stroke();}g.font='11px system-ui,sans-serif';g.fillStyle=col.fg;if(title)g.fillText(title,7,13);return g;}
    function line(g,data,width,height,color,y=0,scale=1){g.strokeStyle=color||col.au;g.lineWidth=1.3;g.beginPath();for(let j=0;j<data.length;j++){const x=j/(data.length-1)*width,v=height*0.5+y-clamp(data[j]*scale,-1,1)*height*0.38;if(j===0)g.moveTo(x,v);else g.lineTo(x,v);}g.stroke();}
    function drawVisuals(){
      if(dead||!root||viewMode==='off')return;ensureColors();
      {
        if(overview){const c=overview.canvas,g=viewMode==='spectrogram'?prepareCanvas(c):background(c,'');
          if(g){const w=c._plotWidth,h=c._plotHeight;monitor.getFloatTimeDomainData(wave);let peak=0,energy=0;for(const v of wave){peak=Math.max(peak,Math.abs(v));energy+=v*v;}const rms=Math.sqrt(energy/wave.length),peakDB=20*Math.log10(Math.max(peak,1e-6)),rmsDB=20*Math.log10(Math.max(rms,1e-6));let extra='';
            if(['spectrum','bars','spectrogram'].includes(viewMode)){
              monitor.getByteFrequencyData(spectrum);
              const sample=f=>{const hz=30*(Math.min(20000,ctx.sampleRate*0.48)/30)**f,bin=clamp(Math.round(hz/(ctx.sampleRate/1024)),0,spectrum.length-1);return spectrum[bin]/255;};
              if(viewMode==='spectrogram'){g.drawImage(c,0,0,c.width,c.height,-2,0,w,h);for(let y=0;y<h;y++){const intensity=sample(1-y/(h-1));g.fillStyle='hsl('+(190+intensity*80)+',75%,'+(5+intensity*65)+'%)';g.fillRect(w-2,y,2,1);}extra=tx(' · hoog ↑ / tijd →');}
              else if(viewMode==='bars'){for(let j=0;j<32;j++){const level=sample(j/31);g.fillStyle=j<20?col.au:col.md;g.fillRect(j*w/32+1,h-level*(h-4),Math.max(1,w/32-2),level*(h-4));}extra=' · 30 Hz → 20 kHz';}
              else{g.strokeStyle=col.au;g.beginPath();for(let x=0;x<w;x++){const y=h-3-sample(x/(w-1))*(h-6);if(x===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();extra=' · 30 Hz → 20 kHz';}
            }else if(viewMode==='wave')line(g,wave,w,h,col.au);
            else if(viewMode==='levels'){for(const [j,dbValue] of [[0,peakDB],[1,rmsDB]]){g.fillStyle=col.ln;g.fillRect(5,12+j*25,w-10,14);g.fillStyle=dbValue>-1?col.st:j===0?col.au:col.md;g.fillRect(5,12+j*25,clamp((dbValue+60)/60,0,1)*(w-10),14);}extra=tx(' · boven piek / onder RMS');}
            else{leftMonitor.getFloatTimeDomainData(waveL);rightMonitor.getFloatTimeDomainData(waveR);let lr=0,ll=0,rr=0;g.strokeStyle=col.au;g.beginPath();for(let j=0;j<waveL.length;j+=2){const l=waveL[j],r=waveR[j],x=w/2+clamp((l-r)*0.5,-1,1)*w*0.45,y=h/2-clamp((l+r)*0.5,-1,1)*h*0.45;if(j===0)g.moveTo(x,y);else g.lineTo(x,y);lr+=l*r;ll+=l*l;rr+=r*r;}g.stroke();extra=hasStereo?tx(' · correlatie ')+(ll*rr>1e-10?(lr/Math.sqrt(ll*rr)).toFixed(2):'—'):tx(' · stereoanalyse niet beschikbaar');}
            overview.stats.textContent=tx('Piek')+' '+peakDB.toFixed(1)+' · RMS '+rmsDB.toFixed(1)+' dBFS'+extra;
          }
        }
        for(const view of slotViews){const c=config.slots[view.index],s=slots[view.index],p=slotValues(view.index),fx=s.fx,cv=view.canvas;
          const response=fx?.responses?.length>0&&fx.responses.every(n=>typeof n.getFrequencyResponse==='function');
          const isRoom=['reverb','hybrid'].includes(c.type),isEcho=['delay','pingpong','freqecho','tempodelay'].includes(c.type),isRhythm=['pump','trancegate','stutter'].includes(c.type);const displayTime=c.type==='tempodelay'?60/clock.bpm*[0.25,0.5,0.75,1,1.5,2,3,4][p.division]:p.time;
          const g=background(cv,(c.bypass?'BYPASS · ':'')+(isRhythm?tx('Ritme')+' · '+clock.bpm.toFixed(0)+' BPM':response?(['autofilter','wobble'].includes(c.type)?tx('Basisfiltercurve'):tx('Filtercurve')):isRoom?tx('IR-envelope · model'):isEcho?tx('Echo-taps · schema'):tx('Uitgang · golfvorm')));if(!g)continue;
          if(isRhythm){const cursor=((Math.floor((ctx.currentTime-clock.origin)/clock.stepDur)%16)+16)%16;for(let j=0;j<16;j++){let value=0.5;if(c.type==='trancegate')value=1-p.depth+p.depth*rhythms[p.pattern][j];else if(c.type==='pump')value=1-p.depth+p.depth*((j%grids[p.grid])/grids[p.grid])**p.recovery;else value=j/16<p.duty?0.85:0.25;g.fillStyle=clock.playing&&j===cursor?col.ev:col.au;g.fillRect(6+j*13,85-value*58,10,Math.max(2,value*58));}g.fillStyle=col.fg;g.fillText(clock.playing?'1        2        3        4':tx('Start hosttransport'),6,97);}
          else if(response){view.response.fill(1);for(let j=0;j<128;j++)view.freq[j]=30*(Math.min(18000,ctx.sampleRate*0.48)/30)**(j/127);for(const n of fx.responses){n.getFrequencyResponse(view.freq,view.mag,view.phase);for(let j=0;j<128;j++)view.response[j]*=view.mag[j];}g.strokeStyle=col.ev;g.beginPath();for(let j=0;j<128;j++){const y=55-clamp(20*Math.log10(Math.max(view.response[j],1e-6)),-36,24);if(j===0)g.moveTo(0,y);else g.lineTo(j/127*218,y);}g.stroke();g.fillStyle=col.fg;g.fillText('30 Hz        1 kHz        18 kHz',6,95);}
          else if(isRoom){const env=irEnvelopes[p.size];if(env){let max=0;for(const v of env)max=Math.max(max,v);g.strokeStyle=col.md;g.beginPath();for(let j=0;j<env.length;j++){const y=23+(1-clamp(env[j]/Math.max(max,1e-8),0,1))*60;if(j===0)g.moveTo(0,y);else g.lineTo(j/(env.length-1)*218,y);}g.stroke();}g.fillStyle=col.fg;g.fillText(tx(rooms[p.size]?.[0])+' · '+rooms[p.size]?.[1]+' s',6,95);}
          else if(isEcho){const feedback=p.feedback||0,maxTime=Math.max(displayTime*6,1);for(let j=0;j<8;j++){const x=(j+1)*displayTime/maxTime*218;if(x>218)break;g.strokeStyle=j%2&&c.type==='pingpong'?col.md:col.au;g.beginPath();g.moveTo(x,85);g.lineTo(x,85-Math.pow(feedback,j)*58);g.stroke();}g.fillStyle=col.fg;g.fillText('0 → '+maxTime.toFixed(1)+' s',6,97);}
          else{s.analyser.getFloatTimeDomainData(view.wave);line(g,view.wave,218,90,col.au,7);}
        }
      }
    }

    function dispose(fx){if(!fx||fx.disposed)return;fx.disposed=true;for(const n of fx.oscs){try{n.stop();}catch{}sources.delete(n);}for(const n of fx.nodes){if('onaudioprocess' in n)n.onaudioprocess=null;try{n.disconnect();}catch{}nodes.delete(n);}}
    function collect(){frame=null;for(let i=retired.length-1;i>=0;i--)if(dead||ctx.currentTime>=retired[i].until){dispose(retired[i].fx);retired.splice(i,1);}if(retired.length&&!dead)frame=setTimeout(collect,100);}
    function retire(fx){if(!fx)return;target(fx.input.gain,0);target(fx.output.gain,0);const until=ctx.currentTime+0.2;for(const o of fx.oscs)try{o.stop(until);}catch{}retired.push({fx,until});while(retired.length>16)dispose(retired.shift().fx);if(frame===null)frame=setTimeout(collect,100);}
    function createDSP(type,get){
      // Single-file streaming implementation. The official mock has no DSP API.
      if(typeof ctx.createScriptProcessor!=='function'){if(typeof ctx.createBuffer(1,1,ctx.sampleRate).length==='number')throw new Error(tx('Deze effecten vereisen ScriptProcessor-ondersteuning in de browser.'));return ctx.createGain();}
      const processor=ctx.createScriptProcessor(1024,2,2),sr=ctx.sampleRate,IN_MAX=64;
      let seed=198401,position=0,historyPosition=0,phase=0,envelope=1,tick=0,noise=0,holdPhase=1;
      const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
      const maxSeconds=type==='stutter'?8.2:['freqecho','grains','freeze','stutter'].includes(type)?4.2:type==='cosmos'?3.2:0.1;
      const length=Math.ceil(sr*maxSeconds)+128;
      const rings=Array.from({length:type==='cosmos'?8:2},()=>new Float32Array(length));
      const history=[new Float32Array(63),new Float32Array(63)],held=new Float64Array(2),low=new Float64Array(8),reads=new Float64Array(8);
      const kernel=new Float64Array(63);for(let k=0;k<63;k++){const n=k-31;kernel[k]=n!==0&&Math.abs(n)%2===1?2/(Math.PI*n)*(0.54-0.46*Math.cos(2*Math.PI*k/62)):0;}
      let frozen=false,recorded=0,frozenLength=0,freezeIndex=0,freezeBlend=0;
      const captured=[new Float32Array(Math.ceil(sr*(type==='stutter'?8:2))),new Float32Array(Math.ceil(sr*(type==='stutter'?8:2)))];
      const grains=Array.from({length:4},(_,j)=>({age:j*0.045*sr,start:0,duration:0.18*sr,active:false}));
      let grainClock=0;
      const scheduleTimes=new Float64Array(64),scheduleLengths=new Float64Array(64),scheduleCycles=new Float64Array(64);let queueRead=0,queueCount=0,stutterUntil=-1,stutterStart=-1,enabled=false;
      processor._clock=info=>{if(type!=='stutter'||(info.bar*16+info.step)%16!==0)return;const index=(queueRead+queueCount)%64;if(queueCount===64){queueRead=(queueRead+1)%64;queueCount--;}scheduleTimes[index]=info.time;scheduleLengths[index]=info.stepDur*grids[get().grid];scheduleCycles[index]=info.stepDur*16;queueCount++;};
      processor._transport=playing=>{enabled=playing;if(!playing){queueCount=0;stutterUntil=-1;}};
      const readCaptured=(data,index,count)=>{const lo=Math.floor(index),hi=(lo+1)%count,f=index-lo;return data[lo]*(1-f)+data[hi]*f;};
      const ratios=[0.71,0.83,1,1.13,1.27,1.41,1.57,1.73];
      const read=(ring,delay)=>{let i=position-delay;while(i<0)i+=length;const a=Math.floor(i)%length,b=(a+1)%length,f=i-Math.floor(i);return ring[a]*(1-f)+ring[b]*f;};
      processor.onaudioprocess=e=>{
        const p=get(),ib=e.inputBuffer,ob=e.outputBuffer;
        const left=ib.getChannelData(0),right=ib.numberOfChannels>1?ib.getChannelData(1):left;
        const outL=ob.getChannelData(0),outR=ob.getChannelData(1);
        const pole=1-Math.exp(-2*Math.PI*Math.min(p.tone||6000,sr*0.45)/sr);
        const ceiling=type==='limiter'?db(p.ceiling):1,boost=db(p.boost||p.drive||0);
        const release=type==='limiter'?Math.exp(-1/(sr*p.release)):0;
        for(let i=0;i<outL.length;i++){
          let l=left[i]||0,r=right[i]||0,a=0,b=0;
          // guard: NaN becomes 0 and Infinity or absurd values are limited, so a bad sample cannot poison the delay memories for good
          if(!(l>-IN_MAX&&l<IN_MAX))l=l>0?IN_MAX:-IN_MAX;
          if(!(r>-IN_MAX&&r<IN_MAX))r=r>0?IN_MAX:-IN_MAX;
          if(type==='stutter'){
            const now=(Number.isFinite(e.playbackTime)?e.playbackTime:ctx.currentTime)+i/sr;
            while(queueCount>0&&scheduleTimes[queueRead]<=now){const wanted=Math.floor(scheduleLengths[queueRead]*sr);frozenLength=Math.min(recorded,wanted,captured[0].length);if(frozenLength>4){for(let j=0;j<frozenLength;j++){const k=(position-frozenLength+j+length)%length;captured[0][j]=rings[0][k];captured[1][j]=rings[1][k];}freezeIndex=0;stutterStart=scheduleTimes[queueRead];stutterUntil=stutterStart+scheduleCycles[queueRead]*p.duty;}queueRead=(queueRead+1)%64;queueCount--;}
            const active=enabled&&now>=stutterStart&&now<stutterUntil&&frozenLength>4;
            freezeBlend+=((active?1:0)-freezeBlend)*0.006;
            rings[0][position]=l;rings[1][position]=r;recorded=Math.min(recorded+1,length-1);
            if(frozenLength>4){const x=p.reverse?(frozenLength-1-freezeIndex+frozenLength)%frozenLength:freezeIndex,w=0.5-0.5*Math.cos(2*Math.PI*x/frozenLength),other=(x+frozenLength/2)%frozenLength;
              const fl=readCaptured(captured[0],x,frozenLength)*w+readCaptured(captured[0],other,frozenLength)*(1-w),fr=readCaptured(captured[1],x,frozenLength)*w+readCaptured(captured[1],other,frozenLength)*(1-w);
              a=l*(1-freezeBlend)+fl*freezeBlend;b=r*(1-freezeBlend)+fr*freezeBlend;freezeIndex=(freezeIndex+1)%frozenLength;
            }else{a=l;b=r;}
          }else if(type==='grains'){
            const duration=Math.max(32,Math.floor(p.grain*sr)),ratio=2**(p.pitch/12);
            if(grainClock<=0){const grain=grains.find(g=>!g.active)||grains.reduce((a,b)=>a.age/a.duration>b.age/b.duration?a:b);grain.age=0;grain.duration=duration;grain.active=true;
              // Safety offset allows read head travel even when pitching upward.
              const delay=(p.time+p.spray*random())*sr+duration*Math.max(0,ratio-1)+4;grain.start=position-delay;while(grain.start<0)grain.start+=length;grainClock=duration/2;}
            grainClock--;let norm=0;
            for(const grain of grains){if(!grain.active)continue;const w=0.5-0.5*Math.cos(2*Math.PI*grain.age/grain.duration);let cursor=(grain.start+grain.age*ratio)%length;if(cursor<0)cursor+=length;const lo=Math.floor(cursor),hi=(lo+1)%length,f=cursor-lo;
              a+=(rings[0][lo]*(1-f)+rings[0][hi]*f)*w;b+=(rings[1][lo]*(1-f)+rings[1][hi]*f)*w;norm+=w;grain.age++;if(grain.age>=grain.duration)grain.active=false;}
            if(norm>1){a/=norm;b/=norm;}rings[0][position]=Math.tanh(l+a*p.feedback);rings[1][position]=Math.tanh(r+b*p.feedback);
          }else if(type==='freeze'){
            const ready=recorded>Math.max(16,sr*0.05);
            if(p.freeze===1&&!frozen&&ready){frozenLength=Math.min(recorded,Math.floor(p.length*sr),captured[0].length);for(let j=0;j<frozenLength;j++){const index=(position-frozenLength+j+length)%length;captured[0][j]=rings[0][index];captured[1][j]=rings[1][index];}freezeIndex=0;frozen=true;}
            if(p.freeze===0)frozen=false;
            rings[0][position]=l;rings[1][position]=r;recorded=Math.min(recorded+1,length-1);
            freezeBlend+=((frozen?1:0)-freezeBlend)*0.002;
            if(frozenLength>0){
              // Two offset Hann-windowed playheads overlap to suppress loop clicks.
              const progress=freezeIndex/frozenLength,w=0.5-0.5*Math.cos(2*Math.PI*progress),other=(freezeIndex+frozenLength/2)%frozenLength;
              
              const fl=readCaptured(captured[0],freezeIndex,frozenLength)*w+readCaptured(captured[0],other,frozenLength)*(1-w),fr=readCaptured(captured[1],freezeIndex,frozenLength)*w+readCaptured(captured[1],other,frozenLength)*(1-w);
              a=l*(1-freezeBlend)+fl*freezeBlend;b=r*(1-freezeBlend)+fr*freezeBlend;freezeIndex=(freezeIndex+p.speed)%frozenLength;
            }else{a=l;b=r;}
          }else if(type==='imager'){
            const mid=(l+r)*0.5,side=(l-r)*0.5,decor=(read(rings[0],p.delay*sr)-mid)*p.stereoize*0.5;
            rings[0][position]=mid;const wide=(side+decor)*p.width,comp=1/Math.sqrt(Math.max(1,(1+p.width*p.width)*0.5));
            a=(mid+wide)*comp;b=(mid-wide)*comp;
          }else if(type==='vinyl'){
            const rpm=[33.333333,45,78][p.rpm];
            const warp=(Math.sin(phase)*0.0038+Math.sin(phase*7.13)*0.0004)*p.warp;
            const delay=(0.008+warp)*sr;rings[0][position]=l;rings[1][position]=r;
            if(random()<p.crackle*0.00012)tick=(random()*2-1)*p.crackle*0.2;
            tick*=0.94;noise=noise*0.7+(random()*2-1)*0.3;
            const dirt=noise*p.dust*0.018+tick;
            a=Math.tanh(read(rings[0],delay)*(1+p.wear*0.7))/(1+p.wear*0.3)+dirt;
            b=Math.tanh(read(rings[1],delay+0.0001*p.warp*sr)*(1+p.wear*0.7))/(1+p.wear*0.3)+dirt;
            phase+=2*Math.PI*(rpm/60)/sr;
          }else if(type==='crush'){
            const rate=Math.min(sr,p.rate*Math.max(0.08,1+p.mod*0.85*Math.sin(phase)));
            holdPhase+=rate/sr;
            if(holdPhase>=1){holdPhase%=1;const levels=2**(p.bits-1),drop=random()<p.glitch*0.3;
              held[0]=drop?0:Math.round(clamp(l*boost,-1,1)*levels)/levels;
              held[1]=drop?0:Math.round(clamp(r*boost,-1,1)*levels)/levels;
              holdPhase-=random()*p.glitch*0.6;
            }
            a=held[0]*0.8;b=held[1]*0.8;phase+=2*Math.PI*p.speed/sr;if(phase>2*Math.PI)phase-=2*Math.PI;
          }else if(type==='limiter'){
            l*=boost;r*=boost;const peak=Math.max(Math.abs(l),Math.abs(r)),desired=peak>ceiling?ceiling/peak:1;
            envelope=desired<envelope?desired:release*envelope+(1-release)*desired;
            const dl=read(rings[0],sr*0.005),dr=read(rings[1],sr*0.005);rings[0][position]=l;rings[1][position]=r;
            // Guaranteed sample ceiling, including the first overshoot and recovery.
            a=clamp(dl*envelope,-ceiling,ceiling);b=clamp(dr*envelope,-ceiling,ceiling);
          }else if(type==='freqecho'){
            const hpos=historyPosition;historyPosition=(historyPosition+1)%63;
            for(let c=0;c<2;c++){
              const echo=read(rings[c],p.time*sr);low[c]+=(echo-low[c])*pole;
              const sample=(c===0?l:r)+low[c]*p.feedback;history[c][hpos]=sample;
              let q=0;for(let k=0;k<63;k++)q+=kernel[k]*history[c][(hpos-k+63)%63];
              const real=history[c][(hpos-31+63)%63];
              // Analytic/Hilbert single-sideband shift, not musical pitch shifting.
              const shifted=real*Math.cos(phase)-q*Math.sin(phase);
              rings[c][position]=clamp(shifted,-4,4);if(c===0)a=low[c];else b=low[c];
            }
            phase+=2*Math.PI*p.shift/sr;if(phase>Math.PI)phase-=2*Math.PI;if(phase<-Math.PI)phase+=2*Math.PI;
          }else if(type==='cosmos'){
            let sum=0;
            for(let j=0;j<8;j++){
              const modulation=Math.sin(phase*(1+j*0.037)+j*1.7)*p.mod*sr*0.004;
              const delay=clamp(p.time*sr*ratios[j]+modulation,2,length-2);
              const v=read(rings[j],delay);low[j]+=(v-low[j])*pole;reads[j]=low[j];sum+=low[j];
            }
            for(let j=0;j<8;j++){
              // Householder diffusion is energy-preserving; feedback remains <1.
              const diffuse=sum*0.25-reads[j],v=reads[j]*(1-p.diffusion)+diffuse*p.diffusion;
              const injection=((j%2===0?l:r)+(j%3===0?-r:l)*0.25)*0.2;
              rings[j][position]=clamp(injection+v*p.feedback,-8,8);
              a+=reads[j]*(j%2===0?0.32:0.12);b+=reads[j]*(j%2===1?0.32:0.12);
            }
            const mid=(a+b)*0.5,side=(a-b)*0.5*p.width;a=mid+side;b=mid-side;
            phase+=2*Math.PI*0.09/sr;
          }
          // Fail closed: never pass a non-finite value on.
          outL[i]=Number.isFinite(a)?a:0;outR[i]=Number.isFinite(b)?b:0;
          position=(position+1)%length;
        }
        // guard: a derailed state resets instead of staying silent for good
        if(!Number.isFinite(envelope)||!Number.isFinite(phase)||!Number.isFinite(noise)||!Number.isFinite(tick)||!Number.isFinite(holdPhase)||!Number.isFinite(freezeBlend)||!Number.isFinite(freezeIndex)||!Number.isFinite(grainClock)){envelope=1;phase=0;noise=0;tick=0;holdPhase=1;freezeBlend=0;freezeIndex=0;grainClock=0;}
        for(let j=0;j<8;j++){if(!Number.isFinite(low[j]))low[j]=0;}
        for(let j=0;j<2;j++){if(!Number.isFinite(held[j]))held[j]=0;}
      };
      return processor;
    }

    function effect(type){
      const bag=[],oscs=[];const inlet=gain(1,bag),outlet=gain(0,bag);
      const fx={responses:[],type,input:inlet,output:outlet,nodes:bag,oscs,update:()=>{}};
      const g=v=>gain(v,bag), f=(t,h)=>filter(t,h,bag), node=n=>own(n,bag);
      const lfo=()=>{const o=node(ctx.createOscillator());oscs.push(o);sources.add(o);o.start();return o;};
      if(type==='none')inlet.connect(outlet);
      else if(type==='filter'){const n=f('lowpass',2400);inlet.connect(n).connect(outlet);fx.responses=[n];fx.update=p=>{n.type=['lowpass','highpass','bandpass'][p.mode];target(n.frequency,p.cutoff);target(n.Q,p.resonance);};}
      else if(type==='eq'){const a=f('lowshelf',180),b=f('peaking',1000),c=f('highshelf',4500);b.Q.value=0.7;fx.responses=[a,b,c];inlet.connect(a).connect(b).connect(c).connect(outlet);fx.update=p=>{target(a.gain,p.low);target(b.gain,p.mid);target(c.gain,p.high);target(b.frequency,p.freq);};}
      else if(type==='delay'){const d=node(ctx.createDelay(2.1)),lp=f('lowpass',3500),fb=g(0.35);inlet.connect(d);d.connect(lp);lp.connect(fb).connect(d);lp.connect(outlet);fx.update=p=>{target(d.delayTime,p.time);target(lp.frequency,p.tone);target(fb.gain,p.feedback);};}
      else if(type==='pingpong'){const a=node(ctx.createDelay(1.6)),b=node(ctx.createDelay(1.6)),la=f('lowpass',3200),lb=f('lowpass',3200),fa=g(0.4),fb=g(0.4),pa=node(ctx.createStereoPanner()),pb=node(ctx.createStereoPanner());
        // Mono echo excitation; dry path and other effects preserve stereo.
        const mono=g(1);mono.channelCount=1;mono.channelCountMode='explicit';inlet.connect(mono).connect(a);a.connect(la);la.connect(fa).connect(b);b.connect(lb);lb.connect(fb).connect(a);la.connect(pa).connect(outlet);lb.connect(pb).connect(outlet);
        fx.update=p=>{target(a.delayTime,p.time);target(b.delayTime,p.time);target(fa.gain,p.feedback);target(fb.gain,p.feedback);target(la.frequency,p.tone);target(lb.frequency,p.tone);target(pa.pan,-p.width);target(pb.pan,p.width);};}
      else if(type==='reverb'){const d=node(ctx.createDelay(0.3)),c=node(ctx.createConvolver()),lp=f('lowpass',6500);let size=-1;inlet.connect(d).connect(c).connect(lp).connect(outlet);fx.update=p=>{if(p.size!==size){c.buffer=impulse(p.size);size=p.size;}target(d.delayTime,p.predelay);target(lp.frequency,p.tone);};}
      else if(type==='chorus'){const sides=[];for(let i=0;i<2;i++){const d=node(ctx.createDelay(0.1)),pan=node(ctx.createStereoPanner()),o=lfo(),depth=g(0.003),half=g(0.5);o.type='sine';o.connect(depth).connect(d.delayTime);inlet.connect(d).connect(pan).connect(half).connect(outlet);sides.push({d,pan,o,depth,i});}
        fx.update=p=>{for(const s of sides){target(s.d.delayTime,0.018+s.i*0.006);target(s.o.frequency,p.rate*(s.i?1.17:1));target(s.depth.gain,p.depth*0.007);target(s.pan.pan,(s.i?1:-1)*p.width);}};}
      else if(type==='flanger'){const d=node(ctx.createDelay(0.05)),fb=g(0.3),lp=f('lowpass',7500),o=lfo(),depth=g(0.002);inlet.connect(d);d.connect(lp).connect(fb).connect(d);d.connect(outlet);o.connect(depth).connect(d.delayTime);d.delayTime.value=0.004;fx.update=p=>{target(o.frequency,p.rate);target(depth.gain,p.depth*0.0035);target(fb.gain,p.feedback);};}
      else if(type==='phaser'){const all=[],o=lfo();let last=inlet;for(let i=0;i<4;i++){const a=f('allpass',800),depth=g(100);last.connect(a);last=a;o.connect(depth).connect(a.frequency);all.push({a,depth,i});}last.connect(outlet);fx.update=p=>{target(o.frequency,p.rate);for(const s of all){const center=p.center*(0.55+s.i*0.4);target(s.a.frequency,center);target(s.depth.gain,center*p.depth*0.8);}};}
      else if(type==='tremolo'){const v=g(0.75),o=lfo(),depth=g(0.25);inlet.connect(v).connect(outlet);o.connect(depth).connect(v.gain);fx.update=p=>{target(v.gain,1-p.depth/2);target(depth.gain,p.depth/2);target(o.frequency,p.rate);};}
      else if(type==='autopan'){const pan=node(ctx.createStereoPanner()),o=lfo(),depth=g(0.75);inlet.connect(pan).connect(outlet);o.connect(depth).connect(pan.pan);fx.update=p=>{target(o.frequency,p.rate);target(depth.gain,p.depth);};}
      else if(type==='saturation'){const drive=g(1),shape=node(ctx.createWaveShaper()),lp=f('lowpass',6000),trim=g(0.7);shape.curve=satCurve;shape.oversample='2x';inlet.connect(drive).connect(shape).connect(lp).connect(trim).connect(outlet);fx.update=p=>{target(drive.gain,db(p.drive));target(lp.frequency,p.tone);target(trim.gain,db(p.trim)/Math.sqrt(db(p.drive)));};}
      else if(type==='compressor'){const c=node(ctx.createDynamicsCompressor()),makeup=g(1);c.knee.value=12;inlet.connect(c).connect(makeup).connect(outlet);fx.update=p=>{target(c.threshold,p.threshold);target(c.ratio,p.ratio);target(c.attack,p.attack);target(c.release,p.release);target(makeup.gain,db(p.makeup));};}
      else if(type==='distortion'||type==='overdrive'){
        const drive=g(1),shape=node(ctx.createWaveShaper()),lp=f('lowpass',5000),trim=g(0.3),dc=f('highpass',25);shape.oversample='2x';let bias=-1;inlet.connect(drive).connect(shape).connect(dc).connect(lp).connect(trim).connect(outlet);
        fx.update=p=>{if(bias!==(p.bias||0)){bias=p.bias||0;const a=new Float32Array(2049);for(let i=0;i<a.length;i++){const x=2*i/(a.length-1)-1;a[i]=type==='distortion'?clamp(x*3,-0.85,0.85):0.8*(Math.tanh((x+bias)*2.5)-Math.tanh(bias*2.5));}shape.curve=a;}target(drive.gain,db(p.drive));target(lp.frequency,p.tone);target(trim.gain,db(p.trim));};
      }
      else if(type==='autofilter'){const n=f('lowpass',1800),o=lfo(),depth=g(1200);inlet.connect(n).connect(outlet);o.connect(depth).connect(n.detune);fx.responses=[n];fx.update=p=>{n.type=['lowpass','highpass','bandpass'][p.mode];target(n.frequency,p.cutoff);target(n.Q,p.resonance);target(o.frequency,p.rate);target(depth.gain,p.depth*1200);};}
      else if(type==='resonator'){
        const bank=[];for(let j=0;j<5;j++){const d=node(ctx.createDelay(0.1)),lp=f('lowpass',4500),feedback=g(0.9),level=g(0.22),pan=node(ctx.createStereoPanner());lp.Q.value=-3.0103;inlet.connect(d);d.connect(lp).connect(feedback).connect(d);lp.connect(level).connect(pan).connect(outlet);bank.push({d,lp,feedback,level,pan,j});}
        fx.update=p=>{const chord=[[0,7,12,16,19],[0,3,7,10,14],[0,5,7,12,19],[0,4,7,11,14]][p.chord];for(const v of bank){const freq=440*2**((p.root+chord[v.j]-69)/12),period=1/freq,fb=Math.min(0.995,10**(-3*period/p.decay));target(v.d.delayTime,period);target(v.lp.frequency,Math.min(p.tone,ctx.sampleRate*0.45));target(v.feedback.gain,fb);target(v.level.gain,0.28*Math.sqrt(1-fb*fb));target(v.pan.pan,(v.j/2-1)*p.width);}};
      }
      else if(type==='ringmod'){const v=g(0),o=lfo(),depth=g(1);inlet.connect(v).connect(outlet);o.connect(depth).connect(v.gain);fx.update=p=>{target(o.frequency,p.frequency);target(v.gain,1-p.depth);target(depth.gain,p.depth);};}
      else if(type==='hybrid'){
        const c=node(ctx.createConvolver()),a=g(0.5),b=g(0.5),lp=f('lowpass',5500);let values=params('cosmos'),size=-1;const algorithm=node(createDSP('cosmos',()=>values));inlet.connect(c).connect(a).connect(lp);inlet.connect(algorithm).connect(b).connect(lp);lp.connect(outlet);
        fx.update=p=>{if(size!==p.size){c.buffer=impulse(p.size);size=p.size;}target(a.gain,1-p.balance);target(b.gain,p.balance);target(lp.frequency,p.tone);values={...params('cosmos'),time:p.time,feedback:p.feedback,tone:p.tone};};
      }
      else if(type==='shimmer'){
        let grains=params('grains'),space=params('cosmos');const pitch=node(createDSP('grains',()=>grains)),cloud=node(createDSP('cosmos',()=>space));inlet.connect(pitch).connect(cloud).connect(outlet);
        fx.update=p=>{grains={...params('grains'),pitch:p.pitch,grain:p.grain,time:0.08,spray:0.02,feedback:0.1};space={...params('cosmos'),time:p.time,feedback:p.feedback,tone:p.tone};};
      }
      else if(type==='pump'||type==='trancegate'||type==='wobble'){
        const v=type==='wobble'?f('lowpass',700):g(1);inlet.connect(v).connect(outlet);if(type==='wobble')fx.responses=[v];let values=params(type);
        const reset=()=>{const param=type==='wobble'?v.detune:v.gain;param.cancelScheduledValues(ctx.currentTime);target(param,type==='wobble'?0:1);};
        fx.update=p=>{values={...p};if(type==='wobble'){target(v.frequency,p.cutoff);target(v.Q,p.resonance);}if(!clock.playing)reset();};fx.transport=playing=>{if(!playing)reset();};
        fx.clock=info=>{const p=values,absolute=info.bar*16+info.step,t=info.time;
          if(type==='trancegate'){const open=rhythms[p.pattern][absolute%16],floor=1-p.depth;v.gain.cancelScheduledValues(t);v.gain.setTargetAtTime(open?1:floor,t,0.002);if(open)v.gain.setTargetAtTime(floor,t+info.stepDur*p.length,0.002);}
          else{const steps=grids[p.grid];if(absolute%steps!==0)return;const duration=steps*info.stepDur,param=type==='wobble'?v.detune:v.gain;param.cancelScheduledValues(t);
            for(let j=0;j<=16;j++){const fraction=j/16,value=type==='wobble'?Math.sin(2*Math.PI*fraction)*p.depth*1200:1-p.depth+p.depth*fraction**p.recovery;if(j===0){param.setValueAtTime(type==='pump'?1:value,t);if(type==='pump')param.linearRampToValueAtTime(1-p.depth,t+0.003);}else param.linearRampToValueAtTime(value,t+(type==='pump'?0.003+(duration-0.003)*fraction:duration*fraction));}
          }
        };
      }
      else if(type==='tempodelay'){
        const d=node(ctx.createDelay(8.1)),lp=f('lowpass',4000),fb=g(0.45);inlet.connect(d);d.connect(lp);lp.connect(fb).connect(d);lp.connect(outlet);let values=params(type),last=-1;
        const sync=(bpm,time)=>{const seconds=60/bpm*[0.25,0.5,0.75,1,1.5,2,3,4][values.division];if(seconds!==last){d.delayTime.setTargetAtTime(seconds,time,0.03);last=seconds;}};
        fx.update=p=>{values={...p};target(fb.gain,p.feedback);target(lp.frequency,p.tone);sync(clock.bpm,ctx.currentTime);};fx.clock=info=>sync(info.bpm,info.time);
      }
      else if(type==='multiband'){
        const bands=[];for(let j=0;j<3;j++){let last=inlet;if(j>0){const hp=f('highpass',j===1?220:2800);last.connect(hp);last=hp;}if(j<2){const lp=f('lowpass',j===0?220:2800);last.connect(lp);last=lp;}const drive=g(1),shape=node(ctx.createWaveShaper()),trim=g(0.3);shape.curve=satCurve;shape.oversample='2x';last.connect(drive).connect(shape).connect(trim).connect(outlet);bands.push({drive,trim,j});}
        fx.update=p=>{for(const b of bands){const amount=db(p[['low','mid','high'][b.j]]);target(b.drive.gain,amount);target(b.trim.gain,db(p.trim)*0.55/Math.sqrt(amount));}};
      }
      else if(['imager','vinyl','freqecho','cosmos','crush','limiter','grains','freeze','stutter'].includes(type)){
        let values=params(type);const process=createDSP(type,()=>values);bag.push(process);nodes.add(process);
        inlet.connect(process);let last=process;if(type==='stutter'){fx.clock=info=>process._clock?.(info);fx.transport=playing=>process._transport?.(playing);process._transport?.(clock.playing);}
        if(type==='vinyl'||type==='crush'){const hp=f('highpass',type==='vinyl'?45:20),lp=f('lowpass',10000);last.connect(hp).connect(lp);last=lp;fx.update=p=>{values={...p};target(lp.frequency,type==='vinyl'?14000-p.wear*12500:p.tone);};}
        else fx.update=p=>{values={...p};};
        last.connect(outlet);
      }
      return fx;
    }
    // Stable physical slots; only internal effects change, external ports never move.
    for(let i=0;i<MAX;i++){const inlet=gain(),outlet=gain(),bypass=gain(1),analyser=own(ctx.createAnalyser());analyser.fftSize=512;outlet.connect(analyser);inlet.connect(bypass).connect(outlet);slots.push({input:inlet,output:outlet,dry:bypass,fx:null,analyser});if(i===0)pre.connect(inlet);else slots[i-1].output.connect(inlet);}
    slots[MAX-1].output.connect(wet);
    function applySlot(i){const c=config.slots[i],s=slots[i];const type=i<config.count?c.type:'none';
      if(!s.fx||s.fx.type!==type){if(s.fx){try{s.input.disconnect(s.fx.input);}catch{}retire(s.fx);}s.fx=type==='none'?null:effect(type);if(s.fx){s.input.connect(s.fx.input);s.fx.output.connect(s.output);s.fx.transport?.(clock.playing);}}
      const enabled=i<config.count&&!c.bypass&&type!=='none',mix=enabled?value(prefix(i)+'.mix',c.mix,0,1):0;target(s.dry.gain,1-mix);
      if(s.fx){s.fx.update(slotValues(i));target(s.fx.output.gain,mix);}
    }
    function apply(){if(dead)return;if(!clock.playing)clock.bpm=number(host.bpm,30,300,clock.bpm);target(pre.gain,db(value('input',config.input,-12,12)));target(post.gain,db(value('output',config.output,-12,12)));const blend=value('blend',config.blend,0,1);target(dry.gain,1-blend);target(wet.gain,blend);for(let i=0;i<MAX;i++)applySlot(i);notifyParameters();}
    function customized(){config.preset='Custom';if(ui.preset)ui.preset.value='Custom';}
    const presets={
      'Ambient Space':()=>initial(),
      'Bright Sky':()=>({...initial(),slots:[slot('eq',1),slot('chorus',0.4),slot('pingpong',0.22),slot('reverb',0.45),...Array.from({length:4},()=>slot())]}),
      'Deep Mist':()=>{const c=initial();c.slots[0]=slot('filter',1);c.slots[0].bank.filter.cutoff=1200;c.slots[1]=slot('chorus',0.5);c.slots[2]=slot('reverb',0.6);c.slots[2].bank.reverb.size=2;c.slots[3]=slot('autopan',0.65);return c;},
      'Warm Tape':()=>{const c=initial();c.slots[0]=slot('saturation',0.35);c.slots[1]=slot('delay',0.3);c.slots[1].bank.delay.tone=1700;c.slots[2]=slot('reverb',0.25);c.slots[3]=slot('compressor',1);return c;},
      'Slow Waves':()=>{const c=initial();c.slots[0]=slot('phaser',0.4);c.slots[1]=slot('tremolo',0.7);c.slots[1].bank.tremolo.rate=0.15;c.slots[2]=slot('pingpong',0.25);c.slots[3]=slot('reverb',0.4);return c;},
      'Cosmic Sea':()=>{const c=initial();c.slots=[slot('imager',1),slot('cosmos',0.5),slot('reverb',0.25),slot('limiter',1),...Array.from({length:4},()=>slot())];c.slots[2].bank.reverb.size=11;return c;},
      'Forgotten Record':()=>{const c=initial();c.slots=[slot('vinyl',1),slot('overdrive',0.25),slot('delay',0.25),slot('reverb',0.3),...Array.from({length:4},()=>slot())];c.slots[3].bank.reverb.size=6;return c;},
      'Psychedelic Echo':()=>{const c=initial();c.slots=[slot('freqecho',0.45),slot('cosmos',0.35),slot('imager',1),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'Digital Dreams':()=>{const c=initial();c.slots=[slot('crush',0.45),slot('chorus',0.3),slot('cosmos',0.5),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'Crystal Garden':()=>{const c=initial();c.slots=[slot('resonator',0.45),slot('grains',0.3),slot('shimmer',0.4),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'Endless Cloud':()=>{const c=initial();c.slots=[slot('freeze',1),slot('autofilter',0.8),slot('hybrid',0.5),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'EDM · Wide Lead':()=>{const c=initial();c.slots=[slot('imager',1),slot('tempodelay',0.25),slot('pump',1),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'Techno · Rumble':()=>{const c=initial();c.count=5;c.slots=[slot('reverb',0.65),slot('distortion',0.5),slot('filter',1),slot('pump',1),slot('limiter',1),...Array.from({length:3},()=>slot())];c.slots[0].bank.reverb.size=0;c.slots[2].bank.filter.cutoff=180;c.slots[3].bank.pump.depth=0.95;return c;},
      'Trance · Gate':()=>{const c=initial();c.slots=[slot('trancegate',1),slot('tempodelay',0.3),slot('reverb',0.2),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'EDM · Glitch Break':()=>{const c=initial();c.slots=[slot('stutter',1),slot('crush',0.3),slot('tempodelay',0.25),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'Techno · Wobble Bass':()=>{const c=initial();c.slots=[slot('wobble',1),slot('multiband',0.7),slot('pump',1),slot('limiter',1),...Array.from({length:4},()=>slot())];return c;},
      'Empty Chain':()=>({...initial(),slots:Array.from({length:MAX},()=>slot())})
    };
    const fmt=(v,unit)=>unit==='%'?Math.round(v*100)+'%':unit==='size'?tx(rooms[v][0]):unit==='mode'?['Low-pass','High-pass','Band-pass'][v]:unit==='Hz'?(v<10?v.toFixed(2):Math.round(v))+' Hz':unit==='s'?(v<0.1?Math.round(v*1000)+' ms':v.toFixed(2)+' s'):v.toFixed(1)+' '+unit;
    const text=(tag,str,parent,css)=>{const el=document.createElement(tag);el.textContent=str;if(css)el.style.cssText=css;parent.appendChild(el);return el;};
    function render(){if(dead)return;notifyParameters();if(!root)return;stopDrawing();if(ro)ro.disconnect();ro=typeof ResizeObserver==='function'?new ResizeObserver(es=>{for(const e of es)e.target._cw=e.contentRect.width;}):null;root.innerHTML='';ui={};slotViews=[];
      text('div','EFFECT CHAIN · techno / EDM / ambient',root,'font-size:12px;letter-spacing:1px;color:var(--muted);padding:8px 0');
      ui.preset=host.ui.select(root,tx('Keten'),Object.keys(presets).map(k=>[k,k]).concat([['Custom',tx('Eigen keten')]]),config.preset,v=>{if(presets[v]){config=presets[v]();config.preset=v;apply();render();}});
      host.ui.select(root,tx('Aantal'),Array.from({length:MAX},(_,i)=>[String(i+1),String(i+1)]),String(config.count),v=>{config.count=number(+v,1,MAX,4,1);customized();apply();render();});
      const levels=text('div','',root,'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:2px 18px');
      for(const [k,label,range] of [['input','Ingang',[-12,12,0.5]],['output','Uitgang',[-12,12,0.5]],['blend','Totale mix',[0,1,0.01]]])host.ui.knob(levels,tx(label),range,config[k],v=>fmt(v,k==='blend'?'%':'dB'),v=>{config[k]=number(v,range[0],range[1],config[k],range[2]);customized();apply();});
      text('p',tx('Paarse Mod-ingang → Master en effectparameters per slot. Knoppen blijven de basis; keuzelijsten worden niet gemoduleerd.'),root,'font-size:12px;color:var(--mod);line-height:1.5');
      mountOverview();
      text('p',tx('IN → 1 → 2 → … → UIT · schuif horizontaal voor alle slots'),root,'font-size:11px;opacity:.7;margin:8px 0');
      const strip=text('div','',root,'display:flex;flex-direction:row;gap:8px;overflow-x:auto;max-width:100%;padding:4px 2px 12px;scroll-snap-type:x proximity');strip.setAttribute('aria-label',tx('Effectketen van links naar rechts'));strip.setAttribute('tabindex','0');
      for(let i=0;i<config.count;i++){
        const c=config.slots[i],card=text('section','',strip,'flex:0 0 218px;min-width:0;scroll-snap-align:start;border:1px solid var(--line);border-radius:8px;padding:9px;background:var(--card-2)');
        text('strong','SLOT '+(i+1)+(i<config.count-1?' →':''),card,'font-size:11px;color:var(--muted)');
        const row=text('div','',card,'display:flex;gap:6px;margin:7px 0');
        const bypass=text('button',c.bypass?tx('Bypass aan'):tx('Effect aan'),row);bypass.type='button';bypass.setAttribute('aria-pressed',String(c.bypass));bypass.addEventListener('click',()=>{c.bypass=!c.bypass;customized();applySlot(i);render();});
        for(const [label,delta] of [['←',-1],['→',1]]){const b=text('button',label,row);b.type='button';b.disabled=i+delta<0||i+delta>=config.count;b.setAttribute('aria-label',tx(delta<0?'Verplaats slot {0} links':'Verplaats slot {0} rechts',i+1));b.addEventListener('click',()=>{const j=i+delta;if(j<0||j>=config.count)return;[config.slots[i],config.slots[j]]=[config.slots[j],config.slots[i]];customized();apply();render();});}
        host.ui.select(card,'Effect',[['reverb',nm('reverb')],...Object.entries(defs).filter(([k])=>k!=='reverb').map(([k,d])=>[k,tx(d.name)])],c.type,v=>{if(!Object.hasOwn(defs,v))return;c.type=v;if(v==='limiter')c.mix=1;if(!c.bank[v])c.bank[v]=params(v);customized();applySlot(i);render();});
        mountSlotView(card,i);
        if(c.type==='none'){text('p',tx('Onbewerkt signaal naar het volgende slot.'),card,'font-size:12px;opacity:.65');continue;}
        host.ui.knob(card,tx('Effectmix'),[0,1,0.01],c.mix,v=>fmt(v,'%'),v=>{c.mix=number(v,0,1,c.mix,0.01);customized();applySlot(i);});
                if(DESC_NL[c.type])text('p',(host.lang==='nl'?DESC_NL:DESC_EN)[c.type],card,'font-size:11px;line-height:1.4;opacity:.7');
        text('div',tx('Parameters')+' · '+nm(c.type),card,'font-size:11px;opacity:.7;border-top:1px solid var(--line);padding-top:8px;margin-top:6px');
        for(const [k,d] of Object.entries(defs[c.type].p)){
          const update=v=>{c.bank[c.type][k]=number(+v,d[1],d[2],d[4],d[3]);customized();applySlot(i);};
          if(d[5]==='size'||d[5]==='mode'||d[5]==='rpm'||d[5]==='freeze'||d[5]==='chord'||['grid','pattern','division','reverse'].includes(d[5])){const names=d[5]==='grid'?gridNames:d[5]==='pattern'?['Offbeat','Syncopen','Tresillo','Broken']:d[5]==='division'?['1/16','1/8','1/8 gepunt','1/4','1/4 gepunt','1/2','1/2 gepunt','1 maat']:d[5]==='reverse'?['Vooruit','Achteruit']:d[5]==='size'?rooms.map(r=>tx(r[0])+' · '+r[1]+' s'):d[5]==='rpm'?['33⅓ RPM','45 RPM','78 RPM']:d[5]==='freeze'?['Live opnemen','Bevroren']:d[5]==='chord'?['Open / majeur','Mineur 9','Sus','Majeur 9']:['Low-pass','High-pass','Band-pass'];host.ui.select(card,tx(d[0]),names.map((n,j)=>[String(j),d[5]==='size'?n:tx(n)]),String(c.bank[c.type][k]),update);}
          else host.ui.knob(card,tx(d[0]),[d[1],d[2],d[3]],c.bank[c.type][k],v=>fmt(v,d[5]),update);
        }
      }
      startDraw();
      text('p',tx('Mix per slot mengt droog en effect. Verborgen slots blijven bewaard. Effectwissels onthouden hun parameters; wisselen of verplaatsen wist de effectstaart. Galm/echo lopen door als transport stopt. Limiter: zet slotmix en totale mix op 100%, uitgang op 0 dB; plaats hem als laatste.'),root,'font-size:11px;line-height:1.5;opacity:.7;margin:6px 0');
    }
    const self={
      params(){return descriptors();},
      modulate(offsets){if(dead)return;const next={};if(offsets&&typeof offsets==='object'&&!Array.isArray(offsets))for(const p of descriptors()){const n=offsets[p.id];if(typeof n==='number'&&Number.isFinite(n))next[p.id]=clamp(n,-1,1);}modulation=next;apply();},
      inputs:{in:input},outputs:{out:output},
      onStep(info){try{if(dead||!clock.playing||!info||!Number.isFinite(info.time)||!Number.isInteger(info.step)||info.step<0||info.step>15||!Number.isInteger(info.bar)||info.bar<0||!Number.isFinite(info.stepDur)||info.stepDur<=0)return;
        const absolute=info.bar*16+info.step;if(absolute===clock.last)return;clock.last=absolute;const bpm=clamp(Number.isFinite(info.bpm)?info.bpm:60/(info.stepDur*4),30,300),stepDur=60/(bpm*4);clock.bpm=bpm;clock.stepDur=stepDur;clock.origin=info.time-absolute*stepDur;
        const event={step:info.step,bar:info.bar,time:Math.max(ctx.currentTime,info.time),bpm,stepDur};for(let i=0;i<config.count;i++)if(!config.slots[i].bypass)slots[i].fx?.clock?.(event);
      }catch{}},
      onTransport(info){if(dead)return;clock.playing=!!info?.playing;clock.last=-1;for(const s of slots)s.fx?.transport?.(clock.playing);},
      mount(el){if(root&&root!==el)root.innerHTML='';root=el;if(typeof window.addEventListener==='function')window.addEventListener('patchkamer-skin',onSkin);render();},
      unmount(){if(root)root.innerHTML='';root=null;ui={};overview=null;slotViews=[];stopDrawing();if(ro){ro.disconnect();ro=null;}if(typeof window.removeEventListener==='function')window.removeEventListener('patchkamer-skin',onSkin);col=null;},
      getState(){return {viewMode,count:config.count,input:config.input,output:config.output,blend:config.blend,preset:config.preset,types:config.slots.map(s=>s.type),bypass:config.slots.map(s=>s.bypass),mixes:config.slots.map(s=>s.mix),settings:config.slots.map(s=>JSON.stringify(Object.fromEntries(Object.keys(defs).filter(k=>Object.hasOwn(s.bank,k)).map(k=>[k,s.bank[k]]))))};},
      getPreset(){const p=self.getState();delete p.viewMode;return p;},
      setPreset(p){self.setState({...((p&&typeof p==='object')?p:{}),viewMode});},
      setState(raw){if(dead)return;const s=raw&&typeof raw==='object'?raw:{},next=initial();viewMode=visualModes.some(([key])=>key===s.viewMode)?s.viewMode:'spectrum';
        next.count=number(s.count,1,MAX,4,1);next.input=number(s.input,-12,12,0,0.5);next.output=number(s.output,-12,12,0,0.5);next.blend=number(s.blend,0,1,1,0.01);const pn=typeof s.preset==='string'?(Object.hasOwn(LEGACY_PRESET,s.preset)?LEGACY_PRESET[s.preset]:s.preset):'';next.preset=pn==='Custom'||(pn&&Object.hasOwn(presets,pn))?pn:next.preset;
        for(let i=0;i<MAX;i++){const c=next.slots[i];if(Array.isArray(s.types)&&Object.hasOwn(defs,s.types[i]))c.type=s.types[i];if(Array.isArray(s.bypass)&&typeof s.bypass[i]==='boolean')c.bypass=s.bypass[i];if(Array.isArray(s.mixes))c.mix=number(s.mixes[i],0,1,c.mix,0.01);
          let bank={};if(Array.isArray(s.settings)&&typeof s.settings[i]==='string'&&s.settings[i].length<16000)try{bank=JSON.parse(s.settings[i]);}catch{}c.bank={};
          for(const type of Object.keys(defs))if(bank&&Object.hasOwn(bank,type))c.bank[type]=params(type,bank[type]);if(!c.bank[c.type])c.bank[c.type]=params(c.type);
        }
        config=next;notifyParameters();apply();render();
      },
      destroy(){if(dead)return;dead=true;self.unmount();if(frame!==null)clearTimeout(frame);frame=null;if(watch!==null)clearInterval(watch);watch=null;for(const o of sources)try{o.stop();}catch{}for(const n of nodes)try{if('onaudioprocess' in n)n.onaudioprocess=null;n.disconnect();}catch{}nodes.clear();sources.clear();retired.length=0;slots=[];}
    };
    // Watchdog for the native filters and delay loops: a single Infinity or NaN sample leaves a filter in a feedback loop broken for good.
    // Every ~50 ms the slot outputs and the master are checked; a slot that shows a non-finite or absurd sample is rebuilt
    // (its tail is lost), the protection compressor is replaced. Not needed (and not started) in an OfflineAudioContext.
    const guardBuf=new Float32Array(1024);
    const runaway=an=>{an.getFloatTimeDomainData(guardBuf);const n=Math.min(guardBuf.length,an.fftSize);for(let i=0;i<n;i++){const v=guardBuf[i];if(!(v>-GUARD_MAX&&v<GUARD_MAX))return true;}return false;};
    function guardTick(){
      if(dead||ctx.state!=='running')return;
      for(let i=0;i<slots.length;i++){const s=slots[i];if(s.fx&&runaway(s.analyser)){try{s.input.disconnect(s.fx.input);}catch{}dispose(s.fx);s.fx=null;applySlot(i);}}
      if(runaway(monitor)){try{post.disconnect(protection);}catch{}try{protection.disconnect();}catch{}nodes.delete(protection);protection=makeProtection();post.connect(protection).connect(output);}
    }
    if(!(typeof OfflineAudioContext==='function'&&ctx instanceof OfflineAudioContext))watch=setInterval(guardTick,50);
    apply();hostReady=true;return self;
  }
};
