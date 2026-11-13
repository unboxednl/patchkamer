// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Eerste uitgave van Funk Bass (id nl.patchkamer.funkbass), gebouwd voor Patchkamer contract v1.35.
//   Een basgitaar voor soul, funk en jazz als fysisch model in een AudioWorklet (geen samples): een digitale golfgeleider per snaar (4 of 5 snaren).
//   - snaar: vertragingslijn met kubische uitlezing, frequentie-afhankelijke demping uit twee galmtijden (grondtoon en 2,2 kHz), stijfheid (allpass-dispersie
//     per noot opgelost voor de gewenste inharmonischheid), plukpositie (kam in de aanzet), snaar-tegen-fret-contact (eenzijdige begrenzing met rammelruis),
//     spanningsmodulatie (toonhoogtedip na een harde aanslag), dode plek van de hals, vlakwond of roundwound
//   - aanslagen uit velocity-zones, nootlengte en toetsen 0 t/m 11 (keyswitches) of cc art: dode noot, vinger, pull, slap, pop, palm mute, flageolet, plectrum
//   - legato: overlappende noten op één snaar zijn hammer-on, pull-off of slide (glijdende toonhoogte met glijruis); octaaf-slap met pop
//   - één stem per snaar, een nieuwe noot op dezelfde snaar dempt de vorige; automatische snaarkeuze op positie (open snaren voor funk, hoge frets voor jazz)
//   - pickups: brug- en halspositie (kam over de snaar), single-coil of humbucker (resonantie), mix; hals- en bodyresonanties; actieve of passieve toonregeling;
//     compressie, drive (ADAA met oversampling) en kastsimulatie; fretless-modus met mwah; round-robin en mensvariatie
//   - bewaker in de worklet: alleen eindige berichten, de toestanden van snaren en bus worden per blok op eindigheid gecontroleerd, de uitgang wordt begrensd
const EN = {
  'Snaar': 'String', 'Spel': 'Playing', 'Pickups': 'Pickups', 'Versterker': 'Amplifier', 'Aanslagen': 'Articulations', 'Proef': 'Try',
  'Snaren': 'Strings', '4 snaren': '4 strings', '5 snaren (lage B)': '5 strings (low B)', 'Snaartype': 'String type', 'Roundwound': 'Roundwound', 'Vlakwond': 'Flatwound',
  'Techniek': 'Technique', 'Vingers': 'Fingers', 'Plectrum': 'Pick', 'Pickuptype': 'Pickup type', 'Single-coil': 'Single-coil', 'Humbucker': 'Humbucker',
  'Hammer-on en slide': 'Hammer-on and slide', 'Uit': 'Off', 'Hammer-on': 'Hammer-on', 'Slide': 'Slide', 'Automatisch': 'Automatic',
  'Toonregeling': 'Tone control', 'Actief': 'Active', 'Passief': 'Passive', 'Fretless': 'Fretless', 'Octaaf is pop': 'Octave is pop', 'Keyswitches': 'Keyswitches',
  'Uitklank': 'Sustain', 'Snaarhelderheid': 'String brightness', 'Stijfheid': 'Stiffness', 'Rammel': 'Fret buzz', 'Spanning': 'Tension', 'Dode plek': 'Dead spot',
  'Dode noot tot': 'Dead note up to', 'Slap vanaf': 'Slap from', 'Pop vanaf': 'Pop from', 'Dode noot korter dan': 'Dead note shorter than',
  'Plukpositie': 'Pluck position', 'Aanslaggevoeligheid': 'Touch response', 'Positie': 'Position', 'Glijtijd': 'Glide time', 'Dempen': 'Damping time', 'Dempvlak': 'Flat-hand mute',
  'Speelgeluid': 'Playing noise', 'Mensvariatie': 'Humanize', 'Stemming': 'Tuning', 'Transpositie': 'Transpose',
  'Brug / hals': 'Bridge / neck', 'Hals en body': 'Neck and body', 'Mwah': 'Mwah', 'Bas': 'Bass', 'Mid': 'Mid', 'Hoog': 'Treble', 'Drive': 'Drive', 'Compressie': 'Compression', 'Kast': 'Cabinet', 'Volume': 'Volume',
  'Dood': 'Dead', 'Vinger': 'Finger', 'Pull': 'Pull', 'Slap': 'Slap', 'Pop': 'Pop', 'Octaaf-slap': 'Octave slap', 'Slide omhoog': 'Slide up',
  'Palm mute': 'Palm mute', 'Flageolet': 'Harmonic', 'Plectrum-aanslag': 'Pick attack', 'Hammer-on omhoog': 'Hammer-on', 'Pull-off': 'Pull-off',
  'Laatste noot: {0} · snaar {1} · fret {2} · {3}': 'Last note: {0} · string {1} · fret {2} · {3}',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Funk Bass kan hier geen geluid maken.': 'AudioWorklet not available: Funk Bass cannot make sound here.',
  'Proefnoot': 'Test note', 'Alles uit': 'All off',
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan, groep]
const SPEC = {
  sustain: ['Uitklank', 0.3, 2.5, 0.01, 1, 'x', 'log', 'decay', 0.05, false, 'string'],
  bright: ['Snaarhelderheid', 0, 1, 0.01, 0.5, '%', 'lin', 'filter', 0.06, true, 'string'],
  stiff: ['Stijfheid', 0, 2, 0.01, 1, 'x', 'lin', 'detune', 0.05, false, 'string'],
  buzz: ['Rammel', 0, 1, 0.01, 0.4, '%', 'lin', 'texture', 0.06, false, 'string'],
  tm: ['Spanning', 0, 1, 0.01, 0.5, '%', 'lin', 'pitch', 0.05, false, 'string'],
  deadspot: ['Dode plek', 0, 1, 0.01, 0.3, '%', 'lin', 'decay', 0.05, false, 'string'],
  ghostVel: ['Dode noot tot', 0, 0.4, 0.005, 0.2, 'vel', 'lin', 'level', 0.02, false, 'play'],
  slapVel: ['Slap vanaf', 0.5, 1.05, 0.005, 0.8, 'vel', 'lin', 'level', 0.02, false, 'play'],
  popVel: ['Pop vanaf', 0.6, 1.05, 0.005, 0.94, 'vel', 'lin', 'level', 0.02, false, 'play'],
  ghostDur: ['Dode noot korter dan', 0, 0.12, 0.005, 0.04, 's', 'lin', 'time', 0.02, false, 'play'],
  pluckPos: ['Plukpositie', 0.05, 0.45, 0.005, 0.2, '%', 'lin', 'color', 0.03, false, 'play'],
  touch: ['Aanslaggevoeligheid', 0, 1, 0.01, 0.6, '%', 'lin', 'level', 0.03, false, 'play'],
  pos: ['Positie', 0, 1, 0.01, 0.35, '%', 'lin', 'pitch', 0.02, false, 'play'],
  glide: ['Glijtijd', 10, 600, 1, 90, 'ms', 'log', 'time', 0.03, false, 'play'],
  rel: ['Dempen', 8, 400, 1, 70, 'ms', 'log', 'decay', 0.05, false, 'play'],
  mute: ['Dempvlak', 0, 1, 0.01, 0, '%', 'lin', 'decay', 0.04, false, 'play'],
  noise: ['Speelgeluid', 0, 1, 0.01, 0.5, '%', 'lin', 'texture', 0.06, true, 'play'],
  human: ['Mensvariatie', 0, 1, 0.01, 0.35, '%', 'lin', 'motion', 0.06, true, 'play'],
  tune: ['Stemming', -50, 50, 1, 0, 'ct', 'lin', 'pitch', 0.03, false, 'play'],
  transpose: ['Transpositie', -12, 12, 1, 0, 'st', 'lin', 'pitch', 0, false, 'play'],
  pickMix: ['Brug / hals', 0, 1, 0.01, 0.55, '%', 'lin', 'color', 0.08, true, 'pickup'],
  body: ['Hals en body', 0, 1, 0.01, 0.4, '%', 'lin', 'color', 0.06, true, 'pickup'],
  mwah: ['Mwah', 0, 1, 0.01, 0.5, '%', 'lin', 'color', 0.08, true, 'pickup'],
  bass: ['Bas', -1, 1, 0.01, 0, 'tone', 'lin', 'filter', 0.06, true, 'amp'],
  mid: ['Mid', -1, 1, 0.01, 0, 'tone', 'lin', 'filter', 0.06, true, 'amp'],
  treble: ['Hoog', -1, 1, 0.01, 0, 'tone', 'lin', 'filter', 0.06, true, 'amp'],
  drive: ['Drive', 0, 1, 0.01, 0.12, '%', 'lin', 'color', 0.06, true, 'amp'],
  comp: ['Compressie', 0, 1, 0.01, 0.25, '%', 'lin', 'level', 0.05, true, 'amp'],
  cab: ['Kast', 0, 1, 0.01, 0, '%', 'lin', 'mix', 0.05, true, 'amp'],
  vol: ['Volume', 0, 1, 0.01, 0.7, '%', 'lin', 'level', 0.02, false, 'amp'],
};
const SELECTS = { strings: ['4', '5'], wound: ['round', 'flat'], pickup: ['single', 'hum'], tech: ['fingers', 'pick'], legato: ['off', 'hammer', 'slide', 'auto'], eq: ['active', 'passive'] };
const SEL_DEF = { strings: '4', wound: 'round', pickup: 'single', tech: 'fingers', legato: 'auto', eq: 'active' };
const BOOLS = { fretless: false, autoPop: true, keyswitch: true };
const RANGES = {};
for (const [id, d] of Object.entries(SPEC)) RANGES[id] = [d[1], d[2], d[4]];
const MODEX = ['transpose'];
const WNAME = 'nl-patchkamer-funkbass-1-0-0';
const WORKLET = `
const WNAME = '${WNAME}';
const RANGES = ${JSON.stringify(RANGES)};
// ---- Funk Bass motor: fysisch model, een golfgeleider per snaar ----
const SR = sampleRate, ISR = 1 / sampleRate, TWO_PI = Math.PI * 2;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const fin = v => v - v === 0;
const OPEN5 = [23, 28, 33, 38, 43];
const A_DEAD = 0, A_FINGER = 1, A_PULL = 2, A_SLAP = 3, A_POP = 4, A_MUTE = 5, A_HARM = 6, A_PICK = 7;
const EXL = 4096, NCMD = 96, NAP = 2;
const smooth = (a, b, x) => { const t = clampN((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// ---- hulpfuncties: fasevertraging van de lusfilters ----
function phLP(c, w) { return Math.atan2(c * Math.sin(w), 1 - c * Math.cos(w)) / w; }
function phAP(d, w) {
  let ph = Math.atan2(-Math.sin(w), d + Math.cos(w)) - Math.atan2(-d * Math.sin(w), 1 + d * Math.cos(w));
  if (ph > 0) ph -= TWO_PI; if (ph < -Math.PI) ph += TWO_PI;
  return -ph / w;
}
const magLP = (c, w) => (1 - c) / Math.sqrt(1 - 2 * c * Math.cos(w) + c * c);
// biquad
const biq = () => ({ b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, z1: 0, z2: 0 });
const biqRun = (f, x) => { const y = f.b0 * x + f.z1; f.z1 = f.b1 * x - f.a1 * y + f.z2; f.z2 = f.b2 * x - f.a2 * y; return y; };
const biqPass = f => { f.b0 = 1; f.b1 = 0; f.b2 = 0; f.a1 = 0; f.a2 = 0; };
function biqSet(f, type, fc, q, gdb) {
  fc = clampN(fc, 10, SR * 0.45);
  const w = TWO_PI * fc / SR, cs = Math.cos(w), sn = Math.sin(w), A = Math.pow(10, gdb / 40), al = sn / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
  else {
    const sq = 2 * Math.sqrt(A) * (sn / 2 * Math.SQRT2);
    if (type === 'ls') { b0 = A * ((A + 1) - (A - 1) * cs + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - sq); a0 = (A + 1) + (A - 1) * cs + sq; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - sq; }
    else { b0 = A * ((A + 1) + (A - 1) * cs + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - sq); a0 = (A + 1) - (A - 1) * cs + sq; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - sq; }
  }
  f.b0 = b0 / a0; f.b1 = b1 / a0; f.b2 = b2 / a0; f.a1 = a1 / a0; f.a2 = a2 / a0;
}
// toestandsvariabel filter (Simper), voor de ruisstoten en de mwah
class Svf {
  constructor() { this.ic1 = 0; this.ic2 = 0; this.a1 = 0; this.a2 = 0; this.a3 = 0; this.k = 1; }
  set(fc, q) { const g = Math.tan(Math.PI * clampN(fc, 20, SR * 0.45) / SR), k = 1 / q; this.k = k; this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2; }
  run(x, mode) { const v3 = x - this.ic2, v1 = this.a1 * this.ic1 + this.a2 * v3, v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3; this.ic1 = 2 * v1 - this.ic1; this.ic2 = 2 * v2 - this.ic2; return mode === 0 ? v1 : mode === 1 ? v2 : x - this.k * v1 - v2; }
  clear() { this.ic1 = 0; this.ic2 = 0; }
  ok() { return this.ic1 > -1e6 && this.ic1 < 1e6 && this.ic2 > -1e6 && this.ic2 < 1e6; }
}
// ---- versterker: ADAA-tanh met 2x oversampling (zoals Drawbar Organ) ----
const lncosh = x => { const a = x < 0 ? -x : x; return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2; };
class Adaa {
  constructor() { this.ux = 0; this.uF = 0; }
  run(u) { const F = lncosh(u), du = u - this.ux; const y = Math.abs(du) > 1e-5 ? (F - this.uF) / du : Math.tanh((u + this.ux) * 0.5); this.ux = u; this.uF = F; return y; }
  reset() { this.ux = 0; this.uF = 0; }
  ok() { return this.ux > -1e6 && this.ux < 1e6 && this.uF > -1e6 && this.uF < 1e6; }
}
const HK = 5, HD = (() => {
  const I0 = x => { let s = 1, t = 1; for (let k = 1; k < 30; k++) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; }, J = 2 * HK + 2, beta = 7, d = [];
  for (let k = 0; k <= HK; k++) { const j = 2 * k + 1, w = I0(beta * Math.sqrt(Math.max(0, 1 - (j / J) * (j / J)))) / I0(beta); d.push(2 * (k % 2 ? -1 : 1) / (Math.PI * j) * w); }
  return d;
})();
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
// ---- een snaar ----
class Str {
  constructor() {
    let bs = 256; while (bs < SR / 14 + 192) bs <<= 1;
    this.buf = new Float32Array(bs); this.mask = bs - 1; this.ex = new Float32Array(EXL);
    this.vf = biq(); this.nA = new Svf(); this.nB = new Svf(); this.mw = new Svf();
    this.reset();
  }
  reset() {
    this.buf.fill(0); this.wp = 0; this.act = 0; this.gen = 0; this.note = 0; this.f0 = 100; this.art = 1; this.rel = 0;
    this.D = 100; this.Np = 100; this.c = 0.3; this.g = 0.99; this.d = 0; this.gl = 0; this.dD = 0; this.dNp = 0; this.dc = 0; this.dg = 0; this.dd = 0; this.Dt = 100; this.Npt = 100; this.ct = 0.3; this.gt = 0.99; this.dt = 0;
    this.lpz = 0; this.z0 = 0; this.z1 = 0; this.env = 0; this.envK = 0.001; this.og = 1; this.ogd = 0; this.gm = 1;
    this.th = 9; this.kk = 0.3; this.bz = 0; this.tmk = 0; this.exLen = 0; this.exPos = 0;
    this.pb = 0.08; this.pn = 0.2; this.sgn = 1;
    this.nAa = 0; this.nAd = 0.99; this.nBa = 0; this.nBd = 0.99; this.nAm = 0; this.nBm = 1; this.nAs = 0; this.nBs = 0;
    this.pmix = 0.5; this.open = 0; this.A = REF;
    this.nA.clear(); this.nB.clear(); this.mw.clear(); biqPass(this.vf); this.vf.z1 = 0; this.vf.z2 = 0; this.useVf = 0; this.mwAmt = 0; this.mwN = 0;
  }
  ok() {
    const bad = v => !(v > -1e6 && v < 1e6);
    return !(bad(this.lpz) || bad(this.z0) || bad(this.z1) || bad(this.env) || bad(this.og) || bad(this.gm) || bad(this.D) || bad(this.c) || bad(this.g) || bad(this.d) || bad(this.vf.z1) || bad(this.vf.z2) || !this.nA.ok() || !this.nB.ok() || !this.mw.ok());
  }
  run(bus, i0, i1, rnd, fretless) {
    const b = this.buf, m = this.mask, ex = this.ex;
    let wp = this.wp, D = this.D, Np = this.Np, c = this.c, g = this.g, d = this.d, lpz = this.lpz, z0 = this.z0, z1 = this.z1, env = this.env, og = this.og, gm = this.gm;
    const th = this.th, kk = this.kk, bz = this.bz, tmk = this.tmk, envK = this.envK, pb = this.pb, pn = this.pn, pm = this.pmix, f = this.vf, useVf = this.useVf;
    for (let i = i0; i < i1; i++) {
      if (this.gl > 0) {
        D += this.dD; Np += this.dNp; c += this.dc; g += this.dg; d += this.dd;
        if (--this.gl === 0) { D = this.Dt; Np = this.Npt; c = this.ct; g = this.gt; d = this.dt; }
      }
      const tmq = tmk * env, De = D * (1 - (tmq > 0.06 ? 0.06 : tmq));
      let p = wp - De, ip = Math.floor(p), fr = p - ip;
      let y0 = b[(ip - 1) & m], y1 = b[ip & m], y2 = b[(ip + 1) & m], y3 = b[(ip + 2) & m];
      let r = y1 + 0.5 * fr * (y2 - y0 + fr * (2 * y0 - 5 * y1 + 4 * y2 - y3 + fr * (3 * (y1 - y2) + y3 - y0)));
      let click = 0;
      if (r < -th) { click = -r - th; r = -th - click * kk; }
      lpz = (1 - c) * r + c * lpz;
      let v = d * lpz + z0; z0 = lpz - d * v;
      let v2 = d * v + z1; z1 = v - d * v2;
      let w = g * gm * v2;
      if (this.exPos < this.exLen) w += ex[this.exPos++];
      b[wp & m] = w;
      // gelezen punten van de pickups: kam over de snaar
      let dp = pb * Np; if (dp < 2.5) dp = 2.5;
      p = wp - dp; ip = Math.floor(p); fr = p - ip;
      y0 = b[(ip - 1) & m]; y1 = b[ip & m]; y2 = b[(ip + 1) & m]; y3 = b[(ip + 2) & m];
      const tb = y1 + 0.5 * fr * (y2 - y0 + fr * (2 * y0 - 5 * y1 + 4 * y2 - y3 + fr * (3 * (y1 - y2) + y3 - y0)));
      dp = pn * Np; if (dp < 2.5) dp = 2.5;
      p = wp - dp; ip = Math.floor(p); fr = p - ip;
      y0 = b[(ip - 1) & m]; y1 = b[ip & m]; y2 = b[(ip + 1) & m]; y3 = b[(ip + 2) & m];
      const tn = y1 + 0.5 * fr * (y2 - y0 + fr * (2 * y0 - 5 * y1 + 4 * y2 - y3 + fr * (3 * (y1 - y2) + y3 - y0)));
      let y = w - ((1 - pm) * tb + pm * tn);
      wp = (wp + 1) & m;
      env += (w * w - env) * envK;
      if (this.ogd !== 0) { og += this.ogd; if (og <= 0) { og = 0; this.ogd = 0; } }
      y *= og;
      // ruis: speelgeluid, rammel, glij- en loslaatruis
      if (this.nAa > 1e-6 || click > 0 || this.nBa > 1e-6) {
        let nz = 0;
        if (this.nAa > 1e-6) { nz += this.nA.run(rnd() * this.nAa, this.nAm) * this.nAs; this.nAa *= this.nAd; }
        if (this.nBa > 1e-6) { nz += this.nB.run(rnd() * this.nBa, this.nBm) * this.nBs; this.nBa *= this.nBd; }
        if (click > 0) nz += rnd() * click * bz;
        y += nz * og;
      }
      if (this.mwAmt > 0) {
        if ((++this.mwN & 15) === 0) { const e = env * 40; this.mw.set(280 + 900 * Math.sqrt(e > 1 ? 1 : e), 5); }
        y += this.mw.run(y, 0) * this.mwAmt;
      }
      if (useVf) y = biqRun(f, y);
      bus[i] += y;
    }
    this.wp = wp; this.D = D; this.Np = Np; this.c = c; this.g = g; this.d = d; this.lpz = lpz; this.z0 = z0; this.z1 = z1; this.env = env; this.og = og;
  }
}
// ---- de motor ----
const REF = 0.1;
const STRHI = [0.6, 0.7, 0.9, 1.1, 1.3];
class Engine {
  constructor() {
    this.P = {}; for (const k in RANGES) this.P[k] = RANGES[k][2];
    this.Q = { bass: 0, mid: 0, treble: 0, body: 0.4, cab: 0, drive: 0.1, comp: 0.2, vol: 0.7, pickMix: 0.5 };
    this.S = []; for (let i = 0; i < 5; i++) this.S.push(new Str());
    this.nS = 4; this.open = OPEN5.slice(1);
    this.cm = []; for (let i = 0; i < NCMD; i++) this.cm.push({ used: 0, type: 0, t: 0, str: 0, gen: 0, art: 1, vel: 0.5, note: 40, f: 100, kind: 0, gl: 0.01, rr: 1, fret: 0, dur: 0, seed: 0 });
    this.q = new Int32Array(NCMD); this.qn = 0;
    this.V = []; for (let i = 0; i < 5; i++) this.V.push({ note: -1, tEnd: -1, gen: 0, art: 1, fret: 0, held: 0, t0: -1, on: 0 });
    this.genC = 1; this.forced = -1; this.lastNote = -1; this.lastT = -9; this.lastStr = -1; this.lastFret = 0; this.lastArt = 1; this.rr = 0;
    this.uiO = { art: 0, str: 0, fret: 0, note: 0 }; this.uiPend = false; this.rndF = () => this.rnd(); this.bus = new Float64Array(128); this.rs = 0x1234567; this.ui = false; this.uiT = -1;
    this.os = 2; this.sv = 1; this.idle = 0; this.pr = { wms: 3, fcE: 1000, beta: 0.2, ldb: 0, lo: 1, hi: 1, thump: 0, thumpFc: 150, clack: 0, clackFc: 3000, clackQ: 1, buzz: 1, tm: 0.3, vfT: 0, vfFc: 1000, vfQ: 1, vfG: 0, stiff: 1, abs: 0, dead: 0, tick: 0, nz: 0 };
    this.dsg = { c: 0, g: 0, d: 0, Dl: 0, Np: 0 };
    this.T = 0; this.bp = null; this.sp = { n: 0 };
    // bus
    this.pk = biq(); this.bd1 = biq(); this.bd2 = biq(); this.dc = biq(); this.eL = biq(); this.eM = biq(); this.eH = biq(); this.eP = biq();
    this.cHp = biq(); this.cLp1 = biq(); this.cLp2 = biq(); this.cPk = biq();
    this.shp = new Over2(new Adaa()); this.shp1 = new Adaa();
    this.cdet = 0; this.cgain = 1; this.pkt = -1; this.dirty = 1; this.lastBus = '';
    this.setBus(true);
  }
  rnd() { let x = this.rs; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rs = x; return ((x >>> 0) / 2147483648) - 1; }
  // ---- parameters ----
  setParams(p) {
    if (!p) return;
    for (const k in RANGES) { const v = p[k]; if (typeof v === 'number' && fin(v)) this.P[k] = clampN(v, RANGES[k][0], RANGES[k][1]); }
    const ns = p.strings === 5 ? 5 : 4;
    if (ns !== this.nS) { this.nS = ns; this.open = ns === 5 ? OPEN5.slice() : OPEN5.slice(1); }
    this.wound = p.wound === 1 ? 1 : 0; this.pickT = p.pickup === 1 ? 1 : 0; this.tech = p.tech === 1 ? 1 : 0; this.legM = p.legato | 0; this.eqM = p.eq === 1 ? 1 : 0;
    this.fretless = p.fretless ? 1 : 0; this.autoPop = p.autoPop ? 1 : 0; this.ks = p.keyswitch ? 1 : 0;
    this.dirty = 1;
  }
  setBus(force) {
    const P = this.P, Q = this.Q, k = force ? 1 : 0.35; let ch = force ? 1 : 0;
    const keys = ['bass', 'mid', 'treble', 'body', 'cab', 'drive', 'comp', 'vol', 'pickMix'];
    for (const n of keys) { const t = P[n]; const nv = Q[n] + (t - Q[n]) * k; if (Math.abs(nv - Q[n]) > 1e-5 || force) ch = 1; Q[n] = Math.abs(t - nv) < 2e-4 ? t : nv; }
    if (!ch && !this.dirty) return; this.dirty = 0;
    if (this.pickT === 1) { biqSet(this.pk, 'lp', 3300, 0.8, 0); } else { biqSet(this.pk, 'lp', 5200, 1.1, 0); }
    biqSet(this.bd1, 'peak', 118, 7, 1 + 5 * Q.body); biqSet(this.bd2, 'peak', 232, 6, 0.5 + 3 * Q.body);
    biqSet(this.dc, 'hp', 24, 0.707, 0);
    if (this.eqM === 0) { biqSet(this.eL, 'ls', 90, 1, Q.bass * 12); biqSet(this.eM, 'peak', 480, 0.7, Q.mid * 9); biqSet(this.eH, 'hs', 3200, 1, Q.treble * 12); biqPass(this.eP); }
    else { biqPass(this.eL); biqPass(this.eM); biqPass(this.eH); biqSet(this.eP, 'lp', 450 * Math.pow(2, 4.4 * (Q.treble + 1) / 2), 0.55, 0); }
    biqSet(this.cHp, 'hp', 48, 0.8, 0); biqSet(this.cLp1, 'lp', 4200, 0.9, 0); biqSet(this.cLp2, 'lp', 5600, 0.7, 0); biqSet(this.cPk, 'peak', 95, 2, 4);
  }
  // ---- snaren ontwerpen ----
  design(f0, t60lo, t60hi, B, stiffOn, Dmax) {
    const o = this.dsg, w0 = TWO_PI * f0 / SR, fh = clampN(2200, 3 * f0, 0.4 * SR), wh = TWO_PI * fh / SR;
    const M0 = Math.pow(10, -3 / (Math.max(0.02, t60lo) * f0)), Mh = Math.pow(10, -3 / (Math.max(0.01, t60hi) * f0));
    let ratio = Mh / M0; if (ratio > 0.9999) ratio = 0.9999;
    let c = 0;
    if (ratio < 1) { let a = 0, b = 0.985; for (let i = 0; i < 24; i++) { c = (a + b) * 0.5; if (magLP(c, wh) / magLP(c, w0) > ratio) a = c; else b = c; } c = (a + b) * 0.5; }
    let g = M0 / magLP(c, w0); if (g > 0.99995) g = 0.99995;
    // dispersie: kies d zodat deeltoon 6 de gewenste onzuiverheid krijgt
    const N = SR / f0, tau = (d, w) => phLP(c, w) + NAP * phAP(d, w);
    let d = 0;
    if (stiffOn && B > 0) {
      const K = 6, target = K * Math.sqrt(1 + B * K * K) / Math.sqrt(1 + B);
      const T = 0.42 * N / NAP; let dmin = T > 1 ? (1 - T) / (1 + T) : 0; if (dmin < -0.985) dmin = -0.985;
      const ratioAt = dd => { const Dl = N - tau(dd, w0); let w = TWO_PI * K / (Dl + tau(dd, w0)); for (let it = 0; it < 6; it++) w = TWO_PI * K / (Dl + tau(dd, w)); return w / w0; };
      if (dmin < 0 && ratioAt(dmin) > target) { let a = dmin, b = 0; for (let i = 0; i < 22; i++) { const mid = (a + b) * 0.5; if (ratioAt(mid) > target) a = mid; else b = mid; } d = (a + b) * 0.5; }
      else if (dmin < 0) d = dmin;
    }
    o.c = c; o.g = g; o.d = d; o.Dl = N - tau(d, w0); o.Np = N;
    if (o.Dl < 4) { o.Dl = 4; }
  }
  // ---- plannen (op het moment dat het bericht binnenkomt) ----
  alloc() { for (let i = 0; i < NCMD; i++) if (!this.cm[i].used) { this.cm[i].used = 1; return i; } return -1; }
  push(i) { const t = this.cm[i].t; let j = this.qn; while (j > 0 && this.cm[this.q[j - 1]].t > t) { this.q[j] = this.q[j - 1]; j--; } this.q[j] = i; this.qn++; }
  shift() { const i = this.q[0]; this.q.copyWithin(0, 1, this.qn); this.qn--; return i; }
  msg(m) {
    if (!m || typeof m !== 'object') return;
    const ty = m.type;
    if (ty === 'params') this.setParams(m.p);
    else if (ty === 'note') { if (fin(m.note) && fin(m.vel) && fin(m.t)) this.plan(m.note, m.vel, m.t, fin(m.dur) && m.dur > 0 ? Math.min(m.dur, 60) : -1); }
    else if (ty === 'on') { if (fin(m.note) && fin(m.vel) && fin(m.t)) this.plan(m.note, m.vel, m.t, -1); }
    else if (ty === 'off') { if (fin(m.note) && fin(m.t)) this.planOff(m.note, m.t); }
    else if (ty === 'ks') { if (fin(m.n)) this.keyswitch(clampN(Math.round(m.n), 0, 11)); }
    else if (ty === 'stop') this.stopAll();
    else if (ty === 'ui') this.ui = !!m.on;
    else if (ty === 'os') this.os = m.n === 1 ? 1 : 2;
  }
  stopAll() {
    for (let i = 0; i < NCMD; i++) this.cm[i].used = 0; this.qn = 0;
    for (let s = 0; s < 5; s++) { const st = this.S[s]; if (st.act) st.ogd = -1 / (0.008 * SR); this.V[s].on = 0; this.V[s].held = 0; this.V[s].tEnd = -1; }
    this.forced = -1;
  }
  keyswitch(n) { const map = [-1, A_FINGER, A_PULL, A_SLAP, A_POP, A_DEAD, A_MUTE, A_HARM, A_PICK]; this.forced = n < map.length ? map[n] : -1; }
  zone(vel, dur, note, t) {
    const P = this.P;
    if (this.forced >= 0) return this.forced;
    if (vel < P.ghostVel) return A_DEAD;
    const slap = Math.max(P.slapVel, P.ghostVel + 0.1), pop = Math.max(P.popVel, slap);
    if (this.tech === 1) return A_PICK;
    if (vel >= pop && vel >= slap) return A_POP;
    if (vel >= slap) {
      if (this.autoPop && this.lastNote >= 0 && t - this.lastT < 0.3 && note - this.lastNote === 12 && (this.lastArt === A_SLAP)) return A_POP;
      return A_SLAP;
    }
    if (dur > 0 && dur < P.ghostDur && vel < 0.7) return A_DEAD;
    if (P.mute > 0.5) return A_MUTE;
    return A_FINGER;
  }
  pickString(note, t, dur) {
    const P = this.P, n = this.nS, O = this.open; let best = -1, bc = 1e9, bf = 0;
    const pos = P.pos;
    for (let s = 0; s < n; s++) {
      const fret = note - O[s]; if (fret < -(n === 5 ? 0 : 0) || fret > 24) continue;
      const V = this.V[s]; let cost = (1 - pos) * (fret * 0.6 - (fret === 0 ? 3 : 0)) + pos * (24 - fret) * 0.5;
      if (this.lastStr >= 0 && t - this.lastT < 1.2) cost += 0.35 * Math.abs(fret - this.lastFret) + 0.25 * Math.abs(s - this.lastStr);
      if (V.on && V.tEnd > t + 0.004) {
        const legOK = this.legM !== 0 && s === this.lastStr && V.note !== note && Math.abs(V.note - note) <= 24 && V.art !== A_DEAD && dur > 0;
        cost += legOK ? -7 : 12;
      }
      if (cost < bc) { bc = cost; best = s; bf = fret; }
    }
    if (best < 0) { // buiten het bereik: laagste snaar (drop) of hoogste snaar
      if (note < O[0]) { best = 0; bf = note - O[0]; } else { best = n - 1; bf = note - O[n - 1]; }
    }
    this.pf = bf; return best;
  }
  plan(note, vel, t, dur) {
    const P = this.P, now = currentTime;
    note = Math.round(note);
    if (note < 12) { if (this.ks) { if (vel > 0) this.keyswitch(note); } return; }
    if (vel <= 0) { this.planOff(note, t); return; }
    if (t < now) t = now; if (t > now + 60) t = now + 60;
    vel = clampN(vel, 0.01, 1);
    note = clampN(note + (P.transpose | 0), 12, 100);
    let art = this.zone(vel, dur, note, t);
    const s = this.pickString(note, t, dur), fret = this.pf, V = this.V[s], hum = P.human;
    // legato?
    let leg = 0, kind = 0, gl = 0.005;
    if (this.legM !== 0 && V.on && V.tEnd > t + 0.0005 && V.note !== note && V.art !== A_DEAD && art !== A_DEAD && s === this.lastStr && dur > 0 && Math.abs(note - V.note) <= 24) {
      const iv = note - V.note, ai = Math.abs(iv);
      if (this.legM === 2 || (this.legM === 3 && ai >= 4)) { leg = 1; kind = 2; gl = P.glide * 1e-3; }
      else if (this.legM === 1 || this.legM === 3) { if (ai <= 7) { leg = 1; kind = iv > 0 ? 1 : 3; gl = 0.004; } else { leg = 1; kind = 2; gl = P.glide * 1e-3; } }
    }
    if (leg && this.fretless && kind !== 2) { kind = 2; gl = Math.max(gl, 0.6 * P.glide * 1e-3); }
    this.rr ^= 1; const rrs = this.rr ? 1 : -1;
    const cents = P.tune + hum * 3.5 * this.rnd() + (this.fretless ? 5 * this.rnd() : 0);
    const f = 440 * Math.pow(2, (note - 69) / 12 + cents / 1200);
    const gen = this.genC++;
    if (!leg && V.on && t < V.tEnd + 0.8) {
      const k = this.alloc(); if (k >= 0) { const c = this.cm[k]; c.type = 4; c.t = Math.max(now, t - 0.0035); c.str = s; this.push(k); }
      if (t - now < 0.0036) t = now + 0.0036;
    }
    const k = this.alloc(); if (k < 0) return;
    const c = this.cm[k]; c.type = leg ? 2 : 1; c.t = t; c.str = s; c.gen = gen; c.art = art; c.vel = vel; c.note = note; c.f = f; c.kind = kind; c.gl = gl; c.rr = rrs; c.fret = fret; c.dur = dur; c.seed = hum;
    this.push(k);
    V.note = note; V.gen = gen; V.art = art; V.fret = fret; V.on = 1; V.t0 = t; V.held = dur < 0 ? 1 : 0; V.tEnd = dur > 0 ? t + dur : t + 1e6;
    { const r = this.alloc(); if (r >= 0) { const e = this.cm[r]; e.type = 3; e.t = t + (dur > 0 ? dur : 20); e.str = s; e.gen = gen; this.push(r); } }
    this.lastNote = note; this.lastT = t; this.lastStr = s; this.lastFret = fret; this.lastArt = art;
  }
  planOff(note, t) {
    const now = currentTime; if (t < now) t = now;
    note = clampN(Math.round(note) + (this.P.transpose | 0), 12, 100);
    for (let s = 0; s < this.nS; s++) {
      const V = this.V[s];
      if (V.on && V.held && V.note === note) { V.held = 0; V.tEnd = t; const r = this.alloc(); if (r >= 0) { const e = this.cm[r]; e.type = 3; e.t = t; e.str = s; e.gen = V.gen; this.push(r); } }
    }
  }
  // ---- uitvoeren (op het moment van de noot) ----
  dispatch(c) {
    const s = this.S[c.str]; if (!s) return;
    if (c.type === 4) { if (s.act && s.og > 0) s.ogd = -1 / (0.003 * SR); return; }
    if (c.type === 3) { if (s.act && s.gen === c.gen) this.release(s, c); return; }
    if (c.type === 1) this.noteOn(s, c); else if (c.type === 2) this.legato(s, c);
  }
  release(s, c) {
    const P = this.P; let tau = P.rel * 1e-3;
    if (s.art === A_MUTE || s.art === A_DEAD) tau *= 0.4;
    if (s.open) tau *= 1.8;
    s.gm = Math.exp(-1 / (s.f0 * tau)); s.rel = 1;
    if (!s.open && s.art !== A_DEAD && P.noise > 0 && s.nBa < 1e-3) { s.nB.set(700, 1.0); s.nBm = 0; s.nBa = s.A * 0.2 * P.noise * (this.wound ? 0.3 : 1); s.nBd = Math.exp(-1 / (0.008 * SR)); s.nBs = 0.5; }
  }
  profile(art, vel, c) {
    const P = this.P, pr = this.pr, ghost = P.ghostVel, vn = clampN((vel - ghost) / (1 - ghost), 0, 1), touch = P.touch, tech = this.tech;
    const pull = smooth(0.55, 0.95, vn);
    pr.beta = P.pluckPos; pr.lo = 1; pr.hi = 1; pr.thump = 0.05; pr.thumpFc = 160; pr.clack = 0; pr.clackFc = 3000; pr.clackQ = 1; pr.buzz = 1; pr.tm = 0.3; pr.vfT = 0; pr.stiff = 1; pr.abs = 0; pr.dead = 0;
    const ld = -(1 - vn) * (touch * 20 + 2);
    switch (art) {
      case A_DEAD:
        pr.wms = 6; pr.fcE = 380; pr.beta = 0.32; pr.ldb = -3 - (1 - vn) * 4; pr.abs = 1; pr.dead = 1; pr.thump = 1.2; pr.thumpFc = 150; pr.clack = 0.25; pr.clackFc = 1500; pr.buzz = 0; pr.tm = 0; pr.stiff = 3; break;
      case A_SLAP:
        pr.wms = 0.7; pr.fcE = 6500; pr.beta = 0.16; pr.ldb = -1 - (1 - vn) * 2; pr.lo = 0.45; pr.hi = 0.7; pr.thump = 1.0; pr.thumpFc = 190; pr.clack = 1.1; pr.clackFc = 2800; pr.clackQ = 0.9; pr.buzz = 2.2; pr.tm = 1.0;
        pr.vfT = 1; pr.vfFc = 2800; pr.vfQ = 0.8; pr.vfG = 5; break;
      case A_POP:
        pr.wms = 0.45; pr.fcE = 9500; pr.beta = 0.085; pr.ldb = -1.5; pr.lo = 0.3; pr.hi = 0.55; pr.thump = 0.1; pr.clack = 1.4; pr.clackFc = 3600; pr.clackQ = 1.3; pr.buzz = 2.1; pr.tm = 0.6;
        pr.vfT = 1; pr.vfFc = 1500; pr.vfQ = 1.4; pr.vfG = 8; break;
      case A_MUTE:
        pr.wms = lerp(4.5, 2, vn); pr.fcE = lerp(380, 1800, vn); pr.ldb = ld + 3; pr.lo = 0.3; pr.hi = 0.5; pr.thump = 0.2; pr.buzz = 0.5; pr.tm = 0.1; break;
      case A_HARM:
        pr.wms = 1.1; pr.fcE = 2600; pr.beta = 0.12; pr.ldb = ld - 3; pr.lo = 1.0; pr.hi = 0.45; pr.thump = 0; pr.buzz = 0; pr.tm = 0.15; pr.stiff = 0; break;
      case A_PICK:
        pr.wms = lerp(1.1, 0.4, vn); pr.fcE = lerp(2200, 8000, vn); pr.beta = 0.1 * (P.pluckPos / 0.2); pr.ldb = ld + 2; pr.lo = 0.85; pr.hi = 1.6; pr.thump = 0.04; pr.clack = 0.35 + 0.4 * vn; pr.clackFc = 4800; pr.buzz = 1.3; pr.tm = 0.4; break;
      default: // vinger en pull
        pr.wms = lerp(lerp(3.0, 1.0, vn), 0.6, pull * 0.5); pr.fcE = lerp(lerp(800, 4800, vn), 8000, pull * 0.6); pr.beta = P.pluckPos * lerp(1, 0.55, pull); pr.ldb = ld; pr.lo = 1; pr.hi = lerp(0.6, 1.1, vn) * lerp(1, 1.6, pull);
        pr.buzz = 0.45 + 1.4 * pull; pr.tm = 0.3 + 0.3 * pull; pr.clack = 0.35 * pull; pr.clackFc = 2400; pr.thump = 0.04 + 0.1 * pull;
    }
    return pr;
  }
  buildExc(s, pr, A, Nper) {
    const ex = s.ex, W = Math.max(3, Math.round(pr.wms * 1e-3 * SR)), maxD = EXL - 64;
    let L = Math.min(maxD, W + 4);
    ex.fill(0, 0, EXL);
    for (let i = 0; i < W; i++) ex[i] = 0.5 * (1 - Math.cos(TWO_PI * (i + 0.5) / W));
    // eenpolig laagdoorlaat op de puls
    if (pr.fcE > 0 && pr.fcE < SR * 0.4) {
      const a = Math.exp(-TWO_PI * pr.fcE / SR); let y = 0; const tail = Math.min(maxD - W - 4, Math.ceil(5 * SR / pr.fcE) + 8);
      L = W + tail;
      for (let i = 0; i < L; i++) { y = (1 - a) * (i < W ? ex[i] : 0) + a * y; ex[i] = y; }
    }
    // plukpositie: kam, e[n] - e[n-D]
    const Dc = clampN(pr.beta * Nper, 1, Math.min(Nper * 0.5, EXL - L - 8)), Di = Math.floor(Dc), fr = Dc - Di;
    const L2 = Math.min(EXL, L + Di + 2);
    for (let i = L2 - 1; i >= 0; i--) {
      const j = i - Di; const e0 = j >= 0 && j < L ? ex[j] : 0, e1 = j - 1 >= 0 && j - 1 < L ? ex[j - 1] : 0;
      ex[i] -= e0 * (1 - fr) + e1 * fr;
    }
    L = L2; let en = 0; for (let i = 0; i < L; i++) en += ex[i] * ex[i];
    const sc = en > 1e-20 ? A * Math.sqrt(Nper / en) : 0;
    for (let i = 0; i < L; i++) ex[i] *= sc;
    s.exLen = L; s.exPos = 0;
  }
  noteOn(s, c) {
    const P = this.P, art = c.art, vel = c.vel, f0 = c.f, pr = this.profile(art, vel, c), O = this.open[c.str], hum = P.human;
    const open = c.fret === 0 ? 1 : 0, round = this.wound === 0;
    // snaareigenschappen
    let lo = (round ? 7.0 : 4.2) * P.sustain * Math.pow(41 / f0, 0.3) * pr.lo, hi = (round ? 0.8 : 0.16) * (0.4 + 1.6 * P.bright) * pr.hi;
    if (c.str === 0 && this.nS === 5) lo *= 0.9;
    hi *= STRHI[this.nS === 5 ? c.str : c.str + 1]; if (open) { lo *= 1.12; hi *= 1.1; } else lo /= 1 + 0.004 * Math.max(0, c.fret);
    const mu = P.mute; lo *= lerp(1, 0.12, mu); hi *= lerp(1, 0.4, mu);
    const dsp = Math.exp(-Math.pow(Math.log(f0 / 118) / 0.07, 2)); lo *= 1 - 0.65 * P.deadspot * dsp;
    if (pr.abs) { lo = 0.03; hi = 0.012; }
    const B = pr.stiff * P.stiff * (round ? 3.5e-4 : 2.2e-4) * Math.pow(f0 / (440 * Math.pow(2, (O - 69) / 12)), 1.0);
    this.design(f0, lo, hi, B, pr.stiff > 0 && P.stiff > 0, 0);
    const o = this.dsg;
    s.reset(); // schoon begin
    s.act = 1; s.gen = c.gen; s.note = c.note; s.f0 = f0; s.art = art; s.open = open;
    s.D = s.Dt = o.Dl; s.Np = s.Npt = o.Np; s.c = s.ct = o.c; s.g = s.gt = o.g; s.d = s.dt = o.d; s.gm = 1; s.og = 1;
    s.pmix = this.Q.pickMix; if (this.pickT === 1) { s.pb = 0.11; s.pn = 0.2; } else { s.pb = 0.075; s.pn = 0.215; }
    const buzz = P.buzz * pr.buzz;
    let th = 9; if (!this.fretless && pr.buzz > 0) th = lerp(0.42, 0.09, clampN(P.buzz, 0, 1)) * (open ? 2.6 : 1) * (pr.buzz >= 1.5 ? 0.85 : 1);
    s.th = th; s.kk = 0.25; s.bz = 0.7 * clampN(buzz * 0.5, 0, 1);
    s.tmk = P.tm * 2.0 * pr.tm; s.envK = 1 - Math.exp(-1 / (SR * 0.03));
    // niveau en positie
    const hl = hum * 1.6 * this.rnd();
    let ldb = pr.ldb + hl; if (art === A_FINGER || art === A_PULL || art === A_MUTE) ldb += 0; const A = REF * Math.pow(10, ldb / 20); s.A = A;
    const prb = pr.beta * (1 + 0.06 * c.rr * (0.4 + hum) + hum * 0.04 * this.rnd()); pr.beta = clampN(prb, 0.03, 0.48);
    pr.fcE *= (1 + 0.07 * c.rr * (0.4 + hum)) * Math.pow(STRHI[this.nS === 5 ? c.str : c.str + 1], 0.8) * (open ? 1.2 : 1);
    this.buildExc(s, pr, A, o.Np);
    // ruisstoten
    const nz = P.noise;
    if (pr.clack > 0) { s.nA.set(pr.clackFc, pr.clackQ); s.nAm = 0; s.nAa = A * pr.clack * (0.4 + 0.6 * nz) * 3.0; s.nAd = Math.exp(-1 / (SR * (art === A_PICK ? 0.004 : 0.006))); s.nAs = 1; }
    if (pr.thump > 0) { s.nB.set(pr.thumpFc, 0.9); s.nBm = 1; s.nBa = A * pr.thump * (0.4 + 0.6 * nz) * 2.2; s.nBd = Math.exp(-1 / (SR * (pr.dead ? 0.03 : 0.02))); s.nBs = 1; }
    if (pr.vfT) { biqSet(s.vf, 'peak', pr.vfFc, pr.vfQ, pr.vfG); s.useVf = 1; } else s.useVf = 0;
    s.mwAmt = this.fretless ? P.mwah * 0.9 : 0;
    this.noteUi(art === A_FINGER && smooth(0.55, 0.95, clampN((vel - P.ghostVel) / (1 - P.ghostVel), 0, 1)) > 0.5 ? A_PULL : art, c.str, c.fret, c.note);
  }
  legato(s, c) {
    if (!s.act) { c.type = 1; return this.noteOn(s, c); }
    const P = this.P, f0 = c.f, o = this.dsg, round = this.wound === 0;
    const O = this.open[c.str], A = s.A || REF;
    let lo = (round ? 7.0 : 4.2) * P.sustain * Math.pow(41 / f0, 0.3), hi = (round ? 0.8 : 0.16) * (0.4 + 1.6 * P.bright);
    hi *= STRHI[this.nS === 5 ? c.str : c.str + 1]; if (c.fret === 0) { lo *= 1.12; hi *= 1.1; } else lo /= 1 + 0.004 * Math.max(0, c.fret);
    const mu = P.mute; lo *= lerp(1, 0.12, mu); hi *= lerp(1, 0.4, mu);
    const dsp = Math.exp(-Math.pow(Math.log(f0 / 118) / 0.07, 2)); lo *= 1 - 0.65 * P.deadspot * dsp;
    const B = P.stiff * (round ? 3.5e-4 : 2.2e-4) * (f0 / (440 * Math.pow(2, (O - 69) / 12)));
    this.design(f0, lo, hi, B, P.stiff > 0, 0);
    const n = Math.max(1, Math.round(c.gl * SR));
    s.Dt = o.Dl; s.Npt = o.Np; s.ct = o.c; s.gt = o.g; s.dt = o.d;
    s.dD = (s.Dt - s.D) / n; s.dNp = (s.Npt - s.Np) / n; s.dc = (s.ct - s.c) / n; s.dg = (s.gt - s.g) / n; s.dd = (s.dt - s.d) / n; s.gl = n;
    s.gen = c.gen; s.note = c.note; s.f0 = f0; s.rel = 0; s.gm = 1; s.open = c.fret === 0 ? 1 : 0; s.og = 1; s.ogd = 0;
    // aanzet: hammer-on = tik, pull-off = kleine pluk, slide = glijruis
    const pr = this.pr; pr.wms = 2.5; pr.fcE = 1400 + 1500 * c.vel; pr.beta = P.pluckPos;
    const tick = c.kind === 1 ? 0.5 + 0.7 * c.vel : c.kind === 3 ? 0.65 : 0.15;
    this.buildExc(s, pr, A * tick * 0.5, o.Np);
    if (c.kind === 2 && P.noise > 0) { s.nB.set(2300, 1.3); s.nBm = 0; s.nBa = A * 0.3 * P.noise * (round ? 1 : 0.3) * (this.fretless ? 0.7 : 1); s.nBd = Math.exp(-1 / (SR * Math.max(0.03, c.gl) * 0.8)); s.nBs = 1; }
    else if (P.noise > 0) { s.nA.set(2600, 1.2); s.nAm = 0; s.nAa = A * 0.6 * c.vel * P.noise; s.nAd = Math.exp(-1 / (SR * 0.004)); s.nAs = 1; }
    this.noteUi(c.kind === 2 ? 8 : c.kind === 1 ? 9 : 10, c.str, c.fret, c.note);
  }
  noteUi(art, str, fret, note) {
    if (!this.ui) return;
    const t = this.T; if (t - this.uiT < 0.05) return; this.uiT = t; const o = this.uiO; o.art = art; o.str = str; o.fret = fret; o.note = note; this.uiPend = true;
  }
  // ---- renderen ----
  render(out, n, T0) {
    const bus = this.bus, S = this.S; this.T = T0;
    bus.fill(0, 0, n);
    this.setBus(false);
    for (let s = 0; s < 5; s++) S[s].pmix = this.Q.pickMix;
    let i = 0; const isr = ISR;
    while (i < n) {
      const tNow = T0 + i * isr;
      while (this.qn > 0 && this.cm[this.q[0]].t <= tNow + 1e-9) { const k = this.shift(); const c = this.cm[k]; c.used = 0; this.dispatch(c); }
      let end = n;
      if (this.qn > 0) { const k = Math.ceil((this.cm[this.q[0]].t - T0) * SR - 1e-9); if (k < end) end = k > i ? k : i + 1; }
      for (let s = 0; s < 5; s++) {
        const st = S[s]; if (!st.act) continue;
        st.run(bus, i, end, this.rndF, this.fretless);
      }
      i = end;
    }
    // idle en bewaker
    let any = this.qn > 0; for (let s = 0; s < 5; s++) if (S[s].act) any = true;
    if (any) this.idle = 0; else if (this.idle < 100000) this.idle++;
    if (!any && this.idle > 400) { if (this.idle === 401) this.resetBus(); out.fill(0, 0, n); return; }
    // bewaker
    for (let s = 0; s < 5; s++) {
      const st = S[s]; if (!st.act) continue;
      if (!st.ok()) { st.reset(); continue; }
      if (st.og <= 0 && st.ogd === 0) { st.reset(); continue; }
      if (st.exPos >= st.exLen && st.env < 1e-12 && st.nAa < 1e-6 && st.nBa < 1e-6 && st.gl === 0) st.reset();
    }
    this.busRun(out, n);
  }
  resetBus() {
    for (const f of [this.pk, this.bd1, this.bd2, this.dc, this.eL, this.eM, this.eH, this.eP, this.cHp, this.cLp1, this.cLp2, this.cPk]) { f.z1 = 0; f.z2 = 0; }
    this.shp.reset(); this.shp1.reset(); this.cdet = 0;
  }
  busRun(out, n) {
    const bus = this.bus, Q = this.Q, P = this.P, pk = this.pk, bd1 = this.bd1, bd2 = this.bd2, dc = this.dc, eL = this.eL, eM = this.eM, eH = this.eH, eP = this.eP;
    const dr = Q.drive, dg = 1 + 9 * dr * dr, bias = 0.12 * dr, cab = Q.cab, comp = Q.comp, vol = 3.4 * Q.vol * Q.vol, ratio = 1 + 5 * comp, makeup = 1 + 1.4 * comp;
    const ak = 1 - Math.exp(-1 / (SR * 0.004)), rk = 1 - Math.exp(-1 / (SR * 0.14)), thr = 0.1, sh = this.shp, os = this.os, sh1 = this.shp1;
    const tb = Math.tanh(bias), dcmp = 1 / Math.pow(dg, 0.8);
    let det = this.cdet;
    for (let i = 0; i < n; i++) {
      let x = bus[i] * 1.0;
      x = biqRun(pk, x); x = biqRun(bd1, x); x = biqRun(bd2, x); x = biqRun(dc, x);
      x = biqRun(eL, x); x = biqRun(eM, x); x = biqRun(eH, x); x = biqRun(eP, x);
      if (comp > 0.002) {
        const a = x < 0 ? -x : x; det += (a > det ? ak : rk) * (a - det);
        if (det > thr) x *= Math.exp((1 / ratio - 1) * Math.log(det / thr)); x *= makeup;
      }
      if (!(x > -50 && x < 50)) x = 0;
      let y = os === 2 ? sh.run(x * dg + bias) : sh1.run(x * dg + bias);
      y = (y - tb) * dcmp;
      if (cab > 0.001) { let z = biqRun(this.cHp, y); z = biqRun(this.cLp2, biqRun(this.cLp1, z)); z = biqRun(this.cPk, z); y = y * (1 - cab) + z * cab * 1.15; }
      y *= vol;
      let a = y < 0 ? -y : y; if (a > 0.7) a = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3);
      y = y < 0 ? -a : a;
      out[i] = y === y ? y : 0;
    }
    this.cdet = det > 1e6 || det !== det ? 0 : (det < 1e-25 ? 0 : det);
    // bewaker voor de bus
    const chk = f => { if (!(f.z1 > -1e6 && f.z1 < 1e6 && f.z2 > -1e6 && f.z2 < 1e6)) { f.z1 = 0; f.z2 = 0; } else { if (f.z1 < 1e-25 && f.z1 > -1e-25) f.z1 = 0; if (f.z2 < 1e-25 && f.z2 > -1e-25) f.z2 = 0; } };
    chk(pk); chk(bd1); chk(bd2); chk(dc); chk(eL); chk(eM); chk(eH); chk(eP); chk(this.cHp); chk(this.cLp1); chk(this.cLp2); chk(this.cPk);
    if (!sh.ok() || !sh1.ok()) { sh.reset(); sh1.reset(); }
  }
}

class FunkBassProcessor extends AudioWorkletProcessor {
  constructor() {
    super(); this.e = new Engine(); this.n = 0;
    this.port.onmessage = ev => { try { this.e.msg(ev.data); } catch (err) {} };
  }
  process(inputs, outputs) {
    const o = outputs[0]; if (!o || !o[0]) return true;
    try {
      const n = o[0].length; this.e.render(o[0], n, currentTime);
      for (let c = 1; c < o.length; c++) o[c].set(o[0]);
      if (this.e.uiPend) { this.e.uiPend = false; this.port.postMessage(this.e.uiO); }
    } catch (err) { o[0].fill(0); }
    return true;
  }
}
registerProcessor(WNAME, FunkBassProcessor);
`;
export default {
  id: 'nl.patchkamer.funkbass', name: 'Funk Bass', version: '1.0.0', kind: 'instrument', category: 'synth',
  ui: { width: 460, minWidth: 300 },
  about: {
    nl: 'Basgitaar voor soul, funk en jazz, als fysisch model zonder samples: een golfgeleider per snaar met stijfheid, demping die met de frequentie meegaat, plukpositie, snaar-tegen-fret-rammel, pickups (brug en hals), hals- en bodyresonanties, toonregeling, compressie en drive. Vier of vijf snaren (lage B), vlakwond of roundwound, vingers of plectrum, optioneel fretless met mwah.\n\nVerbind een sequencer of keyboard met Noten en de uitgang met een mixer. De aanslag kies je met de velocity: tot "Dode noot tot" is het een gedempte snaar (ghost note), daarboven een vingeraanslag die naar boven toe harder wordt (pull, de snaar tegen de frets), vanaf "Slap vanaf" een duimslag en vanaf "Pop vanaf" een pop (de snaar wordt weggetrokken en klapt tegen de frets). Een heel korte noot (korter dan "Dode noot korter dan") is ook een dode noot. Een octaafsprong omhoog direct na een slap is een pop (Octaaf is pop).\n\nWil je de aanslag vastleggen, speel dan een toets van 0 tot en met 11 (C-1 tot en met B-1): 0 is automatisch (velocity-zones), 1 vinger, 2 pull, 3 slap, 4 pop, 5 dode noot, 6 palm mute, 7 flageolet, 8 plectrum. Die keuze blijft staan tot de volgende toets; een cc "art" (0 tot 8 gedeeld door 8) doet hetzelfde.\n\nOverlappen twee noten op dezelfde snaar, dan hoor je een hammer-on, pull-off of slide, afhankelijk van de afstand en de keuze Hammer-on en slide (de glijtijd stel je in). Een nieuwe noot op dezelfde snaar dempt de vorige; noten op andere snaren klinken uit. De snaarkeuze volgt Positie: laag = open snaren en lage frets (funk), hoog = dikke snaren en hoge frets (jazz). Fretless zet de fretrammel uit en voegt mwah toe.',
    en: 'A bass guitar for soul, funk and jazz, as a physical model without samples: one waveguide per string with stiffness, frequency-dependent damping, pluck position, string-against-fret buzz, pickups (bridge and neck), neck and body resonances, tone controls, compression and drive. Four or five strings (low B), flatwound or roundwound, fingers or pick, optionally fretless with mwah.\n\nConnect a sequencer or keyboard to Notes and the output to a mixer. You choose the attack with the velocity: up to "Dead note up to" it is a muted string (ghost note), above that a fingerstyle pluck that gets harder towards the top (pull, the string against the frets), from "Slap from" a thumb slap and from "Pop from" a pop (the string is pulled away and snaps against the frets). A very short note (shorter than "Dead note shorter than") is also a dead note. An octave jump up right after a slap is a pop (Octave is pop).\n\nTo fix the articulation, play a key from 0 to 11 (C-1 to B-1): 0 is automatic (velocity zones), 1 finger, 2 pull, 3 slap, 4 pop, 5 dead note, 6 palm mute, 7 harmonic, 8 pick. That choice stays until the next key; a cc "art" (0 to 8 divided by 8) does the same.\n\nIf two notes on the same string overlap, you hear a hammer-on, pull-off or slide, depending on the distance and the Hammer-on and slide choice (you set the glide time). A new note on the same string damps the previous one; notes on other strings ring on. String choice follows Position: low = open strings and low frets (funk), high = thick strings and high frets (jazz). Fretless turns the fret buzz off and adds mwah.',
  },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Bass out' }], eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Bas uit', notes: 'Keyboard / noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const defaults = {};
    for (const [id, d] of Object.entries(SPEC)) defaults[id] = d[4];
    Object.assign(defaults, SEL_DEF, BOOLS);
    let state = { ...defaults }, effective = { ...defaults }, mod = {}, dead = false, node = null, warn = null, root = null, statusEl = null, uiOn = false;
    const ui = { knobs: {}, sels: {}, btns: {} };
    const pending = [], out = ctx.createGain(); out.gain.value = 1;
    const resolve = () => {
      const r = { ...state };
      for (const [id, d] of Object.entries(SPEC)) {
        const o = mod[id] || 0;
        r[id] = d[6] === 'log' ? clamp(state[id] * Math.pow(d[2] / d[1], o), d[1], d[2]) : clamp(state[id] + o * (d[2] - d[1]), d[1], d[2]);
      }
      return r;
    };
    function apply() {
      if (dead) return; effective = resolve();
      const p = {};
      for (const id of Object.keys(SPEC)) p[id] = effective[id];
      for (const k of Object.keys(SELECTS)) p[k] = SELECTS[k].indexOf(state[k]);
      for (const k of Object.keys(BOOLS)) p[k] = state[k] ? 1 : 0;
      if (node) node.port.postMessage({ type: 'params', p });
      else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); }
    }
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 256) pending.push(m); };
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
      node.port.onmessage = e => { const d = e && e.data; if (d && typeof d.art === 'number') showLast(d); };
      node.connect(out); node.port.postMessage({ type: 'os', n: host.audio && host.audio.oversample === 'none' ? 1 : 2 }); apply();
      pending.splice(0).forEach(m => { if (m.type === 'params') return; if (m.t === undefined || m.t > ctx.currentTime - 0.05) node.port.postMessage(m); });
      if (uiOn) node.port.postMessage({ type: 'ui', on: true });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Funk Bass kan hier geen geluid maken.'); });

    // ---- noten ----
    const ART_NAME = ['Dood', 'Vinger', 'Pull', 'Slap', 'Pop', 'Palm mute', 'Flageolet', 'Plectrum-aanslag', 'Slide', 'Hammer-on omhoog', 'Pull-off'];
    const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const noteName = m => NOTE[m % 12] + (Math.floor(m / 12) - 1);
    const STR_NAME = ['B', 'E', 'A', 'D', 'G'];
    function showLast(d) {
      if (!statusEl) return;
      const five = state.strings === '5', si = (five ? d.str : d.str + 1), nm = STR_NAME[clamp(si, 0, 4)] || '?';
      const t = tx('Laatste noot: {0} · snaar {1} · fret {2} · {3}', tx(ART_NAME[d.art] || ''), nm, String(d.fret), noteName(d.note));
      if (statusEl.textContent !== t) statusEl.textContent = t;
    }
    function playNote(n, vel, t, dur) { post({ type: 'note', note: n, vel, t, dur }); }
    function panic() { pending.length = 0; apply(); if (node) node.port.postMessage({ type: 'stop' }); }
    const LICKS = {
      dead: [[40, 0.1, 0, 0.1], [40, 0.12, 0.2, 0.1]],
      finger: [[40, 0.6, 0, 0.5]],
      pull: [[40, 0.75, 0, 0.5]],
      slap: [[40, 0.88, 0, 0.35]],
      pop: [[52, 0.98, 0, 0.35]],
      octave: [[40, 0.88, 0, 0.18], [52, 0.97, 0.25, 0.18], [40, 0.88, 0.5, 0.18], [52, 0.97, 0.75, 0.18]],
      hammer: [[43, 0.7, 0, 0.5], [45, 0.7, 0.4, 0.5]],
      slide: [[40, 0.7, 0, 0.6], [47, 0.7, 0.5, 0.6]],
    };
    function lick(id) {
      const t0 = ctx.currentTime + 0.03;
      post({ type: 'ks', n: 0 });
      for (const [n, v, dt, d] of LICKS[id]) playNote(n, v, t0 + dt, d);
    }

    // ---- UI ----
    const CSS = `
:host{display:block}
.fb{container-type:inline-size;display:grid;gap:8px;min-width:0;color:var(--fg,#dce1e8);font:11px/1.4 var(--mono,ui-monospace,Menlo,monospace);
  --ln:var(--line,#2a3039);--c2:var(--card-2,#1e232c);--mu:var(--muted,#7d8794);--ev:var(--event,#f4a261);--au:var(--audio,#4fd1c5)}
button,select{font:500 11px/1 var(--disp,system-ui,sans-serif);letter-spacing:.06em;background:var(--c2);color:inherit;border:1px solid var(--ln);border-radius:3px;padding:6px 8px;cursor:pointer;min-width:0}
select{letter-spacing:0;background:var(--field,var(--c2));color:var(--field-fg,inherit)}
button:hover{border-color:var(--au)}
button:focus-visible,select:focus-visible{outline:1px solid var(--au);outline-offset:2px}
button[aria-pressed="true"]{background:var(--ev);border-color:var(--ev);color:#160e05}
.sec{display:grid;gap:6px;align-content:start;padding:8px;border:1px solid var(--ln);border-radius:6px;min-width:0}
.sec h4{margin:0;font:600 10px/1.2 var(--disp,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.sels{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:6px 10px}
.sels .k{grid-template-columns:minmax(0,1fr)!important;gap:2px}
.sels select{width:100%;min-width:0}
.knobs{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:4px 14px;align-items:center}
.k{display:grid;grid-template-columns:88px minmax(40px,1fr) 44px;gap:6px;align-items:center;min-width:0;min-height:24px}
.k label{font-size:10px;line-height:1.15;letter-spacing:.02em;color:var(--mu);overflow-wrap:break-word;hyphens:auto;min-width:0}
.k output{font-size:10px;white-space:nowrap;text-align:right;color:var(--fg)}
.k input[type=range]{width:100%;min-width:0;margin:0;height:22px;cursor:pointer;accent-color:var(--audio,#4fd1c5)}
.k .kn{display:none}
.k[data-pk-face=rotary]{grid-template-columns:1fr;justify-items:center;text-align:center;gap:2px}
.k[data-pk-face=rotary] label{order:2;text-align:center}
.k[data-pk-face=rotary] output{order:3;text-align:center}
.k[data-pk-face=rotary] .kn{display:block;order:1}
.k[data-pk-face=rotary] input[type=range]{display:none}
.stat{font-size:10px;color:var(--mu);min-height:14px}
.warn{margin:0;font-size:10px;color:var(--mu)}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;
    const mk = (tag, cls, parent, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; if (parent) parent.appendChild(e); return e; };
    const adopt = (el, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    const pressed = (b, on) => { if (b) b.setAttribute('aria-pressed', String(!!on)); };
    const fmtOf = (id, v) => {
      const d = SPEC[id], u = d[5];
      if (u === '%') return Math.round(v * 100) + '%';
      if (u === 'x') return v.toFixed(2) + '×';
      if (u === 'ms') return Math.round(v) + ' ms';
      if (u === 's') return Math.round(v * 1000) + ' ms';
      if (u === 'ct') return (v > 0 ? '+' : '') + Math.round(v) + ' ct';
      if (u === 'st') return (v > 0 ? '+' : '') + Math.round(v) + ' st';
      if (u === 'vel') return v > 1 ? tx('Uit') : String(Math.round(v * 127));
      if (u === 'tone') return (v > 0 ? '+' : '') + (v * 12).toFixed(1) + ' dB';
      return String(v);
    };
    function knob(parent, id) {
      const d = SPEC[id], log = d[6] === 'log';
      ui.knobs[id] = host.ui.knob(parent, tx(d[0]), [d[1], d[2], d[3]], state[id], v => fmtOf(id, v), v => { state[id] = Number(clamp(v, d[1], d[2]).toFixed(6)); apply(); }, log ? { default: d[4], id, role: 'param', group: d[10], scale: 'log' } : { default: d[4], id, role: 'param', group: d[10] });
    }
    function select(parent, id, label, opts) {
      const s = host.ui.select(parent, tx(label), opts.map(([v, t]) => [v, tx(t)]), state[id], v => { if (SELECTS[id].includes(v)) { state[id] = v; apply(); paint(); } }, { id, group: 'sound' });
      ui.sels[id] = s; return s;
    }
    function toggle(parent, id, label, group) {
      const b = mk('button', '', parent, tx(label)); b.type = 'button'; b.onclick = () => { state[id] = !state[id]; apply(); paint(); }; adopt(b, id, 'toggle', group, b.textContent); ui.btns[id] = b; return b;
    }
    function paint() {
      for (const id in ui.knobs) ui.knobs[id].set(state[id]);
      for (const k in ui.sels) ui.sels[k].value = state[k];
      for (const k in ui.btns) pressed(ui.btns[k], !!state[k]);
      if (ui.mwahK && ui.mwahK.el) ui.mwahK.el.style.opacity = state.fretless ? '' : '.4';
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount();
        const wrap = document.createElement('div'); el.appendChild(wrap);
        root = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;
        const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
        const app = mk('div', 'fb', root);
        ui.knobs = {}; ui.sels = {}; ui.btns = {};
        // keuzes
        const s0 = mk('div', 'sec', app); const sels = mk('div', 'sels', s0);
        select(sels, 'strings', 'Snaren', [['4', '4 snaren'], ['5', '5 snaren (lage B)']]);
        select(sels, 'wound', 'Snaartype', [['round', 'Roundwound'], ['flat', 'Vlakwond']]);
        select(sels, 'tech', 'Techniek', [['fingers', 'Vingers'], ['pick', 'Plectrum']]);
        select(sels, 'pickup', 'Pickuptype', [['single', 'Single-coil'], ['hum', 'Humbucker']]);
        select(sels, 'legato', 'Hammer-on en slide', [['auto', 'Automatisch'], ['hammer', 'Hammer-on'], ['slide', 'Slide'], ['off', 'Uit']]);
        select(sels, 'eq', 'Toonregeling', [['active', 'Actief'], ['passive', 'Passief']]);
        const r0 = mk('div', 'row', s0); toggle(r0, 'fretless', 'Fretless', 'mode'); toggle(r0, 'autoPop', 'Octaaf is pop', 'mode'); toggle(r0, 'keyswitch', 'Keyswitches', 'mode');
        // proefknoppen
        const s1 = mk('div', 'sec', app); mk('h4', '', s1, tx('Proef')); const r1 = mk('div', 'row', s1);
        [['dead', 'Dood'], ['finger', 'Vinger'], ['pull', 'Pull'], ['slap', 'Slap'], ['pop', 'Pop'], ['octave', 'Octaaf-slap'], ['hammer', 'Hammer-on'], ['slide', 'Slide omhoog']].forEach(([id, l]) => { const b = mk('button', '', r1, tx(l)); b.type = 'button'; b.onclick = () => lick(id); adopt(b, 'try.' + id, 'button', 'try', b.textContent); });
        const ba = mk('button', '', r1, tx('Alles uit')); ba.type = 'button'; ba.onclick = () => panic(); adopt(ba, 'try.off', 'button', 'try', ba.textContent);
        statusEl = mk('div', 'stat', s1, '');
        const group = (title, ids, grp) => { const s = mk('div', 'sec', app); mk('h4', '', s, tx(title)); const k = mk('div', 'knobs', s); ids.forEach(id => knob(k, id)); return s; };
        group('Snaar', ['sustain', 'bright', 'stiff', 'buzz', 'tm', 'deadspot'], 'string');
        group('Spel', ['ghostVel', 'slapVel', 'popVel', 'ghostDur', 'pluckPos', 'touch', 'pos', 'glide', 'rel', 'mute', 'noise', 'human', 'tune', 'transpose'], 'play');
        group('Pickups', ['pickMix', 'body', 'mwah'], 'pickup');
        group('Versterker', ['bass', 'mid', 'treble', 'drive', 'comp', 'cab', 'vol'], 'amp');
        warn = mk('p', 'warn', app, node ? '' : tx('AudioWorklet laden…'));
        paint(); uiOn = true;
        if (node) node.port.postMessage({ type: 'ui', on: true });
      },
      unmount() {
        uiOn = false; if (node) node.port.postMessage({ type: 'ui', on: false });
        if (root && root.host) { const w = root.host; if (w.parentNode) w.parentNode.removeChild(w); } else if (root && root.parentNode) root.innerHTML = '';
        root = null; warn = null; statusEl = null; ui.knobs = {}; ui.sels = {}; ui.btns = {};
      },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'notes' || !ev) return;
          const time = Number.isFinite(ev.time) ? Math.min(ev.time, ctx.currentTime + 30) : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(ev.note)) {
            const n = clamp(Math.round(ev.note), 0, 127);
            if (type === 'noteoff' || ev.vel === 0 || ev.off) post({ type: 'off', note: n, t });
            else {
              const vel = Number.isFinite(ev.vel) ? clamp(ev.vel, 0, 1) : 0.8;
              if (type === 'noteon' || ev.held === true || !Number.isFinite(ev.dur)) post({ type: 'on', note: n, vel, t });
              else post({ type: 'note', note: n, vel, t, dur: clamp(ev.dur, 0.005, 3600) });
            }
          } else if (type === 'cc' && Number.isFinite(ev.value)) {
            const id = String(ev.id || ''), v = clamp(ev.value, 0, 1);
            if (id === 'art') { post({ type: 'ks', n: Math.round(v * 8), t }); return; }
            if (Object.hasOwn(SPEC, id)) { const d = SPEC[id]; state[id] = Number(clamp(Math.round((d[1] + v * (d[2] - d[1])) / d[3]) * d[3], d[1], d[2]).toFixed(6)); apply(); paint(); }
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) { /* nooit de planner laten struikelen */ }
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(SPEC).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: tx(d[0]), lane: d[10], laneName: ({ string: tx('Snaar'), play: tx('Spel'), pickup: tx('Pickups'), amp: tx('Versterker') })[d[10]] || 'Funk Bass', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
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
        state = next; apply(); paint();
      },
      destroy() {
        if (dead) return; dead = true;
        try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) { /* los */ }
        node = null; pending.length = 0; root = null; statusEl = null;
      },
    };
    apply(); return self;
  },
};
