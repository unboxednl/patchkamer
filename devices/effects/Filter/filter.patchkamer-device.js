// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — De kaart kan niet smaller dan 280 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11: eigen map en bestandsnaam zonder versienummer. Tweetalig (host.lang, poortnamen per taal in i18n).
//   setState volgt §13: onbekende velden genegeerd, ongeldige waarden op de standaard, getallen afgekapt op hun bereik.
//   Bewaker: in de worklet wordt de ingang begrensd (±16) en wordt NaN 0, en de toestand van ladder en kamfilter wordt per blok op eindigheid
//   gecontroleerd; bij de gewone filters kijkt een meter om de 50 ms naar de filteruitvoer en vervangt hij een ontspoord filter.
//   Zo vergiftigt één foutieve sample het apparaat niet voor altijd. Normaal geluid is bit-identiek aan 1.8.0.
// Filter met tien typen: LP/HP 12 en 24 dB, band, notch (standaard Web Audio), vowel (klinkers A-E-I-O-U met
// drie formanten), en als AudioWorklet een 4-polige ladder met verzadiging en twee kamfilters (+ en −).
// Drive vooraf, mix, uitgangsniveau. Cutoff is snel stuurbaar (sample-nauwkeurig) voor alle typen.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TYPES = [['lp12', 'LP 12 dB'], ['lp24', 'LP 24 dB'], ['hp12', 'HP 12 dB'], ['hp24', 'HP 24 dB'], ['bp', 'Band'], ['notch', 'Notch'], ['vowel', 'Vocaal (klinkers)'],
  ['ladder', 'Ladder 24 dB (worklet)'], ['combp', 'Kam + (worklet)'], ['combm', 'Kam − (worklet)']];
