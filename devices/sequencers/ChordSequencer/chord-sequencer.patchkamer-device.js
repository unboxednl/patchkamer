// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Chord Sequencer (nieuwe id nl.patchkamer.chordsequencer, eigen map in sequencers; voorheen Puls Sequencer,
//   nl.patchkamer.puls, in de map synths). Songs en presets uit die tijd verwijzen naar de oude id en laden hier niet in. De noten die het naar de
//   uitgangen stuurt zijn gelijk aan die van het oude bestand (zelfde state en zelfde klokstappen geven dezelfde gebeurtenissen).
//   - tweetalig (host.lang, namen van de poorten per taal in i18n); de naam is in alle talen Chord Sequencer
//   - de standaardnamen van de vier sporen (Chords, Bass, Pulse, Bells) staan niet meer als tekst in de state maar als lege naam: ze volgen de taal;
//     de oude Nederlandse standaardnamen worden bij het laden herkend en lege namen. Een zelf getypte naam blijft staan
//   - kleuren volgen de CSS-variabelen van de host (--audio, --event, --sel, ...); de stapcursor gebruikt --sel
//   - dubbelklik op een regelaar zet hem terug op de beginwaarde (data-pk-default)
//   - de tekenpoort (__pkRaf/__pkWrap) en de ongebruikte scope, vervormer, compressor en toetsenbordstijlen zijn weg; het apparaat tekent niets bewegends
// Een sequencer voor akkoorden en patronen met vier onafhankelijke sporen (A–D). Elk spoor kent een grondtoon, een akkoordsoort, een omkeerligging,
// een speelwijze (volledig akkoord, arpeggio of alleen de grondtoon), een patroon van 1 tot 16 stappen, een nootdeling, speelkans en herhalingen per
// stap. Vier scènes bewaren elk een eigen set van vier sporen; de scène wisselt direct of op de volgende maat. Elke maat kiest het volgende getal uit
// de progressie van het spoor. De noten gaan als gebeurtenissen naar de uitgangen A–D; er komt geen geluid uit dit apparaat.
const EN = {
  'CHORD SEQUENCER · akkoord- en patroonsequencer': 'CHORD SEQUENCER · chord and pattern sequencer',
  'Vier onafhankelijke sporen → vier synths. Alles volgt de klok van de studio.': 'Four independent tracks → four synths. Everything follows the studio clock.',
  'Scène {0}': 'Scene {0}', 'Scènewissel': 'Scene change', 'Volgende maat': 'Next bar', 'Direct': 'Immediately',
  'Kopieer scène naar volgende': 'Copy scene to next', 'Alles uit': 'All off', 'Bewerk spoor': 'Edit track', 'Spoornaam': 'Track name',
  'Actief': 'Active', 'Uit': 'Off', 'Aan': 'On', 'Spel': 'Play', 'Volledig akkoord': 'Full chord', 'Arpeggio': 'Arpeggio', 'Alleen grondtoon': 'Root only',
  'Akkoord': 'Chord', 'Nootdeling': 'Note division', 'Grondtoon MIDI': 'Root (MIDI)', 'Omkeerligging': 'Inversion', 'Patroonlengte': 'Pattern length',
  'Herhalingen per stap': 'Repeats per step', 'Speelkans': 'Probability', 'Progressie per maat (0,3,-2,5)': 'Progression per bar (0,3,-2,5)',
  'Uitgangen A–D horen bij sporen A–D.': 'Outputs A–D belong to tracks A–D.',
  'Verschillende patroonlengtes lopen onafhankelijk. Elke maat kiest het volgende progressiegetal; vier maten vormen de cyclus. Transpositie op de ingang gebruikt C4 / MIDI 60 als nul. Een volledig akkoord gaat als losse, gelijktijdige noten naar de uitgang: gebruik daarvoor een polyfone synth.':
    'Different pattern lengths run independently. Each bar picks the next progression number; four bars make the cycle. Transpose on the input uses C4 / MIDI 60 as zero. A full chord goes to the output as separate, simultaneous notes: use a polyphonic synth for it.',
  'Scène {0} op de volgende maat': 'Scene {0} on the next bar', 'volgende': 'next',
  'Spoor {0}': 'Track {0}', 'Akkoorden': 'Chords', 'Bas': 'Bass', 'Puls': 'Pulse', 'Bellen': 'Bells', 'Transpositie': 'Transpose'
};
const LEGACY_NAMES = ['Akkoorden', 'Bas', 'Puls', 'Bellen'];
export default {
  id: 'nl.patchkamer.chordsequencer', name: 'Chord Sequencer', version: '1.11.0', kind: 'utility', category: 'sequencer', ui: { width: 840, minWidth: 380 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'transpose', name: 'Transpose' }], eventOut: [{ id: 'a', name: 'Track A' }, { id: 'b', name: 'Track B' }, { id: 'c', name: 'Track C' }, { id: 'd', name: 'Track D' }], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { transpose: 'Transpositie', a: 'Spoor A', b: 'Spoor B', c: 'Spoor C', d: 'Spoor D' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let mountHost = null, panel = null;
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function mountUI(el, title, subtitle) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow({ mode: 'open' });
      add(shadow, 'style', `:host{display:block;color:var(--fg);font:13px system-ui,sans-serif;--x-acc:var(--audio);--x-acc2:var(--event);--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg))}.app{container-type:inline-size;background:var(--card);border-radius:10px;padding:14px;box-sizing:border-box}h2{margin:0 0 5px;font-size:20px;letter-spacing:1px;color:var(--x-ink)}p{line-height:1.5;color:var(--muted);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted)}button,select,input{font:inherit;color:var(--field-fg);background:var(--field);border:1px solid var(--line);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}button.active{background:color-mix(in srgb,var(--x-acc) 38%,var(--field));border-color:var(--x-acc)}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pads button{min-height:64px;text-align:left;white-space:pre-line}label{min-width:0}`);
      panel = add(shadow, 'div', undefined); panel.className = 'app'; add(panel, 'h2', title); if (subtitle) add(panel, 'p', subtitle); return panel;
    }
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; }
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, label, bounds, value, change, format, def) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.dataset.pkDefault = String(def);
      input.addEventListener('pointerdown', e => e.stopPropagation()); input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; return input;
    }

    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    let dead = false, mod = {}, state, effective = {};
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(state[id] + x * (d.max - d.min), d.min, d.max); } effective = e; return e; }
    function descriptors() { return Object.entries(spec).map(([id, d]) => ({ id, name: d.name, lane: d.lane, laneName: d.laneName, min: d.min, max: d.max, scale: 'lin', role: d.role, drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); }
    function receiveMod(raw) { mod = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in spec) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1); apply(); }
    function numeric(raw, defaults) { const next = { ...defaults }; for (const [id, d] of Object.entries(spec)) next[id] = finite(raw?.[id], defaults[id], d.min, d.max); return next; }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    const stepDuration = info => Number.isFinite(info?.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info?.bpm) && info.bpm > 0 ? 15 / info.bpm : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0;
    const defaultName = i => tx(['Akkoorden', 'Bas', 'Puls', 'Bellen'][i]);

    const spec = {};
    for (let i = 0; i < 4; i++) for (const [key, name, min, max, role] of [['gate', 'Gate', 0.1, 1.5, 'env'], ['velocity', 'Velocity', 0.05, 1, 'level'], ['transpose', tx('Transpositie'), -24, 24, 'pitch']]) spec['t' + i + key] = { name, min, max, role, lane: 'track' + i, laneName: tx('Spoor {0}', i + 1) };
    const qualities = { major: [0, 4, 7], minor: [0, 3, 7], sus: [0, 5, 7], minor7: [0, 3, 7, 10], fifth: [0, 7], single: [0] };
    const track = i => ({ name: '', enabled: i < 2, root: [48, 36, 60, 72][i], quality: i === 1 ? 'single' : 'minor', inversion: 0, mode: i === 1 ? 'arp' : 'chord', length: [16, 12, 7, 5][i], division: [4, 2, 1, 2][i], steps: Array.from({ length: 16 }, (_, j) => i === 0 ? +(j % 4 === 0) : 1), progression: [0, 3, -2, 5], probability: 1, ratchet: 1 });
    const defaultScenes = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, (_, i) => track(i)));
    const defaults = { scene: 0, editTrack: 0, editStep: 0, launch: 'bar', seed: 18743, ...Object.fromEntries(Object.keys(spec).map(id => [id, id.endsWith('gate') ? 0.7 : id.endsWith('velocity') ? 0.8 : 0])) };
    state = { ...defaults }; let scenes = defaultScenes(), playing = null, queuedScene = null, counters = [0, 0, 0, 0], last = '', gen = 18743, queue = [], transposeNote = 0, infoText = null, stepButtons = [], localBar = 0, previousStep = -1; resolve();
    function reset() { localBar = 0; previousStep = -1; counters = [0, 0, 0, 0]; last = ''; queue = []; transposeNote = 0; gen = state.seed; }
    function emit(port, e) { if (!dead) host.emit(self, port, e); }
    function panic(t = ctx.currentTime) { for (const port of ['a', 'b', 'c', 'd']) emit(port, { type: 'allnotesoff', time: t }); }
    function consume(t) { while (queue.length && queue[0].time <= t) { const e = queue.shift(), type = cleanType(e); if (type === 'note' || type === 'noteon') transposeNote = clamp(Math.round(e.note) - 60, -36, 36); else if (type === 'panic' || type === 'allnotesoff') transposeNote = 0; } }
    function random() { gen = (Math.imul(gen, 1664525) + 1013904223) >>> 0; return gen / 4294967296; }
    function cleanTrack(raw, i) { const d = track(i), r = raw || {}; return { name: typeof r.name === 'string' && r.name !== LEGACY_NAMES[i] ? r.name.slice(0, 40) : d.name, enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled, root: Math.round(finite(r.root, d.root, 24, 96)), quality: Object.hasOwn(qualities, r.quality) ? r.quality : d.quality, inversion: Math.round(finite(r.inversion, 0, 0, 3)), mode: ['chord', 'arp', 'pulse'].includes(r.mode) ? r.mode : d.mode, length: Math.round(finite(r.length, d.length, 1, 16)), division: [1, 2, 4, 8].includes(r.division) ? r.division : d.division, steps: Array.from({ length: 16 }, (_, j) => Math.round(finite(r.steps?.[j], d.steps[j], 0, 1))), progression: Array.from({ length: 4 }, (_, j) => Math.round(finite(r.progression?.[j], d.progression[j], -24, 24))), probability: finite(r.probability, 1, 0, 1), ratchet: Math.round(finite(r.ratchet, 1, 1, 4)) }; }
    function apply() { resolve(); }
    function launch(index) { if (state.launch === 'now' || playing === false) { panic(); state.scene = index; counters = [0, 0, 0, 0]; queuedScene = null; } else queuedScene = index; if (infoText) infoText.textContent = queuedScene === null ? tx('Scène {0}', state.scene + 1) : tx('Scène {0} op de volgende maat', index + 1); }
    function controls(parent, ids) { for (const id of ids) { const d = spec[id], format = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)); knob(parent, d.name, [d.min, d.max, 0.01], state[id], x => { state[id] = x; apply(); }, format, defaults[id]); } }
    function render(el) {
      unmount(); mountUI(el, tx('CHORD SEQUENCER · akkoord- en patroonsequencer'), tx('Vier onafhankelijke sporen → vier synths. Alles volgt de klok van de studio.'));
      const top = row(panel);
      for (let i = 0; i < 4; i++) { const b = button(top, tx('Scène {0}', i + 1), () => launch(i)); if (i === state.scene) b.classList.add('active'); }
      select(top, tx('Scènewissel'), [['bar', tx('Volgende maat')], ['now', tx('Direct')]], state.launch, v => state.launch = v);
      button(top, tx('Kopieer scène naar volgende'), () => { scenes[(state.scene + 1) % 4] = scenes[state.scene].map((t, i) => cleanTrack(t, i)); });
      button(top, tx('Alles uit'), () => panic());
      const selectRow = row(panel);
      select(selectRow, tx('Bewerk spoor'), scenes[state.scene].map((t, i) => [i, String.fromCharCode(65 + i) + ' · ' + (t.name || defaultName(i))]), state.editTrack, v => { state.editTrack = +v; render(el); });
      const tr = scenes[state.scene][state.editTrack], i = state.editTrack, dt = track(i); const edit = grid(panel);
      const nameBox = add(edit, 'label'); nameBox.className = 'control'; add(nameBox, 'span', tx('Spoornaam'));
      const nameInput = add(nameBox, 'input'); nameInput.type = 'text'; nameInput.value = tr.name || defaultName(i); nameInput.addEventListener('pointerdown', e => e.stopPropagation());
      nameInput.onchange = () => { const v = nameInput.value.slice(0, 40); tr.name = v === defaultName(i) ? '' : v; };
      select(edit, tx('Actief'), [[0, tx('Uit')], [1, tx('Aan')]], +tr.enabled, v => { tr.enabled = v === '1'; if (!tr.enabled) emit(['a', 'b', 'c', 'd'][i], { type: 'allnotesoff', time: ctx.currentTime }); });
      select(edit, tx('Spel'), [['chord', tx('Volledig akkoord')], ['arp', tx('Arpeggio')], ['pulse', tx('Alleen grondtoon')]], tr.mode, v => tr.mode = v);
      select(edit, tx('Akkoord'), Object.keys(qualities).map(k => [k, k]), tr.quality, v => tr.quality = v);
      select(edit, tx('Nootdeling'), [[1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2']], tr.division, v => tr.division = +v);
      for (const [id, label, min, max] of [['root', 'Grondtoon MIDI', 24, 96], ['inversion', 'Omkeerligging', 0, 3], ['length', 'Patroonlengte', 1, 16], ['ratchet', 'Herhalingen per stap', 1, 4]]) knob(edit, tx(label), [min, max, 1], tr[id], v => tr[id] = v, v => String(v), dt[id]);
      knob(edit, tx('Speelkans'), [0, 1, 0.01], tr.probability, v => tr.probability = v, v => Number(v).toFixed(2), 1);
      const progBox = add(edit, 'label'); progBox.className = 'control'; add(progBox, 'span', tx('Progressie per maat (0,3,-2,5)'));
      const progInput = add(progBox, 'input'); progInput.type = 'text'; progInput.value = tr.progression.join(','); progInput.addEventListener('pointerdown', e => e.stopPropagation());
      progInput.onchange = () => { tr.progression = Array.from({ length: 4 }, (_, j) => Math.round(finite(Number(progInput.value.split(',')[j]), 0, -24, 24))); };
      const steps = add(panel, 'div'); steps.className = 'pads';
      stepButtons = tr.steps.map((on, j) => button(steps, (j + 1) + (on ? ' ●' : ' ·'), () => { tr.steps[j] = 1 - tr.steps[j]; render(el); }));
      controls(grid(panel), ['t' + i + 'gate', 't' + i + 'velocity', 't' + i + 'transpose']);
      infoText = add(panel, 'p', tx('Uitgangen A–D horen bij sporen A–D.'));
      add(panel, 'p', tx('Verschillende patroonlengtes lopen onafhankelijk. Elke maat kiest het volgende progressiegetal; vier maten vormen de cyclus. Transpositie op de ingang gebruikt C4 / MIDI 60 als nul. Een volledig akkoord gaat als losse, gelijktijdige noten naar de uitgang: gebruik daarvoor een polyfone synth.'));
    }
    function unmount() { clearUI(); }
    const PRESET_SKIP = ['editTrack', 'editStep'];  // contract v1.6: werkstand, geen klank — een preset laat dit staan
    const self = {
      inputs: {}, outputs: {}, mount: render, unmount() { infoText = null; stepButtons = []; unmount(); },
      onEvent(port, e) { try { if (dead || port !== 'transpose' || !Number.isFinite(e?.time)) return; if (['note', 'noteon', 'panic', 'allnotesoff'].includes(cleanType(e)) && (Number.isFinite(e.note) || ['panic', 'allnotesoff'].includes(cleanType(e)))) { queue.push({ ...e }); queue.sort((a, b) => a.time - b.time); if (queue.length > 128) queue.shift(); } } catch {} },
      onTransport(e) { if (dead) return; playing = !!e?.playing; reset(); if (!playing) { queuedScene = null; panic(); } },
      onStep(info) {
        try {
          if (dead || playing === false || !Number.isFinite(info?.time) || !Number.isInteger(info.step)) return; const sd = stepDuration(info); if (!sd) return;
          const key = info.time + ':' + info.step; if (key === last) return; last = key;
          if (queuedScene !== null && info.step === 0) { panic(info.time); state.scene = queuedScene; queuedScene = null; counters = [0, 0, 0, 0]; }
          consume(info.time); if (info.step < previousStep) localBar++; previousStep = info.step; const bar = Number.isInteger(info.bar) ? info.bar : localBar;
          for (let i = 0; i < 4; i++) {
            const tr = scenes[state.scene][i]; if (info.step % tr.division) continue; const count = counters[i]++, j = count % tr.length;
            if (i === state.editTrack) for (let k = 0; k < stepButtons.length; k++) stepButtons[k].style.borderColor = j === k ? 'var(--sel)' : '';
            if (!tr.enabled || !tr.steps[j] || random() > tr.probability) continue;
            let intervals = qualities[tr.quality].slice(); for (let n = 0; n < tr.inversion; n++) intervals.push(intervals.shift() + 12);
            const root = tr.root + tr.progression[((bar % 4) + 4) % 4] + Math.round(effective['t' + i + 'transpose']) + transposeNote, list = intervals.map(x => Math.round(clamp(root + x, 0, 127)));
            const selected = tr.mode === 'chord' ? list : tr.mode === 'pulse' ? [Math.round(clamp(root, 0, 127))] : [list[count % list.length]], duration = sd * tr.division / tr.ratchet;
            for (let r = 0; r < tr.ratchet; r++) for (const note of selected) emit(['a', 'b', 'c', 'd'][i], { type: 'note', note, vel: effective['t' + i + 'velocity'], time: info.time + r * duration, dur: duration * effective['t' + i + 'gate'] });
          }
          if (infoText) infoText.textContent = tx('Scène {0}', state.scene + 1) + ' · ' + Math.round(15 / sd) + ' BPM' + (queuedScene !== null ? ' · ' + tx('volgende') + ': ' + (queuedScene + 1) : '');
        } catch {}
      },
      params: descriptors, modulate: receiveMod,
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) { if (dead) return; const keep = {}; for (const k of PRESET_SKIP) if (k in state) keep[k] = state[k]; self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      getState() { return { ...state, scenes: scenes.map(s => JSON.stringify(s)) }; },
      setState(raw) {
        if (dead) return; panic(); const s = raw && typeof raw === 'object' ? raw : {}; state = numeric(s, defaults);
        state.scene = Math.round(finite(s.scene, 0, 0, 3)); state.editTrack = Math.round(finite(s.editTrack, 0, 0, 3)); state.editStep = Math.round(finite(s.editStep, 0, 0, 15));
        state.launch = s.launch === 'now' ? 'now' : 'bar'; state.seed = Math.round(finite(s.seed, 18743, 0, 4294967295)); scenes = defaultScenes();
        if (Array.isArray(s.scenes)) for (let j = 0; j < 4; j++) if (typeof s.scenes[j] === 'string' && s.scenes[j].length < 30000) try { const a = JSON.parse(s.scenes[j]); if (Array.isArray(a)) scenes[j] = Array.from({ length: 4 }, (_, i) => cleanTrack(a[i], i)); } catch {}
        queuedScene = null; reset(); apply(); if (mountHost) render(mountHost);
      },
      destroy() { if (dead) return; panic(); dead = true; unmount(); }
    };
    apply(); return self;
  }
};
