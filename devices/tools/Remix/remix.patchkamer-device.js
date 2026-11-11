// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Patchkamer contract v1.35. Eerste versie. Remix: leest de song van een Clip Arranger (host.stateOf), analyseert toonsoort, akkoorden,
//          secties, hook en hitkenmerken, en schrijft een remix als extra song in dezelfde Clip Arranger (host.setStateOf, alleen op een klik, met Herstel).
//          Ook een nieuwe song starten (bootstrap) uit een stijl, toonsoort en seed. Geen geluid, geen poorten. De motor staat in het blok met de engine-markeringen hieronder en wordt door
//          devices/tools/Remix/tests/engine.test.mjs zonder host getest.
// Remix werkt op noten en clips, niet op audio: het hoort niets en kan niet beoordelen hoe het klinkt.

// <engine>
const REMIX = (() => {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
  const KS = { major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17] };
  const CAP = { scenes: 24, clips: 48, songs: 16, arr: 64 };
  const MAX_SECONDS = 210;           // 3:30, de bovengrens uit de gouden regels
  const clone = o => JSON.parse(JSON.stringify(o));
  const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const int = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Math.round(num(v, d))));
  const mod12 = n => ((n % 12) + 12) % 12;
  const q4 = x => Math.round(x * 4) / 4;
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---- stijlen (voor een nieuwe song): tempo, toonsoort, akkoordgangen als trappen van de toonladder (0 = I of i), ritme per rol
  const STYLES = {
    house: { bpm: 124, mode: 'minor', tonic: 9, prog: { verse: [0, 5, 2, 6], chorus: [0, 3, 5, 6] },
      drums: { kick: [0, 4, 8, 12], clap: [4, 12], ohh: [2, 6, 10, 14], chh: [1, 3, 5, 7, 9, 11, 13, 15] },
      bass: [[2, 2, 0], [6, 2, 0], [10, 2, 0], [14, 2, 0]], chords: [[0, 2], [3, 2], [6, 2], [10, 2]] },
    pop: { bpm: 112, mode: 'major', tonic: 0, prog: { verse: [5, 3, 0, 4], chorus: [0, 4, 5, 3] },
      drums: { kick: [0, 8, 10], snare: [4, 12], chh: [0, 2, 4, 6, 8, 10, 12, 14] },
      bass: [[0, 6, 0], [6, 2, 0], [8, 4, 7], [12, 4, 0]], chords: [[0, 16]] },
    hiphop: { bpm: 90, mode: 'minor', tonic: 5, prog: { verse: [0, 5, 3, 4], chorus: [0, 2, 5, 6] },
      drums: { kick: [0, 7, 10], snare: [4, 12], chh: [0, 2, 4, 6, 8, 10, 12, 14] },
      bass: [[0, 3, 0], [6, 2, 0], [10, 4, 0]], chords: [[0, 8], [8, 8]] },
    disco: { bpm: 118, mode: 'major', tonic: 7, prog: { verse: [1, 4, 0, 5], chorus: [0, 5, 1, 4] },
      drums: { kick: [0, 4, 8, 12], clap: [4, 12], ohh: [2, 6, 10, 14], chh: [0, 2, 4, 6, 8, 10, 12, 14] },
      bass: [0, 1, 2, 3, 4, 5, 6, 7].map(k => [k * 2, 2, k % 2 ? 12 : 0]), chords: [[0, 3], [4, 3], [8, 3], [12, 3]] },
    synthwave: { bpm: 100, mode: 'minor', tonic: 4, prog: { verse: [0, 5, 2, 6], chorus: [5, 6, 0, 2] },
      drums: { kick: [0, 8], snare: [4, 12], chh: [0, 2, 4, 6, 8, 10, 12, 14] },
      bass: [0, 1, 2, 3, 4, 5, 6, 7].map(k => [k * 2, 2, 0]), chords: [[0, 16]] },
  };
  const DRUM_NOTE = { kick: 36, snare: 38, clap: 39, chh: 42, ohh: 46, crash: 49 };
  const DRUM_DEFAULT_ROW = { kick: 0, snare: 1, clap: 2, chh: 3, ohh: 4, crash: 9 };

  // ---- project lezen
  function norm(src) {
    const S = clone(src && typeof src === 'object' ? src : {});
    S.tracks = Array.isArray(S.tracks) ? S.tracks.filter(t => t && typeof t === 'object').slice(0, 16) : [];
    S.scenes = Array.isArray(S.scenes) ? S.scenes.slice(0, CAP.scenes) : [];
    S.tracks.forEach(t => {
      t.clips = (Array.isArray(t.clips) ? t.clips : []).slice(0, CAP.clips).map(c => { c = c && typeof c === 'object' ? c : {}; c.notes = Array.isArray(c.notes) ? c.notes : []; c.cc = Array.isArray(c.cc) ? c.cc : []; c.auto = Array.isArray(c.auto) ? c.auto : []; c.bars = int(c.bars, 1, 64, 1); return c; });
      t.type = ['notes', 'drums', 'drone'].includes(t.type) ? t.type : 'notes';
      const has = Array.isArray(t.cells);
      t.cells = S.scenes.map((_, j) => { const v = has ? t.cells[j] : (j < t.clips.length ? j : -1); return Number.isInteger(v) && v >= 0 && v < t.clips.length ? v : -1; });
    });
    if (!Array.isArray(S.songs) || !S.songs.length) S.songs = [{ name: '', arrangement: Array.isArray(S.arrangement) && S.arrangement.length ? S.arrangement : [{ scene: 0, bars: 4, repeats: 1 }] }];
    S.songs = S.songs.slice(0, CAP.songs).map(g => ({ ...g, name: typeof g.name === 'string' ? g.name : '', arrangement: (Array.isArray(g.arrangement) && g.arrangement.length ? g.arrangement : [{ scene: 0, bars: 4, repeats: 1 }]).slice(0, CAP.arr).map(a => ({ ...a, scene: int(a.scene, 0, Math.max(0, S.scenes.length - 1), 0), bars: int(a.bars, 1, 64, 4), repeats: int(a.repeats, 1, 16, 1) })) }));
    S.activeSong = int(S.activeSong, 0, S.songs.length - 1, 0);
    return S;
  }
  const secScenes = a => (Array.isArray(a.scenes) && a.scenes.length ? a.scenes : [a.scene]);
  const secBars = a => secScenes(a).length * a.bars * a.repeats;
  function clipIdx(S, ti, a, k = 0) {
    const t = S.tracks[ti], ov = Array.isArray(a.clips) ? a.clips[ti] : null;
    if (ov === -1) return -1;
    if (Number.isInteger(ov) && ov >= 0 && ov < t.clips.length) return ov;
    const v = t.cells[secScenes(a)[k] ?? a.scene]; return Number.isInteger(v) && v >= 0 ? v : -1;
  }
  const clipEmpty = c => !c || (!c.notes.length && !c.cc.length && !c.auto.length);
  const isDrums = t => t.type === 'drums';
  function emptyProject(S) { return S.tracks.every(t => t.clips.every(clipEmpty)); }

  // ---- analyse
  function trackRoles(S, arr) {
    const info = S.tracks.map((t, ti) => {
      const used = new Map();
      arr.forEach(a => secScenes(a).forEach((_, k) => { const j = clipIdx(S, ti, a, k); if (j >= 0 && !clipEmpty(t.clips[j])) used.set(j, (used.get(j) || 0) + 1); }));
      let n = 0, sum = 0, starts = 0, groups = 0;
      used.forEach((_, j) => { const c = t.clips[j], by = new Map(); c.notes.forEach(x => { n++; sum += num(x.note, 60) + (isDrums(t) ? 0 : num(t.transpose, 0)); const s = Math.floor(num(x.step, 0)); by.set(s, (by.get(s) || 0) + 1); }); by.forEach(v => { starts += v; groups++; }); });
      return { index: ti, name: typeof t.name === 'string' ? t.name : '', type: t.type, mute: !!t.mute, notes: n, meanPitch: n ? sum / n : 0, poly: groups ? starts / groups : 0, used: used.size, role: isDrums(t) ? 'drums' : '' };
    });
    const mel = info.filter(i => i.type !== 'drums' && i.notes > 0);
    mel.forEach(i => {
      if (/bass|bas\b/i.test(i.name)) i.role = 'bass';
      else if (/lead|melod|arp|hook|solo/i.test(i.name)) i.role = 'lead';
      else if (/chord|key|pad|piano|stab|organ/i.test(i.name) || i.type === 'drone') i.role = 'chords';
    });
    mel.filter(i => !i.role).forEach(i => { i.role = i.meanPitch < 52 ? 'bass' : i.poly >= 2.2 ? 'chords' : 'lead'; });
    if (!mel.some(i => i.role === 'bass')) { const low = mel.filter(i => i.role !== 'bass').sort((a, b) => a.meanPitch - b.meanPitch)[0]; if (low && low.meanPitch < 60) low.role = 'bass'; }
    info.forEach(i => { if (!i.role) i.role = 'none'; });
    return info;
  }
  function detectKey(S, arr, roles) {
    const h = new Array(12).fill(0);
    arr.forEach(a => { const sb = secBars(a); S.tracks.forEach((t, ti) => { if (isDrums(t) || t.mute || roles[ti].role === 'none') return; secScenes(a).forEach((_, k) => { const j = clipIdx(S, ti, a, k); if (j < 0) return; const c = t.clips[j], reps = Math.max(1, sb / secScenes(a).length / c.bars);
      c.notes.forEach(x => { h[mod12(num(x.note, 60) + num(t.transpose, 0))] += Math.min(num(x.len, 1), c.bars * 16) * Math.max(.05, num(x.vel, .8)) * reps; }); }); }); });
    const total = h.reduce((p, v) => p + v, 0); if (total <= 0) return null;
    const corr = (x, y) => { const n = x.length, mx = x.reduce((p, v) => p + v, 0) / n, my = y.reduce((p, v) => p + v, 0) / n; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; } return sx && sy ? sxy / Math.sqrt(sx * sy) : 0; };
    const res = [];
    for (let tonic = 0; tonic < 12; tonic++) ['major', 'minor'].forEach(mode => res.push({ tonic, mode, r: corr(h.map((_, i) => h[mod12(i + tonic)]), KS[mode]) }));
    res.sort((a, b) => b.r - a.r);
    const rel = res.find(x => x.mode !== res[0].mode && mod12(x.tonic - res[0].tonic) === (res[0].mode === 'major' ? 9 : 3));
    return { tonic: res[0].tonic, mode: res[0].mode, name: NOTE_NAMES[res[0].tonic] + (res[0].mode === 'minor' ? 'm' : ''), conf: Math.max(0, res[0].r - res[1].r), r: res[0].r, relative: rel ? NOTE_NAMES[rel.tonic] + (rel.mode === 'minor' ? 'm' : '') : '' };
  }
  const TPL = [{ q: '', iv: [0, 4, 7] }, { q: 'm', iv: [0, 3, 7] }, { q: 'dim', iv: [0, 3, 6] }, { q: 'sus4', iv: [0, 5, 7] }, { q: '7', iv: [0, 4, 7, 10] }, { q: 'm7', iv: [0, 3, 7, 10] }, { q: 'maj7', iv: [0, 4, 7, 11] }];
  function matchChord(w, bassPc) {
    const total = w.reduce((p, v) => p + v, 0); if (total <= 0) return null; const mx = Math.max(...w); let best = null;
    for (let root = 0; root < 12; root++) TPL.forEach(t => {
      const inS = t.iv.reduce((p, i) => p + w[(root + i) % 12], 0), present = t.iv.filter(i => w[(root + i) % 12] >= .12 * mx).length; if (present < 2) return;
      let score = inS / total - .6 * (total - inS) / total + (bassPc === root ? .15 : 0) - (t.iv.length === 4 ? (present === 4 ? 0 : .08) : 0) - (present < t.iv.length ? .12 : 0);
      if (!best || score > best.score) best = { root, q: t.q, score };
    });
    return best;
  }
  const ROMAN = { major: ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'], minor: ['I', 'bII', 'II', 'III', '#III', 'IV', 'bV', 'V', 'VI', '#VI', 'VII', '#VII'] };
  function romanOf(root, q, key) { const d = key ? mod12(root - key.tonic) : root; let r = ROMAN[key && key.mode === 'minor' ? 'minor' : 'major'][d]; if (/^(m|dim)/.test(q)) r = r.toLowerCase(); return r + (q === 'dim' ? '°' : q === '7' ? '7' : q === 'm7' ? '7' : q === 'maj7' ? 'maj7' : q === 'sus4' ? 'sus4' : ''); }
  function chordsOf(S, a, roles, key) {
    const bars = Math.min(16, Math.max(1, ...S.tracks.map((t, ti) => { const j = clipIdx(S, ti, a); return j >= 0 && !isDrums(t) ? S.tracks[ti].clips[j].bars : 1; })));
    const out = [], wt = { bass: 1.5, chords: 1, lead: .4, none: 0, drums: 0 };
    for (let b = 0; b < bars; b++) {
      const w = new Array(12).fill(0); let lowest = 999, lowPc = -1;
      S.tracks.forEach((t, ti) => { if (isDrums(t) || t.mute) return; const j = clipIdx(S, ti, a); if (j < 0) return; const c = t.clips[j], role = roles[ti].role, f = wt[role] ?? 0; if (!f) return; const cb = b % c.bars;
        c.notes.forEach(x => { const s = num(x.step, 0), e = s + num(x.len, 1), lo = cb * 16, hi = lo + 16, ov = Math.min(e, hi) - Math.max(s, lo); if (ov <= 0) return; const m = num(x.note, 60) + num(t.transpose, 0); w[mod12(m)] += ov * Math.max(.05, num(x.vel, .8)) * f; if (role === 'bass' && m < lowest) { lowest = m; lowPc = mod12(m); } }); });
      const m = matchChord(w, lowPc);
      out.push(m ? { bar: b + 1, root: m.root, q: m.q, name: NOTE_NAMES[m.root] + m.q, roman: romanOf(m.root, m.q, key), diatonic: key ? isDiatonic(m.root, m.q, key) : true } : { bar: b + 1, root: -1, q: '', name: '–', roman: '–', diatonic: true });
    }
    return out;
  }
  function isDiatonic(root, q, key) {
    const sc = SCALES[key.mode].map(x => mod12(x + key.tonic)); if (!sc.includes(root)) return false;
    const third = q.startsWith('m') || q === 'dim' ? 3 : 4, fifth = q === 'dim' ? 6 : q === 'sus4' ? 5 : 7;
    if (q === 'sus4') return true;
    const ok3 = sc.includes(mod12(root + third)), ok5 = sc.includes(mod12(root + fifth));
    if (ok3 && ok5) return true;
    return key.mode === 'minor' && mod12(root - key.tonic) === 7 && q === '';    // de dominant (V) in mineur mag majeur zijn (harmonisch mineur)
  }
  function energy(S, a, roles) {
    let e = 0, act = 0;
    S.tracks.forEach((t, ti) => { if (t.mute) return; const j = clipIdx(S, ti, a); if (j < 0) return; const c = t.clips[j]; if (clipEmpty(c)) return; act++;
      const per = c.notes.length / c.bars, dens = isDrums(t) ? Math.min(1, per / 12) * .6 : Math.min(1, per / 6), vel = c.notes.length ? c.notes.reduce((p, x) => p + num(x.vel, .8), 0) / c.notes.length : .8;
      e += dens * vel * Math.max(.2, num(t.velocity, 1)); });
    return { e, act };
  }
  function classify(S, arr, secs, roles, scenesNames) {
    const maxE = Math.max(1e-9, ...secs.map(s => s.e)); secs.forEach(s => { s.rel = s.e / maxE; });
    const sceneSeen = new Map(); secs.forEach(s => sceneSeen.set(s.scene, (sceneSeen.get(s.scene) || 0) + 1));
    secs.forEach((s, i) => {
      const nm = (scenesNames[s.scene] || '').toLowerCase(); s.name = scenesNames[s.scene] || ''; s.role = '';
      if (/intro/.test(nm)) s.role = 'intro'; else if (/outro|\bend\b|ending/.test(nm)) s.role = 'outro'; else if (/break/.test(nm)) s.role = 'breakdown'; else if (/chorus|hook|drop|refrein/.test(nm)) s.role = 'chorus'; else if (/verse|couplet/.test(nm)) s.role = 'verse'; else if (/build/.test(nm)) s.role = 'build';
    });
    const top = Math.max(...secs.map(s => s.rel));
    secs.forEach((s, i) => { if (s.role) return;
      if (i === 0 && s.rel < .6 * top / Math.max(top, .01) && secs.length > 2) s.role = 'intro';
      else if (i === secs.length - 1 && secs.length > 2 && (s.rel < .6 || s.bars <= 8) && s.rel < .85) s.role = 'outro';
      else if (s.rel >= .85 && (sceneSeen.get(s.scene) > 1 || s.rel >= .99 || secs.filter(x => x.rel >= .85).length === 1)) s.role = 'chorus';
      else if (i >= Math.floor(secs.length * .5) && s.rel < .6 && i < secs.length - 1) s.role = 'breakdown';
      else s.role = 'verse'; });
    if (!secs.some(s => s.role === 'chorus')) { const m = secs.reduce((p, s) => (s.rel > p.rel ? s : p), secs[0]); if (m) m.role = 'chorus'; }
    return secs;
  }
  function findHook(S, arr, secs, roles) {
    let best = null;
    S.tracks.forEach((t, ti) => { if (isDrums(t) || t.mute || roles[ti].role === 'none' || roles[ti].role === 'bass') return;
      const byClip = new Map(); secs.forEach((s, si) => { const a = arr[si]; const j = clipIdx(S, ti, a); if (j < 0 || clipEmpty(t.clips[j])) return; const r = byClip.get(j) || { chorus: 0, total: 0 }; r.total++; if (s.role === 'chorus') r.chorus++; byClip.set(j, r); });
      byClip.forEach((r, j) => { const c = t.clips[j], pcs = new Set(c.notes.map(x => num(x.note, 60))), mean = c.notes.reduce((p, x) => p + num(x.note, 60), 0) / Math.max(1, c.notes.length), per = c.notes.length / c.bars;
        const mono = roles[ti].role === 'lead' ? 1 : 0, score = r.chorus * 2 + r.total * .5 + Math.min(pcs.size, 8) * .3 + (pcs.size < 3 ? -2 : 0) + mono * 1.5 + (per > 1 && per < 10 ? .5 : -.5) + (mean - 60) / 24;
        if (!best || score > best.score) best = { track: ti, clip: j, name: t.clips[j].name || '', trackName: roles[ti].name, role: roles[ti].role, sections: r.total, inChorus: r.chorus, score }; }); });
    return best;
  }
  const secAt = (secs, bars) => bars * 4 * 60;
  function analyze(S0, o = {}) {
    const S = norm(S0), bpm = Math.max(40, Math.min(200, num(o.bpm, 120))), si = int(o.song, 0, S.songs.length - 1, S.activeSong), arr = S.songs[si].arrangement;
    const roles = trackRoles(S, arr), key = detectKey(S, arr, roles), names = S.scenes.map(s => (s && typeof s.name === 'string' ? s.name : ''));
    let start = 0; const secs = arr.map((a, i) => { const en = energy(S, a, roles), b = secBars(a), s = { index: i, scene: a.scene, bars: b, start, e: en.e, act: en.act, secs: b * 240 / bpm, startSec: start * 240 / bpm }; start += b; return s; });
    classify(S, arr, secs, roles, names);
    const totalBars = start, seconds = totalBars * 240 / bpm, hook = findHook(S, arr, secs, roles);
    const fc = secs.find(s => s.role === 'chorus'), fv = secs.find(s => s.role === 'verse') || secs.find(s => s.role !== 'intro' && s.role !== 'chorus' && s.role !== 'outro') || fc;
    const chords = {}; if (fc) chords.chorus = chordsOf(S, arr[fc.index], roles, key); if (fv && fv !== fc) chords.verse = chordsOf(S, arr[fv.index], roles, key);
    const out = { bpm, song: si, songName: S.songs[si].name || '', tracks: roles, sections: secs, key, chords, hook, totalBars, seconds, empty: secs.every(s => s.act === 0) };
    out.profile = o.profile === 'club' ? 'club' : 'pop'; out.findings = findings(out, S, arr, out.profile); out.score = score(out.findings);
    return out;
  }
  const FW = { tempo: 1, dur: 2, bars4: 1, chorus1: 3, intro: 1, breakdown: 1, final: 1, outro: 1, hook: 2, diatonic: 1 };
  const PROFILE = { pop: { dur: MAX_SECONDS, chorus1: 50, intro: 20, bpmLo: 85, bpmHi: 135, bars: 4 }, club: { dur: 420, chorus1: 120, intro: 45, bpmLo: 110, bpmHi: 135, bars: 8 } };
  function findings(an, S, arr, profile) {
    const f = [], add = (id, ok, a) => f.push({ id, ok, a: a || [] }), secs = an.sections, bpm = an.bpm, P = PROFILE[profile] || PROFILE.pop;
    if (an.empty) return [{ id: 'empty', ok: false, a: [] }];
    add('tempo', bpm > P.bpmHi ? false : bpm < P.bpmLo ? null : true, [Math.round(bpm)]);
    add('dur', an.seconds <= P.dur, [Math.round(an.seconds), P.dur]);
    const odd = secs.filter(s => s.bars % P.bars !== 0 || arr[s.index].bars % P.bars !== 0); add('bars4', odd.length === 0, [odd.map(s => s.index + 1).join(', '), P.bars]);
    const fc = secs.find(s => s.role === 'chorus'); add('chorus1', fc ? fc.startSec <= P.chorus1 : false, [fc ? Math.round(fc.startSec) : -1, P.chorus1]);
    const intro = secs.find(s => s.role === 'intro'); add('intro', intro ? intro.secs <= P.intro : true, [intro ? Math.round(intro.secs) : 0, P.intro]);
    const chs = secs.filter(s => s.role === 'chorus'), lastCh = chs[chs.length - 1], firstCh = chs[0];
    const bk = secs.some(s => s.role === 'breakdown' && firstCh && s.index > firstCh.index && lastCh && s.index < lastCh.index); add('breakdown', bk ? true : null, []);
    add('final', lastCh && chs.length > 1 ? lastCh.bars >= 1.5 * Math.min(...chs.map(c => c.bars)) : null, []);
    const last = secs[secs.length - 1]; add('outro', last && (last.role === 'outro' || last.rel < .6) ? true : null, []);
    add('hook', an.hook ? an.hook.sections >= 2 : false, [an.hook ? an.hook.track + 1 : 0]);
    const cs = Object.values(an.chords).flat().filter(c => c.root >= 0); add('diatonic', cs.length ? cs.filter(c => c.diatonic).length / cs.length >= .85 : null, [cs.filter(c => !c.diatonic).map(c => c.name).join(', ')]);
    return f;
  }
  function score(f) { let got = 0, all = 0; f.forEach(x => { const w = FW[x.id]; if (!w || x.ok == null) return; all += w; if (x.ok) got += w; }); return all ? Math.round(100 * got / all) : 0; }

  // ---- bouwen: scènes en clips in een kopie van het project
  function Builder(S, an) {
    const B = { S, an, warns: [], lines: [], madeScenes: 0, madeClips: 0, gen: new Map() };
    const warn = (k, ...a) => B.warns.push({ k, a });
    B.warn = warn;
    B.drumTrack = S.tracks.findIndex(isDrums);
    const refd = ti => { const u = new Set(S.tracks[ti].cells.filter(v => v >= 0)); S.songs.forEach(g => g.arrangement.forEach(a => { const v = a.clips && a.clips[ti]; if (Number.isInteger(v) && v >= 0) u.add(v); })); return u; };
    B.addClip = (ti, clip) => {
      const t = S.tracks[ti], used = refd(ti); let j = t.clips.findIndex((c, k) => clipEmpty(c) && !used.has(k));
      if (j < 0) { if (t.clips.length >= CAP.clips) { warn('clipsfull', ti + 1); return -1; } j = t.clips.length; t.clips.push(null); }
      clip.name = String(clip.name || 'Clip').slice(0, 32); clip.bars = int(clip.bars, 1, 64, 1); clip.cc = clip.cc || []; clip.auto = clip.auto || [];
      t.clips[j] = clip; B.madeClips++; return j;
    };
    B.sceneFor = (cells, name) => {
      const nm = String(name || '').slice(0, 24).toLowerCase(), same = S.scenes.findIndex((sc, j) => String((sc && sc.name) || '').toLowerCase() === nm && S.tracks.every((t, ti) => (t.cells[j] ?? -1) === (cells[ti] ?? -1)));
      if (same >= 0) return same;
      if (S.scenes.length >= CAP.scenes) { warn('scenesfull'); return -1; }
      S.scenes.push({ name: String(name || '').slice(0, 24) }); S.tracks.forEach((t, ti) => t.cells.push(cells[ti] ?? -1)); B.madeScenes++; return S.scenes.length - 1;
    };
    return B;
  }
  const keepAll = () => true;
  function cellsFrom(B, a, keep, over) {
    const S = B.S; return S.tracks.map((t, ti) => { if (over && over[ti] !== undefined) return over[ti]; const r = B.an.tracks[ti] ? B.an.tracks[ti].role : 'none'; if (!keep(r, ti)) return -1; return clipIdx(S, ti, a); });
  }
  const ROLE_NAMES = { en: { intro: 'Intro', verse: 'Verse', chorus: 'Chorus', breakdown: 'Breakdown', build: 'Build-up', drop: 'Drop', outro: 'Outro', djin: 'DJ intro', djout: 'DJ outro', groove: 'Groove' },
    nl: { intro: 'Intro', verse: 'Couplet', chorus: 'Refrein', breakdown: 'Breakdown', build: 'Opbouw', drop: 'Drop', outro: 'Outro', djin: 'DJ-intro', djout: 'DJ-outro', groove: 'Groove' } };
  let ROLE_NAME = ROLE_NAMES.en;

  // slagwerk dat de remix zelf maakt
  function drumRow(B, name) { const t = B.S.tracks[B.drumTrack], rows = Array.isArray(t.rows) ? t.rows : null; if (!rows || !rows.length) return { row: DRUM_DEFAULT_ROW[name], note: DRUM_NOTE[name] }; const r = rows.findIndex(x => x && x.note === DRUM_NOTE[name]); return r >= 0 ? { row: r, note: DRUM_NOTE[name] } : null; }
  function drumClip(B, kind, pat, name, bars) {
    const key = kind + ':' + name; if (B.gen.has(key)) return B.gen.get(key);
    if (B.drumTrack < 0) { B.warn('nodrums'); return undefined; }
    const notes = []; let id = 1; bars = bars || 1;
    const hit = (lane, step, vel, bar) => { const d = drumRow(B, lane); if (!d) return; notes.push({ id: id++, step: bar * 16 + step, note: d.note, len: 1, vel, prob: 1, ratchet: 1, row: d.row }); };
    for (let b = 0; b < bars; b++) {
      if (kind === 'kick') { [0, 4, 8, 12].forEach(s => hit('kick', s, s === 0 ? .95 : .85, b)); }
      else if (kind === 'break') { [0, 4, 8, 12].forEach(s => hit('chh', s, .5, b)); }
      else if (kind === 'build') {
        [0, 4, 8, 12].forEach(s => hit('kick', s, .9, b));
        const dens = b < bars / 2 ? [4, 12] : b < bars - 1 ? [4, 8, 12, 14] : [0, 2, 4, 6, 8, 10, 12, 13, 14, 15];
        dens.forEach(s => hit('clap', s, Math.min(1, .55 + .45 * (b + 1) / bars), b)); if (b < bars - 1) [2, 6, 10, 14].forEach(s => hit('chh', s, .55, b));
      } else {
        Object.keys(pat).forEach(lane => pat[lane].forEach(s => hit(lane, s, lane === 'chh' ? (s % 4 === 0 ? .65 : .45) : lane === 'kick' ? (s === 0 ? .95 : .85) : .85, b)));
        if (kind === 'chorus') { if (b === 0) hit('crash', 0, .8, b); if (b === bars - 1) [12, 13, 14, 15].forEach((s, k) => hit('snare', s, .6 + .1 * k, b)); }
      }
    }
    const j = B.addClip(B.drumTrack, { name, bars, notes }); B.gen.set(key, j >= 0 ? j : undefined); return j >= 0 ? j : undefined;
  }
  const HOUSE = STYLES.house.drums;

  // plan -> scènes en een arrangement
  function fitPlan(plan, bpm) { const total = () => plan.reduce((p, b) => p + b.bars * b.repeats, 0) * 240 / bpm; let i = 0; while (total() > MAX_SECONDS && i++ < 6) { const big = plan.filter(b => b.shrink && b.bars * b.repeats > 4).sort((a, b) => b.bars * b.repeats - a.bars * a.repeats)[0]; if (!big) break; if (big.repeats > 1) big.repeats = Math.max(1, big.repeats - 1); else big.bars = Math.max(4, Math.ceil(big.bars / 2 / 4) * 4); } return total(); }
  function commit(B, plan, name) {
    const S = B.S, arr = []; B.fitSeconds = fitPlan(plan, B.bpm);
    plan.forEach(b => { const sc = b.cells ? B.sceneFor(b.cells, ROLE_NAME[b.role] || b.role) : b.scene; if (sc === undefined || sc < 0) { B.warn('skipblock', ROLE_NAME[b.role] || b.role); return; }
      if (arr.length >= CAP.arr) { B.warn('arrfull'); return; } arr.push({ scene: sc, bars: int(b.bars, 1, 64, 4), repeats: int(b.repeats, 1, 16, 1) }); });
    if (!arr.length) return false;
    if (S.songs.length >= CAP.songs) { B.warn('songsfull'); return false; }
    S.songs.push({ name: String(name).slice(0, 24), arrangement: arr }); S.activeSong = S.songs.length - 1; S.arrangement = arr; S.mode = 'song'; S.selectedSection = 0; return true;
  }
  const only = (...r) => (role => r.includes(role)), not = (...r) => (role => !r.includes(role));

  // recept: hit-versie (gouden volgorde: intro, couplet, refrein, couplet, refrein, breakdown, dubbel refrein, outro) en radio-versie
  function planHit(B, an, S, arr, o) {
    const secs = an.sections, ch = secs.filter(s => s.role === 'chorus').sort((a, b) => b.rel - a.rel)[0] || secs[0];
    const vs = secs.find(s => s.role === 'verse') || secs.find(s => s !== ch && s.role !== 'intro' && s.role !== 'outro') || ch;
    const bk = secs.find(s => s.role === 'breakdown'), A = i => arr[i.index];
    const radio = o.recipe === 'radio', sz = radio ? { intro: 2, verse: 8, chorus: 8, brk: 8, final: 8, outro: 2, v2: 8 } : { intro: 4, verse: 16, chorus: 8, brk: 8, final: 8, outro: 4, v2: 16 };
    const hookTi = an.hook ? an.hook.track : -1, leadRoles = r => r !== 'lead' || false;
    const dr = o.drums === 'club' ? drumClip(B, 'groove', HOUSE, 'Groove ' + NOTE_NAMES[0] + '4', 1) : undefined, over = dr !== undefined ? { [B.drumTrack]: dr } : undefined;
    const plan = [];
    plan.push({ role: 'intro', cells: cellsFrom(B, A(ch), (r, ti) => ti !== hookTi && r !== 'none', over), bars: sz.intro, repeats: 1 });
    plan.push({ role: 'verse', cells: cellsFrom(B, A(vs), keepAll, over), bars: Math.min(sz.verse, Math.max(4, vs.bars)), repeats: 1, shrink: true });
    plan.push({ role: 'chorus', cells: cellsFrom(B, A(ch), keepAll, over), bars: sz.chorus, repeats: 1 });
    plan.push({ role: 'verse', cells: cellsFrom(B, A(vs), keepAll, over), bars: Math.min(sz.v2, Math.max(4, vs.bars)), repeats: 1, shrink: true });
    plan.push({ role: 'chorus', cells: cellsFrom(B, A(ch), keepAll, over), bars: sz.chorus, repeats: 1 });
    const bkSrc = bk || vs;
    plan.push({ role: 'breakdown', cells: cellsFrom(B, A(bkSrc), (r, ti) => bk ? r !== 'none' : r === 'bass' || r === 'chords', undefined), bars: sz.brk, repeats: 1 });
    plan.push({ role: 'chorus', cells: cellsFrom(B, A(ch), keepAll, over), bars: sz.final, repeats: 2, shrink: true });
    plan.push({ role: 'outro', cells: cellsFrom(B, A(ch), (r, ti) => ti !== hookTi && r !== 'none', over), bars: sz.outro, repeats: 1 });
    B.lines.push({ k: 'src', a: [ch.index + 1, vs.index + 1] });
    return { plan, name: (radio ? 'Radio ' : 'Hit ') + (an.songName || '') };
  }
  function planClub(B, an, S, arr, o) {
    const secs = an.sections, ch = secs.filter(s => s.role === 'chorus').sort((a, b) => b.rel - a.rel)[0] || secs[0];
    const vs = secs.find(s => s.role === 'verse') || secs.find(s => s !== ch && s.role !== 'intro' && s.role !== 'outro') || ch, A = i => arr[i.index], hookTi = an.hook ? an.hook.track : -1;
    if (B.drumTrack < 0) { B.warn('nodrums'); return null; }
    const kick = drumClip(B, 'kick', null, 'DJ kick', 1), grv = drumClip(B, 'groove', HOUSE, 'Club groove', 1), bld = drumClip(B, 'build', null, 'Build-up', 8), brk = drumClip(B, 'break', null, 'Break hats', 1);
    const dj = { [B.drumTrack]: kick }, onlyDrums = S.tracks.map((_, ti) => (ti === B.drumTrack ? kick : -1));
    const withDr = (a, keep, d) => cellsFrom(B, a, keep, { [B.drumTrack]: d });
    const plan = [
      { role: 'djin', cells: onlyDrums, bars: 16, repeats: 1 },
      { role: 'groove', cells: withDr(A(vs), only('bass'), grv), bars: 16, repeats: 1 },
      { role: 'verse', cells: withDr(A(vs), keepAll, grv), bars: 16, repeats: 1 },
      { role: 'build', cells: withDr(A(vs), not('lead'), bld), bars: 8, repeats: 1 },
      { role: 'drop', cells: withDr(A(ch), keepAll, grv), bars: 16, repeats: 2 },
      { role: 'breakdown', cells: withDr(A(ch), not('bass'), brk), bars: 16, repeats: 1 },
      { role: 'build', cells: withDr(A(vs), not('lead'), bld), bars: 8, repeats: 1 },
      { role: 'drop', cells: withDr(A(ch), keepAll, grv), bars: 16, repeats: 2 },
      { role: 'outro', cells: withDr(A(vs), only('bass', 'chords'), grv), bars: 16, repeats: 1 },
      { role: 'djout', cells: onlyDrums, bars: 16, repeats: 1 },
    ];
    B.lines.push({ k: 'src', a: [ch.index + 1, vs.index + 1] });
    return { plan, name: 'Club ' + (an.songName || '') };
  }

  // recept: tempo-flip (verdubbelen of halveren van de cliplengtes, zodat het bij het nieuwe tempo gelijk klinkt)
  function scaleClip(c, f) {
    const o = clone(c); delete o.span; let lost = 0; o.bars = int(c.bars * f, 1, 64, 1);
    o.notes = c.notes.map(x => { const s = q4(num(x.step, 0) * f), l = Math.max(.25, q4(num(x.len, 1) * f)); if (f < 1 && (num(x.step, 0) * f * 4) % 1 !== 0) lost++; return { ...x, step: Math.min(s, o.bars * 16 - .25), len: Math.min(l, 1024) }; });
    const seen = new Set(); o.notes = o.notes.filter(x => { const k = x.step + ':' + x.note + ':' + (x.row ?? ''); if (seen.has(k)) { lost++; return false; } seen.add(k); return true; });
    o.cc = (c.cc || []).map(l => ({ ...l, points: (l.points || []).map(p => ({ ...p, step: Math.min(o.bars * 16 - 1, Math.round(num(p.step, 0) * f)) })) }));
    o.auto = (c.auto || []).map(l => ({ ...l, points: (l.points || []).map(p => ({ ...p, step: Math.min(o.bars * 16 - .25, q4(num(p.step, 0) * f)) })) }));
    return { clip: o, lost };
  }
  function planFlip(B, an, S, arr, o) {
    const target = Math.max(40, Math.min(200, num(o.targetBpm, 128))), ratio = target / B.bpm, f = ratio >= 1.5 ? 2 : ratio <= .67 ? .5 : 1;
    B.factor = f; B.lines.push({ k: 'flip', a: [Math.round(B.bpm), Math.round(target), f] });
    const memo = new Map(), plan = []; let lost = 0, spans = 0;
    const copyOf = (ti, j) => { const key = ti + ':' + j; if (memo.has(key)) return memo.get(key); if (f === 1) { memo.set(key, j); return j; }
      const src = S.tracks[ti].clips[j]; if (src.span) spans++; if (f === .5 && src.bars < 2) { B.warn('tooshort', ti + 1, j + 1); memo.set(key, j); return j; }
      const r = scaleClip(src, f); lost += r.lost; r.clip.name = (src.name || 'Clip') + (f === 2 ? ' ×2' : ' ÷2'); const nj = B.addClip(ti, r.clip); memo.set(key, nj >= 0 ? nj : j); return nj >= 0 ? nj : j; };
    arr.forEach((a, i) => { const k0 = secScenes(a); const cells = S.tracks.map((t, ti) => { const j = clipIdx(S, ti, a); return j < 0 ? -1 : (o.noDrums && isDrums(t) ? j : copyOf(ti, j)); });
      const bars = f === 2 ? a.bars * 2 : f === .5 ? Math.max(1, Math.ceil(a.bars / 2)) : a.bars; if (bars > 64) B.warn('toolong', i + 1);
      plan.push({ role: (an.sections[i] && an.sections[i].role) || 'verse', cells, bars: Math.min(64, bars), repeats: a.repeats, scenesName: S.scenes[a.scene] && S.scenes[a.scene].name }); });
    plan.forEach(p => { if (p.scenesName) p.role = p.scenesName; });
    if (spans) B.warn('span', spans); if (lost) B.warn('lost', lost);
    B.targetBpm = target; B.noFit = true;
    return { plan, name: 'Flip ' + Math.round(target) + ' BPM' };
  }

  // recept: nieuwe song uit een stijl
  function nearest(lad, m) { let b = 0; for (let i = 1; i < lad.length; i++) if (Math.abs(lad[i] - m) < Math.abs(lad[b] - m)) b = i; return b; }
  function voice(prev, pcs) {
    let best = null; const cand = [];
    for (let base = 55; base <= 64; base++) if (pcs.includes(base % 12)) { for (let inv = 0; inv < 3; inv++) { const order = [0, 1, 2].map(i => pcs[(i + inv) % 3]); const v = []; let last = base - 1; order.forEach(pc => { let m = last + 1; while (m % 12 !== pc) m++; v.push(m); last = m; }); cand.push(v); } }
    cand.forEach(v => { const cost = prev ? v.reduce((p, m, i) => p + Math.abs(m - prev[i]), 0) : Math.abs(v[0] - 60) + Math.abs(v[2] - 67); if (!best || cost < best.cost) best = { v, cost }; });
    return best ? best.v : [60, 64, 67];
  }
  function chordPcs(tonic, mode, d) { const sc = SCALES[mode].map(x => mod12(x + tonic)); return [sc[d % 7], sc[(d + 2) % 7], sc[(d + 4) % 7]]; }
  function chordNotes(tonic, mode, prog, rhythm) {
    const notes = []; let prev = null, id = 1;
    prog.forEach((d, b) => { const v = voice(prev, chordPcs(tonic, mode, d)); prev = v; rhythm.forEach(([s, l]) => v.forEach(m => notes.push({ id: id++, step: b * 16 + s, note: m, len: Math.min(l, 16 - s), vel: .7, prob: 1 }))); });
    return notes;
  }
  function bassNotes(tonic, mode, prog, pattern) {
    const sc = SCALES[mode], notes = []; let id = 1;
    prog.forEach((d, b) => { const root = 36 + mod12(tonic + sc[d % 7]); pattern.forEach(([s, l, off], k) => notes.push({ id: id++, step: b * 16 + s, note: root + off, len: l, vel: s === 0 ? .95 : .8, prob: 1 })); });
    return notes;
  }
  const RHYTHMS = [[[0, 3], [4, 2], [8, 3], [12, 4]], [[0, 2], [2, 2], [4, 4], [10, 2], [12, 4]], [[0, 4], [6, 2], [8, 2], [12, 2], [14, 2]], [[0, 1], [2, 2], [5, 3], [8, 4], [14, 2]]];
  function hookNotes(rand, tonic, mode, prog) {
    const sc = SCALES[mode].map(x => mod12(x + tonic)), lad = []; for (let m = 62; m <= 86; m++) if (sc.includes(m % 12)) lad.push(m);
    const ctIdx = (i, d) => { const ct = chordPcs(tonic, mode, d); let b = i; for (let k = 0; k <= 4; k++) for (const s of [i - k, i + k]) if (s >= 0 && s < lad.length && ct.includes(lad[s] % 12) && (b === i && !ct.includes(lad[i] % 12) || Math.abs(s - i) < Math.abs(b - i) && !ct.includes(lad[b] % 12))) b = s; return b; };
    const center = nearest(lad, 74), r1 = Math.floor(rand() * RHYTHMS.length); let r2 = Math.floor(rand() * RHYTHMS.length); if (r2 === r1) r2 = (r2 + 1) % RHYTHMS.length;
    const rh = [RHYTHMS[r1], RHYTHMS[r2]], idxs = [[], []]; let i = ctIdx(center, prog[0]);
    for (let b = 0; b < 2; b++) rh[b].forEach(([s], k) => { if (b === 0 && k === 0) { idxs[b].push(i); return; } if (k === 0) i = ctIdx(i, prog[b]); else { const pull = i > center + 4 ? -1 : i < center - 4 ? 1 : 0, opts = [-2, -1, -1, 0, 1, 1, 2]; let d = opts[Math.floor(rand() * opts.length)]; if (pull && rand() < .6) d = pull * Math.abs(d || 1); i = Math.max(0, Math.min(lad.length - 1, i + d)); } idxs[b].push(i); });
    const seq = [idxs[0], idxs[1], idxs[0].map(x => Math.max(0, x - 1)), idxs[1].slice()];
    seq[2][0] = ctIdx(seq[2][0], prog[2]); seq[3][0] = ctIdx(seq[3][0], prog[3]);
    const tIdx = nearest(lad.filter(m => m % 12 === tonic % 12 || m % 12 === mod12(tonic)), lad[seq[3][seq[3].length - 1]]); const tonicMidi = lad.filter(m => m % 12 === mod12(tonic))[tIdx] ?? lad[center];
    const notes = []; let id = 1;
    for (let b = 0; b < 4; b++) rh[b % 2].forEach(([s, l], k) => { const last = b === 3 && k === rh[1].length - 1; notes.push({ id: id++, step: b * 16 + s, note: last ? tonicMidi : lad[seq[b][k]], len: last ? Math.min(16 - s, 8) : l, vel: s === 0 ? .95 : .82, prob: 1 }); });
    return notes;
  }
  function planNew(B, an, S, arr, o) {
    const st = STYLES[o.style] || STYLES.house, tonic = Number.isInteger(o.tonic) && o.tonic >= 0 ? mod12(o.tonic) : st.tonic, mode = o.mode === 'major' || o.mode === 'minor' ? o.mode : st.mode, rand = rng(int(o.seed, 0, 999999, 1) * 7919 + 17);
    B.bpm = st.bpm; B.targetBpm = st.bpm; B.noFit = false;
    const roleTrack = {}; const tr = S.tracks;
    if (B.drumTrack >= 0) roleTrack.drums = B.drumTrack;
    const mel = tr.map((t, i) => i).filter(i => !isDrums(tr[i]));
    const pick = (re, role) => { const i = mel.find(k => re.test(String(tr[k].name || '')) && !Object.values(roleTrack).includes(k)); if (i !== undefined) roleTrack[role] = i; };
    pick(/bass|bas\b/i, 'bass'); pick(/chord|key|pad|piano|stab|organ/i, 'chords'); pick(/lead|melod|arp|hook/i, 'lead');
    ['bass', 'chords', 'lead'].forEach(r => { if (roleTrack[r] === undefined) { const i = mel.find(k => !Object.values(roleTrack).includes(k)); if (i !== undefined) roleTrack[r] = i; } });
    ['drums', 'bass', 'chords'].forEach(r => { if (roleTrack[r] === undefined) B.warn('norole', r); });
    const notesBlank = () => ({ notes: [] });
    const mk = (role, name, bars, notes) => { const ti = roleTrack[role]; if (ti === undefined || !notes) return undefined; const j = B.addClip(ti, { name, bars, notes }); return j >= 0 ? j : undefined; };
    const cl = {};
    const pv = st.prog.verse, pc = st.prog.chorus;
    cl.chordsV = mk('chords', 'Chords verse', 4, chordNotes(tonic, mode, pv, st.chords)); cl.chordsC = mk('chords', 'Chords chorus', 4, chordNotes(tonic, mode, pc, st.chords));
    cl.bassV = mk('bass', 'Bass verse', 4, bassNotes(tonic, mode, pv, st.bass)); cl.bassC = mk('bass', 'Bass chorus', 4, bassNotes(tonic, mode, pc, st.bass));
    cl.lead = mk('lead', 'Hook', 4, hookNotes(rand, tonic, mode, pc));
    // slagwerk: intro/outro alleen kick en hats, couplet de stijl, refrein plus open hat en crash
    const base = st.drums, light = { kick: base.kick, chh: base.chh && base.chh.length ? base.chh.filter((_, k) => k % 2 === 0) : [] }, verse = { ...base }, chorus = { ...base };
    delete verse.ohh; if (!chorus.ohh) chorus.ohh = [2, 6, 10, 14];
    const dcl = {};
    if (roleTrack.drums !== undefined) { B.drumTrack = roleTrack.drums;
      dcl.intro = drumClip(B, 'groove', light, 'Drums intro', 4); dcl.verse = drumClip(B, 'groove', verse, 'Drums verse', 4); dcl.chorus = drumClip(B, 'chorus', chorus, 'Drums chorus', 4); dcl.brk = drumClip(B, 'break', null, 'Drums break', 1); }
    const cells = (d, bass, chords, lead) => S.tracks.map((t, ti) => ti === roleTrack.drums ? (d ?? -1) : ti === roleTrack.bass ? (bass ?? -1) : ti === roleTrack.chords ? (chords ?? -1) : ti === roleTrack.lead ? (lead ?? -1) : -1);
    const sc = {
      intro: cells(dcl.intro, undefined, cl.chordsC, undefined), verse: cells(dcl.verse, cl.bassV, cl.chordsV, undefined), chorus: cells(dcl.chorus, cl.bassC, cl.chordsC, cl.lead),
      brk: cells(dcl.brk, cl.bassV, cl.chordsV, undefined), outro: cells(dcl.intro, undefined, cl.chordsC, undefined) };
    const plan = [
      { role: 'intro', cells: sc.intro, bars: 4, repeats: 1 }, { role: 'verse', cells: sc.verse, bars: 16, repeats: 1, shrink: true }, { role: 'chorus', cells: sc.chorus, bars: 8, repeats: 1 },
      { role: 'verse', cells: sc.verse, bars: 16, repeats: 1, shrink: true }, { role: 'chorus', cells: sc.chorus, bars: 8, repeats: 1 }, { role: 'breakdown', cells: sc.brk, bars: 8, repeats: 1 },
      { role: 'chorus', cells: sc.chorus, bars: 8, repeats: 2, shrink: true }, { role: 'outro', cells: sc.outro, bars: 4, repeats: 1 }];
    B.lines.push({ k: 'style', a: [o.style, NOTE_NAMES[tonic] + (mode === 'minor' ? 'm' : ''), st.bpm] });
    B.newInfo = { tonic, mode, bpm: st.bpm };
    return { plan, name: ({ house: 'House', pop: 'Pop', hiphop: 'Hip-hop', disco: 'Disco', synthwave: 'Synthwave' }[o.style] || 'New') + ' ' + NOTE_NAMES[tonic] + (mode === 'minor' ? 'm' : '') };
  }
  function setupNew(S, o) {
    // een leeg project krijgt vier sporen met rollen; een project met inhoud houdt zijn sporen en krijgt de song erbij
    if (!emptyProject(S)) return;
    const names = [['Drums', 'drums'], ['Bass', 'notes'], ['Chords', 'notes'], ['Lead', 'notes']];
    names.forEach(([n, ty], i) => { if (!S.tracks[i]) S.tracks[i] = { name: n, type: ty, clips: [], cells: [] }; const t = S.tracks[i]; t.name = n; t.type = ty; t.mute = false; t.solo = false; });
    S.tracks.forEach(t => { t.clips = Array.from({ length: 8 }, (_, j) => ({ name: 'Clip ' + (j + 1), bars: 1, notes: [], cc: [], auto: [] })); t.cells = []; });
    S.scenes = []; S.songs = [{ name: '', arrangement: [{ scene: 0, bars: 4, repeats: 1 }] }]; S.activeSong = 0;
    S.freshProject = true;
  }

  // ---- bouwen
  function build(S0, o = {}) {
    const recipe = ['hit', 'radio', 'club', 'flip', 'new'].includes(o.recipe) ? o.recipe : 'hit', bpm = Math.max(40, Math.min(200, num(o.bpm, 120)));
    const S = norm(S0); ROLE_NAME = ROLE_NAMES[o.lang === 'nl' ? 'nl' : 'en'];
    if (!S.tracks.length) return { ok: false, err: { k: 'notracks', a: [] } };
    if (recipe === 'new') setupNew(S, o);
    const an = recipe === 'new' ? null : analyze(S, { song: o.song, bpm });
    if (recipe !== 'new' && an.empty) return { ok: false, err: { k: 'emptysong', a: [] } };
    const arr = recipe === 'new' ? [] : S.songs[an.song].arrangement, B = Builder(S, an || { tracks: [], sections: [], hook: null, songName: '' }); B.bpm = bpm;
    let r;
    if (recipe === 'hit' || recipe === 'radio') r = planHit(B, an, S, arr, { ...o, recipe });
    else if (recipe === 'club') r = planClub(B, an, S, arr, o);
    else if (recipe === 'flip') r = planFlip(B, an, S, arr, o);
    else r = planNew(B, null, S, arr, o);
    if (!r) return { ok: false, err: B.warns[0] || { k: 'failed', a: [] } };
    if (S.songs.length >= CAP.songs) return { ok: false, err: { k: 'songsfull', a: [] } };
    if (B.noFit) { /* flip: dezelfde lengte in tijd, niet inkorten */ B.fitSeconds = null; r.plan.forEach(p => { delete p.shrink; }); }
    const ok = commit(B, r.plan, r.name);
    if (!ok) return { ok: false, err: B.warns[B.warns.length - 1] || { k: 'failed', a: [] } };
    if (S.freshProject) { delete S.freshProject; if (!S.title) S.title = r.name.slice(0, 64); }
    const newBpm = B.targetBpm || (B.newInfo && B.newInfo.bpm) || bpm;
    const after = analyze(S, { song: S.activeSong, bpm: newBpm, profile: recipe === 'club' ? 'club' : 'pop' });
    B.lines.push({ k: 'made', a: [B.madeScenes, B.madeClips, r.plan.length] });
    return { ok: true, state: S, name: r.name, bpm: newBpm, lines: B.lines, warns: B.warns, before: an, after };
  }
  return { analyze, build, norm, STYLES, NOTE_NAMES, SCALES, MAX_SECONDS, matchChord, romanOf };
})();
// </engine>

