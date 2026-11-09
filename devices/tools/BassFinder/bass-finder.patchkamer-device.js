// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.22.0 — Uitleg naar about (menu Over Bass Finder); de UI toont geen uitlegtekst meer.
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam.
// 1.20.0 — Eerste versie. Bass Finder luistert naar een monofone baslijn (bas, sub of synthbas; geen akkoorden) en schrijft de noten op: toonhoogte, start, lengte en velocity.
//          Bron: een audiobestand (knop, of de tab Samples via loadAudio, met tempo en maten van het sample) of een opname van een paar maten uit de ingang (bijvoorbeeld van Audio Capture).
//          Werking (BASS-ANALYSIS, alles lokaal in de pagina, geen dienst op internet): het geluid wordt teruggebracht tot ongeveer 5 kHz; een toonhoogtevolger (genormaliseerd verschil
//          van het signaal met zichzelf, zoals YIN) geeft per 5 ms een paar kandidaten van 27 tot 500 Hz; een Viterbi-pad over de kandidaten kiest de toonhoogte met continuïteit
//          (voorkomt octaaffouten) en met stemhebbend/stil; daarna worden de noten gesneden op toonhoogtesprongen (met hysterese, glijdende overgangen blijven één overgang) en op
//          nieuwe aanzetten in de omhullende; de stemming wordt geschat en de toonhoogte op halve tonen afgerond. Tempo, fase en swing worden uit de aanzetten geschat (of opgegeven)
//          en de noten gaan op het raster: 1/8, 1/16, triool 1/16 of niet. Het resultaat is een clip in het formaat patchkamer-clip (kind notes, 12 tikken per zestiende), te kopiëren
//          met de knop Kopieer van de host en te plakken in een sequencer, of met de klok als noten naar een synth te sturen. Echte opnames zijn niet getest; niets is beluisterd.
// Bass Finder — van een baslijn naar noten · Patchkamer contract v1.23

