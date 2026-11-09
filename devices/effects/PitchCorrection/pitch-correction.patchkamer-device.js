// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.2.0 — Uitleg naar about (menu Over Pitch Correction); de UI toont geen uitlegtekst meer.
// 1.1.0 — Patchkamer contract v1.34: latency() meldt de gemeten vertraging van de hoofdweg aan de host (alleen weergave; de host compenseert niet).
// 1.0.0 — Eerste versie. Pitch Correction: monofone toonhoogtedetectie (YIN, ca. 62 tot 1100 Hz, kiesbaar bereik) en correctie naar de dichtstbijzijnde toegestane noot
//   van een toonladder (12 schakelaars per toonhoogteklasse, grondtoon en toonladder als snelkeuze), met snelheid (0 = hard), mate, vibratobehoud en een instelbare
//   referentietoonhoogte (A). Motor: korrel (snel, ca. 14 ms latentie) of fasevocoder met formantbehoud (21 tot 85 ms). Onstemhebbende stukken (stilte, ruis, medeklinkers)
//   gaan onbewerkt door na een instelbare houdtijd. Scherm met de gedetecteerde en gecorrigeerde noot (via host.frame). Monofoon: akkoorden en meerstemmige bronnen worden niet goed gevolgd.
//   AudioWorklet; de motor staat ook in Pitch Shifter en Harmonizer (elk apparaat is één bestand).
//   Bewaker: ingang begrensd (±16) en NaN naar 0, toestanden per blok op eindigheid gecontroleerd en bij ontsporing teruggezet.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = [['chromatic', 'Chromatisch', 'Chromatic', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]], ['major', 'Majeur', 'Major', [0, 2, 4, 5, 7, 9, 11]], ['minor', 'Mineur', 'Minor', [0, 2, 3, 5, 7, 8, 10]],
  ['harmonic', 'Harmonisch mineur', 'Harmonic minor', [0, 2, 3, 5, 7, 8, 11]], ['melodic', 'Melodisch mineur', 'Melodic minor', [0, 2, 3, 5, 7, 9, 11]], ['dorian', 'Dorisch', 'Dorian', [0, 2, 3, 5, 7, 9, 10]],
  ['phrygian', 'Frygisch', 'Phrygian', [0, 1, 3, 5, 7, 8, 10]], ['lydian', 'Lydisch', 'Lydian', [0, 2, 4, 6, 7, 9, 11]], ['mixolydian', 'Mixolydisch', 'Mixolydian', [0, 2, 4, 5, 7, 9, 10]],
  ['pentmaj', 'Pentatoniek majeur', 'Major pentatonic', [0, 2, 4, 7, 9]], ['pentmin', 'Pentatoniek mineur', 'Minor pentatonic', [0, 3, 5, 7, 10]], ['blues', 'Blues', 'Blues', [0, 3, 5, 6, 7, 10]],
  ['whole', 'Hele toon', 'Whole tone', [0, 2, 4, 6, 8, 10]], ['custom', 'Eigen', 'Custom', null]];
