// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Nieuw: Neuro Bass (id nl.patchkamer.neurobass), gebouwd voor Patchkamer contract v1.34.
//   Een mono bas voor drum & bass en bass music: twee oscillatoren met een detune-stack (elk twee stemmen), een sinus-sub,
//   FM en ringmodulatie, een crossover die de sub en het laag schoon en mono houdt, drie vervormtrappen (fold, clip, soft,
//   asym, rectify, bit) alleen op de hoge band, een vocaal formantfilter met een Morph-macro, een resonant filter
//   (LP 24, LP 12, BP), een LFO (vrij, per noot of op tempo) en een versterker-envelope met glide, velocity en accent.
//   Alleen standaard Web Audio-nodes (geen worklet). Bewaker tegen een ontspoord filter zoals Low Bass.

const EN = {
  'Aan': 'On', 'Uit': 'Off', 'Proefbas': 'Test bass', 'Alles uit': 'All off', 'Vrij': 'Free', 'Noot': 'Note',
  'Oscillatoren': 'Oscillators', 'Vervorming': 'Shaping', 'Formant': 'Formant', 'Filter': 'Filter', 'Versterker': 'Amp',
  'Golfvorm 1': 'Wave 1', 'Golfvorm 2': 'Wave 2', 'Zweving': 'Detune', 'Osc 2 toon': 'Osc 2 pitch',
  'Sub-octaaf': 'Sub octave', 'Trap 1': 'Stage 1', 'Trap 2': 'Stage 2', 'Trap 3': 'Stage 3',
  'Vocaal A': 'Vowel A', 'Vocaal B': 'Vowel B', 'Formant-mix': 'Formant mix',
  'Filtertype': 'Filter type', 'Resonantie': 'Resonance', 'Filter-envelope': 'Filter env',
  'LFO-vorm': 'LFO shape', 'LFO-sync': 'LFO sync', 'LFO-maat': 'LFO division',
};
const LABELS = {
  wave1: 'Golfvorm 1', wave2: 'Golfvorm 2', detune: 'Zweving', unison: 'Unison', mix2: 'Osc 2 mix', pitch2: 'Osc 2 toon', fm: 'FM', ring: 'Ring',
  sub: 'Sub', subOct: 'Sub-octaaf', xover: 'Crossover', shape1: 'Trap 1', amt1: 'Drive 1', shape2: 'Trap 2', amt2: 'Drive 2',
  shape3: 'Trap 3', amt3: 'Drive 3', vowelA: 'Vocaal A', vowelB: 'Vocaal B', morph: 'Morph', formant: 'Formant-mix', fq: 'Formant Q',
  ftype: 'Filtertype', cutoff: 'Cutoff', resonance: 'Resonantie', fenv: 'Filter-envelope', lfoShape: 'LFO-vorm', lfoSync: 'LFO-sync',
  lfoRate: 'LFO Rate', lfoDiv: 'LFO-maat', lfoMorph: 'LFO Morph', lfoCut: 'LFO Cutoff', lfoDrive: 'LFO Drive',
  lfoWob: 'LFO Wobble', attack: 'Attack', decay: 'Decay', sustain: 'Sustain', release: 'Release', glide: 'Glide', legato: 'Legato',
  accent: 'Accent', level: 'Level', bend: 'Bend',
};
const SECTIONS = [
  ['osc', 'Oscillatoren', ['wave1', 'wave2', 'detune', 'unison', 'mix2', 'pitch2', 'fm', 'ring', 'sub', 'subOct', 'xover']],
  ['shape', 'Vervorming', ['shape1', 'amt1', 'shape2', 'amt2', 'shape3', 'amt3']],
  ['formant', 'Formant', ['vowelA', 'vowelB', 'morph', 'formant', 'fq']],
  ['filter', 'Filter', ['ftype', 'cutoff', 'resonance', 'fenv']],
  ['lfo', 'LFO', ['lfoShape', 'lfoSync', 'lfoRate', 'lfoDiv', 'lfoMorph', 'lfoCut', 'lfoDrive', 'lfoWob']],
  ['amp', 'Versterker', ['attack', 'decay', 'sustain', 'release', 'glide', 'legato', 'accent', 'level', 'bend']],
];
const WAVES = ['sawtooth', 'square', 'pulse', 'triangle', 'sine'];
const SHAPES = ['off', 'fold', 'clip', 'soft', 'asym', 'rectify', 'bit'];
const VOWELS = ['oo', 'oh', 'ah', 'eh', 'ee', 'ue'];
const FORMANTS = { oo: [300, 870, 2240], oh: [450, 800, 2830], ah: [730, 1090, 2440], eh: [530, 1840, 2480], ee: [270, 2290, 3010], ue: [250, 1750, 2150] };
const FTYPES = ['lp24', 'lp12', 'bp'];
const LSHAPES = ['sine', 'triangle', 'square', 'saw', 'ramp', 'steps'];
const LSYNC = ['free', 'note', 'sync'];
const LDIVS = { '1/1': 0.25, '1/2': 0.5, '1/2T': 0.75, '1/4': 1, '1/4T': 1.5, '1/8': 2, '1/8T': 3, '1/16': 4, '1/16T': 6, '1/32': 8 }; // cycli per tel (kwartnoot)
// keuzelijsten: [sleutel, waarden, standaard, weergave]
const CHOICES = {
  wave1: [WAVES, 'sawtooth'], wave2: [WAVES, 'sawtooth'], subOct: [[0, -1], 0], shape1: [SHAPES, 'fold'], shape2: [SHAPES, 'clip'], shape3: [SHAPES, 'off'],
  vowelA: [VOWELS, 'oo'], vowelB: [VOWELS, 'ee'], ftype: [FTYPES, 'lp24'], lfoShape: [LSHAPES, 'sine'], lfoSync: [LSYNC, 'free'], lfoDiv: [Object.keys(LDIVS), '1/8'],
};
// getallen: [min, max, stap, standaard, schaal, rol, voorstel voor modulator aan]
const SPEC = {
  detune: [0, 60, 0.1, 12, 'lin', 'pitch', true], unison: [0, 1, 0.01, 0.8, 'lin', 'color', true], mix2: [0, 1, 0.01, 0.6, 'lin', 'level', true],
  pitch2: [-24, 24, 1, 0, 'lin', 'pitch', false], fm: [0, 8, 0.01, 0, 'lin', 'color', true], ring: [0, 1, 0.01, 0, 'lin', 'color', true],
  sub: [0, 1, 0.01, 0.6, 'lin', 'level', false], xover: [40, 300, 1, 100, 'log', 'filter', false],
  amt1: [0, 1, 0.01, 0.5, 'lin', 'color', true], amt2: [0, 1, 0.01, 0.3, 'lin', 'color', true], amt3: [0, 1, 0.01, 0, 'lin', 'color', true],
  morph: [0, 1, 0.001, 0.3, 'lin', 'filter', true], formant: [0, 1, 0.01, 0.6, 'lin', 'filter', true], fq: [1, 20, 0.1, 5, 'log', 'res', true],
  cutoff: [60, 16000, 1, 3000, 'log', 'filter', true], resonance: [0, 1, 0.01, 0.2, 'lin', 'res', true], fenv: [0, 5, 0.01, 1, 'lin', 'filter', false],
  lfoRate: [0.05, 30, 0.01, 2, 'log', 'rate', false], lfoMorph: [0, 1, 0.01, 0, 'lin', 'filter', true], lfoCut: [0, 1, 0.01, 0, 'lin', 'filter', true],
  lfoDrive: [0, 1, 0.01, 0, 'lin', 'color', true], lfoWob: [0, 1, 0.01, 0, 'lin', 'level', true],
  attack: [0.001, 2, 0.001, 0.004, 'log', 'decay', false], decay: [0.02, 3, 0.01, 0.4, 'log', 'decay', false], sustain: [0, 1, 0.01, 0.8, 'lin', 'level', false],
  release: [0.01, 4, 0.01, 0.15, 'log', 'decay', false], glide: [0.001, 1.5, 0.001, 0.04, 'log', 'pitch', false], accent: [0, 1, 0.01, 0.4, 'lin', 'level', false],
  level: [0, 1, 0.01, 0.5, 'lin', 'level', false], bend: [-12, 12, 0.01, 0, 'lin', 'pitch', false],
};
const GROUP_OF = {}; for (const [g, , keys] of SECTIONS) for (const k of keys) GROUP_OF[k] = g;
const SHAPE_FN = {
  fold: x => Math.sin(x * 9), clip: x => Math.max(-1, Math.min(1, x * 4)), soft: x => Math.tanh(x * 4),
  asym: x => (x >= 0 ? Math.tanh(x * 5) : Math.tanh(x * 2.5) * 0.9), rectify: x => Math.abs(x), bit: x => Math.round(x * 4) / 4,
};

