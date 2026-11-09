// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.22.0 — Uitleg naar about (menu Over Drum Listener); de UI toont geen uitlegtekst meer.
// 1.21.0 — Titel in de UI verwijderd: de kaartbalk toont de naam.
// 1.20.0 — Eerste versie. Drum Listener luistert naar een drumloop en schrijft op wat er gespeeld wordt: kick, snare (met clap en rim), gesloten en open hat,
//          toms en overige percussie op eigen banen. Bron: een audiobestand (knop, of de tab Samples via loadAudio, met tempo en maten van het sample) of
//          een opname van een paar maten uit de ingang (bijvoorbeeld van Audio Capture). De analyse draait lokaal in de pagina, zonder dienst op internet:
//          onsetdetectie op een spectrogram met 40 banden, per slag 15 kenmerken (energie per frequentiegebied voor, midden en einde van de slag),
//          en een klein neuraal netwerk (15 invoeren, 24 verborgen eenheden) dat per slag zegt welke instrumenten meespelen (kick, snare-familie, hat-familie,
//          percussie), met daarna kleine logistische modellen voor open/gesloten hat, clap/rim en tom. Daarna tempo (opgegeven, uit de lengte of geschat), fase, swing en raster (1/16, 1/32, triolen) en een
//          velocity per slag. Het resultaat is een patroon met banen in het formaat patchkamer-clip (kind drums, 12 tikken per zestiende): kopieer het
//          met de knop Kopieer van de host en plak het in Pattern Tracker, Clip Arranger of Step Sequencer; of stuur het met de klok naar een drumcomputer
//          (noten volgens General MIDI of trigs op soort). De gewichten van de modellen (MODEL) zijn getraind op Break Loops en op gerenderde grooves van
//          Drum Kit en Pulse Drums; echte opnames zijn niet getest.
// Drum Listener — van audio naar een drumpatroon · Patchkamer contract v1.22

const MODEL = {"mu":[-3.588,-3.351,-2.504,-2.347,-2.073,-2.258,-2.417,-2.839,-4.966,-4.127,-3.321,-3.065,-1.081,-0.602,-0.695,-0.606,-1.667],"sd":[2.759,2.507,2.122,2.023,1.813,1.852,1.938,2.156,2.757,2.302,1.856,1.773,2.567,1.446,0.756,0.389,1.829],"mlp":{"h":24,"W1":[-0.095,-0.365,0.013,-0.113,-0.133,0.002,0.046,0.108,-0.091,0.136,0.061,0.199,-0.292,-1.463,0.079,-0.249,0.423,0.036,0.022,-0.22,-0.464,-0.131,0.101,-0.063,0.615,0.057,-0.128,-0.17,-0.738,0.177,0.365,0.009,-0.172,-0.171,-0.252,-0.143,0.117,-0.829,1.678,0.17,0.053,-0.245,-0.229,0.237,0.037,0.462,-0.159,-0.102,0.136,0.742,-0.003,-0.312,0.105,-0.157,0.119,0.236,-0.069,0.352,-0.26,0.143,-0.037,-0.679,1.12,0.022,-0.422,-0.158,-0.207,0.587,0.822,-0.172,0.359,-0.061,1.278,-1.752,0.081,-1.032,0.157,0.201,-0.555,0.254,-0.196,0.269,-0.155,0.132,-0.458,-0.16,0.163,0.457,-0.071,0.094,-0.152,-0.007,0.486,-1.286,0.116,0.124,0.723,-0.482,0.2,-0.948,0.137,-0.126,-0.296,0.344,0.677,0.736,-0.122,0.42,-0.594,-0.216,-0.176,-0.011,-0.428,0.212,-0.36,-0.503,0.015,0.373,-0.002,0.016,0.064,0.12,-0.083,0.068,0.16,0.748,-0.054,-0.656,0.576,0.614,-0.113,0.376,0.484,-0.301,-0.108,0.126,0.947,-0.317,-0.324,0.671,0.396,0.267,0.417,0.03,-0.343,-0.002,-0.9,0.946,0.77,0.467,0.197,-0.218,0.566,-0.153,-0.022,-0.141,0.718,0.057,-0.501,-0.475,0.918,-0.303,-0.439,0.811,0.271,0.159,0.055,-0.138,0.344,-0.432,2.191,0.624,-0.694,0.109,0.177,0.587,-0.711,0.227,-0.023,-0.714,0.985,0.015,1.062,0.361,-0.132,0.444,-0.808,0.68,0.072,0.042,-1.863,0.051,0.014,0.115,0.045,-0.233,-0.365,0.39,0.006,-0.499,-0.25,-0.116,0.074,1.247,-0.206,-0.178,0.094,-1.137,0.162,0.594,-0.041,-0.167,0.262,0.564,0.246,1.185,0.143,-0.702,0.2,-0.055,0.213,-0.521,-0.541,-0.715,0.294,0.678,-0.331,0.427,-0.243,0.056,-0.059,-0.329,-0.144,1.068,-0.036,-0.457,-0.676,0.123,-0.163,-1.101,-0.095,0.071,-0.041,0.166,-0.004,0.077,-0.02,0.685,-0.765,0.621,-0.842,0.397,0.513,0.276,0.2,-0.145,0.239,0.222,-0.028,0.31,-0.571,0.059,-0.22,-1.036,-0.428,0.299,0.014,0.196,-0.427,-0.271,0.262,0.339,-0.44,-0.395,0.953,-0.339,-0.092,-0.044,-0.176,-0.092,0.365,-0.306,-0.346,0.122,-0.098,0.191,0.131,-0.554,-0.067,0.01,-0.11,-0.166,0.069,0.134,0.31,0.282,-0.267,0.301,-0.55,0.375,0.041,-0.059,0.017,-0.123,-0.019,-0.033,0.343,0.001,0.086,-0.108,-0.079,-0.61,0.166,0.098,0.121,-0.107,-0.129,0.075,0.254,0.396,0.196,-0.3,-0.586,0.592,-0.298,0.127,-0.157,-0.097,-0.226,-0.103,-0.263,-0.303,-0.008,0.31,0.046,0.43,-0.535,0.293,0.61,0.003,-0.468,0.308,0.491,-0.092,0.06,-0.435,-0.166,0.027,-0.225,0.541,-0.553,0.913,-0.907,0.459,0.29,-0.077,0.215,0.123,0.066,0.549,-0.202,0.196,-0.244,0.0,-0.489,-0.22,-0.491,0.358,0.129,0.43,0.432,-0.229,0.164,-0.224,-0.211,-0.313,-0.386,-0.413,0.01,-0.139,0.096,0.127,0.392,0.439,-0.448,0.128,-0.406,0.252,-0.239,0.441,0.039,-0.447,0.32,-0.312,-0.085,0.261,-0.146,0.456,0.197,-0.192,0.083,0.666,-0.424,-0.319,-0.071,-0.382,-1.012,0.112],"b1":[-0.243,1.757,-0.697,0.662,-0.888,1.592,-0.099,0.11,-0.885,-0.892,0.785,0.558,-1.825,3.533,-3.443,1.511,-0.37,-0.2,-0.465,-0.152,-0.021,2.323,2.598,-1.48],"W2":[-0.224,0.878,-0.051,0.773,-0.602,0.667,0.13,-0.714,1.185,0.768,1.666,0.567,-0.583,1.369,-0.02,0.502,0.495,-0.309,0.132,-0.669,0.526,0.133,0.651,0.54,0.555,-0.173,-0.298,0.699,-0.181,0.904,0.528,0.209,-0.233,0.949,0.191,0.917,-0.189,0.419,-0.225,1.017,-0.251,-0.237,-0.166,0.834,-0.501,-0.702,-0.478,-0.587,-1.55,0.921,0.074,-0.752,-1.642,0.259,-1.017,-0.135,2.206,0.212,-0.459,-1.248,-1.305,-0.267,-0.533,-0.403,0.349,0.968,0.234,-0.78,-1.122,0.556,-0.53,0.361,0.109,0.89,0.38,0.845,0.025,-0.947,0.459,0.533,0.113,0.851,-0.371,0.049,0.083,-0.177,0.164,-1.591,0.978,1.224,-1.769,0.474,-0.118,-0.422,-0.008,-1.514],"b2":[-0.102,-1.717,2.459,-2.291]},"sub":{"open":[0.214,-0.139,-0.009,-0.015,-0.162,-0.122,-0.035,0.272,-0.171,-0.485,0.397,0.341,-0.063,0.14,0.237,-0.105,0.136,-1.184],"clap":[0.021,0.346,-0.226,-0.298,-0.653,0.539,1.061,-0.755,-0.091,-0.261,-0.224,0.111,-0.023,0.024,-0.073,-0.06,-0.008,-0.455],"rim":[0.154,-0.236,-0.428,-0.117,1.355,-0.796,-0.851,0.317,0.294,0.219,-0.295,-0.068,-0.378,0.408,0.155,-0.272,0.409,0.194],"tom":[-0.957,0.407,0.877,0.003,-0.472,-0.491,0.056,-0.263,0.473,0.454,-0.503,-0.207,0.821,-1.099,0.169,0.37,0.272,-3.274]}};

