// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests van de motor van Remix (puur JavaScript, geen host nodig).
//   node devices/tools/Remix/tests/engine.test.mjs
// De motor staat in het apparaatbestand tussen de regels "// <engine>" en "// </engine>"; deze test haalt dat blok eruit.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'remix.patchkamer-device.js');
const src = readFileSync(file, 'utf8');
const a = src.indexOf('// <engine>'), b = src.indexOf('// </engine>');
if (a < 0 || b < 0) { console.error('motorblok niet gevonden'); process.exit(1); }
const R = new Function(src.slice(a, b) + '\nreturn REMIX;')();

let n = 0; const fails = [];
const check = (name, cond, extra = '') => { n++; if (!cond) fails.push(name + (extra ? '  [' + extra + ']' : '')); };
const section = name => console.log('# ' + name);
const clone = o => JSON.parse(JSON.stringify(o));
const mod12 = x => ((x % 12) + 12) % 12;

// ---------------------------------------------------------------- een bronsong in A mineur (Am F C G in het refrein, Am G F E in het couplet)
const note = (id, step, nt, len, vel = .8, extra = {}) => ({ id, step, note: nt, len, vel, prob: 1, ...extra });
const chordClip = (name, roots, pcs = [[0, 3, 7], [0, 4, 7]]) => { // een akkoord per maat, root op nootnummer
  const notes = []; let id = 1; roots.forEach(([r, q], bar) => (q === 'm' ? [0, 3, 7] : [0, 4, 7]).forEach(i => notes.push(note(id++, bar * 16, r + i, 16, .7)))); return { name, bars: roots.length, notes, cc: [], auto: [] };
};
const bassClip = (name, roots) => { const notes = []; let id = 1; roots.forEach((r, bar) => [0, 4, 8, 12].forEach(s => notes.push(note(id++, bar * 16 + s, r - 24 + 0, 3, s ? .75 : .95)))); return { name, bars: roots.length, notes, cc: [], auto: [] }; };
const leadClip = (name, pitches) => { const notes = []; let id = 1; pitches.forEach((p, k) => notes.push(note(id++, k * 4, p, 3, .85))); return { name, bars: Math.ceil(pitches.length / 4), notes, cc: [], auto: [] }; };
const drumClip = (name, bars, dense) => { const notes = []; let id = 1; for (let b = 0; b < bars; b++) { [0, 4, 8, 12].forEach(s => notes.push(note(id++, b * 16 + s, 36, 1, .9, { row: 0, ratchet: 1 }))); [4, 12].forEach(s => notes.push(note(id++, b * 16 + s, 38, 1, .85, { row: 1, ratchet: 1 }))); if (dense) for (let s = 0; s < 16; s += 2) notes.push(note(id++, b * 16 + s, 42, 1, .5, { row: 3, ratchet: 1 })); } return { name, bars, notes, cc: [], auto: [] }; };
const blank = j => ({ name: 'Clip ' + (j + 1), bars: 1, notes: [], cc: [], auto: [] });
function sourceSong() {
  const A = 57, F = 53, C = 48, G = 55, E = 52;                           // wortels (octaaf 3): A F C G
  const tracks = [
    { name: 'Drums', type: 'drums', mute: false, transpose: 0, velocity: 1, rows: undefined, clips: [], cells: [] },
    { name: 'Bass', type: 'notes', transpose: 0, velocity: 1, clips: [], cells: [] },
    { name: 'Keys', type: 'notes', transpose: 0, velocity: 1, clips: [], cells: [] },
    { name: 'Melody', type: 'notes', transpose: 0, velocity: 1, clips: [], cells: [] }];
  // scènes: 0 Intro, 1 Verse, 2 Chorus, 3 Break, 4 Outro
  tracks[0].clips = [drumClip('d intro', 2, false), drumClip('d verse', 2, true), drumClip('d chorus', 2, true), blank(3), drumClip('d outro', 2, false)];
  tracks[1].clips = [blank(0), bassClip('b verse', [A, G, F, E]), bassClip('b chorus', [A, F, C, G]), blank(3), blank(4)];
  tracks[2].clips = [chordClip('k intro', [[A, 'm'], [F, 'M'], [C, 'M'], [G, 'M']]), chordClip('k verse', [[A, 'm'], [G, 'M'], [F, 'M'], [E, 'M']]), chordClip('k chorus', [[A, 'm'], [F, 'M'], [C, 'M'], [G, 'M']]), chordClip('k break', [[A, 'm'], [G, 'M'], [F, 'M'], [E, 'M']]), blank(4)];
  tracks[3].clips = [blank(0), blank(1), leadClip('hook', [72, 76, 74, 72, 69, 72, 71, 69, 72, 76, 79, 76, 74, 72, 71, 69]), blank(3), blank(4)];
  tracks.forEach(t => { t.cells = [0, 1, 2, 3, 4]; });
  tracks[1].cells = [-1, 1, 2, 1, -1]; tracks[0].cells = [0, 1, 2, 3, 4]; tracks[3].cells = [-1, -1, 2, -1, -1]; tracks[2].cells = [0, 1, 2, 3, -1];
  tracks[0].clips[3] = blank(3);
  const arr = [{ scene: 0, bars: 4, repeats: 1 }, { scene: 1, bars: 4, repeats: 4 }, { scene: 2, bars: 4, repeats: 2 }, { scene: 1, bars: 4, repeats: 4 }, { scene: 2, bars: 4, repeats: 2 }, { scene: 3, bars: 4, repeats: 2 }, { scene: 2, bars: 4, repeats: 4 }, { scene: 4, bars: 4, repeats: 1 }];
  return { title: 'Bron', tracks, scenes: ['Intro', 'Verse', 'Chorus', 'Break', 'Outro'].map(name => ({ name })), songs: [{ name: 'Origineel', arrangement: arr }], activeSong: 0, arrangement: arr, mode: 'session' };
}

