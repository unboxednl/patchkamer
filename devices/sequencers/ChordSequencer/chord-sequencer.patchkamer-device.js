// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.18.0 — Uitleg naar about (menu Over Chord Sequencer); de UI toont geen uitlegtekst meer.
// 1.17.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in het definitieveld about.
// 1.16.0 — Patchkamer contract v1.24: klembord, scènes met meerdere sporen. `clipInfo()` meldt nu ook `multi` en `tracks` (de vier sporen van de actieve scène, allemaal `notes`), `getClip({ kind: 'multi' })` geeft de actieve scène als clip met vier sporen (akkoord-, arpeggio- en pulssporen als momentopname van vier maten, zoals bij één spoor) en `setClip` neemt een multi-clip: elk toegewezen spoor wordt een `notes`-spoor, niet toegewezen sporen blijven staan. Een scène van Chord Sequencer zelf die niet is aangepast komt via `native` exact terug (akkoorden, arpeggio's en instellingen). De gewone clip van het gekozen spoor, `getState`, presets, geluid en bestaande songs zijn gelijk aan 1.15.0. Niet beluisterd.
// 1.15.0 — Patchkamer contract v1.17: klembord voor patronen. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, tijd in tikken van 12 per zestiende, 3 per 1/64-eenheid). Het gekozen spoor van de actieve scène is een `notes`-clip van 1 tot 4 maten. Kopiëren van een akkoord-, arpeggio- of pulsspoor geeft een momentopname van een cyclus van vier maten als noten; plakken zet het gekozen spoor op de spelwijze Noten (de akkoordinstellingen blijven staan). `setState` stuurt alleen nog `allnotesoff` als de klok loopt of er live noten vastgehouden worden (bij stilstaande klok deed de transportstop dat al); de validator telt die gebeurtenis bij `setClip` anders als een eigen gebeurtenis van `setClip`. Verder niets gewijzigd: `getState`, presets, geluid en bestaande songs zijn gelijk aan 1.14.0.
// 1.14.0 — Extra swing per spoor en inspelen op het geswingde raster. Staat het veld swing niet in een spoor (= 0), dan speelt alles precies als voorheen.
//   - swing per spoor (`swing`, 0 … 0,5 van een zestiende, alleen in de state als het niet 0 is): een gebeurtenis in een oneven zestiende (stapspoor, ook de 1/32- en 1/64-stappen en ratchets die daarin vallen,
//     en de noten van de spelwijze `notes`) wordt (spoorswing) × stepDur later gespeeld, bovenop de swing van de host; even zestienden blijven staan
//   - inspelen kwantiseert naar het dichtstbijzijnde geswingde rasterpunt van het spoor (host + spoorswing), en de lengte wordt uit twee rasterpunten gemeten (niet meer uit seconden gedeeld door een gemiddelde stap)
//   - trig-gebeurtenissen met een noot op de ingang Live worden als korte noot doorgegeven en ingespeeld
// 1.11.1 — Nieuw (oude states en presets klinken gelijk; de nieuwe velden staan alleen in de state als ze van de standaard afwijken):
//   - live spelen: ingang `live` (Keys of elke notenbron). Het gekozen spoor (Edit track) stuurt de live noten door naar zijn uitgang, zodat de
//     gekoppelde synth klinkt zonder tweede kabel. Wisselen van spoor sluit hangende noten. Doorgeven kan uit (`thru`)
//   - inspelen: met `record` aan en de transport lopend worden live noten in het gekozen spoor geschreven (spelwijze `notes`), met velocity en lengte,
//     gekwantiseerd naar het raster (`rquant`)
//   - spelwijze `notes`: opgenomen of getekende noten ([positie, noot, velocity, lengte] in 1/64-eenheden, `bars` maten), met een piano roll waarin de
//     hoogte van een blokje de velocity en de breedte de lengte is, en bewerken van de gekozen noot
//   - velocity en lengte per stap (`vel`, `len`) in de staprij, zichtbaar als hoogte en breedte van het blokje
//   - raster per spoor (`grid`: 1 = 1/16, 2 = 1/32, 4 = 1/64): de stappen van het patroon duren dan 1/grid zo lang
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
  'Scène {0}': 'Scene {0}', 'Scènewissel': 'Scene change', 'Volgende maat': 'Next bar', 'Direct': 'Immediately',
  'Kopieer scène naar volgende': 'Copy scene to next', 'Alles uit': 'All off', 'Bewerk spoor': 'Edit track (live target)', 'Spoornaam': 'Track name',
  'Actief': 'Active', 'Uit': 'Off', 'Aan': 'On', 'Spel': 'Play', 'Volledig akkoord': 'Full chord', 'Arpeggio': 'Arpeggio', 'Alleen grondtoon': 'Root only',
  'Noten (opgenomen)': 'Notes (recorded)',
  'Akkoord': 'Chord', 'Nootdeling': 'Note division', 'Grondtoon MIDI': 'Root (MIDI)', 'Omkeerligging': 'Inversion', 'Patroonlengte': 'Pattern length',
  'Herhalingen per stap': 'Repeats per step', 'Speelkans': 'Probability', 'Progressie per maat (0,3,-2,5)': 'Progression per bar (0,3,-2,5)',
  'Uitgangen A–D horen bij sporen A–D.': 'Outputs A–D belong to tracks A–D.',
  'Scène {0} op de volgende maat': 'Scene {0} on the next bar', 'volgende': 'next',
  'Spoor {0}': 'Track {0}', 'Akkoorden': 'Chords', 'Bas': 'Bass', 'Puls': 'Pulse', 'Bellen': 'Bells', 'Transpositie': 'Transpose',
  'Live doorgeven': 'Live thru', 'Opnemen': 'Record', 'Kwantiseren': 'Quantize', 'Raster': 'Grid', 'Maten': 'Bars',
  'Velocity per stap (hoogte)': 'Velocity per step (height)', 'Lengte per stap (breedte)': 'Length per step (width)',
  'Nieuwe noot: velocity': 'New note: velocity', 'Nieuwe noot: lengte (rasterstappen)': 'New note: length (grid steps)',
  'Gekozen noot: velocity': 'Selected note: velocity', 'Gekozen noot: lengte (rasterstappen)': 'Selected note: length (grid steps)',
  'Verwijder noot': 'Delete note', 'Wis alle noten': 'Clear all notes', 
  'Het apparaat is verwijderd.': 'The device has been removed.', 'Geen geldige clip.': 'Not a valid clip.', 'De soort past niet: dit apparaat neemt noten.': 'The kind does not fit: this device takes notes.',
  'Pianoroll van de opgenomen noten': 'Piano roll of the recorded notes', 'geen noot gekozen': 'no note selected', 'noot {0} · positie {1}': 'note {0} · position {1}'
};
const LEGACY_NAMES = ['Akkoorden', 'Bas', 'Puls', 'Bellen'];
export default {
  id: 'nl.patchkamer.chordsequencer', name: 'Chord Sequencer', version: '1.18.0', about: { nl: 'Akkoord- en patroonsequencer: vier onafhankelijke sporen die elk een eigen synth sturen, allemaal op de klok van de studio.\n\nKlik in het rooster om een noot te zetten; klik op een blokje om het te kiezen. Hoogte van het blokje = velocity, breedte = lengte.\n\nVerschillende patroonlengtes lopen onafhankelijk. Elke maat kiest het volgende progressiegetal; vier maten vormen de cyclus. Transpositie op de ingang gebruikt C4 / MIDI 60 als nul. Een volledig akkoord gaat als losse, gelijktijdige noten naar de uitgang: gebruik daarvoor een polyfone synth.\n\nLive: sluit een toetsenbord (Keys) aan op de ingang Live. Het gekozen spoor stuurt de noten door naar zijn uitgang; met Opnemen aan en de transport lopend worden ze in het spoor geschreven (spelwijze Noten).', en: 'Chord and pattern sequencer: four independent tracks that each drive their own synth, all on the studio clock.\n\nClick in the grid to place a note; click a block to select it. Block height = velocity, width = length.\n\nDifferent pattern lengths run independently. Each bar picks the next progression number; four bars make the cycle. Transpose on the input uses C4 / MIDI 60 as zero. A full chord goes to the output as separate, simultaneous notes: use a polyphonic synth for it.\n\nLive: connect a keyboard (Keys) to the Live input. The selected track passes the notes to its output; with Record on and the transport running they are written into the track (play mode Notes).' }, kind: 'utility', category: 'sequencer', ui: { width: 840, minWidth: 380 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'transpose', name: 'Transpose' }, { id: 'live', name: 'Live' }], eventOut: [{ id: 'a', name: 'Track A' }, { id: 'b', name: 'Track B' }, { id: 'c', name: 'Track C' }, { id: 'd', name: 'Track D' }], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [], multiEventOut: [{ id: 'tracks', name: 'Tracks' }] },
  i18n: { nl: { ports: { transpose: 'Transpositie', live: 'Live', a: 'Spoor A', b: 'Spoor B', c: 'Spoor C', d: 'Spoor D', tracks: 'Sporen' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let mountHost = null, panel = null;
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function mountUI(el) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow({ mode: 'open' });
      add(shadow, 'style', `:host{display:block;color:var(--fg);font:13px system-ui,sans-serif;--x-acc:var(--audio);--x-acc2:var(--event);--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg))}.app{container-type:inline-size;background:var(--card);border-radius:10px;padding:14px;box-sizing:border-box}h3{margin:12px 0 4px;font-size:12px;font-weight:600;color:var(--muted)}p{line-height:1.5;color:var(--muted);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted)}button,select,input{font:inherit;color:var(--field-fg);background:var(--field);border:1px solid var(--line);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}button.active{background:color-mix(in srgb,var(--x-acc) 38%,var(--field));border-color:var(--x-acc)}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pads button{position:relative;overflow:hidden;min-height:64px;text-align:left;white-space:pre-line}.pads button i{position:absolute;left:0;bottom:0;background:color-mix(in srgb,var(--x-acc) 45%,transparent);pointer-events:none}.pads button b{position:relative;font-weight:400}.mini{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:4px}.mini input{padding:0;height:60px;writing-mode:vertical-lr;direction:rtl;-webkit-appearance:slider-vertical;appearance:auto}.mini.w input{writing-mode:horizontal-tb;direction:ltr;-webkit-appearance:auto;height:auto}canvas{display:block;width:100%;height:220px;border:1px solid var(--line);border-radius:6px;background:var(--well);cursor:crosshair;touch-action:none}label{min-width:0}`);
      panel = add(shadow, 'div', undefined); panel.className = 'app'; return panel;
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
    const r3 = x => Math.round(x * 1000) / 1000;
    let dead = false, mod = {}, state, effective = {};
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = mod[id] || 0; e[id] = clamp(state[id] + x * (d.max - d.min), d.min, d.max); } effective = e; return e; }
    function descriptors() { return Object.entries(spec).map(([id, d]) => ({ id, name: d.name, lane: d.lane, laneName: d.laneName, min: d.min, max: d.max, scale: 'lin', role: d.role, drift: 0.015, on: d.role !== 'level' && d.role !== 'pitch' })); }
    function receiveMod(raw) { mod = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id in spec) if (typeof raw[id] === 'number' && Number.isFinite(raw[id])) mod[id] = clamp(raw[id], -1, 1); apply(); }
    function numeric(raw, defaults) { const next = { ...defaults }; for (const [id, d] of Object.entries(spec)) next[id] = finite(raw?.[id], defaults[id], d.min, d.max); return next; }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');
    const stepDuration = info => Number.isFinite(info?.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info?.bpm) && info.bpm > 0 ? 15 / info.bpm : Number.isFinite(host.bpm) && host.bpm > 0 ? 15 / host.bpm : 0;
    const defaultName = i => tx(['Akkoorden', 'Bas', 'Puls', 'Bellen'][i]);
    const PORTS = ['a', 'b', 'c', 'd'];

    const spec = {};
    for (let i = 0; i < 4; i++) for (const [key, name, min, max, role] of [['gate', 'Gate', 0.1, 1.5, 'env'], ['velocity', 'Velocity', 0.05, 1, 'level'], ['transpose', tx('Transpositie'), -24, 24, 'pitch']]) spec['t' + i + key] = { name, min, max, role, lane: 'track' + i, laneName: tx('Spoor {0}', i + 1) };
    const qualities = { major: [0, 4, 7], minor: [0, 3, 7], sus: [0, 5, 7], minor7: [0, 3, 7, 10], fifth: [0, 7], single: [0] };
    const track = i => ({ name: '', enabled: i < 2, root: [48, 36, 60, 72][i], quality: i === 1 ? 'single' : 'minor', inversion: 0, mode: i === 1 ? 'arp' : 'chord', length: [16, 12, 7, 5][i], division: [4, 2, 1, 2][i], steps: Array.from({ length: 16 }, (_, j) => i === 0 ? +(j % 4 === 0) : 1), progression: [0, 3, -2, 5], probability: 1, ratchet: 1 });
    const defaultScenes = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, (_, i) => track(i)));
    const defaults = { scene: 0, editTrack: 0, editStep: 0, launch: 'bar', seed: 18743, ...Object.fromEntries(Object.keys(spec).map(id => [id, id.endsWith('gate') ? 0.7 : id.endsWith('velocity') ? 0.8 : 0])) };
    state = { ...defaults }; let scenes = defaultScenes(), playing = null, queuedScene = null, counters = [0, 0, 0, 0], last = '', gen = 18743, queue = [], transposeNote = 0, infoText = null, stepButtons = [], localBar = 0, previousStep = -1;
    let tick = null, held = new Map(), pending = new Map(), selNote = -1, roll = null, rollDirty = false, stopFrame = null, ro = null, selInfo = null, noteSliders = null, newVel = 0.8, newLen = 1;
    resolve();
    function reset() { localBar = 0; previousStep = -1; counters = [0, 0, 0, 0]; last = ''; queue = []; transposeNote = 0; gen = state.seed; tick = null; pending.clear(); }
    function emit(port, e) { if (dead) return; host.emit(self, port, e); const i = PORTS.indexOf(port); if (i >= 0) host.emit(self, 'tracks', { ...e, track: port, ch: i + 1 }); }
    let bundleSig = '';
    const bundle = () => ({ label: 'Chord Sequencer', tracks: PORTS.map((p, i) => ({ id: p, name: (scenes[state.scene] && scenes[state.scene][i] && scenes[state.scene][i].name) || defaultName(i), ch: i + 1 })) });
    function syncBundle() { if (dead || !self) return; const sig = JSON.stringify(bundle().tracks); if (sig !== bundleSig) { bundleSig = sig; if (typeof host.eventBundleChanged === 'function') host.eventBundleChanged(self, 'tracks'); } }
    function panic(t = ctx.currentTime) { for (const port of PORTS) emit(port, { type: 'allnotesoff', time: t }); held.clear(); }
    function consume(t) { while (queue.length && queue[0].time <= t) { const e = queue.shift(), type = cleanType(e); if (type === 'note' || type === 'noteon') transposeNote = clamp(Math.round(e.note) - 60, -36, 36); else if (type === 'panic' || type === 'allnotesoff') transposeNote = 0; } }
    function random() { gen = (Math.imul(gen, 1664525) + 1013904223) >>> 0; return gen / 4294967296; }
    function cleanTrack(raw, i) {
      const d = track(i), r = raw || {};
      const mode = ['chord', 'arp', 'pulse', 'notes'].includes(r.mode) ? r.mode : d.mode;
      const out = { name: typeof r.name === 'string' && r.name !== LEGACY_NAMES[i] ? r.name.slice(0, 40) : d.name, enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled, root: Math.round(finite(r.root, d.root, 24, 96)), quality: Object.hasOwn(qualities, r.quality) ? r.quality : d.quality, inversion: Math.round(finite(r.inversion, 0, 0, 3)), mode, length: Math.round(finite(r.length, d.length, 1, 16)), division: [1, 2, 4, 8].includes(r.division) ? r.division : d.division, steps: Array.from({ length: 16 }, (_, j) => Math.round(finite(r.steps?.[j], d.steps[j], 0, 1))), progression: Array.from({ length: 4 }, (_, j) => Math.round(finite(r.progression?.[j], d.progression[j], -24, 24))), probability: finite(r.probability, 1, 0, 1), ratchet: Math.round(finite(r.ratchet, 1, 1, 4)) };
      // nieuwe velden: alleen in de state als ze van de standaard afwijken (oude states blijven dan gelijk)
      if ([2, 4].includes(r.grid)) out.grid = r.grid;
      const sw = finite(r.swing, 0, 0, 0.5); if (sw > 0) out.swing = r3(sw);
      if (Array.isArray(r.vel)) { const v = Array.from({ length: 16 }, (_, j) => r3(finite(r.vel[j], 1, 0.05, 1))); if (v.some(x => x !== 1)) out.vel = v; }
      if (Array.isArray(r.len)) { const v = Array.from({ length: 16 }, (_, j) => r3(finite(r.len[j], 1, 0.1, 4))); if (v.some(x => x !== 1)) out.len = v; }
      const bars = Math.round(finite(r.bars, 1, 1, 4)); if (bars !== 1) out.bars = bars;
      if (Array.isArray(r.rec)) {
        const L = bars * 64, list = [];
        for (const x of r.rec.slice(0, 512)) { if (!Array.isArray(x)) continue; const p = Math.round(finite(x[0], -1, 0, L - 1)), n = Math.round(finite(x[1], -1, 0, 127)); if (p < 0 || n < 0) continue; list.push([p, n, r3(finite(x[2], 0.8, 0.01, 1)), Math.round(finite(x[3], 1, 1, L))]); if (list.length >= 256) break; }
        list.sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (list.length) out.rec = list;
      }
      return out;
    }
    function apply() { resolve(); }
    function launch(index) { if (state.launch === 'now' || playing === false) { panic(); state.scene = index; counters = [0, 0, 0, 0]; queuedScene = null; } else queuedScene = index; if (infoText) infoText.textContent = queuedScene === null ? tx('Scène {0}', state.scene + 1) : tx('Scène {0} op de volgende maat', index + 1); }
    function controls(parent, ids) { for (const id of ids) { const d = spec[id], format = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)); knob(parent, d.name, [d.min, d.max, 0.01], state[id], x => { state[id] = x; apply(); }, format, defaults[id]); } }
    // ---- live spelen en inspelen ----
    const curTrack = () => scenes[state.scene][state.editTrack];
    function closeHeld(t = ctx.currentTime) { for (const [n, port] of held) emit(port, { type: 'noteoff', note: n, time: t }); held.clear(); }
    const gridUnit = tr => 4 / (tr.grid || 1);            // 1/64-eenheden per rasterstap (4, 2 of 1)
    function recordNote(tr, p, n, v, l) {
      const L = (tr.bars || 1) * 64; tr.rec = (tr.rec || []).filter(x => !(x[0] === p && x[1] === n));
      tr.rec.push([p, n, r3(clamp(v, 0.01, 1)), clamp(Math.round(l), 1, L)]); tr.rec.sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (tr.rec.length > 256) tr.rec.shift(); rollDirty = true;
    }
    // dichtstbijzijnde (geswingde) rasterpunt voor tijdstip t, in 1/64-eenheden (niet gemodulo'd): een oneven zestiende ligt (hostswing + spoorswing) × stepDur later
    function gridPos(tr, t) {
      const sd = tick.sd, ls = tr.swing || 0, hs = tick.hs || 0, q = state.rquant === false ? 1 : gridUnit(tr), qs = q / 4;
      const base = tick.time - tick.idx * sd - (tick.idx % 2 === 1 ? hs * sd : 0);
      const at = k => { const u = k * qs, s = Math.floor(u + 1e-9); return base + u * sd + (s % 2 === 1 ? (hs + ls) * sd : 0); };
      const k0 = Math.round((t - base) / sd / qs); let best = k0, bd = Infinity;
      for (let k = k0 - 2; k <= k0 + 2; k++) { const d = Math.abs(t - at(k)); if (d < bd) { bd = d; best = k; } }
      return best * q;
    }
    function posOf(tr, t) {   // positie in 1/64-eenheden in de lus van het spoor, uit de laatste klokstap
      if (!tick) return null; const L = (tr.bars || 1) * 64, p = gridPos(tr, t); return ((p % L) + L) % L;
    }
    function lenOf(tr, tOn, tOff) { const q = state.rquant === false ? 1 : gridUnit(tr); if (!tick) return q; return Math.max(q, gridPos(tr, tOff) - gridPos(tr, tOn)); }
    function live(e) {
      let type = cleanType(e); const port = PORTS[state.editTrack], t = e.time, isTrig = type === 'trig'; if (isTrig) type = 'note';
      if (type === 'panic' || type === 'allnotesoff') { emit(port, { type: 'allnotesoff', time: t }); held.clear(); pending.clear(); return; }
      if (!['note', 'noteon', 'noteoff'].includes(type) || !Number.isFinite(e.note)) return;
      const n = clamp(Math.round(e.note), 0, 127), v = Number.isFinite(e.vel) ? clamp(e.vel, 0, 1) : 0.8, off = type === 'noteoff' || (type !== 'noteoff' && e.vel === 0);
      const dur = Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : isTrig ? 0.1 : undefined;
      if (state.thru !== false) {
        if (off) { held.delete(n); emit(port, { type: 'noteoff', note: n, time: t }); }
        else if (type === 'note' && dur !== undefined) emit(port, { type: 'note', note: n, vel: Math.max(0.01, v), time: t, dur });
        else { held.set(n, port); emit(port, { type: 'noteon', note: n, vel: Math.max(0.01, v), time: t }); }
      }
      if (state.record === true && playing === true && tick && tick.sd > 0) {
        const tr = curTrack(); const key = n;
        if (off) { const pn = pending.get(key); if (pn) { pending.delete(key); recordNote(tr, pn.p, n, pn.v, lenOf(tr, pn.t, Math.max(pn.t, t))); } }
        else { if (tr.mode !== 'notes') { tr.mode = 'notes'; if (mountHost) render(mountHost); } const p = posOf(tr, t); if (p === null) return;
          if (dur !== undefined && type === 'note') recordNote(tr, p, n, v, lenOf(tr, t, t + dur)); else pending.set(key, { p, v, t }); }
      }
    }
    function changeTarget(index) { closeHeld(); pending.clear(); state.editTrack = index; selNote = -1; }
    // ---- piano roll ----
    let colors = null, rollW = 600;
    function readColors() { if (!roll) return; const cs = getComputedStyle(roll), v = (n, d) => cs.getPropertyValue(n).trim() || d; colors = { well: v('--well', '#0b171d'), line: v('--line', '#39434c'), acc: v('--audio', '#91e0d4'), sel: v('--sel', '#ffd194'), fg: v('--well-fg', '#c7dbe0') }; }
    function range(tr) { const ns = (tr.rec || []).map(x => x[1]); let lo = ns.length ? Math.min(...ns) - 3 : 48, hi = ns.length ? Math.max(...ns) + 3 : 84; if (hi - lo < 24) { const c = (hi + lo) / 2; lo = Math.floor(c - 12); hi = lo + 24; } return [Math.max(0, lo), Math.min(127, hi)]; }
    function drawRoll() {
      if (!roll || !colors) return; const tr = curTrack(); const dpr = clamp(Number(globalThis.devicePixelRatio) || 1, 1, 3), W = rollW, H = 220;
      if (roll.width !== Math.round(W * dpr)) roll.width = Math.round(W * dpr); if (roll.height !== Math.round(H * dpr)) roll.height = Math.round(H * dpr);
      const g = roll.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = colors.well; g.fillRect(0, 0, W, H);
      const L = (tr.bars || 1) * 64, u = gridUnit(tr), [lo, hi] = range(tr), rows = hi - lo + 1, rh = H / rows;
      for (let x = 0; x <= L; x += u) { const px = x / L * W; g.strokeStyle = colors.line; g.globalAlpha = x % 64 === 0 ? 0.9 : x % 16 === 0 ? 0.5 : 0.18; g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); }
      g.globalAlpha = 0.15; for (let n = lo; n <= hi; n++) if ([1, 3, 6, 8, 10].includes(n % 12)) { g.fillStyle = colors.line; g.fillRect(0, H - (n - lo + 1) * rh, W, rh); } g.globalAlpha = 1;
      (tr.rec || []).forEach((x, k) => { const bh = rh * (0.3 + 0.7 * x[2]), px = x[0] / L * W, pw = Math.max(2, x[3] / L * W - 1), py = H - (x[1] - lo) * rh - (rh + bh) / 2;
        g.fillStyle = colors.acc; g.globalAlpha = 0.45 + 0.55 * x[2]; g.fillRect(px, py, pw, bh); g.globalAlpha = 1; if (k === selNote) { g.strokeStyle = colors.sel; g.lineWidth = 2; g.strokeRect(px, py, pw, bh); g.lineWidth = 1; } });
    }
    function hitRoll(tr, mx, my) {
      const L = (tr.bars || 1) * 64, [lo, hi] = range(tr), rh = 220 / (hi - lo + 1), u = L * mx / rollW, n = hi - Math.floor(my / rh);
      let hit = -1; (tr.rec || []).forEach((x, k) => { if (x[1] === n && u >= x[0] && u < x[0] + x[3]) hit = k; }); return { hit, u, n };
    }
    function syncNoteUI() { if (!noteSliders) return; const tr = curTrack(), x = selNote >= 0 ? tr.rec?.[selNote] : null; noteSliders.setEnabled(!!x); if (x) noteSliders.set(x[2], x[3] / gridUnit(tr)); if (selInfo) selInfo.textContent = x ? tx('noot {0} · positie {1}', x[1], x[0]) : tx('geen noot gekozen'); }
    function render(el) {
      syncBundle(); unmount(); mountUI(el);
      const top = row(panel);
      for (let i = 0; i < 4; i++) { const b = button(top, tx('Scène {0}', i + 1), () => launch(i)); if (i === state.scene) b.classList.add('active'); }
      select(top, tx('Scènewissel'), [['bar', tx('Volgende maat')], ['now', tx('Direct')]], state.launch, v => state.launch = v);
      button(top, tx('Kopieer scène naar volgende'), () => { scenes[(state.scene + 1) % 4] = scenes[state.scene].map((t, i) => cleanTrack(t, i)); });
      button(top, tx('Alles uit'), () => panic());
      const selectRow = row(panel);
      select(selectRow, tx('Bewerk spoor'), scenes[state.scene].map((t, i) => [i, String.fromCharCode(65 + i) + ' · ' + (t.name || defaultName(i))]), state.editTrack, v => { changeTarget(+v); render(el); });
      select(selectRow, tx('Live doorgeven'), [[1, tx('Aan')], [0, tx('Uit')]], state.thru === false ? 0 : 1, v => { if (v === '1') delete state.thru; else { closeHeld(); state.thru = false; } });
      const recBtn = button(selectRow, tx('Opnemen'), () => { if (state.record) delete state.record; else state.record = true; recBtn.classList.toggle('active', state.record === true); }); recBtn.classList.toggle('active', state.record === true);
      select(selectRow, tx('Kwantiseren'), [[1, tx('Aan')], [0, tx('Uit')]], state.rquant === false ? 0 : 1, v => { if (v === '1') delete state.rquant; else state.rquant = false; });
      const tr = curTrack(), i = state.editTrack, dt = track(i); const edit = grid(panel);
      const nameBox = add(edit, 'label'); nameBox.className = 'control'; add(nameBox, 'span', tx('Spoornaam'));
      const nameInput = add(nameBox, 'input'); nameInput.type = 'text'; nameInput.value = tr.name || defaultName(i); nameInput.addEventListener('pointerdown', e => e.stopPropagation());
      nameInput.onchange = () => { const v = nameInput.value.slice(0, 40); tr.name = v === defaultName(i) ? '' : v; };
      select(edit, tx('Actief'), [[0, tx('Uit')], [1, tx('Aan')]], +tr.enabled, v => { tr.enabled = v === '1'; if (!tr.enabled) emit(PORTS[i], { type: 'allnotesoff', time: ctx.currentTime }); });
      select(edit, tx('Spel'), [['chord', tx('Volledig akkoord')], ['arp', tx('Arpeggio')], ['pulse', tx('Alleen grondtoon')], ['notes', tx('Noten (opgenomen)')]], tr.mode, v => { tr.mode = v; render(el); });
      knob(edit, tx('Swing'), [0, 0.5, 0.01], tr.swing || 0, v => { if (v > 0) tr.swing = r3(v); else delete tr.swing; }, v => Math.round(v * 100) + '%', 0);
      select(edit, tx('Raster'), [[1, '1/16'], [2, '1/32'], [4, '1/64']], tr.grid || 1, v => { if (+v === 1) delete tr.grid; else tr.grid = +v; if (tr.mode === 'notes') { rollDirty = true; } });
      if (tr.mode !== 'notes') {
        select(edit, tx('Akkoord'), Object.keys(qualities).map(k => [k, k]), tr.quality, v => tr.quality = v);
        select(edit, tx('Nootdeling'), [[1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2']], tr.division, v => tr.division = +v);
        for (const [id, label, min, max] of [['root', 'Grondtoon MIDI', 24, 96], ['inversion', 'Omkeerligging', 0, 3], ['length', 'Patroonlengte', 1, 16], ['ratchet', 'Herhalingen per stap', 1, 4]]) knob(edit, tx(label), [min, max, 1], tr[id], v => tr[id] = v, v => String(v), dt[id]);
        knob(edit, tx('Speelkans'), [0, 1, 0.01], tr.probability, v => tr.probability = v, v => Number(v).toFixed(2), 1);
        const progBox = add(edit, 'label'); progBox.className = 'control'; add(progBox, 'span', tx('Progressie per maat (0,3,-2,5)'));
        const progInput = add(progBox, 'input'); progInput.type = 'text'; progInput.value = tr.progression.join(','); progInput.addEventListener('pointerdown', e => e.stopPropagation());
        progInput.onchange = () => { tr.progression = Array.from({ length: 4 }, (_, j) => Math.round(finite(Number(progInput.value.split(',')[j]), 0, -24, 24))); };
        const steps = add(panel, 'div'); steps.className = 'pads'; const bars = [];
        const paint = j => { const v = tr.vel ? tr.vel[j] : 1, l = tr.len ? tr.len[j] : 1; bars[j].style.height = (v * 100) + '%'; bars[j].style.width = clamp(l * 50, 6, 100) + '%'; };
        stepButtons = tr.steps.map((on, j) => { const b = button(steps, '', () => { tr.steps[j] = 1 - tr.steps[j]; render(el); }); const lab = add(b, 'b', (j + 1) + (on ? ' ●' : ' ·')); bars[j] = add(b, 'i'); paint(j); return b; });
        for (const [key, title, lo, hi, step, wide] of [['vel', 'Velocity per stap (hoogte)', 0.05, 1, 0.05, false], ['len', 'Lengte per stap (breedte)', 0.1, 4, 0.1, true]]) {
          add(panel, 'h3', tx(title)); const box = add(panel, 'div'); box.className = wide ? 'mini w' : 'mini';
          for (let j = 0; j < 16; j++) { const inp = add(box, 'input'); inp.type = 'range'; inp.min = lo; inp.max = hi; inp.step = step; inp.value = tr[key] ? tr[key][j] : 1; inp.dataset.pkDefault = '1'; inp.title = String(j + 1);
            inp.addEventListener('pointerdown', e => e.stopPropagation()); inp.oninput = () => { if (!tr[key]) tr[key] = Array(16).fill(1); tr[key][j] = Number(inp.value); paint(j); }; }
        }
        controls(grid(panel), ['t' + i + 'gate', 't' + i + 'velocity', 't' + i + 'transpose']);
      } else {
        stepButtons = [];
        const nb = grid(panel);
        knob(nb, tx('Maten'), [1, 4, 1], tr.bars || 1, v => { if (v === 1) delete tr.bars; else tr.bars = v; const Lm = v * 64; tr.rec = (tr.rec || []).filter(x => x[0] < Lm).map(x => [x[0], x[1], x[2], Math.min(x[3], Lm - x[0])]); selNote = -1; rollDirty = true; syncNoteUI(); }, v => String(v), 1);
        knob(nb, tx('Grondtoon MIDI'), [24, 96, 1], tr.root, v => tr.root = v, v => String(v), dt.root);
        knob(nb, tx('Nieuwe noot: velocity'), [0.05, 1, 0.01], newVel, v => newVel = v, v => v.toFixed(2), 0.8);
        knob(nb, tx('Nieuwe noot: lengte (rasterstappen)'), [1, 16, 1], newLen, v => newLen = v, v => String(v), 1);
        roll = add(panel, 'canvas'); roll.setAttribute('aria-label', tx('Pianoroll van de opgenomen noten'));
        roll.addEventListener('pointerdown', e => { e.stopPropagation(); const rc = roll.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top, h = hitRoll(tr, mx, my);
          if (h.hit >= 0) selNote = h.hit; else { const q = gridUnit(tr), L = (tr.bars || 1) * 64, p = clamp(Math.floor(h.u / q) * q, 0, L - 1); recordNote(tr, p, clamp(h.n, 0, 127), newVel, Math.min(newLen * q, L - p)); selNote = tr.rec.findIndex(x => x[0] === p && x[1] === clamp(h.n, 0, 127)); }
          rollDirty = true; syncNoteUI(); });
        const sb = grid(panel); selInfo = add(sb, 'p', '');
        const sv = knob(sb, tx('Gekozen noot: velocity'), [0.01, 1, 0.01], 0.8, v => { const x = tr.rec?.[selNote]; if (x) { x[2] = r3(v); rollDirty = true; } }, v => v.toFixed(2), 0.8);
        const sl = knob(sb, tx('Gekozen noot: lengte (rasterstappen)'), [1, 64, 1], 1, v => { const x = tr.rec?.[selNote]; if (x) { x[3] = clamp(Math.round(v * gridUnit(tr)), 1, (tr.bars || 1) * 64 - x[0]); rollDirty = true; } }, v => String(v), 1);
        noteSliders = { set(v, l) { sv.value = v; sv.dispatchEvent(new Event('input')); sl.value = l; sl.dispatchEvent(new Event('input')); }, setEnabled(on) { sv.disabled = sl.disabled = !on; } };
        const ab = row(panel); button(ab, tx('Verwijder noot'), () => { if (selNote >= 0 && tr.rec) { tr.rec.splice(selNote, 1); selNote = -1; rollDirty = true; syncNoteUI(); } }); button(ab, tx('Wis alle noten'), () => { delete tr.rec; selNote = -1; rollDirty = true; syncNoteUI(); });
        controls(grid(panel), ['t' + i + 'gate', 't' + i + 'velocity', 't' + i + 'transpose']);
        if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { rollW = Math.max(200, roll.clientWidth || 600); rollDirty = true; }); ro.observe(roll); } rollW = Math.max(200, roll.clientWidth || 600);
        readColors(); rollDirty = true; syncNoteUI();
        if (typeof host.frame === 'function') stopFrame = host.frame(self, () => { if (rollDirty) { rollDirty = false; drawRoll(); } }, 15);
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
      }
      infoText = add(panel, 'p', tx('Uitgangen A–D horen bij sporen A–D.'));
    }
    function onSkin() { readColors(); rollDirty = true; }
    function unmount() { if (stopFrame) { stopFrame(); stopFrame = null; } if (ro) { ro.disconnect(); ro = null; } if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); roll = null; noteSliders = null; selInfo = null; clearUI(); }
    // ---- klembord (contract v1.17, §13d): het gekozen spoor van de actieve scène ----
    // Een notes-spoor (`rec`) is een echte clip; een akkoord-, arpeggio- of pulsspoor wordt bij kopiëren één cyclus van vier maten als noten gerenderd (momentopname, geen koppeling).
    // Plakken zet het gekozen spoor op `notes` (de oude akkoordinstellingen blijven staan, maar klinken niet meer). Eenheid: 1/64 = 3 tikken, een maat = 64 eenheden = 192 tikken.
    const CLIP_ID = 'nl.patchkamer.chordsequencer', CLIP_MAXEV = 256, CLIP_BAR = 192, GRIDUNIT = { 16: 4, 32: 2, 64: 1 }, CLIP_VER = '1.16.0';
    const clipNameOf = i => String.fromCharCode(65 + i) + ' · ' + (scenes[state.scene][i].name || defaultName(i));
    const clipTrackName = () => clipNameOf(state.editTrack);
    // wat een spoor nu kan ontvangen en geven (notes), voor één spoor van de actieve scène
    const clipTrackInfo = (tr, i) => ({ length: { min: CLIP_BAR, max: 4 * CLIP_BAR, step: CLIP_BAR, current: (tr.bars || 1) * CLIP_BAR, shared: false }, grid: [16, 32, 64], range: [0, 127], scheme: 'gm', vel: 'continuous', prob: false, ratchet: false, maxEvents: CLIP_MAXEV });
    function clipInfo() {
      try {
        if (dead) return null; const tr = curTrack();
        return { name: tx('Spoor {0}', clipTrackName()), copy: ['notes', 'multi'], paste: ['notes', 'multi'], ...clipTrackInfo(tr, state.editTrack),
          tracks: scenes[state.scene].map((t, i) => ({ id: PORTS[i], name: (t.name || defaultName(i)).slice(0, 40), kind: 'notes', ...clipTrackInfo(t, i) })) };
      } catch { return null; }
    }
    // één cyclus van vier maten van een akkoord-, arpeggio- of pulsspoor als noten (zonder spoortranspositie en zonder swing: die horen bij het spoor)
    function renderTrack(tr, i) {
      const g = tr.grid || 1, ev = [], vel0 = state['t' + i + 'velocity'], gate = state['t' + i + 'gate'];
      let count = 0;
      for (let b = 0; b < 4; b++) for (let st = 0; st < 16; st++) for (let s = 0; s < g; s++) {
        if ((st * g + s) % tr.division) continue; const j = count++ % tr.length;
        if (!tr.steps[j]) continue;
        let iv = qualities[tr.quality].slice(); for (let n = 0; n < tr.inversion; n++) iv.push(iv.shift() + 12);
        const root = tr.root + tr.progression[b % 4], list = iv.map(x => Math.round(clamp(root + x, 0, 127)));
        const sel = tr.mode === 'chord' ? list : tr.mode === 'pulse' ? [Math.round(clamp(root, 0, 127))] : [list[(count - 1) % list.length]];
        const dur = tr.division / g / tr.ratchet, vel = r3(clamp(tr.vel ? vel0 * tr.vel[j] : vel0, 0.01, 1)), lenT = dur * 12 * gate * (tr.len ? tr.len[j] : 1);
        for (let r = 0; r < tr.ratchet; r++) for (const n of sel) {
          const t = Math.round(((b * 16 + st + s / g + r * dur) * 12) / 3) * 3, len = Math.max(3, Math.round(lenT / 3) * 3);
          if (t >= 4 * CLIP_BAR) continue; const e = { t, n, len: Math.min(len, 4 * CLIP_BAR - t), vel }; if (tr.probability < 1) e.prob = r3(tr.probability); ev.push(e);
        }
      }
      return ev;
    }
    function dedupe(list, key) { const m = new Map(); for (const e of list) { const k = key(e), o = m.get(k); if (!o || e.vel > o.vel) m.set(k, e); } return [...m.values()]; }
    function clipNotes(tr, i) {
      if (tr.mode === 'notes') return { length: (tr.bars || 1) * CLIP_BAR, notes: (tr.rec || []).map(x => ({ t: x[0] * 3, n: x[1], len: x[3] * 3, vel: x[2] })) };
      const ev = dedupe(renderTrack(tr, i), e => e.t + ':' + e.n).sort((a, b) => a.t - b.t || a.n - b.n);
      return { length: 4 * CLIP_BAR, notes: ev.slice(0, CLIP_MAXEV) };
    }
    const clipOne = (tr, i) => {
      const c = clipNotes(tr, i), clip = { format: 'patchkamer-clip', formatVersion: 1, kind: 'notes', name: clipNameOf(i).slice(0, 40), length: c.length, grid: tr.grid === 4 ? 64 : tr.grid === 2 ? 32 : 16, source: { device: CLIP_ID, name: 'Chord Sequencer', version: CLIP_VER, scheme: 'gm' }, notes: c.notes };
      if (tr.swing > 0) clip.swing = tr.swing; return clip;
    };
    // de actieve scène: vier sporen als notes-clips; native = de vier sporen zoals ze zijn (akkoorden, arpeggio's en instellingen), alleen voor Chord Sequencer zelf
    function getMulti() {
      const sc = scenes[state.scene], tracks = sc.map((tr, i) => ({ slot: i, name: (tr.name || defaultName(i)).slice(0, 40), kind: 'notes', role: tr.mode, clip: clipOne(tr, i) }));
      return { format: 'patchkamer-clip', formatVersion: 1, kind: 'multi', name: tx('Scène {0}', state.scene + 1).slice(0, 40), length: Math.max(...tracks.map(t => t.clip.length)), grid: 16, source: { device: CLIP_ID, name: 'Chord Sequencer', version: CLIP_VER, scheme: 'gm' }, tracks, native: { device: CLIP_ID, data: { tracks: sc.map((t, i) => cleanTrack(t, i)) } } };
    }
    function getClip(o) {
      try {
        if (dead) return null;
        return JSON.parse(JSON.stringify(o && o.kind === 'multi' ? getMulti() : clipOne(curTrack(), state.editTrack)));
      } catch { return null; }
    }
    const isNum = x => typeof x === 'number' && Number.isFinite(x);
    // een notes-clip op een kopie van een spoor: geeft { tr (nieuw spoor), dropped } of { err }
    function clipToTrack(tr0, i, clip) {
      const bad = { err: tx('Geen geldige clip.') };
      if (!clip || typeof clip !== 'object' || Array.isArray(clip) || clip.format !== 'patchkamer-clip' || (clip.formatVersion !== undefined && clip.formatVersion !== 1) || !isNum(clip.length)) return bad;
      if (clip.kind !== 'notes') return { err: tx('De soort past niet: dit apparaat neemt noten.') };
      const tr = JSON.parse(JSON.stringify(tr0)), length = Math.round(clamp(clip.length, 1, 4 * CLIP_BAR)), bars = clamp(Math.ceil(length / CLIP_BAR), 1, 4), L = bars * 64;
      const src = Array.isArray(clip.notes) ? clip.notes : [], list = [];
      for (const x of src.slice(0, 4096)) {
        if (!x || typeof x !== 'object' || !isNum(x.t) || !isNum(x.n) || x.t < 0) continue;
        const p = Math.round(x.t / 3); if (p >= L || x.t >= clamp(clip.length, 1, 12288)) continue;
        list.push({ p, n: Math.round(clamp(x.n, 0, 127)), vel: r3(finite(x.vel, 0.8, 0.01, 1)), l: Math.round(clamp(Number.isFinite(x.len) ? x.len / 3 : 4, 1, L - p)) });
      }
      const uniq = dedupe(list, e => e.p + ':' + e.n).sort((a, b) => a.p - b.p || a.n - b.n), dropped = Math.max(0, uniq.length - CLIP_MAXEV) + Math.max(0, src.length - 4096), keep = uniq.slice(0, CLIP_MAXEV);
      const rec = keep.map(e => [e.p, e.n, e.vel, e.l]);
      // een momentopname van dit spoor zelf (akkoord/arpeggio/pulse) terugplakken doet niets: het spoor blijft zoals het is
      if (tr.mode !== 'notes') { const mine = JSON.stringify(clipNotes(tr, i).notes.map(e => [e.t / 3, e.n, e.vel, e.len / 3])); if (mine === JSON.stringify(rec) && length === 4 * CLIP_BAR) return { tr: tr0, dropped: 0 }; }
      const same = tr.mode === 'notes' && (tr.bars || 1) === bars && JSON.stringify(tr.rec || []) === JSON.stringify(rec);
      const unit = GRIDUNIT[clip.grid] || 4, cur = 4 / (tr.grid || 1), aligned = u => rec.every(x => x[0] % u === 0);
      const gridv = same ? cur : aligned(cur) ? cur : aligned(unit) ? unit : [4, 2, 1].find(aligned) || 1;
      tr.mode = 'notes'; if (bars !== 1) tr.bars = bars; else delete tr.bars;
      if (rec.length) tr.rec = rec; else delete tr.rec;
      if (gridv === 4) delete tr.grid; else tr.grid = gridv === 2 ? 2 : 4;
      return { tr, dropped };
    }
    const clipSig = tr => JSON.stringify([tr.mode, tr.bars, tr.rec, tr.grid]);
    const clipShow = () => { selNote = -1; rollDirty = true; if (mountHost) render(mountHost); };
    // de actieve scène uit een multi-clip; een clip van Chord Sequencer zelf die niet is aangepast zet de vier sporen exact terug
    function setMulti(clip) {
      const bad = { ok: false, reason: tx('Geen geldige clip.') }, entries = new Map();
      for (const x of (Array.isArray(clip.tracks) ? clip.tracks.slice(0, 64) : [])) if (x && typeof x === 'object' && Number.isInteger(x.slot) && x.slot >= 0 && x.slot < 4 && x.clip && typeof x.clip === 'object') entries.set(x.slot, x.clip);
      if (!entries.size) return bad;
      const sc = scenes[state.scene]; let next = null, dropped = 0;
      const nd = clip.native && typeof clip.native === 'object' && clip.native.device === CLIP_ID && clip.native.data && Array.isArray(clip.native.data.tracks) ? clip.native.data.tracks : null;
      if (nd && entries.size === 4) {
        const cand = [0, 1, 2, 3].map(i => cleanTrack(nd[i], i));
        const key = (len, ev) => JSON.stringify([len, ev.map(e => [e.t, e.n, e.len, Math.round(e.vel * 1e3)]).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])]);
        const fits = cand.every((tr, i) => {
          const tc = entries.get(i); if (!tc || tc.kind !== 'notes' || !isNum(tc.length) || !Array.isArray(tc.notes)) return false;
          const c = clipNotes(tr, i), got = tc.notes.filter(x => x && isNum(x.t) && isNum(x.n)).map(x => ({ t: Math.round(x.t), n: Math.round(x.n), len: Math.round(Number.isFinite(x.len) ? x.len : 12), vel: r3(finite(x.vel, 0.8, 0.01, 1)) }));
          return got.length === tc.notes.length && Math.round(tc.length) === c.length && key(c.length, c.notes) === key(c.length, got);
        });
        if (fits) next = cand;
      }
      if (!next) {
        next = sc.slice(); let used = 0, errText = '';
        entries.forEach((tc, i) => { const r = clipToTrack(sc[i], i, tc); if (r.err) { errText = r.err; return; } used++; dropped += r.dropped; next[i] = r.tr; });
        if (!used) return { ok: false, reason: errText || bad.reason };
      }
      if (next.every((t, i) => JSON.stringify(t) === JSON.stringify(sc[i]))) return { ok: true, ...(dropped ? { dropped } : {}) };
      scenes[state.scene] = next; clipShow();
      return { ok: true, ...(dropped ? { dropped } : {}) };
    }
    function setClip(clip) {
      try {
        if (dead) return { ok: false, reason: tx('Het apparaat is verwijderd.') };
        if (clip && typeof clip === 'object' && !Array.isArray(clip) && clip.format === 'patchkamer-clip' && (clip.formatVersion === undefined || clip.formatVersion === 1) && clip.kind === 'multi') return setMulti(clip);
        const i = state.editTrack, tr = curTrack(), r = clipToTrack(tr, i, clip);
        if (r.err) return { ok: false, reason: r.err };
        if (clipSig(r.tr) === clipSig(tr) && r.tr.mode === tr.mode) return { ok: true, ...(r.dropped ? { dropped: r.dropped } : {}) };
        scenes[state.scene][i] = r.tr; clipShow();
        return { ok: true, ...(r.dropped ? { dropped: r.dropped } : {}) };
      } catch { return { ok: false, reason: tx('Geen geldige clip.') }; }
    }
    const PRESET_SKIP = ['editTrack', 'editStep', 'record'];  // contract v1.6: werkstand, geen klank — een preset laat dit staan
    const self = {
      inputs: {}, outputs: {}, eventBundles: { tracks: () => bundle() }, mount: render, unmount() { infoText = null; stepButtons = []; unmount(); },
      onEvent(port, e) {
        try {
          if (dead || !Number.isFinite(e?.time)) return;
          if (port === 'live') { live(e); return; }
          if (port !== 'transpose') return; if (['note', 'noteon', 'panic', 'allnotesoff'].includes(cleanType(e)) && (Number.isFinite(e.note) || ['panic', 'allnotesoff'].includes(cleanType(e)))) { queue.push({ ...e }); queue.sort((a, b) => a.time - b.time); if (queue.length > 128) queue.shift(); }
        } catch {}
      },
      onTransport(e) { if (dead) return; playing = !!e?.playing; reset(); if (!playing) { queuedScene = null; panic(); } },
      onStep(info) {
        try {
          if (dead || playing === false || !Number.isFinite(info?.time) || !Number.isInteger(info.step)) return; const sd = stepDuration(info); if (!sd) return;
          const key = info.time + ':' + info.step; if (key === last) return; last = key;
          if (queuedScene !== null && info.step === 0) { panic(info.time); state.scene = queuedScene; queuedScene = null; counters = [0, 0, 0, 0]; }
          consume(info.time); if (info.step < previousStep) localBar++; previousStep = info.step; const bar = Number.isInteger(info.bar) ? info.bar : localBar;
          tick = { time: info.time, sd, idx: bar * 16 + info.step, hs: finite(info.swing, 0, 0, 0.95) };
          for (let i = 0; i < 4; i++) {
            const tr = scenes[state.scene][i];
            if (tr.mode === 'notes') {
              if (!tr.enabled || !tr.rec) continue; const swn = tr.swing || 0, pos = tick.idx % ((tr.bars || 1) * 16), tp = Math.round(effective['t' + i + 'transpose']) + transposeNote;
              for (const x of tr.rec) { if (x[0] >> 2 !== pos) continue; emit(PORTS[i], { type: 'note', note: Math.round(clamp(x[1] + tp, 0, 127)), vel: clamp(x[2] * effective['t' + i + 'velocity'] / 0.8, 0.01, 1), time: info.time + (x[0] & 3) * sd / 4 + (swn > 0 && tick.idx % 2 === 1 ? swn * sd : 0), dur: Math.max(0.005, x[3] * sd / 4 * effective['t' + i + 'gate'] / 0.7) }); }
              continue;
            }
            const g = tr.grid || 1, sws = tr.swing || 0;
            for (let s = 0; s < g; s++) {
              if ((info.step * g + s) % tr.division) continue; const count = counters[i]++, j = count % tr.length;
              if (i === state.editTrack) for (let k = 0; k < stepButtons.length; k++) stepButtons[k].style.borderColor = j === k ? 'var(--sel)' : '';
              if (!tr.enabled || !tr.steps[j] || random() > tr.probability) continue;
              let intervals = qualities[tr.quality].slice(); for (let n = 0; n < tr.inversion; n++) intervals.push(intervals.shift() + 12);
              const root = tr.root + tr.progression[((bar % 4) + 4) % 4] + Math.round(effective['t' + i + 'transpose']) + transposeNote, list = intervals.map(x => Math.round(clamp(root + x, 0, 127)));
              const selected = tr.mode === 'chord' ? list : tr.mode === 'pulse' ? [Math.round(clamp(root, 0, 127))] : [list[count % list.length]], duration = sd * tr.division / g / tr.ratchet;
              const vel = tr.vel ? clamp(effective['t' + i + 'velocity'] * tr.vel[j], 0.01, 1) : effective['t' + i + 'velocity'], dur = tr.len ? duration * effective['t' + i + 'gate'] * tr.len[j] : duration * effective['t' + i + 'gate'];
              for (let r = 0; r < tr.ratchet; r++) { const sh = sws > 0 && Math.floor(info.step + s / g + r * duration / sd + 1e-9) % 2 === 1 ? sws * sd : 0; for (const note of selected) emit(PORTS[i], { type: 'note', note, vel, time: info.time + s * sd / g + r * duration + sh, dur }); }
            }
          }
          if (infoText) infoText.textContent = tx('Scène {0}', state.scene + 1) + ' · ' + Math.round(15 / sd) + ' BPM' + (queuedScene !== null ? ' · ' + tx('volgende') + ': ' + (queuedScene + 1) : '');
        } catch {}
      },
      clipInfo() { return clipInfo(); }, getClip(o) { return getClip(o); }, setClip(clip) { return setClip(clip); },
      params: descriptors, modulate: receiveMod,
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) { if (dead) return; const keep = {}; for (const k of PRESET_SKIP) if (k in state) keep[k] = state[k]; self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      getState() { return { ...state, scenes: scenes.map(s => JSON.stringify(s.map((t, i) => cleanTrack(t, i)))) }; },
      setState(raw) {
        if (dead) return; const before = state.editTrack; if (playing === true || held.size) panic(); pending.clear(); const s = raw && typeof raw === 'object' ? raw : {}; state = numeric(s, defaults);
        state.scene = Math.round(finite(s.scene, 0, 0, 3)); state.editTrack = Math.round(finite(s.editTrack, 0, 0, 3)); state.editStep = Math.round(finite(s.editStep, 0, 0, 15));
        state.launch = s.launch === 'now' ? 'now' : 'bar'; state.seed = Math.round(finite(s.seed, 18743, 0, 4294967295));
        if (s.thru === false) state.thru = false; if (s.rquant === false) state.rquant = false; if (s.record === true) state.record = true;
        scenes = defaultScenes(); selNote = -1;
        if (Array.isArray(s.scenes)) for (let j = 0; j < 4; j++) if (typeof s.scenes[j] === 'string' && s.scenes[j].length < 100000) try { const a = JSON.parse(s.scenes[j]); if (Array.isArray(a)) scenes[j] = Array.from({ length: 4 }, (_, i) => cleanTrack(a[i], i)); } catch {}
        queuedScene = null; reset(); apply(); if (mountHost) render(mountHost);
      },
      destroy() { if (dead) return; panic(); dead = true; unmount(); }
    };
    apply(); return self;
  }
};
