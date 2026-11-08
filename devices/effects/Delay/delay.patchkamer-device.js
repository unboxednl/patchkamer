// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Delay: een uitgebreid delay op vrije tijd (ms), op de klok van de host of op een eigen tempo (tap).
//          Notenwaarden van 2 maten tot 1/64 (recht, punt, triool) of een aantal zestienden; links en rechts onafhankelijk, stereo-offset;
//          stereo, ping-pong, mono en dual (eigen feedback per kant), kruisfeedback; hoogdoorlaat en laagdoorlaat, verzadiging (tape of buis) en diffusie in de lus;
//          modulatie (sinus, tape, chorus), ducking op de eigen ingang, freeze, reverse, swing van de host op de gesynchroniseerde tijd,
//          tempowissel zonder tikken (kruisfade) of met bewuste toonhoogtegleed (tape). Feedback tot 120% met begrenzer in de lus.
//          Bewaker: de worklet begrenst de ingang (±16 = +24 dB), zet NaN op 0, accepteert alleen eindige parameters en zet een ontspoorde toestand terug.
// Delay: alles zit in één AudioWorklet (geheugenlijnen met kubieke interpolatie). Zonder AudioWorklet gaat het geluid ongewijzigd door.

// ---------- teksten per taal (host.lang): Nederlandse bron, Engels als alternatief ----------
const NL = {
  failed: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.', dbl: 'dubbelklik: standaard', limit: 'begrenzer',
  s_time: 'Tijd', s_left: 'Links', s_right: 'Rechts', s_fb: 'Feedback', s_tone: 'Klank in de lus', s_motion: 'Beweging', s_duck: 'Ducking', s_out: 'Uitgang',
  timing: 'Tijdbron', t_sync: 'Klok van de host', t_tap: 'Eigen tempo (tap)', t_free: 'Vrij (ms)',
  mode: 'Modus', m_stereo: 'Stereo', m_pingpong: 'Ping-pong', m_mono: 'Mono', m_dual: 'Dual (eigen feedback)',
  tap: 'Tap', tapTip: 'Tik in het tempo: zet het eigen tempo en kiest Eigen tempo', linked: 'Rechts = links', linkedTip: 'Rechts gebruikt de notenwaarde of tijd van links',
  freeze: 'Freeze', freezeTip: 'Houdt de echo vast: ingang uit de lus, feedback op 100%', reverse: 'Reverse', reverseTip: 'Omgekeerde echo, in blokken van de delaytijd',
  divL: 'Notenwaarde L', divR: 'Notenwaarde R', feelL: 'Soort L', feelR: 'Soort R',
  d_2bar: '2 maten', d_1bar: '1 maat (1/1)', d_1_2: '1/2', d_1_4: '1/4', d_1_8: '1/8', d_1_16: '1/16', d_1_32: '1/32', d_1_64: '1/64', d_steps: 'x/16 (aantal zestienden)',
  f_straight: 'Recht', f_dotted: 'Punt', f_triplet: 'Triool',
  stepsL: 'Zestienden L', stepsR: 'Zestienden R', msL: 'Tijd L', msR: 'Tijd R', spread: 'Stereo-offset', bpm: 'Eigen tempo', swing: 'Swing',
  fb: 'Feedback', fbR: 'Feedback R (dual)', xfeed: 'Kruisfeedback', hp: 'Hoogdoorlaat', lp: 'Laagdoorlaat', sat: 'Verzadiging', sat_off: 'Uit', sat_tape: 'Tape', sat_tube: 'Buis',
  drive: 'Drive', diffusion: 'Diffusie', modType: 'Modulatie', mt_sine: 'Sinus (wow)', mt_tape: 'Tape (wow en flutter)', mt_chorus: 'Chorus (stereo)', modRate: 'Mod snelheid', modDepth: 'Mod diepte',
  duck: 'Ducking', duckThr: 'Drempel', duckRel: 'Release', glide: 'Tijdwissel', g_fade: 'Kruisfade', g_tape: 'Tape (glijdt)', glideTime: 'Glijtijd',
  mix: 'Mix', level: 'Uitgang', bars: 'maten', bar: 'maat', hostBpm: 'tempo host', ownBpm: 'eigen tempo', sw: 'swing', halved: 'gehalveerd (max. 8 s)',
};
const EN = {
  failed: 'AudioWorklet unavailable: the sound passes through unchanged.', dbl: 'double-click: default', limit: 'limiter',
  s_time: 'Time', s_left: 'Left', s_right: 'Right', s_fb: 'Feedback', s_tone: 'Tone in the loop', s_motion: 'Motion', s_duck: 'Ducking', s_out: 'Output',
  timing: 'Time source', t_sync: 'Host clock', t_tap: 'Own tempo (tap)', t_free: 'Free (ms)',
  mode: 'Mode', m_stereo: 'Stereo', m_pingpong: 'Ping-pong', m_mono: 'Mono', m_dual: 'Dual (own feedback)',
  tap: 'Tap', tapTip: 'Tap along: sets the own tempo and selects Own tempo', linked: 'Right = left', linkedTip: 'Right uses the note value or time of the left side',
  freeze: 'Freeze', freezeTip: 'Holds the echo: input off, feedback at 100%', reverse: 'Reverse', reverseTip: 'Reversed echo, in blocks of the delay time',
  divL: 'Note value L', divR: 'Note value R', feelL: 'Feel L', feelR: 'Feel R',
  d_2bar: '2 bars', d_1bar: '1 bar (1/1)', d_1_2: '1/2', d_1_4: '1/4', d_1_8: '1/8', d_1_16: '1/16', d_1_32: '1/32', d_1_64: '1/64', d_steps: 'x/16 (number of sixteenths)',
  f_straight: 'Straight', f_dotted: 'Dotted', f_triplet: 'Triplet',
  stepsL: 'Sixteenths L', stepsR: 'Sixteenths R', msL: 'Time L', msR: 'Time R', spread: 'Stereo offset', bpm: 'Own tempo', swing: 'Swing',
  fb: 'Feedback', fbR: 'Feedback R (dual)', xfeed: 'Cross feedback', hp: 'High-pass', lp: 'Low-pass', sat: 'Saturation', sat_off: 'Off', sat_tape: 'Tape', sat_tube: 'Tube',
  drive: 'Drive', diffusion: 'Diffusion', modType: 'Modulation', mt_sine: 'Sine (wow)', mt_tape: 'Tape (wow and flutter)', mt_chorus: 'Chorus (stereo)', modRate: 'Mod rate', modDepth: 'Mod depth',
  duck: 'Ducking', duckThr: 'Threshold', duckRel: 'Release', glide: 'Time change', g_fade: 'Crossfade', g_tape: 'Tape (glides)', glideTime: 'Glide time',
  mix: 'Mix', level: 'Output', bars: 'bars', bar: 'bar', hostBpm: 'host tempo', ownBpm: 'own tempo', sw: 'swing', halved: 'halved (max. 8 s)',
};