// ==== BASS-ANALYSIS BEGIN ====
// Monophonic note transcription of a bass line. Pure functions on Float32Array, no dependencies, no browser API.
const BA = (() => {
  const VERSION = 1;
  const FMIN = 27, FMAX = 500, HOP = 0.005, WIN = 0.04, KC = 5, E_MAXSEC = 90, ENV_WIN = 0.03;
  const TICKS = 12;                                   // ticks per sixteenth (clip format)
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const median = a => { if (!a.length) return 0; const s = a.slice().sort((p, q) => p - q), m = s.length >> 1; return s.length & 1 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const hz2midi = f => 69 + 12 * Math.log2(f / 440);
  const midi2hz = m => 440 * Math.pow(2, (m - 69) / 12);

  /** Mono, finite, normalised signal. Returns null for silence or a signal that is too short. */
  function prepare(chs, sr) {
    const list = (Array.isArray(chs) ? chs : [chs]).filter(c => c && c.length);
    if (!list.length || !(sr >= 3000 && sr <= 400000)) return null;
    let n = Math.min(...list.map(c => c.length)); const truncated = n > E_MAXSEC * sr; n = Math.min(n, Math.floor(E_MAXSEC * sr));
    const x = new Float32Array(n);
    for (const c of list) for (let i = 0; i < n; i++) { const v = c[i]; if (v === v && v > -1e6 && v < 1e6) x[i] += v / list.length; }
    const a = Math.exp(-2 * Math.PI * 15 / sr); let m = x[0], peak = 0;                  // slow DC removal (one-pole high-pass at ~15 Hz)
    for (let i = 0; i < n; i++) { m = a * m + (1 - a) * x[i]; x[i] -= m; const v = Math.abs(x[i]); if (v > peak) peak = v; }
    if (!(peak > 1e-5) || n < sr * 0.1) return null;
    const step = Math.max(1, Math.floor(n / 20000)), mags = []; for (let i = 0; i < n; i += step) mags.push(Math.abs(x[i])); mags.sort((p, q) => p - q);
    const lim = Math.max(8 * mags[Math.floor(mags.length * 0.995)], 1e-6); let pk2 = 0;     // a few absurd spikes must not decide the level
    for (let i = 0; i < n; i++) { if (x[i] > lim) x[i] = lim; else if (x[i] < -lim) x[i] = -lim; const v = Math.abs(x[i]); if (v > pk2) pk2 = v; }
    const g = 1 / (pk2 || 1); for (let i = 0; i < n; i++) x[i] *= g;
    return { x, sr, n, peak, dur: n / sr, truncated };
  }

  /** Low-pass and decimate to about 5 kHz (windowed sinc). */
  function decimate(x, sr) {
    const f = Math.max(1, Math.round(sr / 5000));
    if (f === 1) return { y: x, fs: sr, f };
    const half = f * 6, taps = 2 * half + 1, h = new Float64Array(taps), fc = 0.45 / f; let s = 0;
    for (let k = 0; k < taps; k++) { const u = k - half, win = 0.5 + 0.5 * Math.cos(Math.PI * u / (half + 1)), sinc = u === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * u) / (Math.PI * u); h[k] = sinc * win; s += h[k]; }
    for (let k = 0; k < taps; k++) h[k] /= s;
    const n = Math.floor(x.length / f), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { let acc = 0; const c = i * f; for (let k = 0; k < taps; k++) { const j = c + k - half; if (j >= 0 && j < x.length) acc += h[k] * x[j]; } y[i] = acc; }
    return { y, fs: sr / f, f };
  }

  /** Envelope in dB: RMS over the last 30 ms (one period of the lowest bass note, so no ripple), one value per 2 ms; the value at index k describes the 30 ms before k * hop. */
  function envelope(y, fs) {
    const hop = Math.max(1, Math.round(0.002 * fs)), win = Math.max(2, Math.round(ENV_WIN * fs)), n = Math.max(1, Math.floor(y.length / hop)), e = new Float32Array(n);
    const ps = new Float64Array(y.length + 1); for (let i = 0; i < y.length; i++) ps[i + 1] = ps[i] + y[i] * y[i];
    for (let k = 0; k < n; k++) { const b = Math.min(y.length, k * hop + 1), a = Math.max(0, b - win), ms = (ps[b] - ps[a]) / Math.max(1, b - a); e[k] = 10 * Math.log10(ms + 1e-14); }
    return { e, hop: hop / fs, n };
  }

  /** Energy onsets (start of a rise of at least thr dB within 20 ms). Returns seconds. */
  function envOnsets(env, thr = 6) {
    const { e, hop, n } = env, M = Math.max(2, Math.round(ENV_WIN / hop)), out = []; let mx = -200; for (let k = 0; k < n; k++) if (e[k] > mx) mx = e[k];
    const floor = mx - 50; let last = -1e9;
    for (let k = M; k < n; k++) {
      let mn = 1e9; for (let j = k - M; j <= k; j++) if (e[j] < mn) mn = e[j];
      if (e[k] - mn >= thr && e[k] > floor && k - last > 0.06 / hop) {
        let j = k; while (j > 0 && e[j - 1] - mn > 1.5 && j > k - 3 * M) j--;      // back to the start of the rise
        out.push({ t: j * hop, rise: e[k] - mn, level: e[k] }); last = k;
      }
    }
    return out;
  }

  /** Pitch candidates per frame of 5 ms (cumulative-mean-normalised difference function, window 40 ms). run(a, b) fills frames a..b-1. */
  function pitchPlan(y, fs) {
    const W = Math.round(WIN * fs), tmax = Math.ceil(fs / FMIN), tmin = Math.max(2, Math.floor(fs / FMAX)), hop = Math.max(1, Math.round(HOP * fs));
    const n = y.length, frames = Math.max(1, Math.floor((n - 1) / hop) + 1);
    const yp = new Float64Array(n + W + tmax + 4); for (let i = 0; i < n; i++) yp[i] = y[i];
    const cf = new Float32Array(frames * KC), cd = new Float32Array(frames * KC), nc = new Uint8Array(frames), rms = new Float32Array(frames), wgt = new Float32Array(frames);
    const d = new Float64Array(tmax + 2), dn = new Float64Array(tmax + 2);
    const run = (a, b) => {
      b = Math.min(b, frames);
      for (let i = a; i < b; i++) {
        const t0 = i * hop; let e = 0, e1 = 0; for (let j = 0; j < W; j++) { const v = yp[t0 + j]; e += v * v; if (j < W >> 1) e1 += v * v; }
        rms[i] = Math.sqrt(e / W); const e2 = e - e1, qq = Math.min(e1, e2) / (Math.max(e1, e2) + 1e-20); wgt[i] = clamp(2 * qq, 0.15, 1);   // weight: a window that covers the start or the end of a sound says little
        if (!(e > 1e-12)) { nc[i] = 0; continue; }
        let cum = 0; dn[0] = 1;
        for (let tau = 1; tau <= tmax; tau++) { let s = 0; for (let j = 0; j < W; j++) { const dl = yp[t0 + j] - yp[t0 + j + tau]; s += dl * dl; } d[tau] = s; cum += s; dn[tau] = cum > 1e-20 ? s * tau / cum : 1; }
        const cands = [];
        for (let tau = tmin; tau < tmax; tau++) {
          const v = dn[tau]; if (v < 0.7 && v < dn[tau - 1] && v <= dn[tau + 1]) {
            const p = dn[tau - 1], q = dn[tau + 1], den = p - 2 * v + q, sh = den > 1e-12 ? clamp(0.5 * (p - q) / den, -1, 1) : 0;
            cands.push([fs / (tau + sh), v - 0.25 * (p - q) * sh]);
          }
        }
        cands.sort((p, q) => p[1] - q[1]); const k = Math.min(KC, cands.length); nc[i] = k;
        for (let c = 0; c < k; c++) { cf[i * KC + c] = cands[c][0]; cd[i * KC + c] = Math.max(0, cands[c][1]); }
      }
    };
    return { frames, hop: hop / fs, W: W / fs, run, cf, cd, nc, rms, wgt, fs };
  }

  const A_EMIT = 3, E_UNV = 1.2, LAMBDA = 4, C_VU = 0.35;
  /** Viterbi path over the candidates and "unvoiced". gateRel: fraction of the 95th percentile of the frame level under which a frame is silent. */
  function track(P, gateRel) {
    const { frames, cf, cd, nc, rms, wgt } = P, S = KC + 1;
    const srt = Array.from(rms).sort((a, b) => a - b), ref = srt[Math.floor(srt.length * 0.95)] || 0, gate = Math.max(ref * gateRel, 1e-9);
    const cost = new Float64Array(frames * S).fill(Infinity), back = new Int8Array(frames * S);
    const ok = i => (rms[i] >= gate ? nc[i] : 0);
    for (let i = 0; i < frames; i++) {
      const k = ok(i), base = i * S;
      for (let s = 0; s <= k; s++) {                              // s < k: candidate, s === k: unvoiced (kept at index k)
        const em = (s < k ? A_EMIT * cd[i * KC + s] : E_UNV * (k ? 1 : 0.2)) * wgt[i];
        if (i === 0) { cost[base + s] = em; back[base + s] = -1; continue; }
        const kp = ok(i - 1), pb = (i - 1) * S; let best = Infinity, bi = 0;
        for (let r = 0; r <= kp; r++) {
          const pc = cost[pb + r]; if (pc === Infinity) continue; let tr;
          if (s === k) tr = r === kp ? 0 : C_VU; else if (r === kp) tr = C_VU; else tr = Math.min(LAMBDA * Math.abs(Math.log2(cf[i * KC + s] / cf[(i - 1) * KC + r])), 6);
          const c = pc + tr; if (c < best) { best = c; bi = r; }
        }
        cost[base + s] = best + em; back[base + s] = bi;
      }
    }
    const f = new Float32Array(frames), conf = new Float32Array(frames);
    let k = ok(frames - 1), bs = 0, bc = Infinity; for (let s = 0; s <= k; s++) if (cost[(frames - 1) * S + s] < bc) { bc = cost[(frames - 1) * S + s]; bs = s; }
    for (let i = frames - 1; i >= 0; i--) { k = ok(i); if (bs < k) { f[i] = cf[i * KC + bs]; conf[i] = cd[i * KC + bs]; } const pbk = back[i * S + bs]; bs = pbk < 0 ? 0 : pbk; }
    return { f, conf, rms, hop: P.hop, W: P.W, frames, gate, ref };
  }

  // ---------------------------------------------------------------------------------------------
  // Segmentation: voiced stretches -> notes
  const TH = 0.7;                       // semitones: a deviation from the running pitch of the note that starts a new note when it settles
  const CAL = { legatoStart: 0.0, coldStart: 0.0, endLevel: 14 };

  function frameMidi(tr) { const m = new Float32Array(tr.frames); for (let i = 0; i < tr.frames; i++) m[i] = tr.f[i] > 0 ? hz2midi(tr.f[i]) : NaN; return m; }

  /** Voiced runs; gaps of at most 2 frames with a consistent pitch are bridged. */
  function voicedRuns(m, nb = 2) {
    const runs = []; let a = -1;
    for (let i = 0; i <= m.length; i++) {
      const v = i < m.length && m[i] === m[i];
      if (v && a < 0) a = i;
      if (!v && a >= 0) { runs.push([a, i]); a = -1; }
    }
    const out = [];
    for (const r of runs) {
      const last = out[out.length - 1];
      if (last && r[0] - last[1] <= nb) { const p = median(Array.from(m.slice(Math.max(last[0], last[1] - 4), last[1]))), q = median(Array.from(m.slice(r[0], Math.min(r[1], r[0] + 4)))); if (Math.abs(p - q) < 0.8) { for (let i = last[1]; i < r[0]; i++) m[i] = (p + q) / 2; last[1] = r[1]; continue; } }
      out.push([r[0], r[1]]);
    }
    return out;
  }

  /** Split one voiced run [i0, i1) into segments. Returns the frame indexes where a new note starts (besides i0) with the kind of cut. */
  function splitRun(m, i0, i1, onFrames) {
    const cuts = []; let recent = [], pend = null;
    for (let i = i0; i < i1; i++) {
      const v = m[i], c = recent.length ? median(recent) : v;
      if (!recent.length || Math.abs(v - c) <= TH) { recent.push(v); if (recent.length > 7) recent.shift(); pend = null; continue; }
      if (!pend) pend = { start: i, list: [v] }; else pend.list.push(v);
      const L = pend.list;
      if (L.length >= 3) { const last = L.slice(-3), md = median(last); if (last.every(q => Math.abs(q - md) <= 0.5) && Math.abs(md - c) > TH) { cuts.push({ i: pend.start, kind: 'pitch' }); recent = last.slice(); pend = null; } }
    }
    for (const f of onFrames) if (f > i0 + 3 && f < i1 - 3 && !cuts.some(c => Math.abs(c.i - f) <= 4)) cuts.push({ i: f, kind: 'onset' });
    cuts.sort((a, b) => a.i - b.i); return cuts;
  }

  /** Notes in seconds from the frame track. rel: fraction of the level (dB below the loudest note) under which a note is dropped. */
  function detectNotes(tr, env, ons, o = {}) {
    const m = frameMidi(tr), hop = tr.hop, runs = voicedRuns(m), segs = [];
    const onFrames = ons.map(q => Math.ceil(q.t / hop));
    for (const [a, b] of runs) {
      const cuts = splitRun(m, a, b, onFrames), pts = [{ i: a, kind: 'cold' }, ...cuts];
      for (let k = 0; k < pts.length; k++) segs.push({ a: pts[k].i, b: k + 1 < pts.length ? pts[k + 1].i : b, kind: pts[k].kind, runEnd: k + 1 >= pts.length });
    }
    const notes = [];
    for (const s of segs) {
      const len = s.b - s.a; if (len < 3) continue;
      const fr = []; for (let i = s.a; i < s.b; i++) fr.push(m[i]);
      const dq = []; for (let i = s.a; i < s.b; i++) dq.push(tr.conf[i]); if (median(dq) > fin(o.dnMax, 0.25)) continue;        // not periodic enough: the tail of a reverb, noise
      const skip = len >= 8 ? Math.min(4, len >> 2) : 0, mm = median(fr.slice(skip));
      const w = tr.hop * s.a + CAL[s.kind === 'cold' ? 'coldStart' : 'legatoStart'];
      let st = w;
      if (s.kind !== 'pitch') { let bo = null; for (const q of ons) if (q.t >= w - 0.06 && q.t <= w + 0.03 && (!bo || Math.abs(q.t - w) < Math.abs(bo.t - w))) bo = q; if (bo) st = bo.t; }
      else { let bo = null; for (const q of ons) if (q.t >= w - 0.04 && q.t <= w + 0.04 && (!bo || Math.abs(q.t - w) < Math.abs(bo.t - w))) bo = q; if (bo) st = bo.t; }
      notes.push({ st, mf: mm, a: s.a, b: s.b, kind: s.kind, onset: st !== w, vend: s.b * hop + tr.W * 0.6 });
    }
    notes.sort((p, q) => p.st - q.st);
    // ghosts of a partly covered analysis window: a short piece one or two octaves (or a twelfth) above the end of the previous note, or just before the real start
    const harm = d => { const ad = Math.abs(d); return Math.abs(ad - 12) < 0.8 || Math.abs(ad - 19.02) < 0.8 || Math.abs(ad - 24) < 0.8; };
    for (let k = notes.length - 1; k >= 0; k--) {
      const c = notes[k], pv = notes[k - 1], nx = notes[k + 1];
      if (pv && !c.onset && c.a - pv.b <= 6 && c.b - c.a <= 12 && c.mf > pv.mf && harm(c.mf - pv.mf)) { pv.b = c.b; notes.splice(k, 1); continue; }
      if (nx && c.b - c.a <= 12 && nx.kind === 'pitch' && nx.a - c.b <= 1 && harm(c.mf - nx.mf)) { nx.st = c.st; nx.a = c.a; nx.kind = c.kind; nx.onset = c.onset; notes.splice(k, 1); }
    }
    // end of a note: the voiced end, the next start, or the envelope falling by endLevel dB after its peak
    const { e, hop: eh, n: en } = env;
    for (let k = 0; k < notes.length; k++) {
      const nt = notes[k], next = notes[k + 1], k0 = clamp(Math.round(nt.st / eh), 0, en - 1), limit = Math.min(next ? next.st : 1e9, nt.vend), k1 = clamp(Math.round(limit / eh), k0 + 1, en);
      let kp = k0, pk = -1e9; for (let j = k0; j < k1; j++) if (e[j] > pk) { pk = e[j]; kp = j; }
      let ke = k1; for (let j = kp; j < k1; j++) if (e[j] < pk - CAL.endLevel) { ke = j; break; }
      nt.pk = pk; nt.en = Math.max(nt.st + 0.02, Math.min(limit, ke * eh));
    }
    // drop ghosts: far below the loud notes
    const pks = notes.map(q => q.pk).sort((p, q) => p - q), top = pks.length ? pks[Math.floor(pks.length * 0.9)] : 0, rel = fin(o.rel, 33);
    let out = notes.filter(q => q.pk >= top - rel && q.en - q.st >= 0.03);
    // join pieces of one sustained note (same pitch, no dip in the envelope)
    const joined = [];
    for (const q of out) {
      const p = joined[joined.length - 1];
      if (p && q.kind === 'cold' && Math.round(p.mf) === Math.round(q.mf) && q.st - p.en < 0.03) {
        const k0 = clamp(Math.round(p.en / eh), 0, en - 1), k1 = clamp(Math.round(q.st / eh), k0, en - 1); let mn = 1e9; for (let j = k0; j <= k1; j++) if (e[j] < mn) mn = e[j];
        if (mn > Math.min(p.pk, q.pk) - 6) { p.en = q.en; p.b = q.b; continue; }
      }
      joined.push(q);
    }
    out = joined;
    // tuning: circular mean of the fractional pitch, weighted by length
    let tuning = 0;
    if (o.tuning === 'auto' || o.tuning === undefined) {
      let cs = 0, sn = 0, ws = 0; for (const q of out) { const w = q.en - q.st, ph = 2 * Math.PI * (q.mf - Math.round(q.mf)); cs += w * Math.cos(ph); sn += w * Math.sin(ph); ws += w; }
      if (out.length >= 3 && ws > 0) { const R = Math.hypot(cs, sn) / ws; if (R > 0.6) { const off = Math.atan2(sn, cs) / (2 * Math.PI); if (Math.abs(off) >= 0.05) tuning = clamp(off, -0.5, 0.5); } }
    } else tuning = clamp(fin(o.tuning, 0), -0.5, 0.5);
    const ref = out.length ? out.map(q => q.pk).sort((p, q) => p - q)[Math.floor(out.length * 0.9)] : 0;
    const res = [];
    for (const q of out) {
      const mi = Math.round(q.mf - tuning); if (mi < 12 || mi > 100) continue;
      const amp = Math.pow(10, (q.pk - ref) / 20), vel = clamp(Math.round(0.9 * amp * 100) / 100, 0.15, 1);
      res.push({ s: q.st, e: q.en, midi: mi, mf: q.mf, vel, kind: q.kind, pk: q.pk });
    }
    return { notes: res, tuning };
  }

  // ---------------------------------------------------------------------------------------------
  // Tempo, phase, swing and grid
  /** Tempo from note onsets: coherence of the onsets with a 16th / 8th / beat / bar comb. */
  function estimateTempo(ts, ws, dur, hint = {}) {
    if (hint.bpm > 0) return { bpm: hint.bpm, how: 'given' };
    if (hint.bars > 0 && dur > 0) { let b = hint.bars * 240 / dur; while (b < 70) b *= 2; while (b > 180) b /= 2; return { bpm: b, how: 'bars' }; }
    if (!ts.length) return { bpm: 120, how: 'estimated', score: 0 };
    const sw = ws.reduce((a, b) => a + b, 0) || 1;
    const coh = P => { let c = 0, s = 0; for (let i = 0; i < ts.length; i++) { const a = 2 * Math.PI * ts[i] / P; c += ws[i] * Math.cos(a); s += ws[i] * Math.sin(a); } return Math.hypot(c, s) / sw; };
    const score = bpm => { const B = 60 / bpm; return 0.6 * coh(B / 4) + 0.8 * coh(B / 2) + coh(B) + 0.8 * coh(B * 2) + 0.9 * coh(B * 4); };
    const cands = []; for (let b = 60; b <= 200; b += 0.5) cands.push([b, score(b) * (b >= 80 && b <= 165 ? 1.03 : 1)]);
    cands.sort((a, b) => b[1] - a[1]); const best = cands[0][0];
    let bs = -1, bb = best; for (let b = best - 0.6; b <= best + 0.6; b += 0.05) { const s = score(b); if (s > bs) { bs = s; bb = b; } }
    return { bpm: bb, how: 'estimated', score: bs };
  }

  // grid ids: '8' (eighth), '16' (sixteenth), '16t' (triplet sixteenth), 'off' (a tick)
  const GRID_UNIT = { '8': 2, '16': 1, '16t': 2 / 3, off: 1 / TICKS };   // in sixteenths
  /** Snap a position (sixteenths from the origin) to a grid. Returns { pos (sixteenths on the unswung grid), err }. */
  function snap(s, g, sw) {
    const u = GRID_UNIT[g];
    if (g === '16') {
      const pair = Math.floor(s / 2) * 2, within = s - pair; let best = null;
      for (let j = 0; j <= 2; j++) { const p = j, shifted = p + (p >= 1 - 1e-9 && p < 2 - 1e-9 ? sw : 0), d = Math.abs(within - shifted); if (!best || d < best.err) best = { err: d, pos: pair + p }; }
      return best;
    }
    const k = Math.round(s / u); return { pos: k * u, err: Math.abs(s - k * u) };
  }
  /** Best origin (seconds), error and swing for a grid. */
  function fitGrid(ts, ws, stepSec, g, swingOpt) {
    const U = ts.map(t => t / stepSec), wsum = ws.reduce((a, b) => a + b, 0) || 1, u = g === '16' ? 2 : GRID_UNIT[g], nph = g === 'off' ? 1 : Math.round(u / 0.02);
    const sws = g === '16' ? (swingOpt === 'auto' || swingOpt === undefined ? [0, 0.1, 0.2, 0.3, 0.33, 0.4, 0.5] : [clamp(fin(swingOpt, 0), 0, 0.6)]) : [0];
    let best = null;
    for (const sw of sws) for (let k = 0; k < nph; k++) {
      const ph = k * 0.02; let c = 0; for (let i = 0; i < U.length; i++) c += ws[i] * Math.min(snap(U[i] - ph, g, sw).err, 0.5);
      c /= wsum; const pen = sw > 0 && (swingOpt === 'auto' || swingOpt === undefined) ? 0.04 : 0;
      if (!best || c + pen < best.c + best.pen - 1e-9) best = { ph, sw, c, pen };
    }
    return { origin: best.ph * stepSec, swing: best.sw, err: best.c };
  }

  /** Notes (seconds) -> clip notes (ticks). opts: { bpm, bars, grid ('auto' | '8' | '16' | '16t' | 'off'), swing ('auto' | 0..0.6), align ('smart' | 'first' | 'start'), loop } */
  function quantize(notes, dur, opts = {}) {
    if (!notes.length) return { error: 'nonotes' };
    const ts = notes.map(q => q.s), ws = notes.map(q => 0.4 + q.vel);
    const hb = fin(opts.bpm, 0) >= 20 ? clamp(opts.bpm, 20, 400) : 0, hbars = fin(opts.bars, 0) >= 1 ? clamp(Math.round(opts.bars), 1, 64) : 0;
    const tempo = estimateTempo(ts, ws, dur, { bpm: hb, bars: hbars }), bpm = tempo.bpm, stepSec = 15 / bpm, barSec = 16 * stepSec;
    const loop = hbars > 0, nSteps = loop ? hbars * 16 : 0;
    const gridOpt = ['8', '16', '16t', 'off'].includes(opts.grid) ? opts.grid : 'auto';
    const cand = gridOpt === 'auto' ? ['8', '16', '16t'] : [gridOpt === 'off' ? '16' : gridOpt], pen = { '8': 0, '16': 0.04, '16t': 0.07 };
    let bestG = null;
    for (const g of cand) { const fit = fitGrid(ts, ws, stepSec, g, opts.swing), c = fit.err + (cand.length > 1 ? pen[g] : 0); if (!bestG || c < bestG.c) bestG = { g, c, fit }; }
    const grid = gridOpt === 'off' ? 'off' : bestG.g, swing = bestG.g === '16' ? bestG.fit.swing : 0;
    let origin = bestG.fit.origin;
    const align = opts.align || 'smart';
    const first = (align === 'first' || (align === 'smart' && !loop));
    if (first) { const k = Math.round((ts[0] - origin) / stepSec); origin += k * stepSec; }
    else { while (origin > ts[0] + 0.25 * stepSec && !loop) origin -= 2 * stepSec; while (origin > stepSec) origin -= 2 * stepSec; while (origin <= -stepSec) origin += 2 * stepSec; }
    const posOf = t => { let s = (t - origin) / stepSec; if (loop) { s %= nSteps; if (s < 0) s += nSteps; } return s; };
    const unitTicks = Math.max(1, Math.round(GRID_UNIT[grid === 'off' ? '16' : grid] * TICKS));
    const tickOf = s => Math.round(snap(s, grid, swing).pos * TICKS);
    const maxLen = 12288, len = loop ? nSteps * TICKS : null;
    const out = [];
    for (const q of notes) {
      const s0 = posOf(q.s); let t0 = tickOf(s0);
      if (!loop && t0 < 0) t0 = 0; if (loop) { t0 %= len; if (t0 < 0) t0 += len; }
      const dSteps = Math.max(0, (q.e - q.s) / stepSec); let l = Math.max(unitTicks, Math.round(dSteps * TICKS / unitTicks) * unitTicks);
      if (grid === 'off') l = Math.max(2, Math.round(dSteps * TICKS));
      out.push({ t: t0, len: l, n: q.midi, vel: q.vel, s: q.s, e: q.e });
    }
    out.sort((a, b) => a.t - b.t || b.vel - a.vel);
    const dedup = []; for (const q of out) { const p = dedup[dedup.length - 1]; if (p && p.t === q.t) { if (q.len > p.len) { p.len = q.len; p.n = q.vel > p.vel ? q.n : p.n; } continue; } dedup.push(q); }
    // mono: a note ends where the next starts; a gap shorter than half a grid unit is closed (legato)
    for (let k = 0; k < dedup.length; k++) {
      const q = dedup[k], nx = dedup[k + 1], lim = nx ? nx.t : (loop ? len : Infinity);
      if (q.t + q.len > lim) q.len = Math.max(1, lim - q.t); else if (nx && lim - (q.t + q.len) < 0.5 * unitTicks && lim - (q.t + q.len) > 0) q.len = lim - q.t;
    }
    let length;
    if (loop) length = len; else { let end = 0; for (const q of dedup) end = Math.max(end, q.t + q.len); length = clamp(Math.ceil(end / 192 - 1e-9), 1, 64) * 192; }
    const final = dedup.filter(q => q.t < length).slice(0, 4096).map(q => ({ t: q.t, len: Math.max(1, Math.min(q.len, length - q.t)), n: q.n, vel: q.vel, s: q.s, e: q.e }));
    return { bpm, tempo: tempo.how, bars: Math.round(length / 192 * 1000) / 1000, grid, swing: Math.round(swing * 1000) / 1000, length, notes: final, origin, stepSec };
  }

  /** Whole pipeline. opts: { bpm, bars, grid, swing, align, sens (0..1), tuning } */
  function analyse(chs, sr, opts = {}) {
    const A = prepare(chs, sr); if (!A) return { error: 'silent' };
    const D = decimate(A.x, A.sr), env = envelope(D.y, D.fs), ons = envOnsets(env), P = pitchPlan(D.y, D.fs); P.run(0, P.frames);
    return finish({ A, D, env, ons, P }, opts);
  }
  function detect(pre, opts = {}) {
    const sens = clamp(fin(opts.sens, 0.5), 0, 1), gateRel = Math.pow(10, -(20 + 24 * sens) / 20);
    const tr = track(pre.P, gateRel), det = detectNotes(tr, pre.env, pre.ons, { rel: 18 + 30 * sens, tuning: opts.tuning, dnMax: fin(opts.dnMax, 0.1 + 0.3 * sens) });
    return { tr, ...det };
  }
  function finish(pre, opts = {}) {
    const d = detect(pre, opts); if (!d.notes.length) return { error: 'nonotes', dur: pre.A.dur };
    const q = quantize(d.notes, pre.A.dur, opts); if (q.error) return q;
    return { ...q, raw: d.notes, tuning: d.tuning, dur: pre.A.dur, truncated: pre.A.truncated };
  }

  return { VERSION, prepare, decimate, envelope, envOnsets, pitchPlan, track, detectNotes, detect, estimateTempo, fitGrid, snap, quantize, analyse, finish, hz2midi, midi2hz, CAL, TICKS, GRID_UNIT };
})();
// ==== BASS-ANALYSIS END ====