const mmss = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: {
    about: 'Remix leest de song van een Clip Arranger, analyseert toonsoort, akkoorden, secties en hook, en zet een remix als extra song in dezelfde Clip Arranger. De eerste song blijft staan; met Herstel zet je alles terug.\n\nHet werkt op noten en clips, niet op audio, en kan niet horen hoe het klinkt. Het kan ook een nieuwe song starten uit een stijl: toonsoort, akkoordgang, bas, drums en een hook als beginpunt.\n\nVolgorde van een hitversie (de klassieke hitformule): intro, couplet, refrein, couplet, refrein, breakdown, dubbel refrein, outro, hooguit 3:30.',
    source: 'Clip Arranger', none: 'geen Clip Arranger op de vloer', song: 'Song', recipe: 'Recept', analyse: 'Analyseer', make: 'Maak remix', undo: 'Herstel', targetBpm: 'Nieuw tempo', style: 'Stijl', key: 'Toonsoort', mode: 'Toonaard', seed: 'Seed', auto: 'volgens stijl',
    major: 'majeur', minor: 'mineur', drums: 'Slagwerk', drumsKeep: 'van de bron', drumsClub: 'club (4 op de vloer)', applyTempo: 'Tempo toepassen',
    recipes: { hit: 'Hit-versie', radio: 'Radio edit', club: 'Club mix', flip: 'Tempo flip', new: 'Nieuwe song' },
    styles: { house: 'House', pop: 'Pop', hiphop: 'Hip-hop', disco: 'Disco', synthwave: 'Synthwave' },
    roles: { intro: 'intro', verse: 'couplet', chorus: 'refrein', breakdown: 'breakdown', build: 'opbouw', outro: 'outro', drums: 'drums', bass: 'bas', chords: 'akkoorden', lead: 'melodie', none: 'leeg' },
    hHeader: 'Analyse', hKey: (n, c, rel) => `Toonsoort ${n}${rel ? ' (relatief ' + rel + ')' : ''}${c < .1 ? ', onzeker' : ''}`, hNoKey: 'Toonsoort onbekend (geen noten)', hTempo: b => `${b} BPM`, hLen: (bars, sec) => `${bars} maten, ${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`,
    hHook: (t, c) => `Hook: spoor ${t}, clip ${c}`, hNoHook: 'Geen hook gevonden', hChords: (w, s) => `Akkoorden ${w}: ${s}`, hScore: n => `Hitscore ${n} van 100`, tracks: 'Sporen', sections: 'Secties',
    noTarget: 'Zet een Clip Arranger op de vloer.', reading: 'Lezen…', needClick: 'De host liet het schrijven niet toe (alleen na een klik).', writeFail: 'Schrijven mislukt.', noHost: 'Deze host is te oud voor Remix (contract v1.35 nodig).', done: 'Klaar: de remix staat als nieuwe song in de Clip Arranger.', restored: 'Hersteld.', nothingUndo: 'Niets om te herstellen.',
    f: {
      empty: () => 'De song bevat geen noten.', tempo: b => b > 135 ? `${b} BPM ligt boven 135: dansbaar tempo is lager.` : b < 85 ? `${b} BPM is langzaam (past bij hip-hop en downtempo).` : `${b} BPM is een dansbaar tempo.`,
      dur: (s, l) => `Duur ${mmss(s)}: ${s <= l ? 'binnen' : 'langer dan'} ${mmss(l)}.`, bars4: (l, m) => l ? `Secties ${l} zijn geen veelvoud van ${m} maten.` : `Alle secties zijn een veelvoud van ${m} maten.`,
      chorus1: (s, l) => s < 0 ? 'Geen refrein gevonden.' : s <= l ? `Eerste refrein na ${s} s: binnen ${l} s.` : `Eerste refrein pas na ${s} s: later dan ${l} s.`, intro: (s, l) => s <= l ? (s ? `Intro ${s} s: kort genoeg.` : 'Geen intro.') : `Intro ${s} s: langer dan ${l} s.`,
      breakdown: () => 'Breakdown tussen de refreinen.', final: () => 'Het laatste refrein is dubbel zo lang.', outro: () => 'De song eindigt met een outro of een rustig slot.', hook: t => `De hook (spoor ${t}) komt in meerdere secties terug.`, diatonic: l => l ? `Akkoorden buiten de toonladder: ${l}.` : 'Akkoorden blijven in de toonladder.' },
    fNo: { breakdown: () => 'Geen breakdown tussen de refreinen.', final: () => 'Het laatste refrein is niet dubbel zo lang.', outro: () => 'Geen duidelijke outro.', hook: t => t ? `De hook (spoor ${t}) komt maar in één sectie voor.` : 'Geen hook gevonden.' },
    m: {
      src: (c, v) => `Bron: refrein uit sectie ${c}, couplet uit sectie ${v}.`, flip: (a, b, f) => `Tempo ${a} naar ${b} BPM, cliplengtes ${f === 2 ? '×2' : f === .5 ? '÷2' : 'ongewijzigd'}.`, style: (s, k, b) => `Stijl ${s}, toonsoort ${k}, ${b} BPM.`, made: (s, c, n) => `${n} blokken, ${s} nieuwe scènes, ${c} nieuwe clips.` },
    w: {
      nodrums: () => 'Geen drumspoor: slagwerk is niet toegevoegd.', clipsfull: t => `Spoor ${t} heeft geen vrije clipplek meer (48).`, scenesfull: () => 'Geen vrije scène meer (24): een blok is overgeslagen.', skipblock: n => `Blok ${n} overgeslagen.`, arrfull: () => 'Het arrangement is vol (64 secties).', songsfull: () => 'Er zijn al 16 songs.',
      tooshort: (t, c) => `Clip ${c} van spoor ${t} is 1 maat en niet te halveren.`, toolong: s => `Sectie ${s} wordt langer dan 64 maten.`, span: n => `${n} uitgerekte clips (over scènes) zijn niet meegeschaald.`, lost: n => `${n} noten vielen weg of vielen samen bij het halveren.`, norole: r => `Geen spoor voor ${r}.` },
    e: { notracks: () => 'Het project heeft geen sporen.', emptysong: () => 'De gekozen song bevat geen noten.', songsfull: () => 'Er zijn al 16 songs.', failed: () => 'De remix kon niet gemaakt worden.' },
  },
  en: {
    about: 'Remix reads the song of a Clip Arranger, analyses key, chords, sections and hook, and puts a remix in the same Clip Arranger as an extra song. The first song stays; Restore puts everything back.\n\nIt works on notes and clips, not on audio, and cannot hear how it sounds. It can also start a new song from a style: key, chord progression, bass, drums and a hook as a starting point.\n\nOrder of a hit version (the classic hit formula): intro, verse, chorus, verse, chorus, breakdown, double chorus, outro, 3:30 at most.',
    source: 'Clip Arranger', none: 'no Clip Arranger on the floor', song: 'Song', recipe: 'Recipe', analyse: 'Analyse', make: 'Make remix', undo: 'Restore', targetBpm: 'New tempo', style: 'Style', key: 'Key', mode: 'Mode', seed: 'Seed', auto: 'by style',
    major: 'major', minor: 'minor', drums: 'Drums', drumsKeep: 'from the source', drumsClub: 'club (four on the floor)', applyTempo: 'Apply tempo',
    recipes: { hit: 'Hit version', radio: 'Radio edit', club: 'Club mix', flip: 'Tempo flip', new: 'New song' },
    styles: { house: 'House', pop: 'Pop', hiphop: 'Hip-hop', disco: 'Disco', synthwave: 'Synthwave' },
    roles: { intro: 'intro', verse: 'verse', chorus: 'chorus', breakdown: 'breakdown', build: 'build-up', outro: 'outro', drums: 'drums', bass: 'bass', chords: 'chords', lead: 'lead', none: 'empty' },
    hHeader: 'Analysis', hKey: (n, c, rel) => `Key ${n}${rel ? ' (relative ' + rel + ')' : ''}${c < .1 ? ', uncertain' : ''}`, hNoKey: 'Key unknown (no notes)', hTempo: b => `${b} BPM`, hLen: (bars, sec) => `${bars} bars, ${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`,
    hHook: (t, c) => `Hook: track ${t}, clip ${c}`, hNoHook: 'No hook found', hChords: (w, s) => `Chords ${w}: ${s}`, hScore: n => `Hit score ${n} of 100`, tracks: 'Tracks', sections: 'Sections',
    noTarget: 'Put a Clip Arranger on the floor.', reading: 'Reading…', needClick: 'The host did not allow writing (only after a click).', writeFail: 'Writing failed.', noHost: 'This host is too old for Remix (contract v1.35 needed).', done: 'Done: the remix is a new song in the Clip Arranger.', restored: 'Restored.', nothingUndo: 'Nothing to restore.',
    f: {
      empty: () => 'The song has no notes.', tempo: b => b > 135 ? `${b} BPM is above 135: danceable tempos are lower.` : b < 85 ? `${b} BPM is slow (fits hip-hop and downtempo).` : `${b} BPM is a danceable tempo.`,
      dur: (s, l) => `Length ${mmss(s)}: ${s <= l ? 'within' : 'longer than'} ${mmss(l)}.`, bars4: (l, m) => l ? `Sections ${l} are not a multiple of ${m} bars.` : `All sections are a multiple of ${m} bars.`,
      chorus1: (s, l) => s < 0 ? 'No chorus found.' : s <= l ? `First chorus after ${s} s: within ${l} s.` : `First chorus only after ${s} s: later than ${l} s.`, intro: (s, l) => s <= l ? (s ? `Intro ${s} s: short enough.` : 'No intro.') : `Intro ${s} s: longer than ${l} s.`,
      breakdown: () => 'Breakdown between the choruses.', final: () => 'The last chorus is twice as long.', outro: () => 'The song ends with an outro or a quiet close.', hook: t => `The hook (track ${t}) returns in several sections.`, diatonic: l => l ? `Chords outside the scale: ${l}.` : 'Chords stay in the scale.' },
    fNo: { breakdown: () => 'No breakdown between the choruses.', final: () => 'The last chorus is not twice as long.', outro: () => 'No clear outro.', hook: t => t ? `The hook (track ${t}) occurs in only one section.` : 'No hook found.' },
    m: {
      src: (c, v) => `Source: chorus from section ${c}, verse from section ${v}.`, flip: (a, b, f) => `Tempo ${a} to ${b} BPM, clip lengths ${f === 2 ? '×2' : f === .5 ? '÷2' : 'unchanged'}.`, style: (s, k, b) => `Style ${s}, key ${k}, ${b} BPM.`, made: (s, c, n) => `${n} blocks, ${s} new scenes, ${c} new clips.` },
    w: {
      nodrums: () => 'No drum track: drums were not added.', clipsfull: t => `Track ${t} has no free clip slot left (48).`, scenesfull: () => 'No free scene left (24): a block was skipped.', skipblock: n => `Block ${n} skipped.`, arrfull: () => 'The arrangement is full (64 sections).', songsfull: () => 'There are already 16 songs.',
      tooshort: (t, c) => `Clip ${c} of track ${t} is 1 bar and cannot be halved.`, toolong: s => `Section ${s} would be longer than 64 bars.`, span: n => `${n} stretched clips (over scenes) were not scaled.`, lost: n => `${n} notes dropped or merged when halving.`, norole: r => `No track for ${r}.` },
    e: { notracks: () => 'The project has no tracks.', emptysong: () => 'The chosen song has no notes.', songsfull: () => 'There are already 16 songs.', failed: () => 'The remix could not be made.' },
  },
};
const CA_ID = 'nl.patchkamer.cliparranger';
const RECIPES = ['hit', 'radio', 'club', 'flip', 'new'], STYLE_IDS = Object.keys(REMIX.STYLES);
const DEFAULTS = () => ({ target: '', recipe: 'hit', song: 0, targetBpm: 128, style: 'house', tonic: -1, mode: 'auto', seed: 1, drums: 'keep', applyTempo: true });
const clean = s => {
  s = s && typeof s === 'object' ? s : {}; const d = DEFAULTS(), n = (v, lo, hi, def) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : def);
  return { target: typeof s.target === 'string' ? s.target.slice(0, 80) : d.target, recipe: RECIPES.includes(s.recipe) ? s.recipe : d.recipe, song: n(s.song, 0, 15, d.song), targetBpm: n(s.targetBpm, 40, 200, d.targetBpm),
    style: STYLE_IDS.includes(s.style) ? s.style : d.style, tonic: n(s.tonic, -1, 11, d.tonic), mode: ['auto', 'major', 'minor'].includes(s.mode) ? s.mode : d.mode, seed: n(s.seed, 0, 999999, d.seed),
    drums: s.drums === 'club' ? 'club' : 'keep', applyTempo: s.applyTempo === undefined ? d.applyTempo : s.applyTempo === true };
};

