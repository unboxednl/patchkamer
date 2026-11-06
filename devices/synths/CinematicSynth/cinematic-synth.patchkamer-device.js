// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.13.0 — Eerste versie. Cinematic Synth: een polyfone synth voor filmische klank: zware koperachtige braams, brede pads en drones, lage pulserende ostinati en orgelachtige
//          arpeggio's. Per stem een hoofdlaag met tot 5 ontstemde oscillators (met stereospreiding), een tweede laag met een octaafkeuze, een sub-sinus en ruis; een laagdoorlaatfilter met
//          eigen aanzwelling (aanval, verval, houdniveau en toetsvolging), een versterkingsomhulling tot 12 s aanval en 15 s uitklinken, en een pitchdaling of -stijging aan het begin van elke noot.
//          Achter de stemmen: vervorming, een laag- en hoogplank, een ensemble-chorus, een pingpongecho en een grote galm (een zelf gebouwde impuls van 0,5 tot 9 s). Een pulsmotor volgt
//          de klok van de studio en speelt de ingedrukte noten als ostinato of arpeggio (zestiende, achtste, kwarten en tripletten; omhoog, omlaag, heen en weer, willekeurig, orgelloop,
//          herhaalde akkoordslagen). Bestuurbaar via sturingskabels, CC-ingang en de MIDI Hub.
// Cinematic Synth — filmische synth met pulsmotor · Patchkamer contract v1.13

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WAVE = { saw: 'sawtooth', square: 'square', tri: 'triangle', sine: 'sine' };
const PULSE = ['off', 'eighths', 'sixteenths', 'arpUp', 'arpDown', 'arpUpDown', 'arpRandom', 'organRun', 'chordHits'];
const RATES = { '1/4': 4, '1/8': 2, '1/8t': 4 / 3, '1/16': 1, '1/16t': 2 / 3, '1/32': 0.5 };
const pct = v => Math.round(v * 100) + '%', sec = v => (v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s'), db = v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB', hz = v => (v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz');
// Alle parameters: type, bereik, standaard. 'log' = logaritmische knop. De volgorde bepaalt de indeling van de kaart.
const SPEC = {
  wave: { t: 'enum', o: ['saw', 'square', 'tri', 'sine'], d: 'saw', g: 'osc' }, unison: { t: 'int', min: 1, max: 5, d: 3, g: 'osc' }, detune: { t: 'num', min: 0, max: 60, d: 12, f: v => v.toFixed(0) + ' ct', g: 'osc' }, spread: { t: 'num', min: 0, max: 1, d: 0.6, f: pct, g: 'osc' },
  layerWave: { t: 'enum', o: ['off', 'saw', 'square', 'tri', 'sine'], d: 'tri', g: 'osc' }, layerOct: { t: 'int', min: -2, max: 1, d: -1, f: v => (v > 0 ? '+' : '') + v + ' oct', g: 'osc' }, layerMix: { t: 'num', min: 0, max: 1, d: 0.4, f: pct, g: 'osc' },
  sub: { t: 'num', min: 0, max: 1, d: 0.2, f: pct, g: 'osc' }, noise: { t: 'num', min: 0, max: 1, d: 0.03, f: pct, g: 'osc' }, bend: { t: 'num', min: -12, max: 12, d: 0, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' st', g: 'osc' }, bendTime: { t: 'num', min: 0.02, max: 4, d: 0.3, scale: 'log', f: sec, g: 'osc' },
  cutoff: { t: 'num', min: 80, max: 12000, d: 1800, scale: 'log', f: hz, g: 'filter' }, resonance: { t: 'num', min: 0, max: 16, d: 1, f: v => v.toFixed(1), g: 'filter' }, envAmt: { t: 'num', min: -4, max: 5, d: 1.5, f: v => v.toFixed(1) + ' oct', g: 'filter' },
  fAttack: { t: 'num', min: 0.005, max: 10, d: 0.8, scale: 'log', f: sec, g: 'filter' }, fDecay: { t: 'num', min: 0.05, max: 10, d: 2, scale: 'log', f: sec, g: 'filter' }, fSustain: { t: 'num', min: 0, max: 1, d: 0.6, f: pct, g: 'filter' }, keytrack: { t: 'num', min: 0, max: 1, d: 0.5, f: pct, g: 'filter' },
  attack: { t: 'num', min: 0.003, max: 12, d: 0.6, scale: 'log', f: sec, g: 'amp' }, decay: { t: 'num', min: 0.05, max: 12, d: 1.5, scale: 'log', f: sec, g: 'amp' }, sustain: { t: 'num', min: 0, max: 1, d: 0.8, f: pct, g: 'amp' }, release: { t: 'num', min: 0.05, max: 15, d: 2.5, scale: 'log', f: sec, g: 'amp' },
  vibRate: { t: 'num', min: 0.1, max: 10, d: 5, scale: 'log', f: v => v.toFixed(1) + ' Hz', g: 'motion' }, vibDepth: { t: 'num', min: 0, max: 100, d: 0, f: v => v.toFixed(0) + ' ct', g: 'motion' }, lfoFilter: { t: 'num', min: 0, max: 2, d: 0, f: v => v.toFixed(2) + ' oct', g: 'motion' },
  drive: { t: 'num', min: 0, max: 1, d: 0.15, f: pct, g: 'space' }, weight: { t: 'num', min: -6, max: 10, d: 2, f: db, g: 'space' }, air: { t: 'num', min: -6, max: 8, d: 1, f: db, g: 'space' }, chorus: { t: 'num', min: 0, max: 1, d: 0.35, f: pct, g: 'space' },
  delayTime: { t: 'num', min: 0.05, max: 1.5, d: 0.42, scale: 'log', f: sec, g: 'space' }, delayFb: { t: 'num', min: 0, max: 0.9, d: 0.35, f: pct, g: 'space' }, delayMix: { t: 'num', min: 0, max: 1, d: 0.15, f: pct, g: 'space' },
  reverbSize: { t: 'num', min: 0.5, max: 9, d: 4, scale: 'log', f: sec, g: 'space' }, reverbDamp: { t: 'num', min: 0, max: 1, d: 0.5, f: pct, g: 'space' }, reverbMix: { t: 'num', min: 0, max: 1, d: 0.35, f: pct, g: 'space' },
  pulse: { t: 'enum', o: PULSE, d: 'off', g: 'pulse' }, rate: { t: 'enum', o: Object.keys(RATES), d: '1/8', g: 'pulse' }, gate: { t: 'num', min: 0.05, max: 1, d: 0.6, f: pct, g: 'pulse' }, octaves: { t: 'int', min: 1, max: 3, d: 1, f: v => String(v), g: 'pulse' },
  accent: { t: 'num', min: 0, max: 1, d: 0.3, f: pct, g: 'pulse' }, latch: { t: 'bool', d: false, g: 'pulse' },
  level: { t: 'num', min: 0, max: 1.5, d: 0.6, f: pct, g: 'out' }, transpose: { t: 'int', min: -24, max: 24, d: 0, f: v => (v > 0 ? '+' : '') + v + ' st', g: 'out' }
};
const MODS = ['cutoff', 'resonance', 'envAmt', 'detune', 'sub', 'noise', 'layerMix', 'vibDepth', 'lfoFilter', 'drive', 'weight', 'air', 'chorus', 'delayFb', 'delayMix', 'reverbMix', 'gate', 'level'];
const GROUPS = ['osc', 'filter', 'amp', 'motion', 'space', 'pulse', 'out'];
const defaults = () => Object.fromEntries(Object.entries(SPEC).map(([k, s]) => [k, s.d]));
function normalize(raw) {
  const s = defaults(); raw = raw && typeof raw === 'object' ? raw : {};
  for (const [k, sp] of Object.entries(SPEC)) { const v = raw[k]; if (v === undefined) continue;
    if (sp.t === 'enum') { if (sp.o.includes(v)) s[k] = v; } else if (sp.t === 'bool') { if (typeof v === 'boolean') s[k] = v; } else if (typeof v === 'number' && Number.isFinite(v)) s[k] = sp.t === 'int' ? Math.round(clamp(v, sp.min, sp.max)) : clamp(v, sp.min, sp.max); }
  return s;
}
// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { title: 'CINEMATIC SYNTH', hint: 'Filmische synth: braams, pads, drones, ostinati en arpeggio\'s. Verbind Noten met een keyboard of sequencer. De pulsmotor volgt de klok: druk op Start.',
    groups: { osc: 'Oscillators', filter: 'Filter', amp: 'Versterking', motion: 'Beweging', space: 'Ruimte en klank', pulse: 'Pulsmotor', out: 'Uitgang' },
    labels: { wave: 'Golfvorm', unison: 'Stemmen per noot', detune: 'Ontstemming', spread: 'Stereospreiding', layerWave: 'Tweede laag', layerOct: 'Octaaf tweede laag', layerMix: 'Mix tweede laag', sub: 'Sub', noise: 'Ruis', bend: 'Pitchdaling', bendTime: 'Duur daling',
      cutoff: 'Cutoff', resonance: 'Resonantie', envAmt: 'Aanzwelling', fAttack: 'Filteraanval', fDecay: 'Filterverval', fSustain: 'Filterhoud', keytrack: 'Toetsvolging', attack: 'Aanval', decay: 'Verval', sustain: 'Houd', release: 'Uitklinken',
      vibRate: 'Vibrato-snelheid', vibDepth: 'Vibrato-diepte', lfoFilter: 'Filtergolf', drive: 'Vervorming', weight: 'Gewicht', air: 'Lucht', chorus: 'Ensemble', delayTime: 'Echotijd', delayFb: 'Echo-terugkoppeling', delayMix: 'Echo',
      reverbSize: 'Galmlengte', reverbDamp: 'Galmdemping', reverbMix: 'Galm', pulse: 'Patroon', rate: 'Snelheid', gate: 'Lengte', octaves: 'Octaven', accent: 'Accent', latch: 'Vasthouden', level: 'Niveau', transpose: 'Transpositie' },
    opts: { saw: 'Zaagtand', square: 'Blok', tri: 'Driehoek', sine: 'Sinus', off: 'Uit', eighths: 'Achtsten', sixteenths: 'Zestienden', arpUp: 'Omhoog', arpDown: 'Omlaag', arpUpDown: 'Heen en weer', arpRandom: 'Willekeurig', organRun: 'Orgelloop', chordHits: 'Akkoordslagen' },
    status: 'Stemmen: ' },
  en: { title: 'CINEMATIC SYNTH', hint: 'Cinematic synth: braams, pads, drones, ostinati and arpeggios. Connect Notes to a keyboard or sequencer. The pulse engine follows the clock: press Start.',
    groups: { osc: 'Oscillators', filter: 'Filter', amp: 'Amplifier', motion: 'Motion', space: 'Space and tone', pulse: 'Pulse engine', out: 'Output' },
    labels: { wave: 'Waveform', unison: 'Voices per note', detune: 'Detune', spread: 'Stereo spread', layerWave: 'Second layer', layerOct: 'Second layer octave', layerMix: 'Second layer mix', sub: 'Sub', noise: 'Noise', bend: 'Pitch drop', bendTime: 'Drop time',
      cutoff: 'Cutoff', resonance: 'Resonance', envAmt: 'Swell', fAttack: 'Filter attack', fDecay: 'Filter decay', fSustain: 'Filter hold', keytrack: 'Key tracking', attack: 'Attack', decay: 'Decay', sustain: 'Sustain', release: 'Release',
      vibRate: 'Vibrato rate', vibDepth: 'Vibrato depth', lfoFilter: 'Filter wave', drive: 'Drive', weight: 'Weight', air: 'Air', chorus: 'Ensemble', delayTime: 'Echo time', delayFb: 'Echo feedback', delayMix: 'Echo',
      reverbSize: 'Reverb length', reverbDamp: 'Reverb damping', reverbMix: 'Reverb', pulse: 'Pattern', rate: 'Rate', gate: 'Gate', octaves: 'Octaves', accent: 'Accent', latch: 'Latch', level: 'Level', transpose: 'Transpose' },
    opts: { saw: 'Saw', square: 'Square', tri: 'Triangle', sine: 'Sine', off: 'Off', eighths: 'Eighths', sixteenths: 'Sixteenths', arpUp: 'Up', arpDown: 'Down', arpUpDown: 'Up and down', arpRandom: 'Random', organRun: 'Organ run', chordHits: 'Chord hits' },
    status: 'Voices: ' }
};

