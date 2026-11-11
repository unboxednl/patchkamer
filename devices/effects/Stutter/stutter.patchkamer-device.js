// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Patchkamer contract v1.34. Eerste versie: beat-repeat, gate en roll op het tempo van de host. Neemt de laatste stap(pen) van de ingang op en herhaalt die op 1/4 tot 1/32 (ook triolen).
//          Soorten: Beat repeat (met gate-patroon, gate-lengte, pitch per herhaling, decay per herhaling, richting vooruit/achteruit/wisselend en opbouw van een grotere naar een kleinere herhaling),
//          Tape stop (het geluid vertraagt tot stilstand, met instelbare tijd en curve) en Reverse swell (achteruit met aanzwellend niveau).
//          Starten: de knop (vasthouden of vasthouden-aan), een trig, noot of CC op de eventingang, of automatisch aan het eind van de maat (laatste stappen, tel, halve maat of vierde maat).
//          Randen van elke herhaling en het in- en uitschakelen lopen via korte fades (geen klik). Zonder stutter gaat het signaal bit-identiek door (uitgang 0 dB). Geen vertraging: latency 0.
//          Tweetalig (host.lang), tekenen via host.frame, knop door de host (host.ui.pad).
//          Bewaker: de worklet begrenst de ingangen (±16 = +24 dB), zet NaN op 0, accepteert alleen eindige parameters en zet een ontspoorde toestand terug.
/** Stutter — beat-repeat, gate en roll op de klok.
 * De worklet schrijft de ingang continu in een ringbuffer (6 s). Bij het starten wordt het laatste stuk (stappen x herhalingslengte, hoogstens 4,5 s) bevroren en herhaald; de
 * ingang loopt intussen door in de ringbuffer en komt na het stoppen terug via een korte crossfade. Tape stop leest vanaf het startmoment uit de ringbuffer met een afnemende snelheid.
 * Herhalingslengte = nootwaarde x stapduur van de host (60 / bpm / 4): 1/4 = 4 stappen, 1/8 = 2, 1/16 = 1, 1/32 = 0,5; triolen x 2/3.
 */

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const NL = {
  mode: 'Soort', m_repeat: 'Beat repeat', m_tape: 'Tape stop', m_rev: 'Reverse swell',
  rate: 'Herhaling', rateTo: 'Bouw op naar', off: 'Uit', reps: 'Herhalingen per trap', steps: 'Lus (stappen)',
  pattern: 'Gate-patroon', dir: 'Richting', d_fwd: 'Vooruit', d_rev: 'Achteruit', d_alt: 'Wisselend',
  auto: 'Automatisch', a_off: 'Uit', a_step2: 'Laatste 2 stappen van de maat', a_beat: 'Laatste tel van de maat', a_half: 'Laatste halve maat', a_bar4: 'Laatste maat van vier',
  quant: 'Op de stap starten', quantTip: 'De knop begint op de eerstvolgende zestiende van de klok (alleen als de klok loopt)', latch: 'Vasthouden', latchTip: 'De knop schakelt aan en uit in plaats van ingedrukt houden',
  pad: 'Stutter', padTip: 'Houd ingedrukt om te herhalen (met Vasthouden: klik aan en uit)', aria: 'Gate-patroon en niveau', failed: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.', dbl: 'dubbelklik: standaard',
  g0: 'Herhaling', g1: 'Tape stop', g2: 'Reverse', g3: 'Trigger en uitgang',
  gate: 'Gate-lengte', gate_t: 'hoe lang elke herhaling open is', ramp: 'Pitch per herhaling', ramp_t: 'plus = stijgend, min = dalend (halve tonen per herhaling van de lus)', decay: 'Decay per herhaling', decay_t: 'hoeveel zachter elke volgende herhaling wordt',
  stop: 'Stoptijd', stop_t: 'hoe lang het duurt voor de band stilstaat', curve: 'Stopcurve', curve_t: '1 = recht, hoger = eerst langzaam, dan snel naar nul',
  swell: 'Swell', swell_t: 'hoeveel het niveau aanzwelt binnen de lus', mix: 'Mix', mix_t: 'tijdens het stotteren: deel van het herhaalde signaal', out: 'Uitgang', len: 'Lengte trig (stappen)', len_t: 'hoe lang een trig het effect aan laat; een noot gebruikt zijn eigen lengte',
};
const EN = {
  mode: 'Type', m_repeat: 'Beat repeat', m_tape: 'Tape stop', m_rev: 'Reverse swell',
  rate: 'Repeat rate', rateTo: 'Build up to', off: 'Off', reps: 'Repeats per stage', steps: 'Loop (steps)',
  pattern: 'Gate pattern', dir: 'Direction', d_fwd: 'Forward', d_rev: 'Reverse', d_alt: 'Alternating',
  auto: 'Auto', a_off: 'Off', a_step2: 'Last 2 steps of the bar', a_beat: 'Last beat of the bar', a_half: 'Last half bar', a_bar4: 'Last bar of four',
  quant: 'Start on the step', quantTip: 'The button starts on the next sixteenth of the clock (only while the clock runs)', latch: 'Latch', latchTip: 'The button switches on and off instead of being held',
  pad: 'Stutter', padTip: 'Hold to repeat (with Latch: click on and off)', aria: 'Gate pattern and level', failed: 'AudioWorklet unavailable: the sound passes through unchanged.', dbl: 'double-click: default',
  g0: 'Repeat', g1: 'Tape stop', g2: 'Reverse', g3: 'Trigger and output',
  gate: 'Gate length', gate_t: 'how long each repeat stays open', ramp: 'Pitch per repeat', ramp_t: 'plus = rising, minus = falling (semitones per repeat of the loop)', decay: 'Decay per repeat', decay_t: 'how much softer each next repeat gets',
  stop: 'Stop time', stop_t: 'how long the tape takes to come to a halt', curve: 'Stop curve', curve_t: '1 = straight, higher = slow at first, then fast to zero',
  swell: 'Swell', swell_t: 'how much the level swells within the loop', mix: 'Mix', mix_t: 'while stuttering: share of the repeated signal', out: 'Output', len: 'Trig length (steps)', len_t: 'how long a trig keeps the effect on; a note uses its own length',
};

