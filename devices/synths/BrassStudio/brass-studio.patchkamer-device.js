// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Eerste uitgave van Brass Studio (id nl.patchkamer.brassstudio), gebouwd voor Patchkamer contract v1.35.
//   Koperblazers als fysisch model in een AudioWorklet (BrassEngine), naast de subtractieve Brass Section en Woodwinds:
//   - lip-riet als massa-veersysteem (tweede-orde, resonantie volgt de noot) dat de klepstroom bepaalt; de stroom door de lipopening volgt een Bernoulli-achtige
//     wortelwet en wordt per sample implicit opgelost (geen iteratie), gekoppeld aan een golfgeleider (vertragingslijnen met derde-orde interpolatie)
//   - bel als reflectiefilter (laagdoorlaat) met doorgelaten deel als straling (hoogdoorlaat), verlies per heen-en-terugreis, kopstukresonantie als piekfilter
//   - instrumenten: trompet, bugel, trombone, basstrombone, hoorn, tuba (eigen belafsnijding, verlies, kleur en bereik; ongespeelbare noten worden een of meer octaven verschoven)
//   - brass-effect: niet-lineaire voortplanting (drukafhankelijke looptijd) plus een kleurverloop per dynamiek: zacht is rond, hard heeft bite
//   - aanzet met tongstoot (drukpuls en ruis), articulatie uit velocity en notelengte (kort is gestoten, lang is gebonden), legato bij overlappende noten
//   - vibrato (kaak en lip, vertraagd), scoop, rip, fall, doit, shake en drop, kleine verstemming en timing-menselijkheid, sectie van 1 tot 4 spelers (ook trompetten met trombone)
//   - dempers: straight, cup, harmon (met wa-wa), plunger (met wa-wa) en emmer; wa-wa met hand of automatisch
//   - bewaker: alleen eindige berichten, toestanden per blok gecontroleerd, uitgang begrensd; geen alloceren in het audiopad
//   - tweetalig (host.lang), setState volgt §13; stuurbaar via de paarse mod-ingang
const EN = {
  'Tongstoot': 'Tonguing', 'Blat': 'Bite', 'Helderheid': 'Brightness', 'Adem': 'Breath', 'Lipspanning': 'Lip tension',
  'Belgrootte': 'Bell size', 'Conus': 'Bore taper', 'Kopstuk': 'Mouthpiece',
  'Wa-wa': 'Wah', 'Wa-wa snelheid': 'Wah rate', 'Wa-wa diepte': 'Wah depth',
  'Vibrato': 'Vibrato', 'Vibratosnelheid': 'Vibrato rate', 'Vibratovertraging': 'Vibrato delay',
  'Versieringsmaat': 'Ornament amount', 'Verstemming': 'Section detune', 'Timing-menselijkheid': 'Timing looseness', 'Stereobreedte': 'Stereo width',
  'Stemming': 'Tuning', 'Transpositie': 'Transpose', 'Uitgang': 'Output',
  'Instrument': 'Instrument', 'Demper': 'Mute', 'Spelers': 'Players', 'Samenstelling': 'Section mix', 'Legato': 'Legato', 'Versiering': 'Ornament',
  'Trompet': 'Trumpet', 'Bugel': 'Flugelhorn', 'Trombone': 'Trombone', 'Basstrombone': 'Bass trombone', 'Hoorn': 'French horn', 'Tuba': 'Tuba',
  'Open': 'Open', 'Straight': 'Straight', 'Cup': 'Cup', 'Harmon': 'Harmon', 'Plunger': 'Plunger', 'Emmer': 'Bucket',
  'Zelfde': 'Same', 'Trompetten + trombone': 'Trumpets + trombone', 'Octaafdubbel': 'Octave doubling',
  'Uit': 'Off', 'Auto': 'Auto',
  'Geen': 'None', 'Scoop': 'Scoop', 'Rip': 'Rip', 'Fall': 'Fall', 'Doit': 'Doit', 'Shake': 'Shake', 'Drop': 'Drop',
  'Speler': 'Player', 'Instrument en kopstuk': 'Instrument and mouthpiece', 'Sectie': 'Section', 'Spel': 'Playing', 'Niveau': 'Level',
  'Proeftoon': 'Test note', 'Proefakkoord': 'Test chord', 'Alles uit': 'All off',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Brass Studio kan hier geen geluid maken.': 'AudioWorklet not available: Brass Studio cannot make sound here.',
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan, groep]
const SPEC = {
  tongue: ["Tongstoot", 0, 1, 0.01, 0.5, "%", "lin", "texture", 0.04, false, "play"],
  blat: ["Blat", 0, 1, 0.01, 0.55, "%", "lin", "color", 0.04, true, "tone"],
  bright: ["Helderheid", -1, 1, 0.01, 0, "tone", "lin", "filter", 0.05, true, "tone"],
  breath: ["Adem", 0, 1, 0.01, 0.25, "%", "lin", "texture", 0.04, true, "tone"],
  lip: ["Lipspanning", -1, 1, 0.01, 0, "tone", "lin", "color", 0.03, false, "tone"],
  bell: ["Belgrootte", -1, 1, 0.01, 0, "tone", "lin", "filter", 0.03, true, "horn"],
  bore: ["Conus", 0, 1, 0.01, 0.3, "%", "lin", "color", 0.03, true, "horn"],
  cup: ["Kopstuk", 0, 1, 0.01, 0.5, "%", "lin", "color", 0.03, true, "horn"],
  wah: ["Wa-wa", 0, 1, 0.01, 0.5, "%", "lin", "filter", 0.15, false, "mute"],
  wahRate: ["Wa-wa snelheid", 0, 8, 0.1, 0, "Hz", "lin", "rate", 0.1, false, "mute"],
  wahDepth: ["Wa-wa diepte", 0, 1, 0.01, 0.8, "%", "lin", "motion", 0.1, false, "mute"],
  vibrato: ["Vibrato", 0, 1, 0.01, 0.3, "%", "lin", "pitch", 0.05, true, "vibrato"],
  vibRate: ["Vibratosnelheid", 3, 8, 0.1, 5.2, "Hz", "lin", "rate", 0.03, false, "vibrato"],
  vibDelay: ["Vibratovertraging", 0, 1.5, 0.05, 0.35, "s", "lin", "motion", 0.03, false, "vibrato"],
  ornAmt: ["Versieringsmaat", 0, 1, 0.01, 0.5, "%", "lin", "pitch", 0.05, false, "play"],
  spread: ["Verstemming", 0, 40, 0.5, 8, "cent", "lin", "detune", 0.03, false, "section"],
  human: ["Timing-menselijkheid", 0, 30, 0.5, 6, "ms", "lin", "motion", 0.03, false, "section"],
  width: ["Stereobreedte", 0, 1, 0.01, 0.6, "%", "lin", "pan", 0.05, true, "section"],
  transpose: ["Transpositie", -24, 24, 1, 0, "st", "lin", "pitch", 0.001, false, "out"],
  tune: ["Stemming", -50, 50, 0.5, 0, "cent", "lin", "pitch", 0.002, false, "out"],
  level: ["Uitgang", 0, 1, 0.01, 0.8, "%", "lin", "level", 0.03, false, "out"],
};
// keuzes en gehele waarden: [min, max, start]
const INTS = { inst: [0, 5, 0], mute: [0, 5, 0], players: [1, 4, 1], mix: [0, 2, 0], legato: [0, 1, 1], orn: [0, 6, 0] };
const OPTS = {
  inst: ['Trompet', 'Bugel', 'Trombone', 'Basstrombone', 'Hoorn', 'Tuba'],
  mute: ['Open', 'Straight', 'Cup', 'Harmon', 'Plunger', 'Emmer'],
  players: ['1', '2', '3', '4'],
  mix: ['Zelfde', 'Trompetten + trombone', 'Octaafdubbel'],
  legato: ['Uit', 'Auto'],
  orn: ['Geen', 'Scoop', 'Rip', 'Fall', 'Doit', 'Shake', 'Drop'],
};
const MODEX = ['transpose', 'inst', 'mute', 'players', 'mix', 'legato', 'orn'];
const RANGES = {};
for (const [k, d] of Object.entries(SPEC)) RANGES[k] = [d[1], d[2], d[4]];
for (const [k, d] of Object.entries(INTS)) RANGES[k] = [d[0], d[1], d[2]];
// instrumentgegevens: bereik, fysische parameters en kalibratie per instrument (gemeten met het model zelf; zie AGENTS.md)
const INST = [
  {"lo":52,"hi":84,"fb":2000,"loss":0.96,"pm0":0.1,"thrA":-0.15,"pm1":0.965,"hiA":0,"vcurve":1,"dynDb":0,"fmF":1200,"fmG":4,"fmQ":1.5,"outG":0.179,"outS":4.43,"noise":0.114,"vibK":1,"beta":0.5,"lpK0":2,"lpHz0":900,"lpHz1":9000,"shMax":12,"sgn":1,"lipQ":6.09,"lipRatio":0.94,"kappa":0.395,"h0":0.052,"g":4.834,"name":"trumpet","c0":1.4144,"tauS":0.000181,"relLo":46,"rel":[-0.0012,-0.0009,0.0018,0.0018,0.001,0.0006,0.0006,0.0001,-0.0005,-0.0005,-0.0006,-0.0006,-0.0006,-0.0004,-0.0005,-0.0007,-0.0005,-0.0002,0.0002,0.0006,0.0009,0.0012,0.0014,0.002,0.0016,0.0021,0.0025,0.0019,0.0021,0.0018,0.0013,0.0009,-0.0003,-0.0017,-0.0017,-0.0028,-0.0038,-0.0045,-0.0048,-0.0046,-0.0048,-0.0053,-0.0058,0.0009,0.0002]},
  {"lo":52,"hi":80,"fb":1200,"loss":0.955,"pm0":0.1,"thrA":-0.15,"pm1":0.965,"hiA":0,"vcurve":1,"dynDb":0,"fmF":800,"fmG":3,"fmQ":1.5,"outG":0.1646,"outS":3.61,"noise":0.114,"vibK":1.1,"beta":0.2,"lpK0":1.8,"lpHz0":600,"lpHz1":4500,"shMax":6,"sgn":1,"lipQ":6.09,"lipRatio":0.94,"kappa":0.395,"h0":0.052,"g":4.834,"name":"flugelhorn","c0":1.3935,"tauS":0.000284,"relLo":46,"rel":[0.0011,0.0014,-0.0028,-0.0024,-0.0021,-0.0018,-0.0014,-0.0009,-0.0006,0,0.0004,0.0009,0.0011,0.0015,0.0018,0.0021,0.0022,0.0023,0.0022,0.0018,0.0013,0.0007,-0.0002,-0.001,-0.0025,-0.0031,-0.0038,-0.0045,-0.0047,-0.0046,-0.0041,-0.0028,-0.0019,0.0002,0.0024,0.0045,0.0072,0.0118,0.019,-0.0049,-0.0049]},
  {"lo":40,"hi":74,"fb":1000,"loss":0.96,"pm0":0.1,"thrA":-0.3,"pm1":0.965,"hiA":0,"vcurve":1,"dynDb":0,"fmF":650,"fmG":4,"fmQ":1.5,"outG":0.1364,"outS":4.02,"noise":0.114,"vibK":1,"beta":0.45,"lpK0":2,"lpHz0":500,"lpHz1":6500,"shMax":12,"sgn":1,"lipQ":6.09,"lipRatio":0.94,"kappa":0.395,"h0":0.052,"g":4.834,"name":"trombone","c0":1.4156,"tauS":0.000343,"relLo":34,"rel":[-0.0004,0,-0.0017,-0.0019,-0.0015,-0.0009,-0.001,-0.0005,-0.0004,-0.0005,-0.0005,-0.0003,-0.0002,0,0.0003,0.0005,0.0007,0.0005,0.001,0.0011,0.001,0.0012,0.0014,0.0015,0.0013,0.0012,0.0012,0.0011,0.0006,0.0004,-0.0001,-0.0006,-0.0014,-0.0018,-0.0025,-0.0029,-0.004,-0.0038,-0.0034,-0.0026,-0.0012,0.0005,0.0026,0.0049,0.0092,-0.0013,-0.0026]},
  {"lo":34,"hi":67,"fb":800,"loss":0.96,"pm0":0.1,"thrA":-0.3,"pm1":0.965,"hiA":0,"vcurve":1,"dynDb":0,"fmF":500,"fmG":4,"fmQ":1.5,"outG":0.1355,"outS":3.8,"noise":0.114,"vibK":0.8,"beta":0.4,"lpK0":2,"lpHz0":400,"lpHz1":4500,"shMax":9,"sgn":1,"lipQ":6.09,"lipRatio":0.94,"kappa":0.395,"h0":0.052,"g":4.834,"name":"basstrombone","c0":1.4279,"tauS":0.000501,"relLo":28,"rel":[-0.0083,-0.0072,0.008,0.0062,0.0046,0.0019,-0.0035,-0.0082,-0.009,-0.0096,-0.0092,-0.0086,-0.0081,-0.0076,-0.007,-0.0065,-0.0056,-0.0049,-0.0042,-0.0032,-0.0026,-0.0018,-0.0008,-0.0004,0.0008,0.0013,0.0017,0.0026,0.0032,0.0038,0.0043,0.0049,0.0056,0.0062,0.0065,0.0073,0.0082,0.009,0.0104,0.012,0.0139,0.0167,0.0195,0.0239,0.0055,0.0054]},
  {"lo":41,"hi":70,"fb":750,"loss":0.955,"pm0":0.1,"thrA":-0.3,"pm1":0.965,"hiA":0,"vcurve":1,"dynDb":0,"fmF":550,"fmG":3,"fmQ":1.5,"outG":0.123,"outS":3.77,"noise":0.114,"vibK":0.6,"beta":0.25,"lpK0":1.8,"lpHz0":350,"lpHz1":5000,"shMax":8,"sgn":1,"lipQ":6.09,"lipRatio":0.94,"kappa":0.395,"h0":0.052,"g":4.834,"name":"horn","c0":1.3626,"tauS":0.000123,"relLo":35,"rel":[0.0005,-0.0014,0.0219,0.0179,0.0153,0.0137,0.0113,0.0093,0.0077,0.0061,0.0043,0.0026,0.0006,-0.0017,-0.0036,-0.0061,-0.0089,-0.0116,-0.0148,-0.0185,-0.0219,-0.0262,-0.0305,-0.0355,-0.0405,-0.0461,-0.0519,-0.0583,-0.0646,-0.0715,-0.0783,-0.0851,-0.092,-0.0988,-0.1054,-0.112,-0.1183,-0.1243,-0.1306,-0.1362,-0.0644,-0.0674]},
  {"lo":28,"hi":60,"fb":450,"loss":0.95,"pm0":0.1,"thrA":-0.4,"pm1":0.965,"hiA":0,"vcurve":1,"dynDb":0,"fmF":300,"fmG":3,"fmQ":1.5,"outG":0.0771,"outS":4.62,"noise":0.114,"vibK":0.4,"beta":0.2,"lpK0":1.8,"lpHz0":250,"lpHz1":2500,"shMax":6,"sgn":1,"lipQ":6.09,"lipRatio":0.94,"kappa":0.395,"h0":0.052,"g":4.834,"name":"tuba","c0":1.4906,"tauS":0.001327,"relLo":22,"rel":[-0.0395,-0.0394,-0.0402,-0.0406,-0.0412,-0.0416,-0.042,-0.0417,-0.0418,-0.0411,-0.0407,-0.0399,-0.0394,-0.0393,-0.0385,-0.0382,-0.0369,-0.0351,-0.0328,-0.0305,-0.0281,-0.0253,-0.0222,-0.0187,-0.0152,-0.0116,-0.008,-0.0037,0.0006,0.0048,0.0096,0.0144,0.0195,0.0252,0.0316,0.0383,0.0464,0.0553,0.0653,0.0768,0.0895,0.1032,0.119,0.014,0.0166]},
];
const WNAME = 'nl-patchkamer-brassstudio-1-0-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const INST = ${JSON.stringify(INST)};
// BrassStudio: fysisch model. Lip-riet (massa-veer, klepstroom implicit opgelost) + golfgeleider met belreflectie en kopstukresonantie.
const TWO_PI = Math.PI * 2, SZ = 8192, MK = SZ - 1, CTL = 32, NVOICE = 20, MAXACT = 16;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const fin = x => x > -1e6 && x < 1e6;
const BL = b => (b < 0.55 ? 0.15 + b * 0.7273 : b);
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
const sclip = x => (x >= 3 ? 1 : x <= -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x));
const rdc = (buf, pos) => {
  const i = Math.floor(pos), f = pos - i, y0 = buf[(i - 1) & MK], y1 = buf[i & MK], y2 = buf[(i + 1) & MK], y3 = buf[(i + 2) & MK];
  return ((0.5 * (y3 - y0) + 1.5 * (y1 - y2)) * f + (y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3)) * f * f + 0.5 * (y2 - y0) * f + y1;
};
class Voice {
  constructor() { this.dn = new Float64Array(SZ); this.up = new Float64Array(SZ); this.on = false; this.reset(); }
  reset() {
    this.dn.fill(0); this.up.fill(0); this.wp = 0;
    this.ic1 = 0; this.ic2 = 0; this.bz1 = 0; this.bz2 = 0; this.dcx = 0; this.dcy = 0; this.p = 0; this.dsm = 40;
    this.yDC = 0; this.lastYa = 0; this.lastCross = -1; this.yEnv = 0; this.rel = 0; this.cnt = 0; this.tn = 0; this.tv = 0;
    this.fz1 = 0; this.fz2 = 0; this.lpz = 0; this.lpz2 = 0; this.shz = 0; this.nzs = 0; this.wPrev = 0; this.sm = 0; this.pm = 0; this.g = 0; this.oe = 0; this.pe = 0;
    this.on = false; this.id = -1; this.released = false; this.dying = 0; this.delay = 0; this.tcRel = 0; this.boost = 1;
    this.wander = 0; this.drift = 0; this.slurred = false; this.relT = 0; this.pmRel = 0; this.tr = 0.05; this.tOff = Infinity; this.lastBoostT = 0;
    this.burstE = 0; this.fcur = 440; this.fPrev = 440; this.portCt = 0; this.dsmT = 40; this.ornT = 0; this.pmTgt = 0; this.dpm = 0; this.gT = 0;
  }
}
class BrassEngine {
  constructor(sr) {
    this.sr = sr; this.q = []; this.rs = 0x1badf00d | 0; this.P = {}; this.S = {};
    for (const k in RANGES) { this.P[k] = RANGES[k][2]; this.S[k] = RANGES[k][2]; }
    this.v = []; for (let i = 0; i < NVOICE; i++) this.v.push(new Voice());
    this.bL = new Float64Array(4096); this.bR = new Float64Array(4096);
    this.mz = new Float64Array(24); this.dc = new Float64Array(4); this.tz = new Float64Array(2); this.wahPh = 0; this.lastGroup = null; this.lastT = -9; this.lastId = -2;
    this.mmix = 0; this.mcf = new Float64Array(11); this.quiet = 0; this.dn = 1e-18; this.tcMax = 0.1; this.relForce = 0;
  }
  rnd() { let s = this.rs; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rs = s; return (s >>> 0) / 2147483648 - 1; }
  setParams(p) {
    if (!p || typeof p !== 'object') return;
    for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); }
  }
  insert(m) { if (this.q.length >= 2048) return; let i = this.q.length; while (i > 0 && this.q[i - 1].t > m.t) i--; this.q.splice(i, 0, m); }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'stop') { this.q.length = 0; this.stopAll(); return; }
    if (!(typeof m.t === 'number' && isFinite(m.t))) return;
    const id = typeof m.id === 'number' && isFinite(m.id) ? m.id : -1;
    if (m.type === 'on') {
      if (!(typeof m.note === 'number' && isFinite(m.note))) return;
      const vel = typeof m.vel === 'number' && isFinite(m.vel) ? clampN(m.vel, 0, 1) : 0.8;
      if (vel <= 0) return;
      this.insert({ type: 'on', t: m.t, id, note: clampN(m.note, 0, 127), vel, dur: typeof m.dur === 'number' && isFinite(m.dur) && m.dur > 0 ? clampN(m.dur, 0.005, 3600) : Infinity });
    } else if (m.type === 'off') this.insert({ type: 'off', t: m.t, id, note: typeof m.note === 'number' && isFinite(m.note) ? m.note : -1 });
  }
  stopAll() { for (const v of this.v) if (v.on && !v.released) { v.tOff = 0; v.stopNow = true; } }
  fold(I, m) { const lo = I.lo - 4, hi = I.hi + 4; if (m < lo) m += 12 * Math.ceil((lo - m) / 12); if (m > hi) m -= 12 * Math.ceil((m - hi) / 12); return m; }
  alloc() {
    let act = 0; for (const v of this.v) if (v.on && !v.dying) act++;
    if (act >= MAXACT) {
      let best = null;
      for (const v of this.v) if (v.on && !v.dying && v.released && (!best || v.pm < best.pm)) best = v;
      if (!best) for (const v of this.v) if (v.on && !v.dying && (!best || v.cnt > best.cnt)) best = v;
      if (best) best.dying = 1;
    }
    for (const v of this.v) if (!v.on) return v;
    return null;
  }
  noteOn(m) {
    const P = this.P, sr = this.sr, nPl = Math.round(P.players), mix = Math.round(P.mix), main = Math.round(P.inst);
    let slurFrom = null;
    if (P.legato >= 1 && this.lastGroup && Math.abs(m.t - this.lastT) > 0.004) {
      const lg = this.lastGroup;
      let ok = lg.length === nPl;
      if (ok) for (const v of lg) if (!(v.on && !v.dying && v.id === this.lastId && (!v.released || v.tn - v.relT < 0.045))) ok = false;
      let others = 0; for (const v of this.v) if (v.on && !v.dying && !lg.includes(v) && !v.released) others++;
      if (ok && others === 0) slurFrom = lg;
    }
    const group = [];
    for (let j = 0; j < nPl; j++) {
      let inst = main, shift = 0;
      if (mix === 1 && nPl >= 2 && j === nPl - 1) { inst = 2; shift = -12; }
      else if (mix === 2) { if (nPl >= 3 && j >= nPl - 2) { inst = 2; shift = -12; } else if (nPl === 2 && j === 1) shift = -12; }
      const I = INST[inst], mnote = this.fold(I, m.note + shift);
      let v = slurFrom ? slurFrom[j] : null; const slur = !!v;
      if (!v) v = this.alloc(); if (!v) continue;
      this.start(v, m, I, inst, mnote, nPl > 1 ? (j / (nPl - 1)) * 2 - 1 : 0, j, nPl, slur);
      group.push(v);
    }
    this.lastGroup = group; this.lastT = m.t; this.lastId = m.id;
  }
  start(v, m, I, inst, mnote, pos, j, nPl, slur) {
    const P = this.P, sr = this.sr;
    let fPrev = 0;
    if (slur) fPrev = v.f0;
    else { v.reset(); v.on = true; v.delay = Math.round(Math.abs(this.rnd()) * P.human * 0.001 * sr * (j > 0 ? 1 : 0.3)); }
    v.id = m.id; v.inst = inst; v.I = I; v.note = mnote; v.vel = m.vel; v.slurred = slur; v.released = false; v.dying = 0; v.stopNow = false;
    v.f0 = midiHz(mnote);
    if (slur) { v.portCt = clampN(1200 * Math.log2(fPrev / v.f0), -2400, 2400); } else { v.portCt = 0; v.fcur = v.f0; }
    if (!slur) {
      v.det = (pos * 0.8 + 0.4 * this.rnd()) * P.spread + (nPl > 1 ? 0 : 0.5 * this.rnd() * Math.min(P.spread, 6));
      v.vph = this.rnd() * 6; v.vr = 1 + 0.06 * this.rnd();
    }
    if (!slur) v.tv = 0;
    v.tn = 0; v.tOff = isFinite(m.dur) ? Math.max(m.dur, 0.035 + 5 / v.f0) : Infinity; v.short = isFinite(m.dur) ? clampN((0.2 - m.dur) / 0.15, 0, 1) : 0;
    const vel = m.vel, hard = slur ? 0.05 : clampN(0.55 * vel + 0.7 * P.tongue - 0.1, 0, 1);
    v.hard = hard;
    v.ta = slur ? 0.0002 : 0.05 * Math.pow(0.1, hard) * (1 - 0.5 * v.short) + 0.004;
    v.bite = slur ? 0 : (0.05 + 0.9 * hard * hard) * (0.4 + 0.6 * BL(P.blat));
    v.tb = 0.025 + 0.02 * (1 - hard) + (slur ? 0 : 6 / v.f0);
    v.mp = (mnote - 69) / 12;
    const pmLo = I.pm0 * Math.pow(2, I.thrA * v.mp), pmHi = I.pm1 * Math.pow(2, I.hiA * v.mp);
    v.pmS = pmLo + (pmHi - pmLo) * Math.pow(vel, I.vcurve);
    v.boost = 1; v.lastBoostT = 0;
    v.orn = Math.round(P.orn); v.amt = P.ornAmt;
    v.gainV = Math.pow(10, -(1 - Math.pow(vel, 0.8)) * I.dynDb / 20) / Math.sqrt(nPl);
    const pan = nPl > 1 ? pos * P.width * 0.85 : 0, a = (pan + 1) * Math.PI / 4;
    v.gl = Math.cos(a) * 1.4142; v.gr = Math.sin(a) * 1.4142;
    v.burstE = (slur ? 0 : 1) * (0.2 + 0.8 * hard) * (0.3 + 0.7 * P.tongue) * 0.3;
    v.relT = 0; v.tr = 0.05;
    this.bellSetup(v, I);
    if (!slur) { v.ic2 = 0.15 * (0.4 + 0.6 * hard); }
    if (!slur) { v.dsm = this.dFor(v, I, sr / v.f0, 0, v.f0); v.dsmT = v.dsm; v.slurT0 = 0; }
    v.slurDip = slur ? 1 : 0;
  }
  bellSetup(v, I) {
    const P = this.P, sr = this.sr;
    const fb = clampN(I.fb * Math.pow(2, -0.3 * P.bell), 120, sr * 0.4);
    const w = TWO_PI * fb / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al;
    v.bb0 = (1 - cs) / 2 / a0; v.bb1 = (1 - cs) / a0; v.bb2 = v.bb0; v.ba1 = -2 * cs / a0; v.ba2 = (1 - al) / a0;
    const fm = clampN(I.fmF * (1 - 0.25 * (P.cup - 0.5)), 200, sr * 0.4), gdb = I.fmG * (0.4 + 1.2 * P.cup), A = Math.pow(10, gdb / 40), wm = TWO_PI * fm / sr, cm = Math.cos(wm), am = Math.sin(wm) / (2 * I.fmQ), am0 = 1 + am / A;
    v.fb0 = (1 + am * A) / am0; v.fb1 = -2 * cm / am0; v.fb2 = (1 - am * A) / am0; v.fa1 = -2 * cm / am0; v.fa2 = (1 - am / A) / am0;
    v.loss = I.loss * (1 - 0.05 * P.bore);
    v.lipQ = I.lipQ * (1 + 0.3 * (P.cup - 0.5)); v.kappa = I.kappa; v.h0 = I.h0; v.gA = I.g;
    v.lipR = I.lipRatio * Math.pow(2, 0.025 * P.lip); v.noiseG = I.noise;
    v.beta = Math.min(0.35, I.beta * BL(P.blat));
  }
  relFF(I, m) {
    const t = I.rel; if (!t) return 0; const x = clampN(m - I.relLo, 0, t.length - 1), i = Math.min(t.length - 2, Math.floor(x)), f = x - i;
    return t[i] + (t[i + 1] - t[i]) * f;
  }
  dFor(v, I, Pp, rel, f) {
    return clampN((I.c0 + rel + this.relFF(I, 69 + 12 * Math.log2(f / 440))) * Pp - I.tauS * this.sr + (this.sr / 48000 - 1), 8, SZ - 16);
  }
  noteOff(m) {
    for (const v of this.v) {
      if (!v.on || v.released || v.dying) continue;
      if (m.id >= 0 ? v.id === m.id : v.note === m.note) { if (v.tn < v.tOff) v.tOff = v.tn; }
    }
  }
  runVoice(v, b, n) {
    const sr = this.sr, P = this.P, S = this.S, I = v.I, bL = this.bL, bR = this.bR;
    let s0 = 0;
    if (v.delay > 0) { const d = Math.min(v.delay, n); v.delay -= d; s0 = d; if (s0 >= n) return; }
    const dt = (n - s0) / sr;
    v.tn += dt;
    // ---- besturing per blokje ----
    if (!v.released && (v.tn >= v.tOff || v.stopNow)) {
      v.released = true; v.relT = v.tn; v.pmRel = v.pmCur || v.pm;
      let tr;
      const am = v.amt, o = v.orn;
      if (v.stopNow) tr = 0.03;
      else if (o === 3) tr = 0.2 + 0.35 * am; else if (o === 4) tr = 0.15 + 0.25 * am; else if (o === 6) tr = 0.1 + 0.15 * am;
      else if (v.short > 0) tr = 0.045 - 0.033 * v.short; else tr = 0.05 + 0.05 * (1 - v.hard);
      v.tr = tr;
    }
    const tn = v.tn, rt = v.released ? tn - v.relT : 0;
    // toonhoogte in cent
    let ct = v.det + P.tune + v.drift;
    v.drift += (this.rnd() * 5 - v.drift) * 0.02;
    v.tv += dt; const vf = clampN((v.tv - P.vibDelay) / 0.5, 0, 1), vibDepth = P.vibrato * I.vibK * 35;
    v.vph += TWO_PI * P.vibRate * v.vr * dt; if (v.vph > 6283) v.vph -= 6283;
    const vs = Math.sin(v.vph);
    ct += vs * vibDepth * vf;
    if (v.portCt) ct += v.portCt * Math.exp(-tn / 0.03);
    const am = v.amt;
    switch (v.orn) {
      case 1: ct -= (80 + 260 * am) * Math.exp(-tn / (0.05 + 0.1 * am)); break;
      case 2: { const T = 0.12 + 0.2 * am; if (tn < T) ct -= (500 + 700 * am) * Math.pow(1 - tn / T, 1.6); break; }
      case 3: if (v.released) ct -= (400 + 1400 * am) * (1 - Math.exp(-rt / (0.12 + 0.25 * am))); break;
      case 4: if (v.released) ct += (300 + 700 * am) * (1 - Math.exp(-rt / (0.1 + 0.15 * am))); break;
      case 5: ct += (50 + 190 * am) * Math.sin(TWO_PI * 6.6 * tn) * clampN((tn - 0.08) / 0.08, 0, 1); break;
      case 6: if (v.released) ct -= (150 + 350 * am) * (1 - Math.exp(-rt / (0.05 + 0.08 * am))); break;
    }
    const f = clampN(v.f0 * Math.pow(2, ct / 1200), 22, sr * 0.2), Pp = sr / f; v.fcur = f;
    // doel van de vertraging: ff + gemeten bijsturing
    const dT = this.dFor(v, I, Pp, v.tcRel + this.relForce, f);
    v.dsmT = dT;
    // lip
    const gl = Math.tan(Math.PI * Math.min(f * v.lipR, sr * 0.4) / sr), kq = 1 / v.lipQ, a1 = 1 / (1 + gl * (gl + kq)), a2 = gl * a1, a3 = gl * a2;
    // mondstukdruk
    let pmT;
    if (!v.released) {
      const a = 1 - Math.exp(-tn / (v.ta * 0.4)), bite = v.bite * Math.exp(-tn / v.tb);
      v.wander += (this.rnd() * 0.12 - v.wander) * 0.05;
      let e = a * (1 + bite) * (1 + v.wander) * (1 + 0.05 * P.vibrato * vf * vs);
      if (v.orn === 2) e *= 0.55 + 0.45 * Math.min(1, tn / (0.12 + 0.2 * v.amt));
      if (v.slurDip) e *= 1 - 0.18 * Math.exp(-tn / 0.03);
      // aanspreekbewaking: spreekt de noot niet, dan blaast de speler iets harder
      if (tn > 0.03 + 3 / v.f0 && v.yEnv < 0.06 && tn - v.lastBoostT > 0.02 + 3 / v.f0 && v.boost < 3) { v.boost *= 1.2; v.lastBoostT = tn; }
      else if (v.yEnv > 0.3 && v.boost > 1) v.boost += (1 - v.boost) * Math.min(1, dt / 0.2);
      pmT = v.pmS * v.boost * e; v.pmCur = pmT;
    } else pmT = v.pmRel * Math.exp(-rt / v.tr);
    v.dpm = (pmT - v.pm) / (n - s0);
    // sluiting van de lip bij loslaten en demping van de boring
    const closeK = v.released ? Math.exp(-rt / 0.025) : 1;
    const h0e = v.h0 * closeK;
    const lossE = v.loss * (v.released ? 1 - (1 - (v.quickRel ? 0.5 : 0.75)) * (1 - Math.exp(-rt / 0.012)) : 1);
    // uitgang: helderheid per dynamiek en toonhoogte
    const lpF = clampN(Math.max(f * I.lpK0, I.lpHz0 + (I.lpHz1 - I.lpHz0) * Math.pow(v.vel, 0.7)) * Math.pow(2, 0.8 * S.bright), 150, sr * 0.45);
    const alp = 1 - Math.exp(-TWO_PI * lpF / sr), ash = 1 - Math.exp(-TWO_PI * 2200 / sr), ksh = Math.pow(10, I.shMax * Math.pow(v.vel, 1.5) * (0.35 + 1.3 * BL(P.blat)) / 20) - 1;
    let gT = I.outG * Math.pow(10, -I.outS * v.mp / 20) * v.gainV * (S.level * S.level * 1.6);
    if (v.dying) gT = 0;
    if (v.stopNow && rt > 0.2) { v.on = false; return; }
    // vrijgeven
    if (v.released && rt > 0.02 && (v.oe < 2e-5 && rt > v.tr * 0.6 + 0.02)) { v.on = false; return; }
    if (v.released && rt > 6) { v.on = false; return; }
    // ---- per-sample ----
    let { ic1, ic2, bz1, bz2, dcx, dcy, p, dsm, yDC, lastYa, lastCross, yEnv, fz1, fz2, lpz, lpz2, shz, nzs, pm, g, oe, wp, wPrev, sm } = v;
    const up = v.up, dn = v.dn, bb0 = v.bb0, bb1 = v.bb1, bb2 = v.bb2, ba1 = v.ba1, ba2 = v.ba2, fb0 = v.fb0, fb1 = v.fb1, fb2 = v.fb2, fa1 = v.fa1, fa2 = v.fa2;
    const kappa = v.kappa, gA = v.gA, hmax = 3 * v.h0 + 1.2, noiseG = v.noiseG * (0.3 + 1.4 * P.breath), beta = v.beta, dpm = v.dpm;
    const rsg = I.sgn, tcMax = this.tcMax, kdc = TWO_PI * Math.min(8, f * 0.12) / sr, dcr = 1 - TWO_PI * 20 / sr, Ptgt = Pp, kt = 0.8, dsmK = 0.02;
    const dg = (gT - g) / (v.dying ? Math.max(1, 0.003 * sr) : (n - s0)) , gcap = v.dying ? 0 : -1;
    let burst = v.burstE * Math.exp(-tn / 0.012), bk = Math.exp(-1 / (0.012 * sr)), cnt = v.cnt, rs = this.rs, tc = v.tcRel;
    const nb = b + s0;
    for (let i = 0; i < n - s0; i++) {
      pm += dpm; g += dg;
      const dp = pm - p;
      const v3 = kappa * dp - ic2, v1 = a1 * ic1 + a2 * v3, y = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * y - ic2;
      let h = h0e + y; if (h < 0) h = 0; else if (h > hmax) h = hmax;
      const A = gA * h;
      dsm += (dT - dsm) * dsmK;
      const d1 = dsm * 0.5;
      const pin = rdc(up, wp - d1);
      const q = pm - 2 * pin;
      let z;
      if (q >= 0) { const s = 0.5 * (Math.sqrt(A * A + 4 * q) - A); z = A * s; } else { const s = 0.5 * (Math.sqrt(A * A - 4 * q) - A); z = -A * s; }
      rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5; const nz = (rs >>> 0) / 2147483648 - 1; nzs += 0.35 * (nz - nzs);
      const az = z < 0 ? -z : z;
      let pout = pin + z + (nz - nzs) * (noiseG * az + burst + 0.0004);
      if (pout > 8) pout = 8; else if (pout < -8) pout = -8;
      p = pin + pout;
      dn[wp & MK] = pout;
      let w;
      if (beta > 0) { let tg = d1 * beta * clampN(wPrev, -1, 1) - sm; sm += tg > 0.8 ? 0.8 : tg < -0.8 ? -0.8 : tg; w = rdc(dn, wp - d1 + sm); } else w = rdc(dn, wp - d1);
      wPrev = w;
      const lp = bb0 * w + bz1; bz1 = bb1 * w - ba1 * lp + bz2; bz2 = bb2 * w - ba2 * lp;
      let r = rsg * lossE * lp;
      const dco = r - dcx + dcr * dcy; dcx = r; dcy = dco;
      up[wp & MK] = dco;
      wp++;
      burst *= bk;
      // straling door de bel: doorgelaten deel van de golf
      const rad = w - lp;
      // kopstukresonantie (piekfilter)
      const fo = fb0 * rad + fz1; fz1 = fb1 * rad - fa1 * fo + fz2; fz2 = fb2 * rad - fa2 * fo;
      lpz += alp * (fo - lpz); lpz2 += alp * (lpz - lpz2);
      shz += ash * (lpz2 - shz); const o = (lpz2 + ksh * (lpz2 - shz)) * g;
      const ao = o < 0 ? -o : o; oe = ao > oe ? ao : oe * 0.9995;
      bL[nb + i] += o * v.gl; bR[nb + i] += o * v.gr;
      // toonhoogtebewaking: meet de periode van de lipbeweging
      yDC += (y - yDC) * kdc; const ya = y - yDC; const ay = ya < 0 ? -ya : ya; yEnv = ay > yEnv ? ay : yEnv * 0.9993;
      cnt++;
      if (lastYa < 0 && ya >= 0 && yEnv > 0.05) {
        const fr = -lastYa / (ya - lastYa), tcr = cnt - 1 + fr;
        if (lastCross > 0) { const T = tcr - lastCross; if (T > 0.6 * Ptgt && T < 1.7 * Ptgt) { tc += kt * (Ptgt - T) / Ptgt; if (tc > tcMax) tc = tcMax; else if (tc < -tcMax) tc = -tcMax; } }
        lastCross = tcr;
      }
      lastYa = ya;
    }
    this.rs = rs;
    v.ic1 = ic1; v.ic2 = ic2; v.bz1 = bz1; v.bz2 = bz2; v.dcx = dcx; v.dcy = dcy; v.p = p; v.dsm = dsm; v.yDC = yDC; v.lastYa = lastYa; v.lastCross = lastCross - 0; v.yEnv = yEnv;
    v.fz1 = fz1; v.fz2 = fz2; v.lpz = lpz; v.lpz2 = lpz2; v.shz = shz; v.nzs = nzs; v.pm = pm; v.g = g; v.oe = oe; v.wp = wp & MK; v.wPrev = wPrev; v.sm = sm; v.cnt = cnt; v.tcRel = tc;
    if (v.dying && g < 1e-3) v.on = false;
    // lastCross moet de wrap van wp niet volgen: het is een teller van cnt
  }
  muteCfg(type, wah) {
    const c = this.mcf;
    switch (type) {
      case 1: c[0] = 260; c[1] = 0.7; c[2] = 2900; c[3] = 6; c[4] = 1.4; c[5] = 1000; c[6] = -2; c[7] = 1; c[8] = 8000; c[9] = 0.7; c[10] = 0.85; return c;
      case 2: c[0] = 0; c[1] = 0.7; c[2] = 900; c[3] = 3; c[4] = 1.2; c[5] = 0; c[6] = 0; c[7] = 1; c[8] = 3400; c[9] = 0.7; c[10] = 1.15; return c;
      case 3: c[0] = 520; c[1] = 0.8; c[2] = 1800 * Math.pow(2, (wah - 0.5) * 1.9); c[3] = 11; c[4] = 4.5; c[5] = 4200; c[6] = -3; c[7] = 1.5; c[8] = 8500; c[9] = 0.7; c[10] = 1.25; return c;
      case 4: c[0] = 150; c[1] = 0.7; c[2] = 0; c[3] = 0; c[4] = 1; c[5] = 0; c[6] = 0; c[7] = 1; c[8] = 380 * Math.pow(2, wah * 3.4); c[9] = 1.5; c[10] = 1 + (1 - wah) * 0.9; return c;
      case 5: c[0] = 0; c[1] = 0.7; c[2] = 600; c[3] = 4; c[4] = 1; c[5] = 0; c[6] = 0; c[7] = 1; c[8] = 1500; c[9] = 0.7; c[10] = 1.3; return c;
    }
    return null;
  }
  busOut(L, R, len) {
    const sr = this.sr, S = this.S, P = this.P, bL = this.bL, bR = this.bR, mz = this.mz, dc = this.dc, tz = this.tz;
    const type = Math.round(P.mute), dcr = 1 - TWO_PI * 8 / sr;
    let wah = S.wah;
    if (S.wahRate > 0.01) { this.wahPh += TWO_PI * S.wahRate * len / sr; if (this.wahPh > 6283) this.wahPh -= 6283; wah = clampN(S.wah + S.wahDepth * 0.5 * Math.sin(this.wahPh), 0, 1); }
    const cfg = type > 0 ? this.muteCfg(type, wah) : null;
    this.mmix += ((cfg ? 1 : 0) - this.mmix) * (1 - Math.exp(-len / (sr * 0.02)));
    const wet = this.mmix, tilt = Math.pow(10, S.bright * 3 / 20) - 1, tk = 1 - Math.exp(-TWO_PI * 2500 / sr);
    let hg = 0, ha1 = 0, ha2 = 0, ha3 = 0, hk = 1, pg = 0, pa1 = 0, pa2 = 0, pa3 = 0, pk = 1, pG = 0, qg = 0, qa1 = 0, qa2 = 0, qa3 = 0, qk = 1, qG = 0, lg = 0, la1 = 0, la2 = 0, la3 = 0, lk = 1, mg = 1, useH = 0, useP = 0, useQ = 0, useL = 0;
    if (cfg) {
      if (cfg[0] > 0) { useH = 1; hg = Math.tan(Math.PI * clampN(cfg[0], 20, sr * 0.4) / sr); hk = 1 / cfg[1]; ha1 = 1 / (1 + hg * (hg + hk)); ha2 = hg * ha1; ha3 = hg * ha2; }
      if (cfg[2] > 0 && cfg[3] !== 0) { useP = 1; pg = Math.tan(Math.PI * clampN(cfg[2], 20, sr * 0.4) / sr); pk = 1 / cfg[4]; pa1 = 1 / (1 + pg * (pg + pk)); pa2 = pg * pa1; pa3 = pg * pa2; pG = Math.pow(10, cfg[3] / 20) - 1; }
      if (cfg[5] > 0 && cfg[6] !== 0) { useQ = 1; qg = Math.tan(Math.PI * clampN(cfg[5], 20, sr * 0.4) / sr); qk = 1 / cfg[7]; qa1 = 1 / (1 + qg * (qg + qk)); qa2 = qg * qa1; qa3 = qg * qa2; qG = Math.pow(10, cfg[6] / 20) - 1; }
      if (cfg[8] > 0) { useL = 1; lg = Math.tan(Math.PI * clampN(cfg[8], 20, sr * 0.45) / sr); lk = 1 / cfg[9]; la1 = 1 / (1 + lg * (lg + lk)); la2 = lg * la1; la3 = lg * la2; }
      mg = cfg[10];
    }
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < 2; c++) {
        const x0 = (c ? bR[i] : bL[i]) + this.dn, o = c * 12;
        let x = x0;
        if (cfg) {
          if (useH) { const v3 = x - mz[o + 1], v1 = ha1 * mz[o] + ha2 * v3, v2 = mz[o + 1] + ha2 * mz[o] + ha3 * v3; mz[o] = 2 * v1 - mz[o]; mz[o + 1] = 2 * v2 - mz[o + 1]; x = x - hk * v1 - v2; }
          if (useP) { const v3 = x - mz[o + 3], v1 = pa1 * mz[o + 2] + pa2 * v3, v2 = mz[o + 3] + pa2 * mz[o + 2] + pa3 * v3; mz[o + 2] = 2 * v1 - mz[o + 2]; mz[o + 3] = 2 * v2 - mz[o + 3]; x += pG * pk * v1; }
          if (useQ) { const v3 = x - mz[o + 5], v1 = qa1 * mz[o + 4] + qa2 * v3, v2 = mz[o + 5] + qa2 * mz[o + 4] + qa3 * v3; mz[o + 4] = 2 * v1 - mz[o + 4]; mz[o + 5] = 2 * v2 - mz[o + 5]; x += qG * qk * v1; }
          if (useL) { const v3 = x - mz[o + 7], v1 = la1 * mz[o + 6] + la2 * v3, v2 = mz[o + 7] + la2 * mz[o + 6] + la3 * v3; mz[o + 6] = 2 * v1 - mz[o + 6]; mz[o + 7] = 2 * v2 - mz[o + 7]; x = v2; }
          x *= mg;
        }
        x = x0 + (x - x0) * wet;
        // lichte kleurregeling: hoog meer of minder
        tz[c] += tk * (x - tz[c]); x += tilt * (x - tz[c]);
        const hp = x - dc[c] + dcr * dc[c + 2]; dc[c] = x; dc[c + 2] = hp;
        const y = sclip(hp * 0.9); const yy = y === y ? y : 0;
        if (c) { if (R) R[i] = yy; } else L[i] = yy;
      }
    }
    this.dn = -this.dn;
    for (let i = 0; i < 24; i++) if (!fin(mz[i])) mz[i] = 0;
    for (let i = 0; i < 4; i++) if (!fin(dc[i])) dc[i] = 0;
    for (let i = 0; i < 2; i++) if (!fin(tz[i])) tz[i] = 0;
  }
  render(L, R, len, t0) {
    const sr = this.sr, S = this.S, P = this.P, bL = this.bL, bR = this.bR;
    if (len > 4096) len = 4096;
    const kk = 1 - Math.exp(-len / (sr * 0.03));
    for (const k in S) { if (!fin(S[k])) S[k] = P[k]; S[k] += (P[k] - S[k]) * kk; }
    for (let b = 0; b < len; b += CTL) {
      const n = Math.min(CTL, len - b), tb = t0 + b / sr;
      while (this.q.length && this.q[0].t <= tb) { const m = this.q.shift(); if (m.type === 'on') this.noteOn(m); else this.noteOff(m); }
      if (b === 0 || n > 0) for (let i = 0; i < n; i++) { bL[b + i] = 0; bR[b + i] = 0; }
      for (const v of this.v) if (v.on) this.runVoice(v, b, n);
    }
    this.busOut(L, R, len);
    for (const v of this.v) {
      if (!v.on) continue;
      if (!(fin(v.ic1) && fin(v.ic2) && fin(v.bz1) && fin(v.bz2) && fin(v.dcy) && fin(v.p) && fin(v.dsm) && fin(v.fz1) && fin(v.fz2) && fin(v.lpz) && fin(v.lpz2) && fin(v.shz) && fin(v.pm) && fin(v.wPrev))) { v.reset(); }
    }
  }
}
class PkBrassStudio extends AudioWorkletProcessor {
  constructor() { super(); this.e = new BrassEngine(sampleRate); this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} }; }
  process(inputs, outputs) {
    const o = outputs[0]; if (!o || !o[0]) return true;
    try { this.e.render(o[0], o[1], o[0].length, currentTime); } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); }
    return true;
  }
}
registerProcessor('${WNAME}', PkBrassStudio);
`;
export default {
  id: 'nl.patchkamer.brassstudio', name: 'Brass Studio', version: '1.0.0', kind: 'instrument', category: 'synth',
  ui: { width: 460, minWidth: 300 },
  about: {
    nl: 'Koperblazers als fysisch model: trompet, bugel, trombone, basstrombone, hoorn en tuba. De lip is een massa-veersysteem dat een luchtstroom door een golfgeleider stuurt (de pijp), met een bel als reflectie- en stralingsfilter en een kopstukresonantie. Daardoor veranderen velocity en notelengte het spel: zacht klinkt rond, hard krijgt blat en bite (het brass-effect), kort is gestoten met een tongstoot en lang is gebonden. Noten die kort op elkaar volgen worden gebonden (legato).\n\nDe knoppen onder Speler en Instrument en kopstuk sturen de lip, de adem, de bel (grootte en conus) en het kopstuk. Sectie speelt elke noot met 1 tot 4 spelers met verstemming en een kleine timingspreiding, ook als trompetten met een trombone een octaaf lager. Demper kiest open, straight, cup, harmon, plunger of emmer; harmon en plunger hebben een wa-wa die met de hand (Wa-wa) of automatisch (Wa-wa snelheid) beweegt. Versiering kiest scoop, rip, fall, doit, shake of drop; de maat staat onder Versieringsmaat. Fall, doit en drop beginnen waar de noot eindigt, dus stuur noten met een lengte.\n\nHet apparaat speelt alleen noten die binnenkomen op de eventingang. Een noot met een lengte (dur) werkt met sequencers; noteon en noteoff geven aangehouden noten. Elk instrument heeft een eigen bereik; een noot daarbuiten wordt een of meer octaven verschoven, zoals een speler die zou doen.',
    en: 'Brass as a physical model: trumpet, flugelhorn, trombone, bass trombone, French horn and tuba. The lip is a mass-spring system that controls an airflow into a waveguide (the tube), with a bell as reflection and radiation filter and a mouthpiece resonance. So velocity and note length change the playing: soft sounds round, hard gets bite and brassy edge (the brass effect), short is tongued and detached, long is slurred. Notes that follow each other closely are slurred (legato).\n\nThe knobs under Player and Instrument and mouthpiece control the lip, the breath, the bell (size and taper) and the mouthpiece. Section plays every note with 1 to 4 players with detune and a small timing spread, also as trumpets with a trombone an octave lower. Mute selects open, straight, cup, harmon, plunger or bucket; harmon and plunger have a wah that moves by hand (Wah) or automatically (Wah rate). Ornament selects scoop, rip, fall, doit, shake or drop; the amount is under Ornament amount. Fall, doit and drop start where the note ends, so send notes with a length.\n\nThe device only plays notes arriving on the event input. A note with a length (dur) works with sequencers; noteon and noteoff give held notes. Each instrument has its own range; a note outside it is moved by one or more octaves, as a player would do.',
  },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo brass' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo koper', notes: 'Noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const defaults = {};
    for (const [k, d] of Object.entries(SPEC)) defaults[k] = d[4];
    for (const [k, d] of Object.entries(INTS)) defaults[k] = d[2];
    let state = { ...defaults }, mod = {}, dead = false, node = null, root = null, warn = null, status = null, nextId = 1;
    const ui = { knobs: {}, sels: {} }, held = new Map(), pending = [];
    const out = ctx.createGain(); out.gain.value = 1;
    const round6 = v => Number(v.toFixed(6));
    function apply() {
      if (dead) return;
      const p = {};
      for (const [k, d] of Object.entries(SPEC)) p[k] = clamp(state[k] + (mod[k] || 0) * (d[2] - d[1]), d[1], d[2]);
      for (const k of Object.keys(INTS)) p[k] = state[k];
      if (node) node.port.postMessage({ type: 'params', p });
      else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); }
    }
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 128) pending.push(m); };
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.connect(out); apply();
      pending.splice(0).forEach(m => { if (m.type === 'params') return; if (m.type === 'on' || m.type === 'off') { if (m.t > ctx.currentTime - 0.05) node.port.postMessage(m); } });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Brass Studio kan hier geen geluid maken.'); });

    // ---- noten ----
    function noteOn(note, vel, t, dur, hold) {
      const id = nextId++; if (nextId > 1e9) nextId = 1;
      const n = clamp(Math.round(note) + state.transpose, 0, 127);
      post({ type: 'on', id, note: n, vel, t, dur: Number.isFinite(dur) ? dur : -1 });
      if (hold) { const a = held.get(note) || []; a.push(id); held.set(note, a); }
    }
    function noteOff(note, t) {
      const a = held.get(note); if (!a || !a.length) return;
      const id = a.shift(); if (!a.length) held.delete(note);
      post({ type: 'off', id, note: clamp(Math.round(note) + state.transpose, 0, 127), t });
    }
    function panic() { held.clear(); pending.length = 0; apply(); if (node) node.port.postMessage({ type: 'stop' }); }

    // ---- UI ----
    const CSS = `
