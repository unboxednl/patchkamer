// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Bijgewerkt naar Patchkamer contract v1.11 (id nl.patchkamer.drone en het geluid zijn ongewijzigd):
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Drone Synth
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard, ook in de sequencer
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
//   - bewaker tegen een ontspoord filter of delay-lus (NaN/Infinity blijft anders voor altijd hangen)
//   - de voorinstellingen bovenaan hebben Engelse namen
// Drone Synth: drie ontstemde oscillators + sub, tweede drone-laag op een interval, gekleurde ruis,
// resonant filter met trage LFO, vervorming, delay en galm, willekeurige gebeurtenissen en een
// 16-staps grondtoon-sequencer met 1–16 sets. Stuurbaar door een modulator in vijf sporen.

const NOISE = new WeakMap();
function noiseBuffer(ctx, type) {
  let m = NOISE.get(ctx); if (!m) { m = {}; NOISE.set(ctx, m); }
  if (m[type]) return m[type];
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'white') d[i] = w * 0.5;
    else if (type === 'pink') { b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
    else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  }
  return (m[type] = buf);
}
function impulse(ctx, sec) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * sec)), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2); }
  return buf;
}
function shapeCurve(k) { const n = 1024, c = new Float32Array(n), a = k * 60; for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = a > 0 ? ((1 + a) * x) / (1 + a * Math.abs(x)) : x; } return c; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pct = v => Math.round(v * 100) + '%';

// Nederlandse bron; Engels via host.lang
const EN = {
  'aan': 'on', 'Ruis': 'Noise', 'Grondtoon': 'Root', 'Golfvorm': 'Waveform', 'Zaagtand': 'Sawtooth', 'Blok': 'Square', 'Driehoek': 'Triangle', 'Sinus': 'Sine',
  'Stemming': 'Tuning', 'Ontstemming': 'Detune', 'Sub-octaaf': 'Sub octave', 'Niveau': 'Level', 'Kleur': 'Colour', 'Bruin': 'Brown', 'Roze': 'Pink', 'Wit': 'White',
  'Bandfilter': 'Band filter', 'Resonantie': 'Resonance', 'Afsnijfreq.': 'Cutoff', 'LFO snelheid': 'LFO rate', 'LFO diepte': 'LFO depth', 'Toonwobbel': 'Pitch wobble',
  'Vervorming': 'Distortion', 'Delaytijd': 'Delay time', 'Delay feedback': 'Delay feedback', 'Galmgrootte': 'Reverb size', 'Galm mix': 'Reverb mix',
  'Filter & LFO': 'Filter & LFO', 'Ruimte & verval': 'Space & decay', 'Uitgang': 'Output', 'Bij stop': 'On stop', 'stil': 'silent', 'blijft klinken': 'keeps sounding',
  'Gebeurtenissen': 'Events', 'Type': 'Type', 'Geen': 'None', 'Sirene': 'Siren', 'Metaalslag': 'Metal hit', 'Radiostatic': 'Radio static', 'Hartslag': 'Heartbeat',
  'Interval': 'Interval',  'Vuurt willekeurig rond het interval (±40%) zolang de klok loopt.': 'Fires at random around the interval (±40%) while the clock runs.',
  'Speel': 'Play', 'Grondtoon-sequencer': 'Root sequencer', 'Sets': 'Sets', 'Stijgend': 'Rising', 'Puls': 'Pulse', 'Willekeurig': 'Random', 'Kopieer maat naar alle': 'Copy bar to all', 'Leeg': 'Clear',
  '{0} stap {1}': '{0} step {1}',
  'Eén noot per stap; een lege stap houdt de vorige toon aan. Inkomende noten (oranje ingang) zetten ook de grondtoon.': 'One note per step; an empty step holds the previous pitch. Incoming notes (orange input) also set the root.',
  'Tweede drone': 'Second drone',
};