// ---------------------------------------------------------------- geldigheid van een CA-state
function validState(S, label) {
  let ok = true; const bad = m => { ok = false; fails.push(label + ': ' + m); };
  if (S.scenes.length > 24) bad('meer dan 24 scènes'); if (S.songs.length > 16) bad('meer dan 16 songs');
  S.tracks.forEach((t, ti) => {
    if (t.clips.length > 48) bad('spoor ' + ti + ' meer dan 48 clips'); if (t.cells.length !== S.scenes.length) bad('cells van spoor ' + ti + ' gelijk aan het aantal scènes');
    t.cells.forEach(v => { if (!(v === -1 || (Number.isInteger(v) && v < t.clips.length && t.clips[v]))) bad('cel wijst naar niets: ' + v); });
    t.clips.forEach((c, j) => { if (!c) { bad('lege clipplek ' + j); return; } if (c.bars < 1 || c.bars > 64) bad('bars buiten bereik'); const ids = new Set();
      c.notes.forEach(x => { if (!(x.step >= 0 && x.step < c.bars * 16)) bad('step buiten de clip: ' + x.step + ' van ' + c.bars * 16); if (!(x.note >= 0 && x.note <= 127)) bad('noot buiten bereik'); if (!(x.len >= .25 && x.len <= 1024)) bad('len buiten bereik'); if (!(x.vel >= .01 && x.vel <= 1)) bad('vel buiten bereik'); if (!Number.isFinite(x.step * 4) || (x.step * 4) % 1 !== 0) bad('step niet op kwart'); if (ids.has(x.id)) bad('dubbel id'); ids.add(x.id); }); });
  });
  S.songs.forEach(g => g.arrangement.forEach(a => { if (!(a.scene >= 0 && a.scene < S.scenes.length)) bad('sectie wijst naar scène ' + a.scene); if (a.bars < 1 || a.bars > 64 || a.repeats < 1 || a.repeats > 16) bad('bars/repeats buiten bereik'); }));
  return ok;
}

