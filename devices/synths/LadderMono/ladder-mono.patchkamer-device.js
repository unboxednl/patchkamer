// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.17.0 — Uitleg naar about (menu Over Ladder Mono); de UI toont geen uitlegtekst meer. Geluid, state en poorten ongewijzigd.
// 1.16.0 — Titel in de UI verwijderd: de kaartbalk toont de naam. Geluid, state en poorten ongewijzigd.
// 1.15.1 — Meer regelaars stuurbaar voor modulatoren: toetsvolging, de vier tijden en houdniveaus van beide omhullingen en de LFO-snelheid stonden niet in params().
//   Nu wel (alle standaard uit). Klank en instellingen zijn ongewijzigd. Bewust weggelaten: Bereik 1-3, Bendbereik en Transpositie (gehele stappen, geen vloeiende regelaars),
//   en de keuzelijsten en schakelaars.
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.13.0 — Eerste versie. Ladder Mono: een monofone analoge synth in de geest van klassieke analoge monosynths, volgens Patchkamer contract v1.13. Drie oscillators (zes golfvormen, bereik in octaven, fijne stemming,
//          harde sync van oscillator 2 op 1, oscillator 3 los van het klavier), een ruisbron (wit of roze), een mixer die kan overstuurd raken, een vierpolig laddermodel-filter van 24 dB per octaaf met terugkoppeling
//          (zelfoscillatie bij hoge emphasis), twee omhullingen (filter en volume, elk met aanval, verval, houd en loslaten), toetsvolging, glide, een LFO naar toonhoogte en filter, pitchbend en vibrato
//          via CC, en een uitgangsvervorming. Alles draait in een AudioWorklet met 2× oversampling in het filter, polyBLEP-oscillators en een bewaking tegen niet-eindige waarden. Bestuurbaar via
//          sturingskabels, CC-ingang en de MIDI Hub.
// Ladder Mono — monofone analoge synth met een laddermodel-filter · Patchkamer contract v1.13

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WAVES = ['tri', 'shark', 'saw', 'square', 'wide', 'narrow'], LFOS = ['tri', 'square', 'saw', 'sh'];
const pct = v => Math.round(v * 100) + '%', sec = v => (v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s'), hz = v => (v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz'), st = v => (v > 0 ? '+' : '') + v.toFixed(2) + ' st', oc = v => (v > 0 ? '+' : '') + v.toFixed(1) + ' oct';
// Alle parameters: type, bereik, standaard, groep. 'log' = logaritmische knop.
const SPEC = {
  wave1: { t: 'enum', o: WAVES, d: 'saw', g: 'osc' }, range1: { t: 'int', min: -2, max: 2, d: 0, f: v => (v > 0 ? '+' : '') + v + ' oct', g: 'osc' }, level1: { t: 'num', min: 0, max: 1, d: 0.8, f: pct, g: 'osc' },
  wave2: { t: 'enum', o: WAVES, d: 'saw', g: 'osc' }, range2: { t: 'int', min: -2, max: 2, d: 0, f: v => (v > 0 ? '+' : '') + v + ' oct', g: 'osc' }, tune2: { t: 'num', min: -7, max: 7, d: 0.1, f: st, g: 'osc' }, level2: { t: 'num', min: 0, max: 1, d: 0.6, f: pct, g: 'osc' }, sync: { t: 'bool', d: false, g: 'osc' },
  wave3: { t: 'enum', o: WAVES, d: 'square', g: 'osc' }, range3: { t: 'int', min: -2, max: 2, d: -1, f: v => (v > 0 ? '+' : '') + v + ' oct', g: 'osc' }, tune3: { t: 'num', min: -7, max: 7, d: 0, f: st, g: 'osc' }, level3: { t: 'num', min: 0, max: 1, d: 0.5, f: pct, g: 'osc' }, keys3: { t: 'bool', d: true, g: 'osc' },
  noise: { t: 'num', min: 0, max: 1, d: 0, f: pct, g: 'mix' }, noiseColor: { t: 'enum', o: ['white', 'pink'], d: 'white', g: 'mix' }, drive: { t: 'num', min: 0, max: 1, d: 0.2, f: pct, g: 'mix' },
  cutoff: { t: 'num', min: 20, max: 16000, d: 900, scale: 'log', f: hz, g: 'filter' }, emphasis: { t: 'num', min: 0, max: 1.05, d: 0.3, f: pct, g: 'filter' }, contour: { t: 'num', min: -5, max: 5, d: 2.5, f: oc, g: 'filter' }, keytrack: { t: 'num', min: 0, max: 1, d: 0.67, f: pct, g: 'filter' },
  fAttack: { t: 'num', min: 0.001, max: 10, d: 0.005, scale: 'log', f: sec, g: 'contour' }, fDecay: { t: 'num', min: 0.005, max: 10, d: 0.4, scale: 'log', f: sec, g: 'contour' }, fSustain: { t: 'num', min: 0, max: 1, d: 0.3, f: pct, g: 'contour' }, fRelease: { t: 'num', min: 0.005, max: 10, d: 0.3, scale: 'log', f: sec, g: 'contour' },
  aAttack: { t: 'num', min: 0.001, max: 10, d: 0.005, scale: 'log', f: sec, g: 'loud' }, aDecay: { t: 'num', min: 0.005, max: 10, d: 0.4, scale: 'log', f: sec, g: 'loud' }, aSustain: { t: 'num', min: 0, max: 1, d: 0.7, f: pct, g: 'loud' }, aRelease: { t: 'num', min: 0.005, max: 10, d: 0.25, scale: 'log', f: sec, g: 'loud' },
  glide: { t: 'num', min: 0, max: 2, d: 0, f: sec, g: 'play' }, trigger: { t: 'enum', o: ['retrigger', 'legato'], d: 'retrigger', g: 'play' }, bendRange: { t: 'int', min: 0, max: 12, d: 2, f: v => v + ' st', g: 'play' }, transpose: { t: 'int', min: -24, max: 24, d: 0, f: v => (v > 0 ? '+' : '') + v + ' st', g: 'play' },
  lfoRate: { t: 'num', min: 0.1, max: 30, d: 5, scale: 'log', f: v => v.toFixed(1) + ' Hz', g: 'mod' }, lfoShape: { t: 'enum', o: LFOS, d: 'tri', g: 'mod' }, lfoPitch: { t: 'num', min: 0, max: 100, d: 0, f: v => v.toFixed(0) + ' ct', g: 'mod' }, lfoFilter: { t: 'num', min: 0, max: 3, d: 0, f: oc, g: 'mod' },
  outDrive: { t: 'num', min: 0, max: 1, d: 0.1, f: pct, g: 'out' }, level: { t: 'num', min: 0, max: 1.5, d: 0.4, f: pct, g: 'out' }
};
const MODS = ['cutoff', 'emphasis', 'contour', 'lfoPitch', 'lfoFilter', 'drive', 'level1', 'level2', 'level3', 'tune2', 'tune3', 'noise', 'glide', 'outDrive', 'level', 'keytrack', 'lfoRate', 'fAttack', 'fDecay', 'fSustain', 'fRelease', 'aAttack', 'aDecay', 'aSustain', 'aRelease'];
const GROUPS = ['osc', 'mix', 'filter', 'contour', 'loud', 'play', 'mod', 'out'];
const defaults = () => Object.fromEntries(Object.entries(SPEC).map(([k, s]) => [k, s.d]));
function normalize(raw) {
  const s = defaults(); raw = raw && typeof raw === 'object' ? raw : {};
  for (const [k, sp] of Object.entries(SPEC)) { const v = raw[k]; if (v === undefined) continue;
    if (sp.t === 'enum') { if (sp.o.includes(v)) s[k] = v; } else if (sp.t === 'bool') { if (typeof v === 'boolean') s[k] = v; } else if (typeof v === 'number' && Number.isFinite(v)) s[k] = sp.t === 'int' ? Math.round(clamp(v, sp.min, sp.max)) : clamp(v, sp.min, sp.max); }
  return s;
}
// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { engine: ['Audiomotor wordt voorbereid…', 'Audiomotor gereed', 'Deze omgeving biedt geen AudioWorklet: het apparaat blijft stil.'],
    groups: { osc: 'Oscillators', mix: 'Mixer', filter: 'Filter', contour: 'Filteromhulling', loud: 'Volume-omhulling', play: 'Spelen', mod: 'Modulatie', out: 'Uitgang' },
    labels: { wave1: 'Golfvorm 1', range1: 'Bereik 1', level1: 'Niveau 1', wave2: 'Golfvorm 2', range2: 'Bereik 2', tune2: 'Stemming 2', level2: 'Niveau 2', sync: 'Sync 2 op 1', wave3: 'Golfvorm 3', range3: 'Bereik 3', tune3: 'Stemming 3', level3: 'Niveau 3', keys3: 'Osc 3 volgt klavier',
      noise: 'Ruis', noiseColor: 'Ruiskleur', drive: 'Mixer-overstuur', cutoff: 'Cutoff', emphasis: 'Emphasis', contour: 'Omhullingsdiepte', keytrack: 'Toetsvolging', fAttack: 'Aanval', fDecay: 'Verval', fSustain: 'Houd', fRelease: 'Loslaten', aAttack: 'Aanval', aDecay: 'Verval', aSustain: 'Houd', aRelease: 'Loslaten',
      glide: 'Glide', trigger: 'Aanslag', bendRange: 'Bendbereik', transpose: 'Transpositie', lfoRate: 'LFO-snelheid', lfoShape: 'LFO-vorm', lfoPitch: 'LFO naar toonhoogte', lfoFilter: 'LFO naar filter', outDrive: 'Uitgangsvervorming', level: 'Niveau' },
    opts: { tri: 'Driehoek', shark: 'Haaientand', saw: 'Zaagtand', square: 'Blok', wide: 'Brede puls', narrow: 'Smalle puls', white: 'Wit', pink: 'Roze', retrigger: 'Elke noot', legato: 'Legato', sh: 'Sample & hold' } },
  en: { engine: ['Preparing the audio engine…', 'Audio engine ready', 'This environment has no AudioWorklet: the device stays silent.'],
    groups: { osc: 'Oscillators', mix: 'Mixer', filter: 'Filter', contour: 'Filter envelope', loud: 'Loudness envelope', play: 'Play', mod: 'Modulation', out: 'Output' },
    labels: { wave1: 'Waveform 1', range1: 'Range 1', level1: 'Level 1', wave2: 'Waveform 2', range2: 'Range 2', tune2: 'Tune 2', level2: 'Level 2', sync: 'Sync 2 to 1', wave3: 'Waveform 3', range3: 'Range 3', tune3: 'Tune 3', level3: 'Level 3', keys3: 'Osc 3 follows keyboard',
      noise: 'Noise', noiseColor: 'Noise colour', drive: 'Mixer overload', cutoff: 'Cutoff', emphasis: 'Emphasis', contour: 'Envelope amount', keytrack: 'Key tracking', fAttack: 'Attack', fDecay: 'Decay', fSustain: 'Sustain', fRelease: 'Release', aAttack: 'Attack', aDecay: 'Decay', aSustain: 'Sustain', aRelease: 'Release',
      glide: 'Glide', trigger: 'Trigger', bendRange: 'Bend range', transpose: 'Transpose', lfoRate: 'LFO rate', lfoShape: 'LFO shape', lfoPitch: 'LFO to pitch', lfoFilter: 'LFO to filter', outDrive: 'Output drive', level: 'Level' },
    opts: { tri: 'Triangle', shark: 'Shark tooth', saw: 'Sawtooth', square: 'Square', wide: 'Wide pulse', narrow: 'Narrow pulse', white: 'White', pink: 'Pink', retrigger: 'Every note', legato: 'Legato', sh: 'Sample & hold' } }
};

