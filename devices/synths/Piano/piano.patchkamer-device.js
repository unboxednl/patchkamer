// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.22.0 — Uitleg naar about (menu Over Piano); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (vleugel, pianino en e-piano) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.20.0 — Eerste uitgave van Piano (contract v1.20). Eigen motor als AudioWorklet (PianoEngine): 40 stemmen, modale synthese met meerdere pianotypen.
//   - elke noot is een bank van gedempte trillers (onharmonische deeltonen met snaarstijfheid, tweetraps uitklank, voor lage noten langer en hoge deeltonen korter),
//     1 tot 3 licht verstemde snaren per noot, hamerpunt (kam in het spectrum), aanslagkleur door hamerhardheid en velocity, hamergeluid
//   - typen: Vleugel, Pianino, Honky-tonk (verstemd), Tine-e-piano (zachte klokachtige tongen, tremolo), Riet-e-piano (blaf, drive), Clavichord (getokkeld)
//   - sustainpedaal (cc pedal/sustain/64, of de knop op de kaart), dempertijd bij loslaten, klankbord/kast (parallelle resonanties), stereopositie per toonhoogte
//   - tweetalig (host.lang; poortnamen per taal in i18n); setState volgt §13 (afkappen, ongeldig = standaard, zachte overgang in de motor)
//   - bewaker in de worklet: alleen eindige berichten, oscillatoren worden per blok op eindigheid gecontroleerd en verwijderd, de uitgang wordt begrensd
/** Piano — a polyphonic acoustic piano family (grand, upright, honky-tonk) with tine and reed electric pianos and a clavichord. Stereo; 40 voices.
 * Notes arrive on the orange input: {type:'note',note,vel,time,dur}; noteon/noteoff and note-without-dur hold keys.
 * Sustain pedal: {type:'cc', id:'pedal'|'sustain' (or cc:64), value>=0.5}. No internal sequencer. Transport stop and panic release everything.
 * The purple mod input exposes the continuous controls.
 */