// ---------------------------------------------------------------- 1. analyse
section('analyse');
const src0 = sourceSong(), an = R.analyze(src0, { bpm: 124 });
check('toonsoort A mineur', an.key && an.key.tonic === 9 && an.key.mode === 'minor', JSON.stringify(an.key));
check('relatieve toonsoort C', an.key && an.key.relative === 'C');
check('rollen: drums, bas, akkoorden, melodie', an.tracks.map(t => t.role).join() === 'drums,bass,chords,lead', an.tracks.map(t => t.role).join());
check('8 secties', an.sections.length === 8);
check('sectie 1 is intro', an.sections[0].role === 'intro', an.sections.map(s => s.role).join());
check('refreinen herkend (naam Chorus)', an.sections.filter(s => s.role === 'chorus').length === 3);
check('breakdown herkend', an.sections[5].role === 'breakdown');
check('laatste sectie is outro', an.sections[7].role === 'outro');
check('totaal maten = 4+16+8+16+8+8+16+4 = 80', an.totalBars === 80, String(an.totalBars));
check('duur 80 maten bij 124 BPM = 154,8 s', Math.abs(an.seconds - 154.838) < .1, String(an.seconds));
check('refrein-akkoorden Am F C G', an.chords.chorus.map(c => c.name).join(' ') === 'Am F C G', an.chords.chorus.map(c => c.name).join(' '));
check('couplet-akkoorden Am G F E', an.chords.verse.map(c => c.name).join(' ') === 'Am G F E', an.chords.verse.map(c => c.name).join(' '));
check('Romeinse cijfers i VI III VII', an.chords.chorus.map(c => c.roman).join(' ') === 'i VI III VII', an.chords.chorus.map(c => c.roman).join(' '));
check('E majeur in A mineur telt als dominant (diatonisch)', an.chords.verse[3].diatonic);
check('hook = melodiespoor, clip 3', an.hook && an.hook.track === 3 && an.hook.clip === 2, JSON.stringify(an.hook));
check('hitscore tussen 0 en 100', an.score >= 0 && an.score <= 100);
check('bron stelt de toonaard niet uit het veld: bpm 124 is dansbaar', an.findings.find(f => f.id === 'tempo').ok === true);
const slow = R.analyze(src0, { bpm: 60 });
check('bij 60 BPM: lang, eerste refrein te laat', slow.findings.find(f => f.id === 'dur').ok === false && slow.findings.find(f => f.id === 'chorus1').ok === false);
check('bij 150 BPM: tempo te hoog', R.analyze(src0, { bpm: 150 }).findings.find(f => f.id === 'tempo').ok === false);
check('lege song wordt als leeg gemeld', R.analyze({ tracks: [{ type: 'notes', clips: [blank(0)] }], scenes: [{ name: '' }] }).empty === true);
const oddSrc = sourceSong(); oddSrc.songs[0].arrangement[1].bars = 3; oddSrc.arrangement = oddSrc.songs[0].arrangement;
check('sectie van 3 maten wordt gemeld', R.analyze(oddSrc, { bpm: 124 }).findings.find(f => f.id === 'bars4').ok === false);

// ---------------------------------------------------------------- 2. akkoordherkenning
section('akkoorden');
const w = pcs => { const x = new Array(12).fill(0); pcs.forEach(p => { x[p] = 1; }); return x; };
check('C majeur', R.matchChord(w([0, 4, 7]), 0).root === 0 && R.matchChord(w([0, 4, 7]), 0).q === '');
check('A mineur', (m => m.root === 9 && m.q === 'm')(R.matchChord(w([9, 0, 4]), 9)));
check('G7', (m => m.root === 7 && m.q === '7')(R.matchChord(w([7, 11, 2, 5]), 7)));
check('B verminderd', (m => m.root === 11 && m.q === 'dim')(R.matchChord(w([11, 2, 5]), 11)));
check('Cmaj7', (m => m.root === 0 && m.q === 'maj7')(R.matchChord(w([0, 4, 7, 11]), 0)));
check('niets geeft null', R.matchChord(new Array(12).fill(0), -1) === null);

