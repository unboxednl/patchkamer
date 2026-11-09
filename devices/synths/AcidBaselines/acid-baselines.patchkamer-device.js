// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.12.0 — Uitleg naar about (menu Over Acid Baselines); de UI toont geen uitlegtekst meer.
// 1.11.3 — Alle continue regelaars zijn stuurbaar: sub, ruis, osc 2, detune 2, ring, filter 2, F2 octaaf, tight, mix en crush deden al mee in de
//   modulatie maar stonden niet in params(), dus Drift en andere modulatoren zagen ze niet. Nu staan ze er allemaal in (standaard uit).
//   Klank en instellingen zijn ongewijzigd.
// 1.11.2 — Meer vervorming en klankbronnen, en de knoppen in zes secties (Oscillator, Filter, Envelope, Slide, Distortion, Output). Alles wat nieuw is staat
//   standaard uit, dus bestaande tunes en songs klinken gelijk:
//   - Vervorming: type (zacht, hard, fold, asym), Tight (bas filteren vóór de vervorming), Mix (nat/droog) en Crush (bitdiepte)
//   - Oscillator: sub-oscillator, ruis, een tweede oscillator met detune en ringmodulatie
//   - Filter: filtertype (lowpass, bandpass, highpass) en een tweede, parallel bandpass-filter met eigen octaafverschuiving
// 1.11.1 — Bewaker tegen een ontspoord filter: bij veel resonantie, filter-FM en een omlaag gemoduleerde cutoff kan het filter instabiel worden
//   (Infinity, daarna NaN) en herstelt het nooit meer, waardoor het apparaat voor altijd stil bleef en NaN naar de rest van de studio stuurde.
//   Nu controleert een meter om de 50 ms de uitvoer van de filterketen; bij NaN, Infinity of een absurde waarde worden de filters vervangen
//   en gaat het geluid door. Instellingen en geluid in het normale gebied zijn ongewijzigd.
// 1.11.0 — Nieuw als Acid Baselines (nieuwe id nl.patchkamer.acidbaselines, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Acid Baselines
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - oversampling van de overdrive volgt host.audio.oversample (§12c)
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
//   - de modulatie-lane heet Bass
// Een basslijn-synth: oscillator, tweevoudig lowpass-filter met resonantie, aparte normal/accent decay, soft attack,
// filter-FM, overdrive en een toonfilter. Eigen 16-staps sequencer met accent en slide, 1–16 sets, een lijnbibliotheek
// en een lijngenerator. Speelt ook noten van een externe sequencer.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pct = v => Math.round(v * 100) + '%';
// vervormingstypen: soft = de oorspronkelijke curve; hard, fold en asym zijn nieuw. d = 0 is altijd schoon.
function distCurve(type, d) {
  if (type === 'soft' || !(d > 0)) return shapeCurve(d * 0.9);
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1; let y;
    if (type === 'hard') y = clamp(x * (1 + d * 24), -1, 1);
    else if (type === 'fold') { const m = (((x * (1 + d * 8) + 1) % 4) + 4) % 4; y = 1 - Math.abs(m - 2); }   // driehoeksvouw: identiek binnen ±1, daarbuiten terugvouwen
    else { const g = 1 + d * 12, b = 0.35 * d; y = (Math.tanh(g * x + b) - Math.tanh(b)) / (Math.tanh(g + b) - Math.tanh(b)); }   // asym
    c[i] = y;
  }
  if (type === 'asym') { let mean = 0, mx = 1e-6; for (let i = 0; i < n; i++) mean += c[i] / n; for (let i = 0; i < n; i++) { c[i] -= mean; mx = Math.max(mx, Math.abs(c[i])); } for (let i = 0; i < n; i++) c[i] /= mx; }   // geen gelijkspanning
  return c;
}
// bitdiepte: een trapjescurve (16 = uit)
function crushCurve(bits) { const n = 8192, L = Math.pow(2, Math.max(2, Math.min(15, Math.round(bits))) - 1), c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.round((i * 2 / n - 1) * L) / L; return c; }
function shapeCurve(k) { const n = 1024, c = new Float32Array(n), a = k * 54; for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = a > 0 ? ((1 + a) * x) / (1 + a * Math.abs(x)) : x; } return c; }

