// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (acid-basssynth met sequencer) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.20.0 — Eerste uitgave van Squelch Box (contract v1.27). Een zo getrouw mogelijke acid-bassynth, geïnspireerd op klassieke acid-bassynths uit de jaren tachtig:
//   één oscillator, een driepolig (18 dB/oct) resonant diode-ladderfilter met een terugkoppeling die het laag wegneemt, een filter-envelope met accentcircuit
//   (accent-sweep), slide met vaste glijtijd en een ingebouwde 16-staps sequencer met noot, octaaf omhoog/omlaag, accent, slide en tie.
//   Eigen motor als AudioWorklet (SquelchEngine), intern op 2x of 4x oversampling met een lineaire-fase decimatiefilter; zaagtand en blok met polyBLEP.
//   - modelleert: zaagtand en vervormde blokgolf, 3-polig filter met 4-traps terugkoppeling, tanh-achtige verzadiging per trap, terugkoppelingshoogdoorlaat,
//     envelopes (snelle aanzet, exponentiële decay, vaste korte accent-decay), accent-sweep via een ladende condensator, slide als exponentiële glijding in toonhoogte
//     met legato (geen nieuwe aanzet), VCA met korte aanzet en lange staart, kleine drift in stemming
//   - benadert: de exacte kromming van de golfvormen, de tijdconstanten en de interactie tussen de filtertrappen (zie AGENTS.md)
//   - tweetalig (host.lang; poortnamen per taal in i18n); setState volgt §13 (afkappen, ongeldig = standaard, zachte overgangen in de motor)
//   - bewaker in de worklet: alleen eindige berichten, filter- en envelopetoestanden worden per sample op eindigheid gecontroleerd en teruggezet,
//     de uitgang wordt begrensd
/** Squelch Box — a faithful acid bass synth: one oscillator, a 3-pole (18 dB/oct) resonant diode-ladder low-pass, accent circuit with accent sweep, slide and a built-in 16-step sequencer.
 * Mono, audio out is the same signal on both channels. Notes can also arrive on the orange input: {type:'note',note,vel,time,dur}; vel > 0.85 or accent:true = accent,
 * slide:true / legato:true or an overlapping note = slide. Transport stop silences the voice. The purple mod input exposes the continuous controls.
 */
