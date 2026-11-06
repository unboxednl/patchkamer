// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — De kaart kan niet smaller dan 280 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe id nl.patchkamer.tremolo (voorheen nl.voorbeeld.tremolo); presets en songs uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang; poortnamen in i18n, namen van de stuurbare parameters per taal). setState negeert onbekende velden en kapt getallen af op hun bereik;
//          het geluid is ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// 1.1.0 — Stuurbaar (params + modulate): snelheid en diepte.
// Tremolo: een trage oscillator regelt het volume. Snelheid is de frequentie van de oscillator, Diepte hoeveel het volume meebeweegt.
// De oscillator stuurt de versterking van een GainNode (1 ± Diepte); er zit geen geheugen in de signaalweg.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TXT = {
  nl: { rate: 'Snelheid', depth: 'Diepte' },
  en: { rate: 'Rate', depth: 'Depth' },
};
// parameters: id, bereik, logaritmisch, rol, voorgestelde drift, standaard
const MODP = [
  { id: 'rate', min: 0.1, max: 20, log: true, role: 'rate', drift: 0.12, def: 4 },
  { id: 'depth', min: 0, max: 1, log: false, role: 'depth', drift: 0.15, def: 0.5 },
];
const DEF = () => Object.fromEntries(MODP.map(m => [m.id, m.def]));
export default {
  id: 'nl.patchkamer.tremolo',
  name: 'Tremolo',
  version: '1.15.0',
  kind: 'effect',
  category: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out' } } },
  ui: { width: 300, minWidth: 280 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const inG = ctx.createGain(), outG = ctx.createGain();
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 4; depth.gain.value = 0.5;
    lfo.connect(depth).connect(outG.gain); lfo.start();
    inG.connect(outG);
    const state = DEF();
    const mod = {};
    let ui = {}, dead = false;
    // knop + modulatie (contract §8): lineair of logaritmisch
    const eff = m => { const b = state[m.id], o = mod[m.id] || 0; if (!o) return b; return m.log ? clamp(b * Math.pow(m.max / m.min, o), m.min, m.max) : clamp(b + o * (m.max - m.min), m.min, m.max); };
    const apply = () => { const t = ctx.currentTime; lfo.frequency.setTargetAtTime(eff(MODP[0]), t, 0.05); depth.gain.setTargetAtTime(eff(MODP[1]), t, 0.05); };
    return {
      inputs: { in: inG }, outputs: { out: outG },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        ui.rate = host.ui.knob(el, T.rate, [0.1, 20, 0.1], state.rate, v => v.toFixed(1) + ' Hz', v => { state.rate = v; apply(); }, { default: 4, id: 'rate', group: 'mod' });
        ui.depth = host.ui.knob(el, T.depth, [0, 1, 0.01], state.depth, v => Math.round(v * 100) + '%', v => { state.depth = v; apply(); }, { default: 0.5, id: 'depth', group: 'mod' });
      },
      unmount() { ui = {}; },
      params() { return MODP.map(m => ({ id: m.id, name: T[m.id], lane: 'trem', laneName: 'Tremolo', min: m.min, max: m.max, role: m.role, scale: m.log ? 'log' : 'lin', drift: m.drift, on: true })); },
      modulate(o) {
        for (const k in mod) delete mod[k];
        if (o && typeof o === 'object') for (const m of MODP) { const v = o[m.id]; if (typeof v === 'number' && Number.isFinite(v)) mod[m.id] = clamp(v, -1, 1); }
        apply();
      },
      getState() { return { ...state }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        for (const m of MODP) state[m.id] = typeof s[m.id] === 'number' && Number.isFinite(s[m.id]) ? clamp(s[m.id], m.min, m.max) : m.def;
        apply();
        if (ui.rate) ui.rate.set(state.rate);
        if (ui.depth) ui.depth.set(state.depth);
      },
      destroy() { if (dead) return; dead = true; try { lfo.stop(); } catch (e) {} [inG, outG, lfo, depth].forEach(n => { try { n.disconnect(); } catch (e) {} }); },
    };
  },
};