const EN = {
  'Ruis': 'Noise', 'Filtertype': 'Filter type', 'F2 octaaf': 'F2 octave', 'Zacht': 'Soft', 'uit': 'off',
  'Golfvorm': 'Waveform', 'Zaagtand': 'Sawtooth', 'Blok': 'Square', 'Octaaf': 'Octave', 'Stemming': 'Tuning', 'Resonantie': 'Resonance', 'Niveau': 'Level',
  'Slide tijd': 'Slide time', 'Toonfilter': 'Tone filter', 'intern aan': 'internal on', 'Bas': 'Bass',
  'Nieuwe lijn': 'New line', 'Transponeer +': 'Transpose +', 'Transponeer −': 'Transpose −', 'Kopieer maat naar alle': 'Copy bar to all', 'Leeg': 'Clear',
  'stap {0}': 'step {0}', 'Octaaf stap {0}': 'Octave step {0}',
  'Octaaf per stap, bovenop de knop Octaaf': 'Octave per step, on top of the Octave knob',
  'zet dit patroon in de maat die je bewerkt': 'put this pattern in the bar you are editing', 'Patroon kiezen…': 'Choose pattern…',
};
const STEPS = 16, MAXBARS = 16;
// geldige bereiken en keuzes voor setState (§13)
const RANGE = { fine: [-100, 100], cut: [80, 5000], res: [0.5, 28], env: [0, 1], ndec: [0.03, 3], adec: [0.03, 1], acc: [0, 1], soft: [0.001, 0.3], slide: [0.02, 0.6], fm: [0, 1], drive: [0, 1], muf: [500, 12000], vca: [0.1, 4], lvl: [0, 1], sub: [0, 1], noise: [0, 1], osc2: [0, 1], det2: [-100, 100], ring: [0, 1], p2: [0, 1], p2o: [-2, 3], tight: [0, 600], mix: [0, 1], crush: [2, 16] };
const CHOICES = { wave: ['sawtooth', 'square'], oct: [-1, 0, 1], bars: [1, 2, 4, 8, 16], ftype: ['lowpass', 'bandpass', 'highpass'], dtype: ['soft', 'hard', 'fold', 'asym'] };
const NOTES = ['C2', 'C♯2', 'D2', 'E♭2', 'E2', 'F2', 'F♯2', 'G2', 'A♭2', 'A2', 'B♭2', 'B2', 'C3'].map((n, i) => [n, 65.41 * Math.pow(2, i / 12)]);
// slide = glijd vanuit de vorige stap en houd de gate open; dezelfde noot met slide = bindboog
// de twee lijnen waarmee een nieuw apparaat start (niet in de patroonlijst)
const START_LINES = {
  'Zweef': { n: [9, 9, 9, 12, 9, -1, 9, 7, 9, -1, 9, 4, 9, -1, 9, 10], acc: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0], sl: [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1] },
  'Roller': { n: [9, 4, 9, 9, 4, 9, 9, 12, 9, 4, 9, 9, 4, 9, 7, 9], acc: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1], sl: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0] },
};
function genLine() {
  const pool = [9, 9, 9, 9, 4, 7, 12, 12, 2, 10, 5, 0], n = [], acc = [], sl = []; let prev = 9;
  for (let st = 0; st < STEPS; st++) {
    const on = st % 4 === 0 ? 1 : (Math.random() < 0.62 ? 1 : 0); let note = -1;
    if (on) { const r = Math.random(); note = r < 0.45 ? prev : (r < 0.9 ? pool[Math.floor(Math.random() * pool.length)] : clamp(prev + (Math.random() < 0.5 ? 1 : -1), 0, 12)); prev = note; }
    n.push(note);
    const slide = note >= 0 && st > 0 && n[st - 1] >= 0 ? (note === n[st - 1] ? Math.random() < 0.55 : Math.random() < 0.4) : false;
    sl.push(slide ? 1 : 0);
    acc.push(note >= 0 && ((st % 4 === 2 && Math.random() < 0.45) || (st % 4 === 3 && Math.random() < 0.3) || (st === 0 && Math.random() < 0.6)) ? 1 : 0);
  }
  if (n[0] < 0) n[0] = 9; sl[0] = 0;
  return { n, acc, sl, oc: new Array(STEPS).fill(0) };
}
const emptyBar = () => ({ n: new Array(STEPS).fill(-1), acc: new Array(STEPS).fill(0), sl: new Array(STEPS).fill(0), oc: new Array(STEPS).fill(0) });
const copyBar = b => ({ n: b.n.slice(), acc: b.acc.slice(), sl: b.sl.slice(), oc: Array.isArray(b.oc) ? b.oc.slice() : new Array(STEPS).fill(0) });

// Klassieke acid-patronen (eigen werk in de stijl). 16 stappen: getal = noot (0 = C2 … 9 = A2 … 12 = C3), . = rust,
// ! = accent, ~ = slide (glijdt vanuit de vorige stap), ^ = een octaaf hoger, v = een octaaf lager.
function parsePattern(str) {
  const t = str.trim().split(/\s+/), g = emptyBar();
  for (let i = 0; i < STEPS; i++) { const m = /^(\d+)([!~^v]*)$/.exec(t[i] || '.'); if (!m) continue;
    g.n[i] = clamp(+m[1], 0, 12); g.acc[i] = m[2].includes('!') ? 1 : 0; g.sl[i] = m[2].includes('~') && i > 0 ? 1 : 0; g.oc[i] = m[2].includes('^') ? 1 : m[2].includes('v') ? -1 : 0; }
  return g;
}
const PATTERNS = Object.fromEntries([
  ['Rolling',      '9! 9 . 9 12~ 9 . 9 9! . 9 7~ 9 . 5 7~'],
  ['Squelch',      '0! 0 12~ 0 0! . 12 0 0 0! 12~ 0 3~ . 0! 12~'],
  ['Pump',         '9! . 9 . 9! . 9 . 9! . 9 . 9! . 9 9~'],
  ['Climb',        '9! 9 . 10~ . 10 12~ . 12! 10 . 9~ . 7 9! .'],
  ['Stab',         '4! . . 4 . . 4! . 7 . . 7! . 9~ 9 .'],
  ['Bounce',       '9! 9^ 9 9^ 9! 9^ 9 9^ 9! 9^ 9 9^ 7! 7^ 5 5^'],
  ['Hypno',        '9! 9 9 9 9~ 9~ 9~ 9 9! 9 9 9 10~ 10~ 9~ 9'],
  ['Chase',        '9 12 9 12! 9 12 9 12! 7 10 7 10! 5 9 5 9!'],
  ['Walk',         '9! . 7 . 5 . 4 . 5! . 7 . 9~ 12~ 9 .'],
  ['Drop',         '0! . . 0 . . 0! . . 0 . 12~ 0! . 0 0~'],
  ['Wobble',       '9! 9~ 9~ 9 12! 12~ 9~ 9 7! 7~ 7~ 7 10! 10~ 9~ 9'],
  ['Slide run',    '5! 7~ 9~ 10~ 12! 10~ 9~ 7~ 5! 7~ 9~ 10~ 9! 7~ 5~ 4~'],
  ['Offbeat',      '. 9 . 9! . 9 . 9! . 9 . 9! . 9 . 12!'],
  ['Octave jump',  '9! 9v 9^ 9v 9! . 9^ 9v 9! 9v 9^ 9v 7! . 7^ 5v'],
  ['Minor run',    '4! 4 7 4~ 9! 7~ 4 . 4! 4 7 9~ 11! 9~ 7 .'],
  ['Closing',      '9! . 9 . 9! . 9 . 9! 9~ 9 . 12! 10~ 9~ 7~'],
].map(([name, str]) => [name, parsePattern(str)]));


