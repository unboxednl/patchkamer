// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.2 — Alle continue regelaars zijn stuurbaar: de fijnstemmingen, alle FM- en PWM-schuiven van de VCO's, Filter fijn, alle filter- en VCA-ingangen en CV-schuiven, S/H-niveau, Volger- en
//   Voorversterkerniveau, de inverters, de mixer, het volume links/rechts en Portamento, Toonafstand en Stemming van het klavier stonden niet in params(). Nu wel (38 erbij, alle standaard uit).
//   De knopstand en de bewaarde instellingen blijven je basis; klank en instellingen zonder modulatie zijn ongewijzigd. Bewust weggelaten: de schakelaars en keuzes (VCO-bereik, Ringmod koppeling,
//   Poortbron, Voorversterker bereik, Portamento aan, Toonafstand aan, Stemming aan).
// 1.11.1 — Verbeterd: een aangehouden toets (Keys in de stand "Toets vasthouden", of een MIDI-toetsenbord) werd nooit losgelaten, omdat noteoff werd genegeerd en de noot 120 s bleef staan; daardoor bleef de laagste ingedrukte toets de toonhoogte bepalen en klonk elke toets hetzelfde. noteon, noteoff, held en panic worden nu verwerkt.
// 1.11.0 — Nieuw als Patchbay Synth (nieuwe id nl.patchkamer.patchbaysynth, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Patchbay Synth
//   - kleuren uit de CSS-variabelen van de host (donker, licht en retro)
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard; ongeldige kabels worden genegeerd
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
//   - bewaker in de worklet: een ingang met NaN, Infinity of een absurde waarde, of een terugkoppelende kabel die ontspoort, vergiftigt
//     de toestand (filter, ringmodulator, galm) niet meer voor altijd; de uitgang is altijd eindig. Geluid in het normale gebied is bit-identiek
//   - de worklet heet nl-patchkamer-patchbaysynth-1-11-0
// Een halfmodulaire synth met een patchpaneel: ingangen, uitgangen en schuiven waarmee je modules koppelt. Eigen code en eigen vormgeving.
//
// Wat er in zit:
//   drie VCO's (1 V/octaaf, Audio 10 Hz–10 kHz of LF 0,03–30 Hz; LF koppelt het klavier los), VCO-1 zaag+blok,
//   VCO-2 sinus/driehoek/zaag/puls met pulsbreedtemodulatie (10 %/V), VCO-3 zaag+puls; ruisgenerator (wit → roze →
//   laagfrequent, niveau tot clippen); ringmodulator (A×B/5, AC of DC); 4-polig laagdoorlaatfilter (24 dB/oct,
//   zelfoscillerend vanaf ongeveer de helft van de resonantie); VCA met lineaire (Vc/10) en exponentiële (10 dB/V)
//   ingang; ADSR en AR (tot +10 V, poort van klavier of externe ingang, handstart); sample & hold met interne klok
//   (0,2–100 Hz); envelope-volger; voorversterker (20/40/60 dB); twee inverters en een lag (0,1 ms–0,1 s);
//   elektronische schakelaar; mixer, panpot en veergalm; klavier met laagste-toets-voorrang, geheugen, portamento,
//   toonafstand en stemming.
//   Elke ingang heeft een voorbedrade bron (de "normalisatie"); een kabel in die ingang vervangt hem.
//
// Alles rekent monster voor monster in één AudioWorklet, in volt. Patchkabels leg je op de kaart: sleep van een
// uitgang (gevuld bolletje) naar een ingang (open bolletje). Klik een kabel om hem los te halen.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// Engels woordenboek (de Nederlandse tekst is de sleutel); wat niet voorkomt blijft zoals het is
const EN = {
  // uitgangen
  'extern': 'External', 'Poort': 'Gate', 'VCO-1 zaag': 'VCO-1 saw', 'VCO-1 blok': 'VCO-1 square', 'VCO-2 sinus': 'VCO-2 sine', 'VCO-2 driehoek': 'VCO-2 triangle',
  'VCO-2 zaag': 'VCO-2 saw', 'VCO-2 puls': 'VCO-2 pulse', 'VCO-3 zaag': 'VCO-3 saw', 'VCO-3 puls': 'VCO-3 pulse', 'Ruis': 'Noise', 'Klok': 'Clock', 'Volger': 'Follower',
  'Voorversterker': 'Preamp', 'Galm': 'Reverb', 'Schakelaar uit': 'Switch out', 'Schakelaar 1': 'Switch 1', 'Schakelaar 2': 'Switch 2',
  // ingangen
  'Klok in': 'Clock in', 'Poort in': 'Gate in', 'Galm in': 'Reverb in',
  // korte namen van de voorbedrade bron
  'voorv.': 'preamp', 'ruis': 'noise', 'klok': 'clock', 'VCO1 zaag': 'VCO1 saw', 'VCO1 blok': 'VCO1 sq', 'VCO2 puls': 'VCO2 pulse', 'VCO3 zaag': 'VCO3 saw',
  // namen van de regelaars
  'VCO-1 bereik': 'VCO-1 range', 'VCO-1 frequentie': 'VCO-1 frequency', 'VCO-1 fijn': 'VCO-1 fine', 'VCO-2 bereik': 'VCO-2 range', 'VCO-2 frequentie': 'VCO-2 frequency', 'VCO-2 fijn': 'VCO-2 fine',
  'VCO-2 pulsbreedte': 'VCO-2 pulse width', 'VCO-3 bereik': 'VCO-3 range', 'VCO-3 frequentie': 'VCO-3 frequency', 'VCO-3 fijn': 'VCO-3 fine', 'VCO-3 FM ruis': 'VCO-3 FM noise',
  'VCO-3 pulsbreedte': 'VCO-3 pulse width', 'Filter fijn': 'Filter fine', 'Filter resonantie': 'Filter resonance', 'Filter in ruis': 'Filter in noise',
  'VCA beginversterking': 'VCA initial gain', 'VCA lineair AR': 'VCA linear AR', 'VCA exponentieel ADSR': 'VCA exponential ADSR', 'Ruis niveau': 'Noise level', 'Ruis kleur': 'Noise color',
  'Ringmod koppeling': 'Ringmod coupling', 'Poortbron': 'Gate source', 'S/H niveau': 'S/H level', 'Klok snelheid': 'Clock rate', 'Volger niveau': 'Follower level',
  'Voorversterker bereik': 'Preamp range', 'Voorversterker niveau': 'Preamp level', 'Lag tijd': 'Lag time', 'Galm links': 'Reverb left', 'Galm rechts': 'Reverb right',
  'Volume links': 'Volume left', 'Volume rechts': 'Volume right', 'Portamento aan': 'Portamento on', 'Toonafstand aan': 'Pitch spacing on', 'Toonafstand': 'Pitch spacing',
  'Stemming aan': 'Tuning on', 'Stemming': 'Tuning',
  // korte labels op de kaart
  'Frequentie': 'Frequency', 'Fijn': 'Fine', 'Pulsbreedte': 'Pulse width', 'Resonantie': 'Resonance', 'Begin': 'Initial', 'Niveau': 'Level', 'Kleur': 'Color',
  'Lagtijd': 'Lag time', 'Galm L': 'Reverb L', 'Galm R': 'Reverb R', 'Glijtijd': 'Glide time', 'Afstand': 'Spacing',
  // modulatiesporen
  'Oscillatoren': 'Oscillators', 'Filter en VCA': 'Filter and VCA', 'Ruis, klok en uitgang': 'Noise, clock and output',
  // modules en keuzes
  'Envelope-volger': 'Envelope follower', 'Ringmodulator': 'Ring modulator', 'Mixer en uitgang': 'Mixer and output', 'Klavier': 'Keyboard',
  'Spanningsbewerkers': 'Voltage processors', 'Sample & hold en klok': 'Sample & hold and clock', 'Elektronische schakelaar': 'Electronic switch',
  'Externe poort': 'External gate', 'Portamento uit': 'Portamento off', '1 V/octaaf': '1 V/octave', 'Toonafstand vrij': 'Free pitch spacing', 'Stemming uit': 'Tuning off',
  'Handstart': 'Manual start',
  // weergave van waarden
  'midden': 'center', 'wit': 'white', 'wit-roze': 'white-pink', 'roze': 'pink', 'roze-LF': 'pink-LF',
  // knoppen en teksten
  'Klank': 'Sound', 'Alle kabels los': 'Unplug all cables', 'klavier': 'keyboard', 'toets {0}': 'key {0}',
  'uitgang': 'output', 'ingang': 'input',
  'uitgang {0}': 'output {0}', 'uitgang {0} — sleep naar een ingang': 'output {0} — drag to an input',
  'ingang {0}': 'input {0}', 'ingang {0} (voorbedraad: {1})': 'input {0} (normalled: {1})',
  '{0} → {1} ({2}) — klik om los te halen': '{0} → {1} ({2}) — click to unplug',
  'Sleep van een {0} naar een {1}. Een kabel vervangt de voorbedrade bron (←). Klik een kabel om hem los te halen; sleep vanaf een bezette ingang om hem te verleggen.':
    'Drag from an {0} to an {1}. A cable replaces the normalled source (←). Click a cable to unplug it; drag from an occupied input to move the cable.',
  'AudioWorklet laden…': 'Loading AudioWorklet…', 'AudioWorklet niet beschikbaar.': 'AudioWorklet not available.',
  'AudioWorklet niet beschikbaar ({0}): deze synth maakt hier geen geluid.': 'AudioWorklet not available ({0}): this synth makes no sound here.',
};