export default {
  id: 'nl.patchkamer.cinematicsynth', name: 'Cinematic Synth', version: '1.15.0', kind: 'instrument', category: 'synth', ui: { width: 760, minWidth: 340 },
  i18n: { nl: { ports: { notes: 'Noten', out: 'Uit' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = defaults(), dead = false, shell = null, ui = {}, statusEl = null, stopFrame = null, voices = [], held = new Map(), chord = new Map(), mod = {}, nextT = 0, pulseIdx = 0, rnd = 12345, lastRelease = 0;
    const MAXV = 10, now = () => ctx.currentTime, tc = (p, v, t, c) => { try { p.setTargetAtTime(v, t === undefined ? now() : t, c === undefined ? 0.03 : c); } catch (e) { p.value = v; } };
    const eff = k => { const sp = SPEC[k]; let v = state[k]; if (mod[k]) { if (sp.scale === 'log') v = v * Math.pow(sp.max / sp.min, mod[k]); else v = v + mod[k] * (sp.max - sp.min); } return clamp(v, sp.min, sp.max); };
    // ---- geluidsketen achter de stemmen ----
    const vsum = ctx.createGain(), shaper = ctx.createWaveShaper(), low = ctx.createBiquadFilter(), high = ctx.createBiquadFilter(), bus = ctx.createGain(), master = ctx.createGain(), comp = ctx.createDynamicsCompressor(), out = ctx.createGain();
    low.type = 'lowshelf'; low.frequency.value = 110; high.type = 'highshelf'; high.frequency.value = 6000; comp.threshold.value = -10; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    vsum.connect(shaper); shaper.connect(low); low.connect(high); high.connect(bus); bus.connect(master); master.connect(comp); comp.connect(out);
    // ensemble-chorus: drie vertraagde lijnen met trage golven
    const chSend = ctx.createGain(), chOut = ctx.createGain(); bus.connect(chSend);
    [[0.018, 0.31, -0.8], [0.026, 0.41, 0], [0.034, 0.53, 0.8]].forEach(([d, r, p]) => { const dl = ctx.createDelay(0.1), lf = ctx.createOscillator(), lg = ctx.createGain(), pn = ctx.createStereoPanner(); dl.delayTime.value = d; lf.frequency.value = r; lg.gain.value = 0.004; lf.connect(lg); lg.connect(dl.delayTime); lf.start(); pn.pan.value = p; chSend.connect(dl); dl.connect(pn); pn.connect(chOut); });
    chOut.connect(master);
    // pingpongecho
    const dSend = ctx.createGain(), dL = ctx.createDelay(2), dR = ctx.createDelay(2), fbL = ctx.createGain(), fbR = ctx.createGain(), dTone = ctx.createBiquadFilter(), pL = ctx.createStereoPanner(), pR = ctx.createStereoPanner(), dOut = ctx.createGain();
    dTone.type = 'lowpass'; dTone.frequency.value = 3500; pL.pan.value = -0.7; pR.pan.value = 0.7; bus.connect(dSend); dSend.connect(dL); dL.connect(dTone); dTone.connect(fbL); fbL.connect(dR); dR.connect(fbR); fbR.connect(dL); dL.connect(pL); dR.connect(pR); pL.connect(dOut); pR.connect(dOut); dOut.connect(master);
    // galm: een eigen impuls (ruis met een afnemende staart en toenemende demping)
    const rvIn = ctx.createGain(), rvPre = ctx.createDelay(0.2), conv = ctx.createConvolver(), rvOut = ctx.createGain(); rvPre.delayTime.value = 0.03; bus.connect(rvIn); rvIn.connect(rvPre); rvPre.connect(conv); conv.connect(rvOut); rvOut.connect(master);
    let irTimer = null, irKey = '', lastDrive = -1;
    function buildIR(size, damp) {
      const sr = ctx.sampleRate, n = Math.max(1, Math.floor(size * sr)), buf = ctx.createBuffer(2, n, sr); let seed = 987654321;
      const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n, env = Math.pow(1 - t, 2.2) * Math.exp(-3 * t), a = 0.15 + 0.8 * (1 - damp * Math.min(1, t * 2.2)); lp += (r() - lp) * a; d[i] = lp * env * (i < sr * 0.02 ? i / (sr * 0.02) : 1); } }
      return buf;
    }
    function applyIR() { const key = eff('reverbSize').toFixed(2) + '|' + eff('reverbDamp').toFixed(2); if (key === irKey) return; irKey = key; clearTimeout(irTimer); irTimer = setTimeout(() => { if (dead) return; tc(rvOut.gain, 0, undefined, 0.02); setTimeout(() => { if (dead) return; try { conv.buffer = buildIR(eff('reverbSize'), eff('reverbDamp')); } catch (e) { /* geen galm */ } applyMaster(); }, 60); }, 120); }
    // een gedeelde lus met ruis, een gedeelde LFO voor vibrato en filter, en een sturing voor de cutoff
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); { let s = 22222; for (let i = 0; i < nd.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; nd[i] = s / 4294967296 * 2 - 1; } }
    const lfo = ctx.createOscillator(), lfoV = ctx.createGain(), lfoF = ctx.createGain(), fcv = ctx.createConstantSource(); lfo.frequency.value = 5; lfoV.gain.value = 0; lfoF.gain.value = 0; fcv.offset.value = 0; lfo.connect(lfoV); lfo.connect(lfoF); lfo.start(); fcv.start();
    function curve(k) { const n = 1024, c = new Float32Array(n), a = k * 12; for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = a > 0 ? Math.tanh(x * (1 + a)) / Math.tanh(1 + a) : x; } return c; }
    function applyMaster() {
      const d = eff('drive'); if (Math.abs(d - lastDrive) > 0.002) { lastDrive = d; shaper.curve = curve(d); } shaper.oversample = (host.audio && host.audio.oversample) || '2x';
      tc(low.gain, eff('weight')); tc(high.gain, eff('air')); tc(chSend.gain, eff('chorus') > 0 ? 1 : 0); tc(chOut.gain, eff('chorus') * 0.8);
      tc(dL.delayTime, eff('delayTime') * 0.5, undefined, 0.08); tc(dR.delayTime, eff('delayTime') * 0.5, undefined, 0.08); tc(fbL.gain, eff('delayFb')); tc(fbR.gain, eff('delayFb')); tc(dOut.gain, eff('delayMix'));
      tc(rvOut.gain, eff('reverbMix') * 1.2); tc(out.gain, eff('level'));
      tc(lfoV.gain, eff('vibDepth')); lfo.frequency.value = state.vibRate; tc(lfoF.gain, eff('lfoFilter') * 1200); tc(fcv.offset, (mod.cutoff || 0) * 4800);
    }
    // ---- stemmen ----
    const hzOf = n => 440 * Math.pow(2, (n - 69) / 12);
    const envAt = (v, t) => { const e = v.env, x = t - v.t0; if (x <= 0) return 0; if (x < e.a) return e.peak * (x / e.a); return e.sus + (e.peak - e.sus) * Math.exp(-(x - e.a) / (e.d / 3)); };
    function killVoice(v, t) { if (v.dead) return; v.dead = true; try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(envAt(v, t), t); v.g.gain.linearRampToValueAtTime(0, t + 0.03); } catch (e) { /* al gestopt */ } for (const o of v.src) { try { o.stop(t + 0.05); } catch (e) { /* al gestopt */ } } }
    function noteOn(note, vel, t, dur, hold) {
      if (!Number.isFinite(note) || !Number.isFinite(t)) return null; note = clamp(Math.round(note), 0, 127); vel = Number.isFinite(vel) ? clamp(vel, 0.01, 1) : 0.8;
      const live = voices.filter(v => !v.dead && !v.off); if (live.length >= MAXV) killVoice(live[0], t);
      const f0 = hzOf(note + state.transpose), un = state.unison, lw = state.layerWave, lun = Math.min(un, 3), srcs = [], g = ctx.createGain(), mix = ctx.createGain(), fl = ctx.createBiquadFilter();
      fl.type = 'lowpass'; fl.Q.value = eff('resonance'); fcv.connect(fl.detune); lfoF.connect(fl.detune);
      const kt = Math.pow(f0 / 261.63, state.keytrack), base = clamp(state.cutoff * kt, 30, 18000), peak = clamp(base * Math.pow(2, state.envAmt), 30, 20000), sus = clamp(base * Math.pow(2, state.envAmt * state.fSustain), 30, 20000);
      const fa = Math.max(0.005, state.fAttack);
      fl.frequency.setValueAtTime(base, t); fl.frequency.exponentialRampToValueAtTime(peak, t + fa); fl.frequency.setTargetAtTime(sus, t + fa, Math.max(0.02, state.fDecay / 3));
      const cv = state.bend !== 0 ? ctx.createConstantSource() : null; if (cv) { cv.offset.setValueAtTime(state.bend * 100, t); cv.offset.setTargetAtTime(0, t, state.bendTime / 3); cv.start(t); srcs.push(cv); }
      const det = eff('detune'), spread = state.spread;
      const add = (type, freq, cents, pan, gain) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = cents; lfoV.connect(o.detune); if (cv) cv.connect(o.detune); const gn = ctx.createGain(); gn.gain.value = gain; o.connect(gn); if (pan !== 0) { const p = ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); p.connect(mix); } else gn.connect(mix); o.start(t); srcs.push(o); };
      for (let i = 0; i < un; i++) { const x = un === 1 ? 0 : (i / (un - 1)) * 2 - 1; add(WAVE[state.wave], f0, x * det, x * spread, 0.5 / Math.sqrt(un)); }
      const lm = eff('layerMix'); if (lw !== 'off' && lm > 0.001) for (let i = 0; i < lun; i++) { const x = lun === 1 ? 0 : (i / (lun - 1)) * 2 - 1; add(WAVE[lw], f0 * Math.pow(2, state.layerOct), x * det * 0.8, -x * spread * 0.8, lm * 0.5 / Math.sqrt(lun)); }
      const sb = eff('sub'); if (sb > 0.001) add('sine', f0 / 2, 0, 0, sb * 0.6);
      const nz = eff('noise'); if (nz > 0.001) { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const gn = ctx.createGain(); gn.gain.value = nz * 0.5; s.connect(gn); gn.connect(mix); s.start(t, Math.random() * 1.5); srcs.push(s); }
      mix.connect(fl); fl.connect(g); g.connect(vsum);
      const a = Math.max(0.003, state.attack), pk = (0.35 + 0.65 * vel) * 0.5, su = state.sustain * pk, v = { t0: t, g, src: srcs, fl, env: { a, d: Math.max(0.05, state.decay), peak: pk, sus: su }, note, off: false, dead: false, rel: state.release };
      g.gain.setValueAtTime(0, t);
      if (!hold && dur <= a) { const aE = Math.max(0.003, dur); g.gain.linearRampToValueAtTime(pk * (aE / a), t + aE); } else { g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setTargetAtTime(su, t + a, v.env.d / 3); }
      voices.push(v); srcs[0].onended = () => { v.dead = true; for (const n of [g, mix, fl]) { try { n.disconnect(); } catch (e) { /* ok */ } } try { fcv.disconnect(fl.detune); lfoF.disconnect(fl.detune); } catch (e) { /* ok */ } voices = voices.filter(x => x !== v); };
      if (!hold) release(v, t + dur); else v.hold = true;
      return v;
    }
    function release(v, t) {
      if (!v || v.off || v.dead) return; v.off = true; t = Math.max(t, v.t0 + 0.003) + 0.0005; const r = Math.max(0.05, v.rel);
      try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(envAt(v, t), t); v.g.gain.setTargetAtTime(0, t, r / 4); } catch (e) { /* ok */ }
      for (const o of v.src) { try { o.stop(t + r * 1.6 + 0.2); } catch (e) { /* ok */ } }
    }
    function panic(t) { t = Number.isFinite(t) ? t : now(); for (const v of [...voices]) killVoice(v, t); held.clear(); chord.clear(); }
    // ---- pulsmotor ----
    const rand = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
    const chordNotes = () => [...chord.keys()].sort((a, b) => a - b);
    function pulseNotes() { const base = chordNotes(); if (!base.length) return []; const all = []; for (let o = 0; o < state.octaves; o++) for (const n of base) all.push(n + 12 * o); return all; }
    function pulseStep(i, t, len) {
      const all = pulseNotes(); if (!all.length) return; const p = state.pulse, base = chordNotes(); let pick = [];
      if (p === 'eighths' || p === 'sixteenths') pick = [base[0]]; else if (p === 'arpUp' || p === 'organRun') pick = [all[i % all.length]]; else if (p === 'arpDown') pick = [all[all.length - 1 - (i % all.length)]];
      else if (p === 'arpUpDown') { const n = Math.max(1, all.length * 2 - 2), k = i % n; pick = [all[k < all.length ? k : n - k]]; } else if (p === 'arpRandom') pick = [all[Math.floor(rand() * all.length)]]; else if (p === 'chordHits') pick = base;
      const vel = clamp(0.55 + (i % 4 === 0 ? 0.35 * (0.3 + state.accent) : 0), 0.2, 1);
      for (const n of pick) noteOn(n, vel, t, Math.max(0.03, len * eff('gate')), false);
    }
    // ---- gebeurtenissen ----
    const fin = (v, d) => Number.isFinite(v) ? v : d;
    function onNote(e, hold) {
      const t = clamp(Math.max(now(), fin(e.time, now())), 0, now() + 30), note = fin(e.note, NaN), vel = fin(e.vel, 0.8), dur = clamp(fin(e.dur, 0.5), 0.01, 120);
      if (state.pulse !== 'off') { if (Number.isFinite(note)) chord.set(Math.round(note), { vel, until: hold || e.held ? Infinity : t + dur, latched: false }); return; }
      const h = hold || e.held === true || dur >= 100; const v = noteOn(note, vel, t, dur, h); if (h && v) { const old = held.get(Math.round(note)); if (old) release(old, t); held.set(Math.round(note), v); }
    }
    function noteOff(e) { const n = Math.round(fin(e.note, NaN)), t = Math.max(now(), fin(e.time, now())); if (!Number.isFinite(n)) return; if (state.pulse !== 'off') { if (!state.latch) chord.delete(n); return; } const v = held.get(n); if (v) { release(v, t); held.delete(n); } }
    function setCc(id, val) { const sp = SPEC[id]; if (!sp || sp.t === 'enum' || sp.t === 'bool' || !Number.isFinite(val)) return; const f = clamp(val, 0, 1); let v = sp.scale === 'log' ? sp.min * Math.pow(sp.max / sp.min, f) : sp.min + f * (sp.max - sp.min); if (sp.t === 'int') v = Math.round(v); state[id] = clamp(v, sp.min, sp.max); if (ui[id] && ui[id].set) ui[id].set(state[id]); applyMaster(); applyIR(); }
    // ---- UI ----
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    function build(root) {
      const css = el('style', null, root); css.textContent = ':host{display:block;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--card)}h2{margin:0;font:700 20px var(--disp,sans-serif);letter-spacing:.08em}h3{margin:0 0 6px;font:700 11px var(--disp,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.hint,.status{color:var(--muted);font-size:11px;line-height:1.4}.grp{display:grid;gap:6px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--well,#0002)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 12px}select{font:inherit;background:var(--field,var(--well));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:4px;padding:4px 7px;min-width:0;max-width:100%}label.s{display:grid;gap:3px}label.c{display:flex;gap:6px;align-items:center}';
      const app = el('div', null, root, 'app'); el('h2', T.title, app); el('div', T.hint, app, 'hint');
      for (const g of GROUPS) {
        const box = el('div', null, app, 'grp'); el('h3', T.groups[g], box); const grid = el('div', null, box, 'grid');
        for (const [k, sp] of Object.entries(SPEC)) { if (sp.g !== g) continue; const lab = T.labels[k];
          if (sp.t === 'enum') { const w = el('label', null, grid, 's'); el('span', lab, w); const s = el('select', null, w); s.setAttribute('aria-label', lab); for (const o of sp.o) { const op = el('option', T.opts[o] || o, s); op.value = o; } s.value = state[k]; s.onchange = () => { state[k] = s.value; if (k === 'pulse') { chord.clear(); } }; ui[k] = { set: v => { s.value = v; } }; }
          else if (sp.t === 'bool') { const w = el('label', null, grid, 'c'); const c = el('input', null, w); c.type = 'checkbox'; c.checked = state[k]; el('span', lab, w); c.setAttribute('aria-label', lab); c.onchange = () => { state[k] = c.checked; if (!c.checked) chord.clear(); }; ui[k] = { set: v => { c.checked = v; } }; }
          else { const h = el('div', null, grid); const kn = host.ui.knob(h, lab, [sp.min, sp.max, sp.t === 'int' ? 1 : (sp.max - sp.min) / 400], state[k], v => (sp.f ? sp.f(v) : v.toFixed(2)), v => { state[k] = sp.t === 'int' ? Math.round(v) : v; applyMaster(); if (k === 'reverbSize' || k === 'reverbDamp') applyIR(); }, { default: sp.d, scale: sp.scale, id: k, group: g }); ui[k] = kn; }
        }
      }
      statusEl = el('div', T.status + '0', app, 'status'); root.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const self = {
      inputs: {}, outputs: { out },
      mount(parent) { if (dead) return; self.unmount(); shell = el('div', null, parent); build(shell.attachShadow({ mode: 'open' })); if (typeof host.frame === 'function') stopFrame = host.frame(self, () => { if (statusEl) { const s = T.status + voices.filter(v => !v.dead).length; if (statusEl.textContent !== s) statusEl.textContent = s; } }, 8); },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = statusEl = null; ui = {}; },
      onEvent(port, e) {
        if (dead || !e || typeof e !== 'object') return;
        try {
          const type = e.type;
          if (type === 'note') onNote(e, false); else if (type === 'noteon') onNote(e, true); else if (type === 'noteoff') noteOff(e); else if (type === 'allnotesoff' || type === 'panic') panic(fin(e.time, now()));
          else if (type === 'cc') { const id = e.id === 'expression' ? 'level' : e.id === 'vibrato' ? 'vibDepth' : e.id; setCc(id, e.value); }
        } catch (err) { /* een ongeldige gebeurtenis mag de synth niet stoppen */ }
      },
      onTransport(info) { if (dead) return; if (info && info.playing === false) { for (const v of [...voices]) if (!v.off) release(v, now()); chord.clear(); nextT = 0; pulseIdx = 0; } else if (info && info.playing) { nextT = 0; pulseIdx = 0; } },
      onStep(info) {
        if (dead || state.pulse === 'off' || !info || !Number.isFinite(info.time) || !Number.isFinite(info.stepDur)) return;
        for (const [n, c] of [...chord]) if (c.until !== Infinity && c.until < info.time && !state.latch) chord.delete(n);
        const iv = info.stepDur * RATES[state.rate]; if (!(iv > 0.005)) return; if (!nextT || nextT < info.time - info.stepDur) nextT = info.time;
        while (nextT < info.time + info.stepDur - 1e-6) { pulseStep(pulseIdx++, Math.max(nextT, now()), iv); nextT += iv; }
      },
      params() { return MODS.map(id => { const sp = SPEC[id]; return { id, name: T.labels[id], lane: sp.g, laneName: T.groups[sp.g], min: sp.min, max: sp.max, scale: sp.scale || 'lin', drift: 0.1, on: ['cutoff', 'resonance', 'drive'].includes(id) }; }); },
      modulate(o) { if (dead) return; mod = {}; if (o && typeof o === 'object') for (const k of MODS) if (typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); applyMaster(); applyIR(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { if (dead) return; state = normalize(s); for (const [k, sp] of Object.entries(SPEC)) if (ui[k] && ui[k].set) ui[k].set(state[k]); if (state.pulse === 'off') chord.clear(); applyMaster(); applyIR(); },
      destroy() { if (dead) return; dead = true; clearTimeout(irTimer); self.unmount(); try { panic(now()); } catch (e) { /* ok */ } for (const n of [lfo, fcv]) { try { n.stop(); } catch (e) { /* ok */ } } for (const n of [vsum, shaper, low, high, bus, master, comp, out, chSend, chOut, dSend, dL, dR, fbL, fbR, dTone, pL, pR, dOut, rvIn, rvPre, conv, rvOut, lfoV, lfoF, fcv]) { try { n.disconnect(); } catch (e) { /* ok */ } } }
    };
    applyMaster(); try { conv.buffer = buildIR(eff('reverbSize'), eff('reverbDamp')); irKey = eff('reverbSize').toFixed(2) + '|' + eff('reverbDamp').toFixed(2); } catch (e) { /* ok */ }
    return self;
  }
};