const DEFAULTS = { wave: 'sawtooth', oct: 0, fine: 0, cut: 520, res: 14, env: 0.65, ndec: 0.3, adec: 0.12, acc: 0.7, soft: 0.003, slide: 0.09, fm: 0, drive: 0.35, muf: 7000, vca: 2, lvl: 0.6, seqOn: true, bars: 2, sub: 0, noise: 0, osc2: 0, det2: 0, ring: 0, ftype: 'lowpass', p2: 0, p2o: 0, dtype: 'soft', tight: 0, mix: 1, crush: 16 };

const CSS = `
:host{--a-panel:var(--card-2,#13161b);--a-panel-2:var(--field,#1a1e25);--a-line:var(--line,#2a303a);--a-fg:var(--fg,#d6d9de);--a-muted:var(--muted,#7d8591);--a-accent:#e0a84a;--a-ink:color-mix(in srgb,var(--a-accent) 72%,var(--a-fg));--a-accent-dim:color-mix(in srgb,var(--a-accent) 40%,var(--a-panel-2));--a-danger:var(--stop,#c9452f);--a-disp:'Oswald',system-ui,sans-serif;--a-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;display:block}
*{box-sizing:border-box}
.app{font-family:var(--a-mono);font-size:11px;line-height:1.4;color:var(--a-fg);display:grid;gap:8px}
button{font-family:var(--a-disp);font-size:11px;letter-spacing:.08em;text-transform:uppercase;background:transparent;color:var(--a-fg);border:1px solid var(--a-line);padding:4px 8px;cursor:pointer;border-radius:2px}
button:hover{border-color:var(--a-accent)} button:focus-visible{outline:1px solid var(--a-accent);outline-offset:2px}
.secs{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:8px}
.sec{background:var(--a-panel);border:1px solid var(--a-line);padding:8px 10px;display:grid;gap:6px;align-content:start;min-width:0}
.sec h4{margin:0 0 2px;font-family:var(--a-disp);font-weight:500;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-ink);border-bottom:1px solid var(--a-line);padding-bottom:4px}
.knobs{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px 18px;background:var(--a-panel);border:1px solid var(--a-line);padding:8px 10px}
.k{display:grid;grid-template-columns:82px minmax(0,1fr) 52px;gap:8px;align-items:center;min-width:0}
.k label{color:var(--a-muted);font-size:10px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k output{text-align:right;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;margin:0;appearance:none;height:18px;background:transparent;cursor:pointer;min-width:0}
input[type=range]::-webkit-slider-runnable-track{height:3px;background:var(--a-line)}
input[type=range]::-moz-range-track{height:3px;background:var(--a-line)}
input[type=range]::-webkit-slider-thumb{appearance:none;width:10px;height:15px;margin-top:-6px;background:var(--a-panel-2);border:1px solid var(--a-accent);border-radius:1px}
input[type=range]::-moz-range-thumb{width:9px;height:14px;background:var(--a-panel-2);border:1px solid var(--a-accent);border-radius:1px}
input[type=range]:focus-visible{outline:1px solid var(--a-accent);outline-offset:2px}
select{background:var(--a-panel-2);color:var(--a-fg);border:1px solid var(--a-line);font-family:var(--a-mono);font-size:11px;padding:3px 5px;min-width:0}
.seqbox{background:var(--a-panel);border:1px solid var(--a-line);padding:10px 12px;display:grid;gap:8px}
.head{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.head h3{margin:0 auto 0 0;font-family:var(--a-disp);font-weight:500;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-ink)}
.head label{color:var(--a-muted);font-size:10px;display:flex;gap:4px;align-items:center;cursor:pointer}
input[type=checkbox]{accent-color:var(--a-accent)}
.bars{display:flex;gap:3px;flex-wrap:wrap}
.bars button{font-family:var(--a-mono);font-size:10px;padding:2px 6px;letter-spacing:0;min-width:26px}
.bars button.edit{border-color:var(--a-accent);color:var(--a-ink)} .bars button.play{background:var(--a-accent-dim)}
.roll{overflow-x:auto}
table{border-collapse:separate;border-spacing:3px;width:100%;min-width:560px;table-layout:fixed}
th{font-weight:400;font-size:10px;color:var(--a-muted);text-align:right;padding-right:6px;white-space:nowrap;width:52px}
tr.flag th{color:var(--a-ink)}
.st{width:100%;height:16px;border:1px solid var(--a-line);background:var(--a-panel-2);padding:0;cursor:pointer;border-radius:1px}
.st.q{background:var(--step-q,#20252d)} .st.on{background:var(--a-accent);border-color:var(--a-accent)} .st.cur{box-shadow:inset 0 0 0 2px var(--a-fg)}
tr.flag .st.on{background:var(--a-danger);border-color:var(--a-danger)}
select.oc{width:100%;height:18px;padding:0;font-size:10px;text-align:center;text-align-last:center;border-radius:1px;cursor:pointer}
select.oc.up{background:var(--a-accent);border-color:var(--a-accent);color:#1a0d00} select.oc.down{background:var(--a-accent-dim);border-color:var(--a-accent);color:var(--a-fg)}
.lib{display:flex;flex-wrap:wrap;gap:3px}
.lib button{font-size:10px;padding:3px 6px;letter-spacing:.04em}
`;