// ---------------------------------------------------------------------------------------------
// Analyse (zuivere functies op Float32Array; geen afhankelijkheden)
const E_MAXSEC = 90;      // analysis cap (seconds)
const NB = 40;            // bands
const BLK = [[1, 4], [8, 12], [20, 30]];    // frame offsets (relative to the onset frame): attack, middle, late

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

function makeFFT(n) {
  const rev = new Uint32Array(n), cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  const bits = Math.round(Math.log2(n));
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b); rev[i] = r; }
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = -Math.sin(2 * Math.PI * i / n); }
  return (re, im) => {
    for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let s = 0; s < n; s += size) {
        for (let k = 0, w = 0; k < half; k++, w += step) {
          const a = s + k, b = a + half, tr = re[b] * cos[w] - im[b] * sin[w], ti = re[b] * sin[w] + im[b] * cos[w];
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
  };
}

/** Mono, finite, normalised signal. Returns null for silence. */
function prepare(chs, sr, loop) {
  const list = (Array.isArray(chs) ? chs : [chs]).filter(c => c && c.length);
  if (!list.length || !(sr > 1000)) return null;
  let n = Math.min(...list.map(c => c.length)); n = Math.min(n, Math.floor(E_MAXSEC * sr));
  const x = new Float32Array(n);
  for (const c of list) for (let i = 0; i < n; i++) { const v = c[i]; if (v === v && v > -1e6 && v < 1e6) x[i] += v / list.length; }
  // slow DC removal (one-pole high-pass at ~15 Hz)
  const a = Math.exp(-2 * Math.PI * 15 / sr); let m = x[0], peak = 0;
  for (let i = 0; i < n; i++) { m = a * m + (1 - a) * x[i]; x[i] -= m; const v = Math.abs(x[i]); if (v > peak) peak = v; }
  if (!(peak > 1e-4) || n < sr * 0.15) return null;
  // a few absurd spikes must not decide the level: limit to 8 times the 99.5th percentile of the magnitude
  const step = Math.max(1, Math.floor(n / 20000)), mags = []; for (let i = 0; i < n; i += step) mags.push(Math.abs(x[i])); mags.sort((p, q) => p - q);
  const lim = Math.max(8 * mags[Math.floor(mags.length * 0.995)], 1e-6); let pk2 = 0;
  for (let i = 0; i < n; i++) { if (x[i] > lim) x[i] = lim; else if (x[i] < -lim) x[i] = -lim; const v = Math.abs(x[i]); if (v > pk2) pk2 = v; }
  const g = 1 / (pk2 || 1); for (let i = 0; i < n; i++) x[i] *= g;
  // front pad of 0.12 s so that a hit on the first sample is seen: the tail of a loop, otherwise silence
  const pad = Math.round(0.12 * sr), y = new Float32Array(n + pad);
  y.set(x, pad); if (loop) for (let i = 0; i < pad; i++) y[i] = x[n - pad + i];
  return { x: y, sr, n: n + pad, pad, peak, len: n };
}

/** Band magnitudes: { M[b][t] (Float32Array per band), frames, hop, N } */
function spectrogramPlan(sig) {
  const { x, sr, n } = sig;
  const N = sr > 50000 ? 2048 : 1024, hop = Math.round(sr * 0.004), fft = makeFFT(N);
  const frames = Math.max(1, Math.floor((n - N) / hop) + 1 + 2);
  const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  // triangular band weights on log-spaced centres
  const fmax = Math.min(16000, sr * 0.45), fmin = 40, cen = [];
  for (let b = 0; b < NB; b++) cen.push(fmin * Math.pow(fmax / fmin, b / (NB - 1)));
  const binHz = sr / N, K = N / 2 + 1, wts = [];
  for (let b = 0; b < NB; b++) {
    const lo = b ? cen[b - 1] : cen[0] / 1.17, hi = b < NB - 1 ? cen[b + 1] : cen[b] * 1.17;
    const l = Math.min(lo, cen[b] - binHz), h = Math.max(hi, cen[b] + binHz), idx = [], w = [];
    let s = 0;
    for (let k = Math.max(1, Math.floor(l / binHz)); k <= Math.min(K - 1, Math.ceil(h / binHz)); k++) {
      const f = k * binHz, v = f < cen[b] ? (f - l) / (cen[b] - l) : (h - f) / (h - cen[b]);
      if (v > 0) { idx.push(k); w.push(v); s += v * v; }
    }
    s = Math.sqrt(s) || 1; wts.push({ idx: Int32Array.from(idx), w: Float64Array.from(w.map(v => v / s)) });
  }
  const M = []; for (let b = 0; b < NB; b++) M.push(new Float32Array(frames));
  const re = new Float64Array(N), im = new Float64Array(N);
  const frameAt = (t, off) => { const s = t * hop - Math.floor(N / 4) + off; return s; };
  // two real frames per complex FFT; run(t0, t1) fills frames t0 .. t1-1 (t0 even), so a long file can be done in slices
  const run = (t0, t1) => {
    for (let t = t0; t < Math.min(t1, frames); t += 2) {
      const s0 = frameAt(t, 0), s1 = frameAt(t + 1, 0);
      for (let i = 0; i < N; i++) {
        const i0 = s0 + i, i1 = s1 + i;
        re[i] = (i0 >= 0 && i0 < n ? x[i0] : 0) * win[i]; im[i] = (i1 >= 0 && i1 < n ? x[i1] : 0) * win[i];
      }
      fft(re, im);
      for (let b = 0; b < NB; b++) {
        const { idx, w } = wts[b]; let p0 = 0, p1 = 0;
        for (let j = 0; j < idx.length; j++) {
          const k = idx[j], nk = N - k, ar = 0.5 * (re[k] + re[nk]), ai = 0.5 * (im[k] - im[nk]), br = 0.5 * (im[k] + im[nk]), bi = -0.5 * (re[k] - re[nk]);
          p0 += w[j] * w[j] * (ar * ar + ai * ai); p1 += w[j] * w[j] * (br * br + bi * bi);
        }
        M[b][t] = Math.sqrt(p0); if (t + 1 < frames) M[b][t + 1] = Math.sqrt(p1);
      }
    }
  };
  return { M, frames, hop, N, sr, cen, off: Math.floor(N / 4), run };
}
function spectrogram(sig) { const p = spectrogramPlan(sig); p.run(0, p.frames); return p; }

/** Log-compressed bands, onset novelty (all bands, low group, high group) and peak picking. */
function pickPeaks(nov, frames, hop, sr, sens) {
  const sorted = Array.from(nov).sort((a, b) => a - b), p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const w = Math.round(0.75 / (hop / sr)), cs = new Float64Array(frames + 1);
  for (let t = 0; t < frames; t++) cs[t + 1] = cs[t] + nov[t];
  const floor = 0.06 * p95 + 0.01, k = 1.2 + (1 - sens) * 2.2, pk = [], R = 2;
  for (let t = 2; t < frames - 1; t++) {
    const a = Math.max(0, t - w), b = Math.min(frames, t + w + 1), mean = (cs[b] - cs[a]) / (b - a);
    const thr = Math.max(floor * (0.6 + (1 - sens)), k * mean * 0.6 + 0.05 * p95 * (1 - sens)), v = nov[t];
    if (v < thr) continue;
    let ok = true; for (let j = -R; j <= R; j++) { const u = t + j; if (u >= 0 && u < frames && u !== t && (nov[u] > v || (nov[u] === v && u < t))) { ok = false; break; } }
    if (ok) pk.push(t);
  }
  return pk;
}
function onsets(sp, sens = 0.5) {
  const { M, frames, hop, sr, cen } = sp;
  let gmax = 1e-9; for (let b = 0; b < NB; b++) for (let t = 0; t < frames; t++) if (M[b][t] > gmax) gmax = M[b][t];
  const L = [], C = [];
  for (let b = 0; b < NB; b++) {
    const l = new Float32Array(frames), c = new Float32Array(frames);
    for (let t = 0; t < frames; t++) { const v = M[b][t] / gmax; l[t] = Math.log(1 + 2000 * v); c[t] = Math.sqrt(v); }
    L.push(l); C.push(c);
  }
  const groups = [[0, NB], [0, 0], [0, 0]];
  for (let b = 0; b < NB; b++) { if (cen[b] < 200) groups[1][1] = b + 1; if (cen[b] >= 5000 && !groups[2][0]) groups[2][0] = b; } groups[2][1] = NB; if (!groups[2][0]) groups[2][0] = NB - 1;
  const novs = groups.map(([b0, b1]) => {
    const nov = new Float32Array(frames);
    for (let t = 2; t < frames; t++) { let s = 0; for (let b = b0; b < b1; b++) { const d = L[b][t] - Math.max(L[b][t - 1], L[b][t - 2]); if (d > 0) s += d; } nov[t] = s / Math.max(1, b1 - b0); }
    return nov;
  });
  const fr = hop / sr, pks = novs.map(nv => pickPeaks(nv, frames, hop, sr, sens));
  const base = []; for (const g of [0, 2]) for (const t of pks[g]) base.push(t);
  base.sort((a, b) => a - b);
  const out = []; for (const t of base) { if (out.length && t - out[out.length - 1] < 6) continue; out.push(t); }
  for (const t of pks[1]) {   // low-group peaks join an event that began shortly before (slow attack of a kick), otherwise stand alone
    let near = false; for (const u of out) { if (t - u >= -3 && t - u <= Math.round(0.05 / fr)) { near = true; break; } }
    if (!near) out.push(t);
  }
  out.sort((a, b) => a - b);
  return { frames: out, nov: novs[0], novs, C, L, p95: 0 };
}

