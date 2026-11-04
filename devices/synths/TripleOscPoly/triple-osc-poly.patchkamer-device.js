// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Een noot korter dan de attack van de versterker (of van de filter-envelope) was stil, doordat de release de attack-ramp annuleerde: de release begint nu vanaf de waarde die de envelope op dat moment heeft (cancelAndHoldAtTime), dus een korte noot laat een zacht stuk van de attack horen.
//   Voor noten die langer duren dan hun attack is de reeks Web Audio-aanroepen identiek aan 1.11.0.
// 1.11.0 — Nieuw als Triple Osc Poly (nieuwe naam; de id nl.patchkamer.polysynth blijft gelijk, dus bestaande werkruimtes laden), eigen map, bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Triple Osc Poly; namen van de klankstanden zijn Engels
//   - setState volgt §13: onbekende velden worden genegeerd, ongeldige waarden krijgen de standaard, getallen worden binnen hun bereik afgekapt
//   - bewaker: een meter kijkt om de 50 ms naar de ruwe uitvoer van de filters (voor de vervormer, die een ontsporing verbergt); wordt die niet eindig
//     (NaN, Infinity) of absurd groot, dan worden alle stemmen direct stilgezet, zodat één ontspoord filter geen NaN naar de rest van de studio blijft sturen
//   - noten en sturing met een niet-eindige waarde worden genegeerd of op een veilige waarde gezet
//   - de oversampling van de shaper volgt host.audio.oversample (§12c); kleuren uit de host
// Meerstemmige subtractieve synth: 3 oscillators (zaag, blok, driehoek, sinus, FM, getoonde ruis) met unison tot 7,
// ringmodulatie 1×2 en FM 2→1, ruis, 2 filters (serieel of parallel) met envelope, waveshaper per stem, twee ADSR's,
// akkoord uit één noot, klankstanden en een speelbaar klavier. Stuurbaar (v1.3) en snel stuurbaar (v1.4) op stemming,
// beide cutoffs, reso 1, niveau en pan.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const OTYPES = [['saw', 'Zaag'], ['sqr', 'Blok'], ['tri', 'Driehoek'], ['sine', 'Sinus'], ['fm', 'FM'], ['noise', 'Getoonde ruis']];
const FTYPES = [['lp12', 'LP 12'], ['lp24', 'LP 24'], ['hp12', 'HP 12'], ['hp24', 'HP 24'], ['bp', 'Band'], ['notch', 'Notch'], ['peak', 'Piek']];
const STYPES = [['off', 'uit'], ['soft', 'Zacht'], ['hard', 'Hard'], ['fold', 'Vouw'], ['asym', 'Asymmetrisch']];
const CHORDS = [['', 'Eén noot', [0]], ['maj', 'Groot', [0, 4, 7]], ['min', 'Klein', [0, 3, 7]], ['sus2', 'Sus2', [0, 2, 7]], ['sus4', 'Sus4', [0, 5, 7]], ['min7', 'Klein 7', [0, 3, 7, 10]],
  ['maj7', 'Groot 7', [0, 4, 7, 11]], ['dom7', 'Dominant 7', [0, 4, 7, 10]], ['min9', 'Klein 9', [0, 3, 7, 10, 14]], ['fifth', 'Kwint', [0, 7]], ['oct', 'Octaven', [0, 12]]];
const EN = {
  'Zaag': 'Sawtooth', 'Blok': 'Square', 'Driehoek': 'Triangle', 'Sinus': 'Sine', 'Getoonde ruis': 'Tuned noise', 'Piek': 'Peak',
  'uit': 'off', 'Zacht': 'Soft', 'Vouw': 'Fold', 'Asymmetrisch': 'Asymmetric',
  'Eén noot': 'Single note', 'Groot': 'Major', 'Klein': 'Minor', 'Klein 7': 'Minor 7', 'Groot 7': 'Major 7', 'Klein 9': 'Minor 9', 'Kwint': 'Fifth', 'Octaven': 'Octaves',
  'Stemming': 'Tune', 'Osc 1 niveau': 'Osc 1 level', 'Osc 2 niveau': 'Osc 2 level', 'Osc 3 niveau': 'Osc 3 level', 'Unison-spreiding': 'Unison spread', 'Ruis': 'Noise',
  'Reso': 'Resonance', 'Env-diepte': 'Env depth', 'Niveau': 'Level', 'Uitgang': 'Output',
  'Octaaf': 'Octave', 'Halve tonen': 'Semitones', 'Fijn': 'Fine', 'Spreiding': 'Spread', 'Menging': 'Mix', 'Vorm': 'Shape', 'Toonvolgen': 'Key follow',
  'Serieel (1 → 2)': 'Series (1 → 2)', 'Aanslag': 'Velocity', 'Stemmen & uitgang': 'Voices & output', 'Stemmen': 'Voices', 'Akkoord': 'Chord', 'Ligging': 'Voicing',
  'Dicht': 'Close', 'Open + bas': 'Open + bass', 'aan': 'on', 'klavier': 'keyboard',
  '{0} van {1} stemmen': '{0} of {1} voices', ' · {0} sterven uit': ' · {0} fading out',
};
const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

