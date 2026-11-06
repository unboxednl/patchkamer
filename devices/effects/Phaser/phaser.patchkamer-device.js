// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — De kaart kan niet smaller dan 280 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang, poortnamen per taal in i18n). setState negeert onbekende velden en kapt getallen af op hun bereik.
//          Een bewaker bouwt de filterketens opnieuw op als een niet-eindige of ontspoorde waarde (NaN, Infinity, een lus die wegloopt) het geheugen van de terugkoppeling vergiftigt.
//          De klank is ongewijzigd.
// Phaser: klassieke phaser met 4 tot 12 allpass-trappen per kant, LFO op de middenfrequentie (in octaven), terugkoppeling (+/−),
// stereo met instelbaar faseverschil tussen links en rechts; LFO vrij of op tempo. Stuurbaar. Eigen code.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SYNC = [['free', 'vrij'], ['32', '8 maten'], ['16', '4 maten'], ['8', '2 maten'], ['4', '1 maat'], ['2', '1/2'], ['1', '1/4'], ['0.5', '1/8']];
const MODP = [['rate', 'Snelheid', 0.02, 10, true, 'rate', 0.1, true], ['depth', 'Diepte', 0, 1, false, 'depth', 0.1, true], ['center', 'Midden', 100, 6000, true, 'filter', 0.1, true],
  ['fb', 'Feedback', -0.95, 0.95, false, 'feedback', 0.08, false], ['stereo', 'Stereo', 0, 1, false, 'width', 0.1, false], ['mix', 'Mix', 0, 1, false, 'send', 0.06, false]];
const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
const DEF = () => ({ stages: 6, rate: 0.25, depth: 0.7, center: 800, fb: 0.5, stereo: 0.5, mix: 0.5, sync: 'free' });
const STAGES = [4, 6, 8, 12];
// Engels woordenboek; de Nederlandse tekst is de sleutel (host.lang 'nl'), wat ontbreekt blijft zoals het is
const EN = {
  'Trappen': 'Stages', 'vrij': 'free', '8 maten': '8 bars', '4 maten': '4 bars', '2 maten': '2 bars', '1 maat': '1 bar',
  'Snelheid': 'Rate', 'Diepte': 'Depth', 'Midden': 'Center',
  'Stereo stelt het faseverschil tussen links en rechts in.': 'Stereo sets the phase difference between left and right.',
};

// ongeldige of ontbrekende waarden krijgen de standaard, getallen worden binnen hun bereik gehouden
function restoreValues(S, raw) {
  const d = DEF(), s = raw && typeof raw === 'object' ? raw : {};
  for (const k of Object.keys(d)) {
    const v = s[k], m = MODBY[k], r = m ? [m[2], m[3]] : k === 'stages' ? [4, 12] : null;
    S[k] = typeof d[k] === 'number' ? (typeof v === 'number' && Number.isFinite(v) ? (r ? clamp(v, r[0], r[1]) : v) : d[k]) : (typeof v === typeof d[k] ? v : d[k]);
  }
  if (!STAGES.includes(S.stages)) S.stages = d.stages;
  if (!SYNC.some(x => x[0] === S.sync)) S.sync = d.sync;
}