*{box-sizing:border-box}
.bst{display:grid;gap:8px;min-width:0;color:var(--fg);font:11px/1.4 var(--mono,ui-monospace,monospace)}
.k{display:grid;grid-template-columns:92px minmax(0,1fr) 40px;gap:6px;align-items:center;min-width:0}
.k label{font-size:9px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{font-size:10px;text-align:right;font-variant-numeric:tabular-nums}
.sec{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:5px 14px;padding:7px 8px;border:1px solid var(--line);border-radius:5px;min-width:0;align-content:start}
.sec h4{grid-column:1/-1;margin:0;font:600 10px/1.2 var(--disp,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.sec>.k:has(select){grid-template-columns:92px minmax(0,1fr)!important}
.acts{display:flex;flex-wrap:wrap;gap:6px}
button{font:500 11px/1 var(--disp,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;background:var(--card-2);color:var(--fg);border:1px solid var(--line);border-radius:3px;padding:6px 9px;cursor:pointer}
button:hover{border-color:var(--audio)}
button:focus-visible,input:focus-visible,select:focus-visible{outline:1px solid var(--audio);outline-offset:2px}
input[type=range]{appearance:none;-webkit-appearance:none;height:16px;background:transparent;margin:0;cursor:pointer;width:100%;min-width:0}
input[type=range]::-webkit-slider-runnable-track{height:3px;background:var(--line)}
input[type=range]::-moz-range-track{height:3px;background:var(--line)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:10px;height:14px;margin-top:-5.5px;border-radius:2px;background:var(--card-2);border:1px solid var(--audio)}
input[type=range]::-moz-range-thumb{width:9px;height:13px;border-radius:2px;background:var(--card-2);border:1px solid var(--audio)}
select{background:var(--field,var(--card-2));color:var(--field-fg,var(--fg));border:1px solid var(--line);font:11px var(--mono,monospace);padding:4px 6px;border-radius:3px;min-width:0}
.stat{font-size:10px;color:var(--muted);min-height:12px;margin:0}
.warn{font-size:10px;color:var(--muted);margin:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;
    const mk = (tag, cls, parent, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; if (parent) parent.appendChild(e); return e; };
    const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const fmtOf = (id, v) => {
      const d = SPEC[id], u = d[5];
      if (u === '%') return Math.round(v * 100) + '%';
      if (u === 'Hz') return v.toFixed(1) + ' Hz';
      if (u === 's') return v.toFixed(2) + ' s';
      if (u === 'ms') return Math.round(v) + ' ms';
      if (u === 'cent') return (v > 0 && id === 'tune' ? '+' : '') + v.toFixed(1) + ' ct';
      if (u === 'st') return (v > 0 ? '+' : '') + Math.round(v) + ' st';
      if (u === 'tone') return (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
      return String(v);
    };
    function change(id, value) {
      const d = SPEC[id]; if (!d || !Number.isFinite(+value)) return;
      state[id] = round6(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2])); apply();
    }
    function knob(parent, id, group) {
      const d = SPEC[id];
      ui.knobs[id] = host.ui.knob(parent, tx(d[0]), [d[1], d[2], d[3]], state[id], v => fmtOf(id, v), v => change(id, v), { default: d[4], id, role: 'param', group });
    }
    function select(parent, id, group) {
      const opts = OPTS[id].map((t, i) => [String(id === 'players' ? i + 1 : i), id === 'players' ? t : tx(t)]);
      const lab = id === 'players' ? 'Spelers' : id === 'inst' ? 'Instrument' : id === 'mute' ? 'Demper' : id === 'mix' ? 'Samenstelling' : id === 'legato' ? 'Legato' : 'Versiering';
      ui.sels[id] = host.ui.select(parent, tx(lab), opts, String(state[id]), v => {
        const n = Math.round(+v); if (Number.isFinite(n)) { state[id] = clamp(n, INTS[id][0], INTS[id][1]); apply(); }
      }, { id, group });
    }
    function paint() {
      for (const id in ui.knobs) ui.knobs[id].set(state[id]);
      for (const id in ui.sels) ui.sels[id].value = String(state[id]);
      if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : ''; }
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount();
        const wrap = document.createElement('div'); el.appendChild(wrap);
        root = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;
        const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
        const app = mk('div', 'bst', root);
        ui.knobs = {}; ui.sels = {};
        const sec = (title) => { const s = mk('div', 'sec', app); mk('h4', '', s, tx(title)); return s; };
        let s = sec('Instrument en kopstuk');
        select(s, 'inst', 'horn'); ['bell', 'bore', 'cup'].forEach(id => knob(s, id, 'horn'));
        s = sec('Speler'); ['tongue', 'blat', 'bright', 'breath', 'lip'].forEach(id => knob(s, id, 'player'));
        s = sec('Vibrato'); ['vibrato', 'vibRate', 'vibDelay'].forEach(id => knob(s, id, 'vibrato'));
        s = sec('Spel'); select(s, 'legato', 'play'); select(s, 'orn', 'play'); knob(s, 'ornAmt', 'play');
        s = sec('Demper'); select(s, 'mute', 'mute'); ['wah', 'wahRate', 'wahDepth'].forEach(id => knob(s, id, 'mute'));
        s = sec('Sectie'); select(s, 'players', 'section'); select(s, 'mix', 'section'); ['spread', 'human', 'width'].forEach(id => knob(s, id, 'section'));
        s = sec('Niveau'); ['transpose', 'tune', 'level'].forEach(id => knob(s, id, 'out'));
        const acts = mk('div', 'acts', app);
        const bt = (label, fn) => { const b = mk('button', '', acts, tx(label)); b.type = 'button'; b.onclick = fn; };
        bt('Proeftoon', () => { const I = INST[state.inst], t = ctx.currentTime + 0.02; noteOn(Math.round((I.lo + I.hi) / 2) - state.transpose, 0.8, t, 1.4, false); });
        bt('Proefakkoord', () => { const I = INST[state.inst], r = Math.round((I.lo + I.hi) / 2) - 5 - state.transpose, t = ctx.currentTime + 0.02; [0, 4, 7].forEach(o => noteOn(r + o, 0.75, t, 1.6, false)); });
        bt('Alles uit', () => panic());
        status = mk('p', 'stat', app, ''); warn = mk('p', 'warn', app, node ? '' : tx('AudioWorklet laden…'));
        paint();
      },
      unmount() {
        if (root && root.host) { const w = root.host; if (w.parentNode) w.parentNode.removeChild(w); } else if (root && root.parentNode) root.innerHTML = '';
        root = null; warn = null; status = null; ui.knobs = {}; ui.sels = {};
      },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'notes' || !ev) return;
          const time = Number.isFinite(ev.time) ? Math.min(ev.time, ctx.currentTime + 30) : ctx.currentTime, t = Math.max(ctx.currentTime, time);
          const type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(ev.note)) {
            const n = clamp(Math.round(ev.note), 0, 127);
            if (type === 'noteoff' || ev.vel === 0 || ev.off) noteOff(n, t);
            else {
              const vel = Number.isFinite(ev.vel) ? clamp(ev.vel, 0, 1) : 0.8;
              if (type === 'note' && Number.isFinite(ev.dur) && ev.dur > 0) noteOn(n, vel, t, clamp(ev.dur, 0.005, 3600), false);
              else noteOn(n, vel, t, undefined, true);
            }
          } else if (type === 'cc' && Number.isFinite(ev.value) && Object.hasOwn(SPEC, String(ev.id))) {
            const d = SPEC[ev.id]; if (ev.id !== 'transpose') { change(ev.id, d[1] + clamp(ev.value, 0, 1) * (d[2] - d[1])); paint(); }
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) { /* nooit de planner laten struikelen */ }
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() {
        const lanes = { horn: 'Instrument', player: 'Speler', vibrato: 'Vibrato', play: 'Spel', mute: 'Demper', section: 'Sectie', out: 'Niveau' };
        return Object.entries(SPEC).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: tx(d[0]), lane: d[10], laneName: tx(lanes[d[10]] || 'Speler'), min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] }));
      },
      modulate(offsets) {
        if (dead) return; const next = {};
        if (offsets && typeof offsets === 'object' && !Array.isArray(offsets)) for (const id of Object.keys(SPEC)) { if (MODEX.includes(id)) continue; const v = offsets[id]; if (typeof v === 'number' && Number.isFinite(v)) next[id] = clamp(v, -1, 1); }
        mod = next; apply(); paint();
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
        for (const [id, d] of Object.entries(SPEC)) if (typeof s[id] === 'number' && Number.isFinite(s[id])) next[id] = round6(clamp(Math.round(s[id] / d[3]) * d[3], d[1], d[2]));
        for (const [k, d] of Object.entries(INTS)) if (typeof s[k] === 'number' && Number.isFinite(s[k])) next[k] = Math.round(clamp(s[k], d[0], d[1]));
        state = next; apply(); paint();
      },
      destroy() {
        if (dead) return; dead = true;
        try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) { /* los */ }
        node = null; pending.length = 0; held.clear(); root = null;
      },
    };
    apply(); return self;
  },
};
