// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.1.0 — Patchkamer contract v1.34: latency() meldt de gemeten vertraging van de hoofdweg aan de host (alleen weergave; de host compenseert niet).
// 1.0.0 — Eerste versie. Pitch Shifter: verschuift de toonhoogte (−24 … +24 halve tonen plus cents) met behoud van tempo, in drie motoren:
//   Percussief (korte korrels zonder zoeker, ca. 3 tot 12 ms latentie, voor drums), Korrel (korrels met correlatiezoeker voor aansluitende golfvormen,
//   ca. 14 tot 19 ms) en Vocoder (faseverankerde fasevocoder met formantbehoud en -verschuiving, 21 tot 85 ms). Mix met tijdgelijk gemaakt droog signaal,
//   terugkoppeling (octaaf-echo) met toonfilter en zachte begrenzing, glijtijd voor het interval. AudioWorklet, stereo.
//   De motor (FFT, korrel- en fasevocodermotor) staat ook in Harmonizer en Pitch Correction: elk apparaat is één zelfstandig bestand.
//   Bewaker: ingang begrensd (±16) en NaN naar 0, toestanden per blok op eindigheid gecontroleerd en bij ontsporing teruggezet.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// id, naam nl, naam en, min, max, log, rol, bereik, aan
const MODP = [['semi', 'Toonhoogte', 'Pitch', -24, 24, false, 'pitch', 0.05, false], ['cents', 'Fijn', 'Fine', -100, 100, false, 'pitch', 0.05, false],
  ['formant', 'Formantbehoud', 'Formant keep', 0, 1, false, 'tone', 0.1, false], ['mix', 'Mix', 'Mix', 0, 1, false, 'send', 0.08, false], ['fb', 'Terugkoppeling', 'Feedback', 0, 0.9, false, 'feedback', 0.08, false],
  ['fshift', 'Formantverschuiving', 'Formant shift', -12, 12, false, 'tone', 0.1, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ mode: 'grain', win: 'normal', semi: 0, cents: 0, formant: 1, fshift: 0, mix: 1, fb: 0, fbtone: 6000, glide: 20 });
