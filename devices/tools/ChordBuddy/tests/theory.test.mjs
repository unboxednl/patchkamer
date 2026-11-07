// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests van de muziektheorie van Chord Buddy (puur JavaScript, geen host nodig).
//   node devices/tools/ChordBuddy/tests/theory.test.mjs
// De theorie staat in het apparaatbestand tussen de regels "// <theory>" en "// </theory>"; deze test haalt dat blok eruit.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'chord-buddy.patchkamer-device.js');
const src = readFileSync(file, 'utf8');
const a = src.indexOf('// <theory>'), b = src.indexOf('// </theory>');
if (a < 0 || b < 0) { console.error('theorieblok niet gevonden'); process.exit(1); }
const T = new Function(src.slice(a, b) + '\nreturn THEORY;')();

let n = 0; const fails = [];
const check = (name, cond, extra = '') => { n++; if (!cond) fails.push(name + (extra ? '  [' + extra + ']' : '')); };
const section = name => console.log('# ' + name);
const mod = T.mod;
const names = T.DEFAULT_NAMES;

// ---------------------------------------------------------------- 1. herkenning
section('herkenning');
const rec = (notes) => T.recognize(notes);
const best = notes => rec(notes).best.name;
check('C maj', best([60, 64, 67]) === 'C');
check('Am', best([57, 60, 64]) === 'Am');
check('Am7', best([57, 60, 64, 67]) === 'Am7');
check('C6 met bas C', best([48, 64, 67, 69]) === 'C6');
check('Am7 heeft alternatief C6/A', rec([57, 60, 64, 67]).cands.some(c => c.name === 'C6/A'));
check('G/B (slash)', best([47, 50, 55]) === 'G/B');
check('C/E eerste omkering', best([52, 55, 60]) === 'C/E');
check('C/G tweede omkering', best([55, 60, 64]) === 'C/G');
check('omkering krijgt nummer 1', rec([52, 55, 60]).best.inv === 1);
check('omkering krijgt nummer 2', rec([55, 60, 64]).best.inv === 2);
check('Cadd9', best([60, 62, 64, 67]) === 'Cadd9');
check('Bdim', best([59, 62, 65]) === 'Bdim');
check('half-verminderd Bm7b5', best([59, 62, 65, 69]) === 'Bm7b5');
check('verminderd Cdim7', best([60, 63, 66, 69]) === 'Cdim7');
check('dim7 geeft geen vier gelijkwaardige namen', rec([60, 63, 66, 69]).cands.filter(c => c.q === 'dim7').length === 1);
check('Caug', best([60, 64, 68]) === 'Caug');
check('Csus4', best([60, 65, 67]) === 'Csus4');
check('Csus2', best([60, 62, 67]) === 'Csus2');
check('C5 power chord', best([48, 55]) === 'C5');
check('C7sus4', best([60, 65, 67, 70]) === 'C7sus4');
check('Cm6', best([60, 63, 67, 69]) === 'Cm6');
check('CmMaj7', best([60, 63, 67, 71]) === 'CmMaj7');
check('Cmaj9', best([60, 64, 67, 71, 74]) === 'Cmaj9');
check('C9', best([60, 64, 67, 70, 74]) === 'C9');
check('Cm9', best([60, 63, 67, 70, 74]) === 'Cm9');
check('1-3-7 geeft Cmaj7', best([60, 64, 71]) === 'Cmaj7' && rec([60, 64, 71]).best.missing.includes('5'));
check('1-3-b7 geeft C7', best([60, 64, 70]) === 'C7');
check('1-b3-b7 geeft Cm7', best([60, 63, 70]) === 'Cm7');
check('1-b3-7 geeft CmMaj7', best([60, 63, 71]) === 'CmMaj7');
check('onvolledig akkoord heeft lagere score dan het volledige', rec([60, 64, 71]).best.score < rec([60, 64, 67, 71]).best.score);
check('losse noot', rec([60]).best.single === true && rec([60]).best.name === 'C');
check('lege invoer', rec([]).best === null && rec([]).cands.length === 0);
check('dubbele noten in verschillende octaven', best([48, 60, 64, 67, 76]) === 'C');
check('NaN en rommel gooien niet', rec([NaN, 'x', null, 60, 64, 67]).best.name === 'C');
check('cluster zonder naam gooit niet', Array.isArray(rec([60, 61, 62, 63, 64]).cands));
check('zekerheid: drieklank is zeker', rec([60, 64, 67]).confidence === 'sure');
check('zekerheid: twee noten is onduidelijk', rec([60, 64]).confidence === 'unsure');
check('Bb zonder kruisen: naam met b', T.recognize([58, 62, 65]).best.name === 'Bb');
check('F# majeur', best([54, 58, 61]) === 'Gb' || best([54, 58, 61]) === 'F#');
{   // alle soorten in grondligging, in alle twaalf grondtonen
  const rootPos = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', '6', 'm6', '7', 'maj7', 'm7', 'm7b5', 'dim7', 'mMaj7', 'add9', '9', 'm9', 'maj9', '7sus4'];
  for (const q of rootPos) {
    let ok = true, why = '';
    for (let r = 0; r < 12; r++) {
      const notes = T.rootPosition(r, q, 40), got = rec(notes).best;
      if (!got || got.root !== r || got.q !== q) { ok = false; why += ` ${names[r]}${q}->${got && got.name}`; }
    }
    check('grondligging ' + q + ' in 12 grondtonen', ok, why);
  }
  let ok = true, why = '';
  for (let r = 0; r < 12; r++) { const got = rec([36 + r, 43 + r]).best; if (!got || got.root !== r || got.q !== '5') { ok = false; why += ' ' + r; } }
  check('power chord in 12 grondtonen', ok, why);
  // omkeringen van majeur en mineur: grondtoon blijft, bas wisselt
  for (const q of ['maj', 'min', '7', 'maj7']) {   // m7 valt weg: Cm7/Eb is dezelfde noten als Eb6, de bas beslist
    let ok2 = true, why2 = '';
    const iv = T.QID[q].iv;
    for (let r = 0; r < 12; r++) for (let inv = 1; inv < iv.length; inv++) {
      const notes = iv.map((i, k) => 48 + r + i + (k < inv ? 12 : 0)), got = rec(notes).best;
      if (!got || got.root !== r || got.q !== q || got.bass !== mod(r + iv[inv])) { ok2 = false; why2 += ` ${names[r]}${q} inv${inv}->${got && got.name}`; }
    }
    check('omkeringen van ' + q + ' in 12 grondtonen', ok2, why2.slice(0, 200));
  }
}