// Stuurbare parameters (contract v1.3): id, naam, min, max, log, rol, voorgesteld bereik, standaard aan
const MODP = [
  ['fine', 'Stemming', -100, 100, false, 'pitch', 0.04, true],
  ['cut', 'Cutoff', 80, 5000, true, 'filter', 0.10, true],
  ['res', 'Resonantie', 0.5, 28, false, 'res', 0.10, true],
  ['env', 'Env mod', 0, 1, false, 'env', 0.15, true],
  ['ndec', 'Normal decay', 0.03, 3, true, 'decay', 0.12, true],
  ['acc', 'Accent', 0, 1, false, 'accent', 0.15, false],
  ['adec', 'Accent decay', 0.03, 1, true, 'decay', 0.10, false],
  ['soft', 'Soft attack', 0.001, 0.3, true, 'attack', 0.10, false],
  ['slide', 'Slide tijd', 0.02, 0.6, true, 'glide', 0.10, false],
  ['fm', 'Filter FM', 0, 1, false, 'fm', 0.10, false],
  ['drive', 'Overdrive', 0, 1, false, 'drive', 0.12, false],
  ['muf', 'Toonfilter', 500, 12000, true, 'tone', 0.10, false],
  ['vca', 'VCA decay', 0.1, 4, true, 'decay', 0.10, false],
  ['lvl', 'Niveau', 0, 1, false, 'level', 0.06, false],
  ['sub', 'Sub', 0, 1, false, 'level', 0.10, false],
  ['noise', 'Ruis', 0, 1, false, 'level', 0.10, false],
  ['osc2', 'Osc 2', 0, 1, false, 'level', 0.10, false],
  ['det2', 'Detune 2', -100, 100, false, 'pitch', 0.04, false],
  ['ring', 'Ring', 0, 1, false, 'fm', 0.10, false],
  ['p2', 'Filter 2', 0, 1, false, 'filter', 0.10, false],
  ['p2o', 'F2 octaaf', -2, 3, false, 'filter', 0.06, false],
  ['tight', 'Tight', 0, 600, false, 'filter', 0.08, false],
  ['mix', 'Mix', 0, 1, false, 'level', 0.10, false],
  ['crush', 'Crush', 2, 16, false, 'drive', 0.10, false],
];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));