const EN = {
  'Helderheid': 'Brightness', 'Aanslagkleur': 'Velocity colour', 'Aanslagpunt': 'Strike point', 'Inharmoniciteit': 'Inharmonicity', 'Snaarverstemming': 'String detune',
  'Klankduur': 'Sustain length', 'Naklank': 'Aftersound', 'Dempertijd': 'Damper time', 'Hamergeluid': 'Hammer noise', 'Klankbord': 'Soundboard',
  'Kastafstemming': 'Body tuning', 'Tremolo': 'Tremolo', 'Tremolosnelheid': 'Tremolo rate', 'Drive': 'Drive', 'Stereobreedte': 'Stereo width',
  'Aanslaggevoeligheid': 'Touch response', 'Stemming': 'Tuning', 'Transpositie': 'Transpose', 'Uitgang': 'Output',
  'Vleugel': 'Grand', 'Pianino': 'Upright', 'Honky-tonk': 'Honky-tonk', 'Tine e-piano': 'Tine e-piano', 'Riet e-piano': 'Reed e-piano', 'Clavichord': 'Clavichord',
  'Type': 'Type', 'Klank': 'Sound', 'Toon & snaren': 'Tone & strings', 'Uitklank & klankbord': 'Decay & body', 'Elektrisch': 'Electric', 'Spel & niveau': 'Playing & level',
  'Eigen klank': 'Custom sound', 'Proeftoon': 'Test note', 'Proefakkoord': 'Test chord', 'Pedaal': 'Pedal', 'Alles uit': 'All off',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Piano kan hier geen geluid maken.': 'AudioWorklet not available: Piano cannot make sound here.',
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan]
const SPEC = {
  tone: ['Helderheid', 0, 1, 0.01, 0.5, '%', 'lin', 'filter', 0.025, true],
  velBright: ['Aanslagkleur', 0, 1, 0.01, 0.6, '%', 'lin', 'level', 0.015, false],
  strike: ['Aanslagpunt', 0.04, 0.4, 0.005, 0.125, '%', 'lin', 'color', 0.02, false],
  inharm: ['Inharmoniciteit', 0, 2, 0.01, 1, '%', 'lin', 'color', 0.02, false],
  detune: ['Snaarverstemming', 0, 25, 0.5, 3, 'cent', 'lin', 'detune', 0.015, false],
  decay: ['Klankduur', 0.2, 4, 0.01, 1, 'x', 'log', 'decay', 0.02, false],
  after: ['Naklank', 0, 1, 0.01, 0.5, '%', 'lin', 'env', 0.02, false],
  release: ['Dempertijd', 0.03, 2, 0.01, 0.25, 's', 'log', 'decay', 0.02, false],
  hammer: ['Hamergeluid', 0, 1, 0.01, 0.4, '%', 'lin', 'texture', 0.02, true],
  body: ['Klankbord', 0, 1, 0.01, 0.4, '%', 'lin', 'res', 0.02, true],
  bodyTune: ['Kastafstemming', 0.5, 2, 0.01, 1, 'x', 'log', 'res', 0.015, false],
  tremolo: ['Tremolo', 0, 1, 0.01, 0, '%', 'lin', 'motion', 0.02, true],
  tremRate: ['Tremolosnelheid', 0.5, 9, 0.1, 4.5, 'Hz', 'log', 'motion', 0.01, false],
  drive: ['Drive', 0, 1, 0.01, 0, '%', 'lin', 'color', 0.02, true],
  width: ['Stereobreedte', 0, 1, 0.01, 0.6, '%', 'lin', 'pan', 0.02, true],
  velocity: ['Aanslaggevoeligheid', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false],
  tune: ['Stemming', -100, 100, 1, 0, 'cent', 'lin', 'pitch', 0.005, false],
  transpose: ['Transpositie', -24, 24, 1, 0, 'st', 'lin', 'pitch', 0.001, false],
  level: ['Uitgang', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false]
};
// transpose zit niet in de motor: de kaart verschuift het nootnummer
const MODEX = ['transpose'];
const TYPE_IDS = ['grand', 'upright', 'honky', 'tine', 'reed', 'clav'];
const TYPE_LABEL = { grand: 'Vleugel', upright: 'Pianino', honky: 'Honky-tonk', tine: 'Tine e-piano', reed: 'Riet e-piano', clav: 'Clavichord' };
const RANGES = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, [d[1], d[2], d[4]]]));
RANGES.type = [0, 5, 0];
const PRESETS = {
  'Concert Grand': { type: 'grand' },
  'Studio Upright': { type: 'upright', tone: 0.45, inharm: 1.1, decay: 0.9, body: 0.55, hammer: 0.5, width: 0.5 },
  'Honky-tonk': { type: 'honky', tone: 0.62, detune: 14, inharm: 1.2, decay: 0.9, body: 0.5, hammer: 0.5, width: 0.7 },
  'Tine Piano': { type: 'tine', tone: 0.5, inharm: 0, detune: 1.5, decay: 1.3, after: 0.6, release: 0.3, hammer: 0.35, body: 0.2, tremolo: 0.35, tremRate: 4.5, width: 0.7 },
  'Reed Piano': { type: 'reed', tone: 0.55, inharm: 0.05, detune: 1.5, decay: 1.1, after: 0.6, release: 0.3, hammer: 0.3, body: 0.2, tremolo: 0.25, drive: 0.3, width: 0.6 },
  'Clavichord': { type: 'clav', tone: 0.55, strike: 0.2, inharm: 0.4, detune: 2, decay: 0.8, after: 0.15, release: 0.08, hammer: 0.6, body: 0.45, bodyTune: 1.2, width: 0.4 },
  'Soft Felt Piano': { type: 'grand', tone: 0.2, velBright: 0.3, decay: 0.9, after: 0.6, release: 0.35, hammer: 0.25, body: 0.5, width: 0.7 },
  'Bright Pop Grand': { type: 'grand', tone: 0.8, velBright: 0.8, strike: 0.11, decay: 0.8, hammer: 0.5, body: 0.3, width: 0.8 }
};
const WNAME = 'nl-patchkamer-piano-1-20-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const NV = 40, MAXA = 32, MAXO = 64, CHMAX = 128, TWO_PI = Math.PI * 2;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const sclip = x => (x >= 3 ? 1 : x <= -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x));
// per type: inh = snaarstijfheid, nc = deeltoonnummer van de hamerrolloff, dec = klankduur, hd = hamergeluid-duur (s), hl = hamergeluid-kleur, hm = hamergeluid-sterkte, bs = kastgrootte
const TYPES = [
  { inh: 1, nc: 16, dec: 1, hd: 0.012, hl: 0.25, hm: 1, bs: 1 },
  { inh: 1.7, nc: 11, dec: 0.6, hd: 0.018, hl: 0.2, hm: 1.5, bs: 1.5 },
  { inh: 1.3, nc: 20, dec: 0.8, hd: 0.012, hl: 0.3, hm: 1.1, bs: 1.1 },
  { inh: 0, nc: 6, dec: 1.3, hd: 0.03, hl: 0.15, hm: 0.8, bs: 0.8 },
  { inh: 0.05, nc: 7, dec: 1.1, hd: 0.02, hl: 0.15, hm: 0.7, bs: 0.8 },
  { inh: 0.4, nc: 12, dec: 0.28, hd: 0.004, hl: 0.6, hm: 1.3, bs: 1.3 }
];
const BODYF = [92, 168, 275, 450, 820], BODYG = [1, 0.8, 0.7, 0.5, 0.4];
class PianoEngine {
  constructor(sr) {
    this.sr = sr; this.q = []; this.rs = 0x2badf00d | 0; this.P = {}; this.S = {}; this.pedal = false; this.nextId = 1;
    for (const k in RANGES) { this.P[k] = RANGES[k][2]; this.S[k] = RANGES[k][2]; }
    this.S.bs = 1; this.tph = 0; this.dc = [0, 0, 0, 0]; this.bst = new Float64Array(20);
    this.bco = new Float64Array(20); this.mixL = new Float64Array(CHMAX); this.mixR = new Float64Array(CHMAX);
    this.bf = [new Float64Array(CHMAX), new Float64Array(CHMAX), new Float64Array(CHMAX)];
    this.v = Array.from({ length: NV }, () => this.blank());
  }
  blank() { return { st: 0, id: 0, note: 60, no: 0, X: new Float64Array(MAXO), Y: new Float64Array(MAXO), C: new Float64Array(MAXO), Sn: new Float64Array(MAXO),
    AF: new Float64Array(MAXO), AS: new Float64Array(MAXO), KF: new Float64Array(MAXO), KS: new Float64Array(MAXO), PN: new Float64Array(MAXO), BI: new Uint8Array(MAXO),
    g: new Float64Array(6), keyUp: false, fast: false, t0: 0, age: 0, peak: 0, hn: 0, hk: 0.99, hl: 0.3, hc: 1, nl: 0 }; }
  rnd() { let s = this.rs; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rs = s; return (s >>> 0) / 2147483648 - 1; }
  setParams(p) { if (!p || typeof p !== 'object') return; for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); } }
  insert(m) { if (this.q.length >= 2048) return; let i = this.q.length; while (i > 0 && this.q[i - 1].t > m.t) i--; this.q.splice(i, 0, m); }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'stop') { this.q.length = 0; this.pedal = false; for (const v of this.v) if (v.st) { this.damp(v, 0.15, 0); v.st = 2; } return; }
    if (!(typeof m.t === 'number' && isFinite(m.t))) return;
    if (m.type === 'pedal') { this.insert({ type: 'pedal', on: !!m.on, t: m.t }); return; }
    if (!(typeof m.note === 'number' && isFinite(m.note))) return;
    if (m.type === 'note') {
      const vel = typeof m.vel === 'number' && isFinite(m.vel) ? clampN(m.vel, 0, 1) : 0.8;
      if (vel <= 0) m = { type: 'off', note: m.note, t: m.t };
      else m = { type: 'note', note: clampN(m.note, 0, 127), vel, t: m.t, dur: typeof m.dur === 'number' && isFinite(m.dur) && m.dur > 0 ? clampN(m.dur, 0.005, 3600) : Infinity };
    } else if (m.type === 'off') m = { type: 'off', note: m.note, t: m.t }; else return;
    this.insert(m);
  }
  // alle deeltonen sneller laten uitsterven: rel = tijd voor 60 dB, hogere deeltonen sneller (pe)
  damp(v, rel, pe) {
    const sr = this.sr;
    for (let i = 0; i < v.no; i++) { const rk = Math.exp(-6.9078 * (1 + pe * v.PN[i]) / (Math.max(0.005, rel) * sr)); v.KF[i] *= rk; v.KS[i] *= rk; }
  }
  release(v) { v.st = 2; this.damp(v, Math.max(0.03, this.S.release), 0.2); }
  strings(type, note) {
    if (type === 0 || type === 1) return note < 33 ? 1 : note < 53 ? 2 : 3;
    if (type === 2) return note < 40 ? 2 : 3;
    if (type === 5) return note < 40 ? 1 : 2;
    return this.P.detune > 0.3 ? 2 : 1;
  }
  alloc() {
    let n = 0, vic = null;
    for (const v of this.v) if (v.st && !v.fast) { n++; if (!vic || (v.st > vic.st) || (v.st === vic.st && v.peak < vic.peak)) vic = v; }
    if (n >= 32 && vic) { vic.fast = true; this.damp(vic, 0.015, 0); }
    for (const v of this.v) if (v.st === 0) return v;
    let best = null; for (const v of this.v) if (v.fast && (!best || v.peak < best.peak)) best = v;
    return best || this.v[0];
  }
  addOsc(v, f, af, as, tf, ts, bi, pn) {
    const i = v.no, sr = this.sr; if (i >= MAXO || !(f > 0) || f > Math.min(sr * 0.45, 18000)) return;
    const w = TWO_PI * f / sr; v.C[i] = Math.cos(w); v.Sn[i] = Math.sin(w); v.X[i] = 1; v.Y[i] = 0; v.AF[i] = af; v.AS[i] = as;
    v.KF[i] = Math.exp(-6.9078 / (tf * sr)); v.KS[i] = Math.exp(-6.9078 / (ts * sr)); v.BI[i] = bi; v.PN[i] = pn; v.no = i + 1;
  }
  noteOn(m) {
    const P = this.P, sr = this.sr, ti = Math.round(clampN(P.type, 0, 5)), T = TYPES[ti], note = m.note, vel = m.vel;
    for (const o of this.v) if (o.st && o.note === note && !o.fast) { o.fast = true; this.damp(o, 0.03, 0); }
    const v = this.alloc();
    v.st = 1; v.id = this.nextId++; v.note = note; v.t0 = m.t; v.age = 0; v.keyUp = false; v.fast = false; v.no = 0; v.peak = 1; v.nl = 0;
    const d = clampN((note - 64) / 40, -1.2, 1.2), cents = P.tune + P.inharm * T.inh * 20 * d * Math.abs(d);
    const f0 = 440 * Math.pow(2, (note - 69) / 12 + cents / 1200), fmax = Math.min(sr * 0.45, 16000);
    const S = this.strings(ti, note), D = P.detune * (ti === 5 ? 0.6 : 1) * 0.5;
    const sd = S === 3 ? [-D, 0, D] : S === 2 ? [-D, D] : [0], sb = S === 3 ? [0, 2, 1] : S === 2 ? [0, 1] : [2];
    for (let s = 0; s < S; s++) sd[s] += D * 0.25 * this.rnd() * (ti === 2 ? 3 : 1);
    const nc = T.nc * Math.pow(2, 3 * (P.tone - 0.5)) * Math.pow(2, P.velBright * (vel - 0.6) * 3.5);
    const T60 = clampN(10 * Math.pow(2, -(note - 48) / 13) * T.dec * P.decay, 0.15, 24);
    const w = (0.1 + 0.6 * P.after) * (ti === 5 ? 0.4 : 1);
    const pos = P.strike, B = clampN(P.inharm * T.inh * 4e-4 * Math.pow(2, (note - 60) / 10), 0, 0.03);
    const list = []; // [verhouding, amplitude, T60, tweestrengen]
    if (ti === 3) {
      const vv = vel * (0.4 + P.tone), v2 = vel * vel * (0.5 + P.tone);
      list.push([1, 1, T60, true], [2, 0.12 + 0.45 * vv, T60 * 0.7, true], [3, 0.04 + 0.2 * vv, T60 * 0.4, false],
        [6.27, 0.22 * v2, 0.35 * Math.sqrt(P.decay), false], [17.55, 0.1 * v2, 0.15 * Math.sqrt(P.decay), false]);
    } else {
      for (let n = 1; n <= MAXA; n++) {
        const fn = n * f0 * Math.sqrt(1 + B * n * n); if (fn > fmax) break;
        let a;
        if (ti === 4) { a = Math.pow(n, -1.1) / (1 + Math.pow(n / nc, 2)); if (n === 2) a *= 1.9; else if (n === 3) a *= 1.3; }
        else { const comb = Math.max(0.08, Math.abs(Math.sin(Math.PI * n * pos))); a = comb / (1 + Math.pow(n / nc, 2)) / Math.pow(n, 0.55); }
        list.push([fn / f0, a, T60 / (1 + 0.1 * (n - 1) + Math.pow(fn / 4500, 2)), n <= 6]);
      }
    }
    let max = 0, e2 = 0; for (const l of list) { if (l[1] > max) max = l[1]; e2 += l[1] * l[1]; }
    const gain = (e2 > 0 ? 0.28 / Math.sqrt(e2) : 0) * ((1 - P.velocity) + P.velocity * Math.pow(vel, 1.4));
    for (const l of list) {
      if (l[1] < 0.004 * max) continue;
      const A = l[1] * gain, tt = Math.max(0.05, l[2]), fr = f0 * l[0];
      if (l[3] && S > 1) for (let s = 0; s < S; s++) this.addOsc(v, fr * Math.pow(2, sd[s] / 1200), A * (1 - w) / S, A * w / S, tt * 0.2, tt, sb[s], l[0]);
      else this.addOsc(v, fr, A * (1 - w), A * w, tt * 0.2, tt, 2, l[0]);
    }
    const pw = clampN(P.width, 0, 1), pan = clampN((note - 64) / 36, -1, 1) * pw * 0.75, sp = 0.05 + 0.2 * pw;
    [pan - sp, pan + sp, pan].forEach((p0, i) => { const a = (clampN(p0, -1, 1) + 1) * Math.PI / 4; v.g[i * 2] = Math.cos(a) * 1.414; v.g[i * 2 + 1] = Math.sin(a) * 1.414; });
    v.hn = P.hammer * T.hm * Math.pow(vel, 1.5) * 0.3; v.hk = Math.exp(-6.9078 / (T.hd * sr));
    v.hl = clampN(T.hl * (0.4 + vel * 1.2) * (0.5 + P.tone), 0.02, 0.9); v.hc = 1 / Math.sqrt(v.hl);
    if (Number.isFinite(m.dur)) this.insert({ type: 'gate', v, id: v.id, t: m.t + m.dur });
  }
  noteOff(m) { for (const v of this.v) if (v.st === 1 && v.note === m.note && !v.keyUp && v.t0 <= m.t) this.keyUp(v); }
  keyUp(v) { if (this.pedal) v.keyUp = true; else this.release(v); }
  event(m) {
    if (m.type === 'note') this.noteOn(m);
    else if (m.type === 'off') this.noteOff(m);
    else if (m.type === 'gate') { if (m.v.id === m.id && m.v.st === 1 && !m.v.keyUp) this.keyUp(m.v); }
    else if (m.type === 'pedal') { this.pedal = m.on; if (!m.on) for (const v of this.v) if (v.st === 1 && v.keyUp) this.release(v); }
  }
  chunk(b, e) {
    const n = e - b, mixL = this.mixL, mixR = this.mixR, b0 = this.bf[0], b1 = this.bf[1], b2 = this.bf[2], bufs = this.bf;
    for (const v of this.v) {
      if (v.st === 0) continue;
      b0.fill(0, 0, n); b1.fill(0, 0, n); b2.fill(0, 0, n);
      const { X, Y, C, Sn, AF, AS, KF, KS, BI } = v; let peak = 0;
      for (let i = 0; i < v.no; i++) {
        let x = X[i], y = Y[i], af = AF[i], as = AS[i]; const c = C[i], s = Sn[i], kf = KF[i], ks = KS[i], buf = bufs[BI[i]];
        for (let j = 0; j < n; j++) { const nx = x * c - y * s; y = x * s + y * c; x = nx; af *= kf; as *= ks; buf[j] += (af + as) * y; }
        const a = af + as;
        if (!(a > 1e-7 && a < 10 && x > -2 && x < 2 && y > -2 && y < 2)) { const l = v.no - 1; if (i !== l) { X[i] = X[l]; Y[i] = Y[l]; C[i] = C[l]; Sn[i] = Sn[l]; AF[i] = AF[l]; AS[i] = AS[l]; KF[i] = KF[l]; KS[i] = KS[l]; v.PN[i] = v.PN[l]; BI[i] = BI[l]; } v.no = l; i--; continue; }
        const r = 1.5 - 0.5 * (x * x + y * y); X[i] = x * r; Y[i] = y * r; AF[i] = af; AS[i] = as; if (a > peak) peak = a;
      }
      const g = v.g;
      for (let j = 0; j < n; j++) {
        let hs = 0;
        if (v.hn > 1e-5) { this.rs ^= this.rs << 13; this.rs ^= this.rs >>> 17; this.rs ^= this.rs << 5; const r = (this.rs >>> 0) / 2147483648 - 1; v.nl += v.hl * (r - v.nl); hs = v.nl * v.hc * v.hn; v.hn *= v.hk; }
        mixL[b + j] += b0[j] * g[0] + b1[j] * g[2] + b2[j] * g[4] + hs * g[4]; mixR[b + j] += b0[j] * g[1] + b1[j] * g[3] + b2[j] * g[5] + hs * g[5];
      }
      v.age += n; v.peak = peak + v.hn;
      if (v.no === 0 && !(v.hn > 1e-5)) { v.st = 0; v.fast = false; v.peak = 0; }
    }
  }
  render(L, R, len, t0) {
    const sr = this.sr, S = this.S, P = this.P, mixL = this.mixL, mixR = this.mixR;
    if (len > CHMAX) len = CHMAX;
    const kk = 1 - Math.exp(-len / (sr * 0.04));
    for (const k in S) { const tgt = k === 'bs' ? TYPES[Math.round(clampN(P.type, 0, 5))].bs : P[k]; if (!isFinite(S[k])) S[k] = tgt; S[k] += (tgt - S[k]) * kk; }
    mixL.fill(0, 0, len); mixR.fill(0, 0, len);
    let b = 0;
    while (b < len) {
      const tb = t0 + b / sr;
      while (this.q.length && this.q[0].t <= tb + 0.5 / sr) this.event(this.q.shift());
      let e = len;
      if (this.q.length) e = clampN(Math.ceil((this.q[0].t - t0) * sr - 0.5), b + 1, len);
      this.chunk(b, e); b = e;
    }
    // klankbord: parallelle resonanties; zachte tremolo; drive; gelijkspanningsfilter; begrenzer
    const bst = this.bst, bco = this.bco, dc = this.dc, bodyA = S.body * 0.6;
    for (let f = 0; f < 5; f++) { const fc = clampN(BODYF[f] * S.bodyTune * S.bs, 30, sr * 0.4), g = Math.tan(Math.PI * fc / sr), k = 1 / 6, a1 = 1 / (1 + g * (g + k)); bco[f * 4] = a1; bco[f * 4 + 1] = g * a1; bco[f * 4 + 2] = g * g * a1; bco[f * 4 + 3] = k * BODYG[f]; }
    const trem = clampN(S.tremolo, 0, 1), tw = TWO_PI * clampN(S.tremRate, 0.5, 9) / sr, drv = clampN(S.drive, 0, 1), gd = 1 + drv * 7, nd = 1 / Math.sqrt(gd), bias = 0.15 * drv, bz = sclip(bias), gain = S.level * 1.1;
    for (let j = 0; j < len; j++) {
      let l = mixL[j], r = mixR[j];
      if (!(l > -50 && l < 50)) l = 0; if (!(r > -50 && r < 50)) r = 0;
      if (trem > 0.001) { this.tph += tw; if (this.tph > TWO_PI) this.tph -= TWO_PI; const lf = Math.sin(this.tph); l *= 1 - trem * 0.45 * (1 + lf); r *= 1 - trem * 0.45 * (1 - lf); }
      if (drv > 0.001) { l = (sclip(l * gd + bias) - bz) * nd; r = (sclip(r * gd + bias) - bz) * nd; }
      for (let ch = 0; ch < 2; ch++) {
        const x = ch ? r : l, o = ch * 10; let acc = 0;
        if (bodyA > 0.001) for (let f = 0; f < 5; f++) {
          const i1 = o + f * 2, i2 = i1 + 1, ic1 = bst[i1], ic2 = bst[i2], q = f * 4, v3 = x - ic2, v1 = bco[q] * ic1 + bco[q + 1] * v3, v2 = ic2 + bco[q + 1] * ic1 + bco[q + 2] * v3;
          bst[i1] = 2 * v1 - ic1; bst[i2] = 2 * v2 - ic2; acc += v1 * bco[q + 3];
        }
        const y = x + bodyA * acc, hp = y - dc[ch] + 0.995 * dc[ch + 2]; dc[ch] = y; dc[ch + 2] = hp;
        const yy = sclip(hp * gain); if (ch) R && (this.outR = yy === yy ? yy : 0); else this.outL = yy === yy ? yy : 0;
      }
      L[j] = this.outL; if (R) R[j] = this.outR;
    }
    // bewaker: niet-eindige of absurde toestanden worden teruggezet
    for (let i = 0; i < 20; i++) if (!(bst[i] > -1e4 && bst[i] < 1e4)) bst[i] = 0;
    for (let i = 0; i < 4; i++) if (!(dc[i] > -1e4 && dc[i] < 1e4)) dc[i] = 0;
    if (!isFinite(this.tph)) this.tph = 0;
  }
}
class PkPiano extends AudioWorkletProcessor {
  constructor() { super(); this.e = new PianoEngine(sampleRate); this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} }; }
  process(inputs, outputs) { const o = outputs[0]; if (!o || !o[0]) return true; try { this.e.render(o[0], o[1], o[0].length, currentTime); } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); } return true; }
}
registerProcessor('${WNAME}', PkPiano);
`;
export default {
  id: 'nl.patchkamer.piano', name: 'Piano', version: '1.22.0', kind: 'instrument', category: 'synth',
  ui: { width: 720, minWidth: 340 },
  about: { nl: 'Polyfone pianofamilie: vleugel, pianino en e-piano.\n\nPiano speelt alleen ontvangen noten, met 40 stemmen: sluit een keyboard of sequencer aan op de oranje ingang Noten en stuur de stereo-uitgang naar een mixer. Noten met een lengte (dur) werken met sequencers, noteon/noteoff met aangehouden toetsen.\n\nHet pedaal houdt losgelaten noten klinkend (cc pedal, of de knop). Hardere aanslag klinkt helderder (Aanslagkleur).\n\nType kiest het instrument; de klanken in de lijst zetten type en knoppen samen. Een paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis.', en: 'A polyphonic piano family: grand, upright and electric piano.\n\nPiano plays received notes only, with 40 voices: connect a keyboard or sequencer to the orange Notes input and send the stereo output to a mixer. Notes with a length (dur) work with sequencers, noteon/noteoff with held keys.\n\nThe pedal keeps released notes sounding (cc pedal, or the button). Harder notes sound brighter (Velocity colour).\n\nType chooses the instrument; the sounds in the list set type and knobs together. A purple Mod cable controls sound parameters; the knobs stay the base.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo piano' }], eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo piano', notes: 'Keyboard / noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const spec = {}; for (const [id, d] of Object.entries(SPEC)) spec[id] = [tx(d[0]), ...d.slice(1)];
    const defaults = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, d[4]])); defaults.type = 'grand'; defaults.preset = 'Concert Grand';
    let state = { ...defaults }, effective = { ...defaults }, mod = {}, dead = false, root = null, controls = {}, presetSelect = null, typeSelect = null, pedalBtn = null, pedalOn = false, status = null, warn = null, node = null;
    const pending = [], out = ctx.createGain(); out.gain.value = 1;
    const resolve = () => { const r = { ...state }; for (const [id, d] of Object.entries(spec)) { const o = mod[id] || 0; r[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** o : state[id] + o * (d[2] - d[1]), d[1], d[2]); } return r; };
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 64) pending.push(m); };
    function apply() { if (dead) return; effective = resolve(); const p = {}; for (const k of Object.keys(SPEC)) p[k] = effective[k]; p.type = Math.max(0, TYPE_IDS.indexOf(state.type)); if (node) node.port.postMessage({ type: 'params', p }); else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); } }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.connect(out); apply(); pending.splice(0).forEach(m => { if (m.type !== 'params' && !(m.t > ctx.currentTime)) return; if (m.type !== 'params') node.port.postMessage(m); });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Piano kan hier geen geluid maken.'); });
    function noteOn(note, vel, t, dur) { post({ type: 'note', note: clamp(note + effective.transpose, 0, 127), vel, t, dur: Number.isFinite(dur) ? dur : -1 }); }
    function noteOff(note, t) { post({ type: 'off', note: clamp(note + effective.transpose, 0, 127), t }); }
    function setPedal(on, t) { pedalOn = on; if (pedalBtn) pedalBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); if (pedalBtn) pedalBtn.style.opacity = on ? '1' : '.75'; post({ type: 'pedal', on, t: Number.isFinite(t) ? t : ctx.currentTime }); }
    function panic() { pending.length = 0; apply(); pedalOn = false; if (pedalBtn) { pedalBtn.setAttribute('aria-pressed', 'false'); pedalBtn.style.opacity = '.75'; } if (node) node.port.postMessage({ type: 'stop' }); }
    function paint() { for (const k in controls) controls[k].set(state[k]); if (presetSelect) presetSelect.value = state.preset; if (typeSelect) typeSelect.value = state.type; if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : ''; status.hidden = !status.textContent; } }
    function change(id, value) { const d = spec[id]; if (!d || !Number.isFinite(+value)) return; state[id] = Number(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint(); }
    const fmt = (d, v) => d[5] === '%' ? (d[3] < 0.01 ? (v * 100).toFixed(1) : Math.round(v * 100)) + '%' : d[5] === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : d[5] === 'x' ? v.toFixed(2) + ' x' : d[5] === 'Hz' ? v.toFixed(1) + ' Hz' : v.toFixed(d[3] < 1 ? 1 : 0) + ' ' + d[5];
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount(); root = el;
        const css = document.createElement('style'); css.textContent = '.pn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px 18px;margin-top:4px}.pn-grid .k{grid-template-columns:124px minmax(90px,1fr) 62px;gap:8px;min-height:30px}.pn-grid .k label{font-size:10px;letter-spacing:.04em}.pn-grid .k output{font-size:11px;white-space:nowrap}.pn-grid input[type=range]{width:100%;min-width:90px;height:24px;margin:0;cursor:pointer;accent-color:var(--audio,#e4c697)}'; el.appendChild(css);
        typeSelect = host.ui.select(el, tx('Type'), TYPE_IDS.map(k => [k, tx(TYPE_LABEL[k])]), state.type, k => { if (TYPE_IDS.includes(k)) { state.type = k; state.preset = 'Custom'; apply(); paint(); } }, { id: 'type', group: 'type' });
        presetSelect = host.ui.select(el, tx('Klank'), Object.keys(PRESETS).map(k => [k, k]).concat([['Custom', tx('Eigen klank')]]), state.preset, name => { if (Object.hasOwn(PRESETS, name)) self.setState({ ...defaults, ...PRESETS[name], preset: name }); }, { id: 'preset', group: 'preset' });
        const groups = [[tx('Toon & snaren'), ['tone', 'velBright', 'strike', 'inharm', 'detune', 'hammer'], 'tone'], [tx('Uitklank & klankbord'), ['decay', 'after', 'release', 'body', 'bodyTune'], 'decay'],
          [tx('Elektrisch'), ['tremolo', 'tremRate', 'drive'], 'electric'], [tx('Spel & niveau'), ['width', 'velocity', 'tune', 'transpose', 'level'], 'play']];
        for (const [label, ids, grp] of groups) {
          const h = document.createElement('div'); h.textContent = label; h.style.cssText = 'font-size:12px;opacity:.8;border-top:1px solid var(--line);padding-top:8px;margin-top:9px'; el.appendChild(h);
          const grid = document.createElement('div'); grid.className = 'pn-grid'; el.appendChild(grid);
          for (const id of ids) { const d = spec[id], before = grid.children.length; controls[id] = host.ui.knob(grid, d[0], [d[1], d[2], d[3]], state[id], v => fmt(d, v), v => change(id, v), { default: defaults[id], id, group: grp }); const row = grid.children[before]; if (row) row.title = d[0]; }
        }
        const actions = document.createElement('div'); actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px'; el.appendChild(actions);
        const button = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); return b; };
        button(tx('Proeftoon'), () => noteOn(60, 0.8, ctx.currentTime + 0.01, 1.5)); button(tx('Proefakkoord'), () => { const t = ctx.currentTime + 0.01; [48, 55, 60, 64, 67].forEach((n, i) => noteOn(n, 0.75, t + i * 0.02, 2)); });
        pedalBtn = button(tx('Pedaal'), () => setPedal(!pedalOn)); pedalBtn.setAttribute('aria-pressed', pedalOn ? 'true' : 'false'); pedalBtn.style.opacity = pedalOn ? '1' : '.75'; button(tx('Alles uit'), () => panic());
        status = document.createElement('p'); status.style.cssText = 'font-size:12px;color:var(--mod);line-height:1.5'; el.appendChild(status);
        warn = document.createElement('p'); warn.className = 'note'; warn.textContent = node ? '' : tx('AudioWorklet laden…'); el.appendChild(warn);
        paint();
      },
      unmount() { if (root) root.innerHTML = ''; root = null; controls = {}; presetSelect = null; typeSelect = null; pedalBtn = null; status = null; warn = null; },
      onEvent(port, event) {
        try {
          if (dead || port !== 'notes' || !event) return;
          const time = Number.isFinite(event.time) ? event.time : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(event.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(event.note)) {
            const n = clamp(event.note, 0, 127);
            if (type === 'noteoff' || event.vel === 0) noteOff(n, t); else noteOn(n, Number.isFinite(event.vel) ? clamp(event.vel, 0, 1) : 0.8, t, Number.isFinite(event.dur) ? clamp(event.dur, 0.005, 120) : undefined);
          } else if (type === 'cc' && (event.id === 'pedal' || event.id === 'sustain' || event.cc === 64) && Number.isFinite(event.value)) {
            setPedal(event.value >= 0.5, t);
          } else if (type === 'cc' && Object.hasOwn(spec, event.id) && Number.isFinite(event.value)) {
            const d = spec[event.id]; state[event.id] = Number(clamp(Math.round((d[1] + clamp(event.value, 0, 1) * (d[2] - d[1])) / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint();
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) {}
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(spec).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: d[0], lane: 'piano', laneName: 'Piano', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
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
        if (s.preset === 'Custom' || (typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset))) next.preset = s.preset;
        state = next; apply(); paint();
      },
      destroy() { if (dead) return; dead = true; try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) {} node = null; pending.length = 0; self.unmount(); }
    };
    apply(); return self;
  }
};