// ---------- hulpjes ----------
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
const el = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const stop = e => e.stopPropagation();
const toS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
const fromS = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function fmt(d, v) {
  const u = d.unit || '';
  if (u === '%') return Math.round(v * 100) + '%';
  if (u === 'ms') return Math.abs(v) >= 1000 ? (v / 1000).toFixed(2) + ' s' : Math.abs(v) < 10 ? v.toFixed(1) + ' ms' : Math.round(v) + ' ms';
  if (u === 'Hz') return v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : v < 10 ? v.toFixed(2) + ' Hz' : Math.round(v) + ' Hz';
  if (u === 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB';
  if (u === 'BPM') return v.toFixed(1) + ' BPM';
  if (u === '/16') return Math.round(v) + '/16';
  return v.toFixed(2);
}
const CSS = acc => `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:${acc};--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:12px}
.disp{font-family:var(--mono,monospace);font-size:15px;color:var(--u-ink);background:var(--well,#0c0f13);border-radius:6px;padding:7px 10px;margin:0 0 4px;display:flex;flex-wrap:wrap;gap:4px 18px;align-items:center;min-height:34px}
.disp .lim{margin-left:auto;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#97a1ad);opacity:.35}
.disp .lim.on{opacity:1;color:var(--stop,#ff6b57)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:10px 0 4px;padding-top:7px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px 14px;align-items:end}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:var(--u-acc);border-color:var(--u-acc);color:var(--well,#14100a)}
.stt{font-size:11px;color:var(--mod,#b48cff);margin:4px 0}`;

// ---------- notenwaarden en tijden ----------
const DIVS = { '2bar': 32, '1bar': 16, '1/2': 8, '1/4': 4, '1/8': 2, '1/16': 1, '1/32': 0.5, '1/64': 0.25, steps: 0 };
const DIVKEYS = Object.keys(DIVS), FEELS = { straight: 1, dotted: 1.5, triplet: 2 / 3 };
const DIVTXT = { '2bar': 'd_2bar', '1bar': 'd_1bar', '1/2': 'd_1_2', '1/4': 'd_1_4', '1/8': 'd_1_8', '1/16': 'd_1_16', '1/32': 'd_1_32', '1/64': 'd_1_64', steps: 'd_steps' };
const MAXT = 8;   // langste delaytijd per lijn, in seconden

const WNAME = 'nl-patchkamer-delay-1-0-0';
const WORKLET = `
const IN_MAX = 16, TWO_PI = 2 * Math.PI;
const ENUM = { mode: ['stereo', 'pingpong', 'mono', 'dual'], sat: ['off', 'tape', 'tube'], mt: ['sine', 'tape', 'chorus'], glide: ['fade', 'tape'] };
const NUM = { fbL: [0, 1.25], fbR: [0, 1.25], xf: [0, 1], hp: [10, 4000], lp: [200, 20000], drive: [0, 1], mr: [0.02, 20], md: [0, 1], diff: [0, 1], duck: [0, 1], duckThr: [-80, 0], duckRel: [10, 3000], glideTime: [5, 5000], dry: [0, 1], wet: [0, 1], lvl: [0, 8] };
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
const th = x => x > 3 ? 1 : x < -3 ? -1 : x * (27 + x * x) / (27 + 9 * x * x);
class Seg {
  constructor(n, sr, k) {
    this.buf = new Float32Array(n); this.mask = n - 1; this.init = false; this.da = 48; this.db = 48; this.xm = 1; this.pend = -1; this.tgt = 48;
    this.hz1 = 0; this.hz2 = 0; this.lz1 = 0; this.lz2 = 0; this.dcx = 0; this.dcy = 0;
    const sc = sr / 48000; this.al = [Math.max(8, Math.round((149 + k * 17) * sc)), Math.max(8, Math.round((449 + k * 41) * sc))];
    this.ab = [new Float32Array(this.al[0]), new Float32Array(this.al[1])]; this.ai = [0, 0];
    this.p1 = 0; this.p2 = 0.5; this.W1 = 4800; this.W2 = 4800;
  }
  clear() { this.buf.fill(0); this.hz1 = this.hz2 = this.lz1 = this.lz2 = this.dcx = this.dcy = 0; this.ab[0].fill(0); this.ab[1].fill(0); }
}
class DelayFx extends AudioWorkletProcessor {
  constructor() {
    super();
    const sr = sampleRate, n = 1 << Math.ceil(Math.log2(sr * 8.5)); this.n = n; this.dMax = n - 16; this.w = 0;
    this.seg = [0, 1, 2, 3].map(k => new Seg(n, sr, k));
    this.s = { mode: 'stereo', sat: 'off', mt: 'sine', glide: 'fade', freeze: false, reverse: false, fbL: 0.4, fbR: 0.4, xf: 0, hp: 80, lp: 6000, drive: 0, mr: 0.8, md: 0, diff: 0, duck: 0, duckThr: -30, duckRel: 300, glideTime: 250, dry: 0, wet: 0, lvl: 1 };
    this.snap = true; this.first = true; this.muteN = 0; this.mgS = 1;
    this.hpS = 80; this.lpS = 6000; this.drS = 0; this.dfS = 0; this.fb0 = 0.4; this.fb1 = 0.4; this.ginS = 1; this.dryS = 0; this.wetS = 0; this.lvS = 1; this.rmS = 0; this.dkS = 1; this.env = 0;
    this.ph = 0; this.fl1 = 0; this.fl2 = 0; this.dr = 0; this.limPk = 0; this.cnt = 0; this.gt = false; this.mdMax = 0.01 * sr; this.fi = 1 / (0.02 * sr); this.gk = 0.001;
    const kf = 1 - Math.exp(-TWO_PI * 7 / sr), kd = 1 - Math.exp(-TWO_PI * 0.4 / sr); this.kf = kf; this.kd = kd;
    this.nf = 0.6 / Math.sqrt(kf / (3 * (2 - kf))); this.nd = 0.6 / Math.sqrt(kd / (3 * (2 - kd)));
    this.hb0 = 1; this.hb1 = 0; this.hb2 = 0; this.ha1 = 0; this.ha2 = 0; this.lb0 = 1; this.lb1 = 0; this.lb2 = 0; this.la1 = 0; this.la2 = 0;
    this.g = 1; this.gi = 1; this.tcn = 1; this.thk = 0; this.satMode = 0; this.gd = 0;
    this.port.onmessage = e => {
      const m = e.data || {};
      if (m.type === 'set') {
        const o = m.s || {}, prevGlide = this.s.glide, prevMode = this.s.mode;
        for (const k in o) {
          if (!(k in this.s)) continue; const v = o[k], cur = this.s[k];
          if (ENUM[k]) { if (ENUM[k].includes(v)) this.s[k] = v; }
          else if (typeof cur === 'boolean') { if (typeof v === 'boolean') this.s[k] = v; }
          else if (NUM[k]) { if (typeof v === 'number' && Number.isFinite(v)) this.s[k] = Math.min(NUM[k][1], Math.max(NUM[k][0], v)); }
        }
        if (this.first) { this.first = false; this.snap = true; } else if (prevMode !== this.s.mode) this.muteN = Math.round(0.015 * sampleRate);
        this.gt = this.s.glide === 'tape';
        const gs = Math.max(0.005, this.s.glideTime * 0.001) * sampleRate; this.gk = 1 - Math.exp(-1 / gs);
        if (Array.isArray(o.t) && o.t.length === 4 && o.t.every(x => typeof x === 'number' && Number.isFinite(x))) { this.t = o.t.slice(); this.setTargets(); }
        else if (prevGlide !== this.s.glide && this.t) this.setTargets();
      } else if (m.type === 'clear') this.clearAll();
    };
  }
  setTargets() { const sr = sampleRate; for (let k = 0; k < 4; k++) { const d = Math.min(this.dMax, Math.max(4, this.t[k] * sr)); this.setTarget(this.seg[k], d); } }
  setTarget(sg, d) {
    sg.tgt = d; if (!sg.init) { sg.init = true; sg.da = sg.db = d; sg.xm = 1; return; }
    if (this.gt) return;
    if (sg.xm >= 1) { if (Math.abs(d - sg.da) > 0.01) { sg.db = sg.da; sg.da = d; sg.xm = 0; sg.pend = -1; } } else sg.pend = d;
  }
  clearAll() { for (const sg of this.seg) sg.clear(); this.env = 0; this.limPk = 0; }
  coef() {
    const sr = sampleRate, Q = 0.70710678;
    let f = Math.min(this.hpS, 0.45 * sr), w0 = TWO_PI * f / sr, c = Math.cos(w0), a = Math.sin(w0) / (2 * Q), a0 = 1 + a;
    this.hb0 = (1 + c) / 2 / a0; this.hb1 = -(1 + c) / a0; this.hb2 = this.hb0; this.ha1 = -2 * c / a0; this.ha2 = (1 - a) / a0;
    f = Math.min(this.lpS, 0.45 * sr); w0 = TWO_PI * f / sr; c = Math.cos(w0); a = Math.sin(w0) / (2 * Q); a0 = 1 + a;
    this.lb0 = (1 - c) / 2 / a0; this.lb1 = (1 - c) / a0; this.lb2 = this.lb0; this.la1 = -2 * c / a0; this.la2 = (1 - a) / a0;
  }
  rd(sg, d) {
    const b = sg.buf, m = sg.mask, p = this.w - d, i = Math.floor(p), f = p - i;
    const xm1 = b[(i - 1) & m], x0 = b[i & m], x1 = b[(i + 1) & m], x2 = b[(i + 2) & m];
    const c = (x1 - xm1) * 0.5, v = x0 - x1, w = c + v, a = w + v + (x2 - x0) * 0.5, bb = w + a;
    return ((a * f - bb) * f + c) * f + x0;
  }
  rs(sg, lf) {
    if (this.gt) sg.da += (sg.tgt - sg.da) * this.gk;
    else if (sg.xm < 1) {
      sg.xm += this.fi;
      if (sg.xm >= 1) { sg.xm = 1; if (sg.pend >= 0) { if (Math.abs(sg.pend - sg.da) > 0.01) { sg.db = sg.da; sg.da = sg.pend; sg.xm = 0; } sg.pend = -1; } }
    }
    const m = lf !== 0 ? lf * Math.min(this.mdMax, 0.4 * sg.da) : 0, dm = this.dMax;
    let a = sg.da + m; a = a < 4 ? 4 : a > dm ? dm : a;
    let v = this.rd(sg, a);
    if (sg.xm < 1) { let b2 = sg.db + m; b2 = b2 < 4 ? 4 : b2 > dm ? dm : b2; v = v * sg.xm + this.rd(sg, b2) * (1 - sg.xm); }
    return v;
  }
  rev(sg) {
    const f1 = 0.5 - 0.5 * Math.cos(TWO_PI * sg.p1), f2 = 0.5 - 0.5 * Math.cos(TWO_PI * sg.p2);
    const v = f1 * this.rd(sg, 2 * sg.W1 * sg.p1 + 4) + f2 * this.rd(sg, 2 * sg.W2 * sg.p2 + 4);
    const Wt = Math.max(256, Math.min(sg.tgt, 4 * sampleRate));
    sg.p1 += 1 / sg.W1; if (sg.p1 >= 1) { sg.p1 -= 1; sg.W1 = Wt; }
    sg.p2 += 1 / sg.W2; if (sg.p2 >= 1) { sg.p2 -= 1; sg.W2 = Wt; }
    return v;
  }
  chain(s, x) {
    let y = this.hb0 * x + s.hz1; s.hz1 = this.hb1 * x - this.ha1 * y + s.hz2; s.hz2 = this.hb2 * x - this.ha2 * y; x = y;
    if (this.satMode === 1) x = th(this.g * x) * this.gi;
    else if (this.satMode === 2) { y = (th(this.g * x + 0.35) - this.thk) * this.tcn; x = y - s.dcx + 0.9995 * s.dcy; s.dcx = y; s.dcy = x; }
    y = this.lb0 * x + s.lz1; s.lz1 = this.lb1 * x - this.la1 * y + s.lz2; s.lz2 = this.lb2 * x - this.la2 * y; x = y;
    if (this.gd > 0.002) {
      const gd = this.gd;
      for (let q = 0; q < 2; q++) { const ab = s.ab[q]; let i = s.ai[q]; const z = ab[i], v = x - gd * z; x = z + gd * v; ab[i] = v; i++; if (i >= s.al[q]) i = 0; s.ai[q] = i; }
    }
    return x === x ? x : 0;
  }
  oc(x) { const a = x < 0 ? -x : x; if (a > 1) { const o = 1 + 0.4 * th((a - 1) / 0.4); return x < 0 ? -o : o; } return x; }
  lim(x) {
    const a = x < 0 ? -x : x;
    if (a > 0.6) { const o = 0.6 + 0.4 * th((a - 0.6) / 0.4); if (a > this.limPk) this.limPk = a; return x < 0 ? -o : o; }
    return x === x ? x : 0;
  }
  process(ins, outs) {
    const s = this.s, sr = sampleRate, I = ins[0], O = outs[0]; if (!O || !O[0]) return true;
    const N = O[0].length, iL = I && I[0] ? I[0] : null, iR = I && I[1] ? I[1] : iL, oL = O[0], oR = O[1] || null;
    const mode = s.mode, stereo = mode === 'stereo' || mode === 'dual', pp = mode === 'pingpong', mono = mode === 'mono', dual = mode === 'dual';
    const S0 = this.seg[0], S1 = this.seg[1], S2 = this.seg[2], S3 = this.seg[3], mask = this.n - 1;
    this.hpS += (s.hp - this.hpS) * 0.25; this.lpS += (s.lp - this.lpS) * 0.25; this.drS += (s.drive - this.drS) * 0.25; this.dfS += (s.diff - this.dfS) * 0.25;
    this.coef(); this.gd = 0.65 * this.dfS; this.satMode = s.sat === 'tape' ? 1 : s.sat === 'tube' ? 2 : 0;
    this.g = 1 + 4 * this.drS; this.gi = 1 / this.g; const tk = Math.tanh(0.35); this.thk = th(0.35); this.tcn = 1 / (this.g * (1 - tk * tk));
    // ducking: omhullende van de eigen ingang (piek met release), voor dit blok al meegerekend
    const kr = Math.exp(-1 / (Math.max(10, s.duckRel) * 0.001 * sr)); let env = this.env;
    if (s.duck > 0 && iL) { for (let n = 0; n < N; n++) { let a = iL[n], b = iR[n]; a = a < 0 ? -a : a; b = b < 0 ? -b : b; if (!(a < IN_MAX)) a = a !== a ? 0 : IN_MAX; if (!(b < IN_MAX)) b = b !== b ? 0 : IN_MAX; const m = a > b ? a : b; env = m > env ? m : env * kr; } }
    else env *= kr * kr;
    this.env = env;
    const dkT = s.duck > 0 ? 1 - s.duck * Math.min(1, Math.max(0, (20 * Math.log10(env + 1e-9) - s.duckThr) / 12)) : 1;
    const sg = 1 - Math.exp(-1 / (0.01 * sr)), sd = 1 - Math.exp(-1 / (0.004 * sr));
    const dry = s.dry, wet = s.wet, lvl = s.lvl, md = s.md, mr = s.mr / sr, mt = s.mt, fbL = s.freeze ? 1 : s.fbL, fbR = s.freeze ? 1 : (dual ? s.fbR : s.fbL), gT = s.freeze ? 0 : 1, xf = stereo ? s.xf : 0, revT = s.reverse ? 1 : 0;
    if (this.snap) { this.snap = false; this.dryS = dry; this.wetS = wet; this.lvS = lvl; this.ginS = gT; this.fb0 = fbL; this.fb1 = fbR; this.dkS = dkT; this.rmS = revT; this.hpS = s.hp; this.lpS = s.lp; this.drS = s.drive; this.dfS = s.diff; this.coef(); this.gd = 0.65 * this.dfS; this.g = 1 + 4 * this.drS; this.gi = 1 / this.g; this.tcn = 1 / (this.g * (1 - tk * tk)); }
    let { dryS, wetS, lvS, ginS, fb0, fb1, dkS, rmS, ph, mgS } = this; let w = this.w;
    if (!s.reverse && rmS < 0.001) for (const q of this.seg) { q.p1 = 0; q.p2 = 0.5; const Wt = Math.max(256, Math.min(q.tgt, 4 * sr)); q.W1 = Wt; q.W2 = Wt; }
    for (let n = 0; n < N; n++) {
      const xl = iL ? cl(iL[n]) : 0, xr = iR ? cl(iR[n]) : xl;
      dryS += (dry - dryS) * sg; wetS += (wet - wetS) * sg; lvS += (lvl - lvS) * sg; ginS += (gT - ginS) * sg; fb0 += (fbL - fb0) * sg; fb1 += (fbR - fb1) * sg; dkS += (dkT - dkS) * sd; rmS += (revT - rmS) * sg;
      let lL = 0, lR = 0;
      if (md > 0) {
        ph += mr; if (ph >= 1) ph -= 1;
        if (mt === 'chorus') { lL = Math.sin(TWO_PI * ph); lR = Math.sin(TWO_PI * (ph + 0.25)); }
        else if (mt === 'tape') {
          this.fl1 += (Math.random() * 2 - 1 - this.fl1) * this.kf; this.fl2 += (Math.random() * 2 - 1 - this.fl2) * this.kf; this.dr += (Math.random() * 2 - 1 - this.dr) * this.kd;
          const dd = 0.25 * this.dr * this.nd;
          lL = Math.min(1, Math.max(-1, 0.7 * Math.sin(TWO_PI * ph) + 0.25 * this.fl1 * this.nf + dd)); lR = Math.min(1, Math.max(-1, 0.7 * Math.sin(TWO_PI * (ph + 0.31)) + 0.25 * this.fl2 * this.nf + dd));
        } else { lL = Math.sin(TWO_PI * ph); lR = Math.sin(TWO_PI * (ph + 0.33)); }
        lL *= md; lR *= md;
      }
      this.w = w;
      const y0 = this.chain(S0, this.rs(S0, lL));
      let y1 = 0, y2 = 0, y3 = 0;
      if (!pp) y1 = this.chain(S1, this.rs(S1, lL));
      if (stereo) y2 = this.chain(S2, this.rs(S2, lR));
      if (!mono) y3 = this.chain(S3, this.rs(S3, lR));
      if (pp) { S0.buf[w] = (xl + xr) * 0.5 * ginS + this.lim(y3 * fb0); S3.buf[w] = this.lim(y0 * fb0); S1.buf[w] = 0; S2.buf[w] = 0; }
      else if (mono) { S0.buf[w] = (xl + xr) * 0.5 * ginS + this.lim(y1 * fb0); S1.buf[w] = this.lim(y0 * fb0); S2.buf[w] = 0; S3.buf[w] = 0; }
      else { const a = y1 * fb0, b = y3 * fb1; S0.buf[w] = xl * ginS + this.lim(a + (b - a) * xf); S1.buf[w] = this.lim(y0 * fb0); S2.buf[w] = xr * ginS + this.lim(b + (a - b) * xf); S3.buf[w] = this.lim(y2 * fb1); }
      let wl, wr;
      if (pp) { wl = y0; wr = y3; } else if (mono) { wl = wr = y0 + y1; } else { wl = y0 + y1; wr = y2 + y3; }
      if (rmS > 0.001) {
        let rl, rr;
        if (pp) { rl = this.rev(S0); rr = this.rev(S3); } else if (mono) { rl = rr = this.rev(S0) + this.rev(S1); } else { rl = this.rev(S0) + this.rev(S1); rr = this.rev(S2) + this.rev(S3); }
        wl += (rl - wl) * rmS; wr += (rr - wr) * rmS;
      }
      wl = this.oc(wl); wr = this.oc(wr);
      mgS += ((this.muteN > 0 ? 0 : 1) - mgS) * sd; if (this.muteN > 0) this.muteN--;
      wl *= dkS * mgS; wr *= dkS * mgS;
      let ol = (xl * dryS + wl * wetS) * lvS, or = (xr * dryS + wr * wetS) * lvS;
      oL[n] = ol === ol ? ol : 0; if (oR) oR[n] = or === or ? or : 0;
      w = (w + 1) & mask;
    }
    this.w = w; this.dryS = dryS; this.wetS = wetS; this.lvS = lvS; this.ginS = ginS; this.fb0 = fb0; this.fb1 = fb1; this.dkS = dkS; this.rmS = rmS; this.ph = ph; this.mgS = mgS;
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    let bad = !(this.env >= 0 && this.env < 1e6);
    for (const q of this.seg) if (!(Math.abs(q.hz1) < 1e4 && Math.abs(q.hz2) < 1e4 && Math.abs(q.lz1) < 1e4 && Math.abs(q.lz2) < 1e4 && Math.abs(q.dcx) < 1e4 && Math.abs(q.dcy) < 1e4 && q.da === q.da && q.db === q.db)) bad = true;
    if (!(Math.abs(this.dryS) < 1e3 && Math.abs(this.wetS) < 1e3 && Math.abs(this.fb0) < 1e3 && Math.abs(this.fb1) < 1e3 && Math.abs(this.dkS) < 1e3 && Math.abs(this.mgS) < 1e3 && Math.abs(this.ph) < 1e3)) { this.dryS = 0; this.wetS = 0; this.fb0 = this.fb1 = 0.4; this.dkS = 1; this.ginS = 1; this.lvS = 1; this.rmS = 0; this.ph = 0; this.mgS = 1; this.snap = true; bad = true; }
    if (bad) this.clearAll();
    if ((this.cnt += 1) % 8 === 0) { this.port.postMessage({ lim: this.limPk > 0.9 ? 1 : 0 }); this.limPk = 0; }
    return true;
  }
}
registerProcessor('${WNAME}', DelayFx);`;

export default {
  id: 'nl.patchkamer.delay', name: 'Delay', version: '1.0.0', kind: 'effect', category: 'effect',
  ui: { width: 700, minWidth: 340 },
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  modExclude: ['stepsL', 'stepsR', 'bpm', 'glideTime', 'duckThr'],
  create(ctx, host) {
    const D = host && host.lang === 'nl' ? NL : EN;
    const tx = k => D[k] !== undefined ? D[k] : k;
    const dlOn = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    // id: [min, max, schaal, eenheid, groep, stap, rol, drift, aan]
    const spec = {
      bpm: { name: tx('bpm'), min: 30, max: 300, unit: 'BPM', step: 0.1, nomod: true },
      swing: { name: tx('swing'), min: 0, max: 1, unit: '%', role: 'time', drift: 0.05, on: false },
      spread: { name: tx('spread'), min: -100, max: 100, unit: 'ms', role: 'time', drift: 0.05, on: false },
      stepsL: { name: tx('stepsL'), min: 1, max: 32, unit: '/16', step: 1, nomod: true },
      msL: { name: tx('msL'), min: 1, max: 4000, scale: 'log', unit: 'ms', role: 'time', drift: 0.03, on: false },
      stepsR: { name: tx('stepsR'), min: 1, max: 32, unit: '/16', step: 1, nomod: true },
      msR: { name: tx('msR'), min: 1, max: 4000, scale: 'log', unit: 'ms', role: 'time', drift: 0.03, on: false },
      fb: { name: tx('fb'), min: 0, max: 1.2, unit: '%', role: 'feedback', drift: 0.10, on: true },
      fbR: { name: tx('fbR'), min: 0, max: 1.2, unit: '%', role: 'feedback', drift: 0.10, on: false },
      xfeed: { name: tx('xfeed'), min: 0, max: 1, unit: '%', role: 'feedback', drift: 0.10, on: false },
      hp: { name: tx('hp'), min: 20, max: 2000, scale: 'log', unit: 'Hz', role: 'filter', drift: 0.10, on: true },
      lp: { name: tx('lp'), min: 500, max: 20000, scale: 'log', unit: 'Hz', role: 'filter', drift: 0.10, on: true },
      drive: { name: tx('drive'), min: 0, max: 1, unit: '%', role: 'color', drift: 0.10, on: false },
      diffusion: { name: tx('diffusion'), min: 0, max: 1, unit: '%', role: 'color', drift: 0.10, on: false },
      modRate: { name: tx('modRate'), min: 0.05, max: 10, scale: 'log', unit: 'Hz', role: 'rate', drift: 0.08, on: false },
      modDepth: { name: tx('modDepth'), min: 0, max: 1, unit: '%', role: 'depth', drift: 0.10, on: false },
      duck: { name: tx('duck'), min: 0, max: 1, unit: '%', role: 'depth', drift: 0.10, on: false },
      duckThr: { name: tx('duckThr'), min: -60, max: -6, unit: 'dB', nomod: true },
      duckRel: { name: tx('duckRel'), min: 50, max: 1500, scale: 'log', unit: 'ms', role: 'decay', drift: 0.05, on: false },
      glideTime: { name: tx('glideTime'), min: 20, max: 2000, scale: 'log', unit: 'ms', nomod: true },
      mix: { name: tx('mix'), min: 0, max: 1, unit: '%', role: 'send', drift: 0.10, on: true },
      level: { name: tx('level'), min: -24, max: 12, unit: 'dB', role: 'level', drift: 0.05, on: false },
    };
    const TIMINGS = [['sync', tx('t_sync')], ['tap', tx('t_tap')], ['free', tx('t_free')]];
    const MODES = [['stereo', tx('m_stereo')], ['pingpong', tx('m_pingpong')], ['mono', tx('m_mono')], ['dual', tx('m_dual')]];
    const DIVOPT = DIVKEYS.map(k => [k, tx(DIVTXT[k])]), FEELOPT = [['straight', tx('f_straight')], ['dotted', tx('f_dotted')], ['triplet', tx('f_triplet')]];
    const SATS = [['off', tx('sat_off')], ['tape', tx('sat_tape')], ['tube', tx('sat_tube')]];
    const MTS = [['sine', tx('mt_sine')], ['tape', tx('mt_tape')], ['chorus', tx('mt_chorus')]];
    const GLIDES = [['fade', tx('g_fade')], ['tape', tx('g_tape')]];
    const defaults = {
      timing: 'sync', bpm: 120, linked: true, mode: 'stereo', swing: 0, spread: 0,
      divL: '1/8', feelL: 'dotted', stepsL: 3, msL: 375, divR: '1/8', feelR: 'straight', stepsR: 3, msR: 375,
      fb: 0.35, fbR: 0.35, xfeed: 0, freeze: false, reverse: false,
      hp: 120, lp: 6000, sat: 'off', drive: 0.3, diffusion: 0,
      modType: 'sine', modRate: 0.8, modDepth: 0, duck: 0, duckThr: -30, duckRel: 300,
      glide: 'fade', glideTime: 250, mix: 0.3, level: 0,
    };
    const ENUMS = { timing: TIMINGS, mode: MODES, divL: DIVOPT, divR: DIVOPT, feelL: FEELOPT, feelR: FEELOPT, sat: SATS, modType: MTS, glide: GLIDES };
    function normalize(raw) {
      const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = finite(s[id], defaults[id], d.min, d.max);
      n.stepsL = Math.round(n.stepsL); n.stepsR = Math.round(n.stepsR);
      for (const [id, opts] of Object.entries(ENUMS)) n[id] = opts.some(o => o[0] === s[id]) ? s[id] : defaults[id];
      for (const id of ['linked', 'freeze', 'reverse']) n[id] = typeof s[id] === 'boolean' ? s[id] : defaults[id];
      return n;
    }
    let state = normalize({}), mod = {}, eff = { ...state }, dead = false, node = null, ok = false, lim = false;
    let hostBpm = host && Number.isFinite(+host.bpm) && +host.bpm > 0 ? +host.bpm : 120;
    let hostSwing = host && Number.isFinite(+host.swing) ? clamp(+host.swing, 0, 0.5) : 0;
    let info = { tL: 0, tR: 0, nL: 0, nR: 0, labL: '', labR: '', halved: false, bpm: 120 };

    function resolve() {
      eff = { ...state };
      for (const [id, d] of Object.entries(spec)) { const x = d.nomod ? 0 : (mod[id] || 0); if (!x) continue; eff[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); }
    }
    const noteLabel = (div, feel, steps) => {
      const base = div === 'steps' ? steps + '/16' : div === '2bar' ? '2 ' + tx('bars') : div === '1bar' ? '1 ' + tx('bar') : div;
      return base + (feel === 'dotted' ? ' ·' : feel === 'triplet' ? ' T' : '');
    };
    const stepsOf = (div, feel, steps) => (div === 'steps' ? steps : DIVS[div]) * FEELS[feel];
    // de vier lijnen: [links 1, links 2, rechts 1, rechts 2] in seconden; twee lijnen per kant zijn nodig voor swing (om en om iets korter of langer)
    function times() {
      const free = state.timing === 'free', bpm = state.timing === 'tap' ? eff.bpm : hostBpm, sd = 60 / bpm / 4;
      const sideN = r => free ? 0 : stepsOf(r ? (state.linked ? state.divL : state.divR) : state.divL, r ? (state.linked ? state.feelL : state.feelR) : state.feelL, r ? (state.linked ? eff.stepsL : eff.stepsR) : eff.stepsL);
      const nL = sideN(0), nR = sideN(1);
      const sw = state.timing === 'sync' ? clamp(eff.swing * hostSwing, 0, 0.45) : 0;
      const pair = (t, n) => { const odd = n > 0 && Math.abs(n - Math.round(n)) < 1e-9 && Math.round(n) % 2 === 1; return odd && sw > 0 ? [(n + Math.min(sw, 0.45 * n)) * sd, (n - Math.min(sw, 0.45 * n)) * sd] : [t, t]; };
      const tLf = free ? eff.msL / 1000 : nL * sd, tRf = free ? (state.linked ? eff.msL : eff.msR) / 1000 : nR * sd;
      let a = pair(tLf, nL), b = pair(tRf, nR);
      b = b.map(t => Math.max(0.001, t + eff.spread / 1000));
      let halved = false; while (Math.max(...a, ...b) > MAXT) { a = a.map(t => t / 2); b = b.map(t => t / 2); halved = true; }
      const lab = (r) => free ? '' : noteLabel(r && !state.linked ? state.divR : state.divL, r && !state.linked ? state.feelR : state.feelL, r && !state.linked ? eff.stepsR : eff.stepsL);
      info = { tL: a[0], tR: b[0], nL, nR, labL: lab(0), labR: lab(1), halved, bpm: 60 / sd / 4 };
      return [a[0], a[1], b[0], b[1]];
    }
    function send() {
      resolve(); const t = times();
      if (!node) return;
      const mixv = eff.mix;
      node.port.postMessage({ type: 'set', s: {
        mode: state.mode, sat: state.sat, mt: state.modType, glide: state.glide, freeze: state.freeze, reverse: state.reverse, t,
        fbL: eff.fb, fbR: eff.fbR, xf: eff.xfeed, hp: eff.hp, lp: eff.lp, drive: eff.drive, mr: eff.modRate, md: eff.modDepth, diff: eff.diffusion,
        duck: eff.duck, duckThr: eff.duckThr, duckRel: eff.duckRel, glideTime: eff.glideTime,
        dry: Math.min(1, 2 * (1 - mixv)), wet: Math.min(1, 2 * mixv), lvl: Math.pow(10, eff.level / 20) } });
    }
    const input = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); input.connect(bypass).connect(out);
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.connect(node); input.disconnect(bypass); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (m && typeof m.lim === 'number') lim = m.lim > 0; };
      send(); paintStatus();
    }).catch(() => { ok = false; paintStatus(); });

    // tempo van de host: ook als de klok stilstaat of het tempo verandert (onStep alleen tijdens afspelen, de timer altijd)
    function pollTempo() {
      if (dead || !host) return;
      const b = +host.bpm, sw = +host.swing; let ch = false;
      if (Number.isFinite(b) && b > 0 && Math.abs(b - hostBpm) > 1e-9) { hostBpm = b; ch = true; }
      if (Number.isFinite(sw) && Math.abs(clamp(sw, 0, 0.5) - hostSwing) > 1e-9) { hostSwing = clamp(sw, 0, 0.5); ch = true; }
      if (ch) send();
    }
    const timer = dlOn ? 0 : setInterval(pollTempo, 40);

    // ---------- UI ----------
    let root = null, ui = { k: {}, s: {}, b: {} }, stopDraw = null, statusEl = null, dispL = null, dispR = null, dispI = null, limEl = null, taps = [];
    const SECTIONS = [
      ['s_time', [['sel', 'timing'], ['sel', 'mode'], ['btn', 'tap'], ['sl', 'bpm'], ['sl', 'swing'], ['sl', 'spread'], ['btn', 'linked']]],
      ['s_left', [['sel', 'divL'], ['sel', 'feelL'], ['sl', 'stepsL'], ['sl', 'msL']]],
      ['s_right', [['sel', 'divR'], ['sel', 'feelR'], ['sl', 'stepsR'], ['sl', 'msR']]],
      ['s_fb', [['sl', 'fb'], ['sl', 'fbR'], ['sl', 'xfeed'], ['btn', 'freeze'], ['btn', 'reverse']]],
      ['s_tone', [['sl', 'hp'], ['sl', 'lp'], ['sel', 'sat'], ['sl', 'drive'], ['sl', 'diffusion']]],
      ['s_motion', [['sel', 'modType'], ['sl', 'modRate'], ['sl', 'modDepth']]],
      ['s_duck', [['sl', 'duck'], ['sl', 'duckThr'], ['sl', 'duckRel']]],
      ['s_out', [['sel', 'glide'], ['sl', 'glideTime'], ['sl', 'mix'], ['sl', 'level']]],
    ];
    const labelOf = id => ({ divL: 'divL', divR: 'divR', feelL: 'feelL', feelR: 'feelR' }[id] || id);
    function mount(elm) {
      unmount(); root = elm;
      const wrap = document.createElement('div'); elm.appendChild(wrap);
      const sh = wrap.attachShadow({ mode: 'open' }); el(sh, 'style').textContent = CSS('var(--audio,#7ee0a1)');
      sh.addEventListener('pointerdown', stop); sh.addEventListener('keydown', stop);
      const app = el(sh, 'div', 'app');
      const disp = el(app, 'div', 'disp'); dispL = el(disp, 'span'); dispR = el(disp, 'span'); dispI = el(disp, 'span'); limEl = el(disp, 'span', 'lim', tx('limit'));
      for (const [h, items] of SECTIONS) {
        el(app, 'h3', '', tx(h)); const g = el(app, 'div', 'grid');
        for (const [kind, id] of items) {
          if (kind === 'sl') {
            const d = spec[id], c = el(g, 'div', 'c'), lab = el(c, 'div', 'lab'); el(lab, 'span', '', d.name).title = d.name; const o = el(lab, 'output');
            const inp = el(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', d.name); inp.setAttribute('data-pk-id', id); inp.title = d.name + ' · ' + tx('dbl');
            inp.dataset.pkDefault = String(toS(d, defaults[id]));
            inp.oninput = () => { const v = fromS(d, +inp.value); state[id] = clamp(v, d.min, d.max); o.textContent = fmt(d, v); send(); paintDim(); };
            inp.ondblclick = () => { state[id] = defaults[id]; ui.k[id].set(defaults[id]); send(); paintDim(); };
            ui.k[id] = { set(v) { inp.value = String(toS(d, v)); o.textContent = fmt(d, v); }, el: c };
          } else if (kind === 'sel') {
            const c = el(g, 'label', 'c'), lab = el(c, 'div', 'lab'); el(lab, 'span', '', tx(labelOf(id))); const s = el(c, 'select');
            for (const [v, t] of ENUMS[id]) { const op = el(s, 'option', '', t); op.value = v; }
            s.value = state[id]; s.onchange = () => { state[id] = s.value; send(); paintDim(); }; ui.s[id] = s; s.parentElement.dataset.id = id;
          } else {
            const b = el(g, 'button', '', tx(id)); b.type = 'button'; if (D[id + 'Tip']) b.title = D[id + 'Tip'];
            if (id === 'tap') b.onclick = tap; else b.onclick = () => { state[id] = !state[id]; send(); paintDim(); };
            ui.b[id] = b;
          }
        }
      }
      statusEl = el(app, 'p', 'stt');
      paint(); paintStatus(); stopDraw = host && typeof host.frame === 'function' ? host.frame(self, draw, 12) : null;
    }
    function tap() {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
      taps.push(now); if (taps.length > 5) taps.shift();
      if (taps.length >= 2) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); state.bpm = clamp(Math.round(60000 / iv * 10) / 10, 30, 300); state.timing = 'tap'; if (ui.k.bpm) ui.k.bpm.set(state.bpm); if (ui.s.timing) ui.s.timing.value = 'tap'; send(); paintDim(); }
    }
    function paintDim() {
      if (!root) return;
      for (const id of ['linked', 'freeze', 'reverse']) if (ui.b[id]) ui.b[id].classList.toggle('on', !!state[id]);
      const free = state.timing === 'free', dim = (id, on) => { const e = (ui.k[id] && ui.k[id].el) || (ui.s[id] && ui.s[id].parentElement) || ui.b[id]; if (e) e.style.opacity = on ? 1 : 0.35; };
      const right = !state.linked;
      dim('bpm', state.timing === 'tap'); dim('swing', state.timing === 'sync'); dim('divL', !free); dim('feelL', !free); dim('stepsL', !free && state.divL === 'steps'); dim('msL', free);
      dim('divR', !free && right); dim('feelR', !free && right); dim('stepsR', !free && right && state.divR === 'steps'); dim('msR', free && right);
      dim('fbR', state.mode === 'dual'); dim('xfeed', state.mode === 'stereo' || state.mode === 'dual'); dim('drive', state.sat !== 'off');
      dim('duckThr', state.duck > 0); dim('duckRel', state.duck > 0); dim('glideTime', state.glide === 'tape'); dim('modRate', state.modDepth > 0);
    }
    function paint() {
      if (!root) return;
      for (const [id, k] of Object.entries(ui.k)) k.set(state[id]);
      for (const [id, s] of Object.entries(ui.s)) s.value = state[id];
      paintDim();
    }
    function paintStatus() { if (statusEl) statusEl.textContent = ok || !node && !dead && loaderPending ? '' : tx('failed'); }
    let loaderPending = true; loader.then(() => { loaderPending = false; }, () => { loaderPending = false; });
    const fmtT = t => t >= 1 ? t.toFixed(3) + ' s' : (t * 1000 < 100 ? (t * 1000).toFixed(1) : Math.round(t * 1000)) + ' ms';
    let last = '';
    function draw() {
      if (dead || !dispL) return;
      resolve(); times();
      const L = (info.labL ? info.labL + '  ' : '') + fmtT(info.tL), Rr = (info.labR ? info.labR + '  ' : '') + fmtT(info.tR);
      const src = state.timing === 'free' ? '' : (state.timing === 'tap' ? tx('ownBpm') : tx('hostBpm')) + ' ' + info.bpm.toFixed(1) + (info.nL && state.timing === 'sync' && eff.swing * hostSwing > 0 ? ' · ' + tx('sw') : '') + (info.halved ? ' · ' + tx('halved') : '');
      const key = L + '|' + Rr + '|' + src; if (key !== last) { last = key; dispL.textContent = 'L ' + L; dispR.textContent = 'R ' + Rr; dispI.textContent = src; }
      if (limEl) limEl.classList.toggle('on', lim);
    }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (root) root.innerHTML = ''; root = null; ui = { k: {}, s: {}, b: {} }; statusEl = dispL = dispR = dispI = limEl = null; last = ''; }
    const self = {
      inputs: { in: input }, outputs: { out },
      mount, unmount,
      onStep(inf) {
        try {
          if (dead || !inf) return;
          const sd = +inf.stepDur, b = +inf.bpm; let ch = false;
          const nb = Number.isFinite(sd) && sd > 0.005 && sd < 3 ? 60 / sd / 4 : (Number.isFinite(b) && b > 0 ? b : hostBpm);
          if (Math.abs(nb - hostBpm) > 1e-6) { hostBpm = nb; ch = true; }
          const sw = +inf.swing; if (Number.isFinite(sw) && Math.abs(clamp(sw, 0, 0.5) - hostSwing) > 1e-9) { hostSwing = clamp(sw, 0, 0.5); ch = true; }
          if (ch) send();
        } catch { }
      },
      params() { return Object.entries(spec).filter(([, d]) => !d.nomod).map(([id, d]) => ({ id, name: d.name, lane: 'delay', laneName: 'Delay', min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: d.drift ?? 0.05, on: d.on ?? false })); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (!spec[id].nomod && typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); send(); } catch { } },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); send(); paint(); },
      destroy() { if (dead) return; dead = true; if (timer) clearInterval(timer); unmount(); try { input.disconnect(); bypass.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } out.disconnect(); } catch { } },
    };
    resolve(); times();
    return self;
  },
};
