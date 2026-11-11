// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Patchkamer contract v1.34. Eerste versie: versterkt of dempt de aanzet (attack) en de uitklink (sustain) van een signaal, onafhankelijk van het ingangsniveau.
//          Werking: een snelle en een langzame envelope-volger; hun verschil in dB (snel minus langzaam) is positief tijdens een aanzet en negatief tijdens het uitklinken.
//          Dat verschil is een verhouding en dus onafhankelijk van de drempel. Attack en sustain (-100 tot +100 %) schalen het verschil tot een versterking in dB.
//          Drie tijdconstanten (snel, normaal, lang), optioneel drie banden (laag, mid, hoog) met eigen attack en sustain en instelbare crossovers (afsplitsend: de banden tellen weer op tot het origineel),
//          mix, uitgangsniveau en twee meters (versterking en demping).
//          Geen vertraging (geen lookahead): latency 0. Bij attack en sustain 0 % (en 3 banden uit, mix 100 %, uitgang 0 dB) gaat het signaal bit-identiek door.
//          Tweetalig (host.lang), tekenen via host.frame, meters door de host (host.ui.meter).
//          Bewaker: de worklet begrenst de ingangen (±16 = +24 dB), zet NaN op 0, accepteert alleen eindige parameters en zet een ontspoorde toestand terug.
/** Transient Shaper — meer of minder aanzet en uitklink, op elk niveau.
 * Signaalweg: ingang -> (optioneel drie banden) -> versterking per band -> mix met het droge signaal -> uitgang.
 * Detector: per band het grootste van beide kanalen (gekoppeld, zodat het stereobeeld blijft staan); twee volgers (snel en langzaam) op de gelijkgerichte waarde.
 * Versterking in dB: verschil > 0 (aanzet): attack * verschil; verschil < 0 (uitklinken): sustain * |verschil|. Begrensd op +18 dB en -40 dB; onder -70 dBFS neemt het effect af (geen ruis oppompen).
 */

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const NL = {
  speed: 'Tijden', s_fast: 'Snel (hi-hats, percussie)', s_normal: 'Normaal (snare, breaks)', s_long: 'Lang (kick, bas)',
  bands: '3 banden', bandsTip: 'Laag, mid en hoog krijgen elk een eigen attack en sustain', on: 'Aan', off: 'Uit (doorlaten)',
  aria: 'Verloop van de versterking', boost: 'Versterking', cut: 'Demping', gain: 'Nu', failed: 'AudioWorklet niet beschikbaar: het geluid gaat ongewijzigd door.', dbl: 'dubbelklik: standaard',
  g0: 'Vorm', g1: 'Banden en crossovers', g2: 'Uitgang',
  attack: 'Attack', attack_t: 'plus = meer aanzet, min = zachtere aanzet', sustain: 'Sustain', sustain_t: 'plus = langer uitklinken, min = korter',
  lowAttack: 'Laag attack', lowSustain: 'Laag sustain', midAttack: 'Mid attack', midSustain: 'Mid sustain', highAttack: 'Hoog attack', highSustain: 'Hoog sustain',
  xoLow: 'Crossover laag/mid', xoHigh: 'Crossover mid/hoog', mix: 'Mix', mix_t: 'deel van het bewerkte signaal', out: 'Uitgang',
};
const EN = {
  speed: 'Times', s_fast: 'Fast (hats, percussion)', s_normal: 'Normal (snare, breaks)', s_long: 'Long (kick, bass)',
  bands: '3 bands', bandsTip: 'Low, mid and high each get their own attack and sustain', on: 'On', off: 'Off (pass through)',
  aria: 'Gain over time', boost: 'Boost', cut: 'Cut', gain: 'Now', failed: 'AudioWorklet unavailable: the sound passes through unchanged.', dbl: 'double-click: default',
  g0: 'Shape', g1: 'Bands and crossovers', g2: 'Output',
  attack: 'Attack', attack_t: 'plus = more punch, minus = softer onset', sustain: 'Sustain', sustain_t: 'plus = longer tail, minus = shorter',
  lowAttack: 'Low attack', lowSustain: 'Low sustain', midAttack: 'Mid attack', midSustain: 'Mid sustain', highAttack: 'High attack', highSustain: 'High sustain',
  xoLow: 'Low/mid crossover', xoHigh: 'Mid/high crossover', mix: 'Mix', mix_t: 'share of the processed signal', out: 'Output',
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
.mt{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;margin:6px 0 8px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.mt>div{display:flex;align-items:center;gap:8px}
.big{font-family:var(--mono,monospace);font-size:16px;color:var(--u-ink);text-transform:none;letter-spacing:0}`;
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
function ukFmt(d, v) { const u = d.unit || ''; if (u === 'pct') return (v > 0.5 ? '+' : '') + Math.round(v) + ' %'; if (u === '%') return Math.round(v * 100) + '%';
  if (u === 'Hz') return v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : Math.round(v) + ' Hz'; if (u === 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB'; return v.toFixed(2) + (u ? ' ' + u : ''); }
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
// meter door de host laten tekenen (contract 12e); zonder host.ui.meter blijft het getal over
function ukMeter(host, parent, label, id, range, len) { if (!(host && host.ui && typeof host.ui.meter === 'function')) return null;
  try { return host.ui.meter(parent, label, { id, group: 'meters', unit: 'db', range, hold: false, orientation: 'horizontal', length: len || 150, width: 10 }); } catch { return null; } }

function ukResolve(spec, state, mod) { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; if (!x) continue; e[id] = ukClamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } return e; }
function ukParams(spec, lane, laneName) { return Object.entries(spec).map(([id, d]) => ({ id, name: d.name, lane, laneName, min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'level', drift: d.drift ?? 0.05, on: d.on ?? false })); }

const WNAME = 'nl-patchkamer-transientshaper-1-0-0';
const WORKLET = `
const IN_MAX = 16;
const SPEEDS = { fast: [0.0002, 0.004, 0.006, 0.05], normal: [0.0005, 0.010, 0.015, 0.12], long: [0.002, 0.030, 0.045, 0.30] };
const BSCALE = [1, 2.5, 1, 0.6];
const cl = v => (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX);
const lim = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const bq = (f, sr) => { const w = 2 * Math.PI * f / sr, c = Math.cos(w), a = Math.sin(w) / (2 * 0.7071067811865476), a0 = 1 + a; return [(1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0, -2 * c / a0, (1 - a) / a0]; };
class TransientShaper extends AudioWorkletProcessor{
  constructor(){ super(); const sr = sampleRate;
    this.s = { on: true, speed: 'normal', bands: false, att: [0, 0, 0, 0], sus: [0, 0, 0, 0], xl: 200, xh: 2500, mix: 1, out: 1 };
    this.sa = [0, 0, 0, 0]; this.ss = [0, 0, 0, 0]; this.sm = 1; this.so = 1; this.sb = 0; this.xlS = 200; this.xhS = 2500;
    this.ef = new Float64Array(4); this.es = new Float64Array(4); this.gs = new Float64Array([1, 1, 1, 1]);
    this.z = new Float64Array(16); this.cA = bq(200, sr); this.cB = bq(2500, sr); this.k = new Float64Array(16); this.kSpeed = '';
    this.kp = 1 - Math.exp(-1 / (0.015 * sr)); this.kg = 1 - Math.exp(-1 / (0.00015 * sr));
    this.up = 0; this.dn = 0; this.lv = 0; this.n = 0;
    this.port.onmessage = e => { const m = e.data || {}; if (m.type !== 'set') return; const o = m.s || {}, s = this.s;
      for (const key of ['att', 'sus']) if (Array.isArray(o[key])) for (let i = 0; i < 4; i++) { const v = o[key][i]; if (typeof v === 'number' && Number.isFinite(v)) s[key][i] = lim(v, -1, 1); }
      if (typeof o.on === 'boolean') s.on = o.on; if (typeof o.bands === 'boolean') s.bands = o.bands;
      if (o.speed === 'fast' || o.speed === 'normal' || o.speed === 'long') s.speed = o.speed;
      if (typeof o.xl === 'number' && Number.isFinite(o.xl)) s.xl = lim(o.xl, 40, 1000);
      if (typeof o.xh === 'number' && Number.isFinite(o.xh)) s.xh = lim(o.xh, 600, 12000);
      if (typeof o.mix === 'number' && Number.isFinite(o.mix)) s.mix = lim(o.mix, 0, 1);
      if (typeof o.out === 'number' && Number.isFinite(o.out)) s.out = lim(o.out, 0, 8); }; }
  process(ins, outs){ const s = this.s, sr = sampleRate, I = ins[0], O = outs[0], N = O[0].length;
    const iL = I && I[0] ? I[0] : null, iR = I && I[1] ? I[1] : iL, oL = O[0], oR = O[1] || O[0];
    if (this.kSpeed !== s.speed) { const T = SPEEDS[s.speed]; for (let b = 0; b < 4; b++) for (let j = 0; j < 4; j++) this.k[b * 4 + j] = 1 - Math.exp(-1 / (T[j] * BSCALE[b] * sr)); this.kSpeed = s.speed; }
    // crossovers: de frequentie volgt zacht, de coefficienten volgen per blok
    this.xlS += (s.xl - this.xlS) * 0.25; this.xhS += (s.xh - this.xhS) * 0.25;
    const fl = lim(this.xlS, 20, sr * 0.4), fh = lim(Math.max(this.xhS, fl * 1.25), 40, sr * 0.45);
    this.cA = bq(fl, sr); this.cB = bq(fh, sr); const cA = this.cA, cB = this.cB, z = this.z;
    const q = (i, c, x) => { const y = c[0] * x + z[i]; z[i] = c[1] * x - c[3] * y + z[i + 1]; z[i + 1] = c[2] * x - c[4] * y; return y; };
    const sa = this.sa, ss = this.ss, ta = s.att, ts = s.sus, ef = this.ef, es = this.es, gs = this.gs, k = this.k, kp = this.kp, kg = this.kg;
    const tm = s.on ? s.mix : 0, tb = s.bands ? 1 : 0, to = s.out; const d = [0, 0, 0, 0], gdb = [0, 0, 0, 0]; let up = this.up, dn = this.dn, lv = this.lv;
    for (let t = 0; t < N; t++) {
      const xl = iL ? cl(iL[t]) : 0, xr = iR ? cl(iR[t]) : 0;
      for (let b = 0; b < 4; b++) {
        sa[b] += (ta[b] - sa[b]) * kp; if (Math.abs(ta[b] - sa[b]) < 1e-9) sa[b] = ta[b];
        ss[b] += (ts[b] - ss[b]) * kp; if (Math.abs(ts[b] - ss[b]) < 1e-9) ss[b] = ts[b]; }
      this.sm += (tm - this.sm) * kp; if (Math.abs(tm - this.sm) < 1e-9) this.sm = tm;
      this.so += (to - this.so) * kp; if (Math.abs(to - this.so) < 1e-9) this.so = to;
      this.sb += (tb - this.sb) * kp; if (Math.abs(tb - this.sb) < 1e-9) this.sb = tb;
      // drie banden: laag, mid en hoog tellen (afsplitsend) weer op tot het origineel
      const ll = q(0, cA, q(2, cA, xl)), lr = q(8, cA, q(10, cA, xr)), rl = xl - ll, rr = xr - lr;
      const ml = q(4, cB, q(6, cB, rl)), mr = q(12, cB, q(14, cB, rr)), hl = rl - ml, hr = rr - mr;
      d[0] = Math.max(Math.abs(xl), Math.abs(xr)); d[1] = Math.max(Math.abs(ll), Math.abs(lr)); d[2] = Math.max(Math.abs(ml), Math.abs(mr)); d[3] = Math.max(Math.abs(hl), Math.abs(hr));
      for (let b = 0; b < 4; b++) {
        const a = d[b], i = b * 4, f = ef[b], sl = es[b];
        ef[b] = f + (a - f) * (a > f ? k[i] : k[i + 1]); es[b] = sl + (a - sl) * (a > sl ? k[i + 2] : k[i + 3]);
        const df = 8.685889638065035 * Math.log((ef[b] + 1e-7) / (es[b] + 1e-7)), w = es[b] >= 3e-4 ? 1 : es[b] / 3e-4;
        let g = df > 0 ? sa[b] * df * w : -ss[b] * df * w; g = g > 18 ? 18 : g < -40 ? -40 : g; gdb[b] = g;
        const gl = Math.exp(g * 0.11512925464970229); gs[b] += (gl - gs[b]) * kg; if (gl === 1 && Math.abs(1 - gs[b]) < 1e-9) gs[b] = 1; }
      const ysl = xl * gs[0], ysr = xr * gs[0]; let yl = ysl, yr = ysr, gu, gd;
      if (this.sb > 0) { const bl = ll * gs[1] + ml * gs[2] + hl * gs[3], br = lr * gs[1] + mr * gs[2] + hr * gs[3]; yl = ysl + (bl - ysl) * this.sb; yr = ysr + (br - ysr) * this.sb; }
      if (this.sb > 0.5) { gu = Math.max(gdb[1], gdb[2], gdb[3]); gd = Math.min(gdb[1], gdb[2], gdb[3]); } else { gu = gdb[0]; gd = gdb[0]; }
      if (gu > up) up = gu; if (gd < dn) dn = gd; if (d[0] > lv) lv = d[0];
      const m = this.sm, og = this.so; oL[t] = (xl * (1 - m) + yl * m) * og; oR[t] = (xr * (1 - m) + yr * m) * og; }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    for (let b = 0; b < 4; b++) { if (!(ef[b] >= 0 && ef[b] < 1e6)) ef[b] = 0; if (!(es[b] >= 0 && es[b] < 1e6)) es[b] = 0; if (!(gs[b] > 0 && gs[b] < 1e4)) gs[b] = 1; if (!(Math.abs(sa[b]) <= 1)) sa[b] = 0; if (!(Math.abs(ss[b]) <= 1)) ss[b] = 0; }
    for (let i = 0; i < 16; i++) if (!(Math.abs(z[i]) < 1e6)) z[i] = 0;
    if (!(this.sm >= 0 && this.sm <= 1)) this.sm = 1; if (!(this.so >= 0 && this.so <= 8)) this.so = 1; if (!(this.sb >= 0 && this.sb <= 1)) this.sb = 0;
    if (!(this.xlS > 0 && this.xlS < 1e5)) this.xlS = 200; if (!(this.xhS > 0 && this.xhS < 1e5)) this.xhS = 2500;
    this.up = up; this.dn = dn; this.lv = lv;
    if ((this.n += 1) % 8 === 0) { this.port.postMessage({ up: this.up, dn: this.dn, lv: this.lv }); this.up = 0; this.dn = 0; this.lv = 0; }
    return true; } }
registerProcessor('${WNAME}', TransientShaper);`;

export default {
  id: 'nl.patchkamer.transientshaper', name: 'Transient Shaper', version: '1.0.0', kind: 'effect', category: 'effect',
  about: {
    nl: 'Versterkt of dempt de aanzet (attack) en het uitklinken (sustain) van een geluid, op elk niveau. Zo krijgt een snare meer tik, een kick meer stoot, wordt een break strakker of een pad zachter, zonder een drempel in te stellen.\n\nHoe het werkt: een snelle en een langzame volger meten het niveau. Zijn ze het oneens, dan is er een aanzet (snel hoger) of een uitklink (snel lager); dat verschil in dB bepaalt hoeveel er wordt versterkt of gedempt. Het verschil is een verhouding, dus een zacht en een hard geslagen drum klinken hetzelfde bewerkt. Onder circa -70 dBFS neemt het effect af, zodat ruis niet wordt opgepompt.\n\nTijden: Snel voor hi-hats en percussie, Normaal voor snares en breaks, Lang voor kicks en bas. Met 3 banden krijgen laag, mid en hoog elk een eigen attack en sustain: strak laag, scherpe mid, rustige hoog. De banden worden afgesplitst en tellen weer op tot het origineel.\n\nBij attack en sustain 0 % (3 banden uit, mix 100 %, uitgang 0 dB) gaat het signaal ongewijzigd door. Geen vertraging (geen lookahead). Een flinke aanzetversterking kan pieken geven: verlaag de uitgang of zet er een limiter achter.',
    en: 'Boosts or reduces the attack and the sustain of a sound, at any level. A snare gets more snap, a kick more punch, a break gets tighter or a pad softer, without setting a threshold.\n\nHow it works: a fast and a slow follower measure the level. When they disagree there is an onset (fast is higher) or a tail (fast is lower); that difference in dB decides how much is boosted or cut. The difference is a ratio, so a soft and a hard hit sound the same once shaped. Below about -70 dBFS the effect fades out, so noise is not pumped up.\n\nTimes: Fast for hats and percussion, Normal for snares and breaks, Long for kicks and bass. With 3 bands, low, mid and high each get their own attack and sustain: tight lows, a sharp mid, a calm top. The bands are split off and add back up to the original.\n\nWith attack and sustain at 0% (3 bands off, mix 100%, output 0 dB) the signal passes through unchanged. No delay (no lookahead). A big attack boost can create peaks: lower the output or follow it with a limiter.',
  },
  ui: { width: 720, minWidth: 360 },
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const D = host && host.lang === 'nl' ? NL : EN;
    const tx = k => D[k] !== undefined ? D[k] : k;
    const clamp = ukClamp;
    let dead = false, node = null, ok = false, mod = {}, eff = {}, meter = { up: 0, dn: 0 }, hist = [];
    const input = ctx.createGain(), out = ctx.createGain(), bypass = ctx.createGain(); bypass.gain.value = 1; input.connect(bypass).connect(out);
    const spec = {
      attack: { name: tx('attack'), min: -100, max: 100, unit: 'pct', g: 0, tip: tx('attack_t'), role: 'level' },
      sustain: { name: tx('sustain'), min: -100, max: 100, unit: 'pct', g: 0, tip: tx('sustain_t'), role: 'level' },
      lowAttack: { name: tx('lowAttack'), min: -100, max: 100, unit: 'pct', g: 1, role: 'level' },
      lowSustain: { name: tx('lowSustain'), min: -100, max: 100, unit: 'pct', g: 1, role: 'level' },
      midAttack: { name: tx('midAttack'), min: -100, max: 100, unit: 'pct', g: 1, role: 'level' },
      midSustain: { name: tx('midSustain'), min: -100, max: 100, unit: 'pct', g: 1, role: 'level' },
      highAttack: { name: tx('highAttack'), min: -100, max: 100, unit: 'pct', g: 1, role: 'level' },
      highSustain: { name: tx('highSustain'), min: -100, max: 100, unit: 'pct', g: 1, role: 'level' },
      xoLow: { name: tx('xoLow'), min: 40, max: 1000, scale: 'log', unit: 'Hz', g: 1, role: 'filter', drift: 0.04 },
      xoHigh: { name: tx('xoHigh'), min: 600, max: 12000, scale: 'log', unit: 'Hz', g: 1, role: 'filter', drift: 0.04 },
      mix: { name: tx('mix'), min: 0, max: 1, unit: '%', g: 2, tip: tx('mix_t'), on: true, drift: 0.05 },
      out: { name: tx('out'), min: -24, max: 12, unit: 'dB', g: 2, role: 'level' },
    };
    const SPEEDS = [['fast', tx('s_fast')], ['normal', tx('s_normal')], ['long', tx('s_long')]];
    const defaults = { attack: 40, sustain: 0, lowAttack: 0, lowSustain: 0, midAttack: 0, midSustain: 0, highAttack: 0, highSustain: 0, xoLow: 200, xoHigh: 2500, mix: 1, out: 0, speed: 'normal', bands: false, on: true };
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max);
      n.speed = SPEEDS.some(m => m[0] === s.speed) ? s.speed : defaults.speed;
      n.bands = typeof s.bands === 'boolean' ? s.bands : defaults.bands; n.on = typeof s.on === 'boolean' ? s.on : defaults.on; return n; }
    let state = normalize({});
    function apply() { eff = ukResolve(spec, state, mod); const A = k => eff[k] / 100;
      if (node) node.port.postMessage({ type: 'set', s: { on: state.on, speed: state.speed, bands: state.bands, att: [A('attack'), A('lowAttack'), A('midAttack'), A('highAttack')], sus: [A('sustain'), A('lowSustain'), A('midSustain'), A('highSustain')], xl: eff.xoLow, xh: eff.xoHigh, mix: eff.mix, out: Math.pow(10, eff.out / 20) } }); }
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      input.connect(node); input.disconnect(bypass); node.connect(out); ok = true;
      node.port.onmessage = e => { const m = e.data; if (!m || !Number.isFinite(m.up) || !Number.isFinite(m.dn)) return; meter = m; hist.push([m.up, m.dn]); if (hist.length > 240) hist.shift(); }; apply(); paintStatus(); })
      .catch(() => { ok = false; paintStatus(); });
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, stopDraw = null, statusEl = null, txtNow = '';
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('var(--audio,#7ee0a1)'));
      const top = ukEl(app, 'div', 'top');
      ui.speed = ukSelect(top, tx('speed'), SPEEDS, state.speed, v => { state.speed = v; apply(); }, { id: 'speed', group: 'shape' });
      ui.bands = ukEl(top, 'button', '', tx('bands')); ui.bands.type = 'button'; ui.bands.title = tx('bandsTip'); ui.bands.setAttribute('data-pk-id', 'bands'); ui.bands.onclick = () => { state.bands = !state.bands; apply(); paint(); };
      ui.on = ukEl(top, 'button', '', ''); ui.on.type = 'button'; ui.on.setAttribute('data-pk-id', 'on'); ui.on.onclick = () => { state.on = !state.on; apply(); paint(); };
      const mt = ukEl(app, 'div', 'mt');
      const m1 = ukEl(mt, 'div'), m2 = ukEl(mt, 'div'), m3 = ukEl(mt, 'div'); ukEl(m1, 'span', '', tx('boost')); ukEl(m2, 'span', '', tx('cut')); ukEl(m3, 'span', '', tx('gain'));
      ui.mBoost = ukMeter(host, m1, tx('boost'), 'met.boost', [0, 18], 140); ui.mCut = ukMeter(host, m2, tx('cut'), 'met.cut', [0, 24], 140); ui.gr = ukEl(m3, 'span', 'big', '0.0 dB');
      cv = ukEl(app, 'canvas'); cv.setAttribute('aria-label', tx('aria'));
      statusEl = ukEl(app, 'p', 'stt');
      ui.k = ukSliders(app, spec, [{ key: 'shape', label: tx('g0') }, { key: 'bands', label: tx('g1') }, { key: 'output', label: tx('g2') }], (id, v) => { state[id] = v; apply(); }, defaults, tx('dbl'));
      paint(); paintStatus(); stopDraw = ukLoop(host, self, draw, 30); }
    function paintStatus() { if (statusEl) statusEl.textContent = ok ? '' : tx('failed'); }
    function paint() { if (!root) return; ui.speed.value = state.speed;
      ui.bands.classList.toggle('on', state.bands); ui.on.textContent = state.on ? tx('on') : tx('off'); ui.on.classList.toggle('on', state.on);
      for (const [id, k] of Object.entries(ui.k)) { k.set(state[id]); const band = /^(low|mid|high)/.test(id) || id === 'xoLow' || id === 'xoHigh'; k.el.style.opacity = (band && !state.bands) || (!band && (id === 'attack' || id === 'sustain') && state.bands) ? 0.35 : 1; } }
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, ukH(cv, 90));
      if (g) { const acc = ukVar(cv, '--u-acc', '#7ee0a1'), mid = h / 2, sc = (mid - 4) / 18; g.clearRect(0, 0, w, h);
        g.strokeStyle = ukVar(cv, '--line', '#333'); g.lineWidth = 1; g.fillStyle = ukVar(cv, '--muted', '#888'); g.font = '9px monospace';
        [-12, -6, 0, 6, 12].forEach(db => { const y = mid - db * sc; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillText((db > 0 ? '+' : '') + db + ' dB', 4, y - 2); });
        g.fillStyle = acc; g.globalAlpha = 0.45; const n = hist.length, dx = w / 239;
        for (let i = 0; i < n; i++) { const [u, d] = hist[i], x = i * dx; if (u > 0.05) g.fillRect(x, mid - u * sc, Math.max(1, dx), u * sc); if (d < -0.05) g.fillRect(x, mid, Math.max(1, dx), -d * sc); }
        g.globalAlpha = 1; }
      const bu = clamp(meter.up || 0, 0, 18), bd = clamp(meter.dn || 0, -40, 0);
      if (ui.mBoost) ui.mBoost.set(bu); if (ui.mCut) ui.mCut.set(Math.min(24, -bd));
      const t = (bu > -bd ? '+' + bu.toFixed(1) : bd.toFixed(1)) + ' dB'; if (ui.gr && t !== txtNow) { txtNow = t; ui.gr.textContent = t; } }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (ui.mBoost && ui.mBoost.destroy) ui.mBoost.destroy(); if (ui.mCut && ui.mCut.destroy) ui.mCut.destroy();
      if (cv && cv._ro) { try { cv._ro.disconnect(); } catch { } } if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; statusEl = null; }
    const self = {
      inputs: { in: input }, outputs: { out },
      mount, unmount,
      params() { return ukParams(spec, 'shaper', 'Transient Shaper'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      latency() { return 0; },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; unmount(); try { input.disconnect(); bypass.disconnect(); if (node) { node.port.onmessage = null; node.disconnect(); } out.disconnect(); } catch {} },
    };
    apply();
    return self;
  },
};