const NOTES = [['A1', 55], ['C2', 65.41], ['D2', 73.42], ['E♭2', 77.78], ['F2', 87.31], ['G2', 98], ['A2', 110], ['B♭2', 116.54]];
const MAXBARS = 16, STEPS = 16;
const DEFAULTS = {
  freq: 55, fine: 0, wave: 'sawtooth', detune: 9, sub: 0.5, dlevel: 0.6, droneOn: true,
  dbOn: false, dbWave: 'triangle', dbInt: 7, dbDet: 12, dbLvl: 0.4,
  noiseOn: true, ntype: 'brown', nfreq: 400, nq: 2, nlevel: 0.25,
  cut: 900, res: 4, lrate: 0.12, ldepth: 600, pitchmod: 4, drive: 0.2,
  dtime: 0.42, dfb: 0.45, rsize: 5, rmix: 0.55,
  evt: 'none', erate: 8, elevel: 0.5,
  seqOn: false, dbars: 4, glide: 0.08, gate: 0,
  lvl: 0.7, hold: false,
};
// geldige bereiken en keuzes voor setState (§13)
const RANGE = {
  freq: [20, 220], fine: [-100, 100], detune: [0, 60], sub: [0, 1], dlevel: [0, 1], dbInt: [-24, 24], dbDet: [0, 60], dbLvl: [0, 1],
  nfreq: [60, 8000], nq: [0.3, 18], nlevel: [0, 1], cut: [80, 12000], res: [0.3, 20], lrate: [0.02, 8], ldepth: [0, 4000], pitchmod: [0, 80], drive: [0, 1],
  dtime: [0.05, 1.5], dfb: [0, 0.95], rsize: [0.5, 10], rmix: [0, 1], erate: [1, 30], elevel: [0, 1], glide: [0, 1], gate: [0, 1], lvl: [0, 1],
};
const WAVES = ['sawtooth', 'square', 'triangle', 'sine'];
const CHOICES = { wave: WAVES, dbWave: WAVES, ntype: ['brown', 'pink', 'white'], evt: ['none', 'siren', 'impact', 'static', 'pulse'], dbars: [1, 2, 4, 8, 16] };
const PRESETS = {
  'Abandoned Factory': { freq: 41, wave: 'square', detune: 14, sub: 0.7, nfreq: 180, nq: 6, nlevel: 0.35, cut: 600, res: 7, lrate: 0.08, ldepth: 400, drive: 0.45, rsize: 8, rmix: 0.7, evt: 'impact', erate: 12 },
  'Ventilation Shaft': { freq: 49, wave: 'triangle', detune: 4, sub: 0.4, dlevel: 0.35, ntype: 'pink', nfreq: 900, nq: 10, nlevel: 0.6, cut: 1800, res: 3, lrate: 0.25, ldepth: 900, pitchmod: 2, drive: 0.05, dtime: 0.18, dfb: 0.3, rsize: 3, rmix: 0.4 },
  'Air Raid': { freq: 65, wave: 'sawtooth', detune: 22, sub: 0.3, nfreq: 2200, nq: 1.5, nlevel: 0.15, cut: 2400, res: 9, lrate: 0.5, ldepth: 1800, pitchmod: 12, drive: 0.3, rsize: 9, rmix: 0.75, evt: 'siren', erate: 14, elevel: 0.6 },
  'Dead Station': { freq: 110, wave: 'square', detune: 35, sub: 0.1, dlevel: 0.3, ntype: 'white', nfreq: 3400, nq: 4, nlevel: 0.4, cut: 4200, res: 2, lrate: 2.6, ldepth: 1200, pitchmod: 30, drive: 0.6, dtime: 0.09, dfb: 0.7, rsize: 1, rmix: 0.2, evt: 'static', erate: 4, elevel: 0.7 },
  'Underground': { freq: 33, wave: 'sine', detune: 6, sub: 1, dlevel: 0.8, ntype: 'brown', nfreq: 120, nq: 3, nlevel: 0.5, cut: 300, res: 5, lrate: 0.05, ldepth: 200, pitchmod: 3, drive: 0.15, dtime: 0.9, dfb: 0.6, rsize: 10, rmix: 0.8, evt: 'pulse', erate: 5, elevel: 0.5 },
  'Cold Dawn': { freq: 82, wave: 'triangle', detune: 3, sub: 0.3, dlevel: 0.5, ntype: 'pink', nfreq: 1400, nq: 0.8, nlevel: 0.2, cut: 3000, res: 1.2, lrate: 0.04, ldepth: 1500, pitchmod: 1, drive: 0, dtime: 0.75, dfb: 0.55, rsize: 9, rmix: 0.85 },
};

const CSS = `
:host{--d-panel:var(--card-2,#13161b);--d-panel-2:var(--field,#1a1e25);--d-line:var(--line,#2a303a);--d-fg:var(--fg,#d6d9de);--d-muted:var(--muted,#7d8591);--d-accent:#e0a84a;--d-ink:color-mix(in srgb,var(--d-accent) 72%,var(--d-fg));--d-accent-dim:color-mix(in srgb,var(--d-accent) 40%,var(--d-panel-2));--d-danger:var(--stop,#c9452f);--d-disp:'Oswald',system-ui,sans-serif;--d-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;display:block}
*{box-sizing:border-box}
.app{font-family:var(--d-mono);font-size:11px;line-height:1.4;color:var(--d-fg);display:grid;gap:8px}
.top{display:flex;flex-wrap:wrap;gap:4px}
button{font-family:var(--d-disp);font-size:11px;letter-spacing:.08em;text-transform:uppercase;background:transparent;color:var(--d-fg);border:1px solid var(--d-line);padding:4px 8px;cursor:pointer;border-radius:2px}
button:hover{border-color:var(--d-accent)} button:focus-visible{outline:1px solid var(--d-accent);outline-offset:2px}
button.on{border-color:var(--d-accent);color:var(--d-ink)}
.rack{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.seqhead{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 24px}
.mod{background:var(--d-panel);border:1px solid var(--d-line);padding:8px 10px;display:grid;gap:6px;align-content:start;min-width:0}
.mod.wide{grid-column:1/-1}
.mod h3{margin:0;font-family:var(--d-disp);font-weight:500;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--d-ink);display:flex;justify-content:space-between;align-items:center}
.mod h3 label{font-family:var(--d-mono);font-size:10px;letter-spacing:0;color:var(--d-muted);text-transform:none;display:flex;gap:4px;align-items:center;cursor:pointer}
.k{display:grid;grid-template-columns:86px minmax(0,1fr) 52px;gap:10px;align-items:center;min-width:0}
.k label{color:var(--d-muted);font-size:10px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{text-align:right;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;margin:0;appearance:none;height:18px;background:transparent;cursor:pointer;min-width:0}
input[type=range]::-webkit-slider-runnable-track{height:3px;background:var(--d-line)}
input[type=range]::-moz-range-track{height:3px;background:var(--d-line)}
input[type=range]::-webkit-slider-thumb{appearance:none;width:10px;height:15px;margin-top:-6px;background:var(--d-panel-2);border:1px solid var(--d-accent);border-radius:1px}
input[type=range]::-moz-range-thumb{width:9px;height:14px;background:var(--d-panel-2);border:1px solid var(--d-accent);border-radius:1px}
input[type=range]:focus-visible{outline:1px solid var(--d-accent);outline-offset:2px}
input[type=checkbox]{accent-color:var(--d-accent)}
select{background:var(--d-panel-2);color:var(--d-fg);border:1px solid var(--d-line);font-family:var(--d-mono);font-size:11px;padding:3px 5px;min-width:0}
.pads{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3px}
.pads button{padding:7px 0;font-family:var(--d-mono);letter-spacing:0}
.pads button.held{background:var(--d-accent-dim);border-color:var(--d-accent)}
.bars{display:flex;gap:3px;flex-wrap:wrap}
.bars button{font-family:var(--d-mono);font-size:10px;padding:2px 6px;letter-spacing:0;min-width:26px}
.bars button.edit{border-color:var(--d-accent);color:var(--d-ink)} .bars button.play{background:var(--d-accent-dim)}
.seq{overflow-x:auto}
table{border-collapse:separate;border-spacing:3px;width:100%;min-width:560px;table-layout:fixed}
th{font-weight:400;font-size:10px;color:var(--d-muted);text-align:right;padding-right:6px;white-space:nowrap;width:44px}
.st{width:100%;height:22px;border:1px solid var(--d-line);background:var(--d-panel-2);padding:0;cursor:pointer;border-radius:1px}
.st.q{background:var(--step-q,#20252d)} .st.on{background:var(--d-accent);border-color:var(--d-accent)} .st.cur{box-shadow:inset 0 0 0 2px var(--d-fg)}
.note{color:var(--d-muted);font-size:10px}
`;