// De DSP-motor. De klasse is zelfstandig: hij gaat als tekst de AudioWorklet in, dus hij gebruikt niets buiten zichzelf.
class LadderEngine {
  constructor(sr, p) {
    this.sr = sr; this.p = null; this.queue = []; this.stack = []; this.gate = false; this.pitch = 48; this.target = 48; this.ph = [0, 0, 0]; this.nb = [0, 0, 0, 0, 0, 0, 0]; this.z = [0, 0, 0, 0]; this.xin = 0;
    this.ae = 0; this.as = 0; this.fe = 0; this.fs = 0; this.lfoPh = 0; this.sh = 0; this.bend = 0.5; this.mw = 0; this.vel = 0.8; this.rnd = 22222; this.dc = [0, 0]; this.resets = 0; this.idc = 0; this.setParams(p || {});
  }
  setParams(q) {
    const n = (k, a, b, d) => (typeof q[k] === 'number' && Number.isFinite(q[k]) ? Math.min(b, Math.max(a, q[k])) : (this.p ? this.p[k] : d));
    this.p = {
      w1: n('w1', 0, 5, 2) | 0, w2: n('w2', 0, 5, 2) | 0, w3: n('w3', 0, 5, 3) | 0, r1: n('r1', -2, 2, 0) | 0, r2: n('r2', -2, 2, 0) | 0, r3: n('r3', -2, 2, -1) | 0, t2: n('t2', -7, 7, 0), t3: n('t3', -7, 7, 0), l1: n('l1', 0, 1, 0.8), l2: n('l2', 0, 1, 0.6), l3: n('l3', 0, 1, 0.5),
      sync: n('sync', 0, 1, 0) | 0, keys3: n('keys3', 0, 1, 1) | 0, noise: n('noise', 0, 1, 0), pink: n('pink', 0, 1, 0) | 0, drive: n('drive', 0, 1, 0.2), cutoff: n('cutoff', 20, 16000, 900), emph: n('emph', 0, 1.05, 0.3), contour: n('contour', -5, 5, 2.5), kt: n('kt', 0, 1, 0.67),
      fa: n('fa', 0.001, 10, 0.005), fd: n('fd', 0.005, 10, 0.4), fs: n('fs', 0, 1, 0.3), fr: n('fr', 0.005, 10, 0.3), aa: n('aa', 0.001, 10, 0.005), ad: n('ad', 0.005, 10, 0.4), as: n('as', 0, 1, 0.7), ar: n('ar', 0.005, 10, 0.25),
      glide: n('glide', 0, 2, 0), legato: n('legato', 0, 1, 0) | 0, bendRange: n('bendRange', 0, 12, 2), tr: n('tr', -24, 24, 0) | 0, lfoRate: n('lfoRate', 0.1, 30, 5), lfoShape: n('lfoShape', 0, 3, 0) | 0, lfoPitch: n('lfoPitch', 0, 100, 0), lfoFilter: n('lfoFilter', 0, 3, 0), odrive: n('odrive', 0, 1, 0.1), level: n('level', 0, 1.5, 0.7)
    };
  }
  enqueue(e) {
    if (!e || !Number.isFinite(e.time)) return; const t = e.time, type = e.type;
    if (type === 'allnotesoff' || type === 'panic') { this.queue = this.queue.filter(x => x.time < t); this.ins({ time: t, kind: 'clear' }); return; }
    if (type === 'bend' || type === 'wheel') { if (Number.isFinite(e.value)) this.ins({ time: t, kind: type, v: Math.min(1, Math.max(0, e.value)) }); return; }
    if (!Number.isFinite(e.note)) return; const note = Math.round(Math.min(127, Math.max(0, e.note)));
    if (type === 'noteoff') { this.ins({ time: t, kind: 'off', note }); return; }
    if (type !== 'note' && type !== 'noteon') return; const id = ++this.idc, vel = Number.isFinite(e.vel) ? Math.min(1, Math.max(0.01, e.vel)) : 0.8, held = e.held === true || type === 'noteon' || !Number.isFinite(e.dur) || e.dur >= 100;
    this.ins({ time: t, kind: 'on', note, vel, id }); if (!held) this.ins({ time: t + Math.min(120, Math.max(0.005, e.dur)), kind: 'off', note, id });
  }
  ins(ev) { const q = this.queue; let i = q.length; while (i > 0 && q[i - 1].time > ev.time) i--; q.splice(i, 0, ev); if (q.length > 4096) q.shift(); }
  fire(ev) {
    const p = this.p;
    if (ev.kind === 'clear') { this.stack = []; this.gate = false; this.as = 4; this.fs = 4; } else if (ev.kind === 'bend') this.bend = ev.v; else if (ev.kind === 'wheel') this.mw = ev.v;
    else if (ev.kind === 'on') {
      const was = this.gate; this.stack.push({ note: ev.note, id: ev.id }); this.target = ev.note + p.tr; this.vel = ev.vel; this.gate = true;
      if (!was || !p.legato) { this.as = 1; this.fs = 1; }
      if (!was && !(this.ae > 0.001)) { if (!(p.glide > 0.0005)) this.pitch = this.target; }
    } else if (ev.kind === 'off') {
      let i = -1; for (let k = this.stack.length - 1; k >= 0; k--) { if (ev.id ? this.stack[k].id === ev.id : this.stack[k].note === ev.note) { i = k; break; } }
      if (i >= 0) this.stack.splice(i, 1);
      if (!this.stack.length) { this.gate = false; this.as = 4; this.fs = 4; } else this.target = this.stack[this.stack.length - 1].note + p.tr;
    }
  }
  poly(t, dt) { if (t < dt) { const x = t / dt; return x + x - x * x - 1; } if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; } return 0; }
  wave(ph, dt, w) {
    if (w === 0) return 4 * Math.abs(ph - 0.5) - 1;
    if (w === 2) return 2 * ph - 1 - this.poly(ph, dt);
    if (w === 1) return 0.5 * (4 * Math.abs(ph - 0.5) - 1) + 0.5 * (2 * ph - 1 - this.poly(ph, dt));
    const wd = w === 3 ? 0.5 : w === 4 ? 0.25 : 0.1; let v = ph < wd ? 1 : -1; v += this.poly(ph, dt); let q = ph - wd; if (q < 0) q += 1; v -= this.poly(q, dt); return v;
  }
  process(L, R, t0) {
    const p = this.p, sr = this.sr, n = L.length, os = sr * 2, q = this.queue;
    const cA = t => 1 - Math.exp(-1 / (Math.max(0.001, t) * sr / 3)), cd = cA(p.ad), cr = cA(p.ar), fcd = cA(p.fd), fcr = cA(p.fr), ra = 1 / (Math.max(0.001, p.aa) * sr), fra = 1 / (Math.max(0.001, p.fa) * sr);
    const gl = p.glide > 0.0005 ? 1 - Math.exp(-1 / (p.glide / 3 * sr)) : 1, lfoInc = p.lfoRate / sr, k = p.emph * 4, bendSemis = p.bendRange * 2 * (this.bend - 0.5), pdb = 1 + p.drive * 5, od = 1 + p.odrive * 4;
    for (let i = 0; i < n; i++) {
      const t = t0 + i / sr; while (q.length && q[0].time <= t) this.fire(q.shift());
      // omhullingen
      if (this.as === 1) { this.ae += ra; if (this.ae >= 1) { this.ae = 1; this.as = 2; } } else if (this.as === 2) { this.ae += (p.as - this.ae) * cd; if (Math.abs(this.ae - p.as) < 1e-4) { this.ae = p.as; this.as = 3; } } else if (this.as === 3) this.ae = p.as; else if (this.as === 4) { this.ae += (0 - this.ae) * cr; if (this.ae < 1e-5) { this.ae = 0; this.as = 0; } }
      if (this.fs === 1) { this.fe += fra; if (this.fe >= 1) { this.fe = 1; this.fs = 2; } } else if (this.fs === 2) { this.fe += (p.fs - this.fe) * fcd; if (Math.abs(this.fe - p.fs) < 1e-4) { this.fe = p.fs; this.fs = 3; } } else if (this.fs === 3) this.fe = p.fs; else if (this.fs === 4) { this.fe += (0 - this.fe) * fcr; if (this.fe < 1e-5) { this.fe = 0; this.fs = 0; } }
      // lfo
      this.lfoPh += lfoInc; if (this.lfoPh >= 1) { this.lfoPh -= 1; this.rnd = (this.rnd * 1664525 + 1013904223) >>> 0; this.sh = this.rnd / 2147483648 - 1; }
      const lp = this.lfoPh, lfo = p.lfoShape === 0 ? 4 * Math.abs(lp - 0.5) - 1 : p.lfoShape === 1 ? (lp < 0.5 ? 1 : -1) : p.lfoShape === 2 ? 1 - 2 * lp : this.sh;
      // toonhoogte
      this.pitch += (this.target - this.pitch) * gl;
      const semis = this.pitch + bendSemis + lfo * (p.lfoPitch + this.mw * 60) / 100, ph = this.ph;
      const f1 = 440 * Math.pow(2, (semis + p.r1 * 12 - 69) / 12), f2 = 440 * Math.pow(2, (semis + p.r2 * 12 + p.t2 - 69) / 12), f3 = 440 * Math.pow(2, ((p.keys3 ? semis : 48) + p.r3 * 12 + p.t3 - 69) / 12);
      const d1 = Math.min(0.45, f1 / sr), d2 = Math.min(0.45, f2 / sr), d3 = Math.min(0.45, f3 / sr);
      ph[0] += d1; if (ph[0] >= 1) { ph[0] -= 1; if (p.sync) ph[1] = 0; } ph[1] += d2; if (ph[1] >= 1) ph[1] -= 1; ph[2] += d3; if (ph[2] >= 1) ph[2] -= 1;
      let m = 0.4 * (this.wave(ph[0], d1, p.w1) * p.l1 + this.wave(ph[1], d2, p.w2) * p.l2 + this.wave(ph[2], d3, p.w3) * p.l3);
      if (p.noise > 0) {
        this.rnd = (this.rnd * 1664525 + 1013904223) >>> 0; const wn = this.rnd / 2147483648 - 1; let nv = wn;
        if (p.pink) { const b = this.nb; b[0] = 0.99886 * b[0] + wn * 0.0555179; b[1] = 0.99332 * b[1] + wn * 0.0750759; b[2] = 0.969 * b[2] + wn * 0.153852; b[3] = 0.8665 * b[3] + wn * 0.3104856; b[4] = 0.55 * b[4] + wn * 0.5329522; b[5] = -0.7616 * b[5] - wn * 0.016898; nv = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + wn * 0.5362) * 0.11; b[6] = wn * 0.115926; }
        m += nv * p.noise * 0.5;
      }
      m = Math.tanh(m * pdb) / Math.tanh(pdb) * 0.9;
      // filter: toonhoogtevolging, omhulling en LFO
      const oct = p.contour * this.fe * (0.7 + 0.3 * this.vel) + p.lfoFilter * lfo + p.kt * (this.pitch - 48) / 12;
      let fc = p.cutoff * Math.pow(2, oct); if (!(fc > 20)) fc = 20; if (fc > 18000) fc = 18000;
      const g = Math.tan(Math.PI * fc / os), G = g / (1 + g), G2 = G * G, G4 = G2 * G2, z = this.z, ig = 1 / (1 + g); let y = 0;
      for (let s = 0; s < 2; s++) {
        const x = s === 0 ? 0.5 * (this.xin + m) : m, S = G2 * G * z[0] * ig + G2 * z[1] * ig + G * z[2] * ig + z[3] * ig;
        let u = (x - k * S) / (1 + k * G4); u = Math.tanh(u);
        const v1 = (u - z[0]) * G, y1 = v1 + z[0]; z[0] = y1 + v1; const v2 = (y1 - z[1]) * G, y2 = v2 + z[1]; z[1] = y2 + v2; const v3 = (y2 - z[2]) * G, y3 = v3 + z[2]; z[2] = y3 + v3; const v4 = (y3 - z[3]) * G, y4 = v4 + z[3]; z[3] = y4 + v4; y += 0.5 * y4;
      }
      this.xin = m;
      let out = y * (1 + 0.3 * p.emph) * this.ae * (0.55 + 0.45 * this.vel); out = Math.tanh(out * od) / Math.tanh(od);
      // dc-blokker en bewaking tegen niet-eindige waarden
      const dcy = out - this.dc[0] + 0.995 * this.dc[1]; this.dc[0] = out; this.dc[1] = dcy; out = dcy * p.level;
      if (!(out > -50 && out < 50)) { z[0] = z[1] = z[2] = z[3] = 0; this.xin = 0; this.dc[0] = this.dc[1] = 0; this.resets++; out = 0; }
      L[i] = out; R[i] = out;
    }
  }
}
const WNAME = 'nl-patchkamer-laddermono-1-13-0';
const ENGINE_CODE = LadderEngine.toString() + `
registerProcessor('${WNAME}', class extends AudioWorkletProcessor {
  constructor(options) { super(); this.engine = new LadderEngine(sampleRate, options.processorOptions && options.processorOptions.params); this.closed = false;
    this.port.onmessage = e => { const m = e.data; if (!m) return; if (m.type === 'params') this.engine.setParams(m.params); else if (m.type === 'event') this.engine.enqueue(m.event); else if (m.type === 'close') this.closed = true; }; }
  process(inputs, outputs) { const o = outputs[0]; if (this.closed || !o || !o.length) return !this.closed; this.engine.process(o[0], o[1] || o[0], currentTime); return true; }
});`;