const MODES = ['perc', 'grain', 'vocoder'], WINS = ['fast', 'normal', 'high'];
const RANGES = { semi: [-24, 24], cents: [-100, 100], formant: [0, 1], fshift: [-12, 12], mix: [0, 1], fb: [0, 0.9], fbtone: [500, 16000], glide: [0, 500] };
const TXT = {
  nl: { mode: 'Motor', perc: 'Percussief (korrels, snel)', grain: 'Korrel (zang, instrumenten)', vocoder: 'Vocoder (formanten)', win: 'Venster', fast: 'Snel', normal: 'Normaal', high: 'Hoog',
    pitch: 'Toonhoogte', fine: 'Fijn', formant: 'Formant %', fshift: 'Formant st', mix: 'Mix', fb: 'Terugkoppeling', tone: 'Toon terugk.', glide: 'Glij',
    lat: 'Latentie: {0} ms (bij grote intervallen in de korrelmotoren tot {1} ms)', latv: 'Latentie: {0} ms', unvoc: 'Formantbehoud en -verschuiving werken alleen in de motor Vocoder.',
    load: 'AudioWorklet laden…', fail: 'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.', ports: { out: 'Uit' } },
  en: { mode: 'Engine', perc: 'Percussive (grains, fast)', grain: 'Grain (voice, instruments)', vocoder: 'Vocoder (formants)', win: 'Window', fast: 'Fast', normal: 'Normal', high: 'High',
    pitch: 'Pitch', fine: 'Fine', formant: 'Formant %', fshift: 'Formant st', mix: 'Mix', fb: 'Feedback', tone: 'Feedback tone', glide: 'Glide',
    lat: 'Latency: {0} ms (up to {1} ms for large intervals in the grain engines)', latv: 'Latency: {0} ms', unvoc: 'Formant keep and shift only work in the Vocoder engine.',
    load: 'Loading AudioWorklet…', fail: 'AudioWorklet unavailable: the sound passes through unprocessed.', ports: { out: 'Out' } },
};
const WNAME = 'nl-patchkamer-pitchshifter-1-0-0';
const WORKLET = `
// ---- Gedeelde toonhoogte-motor (identiek in Pitch Shifter, Harmonizer en Pitch Correction) ----
const IN_MAX = 16, TAU = Math.PI * 2;
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const isf = v => v === v && v > -1e30 && v < 1e30;
const clean = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
const st2r = s => Math.pow(2, s / 12);

// Radix-2 FFT, ongenormeerd (heen: e^-i, terug: e^+i)
class FFT {
  constructor(n) {
    this.n = n; const bits = Math.round(Math.log2(n));
    this.rev = new Uint32Array(n);
    for (let i = 0; i < n; i++) { let r = 0, x = i; for (let b = 0; b < bits; b++) { r = (r << 1) | (x & 1); x >>= 1; } this.rev[i] = r; }
    this.cs = new Float64Array(n >> 1); this.sn = new Float64Array(n >> 1);
    for (let i = 0; i < (n >> 1); i++) { this.cs[i] = Math.cos(TAU * i / n); this.sn[i] = -Math.sin(TAU * i / n); }
  }
  run(re, im, inv) {
    const n = this.n, rev = this.rev, cs = this.cs, sn = this.sn, sg = inv ? -1 : 1;
    for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let s = 0; s < n; s += size) {
        for (let k = 0, t = 0; k < half; k++, t += step) {
          const wr = cs[t], wi = sg * sn[t], a = s + k, b = a + half;
          const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        }
      }
    }
  }
}

// Korrelige motor: twee overlappende korrels per stem, elk leest met snelheid r uit een ringbuffer (vertraging verandert 1-r per sample).
// Een korrel start met een vertraging die bij r=1 vast blijft (dus bit-identiek doorgeven) en wordt bij het begin (volume 0) zo verschoven
// dat de golfvorm aansluit op de andere korrel (correlatiezoeker, zoekbereik S samples). S=0: geen zoeker (percussief).
class GrainEngine {
  constructor(nch, nv, W, S) {
    this.nch = nch; this.nv = nv; this.W = Math.max(64, W | 0); this.S = S | 0; this.pad = this.S + 4; this.margin = Math.round(this.W * 0.12); this.lat0 = this.pad + this.margin;
    this.sz = 32768; this.mask = this.sz - 1; this.L = Math.min(320, Math.max(96, this.W >> 2));
    this.b0 = new Float64Array(this.sz); this.b1 = nch > 1 ? new Float64Array(this.sz) : null; this.m = nch > 1 ? new Float64Array(this.sz) : this.b0;
    this.w = 0; this.ph = new Float64Array(nv * 2); this.dl = new Float64Array(nv * 2); this.off = new Float64Array(nv * 2);
    this.rr = new Float64Array(nv).fill(1);
    this.reset();
  }
  reset() {
    this.b0.fill(0); if (this.b1) this.b1.fill(0); if (this.nch > 1) this.m.fill(0); this.w = 0;
    for (let v = 0; v < this.nv; v++) { this.ph[v * 2] = (v * 0.5 / this.nv) % 0.5; this.ph[v * 2 + 1] = this.ph[v * 2] + 0.5; this.off[v * 2] = this.off[v * 2 + 1] = 0; this.dl[v * 2] = this.dl[v * 2 + 1] = this.lat0; this.rr[v] = 1; }
  }
  resetVoice(v) { this.ph[v * 2] = (v * 0.5 / this.nv) % 0.5; this.ph[v * 2 + 1] = this.ph[v * 2] + 0.5; this.off[v * 2] = this.off[v * 2 + 1] = 0; this.dl[v * 2] = this.dl[v * 2 + 1] = this.lat0; }
  get latency() { return this.lat0; }           // vertraging bij r=1; gemiddeld lat0 + |1-r|*W/2
  avgLatency(r) { return this.lat0 + Math.abs(1 - r) * this.W / 2; }
  push(a, b) { const i = this.w & this.mask; this.b0[i] = a; if (this.nch > 1) { this.b1[i] = b; this.m[i] = 0.5 * (a + b); } this.w++; }
  rd(buf, pos) {
    const m = this.mask, i = Math.floor(pos), f = pos - i;
    const y0 = buf[(i - 1) & m], y1 = buf[i & m], y2 = buf[(i + 1) & m], y3 = buf[(i + 2) & m];
    return ((((0.5 * (y3 - y0) + 1.5 * (y1 - y2)) * f + (y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3)) * f) + 0.5 * (y2 - y0)) * f + y1;
  }
  start(v, h, r) {            // nieuwe korrel van kop h: beginvertraging + correlatiezoeker t.o.v. de andere kop
    const k = v * 2 + h, o = v * 2 + 1 - h, W = this.W, S = this.S;
    const base = this.lat0 + Math.max(0, r - 1) * W;
    let off = 0;
    if (S > 0) {
      const m = this.m, mk = this.mask, newest = this.w - 1, L = this.L;
      const po = Math.round(newest - this.dl[o]);
      let eo = 0; for (let n = 1; n <= L; n++) { const x = m[(po - n) & mk]; eo += x * x; }
      if (eo > 1e-12) {
        let best = -1e30;
        const test = (c, st) => {
          const pc = Math.round(newest - (base + c)); let cr = 0, ec = 0;
          for (let n = 1; n <= L; n += st) { const x = m[(pc - n) & mk]; cr += x * m[(po - n) & mk]; ec += x * x; }
          const sc = ec > 1e-12 ? cr / Math.sqrt(ec) - Math.abs(c) * 1e-9 : -1e29; if (sc > best) { best = sc; off = c; }
        };
        for (let c = -S; c <= S; c += 4) test(c, 2);     // grof: stap 4 in de verschuiving, elke 2e sample
        best = -1e30; const o0 = off; test(0, 1); for (let c = o0 - 4; c <= o0 + 4; c++) if (c >= -S && c <= S) test(c, 1);   // fijn
      }
    }
    this.off[k] = off; this.dl[k] = base + off;
  }
  read(v, r, out) {
    r = r > 0.1 ? (r < 8 ? r : 8) : 0.1;      // verhouding begrensd (ca. -40 ... +36 halve tonen): de vertraging blijft binnen de buffer
    const W = this.W, nch = this.nch, newest = this.w - 1, slope = 1 - r;
    out[0] = 0; if (nch > 1) out[1] = 0;
    for (let h = 0; h < 2; h++) {
      const k = v * 2 + h; let ph = this.ph[k], d = this.dl[k];
      const s = Math.sin(Math.PI * ph), g = s * s;
      if (d < 2.01) d = 2.01;
      const pos = newest - d;
      out[0] += g * this.rd(this.b0, pos); if (nch > 1) out[1] += g * this.rd(this.b1, pos);
      this.dl[k] = d + slope; ph += 1 / W;
      if (ph >= 1) { ph -= 1; this.ph[k] = ph; this.start(v, h, r); } else this.ph[k] = ph;
    }
  }
  sane() { for (let k = 0; k < this.nv * 2; k++) if (!(isf(this.ph[k]) && isf(this.dl[k]) && this.dl[k] < this.sz - 8 && this.ph[k] >= 0 && this.ph[k] < 1)) { this.reset(); return false; } return true; }
}

// Fasevocoder-motor: heen: venster + FFT, pieken in het spectrum met invloedsgebieden (faseverankerd), per stem verschoven en
// teruggezet; formantbehoud via een cepstraal gladgestreken omhullende. Latentie N-1 samples, hop N/4.
// Twee reele signalen (kanalen of stemmen) delen steeds een complexe FFT (een in het reele, een in het imaginaire deel).
class PVEngine {
  constructor(nch, nv, N) {
    this.nch = nch; this.nv = nv; this.N = N; this.hop = N >> 2; this.H = N >> 1; this.fft = new FFT(N); this.mask = N - 1;
    this.win = new Float64Array(N); for (let i = 0; i < N; i++) this.win[i] = 0.5 - 0.5 * Math.cos(TAU * i / N);
    this.scale = 1 / (1.5 * N); const H1 = this.H + 1;
    this.zr = new Float64Array(N); this.zi = new Float64Array(N); this.ar = new Float64Array(H1); this.ai = new Float64Array(H1); this.br = new Float64Array(H1); this.bi = new Float64Array(H1);
    this.lew = new Float64Array(H1); this.nP = new Float64Array(H1); this.nS = new Float64Array(H1);
    this.ib = []; this.lastPh = []; this.xr = []; this.xi = []; this.mag = []; this.ph = []; this.fb = []; this.le = []; this.pk = []; this.np = []; this.ola = []; this.pP = []; this.pS = []; this.pN = [];
    for (let c = 0; c < nch; c++) {
      this.ib.push(new Float64Array(N)); this.lastPh.push(new Float64Array(H1)); this.xr.push(new Float64Array(H1)); this.xi.push(new Float64Array(H1)); this.mag.push(new Float64Array(H1)); this.ph.push(new Float64Array(H1)); this.fb.push(new Float64Array(H1));
      this.le.push(new Float64Array(H1)); this.pk.push(new Int32Array(H1)); this.np.push(0); this.ola.push([]); this.pP.push([]); this.pS.push([]); this.pN.push([]);
      for (let v = 0; v < nv; v++) { this.ola[c].push(new Float64Array(N)); this.pP[c].push(new Float64Array(H1)); this.pS[c].push(new Float64Array(H1)); this.pN[c].push(0); }
    }
    this.ratio = new Float64Array(nv).fill(1); this.fa = new Float64Array(nv); this.fs = new Float64Array(nv).fill(1); this.on = new Uint8Array(nv).fill(1);
    this.cnt = 0; this.rpos = 0; this.bad = false; this.live = new Uint8Array(nch);
  }
  get latency() { return this.N - 1; }
  setVoice(v, ratio, fa, fs) { this.ratio[v] = cl(ratio, 0.1, 8); this.fa[v] = cl(fa, 0, 1); this.fs[v] = cl(fs, 0.25, 4); }
  reset() { for (let c = 0; c < this.nch; c++) { this.ib[c].fill(0); this.lastPh[c].fill(0); for (let v = 0; v < this.nv; v++) { this.ola[c][v].fill(0); this.pN[c][v] = 0; } } this.cnt = 0; this.rpos = 0; this.bad = false; }
  push(a, b) {
    const i = this.cnt & this.mask; this.ib[0][i] = a; if (this.nch > 1) this.ib[1][i] = b; this.cnt++;
    if ((this.cnt % this.hop) === 0) { this.frame(); if (this.bad) this.reset(); }
  }
  read(v, out) {
    const i = this.rpos;
    for (let c = 0; c < this.nch; c++) out[c] = this.ola[c][v][i];
    if (v === this.nv - 1) { for (let c = 0; c < this.nch; c++) for (let q = 0; q < this.nv; q++) this.ola[c][q][i] = 0; this.rpos = (i + 1) & this.mask; }
  }
  frame() {
    const N = this.N, H = this.H, hop = this.hop, mk = this.mask, nch = this.nch, zr = this.zr, zi = this.zi, win = this.win, wi = this.cnt & mk, w0 = TAU * hop / N;
    const e0 = [0, 0];
    for (let n = 0; n < N; n++) { const w = win[n], x = this.ib[0][(wi + n) & mk] * w; zr[n] = x; e0[0] += x * x; if (nch > 1) { const y = this.ib[1][(wi + n) & mk] * w; zi[n] = y; e0[1] += y * y; } else zi[n] = 0; }
    let any = false; for (let c = 0; c < nch; c++) { this.live[c] = e0[c] > 1e-14 ? 1 : 0; if (this.live[c]) any = true; }
    if (!any) { for (let c = 0; c < nch; c++) { this.lastPh[c].fill(0); for (let v = 0; v < this.nv; v++) this.pN[c][v] = 0; } return; }
    this.fft.run(zr, zi, false);
    for (let c = 0; c < nch; c++) {
      const xr = this.xr[c], xi = this.xi[c], mag = this.mag[c], ph = this.ph[c], fb = this.fb[c], lp = this.lastPh[c]; let mx = 0;
      for (let k = 0; k <= H; k++) {
        const j = (N - k) & mk;
        if (nch === 1) { xr[k] = zr[k]; xi[k] = zi[k]; }
        else if (c === 0) { xr[k] = 0.5 * (zr[k] + zr[j]); xi[k] = 0.5 * (zi[k] - zi[j]); }
        else { xr[k] = 0.5 * (zi[k] + zi[j]); xi[k] = -0.5 * (zr[k] - zr[j]); }
        const a = xr[k], b = xi[k]; mag[k] = Math.sqrt(a * a + b * b); if (mag[k] > mx) mx = mag[k];
        const p = Math.atan2(b, a); ph[k] = p;
        let d = p - lp[k] - k * w0; d -= TAU * Math.round(d / TAU); fb[k] = k + d / w0; lp[k] = p;
      }
      const pk = this.pk[c], thr = mx * 1e-4; let np = 0;
      for (let k = 2; k < H - 1; k++) { const m = mag[k]; if (m > thr && m >= mag[k - 1] && m > mag[k + 1] && m >= mag[k - 2] && m > mag[k + 2]) pk[np++] = k; }
      if (np === 0) { let bk = 1; for (let k = 1; k < H; k++) if (mag[k] > mag[bk]) bk = k; pk[0] = bk; np = 1; }
      this.np[c] = np;
    }
    // omhullende (cepstrum, gepaard) als een stem formantbehoud of -verschuiving vraagt
    let needEnv = false; for (let v = 0; v < this.nv; v++) if (this.on[v] && this.fa[v] > 0.001) needEnv = true;
    if (needEnv) {
      for (let k = 0; k <= H; k++) {
        const l0 = Math.log(this.mag[0][k] + 1e-9), l1 = nch > 1 ? Math.log(this.mag[1][k] + 1e-9) : 0;
        zr[k] = l0; zi[k] = l1; if (k > 0 && k < H) { zr[N - k] = l0; zi[N - k] = l1; }
      }
      this.fft.run(zr, zi, false);
      // kiest de afsnijding van het cepstrum onder de grondperiode (cepstrale piek), zodat de omhullende de harmonischen niet volgt
      const sr = sampleRate, tlo = Math.max(8, Math.floor(sr / 1100)), thi = Math.min(H - 1, Math.ceil(sr / 65)); let tb = 0, tv = -1e30, ts = 0;
      for (let n = tlo; n <= thi; n++) { const v = zr[n] + (nch > 1 ? zi[n] : 0); ts += Math.abs(v); if (v > tv) { tv = v; tb = n; } }
      let lc = 60; if (tv > 4 * ts / (thi - tlo + 1)) lc = cl(Math.round(0.45 * tb), 24, 150);
      for (let n = lc + 1; n < N - lc; n++) { zr[n] = 0; zi[n] = 0; } zr[lc] *= 0.5; zi[lc] *= 0.5; zr[N - lc] *= 0.5; zi[N - lc] *= 0.5;
      this.fft.run(zr, zi, false);
      for (let k = 0; k <= H; k++) { this.le[0][k] = zr[k] / N; if (nch > 1) this.le[1][k] = zi[k] / N; }
    }
    // synthese: taken (stem, kanaal) in paren, een IFFT per paar
    let jc = -1, jv = -1, ja = false;
    for (let v = 0; v < this.nv; v++) {
      if (!this.on[v]) { for (let c = 0; c < nch; c++) this.pN[c][v] = 0; continue; }
      for (let c = 0; c < nch; c++) {
        if (!this.live[c]) { this.pN[c][v] = 0; continue; }
        if (!ja) { this.build(c, v, this.ar, this.ai); jc = c; jv = v; ja = true; }
        else { this.build(c, v, this.br, this.bi); this.emit(jc, jv, c, v, true); ja = false; }
      }
    }
    if (ja) { this.br.fill(0); this.bi.fill(0); this.emit(jc, jv, -1, -1, false); }
  }
  build(c, v, Ar, Ai) {
    const H = this.H, hop = this.hop, N = this.N, w0 = TAU * hop / N, r = this.ratio[v], a = this.fa[v], fs = this.fs[v];
    const re = this.xr[c], im = this.xi[c], ph = this.ph[c], fb = this.fb[c], pk = this.pk[c], np = this.np[c], le = this.le[c], lew = this.lew;
    Ar.fill(0); Ai.fill(0);
    const useF = a > 0.001;
    if (useF) { for (let k = 0; k <= H; k++) { const q = k / fs, i0 = Math.floor(q); lew[k] = i0 >= H ? le[H] : le[i0] + (le[i0 + 1] - le[i0]) * (q - i0); } }
    const pP = this.pP[c][v], pS = this.pS[c][v], pN = this.pN[c][v], nP = this.nP, nS = this.nS; let j = 0;
    for (let q = 0; q < np; q++) {
      const p = pk[q], lo = q === 0 ? 0 : (pk[q - 1] + p + 1) >> 1, hi = q === np - 1 ? H : (p + pk[q + 1]) >> 1;
      const ft = fb[p] * r, kt = Math.round(ft), d = kt - p;
      let base = ph[p];
      if (pN > 0) { while (j + 1 < pN && Math.abs(pP[j + 1] - fb[p]) <= Math.abs(pP[j] - fb[p])) j++; base = pS[j]; }
      const syn = base + w0 * ft; nP[q] = fb[p]; nS[q] = syn;
      const rot = syn - ph[p], cr = Math.cos(rot), sr = Math.sin(rot);
      let g = 1; if (useF) g = Math.exp(a * cl(lew[cl(kt, 0, H)] - le[p], -1.5, 1.5));   // een winst per invloedsgebied (anders vervormt de flank van een toon)
      for (let k = lo; k <= hi; k++) {
        const k2 = k + d; if (k2 < 1 || k2 > H) continue;
        Ar[k2] += (re[k] * cr - im[k] * sr) * g; Ai[k2] += (re[k] * sr + im[k] * cr) * g;
      }
    }
    for (let q = 0; q < np; q++) { pP[q] = nP[q]; pS[q] = nS[q]; } this.pN[c][v] = np;
    Ar[0] = 0; Ai[0] = 0; Ai[H] = 0;
  }
  emit(ca, va, cb, vb, two) {
    const N = this.N, H = this.H, zr = this.zr, zi = this.zi, Ar = this.ar, Ai = this.ai, Br = this.br, Bi = this.bi, mk = this.mask, sc = this.scale, win = this.win, o = this.rpos;
    for (let k = 0; k <= H; k++) {
      zr[k] = Ar[k] - Bi[k]; zi[k] = Ai[k] + Br[k];
      if (k > 0 && k < H) { zr[N - k] = Ar[k] + Bi[k]; zi[N - k] = Br[k] - Ai[k]; }
    }
    this.fft.run(zr, zi, true);
    const oa = this.ola[ca][va], ob = two ? this.ola[cb][vb] : null; let chk = 0;
    for (let n = 0; n < N; n++) { const w = win[n] * sc, ya = zr[n] * w, idx = (o + n) & mk; chk += ya; oa[idx] += ya; if (two) { const yb = zi[n] * w; chk += yb; ob[idx] += yb; } }
    if (!isf(chk)) this.bad = true;
  }
  sane() { return !this.bad; }
}

// Toonhoogtedetectie (YIN) met een grove zoektocht op 12 kHz en een verfijning op de volle samplerate
class Yin {
  constructor(sr) {
    this.sr = sr; this.D = Math.max(1, Math.round(sr / 12000)); this.fs = sr / this.D;
    this.tmin = Math.max(6, Math.floor(this.fs / 1100)); this.tmax = Math.ceil(this.fs / 62); this.W = Math.round(this.fs * 0.0215);
    this.n = this.W + this.tmax + 4; this.dsz = 2048; this.dm = this.dsz - 1; this.db = new Float64Array(this.dsz); this.dw = 0;
    this.fsz = 8192; this.fm = this.fsz - 1; this.fb = new Float64Array(this.fsz); this.fw = 0;
    const w0 = TAU * 0.4 * this.fs / sr, c = Math.cos(w0), al = Math.sin(w0) / 1.4142; const a0 = 1 + al;
    this.b0 = (1 - c) / 2 / a0; this.b1 = (1 - c) / a0; this.b2 = this.b0; this.a1 = -2 * c / a0; this.a2 = (1 - al) / a0; this.z1 = 0; this.z2 = 0; this.cd = 0;
    this.xs = new Float64Array(this.n); this.d = new Float64Array(this.tmax + 2); this.dn = new Float64Array(this.tmax + 2);
    this.f0 = 0; this.conf = 0; this.rms = 0; this.thr = 0.18;
  }
  push(x) {
    this.fb[this.fw & this.fm] = x; this.fw++;
    const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y;
    if (++this.cd >= this.D) { this.cd = 0; this.db[this.dw & this.dm] = isf(y) ? y : 0; this.dw++; }
    if (!isf(this.z1) || !isf(this.z2)) { this.z1 = 0; this.z2 = 0; }
  }
  detect() {
    const n = this.n, W = this.W, tmax = this.tmax, xs = this.xs, d = this.d, dn = this.dn;
    if (this.dw < n || this.fw < 3000) { this.f0 = 0; this.conf = 0; return 0; }
    let e = 0; for (let i = 1; i <= 512; i++) { const x = this.fb[(this.fw - i) & this.fm]; e += x * x; } this.rms = Math.sqrt(e / 512);
    for (let i = 0; i < n; i++) xs[i] = this.db[(this.dw - n + i) & this.dm];
    let run = 0; d[0] = 0; dn[0] = 1;
    for (let t = 1; t <= tmax; t++) { let s = 0; for (let j = 0; j < W; j++) { const q = xs[j] - xs[j + t]; s += q * q; } d[t] = s; run += s; dn[t] = run > 1e-20 ? s * t / run : 1; }
    let t0 = -1; const thr = this.thr;
    for (let t = this.tmin; t < tmax; t++) { if (dn[t] < thr) { while (t + 1 < tmax && dn[t + 1] < dn[t]) t++; t0 = t; break; } }
    if (t0 < 0) { let b = 2, bv = 9; for (let t = this.tmin; t < tmax; t++) if (dn[t] < bv) { bv = dn[t]; b = t; } t0 = b; }
    // onderoctaaf-controle: ligt er bij een veelvoud van de gevonden periode een veel diepere dip, dan is dat de echte periode
    // (een sterke tweede harmonische, bijvoorbeeld bij een klinker, geeft anders een octaaf te hoog)
    for (let pass = 0; pass < 2; pass++) {
      if (!(dn[t0] > 0.07)) break; let bt = -1, bv = dn[t0] * 0.15;
      for (let m = 2; m <= 3; m++) { const c = m * t0; if (c + 2 >= tmax) break; for (let t = c - 2; t <= c + 2; t++) if (dn[t] < bv) { bv = dn[t]; bt = t; } }
      if (bt < 0) break; t0 = bt;
    }
    const dmin = dn[t0]; this.conf = cl(1 - dmin, 0, 1);
    if (dmin > 0.5 || this.rms < 1e-4) { this.f0 = 0; return 0; }
    let tf = t0; if (t0 > 1 && t0 < tmax) { const a = dn[t0 - 1], b = dn[t0], c = dn[t0 + 1], den = a - 2 * b + c; if (den > 1e-12) tf = t0 + 0.5 * (a - c) / den; }
    // verfijning op de volle samplerate
    const D = this.D, c0 = tf * D, Wf = Math.round(cl(1.5 * c0, 384, 1400)), fbuf = this.fb, fm = this.fm, base = this.fw - 1;
    let bestT = Math.round(c0), bv = 1e30; const lo = Math.max(8, Math.floor(c0) - D - 1), hi = Math.ceil(c0) + D + 1; const vals = {};
    const dif = t => { let s = 0, a2 = 0, b2 = 0; for (let j = 0; j < Wf; j++) { const x = fbuf[(base - j) & fm], y = fbuf[(base - j - t) & fm]; const q = x - y; s += q * q; a2 += x * x; b2 += y * y; } return s / (a2 + b2 + 1e-20); };
    for (let t = lo; t <= hi; t++) { const v = dif(t); vals[t] = v; if (v < bv) { bv = v; bestT = t; } }
    let tr = bestT; if (vals[bestT - 1] !== undefined && vals[bestT + 1] !== undefined) { const a = vals[bestT - 1], b = vals[bestT], c = vals[bestT + 1], den = a - 2 * b + c; if (den > 1e-15) tr = bestT + 0.5 * (a - c) / den; }
    this.f0 = this.sr / tr; return this.f0;
  }
}

// Vertraging met bruchdeel (lineair), voor droog-compensatie en stemvertraging
class FDelay {
  constructor(n) { this.n = 1; while (this.n < n + 4) this.n <<= 1; this.b = new Float64Array(this.n); this.m = this.n - 1; this.w = 0; }
  write(x) { this.b[this.w & this.m] = x; this.w++; }
  read(d) { const p = this.w - 1 - d, i = Math.floor(p), f = p - i; return this.b[i & this.m] * (1 - f) + this.b[(i + 1) & this.m] * f; }
  clear() { this.b.fill(0); }
}
// ---- Pitch Shifter: processor ----
const SIZES = { grain: [[480, 0], [768, 0], [1152, 0]], tonal: [[1152, 1], [1920, 1], [3072, 1]], pv: [1024, 2048, 4096] };
class PkShifter extends AudioWorkletProcessor {
  constructor() {
    super(); this.sr = sampleRate;
    this.c = { mode: 1, win: 1, st: 0, fa: 1, fs: 0, mix: 1, fb: 0, fbtone: 8000, glide: 20 };
    this.eng = null; this.pv = false; this.cur = -1; this.fade = 0; this.g = 1; this.lat = 0;
    this.dL = new FDelay(16384); this.dR = new FDelay(16384);
    this.stc = 0; this.lpL = 0; this.lpR = 0; this.out = [0, 0];
    this.port.onmessage = e => { const d = e.data; if (d && d.type === 'cfg') this.set(d.c); };
    this.build();
  }
  set(c) {
    if (!c || typeof c !== 'object') return;
    const R = { mode: [0, 2], win: [0, 2], st: [-36, 36], fa: [0, 1], fs: [-12, 12], mix: [0, 1], fb: [0, 0.92], fbtone: [200, 20000], glide: [0, 2000] };
    for (const k in R) { const v = c[k]; if (typeof v === 'number' && v === v && v > -1e9 && v < 1e9) this.c[k] = cl(v, R[k][0], R[k][1]); }
    this.c.mode = Math.round(this.c.mode); this.c.win = Math.round(this.c.win);
  }
  build() {
    const sr = this.sr, m = this.c.mode, w = this.c.win, k = sr / 48000;
    if (m === 2) { this.eng = new PVEngine(2, 1, SIZES.pv[w] * (sr > 60000 ? 2 : 1)); this.pv = true; }
    else { const [W, a] = (m === 0 ? SIZES.grain : SIZES.tonal)[w]; this.eng = new GrainEngine(2, 1, Math.round(W * k), a ? Math.round(sr / 90) : 0); this.pv = false; }
    this.lat = this.eng.latency; this.cur = m * 4 + w; this.dL.clear(); this.dR.clear(); this.lpL = this.lpR = 0;
    this.port.postMessage({ type: 'latency', samples: this.lat, ms: 1000 * this.lat / sr });
  }
  process(inputs, outputs) {
    const o = outputs[0], i0 = inputs[0]; if (!o || !o[0]) return true;
    const len = o[0].length, oL = o[0], oR = o[1] || o[0], inL = i0 && i0[0], inR = i0 && (i0[1] || i0[0]), c = this.c, sr = this.sr, out = this.out;
    if (c.mode * 4 + c.win !== this.cur && this.fade === 0) this.fade = -1;
    const coef = c.glide > 0.5 ? 1 - Math.exp(-1000 / (c.glide * sr)) : 1, a2 = 1 - Math.exp(-TAU * c.fbtone / sr), fbk = c.fb, mix = c.mix, fa = c.fa, fsr = st2r(c.fs);
    for (let n = 0; n < len; n++) {
      const dryL = inL ? clean(inL[n]) : 0, dryR = inR ? clean(inR[n]) : 0;
      let xl = dryL, xr = dryR;
      if (fbk > 0) { xl += Math.tanh(this.lpL * fbk); xr += Math.tanh(this.lpR * fbk); }
      this.stc += (c.st - this.stc) * coef;
      const r = st2r(this.stc), eng = this.eng;
      eng.push(xl, xr);
      if (this.pv) { eng.setVoice(0, r, fa, fsr); eng.read(0, out); } else eng.read(0, r, out);
      if (this.fade < 0) { this.g -= 1 / 256; if (this.g <= 0) { this.g = 0; this.fade = 1; this.build(); } }
      else if (this.fade > 0) { this.g += 1 / 256; if (this.g >= 1) { this.g = 1; this.fade = 0; } }
      const wl = out[0] * this.g, wr = out[1] * this.g;
      this.lpL += a2 * (wl - this.lpL); this.lpR += a2 * (wr - this.lpR);
      this.dL.write(dryL); this.dR.write(dryR);
      oL[n] = this.dL.read(this.lat) * (1 - mix) + wl * mix; oR[n] = this.dR.read(this.lat) * (1 - mix) + wr * mix;
    }
    // bewaker: een ontspoorde toestand herstelt zichzelf
    let ok = isf(this.stc) && isf(this.lpL) && isf(this.lpR) && this.eng.sane();
    if (ok) for (let n = 0; n < len; n += 8) if (!isf(oL[n]) || !isf(oR[n])) { ok = false; break; }
    if (!ok) { if (!isf(this.stc)) this.stc = 0; this.lpL = this.lpR = 0; this.eng.reset(); this.dL.clear(); this.dR.clear(); oL.fill(0); oR.fill(0); }
    return true;
  }
}
registerProcessor('${WNAME}', PkShifter);
`;
// Latentie in samples, gelijk aan wat de motor in de worklet meldt (korrel: zoekbereik + 4 + 12% van het venster; vocoder: venster - 1)
function latencySamples(mode, win, sr) {
  const k = sr / 48000, wi = WINS.indexOf(win);
  if (mode === 'vocoder') return [1024, 2048, 4096][wi] * (sr > 60000 ? 2 : 1) - 1;
  const W = Math.round((mode === 'perc' ? [480, 768, 1152] : [1152, 1920, 3072])[wi] * k), S = mode === 'perc' ? 0 : Math.round(sr / 90);
  return S + 4 + Math.round(W * 0.12);
}
function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  Object.keys(d).forEach(k => {
    const v = s[k];
    if (RANGES[k]) S[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, RANGES[k][0], RANGES[k][1]) : d[k];
    else S[k] = v;
  });
  if (!MODES.includes(S.mode)) S.mode = d.mode;
  if (!WINS.includes(S.win)) S.win = d.win;
  S.semi = Math.round(S.semi);
}

