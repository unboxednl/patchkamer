// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Nieuw: Formant Singer, een zangsynth voor Patchkamer contract v1.13. Een tekst (lyrics) plus noten geven een zingende stem:
//   elke noot zingt de volgende lettergreep, op de toonhoogte, lengte en velocity van die noot. Alles met Web Audio in dit ene bestand,
//   zonder netwerk en zonder modellen: formant-/bronfiltersynthese.
//   - bron: bandbegrensde PeriodicWave (harmonischen 1/n^k, k volgt Helderheid) plus ruis (Adem), per stem een koor van 1 tot 8 leden
//   - filters: vijf parallelle bandpass-formantfilters (F1-F5) met een tabel per klinker voor man, vrouw en kind; tussen klinkers glijden
//     ze met setTargetAtTime (tijdconstante volgt Glijtijd en de duur van de noot)
//   - medeklinkers: stemloze/stemhebbende fricatieven (gefilterde ruis), plosieven (sluiting, burst, aspiratie), nasalen, liquids en glides
//   - lettergrepen: een eenvoudige grafeem-naar-foneemregel voor Engels en Nederlands, of klanken direct (lang 'phon')
//   - mono (legato, glijden) of poly (tot 8 noten, afkappen met een zachte release)
//   - bewaker tegen niet-eindige waarden: een AnalyserNode op de ruwe optelling van de stemmen en op de uitgang; geeft die een
//     niet-eindige of absurde waarde (> 100), dan worden alle stemmen (met hun filters) en de uitgangsvervormer vervangen.
//     De timer staat uit in een OfflineAudioContext. Alle ingangen, events en state zijn eindig en begrensd.
//   - de uitgangsvervormer volgt host.audio.oversample (§12c)

const EN = {
  'Formant Singer · zang met tekst': 'Formant Singer · singing from lyrics',
  'Tekst': 'Lyrics', 'Taal': 'Language', 'Stem': 'Voice', 'Spel': 'Mode', 'Einde van de tekst': 'End of lyrics',
  'Vaste klinker': 'Fixed vowel', 'Klinker': 'Vowel',
  'Nederlands': 'Dutch', 'English': 'English', 'Klanken': 'Phonemes',
  'Sopraan': 'Soprano', 'Alt': 'Alto', 'Tenor': 'Tenor', 'Bas': 'Bass', 'Kind': 'Child', 'Gefluister': 'Whisper', 'Eigen': 'Custom',
  'Mono (legato)': 'Mono (legato)', 'Polyfoon': 'Poly',
  'Herhalen': 'Loop', 'Aanhouden': 'Hold', 'Stoppen': 'Stop',
  'Formantverschuiving': 'Formant shift', 'Vibratosnelheid': 'Vibrato rate', 'Vibratodiepte': 'Vibrato depth', 'Vibratovertraging': 'Vibrato delay',
  'Glijtijd': 'Glide', 'Opkomst': 'Attack', 'Uitklank': 'Release', 'Adem': 'Breath', 'Helderheid': 'Brightness', 'Koorstemmen': 'Choir voices',
  'Stereobreedte': 'Stereo spread', 'Verstemming': 'Detune', 'Medeklinkers': 'Consonants', 'Beginmedeklinker': 'Onset length', 'Uitgang': 'Output',
  'Stem & bron': 'Voice & source', 'Beweging': 'Movement', 'Spraak': 'Speech', 'Niveau': 'Level',
  'Herstart': 'Restart', 'Proef': 'Test', 'Alles uit': 'All off',
  'Lettergrepen': 'Syllables', 'volgende': 'next',
  'Elke noot zingt de volgende lettergreep. Spatie, - of | scheidt lettergrepen; _ of ~ = melisma (klinker doorzingen); * of . = rust. Taal Klanken: schrijf klanken direct, bijvoorbeeld ha-lo of shaet.':
    'Each note sings the next syllable. Space, - or | separates syllables; _ or ~ = melisma (keep the vowel); * or . = rest. Language Phonemes: write sounds directly, for example ha-lo or shaet.',
  'Lettergreep {0} van {1}': 'Syllable {0} of {1}', 'Geen tekst: vaste klinker': 'No lyrics: fixed vowel', 'Einde van de tekst': 'End of lyrics',
  'Mod actief · {0} parameters': 'Mod active · {0} parameters', 'Mod gereed · verbind een paarse sturingskabel': 'Mod ready · connect a purple control cable',
  'Spectrum van de uitgang met F1 en F2 van de laatste klinker': 'Output spectrum with F1 and F2 of the last vowel',
  'a – spa': 'a – spa', 'ae – kat': 'ae – cat', 'e – bed': 'e – bed', 'ee – veel': 'ee – Dutch veel', 'i – zie': 'i – see', 'ih – bit': 'ih – sit',
  'o – boom': 'o – oh', 'aw – bot': 'aw – law', 'u – boek': 'u – moon', 'oo – hoed': 'oo – foot', 'y – uur': 'y – Dutch uur', 'oe – deur': 'oe – Dutch deur',
  'uh – de': 'uh – cup', 'er – her': 'er – her',
  'Voorbeeld': 'Example'
};

// ---------------------------------------------------------------------------------------------------------------------
// Klanken. Klinkertabel: formanten F1-F3 in Hz voor man, vrouw en kind. Voor a, ae, e, i, ih, aw, u, oo, er zijn het de gangbare
// gemiddelden uit de klassieke klinkermetingen uit de jaren vijftig; de overige klinkers zijn daar tussen gezet of afgeleid.
// F4 en F5 staan per tabel vast. Bandbreedtes en gewichten staan bij BW en GAIN.
// ---------------------------------------------------------------------------------------------------------------------
const VOW = {};
{
  const P = {
    a: [[730, 1090, 2440], [850, 1220, 2810], [1030, 1370, 3170]],
    ae: [[660, 1720, 2410], [860, 2050, 2850], [1010, 2320, 3320]],
    e: [[530, 1840, 2480], [610, 2330, 2990], [690, 2610, 3570]],
    i: [[270, 2290, 3010], [310, 2790, 3310], [370, 3200, 3730]],
    ih: [[390, 1990, 2550], [430, 2480, 3070], [530, 2730, 3600]],
    aw: [[570, 840, 2410], [590, 920, 2710], [680, 1060, 3180]],
    u: [[300, 870, 2240], [370, 950, 2670], [430, 1190, 3280]],
    oo: [[440, 1020, 2240], [470, 1160, 2680], [560, 1410, 3310]],
    er: [[490, 1350, 1690], [500, 1640, 1960], [560, 1820, 2160]]
  };
  const D = { ee: [400, 2100, 2700], o: [450, 800, 2500], y: [280, 1750, 2300], oe: [400, 1550, 2350], uh: [580, 1300, 2450] };
  const FW = [1.17, 1.15, 1.12], FC = [1.4, 1.3, 1.3];
  for (const k of Object.keys(P)) VOW[k] = P[k];
  for (const k of Object.keys(D)) VOW[k] = [D[k], D[k].map((x, i) => Math.round(x * FW[i])), D[k].map((x, i) => Math.round(x * FC[i]))];
}
const TAB = { m: 0, f: 1, c: 2 };
const F45 = [[3400, 4500], [4000, 5000], [4400, 5400]];
const BW = [70, 90, 130, 170, 220];
const GAIN = [1, 0.85, 0.6, 0.35, 0.2];
const LOCFAC = [1, 1.17, 1.38];   // formantfactor van de tabel ten opzichte van man, voor de plaats (locus) van medeklinkers
const VOICE = {
  soprano: { tab: 'f', k: 1.04, track: true }, alto: { tab: 'f', k: 0.97, track: true }, tenor: { tab: 'm', k: 1.03, track: false },
  bass: { tab: 'm', k: 0.88, track: false }, child: { tab: 'c', k: 1, track: true }, whisper: { tab: 'm', k: 1, track: false },
  custom: { tab: 'm', k: 1, track: false }
};
const DIPH = { ai: ['a', 'ih'], ei: ['e', 'ih'], au: ['a', 'oo'], ou: ['o', 'oo'], oi: ['aw', 'ih'], ui: ['oe', 'y'] };
const VOWELS = Object.keys(VOW);
const VOICES = Object.keys(VOICE);
const LANGS = ['en', 'nl', 'phon'], MODES = ['mono', 'poly'], ONENDS = ['loop', 'hold', 'stop'];
// Medeklinkers. ty: fr = fricatief, as = aspiratie, pl = plosief, na = nasaal, li = liquid/glide. v: stemhebbend. d: duur in ms.
// nf/nq: ruisfilter; ng: ruisniveau ten opzichte van de klinker; bf/bq/bg: burst; loc: plaats van F1-F3 (man).
const CONS = {
  s: { ty: 'fr', v: 0, d: 95, nf: 6800, nq: 1, ng: 0.7 }, sh: { ty: 'fr', v: 0, d: 105, nf: 3400, nq: 1.1, ng: 0.8 },
  f: { ty: 'fr', v: 0, d: 80, nf: 5600, nq: 0.4, ng: 0.35 }, th: { ty: 'fr', v: 0, d: 80, nf: 6200, nq: 0.4, ng: 0.25 },
  x: { ty: 'fr', v: 0, d: 95, nf: 2400, nq: 0.7, ng: 0.6 }, h: { ty: 'as', v: 0, d: 70, ng: 0.8 },
  v: { ty: 'fr', v: 1, d: 70, nf: 5200, nq: 0.4, ng: 0.2, loc: [260, 1100, 2300] }, z: { ty: 'fr', v: 1, d: 80, nf: 6800, nq: 1, ng: 0.35, loc: [260, 1800, 2700] },
  zh: { ty: 'fr', v: 1, d: 90, nf: 3400, nq: 1.1, ng: 0.4, loc: [260, 1700, 2400] }, dh: { ty: 'fr', v: 1, d: 65, nf: 6200, nq: 0.4, ng: 0.12, loc: [260, 1500, 2500] },
  p: { ty: 'pl', v: 0, d: 80, bf: 1000, bq: 0.6, bg: 0.6, loc: [350, 900, 2200] }, t: { ty: 'pl', v: 0, d: 75, bf: 4800, bq: 0.9, bg: 0.7, loc: [350, 1800, 2650] },
  k: { ty: 'pl', v: 0, d: 85, bf: 2000, bq: 1, bg: 0.6, loc: [320, 1500, 2300] }, b: { ty: 'pl', v: 1, d: 65, bf: 900, bq: 0.6, bg: 0.3, loc: [300, 850, 2200] },
  d: { ty: 'pl', v: 1, d: 60, bf: 4200, bq: 0.9, bg: 0.3, loc: [300, 1750, 2600] }, g: { ty: 'pl', v: 1, d: 65, bf: 1800, bq: 1, bg: 0.3, loc: [300, 1450, 2200] },
  m: { ty: 'na', v: 1, d: 70, loc: [250, 1100, 2200] }, n: { ty: 'na', v: 1, d: 65, loc: [250, 1700, 2600] }, ng: { ty: 'na', v: 1, d: 75, loc: [250, 2000, 2800] },
  l: { ty: 'li', v: 1, d: 70, loc: [360, 1300, 2800] }, r: { ty: 'li', v: 1, d: 70, loc: [420, 1250, 1650] },
  j: { ty: 'li', v: 1, d: 55, loc: [270, 2250, 3000] }, w: { ty: 'li', v: 1, d: 60, loc: [300, 750, 2200] }
};
const TOKENS = [...VOWELS, ...Object.keys(DIPH), ...Object.keys(CONS), 'ch', 'jh'].sort((a, b) => b.length - a.length);
const EXPAND = { ch: ['t', 'sh'], jh: ['d', 'zh'] };

