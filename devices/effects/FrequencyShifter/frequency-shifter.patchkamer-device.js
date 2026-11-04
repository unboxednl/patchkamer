// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — De kaart kan niet meer smaller dan 380 px (minWidth): de titelbalk met versie en de keuzelijsten werden afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11: eigen map en bestandsnaam zonder versienummer. Tweetalig (host.lang, poortnamen per taal in i18n).
//   setState volgt §13: onbekende velden genegeerd, ongeldige waarden op de standaard, getallen afgekapt op hun bereik.
//   Bewaker: de ingang wordt begrensd (±16) en NaN wordt 0, de terugkoppeling en de fase worden per blok op eindigheid gecontroleerd en bij
//   een ontsporing teruggezet, zodat één foutieve sample het apparaat niet voor altijd vergiftigt. Normaal geluid is bit-identiek aan 1.8.0.
// Frequency Shifter: verschuift alle frequenties een vast aantal Hz omhoog of omlaag (geen toonhoogte, dus niet harmonisch): van zachte
// zweving tot metalige vervreemding. AudioWorklet met een eigen Hilbert-filter (127 tikken, Blackman-venster),
// stereo (rechts kan de andere kant op), terugkoppeling voor spiraal-effecten. Stuurbaar; verschuiving snel stuurbaar.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MODP = [['shift', 'Shift', -1, 1, false, 'shift', 0.03, true, true], ['fb', 'Feedback', 0, 0.95, false, 'feedback', 0.08, false], ['stereo', 'Stereo', 0, 1, false, 'width', 0.1, false],
  ['mix', 'Mix', 0, 1, false, 'send', 0.06, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ shift: 0.05, range: 200, fb: 0, stereo: 0, mix: 1 });
const RANGES = [20, 200, 2000];
const EN = {
  'Bereik': 'Range', '±20 Hz (zweving)': '±20 Hz (beating)', '±2000 Hz (vervreemding)': '±2000 Hz (inharmonic)',
  'rechts omgekeerd': 'right reversed',
  'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.': 'AudioWorklet unavailable: the sound passes through unprocessed.',
};
const WNAME = 'nl-patchkamer-freqshift-1-11-0';
const WORKLET = `
const N = 127, M = 63, H = new Float32Array(N), IN_MAX = 16, Y_MAX = 1e4;
for (let n = 0; n < N; n++) { const k = n - M; const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (N - 1)); H[n] = k % 2 ? (2 / (Math.PI * k)) * w : 0; }
class PkShift extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    { name: 'hz', defaultValue: 10, minValue: -5000, maxValue: 5000, automationRate: 'a-rate' },
    { name: 'fb', defaultValue: 0, minValue: 0, maxValue: 0.97, automationRate: 'k-rate' },
    { name: 'stereo', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' } ]; }
  constructor() { super(); this.x = [new Float32Array(256), new Float32Array(256)]; this.w = 0; this.ph = [0, 0]; this.y = [0, 0]; }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], len = out[0].length, sr = sampleRate, hzA = P.hz;
    let fb = P.fb[0], st = P.stereo[0], bad = false;
    if (!(fb >= 0 && fb <= 0.97)) fb = 0;
    if (!(st >= 0 && st <= 1)) st = 0;
    for (let i = 0; i < len; i++) {
      let hz = hzA.length > 1 ? hzA[i] : hzA[0];
      if (!(hz > -5000 && hz < 5000)) hz = hz !== hz ? 0 : hz > 0 ? 5000 : -5000;
      const w = this.w;
      for (let c = 0; c < out.length; c++) {
        const xb = this.x[c];
        let xin = inp.length ? (inp[c] || inp[0])[i] : 0;
        // vangnet: NaN, ±Infinity of een absurde waarde zou de terugkoppeling en de vertraglijn voorgoed vergiftigen
        if (!(xin > -IN_MAX && xin < IN_MAX)) xin = xin !== xin ? 0 : xin > 0 ? IN_MAX : -IN_MAX;
        xb[w] = xin + this.y[c] * fb;
        let q = 0; for (let n = 0; n < N; n += 2) q += H[n] * xb[(w - n + 256) & 255];
        const re = xb[(w - M + 256) & 255];
        const f = c === 0 ? hz : hz * (1 - 2 * st); this.ph[c] += f / sr; this.ph[c] -= Math.floor(this.ph[c]);
        const a = 2 * Math.PI * this.ph[c];
        let y = re * Math.cos(a) - q * Math.sin(a);
        if (!(y > -Y_MAX && y < Y_MAX)) { y = 0; bad = true; }
        this.y[c] = y; out[c][i] = y;
      }
      this.w = (w + 1) & 255;
    }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    if (bad || !(Number.isFinite(this.ph[0]) && Number.isFinite(this.ph[1]))) { this.x[0].fill(0); this.x[1].fill(0); this.y[0] = 0; this.y[1] = 0; this.ph[0] = 0; this.ph[1] = 0; }
    return true;
  }
}
registerProcessor('${WNAME}', PkShift);
`;