/** Feature vectors per event: attack / middle / late blocks of band amplitude above the pre-onset level. */
function eventVectors(sp, on) {
  const { C, frames } = { C: on.C, frames: sp.frames }, F = on.frames, E = F.length, D = NB * 3;
  const V = new Float32Array(D * E), Mk = new Float32Array(D * E);
  for (let e = 0; e < E; e++) {
    const f = F[e], nxt = e + 1 < E ? F[e + 1] : 1e9;
    for (let b = 0; b < NB; b++) {
      const c = C[b]; let pre = 0, cnt = 0;
      for (let j = f - 5; j <= f - 2; j++) if (j >= 0) { pre += c[j]; cnt++; }
      pre = cnt ? pre / cnt : 0;
      for (let q = 0; q < 3; q++) {
        const a = BLK[q][0], z = BLK[q][1]; let s = 0, n = 0;
        for (let j = f + a; j <= f + z; j++) if (j < frames) { s += c[j]; n++; }
        const valid = n > 0 && (nxt - f > z + 1 || q === 0);
        const idx = (q * NB + b) * E + e;
        V[idx] = valid ? Math.max(0, s / n - pre) : 0; Mk[idx] = valid ? 1 : 0;
      }
    }
  }
  return { V, Mk, D, E };
}

// ---------------------------------------------------------------------------------------------
// Event features and per-event classification (logistic models trained offline, see training script)
const GROUPS = [[0, 80], [80, 150], [150, 300], [300, 600], [600, 1200], [1200, 2500], [2500, 5000], [5000, 1e9]];
const NF = 8 + 4 + 2 + 3;
function eventFeatures(sp, on, ev) {
  const E = ev.E, F = new Float32Array(E * NF), cen = sp.cen, gi = new Int8Array(NB);
  for (let b = 0; b < NB; b++) { gi[b] = 7; for (let g = 0; g < 8; g++) if (cen[b] >= GROUPS[g][0] && cen[b] < GROUPS[g][1]) { gi[b] = g; break; } }
  const lg = x => Math.log10(x + 1e-7);
  const novAt = (nv, f) => { let m = 0; for (let j = f - 2; j <= f + 2; j++) if (j >= 0 && j < nv.length && nv[j] > m) m = nv[j]; return m; };
  for (let e = 0; e < E; e++) {
    const A = new Float64Array(8), Mi = new Float64Array(4), La = new Float64Array(2);
    for (let b = 0; b < NB; b++) {
      const a = ev.V[b * E + e], m = ev.V[(NB + b) * E + e], l = ev.V[(2 * NB + b) * E + e], g = gi[b];
      A[g] += a * a; Mi[g >> 1] += m * m; La[g >= 5 ? 1 : 0] += l * l;
    }
    const o = e * NF; let i = 0;
    for (let g = 0; g < 8; g++) F[o + i++] = lg(A[g]);
    for (let g = 0; g < 4; g++) F[o + i++] = lg(Mi[g]);
    F[o + i++] = lg(La[0]); F[o + i++] = lg(La[1]);
    const f = on.frames[e];
    F[o + i++] = lg(novAt(on.novs[1], f)); F[o + i++] = lg(novAt(on.novs[0], f)); F[o + i++] = lg(novAt(on.novs[2], f));
  }
  return F;
}

// ---------------------------------------------------------------------------------------------
// Tempo, phase, swing and grid
const TICKS = 12;   // ticks per sixteenth (clip format)

/** Tempo from onset times: coherence of the onsets with a 16th / 8th / beat / bar comb. */
function estimateTempo(hits, dur, hint = {}) {
  if (hint.bpm > 0) return { bpm: hint.bpm, how: 'given' };
  const T = hits.map(h => h.t), W = hits.map(h => h.w || 1), sw = W.reduce((a, b) => a + b, 0) || 1;
  const coh = P => { let c = 0, s = 0; for (let i = 0; i < T.length; i++) { const a = 2 * Math.PI * T[i] / P; c += W[i] * Math.cos(a); s += W[i] * Math.sin(a); } return Math.hypot(c, s) / sw; };
  const score = bpm => { const B = 60 / bpm; return 0.6 * coh(B / 4) + 0.8 * coh(B / 2) + coh(B) + 0.8 * coh(B * 2) + 0.9 * coh(B * 4) - 0.0; };
  let cands = [];
  if (hint.bars > 0 && dur > 0) { let b = hint.bars * 240 / dur; while (b < 70) b *= 2; while (b > 180) b /= 2; return { bpm: b, how: 'bars' }; }
  for (let b = 60; b <= 200; b += 0.5) cands.push([b, score(b) * (b >= 80 && b <= 165 ? 1.03 : 1)]);
  cands.sort((a, b) => b[1] - a[1]);
  let best = cands[0][0];
  // refine
  let bs = -1, bb = best; for (let b = best - 0.6; b <= best + 0.6; b += 0.05) { const s = score(b); if (s > bs) { bs = s; bb = b; } }
  return { bpm: bb, how: 'estimated', score: bs };
}

/** Find the position of step 0 (origin, seconds) and the swing. */
function findPhase(hits, stepSec, anchorAtStart) {
  const U = hits.map(h => h.t / stepSec), W = hits.map(h => h.w || 1);
  let best = 1e18, bp = 0;
  for (let ph = 0; ph < 2; ph += 0.02) {
    let c = 0;
    for (let i = 0; i < U.length; i++) { let r = (U[i] - ph) % 2; if (r < 0) r += 2; const de = Math.min(r, 2 - r), dod = r < 1 ? 1 - r : r > 1.5 ? r - 1.5 : 0; c += W[i] * Math.min(de, dod + 0.05, 0.3); }
    c += 0.02 * Math.min(ph, 2 - ph) * W.length * 0 + 0.0;
    if (c < best - 1e-9) { best = c; bp = ph; }
  }
  // origin: bp + 2m closest to 0 (the audio starts on or just before step 0)
  let o = bp; while (o > 1) o -= 2; while (o <= -1) o += 2;
  // swing: the candidate that puts most onsets close to the 16th grid; it has to beat straight by a margin
  const scoreSw = sw => { let c = 0; for (let i = 0; i < U.length; i++) { const e = snapToGrid(U[i] - bp, 16, sw).err; c += W[i] * Math.max(0, 1 - e / 0.12); } return c; };
  const wsum = W.reduce((a, b) => a + b, 0) || 1, s0 = scoreSw(0); let sw = 0, sbest = s0;
  for (let k = 1; k <= 30; k++) { const v = k * 0.02, sc = scoreSw(v); if (sc > sbest + 1e-9) { sbest = sc; sw = v; } }
  if (sbest < s0 + 0.04 * wsum) sw = 0;
  return { origin: o * stepSec, phase: bp, swing: Math.round(sw * 100) / 100, cost: best / (W.reduce((a, b) => a + b, 0) || 1) };
}

