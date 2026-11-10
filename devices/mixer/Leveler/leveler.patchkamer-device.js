// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.18.0 — Opmaak voor de skin Compact: de zes regelaars staan per groep in een eigen vak (div.lv-sec binnen div.lv-knobs) en het apparaat zet zelf een korte stijl voor zo'n skin (alleen actief met data-pk-face door de host; zonder skin ongewijzigd). Geluid, state, presets en poorten ongewijzigd.
// 1.17.0 — Uitleg naar about (menu Over Leveler); de UI toont geen uitlegtekst meer.
// 1.16.0 — De IN- en UIT-meter via host.ui.meter (contract v1.18, additief): de host tekent ze (ids met.in en met.out, groep meters, dB-schaal −60 tot 0, horizontaal) en een skin kan er een VU-meter, ledlader of andere balk van maken. Het doelniveau blijft als streepje over beide meters staan zolang het gezicht een horizontale balk of ledlader is. De REGEL-balk en het limiterlampje blijven een eigen canvas (een regeling rond nul en een lampje passen niet in een niveaumeter) en de getallen blijven tekst. Een oudere host valt terug op het canvas met alle vier de rijen zoals voorheen. Geluid, worklet-berichten, state, presets en poorten ongewijzigd.
// 1.15.1 — Alle zes continue regelaars (Target, Response, Window, Range ±, Gate, Ceiling) zijn nu stuurbaar via params/modulate; het apparaat krijgt daarmee automatisch een mod-ingang. Alles staat standaard uit in Drift. Knopwaarden, getState, presets en geluid zonder modulatie ongewijzigd. Bewust niet: het keuzemenu Stand (Regelen/Doorlaten) en de twee knoppen.
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — Een niet-eindige of absurd grote ingangswaarde (NaN, ±Infinity, een filter dat ontploft) vergiftigde de meting en de piekvolger voor altijd: na één Infinity-sample bleef alles stil. Nu wordt de ingang begrensd (±16 = +24 dB) en NaN wordt 0, en een bewaker zet een ontspoorde toestand terug. Normaal geluid is bit-identiek aan 1.11.0.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Leveler en nieuwe id nl.patchkamer.leveler (voorheen Egaal, nl.patchkamer.egaal); presets en songs uit die tijd verwijzen naar de oude id. Tweetalig (host.lang, poortnamen per taal in i18n). Tekenen via host.frame met een ResizeObserver en een kleurcache
//          (de tekenpoort-omzetting is weg). setState negeert onbekende velden en kapt getallen af op hun bereik; de klank is ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// 1.7.4 — Eerste versie.
// Leveler: niveaubewaker (leveler + limiter).
// Houdt het gemiddelde volume van een bron gelijk. Een leveler meet het niveau over een instelbare tijd en regelt
// het volume langzaam omhoog én omlaag naar een doelniveau, binnen een maximaal bereik. Bij stilte (onder de
// stiltedrempel) blijft de regeling staan, zodat galmstaarten en pauzes niet worden opgeblazen. Daarachter zit
// een limiter met 5 ms vooruitkijken als vangnet voor pieken boven het plafond.
// Bedoeld voor bronnen die door Drift of andere modulatie langzaam harder en zachter worden: zet Leveler tussen
// het instrument en de mixer, of op de mix vóór de uitgang.
// Zonder AudioWorklet laat Leveler het geluid ongewijzigd door en meldt dat in de UI.