// ---------- signalen (uitgangen) ----------
const OUTS = [
  ['zero', '—'], ['ext', 'extern'], ['kbd', 'KBD CV'], ['gate', 'Poort'], ['trig', 'Trigger'],
  ['v1saw', 'VCO-1 zaag'], ['v1sq', 'VCO-1 blok'], ['v2sin', 'VCO-2 sinus'], ['v2tri', 'VCO-2 driehoek'], ['v2saw', 'VCO-2 zaag'], ['v2pul', 'VCO-2 puls'],
  ['v3saw', 'VCO-3 zaag'], ['v3pul', 'VCO-3 puls'], ['noise', 'Ruis'], ['ring', 'Ringmod'], ['vcf', 'Filter'], ['vca', 'VCA'], ['adsr', 'ADSR'], ['ar', 'AR'],
  ['sh', 'S/H'], ['clk', 'Klok'], ['ef', 'Volger'], ['pre', 'Voorversterker'], ['inv1', 'Inverter 1'], ['inv2', 'Inverter 2'], ['lag', 'Lag'],
  ['mix', 'Mixer'], ['rev', 'Galm'], ['swo', 'Schakelaar uit'], ['sw1', 'Schakelaar 1'], ['sw2', 'Schakelaar 2'],
];
const dict = pairs => Object.assign(Object.create(null), Object.fromEntries(pairs));
const OI = dict(OUTS.map((o, i) => [o[0], i]));
// ---------- ingangen: id, label, voorbedrade bron ----------
const INS = [
  ['v1k', 'KBD', 'kbd'], ['v1a', 'FM', 'sh'], ['v1b', 'FM', 'adsr'], ['v1c', 'FM', 'v2sin'],
  ['v2k', 'KBD', 'kbd'], ['v2a', 'FM', 'sh'], ['v2b', 'FM', 'adsr'], ['v2c', 'FM', 'v1sq'], ['v2p', 'PWM', 'noise'],
  ['v3k', 'KBD', 'kbd'], ['v3a', 'FM', 'noise'], ['v3b', 'FM', 'adsr'], ['v3c', 'FM', 'v2sin'],
  ['fa', 'In', 'ring'], ['fb', 'In', 'v1sq'], ['fc', 'In', 'v2pul'], ['fd', 'In', 'v3saw'], ['fe', 'In', 'noise'],
  ['fk', 'KBD', 'kbd'], ['fx', 'CV', 'adsr'], ['fy', 'CV', 'v2sin'],
  ['aa', 'In', 'vcf'], ['ab', 'In', 'ring'], ['al', 'Lin', 'ar'], ['ae', 'Exp', 'adsr'],
  ['ra', 'A', 'v1saw'], ['rb', 'B', 'v2sin'],
  ['si', 'In', 'noise'], ['sc', 'Klok in', 'clk'], ['eg', 'Poort in', 'clk'], ['ei', 'In', 'pre'], ['pi', 'In', 'ext'],
  ['n1', 'In', ''], ['n2', 'In', ''], ['n3', 'In', ''], ['n4', 'In', ''], ['m1', 'In', ''], ['m2', 'In', ''], ['li', 'In', ''],
  ['xa', 'Mixer in', 'vcf'], ['xb', 'Mixer in', 'vca'], ['pn', 'Pan in', 'mix'], ['ri', 'Galm in', 'mix'],
  ['wa', 'A', ''], ['wb', 'B', ''], ['wc', 'Klok in', 'clk'],
];
const II = dict(INS.map((x, i) => [x[0], i]));
const INBY = dict(INS.map(x => [x[0], x]));

// ---------- parameters: sleutel, min, max, standaard, schaal (lin|log|int), naam (= aria-label van de regelaar) ----------
const T0 = Math.log(65.406 / 10) / Math.log(1000);   // grove stand waarbij KBD 0 V = C2
const PK = [
  ['v1r', 0, 1, 0, 'int', 'VCO-1 bereik'], ['v1f', 0, 1, T0, 'lin', 'VCO-1 frequentie'], ['v1t', -1, 1, 0, 'lin', 'VCO-1 fijn'], ['v1a', 0, 1, 0, 'lin', 'VCO-1 FM S/H'], ['v1b', 0, 1, 0, 'lin', 'VCO-1 FM ADSR'], ['v1c', 0, 1, 0, 'lin', 'VCO-1 FM VCO-2'],
  ['v2r', 0, 1, 0, 'int', 'VCO-2 bereik'], ['v2f', 0, 1, T0, 'lin', 'VCO-2 frequentie'], ['v2t', -1, 1, 0.04, 'lin', 'VCO-2 fijn'], ['v2a', 0, 1, 0, 'lin', 'VCO-2 FM S/H'], ['v2b', 0, 1, 0, 'lin', 'VCO-2 FM ADSR'], ['v2c', 0, 1, 0, 'lin', 'VCO-2 FM VCO-1'],
  ['v2w', 0.1, 0.9, 0.5, 'lin', 'VCO-2 pulsbreedte'], ['v2p', 0, 1, 0, 'lin', 'VCO-2 PWM'],
  ['v3r', 0, 1, 0, 'int', 'VCO-3 bereik'], ['v3f', 0, 1, T0, 'lin', 'VCO-3 frequentie'], ['v3t', -1, 1, -0.04, 'lin', 'VCO-3 fijn'], ['v3a', 0, 1, 0, 'lin', 'VCO-3 FM ruis'], ['v3b', 0, 1, 0, 'lin', 'VCO-3 FM ADSR'], ['v3c', 0, 1, 0, 'lin', 'VCO-3 FM VCO-2'],
  ['v3w', 0.1, 0.9, 0.5, 'lin', 'VCO-3 pulsbreedte'],
  ['fF', 0, 1, 0.42, 'lin', 'Filter cutoff'], ['fT', -1, 1, 0, 'lin', 'Filter fijn'], ['fQ', 0, 1, 0.18, 'lin', 'Filter resonantie'],
  ['fa', 0, 1, 0, 'lin', 'Filter in Ringmod'], ['fb', 0, 1, 0.6, 'lin', 'Filter in VCO-1'], ['fc', 0, 1, 0, 'lin', 'Filter in VCO-2'], ['fd', 0, 1, 0.6, 'lin', 'Filter in VCO-3'], ['fe', 0, 1, 0, 'lin', 'Filter in ruis'],
  ['fx', 0, 1, 0.4, 'lin', 'Filter CV ADSR'], ['fy', 0, 1, 0, 'lin', 'Filter CV VCO-2'],
  ['aG', 0, 1, 0, 'lin', 'VCA beginversterking'], ['aa', 0, 1, 1, 'lin', 'VCA in filter'], ['ab', 0, 1, 0, 'lin', 'VCA in Ringmod'], ['al', 0, 1, 0, 'lin', 'VCA lineair AR'], ['ae', 0, 1, 1, 'lin', 'VCA exponentieel ADSR'],
  ['nL', 0, 1, 0.5, 'lin', 'Ruis niveau'], ['nC', 0, 1, 0, 'lin', 'Ruis kleur'], ['rD', 0, 1, 0, 'int', 'Ringmod koppeling'],
  ['eA', 0.001, 8, 0.006, 'log', 'ADSR attack'], ['eD', 0.002, 8, 0.45, 'log', 'ADSR decay'], ['eS', 0, 1, 0.85, 'lin', 'ADSR sustain'], ['eR', 0.002, 10, 0.35, 'log', 'ADSR release'],
  ['rA', 0.001, 8, 0.01, 'log', 'AR attack'], ['rR', 0.002, 10, 0.5, 'log', 'AR release'], ['eSrc', 0, 1, 0, 'int', 'Poortbron'],
  ['sL', 0, 1, 0.7, 'lin', 'S/H niveau'], ['cR', 0, 1, 0.45, 'lin', 'Klok snelheid'], ['efL', 0, 1, 0.5, 'lin', 'Volger niveau'],
  ['pG', 0, 2, 0, 'int', 'Voorversterker bereik'], ['pL', 0, 1, 0.5, 'lin', 'Voorversterker niveau'],
  ['qa', 0, 1, 0.5, 'lin', 'Inverter 1 in 1'], ['qb', 0, 1, 0.5, 'lin', 'Inverter 1 in 2'], ['qc', 0, 1, 0.5, 'lin', 'Inverter 2 in 1'], ['lT', 0, 1, 0.4, 'lin', 'Lag tijd'],
  ['xa', 0, 1, 0, 'lin', 'Mixer filter'], ['xb', 0, 1, 0.8, 'lin', 'Mixer VCA'], ['pP', -1, 1, 0, 'lin', 'Pan'], ['gL', 0, 1, 0.3, 'lin', 'Galm links'], ['gR', 0, 1, 0.3, 'lin', 'Galm rechts'],
  ['oL', 0, 1, 0.8, 'lin', 'Volume links'], ['oR', 0, 1, 0.8, 'lin', 'Volume rechts'],
  ['kO', 0, 1, 0, 'int', 'Portamento aan'], ['kP', 0, 1, 0.3, 'lin', 'Portamento'], ['kI', 0, 1, 0, 'int', 'Toonafstand aan'], ['kV', 0, 1, 0.43, 'lin', 'Toonafstand'],
  ['kU', 0, 1, 0, 'int', 'Stemming aan'], ['kT', 0, 1, 0.5, 'lin', 'Stemming'],
];
const PI = dict(PK.map((x, i) => [x[0], i]));
const PBY = dict(PK.map(x => [x[0], x]));
const DEFAULTS = () => Object.fromEntries(PK.map(x => [x[0], x[3]]));