const GRIDS = { 16: { ticks: 12 }, 32: { ticks: 6 }, 12: { ticks: 16 }, 24: { ticks: 8 } };
/** Snap a position (in sixteenths, from origin) to a grid. Returns { tick, err } where tick is on the unswung grid and err in sixteenths. */
function snapToGrid(s, grid, sw) {
  const tk = GRIDS[grid].ticks / TICKS;     // grid unit in sixteenths
  if (grid === 12 || grid === 24) { const k = Math.round(s / tk); return { tick: Math.round(k * GRIDS[grid].ticks), err: Math.abs(s - k * tk) }; }
  // swing shifts every odd sixteenth (and the half step after it) by sw
  const pair = Math.floor(s / 2) * 2, within = s - pair;   // within in [0,2)
  let best = null;
  const n = grid === 16 ? 2 : 4;
  for (let j = 0; j <= n; j++) {
    const p = j * tk, shifted = p + (p >= 1 - 1e-9 && p < 2 - 1e-9 ? sw : 0), d = Math.abs(within - shifted);
    if (!best || d < best.err) best = { err: d, pos: pair + p };
  }
  return { tick: Math.round(best.pos * TICKS), err: best.err };
}

const LANES = {
  kick: { type: 'kick', note: 36 }, snare: { type: 'snare', note: 38 }, rim: { type: 'rim', note: 37 }, clap: { type: 'clap', note: 39 },
  closedhat: { type: 'closedhat', note: 42 }, openhat: { type: 'openhat', note: 46 },
  lowtom: { type: 'lowtom', note: 41 }, midtom: { type: 'midtom', note: 47 }, hitom: { type: 'hitom', note: 50 }, perc: { type: 'conga', note: 63 }
};
const ORDER = ['kick', 'snare', 'rim', 'clap', 'closedhat', 'openhat', 'lowtom', 'midtom', 'hitom', 'perc'];
const sigm = z => 1 / (1 + Math.exp(-z));
function lin(model, w, F, e, ref) { let z = w[NF]; for (let j = 0; j < NF; j++) z += w[j] * ((F[e * NF + j] - ref[j]) - model.mu[j]) / model.sd[j]; return z; }

// Small network (15 -> H tanh -> 4 sigmoid): which of kick, snare family, hat family, percussion play in this event
function mlp(model, F, e, ref) {
  const { h, W1, b1, W2, b2 } = model.mlp, hid = new Float64Array(h), x = new Float64Array(NF);
  for (let j = 0; j < NF; j++) x[j] = ((F[e * NF + j] - ref[j]) - model.mu[j]) / model.sd[j];
  for (let k = 0; k < h; k++) { let z = b1[k]; for (let j = 0; j < NF; j++) z += x[j] * W1[j * h + k]; hid[k] = Math.tanh(z); }
  const out = {}; ['kick', 'snare', 'hat', 'perc'].forEach((c, i) => { let z = b2[i]; for (let k = 0; k < h; k++) z += hid[k] * W2[k * 4 + i]; out[c] = sigm(z); });
  return out;
}

/** Everything except tempo and quantising: lane labels per event with strength. */
function labelEvents(F, E, model, th = {}) {
  const ref = new Float64Array(NF);
  for (let j = 0; j < NF; j++) { const a = []; for (let e = 0; e < E; e++) a.push(F[e * NF + j]); a.sort((x, y) => x - y); ref[j] = a[Math.floor(a.length * 0.95)] || 0; }
  const out = [];
  // strength helpers (amplitude of the added energy in a few groups, from the log-power features)
  const amp = (e, a, b) => { let s = 0; for (let j = a; j <= b; j++) s += Math.pow(10, F[e * NF + j]); return Math.sqrt(s); };
  for (let e = 0; e < E; e++) {
    const p = mlp(model, F, e, ref);
    const add = (lane, pp, strength) => out.push({ e, lane, p: pp, strength });
    if (p.kick >= (th.kick ?? 0.5)) add('kick', p.kick, amp(e, 0, 1));
    if (p.snare >= (th.snare ?? 0.5)) {
      const pc = sigm(lin(model, model.sub.clap, F, e, ref)), pr = sigm(lin(model, model.sub.rim, F, e, ref));
      add(pc > 0.5 && pc >= pr ? 'clap' : pr > 0.5 ? 'rim' : 'snare', p.snare, amp(e, 2, 6));
    }
    if (p.hat >= (th.hat ?? 0.5)) { const po = sigm(lin(model, model.sub.open, F, e, ref)); add(po > 0.5 ? 'openhat' : 'closedhat', p.hat, amp(e, 5, 7)); }
    if (p.perc >= (th.perc ?? 0.5)) { const pt = sigm(lin(model, model.sub.tom, F, e, ref)); add(pt > 0.5 ? 'tom' : 'perc', p.perc, amp(e, 2, 5)); }
  }
  return out;
}

const LANE_W = { kick: 1, snare: 1, rim: 0.7, clap: 0.8, closedhat: 0.4, openhat: 0.5, tom: 0.5, perc: 0.4 };
function pitchOf(ev, sp, e) {
  const E = ev.E; let bb = -1, bv = 0;
  for (let b = 0; b < NB; b++) { const c = sp.cen[b]; if (c < 50 || c > 600) continue; const v = ev.V[b * E + e]; if (v > bv) { bv = v; bb = b; } }
  return bb < 0 ? 0 : sp.cen[bb];
}

/** Whole pipeline on channel data. opts: { bpm, bars, loop, grid ('auto'|16|32|12|24), align ('start'|'auto'), sens, th, swing ('auto'|number) } */
function transcribe(chs, sr, opts, model, pre) {
  opts = opts || {};
  const sig = pre ? pre.sig : prepare(chs, sr, !!(opts.loop || opts.bars));
  if (!sig) return { error: 'silent' };
  const sp = pre ? pre.sp : spectrogram(sig), on = onsets(sp, opts.sens ?? 0.5), ev = eventVectors(sp, on, { white: false }), E = ev.E, hop = sp.hop / sp.sr;
  const dur = sig.len / sr;
  const times = on.frames.map(f => f * hop + sp.N / 4 / sp.sr + 0.005 - sig.pad / sig.sr);
  if (!E) return { error: 'nohits', dur };
  const F = eventFeatures(sp, on, ev), lab = labelEvents(F, E, model, opts.th || {});
  if (!lab.length) return { error: 'nohits', dur };
  // percussion with a low pitch becomes toms (low / mid / high by pitch)
  const toms = lab.filter(h => h.lane === 'tom'); 
  if (toms.length) {
    const ps = toms.map(h => Math.log2(pitchOf(ev, sp, h.e) || 100)).sort((a, b) => a - b); const cuts = [];
    for (let i = 1; i < ps.length; i++) if (ps[i] - ps[i - 1] > 0.3) cuts.push((ps[i] + ps[i - 1]) / 2);
    for (const h of toms) { const lp = Math.log2(pitchOf(ev, sp, h.e) || 100); const idx = cuts.filter(c => lp > c).length; const nGroups = cuts.length + 1;
      h.lane = nGroups === 1 ? (lp < Math.log2(110) ? 'lowtom' : lp < Math.log2(170) ? 'midtom' : 'hitom') : nGroups === 2 ? (idx ? 'hitom' : 'lowtom') : (['lowtom', 'midtom', 'hitom'][Math.min(2, idx)]); }
  }
  // strength -> velocity per lane
  const byLane = {}; for (const h of lab) (byLane[h.lane] ||= []).push(h);
  for (const l in byLane) { const a = byLane[l].map(h => h.strength).sort((x, y) => x - y), ref = a[Math.max(0, Math.floor(a.length * 0.9) - (a.length > 3 ? 0 : 0))] || 1e-9; for (const h of byLane[l]) h.vel = clamp(0.15 + 0.85 * Math.pow(h.strength / ref, 0.7), 0.1, 1); }
  // same lane, closer than 40 ms: keep the more probable one
  let hits = [];
  for (const l in byLane) { const a = byLane[l].map(h => ({ ...h, t: times[h.e] })).sort((x, y) => x.t - y.t); const keep = []; for (const h of a) { const last = keep[keep.length - 1]; if (last && h.t - last.t < 0.04) { if (h.p > last.p) keep[keep.length - 1] = h; } else keep.push(h); } hits = hits.concat(keep); }
  for (const h of hits) h.w = LANE_W[h.lane === 'lowtom' || h.lane === 'midtom' || h.lane === 'hitom' ? 'tom' : h.lane] || 0.5;
  // tempo
  const tempo = estimateTempo(hits, dur, { bpm: opts.bpm, bars: opts.bars });
  const bpm = tempo.bpm, stepSec = 15 / bpm, barSec = stepSec * 16;
  let bars = opts.bars > 0 ? opts.bars : Math.max(1, Math.min(16, Math.round(dur / barSec)));
  const nSteps = bars * 16;
  const ph = findPhase(hits, stepSec);
  let sw = opts.swing === undefined || opts.swing === 'auto' ? ph.swing : clamp(+opts.swing || 0, 0, 0.6);
  let origin = ph.origin;
  // positions in sixteenths from the origin, wrapped to the loop
  const posOf = t => { let s = (t - origin) / stepSec; s %= nSteps; if (s < 0) s += nSteps; return s; };
  // alignment (which beat is the downbeat): start = as recorded, auto = by kick on 1 and snare on 2 and 4
  let rot = 0;
  if ((opts.align || (opts.bars || opts.loop ? 'start' : 'auto')) === 'auto') {
    let bestS = -1e9;
    for (let r = 0; r < 16; r += 4) {
      let sc = 0;
      for (const h of hits) { const s = (posOf(h.t) - r + nSteps) % 16, w = h.p; const near = x => Math.min(Math.abs(s - x), 16 - Math.abs(s - x)) < 0.6;
        if (h.lane === 'kick') sc += (near(0) ? 3 : near(8) ? 1 : 0) * w;
        else if (h.lane === 'snare' || h.lane === 'clap') sc += (near(4) || near(12) ? 2 : near(0) ? -1.5 : 0) * w; }
      if (sc > bestS + 1e-9) { bestS = sc; rot = r; }
    }
  }
  origin += rot * stepSec;
  // grid choice
  const cand = opts.grid && opts.grid !== 'auto' ? [+opts.grid] : [16, 32, 12, 24];
  const pen = { 16: 0, 32: 0.035, 12: 0.05, 24: 0.08 };
  let bestG = null;
  for (const g of cand) { let c = 0, wsum = 0; for (const h of hits) { const sn = snapToGrid(posOf(h.t), g, g === 12 || g === 24 ? 0 : sw); c += h.w * Math.min(sn.err, 0.5); wsum += h.w; } c = c / (wsum || 1) + (cand.length > 1 ? pen[g] : 0); if (!bestG || c < bestG.c) bestG = { g, c }; }
  const grid = bestG.g, swingUsed = grid === 12 || grid === 24 ? 0 : sw;
  const len = nSteps * TICKS, seen = new Map(), out = [];
  for (const h of hits.sort((a, b) => a.t - b.t)) {
    const sn = snapToGrid(posOf(h.t), grid, swingUsed); let tick = sn.tick % len; if (tick < 0) tick += len;
    const key = h.lane + ':' + tick, prev = seen.get(key);
    if (prev) { if (h.vel > prev.vel) { prev.vel = h.vel; prev.p = h.p; } continue; }
    const o = { lane: h.lane, tick, vel: Math.round(h.vel * 100) / 100, t: h.t, p: h.p }; seen.set(key, o); out.push(o);
  }
  out.sort((a, b) => a.tick - b.tick);
  const lanes = ORDER.filter(l => out.some(h => h.lane === l)).map(l => ({ id: l, type: (LANES[l] || LANES.perc).type, note: (LANES[l] || LANES.perc).note }));
  return { bpm, tempo: tempo.how, bars, stepSec, origin, swing: Math.round(swingUsed * 1000) / 1000, grid, length: len, lanes, hits: out, dur, rot };
}