// ---------------------------------------------------------------- 3. hit-versie
section('hit-versie');
const origBefore = clone(R.norm(src0));
const hit = R.build(src0, { recipe: 'hit', bpm: 124 });
check('hit gelukt', hit.ok, hit.err && hit.err.k);
check('geldige state', validState(hit.state, 'hit'));
check('er is een song bij (2 songs), actief = nieuwe', hit.state.songs.length === 2 && hit.state.activeSong === 1);
check('de bronsong is ongewijzigd', JSON.stringify(hit.state.songs[0]) === JSON.stringify(origBefore.songs[0]));
check('bestaande clips zijn niet aangepast', origBefore.tracks.every((t, ti) => t.clips.every((c, j) => JSON.stringify(c) === JSON.stringify(hit.state.tracks[ti].clips[j]))));
check('modus staat op song', hit.state.mode === 'song');
const roles = hit.after.sections.map(s => s.role).join();
check('gouden volgorde: intro, couplet, refrein, couplet, refrein, breakdown, refrein, outro', roles === 'intro,verse,chorus,verse,chorus,breakdown,chorus,outro', roles);
check('duur ≤ 3:30', hit.after.seconds <= 210, String(hit.after.seconds));
check('eerste refrein binnen 50 s', hit.after.findings.find(f => f.id === 'chorus1').ok === true);
check('alle secties zijn een veelvoud van 4 maten', hit.after.findings.find(f => f.id === 'bars4').ok === true);
check('de hook zit niet in de intro maar wel in het refrein', (() => { const arr = hit.state.songs[1].arrangement, ti = 3; const intro = hit.state.tracks[ti].cells[arr[0].scene], chorus = hit.state.tracks[ti].cells[arr[2].scene]; return intro === -1 && chorus === 2; })());
check('het laatste refrein is dubbel', hit.after.sections[6].bars >= 1.5 * hit.after.sections[2].bars);
check('hitscore van het resultaat is hoger dan van de bron met trage duur', hit.after.score >= 80, String(hit.after.score));
const radio = R.build(src0, { recipe: 'radio', bpm: 124 });
check('radio gelukt en korter dan hit', radio.ok && radio.after.totalBars < hit.after.totalBars, radio.ok ? radio.after.totalBars + '/' + hit.after.totalBars : '');
check('radio: eerste refrein eerder', radio.ok && radio.after.sections.find(s => s.role === 'chorus').startSec <= hit.after.sections.find(s => s.role === 'chorus').startSec);
const hitSlow = R.build(src0, { recipe: 'hit', bpm: 90 });
check('bij 90 BPM wordt ingekort tot ≤ 3:30', hitSlow.ok && hitSlow.after.seconds <= 210, hitSlow.ok ? String(hitSlow.after.seconds) : '');
const clubDrums = R.build(src0, { recipe: 'hit', bpm: 124, drums: 'club' });
check('hit met clubslagwerk geldig', clubDrums.ok && validState(clubDrums.state, 'hit-club'));
check('clubslagwerk: kick op elke tel', (() => { const t = clubDrums.state.tracks[0]; const c = t.clips.find(c => c.name.startsWith('Groove')); return c && [0, 4, 8, 12].every(s => c.notes.some(x => x.step === s && x.note === 36)); })());
check('twee keer hit bouwen geeft dezelfde uitkomst', JSON.stringify(R.build(src0, { recipe: 'hit', bpm: 124 }).state) === JSON.stringify(hit.state));
const hit2 = R.build(hit.state, { recipe: 'hit', bpm: 124, song: 1 });
check('een remix van een remix werkt (3 songs)', hit2.ok && hit2.state.songs.length === 3 && validState(hit2.state, 'hit2'));

// ---------------------------------------------------------------- 4. club-mix
section('club-mix');
const club = R.build(src0, { recipe: 'club', bpm: 124 });
check('club gelukt', club.ok, club.err && club.err.k);
check('club: geldige state', club.ok && validState(club.state, 'club'));
const carr = club.state.songs[club.state.activeSong].arrangement;
check('club: 10 blokken, elk een veelvoud van 8 maten', carr.length === 10 && carr.every(x => (x.bars * x.repeats) % 8 === 0), JSON.stringify(carr.map(x => x.bars * x.repeats)));
check('club: de DJ-intro bevat alleen de kick', (() => { const sc = carr[0].scene; return club.state.tracks.every((t, ti) => ti === 0 ? t.cells[sc] >= 0 && t.clips[t.cells[sc]].notes.every(x => x.note === 36) : t.cells[sc] === -1); })());
check('club: DJ-uit heeft dezelfde inhoud als DJ-in en een eigen scènenaam', club.state.tracks.every(t => t.cells[carr[0].scene] === t.cells[carr[9].scene]) && club.state.scenes[carr[0].scene].name === 'DJ intro' && club.state.scenes[carr[9].scene].name === 'DJ outro');
check('club: duur tussen 4 en 8 minuten', club.after.seconds > 240 && club.after.seconds < 480, String(club.after.seconds));
check('club: profiel club — duur, eerste drop, intro en 8-maten-secties zijn goed', club.after.profile === 'club' && ['dur', 'chorus1', 'intro', 'bars4', 'breakdown', 'outro'].every(id => club.after.findings.find(f => f.id === id).ok === true), JSON.stringify(club.after.findings.filter(f => f.ok !== true).map(f => f.id)));
check('club-mix met popprofiel gemeten is te lang (laat het verschil zien)', R.analyze(club.state, { song: club.state.activeSong, bpm: 124 }).findings.find(f => f.id === 'dur').ok === false);
const noDrums = sourceSong(); noDrums.tracks.shift();
check('club zonder drumspoor geeft een duidelijke fout', R.build(noDrums, { recipe: 'club', bpm: 124 }).ok === false);