// stuurbaar (v1.3), snel waar de laatste kolom true is (v1.4)
const MODP = [
  ['v1f', 'vco', 'pitch', 0.04, true, true], ['v2f', 'vco', 'pitch', 0.04, false, true], ['v3f', 'vco', 'pitch', 0.04, false, true], ['v2w', 'vco', 'pw', 0.12, true], ['v3w', 'vco', 'pw', 0.12, false],
  ['fF', 'filter', 'filter', 0.08, true, true], ['fQ', 'filter', 'res', 0.08, true], ['aG', 'filter', 'level', 0.05, false, true],
  ['eA', 'env', 'attack', 0.1, false], ['eD', 'env', 'decay', 0.1, false], ['eS', 'env', 'level', 0.1, false], ['eR', 'env', 'decay', 0.1, false], ['rA', 'env', 'attack', 0.1, false], ['rR', 'env', 'decay', 0.1, false],
  ['nL', 'overig', 'level', 0.1, false], ['nC', 'overig', 'tone', 0.12, false], ['cR', 'overig', 'rate', 0.1, false], ['lT', 'overig', 'time', 0.1, false], ['pP', 'overig', 'pan', 0.15, false],
  ['gL', 'overig', 'send', 0.08, false], ['gR', 'overig', 'send', 0.08, false],
  ['v1t', 'vco', 'pitch', 0.04, false], ['v2t', 'vco', 'pitch', 0.04, false], ['v3t', 'vco', 'pitch', 0.04, false],
  ['v1a', 'vco', 'fm', 0.10, false], ['v1b', 'vco', 'fm', 0.10, false], ['v1c', 'vco', 'fm', 0.10, false], ['v2a', 'vco', 'fm', 0.10, false], ['v2b', 'vco', 'fm', 0.10, false], ['v2c', 'vco', 'fm', 0.10, false],
  ['v3a', 'vco', 'fm', 0.10, false], ['v3b', 'vco', 'fm', 0.10, false], ['v3c', 'vco', 'fm', 0.10, false], ['v2p', 'vco', 'depth', 0.10, false],
  ['fT', 'filter', 'filter', 0.04, false], ['fa', 'filter', 'level', 0.10, false], ['fb', 'filter', 'level', 0.10, false], ['fc', 'filter', 'level', 0.10, false], ['fd', 'filter', 'level', 0.10, false], ['fe', 'filter', 'level', 0.10, false],
  ['fx', 'filter', 'depth', 0.10, false], ['fy', 'filter', 'depth', 0.10, false], ['aa', 'filter', 'level', 0.10, false], ['ab', 'filter', 'level', 0.10, false], ['al', 'filter', 'level', 0.10, false], ['ae', 'filter', 'level', 0.10, false],
  ['sL', 'overig', 'level', 0.10, false], ['efL', 'overig', 'level', 0.10, false], ['pL', 'overig', 'level', 0.10, false], ['qa', 'overig', 'level', 0.10, false], ['qb', 'overig', 'level', 0.10, false], ['qc', 'overig', 'level', 0.10, false],
  ['xa', 'overig', 'level', 0.10, false], ['xb', 'overig', 'level', 0.10, false], ['oL', 'overig', 'level', 0.05, false], ['oR', 'overig', 'level', 0.05, false],
  ['kP', 'overig', 'glide', 0.10, false], ['kV', 'overig', 'pitch', 0.04, false], ['kT', 'overig', 'pitch', 0.04, false],
];
const LANES = { vco: 'Oscillatoren', filter: 'Filter en VCA', env: 'Envelopes', overig: 'Ruis, klok en uitgang' };
const FASTX = { v1f: ['x1', Math.log2(1000)], v2f: ['x2', Math.log2(1000)], v3f: ['x3', Math.log2(1000)], fF: ['xc', Math.log2(1000)], aG: ['xg', 1] };

// ---------- klanken (eigen patches; bevatten ook patchkabels) ----------
const PRESETS = {
  'Default Patch': {},
  'Fat Bass': { v1f: T0 - 0.1, v2f: T0 - 0.1, v3f: T0 - 0.1, v2t: 0.06, v3t: -0.06, fb: 0.7, fc: 0.5, fd: 0.7, fF: 0.3, fQ: 0.35, fx: 0.55, eA: 0.002, eD: 0.25, eS: 0.75, eR: 0.15, kO: 1, kP: 0.15, gL: 0.08, gR: 0.08 },
  'S/H Melody': { v1a: 0.55, fb: 0.7, fd: 0, fF: 0.5, fQ: 0.45, fx: 0.3, eSrc: 1, cR: 0.55, eA: 0.002, eD: 0.18, eS: 0, eR: 0.2, gL: 0.4, gR: 0.4 },
  'Ring Bell': { v2f: T0 + 0.115, v2t: 0.3, fa: 0.85, fb: 0, fd: 0, fF: 0.8, fQ: 0.05, fx: 0, eA: 0.001, eD: 1.6, eS: 0, eR: 1.8, gL: 0.45, gR: 0.45 },
  'Wind': { v2r: 1, v2f: 0.25, fb: 0, fd: 0, fe: 0.8, nC: 0.35, fF: 0.45, fQ: 0.75, fx: 0, fy: 0.55, aG: 0.85, ae: 0, gL: 0.5, gR: 0.5 },
  'Whistling Filter': { fb: 0, fd: 0, fQ: 0.62, fF: T0 + 0.005, fx: 0, eA: 0.08, eD: 0.6, eS: 0.7, eR: 0.6, gL: 0.35, gR: 0.35 },
  'Gliding Lag': { fb: 0.7, fc: 0.4, fd: 0, fF: 0.48, fQ: 0.3, lT: 0.85, cords: [['kbd', 'li'], ['lag', 'v1k'], ['lag', 'v2k'], ['lag', 'v3k']] },
  'Vibrato via VCO-3': { v3r: 1, v3f: 0.52, v1c: 0, fb: 0.6, fd: 0, fF: 0.5, cords: [['v3saw', 'n1'], ['inv1', 'v1a']], qa: 0.25, v1a: 0.18 },
};