const osc = (o = {}) => ({ on: true, type: 'saw', oct: 0, semi: 0, fine: 0, lvl: 0.7, uni: 1, det: 12, spread: 0.5, fmr: 2, fmi: 2, ...o });
const DEF = () => ({
  osc: [osc(), osc({ type: 'sqr', semi: 0, fine: 7, lvl: 0.5 }), osc({ type: 'sine', oct: -1, lvl: 0.4 })],
  noise: 0, ring: 0, fm21: 0,
  f1: { type: 'lp24', cut: 2400, res: 1.2, env: 0.35, kt: 0.5 }, f2: { type: 'hp12', cut: 60, res: 0.7, env: 0, kt: 0 }, f2on: false, route: 'serial',
  shp: { type: 'soft', drive: 0.15 },
  fa: 0.01, fd: 0.5, fs: 0.3, fr: 0.6, aa: 0.01, ad: 0.4, as: 0.75, ar: 0.6, vel: 0.5,
  poly: 8, chord: '', spread: 0, tune: 0, lvl: 0.6, pan: 0,
});
const PRESETS = {
  'Init': {},
  'Warm Pad': { osc: [osc({ uni: 5, det: 18, spread: 0.8 }), osc({ type: 'saw', oct: -1, uni: 3, det: 10, lvl: 0.5 }), osc({ on: false })], f1: { type: 'lp24', cut: 900, res: 1, env: 0.3, kt: 0.4 }, fa: 1.2, fd: 2, fs: 0.5, fr: 2.5, aa: 1.4, ad: 1, as: 0.9, ar: 3, chord: 'min7' },
  'Strings': { osc: [osc({ uni: 7, det: 22, spread: 1 }), osc({ type: 'saw', oct: 1, uni: 3, det: 15, lvl: 0.25 }), osc({ on: false })], f1: { type: 'lp12', cut: 3200, res: 0.8, env: 0.15, kt: 0.6 }, aa: 0.6, ad: 1, as: 0.85, ar: 1.6, shp: { type: 'off', drive: 0 } },
  'FM Keys': { osc: [osc({ type: 'fm', fmr: 1, fmi: 3, lvl: 0.7 }), osc({ type: 'fm', fmr: 3.5, fmi: 1.2, lvl: 0.3 }), osc({ type: 'sine', oct: -1, lvl: 0.3 })], f1: { type: 'lp12', cut: 6000, res: 0.7, env: 0.2, kt: 0.5 }, aa: 0.003, ad: 1.2, as: 0.2, ar: 0.8, chord: 'maj7' },
  'Pluck': { osc: [osc({ type: 'sqr', lvl: 0.6 }), osc({ type: 'saw', fine: -9, lvl: 0.5 }), osc({ on: false })], f1: { type: 'lp24', cut: 400, res: 3, env: 0.75, kt: 0.7 }, fa: 0.002, fd: 0.25, fs: 0, fr: 0.3, aa: 0.002, ad: 0.35, as: 0, ar: 0.3 },
  'Supersaw': { osc: [osc({ uni: 7, det: 30, spread: 1 }), osc({ uni: 7, det: 25, oct: -1, lvl: 0.45, spread: 1 }), osc({ on: false })], f1: { type: 'lp24', cut: 5000, res: 1, env: 0.2, kt: 0.3 }, shp: { type: 'soft', drive: 0.3 }, aa: 0.01, ad: 0.5, as: 0.8, ar: 0.5 },
  'Deep Bass': { osc: [osc({ type: 'saw', oct: -2, lvl: 0.6 }), osc({ type: 'sqr', oct: -2, fine: 5, lvl: 0.5 }), osc({ type: 'sine', oct: -3, lvl: 0.6 })], f1: { type: 'lp24', cut: 220, res: 2.5, env: 0.5, kt: 0.2 }, fa: 0.003, fd: 0.3, fs: 0.2, fr: 0.2, aa: 0.003, ad: 0.5, as: 0.8, ar: 0.15, shp: { type: 'asym', drive: 0.35 }, poly: 1 },
  'Glass': { osc: [osc({ type: 'fm', fmr: 3.01, fmi: 4, lvl: 0.5 }), osc({ type: 'fm', fmr: 7, fmi: 1, oct: 1, lvl: 0.25 }), osc({ on: false })], f1: { type: 'lp12', cut: 9000, res: 0.7, env: 0, kt: 0 }, aa: 0.002, ad: 2.5, as: 0, ar: 2.5, ring: 0.1, shp: { type: 'off', drive: 0 } },
  'Noise Field': { osc: [osc({ type: 'noise', lvl: 0.8, uni: 3, det: 25 }), osc({ type: 'noise', oct: 1, lvl: 0.4 }), osc({ type: 'sine', oct: -1, lvl: 0.2 })], f1: { type: 'bp', cut: 1200, res: 2, env: 0.2, kt: 0.8 }, aa: 2, ad: 2, as: 0.9, ar: 4, chord: 'sus2' },
};
// stuurbare parameters: id, naam, min, max, log, rol, bereik, aan, spoor, snel
const MODP = [
  ['tune', 'Stemming', -100, 100, false, 'pitch', 0.04, true, 'osc', true], ['o1lvl', 'Osc 1 niveau', 0, 1, false, 'level', 0.1, false, 'osc'], ['o2lvl', 'Osc 2 niveau', 0, 1, false, 'level', 0.1, false, 'osc'],
  ['o3lvl', 'Osc 3 niveau', 0, 1, false, 'level', 0.1, false, 'osc'], ['udet', 'Unison-spreiding', 0, 2, false, 'detune', 0.15, true, 'osc'], ['noise', 'Ruis', 0, 1, false, 'level', 0.1, false, 'osc'],
  ['ring', 'Ring 1×2', 0, 1, false, 'level', 0.1, false, 'osc'], ['fm21', 'FM 2→1', 0, 1, false, 'fm', 0.1, false, 'osc'],
  ['cut1', 'Cutoff', 40, 20000, true, 'filter', 0.08, true, 'f1', true], ['res1', 'Reso', 0.3, 20, false, 'res', 0.08, false, 'f1', true], ['env1', 'Env-diepte', -1, 1, false, 'env', 0.1, false, 'f1'],
  ['cut2', 'Cutoff', 40, 20000, true, 'filter', 0.08, false, 'f2', true], ['env2', 'Env-diepte', -1, 1, false, 'env', 0.1, false, 'f2'],
  ['drive', 'Drive', 0, 1, false, 'drive', 0.1, false, 'shp'],
  ['fa', 'Filter attack', 0.001, 8, true, 'attack', 0.1, false, 'env'], ['fd', 'Filter decay', 0.01, 8, true, 'decay', 0.1, false, 'env'], ['aa', 'Amp attack', 0.001, 8, true, 'attack', 0.1, false, 'env'],
  ['ad', 'Amp decay', 0.01, 8, true, 'decay', 0.1, false, 'env'], ['ar', 'Amp release', 0.01, 10, true, 'decay', 0.1, false, 'env'],
  ['lvl', 'Niveau', 0, 1, false, 'level', 0.05, false, 'out', true], ['pan', 'Pan', -1, 1, false, 'pan', 0.15, false, 'out', true],
];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const LANES = { osc: 'Oscillators', f1: 'Filter 1', f2: 'Filter 2', shp: 'Shaper', env: 'Envelopes', out: 'Uitgang' };
const FAST = { tune: 200, cut1: 1200 * Math.log2(20000 / 40), res1: 19.7, cut2: 1200 * Math.log2(20000 / 40), lvl: 1, pan: 2 };
const GUARD_LIMIT = 1000;   // ruwe filteruitvoer: normaal tot enkele tientallen; een ontspoord filter loopt in tientallen ms naar 1e6
const CURVES = new Map();
function shapeCurve(type, drive) {
  const k = type + Math.round(drive * 100); if (CURVES.has(k)) return CURVES.get(k);
  const n = 2048, c = new Float32Array(n), g = 1 + drive * 9;
  for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; let y = x;
    if (type === 'soft') y = Math.tanh(g * x) / Math.tanh(g);
    else if (type === 'hard') y = clamp(x * g, -1, 1);
    else if (type === 'fold') y = Math.sin(x * (1 + drive * 6) * Math.PI / 2);
    else if (type === 'asym') y = x >= 0 ? Math.tanh(g * x) / Math.tanh(g) : Math.tanh(g * 0.4 * x) / Math.tanh(g * 0.4) * 0.8;
    c[i] = y; }
  CURVES.set(k, c); return c;
}