export const engine = { prepare, spectrogramPlan, spectrogram, onsets, eventVectors, eventFeatures, labelEvents, estimateTempo, findPhase, snapToGrid, transcribe, MODEL };

// ---------------------------------------------------------------------------------------------
// Het apparaat
const WNAME = 'nl-patchkamer-drumlistener-1-20-0';
// Opvang: geeft het binnenkomende geluid (kanalen samengeteld) in blokken van 4096 frames door aan de pagina, alleen tijdens het opnemen
const WORKLET = `
class DLCap extends AudioWorkletProcessor {
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
registerProcessor('${WNAME}', DLCap);`;

const TXT = {
  nl: { load: 'Audiobestand laden…', record: 'Opnemen', stop: 'Stop', recLen: { b2: '2 maten', b4: '4 maten', b8: '8 maten', s5: '5 seconden', s10: '10 seconden', s20: '20 seconden' }, recLenLabel: 'Opnameduur',
    bpm: 'Tempo (BPM)', bpmAuto: 'auto', half: '÷2', dbl: '×2', bars: 'Maten', barsAuto: 'auto', grid: 'Raster', gridAuto: 'auto', grids: { 16: '1/16', 32: '1/32', 12: 'triool 1/8', 24: 'triool 1/16' },
    swing: 'Swing', swingAuto: 'auto', align: 'Eerste tel', alignSmart: 'slim', alignStart: 'begin van het geluid', alignAuto: 'zoek de eerste tel', sens: 'Gevoeligheid', shiftL: '◀ 1/16', shiftR: '1/16 ▶', shift: 'Patroon verschuiven',
    again: 'Opnieuw analyseren', clear: 'Wissen', play: 'Naar drums sturen (klok)', mode: 'Uitvoer', modeNotes: 'Noten (General MIDI)', modeTrigs: 'Trigs (soort)', level: 'Velocity', useTempo: 'Studiotempo gelijkzetten', saveClip: 'Clip bewaren (JSON)',
    lanes: 'Banen', mute: 'Dempen', hits: n => n + (n === 1 ? ' slag' : ' slagen'), idle: 'Nog niets geladen. Laad een audiobestand of neem op uit de ingang.', busy: 'Analyseren…', recording: (s, t) => 'Opnemen… ' + s.toFixed(1) + ' / ' + t.toFixed(1) + ' s',
    summary: (bpm, how, bars, grid, swing, n) => bpm.toFixed(1) + ' BPM (' + how + ') · ' + bars + (bars === 1 ? ' maat' : ' maten') + ' · raster ' + grid + ' · swing ' + Math.round(swing * 100) + '% · ' + n + ' slagen',
    how: { given: 'opgegeven', bars: 'uit de lengte', estimated: 'geschat' },
    errSilent: 'Het geluid is stil of te kort om iets te herkennen.', errNoHits: 'Er is geen slag herkend. Probeer een hogere gevoeligheid.', errDecode: 'Dit audiobestand kon niet worden gelezen.', errBig: 'Het bestand is te groot (hoogstens 50 MiB).',
    errCtx: 'Deze browser kan hier geen audio decoderen.', errNoWorklet: 'Opnemen uit de ingang heeft AudioWorklet nodig, en dat is hier niet beschikbaar.', errNoAudio: 'Geen audio ontvangen. Verbind een bron met de ingang en probeer het opnieuw.',
    noPaste: 'Drum Listener maakt alleen clips; plakken kan hier niet.', clipName: 'Drum Listener', source: 'Bron', swingHint: 'Zet de swing van de studio op 0 als je de herkende swing gebruikt.',
    lowConf: 'Het tempo is geschat; staat het op de helft of het dubbele, gebruik dan ÷2 of ×2.',
    perc: 'Percussie', laneNames: { kick: 'Kick', snare: 'Snare', clap: 'Clap', rim: 'Rim', closedhat: 'Gesloten hat', openhat: 'Open hat', lowtom: 'Lage tom', midtom: 'Middentom', hitom: 'Hoge tom', cowbell: 'Cowbell', crash: 'Crash', ride: 'Ride', shaker: 'Shaker', tamb: 'Tamboerijn', conga: 'Conga', bongo: 'Bongo', clave: 'Clave', wood: 'Houtblok' } },
  en: { load: 'Load audio file…', record: 'Record', stop: 'Stop', recLen: { b2: '2 bars', b4: '4 bars', b8: '8 bars', s5: '5 seconds', s10: '10 seconds', s20: '20 seconds' }, recLenLabel: 'Record length',
    bpm: 'Tempo (BPM)', bpmAuto: 'auto', half: '÷2', dbl: '×2', bars: 'Bars', barsAuto: 'auto', grid: 'Grid', gridAuto: 'auto', grids: { 16: '1/16', 32: '1/32', 12: 'triplet 1/8', 24: 'triplet 1/16' },
    swing: 'Swing', swingAuto: 'auto', align: 'Downbeat', alignSmart: 'smart', alignStart: 'start of the sound', alignAuto: 'find the downbeat', sens: 'Sensitivity', shiftL: '◀ 1/16', shiftR: '1/16 ▶', shift: 'Shift pattern',
    again: 'Analyse again', clear: 'Clear', play: 'Send to drums (clock)', mode: 'Output', modeNotes: 'Notes (General MIDI)', modeTrigs: 'Trigs (type)', level: 'Velocity', useTempo: 'Set studio tempo to this', saveClip: 'Save clip (JSON)',
    lanes: 'Lanes', mute: 'Mute', hits: n => n + (n === 1 ? ' hit' : ' hits'), idle: 'Nothing loaded yet. Load an audio file or record from the input.', busy: 'Analysing…', recording: (s, t) => 'Recording… ' + s.toFixed(1) + ' / ' + t.toFixed(1) + ' s',
    summary: (bpm, how, bars, grid, swing, n) => bpm.toFixed(1) + ' BPM (' + how + ') · ' + bars + (bars === 1 ? ' bar' : ' bars') + ' · grid ' + grid + ' · swing ' + Math.round(swing * 100) + '% · ' + n + ' hits',
    how: { given: 'given', bars: 'from the length', estimated: 'estimated' },
    errSilent: 'The sound is silent or too short to recognise anything.', errNoHits: 'No hit was recognised. Try a higher sensitivity.', errDecode: 'This audio file could not be read.', errBig: 'The file is too large (at most 50 MiB).',
    errCtx: 'This browser cannot decode audio here.', errNoWorklet: 'Recording from the input needs AudioWorklet, which is not available here.', errNoAudio: 'No audio received. Connect a source to the input and try again.',
    noPaste: 'Drum Listener only makes clips; pasting is not possible here.', clipName: 'Drum Listener', source: 'Source', swingHint: 'Set the studio swing to 0 when you use the detected swing.',
    lowConf: 'The tempo is estimated; if it is half or double, use ÷2 or ×2.',
    perc: 'Percussion', laneNames: { kick: 'Kick', snare: 'Snare', clap: 'Clap', rim: 'Rim', closedhat: 'Closed hat', openhat: 'Open hat', lowtom: 'Low tom', midtom: 'Mid tom', hitom: 'High tom', cowbell: 'Cowbell', crash: 'Crash', ride: 'Ride', shaker: 'Shaker', tamb: 'Tambourine', conga: 'Conga', bongo: 'Bongo', clave: 'Clave', wood: 'Wood block' } }
};