const EN = {
  'Stemming': 'Tuning', 'Resonantie': 'Resonance', 'Env mod': 'Env Mod', 'Golfvorm': 'Waveform', 'Zaagtand': 'Sawtooth', 'Blok': 'Square',
  'Slide-tijd': 'Slide time', 'Gate-lengte': 'Gate length', 'Transpositie': 'Transpose',
  'Klank': 'Sound', 'Extra\'s (standaard = origineel)': 'Extras (default = original)', 'Uitgang': 'Output',
  'Sequencer': 'Sequencer', 'Intern aan': 'Internal on', 'Patroon': 'Pattern', 'Lengte': 'Length', 'stappen': 'steps',
  'Willekeurig': 'Random', 'Muteer': 'Mutate', 'Leeg': 'Clear', 'Transponeer +': 'Transpose +', 'Transponeer −': 'Transpose −', 'Schuif ←': 'Shift ←', 'Schuif →': 'Shift →',
  'Bibliotheek…': 'Library…', 'zet dit patroon in het gekozen patroonvak': 'put this pattern in the selected pattern slot',
  'Omhoog': 'Up', 'Omlaag': 'Down', 'Accent': 'Accent', 'Slide': 'Slide', 'Tie': 'Tie',
  'Proeftoon': 'Test note', 'Proef-accent': 'Test accent', 'Alles uit': 'All off',
  'Cutoff-verloop': 'Cutoff trace',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Squelch Box kan hier geen geluid maken.': 'AudioWorklet not available: Squelch Box cannot make sound here.',
  'Slide op een stap glijdt naar de volgende stap en houdt de gate open (geen nieuwe aanzet van de envelopes). Tie houdt de gate van de vorige stap vast zonder nieuwe aanzet, op de toonhoogte van deze stap. Accent: harder, korte decay en een sweep die bij opeenvolgende accenten oploopt. Zet "Intern" uit om alleen noten van de oranje ingang te spelen (vel > 0,85 = accent, overlappende noten = slide). Tempo en swing komen van de klok van de host.':
    'Slide on a step glides into the next step and keeps the gate open (no new attack of the envelopes). Tie holds the gate of the previous step with no new attack, at the pitch of this step. Accent: louder, short decay and a sweep that builds up over consecutive accents. Switch "Internal" off to play only notes from the orange input (vel > 0.85 = accent, overlapping notes = slide). Tempo and swing come from the host clock.',
  'stap {0}': 'step {0}',
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan, groep]
const SPEC = {
  tune: ['Stemming', -100, 100, 1, 0, 'cent', 'lin', 'pitch', 0.004, false, 'osc'],
  cut: ['Cutoff', 100, 5000, 1, 420, 'Hz', 'log', 'filter', 0.10, true, 'filter'],
  res: ['Resonantie', 0, 1, 0.01, 0.62, '%', 'lin', 'res', 0.10, true, 'filter'],
  envmod: ['Env mod', 0, 1, 0.01, 0.6, '%', 'lin', 'env', 0.12, true, 'env'],
  decay: ['Decay', 0.2, 2, 0.01, 0.45, 's', 'log', 'decay', 0.10, true, 'env'],
  accent: ['Accent', 0, 1, 0.01, 0.65, '%', 'lin', 'accent', 0.12, false, 'env'],
  vol: ['Volume', 0, 1, 0.01, 0.7, '%', 'lin', 'level', 0.05, false, 'out'],
  slide: ['Slide-tijd', 0.02, 0.3, 0.005, 0.06, 's', 'log', 'glide', 0.08, false, 'extra'],
  gate: ['Gate-lengte', 0.2, 0.95, 0.01, 0.55, '%', 'lin', 'gate', 0.05, false, 'extra'],
  drive: ['Drive', 0, 1, 0.01, 0, '%', 'lin', 'drive', 0.10, false, 'extra'],
  trans: ['Transpositie', -12, 12, 1, 0, 'st', 'lin', 'pitch', 0.001, false, 'extra'],
  drift: ['Drift', 0, 1, 0.01, 0.4, '%', 'lin', 'motion', 0.05, false, 'extra'],
};
const MODEX = ['trans', 'gate'];   // trans en gate worden op de kaart toegepast (nootnummer, gatelengte), niet in de motor
const RANGES = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, [d[1], d[2], d[4]]]));
RANGES.wave = [0, 1, 0];
const WAVES = ['saw', 'square'];
const STEPS = 16, NPAT = 16, BASE = 36;   // BASE = MIDI-nootnummer van de onderste C (C2)
const NOTENAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B', 'C'];
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- patronen ----------
const emptyPat = () => ({ len: STEPS, n: new Array(STEPS).fill(-1), oc: new Array(STEPS).fill(0), acc: new Array(STEPS).fill(0), sl: new Array(STEPS).fill(0), tie: new Array(STEPS).fill(0) });
const copyPat = p => ({ len: p.len, n: p.n.slice(), oc: p.oc.slice(), acc: p.acc.slice(), sl: p.sl.slice(), tie: p.tie.slice() });
// 16 stappen: getal = noot (0 = C … 9 = A … 12 = C erboven), . = rust, ! = accent, ~ = slide naar de volgende stap, ^ = octaaf omhoog, v = octaaf omlaag, = = tie (houd de gate)
function parsePattern(str, len) {
  const t = str.trim().split(/\s+/), g = emptyPat(); g.len = len || STEPS;
  for (let i = 0; i < STEPS; i++) {
    const m = /^(\d+)([!~^v=]*)$/.exec(t[i] || '.'); if (!m) continue;
    g.n[i] = clampN(+m[1], 0, 12); g.acc[i] = m[2].includes('!') ? 1 : 0; g.sl[i] = m[2].includes('~') ? 1 : 0;
    g.oc[i] = m[2].includes('^') ? 1 : m[2].includes('v') ? -1 : 0; g.tie[i] = m[2].includes('=') ? 1 : 0;
  }
  return g;
}
function cleanPat(x) {   // contract §13: onbekend of ongeldig = leeg of standaard
  const p = emptyPat(); if (!x || typeof x !== 'object') return p;
  p.len = Number.isInteger(x.len) ? clampN(x.len, 1, STEPS) : STEPS;
  for (let i = 0; i < STEPS; i++) {
    const n = Array.isArray(x.n) ? x.n[i] : -1, o = Array.isArray(x.oc) ? x.oc[i] : 0;
    p.n[i] = Number.isInteger(n) ? clampN(n, -1, 12) : -1;
    p.oc[i] = Number.isInteger(o) ? clampN(o, -1, 1) : 0;
    p.acc[i] = Array.isArray(x.acc) && x.acc[i] ? 1 : 0; p.sl[i] = Array.isArray(x.sl) && x.sl[i] ? 1 : 0; p.tie[i] = Array.isArray(x.tie) && x.tie[i] ? 1 : 0;
  }
  return p;
}
const LIBRARY = [
  ['Rolling', '0! 0 12~ 0 0! . 12 0 0! 0 12~ 0 3 . 0 7'],
  ['Squelch', '0! . 0 12~ 0! . 3 0 0! . 7~ 0 0! 12~ 0 .'],
  ['Pump', '0! . 0 . 0! . 0 . 0! . 0 . 0! . 0 0'],
  ['Climb', '0! 0 . 3~ . 3 5~ . 7! 5 . 3~ . 2 3! .'],
  ['Stab', '0! . . 0 . . 0! . 3 . . 3! . 5~ 5 .'],
  ['Bounce', '0! 0^ 0 0^ 0! 0^ 0 0^ 0! 0^ 0 0^ 10! 10^ 7 7^'],
  ['Hypno', '0! 0 0 0 0= 0= 0= 0 0! 0 0 0 3~ 3 0= 0'],
  ['Chase', '0 12 0 12! 0 12 0 12! 10 3 10 3! 5 0 5 0!'],
  ['Walk', '0! . 10 . 7 . 5 . 7! . 10 . 0~ 12~ 0 .'],
  ['Drop', '0! . . 0 . . 0! . . 0 . 12~ 0! . 0 0~'],
  ['Wobble', '0! 0~ 0 0= 12! 12~ 0 0 10! 10~ 10 10= 7! 7~ 0 0'],
  ['Slide run', '5! 7~ 9~ 10~ 12! 10~ 9~ 7~ 5! 7~ 9~ 10~ 9! 7~ 5~ 4'],
  ['Offbeat', '. 0 . 0! . 0 . 0! . 0 . 0! . 0 . 12!'],
  ['Octave jump', '0! 0v 0^ 0v 0! . 0^ 0v 0! 0v 0^ 0v 10! . 10^ 7v'],
  ['Minor run', '0! 0 3 0~ 5! 3~ 0 . 0! 0 3 5~ 7! 5~ 3 .'],
  ['Closing', '0! . 0 . 0! . 0 . 0! 0~ 0 . 12! 10~ 7~ 5'],
];
const START = parsePattern('0! 0 12~ 0 0! . 12 0 0! 0 12~ 0 3 . 0 7');
const defaultPatterns = () => Array.from({ length: NPAT }, (_, i) => (i === 0 ? copyPat(START) : emptyPat()));
function randomPattern() {
  const pool = [0, 0, 0, 0, 3, 5, 7, 7, 10, 12, 12, 2], p = emptyPat(); let prev = 0;
  for (let i = 0; i < STEPS; i++) {
    const on = i % 4 === 0 ? 1 : (Math.random() < 0.62 ? 1 : 0);
    if (on) { const r = Math.random(); p.n[i] = r < 0.45 ? prev : (r < 0.9 ? pool[Math.floor(Math.random() * pool.length)] : clampN(prev + (Math.random() < 0.5 ? 1 : -1), 0, 12)); prev = p.n[i]; }
    p.oc[i] = p.n[i] >= 0 && Math.random() < 0.12 ? (Math.random() < 0.5 ? 1 : -1) : 0;
    p.acc[i] = p.n[i] >= 0 && ((i % 4 === 2 && Math.random() < 0.45) || (i % 4 === 3 && Math.random() < 0.3) || (i === 0 && Math.random() < 0.6)) ? 1 : 0;
    p.sl[i] = p.n[i] >= 0 && Math.random() < 0.22 ? 1 : 0;
    p.tie[i] = p.n[i] >= 0 && i > 0 && p.n[i - 1] >= 0 && Math.random() < 0.1 ? 1 : 0;
  }
  if (p.n[0] < 0) p.n[0] = 0;
  return p;
}