const WNAME = 'nl-patchkamer-leveler-1-11-1';
const WORKLET = `
const IN_MAX = 16;
class Egaal extends AudioWorkletProcessor {
  constructor() {
    super();
    this.s = { on: true, target: -18, speed: 3, window: 0.8, range: 12, gate: -55, ceiling: -1 };
    this.ms = 0; this.gDb = 0; this.lg = 1; this.env = 0; this.outMs = 0;
    this.L = Math.max(1, Math.round(sampleRate * 0.005)); this.bl = new Float32Array(this.L); this.br = new Float32Array(this.L); this.bi = 0;
    this.n = 0; this.lim = 1;
    this.port.onmessage = e => { const m = e.data || {}; if (m.type === 'set') { for (const k in (m.s || {})) { const v = m.s[k]; if (k in this.s && (k === 'on' ? typeof v === 'boolean' : Number.isFinite(v))) this.s[k] = v; } } else if (m.type === 'reset') { this.gDb = 0; this.lg = 1; } };
  }
  process(inputs, outputs) {
    const inp = inputs[0], out = outputs[0]; if (!out || !out.length) return true;
    const oL = out[0], oR = out[1] || out[0], n = oL.length;
    const iL = inp && inp[0] ? inp[0] : null, iR = inp && inp[1] ? inp[1] : iL;
    const s = this.s, sr = sampleRate;
    if (!iL) { oL.fill(0); if (oR !== oL) oR.fill(0); this.ms = 0; this.outMs = 0; this.post(-120); return true; }
    const aW = 1 - Math.exp(-1 / (Math.max(0.05, s.window) * sr));
    const aUp = 1 - Math.exp(-1 / (Math.max(0.1, s.speed) * sr)), aDown = 1 - Math.exp(-1 / (Math.max(0.05, s.speed / 3) * sr));
    const ceil = Math.pow(10, s.ceiling / 20), aAtt = 1 - Math.exp(-1 / (this.L / 5)), aRel = 1 - Math.exp(-1 / (0.12 * sr)), relEnv = Math.exp(-1 / (0.1 * sr));
    const aOut = 1 - Math.exp(-1 / (0.4 * sr));
    let minLg = 1;
    for (let i = 0; i < n; i++) {
      let xl = iL[i], xr = iR[i];
      // vangnet: NaN, ±Infinity of een absurde waarde zou de meting en de piekvolger voorgoed vergiftigen
      if (!(xl > -IN_MAX && xl < IN_MAX)) xl = xl !== xl ? 0 : xl > 0 ? IN_MAX : -IN_MAX;
      if (!(xr > -IN_MAX && xr < IN_MAX)) xr = xr !== xr ? 0 : xr > 0 ? IN_MAX : -IN_MAX;
      // 1. meten: gemiddeld vermogen van beide kanalen (ook in de stand Doorlaten, voor de meter)
      this.ms += ((xl * xl + xr * xr) * 0.5 - this.ms) * aW;
      if (!s.on) { oL[i] = xl; if (oR !== oL) oR[i] = xr; this.outMs += ((xl * xl + xr * xr) * 0.5 - this.outMs) * aOut; continue; }
      const lvl = 10 * Math.log10(this.ms + 1e-12);
      // 2. regelen: alleen boven de stiltedrempel; omlaag sneller dan omhoog
      if (lvl > s.gate) { const want = Math.max(-s.range, Math.min(s.range, s.target - lvl)); this.gDb += (want - this.gDb) * (want < this.gDb ? aDown : aUp); }
      const g = Math.pow(10, this.gDb / 20), yl = xl * g, yr = xr * g;
      // 3. limiter: piekvolger op het onvertraagde signaal, gain op het 5 ms vertraagde signaal
      const p = Math.max(Math.abs(yl), Math.abs(yr)); this.env = p > this.env ? p : this.env * relEnv;
      const wantL = this.env > ceil ? ceil / this.env : 1; this.lg += (wantL - this.lg) * (wantL < this.lg ? aAtt : aRel); if (this.lg < minLg) minLg = this.lg;
      const dl = this.bl[this.bi], dr = this.br[this.bi]; this.bl[this.bi] = yl; this.br[this.bi] = yr; this.bi = (this.bi + 1) % this.L;
      let ol = dl * this.lg, or = dr * this.lg;
      if (ol > ceil) ol = ceil; else if (ol < -ceil) ol = -ceil;   // vangnet
      if (or > ceil) or = ceil; else if (or < -ceil) or = -ceil;
      oL[i] = ol; if (oR !== oL) oR[i] = or;
      this.outMs += ((ol * ol + or * or) * 0.5 - this.outMs) * aOut;
    }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    if (!(this.ms >= 0 && this.ms < 1e6)) this.ms = 0;
    if (!(this.outMs >= 0 && this.outMs < 1e6)) this.outMs = 0;
    if (!(this.env >= 0 && this.env < 1e6)) this.env = 0;
    if (!(this.gDb > -100 && this.gDb < 100)) this.gDb = 0;
    if (!(this.lg > 0 && this.lg <= 1)) this.lg = 1;
    this.lim = Math.min(this.lim, minLg);
    this.post(10 * Math.log10(this.ms + 1e-12));
    return true;
  }
  post(inDb) { if ((this.n += 1) % 16) return; this.port.postMessage({ in: inDb, gain: this.s.on ? this.gDb : 0, out: 10 * Math.log10(this.outMs + 1e-12), lim: 20 * Math.log10(this.lim) }); this.lim = 1; }
}
registerProcessor('${WNAME}', Egaal);`;

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { mode: 'Stand', lvl: 'Regelen', thru: 'Doorlaten',
    gLevel: 'Niveau', gTiming: 'Timing', gLimits: 'Grenzen',
    target: 'Doelniveau', speed: 'Reactietijd', window: 'Meettijd', range: 'Bereik ±', gate: 'Stiltedrempel', ceiling: 'Plafond',
    b1: 'Huidig niveau = doel', b1t: 'Zet het doelniveau op wat er nu binnenkomt', b2: 'Regeling op 0',
    loading: 'Leveler laden…', failed: 'AudioWorklet niet beschikbaar: Leveler laat het geluid ongewijzigd door.',
    aria: 'Niveaumeter: in, uit en regeling', rIn: 'IN', rOut: 'UIT', rGain: 'REGEL', lim: 'limiter ', limIdle: 'limiter rust',
  },
  en: { mode: 'Mode', lvl: 'Leveling', thru: 'Pass through',
    gLevel: 'Level', gTiming: 'Timing', gLimits: 'Limits',
    target: 'Target', speed: 'Response', window: 'Window', range: 'Range ±', gate: 'Gate', ceiling: 'Ceiling',
    b1: 'Current level = target', b1t: 'Sets the target level to what is coming in now', b2: 'Reset gain',
    loading: 'Loading Leveler…', failed: 'AudioWorklet unavailable: Leveler passes the sound through unchanged.',
    aria: 'Level meter: in, out and gain', rIn: 'IN', rOut: 'OUT', rGain: 'GAIN', lim: 'limiter ', limIdle: 'limiter idle',
  },
};

