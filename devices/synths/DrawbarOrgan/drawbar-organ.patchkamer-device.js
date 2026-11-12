// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Eerste uitgave van Drawbar Organ (id nl.patchkamer.drawbarorgan), gebouwd voor Patchkamer contract v1.35.
//   Een orgel met trekkers, geïnspireerd op klassieke tonewheel-orgels, met één AudioWorklet-motor (OrganEngine):
//   - een gedeelde bank van 91 generatoren (sinus met een zweempje 2e en 3e harmonische, tandwielverhoudingen met kleine afwijkingen);
//     elke toets tapt de generator van zijn eigen toonhoogte plus de intervallen van de trekkers (16', 5⅓', 8', 4', 2⅔', 2', 1⅗', 1⅓', 1'),
//     gelijkzwevend zoals het origineel (dus niet zuiver), met terugvouwen van de hoogste octaven en lichte lekkage tussen generatoren en bussen
//   - twee manualen (Upper, Lower) met elk negen trekkers van 0 tot 8 in stappen van 3 dB, plus basvoeten met twee trekkers (16', 8');
//     splitpunten of MIDI-kanaal (1 = Upper, 2 = Lower, 3 = basvoeten); geen velocity-dynamiek (touch is een zachte optie)
//   - toetscontact: negen contacten per toets die niet tegelijk sluiten, instelbare aanzetklik, spreiding en loslaatklik
//   - percussie (2e of 3e harmonische, snel of langzaam, normaal of zacht), alleen op Upper, alleen op de eerste toets van een legato-frase (instelbaar), de 1' trekker zwijgt
//   - vibrato en chorus V1 tot V3 en C1 tot C3 met een scanner van ongeveer 6,8 Hz, per manual aan of uit
//   - rotary-luidspreker: hoorn en trommel met crossover op 800 Hz, stop, langzaam en snel met echte aanloop en uitloop, Doppler, amplitudemodulatie,
//     twee microfoons, micafstand, rotorgeluid bij toerenwisseling en bypass; te schakelen met knop, besturing (mod), cc of een toets
//   - voorversterker met warme verzadiging (ADAA tegen aliasing), bas en hoog, veerhall en volume
//   - tweede klankmodel Combo: een compacte divide-down orgelklank (blokgolven met PolyBLEP) met voetschakelaars 16', 8', 4', 2⅔', 2' en IV mixtuur
//   - bewaker in de motor: alleen eindige berichten, toestanden worden per blok op eindigheid gecontroleerd en teruggezet, de uitgang is begrensd
const EN = {
  'Upper': 'Upper', 'Lower': 'Lower', 'Basvoeten': 'Bass pedals', 'Trekkers': 'Drawbars', 'Klankmodel': 'Sound model', 'Tonewheel': 'Tonewheel', 'Combo': 'Combo',
  'Percussie': 'Percussion', 'Aan': 'On', 'Uit': 'Off', '2e harmonische': '2nd harmonic', '3e harmonische': '3rd harmonic', 'Snel': 'Fast', 'Langzaam': 'Slow',
  'Normaal': 'Normal', 'Zacht': 'Soft', 'Enkele trigger': 'Single trigger', 'Percussie-harmonische': 'Percussion harmonic',
  'Vibrato en chorus': 'Vibrato and chorus', 'Soort': 'Type', 'Vibrato Upper': 'Vibrato Upper', 'Vibrato Lower': 'Vibrato Lower', 'Scannersnelheid': 'Scanner rate', 'Diepte': 'Depth',
  'Rotary': 'Rotary', 'Bypass': 'Bypass', 'Stop': 'Stop', 'Snelheid': 'Speed', 'Micafstand': 'Mic distance', 'Stereo-spreiding': 'Stereo spread', 'Hoorn / trommel': 'Horn / drum',
  'Hoorn': 'Horn', 'Trommel': 'Drum', 'Toets': 'Key', 'Toets voor rotary': 'Rotary toggle key',
  'Toetscontact': 'Key contact', 'Aanzetklik': 'Key click', 'Contactspreiding': 'Contact spread', 'Loslaatklik': 'Release click', 'Lekkage': 'Leakage', 'Aanslag': 'Touch',
  'Versterker': 'Amplifier', 'Drive': 'Drive', 'Bas': 'Bass', 'Hoog': 'Treble', 'Hall': 'Reverb', 'Volume': 'Volume',
  'Klavier': 'Keyboard', 'Verdeling': 'Routing', 'Splitpunt': 'Split point', 'Splitpunt basvoeten': 'Bass split point', 'Splitpunt Lower': 'Lower split point',
  'Splitpunt (Upper vanaf)': 'Split point (Upper from)', 'Basvoeten tot': 'Bass pedals up to', 'Uit (alles Upper)': 'Off (all Upper)',
  'Splitpunt en basvoeten': 'Split and bass pedals', 'MIDI-kanaal': 'MIDI channel', 'Kanaal 1 Upper, 2 Lower, 3 basvoeten': 'Channel 1 Upper, 2 Lower, 3 bass pedals',
  'Combo-voetschakelaars': 'Combo footage switches', 'Riet': 'Reed', 'IV mixtuur': 'IV mixture',
  'Proefakkoord': 'Test chord', 'Alles uit': 'All off', 'Registratie': 'Registration',
  'Rotor: hoorn {0} Hz, trommel {1} Hz': 'Rotor: horn {0} Hz, drum {1} Hz',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Drawbar Organ kan hier geen geluid maken.': 'AudioWorklet not available: Drawbar Organ cannot make sound here.',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Gestuurd: ': 'Controlled: ',
  'Basvoet 16′': 'Pedal 16′', 'Basvoet 8′': 'Pedal 8′',
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan, groep]
const SPEC = {};
const FOOT = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];
const FOOT_COL = ['brown', 'brown', 'white', 'white', 'black', 'white', 'black', 'black', 'white'];
const DEF_UP = [8, 8, 8, 0, 0, 0, 0, 0, 0], DEF_LO = [0, 0, 8, 0, 0, 0, 0, 0, 0], DEF_PD = [8, 0];
for (let i = 0; i < 9; i++) { SPEC['up' + i] = ['Upper ' + FOOT[i], 0, 8, 1, DEF_UP[i], 'db', 'lin', 'level', 0.02, false, 'upper']; SPEC['lo' + i] = ['Lower ' + FOOT[i], 0, 8, 1, DEF_LO[i], 'db', 'lin', 'level', 0.02, false, 'lower']; }
for (let i = 0; i < 2; i++) SPEC['pd' + i] = ['Basvoet ' + FOOT[i === 0 ? 0 : 2], 0, 8, 1, DEF_PD[i], 'db', 'lin', 'level', 0.02, false, 'pedal'];
Object.assign(SPEC, {
  vol: ['Volume', 0, 1, 0.01, 0.5, '%', 'lin', 'level', 0.02, false, 'amp'],
  drive: ['Drive', 0, 1, 0.01, 0.25, '%', 'lin', 'color', 0.08, true, 'amp'],
  bass: ['Bas', -1, 1, 0.01, 0, 'tone', 'lin', 'filter', 0.06, true, 'amp'],
  treble: ['Hoog', -1, 1, 0.01, 0, 'tone', 'lin', 'filter', 0.06, true, 'amp'],
  reverb: ['Hall', 0, 1, 0.01, 0.2, '%', 'lin', 'mix', 0.06, true, 'amp'],
  click: ['Aanzetklik', 0, 1, 0.01, 0.45, '%', 'lin', 'color', 0.04, false, 'contact'],
  clickSpread: ['Contactspreiding', 0, 1, 0.01, 0.5, '%', 'lin', 'color', 0.03, false, 'contact'],
  relClick: ['Loslaatklik', 0, 1, 0.01, 0.2, '%', 'lin', 'color', 0.03, false, 'contact'],
  leak: ['Lekkage', 0, 1, 0.01, 0.3, '%', 'lin', 'color', 0.04, false, 'contact'],
  touch: ['Aanslag', 0, 1, 0.01, 0, '%', 'lin', 'level', 0.02, false, 'contact'],
  vibRate: ['Scannersnelheid', 5, 8.5, 0.05, 6.8, 'Hz', 'lin', 'rate', 0.03, false, 'vibrato'],
  vibAmt: ['Diepte', 0, 1.5, 0.01, 1, '%', 'lin', 'motion', 0.1, true, 'vibrato'],
  rotSpd: ['Snelheid', 0, 1, 0.01, 0.5, 'spd', 'lin', 'rate', 0.1, false, 'rotary'],
  rotMic: ['Micafstand', 0, 1, 0.01, 0.4, '%', 'lin', 'mix', 0.08, true, 'rotary'],
  rotSpread: ['Stereo-spreiding', 0, 1, 0.01, 0.75, '%', 'lin', 'pan', 0.08, true, 'rotary'],
  rotBal: ['Hoorn / trommel', -1, 1, 0.01, 0, 'bal', 'lin', 'level', 0.08, true, 'rotary'],
  reed: ['Riet', 0, 1, 0.01, 0.5, '%', 'lin', 'color', 0.1, true, 'combo'],
});
const SELECTS = { model: ['tonewheel', 'combo'], vib: ['v1', 'v2', 'v3', 'c1', 'c2', 'c3'], percHarm: ['2', '3'], route: ['split', 'channel'] };
const SEL_DEF = { model: 'tonewheel', vib: 'c3', percHarm: '2', route: 'split' };
const BOOLS = { perc: false, percFast: true, percSoft: false, percSingle: true, vibUp: true, vibLo: false, rotOn: true, cf16: false, cf8: true, cf4: true, cf223: false, cf2: false, cfmix: false };
const INTS = { split: [0, 127, 0], bassSplit: [0, 127, 0], rotKey: [-1, 127, -1] };
const MODEX = ['split', 'bassSplit', 'rotKey'];
const RANGES = {};
for (const [id, d] of Object.entries(SPEC)) RANGES[id] = [d[1], d[2], d[4]];
RANGES.model = [0, 1, 0]; RANGES.vib = [0, 5, 5]; RANGES.percHarm = [2, 3, 2];
for (const [k, v] of Object.entries(BOOLS)) RANGES[k] = [0, 1, v ? 1 : 0];
// afwijkingen in cent per toonklasse (C tot B) van tandwielverhoudingen met 19 tot 86 tanden; gemodelleerd, niet van een bepaald orgel overgenomen
const TW_CENTS = [-1.07, -0.68, -0.1, -0.09, 0.36, -0.68, 0.03, 0.02, 0.06, 0, -0.29, 0.1];
const WNAME = 'nl-patchkamer-drawbarorgan-1-0-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const TWC = ${JSON.stringify(TW_CENTS)};
const NW = 91, CH = 128, NB = 10, NK = 384, NC = NK * 10, TWO_PI = Math.PI * 2, BASE = 24;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
// afstand in halve tonen van elke contactgroep tot de toets: Upper en Lower (negen trekkers), basvoeten (twee), percussie (slot 9)
const OFF_TW = [-12, 7, 0, 12, 19, 24, 28, 31, 36], OFF_PD = [-12, 0], OFF_CB = [-12, 0, 12, 19, 24, 24, 31, 36, 40], BUS_CB = [0, 1, 2, 3, 4, 5, 5, 5, 5];
const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
const lncosh = x => { const a = x < 0 ? -x : x; return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2; };
const dbLevel = p => { if (!(p > 0)) return 0; if (p > 8) p = 8; return Math.pow(10, -(8 - p) * 0.15) * (p < 1 ? p : 1); };
// vibrato en chorus: amplitude van de vertraging in ms en menging (0 = alleen vibrato, 0.5 = chorus)
const VIB_MS = [0.08, 0.16, 0.26, 0.08, 0.16, 0.26];
const ROT = { hornSlow: 0.8, hornFast: 6.8, drumSlow: 0.65, drumFast: 5.9, hornUp: 0.7, hornDown: 1.6, drumUp: 2.2, drumDown: 3.8, hornR: 0.2, drumR: 0.12, xover: 800 };
const SMK = ['vol', 'drive', 'bass', 'treble', 'reverb', 'rotMic', 'rotSpread', 'rotBal', 'vibAmt', 'vibRate', 'reed'];
const DRIVE_DB = [0, -4.2, -7.3, -7.7, -6.8];
const driveComp = d => { const x = clampN(d, 0, 1) * 4, i = Math.min(3, Math.floor(x)), f = x - i; return DRIVE_DB[i] + (DRIVE_DB[i + 1] - DRIVE_DB[i]) * f; };
// halfband-oversampling: 2x met een FIR van K+1 oneven coëfficiënten per kant (Kaiser); latentie 2K+1 samples
const HK = 5, HD = (() => {
  const I0 = x => { let s = 1, t = 1; for (let k = 1; k < 30; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; }, J = 2 * HK + 2, beta = 7, d = [];
  for (let k = 0; k <= HK; k++) { const j = 2 * k + 1, w = I0(beta * Math.sqrt(Math.max(0, 1 - (j / J) * (j / J)))) / I0(beta); d.push(2 * (k % 2 ? -1 : 1) / (Math.PI * j) * w); }
  return d;
})();
class Adaa { constructor() { this.ux = 0; this.uF = 0; } run(u) { const F = lncosh(u), du = u - this.ux; const y = Math.abs(du) > 1e-5 ? (F - this.uF) / du : Math.tanh((u + this.ux) * 0.5); this.ux = u; this.uF = F; return y; } reset() { this.ux = 0; this.uF = 0; } ok() { return this.ux > -1e6 && this.ux < 1e6 && this.uF > -1e6 && this.uF < 1e6; } }
class Over2 {
  constructor(inner) { this.inner = inner; this.a = new Float64Array(2 * HK + 2); this.b = new Float64Array(4 * HK + 3); }
  run(x) {
    const a = this.a, b = this.b;
    for (let i = a.length - 1; i > 0; i--) a[i] = a[i - 1];
    a[0] = x; const e = a[HK + 1]; let o = 0;
    for (let k = 0; k <= HK; k++) o += HD[k] * (a[HK + 1 + k] + a[HK - k]);
    const ve = this.inner.run(e), vo = this.inner.run(o);
    for (let i = b.length - 1; i >= 2; i--) b[i] = b[i - 2];
    b[1] = ve; b[0] = vo; let y = 0.5 * b[2 * HK + 1];
    for (let k = 0; k <= HK; k++) y += 0.5 * HD[k] * (b[2 * HK - 2 * k] + b[2 * HK + 2 + 2 * k]);
    return y;
  }
  reset() { this.a.fill(0); this.b.fill(0); this.inner.reset(); }
  ok() { for (let i = 0; i < this.a.length; i++) if (!(this.a[i] > -1e6 && this.a[i] < 1e6)) return false; for (let i = 0; i < this.b.length; i++) if (!(this.b[i] > -1e6 && this.b[i] < 1e6)) return false; return this.inner.ok(); }
}
const biq = () => ({ b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, z1: 0, z2: 0 });
const biqRun = (f, x) => { const y = f.b0 * x + f.z1; f.z1 = f.b1 * x - f.a1 * y + f.z2; f.z2 = f.b2 * x - f.a2 * y; return y; };
const shelf = (f, hi, fc, gdb, sr) => {
  const A = Math.pow(10, gdb / 40), w = TWO_PI * fc / sr, cs = Math.cos(w), sn = Math.sin(w), al = sn / 2 * Math.sqrt(2), sq = 2 * Math.sqrt(A) * al;
  let b0, b1, b2, a0, a1, a2;
  if (hi) { b0 = A * ((A + 1) + (A - 1) * cs + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - sq); a0 = (A + 1) - (A - 1) * cs + sq; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - sq; }
  else { b0 = A * ((A + 1) - (A - 1) * cs + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - sq); a0 = (A + 1) + (A - 1) * cs + sq; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - sq; }
  f.b0 = b0 / a0; f.b1 = b1 / a0; f.b2 = b2 / a0; f.a1 = a1 / a0; f.a2 = a2 / a0;
};
const butter = (f, hp, fc, sr) => { const w = TWO_PI * fc / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al; if (hp) { f.b0 = (1 + cs) / 2 / a0; f.b1 = -(1 + cs) / a0; f.b2 = f.b0; } else { f.b0 = (1 - cs) / 2 / a0; f.b1 = (1 - cs) / a0; f.b2 = f.b0; } f.a1 = -2 * cs / a0; f.a2 = (1 - al) / a0; };
const rd = (buf, mask, wp, d) => {
  const p = wp - d, i = Math.floor(p), f = p - i, y0 = buf[(i - 1) & mask], y1 = buf[i & mask], y2 = buf[(i + 1) & mask], y3 = buf[(i + 2) & mask];
  return ((0.5 * (y3 - y0) + 1.5 * (y1 - y2)) * f + (y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3)) * f * f + 0.5 * (y2 - y0) * f + y1;
};
class OrganEngine {
  constructor(sr) {
    this.sr = sr; this.q = []; this.rs = 0x1badf00d | 0; this.P = {}; for (const k in RANGES) this.P[k] = RANGES[k][2];
    this.nAbs = 0; this.genC = 0; this.S = {}; this.ui = false; this.uiN = 0;
    // generatoren
    this.wx = new Float64Array(NW); this.wy = new Float64Array(NW); this.wc = new Float64Array(NW); this.ws = new Float64Array(NW); this.wh2 = new Float64Array(NW); this.wh3 = new Float64Array(NW);
    this.wph = new Float64Array(NW); this.winc = new Float64Array(NW); this.Wb = new Float64Array(NW * CH);
    for (let w = 0; w < NW; w++) {
      const f = 440 * Math.pow(2, (BASE + w - 69) / 12 + TWC[w % 12] / 1200), om = TWO_PI * f / sr;
      this.wc[w] = Math.cos(om); this.ws[w] = Math.sin(om); this.wx[w] = Math.cos((w * 2.399963) % TWO_PI); this.wy[w] = Math.sin((w * 2.399963) % TWO_PI);
      this.wh2[w] = 0.03 * Math.exp(-w / 30); this.wh3[w] = 0.012 * Math.exp(-w / 40);
      this.winc[w] = 440 * Math.pow(2, (BASE + w - 69) / 12) / sr; this.wph[w] = (w * 0.618034) % 1;
    }
    // toetsen en contacten
    this.kDown = new Uint8Array(NK); this.kGen = new Int32Array(NK); this.kAmp = new Float64Array(NK);
    this.cW = new Int16Array(NC); this.cB = new Int8Array(NC); this.cSt = new Int8Array(NC); this.cG = new Float64Array(NC); this.cStep = new Float64Array(NC);
    this.cT0 = new Float64Array(NC); this.cAmp = new Float64Array(NC); this.inMv = new Uint8Array(NC); this.mv = new Int32Array(NC); this.mvN = 0;
    this.cnt = new Float64Array(3 * NB * NW); this.cntG = new Float64Array(3 * NB * NW); this.lastLeak = -1;
    this.held = [0, 0, 0]; this.total = 0; this.gc = 1;
    this.bus = [new Float64Array(NB * CH), new Float64Array(NB * CH), new Float64Array(NB * CH)]; this.mOut = [new Float64Array(CH), new Float64Array(CH), new Float64Array(CH)];
    this.Lc = new Float64Array(3 * NB); this.Lt = new Float64Array(3 * NB); this.Ln = new Float64Array(3 * NB);
    this.pTop = 0; this.pOut = 0; this.pEnv = new Float64Array(CH); this.mfade = 1; this.lastModel = 0;
    // vibrato
    this.vbuf = [new Float64Array(1024), new Float64Array(1024)]; this.vw = 0; this.vph = 0; this.vmix = [0, 0]; this.vdepth = 0; this.vcho = 0;
    // versterker, toon, hall
    this.os = 2; this.shp = new Over2(new Adaa()); this.hp1 = 0; this.hp2 = 0; this.tb = biq(); this.tt = biq(); this.lastTone = [9, 9];
    this.rvL = this.spring(1087, 0.86, 0.35, -0.55, 30, 0.31); this.rvR = this.spring(1259, 0.86, 0.35, -0.55, 30, 0.27);
    // rotary
    this.lp = [biq(), biq()]; this.hpf = [biq(), biq()]; butter(this.lp[0], false, ROT.xover, sr); butter(this.lp[1], false, ROT.xover, sr); butter(this.hpf[0], true, ROT.xover, sr); butter(this.hpf[1], true, ROT.xover, sr);
    this.hbuf = new Float64Array(2048); this.dbuf = new Float64Array(2048); this.rw = 0; this.wh = 0; this.wd = 0; this.th = 0.3; this.td = 1.1; this.rnoise = 0; this.rlp = 0; this.rmix = 1; this.hlpL = 0; this.hlpR = 0; this.ml = 1; this.rotG = 1;
    this.rotS = { mic: 0.4, spread: 0.75, bal: 0 }; this.out = [0, 0];
    this.rsl = 0; this.rsr = 0;
  }
  rnd() { let s = this.rs; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rs = s; return (s >>> 0) / 2147483648 - 1; }
  spring(len, g, lpc, a, K, seed) {
    return { buf: new Float64Array(len), len, w: 0, g, lpc, lpz: 0, a, K, x1: new Float64Array(K), y1: new Float64Array(K) };
  }
  springRun(s, x) {
    let p = s.w - s.len + 1; if (p < 0) p += s.len;
    let v = s.buf[p === s.len ? 0 : p];
    const a = s.a, K = s.K, x1 = s.x1, y1 = s.y1;
    for (let k = 0; k < K; k++) { const y = a * (v - y1[k]) + x1[k]; x1[k] = v; y1[k] = y; v = y; }
    s.lpz += s.lpc * (v - s.lpz); v = s.lpz;
    s.buf[s.w] = x + s.g * v; if (++s.w >= s.len) s.w = 0;
    return v;
  }
  setParams(p) { if (!p || typeof p !== 'object') return; for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); } }
  insert(m) { if (this.q.length >= 4096) return; let i = this.q.length; while (i > 0 && this.q[i - 1].s > m.s) i--; this.q.splice(i, 0, m); }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'ui') { this.ui = !!m.on; return; }
    if (m.type === 'os') { const n = m.n === 1 || m.n === 4 ? m.n : 2; if (n !== this.os) { this.os = n; this.shp = n === 1 ? new Adaa() : n === 4 ? new Over2(new Over2(new Adaa())) : new Over2(new Adaa()); } return; }
    if (m.type === 'stop') { this.q.length = 0; this.stopAll(); return; }
    if (!(typeof m.t === 'number' && isFinite(m.t))) return;
    const s = Math.round(m.t * this.sr);
    if (m.type === 'rot') { this.insert({ type: 'rot', s, v: clampN(+m.v || 0, 0, 1) }); return; }
    if (!(typeof m.note === 'number' && isFinite(m.note))) return;
    const man = m.m === 1 ? 1 : m.m === 2 ? 2 : 0, note = clampN(Math.round(m.note), 0, 127);
    if (m.type === 'on') {
      const vel = typeof m.vel === 'number' && isFinite(m.vel) ? clampN(m.vel, 0, 1) : 0.8;
      this.insert({ type: 'on', man, note, vel, s, dur: typeof m.dur === 'number' && isFinite(m.dur) && m.dur > 0 ? clampN(m.dur, 0.005, 3600) : Infinity });
    } else if (m.type === 'off') this.insert({ type: 'off', man, note, s, gen: -1 });
  }
  stopAll() {
    const n = this.nAbs;
    for (let ki = 0; ki < NK; ki++) if (this.kDown[ki]) this.release(ki, n, true);
    this.pTop = 0;
  }
  widx(p) { let w = p - BASE; while (w > 90) w -= 12; while (w < 0) w += 12; return w; }
  attackSamples() { return Math.max(1, 0.008 * Math.pow(0.0037, this.P.click) * this.sr); }
  releaseSamples() { return Math.max(1, 0.012 * Math.pow(0.0042, this.P.relClick) * this.sr); }
  addMv(ci) { if (!this.inMv[ci]) { this.inMv[ci] = 1; this.mv[this.mvN++] = ci; } }
  noteOn(man, note, vel, s, dur) {
    const P = this.P, ki = man * 128 + note, combo = P.model >= 0.5, sr = this.sr;
    if (this.kDown[ki]) { this.kGen[ki] = ++this.genC; if (Number.isFinite(dur)) this.insert({ type: 'off', man, note, s: s + Math.round(dur * sr), gen: this.kGen[ki] }); return; }
    const upperBefore = this.held[0];
    this.kDown[ki] = 1; this.kGen[ki] = ++this.genC; this.held[man]++; this.total++;
    const touch = P.touch; this.kAmp[ki] = (1 - touch) + touch * Math.max(0.1, vel);
    const att = this.attackSamples(), spread = P.clickSpread * 0.0035 * sr, offs = man === 2 ? OFF_PD : combo ? OFF_CB : OFF_TW, n = offs.length;
    for (let d = 0; d < n; d++) {
      const ci = ki * 10 + d, w = this.widx(note + offs[d]), bus = combo && man !== 2 ? BUS_CB[d] : d;
      this.cW[ci] = w; this.cB[ci] = bus; this.cAmp[ci] = this.kAmp[ki];
      this.cT0[ci] = s + spread * (d + 0.6 * (this.rnd() * 0.5 + 0.5)) / 9; this.cStep[ci] = 1 / att;
      if (this.cSt[ci] === 0) this.cG[ci] = 0; else if (this.cSt[ci] === 2) { this.cnt[(man * NB + bus) * NW + w] -= this.cAmp[ci]; }
      this.cSt[ci] = 1; this.addMv(ci);
    }
    if (man === 0 && !combo && P.perc >= 0.5) {
      const ci = ki * 10 + 9, w = this.widx(note + (P.percHarm >= 2.5 ? 19 : 12));
      this.cW[ci] = w; this.cB[ci] = 9; this.cAmp[ci] = this.kAmp[ki]; this.cT0[ci] = s; this.cStep[ci] = 1 / att;
      if (this.cSt[ci] === 0) this.cG[ci] = 0; else if (this.cSt[ci] === 2) this.cnt[(0 * NB + 9) * NW + w] -= this.cAmp[ci];
      this.cSt[ci] = 1; this.addMv(ci);
      if (P.percSingle < 0.5 || upperBefore === 0) this.pTop = 1;
    }
    if (Number.isFinite(dur)) this.insert({ type: 'off', man, note, s: s + Math.round(dur * sr), gen: this.kGen[ki] });
  }
  release(ki, s, fast) {
    this.kDown[ki] = 0; const man = (ki / 128) | 0; this.held[man]--; this.total--;
    const rel = fast ? Math.max(1, 0.003 * this.sr) : this.releaseSamples(), spread = this.P.clickSpread * 0.0035 * this.sr;
    for (let d = 0; d < 10; d++) {
      const ci = ki * 10 + d, st = this.cSt[ci]; if (st === 0 || st === 3) continue;
      if (st === 2) this.cnt[(man * NB + this.cB[ci]) * NW + this.cW[ci]] -= this.cAmp[ci];
      this.cSt[ci] = 3; if (st === 2) this.cG[ci] = 1;
      this.cStep[ci] = 1 / rel; this.cT0[ci] = fast ? s : s + spread * ((8 - Math.min(d, 8)) + 0.6 * (this.rnd() * 0.5 + 0.5)) / 9; this.addMv(ci);
    }
  }
  event(m) {
    if (m.type === 'on') this.noteOn(m.man, m.note, m.vel, m.s, m.dur);
    else if (m.type === 'off') { const ki = m.man * 128 + m.note; if (this.kDown[ki] && (m.gen < 0 || this.kGen[ki] === m.gen)) this.release(ki, m.s, false); }
    else if (m.type === 'rot') this.P.rotSpd = m.v;
  }
  ghosts() {
    const L = this.P.leak; if (L === this.lastLeak) return; this.lastLeak = L; this.cntG.fill(0);
    if (L < 0.005) return;
    let s = 12345;
    for (let g = 0; g < 14; g++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const w = s % NW, wt = 0.4 + 0.6 * ((s >> 8) % 100) / 100; for (let m = 0; m < 3; m++) for (let b = 0; b < 9; b++) this.cntG[(m * NB + b) * NW + w] += L * 0.0012 * wt; }
  }
  gen(b, e) {
    const n = e - b, Wb = this.Wb;
    if (this.P.model < 0.5) {
      const wx = this.wx, wy = this.wy, wc = this.wc, ws = this.ws;
      for (let w = 0; w < NW; w++) {
        let x = wx[w], y = wy[w]; const c = wc[w], s = ws[w], h2 = 2 * this.wh2[w], h3 = this.wh3[w], o = w * CH + b;
        for (let j = 0; j < n; j++) { const nx = x * c - y * s; y = x * s + y * c; x = nx; Wb[o + j] = y + h2 * x * y + h3 * y * (3 - 4 * y * y); }
        wx[w] = x; wy[w] = y;
      }
    } else {
      const wph = this.wph, winc = this.winc, rd2 = this.S.reed;
      for (let w = 0; w < NW; w++) {
        let ph = wph[w]; const dt = winc[w], o = w * CH + b;
        for (let j = 0; j < n; j++) {
          ph += dt; if (ph >= 1) ph -= 1;
          let sq = (ph < 0.5 ? 1 : -1) + blep(ph, dt) - blep(ph < 0.5 ? ph + 0.5 : ph - 0.5, dt);
          let pl = (ph < 0.25 ? 1 : -1) + blep(ph, dt) - blep(ph < 0.25 ? ph + 0.75 : ph - 0.25, dt) + 0.5;
          Wb[o + j] = 0.7 * (sq + rd2 * (pl * 0.9 - sq));
        }
        wph[w] = ph;
      }
    }
    // overspraak tussen naburige generatoren
    const k = this.P.leak * 0.01;
    if (k > 0.0002) {
      for (let j = b; j < e; j++) { let p = 0, c = Wb[j]; for (let w = 0; w < NW; w++) { const nx = w < NW - 1 ? Wb[(w + 1) * CH + j] : 0; Wb[w * CH + j] = c + k * (p + nx); p = c; c = nx; } }
    }
  }
  chunk(b, e) {
    const n = e - b, P = this.P, Wb = this.Wb, combo = P.model >= 0.5, nA = this.nAbs;
    this.gen(b, e);
    const kk = 1 - Math.exp(-n / (this.sr * 0.006)), Lc = this.Lc, Lt = this.Lt, Ln = this.Ln;
    // enveloppe van de percussie
    const pe = this.pEnv, sr = this.sr, dec = P.percFast >= 0.5 ? Math.exp(-1 / (sr * 0.065)) : Math.exp(-1 / (sr * 0.25)), rise = 1 - Math.exp(-1 / (sr * 0.0012));
    let pt = this.pTop, po = this.pOut;
    for (let j = b; j < e; j++) { po += (pt - po) * rise; pt *= dec; pe[j] = po; }
    this.pTop = pt < 1e-6 ? 0 : pt; this.pOut = po < 1e-9 ? 0 : po;
    for (let i = 0; i < 3 * NB; i++) { Ln[i] = Lc[i] + (Lt[i] - Lc[i]) * kk; }
    for (let m = 0; m < 3; m++) {
      const B = this.bus[m]; B.fill(0, 0, NB * CH);
      for (let bu = 0; bu < NB; bu++) {
        if (!(Lt[m * NB + bu] > 1e-6 || Lc[m * NB + bu] > 1e-6)) continue;
        const base = (m * NB + bu) * NW, o = bu * CH;
        for (let w = 0; w < NW; w++) {
          const a = this.cnt[base + w] + this.cntG[base + w]; if (a < 1e-7 && a > -1e-7) continue;
          const wo = w * CH + b; for (let j = 0; j < n; j++) B[o + b + j] += a * Wb[wo + j];
        }
      }
    }
    // bewegende contacten (aanzetten en loslaten)
    const mv = this.mv; let k = 0;
    for (let q = 0; q < this.mvN; q++) {
      const ci = mv[q], man = (ci / 1280) | 0, bu = this.cB[ci], B = this.bus[man], wo = this.cW[ci] * CH + b, o = bu * CH + b, amp = this.cAmp[ci], step = this.cStep[ci], t0 = this.cT0[ci];
      let g = this.cG[ci], st = this.cSt[ci], j = 0;
      if (t0 > nA + b) j = Math.min(n, Math.ceil(t0 - nA - b));
      if (st === 3 && j > 0) for (let i = 0; i < j; i++) B[o + i] += g * amp * Wb[wo + i];
      for (; j < n; j++) {
        if (st === 1) { g += step; if (g >= 1) { g = 1; st = 2; } } else if (st === 3) { g -= step; if (g <= 0) { g = 0; st = 0; } }
        if (g > 0) B[o + j] += g * amp * Wb[wo + j];
      }
      this.cG[ci] = g;
      if (st === 2) this.cnt[(man * NB + bu) * NW + this.cW[ci]] += amp;
      this.cSt[ci] = st;
      if (st === 1 || st === 3) mv[k++] = ci; else this.inMv[ci] = 0;
    }
    this.mvN = k;
    // trekkerniveaus en optellen
    for (let m = 0; m < 3; m++) {
      const out = this.mOut[m], B = this.bus[m];
      for (let j = b; j < e; j++) out[j] = 0;
      for (let bu = 0; bu < NB; bu++) {
        const i = m * NB + bu, l0 = Lc[i], l1 = Ln[i]; if (l0 < 1e-6 && l1 < 1e-6) continue;
        const o = bu * CH, d = (l1 - l0) / n;
        if (bu === 9) { for (let j = 0; j < n; j++) out[b + j] += (l0 + d * j) * pe[b + j] * B[o + b + j]; }
        else for (let j = 0; j < n; j++) out[b + j] += (l0 + d * j) * B[o + b + j];
      }
    }
    for (let i = 0; i < 3 * NB; i++) Lc[i] = Ln[i];
  }
  targets() {
    const P = this.P, L = this.Lt, combo = P.model >= 0.5, pm = P.perc >= 0.5 && !combo;
    for (let m = 0; m < 2; m++) {
      const pre = m === 0 ? 'up' : 'lo';
      for (let b = 0; b < 9; b++) {
        let v;
        if (combo) v = b <= 5 ? (P[['cf16', 'cf8', 'cf4', 'cf223', 'cf2', 'cfmix'][b]] >= 0.5 ? 1 : 0) : 0; else v = dbLevel(P[pre + b]);
        if (m === 0 && b === 8 && pm) v = 0;
        L[m * NB + b] = v * 0.11;
      }
      L[m * NB + 9] = m === 0 && pm ? (P.percSoft >= 0.5 ? 0.45 : 1) * 0.14 : 0;
    }
    for (let b = 0; b < 9; b++) L[2 * NB + b] = b < 2 ? dbLevel(P['pd' + b]) * 0.11 : 0;
    L[2 * NB + 9] = 0;
  }
  vibrato(len) {
    const P = this.P, sr = this.sr, mode = Math.round(P.vib), ms = VIB_MS[mode] * this.S.vibAmt, chorus = mode >= 3 ? 0.5 : 0, rate = this.S.vibRate / sr;
    const tgt = [P.vibUp >= 0.5 ? 1 : 0, P.vibLo >= 0.5 ? 1 : 0], ka = 1 - Math.exp(-1 / (sr * 0.02));
    const A = ms * 0.001 * sr, D0 = 0.0006 * sr + 3;
    let ph = this.vph, w = this.vw;
    for (let j = 0; j < len; j++) {
      ph += rate; if (ph >= 1) ph -= 1;
      const tri = 1 - 4 * Math.abs(ph - 0.5), lfo = tri * (1.5 - 0.5 * tri * tri), dly = D0 + A * lfo;
      for (let m = 0; m < 2; m++) {
        const x = this.mOut[m][j], buf = this.vbuf[m]; buf[w & 1023] = x;
        this.vmix[m] += (tgt[m] - this.vmix[m]) * ka;
        const v = this.vmix[m]; if (v < 1e-4) { this.mOut[m][j] = x; continue; }
        const wet = rd(buf, 1023, w, dly), mixed = chorus > 0 ? x * (1 - chorus) + wet * chorus : wet;
        this.mOut[m][j] = x + (mixed - x) * v;
      }
      w++;
    }
    this.vph = ph; this.vw = w & 0xfffff;
  }
  render(L, R, len, t0) {
    if (len > CH) len = CH;
    const sr = this.sr, P = this.P; this.nAbs = Math.round(t0 * sr);
    const S = this.S, ks = 1 - Math.exp(-len / (sr * 0.03));
    for (const k of SMK) { if (!(k in S)) S[k] = P[k]; S[k] += (P[k] - S[k]) * ks; }
    if (P.model !== this.lastModel) { this.lastModel = P.model; this.stopAll(); this.mfade = 0; }
    this.ghosts(); this.targets();
    let b = 0;
    while (b < len) {
      const sb = this.nAbs + b;
      while (this.q.length && this.q[0].s <= sb) this.event(this.q.shift());
      let e = len;
      if (this.q.length) e = clampN(this.q[0].s - this.nAbs, b + 1, len);
      this.chunk(b, e); b = e;
    }
    this.vibrato(len);
    // optellen, akkoordcompensatie, voorversterker
    const tot = Math.max(0, this.total - 1), gct = Math.pow(1 + 0.8 * tot, -0.45), gk = 1 - Math.exp(-len / (sr * (gct < this.gc ? 0.04 : 0.15)));
    const PRE = 0.5, dr = S.drive, dg = (1 + dr * dr * 18 + dr * 2) * PRE, dcomp = Math.pow(10, driveComp(dr) / 20) / PRE / (1 + dr * 1.8 + dr * dr * 2.2), bias = 0.12 * (0.3 + dr), tb = Math.tanh(bias);
    const mfk = 1 - Math.exp(-len / (sr * 0.03));
    // toon
    if (Math.abs(this.lastTone[0] - S.bass) > 0.002) { this.lastTone[0] = S.bass; shelf(this.tb, false, 180, S.bass * 10, sr); }
    if (Math.abs(this.lastTone[1] - S.treble) > 0.002) { this.lastTone[1] = S.treble; shelf(this.tt, true, 3200, S.treble * 10, sr); }
    const wetG = S.reverb * 0.5, level = 3.2 * S.vol * S.vol, rotT = P.rotOn >= 0.5 ? 1 : 0;
    // rotary: doelsnelheid
    const v = P.rotSpd, hT = v < 0.5 ? ROT.hornSlow * v * 2 : ROT.hornSlow + (ROT.hornFast - ROT.hornSlow) * (v - 0.5) * 2, dT = v < 0.5 ? ROT.drumSlow * v * 2 : ROT.drumSlow + (ROT.drumFast - ROT.drumSlow) * (v - 0.5) * 2;
    const mic = S.rotMic, spread = S.rotSpread * Math.PI * 0.9, bal = S.rotBal, gH = Math.pow(2, -bal * 0.8), gD = Math.pow(2, bal * 0.8);
    const dH = 0.92 - 0.45 * mic, dD = 0.75 - 0.4 * mic, room = 0.05 + 0.45 * mic, phL = -spread / 2, phR = spread / 2;
    const rH = ROT.hornR / 343 * sr, rD = ROT.drumR / 343 * sr, D0H = rH + 6, D0D = rD + 6;
    const ukH = hT > this.wh ? ROT.hornUp : ROT.hornDown, ukD = dT > this.wd ? ROT.drumUp : ROT.drumDown, kH = 1 - Math.exp(-1 / (sr * ukH)), kD = 1 - Math.exp(-1 / (sr * ukD));
    let wh = this.wh, wd = this.wd, th = this.th, td = this.td, rw = this.rw, rn = this.rnoise, rm = this.rmix, hlL = this.hlpL, hlR = this.hlpR;
    for (let j = 0; j < len; j++) {
      this.gc += (gct - this.gc) * gk;
      this.mfade += (1 - this.mfade) * mfk;
      let x = (this.mOut[0][j] + this.mOut[1][j] + this.mOut[2][j]) * this.gc * this.mfade;
      if (!(x > -50 && x < 50)) x = 0;
      // voorversterker: asymmetrische tanh met ADAA
      let y = (this.shp.run(x * dg + bias) - tb) * dcomp;
      const hp = y - this.hp1 + 0.9985 * this.hp2; this.hp1 = y; this.hp2 = hp; y = hp;
      y = biqRun(this.tt, biqRun(this.tb, y));
      // veerhall
      const wl = this.springRun(this.rvL, y * 0.5), wr = this.springRun(this.rvR, y * 0.5);
      let lOut, rOut;
      // rotary
      rm += (rotT - rm) * 0.0006;
      const xm = y + (wl + wr) * 0.5 * wetG * 2;
      if (rm > 0.001 || rotT) {
        const hi = biqRun(this.hpf[1], biqRun(this.hpf[0], xm)), lo = biqRun(this.lp[1], biqRun(this.lp[0], xm));
        const oh = wh, od = wd;
        wh += (hT - wh) * kH; wd += (dT - wd) * kD; if (wh < 0.002 && hT === 0) wh = 0; if (wd < 0.002 && dT === 0) wd = 0;
        th += TWO_PI * wh / sr; td += TWO_PI * wd / sr; if (th > TWO_PI) th -= TWO_PI; if (td > TWO_PI) td -= TWO_PI;
        const acc = (Math.abs(wh - oh) + Math.abs(wd - od)) * sr; rn += (Math.min(1, acc / 5) - rn) * 0.0004;
        this.hbuf[rw & 2047] = hi; this.dbuf[rw & 2047] = lo;
        const cHl = Math.cos(th - phL), cHr = Math.cos(th - phR), cDl = Math.cos(td - phL), cDr = Math.cos(td - phR);
        let hL = rd(this.hbuf, 2047, rw, D0H - rH * cHl), hR = rd(this.hbuf, 2047, rw, D0H - rH * cHr), dL = rd(this.dbuf, 2047, rw, D0D - rD * cDl), dR = rd(this.dbuf, 2047, rw, D0D - rD * cDr);
        const fL = (1 + cHl) / 2, fR = (1 + cHr) / 2;
        hlL += (0.18 + 0.82 * fL * fL) * (hL - hlL); hlR += (0.18 + 0.82 * fR * fR) * (hR - hlR);
        hL = hlL * (1 - dH * (1 - fL)); hR = hlR * (1 - dH * (1 - fR));
        dL *= 1 - dD * (1 - (1 + cDl) / 2); dR *= 1 - dD * (1 - (1 + cDr) / 2);
        const nz = (this.rnd()) * 0.03 * rn; this.rlp += 0.12 * (nz - this.rlp);
        const roL = (hL * gH + dL * gD) * 1.5 + room * xm * 0.5 + this.rlp * 4, roR = (hR * gH + dR * gD) * 1.5 + room * xm * 0.5 + this.rlp * 4;
        lOut = roL * rm + (y + wl * wetG * 2) * (1 - rm); rOut = roR * rm + (y + wr * wetG * 2) * (1 - rm);
        rw++;
      } else { lOut = y + wl * wetG * 2; rOut = y + wr * wetG * 2; wh += (hT - wh) * kH; wd += (dT - wd) * kD; }
      // volume en begrenzer
      lOut *= level; rOut *= level;
      let a = lOut < 0 ? -lOut : lOut; if (a > 0.7) a = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3); lOut = lOut < 0 ? -a : a;
      a = rOut < 0 ? -rOut : rOut; if (a > 0.7) a = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3); rOut = rOut < 0 ? -a : a;
      L[j] = lOut === lOut ? lOut : 0; if (R) R[j] = rOut === rOut ? rOut : 0;
    }
    this.wh = wh; this.wd = wd; this.th = th; this.td = td; this.rw = rw & 0xfffff; this.rnoise = rn; this.rmix = rm; this.hlpL = hlL; this.hlpR = hlR;
    this.guard();
    for (let w = 0; w < NW; w++) { const r = 1.5 - 0.5 * (this.wx[w] * this.wx[w] + this.wy[w] * this.wy[w]); this.wx[w] *= r; this.wy[w] *= r; }
  }
  guard() {
    const bad = v => !(v > -1e6 && v < 1e6);
    if (bad(this.hp1) || bad(this.hp2) || !this.shp.ok() || bad(this.gc) || bad(this.mfade)) { this.hp1 = 0; this.hp2 = 0; this.shp.reset(); if (bad(this.gc)) this.gc = 1; if (bad(this.mfade)) this.mfade = 1; }
    for (const f of [this.tb, this.tt, ...this.lp, ...this.hpf]) if (bad(f.z1) || bad(f.z2)) { f.z1 = 0; f.z2 = 0; }
    for (const s of [this.rvL, this.rvR]) { if (bad(s.lpz)) { s.lpz = 0; s.buf.fill(0); s.x1.fill(0); s.y1.fill(0); } }
    if (bad(this.wh) || bad(this.wd) || bad(this.th) || bad(this.td)) { this.wh = 0; this.wd = 0; this.th = 0.3; this.td = 1.1; this.hbuf.fill(0); this.dbuf.fill(0); }
    if (bad(this.hlpL) || bad(this.hlpR) || bad(this.rlp) || bad(this.rnoise)) { this.hlpL = 0; this.hlpR = 0; this.rlp = 0; this.rnoise = 0; }
    for (let m = 0; m < 2; m++) { const vb = this.vbuf[m]; let ok = true; for (let i = 0; i < 1024; i += 64) if (bad(vb[i])) ok = false; if (!ok) vb.fill(0); }
    for (let w = 0; w < NW; w++) if (bad(this.wx[w]) || bad(this.wy[w])) { this.wx[w] = 1; this.wy[w] = 0; }
  }
}
class DrawbarProcessor extends AudioWorkletProcessor {
  constructor() { super(); this.e = new OrganEngine(sampleRate); this.n = 0; this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} }; }
  process(inputs, outputs) {
    const o = outputs[0]; if (!o || !o[0]) return true;
    try {
      this.e.render(o[0], o[1], o[0].length, currentTime);
      if (this.e.ui && ++this.n >= 14) { this.n = 0; this.port.postMessage({ rot: [this.e.wh, this.e.wd, this.e.th, this.e.td] }); }
    } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); }
    return true;
  }
}
registerProcessor('${WNAME}', DrawbarProcessor);
`;
export default {
  id: 'nl.patchkamer.drawbarorgan', name: 'Drawbar Organ', version: '1.0.0', kind: 'instrument', category: 'synth',
  ui: { width: 880, minWidth: 360 },
  about: {
    nl: 'Orgel met trekkers, geïnspireerd op klassieke tonewheel-orgels: een gedeelde bank van generatoren, twee manualen met negen trekkers en basvoeten met twee, toetscontact met aanzetklik, percussie, vibrato en chorus, een rotary-luidspreker met hoorn en trommel, voorversterker en veerhall. Het tweede klankmodel Combo is een compacte divide-down orgelklank met voetschakelaars.\n\nVerbind een keyboard of sequencer met Noten. Met een splitpunt speel je met één keyboard bas, akkoorden en lead; kies anders MIDI-kanaal 1 (Upper), 2 (Lower) of 3 (basvoeten). De rotary schakel je met de knoppen, met een paarse Mod-kabel op Snelheid, met cc rotary of met een toets (Toets voor rotary).\n\nDe trekkers staan in de echte stappen 0 tot 8 (3 dB per stap). Een orgel heeft geen velocity-dynamiek: Aanslag is een zachte optie.',
    en: 'A drawbar organ inspired by classic tonewheel organs: a shared bank of generators, two manuals with nine drawbars and bass pedals with two, key contact with key click, percussion, vibrato and chorus, a rotary speaker with horn and drum, preamp and spring reverb. The second sound model, Combo, is a compact divide-down organ sound with footage switches.\n\nConnect a keyboard or sequencer to Notes. With a split point you play bass, chords and lead from one keyboard; otherwise pick MIDI channel 1 (Upper), 2 (Lower) or 3 (bass pedals). Switch the rotary with the buttons, with a purple Mod cable on Speed, with cc rotary or with a key (Rotary toggle key).\n\nThe drawbars use the real steps 0 to 8 (3 dB per step). An organ has no velocity dynamics: Touch is a soft option.',
  },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo organ' }], eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo orgel', notes: 'Keyboard / noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const defaults = {};
    for (const [id, d] of Object.entries(SPEC)) defaults[id] = d[4];
    for (const [k, v] of Object.entries(SEL_DEF)) defaults[k] = v;
    Object.assign(defaults, BOOLS);
    for (const [k, d] of Object.entries(INTS)) defaults[k] = d[2];
    let state = { ...defaults }, effective = { ...defaults }, mod = {}, dead = false, node = null, warn = null, root = null, stopFrame = null;
    const ui = { knobs: {}, bars: {}, sels: {}, btns: {}, rot: null };
    const pending = [], out = ctx.createGain(); out.gain.value = 1;
    const rotor = { h: 0, d: 0, th: 0.3, td: 1.1, t: 0 };
    const resolve = () => {
      const r = { ...state };
      for (const [id, d] of Object.entries(SPEC)) { const o = mod[id] || 0; r[id] = clamp(state[id] + o * (d[2] - d[1]), d[1], d[2]); }
      return r;
    };
    function apply() {
      if (dead) return; effective = resolve();
      const p = {};
      for (const id of Object.keys(SPEC)) p[id] = effective[id];
      p.model = SELECTS.model.indexOf(state.model); p.vib = SELECTS.vib.indexOf(state.vib); p.percHarm = state.percHarm === '3' ? 3 : 2;
      for (const k of Object.keys(BOOLS)) p[k] = state[k] ? 1 : 0;
      if (node) node.port.postMessage({ type: 'params', p });
      else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); }
    }
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 256) pending.push(m); };
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.port.onmessage = e => { const d = e && e.data; if (d && Array.isArray(d.rot)) { rotor.h = +d.rot[0] || 0; rotor.d = +d.rot[1] || 0; rotor.th = +d.rot[2] || 0; rotor.td = +d.rot[3] || 0; rotor.t = ctx.currentTime; } };
      node.connect(out); node.port.postMessage({ type: 'os', n: host.audio && host.audio.oversample === '4x' ? 4 : host.audio && host.audio.oversample === 'none' ? 1 : 2 }); apply();
      pending.splice(0).forEach(m => { if (m.type === 'params') return; if (m.type === 'on' || m.type === 'off' || m.type === 'rot') { if (m.t > ctx.currentTime - 0.05) node.port.postMessage(m); } });
      if (root) node.port.postMessage({ type: 'ui', on: true });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Drawbar Organ kan hier geen geluid maken.'); });

    // ---- noten en verdeling over de manualen ----
    const manualFor = (note, ch) => {
      if (state.route === 'channel') { const c = Number.isFinite(ch) ? ch : 1; return c === 2 ? 1 : c === 3 ? 2 : 0; }
      if (state.bassSplit > 0 && note < state.bassSplit) return 2;
      if (state.split > 0 && note < state.split) return 1;
      return 0;
    };
    function noteOn(note, vel, t, dur, ch) {
      if (state.rotKey >= 0 && note === state.rotKey) { setRot(state.rotSpd >= 0.75 ? 0.5 : 1, t); return; }
      post({ type: 'on', m: manualFor(note, ch), note, vel, t, dur: Number.isFinite(dur) ? dur : -1 });
    }
    function noteOff(note, t, ch) { if (state.rotKey >= 0 && note === state.rotKey) return; post({ type: 'off', m: manualFor(note, ch), note, t }); }
    function setRot(v, t) { state.rotSpd = clamp(v, 0, 1); if (Number.isFinite(t) && t > ctx.currentTime + 0.002) { post({ type: 'rot', v: state.rotSpd, t }); paint(); return; } apply(); paint(); }
    function panic() { pending.length = 0; apply(); if (node) node.port.postMessage({ type: 'stop' }); }

    // ---- UI ----
    const CSS = `
