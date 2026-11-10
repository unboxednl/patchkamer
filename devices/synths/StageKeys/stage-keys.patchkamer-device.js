// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.0 — Regelaars herkenbaar voor skins (host.ui.adopt: id = state-sleutel, rol param, groep sound), zodat een skin ze als draaiknop kan tonen (skin Compact). Geluid, state en params() ongewijzigd; zonder skin ziet het er hetzelfde uit.
// 1.12.0 — Uitleg naar about (menu Over Stage Keys); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.11.1 — Verbeterd: noteoff, noteon, een aangehouden toets (held) en panic worden nu verwerkt (voorheen klonk elke toets van Keys in de stand "Toets vasthouden" door, omdat noteoff werd genegeerd). De drive is veel zachter (een zachte begrenzing met een kleine vaste kromming, gedeeld door de toename) en de ingang is versterkt, zodat het volume ook zonder drive goed is.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe id nl.patchkamer.stagekeys (voorheen nl.unboxed.stagekeys). Tweetalig (host.lang, namen per taal in i18n).
//   - klankmodellen en hun state-waarden hebben neutrale namen: tine, reed, combpluck, organ, combo, vibes, bass (inst);
//     de rotary-snelheid heet rotaryFast en het CC-id rotary
//   - kleuren uit de CSS-variabelen van de host; de lampjes op het klavier lopen via host.frame; CC met een tijdstip gaat via een timer
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - noten met een niet-eindige waarde (nootnummer, sterkte, tijd, duur) worden genegeerd of op de standaard gezet; een tijd verder dan 30 s vooruit wordt 30 s
//   - de vervormer volgt host.audio.oversample
//   - Stop klinkt ook stemmen uit die een nieuwe noot op dezelfde toon (of de stemmenlimiet) al had vervangen maar die nog klonken
// Polyfone stage keys: elektrische piano met tines, piano met rieten, kampluk, drawbar-orgel met rotary, combo-orgel, vibrafoon en synth-bas.
// Bestuurbaar via sturingskabels, CC-ingang, sustainpedaal, stemming, stemmenlimiet, schaalbare layout en sequencer-noten die bij Stop uitsterven.
export default {
  id: 'nl.patchkamer.stagekeys',
  name: 'Stage Keys',
  version: '1.13.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 560, minWidth: 260 },
  about: { nl: 'Polyfoon, tot 24 stemmen. Speel op het klavier of verbind een sequencer met Noten; Gespeeld stuurt door wat je speelt.\n\nCC-ids: tone, drive, tremolo, tremrate, tune, level, rotary, sustain, model.\n\nEen sturingskabel op Mod laat toon, stemming en de rest bewegen.', en: 'Polyphonic, up to 24 voices. Play on the keyboard or connect a sequencer to Notes; Played passes on what you play.\n\nCC ids: tone, drive, tremolo, tremrate, tune, level, rotary, sustain, model.\n\nA control cable on Mod moves tone, tuning and the rest.' },
  ports: {
    audioIn: [],
    audioOut: [{ id: 'out', name: 'Uit' }],
    eventIn: [{ id: 'notes', name: 'Noten' }],
    eventOut: [{ id: 'played', name: 'Gespeeld' }],
    modIn: [{ id: 'mod', name: 'Mod' }],
    modOut: [],
  },
  i18n: { en: { ports: { out: 'Out', notes: 'Notes', played: 'Played' } } },

  create(ctx, host) {
    const EN = {
      'Kampluk': 'Comb Pluck', 'Drawbar-orgel': 'Drawbar Organ', 'Combo-orgel': 'Combo Organ', 'Vibrafoon': 'Vibraphone', 'Synth-bas': 'Synth Bass',
      'Reed-grom': 'Reed growl', 'Toon': 'Tone', 'Stemming': 'Tuning', 'Niveau': 'Level', 'Rotary traag': 'Rotary slow', 'Rotary snel': 'Rotary fast', 'Octaaf': 'Octave',
      'Klavier': 'Keyboard', 'Klavier een octaaf lager': 'Keyboard one octave down', 'Klavier een octaaf hoger': 'Keyboard one octave up', 'Sustainpedaal (ook via cc "sustain")': 'Sustain pedal (also via cc "sustain")',
      'Rotary-snelheid: traag 0,7 Hz / snel 6,6 Hz': 'Rotary speed: slow 0.7 Hz / fast 6.6 Hz', 'toetsen': 'keys', 'Gestuurd: ': 'Controlled: ',
    };
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    // ---- uitgangsketen: stemmen -> drive -> stereo tremolo (L/R in tegenfase) -> niveau ----
    const sum = ctx.createGain(); sum.gain.value = 3;   // versterking vóór de drive: ook zonder drive klinkt het apparaat vol genoeg
    const shaper = ctx.createWaveShaper(); shaper.oversample = (host.audio && host.audio.oversample) || '2x';
    const tremL = ctx.createGain(), tremR = ctx.createGain();
    const lfo = ctx.createOscillator(); lfo.type = 'sine';
    const lfoL = ctx.createGain(), lfoR = ctx.createGain();
    const panL = ctx.createStereoPanner(), panR = ctx.createStereoPanner(); panL.pan.value = -1; panR.pan.value = 1;
    const out = ctx.createGain(); out.gain.value = 0;
    sum.connect(shaper);
    shaper.connect(tremL).connect(panL).connect(out);
    shaper.connect(tremR).connect(panR).connect(out);
    lfo.connect(lfoL).connect(tremL.gain);
    lfo.connect(lfoR).connect(tremR.gain);
    lfo.start();

    const DEFAULTS = { inst: 'tine', tone: 0.55, drive: 0.1, tremRate: 4.5, tremDepth: 0, tune: 0, rotaryFast: false, oct: 0, lvl: 0.4, kbBase: 48 };
    const state = { ...DEFAULTS };
    const mod = {};                      // actuele sturing: paramId -> -1..1
    const MAX_VOICES = 24;
    // ---- hulpfuncties ----
    const fm = (car, ratio, f, idx, t, decayTo, decayT) => {
      const m = ctx.createOscillator(); m.type = 'sine'; m.frequency.value = f * ratio;
      const g = ctx.createGain(); g.gain.setValueAtTime(Math.max(1, idx), t);
      g.gain.exponentialRampToValueAtTime(Math.max(1, decayTo), t + decayT);
      m.connect(g).connect(car.frequency); return m;
    };
    const thump = (dest, f, amp, t, len, type = 'triangle') => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
      const g = ctx.createGain(); g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(dest); return o;
    };
    const strike = (vg, peak, t, decay) => {
      vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(peak, t + 0.004);
      vg.gain.setTargetAtTime(0.0001, t + 0.004, decay / 4);
    };

    // ---- klankmodellen: voice(vg, f, midi, v, t) -> oscillators (worden gestart/gestopt door de engine) ----
    const MODELS = {
      tine: { name: 'Tine Piano', tone: 'Bark', release: 0.25,
        voice(vg, f, midi, v, t, k) {
          const bright = 1 - Math.min(1, (midi - 30) / 70);
          const car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = f;
          const idx1 = f * (0.3 + k * 2.2) * Math.pow(v, 1.7) * (0.4 + bright);
          const m1 = fm(car, 1, f, idx1, t, idx1 * 0.08, 0.35 + 0.5 * (1 - v));
          const m2 = fm(car, 14, f, f * 0.25 * v * (0.3 + k), t, 1, 0.12);
          const th = thump(vg, f * 0.5, 0.18 * v, t, 0.05);
          strike(vg, 0.12 + 0.5 * Math.pow(v, 1.4), t, 2.5 + 6 * (1 - Math.min(1, (midi - 28) / 60)));
          car.connect(vg); return [car, m1, m2, th];
        } },
      reed: { name: 'Reed Piano', tone: 'Reed-grom', release: 0.18,
        voice(vg, f, midi, v, t, k) {
          const car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = f;
          const idx = f * (0.5 + k * 1.6) * Math.pow(v, 1.5);
          const m1 = fm(car, 2, f, idx, t, idx * 0.12, 0.25);
          const m2 = fm(car, 1, f, f * 0.6 * v * k, t, f * 0.05, 0.6);
          const sq = ctx.createOscillator(); sq.type = 'square'; sq.frequency.value = f;
          const sqg = ctx.createGain(); sqg.gain.setValueAtTime(0.06 * v * (1 + k), t); sqg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(8000, f * 6);
          sq.connect(sqg).connect(lp).connect(vg);
          const th = thump(vg, f * 0.5, 0.12 * v, t, 0.03, 'square');
          strike(vg, 0.1 + 0.5 * Math.pow(v, 1.3), t, 1.4 + 3 * (1 - Math.min(1, (midi - 28) / 60)));
          car.connect(vg); return [car, m1, m2, sq, th];
        } },
      combpluck: { name: 'Kampluk', tone: 'Pickup', release: 0.06,
        voice(vg, f, midi, v, t, k) {
          const saw = ctx.createOscillator(); saw.type = 'sawtooth'; saw.frequency.value = f;
          const saw2 = ctx.createOscillator(); saw2.type = 'sawtooth'; saw2.frequency.value = f * 1.004;
          const mix = ctx.createGain(); mix.gain.value = 0.35;
          const comb = ctx.createDelay(0.05); comb.delayTime.value = (0.2 + 0.75 * (1 - k)) / f;
          const combG = ctx.createGain(); combG.gain.value = -0.8;
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
          const fc = Math.min(12000, 800 + 9000 * Math.pow(v, 1.5) * (0.3 + k));
          lp.frequency.setValueAtTime(fc, t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, fc * 0.18), t + 0.35);
          saw.connect(mix); saw2.connect(mix); mix.connect(lp); mix.connect(comb).connect(combG).connect(lp); lp.connect(vg);
          strike(vg, 0.25 + 0.6 * Math.pow(v, 1.2), t, 1.1);
          return [saw, saw2];
        } },
      organ: { name: 'Drawbar-orgel', tone: 'Drawbars', release: 0.05,
        voice(vg, f, midi, v, t, k) {
          const ratios = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8];
          const jazz = [1, 1, 1, 0, 0, 0, 0, 0, 0], gospel = [1, 1, 1, 1, 0, 0, 0, 0, 0], full = [1, 1, 1, 1, 1, 1, 1, 1, 1];
          const A = k < 0.5 ? jazz : gospel, B = k < 0.5 ? gospel : full, u = k < 0.5 ? k * 2 : (k - 0.5) * 2;
          const s = ctx.createGain(); s.gain.value = 0.08; const oscs = [];
          ratios.forEach((r, i) => {
            const a = A[i] + (B[i] - A[i]) * u; if (a <= 0.02) return;
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = Math.min(f * r, 6000);
            const g = ctx.createGain(); g.gain.value = a * (i === 0 ? 0.9 : 1) * Math.pow(0.9, i); o.connect(g).connect(s); oscs.push(o);
          });
          const perc = ctx.createOscillator(); perc.type = 'sine'; perc.frequency.value = f * 3;
          const pg = ctx.createGain(); pg.gain.setValueAtTime(0.5, t); pg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          perc.connect(pg).connect(s); oscs.push(perc, thump(s, f * 6, 0.35, t, 0.012, 'square'));
          const lf = ctx.createOscillator(); lf.frequency.value = state.rotaryFast ? 6.6 : 0.7;
          const dop = ctx.createDelay(0.05); dop.delayTime.value = 0.006;
          const dg = ctx.createGain(); dg.gain.value = 0.0009; lf.connect(dg).connect(dop.delayTime);
          const rot = ctx.createGain(); rot.gain.value = 0.8; const rg = ctx.createGain(); rg.gain.value = 0.2; lf.connect(rg).connect(rot.gain);
          s.connect(dop).connect(rot).connect(vg); oscs.push(lf);
          vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0.75, t + 0.004);
          vg._rotary = lf; return oscs;
        } },
      combo: { name: 'Combo-orgel', tone: 'Flute → Reed', release: 0.03,
        voice(vg, f, midi, v, t, k) {
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600 + 2400 * k; lp.Q.value = 0.8;
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180; lp.connect(hp).connect(vg);
          const vib = ctx.createOscillator(); vib.frequency.value = 5.6; const vgn = ctx.createGain(); vgn.gain.value = 2.5; vib.connect(vgn);
          const oscs = [vib];
          [[0.5, 0.45], [1, 1], [2, 0.55], [3, 0.18]].forEach(([r, a]) => {
            const fl = ctx.createOscillator(); fl.type = 'square'; fl.frequency.value = f * r; vgn.connect(fl.detune);
            const rd = ctx.createOscillator(); rd.type = 'sawtooth'; rd.frequency.value = f * r; vgn.connect(rd.detune);
            const fg = ctx.createGain(); fg.gain.value = a * 0.07 * (1 - k * 0.7);
            const rg = ctx.createGain(); rg.gain.value = a * 0.09 * (0.25 + k);
            fl.connect(fg).connect(lp); rd.connect(rg).connect(lp); oscs.push(fl, rd);
          });
          vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0.7, t + 0.004);
          return oscs;
        } },
      vibes: { name: 'Vibrafoon', tone: 'Mallet', release: 0.5,
        voice(vg, f, midi, v, t, k) {
          const car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = f;
          const m1 = fm(car, 4, f, f * (0.2 + 1.2 * k) * v, t, 1, 0.18);
          const p2 = ctx.createOscillator(); p2.type = 'sine'; p2.frequency.value = f * 4;
          const p2g = ctx.createGain(); p2g.gain.setValueAtTime(0.18 * v, t); p2g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
          const p3 = ctx.createOscillator(); p3.type = 'sine'; p3.frequency.value = f * 9.95;
          const p3g = ctx.createGain(); p3g.gain.setValueAtTime(0.08 * v * (0.3 + k), t); p3g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          p2.connect(p2g).connect(vg); p3.connect(p3g).connect(vg);
          strike(vg, 0.1 + 0.5 * v, t, 4 + 4 * (1 - Math.min(1, (midi - 48) / 40)));
          car.connect(vg); return [car, m1, p2, p3];
        } },
      bass: { name: 'Synth-bas', tone: 'Filter', release: 0.12,
        voice(vg, f, midi, v, t, k) {
          const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = f;
          const b = ctx.createOscillator(); b.type = 'sawtooth'; b.frequency.value = f; b.detune.value = -9;
          const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = f * 0.5;
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6 + 6 * k;
          const fc = 200 + 5000 * k * Math.pow(v, 1.3);
          lp.frequency.setValueAtTime(fc, t); lp.frequency.exponentialRampToValueAtTime(Math.max(90, fc * 0.15), t + 0.45);
          const m = ctx.createGain(); m.gain.value = 0.22; a.connect(m); b.connect(m); m.connect(lp).connect(vg);
          const sg = ctx.createGain(); sg.gain.value = 0.3; sub.connect(sg).connect(vg);
          vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0.35 + 0.4 * v, t + 0.01);
          vg.gain.setTargetAtTime(0.25 + 0.3 * v, t + 0.01, 0.3);
          return [a, b, sub];
        } },
    };

    const INST_IDS = Object.keys(MODELS);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    // ---- stuurbare parameters (contract v1.3) ----
    // key = veld in state; per-note parameters (toon, stemming) gelden vanaf de volgende noot.
    const PARAMS = [
      { id: 'tone', key: 'tone', name: 'Toon', min: 0, max: 1, scale: 'lin', role: 'filter', drift: 0.08, on: true, fmt: v => Math.round(v * 100) + '%', step: 0.01 },
      { id: 'drive', key: 'drive', name: 'Drive', min: 0, max: 1, scale: 'lin', role: 'drive', drift: 0.05, on: false, fmt: v => Math.round(v * 100) + '%', step: 0.01 },
      { id: 'trem', key: 'tremDepth', name: 'Tremolo', min: 0, max: 1, scale: 'lin', role: 'mod', drift: 0.1, on: false, fmt: v => Math.round(v * 100) + '%', step: 0.01 },
      { id: 'tremrate', key: 'tremRate', name: 'Trem Hz', min: 0.5, max: 12, scale: 'log', role: 'rate', drift: 0.06, on: false, fmt: v => v.toFixed(1) + ' Hz', step: 0.1 },
      { id: 'tune', key: 'tune', name: 'Stemming', min: -50, max: 50, scale: 'lin', role: 'pitch', drift: 0.02, on: true, fmt: v => (v > 0 ? '+' : '') + Math.round(v) + ' ct', step: 1 },
      { id: 'lvl', key: 'lvl', name: 'Niveau', min: 0, max: 1, scale: 'lin', role: 'level', drift: 0.04, on: false, fmt: v => Math.round(v * 100) + '%', step: 0.01 },
    ];
    const PBY = Object.fromEntries(PARAMS.map(p => [p.id, p]));
    // waarde met sturing erbovenop; de knop blijft de basis
    const eff = id => {
      const p = PBY[id], base = state[p.key], o = clamp(+mod[id] || 0, -1, 1);
      if (!o) return base;
      return p.scale === 'log' ? clamp(base * Math.pow(p.max / p.min, o), p.min, p.max) : clamp(base + o * (p.max - p.min), p.min, p.max);
    };

    // Drive: zacht begrensd, met een kleine minimale kromming zodat de pieken nooit hard afknappen. Gedeeld door de toename, zodat het volume
    // bij meer drive niet stijgt; de ingang is versterkt zodat ook zonder drive het niveau goed is.
    const driveCurve = d => { const n = 2048, c = new Float32Array(n), a = 0.4 + d * 10, comp = 1 / (1 + a * 0.5); for (let i = 0; i < n; i++) { const x = i * 2 / (n - 1) - 1; c[i] = ((1 + a) * x / (1 + a * Math.abs(x))) * comp; } return c; };
    let lastDrive = -1;
    const apply = (t = ctx.currentTime) => {
      const d = eff('drive');
      if (Math.abs(d - lastDrive) > 0.004) { shaper.curve = driveCurve(d); lastDrive = d; }
      lfo.frequency.setTargetAtTime(eff('tremrate'), t, 0.05);
      const td = eff('trem');
      lfoL.gain.setTargetAtTime(td * 0.5, t, 0.03); lfoR.gain.setTargetAtTime(-td * 0.5, t, 0.03);
      out.gain.setTargetAtTime(eff('lvl'), t, 0.02);
      voices.forEach(v => { if (v.rotary) v.rotary.frequency.setTargetAtTime(state.rotaryFast ? 6.6 : 0.7, t, 0.8); });
    };

    // ---- stem-engine ----
    // Eén stem per toonhoogte. Een stem blijft in de lijst tot hij uitgeklonken is, zodat Stop en de
    // stemmenlimiet ook vooruit geplande noten van een sequencer kunnen afkappen.
    const voices = new Map();   // midi -> { out, oscs, release, rotary, start, endT }
    let retired = [];   // stemmen die een nieuwe noot op dezelfde toon of de stemmenlimiet heeft vervangen, maar nog niet uitgeklonken zijn: Stop moet ze ook bereiken
    const purge = () => { const now = ctx.currentTime; voices.forEach((v, m) => { if (v.endT + v.release * 4 + 0.1 < now) voices.delete(m); }); retired = retired.filter(v => v.endT + v.release * 4 + 0.1 >= now); };
    const releaseVoice = (v, t, quick) => {
      const rel = quick ? 0.01 : v.release;
      v.out.gain.cancelScheduledValues(t);
      v.out.gain.setTargetAtTime(0.0001, t, rel / 4);
      v.oscs.forEach(o => { try { o.stop(t + rel * 4 + 0.05); } catch (e) {} });
      v.endT = t;
    };
    const noteOff = (midi, t, quick) => { const v = voices.get(midi); if (v && v.endT > t) releaseVoice(v, t, quick); };
    const noteOn = (midi, vel, t, dur) => {
      const model = MODELS[state.inst] || MODELS.tine;
      midi = clamp(Math.round(midi), 12, 120);
      purge();
      const prev = voices.get(midi);
      if (prev) { if (prev.endT > t) { releaseVoice(prev, t, true); retired.push(prev); } voices.delete(midi); }
      if (voices.size >= MAX_VOICES) {           // oudste stem eerst
        let oldM = null, oldS = Infinity; voices.forEach((v, m) => { if (v.start < oldS) { oldS = v.start; oldM = m; } });
        if (oldM !== null) { const v = voices.get(oldM); if (v.endT > t) { releaseVoice(v, t, true); retired.push(v); } voices.delete(oldM); }
      }
      const f = 440 * Math.pow(2, (midi - 69) / 12 + eff('tune') / 1200), v = clamp(vel, 0.05, 1);
      const vg = ctx.createGain(); vg.gain.value = 0;
      const oscs = model.voice(vg, f, midi, v, t, eff('tone'));
      vg.connect(sum);
      oscs.forEach(o => o.start(t));
      const voice = { out: vg, oscs, release: model.release, rotary: vg._rotary, start: t, endT: Infinity };
      voices.set(midi, voice);
      if (dur > 0) releaseVoice(voice, t + dur, false);
    };
    const silenceAll = quick => { const now = ctx.currentTime; voices.forEach(v => { if (v.endT > now) releaseVoice(v, now, quick); }); retired.forEach(v => { if (v.endT > now) releaseVoice(v, now, quick); }); retired = []; };

    // ---- sustainpedaal (UI-knop of cc 'sustain') ----
    let sustain = false;
    const sustained = new Set(), held = new Map();
    const setSustain = (on, t = ctx.currentTime) => {
      on = !!on; if (on === sustain) return;
      sustain = on;
      if (!on) {
        const stillHeld = new Set([...held.values()].map(h => h.m));
        sustained.forEach(m => { if (!stillHeld.has(m)) { noteOff(m, t, false); light(m, false); } });
        sustained.clear();
      }
      paintToggles();
    };

    // ---- planning van UI-werk op AudioContext-tijd (lampjes) ----
    // De lampjes lopen via host.frame (alleen zichtbaar werk); loopt de wachtrij vol zonder dat de kaart te zien is, dan wordt het verlopen werk direct afgehandeld.
    let vq = [], stopFrame = null;
    const flush = () => {
      if (!vq.length) return;
      const now = ctx.currentTime;
      const due = vq.filter(q => q.time <= now + 0.01); vq = vq.filter(q => q.time > now + 0.01);
      due.forEach(q => { try { q.fn(); } catch (e) {} });
    };
    const at = (time, fn) => { vq.push({ time, fn }); if (vq.length > 256) flush(); };
    // werk dat het geluid raakt (CC) hangt niet af van de kaart in beeld: direct, of met een timer tot het tijdstip
    const timers = new Set();
    const later = (time, fn) => {
      const wait = (time - ctx.currentTime) * 1000;
      if (!(wait > 10)) { try { fn(); } catch (e) {} return; }
      const id = setTimeout(() => { timers.delete(id); if (!dead) { try { fn(); } catch (e) {} } }, wait); timers.add(id);
    };

    // ---- UI (Shadow DOM) ----
    const BLACK = [1, 3, 6, 8, 10], WHITE_W = 18, MIN_WHITES = 8, TOP = 108, BOTTOM = 21;
    const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
    const keyEls = new Map(), lit = new Map();
    let root = null, kbBox = null, kbLab = null, kbN = 0, ro = null, self = null, dead = false;
    const ui = { ctl: {}, models: {}, oct: {}, rotary: null, sus: null };

    const paintKey = m => { const k = keyEls.get(m); if (k) k.classList.toggle('on', (lit.get(m) || 0) > 0); };
    const light = (m, on) => { lit.set(m, Math.max(0, (lit.get(m) || 0) + (on ? 1 : -1))); paintKey(m); };
    const lightAt = (m, t, dur) => { at(t, () => light(m, true)); at(t + Math.max(0.06, dur), () => light(m, false)); };

    const whiteCount = () => Math.max(MIN_WHITES, Math.floor(((kbBox && kbBox.clientWidth) || 270) / WHITE_W));
    function buildKb() {
      if (!kbBox) return;
      kbBox.innerHTML = ''; keyEls.clear();
      kbN = whiteCount();
      const whites = [];
      for (let m = state.kbBase; whites.length < kbN && m <= TOP; m++) if (!BLACK.includes(m % 12)) whites.push(m);
      for (let m = state.kbBase - 1; whites.length < kbN && m >= BOTTOM; m--) if (!BLACK.includes(m % 12)) whites.unshift(m); // bovenin vol: groei omlaag
      const lo = whites[0], hi = whites[whites.length - 1];
      const full = whites.length < kbN, boxW = kbBox.clientWidth || whites.length * WHITE_W;
      const U = full ? 'px' : '%', ww = full ? WHITE_W : 100 / whites.length, off = full ? (boxW - whites.length * WHITE_W) / 2 : 0;
      if (kbLab) kbLab.textContent = `${noteName(lo)}–${noteName(hi)} · ${hi - lo + 1} ${tx('toetsen')}`;
      whites.forEach((m, i) => {
        const k = document.createElement('div'); k.className = 'w'; k.dataset.m = m;
        k.style.left = (off + i * ww) + U; k.style.width = ww + U;
        if (m % 12 === 0) k.textContent = 'C' + (m / 12 - 1);
        kbBox.appendChild(k); keyEls.set(m, k);
      });
      for (let m = lo; m <= hi; m++) {
        if (!BLACK.includes(m % 12)) continue;
        const idx = whites.findIndex(w => w > m); if (idx < 1) continue;
        const k = document.createElement('div'); k.className = 'b'; k.dataset.m = m;
        k.style.left = (off + idx * ww - ww * 0.32) + U; k.style.width = (ww * 0.64) + U;
        kbBox.appendChild(k); keyEls.set(m, k);
      }
      keyEls.forEach((k, m) => paintKey(m));
    }
    const velY = (k, y) => { const r = k.getBoundingClientRect(); return 0.45 + 0.55 * clamp((y - r.top) / (r.height || 1), 0, 1); };
    const press = (pid, k, y) => {
      const m = +k.dataset.m, vel = velY(k, y), t0 = ctx.currentTime;
      sustained.delete(m);
      noteOn(m, vel, t0, 0); light(m, true); held.set(pid, { m, t0, vel });
    };
    const lift = pid => {
      const h = held.get(pid); if (!h) return; held.delete(pid);
      const now = ctx.currentTime;
      if (sustain) sustained.add(h.m); else { noteOff(h.m, now, false); light(h.m, false); }
      host.emit(self, 'played', { type: 'note', note: h.m - 12 * state.oct, vel: h.vel, time: h.t0, dur: Math.max(0.05, now - h.t0) });
    };

    const CSS = `
:host{display:block}
.sk{container-type:inline-size;display:grid;gap:8px;min-width:0;color:var(--fg,#dce1e8);
  font:11px/1.4 var(--mono,ui-monospace,Menlo,monospace);
  --ln:var(--line,#2a3039);--c2:var(--card-2,#1e232c);--mu:var(--muted,#7d8794);--ev:var(--event,#f4a261);--au:var(--audio,#4fd1c5);--md:var(--sel,#9b8cff);--st:var(--stop,#e4574a)}
button{font:500 12px/1 var(--disp,system-ui,sans-serif);letter-spacing:.1em;text-transform:uppercase;background:var(--c2);color:inherit;border:1px solid var(--ln);border-radius:3px;padding:5px 8px;cursor:pointer;min-width:0}
button:hover{border-color:var(--au)}
button:focus-visible,input:focus-visible{outline:1px solid var(--au);outline-offset:2px}
button[aria-pressed="true"]{background:var(--ev);border-color:var(--ev);color:#160e05}
button.sus[aria-pressed="true"]{background:var(--md);border-color:var(--md)}
.bar{display:flex;align-items:center;gap:6px;min-width:0}
.bar .rng{flex:1;min-width:0;color:var(--mu);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kb{position:relative;height:72px;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
@container (min-width:640px){.kb{height:92px}}
.kb .w,.kb .b{position:absolute;top:0;box-sizing:border-box}
.kb .w{height:100%;background:#e8e4dc;border:1px solid #6b665e;border-radius:0 0 3px 3px;z-index:1;display:flex;align-items:flex-end;justify-content:center;font-size:8px;color:#6b665e;padding-bottom:2px}
.kb .b{height:58%;background:#1a1d22;border:1px solid #000;border-radius:0 0 2px 2px;z-index:2}
.kb .w.on{background:#f4c08a}.kb .b.on{background:var(--ev)}
.models{display:flex;flex-wrap:wrap;gap:4px}
.models button{flex:1 1 auto}
.ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px 16px}
.ctl{display:grid;grid-template-columns:64px minmax(0,1fr) 44px;align-items:center;gap:6px;min-width:0}
.ctl .nm{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctl output{font-size:10px;text-align:right;font-variant-numeric:tabular-nums}
.ctl .tr{position:relative;min-width:0;display:grid}
.ctl input{width:100%;margin:0;accent-color:var(--au)}
.ctl .mk{position:absolute;bottom:-3px;width:2px;height:6px;background:var(--md);border-radius:1px;transform:translateX(-1px);pointer-events:none}
.ctl .mk[hidden]{display:none}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.seg{display:inline-flex}.seg button{border-radius:0;padding:5px 7px}.seg button+button{border-left:0}
.seg button:first-child{border-radius:3px 0 0 3px}.seg button:last-child{border-radius:0 3px 3px 0}
.lab{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}
@container (max-width:330px){.ctl{grid-template-columns:54px minmax(0,1fr) 40px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

    const mk = (tag, cls, parent, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; if (parent) parent.appendChild(e); return e; };
    const pressed = (b, on) => { if (b) b.setAttribute('aria-pressed', String(!!on)); };

    function paintCtl(p) {
      const c = ui.ctl[p.id]; if (!c) return;
      c.input.value = state[p.key]; c.out.textContent = p.fmt(state[p.key]);
      const o = +mod[p.id] || 0;
      if (o) { const e = eff(p.id), pos = p.scale === 'log' ? Math.log(e / p.min) / Math.log(p.max / p.min) : (e - p.min) / (p.max - p.min); c.mk.style.left = (clamp(pos, 0, 1) * 100) + '%'; c.mk.hidden = false; c.mk.title = tx('Gestuurd: ') + p.fmt(e); }
      else c.mk.hidden = true;
    }
    function paintToggles() {
      INST_IDS.forEach(k => pressed(ui.models[k], k === state.inst));
      [-2, -1, 0, 1, 2].forEach(o => pressed(ui.oct[o], o === state.oct));
      pressed(ui.rotary, state.rotaryFast); if (ui.rotary) ui.rotary.textContent = tx(state.rotaryFast ? 'Rotary snel' : 'Rotary traag');
      pressed(ui.sus, sustain);
      const tc = ui.ctl.tone; if (tc) tc.nm.textContent = tx(MODELS[state.inst].tone);
    }
    const paintAll = () => { PARAMS.forEach(paintCtl); paintToggles(); buildKb(); };

    function setInst(k) {
      if (!INST_IDS.includes(k) || k === state.inst) return;
      state.inst = k; paintToggles();
      if (host.paramsChanged) host.paramsChanged(self);   // de naam van 'Toon' volgt het model
    }

    // CC-ingang: genormaliseerd 0..1 -> bereik van de parameter (zet de knop, zoals een fader)
    const CC = { tone: 'tone', cutoff: 'tone', timbre: 'tone', bark: 'tone', drawbars: 'tone', drive: 'drive', tremolo: 'trem', trem: 'trem', tremrate: 'tremrate', rate: 'tremrate', tune: 'tune', level: 'lvl', volume: 'lvl', lvl: 'lvl' };
    function onCC(ev) {
      const id = String(ev.id || '').toLowerCase(), v = clamp(+ev.value, 0, 1);
      if (!isFinite(v)) return;
      const t = typeof ev.time === 'number' && isFinite(ev.time) ? Math.max(ev.time, ctx.currentTime) : ctx.currentTime;
      if (id === 'sustain' || id === 'pedal') { later(t, () => setSustain(v >= 0.5, ctx.currentTime)); return; }
      if (id === 'rotary') { later(t, () => { state.rotaryFast = v >= 0.5; apply(); paintToggles(); }); return; }
      if (id === 'model' || id === 'inst') { later(t, () => setInst(INST_IDS[Math.min(INST_IDS.length - 1, Math.floor(v * INST_IDS.length))])); return; }
      const p = Object.hasOwn(CC, id) ? PBY[CC[id]] : null; if (!p) return;
      const val = p.scale === 'log' ? p.min * Math.pow(p.max / p.min, v) : p.min + v * (p.max - p.min);
      later(t, () => { state[p.key] = +val.toFixed(4); apply(); paintCtl(p); });
    }

    self = {
      inputs: {}, outputs: { out },
      mount(el) {
        const wrap = document.createElement('div'); el.appendChild(wrap);
        root = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;   // oudere hosts: gewone DOM
        const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
        const app = mk('div', 'sk', root);

        // klavierbalk
        const bar = mk('div', 'bar', app);
        const down = mk('button', '', bar, '◀'); down.title = tx('Klavier een octaaf lager');
        kbLab = mk('span', 'rng', bar);
        ui.sus = mk('button', 'sus', bar, 'Sustain'); ui.sus.title = tx('Sustainpedaal (ook via cc "sustain")');
        const up = mk('button', '', bar, '▶'); up.title = tx('Klavier een octaaf hoger');
        down.onclick = () => { state.kbBase = Math.max(24, state.kbBase - 12); buildKb(); };
        up.onclick = () => { state.kbBase = Math.min(96, state.kbBase + 12); buildKb(); };
        ui.sus.onclick = () => setSustain(!sustain);

        // klavier: aantal toetsen volgt de kaartbreedte
        kbBox = mk('div', 'kb', app); kbBox.setAttribute('aria-label', tx('Klavier'));
        kbBox.addEventListener('pointerdown', e => {
          const k = e.target; if (!k || !k.dataset || k.dataset.m === undefined) return;
          e.stopPropagation(); if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
          try { kbBox.setPointerCapture(e.pointerId); } catch (err) {}
          press(e.pointerId, k, e.clientY);
        });
        kbBox.addEventListener('pointermove', e => {
          const h = held.get(e.pointerId); if (!h) return;
          const k = (root.elementFromPoint ? root : document).elementFromPoint(e.clientX, e.clientY);
          if (k && k.dataset && k.dataset.m !== undefined && +k.dataset.m !== h.m && kbBox.contains(k)) { lift(e.pointerId); press(e.pointerId, k, e.clientY); }
        });
        kbBox.addEventListener('pointerup', e => lift(e.pointerId));
        kbBox.addEventListener('pointercancel', e => lift(e.pointerId));
        if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { if (whiteCount() !== kbN) buildKb(); }); ro.observe(kbBox); }

        // model
        const models = mk('div', 'models', app);
        INST_IDS.forEach(k => { const b = mk('button', '', models, tx(MODELS[k].name)); b.onclick = () => setInst(k); ui.models[k] = b; });

        // knoppen (de paarse streep toont waar sturing de waarde nu heen trekt)
        const ctrls = mk('div', 'ctrls', app);
        PARAMS.forEach(p => {
          const row = mk('label', 'ctl', ctrls);
          const nm = mk('span', 'nm', row, tx(p.name));
          const tr = mk('span', 'tr', row);
          const input = mk('input', '', tr); input.type = 'range'; input.min = p.min; input.max = p.max; input.step = p.step; input.value = state[p.key];
          input.setAttribute('aria-label', tx(p.name)); input.dataset.pkDefault = String(DEFAULTS[p.key]);
          if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(input, { id: p.key, role: 'param', group: 'sound', label: tx(p.name) }); } catch (e) { /* oud contract */ } }
          const mkr = mk('i', 'mk', tr); mkr.hidden = true;
          const o = mk('output', '', row, p.fmt(state[p.key]));
          input.oninput = () => { state[p.key] = +input.value; apply(); paintCtl(p); };
          ui.ctl[p.id] = { input, out: o, mk: mkr, nm };
        });

        // rotary en octaaf
        const row = mk('div', 'row', app);
        ui.rotary = mk('button', '', row, tx('Rotary traag')); ui.rotary.title = tx('Rotary-snelheid: traag 0,7 Hz / snel 6,6 Hz');
        ui.rotary.onclick = () => { state.rotaryFast = !state.rotaryFast; apply(); paintToggles(); };
        mk('span', 'lab', row, tx('Octaaf'));
        const seg = mk('div', 'seg', row);
        [-2, -1, 0, 1, 2].forEach(o => { const b = mk('button', '', seg, o > 0 ? '+' + o : o < 0 ? '−' + -o : '0'); b.onclick = () => { state.oct = o; paintToggles(); }; ui.oct[o] = b; });

        paintAll();
        if (typeof host.frame === 'function') stopFrame = host.frame(self, flush, 30);
      },
      unmount() {
        if (stopFrame) { stopFrame(); stopFrame = null; }
        if (ro) { ro.disconnect(); ro = null; }
      },
      onEvent(port, ev) {
        try {
          if (!ev) return;
          if (ev.type === 'cc') { onCC(ev); return; }
          const type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
          if (type === 'panic' || type === 'allnotesoff') { silenceAll(false); sustained.clear(); return; }
          if (!['note', 'noteon', 'noteoff'].includes(type) || typeof ev.note !== 'number' || !isFinite(ev.note)) return;
          const t = typeof ev.time === 'number' && isFinite(ev.time) ? Math.min(Math.max(ev.time, ctx.currentTime), ctx.currentTime + 30) : ctx.currentTime;   // een noot hoogstens 30 s vooruit: een tijd ver in de toekomst liet een stem hangen die Stop niet meer bereikte
          const m = Math.round(ev.note) + 12 * state.oct;
          if (type === 'noteoff' || ev.vel === 0 || ev.off) { if (!sustain) noteOff(m, t, false); return; }
          const vel = typeof ev.vel === 'number' && isFinite(ev.vel) ? ev.vel : 0.8, dur = ev.held || type === 'noteon' ? 0 : typeof ev.dur === 'number' && isFinite(ev.dur) ? Math.min(ev.dur, 3600) : 0.3;   // een aangehouden toets (held, noteon) klinkt tot zijn noteoff
          if (sustain) { noteOn(m, vel, t, 0); sustained.add(m); at(t, () => light(m, true)); }
          else { noteOn(m, vel, t, dur); lightAt(m, t, dur); }
        } catch (e) { /* nooit de planner laten struikelen */ }
      },
      onTransport({ playing }) {
        if (playing) return;
        silenceAll(false); sustained.clear();
        vq = []; lit.clear(); keyEls.forEach((k, m) => paintKey(m));
      },
      params() {
        return PARAMS.map(p => ({ id: p.id, name: tx(p.id === 'tone' ? (MODELS[state.inst] || MODELS.tine).tone : p.name), lane: 'keys', laneName: 'Stage Keys',
          min: p.min, max: p.max, scale: p.scale, role: p.role, drift: p.drift, on: p.on }));
      },
      modulate(offsets) {
        for (const k in mod) delete mod[k];
        if (offsets && typeof offsets === 'object') for (const k in offsets) if (Object.hasOwn(PBY, k) && isFinite(offsets[k])) mod[k] = clamp(+offsets[k], -1, 1);
        apply(); PARAMS.forEach(paintCtl);
      },
      getPreset() { const p = self.getState(); delete p.kbBase; return p; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), kbBase: state.kbBase }); },
      getState() {
        return { inst: state.inst, tone: state.tone, drive: state.drive, tremRate: state.tremRate, tremDepth: state.tremDepth, tune: state.tune,
          rotaryFast: state.rotaryFast, oct: state.oct, lvl: state.lvl, kbBase: state.kbBase };
      },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
        state.inst = INST_IDS.includes(s.inst) ? s.inst : DEFAULTS.inst;
        state.tone = num(s.tone, DEFAULTS.tone, 0, 1);
        state.drive = num(s.drive, DEFAULTS.drive, 0, 1);
        state.tremRate = num(s.tremRate, DEFAULTS.tremRate, 0.5, 12);
        state.tremDepth = num(s.tremDepth, DEFAULTS.tremDepth, 0, 1);
        state.tune = num(s.tune, DEFAULTS.tune, -50, 50);
        state.rotaryFast = typeof s.rotaryFast === 'boolean' ? s.rotaryFast : DEFAULTS.rotaryFast;
        state.oct = [-2, -1, 0, 1, 2].includes(s.oct) ? s.oct : DEFAULTS.oct;
        state.lvl = num(s.lvl, DEFAULTS.lvl, 0, 1);
        state.kbBase = num(s.kbBase, DEFAULTS.kbBase, 24, 96);
        apply(); if (root) paintAll();
      },
      destroy() {
        if (stopFrame) { stopFrame(); stopFrame = null; }
        if (ro) { ro.disconnect(); ro = null; }
        timers.forEach(clearTimeout); timers.clear(); vq = [];
        if (dead) return; dead = true;
        try { silenceAll(true); } catch (e) {}
        try { lfo.stop(); } catch (e) {}
        [sum, shaper, tremL, tremR, panL, panR, lfoL, lfoR, out].forEach(n => { try { n.disconnect(); } catch (e) {} });
        voices.clear(); retired = [];
      },
    };
    apply();
    return self;
  },
};