export default {
  id: 'nl.patchkamer.acidbaselines',
  name: 'Acid Baselines',
  version: '1.12.0',
  kind: 'instrument',
  about: {
    nl: 'Een basslijn-synth: oscillator, tweevoudig lowpass-filter met resonantie, aparte normal/accent decay, soft attack, filter-FM, overdrive en een toonfilter. Eigen 16-staps sequencer met accent en slide, 1–16 sets, een lijnbibliotheek en een lijngenerator. Speelt ook noten van een externe sequencer.\n\nSlide = glijden vanuit de vorige stap met open gate; dezelfde noot met slide is een bindboog. Octaaf = per stap −2…+2 octaven, bovenop de knop Octaaf. Zet "intern" uit om alleen noten van de oranje ingang te spelen (vel > 0,9 = accent, overlappende noten = slide).',
    en: 'A bass-line synth: oscillator, dual lowpass filter with resonance, separate normal/accent decay, soft attack, filter FM, overdrive and a tone filter. Built-in 16-step sequencer with accent and slide, 1–16 sets, a line library and a line generator. Also plays notes from an external sequencer.\n\nSlide = glide from the previous step with the gate open; the same note with slide is a tie. Octave = −2…+2 octaves per step, on top of the Octave knob. Switch "internal" off to play only notes from the orange input (vel > 0.9 = accent, overlapping notes = slide).',
  },
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
    let grid = Array.from({ length: MAXBARS }, emptyBar);
    { const L = START_LINES['Zweef']; grid[0] = copyBar(L); grid[1] = copyBar(START_LINES['Roller']); }
    let editBar = 0, playBar = -1, root = null, refreshers = [], cells = [], flags = { acc: [], sl: [] }, octSel = [], barBtns = [], busyUntil = 0, extGateEnd = 0;

    // ---------- graph ----------
    // bronnen (osc, sub, ruis, osc 2, ringmod) -> fin -> filter 1 -> filter 2 (+ parallel filter 3) -> toonfilter
    //   -> [tight] -> vervorming -> [crush] -> nat; toonfilter -> droog; nat + droog -> VCA -> out
    const osc = ctx.createOscillator(); osc.start();
    const sub = ctx.createOscillator(); sub.type = 'square'; sub.start(); const subG = ctx.createGain(); subG.gain.value = 0; sub.connect(subG);
    const osc2 = ctx.createOscillator(); osc2.start(); const osc2G = ctx.createGain(); osc2G.gain.value = 0; osc2.connect(osc2G);
    const ringM = ctx.createGain(); ringM.gain.value = 0; osc.connect(ringM); osc2.connect(ringM.gain);   // osc × osc 2
    const ringG = ctx.createGain(); ringG.gain.value = 0; ringM.connect(ringG);
    const nz = ctx.createBufferSource(); { const n = Math.max(1, Math.round(ctx.sampleRate * 2)), nb = ctx.createBuffer(1, n, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < n; i++) nd[i] = Math.random() * 2 - 1; nz.buffer = nb; nz.loop = true; }
    nz.start(); const nzG = ctx.createGain(); nzG.gain.value = 0; nz.connect(nzG);
    const fin = ctx.createGain(); osc.connect(fin); subG.connect(fin); osc2G.connect(fin); ringG.connect(fin); nzG.connect(fin);
    const fm = ctx.createGain(); osc.connect(fm);
    let f1, f2, f3, muf, hp, tightOn = false, crushOn = false;
    const f3G = ctx.createGain(); f3G.gain.value = 0;
    const drv = ctx.createWaveShaper(); drv.oversample = (host.audio && host.audio.oversample) || '2x';
    const cr = ctx.createWaveShaper(); cr.oversample = 'none';
    const wetG = ctx.createGain(), dryG = ctx.createGain(); wetG.gain.value = 1; dryG.gain.value = 0;
    // het droge pad omzeilt de vervormer; een begrenzer op ±8 houdt een ontsporend filter eruit (de vervormer deed dat voor het natte pad)
    const dryPre = ctx.createGain(); dryPre.gain.value = 1 / 8; const dryClip = ctx.createWaveShaper(); dryClip.curve = new Float32Array([-1, 1]); dryClip.oversample = 'none';
    const vca = ctx.createGain(); vca.gain.value = 0;
    const out = ctx.createGain();
    const mon = ctx.createAnalyser(); mon.fftSize = 256;
    function mkFilters() {
      f1 = ctx.createBiquadFilter(); f1.type = P.ftype; f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.Q.value = 0.7;
      f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.Q.value = 8;
      muf = ctx.createBiquadFilter(); muf.type = 'lowpass'; muf.Q.value = 0.5;
      hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.Q.value = 0.707;
    }
    function wire() {   // verbindt de keten (opnieuw); tight en crush staan alleen in de keten als ze aan staan
      [fin, f1, f2, f3, f3G, muf, hp, drv, cr, wetG, dryPre, dryClip, dryG, fm].forEach(n => { try { n.disconnect(); } catch (e) {} });
      fm.connect(f1.frequency);
      fin.connect(f1); f1.connect(f2); f2.connect(muf);
      fin.connect(f3); f3.connect(f3G); f3G.connect(muf);
      if (tightOn) { muf.connect(hp); hp.connect(drv); } else muf.connect(drv);
      if (crushOn) { drv.connect(cr); cr.connect(wetG); } else drv.connect(wetG);
      muf.connect(mon); wetG.connect(vca); muf.connect(dryPre); dryPre.connect(dryClip); dryClip.connect(dryG); dryG.connect(vca); vca.connect(out);
    }
    mkFilters(); wire();

    // bewaker (kijkt naar de ruwe filteruitvoer, voor de vervormer die een ontsporing anders verbergt): een instabiel filter geeft Infinity en daarna NaN en herstelt nooit meer; dan vervangen we de filters
    const chk = new Float32Array(256); let rebuilt = 0, dead = false;
    function rebuildFilters() { mkFilters(); busyUntil = 0; rebuilt++; wire(); apply(); }
    function guard() {
      if (dead) return; mon.getFloatTimeDomainData(chk);
      for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) { rebuildFilters(); return; }   // ruwe filteruitvoer: normaal tot ±15, een ontspoord filter loopt in tientallen ms naar 1e6
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    // knopstand + modulatie (contract v1.3); de knoppen blijven de basis
    const mod = {};
    const E = k => { const m = MODBY[k], b = +P[k], o = mod[k] || 0; if (!m || !o) return b; const [, , mn, mx, log] = m; return log ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    let lastDist = '', lastCrush = -1;
    function apply() {
      const t = ctx.currentTime, r = 0.02, cut = E('cut');
      osc.type = P.wave; osc.detune.setTargetAtTime(E('fine'), t, 0.05); f1.Q.setTargetAtTime(E('res'), t, r); f2.frequency.setTargetAtTime(Math.min(20000, cut * 2.5 + 600), t, r);
      if (t > busyUntil) f1.frequency.setTargetAtTime(cut, t, r);
      fm.gain.setTargetAtTime(E('fm') * 1800, t, r); muf.frequency.setTargetAtTime(E('muf'), t, r);
      const d = Math.round(E('drive') * 200) / 200, dk = P.dtype + ':' + d; if (dk !== lastDist) { drv.curve = distCurve(P.dtype, d); lastDist = dk; }   // nieuwe curve alleen als hij echt verandert
      out.gain.setTargetAtTime(E('lvl') * 0.5, t, r);
      // nieuwe regelaars: bronnen, filter 2, tight, mix en crush (standaard uit)
      sub.detune.setTargetAtTime(E('fine'), t, 0.05); osc2.type = P.wave; osc2.detune.setTargetAtTime(E('fine') + E('det2'), t, 0.05);
      subG.gain.setTargetAtTime(E('sub'), t, r); nzG.gain.setTargetAtTime(E('noise') * 0.5, t, r); osc2G.gain.setTargetAtTime(E('osc2'), t, r); ringG.gain.setTargetAtTime(E('ring'), t, r);
      if (f1.type !== P.ftype) f1.type = P.ftype;
      f3G.gain.setTargetAtTime(E('p2') * 4, t, r); if (t > busyUntil) f3.frequency.setTargetAtTime(clamp(cut * Math.pow(2, E('p2o')), 40, 18000), t, r);
      hp.frequency.setTargetAtTime(Math.max(20, E('tight')), t, r);
      wetG.gain.setTargetAtTime(E('mix'), t, r); dryG.gain.setTargetAtTime(8 * (1 - E('mix')), t, r);
      const cb = Math.round(E('crush')); if (cb !== lastCrush) { if (cb < 16) cr.curve = crushCurve(cb); lastCrush = cb; }
      const tOn = E('tight') > 0, cOn = cb < 16; if (tOn !== tightOn || cOn !== crushOn) { tightOn = tOn; crushOn = cOn; wire(); }
    }
    apply();

    // one note: f in Hz, accent, slide-from-previous, start time, gate length (null = until next note decides)
    function play(f, acc, slide, t, gateLen) {
      osc.frequency.cancelScheduledValues(t);
      if (slide) osc.frequency.setTargetAtTime(f, t, E('slide') / 3); else osc.frequency.setValueAtTime(f, t);
      const base = E('cut'), peak = Math.min(16000, base + E('env') * (acc ? 5500 + E('acc') * 4000 : 4000)), dec = acc ? E('adec') : E('ndec');
      f1.frequency.cancelScheduledValues(t);
      if (!slide) { f1.frequency.setValueAtTime(base, t); f1.frequency.linearRampToValueAtTime(peak, t + 0.004); f1.frequency.setTargetAtTime(base, t + 0.004, dec / 3); }
      // sub, osc 2 en filter 2 volgen de noot en de envelope
      sub.frequency.cancelScheduledValues(t); osc2.frequency.cancelScheduledValues(t); f3.frequency.cancelScheduledValues(t);
      if (slide) { sub.frequency.setTargetAtTime(f * 0.5, t, E('slide') / 3); osc2.frequency.setTargetAtTime(f, t, E('slide') / 3); } else { sub.frequency.setValueAtTime(f * 0.5, t); osc2.frequency.setValueAtTime(f, t); }
      if (!slide) { const q = Math.pow(2, E('p2o')), fq = v => clamp(v * q, 40, 18000); f3.frequency.setValueAtTime(fq(base), t); f3.frequency.linearRampToValueAtTime(fq(peak), t + 0.004); f3.frequency.setTargetAtTime(fq(base), t + 0.004, dec / 3); }
      const lvl = acc ? 1 + E('acc') * 0.8 : 0.75, atk = E('soft');
      vca.gain.cancelScheduledValues(t);
      if (!slide) { vca.gain.setValueAtTime(0.0001, t); vca.gain.linearRampToValueAtTime(lvl, t + atk); } else vca.gain.setValueAtTime(lvl, t);
      vca.gain.setTargetAtTime(lvl * 0.3, t + atk, E('vca') / 3);
      if (gateLen !== null) vca.gain.setTargetAtTime(0, t + gateLen, 0.008);
      busyUntil = t + Math.max(gateLen || 0, dec) + 0.05;
    }

    // ---------- UI ----------
    const fmt = { fine: v => (v > 0 ? '+' : '') + Math.round(v) + ' ct', cut: v => Math.round(v) + ' Hz', res: v => (+v).toFixed(1), env: pct, ndec: v => (+v).toFixed(2) + ' s', adec: v => (+v).toFixed(2) + ' s', acc: pct, soft: v => Math.round(v * 1000) + ' ms', slide: v => (+v).toFixed(2) + ' s', fm: pct, drive: pct, muf: v => Math.round(v) + ' Hz', vca: v => (+v).toFixed(2) + ' s', lvl: pct, sub: pct, noise: pct, osc2: pct, det2: v => (v > 0 ? '+' : '') + Math.round(v) + ' ct', ring: pct, p2: pct, p2o: v => (v > 0 ? '+' : '') + (+v).toFixed(1) + ' oct', tight: v => (v > 0 ? Math.round(v) + ' Hz' : tx('uit')), mix: pct, crush: v => (v >= 16 ? tx('uit') : Math.round(v) + ' bit') };
    function knob(parent, key, label, [mn, mx, st]) {
      const w = document.createElement('div'); w.className = 'k'; const l = document.createElement('label'), i = document.createElement('input'), o = document.createElement('output');
      const id = 'k-' + key; l.textContent = tx(label); l.htmlFor = id; i.id = id; i.type = 'range'; i.min = mn; i.max = mx; i.step = st; i.dataset.pkDefault = String(DEFAULTS[key]);
      i.oninput = () => { P[key] = +i.value; o.textContent = fmt[key](P[key]); apply(); };
      w.append(l, i, o); parent.appendChild(w); refreshers.push(() => { i.value = P[key]; o.textContent = fmt[key](P[key]); });
    }
    function choose(parent, key, label, opts, num, after) {
      const w = document.createElement('div'); w.className = 'k'; w.style.gridTemplateColumns = '82px minmax(0,1fr)'; const l = document.createElement('label'), s = document.createElement('select'); const id = 's-' + key; l.textContent = tx(label); l.htmlFor = id; s.id = id;
      opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = tx(t); s.appendChild(o); });
      s.onchange = () => { P[key] = num ? +s.value : s.value; apply(); after && after(); }; w.append(l, s); parent.appendChild(w); refreshers.push(() => { s.value = P[key]; });
    }
    const refreshAll = () => refreshers.forEach(f => f());
    function paint() {
      if (!root) return; const nb = +P.bars;
      barBtns.forEach((b, i) => { b.hidden = i >= nb; b.classList.toggle('edit', i === editBar); b.classList.toggle('play', i === playBar); });
      if (editBar >= nb) { editBar = 0; return paint(); }
      const g = grid[editBar];
      cells.forEach((row, ni) => row.forEach((b, s) => b.classList.toggle('on', g.n[s] === ni)));
      flags.acc.forEach((b, s) => b.classList.toggle('on', !!g.acc[s])); flags.sl.forEach((b, s) => b.classList.toggle('on', !!g.sl[s]));
      octSel.forEach((o, s) => { const v = +g.oc[s] || 0; o.value = String(v); o.classList.toggle('up', v > 0); o.classList.toggle('down', v < 0); });
    }
    function cursor(s) { cells.forEach(row => row.forEach((b, i) => b.classList.toggle('cur', i === s))); }

    return {
      inputs: {}, outputs: { out },
      mount(el) {
        refreshers = []; cells = []; flags = { acc: [], sl: [] }; octSel = []; barBtns = [];
        const wrap = document.createElement('div'); el.appendChild(wrap); root = wrap.attachShadow({ mode: 'open' }); root.innerHTML = `<style>${CSS}</style>`;
        const app = document.createElement('div'); app.className = 'app'; root.appendChild(app);
        const secs = document.createElement('div'); secs.className = 'secs'; app.appendChild(secs);
        const sec = t => { const d = document.createElement('div'); d.className = 'sec'; const h = document.createElement('h4'); h.textContent = tx(t); d.appendChild(h); secs.appendChild(d); return d; };
        let kb = sec('Oscillator');
        choose(kb, 'wave', 'Golfvorm', [['sawtooth', 'Zaagtand'], ['square', 'Blok']]);
        choose(kb, 'oct', 'Octaaf', [[-1, '−1'], [0, '0'], [1, '+1']], true);
        knob(kb, 'fine', 'Stemming', [-100, 100, 1]); knob(kb, 'sub', 'Sub', [0, 1, 0.01]); knob(kb, 'noise', 'Ruis', [0, 1, 0.01]);
        knob(kb, 'osc2', 'Osc 2', [0, 1, 0.01]); knob(kb, 'det2', 'Detune 2', [-100, 100, 1]); knob(kb, 'ring', 'Ring', [0, 1, 0.01]);
        kb = sec('Filter');
        choose(kb, 'ftype', 'Filtertype', [['lowpass', 'Lowpass'], ['bandpass', 'Bandpass'], ['highpass', 'Highpass']]);
        knob(kb, 'cut', 'Cutoff', [80, 5000, 1]); knob(kb, 'res', 'Resonantie', [0.5, 28, 0.1]); knob(kb, 'env', 'Env mod', [0, 1, 0.01]); knob(kb, 'fm', 'Filter FM', [0, 1, 0.01]);
        knob(kb, 'p2', 'Filter 2', [0, 1, 0.01]); knob(kb, 'p2o', 'F2 octaaf', [-2, 3, 0.1]);
        kb = sec('Envelope');
        knob(kb, 'acc', 'Accent', [0, 1, 0.01]); knob(kb, 'ndec', 'Normal decay', [0.03, 3, 0.01]); knob(kb, 'adec', 'Accent decay', [0.03, 1, 0.01]);
        knob(kb, 'soft', 'Soft attack', [0.001, 0.3, 0.001]); knob(kb, 'vca', 'VCA decay', [0.1, 4, 0.01]);
        kb = sec('Slide'); knob(kb, 'slide', 'Slide tijd', [0.02, 0.6, 0.01]);
        kb = sec('Distortion');
        choose(kb, 'dtype', 'Type', [['soft', 'Zacht'], ['hard', 'Hard'], ['fold', 'Fold'], ['asym', 'Asym']]);
        knob(kb, 'drive', 'Overdrive', [0, 1, 0.01]); knob(kb, 'tight', 'Tight', [0, 600, 5]); knob(kb, 'mix', 'Mix', [0, 1, 0.01]); knob(kb, 'crush', 'Crush', [2, 16, 1]); knob(kb, 'muf', 'Toonfilter', [500, 12000, 10]);
        kb = sec('Output'); knob(kb, 'lvl', 'Niveau', [0, 1, 0.01]);
        const sb = document.createElement('div'); sb.className = 'seqbox'; app.appendChild(sb);
        const head = document.createElement('div'); head.className = 'head'; sb.appendChild(head);
        const h3 = document.createElement('h3'); h3.textContent = 'Sequencer'; head.appendChild(h3);
        const tl = document.createElement('label'), tc = document.createElement('input'); tc.type = 'checkbox'; tc.onchange = () => { P.seqOn = tc.checked; }; tl.append(tc, document.createTextNode(tx('intern aan'))); head.appendChild(tl); refreshers.push(() => { tc.checked = !!P.seqOn; });
        const setsWrap = document.createElement('div'); setsWrap.style.minWidth = '170px'; head.appendChild(setsWrap);
        choose(setsWrap, 'bars', 'Sets', [[1, '1 × 16'], [2, '2 × 16'], [4, '4 × 16'], [8, '8 × 16'], [16, '16 × 16']], true, paint);
        const bars = document.createElement('div'); bars.className = 'bars'; sb.appendChild(bars);
        for (let b = 0; b < MAXBARS; b++) { const bt = document.createElement('button'); bt.textContent = b + 1; bt.onclick = () => { editBar = b; paint(); }; bars.appendChild(bt); barBtns.push(bt); }
        const rw = document.createElement('div'); rw.className = 'roll'; const tb = document.createElement('table'); rw.appendChild(tb); sb.appendChild(rw);
        [...NOTES].reverse().forEach(([n], ri) => { const ni = NOTES.length - 1 - ri, tr = document.createElement('tr'), th = document.createElement('th'); th.textContent = n; tr.appendChild(th); cells[ni] = [];
          for (let s = 0; s < STEPS; s++) { const td = document.createElement('td'), b = document.createElement('button'); b.className = 'st' + (s % 4 === 0 ? ' q' : ''); b.setAttribute('aria-label', `${n} ${tx('stap {0}', s + 1)}`);
            b.onclick = () => { const g = grid[editBar]; g.n[s] = g.n[s] === ni ? -1 : ni; paint(); }; td.appendChild(b); tr.appendChild(td); cells[ni][s] = b; }
          tb.appendChild(tr); });
        [['acc', 'Accent'], ['sl', 'Slide']].forEach(([k, lab]) => { const tr = document.createElement('tr'); tr.className = 'flag'; const th = document.createElement('th'); th.textContent = tx(lab); tr.appendChild(th);
          for (let s = 0; s < STEPS; s++) { const td = document.createElement('td'), b = document.createElement('button'); b.className = 'st' + (s % 4 === 0 ? ' q' : ''); b.setAttribute('aria-label', `${tx(lab)} ${tx('stap {0}', s + 1)}`);
            b.onclick = () => { grid[editBar][k][s] ^= 1; paint(); }; td.appendChild(b); tr.appendChild(td); flags[k][s] = b; }
          tb.appendChild(tr); });
        { const tr = document.createElement('tr'); tr.className = 'flag oct'; const th = document.createElement('th'); th.textContent = tx('Octaaf'); th.title = tx('Octaaf per stap, bovenop de knop Octaaf'); tr.appendChild(th);
          for (let s = 0; s < STEPS; s++) { const td = document.createElement('td'), sel = document.createElement('select'); sel.className = 'oc'; sel.setAttribute('aria-label', tx('Octaaf stap {0}', s + 1));
            [[2, '+2'], [1, '+1'], [0, '0'], [-1, '−1'], [-2, '−2']].forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); });
            sel.onchange = () => { grid[editBar].oc[s] = +sel.value; paint(); }; td.appendChild(sel); tr.appendChild(td); octSel[s] = sel; }
          tb.appendChild(tr); }
        const lib = document.createElement('div'); lib.className = 'lib'; sb.appendChild(lib);
        { const ps = document.createElement('select'); ps.className = 'pat'; ps.title = tx('zet dit patroon in de maat die je bewerkt'); ps.setAttribute('aria-label', tx('Patroon kiezen…'));
          const ph = document.createElement('option'); ph.value = ''; ph.textContent = tx('Patroon kiezen…'); ps.appendChild(ph);
          Object.keys(PATTERNS).forEach((n, i) => { const o = document.createElement('option'); o.value = n; o.textContent = String(i + 1).padStart(2, '0') + ' · ' + n; ps.appendChild(o); });
          ps.onchange = () => { if (PATTERNS[ps.value]) { grid[editBar] = copyBar(PATTERNS[ps.value]); paint(); } ps.value = ''; }; lib.appendChild(ps); }
        const lib2 = document.createElement('div'); lib2.className = 'lib'; sb.appendChild(lib2);
        [['Nieuwe lijn', () => { grid[editBar] = genLine(); }],
         ['Transponeer +', () => { const g = grid[editBar]; g.n = g.n.map(x => x < 0 ? x : (x + 2) % 13); }],
         ['Transponeer −', () => { const g = grid[editBar]; g.n = g.n.map(x => x < 0 ? x : (x + 11) % 13); }],
         ['Kopieer maat naar alle', () => { for (let b = 0; b < MAXBARS; b++) if (b !== editBar) grid[b] = copyBar(grid[editBar]); }],
         ['Leeg', () => { grid[editBar] = emptyBar(); }]]
          .forEach(([n, f]) => { const b = document.createElement('button'); b.textContent = tx(n); b.onclick = () => { f(); paint(); }; lib2.appendChild(b); });
        refreshAll(); paint();
      },
      unmount() { root = null; },
      onStep({ step, bar, time, stepDur }) {
        try {
          if (!P.seqOn) return;
          const nb = +P.bars, b = bar % nb, g = grid[b], ni = g.n[step];
          if (root) setTimeout(() => { if (step === 0) { playBar = b; paint(); } cursor(step); }, Math.max(0, (time - ctx.currentTime) * 1000));
          if (ni < 0) return;
          const f = NOTES[ni][1] * Math.pow(2, +P.oct + (+g.oc[step] || 0));
          const ns = (step + 1) % STEPS, nbIdx = ns === 0 ? (bar + 1) % nb : b, holds = grid[nbIdx].sl[ns] && grid[nbIdx].n[ns] >= 0;
          play(f, !!g.acc[step], !!g.sl[step], time, holds ? null : stepDur * 0.62);
        } catch (e) { console.warn('Acid Baselines', e); }
      },
      onTransport({ playing }) {
        if (!playing) { const t = ctx.currentTime; vca.gain.cancelScheduledValues(t); vca.gain.setTargetAtTime(0, t, 0.02); playBar = -1; cursor(-1); paint(); }
      },
      onEvent(port, ev) {
        try {
          if (port === 'notes' && ev.type === 'note') {
            const t = ev.time ?? ctx.currentTime, slide = ev.slide === true || (extGateEnd > t + 0.001);
            play(440 * Math.pow(2, (ev.note - 69 + 12 * P.oct) / 12), (ev.vel ?? 0.7) > 0.9, slide, t, ev.dur ?? 0.12);
            extGateEnd = t + (ev.dur ?? 0.12);
          }
          if (port === 'cc' && ev.type === 'cc') {
            const v = clamp(+ev.value || 0, 0, 1);
            if (ev.id === 'cutoff') P.cut = Math.round(80 + v * 4920);
            else if (ev.id === 'res') P.res = 0.5 + v * 27.5;
            else if (ev.id === 'env') P.env = v;
            else if (ev.id === 'drive') P.drive = v;
            else if (ev.id === 'level') P.lvl = v;
            else return;
            apply(); refreshAll();
          }
        } catch (e) { console.warn('Acid Baselines', e); }
      },
      // contract v1.3 — wat een modulator (bijvoorbeeld Drift) mag laten bewegen; één spoor
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'bass', laneName: tx('Bas'), min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(offsets) { for (const k in mod) delete mod[k]; for (const k in offsets || {}) if (MODBY[k]) mod[k] = offsets[k]; apply(); },
      getState() { return { ...P, grid: grid.map(copyBar) }; },
      setState(s) {
        s = s || {};
        Object.keys(DEFAULTS).forEach(k => {
          const v = s[k];
          if (RANGE[k]) P[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, RANGE[k][0], RANGE[k][1]) : DEFAULTS[k];
          else if (CHOICES[k]) P[k] = CHOICES[k].includes(v) ? v : DEFAULTS[k];
          else P[k] = typeof v === 'boolean' ? v : DEFAULTS[k];
        });
        if (Array.isArray(s.grid)) grid = Array.from({ length: MAXBARS }, (_, b) => { const g = s.grid[b]; if (!g) return emptyBar(); const e = emptyBar(); ['n', 'acc', 'sl'].forEach(k => { if (Array.isArray(g[k])) for (let i = 0; i < STEPS; i++) { const x = Math.round(+g[k][i]); if (Number.isFinite(x)) e[k][i] = k === 'n' ? clamp(x, -1, 12) : clamp(x, 0, 1); } }); if (Array.isArray(g.oc)) for (let i = 0; i < STEPS; i++) { const v = Math.round(+g.oc[i]); if (Number.isFinite(v)) e.oc[i] = clamp(v, -2, 2); } return e; });
        else { grid = Array.from({ length: MAXBARS }, emptyBar); grid[0] = copyBar(START_LINES['Zweef']); grid[1] = copyBar(START_LINES['Roller']); }
        apply(); refreshAll(); paint();
      },
      destroy() { dead = true; if (guardT) clearInterval(guardT); [osc, sub, osc2, nz].forEach(o => { try { o.stop(); } catch (e) {} }); try { mon.disconnect(); } catch (e) {} try { out.disconnect(); } catch (e) {} },
    };
  },
};