const TYPES = ['kick', 'snare', 'clap', 'rim', 'closedhat', 'openhat', 'lowtom', 'midtom', 'hitom', 'cowbell', 'crash', 'ride', 'shaker', 'tamb', 'conga', 'bongo', 'clave', 'wood'];
const GM = { kick: 36, snare: 38, clap: 39, rim: 37, closedhat: 42, openhat: 46, lowtom: 41, midtom: 47, hitom: 50, cowbell: 56, crash: 49, ride: 51, shaker: 70, tamb: 54, conga: 63, bongo: 60, clave: 75, wood: 76 };
const BARS = [0, 1, 2, 3, 4, 6, 8, 12, 16], GRID_LIST = ['auto', 16, 32, 12, 24], REC = ['b2', 'b4', 'b8', 's5', 's10', 's20'], ALIGN = ['smart', 'auto', 'start'], MODES = ['notes', 'trigs'];
const MAXHITS = 4096, MAXLEN = 12288, MAXFILE = 50 * 1024 * 1024;
const DEFAULTS = { bpm: 0, bars: 0, grid: 'auto', swing: -1, align: 'smart', sens: 0.5, rec: 'b4', send: false, mode: 'notes', level: 0.9, name: '', clip: null };
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? cl(v, a, b) : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const int = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? cl(Math.round(v), a, b) : d;

// Een clip in de state: { name, bpm, length (tikken), grid, swing, lanes: [{ id, type }], hits: [[tik, baan, velocity]], how, bars }. Alles wordt bij het laden gezuiverd.
function cleanClip(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.lanes) || !Array.isArray(c.hits)) return null;
  const length = int(c.length, 12, MAXLEN, 0); if (!length || length % 12) return null;
  const lanes = [], seen = new Set();
  for (const l of c.lanes.slice(0, 16)) { const type = l && TYPES.includes(l.type) ? l.type : null; if (!type) { lanes.push(null); continue; } lanes.push({ type, mute: l.mute === true }); }
  if (!lanes.some(Boolean)) return null;
  const hits = [];
  for (const h of c.hits.slice(0, MAXHITS)) {
    if (!Array.isArray(h)) continue; const t = int(h[0], 0, length - 1, -1), ln = int(h[1], 0, lanes.length - 1, -1), v = num(h[2], 0.01, 1, 0.8);
    if (t < 0 || ln < 0 || !lanes[ln]) continue; const key = t + ':' + ln; if (seen.has(key)) continue; seen.add(key); hits.push([t, ln, Math.round(v * 100) / 100]);
  }
  hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { name: typeof c.name === 'string' ? c.name.slice(0, 40) : '', bpm: num(c.bpm, 20, 400, 120), length, grid: pick(c.grid, [16, 32, 12, 24], 16), swing: num(c.swing, 0, 0.6, 0),
    lanes, hits, how: pick(c.how, ['given', 'bars', 'estimated'], 'given'), bars: int(c.bars, 1, 64, Math.max(1, Math.round(length / 192))) };
}

