// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.23.0 — De UI staat in een open shadow root (met de basisstijlen van de host), zodat een skin er CSS in kan zetten; skin Compact erbij. Geluid, state en ids ongewijzigd.
// 1.22.0 — Uitleg naar about (menu Over Woodwinds); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (fluit, riet en saxofoon) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.20.0 — Eerste uitgave van Woodwinds (contract v1.20). Eigen motor als AudioWorklet (WoodwindEngine): 16 stemmen, 1 tot 3 spelers per noot.
//   - bron-filtermodel: elke stem is een harmonische reeks (Chebyshev-recursie, de toonhoogte ligt exact vast) waarvan de sterkte per deeltoon uit een
//     spectraal model komt: helling die met de blaasdruk meegaat, even/oneven-verhouding (cilinder of kegel), formanten van de kast, lowpass, overblazen
//     (octaaf of twaalfde), beet (extra hoge deeltonen en verzadiging) en grom (amplitude- en toonmodulatie met een lage snelheid)
//   - luchtruis door een kam die op de toonhoogte is afgestemd (de buis laat de ruis meeklinken), met een tik bij de aanzet (tongstoot of lipaanzet)
//   - typen: dwarsfluit, klarinet, hobo, fagot, altsaxofoon, tenorsaxofoon, blokfluit en panfluit
//   - vibrato dat na een vertraging inzet (toon en blaasdruk), menselijke drift, legato met toonhoogteglijding bij overlappende noten, buiging via cc
//   - tweetalig (host.lang; poortnamen per taal in i18n); setState volgt §13 (afkappen, ongeldig = standaard, zachte overgang in de motor)
//   - bewaker in de worklet: alleen eindige berichten, stemmen en bus worden per blok op eindigheid gecontroleerd en teruggezet
/** Woodwinds — a woodwind family (flute, clarinet, oboe, bassoon, alto and tenor saxophone, recorder, pan flute). Stereo; 16 voices, 1 to 3 players per note.
 * Notes arrive on the orange input: {type:'note',note,vel,time,dur}; noteon/noteoff and note-without-dur hold keys. Notes that overlap on a melodic line become legato.
 * Bend: {type:'cc', id:'bend'|'pitchbend', value 0..1 (0.5 = centre)}. No internal sequencer. Transport stop and panic release everything.
 * The purple mod input exposes the continuous controls.
 */