// ---------------------------------------------------------------------------------------------------------------------
// Lettergrepen: tekst -> [{ t: weergave, k: 's' (zingen) | 'r' (rust) | 't' (melisma), on: [medeklinkers], nuc: [klinkers], off: [medeklinkers] }]
// ---------------------------------------------------------------------------------------------------------------------
const REST = { t: '*', k: 'r', on: [], nuc: [], off: [] }, TIE = { t: '_', k: 't', on: [], nuc: [], off: [] };

function phonTokens(str) {
  const out = []; let i = 0;
  while (i < str.length) {
    if (str[i] === "'") { i++; continue; }
    let m = null;
    for (const n of TOKENS) if (str.startsWith(n, i)) { m = n; break; }
    if (!m) { i++; continue; }
    out.push(m); i += m.length;
  }
  return out;
}
function syllableFromTokens(toks, text) {
  const on = [], nuc = [], off = []; let phase = 0;
  for (const t of toks) {
    if (VOW[t] || DIPH[t]) { if (phase < 2) { nuc.push(...(DIPH[t] || [t])); phase = 1; } }
    else { const list = EXPAND[t] || [t]; if (phase === 0) on.push(...list); else { off.push(...list); phase = 2; } }
  }
  if (nuc.length > 2) nuc.splice(1, nuc.length - 2);
  return { t: text, k: 's', on, nuc, off };
}
const phonSyllables = (str, text) => str.split('-').filter(Boolean).map((p, i) => syllableFromTokens(phonTokens(p), i ? '·' : text));

const isV = (c) => 'aeiou'.includes(c);
// welke letters horen bij een klinkergroep
function vowelMask(w, lang) {
  const m = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i], nx = w[i + 1] || '', pv = w[i - 1] || '';
    let v = isV(c);
    if (c === 'y') v = lang === 'nl' ? !isV(nx) || i > 0 : i > 0 && !isV(nx);
    else if (c === 'w' && lang === 'en') v = i > 0 && 'aeo'.includes(pv) && !isV(nx);
    else if (c === 'j' && lang === 'nl') v = pv === 'i' && !isV(nx);
    m.push(v);
  }
  return m;
}
const UNITS = { en: ['tch', 'sch', 'ch', 'sh', 'th', 'ph', 'ck', 'ng', 'gh', 'wh', 'qu', 'kn', 'wr', 'gn'], nl: ['sch', 'ch', 'sj', 'tj', 'ng', 'ph', 'ck', 'qu', 'th'] };
function consUnits(s, lang) {
  const out = []; let i = 0;
  while (i < s.length) {
    const u = UNITS[lang].find(x => s.startsWith(x, i));
    if (u) { out.push(u); i += u.length; } else { out.push(s[i]); i++; }
  }
  return out;
}
const CODA_ONLY = ['ng', 'ck'];
function validOnset(u) {
  if (u.some(x => CODA_ONLY.includes(x))) return false;
  if (u.length === 1) return true;
  const [a, b, c] = u;
  if (u.length === 2) {
    if ('pbtdkgfvc'.includes(a) && 'lr'.includes(b) && a.length === 1) return true;
    if ((a === 'th' || a === 'sh' || a === 'ch') && b === 'r') return true;
    if (a === 's' && 'ptkmnlwf'.includes(b) && b.length === 1) return true;
    if (['t', 'd', 'k', 'g', 's', 'sh', 'th', 'qu'].includes(a) && b === 'w') return true;
    return false;
  }
  if (u.length === 3) return a === 's' && ['p', 't', 'k', 'c'].includes(b) && ['l', 'r'].includes(c);
  return false;
}
// splits een woord (zonder streepjes) in stukken, een per klinkergroep
function splitWord(w, lang) {
  const mask = vowelMask(w, lang), groups = [];
  for (let i = 0; i < w.length;) {
    if (!mask[i]) { i++; continue; }
    let j = i; while (j < w.length && mask[j]) j++;
    groups.push([i, j]); i = j;
  }
  if (groups.length < 2) return { pieces: [w], magic: false };
  let magic = false;
  if (lang === 'en') {
    const last = groups[groups.length - 1], tail = w.slice(last[0]);
    const before = w.slice(groups[groups.length - 2][1], last[0]);
    const units = consUnits(before, 'en');
    if (tail === 'e' && units.length >= 1 && !(units[units.length - 1] === 'l' && units.length >= 2 && !isV(units[units.length - 2][0]))) {
      // stomme e: 'make' -> 'mak' met een lange klinker
      groups.pop(); w = w.slice(0, last[0]); magic = true;
    } else if (tail === 'ed' && units.length >= 1 && !'td'.includes(units[units.length - 1]) && w.length > 3) {
      groups.pop(); w = w.slice(0, last[0]) + 'd'; magic = false;
    }
    if (groups.length < 2) return { pieces: [w], magic };
  }
  const cuts = [];
  for (let g = 0; g < groups.length - 1; g++) {
    const run = w.slice(groups[g][1], groups[g + 1][0]), units = consUnits(run, lang);
    let take = 0;
    if (units.length === 1) take = CODA_ONLY.includes(units[0]) ? 0 : 1;
    else if (CODA_ONLY.includes(units[units.length - 1])) take = 0;
    else {
      take = 1;
      for (let n = Math.min(3, units.length); n >= 1; n--) if (validOnset(units.slice(units.length - n))) { take = n; break; }
    }
    const coda = units.slice(0, units.length - take).join('');
    cuts.push(groups[g][1] + coda.length);
  }
  const pieces = []; let from = 0;
  for (const c of cuts) { pieces.push(w.slice(from, c)); from = c; }
  pieces.push(w.slice(from));
  return { pieces, magic };
}

// Medeklinkerletters -> klanken
function consEN(s, pos, nextL) {
  const out = []; let i = 0;
  const R = [['tch', ['ch']], ['sch', ['s', 'k']], ['ch', ['ch']], ['sh', ['sh']], ['th', ['th']], ['ph', ['f']], ['ck', ['k']], ['ng', ['ng']], ['nk', ['ng', 'k']],
    ['qu', ['k', 'w']], ['wh', ['w']], ['dg', ['jh']]];
  while (i < s.length) {
    const rest = s.slice(i), prev = s[i - 1];
    let r = R.find(x => rest.startsWith(x[0]));
    if (r) { out.push(...r[1]); i += r[0].length; continue; }
    if (rest.startsWith('gh')) { if (pos === 'on') out.push('g'); i += 2; continue; }
    if (pos === 'on' && (rest.startsWith('kn') || rest.startsWith('gn'))) { out.push('n'); i += 2; continue; }
    if (pos === 'on' && rest.startsWith('wr')) { out.push('r'); i += 2; continue; }
    if (pos === 'off' && rest.startsWith('mb')) { out.push('m'); i += 2; continue; }
    const c = s[i], nx = s[i + 1] || (pos === 'on' ? nextL : ''); i++;
    if (c === prev) continue;
    if (c === 'c') out.push('eiy'.includes(nx) && nx ? 's' : 'k');
    else if (c === 'g') out.push(pos === 'on' && nx && 'eiy'.includes(nx) && s.length === 1 && nextL !== 'e' + '' ? 'jh' : 'g');
    else if (c === 'j') out.push('jh');
    else if (c === 'x') out.push('k', 's');
    else if (c === 'q') out.push('k');
    else if (c === 'y') out.push('j');
    else if ('bdfhklmnprstvwz'.includes(c)) out.push(c);
  }
  return out.map(x => EXPAND[x] || [x]).flat();
}
function consNL(s, pos) {
  const out = []; let i = 0;
  const R = [['sch', pos === 'off' ? ['s'] : ['s', 'x']], ['ch', ['x']], ['sj', ['sh']], ['tj', ['t', 'sh']], ['ng', ['ng']], ['nk', ['ng', 'k']], ['ph', ['f']],
    ['ck', ['k']], ['qu', ['k', 'w']], ['th', ['t']], ['dt', ['t']]];
  while (i < s.length) {
    const rest = s.slice(i), prev = s[i - 1];
    const r = R.find(x => rest.startsWith(x[0]));
    if (r) { out.push(...r[1]); i += r[0].length; continue; }
    const c = s[i]; i++;
    if (c === prev) continue;
    const last = i >= s.length && pos === 'off';
    if (c === 'g') out.push('x');
    else if (c === 'c') out.push('k');
    else if (c === 'x') out.push('k', 's');
    else if (c === 'q') out.push('k');
    else if (c === 'y' || c === 'j') out.push('j');
    else if (c === 'b') out.push(last ? 'p' : 'b');
    else if (c === 'd') out.push(last ? 't' : 'd');
    else if (c === 'v') out.push(last ? 'f' : 'v');
    else if (c === 'z') out.push(last ? 's' : 'z');
    else if ('fhklmnprstw'.includes(c)) out.push(c);
  }
  return out.map(x => EXPAND[x] || [x]).flat();
}
const EN_DIG = [['ee', 'i'], ['ea', 'i'], ['ie', 'i'], ['ai', 'ei'], ['ay', 'ei'], ['ei', 'ei'], ['ey', 'ei'], ['oa', 'ou'], ['oo', 'u'], ['ou', 'au'], ['oi', 'oi'],
  ['oy', 'oi'], ['au', 'aw'], ['aw', 'aw'], ['ew', 'u'], ['ue', 'u'], ['ui', 'u'], ['eu', 'u']];