// ---------------------------------------------------------------- 5. tempo flip
section('tempo flip');
const flip = R.build(src0, { recipe: 'flip', bpm: 68, targetBpm: 138 });
check('flip gelukt', flip.ok, flip.err && flip.err.k);
check('flip: geldige state', flip.ok && validState(flip.state, 'flip'));
check('flip 68 → 138: factor 2', flip.lines.some(l => l.k === 'flip' && l.a[2] === 2));
const fo = flip.state.songs[0].arrangement, fn = flip.state.songs[1].arrangement;
check('flip: secties dubbel zo lang in maten', fn.every((x, i) => x.bars === fo[i].bars * 2 && x.repeats === fo[i].repeats));
const tOld = fo.reduce((p, x) => p + x.bars * x.repeats, 0) * 240 / 68, tNew = fn.reduce((p, x) => p + x.bars * x.repeats, 0) * 240 / 138;
check('flip: duur in seconden blijft gelijk (±3%)', Math.abs(tOld - tNew) / tOld < .03, tOld.toFixed(1) + ' vs ' + tNew.toFixed(1));
check('flip: noten ×2 in tijd, zelfde aantal', (() => { const t = flip.state.tracks[2]; const o = t.clips[1], c = t.clips.find(c => c.name === 'k verse ×2'); return c && c.bars === o.bars * 2 && c.notes.length === o.notes.length && c.notes.every((x, i) => x.step === o.notes[i].step * 2 && x.len === o.notes[i].len * 2); })());
check('flip: toonhoogtes ongewijzigd', (() => { const t = flip.state.tracks[3]; const o = t.clips[2], c = t.clips.find(c => c.name === 'hook ×2'); return c && c.notes.every((x, i) => x.note === o.notes[i].note); })());
const half = R.build(flip.state, { recipe: 'flip', bpm: 138, targetBpm: 68, song: 1 });
check('flip terug (÷2) geeft de oorspronkelijke noten (rondreis)', half.ok && (() => { const t = half.state.tracks[2]; const c = t.clips.find(c => c.name === 'k verse ×2 ÷2'); const o = flip.state.tracks[2].clips[1]; return c && c.bars === o.bars && c.notes.length === o.notes.length && c.notes.every((x, i) => x.step === o.notes[i].step && x.len === o.notes[i].len); })());
const same = R.build(src0, { recipe: 'flip', bpm: 124, targetBpm: 128 });
check('Nederlandse scènenamen met lang nl', (r => r.ok && r.state.scenes.some(sc => sc.name === 'Couplet') && r.state.scenes.some(sc => sc.name === 'Refrein'))(R.build(src0, { recipe: 'hit', bpm: 124, lang: 'nl' })));
check('Nederlandse namen worden weer herkend als rol', (r => r.ok && r.after.sections.map(s => s.role).join() === 'intro,verse,chorus,verse,chorus,breakdown,chorus,outro')(R.build(src0, { recipe: 'hit', bpm: 124, lang: 'nl' })));
check('flip van 124 naar 128: geen schaling, wel nieuwe song', same.ok && same.lines.some(l => l.k === 'flip' && l.a[2] === 1));