export default {
  id: 'nl.patchkamer.laddermono', name: 'Ladder Mono', version: '1.17.0', modExclude: ['range1', 'range2', 'range3', 'bendRange', 'transpose'], kind: 'instrument', category: 'synth', ui: { width: 780, minWidth: 340 },
  about: { nl: 'Monofone analoge synth met drie oscillators en een 24 dB-laddermodel-filter.\n\nVerbind Noten met een keyboard of sequencer en stuur de uitgang naar een mixer.', en: 'A monophonic analog synth with three oscillators and a 24 dB ladder-model filter.\n\nConnect Notes to a keyboard or sequencer and send the output to a mixer.' },
  i18n: { nl: { ports: { notes: 'Noten', out: 'Uit' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = defaults(), dead = false, shell = null, ui = {}, engineEl = null, mod = {}, node = null, engineState = 0, pending = [], bendValue = 0.5;
    const volume = ctx.createGain(), out = ctx.createGain(); volume.connect(out);
    const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
    const eff = k => { const sp = SPEC[k]; let v = state[k]; if (mod[k]) { if (sp.scale === 'log') v = v * Math.pow(sp.max / sp.min, mod[k]); else v = v + mod[k] * (sp.max - sp.min); } return clamp(v, sp.min, sp.max); };
    function params() {
      const idx = (k, list) => Math.max(0, list.indexOf(state[k]));
      return { w1: idx('wave1', WAVES), w2: idx('wave2', WAVES), w3: idx('wave3', WAVES), r1: state.range1, r2: state.range2, r3: state.range3, t2: eff('tune2'), t3: eff('tune3'), l1: eff('level1'), l2: eff('level2'), l3: eff('level3'), sync: state.sync ? 1 : 0, keys3: state.keys3 ? 1 : 0,
        noise: eff('noise'), pink: state.noiseColor === 'pink' ? 1 : 0, drive: eff('drive'), cutoff: eff('cutoff'), emph: eff('emphasis'), contour: eff('contour'), kt: eff('keytrack'), fa: eff('fAttack'), fd: eff('fDecay'), fs: eff('fSustain'), fr: eff('fRelease'), aa: eff('aAttack'), ad: eff('aDecay'), as: eff('aSustain'), ar: eff('aRelease'),
        glide: eff('glide'), legato: state.trigger === 'legato' ? 1 : 0, bendRange: state.bendRange, tr: state.transpose, lfoRate: eff('lfoRate'), lfoShape: idx('lfoShape', LFOS), lfoPitch: eff('lfoPitch'), lfoFilter: eff('lfoFilter'), odrive: eff('outDrive'), level: 1 };
    }
    function sendParams() { if (dead) return; tc(volume.gain, eff('level') * 2); const m = { type: 'params', params: params() }; if (node) node.port.postMessage(m); }
    function tc(p, v) { try { p.setTargetAtTime(v, ctx.currentTime, 0.02); } catch (e) { p.value = v; } }
    function send(e) { if (dead) return; if (node) node.port.postMessage({ type: 'event', event: e }); else if (engineState === 0) { pending.push(e); if (pending.length > 512) pending.shift(); } }
    function paintEngine() { if (engineEl) engineEl.textContent = T.engine[engineState]; }
    function init() {
      if (typeof host.loadWorklet !== 'function' || typeof globalThis.AudioWorkletNode !== 'function') { engineState = 2; paintEngine(); return; }
      Promise.resolve().then(() => host.loadWorklet(WNAME, ENGINE_CODE)).then(loaded => {
        if (dead) return; if (loaded === false) { engineState = 2; paintEngine(); return; }
        node = new globalThis.AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { params: params() } }); node.connect(volume); engineState = 1; for (const e of pending) node.port.postMessage({ type: 'event', event: e }); pending = []; paintEngine();
      }).catch(() => { engineState = 2; paintEngine(); });
    }
    function setCc(id, val) {
      if (!Number.isFinite(val)) return; const f = clamp(val, 0, 1), t = ctx.currentTime;
      if (id === 'bend') { bendValue = f; send({ type: 'bend', value: f, time: t }); return; } if (id === 'vibrato' || id === 'wheel') { send({ type: 'wheel', value: f, time: t }); return; } if (id === 'expression') id = 'level';
      const sp = SPEC[id]; if (!sp || sp.t === 'enum' || sp.t === 'bool') return; let v = sp.scale === 'log' ? sp.min * Math.pow(sp.max / sp.min, f) : sp.min + f * (sp.max - sp.min); if (sp.t === 'int') v = Math.round(v); state[id] = clamp(v, sp.min, sp.max); if (ui[id] && ui[id].set) ui[id].set(state[id]); sendParams();
    }
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    function build(root) {
      const css = el('style', null, root); css.textContent = ':host{display:block;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--card)}h3{margin:0 0 6px;font:700 11px var(--disp,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.status{color:var(--muted);font-size:11px;line-height:1.4}.grp{display:grid;gap:6px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--well,#0002)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 12px}select{font:inherit;background:var(--field,var(--well));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:4px;padding:4px 7px;min-width:0;max-width:100%}label.s{display:grid;gap:3px}label.c{display:flex;gap:6px;align-items:center}';
      const app = el('div', null, root, 'app');
      for (const g of GROUPS) {
        const box = el('div', null, app, 'grp'); el('h3', T.groups[g], box); const grid = el('div', null, box, 'grid');
        for (const [k, sp] of Object.entries(SPEC)) { if (sp.g !== g) continue; const lab = T.labels[k];
          if (sp.t === 'enum') { const w = el('label', null, grid, 's'); el('span', lab, w); const s = el('select', null, w); s.setAttribute('aria-label', lab); for (const o of sp.o) { const op = el('option', T.opts[o] || o, s); op.value = o; } s.value = state[k]; s.onchange = () => { state[k] = s.value; sendParams(); }; ui[k] = { set: v => { s.value = v; } }; }
          else if (sp.t === 'bool') { const w = el('label', null, grid, 'c'); const c = el('input', null, w); c.type = 'checkbox'; c.checked = state[k]; el('span', lab, w); c.setAttribute('aria-label', lab); c.onchange = () => { state[k] = c.checked; sendParams(); }; ui[k] = { set: v => { c.checked = v; } }; }
          else { const h = el('div', null, grid); const kn = host.ui.knob(h, (g === 'contour' || g === 'loud') ? lab + ' ' : lab, [sp.min, sp.max, sp.t === 'int' ? 1 : (sp.max - sp.min) / 400], state[k], v => (sp.f ? sp.f(v) : v.toFixed(2)), v => { state[k] = sp.t === 'int' ? Math.round(v) : v; sendParams(); }, { default: sp.d, scale: sp.scale, id: k, group: g }); ui[k] = kn; }
        }
      }
      engineEl = el('div', T.engine[engineState], app, 'status'); root.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(parent) { if (dead) return; self.unmount(); shell = el('div', null, parent); build(shell.attachShadow({ mode: 'open' })); },
      unmount() { if (shell) shell.remove(); shell = engineEl = null; ui = {}; },
      onEvent(port, e) {
        if (dead || !e || typeof e !== 'object') return;
        try {
          const type = e.type, t = clamp(Math.max(ctx.currentTime, fin(e.time, ctx.currentTime)), 0, ctx.currentTime + 30);
          if (type === 'note' || type === 'noteon' || type === 'noteoff') { if (!Number.isFinite(e.note)) return; send({ type, note: e.note, vel: fin(e.vel, 0.8), time: t, dur: Number.isFinite(e.dur) ? e.dur : undefined, held: e.held === true }); }
          else if (type === 'allnotesoff' || type === 'panic') send({ type: 'allnotesoff', time: t }); else if (type === 'cc') setCc(e.id, e.value);
        } catch (err) { /* een ongeldige gebeurtenis mag de synth niet stoppen */ }
      },
      onTransport(info) { if (dead) return; if (info && info.playing === false) send({ type: 'allnotesoff', time: ctx.currentTime }); },
      params() { return MODS.map(id => { const sp = SPEC[id]; return { id, name: T.labels[id], lane: sp.g, laneName: T.groups[sp.g], min: sp.min, max: sp.max, scale: sp.scale || 'lin', drift: 0.1, on: ['cutoff', 'emphasis', 'contour'].includes(id) }; }); },
      modulate(o) { if (dead) return; mod = {}; if (o && typeof o === 'object') for (const k of MODS) if (typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); sendParams(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { if (dead) return; state = normalize(s); for (const k of Object.keys(SPEC)) if (ui[k] && ui[k].set) ui[k].set(state[k]); sendParams(); },
      destroy() { if (dead) return; dead = true; self.unmount(); if (node) { try { node.port.postMessage({ type: 'close' }); node.disconnect(); } catch (e) { /* ok */ } } for (const n of [volume, out]) { try { n.disconnect(); } catch (e) { /* ok */ } } }
    };
    tc(volume.gain, eff('level') * 2); init();
    return self;
  }
};