const EN_OW_AU = ['now', 'how', 'cow', 'wow', 'vow', 'brow', 'plow', 'allow'];
function vowelEN(nuc, coda, f, word) {
  const open = coda === '', rcoda = coda[0] === 'r' && !isV(coda[1] || '');
  if (f.magic && nuc.length === 1) return { a: ['ei'], e: ['i'], i: ['ai'], o: ['ou'], u: ['u'], y: ['ai'] }[nuc] || ['uh'];
  if (nuc.length >= 2) {
    if (nuc === 'ow') return open && !EN_OW_AU.includes(word) ? ['ou'] : ['au'];
    const d = EN_DIG.find(x => nuc.startsWith(x[0]));
    if (d) return [d[1]];
    return vowelEN(nuc[0], coda, f, word);
  }
  if (rcoda) return { a: ['a'], o: ['aw'], e: ['er'], i: ['er'], u: ['er'], y: ['er'] }[nuc] || ['uh'];
  switch (nuc) {
    case 'a': return open ? ['a'] : ['ae'];
    case 'e': return open ? (f.last && !f.mono && /[^aeiouy]le$/.test(word) ? ['uh'] : ['i']) : ['e'];
    case 'i': return (open && f.mono) || /^(nd|ld|gh)/.test(coda) ? ['ai'] : open ? ['i'] : ['ih'];
    case 'y': return open ? (f.mono ? ['ai'] : ['i']) : ['ih'];
    case 'o': return open ? ['ou'] : /^(ld|lt)/.test(coda) ? ['ou'] : ['aw'];
    case 'u': return open ? ['u'] : ['uh'];
    default: return ['uh'];
  }
}
const NL_DIG = [['aa', 'a'], ['ee', 'ee'], ['oo', 'o'], ['uu', 'y'], ['ie', 'i'], ['oe', 'u'], ['eu', 'oe'], ['ui', 'ui'], ['ij', 'ei'], ['ei', 'ei'], ['au', 'au'],
  ['ou', 'au'], ['ai', 'ai'], ['oi', 'oi'], ['ey', 'ei'], ['ae', 'a'], ['ea', 'i'], ['ue', 'y']];
