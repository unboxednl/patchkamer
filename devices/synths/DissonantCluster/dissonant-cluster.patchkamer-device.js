// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Nieuw als Dissonant Cluster (nieuwe id nl.patchkamer.dissonantcluster, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen van apparaat en poorten per taal in i18n); namen van de ingebouwde startklanken zijn Engels
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard; de knoppen volgen setState
//   - kleuren uit de CSS-variabelen van de host, tekenen via host.frame met een ResizeObserver en een kleurcache
//   - bewaker tegen een ontspoord filter (Infinity, daarna NaN): een meter kijkt naar de ruwe filteruitvoer en ruimt klinkende noten op; ingangen (noot, snelheid, duur, modulatie) worden gecontroleerd
//   - dubbelklik op een schuif zet hem terug op de beginwaarde
// Een synth die alleen dissonant klinkt. Elke noot wordt een cluster van 2–6 stemmen in een dissonante structuur;
// een consonantiebewaker houdt elk paar tonen (binnen een noot én tussen noten die tegelijk klinken) weg van
// priem/octaaf, kwint, kwart, tertsen en sexten. Klankbronnen zonder harmonische verhoudingen: zweving, FM en
// ringmodulatie op onmeetbare verhoudingen (√2, φ, π/2…), metaal en ruis; wrijving (snelle amplitude-ruwheid),
// uiteendrijvende stemmen, filter met envelope, shaper. Een dissonantiekaart en ruwheidsmeter rekenen met het
// psychoakoestische model van Plomp en Levelt in de vorm van Sethares. Stuurbaar en deels snel stuurbaar.
// Achtergrond: in de 12-toonsstemming kunnen hooguit drie tonen onderling allemaal dissonant zijn (bv. C–C♯–D), en
// een tritonus past in geen enkele zulke drieklank. Daarom gebruiken de structuren met meer stemmen tussentonen.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CONS = [0, 300, 400, 500, 700, 800, 900, 1200];   // consonante intervallen (cent, binnen het octaaf)
const consDist = iv => { const m = ((Math.abs(iv) % 1200) + 1200) % 1200; let best = 1e9, sgn = 1; for (const c of CONS) { const d = m - c; if (Math.abs(d) < best) { best = Math.abs(d); sgn = d >= 0 ? 1 : -1; } } return { d: best, sgn: iv >= 0 ? sgn : -sgn }; };
// structuren (cent boven de grondtoon), per aantal stemmen; gevonden met een zoekscript op het Sethares-model
const STRUCT = [
  ['cloud', 'Secundewolk (smal)', { 2: [0, 75], 3: [0, 75, 150], 4: [0, 75, 125, 200], 5: [0, 50, 100, 150, 200], 6: [0, 50, 100, 150, 200, 250] }],
  ['chrom', 'Chromatisch cluster (12-toons)', { 2: [0, 100], 3: [0, 100, 200], 4: [0, 100, 200, 300], 5: [0, 100, 200, 300, 400], 6: [0, 100, 200, 300, 400, 500] }],
  ['wide', 'Wijde spanning', { 2: [0, 1300], 3: [0, 1300, 3500], 4: [0, 1125, 2175, 2250], 5: [0, 650, 1650, 2500, 2950], 6: [0, 650, 1650, 2500, 2600, 2950] }],
  ['trit', 'Tritonus-kruis (max. 5)', { 2: [0, 600], 3: [0, 600, 2250], 4: [0, 600, 2250, 2450], 5: [0, 600, 1150, 2250, 2450] }],   // met een tritonus bestaat geen zestonige ligging die overal ≥35¢ van consonant blijft
  ['sept', 'Septiem en none', { 2: [0, 1100], 3: [0, 1100, 2200], 4: [0, 1100, 2250, 2450], 5: [0, 1100, 2250, 2450, 2500], 6: [0, 1100, 1150, 2250, 2450, 2500] }],
  ['x13', '13-toons (xenharmonisch)', { 2: [0, 1015], 3: [0, 1015, 2308], 4: [0, 1015, 2308, 2954], 5: [0, 1846, 2492, 2954, 3138], 6: [0, 646, 1385, 1938, 2492, 2954] }],
  ['random', 'Toeval (elke noot anders)', null],
];
const RATIOS = [['1.41421', '√2'], ['1.73205', '√3'], ['1.61803', 'φ (gulden snede)'], ['1.5708', 'π/2'], ['1.35914', 'e/2'], ['2.23607', '√5'], ['2.71828', 'e'], ['3.14159', 'π']];
const METAL = [1, 1.41421, 1.73205, 2.23607, 2.64575, 3.16228];   // √1…√10: onderling onmeetbaar
const WAVES = [['sawtooth', 'Zaag'], ['square', 'Blok'], ['triangle', 'Driehoek'], ['sine', 'Sinus']];
const FTYPES = [['lowpass', 'Laagdoorlaat'], ['bandpass', 'Band'], ['highpass', 'Hoogdoorlaat'], ['notch', 'Notch'], ['peaking', 'Piek']];
const STYPES = [['off', 'uit'], ['soft', 'Zacht'], ['hard', 'Hard'], ['fold', 'Vouw'], ['asym', 'Asymmetrisch']];

const EN = {
  'Secundewolk (smal)': 'Second cloud (narrow)', 'Chromatisch cluster (12-toons)': 'Chromatic cluster (12-tone)', 'Wijde spanning': 'Wide tension', 'Tritonus-kruis (max. 5)': 'Tritone cross (max. 5)',
  'Septiem en none': 'Seventh and ninth', '13-toons (xenharmonisch)': '13-tone (xenharmonic)', 'Toeval (elke noot anders)': 'Random (every note different)', 'φ (gulden snede)': 'φ (golden ratio)',
  'Zaag': 'Saw', 'Blok': 'Square', 'Driehoek': 'Triangle', 'Sinus': 'Sine', 'Laagdoorlaat': 'Lowpass', 'Band': 'Bandpass', 'Hoogdoorlaat': 'Highpass', 'Piek': 'Peaking',
  'uit': 'off', 'Zacht': 'Soft', 'Hard': 'Hard', 'Vouw': 'Fold', 'Asymmetrisch': 'Asymmetric',
  'Zweving': 'Beating', 'Zweving-mix': 'Beating mix', 'Uiteendrijven': 'Drifting apart', 'Metaal': 'Metal', 'Ruis': 'Noise', 'Wrijving': 'Friction', 'Wrijving-snelheid': 'Friction rate',
  'Env-diepte': 'Env depth', 'Stemming': 'Tuning', 'Niveau': 'Level', 'Bron': 'Source', 'Uitgang': 'Output',
  'Ruwheid': 'Roughness', 'dissonantiekaart': 'dissonance map', 'Dissonantiekaart · grijs: ruwheid van twee tonen per interval (Plomp & Levelt / Sethares) · rood: verboden consonante zones · groen: jouw stemmen': 'Dissonance map · grey: roughness of two tones per interval (Plomp & Levelt / Sethares) · red: forbidden consonant zones · highlighted: your voices',
  'Structuur': 'Structure', 'Stemmen': 'Voices', 'Openheid': 'Openness', 'dicht': 'closed', 'Bewaker': 'Guard', 'geen consonante paren': 'no consonant pairs', 'Marge': 'Margin',
  'Golfvorm': 'Waveform', 'FM-verhouding': 'FM ratio', 'Ring-verhouding': 'Ring ratio', 'Diepte': 'Depth', 'Snelheid': 'Rate',
  'Snelle volumebeweging tussen ongeveer 15 en 70 Hz wordt niet als ritme maar als ruwheid gehoord; rond 30 Hz is ze het sterkst.': 'Fast volume movement between about 15 and 70 Hz is heard not as rhythm but as roughness; it is strongest around 30 Hz.',
  'Toonvolgen': 'Key tracking', 'Aanslag': 'Velocity', 'Noten': 'Notes', 'klavier': 'keyboard',
  '{0} noten': '{0} notes', '{0} noot': '{0} note', '{0} stemmen': '{0} voices', 'bewaker schoof {0} tonen': 'guard moved {0} tones', 'bewaker schoof {0} toon': 'guard moved {0} tone',
  'dichtst bij consonant t.o.v. andere noten: {0}¢': 'closest to consonant against other notes: {0}¢', 'speel een noot': 'play a note',
};

