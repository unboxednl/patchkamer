// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — De kaart kan niet smaller dan 280 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang, poortnamen per taal in i18n). setState negeert onbekende velden en kapt getallen af op hun bereik.
//          Een bewaker vervangt het toonfilter als een niet-eindige ingang (NaN, Infinity) het voorgoed zou vergiftigen. De klank is ongewijzigd.
// Chorus: Chorus (2 stemmen) of Ensemble (3 stemmen met een trage en een snelle LFO, 120° uit fase, zoals een string-ensemble).
// Stereo breedte, toon en mix; LFO vrij of op tempo. Stuurbaar. Eigen code.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SYNC = [['free', 'vrij'], ['16', '4 maten'], ['4', '1 maat'], ['2', '1/2'], ['1', '1/4'], ['0.5', '1/8']];
const MODP = [['rate', 'Snelheid', 0.03, 8, true, 'rate', 0.1, true], ['depth', 'Diepte', 0, 1, false, 'depth', 0.12, true], ['delay', 'Vertraging', 3, 30, true, 'time', 0.05, false],
  ['width', 'Breedte', 0, 1, false, 'width', 0.1, false], ['tone', 'Toon', 800, 16000, true, 'tone', 0.08, false], ['mix', 'Mix', 0, 1, false, 'send', 0.08, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ mode: 'ensemble', rate: 0.5, depth: 0.5, delay: 12, width: 0.8, tone: 9000, mix: 0.5, sync: 'free' });
// Engels woordenboek; de Nederlandse tekst is de sleutel (host.lang 'nl'), wat ontbreekt blijft zoals het is
const EN = {
  'Soort': 'Type', 'Ensemble (3 stemmen)': 'Ensemble (3 voices)', 'Chorus (2 stemmen)': 'Chorus (2 voices)',
  'vrij': 'free', '4 maten': '4 bars', '1 maat': '1 bar',
  'Snelheid': 'Rate', 'Diepte': 'Depth', 'Vertraging': 'Delay', 'Breedte': 'Width', 'Toon': 'Tone',
};

// ongeldige of ontbrekende waarden krijgen de standaard, getallen worden binnen hun bereik gehouden
function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  for (const k of Object.keys(d)) {
    const v = s[k], m = MODBY[k];
    S[k] = typeof d[k] === 'number' ? (typeof v === 'number' && Number.isFinite(v) ? (m ? clamp(v, m[2], m[3]) : v) : d[k]) : (typeof v === typeof d[k] ? v : d[k]);
  }
  if (!['ensemble', 'chorus'].includes(S.mode)) S.mode = d.mode;
  if (!SYNC.some(x => x[0] === S.sync)) S.sync = d.sync;
}