export default {
  id: 'nl.patchkamer.phaser',
  name: 'Phaser',
  version: '1.15.0',
  kind: 'effect',
  category: 'effect',
  i18n: { en: { name: 'Phaser', ports: { in: 'In', out: 'Out' } } },
  ui: { width: 300, minWidth: 280 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = k => (host && host.lang === 'nl') ? k : (EN[k] ?? k);
    const S = DEF(), mod = {}; let bpm = (host && +host.bpm) || 120, dead = false, ui = {};
    if (!(Number.isFinite(bpm) && bpm > 0)) bpm = 120;
    const inG = ctx.createGain(); inG.channelCount = 2; inG.channelCountMode = 'explicit'; inG.channelInterpretation = 'speakers';   // mono wordt links = rechts
    const split = ctx.createChannelSplitter(2), merge = ctx.createChannelMerger(2), out = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain();
    inG.connect(dry).connect(out); inG.connect(split); merge.connect(wet).connect(out);
    const E = k => { const m = MODBY[k], b = S[k], o = mod[k] || 0; if (!m || !o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    const lfo = [ctx.createOscillator(), ctx.createOscillator()], lg = [ctx.createGain(), ctx.createGain()]; lfo.forEach((o, i) => { o.connect(lg[i]); });
    let started = false; function startLfo() { if (started) return; started = true; const t = ctx.currentTime + 0.05; lfo[0].start(t); lfo[1].start(t); }   // faseverschil via starttijd
    startLfo();
    const chains = [0, 1].map(() => ({ sum: null, fb: null, dl: null, aps: [] }));
    // bewaker: één analyser per kant, op de uitvoer van de laatste allpass-trap
    const mon = [ctx.createAnalyser(), ctx.createAnalyser()]; mon.forEach(m => { m.fftSize = 256; });
    // de terugkoppellus heeft geheugen (de vertraging en de filters): NaN of Infinity blijft er voorgoed in rondgaan en een lus die wegloopt klinkt niet meer terug
    // build() maakt daarom ook de som, de terugkoppeling en de vertraging opnieuw
    function build() {
      chains.forEach((C, ch) => { C.aps.forEach(a => { try { a.disconnect(); } catch (e) {} }); [C.sum, C.fb, C.dl].forEach(n => { if (n) try { n.disconnect(); } catch (e) {} }); if (C.sum) try { split.disconnect(C.sum); } catch (e) {} try { lg[ch].disconnect(); } catch (e) {}
        C.sum = ctx.createGain(); C.fb = ctx.createGain(); C.dl = ctx.createDelay(0.01);
        C.aps = Array.from({ length: S.stages }, () => { const a = ctx.createBiquadFilter(); a.type = 'allpass'; a.Q.value = 0.6; lg[ch].connect(a.detune); return a; });
        split.connect(C.sum, ch); let prev = C.sum; C.aps.forEach(a => { prev.connect(a); prev = a; }); prev.connect(merge, 0, ch); prev.connect(C.fb).connect(C.dl).connect(C.sum); prev.connect(mon[ch]); C.dl.delayTime.value = 0; });
      apply();
    }
    const chk = new Float32Array(256);
    function guard() {
      if (dead) return;
      for (let ch = 0; ch < 2; ch++) { mon[ch].getFloatTimeDomainData(chk);
        for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 200)) { build(); return; } }   // normaal tot ongeveer ±25 bij volle terugkoppeling; een ontspoorde lus loopt in tientallen ms naar 1e5 en meer
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();
    const rateHz = () => S.sync === 'free' ? E('rate') : bpm / 60 / +S.sync;
    let stereoSet = null;
    function apply() { const t = ctx.currentTime, r = 0.05, f = E('center'), dep = E('depth') * 2400, fb = E('fb'), mx = E('mix');
      if (typeof ctx.createPeriodicWave === 'function') {
        const ph = E('stereo') * Math.PI;   // de golfvorm wordt alleen opnieuw gemaakt als het faseverschil veranderd is
        if (ph !== stereoSet) { try { lfo[1].setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, Math.sin(ph)]), new Float32Array([0, Math.cos(ph)]), { disableNormalization: true })); stereoSet = ph; } catch {} } }
      lfo.forEach(o => o.frequency.setTargetAtTime(rateHz(), t, r)); lg.forEach(g => g.gain.setTargetAtTime(dep, t, r));
      chains.forEach(C => { C.aps.forEach(a => a.frequency.setTargetAtTime(f, t, r)); C.fb.gain.setTargetAtTime(fb, t, r); });
      wet.gain.setTargetAtTime(mx, t, r); dry.gain.setTargetAtTime(1 - mx, t, r); }
    build();
    const pct = v => Math.round(v * 100) + '%';
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        ui.stages = host.ui.select(el, tx('Trappen'), STAGES.map(n => [n, String(n)]), S.stages, v => { S.stages = +v; build(); }, { id: 'stages', group: 'filter' });
        ui.sync = host.ui.select(el, 'Tempo', SYNC.map(([v, n]) => [v, tx(n)]), S.sync, v => { S.sync = v; apply(); }, { id: 'sync', group: 'mod' });
        ui.rate = host.ui.knob(el, tx('Snelheid'), [0.02, 10, 0.01], S.rate, v => v.toFixed(2) + ' Hz', v => { S.rate = v; apply(); }, { id: 'rate', group: 'mod' });
        ui.depth = host.ui.knob(el, tx('Diepte'), [0, 1, 0.01], S.depth, v => (v * 2).toFixed(1) + ' oct', v => { S.depth = v; apply(); }, { id: 'depth', group: 'mod' });
        ui.center = host.ui.knob(el, tx('Midden'), [100, 6000, 10], S.center, v => Math.round(v) + ' Hz', v => { S.center = v; apply(); }, { id: 'center', group: 'filter' });
        ui.fb = host.ui.knob(el, 'Feedback', [-0.95, 0.95, 0.01], S.fb, pct, v => { S.fb = v; apply(); }, { id: 'fb', group: 'feedback' });
        ui.stereo = host.ui.knob(el, 'Stereo', [0, 1, 0.01], S.stereo, v => Math.round(v * 180) + '°', v => { S.stereo = v; apply(); }, { id: 'stereo', group: 'stereo' });
        ui.mix = host.ui.knob(el, 'Mix', [0, 1, 0.01], S.mix, pct, v => { S.mix = v; apply(); }, { id: 'mix', group: 'mix' });
        const n = document.createElement('div'); n.className = 'note'; n.textContent = tx('Stereo stelt het faseverschil tussen links en rechts in.'); el.appendChild(n);
      },
      onStep({ bpm: b }) { if (Number.isFinite(b) && b > 0 && b !== bpm) { bpm = b; if (S.sync !== 'free') apply(); } },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'phaser', laneName: 'Phaser', min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (Object.hasOwn(MODBY, k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); },
      getState() { return { ...S }; },
      setState(s) {
        const st = S.stages; restoreValues(S, s);
        if (S.stages !== st) build(); else apply();
        ['rate', 'depth', 'center', 'fb', 'stereo', 'mix'].forEach(k => ui[k] && ui[k].set(S[k])); if (ui.stages) ui.stages.value = S.stages; if (ui.sync) ui.sync.value = S.sync;
      },
      destroy() {
        if (dead) return; dead = true; if (guardT) clearInterval(guardT);
        lfo.forEach(o => { try { o.stop(); } catch {} });
        [inG, out, dry, wet, split, merge, ...mon, ...lfo, ...lg, ...chains.flatMap(C => [C.sum, C.fb, C.dl, ...C.aps])].forEach(n => { if (n) try { n.disconnect(); } catch {} });
      },
    };
  }
};