const CSS = `
:host{all:initial;display:block;container-type:inline-size;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:var(--fg,#e6e9ee);--x-acc:#f4d35e}
*{box-sizing:border-box}
.ps{display:grid;gap:10px;min-width:0}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.top .lab{margin-right:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.mod{border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,var(--card,#161a20));padding:8px 10px;display:grid;gap:5px;align-content:start;min-width:0}
.mod h3{margin:0 0 2px;font-family:var(--disp,sans-serif);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#e6e9ee));display:flex;justify-content:space-between;align-items:center;gap:8px}
.mod h3 label{font-family:var(--mono,monospace);font-size:10px;letter-spacing:0;text-transform:none;color:var(--muted,#8a93a3);display:flex;gap:4px;align-items:center;cursor:pointer}
.mod.off>*:not(h3){opacity:.4}
.k{display:grid;grid-template-columns:86px minmax(0,1fr) 54px;gap:8px;align-items:center;min-width:0}
.k label{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#8a93a3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{text-align:right;font-variant-numeric:tabular-nums;font-size:11px}
.lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a3)}
button,select{font:inherit;font-size:11px;color:var(--field-fg,var(--fg,#e6e9ee));background:var(--field,var(--card,#1c2128));border:1px solid var(--line,#2a303a);border-radius:4px;padding:3px 7px;min-width:0}
button{cursor:pointer} button:hover{border-color:var(--x-acc)} button.on{background:var(--x-acc);border-color:var(--x-acc);color:#1b1708}
input[type=range]{width:100%;margin:0;accent-color:var(--x-acc);height:16px;min-width:0}
input[type=checkbox]{accent-color:var(--x-acc);margin:0}
.keys{display:flex;gap:2px;user-select:none;touch-action:none;overflow-x:auto;padding-bottom:2px}
.keys button{flex:1 0 22px;height:54px;padding:0 0 4px;display:flex;align-items:flex-end;justify-content:center;font-size:9px;color:#333;background:#e8e6df;border-color:#999;border-radius:0 0 3px 3px}
.keys button.b{flex:0 0 18px;margin:0 -10px;z-index:1;background:#1c2128;color:#888;height:34px;border-color:#444}
.keys button.down{background:var(--x-acc);color:#111}
.voices{font-size:11px;color:var(--muted,#8a93a3)}
`;