function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  Object.keys(d).forEach(k => {
    const v = s[k], m = MODBY[k];
    S[k] = typeof v === 'number' && Number.isFinite(v) ? (m ? clamp(v, m[2], m[3]) : v) : d[k];
  });
  if (!RANGES.includes(S.range)) S.range = d.range;
}

export default {
  id: 'nl.patchkamer.freqshift',
  name: 'Frequency Shifter',
  version: '1.11.1',
  kind: 'effect',
  category: 'effect',
  ui: { width: 380, minWidth: 380 },   // de titel met versie heeft ruim 360 px nodig
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const S = DEF(), mod = {}; let dead = false, ui = {}, node = null, note = null, failed = false;
    const inG = ctx.createGain(), out = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(); inG.connect(dry).connect(out); wet.connect(out);
    const dly = ctx.createDelay(0.01); dly.delayTime.value = 63 / (ctx.sampleRate || 48000); inG.disconnect(dry); inG.connect(dly).connect(dry);   // droog net zo laat als nat (Hilbert-vertraging)
    const shBus = ctx.createGain(); shBus.gain.value = S.range;   // snelle sturing: −1..1 × bereik in Hz
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    const curve = v => Math.sign(v) * v * v;   // fijn rond 0, grof aan de randen
    function paintNote() { if (note) note.textContent = node ? '' : failed ? tx('AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.') : tx('AudioWorklet laden…'); }
    function apply() { const t = ctx.currentTime, r = 0.03, mx = E('mix'); wet.gain.setTargetAtTime((node ? mx : 0), t, r); dry.gain.setTargetAtTime(node ? 1 - mx : 1, t, r); shBus.gain.setTargetAtTime(S.range, t, r); if (!node) return;
      const P = node.parameters; P.get('hz').setTargetAtTime(curve(E('shift')) * S.range, t, r); P.get('fb').setTargetAtTime(E('fb'), t, r); P.get('stereo').setTargetAtTime(E('stereo'), t, r); }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead) return; if (typeof AudioWorkletNode === 'undefined') throw new Error('geen AudioWorklet'); node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      inG.connect(node).connect(wet); shBus.connect(node.parameters.get('hz')); apply(); paintNote(); })
      .catch(() => { if (dead) return; failed = true; apply(); paintNote(); });
    apply();
    const pct = v => Math.round(v * 100) + '%';
    function paint() { if (!ui.shift) return; ui.range.value = S.range; ['shift', 'fb', 'stereo', 'mix'].forEach(k => ui[k].set(S[k])); }
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'minmax(0, 1fr)';   // lange keuzetekst mag de kaart niet breder maken
        ui.range = host.ui.select(el, tx('Bereik'), [[20, tx('±20 Hz (zweving)')], [200, '±200 Hz'], [2000, tx('±2000 Hz (vervreemding)')]], S.range, v => { S.range = +v; apply(); paint(); });
        ui.shift = host.ui.knob(el, tx('Shift'), [-1, 1, 0.001], S.shift, v => { const hz = curve(v) * S.range; return (hz > 0 ? '+' : '') + (Math.abs(hz) < 10 ? hz.toFixed(2) : Math.round(hz)) + 'Hz'; }, v => { S.shift = v; apply(); });
        ui.fb = host.ui.knob(el, tx('Feedback'), [0, 0.95, 0.01], S.fb, pct, v => { S.fb = v; apply(); });
        ui.stereo = host.ui.knob(el, 'Stereo', [0, 1, 0.01], S.stereo, v => v > 0.5 ? tx('rechts omgekeerd') : pct(v), v => { S.stereo = v; apply(); });
        ui.mix = host.ui.knob(el, 'Mix', [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); });
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
      },
      unmount() { note = null; ui = {}; },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on, fast]) => ({ id, name: tx(name), lane: 'shift', laneName: 'Frequency Shifter', min, max, role, scale: 'lin', drift, on, fast: !!fast })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      modInput(id) { return id === 'shift' ? shBus : null; },
      getState() { return { ...S }; },
      setState(s) { restoreValues(S, s); apply(); paint(); },
      destroy() { if (dead) return; dead = true; [inG, out, dry, wet, dly, shBus, node].forEach(n => { if (n) try { n.disconnect(); } catch { } }); },
    };
  }
};