export default {
  id: 'nl.patchkamer.neurobass', name: 'Neuro Bass', version: '1.0.0', kind: 'instrument', category: 'synth', ui: { width: 780, minWidth: 360 },
  about: {
    nl: 'Mono bas voor drum & bass en bass music: een detune-stack van twee oscillatoren, sub, FM en ringmodulatie, drie vervormtrappen, een vocaal formantfilter met Morph-macro, een resonant filter en een LFO (vrij, per noot of op tempo).\n\nDe sub en het laag onder de crossover blijven schoon en mono; alleen de hoge band wordt vervormd.\n\nVerbind een keyboard of sequencer met de ingang Noten. Een paarse Mod-kabel laat klankparameters bewegen.',
    en: 'A mono bass for drum & bass and bass music: a detune stack of two oscillators, sub, FM and ring modulation, three shaping stages, a vowel formant filter with a Morph macro, a resonant filter and an LFO (free, per note or tempo-synced).\n\nThe sub and the low end below the crossover stay clean and mono; only the high band is distorted.\n\nConnect a keyboard or sequencer to the Notes input. A purple Mod cable moves sound parameters.',
  },
  i18n: { nl: { ports: { out: 'Bas uit', notes: 'Noten' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Bass out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const finite = (v, d, a, b) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
    const adopt = (el, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    const choiceLabel = (k, v) => {
      if (k === 'subOct') return v === 0 ? '0' : '-1';
      if (k.startsWith('wave')) return { sawtooth: 'Saw', square: 'Square', pulse: 'Pulse', triangle: 'Triangle', sine: 'Sine' }[v];
      if (k.startsWith('shape')) return v === 'off' ? tx('Uit') : { fold: 'Fold', clip: 'Clip', soft: 'Soft', asym: 'Asym', rectify: 'Rectify', bit: 'Bit' }[v];
      if (k.startsWith('vowel')) return v.toUpperCase();
      if (k === 'ftype') return { lp24: 'LP 24', lp12: 'LP 12', bp: 'BP' }[v];
      if (k === 'lfoShape') return { sine: 'Sine', triangle: 'Triangle', square: 'Square', saw: 'Saw', ramp: 'Ramp', steps: 'Steps' }[v];
      if (k === 'lfoSync') return v === 'free' ? tx('Vrij') : v === 'note' ? tx('Noot') : 'Tempo';
      return String(v);
    };
    const defaults = {}; for (const [k, d] of Object.entries(SPEC)) defaults[k] = d[3]; for (const [k, d] of Object.entries(CHOICES)) defaults[k] = d[1]; defaults.legato = true;
    let state = { ...defaults }, effective = {}, mod = {}, dead = false, held = [], current = null, envData = null, curFreq = 0, curBpm = 120, first = true;
    const nodes = [];
    const own = n => (nodes.push(n), n);
    const g = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const bq = (type, freq, q) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = freq; if (q !== undefined) n.Q.value = q; return n; };
    const dropNode = n => { try { n.disconnect(); } catch { /* al los */ } const i = nodes.indexOf(n); if (i >= 0) nodes.splice(i, 1); };
    const target = (p, v, t = ctx.currentTime) => { if (!Number.isFinite(v)) return; if (first) p.value = v; else p.setTargetAtTime(v, t, 0.02); };
    const overs = host.audio && ['none', '2x', '4x'].includes(host.audio.oversample) ? host.audio.oversample : '2x';

    // ---- oscillatoren: twee paren (een stack van twee stemmen) en een sub ----
    const osc = () => { const o = own(ctx.createOscillator()); o.frequency.value = 55; return o; };
    const a1 = osc(), b1 = osc(), a2 = osc(), b2 = osc(), sub = osc(); sub.type = 'sine';
    let pulseWave = null;
    try { const N = 96, re = new Float32Array(N), im = new Float32Array(N); for (let n = 1; n < N; n++) re[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * 0.25); pulseWave = ctx.createPeriodicWave(re, im); } catch { pulseWave = null; }
    const setWave = (o, w) => { if (o._w === w) return; o._w = w; if (w === 'pulse' && pulseWave) { try { o.setPeriodicWave(pulseWave); return; } catch { /* terugval */ } } o.type = w === 'pulse' ? 'square' : w; };
    const g1a = g(0.4), g1b = g(0.3), g2a = g(0.2), g2b = g(0.2), subG = g(0.3);
    const o1 = g(1), ringIn = g(1), rm = g(0), ringWet = g(0), o1Dry = g(1), raw = g(1);
    a1.connect(g1a).connect(o1); b1.connect(g1b).connect(o1); a2.connect(g2a).connect(raw); b2.connect(g2b).connect(raw);
    o1.connect(o1Dry).connect(raw); o1.connect(ringIn).connect(rm).connect(ringWet).connect(raw); a2.connect(rm.gain); // ringmodulatie: osc 2 stuurt de versterking van osc 1
    const fmG = g(0); a2.connect(fmG); fmG.connect(a1.frequency); fmG.connect(b1.frequency); // FM: osc 2 moduleert de toonhoogte van osc 1
    sub.connect(subG);

    // ---- crossover (Linkwitz-Riley 4e orde): laag blijft schoon, alleen de hoge band wordt bewerkt ----
    const lo1 = bq('lowpass', 100, -3.0103), lo2 = bq('lowpass', 100, -3.0103), hi1 = bq('highpass', 100, -3.0103), hi2 = bq('highpass', 100, -3.0103);
    const lowSum = g(1), bandSum = g(1);
    raw.connect(lo1).connect(lo2).connect(lowSum); subG.connect(lowSum); raw.connect(hi1).connect(hi2);
    lowSum.connect(bandSum);

    // ---- drie vervormtrappen ----
    const curves = {};
    const curveFor = type => {
      if (!curves[type]) { const c = new Float32Array(2049), f = SHAPE_FN[type]; for (let i = 0; i < c.length; i++) c[i] = f(2 * i / (c.length - 1) - 1); curves[type] = c; }
      return curves[type];
    };
    const peakOf = (type, p) => { let m = 0; for (let i = 0; i <= 48; i++) m = Math.max(m, Math.abs(SHAPE_FN[type](p * i / 48))); return m; };
    const stages = [];
    let chainIn = hi2;
    for (let i = 0; i < 3; i++) {
      const sIn = g(1), sOut = g(1), dry = g(1), pre = g(1), post = g(1), wet = g(0), ws = own(ctx.createWaveShaper());
      ws.oversample = overs;
      chainIn.connect(sIn); sIn.connect(dry).connect(sOut); sIn.connect(pre).connect(ws).connect(post).connect(wet).connect(sOut);
      stages.push({ dry, pre, post, wet, ws, type: 'off' }); chainIn = sOut;
    }

    // ---- LFO: een lus van één periode; wordt per noot (of op tempo) herstart ----
    const lfoBus = g(1), lfoMorphG = [g(0), g(0), g(0)], lfoCutG = g(0), lfoDriveG = g(0), lfoWobG = g(0);
    lfoBus.connect(lfoCutG); lfoBus.connect(lfoDriveG); lfoBus.connect(lfoWobG); lfoMorphG.forEach(n => lfoBus.connect(n));
    lfoDriveG.connect(stages[1].pre.gain);
    const lfoBufs = {};
    const lfoBuffer = shape => {
      if (lfoBufs[shape]) return lfoBufs[shape];
      const N = 2048, buf = ctx.createBuffer(1, N, ctx.sampleRate), d = buf.getChannelData(0), steps = [0.8, -0.3, 0.5, -0.9, 0.1, 0.9, -0.6, 0.3];
      for (let i = 0; i < N; i++) {
        const x = i / N;
        d[i] = shape === 'sine' ? -Math.cos(2 * Math.PI * x) : shape === 'triangle' ? (x < 0.5 ? -1 + 4 * x : 3 - 4 * x)
          : shape === 'square' ? (x < 0.5 ? 1 : -1) : shape === 'saw' ? 1 - 2 * x : shape === 'ramp' ? -1 + 2 * x : steps[Math.floor(x * 8)];
      }
      if (shape === 'square' || shape === 'steps') { // korte randen, zodat een sprong niet tikt
        const src = Float32Array.from(d), w = 24; for (let i = 0; i < N; i++) { let s = 0; for (let k = 0; k < w; k++) s += src[(i + k) % N]; d[i] = s / w; }
      }
      return (lfoBufs[shape] = buf);
    };
    let lfoSrc = null, lfoShapeNow = null;
    const lfoHz = () => {
      const e = effective.lfoSync ?? state.lfoSync, bpm = Number.isFinite(host.bpm) && host.bpm > 0 ? host.bpm : curBpm;
      const hz = e === 'sync' ? (clamp(bpm, 20, 400) / 60) * LDIVS[effective.lfoDiv ?? state.lfoDiv] : (effective.lfoRate ?? state.lfoRate);
      return clamp(hz, 0.02, 60);
    };
    function startLfo(t) {
      if (dead) return;
      const old = lfoSrc, src = ctx.createBufferSource(); src.buffer = lfoBuffer(state.lfoShape); src.loop = true;
      src.playbackRate.value = lfoHz() * 2048 / ctx.sampleRate; src.connect(lfoBus); src.start(Math.max(t, ctx.currentTime));
      lfoSrc = src; lfoShapeNow = state.lfoShape;
      if (old) { try { old.stop(Math.max(t, ctx.currentTime)); } catch { /* al gestopt */ } old.onended = () => { try { old.disconnect(); } catch { /* los */ } }; }
    }

    // ---- formantfilter (drie banddoorlaten parallel) en hoofdfilter ----
    const fIn = g(1), fDry = g(1), fWet = g(0), bpG = [g(1), g(0.8), g(0.5)], fSum = g(1), fOut = g(1), fEnd = g(1);
    chainIn.connect(fIn); fIn.connect(fDry).connect(fOut); bpG.forEach(n => n.connect(fSum)); fSum.connect(fWet).connect(fOut);
    let bp = [], f1 = null, f2 = null;
    function buildFilters() {
      bp = [0, 1, 2].map(i => { const n = bq('bandpass', 1000, 5); fIn.connect(n); n.connect(bpG[i]); lfoMorphG[i].connect(n.detune); return n; });
      f1 = bq('lowpass', 3000, 0); f2 = bq('lowpass', 3000, 0); fOut.connect(f1); f1.connect(f2); f2.connect(fEnd); lfoCutG.connect(f1.detune); lfoCutG.connect(f2.detune);
    }
    function dropFilters() {
      bp.forEach((n, i) => { try { fIn.disconnect(n); } catch { /* los */ } try { lfoMorphG[i].disconnect(n.detune); } catch { /* los */ } dropNode(n); });
      if (f1) { try { fOut.disconnect(f1); } catch { /* los */ } try { lfoCutG.disconnect(f1.detune); } catch { /* los */ } try { lfoCutG.disconnect(f2.detune); } catch { /* los */ } dropNode(f1); dropNode(f2); }
      bp = []; f1 = f2 = null;
    }
    buildFilters();
    const ph1 = bq('highpass', 100, -3.0103), ph2 = bq('highpass', 100, -3.0103), wob = g(1), hiOut = g(1), mon = own(ctx.createAnalyser());
    fEnd.connect(ph1).connect(ph2).connect(wob).connect(hiOut).connect(bandSum); lfoWobG.connect(wob.gain); hiOut.connect(mon);

    // ---- uitgang ----
    const amp = g(0), level = g(0.5), dcb = bq('highpass', 20, 0.7), out = own(ctx.createDynamicsCompressor());
    const safe = own(ctx.createWaveShaper()), safeC = new Float32Array(2049); // veiligheidsgrens: lineair tot 0,6, daarboven een zachte knie naar 1
    for (let i = 0; i < safeC.length; i++) { const u = 8 * i / (safeC.length - 1) - 4, a = Math.abs(u); safeC[i] = Math.sign(u) * (a < 0.6 ? a : 0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4)); }
    safe.curve = safeC; const safeIn = g(0.25);
    bandSum.connect(amp).connect(level).connect(dcb).connect(out); out.connect(safeIn).connect(safe);
    out.threshold.value = -6; out.knee.value = 6; out.ratio.value = 10; out.attack.value = 0.003; out.release.value = 0.12;
    for (const o of [a1, b1, a2, b2, sub]) o.start();
    startLfo(ctx.currentTime);

    // bewaker: kijkt naar de uitvoer van de filterketen. Een instabiel filter geeft Infinity en daarna NaN en herstelt nooit; dan worden de filters vervangen.
    // Alleen in een live context: een offline render loopt niet in wandkloktijd.
    const chk = new Float32Array(256);
    function rebuildFilters() { dropFilters(); buildFilters(); first = true; apply(); first = false; }
    function guard() { if (dead) return; mon.getFloatTimeDomainData(chk); for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) { rebuildFilters(); return; } }
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    function setStage(i, e) {
      const s = stages[i], type = state['shape' + (i + 1)] ?? 'off';
      let amount = e['amt' + (i + 1)]; if (i === 0) amount = clamp(amount + e.morph * 0.25, 0, 1); // de Morph-macro opent ook de eerste trap een beetje
      if (s.type !== type) { s.ws.curve = type === 'off' ? null : curveFor(type); s.type = type; }
      if (type === 'off') { target(s.dry.gain, 1); target(s.wet.gain, 0); target(s.pre.gain, 1); target(s.post.gain, 1); return; }
      if (type === 'bit' || type === 'rectify') { target(s.dry.gain, 1 - amount); target(s.wet.gain, amount); target(s.pre.gain, 1); target(s.post.gain, 1); return; }
      const p = 0.1 + 0.9 * amount; target(s.dry.gain, 0); target(s.wet.gain, 1); target(s.pre.gain, p); target(s.post.gain, 1 / Math.max(0.25, peakOf(type, p)));
    }
    function bpmNow() { return Number.isFinite(host.bpm) && host.bpm > 0 ? host.bpm : curBpm; }
    function apply(t = ctx.currentTime) {
      effective = { ...state };
      for (const [k, d] of Object.entries(SPEC)) effective[k] = clamp(d[4] === 'log' ? state[k] * (d[1] / d[0]) ** (mod[k] || 0) : state[k] + (mod[k] || 0) * (d[1] - d[0]), d[0], d[1]);
      const e = effective, bend = e.bend * 100, u = e.unison, d = e.detune;
      setWave(a1, state.wave1); setWave(b1, state.wave1); setWave(a2, state.wave2); setWave(b2, state.wave2);
      target(a1.detune, bend - d * u, t); target(b1.detune, bend + d * u, t);
      target(a2.detune, bend + e.pitch2 * 100 - d * u * 0.8, t); target(b2.detune, bend + e.pitch2 * 100 + d * u * 1.25, t); target(sub.detune, bend, t);
      target(g1b.gain, 0.3 * u, t); target(g2a.gain, 0.2 * e.mix2, t); target(g2b.gain, 0.2 * e.mix2 * u, t); target(subG.gain, 0.5 * e.sub, t);
      target(o1Dry.gain, 1 - e.ring * 0.7, t); target(ringWet.gain, e.ring * 0.9, t);
      if (curFreq > 0) {
        target(fmG.gain, e.fm * curFreq * 2 ** (e.pitch2 / 12), t);
        sub.frequency.setTargetAtTime(curFreq * (state.subOct === -1 ? 0.5 : 1), t, 0.01);
      }
      for (const n of [lo1, lo2, hi1, hi2, ph1, ph2]) target(n.frequency, e.xover, t);
      for (let i = 0; i < 3; i++) setStage(i, e);
      const A = FORMANTS[state.vowelA], B = FORMANTS[state.vowelB], P = clamp(e.morph, 0, 1);
      for (let i = 0; i < 3; i++) {
        target(bp[i].frequency, A[i] * (B[i] / A[i]) ** P, t); target(bp[i].Q, e.fq, t);
        target(lfoMorphG[i].gain, e.lfoMorph * 0.5 * 1200 * Math.log2(B[i] / A[i]), t);
      }
      target(fWet.gain, e.formant * 3, t); target(fDry.gain, 1 - e.formant * 0.75, t);
      const q = state.ftype === 'bp' ? 0.7 + e.resonance * 12 : e.resonance * 18;
      if (f1.type !== (state.ftype === 'bp' ? 'bandpass' : 'lowpass')) f1.type = state.ftype === 'bp' ? 'bandpass' : 'lowpass';
      target(f1.frequency, e.cutoff, t); target(f1.Q, q, t); target(f2.frequency, state.ftype === 'lp24' ? e.cutoff : 20000, t);
      target(lfoCutG.gain, e.lfoCut * 3600, t); target(lfoDriveG.gain, e.lfoDrive * 0.4, t);
      target(wob.gain, 1 - e.lfoWob * 0.5, t); target(lfoWobG.gain, e.lfoWob * 0.5, t);
      if (lfoShapeNow !== state.lfoShape) startLfo(t);
      else if (lfoSrc) { if (first) lfoSrc.playbackRate.value = lfoHz() * 2048 / ctx.sampleRate; else lfoSrc.playbackRate.setTargetAtTime(lfoHz() * 2048 / ctx.sampleRate, t, 0.03); }
      target(level.gain, e.level * 2.5, t);
    }
    function at(t) { if (!envData) return 0; const e = envData, x = t - e.t; if (x <= 0) return 0; if (Number.isFinite(e.off) && t >= e.off) return Math.max(0, e.releaseLevel * (1 - (t - e.off) / e.release)); if (x < e.a) return e.peak * x / e.a; if (x < e.a + e.d) return e.peak * (1 - (1 - e.s) * (x - e.a) / e.d); return e.peak * e.s; }
    function off(t) {
      const value = at(t); if (envData) { envData.off = t; envData.release = effective.release; envData.releaseLevel = value; }
      amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(value, t); amp.gain.linearRampToValueAtTime(0, t + effective.release);
      for (const f of [f1, f2]) { f.detune.cancelScheduledValues(t); f.detune.setTargetAtTime(0, t, Math.max(0.01, effective.release / 3)); }
      current = null;
    }
    function play(n, v, t, duration) {
      held = held.filter(x => x.end > t && x.note !== n);
      const legato = state.legato && current && current.end > t, entry = { note: n, start: t, end: Number.isFinite(duration) ? t + duration : Infinity, vel: v }; held.push(entry); current = entry;
      const f = 440 * 2 ** ((n - 69) / 12), tc = legato ? effective.glide : 0.002; curFreq = f;
      for (const [o, ratio] of [[a1, 1], [b1, 1], [a2, 1], [b2, 1], [sub, state.subOct === -1 ? 0.5 : 1]]) { o.frequency.cancelScheduledValues(t); o.frequency.setTargetAtTime(f * ratio, t, tc); }
      fmG.gain.cancelScheduledValues(t); fmG.gain.setTargetAtTime(effective.fm * f * 2 ** (effective.pitch2 / 12), t, tc);
      amp.gain.cancelScheduledValues(t); const peak = 0.3 * (0.65 + v * 0.35 + effective.accent * v * 0.2);
      if (!legato) {
        envData = { t, a: effective.attack, d: effective.decay, s: effective.sustain, peak };
        amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(peak, t + effective.attack); amp.gain.linearRampToValueAtTime(peak * effective.sustain, t + effective.attack + effective.decay);
        if (state.lfoSync !== 'free') startLfo(t);
      } else { amp.gain.setValueAtTime(at(t), t); amp.gain.setTargetAtTime(peak * effective.sustain, t, 0.02); envData = { t, a: 0.001, d: 0.02, s: effective.sustain, peak }; }
      const cents = effective.fenv * 1200 * (0.5 + v * 0.5) * (1 + effective.accent * v * 0.5);
      for (const fl of [f1, f2]) { fl.detune.cancelScheduledValues(t); fl.detune.setValueAtTime(cents, t); fl.detune.setTargetAtTime(0, t, Math.max(0.01, effective.decay / 3)); }
      if (Number.isFinite(duration)) { const end = t + duration, saved = current; off(end); current = saved; }
    }
    function releaseNote(n, t) {
      held = held.filter(x => x.note !== n && x.end > t); if (current?.note !== n) return;
      const next = held.filter(x => x.start <= t).at(-1);
      if (next) play(next.note, next.vel, t, Number.isFinite(next.end) ? next.end - t : undefined); else off(t);
    }
    function panic(t = ctx.currentTime) { held = []; off(t); }

    // ---- UI ----
    let mountHost = null, panel = null, uiHandles = {};
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; uiHandles = {}; }
    function mountUI(el) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'), shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:#c0a0f0;--x-acc2:#e8c991;--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg,#d9e6e7))}.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:12px;box-sizing:border-box}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 0}.sec{border:1px solid var(--line,#344953);border-radius:8px;padding:7px 8px 8px;margin:0 0 6px;min-width:0}.sec h4{margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--x-acc)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:6px}.control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:3px 6px;padding:5px 6px;border:1px solid var(--line,#344953);border-radius:6px;min-width:0}.control>input,.control>select{grid-column:1/3}.control span{font-size:11px;color:var(--muted,#adc3c9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:4px 6px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none;padding:7px 10px}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:11px monospace;color:var(--x-ink2)}label{min-width:0}`);
      panel = add(shadow, 'div'); panel.className = 'app'; return panel;
    }
    const fmt = (k, v) => {
      if (k === 'cutoff' || k === 'xover') return Math.round(v) + ' Hz'; if (k === 'detune') return v.toFixed(1) + ' ct'; if (k === 'lfoRate') return v.toFixed(2) + ' Hz';
      if (k === 'pitch2' || k === 'bend') return (v > 0 ? '+' : '') + v.toFixed(k === 'bend' ? 2 : 0) + ' st'; if (k === 'attack' || k === 'decay' || k === 'release' || k === 'glide') return v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
      if (k === 'fenv') return v.toFixed(2) + ' oct'; if (k === 'fq') return 'Q ' + v.toFixed(1); return v.toFixed(2);
    };
    function selectEl(parent, k) {
      const [values] = CHOICES[k], box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(LABELS[k]));
      const el = add(box, 'select'); for (const v of values) { const o = add(el, 'option', choiceLabel(k, v)); o.value = String(v); }
      el.value = String(state[k]); el.onchange = () => { state[k] = typeof values[0] === 'number' ? Number(el.value) : el.value; apply(); };
      adopt(el, k, 'select', GROUP_OF[k], tx(LABELS[k])); uiHandles[k] = { set(v) { el.value = String(v); } }; return el;
    }
    function toggleEl(parent, k) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(LABELS[k]));
      const el = add(box, 'select'); for (const [v, text] of [['1', tx('Aan')], ['0', tx('Uit')]]) { const o = add(el, 'option', text); o.value = v; }
      el.value = state[k] ? '1' : '0'; el.onchange = () => { state[k] = el.value === '1'; }; adopt(el, k, 'select', GROUP_OF[k], tx(LABELS[k])); uiHandles[k] = { set(v) { el.value = v ? '1' : '0'; } }; return el;
    }
    function knobEl(parent, k) {
      const d = SPEC[k], isLog = d[4] === 'log', box = add(parent, 'label'); box.className = 'control'; add(box, 'span', tx(LABELS[k]));
      const toPos = v => isLog ? Math.log(v / d[0]) / Math.log(d[1] / d[0]) : v, fromPos = p => isLog ? d[0] * (d[1] / d[0]) ** p : p;
      const out = add(box, 'output', fmt(k, state[k])), input = add(box, 'input'); input.type = 'range';
      if (isLog) { input.min = '0'; input.max = '1'; input.step = '0.0005'; } else { input.min = String(d[0]); input.max = String(d[1]); input.step = String(d[2]); }
      input.value = String(toPos(state[k])); input.dataset.pkDefault = String(toPos(d[3]));
      adopt(input, k, 'param', GROUP_OF[k], tx(LABELS[k]));
      input.oninput = () => { const v = clamp(isLog ? fromPos(Number(input.value)) : Number(input.value), d[0], d[1]); out.textContent = fmt(k, v); state[k] = Number(v.toFixed(6)); apply(); };
      uiHandles[k] = { set(v) { input.value = String(toPos(v)); out.textContent = fmt(k, v); } };
    }
    function render(el) {
      mountUI(el);
      for (const [gid, title, keys] of SECTIONS) {
        const sec = add(panel, 'section'); sec.className = 'sec'; sec.dataset.group = gid; add(sec, 'h4', tx(title)); const grid = add(sec, 'div'); grid.className = 'grid';
        for (const k of keys) { if (k === 'legato') toggleEl(grid, k); else if (CHOICES[k]) selectEl(grid, k); else knobEl(grid, k); }
      }
      const r = add(panel, 'div'); r.className = 'row';
      const b1 = add(r, 'button', tx('Proefbas')); b1.type = 'button'; b1.onclick = () => play(36, 0.85, ctx.currentTime, 0.9);
      const b2 = add(r, 'button', tx('Alles uit')); b2.type = 'button'; b2.onclick = () => panic();
    }
    function paint() { for (const k in uiHandles) uiHandles[k].set(state[k]); }

    const self = {
      inputs: {}, outputs: { out: safe }, mount: render, unmount: clearUI,
      onTransport(info) { if (!dead && !info?.playing) panic(); },
      onStep(s) { if (!dead && s && Number.isFinite(s.bpm) && s.bpm > 0) { curBpm = s.bpm; if (state.lfoSync === 'sync' && lfoSrc) lfoSrc.playbackRate.setTargetAtTime(lfoHz() * 2048 / ctx.sampleRate, ctx.currentTime, 0.03); } },
      onEvent(port, e) {
        try {
          if (dead || port !== 'notes' || !e || !Number.isFinite(e.time)) return;
          const t = Math.max(ctx.currentTime, e.time), type = String(e.type).toLowerCase().replace(/[_-]/g, '');
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(e.note)) {
            const n = clamp(e.note, 0, 127);
            if (type === 'noteoff' || e.vel === 0) releaseNote(n, t);
            else play(n, finite(e.vel, 0.8, 0, 1), t, e.held === true ? undefined : Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : undefined);
          } else if (type === 'cc' && SPEC[e.id] && Number.isFinite(e.value)) {
            const d = SPEC[e.id]; state[e.id] = d[0] + clamp(e.value, 0, 1) * (d[1] - d[0]); apply(t); paint();
          } else if (type === 'panic' || type === 'allnotesoff') panic(t);
        } catch { /* een slecht event mag de planner niet breken */ }
      },
      params() { return Object.entries(SPEC).map(([id, d]) => ({ id, name: tx(LABELS[id]), lane: 'neuro', laneName: 'Neuro Bass', min: d[0], max: d[1], scale: d[4], role: d[5], drift: d[6] ? 0.2 : 0.02, on: d[6] })); },
      modulate(o) { if (dead) return; mod = {}; if (o && typeof o === 'object') for (const k in SPEC) if (Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
        for (const [k, d] of Object.entries(SPEC)) next[k] = finite(s[k], d[3], d[0], d[1]);
        for (const [k, d] of Object.entries(CHOICES)) if (d[0].includes(s[k])) next[k] = s[k];
        if (typeof s.legato === 'boolean') next.legato = s.legato;
        state = next; apply(); paint();
      },
      destroy() {
        if (dead) return; dead = true; if (guardT) clearInterval(guardT); clearUI();
        for (const n of [a1, b1, a2, b2, sub, lfoSrc]) try { n && n.stop(); } catch { /* al gestopt */ }
        for (const n of [...nodes, lfoSrc]) try { n && n.disconnect(); } catch { /* los */ }
        held = [];
      },
    };
    apply(); first = false; return self;
  },
};