export default {
  id: 'nl.patchkamer.polysynth',
  name: 'Triple Osc Poly',
  version: '1.11.1',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 1180, minWidth: 420 },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const OS = ['none', '2x', '4x'].includes(host.audio && host.audio.oversample) ? host.audio.oversample : '2x';
    let P = DEF(); const mod = {}; let dead = false, root = null, refreshers = [], voices = [], noiseBuf = null, voiceInfo = null;
    // ---------- uitgang en snelle bussen ----------
    const polyOut = ctx.createGain(), pan = ctx.createStereoPanner(), out = ctx.createGain(); polyOut.connect(pan).connect(out); out.gain.value = 0.9;
    const bus = {}, ctl = {};
    // bewaker: een meter op de ruwe filteruitvoer van alle stemmen (voor de shaper, die een ontsporing verbergt). Een instabiel filter geeft Infinity en daarna NaN;
    // dan zetten we alle stemmen stil. Houdt de oorzaak aan (een modulator die de cutoff op audiosnelheid door het hele bereik stuurt), dan ontsporen ook de nieuwe stemmen:
    // bij een tweede ontsporing binnen een seconde krijgen nieuwe stemmen geen snelle sturing van cutoff en resonantie meer (2 s, 4 s, … tot een minuut).
    const mon = ctx.createAnalyser(); mon.fftSize = 256; const monKeep = typeof ctx.createConstantSource === 'function' ? ctx.createConstantSource() : null;
    if (monKeep) { monKeep.offset.value = 0; monKeep.connect(mon); try { monKeep.start(); } catch (e) {} }   // houdt de meter in leven, ook als er geen stem klinkt
    const chk = new Float32Array(256); let lastTrip = -1e9, safeLen = 2, safeUntil = 0;
    Object.entries(FAST).forEach(([k, scale]) => { const g = ctx.createGain(); g.gain.value = scale; bus[k] = g;
      if (typeof ctx.createConstantSource === 'function') { const c = ctx.createConstantSource(); c.offset.value = 0; try { c.start(); } catch (e) {} c.connect(g); ctl[k] = c; } });
    bus.lvl.connect(polyOut.gain); bus.pan.connect(pan.pan);
    const E = k => { const m = MODBY[k]; let b; switch (k) { case 'o1lvl': b = P.osc[0].lvl; break; case 'o2lvl': b = P.osc[1].lvl; break; case 'o3lvl': b = P.osc[2].lvl; break; case 'udet': b = 1; break;
      case 'cut1': b = P.f1.cut; break; case 'res1': b = P.f1.res; break; case 'env1': b = P.f1.env; break; case 'cut2': b = P.f2.cut; break; case 'env2': b = P.f2.env; break; case 'drive': b = P.shp.drive; break; default: b = P[k]; }
      const o = mod[k] || 0; if (!m || !o || FAST[k] !== undefined) return b; const [, , mn, mx, log] = m; return log ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    function applyGlobal() { const t = ctx.currentTime; polyOut.gain.setTargetAtTime(P.lvl, t, 0.03); pan.pan.setTargetAtTime(P.pan, t, 0.03); }
    applyGlobal();
    function noise() { if (!noiseBuf) { const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseBuf = b; }
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.loopStart = Math.random(); return s; }

    // ---------- een stem ----------
    function mkFilter(spec, cut, res, nodes) {   // geeft [eerste, laatste, frequentie-params, resonante]
      const t = spec.type, two = t === 'lp24' || t === 'hp24', ty = { lp12: 'lowpass', lp24: 'lowpass', hp12: 'highpass', hp24: 'highpass', bp: 'bandpass', notch: 'notch', peak: 'peaking' }[t] || 'lowpass';
      const a = ctx.createBiquadFilter(); a.type = ty; nodes.push(a); let b = a;
      if (two) { b = ctx.createBiquadFilter(); b.type = ty; a.connect(b); nodes.push(b); a.Q.value = 0.707; b.Q.value = res; } else { a.Q.value = ty === 'peaking' ? res : res; if (ty === 'peaking') a.gain.value = 12; }
      [a, b].forEach(f => f.frequency.value = cut); return { a, b, fs: two ? [a, b] : [a], q: b };
    }
    function envFreq(params, base, env, A, D, S, R, t, tOff) {   // filterenvelope op frequentie (oct = env*7)
      const pk = clamp(base * Math.pow(2, env * 7), 20, 20000), su = clamp(base * Math.pow(2, env * 7 * S), 20, 20000);
      params.forEach(p => { p.cancelScheduledValues(t); p.setValueAtTime(base, t); p.linearRampToValueAtTime(pk, t + A); p.setTargetAtTime(su, t + A, D / 4); if (tOff != null) { if (tOff < t + A && typeof p.cancelAndHoldAtTime === 'function') p.cancelAndHoldAtTime(tOff); else p.cancelScheduledValues(tOff); p.setTargetAtTime(base, tOff, R / 4); } });
    }
    const isHeld = v => v.relAt == null;   // nog aangehouden (nog niet losgelaten)
    function voiceOn(note, vel, t, dur, scale) {
      const tOff = dur != null ? t + Math.max(0.01, dur) : null, f0 = mtof(note);
      // stem stelen: alleen aangehouden stemmen tellen voor het maximum; wegstervende staarten maximaal 2× zoveel
      const on = voices.filter(v => isHeld(v) || v.relAt > t); if (on.length >= P.poly) kill(on.sort((a, b) => a.t0 - b.t0)[0], t);
      const tails = voices.filter(v => !isHeld(v) && v.relAt <= t && (v.endAt == null || v.endAt > t)); if (tails.length > P.poly * 2) kill(tails.sort((a, b) => a.t0 - b.t0)[0], t);
      const v = { note, t0: t, nodes: [], srcs: [], done: false, endAt: null, conns: [] };
      const mix = ctx.createGain(); v.nodes.push(mix);
      const fineC = P.tune; const udet = clamp(1 + (mod.udet || 0) * 2, 0, 3);
      const first = [];
      P.osc.forEach((o, oi) => {
        const lvl = E(['o1lvl', 'o2lvl', 'o3lvl'][oi]); if (!o.on || lvl <= 0.0001) { first[oi] = null; return; }
        const n = clamp(o.uni | 0, 1, 7), og = ctx.createGain(); og.gain.value = lvl / Math.sqrt(n); og.connect(mix); v.nodes.push(og);
        const fr = f0 * Math.pow(2, o.oct + o.semi / 12);
        for (let u = 0; u < n; u++) {
          const spread = n > 1 ? (u / (n - 1)) * 2 - 1 : 0, cents = o.fine + fineC + spread * o.det * udet, pn = ctx.createStereoPanner(); pn.pan.value = spread * o.spread; pn.connect(og); v.nodes.push(pn);
          let src, detP = [];
          if (o.type === 'noise') { const s = noise(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.detune.value = cents; bp.Q.value = 25; const g = ctx.createGain(); g.gain.value = 4; s.connect(bp).connect(g).connect(pn); v.srcs.push(s); v.nodes.push(bp, g); src = g; detP = [bp.detune]; }
          else if (o.type === 'fm') { const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(); c.type = 'sine'; m.type = 'sine'; c.frequency.value = fr; m.frequency.value = fr * o.fmr; c.detune.value = cents; m.detune.value = cents; mg.gain.value = fr * o.fmr * o.fmi; m.connect(mg).connect(c.frequency); c.connect(pn); v.srcs.push(c, m); v.nodes.push(mg); src = c; detP = [c.detune, m.detune]; v.fmIn = v.fmIn || []; if (oi === 0) v.fmIn.push(c.frequency); }
          else { const s = ctx.createOscillator(); s.type = { saw: 'sawtooth', sqr: 'square', tri: 'triangle', sine: 'sine' }[o.type] || 'sawtooth'; s.frequency.value = fr; s.detune.value = cents; s.connect(pn); v.srcs.push(s); src = s; detP = [s.detune]; if (oi === 0) { v.fmIn = v.fmIn || []; v.fmIn.push(s.frequency); } }
          detP.forEach(p => { bus.tune.connect(p); v.conns.push([bus.tune, p]); });
          if (u === 0) first[oi] = { src, fr };
        }
      });
      const nz = E('noise'); if (nz > 0.001) { const s = noise(), g = ctx.createGain(); g.gain.value = nz * 0.5; s.connect(g).connect(mix); v.srcs.push(s); v.nodes.push(g); }
      const rg = E('ring'); if (rg > 0.001 && first[0] && first[1]) { const r = ctx.createGain(), rl = ctx.createGain(); r.gain.value = 0; rl.gain.value = rg; first[0].src.connect(r); first[1].src.connect(r.gain); r.connect(rl).connect(mix); v.nodes.push(r, rl); }
      const fm = E('fm21'); if (fm > 0.001 && first[1] && v.fmIn) { const g = ctx.createGain(); g.gain.value = fm * f0 * 2; first[1].src.connect(g); v.fmIn.forEach(p => g.connect(p)); v.nodes.push(g); }
      // filters en shaper
      const kt = (spec) => Math.pow(f0 / 261.63, spec.kt);
      const F1 = mkFilter(P.f1, clamp(E('cut1') * kt(P.f1), 20, 20000), E('res1'), v.nodes);
      if (!safeUntil) { F1.fs.forEach(f => { bus.cut1.connect(f.detune); v.conns.push([bus.cut1, f.detune]); }); bus.res1.connect(F1.q.Q); v.conns.push([bus.res1, F1.q.Q]); }
      F1.b.connect(mon);
      let F2 = null; if (P.f2on) { F2 = mkFilter(P.f2, clamp(E('cut2') * kt(P.f2), 20, 20000), P.f2.res, v.nodes); if (!safeUntil) F2.fs.forEach(f => { bus.cut2.connect(f.detune); v.conns.push([bus.cut2, f.detune]); }); F2.b.connect(mon); }
      const sh = P.shp.type !== 'off' ? ctx.createWaveShaper() : null; if (sh) { const dr = E('drive'); sh.curve = shapeCurve(P.shp.type, dr); sh.oversample = OS; v.nodes.push(sh); }
      const shG = ctx.createGain(); shG.gain.value = sh ? 1 / (1 + E('drive') * 0.8) : 1; v.nodes.push(shG);
      const vca = ctx.createGain(); vca.gain.value = 0; v.nodes.push(vca); v.vca = vca;
      if (!F2) { mix.connect(F1.a); (sh ? (F1.b.connect(sh), sh) : F1.b).connect(shG); }
      else if (P.route === 'serial') { mix.connect(F1.a); const mid = sh ? (F1.b.connect(sh), sh) : F1.b; mid.connect(F2.a); F2.b.connect(shG); }
      else { mix.connect(F1.a); mix.connect(F2.a); const sum = ctx.createGain(); sum.gain.value = 0.7; v.nodes.push(sum); F1.b.connect(sum); F2.b.connect(sum); (sh ? (sum.connect(sh), sh) : sum).connect(shG); }
      shG.connect(vca).connect(polyOut);
      // envelopes
      const fa = E('fa'), fd = E('fd'), fr = P.fr, aa = E('aa'), ad = E('ad'), as = P.as, ar = E('ar');
      envFreq(F1.fs.map(f => f.frequency), clamp(E('cut1') * kt(P.f1), 20, 20000), E('env1'), fa, fd, P.fs, fr, t, tOff);
      if (F2) envFreq(F2.fs.map(f => f.frequency), clamp(E('cut2') * kt(P.f2), 20, 20000), E('env2'), fa, fd, P.fs, fr, t, tOff);
      const peak = (1 - P.vel * (1 - clamp(vel, 0, 1))) * 0.35 * (scale || 1);
      vca.gain.setValueAtTime(0.0001, t); vca.gain.linearRampToValueAtTime(peak, t + aa); vca.gain.setTargetAtTime(peak * as, t + aa, ad / 4);
      v.ar = ar; v.aa = aa; v.peak = peak; v.as = as;
      v.srcs.forEach(s => { try { s.start(t); } catch (e) {} });
      if (tOff != null) release(v, tOff);
      voices.push(v); return v;
    }
    function release(v, t) { if (v.endAt != null && v.endAt <= t + v.ar * 1.5) return; v.relAt = t; if (t < v.t0 + v.aa && typeof v.vca.gain.cancelAndHoldAtTime === 'function') v.vca.gain.cancelAndHoldAtTime(t); else v.vca.gain.cancelScheduledValues(t); v.vca.gain.setTargetAtTime(0.0001, t, Math.max(0.005, v.ar / 4)); v.endAt = t + v.ar * 1.6 + 0.05; v.srcs.forEach(s => { try { s.stop(v.endAt); } catch (e) {} }); }
    function kill(v, t) { v.ar = 0.02; v.endAt = null; release(v, Math.max(t - 0.005, ctx.currentTime)); }
    function cleanup() { const now = ctx.currentTime; voices = voices.filter(v => { if (v.endAt != null && now > v.endAt + 0.1) { v.conns.forEach(([a, b]) => { try { a.disconnect(b); } catch (e) {} }); v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); return false; } return true; });
      if (voiceInfo) { const h = voices.filter(v => v.relAt == null || v.relAt > now).length, tl = voices.filter(v => v.relAt != null && v.relAt <= now && v.endAt > now).length; voiceInfo.textContent = tx('{0} van {1} stemmen', h, P.poly) + (tl ? tx(' · {0} sterven uit', tl) : ''); } }
    const ct = setInterval(() => { if (!dead) cleanup(); }, 250);
    function stopAll() { voices.forEach(v => { v.srcs.forEach(s => { try { s.stop(); } catch (e) {} }); v.conns.forEach(([a, b]) => { try { a.disconnect(b); } catch (e) {} }); v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }); voices = []; held.clear(); }
    function guard() {
      if (dead) return; const now = ctx.currentTime; if (safeUntil && now >= safeUntil) safeUntil = 0;
      mon.getFloatTimeDomainData(chk);
      for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < GUARD_LIMIT)) {
        if (now - lastTrip < 1) { safeLen = Math.min(safeLen * 2, 64); safeUntil = now + safeLen; } else if (now - lastTrip > 20) safeLen = 2;
        lastTrip = now; stopAll(); return;
      }
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null;
    function chordNotes(n) { const c = CHORDS.find(x => x[0] === P.chord) || CHORDS[0]; let ns = c[2].map(i => n + i);
      if (P.spread >= 1 && ns.length >= 3) ns[1] += 12; if (P.spread >= 2) ns.unshift(n - 12); return ns; }
    function noteOn(n, vel, t, dur) { const ns = chordNotes(n), sc = 1 / Math.sqrt(ns.length); return ns.map(m => voiceOn(m, vel, t, dur, sc)); }
    const held = new Map();

    // ---------- UI ----------
    function knob(parent, label, [mn, mx, st], get, set, fmt, log) {
      const w = document.createElement('div'); w.className = 'k'; const l = document.createElement('label'), i = document.createElement('input'), o = document.createElement('output'); l.textContent = tx(label);
      i.type = 'range'; i.setAttribute('aria-label', tx(label));
      if (log) { i.min = 0; i.max = 1; i.step = 0.001; const to = x => mn * Math.pow(mx / mn, x), from = v => Math.log(v / mn) / Math.log(mx / mn); i.oninput = () => { set(to(+i.value)); o.textContent = fmt(get()); }; refreshers.push(() => { i.value = from(get()); o.textContent = fmt(get()); }); }
      else { i.min = mn; i.max = mx; i.step = st; i.oninput = () => { set(+i.value); o.textContent = fmt(get()); }; refreshers.push(() => { i.value = get(); o.textContent = fmt(get()); }); }
      w.append(l, i, o); parent.appendChild(w);
    }
    function choose(parent, label, opts, get, set) { const w = document.createElement('div'); w.className = 'k'; w.style.gridTemplateColumns = '86px minmax(0,1fr)'; const l = document.createElement('label'), s = document.createElement('select'); l.textContent = tx(label); s.setAttribute('aria-label', tx(label));
      opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = tx(t); s.appendChild(o); }); s.onchange = () => { set(s.value); refreshAll(); }; refreshers.push(() => { s.value = String(get()); }); w.append(l, s); parent.appendChild(w); }
    function box(parent, title, toggle) { const m = document.createElement('section'); m.className = 'mod'; const h = document.createElement('h3'); h.textContent = tx(title); m.appendChild(h);
      if (toggle) { const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.onchange = () => { toggle[1](c.checked); m.classList.toggle('off', !c.checked); }; refreshers.push(() => { c.checked = !!toggle[0](); m.classList.toggle('off', !c.checked); }); l.append(c, document.createTextNode(tx('aan'))); h.appendChild(l); }
      parent.appendChild(m); return m; }
    const refreshAll = () => refreshers.forEach(f => f());
    const pct = v => Math.round(v * 100) + '%', hz = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' kHz' : Math.round(v) + ' Hz', sec = v => v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
    function build() {
      const ps = document.createElement('div'); ps.className = 'ps'; root.appendChild(ps);
      const top = document.createElement('div'); top.className = 'top'; ps.appendChild(top);
      const pl = document.createElement('span'); pl.className = 'lab'; pl.textContent = 'Preset'; top.appendChild(pl);
      Object.keys(PRESETS).forEach(n => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { loadPreset(n); }; top.appendChild(b); });
      voiceInfo = document.createElement('span'); voiceInfo.className = 'voices'; voiceInfo.style.marginLeft = 'auto'; top.appendChild(voiceInfo);
      const g = document.createElement('div'); g.className = 'grid'; ps.appendChild(g);
      P.osc.forEach((o, i) => { const m = box(g, 'Oscillator ' + (i + 1), [() => P.osc[i].on, v => { P.osc[i].on = v; }]);
        choose(m, 'Type', OTYPES, () => P.osc[i].type, v => { P.osc[i].type = v; });
        choose(m, 'Octaaf', [[-3, '−3'], [-2, '−2'], [-1, '−1'], [0, '0'], [1, '+1'], [2, '+2']], () => P.osc[i].oct, v => { P.osc[i].oct = +v; });
        knob(m, 'Halve tonen', [-12, 12, 1], () => P.osc[i].semi, v => { P.osc[i].semi = v; }, v => (v > 0 ? '+' : '') + v);
        knob(m, 'Fijn', [-50, 50, 1], () => P.osc[i].fine, v => { P.osc[i].fine = v; }, v => (v > 0 ? '+' : '') + v + ' ct');
        knob(m, 'Niveau', [0, 1, 0.01], () => P.osc[i].lvl, v => { P.osc[i].lvl = v; }, pct);
        knob(m, 'Unison', [1, 7, 1], () => P.osc[i].uni, v => { P.osc[i].uni = v; }, v => v + '×');
        knob(m, 'Spreiding', [0, 60, 0.5], () => P.osc[i].det, v => { P.osc[i].det = v; }, v => v + ' ct');
        knob(m, 'Stereo', [0, 1, 0.01], () => P.osc[i].spread, v => { P.osc[i].spread = v; }, pct);
        knob(m, 'FM-ratio', [0.25, 12, 0.01], () => P.osc[i].fmr, v => { P.osc[i].fmr = v; }, v => '×' + v.toFixed(2));
        knob(m, 'FM-index', [0, 12, 0.01], () => P.osc[i].fmi, v => { P.osc[i].fmi = v; }, v => v.toFixed(2)); });
      const mx = box(g, 'Menging'); knob(mx, 'Ruis', [0, 1, 0.01], () => P.noise, v => { P.noise = v; }, pct); knob(mx, 'Ring 1×2', [0, 1, 0.01], () => P.ring, v => { P.ring = v; }, pct); knob(mx, 'FM 2→1', [0, 1, 0.01], () => P.fm21, v => { P.fm21 = v; }, pct);
      const sh = box(g, 'Shaper'); choose(sh, 'Vorm', STYPES, () => P.shp.type, v => { P.shp.type = v; }); knob(sh, 'Drive', [0, 1, 0.01], () => P.shp.drive, v => { P.shp.drive = v; }, pct);
      [['f1', 'Filter 1', null], ['f2', 'Filter 2', [() => P.f2on, v => { P.f2on = v; }]]].forEach(([k, t, tg]) => { const m = box(g, t, tg);
        choose(m, 'Type', FTYPES, () => P[k].type, v => { P[k].type = v; });
        knob(m, 'Cutoff', [40, 20000], () => P[k].cut, v => { P[k].cut = v; }, hz, true); knob(m, 'Reso', [0.3, 20, 0.1], () => P[k].res, v => { P[k].res = v; }, v => v.toFixed(1));
        knob(m, 'Env-diepte', [-1, 1, 0.01], () => P[k].env, v => { P[k].env = v; }, v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%'); knob(m, 'Toonvolgen', [0, 1, 0.01], () => P[k].kt, v => { P[k].kt = v; }, pct);
        if (k === 'f2') choose(m, 'Routing', [['serial', 'Serieel (1 → 2)'], ['parallel', 'Parallel']], () => P.route, v => { P.route = v; }); });
      [['Filter-envelope', 'f'], ['Amp-envelope', 'a']].forEach(([t, p]) => { const m = box(g, t);
        knob(m, 'Attack', [0.001, 8], () => P[p + 'a'], v => { P[p + 'a'] = v; }, sec, true); knob(m, 'Decay', [0.01, 8], () => P[p + 'd'], v => { P[p + 'd'] = v; }, sec, true);
        knob(m, 'Sustain', [0, 1, 0.01], () => P[p + 's'], v => { P[p + 's'] = v; }, pct); knob(m, 'Release', [0.01, 10], () => P[p + 'r'], v => { P[p + 'r'] = v; }, sec, true);
        if (p === 'a') knob(m, 'Aanslag', [0, 1, 0.01], () => P.vel, v => { P.vel = v; }, pct); });
      const vo = box(g, 'Stemmen & uitgang'); knob(vo, 'Stemmen', [1, 12, 1], () => P.poly, v => { P.poly = v; }, v => String(v));
      choose(vo, 'Akkoord', CHORDS.map(c => [c[0], c[1]]), () => P.chord, v => { P.chord = v; }); choose(vo, 'Ligging', [[0, 'Dicht'], [1, 'Open'], [2, 'Open + bas']], () => P.spread, v => { P.spread = +v; });
      knob(vo, 'Stemming', [-100, 100, 1], () => P.tune, v => { P.tune = v; }, v => (v > 0 ? '+' : '') + v + ' ct');
      knob(vo, 'Niveau', [0, 1, 0.01], () => P.lvl, v => { P.lvl = v; applyGlobal(); }, pct); knob(vo, 'Pan', [-1, 1, 0.01], () => P.pan, v => { P.pan = v; applyGlobal(); }, v => Math.abs(v) < 0.02 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100));
      // speelbaar klavier: twee octaven vanaf C3
      const kb = document.createElement('div'); kb.className = 'keys'; kb.setAttribute('aria-label', tx('klavier')); ps.appendChild(kb);
      for (let n = 48; n < 72; n++) { const b = document.createElement('button'), black = [1, 3, 6, 8, 10].includes(n % 12); b.className = black ? 'b' : ''; b.textContent = n % 12 === 0 ? 'C' + (Math.floor(n / 12) - 1) : ''; b.title = NOTE[n % 12] + (Math.floor(n / 12) - 1); b.setAttribute('aria-label', b.title);
        const on = e => { e.preventDefault(); b.classList.add('down'); held.set(n, noteOn(n, 0.85, ctx.currentTime, null)); };
        const off = () => { b.classList.remove('down'); const vs = held.get(n); if (vs) { vs.forEach(v => release(v, ctx.currentTime)); held.delete(n); } };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); kb.appendChild(b); }
      refreshAll();
    }
    function merge(base, over) { const o = JSON.parse(JSON.stringify(base)); Object.entries(over || {}).forEach(([k, v]) => { if (k === 'osc' && Array.isArray(v)) o.osc = o.osc.map((x, i) => ({ ...x, ...(v[i] || {}) })); else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object') o[k] = { ...o[k], ...v }; else o[k] = v; }); return o; }
    function loadPreset(n) { P = merge(DEF(), PRESETS[n]); if (n !== 'Init' && PRESETS[n].f2on === undefined) P.f2on = false; applyGlobal(); refreshAll(); }
    function sane(s) { s = s && typeof s === 'object' && !Array.isArray(s) ? s : {}; const d = DEF(), o = merge(d, s); const num = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : def);
      o.osc = d.osc.map((x, i) => { const y = { ...x, ...((s && s.osc && s.osc[i]) || {}) }; return { on: !!y.on, type: OTYPES.some(t => t[0] === y.type) ? y.type : x.type, oct: num(y.oct, -3, 2, x.oct) | 0, semi: num(y.semi, -12, 12, x.semi), fine: num(y.fine, -50, 50, x.fine), lvl: num(y.lvl, 0, 1, x.lvl), uni: num(y.uni, 1, 7, x.uni) | 0, det: num(y.det, 0, 60, x.det), spread: num(y.spread, 0, 1, x.spread), fmr: num(y.fmr, 0.25, 12, x.fmr), fmi: num(y.fmi, 0, 12, x.fmi) }; });
      ['f1', 'f2'].forEach(k => { const x = d[k], y = o[k] || {}; o[k] = { type: FTYPES.some(t => t[0] === y.type) ? y.type : x.type, cut: num(y.cut, 40, 20000, x.cut), res: num(y.res, 0.3, 20, x.res), env: num(y.env, -1, 1, x.env), kt: num(y.kt, 0, 1, x.kt) }; });
      o.shp = { type: STYPES.some(t => t[0] === (o.shp || {}).type) ? o.shp.type : d.shp.type, drive: num((o.shp || {}).drive, 0, 1, d.shp.drive) };
      ['noise', 'ring', 'fm21', 'fs', 'as', 'vel', 'lvl'].forEach(k => o[k] = num(o[k], 0, 1, d[k])); ['fa', 'aa'].forEach(k => o[k] = num(o[k], 0.001, 8, d[k])); ['fd', 'ad'].forEach(k => o[k] = num(o[k], 0.01, 8, d[k])); ['fr', 'ar'].forEach(k => o[k] = num(o[k], 0.01, 10, d[k]));
      o.poly = num(o.poly, 1, 12, d.poly) | 0; o.chord = CHORDS.some(c => c[0] === o.chord) ? o.chord : ''; o.spread = num(o.spread, 0, 2, 0) | 0; o.tune = num(o.tune, -100, 100, 0); o.pan = num(o.pan, -1, 1, 0); o.f2on = !!o.f2on; o.route = o.route === 'parallel' ? 'parallel' : 'serial';
      const r = {}; Object.keys(d).forEach(k => { r[k] = o[k]; }); return r; }

    return {
      inputs: {}, outputs: { out },
      mount(el) { const wrap = document.createElement('div'); el.appendChild(wrap); root = wrap.attachShadow({ mode: 'open' }); const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); build(); },
      unmount() { root = null; refreshers = []; voiceInfo = null; },
      onEvent(port, ev) { if (port !== 'notes' || !ev || ev.type !== 'note' || !Number.isFinite(ev.note)) return; const t = Number.isFinite(ev.time) ? ev.time : ctx.currentTime; noteOn(clamp(ev.note, 0, 127), Number.isFinite(ev.vel) ? ev.vel : 0.8, t, Number.isFinite(ev.dur) ? ev.dur : 0.25); },
      onTransport({ playing }) { if (!playing) { const t = ctx.currentTime; voices.forEach(v => { v.ar = Math.min(v.ar, 0.3); v.endAt = null; release(v, t); }); } },
      // contract v1.3/v1.4
      params() { return MODP.map(([id, name, min, max, log, role, drift, on, lane, fast]) => ({ id, name: tx(name), lane, laneName: tx(LANES[lane]), min, max, role, scale: log ? 'log' : 'lin', drift, on, fast: !!fast })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODBY[k] && Number.isFinite(o[k])) mod[k] = o[k]; const t = ctx.currentTime; Object.keys(ctl).forEach(k => ctl[k].offset.setTargetAtTime(mod[k] || 0, t, 0.04)); },
      modInput(id) { return FAST[id] !== undefined ? bus[id] : null; },
      getState() { return JSON.parse(JSON.stringify(P)); },
      setState(s) { P = sane(s); applyGlobal(); refreshAll(); },
      destroy() { if (dead) return; dead = true; clearInterval(ct); if (guardT) clearInterval(guardT); try { monKeep && monKeep.stop(); } catch (e) {} try { mon.disconnect(); } catch (e) {} const t = ctx.currentTime; voices.forEach(v => { v.srcs.forEach(s => { try { s.stop(); } catch (e) {} }); v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }); voices = [];
        Object.values(ctl).forEach(c => { try { c.stop(); } catch (e) {} }); try { out.disconnect(); } catch (e) {} },
    };
  }
};