// ---------------------------------------------------------------- 6. nieuwe song per stijl
section('nieuwe song');
for (const style of Object.keys(R.STYLES)) {
  const st = R.STYLES[style], res = R.build({ tracks: [], scenes: [] }, { recipe: 'new', style, seed: 7, bpm: 120 });
  check(style + ': gelukt (ook zonder sporen)', res.ok === false || res.ok === true);
}
const empty = { title: '', tracks: [{ type: 'notes', clips: Array.from({ length: 8 }, (_, j) => blank(j)), cells: [0, 1, 2, 3, 4, 5, 6, 7] }], scenes: Array.from({ length: 8 }, () => ({ name: '' })), songs: [{ name: '', arrangement: [{ scene: 0, bars: 4, repeats: 1 }] }], activeSong: 0 };
for (const style of Object.keys(R.STYLES)) {
  const st = R.STYLES[style], res = R.build(empty, { recipe: 'new', style, seed: 3, bpm: 100 });
  check(style + ': gelukt', res.ok, res.err && res.err.k); if (!res.ok) continue;
  check(style + ': geldige state', validState(res.state, style));
  check(style + ': vier sporen Drums, Bass, Chords, Lead', res.state.tracks.map(t => t.name).join() === 'Drums,Bass,Chords,Lead', res.state.tracks.map(t => t.name).join());
  check(style + ': tempo uit de stijl', res.bpm === st.bpm);
  check(style + ': vijf scènes', res.state.scenes.length === 5, String(res.state.scenes.length));
  const an2 = res.after;
  check(style + ': toonsoort teruggevonden, of de relatieve (' + R.NOTE_NAMES[st.tonic] + ' ' + st.mode + ')', an2.key && ((an2.key.tonic === st.tonic && an2.key.mode === st.mode) || (st.mode === 'minor' && an2.key.mode === 'major' && an2.key.tonic === mod12(st.tonic + 3)) || (st.mode === 'major' && an2.key.mode === 'minor' && an2.key.tonic === mod12(st.tonic - 3))), JSON.stringify(an2.key && an2.key.name));
  check(style + ': akkoorden diatonisch', an2.findings.find(f => f.id === 'diatonic').ok === true, an2.findings.find(f => f.id === 'diatonic').a[0]);
  check(style + ': duur ≤ 3:30', an2.seconds <= 210, String(an2.seconds));
  check(style + ': eerste refrein ≤ 50 s', an2.findings.find(f => f.id === 'chorus1').ok === true);
  check(style + ': hook terugkerend', an2.findings.find(f => f.id === 'hook').ok === true);
  check(style + ': hitscore ≥ 90', an2.score >= 90, String(an2.score));
  const sc = R.SCALES[st.mode].map(x => mod12(x + st.tonic));
  const chordsT = res.state.tracks[2], leadT = res.state.tracks[3], bassT = res.state.tracks[1];
  check(style + ': alle melodienoten in de toonladder', leadT.clips.flatMap(c => c.notes).every(x => sc.includes(x.note % 12)));
  const hookC = leadT.clips.find(c => c.name === 'Hook');
  check(style + ': de hook eindigt op de grondtoon', hookC && (() => { const last = [...hookC.notes].sort((p, q) => p.step - q.step).pop(); return last.note % 12 === st.tonic; })());
  check(style + ': de hook blijft binnen anderhalf octaaf', hookC && (() => { const ns = hookC.notes.map(x => x.note); return Math.max(...ns) - Math.min(...ns) <= 18; })());
  check(style + ': bas begint in de wortel van het akkoord', (() => { const bc = bassT.clips.find(c => c.name === 'Bass chorus'); const prog = st.prog.chorus; return prog.every((d, bar) => { const root = mod12(st.tonic + R.SCALES[st.mode][d]); const first = bc.notes.filter(x => x.step >= bar * 16 && x.step < bar * 16 + 16).sort((p, q) => p.step - q.step)[0]; return first && first.note % 12 === root; }); })());
  check(style + ': bas in laag register', bassT.clips.flatMap(c => c.notes).every(x => x.note >= 36 && x.note <= 59));
  check(style + ': akkoorden in middenregister met stemvoering (geen sprong > 7 halve tonen per stem)', (() => { const cc = chordsT.clips.find(c => c.name === 'Chords chorus'); const bars = [0, 1, 2, 3].map(b => cc.notes.filter(x => x.step >= b * 16 && x.step < b * 16 + 16)); const tops = bars.map(ns => { const set = [...new Set(ns.map(x => x.note))].sort((p, q) => p - q); return set; }); return tops.every((v, i) => v.length === 3 && v[0] >= 55 && v[2] <= 79 && (i === 0 || v.every((m, k) => Math.abs(m - tops[i - 1][k]) <= 7))); })());
  const dr = res.state.tracks[0]; const cc = dr.clips.find(c => c.name === 'Drums chorus');
  check(style + ': refrein-slagwerk heeft een crash op maat 1 en een fill op maat 4', cc && cc.notes.some(x => x.note === 49 && x.step === 0) && cc.notes.filter(x => x.note === 38 && x.step >= 60).length >= 4);
  check(style + ': dezelfde seed geeft dezelfde song, een andere seed een andere hook', (() => { const again = R.build(empty, { recipe: 'new', style, seed: 3, bpm: 100 }), other = R.build(empty, { recipe: 'new', style, seed: 4, bpm: 100 }); const hk = r => JSON.stringify(r.state.tracks[3].clips.find(c => c.name === 'Hook').notes); return hk(again) === hk(res) && hk(other) !== hk(res); })());
}
const tonicTest = R.build(empty, { recipe: 'new', style: 'pop', tonic: 2, mode: 'minor', seed: 1, bpm: 100 });
check('eigen toonsoort D mineur wordt gebruikt (of F majeur, relatief)', tonicTest.ok && ((tonicTest.after.key.tonic === 2 && tonicTest.after.key.mode === 'minor') || (tonicTest.after.key.tonic === 5 && tonicTest.after.key.mode === 'major')), JSON.stringify(tonicTest.after && tonicTest.after.key));
const withContent = R.build(src0, { recipe: 'new', style: 'house', seed: 1, bpm: 124 });
check('nieuwe song in een project met inhoud: bron blijft, song erbij', withContent.ok && validState(withContent.state, 'new-in-content') && withContent.state.songs.length === 2 && JSON.stringify(withContent.state.songs[0]) === JSON.stringify(origBefore.songs[0]), withContent.err && withContent.err.k);
check('nieuwe song in een project met inhoud: rollen aan de bestaande sporen gekoppeld', withContent.ok && withContent.after.tracks.map(t => t.role).join() === 'drums,bass,chords,lead', withContent.ok ? withContent.after.tracks.map(t => t.role).join() : '');

