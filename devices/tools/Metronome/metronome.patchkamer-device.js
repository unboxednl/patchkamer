// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Metronome (id nl.patchkamer.klik, voorheen nl.voorbeeld.klik; soort utility in de map tools,
//   voorheen kind instrument). Zelfde tik, zelfde trigs en zelfde state (div, lvl). Tweetalig (host.lang, namen per taal in i18n).
//   Ongeldige waarden in setState vallen terug op de standaard (div: 16, 4, 2 of 1; lvl: 0 … 1), tijden en tellers worden gecontroleerd,
//   en na destroy komt er niets meer uit.
// Metronoom: laat een tik horen op elke maat, tel, achtste of zestiende en stuurt dezelfde slagen als trigs (lane "klik") naar andere apparaten.
const EN = {
  'Elke': 'Every', 'maat': 'Bar', 'tel': 'Beat', '8e': '8th', '16e': '16th', 'Niveau': 'Level', 'Stap': 'Step'
};
export default {
  id: 'nl.patchkamer.klik',
  name: 'Metronome',
  version: '1.15.0',
  kind: 'utility',
  category: 'tool',
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Trigs' }] },
  i18n: { nl: { ports: { out: 'Uit', trigs: 'Trigs' } } },
  create(ctx, host) {
    const tx = k => (host.lang === 'nl' ? k : (EN[k] ?? k));
    const DIVS = [16, 4, 2, 1];
    const out = ctx.createGain(); out.gain.value = 0.5;
    const state = { div: 4, lvl: 0.5 };            // div = elke hoeveel stappen
    let self, cursor, dead = false, ui = {};
    function tick(time, accent) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = accent ? 1600 : 1000;
      g.gain.setValueAtTime(0.6, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      o.connect(g).connect(out); o.start(time); o.stop(time + 0.06);
    }
    self = {
      inputs: {}, outputs: { out },
      mount(el) {
        ui.div = host.ui.select(el, tx('Elke'), [[16, tx('maat')], [4, tx('tel')], [2, tx('8e')], [1, tx('16e')]], state.div, v => { const n = +v; if (DIVS.includes(n)) state.div = n; }, { id: 'div', group: 'timing' });
        ui.lvl = host.ui.knob(el, tx('Niveau'), [0, 1, 0.01], state.lvl, v => Math.round(v * 100) + '%', v => { state.lvl = v; out.gain.setTargetAtTime(v, ctx.currentTime, 0.02); }, { id: 'lvl', group: 'out' });
        cursor = host.ui.steps(el, tx('Stap'), new Array(16).fill(0));
      },
      onStep(info) {
        if (dead || !info || !Number.isFinite(info.time) || !Number.isInteger(info.step) || info.step < 0) return;
        if (info.step % state.div === 0) {
          const acc = info.step === 0; tick(info.time, acc);
          host.emit(self, 'trigs', { type: 'trig', lane: 'klik', vel: acc ? 1 : 0.7, time: info.time });
        }
        cursor && cursor.cursor(info.step % 16);
      },
      onTransport(info) { if (!(info && info.playing) && cursor) cursor.cursor(-1); },
      getState() { return { ...state }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        state.div = DIVS.includes(s.div) ? s.div : 4;
        state.lvl = typeof s.lvl === 'number' && Number.isFinite(s.lvl) ? Math.min(1, Math.max(0, s.lvl)) : 0.5;
        out.gain.value = state.lvl; if (ui.div) ui.div.value = state.div; if (ui.lvl) ui.lvl.set(state.lvl);
      },
      unmount() { cursor = null; ui = {}; },
      destroy() { dead = true; try { out.disconnect(); } catch (e) {} }
    };
    return self;
  }
};