export default {
  id: 'nl.patchkamer.chorus',
  name: 'Chorus',
  version: '1.15.0',
  kind: 'effect',
  category: 'effect',
  i18n: { en: { name: 'Chorus', ports: { in: 'In', out: 'Out' } } },
  ui: { width: 300, minWidth: 280 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = k => (host && host.lang === 'nl') ? k : (EN[k] ?? k);
    const S = DEF(), mod = {}; let bpm = (host && +host.bpm) || 120, dead = false, ui = {};
    if (!(Number.isFinite(bpm) && bpm > 0)) bpm = 120;
    const inG = ctx.createGain(), out = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(), sum = ctx.createGain();
    const mkTone = () => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; return f; };
    let tone = mkTone();
    inG.connect(dry).connect(out); sum.connect(tone).connect(wet).connect(out);
    // bewaker: een toonfilter dat NaN of Infinity binnenkrijgt, houdt dat voor altijd en vergiftigt de hele uitgang
    const mon = ctx.createAnalyser(); mon.fftSize = 256; tone.connect(mon);
    const chk = new Float32Array(256);
    function guard() {
      if (dead) return; mon.getFloatTimeDomainData(chk);
      for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 1e6)) {
        try { sum.disconnect(tone); tone.disconnect(); } catch (e) {}
        tone = mkTone(); tone.frequency.value = E('tone'); sum.connect(tone); tone.connect(wet); tone.connect(mon); return;
      }
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    const phased = ph => { if (typeof ctx.createPeriodicWave !== 'function') return null; const r = new Float32Array([0, Math.sin(ph)]), i = new Float32Array([0, Math.cos(ph)]); try { return ctx.createPeriodicWave(r, i, { disableNormalization: true }); } catch (e) { return null; } };
    // drie lijnen; in Chorus-modus spelen er twee
    const lines = [0, 1, 2].map(k => { const d = ctx.createDelay(0.1), p = ctx.createStereoPanner(), g = ctx.createGain(), slow = ctx.createOscillator(), fast = ctx.createOscillator(), sg = ctx.createGain(), fg = ctx.createGain();
      const ph = k * 2 * Math.PI / 3, w = phased(ph); if (w) { slow.setPeriodicWave(w); fast.setPeriodicWave(phased(ph + 1)); }
      slow.connect(sg).connect(d.delayTime); fast.connect(fg).connect(d.delayTime); inG.connect(d).connect(g).connect(p).connect(sum); slow.start(); fast.start(); return { d, p, g, slow, fast, sg, fg }; });
    const rateHz = () => S.sync === 'free' ? E('rate') : bpm / 60 / +S.sync;
    function apply() {
      const t = ctx.currentTime, r = 0.05, ens = S.mode === 'ensemble', rate = rateHz(), dep = E('depth'), base = E('delay') / 1000, wd = E('width'), mx = E('mix');
      lines.forEach((L, k) => { const on = ens || k < 2; L.g.gain.setTargetAtTime(on ? (ens ? 0.6 : 0.8) : 0, t, r); L.d.delayTime.setTargetAtTime(base, t, r);
        L.p.pan.setTargetAtTime(ens ? [-1, 0, 1][k] * wd : (k ? 1 : -1) * wd, t, r);
        L.slow.frequency.setTargetAtTime(rate * (ens ? 1 : 1 + k * 0.07), t, r); L.sg.gain.setTargetAtTime(dep * Math.min(base * 0.8, 0.006) * (ens ? 1 : (k ? -1 : 1)), t, r);
        L.fast.frequency.setTargetAtTime(ens ? rate * 11 + 3 : 0.01, t, r); L.fg.gain.setTargetAtTime(ens ? dep * 0.0004 : 0, t, r); });
      tone.frequency.setTargetAtTime(E('tone'), t, r); wet.gain.setTargetAtTime(mx * (ens ? 1.1 : 1), t, r); dry.gain.setTargetAtTime(1 - mx * 0.5, t, r);
    }
    apply();
    const pct = v => Math.round(v * 100) + '%';
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        ui.mode = host.ui.select(el, tx('Soort'), [['ensemble', tx('Ensemble (3 stemmen)')], ['chorus', tx('Chorus (2 stemmen)')]], S.mode, v => { S.mode = v; apply(); }, { id: 'mode', group: 'mod' });
        ui.sync = host.ui.select(el, 'Tempo', SYNC.map(([v, n]) => [v, tx(n)]), S.sync, v => { S.sync = v; apply(); }, { id: 'sync', group: 'mod' });
        ui.rate = host.ui.knob(el, tx('Snelheid'), [0.03, 8, 0.01], S.rate, v => v.toFixed(2) + ' Hz', v => { S.rate = v; apply(); }, { id: 'rate', group: 'mod' });
        ui.depth = host.ui.knob(el, tx('Diepte'), [0, 1, 0.01], S.depth, pct, v => { S.depth = v; apply(); }, { id: 'depth', group: 'mod' });
        ui.delay = host.ui.knob(el, tx('Vertraging'), [3, 30, 0.1], S.delay, v => v.toFixed(1) + ' ms', v => { S.delay = v; apply(); }, { id: 'delay', group: 'delay' });
        ui.width = host.ui.knob(el, tx('Breedte'), [0, 1, 0.01], S.width, pct, v => { S.width = v; apply(); }, { id: 'width', group: 'stereo' });
        ui.tone = host.ui.knob(el, tx('Toon'), [800, 16000, 10], S.tone, v => Math.round(v) + ' Hz', v => { S.tone = v; apply(); }, { id: 'tone', group: 'tone' });
        ui.mix = host.ui.knob(el, 'Mix', [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); }, { id: 'mix', group: 'mix' });
      },
      onStep({ bpm: b }) { if (Number.isFinite(b) && b > 0 && b !== bpm) { bpm = b; if (S.sync !== 'free') apply(); } },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'chorus', laneName: 'Chorus', min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...S }; },
      setState(s) {
        restoreValues(S, s); apply();
        ['rate', 'depth', 'delay', 'width', 'tone', 'mix'].forEach(k => ui[k] && ui[k].set(S[k])); if (ui.mode) ui.mode.value = S.mode; if (ui.sync) ui.sync.value = S.sync;
      },
      destroy() {
        if (dead) return; dead = true; if (guardT) clearInterval(guardT);
        lines.forEach(L => { try { L.slow.stop(); } catch {} try { L.fast.stop(); } catch {} });
        [inG, out, dry, wet, tone, sum, mon, ...lines.flatMap(L => Object.values(L))].forEach(n => { if (n) try { n.disconnect(); } catch {} });
      },
    };
  }
};