// ---------- AudioWorklet ----------
const WNAME = 'nl-patchkamer-patchbaysynth-1-11-0';
function workletCode() {
  const sig = OUTS.map((o, i) => 'S_' + o[0] + '=' + i).join(','), inp = INS.map((x, i) => 'I_' + x[0] + '=' + i).join(','), par = PK.map((x, i) => 'P_' + x[0] + '=' + i).join(',');
  const nos = JSON.stringify(PK.map(x => x[4] === 'int' ? 1 : 0));
  return `
const ${sig};
const ${inp};
const ${par};
const NS=${OUTS.length}, NI=${INS.length}, NP=${PK.length}, NOS=${nos};
const blep=(t,dt)=>{ if(t<dt){t/=dt; return t+t-t*t-1;} if(t>1-dt){t=(t-1)/dt; return t*t+t+t+1;} return 0; };
const LOG2_1000=Math.log2(1000);
class PatchbaySynth extends AudioWorkletProcessor {
  static get parameterDescriptors(){ return ['x1','x2','x3','xc','xg'].map(name=>({name,defaultValue:0,automationRate:'a-rate'})); }
  constructor(){ super();
    this.tg=new Float64Array(NP); this.p=new Float64Array(NP); this.init=false; this.o=new Float64Array(NS); this.r=new Int32Array(NI); this.revP=0;
    this.q=[]; this.held=new Map(); this.kGate=0; this.kTrig=0; this.kTgt=0; this.kCv=0; this.man=0; this.manT=0;
    this.ph=[0,0,0]; this.pk=[0,0,0]; this.br=0; this.ring=[0,0,0,0]; this.lad=[0,0,0,0]; this.env=0; this.stg=0; this.arv=0; this.gPrev=0; this.egPrev=0;
    this.shv=0; this.scPrev=0; this.cph=0; this.efv=0; this.lagv=0; this.hp=0;
    const N=8192; this.sp=[0.0331,0.0417].map((d,k)=>({buf:new Float32Array(N),w:0,len:Math.round(d*sampleRate),ap:new Float64Array(8),lp:0,N}));
    this.snapN=0; this.dc=[0,0,0,0]; this.sets=[this.o,this.ph,this.pk,this.ring,this.lad,this.dc];
    this.port.onmessage=e=>{ const d=e.data;
      if(d.t==='p'){ for(let i=0;i<NP;i++){ const x=d.v[i]; if(Number.isFinite(x)) this.tg[i]=x; } if(!this.init){ this.p.set(this.tg); this.init=true; } }
      else if(d.t==='r'){ for(let i=0;i<NI;i++){ const x=d.r[i]; this.r[i]=x>=0&&x<NS?x:0; } this.revP=d.rev?1:0; }
      else if(d.t==='n'){ if(!Number.isFinite(d.at)||!Number.isFinite(d.n)) return; const q=this.q; let i=q.length; while(i>0&&q[i-1].at>d.at) i--; q.splice(i,0,d); }
      else if(d.t==='all'){ this.held.clear(); this.q.length=0; this.kGate=0; }
      else if(d.t==='man'){ this.man=d.on?1:0; if(d.on) this.manT=1; } };
  }
  keyEv(ev){ const h=this.held; if(ev.on){ h.set(ev.n,(h.get(ev.n)||0)+1); this.kTrig=Math.max(1,Math.round(sampleRate*0.001)); } else { const c=(h.get(ev.n)||0)-1; if(c>0) h.set(ev.n,c); else h.delete(ev.n); }
    if(h.size){ let lo=1e9; h.forEach((c,n)=>{ if(n<lo) lo=n; }); this.kNote=lo; this.kGate=1; } else this.kGate=0; }
  // bewaker: een toestand die NaN, Infinity of absurd groot is (ingang, ontsporende terugkoppeling) wordt op nul gezet
  guard(){ let m=0; const S=this.sets;
    for(let a=0;a<S.length;a++){ const x=S[a]; for(let i=0;i<x.length;i++) m+=Math.abs(x[i]); }
    m+=Math.abs(this.env)+Math.abs(this.arv)+Math.abs(this.shv)+Math.abs(this.efv)+Math.abs(this.lagv)+Math.abs(this.hp)+Math.abs(this.br)+Math.abs(this.kCv)+Math.abs(this.kTgt)+Math.abs(this.cph);
    for(let k=0;k<this.sp.length;k++){ const sp=this.sp[k]; m+=Math.abs(sp.lp); for(let i=0;i<8;i++) m+=Math.abs(sp.ap[i]); }
    if(m<1e7) return;
    for(let a=0;a<S.length;a++) S[a].fill(0);
    this.env=0; this.stg=0; this.arv=0; this.shv=0; this.cph=0; this.efv=0; this.lagv=0; this.hp=0; this.br=0; this.kCv=0; this.kTgt=0; this.gPrev=0; this.egPrev=0; this.scPrev=0;
    for(let k=0;k<this.sp.length;k++){ const sp=this.sp[k]; sp.buf.fill(0); sp.ap.fill(0); sp.lp=0; } }
  process(inputs,outputs,params){
    const out=outputs[0], L=out[0], R=out[1]||out[0], n=L.length, inp=inputs[0]&&inputs[0][0];
    if(!this.init){ L.fill(0); if(R!==L) R.fill(0); return true; }
    const o=this.o, r=this.r, p=this.p, tg=this.tg, SR=sampleRate;
    for(let i=0;i<NP;i++) p[i]=NOS[i]?tg[i]:p[i]+(tg[i]-p[i])*0.25;
    const X1=params.x1, X2=params.x2, X3=params.x3, XC=params.xc, XG=params.xg;
    // per blok
    const sq=v=>v*v, base=(rg,f,t)=>(rg>0.5?0.03:10)*Math.pow(1000,f)*Math.pow(2,t*0.23);
    const b1=base(p[P_v1r],p[P_v1f],p[P_v1t]), b2=base(p[P_v2r],p[P_v2f],p[P_v2t]), b3=base(p[P_v3r],p[P_v3f],p[P_v3t]);
    const a1a=sq(p[P_v1a]),a1b=sq(p[P_v1b]),a1c=sq(p[P_v1c]), a2a=sq(p[P_v2a]),a2b=sq(p[P_v2b]),a2c=sq(p[P_v2c]),a2p=sq(p[P_v2p]), a3a=sq(p[P_v3a]),a3b=sq(p[P_v3b]),a3c=sq(p[P_v3c]);
    const ffa=sq(p[P_fa]),ffb=sq(p[P_fb]),ffc=sq(p[P_fc]),ffd=sq(p[P_fd]),ffe=sq(p[P_fe]), fcx=p[P_fx], fcy=p[P_fy], fbase=10*Math.pow(1000,p[P_fF])*Math.pow(2,p[P_fT]*0.5), kres=p[P_fQ]*8.2;
    const vaa=sq(p[P_aa]),vab=sq(p[P_ab]),val=p[P_al],vae=sq(p[P_ae]), vG=p[P_aG];
    const nG=21*sq(p[P_nL]), nc=p[P_nC];
    const ce=(t)=>1-Math.exp(-1/(Math.max(0.0002,t)*SR));
    const cA=ce(p[P_eA]/1.79), cD=ce(p[P_eD]/3), cR=ce(p[P_eR]/3), sus=10*p[P_eS], rA=ce(p[P_rA]/1.79), rR=ce(p[P_rR]/3);
    const shL=sq(p[P_sL]), clkF=0.2*Math.pow(500,p[P_cR]), efL=sq(p[P_efL]), preG=[10,100,1000][Math.round(p[P_pG])]*sq(p[P_pL]);
    const qa=sq(p[P_qa]),qb=sq(p[P_qb]),qc=sq(p[P_qc]), lagC=ce(0.0001*Math.pow(1000,p[P_lT]));
    const xa=sq(p[P_xa]),xb=sq(p[P_xb]), pp=p[P_pP], panL=Math.min(1,1-pp), panR=Math.min(1,1+pp), gl=sq(p[P_gL]), gr=sq(p[P_gR]), oL=sq(p[P_oL])*0.3, oR=sq(p[P_oR])*0.3;   // 10 V t-t ≈ ±1,5 bij vol volume
    const perOct=p[P_kI]>0.5?(1+7*p[P_kV])/4:1, tune=p[P_kU]>0.5?p[P_kT]*0.5:0, portC=p[P_kO]>0.5?ce(0.001*Math.pow(500,p[P_kP])):1;
    const rgA=p[P_rD]>0.5?0:Math.exp(-1/(0.235*SR)), rgB=p[P_rD]>0.5?0:Math.exp(-1/(0.09*SR));
    const efC=1-Math.exp(-1/(0.0144*SR)), eSrc=p[P_eSrc]>0.5, fmax=Math.min(20000,SR*0.45);
    const t0=currentTime;
    for(let s=0;s<n;s++){
      const now=t0+s/SR; while(this.q.length&&this.q[0].at<=now) this.keyEv(this.q.shift());
      { const xi=inp?inp[s]:0; o[S_ext]=xi>-20&&xi<20?xi*5:xi>=20?100:xi<=-20?-100:0; }
      // klavier: laagste toets, geheugen, portamento
      if(this.kGate) this.kTgt=((this.kNote-36)/12)*perOct+tune;
      this.kCv+=(this.kTgt-this.kCv)*portC; o[S_kbd]=this.kCv; o[S_gate]=this.kGate?10:0; o[S_trig]=this.kTrig>0?15:0; if(this.kTrig>0) this.kTrig--;
      // VCO-1
      { const v=o[r[I_v1k]]+a1a*o[r[I_v1a]]+a1b*o[r[I_v1b]]+a1c*o[r[I_v1c]]+X1[X1.length>1?s:0];
        const f=Math.min(SR*0.45,Math.max(0.001,b1*Math.pow(2,v))), dt=f/SR; let ph=this.ph[0]+dt; if(ph>=1) ph-=1; this.ph[0]=ph;
        o[S_v1saw]=5+5*(2*ph-1-blep(ph,dt)); o[S_v1sq]=5+5*((ph<0.5?1:-1)+blep(ph,dt)-blep((ph+0.5)%1,dt)); }
      // VCO-2
      { const v=o[r[I_v2k]]+a2a*o[r[I_v2a]]+a2b*o[r[I_v2b]]+a2c*o[r[I_v2c]]+X2[X2.length>1?s:0];
        const f=Math.min(SR*0.45,Math.max(0.001,b2*Math.pow(2,v))), dt=f/SR; let ph=this.ph[1]+dt; if(ph>=1) ph-=1; this.ph[1]=ph;
        const w=Math.max(0.02,Math.min(0.98,p[P_v2w]+0.1*a2p*o[r[I_v2p]]));
        o[S_v2sin]=5*Math.sin(2*Math.PI*ph); const tr=ph<0.25?4*ph:ph<0.75?2-4*ph:4*ph-4; o[S_v2tri]=-5*tr;
        o[S_v2saw]=5+5*(2*ph-1-blep(ph,dt)); o[S_v2pul]=5+5*((ph<w?1:-1)+blep(ph,dt)-blep((ph-w+1)%1,dt)); }
      // ruis: wit -> roze -> laagfrequent, clipt op 20 V t-t
      { const w=Math.random()*2-1, k=this.pk; k[0]=0.99765*k[0]+w*0.099046; k[1]=0.963*k[1]+w*0.2965164; k[2]=0.57*k[2]+w*1.0526913;
        const pink=(k[0]+k[1]+k[2]+w*0.1848)*0.19; this.br+=(w-this.br)*0.02; const lf=this.br*9;
        const x=nc<0.5?w*(1-2*nc)+pink*2*nc:pink*(2-2*nc)+lf*(2*nc-1); o[S_noise]=Math.max(-10,Math.min(10,x*nG)); }
      // VCO-3
      { const v=o[r[I_v3k]]+a3a*o[r[I_v3a]]+a3b*o[r[I_v3b]]+a3c*o[r[I_v3c]]+X3[X3.length>1?s:0];
        const f=Math.min(SR*0.45,Math.max(0.001,b3*Math.pow(2,v))), dt=f/SR; let ph=this.ph[2]+dt; if(ph>=1) ph-=1; this.ph[2]=ph; const w=p[P_v3w];
        o[S_v3saw]=5+5*(2*ph-1-blep(ph,dt)); o[S_v3pul]=5+5*((ph<w?1:-1)+blep(ph,dt)-blep((ph-w+1)%1,dt)); }
      // ringmodulator A×B/5, AC-koppeling 235 ms / 90 ms
      { const g=this.ring; let A=o[r[I_ra]], B=o[r[I_rb]];
        if(rgA){ const ya=rgA*(g[1]+A-g[0]); g[0]=A; g[1]=ya; A=ya; const yb=rgB*(g[3]+B-g[2]); g[2]=B; g[3]=yb; B=yb; }
        o[S_ring]=A*B/5; }
      // envelopes: poort van klavier of externe ingang, handstart gaat voor
      { const eg=o[r[I_eg]]>5, G=this.man?1:(eSrc?eg:this.kGate), egEdge=eg&&!this.egPrev; this.egPrev=eg;
        const trig=this.manT||(eSrc?egEdge:this.kTrig>0&&o[S_trig]>0)||(G&&!this.gPrev); this.manT=0; this.gPrev=G;
        if(trig&&G) this.stg=1; if(!G) this.stg=3;
        if(this.stg===1){ this.env+=(12-this.env)*cA; if(this.env>=10){ this.env=10; this.stg=2; } } else if(this.stg===2) this.env+=(sus-this.env)*cD; else this.env+=(0-this.env)*cR;
        o[S_adsr]=this.env; this.arv+=G?(12-this.arv)*rA:(0-this.arv)*rR; if(this.arv>10) this.arv=10; o[S_ar]=this.arv; }
      // filter: 4-polige ladder (TPT), 1 V/oct, zelfoscillatie vanaf ~halve resonantie
      { const x=(ffa*o[r[I_fa]]+ffb*o[r[I_fb]]+ffc*o[r[I_fc]]+ffd*o[r[I_fd]]+ffe*o[r[I_fe]])/5;
        const cv=o[r[I_fk]]+fcx*o[r[I_fx]]+fcy*o[r[I_fy]]+XC[XC.length>1?s:0];
        const fc=Math.min(fmax,Math.max(1,fbase*Math.pow(2,cv))), g=Math.tan(Math.PI*fc/SR), G=g/(1+g), z=this.lad, inv=1/(1+g);
        const S=(G*G*G*z[0]+G*G*z[1]+G*z[2]+z[3])*inv; let u=Math.tanh((x-kres*S)/(1+kres*G*G*G*G)+1e-9*Math.random());
        for(let j=0;j<4;j++){ const v=(u-z[j])*G, y=v+z[j]; z[j]=y+v; u=y; } o[S_vcf]=u*5; }
      // VCA: beginversterking + lineair (Vc/10) + exponentieel (10 dB/V)
      { const ein=vae*o[r[I_ae]], eg=ein>0?Math.pow(10,(ein-10)*0.5):0; const gain=Math.max(0,Math.min(1,vG+XG[XG.length>1?s:0]+val*o[r[I_al]]/10+eg));
        o[S_vca]=(vaa*o[r[I_aa]]+vab*o[r[I_ab]])*gain; }
      // klok, sample & hold
      { this.cph+=clkF/SR; if(this.cph>=1) this.cph-=1; o[S_clk]=this.cph<0.5?10:0;
        const sc=o[r[I_sc]]; if(sc>2.5&&this.scPrev<=2.5) this.shv=shL*o[r[I_si]]; this.scPrev=sc; o[S_sh]=this.shv; }
      // voorversterker, envelope-volger
      { o[S_pre]=10*Math.tanh(o[r[I_pi]]*preG/10); this.efv+=(20*Math.abs(efL*o[r[I_ei]])-this.efv)*efC; o[S_ef]=Math.min(10,this.efv); }
      // spanningsbewerkers
      o[S_inv1]=-(qa*o[r[I_n1]]+qb*o[r[I_n2]]+o[r[I_n3]]+o[r[I_n4]]); o[S_inv2]=-(qc*o[r[I_m1]]+o[r[I_m2]]); this.lagv+=(o[r[I_li]]-this.lagv)*lagC; o[S_lag]=this.lagv;
      // elektronische schakelaar
      { const c=o[r[I_wc]]>5, A=o[r[I_wa]]; o[S_swo]=c?A:o[r[I_wb]]; o[S_sw1]=c?A:0; o[S_sw2]=c?0:A; }
      // mixer, galm (twee veren met dispersie), panpot
      o[S_mix]=xa*o[r[I_xa]]+xb*o[r[I_xb]];
      { const xin=o[r[I_ri]]*0.1; this.hp+=(xin-this.hp)*0.013; const x=xin-this.hp; let wet=0;
        for(const sp of this.sp){ const N=sp.N; let rd=sp.buf[(sp.w-sp.len+N)%N]; sp.lp+=(rd-sp.lp)*0.45; let u=x+0.86*sp.lp;
          for(let j=0;j<8;j++){ const a=0.62, w=u-a*sp.ap[j], y=a*w+sp.ap[j]; sp.ap[j]=w; u=y; }
          sp.buf[sp.w]=Math.tanh(u); sp.w=(sp.w+1)%N; wet+=rd; }
        o[S_rev]=wet*5; }
      const pin=o[r[I_pn]];
      // uitgangen wisselspanningsgekoppeld (gelijkspanning eruit); een niet-eindige of absurde waarde gaat nooit de gelijkspanningsfilter of de uitgang in
      const lo0=oL*(panL*pin+gl*o[S_rev]), ro0=oR*(panR*pin-(this.revP?0:gr*o[S_rev])), dc=this.dc;
      const lo=lo0>-1e6&&lo0<1e6?lo0:0, ro=ro0>-1e6&&ro0<1e6?ro0:0;
      dc[1]=lo-dc[0]+0.9995*dc[1]; dc[0]=lo; dc[3]=ro-dc[2]+0.9995*dc[3]; dc[2]=ro; { const yl=dc[1], yr=dc[3]; L[s]=yl>16?16:yl<-16?-16:yl; R[s]=yr>16?16:yr<-16?-16:yr; }
    }
    o[S_zero]=0;
    this.guard();
    if((this.snapN+=n)>=2048){ this.snapN=0; this.port.postMessage({t:'s',v:Array.from(o)}); }
    return true;
  }
}
registerProcessor('${WNAME}', PatchbaySynth);
`;
}