const DEF = () => ({
  struct: 'cloud', voices: 4, open: 0, guard: true, margin: 35, drift: 0,
  wave: 'sawtooth', beat: 7, beatMix: 0.4, fmRatio: '1.41421', fmi: 0, ringRatio: '1.61803', ring: 0, metal: 0, noise: 0,
  rough: 0.25, roughRate: 27,
  ftype: 'lowpass', cut: 2400, res: 2, fenv: 0.3, kt: 0.5, stype: 'soft', drive: 0.2,
  fa: 0.01, fd: 0.6, fs: 0.4, fr: 0.8, aa: 0.02, ad: 0.6, as: 0.8, ar: 1.2, vel: 0.5,
  poly: 4, width: 0.7, tune: 0, lvl: 0.55, pan: 0,
});
const PRESETS = {
  'Basic': {},
  'Hornet Nest': { struct: 'cloud', voices: 5, wave: 'sawtooth', beat: 18, beatMix: 0.6, rough: 0.45, roughRate: 31, ftype: 'bandpass', cut: 1800, res: 4, fenv: 0.2, aa: 0.05, ar: 0.6, drive: 0.35, lvl: 0.95 },
  'Rusty Bell': { struct: 'wide', voices: 4, wave: 'sine', fmRatio: '1.41421', fmi: 3, ringRatio: '1.61803', ring: 0.4, metal: 0.3, beat: 2, beatMix: 0.3, rough: 0.05, ftype: 'lowpass', cut: 7000, res: 1, fenv: 0, aa: 0.003, ad: 4, as: 0, ar: 4, stype: 'off', lvl: 0.8 },
  'Tritone Choir': { struct: 'trit', voices: 5, wave: 'triangle', beat: 4, beatMix: 0.5, rough: 0.15, roughRate: 22, drift: 6, cut: 1400, res: 1.5, fenv: 0.15, aa: 1.5, ad: 1, as: 0.9, ar: 3 },
  'Quarter-tone Mist': { struct: 'cloud', voices: 6, wave: 'sine', noise: 0.3, rough: 0.25, roughRate: 19, beat: 3, beatMix: 0.5, cut: 900, res: 1, fenv: 0.1, aa: 2, ad: 2, as: 0.9, ar: 4, stype: 'off', lvl: 0.7 },
  'Glass Splinters': { struct: 'x13', voices: 4, wave: 'sine', fmRatio: '1.5708', fmi: 5, ftype: 'highpass', cut: 1200, res: 3, fenv: 0, stype: 'fold', drive: 0.4, aa: 0.002, ad: 0.25, as: 0, ar: 0.6, width: 1 },
  'Industrial Drone': { struct: 'sept', voices: 5, wave: 'square', open: 1, metal: 0.2, rough: 0.3, roughRate: 37, ftype: 'lowpass', cut: 600, res: 6, fenv: 0.25, stype: 'hard', drive: 0.6, aa: 0.4, ad: 1, as: 1, ar: 2, drift: 3, lvl: 0.25 },
  'Minor Siren': { struct: 'trit', voices: 3, wave: 'sawtooth', drift: 25, beat: 5, beatMix: 0.4, rough: 0.2, cut: 2200, res: 3, aa: 0.3, ad: 2, as: 0.8, ar: 2.5 },
};
const MODP = [   // id, naam, min, max, log, rol, bereik, aan, spoor, snel
  ['beat', 'Zweving', 0, 40, false, 'detune', 0.1, true, 'cluster'], ['beatMix', 'Zweving-mix', 0, 1, false, 'level', 0.1, false, 'cluster'], ['drift', 'Uiteendrijven', 0, 50, false, 'detune', 0.15, false, 'cluster'],
  ['fmi', 'FM-index', 0, 10, false, 'fm', 0.1, true, 'bron'], ['ring', 'Ring', 0, 1, false, 'level', 0.1, false, 'bron'], ['metal', 'Metaal', 0, 1, false, 'level', 0.1, false, 'bron'],
  ['noise', 'Ruis', 0, 1, false, 'level', 0.1, false, 'bron'], ['rough', 'Wrijving', 0, 1, false, 'depth', 0.12, true, 'bron'], ['roughRate', 'Wrijving-snelheid', 8, 70, true, 'rate', 0.1, false, 'bron'],
  ['cut', 'Cutoff', 40, 18000, true, 'filter', 0.08, true, 'filter', true], ['res', 'Reso', 0.3, 20, false, 'res', 0.08, false, 'filter'], ['fenv', 'Env-diepte', -1, 1, false, 'env', 0.1, false, 'filter'], ['drive', 'Drive', 0, 1, false, 'drive', 0.1, false, 'filter'],
  ['aa', 'Amp attack', 0.001, 8, true, 'attack', 0.1, false, 'env'], ['ad', 'Amp decay', 0.01, 8, true, 'decay', 0.1, false, 'env'], ['ar', 'Amp release', 0.01, 10, true, 'decay', 0.1, false, 'env'],
  ['tune', 'Stemming', -100, 100, false, 'pitch', 0.04, false, 'uit', true], ['lvl', 'Niveau', 0, 1, false, 'level', 0.05, false, 'uit', true], ['pan', 'Pan', -1, 1, false, 'pan', 0.15, false, 'uit', true],
];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const LANES = { cluster: 'Cluster', bron: 'Bron', filter: 'Filter', env: 'Envelopes', uit: 'Uitgang' };
const FAST = { cut: 1200 * Math.log2(18000 / 40), tune: 200, lvl: 1, pan: 2 };
const CURVES = new Map();
function shapeCurve(type, drive) { const k = type + Math.round(drive * 100); if (CURVES.has(k)) return CURVES.get(k); const n = 2048, c = new Float32Array(n), g = 1 + drive * 9;
  for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; c[i] = type === 'soft' ? Math.tanh(g * x) / Math.tanh(g) : type === 'hard' ? clamp(x * g, -1, 1) : type === 'fold' ? Math.sin(x * (1 + drive * 6) * Math.PI / 2) : x >= 0 ? Math.tanh(g * x) / Math.tanh(g) : Math.tanh(g * 0.4 * x) / Math.tanh(g * 0.4) * 0.8; }
  CURVES.set(k, c); return c; }
