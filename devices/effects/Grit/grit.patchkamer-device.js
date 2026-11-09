// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.16.0 — Uitleg naar about (menu Over Grit); de UI toont geen uitlegtekst meer.
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — De kaart kan niet smaller dan 280 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Grit en nieuwe id nl.patchkamer.grit (voorheen Roest, nl.patchkamer.roest); presets en songs uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang, poortnamen per taal in i18n), setState kapt getallen af op hun bereik en negeert onbekende velden, de saturatie volgt host.audio.oversample.
//          Bewaker: een kleine worklet begrenst de ingang (±16 = +24 dB) en zet NaN op 0, en een meter controleert om de 50 ms of het filter niet-eindige waarden geeft en vervangt het dan.
//          Normaal geluid is bit-identiek aan de vorige versie.
// Grit: drive (saturatie) in een resonant laagdoorlaatfilter met een LFO op de cutoff.
// Zonder AudioWorklet werkt Grit nog steeds; alleen de ingangsbeveiliging is dan niet actief (de meter blijft).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// id, naam per taal, min, max, log, rol, bereik, aan
const MODP = [['drive', 'Drive', 'Drive', 0, 1, false, 'drive', 0.12, true], ['cut', 'Cutoff', 'Cutoff', 100, 16000, true, 'filter', 0.08, true], ['res', 'Reso', 'Reso', 0.3, 18, false, 'res', 0.10, false],
  ['rate', 'LFO', 'LFO', 0.02, 8, true, 'rate', 0.12, false], ['depth', 'Diepte', 'Depth', 0, 1, false, 'depth', 0.12, false], ['lvl', 'Niveau', 'Level', 0, 1, false, 'level', 0.06, false]];
const FMT = { drive: v => Math.round(v * 100) + '%', cut: v => Math.round(v) + ' Hz', res: v => v.toFixed(1), rate: v => v.toFixed(2) + ' Hz', depth: v => Math.round(v * 100) + '%', lvl: v => Math.round(v * 100) + '%' };
const STEP = { drive: 0.01, cut: 10, res: 0.1, rate: 0.01, depth: 0.01, lvl: 0.01 };
const GRP = { drive: 'drive', cut: 'filter', res: 'filter', rate: 'mod', depth: 'mod', lvl: 'out' };   // sectie per regelaar (voor skins)

// Ingangsbeveiliging: NaN wordt 0, alles boven ±16 (+24 dB) wordt begrensd. Een filter achter een foutieve waarde blijft anders voorgoed NaN geven.
const WNAME = 'nl-patchkamer-grit-1-11-0';
const WORKLET = `
const IN_MAX = 16;
class GritGuard extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const a = inputs[0], b = outputs[0];
    for (let c = 0; c < b.length; c++) { const x = a[c]; if (!x) continue; const y = b[c];
      for (let n = 0; n < x.length; n++) { const v = x[n]; y[n] = (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX); } }
    return true;
  }
}
registerProcessor('${WNAME}', GritGuard);`;