// ---------- paneelindeling: modules en hun regels ----------
// sl(param) = schuif · sel(param, opties) = keuze · jin(ingang, attenuator?) · jout(uitgang)
const sl = k => ({ k: 'sl', p: k }), sel = (k, o) => ({ k: 'sel', p: k, o }), jin = (id, att) => ({ k: 'in', id, att }), jout = id => ({ k: 'out', id }), btn = (id, t) => ({ k: 'btn', id, t });
const RANGE = [['0', 'Audio'], ['1', 'LF']];
const MODS = [
  { t: 'Voorversterker', c: 1, rows: [sel('pG', [['0', '20 dB'], ['1', '40 dB'], ['2', '60 dB']]), sl('pL'), jin('pi'), jout('pre')] },
  { t: 'Envelope-volger', c: 1, rows: [jin('ei', 'efL'), jout('ef')] },
  { t: 'Ringmodulator', c: 1, rows: [sel('rD', [['0', 'Audio (AC)'], ['1', 'DC']]), jin('ra'), jin('rb'), jout('ring')] },
  { t: 'VCO-1', c: 2, rows: [sel('v1r', RANGE), sl('v1f'), sl('v1t'), jin('v1k'), jin('v1a', 'v1a'), jin('v1b', 'v1b'), jin('v1c', 'v1c'), jout('v1saw'), jout('v1sq')] },
  { t: 'VCO-2', c: 3, rows: [sel('v2r', RANGE), sl('v2f'), sl('v2t'), sl('v2w'), jin('v2k'), jin('v2a', 'v2a'), jin('v2b', 'v2b'), jin('v2c', 'v2c'), jin('v2p', 'v2p'), jout('v2sin'), jout('v2tri'), jout('v2saw'), jout('v2pul')] },
  { t: 'VCO-3', c: 4, rows: [sel('v3r', RANGE), sl('v3f'), sl('v3t'), sl('v3w'), jin('v3k'), jin('v3a', 'v3a'), jin('v3b', 'v3b'), jin('v3c', 'v3c'), jout('v3saw'), jout('v3pul')] },
  { t: 'Filter', c: 5, rows: [sl('fF'), sl('fT'), sl('fQ'), jin('fa', 'fa'), jin('fb', 'fb'), jin('fc', 'fc'), jin('fd', 'fd'), jin('fe', 'fe'), jin('fk'), jin('fx', 'fx'), jin('fy', 'fy'), jout('vcf')] },
  { t: 'Envelopes', c: 6, rows: [sl('eA'), sl('eD'), sl('eS'), sl('eR'), sl('rA'), sl('rR'), sel('eSrc', [['0', 'Klavier'], ['1', 'Externe poort']]), jin('eg'), btn('man', 'Handstart'), jout('adsr'), jout('ar'), jout('gate'), jout('trig')] },
  { t: 'VCA', c: 7, rows: [sl('aG'), jin('aa', 'aa'), jin('ab', 'ab'), jin('al', 'al'), jin('ae', 'ae'), jout('vca')] },
  { t: 'Mixer en uitgang', c: 8, rows: [jin('xa', 'xa'), jin('xb', 'xb'), jout('mix'), jin('pn'), sl('pP'), jin('ri'), sl('gL'), sl('gR'), jout('rev'), sl('oL'), sl('oR')] },
  { t: 'Klavier', c: 1, b: 1, rows: [jout('kbd'), sel('kO', [['0', 'Portamento uit'], ['1', 'Portamento aan']]), sl('kP'), sel('kI', [['0', '1 V/octaaf'], ['1', 'Toonafstand vrij']]), sl('kV'), sel('kU', [['0', 'Stemming uit'], ['1', 'Stemming aan']]), sl('kT')] },
  { t: 'Ruis', c: 2, b: 1, rows: [sl('nL'), sl('nC'), jout('noise')] },
  { t: 'Spanningsbewerkers', c: 3, b: 1, w: 2, rows: [jin('n1', 'qa'), jin('n2', 'qb'), jin('n3'), jin('n4'), jout('inv1'), jin('m1', 'qc'), jin('m2'), jout('inv2'), jin('li'), sl('lT'), jout('lag')] },
  { t: 'Sample & hold en klok', c: 5, b: 1, rows: [jin('si', 'sL'), jin('sc'), jout('sh'), sl('cR'), jout('clk')] },
  { t: 'Elektronische schakelaar', c: 6, b: 1, rows: [jin('wa'), jin('wb'), jin('wc'), jout('swo'), jout('sw1'), jout('sw2')] },
];
// korte namen voor de voorbedrade bron onder een ingang
const SHORT = { kbd: 'KBD', sh: 'S/H', adsr: 'ADSR', ar: 'AR', v1saw: 'VCO1 zaag', v1sq: 'VCO1 blok', v2sin: 'VCO2 sin', v2pul: 'VCO2 puls', v3saw: 'VCO3 zaag', noise: 'ruis', ring: 'ringmod', vcf: 'filter', vca: 'VCA', clk: 'klok', pre: 'voorv.', mix: 'mixer', ext: 'extern' };
const CORD_COLORS = ['#e8524a', '#f2c14e', '#5fc46a', '#4fa3e8', '#e0e0e0', '#b07be8', '#f08a3c'];