export default {
  id: 'nl.patchkamer.pitchshifter',
  name: 'Pitch Shifter',
  version: '1.1.0',
  kind: 'effect',
  category: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  modExclude: ['glide', 'fbtone'],
  ui: { width: 380, minWidth: 380 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const T = host && host.lang === 'nl' ? TXT.nl : TXT.en, sr = ctx.sampleRate || 48000;
    const S = DEF(), mod = {}; let dead = false, ui = {}, node = null, note = null, failed = false, latMs = null;
    const inG = ctx.createGain(), out = ctx.createGain(); let bypass = ctx.createGain(); inG.connect(bypass).connect(out);
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    const fmt = (s, ...a) => a.reduce((t, v, i) => t.replace('{' + i + '}', v), s);
    function paintNote() {
      if (!note) return;
      if (!node) { note.textContent = failed ? T.fail : T.load; return; }
      const ms = latMs ?? 1000 * latencySamples(S.mode, S.win, sr) / sr;
      if (S.mode === 'vocoder') { note.textContent = fmt(T.latv, ms.toFixed(0)); return; }
      const half = 500 * Math.round((S.mode === 'perc' ? [480, 768, 1152] : [1152, 1920, 3072])[WINS.indexOf(S.win)] * sr / 48000) / sr;
      note.textContent = fmt(T.lat, ms.toFixed(0), (ms + half).toFixed(0)) + ' ' + T.unvoc;
    }
    function apply() {
      if (!node) return;
      const st = clamp(E('semi') + E('cents') / 100, -36, 36);
      node.port.postMessage({ type: 'cfg', c: { mode: MODES.indexOf(S.mode), win: WINS.indexOf(S.win), st, fa: E('formant'), fs: E('fshift'), mix: E('mix'), fb: E('fb'), fbtone: S.fbtone, glide: S.glide } });
    }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead) return; if (typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      node.port.onmessage = e => { const d = e && e.data; if (d && d.type === 'latency' && Number.isFinite(d.ms)) { latMs = d.ms; paintNote(); latNote(); } };
      inG.connect(node).connect(out); try { inG.disconnect(bypass); } catch { } apply(); paintNote();
    }).catch(() => { if (dead) return; failed = true; paintNote(); });
    const pct = v => Math.round(v * 100) + '%', sgn = (v, u) => (v > 0 ? '+' : '') + v + u;
    function paint() {
      if (!ui.pitch) return;
      ui.mode.value = S.mode; ui.win.value = S.win; ui.pitch.set(S.semi); ui.fine.set(S.cents); ui.formant.set(S.formant); ui.fshift.set(S.fshift); ui.mix.set(S.mix); ui.fb.set(S.fb); ui.tone.set(S.fbtone); ui.glide.set(S.glide);
    }
    // contract v1.34: vertraging van de hoofdweg (het droge deel loopt gelijk mee): door de worklet gemeld, anders de tabel; zonder worklet geen vertraging
    const latNow = () => node ? (latMs ?? 1000 * latencySamples(S.mode, S.win, sr) / sr) / 1000 : 0;
    let latLast = 0;
    function latNote() { const l = latNow(); if (l !== latLast) { latLast = l; if (host && typeof host.latencyChanged === 'function') { try { host.latencyChanged(self); } catch { } } } }
    const self = {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'minmax(0, 1fr)';
        ui.mode = host.ui.select(el, T.mode, MODES.map(m => [m, T[m]]), S.mode, v => { S.mode = v; latMs = null; apply(); paintNote(); }, { id: 'mode', group: 'engine' });
        ui.win = host.ui.select(el, T.win, WINS.map(m => [m, T[m]]), S.win, v => { S.win = v; latMs = null; apply(); paintNote(); }, { id: 'win', group: 'engine' });
        ui.pitch = host.ui.knob(el, T.pitch, [-24, 24, 1], S.semi, v => sgn(v, ' st'), v => { S.semi = Math.round(v); apply(); }, { id: 'semi', group: 'pitch', default: 0 });
        ui.fine = host.ui.knob(el, T.fine, [-100, 100, 1], S.cents, v => sgn(Math.round(v), ' ct'), v => { S.cents = v; apply(); }, { id: 'cents', group: 'pitch', default: 0 });
        ui.glide = host.ui.knob(el, T.glide, [0, 500, 1], S.glide, v => Math.round(v) + ' ms', v => { S.glide = v; apply(); }, { id: 'glide', group: 'pitch' });
        ui.formant = host.ui.knob(el, T.formant, [0, 1, 0.01], S.formant, pct, v => { S.formant = v; apply(); }, { id: 'formant', group: 'formant' });
        ui.fshift = host.ui.knob(el, T.fshift, [-12, 12, 0.1], S.fshift, v => sgn(+v.toFixed(1), ' st'), v => { S.fshift = v; apply(); }, { id: 'fshift', group: 'formant', default: 0 });
        ui.mix = host.ui.knob(el, T.mix, [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); }, { id: 'mix', group: 'mix' });
        ui.fb = host.ui.knob(el, T.fb, [0, 0.9, 0.01], S.fb, pct, v => { S.fb = v; apply(); }, { id: 'fb', group: 'feedback' });
        ui.tone = host.ui.knob(el, T.tone, [500, 16000, 1], S.fbtone, v => v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : Math.round(v) + ' Hz', v => { S.fbtone = v; apply(); }, { id: 'fbtone', group: 'feedback', scale: 'log' });
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
      },
      unmount() { note = null; ui = {}; },
      params() { return MODP.map(([id, nl, en, min, max, log, role, drift, on]) => ({ id, name: host && host.lang === 'nl' ? nl : en, lane: 'pitch', laneName: 'Pitch Shifter', min, max, role, scale: 'lin', drift, on, fast: false })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      latency() { return latNow(); },
      getState() { return { ...S }; },
      setState(s) { restoreValues(S, s); latMs = null; apply(); paint(); paintNote(); },
      destroy() { if (dead) return; dead = true; [inG, out, bypass, node].forEach(n => { if (n) try { n.disconnect(); } catch { } }); },
    };
    return self;
  }
};