const WTYPES = { ladder: 0, combp: 1, combm: 2 };
const VOWELS = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240]];   // A E I O U
const MODP = [['cut', 'Cutoff', 20, 20000, true, 'filter', 0.08, true, true], ['res', 'Resonantie', 0, 1, false, 'res', 0.08, true], ['drive', 'Drive', 0, 1, false, 'drive', 0.1, false],
  ['vowel', 'Klinker', 0, 4, false, 'vowel', 0.15, false], ['mix', 'Mix', 0, 1, false, 'send', 0.06, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const OCT = Math.log2(20000 / 20);
const DEF = () => ({ type: 'lp24', cut: 1200, res: 0.3, drive: 0, vowel: 0, mix: 1, gain: 1 });
const EN = {
  'Vocaal (klinkers)': 'Vowel', 'Kam + (worklet)': 'Comb + (worklet)', 'Kam − (worklet)': 'Comb − (worklet)',
  'Resonantie': 'Resonance', 'Klinker': 'Vowel', 'Niveau': 'Level',
  'AudioWorklet actief.': 'AudioWorklet active.', 'AudioWorklet laden…': 'Loading AudioWorklet…',
  'AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.': 'AudioWorklet unavailable: the sound passes through unprocessed.',
};
const WNAME = 'nl-patchkamer-filter-1-11-0';
const WORKLET = `
const IN_MAX = 16;
class PkFilter extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    { name: 'type', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
    { name: 'cut', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
    { name: 'oct', defaultValue: 0, minValue: -12, maxValue: 12, automationRate: 'a-rate' },
    { name: 'res', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'drive', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' } ]; }
  constructor() { super(); this.s = [new Float64Array(4), new Float64Array(4)]; this.y4 = [0, 0]; this.n = 4096; this.buf = [new Float32Array(4096), new Float32Array(4096)]; this.w = 0; this.lp = [0, 0]; }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], len = out[0].length, sr = sampleRate, cutA = P.cut, octA = P.oct;
    let type = Math.round(P.type[0]), res = P.res[0], dr = P.drive[0];
    if (!(type >= 0 && type <= 2)) type = 0;
    if (!(res >= 0 && res <= 1)) res = 0.3;
    if (!(dr >= 0 && dr <= 1)) dr = 0;
    const drv = 1 + dr * 8;
    const nc = out.length;
    for (let i = 0; i < len; i++) {   // monster voor monster, kanalen binnenin: de kamvertraging deelt één schrijfpositie
      let fc = Math.min(sr * 0.45, Math.max(20, (cutA.length > 1 ? cutA[i] : cutA[0]) * Math.pow(2, octA.length > 1 ? octA[i] : octA[0])));
      if (!(fc >= 20)) fc = 20;
      const g = Math.tan(Math.PI * fc / sr), G = g / (1 + g), k = res * 4.2;
      const d = Math.min(this.n - 2, sr / Math.min(fc, 8000)), fb = (type === 1 ? 1 : -1) * Math.min(0.985, res * 0.985);
      for (let c = 0; c < nc; c++) {
        const x = inp.length ? (inp[c] || inp[0]) : null, s = this.s[c], b = this.buf[c];
        let xi = x ? x[i] : 0;
        // vangnet: NaN, ±Infinity of een absurde waarde zou de toestand en de kamvertraging voorgoed vergiftigen
        if (!(xi > -IN_MAX && xi < IN_MAX)) xi = xi !== xi ? 0 : xi > 0 ? IN_MAX : -IN_MAX;
        if (type === 0) {   // ladder: vier TPT-éénpolers, terugkoppeling met tanh
          let u = Math.tanh(drv * xi - k * this.y4[c]);
          for (let j = 0; j < 4; j++) { const v = (u - s[j]) * G, y = v + s[j]; s[j] = y + v; u = y; }
          this.y4[c] = u; out[c][i] = u * (1 + k * 0.45) / Math.sqrt(drv);
        } else {   // kam: vertraging = 1/cutoff, terugkoppeling = resonantie, demping in de lus
          let r = this.w - d; while (r < 0) r += this.n; const i0 = Math.floor(r), f = r - i0;
          const y = b[i0 % this.n] * (1 - f) + b[(i0 + 1) % this.n] * f;
          this.lp[c] += 0.6 * (y - this.lp[c]);
          b[this.w] = Math.tanh(drv * xi) / Math.sqrt(drv) + fb * this.lp[c];
          out[c][i] = b[this.w] * 0.5;
        }
      }
      this.w = (this.w + 1) % this.n;
    }
    // bewaker: een ontspoorde toestand herstelt zichzelf in plaats van het geluid voorgoed te stoppen
    for (let c = 0; c < 2; c++) {
      let ok = this.y4[c] > -100 && this.y4[c] < 100 && this.lp[c] > -100 && this.lp[c] < 100;
      for (let j = 0; ok && j < 4; j++) ok = this.s[c][j] > -100 && this.s[c][j] < 100;
      if (!ok) { this.s[c].fill(0); this.y4[c] = 0; this.lp[c] = 0; this.buf[c].fill(0); }
    }
    return true;
  }
}
registerProcessor('${WNAME}', PkFilter);
`;

function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  const ranges = { ...Object.fromEntries(MODP.map(p => [p[0], [p[2], p[3]]])), gain: [0, 2] };
  Object.keys(d).forEach(k => {
    const v = s[k];
    S[k] = typeof d[k] === 'number' ? (typeof v === 'number' && Number.isFinite(v) ? clamp(v, ...ranges[k]) : d[k]) : (typeof v === typeof d[k] ? v : d[k]);
  });
  if (!TYPES.some(x => x[0] === S.type)) S.type = d.type;
}

export default {
  id: 'nl.patchkamer.filter',
  name: 'Filter',
  version: '1.15.0',
  kind: 'effect',
  category: 'effect',
  ui: { width: 320, minWidth: 280 },
  i18n: { en: { ports: { in: 'In', out: 'Out', mod: 'Mod' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const S = DEF(), mod = {}; let dead = false, ui = {}, wnode = null, wstate = 'loading', note = null;
    const inG = ctx.createGain(), out = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(), pre = ctx.createWaveShaper(); pre.oversample = '2x';
    inG.connect(dry).connect(out); wet.connect(out);
    // snelle cutoff-bus: signaal −1..1 × hele bereik in octaven; naar biquads als cents, naar de worklet als octaven
    const cutBus = ctx.createGain(); cutBus.gain.value = OCT; const toCents = ctx.createGain(); toCents.gain.value = 1200; cutBus.connect(toCents);
    const ctlCut = typeof ctx.createConstantSource === 'function' ? ctx.createConstantSource() : null; if (ctlCut) { ctlCut.offset.value = 0; try { ctlCut.start(); } catch (e) { } ctlCut.connect(cutBus); }
    let fsum = null;
    const bq = [], formants = [];
    function mkFilters() {   // maakt de gewone filters (opnieuw) aan; oude worden losgekoppeld
      bq.forEach(f => { try { toCents.disconnect(f.detune); f.disconnect(); } catch (e) { } });
      formants.forEach(x => { try { toCents.disconnect(x.f.detune); x.f.disconnect(); x.g.disconnect(); } catch (e) { } });
      bq.length = 0; formants.length = 0;
      for (let i = 0; i < 2; i++) { const f = ctx.createBiquadFilter(); toCents.connect(f.detune); bq.push(f); }
      for (let i = 0; i < 3; i++) { const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; toCents.connect(f.detune); f.connect(g); formants.push({ f, g }); }
      if (!fsum) fsum = ctx.createGain();
      formants.forEach(x => x.g.connect(fsum));
    }
    mkFilters();
    const mon = ctx.createAnalyser(); mon.fftSize = 2048;   // meter voor de bewaker: kijkt naar de uitvoer van de gewone filters
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o || k === 'cut') return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    let curveFor = -1;
    function paintNote() { if (note) note.textContent = S.type in WTYPES ? (wnode ? tx('AudioWorklet actief.') : wstate === 'failed' ? tx('AudioWorklet niet beschikbaar: het geluid gaat onbewerkt door.') : tx('AudioWorklet laden…')) : ''; }
    function wire() {
      [pre, ...bq, fsum, ...formants.map(x => x.f)].forEach(n => { try { n.disconnect(); } catch (e) { } }); formants.forEach(x => x.f.connect(x.g)); try { inG.disconnect(pre); } catch (e) { }
      if (wnode) { try { inG.disconnect(wnode); wnode.disconnect(); } catch (e) { } }
      const t = S.type;
      if (t in WTYPES) { if (wnode) { inG.connect(wnode).connect(wet); } }
      else {
        inG.connect(pre);
        if (t === 'vowel') { formants.forEach(x => pre.connect(x.f)); fsum.connect(wet); fsum.connect(mon); }
        else {
          const ty = { lp12: 'lowpass', lp24: 'lowpass', hp12: 'highpass', hp24: 'highpass', bp: 'bandpass', notch: 'notch' }[t]; bq.forEach(f => f.type = ty);
          pre.connect(bq[0]); if (t === 'lp24' || t === 'hp24') { bq[0].connect(bq[1]).connect(wet); bq[1].connect(mon); } else { bq[0].connect(wet); bq[0].connect(mon); }
        }
      }
      paintNote();
      apply();
    }
    function apply() {
      const t = ctx.currentTime, r = 0.03, cut = S.cut, res = E('res'), drv = E('drive'), mx = E('mix');
      const q = 0.5 + res * res * 19;
      if (S.type === 'lp24' || S.type === 'hp24') { bq[0].Q.setTargetAtTime(0.707, t, r); bq[1].Q.setTargetAtTime(q, t, r); } else { bq[0].Q.setTargetAtTime(S.type === 'notch' ? 0.5 + res * 8 : q, t, r); }
      bq.forEach(f => f.frequency.setTargetAtTime(cut, t, r));
      const v = E('vowel'), i0 = Math.min(3, Math.floor(v)), fr = v - i0, sc = Math.sqrt(cut / 1000);
      formants.forEach((x, k) => { const hz = (VOWELS[i0][k] * (1 - fr) + VOWELS[i0 + 1][k] * fr) * sc; x.f.frequency.setTargetAtTime(clamp(hz, 60, 16000), t, r); x.f.Q.setTargetAtTime(4 + res * 16, t, r); x.g.gain.setTargetAtTime([1, 0.6, 0.35][k] * 2.2, t, r); });
      const qd = Math.round(drv * 50) / 50; if (qd !== curveFor) { curveFor = qd; if (qd > 0) { const n = 1024, c = new Float32Array(n), k = 1 + qd * 8; for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } pre.curve = c; } else pre.curve = null; }
      if (wnode) { const p = wnode.parameters; p.get('type').setValueAtTime(WTYPES[S.type] || 0, t); p.get('cut').setTargetAtTime(cut, t, r); p.get('res').setTargetAtTime(res, t, r); p.get('drive').setTargetAtTime(drv, t, r); }
      wet.gain.setTargetAtTime(S.type in WTYPES && !wnode ? 0 : mx * S.gain, t, r); dry.gain.setTargetAtTime(S.type in WTYPES && !wnode ? 1 : 1 - mx, t, r);
    }
    const loader = typeof AudioWorkletNode === 'function' && host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('host.loadWorklet ontbreekt'));
    loader.then(() => { if (dead || typeof AudioWorkletNode === 'undefined') { wstate = 'failed'; return; } wnode = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); cutBus.connect(wnode.parameters.get('oct')); wstate = 'ok'; wire(); })
      .catch(() => { if (dead) return; wstate = 'failed'; wire(); });
    wire();

    // bewaker: een ontspoord gewoon filter geeft NaN of een enorme waarde en herstelt nooit meer; dan vervangen we de filters
    const chk = new Float32Array(mon.fftSize);
    function guard() {
      if (dead) return; mon.getFloatTimeDomainData(chk);
      for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 1e4)) { mkFilters(); wire(); return; }   // normaal hooguit enkele tientallen, ook met veel resonantie
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    const pct = v => Math.round(v * 100) + '%';
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.style.gridTemplateColumns = 'minmax(0, 1fr)';   // lange keuzetekst mag de kaart niet breder maken
        ui.type = host.ui.select(el, 'Type', TYPES.map(([v, l]) => [v, tx(l)]), S.type, v => { S.type = v; wire(); }, { id: 'type', role: 'select', group: 'filter' });
        ui.cut = host.ui.knob(el, 'Cutoff', [0, 1, 0.001], Math.log(S.cut / 20) / Math.log(1000), x => Math.round(20 * Math.pow(1000, x)) + ' Hz', x => { S.cut = 20 * Math.pow(1000, x); apply(); }, { id: 'cut', role: 'param', group: 'filter' });
        ui.res = host.ui.knob(el, tx('Resonantie'), [0, 1, 0.01], S.res, pct, v => { S.res = v; apply(); }, { id: 'res', role: 'param', group: 'filter' });
        ui.drive = host.ui.knob(el, 'Drive', [0, 1, 0.01], S.drive, pct, v => { S.drive = v; apply(); }, { id: 'drive', role: 'param', group: 'drive' });
        ui.vowel = host.ui.knob(el, tx('Klinker'), [0, 4, 0.01], S.vowel, v => 'AEIOU'[Math.round(v)] + (Math.abs(v - Math.round(v)) > 0.05 ? '~' : ''), v => { S.vowel = v; apply(); }, { id: 'vowel', role: 'param', group: 'filter' });
        ui.mix = host.ui.knob(el, 'Mix', [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); }, { id: 'mix', role: 'param', group: 'mix' });
        ui.gain = host.ui.knob(el, tx('Niveau'), [0, 2, 0.01], S.gain, pct, v => { S.gain = v; apply(); }, { id: 'gain', role: 'param', group: 'out' });
        note = document.createElement('div'); note.className = 'note'; el.appendChild(note); paintNote();
      },
      unmount() { note = null; ui = {}; },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on, fast]) => ({ id, name: tx(name), lane: 'filter', laneName: 'Filter', min, max, role, scale: log ? 'log' : 'lin', drift, on, fast: !!fast })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); if (ctlCut) ctlCut.offset.setTargetAtTime(mod.cut || 0, ctx.currentTime, 0.03); apply(); },
      modInput(id) { return id === 'cut' ? cutBus : null; },
      getState() { return { ...S }; },
      setState(s) {
        const ty = S.type; restoreValues(S, s);
        if (S.type !== ty) wire(); else apply();
        if (ui.type) { ui.type.value = S.type; ui.cut.set(Math.log(S.cut / 20) / Math.log(1000)); ['res', 'drive', 'vowel', 'mix', 'gain'].forEach(k => ui[k].set(S[k])); }
      },
      destroy() {
        if (dead) return; dead = true; if (guardT) clearInterval(guardT); if (ctlCut) try { ctlCut.stop(); } catch { }
        [inG, out, dry, wet, pre, cutBus, toCents, ctlCut, mon, fsum, ...bq, ...formants.flatMap(x => [x.f, x.g]), wnode].forEach(n => { if (n) try { n.disconnect(); } catch { } });
      },
    };
  }
};