// ---------- UI-hulpjes ----------
const UK_CSS = (acc) => `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:${acc};--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:var(--u-acc);border-color:var(--u-acc);color:var(--well,#14100a)}
canvas{display:block;width:100%;border-radius:6px;background:var(--well,#0c0f13)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
.stt{font-size:11px;color:var(--mod,#b48cff);margin:4px 0}
.padbox{display:flex;align-items:flex-end;min-width:110px;min-height:48px}
.padbox button{min-width:110px;min-height:44px;font-size:14px;font-weight:600}`;
const ukClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ukFinite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? ukClamp(x, a, b) : d;
const ukEl = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const ukStop = e => e.stopPropagation();
// hoogte van een canvas: een skin kan hem verlagen met de eigenschap --u-ch (40 tot 400); zonder skin blijft het de standaard
const ukH = (el, d) => { const v = parseFloat(ukVar(el, '--u-ch', '')); return v >= 40 && v <= 400 ? v : d; };
function ukShadow(hostEl, css) { const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow({ mode: 'open' }); ukEl(sh, 'style').textContent = css; sh.addEventListener('pointerdown', ukStop); sh.addEventListener('keydown', ukStop); return ukEl(sh, 'div', 'app'); }
function ukSelect(p, label, opts, value, change, meta) { const box = ukEl(p, 'label', 'sel'); ukEl(box, 'span', '', label); const s = ukEl(box, 'select'); for (const [v, t] of opts) { const o = ukEl(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value);
  if (meta) { s.setAttribute('data-pk-id', meta.id); if (meta.group) s.setAttribute('data-pk-group', meta.group); } return s; }
const ukToS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
const ukFromS = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function ukFmt(d, v) { const u = d.unit || ''; if (u === '%') return Math.round(v * 100) + '%'; if (u === 'ms') return v < 1000 ? Math.round(v) + ' ms' : (v / 1000).toFixed(2) + ' s';
  if (u === 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB'; if (u === 'st') return (v > 0.005 ? '+' : '') + v.toFixed(1) + ' st'; if (u === 'steps') return Math.round(v) + ''; return v.toFixed(2) + (u ? ' ' + u : ''); }
// schuifregelaars voor een spec {id:{name,min,max,scale,unit,g}} in groepen; set krijgt de nieuwe waarde
function ukSliders(parent, spec, groups, set, defaults, dbl) { const handles = {};
  groups.forEach((grp, gi) => { ukEl(parent, 'h3', '', grp.label); const g = ukEl(parent, 'div', 'grid');
    for (const [id, d] of Object.entries(spec)) { if (d.g !== gi) continue; const c = ukEl(g, 'div', 'c'), lab = ukEl(c, 'div', 'lab'); ukEl(lab, 'span', '', d.name).title = d.name; const o = ukEl(lab, 'output');
      const inp = ukEl(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', d.name); inp.setAttribute('data-pk-id', id); inp.setAttribute('data-pk-group', grp.key); inp.title = d.name + (d.tip ? ' — ' + d.tip : '') + ' · ' + dbl;
      inp.oninput = () => { const v = ukFromS(d, +inp.value); set(id, v); o.textContent = ukFmt(d, v); };
      inp.ondblclick = () => { set(id, defaults[id]); handles[id].set(defaults[id]); };
      handles[id] = { set(v) { inp.value = String(ukToS(d, v)); o.textContent = ukFmt(d, v); }, el: c }; } });
  return handles; }
// canvas zonder layout-werk per frame: de breedte komt van een ResizeObserver, de hoogte wordt één keer gezet
function ukCanvas(cv, h) { const dpr = ukClamp(globalThis.devicePixelRatio || 1, 1, 3);
  if (!cv._ro) { cv._cw = cv.clientWidth || 300; try { cv._ro = new ResizeObserver(() => { cv._cw = cv.clientWidth || cv._cw; }); cv._ro.observe(cv); } catch { } }
  if (cv._h !== h) { cv.style.height = h + 'px'; cv._h = h; } const w = Math.max(160, cv._cw || 300);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const g = cv._g || (cv._g = cv.getContext('2d')); if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h }; }
// CSS-kleuren hooguit één keer per seconde opvragen (en meteen opnieuw na een wissel van kleurstelling)
let ukVarEpoch = 0; try { window.addEventListener('patchkamer-skin', () => { ukVarEpoch++; }); } catch { }
const ukVar = (el, name, d) => { const c = el._ukv || (el._ukv = {}), now = performance.now(), e = c[name];
  if (e && now - e.t < 1000 && e.ep === ukVarEpoch) return e.v; let v = d; try { v = getComputedStyle(el).getPropertyValue(name).trim() || d; } catch { } c[name] = { v, t: now, ep: ukVarEpoch }; return v; };
// tekenen via de klok van de host (alleen als de kaart in beeld is); terugval voor een host zonder host.frame (contract §12b)
const ukLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false; const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); }; raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); }; };