const MODES = ['grain', 'vocoder'], WINS = ['fast', 'normal', 'high'], RANGEIDS = ['low', 'mid', 'wide'];
// id, naam nl, naam en, min, max, rol, bereik, aan
const MODP = [['speed', 'Snelheid', 'Speed', 0, 400, 'time', 0.05, false], ['amount', 'Mate', 'Amount', 0, 1, 'level', 0.1, false], ['keep', 'Vibrato behouden', 'Keep vibrato', 0, 1, 'depth', 0.1, false], ['mix', 'Mix', 'Mix', 0, 1, 'send', 0.08, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ mode: 'vocoder', win: 'normal', range: 'mid', key: 0, scale: 'major', notes: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1], speed: 40, amount: 1, keep: 0.5, formant: 1, gate: -50, hold: 100, mix: 1, ref: 440 });
const RANGES = { key: [0, 11], speed: [0, 400], amount: [0, 1], keep: [0, 1], formant: [0, 1], gate: [-70, -20], hold: [0, 500], mix: [0, 1], ref: [430, 450] };
const TXT = {
  nl: { mode: 'Motor', grain: 'Korrel (snel)', vocoder: 'Vocoder (formanten)', win: 'Venster', fast: 'Snel', normal: 'Normaal', high: 'Hoog', range: 'Bereik', low: 'Laag (62–420 Hz)', mid: 'Normaal (75–800 Hz)', wide: 'Hoog (90–1100 Hz)',
    key: 'Grondtoon', scale: 'Toonladder', speed: 'Snelheid', amount: 'Mate', keep: 'Vibrato', formant: 'Formant %', gate: 'Drempel', hold: 'Houden', mix: 'Mix', ref: 'Stemming A',
    det: 'Gehoord: {0}', corr: 'Gecorrigeerd: {0}', none: 'geen toon', lat: 'Latentie: {0} ms', load: 'AudioWorklet laden…', fail: 'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.', aria: 'Gedetecteerde en gecorrigeerde toonhoogte', hard: 'hard', },
  en: { mode: 'Engine', grain: 'Grain (fast)', vocoder: 'Vocoder (formants)', win: 'Window', fast: 'Fast', normal: 'Normal', high: 'High', range: 'Range', low: 'Low (62–420 Hz)', mid: 'Normal (75–800 Hz)', wide: 'High (90–1100 Hz)',
    key: 'Key', scale: 'Scale', speed: 'Speed', amount: 'Amount', keep: 'Vibrato', formant: 'Formant %', gate: 'Threshold', hold: 'Hold', mix: 'Mix', ref: 'Tuning A',
    det: 'Heard: {0}', corr: 'Corrected: {0}', none: 'no pitch', lat: 'Latency: {0} ms', load: 'Loading AudioWorklet…', fail: 'AudioWorklet unavailable: the sound passes through unprocessed.', aria: 'Detected and corrected pitch', hard: 'hard', },
};
const WNAME = 'nl-patchkamer-pitchcorrection-1-0-0';
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
// ---- Pitch Correction: processor ----
const CSIZES = { grain: [768, 1152, 1920], pv: [1024, 2048, 4096] };
class PkCorr extends AudioWorkletProcessor {
  constructor() {
    super(); this.sr = sampleRate;
    this.c = { mode: 1, win: 1, speed: 40, amount: 1, keep: 0.5, fa: 1, gate: 0.003, hold: 100, range: 1, mix: 1, ref: 440 };
    this.mask = new Uint8Array(12).fill(1);
    this.eng = null; this.pv = false; this.cur = -1; this.fade = 0; this.g = 1; this.lat = 0;
    this.dL = new FDelay(16384); this.dR = new FDelay(16384); this.out = [0]; this.yin = new Yin(this.sr);
    this.stc = 0; this.des = 0; this.hasM = false; this.lastM = 0; this.jump = 0; this.mslow = 0; this.tracking = false; this.tn = -1; this.age = 0; this.holdCnt = 1e9; this.uc = 0; this.detM = -1; this.lastRange = -1;
    this.port.onmessage = e => { const d = e.data; if (d && d.type === 'cfg') this.set(d.c); };
    this.build();
  }
  set(c) {
    if (!c || typeof c !== 'object') return;
    const R = { mode: [0, 1], win: [0, 2], speed: [0, 1000], amount: [0, 1], keep: [0, 1], fa: [0, 1], gate: [0, 1], hold: [0, 1000], range: [0, 2], mix: [0, 1], ref: [400, 480] };
    for (const k in R) { const v = c[k]; if (typeof v === 'number' && v === v && v > -1e9 && v < 1e9) this.c[k] = cl(v, R[k][0], R[k][1]); }
    this.c.mode = Math.round(this.c.mode); this.c.win = Math.round(this.c.win); this.c.range = Math.round(this.c.range);
    if (Array.isArray(c.notes) && c.notes.length === 12) { const m = new Uint8Array(12); for (let i = 0; i < 12; i++) m[i] = c.notes[i] ? 1 : 0; this.mask = m; }
    if (this.c.range !== this.lastRange) { this.lastRange = this.c.range; const r = [[62, 420], [75, 800], [90, 1100]][this.c.range], y = this.yin; y.tmin = Math.max(6, Math.floor(y.fs / r[1])); y.tmax = Math.min(Math.ceil(y.fs / r[0]), y.dsz - y.W - 8); y.n = y.W + y.tmax + 4; y.d = new Float64Array(y.tmax + 2); y.dn = new Float64Array(y.tmax + 2); y.xs = new Float64Array(y.n); }
  }
  build() {
    const sr = this.sr, m = this.c.mode, w = this.c.win;
    if (m === 1) { this.eng = new PVEngine(1, 1, CSIZES.pv[w] * (sr > 60000 ? 2 : 1)); this.pv = true; }
    else { this.eng = new GrainEngine(1, 1, Math.round(CSIZES.grain[w] * sr / 48000), Math.round(sr / 110)); this.pv = false; }
    this.lat = this.eng.latency; this.cur = m * 4 + w; this.dL.clear(); this.dR.clear();
    this.port.postMessage({ type: 'latency', samples: this.lat, ms: 1000 * this.lat / sr });
  }
  allowed(n) { return this.mask[((n % 12) + 12) % 12] === 1; }
  step(len) {
    const c = this.c, y = this.yin, sr = this.sr; y.thr = 0.18;
    const f = y.detect(); let voiced = f > 0 && y.conf > 0.55 && y.rms > c.gate, m = 0;
    if (voiced) {
      m = 69 + 12 * Math.log2(f / c.ref);
      if (this.hasM && Math.abs(m - this.lastM) > 6) { if (++this.jump < 4) voiced = false; else this.jump = 0; } else this.jump = 0;
      if (voiced) { this.lastM = m; this.hasM = true; }
    }
    this.detM = voiced ? m : -1;
    if (voiced) {
      if (!this.tracking || Math.abs(m - this.mslow) > 1.5) { this.mslow = m; this.tracking = true; this.age = 0; } else { this.age++; this.mslow += (1 - Math.exp(-len / ((this.age < 40 ? 0.03 : 0.12) * sr))) * (m - this.mslow); }
      const mc = this.mslow, base = Math.round(mc); let cand = -1e9;
      for (let d = 0; d <= 7 && cand < -1e8; d++) {
        const a = base + d, b = base - d, okA = this.allowed(a), okB = this.allowed(b);
        if (okA && okB) cand = Math.abs(mc - a) <= Math.abs(mc - b) ? a : b; else if (okA) cand = a; else if (okB) cand = b;
      }
      if (cand > -1e8 && this.tn >= 0 && this.allowed(this.tn) && Math.abs(mc - this.tn) <= Math.abs(mc - cand) + 0.3) cand = this.tn;
      if (cand > -1e8) this.tn = cand;
      if (cand > -1e8) { const eff = this.mslow + (1 - c.keep) * (m - this.mslow); this.des = cl(c.amount * (this.tn - eff), -12, 12); } else this.des = 0;
      this.holdCnt = 0;
    } else {
      this.holdCnt += len;
      if (this.holdCnt > c.hold * sr / 1000) this.des = 0;
      if (this.holdCnt > 0.35 * sr) { this.tracking = false; this.hasM = false; }
    }
  }
  process(inputs, outputs) {
    const o = outputs[0], i0 = inputs[0]; if (!o || !o[0]) return true;
    const len = o[0].length, oL = o[0], oR = o[1] || o[0], inL = i0 && i0[0], inR = i0 && (i0[1] || i0[0]), c = this.c, sr = this.sr, out = this.out;
    if (c.mode * 4 + c.win !== this.cur && this.fade === 0) this.fade = -1;
    this.step(len);
    const coef = 1 - Math.exp(-1 / (Math.max(c.speed, 3) * 0.001 * sr)), mix = c.mix, eng = this.eng;
    for (let n = 0; n < len; n++) {
      const dryL = inL ? clean(inL[n]) : 0, dryR = inR ? clean(inR[n]) : 0, m = 0.5 * (dryL + dryR);
      this.yin.push(m);
      this.stc += (this.des - this.stc) * coef;
      const r = st2r(this.stc);
      eng.push(m, 0);
      if (this.pv) { eng.setVoice(0, r, c.fa, 1); eng.read(0, out); } else eng.read(0, r, out);
      if (this.fade < 0) this.g = Math.max(0, this.g - 1 / 256); else if (this.fade > 0) this.g = Math.min(1, this.g + 1 / 256);
      const w = out[0] * this.g;
      this.dL.write(dryL); this.dR.write(dryR);
      oL[n] = this.dL.read(this.lat) * (1 - mix) + w * mix; oR[n] = this.dR.read(this.lat) * (1 - mix) + w * mix;
    }
    if (this.fade < 0 && this.g <= 0) { this.build(); this.fade = 1; } else if (this.fade > 0 && this.g >= 1) this.fade = 0;
    if ((this.uc += len) > this.sr / 30) { this.uc = 0; this.port.postMessage({ type: 'ui', det: this.detM, tgt: this.detM >= 0 ? this.tn : -1, out: this.detM >= 0 ? this.detM + this.stc : -1, conf: this.yin.conf }); }
    let ok = isf(this.stc) && isf(this.des) && isf(this.mslow) && this.eng.sane();
    if (ok) for (let n = 0; n < len; n += 8) if (!isf(oL[n]) || !isf(oR[n])) { ok = false; break; }
    if (!ok) { this.stc = 0; this.des = 0; this.mslow = 0; this.tracking = false; this.hasM = false; this.yin.z1 = this.yin.z2 = 0; this.eng.reset(); this.dL.clear(); this.dR.clear(); oL.fill(0); oR.fill(0); }
    return true;
  }
}
registerProcessor('${WNAME}', PkCorr);
`;
// Latentie in samples, gelijk aan wat de motor in de worklet meldt (korrel: zoekbereik + 4 + 12% van het venster; vocoder: venster - 1)
function latencySamples(mode, win, sr) {
  const wi = WINS.indexOf(win);
  if (mode === 'vocoder') return [1024, 2048, 4096][wi] * (sr > 60000 ? 2 : 1) - 1;
  const W = Math.round([768, 1152, 1920][wi] * sr / 48000);
  return Math.round(sr / 110) + 4 + Math.round(W * 0.12);
}
function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  Object.keys(d).forEach(k => {
    const v = s[k];
    if (RANGES[k]) S[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v, RANGES[k][0], RANGES[k][1]) : d[k];
    else if (k === 'notes') S.notes = Array.isArray(v) && v.length === 12 ? v.map(x => (x ? 1 : 0)) : d.notes.slice();
    else S[k] = typeof v === 'string' ? v : d[k];
  });
  if (!MODES.includes(S.mode)) S.mode = d.mode;
  if (!WINS.includes(S.win)) S.win = d.win;
  if (!RANGEIDS.includes(S.range)) S.range = d.range;
  if (!SCALES.some(x => x[0] === S.scale)) S.scale = d.scale;
  S.key = Math.round(S.key);
}

export default {
  id: 'nl.patchkamer.pitchcorrection',
  name: 'Pitch Correction',
  version: '1.2.0',
  about: { nl: 'Corrigeert de toonhoogte van een stem of lijn naar de dichtstbijzijnde toegestane noot van een toonladder.\n\nMonofoon: voor een enkele stem of lijn. Akkoorden, ruis en medeklinkers worden niet gecorrigeerd. Formantbehoud werkt alleen in de motor Vocoder.', en: 'Corrects the pitch of a voice or line to the nearest allowed note of a scale.\n\nMonophonic: for a single voice or line. Chords, noise and consonants are not corrected. Formant keep only works in the Vocoder engine.' },
  kind: 'effect',
  category: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  modExclude: ['formant', 'gate', 'hold', 'ref'],
  ui: { width: 460, minWidth: 420 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', T = nl ? TXT.nl : TXT.en, sr = ctx.sampleRate || 48000;
    const S = DEF(), mod = {}; let dead = false, ui = {}, node = null, note = null, failed = false, latMs = null, cv = null, stop = null, readout = null, root = null;
    const hist = []; let cen = 60;
    const inG = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); inG.connect(bypass).connect(out);
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    const fmt = (s, ...a) => a.reduce((t, v, i) => t.replace('{' + i + '}', v), s);
    const noteName = (m, ref) => { const r = Math.round(m); return NOTES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1); };
    const cents = m => { const c = Math.round((m - Math.round(m)) * 100); return (c > 0 ? '+' : '') + c + ' ct'; };
    function paintNote() { if (note) note.textContent = (node ? fmt(T.lat, (latMs ?? 1000 * latencySamples(S.mode, S.win, sr) / sr).toFixed(0)) : failed ? T.fail : T.load); }
    function apply() {
      if (!node) return;
      node.port.postMessage({ type: 'cfg', c: { mode: MODES.indexOf(S.mode), win: WINS.indexOf(S.win), range: RANGEIDS.indexOf(S.range), speed: E('speed'), amount: E('amount'), keep: E('keep'), fa: S.formant, gate: Math.pow(10, S.gate / 20), hold: S.hold, mix: E('mix'), ref: S.ref, notes: S.notes } });
    }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead) return; if (typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      node.port.onmessage = e => {
        const d = e && e.data; if (!d) return;
        if (d.type === 'latency' && Number.isFinite(d.ms)) { latMs = d.ms; paintNote(); latNote(); }
        else if (d.type === 'ui' && Number.isFinite(d.det)) { hist.push([d.det, Number.isFinite(d.out) ? d.out : -1, Number.isFinite(d.tgt) ? d.tgt : -1]); if (hist.length > 150) hist.shift(); }
      };
      inG.connect(node).connect(out); try { inG.disconnect(bypass); } catch { } apply(); paintNote();
    }).catch(() => { if (dead) return; failed = true; paintNote(); });
    const pct = v => Math.round(v * 100) + '%';
    function setMaskFromScale() { const sc = SCALES.find(x => x[0] === S.scale); if (!sc || !sc[3]) return; const m = new Array(12).fill(0); sc[3].forEach(iv => { m[(S.key + iv) % 12] = 1; }); S.notes = m; }
    function paint() {
      if (!ui.mode) return;
      ui.mode.value = S.mode; ui.win.value = S.win; ui.range.value = S.range; ui.key.value = String(S.key); ui.scale.value = S.scale;
      ['speed', 'amount', 'keep', 'formant', 'gate', 'hold', 'mix', 'ref'].forEach(k => ui[k].set(S[k]));
      S.notes.forEach((v, i) => ui['n' + i] && ui['n' + i].set(!!v));
    }
    function toggle(parent, label, id, group, get, set) {
      if (host.ui && typeof host.ui.pad === 'function') return host.ui.pad(parent, label, { id, group, mode: 'toggle', on: get(), text: label, onchange: on => set(!!on) });
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(get())); b.onclick = () => { const on = !get(); set(on); b.setAttribute('aria-pressed', String(on)); };
      parent.appendChild(b); return { set(on) { b.setAttribute('aria-pressed', String(!!on)); }, el: b };
    }
    function draw() {
      if (dead || !cv) return;
      const w = cv.clientWidth || 300, h = 120, dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const g = cv.getContext('2d'); if (!g) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      let sty = null; try { sty = getComputedStyle(cv); } catch { }
      const acc = (sty && sty.getPropertyValue('--audio').trim()) || '#7ee0a1', mut = (sty && sty.getPropertyValue('--muted').trim()) || '#97a1ad', line = (sty && sty.getPropertyValue('--line').trim()) || '#39424e';
      const last = hist.length ? hist[hist.length - 1] : null; if (last && last[0] >= 0) cen += (last[0] - cen) * 0.1;
      const lo = cen - 5.5, hi = cen + 5.5, Y = m => h - (m - lo) / (hi - lo) * h;
      g.font = '9px system-ui, sans-serif'; g.textBaseline = 'middle';
      for (let n = Math.floor(lo); n <= Math.ceil(hi); n++) { const al = S.notes[((n % 12) + 12) % 12]; const y = Y(n); g.strokeStyle = line; g.globalAlpha = al ? 0.9 : 0.25; g.lineWidth = al ? 1 : 0.5; g.beginPath(); g.moveTo(24, y); g.lineTo(w, y); g.stroke(); if (al) { g.globalAlpha = 0.8; g.fillStyle = mut; g.fillText(NOTES[((n % 12) + 12) % 12], 2, y); } }
      g.globalAlpha = 1; g.lineWidth = 1.5;
      const x0 = 24, dx = (w - x0) / 150;
      [[0, mut], [1, acc]].forEach(([idx, c]) => { g.strokeStyle = c; g.beginPath(); let pen = false; hist.forEach((p, i) => { const m = p[idx]; if (m < 0) { pen = false; return; } const x = x0 + (i + 150 - hist.length) * dx, y = Y(m); if (!pen) { g.moveTo(x, y); pen = true; } else g.lineTo(x, y); }); g.stroke(); });
      if (readout) readout.textContent = last && last[0] >= 0 ? fmt(T.det, noteName(last[0]) + ' ' + cents(last[0])) + '   ' + fmt(T.corr, noteName(last[1]) + ' ' + cents(last[1])) : fmt(T.det, T.none);
    }
    // contract v1.34: vertraging van de hoofdweg (het droge deel loopt gelijk mee): door de worklet gemeld, anders de tabel; zonder worklet geen vertraging
    const latNow = () => node ? (latMs ?? 1000 * latencySamples(S.mode, S.win, sr) / sr) / 1000 : 0;
    let latLast = 0;
    function latNote() { const l = latNow(); if (l !== latLast) { latLast = l; if (host && typeof host.latencyChanged === 'function') { try { host.latencyChanged(self); } catch { } } } }
    const self = {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        root = el; el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        cv = document.createElement('canvas'); cv.style.cssText = 'grid-column:1/-1;width:100%;height:120px;display:block;border-radius:6px;background:var(--well,#0c0f13)'; cv.setAttribute('aria-label', T.aria); el.appendChild(cv);
        readout = document.createElement('div'); readout.style.cssText = 'grid-column:1/-1;font-variant-numeric:tabular-nums;font-size:12px'; el.appendChild(readout);
        ui.key = host.ui.select(el, T.key, NOTES.map((x, k) => [String(k), x]), String(S.key), v => { S.key = +v; if (S.scale !== 'custom') setMaskFromScale(); apply(); paint(); }, { id: 'key', group: 'scale' });
        ui.scale = host.ui.select(el, T.scale, SCALES.map(x => [x[0], nl ? x[1] : x[2]]), S.scale, v => { S.scale = v; setMaskFromScale(); apply(); paint(); }, { id: 'scale', group: 'scale' });
        const row = document.createElement('div'); row.style.cssText = 'grid-column:1/-1;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:3px'; el.appendChild(row);
        NOTES.forEach((nm, i) => { ui['n' + i] = toggle(row, nm, 'n' + i, 'notes', () => !!S.notes[i], on => { S.notes[i] = on ? 1 : 0; S.scale = 'custom'; ui.scale.value = 'custom'; apply(); }); });
        ui.speed = host.ui.knob(el, T.speed, [0, 400, 1], S.speed, v => v < 1 ? T.hard : Math.round(v) + ' ms', v => { S.speed = v; apply(); }, { id: 'speed', group: 'correction' });
        ui.amount = host.ui.knob(el, T.amount, [0, 1, 0.01], S.amount, pct, v => { S.amount = v; apply(); }, { id: 'amount', group: 'correction', default: 1 });
        ui.keep = host.ui.knob(el, T.keep, [0, 1, 0.01], S.keep, pct, v => { S.keep = v; apply(); }, { id: 'keep', group: 'correction' });
        ui.mix = host.ui.knob(el, T.mix, [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); }, { id: 'mix', group: 'out', default: 1 });
        ui.mode = host.ui.select(el, T.mode, MODES.map(m => [m, T[m]]), S.mode, v => { S.mode = v; latMs = null; apply(); }, { id: 'mode', group: 'engine' });
        ui.win = host.ui.select(el, T.win, WINS.map(m => [m, T[m]]), S.win, v => { S.win = v; latMs = null; apply(); }, { id: 'win', group: 'engine' });
        ui.range = host.ui.select(el, T.range, RANGEIDS.map(m => [m, T[m]]), S.range, v => { S.range = v; apply(); }, { id: 'range', group: 'detect' });
        ui.formant = host.ui.knob(el, T.formant, [0, 1, 0.01], S.formant, pct, v => { S.formant = v; apply(); }, { id: 'formant', group: 'engine' });
        ui.gate = host.ui.knob(el, T.gate, [-70, -20, 1], S.gate, v => Math.round(v) + ' dB', v => { S.gate = v; apply(); }, { id: 'gate', group: 'detect' });
        ui.hold = host.ui.knob(el, T.hold, [0, 500, 1], S.hold, v => Math.round(v) + ' ms', v => { S.hold = v; apply(); }, { id: 'hold', group: 'detect' });
        ui.ref = host.ui.knob(el, T.ref, [430, 450, 0.1], S.ref, v => v.toFixed(1) + ' Hz', v => { S.ref = v; apply(); }, { id: 'ref', group: 'detect', default: 440 });
        note = document.createElement('div'); note.className = 'note'; note.style.gridColumn = '1 / -1'; el.appendChild(note); paintNote();
        stop = typeof host.frame === 'function' ? host.frame(this, draw, 30) : null; draw();
      },
      unmount() { if (stop) { stop(); stop = null; } note = null; cv = null; readout = null; ui = {}; },
      params() { return MODP.map(([id, n1, n2, min, max, role, drift, on]) => ({ id, name: nl ? n1 : n2, lane: 'corr', laneName: 'Pitch Correction', min, max, role, scale: 'lin', drift, on, fast: false })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      latency() { return latNow(); },
      getState() { return { ...S, notes: S.notes.slice() }; },
      setState(s) { restoreValues(S, s); latMs = null; apply(); paint(); paintNote(); },
      destroy() { if (dead) return; dead = true; if (stop) { stop(); stop = null; } [inG, out, bypass, node].forEach(x => { if (x) try { x.disconnect(); } catch { } }); },
    };
    return self;
  }
};