const CSS = `
:host{display:block}
*{box-sizing:border-box}
.kk{--k-bg:var(--card,#171b22);--k-mod:var(--card-2,#1e232c);--k-line:var(--line,#2a3039);--k-fg:var(--fg,#dce1e8);--k-muted:var(--muted,#7d8794);--k-acc:var(--event,#f4a261);--k-in:var(--audio,#4fd1c5);--k-out:var(--event,#f4a261);--k-field:var(--field,#1e232c);--k-field-fg:var(--field-fg,#dce1e8);--k-well:var(--well,#090b0e);
  font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:var(--k-fg);background:var(--k-bg);border-radius:8px;padding:10px;display:grid;gap:10px;position:relative}
.top{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.top .lbl{color:var(--k-muted);letter-spacing:.12em;text-transform:uppercase;font-size:10px;margin-right:4px}
button{font:inherit;background:var(--k-mod);color:var(--k-fg);border:1px solid var(--k-line);border-radius:4px;padding:4px 8px;cursor:pointer}
button:hover{border-color:var(--k-acc)} button.on{background:var(--k-acc);color:var(--k-bg);border-color:var(--k-acc)}
.panel{position:relative;display:grid;grid-template-columns:1fr 1.05fr 1.1fr 1.05fr 1.3fr 1.1fr 1.05fr 1.1fr;gap:8px;align-items:start}
.m{background:var(--k-mod);border:1px solid var(--k-line);border-radius:6px;padding:7px 8px 8px;display:grid;gap:4px;min-width:0}
.m h3{margin:0 0 2px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--k-acc);font-weight:700}
.k{display:grid;grid-template-columns:62px minmax(0,1fr) 46px;gap:5px;align-items:center;min-width:0}
.k label{color:var(--k-muted);font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{text-align:right;font-variant-numeric:tabular-nums;font-size:10px}
.k select{grid-column:2/4;background:var(--k-field);color:var(--k-field-fg);border:1px solid var(--k-line);border-radius:3px;font:inherit;padding:2px 4px;min-width:0}
input[type=range]{appearance:none;width:100%;min-width:0;height:14px;background:transparent;margin:0;cursor:pointer}
input[type=range]::-webkit-slider-runnable-track{height:3px;background:var(--k-line);border-radius:2px}
input[type=range]::-webkit-slider-thumb{appearance:none;width:9px;height:13px;margin-top:-5px;border-radius:2px;background:var(--k-fg)}
input[type=range]::-moz-range-track{height:3px;background:var(--k-line)}
input[type=range]::-moz-range-thumb{width:9px;height:13px;border-radius:2px;background:var(--k-fg);border:none}
.j{display:grid;grid-template-columns:16px minmax(0,1fr);gap:5px;align-items:center;min-width:0}
.j.att{grid-template-columns:16px minmax(0,1.7fr) minmax(30px,1fr) 28px}
.j .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}
.j .nm small{color:var(--k-muted);font-size:9px;margin-left:3px}
.j output{text-align:right;font-size:9.5px;color:var(--k-muted);font-variant-numeric:tabular-nums}
.jk{width:16px;height:16px;border-radius:50%;border:2px solid var(--k-in);background:var(--k-bg);cursor:crosshair;padding:0;touch-action:none;position:relative}
.jk.o{border-color:var(--k-out);background:radial-gradient(circle,var(--k-out) 0 35%,var(--k-bg) 40%)}
.jk.o{box-shadow:0 0 calc(var(--lv,0) * 10px) var(--k-out)}
.jk.used{background:radial-gradient(circle,var(--k-well) 0 38%,var(--k-bg) 42%)}
.jk:hover,.jk.hot{transform:scale(1.25)}
.j.out .nm{color:var(--k-out)}
.row2{grid-column:span 2}
svg.cords{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:5}
svg.cords path{fill:none;stroke-width:4;stroke-linecap:round;opacity:.88;pointer-events:stroke;cursor:pointer}
svg.cords path:hover{stroke-width:6;opacity:1}
svg.cords path.tmp{stroke-dasharray:6 5;pointer-events:none}
.keys{position:relative;height:74px;display:flex;user-select:none;touch-action:none}
.keys button{flex:1;min-width:0;border-radius:0 0 4px 4px;border:1px solid #9aa0aa;background:#ecebe6;color:#333;padding:0;font-size:9px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px}
.keys button.b{position:absolute;top:0;height:46px;background:#22252b;border-color:#000;z-index:2;color:#aaa}
.keys button.down{background:var(--k-acc)!important}
.foot{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:var(--k-muted);font-size:10px}
.foot .co{color:var(--k-out);font-weight:700} .foot .ci{color:var(--k-in);font-weight:700}
.note{color:var(--k-muted);font-size:10px}
`;