:host{display:block}
.dbo{container-type:inline-size;display:grid;gap:10px;min-width:0;color:var(--fg,#dce1e8);font:11px/1.4 var(--mono,ui-monospace,Menlo,monospace);
  --ln:var(--line,#2a3039);--c2:var(--card-2,#1e232c);--mu:var(--muted,#7d8794);--ev:var(--event,#f4a261);--au:var(--audio,#4fd1c5);--md:var(--sel,#9b8cff)}
button,select{font:500 11px/1 var(--disp,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;background:var(--c2);color:inherit;border:1px solid var(--ln);border-radius:3px;padding:6px 8px;cursor:pointer;min-width:0}
select{text-transform:none;letter-spacing:0;background:var(--field,var(--c2));color:var(--field-fg,inherit)}
button:hover{border-color:var(--au)}
button:focus-visible,input:focus-visible,select:focus-visible{outline:1px solid var(--au);outline-offset:2px}
button[aria-pressed="true"]{background:var(--ev);border-color:var(--ev);color:#160e05}
.top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.seg{display:inline-flex}.seg button{border-radius:0}.seg button+button{border-left:0}.seg button:first-child{border-radius:3px 0 0 3px}.seg button:last-child{border-radius:0 3px 3px 0}
.lab{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}
.sp{flex:1}
.manuals{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:flex-start}
.mg{display:grid;gap:4px;justify-items:start}
.mg h4,.sec h4{margin:0;font:600 10px/1.2 var(--disp,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.mg .reg{font:11px var(--mono,monospace);color:var(--au);letter-spacing:.12em}
.bars{display:flex;gap:4px;padding:6px 8px 4px;background:var(--well,#0f1216);border:1px solid var(--ln);border-radius:4px}
.bar{display:grid;justify-items:center;gap:2px;width:34px}
.bar .ft{font:600 10px var(--disp,system-ui,sans-serif);color:var(--fg);white-space:nowrap}
.bar output{font:11px var(--mono,monospace);color:var(--mu)}
.bar input{writing-mode:vertical-lr;direction:ltr;appearance:none;-webkit-appearance:none;width:28px;height:132px;margin:0;padding:0;background:transparent;cursor:ns-resize}
.bar input::-webkit-slider-runnable-track{width:6px;height:100%;background:linear-gradient(90deg,#0006,#fff3 50%,#0006);border-radius:3px}
.bar input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:13px;margin-left:-10px;border-radius:2px;background:var(--cap);border:1px solid #000a;box-shadow:inset 0 1px 0 #fff5,0 1px 2px #0008}
.bar input::-moz-range-track{width:6px;height:100%;background:#fff2;border-radius:3px}
.bar input::-moz-range-thumb{width:24px;height:11px;border-radius:2px;background:var(--cap);border:1px solid #000a}
.bar[data-col=brown]{--cap:#7a4a28}.bar[data-col=white]{--cap:#ece8de}.bar[data-col=black]{--cap:#25272b}
.bar[data-col=black] input::-webkit-slider-thumb{border-color:#8a8d94}
.sections{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px}
.sec{display:grid;gap:6px;align-content:start;padding:8px;border:1px solid var(--ln);border-radius:6px;min-width:0}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.sec .k{min-width:0}
.sec .row button{padding:6px 7px;letter-spacing:.04em}
.stat{font-size:10px;color:var(--mu)}
canvas.rotor{width:120px;height:40px}
.warn{margin:0;font-size:10px;color:var(--mu)}
[hidden]{display:none!important}
.dim{opacity:.4;pointer-events:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;
    const mk = (tag, cls, parent, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; if (parent) parent.appendChild(e); return e; };
    const adopt = (el, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    const pressed = (b, on) => { if (b) b.setAttribute('aria-pressed', String(!!on)); };
    const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const noteName = m => NOTE[m % 12] + (Math.floor(m / 12) - 1);
    const fmtOf = (id, v) => {
      const d = SPEC[id], u = d[5];
      if (u === '%') return Math.round(v * 100) + '%';
      if (u === 'Hz') return v.toFixed(2) + ' Hz';
      if (u === 'tone') return (v > 0 ? '+' : '') + (v * 10).toFixed(1) + ' dB';
      if (u === 'spd') return v < 0.04 ? tx('Stop') : v < 0.46 ? tx('Langzaam') + ' ' + (v * 2 * 100).toFixed(0) + '%' : v < 0.54 ? tx('Langzaam') : v > 0.96 ? tx('Snel') : Math.round(v * 100) + '%';
      if (u === 'bal') return v < -0.02 ? tx('Hoorn') + ' ' + Math.round(-v * 100) : v > 0.02 ? tx('Trommel') + ' ' + Math.round(v * 100) : '0';
      return String(v);
    };
    const regString = (pre, n) => { const a = []; for (let i = 0; i < n; i++) a.push(String(Math.round(state[pre + i]))); return n === 9 ? a.slice(0, 2).join('') + ' ' + a.slice(2, 6).join('') + ' ' + a.slice(6).join('') : a.join(' '); };
    function paintReg() { for (const g of ['up', 'lo', 'pd']) if (ui.reg && ui.reg[g]) ui.reg[g].textContent = regString(g, g === 'pd' ? 2 : 9); }
    function paint() {
      for (const id in ui.knobs) { if (SPEC[id]) ui.knobs[id].set(state[id]); else ui.knobs[id].set(state[id]); }
      for (const id in ui.bars) { const b = ui.bars[id]; b.input.value = state[id]; b.out.textContent = String(Math.round(state[id])); }
      for (const k in ui.sels) ui.sels[k].value = state[k];
      for (const k in ui.btns) pressed(ui.btns[k], !!state[k]);
      const sp = state.rotSpd;
      if (ui.rotBtn) { pressed(ui.rotBtn.byp, !state.rotOn); pressed(ui.rotBtn.stop, state.rotOn && sp < 0.25); pressed(ui.rotBtn.slow, state.rotOn && sp >= 0.25 && sp < 0.75); pressed(ui.rotBtn.fast, state.rotOn && sp >= 0.75); }
      if (ui.modelBtn) for (const k of SELECTS.model) pressed(ui.modelBtn[k], state.model === k);
      if (ui.tw) ui.tw.forEach(e => { e.hidden = state.model !== 'tonewheel'; }); if (ui.cb) ui.cb.forEach(e => { e.hidden = state.model !== 'combo'; });
      if (ui.percBox) ui.percBox.classList.toggle('dim', state.model !== 'tonewheel');
      paintReg();
    }
    function setNum(id, v) { const d = SPEC[id]; if (!d) return; state[id] = Number(clamp(Math.round(v / d[3]) * d[3], d[1], d[2]).toFixed(6)); apply(); paintReg(); }
    function bar(parent, id, foot, col, grp, label) {
      const c = mk('div', 'bar', parent); c.dataset.col = col;
      mk('span', 'ft', c, foot);
      const inp = mk('input', '', c); inp.type = 'range'; inp.min = 0; inp.max = 8; inp.step = 1; inp.value = state[id]; inp.dataset.pkDefault = String(defaults[id]); inp.setAttribute('aria-label', label);
      const o = mk('output', '', c, String(state[id]));
      inp.addEventListener('pointerdown', e => e.stopPropagation());
      inp.addEventListener('input', () => { setNum(id, +inp.value); o.textContent = String(Math.round(state[id])); });
      adopt(inp, id, 'param', grp, label);
      ui.bars[id] = { input: inp, out: o };
    }
    function knob(parent, id, label, group, fmt) {
      const d = SPEC[id];
      ui.knobs[id] = host.ui.knob(parent, label, [d[1], d[2], d[3]], state[id], fmt || (v => fmtOf(id, v)), v => { state[id] = Number(clamp(v, d[1], d[2]).toFixed(6)); apply(); }, { default: d[4], id, role: 'param', group });
    }
    function intKnob(parent, id, label, group, fmt) {
      const d = INTS[id];
      ui.knobs[id] = host.ui.knob(parent, label, [d[0], d[1], 1], state[id], fmt, v => { state[id] = Math.round(clamp(v, d[0], d[1])); apply(); }, { default: d[2], id, role: 'param', group });
    }
    function select(parent, id, label, group, opts) {
      const s = host.ui.select(parent, label, opts, state[id], v => { if (SELECTS[id].includes(v)) { state[id] = v; apply(); paint(); } }, { id, group });
      ui.sels[id] = s; return s;
    }
    function toggle(parent, id, label, group) {
      const b = mk('button', '', parent, label); b.type = 'button'; b.onclick = () => { state[id] = !state[id]; apply(); paint(); }; adopt(b, id, 'toggle', group, label); ui.btns[id] = b; return b;
    }
    function drawRotor(cv) {
      const c = cv.getContext && cv.getContext('2d'); if (!c) return;
      const w = cv.width, h = cv.height, dt = Math.min(0.2, Math.max(0, ctx.currentTime - rotor.t)); c.clearRect(0, 0, w, h);
      const st = getComputedStyle(cv), col = st.color || '#999';
      [[w * 0.27, rotor.th + rotor.h * 2 * Math.PI * dt, rotor.h, 'H'], [w * 0.73, rotor.td + rotor.d * 2 * Math.PI * dt, rotor.d, 'D']].forEach(([cx, ang, f]) => {
        c.strokeStyle = col; c.globalAlpha = 0.5; c.lineWidth = 1; c.beginPath(); c.arc(cx, h / 2, h * 0.42, 0, 7); c.stroke(); c.globalAlpha = 1;
        c.fillStyle = col; c.beginPath(); c.arc(cx + Math.cos(ang) * h * 0.34, h / 2 + Math.sin(ang) * h * 0.34, 3, 0, 7); c.fill();
      });
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount();
        const wrap = document.createElement('div'); el.appendChild(wrap);
        root = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;
        const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
        const app = mk('div', 'dbo', root);
        ui.tw = []; ui.cb = []; ui.reg = {}; ui.knobs = {}; ui.bars = {}; ui.sels = {}; ui.btns = {};
        // bovenste rij
        const top = mk('div', 'top', app);
        mk('span', 'lab', top, tx('Klankmodel'));
        const seg = mk('div', 'seg', top); ui.modelBtn = {};
        SELECTS.model.forEach(k => { const b = mk('button', '', seg, tx(k === 'tonewheel' ? 'Tonewheel' : 'Combo')); b.type = 'button'; b.onclick = () => { state.model = k; apply(); paint(); }; adopt(b, 'model.' + k, 'button', 'model', b.textContent); ui.modelBtn[k] = b; });
        mk('span', 'sp', top);
        const bt = mk('button', '', top, tx('Proefakkoord')); bt.type = 'button';
        bt.onclick = () => { const t = ctx.currentTime + 0.02; [48, 55, 60, 64, 67].forEach(n => noteOn(n, 0.8, t, 1.6, 1)); };
        const ba = mk('button', '', top, tx('Alles uit')); ba.type = 'button'; ba.onclick = () => panic();
        // trekkers
        const manuals = mk('div', 'manuals', app);
        const group = (title, pre, n, grp, hideInCombo) => {
          const g = mk('div', 'mg', manuals); mk('h4', '', g, title);
          const bars = mk('div', 'bars', g);
          for (let i = 0; i < n; i++) bar(bars, pre + i, pre === 'pd' ? FOOT[i === 0 ? 0 : 2] : FOOT[i], pre === 'pd' ? 'brown' : FOOT_COL[i], grp, tx(title) + ' ' + FOOT[pre === 'pd' ? (i === 0 ? 0 : 2) : i]);
          ui.reg[pre] = mk('div', 'reg', g, ''); if (hideInCombo) ui.tw.push(g);
          return g;
        };
        group(tx('Upper'), 'up', 9, 'upper', true); group(tx('Lower'), 'lo', 9, 'lower', true); group(tx('Basvoeten'), 'pd', 2, 'pedal', false);
        // combo: voetschakelaars
        const cg = mk('div', 'mg', manuals); ui.cb.push(cg); mk('h4', '', cg, tx('Combo-voetschakelaars'));
        const crow = mk('div', 'row', cg);
        [['cf16', '16′'], ['cf8', '8′'], ['cf4', '4′'], ['cf223', '2⅔′'], ['cf2', '2′'], ['cfmix', tx('IV mixtuur')]].forEach(([id, lab]) => toggle(crow, id, lab, 'combo'));
        knob(cg, 'reed', tx('Riet'), 'combo');
        // secties
        const secs = mk('div', 'sections', app);
        const sec = (title) => { const s = mk('div', 'sec', secs); mk('h4', '', s, title); return s; };
        // percussie
        const ps = sec(tx('Percussie')); ui.percBox = ps;
        const pr1 = mk('div', 'row', ps); toggle(pr1, 'perc', tx('Aan'), 'percussion');
        select(ps, 'percHarm', tx('Percussie-harmonische'), 'percussion', [['2', tx('2e harmonische')], ['3', tx('3e harmonische')]]);
        const pr2 = mk('div', 'row', ps); toggle(pr2, 'percFast', tx('Snel'), 'percussion'); toggle(pr2, 'percSoft', tx('Zacht'), 'percussion'); toggle(pr2, 'percSingle', tx('Enkele trigger'), 'percussion');
        // vibrato
        const vs = sec(tx('Vibrato en chorus'));
        select(vs, 'vib', tx('Soort'), 'vibrato', SELECTS.vib.map(k => [k, k.toUpperCase()]));
        const vr = mk('div', 'row', vs); toggle(vr, 'vibUp', tx('Vibrato Upper'), 'vibrato'); toggle(vr, 'vibLo', tx('Vibrato Lower'), 'vibrato');
        knob(vs, 'vibRate', tx('Scannersnelheid'), 'vibrato'); knob(vs, 'vibAmt', tx('Diepte'), 'vibrato');
        // rotary
        const rs = sec(tx('Rotary'));
        const rr = mk('div', 'row', rs); ui.rotBtn = {};
        [['byp', 'Bypass', () => { state.rotOn = !state.rotOn; apply(); paint(); }], ['stop', 'Stop', () => { state.rotOn = true; setRot(0); }], ['slow', 'Langzaam', () => { state.rotOn = true; setRot(0.5); }], ['fast', 'Snel', () => { state.rotOn = true; setRot(1); }]]
          .forEach(([k, l, fn]) => { const b = mk('button', '', rr, tx(l)); b.type = 'button'; b.onclick = fn; adopt(b, 'rot.' + k, 'button', 'rotary', b.textContent); ui.rotBtn[k] = b; });
        knob(rs, 'rotSpd', tx('Snelheid'), 'rotary'); knob(rs, 'rotMic', tx('Micafstand'), 'rotary'); knob(rs, 'rotSpread', tx('Stereo-spreiding'), 'rotary'); knob(rs, 'rotBal', tx('Hoorn / trommel'), 'rotary');
        ui.rotCv = mk('canvas', 'rotor', rs); ui.rotCv.width = 240; ui.rotCv.height = 80; ui.rotStat = mk('div', 'stat', rs, '');
        // toetscontact
        const ks = sec(tx('Toetscontact'));
        ['click', 'clickSpread', 'relClick', 'leak', 'touch'].forEach(id => knob(ks, id, tx(SPEC[id][0]), 'contact'));
        // versterker
        const as = sec(tx('Versterker'));
        ['drive', 'bass', 'treble', 'reverb', 'vol'].forEach(id => knob(as, id, tx(SPEC[id][0]), 'amp'));
        // klavier
        const kb = sec(tx('Klavier'));
        select(kb, 'route', tx('Verdeling'), 'keyboard', [['split', tx('Splitpunt en basvoeten')], ['channel', tx('MIDI-kanaal')]]);
        intKnob(kb, 'bassSplit', tx('Basvoeten tot'), 'keyboard', v => v < 1 ? tx('Uit') : noteName(Math.round(v)));
        intKnob(kb, 'split', tx('Splitpunt (Upper vanaf)'), 'keyboard', v => v < 1 ? tx('Uit (alles Upper)') : noteName(Math.round(v)));
        intKnob(kb, 'rotKey', tx('Toets voor rotary'), 'keyboard', v => v < 0 ? tx('Uit') : noteName(Math.round(v)));
        mk('div', 'stat', kb, tx('Kanaal 1 Upper, 2 Lower, 3 basvoeten'));
        warn = mk('p', 'warn', app, node ? '' : tx('AudioWorklet laden…'));
        paint();
        if (node) node.port.postMessage({ type: 'ui', on: true });
        if (typeof host.frame === 'function') stopFrame = host.frame(self, () => { if (ui.rotCv) drawRotor(ui.rotCv); if (ui.rotStat) { const t = tx('Rotor: hoorn {0} Hz, trommel {1} Hz', rotor.h.toFixed(1), rotor.d.toFixed(1)); if (ui.rotStat.textContent !== t) ui.rotStat.textContent = t; } }, 30);
      },
      unmount() {
        if (stopFrame) { stopFrame(); stopFrame = null; }
        if (node) node.port.postMessage({ type: 'ui', on: false });
        if (root && root.host) { const w = root.host; if (w.parentNode) w.parentNode.removeChild(w); } else if (root && root.parentNode) root.innerHTML = '';
        root = null; warn = null; ui.knobs = {}; ui.bars = {}; ui.sels = {}; ui.btns = {}; ui.rotBtn = null; ui.modelBtn = null; ui.rotCv = null; ui.rotStat = null;
      },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'notes' || !ev) return;
          const time = Number.isFinite(ev.time) ? Math.min(ev.time, ctx.currentTime + 30) : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(ev.note)) {
            const n = clamp(Math.round(ev.note), 0, 127), ch = Number.isFinite(ev.ch) ? ev.ch : undefined;
            if (type === 'noteoff' || ev.vel === 0 || ev.off) noteOff(n, t, ch);
            else noteOn(n, Number.isFinite(ev.vel) ? clamp(ev.vel, 0, 1) : 0.8, t, type === 'noteon' || ev.held === true ? undefined : Number.isFinite(ev.dur) ? clamp(ev.dur, 0.005, 3600) : undefined, ch);
          } else if (type === 'cc' && Number.isFinite(ev.value)) {
            const id = String(ev.id || ''), v = clamp(ev.value, 0, 1);
            if (id === 'rotary') { setRot(v < 0.25 ? 0 : v < 0.75 ? 0.5 : 1, t); return; }
            if (id === 'perc') { state.perc = v >= 0.5; apply(); paint(); return; }
            if (id === 'vibrato') { state.vibUp = v >= 0.5; apply(); paint(); return; }
            if (id === 'model') { state.model = v >= 0.5 ? 'combo' : 'tonewheel'; apply(); paint(); return; }
            if (Object.hasOwn(SPEC, id)) { const d = SPEC[id]; setNum(id, d[1] + v * (d[2] - d[1])); paint(); }
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) { /* nooit de planner laten struikelen */ }
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(SPEC).map(([id, d]) => ({ id, name: d[10] === 'upper' ? 'Upper ' + d[0].slice(6) : d[10] === 'lower' ? 'Lower ' + d[0].slice(6) : tx(d[0]), lane: d[10], laneName: ({ upper: 'Upper', lower: 'Lower', pedal: tx('Basvoeten'), amp: tx('Versterker'), contact: tx('Toetscontact'), vibrato: tx('Vibrato en chorus'), rotary: 'Rotary', combo: 'Combo' })[d[10]] || 'Drawbar Organ', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
      modulate(offsets) {
        if (dead) return; const next = {};
        if (offsets && typeof offsets === 'object' && !Array.isArray(offsets)) for (const id of Object.keys(SPEC)) { const v = offsets[id]; if (typeof v === 'number' && Number.isFinite(v)) next[id] = clamp(v, -1, 1); }
        mod = next; apply();
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
        for (const [id, d] of Object.entries(SPEC)) if (typeof s[id] === 'number' && Number.isFinite(s[id])) next[id] = Number(clamp(Math.round(s[id] / d[3]) * d[3], d[1], d[2]).toFixed(6));
        for (const [k, list] of Object.entries(SELECTS)) if (typeof s[k] === 'string' && list.includes(s[k])) next[k] = s[k];
        for (const k of Object.keys(BOOLS)) if (typeof s[k] === 'boolean') next[k] = s[k];
        for (const [k, d] of Object.entries(INTS)) if (typeof s[k] === 'number' && Number.isFinite(s[k])) next[k] = Math.round(clamp(s[k], d[0], d[1]));
        state = next; apply(); paint();
      },
      destroy() {
        if (dead) return; dead = true;
        if (stopFrame) { stopFrame(); stopFrame = null; }
        try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) { /* los */ }
        node = null; pending.length = 0; root = null;
      },
    };
    apply(); return self;
  },
};
