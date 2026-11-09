// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in about.
// 1.20.0 — Eerste uitgave van Brass Section (contract v1.20). Eigen motor als AudioWorklet (BrassEngine): 32 spelersstemmen, 1 tot 4 spelers per noot.
//   - zaagtand (bandbegrensd) door een lowpass-filter dat openzwelt (Blat, Opzwellen) en helderder wordt bij hardere aanslag, met aanzetglijding
//     van onderaf, adem- en lipruis, vibrato dat na een vertraging inzet, onderlinge verstemming, inzetverschil en stereospreiding per speler
//   - Demper: dempkap-klank (lagere cutoff, nasale piek rond 1,8 kHz) op de stereosom
//   - tweetalig (host.lang; poortnamen per taal in i18n); setState volgt §13 (afkappen, ongeldig = standaard, zachte overgang in de motor)
//   - bewaker in de worklet: alleen eindige berichten, stemmen en filters worden per blok op eindigheid gecontroleerd en teruggezet
/** Brass Section — a polyphonic brass instrument (trumpet, trombone, horn, section). Stereo; 32 player voices.
 * Notes arrive on the orange input: {type:'note',note,vel,time,dur}; noteon/noteoff and note-without-dur hold keys.
 * No internal sequencer. Transport stop and panic release everything. The purple mod input exposes the continuous controls.
 */