function ukResolve(spec, state, mod) { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; if (!x) continue; e[id] = ukClamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } return e; }
function ukParams(spec, lane, laneName) { return Object.entries(spec).map(([id, d]) => ({ id, name: d.name, lane, laneName, min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'level', drift: d.drift ?? 0.05, on: d.on ?? false })); }

// herhalingslengtes in zestiende stappen van de klok; PATS: gate-patroon over opeenvolgende herhalingen (1 = open)
const LIST = ['4', '4t', '8', '8t', '16', '16t', '32', '32t'];
const PAT_KEYS = ['all', 'half', 'off', 'gallop', 'skip', 'sync', 'tres', 'broken'];
const PAT_VIEW = { all: [1, 1, 1, 1], half: [1, 0, 1, 0], off: [0, 1, 0, 1], gallop: [1, 0, 1, 1], skip: [1, 1, 1, 0], sync: [1, 0, 0, 1], tres: [1, 0, 0, 1, 0, 0, 1, 0], broken: [1, 1, 0, 1, 0, 1, 1, 0] };

const WNAME = 'nl-patchkamer-stutter-1-0-0';
const WORKLET = `
const IN_MAX = 16;
const LIST = ${JSON.stringify(LIST)};
const DIVS = { '4': 4, '4t': 8 / 3, '8': 2, '8t': 4 / 3, '16': 1, '16t': 2 / 3, '32': 0.5, '32t': 1 / 3 };
const PATS = ${JSON.stringify(PAT_VIEW)};
const NUM = { gate: [0.05, 1], ramp: [-6, 6], decay: [0, 24], stop: [20, 5000], curve: [0.3, 6], swell: [0, 1], mix: [0, 1], out: [0, 8], step: [0.01, 2], reps: [1, 16], steps: [1, 16] };
const ENUM = { mode: ['repeat', 'tapestop', 'reverse'], rate: LIST, rateTo: LIST.concat(['off']), dir: ['fwd', 'rev', 'alt'], pattern: Object.keys(PATS) };
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
class Stutter extends AudioWorkletProcessor{
  constructor(){ super(); const sr = sampleRate;
    this.s = { mode: 'repeat', rate: '8', rateTo: 'off', reps: 2, steps: 1, pattern: 'all', gate: 1, dir: 'fwd', ramp: 0, decay: 0, stop: 600, curve: 1.5, swell: 0.7, mix: 1, out: 1, step: 0.125 };
    this.RN = Math.ceil(sr * 6); this.rL = new Float32Array(this.RN); this.rR = new Float32Array(this.RN); this.wp = 0;
    this.FN = Math.ceil(sr * 4.5) + 16; this.fL = new Float32Array(this.FN); this.fR = new Float32Array(this.FN);
    this.src = { ui: false, auto: false, cc: false, ev: 0 }; this.q = []; this.on = false; this.run = false; this.act = 0; this.so = 1; this.sx = 1; this.ge = 0;
    this.Lc = 16; this.iter = 0; this.slotCtr = 0; this.P = 16; this.slotLen = 16; this.nSlots = 1; this.r = 1; this.rev = false; this.gIt = 1; this.pos = 0; this.tl = 0; this.slotBase = 0;
    this.tr = 0; this.tt = 0; this.n = 0; this.sl = 0; this.fr = 0; this.lv = 0;
    this.port.onmessage = e => { const m = e.data || {};
      if (m.type === 'set') { const o = m.s || {}, s = this.s;
        for (const k in NUM) if (typeof o[k] === 'number' && Number.isFinite(o[k])) { const v = Math.min(NUM[k][1], Math.max(NUM[k][0], o[k])); s[k] = (k === 'reps' || k === 'steps') ? Math.round(v) : v; }
        for (const k in ENUM) if (ENUM[k].includes(o[k])) s[k] = o[k]; }
      else if (m.type === 'src' && typeof m.t === 'number' && Number.isFinite(m.t) && (m.k === 'ui' || m.k === 'auto' || m.k === 'cc' || m.k === 'ev')) { this.q.push({ t: m.t, k: m.k, v: !!m.v, d: m.d === -1 ? -1 : 1 }); if (this.q.length > 4096) this.q.shift(); }
      else if (m.type === 'panic') { this.q.length = 0; this.src = { ui: false, auto: false, cc: false, ev: 0 }; } }; }
  apply(e){ const s = this.src; if (e.k === 'ev') s.ev = Math.max(0, s.ev + e.d); else s[e.k] = e.v; }
  begin(){ const s = this.s, sr = sampleRate, RN = this.RN;
    if (s.mode === 'tapestop') { this.tr = this.wp - 1; if (this.tr < 0) this.tr += RN; this.tt = 0; return; }
    const idx0 = LIST.indexOf(s.rate), build = LIST.indexOf(s.rateTo) > idx0 && s.steps === 1;
    let Lc = Math.round(DIVS[s.rate] * s.step * sr * (build ? 1 : s.steps)); Lc = Math.max(16, Math.min(this.FN - 16, Lc)); this.Lc = Lc;
    for (let i = 0; i < Lc; i++) { let p = this.wp - Lc + i; p = ((p % RN) + RN) % RN; this.fL[i] = this.rL[p]; this.fR[i] = this.rR[p]; }
    this.fL[Lc] = this.fL[Lc - 1]; this.fR[Lc] = this.fR[Lc - 1];
    this.iter = 0; this.slotCtr = 0; this.ge = 0; this.nextIter(); }
  nextIter(){ const s = this.s, sr = sampleRate, i = this.iter, idx0 = LIST.indexOf(s.rate), idxT = LIST.indexOf(s.rateTo), build = idxT > idx0 && s.steps === 1;
    let idx = idx0; if (build) idx = Math.min(idxT, idx0 + 2 * Math.floor(i / Math.max(1, s.reps)));
    const slice = Math.max(8, Math.round(DIVS[LIST[idx]] * s.step * sr)); let P = Math.max(8, Math.min(this.Lc, slice * (build ? 1 : s.steps)));
    this.P = P; this.slotLen = Math.max(8, Math.min(slice, P)); this.nSlots = Math.max(1, Math.round(P / this.slotLen));
    this.r = Math.min(4, Math.max(0.25, Math.pow(2, s.ramp * i / 12)));
    this.rev = s.mode === 'reverse' ? true : s.dir === 'rev' ? true : s.dir === 'alt' ? (i % 2 === 1) : false;
    this.gIt = Math.pow(10, -s.decay * i / 20); this.pos = this.rev ? P - 1 : 0; this.tl = 0; this.slotBase = this.slotCtr; }
  process(ins, outs){ const s = this.s, sr = sampleRate, I = ins[0], O = outs[0], N = O[0].length, RN = this.RN, rL = this.rL, rR = this.rR, fL = this.fL, fR = this.fR;
    const iL = I && I[0] ? I[0] : null, iR = I && I[1] ? I[1] : iL, oL = O[0], oR = O[1] || O[0];
    const bs = currentTime, be = bs + N / sr; const ev = [];
    if (this.q.length) { const keep = []; for (const e of this.q) { if (e.t < be) ev.push([Math.min(N - 1, Math.max(0, Math.round((e.t - bs) * sr))), e]); else keep.push(e); } this.q = keep; ev.sort((a, b) => a[0] - b[0]); }
    let ei = 0; const upA = 1 / (0.0015 * sr), dnA = 1 / (0.006 * sr), kp = 1 - Math.exp(-1 / (0.015 * sr)), kq = 1 - Math.exp(-1 / (0.0002 * sr)), Fd = Math.max(2, Math.round(0.001 * sr)), pat = PATS[s.pattern] || PATS.all, pl = pat.length;
    for (let t = 0; t < N; t++) {
      const xl = iL ? cl(iL[t]) : 0, xr = iR ? cl(iR[t]) : 0;
      const w = this.wp; rL[w] = xl; rR[w] = xr; this.wp = w + 1 === RN ? 0 : w + 1;
      while (ei < ev.length && ev[ei][0] <= t) { this.apply(ev[ei][1]); ei++; }
      const want = this.src.ui || this.src.auto || this.src.cc || this.src.ev > 0;
      if (want && !this.on) { this.begin(); this.on = true; this.run = true; } else if (!want && this.on) this.on = false;
      if (this.on) { this.act = Math.min(1, this.act + upA); } else if (this.act > 0) { this.act = Math.max(0, this.act - dnA); if (this.act === 0) this.run = false; }
      let yl = 0, yr = 0;
      if (this.run) {
        if (s.mode === 'tapestop') {
          const T = Math.max(1, s.stop * 0.001 * sr), u = this.tt / T, sp = u >= 1 ? 0 : Math.pow(1 - u, s.curve), ae = u >= 1 ? 0 : (u > 0.85 ? (1 - u) / 0.15 : 1);
          let p = this.tr; if (p >= RN) { p -= RN; this.tr = p; } const i0 = Math.floor(p), f = p - i0, a = ((i0 % RN) + RN) % RN, b = a + 1 === RN ? 0 : a + 1;
          yl = (rL[a] + (rL[b] - rL[a]) * f) * ae; yr = (rR[a] + (rR[b] - rR[a]) * f) * ae; this.tr = p + sp; this.tt++;
          this.sl = 0; this.fr = Math.min(1, u);
        } else {
          if (this.tl >= this.P) { this.iter++; this.slotCtr += this.nSlots; this.nextIter(); }
          const tl = this.tl, SL = this.slotLen; let si = Math.floor(tl / SL); if (si >= this.nSlots) si = this.nSlots - 1;
          const inSlot = tl - si * SL, gi = this.slotBase + si, onv = pat[gi % pl]; let e = onv;
          if (onv) { const open = Math.max(2, s.gate * SL), F = Math.max(2, Math.min(Fd, SL / 4, open / 3));
            if (inSlot >= open) e = 0;
            else { const prevOn = si > 0 ? pat[(gi - 1) % pl] : 0, nextOn = si < this.nSlots - 1 ? pat[(gi + 1) % pl] : 0;
              if (!prevOn && inSlot < F) e = inSlot / F;
              if ((s.gate < 1 || !nextOn) && inSlot > open - F) e *= (open - inSlot) / F; } }
          const rem = this.rev ? this.pos : (this.P - 1 - this.pos), fd = Fd * this.r; let de = 1; if (rem < fd) de = rem <= 0 ? 0 : rem / fd;
          const valid = this.pos >= 0 && this.pos <= this.P - 1 && e > 0, gsw = s.mode === 'reverse' ? (1 - s.swell) + s.swell * (tl / this.P) * (tl / this.P) : 1, gt = valid ? e * de * this.gIt * gsw : 0;
          this.ge += (gt - this.ge) * kq; if (Math.abs(gt - this.ge) < 1e-7) this.ge = gt;
          if (this.ge !== 0) { const pc = this.pos < 0 ? 0 : this.pos > this.P - 1 ? this.P - 1 : this.pos, i0 = Math.floor(pc), f = pc - i0; yl = (fL[i0] + (fL[i0 + 1] - fL[i0]) * f) * this.ge; yr = (fR[i0] + (fR[i0 + 1] - fR[i0]) * f) * this.ge; }
          this.pos += this.rev ? -this.r : this.r; this.tl++; this.sl = gi; this.fr = inSlot / SL; } }
      this.sx += (s.mix - this.sx) * kp; if (Math.abs(s.mix - this.sx) < 1e-9) this.sx = s.mix; const m = this.act * this.sx; this.so += (s.out - this.so) * kp; if (Math.abs(s.out - this.so) < 1e-9) this.so = s.out;
      const ol = (xl * (1 - m) + yl * m) * this.so, or = (xr * (1 - m) + yr * m) * this.so; oL[t] = ol; oR[t] = or; const a = Math.abs(ol); if (a > this.lv) this.lv = a; }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    if (!(this.act >= 0 && this.act <= 1) || !(this.pos > -1e9 && this.pos < 1e9) || !(this.tl >= 0 && this.tl < 1e10) || !(this.tr >= 0 && this.tr < 1e9) || !(this.tt >= 0 && this.tt < 1e12) || !(this.iter >= 0 && this.iter < 1e9)) { this.act = 0; this.on = false; this.run = false; this.pos = 0; this.tl = 0; this.tr = 0; this.tt = 0; this.iter = 0; this.src = { ui: false, auto: false, cc: false, ev: 0 }; }
    if (!(this.so >= 0 && this.so <= 8)) this.so = 1; if (!(this.sx >= 0 && this.sx <= 1)) this.sx = 1; if (!(Math.abs(this.ge) <= 4)) this.ge = 0; if (!(this.lv >= 0 && this.lv < 1e6)) this.lv = 0;
    if ((this.n += 1) % 6 === 0) { this.port.postMessage({ run: this.run, act: this.act, sl: this.sl, fr: this.fr, lv: this.lv, mode: s.mode }); this.lv = 0; }
    return true; } }
registerProcessor('${WNAME}', Stutter);`;