// sensorische dissonantie (Plomp & Levelt, in de vorm van Sethares 1993) van een verzameling partialen
function roughness(partials) { let d = 0; for (let i = 0; i < partials.length; i++) for (let j = i + 1; j < partials.length; j++) { const [f1, a1] = partials[i], [f2, a2] = partials[j];
  const s = 0.24 / (0.0207 * Math.min(f1, f2) + 18.96), x = Math.abs(f2 - f1); d += a1 * a2 * (Math.exp(-3.5 * s * x) - Math.exp(-5.75 * s * x)); } return d; }
const harmonics = (f, n = 6) => Array.from({ length: n }, (_, k) => [f * (k + 1), Math.pow(0.88, k)]);

const CSS = `
:host{all:initial;display:block;container-type:inline-size;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:var(--fg,#e6e9ee);--acc:var(--audio,#4fd1c5)}
*{box-sizing:border-box}
.ws{display:grid;gap:10px;min-width:0}
.top{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.lab{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a3)}
.meter{display:grid;grid-template-columns:auto minmax(120px,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,#161a20)}
.meter .big{font-family:var(--disp,sans-serif);font-size:22px;font-weight:700;color:var(--acc);font-variant-numeric:tabular-nums;min-width:3ch;text-align:right}
.bar{height:10px;background:var(--line,#2a303a);border-radius:5px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--audio,#4fd1c5),var(--event,#f4a261),var(--stop,#e4574a));transition:width .15s}
.map{border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--well,#0d1014);color:var(--well-fg,#b9c3d0);padding:6px 8px;display:grid;gap:4px}
.map canvas{width:100%;height:150px;display:block}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.mod{border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,#161a20);padding:8px 10px;display:grid;gap:5px;align-content:start;min-width:0}
.mod h3{margin:0 0 2px;font-family:var(--disp,sans-serif);font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);display:flex;justify-content:space-between;align-items:center;gap:8px}
.mod h3 label{font-family:var(--mono,monospace);font-size:10px;letter-spacing:0;text-transform:none;color:var(--muted,#8a93a3);display:flex;gap:4px;align-items:center;cursor:pointer}
.k{display:grid;grid-template-columns:112px minmax(0,1fr) 58px;gap:8px;align-items:center;min-width:0}
.k label{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#8a93a3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{text-align:right;font-variant-numeric:tabular-nums;font-size:11px}
.note{font-size:10px;color:var(--muted,#8a93a3);line-height:1.45}
button,select{font:inherit;font-size:11px;color:var(--field-fg,#e6e9ee);background:var(--field,#1c2128);border:1px solid var(--line,#2a303a);border-radius:4px;padding:3px 7px;min-width:0}
button{cursor:pointer} button:hover{border-color:var(--acc)}
input[type=range]{width:100%;margin:0;accent-color:var(--acc);height:16px;min-width:0}
input[type=checkbox]{accent-color:var(--acc);margin:0}
.keys{display:flex;gap:2px;user-select:none;touch-action:none;overflow-x:auto;padding-bottom:2px}
.keys button{flex:1 0 22px;height:54px;padding:0 0 4px;display:flex;align-items:flex-end;justify-content:center;font-size:9px;color:#333;background:#e8e6df;border-color:#999;border-radius:0 0 3px 3px}
.keys button.b{flex:0 0 18px;margin:0 -10px;z-index:1;background:#1c2128;color:#888;height:34px;border-color:#444}
.keys button.down{background:var(--acc);color:var(--glyph-fg,#111)}
`;