// Stuurbare parameters (contract v1.3): id, naam, min, max, log, rol, bereik, aan, spoor
// Niet stuurbaar: grondtoon (die volgt de sequencer en noten) en galmgrootte (bouwt de galm opnieuw op).
const MODP = [
  ['fine', 'Stemming', -100, 100, false, 'pitch', 0.04, true, 'drone'], ['detune', 'Ontstemming', 0, 60, false, 'detune', 0.15, true, 'drone'], ['sub', 'Sub-octaaf', 0, 1, false, 'sub', 0.10, false, 'drone'], ['dlevel', 'Niveau', 0, 1, false, 'level', 0.06, false, 'drone'],
  ['dbDet', 'Ontstemming', 0, 60, false, 'detune', 0.15, false, 'drone2'], ['dbLvl', 'Niveau', 0, 1, false, 'level', 0.10, false, 'drone2'],
  ['nfreq', 'Bandfilter', 60, 8000, true, 'filter', 0.12, true, 'ruis'], ['nq', 'Resonantie', 0.3, 18, false, 'res', 0.10, false, 'ruis'], ['nlevel', 'Niveau', 0, 1, false, 'level', 0.10, false, 'ruis'],
  ['cut', 'Afsnijfreq.', 80, 12000, true, 'filter', 0.10, true, 'filter'], ['res', 'Resonantie', 0.3, 20, false, 'res', 0.10, true, 'filter'], ['lrate', 'LFO snelheid', 0.02, 8, true, 'rate', 0.12, false, 'filter'], ['ldepth', 'LFO diepte', 0, 4000, false, 'depth', 0.08, false, 'filter'], ['pitchmod', 'Toonwobbel', 0, 80, false, 'detune', 0.12, false, 'filter'],
  ['drive', 'Vervorming', 0, 1, false, 'drive', 0.10, false, 'ruimte'], ['dtime', 'Delaytijd', 0.05, 1.5, true, 'time', 0.03, false, 'ruimte'], ['dfb', 'Delay feedback', 0, 0.95, false, 'feedback', 0.10, true, 'ruimte'], ['rmix', 'Galm mix', 0, 1, false, 'send', 0.10, true, 'ruimte'], ['lvl', 'Niveau', 0, 1, false, 'level', 0.05, false, 'ruimte'],
];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const LANES = { drone: 'Drone', drone2: 'Tweede drone', ruis: 'Ruis', filter: 'Filter', ruimte: 'Ruimte' };
const LANES_EN = { drone: 'Drone', drone2: 'Second drone', ruis: 'Noise', filter: 'Filter', ruimte: 'Space' };