const EN = {
  'Blaasdruk': 'Breath pressure', 'Overblazen': 'Overblow', 'Helderheid': 'Brightness', 'Formant': 'Formant', 'Riet & straal': 'Reed & jet', 'Beet': 'Bite', 'Grom': 'Growl',
  'Adem': 'Breath', 'Aanzet-tik': 'Tongue chiff', 'Opkomst': 'Attack', 'Uitklank': 'Release', 'Aanslaggevoeligheid': 'Touch response',
  'Vibratosnelheid': 'Vibrato rate', 'Vibratovertraging': 'Vibrato delay', 'Legato-glijtijd': 'Legato glide', 'Menselijkheid': 'Human drift',
  'Spelers': 'Players', 'Verstemming': 'Section detune', 'Stereobreedte': 'Stereo width', 'Stemming': 'Tuning', 'Transpositie': 'Transpose', 'Expressie': 'Expression', 'Uitgang': 'Output',
  'Dwarsfluit': 'Flute', 'Klarinet': 'Clarinet', 'Hobo': 'Oboe', 'Fagot': 'Bassoon', 'Altsaxofoon': 'Alto saxophone', 'Tenorsaxofoon': 'Tenor saxophone', 'Blokfluit': 'Recorder', 'Panfluit': 'Pan flute',
  'Aan': 'On', 'Uit': 'Off',
  'Type': 'Type', 'Klank': 'Sound', 'Legato': 'Legato', 'Toon & formant': 'Tone & formant', 'Adem & aanzet': 'Breath & attack', 'Vibrato & legato': 'Vibrato & legato', 'Sectie & niveau': 'Section & level',
  'Eigen klank': 'Custom sound', 'Proeftoon': 'Test note', 'Proefakkoord': 'Test chord', 'Alles uit': 'All off',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Woodwinds kan hier geen geluid maken.': 'AudioWorklet not available: Woodwinds cannot make sound here.',
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan]
const SPEC = {
  tone: ['Helderheid', 0, 1, 0.01, 0.5, '%', 'lin', 'filter', 0.025, true],
  body: ['Formant', 0, 1, 0.01, 0.8, '%', 'lin', 'color', 0.02, true],
  reed: ['Riet & straal', 0, 1, 0.01, 0.5, '%', 'lin', 'texture', 0.02, false],
  bite: ['Beet', 0, 1, 0.01, 0, '%', 'lin', 'color', 0.02, true],
  growl: ['Grom', 0, 1, 0.01, 0, '%', 'lin', 'motion', 0.02, true],
  overblow: ['Overblazen', 0, 1, 0.01, 0, '%', 'lin', 'color', 0.02, true],
  pressure: ['Blaasdruk', 0, 1, 0.01, 0.6, '%', 'lin', 'level', 0.025, true],
  breath: ['Adem', 0, 1, 0.01, 0.3, '%', 'lin', 'texture', 0.02, true],
  chiff: ['Aanzet-tik', 0, 1, 0.01, 0.4, '%', 'lin', 'texture', 0.02, false],
  attack: ['Opkomst', 0.005, 1, 0.005, 0.06, 's', 'log', 'env', 0.02, false],
  release: ['Uitklank', 0.02, 2, 0.01, 0.15, 's', 'log', 'decay', 0.02, false],
  velocity: ['Aanslaggevoeligheid', 0, 1, 0.01, 0.7, '%', 'lin', 'level', 0.015, false],
  vibrato: ['Vibrato', 0, 1, 0.01, 0.3, '%', 'lin', 'pitch', 0.015, true],
  vibRate: ['Vibratosnelheid', 3, 8, 0.1, 5.2, 'Hz', 'log', 'motion', 0.01, false],
  vibDelay: ['Vibratovertraging', 0, 2, 0.05, 0.5, 's', 'lin', 'motion', 0.01, false],
  glide: ['Legato-glijtijd', 5, 400, 1, 60, 'ms', 'log', 'time', 0.01, false],
  drift: ['Menselijkheid', 0, 1, 0.01, 0.25, '%', 'lin', 'motion', 0.02, false],
  players: ['Spelers', 1, 3, 1, 1, '', 'lin', 'detune', 0.001, false],
  spread: ['Verstemming', 0, 30, 0.5, 8, 'cent', 'lin', 'detune', 0.015, false],
  width: ['Stereobreedte', 0, 1, 0.01, 0.4, '%', 'lin', 'pan', 0.02, true],
  tune: ['Stemming', -100, 100, 1, 0, 'cent', 'lin', 'pitch', 0.005, false],
  transpose: ['Transpositie', -24, 24, 1, 0, 'st', 'lin', 'pitch', 0.001, false],
  expression: ['Expressie', 0, 1, 0.01, 0.9, '%', 'lin', 'level', 0.025, true],
  level: ['Uitgang', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false]
};
// transpose zit niet in de motor (de kaart verschuift het nootnummer); het aantal spelers is een gehele keuze
const CARDONLY = ['transpose'];
const MODEX = ['players', 'transpose'];
const TYPE_IDS = ['flute', 'clarinet', 'oboe', 'bassoon', 'altosax', 'tenorsax', 'recorder', 'panflute'];
const TYPE_LABEL = { flute: 'Dwarsfluit', clarinet: 'Klarinet', oboe: 'Hobo', bassoon: 'Fagot', altosax: 'Altsaxofoon', tenorsax: 'Tenorsaxofoon', recorder: 'Blokfluit', panflute: 'Panfluit' };
const RANGES = {};
for (const [k, d] of Object.entries(SPEC)) if (!CARDONLY.includes(k)) RANGES[k] = [d[1], d[2], d[4]];
RANGES.type = [0, 7, 0];
RANGES.legato = [0, 1, 1];
// per type: sl = helling van de deeltonen (h^-sl) bij middelste druk, sp = hoeveel de helling met de druk meegaat, rw = invloed van Riet & straal op de helling,
// par = sterkte van de even deeltonen (klarinet en panfluit: kleine waarde = oneven), pw = invloed van Riet & straal op par, fc = lowpass in Hz bij Helderheid 0,5,
// fm = formanten [frequentie Hz, breedte Hz, versterking], nz = luchtruis, nb = bovengrens van de ruis in Hz, cb = hoeveelheid toonhoogte in de ruis (kam),
// tn = duur van de aanzettik in s, dip = toonhoogtedip bij de aanzet in cent, om = overblazen naar deeltoon om (2 octaaf, 3 twaalfde), am = diepte van de drukmodulatie door vibrato, gn = niveau
const TYPES = [
  { sl: 2.6, sp: 1.8, rw: 0.6, par: 1, pw: 0.3, fc: 6500, fm: [[1800, 900, 0.5], [3500, 1200, 0.3], [0, 1, 0]], nz: 1, nb: 9000, cb: 0.75, tn: 0.05, dip: 25, om: 2, am: 0.3, gn: 1 },
  { sl: 1.25, sp: 1.4, rw: 0.8, par: 0.1, pw: 0.12, fc: 3600, fm: [[1700, 700, 1], [3400, 900, 0.4], [0, 1, 0]], nz: 0.15, nb: 5000, cb: 0.2, tn: 0.02, dip: 0, om: 3, am: 0.12, gn: 1.05 },
  { sl: 0.75, sp: 1.2, rw: 1, par: 1, pw: 0, fc: 5500, fm: [[1150, 450, 3.2], [2900, 800, 1.2], [450, 250, 0.5]], nz: 0.12, nb: 4500, cb: 0.3, tn: 0.02, dip: 0, om: 2, am: 0.15, gn: 0.9 },
  { sl: 1.35, sp: 1.3, rw: 0.8, par: 1, pw: 0, fc: 2400, fm: [[480, 220, 2.5], [1150, 450, 0.8], [2000, 700, 0.3]], nz: 0.18, nb: 3000, cb: 0.3, tn: 0.025, dip: 0, om: 2, am: 0.14, gn: 1.15 },
  { sl: 0.95, sp: 1.3, rw: 0.9, par: 1, pw: 0, fc: 4500, fm: [[900, 400, 1.6], [2200, 700, 1], [380, 200, 0.5]], nz: 0.22, nb: 4000, cb: 0.35, tn: 0.025, dip: 0, om: 2, am: 0.14, gn: 1 },
  { sl: 1.05, sp: 1.3, rw: 0.9, par: 1, pw: 0, fc: 3600, fm: [[600, 330, 1.8], [1600, 600, 1.1], [300, 150, 0.5]], nz: 0.25, nb: 3500, cb: 0.35, tn: 0.03, dip: 0, om: 2, am: 0.14, gn: 1.05 },
  { sl: 3.4, sp: 1.2, rw: 0.5, par: 0.6, pw: 0.3, fc: 4500, fm: [[2200, 900, 0.4], [0, 1, 0], [0, 1, 0]], nz: 0.3, nb: 6000, cb: 0.7, tn: 0.04, dip: 12, om: 2, am: 0.15, gn: 1.2 },
  { sl: 2, sp: 1.4, rw: 0.5, par: 0.28, pw: 0.2, fc: 5000, fm: [[1500, 800, 0.5], [0, 1, 0], [0, 1, 0]], nz: 1.35, nb: 7500, cb: 0.85, tn: 0.07, dip: 40, om: 3, am: 0.25, gn: 1.1 }
];
const PRESETS = {
  'Concert Flute': { type: 'flute' },
  'Clarinet': { type: 'clarinet', tone: 0.5, body: 0.8, reed: 0.5, breath: 0.15, chiff: 0.3, vibrato: 0.1, vibDelay: 0.8, attack: 0.05 },
  'Oboe': { type: 'oboe', tone: 0.55, body: 0.9, reed: 0.6, breath: 0.15, chiff: 0.3, vibrato: 0.3, attack: 0.05 },
  'Bassoon': { type: 'bassoon', tone: 0.45, body: 0.9, reed: 0.5, breath: 0.2, chiff: 0.35, vibrato: 0.2, attack: 0.07, release: 0.2 },
  'Alto Sax': { type: 'altosax', tone: 0.55, body: 0.85, bite: 0.15, growl: 0, breath: 0.25, chiff: 0.4, vibrato: 0.35, vibDelay: 0.4, attack: 0.05 },
  'Tenor Sax': { type: 'tenorsax', tone: 0.5, body: 0.85, bite: 0.25, growl: 0.1, breath: 0.3, chiff: 0.4, vibrato: 0.35, vibDelay: 0.4, attack: 0.06, release: 0.18 },
  'Recorder': { type: 'recorder', tone: 0.5, breath: 0.25, chiff: 0.35, vibrato: 0.05, vibDelay: 1, attack: 0.04 },
  'Pan Flute': { type: 'panflute', tone: 0.5, breath: 0.4, chiff: 0.55, vibrato: 0.15, vibDelay: 0.8, attack: 0.08, release: 0.25 },
  'Woodwind Section': { type: 'clarinet', players: 3, spread: 10, width: 0.7, breath: 0.2, vibrato: 0.15, vibDelay: 0.8 }
};
const WNAME = 'nl-patchkamer-woodwinds-1-20-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const TYPES = ${JSON.stringify(TYPES)};
const NV = 16, HMAX = 48, SUB = 32, CHMAX = 128, TWO_PI = Math.PI * 2;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const sclip = x => (x >= 3 ? 1 : x <= -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x));
const LN = new Float64Array(HMAX + 2); for (let h = 1; h <= HMAX + 1; h++) LN[h] = Math.log(h);
class WoodwindEngine {
  constructor(sr) {
    this.sr = sr; this.q = []; this.rs = 0x3badf00d | 0; this.P = {}; this.S = {}; this.bendCC = 0;
    for (const k in RANGES) { this.P[k] = RANGES[k][2]; this.S[k] = RANGES[k][2]; }
    this.S.bendT = 0;
    let n = 1; while (n < sr / 20 + 8) n *= 2; this.M = n - 1; this.BUF = n;
    this.dc = [0, 0, 0, 0]; this.out = [0, 0]; this.tgt = new Float64Array(HMAX + 2);
    this.mixL = new Float64Array(CHMAX); this.mixR = new Float64Array(CHMAX); this.vb = new Float64Array(SUB);
    this.grp = []; this.lastT = -1e9; this.cnt = 0; this.gcur = 0;
    this.v = Array.from({ length: NV }, () => this.blank());
  }
  blank() { return { st: 0, gid: 0, stag: 0, nrm: 1, note: 60, f0: 261.6, th: 0, e: 0, att: 0.05, rk: 0.999, vel: 0.8, age: 0, tk: 1, tkA: 1, t0: 0, tEnd: Infinity, T: 0, det: 0, gl: 0,
    vp: 0, vr: 1, vd: 0.5, gp: 0, gr: 35, d1: 0, d2: 0, delay: 0, gL: 1, gR: 1, ng: 0, hb: 0, ampPrev: 0, cw: 0, n1: 0, n2: 0,
    A: new Float64Array(HMAX + 2), dA: new Float64Array(HMAX + 2), comb: new Float64Array(this.BUF) }; }
  rnd() { let s = this.rs; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rs = s; return (s >>> 0) / 2147483648 - 1; }
  setParams(p) { if (!p || typeof p !== 'object') return; for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); } }
  insert(m) { if (this.q.length >= 2048) return; let i = this.q.length; while (i > 0 && this.q[i - 1].t > m.t) i--; this.q.splice(i, 0, m); }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'stop') { this.q.length = 0; this.bendCC = 0; this.grp = []; for (const v of this.v) if (v.st) { v.st = 2; v.tEnd = -1; v.rk = Math.exp(-6.9078 / (0.15 * this.sr)); } return; }
    if (!(typeof m.t === 'number' && isFinite(m.t))) return;
    if (m.type === 'bend') { if (typeof m.value === 'number' && isFinite(m.value)) this.insert({ type: 'bend', value: clampN(m.value, -24, 24), t: m.t }); return; }
    if (!(typeof m.note === 'number' && isFinite(m.note))) return;
    if (m.type === 'note') {
      const vel = typeof m.vel === 'number' && isFinite(m.vel) ? clampN(m.vel, 0, 1) : 0.8;
      if (vel <= 0) m = { type: 'off', note: m.note, t: m.t };
      else m = { type: 'note', note: clampN(m.note, 0, 127), vel, t: m.t, dur: typeof m.dur === 'number' && isFinite(m.dur) && m.dur > 0 ? clampN(m.dur, 0.005, 3600) : Infinity };
    } else if (m.type === 'off') m = { type: 'off', note: m.note, t: m.t }; else return;
    this.insert(m);
  }
  alloc() {
    let best = null;
    for (const v of this.v) if (v.st === 0) return v;
    for (const v of this.v) if (v.st === 2 && (!best || v.e < best.e)) best = v;
    if (best) return best;
    for (const v of this.v) if (!best || v.age > best.age) best = v;
    return best;
  }
  kill(v) { v.st = 0; v.e = 0; v.A.fill(0); v.dA.fill(0); v.comb.fill(0); v.n1 = 0; v.n2 = 0; v.hb = 0; v.gl = 0; }
  noteOn(m) {
    const P = this.P, sr = this.sr, N = Math.round(clampN(P.players, 1, 3)), ti = Math.round(clampN(P.type, 0, 7));
    // legato: een noot die een enkele lopende noot overlapt (geen akkoord) neemt de stem over en glijdt
    const g = this.grp;
    if (P.legato >= 0.5 && g.length === N && this.cnt === 1 && m.t - this.lastT >= 0.02) {
      let ok = true; for (const v of g) { const dn = m.note - v.note; if (!(v.st === 1 && v.tEnd > m.t + 0.004 && dn !== 0 && Math.abs(dn) <= 12 && v.gid === this.gcur)) ok = false; }
      if (ok) {
        for (const v of g) {
          v.gl += v.note - m.note; v.note = m.note; v.t0 = m.t; v.tEnd = Number.isFinite(m.dur) ? m.t + m.dur : Infinity; v.vel = m.vel;
          v.tk = 0; v.tkA = 0.35; v.f0 = 440 * Math.pow(2, (m.note - 69) / 12);
          if (Number.isFinite(m.dur)) v.tEnd += v.stag;
        }
        this.cnt = 1; this.lastT = m.t; return;
      }
    }
    const order = []; for (let j = 0; j < N; j++) order.push(j);
    for (let j = N - 1; j > 0; j--) { const r = Math.floor((this.rnd() * 0.5 + 0.5) * (j + 1)); const x = order[j]; order[j] = order[r]; order[r] = x; }
    const ng = [], gid = ++this.gcur, att = Math.max(0.004, P.attack);
    for (let j = 0; j < N; j++) {
      const v = this.alloc(), fresh = v.st === 0, pj = order[j];
      if (fresh) { this.kill(v); v.th = this.rnd() * 0.5 + 0.5; v.e = 0; v.cw = 0; }
      v.st = 1; v.gid = gid; v.T = ti; v.note = m.note; v.vel = m.vel; v.t0 = m.t; v.age = 0; v.tk = 0; v.tkA = 1; v.gl = 0;
      v.f0 = 440 * Math.pow(2, (m.note - 69) / 12);
      const pos = N > 1 ? (pj / (N - 1)) * 2 - 1 : 0;
      v.det = P.spread * pos + P.spread * 0.15 * this.rnd();
      v.nrm = 1 / Math.sqrt(N); v.att = att; v.rk = Math.exp(-6.9078 / (Math.max(0.02, P.release) * sr));
      v.vp = this.rnd() * 3; v.vr = 1 + 0.05 * this.rnd(); v.vd = P.vibDelay; v.gp = this.rnd() * 3; v.gr = 32 + 14 * this.rnd();
      const stag = N > 1 ? 0.012 * (j / (N - 1)) * (0.5 + 0.5 * Math.abs(this.rnd())) : 0; v.stag = stag;
      v.delay = fresh ? Math.round(stag * sr) : 0; v.tEnd = Number.isFinite(m.dur) ? m.t + m.dur + stag : Infinity;
      const pan = N > 1 ? pos * P.width * 0.8 : 0, a = (pan + 1) * Math.PI / 4;
      v.gL = Math.cos(a) * 1.414; v.gR = Math.sin(a) * 1.414;
      ng.push(v);
    }
    this.grp = ng;
    this.cnt = m.t - this.lastT < 0.04 ? this.cnt + 1 : 1; this.lastT = m.t;
  }
  noteOff(m) { for (const v of this.v) if (v.st === 1 && v.note === m.note && v.t0 <= m.t && v.tEnd > m.t) v.tEnd = m.t; }
  event(m) { if (m.type === 'note') this.noteOn(m); else if (m.type === 'off') this.noteOff(m); else if (m.type === 'bend') this.bendCC = m.value; }
  // werk de deeltonen van een stem bij voor de komende n samples; geeft het aantal deeltonen terug
  spectrum(v, f0, pe, T, S, n, ampTone) {
    const sr = this.sr, tgt = this.tgt, Hn = Math.min(HMAX, Math.floor(0.49 * sr / f0));
    const bloom = v.tkA * Math.exp(-v.tk / Math.max(0.01, T.tn)) * S.chiff;
    const slope = clampN(T.sl - T.sp * (pe - 0.5) - (S.reed - 0.5) * T.rw - 1.1 * bloom, 0.12, 6);
    const fc = clampN(T.fc * Math.pow(2, (S.tone - 0.5) * 3) * (0.55 + 0.9 * pe) * (1 + 1.5 * bloom), 150, 0.45 * sr);
    const ev = clampN(T.par + (S.reed - 0.5) * T.pw, 0, 1), body = S.body, ob = S.overblow, om = T.om, bite = S.bite;
    const pOff = Math.pow(1 - ob, 1.3), fm = T.fm, nyq = 0.5 * sr;
    let sq = 0;
    for (let h = 1; h <= Hn; h++) {
      const fh = h * f0;
      let a = Math.exp(-slope * LN[h]);
      if ((h & 1) === 0) a *= ev;
      const r2 = fh / fc, r4 = r2 * r2; a /= Math.sqrt(1 + r4 * r4);
      for (let k = 0; k < 3; k++) { const F = fm[k]; if (F[2] > 0) { const d = (fh - F[0]) / F[1]; a *= 1 + body * F[2] / (1 + d * d); } }
      if (ob > 0) a *= h % om === 0 ? 1 + 0.7 * ob : pOff;
      if (bite > 0 && h > 2) a *= 1 + bite * 1.8 * Math.min(1, (h - 2) / 6);
      if (fh > 0.4 * sr) a *= clampN((nyq - fh) / (0.1 * sr), 0, 1);
      tgt[h] = a; sq += a * a;
    }
    const sc = ampTone / Math.sqrt(sq + 1e-12), A = v.A, dA = v.dA, inv = 1 / n;
    for (let h = 1; h <= Hn; h++) dA[h] = (tgt[h] * sc - A[h]) * inv;
    for (let h = Hn + 1; h <= v.hb; h++) { A[h] = 0; dA[h] = 0; }
    v.hb = Hn;
    return Hn;
  }
  chunk(b, e) {
    const sr = this.sr, P = this.P, S = this.S, mixL = this.mixL, mixR = this.mixR, vb = this.vb, tb0 = this.t0;
    for (let s0 = b; s0 < e; s0 += SUB) {
      const n = Math.min(SUB, e - s0), tb = tb0 + s0 / sr;
      for (const v of this.v) {
        if (v.st === 0) continue;
        if (v.delay > 0) { v.delay -= n; continue; }
        const T = TYPES[v.T];
        if (v.st === 1 && tb >= v.tEnd) v.st = 2;
        // omhulling
        if (v.st === 1) v.e = 1 - (1 - v.e) * Math.pow(1 - (1 - Math.exp(-3 / (v.att * sr))), n);
        else { v.e *= Math.pow(v.rk, n); if (v.e < 1e-4) { this.kill(v); continue; } }
        const ageS = v.age / sr;
        // beweging: vibrato, drift, grom, glijden
        const vf = clampN((ageS - v.vd) / 0.5, 0, 1) * S.vibrato;
        v.vp += TWO_PI * S.vibRate * v.vr * n / sr; if (v.vp > 6283.185) v.vp -= 6283.185;
        const vs = Math.sin(v.vp);
        const kd = 1 - Math.exp(-n / (0.3 * sr)); v.d1 += (this.rnd() - v.d1) * kd; v.d2 += (this.rnd() - v.d2) * kd;
        v.gp += TWO_PI * v.gr * (1 + 0.15 * v.d2 * 40 * S.drift) * n / sr; if (v.gp > 6283.185) v.gp -= 6283.185;
        const gq = 0.5 - 0.5 * Math.cos(v.gp), gs = Math.sin(v.gp);
        if (v.gl !== 0) { v.gl *= Math.exp(-3 * n / (Math.max(0.005, S.glide / 1000) * sr)); if (Math.abs(v.gl) < 1e-3) v.gl = 0; }
        const tkE = Math.exp(-v.tk / Math.max(0.01, T.tn)) * v.tkA;
        const cents = v.det + vs * vf * 38 + S.drift * 4.5 * clampN(v.d1 * 40, -2, 2) - T.dip * S.chiff * tkE + v.gl * 100 + S.tune + S.bendT * 100 + S.growl * 14 * gs;
        const f0 = clampN(v.f0 * Math.pow(2, cents / 1200), 8, 0.45 * sr), inc = f0 / sr;
        // blaasdruk en niveau
        const pe = clampN(S.pressure + S.velocity * (v.vel - 0.7) * 0.6, 0, 1);
        const mAm = 1 + vf * T.am * vs, mG = 1 - S.growl * 0.55 * gq, mD = 1 + S.drift * 0.12 * clampN(v.d2 * 40, -2, 2);
        const lp = Math.pow(0.12 + 0.88 * pe, 1.4);
        const ampTone = 0.336 * T.gn * lp * v.e * mAm * mG * mD * S.expression * S.level * v.nrm;
        const Hn = this.spectrum(v, f0, pe, T, S, n, ampTone);
        // luchtruis: sterkte relatief aan de toon, extra bij de aanzet en bij grom
        const en = Math.pow(v.e, 0.6), ratio = S.breath * T.nz * 0.4 * (0.5 + 0.5 * pe) * (1 + 6 * S.chiff * tkE + 1.5 * S.growl);
        const ngT = clampN(ratio * 0.336 * T.gn * lp * en * S.expression * S.level * v.nrm * (1 + 0.6 * clampN(S.reed - 0.5, 0, 1) * (T.pw > 0 ? 1 : 0)), 0, 2), dng = (ngT - v.ng) / n;
        const gcomb = clampN(T.cb * 0.92, 0, 0.92), gn = Math.sqrt(1 - gcomb * gcomb);
        const D = clampN(sr / f0, 4, this.BUF - 4);
        const knb = 1 - Math.exp(-TWO_PI * Math.min(T.nb * Math.pow(2, (S.tone - 0.5) * 1.5), 0.45 * sr) / sr), khp = 1 - Math.exp(-TWO_PI * 250 / sr);
        const drv = 1 + S.bite * 4 * clampN(1 - f0 / 1500, 0.1, 1), idr = 1 / Math.sqrt(drv);
        const A = v.A, dA = v.dA, comb = v.comb, M = this.M;
        let th = v.th, cw = v.cw, n1 = v.n1, n2 = v.n2, ng = v.ng, rs = this.rs, bad = false;
        for (let j = 0; j < n; j++) {
          th += inc; if (th >= 1) th -= 1;
          const w = TWO_PI * th, c2 = 2 * Math.cos(w), s1 = Math.sin(w);
          let p0 = 0, p1 = s1, sum = A[1] * s1; A[1] += dA[1];
          for (let h = 2; h <= Hn; h++) { const p2 = c2 * p1 - p0; sum += A[h] * p2; A[h] += dA[h]; p0 = p1; p1 = p2; }
          let nz = 0;
          if (ng > 1e-6 || dng > 0) {
            rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5; const r = (rs >>> 0) / 2147483648 - 1;
            const rp = cw - D, ri = Math.floor(rp), fr = rp - ri, y0 = comb[ri & M], y1 = comb[(ri + 1) & M];
            const y = r + gcomb * (y0 + (y1 - y0) * fr); comb[cw & M] = y; cw++;
            n1 += knb * (y * gn - n1); n2 += khp * (n1 - n2); nz = (n1 - n2) * ng; ng += dng;
          }
          let x = sum + nz;
          if (drv > 1.001) x = sclip(x * drv) * idr;
          vb[j] = x;
        }
        this.rs = rs;
        v.th = th; v.cw = cw & M; v.n1 = n1; v.n2 = n2; v.ng = ngT;
        // bewaker: een stem met een niet-eindige of absurde uitgang wordt gewist en niet gemengd (een NaN telt mee in de som)
        let peak = 0, chk = 0;
        for (let j = 0; j < n; j++) { const x = vb[j], ab = x < 0 ? -x : x; chk += x; if (ab > peak) peak = ab; }
        if (!(peak < 20) || !(chk > -1e5 && chk < 1e5) || !(n1 > -50 && n1 < 50 && n2 > -50 && n2 < 50) || !(v.e >= 0 && v.e <= 1.001) || !(v.th >= 0 && v.th <= 1) || !(v.ng >= 0 && v.ng < 10)) { this.kill(v); this.grp = this.grp.filter(x => x !== v); continue; }
        for (let j = 0; j < n; j++) { const x = vb[j]; mixL[s0 + j] += x * v.gL; mixR[s0 + j] += x * v.gR; }
        v.age += n; v.tk += n / sr;
      }
    }
  }
  render(L, R, len, t0) {
    for (let o = 0; o < len; o += CHMAX) { const n = Math.min(CHMAX, len - o); this.renderPart(L, R, o, n, t0 + o / this.sr); }
  }
  renderPart(L, R, off, len, t0) {
    const sr = this.sr, S = this.S, P = this.P, mixL = this.mixL, mixR = this.mixR, kk = 1 - Math.exp(-len / (sr * 0.04));
    this.t0 = t0;
    for (const k in S) { const tgt = k === 'bendT' ? clampN(this.bendCC, -24, 24) : P[k]; if (!isFinite(S[k])) S[k] = tgt; S[k] += (tgt - S[k]) * kk; }
    mixL.fill(0, 0, len); mixR.fill(0, 0, len);
    let b = 0;
    while (b < len) {
      const tb = t0 + b / sr;
      while (this.q.length && this.q[0].t <= tb + 0.5 / sr) this.event(this.q.shift());
      let e = len;
      if (this.q.length) e = clampN(Math.ceil((this.q[0].t - t0) * sr - 0.5), b + 1, len);
      this.chunk(b, e); b = e;
    }
    const dc = this.dc, gain = 1, out = this.out;
    for (let j = 0; j < len; j++) {
      let l = mixL[j], r = mixR[j];
      if (!(l > -50 && l < 50)) l = 0; if (!(r > -50 && r < 50)) r = 0;
      for (let ch = 0; ch < 2; ch++) {
        const x = ch ? r : l, hp = x - dc[ch] + 0.995 * dc[ch + 2]; dc[ch] = x; dc[ch + 2] = hp;
        const yy = sclip(hp * gain); out[ch] = yy === yy ? yy : 0;
      }
      L[off + j] = out[0]; if (R) R[off + j] = out[1];
    }
    for (let i = 0; i < 4; i++) if (!(dc[i] > -1e4 && dc[i] < 1e4)) dc[i] = 0;
  }
}
class PkWoodwinds extends AudioWorkletProcessor {
  constructor() { super(); this.e = new WoodwindEngine(sampleRate); this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} }; }
  process(inputs, outputs) { const o = outputs[0]; if (!o || !o[0]) return true; try { this.e.render(o[0], o[1], o[0].length, currentTime); } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); } return true; }
}
registerProcessor('${WNAME}', PkWoodwinds);
`;
export default {
  id: 'nl.patchkamer.woodwinds', name: 'Woodwinds', version: '1.23.0', kind: 'instrument', category: 'synth',
  ui: { width: 720, minWidth: 340 },
  about: { nl: 'Houtblazers: fluit, riet en saxofoon.\n\nWoodwinds speelt alleen ontvangen noten, met 16 stemmen: sluit een keyboard of sequencer aan op de oranje ingang Noten en stuur de stereo-uitgang naar een mixer. Noten met een lengte (dur) werken met sequencers, noteon/noteoff met aangehouden toetsen.\n\nType kiest het instrument; de klanken in de lijst zetten type en knoppen samen. Blaasdruk maakt de toon luider en helderder, Overblazen springt naar het tweede register (octaaf, bij klarinet en panfluit een twaalfde). Beet en Grom geven riet en saxofoon hun rauwe kant.\n\nOverlappende noten (dur langer dan de stap) klinken legato met een toonhoogteglijding. Buiging: cc bend/pitchbend (0,5 = midden, twee halve tonen omhoog en omlaag).\n\nEen paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis.', en: 'Woodwinds: flute, reed and saxophone.\n\nWoodwinds plays received notes only, with 16 voices: connect a keyboard or sequencer to the orange Notes input and send the stereo output to a mixer. Notes with a length (dur) work with sequencers, noteon/noteoff with held keys.\n\nType chooses the instrument; the sounds in the list set type and knobs together. Breath pressure makes the tone louder and brighter, Overblow jumps to the second register (an octave, a twelfth for clarinet and pan flute). Bite and Growl give reed and saxophone their raw side.\n\nOverlapping notes (dur longer than the step) sound legato with a pitch glide. Bend: cc bend/pitchbend (0.5 = centre, two semitones up and down).\n\nA purple Mod cable controls sound parameters; the knobs stay the base.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo woodwinds' }], eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo houtblazers', notes: 'Keyboard / noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const spec = {}; for (const [id, d] of Object.entries(SPEC)) spec[id] = [tx(d[0]), ...d.slice(1)];
    const defaults = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, d[4]])); defaults.type = 'flute'; defaults.legato = 'on'; defaults.preset = 'Concert Flute';
    let state = { ...defaults }, effective = { ...defaults }, mod = {}, dead = false, root = null, controls = {}, presetSelect = null, typeSelect = null, legatoSelect = null, status = null, warn = null, node = null;
    const pending = [], out = ctx.createGain(); out.gain.value = 1;
    const resolve = () => { const r = { ...state }; for (const [id, d] of Object.entries(spec)) { const o = mod[id] || 0; r[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** o : state[id] + o * (d[2] - d[1]), d[1], d[2]); } return r; };
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 256) pending.push(m); };
    function apply() { if (dead) return; effective = resolve(); const p = {}; for (const k of Object.keys(RANGES)) if (k in effective) p[k] = effective[k]; p.type = Math.max(0, TYPE_IDS.indexOf(state.type)); p.legato = state.legato === 'off' ? 0 : 1; if (node) node.port.postMessage({ type: 'params', p }); else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); } }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.connect(out); apply(); pending.splice(0).forEach(m => { if (m.type !== 'params' && !(m.t > ctx.currentTime)) return; if (m.type !== 'params') node.port.postMessage(m); });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Woodwinds kan hier geen geluid maken.'); });
    function noteOn(note, vel, t, dur) { post({ type: 'note', note: clamp(note + effective.transpose, 0, 127), vel, t, dur: Number.isFinite(dur) ? dur : -1 }); }
    function noteOff(note, t) { post({ type: 'off', note: clamp(note + effective.transpose, 0, 127), t }); }
    function setBend(v, t) { post({ type: 'bend', value: v, t: Number.isFinite(t) ? t : ctx.currentTime }); }
    function panic() { pending.length = 0; apply(); if (node) node.port.postMessage({ type: 'stop' }); }
    function paint() { for (const k in controls) controls[k].set(state[k]); if (presetSelect) presetSelect.value = state.preset; if (typeSelect) typeSelect.value = state.type; if (legatoSelect) legatoSelect.value = state.legato; if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : ''; status.hidden = !status.textContent; } }
    function change(id, value) { const d = spec[id]; if (!d || !Number.isFinite(+value)) return; state[id] = Number(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint(); }
    const fmt = (d, v) => d[5] === '%' ? Math.round(v * 100) + '%' : d[5] === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : d[5] === '' ? String(Math.round(v)) : d[5] === 'Hz' ? v.toFixed(1) + ' Hz' : d[5] === 'ms' ? Math.round(v) + ' ms' : v.toFixed(d[3] >= 1 ? 0 : d[3] >= 0.1 ? 1 : 2) + ' ' + d[5];
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount(); root = el;
        // de UI staat in een open shadow root, zodat een skin er CSS in kan zetten; de basisstijlen van de host staan hieronder mee, zodat het er zonder skin hetzelfde uitziet
        const shell = document.createElement('div'); el.appendChild(shell); const sh = shell.attachShadow ? shell.attachShadow({ mode: 'open' }) : shell;
        const baseCss = document.createElement('style'); baseCss.textContent = '.app{display:grid;gap:5px;min-width:0}*{box-sizing:border-box}.k{display:grid;grid-template-columns:70px minmax(0,1fr) 44px;gap:6px;align-items:center}.k label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.k output{font-size:10px;text-align:right;font-variant-numeric:tabular-nums}button{font-family:var(--disp);font-weight:500;font-size:13px;letter-spacing:.1em;text-transform:uppercase;background:var(--card-2);color:var(--fg);border:1px solid var(--line);padding:6px 11px;cursor:pointer;border-radius:3px}button:hover{border-color:var(--audio)}button:focus-visible{outline:1px solid var(--audio);outline-offset:2px}input[type=range]{appearance:none;height:16px;background:transparent;margin:0;cursor:pointer;width:100%;min-width:0}input[type=range]::-webkit-slider-runnable-track{height:3px;background:var(--line)}input[type=range]::-moz-range-track{height:3px;background:var(--line)}input[type=range]::-webkit-slider-thumb{appearance:none;width:10px;height:14px;margin-top:-5.5px;border-radius:2px;background:var(--card-2);border:1px solid var(--audio)}input[type=range]::-moz-range-thumb{width:9px;height:13px;border-radius:2px;background:var(--card-2);border:1px solid var(--audio)}input[type=range]:focus-visible{outline:1px solid var(--audio);outline-offset:2px}select{background:var(--field);color:var(--field-fg);border:1px solid var(--line);font-family:var(--mono);font-size:11px;padding:4px 6px;border-radius:3px;min-width:0}.note{color:var(--muted);font-size:10px;line-height:1.45}'; sh.appendChild(baseCss);
        el = document.createElement('div'); el.className = 'app'; sh.appendChild(el);
        const css = document.createElement('style'); css.textContent = '.ww-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px 18px;margin-top:4px}.ww-grid .k{grid-template-columns:124px minmax(90px,1fr) 62px;gap:8px;min-height:30px}.ww-grid .k label{font-size:10px;letter-spacing:.04em}.ww-grid .k output{font-size:11px;white-space:nowrap}.ww-grid input[type=range]{width:100%;min-width:90px;height:24px;margin:0;cursor:pointer;accent-color:var(--audio,#e4c697)}'; el.appendChild(css);
        typeSelect = host.ui.select(el, tx('Type'), TYPE_IDS.map(k => [k, tx(TYPE_LABEL[k])]), state.type, k => { if (TYPE_IDS.includes(k)) { state.type = k; state.preset = 'Custom'; apply(); paint(); } }, { id: 'type', group: 'type' });
        presetSelect = host.ui.select(el, tx('Klank'), Object.keys(PRESETS).map(k => [k, k]).concat([['Custom', tx('Eigen klank')]]), state.preset, name => { if (Object.hasOwn(PRESETS, name)) self.setState({ ...defaults, ...PRESETS[name], preset: name }); }, { id: 'preset', group: 'preset' });
        const groups = [[tx('Toon & formant'), ['tone', 'body', 'reed', 'bite', 'growl', 'overblow'], 'tone'], [tx('Adem & aanzet'), ['pressure', 'breath', 'chiff', 'attack', 'release', 'velocity'], 'breath'],
          [tx('Vibrato & legato'), ['vibrato', 'vibRate', 'vibDelay', 'glide', 'drift'], 'motion'], [tx('Sectie & niveau'), ['players', 'spread', 'width', 'tune', 'transpose', 'expression', 'level'], 'play']];
        for (const [label, ids, grp] of groups) {
          const h = document.createElement('div'); h.textContent = label; h.style.cssText = 'font-size:12px;opacity:.8;border-top:1px solid var(--line);padding-top:8px;margin-top:9px'; el.appendChild(h);
          const grid = document.createElement('div'); grid.className = 'ww-grid'; el.appendChild(grid);
          for (const id of ids) { const d = spec[id], before = grid.children.length; controls[id] = host.ui.knob(grid, d[0], [d[1], d[2], d[3]], state[id], v => fmt(d, v), v => change(id, v), { default: defaults[id], id, group: grp, ...(d[6] === 'log' ? { scale: 'log' } : {}) }); const row = grid.children[before]; if (row) row.title = d[0]; }
          if (grp === 'motion') legatoSelect = host.ui.select(grid, tx('Legato'), [['on', tx('Aan')], ['off', tx('Uit')]], state.legato, k => { if (k === 'on' || k === 'off') { state.legato = k; state.preset = 'Custom'; apply(); paint(); } }, { id: 'legato', group: 'motion' });
        }
        const actions = document.createElement('div'); actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px'; el.appendChild(actions);
        const button = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); return b; };
        const base = () => state.type === 'bassoon' || state.type === 'tenorsax' ? -12 : state.type === 'panflute' || state.type === 'recorder' || state.type === 'flute' ? 5 : 0;
        button(tx('Proeftoon'), () => noteOn(67 + base(), 0.8, ctx.currentTime + 0.01, 1.5));
        button(tx('Proefakkoord'), () => { const t = ctx.currentTime + 0.01, b = base(); [60, 64, 67, 72].forEach(n => noteOn(n + b, 0.75, t, 2.5)); });
        button(tx('Alles uit'), () => panic());
        status = document.createElement('p'); status.style.cssText = 'font-size:12px;color:var(--mod);line-height:1.5'; el.appendChild(status);
        warn = document.createElement('p'); warn.className = 'note'; warn.textContent = node ? '' : tx('AudioWorklet laden…'); el.appendChild(warn);
        paint();
      },
      unmount() { if (root) root.innerHTML = ''; root = null; controls = {}; presetSelect = null; typeSelect = null; legatoSelect = null; status = null; warn = null; },
      onEvent(port, event) {
        try {
          if (dead || port !== 'notes' || !event) return;
          const time = Number.isFinite(event.time) ? event.time : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(event.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(event.note)) {
            const n = clamp(event.note, 0, 127);
            if (type === 'noteoff' || event.vel === 0) noteOff(n, t); else noteOn(n, Number.isFinite(event.vel) ? clamp(event.vel, 0, 1) : 0.8, t, Number.isFinite(event.dur) ? clamp(event.dur, 0.005, 120) : undefined);
          } else if (type === 'cc' && (event.id === 'bend' || event.id === 'pitchbend') && Number.isFinite(event.value)) {
            setBend((clamp(event.value, 0, 1) - 0.5) * 4, t);
          } else if (type === 'cc' && Object.hasOwn(spec, event.id) && event.id !== 'transpose' && Number.isFinite(event.value)) {
            const d = spec[event.id]; state[event.id] = Number(clamp(Math.round((d[1] + clamp(event.value, 0, 1) * (d[2] - d[1])) / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint();
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) {}
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(spec).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: d[0], lane: 'woodwinds', laneName: 'Woodwinds', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
      modulate(offsets) {
        if (dead) return; const next = {};
        if (offsets && typeof offsets === 'object' && !Array.isArray(offsets)) for (const id of Object.keys(spec)) { if (MODEX.includes(id)) continue; const v = offsets[id]; if (typeof v === 'number' && Number.isFinite(v)) next[id] = clamp(v, -1, 1); }
        mod = next; apply();
        if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : tx('Mod gereed · verbind een paarse sturingskabel'); status.hidden = false; }
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
        for (const [id, d] of Object.entries(spec)) if (typeof s[id] === 'number' && Number.isFinite(s[id])) next[id] = Number(clamp(Math.round(s[id] / d[3]) * d[3], d[1], d[2]).toFixed(6));
        if (typeof s.type === 'string' && TYPE_IDS.includes(s.type)) next.type = s.type;
        if (s.legato === 'on' || s.legato === 'off') next.legato = s.legato;
        if (s.preset === 'Custom' || (typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset))) next.preset = s.preset;
        state = next; apply(); paint();
      },
      destroy() { if (dead) return; dead = true; try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) {} node = null; pending.length = 0; self.unmount(); }
    };
    apply(); return self;
  }
};
