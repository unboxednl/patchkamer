// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel (akoestisch, elektrisch en bas) staat nu in het definitieveld about. Geluid en state ongewijzigd.
// 1.20.0 — Eerste uitgave van Guitar (contract v1.20). Eigen motor als AudioWorklet (GuitarEngine): 6 snaren, elk een digitale golfgeleider (uitgebreid Karplus-Strong).
//   - elke snaar: vertragingslijn met fractionele (kubische) uitlezing, demping die met aanslag en helderheid meegaat, stijfheid (allpass-dispersie),
//     plukpositie (kam in de aanzet), pickup- of microfoonpositie (kam op de uitgang), plukruis, glij- en buigruis
//   - typen: staalsnarig, nylon, clean elektrisch, overdrive elektrisch, gedempt (palm mute), 12-snarig (octaafparen en verstemde paren), basgitaar
//   - één stem per snaar (mono per snaar): noten worden naar toonhoogte aan een snaar toegewezen, akkoorden verdelen zich over snaren; overlappende noten
//     op één snaar zijn hammer-on of pull-off (geen nieuwe pluk, toonhoogte glijdt in de legato-glijtijd), de oude stem klinkt kort uit bij een nieuwe pluk
//   - strum-hulp op de kaart (spreiding in ms, omlaag, omhoog of afwisselend), buiging via de knop Bend, de paarse mod-ingang of cc bend/pitchbend
//   - klankkast (akoestisch), versterker met drive en kast (elektrisch), stereo naar snaar, gelijkspanningsfilter en zachte begrenzer
//   - tweetalig (host.lang; poortnamen per taal in i18n); setState volgt §13 (afkappen, ongeldig = standaard, zachte overgang in de motor)
//   - bewaker in de worklet: alleen eindige berichten, de snaarlus en toestanden worden per blok op eindigheid gecontroleerd en teruggezet, de uitgang wordt begrensd
/** Guitar — a plucked-string family (steel-string, nylon, clean and overdriven electric, palm-muted, 12-string, bass guitar). Stereo; six strings, one voice per string.
 * Notes arrive on the orange input: {type:'note',note,vel,time,dur}; noteon/noteoff and note-without-dur hold keys. Notes that overlap on a melodic line become hammer-ons.
 * Bend: {type:'cc', id:'bend'|'pitchbend', value 0..1 (0.5 = centre)}. No internal sequencer. Transport stop and panic release everything.
 * The purple mod input exposes the continuous controls.
 */
