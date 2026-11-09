// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.1.0 — Titel in de UI verwijderd: de kaartbalk toont de naam.
// 1.0.0 — Patchkamer contract v1.19. Eerste versie van Chord Buddy: hulp bij akkoorden voor mensen zonder muziektheorie.
//   Kies een toonsoort (westerse schalen, pentatoon, blues) en eventueel een stijl, of speel akkoorden op een MIDI-keyboard: het apparaat herkent ze,
//   stelt toonsoorten en volgende akkoorden voor, bewaart akkoorden in 16 pads, speelt de pads als set (akkoorden en bas apart), en adviseert bas en stemvoering.
//   De muziektheorie staat als pure module in het blok THEORY en wordt los getest (tests/theory.test.mjs).
//   Een set = een preset (getPreset/setPreset); de volledige set zit ook in getState voor werkruimte en song.
// <theory>
// Muziektheorie van Chord Buddy: puur JavaScript, geen host nodig. De tests in tests/theory.test.mjs halen dit blok uit het bestand.
// Schalen en stijlen zijn data (SCALES, STYLES): een nieuwe schaal toevoegen is een regel erbij.
const THEORY = (() => {
  'use strict';
  const mod = (n, m = 12) => ((n % m) + m) % m;
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const ROOT_MAJ = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const ROOT_MIN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const DEFAULT_NAMES = ROOT_MAJ.slice();
  const MAJ_IV = [0, 2, 4, 5, 7, 9, 11];
  const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  function parseNote(name) {
    const m = /^([A-Ga-g])(#{1,2}|b{1,2}|♯|♭)?$/.exec(String(name || '').trim());
    if (!m) return -1;
    const acc = (m[2] || '').replace('♯', '#').replace('♭', 'b');
    return mod(LETTER_PC[LETTERS.indexOf(m[1].toUpperCase())] + (acc[0] === '#' ? acc.length : acc[0] === 'b' ? -acc.length : 0));
  }

  // ---------- akkoordsoorten ----------
  // [id, symbool, intervallen, rollen (R grondtoon, 3 terts of sus, 5 kwint, 7 septiem of sext, 9 none), voorkeur, zeldzaam]
  const QDATA = [
    ['maj', '', [0, 4, 7], ['R', '3', '5'], 1.0],
    ['min', 'm', [0, 3, 7], ['R', '3', '5'], 1.0],
    ['dim', 'dim', [0, 3, 6], ['R', '3', '5'], 0.8],
    ['aug', 'aug', [0, 4, 8], ['R', '3', '5'], 0.7],
    ['sus2', 'sus2', [0, 2, 7], ['R', '3', '5'], 0.78],
    ['sus4', 'sus4', [0, 5, 7], ['R', '3', '5'], 0.8],
    ['6', '6', [0, 4, 7, 9], ['R', '3', '5', '7'], 0.72],
    ['m6', 'm6', [0, 3, 7, 9], ['R', '3', '5', '7'], 0.7],
    ['7', '7', [0, 4, 7, 10], ['R', '3', '5', '7'], 0.95],
    ['maj7', 'maj7', [0, 4, 7, 11], ['R', '3', '5', '7'], 0.93],
    ['m7', 'm7', [0, 3, 7, 10], ['R', '3', '5', '7'], 0.95],
    ['m7b5', 'm7b5', [0, 3, 6, 10], ['R', '3', '5', '7'], 0.85],
    ['dim7', 'dim7', [0, 3, 6, 9], ['R', '3', '5', '7'], 0.75],
    ['mMaj7', 'mMaj7', [0, 3, 7, 11], ['R', '3', '5', '7'], 0.7],
    ['add9', 'add9', [0, 2, 4, 7], ['R', '9', '3', '5'], 0.8],
    ['9', '9', [0, 2, 4, 7, 10], ['R', '9', '3', '5', '7'], 0.85],
    ['m9', 'm9', [0, 2, 3, 7, 10], ['R', '9', '3', '5', '7'], 0.85],
    ['maj9', 'maj9', [0, 2, 4, 7, 11], ['R', '9', '3', '5', '7'], 0.85],
    ['7sus4', '7sus4', [0, 5, 7, 10], ['R', '3', '5', '7'], 0.78],
    ['5', '5', [0, 7], ['R', '5'], 0.85],
    ['maj7s5', 'maj7#5', [0, 4, 8, 11], ['R', '3', '5', '7'], 0.5, true],
  ];
  const Q = QDATA.map(([id, sym, iv, roles, prior, rare]) => ({ id, sym, iv, roles, prior, rare: !!rare }));
  const QID = Object.fromEntries(Q.map(q => [q.id, q]));
  const RECOG = Q.filter(q => !q.rare);
  const QNAMES = {
    maj: { nl: 'majeur', en: 'major' }, min: { nl: 'mineur', en: 'minor' }, dim: { nl: 'verminderd', en: 'diminished' }, aug: { nl: 'overmatig', en: 'augmented' },
    sus2: { nl: 'sus2 (zwevend)', en: 'sus2 (suspended)' }, sus4: { nl: 'sus4 (zwevend)', en: 'sus4 (suspended)' }, '6': { nl: 'majeur met sext', en: 'major with sixth' },
    m6: { nl: 'mineur met sext', en: 'minor with sixth' }, '7': { nl: 'dominant septiem', en: 'dominant seventh' }, maj7: { nl: 'majeur septiem', en: 'major seventh' },
    m7: { nl: 'mineur septiem', en: 'minor seventh' }, m7b5: { nl: 'half-verminderd', en: 'half-diminished' }, dim7: { nl: 'verminderd septiem', en: 'diminished seventh' },
    mMaj7: { nl: 'mineur met grote septiem', en: 'minor with major seventh' }, add9: { nl: 'majeur met none', en: 'major with added ninth' }, '9': { nl: 'dominant none', en: 'dominant ninth' },
    m9: { nl: 'mineur none', en: 'minor ninth' }, maj9: { nl: 'majeur none', en: 'major ninth' }, '7sus4': { nl: 'dominant septiem sus4', en: 'dominant seventh sus4' },
    '5': { nl: 'power chord (kwint)', en: 'power chord (fifth)' }, maj7s5: { nl: 'majeur septiem met verhoogde kwint', en: 'major seventh with raised fifth' },
  };
  const MINORISH = new Set(['min', 'dim', 'm6', 'm7', 'm7b5', 'dim7', 'mMaj7', 'm9']);
  const sig = iv => iv.join(',');
  const BY_SIG = Object.fromEntries(Q.map(q => [sig(q.iv), q.id]));
  const identify = iv => BY_SIG[sig(iv)] || null;

  // ---------- schalen als data ----------
  // iv: intervallen in halve tonen; fam: majeur- of mineurachtig (voor de naam van de grondtoon); fn: functie per trap (T tonica, S subdominant, D dominant)
  const SCALES = {
    major: { iv: [0, 2, 4, 5, 7, 9, 11], fam: 'maj', nl: 'Majeur (ionisch)', en: 'Major (Ionian)', fn: 'TSTSDTD', prior: 0.4 },
    minor: { iv: [0, 2, 3, 5, 7, 8, 10], fam: 'min', nl: 'Natuurlijk mineur (aeolisch)', en: 'Natural minor (Aeolian)', fn: 'TSTSDSD', prior: 0.35, borrowV: true },
    harmonic: { iv: [0, 2, 3, 5, 7, 8, 11], fam: 'min', nl: 'Harmonisch mineur', en: 'Harmonic minor', fn: 'TSTSDSD', prior: 0.05 },
    melodic: { iv: [0, 2, 3, 5, 7, 9, 11], fam: 'min', nl: 'Melodisch mineur', en: 'Melodic minor', fn: 'TSTSDSD', prior: -0.05 },
    dorian: { iv: [0, 2, 3, 5, 7, 9, 10], fam: 'min', nl: 'Dorisch', en: 'Dorian', fn: 'TSTSDDS', prior: -0.05, borrowV: true },
    phrygian: { iv: [0, 1, 3, 5, 7, 8, 10], fam: 'min', nl: 'Frygisch', en: 'Phrygian', fn: 'TSTSDTS', prior: -0.1, borrowV: true },
    lydian: { iv: [0, 2, 4, 6, 7, 9, 11], fam: 'maj', nl: 'Lydisch', en: 'Lydian', fn: 'TSTDDTS', prior: -0.1 },
    mixolydian: { iv: [0, 2, 4, 5, 7, 9, 10], fam: 'maj', nl: 'Mixolydisch', en: 'Mixolydian', fn: 'TSDSDTS', prior: -0.05 },
    locrian: { iv: [0, 1, 3, 5, 6, 8, 10], fam: 'min', nl: 'Locrisch', en: 'Locrian', fn: 'TSTSSTD', prior: -0.2 },
    pentMajor: { kind: 'pent', parent: 'major', degs: [0, 1, 3, 4, 5], iv: [0, 2, 4, 7, 9], fam: 'maj', nl: 'Pentatoon majeur', en: 'Major pentatonic', prior: 0.02 },
    pentMinor: { kind: 'pent', parent: 'minor', degs: [0, 2, 3, 4, 5, 6], iv: [0, 3, 5, 7, 10], fam: 'min', nl: 'Pentatoon mineur', en: 'Minor pentatonic', prior: 0.02, borrowV: true },
    blues: { kind: 'blues', spell: 'major', iv: [0, 2, 3, 4, 7, 9], fam: 'maj', nl: 'Blues (I7 IV7 V7)', en: 'Blues (I7 IV7 V7)', prior: 0,
      chords: [{ off: 0, tri: 'maj', sev: '7', fn: 'T', rn: 'I' }, { off: 5, tri: 'maj', sev: '7', fn: 'S', rn: 'IV' }, { off: 7, tri: 'maj', sev: '7', fn: 'D', rn: 'V' }, { off: 10, tri: 'maj', sev: '7', fn: 'S', rn: 'bVII', w: 0.85 }] },
    bluesMinor: { kind: 'blues', spell: 'minor', iv: [0, 3, 5, 6, 7, 10], fam: 'min', nl: 'Blues mineur (i7 iv7 V7)', en: 'Minor blues (i7 iv7 V7)', prior: 0,
      chords: [{ off: 0, tri: 'min', sev: 'm7', fn: 'T', rn: 'i' }, { off: 5, tri: 'min', sev: 'm7', fn: 'S', rn: 'iv' }, { off: 7, tri: 'maj', sev: '7', fn: 'D', rn: 'V' }, { off: 7, tri: 'min', sev: 'm7', fn: 'D', rn: 'v' }, { off: 10, tri: 'maj', sev: '7', fn: 'S', rn: 'bVII', w: 0.85 }] },
  };
  const SCALE_ORDER = ['major', 'minor', 'harmonic', 'melodic', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'pentMajor', 'pentMinor', 'blues', 'bluesMinor'];
  const isSeven = sc => !sc.kind;

  // ---------- namen ----------
  function spell(rootName, iv) {
    const li = LETTERS.indexOf(rootName[0]), rootPc = parseNote(rootName), out = [];
    for (let k = 0; k < iv.length; k++) {
      const letter = LETTERS[(li + k) % 7], pc = mod(rootPc + iv[k]), acc = mod(pc - LETTER_PC[LETTERS.indexOf(letter)] + 6) - 6;
      if (Math.abs(acc) > 1) return null;
      out.push(letter + (acc > 0 ? '#' : acc < 0 ? 'b' : ''));
    }
    return out;
  }
  const NAMES_CACHE = new Map();
  /** De 12 notennamen (per halve toon) zoals ze in deze toonsoort geschreven worden. */
  function keyNames(root, scaleId) {
    root = mod(Math.round(root)); const sc = SCALES[scaleId] || SCALES.major, ck = root + '|' + scaleId;
    if (NAMES_CACHE.has(ck)) return NAMES_CACHE.get(ck);
    const spellIv = isSeven(sc) ? sc.iv : SCALES[sc.parent || sc.spell].iv;
    const table = sc.fam === 'min' ? ROOT_MIN : ROOT_MAJ;
    const tries = [table[root], SHARP_NAMES[root], FLAT_NAMES[root]];
    let sp = null;
    for (const t of tries) { sp = spell(t, spellIv); if (sp) break; }
    const names = new Array(12);
    if (sp) {
      sp.forEach((n, k) => { names[mod(root + spellIv[k])] = n; });
      const flats = sp.filter(n => n.includes('b')).length, sharps = sp.filter(n => n.includes('#')).length;
      const rest = flats > sharps ? FLAT_NAMES : sharps > flats ? SHARP_NAMES : (root === 6 || root === 1 && sc.fam === 'min' ? SHARP_NAMES : FLAT_NAMES);
      for (let i = 0; i < 12; i++) if (!names[i]) names[i] = rest[i];
    } else for (let i = 0; i < 12; i++) names[i] = DEFAULT_NAMES[i];
    NAMES_CACHE.set(ck, names); return names;
  }
  const midiName = (n, names = DEFAULT_NAMES) => names[mod(n)] + (Math.floor(n / 12) - 1);
  const chordName = (root, qId, bassPc, names = DEFAULT_NAMES) => names[mod(root)] + (QID[qId] ? QID[qId].sym : '') + (bassPc != null && mod(bassPc) !== mod(root) ? '/' + names[mod(bassPc)] : '');
  const chordPcs = (root, qId) => (QID[qId] || QID.maj).iv.map(i => mod(root + i));
  /** Akkoord in grondligging vanaf de laagste noot >= base. De none van een add9/9-akkoord gaat een octaaf omhoog. */
  function rootPosition(root, qId, base = 48) {
    const q = QID[qId] || QID.maj; let r = base + mod(root - base);
    return q.iv.map((i, k) => r + i + (q.roles[k] === '9' ? 12 : 0)).sort((a, b) => a - b);
  }
  const tx = (nl, en) => ({ nl, en });

  // ---------- 1. herkenning ----------
  /** Herkent een akkoord uit MIDI-noten (omkeringen, slash-akkoorden, onvolledige akkoorden). Geeft de beste naam plus alternatieven met score. */
  function recognize(notes, names = DEFAULT_NAMES) {
    const sorted = [...new Set((notes || []).map(n => Math.round(n)).filter(n => Number.isFinite(n)))].sort((a, b) => a - b);
    if (!sorted.length) return { cands: [], best: null, notes: [] };
    const pcs = [...new Set(sorted.map(n => mod(n)))], bass = mod(sorted[0]);
    if (pcs.length === 1) {
      const c = { root: pcs[0], q: null, bass: null, name: names[pcs[0]], score: 0.3, missing: [], inv: 0, single: true, notes: sorted };
      return { cands: [c], best: c, notes: sorted, confidence: 'unsure' };
    }
    const cands = [];
    for (const root of pcs) {
      const rel = new Set(pcs.map(p => mod(p - root)));
      for (const q of RECOG) {
        if (q.iv.length > pcs.length + 1) continue;
        if ([...rel].some(i => !q.iv.includes(i))) continue;
        const miss = q.iv.filter(i => !rel.has(i));
        if (miss.length > 1 || (miss.length === 1 && !(miss[0] === 7 && q.iv.length >= 3 && pcs.length >= 2))) continue;
        if (q.iv.length === 2 && miss.length) continue;
        const completeness = (q.iv.length - miss.length) / q.iv.length;
        let score = q.prior * (0.55 + 0.45 * completeness) + (root === bass ? 0.35 : 0);
        if (pcs.length === 2) score *= 0.6;
        if (miss.length) score *= 0.88;
        const role = q.iv.indexOf(mod(bass - root)), inv = root === bass ? 0 : ({ '3': 1, '5': 2, '7': 3, '9': 4 })[q.roles[role]] || 1;
        cands.push({ root, q: q.id, bass: root === bass ? null : bass, name: chordName(root, q.id, bass, names), score: Math.round(score * 1000) / 1000, missing: miss.map(i => (i === 7 ? '5' : String(i))), inv, notes: sorted });
      }
    }
    // gelijkwaardige namen voor symmetrische akkoorden (dim7, aug): houd alleen de naam met de bas als grondtoon
    const symm = cands.filter(c => (c.q === 'dim7' || c.q === 'aug'));
    const filtered = cands.filter(c => !(symm.includes(c) && symm.some(o => o !== c && o.q === c.q && o.root === bass && c.root !== bass)));
    filtered.sort((a, b) => b.score - a.score || a.root - b.root);
    const best = filtered[0] || null, second = filtered[1];
    const margin = best ? (second ? best.score - second.score : 1) : 0;
    const confidence = !best ? 'unsure' : pcs.length <= 2 ? 'unsure' : margin >= 0.25 ? 'sure' : 'likely';
    return { cands: filtered.slice(0, 6), best, notes: sorted, confidence };
  }

  // ---------- 2. diatonische akkoorden ----------
  const FN_TEXT = {
    T: tx('Thuis: voelt rustig en af', 'Home: feels settled and finished'),
    S: tx('Onderweg: zet de beweging in, weg van thuis', 'On the way: sets things moving, away from home'),
    D: tx('Spanning: wil naar de tonica (thuis)', 'Tension: wants to go home (the tonic)'),
    O: tx('Kleur: valt buiten de toonsoort', 'Colour: sits outside the key'),
  };
  const FN_NAME = { T: tx('tonica', 'tonic'), S: tx('subdominant', 'subdominant'), D: tx('dominant', 'dominant'), O: tx('kleur', 'colour') };
  const RN_SUFFIX = { maj: '', min: '', dim: '°', aug: '+', sus2: 'sus2', sus4: 'sus4', '6': '6', m6: '6', '7': '7', maj7: 'maj7', m7: '7', m7b5: 'ø7', dim7: '°7', mMaj7: '(maj7)', add9: 'add9', '9': '9', m9: '9', maj9: 'maj9', '7sus4': '7sus4', '5': '5', maj7s5: 'maj7(+5)' };
  const romanOff = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  /** Romeins cijfer van een akkoord ten opzichte van de grondtoon van de toonsoort (kleine letters voor mineur en verminderd). */
  function romanFor(root, qId, tonic) {
    const base = romanOff[mod(root - tonic)], lower = MINORISH.has(qId), m = /^([b#]?)([IV]+)$/.exec(base);
    return m[1] + (lower ? m[2].toLowerCase() : m[2]) + (RN_SUFFIX[qId] || '');
  }
  function numeralFor(d, ivd, qId) {
    const acc = ivd - MAJ_IV[d], p = acc === -1 ? 'b' : acc === 1 ? '#' : '', lower = MINORISH.has(qId);
    return p + (lower ? NUMERALS[d].toLowerCase() : NUMERALS[d]) + (RN_SUFFIX[qId] || '');
  }
  const STYLES = {};   // wordt verderop gevuld
  /** Afhankelijk van ext en stijl: 'triad' of 'seventh'. */
  const resolveExt = (ext, style) => (ext === 'triad' || ext === 'seventh') ? ext : ((STYLES[style] && STYLES[style].ext) || 'triad');
  function styleQuality(qTri, qSev, ext, style, fn) {
    if (ext !== 'seventh') return qTri;
    const st = STYLES[style];
    if (st && st.dominant && (qTri === 'maj' || qTri === 'min')) return qTri === 'maj' ? '7' : 'm7';
    return qSev;
  }
  const profCache = new Map();
  /** De akkoorden van een toonsoort, klaar voor gebruik: [{ deg, off, root, q, triQ, sevQ, name, rn, fn, pcs, midi }]. */
  function diatonic(root, scaleId, ext = 'triad', style = null) {
    root = mod(Math.round(root)); const sc = SCALES[scaleId] || SCALES.major, names = keyNames(root, scaleId), e = resolveExt(ext, style);
    const base = scaleChords(scaleId), out = [];
    for (const c of base) {
      const q = styleQuality(c.triQ, c.sevQ, e, style, c.fn), r = mod(root + c.off);
      const item = { deg: c.deg, off: c.off, root: r, q, triQ: c.triQ, sevQ: c.sevQ, fn: c.fn, name: chordName(r, q, null, names), rn: c.rn(q), pcs: chordPcs(r, q) };
      item.midi = rootPosition(r, q, 48); out.push(item);
    }
    return out;
  }
  /** Akkoorden relatief aan de grondtoon (0): één keer per schaal berekend. */
  function scaleChords(scaleId) {
    if (profCache.has(scaleId)) return profCache.get(scaleId);
    const sc = SCALES[scaleId] || SCALES.major; let list = [];
    if (isSeven(sc)) {
      for (let d = 0; d < 7; d++) {
        const iv = sc.iv, r = iv[d], t = mod(iv[(d + 2) % 7] - r), f = mod(iv[(d + 4) % 7] - r), s = mod(iv[(d + 6) % 7] - r);
        const triQ = identify([0, t, f]) || 'maj', sevQ = identify([0, t, f, s]) || triQ;
        list.push({ deg: d, off: r, triQ, sevQ, fn: sc.fn[d], rn: q => numeralFor(d, r, q) });
      }
    } else if (sc.kind === 'pent') {
      list = scaleChords(sc.parent).filter(c => sc.degs.includes(c.deg));
    } else {
      list = sc.chords.map((c, i) => ({ deg: i, off: c.off, w: c.w || 1, triQ: c.tri, sevQ: c.sev, fn: c.fn, rn: q => (MINORISH.has(c.tri) ? c.rn.replace(/[IV]+/, m => m.toLowerCase()) : c.rn) + (q === c.sev ? RN_SUFFIX[q] : '') }));
    }
    profCache.set(scaleId, list); return list;
  }
  const functionOf = (root, qId, tonic, scaleId) => {
    const off = mod(root - tonic), hit = scaleChords(scaleId).find(c => c.off === off && ((QID[qId] ? QID[qId].iv : []).every(i => (QID[c.sevQ] || QID.maj).iv.includes(i))));
    return hit ? hit.fn : 'O';
  };
  const explainChord = (fn, rn) => ({ nl: `${rn}: ${FN_TEXT[fn].nl}`, en: `${rn}: ${FN_TEXT[fn].en}` });

  // ---------- 3. toonsoort bepalen ----------
  const setOf = a => new Set(a);
  const subset = (a, b) => [...a].every(x => b.has(x));
  const profs = {};
  function profile(scaleId) {
    if (profs[scaleId]) return profs[scaleId];
    const sc = SCALES[scaleId], chords = scaleChords(scaleId).map(c => ({ ...c, triSet: setOf(QID[c.triQ].iv), sevSet: setOf(QID[c.sevQ].iv) }));
    return (profs[scaleId] = { sc, chords, noteSet: setOf(sc.iv), mask: sc.iv.reduce((m, i) => m | (1 << i), 0) });
  }
  function chordMatch(prof, tonic, ch) {
    const q = QID[ch.q]; if (!q) return { s: 0.2, kind: 'unknown' };
    const off = mod(ch.root - tonic), R = setOf(q.iv); let best = null;
    for (const pc of prof.chords) {
      if (pc.off !== off || !subset(R, pc.sevSet)) continue;
      let s = prof.sc.kind === 'pent' ? 0.92 : 1;
      if (prof.sc.kind === 'blues' && ![...R].some(i => i === 10 || i === 11)) s = 0.7;
      else if (R.size <= 2) s = 0.9;
      s *= pc.w || 1;
      if (!best || s > best.s) best = { s, kind: 'exact', pc };
    }
    if (best) return best;
    if (prof.sc.borrowV && off === 7 && (ch.q === 'maj' || ch.q === '7')) return { s: 0.75, kind: 'borrowed' };
    const outs = [...R].filter(i => !prof.noteSet.has(mod(off + i)));
    if (!outs.length && prof.noteSet.has(off)) return { s: 0.8, kind: 'fit' };
    return { s: Math.max(-1, 0.3 * (R.size - outs.length) / R.size - 0.6 * outs.length), kind: 'out', outs };
  }
  /** Rangschikt alle toonsoorten (12 grondtonen x alle schalen) voor een reeks akkoorden [{ root, q }]. */
  function detectKey(chords, opts = {}) {
    chords = (chords || []).filter(c => c && Number.isFinite(c.root) && QID[c.q]);
    const n = chords.length, res = [];
    if (!n) return { list: [], confidence: 'unsure', n: 0 };
    for (const scaleId of (opts.scales || SCALE_ORDER)) {
      const prof = profile(scaleId);
      for (let tonic = 0; tonic < 12; tonic++) {
        const ms = chords.map(c => chordMatch(prof, tonic, c));
        let score = ms.reduce((a, m) => a + m.s, 0) + prof.sc.prior;
        const isT = m => m.kind === 'exact' && m.pc.off === 0 && m.pc.deg === 0;
        const first = isT(ms[0]), last = isT(ms[n - 1]), present = ms.some(isT);
        let cad = false;
        for (let i = 0; i + 1 < n; i++) if (ms[i].kind === 'exact' && ms[i].pc.off === 7 && isT(ms[i + 1])) cad = true;
        if (first) score += 0.45; if (last) score += 0.35; if (present) score += 0.3; if (cad) score += 0.4;
        const fit = ms.filter(m => m.s >= 0.7).length;
        res.push({ root: tonic, scale: scaleId, score: Math.round(score * 1000) / 1000, fit, n, first, last, present, cad, ms, mask: mod(prof.mask << tonic | prof.mask >> (12 - tonic), 4096) });
      }
    }
    res.sort((a, b) => b.score - a.score || SCALES[b.scale].prior - SCALES[a.scale].prior || a.root - b.root);
    const top = res[0], pop = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
    const diff = r => pop(r.mask ^ top.mask), nested = r => { const both = r.mask & top.mask; return both === r.mask || both === top.mask; };
    const rivalOther = res.find(r => diff(r) >= 3 && !nested(r)), rivalSame = res.find(r => r !== top && (diff(r) < 3 || nested(r)));
    const margin = rivalOther ? top.score - rivalOther.score : 9, gap = rivalSame ? top.score - rivalSame.score : 9;
    const allFit = top.fit === n;
    let confidence = 'unsure';
    if (n >= 3) confidence = allFit && margin >= 1.0 && gap >= 0.7 ? 'sure' : (allFit && margin >= 0.2) || margin >= 1.2 ? 'likely' : 'unsure';
    else if (n === 2) confidence = allFit && margin >= 0.6 ? 'likely' : 'unsure';
    return { list: res.slice(0, opts.limit || 12), confidence, n, margin, gap, all: res.length };
  }
  const CONF = { sure: tx('bijna zeker', 'almost certain'), likely: tx('waarschijnlijk', 'probably'), unsure: tx('onduidelijk', 'unclear') };
  /** Wat voor en tegen een toonsoort spreekt, in gewone taal (NL en EN). */
  function keyReasons(cand, chords) {
    const names = keyNames(cand.root, cand.scale), tonicName = names[cand.root], out = [], n = cand.n;
    const nm = i => chordName(chords[i].root, chords[i].q, null, names);
    out.push(cand.fit === n ? { ok: true, nl: n === 1 ? 'Het akkoord hoort bij deze toonsoort' : `Alle ${n} akkoorden horen bij deze toonsoort`, en: n === 1 ? 'The chord belongs to this key' : `All ${n} chords belong to this key` }
      : { ok: false, nl: `${cand.fit} van de ${n} akkoorden horen bij deze toonsoort`, en: `${cand.fit} of the ${n} chords belong to this key` });
    cand.ms.forEach((m, i) => {
      if (m.kind === 'out') out.push({ ok: false, nl: `${nm(i)} valt (deels) buiten de toonsoort`, en: `${nm(i)} falls (partly) outside the key` });
      else if (m.kind === 'borrowed') out.push({ ok: true, nl: `${nm(i)} is het spanningsakkoord uit harmonisch mineur`, en: `${nm(i)} is the tension chord borrowed from harmonic minor` });
    });
    if (cand.first && n > 1) out.push({ ok: true, nl: `Begint op het thuisakkoord (${tonicName})`, en: `Starts on the home chord (${tonicName})` });
    if (cand.last && n > 1) out.push({ ok: true, nl: 'Eindigt op het thuisakkoord: voelt af', en: 'Ends on the home chord: feels finished' });
    else if (n > 1 && cand.ms[n - 1].kind === 'exact' && cand.ms[n - 1].pc.off === 7) out.push({ ok: null, nl: 'Eindigt op het spanningsakkoord: voelt open, alsof het verder moet', en: 'Ends on the tension chord: feels open, as if it should continue' });
    if (cand.cad) out.push({ ok: true, nl: 'Spanning gevolgd door thuis: het sterkste "thuiskomen"', en: 'Tension followed by home: the strongest "coming home"' });
    if (!cand.present && n > 1) out.push({ ok: false, nl: `Het thuisakkoord (${tonicName}) zit er nog niet bij`, en: `The home chord (${tonicName}) is not in there yet` });
    if (n === 1) out.push({ ok: null, nl: 'Eén akkoord past in veel toonsoorten: speel er nog een', en: 'One chord fits many keys: play another one' });
    return out;
  }
  const keyLabel = (root, scaleId, lang) => keyNames(root, scaleId)[mod(root)] + ' ' + SCALES[scaleId][lang === 'nl' ? 'nl' : 'en'];

  // ---------- stijlen ----------
  const S_ = (nl, en, ext, bass, maj, min, extra = {}) => Object.assign({ nl, en, ext, bass, maj, min }, extra);
  Object.assign(STYLES, {
    pop: S_('Pop', 'Pop', 'triad', 'rootFifth', ['I V vi IV', 'vi IV I V', 'I vi IV V', 'I IV vi V'], ['i bVI bIII bVII', 'i bVII bVI bVII', 'i iv bVI bVII'],
      { note: tx('Heldere akkoorden, vaak vier in een lus; I, V, vi en IV zijn de basis.', 'Bright chords, often four in a loop; I, V, vi and IV are the core.') }),
    rock: S_('Rock', 'Rock', 'triad', 'pulse', ['I bVII IV I', 'I IV V IV', 'I V bVII IV', 'I IV bVII IV'], ['i bVII bVI bVII', 'i bVI bVII i', 'i iv bVII bVI'],
      { note: tx('Stevige drieklanken; het geleende bVII-akkoord geeft dat open rockgeluid.', 'Solid triads; the borrowed bVII chord gives that open rock sound.') }),
    folk: S_('Folk', 'Folk', 'triad', 'rootFifth', ['I IV I V', 'I vi IV V', 'I IV V IV'], ['i bVII bVI bVII', 'i iv bVII i', 'i bIII bVII i'],
      { note: tx('Eenvoudig en zangbaar: I, IV en V met af en toe een vi.', 'Simple and singable: I, IV and V with an occasional vi.') }),
    blues: S_('Blues', 'Blues', 'seventh', 'walking', ['I7 IV7 I7 V7', 'I7 IV7 V7 IV7', 'I7 I7 IV7 V7'], ['i7 iv7 i7 V7', 'i7 iv7 V7 iv7', 'i7 bVI7 V7 i7'],
      { dominant: true, note: tx('Alle akkoorden zijn dominant septiem (of mineur septiem); de bekende 12-maten-cyclus gebruikt I7, IV7 en V7.', 'All chords are dominant sevenths (or minor sevenths); the well-known 12-bar form uses I7, IV7 and V7.') }),
    jazz: S_('Jazz', 'Jazz', 'seventh', 'walking', ['ii7 V7 Imaj7 vi7', 'Imaj7 vi7 ii7 V7', 'iii7 vi7 ii7 V7', 'Imaj7 IVmaj7 iii7 vi7'], ['iiø7 V7 i7 bVImaj7', 'i7 iv7 iiø7 V7', 'i7 bVImaj7 iiø7 V7'],
      { note: tx('Vierklanken en ii-V-I; spanning wordt netjes opgelost.', 'Seventh chords and ii-V-I; tension is resolved neatly.') }),
    classical: S_('Klassiek', 'Classical', 'triad', 'hold', ['I IV V I', 'I vi ii V', 'I V vi iii'], ['i iv V i', 'i bVI iv V', 'i iio V i'],
      { note: tx('Drieklanken met een duidelijke sluiting (V naar I).', 'Triads with a clear cadence (V to I).') }),
    soul: S_('Soul / R&B', 'Soul / R&B', 'seventh', 'rootFifth', ['Imaj7 iii7 vi7 IVmaj7', 'ii7 V7 Imaj7 IVmaj7', 'Imaj7 vi7 IVmaj7 V7'], ['i7 iv7 bVII7 bIIImaj7', 'i7 bVImaj7 iv7 V7', 'i7 bVII7 bVImaj7 V7'],
      { note: tx('Warme septiemakkoorden met zachte overgangen.', 'Warm seventh chords with smooth moves.') }),
    hiphop: S_('Hip-hop', 'Hip-hop', 'seventh', 'hold', ['Imaj7 vi7 IVmaj7 V', 'vi7 IVmaj7 Imaj7 V', 'ii7 V7 Imaj7 vi7'], ['i bVI bIII bVII', 'i iv v i', 'i bVII bVI V'],
      { note: tx('Vaak mineur, weinig akkoorden en veel herhaling; septiemen geven sfeer.', 'Often minor, few chords and lots of repetition; sevenths add mood.') }),
    house: S_('House / EDM', 'House / EDM', 'seventh', 'pulse', ['vi IV I V', 'I V vi IV', 'I iii vi IV'], ['i bVI bIII bVII', 'i bVII bVI bVII', 'i iv bVI V'],
      { note: tx('Korte lussen van vier akkoorden; mineur septiemen werken goed.', 'Short four-chord loops; minor sevenths work well.') }),
    ambient: S_('Ambient / filmisch', 'Ambient / cinematic', 'seventh', 'hold', ['Imaj7 IVmaj7 vi7 IVmaj7', 'Imaj7 iii7 IVmaj7 Imaj7', 'Iadd9 IVadd9 vi7 Vsus4'], ['i7 bVImaj7 bIIImaj7 bVII', 'i7 iv7 bVImaj7 bVII', 'i7 bIIImaj7 iv7 bVImaj7'],
      { note: tx('Ruime akkoorden met maj7, add9 en sus; langzaam bewegen.', 'Spacious chords with maj7, add9 and sus; slow movement.') }),
    general: S_('Geen stijl', 'No style', 'triad', 'rootFifth', ['I V vi IV', 'I IV V I', 'vi IV I V', 'I vi IV V'], ['i bVI bIII bVII', 'i iv V i', 'i bVII bVI V'],
      { note: tx('Algemene, veilige progressies.', 'General, safe progressions.') }),
  });
  const STYLE_ORDER = ['pop', 'rock', 'folk', 'blues', 'jazz', 'classical', 'soul', 'hiphop', 'house', 'ambient'];
  const famOf = scaleId => (SCALES[scaleId] || SCALES.major).fam;

  // ---------- Romeinse cijfers lezen ----------
  const ROMAN_OFF = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };
  /** Leest een token als 'bVII', 'ii7', 'Imaj7', 'iiø7', 'V7', 'Vsus4' en geeft { off, q } (off t.o.v. de grondtoon, majeurladder). */
  function parseRoman(token, ext = 'triad', style = null) {
    const m = /^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/.exec(String(token));
    if (!m) return null;
    const upper = m[2] === m[2].toUpperCase(), off = mod(ROMAN_OFF[m[2].toUpperCase()] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0)), suf = m[3];
    const e = resolveExt(ext, style), st = STYLES[style];
    let q;
    const MAP = { '': null, '7': upper ? '7' : 'm7', maj7: 'maj7', m7: 'm7', 'ø7': 'm7b5', 'ø': 'm7b5', '°': 'dim', o: 'dim', dim: 'dim', '°7': 'dim7', add9: 'add9', sus4: 'sus4', sus2: 'sus2', '9': upper ? '9' : 'm9', m9: 'm9', maj9: 'maj9', '6': upper ? '6' : 'm6', '5': '5' };
    if (!(suf in MAP)) return null;
    if (MAP[suf]) q = MAP[suf];
    else if (e === 'seventh') q = upper ? (st && st.dominant ? '7' : (off === 7 ? '7' : 'maj7')) : 'm7';
    else q = upper ? 'maj' : 'min';
    return { off, q };
  }
  /** Een progressie ('I V vi IV') in een toonsoort, als lijst akkoorden met naam en noten. */
  function buildProgression(text, root, scaleId, style = null, ext = 'auto') {
    const names = keyNames(root, scaleId), out = [];
    for (const tok of text.split(/\s+/)) {
      const p = parseRoman(tok, ext, style); if (!p) continue;
      const r = mod(root + p.off);
      out.push({ root: r, q: p.q, bass: null, name: chordName(r, p.q, null, names), rn: tok, pcs: chordPcs(r, p.q), midi: rootPosition(r, p.q, 48) });
    }
    return out;
  }
  /** Kant-en-klare progressies van vier akkoorden voor een stijl in de gekozen toonsoort. */
  function progressions(root, scaleId, style) {
    const st = STYLES[style] || STYLES.general, minor = famOf(scaleId) === 'min', list = (minor ? st.min : st.maj);
    const sid = STYLES[style] ? style : 'general';
    return list.map((text, i) => ({
      id: sid + (minor ? 'm' : 'M') + i, style: sid, text, name: tx(`${st.nl} · ${text}`, `${st.en} · ${text}`), enName: `${st.en} · ${text}`,
      chords: buildProgression(text, root, scaleId, sid, 'auto'),
    }));
  }

  // ---------- 4. suggesties voor het volgende akkoord ----------
  const TW = { T: { T: 0.55, S: 0.85, D: 0.8 }, S: { T: 0.7, S: 0.55, D: 1.0 }, D: { T: 1.0, S: 0.5, D: 0.3 } };
  const MOVE_TEXT = {
    'D>T0': tx('Van spanning naar thuis: het sterkste "thuiskomen"', 'From tension to home: the strongest "coming home"'),
    'D>T': tx('Spanning die niet helemaal thuis landt: een mooie verrassing (bedrieglijke sluiting)', 'Tension that does not land fully at home: a nice surprise (deceptive cadence)'),
    'S>D': tx('Van onderweg naar spanning: bouwt op', 'From on-the-way to tension: builds up'),
    'T>S': tx('Van thuis naar onderweg: zet de beweging in', 'From home to on-the-way: gets things moving'),
    'T>D': tx('Van thuis direct naar spanning: een spannende stap', 'From home straight to tension: an exciting step'),
    'T>T': tx('Een zachte stap tussen twee thuis-achtige akkoorden', 'A soft step between two home-like chords'),
    'S>T0': tx('Terug naar thuis (zoals het "amen" in een kerklied)', 'Back home (like the "amen" in a hymn)'),
    'S>T': tx('Een zachte landing, thuis-achtig', 'A soft landing, home-like'),
    'S>S': tx('Blijft onderweg, een andere kleur', 'Stays on the way, a different colour'),
    'D>S': tx('Terug van spanning naar onderweg', 'Back from tension to on-the-way'),
    'D>D': tx('Houdt de spanning vast', 'Keeps the tension'),
  };
  function transitionWeight(from, to, style) {
    // from/to: { fn, deg, off }
    let w = TW[from.fn][to.fn];
    if (from.fn === 'D' && to.fn === 'T' && to.off !== 0) w = 0.75;
    const diff = mod(to.off - from.off);
    if (diff === 5) w += 0.2; else if (diff === 7) w += 0.05; else if (diff === 0) w -= 0.3;
    // stijl: tellen hoe vaak deze overgang in de typische progressies voorkomt
    const st = STYLES[style];
    if (st) {
      let hits = 0;
      for (const text of [...st.maj, ...st.min]) {
        const t = text.split(/\s+/).map(x => parseRoman(x)).filter(Boolean);
        for (let i = 0; i < t.length; i++) { const a = t[i], b = t[(i + 1) % t.length]; if (a.off === from.off && b.off === to.off) hits++; }
      }
      w += Math.min(0.3, hits * 0.1);
    }
    return w;
  }
  const COLORS = [
    { id: 'bVII', off: 10, q: 'maj', fam: 'maj', w: { rock: 1, pop: 0.7, folk: 0.6, house: 0.6, soul: 0.5, blues: 0.8, hiphop: 0.3, ambient: 0.3, jazz: 0.3, classical: 0.1, _: 0.5 }, why: tx('Geleend uit de parallelle mineur toonsoort (♭VII): geeft een open, rockachtig gevoel', 'Borrowed from the parallel minor key (♭VII): an open, rock-like feel') },
    { id: 'bVI', off: 8, q: 'maj', fam: 'maj', w: { pop: 0.6, rock: 0.7, soul: 0.5, hiphop: 0.5, ambient: 0.6, house: 0.5, jazz: 0.3, _: 0.4 }, why: tx('Geleend uit de parallelle mineur toonsoort (♭VI): filmisch en groots', 'Borrowed from the parallel minor key (♭VI): cinematic and grand') },
    { id: 'iv', off: 5, q: 'min', fam: 'maj', w: { pop: 0.7, soul: 0.9, classical: 0.6, ambient: 0.6, folk: 0.4, rock: 0.5, jazz: 0.6, _: 0.5 }, why: tx('Mineur IV (geleend): dromerig en weemoedig, een mooie verrassing in een vrolijke toonsoort', 'Minor IV (borrowed): dreamy and wistful, a lovely surprise in a bright key') },
    { id: 'bIII', off: 3, q: 'maj', fam: 'maj', w: { rock: 0.7, pop: 0.4, ambient: 0.5, _: 0.3 }, why: tx('Geleend (♭III): een onverwachte, heldere kleur', 'Borrowed (♭III): an unexpected, bright colour') },
    { id: 'V/V', off: 2, q: '7', fam: 'maj', w: { jazz: 0.9, classical: 0.8, soul: 0.7, pop: 0.5, folk: 0.4, blues: 0.4, _: 0.4 }, why: tx('Dominant van de dominant (II7): geeft extra aanloop naar V', 'Dominant of the dominant (II7): a bigger run-up to V') },
    { id: 'V/vi', off: 4, q: '7', fam: 'maj', w: { jazz: 0.8, classical: 0.6, pop: 0.5, soul: 0.7, _: 0.35 }, why: tx('Dominant van vi (III7): trekt sterk naar vi', 'Dominant of vi (III7): pulls strongly towards vi') },
    { id: 'V/ii', off: 9, q: '7', fam: 'maj', w: { jazz: 1, soul: 0.6, classical: 0.4, _: 0.3 }, why: tx('Dominant van ii (VI7): jazzy aanloop naar ii', 'Dominant of ii (VI7): a jazzy run-up to ii') },
    { id: 'V/IV', off: 0, q: '7', fam: 'maj', w: { blues: 1, folk: 0.5, rock: 0.5, soul: 0.5, jazz: 0.4, _: 0.3 }, why: tx('I7: wil naar IV, de klassieke blues-stap', 'I7: wants to go to IV, the classic blues step') },
    { id: 'subV', off: 1, q: '7', fam: 'maj', w: { jazz: 1, soul: 0.4, _: 0.1 }, why: tx('Tritonussubstitutie (♭II7): vervangt V7 en daalt chromatisch naar I', 'Tritone substitution (♭II7): replaces V7 and slides down chromatically to I') },
    { id: 'IV', off: 5, q: 'maj', fam: 'min', w: { rock: 0.8, folk: 0.7, soul: 0.7, jazz: 0.6, pop: 0.7, blues: 0.8, hiphop: 0.5, house: 0.5, _: 0.5 }, why: tx('Majeur IV in een mineur toonsoort (dorische kleur): licht en hoopvol', 'Major IV in a minor key (Dorian colour): light and hopeful') },
    { id: 'V', off: 7, q: 'maj', fam: 'min', w: { classical: 1, jazz: 0.8, folk: 0.7, rock: 0.6, pop: 0.6, hiphop: 0.7, house: 0.7, _: 0.6 }, why: tx('Majeur V met leidtoon (uit harmonisch mineur): sterke spanning naar i', 'Major V with leading tone (from harmonic minor): strong tension towards i') },
    { id: 'I', off: 0, q: 'maj', fam: 'min', w: { classical: 0.8, folk: 0.5, _: 0.2 }, why: tx('Majeur I (picardische terts): een zonnige afsluiting van een mineur stuk', 'Major I (Picardy third): a sunny ending to a minor piece') },
    { id: 'bII', off: 1, q: 'maj', fam: 'min', w: { classical: 0.8, jazz: 0.5, ambient: 0.5, hiphop: 0.3, _: 0.3 }, why: tx('Napolitaans akkoord (♭II): dramatisch, een klassieke verrassing voor het slot', 'Neapolitan chord (♭II): dramatic, a classic surprise before the cadence') },
    { id: 'bVII7', off: 10, q: '7', fam: 'min', w: { blues: 1, soul: 0.6, jazz: 0.5, rock: 0.5, _: 0.3 }, why: tx('♭VII7: dominant naar ♭III, bluesachtig', '♭VII7: dominant of ♭III, bluesy') },
  ];
  /** Suggesties voor het volgende akkoord. prev = eerdere akkoorden [{ root, q }] (laatste = nu), leeg = openingsakkoorden. */
  function suggest(opts) {
    const root = mod(opts.root | 0), scaleId = SCALES[opts.scale] ? opts.scale : 'major', style = STYLES[opts.style] ? opts.style : null, names = keyNames(root, scaleId);
    const ext = opts.ext || 'auto', dia = diatonic(root, scaleId, ext, style), prev = (opts.prev || []).filter(c => c && QID[c.q]), last = prev[prev.length - 1];
    const mk = (type, r, q, extra) => ({ type, root: mod(r), q, bass: null, name: chordName(r, q, null, names), pcs: chordPcs(r, q), rn: romanFor(r, q, root), ...extra });
    const items = [];
    let from;
    if (last) {
      const off = mod(last.root - root), hit = scaleChords(scaleId).find(c => c.off === off);
      from = hit ? { fn: hit.fn, deg: hit.deg, off } : { fn: 'S', deg: -1, off };
    }
    const safe = [];
    for (const c of dia) {
      let w, why;
      if (!from) { w = c.fn === 'T' ? (c.deg === 0 ? 1.2 : 0.7) : c.fn === 'S' ? 0.8 : 0.6; why = c.deg === 0 ? tx('Het thuisakkoord: een veilige plek om te beginnen', 'The home chord: a safe place to start') : FN_TEXT[c.fn]; }
      else {
        if (last.root === c.root) continue;
        w = transitionWeight(from, c, style);
        const key = `${from.fn}>${c.fn}${c.fn === 'T' ? (c.off === 0 ? '0' : '') : ''}`;
        why = MOVE_TEXT[key] || FN_TEXT[c.fn];
      }
      if (w < 0.4) continue;
      const type = c.fn === 'D' && w < 0.8 && from ? 'tension' : 'safe';
      safe.push(mk(type, c.root, c.q, { deg: c.deg, fn: c.fn, score: Math.round(w * 100) / 100, why: { nl: `${c.name} (${c.rn}): ${why.nl}`, en: `${c.name} (${c.rn}): ${why.en}` } }));
    }
    safe.sort((a, b) => b.score - a.score);
    const nSafe = safe.filter(s => s.type === 'safe').slice(0, 4), nTen = safe.filter(s => s.type === 'tension').slice(0, 1);
    items.push(...nSafe, ...nTen);
    // spanning: dominant septiem en sus4 op de vijfde trap (niet in blues/pentatoon waar V7 al de gewone vorm is)
    const sc = SCALES[scaleId];
    if (isSeven(sc)) {
      const v7 = mk('tension', root + 7, '7', { fn: 'D', score: 0.8, why: tx(`${names[mod(root + 7)]}7 (V7): dominant septiem, maakt de spanning groter en wil sterk naar thuis`, `${names[mod(root + 7)]}7 (V7): dominant seventh, raises the tension and pulls strongly home`) });
      const vs = mk('tension', root + 7, 'sus4', { fn: 'D', score: 0.6, why: tx(`${names[mod(root + 7)]}sus4 (Vsus4): blijft even zwevend voor het oplost`, `${names[mod(root + 7)]}sus4 (Vsus4): hangs in the air for a moment before it resolves`) });
      for (const t of [v7, vs]) if (!(last && last.root === t.root && last.q === t.q) && !items.some(i => i.root === t.root && i.q === t.q)) items.push(t);
    }
    // kleur: geleende akkoorden, secundaire dominanten, tritonussubstitutie
    const fam = sc.fam, wk = style || '_';
    const colors = COLORS.filter(c => c.fam === fam).map(c => ({ c, w: (c.w[wk] ?? c.w._ ?? 0.3) })).sort((a, b) => b.w - a.w);
    let nCol = 0;
    for (const { c, w } of colors) {
      if (nCol >= 3 || w < 0.3) break;
      const r = root + c.off; if (last && mod(last.root - r) === 0 && last.q === c.q) continue;
      if (items.some(i => i.root === mod(r) && i.q === c.q)) continue;
      const q = (STYLES[style] && STYLES[style].ext === 'seventh' && c.q === 'maj') ? 'maj7' : (STYLES[style] && STYLES[style].ext === 'seventh' && c.q === 'min') ? 'm7' : c.q;
      items.push(mk('color', r, q, { fn: 'O', score: Math.round(w * 100) / 100, why: { nl: `${chordName(r, q, null, names)} (${romanFor(r, q, root)}): ${c.why.nl}`, en: `${chordName(r, q, null, names)} (${romanFor(r, q, root)}): ${c.why.en}` } }));
      nCol++;
    }
    const order = { safe: 0, tension: 1, color: 2 };
    items.sort((a, b) => order[a.type] - order[b.type] || b.score - a.score);
    return items;
  }

  // ---------- 5. bas ----------
  const BASS_LO = 28, BASS_HI = 52;
  const bassNote = (pc, lo = BASS_LO) => { let n = lo + mod(pc - lo); return n; };
  /** Basadvies voor een akkoord: grondtoon, kwint, octaaf, slash-bas en een aanloopnoot naar het volgende akkoord. */
  function bassOptions(chord, next, scaleSet) {
    const q = QID[chord.q] || QID.maj, rootN = bassNote(chord.root), i5 = q.iv.findIndex((_, k) => q.roles[k] === '5');
    const five = rootN + (i5 >= 0 ? q.iv[i5] : 7), res = { root: rootN, fifth: five <= BASS_HI ? five : five - 12, octave: rootN + 12 <= BASS_HI ? rootN + 12 : rootN };
    res.slash = chord.bass != null && mod(chord.bass) !== mod(chord.root) ? bassNote(chord.bass) : null;
    if (next) {
      const t0 = bassNote(next.root), t1 = Math.abs(t0 + 12 - rootN) < Math.abs(t0 - rootN) ? t0 + 12 : t0, target = t1 > BASS_HI ? t1 - 12 : t1;
      res.approach = approach(target, scaleSet, rootN);
    } else res.approach = null;
    return res;
  }
  function approach(target, scaleSet, from) {
    // een noot net onder het doel (een trap in de schaal, anders een halve toon); komen we van boven, dan een halve toon erboven
    const inScale = n => !scaleSet || scaleSet.has(mod(n));
    const below = inScale(target - 1) ? target - 1 : inScale(target - 2) ? target - 2 : target - 1;
    return from > target ? target + 1 : below;
  }
  const BASS_MODES = ['hold', 'rootFifth', 'walking', 'pulse'];
  /** Een basfiguur voor één akkoord van `beats` tellen. Geeft [{ beat, note, dur, vel }] (beat en dur in tellen). */
  function bassFigure(chord, next, mode, beats, scaleSet) {
    const o = bassOptions(chord, next, scaleSet), q = QID[chord.q] || QID.maj, ev = [];
    const i3 = q.iv.findIndex((_, k) => q.roles[k] === '3'), third = o.root + (i3 >= 0 ? q.iv[i3] : 4), start = o.slash != null ? o.slash : o.root;
    const clampB = n => { while (n > BASS_HI) n -= 12; while (n < BASS_LO) n += 12; return n; };
    if (mode === 'hold' || !BASS_MODES.includes(mode)) ev.push({ beat: 0, note: start, dur: beats * 0.95, vel: 1 });
    else if (mode === 'rootFifth') {
      for (let b = 0; b < beats; b += 4) {
        const chunk = Math.min(4, beats - b);
        if (chunk >= 3) { ev.push({ beat: b, note: start, dur: 1.9, vel: 1 }, { beat: b + 2, note: o.fifth, dur: Math.max(0.9, chunk - 2.1), vel: 0.85 }); }
        else if (chunk === 2) ev.push({ beat: b, note: start, dur: 0.9, vel: 1 }, { beat: b + 1, note: o.fifth, dur: 0.9, vel: 0.85 });
        else ev.push({ beat: b, note: start, dur: 0.9, vel: 1 });
      }
    } else if (mode === 'pulse') {
      for (let j = 0; j < beats * 2; j++) ev.push({ beat: j / 2, note: j % 4 === 3 ? o.octave : start, dur: 0.45, vel: j % 2 === 0 ? 1 : 0.7 });
    } else {   // walking: grondtoon, terts, kwint, en op de laatste tel een aanloopnoot naar het volgende akkoord
      for (let b = 0; b < beats; b++) {
        const pos = b % 4, isLast = b === beats - 1;
        const note = pos === 0 ? start : isLast && o.approach != null && next ? o.approach : pos === 2 ? o.fifth : third;
        ev.push({ beat: b, note, dur: 0.95, vel: pos === 0 ? 1 : 0.8 });
      }
    }
    return ev.map(e => ({ ...e, note: clampB(e.note) }));
  }

  // ---------- 6. stemvoering ----------
  function voiceTones(chord, N, two) {
    const q = QID[chord.q] || QID.maj, items = q.iv.map((i, k) => ({ pc: mod(chord.root + i), role: q.roles[k] })), has7 = items.some(x => x.role === '7'), has9 = items.some(x => x.role === '9');
    let pick = [];
    if (N >= items.length) {
      pick = items.slice(); const dbl = ['R', '5', '3', 'R', '5', '3'];
      for (let k = 0; pick.length < N; k++) { const role = dbl[k % dbl.length], src = items.find(x => x.role === role) || items[0]; pick.push({ ...src }); }
    } else {
      let pri;
      if (N === 2) pri = (two === 'rootthird' || (two !== 'guide' && !has7)) ? ['R', '3', '5', '7', '9'] : ['3', '7', 'R', '5', '9'];
      else if (has7 && has9 && N >= 4) pri = ['3', '7', '9', 'R', '5'];
      else if (has7) pri = ['3', '7', 'R', '5', '9'];
      else pri = ['R', '3', '5', '9'];
      for (const role of pri) for (const it of items) if (it.role === role && pick.length < N) pick.push(it);
    }
    return pick.map(x => x.pc);
  }
  /** Bij meer stemmen dan akkoordtonen: alle redelijke verdubbelingen (grondtoon en kwint, bij veel stemmen ook de terts). */
  function voiceToneSets(chord, N, two) {
    const q = QID[chord.q] || QID.maj, items = q.iv.map((i, k) => ({ pc: mod(chord.root + i), role: q.roles[k] }));
    if (N <= items.length) return [voiceTones(chord, N, two)];
    const m = N - items.length, pool = m >= 3 ? ['R', '5', '3'] : ['R', '5'], out = [];
    const gen = (k, from, acc) => { if (!k) { out.push(acc.slice()); return; } for (let i = from; i < pool.length; i++) { acc.push(pool[i]); gen(k - 1, i, acc); acc.pop(); } };
    gen(m, 0, []);
    return out.map(extra => items.map(x => x.pc).concat(extra.map(role => (items.find(x => x.role === role) || items[0]).pc)));
  }
  function closeVoicings(pcs, lo, hi) {
    const n = pcs.length, maxSpan = n <= 4 && new Set(pcs).size >= 3 ? 12 : 24, out = [], seen = new Set();
    for (let s = 0; s < n; s++) {
      const start = pcs[s], cnt = {};
      const offs = pcs.filter((_, i) => i !== s).map(p => { let d = mod(p - start); if (d === 0) d = 12; const k = cnt[d] || 0; cnt[d] = k + 1; return d + 12 * k; }).sort((a, b) => a - b);
      for (let base = lo; base <= hi; base++) if (mod(base) === start) {
        const v = [base, ...offs.map(o => base + o)];
        if (v[n - 1] > hi || v[n - 1] - v[0] > maxSpan) continue;
        const key = v.join(','); if (!seen.has(key)) { seen.add(key); out.push(v); }
      }
    }
    return out;
  }
  const SHAPES = {
    close: v => v,
    open: v => v.length === 2 ? [v[0], v[1] + 12] : v.map((x, i) => (i % 2 === 1 ? x + 12 : x)).sort((a, b) => a - b),
    drop2: v => { if (v.length < 3) return v; const w = v.slice(); w[w.length - 2] -= 12; return w.sort((a, b) => a - b); },
  };
  /** Voicings met zo min mogelijk beweging tussen opeenvolgende akkoorden (dynamisch programmeren over kandidaat-voicings). */
  function voiceLead(chords, opts = {}) {
    const N = Math.max(2, Math.min(6, opts.voices | 0 || 4)), shape = SHAPES[opts.shape] ? opts.shape : 'close', lo = opts.lo ?? 48, hi = opts.hi ?? lo + 36;
    const names = opts.names || DEFAULT_NAMES, cands = [];
    for (const ch of chords) {
      const sets = voiceToneSets(ch, N, opts.two), seen = new Set();
      let list = [], L = lo, H = hi;
      for (let tries = 0; tries < 3 && !list.length; tries++) {
        for (const pcs of sets) for (const v of closeVoicings(pcs, L, H).map(SHAPES[shape])) {
          const key = v.join(','); if (seen.has(key) || v[0] < lo - 12 * tries || v[v.length - 1] > hi + 12 * tries || v.length !== N || v.some((x, i) => i && x <= v[i - 1])) continue;
          seen.add(key); list.push(v);
        }
        L -= 12; H += 12;
      }
      if (!list.length && shape !== 'close') {   // te veel stemmen voor deze vorm: val terug op dichte ligging
        for (const pcs of sets) for (const v of closeVoicings(pcs, lo, hi)) if (v.length === N && !v.some((x, i) => i && x <= v[i - 1])) list.push(v);
      }
      cands.push(list);
    }
    const center = lo + 12, move = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s; };
    // de beweging telt; de rest (bovenstem rustig, midden dichtbij het midden van het bereik) beslist alleen bij gelijke beweging
    const tie = (a, b) => 0.0005 * (Math.abs(a[a.length - 1] - (b ? b[b.length - 1] : a[a.length - 1])) + Math.abs(a.reduce((x, y) => x + y, 0) / a.length - center) * 2);
    const dp = [], from = [];
    chords.forEach((_, i) => {
      dp[i] = []; from[i] = [];
      cands[i].forEach((v, j) => {
        if (i === 0) { dp[i][j] = tie(v, null); from[i][j] = -1; return; }
        let best = Infinity, bi = 0;
        cands[i - 1].forEach((u, k) => { const c = dp[i - 1][k] + move(u, v) + tie(v, u); if (c < best) { best = c; bi = k; } });
        dp[i][j] = best; from[i][j] = bi;
      });
    });
    const picked = new Array(chords.length);
    if (chords.length) {
      let bj = 0, bc = Infinity; dp[chords.length - 1].forEach((c, j) => { if (c < bc) { bc = c; bj = j; } });
      for (let i = chords.length - 1; i >= 0; i--) { picked[i] = bj; bj = from[i][bj]; }
    }
    let total = 0;
    const voicings = chords.map((ch, i) => {
      const notes = cands[i][picked[i]] || [], prev = i ? cands[i - 1][picked[i - 1]] : null, mv = prev && prev.length === notes.length ? notes.map((n, k) => n - prev[k]) : notes.map(() => 0);
      const t = mv.reduce((a, b) => a + Math.abs(b), 0); total += t;
      return { chord: ch, notes, names: notes.map(n => midiName(n, names)), move: mv, total: t };
    });
    return { voicings, total };
  }
  /** Ter vergelijking: elk akkoord in grondligging, dicht bij elkaar vanaf het octaaf boven `base`. */
  function naiveVoicing(chords, opts = {}) {
    const N = Math.max(2, Math.min(6, opts.voices | 0 || 4)), shape = SHAPES[opts.shape] ? opts.shape : 'close', base = (opts.base ?? 48) + (shape === 'drop2' ? 12 : 0);
    let total = 0, prev = null;
    const out = chords.map(ch => {
      const pcs = voiceTones(ch, N, opts.two), first = pcs[0], offs = [], count = {};
      for (let i = 1; i < pcs.length; i++) { const d = mod(pcs[i] - first); const k = count[d] = (count[d] || 0); count[d]++; offs.push((d === 0 ? 12 : d) + 12 * k); }
      offs.sort((a, b) => a - b);
      const b0 = base + mod(first - base), notes = SHAPES[shape]([b0, ...offs.map(o => b0 + o)]);
      if (prev && prev.length === notes.length) total += notes.reduce((s, n, i) => s + Math.abs(n - prev[i]), 0);
      prev = notes; return notes;
    });
    return { voicings: out, total };
  }

  return { mod, parseNote, Q, QID, QNAMES, SCALES, SCALE_ORDER, STYLES, STYLE_ORDER, FN_TEXT, FN_NAME, CONF, DEFAULT_NAMES, keyNames, midiName, chordName, chordPcs, rootPosition,
    recognize, diatonic, scaleChords, functionOf, explainChord, romanFor, detectKey, keyReasons, keyLabel, parseRoman, buildProgression, progressions, suggest,
    bassOptions, bassFigure, BASS_MODES, BASS_LO, BASS_HI, voiceTones, voiceLead, naiveVoicing, resolveExt };
})();
// </theory>