export const engine = BA;

// ---------------------------------------------------------------------------------------------
// Het apparaat
const WNAME = 'nl-patchkamer-bassfinder-1-20-0';
// Opvang: geeft het binnenkomende geluid (kanalen samengeteld) in blokken van 4096 frames door aan de pagina, alleen tijdens het opnemen
const WORKLET = `
class BFCap extends AudioWorkletProcessor {
  constructor() {
    super(); this.on = false; this.b = new Float32Array(4096); this.n = 0;
    this.port.onmessage = e => { const m = e.data || {}; if (m.t === 'start') { this.on = true; this.n = 0; } else if (m.t === 'stop') { this.flush(); this.on = false; } };
  }
  flush() { if (!this.n) return; const c = this.b.slice(0, this.n); this.n = 0; this.port.postMessage({ t: 'pcm', c }, [c.buffer]); }
  process(inputs) {
    if (!this.on) return true;
    const i = inputs[0]; if (!i || !i.length) return true; const len = i[0].length, k = i.length;
    for (let s = 0; s < len; s++) { let v = 0; for (let c = 0; c < k; c++) v += i[c][s]; this.b[this.n++] = v / k; if (this.n === 4096) this.flush(); }
    return true;
  }
}
registerProcessor('${WNAME}', BFCap);`;