const EN = {
  'Helderheid': 'Brightness', 'Aanslagkleur': 'Velocity colour', 'Plukhardheid': 'Pick hardness', 'Plukpositie': 'Pick position', 'Snaarstijfheid': 'String stiffness',
  'Paarverstemming': 'Pair detune', 'Snaarruis': 'String noise', 'Klankduur': 'Sustain length', 'Dempertijd': 'Damper time', 'Palm mute': 'Palm mute',
  'Klankkast': 'Body', 'Kastafstemming': 'Body tuning', 'Pickuppositie': 'Pickup position', 'Drive': 'Drive', 'Versterkertoon': 'Amp tone',
  'Strum-spreiding': 'Strum spread', 'Richting': 'Direction', 'Hammer-ons': 'Hammer-ons', 'Legato-glijtijd': 'Legato glide', 'Buiging': 'Bend', 'Buigbereik': 'Bend range',
  'Aanslaggevoeligheid': 'Touch response', 'Stereobreedte': 'Stereo width', 'Stemming': 'Tuning', 'Transpositie': 'Transpose', 'Uitgang': 'Output',
  'Staalsnarig': 'Steel-string', 'Nylon': 'Nylon', 'Clean elektrisch': 'Clean electric', 'Overdrive elektrisch': 'Overdriven electric', 'Gedempt (palm mute)': 'Muted (palm mute)', '12-snarig': '12-string', 'Basgitaar': 'Bass guitar',
  'Omlaag': 'Down', 'Omhoog': 'Up', 'Afwisselend': 'Alternating', 'Aan': 'On', 'Uit': 'Off',
  'Type': 'Type', 'Klank': 'Sound', 'Pluk & snaar': 'Pluck & string', 'Uitklank & kast': 'Decay & body', 'Pickup & versterker': 'Pickup & amp', 'Spel & niveau': 'Playing & level',
  'Eigen klank': 'Custom sound', 'Proeftoon': 'Test note', 'Proefakkoord': 'Test chord', 'Alles uit': 'All off',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Guitar kan hier geen geluid maken.': 'AudioWorklet not available: Guitar cannot make sound here.',
  '6 snaren, één stem per snaar · keyboard/sequencer → oranje Noten · stereo uit → mixer': '6 strings, one voice per string · keyboard/sequencer → orange Notes · stereo out → mixer',
  'Speelt alleen ontvangen noten. Note + dur werkt met sequencers; noteon/noteoff met aangehouden toetsen. Elke snaar klinkt één noot tegelijk: akkoorden verdelen zich over snaren (Strum-spreiding spreidt ze in de tijd), en een noot die een lopende noot op dezelfde snaar overlapt wordt een hammer-on of pull-off, dus laat sequencer-noten overlappen (dur langer dan de stap) voor legato. Buiging: knop Buiging, paarse Mod-kabel of cc bend/pitchbend (0,5 = midden). Type kiest het instrument; de klanken in de lijst zetten type en knoppen samen. Paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis.':
    'Plays received notes only. Note + dur works with sequencers; noteon/noteoff with held keys. Each string sounds one note at a time: chords are spread over the strings (Strum spread spreads them in time), and a note that overlaps a sounding note on the same string becomes a hammer-on or pull-off, so let sequencer notes overlap (dur longer than the step) for legato. Bend: the Bend knob, a purple Mod cable or cc bend/pitchbend (0.5 = centre). Type chooses the instrument; the sounds in the list set type and knobs together. A purple Mod cable controls sound parameters; the knobs stay the base.'
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan]
const SPEC = {
  tone: ['Helderheid', 0, 1, 0.01, 0.5, '%', 'lin', 'filter', 0.025, true],
  velBright: ['Aanslagkleur', 0, 1, 0.01, 0.6, '%', 'lin', 'level', 0.015, false],
  pick: ['Plukhardheid', 0, 1, 0.01, 0.6, '%', 'lin', 'texture', 0.02, false],
  pickPos: ['Plukpositie', 0.04, 0.5, 0.005, 0.14, '%', 'lin', 'color', 0.02, false],
  stiff: ['Snaarstijfheid', 0, 2, 0.01, 1, '%', 'lin', 'color', 0.02, false],
  detune: ['Paarverstemming', 0, 25, 0.5, 6, 'cent', 'lin', 'detune', 0.015, false],
  noise: ['Snaarruis', 0, 1, 0.01, 0.4, '%', 'lin', 'texture', 0.02, true],
  decay: ['Klankduur', 0.2, 4, 0.01, 1, 'x', 'log', 'decay', 0.02, false],
  release: ['Dempertijd', 0.03, 3, 0.01, 0.4, 's', 'log', 'decay', 0.02, false],
  mute: ['Palm mute', 0, 1, 0.01, 0, '%', 'lin', 'decay', 0.02, true],
  body: ['Klankkast', 0, 1, 0.01, 0.5, '%', 'lin', 'res', 0.02, true],
  bodyTune: ['Kastafstemming', 0.5, 2, 0.01, 1, 'x', 'log', 'res', 0.015, false],
  pickup: ['Pickuppositie', 0, 1, 0.01, 0.4, '%', 'lin', 'color', 0.02, false],
  drive: ['Drive', 0, 1, 0.01, 0, '%', 'lin', 'color', 0.02, true],
  ampTone: ['Versterkertoon', 0, 1, 0.01, 0.7, '%', 'lin', 'filter', 0.02, true],
  strum: ['Strum-spreiding', 0, 80, 1, 0, 'ms', 'lin', 'time', 0.01, false],
  glide: ['Legato-glijtijd', 5, 600, 1, 30, 'ms', 'log', 'time', 0.01, false],
  bend: ['Buiging', -12, 12, 0.01, 0, 'st', 'lin', 'pitch', 0.01, false],
  bendRange: ['Buigbereik', 1, 12, 0.5, 2, 'st', 'lin', 'pitch', 0.001, false],
  velocity: ['Aanslaggevoeligheid', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false],
  width: ['Stereobreedte', 0, 1, 0.01, 0.5, '%', 'lin', 'pan', 0.02, true],
  tune: ['Stemming', -100, 100, 1, 0, 'cent', 'lin', 'pitch', 0.005, false],
  transpose: ['Transpositie', -24, 24, 1, 0, 'st', 'lin', 'pitch', 0.001, false],
  level: ['Uitgang', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false]
};
// transpose, strum en bendRange zitten niet in de motor (de kaart doet ze); legato is een keuzelijst
const CARDONLY = ['transpose', 'strum', 'bendRange'];
const MODEX = ['transpose', 'strum', 'bendRange'];
const TYPE_IDS = ['steel', 'nylon', 'clean', 'overdrive', 'muted', 'twelve', 'bass'];
const TYPE_LABEL = { steel: 'Staalsnarig', nylon: 'Nylon', clean: 'Clean elektrisch', overdrive: 'Overdrive elektrisch', muted: 'Gedempt (palm mute)', twelve: '12-snarig', bass: 'Basgitaar' };
const DIR_IDS = ['down', 'up', 'alt'];
const DIR_LABEL = { down: 'Omlaag', up: 'Omhoog', alt: 'Afwisselend' };
const OPEN = [[40, 45, 50, 55, 59, 64], [23, 28, 33, 38, 43, 48]];
const RANGES = {};
for (const [k, d] of Object.entries(SPEC)) if (!CARDONLY.includes(k)) RANGES[k] = [d[1], d[2], d[4]];
RANGES.type = [0, 6, 0];
RANGES.legato = [0, 1, 1];
const PRESETS = {
  'Steel Strummer': { type: 'steel' },
  'Nylon Classic': { type: 'nylon', tone: 0.4, pick: 0.2, pickPos: 0.18, decay: 0.9, body: 0.55, noise: 0.3 },
  'Clean Electric': { type: 'clean', tone: 0.55, decay: 1.2, body: 0.4, pickup: 0.35, ampTone: 0.75, width: 0.4 },
  'Crunch Lead': { type: 'overdrive', tone: 0.6, decay: 1.4, body: 0.5, pickup: 0.2, drive: 0.55, ampTone: 0.65, width: 0.3 },
  'Palm Mute Chug': { type: 'muted', tone: 0.45, drive: 0.5, body: 0.5, pickup: 0.15, ampTone: 0.6, width: 0.3 },
  'Twelve-String Shimmer': { type: 'twelve', tone: 0.6, decay: 1.2, detune: 8, body: 0.55, width: 0.7 },
  'Fingerstyle Bass': { type: 'bass', tone: 0.35, pick: 0.2, pickPos: 0.2, decay: 1.3, body: 0.45, pickup: 0.5, ampTone: 0.5, noise: 0.3, width: 0.1 }
};
const WNAME = 'nl-patchkamer-guitar-1-20-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const OPEN = ${JSON.stringify(OPEN)};
const NV = 12, CHMAX = 128, TWO_PI = Math.PI * 2;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const sclip = x => (x >= 3 ? 1 : x <= -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x));
// per type: t60 = klankduur bij 110 Hz (s), soft = zachtheid van de pluk, wt = aandeel van de driehoekige uitwijking in de aanzet, damp = demping in de lus,
// stiff = snaarstijfheid, cc = diepte van de pickup-kam, pn/pd/ph = plukruis (sterkte, duur in s, kleur), amp = versterkerketen, dmin = minimale drive,
// mute = ingebouwde demping, gn = niveau, oct = octaafparen (12-snarig), bank = resonanties van kast of versterker, bass = basgitaar
const TYPES = [
  { t60: 3.5, soft: 0.35, wt: 0.55, damp: 1, stiff: 1, cc: 0.45, pn: 1, pd: 0.004, ph: 0.7, amp: 0, dmin: 0, mute: 0, gn: 1.3, oct: 0, bank: 0, bass: 0 },
  { t60: 2.2, soft: 0.8, wt: 0.8, damp: 1.5, stiff: 0.4, cc: 0.3, pn: 0.5, pd: 0.01, ph: 0.3, amp: 0, dmin: 0, mute: 0, gn: 1.1, oct: 0, bank: 1, bass: 0 },
  { t60: 4.5, soft: 0.4, wt: 0.55, damp: 0.9, stiff: 0.8, cc: 1, pn: 1, pd: 0.004, ph: 0.6, amp: 1, dmin: 0, mute: 0, gn: 1, oct: 0, bank: 2, bass: 0 },
  { t60: 4.5, soft: 0.4, wt: 0.55, damp: 0.9, stiff: 0.8, cc: 1, pn: 1, pd: 0.004, ph: 0.6, amp: 1, dmin: 0.4, mute: 0, gn: 0.8, oct: 0, bank: 3, bass: 0 },
  { t60: 0.9, soft: 0.5, wt: 0.6, damp: 2, stiff: 0.8, cc: 0.85, pn: 0.9, pd: 0.003, ph: 0.5, amp: 1, dmin: 0, mute: 0.7, gn: 1.3, oct: 0, bank: 2, bass: 0 },
  { t60: 4, soft: 0.35, wt: 0.55, damp: 1, stiff: 1, cc: 0.45, pn: 1, pd: 0.004, ph: 0.7, amp: 0, dmin: 0, mute: 0, gn: 0.8, oct: 1, bank: 0, bass: 0 },
  { t60: 5, soft: 0.7, wt: 0.75, damp: 1.6, stiff: 0.6, cc: 0.9, pn: 0.5, pd: 0.008, ph: 0.2, amp: 1, dmin: 0, mute: 0, gn: 0.85, oct: 0, bank: 4, bass: 1 }
];
// resonanties: [frequentie Hz, versterking, Q]; kast (staal, nylon) of versterkerkast (elektrisch, bas)
const BANKS = [
  [[98, 1, 7], [205, 0.8, 8], [290, 0.7, 9], [420, 0.55, 10], [620, 0.45, 10], [1150, 0.35, 10]],
  [[92, 1, 6], [190, 0.9, 7], [260, 0.7, 8], [390, 0.6, 9], [560, 0.45, 9], [900, 0.35, 9]],
  [[110, 0.8, 3], [300, 0.2, 2], [900, 0.3, 2], [2200, 0.6, 2.5], [3200, 0.5, 3], [0, 0, 1]],
  [[100, 0.9, 3], [250, 0.4, 2], [800, 0.5, 2], [1900, 0.9, 2.5], [3300, 0.7, 3], [5000, 0.3, 3]],
  [[55, 0.9, 3], [90, 0.7, 3], [150, 0.5, 3], [260, 0.4, 3], [600, 0.25, 3], [1500, 0.2, 3]]
];
// vertraging van de lus zonder lijn: fasevertraging van de demping (een pool) en van ns allpass-secties bij frequentie f
function loopDelay(sr, f, a, d, ns) {
  const w = TWO_PI * f / sr, sw = Math.sin(w), cw = Math.cos(w);
  const lp = Math.atan2(a * sw, 1 - a * cw) / w;
  const ap = -(Math.atan2(-sw, d + cw) - Math.atan2(-d * sw, 1 + d * cw)) / w;
  return sr / f - lp - ns * ap;
}
// fasevertraging van een allpass-sectie (coëfficiënt d) bij frequentie f
function apDelay(sr, f, d) { const w = TWO_PI * f / sr, sw = Math.sin(w), cw = Math.cos(w); return -(Math.atan2(-sw, d + cw) - Math.atan2(-d * sw, 1 + d * cw)) / w; }
// kies aantal secties en coëfficiënt zodat de tiende deeltoon ongeveer 'cents' scherp staat (de deeltoon ver boven 3 kHz telt niet mee)
function chooseStiff(sr, f0, cents) {
  if (cents < 0.3) return [0, 0];
  const n = Math.max(2, Math.min(10, Math.floor(3000 / f0))), sc = cents * (n / 10) * (n / 10), D = sr / f0;
  let best = [1, 0.1], be = 1e9;
  for (let ns = 1; ns <= 2; ns++) {
    for (let d = 0.02; d <= 0.92; d += 0.03) {
      const c = 1731 * ns * (apDelay(sr, f0, -d) - apDelay(sr, n * f0, -d)) / D, e = Math.abs(c - sc);
      if (e < be) { be = e; best = [ns, d]; }
    }
    if (be < 0.15 * sc + 0.2) break;
  }
  return best;
}
class GuitarEngine {
  constructor(sr) {
    this.sr = sr; this.q = []; this.rs = 0x2badf00d | 0; this.P = {}; this.S = {}; this.nextId = 1; this.bendCC = 0;
    for (const k in RANGES) { this.P[k] = RANGES[k][2]; this.S[k] = RANGES[k][2]; }
    this.S.amp = 0; this.S.bendT = 0;
    let n = 1; while (n < sr / 8) n *= 2; this.M = n - 1; this.BUF = n;
    this.tri = new Float64Array(n); this.nzb = new Float64Array(n); this.nzc = new Float64Array(n);
    this.cur = [-1, -1, -1, -1, -1, -1]; this.hand = 5; this.lastV = -1; this.lastT = -1e9; this.cnt = 0;
    this.dn = 1e-15; this.dc = [0, 0, 0, 0]; this.bst = new Float64Array(24); this.bco = new Float64Array(24); this.ast = new Float64Array(12);
    this.mixL = new Float64Array(CHMAX); this.mixR = new Float64Array(CHMAX); this.vb = new Float64Array(CHMAX); this.sb = new Float64Array(CHMAX);
    this.v = Array.from({ length: NV }, () => this.blank());
  }
  strand() { return { line: new Float64Array(this.BUF), wp: 0, Ld: 20, Lc: 20, c0: 0, c1: 1, c2: 0, c3: 0, a: 0.2, ylp: 0, g: 0.99, d: -0.2, ns: 1, z1: 0, z2: 0, cc: 0.5, m: 8, f: 110, ff: 110, t60: 1, amp: 1, on: false, Ld1: 20, dL: 0 }; }
  blank() { return { st: 0, id: 0, note: 60, str: 0, tEnd: Infinity, t0: 0, age: 0, vel: 0.8, fg: 1, fk: 1, peak: 0, gl: 0, glr: 0, semi: 0, dirty: false, S: [this.strand(), this.strand()],
    gL: 1, gR: 1, hn: 0, hk: 0.99, hl: 0.5, hnz: 0, sq: 0, sa: 0, s1: 0, s2: 0, rel: 0.4, pcp: 0.14 }; }
  rnd() { let s = this.rs; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rs = s; return (s >>> 0) / 2147483648 - 1; }
  setParams(p) { if (!p || typeof p !== 'object') return; for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); } }
  insert(m) { if (this.q.length >= 2048) return; let i = this.q.length; while (i > 0 && this.q[i - 1].t > m.t) i--; this.q.splice(i, 0, m); }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'stop') { this.q.length = 0; this.bendCC = 0; for (const v of this.v) if (v.st) this.fade(v, 0.15); this.cur.fill(-1); return; }
    if (!(typeof m.t === 'number' && isFinite(m.t))) return;
    if (m.type === 'bend') { if (typeof m.value === 'number' && isFinite(m.value)) this.insert({ type: 'bend', value: clampN(m.value, -24, 24), t: m.t }); return; }
    if (!(typeof m.note === 'number' && isFinite(m.note))) return;
    if (m.type === 'note') {
      const vel = typeof m.vel === 'number' && isFinite(m.vel) ? clampN(m.vel, 0, 1) : 0.8;
      if (vel <= 0) m = { type: 'off', note: m.note, t: m.t };
      else m = { type: 'note', note: clampN(m.note, 0, 127), vel, t: m.t, dur: typeof m.dur === 'number' && isFinite(m.dur) && m.dur > 0 ? clampN(m.dur, 0.005, 3600) : Infinity,
        str: typeof m.str === 'number' && isFinite(m.str) ? Math.round(clampN(m.str, -1, 5)) : -1, grp: !!m.grp };
    } else if (m.type === 'off') m = { type: 'off', note: m.note, t: m.t }; else return;
    this.insert(m);
  }
  fade(v, sec) { v.st = 3; v.fk = Math.exp(-6.9078 / (Math.max(0.003, sec) * this.sr)); }
  kill(v) { v.st = 0; v.peak = 0; v.fg = 1; for (const s of v.S) { s.on = false; s.line.fill(0); s.ylp = 0; s.z1 = 0; s.z2 = 0; } for (let i = 0; i < 6; i++) if (this.cur[i] >= 0 && this.v[this.cur[i]] === v) this.cur[i] = -1; }
  alloc() {
    for (const v of this.v) if (v.st === 0) return v;
    let best = null, bp = 1e9;
    for (const v of this.v) if (v.st === 3) { const p = v.peak * v.fg; if (p < bp) { bp = p; best = v; } }
    if (!best) for (const v of this.v) if (v.st === 2) { const p = v.peak; if (p < bp) { bp = p; best = v; } }
    if (!best) for (const v of this.v) { const p = v.peak; if (p < bp) { bp = p; best = v; } }
    best = best || this.v[0]; this.kill(best); return best;
  }
  // kies de snaar voor een losse noot: dicht bij de handpositie, liefst een vrije snaar, open snaren een beetje bevoordeeld
  pickString(note, t, T) {
    const open = OPEN[T.bass], hand = this.hand; let best = 0, bc = 1e9;
    for (let s = 0; s < 6; s++) {
      const fret = note - open[s]; let c = Math.abs(fret - hand);
      if (fret < 0) c += 40 - fret * 4; else if (fret > 24) c += 30 + (fret - 24) * 3; else if (fret > 12) c += (fret - 12) * 1.2;
      if (fret === 0) c -= 2;
      const cv = this.cur[s]; if (cv >= 0) { const o = this.v[cv]; c += o.st === 1 && o.tEnd > t ? 60 : 3; }
      if (c < bc) { bc = c; best = s; }
    }
    const fb = note - open[best]; if (fb > 0) this.hand = 0.75 * this.hand + 0.25 * clampN(fb, 0, 20);
    return best;
  }
  // frequentie, lusdemping en afgeleide waarden van een snaarstreng vastleggen; af = demping (lus), t60 = klankduur (s)
  setLoop(v, k, f, a, t60, stiffAmt) {
    const s = v.S[k], sr = this.sr; f = clampN(f, 8, sr / 8);
    s.ff = f; s.a = clampN(a, 0, 0.9); s.t60 = Math.max(0.05, t60); s.g = Math.min(0.99999, Math.pow(10, -3 / (f * s.t60)));
    const sp = chooseStiff(sr, f, 9 * stiffAmt * (0.5 + 0.5 * clampN((f - 100) / 250, 0, 1))); s.ns = sp[0]; s.d = -sp[1];
    s.cc = v.cc; s.m = Math.max(1, Math.round(v.pcp * this.sr / f));
  }
  delayFor(s, f) {
    let L = loopDelay(this.sr, f, s.a, s.d, s.ns);
    if (L < 3 && s.ns > 0) { s.ns = 0; L = loopDelay(this.sr, f, s.a, s.d, 0); }
    if (L < 3) { L = 3; }
    return L;
  }
  setStatic(s) { s.Lc = Math.ceil(s.Ld); const t = s.Lc - s.Ld; s.c0 = -t * (t - 1) * (t - 2) / 6; s.c1 = (t + 1) * (t - 1) * (t - 2) / 2; s.c2 = -(t + 1) * t * (t - 2) / 2; s.c3 = (t + 1) * t * (t - 1) / 6; }
  // vul de lijn met een pluk: driehoek (plukpositie) gemengd met gefilterde ruis (plukhardheid); add = bij het bestaande optellen (hammer-on, pull-off)
  excite(s, amp, pa, wt, beta, add) {
    const N = Math.min(s.Lc, this.BUF - 4), tri = this.tri, nz = this.nzb, nc = this.nzc, M = this.M, line = s.line;
    let st = 0, sum = 0; const k = 1 - clampN(pa, 0, 0.97);
    for (let i = 0; i < N; i++) { st += k * (this.rnd() - st); nz[i] = st; sum += st; }
    sum /= N; for (let i = 0; i < N; i++) nz[i] -= sum;
    const m = Math.max(1, Math.min(N - 1, Math.round(beta * N)));
    for (let i = 0; i < N; i++) nc[i] = nz[i] - nz[(i - m + N) % N];
    const pk = Math.max(1, Math.min(N - 1, m));
    let ts = 0; for (let i = 0; i < N; i++) { const x = i < pk ? i / pk : (N - i) / (N - pk); tri[i] = x; ts += x; }
    ts /= N; let tr = 0, nr = 0; for (let i = 0; i < N; i++) { tri[i] -= ts; tr += tri[i] * tri[i]; nr += nc[i] * nc[i]; }
    tr = Math.sqrt(tr / N) + 1e-12; nr = Math.sqrt(nr / N) + 1e-12;
    let mx = 1e-12; for (let i = 0; i < N; i++) { const e = wt * tri[i] / tr + (1 - wt) * nc[i] / nr; tri[i] = e; const ab = e < 0 ? -e : e; if (ab > mx) mx = ab; }
    const sc = amp / mx, base = s.wp - s.Lc;
    if (add) for (let i = 0; i < N; i++) line[(base + i) & M] += tri[i] * sc; else { line.fill(0); for (let i = 0; i < N; i++) line[(base + i) & M] = tri[i] * sc; }
  }
  freqOf(note) { return Math.min(440 * Math.pow(2, (note - 69) / 12 + this.P.tune / 1200), this.sr / 8); }
  noteOn(m) {
    const P = this.P, sr = this.sr, ti = Math.round(clampN(P.type, 0, 6)), T = TYPES[ti], note = m.note, vel = m.vel, open = OPEN[T.bass];
    // overlappende noot op dezelfde snaar als lopende lijn: hammer-on of pull-off
    if (!m.grp && m.str < 0 && P.legato >= 0.5 && this.lastV >= 0 && this.cnt === 1 && m.t - this.lastT >= 0.02) {
      const lv = this.v[this.lastV], dn = note - lv.note, fret = note - open[lv.str];
      if (lv.st === 1 && this.cur[lv.str] === this.lastV && dn !== 0 && Math.abs(dn) <= 12 && fret >= 0 && fret <= 24 && lv.tEnd > m.t + 0.004) { this.hammer(lv, m, T); return; }
    }
    const s = m.str >= 0 ? m.str : this.pickString(note, m.t, T);
    const cv = this.cur[s]; if (cv >= 0) { this.fade(this.v[cv], 0.012); this.cur[s] = -1; }
    const v = this.alloc();
    v.st = 1; v.id = this.nextId++; v.note = note; v.str = s; v.t0 = m.t; v.tEnd = Number.isFinite(m.dur) ? m.t + m.dur : Infinity; v.age = 0; v.vel = vel; v.fg = 1; v.fk = 1; v.gl = 0; v.glr = 0; v.semi = 0; v.dirty = false; v.peak = 1; v.sq = 0; v.sa = 0;
    const br = clampN(P.tone + P.velBright * (vel - 0.6) * 1.6, 0, 1), muteAmt = Math.max(P.mute, T.mute), f = this.freqOf(note);
    const a = clampN(T.damp * (0.5 - 0.46 * br) + 0.35 * muteAmt, 0, 0.9);
    const t60 = clampN(T.t60 * P.decay * Math.pow(110 / f, 0.3) * (1 - 0.85 * muteAmt), 0.08, 30);
    const stiffAmt = P.stiff * T.stiff;
    v.rel = P.release; v.cc = T.cc; v.pcp = 0.06 + 0.24 * P.pickup;
    const two = T.oct ? 1 : 0, octave = two && s < 4;
    const sd = P.detune;
    const vs = P.velocity, gain = 0.4 * T.gn * ((1 - vs) + vs * Math.pow(vel, 1.3));
    const pa = clampN(T.soft * (1.15 - 0.9 * P.pick) * (1 - 0.7 * br), 0, 0.97);
    for (let k = 0; k < 2; k++) {
      const st = v.S[k];
      if (k === 1 && !two) { st.on = false; continue; }
      st.on = true; st.wp = 0; st.ylp = 0; st.z1 = 0; st.z2 = 0;
      const fk = k === 0 ? f : octave ? Math.min(f * 2, sr / 8) : Math.min(f * Math.pow(2, sd / 1200), sr / 8);
      this.setLoop(v, k, fk, a * (k === 1 && octave ? 1.2 : 1), t60 * (k === 1 && octave ? 0.8 : 1), stiffAmt);
      st.amp = k === 0 ? 1 : octave ? 0.55 : 0.85;
      st.Ld = this.delayFor(st, fk); st.Ld1 = st.Ld; st.dL = 0; this.setStatic(st);
      this.excite(st, gain * st.amp, pa, T.wt, P.pickPos, false);
    }
    const pw = clampN(P.width, 0, 1), pan = clampN((s - 2.5) / 2.5, -1, 1) * pw * 0.55 + 0.04 * pw * this.rnd();
    const ang = (clampN(pan, -1, 1) + 1) * Math.PI / 4; v.gL = Math.cos(ang) * 1.414; v.gR = Math.sin(ang) * 1.414;
    v.hn = P.noise * T.pn * Math.pow(vel, 1.3) * 0.2 * (0.3 + 0.7 * P.pick); v.hk = Math.exp(-6.9078 / (T.pd * (1.5 - 0.5 * P.pick) * sr)); v.hl = clampN(T.ph * (0.4 + vel), 0.03, 0.9); v.hnz = 0;
    this.cur[s] = this.v.indexOf(v);
    if (Number.isFinite(m.dur)) this.insert({ type: 'gate', v, id: v.id, t: v.tEnd });
    this.cnt = m.t - this.lastT < 0.04 ? this.cnt + 1 : 1; this.lastT = m.t; this.lastV = this.cur[s];
  }
  // hammer-on (omhoog) of pull-off (omlaag) op een klinkende snaar: de toonhoogte glijdt, de snaar krijgt een tik of een kleine pluk erbij
  hammer(v, m, T) {
    const P = this.P, sr = this.sr, dn = m.note - v.note, up = dn > 0;
    v.gl += v.note - m.note; v.glr = Math.abs(v.gl) / (Math.max(0.005, P.glide / 1000) * sr);
    const ratio = Math.pow(2, (m.note - v.note) / 12); for (const s of v.S) if (s.on) s.ff = clampN(s.ff * ratio, 8, sr / 8);
    v.note = m.note; v.id = this.nextId++; v.t0 = m.t; v.tEnd = Number.isFinite(m.dur) ? m.t + m.dur : Infinity; v.vel = m.vel; v.dirty = true; v.st = 1;
    const br = clampN(P.tone + P.velBright * (m.vel - 0.6) * 1.6, 0, 1), pa = clampN(T.soft * (1.15 - 0.9 * P.pick) * (1 - 0.7 * br), 0, 0.97);
    const vs = P.velocity, gain = 0.4 * T.gn * ((1 - vs) + vs * Math.pow(m.vel, 1.3));
    for (let k = 0; k < 2; k++) { const s = v.S[k]; if (s.on) this.excite(s, gain * s.amp * (up ? 0.3 : 0.55), pa, up ? 0.15 : T.wt, P.pickPos, true); }
    v.hn = Math.max(v.hn, P.noise * T.pn * 0.12 * m.vel); v.hk = Math.exp(-6.9078 / (T.pd * 2 * sr)); v.hl = clampN(T.ph * 0.6, 0.03, 0.9);
    v.sq = Math.max(v.sq, P.noise * Math.min(1, Math.abs(v.gl) / 6));
    if (Number.isFinite(m.dur)) this.insert({ type: 'gate', v, id: v.id, t: v.tEnd });
    this.cnt = 1; this.lastT = m.t;
  }
  release(v) {
    v.st = 2; const relT = Math.max(0.03, v.rel);
    for (let k = 0; k < 2; k++) { const s = v.S[k]; if (!s.on) continue; s.t60 = Math.min(s.t60, relT); s.g = Math.min(0.99999, Math.pow(10, -3 / (s.ff * s.t60))); s.a = Math.min(0.85, s.a + 0.3); }
    v.dirty = true;
  }
  noteOff(m) { for (const v of this.v) if (v.st === 1 && v.note === m.note && v.t0 <= m.t) this.release(v); }
  event(m) {
    if (m.type === 'note') this.noteOn(m);
    else if (m.type === 'off') this.noteOff(m);
    else if (m.type === 'gate') { if (m.v.id === m.id && m.v.st === 1) this.release(m.v); }
    else if (m.type === 'bend') this.bendCC = m.value;
  }
  // werk de lus van een stem bij naar een nieuwe frequentie/demping; de vertraging loopt lineair naar de nieuwe waarde in dit blok
  retune(v, semi, n) {
    const ratio = Math.pow(2, semi / 12);
    for (let k = 0; k < 2; k++) {
      const s = v.S[k]; if (!s.on) continue;
      const f = clampN(s.ff * ratio, 8, this.sr / 8), L = this.delayFor(s, f);
      s.g = Math.min(0.99999, Math.pow(10, -3 / (f * s.t60))); s.Ld1 = L; s.dL = (L - s.Ld) / n; s.m = Math.max(1, Math.round(v.pcp * this.sr / f)); s.cc = v.cc;
    }
  }
  runStrand(s, buf, n, ramp) {
    const line = s.line, M = this.M, a1 = 1 - s.a, a = s.a, g = s.g, d = s.d, ns = s.ns, cc = s.cc, m = s.m;
    let wp = s.wp, ylp = s.ylp, z1 = s.z1, z2 = s.z2, Ld = s.Ld;
    let Lc = s.Lc, c0 = s.c0, c1 = s.c1, c2 = s.c2, c3 = s.c3;
    for (let j = 0; j < n; j++) {
      if (ramp) { Ld += s.dL; Lc = Math.ceil(Ld); const t = Lc - Ld; c0 = -t * (t - 1) * (t - 2) / 6; c1 = (t + 1) * (t - 1) * (t - 2) / 2; c2 = -(t + 1) * t * (t - 2) / 2; c3 = (t + 1) * t * (t - 1) / 6; }
      const i = wp - Lc;
      let x = c0 * line[(i - 1) & M] + c1 * line[i & M] + c2 * line[(i + 1) & M] + c3 * line[(i + 2) & M];
      if (ns > 0) { let y = d * x + z1; z1 = x - d * y; x = y; if (ns > 1) { y = d * x + z2; z2 = x - d * y; x = y; } }
      let y = a1 * x + a * ylp; ylp = y; y *= g;
      if (y < 1e-24 && y > -1e-24) { y = 0; ylp = 0; }
      line[wp & M] = y;
      buf[j] += y - cc * line[(wp - m) & M];
      wp++;
    }
    s.wp = wp & M; s.ylp = ylp; s.z1 = z1; s.z2 = z2;
    if (ramp) { s.Ld = s.Ld1; this.setStatic(s); }
  }
  chunk(b, e) {
    const n = e - b, mixL = this.mixL, mixR = this.mixR, vb = this.vb, sr = this.sr, P = this.P;
    for (const v of this.v) {
      if (v.st === 0) continue;
      vb.fill(0, 0, n);
      if (v.gl !== 0) { const step = v.glr * n; if (Math.abs(v.gl) <= step) v.gl = 0; else v.gl -= (v.gl > 0 ? 1 : -1) * step; }
      const semi = v.gl + this.S.bendT, moving = v.gl !== 0 || Math.abs(semi - v.semi) > 1e-5;
      let ramp = false;
      if (moving || v.dirty) { this.retune(v, semi, n); ramp = true; v.dirty = false; }
      const dsemi = Math.abs(semi - v.semi); v.semi = semi;
      for (const s of v.S) if (s.on) this.runStrand(s, vb, n, ramp);
      // plukruis en glij-/buigruis
      const sqt = Math.min(1, dsemi * sr / n * 0.08) * P.noise; v.sa += (sqt - v.sa) * 0.5; if (v.sq > 0.001) { v.sa = Math.max(v.sa, v.sq * 0.6); v.sq *= v.gl !== 0 ? 1 : 0.9; }
      const hasN = v.hn > 1e-5, hasS = v.sa > 1e-4;
      if (hasN || hasS) for (let j = 0; j < n; j++) {
        const r = this.rnd(); let x = 0;
        if (hasN) { v.hnz += v.hl * (r - v.hnz); x += (r - v.hnz) * v.hn; v.hn *= v.hk; }
        if (hasS) { v.s1 += 0.3 * (r - v.s1); v.s2 += 0.05 * (r - v.s2); x += (v.s1 - v.s2) * v.sa * 0.5; }
        vb[j] += x;
      }
      let peak = 0;
      if (v.st === 3) { let fg = v.fg; for (let j = 0; j < n; j++) { fg *= v.fk; vb[j] *= fg; } v.fg = fg; }
      for (let j = 0; j < n; j++) { const x = vb[j], ab = x < 0 ? -x : x; if (ab > peak) peak = ab; mixL[b + j] += x * v.gL; mixR[b + j] += x * v.gR; }
      v.age += n; v.peak = peak;
      let bad = !(peak < 20);
      for (const s of v.S) if (s.on && !(s.ylp > -20 && s.ylp < 20 && s.z1 > -20 && s.z1 < 20 && s.z2 > -20 && s.z2 < 20 && s.Ld > 2.9 && s.Ld < this.BUF - 8)) bad = true;
      if (bad) { this.kill(v); continue; }
      if ((v.st === 3 && v.fg < 1e-3) || (v.age > 0.1 * sr && peak < 2e-6 && !(v.hn > 1e-5))) this.kill(v);
    }
  }
  render(L, R, len, t0) {
    const sr = this.sr, S = this.S, P = this.P, mixL = this.mixL, mixR = this.mixR;
    if (len > CHMAX) len = CHMAX;
    const T = TYPES[Math.round(clampN(P.type, 0, 6))], kk = 1 - Math.exp(-len / (sr * 0.04));
    for (const k in S) { const tgt = k === 'amp' ? T.amp : k === 'bendT' ? clampN(P.bend + this.bendCC, -24, 24) : P[k]; if (!isFinite(S[k])) S[k] = tgt; S[k] += (tgt - S[k]) * kk; }
    mixL.fill(0, 0, len); mixR.fill(0, 0, len);
    let b = 0;
    while (b < len) {
      const tb = t0 + b / sr;
      while (this.q.length && this.q[0].t <= tb + 0.5 / sr) this.event(this.q.shift());
      let e = len;
      if (this.q.length) e = clampN(Math.ceil((this.q[0].t - t0) * sr - 0.5), b + 1, len);
      this.chunk(b, e); b = e;
    }
    // versterker (elektrisch), resonanties van kast of versterkerkast, gelijkspanningsfilter, begrenzer
    const bank = BANKS[T.bank], bst = this.bst, bco = this.bco, dc = this.dc, ast = this.ast, bodyA = S.body * 0.6, am = S.amp;
    for (let f = 0; f < 6; f++) { const fb = bank[f], fc = clampN(fb[0] * S.bodyTune, 30, sr * 0.4), g = Math.tan(Math.PI * fc / sr), k = 1 / fb[2], a1 = 1 / (1 + g * (g + k)); bco[f * 4] = a1; bco[f * 4 + 1] = g * a1; bco[f * 4 + 2] = g * g * a1; bco[f * 4 + 3] = fb[0] > 0 ? k * fb[1] : 0; }
    const drv = clampN(Math.max(S.drive, T.dmin), 0, 1), gd = 1 + 16 * drv * drv, nd = 1 / Math.sqrt(gd), bias = 0.12 * drv, bz = sclip(bias);
    const khp = 1 - Math.exp(-TWO_PI * (T.bass ? 25 : 90) / sr), hpa = clampN(drv * 4, 0, 1) * (T.bass ? 0.4 : 1);
    const kc = 1 - Math.exp(-TWO_PI * Math.min(1400 * Math.pow(4.5, S.ampTone), sr * 0.4) / sr), gain = S.level * 1.1, ampOn = am > 0.001;
    for (let j = 0; j < len; j++) {
      let l = mixL[j], r = mixR[j];
      if (!(l > -50 && l < 50)) l = 0; if (!(r > -50 && r < 50)) r = 0;
      this.dn = -this.dn;
      for (let ch = 0; ch < 2; ch++) {
        let x = (ch ? r : l) + this.dn; const o = ch * 12, ao = ch * 6; let acc = 0;
        if (ampOn) {
          ast[ao] += khp * (x - ast[ao]); let y = x - ast[ao] * hpa;
          y = (sclip(y * gd + bias) - bz) * nd;
          ast[ao + 1] += kc * (y - ast[ao + 1]); ast[ao + 2] += kc * (ast[ao + 1] - ast[ao + 2]);
          x += am * (ast[ao + 2] - x);
        }
        if (bodyA > 0.001) for (let f = 0; f < 6; f++) {
          const i1 = o + f * 2, i2 = i1 + 1, ic1 = bst[i1], ic2 = bst[i2], q = f * 4, v3 = x - ic2, v1 = bco[q] * ic1 + bco[q + 1] * v3, v2 = ic2 + bco[q + 1] * ic1 + bco[q + 2] * v3;
          bst[i1] = 2 * v1 - ic1; bst[i2] = 2 * v2 - ic2; acc += v1 * bco[q + 3];
        }
        const y2 = x + bodyA * acc, hp = y2 - dc[ch] + 0.995 * dc[ch + 2]; dc[ch] = y2; dc[ch + 2] = hp;
        const yy = sclip(hp * gain); if (ch) this.outR = yy === yy ? yy : 0; else this.outL = yy === yy ? yy : 0;
      }
      L[j] = this.outL; if (R) R[j] = this.outR;
    }
    // bewaker: niet-eindige of absurde toestanden worden teruggezet
    for (let i = 0; i < 24; i++) if (!(bst[i] > -1e4 && bst[i] < 1e4)) bst[i] = 0;
    for (let i = 0; i < 12; i++) if (!(ast[i] > -1e4 && ast[i] < 1e4)) ast[i] = 0;
    for (let i = 0; i < 4; i++) if (!(dc[i] > -1e4 && dc[i] < 1e4)) dc[i] = 0;
  }
}
class PkGuitar extends AudioWorkletProcessor {
  constructor() { super(); this.e = new GuitarEngine(sampleRate); this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} }; }
  process(inputs, outputs) { const o = outputs[0]; if (!o || !o[0]) return true; try { this.e.render(o[0], o[1], o[0].length, currentTime); } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); } return true; }
}
registerProcessor('${WNAME}', PkGuitar);
`;
export default {
  id: 'nl.patchkamer.guitar', name: 'Guitar', version: '1.21.0', kind: 'instrument', category: 'synth',
  ui: { width: 720, minWidth: 340 },
  about: { nl: 'Gitaarfamilie: akoestisch, elektrisch en bas.', en: 'A guitar family: acoustic, electric and bass.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo guitar' }], eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo gitaar', notes: 'Keyboard / noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const spec = {}; for (const [id, d] of Object.entries(SPEC)) spec[id] = [tx(d[0]), ...d.slice(1)];
    const defaults = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, d[4]])); defaults.type = 'steel'; defaults.strumDir = 'down'; defaults.legato = 'on'; defaults.preset = 'Steel Strummer';
    let state = { ...defaults }, effective = { ...defaults }, mod = {}, dead = false, root = null, controls = {}, presetSelect = null, typeSelect = null, dirSelect = null, legatoSelect = null, status = null, warn = null, node = null;
    let flipDir = false, timer = null, bendCC = 0;
    const pending = [], pend = [], out = ctx.createGain(); out.gain.value = 1;
    const resolve = () => { const r = { ...state }; for (const [id, d] of Object.entries(spec)) { const o = mod[id] || 0; r[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** o : state[id] + o * (d[2] - d[1]), d[1], d[2]); } return r; };
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 256) pending.push(m); };
    function apply() { if (dead) return; effective = resolve(); const p = {}; for (const k of Object.keys(RANGES)) if (k in effective) p[k] = effective[k]; p.type = Math.max(0, TYPE_IDS.indexOf(state.type)); p.legato = state.legato === 'off' ? 0 : 1; if (node) node.port.postMessage({ type: 'params', p }); else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); } }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.connect(out); apply(); pending.splice(0).forEach(m => { if (m.type !== 'params' && !(m.t > ctx.currentTime)) return; if (m.type !== 'params') node.port.postMessage(m); });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Guitar kan hier geen geluid maken.'); });
    // snaartoewijzing voor een akkoord: stijgende snaren voor stijgende noten, zo compact mogelijk
    function assign(notes) {
      const open = OPEN[state.type === 'bass' ? 1 : 0], k = notes.length; let best = null, bc = Infinity;
      const rec = (i, from, cur, cost) => {
        if (cost >= bc) return;
        if (i === k) { const fr = cur.map((s, j) => notes[j] - open[s]).filter(f => f > 0); const span = fr.length ? Math.max(...fr) - Math.min(...fr) : 0; cost += Math.max(0, span - 3) * 2; if (cost < bc) { bc = cost; best = cur.slice(); } return; }
        for (let s = from; s <= 6 - (k - i); s++) { const f = notes[i] - open[s]; cur.push(s); rec(i + 1, s + 1, cur, cost + (f < 0 ? 50 - f * 4 : f > 19 ? 20 + (f - 19) * 3 : f > 12 ? (f - 12) * 0.8 : 0)); cur.pop(); }
      };
      rec(0, 0, [], 0); return best;
    }
    function emitGroup(g) {
      if (g.length === 1) { const e = g[0]; post({ type: 'note', note: e.note, vel: e.vel, t: e.t, dur: e.dur, str: -1, grp: false }); return; }
      const sorted = g.slice().sort((a, b) => a.note - b.note), main = sorted.slice(0, 6), extra = sorted.slice(6), strs = assign(main.map(e => e.note)) || main.map((_, i) => i);
      let dir = state.strumDir; if (dir === 'alt') { dir = flipDir ? 'up' : 'down'; flipDir = !flipDir; }
      const spread = state.strum / 1000, n = main.length;
      main.forEach((e, i) => {
        const pos = dir === 'up' ? n - 1 - i : i, tilt = n > 1 ? (0.5 - pos / (n - 1)) * 0.12 : 0;
        post({ type: 'note', note: e.note, vel: clamp(e.vel * (1 + tilt), 0.01, 1), t: e.t + pos * spread, dur: e.dur, str: strs[i], grp: true });
      });
      extra.forEach(e => post({ type: 'note', note: e.note, vel: e.vel, t: e.t, dur: e.dur, str: -1, grp: true }));
    }
    function flush() {
      timer = null; const list = pend.splice(0); let grp = [];
      const emit = () => { if (grp.length) emitGroup(grp); grp = []; };
      for (const e of list) {
        if (e.k === 'on') { if (grp.length && Math.abs(e.t - grp[0].t) > 0.004) emit(); grp.push(e); } else { emit(); post({ type: 'off', note: e.note, t: e.t }); }
      }
      emit();
    }
    function queue(e) { pend.push(e); if (pend.length > 512) pend.shift(); if (!timer) timer = setTimeout(flush, 0); }
    function noteOn(note, vel, t, dur) { queue({ k: 'on', note: clamp(note + effective.transpose, 0, 127), vel, t, dur: Number.isFinite(dur) ? dur : -1 }); }
    function noteOff(note, t) { queue({ k: 'off', note: clamp(note + effective.transpose, 0, 127), t }); }
    function setBend(v, t) { bendCC = v; post({ type: 'bend', value: v, t: Number.isFinite(t) ? t : ctx.currentTime }); }
    function panic() { if (timer) { clearTimeout(timer); timer = null; } pend.length = 0; pending.length = 0; apply(); bendCC = 0; if (node) node.port.postMessage({ type: 'stop' }); }
    function paint() { for (const k in controls) controls[k].set(state[k]); if (presetSelect) presetSelect.value = state.preset; if (typeSelect) typeSelect.value = state.type; if (dirSelect) dirSelect.value = state.strumDir; if (legatoSelect) legatoSelect.value = state.legato; if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : tx('6 snaren, één stem per snaar · keyboard/sequencer → oranje Noten · stereo uit → mixer'); } }
    function change(id, value) { const d = spec[id]; if (!d || !Number.isFinite(+value)) return; state[id] = Number(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint(); }
    const fmt = (d, v) => d[5] === '%' ? (d[3] < 0.01 ? (v * 100).toFixed(1) : Math.round(v * 100)) + '%' : d[5] === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : d[5] === 'x' ? v.toFixed(2) + ' x' : d[5] === 'Hz' ? v.toFixed(1) + ' Hz' : d[5] === 'ms' ? Math.round(v) + ' ms' : v.toFixed(d[3] >= 1 ? 0 : d[3] >= 0.1 ? 1 : 2) + ' ' + d[5];
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount(); root = el;
        const css = document.createElement('style'); css.textContent = '.gt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px 18px;margin-top:4px}.gt-grid .k{grid-template-columns:124px minmax(90px,1fr) 62px;gap:8px;min-height:30px}.gt-grid .k label{font-size:10px;letter-spacing:.04em}.gt-grid .k output{font-size:11px;white-space:nowrap}.gt-grid input[type=range]{width:100%;min-width:90px;height:24px;margin:0;cursor:pointer;accent-color:var(--audio,#e4c697)}'; el.appendChild(css);
        typeSelect = host.ui.select(el, tx('Type'), TYPE_IDS.map(k => [k, tx(TYPE_LABEL[k])]), state.type, k => { if (TYPE_IDS.includes(k)) { state.type = k; state.preset = 'Custom'; apply(); paint(); } }, { id: 'type', group: 'type' });
        presetSelect = host.ui.select(el, tx('Klank'), Object.keys(PRESETS).map(k => [k, k]).concat([['Custom', tx('Eigen klank')]]), state.preset, name => { if (Object.hasOwn(PRESETS, name)) self.setState({ ...defaults, ...PRESETS[name], preset: name }); }, { id: 'preset', group: 'preset' });
        const groups = [[tx('Pluk & snaar'), ['tone', 'velBright', 'pick', 'pickPos', 'stiff', 'detune', 'noise'], 'pluck'], [tx('Uitklank & kast'), ['decay', 'release', 'mute', 'body', 'bodyTune'], 'decay'],
          [tx('Pickup & versterker'), ['pickup', 'drive', 'ampTone'], 'amp'], [tx('Spel & niveau'), ['strum', 'glide', 'bend', 'bendRange', 'velocity', 'width', 'tune', 'transpose', 'level'], 'play']];
        for (const [label, ids, grp] of groups) {
          const h = document.createElement('div'); h.textContent = label; h.style.cssText = 'font-size:12px;opacity:.8;border-top:1px solid var(--line);padding-top:8px;margin-top:9px'; el.appendChild(h);
          const grid = document.createElement('div'); grid.className = 'gt-grid'; el.appendChild(grid);
          for (const id of ids) { const d = spec[id], before = grid.children.length; controls[id] = host.ui.knob(grid, d[0], [d[1], d[2], d[3]], state[id], v => fmt(d, v), v => change(id, v), { default: defaults[id], id, group: grp }); const row = grid.children[before]; if (row) row.title = d[0]; }
          if (grp === 'play') {
            dirSelect = host.ui.select(grid, tx('Richting'), DIR_IDS.map(k => [k, tx(DIR_LABEL[k])]), state.strumDir, k => { if (DIR_IDS.includes(k)) { state.strumDir = k; state.preset = 'Custom'; paint(); } }, { id: 'strumDir', group: 'play' });
            legatoSelect = host.ui.select(grid, tx('Hammer-ons'), [['on', tx('Aan')], ['off', tx('Uit')]], state.legato, k => { if (k === 'on' || k === 'off') { state.legato = k; state.preset = 'Custom'; apply(); paint(); } }, { id: 'legato', group: 'play' });
          }
        }
        const actions = document.createElement('div'); actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px'; el.appendChild(actions);
        const button = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); return b; };
        const base = () => state.type === 'bass' ? -24 : 0;
        button(tx('Proeftoon'), () => { noteOn(52 + base(), 0.8, ctx.currentTime + 0.01, 1.5); flush(); });
        button(tx('Proefakkoord'), () => { const t = ctx.currentTime + 0.01, b = base(); [40, 47, 52, 56, 59, 64].forEach(n => noteOn(n + b, 0.75, t, 2.5)); flush(); });
        button(tx('Alles uit'), () => panic());
        status = document.createElement('p'); status.style.cssText = 'font-size:12px;color:var(--mod);line-height:1.5'; el.appendChild(status);
        warn = document.createElement('p'); warn.className = 'note'; warn.textContent = node ? '' : tx('AudioWorklet laden…'); el.appendChild(warn);
        const tip = document.createElement('p'); tip.className = 'note'; tip.textContent = tx('Speelt alleen ontvangen noten. Note + dur werkt met sequencers; noteon/noteoff met aangehouden toetsen. Elke snaar klinkt één noot tegelijk: akkoorden verdelen zich over snaren (Strum-spreiding spreidt ze in de tijd), en een noot die een lopende noot op dezelfde snaar overlapt wordt een hammer-on of pull-off, dus laat sequencer-noten overlappen (dur langer dan de stap) voor legato. Buiging: knop Buiging, paarse Mod-kabel of cc bend/pitchbend (0,5 = midden). Type kiest het instrument; de klanken in de lijst zetten type en knoppen samen. Paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis.'); el.appendChild(tip);
        paint();
      },
      unmount() { if (root) root.innerHTML = ''; root = null; controls = {}; presetSelect = null; typeSelect = null; dirSelect = null; legatoSelect = null; status = null; warn = null; },
      onEvent(port, event) {
        try {
          if (dead || port !== 'notes' || !event) return;
          const time = Number.isFinite(event.time) ? event.time : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(event.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(event.note)) {
            const n = clamp(event.note, 0, 127);
            if (type === 'noteoff' || event.vel === 0) noteOff(n, t); else noteOn(n, Number.isFinite(event.vel) ? clamp(event.vel, 0, 1) : 0.8, t, Number.isFinite(event.dur) ? clamp(event.dur, 0.005, 120) : undefined);
          } else if (type === 'cc' && (event.id === 'bend' || event.id === 'pitchbend') && Number.isFinite(event.value)) {
            setBend((clamp(event.value, 0, 1) - 0.5) * 2 * effective.bendRange, t);
          } else if (type === 'cc' && Object.hasOwn(spec, event.id) && !['strum', 'transpose', 'bendRange'].includes(event.id) && Number.isFinite(event.value)) {
            const d = spec[event.id]; state[event.id] = Number(clamp(Math.round((d[1] + clamp(event.value, 0, 1) * (d[2] - d[1])) / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint();
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) {}
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(spec).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: d[0], lane: 'guitar', laneName: 'Guitar', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
      modulate(offsets) {
        if (dead) return; const next = {};
        if (offsets && typeof offsets === 'object' && !Array.isArray(offsets)) for (const id of Object.keys(spec)) { if (MODEX.includes(id)) continue; const v = offsets[id]; if (typeof v === 'number' && Number.isFinite(v)) next[id] = clamp(v, -1, 1); }
        mod = next; apply();
        if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : tx('Mod gereed · verbind een paarse sturingskabel'); }
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
        for (const [id, d] of Object.entries(spec)) if (typeof s[id] === 'number' && Number.isFinite(s[id])) next[id] = Number(clamp(Math.round(s[id] / d[3]) * d[3], d[1], d[2]).toFixed(6));
        if (typeof s.type === 'string' && TYPE_IDS.includes(s.type)) next.type = s.type;
        if (typeof s.strumDir === 'string' && DIR_IDS.includes(s.strumDir)) next.strumDir = s.strumDir;
        if (s.legato === 'on' || s.legato === 'off') next.legato = s.legato;
        if (s.preset === 'Custom' || (typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset))) next.preset = s.preset;
        state = next; apply(); paint();
      },
      destroy() { if (dead) return; dead = true; if (timer) { clearTimeout(timer); timer = null; } pend.length = 0; try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) {} node = null; pending.length = 0; self.unmount(); }
    };
    apply(); return self;
  }
};