// ---------------------------------------------------------------- notennamen
section('notennamen');
check('F majeur heeft Bb', T.keyNames(5, 'major')[10] === 'Bb');
check('D majeur heeft F# en C#', T.keyNames(2, 'major')[6] === 'F#' && T.keyNames(2, 'major')[1] === 'C#');
check('Eb majeur heeft Ab', T.keyNames(3, 'major')[8] === 'Ab');
check('A majeur heeft G#', T.keyNames(9, 'major')[8] === 'G#');
check('C# mineur heeft D# en G#', T.keyNames(1, 'minor')[3] === 'D#' && T.keyNames(1, 'minor')[8] === 'G#');
check('G mineur heeft Bb en Eb', T.keyNames(7, 'minor')[10] === 'Bb' && T.keyNames(7, 'minor')[3] === 'Eb');
check('parseNote leest Bb, F#, c', T.parseNote('Bb') === 10 && T.parseNote('F#') === 6 && T.parseNote('c') === 0 && T.parseNote('H') === -1);
check('midiName', T.midiName(60) === 'C4' && T.midiName(36) === 'C2' && T.midiName(28) === 'E1');
check('chordName met slash', T.chordName(0, 'maj', 4) === 'C/E' && T.chordName(0, 'm7', 9) === 'Cm7/A' && T.chordName(0, 'maj', 0) === 'C');
{
  let ok = true, why = '';
  for (const sc of T.SCALE_ORDER) for (let r = 0; r < 12; r++) {
    const nm = T.keyNames(r, sc), sci = T.SCALES[sc];
    if (nm.length !== 12 || nm.some(x => typeof x !== 'string' || !/^[A-G](#|b)?$/.test(x))) { ok = false; why += ` ${sc}${r}`; }
    if (T.parseNote(nm[r]) !== r) { ok = false; why += ` tonic ${sc}${r}`; }
    for (const i of sci.iv) if (T.parseNote(nm[mod(r + i)]) !== mod(r + i)) { ok = false; why += ` pc ${sc}${r}`; }
  }
  check('keyNames geldig voor 12 grondtonen x alle schalen', ok, why.slice(0, 150));
  const letters = [];
  for (let r = 0; r < 12; r++) { const nm = T.keyNames(r, 'major'); const l = T.SCALES.major.iv.map(i => nm[mod(r + i)][0]); letters.push(new Set(l).size === 7); }
  check('majeurladder gebruikt zeven verschillende letters', letters.every(Boolean));
}

// ---------------------------------------------------------------- 2. diatonische akkoorden
section('diatonische akkoorden');
const diaNames = (r, sc, e = 'triad') => T.diatonic(r, sc, e).map(c => c.name).join(' ');
check('C majeur drieklanken', diaNames(0, 'major') === 'C Dm Em F G Am Bdim', diaNames(0, 'major'));
check('C majeur vierklanken', diaNames(0, 'major', 'seventh') === 'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5', diaNames(0, 'major', 'seventh'));
check('A mineur drieklanken', diaNames(9, 'minor') === 'Am Bdim C Dm Em F G', diaNames(9, 'minor'));
check('A harmonisch mineur', diaNames(9, 'harmonic') === 'Am Bdim Caug Dm E F G#dim', diaNames(9, 'harmonic'));
check('A harmonisch mineur vierklanken', diaNames(9, 'harmonic', 'seventh') === 'AmMaj7 Bm7b5 Cmaj7#5 Dm7 E7 Fmaj7 G#dim7', diaNames(9, 'harmonic', 'seventh'));
check('A melodisch mineur', diaNames(9, 'melodic') === 'Am Bm Caug D E F#dim G#dim', diaNames(9, 'melodic'));
check('D dorisch', diaNames(2, 'dorian') === 'Dm Em F G Am Bdim C', diaNames(2, 'dorian'));
check('E frygisch', diaNames(4, 'phrygian') === 'Em F G Am Bdim C Dm', diaNames(4, 'phrygian'));
check('F lydisch', diaNames(5, 'lydian') === 'F G Am Bdim C Dm Em', diaNames(5, 'lydian'));
check('G mixolydisch', diaNames(7, 'mixolydian') === 'G Am Bdim C Dm Em F', diaNames(7, 'mixolydian'));
check('B locrisch', diaNames(11, 'locrian') === 'Bdim C Dm Em F G Am', diaNames(11, 'locrian'));
check('Romeinse cijfers C majeur', T.diatonic(0, 'major').map(c => c.rn).join(' ') === 'I ii iii IV V vi vii°', T.diatonic(0, 'major').map(c => c.rn).join(' '));
check('Romeinse cijfers vierklanken', T.diatonic(0, 'major', 'seventh').map(c => c.rn).join(' ') === 'Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7', T.diatonic(0, 'major', 'seventh').map(c => c.rn).join(' '));
check('Romeinse cijfers natuurlijk mineur', T.diatonic(9, 'minor').map(c => c.rn).join(' ') === 'i ii° bIII iv v bVI bVII', T.diatonic(9, 'minor').map(c => c.rn).join(' '));
check('Romeinse cijfers dorisch', T.diatonic(2, 'dorian').map(c => c.rn).join(' ') === 'i ii bIII IV v vi° bVII', T.diatonic(2, 'dorian').map(c => c.rn).join(' '));
check('functies C majeur', T.diatonic(0, 'major').map(c => c.fn).join('') === 'TSTSDTD');
check('functies mineur', T.diatonic(9, 'minor').map(c => c.fn).join('') === 'TSTSDSD');
check('functie-uitleg bestaat in NL en EN', ['T', 'S', 'D', 'O'].every(f => T.FN_TEXT[f].nl.length > 5 && T.FN_TEXT[f].en.length > 5));
check('uitleg tonica klinkt eenvoudig', /Thuis/.test(T.FN_TEXT.T.nl) && /Home/.test(T.FN_TEXT.T.en));
check('pentatoon majeur akkoorden', diaNames(0, 'pentMajor') === 'C Dm F G Am', diaNames(0, 'pentMajor'));
check('pentatoon mineur akkoorden', diaNames(9, 'pentMinor') === 'Am C Dm Em F G', diaNames(9, 'pentMinor'));
check('blues in E: E7 A7 B7', diaNames(4, 'blues', 'seventh') === 'E7 A7 B7 D7', diaNames(4, 'blues', 'seventh'));
check('blues mineur in A', diaNames(9, 'bluesMinor', 'seventh') === 'Am7 Dm7 E7 Em7 G7', diaNames(9, 'bluesMinor', 'seventh'));
check('stijl blues maakt akkoorden dominant', T.diatonic(0, 'major', 'auto', 'blues').filter(c => [0, 5, 7].includes(c.off)).every(c => c.q === '7'));
check('stijl jazz geeft vierklanken', T.diatonic(0, 'major', 'auto', 'jazz')[1].q === 'm7');
check('stijl pop geeft drieklanken', T.diatonic(0, 'major', 'auto', 'pop')[1].q === 'min');
{
  let ok = true, why = '';
  for (const sc of T.SCALE_ORDER) for (let r = 0; r < 12; r++) for (const e of ['triad', 'seventh']) {
    const list = T.diatonic(r, sc, e), nm = T.keyNames(r, sc), sci = T.SCALES[sc], inScale = new Set(sci.iv.map(i => mod(r + i)));
    if (!list.length) { ok = false; why += ` leeg ${sc}`; continue; }
    for (const c of list) {
      if (!T.QID[c.q] || c.pcs[0] !== c.root || c.name !== T.chordName(c.root, c.q, null, nm) || !'TSD'.includes(c.fn) || !c.rn) { ok = false; why += ` ${sc}${r}${c.name}`; }
      if (!sci.kind) {   // zevennotenschalen: elke akkoordtoon zit in de schaal (de afgeleide gestapelde tertsen)
        if (c.pcs.some(p => !inScale.has(p))) { ok = false; why += ` buiten ${sc}${r}:${c.name}`; }
      }
    }
  }
  check('12 grondtonen x alle schalen x driekl/vierkl: elk akkoord klopt met de schaal', ok, why.slice(0, 200));
  for (const sc of T.SCALE_ORDER) {
    let ok2 = true;
    for (let r = 0; r < 12; r++) {
      const nm = T.keyNames(r, sc), sci = T.SCALES[sc];
      if (!sci.kind) {
        // elke trap-grondtoon heeft de juiste naam en de drieklank bestaat uit terts en kwint van de schaal
        const tri = T.diatonic(r, sc, 'triad');
        tri.forEach((c, d) => { const exp = [0, 2, 4].map(k => mod(r + sci.iv[(d + k) % 7])); if (c.pcs.join() !== exp.join() && [...c.pcs].sort().join() !== [...exp].sort().join()) ok2 = false; });
      }
    }
    check('stapeling van tertsen klopt voor ' + sc, ok2);
  }
}

// ---------------------------------------------------------------- 3. toonsoort bepalen
section('toonsoort bepalen');
const ch = (r, q) => ({ root: r, q });
const keyOf = (cs, lim = 12) => T.detectKey(cs, { limit: lim });
const label = x => T.keyLabel(x.root, x.scale, 'en');
{
  const k = keyOf([ch(0, 'maj'), ch(5, 'maj'), ch(7, 'maj')]);
  check('C-F-G: C majeur bovenaan', k.list[0].root === 0 && k.list[0].scale === 'major', label(k.list[0]));
  check('C-F-G: zekerheid minstens waarschijnlijk', k.confidence !== 'unsure', k.confidence);
}
{
  const k = keyOf([ch(9, 'min'), ch(5, 'maj'), ch(0, 'maj'), ch(7, 'maj')]), top = k.list.slice(0, 3).map(x => x.root + x.scale);
  check('Am-F-C-G: C majeur in de top 3', top.includes('0major'), top.join());
  check('Am-F-C-G: a mineur in de top 3', top.includes('9minor'), top.join());
  check('Am-F-C-G: C majeur en a mineur liggen dicht bij elkaar', Math.abs(k.list.find(x => x.root === 0 && x.scale === 'major').score - k.list.find(x => x.root === 9 && x.scale === 'minor').score) < 0.8);
  check('Am-F-C-G: top 2 zijn C majeur en a mineur', new Set(k.list.slice(0, 2).map(x => x.root + x.scale)).has('0major') && new Set(k.list.slice(0, 2).map(x => x.root + x.scale)).has('9minor'), k.list.slice(0, 2).map(label).join());
}
{
  const k = keyOf([ch(2, 'm7'), ch(7, '7'), ch(0, 'maj7')]);
  check('Dm7-G7-Cmaj7: C majeur bovenaan', k.list[0].root === 0 && k.list[0].scale === 'major', label(k.list[0]));
  check('Dm7-G7-Cmaj7: bijna zeker of waarschijnlijk', ['sure', 'likely'].includes(k.confidence), k.confidence);
}
{
  const k = keyOf([ch(9, 'min'), ch(2, 'min'), ch(4, '7')]), t = k.list[0];
  check('Am-Dm-E7: a harmonisch of natuurlijk mineur bovenaan', t.root === 9 && (t.scale === 'harmonic' || t.scale === 'minor'), label(t));
  check('Am-Dm-E7: beide mineurvormen in de top 3', k.list.slice(0, 3).some(x => x.scale === 'harmonic' && x.root === 9) && k.list.slice(0, 3).some(x => x.scale === 'minor' && x.root === 9));
  check('Am-Dm-E7: dominant majeur uit harmonisch mineur wordt herkend', k.list.find(x => x.scale === 'minor' && x.root === 9).ms.some(m => m.kind === 'borrowed'));
}
{
  const k = keyOf([ch(4, '7'), ch(9, '7'), ch(11, '7')]), t = k.list[0];
  check('E7-A7-B7: E blues of mixolydisch bovenaan', t.root === 4 && (t.scale === 'blues' || t.scale === 'mixolydian'), label(t));
}
{
  const k = keyOf([ch(0, 'maj')]);
  check('een akkoord: onduidelijk', k.confidence === 'unsure');
  check('een akkoord: meerdere plausibele toonsoorten', k.list.length >= 6);
  check('een akkoord: C majeur staat erbij en het akkoord valt binnen elke getoonde toonsoort', k.list.some(x => x.root === 0 && x.scale === 'major') && k.list.slice(0, 5).every(x => x.fit === 1));
  const k2 = keyOf([ch(0, 'maj'), ch(7, 'maj')]), k3 = keyOf([ch(0, 'maj'), ch(7, 'maj'), ch(9, 'min'), ch(5, 'maj')]);
  const n1 = keyOf([ch(0, 'maj')], 200).list.filter(x => x.fit === 1).length, n2 = keyOf([ch(0, 'maj'), ch(7, 'maj')], 200).list.filter(x => x.fit === 2).length, n3 = keyOf([ch(0, 'maj'), ch(7, 'maj'), ch(9, 'min'), ch(5, 'maj')], 200).list.filter(x => x.fit === 4).length;
  check('meer akkoorden vernauwen de keuze (1 > 2 > 4 passende toonsoorten)', n1 > n2 && n2 > n3, [n1, n2, n3].join());
  check('twee akkoorden: nooit "bijna zeker"', k2.confidence !== 'sure');
  check('vier akkoorden: C majeur of a mineur bovenaan', k3.list[0].root === 0 || k3.list[0].root === 9);
}
check('lege reeks gooit niet', T.detectKey([]).list.length === 0);
check('rommelinvoer gooit niet', T.detectKey([null, { root: NaN }, { root: 0, q: 'x' }]).list.length === 0);
check('zekerheidsteksten in NL en EN', T.CONF.sure.nl === 'bijna zeker' && T.CONF.likely.nl === 'waarschijnlijk' && T.CONF.unsure.nl === 'onduidelijk' && T.CONF.sure.en.length > 3);
{
  const cs = [ch(0, 'maj'), ch(5, 'maj'), ch(7, 'maj'), ch(0, 'maj')], k = keyOf(cs), r = T.keyReasons(k.list[0], cs);
  check('uitleg voor/tegen bestaat in NL en EN', r.length >= 2 && r.every(x => x.nl && x.en));
  check('uitleg noemt dat alle akkoorden passen', /Alle 4/.test(r[0].nl) && /All 4/.test(r[0].en));
  const cs2 = [ch(0, 'maj'), ch(1, 'maj')], k2 = keyOf(cs2), bad = T.keyReasons(k2.list[0], cs2);
  check('uitleg noemt wat tegen spreekt', bad.some(x => x.ok === false));
  check('"valt buiten" verschijnt bij een vreemd akkoord', T.keyReasons({ ...keyOf([ch(0, 'maj'), ch(6, 'maj')]).list.find(x => x.root === 0 && x.scale === 'major') }, [ch(0, 'maj'), ch(6, 'maj')]).some(x => /buiten/.test(x.nl)));
}
{   // elke toonsoort wordt als bovenste gevonden uit zijn eigen I-IV-V-I
  let okM = true, okm = true, ok2 = true, whyM = '', whym = '', why2 = '';
  for (let r = 0; r < 12; r++) {
    const M = T.diatonic(r, 'major'), m = T.diatonic(r, 'harmonic'), M7 = T.diatonic(r, 'major', 'seventh');
    const kM = keyOf([M[0], M[3], M[4], M[0]].map(c => ch(c.root, c.q))).list[0];
    if (kM.root !== r || kM.scale !== 'major') { okM = false; whyM += ' ' + r + ':' + label(kM); }
    const km = keyOf([m[0], m[3], m[4], m[0]].map(c => ch(c.root, c.q))).list[0];
    if (km.root !== r || !['harmonic', 'minor'].includes(km.scale)) { okm = false; whym += ' ' + r + ':' + label(km); }
    const k2 = keyOf([M7[1], M7[4], M7[0]].map(c => ch(c.root, c.q))).list[0];
    if (k2.root !== r || k2.scale !== 'major') { ok2 = false; why2 += ' ' + r + ':' + label(k2); }
  }
  check('I-IV-V-I geeft de juiste majeurtoonsoort (12 grondtonen)', okM, whyM);
  check('i-iv-V-i geeft de juiste mineurtoonsoort (12 grondtonen)', okm, whym);
  check('ii7-V7-Imaj7 geeft de juiste majeurtoonsoort (12 grondtonen)', ok2, why2);
}
{   // elke schaal herkent zichzelf uit zijn eigen akkoorden (begin en eind op de tonica) - alleen de vaste, onderscheidende schalen
  for (const sc of ['major', 'minor', 'harmonic', 'mixolydian', 'dorian']) {
    const d = T.diatonic(2, sc);
    const cs = [d[0], d[3], d[4], d[0]].map(c => ch(c.root, c.q)), k = keyOf(cs, 40);
    check('eigen akkoorden van ' + sc + ' staan in de top 6 (grondtoon D)', k.list.slice(0, 6).some(x => x.root === 2 && x.scale === sc), k.list.slice(0, 6).map(label).join());
  }
}

// ---------------------------------------------------------------- 4. suggesties
section('suggesties');
const valid = it => it && T.QID[it.q] && it.root >= 0 && it.root < 12 && it.name === T.chordName(it.root, it.q, null, T.keyNames(it.keyRoot ?? it.root, 'major')) || (it && T.QID[it.q] && it.name.startsWith(it.name.match(/^[A-G][#b]?/)[0]));
{
  let ok = true, why = '', total = 0;
  for (const sc of T.SCALE_ORDER) for (const st of [null, ...T.STYLE_ORDER]) {
    let good = true;
    for (const root of [0, 3, 6, 9]) {
      const nm = T.keyNames(root, sc);
      const diaR = T.diatonic(root, sc, 'auto', st);
      for (const prev of [[], [ch(diaR[0].root, diaR[0].q)], [ch(diaR[diaR.length - 1].root, diaR[diaR.length - 1].q)], [ch(diaR[0].root, diaR[0].q), ch(diaR[1 % diaR.length].root, diaR[1 % diaR.length].q)]]) {
        const out = T.suggest({ root, scale: sc, style: st, prev });
        total++;
        if (!out.length) { good = false; why += ` leeg ${sc}/${st}`; }
        for (const it of out) {
          if (!T.QID[it.q] || !(it.root >= 0 && it.root < 12) || it.name !== T.chordName(it.root, it.q, null, nm) || !['safe', 'tension', 'color'].includes(it.type) || !it.why.nl || !it.why.en
            || it.pcs.length !== T.QID[it.q].iv.length || !(it.score > 0)) { good = false; why += ` ${sc}/${st}:${it.name}`; }
          if (it.type === 'safe' && (it.fn === 'O' || !diaR.some(c => c.root === it.root))) { good = false; why += ` safe-niet-diatonisch ${it.name}`; }
        }
      }
    }
    check(`suggesties geldig: ${sc} / ${st || 'geen stijl'}`, good, why.slice(0, 150));
  }
}
{
  let ok = true, why = '';
  for (let r = 0; r < 12; r++) {
    const out = T.suggest({ root: r, scale: 'major', prev: [ch(mod(r + 7), 'maj')] }), hit = out.find(x => x.root === r);
    if (!hit || hit.type !== 'safe') { ok = false; why += ' ' + r; }
  }
  check('V -> I is veilig (12 majeurtoonsoorten)', ok, why);
  ok = true; why = '';
  for (let r = 0; r < 12; r++) {
    const out = T.suggest({ root: r, scale: 'harmonic', prev: [ch(mod(r + 7), 'maj')] }), hit = out.find(x => x.root === r);
    if (!hit || hit.type !== 'safe') { ok = false; why += ' ' + r; }
  }
  check('V -> i is veilig (harmonisch mineur)', ok, why);
  ok = true; why = '';
  for (let r = 0; r < 12; r++) { const hit = T.suggest({ root: r, scale: 'major', prev: [ch(mod(r + 5), 'maj')] }).find(x => x.root === mod(r + 7) && x.q === 'maj'); if (!hit || hit.type !== 'safe') { ok = false; why += ' ' + r; } }
  check('IV -> V is veilig', ok, why);
  ok = true; why = '';
  for (let r = 0; r < 12; r++) { const hit = T.suggest({ root: r, scale: 'major', prev: [ch(mod(r + 9), 'min')] }).find(x => x.root === mod(r + 5)); if (!hit || hit.type !== 'safe') { ok = false; why += ' ' + r; } }
  check('vi -> IV is veilig', ok, why);
  const st = T.suggest({ root: 0, scale: 'major', prev: [ch(7, 'maj')] });
  check('V -> I staat bovenaan', st[0].root === 0 && st[0].type === 'safe');
  check('V -> I uitleg noemt thuis', /thuis/i.test(st[0].why.nl) && /home/i.test(st[0].why.en));
  check('na V staat ook V7 als spanning', st.some(x => x.type === 'tension' && x.q === '7'));
  check('kleur bevat geleend akkoord (bVII) in pop', st.some(x => x.type === 'color' && x.root === 10));
  check('geen suggestie is het huidige akkoord zelf (veilig)', !st.some(x => x.type === 'safe' && x.root === 7));
  check('zonder eerder akkoord begint het met de tonica', T.suggest({ root: 0, scale: 'major', prev: [] })[0].root === 0);
  const jz = T.suggest({ root: 0, scale: 'major', style: 'jazz', prev: [ch(2, 'm7')] });
  check('jazz: na ii7 komt V7 bovenaan', jz[0].root === 7 && jz[0].q === '7');
  check('jazz: tritonussubstitutie als kleur', jz.some(x => x.type === 'color' && x.root === 1 && x.q === '7'));
  const rk = T.suggest({ root: 0, scale: 'major', style: 'rock', prev: [ch(0, 'maj')] });
  check('rock: bVII als kleur', rk.some(x => x.type === 'color' && x.root === 10));
  const bl = T.suggest({ root: 4, scale: 'blues', style: 'blues', prev: [ch(4, '7')] });
  check('blues: IV7 en V7 zijn veilig', bl.filter(x => x.type === 'safe').some(x => x.root === 9) && bl.filter(x => x.type === 'safe').some(x => x.root === 11));
  check('stijl verandert de akkoordkeuze, niet de toonsoort', T.suggest({ root: 0, scale: 'major', style: 'jazz', prev: [] }).every(x => x.q.length > 0) && T.diatonic(0, 'major', 'auto', 'jazz').every(c => T.QID[c.q].iv.length === 4));
}
{
  let ok = true, why = '';
  for (const st of T.STYLE_ORDER) for (const [r, sc] of [[0, 'major'], [9, 'minor'], [2, 'major'], [6, 'minor']]) {
    const pr = T.progressions(r, sc, st);
    if (pr.length < 2 || pr.some(p => p.chords.length !== 4 || p.chords.some(c => !T.QID[c.q] || c.midi.length < 2) || !p.name.nl.includes('·') || !p.name.en.includes('·'))) { ok = false; why += ` ${st}/${sc}`; }
  }
  check('kant-en-klare progressies: 4 akkoorden voor elke stijl, majeur en mineur, transponeerbaar', ok, why);
  check('Pop · I V vi IV in C is C G Am F', T.progressions(0, 'major', 'pop')[0].chords.map(c => c.name).join(' ') === 'C G Am F');
  check('Pop in D: D A Bm G', T.progressions(2, 'major', 'pop')[0].chords.map(c => c.name).join(' ') === 'D A Bm G');
  check('Jazz ii7 V7 Imaj7 vi7 in C', T.progressions(0, 'major', 'jazz')[0].chords.map(c => c.name).join(' ') === 'Dm7 G7 Cmaj7 Am7', T.progressions(0, 'major', 'jazz')[0].chords.map(c => c.name).join(' '));
  check('Blues in E: E7 A7 E7 B7', T.progressions(4, 'blues', 'blues')[0].chords.map(c => c.name).join(' ') === 'E7 A7 E7 B7', T.progressions(4, 'blues', 'blues')[0].chords.map(c => c.name).join(' '));
  check('Pop mineur in A: Am F C G', T.progressions(9, 'minor', 'pop')[0].chords.map(c => c.name).join(' ') === 'Am F C G', T.progressions(9, 'minor', 'pop')[0].chords.map(c => c.name).join(' '));
  check('geen stijl geeft algemene progressies', T.progressions(0, 'major', null).length >= 3);
  check('parseRoman bVII', JSON.stringify(T.parseRoman('bVII')) === JSON.stringify({ off: 10, q: 'maj' }));
  check('parseRoman ii7, iiø7, V7, Imaj7, vi', T.parseRoman('ii7').q === 'm7' && T.parseRoman('iiø7').q === 'm7b5' && T.parseRoman('V7').q === '7' && T.parseRoman('Imaj7').q === 'maj7' && T.parseRoman('vi').q === 'min');
  check('parseRoman rommel geeft null', T.parseRoman('xyz') === null && T.parseRoman('') === null);
  check('romanFor', T.romanFor(7, 'maj', 0) === 'V' && T.romanFor(9, 'min', 0) === 'vi' && T.romanFor(10, 'maj', 0) === 'bVII' && T.romanFor(2, 'm7', 0) === 'ii7');
}

// ---------------------------------------------------------------- 5. bas
section('bas');
{
  let ok = true, why = '';
  for (const q of T.Q.filter(x => !x.rare).map(x => x.id)) for (let r = 0; r < 12; r++) {
    const o = T.bassOptions({ root: r, q }, { root: mod(r + 5), q: 'maj' }, null);
    if (mod(o.root) !== r || o.root < T.BASS_LO || o.root > T.BASS_HI || o.fifth < T.BASS_LO || o.fifth > T.BASS_HI || o.octave !== o.root + 12 && o.octave !== o.root || o.approach < T.BASS_LO - 3 || o.approach > T.BASS_HI + 1) { ok = false; why += ` ${r}${q}`; }
  }
  check('basopties: grondtoon, kwint, octaaf en aanloop binnen E1-E3 (alle soorten x 12 grondtonen)', ok, why.slice(0, 120));
  check('kwint is een zuivere kwint', mod(T.bassOptions({ root: 0, q: 'maj' }, null).fifth) === 7 && mod(T.bassOptions({ root: 0, q: 'dim' }, null).fifth) === 6);
  const sl = T.bassOptions({ root: 7, q: 'maj', bass: 11 }, null);
  check('slash-bas geeft de bas van het akkoord', sl.slash != null && mod(sl.slash) === 11 && sl.approach === null);
  check('geen slash zonder slash', T.bassOptions({ root: 0, q: 'maj' }, null).slash === null);
  check('grondtoon C ligt op C2 (36)', T.bassOptions({ root: 0, q: 'maj' }, null).root === 36);
  check('grondtoon E ligt op E1 (28)', T.bassOptions({ root: 4, q: 'maj' }, null).root === 28);
  const scale = new Set([0, 2, 4, 5, 7, 9, 11]);
  const walk = T.bassFigure({ root: 0, q: 'maj' }, { root: 7, q: 'maj' }, 'walking', 4, scale);
  check('walking: 4 noten, begint op de grondtoon', walk.length === 4 && mod(walk[0].note) === 0);
  check('walking: laatste noot is een aanloop naar de volgende grondtoon', Math.abs(walk[3].note - T.bassOptions({ root: 7, q: 'maj' }, null).root) <= 2 && mod(walk[3].note) !== 7);
  let ok2 = true, why2 = '';
  for (const mode of T.BASS_MODES) for (const beats of [1, 2, 4, 8, 16]) for (const q of ['maj', 'm7', '7', 'dim']) for (const r of [0, 4, 7, 10]) {
    const f = T.bassFigure({ root: r, q }, { root: mod(r + 7), q: 'maj' }, mode, beats, scale);
    if (!f.length || f.some(e => !(e.note >= T.BASS_LO && e.note <= T.BASS_HI) || !(e.beat >= 0 && e.beat < beats) || !(e.dur > 0) || !(e.vel > 0 && e.vel <= 1))) { ok2 = false; why2 += ` ${mode}/${beats}/${q}${r}`; }
  }
  check('basfiguren: noten binnen bereik, binnen de lengte van het akkoord (4 stijlen x 5 lengtes)', ok2, why2.slice(0, 150));
  check('liggend: een noot', T.bassFigure({ root: 0, q: 'maj' }, null, 'hold', 4).length === 1);
  check('grondtoon-kwint: twee noten per maat', T.bassFigure({ root: 0, q: 'maj' }, null, 'rootFifth', 4).length === 2 && T.bassFigure({ root: 0, q: 'maj' }, null, 'rootFifth', 8).length === 4);
  check('pulse: acht noten in een maat', T.bassFigure({ root: 0, q: 'maj' }, null, 'pulse', 4).length === 8);
  check('slash-akkoord laat de bas beginnen op de slash-noot', mod(T.bassFigure({ root: 7, q: 'maj', bass: 11 }, null, 'hold', 4)[0].note) === 11);
  check('onbekende modus valt terug op liggend', T.bassFigure({ root: 0, q: 'maj' }, null, 'nonsens', 4).length === 1);
}

// ---------------------------------------------------------------- 6. stemvoering
section('stemvoering');
{
  let s = 12345; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const pickQ = ['maj', 'min', '7', 'm7', 'maj7', 'dim', 'sus4', 'add9', '9', 'm7b5', 'sus2'];
  let okRange = true, okNaive = true, okCount = true, okTones = true, okSorted = true, whyN = '', whyR = '';
  let cases = 0;
  for (let p = 0; p < 20; p++) {
    const len = 3 + Math.floor(rnd() * 5), chords = Array.from({ length: len }, () => ({ root: Math.floor(rnd() * 12), q: pickQ[Math.floor(rnd() * pickQ.length)] }));
    for (const voices of [2, 3, 4, 5]) for (const shape of ['close', 'open', 'drop2']) {
      cases++;
      const opts = { voices, shape, lo: 48, hi: 96 }, vl = T.voiceLead(chords, opts), nv = T.naiveVoicing(chords, opts);
      if (vl.voicings.length !== chords.length) okCount = false;
      for (const v of vl.voicings) {
        if (v.notes.length !== voices) okCount = false;
        if (v.notes.some(n => n < 48 || n > 96)) { okRange = false; whyR += ` p${p}v${voices}${shape}`; }
        if (v.notes.some((n, i) => i && n <= v.notes[i - 1])) okSorted = false;
        const pcs = new Set(T.chordPcs(v.chord.root, v.chord.q));
        if (v.notes.some(n => !pcs.has(mod(n)))) okTones = false;
      }
      const naiveOk = nv.voicings.every(v => v.every((x, i) => !i || x > v[i - 1]) && v.length === voices);   // een grondligging met unisono telt niet mee
      if (naiveOk && vl.total > nv.total) { okNaive = false; whyN += ` p${p}v${voices}${shape}:${vl.total}>${nv.total}`; }
    }
  }
  check(`stemvoering: ${cases} combinaties (20 progressies x 2..5 stemmen x 3 vormen) totale beweging <= grondligging`, okNaive, whyN.slice(0, 200));
  check('stemvoering: alle noten binnen het bereik', okRange, whyR.slice(0, 120));
  check('stemvoering: juiste aantal stemmen per akkoord', okCount);
  check('stemvoering: strikt oplopend (geen kruisende stemmen)', okSorted);
  check('stemvoering: alleen akkoordtonen', okTones);
}
{
  const prog = T.progressions(0, 'major', 'pop')[0].chords;
  const vl = T.voiceLead(prog, { voices: 4, shape: 'close' });
  check('C G Am F in 4 stemmen: waar akkoorden tonen delen blijven die liggen (C-G, Am-F)', vl.voicings[1].move.includes(0) && vl.voicings[3].move.includes(0), vl.voicings.map(v => v.move.join()).join(' | '));
  check('beweging per stem is bij elkaar het totaal', vl.total === vl.voicings.reduce((a, v) => a + v.total, 0) && vl.voicings.every(v => v.total === v.move.reduce((a, b) => a + Math.abs(b), 0)));
  check('eerste akkoord beweegt niet', vl.voicings[0].move.every(m => m === 0));
  check('namen bij elke noot', vl.voicings.every(v => v.names.length === v.notes.length && /^[A-G][#b]?\d$/.test(v.names[0])));
  check('stemvoering is veel zuiniger dan grondligging', vl.total <= 20, String(vl.total));
  const j = T.voiceLead(T.progressions(0, 'major', 'jazz')[0].chords, { voices: 2 });
  check('2 stemmen op vierklanken: guide tones (terts en septiem)', j.voicings.every(v => { const q = T.QID[v.chord.q], third = mod(v.chord.root + q.iv[q.roles.indexOf('3')]), sev = mod(v.chord.root + q.iv[q.roles.indexOf('7')]); return new Set(v.notes.map(x => mod(x))).has(third) && new Set(v.notes.map(x => mod(x))).has(sev); }));
  const rt = T.voiceLead(prog, { voices: 2 });
  check('2 stemmen op drieklanken: grondtoon en terts', rt.voicings.every(v => { const q = T.QID[v.chord.q], pcs = new Set(v.notes.map(x => mod(x))); return pcs.has(mod(v.chord.root)) && pcs.has(mod(v.chord.root + q.iv[1])); }));
  const rt2 = T.voiceLead(T.progressions(0, 'major', 'jazz')[0].chords, { voices: 2, two: 'rootthird' });
  check('2 stemmen met keuze grondtoon+terts bij vierklanken', rt2.voicings.every(v => new Set(v.notes.map(x => mod(x))).has(mod(v.chord.root))));
  const v5 = T.voiceLead(prog, { voices: 5, shape: 'close' }), v6 = T.voiceLead(prog, { voices: 6, shape: 'close', hi: 100 });
  check('5 stemmen op drieklanken: alle akkoordtonen aanwezig', v5.voicings.every(v => T.chordPcs(v.chord.root, v.chord.q).every(p => v.notes.some(n => mod(n) === p))));
  check('6 stemmen kan (maximum)', v6.voicings.every(v => v.notes.length === 6));
  check('meer dan 6 stemmen wordt 6', T.voiceLead(prog, { voices: 9 }).voicings[0].notes.length === 6);
  const op = T.voiceLead(prog, { voices: 3, shape: 'open' }), cl = T.voiceLead(prog, { voices: 3, shape: 'close' }), d2 = T.voiceLead(prog, { voices: 3, shape: 'drop2' });
  check('open voicing is ruimer dan dicht', op.voicings.every(v => v.notes[v.notes.length - 1] - v.notes[0] > 12) && cl.voicings.every(v => v.notes[v.notes.length - 1] - v.notes[0] <= 12));
  check('drop-2 voicing heeft een tweede noot een octaaf omlaag (spreiding groter dan dicht)', d2.voicings.every(v => v.notes[v.notes.length - 1] - v.notes[0] > 7));
  check('lege reeks gooit niet', T.voiceLead([], {}).voicings.length === 0);
  check('rootPosition: add9 zet de none boven', T.rootPosition(0, 'add9', 48).join() === '48,52,55,62');
}

// ---------------------------------------------------------------- data en uitbreidbaarheid
section('data');
{
  check('minstens 12 schalen (westers, pentatoon, blues)', T.SCALE_ORDER.length >= 12 && T.SCALE_ORDER.every(id => T.SCALES[id].iv && T.SCALES[id].nl && T.SCALES[id].en));
  check('tien stijlen plus algemeen', T.STYLE_ORDER.length === 10 && T.STYLE_ORDER.every(id => T.STYLES[id].nl && T.STYLES[id].en && T.STYLES[id].note.nl && T.STYLES[id].note.en && T.STYLES[id].maj.length >= 3 && T.STYLES[id].min.length >= 3));
  check('twintig akkoordsoorten herkenbaar', T.Q.filter(q => !q.rare).length === 20);
  check('elke akkoordsoort heeft een naam in NL en EN', T.Q.every(q => T.QNAMES[q.id] && T.QNAMES[q.id].nl && T.QNAMES[q.id].en));
  check('alle progressietokens zijn leesbaar', T.STYLE_ORDER.every(id => [...T.STYLES[id].maj, ...T.STYLES[id].min].every(txt => txt.split(' ').every(tok => T.parseRoman(tok)))));
}

console.log(`\n${n} gevallen, ${fails.length} mislukt`);
if (fails.length) { for (const f of fails) console.log('  MISLUKT: ' + f); process.exit(1); }