export default {
  id: 'nl.patchkamer.grit', name: 'Grit', version: '1.16.0', category: 'effect', kind: 'effect',
  about: { nl: 'Drive (saturatie) in een resonant laagdoorlaatfilter met een LFO op de cutoff.\n\nCC-ingang: {type:"cc", id:"cutoff", value:0..1}.', en: 'Drive (saturation) into a resonant low-pass filter with an LFO on the cutoff.\n\nCC input: {type:"cc", id:"cutoff", value:0..1}.' },
  i18n: { en: { ports: { in: 'In', out: 'Out' } } },
  ui: { width: 300, minWidth: 280 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [{ id: 'cc', name: 'CC' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', NI = nl ? 1 : 2;
    const input = ctx.createGain(), inG = ctx.createGain(), pre = ctx.createGain(), sh = ctx.createWaveShaper(), out = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(), probe = ctx.createAnalyser();
    let f = ctx.createBiquadFilter();
    const os = host && host.audio && host.audio.oversample;
    sh.oversample = os === 'none' || os === '4x' ? os : '2x'; f.type = 'lowpass'; lfo.frequency.value = 0.2; lg.gain.value = 0; lfo.connect(lg).connect(f.frequency); lfo.start();
    input.connect(inG); inG.connect(pre).connect(sh).connect(f).connect(out); f.connect(probe); probe.fftSize = 4096;
    const state = { drive: 0.3, cut: 4000, res: 1, rate: 0.2, depth: 0, lvl: 0.8 };
    const defaults = { ...state }; let dead = false;
    const ui = {};
    const mod = {}, E = k => { const m = MODP.find(x => x[0] === k), b = state[k], o = mod[k] || 0; if (!o) return b; return m[5] ? clamp(b * Math.pow(m[4] / m[3], o), m[3], m[4]) : clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    let lastDrv = -1;
    const apply = () => { const t = ctx.currentTime, r = 0.04, drv = E('drive'), cut = E('cut'), q = Math.round(drv * 200) / 200; if (q !== lastDrv) { sh.curve = host.ui.curve(q); lastDrv = q; }
      pre.gain.setTargetAtTime(1 + drv * 2, t, r); f.frequency.setTargetAtTime(cut, t, r); f.Q.setTargetAtTime(E('res'), t, r); lfo.frequency.setTargetAtTime(E('rate'), t, r); lg.gain.setTargetAtTime(E('depth') * cut * 0.9, t, r); out.gain.setTargetAtTime(E('lvl') / (1 + drv), t, r); };
    apply();
    let guard = null;
    // bewaker 1: de ingangsbeveiliging (worklet); zonder AudioWorklet blijft de ingang direct verbonden
    if (host && typeof host.loadWorklet === 'function') host.loadWorklet(WNAME, WORKLET).then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') return;
      const g = new AudioWorkletNode(ctx, WNAME); guard = g; input.disconnect(inG); input.connect(g).connect(inG);
    }).catch(() => {});
    // bewaker 2: een ontspoord filter (NaN, Infinity, absurd groot) wordt vervangen door een nieuw filter met dezelfde instellingen
    function replaceFilter() {
      const nf = ctx.createBiquadFilter(); nf.type = 'lowpass';
      try { lfo.disconnect(lg); lg.disconnect(); sh.disconnect(); f.disconnect(); } catch { }
      f = nf; lfo.connect(lg).connect(f.frequency); sh.connect(f).connect(out); f.connect(probe); lastDrv = -1; apply();
    }
    const buf = new Float32Array(probe.fftSize);
    const watch = () => { if (dead) return; probe.getFloatTimeDomainData(buf); for (let i = 0; i < buf.length; i++) { const v = buf[i]; if (!(v > -1e4 && v < 1e4)) { replaceFilter(); return; } } };
    const timer = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext ? 0 : setInterval(watch, 50);
    return {
      inputs: { in: input }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        for (const m of MODP) { const k = m[0]; ui[k] = host.ui.knob(el, m[NI], [m[3], m[4], STEP[k]], state[k], FMT[k], v => { state[k] = v; apply(); }, { default: defaults[k], id: k, group: GRP[k] }); }
      },
      onEvent(port, ev) { if (port === 'cc' && ev && Number.isFinite(ev.value) && ev.type === 'cc' && ev.id === 'cutoff') { const t = Number.isFinite(ev.time) && ev.time > 0 ? ev.time : ctx.currentTime; f.frequency.setTargetAtTime(100 * Math.pow(160, clamp(ev.value, 0, 1)), t, 0.02); } },
      params() { return MODP.map(m => ({ id: m[0], name: m[NI], lane: 'grit', laneName: 'Grit', min: m[3], max: m[4], role: m[6], scale: m[5] ? 'log' : 'lin', drift: m[7], on: m[8] })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODP.some(x => x[0] === k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...state }; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; for (const m of MODP) { const k = m[0]; state[k] = typeof s[k] === 'number' && Number.isFinite(s[k]) ? clamp(s[k], m[3], m[4]) : defaults[k]; } apply(); for (const k of Object.keys(ui)) ui[k].set(state[k]); },
      destroy() { if (dead) return; dead = true; if (timer) clearInterval(timer); try { lfo.stop(); } catch { } [input, inG, pre, sh, f, out, lfo, lg, probe, guard].forEach(n => { try { if (n) n.disconnect(); } catch { } }); }
    };
  }
};