const EN = {
  'Helderheid': 'Brightness', 'Blat': 'Blat', 'Opzwellen': 'Swell time', 'Resonantie': 'Resonance', 'Scherpte': 'Edge', 'Demper': 'Mute',
  'Aanslagkleur': 'Velocity colour', 'Opkomst': 'Attack', 'Uitklank': 'Release', 'Aanzetglijding': 'Scoop', 'Glijtijd': 'Scoop time', 'Adem': 'Breath',
  'Aanslaggevoeligheid': 'Touch response', 'Spelers': 'Players', 'Verstemming': 'Section detune', 'Inzetverschil': 'Entry spread',
  'Stereobreedte': 'Stereo width', 'Vibratosnelheid': 'Vibrato rate', 'Vibratovertraging': 'Vibrato delay', 'Transpositie': 'Transpose',
  'Expressie': 'Expression', 'Uitgang': 'Output',
  'Toon & blat': 'Tone & blat', 'Aanzet & spel': 'Attack & playing', 'Sectie & vibrato': 'Section & vibrato', 'Spel & niveau': 'Playing & level',
  'Eigen klank': 'Custom sound', 'Proeftoon': 'Test note', 'Proefakkoord': 'Test chord', 'Alles uit': 'All off',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters',
  'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: Brass Section kan hier geen geluid maken.': 'AudioWorklet not available: Brass Section cannot make sound here.',
  '32 stemmen · keyboard/sequencer → oranje Noten · stereo uit → mixer': '32 voices · keyboard/sequencer → orange Notes · stereo out → mixer',
  'Speelt alleen ontvangen noten. Note + dur werkt met sequencers; noteon/noteoff met aangehouden toetsen. Hardere aanslag klinkt helderder (Aanslagkleur). Expressie maakt swells. Elke speler is een eigen stem: met 4 spelers heeft de motor ruimte voor 8 noten tegelijk. Paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis.':
    'Plays received notes only. Note + dur works with sequencers; noteon/noteoff with held keys. Harder notes sound brighter (Velocity colour). Expression makes swells. Each player is its own voice: with 4 players the engine has room for 8 notes at once. A purple Mod cable controls sound parameters; the knobs stay the base.'
};
// [label, min, max, stap, start, eenheid, schaal, rol, drift, aan]
const SPEC = {
  brightness: ['Helderheid', 250, 9000, 10, 1500, 'Hz', 'log', 'filter', 0.025, true],
  blat: ['Blat', 0, 1, 0.01, 0.6, '%', 'lin', 'filter', 0.02, true],
  swell: ['Opzwellen', 0.01, 1, 0.005, 0.1, 's', 'log', 'env', 0.02, false],
  resonance: ['Resonantie', 0.5, 5, 0.1, 1.2, 'Q', 'lin', 'res', 0.01, true],
  edge: ['Scherpte', 0, 1, 0.01, 0.35, '%', 'lin', 'color', 0.025, true],
  mute: ['Demper', 0, 1, 0.01, 0, '%', 'lin', 'color', 0.02, true],
  velBright: ['Aanslagkleur', 0, 1, 0.01, 0.6, '%', 'lin', 'level', 0.015, false],
  attack: ['Opkomst', 0.005, 1, 0.005, 0.05, 's', 'log', 'env', 0.02, false],
  decay: ['Decay', 0.02, 2, 0.01, 0.2, 's', 'log', 'env', 0.02, false],
  sustain: ['Sustain', 0, 1, 0.01, 0.85, '%', 'lin', 'env', 0.02, false],
  release: ['Uitklank', 0.02, 3, 0.01, 0.18, 's', 'log', 'decay', 0.02, false],
  scoop: ['Aanzetglijding', 0, 100, 1, 30, 'cent', 'lin', 'pitch', 0.01, false],
  scoopTime: ['Glijtijd', 0.01, 0.3, 0.005, 0.07, 's', 'log', 'pitch', 0.01, false],
  breath: ['Adem', 0, 1, 0.01, 0.25, '%', 'lin', 'texture', 0.02, true],
  velocity: ['Aanslaggevoeligheid', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false],
  players: ['Spelers', 1, 4, 1, 1, '', 'lin', 'detune', 0.001, false],
  spread: ['Verstemming', 0, 30, 0.5, 8, 'cent', 'lin', 'detune', 0.015, false],
  stagger: ['Inzetverschil', 0, 80, 1, 12, 'ms', 'lin', 'motion', 0.015, false],
  width: ['Stereobreedte', 0, 1, 0.01, 0.6, '%', 'lin', 'pan', 0.02, true],
  vibrato: ['Vibrato', 0, 1, 0.01, 0.25, '%', 'lin', 'pitch', 0.015, true],
  vibRate: ['Vibratosnelheid', 3, 8, 0.1, 5.3, 'Hz', 'log', 'motion', 0.01, false],
  vibDelay: ['Vibratovertraging', 0, 2, 0.05, 0.4, 's', 'lin', 'motion', 0.01, false],
  transpose: ['Transpositie', -24, 24, 1, 0, 'st', 'lin', 'pitch', 0.001, false],
  expression: ['Expressie', 0, 1, 0.01, 0.9, '%', 'lin', 'level', 0.025, true],
  level: ['Uitgang', 0, 1, 0.01, 0.8, '%', 'lin', 'level', 0.015, false]
};
// transpose zit niet in de motor: de kaart verschuift het nootnummer; het aantal spelers is een gehele keuze
const MODEX = ['players', 'transpose'];
const RANGES = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, [d[1], d[2], d[4]]]));
const PRESETS = {
  'Trumpet': {},
  'Muted Trumpet': { brightness: 1800, blat: 0.4, mute: 0.85, edge: 0.25, breath: 0.15, attack: 0.04, scoop: 20, vibrato: 0.2 },
  'Flugelhorn': { brightness: 800, blat: 0.25, edge: 0.1, resonance: 0.8, attack: 0.08, release: 0.25, scoop: 15, vibrato: 0.3, breath: 0.2 },
  'Trombone': { brightness: 1000, blat: 0.7, swell: 0.14, edge: 0.4, attack: 0.07, release: 0.2, scoop: 45, scoopTime: 0.09, vibrato: 0.2, breath: 0.3, transpose: -12 },
  'French Horn': { brightness: 700, blat: 0.45, swell: 0.2, edge: 0.15, resonance: 0.9, attack: 0.12, release: 0.35, scoop: 12, vibrato: 0.15, breath: 0.2, width: 0.7 },
  'Brass Section': { brightness: 1700, blat: 0.7, edge: 0.45, attack: 0.05, release: 0.2, players: 4, spread: 10, stagger: 18, width: 0.8, vibrato: 0.2 },
  'Tight Stabs': { brightness: 2400, blat: 0.9, swell: 0.03, edge: 0.55, attack: 0.01, decay: 0.12, sustain: 0.55, release: 0.09, scoop: 25, scoopTime: 0.04, players: 3, spread: 9, stagger: 6, vibrato: 0, breath: 0.2 },
  'Slow Swell': { brightness: 1500, blat: 0.9, swell: 0.7, edge: 0.4, attack: 0.55, decay: 0.4, sustain: 0.9, release: 0.5, scoop: 0, players: 4, spread: 12, stagger: 40, width: 0.9, vibrato: 0.3, vibDelay: 0.6 },
  'Soft Ballad Horn': { brightness: 900, blat: 0.3, swell: 0.25, edge: 0.12, attack: 0.15, release: 0.4, scoop: 18, scoopTime: 0.12, vibrato: 0.4, vibDelay: 0.3, breath: 0.3, players: 2, spread: 6, stagger: 20, mute: 0.15 }
};
const WNAME = 'nl-patchkamer-brass-section-1-20-0';
const WORKLET = `
const RANGES = ${JSON.stringify(RANGES)};
const NV = 32, SUB = 8;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
const sclip = x => (x >= 3 ? 1 : x <= -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x));
class BrassEngine {
  constructor(sr) {
    this.sr = sr; this.q = []; this.rs = 0x1badf00d | 0; this.P = {}; this.S = {};
    for (const k in RANGES) { this.P[k] = RANGES[k][2]; this.S[k] = RANGES[k][2]; }
    this.v = Array.from({ length: NV }, () => this.blank());
    this.mute = [0, 0, 0, 0]; this.dc = [0, 0, 0, 0]; this.out = [0, 0];
    this.bufL = new Float32Array(SUB); this.bufR = new Float32Array(SUB);
  }
  blank() { return { st: 0, note: 60, f0: 261.6, ph: 0, env: 0, stage: 0, vel: 0.8, ic1: 0, ic2: 0, nl: 0, a1: 0, a2: 0, a3: 0, k: 1, age: 0, t0: 0, gateEnd: Infinity,
    det: 0, scoop: 0, sc: 1, scK: 1, fe: 0, feK: 0, bump: 1, bumpK: 1, burst: 1, burstK: 1, vp: 0, vr: 1, vd: 0.4, nz: 0, gl: 0.5, gr: 0.5, amp: 0.3, delay: 0,
    ar: 0.01, dk: 0.01, sus: 0.8, rk: 0.999, drv: 1, incr: 0.005 }; }
  rnd() { let s = this.rs; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rs = s; return (s >>> 0) / 2147483648 - 1; }
  setParams(p) { if (!p || typeof p !== 'object') return; for (const k in RANGES) { const x = p[k]; if (typeof x === 'number' && isFinite(x)) this.P[k] = clampN(x, RANGES[k][0], RANGES[k][1]); } }
  enqueue(m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'params') { this.setParams(m.p); return; }
    if (m.type === 'stop') { this.q.length = 0; for (const v of this.v) if (v.st) { v.gateEnd = -1; v.rk = Math.exp(-6.9 / (0.15 * this.sr)); } return; }
    if (!(typeof m.t === 'number' && isFinite(m.t) && typeof m.note === 'number' && isFinite(m.note))) return;
    if (m.type === 'note') {
      const vel = typeof m.vel === 'number' && isFinite(m.vel) ? clampN(m.vel, 0, 1) : 0.8;
      if (vel <= 0) { m = { type: 'off', note: m.note, t: m.t }; }
      else { m = { type: 'note', note: clampN(m.note, 0, 127), vel, t: m.t, dur: typeof m.dur === 'number' && isFinite(m.dur) && m.dur > 0 ? clampN(m.dur, 0.005, 3600) : Infinity }; }
    } else if (m.type === 'off') { m = { type: 'off', note: m.note, t: m.t }; } else return;
    if (this.q.length >= 1024) return;
    let i = this.q.length; while (i > 0 && this.q[i - 1].t > m.t) i--; this.q.splice(i, 0, m);
  }
  alloc() {
    let best = null;
    for (const v of this.v) if (v.st === 0) return v;
    for (const v of this.v) if (v.st === 2 && (!best || v.env < best.env)) best = v;
    if (best) return best;
    for (const v of this.v) if (!best || v.age > best.age) best = v;
    return best;
  }
  noteOn(m, tb) {
    const P = this.P, sr = this.sr, N = Math.round(P.players), att = Math.max(0.002, P.attack);
    const order = []; for (let j = 0; j < N; j++) order.push(j);
    for (let j = N - 1; j > 0; j--) { const r = Math.floor((this.rnd() * 0.5 + 0.5) * (j + 1)); const x = order[j]; order[j] = order[r]; order[r] = x; }
    for (let j = 0; j < N; j++) {
      const v = this.alloc(), fresh = v.st === 0, pj = order[j];
      if (fresh) { v.env = 0; v.ic1 = 0; v.ic2 = 0; v.nl = 0; v.ph = this.rnd() * 0.5 + 0.5; }
      v.st = 1; v.stage = 0; v.note = m.note; v.vel = m.vel; v.t0 = m.t; v.age = 0;
      v.f0 = 440 * Math.pow(2, (m.note - 69) / 12);
      const pos = N > 1 ? (pj / (N - 1)) * 2 - 1 : 0;
      v.det = P.spread * pos + P.spread * 0.15 * this.rnd();
      v.scoop = P.scoop * (1 + 0.25 * this.rnd()); v.sc = 1; v.scK = Math.exp(-SUB / (Math.max(0.005, P.scoopTime) * sr));
      v.fe = 0; v.feK = 1 - Math.exp(-SUB / (Math.max(0.01, P.swell) * sr / 3));
      v.bump = 1; v.bumpK = Math.exp(-SUB / (0.05 * sr)); v.burst = 1; v.burstK = Math.exp(-SUB / (0.06 * sr));
      v.vp = this.rnd() * 3; v.vr = 1 + 0.04 * this.rnd(); v.vd = P.vibDelay;
      v.ar = 1 / (att * sr); v.sus = P.sustain; v.dk = 1 - Math.exp(-1 / (Math.max(0.02, P.decay) * sr / 3));
      v.rk = Math.exp(-6.9 / (Math.max(0.02, P.release) * sr));
      const stag = N > 1 ? (P.stagger / 1000) * (j / (N - 1)) : 0;
      v.delay = fresh ? Math.round(stag * sr) : 0; v.gateEnd = m.t + m.dur + stag;
      v.drv = 1 + P.edge * 3 * (0.4 + 0.6 * m.vel);
      v.amp = 0.5 * ((1 - P.velocity) + P.velocity * m.vel) / Math.sqrt(N);
      const pan = N > 1 ? pos * P.width * 0.8 : 0, a = (pan + 1) * Math.PI / 4;
      v.gl = Math.cos(a) * 1.414; v.gr = Math.sin(a) * 1.414;
    }
  }
  noteOff(m) { for (const v of this.v) if (v.st === 1 && v.note === m.note && v.t0 <= m.t && v.gateEnd > m.t) v.gateEnd = m.t; }
  svf(fc, q) { const g = Math.tan(Math.PI * clampN(fc, 20, this.sr * 0.45) / this.sr), k = 1 / q, a1 = 1 / (1 + g * (g + k)); return [a1, g * a1, g * g * a1, k]; }
  render(L, R, len, t0) {
    const sr = this.sr, S = this.S, P = this.P, kk = 1 - Math.exp(-len / (sr * 0.04));
    for (const k in S) { if (!isFinite(S[k])) S[k] = P[k]; S[k] += (P[k] - S[k]) * kk; }
    const cm = this.svf(1800, 1.8), mu = this.mute, dc = this.dc, out = this.out;
    const bl = this.bufL, br = this.bufR;
    const q = 1 / Math.max(0.5, S.resonance);
    const mc = clampN(S.mute, 0, 1), gain = S.level * S.expression * 0.9, vib = S.vibrato * 35;
    for (let b = 0; b < len; b += SUB) {
      const n = Math.min(SUB, len - b), tb = t0 + b / sr;
      while (this.q.length && this.q[0].t <= tb) { const m = this.q.shift(); if (m.type === 'note') this.noteOn(m, tb); else this.noteOff(m); }
      bl.fill(0); br.fill(0);
      for (const v of this.v) {
        if (v.st === 0) continue;
        if (v.st === 1 && tb >= v.gateEnd) v.st = 2;
        const ageS = v.age / sr, vf = clampN((ageS - v.vd) / 0.5, 0, 1);
        v.vp += 2 * Math.PI * S.vibRate * v.vr * SUB / sr; if (v.vp > 6283.185) v.vp -= 6283.185;
        v.sc *= v.scK; v.fe += (1 - v.fe) * v.feK; v.bump *= v.bumpK; v.burst *= v.burstK;
        const cents = v.det + Math.sin(v.vp) * vib * vf - v.scoop * v.sc;
        const incr = Math.min(0.45, v.f0 * Math.pow(2, cents / 1200) / sr);
        const oct = S.blat * (3 * (v.fe - 1) + v.vel * v.bump) + S.velBright * (v.vel - 0.7) * 3 + (v.note - 60) / 36 - 1.3 * mc;
        const fc = clampN(S.brightness * Math.pow(2, oct), 40, Math.min(sr * 0.45, 16000));
        const g = Math.tan(Math.PI * fc / sr), a1 = 1 / (1 + g * (g + q)), a2 = g * a1, a3 = g * a2;
        const nz = S.breath * (0.03 + 0.45 * v.burst * v.vel), drv = v.drv, norm = 1 / (1 + 0.35 * (drv - 1));
        let { ph, env, ic1, ic2, nl, stage } = v, rs = this.rs, dead = false;
        for (let j = 0; j < n; j++) {
          if (v.delay > 0) { v.delay--; } else if (v.st === 2) { env *= v.rk; if (env < 1e-5) { v.st = 0; env = 0; break; } }
          else if (stage === 0) { env += v.ar; if (env >= 1) { env = 1; stage = 1; } }
          else if (stage === 1) { env += (v.sus - env) * v.dk; if (Math.abs(env - v.sus) < 0.001) stage = 2; }
          ph += incr; if (ph >= 1) ph -= 1;
          let saw = 2 * ph - 1;
          if (ph < incr) { const x = ph / incr; saw -= x + x - x * x - 1; } else if (ph > 1 - incr) { const x = (ph - 1) / incr; saw -= x * x + x + x + 1; }
          rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5; const r = (rs >>> 0) / 2147483648 - 1; nl += 0.3 * (r - nl);
          const x = saw * 0.8 + (r - nl) * nz;
          const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
          const s = sclip(v2 * drv) * norm * env * v.amp;
          if (!(s > -50 && s < 50)) { dead = true; break; }
          bl[j] += s * v.gl; br[j] += s * v.gr;
        }
        this.rs = rs;
        if (dead || !(ic1 > -1e4 && ic1 < 1e4 && ic2 > -1e4 && ic2 < 1e4 && ph >= 0 && ph <= 1 && env >= 0 && env <= 1.01)) { v.st = 0; v.env = 0; v.ic1 = 0; v.ic2 = 0; v.nl = 0; v.ph = 0; v.age = 0; continue; }
        v.ph = ph; v.env = env; v.ic1 = ic1; v.ic2 = ic2; v.nl = nl; v.stage = stage; v.age += n;
      }
      for (let j = 0; j < n; j++) {
        let ch = 0;
        for (const x0 of [bl[j], br[j]]) {
          const o = ch * 2;
          const v3 = x0 - mu[o + 1], v1 = cm[0] * mu[o] + cm[1] * v3, v2 = mu[o + 1] + cm[1] * mu[o] + cm[2] * v3; mu[o] = 2 * v1 - mu[o]; mu[o + 1] = 2 * v2 - mu[o + 1];
          let y = (1 - mc) * x0 + mc * (v1 * cm[3] * 2.4 + 0.1 * x0);
          const hp = y - dc[ch] + 0.995 * dc[ch + 2]; dc[ch] = y; dc[ch + 2] = hp;
          const yy = sclip(hp * gain); out[ch++] = yy === yy ? yy : 0;
        }
        L[b + j] = out[0]; if (R) R[b + j] = out[1];
      }
    }
    // bewaker voor de bus: niet-eindige toestanden worden teruggezet
    for (let i = 0; i < 4; i++) if (!(mu[i] > -1e4 && mu[i] < 1e4)) mu[i] = 0;
    for (let i = 0; i < 4; i++) if (!(dc[i] > -1e4 && dc[i] < 1e4)) dc[i] = 0;
  }
}
class PkBrass extends AudioWorkletProcessor {
  constructor() { super(); this.e = new BrassEngine(sampleRate); this.port.onmessage = e => { try { this.e.enqueue(e.data); } catch (err) {} }; }
  process(inputs, outputs) { const o = outputs[0]; if (!o || !o[0]) return true; try { this.e.render(o[0], o[1], o[0].length, currentTime); } catch (err) { o[0].fill(0); if (o[1]) o[1].fill(0); } return true; }
}
registerProcessor('${WNAME}', PkBrass);
`;
export default {
  id: 'nl.patchkamer.brass-section', name: 'Brass Section', version: '1.21.0', kind: 'instrument', category: 'synth',
  ui: { width: 720, minWidth: 340 },
  about: { nl: 'Een polyfoon koperinstrument (trompet, trombone, hoorn, sectie) met 1 tot 4 spelers per noot.', en: 'A polyphonic brass instrument (trumpet, trombone, horn, section) with 1 to 4 players per note.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo brass' }], eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { out: 'Stereo koper', notes: 'Keyboard / noten' } } },
  modExclude: MODEX,
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const spec = {}; for (const [id, d] of Object.entries(SPEC)) spec[id] = [tx(d[0]), ...d.slice(1)];
    const defaults = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, d[4]])); defaults.preset = 'Trumpet';
    let state = { ...defaults }, effective = { ...defaults }, mod = {}, dead = false, root = null, controls = {}, presetSelect = null, status = null, warn = null, node = null;
    const pending = [], out = ctx.createGain(); out.gain.value = 1;
    const resolve = () => { const r = { ...state }; for (const [id, d] of Object.entries(spec)) { const o = mod[id] || 0; r[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** o : state[id] + o * (d[2] - d[1]), d[1], d[2]); } return r; };
    const post = m => { if (node) node.port.postMessage(m); else if (pending.length < 64) pending.push(m); };
    function apply() { if (dead) return; effective = resolve(); const p = {}; for (const k of Object.keys(SPEC)) p[k] = effective[k]; if (node) node.port.postMessage({ type: 'params', p }); else { const i = pending.findIndex(m => m.type === 'params'); if (i >= 0) pending.splice(i, 1); pending.unshift({ type: 'params', p }); } }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.connect(out); apply(); pending.splice(0).forEach(m => { if (m.type !== 'params' && !(m.t > ctx.currentTime)) return; if (m.type !== 'params') node.port.postMessage(m); });
      if (warn) warn.textContent = '';
    }).catch(() => { if (!dead && warn) warn.textContent = tx('AudioWorklet niet beschikbaar: Brass Section kan hier geen geluid maken.'); });
    function noteOn(note, vel, t, dur) { post({ type: 'note', note: clamp(note + effective.transpose, 0, 127), vel, t, dur: Number.isFinite(dur) ? dur : -1 }); }
    function noteOff(note, t) { post({ type: 'off', note: clamp(note + effective.transpose, 0, 127), t }); }
    function panic() { pending.length = 0; apply(); if (node) node.port.postMessage({ type: 'stop' }); }
    function paint() { for (const k in controls) controls[k].set(state[k]); if (presetSelect) presetSelect.value = state.preset; if (status) { const a = Object.values(mod).filter(v => v !== 0).length; status.textContent = a ? tx('Mod actief · {0} parameters', a) : tx('32 stemmen · keyboard/sequencer → oranje Noten · stereo uit → mixer'); } }
    function change(id, value) { const d = spec[id]; if (!d || !Number.isFinite(+value)) return; state[id] = Number(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint(); }
    const fmt = (d, v) => d[5] === '%' ? Math.round(v * 100) + '%' : d[5] === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : d[5] === '' ? String(Math.round(v)) : d[5] === 'Hz' && v > 100 ? Math.round(v) + ' Hz' : v.toFixed(d[3] < 1 ? 1 : 0) + ' ' + d[5];
    const self = {
      inputs: {}, outputs: { out },
      mount(el) {
        if (root) self.unmount(); root = el;
        const css = document.createElement('style'); css.textContent = '.bs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px 18px;margin-top:4px}.bs-grid .k{grid-template-columns:124px minmax(90px,1fr) 62px;gap:8px;min-height:30px}.bs-grid .k label{font-size:10px;letter-spacing:.04em}.bs-grid .k output{font-size:11px;white-space:nowrap}.bs-grid input[type=range]{width:100%;min-width:90px;height:24px;margin:0;cursor:pointer;accent-color:var(--audio,#e4c697)}'; el.appendChild(css);
        presetSelect = host.ui.select(el, 'Brass', Object.keys(PRESETS).map(k => [k, k]).concat([['Custom', tx('Eigen klank')]]), state.preset, name => { if (Object.hasOwn(PRESETS, name)) self.setState({ ...defaults, ...PRESETS[name], preset: name }); }, { id: 'preset', group: 'preset' });
        const groups = [[tx('Toon & blat'), ['brightness', 'blat', 'swell', 'resonance', 'edge', 'mute', 'velBright'], 'tone'], [tx('Aanzet & spel'), ['attack', 'decay', 'sustain', 'release', 'scoop', 'scoopTime', 'breath', 'velocity'], 'attack'],
          [tx('Sectie & vibrato'), ['players', 'spread', 'stagger', 'width', 'vibrato', 'vibRate', 'vibDelay'], 'section'], [tx('Spel & niveau'), ['transpose', 'expression', 'level'], 'play']];
        for (const [label, ids, grp] of groups) {
          const h = document.createElement('div'); h.textContent = label; h.style.cssText = 'font-size:12px;opacity:.8;border-top:1px solid var(--line);padding-top:8px;margin-top:9px'; el.appendChild(h);
          const grid = document.createElement('div'); grid.className = 'bs-grid'; el.appendChild(grid);
          for (const id of ids) { const d = spec[id], before = grid.children.length; controls[id] = host.ui.knob(grid, d[0], [d[1], d[2], d[3]], state[id], v => fmt(d, v), v => change(id, v), { default: defaults[id], id, group: grp }); const row = grid.children[before]; if (row) row.title = d[0]; }
        }
        const actions = document.createElement('div'); actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px'; el.appendChild(actions);
        const button = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); };
        button(tx('Proeftoon'), () => noteOn(64, 0.85, ctx.currentTime + 0.01, 1.2)); button(tx('Proefakkoord'), () => { const t = ctx.currentTime + 0.01; [52, 59, 64, 67].forEach(n => noteOn(n, 0.8, t, 1.5)); }); button(tx('Alles uit'), () => panic());
        status = document.createElement('p'); status.style.cssText = 'font-size:12px;color:var(--mod);line-height:1.5'; el.appendChild(status);
        warn = document.createElement('p'); warn.className = 'note'; warn.textContent = node ? '' : tx('AudioWorklet laden…'); el.appendChild(warn);
        const tip = document.createElement('p'); tip.className = 'note'; tip.textContent = tx('Speelt alleen ontvangen noten. Note + dur werkt met sequencers; noteon/noteoff met aangehouden toetsen. Hardere aanslag klinkt helderder (Aanslagkleur). Expressie maakt swells. Elke speler is een eigen stem: met 4 spelers heeft de motor ruimte voor 8 noten tegelijk. Paarse Mod-kabel stuurt klankparameters; de knoppen blijven de basis.'); el.appendChild(tip);
        paint();
      },
      unmount() { if (root) root.innerHTML = ''; root = null; controls = {}; presetSelect = null; status = null; warn = null; },
      onEvent(port, event) {
        try {
          if (dead || port !== 'notes' || !event) return;
          const time = Number.isFinite(event.time) ? event.time : ctx.currentTime, t = Math.max(ctx.currentTime, time), type = String(event.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(event.note)) {
            const n = clamp(event.note, 0, 127);
            if (type === 'noteoff' || event.vel === 0) noteOff(n, t); else noteOn(n, Number.isFinite(event.vel) ? clamp(event.vel, 0, 1) : 0.8, t, Number.isFinite(event.dur) ? clamp(event.dur, 0.005, 120) : undefined);
          } else if (type === 'cc' && Object.hasOwn(spec, event.id) && Number.isFinite(event.value)) {
            const d = spec[event.id]; state[event.id] = Number(clamp(Math.round((d[1] + clamp(event.value, 0, 1) * (d[2] - d[1])) / d[3]) * d[3], d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); paint();
          } else if (type === 'panic' || type === 'allnotesoff') panic();
        } catch (e) {}
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(); },
      params() { return Object.entries(spec).filter(([id]) => !MODEX.includes(id)).map(([id, d]) => ({ id, name: d[0], lane: 'brass', laneName: 'Brass', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
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
        if (s.preset === 'Custom' || (typeof s.preset === 'string' && Object.hasOwn(PRESETS, s.preset))) next.preset = s.preset;
        state = next; apply(); paint();
      },
      destroy() { if (dead) return; dead = true; try { if (node) { node.port.postMessage({ type: 'stop' }); node.disconnect(); } out.disconnect(); } catch (e) {} node = null; pending.length = 0; self.unmount(); }
    };
    apply(); return self;
  }
};