export default {
  id: 'nl.patchkamer.dissonantcluster',
  name: 'Dissonant Cluster',
  version: '1.11.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 1180, minWidth: 420 },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let P = DEF(); const mod = {}; let dead = false, ro = null, root = null, refreshers = [], groups = [], noiseBuf = null, ui = {}, lastRoot = 57, lastCents = null, seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const polyOut = ctx.createGain(), pan = ctx.createStereoPanner(), out = ctx.createGain(); polyOut.connect(pan).connect(out); out.gain.value = 0.9;
    const bus = {}, ctl = {}, mon = ctx.createAnalyser(); mon.fftSize = 256;
    Object.entries(FAST).forEach(([k, sc]) => { const g = ctx.createGain(); g.gain.value = sc; bus[k] = g; if (typeof ctx.createConstantSource === 'function') { const c = ctx.createConstantSource(); c.offset.value = 0; try { c.start(); } catch (e) {} c.connect(g); ctl[k] = c; } });
    bus.lvl.connect(polyOut.gain); bus.pan.connect(pan.pan);
    const E = k => { const m = MODBY[k], b = P[k], o = mod[k] || 0; if (!m || !o || FAST[k] !== undefined) return b; const [, , mn, mx, log] = m; return log ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    const applyGlobal = () => { const t = ctx.currentTime; polyOut.gain.setTargetAtTime(P.lvl, t, 0.03); pan.pan.setTargetAtTime(P.pan, t, 0.03); };
    applyGlobal();
    function noiseSrc() { if (!noiseBuf) { const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseBuf = b; }
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.loopStart = Math.random(); return s; }

    // ---------- de structuur en de bewaker ----------
    function offsets() {
      const n = clamp(P.voices | 0, 2, 6); let o;
      const st = STRUCT.find(s => s[0] === P.struct) || STRUCT[0];
      if (!st[2]) { o = [0]; for (let i = 1; i < n; i++) o.push(Math.round(rnd() * 32) * 75 + Math.round(rnd() * 3) * 25); }   // toeval: raster van 25 cent tot ±2,5 octaaf
      else { const k = Math.max(...Object.keys(st[2]).map(Number).filter(x => x <= n)); o = st[2][k].slice(); }
      for (let i = 0; i < o.length && i < (P.open | 0) * 2; i++) if (i % 2 === 1) o[i] += 1200;   // openheid: om-en-om een octaav hoger (intervalklasse blijft gelijk)
      return o;
    }
    // kleinste verschuiving (stappen van 5 cent, tot ±maxS) waarbij toon c van alle referenties ≥ M cent van consonant ligt;
    // bestaat die niet, dan de plek met de grootste kleinste afstand
    function bestShift(c, refs, M, maxS) { let best = null;
      for (let k = 0; k <= maxS / 5; k++) for (const sg of (k ? [1, -1] : [1])) { const sft = sg * k * 5; let m = 1e9; for (const e of refs) m = Math.min(m, consDist(c + sft - e).d);
        if (m >= M) return { s: sft, m }; if (!best || m > best.m) best = { s: sft, m }; }
      return best; }
    // 1) binnen de noot: elke stem de kleinste stap weg van consonantie (gegarandeerd waar het kan)
    // 2) tussen noten: het hele cluster samen hooguit een halve toon schuiven, zodat de binnenkant intact blijft
    function guardCents(cents, others) {
      if (!P.guard) { ui.moved = 0; ui.cross = null; return cents; } const M = P.margin; let moved = 0; const placed = [];
      for (const c of cents) { const b = placed.length ? bestShift(c, placed, M, 600) : { s: 0 }; if (b.s) moved++; placed.push(c + b.s); }
      ui.cross = null;
      if (others.length) { let best = null;
        // straf per paar: hoe dichter bij een consonant interval, hoe zwaarder (zuivere consonanten het zwaarst)
        for (let k = 0; k <= 20; k++) for (const sg of (k ? [1, -1] : [1])) { const S = sg * k * 5; let m = 1e9, pen = 0;
            for (const c of placed) for (const e of others) { const dd = consDist(c + S - e).d; m = Math.min(m, dd); if (dd < M) pen += Math.pow(1 - dd / M, 2) * (dd < 6 ? 4 : 1); }
          pen += Math.abs(S) / 2000;
          if (!best || pen < best.pen - 1e-9) best = { S, m, pen }; if (pen === 0) break; }
        if (best && best.S) { for (let i = 0; i < placed.length; i++) placed[i] += best.S; moved += placed.length; }
        ui.cross = best ? Math.round(best.m) : null; }
      ui.moved = moved; return placed;
    }
    const sounding = t => groups.filter(g => g.endAt == null || g.endAt > t);

    // ---------- een noot = een cluster ----------
    function noteOn(note, vel, t, dur) {
      const tOff = dur != null ? t + Math.max(0.02, dur) : null;
      const live = sounding(t).filter(g => g.relAt == null || g.relAt > t);
      if (live.length >= P.poly) kill(live.sort((a, b) => a.t0 - b.t0)[0], t);
      // wegstervende noten: nooit meer dan het aantal noten; de oudste gaat snel weg
      const tails = sounding(t).filter(g => g.relAt != null && g.relAt <= t).sort((a, b) => a.t0 - b.t0); while (tails.length > Math.max(1, P.poly)) kill(tails.shift(), t);
      const rootC = (note - 69) * 100, others = [].concat(...sounding(t).filter(g => g.relAt == null || g.relAt > t).map(g => g.cents));
      const cents = guardCents(offsets().map(o => rootC + o), others); lastRoot = note; lastCents = cents;
      const g = { t0: t, cents, nodes: [], srcs: [], conns: [], live: {}, endAt: null, relAt: null };
      const mix = ctx.createGain(); g.nodes.push(mix); const n = cents.length, f0 = 440 * Math.pow(2, rootC / 1200);
      const fmR = +P.fmRatio, rgR = +P.ringRatio, beat = E('beat'), bm = E('beatMix'), fmi = E('fmi'), ring = E('ring'), rough = E('rough'), rr = E('roughRate'), drift = E('drift');
      // bronnen alleen bouwen als ze klinken of gestuurd worden (scheelt veel oscillators)
      const use = k => E(k) > 0.0005 || (k in mod), useFm = use('fmi'), useRing = use('ring'), useAm = use('rough'), useTwin = use('beatMix');
      g.live = { fm: [], twin: [], dry: [], wet: [], am: [], amR: [], amBase: [] };
      cents.forEach((c, i) => {
        const f = 440 * Math.pow(2, c / 1200), pn = ctx.createStereoPanner(); pn.pan.value = n > 1 ? (i / (n - 1) * 2 - 1) * P.width : 0; pn.connect(mix); g.nodes.push(pn);
        const vg = ctx.createGain(); vg.gain.value = 1 - rough * 0.5; vg.connect(pn); g.nodes.push(vg);
        if (useAm) { const am = ctx.createOscillator(), amg = ctx.createGain(); am.frequency.value = rr * (0.85 + 0.3 * rnd()); amg.gain.value = rough * 0.5; am.connect(amg).connect(vg.gain); g.srcs.push(am); g.nodes.push(amg); g.live.am.push(amg); g.live.amR.push(am); g.live.amBase.push(vg); } else vg.gain.value = 1;
        const dry = ctx.createGain(), wet = ctx.createGain(), rg = ctx.createGain(); dry.gain.value = 1 - ring; wet.gain.value = ring; rg.gain.value = 0; dry.connect(vg); rg.connect(wet).connect(vg); g.nodes.push(dry, wet, rg); g.live.dry.push(dry); g.live.wet.push(wet);
        let ro = null; if (useRing) { ro = ctx.createOscillator(); ro.type = 'sine'; ro.frequency.value = f * rgR; ro.connect(rg.gain); g.srcs.push(ro); }
        const voiceIn = ctx.createGain(); voiceIn.gain.value = 0.5 / Math.sqrt(n); voiceIn.connect(dry); voiceIn.connect(rg); g.nodes.push(voiceIn);
        let fm = null, fmg = null; if (useFm) { fm = ctx.createOscillator(); fmg = ctx.createGain(); fm.type = 'sine'; fm.frequency.value = f * fmR; fmg.gain.value = f * fmR * fmi; fm.connect(fmg); g.srcs.push(fm); g.nodes.push(fmg); g.live.fm.push([fmg, f * fmR]); }
        const dir = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
        (useTwin ? [0, 1] : [0]).forEach(tw => { const o = ctx.createOscillator(); o.type = P.wave; o.frequency.value = f + (tw ? (i % 2 ? beat : -beat) : 0); if (fmg) fmg.connect(o.frequency);
          o.detune.setValueAtTime(0, t); if (drift > 0) o.detune.linearRampToValueAtTime(dir * drift * 8, t + 8);
          bus.tune.connect(o.detune); g.conns.push([bus.tune, o.detune]);
          const og = ctx.createGain(); og.gain.value = tw ? bm : (useTwin ? 1 - bm * 0.5 : 1); o.connect(og).connect(voiceIn); g.srcs.push(o); g.nodes.push(og); if (tw) g.live.twin.push(og); else g.live.main = (g.live.main || []).concat(og); });
        [fm, ro].forEach(o => { if (o) { bus.tune.connect(o.detune); g.conns.push([bus.tune, o.detune]); } });
      });
      // metaal en ruis rond de grondtoon
      if (use('metal')) { const mg = ctx.createGain(); mg.gain.value = E('metal') * 0.12; const mbp = ctx.createBiquadFilter(); mbp.type = 'bandpass'; mbp.frequency.value = clamp(f0 * 6, 800, 12000); mbp.Q.value = 1.2; mbp.connect(mg).connect(mix); g.nodes.push(mg, mbp); g.live.metal = mg;
        METAL.forEach(r => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f0 * 2 * r; o.connect(mbp); g.srcs.push(o); }); }
      if (use('noise')) { const ns = noiseSrc(), nbp = ctx.createBiquadFilter(), ng = ctx.createGain(); nbp.type = 'bandpass'; nbp.frequency.value = clamp(f0 * 2, 80, 12000); nbp.Q.value = 2.5; ng.gain.value = E('noise') * 0.5; ns.connect(nbp).connect(ng).connect(mix); g.srcs.push(ns); g.nodes.push(nbp, ng); g.live.noise = ng; }
      // filter, shaper, versterker
      const flt = ctx.createBiquadFilter(); flt.type = P.ftype; flt.Q.value = E('res'); bus.cut.connect(flt.detune); g.conns.push([bus.cut, flt.detune]); g.nodes.push(flt); g.live.flt = flt; flt.connect(mon);
      const shp = P.stype !== 'off' ? ctx.createWaveShaper() : null; if (shp) { shp.curve = shapeCurve(P.stype, E('drive')); shp.oversample = '2x'; g.nodes.push(shp); g.live.shp = shp; }
      const vca = ctx.createGain(); vca.gain.value = 0; g.nodes.push(vca); g.vca = vca;
      mix.connect(flt); (shp ? (flt.connect(shp), shp) : flt).connect(vca).connect(polyOut);
      const base = clamp(E('cut') * Math.pow(f0 / 261.63, P.kt), 30, 18000), pk = clamp(base * Math.pow(2, E('fenv') * 6), 30, 18000), su = clamp(base * Math.pow(2, E('fenv') * 6 * P.fs), 30, 18000);
      const fa = P.fa, fd = P.fd, aa = E('aa'), ad = E('ad'), ar = E('ar');
      flt.frequency.setValueAtTime(base, t); flt.frequency.linearRampToValueAtTime(pk, t + fa); flt.frequency.setTargetAtTime(su, t + fa, fd / 4); g.fbase = base; g.fr = P.fr;
      const peak = (1 - P.vel * (1 - clamp(vel, 0, 1))) * 0.6; vca.gain.setValueAtTime(0.0001, t); vca.gain.linearRampToValueAtTime(peak, t + aa); vca.gain.setTargetAtTime(peak * P.as, t + aa, ad / 4);
      g.ar = ar; g.srcs.forEach(s => { try { s.start(t); } catch (e) {} });
      if (tOff != null) release(g, tOff);
      groups.push(g); return g;
    }
    // loslaten tijdens de aanzet: de lopende curve vasthouden op tijdstip t (cancelScheduledValues alleen zou de aanzet wissen = stilte)
    function hold(prm, t) { if (prm.cancelAndHoldAtTime) prm.cancelAndHoldAtTime(t); else { prm.cancelScheduledValues(t); } }
    function release(g, t) { if (g.relAt != null && g.relAt <= t) return; g.relAt = t; hold(g.vca.gain, t); g.vca.gain.setTargetAtTime(0.0001, t, Math.max(0.005, g.ar / 4));
      if (g.live.flt) { hold(g.live.flt.frequency, t); g.live.flt.frequency.setTargetAtTime(g.fbase, t, Math.max(0.01, g.fr / 4)); }
      g.endAt = t + g.ar * 1.6 + 0.05; g.srcs.forEach(s => { try { s.stop(g.endAt); } catch (e) {} }); }
    function kill(g, t) { g.ar = 0.02; g.relAt = null; release(g, Math.max(ctx.currentTime, t - 0.005)); }
    function liveApply() {   // trage sturing op klinkende noten
      const t = ctx.currentTime, r = 0.05, fmi = E('fmi'), ring = E('ring'), rough = E('rough'), rr = E('roughRate'), bm = E('beatMix');
      sounding(t).forEach(g => { const L = g.live; L.fm.forEach(([gn, fr]) => gn.gain.setTargetAtTime(fr * fmi, t, r)); L.dry.forEach(x => x.gain.setTargetAtTime(1 - ring, t, r)); L.wet.forEach(x => x.gain.setTargetAtTime(ring, t, r));
        L.am.forEach(x => x.gain.setTargetAtTime(rough * 0.5, t, r)); L.amBase.forEach(x => x.gain.setTargetAtTime(1 - rough * 0.5, t, r)); L.amR.forEach((o, i) => o.frequency.setTargetAtTime(rr * (0.85 + 0.3 * ((i * 0.37) % 1)), t, r));
        L.twin.forEach(x => x.gain.setTargetAtTime(bm, t, r)); (L.main || []).forEach(x => x.gain.setTargetAtTime(1 - bm * 0.5, t, r));
        if (L.metal) L.metal.gain.setTargetAtTime(E('metal') * 0.12, t, r); if (L.noise) L.noise.gain.setTargetAtTime(E('noise') * 0.5, t, r); if (L.flt) L.flt.Q.setTargetAtTime(E('res'), t, r); if (L.shp) L.shp.curve = shapeCurve(P.stype, E('drive')); });
    }
    function cleanup() { const now = ctx.currentTime; groups = groups.filter(g => { if (g.endAt != null && now > g.endAt + 0.1) { g.conns.forEach(([a, b]) => { try { a.disconnect(b); } catch (e) {} }); g.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); return false; } return true; }); }
    // opruimen altijd (ook als de kaart niet te zien is); tekenen via host.frame (v1.7), anders zelf met een timer
    const ct = setInterval(() => { if (!dead) cleanup(); }, 250);
    let unframe = null, mt = null;
    const startMeter = () => { if (unframe || mt) return; if (host && typeof host.frame === 'function') unframe = host.frame(self, () => { if (!dead) meter(); }, 10); else mt = setInterval(() => { if (!dead) meter(); }, 120); };
    const stopMeter = () => { if (unframe) { unframe(); unframe = null; } if (mt) { clearInterval(mt); mt = null; } };
    function noteGroup(n, vel, t, dur) { return noteOn(n, vel, t, dur); }
    // bewaker: kijkt naar de ruwe filteruitvoer (vóór de shaper, die een ontsporing verbergt). Een instabiel filter geeft Infinity en daarna NaN en herstelt nooit;
    // dan worden alle klinkende noten opgeruimd (elke noot heeft eigen filters), zodat nieuwe noten weer gewoon klinken
    const chk = new Float32Array(256);
    function guard() {
      if (dead) return; mon.getFloatTimeDomainData(chk);
      for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 1000)) { wipe(); return; }   // normaal tot ruim 100 bij extreme instellingen (gemeten); een ontspoord filter loopt in tientallen ms naar 1e6 en hoger
    }
    function wipe() { groups.forEach(g => { g.srcs.forEach(s => { try { s.stop(); } catch (e) {} }); g.conns.forEach(([a, b]) => { try { a.disconnect(b); } catch (e) {} }); g.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }); groups = []; }
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    // ---------- ruwheidsmeter en dissonantiekaart ----------
    let hist = [];
    function meter() {
      if (!ui.big) return; const now = ctx.currentTime, act = sounding(now).filter(g => g.relAt == null || g.relAt > now);
      let d = 0; if (act.length) { const parts = []; act.forEach(g => g.cents.forEach(c => parts.push(...harmonics(440 * Math.pow(2, c / 1200), 6)))); d = roughness(parts); }
      const v = Math.round(100 * (1 - Math.exp(-d / 3))), bigT = act.length ? String(v) : '—', barW = (act.length ? v : 0) + '%';
      const infoT = act.length ? (act.length > 1 ? tx('{0} noten', act.length) : tx('{0} noot', act.length)) + ' · ' + tx('{0} stemmen', act.reduce((a, g) => a + g.cents.length, 0)) + (ui.moved ? ' · ' + (ui.moved > 1 ? tx('bewaker schoof {0} tonen', ui.moved) : tx('bewaker schoof {0} toon', ui.moved)) : '') + (ui.cross != null ? ' · ' + tx('dichtst bij consonant t.o.v. andere noten: {0}¢', ui.cross) : '') : tx('speel een noot');
      if (ui.big.textContent !== bigT) ui.big.textContent = bigT; if (ui.bar.style.width !== barW) ui.bar.style.width = barW; if (ui.info.textContent !== infoT) ui.info.textContent = infoT;
    }
    // maat uit een ResizeObserver, kleuren uit een cache die hooguit om de halve seconde wordt ververst (alleen bij tekenen na een handeling)
    let mapW = 0, mapH = 0, mapDpr = 1, colors = null, colT = -1e9;
    function readColors() { const now = performance.now(); if (colors && now - colT < 500) return; colT = now; const cs = getComputedStyle(ui.cv), v = (n, d) => cs.getPropertyValue(n).trim() || d; colors = { acc: v('--audio', '#4fd1c5'), stop: v('--stop', '#e4574a'), ink: v('--well-fg', '#b9c3d0') }; }
    function sizeMap(w, h) { const cv = ui.cv; if (!cv) return; mapW = Math.round(w); mapH = Math.round(h); mapDpr = window.devicePixelRatio || 1; const pw = Math.round(mapW * mapDpr), ph = Math.round(mapH * mapDpr); if (cv.width !== pw) cv.width = pw; if (cv.height !== ph) cv.height = ph; ctx2d = cv.getContext('2d'); }
    let ctx2d = null;
    function drawMap() {
      const cv = ui.cv; if (!cv || !ctx2d || !mapW || !mapH) return; readColors(); const w = mapW, h = mapH, g = ctx2d;
      g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0); g.clearRect(0, 0, w, h);
      const span = 3600, f = 440 * Math.pow(2, (lastRoot - 69) / 12), xOf = c => (c / span) * w;
      // verboden zones: binnen de marge rond consonante intervallen (en hun octaven)
      g.globalAlpha = 0.16; g.fillStyle = colors.stop; for (let o = 0; o <= span; o += 1200) CONS.forEach(c => { const x0 = xOf(o + c - P.margin), x1 = xOf(o + c + P.margin); g.fillRect(x0, 0, x1 - x0, h); });
      // Sethares-kromme: dissonantie van twee harmonische tonen als functie van het interval
      const ys = []; let mx = 0; for (let i = 0; i <= w; i += 2) { const c = (i / w) * span, d = roughness(harmonics(f).concat(harmonics(f * Math.pow(2, c / 1200)))); ys.push(d); mx = Math.max(mx, d); }
      g.globalAlpha = 0.8; g.strokeStyle = colors.ink; g.lineWidth = 1.5; g.beginPath(); ys.forEach((d, k) => { const x = k * 2, y = h - 14 - (d / mx) * (h - 24); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      g.globalAlpha = 0.7; g.fillStyle = colors.ink; g.font = '10px monospace'; ['P1', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'].forEach((nm, i) => { g.fillText(nm, xOf(CONS[i]) + 2, h - 2); });
      // stemmen van de laatste noot (of de voorbeeldstructuur)
      g.globalAlpha = 1; const cs = (lastCents ? lastCents.map(c => c - lastCents[0]) : offsets()).filter(c => c >= 0 && c <= span);
      let row = 0, lastX = -99; cs.slice().sort((a, b) => a - b).forEach(c => { const x = xOf(c); g.strokeStyle = colors.acc; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 4); g.lineTo(x, h - 14); g.stroke(); row = x - lastX < 40 ? (row + 1) % 4 : 0; lastX = x; g.fillStyle = colors.acc; g.fillText(Math.round(c) + '¢', Math.min(x + 3, w - 36), 12 + row * 11); });
    }

    // ---------- UI ----------
    // aria = naam van de stuurbare parameter (zie MODP), zodat de host de modulatiestip op deze regelaar zet
    function knob(parent, label, [mn, mx, st], get, set, fmt, log, aria) {
      const w = document.createElement('div'); w.className = 'k'; const l = document.createElement('label'), i = document.createElement('input'), o = document.createElement('output'); l.textContent = tx(label); i.type = 'range'; i.setAttribute('aria-label', tx(aria || label));
      const d0 = (() => { const sv = P; P = DEF(); try { return get(); } finally { P = sv; } })();
      if (log) { i.min = 0; i.max = 1; i.step = 0.001; const to = x => mn * Math.pow(mx / mn, x), from = v => Math.log(v / mn) / Math.log(mx / mn); i.dataset.pkDefault = String(from(d0)); i.oninput = () => { set(to(+i.value)); o.textContent = fmt(get()); after(); }; refreshers.push(() => { i.value = from(get()); o.textContent = fmt(get()); }); }
      else { i.min = mn; i.max = mx; i.step = st; i.dataset.pkDefault = String(d0); i.oninput = () => { set(+i.value); o.textContent = fmt(get()); after(); }; refreshers.push(() => { i.value = get(); o.textContent = fmt(get()); }); }
      w.append(l, i, o); parent.appendChild(w);
    }
    function choose(parent, label, opts, get, set) { const w = document.createElement('div'); w.className = 'k'; w.style.gridTemplateColumns = '112px minmax(0,1fr)'; const l = document.createElement('label'), s = document.createElement('select'); l.textContent = tx(label); s.setAttribute('aria-label', tx(label));
      opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = tx(t); s.appendChild(o); }); s.onchange = () => { set(s.value); lastCents = null; refreshAll(); after(); }; refreshers.push(() => { s.value = String(get()); }); w.append(l, s); parent.appendChild(w); }
    function box(parent, title, extra) { const m = document.createElement('section'); m.className = 'mod'; const h = document.createElement('h3'); h.textContent = tx(title); m.appendChild(h); if (extra) extra(h); parent.appendChild(m); return m; }
    const after = () => { applyGlobal(); applyTune(); liveApply(); drawMap(); };
    const refreshAll = () => { refreshers.forEach(f => f()); drawMap(); };
    const pct = v => Math.round(v * 100) + '%', hz = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' kHz' : Math.round(v) + ' Hz', sec = v => v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
    function build() {
      const ws = document.createElement('div'); ws.className = 'ws'; root.appendChild(ws);
      const top = document.createElement('div'); top.className = 'top'; ws.appendChild(top); const pl = document.createElement('span'); pl.className = 'lab'; pl.textContent = 'Preset'; top.appendChild(pl);
      Object.keys(PRESETS).forEach(n => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { P = merge(PRESETS[n]); lastCents = null; applyGlobal(); refreshAll(); }; top.appendChild(b); });
      const me = document.createElement('div'); me.className = 'meter'; const ml = document.createElement('span'); ml.className = 'lab'; ml.textContent = tx('Ruwheid'); ui.bar = document.createElement('i'); const bw = document.createElement('div'); bw.className = 'bar'; bw.appendChild(ui.bar);
      ui.big = document.createElement('span'); ui.big.className = 'big'; ui.big.textContent = '—'; ui.info = document.createElement('div'); ui.info.className = 'note'; ui.info.style.gridColumn = '1/-1'; me.append(ml, bw, ui.big, ui.info); ws.appendChild(me);
      const mp = document.createElement('div'); mp.className = 'map'; const mh = document.createElement('div'); mh.className = 'lab'; mh.textContent = tx('Dissonantiekaart · grijs: ruwheid van twee tonen per interval (Plomp & Levelt / Sethares) · rood: verboden consonante zones · groen: jouw stemmen');
      ui.cv = document.createElement('canvas'); ui.cv.setAttribute('role', 'img'); ui.cv.setAttribute('aria-label', tx('dissonantiekaart')); mp.append(mh, ui.cv); ws.appendChild(mp);
      const G = document.createElement('div'); G.className = 'grid'; ws.appendChild(G);
      const cl = box(G, 'Cluster'); choose(cl, 'Structuur', STRUCT.map(s => [s[0], s[1]]), () => P.struct, v => { P.struct = v; });
      knob(cl, 'Stemmen', [2, 6, 1], () => P.voices, v => { P.voices = v; lastCents = null; }, v => String(v)); knob(cl, 'Openheid', [0, 3, 1], () => P.open, v => { P.open = v; lastCents = null; }, v => v ? '+' + v + ' oct' : tx('dicht'));
      knob(cl, 'Zweving', [0, 40, 0.1], () => P.beat, v => { P.beat = v; }, v => v.toFixed(1) + ' Hz'); knob(cl, 'Zweving-mix', [0, 1, 0.01], () => P.beatMix, v => { P.beatMix = v; }, pct);
      knob(cl, 'Uiteendrijven', [0, 50, 0.5], () => P.drift, v => { P.drift = v; }, v => v ? v + ' ct/s' : tx('uit'));
      const gd = document.createElement('div'); gd.className = 'k'; gd.style.gridTemplateColumns = '112px minmax(0,1fr)'; const gl = document.createElement('label'); gl.textContent = tx('Bewaker'); const gc = document.createElement('label'); gc.className = 'note'; gc.style.display = 'flex'; gc.style.gap = '6px'; gc.style.alignItems = 'center';
      const gcb = document.createElement('input'); gcb.type = 'checkbox'; gcb.onchange = () => { P.guard = gcb.checked; lastCents = null; drawMap(); }; refreshers.push(() => { gcb.checked = !!P.guard; }); gc.append(gcb, document.createTextNode(tx('geen consonante paren'))); gd.append(gl, gc); cl.appendChild(gd);
      knob(cl, 'Marge', [10, 60, 1], () => P.margin, v => { P.margin = v; lastCents = null; }, v => '±' + v + ' ct');
      const br = box(G, 'Bron'); choose(br, 'Golfvorm', WAVES, () => P.wave, v => { P.wave = v; });
      choose(br, 'FM-verhouding', RATIOS, () => P.fmRatio, v => { P.fmRatio = v; }); knob(br, 'FM-index', [0, 10, 0.01], () => P.fmi, v => { P.fmi = v; }, v => v.toFixed(2));
      choose(br, 'Ring-verhouding', RATIOS, () => P.ringRatio, v => { P.ringRatio = v; }); knob(br, 'Ring', [0, 1, 0.01], () => P.ring, v => { P.ring = v; }, pct);
      knob(br, 'Metaal', [0, 1, 0.01], () => P.metal, v => { P.metal = v; }, pct); knob(br, 'Ruis', [0, 1, 0.01], () => P.noise, v => { P.noise = v; }, pct);
      const wr = box(G, 'Wrijving'); knob(wr, 'Diepte', [0, 1, 0.01], () => P.rough, v => { P.rough = v; }, pct, false, 'Wrijving'); knob(wr, 'Snelheid', [8, 70], () => P.roughRate, v => { P.roughRate = v; }, v => v.toFixed(1) + ' Hz', true, 'Wrijving-snelheid');
      const wn = document.createElement('div'); wn.className = 'note'; wn.textContent = tx('Snelle volumebeweging tussen ongeveer 15 en 70 Hz wordt niet als ritme maar als ruwheid gehoord; rond 30 Hz is ze het sterkst.'); wr.appendChild(wn);
      const fl = box(G, 'Filter'); choose(fl, 'Type', FTYPES, () => P.ftype, v => { P.ftype = v; }); knob(fl, 'Cutoff', [40, 18000], () => P.cut, v => { P.cut = v; }, hz, true);
      knob(fl, 'Reso', [0.3, 20, 0.1], () => P.res, v => { P.res = v; }, v => v.toFixed(1)); knob(fl, 'Env-diepte', [-1, 1, 0.01], () => P.fenv, v => { P.fenv = v; }, v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%');
      knob(fl, 'Toonvolgen', [0, 1, 0.01], () => P.kt, v => { P.kt = v; }, pct); choose(fl, 'Shaper', STYPES, () => P.stype, v => { P.stype = v; }); knob(fl, 'Drive', [0, 1, 0.01], () => P.drive, v => { P.drive = v; }, pct);
      [['Filter-envelope', 'f'], ['Amp-envelope', 'a']].forEach(([t, p]) => { const m = box(G, t);
        const an = nm => (p === 'a' ? 'Amp ' : 'Filter ') + nm.toLowerCase();
        knob(m, 'Attack', [0.001, 8], () => P[p + 'a'], v => { P[p + 'a'] = v; }, sec, true, an('Attack')); knob(m, 'Decay', [0.01, 8], () => P[p + 'd'], v => { P[p + 'd'] = v; }, sec, true, an('Decay'));
        knob(m, 'Sustain', [0, 1, 0.01], () => P[p + 's'], v => { P[p + 's'] = v; }, pct, false, an('Sustain')); knob(m, 'Release', [0.01, 10], () => P[p + 'r'], v => { P[p + 'r'] = v; }, sec, true, an('Release'));
        if (p === 'a') knob(m, 'Aanslag', [0, 1, 0.01], () => P.vel, v => { P.vel = v; }, pct); });
      const uo = box(G, 'Uitgang'); knob(uo, 'Noten', [1, 6, 1], () => P.poly, v => { P.poly = v; }, v => String(v)); knob(uo, 'Stereo', [0, 1, 0.01], () => P.width, v => { P.width = v; }, pct);
      knob(uo, 'Stemming', [-100, 100, 1], () => P.tune, v => { P.tune = v; }, v => (v > 0 ? '+' : '') + v + ' ct'); knob(uo, 'Niveau', [0, 1, 0.01], () => P.lvl, v => { P.lvl = v; }, pct);
      knob(uo, 'Pan', [-1, 1, 0.01], () => P.pan, v => { P.pan = v; }, v => Math.abs(v) < 0.02 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100));
      const kb = document.createElement('div'); kb.className = 'keys'; kb.setAttribute('aria-label', tx('klavier')); ws.appendChild(kb); const held = new Map(), NN = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
      for (let n = 36; n < 72; n++) { const b = document.createElement('button'), bl = [1, 3, 6, 8, 10].includes(n % 12); b.className = bl ? 'b' : ''; b.textContent = n % 12 === 0 ? 'C' + (Math.floor(n / 12) - 1) : ''; b.title = NN[n % 12] + (Math.floor(n / 12) - 1); b.setAttribute('aria-label', b.title);
        b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('down'); held.set(n, noteGroup(n, 0.85, ctx.currentTime, null)); drawMap(); });
        const up = () => { b.classList.remove('down'); const g = held.get(n); if (g) { release(g, ctx.currentTime); held.delete(n); } }; b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); kb.appendChild(b); }
      refreshAll(); if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const r = es[0].contentRect; sizeMap(r.width, r.height); drawMap(); }); ro.observe(ui.cv); } else { sizeMap(ui.cv.clientWidth, ui.cv.clientHeight); drawMap(); }
    }
    function merge(over) { const d = DEF(); return sane({ ...d, ...(over || {}) }); }
    function sane(s) { const d = DEF(), o = {}; const num = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : def);
      o.struct = STRUCT.some(x => x[0] === s.struct) ? s.struct : d.struct; o.voices = num(s.voices, 2, 6, d.voices) | 0; o.open = num(s.open, 0, 3, d.open) | 0; o.guard = typeof s.guard === 'boolean' ? s.guard : d.guard; o.margin = num(s.margin, 10, 60, d.margin); o.drift = num(s.drift, 0, 50, d.drift);
      o.wave = WAVES.some(x => x[0] === s.wave) ? s.wave : d.wave; o.beat = num(s.beat, 0, 40, d.beat); o.beatMix = num(s.beatMix, 0, 1, d.beatMix); o.fmRatio = RATIOS.some(x => x[0] === s.fmRatio) ? s.fmRatio : d.fmRatio; o.fmi = num(s.fmi, 0, 10, d.fmi);
      o.ringRatio = RATIOS.some(x => x[0] === s.ringRatio) ? s.ringRatio : d.ringRatio; o.ring = num(s.ring, 0, 1, d.ring); o.metal = num(s.metal, 0, 1, d.metal); o.noise = num(s.noise, 0, 1, d.noise); o.rough = num(s.rough, 0, 1, d.rough); o.roughRate = num(s.roughRate, 8, 70, d.roughRate);
      o.ftype = FTYPES.some(x => x[0] === s.ftype) ? s.ftype : d.ftype; o.cut = num(s.cut, 40, 18000, d.cut); o.res = num(s.res, 0.3, 20, d.res); o.fenv = num(s.fenv, -1, 1, d.fenv); o.kt = num(s.kt, 0, 1, d.kt); o.stype = STYPES.some(x => x[0] === s.stype) ? s.stype : d.stype; o.drive = num(s.drive, 0, 1, d.drive);
      ['fa', 'aa'].forEach(k => o[k] = num(s[k], 0.001, 8, d[k])); ['fd', 'ad'].forEach(k => o[k] = num(s[k], 0.01, 8, d[k])); ['fr', 'ar'].forEach(k => o[k] = num(s[k], 0.01, 10, d[k])); ['fs', 'as', 'vel', 'width', 'lvl'].forEach(k => o[k] = num(s[k], 0, 1, d[k]));
      o.poly = num(s.poly, 1, 6, d.poly) | 0; o.tune = num(s.tune, -100, 100, d.tune); o.pan = num(s.pan, -1, 1, d.pan); return o; }
    // stemming via de snelle bus: knop (cent → deel van 200 cent) plus modulatie
    function applyTune() { const t = ctx.currentTime; if (ctl.tune) ctl.tune.offset.setTargetAtTime(P.tune / 200 + (mod.tune || 0), t, 0.03); }

    const self = {
      inputs: {}, outputs: { out },
      mount(el) { startMeter(); const wrap = document.createElement('div'); el.appendChild(wrap); root = wrap.attachShadow({ mode: 'open' }); const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); build(); },
      unmount() { stopMeter(); if (ro) { ro.disconnect(); ro = null; } root = null; refreshers = []; ui = {}; ctx2d = null; mapW = 0; mapH = 0; colors = null; },
      onEvent(port, ev) { if (port !== 'notes' || !ev || ev.type !== 'note') return; const fin = v => typeof v === 'number' && isFinite(v); noteGroup(clamp(ev.note | 0, 0, 127), fin(ev.vel) ? ev.vel : 0.8, fin(ev.time) ? Math.max(0, ev.time) : ctx.currentTime, fin(ev.dur) ? ev.dur : 0.3); },
      onTransport({ playing }) { if (!playing) { const t = ctx.currentTime; groups.forEach(g => { g.ar = Math.min(g.ar, 0.4); g.relAt = null; release(g, t); }); } },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on, lane, fast]) => ({ id, name: tx(name), lane, laneName: tx(LANES[lane]), min, max, role, scale: log ? 'log' : 'lin', drift, on, fast: !!fast })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODBY[k]) { const v = +o[k]; mod[k] = isFinite(v) ? clamp(v, -1, 1) : 0; } const t = ctx.currentTime; ['cut', 'lvl', 'pan'].forEach(k => { if (ctl[k]) ctl[k].offset.setTargetAtTime(mod[k] || 0, t, 0.04); }); applyTune(); liveApply(); },
      modInput(id) { return FAST[id] !== undefined ? bus[id] : null; },
      getState() { return sane(P); },
      setState(s) { P = sane(s || {}); applyGlobal(); applyTune(); lastCents = null; refreshAll(); },
      destroy() { if (dead) return; dead = true; clearInterval(ct); if (guardT) clearInterval(guardT); stopMeter(); groups.forEach(g => { g.srcs.forEach(s => { try { s.stop(); } catch (e) {} }); g.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }); groups = [];
        Object.values(ctl).forEach(c => { try { c.stop(); } catch (e) {} }); try { out.disconnect(); } catch (e) {} },
    };
    return self;
  }
};