export default {
  id: 'nl.patchkamer.patchbaysynth',
  name: 'Patchbay Synth',
  version: '1.11.2',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 1680, minWidth: 1200 },
  ports: { audioIn: [{ id: 'in', name: 'Preamp in' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  i18n: { nl: { ports: { in: 'Voorversterker in', out: 'Uit', notes: 'Noten' } } },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (own(EN, k) ? EN[k] : k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const on_ = id => tx(OUTS[OI[id]][1]);   // vertaalde naam van een uitgang
    let P = DEFAULTS(); P.cords = [];
    const mod = {}; let dead = false, node = null, wstate = 'laden', root = null, ui = {}, refreshers = [], snap = null, unframe = null, cordsDirty = false;
    const inG = ctx.createGain(), out = ctx.createGain(); out.gain.value = 1;
    const fast = {}; Object.entries(FASTX).forEach(([k, [x, span]]) => { const g = ctx.createGain(); g.gain.value = span; fast[k] = g; });
    const sane = s => { const d = DEFAULTS(), o = {}; PK.forEach(([k, mn, mx, df, sc]) => { const v = s && typeof s[k] === 'number' && isFinite(s[k]) ? s[k] : d[k]; o[k] = sc === 'int' ? Math.round(clamp(v, mn, mx)) : clamp(v, mn, mx); });
      o.cords = Array.isArray(s && s.cords) ? s.cords.filter(c => Array.isArray(c) && typeof c[0] === 'string' && typeof c[1] === 'string' && OI[c[0]] != null && II[c[1]] != null).map(c => [c[0], c[1]]) : [];
      const seen = new Set(); o.cords = o.cords.reverse().filter(c => !seen.has(c[1]) && seen.add(c[1])).reverse(); return o; };
    const MODBY = dict(MODP.map(m => [m[0], m]));
    const E = k => { const [, mn, mx, , sc] = PBY[k], b = P[k], off = mod[k] || 0; if (!off || (own(FASTX, k) && fastOn.has(k))) return b;
      return sc === 'log' ? clamp(b * Math.pow(mx / mn, off), mn, mx) : clamp(b + off * (mx - mn), mn, mx); };
    const fastOn = new Set();
    function sendParams() { if (!node) return; node.port.postMessage({ t: 'p', v: PK.map(x => E(x[0])) }); }
    function sendRoute() {
      if (!node) return; const by = Object.fromEntries(P.cords.map(c => [c[1], c[0]]));
      const r = INS.map(([id, , nrm]) => { if (own(by, id)) return OI[by[id]]; if (/^v[123]k$/.test(id) && P['v' + id[1] + 'r'] === 1) return 0; return nrm ? OI[nrm] : 0; });
      node.port.postMessage({ t: 'r', r, rev: P.cords.some(c => c[0] === 'rev') });
    }
    const after = () => { sendParams(); sendRoute(); };
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, workletCode()) : Promise.reject(new Error('host.loadWorklet missing'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('no AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      inG.connect(node); node.connect(out); Object.entries(FASTX).forEach(([k, [x]]) => fast[k].connect(node.parameters.get(x)));
      node.port.onmessage = e => { if (e.data && e.data.t === 's') snap = e.data.v; };
      wstate = 'ok'; after(); if (ui.note) ui.note.textContent = '';
    }).catch(e => { wstate = 'fout'; if (ui.note) ui.note.textContent = tx('AudioWorklet niet beschikbaar ({0}): deze synth maakt hier geen geluid.', e && e.message || e); });

    // ---------- noten ----------
    const noteMsg = (on, n, at) => { if (node && Number.isFinite(n) && Number.isFinite(at)) node.port.postMessage({ t: 'n', on, n, at }); };

    // ---------- UI ----------
    const pct = v => Math.round(v * 100) + '%';
    const secs = v => v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
    const FMT = {
      freq: k => v => { const lf = P[k[0] + k[1] + 'r'] === 1, hz = (lf ? 0.03 : 10) * Math.pow(1000, v); return hz < 1 ? hz.toFixed(2) + ' Hz' : hz < 1000 ? hz.toFixed(hz < 100 ? 1 : 0) + ' Hz' : (hz / 1000).toFixed(2) + ' kHz'; },
    };
    function fmtFor(k) {
      if (/^v[123]f$/.test(k)) return FMT.freq(k);
      if (k === 'fF') return v => { const hz = 10 * Math.pow(1000, v); return hz < 1000 ? Math.round(hz) + ' Hz' : (hz / 1000).toFixed(2) + ' kHz'; };
      if (/^v[123]t$/.test(k) || k === 'fT') return v => (v > 0 ? '+' : '') + v.toFixed(2);
      if (/^v[23]w$/.test(k)) return pct;
      if (PBY[k][4] === 'log') return secs;
      if (k === 'eS') return v => (v * 10).toFixed(1) + ' V';
      if (k === 'cR') return v => { const f = 0.2 * Math.pow(500, v); return f < 10 ? f.toFixed(2) + ' Hz' : Math.round(f) + ' Hz'; };
      if (k === 'lT') return v => { const t = 0.0001 * Math.pow(1000, v); return t < 0.01 ? (t * 1000).toFixed(1) + ' ms' : Math.round(t * 1000) + ' ms'; };
      if (k === 'pP') return v => Math.abs(v) < 0.02 ? tx('midden') : (v < 0 ? 'L ' : 'R ') + pct(Math.abs(v));
      if (k === 'kP') return v => { const t = 0.001 * Math.pow(500, v); return t < 1 ? Math.round(t * 1000) + ' ms' : t.toFixed(1) + ' s'; };
      if (k === 'kV') return v => ((1 + 7 * v) / 4).toFixed(2) + ' V/oct';
      if (k === 'kT') return v => '+' + (v * 0.5).toFixed(2) + ' V';
      if (k === 'nC') return v => tx(v < 0.2 ? 'wit' : v < 0.4 ? 'wit-roze' : v < 0.6 ? 'roze' : v < 0.8 ? 'roze-LF' : 'LF');
      return pct;
    }
    const short = { v1f: 'Frequentie', v2f: 'Frequentie', v3f: 'Frequentie', v1t: 'Fijn', v2t: 'Fijn', v3t: 'Fijn', v2w: 'Pulsbreedte', v3w: 'Pulsbreedte', fF: 'Cutoff', fT: 'Fijn', fQ: 'Resonantie',
      aG: 'Begin', nL: 'Niveau', nC: 'Kleur', eA: 'ADSR A', eD: 'ADSR D', eS: 'ADSR S', eR: 'ADSR R', rA: 'AR A', rR: 'AR R', cR: 'Klok', lT: 'Lagtijd', pP: 'Pan', gL: 'Galm L', gR: 'Galm R', oL: 'Volume L', oR: 'Volume R',
      pL: 'Niveau', kP: 'Glijtijd', kV: 'Afstand', kT: 'Stemming' };
    function slider(parent, k) {
      const [, mn, mx, df, sc, name] = PBY[k], fmt = fmtFor(k), w = document.createElement('div'); w.className = 'k';
      const l = document.createElement('label'), i = document.createElement('input'), o = document.createElement('output'); l.textContent = tx(short[k] || name); l.title = tx(name); i.type = 'range'; i.setAttribute('aria-label', tx(name));
      const to = x => sc === 'log' ? mn * Math.pow(mx / mn, x) : x, from = v => sc === 'log' ? Math.log(v / mn) / Math.log(mx / mn) : v;
      if (sc === 'log') { i.min = 0; i.max = 1; i.step = 0.001; } else { i.min = mn; i.max = mx; i.step = (mx - mn) / 1000; }
      i.value = from(P[k]); i.dataset.pkDefault = String(from(df)); o.textContent = fmt(P[k]);
      i.oninput = () => { P[k] = to(+i.value); o.textContent = fmt(P[k]); after(); };
      refreshers.push(() => { i.value = from(P[k]); o.textContent = fmt(P[k]); }); w.append(l, i, o); parent.appendChild(w);
    }
    function chooser(parent, k, opts) {
      const w = document.createElement('div'); w.className = 'k'; const l = document.createElement('label'), s = document.createElement('select'); l.textContent = tx(PBY[k][5]).replace(/^(VCO-\d|Ringmod|Preamp|Voorversterker) /, '');
      s.setAttribute('aria-label', tx(PBY[k][5])); opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = tx(t); s.appendChild(o); });
      s.value = String(P[k]);
      s.onchange = () => { P[k] = +s.value; after(); refreshAll(); }; refreshers.push(() => { s.value = String(P[k]); }); w.append(l, s); parent.appendChild(w);
    }
    function jack(parent, id, dir, att) {
      const w = document.createElement('div'); w.className = 'j ' + (dir === 'o' ? 'out' : 'in') + (att ? ' att' : '');
      const b = document.createElement('button'); b.className = 'jk' + (dir === 'o' ? ' o' : ''); b.dataset.j = id; b.dataset.d = dir;
      const nm = document.createElement('span'); nm.className = 'nm';
      if (dir === 'o') { nm.textContent = on_(id).replace(/^(VCO-\d|Schakelaar|Switch) /, ''); b.title = tx('uitgang {0} — sleep naar een ingang', on_(id)); b.setAttribute('aria-label', tx('uitgang {0}', on_(id))); }
      else { const [, lab, nrm] = INBY[id]; nm.textContent = tx(lab); const sm = document.createElement('small'); sm.textContent = nrm ? '← ' + (own(SHORT, nrm) ? tx(SHORT[nrm]) : on_(nrm)) : ''; nm.appendChild(sm);
        b.title = nrm ? tx('ingang {0} (voorbedraad: {1})', tx(lab), on_(nrm)) : tx('ingang {0}', tx(lab)); b.setAttribute('aria-label', tx('ingang {0}', tx(lab))); }
      w.append(b, nm);
      if (att) { const i = document.createElement('input'), o = document.createElement('output'); i.type = 'range'; i.min = 0; i.max = 1; i.step = 0.001; i.setAttribute('aria-label', tx(PBY[att][5]));
        i.value = P[att]; i.dataset.pkDefault = String(PBY[att][3]); o.textContent = pct(P[att]);
        i.oninput = () => { P[att] = +i.value; o.textContent = pct(P[att]); after(); }; refreshers.push(() => { i.value = P[att]; o.textContent = pct(P[att]); }); w.append(i, o); }
      b.addEventListener('pointerdown', e => startDrag(e, b)); parent.appendChild(w); return b;
    }
    // ---------- kabels ----------
    const jackEl = {};
    function center(el) { const pr = ui.panel.getBoundingClientRect(), r = el.getBoundingClientRect(), k = ui.panel.offsetWidth / (pr.width || 1); return [(r.left + r.width / 2 - pr.left) * k, (r.top + r.height / 2 - pr.top) * k]; }
    function cordPath(a, b) { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), sag = 25 + d * 0.22; return `M${a[0]},${a[1]} C${a[0]},${a[1] + sag} ${b[0]},${b[1] + sag} ${b[0]},${b[1]}`; }
    function drawCords() {
      if (!ui.svg) return; const svg = ui.svg; svg.textContent = ''; const used = new Set();
      P.cords.forEach(([o, i], n) => { const a = jackEl['o:' + o], b = jackEl['i:' + i]; if (!a || !b) return; used.add(a); used.add(b);
        const pth = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pth.setAttribute('d', cordPath(center(a), center(b))); pth.setAttribute('stroke', CORD_COLORS[n % CORD_COLORS.length]);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'title'); t.textContent = tx('{0} → {1} ({2}) — klik om los te halen', on_(o), tx(INBY[i][1]), modOf(i)); pth.appendChild(t);
        pth.addEventListener('pointerdown', e => { e.stopPropagation(); }); pth.addEventListener('click', e => { e.stopPropagation(); P.cords.splice(n, 1); after(); drawCords(); }); svg.appendChild(pth); });
      Object.values(jackEl).forEach(el => el.classList.toggle('used', used.has(el) && !el.classList.contains('o')));
      if (drag && drag.line) svg.appendChild(drag.line);
    }
    function modOf(id) { const m = MODS.find(m => m.rows.some(r => r.k === 'in' && r.id === id)); return m ? tx(m.t) : ''; }
    let drag = null;
    function startDrag(e, el) {
      e.preventDefault(); e.stopPropagation(); let from = el;
      if (el.dataset.d === 'i') { const ix = P.cords.findIndex(c => c[1] === el.dataset.j); if (ix >= 0) { from = jackEl['o:' + P.cords[ix][0]]; P.cords.splice(ix, 1); after(); } }
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path'); line.setAttribute('class', 'tmp'); line.setAttribute('stroke', CORD_COLORS[P.cords.length % CORD_COLORS.length]);
      drag = { from, line }; drawCords();
      const move = ev => { const pr = ui.panel.getBoundingClientRect(), k = ui.panel.offsetWidth / (pr.width || 1); line.setAttribute('d', cordPath(center(from), [(ev.clientX - pr.left) * k, (ev.clientY - pr.top) * k])); };
      const up = ev => { window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true);
        const hit = root && root.elementFromPoint ? root.elementFromPoint(ev.clientX, ev.clientY) : null, to = hit && hit.closest ? hit.closest('.jk') : null; drag = null;
        if (to && to !== from) { let o = from, i = to; if (o.dataset.d === 'i' && i.dataset.d === 'o') [o, i] = [i, o];
          if (o.dataset.d === 'o' && i.dataset.d === 'i') { P.cords = P.cords.filter(c => c[1] !== i.dataset.j); P.cords.push([o.dataset.j, i.dataset.j]); after(); } }
        drawCords(); };
      move(e); window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true);
    }
    // de kabels worden getekend op de klok van de host (of meteen als die ontbreekt)
    const redraw = () => { if (host && typeof host.frame === 'function') cordsDirty = true; else Promise.resolve().then(drawCords); };
    const refreshAll = () => { refreshers.forEach(f => f()); redraw(); };
    function tick() { if (cordsDirty) { cordsDirty = false; drawCords(); } if (!snap) return; Object.entries(jackEl).forEach(([k, el]) => { if (k[0] !== 'o') return; const v = Math.abs(snap[OI[k.slice(2)]] || 0); el.style.setProperty('--lv', Math.min(1, v / 10).toFixed(2)); }); }

    function build(el) {
      root = el.attachShadow({ mode: 'open' }); const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const kk = document.createElement('div'); kk.className = 'kk'; root.appendChild(kk);
      const top = document.createElement('div'); top.className = 'top'; const tl = document.createElement('span'); tl.className = 'lbl'; tl.textContent = tx('Klank'); top.appendChild(tl);
      Object.keys(PRESETS).forEach(n => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { P = sane(Object.assign(DEFAULTS(), PRESETS[n])); after(); refreshAll(); }; top.appendChild(b); });
      const clr = document.createElement('button'); clr.textContent = tx('Alle kabels los'); clr.onclick = () => { P.cords = []; after(); drawCords(); }; top.appendChild(clr); kk.appendChild(top);
      const panel = document.createElement('div'); panel.className = 'panel'; kk.appendChild(panel); ui.panel = panel;
      MODS.forEach(m => { const box = document.createElement('div'); box.className = 'm'; box.style.gridColumn = m.c + (m.w ? ' / span ' + m.w : ''); if (m.b) box.style.gridRow = '2'; else if (m.c === 1) box.style.gridRow = 'auto';
        const h = document.createElement('h3'); h.textContent = tx(m.t); box.appendChild(h);
        m.rows.forEach(r => { if (r.k === 'sl') slider(box, r.p); else if (r.k === 'sel') chooser(box, r.p, r.o); else if (r.k === 'in') jackEl['i:' + r.id] = jack(box, r.id, 'i', r.att); else if (r.k === 'out') jackEl['o:' + r.id] = jack(box, r.id, 'o');
          else if (r.k === 'btn') { const b = document.createElement('button'); b.textContent = tx(r.t); b.addEventListener('pointerdown', e => { e.stopPropagation(); b.classList.add('on'); if (node) node.port.postMessage({ t: 'man', on: 1 }); });
            const off = () => { b.classList.remove('on'); if (node) node.port.postMessage({ t: 'man', on: 0 }); }; b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); box.appendChild(b); } });
        panel.appendChild(box); });
      // de eerste drie (voorversterker, volger, ringmod) stapelen in kolom 1
      const col1 = document.createElement('div'); col1.style.cssText = 'grid-column:1;grid-row:1;display:grid;gap:8px;align-content:start'; [...panel.children].slice(0, 3).forEach(b => { b.style.gridColumn = ''; col1.appendChild(b); }); panel.prepend(col1);
      [...panel.children].forEach(b => { if (b !== col1 && !b.style.gridRow) b.style.gridRow = '1'; });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'cords'); panel.appendChild(svg); ui.svg = svg;
      // klavier C2–C6 (49 toetsen), laagste toets = 0 V
      const keys = document.createElement('div'); keys.className = 'keys'; keys.setAttribute('aria-label', tx('klavier')); kk.appendChild(keys);
      const whites = []; for (let nn = 36; nn <= 84; nn++) if (![1, 3, 6, 8, 10].includes(nn % 12)) whites.push(nn);
      const ww = 100 / whites.length, held = new Map();
      const press = (b, nn) => { b.classList.add('down'); held.set(nn, b); noteMsg(true, nn, ctx.currentTime); }, release = nn => { const b = held.get(nn); if (!b) return; b.classList.remove('down'); held.delete(nn); noteMsg(false, nn, ctx.currentTime); };
      for (let nn = 36; nn <= 84; nn++) { const bl = [1, 3, 6, 8, 10].includes(nn % 12), b = document.createElement('button'); b.setAttribute('aria-label', tx('toets {0}', nn));
        if (bl) { const wi = whites.indexOf(nn - 1); b.className = 'b'; b.style.left = ((wi + 0.68) * ww) + '%'; b.style.width = (ww * 0.64) + '%'; } else if (nn % 12 === 0) b.textContent = 'C' + (nn / 12 - 1);
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); press(b, nn); }); b.addEventListener('pointerup', () => release(nn)); b.addEventListener('pointerleave', () => release(nn)); keys.appendChild(b); }
      const foot = document.createElement('div'); foot.className = 'foot';
      { const help = document.createElement('span'); tx('Sleep van een {0} naar een {1}. Een kabel vervangt de voorbedrade bron (←). Klik een kabel om hem los te halen; sleep vanaf een bezette ingang om hem te verleggen.').split(/(\{\d\})/).forEach(part => {
          if (part === '{0}' || part === '{1}') { const b = document.createElement('b'); b.className = part === '{0}' ? 'co' : 'ci'; b.textContent = tx(part === '{0}' ? 'uitgang' : 'ingang'); help.appendChild(b); } else if (part) help.appendChild(document.createTextNode(part)); });
        foot.appendChild(help); }
      ui.note = document.createElement('span'); ui.note.className = 'note'; ui.note.textContent = wstate === 'fout' ? tx('AudioWorklet niet beschikbaar.') : wstate === 'laden' ? tx('AudioWorklet laden…') : ''; foot.appendChild(ui.note); kk.appendChild(foot);
      refreshAll(); if (typeof ResizeObserver !== 'undefined') { ui.ro = new ResizeObserver(() => drawCords()); ui.ro.observe(panel); }
    }

    const self = {
      inputs: { in: inG }, outputs: { out },
      mount(el) { refreshers = []; const wrap = document.createElement('div'); el.appendChild(wrap); build(wrap);
        if (host && typeof host.frame === 'function') unframe = host.frame(self, tick, 12); },
      unmount() { if (unframe) { unframe(); unframe = null; } if (ui.ro) ui.ro.disconnect(); root = null; ui = {}; refreshers = []; Object.keys(jackEl).forEach(k => delete jackEl[k]); },
      onEvent(port, ev) { if (port !== 'notes' || !ev) return; const type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
        if ((type === 'panic' || type === 'allnotesoff') && node) { node.port.postMessage({ t: 'all' }); return; }
        if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(ev.note)) return;
        const t = Number.isFinite(ev.time) ? ev.time : ctx.currentTime, d = Number.isFinite(ev.dur) ? ev.dur : 0.25, n = ev.note | 0;
        // noteoff (of noteon zonder aanslag) laat de toets los; een aangehouden toets (held, noteon) blijft staan tot zijn noteoff komt
        if (type === 'noteoff' || ((type === 'noteon' || type === 'note') && ev.vel === 0)) { noteMsg(false, n, t); return; }
        noteMsg(true, n, t); if (type === 'note' && !ev.held) noteMsg(false, n, t + Math.max(0.01, d)); },
      onTransport({ playing }) { if (!playing && node) node.port.postMessage({ t: 'all' }); },
      params() { return MODP.map(([id, lane, role, drift, on, fst]) => { const [, mn, mx, , sc, name] = PBY[id]; return { id, name: tx(name), lane, laneName: tx(LANES[lane]), min: mn, max: mx, role, scale: sc === 'log' ? 'log' : 'lin', drift, on, fast: !!fst }; }); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODBY[k] && Number.isFinite(o[k])) mod[k] = o[k]; sendParams(); },
      modInput(id) { if (!own(fast, id)) return null; fastOn.add(id); return fast[id]; },
      getState() { return sane(P); },
      setState(s) { P = sane(s || {}); after(); refreshAll(); },
      destroy() { if (dead) return; dead = true; if (unframe) unframe(); try { inG.disconnect(); out.disconnect(); if (node) { node.port.postMessage({ t: 'all' }); node.disconnect(); } } catch (e) {} },
    };
    return self;
  }
};