export default {
  id: 'nl.patchkamer.stutter', name: 'Stutter', version: '1.0.0', kind: 'effect', category: 'effect',
  about: {
    nl: 'Beat-repeat, gate en roll op het tempo van de studio. Stutter neemt continu de laatste stap(pen) van de ingang op. Zodra je hem start, wordt dat stuk bevroren en herhaald op 1/4 tot 1/32 (ook als triool), zolang je de knop vasthoudt of de trigger loopt.\n\nSoorten. Beat repeat: herhaalt het laatste stuk; met een gate-patroon (welke herhalingen klinken), een gate-lengte, een pitch per herhaling (stijgende of dalende rollen), een decay per herhaling en de richting vooruit, achteruit of wisselend. Met Bouw op naar loopt de herhaling stap voor stap van bijvoorbeeld 1/8 naar 1/32: de klassieke opbouw voor een drop. Tape stop: het geluid vertraagt als een band die stopt, met een stoptijd en een curve. Reverse swell: het laatste stuk achteruit, aanzwellend.\n\nStarten. Met de knop (vasthouden, of Vasthouden aan voor aan en uit); met een trig, noot of CC op de ingang Trigger (een noot duurt zo lang als hij zelf duurt, een trig zo lang als Lengte trig); of automatisch aan het eind van de maat (laatste 2 stappen, tel of halve maat, of de laatste maat van vier). Met Op de stap starten begint de knop op de eerstvolgende zestiende van de klok.\n\nDe randen van elke herhaling en het in- en uitschakelen lopen via korte fades, dus geen klikken. Zonder stutter gaat het signaal ongewijzigd door. Geen vertraging. Het stuk dat wordt herhaald is hoogstens 4,5 seconde lang.',
    en: 'Beat repeat, gate and roll on the studio tempo. Stutter continuously records the last step(s) of the input. When you start it, that piece is frozen and repeated at 1/4 to 1/32 (also as a triplet) for as long as you hold the button or the trigger runs.\n\nTypes. Beat repeat: repeats the last piece; with a gate pattern (which repeats sound), a gate length, a pitch per repeat (rising or falling rolls), a decay per repeat and the direction forward, reverse or alternating. With Build up to the repeat moves stage by stage from, say, 1/8 to 1/32: the classic build-up for a drop. Tape stop: the sound slows down like a tape coming to a halt, with a stop time and a curve. Reverse swell: the last piece backwards, swelling in.\n\nStarting. With the button (hold, or Latch for on and off); with a trig, note or CC on the Trigger input (a note lasts as long as the note itself, a trig as long as Trig length); or automatically at the end of the bar (last 2 steps, beat or half bar, or the last bar of four). With Start on the step the button begins on the next sixteenth of the clock.\n\nThe edges of every repeat and switching on and off go through short fades, so there are no clicks. Without stutter the signal passes through unchanged. No delay. The repeated piece is at most 4.5 seconds long.',
  },
  ui: { width: 720, minWidth: 360 },
  i18n: { en: { ports: { in: 'In', out: 'Out', trig: 'Trigger', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [{ id: 'trig', name: 'Trigger' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const D = host && host.lang === 'nl' ? NL : EN;
    const tx = k => D[k] !== undefined ? D[k] : k;
    const clamp = ukClamp;
    let dead = false, node = null, ok = false, mod = {}, eff = {}, meter = { run: false, act: 0, sl: 0, fr: 0, lv: 0 }, hist = [];
    const input = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); bypass.gain.value = 1; input.connect(bypass).connect(out);
    const spec = {
      gate: { name: tx('gate'), min: 0.05, max: 1, unit: '%', g: 0, tip: tx('gate_t'), drift: 0.05 },
      ramp: { name: tx('ramp'), min: -3, max: 3, unit: 'st', g: 0, tip: tx('ramp_t'), role: 'pitch', drift: 0.03 },
      decay: { name: tx('decay'), min: 0, max: 12, unit: 'dB', g: 0, tip: tx('decay_t') },
      stop: { name: tx('stop'), min: 50, max: 3000, scale: 'log', unit: 'ms', g: 1, tip: tx('stop_t') },
      curve: { name: tx('curve'), min: 0.5, max: 4, scale: 'log', unit: '', g: 1, tip: tx('curve_t') },
      swell: { name: tx('swell'), min: 0, max: 1, unit: '%', g: 2, tip: tx('swell_t') },
      mix: { name: tx('mix'), min: 0, max: 1, unit: '%', g: 3, tip: tx('mix_t'), on: true },
      out: { name: tx('out'), min: -24, max: 12, unit: 'dB', g: 3, role: 'level' },
      len: { name: tx('len'), min: 1, max: 64, step: 1, unit: 'steps', g: 3, tip: tx('len_t'), drift: 0 },
    };
    const MODES = [['repeat', tx('m_repeat')], ['tapestop', tx('m_tape')], ['reverse', tx('m_rev')]];
    const RATES = LIST.map(v => [v, '1/' + v.replace('t', '') + (v.endsWith('t') ? ' T' : '')]);
    const RATES_TO = [['off', tx('off')]].concat(RATES);
    const REPS = [1, 2, 3, 4, 6, 8].map(v => [String(v), String(v)]), STEPS = [1, 2, 4, 8].map(v => [String(v), String(v)]);
    const PATTERNS = PAT_KEYS.map(k => [k, PAT_VIEW[k].map(b => b ? 'x' : '.').join(' ')]);
    const DIRS = [['fwd', tx('d_fwd')], ['rev', tx('d_rev')], ['alt', tx('d_alt')]];
    const AUTOS = [['off', tx('a_off')], ['step2', tx('a_step2')], ['beat', tx('a_beat')], ['half', tx('a_half')], ['bar4', tx('a_bar4')]];
    const defaults = { gate: 1, ramp: 0, decay: 0, stop: 600, curve: 1.5, swell: 0.7, mix: 1, out: 0, len: 4, mode: 'repeat', rate: '8', rateTo: 'off', reps: 2, steps: 1, pattern: 'all', dir: 'fwd', auto: 'off', quant: false, latch: false };
    const has = (list, v) => list.some(m => m[0] === v);
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max);
      n.len = Math.round(n.len);
      n.mode = has(MODES, s.mode) ? s.mode : defaults.mode; n.rate = has(RATES, s.rate) ? s.rate : defaults.rate; n.rateTo = has(RATES_TO, s.rateTo) ? s.rateTo : defaults.rateTo;
      n.reps = has(REPS, String(s.reps)) && typeof s.reps === 'number' ? s.reps : defaults.reps; n.steps = has(STEPS, String(s.steps)) && typeof s.steps === 'number' ? s.steps : defaults.steps;
      n.pattern = has(PATTERNS, s.pattern) ? s.pattern : defaults.pattern; n.dir = has(DIRS, s.dir) ? s.dir : defaults.dir; n.auto = has(AUTOS, s.auto) ? s.auto : defaults.auto;
      n.quant = typeof s.quant === 'boolean' ? s.quant : defaults.quant; n.latch = typeof s.latch === 'boolean' ? s.latch : defaults.latch; return n; }
    let state = normalize({});
    // ---------- klok en starten ----------
    let stepSec = 0.125, lastStepAt = -1e9, playing = false, autoOn = false;
    const ui2 = { want: false, sent: false };
    function refreshTempo() { try { const v = host && typeof host.stepDur === 'function' ? host.stepDur() : 60 / (host && host.bpm || 120) / 4; stepSec = ukFinite(v, stepSec, 0.02, 1); } catch { } }
    const post = m => { if (node) { try { node.port.postMessage(m); } catch { } } };
    const running = () => playing || performance.now() - lastStepAt < 400;
    function apply() { eff = ukResolve(spec, state, mod);
      post({ type: 'set', s: { mode: state.mode, rate: state.rate, rateTo: state.rateTo, reps: state.reps, steps: state.steps, pattern: state.pattern, gate: eff.gate, dir: state.dir, ramp: eff.ramp, decay: eff.decay, stop: eff.stop, curve: eff.curve, swell: eff.swell, mix: eff.mix, out: Math.pow(10, eff.out / 20), step: stepSec } }); }
    function flushUi(time) { if (ui2.tap) { ui2.tap = false; refreshTempo(); apply(); post({ type: 'src', k: 'ui', v: true, t: time }); post({ type: 'src', k: 'ui', v: false, t: time + stepSec }); ui2.sent = false; return; }
      if (ui2.sent === ui2.want) return; ui2.sent = ui2.want; refreshTempo(); apply(); post({ type: 'src', k: 'ui', v: ui2.want, t: time }); if (ui.pad && ui.pad.set && state.latch) ui.pad.set(ui2.want); }
    // met "op de stap starten" wacht een druk op de eerstvolgende zestiende; een korte tik die eerder loslaat, duurt dan precies één stap
    function setUi(v) { const wait = state.quant && running(); if (wait && !v && !ui2.sent && ui2.want) ui2.tap = true; ui2.want = v; if (wait) return; flushUi(ctx.currentTime); }
    function autoWant(step, bar) { switch (state.auto) { case 'step2': return step >= 14; case 'beat': return step >= 12; case 'half': return step >= 8; case 'bar4': return (bar | 0) % 4 === 3; default: return false; } }
    function setAuto(v, time) { if (v === autoOn) return; autoOn = v; if (v) { refreshTempo(); apply(); } post({ type: 'src', k: 'auto', v, t: time }); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.connect(node); input.disconnect(bypass); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (!m || !Number.isFinite(m.lv) || !Number.isFinite(m.sl) || !Number.isFinite(m.fr)) return; meter = m; hist.push([Math.min(1, m.lv), m.run ? 1 : 0]); if (hist.length > 240) hist.shift(); }; refreshTempo(); apply(); paintStatus(); })
      .catch(() => { ok = false; paintStatus(); });
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, stopDraw = null, statusEl = null;
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('var(--audio,#7ee0a1)'));
      const top = ukEl(app, 'div', 'top');
      const pbox = ukEl(top, 'div', 'padbox');
      if (host && host.ui && typeof host.ui.pad === 'function') {
        ui.pad = host.ui.pad(pbox, tx('pad'), { id: 'trigger', group: 'play', text: tx('pad'), title: tx('padTip'), onpress: () => { if (state.latch) { setUi(!ui2.want); } else setUi(true); }, onrelease: () => { if (!state.latch) setUi(false); } });
      } else {
        const b = ui.pad = ukEl(pbox, 'button', '', tx('pad')); b.type = 'button'; b.title = tx('padTip'); b.setAttribute('data-pk-id', 'trigger');
        b.onpointerdown = () => { if (state.latch) { setUi(!ui2.want); b.classList.toggle('on', ui2.want); } else { setUi(true); b.classList.add('on'); } };
        const up = () => { if (!state.latch) { setUi(false); b.classList.remove('on'); } }; b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up; }
      ui.mode = ukSelect(top, tx('mode'), MODES, state.mode, v => { state.mode = v; apply(); paint(); }, { id: 'mode', group: 'repeat' });
      ui.rate = ukSelect(top, tx('rate'), RATES, state.rate, v => { state.rate = v; apply(); }, { id: 'rate', group: 'repeat' });
      ui.steps = ukSelect(top, tx('steps'), STEPS, state.steps, v => { state.steps = +v; apply(); }, { id: 'steps', group: 'repeat' });
      ui.pattern = ukSelect(top, tx('pattern'), PATTERNS, state.pattern, v => { state.pattern = v; apply(); }, { id: 'pattern', group: 'repeat' });
      ui.dir = ukSelect(top, tx('dir'), DIRS, state.dir, v => { state.dir = v; apply(); }, { id: 'dir', group: 'repeat' });
      const t2 = ukEl(app, 'div', 'top');
      ui.rateTo = ukSelect(t2, tx('rateTo'), RATES_TO, state.rateTo, v => { state.rateTo = v; apply(); }, { id: 'rateTo', group: 'repeat' });
      ui.reps = ukSelect(t2, tx('reps'), REPS, state.reps, v => { state.reps = +v; apply(); }, { id: 'reps', group: 'repeat' });
      ui.auto = ukSelect(t2, tx('auto'), AUTOS, state.auto, v => { state.auto = v; if (v === 'off') setAuto(false, ctx.currentTime); }, { id: 'auto', group: 'play' });
      ui.quant = ukEl(t2, 'button', '', tx('quant')); ui.quant.type = 'button'; ui.quant.title = tx('quantTip'); ui.quant.setAttribute('data-pk-id', 'quant'); ui.quant.onclick = () => { state.quant = !state.quant; paint(); };
      ui.latch = ukEl(t2, 'button', '', tx('latch')); ui.latch.type = 'button'; ui.latch.title = tx('latchTip'); ui.latch.setAttribute('data-pk-id', 'latch');
      ui.latch.onclick = () => { state.latch = !state.latch; if (ui2.want) { ui2.want = false; flushUi(ctx.currentTime); } if (ui.pad && ui.pad.set) ui.pad.set(false); paint(); };
      cv = ukEl(app, 'canvas'); cv.setAttribute('aria-label', tx('aria'));
      statusEl = ukEl(app, 'p', 'stt');
      ui.k = ukSliders(app, spec, [{ key: 'repeat', label: tx('g0') }, { key: 'tape', label: tx('g1') }, { key: 'reverse', label: tx('g2') }, { key: 'output', label: tx('g3') }], (id, v) => { state[id] = id === 'len' ? Math.round(v) : v; apply(); }, defaults, tx('dbl'));
      paint(); paintStatus(); stopDraw = ukLoop(host, self, draw, 30); }
    function paintStatus() { if (statusEl) statusEl.textContent = ok ? '' : tx('failed'); }
    function paint() { if (!root) return; const m = state.mode;
      ui.mode.value = state.mode; ui.rate.value = state.rate; ui.steps.value = String(state.steps); ui.pattern.value = state.pattern; ui.dir.value = state.dir; ui.rateTo.value = state.rateTo; ui.reps.value = String(state.reps); ui.auto.value = state.auto;
      ui.quant.classList.toggle('on', state.quant); ui.latch.classList.toggle('on', state.latch);
      const rep = m !== 'tapestop';
      for (const id of ['rate', 'steps', 'pattern', 'rateTo', 'reps']) ui[id].parentElement.style.opacity = rep ? 1 : 0.4; ui.dir.parentElement.style.opacity = m === 'repeat' ? 1 : 0.4;
      for (const [id, k] of Object.entries(ui.k)) { k.set(state[id]); const dim = (['gate', 'ramp', 'decay'].includes(id) && !rep) || (['stop', 'curve'].includes(id) && m !== 'tapestop') || (id === 'swell' && m !== 'reverse'); k.el.style.opacity = dim ? 0.35 : 1; } }
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, ukH(cv, 90));
      if (g) { const acc = ukVar(cv, '--u-acc', '#7ee0a1'), line = ukVar(cv, '--line', '#333'); g.clearRect(0, 0, w, h);
        const ph = Math.round(h * 0.42), pat = PAT_VIEW[state.pattern] || [1], n = pat.length, cw = (w - 8) / n;
        // niveau van de uitgang, met het deel waarin de stutter actief is
        const dx = w / 239; for (let i = 0; i < hist.length; i++) { const [v, r] = hist[i], bh = Math.min(1, Math.sqrt(v)) * (ph - 4); g.globalAlpha = r ? 0.75 : 0.25; g.fillStyle = acc; g.fillRect(i * dx, ph - bh, Math.max(1, dx), bh); }
        g.globalAlpha = 1; g.strokeStyle = line; g.beginPath(); g.moveTo(0, ph + 0.5); g.lineTo(w, ph + 0.5); g.stroke();
        // gate-patroon met de huidige herhaling
        const cur = meter.run && state.mode !== 'tapestop' ? (meter.sl | 0) % n : -1, y0 = ph + 6, chh = h - y0 - 4;
        for (let i = 0; i < n; i++) { const x = 4 + i * cw; g.globalAlpha = pat[i] ? 0.55 : 0.15; g.fillStyle = acc; g.fillRect(x + 1, y0, cw - 2, chh);
          if (i === cur) { g.globalAlpha = 1; g.strokeStyle = acc; g.lineWidth = 2; g.strokeRect(x + 1, y0, cw - 2, chh); g.lineWidth = 1; g.fillStyle = acc; g.fillRect(x + 1 + clamp(meter.fr || 0, 0, 1) * (cw - 4), y0, 2, chh); } }
        g.globalAlpha = 1; } }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (ui.pad && ui.pad.destroy) ui.pad.destroy(); if (cv && cv._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; }
    const self = {
      inputs: { in: input }, outputs: { out },
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; lastStepAt = performance.now(); const sd = ukFinite(info.stepDur, stepSec, 0.02, 1); if (Math.abs(sd - stepSec) > 1e-4) { stepSec = sd; apply(); }
          const time = ukFinite(info.time, ctx.currentTime, 0, 1e9); flushUi(time); setAuto(autoWant(info.step | 0, info.bar | 0), time); } catch {} },
      onTransport(t) { try { playing = !!(t && t.playing); if (!playing) { setAuto(false, ctx.currentTime); flushUi(ctx.currentTime); } } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'trig' || !e || !node) return; const type = String(e.type || '').toLowerCase(); const time = ukFinite(e.time, ctx.currentTime, 0, 1e9); refreshTempo();
          if (type === 'cc') { apply(); post({ type: 'src', k: 'cc', v: ukFinite(e.value, 0, 0, 1) >= 0.5, t: time }); return; }
          if (!['trig', 'note', 'noteon'].includes(type) || e.vel === 0) return;
          const dur = type === 'trig' ? Math.round(eff.len || state.len) * stepSec : (typeof e.dur === 'number' && Number.isFinite(e.dur) && e.dur > 0 ? ukClamp(e.dur, 0.01, 60) : Math.round(eff.len || state.len) * stepSec);
          apply(); post({ type: 'src', k: 'ev', d: 1, t: time }); post({ type: 'src', k: 'ev', d: -1, t: time + dur }); } catch {} },
      params() { return ukParams(spec, 'stutter', 'Stutter'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      latency() { return 0; },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); if (state.auto === 'off') setAuto(false, ctx.currentTime); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { post({ type: 'panic' }); input.disconnect(); bypass.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } out.disconnect(); } catch {} },
    };
    apply();
    return self;
  },
};