// ---------- de motor (AudioWorklet) ----------
const WNAME = 'nl-patchkamer-squelchbox-1-20-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const TWO_PI = Math.PI * 2, LN10 = Math.log(10);
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
// rationale benadering van tanh, begrensd op +-1 (verzadiging per trap)
const sat = x => (x >= 3 ? 1 : x <= -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x));
const KMAX = 5.0;          // terugkoppeling bij resonantie 1; de lus zelf is kritiek rond 4,6 (met de hoogdoorlaat), dus bij het maximum zelfoscillatie boven ca. 700 Hz
const FBHP = 150;          // terugkoppelingshoogdoorlaat in Hz: de resonantie neemt het laag weg
const ACCDEC = 0.2;        // vaste decay (tot 10%) van de envelope bij een accent, in seconden
const ACCOCT = 2.0;        // extra filteroctaven van de accent-sweep bij accent 1 en een volle accentcondensator
const ENVOCT = 4.0;        // filteroctaven van de envelope bij env mod 1
const OUTG = 1.7;          // vaste uitgangsversterking
const INGAIN = 1.2;        // niveau van de oscillator in het filter
// driepolig filter met vierpolige terugkoppeling: vier TPT-trappen met verzadiging, uitgang na trap 3 (18 dB/oct), zero-delay-feedback voor de lus
class Ladder {
  constructor(fs) { this.fs = fs; this.s = new Float64Array(4); this.sh = 0; const gh = Math.tan(Math.PI * FBHP / fs); this.Gh = gh / (1 + gh); this.fmax = Math.min(16000, fs * 0.3); this.resets = 0; }
  reset() { this.s.fill(0); this.sh = 0; }
  tick(x, fc, k) {
    const f = fc < 10 ? 10 : fc > this.fmax ? this.fmax : fc;
    const g = Math.tan(Math.PI * f / this.fs), G = g / (1 + g), o = 1 - G, G2 = G * G, G4 = G2 * G2, s = this.s;
    const hpc = 1 - this.Gh, kk = k * hpc;
    const S = o * (G2 * G * s[0] + G2 * s[1] + G * s[2] + s[3]);
    const u = sat((x - kk * (S - this.sh)) / (1 + kk * G4));
    const y1 = G * u + o * s[0], y2 = G * sat(y1) + o * s[1], y3 = G * sat(y2) + o * s[2], y4 = G * sat(y3) + o * s[3];
    s[0] = 2 * y1 - s[0]; s[1] = 2 * y2 - s[1]; s[2] = 2 * y3 - s[2]; s[3] = 2 * y4 - s[3];
    this.sh += 2 * ((y4 - this.sh) * this.Gh);
    if (!(y3 > -4 && y3 < 4 && this.sh > -4 && this.sh < 4)) { this.reset(); this.resets++; return 0; }
    return y3;
  }
}
// decimatie: lineaire-fase FIR (Kaiser), afsnijding op 0,46 van de uitgangssamplefrequentie
function bessel0(x) { let s = 1, t = 1; for (let k = 1; k < 40; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; }
function designFir(os) {
  const M = 16 * os - 1, n = 2 * M + 1, fcn = 0.46 / os, beta = 7, h = new Float64Array(n); let sum = 0;
  for (let i = 0; i < n; i++) {
    const m = i - M, x = Math.PI * 2 * fcn * m, sinc = m === 0 ? 1 : Math.sin(x) / x, r = m / M;
    h[i] = 2 * fcn * sinc * bessel0(beta * Math.sqrt(Math.max(0, 1 - r * r))) / bessel0(beta); sum += h[i];
  }
  for (let i = 0; i < n; i++) h[i] /= sum; return h;
}
function blep(t, dt) {   // polyBLEP-residu; t = fase 0..1, dt = fasestap
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}
class SquelchEngine {
  constructor(sr, os) {
    this.sr = sr; this.os = os; this.fs = sr * os; this.q = []; this.rs = 0x1badf00d | 0;
    this.P = {}; this.S = {};
    for (const k in RANGES) { this.P[k] = RANGES[k][2]; this.S[k] = RANGES[k][2]; }
    this.lad = new Ladder(this.fs); this.fir = designFir(os); this.fbuf = new Float64Array(256); this.fw = 0; this.fn = 0;
    this.ph = 0; this.pn = 36; this.pt = 36; this.glide = false; this.gate = false; this.accOn = false; this.ag = 1; this.agT = 1;
    this.em = 0; this.emAtt = false; this.emK = 1; this.ea = 0; this.eaAtt = false; this.eaAmt = 0; this.am = 0; this.amAtt = false; this.va = 0;
    this.lcb = Math.log2(420); this.kS = 0; this.dv = 0; this.dt = 0; this.dc = 0; this.dcx = 0; this.dcy = 0; this.vizMax = 0; this.vizFc = 0; this.drop = 0; this.lcbT = this.lcb; this.kT = 0;
    const fs = this.fs; this.kFast = 1 - Math.exp(-1 / (0.0007 * fs)); this.kGl = 1 - Math.exp(-1 / (0.02 * fs));
    this.kAtt = 1 - Math.exp(-1 / (0.0010 * fs)); this.kAmpAtt = 1 - Math.exp(-1 / (0.0012 * fs)); this.kAmpDec = Math.exp(-1 / (1.8 * fs)); this.kRel = Math.exp(-1 / (0.010 * fs));
    this.kVa = Math.exp(-1 / (0.6 * fs)); this.kS_ = 1 - Math.exp(-1 / (0.004 * fs)); this.kAg = 1 - Math.exp(-1 / (0.003 * fs)); this.kDc = 1 - 2 * Math.PI * 5 / fs;
    this.kAccDec = Math.exp(-LN10 / (ACCDEC * fs));
  }
  setParams(p) { if (!p || typeof p !== 'object') return; for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); } }
  insert(m) { if (this.q.length >= 512) return; let i = this.q.length; while (i > 0 && this.q[i - 1].t > m.t) i--; this.q.splice(i, 0, m); }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'stop') { this.q.length = 0; this.gate = false; this.accOn = false; this.agT = 1; return; }
    if (!(typeof m.t === 'number' && isFinite(m.t))) return;
    if (m.type === 'on') {
      if (!(typeof m.note === 'number' && isFinite(m.note))) return;
      this.insert({ type: 'on', t: m.t, note: clampN(m.note, 0, 127), acc: !!m.acc, legato: !!m.legato, glide: !!m.glide });
    } else if (m.type === 'off') this.insert({ type: 'off', t: m.t });
  }
  event(m) {
    if (m.type === 'off') { this.gate = false; return; }
    const A = this.P.accent;
    this.pt = m.note;
    if (m.legato && this.gate) {   // slide of tie: geen nieuwe aanzet van de envelopes, de gate blijft hoog
      this.glide = m.glide; this.accOn = m.acc;
      if (m.acc) this.va += (1 - this.va) * 0.35;
      return;
    }
    this.glide = false; this.pn = m.note; this.gate = true; this.accOn = m.acc;
    this.emAtt = true; this.amAtt = true;
    const dec = m.acc ? ACCDEC : clampN(this.P.decay, 0.05, 4); this.emK = Math.exp(-LN10 / (dec * this.fs));
    if (m.acc) { this.eaAtt = true; this.eaAmt = A * (0.5 + this.va); this.va += (1 - this.va) * 0.35; } else { this.eaAmt = 0; }
  }
  tickOS() {
    const P = this.P, S = this.S;
    this.pn += (this.pt - this.pn) * (this.glide ? this.kGl : this.kFast);
    // envelopes
    if (this.emAtt) { this.em += (1 - this.em) * this.kAtt; if (this.em > 0.97) this.emAtt = false; } else this.em *= this.emK;
    if (this.eaAtt) { this.ea += (1 - this.ea) * this.kAtt; if (this.ea > 0.97) this.eaAtt = false; } else this.ea *= this.kAccDec;
    if (this.amAtt) { this.am += (1 - this.am) * this.kAmpAtt; if (this.am > 0.97) this.amAtt = false; }
    else if (this.gate) this.am *= this.kAmpDec; else this.am *= this.kRel;
    this.va *= this.kVa;
    // oscillator
    const f = 440 * Math.pow(2, (this.pn - 69 + (S.tune + this.dc) / 100) / 12), dt = f / this.fs;
    let p = this.ph + dt; if (p >= 1) p -= 1; this.ph = p;
    let osc;
    if (S.wave < 0.5) osc = 1 - 2 * p + blep(p, dt);
    else {
      let pu = p < 0.5 ? 1 : -1; pu += blep(p, dt); pu -= blep(p >= 0.5 ? p - 0.5 : p + 0.5, dt);
      osc = (pu + 0.14 * (1 - 2 * p + blep(p, dt))) * 0.75;
    }
    // filter
    this.lcb += (this.lcbT - this.lcb) * this.kS_; this.kS += (this.kT - this.kS) * this.kS_;
    const oct = ENVOCT * S.envmod * this.em + ACCOCT * this.eaAmt * this.ea;
    const fc = Math.pow(2, this.lcb + oct);
    const y = this.lad.tick(osc * INGAIN, fc, this.kS);
    this.vizFc = fc;
    // VCA met accentniveau
    this.agT = this.accOn ? 1 + S.accent * 0.7 * (0.6 + 0.4 * this.va) : 1; this.ag += (this.agT - this.ag) * this.kAg;
    let v = y * this.am * this.ag * S.vol * OUTG;
    // uitgangstrap: DC-filter, optionele drive, zachte begrenzer
    const d = v - this.dcx + this.kDc * this.dcy; this.dcx = v; this.dcy = d; v = d;
    if (S.drive > 0.001) { const gd = 1 + S.drive * 7; v = sat(v * gd) / Math.sqrt(gd); }
    const a = v < 0 ? -v : v;
    if (a > 0.8) v = (v < 0 ? -1 : 1) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
    return v === v ? v : 0;
  }
  render(L, R, len, t0) {
    const sr = this.sr, os = this.os, P = this.P, S = this.S, fir = this.fir, fl = fir.length, buf = this.fbuf, mask = 255;
    if (len > 128) len = 128;
    const kk = 1 - Math.exp(-len / (sr * 0.02));
    for (const k in S) { if (!isFinite(S[k])) S[k] = P[k]; S[k] += (P[k] - S[k]) * kk; }
    // drift: trage willekeurige afwijking in cent
    if (this.drop-- <= 0) { this.drop = Math.round(sr * 0.6 / len); this.rs ^= this.rs << 13; this.rs ^= this.rs >>> 17; this.rs ^= this.rs << 5; this.dt = ((this.rs >>> 0) / 2147483648 - 1); }
    this.dv += (this.dt - this.dv) * (1 - Math.exp(-len / (sr * 1.2))); this.dc = this.dv * S.drift * 4;
    this.kGl = 1 - Math.exp(-1 / (clampN(S.slide, 0.01, 1) / 3 * this.fs));   // slide-tijd = tijd tot 95% van het interval
    this.lcbT = Math.log2(clampN(S.cut, 20, 12000)); this.kT = KMAX * clampN(S.res, 0, 1);
    for (let j = 0; j < len; j++) {
      const tb = t0 + j / sr;
      while (this.q.length && this.q[0].t <= tb + 0.5 / sr) this.event(this.q.shift());
      let out = 0;
      for (let m = 0; m < os; m++) {
        let y = this.tickOS(); if (!(y > -2 && y < 2)) y = 0;
        buf[this.fw] = y; this.fw = (this.fw + 1) & mask;
      }
      let acc = 0, idx = (this.fw - 1) & mask;
      for (let i = 0; i < fl; i++) { acc += fir[i] * buf[idx]; idx = (idx - 1) & mask; }
      out = acc === acc ? acc : 0; if (out > 1) out = 1; else if (out < -1) out = -1;
      L[j] = out; if (R) R[j] = out;
      const a = out < 0 ? -out : out; if (a > this.vizMax) this.vizMax = a;
    }
    // bewaker: niet-eindige toestanden terugzetten
    const st = this.lad.s;
    for (let i = 0; i < 4; i++) if (!(st[i] > -4 && st[i] < 4)) this.lad.reset();
    for (const k of ['em', 'ea', 'am', 'va', 'ag', 'pn', 'lcb', 'kS', 'dcx', 'dcy', 'ph']) if (!isFinite(this[k])) { this[k] = (k === 'ag') ? 1 : (k === 'pn') ? this.pt : (k === 'lcb') ? Math.log2(420) : 0; }
    if (!(this.dcx > -50 && this.dcx < 50 && this.dcy > -50 && this.dcy < 50)) { this.dcx = 0; this.dcy = 0; }
  }
}
class PkSquelch extends AudioWorkletProcessor {
  constructor(o) {
    super(); const os = o && o.processorOptions && o.processorOptions.os === 4 ? 4 : 2;
    this.e = new SquelchEngine(sampleRate, os); this.vn = 0;
    this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} };
  }
  process(inputs, outputs) {
    const o = outputs[0]; if (!o || !o[0]) return true;
    try {
      this.e.render(o[0], o[1], o[0].length, currentTime);
      this.vn += o[0].length;
      if (this.vn >= 2048) { this.vn = 0; this.port.postMessage({ type: 'viz', fc: this.e.vizFc, lvl: this.e.vizMax }); this.e.vizMax = 0; }
    } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); }
    return true;
  }
}
registerProcessor('${WNAME}', PkSquelch);
`;

// ---------- het apparaat ----------
export default {
  id: 'nl.patchkamer.squelchbox', name: 'Squelch Box', version: '1.21.0', kind: 'instrument', category: 'synth',
  ui: { width: 900, minWidth: 360 },
  about: { nl: 'Acid-basssynth met ingebouwde sequencer.', en: 'An acid bass synth with a built-in sequencer.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = clampN;
    const spec = {}; for (const [id, d] of Object.entries(SPEC)) spec[id] = [tx(d[0]), ...d.slice(1)];
    const defaults = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, d[4]])); defaults.wave = 'saw'; defaults.seqOn = true; defaults.pat = 0;
    let state = { ...defaults }, patterns = defaultPatterns(), effective = { ...defaults }, mod = {}, dead = false, root = null, controls = {}, waveSel = null, patSel = null, lenSel = null, seqChk = null;
    let lineColor = '#66ddaa', rows = [], patBtns = [], status = null, warn = null, node = null, canvas = null, stopFrame = null, trace = [], schedule = [], lastCur = -2, extGateEnd = 0, viz = { fc: 400, lvl: 0 };
    const pending = [], out = ctx.createGain(); out.gain.value = 1;
    const os = host.audio && host.audio.oversample === '4x' ? 4 : 2;
    const resolve = () => { const r = { ...state }; for (const [id, d] of Object.entries(spec)) { const o = mod[id] || 0; r[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** o : state[id] + o * (d[2] - d[1]), d[1], d[2]); } return r; };
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 64) pending.push(m); };
    function apply() {
      if (dead) return; effective = resolve(); const p = {}; for (const k of Object.keys(SPEC)) p[k] = effective[k]; p.wave = state.wave === 'square' ? 1 : 0;
      if (node) node.port.postMessage({ type: 'params', p }); else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); }
    }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { os } });
      node.port.onmessage = e => { const d = e && e.data; if (d && d.type === 'viz' && Number.isFinite(d.fc) && Number.isFinite(d.lvl)) viz = { fc: d.fc, lvl: d.lvl }; };
      node.connect(out); apply(); pending.splice(0).forEach(m => { if (m.type !== 'params' && !(m.t > ctx.currentTime - 0.05)) return; if (m.type !== 'params') node.port.postMessage(m); });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Squelch Box kan hier geen geluid maken.'); });
    const pat = () => patterns[state.pat];
    // een stap: gate vasthouden na stap i? (slide of tie naar een noot op de volgende stap)
    function holds(p, i) { const j = (i + 1) % p.len; return p.n[i] >= 0 && p.n[j] >= 0 && j !== i && (p.sl[i] || p.tie[j]) ? true : false; }
    function midiOf(p, i) { return BASE + p.n[i] + 12 * p.oc[i] + effective.trans; }
    function onStep({ step, bar, time, stepDur }) {
      try {
        if (dead || !state.seqOn || !(time >= 0) || !(stepDur > 0)) return;
        const p = pat(), n = (Math.max(0, bar | 0) * STEPS + step) | 0, i = n % p.len, prev = (i + p.len - 1) % p.len;
        schedule.push({ t: time, i }); if (schedule.length > 64) schedule.shift();
        if (p.n[i] < 0) return;
        const legato = holds(p, prev) && prev !== i, glide = legato && !!p.sl[prev];
        post({ type: 'on', t: time, note: clamp(midiOf(p, i), 0, 127), acc: !!p.acc[i], legato, glide });
        if (!holds(p, i)) post({ type: 'off', t: time + stepDur * clamp(effective.gate, 0.2, 0.95) });
      } catch (e) {}
    }
    function playNote(note, acc, t, dur, legato, glide) { post({ type: 'on', t, note: clamp(note, 0, 127), acc, legato, glide }); post({ type: 'off', t: t + dur }); }
    function panic() { pending.length = 0; schedule.length = 0; apply(); if (node) node.port.postMessage({ type: 'stop' }); }
    // ----- UI -----
    const fmt = (d, v) => d[5] === '%' ? Math.round(v * 100) + '%' : d[5] === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : d[5] === 'Hz' ? Math.round(v) + ' Hz' : d[5] === 'cent' ? (v > 0 ? '+' : '') + Math.round(v) + ' ct' : (v > 0 ? '+' : '') + Math.round(v) + ' st';
    function paintSteps() {
      const p = pat();
      for (let r = 0; r <= 12; r++) for (let s = 0; s < STEPS; s++) rows[r].arr[s] = p.n[s] === r ? 1 : 0;
      for (let s = 0; s < STEPS; s++) { rows[13].arr[s] = p.oc[s] > 0 ? 1 : 0; rows[14].arr[s] = p.oc[s] < 0 ? 1 : 0; rows[15].arr[s] = p.acc[s]; rows[16].arr[s] = p.sl[s]; rows[17].arr[s] = p.tie[s]; }
      rows.forEach(r => { r.ui.paint(); r.ui.btns.forEach((b, s) => { b.style.opacity = s < p.len ? '' : '0.3'; }); });
    }
    function paint() {
      for (const k in controls) controls[k].set(state[k]);
      if (waveSel) waveSel.value = state.wave; if (seqChk) seqChk.checked = !!state.seqOn; if (lenSel) lenSel.value = String(pat().len);
      patBtns.forEach((b, i) => { b.classList.toggle('sel', i === state.pat); b.setAttribute('aria-pressed', i === state.pat ? 'true' : 'false'); });
      if (rows.length) paintSteps();
      if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : tx('Mod gereed · verbind een paarse sturingskabel'); }
    }
    function change(id, value) { const d = spec[id]; if (!d || !Number.isFinite(+value)) return; state[id] = Number(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2]).toFixed(6)); apply(); }
    function draw() {
      if (!canvas || dead) return;
      const now = ctx.currentTime; let cur = -1;
      while (schedule.length > 1 && schedule[1].t <= now) schedule.shift();
      if (schedule.length && schedule[0].t <= now && now - schedule[0].t < 1) cur = schedule[0].i;
      if (cur !== lastCur) { lastCur = cur; rows.forEach(r => r.ui.cursor(cur)); }
      trace.push(Math.log2(clamp(viz.fc, 40, 12000)) ); if (trace.length > 160) trace.shift();
      const g = canvas.getContext && canvas.getContext('2d'); if (!g) return;
      const w = canvas.width, h = canvas.height; g.clearRect(0, 0, w, h);
      g.strokeStyle = lineColor; g.lineWidth = 1.5; g.beginPath();
      const lo = Math.log2(40), hi = Math.log2(12000);
      trace.forEach((v, i) => { const x = i / 159 * w, y = h - (v - lo) / (hi - lo) * h; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount(); root = el;
        const css = document.createElement('style');
        css.textContent = '.sq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px 18px;margin-top:4px}.sq-grid .k{grid-template-columns:96px minmax(80px,1fr) 62px;gap:8px;min-height:30px}.sq-h{font-size:12px;opacity:.8;border-top:1px solid var(--line);padding-top:8px;margin-top:9px}.sq-act{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}.sq-pats{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px}.sq-pats button{min-width:28px;padding:2px 6px}.sq-pats button.sel{border-color:var(--sel,var(--fg));color:var(--fg)}.sq-cv{width:100%;max-width:320px;height:46px;background:var(--well,#0b0d10);border:1px solid var(--line)}.sq-seq .rowlab span{width:56px}.sq-oct{display:flex;gap:8px;align-items:center;flex-wrap:wrap}';
        el.appendChild(css);
        const mk = (label, ids, grp, parent) => {
          const h = document.createElement('div'); h.className = 'sq-h'; h.textContent = label; parent.appendChild(h);
          const grid = document.createElement('div'); grid.className = 'sq-grid'; parent.appendChild(grid);
          for (const id of ids) { const d = spec[id], before = grid.children.length; controls[id] = host.ui.knob(grid, d[0], [d[1], d[2], d[3]], state[id], v => fmt(d, v), v => change(id, v), { default: defaults[id], id, group: grp, scale: d[6] === 'log' ? 'log' : undefined }); const row = grid.children[before]; if (row) row.title = d[0]; }
          return grid;
        };
        const sound = mk(tx('Klank'), ['tune', 'cut', 'res', 'envmod', 'decay', 'accent'], 'sound', el);
        waveSel = host.ui.select(sound, tx('Golfvorm'), [['saw', tx('Zaagtand')], ['square', tx('Blok')]], state.wave, v => { if (WAVES.includes(v)) { state.wave = v; apply(); } }, { id: 'wave', group: 'osc' });
        mk(tx('Uitgang'), ['vol'], 'out', el);
        const ex = mk(tx('Extra\'s (standaard = origineel)'), ['slide', 'gate', 'drive', 'trans', 'drift'], 'extra', el);
        const cvw = document.createElement('div'); cvw.style.cssText = 'margin-top:8px;font-size:11px;opacity:.8'; cvw.textContent = tx('Cutoff-verloop'); el.appendChild(cvw);
        canvas = document.createElement('canvas'); canvas.className = 'sq-cv'; canvas.width = 320; canvas.height = 46; el.appendChild(canvas);
        // sequencer
        const sq = document.createElement('div'); sq.className = 'sq-seq'; el.appendChild(sq);
        const sh = document.createElement('div'); sh.className = 'sq-h'; sh.textContent = tx('Sequencer'); sq.appendChild(sh);
        const top = document.createElement('div'); top.className = 'sq-act'; sq.appendChild(top);
        const cl = document.createElement('label'); cl.style.cssText = 'display:flex;gap:4px;align-items:center;font-size:11px'; seqChk = document.createElement('input'); seqChk.type = 'checkbox'; seqChk.checked = !!state.seqOn;
        seqChk.onchange = () => { state.seqOn = seqChk.checked; if (!state.seqOn) panic(); }; cl.append(seqChk, document.createTextNode(tx('Intern aan'))); top.appendChild(cl);
        host.ui.adopt(seqChk, { id: 'seqOn', role: 'toggle', group: 'seq', label: tx('Intern aan') });
        lenSel = host.ui.select(top, tx('Lengte'), Array.from({ length: STEPS }, (_, i) => [String(i + 1), (i + 1) + ' ' + tx('stappen')]), String(pat().len), v => { const n = Number(v); if (Number.isInteger(n)) { pat().len = clamp(n, 1, STEPS); paintSteps(); } }, { id: 'len', group: 'seq' });
        const pb = document.createElement('div'); pb.className = 'sq-pats'; sq.appendChild(pb); patBtns = [];
        for (let i = 0; i < NPAT; i++) { const b = document.createElement('button'); b.type = 'button'; b.textContent = String(i + 1); b.title = tx('Patroon') + ' ' + (i + 1); b.setAttribute('aria-label', tx('Patroon') + ' ' + (i + 1)); b.onclick = () => { state.pat = i; paint(); }; pb.appendChild(b); patBtns.push(b); }
        rows = [];
        const addRow = (label, getter, setter, id, role) => {
          const arr = new Array(STEPS).fill(0), ui = host.ui.steps(sq, label, arr, (s, v) => { setter(s, v); paintSteps(); }, { id, group: 'seq', role });
          rows.push({ arr, ui });
        };
        for (let r = 12; r >= 0; r--) {
          addRow(NOTENAMES[r], null, (s, v) => { const p = pat(); p.n[s] = v ? r : -1; if (p.n[s] < 0) { p.tie[s] = 0; } }, 'n' + r);
        }
        rows.reverse();   // de rijen staan in de DOM van hoog naar laag; in de array wordt de index gelijk aan het nootnummer
        addRow(tx('Omhoog'), null, (s, v) => { const p = pat(); p.oc[s] = v ? 1 : 0; }, 'up');
        addRow(tx('Omlaag'), null, (s, v) => { const p = pat(); p.oc[s] = v ? -1 : 0; }, 'down');
        addRow(tx('Accent'), null, (s, v) => { pat().acc[s] = v ? 1 : 0; }, 'acc');
        addRow(tx('Slide'), null, (s, v) => { pat().sl[s] = v ? 1 : 0; }, 'sl');
        addRow(tx('Tie'), null, (s, v) => { pat().tie[s] = v ? 1 : 0; }, 'tie');
        const act = document.createElement('div'); act.className = 'sq-act'; sq.appendChild(act);
        const ps = document.createElement('select'); ps.title = tx('zet dit patroon in het gekozen patroonvak'); ps.setAttribute('aria-label', tx('Bibliotheek…'));
        const ph = document.createElement('option'); ph.value = ''; ph.textContent = tx('Bibliotheek…'); ps.appendChild(ph);
        LIBRARY.forEach(([n], i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = String(i + 1).padStart(2, '0') + ' · ' + n; ps.appendChild(o); });
        ps.onchange = () => { const i = Number(ps.value); if (LIBRARY[i]) { patterns[state.pat] = parsePattern(LIBRARY[i][1]); paint(); } ps.value = ''; }; act.appendChild(ps);
        const button = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); act.appendChild(b); return b; };
        button(tx('Willekeurig'), () => { patterns[state.pat] = randomPattern(); paint(); });
        button(tx('Muteer'), () => { const p = pat(); for (let k = 0; k < 3; k++) { const i = Math.floor(Math.random() * p.len), r = Math.random(); if (r < 0.5) p.n[i] = Math.random() < 0.2 ? -1 : [0, 0, 3, 5, 7, 10, 12][Math.floor(Math.random() * 7)]; else if (r < 0.75) p.acc[i] = p.n[i] >= 0 ? 1 - p.acc[i] : 0; else p.sl[i] = p.n[i] >= 0 ? 1 - p.sl[i] : 0; } paint(); });
        button(tx('Transponeer +'), () => { const p = pat(); p.n = p.n.map(x => (x < 0 ? x : (x + 1) % 13)); paint(); });
        button(tx('Transponeer −'), () => { const p = pat(); p.n = p.n.map(x => (x < 0 ? x : (x + 12) % 13)); paint(); });
        const rot = d => { const p = pat(), L = p.len; for (const k of ['n', 'oc', 'acc', 'sl', 'tie']) { const a = p[k].slice(0, L); const b = a.map((_, i) => a[(i - d + L) % L]); for (let i = 0; i < L; i++) p[k][i] = b[i]; } paint(); };
        button(tx('Schuif ←'), () => rot(-1)); button(tx('Schuif →'), () => rot(1));
        button(tx('Leeg'), () => { patterns[state.pat] = emptyPat(); paint(); });
        const act2 = document.createElement('div'); act2.className = 'sq-act'; sq.appendChild(act2);
        const b2 = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); act2.appendChild(b); return b; };
        b2(tx('Proeftoon'), () => playNote(BASE + 12 + effective.trans, false, ctx.currentTime + 0.01, 0.5, false, false));
        b2(tx('Proef-accent'), () => playNote(BASE + 12 + effective.trans, true, ctx.currentTime + 0.01, 0.5, false, false));
        b2(tx('Alles uit'), () => panic());
        status = document.createElement('p'); status.style.cssText = 'font-size:12px;color:var(--mod);line-height:1.5'; el.appendChild(status);
        warn = document.createElement('p'); warn.className = 'note'; warn.textContent = node ? '' : tx('AudioWorklet laden…'); el.appendChild(warn);
        const tip = document.createElement('p'); tip.className = 'note'; tip.textContent = tx('Slide op een stap glijdt naar de volgende stap en houdt de gate open (geen nieuwe aanzet van de envelopes). Tie houdt de gate van de vorige stap vast zonder nieuwe aanzet, op de toonhoogte van deze stap. Accent: harder, korte decay en een sweep die bij opeenvolgende accenten oploopt. Zet "Intern" uit om alleen noten van de oranje ingang te spelen (vel > 0,85 = accent, overlappende noten = slide). Tempo en swing komen van de klok van de host.'); el.appendChild(tip);
        try { const c = getComputedStyle(canvas).getPropertyValue('--audio'); if (c && c.trim()) lineColor = c.trim(); } catch (e) {}
        if (typeof host.frame === 'function') stopFrame = host.frame(self, draw, 30);
        paint();
      },
      unmount() { if (stopFrame) { try { stopFrame(); } catch (e) {} stopFrame = null; } if (root) root.innerHTML = ''; root = null; controls = {}; waveSel = null; patSel = null; lenSel = null; seqChk = null; rows = []; patBtns = []; status = null; warn = null; canvas = null; },
      onStep,
      onEvent(port, event) {
        try {
          if (dead || port !== 'notes' || !event) return;
          const time = Number.isFinite(event.time) ? event.time : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(event.type).toLowerCase().replace(/[_-]/g, '');
          if (type === 'note' && Number.isFinite(event.note)) {
            const dur = Number.isFinite(event.dur) ? clamp(event.dur, 0.005, 120) : 0.12;
            const acc = event.accent === true || (Number.isFinite(event.vel) && event.vel > 0.85);
            const legato = event.slide === true || event.legato === true || extGateEnd > t + 0.001;
            playNote(clamp(event.note + effective.trans, 0, 127), acc, t, dur, legato, legato); extGateEnd = t + dur;
          } else if (type === 'cc' && Number.isFinite(event.value)) {
            const map = { cutoff: 'cut', cut: 'cut', res: 'res', resonance: 'res', env: 'envmod', envmod: 'envmod', decay: 'decay', accent: 'accent', level: 'vol', volume: 'vol' }, id = map[event.id];
            if (id) { const d = spec[id], v = clamp(event.value, 0, 1); change(id, d[6] === 'log' ? d[1] * (d[2] / d[1]) ** v : d[1] + v * (d[2] - d[1])); paint(); }
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) {}
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(spec).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: d[0], lane: 'bass', laneName: tx('Klank'), min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
      modulate(offsets) {
        if (dead) return; const next = {};
        if (offsets && typeof offsets === 'object' && !Array.isArray(offsets)) for (const id of Object.keys(spec)) { if (MODEX.includes(id)) continue; const v = offsets[id]; if (typeof v === 'number' && Number.isFinite(v)) next[id] = clamp(v, -1, 1); }
        mod = next; apply();
        if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : tx('Mod gereed · verbind een paarse sturingskabel'); }
      },
      getState() { return { ...state, patterns: patterns.map(copyPat) }; },
      setState(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
        for (const [id, d] of Object.entries(spec)) if (typeof s[id] === 'number' && Number.isFinite(s[id])) next[id] = Number(clamp(Math.round(s[id] / d[3]) * d[3], d[1], d[2]).toFixed(6));
        if (typeof s.wave === 'string' && WAVES.includes(s.wave)) next.wave = s.wave;
        if (typeof s.seqOn === 'boolean') next.seqOn = s.seqOn;
        if (Number.isInteger(s.pat)) next.pat = clamp(s.pat, 0, NPAT - 1);
        state = next;
        patterns = Array.isArray(s.patterns) ? Array.from({ length: NPAT }, (_, i) => cleanPat(s.patterns[i])) : defaultPatterns();
        apply(); paint();
      },
      destroy() {
        if (dead) return; dead = true;
        if (stopFrame) { try { stopFrame(); } catch (e) {} stopFrame = null; }
        try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) {}
        node = null; pending.length = 0; self.unmount();
      }
    };
    apply(); return self;
  }
};