const TXT = {
  nl: { load: 'Audiobestand laden…', record: 'Opnemen', stop: 'Stop', recLen: { b2: '2 maten', b4: '4 maten', b8: '8 maten', s5: '5 seconden', s10: '10 seconden', s20: '20 seconden' }, recLenLabel: 'Opnameduur',
    bpm: 'Tempo (BPM)', bpmAuto: 'auto', half: '÷2', dbl: '×2', bars: 'Maten', barsAuto: 'auto', grid: 'Raster', gridAuto: 'auto', grids: { '8': '1/8', '16': '1/16', '16t': 'triool 1/16', off: 'uit' },
    swing: 'Swing', swingAuto: 'auto', align: 'Eerste tel', alignSmart: 'slim', alignFirst: 'eerste noot op de maat', alignStart: 'begin van het geluid', sens: 'Gevoeligheid', shiftL: '◀ 1/16', shiftR: '1/16 ▶', shift: 'Patroon verschuiven',
    again: 'Opnieuw analyseren', clear: 'Wissen', play: 'Naar een synth sturen (klok)', level: 'Velocity', useTempo: 'Studiotempo gelijkzetten', saveClip: 'Clip bewaren (JSON)',
    del: 'Noot wissen', left: 'Noot eerder', right: 'Noot later', up: 'Halve toon omhoog', down: 'Halve toon omlaag', octUp: 'Octaaf omhoog', octDown: 'Octaaf omlaag', shorter: 'Korter', longer: 'Langer', add: 'Noot toevoegen',
    idle: 'Nog niets geladen. Laad een audiobestand of neem op uit de ingang.', busy: 'Analyseren…', recording: (s, t) => 'Opnemen… ' + s.toFixed(1) + ' / ' + t.toFixed(1) + ' s',
    notes: n => n + (n === 1 ? ' noot' : ' noten'), tuningTxt: c => 'stemming ' + (c > 0 ? '+' : '') + c + ' ct',
    summary: (bpm, how, bars, grid, swing, n, tun) => bpm.toFixed(1) + ' BPM (' + how + ') · ' + bars + (bars === 1 ? ' maat' : ' maten') + ' · raster ' + grid + ' · swing ' + Math.round(swing * 100) + '% · ' + n + (n === 1 ? ' noot' : ' noten') + (tun ? ' · ' + tun : ''),
    how: { given: 'opgegeven', bars: 'uit de lengte', estimated: 'geschat' },
    errSilent: 'Het geluid is stil of te kort om iets te herkennen.', errNoNotes: 'Er is geen noot herkend. Probeer een hogere gevoeligheid, of een geluid met een duidelijke toonhoogte.', errDecode: 'Dit audiobestand kon niet worden gelezen.', errBig: 'Het bestand is te groot (hoogstens 50 MiB).',
    errCtx: 'Deze browser kan hier geen audio decoderen.', errNoWorklet: 'Opnemen uit de ingang heeft AudioWorklet nodig, en dat is hier niet beschikbaar.', errNoAudio: 'Geen audio ontvangen. Verbind een bron met de ingang en probeer het opnieuw.',
    truncated: 'Alleen de eerste 90 seconden zijn gebruikt.',
    noPaste: 'Bass Finder maakt alleen clips; plakken kan hier niet.', clipName: 'Bass Finder', swingHint: 'Zet de swing van de studio op 0 als je de herkende swing gebruikt.',
    lowConf: 'Het tempo is geschat; staat het op de helft of het dubbele, gebruik dan ÷2 of ×2.', canvas: 'Pianorol met de herkende noten' },
  en: { load: 'Load audio file…', record: 'Record', stop: 'Stop', recLen: { b2: '2 bars', b4: '4 bars', b8: '8 bars', s5: '5 seconds', s10: '10 seconds', s20: '20 seconds' }, recLenLabel: 'Record length',
    bpm: 'Tempo (BPM)', bpmAuto: 'auto', half: '÷2', dbl: '×2', bars: 'Bars', barsAuto: 'auto', grid: 'Grid', gridAuto: 'auto', grids: { '8': '1/8', '16': '1/16', '16t': 'triplet 1/16', off: 'off' },
    swing: 'Swing', swingAuto: 'auto', align: 'Downbeat', alignSmart: 'smart', alignFirst: 'first note on the bar', alignStart: 'start of the sound', sens: 'Sensitivity', shiftL: '◀ 1/16', shiftR: '1/16 ▶', shift: 'Shift pattern',
    again: 'Analyse again', clear: 'Clear', play: 'Send to a synth (clock)', level: 'Velocity', useTempo: 'Set studio tempo to this', saveClip: 'Save clip (JSON)',
    del: 'Delete note', left: 'Note earlier', right: 'Note later', up: 'Semitone up', down: 'Semitone down', octUp: 'Octave up', octDown: 'Octave down', shorter: 'Shorter', longer: 'Longer', add: 'Add note',
    idle: 'Nothing loaded yet. Load an audio file or record from the input.', busy: 'Analysing…', recording: (s, t) => 'Recording… ' + s.toFixed(1) + ' / ' + t.toFixed(1) + ' s',
    notes: n => n + (n === 1 ? ' note' : ' notes'), tuningTxt: c => 'tuning ' + (c > 0 ? '+' : '') + c + ' ct',
    summary: (bpm, how, bars, grid, swing, n, tun) => bpm.toFixed(1) + ' BPM (' + how + ') · ' + bars + (bars === 1 ? ' bar' : ' bars') + ' · grid ' + grid + ' · swing ' + Math.round(swing * 100) + '% · ' + n + (n === 1 ? ' note' : ' notes') + (tun ? ' · ' + tun : ''),
    how: { given: 'given', bars: 'from the length', estimated: 'estimated' },
    errSilent: 'The sound is silent or too short to recognise anything.', errNoNotes: 'No note was recognised. Try a higher sensitivity, or a sound with a clear pitch.', errDecode: 'This audio file could not be read.', errBig: 'The file is too large (at most 50 MiB).',
    errCtx: 'This browser cannot decode audio here.', errNoWorklet: 'Recording from the input needs AudioWorklet, which is not available here.', errNoAudio: 'No audio received. Connect a source to the input and try again.',
    truncated: 'Only the first 90 seconds were used.',
    noPaste: 'Bass Finder only makes clips; pasting is not possible here.', clipName: 'Bass Finder', swingHint: 'Set the studio swing to 0 when you use the detected swing.',
    lowConf: 'The tempo is estimated; if it is half or double, use ÷2 or ×2.', canvas: 'Piano roll with the recognised notes' }
};

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const noteName = n => NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const BARS = [0, 1, 2, 3, 4, 6, 8, 12, 16], GRID_LIST = ['auto', '8', '16', '16t', 'off'], REC = ['b2', 'b4', 'b8', 's5', 's10', 's20'], ALIGN = ['smart', 'first', 'start'];
const MAXNOTES = 4096, MAXLEN = 12288, MAXFILE = 50 * 1024 * 1024;
const GRID_TICKS = { '8': 24, '16': 12, '16t': 8, off: 6 };
const DEFAULTS = { bpm: 0, bars: 0, grid: 'auto', swing: -1, align: 'smart', sens: 0.5, rec: 'b4', send: false, level: 0.9, name: '', clip: null };
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? cl(v, a, b) : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const int = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? cl(Math.round(v), a, b) : d;