// Opmaak voor de skin Compact: alleen als de host een draaiknop (data-pk-face) in de vakken zet; zonder skin is dit alles uit en ziet het apparaat er hetzelfde uit
const SKINCSS = `
.ui:has(.lv-knobs [data-pk-face]){display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}
.ui:has(.lv-knobs [data-pk-face])>.k:first-of-type{order:1;flex:0 0 150px;grid-template-columns:auto minmax(0,1fr)!important;gap:4px}
.ui:has(.lv-knobs [data-pk-face])>.lv-btns{order:2;flex:1 1 0;min-width:0;margin:0!important;gap:4px!important;flex-wrap:nowrap!important}
.ui:has(.lv-knobs [data-pk-face])>.lv-btns button{flex:1 1 0;min-width:0;font-size:8.5px;padding:4px 3px;letter-spacing:0;white-space:normal;line-height:1.1}
.ui:has(.lv-knobs [data-pk-face])>.lv-knobs{order:3;flex:1 1 100%;display:flex;gap:0;border:1px solid var(--line,#39434c);border-radius:4px;padding:4px 2px 3px}
.ui:has(.lv-knobs [data-pk-face])>[role=group]{order:4;flex:1 1 100%;min-height:0}
.ui:has(.lv-knobs [data-pk-face])>.note{order:5}
.ui:has(.lv-knobs [data-pk-face]) .lv-sec{display:contents}
.ui:has(.lv-knobs [data-pk-face]) .lv-knobs .k{display:grid!important;grid-template-columns:minmax(0,1fr)!important;justify-items:center;align-items:start;align-content:start;gap:0;min-width:0;flex:1 1 0}
.ui:has(.lv-knobs [data-pk-face]) .lv-knobs .k .kn{order:1;width:28px!important;height:28px!important;justify-self:center!important}
.ui:has(.lv-knobs [data-pk-face]) .lv-knobs .k output{order:2;font-size:8.5px;text-align:center;line-height:1.2;white-space:nowrap}
.ui:has(.lv-knobs [data-pk-face]) .lv-knobs .k label{order:3;font-size:8px;letter-spacing:-.02em;text-align:center;line-height:1.1;white-space:normal;overflow:visible;text-overflow:clip;max-width:100%;text-transform:none}
`;
const K = [   // id, tekstsleutel, [min, max, stap], standaard, weergave
  ['target', 'target', [-36, -6, 0.5], -18, v => v.toFixed(1) + ' dB'],
  ['speed', 'speed', [0.2, 20, 0.1], 3, v => v.toFixed(1) + ' s'],
  ['window', 'window', [0.1, 3, 0.05], 0.8, v => v.toFixed(2) + ' s'],
  ['range', 'range', [0, 24, 0.5], 12, v => v.toFixed(1) + ' dB'],
  ['gate', 'gate', [-80, -30, 1], -55, v => v.toFixed(0) + ' dB'],
  ['ceiling', 'ceiling', [-12, 0, 0.1], -1, v => v.toFixed(1) + ' dB'],
];
const GRP = { target: 'level', speed: 'timing', window: 'timing', range: 'limits', gate: 'limits', ceiling: 'limits' };   // sectie per regelaar (voor skins)
// stuurbaar: id -> [rol, bereik van de drift, logaritmisch]; alles standaard uit (niveau, tijden en drempels bewegen niet ongevraagd)
const MODP = { target: ['level', 0.05, false], speed: ['env', 0.08, true], window: ['env', 0.08, true], range: ['depth', 0.08, false], gate: ['level', 0.05, false], ceiling: ['level', 0.05, false] };
const DEF = () => ({ on: true, ...Object.fromEntries(K.map(k => [k[0], k[3]])) });
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id: 'nl.patchkamer.leveler',
  name: 'Leveler',
  version: '1.18.0',
  about: { nl: 'Houdt het gemiddelde volume gelijk: meet over de meettijd en regelt in de reactietijd omhoog of omlaag naar het doel (omlaag drie keer sneller), binnen het bereik. Onder de stiltedrempel blijft de regeling staan. De limiter erachter vangt pieken boven het plafond op (5 ms vertraging).', en: 'Keeps the average volume steady: it measures over the measure time and moves the gain up or down to the target within the response time (down three times faster), within the range. Below the silence threshold the gain stays where it is. The limiter behind it catches peaks above the ceiling (5 ms delay).' },
  kind: 'effect',
  category: 'mix',
  ui: { width: 420, minWidth: 300 },
  i18n: { en: { ports: { in: 'In', out: 'Out' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [], modOut: [] },

  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const S = DEF();
    const input = ctx.createGain(), out = ctx.createGain();
    input.connect(out);                                   // doorlaten tot de worklet er is (en als terugval)
    let node = null, dead = false, ui = {}, meter = { in: -120, gain: 0, out: -120, lim: 0 }, canvas = null, g2 = null, note = null, stopDraw = null, ready = false;
    let cw = 300, ro = null, col = null, colT = 0;
    let hm = null;   // host-meters { in, out } met hun markeringen en getallen; null = eigen canvas met alle rijen (oude host)
    const mod = {};
    const E = k => { const b = S[k], o = mod[k] || 0, r = K.find(x => x[0] === k)[2]; if (!o) return b; const mn = r[0], mx = r[1]; return MODP[k][2] ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    const send = () => { if (node) node.port.postMessage({ type: 'set', s: { ...S, ...Object.fromEntries(Object.keys(mod).map(k => [k, E(k)])) } }); };
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
      node.port.onmessage = e => { if (e.data && typeof e.data.in === 'number') meter = e.data; };
      send(); input.disconnect(); input.connect(node).connect(out); ready = true; paintNote();
    }).catch(() => { ready = false; paintNote(true); });

    function paintNote(failed) { if (!note) return; note.textContent = ready ? '' : failed ? T.failed : T.loading; }
    function paintAll() { K.forEach(([k]) => ui[k] && ui[k].set(S[k])); if (ui.on) ui.on.value = S.on ? '1' : '0'; }
    function readColors() {
      if (!canvas) return; const cs = getComputedStyle(canvas), v = (n, d) => cs.getPropertyValue(n).trim() || d; colT = performance.now();
      col = { bg: v('--well', '#0b171d'), fg: v('--well-fg', '#c7dbe0'), au: v('--audio', '#4fd1c5'), ev: v('--event', '#f4a261'), st: v('--stop', '#e4574a'), ln: v('--line', '#39434c') };
    }
    // meters: In, Regeling, Uit, met doellijn; kleuren uit de host (één keer per seconde opgevraagd)
    function draw() {
      if (dead || !canvas || !g2) return;
      drawHostMeters();
      if (!col || performance.now() - colT > 1000) readColors();
      const hostM = !!hm, w = Math.max(240, cw), h = hostM ? 38 : 74, dpr = Math.min(3, globalThis.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      const g = g2; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { bg, fg, au, ev, st, ln } = col;
      g.fillStyle = bg; g.fillRect(0, 0, w, h); g.font = '10px ui-monospace,monospace'; g.textBaseline = 'middle';
      const L = 46, R = w - 54, X = db => L + (R - L) * (clamp(db, -60, 0) + 60) / 60;
      const row = (y, label, db, c, txt) => { g.fillStyle = fg; g.fillText(label, 6, y + 6); g.fillStyle = ln; g.fillRect(L, y, R - L, 12); g.fillStyle = c; g.fillRect(L, y, Math.max(0, X(db) - L), 12); g.fillStyle = fg; g.fillText(txt, R + 6, y + 6); };
      if (!hostM) {
        row(6, T.rIn, meter.in, au, meter.in > -100 ? meter.in.toFixed(1) : '—');
        row(24, T.rOut, meter.out, au, meter.out > -100 ? meter.out.toFixed(1) : '—');
      }
      // regeling: balk vanuit het midden, ±bereik
      const y = hostM ? 6 : 44, mid = (L + R) / 2, span = (R - L) / 2, gr = E('range') > 0 ? clamp(meter.gain / E('range'), -1, 1) : 0;
      g.fillStyle = fg; g.fillText(T.rGain, 6, y + 6); g.fillStyle = ln; g.fillRect(L, y, R - L, 12); g.fillStyle = ev; g.fillRect(Math.min(mid, mid + gr * span), y, Math.abs(gr * span), 12);
      g.fillStyle = fg; g.fillRect(mid - 0.5, y - 2, 1, 16); g.fillText((meter.gain >= 0 ? '+' : '') + meter.gain.toFixed(1), R + 6, y + 6);
      // doellijn op IN/UIT (met een host-meter staat ze als streepje over de meter) en limiter-lampje
      if (!hostM) { g.fillStyle = fg; g.fillRect(X(E('target')) - 1, 3, 2, 36); }
      const ly = hostM ? 26 : 62, limOn = meter.lim < -0.3; g.fillStyle = limOn ? st : ln; g.fillRect(L, ly, 8, 8); g.fillStyle = fg; g.fillText(limOn ? T.lim + meter.lim.toFixed(1) + ' dB' : T.limIdle, L + 12, ly + 4);
    }
    // IN/UIT via de host: het niveau geven, het getal bijwerken en de doellijn zetten
    function drawHostMeters() {
      if (!hm) return;
      const tf = (clamp(E('target'), -60, 0) + 60) / 60;
      ['in', 'out'].forEach(k => {
        const m = hm[k], db = meter[k]; m.m.set(db);
        const t = db > -100 ? db.toFixed(1) : '—'; if (t !== m.txt) { m.txt = t; m.v.textContent = t; }
        const el = m.m.el, vis = el.dataset.face !== 'vu' && el.clientWidth > el.clientHeight, x = el.offsetLeft + 1 + (el.clientWidth - 2) * tf - 1, sig = vis ? Math.round(x * 2) : -1;
        if (sig !== m.sig) { m.sig = sig; m.t.style.display = vis ? 'block' : 'none'; if (vis) m.t.style.left = x.toFixed(1) + 'px'; }
      });
    }
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    const onSkin = () => { col = null; };

    const self = {
      inputs: { in: input }, outputs: { out },
      mount(el) {
        ui = {};
        { const st = document.createElement('style'); st.textContent = SKINCSS; el.appendChild(st); }
        ui.on = host.ui.select(el, T.mode, [['1', T.lvl], ['0', T.thru]], S.on ? '1' : '0', v => { S.on = v === '1'; send(); }, { id: 'on', group: 'mode' });
        const kbox = document.createElement('div'); kbox.className = 'lv-knobs'; el.appendChild(kbox);   // per groep een eigen vak (een skin kan er een kader om zetten)
        const secs = {};
        K.forEach(([k, tk, range, , fmt]) => { const g = GRP[k]; if (!secs[g]) { secs[g] = document.createElement('div'); secs[g].className = 'lv-sec'; kbox.appendChild(secs[g]); } ui[k] = host.ui.knob(secs[g], T[tk], range, S[k], fmt, v => { S[k] = v; send(); }, { id: k, group: g }); });
        const row = document.createElement('div'); row.className = 'lv-btns'; row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:6px 0';
        const b1 = document.createElement('button'); b1.type = 'button'; b1.textContent = T.b1; b1.title = T.b1t;
        b1.onclick = () => { if (meter.in > -80) { S.target = Math.round(clamp(meter.in, -36, -6) * 2) / 2; ui.target.set(S.target); send(); } };
        const b2 = document.createElement('button'); b2.type = 'button'; b2.textContent = T.b2; b2.onclick = () => { if (node) node.port.postMessage({ type: 'reset' }); };
        row.append(b1, b2); el.appendChild(row);
        canvas = document.createElement('canvas');
        let box = el;
        if (host.ui && typeof host.ui.meter === 'function') {   // IN en UIT door de host; de rest van de meter (REGEL en limiter) blijft canvas
          box = document.createElement('div'); box.style.cssText = 'border:1px solid var(--line,#39434c);border-radius:4px;background:var(--well,#0b171d);color:var(--well-fg,#c7dbe0);font:10px ui-monospace,monospace;padding-top:3px'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', T.aria); el.appendChild(box);
          hm = {};
          try {
            [['in', T.rIn], ['out', T.rOut]].forEach(([k, lab]) => {
              const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:0 6px;min-height:18px';
              const l = document.createElement('span'); l.textContent = lab; l.style.cssText = 'flex:none;width:34px';
              const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;flex:1 1 0;min-width:0;display:flex;align-items:center';
              const m = host.ui.meter(wrap, lab, { id: 'met.' + k, group: 'meters', unit: 'db', range: [-60, 0], hold: false, orientation: 'horizontal', width: 12 });
              const t = document.createElement('div'); t.style.cssText = 'position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--well-fg,#c7dbe0);pointer-events:none;display:none';
              const v = document.createElement('span'); v.style.cssText = 'flex:none;width:42px'; wrap.appendChild(t); row.append(l, wrap, v); box.appendChild(row);
              hm[k] = { m, t, v, txt: null, sig: null };
            });
          } catch (e) { hm = null; }
          if (!hm) { box.remove(); box = el; }
        }
        canvas.style.cssText = hm ? 'display:block;width:100%;height:38px' : 'display:block;width:100%;height:74px;border:1px solid var(--line,#39434c);border-radius:4px;background:var(--well,#0b171d)';
        if (!hm) canvas.setAttribute('aria-label', T.aria);
        box.appendChild(canvas); g2 = canvas.getContext('2d'); cw = canvas.clientWidth || 300; col = null;
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) cw = w; }); ro.observe(canvas); }
        if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
        paintAll(); stopLoop(); stopDraw = tekenLus(host, self, draw, 30);
      },
      unmount() { stopLoop(); if (hm) { ['in', 'out'].forEach(k => { try { hm[k].m.destroy(); } catch (e) {} }); hm = null; } if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); canvas = null; g2 = null; note = null; ui = {}; },
      params() { return K.map(([id, tk, range]) => ({ id, name: T[tk], lane: GRP[id], laneName: T['g' + GRP[id][0].toUpperCase() + GRP[id].slice(1)], min: range[0], max: range[1], role: MODP[id][0], scale: MODP[id][2] ? 'log' : 'lin', drift: MODP[id][1], on: false })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODP, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); send(); },
      getState() { return { ...S }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {}; const d = DEF();
        S.on = typeof s.on === 'boolean' ? s.on : d.on;
        K.forEach(([k, , [mn, mx]]) => { S[k] = typeof s[k] === 'number' && isFinite(s[k]) ? clamp(s[k], mn, mx) : d[k]; });
        send(); paintAll();
      },
      destroy() {
        if (dead) return; dead = true; stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin);
        if (hm) { ['in', 'out'].forEach(k => { try { hm[k].m.destroy(); } catch (e) {} }); hm = null; }
        try { if (node) { node.port.onmessage = null; node.disconnect(); } input.disconnect(); out.disconnect(); } catch (e) {}
      },
    };
    return self;
  },
};