function vowelNL(nuc, coda, f) {
  const open = coda === '';
  if (nuc.length >= 2) {
    const d = NL_DIG.find(x => nuc.startsWith(x[0]));
    return d ? [d[1]] : vowelNL(nuc[0], coda, f);
  }
  switch (nuc) {
    case 'a': return ['a'];
    case 'e': return open ? (f.last || f.mono ? ['uh'] : ['ee']) : ['e'];
    case 'i': return open ? ['i'] : ['ih'];
    case 'o': return open ? ['o'] : ['aw'];
    case 'u': return open ? ['y'] : ['oe'];
    case 'y': return ['i'];
    default: return ['uh'];
  }
}
const DICT = {
  en: { a: 'uh', the: 'dhuh', of: 'uhv', to: 'tu', you: 'ju', your: 'jaw', one: 'wuhn', two: 'tu', who: 'hu', are: 'ar', was: 'wuhz', were: 'wer', is: 'ihz', his: 'ihz',
    has: 'haez', have: 'haev', love: 'luhv', come: 'kuhm', some: 'suhm', do: 'du', does: 'duhz', done: 'duhn', give: 'gihv', live: 'lihv', said: 'sed', says: 'sez',
    i: 'ai', my: 'mai', by: 'bai', why: 'wai', me: 'mi', we: 'wi', he: 'hi', she: 'shi', be: 'bi', no: 'nou', go: 'gou', so: 'sou', oh: 'ou', yes: 'jes',
    and: 'aend', in: 'ihn', on: 'awn', it: 'iht', as: 'aez', at: 'aet', or: 'aw', for: 'faw', from: 'fruhm', what: 'wuht', all: 'awl', any: 'eni', many: 'meni',
    night: 'nait', light: 'lait', eye: 'ai', eyes: 'aiz', sky: 'skai', fly: 'flai', high: 'hai', sigh: 'sai', bright: 'brait' },
  nl: { de: 'duh', een: 'uhn', het: 'uht', is: 'ihs', en: 'en', ik: 'ihk', je: 'juh', jij: 'jei', ja: 'ja', nee: 'nee', wij: 'wei', zij: 'zei', hij: 'hei', mij: 'mei',
    ze: 'zuh', we: 'wuh', me: 'muh', te: 'tuh', ne: 'nuh', licht: 'lihxt', nacht: 'naxt', ooit: 'oit', hoi: 'hoi' }
};
function gSyl(piece, lang, f, word) {
  const mask = vowelMask(piece, lang);
  const first = mask.indexOf(true);
  const text = piece;
  if (first < 0) {
    const on = lang === 'nl' ? consNL(piece, 'on') : consEN(piece, 'on', '');
    return { t: text, k: 's', on, nuc: [], off: [] };
  }
  let end = first; while (end + 1 < mask.length && mask[end + 1]) end++;
  const onL = piece.slice(0, first), nucL = piece.slice(first, end + 1);
  let codaL = piece.slice(end + 1).split('').filter(c => !isV(c)).join('');
  const nuc = lang === 'nl' ? vowelNL(nucL, codaL, f) : vowelEN(nucL, codaL, f, word);
  // 'er', 'ir', 'ur': de r zit al in de klinker
  if (lang === 'en' && nuc[0] === 'er' && codaL[0] === 'r') codaL = codaL.slice(1);
  if (lang === 'en' && /^igh/.test(codaL)) codaL = codaL.slice(3);
  const on = lang === 'nl' ? consNL(onL, 'on') : consEN(onL, 'on', nucL[0]);
  const off = lang === 'nl' ? consNL(codaL, 'off') : consEN(codaL, 'off', '');
  return { t: text, k: 's', on, nuc, off };
}
function parseWord(raw, lang, out) {
  const parts = raw.split(/[_~]/), head = parts[0], ties = parts.length - 1;
  if (/^[*.]+$/.test(head) && head) for (let i = 0; i < head.length; i++) out.push(REST);
  else if (head) {
    const clean = head.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(lang === 'phon' ? /[^a-z'\-|*]/g : /[^a-z'\-|*]/g, '');
    const chunks = clean.split('*');
    chunks.forEach((chunk, ci) => {
      if (ci > 0) out.push(REST);
      const pieces = chunk.split(/[-|]+/).filter(Boolean);
      if (!pieces.length) return;
      if (lang === 'phon') {
        for (const p of pieces) out.push(syllableFromTokens(phonTokens(p), p));
        return;
      }
      const word = pieces.join('').replace(/'/g, '');
      if (pieces.length === 1) {
        const w = pieces[0].replace(/'/g, '');
        if (DICT[lang][w]) { out.push(...phonSyllables(DICT[lang][w], w)); return; }
        const sp = splitWord(w, lang);
        sp.pieces.forEach((p, i) => out.push(gSyl(p, lang, { mono: sp.pieces.length === 1, last: i === sp.pieces.length - 1, magic: sp.magic && i === sp.pieces.length - 1 }, w)));
      } else {
        pieces.forEach((p, i) => out.push(gSyl(p.replace(/'/g, ''), lang, { mono: false, last: i === pieces.length - 1, magic: false }, word)));
      }
    });
  }
  for (let i = 0; i < ties; i++) out.push(TIE);
}
function parseLyrics(text, lang) {
  const out = [];
  if (typeof text !== 'string') return out;
  const words = text.toLowerCase().replace(/[\r\n\t]+/g, ' ').slice(0, 2000).split(/\s+/).filter(Boolean);
  const lg = LANGS.includes(lang) ? lang : 'en';
  for (const w of words) {
    if (out.length >= 1500) break;
    parseWord(w.replace(/[,;:!?"“”()\[\]{}]/g, '').replace(/([a-z'])\.+$/, '$1'), lg, out);
  }
  return out.filter(s => s.k !== 's' || s.on.length || s.nuc.length || s.off.length).slice(0, 1500);
}

// ---------------------------------------------------------------------------------------------------------------------
// Rekenwerk: de respons van de parallelle bandpass-filters, voor een vaste uitgangsniveau per klinker (geen NaN: alles begrensd)
// ---------------------------------------------------------------------------------------------------------------------
function respAt(f, F, Q, G) {
  let re = 0, im = 0;
  for (let j = 0; j < F.length; j++) {
    const w = f / F[j], a = 1 - w * w, b = w / Q[j], d = a * a + b * b || 1;
    re += G[j] * b * b / d; im += G[j] * a * b / d;
  }
  return re * re + im * im;
}
function voicedRms(F, Q, G, f0, k, sr) {
  let s = 0;
  for (let h = 1; h <= 96 && h * f0 < sr * 0.45; h++) s += (h ** -k) ** 2 * 0.5 * respAt(h * f0, F, Q, G);
  return Math.sqrt(s) || 1e-6;
}
function noiseRmsBank(F, Q, G, sr) {
  const df = 40; let s = 0, n = 0;
  for (let f = df / 2; f < sr / 2; f += df) { s += respAt(f, F, Q, G); n++; }
  return Math.sqrt(s / n / 3) || 1e-6;
}
function noiseRmsBP(fc, q, sr) {
  const df = 40; let s = 0, n = 0;
  for (let f = df / 2; f < sr / 2; f += df) { const w = f / fc, a = 1 - w * w, b = w / q; s += b * b / (a * a + b * b || 1); n++; }
  return Math.sqrt(s / n / 3) || 1e-6;
}

const fin = (x, d, lo, hi) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d);
const SPEC = {
  size: ['Formantverschuiving', -12, 12, 0.1, 0, 'st', 'lin', 'color', 0.03, true],
  breath: ['Adem', 0, 1, 0.01, 0.12, '%', 'lin', 'texture', 0.03, true],
  bright: ['Helderheid', 0, 1, 0.01, 0.5, '%', 'lin', 'color', 0.03, true],
  voices: ['Koorstemmen', 1, 8, 1, 1, '', 'lin', 'texture', 0, false],
  detune: ['Verstemming', 0, 50, 0.5, 8, 'ct', 'lin', 'pitch', 0.03, true],
  spread: ['Stereobreedte', 0, 1, 0.01, 0.5, '%', 'lin', 'pan', 0.03, true],
  vibRate: ['Vibratosnelheid', 3, 8, 0.1, 5.5, 'Hz', 'lin', 'motion', 0.02, false],
  vibDepth: ['Vibratodiepte', 0, 100, 1, 22, 'ct', 'lin', 'pitch', 0.03, true],
  vibDelay: ['Vibratovertraging', 0, 2, 0.05, 0.3, 's', 'lin', 'motion', 0.02, false],
  glide: ['Glijtijd', 0, 0.5, 0.005, 0.06, 's', 'lin', 'pitch', 0.02, false],
  attack: ['Opkomst', 0.005, 3, 0.005, 0.04, 's', 'log', 'env', 0.02, false],
  release: ['Uitklank', 0.02, 6, 0.01, 0.25, 's', 'log', 'decay', 0.02, false],
  consonants: ['Medeklinkers', 0, 1, 0.01, 0.8, '%', 'lin', 'texture', 0.03, true],
  onset: ['Beginmedeklinker', 5, 200, 1, 60, 'ms', 'log', 'env', 0.02, false],
  level: ['Uitgang', 0, 1, 0.01, 0.7, '%', 'lin', 'level', 0.02, false]
};
const DEFAULTS = Object.fromEntries(Object.entries(SPEC).map(([k, d]) => [k, d[4]]));
Object.assign(DEFAULTS, { lyrics: 'la la la', lang: 'en', voice: 'alto', vowel: 'a', fixed: false, mode: 'mono', onEnd: 'loop', pos: 0 });
const R0 = 0.21;   // doelniveau (rms) van één stem bij velocity 1, voor de uitgangsregeling

export default {
  id: 'nl.patchkamer.formantsinger', name: 'Formant Singer', version: '1.13.0', kind: 'instrument', category: 'synth', ui: { width: 520, minWidth: 400 },
  ports: {
    audioIn: [], audioOut: [{ id: 'out', name: 'Stereo voice' }],
    eventIn: [{ id: 'notes', name: 'Notes' }, { id: 'lyrics', name: 'Lyrics / restart' }], eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }], modOut: []
  },
  i18n: { nl: { ports: { out: 'Stereo zang', notes: 'Noten', lyrics: 'Tekst / herstart' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const sr = fin(ctx.sampleRate, 44100, 8000, 192000);
    const nyq = sr / 2;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    // parameters op de tijdlijn: alleen eindige waarden en tijden
    const sT = (p, val, t, tc) => { if (Number.isFinite(val) && Number.isFinite(t) && Number.isFinite(tc)) p.setTargetAtTime(val, t, Math.max(0.0005, tc)); };
    const sV = (p, val, t) => { if (Number.isFinite(val) && Number.isFinite(t)) p.setValueAtTime(val, t); };

    let state = { ...DEFAULTS }, mod = {}, eff = {}, dead = false, parsed = parseLyrics(state.lyrics, state.lang);
    let root = null, ui = null, stopFrame = null, dirty = true, sig = '';
    let serial = 0, chord = null, lead = null, lastNuc = null, lastFreq = 0, lastEnd = -1, uiForm = null;
    const voices = new Set(), lfos = [], waves = new Map();
    const nodes = new Set(), sources = new Set();
    const own = n => { nodes.add(n); return n; };
    const gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };

    // ruis, met een vaste zaad: twee renders zijn dus gelijk
    let seed = 0x46535347;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
    const noiseLen = Math.ceil(sr * 2);
    const noiseBuffer = ctx.createBuffer(1, noiseLen, sr), noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = random();

    // uitgang: som van de stemmen -> versterking -> zachte begrenzer -> niveau
    const rawBus = gain(1), trim = gain(1), out = gain(state.level), specTap = own(ctx.createAnalyser());
    specTap.fftSize = 2048; specTap.smoothingTimeConstant = 0.7;
    let shaper = null;
    const curve = new Float32Array(4097);
    for (let i = 0; i < curve.length; i++) { const x = i / (curve.length - 1) * 2 - 1; curve[i] = 0.92 * Math.tanh(x / 0.92); }
    function makeShaper() {
      if (shaper) { try { shaper.disconnect(); } catch { /* al los */ } nodes.delete(shaper); }
      try { trim.disconnect(); } catch { /* al los */ }
      shaper = own(ctx.createWaveShaper()); shaper.curve = curve; shaper.oversample = (host.audio && host.audio.oversample) || '2x';
      trim.connect(shaper); shaper.connect(out);
    }
    rawBus.connect(trim); makeShaper(); out.connect(specTap);
    const monRaw = own(ctx.createAnalyser()), monOut = own(ctx.createAnalyser());
    monRaw.fftSize = 2048; monOut.fftSize = 2048; rawBus.connect(monRaw); out.connect(monOut);
    const chk = new Float32Array(2048);

    // vibrato: acht trage sinussen (iets verschillende snelheid), gedeeld door alle stemmen; elk koorlid kiest een andere
    const LFOR = [1, 1.07, 0.93, 1.13, 0.89, 1.19, 0.97, 1.03];
    for (let i = 0; i < 8; i++) {
      const o = own(ctx.createOscillator()), d = gain(0);
      o.frequency.value = 5.5 * LFOR[i]; o.connect(d); o.start(); sources.add(o); lfos.push({ o, d });
    }

    // golfvorm van de bron: harmonischen 1/n^k
    function getWave() {
      const key = Math.round(eff.bright * 20);
      if (!waves.has(key)) {
        const k = 2.6 - 1.8 * key / 20, N = 97, re = new Float32Array(N), im = new Float32Array(N);
        for (let h = 1; h < N; h++) im[h] = h ** -k;
        waves.set(key, { w: ctx.createPeriodicWave(re, im, { disableNormalization: true }), k });
      }
      return waves.get(key);
    }

    function resolve() {
      const r = { ...state };
      for (const [id, d] of Object.entries(SPEC)) {
        const off = mod[id] || 0;
        r[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** off : state[id] + off * (d[2] - d[1]), d[1], d[2]);
      }
      return r;
    }
    eff = resolve();

    // ---- klinkers en formanten ----
    const vfac = () => { const v = VOICE[state.voice] || VOICE.custom; return { tab: TAB[v.tab], k: v.k * 2 ** (eff.size / 12), track: v.track && state.voice !== 'whisper' }; };
    function bankFor(vid, f0) {
      const vf = vfac(), tb = (VOW[vid] || VOW.a)[vf.tab];
      const F = [tb[0], tb[1], tb[2], F45[vf.tab][0], F45[vf.tab][1]].map(x => x * vf.k);
      if (vf.track && f0 > F[0] * 0.85) F[0] = Math.min(F[1] * 0.85, f0 * 1.02);
      for (let j = 0; j < 5; j++) { F[j] = clamp(F[j], 70, nyq * 0.9); if (j && F[j] < F[j - 1] + 90) F[j] = Math.min(nyq * 0.92, F[j - 1] + 90); }
      const bs = Math.sqrt(vf.k);
      const B = BW.map(b => b * bs);
      return { F, B, Q: F.map((f, j) => clamp(f / B[j], 0.5, 40)), G: GAIN.slice(), f0 };
    }
    const locScale = () => LOCFAC[vfac().tab] * vfac().k / (VOICE[state.voice] || VOICE.custom).k;
    function consBank(c, T, kind) {
      const P = CONS[c], ls = locScale(), v = vfac().k / (VOICE[state.voice] || VOICE.custom).k;
      const F = [P.loc[0] * Math.sqrt(ls * v / v), P.loc[1] * ls, P.loc[2] * ls, T.F[3], T.F[4]];
      for (let j = 1; j < 5; j++) if (F[j] < F[j - 1] + 90) F[j] = F[j - 1] + 90;
      F.forEach((f, j) => { F[j] = clamp(f, 70, nyq * 0.92); });
      const B = kind === 'na' ? [100, 120, 160, 180, 230] : T.B;
      const G = kind === 'na' ? [1, 0.08, 0.05, 0.03, 0.02] : kind === 'li' ? [0.9, 0.6, 0.45, 0.3, 0.2] : kind === 'fr' ? [0.8, 0.3, 0.2, 0.1, 0.05] : [0.8, 0.6, 0.4, 0.25, 0.15];
      const out = { F, B, Q: F.map((f, j) => clamp(f / B[j], 0.5, 40)), G, f0: T.f0 };
      out.fac = kind === 'na' ? 0.55 : kind === 'li' ? 0.8 : kind === 'fr' ? 0.45 : 0.7;
      return out;
    }
    // niveau van een klinker: norm = doel / rms van de bank; unit = ruis die even sterk klinkt als de stem
    function levelOf(T, k) {
      const whisper = state.voice === 'whisper';
      const vr = voicedRms(T.F, T.Q, T.G, T.f0, k, sr), nr = noiseRmsBank(T.F, T.Q, T.G, sr);
      return whisper ? { norm: R0 * 0.72 / nr, unit: 1 } : { norm: R0 / vr, unit: vr / nr };
    }

    // ---- stem aanmaken ----
    function makeVoice(t, note, M) {
      const v = { id: ++serial, note, t0: t, tEnd: Infinity, deadAt: Infinity, dead: false, hasD: false, gate: true, nodes: [], srcs: [], members: [], syl: null, vNow: 'a', diph: null, finished: false, amp0: 0 };
      const mk = n => { v.nodes.push(n); return n; };
      const g = val => { const n = mk(ctx.createGain()); n.gain.value = val; return n; };
      v.merger = mk(ctx.createChannelMerger(2)); v.voicing = g(1); v.bankIn = g(1); v.breathG = g(0); v.bankSum = g(1); v.nrm = g(0); v.amp = g(0); v.cG = g(0); v.out = g(1);
      v.merger.connect(v.voicing); v.voicing.connect(v.bankIn);
      v.bp = []; v.fg = [];
      for (let j = 0; j < 5; j++) {
        const f = mk(ctx.createBiquadFilter()); f.type = 'bandpass'; f.frequency.value = 500 * (j + 1); f.Q.value = 8;
        const fg = g(GAIN[j]); v.bankIn.connect(f); f.connect(fg); fg.connect(v.bankSum); v.bp.push(f); v.fg.push(fg);
      }
      v.bankSum.connect(v.nrm); v.nrm.connect(v.amp); v.amp.connect(v.out);
      const nz = mk(ctx.createBufferSource()); nz.buffer = noiseBuffer; nz.loop = true; nz.connect(v.breathG); v.breathG.connect(v.bankIn); v.srcs.push(nz);
      const nz2 = mk(ctx.createBufferSource()); nz2.buffer = noiseBuffer; nz2.loop = true; v.cBP = mk(ctx.createBiquadFilter()); v.cBP.type = 'bandpass'; v.cBP.frequency.value = 3000; v.cBP.Q.value = 1;
      nz2.connect(v.cBP); v.cBP.connect(v.cG); v.cG.connect(v.out); v.srcs.push(nz2);
      v.out.connect(rawBus);
      // koorleden
      const wave = getWave(), pv = ((serial * 0.618034) % 1) * 2 - 1;
      for (let m = 0; m < M; m++) {
        const o = mk(ctx.createOscillator()); o.setPeriodicWave(wave.w);
        const off = m === 0 ? 0 : (((m * 0.754877666) % 1) * 2 - 1), pan = m === 0 && M === 1 ? pv * 0.5 : clamp(pv * 0.5 + (((m * 0.569840291 + 0.3) % 1) * 2 - 1), -1, 1);
        const vg = g(0), gl = g(0), gr = g(0);
        o.connect(gl); o.connect(gr); gl.connect(v.merger, 0, 0); gr.connect(v.merger, 0, 1);
        const lf = lfos[(serial + m) % 8]; lf.d.connect(vg); vg.connect(o.detune);
        v.members.push({ o, vg, gl, gr, off, pan });
        v.srcs.push(o);
      }
      v.M = M; v.pv = pv;
      const startAt = Math.max(0, t);
      v.srcs.forEach((s, i) => {
        const isOsc = i >= 2;
        if (isOsc) s.start(Math.max(0, startAt - 0.0011 * (i - 2)));
        else s.start(startAt, (serial * 0.37 + i * 0.91) % 1.9);
      });
      v.srcs[0].onended = () => dispose(v);
      voices.add(v);
      return v;
    }
    function dispose(v) {
      if (v.dead) return;
      v.dead = true; voices.delete(v);
      for (const n of v.nodes) try { n.disconnect(); } catch { /* al los */ }
      for (const m of v.members) try { m.vg.disconnect(); } catch { /* al los */ }
      if (lead === v) lead = null;
    }
    function stopVoice(v, when) {
      for (const s of v.srcs) try { s.stop(Math.max(when, 0)); } catch { /* al gestopt */ }
      v.deadAt = Math.min(v.deadAt, when);
    }
    const voiceParams = v => [v.amp.gain, v.nrm.gain, v.voicing.gain, v.breathG.gain, v.cG.gain, v.cBP.frequency, v.cBP.Q,
      ...v.bp.map(f => f.frequency), ...v.bp.map(f => f.Q), ...v.fg.map(g => g.gain), ...v.members.map(m => m.o.frequency), ...v.members.map(m => m.o.detune)];
    function cancelFrom(v, t) { for (const p of voiceParams(v)) try { p.cancelScheduledValues(t); } catch { /* geen planning */ } }
    function fadeOut(v, t, secs) {
      if (v.dead) return;
      if (t <= v.t0) { try { v.amp.gain.cancelScheduledValues(0); } catch { /* */ } v.amp.gain.value = 0; sT(v.cG.gain, 0, t, 0.003); stopVoice(v, t + 0.02); return; }
      v.amp.gain.cancelScheduledValues(t); sT(v.amp.gain, 0, t, secs / 4); sT(v.cG.gain, 0, t, secs / 4);
      stopVoice(v, t + secs * 2.6 + 0.05);
    }

    function setBank(v, t, T, tc) {
      for (let j = 0; j < 5; j++) { sT(v.bp[j].frequency, T.F[j], t, tc); sT(v.bp[j].Q, T.Q[j], t, tc); sT(v.fg[j].gain, T.G[j], t, tc); }
    }
    function setConsBank(v, t, Tc, tc, norm) {
      setBank(v, t, Tc, tc);
      if (v.k0) sT(v.nrm.gain, levelOf(Tc, v.k0).norm * Tc.fac, t, tc);
    }
    function setVowelBank(v, t, T, tc, norm) { setBank(v, t, T, tc); sT(v.nrm.gain, norm, t, tc); }
    function memberTone(v, t, note, glideFrom, gl) {
      const f = hz(note);
      v.members.forEach(m => {
        const detCt = m.off * eff.detune;
        sV(m.o.detune, detCt, t);
        const spread = eff.spread, p = clamp(m.pan * spread, -1, 1), a = (p + 1) * Math.PI / 4, base = 1 / Math.sqrt(v.M);
        sT(m.gl.gain, base * Math.cos(a), t, 0.01); sT(m.gr.gain, base * Math.sin(a), t, 0.01);
        if (glideFrom > 0 && gl > 0.003) { sV(m.o.frequency, glideFrom, t); sT(m.o.frequency, f, t, gl / 3); } else sV(m.o.frequency, f, t);
      });
    }

    // ---- een lettergreep zingen ----
    const NASLI = c => CONS[c] && (CONS[c].ty === 'na' || CONS[c].ty === 'li');
    function plan(syl, D, hasD, vel) {
      const art = clamp(eff.consonants, 0, 1);
      if (art < 0.01 || syl.k === 't') return { on: [], off: [], Ton: 0, Toff: 0 };
      const mkList = list => list.filter(c => CONS[c]).map(c => ({ c, d: Math.max(0.006, CONS[c].d / 1000 * (0.5 + 0.5 * art) * (EXPAND.ch && ['sh', 'zh'].includes(c) && list.length > 1 ? 0.8 : 1)) }));
      let on = mkList(syl.on), off = mkList(syl.off);
      const sum = a => a.reduce((s, x) => s + x.d, 0), scale = (a, f) => a.forEach(x => { x.d *= f; });
      const capOn = eff.onset / 1000, capOff = eff.onset / 1000 * 0.8;
      if (sum(on) > capOn) scale(on, capOn / sum(on));
      if (sum(off) > capOff) scale(off, capOff / sum(off));
      if (hasD) { const tot = sum(on) + sum(off), cap = 0.35 * D; if (tot > cap) { scale(on, cap / tot); scale(off, cap / tot); } }
      return { on, off, Ton: sum(on), Toff: sum(off) };
    }
    function consSeg(v, c, ts, td, T, isOn, lvl, base) {
      const P = CONS[c]; if (!P) return;
      const te = ts + td, tcT = clamp(td * 0.35, 0.006, 0.03), whisper = state.voice === 'whisper';
      const vo = (val, t, tc) => { if (!whisper) sT(v.voicing.gain, val, t, tc); };
      const rms = R0 * lvl;
      const ns = (f, q, g, tOn, tcOn, tOff) => { sV(v.cBP.frequency, f, tOn); sV(v.cBP.Q, q, tOn); sT(v.cG.gain, g * rms / noiseRmsBP(f, q, sr), tOn, tcOn); sT(v.cG.gain, 0, Math.max(tOn, tOff), 0.006); };
      if (P.ty === 'fr') {
        ns(P.nf, P.nq, P.ng, ts, 0.006, te - 0.012);
        vo(P.v ? 0.5 : 0, ts, 0.005);
        if (P.v) { setConsBank(v, ts, consBank(c, T, 'fr'), 0.006); } else if (isOn) setVowelBank(v, ts, T, 0.002, v.curNorm);
        if (isOn) { vo(1, te - 0.006, 0.01); if (P.v) setVowelBank(v, te - 0.012, T, tcT, v.curNorm); }
      } else if (P.ty === 'as') {
        vo(0, ts, 0.004); sT(v.breathG.gain, base.unit * 0.9, ts, 0.006); sT(v.breathG.gain, base.breath, te - 0.01, 0.01);
        if (isOn) { setVowelBank(v, ts, T, 0.002, v.curNorm); vo(1, te - 0.006, 0.01); }
      } else if (P.ty === 'pl') {
        const clo = td * (isOn ? 0.5 : 0.45), bd = Math.min(0.02, td * 0.2), tb = ts + clo;
        vo(P.v ? 0.25 : 0, ts, 0.004);
        setConsBank(v, ts, consBank(c, T, 'pl'), isOn ? 0.003 : 0.012);
        sV(v.cBP.frequency, P.bf, ts); sV(v.cBP.Q, P.bq, ts);
        sT(v.cG.gain, P.bg * (isOn ? 1 : 0.8) * rms / noiseRmsBP(P.bf, P.bq, sr), tb, 0.0015); sT(v.cG.gain, 0, tb + bd, 0.004);
        if (isOn) {
          setVowelBank(v, tb, T, tcT, v.curNorm);
          if (!P.v) { sT(v.breathG.gain, base.unit * 0.7, tb, 0.003); sT(v.breathG.gain, base.breath, te - 0.004, 0.01); vo(1, te - 0.005, 0.008); } else vo(1, tb, 0.006);
        }
      } else if (P.ty === 'na') {
        vo(0.9, ts, 0.004); setConsBank(v, ts, consBank(c, T, 'na'), isOn ? 0.004 : clamp(td * 0.25, 0.006, 0.03));
        if (isOn) { setVowelBank(v, te - Math.min(0.025, td * 0.5), T, tcT, v.curNorm); vo(1, te - 0.006, 0.01); }
      } else if (P.ty === 'li') {
        vo(0.9, ts, 0.004); setConsBank(v, ts, consBank(c, T, 'li'), isOn ? 0.004 : clamp(td * 0.3, 0.006, 0.04));
        if (isOn) { setVowelBank(v, ts + td * 0.4, T, tcT * 1.5, v.curNorm); vo(1, te - 0.006, 0.01); }
      }
    }

    // plant het slot van een noot (coda, tweeklank, uitklank); pre: de eindtijd is al bekend
    function finish(v, tEnd, pre) {
      if (v.finished || v.dead) return;
      v.finished = true;
      const syl = v.syl, pl = v.pl || { off: [], Toff: 0 }, rel = eff.release;
      const tc0 = pre ? tEnd - pl.Toff : tEnd;
      if (v.diph && !v.diphDone) {
        const nucStart = v.nucStart, room = Math.max(0.02, tc0 - nucStart), gl = Math.min(0.22, room * 0.45), tG = Math.max(nucStart + 0.005, tc0 - gl);
        setVowelBank(v, tG, v.diph.T, Math.max(0.01, gl / 3), v.diph.lv.norm); v.curNorm = v.diph.lv.norm; v.diphDone = true; v.vNow = v.diph.vid; v.tGlide = tG;
        uiFormSet(v.diph.T, v.diph.vid);
      }
      let ts = tc0;
      const Tcur = v.diph ? v.diph.T : v.T1;
      pl.off.forEach(s => { consSeg(v, s.c, ts, s.d, Tcur, false, v.lvlC, v.base); ts += s.d; });
      const tRel = pre ? tEnd : tEnd + pl.Toff;
      v.tRel = tRel;
      sT(v.amp.gain, 0, tRel, rel / 4);
      sT(v.voicing.gain, 0, tRel + rel * 1.1, rel / 6);
      stopVoice(v, tRel + rel * 2.6 + 0.08);
      v.tEnd = pre ? tEnd : tEnd;
    }
    function uiFormSet(T, vid) { uiForm = { F1: T.F[0], F2: T.F[1], vid }; }

    function sing(v, syl, t, D, hasD, vel, legato, note, glideFrom) {
      const f0 = hz(note);
      v.syl = syl; v.note = note; v.finished = false; v.diphDone = false; v.diph = null; v.t0 = legato ? v.t0 : t;
      const gl = clamp(eff.glide, 0, 0.5);
      let nuc = syl.nuc.slice(), onList = syl.on, hum = false;
      if (syl.k === 't') { nuc = (lastNuc || [state.vowel]).slice(-1); }
      else if (!nuc.length) {
        if (onList.length && onList.every(NASLI)) hum = true; else nuc = ['uh'];
      }
      if (syl.k === 's' && nuc.length) lastNuc = nuc.slice();
      const p = plan({ ...syl, nuc, k: syl.k }, D, hasD, vel);
      v.pl = p;
      const art = clamp(eff.consonants, 0, 1);
      v.lvlC = (0.5 + 0.5 * art) * (0.35 + 0.65 * vel);
      const vid1 = nuc[0] || 'uh', T1 = bankFor(vid1, f0), wv = getWave();
      const lv1 = levelOf(T1, wv.k), whisper = state.voice === 'whisper';
      const breath = whisper ? 1 : Math.pow(eff.breath, 1.2) * 0.7 * lv1.unit;
      v.base = { unit: lv1.unit, breath }; v.T1 = T1; v.vNow = vid1;
      const peak = 0.25 + 0.75 * vel; v.amp0 = peak;
      const tNuc = t + p.Ton; v.nucStart = tNuc;
      const tc = (0.012 + gl * 0.35) * clamp((hasD ? D : 0.5) / 0.5, 0.35, 1);
      memberTone(v, t, note, glideFrom, gl);
      // stem aan/uit en ademniveau
      if (legato) cancelFrom(v, t);
      sT(v.breathG.gain, breath, t, 0.01);
      if (whisper) sV(v.voicing.gain, 0, t); else sT(v.voicing.gain, 1, t, 0.005);
      if (legato) { sT(v.amp.gain, peak, t, 0.02); sT(v.nrm.gain, lv1.norm, t, 0.02); } else { sV(v.nrm.gain, lv1.norm, t); sT(v.amp.gain, peak, t, Math.max(0.002, eff.attack / 3)); }
      // formanten: begin bij de eerste medeklinker, daarna de klinker
      if (hum) {
        const c = onList[onList.length - 1], TH = consBank(c, T1, CONS[c].ty);
        setConsBank(v, t, TH, legato ? tc : 0.003); onList = [];
      } else if (!legato) setBank(v, t, T1, 0.0005);
      v.curNorm = lv1.norm; v.k0 = wv.k;
      let ts = t;
      if (!hum) {
        if (legato || p.on.length) { if (!p.on.length) setVowelBank(v, t, T1, tc, lv1.norm); }
        p.on.forEach(s => { consSeg(v, s.c, ts, s.d, T1, true, v.lvlC, v.base); ts += s.d; });
        if (p.on.length) setVowelBank(v, tNuc, T1, tc * 0.6, lv1.norm);
      }
      // tweeklank: tweede klinker
      if (nuc.length > 1 && !hum) {
        const vid2 = nuc[1], T2 = bankFor(vid2, f0), lv2 = levelOf(T2, wv.k);
        v.diph = { T: T2, lv: lv2, vid: vid2 };
        v.diphT = T2;
      }
      if (hasD) finish(v, t + D, true);
      uiFormSet(T1, vid1);
      lastFreq = f0;
    }

    // ---- noten ----
    function liveCount(t) { let n = 0; for (const v of voices) if (!v.dead && !v.fading && v.deadAt > t) n++; return n; }
    function nextSyllable() {
      if (state.fixed || !parsed.length) return { t: state.vowel, k: 's', on: [], nuc: [state.vowel], off: [] };
      if (state.pos >= parsed.length) {
        if (state.onEnd === 'loop') state.pos = 0;
        else if (state.onEnd === 'hold') return TIE;
        else return REST;
      }
      const s = parsed[state.pos]; state.pos++; dirty = true; return s;
    }
    function noteOn(note, vel, t, dur, held) {
      const hasD = !held && Number.isFinite(dur), D = hasD ? clamp(dur, 0.01, 120) : NaN;
      const follower = chord && t - chord.t >= 0 && t - chord.t < 0.03;
      let syl;
      if (follower) syl = chord.syl; else { syl = nextSyllable(); chord = { t, syl }; }
      if (syl.k === 'r') return;
      const poly = state.mode === 'poly';
      if (!poly) {
        const cur = lead && !lead.dead && lead.t0 <= t + 1e-6 && (lead.hasD ? lead.tEnd > t : !lead.finished);
        if (follower && lead && !lead.dead) {   // akkoord in mono: de laatste noot wint, zonder nieuwe lettergreep
          memberTone(lead, t, note, lastFreq, eff.glide); lead.note = note; lastFreq = hz(note); return;
        }
        if (cur) {   // legato
          lead.hasD = hasD; lead.tEnd = hasD ? t + D : Infinity; lead.deadAt = Infinity;
          const fromF = lastFreq; sing(lead, syl, t, D, hasD, vel, true, note, fromF); lead.hasD = hasD;
          return;
        }
      }
      // nieuwe stem; maximaal 8 (poly) of 3 (mono) tegelijk
      const cap = poly ? 8 : 3;
      while (liveCount(t) >= cap) {
        let pick = null;
        for (const v of voices) if (!v.dead && !v.fading && v.deadAt > t && (!pick || (v.deadAt < pick.deadAt) || (v.deadAt === pick.deadAt && v.t0 < pick.t0))) pick = v;
        if (!pick) break;
        pick.fading = true; fadeOut(pick, Math.max(t, pick.t0), 0.02);
      }
      const M = Math.round(clamp(eff.voices, 1, 8));
      const v = makeVoice(t, note, M);
      v.hasD = hasD; v.tEnd = hasD ? t + D : Infinity;
      let glideFrom = 0;
      if (!poly && eff.glide > 0 && lastFreq > 0 && t - lastEnd < 1) glideFrom = lastFreq;
      // vibrato met vertraging
      const delay = eff.vibDelay;
      v.members.forEach(m => { sV(m.vg.gain, 0, t); if (delay > 0) sV(m.vg.gain, 0, t + delay); m.vg.gain.linearRampToValueAtTime(1, t + delay + 0.4); });
      sing(v, syl, t, D, hasD, vel, false, note, glideFrom);
      if (!poly) lead = v;
      lastEnd = hasD ? t + D : t;
      v.deadAt = hasD ? v.deadAt : Infinity;
    }
    function noteOff(note, t) {
      for (const v of voices) {
        if (v.dead || v.note !== note) continue;
        if (!v.hasD && !v.finished) { finish(v, t, false); lastEnd = t; }
        else if (v.hasD && v.tEnd > t + 0.002 && v.t0 <= t) { cancelFrom(v, t); v.finished = false; v.hasD = false; v.diphDone = false; v.deadAt = Infinity; v.pl = { ...v.pl, Ton: 0 }; finish(v, t, false); }
      }
    }
    function panic(t) {
      for (const v of voices) if (!v.dead) { v.finished = true; v.hasD = true; v.fading = true; fadeOut(v, Math.max(t, v.t0), Math.min(eff.release, 0.3)); }
      chord = null;
    }
    function restart() { state.pos = 0; dirty = true; chord = null; }

    // ---- bewaker ----
    function rebuild() {
      for (const v of [...voices]) { stopVoice(v, 0); dispose(v); }
      lead = null; makeShaper(); out.connect(specTap);
    }
    function guard() {
      if (dead) return;
      for (const m of [monRaw, monOut]) {
        m.getFloatTimeDomainData(chk);
        for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) { rebuild(); return; }
      }
    }
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null;
    if (guardT && guardT.unref) guardT.unref();

    // ---- toepassen ----
    function apply(t = ctx.currentTime) {
      if (dead) return;
      eff = resolve();
      sT(out.gain, eff.level, t, 0.02);
      for (let i = 0; i < 8; i++) { sT(lfos[i].o.frequency, eff.vibRate * LFOR[i], t, 0.05); sT(lfos[i].d.gain, eff.vibDepth, t, 0.05); }
      const s = state.voice + '|' + eff.size.toFixed(2) + '|' + Math.round(eff.bright * 20);
      if (s !== sig) {
        const bChanged = sig.split('|')[2] !== String(Math.round(eff.bright * 20)); sig = s;
        for (const v of voices) {
          if (v.dead || v.deadAt < t) continue;
          const T = bankFor(v.vNow, hz(v.note)); setBank(v, t, T, 0.03);
          if (bChanged) { const wv = getWave(); for (const m of v.members) m.o.setPeriodicWave(wv.w); }
        }
      }
    }

    // ---- UI ----
    const CSS = `:host{display:block}*{box-sizing:border-box}.r{color:var(--fg);font-size:12px;line-height:1.4;font-family:var(--mono,ui-monospace,monospace);min-width:0}
h3{margin:0 0 6px;font-size:13px;letter-spacing:1px;font-weight:600;color:color-mix(in srgb,var(--audio) 60%,var(--fg))}
.sec{border-top:1px solid var(--line);margin-top:8px;padding-top:6px;font-size:11px;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
textarea{width:100%;min-height:54px;resize:vertical;background:var(--field);color:var(--field-fg);border:1px solid var(--line);border-radius:4px;padding:6px;font:inherit}
select,button{background:var(--field);color:var(--field-fg);border:1px solid var(--line);border-radius:4px;padding:3px 6px;font:inherit;min-width:0;max-width:100%}
button{cursor:pointer}button:hover{border-color:var(--audio)}
.row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin:6px 0}.row label{display:flex;gap:5px;align-items:center;color:var(--muted)}
.syl{display:flex;flex-wrap:wrap;gap:3px;margin:6px 0;max-height:96px;overflow:auto;padding:4px;background:var(--well);color:var(--well-fg);border-radius:4px}
.syl span{padding:0 4px;border-radius:3px;border:1px solid transparent}.syl span.cur{background:var(--audio);color:var(--card);border-color:var(--audio)}.syl span.rest,.syl span.tie{opacity:.6}
.note{font-size:11px;color:var(--muted);margin:4px 0}.stat{font-size:11px;color:var(--event);margin:3px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:3px 16px}
.k{display:grid;grid-template-columns:minmax(0,132px) minmax(60px,1fr) 56px;gap:6px;align-items:center;min-height:24px}
.k label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:11px}.k input{width:100%;min-width:0;margin:0;accent-color:var(--audio)}
.k output{font-size:11px;text-align:right;white-space:nowrap}
canvas{display:block;width:100%;height:96px;background:var(--well);border-radius:4px;margin-top:6px}`;
    const el = (tag, parent, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; };
    const VLAB = { soprano: 'Sopraan', alto: 'Alt', tenor: 'Tenor', bass: 'Bas', child: 'Kind', whisper: 'Gefluister', custom: 'Eigen' };
    const VOWLAB = { a: 'a – spa', ae: 'ae – kat', e: 'e – bed', ee: 'ee – veel', i: 'i – zie', ih: 'ih – bit', o: 'o – boom', aw: 'aw – bot', u: 'u – boek', oo: 'oo – hoed', y: 'y – uur', oe: 'oe – deur', uh: 'uh – de', er: 'er – her' };
    const fmt = (id, v) => { const u = SPEC[id][5]; return u === '%' ? Math.round(v * 100) + '%' : u === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : u === 'st' ? (v > 0 ? '+' : '') + v.toFixed(1) + ' st' : u === '' ? String(Math.round(v)) : (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(Number.isInteger(SPEC[id][3]) ? 0 : 1)) + ' ' + u; };
    function sylText(s) { return s.k === 'r' ? '*' : s.k === 't' ? '_' : s.t; }
    function drawChips() {
      if (!ui) return;
      ui.chips.replaceChildren();
      ui.spans = [];
      const L = parsed.slice(0, 400);
      for (let i = 0; i < L.length; i++) { const s = L[i], sp = el('span', ui.chips, s.k === 'r' ? 'rest' : s.k === 't' ? 'tie' : '', sylText(s)); ui.spans.push(sp); }
      ui.shown = -2; paintPos();
    }
    function paintPos() {
      if (!ui) return;
      const p = state.fixed || !parsed.length ? -1 : state.pos < parsed.length ? state.pos : -1;
      if (ui.shown !== p) {
        if (ui.spans[ui.shown]) ui.spans[ui.shown].classList.remove('cur');
        if (ui.spans[p]) { ui.spans[p].classList.add('cur'); if (ui.spans[p].scrollIntoView && false) ui.spans[p].scrollIntoView({ block: 'nearest' }); }
        ui.shown = p;
      }
      const msg = state.fixed || !parsed.length ? tx('Geen tekst: vaste klinker') : state.pos >= parsed.length ? tx('Einde van de tekst') : tx('Lettergreep {0} van {1}', state.pos + 1, parsed.length);
      const active = Object.values(mod).filter(x => x !== 0).length;
      const st = (active ? tx('Mod actief · {0} parameters', active) : '') + (active ? ' · ' : '') + msg;
      if (ui.stat.textContent !== st) ui.stat.textContent = st;
    }
    function paint() {
      if (!ui) return;
      if (ui.lyr.value !== state.lyrics) ui.lyr.value = state.lyrics;
      ui.lang.value = state.lang; ui.voice.value = state.voice; ui.mode.value = state.mode; ui.onEnd.value = state.onEnd; ui.vowel.value = state.vowel; ui.fixed.checked = state.fixed;
      for (const id of Object.keys(SPEC)) { const k = ui.k[id]; k.input.value = String(state[id]); k.out.textContent = fmt(id, state[id]); }
      drawChips();
    }
    function change(id, value) {
      const d = SPEC[id]; if (!d || !Number.isFinite(+value)) return;
      state[id] = Number(clamp(Math.round(+value / d[3]) * d[3], d[1], d[2]).toFixed(6)); apply();
      if (ui) ui.k[id].out.textContent = fmt(id, state[id]);
    }
    function testNote() {
      const t = ctx.currentTime + 0.03, note = { soprano: 72, child: 76, alto: 65, tenor: 57, bass: 45 }[state.voice] || 57, bpm = fin(host.bpm, 120, 30, 300);
      const keep = state.pos, syl = state.fixed || !parsed.length ? { t: state.vowel, k: 's', on: [], nuc: [state.vowel], off: [] } : (parsed[Math.min(keep, parsed.length - 1)] || TIE);
      if (syl.k === 'r') return;
      const v = makeVoice(t, note, Math.round(eff.voices)); const D = clamp(60 / bpm, 0.3, 2);
      v.hasD = true; v.tEnd = t + D;
      v.members.forEach(m => { sV(m.vg.gain, 0, t); m.vg.gain.linearRampToValueAtTime(1, t + eff.vibDelay + 0.4); });
      sing(v, syl, t, D, true, 0.8, false, note, 0);
    }

    const self = {
      inputs: {}, outputs: { out },
      mount(el0) {
        if (root) self.unmount();
        const wrap = document.createElement('div'); el0.appendChild(wrap);
        const sh = wrap.attachShadow({ mode: 'open' }); root = wrap;
        const style = el('style', sh); style.textContent = CSS;
        const r = el('div', sh, 'r'); ui = { k: {}, spans: [], shown: -2 };
        const stop = e => e.stopPropagation();
        r.addEventListener('keydown', stop); r.addEventListener('keyup', stop); r.addEventListener('pointerdown', stop);
        el('h3', r, '', tx('Formant Singer · zang met tekst'));
        ui.lyr = el('textarea', r); ui.lyr.maxLength = 2000; ui.lyr.value = DEFAULTS.lyrics; ui.lyr.title = tx('Tekst'); ui.lyr.spellcheck = false;
        ui.lyr.addEventListener('input', () => { state.lyrics = ui.lyr.value.slice(0, 2000); parsed = parseLyrics(state.lyrics, state.lang); state.pos = Math.min(state.pos, parsed.length); drawChips(); });
        const sel = (label, opts, onchange, parent) => { const l = el('label', parent || ui.row1, '', label); const s = el('select', l); for (const [v, t] of opts) { const o = el('option', s, '', t); o.value = v; } s.addEventListener('change', () => onchange(s.value)); return s; };
        ui.row1 = el('div', r, 'row');
        ui.lang = sel(tx('Taal'), [['en', tx('English')], ['nl', tx('Nederlands')], ['phon', tx('Klanken')]], v => { state.lang = LANGS.includes(v) ? v : 'en'; parsed = parseLyrics(state.lyrics, state.lang); state.pos = Math.min(state.pos, parsed.length); drawChips(); });
        ui.voice = sel(tx('Stem'), VOICES.map(v => [v, tx(VLAB[v])]), v => { state.voice = v; apply(); });
        ui.mode = sel(tx('Spel'), [['mono', tx('Mono (legato)')], ['poly', tx('Polyfoon')]], v => { state.mode = v; });
        ui.onEnd = sel(tx('Einde van de tekst'), [['loop', tx('Herhalen')], ['hold', tx('Aanhouden')], ['stop', tx('Stoppen')]], v => { state.onEnd = v; });
        ui.row2 = el('div', r, 'row');
        const fl = el('label', ui.row2, '', tx('Vaste klinker')); ui.fixed = el('input', fl); ui.fixed.type = 'checkbox'; ui.fixed.addEventListener('change', () => { state.fixed = ui.fixed.checked; paintPos(); });
        ui.vowel = sel(tx('Klinker'), VOWELS.map(v => [v, tx(VOWLAB[v])]), v => { state.vowel = VOWELS.includes(v) ? v : 'a'; }, ui.row2);
        el('div', r, 'sec', tx('Lettergrepen'));
        ui.chips = el('div', r, 'syl');
        el('div', r, 'note', tx('Elke noot zingt de volgende lettergreep. Spatie, - of | scheidt lettergrepen; _ of ~ = melisma (klinker doorzingen); * of . = rust. Taal Klanken: schrijf klanken direct, bijvoorbeeld ha-lo of shaet.'));
        ui.stat = el('div', r, 'stat', '');
        const act = el('div', r, 'row');
        const b1 = el('button', act, '', tx('Herstart')); b1.type = 'button'; b1.addEventListener('click', () => { restart(); paintPos(); });
        const b2 = el('button', act, '', tx('Proef')); b2.type = 'button'; b2.addEventListener('click', () => { try { testNote(); } catch { /* geen geluid */ } });
        const b3 = el('button', act, '', tx('Alles uit')); b3.type = 'button'; b3.addEventListener('click', () => panic(ctx.currentTime));
        const groups = [[tx('Stem & bron'), ['size', 'breath', 'bright', 'voices', 'detune', 'spread']], [tx('Beweging'), ['vibRate', 'vibDepth', 'vibDelay', 'glide', 'attack', 'release']], [tx('Spraak'), ['consonants', 'onset']], [tx('Niveau'), ['level']]];
        for (const [label, ids] of groups) {
          el('div', r, 'sec', label); const grid = el('div', r, 'grid');
          for (const id of ids) {
            const d = SPEC[id], row = el('div', grid, 'k'); const lb = el('label', row, '', tx(d[0])); lb.title = tx(d[0]);
            const inp = el('input', row); inp.type = 'range'; inp.min = String(d[1]); inp.max = String(d[2]); inp.step = String(d[3]); inp.value = String(d[4]); inp.setAttribute('data-pk-default', String(d[4]));
            const o = el('output', row, '', fmt(id, d[4]));
            inp.addEventListener('input', () => change(id, inp.value));
            ui.k[id] = { input: inp, out: o };
          }
        }
        el('div', r, 'sec', tx('Spectrum van de uitgang met F1 en F2 van de laatste klinker'));
        ui.cv = el('canvas', r); ui.cv.style.height = '96px'; ui.cx = ui.cv.getContext('2d');
        ui.cw = 480; ui.ch = 96; ui.col = null; ui.colT = -1e9; ui.spec = new Uint8Array(specTap.frequencyBinCount || 1024);
        const readCols = () => {
          let cs = null; try { cs = getComputedStyle(r); } catch { /* geen stijl */ }
          const g = n => (cs && cs.getPropertyValue(n) || '').trim();
          ui.col = { audio: g('--audio') || '#4cc9f0', fg: g('--fg') || '#ddd', muted: g('--muted') || '#888', event: g('--event') || '#f90' };
        };
        readCols();
        const onSkin = () => readCols();
        if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('patchkamer-skin', onSkin);
        ui.offSkin = () => { if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('patchkamer-skin', onSkin); };
        if (typeof ResizeObserver !== 'undefined') {
          ui.ro = new ResizeObserver(es => { const w = Math.round(es[0] && es[0].contentRect ? es[0].contentRect.width : 0); if (w > 20) { ui.cw = w; ui.cv.width = Math.round(w * Math.min(2, devicePixelRatio || 1)); ui.cv.height = Math.round(96 * Math.min(2, devicePixelRatio || 1)); } });
          ui.ro.observe(ui.cv);
        }
        stopFrame = host.frame(self, tms => draw(tms), 30);
        paint();
      },
      unmount() {
        if (stopFrame) { stopFrame(); stopFrame = null; }
        if (ui) { if (ui.ro) ui.ro.disconnect(); if (ui.offSkin) ui.offSkin(); }
        if (root) { try { root.remove(); } catch { /* al weg */ } }
        root = null; ui = null;
      },
      onEvent(port, event) {
        try {
          if (dead || !event || typeof event !== 'object') return;
          const now = ctx.currentTime, t = Number.isFinite(event.time) ? clamp(event.time, now, now + 120) : now;
          const type = String(event.type).toLowerCase().replace(/[_-]/g, '');
          if (type === 'lyrics' && typeof event.text === 'string') { self.setState({ ...state, lyrics: event.text }); return; }
          if (port === 'lyrics') { if (type === 'trig' || type === 'restart' || type === 'noteon' || type === 'note') { restart(); } return; }
          if (port !== 'notes') return;
          if (type === 'panic' || type === 'allnotesoff') { panic(t); return; }
          if (type === 'trig') { if (event.lane === 'restart') restart(); return; }
          if (type === 'cc') {
            if (event.id === 'restart' && Number(event.value) > 0.5) { restart(); return; }
            if (Object.hasOwn(SPEC, event.id) && event.id !== 'voices' && Number.isFinite(event.value)) { const d = SPEC[event.id]; change(event.id, d[1] + clamp(event.value, 0, 1) * (d[2] - d[1])); }
            return;
          }
          if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(event.note)) return;
          const n = Math.round(clamp(event.note, 0, 127));
          const vel = Number.isFinite(event.vel) ? clamp(event.vel, 0, 1) : 0.8;
          if (type === 'noteoff' || vel === 0) { noteOff(n, t); return; }
          noteOn(n, vel, t, Number.isFinite(event.dur) ? clamp(event.dur, 0.01, 120) : undefined, event.held === true || (type === 'noteon' && !Number.isFinite(event.dur)));
        } catch { /* een onzin-event mag het apparaat niet stoppen */ }
      },
      onTransport(info) { if (!dead && !(info && info.playing)) panic(ctx.currentTime); },
      params() { return Object.entries(SPEC).filter(([id]) => id !== 'voices').map(([id, d]) => ({ id, name: tx(d[0]), lane: 'voice', laneName: 'Voice', min: d[1], max: d[2], scale: d[6], role: d[7], drift: d[8], on: d[9] })); },
      modulate(offsets) {
        if (dead) return;
        const next = {};
        if (offsets && typeof offsets === 'object' && !Array.isArray(offsets)) for (const id of Object.keys(SPEC)) { const v = offsets[id]; if (id !== 'voices' && typeof v === 'number' && Number.isFinite(v)) next[id] = clamp(v, -1, 1); }
        mod = next; apply(); dirty = true;
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return;
        const s = raw && typeof raw === 'object' ? raw : {}, next = { ...DEFAULTS };
        for (const [id, d] of Object.entries(SPEC)) if (typeof s[id] === 'number' && Number.isFinite(s[id])) next[id] = Number(clamp(Math.round(s[id] / d[3]) * d[3], d[1], d[2]).toFixed(6));
        if (typeof s.lyrics === 'string') next.lyrics = s.lyrics.slice(0, 2000);
        if (LANGS.includes(s.lang)) next.lang = s.lang;
        if (VOICES.includes(s.voice)) next.voice = s.voice;
        if (VOWELS.includes(s.vowel)) next.vowel = s.vowel;
        if (typeof s.fixed === 'boolean') next.fixed = s.fixed;
        if (MODES.includes(s.mode)) next.mode = s.mode;
        if (ONENDS.includes(s.onEnd)) next.onEnd = s.onEnd;
        state = next; parsed = parseLyrics(state.lyrics, state.lang);
        state.pos = typeof s.pos === 'number' && Number.isFinite(s.pos) ? Math.round(clamp(s.pos, 0, parsed.length)) : 0;
        chord = null; apply(); paint(); dirty = true;
      },
      getPreset() { const p = { ...state }; delete p.pos; return p; },
      setPreset(p) {
        const q = p && typeof p === 'object' ? p : {}, before = state.lyrics + '|' + state.lang;
        self.setState({ ...q, pos: state.pos });
        if (state.lyrics + '|' + state.lang !== before) { state.pos = 0; chord = null; paint(); dirty = true; }   // een andere tekst begint weer bij de eerste lettergreep
      },
      destroy() {
        if (dead) return;
        dead = true; if (guardT) clearInterval(guardT);
        self.unmount();
        for (const v of [...voices]) { stopVoice(v, 0); dispose(v); }
        for (const s of sources) try { s.stop(); } catch { /* al gestopt */ }
        for (const n of nodes) try { n.disconnect(); } catch { /* al los */ }
        sources.clear(); nodes.clear(); voices.clear(); lfos.length = 0;
      }
    };

    // spectrum, F1/F2 en cursor: via de tekenklok van de host
    function draw(tms) {
      if (!ui || !ui.cx) return;
      if (dirty) { dirty = false; paintPos(); }
      if (tms - ui.colT > 1000) { ui.colT = tms; const cs = (() => { try { return getComputedStyle(root); } catch { return null; } })(); if (cs) { const g = n => (cs.getPropertyValue(n) || '').trim(); ui.col = { audio: g('--audio') || ui.col.audio, fg: g('--fg') || ui.col.fg, muted: g('--muted') || ui.col.muted, event: g('--event') || ui.col.event }; } }
      const c = ui.cx, W = ui.cv.width || 480, H = ui.cv.height || 96, bins = ui.spec.length;
      specTap.getByteFrequencyData(ui.spec);
      c.clearRect(0, 0, W, H);
      const f0 = 80, f1 = Math.min(8000, nyq), lg = Math.log(f1 / f0), xOf = f => (Math.log(clamp(f, f0, f1) / f0) / lg) * W;
      c.strokeStyle = ui.col.muted; c.globalAlpha = 0.25; c.lineWidth = 1;
      for (const f of [100, 200, 500, 1000, 2000, 5000]) { const x = xOf(f); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      c.globalAlpha = 1; c.strokeStyle = ui.col.audio; c.lineWidth = 1.5; c.beginPath();
      for (let x = 0; x < W; x += 2) { const f = f0 * Math.exp(x / W * lg), b = Math.min(bins - 1, Math.round(f / nyq * bins)), y = H - (ui.spec[b] / 255) * (H - 4); if (x) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
      if (uiForm) {
        c.strokeStyle = ui.col.event; c.fillStyle = ui.col.event; c.lineWidth = 1; c.font = Math.round(10 * (W / 480 > 1.3 ? 1.5 : 1)) + 'px sans-serif';
        [['F1', uiForm.F1], ['F2', uiForm.F2]].forEach(([n, f]) => { const x = xOf(f); c.beginPath(); c.moveTo(x, 12); c.lineTo(x, H); c.stroke(); c.fillText(n + ' ' + Math.round(f), Math.min(W - 60, x + 3), 10); });
      }
    }
    apply();
    return self;
  }
};
