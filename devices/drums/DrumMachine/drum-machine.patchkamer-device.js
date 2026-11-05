// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Swing op patroonniveau (`swing`) en per geluid (`laneSwing`), naast de hostswing: extra vertraging van de oneven zestienden, 0 … 50% van een stap, de som begrensd tot 50%.
//          Standaard 0 = ongewijzigd (alle gebeurtenissen bit-voor-bit gelijk aan 1.11.0). Het apparaat heeft geen noten- of triggeringang, dus er is niets om live in te spelen
//          en er zijn geen noten om door te geven (noteNames).
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Drum Machine en nieuwe id nl.patchkamer.drummachine (voorheen Drumcomputer, nl.patchkamer.drums);
//          tunes en songs uit die tijd verwijzen naar de oude id. Tweetalig (host.lang; namen van het apparaat en de poorten per taal in i18n).
//          setState kapt getallen af op hun bereik, maakt van elk stap een 0 of 1 en geeft ongeldige waarden de standaard; modulate neemt alleen
//          eindige waarden tussen -1 en 1 aan. Het geluid is ongewijzigd.
// 1.2.0 — Bundel-uitgang "Losse uit" (Separate outs): elk drumgeluid apart (na niveau en pan) in één groene kabel; "Uit" blijft de som.
// 1.1.0 — Elk drumgeluid heeft eigen tune, decay, toon, niveau en pan, stuurbaar (params + modulate), elk als eigen spoor.
// Drum Machine: vier drumgeluiden (kick, snare, hat, perc) met een stappenpatroon van 16 stappen, volledig gesynthetiseerd.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { tone: 'Toon', click: 'Klik', lvl: 'Niveau', dbl: 'dubbelklik: standaard', multi: 'Losse uit', swing: 'Patroonswing', laneSwing: 'swing' },
  en: { tone: 'Tone', click: 'Click', lvl: 'Level', dbl: 'double-click: default', multi: 'Separate outs', swing: 'Pattern swing', laneSwing: 'swing' },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const VOICES = [['kick', 'Kick'], ['snare', 'Snare'], ['hat', 'Hat'], ['perc', 'Perc']];
const hz = v => Math.round(v) + ' Hz', sec = v => v.toFixed(2) + ' s', pct = v => Math.round(v * 100) + '%', pan = v => Math.abs(v) < 0.02 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100);
// per stem: param -> [naam, min, max, stap, standaard, log, rol, voorgesteld bereik, standaard aan, weergave]
const buildVP = T => {
const lvlP = d => [T.lvl, 0, 1, 0.01, d, false, 'level', 0.06, false, pct];
const panP = ['Pan', -1, 1, 0.01, 0, false, 'pan', 0.15, false, pan];
return {
  kick:  { tune: ['Tune', 30, 90, 0.5, 50, true, 'pitch', 0.04, true, hz], dec: ['Decay', 0.1, 1.2, 0.01, 0.45, true, 'decay', 0.12, true, sec], tone: [T.click, 0, 1, 0.01, 0.3, false, 'filter', 0.2, false, pct], lvl: lvlP(0.9), pan: panP },
  snare: { tune: ['Tune', 120, 400, 1, 220, true, 'pitch', 0.05, true, hz], dec: ['Decay', 0.05, 0.6, 0.01, 0.22, true, 'decay', 0.12, true, sec], tone: [T.tone, 600, 5000, 10, 1800, true, 'filter', 0.12, true, hz], lvl: lvlP(0.8), pan: panP },
  hat:   { dec: ['Decay', 0.02, 0.4, 0.005, 0.06, true, 'decay', 0.18, true, sec], tone: [T.tone, 3000, 12000, 50, 7000, true, 'filter', 0.12, true, hz], lvl: lvlP(0.7), pan: panP },
  perc:  { tune: ['Tune', 200, 900, 1, 420, true, 'pitch', 0.06, true, hz], dec: ['Decay', 0.05, 0.8, 0.01, 0.25, true, 'decay', 0.12, true, sec], tone: [T.tone, 400, 4000, 10, 1200, true, 'filter', 0.15, true, hz], lvl: lvlP(0.7), pan: panP },
};
};
const PAT = { kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], perc: [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0] };