// Een clip in de state: { name, bpm, length (tikken, 12 per zestiende), grid, swing, notes: [[tik, toonhoogte, lengte in tikken, velocity]], how, bars, tuning }. Alles wordt bij het laden gezuiverd.
function cleanClip(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.notes)) return null;
  const length = int(c.length, 12, MAXLEN, 0); if (!length || length % 12) return null;
  const notes = [], seen = new Set();
  for (const q of c.notes.slice(0, MAXNOTES)) {
    if (!Array.isArray(q)) continue; const t = int(q[0], 0, length - 1, -1), n = int(q[1], 0, 127, -1); if (t < 0 || n < 0 || seen.has(t)) continue;
    seen.add(t); notes.push([t, n, int(q[2], 1, length - t, 12), Math.round(num(q[3], 0.01, 1, 0.8) * 100) / 100]);
  }
  notes.sort((a, b) => a[0] - b[0]);
  return { name: typeof c.name === 'string' ? c.name.slice(0, 40) : '', bpm: num(c.bpm, 20, 400, 120), length, grid: pick(c.grid, ['8', '16', '16t', 'off'], '16'), swing: num(c.swing, 0, 0.6, 0),
    notes, how: pick(c.how, ['given', 'bars', 'estimated'], 'given'), bars: int(c.bars, 1, 64, Math.max(1, Math.round(length / 192))), tuning: num(c.tuning, -0.5, 0.5, 0) };
}