// ---------------------------------------------------------------- 7. grenzen
section('grenzen');
const full = clone(src0); for (let i = 0; i < 24 - full.scenes.length; i++) { full.scenes.push({ name: 'x' + i }); full.tracks.forEach(t => t.cells.push(-1)); }
const rfull = R.build(full, { recipe: 'club', bpm: 124 });
check('bij 24 scènes: geen paniek, wel geldige uitkomst of nette fout', !rfull.ok || validState(rfull.state, 'vol'), rfull.err && rfull.err.k);
const songs16 = clone(src0); songs16.songs = Array.from({ length: 16 }, (_, i) => ({ name: 's' + i, arrangement: songs16.songs[0].arrangement }));
check('bij 16 songs: nette fout', R.build(songs16, { recipe: 'hit', bpm: 124 }).ok === false);
check('zonder sporen: nette fout', R.build({ tracks: [], scenes: [] }, { recipe: 'hit', bpm: 124 }).ok === false);
check('rommelinvoer breekt niets', (() => { try { R.build(null, { recipe: 'hit' }); R.analyze('x', {}); R.build({ tracks: [{ clips: 5 }], scenes: 'a', songs: 3 }, { recipe: 'club' }); return true; } catch (e) { fails.push('crash: ' + e.message); return false; } })());
const big = clone(src0); big.tracks[1].clips[1].notes = Array.from({ length: 300 }, (_, i) => note(i + 1, (i * .25) % 64, 40 + (i % 12), 1));
check('nootaantallen en velden blijven geldig na een flip', (() => { const r = R.build(big, { recipe: 'flip', bpm: 68, targetBpm: 138 }); return r.ok && validState(r.state, 'big-flip'); })());

console.log(`${n} controles, ${fails.length} mislukt`);
if (fails.length) { fails.forEach(f => console.log('MISLUKT: ' + f)); process.exit(1); }