const PAD_COUNT = 16;
const DEF_BASS = { pop: 'rootFifth', rock: 'pulse', folk: 'rootFifth', blues: 'walking', jazz: 'walking', classical: 'hold', soul: 'rootFifth', hiphop: 'hold', house: 'pulse', ambient: 'hold', '': 'rootFifth' };
const SPEC = { vel: [0.05, 1], bassVel: [0.05, 1], len: [0.1, 4], gate: [0.1, 1], strum: [0, 60] };
const PRESET_KEYS = ['name', 'key', 'scale', 'style', 'ext', 'pads', 'beats', 'loop', 'voiceOn', 'bassOn', 'bassMode', 'voices', 'voicing'];

export default {
  id: 'nl.patchkamer.chordbuddy', name: 'Chord Buddy', version: '1.1.0', kind: 'utility', category: 'tool',
  ui: { width: 900, minWidth: 380 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'in', name: 'In' }], eventOut: [{ id: 'chords', name: 'Chords' }, { id: 'bass', name: 'Bass' }], modIn: [], modOut: [] },
  i18n: { nl: { ports: { in: 'In', chords: 'Akkoorden', bass: 'Bas' } } },
  // Bewust niet stuurbaar: keuzes, basisnoot van de pads, octaven, kanalen, bereik en het aantal stemmen (klikken en wisselen van noten bij modulatie).
  modExclude: ['padBase', 'chordOct', 'bassOct', 'chCh', 'bassCh', 'lo', 'voices', 'beats', 'key'],
  create(ctx, host) {
    const NL = host.lang === 'nl', L = NL ? 'nl' : 'en';
    const T = (nl, en) => (NL ? nl : en);
    const P = o => (o ? o[L] : '');
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const fin = (v, d, a, b) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d);
    const mod12 = THEORY.mod;
    let dead = false, self = null, root = null, stopFrame = null;
    const DEF = () => ({ key: 0, scale: 'major', style: '', ext: 'auto', pad: 0, pads: Array(PAD_COUNT).fill(null), chosen: null, heard: [], cur: null, listen: true, follow: false, padMidi: true, padBase: 36,
      name: '', beats: 4, loop: true, voiceOn: false, bassOn: true, bassMode: 'rootFifth', voices: 4, voicing: 'close', lo: 48,
      vel: 0.8, bassVel: 0.85, len: 1.2, gate: 0.9, strum: 0, chordOct: 0, bassOct: 0, chCh: 1, bassCh: 1 });
    let S = DEF(), modOff = {};
    const ui = { msg: '', found: null, explain: '', preview: false, sugg: [], undo: null };
    let held = new Map(), peak = new Set(), run = { armed: false, on: false, pos: 0, seq: [], voicings: null, bassEv: [] }, playIdx = -1, sounding = new Map(), dirty = new Set(), ctl = {}, els = {};
    const names = () => THEORY.keyNames(S.key, S.scale);
    const styleOrNull = () => (S.style ? S.style : null);
    const eff = k => { const [a, b] = SPEC[k], o = modOff[k] || 0; return clamp(S[k] + o * (b - a), a, b); };

    // ---------- akkoorden ----------
    const cleanChord = c => {
      if (!c || typeof c !== 'object' || !THEORY.QID[c.q]) return null;
      const r = Math.round(fin(c.r, -1, -1, 11)); if (r < 0) return null;
      const n = Array.isArray(c.n) ? c.n.map(x => Math.round(fin(x, -1, -1, 127))).filter(x => x >= 0).slice(0, 8) : [];
      if (!n.length) return null;
      const b = c.b == null ? null : Math.round(fin(c.b, -1, -1, 11));
      return { r, q: c.q, b: b == null || b < 0 || b === r ? null : b, n: n.sort((x, y) => x - y) };
    };
    const fromCand = c => (c && c.q ? cleanChord({ r: c.root, q: c.q, b: c.bass, n: c.notes }) : null);
    const fromItem = it => cleanChord({ r: it.root, q: it.q, b: null, n: THEORY.rootPosition(it.root, it.q, 48) });
    const nameOf = c => THEORY.chordName(c.r, c.q, c.b, names());
    const noteList = (arr, nm) => arr.map(n => THEORY.midiName(n, nm || names())).join(' ');
    const fnOf = c => THEORY.functionOf(c.r, c.q, S.key, S.scale);
    const same = (a, b) => a && b && a.r === b.r && a.q === b.q && a.b === b.b && a.n.join() === b.n.join();
    const occupied = () => S.pads.map((c, i) => (c ? { c, i } : null)).filter(Boolean);

    // ---------- uitgang ----------
    const emit = (port, ev) => { if (dead) return; try { host.emit(self, port, ev); } catch (e) { /* host weigert: negeren */ } };
    const chOf = port => (port === 'bass' ? S.bassCh : S.chCh);
    function sendNote(port, note, vel, time, dur) {
      note = clamp(Math.round(note), 0, 127);
      emit(port, { type: 'note', note, vel: clamp(vel, 0.01, 1), time, dur: Math.max(0.02, dur), ch: chOf(port) });
      sounding.set(port + note, Math.max(sounding.get(port + note) || 0, time + dur));
    }
    function playChord(c, time = ctx.currentTime + 0.01, dur = eff('len'), notes = null) {
      if (!c) return;
      const list = (notes || c.n).map(n => n + 12 * S.chordOct).filter(n => n >= 0 && n <= 127), sp = list.length > 1 ? eff('strum') / 1000 / (list.length - 1) : 0;
      list.forEach((n, i) => sendNote('chords', n, eff('vel'), time + i * sp, dur));
    }
    function playBassNote(note, time = ctx.currentTime + 0.01, dur = 0.6) { sendNote('bass', note + 12 * S.bassOct, eff('bassVel'), time, dur); }
    function panic() {
      const t = ctx.currentTime;
      for (const key of sounding.keys()) { const port = key.startsWith('bass') ? 'bass' : 'chords'; emit(port, { type: 'noteoff', note: +key.slice(port.length), vel: 0, time: t, ch: chOf(port) }); }
      sounding.clear(); emit('chords', { type: 'allnotesoff', time: t }); emit('bass', { type: 'allnotesoff', time: t });
    }

    // ---------- bewaren in pads, ongedaan maken ----------
    const snapshot = () => { ui.undo = JSON.parse(JSON.stringify({ pads: S.pads, key: S.key, chosen: S.chosen })); };
    function say(m) { ui.msg = m; mark('pads', 'set'); }
    function saveToPad() {
      const c = S.chosen; if (!c) { say(T('Kies of speel eerst een akkoord.', 'Choose or play a chord first.')); return; }
      const i = S.pad, prev = S.pads[i]; snapshot(); S.pads[i] = JSON.parse(JSON.stringify(c));
      say(prev ? T(`Pad ${i + 1} overschreven: ${nameOf(prev)} → ${nameOf(c)}`, `Pad ${i + 1} overwritten: ${nameOf(prev)} → ${nameOf(c)}`) : T(`${nameOf(c)} bewaard in pad ${i + 1}`, `${nameOf(c)} saved in pad ${i + 1}`));
      if (!prev) { const nx = S.pads.findIndex((p, k) => !p && k > i); if (nx >= 0) S.pad = nx; }
      refresh('pads', 'advice', 'listen');
    }
    function clearPad() { const i = S.pad, prev = S.pads[i]; if (!prev) { say(T(`Pad ${i + 1} is al leeg.`, `Pad ${i + 1} is already empty.`)); return; } snapshot(); S.pads[i] = null; say(T(`Pad ${i + 1} leeggemaakt (was ${nameOf(prev)})`, `Pad ${i + 1} cleared (was ${nameOf(prev)})`)); refresh('pads', 'advice'); }
    function undo() {
      if (!ui.undo) { say(T('Niets om ongedaan te maken.', 'Nothing to undo.')); return; }
      const u = ui.undo; ui.undo = null; S.pads = u.pads.map(cleanChord); S.key = u.key; syncCtl(); say(T('Laatste wijziging ongedaan gemaakt.', 'Last change undone.')); refresh('key', 'pads', 'advice', 'listen');
    }
    function playPad(i) { const c = S.pads[i]; if (!c) return; playChord(c); }

    // ---------- luisteren ----------
    function pushHeard(c) { if (!c) return; if (same(S.heard[S.heard.length - 1], c)) return; S.heard.push(c); if (S.heard.length > 4) S.heard.shift(); }
    function candsOf(notes) { return THEORY.recognize(notes, names()); }
    function commit() {
      if (!peak.size || held.size) return;
      const notes = [...peak].sort((a, b) => a - b); peak.clear();
      if (notes.length < 2) { S.cur = { notes, sel: 0 }; mark('listen'); return; }
      const rec = candsOf(notes); if (!rec.best || rec.best.single) { S.cur = { notes, sel: 0 }; mark('listen'); return; }
      S.cur = { notes: notes.slice(0, 8), sel: 0 }; const c = fromCand(rec.best); S.chosen = c;
      if (S.listen) pushHeard(c);
      if (S.follow) followKey();
      mark('listen', 'key', 'pads');
    }
    function prune() { const now = ctx.currentTime; let gone = false; for (const [n, u] of held) if (u <= now) { held.delete(n); gone = true; } if (gone) commit(); }
    function followKey() {
      const list = keyInput(); if (list.length < 2) return;
      const k = THEORY.detectKey(list, { limit: 3 }); if (k.confidence === 'unsure' || !k.list[0]) return;
      setKey(k.list[0].root, k.list[0].scale);
    }
    function setKey(r, sc) { S.key = r; S.scale = sc; syncCtl(); mark('key', 'listen', 'pads', 'advice'); }
    const keyInput = () => {
      const src = S.heard.length ? S.heard : occupied().map(o => o.c).length ? occupied().map(o => o.c) : S.chosen ? [S.chosen] : [];
      return src.map(c => ({ root: c.r, q: c.q }));
    };
    function useCurrent() {
      if (!S.cur || S.cur.notes.length < 2) { say(T('Speel eerst een akkoord op je keyboard.', 'Play a chord on your keyboard first.')); return; }
      const rec = candsOf(S.cur.notes), cand = rec.cands[S.cur.sel] || rec.best, c = fromCand(cand); if (!c) return;
      S.chosen = c; const last = S.heard[S.heard.length - 1];
      if (last && last.n.join() === c.n.join()) S.heard[S.heard.length - 1] = c; else pushHeard(c);
      ui.msg = T(`${nameOf(c)} toegevoegd aan de gespeelde akkoorden.`, `${nameOf(c)} added to the played chords.`); refresh('listen', 'key', 'pads');
    }
    function chooseChord(c, play = true, why = '') { if (!c) return; S.chosen = c; ui.explain = why; if (play) playChord(c); refresh('key', 'listen', 'pads'); }

    // ---------- set afspelen (volgt de klok van de host) ----------
    function begin() {
      run.seq = occupied().map(o => o.c);
      run.voicings = null;
      if (S.voiceOn && run.seq.length) {
        const vl = THEORY.voiceLead(run.seq.map(c => ({ root: c.r, q: c.q })), { voices: S.voices, shape: S.voicing, lo: S.lo, hi: S.lo + 36, names: names() });
        run.voicings = vl.voicings.map(v => v.notes);
      }
      run.on = true; run.pos = 0; run.bassEv = [];
    }
    function start() {
      if (!occupied().length) { say(T('Zet eerst akkoorden in de pads.', 'Put chords in the pads first.')); return; }
      run.armed = true; run.on = false; ui.msg = T('Wacht op de klok: start de transport van Patchkamer.', 'Waiting for the clock: start the Patchkamer transport.'); refresh('set', 'pads');
    }
    function stop() { run.armed = false; run.on = false; playIdx = -1; panic(); ui.msg = T('Gestopt.', 'Stopped.'); refresh('set', 'pads'); }
    function stepDurOf(info) { return Number.isFinite(info && info.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0.125; }
    function onStep(info) {
      if (dead || !run.armed || !info || !Number.isFinite(info.time)) return;
      const slot = S.beats * 4, sd = stepDurOf(info);
      if (!run.on) { if (!(S.beats >= 4 ? info.step === 0 : info.step % 4 === 0)) return; begin(); if (!run.seq.length) { run.armed = false; return; } }
      let i = Math.floor(run.pos / slot);
      if (i >= run.seq.length) { if (S.loop) { run.pos = 0; i = 0; } else { run.armed = false; run.on = false; playIdx = -1; panic(); ui.msg = T('Klaar.', 'Done.'); mark('set', 'pads'); return; } }
      const within = run.pos % slot, c = run.seq[i];
      if (within === 0) {
        playIdx = i; mark('pads', 'set');
        playChord(c, info.time, slot * sd * eff('gate'), run.voicings ? run.voicings[i] : null);
        run.bassEv = [];
        if (S.bassOn) {
          const nx = run.seq[(i + 1) % run.seq.length], scale = new Set(THEORY.SCALES[S.scale].iv.map(x => mod12(S.key + x)));
          run.bassEv = THEORY.bassFigure({ root: c.r, q: c.q, bass: c.b }, nx ? { root: nx.r, q: nx.q } : null, S.bassMode, S.beats, scale);
        }
      }
      for (const e of run.bassEv) if (Math.round(e.beat * 4) === within) sendNote('bass', e.note + 12 * S.bassOct, eff('bassVel') * e.vel, info.time, e.dur * 4 * sd);
      run.pos++;
    }

    // ---------- UI-hulpjes ----------
    const E = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (p) p.appendChild(e); return e; };
    const adopt = (e, o) => { try { if (host.ui && typeof host.ui.adopt === 'function') host.ui.adopt(e, o); } catch (x) { /* oudere host */ } return e; };
    const nostop = e => { e.addEventListener('pointerdown', ev => ev.stopPropagation()); return e; };
    function mkBtn(p, label, id, group, fn, cls) { const b = E(p, 'button', cls || 'btn', label); b.type = 'button'; b.onclick = fn; nostop(b); adopt(b, { id, role: 'button', group, label }); return b; }
    function mkSel(p, label, id, group, opts, fn) {
      const w = E(p, 'label', 'ctl'); E(w, 'span', '', label); const s = E(w, 'select'); nostop(s);
      for (const [v, t] of opts) { const o = E(s, 'option', '', t); o.value = String(v); }
      s.value = String(S[id]); s.setAttribute('aria-label', label); s.onchange = () => { fn(s.value); };
      adopt(s, { id, role: 'select', group, label }); ctl[id] = v => { s.value = String(v); }; return s;
    }
    function mkKnob(p, label, id, group, min, max, step, fmt) {
      const w = E(p, 'label', 'ctl'); E(w, 'span', '', label); const out = E(w, 'output', '', fmt(S[id])), i = E(w, 'input'); nostop(i);
      i.type = 'range'; i.min = String(min); i.max = String(max); i.step = String(step); i.value = String(S[id]); i.dataset.pkDefault = String(S[id]); i.setAttribute('aria-label', label);
      i.oninput = () => { S[id] = +i.value; out.textContent = fmt(S[id]); };
      adopt(i, { id, role: 'param', group, label }); ctl[id] = v => { i.value = String(v); out.textContent = fmt(+v); }; return i;
    }
    function mkChk(p, label, id, group, fn) {
      const w = E(p, 'label', 'ctl chk'), i = E(w, 'input'); nostop(i); i.type = 'checkbox'; i.checked = !!S[id]; E(w, 'span', '', label); i.setAttribute('aria-label', label);
      i.onchange = () => { S[id] = i.checked; if (fn) fn(); }; adopt(i, { id, role: 'toggle', group, label }); ctl[id] = v => { i.checked = !!v; }; return i;
    }
    function syncCtl() { for (const id in ctl) if (id in S) ctl[id](S[id]); if (els.name) els.name.value = S.name; }
    const fnCls = f => 'fn' + f;
    const fnLabel = f => P(THEORY.FN_NAME[f]);
    const noteOpts = (a, b, step = 1) => { const o = []; for (let n = a; n <= b; n += step) o.push([n, THEORY.midiName(n)]); return o; };

    // ---------- tekenen ----------
    function mark(...k) { k.forEach(x => dirty.add(x)); if (!stopFrame && root) flush(); }
    function refresh(...k) { k.forEach(x => dirty.add(x)); flush(); }
    function flush() {
      if (dead || !root || !dirty.size) return;
      const d = [...dirty]; dirty.clear();
      try {
        if (d.includes('key')) paintKey();
        if (d.includes('listen')) paintListen();
        if (d.includes('pads')) paintPads();
        if (d.includes('set')) paintSet();
        if (d.includes('advice')) paintAdvice();
      } catch (e) { /* tekenen mag nooit de klok storen */ }
    }
    function chipBtn(p, c, id, group, fn, extra) {
      const f = extra && extra.fn ? extra.fn : fnOf(c), b = E(p, 'button', 'chip ' + fnCls(f)); b.type = 'button'; nostop(b);
      if (extra && extra.rn) E(b, 'small', '', extra.rn);
      E(b, 'b', '', extra && extra.name ? extra.name : nameOf(c)); if (extra && extra.sub) E(b, 'small', '', extra.sub);
      b.title = extra && extra.title ? extra.title : ''; b.onclick = fn; adopt(b, { id, role: 'button', group, label: nameOf(c) }); return b;
    }
    function paintKey() {
      const box = els.dia; if (!box) return; box.replaceChildren();
      const dia = THEORY.diatonic(S.key, S.scale, S.ext, styleOrNull());
      dia.forEach((it, k) => {
        const c = fromItem(it);
        chipBtn(box, c, 'deg' + (k + 1), 'key', () => chooseChord(c, true, `${it.name} (${it.rn}): ${P(THEORY.FN_TEXT[it.fn])}`), { fn: it.fn, rn: it.rn, name: it.name, sub: fnLabel(it.fn), title: P(THEORY.FN_TEXT[it.fn]) });
      });
      els.explain.textContent = ui.explain || T('Klik op een akkoord om het te horen en te kiezen.', 'Click a chord to hear and select it.');
      const st = S.style ? THEORY.STYLES[S.style] : null;
      els.styleNote.textContent = st ? P(st.note) + ' ' + T('Stijlen zijn richtlijnen, geen regels.', 'Styles are guidelines, not rules.') : T('Geen stijl: algemene, veilige keuzes.', 'No style: general, safe choices.');
      els.prog.replaceChildren();
      THEORY.progressions(S.key, S.scale, styleOrNull()).forEach((p, k) => {
        const r = E(els.prog, 'div', 'prow'); E(r, 'span', 'pn', P(p.name)); E(r, 'span', 'pc', p.chords.map(c => c.name).join(' – '));
        mkBtn(r, T('Speel', 'Play'), 'progPlay' + (k + 1), 'key', () => { const t = ctx.currentTime + 0.05; p.chords.forEach((c, i) => playChord(fromItem(c), t + i * 1.0, 0.9)); }, 'btn sm');
        mkBtn(r, T('Gebruik als set', 'Use as set'), 'progUse' + (k + 1), 'key', () => useProgression(p), 'btn sm');
      });
      els.found.replaceChildren();
      if (ui.found) {
        const f = ui.found;
        if (!f.list.length) E(els.found, 'p', 'hint', T('Speel eerst een akkoord of zet akkoorden in de pads, dan kan ik de toonsoort zoeken.', 'Play a chord or put chords in the pads first, then I can look for the key.'));
        else {
          E(els.found, 'p', 'hint', T(`Op basis van ${f.n} akkoord${f.n === 1 ? '' : 'en'}: ${P(THEORY.CONF[f.conf])}.`, `Based on ${f.n} chord${f.n === 1 ? '' : 's'}: ${P(THEORY.CONF[f.conf])}.`));
          f.list.slice(0, 3).forEach((cand, k) => {
            const card = E(els.found, 'div', 'cand'), head = E(card, 'div', 'prow');
            E(head, 'b', '', `${k + 1}. ${THEORY.keyLabel(cand.root, cand.scale, L)}`);
            mkBtn(head, T('Kies deze toonsoort', 'Choose this key'), 'cand' + (k + 1), 'key', () => { setKey(cand.root, cand.scale); ui.found = null; refresh('key'); }, 'btn sm');
            const ul = E(card, 'ul', 'why'); THEORY.keyReasons(cand, f.chords).forEach(r => E(ul, 'li', r.ok === true ? 'yes' : r.ok === false ? 'no' : '', (r.ok === true ? '+ ' : r.ok === false ? '– ' : '· ') + P(r)));
          });
        }
      }
    }
    function useProgression(p) {
      snapshot(); S.pads = Array(PAD_COUNT).fill(null);
      p.chords.forEach((c, i) => { S.pads[i] = fromItem(c); }); S.pad = Math.min(4, PAD_COUNT - 1);
      S.name = p.enName; if (els.name) els.name.value = S.name;
      say(T(`Set “${p.enName}” in pad 1–4 gezet (ongedaan maken kan).`, `Set “${p.enName}” put in pads 1–4 (you can undo).`)); refresh('pads', 'advice', 'listen');
    }
    function liveRec() { return held.size >= 1 ? candsOf([...held.keys()]) : S.cur && S.cur.notes.length ? candsOf(S.cur.notes) : null; }
    function paintListen() {
      const box = els.listenBox; if (!box) return; box.replaceChildren();
      const live = held.size > 0, notes = live ? [...held.keys()].sort((a, b) => a - b) : S.cur ? S.cur.notes : [];
      E(box, 'p', 'notes', (live ? T('Nu gespeeld: ', 'Playing now: ') : T('Laatst gespeeld: ', 'Last played: ')) + (notes.length ? noteList(notes) : '–'));
      const rec = liveRec();
      if (rec && rec.best && !rec.best.single) {
        const sel = live ? 0 : (S.cur ? S.cur.sel : 0), cur = rec.cands[sel] || rec.best;
        const h = E(box, 'p', 'big'); E(h, 'b', '', cur.name); E(h, 'span', 'hint', ' ' + P(THEORY.CONF[rec.confidence]) + (cur.inv ? T(` · ${cur.inv}e omkering`, ` · inversion ${cur.inv}`) : '') + (cur.missing.length ? T(' · onvolledig (kwint ontbreekt)', ' · incomplete (fifth missing)') : '') + ' · ' + P(THEORY.QNAMES[cur.q]));
        if (rec.cands.length > 1) {
          const alt = E(box, 'div', 'chips'); E(alt, 'span', 'hint', T('Ook mogelijk:', 'Also possible:'));
          rec.cands.forEach((c, k) => { if (k === sel) return; const b = E(alt, 'button', 'chip sm'); b.type = 'button'; nostop(b); E(b, 'b', '', c.name); b.onclick = () => { if (!live && S.cur) { S.cur.sel = k; S.chosen = fromCand(c); const last = S.heard[S.heard.length - 1]; if (last && last.n.join() === S.cur.notes.join()) S.heard[S.heard.length - 1] = S.chosen; } refresh('listen', 'pads'); }; adopt(b, { id: 'alt' + (k + 1), role: 'button', group: 'listen', label: c.name }); });
        }
      } else if (rec && rec.best && rec.best.single) E(box, 'p', 'hint', T(`Eén noot (${rec.best.name}). Speel minstens drie noten voor een akkoord.`, `One note (${rec.best.name}). Play at least three notes for a chord.`));
      else E(box, 'p', 'hint', T('Speel een akkoord op je MIDI-keyboard (verbind Keys of een Pad Controller met de ingang In).', 'Play a chord on your MIDI keyboard (connect Keys or a Pad Controller to the In port).'));
      const hl = E(box, 'div', 'chips'); E(hl, 'span', 'hint', T('Gespeelde akkoorden:', 'Played chords:'));
      if (!S.heard.length) E(hl, 'span', 'hint', '–');
      S.heard.forEach((c, k) => chipBtn(hl, c, 'heard' + (k + 1), 'listen', () => chooseChord(c, true), { sub: noteList(c.n) }));
      // toonsoort live
      const list = keyInput(), kline = E(box, 'p', 'hint');
      if (list.length) {
        const k = THEORY.detectKey(list, { limit: 3 });
        kline.textContent = T('Toonsoort (live): ', 'Key (live): ') + k.list.slice(0, 3).map(x => THEORY.keyLabel(x.root, x.scale, L)).join(' · ') + ' · ' + P(THEORY.CONF[k.confidence]);
      } else kline.textContent = T('Toonsoort (live): speel een akkoord, dan komt hier een voorstel.', 'Key (live): play a chord and a proposal appears here.');
      // suggesties
      const prev = S.heard.length ? S.heard : S.chosen ? [S.chosen] : [];
      const sug = THEORY.suggest({ root: S.key, scale: S.scale, style: styleOrNull(), ext: S.ext, prev: prev.map(c => ({ root: c.r, q: c.q })) });
      E(box, 'h4', '', prev.length ? T(`Volgend akkoord na ${nameOf(prev[prev.length - 1])}`, `Next chord after ${nameOf(prev[prev.length - 1])}`) : T('Om mee te beginnen', 'To start with'));
      for (const [type, title] of [['safe', T('Veilig', 'Safe')], ['tension', T('Spanning', 'Tension')], ['color', T('Kleur / verrassing', 'Colour / surprise')]]) {
        const items = sug.filter(s => s.type === type); if (!items.length) continue;
        const grp = E(box, 'div', 'sgrp ' + type); E(grp, 'h5', '', title);
        items.forEach((s, k) => {
          const row = E(grp, 'div', 'srow'), c = fromItem(s);
          chipBtn(row, c, 'sug_' + type + (k + 1), 'listen', () => chooseChord(c, true, P(s.why)), { fn: s.fn || 'O', name: s.name, sub: s.rn });
          E(row, 'span', 'why1', P(s.why));
        });
      }
      E(box, 'p', 'hint', T('Dit zijn suggesties: richtlijnen, geen regels. Vertrouw je oor.', 'These are suggestions: guidelines, not rules. Trust your ear.'));
    }
    function paintPads() {
      const g = els.padGrid; if (!g) return; g.replaceChildren();
      for (let i = 0; i < PAD_COUNT; i++) {
        const c = S.pads[i], f = c ? fnOf(c) : 'E', b = E(g, 'button', 'pad ' + (c ? fnCls(f) : 'empty') + (i === S.pad ? ' sel' : '') + (i === playIdx ? ' now' : '')); b.type = 'button'; nostop(b);
        E(b, 'small', '', String(i + 1) + (S.padMidi ? ' · ' + THEORY.midiName(S.padBase + i) : ''));
        E(b, 'b', '', c ? nameOf(c) : T('leeg', 'empty')); if (c) E(b, 'small', 'nn', noteList(c.n)); if (c) E(b, 'small', 'rn', THEORY.romanFor(c.r, c.q, S.key) + ' · ' + fnLabel(f));
        b.setAttribute('aria-label', T(`Pad ${i + 1}: ${c ? nameOf(c) : 'leeg'}`, `Pad ${i + 1}: ${c ? nameOf(c) : 'empty'}`)); b.setAttribute('aria-pressed', i === S.pad ? 'true' : 'false');
        b.onclick = () => { S.pad = i; playPad(i); refresh('pads'); };
        b.onkeydown = ev => { const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[ev.key]; if (d && g.children[i + d]) { ev.preventDefault(); g.children[i + d].focus(); } };
        adopt(b, { id: 'pad' + (i + 1), role: 'pad', group: 'pads', label: 'Pad ' + (i + 1) });
      }
      els.msg.textContent = ui.msg || '';
      els.chosen.textContent = S.chosen ? T('Gekozen akkoord: ', 'Chosen chord: ') + nameOf(S.chosen) + ' (' + noteList(S.chosen.n) + ')' : T('Nog geen akkoord gekozen.', 'No chord chosen yet.');
      els.save.textContent = T(`Bewaar in pad ${S.pad + 1}`, `Save to pad ${S.pad + 1}`); els.undoBtn.disabled = !ui.undo;
    }
    function paintSet() {
      if (!els.status) return;
      els.status.textContent = run.on ? T(`Speelt pad ${playIdx + 1}: ${S.pads.length && run.seq[playIdx] ? nameOf(run.seq[playIdx]) : ''}`, `Playing pad ${playIdx + 1}: ${run.seq[playIdx] ? nameOf(run.seq[playIdx]) : ''}`)
        : run.armed ? T('Wacht op de klok: start de transport van Patchkamer.', 'Waiting for the clock: start the Patchkamer transport.') : T('Gestopt.', 'Stopped.');
      els.start.disabled = run.armed; els.stopBtn.disabled = !run.armed;
      const n = occupied().length; els.count.textContent = T(`${n} van ${PAD_COUNT} pads gevuld`, `${n} of ${PAD_COUNT} pads filled`);
      els.msg2.textContent = ui.msg || '';
    }
    function paintAdvice() {
      const box = els.adv; if (!box) return; box.replaceChildren();
      const occ = occupied();
      if (!occ.length) { E(box, 'p', 'hint', T('Zet akkoorden in de pads voor advies over bas en stemvoering.', 'Put chords in the pads for bass and voicing advice.')); return; }
      const scale = new Set(THEORY.SCALES[S.scale].iv.map(x => mod12(S.key + x))), nm = names();
      const t = E(box, 'table', 'tbl'), hd = E(t, 'tr'); ['Pad', T('Akkoord', 'Chord'), T('Bas: grondtoon', 'Bass: root'), T('Alternatief', 'Alternative'), T('Aanloopnoot', 'Lead-in'), ''].forEach(x => E(hd, 'th', '', x));
      occ.forEach((o, k) => {
        const nx = occ[(k + 1) % occ.length].c, bo = THEORY.bassOptions({ root: o.c.r, q: o.c.q, bass: o.c.b }, { root: nx.r, q: nx.q }, scale), tr = E(t, 'tr');
        E(tr, 'td', '', String(o.i + 1)); E(tr, 'td', '', nameOf(o.c));
        E(tr, 'td', '', THEORY.midiName(bo.slash != null ? bo.slash : bo.root, nm) + (bo.slash != null ? T(' (slash)', ' (slash)') : ''));
        E(tr, 'td', '', THEORY.midiName(bo.fifth, nm) + ' / ' + THEORY.midiName(bo.octave, nm)); E(tr, 'td', '', bo.approach != null ? THEORY.midiName(bo.approach, nm) : '–');
        const td = E(tr, 'td'); mkBtn(td, '▶', 'bassPlay' + (o.i + 1), 'advice', () => playBassNote(bo.slash != null ? bo.slash : bo.root), 'btn sm').setAttribute('aria-label', T(`Speel bas van pad ${o.i + 1}`, `Play bass of pad ${o.i + 1}`));
      });
      const vl = THEORY.voiceLead(occ.map(o => ({ root: o.c.r, q: o.c.q })), { voices: S.voices, shape: S.voicing, lo: S.lo, hi: S.lo + 36, names: nm });
      ui.vl = vl.voicings.map(v => v.notes);
      if (ui.preview) {
        E(box, 'h4', '', T('Voorstel stemvoering', 'Voicing proposal'));
        const t2 = E(box, 'table', 'tbl'), h2 = E(t2, 'tr'); ['Pad', T('Nu', 'Now'), T('Voorstel', 'Proposal'), T('Beweging per stem', 'Movement per voice')].forEach(x => E(h2, 'th', '', x));
        occ.forEach((o, k) => { const v = vl.voicings[k], r = E(t2, 'tr'); E(r, 'td', '', String(o.i + 1)); E(r, 'td', '', noteList(o.c.n, nm)); E(r, 'td', '', v.names.join(' ')); E(r, 'td', 'mono', k ? v.move.map(m => (m > 0 ? '↑' + m : m < 0 ? '↓' + -m : '=')).join(' ') : '–'); });
        E(box, 'p', 'hint', T(`Totale beweging: ${vl.total} halve tonen (hoe lager hoe soepeler). Een slash-bas blijft in de basadvies staan.`, `Total movement: ${vl.total} semitones (lower is smoother). A slash bass stays in the bass advice.`));
      }
    }

    // ---------- opbouw ----------
    const CSS = `:host{display:block;color:var(--fg);font:13px system-ui,sans-serif}
.app{container-type:inline-size;background:var(--card);border-radius:10px;padding:12px;box-sizing:border-box;display:grid;gap:10px}
 h3{margin:0 0 6px;font-size:14px;letter-spacing:.04em} h4{margin:8px 0 4px;font-size:13px} h5{margin:0 0 3px;font-size:12px;color:var(--muted)}
.sub,.hint{color:var(--muted);margin:2px 0;line-height:1.4}.hint{font-size:12px}
.grid{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
@container (min-width:720px){.grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.full{grid-column:1/-1}}
.sec{background:var(--card-2);border:1px solid var(--line);border-radius:8px;padding:10px;display:grid;gap:7px;min-width:0;align-content:start}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.ctl{display:grid;gap:2px;font-size:11px;color:var(--muted);min-width:0}.ctl.chk{display:flex;align-items:center;gap:5px;color:var(--fg);font-size:12px}
select,input[type=text]{background:var(--field);color:var(--field-fg);border:1px solid var(--line);border-radius:5px;padding:4px 5px;font:inherit;max-width:100%;min-height:30px}
input[type=range]{width:120px;max-width:100%}output{font-family:var(--mono);color:var(--fg)}
button{font:inherit;color:var(--fg);cursor:pointer}.btn{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:6px 10px;min-height:32px}.btn:hover{border-color:var(--sel)}.btn.sm{padding:3px 8px;min-height:26px;font-size:12px}.btn:disabled{opacity:.45;cursor:default}
button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--sel);outline-offset:1px}
.chips,.dia{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.chip{--fc:var(--muted);display:grid;gap:0;text-align:center;min-width:56px;padding:4px 7px;border-radius:7px;border:1.5px solid var(--fc);background:color-mix(in srgb,var(--fc) 20%,var(--card));line-height:1.2}.chip b{font-size:14px}.chip small{font-size:10px;color:var(--muted)}.chip.sm{min-width:0;padding:2px 6px}
.fnT{--fc:var(--go)}.fnS{--fc:var(--event)}.fnD{--fc:var(--stop)}.fnO{--fc:var(--muted)}.fnE{--fc:var(--line)}
.big{font-size:20px;margin:2px 0}.notes{font-family:var(--mono);margin:2px 0}.mono{font-family:var(--mono)}
.prow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.pn{font-weight:600}.pc{color:var(--muted);font-family:var(--mono);font-size:12px;flex:1 1 140px}
.cand{border:1px solid var(--line);border-radius:7px;padding:6px 8px;background:var(--card)}.why{margin:4px 0 0;padding-left:0;list-style:none;font-size:12px;line-height:1.5}.why .yes{color:var(--go)}.why .no{color:var(--stop)}
.sgrp{border-left:3px solid var(--fc,var(--line));padding-left:7px}.sgrp.safe{--fc:var(--go)}.sgrp.tension{--fc:var(--stop)}.sgrp.color{--fc:var(--event)}
.srow{display:flex;gap:8px;align-items:center;margin:3px 0}.why1{font-size:12px;color:var(--muted);flex:1;min-width:0}
.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.pad{--fc:var(--line);display:grid;gap:1px;align-content:start;text-align:left;min-height:74px;padding:5px 6px;border-radius:8px;border:1.5px solid var(--fc);background:color-mix(in srgb,var(--fc) 18%,var(--well));min-width:0;overflow:hidden}
.pad b{font-size:15px}.pad small{font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pad.empty{border-style:dashed}
.pad.sel{outline:3px solid var(--sel);outline-offset:1px}.pad.now{background:color-mix(in srgb,var(--fc) 55%,var(--well))}
.tbl{border-collapse:collapse;font-size:12px;width:100%}.tbl th,.tbl td{padding:3px 6px;border-bottom:1px solid var(--line);text-align:left}.tbl th{color:var(--muted);font-weight:500}
.msg{min-height:1.3em;color:var(--fg);font-size:12px}`;

    function mount(el) {
      root = el; el.replaceChildren();
      const host0 = E(el, 'div'), shadow = host0.attachShadow ? host0.attachShadow({ mode: 'open' }) : host0;
      E(shadow, 'style', '', CSS); const app = E(shadow, 'div', 'app');
      E(app, 'p', 'sub', T('Hulp bij akkoorden, ook zonder muziektheorie: kies een toonsoort, speel een akkoord of vul de pads. Dit is advies, geen regelboek.', 'Help with chords, even without music theory: pick a key, play a chord or fill the pads. This is advice, not a rulebook.'));
      const grid = E(app, 'div', 'grid');
      // 1. toonsoort en stijl
      const s1 = E(grid, 'section', 'sec'); E(s1, 'h3', '', T('1 · Toonsoort & stijl', '1 · Key & style'));
      const r1 = E(s1, 'div', 'row');
      mkSel(r1, T('Grondtoon', 'Key note'), 'key', 'key', THEORY.DEFAULT_NAMES.map((n, i) => [i, n]), v => { S.key = +v; refresh('key', 'listen', 'pads', 'advice'); });
      mkSel(r1, T('Schaal', 'Scale'), 'scale', 'key', THEORY.SCALE_ORDER.map(id => [id, THEORY.SCALES[id][L]]), v => { S.scale = v; refresh('key', 'listen', 'pads', 'advice'); });
      mkSel(r1, T('Stijl (niet verplicht)', 'Style (optional)'), 'style', 'key', [['', T('Geen stijl', 'No style')], ...THEORY.STYLE_ORDER.map(id => [id, P(THEORY.STYLES[id])])], v => { S.style = v; S.bassMode = DEF_BASS[v] || 'rootFifth'; ctl.bassMode && ctl.bassMode(S.bassMode); refresh('key', 'listen', 'advice'); });
      mkSel(r1, T('Akkoorden', 'Chords'), 'ext', 'key', [['auto', T('Volgens stijl', 'By style')], ['triad', T('Drieklanken', 'Triads')], ['seventh', T('Vierklanken', 'Sevenths')]], v => { S.ext = v; refresh('key', 'listen'); });
      mkBtn(s1, T('Zoek toonsoort', 'Find key'), 'findKey', 'key', () => { const list = keyInput(), k = THEORY.detectKey(list, { limit: 3 }); ui.found = { list: k.list, conf: k.confidence, n: list.length, chords: list }; refresh('key'); }, 'btn');
      els.found = E(s1, 'div'); els.styleNote = E(s1, 'p', 'hint');
      els.dia = E(s1, 'div', 'dia'); els.explain = E(s1, 'p', 'hint');
      E(s1, 'h4', '', T('Kant-en-klare progressies', 'Ready-made progressions')); els.prog = E(s1, 'div');
      // 2. luisteren
      const s2 = E(grid, 'section', 'sec'); E(s2, 'h3', '', T('2 · Luisteren (MIDI in)', '2 · Listen (MIDI in)'));
      const r2 = E(s2, 'div', 'row');
      mkChk(r2, T('Luisteren (akkoorden onthouden)', 'Listen (remember chords)'), 'listen', 'listen', () => {});
      mkChk(r2, T('Toonsoort automatisch volgen', 'Follow the key automatically'), 'follow', 'listen', () => { if (S.follow) { followKey(); refresh('key', 'listen'); } });
      mkBtn(r2, T('Dit akkoord gebruiken', 'Use this chord'), 'useChord', 'listen', useCurrent);
      mkBtn(r2, T('Wis', 'Clear'), 'clearHeard', 'listen', () => { S.heard = []; S.cur = null; S.chosen = null; held.clear(); peak.clear(); ui.found = null; refresh('listen', 'key', 'pads'); });
      els.listenBox = E(s2, 'div');
      // 3. pads
      const s3 = E(grid, 'section', 'sec'); E(s3, 'h3', '', T('3 · Pads (maximaal 16)', '3 · Pads (up to 16)'));
      els.chosen = E(s3, 'p', 'hint'); els.padGrid = E(s3, 'div', 'pads');
      const r3 = E(s3, 'div', 'row');
      els.save = mkBtn(r3, T('Bewaar in pad', 'Save to pad'), 'saveToPad', 'pads', saveToPad);
      mkBtn(r3, T('Pad leegmaken', 'Clear pad'), 'clearPad', 'pads', clearPad);
      els.undoBtn = mkBtn(r3, T('Ongedaan maken', 'Undo'), 'undo', 'pads', undo);
      els.msg = E(s3, 'p', 'msg'); els.msg.setAttribute('aria-live', 'polite');
      const r3b = E(s3, 'div', 'row');
      mkChk(r3b, T('Pads spelen via MIDI-noot', 'Play pads by MIDI note'), 'padMidi', 'pads', () => refresh('pads'));
      mkSel(r3b, T('Eerste pad = noot', 'First pad = note'), 'padBase', 'pads', noteOpts(0, 111), v => { S.padBase = +v; refresh('pads'); });
      E(s3, 'p', 'hint', T('Noten in het bereik van de pads worden niet als akkoord beluisterd.', 'Notes in the pad range are not listened to as a chord.'));
      // 4. set
      const s4 = E(grid, 'section', 'sec'); E(s4, 'h3', '', T('4 · Set', '4 · Set'));
      const r4 = E(s4, 'div', 'row'), nl = E(r4, 'label', 'ctl'); E(nl, 'span', '', T('Naam van de set', 'Set name'));
      els.name = E(nl, 'input'); els.name.type = 'text'; els.name.maxLength = 60; nostop(els.name); els.name.setAttribute('aria-label', T('Naam van de set', 'Set name')); els.name.oninput = () => { S.name = els.name.value.slice(0, 60); };
      mkSel(r4, T('Duur per akkoord', 'Length per chord'), 'beats', 'set', [[1, T('1 slag', '1 beat')], [2, T('2 slagen', '2 beats')], [4, T('1 maat', '1 bar')], [8, T('2 maten', '2 bars')], [16, T('4 maten', '4 bars')]], v => { S.beats = +v; run.on = false; });
      const r4b = E(s4, 'div', 'row');
      mkChk(r4b, T('Herhalen', 'Repeat'), 'loop', 'set'); mkChk(r4b, T('Stemvoering gebruiken', 'Use voice leading'), 'voiceOn', 'set'); mkChk(r4b, T('Bas aan', 'Bass on'), 'bassOn', 'set');
      const r4c = E(s4, 'div', 'row');
      els.start = mkBtn(r4c, T('Start', 'Start'), 'start', 'set', start); els.stopBtn = mkBtn(r4c, T('Stop', 'Stop'), 'stop', 'set', stop);
      mkBtn(r4c, T('Transponeer −1', 'Transpose −1'), 'transposeDown', 'set', () => transpose(-1), 'btn sm'); mkBtn(r4c, T('Transponeer +1', 'Transpose +1'), 'transposeUp', 'set', () => transpose(1), 'btn sm');
      const r4d = E(s4, 'div', 'row');
      mkBtn(r4d, T('Exporteren (.json)', 'Export (.json)'), 'exportSet', 'set', exportSet, 'btn sm'); mkBtn(r4d, T('Importeren (.json)', 'Import (.json)'), 'importSet', 'set', () => els.file.click(), 'btn sm');
      els.file = E(r4d, 'input'); els.file.type = 'file'; els.file.accept = '.json,application/json'; els.file.hidden = true; els.file.onchange = importSet;
      els.status = E(s4, 'p', 'msg'); els.status.setAttribute('aria-live', 'polite'); els.count = E(s4, 'p', 'hint'); els.msg2 = E(s4, 'p', 'hint');
      E(s4, 'p', 'hint', T('Sets opslaan en laden: gebruik de presetbalk bovenaan de kaart (een set is een preset). De set zit ook in de werkruimte en de song. Start volgt de klok: start de transport van Patchkamer.', 'Save and load sets with the preset bar at the top of the card (a set is a preset). The set is also kept in the workspace and the song. Start follows the clock: start the Patchkamer transport.'));
      // 5. advies
      const s5 = E(grid, 'section', 'sec full'); E(s5, 'h3', '', T('5 · Advies: bas en stemvoering', '5 · Advice: bass and voicing'));
      const r5 = E(s5, 'div', 'row');
      mkSel(r5, T('Basfiguur', 'Bass pattern'), 'bassMode', 'advice', [['hold', T('Liggend', 'Held')], ['rootFifth', T('Grondtoon – kwint', 'Root – fifth')], ['walking', 'Walking'], ['pulse', T('Pulserend (achtsten)', 'Pulse (eighths)')]], v => { S.bassMode = v; });
      mkSel(r5, T('Stemmen', 'Voices'), 'voices', 'advice', [2, 3, 4, 5, 6].map(n => [n, String(n)]), v => { S.voices = +v; refresh('advice'); });
      mkSel(r5, T('Voicing', 'Voicing'), 'voicing', 'advice', [['close', T('Dicht', 'Close')], ['open', T('Open', 'Open')], ['drop2', 'Drop-2']], v => { S.voicing = v; refresh('advice'); });
      mkSel(r5, T('Laagste noot', 'Lowest note'), 'lo', 'advice', [[36, 'C2'], [43, 'G2'], [48, 'C3'], [55, 'G3'], [60, 'C4']], v => { S.lo = +v; refresh('advice'); });
      const r5b = E(s5, 'div', 'row');
      mkBtn(r5b, T('Pas stemvoering toe', 'Apply voicing'), 'applyVoicing', 'advice', applyVoicing);
      mkBtn(r5b, T('Alleen voorstel tonen', 'Show proposal only'), 'previewVoicing', 'advice', () => { ui.preview = !ui.preview; refresh('advice'); });
      E(s5, 'p', 'hint', T('Twee stemmen = terts en septiem (guide tones) of grondtoon en terts. De bas gaat apart naar de poort Bas.', 'Two voices = third and seventh (guide tones) or root and third. The bass goes separately to the Bass port.'));
      els.adv = E(s5, 'div');
      // 6. uitgang
      const s6 = E(grid, 'section', 'sec full'); E(s6, 'h3', '', T('6 · Uitgang', '6 · Output'));
      const r6 = E(s6, 'div', 'row'), pct = v => Math.round(v * 100) + '%';
      mkKnob(r6, 'Velocity', 'vel', 'out', 0.05, 1, 0.01, pct); mkKnob(r6, T('Velocity bas', 'Bass velocity'), 'bassVel', 'out', 0.05, 1, 0.01, pct);
      mkKnob(r6, T('Lengte (s)', 'Length (s)'), 'len', 'out', 0.1, 4, 0.05, v => v.toFixed(2)); mkKnob(r6, 'Gate', 'gate', 'out', 0.1, 1, 0.01, pct); mkKnob(r6, T('Strum (ms)', 'Strum (ms)'), 'strum', 'out', 0, 60, 1, v => Math.round(v) + ' ms');
      const r6b = E(s6, 'div', 'row'), oct = [-2, -1, 0, 1, 2].map(n => [n, (n > 0 ? '+' : '') + n]), chs = Array.from({ length: 16 }, (_, i) => [i + 1, String(i + 1)]);
      mkSel(r6b, T('Octaaf akkoorden', 'Chord octave'), 'chordOct', 'out', oct, v => { S.chordOct = +v; }); mkSel(r6b, T('Octaaf bas', 'Bass octave'), 'bassOct', 'out', oct, v => { S.bassOct = +v; });
      mkSel(r6b, T('Kanaal akkoorden', 'Chord channel'), 'chCh', 'out', chs, v => { S.chCh = +v; }); mkSel(r6b, T('Kanaal bas', 'Bass channel'), 'bassCh', 'out', chs, v => { S.bassCh = +v; });
      E(s6, 'p', 'hint', T('Strum 0 = alle noten tegelijk; hoger = een lichte gitaarstrum over de noten.', 'Strum 0 = all notes together; higher = a light guitar-style strum across the notes.'));
      syncCtl(); dirty.clear(); ['key', 'listen', 'pads', 'set', 'advice'].forEach(k => dirty.add(k)); flush();
      if (typeof host.frame === 'function') stopFrame = host.frame(self, () => { prune(); flush(); }, 15);
    }
    function transpose(d) {
      snapshot(); const mv = c => { if (!c) return null; let sh = d; const mx = Math.max(...c.n), mn = Math.min(...c.n); if (mx + sh > 127) sh -= 12; if (mn + sh < 0) sh += 12; return cleanChord({ r: mod12(c.r + d), q: c.q, b: c.b == null ? null : mod12(c.b + d), n: c.n.map(n => n + sh) }); };
      S.pads = S.pads.map(mv); S.chosen = mv(S.chosen); S.heard = S.heard.map(mv).filter(Boolean); S.key = mod12(S.key + d); S.cur = null; syncCtl();
      say(T(`Set ${d > 0 ? '+' : ''}${d} halve toon getransponeerd.`, `Set transposed ${d > 0 ? '+' : ''}${d} semitone.`)); refresh('key', 'listen', 'pads', 'advice');
    }
    function applyVoicing() {
      const occ = occupied(); if (!occ.length) return;
      const vl = THEORY.voiceLead(occ.map(o => ({ root: o.c.r, q: o.c.q })), { voices: S.voices, shape: S.voicing, lo: S.lo, hi: S.lo + 36, names: names() });
      snapshot(); occ.forEach((o, k) => { S.pads[o.i] = cleanChord({ ...o.c, n: vl.voicings[k].notes }); });
      say(T(`Stemvoering toegepast (${S.voices} stemmen, totale beweging ${vl.total}).`, `Voicing applied (${S.voices} voices, total movement ${vl.total}).`)); refresh('pads', 'advice');
    }
    function exportSet() {
      const data = JSON.stringify({ format: 'chordbuddy-set', formatVersion: 1, name: S.name, state: getPreset() }, null, 1);
      try { Promise.resolve(host.saveFile((S.name || 'chord-buddy-set').replace(/[^\w.-]+/g, '-') + '.chordbuddy.json', data)).then(r => { ui.msg = r === 'saved' ? T('Set geëxporteerd.', 'Set exported.') : ''; mark('set'); }); } catch (e) { ui.msg = T('Exporteren is hier niet mogelijk.', 'Exporting is not possible here.'); mark('set'); }
    }
    function importSet() {
      const f = els.file.files && els.file.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => { try { const j = JSON.parse(String(rd.result)); if (j.format !== 'chordbuddy-set') throw new Error('format'); snapshot(); setPreset(j.state); say(T('Set geïmporteerd.', 'Set imported.')); } catch (e) { say(T('Dit bestand is geen Chord Buddy-set.', 'This file is not a Chord Buddy set.')); } els.file.value = ''; };
      rd.readAsText(f);
    }

    // ---------- state ----------
    function norm(raw) {
      const s = raw && typeof raw === 'object' ? raw : {}, d = DEF(), o = d;
      o.key = Math.round(fin(s.key, 0, 0, 11)); o.scale = THEORY.SCALES[s.scale] ? s.scale : 'major'; o.style = THEORY.STYLES[s.style] && s.style !== 'general' ? s.style : '';
      o.ext = ['auto', 'triad', 'seventh'].includes(s.ext) ? s.ext : 'auto';
      o.pads = Array.from({ length: PAD_COUNT }, (_, i) => (Array.isArray(s.pads) ? cleanChord(s.pads[i]) : null));
      o.pad = Math.round(fin(s.pad, 0, 0, PAD_COUNT - 1)); o.chosen = cleanChord(s.chosen);
      o.heard = Array.isArray(s.heard) ? s.heard.map(cleanChord).filter(Boolean).slice(-4) : [];
      o.cur = s.cur && Array.isArray(s.cur.notes) ? { notes: s.cur.notes.map(n => Math.round(fin(n, -1, -1, 127))).filter(n => n >= 0).slice(0, 8), sel: Math.round(fin(s.cur.sel, 0, 0, 5)) } : null;
      if (o.cur && !o.cur.notes.length) o.cur = null;
      for (const k of ['listen', 'follow', 'padMidi', 'loop', 'voiceOn', 'bassOn']) o[k] = typeof s[k] === 'boolean' ? s[k] : d[k];
      o.padBase = Math.round(fin(s.padBase, 36, 0, 111)); o.name = typeof s.name === 'string' ? s.name.slice(0, 60) : '';
      o.beats = [1, 2, 4, 8, 16].includes(s.beats) ? s.beats : 4; o.bassMode = THEORY.BASS_MODES.includes(s.bassMode) ? s.bassMode : 'rootFifth';
      o.voices = Math.round(fin(s.voices, 4, 2, 6)); o.voicing = ['close', 'open', 'drop2'].includes(s.voicing) ? s.voicing : 'close'; o.lo = Math.round(fin(s.lo, 48, 24, 72));
      for (const k in SPEC) o[k] = fin(s[k], d[k], SPEC[k][0], SPEC[k][1]);
      o.chordOct = Math.round(fin(s.chordOct, 0, -2, 2)); o.bassOct = Math.round(fin(s.bassOct, 0, -2, 2));
      o.chCh = Math.round(fin(s.chCh, 1, 1, 16)); o.bassCh = Math.round(fin(s.bassCh, 1, 1, 16));
      return o;
    }
    function getPreset() { const o = {}; for (const k of PRESET_KEYS) o[k] = JSON.parse(JSON.stringify(S[k])); return o; }
    function setPreset(p) {
      const s = p && typeof p === 'object' ? p : {}, n = norm({ ...S, ...s });
      for (const k of PRESET_KEYS) if (k in s) S[k] = n[k];
      S.pad = Math.min(S.pad, PAD_COUNT - 1); run.on = false; syncCtl(); refresh('key', 'listen', 'pads', 'set', 'advice');
    }
    function params() {
      return [['vel', 'Velocity', 'level'], ['bassVel', T('Velocity bas', 'Bass velocity'), 'level'], ['len', T('Lengte', 'Length'), 'decay'], ['gate', 'Gate', 'env'], ['strum', 'Strum', 'timing']]
        .map(([id, name, role]) => ({ id, name, lane: 'out', laneName: T('Uitgang', 'Output'), min: SPEC[id][0], max: SPEC[id][1], role, scale: 'lin', drift: 0.05, on: false }));
    }
    self = {
      inputs: {}, outputs: {}, mount,
      unmount() { if (stopFrame) { stopFrame(); stopFrame = null; } root = null; els = {}; ctl = {}; },
      onStep, params,
      modulate(o) { modOff = {}; if (o && typeof o === 'object') for (const k in SPEC) if (typeof o[k] === 'number' && Number.isFinite(o[k])) modOff[k] = clamp(o[k], -1, 1); },
      onTransport(info) { if (!info || !info.playing) { run.on = false; playIdx = -1; held.clear(); peak.clear(); panic(); mark('pads', 'set', 'listen'); } },
      onEvent(port, e) {
        try {
          if (dead || port !== 'in' || !e || typeof e !== 'object') return;
          const type = String(e.type || '').toLowerCase().replace(/[_-]/g, ''), now = ctx.currentTime;
          if (type === 'allnotesoff' || type === 'panic') { held.clear(); commit(); mark('listen'); return; }
          if (type !== 'note' && type !== 'noteon' && type !== 'noteoff') return;
          const n = Math.round(e.note); if (!Number.isFinite(n) || n < 0 || n > 127) return;
          const on = (type === 'note' || type === 'noteon') && e.vel !== 0;
          if (S.padMidi && n >= S.padBase && n < S.padBase + PAD_COUNT) { if (on && S.pads[n - S.padBase]) { const t = Number.isFinite(e.time) ? Math.max(now, e.time) : now + 0.01; S.pad = n - S.padBase; playChord(S.pads[S.pad], t); mark('pads'); } return; }
          prune();
          if (on) { const t = Number.isFinite(e.time) ? Math.max(now, e.time) : now; held.set(n, e.held === true || !Number.isFinite(e.dur) ? Infinity : t + clamp(e.dur, 0.02, 120)); peak.add(n); mark('listen'); }
          else { held.delete(n); commit(); mark('listen'); }
        } catch (x) { /* een event mag de klok niet storen */ }
      },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(raw) { S = norm(raw); held.clear(); peak.clear(); run.on = false; ui.found = null; syncCtl(); refresh('key', 'listen', 'pads', 'set', 'advice'); },
      getPreset, setPreset,
      destroy() { if (dead) return; run.armed = false; run.on = false; try { panic(); } catch (e) { /* host weg */ } dead = true; if (stopFrame) { stopFrame(); stopFrame = null; } held.clear(); peak.clear(); },
    };
    return self;
  },
};