export default {
  id: 'nl.patchkamer.drone',
  name: 'Drone Synth',
  version: '1.11.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 1102, minWidth: 420 },
  ports: {
    audioIn: [],
    audioOut: [{ id: 'out', name: 'Out' }],
    eventIn: [{ id: 'notes', name: 'Notes' }, { id: 'cc', name: 'CC' }],
    eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }],
  },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const P = { ...DEFAULTS };
    let dgrid = Array.from({ length: MAXBARS }, () => new Array(STEPS).fill(-1));
    let playing = false, nextEvt = 0, editBar = 0, playBar = -1, root = null, refreshers = [], seqCells = [], barBtns = [], padBtns = [], gen = 0, dead = false;
    const t0 = ctx.currentTime;

    // ---------- graph ----------
    const out = ctx.createGain(), gate = ctx.createGain(); gate.gain.value = 0; gate.connect(out);
    const bus = ctx.createGain(), filter0 = ctx.createBiquadFilter(); filter0.type = 'lowpass';
    let filter = filter0;
    const shaper = ctx.createWaveShaper(); shaper.oversample = (host.audio && host.audio.oversample) || '2x';
    const dry = ctx.createGain(), mix = ctx.createGain(); mix.connect(gate);
    bus.connect(filter).connect(shaper); shaper.connect(dry).connect(mix);
    const dfb = ctx.createGain(), dsend = ctx.createGain(); dsend.gain.value = 0.35;
    let delay = ctx.createDelay(2), dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
    shaper.connect(dsend).connect(delay).connect(dlp).connect(dfb).connect(delay); dlp.connect(mix);
    let conv = ctx.createConvolver(); const wet = ctx.createGain(); shaper.connect(conv).connect(wet).connect(mix); dlp.connect(conv);
    const dgain = ctx.createGain(); dgain.connect(bus);
    const oscs = [-1, 0, 1].map(k => { const o = ctx.createOscillator(); o._k = k; o.connect(dgain); o.start(t0); return o; });
    const subg = ctx.createGain(), subo = ctx.createOscillator(); subo.type = 'sine'; subo.connect(subg).connect(bus); subo.start(t0);
    const dbg = ctx.createGain(); dbg.connect(bus);
    const oscB = [-1, 1].map(k => { const o = ctx.createOscillator(); o._k = k; o.connect(dbg); o.start(t0); return o; });
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.type = 'sine'; lfo.connect(lfoG).connect(filter.frequency); lfo.start(t0);
    const lfo2 = ctx.createOscillator(), lfo2G = ctx.createGain(); lfo2.frequency.value = 0.07; lfo2.connect(lfo2G); oscs.forEach(o => lfo2G.connect(o.detune)); lfo2.start(t0);
    const nfilt = ctx.createBiquadFilter(), ngain = ctx.createGain(); nfilt.type = 'bandpass'; nfilt.connect(ngain).connect(bus);
    let noise = null, noiseType = null, rsizeNow = 0;
    const live = new Set();   // one-shot sources for events, stopped in destroy

    // bewaker: een instabiel filter of een delay-lus met NaN/Infinity herstelt nooit meer en vergiftigt alles erachter (ook de galm).
    // We kijken naar de ruwe filteruitvoer (vóór de vervormer, die een ontsporing verbergt) en naar de delay-lus.
    const mon = ctx.createAnalyser(); mon.fftSize = 256; filter.connect(mon);
    const monD = ctx.createAnalyser(); monD.fftSize = 256; dlp.connect(monD);
    const chk = new Float32Array(256); let rebuilt = 0;
    function rebuild() {
      rebuilt++;
      try { bus.disconnect(filter); } catch (e) {}
      [filter, delay, dlp, dsend, dfb].forEach(n => { try { n.disconnect(); } catch (e) {} });
      try { lfoG.disconnect(); } catch (e) {}
      { const cb = conv.buffer; try { shaper.disconnect(conv); } catch (e) {} try { conv.disconnect(); } catch (e) {} conv = ctx.createConvolver(); if (cb) conv.buffer = cb; shaper.connect(conv).connect(wet); }
      filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; bus.connect(filter).connect(shaper); lfoG.connect(filter.frequency); filter.connect(mon);
      delay = ctx.createDelay(2); dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
      shaper.connect(dsend).connect(delay).connect(dlp).connect(dfb).connect(delay); dlp.connect(mix); dlp.connect(conv); dlp.connect(monD);
      apply();
    }
    function guard() {
      if (dead) return;
      for (const an of [mon, monD]) { an.getFloatTimeDomainData(chk); for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) { rebuild(); return; } }
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    function setNoise(type) {
      if (noiseType === type && noise) return;
      if (noise) { try { noise.stop(); } catch (e) {} noise.disconnect(); }
      noise = ctx.createBufferSource(); noise.buffer = noiseBuffer(ctx, type); noise.loop = true; noise.connect(nfilt); noise.start(); noiseType = type;
    }
    // knopstand + modulatie (contract v1.3)
    const modOff = {};
    const E = k => { const m = MODBY[k], b = +P[k], o = modOff[k] || 0; if (!m || !o) return b; const [, , mn, mx, log] = m; return log ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    let curveNow = -1; const setDrive = v => { const q = Math.round(v * 200) / 200; if (q !== curveNow) { shaper.curve = shapeCurve(q); curveNow = q; } };
    // alleen wat modulatie raakt; laat toonhoogte en gate (sequencer) met rust
    function applyMod() {
      const t = ctx.currentTime, r = 0.08, set = (p, v) => p.setTargetAtTime(v, t, r), fine = E('fine');
      oscs.forEach(o => set(o.detune, o._k * E('detune') + fine)); set(subo.detune, fine); oscB.forEach(o => set(o.detune, o._k * E('dbDet') + fine));
      set(subg.gain, P.droneOn ? E('sub') * 0.5 : 0); if (!(P.gate > 0)) set(dgain.gain, P.droneOn ? E('dlevel') * 0.28 : 0); set(dbg.gain, P.droneOn && P.dbOn ? E('dbLvl') * 0.25 : 0);
      set(nfilt.frequency, E('nfreq')); set(nfilt.Q, E('nq')); set(ngain.gain, P.noiseOn ? E('nlevel') * 0.9 : 0);
      const cut = E('cut'); set(filter.frequency, cut); set(filter.Q, E('res')); set(lfo.frequency, E('lrate')); set(lfoG.gain, Math.max(0, Math.min(E('ldepth'), cut - 60))); set(lfo2G.gain, E('pitchmod'));
      setDrive(E('drive')); const rm = E('rmix'); set(dry.gain, 1 - rm * 0.6); set(delay.delayTime, E('dtime')); set(dfb.gain, E('dfb')); set(wet.gain, rm * 1.4); set(out.gain, E('lvl'));
    }
    function apply() {
      const t = ctx.currentTime, r = 0.05, ramp = (p, v) => { p.cancelScheduledValues(t); p.setTargetAtTime(v, t, r); };
      const fine = E('fine'), cut = E('cut'), rm = E('rmix');
      oscs.forEach(o => { o.type = P.wave; ramp(o.frequency, P.freq); ramp(o.detune, o._k * E('detune') + fine); });
      ramp(subo.frequency, P.freq / 2); ramp(subo.detune, fine); ramp(subg.gain, P.droneOn ? E('sub') * 0.5 : 0); ramp(dgain.gain, P.droneOn ? E('dlevel') * 0.28 : 0);
      oscB.forEach(o => { o.type = P.dbWave; ramp(o.frequency, P.freq * Math.pow(2, P.dbInt / 12)); ramp(o.detune, o._k * E('dbDet') + fine); });
      ramp(dbg.gain, P.droneOn && P.dbOn ? E('dbLvl') * 0.25 : 0);
      setNoise(P.ntype); ramp(nfilt.frequency, E('nfreq')); ramp(nfilt.Q, E('nq')); ramp(ngain.gain, P.noiseOn ? E('nlevel') * 0.9 : 0);
      ramp(filter.frequency, cut); ramp(filter.Q, E('res'));
      ramp(lfo.frequency, E('lrate')); ramp(lfoG.gain, Math.max(0, Math.min(E('ldepth'), cut - 60))); ramp(lfo2G.gain, E('pitchmod'));
      setDrive(E('drive')); ramp(dry.gain, 1 - rm * 0.6);
      ramp(delay.delayTime, E('dtime')); ramp(dfb.gain, E('dfb'));
      if (Math.abs(rsizeNow - P.rsize) > 0.05) { conv.buffer = impulse(ctx, P.rsize); rsizeNow = P.rsize; }
      ramp(wet.gain, rm * 1.4); ramp(out.gain, E('lvl'));
      if (!playing) ramp(gate.gain, P.hold ? 1 : 0);
    }
    apply();

    // ---------- events ----------
    function track(n, stopAt) { live.add(n); n.onended = () => live.delete(n); n.stop(stopAt); }
    function noiseSrc(type) { const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx, type); s.loop = true; return s; }
    function fire(kind, t) {
      const lv = P.elevel;
      if (kind === 'siren') {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
        o.frequency.setValueAtTime(380, t); o.frequency.linearRampToValueAtTime(620, t + 1.6); o.frequency.linearRampToValueAtTime(380, t + 3.2); o.frequency.linearRampToValueAtTime(600, t + 4.8);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv * 0.18, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 5.5);
        o.connect(g).connect(bus); o.start(t); track(o, t + 5.6);
      } else if (kind === 'impact') {
        const o = ctx.createOscillator(), g = ctx.createGain(), n = noiseSrc('white'), ng = ctx.createGain(), bp = ctx.createBiquadFilter();
        o.type = 'square'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(28, t + 0.5);
        g.gain.setValueAtTime(lv * 0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        bp.type = 'bandpass'; bp.frequency.value = 2400 + Math.random() * 2000; bp.Q.value = 12;
        ng.gain.setValueAtTime(lv * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
        o.connect(g).connect(bus); n.connect(bp).connect(ng).connect(bus); o.start(t); track(o, t + 1.3); n.start(t); track(n, t + 2.6);
      } else if (kind === 'static') {
        const n = noiseSrc('white'), g = ctx.createGain(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
        g.gain.setValueAtTime(0, t); const dur = 0.4 + Math.random() * 1.5;
        for (let x = 0; x < dur; x += 0.05) g.gain.setValueAtTime(Math.random() < 0.5 ? 0 : lv * 0.35, t + x);
        g.gain.setValueAtTime(0, t + dur); n.connect(hp).connect(g).connect(bus); n.start(t); track(n, t + dur + 0.1);
      } else if (kind === 'pulse') {
        [0, 0.32].forEach(d => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
          o.frequency.setValueAtTime(70, t + d); o.frequency.exponentialRampToValueAtTime(35, t + d + 0.25);
          g.gain.setValueAtTime(lv * 0.8, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.3);
          o.connect(g).connect(mix); o.start(t + d); track(o, t + d + 0.35); });
      }
    }

    // ---------- pitch ----------
    function setPitch(f, t, tc) {
      oscs.forEach(o => { o.frequency.cancelScheduledValues(t); o.frequency.setTargetAtTime(f, t, tc); });
      subo.frequency.cancelScheduledValues(t); subo.frequency.setTargetAtTime(f / 2, t, tc);
      oscB.forEach(o => { o.frequency.cancelScheduledValues(t); o.frequency.setTargetAtTime(f * Math.pow(2, P.dbInt / 12), t, tc); });
      const g = gen;
      setTimeout(() => { if (dead || g !== gen) return; P.freq = f; refreshAll(); }, Math.max(0, (t - ctx.currentTime) * 1000));
    }

    // ---------- UI ----------
    const fmt = {
      freq: v => (+v).toFixed(1).replace(/\.0$/, '') + ' Hz', fine: v => (v > 0 ? '+' : '') + Math.round(v) + ' ct', detune: v => v + ' ct', sub: pct, dlevel: pct, dbInt: v => (v > 0 ? '+' : '') + v + ' st', dbDet: v => v + ' ct', dbLvl: pct,
      nfreq: v => v + ' Hz', nq: v => (+v).toFixed(1), nlevel: pct, cut: v => v + ' Hz', res: v => (+v).toFixed(1), lrate: v => (+v).toFixed(2) + ' Hz', ldepth: v => v + ' Hz', pitchmod: v => v + ' ct',
      drive: pct, dtime: v => (+v).toFixed(2) + ' s', dfb: pct, rsize: v => (+v).toFixed(1) + ' s', rmix: pct, erate: v => v + ' s', elevel: pct, glide: v => (+v).toFixed(2) + ' s', gate: pct, lvl: pct,
    };
    function knob(parent, key, label, [mn, mx, st]) {
      const w = document.createElement('div'); w.className = 'k';
      const l = document.createElement('label'), i = document.createElement('input'), o = document.createElement('output');
      const id = 'k-' + key; l.textContent = tx(label); l.htmlFor = id; i.id = id; i.type = 'range'; i.min = mn; i.max = mx; i.step = st; i.dataset.pkDefault = String(DEFAULTS[key]);
      i.oninput = () => { P[key] = +i.value; o.textContent = fmt[key](P[key]); apply(); };
      w.append(l, i, o); parent.appendChild(w);
      refreshers.push(() => { i.value = P[key]; o.textContent = fmt[key](P[key]); });
    }
    function choose(parent, key, label, opts, num) {
      const w = document.createElement('div'); w.className = 'k'; w.style.gridTemplateColumns = '86px minmax(0,1fr)';
      const l = document.createElement('label'), s = document.createElement('select'); const id = 's-' + key; l.textContent = tx(label); l.htmlFor = id; s.id = id;
      opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = tx(t); s.appendChild(o); });
      s.onchange = () => { P[key] = num ? +s.value : s.value; apply(); if (key === 'dbars') paintSeq(); };
      w.append(l, s); parent.appendChild(w); refreshers.push(() => { s.value = P[key]; });
    }
    function toggle(h3, key, label) {
      const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.onchange = () => { P[key] = c.checked; apply(); if (key === 'seqOn') paintSeq(); };
      l.append(c, document.createTextNode(tx(label))); h3.appendChild(l); refreshers.push(() => { c.checked = !!P[key]; });
    }
    function mod(page, title, wide) { const m = document.createElement('section'); m.className = 'mod' + (wide ? ' wide' : ''); const h = document.createElement('h3'); h.textContent = tx(title); m.appendChild(h); page.appendChild(m); return [m, h]; }
    function refreshAll() { refreshers.forEach(f => f()); }

    function paintSeq() {
      if (!root) return; const nb = +P.dbars;
      barBtns.forEach((b, i) => { b.hidden = i >= nb; b.classList.toggle('edit', i === editBar); b.classList.toggle('play', i === playBar); });
      if (editBar >= nb) { editBar = 0; return paintSeq(); }
      seqCells.forEach((row, ni) => row.forEach((b, s) => b.classList.toggle('on', dgrid[editBar][s] === ni)));
    }
    function cursor(s) { seqCells.forEach(row => row.forEach((b, i) => b.classList.toggle('cur', i === s))); }

    const inst = {
      inputs: {}, outputs: { out },
      mount(el) {
        refreshers = []; seqCells = []; barBtns = []; padBtns = [];
        const wrap = document.createElement('div'); el.appendChild(wrap);
        root = wrap.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>${CSS}</style>`;
        const app = document.createElement('div'); app.className = 'app'; root.appendChild(app);
        // voorinstellingen (namen zijn Engels in alle talen)
        const top = document.createElement('div'); top.className = 'top'; app.appendChild(top);
        Object.keys(PRESETS).forEach(n => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { Object.assign(P, DEFAULTS, PRESETS[n], { lvl: P.lvl, seqOn: P.seqOn, dbars: P.dbars, hold: P.hold }); apply(); refreshAll(); }; top.appendChild(b); });
        const rnd = document.createElement('button'); rnd.textContent = tx('Willekeurig'); top.appendChild(rnd);
        rnd.onclick = () => { const r = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
          Object.assign(P, { freq: r(28, 120), wave: pick(['sawtooth', 'square', 'triangle', 'sine']), detune: r(0, 40), sub: r(0, 1), dlevel: r(0.3, 0.8), ntype: pick(['brown', 'pink', 'white']), nfreq: r(80, 4000), nq: r(0.5, 14), nlevel: r(0.05, 0.6), cut: r(200, 5000), res: r(0.5, 14), lrate: r(0.03, 3), ldepth: r(100, 2500), pitchmod: r(0, 40), drive: r(0, 0.7), dtime: r(0.08, 1.2), dfb: r(0.2, 0.85), rsize: r(1, 10), rmix: r(0.2, 0.9), evt: pick(['none', 'siren', 'impact', 'static', 'pulse']), erate: r(3, 20), elevel: r(0.3, 0.8) });
          apply(); refreshAll(); };
        const rack = document.createElement('div'); rack.className = 'rack'; app.appendChild(rack);
        // Bron
        let [m, h] = mod(rack, 'Drone'); toggle(h, 'droneOn', 'aan');
        knob(m, 'freq', 'Grondtoon', [20, 220, 0.5]); choose(m, 'wave', 'Golfvorm', [['sawtooth', 'Zaagtand'], ['square', 'Blok'], ['triangle', 'Driehoek'], ['sine', 'Sinus']]);
        knob(m, 'fine', 'Stemming', [-100, 100, 1]); knob(m, 'detune', 'Ontstemming', [0, 60, 0.5]); knob(m, 'sub', 'Sub-octaaf', [0, 1, 0.01]); knob(m, 'dlevel', 'Niveau', [0, 1, 0.01]);
        [m, h] = mod(rack, 'Drone B'); toggle(h, 'dbOn', 'aan');
        choose(m, 'dbWave', 'Golfvorm', [['triangle', 'Driehoek'], ['sawtooth', 'Zaagtand'], ['square', 'Blok'], ['sine', 'Sinus']]);
        knob(m, 'dbInt', 'Interval', [-24, 24, 1]); knob(m, 'dbDet', 'Ontstemming', [0, 60, 0.5]); knob(m, 'dbLvl', 'Niveau', [0, 1, 0.01]);
        [m, h] = mod(rack, 'Ruis'); toggle(h, 'noiseOn', 'aan');
        choose(m, 'ntype', 'Kleur', [['brown', 'Bruin'], ['pink', 'Roze'], ['white', 'Wit']]);
        knob(m, 'nfreq', 'Bandfilter', [60, 8000, 1]); knob(m, 'nq', 'Resonantie', [0.3, 18, 0.1]); knob(m, 'nlevel', 'Niveau', [0, 1, 0.01]);
        // Filter
        [m] = mod(rack, 'Filter & LFO');
        knob(m, 'cut', 'Afsnijfreq.', [80, 12000, 1]); knob(m, 'res', 'Resonantie', [0.3, 20, 0.1]);
        knob(m, 'lrate', 'LFO snelheid', [0.02, 8, 0.01]); knob(m, 'ldepth', 'LFO diepte', [0, 4000, 1]); knob(m, 'pitchmod', 'Toonwobbel', [0, 80, 0.5]);
        // Ruimte
        [m] = mod(rack, 'Ruimte & verval');
        knob(m, 'drive', 'Vervorming', [0, 1, 0.01]); knob(m, 'dtime', 'Delaytijd', [0.05, 1.5, 0.01]); knob(m, 'dfb', 'Delay feedback', [0, 0.95, 0.01]);
        knob(m, 'rsize', 'Galmgrootte', [0.5, 10, 0.1]); knob(m, 'rmix', 'Galm mix', [0, 1, 0.01]);
        [m, h] = mod(rack, 'Uitgang'); knob(m, 'lvl', 'Niveau', [0, 1, 0.01]);
        const hl = document.createElement('div'); hl.className = 'k'; hl.style.gridTemplateColumns = '86px minmax(0,1fr)'; const hll = document.createElement('label'); hll.textContent = tx('Bij stop'); const hs = document.createElement('select'); hs.id = 's-hold';
        [['0', 'stil'], ['1', 'blijft klinken']].forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = tx(t); hs.appendChild(o); }); hll.htmlFor = 's-hold';
        hs.onchange = () => { P.hold = hs.value === '1'; apply(); }; refreshers.push(() => { hs.value = P.hold ? '1' : '0'; }); hl.append(hll, hs); m.appendChild(hl);
        // Gebeurtenissen
        [m] = mod(rack, 'Gebeurtenissen');
        choose(m, 'evt', 'Type', [['none', 'Geen'], ['siren', 'Sirene'], ['impact', 'Metaalslag'], ['static', 'Radiostatic'], ['pulse', 'Hartslag']]);
        knob(m, 'erate', 'Interval', [1, 30, 0.5]); knob(m, 'elevel', 'Niveau', [0, 1, 0.01]);
        const en = document.createElement('div'); en.className = 'note'; en.textContent = tx('Vuurt willekeurig rond het interval (±40%) zolang de klok loopt.'); m.appendChild(en);
        // Sequencer
        [m] = mod(rack, 'Speel');
        const pads = document.createElement('div'); pads.className = 'pads'; m.appendChild(pads);
        NOTES.forEach(([n, f]) => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { setPitch(f, ctx.currentTime, Math.max(0.005, P.glide / 3)); b.classList.add('held'); setTimeout(() => b.classList.remove('held'), 250); }; pads.appendChild(b); padBtns.push(b); });
        [m, h] = mod(rack, 'Grondtoon-sequencer', true); toggle(h, 'seqOn', 'aan');
        const sh = document.createElement('div'); sh.className = 'seqhead'; m.appendChild(sh);
        choose(sh, 'dbars', 'Sets', [[1, '1 × 16'], [2, '2 × 16'], [4, '4 × 16'], [8, '8 × 16'], [16, '16 × 16']], true);
        knob(sh, 'glide', 'Glide', [0, 1, 0.01]); knob(sh, 'gate', 'Gate', [0, 1, 0.01]);
        const bars = document.createElement('div'); bars.className = 'bars'; m.appendChild(bars);
        for (let b = 0; b < MAXBARS; b++) { const bt = document.createElement('button'); bt.textContent = b + 1; bt.onclick = () => { editBar = b; paintSeq(); }; bars.appendChild(bt); barBtns.push(bt); }
        const sw = document.createElement('div'); sw.className = 'seq'; const tb = document.createElement('table'); sw.appendChild(tb); m.appendChild(sw);
        [...NOTES].reverse().forEach(([n], ri) => { const ni = NOTES.length - 1 - ri, tr = document.createElement('tr'), th = document.createElement('th'); th.textContent = n; tr.appendChild(th); seqCells[ni] = [];
          for (let s = 0; s < STEPS; s++) { const td = document.createElement('td'), b = document.createElement('button'); b.className = 'st' + (s % 4 === 0 ? ' q' : ''); b.setAttribute('aria-label', tx('{0} stap {1}', n, s + 1));
            b.onclick = () => { dgrid[editBar][s] = dgrid[editBar][s] === ni ? -1 : ni; paintSeq(); }; td.appendChild(b); tr.appendChild(td); seqCells[ni][s] = b; }
          tb.appendChild(tr); });
        const pr = document.createElement('div'); pr.className = 'top'; m.appendChild(pr);
        [['Stijgend', () => { for (let b = 0; b < MAXBARS; b++) for (let s = 0; s < STEPS; s++) dgrid[b][s] = s % 4 === 0 ? (b + (s >> 2)) % NOTES.length : -1; }],
         ['Puls', () => { for (let b = 0; b < MAXBARS; b++) for (let s = 0; s < STEPS; s++) dgrid[b][s] = s % 2 === 0 ? (s % 8 === 0 ? 0 : (b % 2 ? 6 : 3)) : -1; }],
         ['Willekeurig', () => { for (let b = 0; b < MAXBARS; b++) for (let s = 0; s < STEPS; s++) dgrid[b][s] = Math.random() < 0.35 ? Math.floor(Math.random() * NOTES.length) : -1; }],
         ['Kopieer maat naar alle', () => { for (let b = 0; b < MAXBARS; b++) if (b !== editBar) dgrid[b] = dgrid[editBar].slice(); }],
         ['Leeg', () => { dgrid = Array.from({ length: MAXBARS }, () => new Array(STEPS).fill(-1)); }]]
          .forEach(([n, f]) => { const b = document.createElement('button'); b.textContent = tx(n); b.onclick = () => { f(); paintSeq(); }; pr.appendChild(b); });
        const sn = document.createElement('div'); sn.className = 'note'; sn.textContent = tx('Eén noot per stap; een lege stap houdt de vorige toon aan. Inkomende noten (oranje ingang) zetten ook de grondtoon.'); m.appendChild(sn);
        refreshAll(); paintSeq();
      },
      unmount() { root = null; },
      onStep({ step, bar, time, stepDur }) {
        try {
          if (P.seqOn) {
            const b = bar % (+P.dbars), ni = dgrid[b][step];
            if (ni >= 0) {
              setPitch(NOTES[ni][1], time, Math.max(0.005, P.glide / 3));
              if (P.gate > 0 && P.droneOn) { dgain.gain.cancelScheduledValues(time); dgain.gain.setTargetAtTime(E('dlevel') * 0.28, time, 0.01); }
            } else if (P.gate > 0 && P.droneOn) { dgain.gain.cancelScheduledValues(time); dgain.gain.setTargetAtTime(E('dlevel') * 0.28 * (1 - P.gate), time, 0.03); }
            if (step === 0) setTimeout(() => { playBar = b; paintSeq(); }, Math.max(0, (time - ctx.currentTime) * 1000));
          }
          if (P.evt !== 'none' && playing) {
            if (!nextEvt) nextEvt = time + P.erate * 0.5;
            if (time >= nextEvt) { fire(P.evt, time); nextEvt = time + P.erate * (0.6 + Math.random() * 0.8); }
          }
          if (root) setTimeout(() => cursor(step), Math.max(0, (time - ctx.currentTime) * 1000));
        } catch (e) { console.warn('Drone Synth', e); }
      },
      onTransport({ playing: p }) {
        playing = p; nextEvt = 0; const t = ctx.currentTime;
        gate.gain.cancelScheduledValues(t); gate.gain.setTargetAtTime(p || P.hold ? 1 : 0, t, p ? 0.15 : 0.3);
        if (!p) { playBar = -1; cursor(-1); paintSeq(); }
      },
      onEvent(port, ev) {
        try {
          if (port === 'notes' && ev.type === 'note') { if (Number.isFinite(+ev.note)) setPitch(440 * Math.pow(2, (ev.note - 69) / 12), ev.time ?? ctx.currentTime, Math.max(0.005, P.glide / 3)); }
          if (port === 'cc' && ev.type === 'cc') {
            const v = clamp(+ev.value || 0, 0, 1);
            if (ev.id === 'cutoff') P.cut = Math.round(80 * Math.pow(150, v));
            else if (ev.id === 'res') P.res = 0.3 + v * 19.7;
            else if (ev.id === 'drive') P.drive = v;
            else if (ev.id === 'level') P.lvl = v;
            else if (ev.id === 'reverb') P.rmix = v;
            else return;
            apply(); refreshAll();
          }
        } catch (e) { console.warn('Drone Synth', e); }
      },
      // contract v1.3 — vijf sporen: Drone, Tweede drone, Ruis, Filter, Ruimte
      params() { const ln = host.lang === 'nl' ? LANES : LANES_EN; return MODP.map(([id, name, min, max, log, role, drift, on, lane]) => ({ id, name: tx(name), lane, laneName: ln[lane], min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(offsets) { for (const k in modOff) delete modOff[k]; for (const k in offsets || {}) if (MODBY[k] && Number.isFinite(+offsets[k])) modOff[k] = +offsets[k]; applyMod(); },
      getState() { return { ...P, dgrid: dgrid.map(r => r.slice()) }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        gen++;
        Object.keys(DEFAULTS).forEach(k => {
          const v = s[k];
          if (RANGE[k]) P[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, RANGE[k][0], RANGE[k][1]) : DEFAULTS[k];
          else if (CHOICES[k]) P[k] = CHOICES[k].includes(v) ? v : DEFAULTS[k];
          else P[k] = typeof v === 'boolean' ? v : DEFAULTS[k];
        });
        dgrid = Array.from({ length: MAXBARS }, (_, b) => {
          const row = new Array(STEPS).fill(-1), g = Array.isArray(s.dgrid) ? s.dgrid[b] : null;
          if (Array.isArray(g)) for (let i = 0; i < STEPS; i++) { const x = Math.round(+g[i]); if (g[i] !== null && g[i] !== '' && Number.isFinite(x)) row[i] = clamp(x, -1, NOTES.length - 1); }
          return row;
        });
        apply(); refreshAll(); paintSeq();
      },
      destroy() {
        dead = true; if (guardT) clearInterval(guardT);
        [...oscs, subo, ...oscB, lfo, lfo2].forEach(o => { try { o.stop(); } catch (e) {} });
        if (noise) { try { noise.stop(); } catch (e) {} noise = null; }
        live.forEach(n => { try { n.stop(); } catch (e) {} }); live.clear();
        try { mon.disconnect(); monD.disconnect(); } catch (e) {}
        try { out.disconnect(); bus.disconnect(); } catch (e) {}
      },
    };
    return inst;
  },
};