export default {
  id: 'nl.patchkamer.remix',
  name: 'Remix',
  version: '1.0.0',
  kind: 'utility',
  category: 'tool',
  about: { nl: TXT.nl.about, en: TXT.en.about },
  ui: { width: 520, minWidth: 340 },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [] },
  modExclude: '*',

  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const state = DEFAULTS();
    let el = null, f = {}, peers = [], undo = null, report = null, status = '', alive = true;
    const E = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const fieldCss = 'background:var(--card-2);color:var(--fg);border:1px solid var(--line);border-radius:3px;font-family:var(--mono);font-size:12px;padding:4px 6px;min-width:0;width:100%;box-sizing:border-box';
    const labCss = 'font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)';
    const caPeers = () => peers.filter(p => p.def === CA_ID);
    const hasApi = () => typeof host.stateOf === 'function' && typeof host.setStateOf === 'function';
    const say = (t, bad) => { status = t || ''; if (f.status) { f.status.textContent = status; f.status.style.color = bad ? 'var(--danger,#e5484d)' : 'var(--muted)'; } };
    const fmtT = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
    const lab = (txt, child) => { const l = E('label', 'display:grid;gap:2px;min-width:0'); l.appendChild(E('span', labCss, txt)); l.appendChild(child); return l; };
    const sel = (opts, val, on) => { const s = E('select', fieldCss); opts.forEach(([v, t]) => { const o = E('option', '', t); o.value = String(v); s.appendChild(o); }); s.value = String(val); s.onchange = () => on(s.value); return s; };
    const numIn = (min, max, val, on, aria) => { const i = E('input', fieldCss); i.type = 'number'; i.min = min; i.max = max; i.step = 1; i.value = val; i.setAttribute('aria-label', aria); i.onchange = () => { const v = Math.max(min, Math.min(max, Math.round(+i.value))); if (Number.isFinite(v)) { i.value = v; on(v); } }; return i; };

    function currentSource() { const list = caPeers(); return list.find(p => p.id === state.target) || list[0] || null; }
    function readTarget() { const p = currentSource(); if (!p || !hasApi()) return null; const S = host.stateOf(self, p.id); return S && typeof S === 'object' ? { id: p.id, S } : null; }
    function updateVisibility() {
      if (!el) return; const r = state.recipe, show = (node, on) => { if (node) node.style.display = on ? '' : 'none'; };
      show(f.songBox, r !== 'new'); show(f.bpmBox, r === 'flip'); show(f.styleBox, r === 'new'); show(f.keyBox, r === 'new'); show(f.modeBox, r === 'new'); show(f.seedBox, r === 'new'); show(f.drumsBox, r === 'hit' || r === 'radio'); show(f.tempoBox, r === 'flip' || r === 'new');
      if (f.analyse) f.analyse.style.display = r === 'new' ? 'none' : '';
    }
    function fillSources() {
      if (!f.src) return; const list = caPeers(); f.src.textContent = '';
      if (!list.length) { const o = E('option', '', T.none); o.value = ''; f.src.appendChild(o); f.src.disabled = true; } else { f.src.disabled = false; list.forEach(p => { const o = E('option', '', p.name); o.value = p.id; f.src.appendChild(o); }); f.src.value = (list.find(p => p.id === state.target) || list[0]).id; }
      f.make.disabled = !list.length || !hasApi(); f.analyse.disabled = f.make.disabled;
    }
    function fillSongs(S) {
      if (!f.song) return; const songs = S && Array.isArray(S.songs) && S.songs.length ? S.songs : Array.from({ length: state.song + 1 }, () => ({ name: '' })); f.song.textContent = '';
      songs.forEach((g, i) => { const o = E('option', '', `${i + 1}${g && g.name ? ' · ' + g.name : ''}`); o.value = String(i); f.song.appendChild(o); }); if (S) state.song = Math.min(state.song, songs.length - 1); f.song.value = String(state.song);
    }
    function renderReport(an, extra) {
      const box = f.report; if (!box) return; box.textContent = ''; if (!an) return;
      const line = (txt, css) => box.appendChild(E('div', css || 'font-size:12px;line-height:1.5', txt));
      if (extra && extra.lines && extra.lines.length) { extra.lines.forEach(l => line(T.m[l.k](...l.a), 'font-size:12px')); }
      if (extra && extra.warns) extra.warns.forEach(w => line('⚠ ' + (T.w[w.k] ? T.w[w.k](...w.a) : w.k), 'font-size:12px;color:var(--warn,#d6a100)'));
      line(T.hHeader, labCss + ';margin-top:6px');
      line([an.key ? T.hKey(an.key.name, an.key.conf, an.key.relative) : T.hNoKey, T.hTempo(Math.round(an.bpm)), T.hLen(an.totalBars, an.seconds)].join(' · '));
      if (an.hook) line(T.hHook(an.hook.track + 1, an.hook.clip + 1)); else if (!an.empty) line(T.hNoHook);
      ['chorus', 'verse'].forEach(w => { const c = an.chords && an.chords[w]; if (c && c.length) line(T.hChords(T.roles[w], c.map(x => x.name + (x.roman && x.roman !== '–' ? ' (' + x.roman + ')' : '')).join('  ')), 'font-family:var(--mono);font-size:11px'); });
      if (an.sections.length) { line(T.sections, labCss + ';margin-top:6px'); const total = Math.max(1, an.totalBars), row = E('div', 'display:flex;gap:2px;align-items:stretch;min-height:34px');
        an.sections.forEach(s => { const b = E('div', `flex:${Math.max(1, s.bars)} 1 0;min-width:14px;background:var(--card-2);border:1px solid var(--line);border-top:3px solid ${s.role === 'chorus' ? '#e8ae61' : s.role === 'verse' ? '#80c9af' : s.role === 'breakdown' || s.role === 'build' ? '#bb9ee4' : '#89b6ea'};border-radius:3px;font-size:9px;line-height:1.2;padding:2px;overflow:hidden;text-align:center`);
          b.title = `${s.index + 1}: ${T.roles[s.role] || s.role}, ${s.bars} · ${fmtT(s.startSec)}`; b.appendChild(E('div', '', (T.roles[s.role] || s.role).slice(0, 6))); b.appendChild(E('div', 'color:var(--muted)', String(s.bars))); row.appendChild(b); }); box.appendChild(row); }
      if (an.tracks.length) { line(T.tracks, labCss + ';margin-top:6px'); line(an.tracks.map(t => `${t.index + 1} ${t.name || ''} · ${T.roles[t.role] || t.role}`).join('   '), 'font-size:11px;color:var(--muted)'); }
      if (!an.empty) line(T.hScore(an.score), 'font-weight:600;margin-top:6px');
      an.findings.forEach(x => { const msg = x.ok === true ? T.f[x.id](...x.a) : T.fNo[x.id] ? T.fNo[x.id](...x.a) : x.ok === false ? T.f[x.id](...x.a) : ''; if (!msg) return;
        line((x.ok === true ? '✓ ' : x.ok === false ? '✗ ' : '• ') + msg, `font-size:12px;color:${x.ok === true ? 'var(--ok,#6cc070)' : x.ok === false ? 'var(--danger,#e5484d)' : 'var(--muted)'}`); });
    }
    function doAnalyse() {
      if (!hasApi()) { say(T.noHost, true); return; } const t = readTarget(); if (!t) { say(T.noTarget, true); return; }
      fillSongs(t.S); const bpm = host.bpm || 120; const an = REMIX.analyze(t.S, { song: state.song, bpm, profile: state.recipe === 'club' ? 'club' : 'pop' }); report = an; renderReport(an); say('');
    }
    function doMake() {
      if (!hasApi()) { say(T.noHost, true); return; } const t = readTarget(); if (!t) { say(T.noTarget, true); return; }
      const bpm = host.bpm || 120, r = REMIX.build(t.S, { recipe: state.recipe, song: state.song, bpm, targetBpm: state.targetBpm, style: state.style, tonic: state.tonic, mode: state.mode === 'auto' ? undefined : state.mode, seed: state.seed, drums: state.drums, lang: host.lang });
      if (!r.ok) { say(T.e[r.err.k] ? T.e[r.err.k](...r.err.a) : T.e.failed(), true); return; }
      const ok = host.setStateOf(self, t.id, r.state);
      if (!ok) { say(T.needClick, true); return; }
      undo = { id: t.id, state: t.S, bpm: null }; f.undo.disabled = false;
      if (state.applyTempo && (state.recipe === 'flip' || state.recipe === 'new') && typeof host.setTempo === 'function') { undo.bpm = bpm; host.setTempo(r.bpm); }
      if (typeof host.show === 'function') host.show(self, t.id, { select: true, center: false });
      const back = host.stateOf(self, t.id); if (back) fillSongs(back);
      report = r.after; renderReport(r.after, { lines: r.lines, warns: r.warns }); say(T.done);
    }
    function doUndo() {
      if (!undo) { say(T.nothingUndo, true); return; } if (!hasApi() || !host.setStateOf(self, undo.id, undo.state)) { say(T.needClick, true); return; }
      if (undo.bpm && typeof host.setTempo === 'function') host.setTempo(undo.bpm); undo = null; f.undo.disabled = true; renderReport(null); const back = host.stateOf(self, state.target || (currentSource() || {}).id); if (back) fillSongs(back); say(T.restored);
    }
    function paint() {
      if (!el) return; f.recipe.value = state.recipe; f.src.value = state.target || f.src.value; f.bpm.value = state.targetBpm; f.style.value = state.style; f.key.value = String(state.tonic); f.mode.value = state.mode; f.seed.value = state.seed; f.drums.value = state.drums; f.apply.checked = state.applyTempo; f.undo.disabled = !undo; updateVisibility(); fillSongs(null); f.song.value = String(state.song);
    }
    const self = {
      inputs: {}, outputs: {},
      mount(root) {
        el = E('div', 'display:grid;gap:8px'); root.appendChild(el);
        const r1 = E('div', 'display:grid;grid-template-columns:1fr 1fr;gap:8px');
        f.src = sel([], '', v => { state.target = v; fillSongs(null); }); r1.appendChild(lab(T.source, f.src));
        f.recipe = sel(RECIPES.map(r => [r, T.recipes[r]]), state.recipe, v => { state.recipe = v; updateVisibility(); }); r1.appendChild(lab(T.recipe, f.recipe)); el.appendChild(r1);
        const r2 = E('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px');
        f.song = sel([[0, '1']], 0, v => { state.song = +v; }); f.songBox = lab(T.song, f.song);
        f.bpm = numIn(40, 200, state.targetBpm, v => { state.targetBpm = v; }, T.targetBpm); f.bpmBox = lab(T.targetBpm, f.bpm);
        f.style = sel(STYLE_IDS.map(s => [s, T.styles[s]]), state.style, v => { state.style = v; }); f.styleBox = lab(T.style, f.style);
        f.key = sel([[-1, T.auto]].concat(REMIX.NOTE_NAMES.map((n, i) => [i, n])), state.tonic, v => { state.tonic = +v; }); f.keyBox = lab(T.key, f.key);
        f.mode = sel([['auto', T.auto], ['major', T.major], ['minor', T.minor]], state.mode, v => { state.mode = v; }); f.modeBox = lab(T.mode, f.mode);
        f.seed = numIn(0, 999999, state.seed, v => { state.seed = v; }, T.seed); f.seedBox = lab(T.seed, f.seed);
        f.drums = sel([['keep', T.drumsKeep], ['club', T.drumsClub]], state.drums, v => { state.drums = v; }); f.drumsBox = lab(T.drums, f.drums);
        [f.songBox, f.bpmBox, f.styleBox, f.keyBox, f.modeBox, f.seedBox, f.drumsBox].forEach(b => r2.appendChild(b)); el.appendChild(r2);
        f.tempoBox = E('label', 'display:flex;gap:6px;align-items:center;font-size:12px'); f.apply = E('input'); f.apply.type = 'checkbox'; f.apply.checked = state.applyTempo; f.apply.onchange = () => { state.applyTempo = f.apply.checked; }; f.tempoBox.append(f.apply, E('span', '', T.applyTempo)); el.appendChild(f.tempoBox);
        const btns = E('div', 'display:flex;gap:6px;flex-wrap:wrap');
        f.analyse = E('button', '', T.analyse); f.analyse.onclick = doAnalyse; f.make = E('button', 'font-weight:600', T.make); f.make.onclick = doMake; f.undo = E('button', '', T.undo); f.undo.onclick = doUndo; f.undo.disabled = !undo;
        btns.append(f.analyse, f.make, f.undo); el.appendChild(btns);
        f.status = E('div', 'font-size:12px;min-height:16px;color:var(--muted)', status); el.appendChild(f.status);
        f.report = E('div', 'display:grid;gap:3px'); el.appendChild(f.report);
        fillSources(); updateVisibility(); renderReport(report);
        if (!hasApi()) say(T.noHost, true); else if (!caPeers().length) say(T.noTarget, false);
      },
      unmount() { el = null; f = {}; },
      onPeers(list) { peers = Array.isArray(list) ? list : []; if (el) { fillSources(); if (!caPeers().length) say(T.noTarget, false); else if (status === T.noTarget) say(''); } },
      getState() { return { ...state }; },
      // preset: de instellingen van het recept; de gekozen Clip Arranger (target) en de gekozen bronsong horen bij deze werkruimte (contract §13)
      getPreset() { const o = { ...state }; delete o.target; delete o.song; return o; },
      setPreset(pr) { const keep = { target: state.target, song: state.song }; self.setState({ ...(pr && typeof pr === 'object' ? pr : {}), ...keep }); },
      setState(s) { Object.assign(state, clean(s)); paint(); },
      destroy() { alive = false; el = null; f = {}; undo = null; report = null; },
    };
    try { peers = host.peers ? host.peers(self) : []; } catch (e) { peers = []; }
    return self;
  },
};