export default {
  id: 'nl.patchkamer.bass-finder', name: 'Bass Finder', about: { nl: 'Luistert naar een monofone baslijn (bas, sub of synthbas, geen akkoorden) en schrijft de noten op: toonhoogte, start, lengte en velocity. Laad een audiobestand (ook via de tab Samples), of neem een paar maten op uit de ingang, bijvoorbeeld van Audio Capture. De noten kun je corrigeren, naar een synth sturen en kopiëren naar een sequencer.\n\nKlik op een noot om hem te kiezen en sleep hem (rand rechts: lengte). Dubbelklik op een lege plek voegt een noot toe. Toetsen: Delete, pijlen (Shift = octaaf), [ en ] voor de lengte. De dunne omtrekken zijn wat er gevonden is voor het kwantiseren.', en: 'Listens to a monophonic bass line (bass, sub or synth bass, no chords) and writes down the notes: pitch, start, length and velocity. Load an audio file (also from the Samples tab) or record a few bars from the input, for example from Audio Capture. You can correct the notes, send them to a synth and copy them to a sequencer.\n\nClick a note to select it and drag it (right edge: length). Double-click an empty spot to add a note. Keys: Delete, arrows (Shift = octave), [ and ] for the length. The thin outlines are what was found before quantising.' }, version: '1.22.0', kind: 'utility', category: 'tool', ui: { width: 760, minWidth: 380 },
  i18n: { nl: { ports: { in: 'In', thru: 'Door', notes: 'Noten' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'thru', name: 'Through' }], eventIn: [], eventOut: [{ id: 'notes', name: 'Notes' }], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = { ...DEFAULTS }, dead = false, ui = null, shell = null, stopFrame = null, busy = false, msg = '', msgErr = false;
    let audio = null;             // { x: Float32Array (mono), sr, name, loop, info }
    let pre = null, result = null, rec = null, curStep = -1, stepIndex = [], runId = 0, node = null, pcmReady = false, sel = null, drag = null, extra = '';
    // Keten: ingang -> doorgang (ongewijzigd) en -> opvang
    const inG = ctx.createGain(), thru = ctx.createGain(); inG.connect(thru);
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const hostBpm = () => num(host && host.bpm, 20, 400, 120);

    // ---- opname uit de ingang ----
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('geen loadWorklet'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 2, channelCountMode: 'explicit' });
      node.port.onmessage = e => {
        const m = e.data || {}; if (!rec || m.t !== 'pcm' || !(m.c instanceof Float32Array)) return;
        rec.parts.push(m.c); rec.frames += m.c.length;
        if (rec.frames >= rec.target && !rec.stopping) finishRecording();
      };
      inG.connect(node); pcmReady = true;
    }).catch(() => { pcmReady = false; });
    function recTempo() { return state.bpm || hostBpm(); }
    function recSeconds() { const k = state.rec, n = parseInt(k.slice(1), 10); return k[0] === 'b' ? n * 240 / recTempo() : n; }
    function startRecording() {
      if (rec || busy) return; if (!pcmReady || !node) { setMsg(T.errNoWorklet, true); return; }
      const secs = Math.min(recSeconds(), 90); rec = { parts: [], frames: 0, target: Math.round(secs * ctx.sampleRate), secs, stopping: false, bars: state.rec[0] === 'b' ? parseInt(state.rec.slice(1), 10) : 0, bpm: recTempo() };
      setMsg('', false); node.port.postMessage({ t: 'start' }); paint();
    }
    function finishRecording() {
      const r = rec; if (!r || r.stopping) return; r.stopping = true; try { node.port.postMessage({ t: 'stop' }); } catch (e) { /* ok */ }
      setTimeout(() => {   // het laatste blok komt na 'stop' binnen
        if (rec !== r) return; rec = null;
        const n = Math.min(r.frames, r.target), x = new Float32Array(n); let o = 0;
        for (const p of r.parts) { const k = Math.min(p.length, n - o); if (k <= 0) break; x.set(p.subarray(0, k), o); o += k; }
        if (dead) return;
        audio = { x, sr: ctx.sampleRate, name: T.record, loop: r.bars > 0, info: r.bars ? { bars: r.bars, bpm: r.bpm } : {} };
        analyse();
      }, 60);
    }
    function stopRecording() { if (rec) finishRecording(); }

    // ---- bestand laden ----
    async function loadFiles(files, info) {
      if (dead) return; const f = files && files[0]; if (!f) return;
      if (f.size > MAXFILE) { setMsg(T.errBig, true); return; }
      if (typeof ctx.decodeAudioData !== 'function') { setMsg(T.errCtx, true); return; }
      busy = true; setMsg(T.busy, false); paint();
      try {
        const buf = await f.arrayBuffer(), ab = await ctx.decodeAudioData(buf);
        if (dead) return;
        const n = Math.min(ab.length, Math.floor(90 * ab.sampleRate)), x = new Float32Array(n), chs = ab.numberOfChannels;
        for (let c = 0; c < chs; c++) { const d = ab.getChannelData(c); for (let i = 0; i < n; i++) { const v = d[i]; if (v === v) x[i] += v / chs; } }
        const i2 = info && typeof info === 'object' ? info : {};
        audio = { x, sr: ab.sampleRate, name: String(i2.name || f.name || '').slice(0, 40), loop: i2.bars > 0, info: { bpm: num(i2.bpm, 20, 400, 0), bars: num(i2.bars, 0.25, 64, 0) } };
      } catch (e) { busy = false; setMsg(T.errDecode, true); paint(); return; }
      await analyse();
    }

    // ---- analyse ----
    const tick = () => new Promise(r => setTimeout(r, 0));
    async function analyse(reuse) {
      if (!audio || dead) return; const my = ++runId; busy = true; setMsg(T.busy, false); paint();
      try {
        if (!reuse || !pre) {
          const A = BA.prepare([audio.x], audio.sr);
          if (!A) { result = null; pre = null; busy = false; setMsg(T.errSilent, true); paint(); return; }
          const D = BA.decimate(A.x, A.sr), env = BA.envelope(D.y, D.fs), ons = BA.envOnsets(env), P = BA.pitchPlan(D.y, D.fs);
          for (let t = 0; t < P.frames; t += 800) { P.run(t, t + 800); if (P.frames > 1600) { await tick(); if (my !== runId || dead) return; } }
          pre = { A, D, env, ons, P };
        }
        const info = audio.info || {}, bars = state.bars || (info.bars ? Math.round(info.bars) : 0);
        const r = BA.finish(pre, { bpm: state.bpm || info.bpm || 0, bars, grid: state.grid, swing: state.swing < 0 ? 'auto' : state.swing, align: state.align, sens: state.sens });
        if (my !== runId || dead) return;
        busy = false;
        if (r.error) { result = null; state.clip = null; sel = null; indexClip(); setMsg(r.error === 'silent' ? T.errSilent : T.errNoNotes, true); paint(); return; }
        result = r; setClipFromResult(r); setMsg('', false); extra = r.truncated ? T.truncated : '';
      } catch (e) { busy = false; setMsg(T.errSilent, true); }
      paint();
    }
    function setClipFromResult(r) {
      sel = null;
      state.clip = cleanClip({ name: (audio && audio.name) || '', bpm: r.bpm, length: r.length, grid: r.grid, swing: r.swing, notes: r.notes.map(q => [q.t, q.n, q.len, q.vel]), how: r.tempo, bars: Math.max(1, Math.round(r.bars)), tuning: r.tuning });
      if (state.clip && state.clip.name === '') state.clip.name = T.clipName;
      indexClip();
    }
    function indexClip() {
      stepIndex = []; const c = state.clip; if (!c) return;
      const steps = c.length / 12; for (let i = 0; i < steps; i++) stepIndex.push([]);
      for (const q of c.notes) stepIndex[Math.min(steps - 1, Math.floor(q[0] / 12))].push(q);
    }
    function sortNotes() { const c = state.clip; if (c) c.notes.sort((a, b) => a[0] - b[0]); indexClip(); }
    function shiftClip(d) {
      const c = state.clip; if (!c) return; for (const q of c.notes) q[0] = (((q[0] + d * 12) % c.length) + c.length) % c.length;
      for (const q of c.notes) q[2] = Math.min(q[2], c.length - q[0]); sortNotes(); paint();
    }
    function setMsg(t, err) { msg = t || ''; msgErr = !!err; if (ui) { ui.status.textContent = msg; ui.status.classList.toggle('err', msgErr); } }

    // ---- noten bewerken ----
    const unit = () => { const c = state.clip; return c ? (GRID_TICKS[c.grid] || 12) : 12; };
    function dedupe(c) { const seen = new Map(); for (const q of c.notes) { const o = seen.get(q[0]); if (!o || q === sel) seen.set(q[0], q); } c.notes = c.notes.filter(q => seen.get(q[0]) === q); }
    function edit(fn) { const c = state.clip; if (!c || !sel || !c.notes.includes(sel)) return; fn(sel, c); dedupe(c); sortNotes(); paint(); }
    const move = d => edit((q, c) => { q[0] = cl(q[0] + d * unit(), 0, c.length - 1); q[2] = Math.min(q[2], c.length - q[0]); });
    const pitch = d => edit(q => { q[1] = cl(q[1] + d, 0, 127); });
    const stretch = d => edit((q, c) => { q[2] = cl(q[2] + d * unit(), 1, c.length - q[0]); });
    function remove() { const c = state.clip; if (!c || !sel) return; c.notes = c.notes.filter(q => q !== sel); sel = null; sortNotes(); paint(); }
    function addAt(t, n) { const c = state.clip; if (!c || c.notes.length >= MAXNOTES || c.notes.some(q => q[0] === t)) return; const q = [t, cl(n, 0, 127), Math.min(unit(), c.length - t), 0.8]; c.notes.push(q); sel = q; sortNotes(); paint(); }

    // ---- afspelen naar een synth ----
    const emit = ev => { try { host.emit(self, 'notes', ev); } catch (e) { /* ok */ } };
    // ---- klembord (contract §13d) ----
    function buildClip() {
      const c = state.clip; if (!c) return null;
      const notes = c.notes.slice(0, MAXNOTES).map(q => ({ t: q[0], n: q[1], len: Math.max(1, Math.min(q[2], c.length - q[0])), vel: cl(q[3], 0.01, 1) }));
      return { format: 'patchkamer-clip', formatVersion: 1, kind: 'notes', name: (c.name || T.clipName).slice(0, 40), length: c.length, grid: c.grid === 'off' || c.grid === '16t' ? 32 : 16,
        source: { device: 'nl.patchkamer.bass-finder', name: 'Bass Finder', version: '1.20.0', scheme: 'gm' }, swing: Math.min(0.5, c.swing), notes };
    }

    // ---- UI ----
    const CSS = ':host{display:block;color:var(--fg,#e2e6ea);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;background:var(--card,#15181d);border:1px solid var(--line,#39424e);border-radius:8px}' +
      '.warn{color:var(--muted,#97a1ad);line-height:1.4}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}label{display:flex;flex-direction:column;gap:3px;color:var(--muted,#97a1ad);font-size:11px}label.inl{flex-direction:row;align-items:center;gap:6px}' +
      'button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%}button{cursor:pointer}button:hover:not(:disabled){border-color:var(--acc,#4fd1c5)}button:disabled{opacity:.4;cursor:default}button.on{background:var(--acc,#4fd1c5);color:#111;border-color:var(--acc,#4fd1c5)}' +
      'input[type=number]{width:84px}input[type=checkbox]{padding:0}canvas{display:block;width:100%;background:var(--well,#0c0f13);border:1px solid var(--line,#39424e);border-radius:6px;cursor:crosshair;touch-action:none}canvas:focus-visible{outline:2px solid var(--acc,#4fd1c5)}' +
      '.status{min-height:16px;color:var(--event,#f4a261)}.status.err{color:#ff7b72}';
    function mkSelect(parent, label, items, onchange) { const l = el('label', label, parent); const s = el('select', null, l); s.setAttribute('aria-label', label); for (const [v, t] of items) { const o = el('option', t, s); o.value = String(v); } s.onchange = () => onchange(s.value); return s; }
    function mkBtn(parent, text, title, fn) { const b = el('button', text, parent); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.onclick = fn; return b; }
    function paint() {
      if (!ui) return; const c = state.clip;
      ui.rec.textContent = rec ? T.stop : T.record; ui.rec.classList.toggle('on', !!rec);
      ui.bpm.value = state.bpm ? String(state.bpm) : ''; ui.bars.value = String(state.bars); ui.grid.value = String(state.grid); ui.swing.value = state.swing < 0 ? 'auto' : String(Math.round(state.swing * 100)); ui.align.value = state.align;
      ui.recLen.value = state.rec; ui.send.checked = state.send;
      ui.sens.set && ui.sens.set(state.sens); ui.level.set && ui.level.set(state.level);
      const tun = c && Math.abs(c.tuning) >= 0.05 ? T.tuningTxt(Math.round(c.tuning * 100)) : '';
      ui.summary.textContent = c ? T.summary(c.bpm, T.how[c.how] || '', c.bars, T.grids[c.grid] || c.grid, c.swing, c.notes.length, tun) + (c.how === 'estimated' ? ' · ' + T.lowConf : '') + (extra ? ' · ' + extra : '') : T.idle;
      ui.status.textContent = msg; ui.status.classList.toggle('err', msgErr);
      const has = !!(c && sel && c.notes.includes(sel)); for (const b of ui.edit) b.disabled = !has; ui.addB.disabled = !c;
      for (const b of ui.needClip) b.disabled = !c;
      draw();
    }
    let pal = null, palAt = 0;
    function colors() { const now = performance.now(); if (pal && now - palAt < 1000) return pal; palAt = now; const q = (n, d) => { try { return getComputedStyle(ui.cv).getPropertyValue(n).trim() || d; } catch (e) { return d; } }; return pal = { well: q('--well', '#0c0f13'), line: q('--line', '#39424e'), acc: q('--acc', '#4fd1c5'), ev: q('--event', '#f4a261'), fg: q('--muted', '#97a1ad') }; }
    function rawTicks() {   // the notes as found, before quantising, in ticks of the clip
      const c = state.clip; if (!c || !result || !result.raw) return []; const loop = !!(audio && audio.loop), pos = x => (x - result.origin) / result.stepSec * 12, out = [];
      for (const q of result.raw) { let s = pos(q.s); if (loop) s = ((s % c.length) + c.length) % c.length; else s = Math.max(0, s); out.push([s, q.midi, Math.max(1, (q.e - q.s) / result.stepSec * 12)]); }
      return out;
    }
    function draw() {
      if (!ui || !ui.cv) return; const cv = ui.cv, c = state.clip; const dpr = cl(Number(globalThis.devicePixelRatio) || 1, 1, 3), w = Math.max(260, Math.min(1400, cv.clientWidth || 600));
      let lo = 36, hi = 60; if (c && c.notes.length) { lo = Math.min(...c.notes.map(q => q[1])) - 2; hi = Math.max(...c.notes.map(q => q[1])) + 2; }
      if (hi - lo < 11) { const m = Math.round((hi + lo) / 2); lo = m - 6; hi = m + 5; } lo = Math.max(0, lo); hi = Math.min(127, hi);
      const rows = hi - lo + 1, rh = cl(Math.floor(240 / rows), 6, 16), h = Math.max(60, rows * rh + 8);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; }
      const g = cv.getContext && cv.getContext('2d'); if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); const P = colors(); g.fillStyle = P.well; g.fillRect(0, 0, w, h);
      if (!c) return;
      const lab = 44, cw = (w - lab - 6) / c.length, top = 4; g.font = '10px monospace'; g.textBaseline = 'middle';
      for (let n = lo; n <= hi; n++) { const y = top + (hi - n) * rh; if (n % 12 === 0 || n === lo || (rh >= 10 && [0, 2, 4, 5, 7, 9, 11].includes(n % 12))) { g.globalAlpha = n % 12 === 0 ? 0.8 : 0.45; g.fillStyle = P.fg; g.fillText(noteName(n), 4, y + rh / 2); } g.globalAlpha = [1, 3, 6, 8, 10].includes(n % 12) ? 0.18 : 0.06; g.fillStyle = P.line; g.fillRect(lab, y, w - lab - 6, rh); }
      g.globalAlpha = 1;
      for (let tk = 0; tk <= c.length; tk += 12) { const x = lab + tk * cw; g.strokeStyle = P.line; g.globalAlpha = tk % 192 === 0 ? 0.9 : tk % 48 === 0 ? 0.5 : 0.18; g.beginPath(); g.moveTo(x, 2); g.lineTo(x, h - 2); g.stroke(); }
      g.globalAlpha = 0.55; g.strokeStyle = P.fg; for (const [s, n, l] of rawTicks()) { if (n < lo || n > hi) continue; g.strokeRect(lab + s * cw + 0.5, top + (hi - n) * rh + 1.5, Math.max(2, l * cw - 1), rh - 3); }
      for (const q of c.notes) { if (q[1] < lo || q[1] > hi) continue; const x = lab + q[0] * cw, y = top + (hi - q[1]) * rh; g.globalAlpha = 0.3 + 0.7 * q[3]; g.fillStyle = q === sel ? P.ev : P.acc; g.fillRect(x, y + 1, Math.max(3, q[2] * cw - 1), rh - 2); }
      g.globalAlpha = 1;
      if (curStep >= 0 && curStep * 12 < c.length) { g.fillStyle = P.ev; g.globalAlpha = 0.9; g.fillRect(lab + curStep * 12 * cw, 2, Math.max(2, 12 * cw), 3); g.globalAlpha = 1; }
      ui.geo = { lab, cw, rh, top, lo, hi, w, scale: cv.clientWidth ? w / cv.clientWidth : 1 };
    }
    function hit(e) {   // note under the pointer: { q, edge, tk, n }, q is null for an empty cell
      const c = state.clip, G = ui && ui.geo; if (!c || !G) return null; const r = ui.cv.getBoundingClientRect(), x = (e.clientX - r.left) * G.scale, y = e.clientY - r.top;
      const tk = (x - G.lab) / G.cw, n = G.hi - Math.floor((y - G.top) / G.rh);
      for (const q of c.notes) { if (q[1] !== n) continue; if (tk >= q[0] - 0.5 && tk <= q[0] + q[2] + 0.5) return { q, edge: (q[0] + q[2] - tk) * G.cw / G.scale < 6 && q[2] * G.cw / G.scale > 12, tk, n }; }
      return { q: null, tk, n };
    }
    function onDown(e) {
      const c = state.clip; if (!c || !ui.geo) return; ui.cv.focus && ui.cv.focus(); const h = hit(e); if (!h) return;
      if (h.q) { sel = h.q; drag = { q: h.q, mode: h.edge ? 'len' : 'move', x: e.clientX, y: e.clientY, t: h.q[0], n: h.q[1], l: h.q[2] }; try { ui.cv.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } } else sel = null;
      paint();
    }
    function onMove(e) {
      if (!drag || !ui || !ui.geo) return; const c = state.clip, G = ui.geo, u = unit(); const dx = (e.clientX - drag.x) * G.scale / G.cw, dy = (e.clientY - drag.y) / G.rh;
      if (drag.mode === 'len') drag.q[2] = cl(drag.l + Math.round(dx / u) * u, 1, c.length - drag.q[0]);
      else { drag.q[0] = cl(drag.t + Math.round(dx / u) * u, 0, c.length - 1); drag.q[1] = cl(drag.n - Math.round(dy), 0, 127); drag.q[2] = Math.min(drag.q[2], c.length - drag.q[0]); }
      draw();
    }
    function onUp() { if (!drag) return; drag = null; const c = state.clip; if (c) { dedupe(c); sortNotes(); } paint(); }
    function onDbl(e) { const h = hit(e); if (!h || h.q) return; const u = unit(); addAt(cl(Math.floor(h.tk / u) * u, 0, state.clip.length - 1), h.n); }
    function onKey(e) {
      const k = e.key, big = e.shiftKey; let used = true;
      if (k === 'Delete' || k === 'Backspace') remove(); else if (k === 'ArrowLeft') move(-1); else if (k === 'ArrowRight') move(1);
      else if (k === 'ArrowUp') pitch(big ? 12 : 1); else if (k === 'ArrowDown') pitch(big ? -12 : -1); else if (k === '[') stretch(-1); else if (k === ']') stretch(1); else used = false;
      if (used) { e.preventDefault(); e.stopPropagation(); }
    }
    function frame() {
      if (!ui) return; if (rec) { ui.status.textContent = T.recording(rec.frames / ctx.sampleRate, rec.secs); ui.status.classList.remove('err'); }
      draw();
    }

    const self = {
      inputs: { in: inG }, outputs: { thru },
      mount(root) {
        if (dead) return; self.unmount(); shell = el('div', null, root); const sh = shell.attachShadow({ mode: 'open' }); el('style', CSS, sh);
        const app = el('div', null, sh, 'app');
        const r1 = el('div', null, app, 'row');
        const file = el('input', null, r1); file.type = 'file'; file.accept = 'audio/*,.wav,.mp3,.flac,.ogg'; file.style.display = 'none'; file.setAttribute('aria-label', T.load);
        const loadB = el('button', T.load, r1); loadB.type = 'button'; loadB.onclick = () => file.click(); file.onchange = () => { if (file.files && file.files.length) loadFiles(Array.from(file.files), { name: file.files[0].name }); file.value = ''; };
        const recLen = mkSelect(r1, T.recLenLabel, REC.map(k => [k, T.recLen[k]]), v => { state.rec = pick(v, REC, 'b4'); });
        const recB = el('button', T.record, r1); recB.type = 'button'; recB.onclick = () => (rec ? stopRecording() : startRecording());
        const r2 = el('div', null, app, 'row');
        const lb = el('label', T.bpm, r2); const bpm = el('input', null, lb); bpm.type = 'number'; bpm.min = '40'; bpm.max = '300'; bpm.step = '0.1'; bpm.placeholder = T.bpmAuto; bpm.setAttribute('aria-label', T.bpm);
        bpm.onchange = () => { const v = parseFloat(bpm.value); state.bpm = Number.isFinite(v) && v >= 40 ? cl(v, 40, 300) : 0; if (audio) analyse(true); else paint(); };
        const hb = el('button', T.half, r2); hb.type = 'button'; hb.onclick = () => { const c = state.clip; if (c) { state.bpm = Math.round(c.bpm / 2 * 10) / 10; if (state.bpm < 40) state.bpm = 0; analyse(true); } };
        const db = el('button', T.dbl, r2); db.type = 'button'; db.onclick = () => { const c = state.clip; if (c) { state.bpm = Math.min(300, Math.round(c.bpm * 2 * 10) / 10); analyse(true); } };
        const bars = mkSelect(r2, T.bars, BARS.map(b => [b, b ? String(b) : T.barsAuto]), v => { state.bars = pick(parseInt(v, 10), BARS, 0); if (audio) analyse(true); });
        const grid = mkSelect(r2, T.grid, GRID_LIST.map(g => [g, g === 'auto' ? T.gridAuto : T.grids[g]]), v => { state.grid = pick(v, GRID_LIST, 'auto'); if (audio) analyse(true); });
        const swing = mkSelect(r2, T.swing, [['auto', T.swingAuto], ...[0, 10, 20, 33, 50].map(p => [p, p + '%'])], v => { state.swing = v === 'auto' ? -1 : cl(parseInt(v, 10) / 100, 0, 0.6); if (audio) analyse(true); });
        const align = mkSelect(r2, T.align, [['smart', T.alignSmart], ['first', T.alignFirst], ['start', T.alignStart]], v => { state.align = pick(v, ALIGN, 'smart'); if (audio) analyse(true); });
        const r3 = el('div', null, app, 'row');
        const sensH = el('div', null, r3); const sens = host.ui.knob(sensH, T.sens, [0, 1, 0.01], state.sens, v => Math.round(v * 100) + '%', v => { state.sens = v; }, { def: 0.5 });
        sensH.addEventListener('change', () => { if (audio) analyse(true); }); sensH.addEventListener('pointerup', () => { if (audio) analyse(true); });
        const again = el('button', T.again, r3); again.type = 'button'; again.onclick = () => analyse(true);
        const sl = el('button', T.shiftL, r3); sl.type = 'button'; sl.title = T.shift; sl.onclick = () => shiftClip(-1);
        const sr = el('button', T.shiftR, r3); sr.type = 'button'; sr.title = T.shift; sr.onclick = () => shiftClip(1);
        const clr = el('button', T.clear, r3); clr.type = 'button'; clr.onclick = () => { runId++; audio = null; pre = null; result = null; state.clip = null; sel = null; stepIndex = []; busy = false; extra = ''; setMsg('', false); paint(); };
        const summary = el('div', null, app, 'status'); summary.style.color = 'var(--fg,#e2e6ea)';
        const cv = el('canvas', null, app); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', T.canvas); cv.tabIndex = 0;
        cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp); cv.addEventListener('dblclick', onDbl); cv.addEventListener('keydown', onKey);
        const re = el('div', null, app, 'row'), edits = [];
        edits.push(mkBtn(re, '✕', T.del, remove), mkBtn(re, '◀', T.left, () => move(-1)), mkBtn(re, '▶', T.right, () => move(1)), mkBtn(re, '♭', T.down, () => pitch(-1)), mkBtn(re, '♯', T.up, () => pitch(1)),
          mkBtn(re, '8vb', T.octDown, () => pitch(-12)), mkBtn(re, '8va', T.octUp, () => pitch(12)), mkBtn(re, '−', T.shorter, () => stretch(-1)), mkBtn(re, '+', T.longer, () => stretch(1)));
        const addB = mkBtn(re, '＋', T.add, () => { const c = state.clip; if (!c) return; const used = new Set(c.notes.map(q => q[0])), u = unit(); let t = 0; while (used.has(t) && t < c.length - 1) t += u; addAt(Math.min(t, c.length - 1), c.notes.length ? c.notes[c.notes.length - 1][1] : 36); });
        const r4 = el('div', null, app, 'row');
        const lsend = el('label', null, r4); lsend.className = 'inl'; const send = el('input', null, lsend); send.type = 'checkbox'; el('span', T.play, lsend); send.onchange = () => { state.send = send.checked; };
        const levH = el('div', null, r4); const level = host.ui.knob(levH, T.level, [0.1, 1, 0.01], state.level, v => Math.round(v * 100) + '%', v => { state.level = v; }, { def: 0.9 });
        const useB = el('button', T.useTempo, r4); useB.type = 'button'; useB.onclick = () => { const c = state.clip; if (c && typeof host.setTempo === 'function') host.setTempo(Math.round(c.bpm * 10) / 10); };
        const saveB = el('button', T.saveClip, r4); saveB.type = 'button'; saveB.onclick = () => { const cp = buildClip(); if (cp && typeof host.saveFile === 'function') host.saveFile((cp.name || 'bass-finder').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.patchkamer-clip.json', JSON.stringify(cp, null, 1)); };
        el('div', T.swingHint, app, 'warn'); const status = el('div', null, app, 'status'); sh.addEventListener('pointerdown', e => e.stopPropagation()); sh.addEventListener('keydown', e => e.stopPropagation());
        ui = { rec: recB, recLen, bpm, bars, grid, swing, align, sens, level, send, summary, status, cv, geo: null, edit: edits, addB, needClip: [hb, db, sl, sr, useB, saveB] }; paint();
        stopFrame = host.frame(self, frame, 20);
      },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = ui = null; },
      onStep(info) {
        try {
          if (dead || !state.send || !state.clip || !info) return; const c = state.clip, steps = c.length / 12, pos = (((Math.floor(info.bar) || 0) * 16 + (Math.floor(info.step) || 0)) % steps + steps) % steps;
          curStep = pos; const sd = Number.isFinite(info.stepDur) && info.stepDur > 0 ? info.stepDur : 0.125, t0 = Number.isFinite(info.time) ? info.time : ctx.currentTime;
          const extraT = (pos % 2 === 1 && !(info.swing > 0)) ? c.swing * sd : 0;
          for (const q of stepIndex[pos] || []) emit({ type: 'note', note: q[1], vel: cl(q[3] * state.level, 0.01, 1), time: t0 + ((q[0] % 12) / 12) * sd + extraT, dur: Math.max(0.02, q[2] / 12 * sd * 0.97) });
        } catch (e) { /* de planner mag niet vallen */ }
      },
      loadAudio(files, info) { return loadFiles(files, info).catch(() => { setMsg(T.errDecode, true); }); },
      clipInfo() { try { const c = state.clip; if (!c || !c.notes.length) return null; return { name: (c.name || T.clipName).slice(0, 40), copy: ['notes'], paste: [], length: { min: 12, max: MAXLEN, step: 12, current: c.length, shared: true }, grid: [16, 32], poly: 1, scheme: 'gm', maxEvents: MAXNOTES }; } catch (e) { return null; } },
      getClip() { try { const c = buildClip(); return c && c.notes.length ? c : null; } catch (e) { return null; } },
      setClip() { return { ok: false, reason: T.noPaste }; },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) {
        if (dead) return; s = s && typeof s === 'object' ? s : {};
        state = { bpm: num(s.bpm, 0, 300, 0) >= 40 ? num(s.bpm, 0, 300, 0) : 0, bars: pick(s.bars, BARS, DEFAULTS.bars), grid: pick(s.grid, GRID_LIST, DEFAULTS.grid), swing: s.swing === -1 ? -1 : num(s.swing, 0, 0.6, -1),
          align: pick(s.align, ALIGN, DEFAULTS.align), sens: num(s.sens, 0, 1, DEFAULTS.sens), rec: pick(s.rec, REC, DEFAULTS.rec), send: typeof s.send === 'boolean' ? s.send : DEFAULTS.send,
          level: num(s.level, 0.1, 1, DEFAULTS.level), name: '', clip: cleanClip(s.clip) };
        sel = null; indexClip(); paint();
      },
      getPreset() { const p = self.getState(); delete p.clip; delete p.name; delete p.send; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, ...p, clip: s.clip, send: s.send }); },
      destroy() { if (dead) return; dead = true; runId++; self.unmount(); try { if (node) node.port.postMessage({ t: 'stop' }); } catch (e) { /* ok */ } for (const n of [inG, thru, node]) { try { n && n.disconnect(); } catch (e) { /* ok */ } } rec = null; audio = null; pre = null; }
    };
    return self;
  }
};