export default {
  id: 'nl.patchkamer.drum-listener', name: 'Drum Listener', about: { nl: 'Luistert naar een drumloop en schrijft op wat er gespeeld wordt: kick, snare, hats, toms en percussie op eigen banen. Laad een audiobestand (ook via de tab Samples), of neem een paar maten op uit de ingang, bijvoorbeeld van Audio Capture. Het patroon kun je naar een drumcomputer sturen en kopiëren naar een sequencer.\n\nKlik in het raster om een slag toe te voegen of weg te halen.', en: 'Listens to a drum loop and writes down what is played: kick, snare, hats, toms and percussion on their own lanes. Load an audio file (also from the Samples tab) or record a few bars from the input, for example from Audio Capture. You can send the pattern to a drum machine and copy it to a sequencer.\n\nClick in the grid to add or remove a hit.' }, version: '1.22.0', kind: 'utility', category: 'tool', ui: { width: 760, minWidth: 380 },
  i18n: { nl: { ports: { in: 'In', thru: 'Door', trigs: 'Drum trigs' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'thru', name: 'Through' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Drum trigs' }], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = { ...DEFAULTS }, dead = false, ui = null, shell = null, stopFrame = null, busy = false, msg = '', msgErr = false;
    let audio = null;             // { x: Float32Array (mono), sr, name, loop, info }
    let pre = null, result = null, rec = null, curStep = -1, stepIndex = [], runId = 0, node = null, pcmReady = false;
    // Keten: ingang -> doorgang (ongewijzigd) en -> opvang
    const inG = ctx.createGain(), thru = ctx.createGain(); inG.connect(thru);
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const laneName = type => T.laneNames[type] || type;
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
    function recSeconds() {
      const k = state.rec, n = parseInt(k.slice(1), 10);
      return k[0] === 'b' ? n * 240 / (state.bpm || hostBpm()) : n;
    }
    function startRecording() {
      if (rec || busy) return; if (!pcmReady || !node) { setMsg(T.errNoWorklet, true); return; }
      const secs = Math.min(recSeconds(), 90); rec = { parts: [], frames: 0, target: Math.round(secs * ctx.sampleRate), secs, stopping: false, bars: state.rec[0] === 'b' ? parseInt(state.rec.slice(1), 10) : 0 };
      setMsg('', false); node.port.postMessage({ t: 'start' }); paint();
    }
    function finishRecording() {
      const r = rec; if (!r || r.stopping) return; r.stopping = true; try { node.port.postMessage({ t: 'stop' }); } catch (e) { /* ok */ }
      setTimeout(() => {   // het laatste blok komt na 'stop' binnen
        if (rec !== r) return; rec = null;
        const n = Math.min(r.frames, r.target), x = new Float32Array(n); let o = 0;
        for (const p of r.parts) { const k = Math.min(p.length, n - o); if (k <= 0) break; x.set(p.subarray(0, k), o); o += k; }
        if (dead) return;
        audio = { x, sr: ctx.sampleRate, name: T.record, loop: false, info: { bars: state.bpm > 0 && r.bars ? r.bars : 0 } };
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
        if (i2.bpm > 0 && !state.bpm) { /* het tempo komt alleen uit het sample, de instelling blijft auto */ }
      } catch (e) { busy = false; setMsg(T.errDecode, true); paint(); return; }
      await analyse();
    }

    // ---- analyse ----
    const tick = () => new Promise(r => setTimeout(r, 0));
    async function analyse(reuse) {
      if (!audio || dead) return; const my = ++runId; busy = true; setMsg(T.busy, false); paint();
      try {
        if (!reuse || !pre) {
          const sig = prepare([audio.x], audio.sr, audio.loop || (audio.info && audio.info.bars > 0));
          if (!sig) { result = null; busy = false; setMsg(T.errSilent, true); paint(); return; }
          const sp = spectrogramPlan(sig);
          for (let t = 0; t < sp.frames; t += 600) { sp.run(t, t + 600); if (sp.frames > 1200) { await tick(); if (my !== runId || dead) return; } }
          pre = { sig, sp };
        }
        const info = audio.info || {};
        const bars = state.bars || (info.bars ? Math.round(info.bars) : 0);
        const o = { bpm: state.bpm || info.bpm || 0, bars, loop: audio.loop, grid: state.grid, swing: state.swing < 0 ? 'auto' : state.swing, sens: state.sens, th: { snare: 0.4, perc: 0.4 } };
        if (state.align !== 'smart') o.align = state.align;
        const r = transcribe([audio.x], audio.sr, o, MODEL, pre);
        if (my !== runId || dead) return;
        busy = false;
        if (r.error) { result = null; setMsg(r.error === 'silent' ? T.errSilent : T.errNoHits, true); paint(); return; }
        result = r; setClipFromResult(r); setMsg('', false);
      } catch (e) { busy = false; setMsg(T.errSilent, true); }
      paint();
    }
    function setClipFromResult(r) {
      const lanes = r.lanes.map(l => ({ type: TYPES.includes(l.type) ? l.type : 'conga', mute: false }));
      const idx = new Map(r.lanes.map((l, i) => [l.id, i]));
      const hits = r.hits.filter(h => idx.has(h.lane)).map(h => [h.tick % r.length, idx.get(h.lane), h.vel]);
      state.clip = cleanClip({ name: (audio && audio.name) || '', bpm: r.bpm, length: r.length, grid: r.grid, swing: r.swing, lanes, hits, how: r.tempo, bars: r.bars });
      if (state.clip && state.clip.name === '') state.clip.name = T.clipName;
      indexClip();
    }
    function indexClip() {
      stepIndex = []; const c = state.clip; if (!c) return;
      const steps = c.length / 12; for (let i = 0; i < steps; i++) stepIndex.push([]);
      for (const h of c.hits) stepIndex[Math.min(steps - 1, Math.floor(h[0] / 12))].push(h);
    }
    function shiftClip(d) {
      const c = state.clip; if (!c) return; for (const h of c.hits) h[0] = (((h[0] + d * 12) % c.length) + c.length) % c.length; c.hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]); indexClip(); paint();
    }
    function setMsg(t, err) { msg = t || ''; msgErr = !!err; if (ui) { ui.status.textContent = msg; ui.status.classList.toggle('err', msgErr); } }

    // ---- afspelen naar de drums ----
    const emit = ev => { try { host.emit(self, 'trigs', ev); } catch (e) { /* ok */ } };
    // ---- klembord (contract §13d) ----
    function laneDefs() { const c = state.clip; return c ? c.lanes.map((l, i) => l && { i, id: l.type + (c.lanes.slice(0, i).filter(x => x && x.type === l.type).length ? i : ''), name: laneName(l.type), type: l.type, note: GM[l.type] }) .filter(Boolean) : []; }
    function buildClip() {
      const c = state.clip; if (!c) return null; const defs = laneDefs(), map = new Map(defs.map((d, k) => [d.i, k]));
      const hits = c.hits.filter(h => map.has(h[1]) && !(c.lanes[h[1]] && c.lanes[h[1]].mute)).map(h => ({ t: h[0], lane: map.get(h[1]), vel: Math.max(0.01, Math.min(1, h[2])) })).slice(0, MAXHITS);
      return { format: 'patchkamer-clip', formatVersion: 1, kind: 'drums', name: (c.name || T.clipName).slice(0, 40), length: c.length, grid: c.grid === 32 || c.grid === 24 ? 32 : 16,
        source: { device: 'nl.patchkamer.drum-listener', name: 'Drum Listener', version: '1.20.0', scheme: 'gm' }, swing: Math.min(0.5, c.swing),
        lanes: defs.map(d => ({ id: d.id, name: d.name, type: d.type, note: d.note })), hits };
    }

    // ---- UI ----
    const CSS = ':host{display:block;color:var(--fg,#e2e6ea);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;background:var(--card,#15181d);border:1px solid var(--line,#39424e);border-radius:8px}' +
      '.warn{color:var(--muted,#97a1ad);line-height:1.4}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}label{display:flex;flex-direction:column;gap:3px;color:var(--muted,#97a1ad);font-size:11px}label.inl{flex-direction:row;align-items:center;gap:6px}' +
      'button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%}button{cursor:pointer}button:hover{border-color:var(--acc,#4fd1c5)}button.on{background:var(--acc,#4fd1c5);color:#111;border-color:var(--acc,#4fd1c5)}' +
      'input[type=number]{width:84px}input[type=checkbox]{padding:0}canvas{display:block;width:100%;background:var(--well,#0c0f13);border:1px solid var(--line,#39424e);border-radius:6px;cursor:crosshair}' +
      '.status{min-height:16px;color:var(--event,#f4a261)}.status.err{color:#ff7b72}.lanes{display:grid;gap:4px}.lane{display:grid;grid-template-columns:minmax(110px,220px) 90px auto;gap:8px;align-items:center}.lane span{color:var(--muted,#97a1ad)}';
    function mkSelect(parent, label, items, onchange) { const l = el('label', label, parent); const s = el('select', null, l); s.setAttribute('aria-label', label); for (const [v, t] of items) { const o = el('option', t, s); o.value = String(v); } s.onchange = () => onchange(s.value); return s; }
    function paint() {
      if (!ui) return; const c = state.clip;
      ui.rec.textContent = rec ? T.stop : T.record; ui.rec.classList.toggle('on', !!rec);
      ui.bpm.value = state.bpm ? String(state.bpm) : ''; ui.bars.value = String(state.bars); ui.grid.value = String(state.grid); ui.swing.value = state.swing < 0 ? 'auto' : String(Math.round(state.swing * 100)); ui.align.value = state.align;
      ui.recLen.value = state.rec; ui.send.checked = state.send; ui.mode.value = state.mode;
      ui.sens.set && ui.sens.set(state.sens); ui.level.set && ui.level.set(state.level);
      ui.summary.textContent = c ? T.summary(c.bpm, T.how[c.how] || '', c.bars, T.grids[c.grid] || c.grid, c.swing, c.hits.length) + (c.how === 'estimated' ? ' · ' + T.lowConf : '') : T.idle;
      ui.status.textContent = msg; ui.status.classList.toggle('err', msgErr);
      ui.lanes.textContent = '';
      if (c) c.lanes.forEach((l, i) => {
        if (!l) return; const row = el('div', null, ui.lanes, 'lane'); const s = el('select', null, row); s.setAttribute('aria-label', T.lanes);
        for (const ty of TYPES) { const o = el('option', laneName(ty), s); o.value = ty; } s.value = l.type; s.onchange = () => { if (TYPES.includes(s.value)) { l.type = s.value; paint(); } };
        el('span', T.hits(c.hits.filter(h => h[1] === i).length), row); const lb = el('label', null, row); lb.className = 'inl'; const cb = el('input', null, lb); cb.type = 'checkbox'; cb.checked = l.mute; cb.setAttribute('aria-label', T.mute); el('span', T.mute, lb); cb.onchange = () => { l.mute = cb.checked; };
      });
      draw();
    }
    let pal = null, palAt = 0;
    function colors() { const now = performance.now(); if (pal && now - palAt < 1000) return pal; palAt = now; const q = (n, d) => { try { return getComputedStyle(ui.cv).getPropertyValue(n).trim() || d; } catch (e) { return d; } }; return pal = { well: q('--well', '#0c0f13'), line: q('--line', '#39424e'), acc: q('--acc', '#4fd1c5'), ev: q('--event', '#f4a261'), fg: q('--muted', '#97a1ad') }; }
    function draw() {
      if (!ui || !ui.cv) return; const cv = ui.cv, c = state.clip; const dpr = cl(Number(globalThis.devicePixelRatio) || 1, 1, 3), w = Math.max(260, Math.min(1400, cv.clientWidth || 600));
      const rows = c ? c.lanes.filter(Boolean).length : 0, rh = 20, h = Math.max(60, rows * rh + 16);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; }
      const g = cv.getContext && cv.getContext('2d'); if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); const P = colors(); g.fillStyle = P.well; g.fillRect(0, 0, w, h);
      if (!c) return;
      const steps = c.length / 12, lab = 92, cw = (w - lab - 6) / steps; const order = c.lanes.map((l, i) => l ? i : -1).filter(i => i >= 0);
      g.font = '11px monospace'; g.textBaseline = 'middle';
      for (let s = 0; s <= steps; s++) { const x = lab + s * cw; g.strokeStyle = P.line; g.globalAlpha = s % 16 === 0 ? 0.9 : s % 4 === 0 ? 0.5 : 0.2; g.beginPath(); g.moveTo(x, 4); g.lineTo(x, h - 4); g.stroke(); }
      g.globalAlpha = 1;
      order.forEach((li, r) => {
        const y = 8 + r * rh; g.fillStyle = P.fg; g.globalAlpha = c.lanes[li].mute ? 0.4 : 1; g.fillText(laneName(c.lanes[li].type).slice(0, 13), 4, y + rh / 2);
        for (const hh of c.hits) { if (hh[1] !== li) continue; const x = lab + hh[0] / 12 * cw; g.globalAlpha = (c.lanes[li].mute ? 0.3 : 1) * (0.25 + 0.75 * hh[2]); g.fillStyle = P.acc; g.fillRect(x, y + 2, Math.max(3, cw * 0.8), rh - 4); }
        g.globalAlpha = 1;
      });
      if (curStep >= 0 && curStep < steps) { g.fillStyle = P.ev; g.globalAlpha = 0.9; g.fillRect(lab + curStep * cw, 2, Math.max(2, cw), 3); g.globalAlpha = 1; }
      ui.geo = { lab, cw, rh, steps, order };
    }
    function onCanvas(e) {
      const c = state.clip; if (!c || !ui.geo) return; const r = ui.cv.getBoundingClientRect(), x = (e.clientX - r.left) * (ui.cv.clientWidth ? (Math.max(260, Math.min(1400, ui.cv.clientWidth)) / ui.cv.clientWidth) : 1), y = (e.clientY - r.top);
      const { lab, cw, rh, steps, order } = ui.geo, col = Math.floor((x - lab) / cw), row = Math.floor((y - 8) / rh);
      if (!(col >= 0 && col < steps) || !(row >= 0 && row < order.length)) return; const li = order[row];
      const at = c.hits.findIndex(h => h[1] === li && Math.floor(h[0] / 12) === col);
      if (at >= 0) c.hits.splice(at, 1); else if (c.hits.length < MAXHITS) c.hits.push([col * 12, li, 0.8]);
      c.hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]); indexClip(); paint();
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
        const grid = mkSelect(r2, T.grid, GRID_LIST.map(g => [g, g === 'auto' ? T.gridAuto : T.grids[g]]), v => { state.grid = pick(v === 'auto' ? 'auto' : parseInt(v, 10), GRID_LIST, 'auto'); if (audio) analyse(true); });
        const swing = mkSelect(r2, T.swing, [['auto', T.swingAuto], ...[0, 10, 20, 33, 50].map(p => [p, p + '%'])], v => { state.swing = v === 'auto' ? -1 : cl(parseInt(v, 10) / 100, 0, 0.6); if (audio) analyse(true); });
        const align = mkSelect(r2, T.align, [['smart', T.alignSmart], ['auto', T.alignAuto], ['start', T.alignStart]], v => { state.align = pick(v, ALIGN, 'smart'); if (audio) analyse(true); });
        const r3 = el('div', null, app, 'row');
        const sensH = el('div', null, r3); const sens = host.ui.knob(sensH, T.sens, [0, 1, 0.01], state.sens, v => Math.round(v * 100) + '%', v => { state.sens = v; }, { def: 0.5 });
        sensH.addEventListener('change', () => { if (audio) analyse(true); }); sensH.addEventListener('pointerup', () => { if (audio) analyse(true); });
        const again = el('button', T.again, r3); again.type = 'button'; again.onclick = () => analyse(true);
        const sl = el('button', T.shiftL, r3); sl.type = 'button'; sl.title = T.shift; sl.onclick = () => shiftClip(-1);
        const sr = el('button', T.shiftR, r3); sr.type = 'button'; sr.title = T.shift; sr.onclick = () => shiftClip(1);
        const clr = el('button', T.clear, r3); clr.type = 'button'; clr.onclick = () => { runId++; audio = null; pre = null; result = null; state.clip = null; stepIndex = []; busy = false; setMsg('', false); paint(); };
        const summary = el('div', null, app, 'status'); summary.style.color = 'var(--fg,#e2e6ea)';
        const cv = el('canvas', null, app); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', T.lanes); cv.addEventListener('click', onCanvas);
        const lanes = el('div', null, app, 'lanes');
        const r4 = el('div', null, app, 'row');
        const lsend = el('label', null, r4); lsend.className = 'inl'; const send = el('input', null, lsend); send.type = 'checkbox'; el('span', T.play, lsend); send.onchange = () => { state.send = send.checked; };
        const mode = mkSelect(r4, T.mode, [['notes', T.modeNotes], ['trigs', T.modeTrigs]], v => { state.mode = pick(v, MODES, 'notes'); });
        const levH = el('div', null, r4); const level = host.ui.knob(levH, T.level, [0.1, 1, 0.01], state.level, v => Math.round(v * 100) + '%', v => { state.level = v; }, { def: 0.9 });
        const useB = el('button', T.useTempo, r4); useB.type = 'button'; useB.onclick = () => { const c = state.clip; if (c && typeof host.setTempo === 'function') host.setTempo(Math.round(c.bpm * 10) / 10); };
        const saveB = el('button', T.saveClip, r4); saveB.type = 'button'; saveB.onclick = () => { const cp = buildClip(); if (cp && typeof host.saveFile === 'function') host.saveFile((cp.name || 'drum-listener').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.patchkamer-clip.json', JSON.stringify(cp, null, 1)); };
        el('div', T.swingHint, app, 'warn'); const status = el('div', null, app, 'status'); sh.addEventListener('pointerdown', e => e.stopPropagation()); sh.addEventListener('keydown', e => e.stopPropagation());
        ui = { rec: recB, recLen, bpm, bars, grid, swing, align, sens, level, send, mode, summary, status, cv, lanes, geo: null }; paint();
        stopFrame = host.frame(self, frame, 20);
      },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = ui = null; },
      onStep(info) {
        try {
          if (dead || !state.send || !state.clip || !info) return; const c = state.clip, steps = c.length / 12, pos = (((Math.floor(info.bar) || 0) * 16 + (Math.floor(info.step) || 0)) % steps + steps) % steps;
          curStep = pos; const sd = Number.isFinite(info.stepDur) && info.stepDur > 0 ? info.stepDur : 0.125, t0 = Number.isFinite(info.time) ? info.time : ctx.currentTime;
          const extra = (pos % 2 === 1 && !(info.swing > 0)) ? c.swing * sd : 0;
          for (const h of stepIndex[pos] || []) {
            const ln = c.lanes[h[1]]; if (!ln || ln.mute) continue; const t = t0 + ((h[0] % 12) / 12) * sd + extra, vel = cl(h[2] * state.level, 0.01, 1);
            if (state.mode === 'trigs') emit({ type: 'trig', lane: ln.type, vel, time: t }); else emit({ type: 'note', note: GM[ln.type], vel, time: t, dur: 0.12 });
          }
        } catch (e) { /* de planner mag niet vallen */ }
      },
      loadAudio(files, info) { return loadFiles(files, info).catch(() => { setMsg(T.errDecode, true); }); },
      clipInfo() { try { const c = state.clip; if (!c) return null; return { name: (c.name || T.clipName).slice(0, 40), copy: ['drums'], paste: [], length: { min: 12, max: MAXLEN, step: 12, current: c.length, shared: true }, grid: [16, 32], maxEvents: MAXHITS, scheme: 'gm', lanes: laneDefs().map(d => ({ id: d.id, name: d.name, type: d.type, note: d.note })) }; } catch (e) { return null; } },
      getClip() { try { return buildClip(); } catch (e) { return null; } },
      setClip() { return { ok: false, reason: T.noPaste }; },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) {
        if (dead) return; s = s && typeof s === 'object' ? s : {};
        state = { bpm: num(s.bpm, 0, 300, 0) >= 40 ? num(s.bpm, 0, 300, 0) : 0, bars: pick(s.bars, BARS, DEFAULTS.bars), grid: pick(s.grid, GRID_LIST, DEFAULTS.grid), swing: s.swing === -1 ? -1 : num(s.swing, 0, 0.6, -1),
          align: pick(s.align, ALIGN, DEFAULTS.align), sens: num(s.sens, 0, 1, DEFAULTS.sens), rec: pick(s.rec, REC, DEFAULTS.rec), send: typeof s.send === 'boolean' ? s.send : DEFAULTS.send, mode: pick(s.mode, MODES, DEFAULTS.mode),
          level: num(s.level, 0.1, 1, DEFAULTS.level), name: '', clip: cleanClip(s.clip) };
        indexClip(); paint();
      },
      getPreset() { const p = self.getState(); delete p.clip; delete p.name; delete p.send; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, ...p, clip: s.clip, send: s.send }); },
      destroy() { if (dead) return; dead = true; runId++; self.unmount(); try { if (node) node.port.postMessage({ t: 'stop' }); } catch (e) { /* ok */ } for (const n of [inG, thru, node]) { try { n && n.disconnect(); } catch (e) { /* ok */ } } rec = null; audio = null; pre = null; }
    };
    return self;
  }
};