export default {
  id: 'nl.patchkamer.drummachine',
  name: 'Drum Machine',
  version: '1.11.1',
  kind: 'instrument',
  category: 'groove',
  ui: { width: 440, minWidth: 320 },
  i18n: { en: { ports: { out: 'Out', trigs: 'Trigs', mod: 'Mod', multi: 'Separate outs' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Trigs' }], modIn: [{ id: 'mod', name: 'Mod' }], multiOut: [{ id: 'multi', name: 'Losse uit' }] },

  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en, VP = buildVP(T);
    const COLS = [['tune', 'Tune'], ['dec', 'Decay'], ['tone', T.tone], ['lvl', T.lvl], ['pan', 'Pan']];
    const out = ctx.createGain(); out.gain.value = 0.8;
    const bus = {}; VOICES.forEach(([k]) => { const g = ctx.createGain(), p = ctx.createStereoPanner(); g.connect(p).connect(out); bus[k] = { g, p }; });
    const defV = () => Object.fromEntries(VOICES.map(([k]) => [k, Object.fromEntries(Object.entries(VP[k]).map(([p, d]) => [p, d[4]]))]));
    const state = { pat: JSON.parse(JSON.stringify(PAT)), v: defV(), lvl: 0.8, swing: 0, laneSwing: Object.fromEntries(VOICES.map(([k]) => [k, 0])) };
    const mod = {};   // 'kick.tune' -> −1..1
    const eff = (vk, pk) => { const d = VP[vk][pk]; const b = state.v[vk][pk], o = mod[vk + '.' + pk] || 0; if (!o) return b;
      return d[5] ? clamp(b * Math.pow(d[2] / d[1], o), d[1], d[2]) : clamp(b + o * (d[2] - d[1]), d[1], d[2]); };
    let rows = {}, cells = {}, self, dead = false, lvlKnob = null, swKnob = null, lswKnobs = {};
    const apply = () => { if (dead) return; const t = ctx.currentTime; VOICES.forEach(([k]) => { bus[k].g.gain.setTargetAtTime(eff(k, 'lvl'), t, 0.03); bus[k].p.pan.setTargetAtTime(eff(k, 'pan'), t, 0.03); }); out.gain.setTargetAtTime(state.lvl, t, 0.02); };
    apply();
    function hit(lane, t, v) {
      const dst = bus[lane].g, dec = eff(lane, 'dec');
      if (lane === 'kick') { const tune = eff('kick', 'tune'), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(tune * 3.2, t); o.frequency.exponentialRampToValueAtTime(tune, t + 0.045);
        g.gain.setValueAtTime(v * 1.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(g).connect(dst); o.start(t); o.stop(t + dec + 0.05);
        const kl = eff('kick', 'tone'); if (kl > 0.01) { const c = ctx.createOscillator(), cg = ctx.createGain(); c.type = 'square'; c.frequency.setValueAtTime(1800, t); c.frequency.exponentialRampToValueAtTime(90, t + 0.015); cg.gain.setValueAtTime(v * kl, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.018); c.connect(cg).connect(dst); c.start(t); c.stop(t + 0.03); } }
      else if (lane === 'snare') { const n = host.ui.noise(ctx), ng = ctx.createGain(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = eff('snare', 'tone'); bp.Q.value = 0.9;
        ng.gain.setValueAtTime(v * 0.9, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + dec); n.connect(bp).connect(ng).connect(dst); n.start(t); n.stop(t + dec + 0.08);
        const tune = eff('snare', 'tune'), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(tune, t); o.frequency.exponentialRampToValueAtTime(tune * 0.68, t + 0.08);
        g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.12, dec)); o.connect(g).connect(dst); o.start(t); o.stop(t + 0.15); }
      else if (lane === 'hat') { const n = host.ui.noise(ctx), g = ctx.createGain(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = eff('hat', 'tone');
        g.gain.setValueAtTime(v * 0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); n.connect(hp).connect(g).connect(dst); n.start(t); n.stop(t + dec + 0.05); }
      else { const g = ctx.createGain(); g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = eff('perc', 'tone'); bp.Q.value = 3; bp.connect(g).connect(dst);
        const base = eff('perc', 'tune'); [1, 1.5, 2.26].forEach((r, k) => { const o = ctx.createOscillator(); o.type = k ? 'square' : 'triangle'; o.frequency.value = base * r; const og = ctx.createGain(); og.gain.value = 0.5 / (k + 1); o.connect(og).connect(bp); o.start(t); o.stop(t + dec + 0.05); }); }
    }
    function paintCells() { VOICES.forEach(([vk]) => COLS.forEach(([pk]) => { const c = cells[vk + '.' + pk]; if (c) { c.i.value = state.v[vk][pk]; c.o.textContent = VP[vk][pk][9](state.v[vk][pk]); } })); }
    self = {
      inputs: {}, outputs: { out },
      bundles: { multi: () => ({ label: T.multi, channels: VOICES.map(([k, lab]) => ({ id: k, name: lab, node: bus[k].p })) }) },
      mount(el) { lvlKnob = null;
        VOICES.forEach(([k, lab]) => { rows[k] = host.ui.steps(el, lab, state.pat[k]); });
        // compact table: one row per drum sound, one column per parameter
        const g = document.createElement('div'); g.style.cssText = 'display:grid;grid-template-columns:44px repeat(5,minmax(0,1fr));gap:2px 8px;align-items:center;margin-top:4px;min-width:0';
        const cap = t => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; return s; };
        g.appendChild(cap('')); COLS.forEach(([, l]) => g.appendChild(cap(l)));
        VOICES.forEach(([vk, vl]) => { const n = cap(vl); n.style.color = 'var(--fg)'; g.appendChild(n);
          COLS.forEach(([pk]) => { const d = VP[vk][pk]; const cell = document.createElement('div'); cell.style.cssText = 'display:grid;min-width:0';
            if (!d) { cell.appendChild(cap('—')); g.appendChild(cell); return; }
            const i = document.createElement('input'); i.type = 'range'; i.min = d[1]; i.max = d[2]; i.step = d[3]; i.value = state.v[vk][pk]; i.setAttribute('aria-label', vl + ' ' + d[0]); i.title = T.dbl;
            const o = document.createElement('output'); o.style.cssText = 'font-size:9px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden'; o.textContent = d[9](state.v[vk][pk]);
            i.oninput = () => { state.v[vk][pk] = +i.value; o.textContent = d[9](+i.value); apply(); };
            i.ondblclick = () => { state.v[vk][pk] = d[4]; paintCells(); apply(); };
            cell.append(i, o); g.appendChild(cell); cells[vk + '.' + pk] = { i, o }; }); });
        el.appendChild(g);
        lvlKnob = host.ui.knob(el, T.lvl, [0, 1, 0.01], state.lvl, pct, v => { state.lvl = v; apply(); });
        // swing: patroon en per geluid (extra op de oneven zestienden, naast de hostswing)
        swKnob = host.ui.knob(el, T.swing, [0, 0.5, 0.005], state.swing, pct, v => { state.swing = v; }, { default: 0 });
        lswKnobs = {}; VOICES.forEach(([k, lab]) => { lswKnobs[k] = host.ui.knob(el, lab + ' ' + T.laneSwing, [0, 0.5, 0.005], state.laneSwing[k], pct, v => { state.laneSwing[k] = v; }, { default: 0 }); });
      },
      onStep({ step, time, stepDur, bpm }) { const sd = Number.isFinite(stepDur) && stepDur > 0 ? stepDur : Number.isFinite(bpm) && bpm > 0 ? 15 / bpm : 0, odd = step % 2 === 1;
        VOICES.forEach(([k]) => { if (state.pat[k][step]) { const v = step % 4 === 0 ? 1 : 0.75, t = odd ? time + clamp(state.swing + state.laneSwing[k], 0, 0.5) * sd : time; hit(k, t, v); host.emit(self, 'trigs', { type: 'trig', lane: k, vel: v, time: t }); } }); Object.values(rows).forEach(r => r.cursor(step)); },
      onTransport({ playing }) { if (!playing) Object.values(rows).forEach(r => r.cursor(-1)); },
      // contract v1.3 — elk drumgeluid is een spoor
      params() { const L = []; VOICES.forEach(([vk, vl]) => Object.entries(VP[vk]).forEach(([pk, d]) => L.push({ id: vk + '.' + pk, name: d[0], lane: vk, laneName: vl, min: d[1], max: d[2], role: d[6], scale: d[5] ? 'log' : 'lin', drift: d[7], on: d[8] }))); return L; },
      modulate(offsets) { for (const k in mod) delete mod[k]; for (const k in offsets || {}) { const [vk, pk] = k.split('.'); if (VP[vk] && VP[vk][pk] && typeof offsets[k] === 'number' && isFinite(offsets[k])) mod[k] = clamp(offsets[k], -1, 1); } apply(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = defV();
        // in place: the step rows keep a reference to these arrays
        VOICES.forEach(([k]) => { const src = Array.isArray(s.pat && s.pat[k]) ? Array.from({ length: 16 }, (_, i) => (s.pat[k][i] === 1 || s.pat[k][i] === true ? 1 : 0)) : PAT[k]; state.pat[k].splice(0, state.pat[k].length, ...src); });
        state.v = d; if (s.v) VOICES.forEach(([vk]) => Object.keys(VP[vk]).forEach(pk => { const x = s.v[vk] && s.v[vk][pk]; if (typeof x === 'number' && isFinite(x)) state.v[vk][pk] = clamp(x, VP[vk][pk][1], VP[vk][pk][2]); }));
        if (!s.v) { if (typeof s.tune === 'number' && isFinite(s.tune)) state.v.kick.tune = clamp(s.tune, 30, 90); if (typeof s.hatDec === 'number' && isFinite(s.hatDec)) state.v.hat.dec = clamp(s.hatDec, 0.02, 0.4); }   // state van 1.0.0
        state.lvl = typeof s.lvl === 'number' && isFinite(s.lvl) ? clamp(s.lvl, 0, 1) : 0.8;
        const sw = (x) => typeof x === 'number' && isFinite(x) ? clamp(x, 0, 0.5) : 0;
        state.swing = sw(s.swing); VOICES.forEach(([k]) => { state.laneSwing[k] = sw(s.laneSwing && s.laneSwing[k]); });
        if (swKnob) swKnob.set(state.swing); VOICES.forEach(([k]) => { if (lswKnobs[k]) lswKnobs[k].set(state.laneSwing[k]); });
        Object.values(rows).forEach(r => r.paint()); paintCells(); if (lvlKnob) lvlKnob.set(state.lvl); apply(); },
      destroy() { if (dead) return; dead = true; try { out.disconnect(); } catch (e) {} }
    };
    return self;
  }
};
