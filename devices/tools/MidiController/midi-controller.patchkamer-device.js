// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.5.0 — Uitleg naar about (menu Over MIDI Controller); de UI toont geen uitlegtekst meer.
// 1.4.0 — Pads: een pad dat een CC stuurt (rij op 'pads' zetten) speelt een noot (36 voor het eerste pad, daarna omhoog); vaste pad-velocity voor pads die niet op aanslag reageren; bij elke invoer staat waar die heen ging (koppeling, noot naar apparaat of geen nootingang); de nootingang van een doel wordt bij wijzigingen opnieuw gekozen.
// 1.3.0 — Kalibratie: de knop 'Kalibreer bereik' onthoudt per schuif of draaiknop het laagste en hoogste geziene bereik; stuurt een element maar een deel van 0..127, dan wordt dat bereik naar de hele slag geschaald (bereik in de indelingsrij te zien).
// 1.2.0 — AI-voorstel (contract v1.29, host.ai): een knop vraagt de AI-aanbieder van de gebruiker om koppelingen op basis van de regelaars van het apparaat en de indeling van de controller; elk paar wordt gecontroleerd en het resultaat is met één klik ongedaan te maken.
// 1.1.0 — Beter voorstel: de indeling wordt als rijen herkend (draaiknoppen, schuiven, knoppen; per rij te wijzigen) en bij een apparaat met kanaalstroken (zoals de Mixer) krijgt kolom i van de controller strook i, met de schuif op de fader van die strook. Pads worden niet meer op regelaars gezet.
// 1.0.0 — Eerste versie (Patchkamer contract v1.28). Eén apparaat voor alle MIDI-controllers en -keyboards: het opent alle aangesloten MIDI-ingangen tegelijk, kent per Patchkamer-apparaat zijn
//         eigen koppelingen en bestuurt steeds het actieve apparaat. Een knop op je controller kiest een ander apparaat (en zet het desgewenst midden in beeld, host.show), waarna dezelfde
//         draaiknoppen op de koppelingen van dat apparaat werken. Koppelen gaat snel: Leer indeling (je raakt elke knop één keer aan), Voorstel (zet de knoppen automatisch op de regelaars van het
//         apparaat) en Snel koppelen (draai knoppen, ze nemen de volgende regelaars). Koppelingen bewaar je als preset. Noten van een keyboard gaan naar het actieve apparaat.
//         Vervangt MIDI Hub, Control Surface, Pad Controller en Keys / MIDI (die zijn teruggetrokken: status 'retired').
// MIDI Controller — alle MIDI-apparaten tegelijk, schakelen tussen apparaten, snel koppelen · Patchkamer contract v1.28

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const int = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), a, b) : d;
const str = (v, d, max) => typeof v === 'string' ? v.slice(0, max || 120) : d;
const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = n => NOTE[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const KINDS = ['cc', 'note', 'bend', 'pressure'];
const MAXT = 24, MAXM = 128, MAXS = 256;

const TXT = {
  nl: { title: 'MIDI Controller', connect: 'MIDI verbinden', connecting: 'Bezig met verbinden…', connected: 'MIDI verbonden', noMidi: 'Web MIDI is hier niet beschikbaar (gebruik een browser met Web MIDI).', denied: 'Toegang tot MIDI is geweigerd.',
    inputs: 'MIDI-ingangen', noInputs: 'Geen MIDI-apparaten gevonden. Sluit er een aan; het verschijnt vanzelf.', last: 'Laatste invoer', none: 'nog niets ontvangen',
    devices: 'Apparaten', add: 'Apparaat toevoegen…', noDevices: 'Voeg een Patchkamer-apparaat toe om het te bedienen.', active: 'actief', activate: 'Kies', remove: 'Verwijder',
    switchBtn: 'Schakelknop', learnSwitch: 'Leer knop', learningSwitch: 'Druk een knop…', noSwitch: 'geen knop', gone: 'niet meer in de werkruimte',
    maps: 'Koppelingen van', unmapped: 'nog geen knop', learn: 'Leer', learning: 'Draai of druk…', pick: 'Kies een regelaar', missing: 'niet gevonden', min: 'min', max: 'max', invert: 'omkeren', toggle: 'wissel', del: 'Wis',
    addMap: '+ koppeling', clearMaps: 'Alles wissen', suggest: 'Voorstel', ai: 'AI-voorstel', aiTip: 'Laat een AI een koppelvoorstel maken van de regelaars van dit apparaat en je indeling (vraagt een AI-aanbieder in Instellingen)', aiBusy: 'AI denkt na…', aiNone: 'De AI gaf geen bruikbaar voorstel.', aiDone: n => 'AI: ' + n + (n === 1 ? ' koppeling toegevoegd' : ' koppelingen toegevoegd'), aiUndo: 'AI ongedaan', aiOff: 'Stel eerst een AI-aanbieder, sleutel en model in bij Instellingen.', aiDeclined: 'Geannuleerd.', aiErr: m => 'AI-fout: ' + m, suggestTip: 'Zet je knoppen automatisch op de regelaars van dit apparaat', quick: 'Snel koppelen', quickStop: 'Stop snel koppelen', quickNext: n => 'Draai een knop: die wordt gekoppeld aan ' + n,
    surface: 'Indeling van je controller', surfaceN: n => n + ' elementen geleerd', surfaceLearn: 'Leer indeling', surfaceStop: 'Klaar', surfaceHint: 'Raak elke knop, schuif en pad één keer aan. Daarna kan Patchkamer een koppeling voorstellen.', surfaceClear: 'Wis indeling', kKnob: 'draaiknoppen', kFader: 'schuiven', kBtn: 'knoppen', kPad: 'pads', cal: 'Kalibreer bereik', calStop: 'Klaar met kalibreren', calHint: 'Beweeg elke schuif en draaiknop één keer helemaal van laag naar hoog. Stuurt een element maar een deel van het bereik, dan schaalt Patchkamer dat naar de hele slag.', rangeReset: 'Wis het bereik van deze rij', rangeTxt: (a, b) => 'bereik ' + a + '–' + b + ' (geschaald)',
    options: 'Opties', padVel: 'Vaste pad-velocity (voor pads die niet op aanslag reageren)', noPort: n => n + ' heeft geen ingang voor noten: pads en keyboard doen niets', notesOffTxt: 'noten staan uit', toMap: l => 'koppeling ' + l, toNote: (n, d) => 'noot ' + n + ' naar ' + d, center: 'Zet het gekozen apparaat midden in beeld', notes: 'Noten van een keyboard naar het actieve apparaat', refresh: 'Ververs regelaars', counts: n => n + (n === 1 ? ' regelaar' : ' regelaars'),
    srcCc: n => 'CC ' + n, srcNote: n => 'Noot ' + noteName(n), srcBend: 'Pitch bend', srcPress: 'Kanaaldruk', ch: 'kanaal', mapped: n => n + (n === 1 ? ' koppeling' : ' koppelingen'),
    sugDone: n => n + (n === 1 ? ' koppeling toegevoegd' : ' koppelingen toegevoegd'), sugNone: 'Niets toe te voegen: leer eerst je indeling, of alle knoppen zijn al gekoppeld.', needSurface: 'Leer eerst de indeling van je controller.' },
  en: { title: 'MIDI Controller', connect: 'Connect MIDI', connecting: 'Connecting…', connected: 'MIDI connected', noMidi: 'Web MIDI is not available here (use a browser with Web MIDI).', denied: 'Access to MIDI was denied.',
    inputs: 'MIDI inputs', noInputs: 'No MIDI devices found. Plug one in; it shows up by itself.', last: 'Last input', none: 'nothing received yet',
    devices: 'Devices', add: 'Add a device…', noDevices: 'Add a Patchkamer device to control it.', active: 'active', activate: 'Select', remove: 'Remove',
    switchBtn: 'Switch button', learnSwitch: 'Learn button', learningSwitch: 'Press a button…', noSwitch: 'no button', gone: 'no longer in the workspace',
    maps: 'Mappings of', unmapped: 'no knob yet', learn: 'Learn', learning: 'Turn or press…', pick: 'Pick a control', missing: 'not found', min: 'min', max: 'max', invert: 'invert', toggle: 'toggle', del: 'Delete',
    addMap: '+ mapping', clearMaps: 'Clear all', suggest: 'Suggest', ai: 'AI suggestion', aiTip: 'Let an AI propose a mapping from the controls of this device and your layout (needs an AI provider in Settings)', aiBusy: 'AI is thinking…', aiNone: 'The AI gave no usable suggestion.', aiDone: n => 'AI: ' + n + (n === 1 ? ' mapping added' : ' mappings added'), aiUndo: 'Undo AI', aiOff: 'First set an AI provider, key and model in Settings.', aiDeclined: 'Cancelled.', aiErr: m => 'AI error: ' + m, suggestTip: 'Put your knobs on the controls of this device automatically', quick: 'Quick map', quickStop: 'Stop quick map', quickNext: n => 'Turn a knob: it gets mapped to ' + n,
    surface: 'Layout of your controller', surfaceN: n => n + ' elements learned', surfaceLearn: 'Learn layout', surfaceStop: 'Done', surfaceHint: 'Touch every knob, slider and pad once. Then Patchkamer can suggest a mapping.', surfaceClear: 'Clear layout', kKnob: 'knobs', kFader: 'faders', kBtn: 'buttons', kPad: 'pads', cal: 'Calibrate range', calStop: 'Done calibrating', calHint: 'Move every slider and knob once all the way from low to high. If an element only sends part of the range, Patchkamer scales that to the whole travel.', rangeReset: 'Clear the range of this row', rangeTxt: (a, b) => 'range ' + a + '–' + b + ' (scaled)',
    options: 'Options', padVel: 'Fixed pad velocity (for pads that are not velocity sensitive)', noPort: n => n + ' has no input for notes: pads and keyboard do nothing', notesOffTxt: 'notes are off', toMap: l => 'mapping ' + l, toNote: (n, d) => 'note ' + n + ' to ' + d, center: 'Put the selected device in the middle of the screen', notes: 'Notes from a keyboard to the active device', refresh: 'Refresh controls', counts: n => n + (n === 1 ? ' control' : ' controls'),
    srcCc: n => 'CC ' + n, srcNote: n => 'Note ' + noteName(n), srcBend: 'Pitch bend', srcPress: 'Channel pressure', ch: 'channel', mapped: n => n + (n === 1 ? ' mapping' : ' mappings'),
    sugDone: n => n + (n === 1 ? ' mapping added' : ' mappings added'), sugNone: 'Nothing to add: learn your layout first, or all knobs are already mapped.', needSurface: 'Learn the layout of your controller first.' },
};

const normSrc = s => { s = s && typeof s === 'object' ? s : null; if (!s || !KINDS.includes(s.k)) return null; return { k: s.k, n: s.k === 'cc' || s.k === 'note' ? int(s.n, 0, 127, 0) : -1, ch: int(s.ch, 0, 16, 0) }; };
const normMap = m => { m = m && typeof m === 'object' ? m : {}; const lo = typeof m.min === 'number' && Number.isFinite(m.min) ? clamp(m.min, 0, 1) : 0, hi = typeof m.max === 'number' && Number.isFinite(m.max) ? clamp(m.max, 0, 1) : 1;
  return { src: normSrc(m.src), ctl: str(m.ctl, '', 120), label: str(m.label, '', 60), min: lo, max: hi, inv: m.inv === true, toggle: m.toggle === true }; };
const normTarget = t => { t = t && typeof t === 'object' ? t : {}; return { id: str(t.id, '', 40), def: str(t.def, '', 120), name: str(t.name, '', 80), port: str(t.port, '', 40), sw: normSrc(t.sw), maps: (Array.isArray(t.maps) ? t.maps : []).slice(0, MAXM).map(normMap) }; };
const normSurf = e => { const s = normSrc(e); if (!s) return null; const r = { ...s, kind: e.kind === 'button' ? 'button' : e.kind === 'pad' ? 'pad' : e.kind === 'fader' ? 'fader' : 'knob' }; if (Number.isFinite(e.lo) && Number.isFinite(e.hi)) { r.lo = int(e.lo, 0, 127, 0); r.hi = int(e.hi, 0, 127, 127); } return r; };
const defaults = () => ({ targets: [], active: '', surface: [], center: true, notes: true, padVel: 0 });
function normalize(s) {
  s = s && typeof s === 'object' ? s : {}; const o = defaults(), seen = new Set();
  for (const t of (Array.isArray(s.targets) ? s.targets : []).slice(0, MAXT)) { const n = normTarget(t); if (/^[a-z0-9_-]+$/i.test(n.id) && !seen.has(n.id)) { seen.add(n.id); o.targets.push(n); } }
  o.active = typeof s.active === 'string' && seen.has(s.active) ? s.active : '';
  o.surface = (Array.isArray(s.surface) ? s.surface : []).slice(0, MAXS).map(normSurf).filter(Boolean);
  o.center = s.center !== false; o.notes = s.notes !== false; o.padVel = int(s.padVel, 0, 127, 0); return o;
}
const sameSrc = (a, b) => !!a && !!b && a.k === b.k && (a.k === 'cc' || a.k === 'note' ? a.n === b.n : true) && (!a.ch || !b.ch || a.ch === b.ch);

export default {
  id: 'nl.patchkamer.midicontroller', name: 'MIDI Controller', about: { nl: 'Sluit je MIDI-controllers en keyboards aan, kies een Patchkamer-apparaat en bestuur het. Met een knop schakel je naar een ander apparaat; dezelfde draaiknoppen werken dan voor dat apparaat.', en: 'Connect your MIDI controllers and keyboards, pick a Patchkamer device and control it. A button switches to another device; the same knobs then work for that device.' }, version: '1.5.0', kind: 'utility', category: 'tool', ui: { width: 760, minWidth: 380 },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = defaults(), dead = false, root = null, access = null, status = 0, peers = [], ctlCache = new Map(), heard = new Map(), lastText = T.none, lastEl = null, msg = '';
    let learnCal = false, aiBusy = false, aiUndo = null, learn = null, learnSw = '', learnSurface = false, quick = null, quickIdx = 0, portSig = '', seenVals = new Map();
    const prev = new Map(), pid = t => 'o_' + t.id, self = {};
    const target = id => state.targets.find(t => t.id === id) || null, peerOf = id => peers.find(p => p.id === id) || null;
    const controlsOf = (t, fresh) => { if (fresh || !ctlCache.has(t.id)) { let l = []; try { l = host.controls(self, t.id) || []; } catch (e) { l = []; } ctlCache.set(t.id, l); } return ctlCache.get(t.id); };
    function resolve(t, m) { const L = controlsOf(t); let c = L.find(x => x.key === m.ctl); if (c || !m.ctl) return c || null; const base = m.ctl.replace(/#\d+$/, '').toLowerCase(); return L.find(x => x.key.replace(/#\d+$/, '').toLowerCase() === base) || null; }
    // ---- poorten: één eventuitgang per apparaat met een gebeurtenissen-ingang (noten van het keyboard) ----
    const portsNow = () => ({ audioIn: [], audioOut: [], eventIn: [], eventOut: state.targets.filter(t => t.port).map(t => ({ id: pid(t), name: '→ ' + (t.name || t.id) })), modIn: [], modOut: [], multiIn: [], multiOut: [] });
    function syncPorts() { const p = portsNow(), sig = JSON.stringify(p.eventOut); if (sig === portSig) return; portSig = sig; try { host.setPorts(self, p); } catch (e) { /* de host kent ons nog niet */ } }
    const cableOf = t => { try { return (host.cablesFrom(self, pid(t)) || []).find(c => c.to === t.id && c.kind === 'event') || null; } catch (e) { return null; } };
    function ensureCable(t) { if (!t.port || cableOf(t)) return; try { host.connect(self, pid(t), t.id, t.port, 'event'); } catch (e) { /* geen kabel mogelijk */ } }
    const emit = (t, ev) => { if (t && t.port) { try { host.emit(self, pid(t), ev); } catch (e) { /* ok */ } } };
    // ---- apparaten ----
    const pickPort = p => { const l = (p && p.eventIn) || []; const g = l.find(x => /^(notes?|trigger|midi|in)$/i.test(x.id)); return g ? g.id : l.length ? l[0].id : ''; };
    function addTarget(id) {
      const p = peerOf(id); if (!p || target(id) || state.targets.length >= MAXT) return;
      const t = normTarget({ id, def: p.def, name: p.name, port: pickPort(p) }); state.targets.push(t); if (!state.active) state.active = id; syncPorts();
      if (t.port) setTimeout(() => { if (!dead) ensureCable(t); }, 0); controlsOf(t, true); render();
    }
    function removeTarget(id) { const t = target(id); if (!t) return; try { host.disconnect(self, pid(t)); } catch (e) { /* ok */ } state.targets = state.targets.filter(x => x !== t); ctlCache.delete(id); if (state.active === id) state.active = state.targets[0] ? state.targets[0].id : ''; syncPorts(); render(); }
    // een apparaat actief maken: de vorige laat alle noten los, het nieuwe wordt gekozen en (optie) in beeld gezet
    function activate(id, opts) {
      const t = target(id); if (!t) return; const was = target(state.active); if (was && was !== t) emit(was, { type: 'allnotesoff', time: ctx.currentTime });
      state.active = id; prev.clear(); controlsOf(t, true);
      if (typeof host.show === 'function') { try { host.show(self, id, { select: true, center: !!(opts && opts.center) }); } catch (e) { /* ok */ } }
      render();
    }
    // ---- MIDI ----
    const srcLabel = s => !s ? T.unmapped : (s.k === 'cc' ? T.srcCc(s.n) : s.k === 'note' ? T.srcNote(s.n) : s.k === 'bend' ? T.srcBend : T.srcPress) + (s.ch ? ' · ' + T.ch + ' ' + s.ch : '');
    function parse(d) {
      if (!d || d.length < 1) return null; const st = d[0] & 0xf0, ch = (d[0] & 0x0f) + 1, a = d[1] | 0, b = d[2] | 0;
      if (st === 0x90 && b > 0) return { k: 'note', n: a, ch, val: b / 127, on: true }; if (st === 0x80 || st === 0x90) return { k: 'note', n: a, ch, val: 0, on: false };
      if (st === 0xb0) return { k: 'cc', n: a, ch, val: b / 127 }; if (st === 0xe0) return { k: 'bend', n: -1, ch, val: ((b << 7) | a) / 16383 }; if (st === 0xd0) return { k: 'pressure', n: -1, ch, val: a / 127 };
      return null;
    }
    function apply(t, m, mi, s) {
      let v = s.val; if (m.inv) v = 1 - v; v = m.min + v * (m.max - m.min); const key = t.id + ':' + mi, c = resolve(t, m); if (!c) return;
      if (c.type === 'check' && m.toggle) { const was = prev.get(key) || 0; prev.set(key, s.val); if (s.val >= 0.5 && was < 0.5) { host.setControl(self, t.id, c.key, c.value ? 0 : 1); c.value = !c.value; } return; }
      if (c.type === 'button') { const was = prev.get(key) || 0; prev.set(key, v); if (v >= 0.5 && was < 0.5) host.setControl(self, t.id, c.key, 1); return; }
      const q = Math.round(v * 1024); if (prev.get(key) === q) return; prev.set(key, q); host.setControl(self, t.id, c.key, v);
    }
    const isButtonSrc = s => s.k === 'note' || (seenVals.get(s.k + s.n) || new Set()).size <= 2;
    function noteSurface(s) { const key = s.k + ':' + s.n + ':' + s.ch; let set = seenVals.get(s.k + s.n); if (!set) seenVals.set(s.k + s.n, set = new Set()); set.add(Math.round(s.val * 127));
      if (!learnSurface && learnCal && s.k === 'cc') { const c = state.surface.find(x => sameSrc(x, s) && x.ch === s.ch); if (c && (c.kind === 'knob' || c.kind === 'fader')) { const raw = Math.round(s.val * 127); c.lo = Number.isFinite(c.lo) ? Math.min(c.lo, raw) : raw; c.hi = Number.isFinite(c.hi) ? Math.max(c.hi, raw) : raw; } }
      if (!learnSurface) return; let e = state.surface.find(x => sameSrc(x, s) && x.ch === s.ch); if (!e && state.surface.length < MAXS) { e = { k: s.k, n: s.n, ch: s.ch, kind: 'knob' }; state.surface.push(e); }
      if (e) e.kind = s.k === 'note' ? (e.kind === 'button' ? 'button' : 'pad') : set.size <= 2 ? (e.kind === 'pad' ? 'pad' : 'button') : e.kind === 'fader' ? 'fader' : 'knob'; }
    // kalibratie: stuurt een schuif of draaiknop bij het leren van de indeling maar een deel van 0..127 (bijvoorbeeld 0..40), dan schalen we dat bereik naar de hele slag
    const restricted = e => !!e && e.k === 'cc' && (e.kind === 'knob' || e.kind === 'fader') && Number.isFinite(e.lo) && Number.isFinite(e.hi) && e.hi - e.lo >= 4 && (e.lo > 1 || e.hi < 126);
    function calib(s) { if (s.k !== 'cc') return s; const e = state.surface.find(x => x.k === 'cc' && x.n === s.n && (!x.ch || !s.ch || x.ch === s.ch)); if (!restricted(e)) return s; return { ...s, val: clamp((s.val * 127 - e.lo) / (e.hi - e.lo), 0, 1) }; }
    function onMidi(s, portName) {
      if (!s) return; if (s.k === 'note' && !s.on) { /* noot los */ } else { lastText = srcLabel(s) + ' = ' + Math.round(s.val * 100) + '%' + (portName ? ' · ' + portName : ''); if (lastEl) lastEl.textContent = lastText; }
      noteSurface(s); if (learnCal) { render(); return; }
      if (learnSurface && !(s.k === 'note' && !s.on)) { renderSurfaceCount(); return; }
      const down = s.k === 'note' ? s.on : s.val >= 0.5;
      if (learnSw) { const t = target(learnSw); if (t && down) { t.sw = { k: s.k, n: s.n, ch: s.ch }; learnSw = ''; render(); } return; }
      if (learn) { const t = target(learn.t), m = t && t.maps[learn.m]; if (m && !(s.k === 'note' && !s.on)) { m.src = { k: s.k, n: s.n, ch: s.ch }; learn = null; render(); } return; }
      if (quick && !(s.k === 'note' && !s.on)) { quickTake(s); return; }
      // een schakelknop kiest een apparaat
      for (const t of state.targets) if (t.sw && sameSrc(t.sw, s) && (!t.sw.ch || t.sw.ch === s.ch)) { const key = 'sw:' + t.id, was = prev.get(key) || 0; prev.set(key, down ? 1 : 0); if (down && !was) { activate(t.id, { center: state.center }); } return; }
      const t = target(state.active); if (!t) return; let mapped = false; const trace = txt => { lastText += ' → ' + txt; if (lastEl) lastEl.textContent = lastText; };
      t.maps.forEach((m, mi) => { if (m.src && m.ctl && sameSrc(m.src, s) && (!m.src.ch || m.src.ch === s.ch)) { mapped = true; try { apply(t, m, mi, calib(s)); } catch (e) { /* de regelaar is weg */ } } });
      if (mapped) { trace(T.toMap(t.maps.filter(m => m.src && sameSrc(m.src, s)).map(m => m.label || m.ctl).join(', '))); return; }
      if (!state.notes) { trace(T.notesOffTxt); return; } if (!t.port) { trace(T.noPort(t.name || t.id)); return; }
      const se = surfOf(s), pad = !!se && se.kind === 'pad', pv = pad && state.padVel ? state.padVel / 127 : 0;
      if (pad && s.k === 'cc') {   // een pad dat een CC stuurt speelt een noot: 36 voor het eerste pad, daarna omhoog
        const note = clamp(36 + state.surface.filter(e => e.kind === 'pad').sort(srt).indexOf(se), 0, 127), key = 'pad:' + s.n + ':' + s.ch, was = prev.get(key) || 0, dn = s.val >= 0.5; prev.set(key, dn ? 1 : 0);
        if (dn && !was) { emit(t, { type: 'note', note, vel: pv || Math.max(0.3, s.val), time: ctx.currentTime, held: true, ch: s.ch }); trace(T.toNote(noteName(note), t.name || t.id)); } else if (!dn && was) emit(t, { type: 'noteoff', note, vel: 0, time: ctx.currentTime, ch: s.ch }); return;
      }
      if (s.k === 'note') { emit(t, s.on ? { type: 'note', note: s.n, vel: pv || s.val, time: ctx.currentTime, held: true, ch: s.ch } : { type: 'noteoff', note: s.n, vel: 0, time: ctx.currentTime, ch: s.ch }); if (s.on) trace(T.toNote(noteName(s.n), t.name || t.id)); }
      else if (s.k === 'bend') emit(t, { type: 'cc', id: 'bend', value: s.val, time: ctx.currentTime, ch: s.ch });
      else if (s.k === 'pressure') emit(t, { type: 'cc', id: 'pressure', value: s.val, time: ctx.currentTime, ch: s.ch });
      else if (s.k === 'cc') emit(t, { type: 'cc', id: s.n === 1 ? 'vibrato' : s.n === 64 ? 'pedal' : 'cc' + s.n, cc: s.n, value: s.val, time: ctx.currentTime, ch: s.ch });
    }
    function inputsList() { const l = []; if (access) access.inputs.forEach(i => l.push({ id: i.id, name: i.name || i.id })); return l; }
    function bind() { if (!access) return; access.inputs.forEach(i => { i.onmidimessage = e => { if (dead) return; if (!heard.has(i.id)) { heard.set(i.id, true); renderInputs(); } onMidi(parse(e.data), i.name); }; }); }
    async function connect() {
      if (status === 1) return; if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') { status = 2; msg = T.noMidi; render(); return; }
      status = 1; render();
      try { access = await navigator.requestMIDIAccess({ sysex: false }); if (dead) return; status = 3; msg = ''; bind(); access.onstatechange = () => { if (!dead) { bind(); renderInputs(); } }; }
      catch (e) { status = 2; msg = (e && e.name === 'SecurityError') ? T.denied : (e && e.message) || T.denied; }
      render();
    }
    // ---- snel koppelen en voorstel ----
    const rangeCtl = c => c.type === 'range', btnCtl = c => c.type === 'check' || c.type === 'button' || c.type === 'select';
    const used = t => new Set(t.maps.map(m => m.ctl));
    function newMapFor(t, c, s) { return { src: s ? { k: s.k, n: s.n, ch: s.ch } : null, ctl: c.key, label: c.label || '', min: 0, max: 1, inv: false, toggle: c.type === 'check' }; }
    function quickTake(s) {
      const t = target(state.active); if (!t) return; const free = controlsOf(t).filter(c => !used(t).has(c.key)), btn = isButtonSrc(s);
      const c = free.find(btn ? btnCtl : rangeCtl) || free[0]; if (!c) { quick = null; render(); return; }
      if (t.maps.some(m => sameSrc(m.src, s) && (!m.src.ch || m.src.ch === s.ch))) return;   // dezelfde knop nog eens: al gekoppeld
      if (t.maps.length < MAXM) t.maps.push(newMapFor(t, c, s)); render();
    }
    // de indeling als rijen: opeenvolgende CC's (of knoppen) vormen een rij van hoogstens 8; zo herkennen we rijen draaiknoppen, een rij schuiven en rijen knoppen
    const srt = (a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : (a.ch || 0) - (b.ch || 0) || a.n - b.n);
    const surfOf = s => state.surface.find(x => sameSrc(x, s) && (!x.ch || !s.ch || x.ch === s.ch)) || null;
    function runs() {
      const out = [];
      for (const grp of [['knob', 'fader'], ['button'], ['pad']]) {
        const L = state.surface.filter(e => grp.includes(e.kind) && e.k !== 'bend' && e.k !== 'pressure').sort(srt); let cur = null;
        for (const e of L) { const last = cur && cur.items[cur.items.length - 1]; if (!cur || e.k !== last.k || (e.ch || 0) !== (last.ch || 0) || e.n !== last.n + 1 || cur.items.length >= 8) out.push(cur = { grp: grp[0], items: [] }); cur.items.push(e); }
      }
      return out;
    }
    const runKind = r => r.items.every(e => e.kind === 'fader') ? 'fader' : r.grp;
    // na het leren: de rij met de hoogste CC-nummers is bij twee of meer rijen van minstens 4 de rij schuiven (zo zitten bijna alle controllers in elkaar); je kunt dat per rij wijzigen
    function guessFaders() {
      const rr = runs().filter(r => r.grp === 'knob' && r.items.length >= 4 && r.items[0].k === 'cc'); if (rr.length < 2 || rr.some(r => runKind(r) === 'fader')) return;
      rr[rr.length - 1].items.forEach(e => { e.kind = 'fader'; });
    }
    // 'Trim - T3' hoort bij strook T3; regelaars zonder zo'n achtervoegsel (master, instellingen) horen bij geen strook
    const stripOf = c => { const k = String(c.label || '').split(' - '); return k.length > 1 ? k[k.length - 1] : ''; };
    const baseOf = c => String(c.label || '').split(' - ')[0].toLowerCase();
    const isFaderCtl = c => c.type === 'range' && /^(fader|level|volume|vol|niveau|gain)/.test(baseOf(c));
    const PRI = [/^pan/, /^send/, /^high|^hi\b/, /^mid/, /^low/, /^trim/, /^return|^ret/];
    const rank = c => { const b = baseOf(c), i = PRI.findIndex(x => x.test(b)); return i < 0 ? PRI.length : i; };
    function suggest(t) {
      const surf = state.surface; if (!surf.length) { msg = T.needSurface; render(); return; }
      const taken = e => t.maps.some(m => sameSrc(m.src, e)); let n = 0;
      const add = (c, e) => { if (c && e && !taken(e) && !used(t).has(c.key) && t.maps.length < MAXM) { t.maps.push(newMapFor(t, c, e)); n++; return true; } return false; };
      const free = controlsOf(t, true).filter(c => !used(t).has(c.key)), rs = free.filter(rangeCtl), bs = free.filter(btnCtl).filter(c => c.type !== 'select'), rr = runs();
      const knobRuns = rr.filter(r => runKind(r) === 'knob' && r.grp === 'knob'), faderRuns = rr.filter(r => runKind(r) === 'fader'), btnRuns = rr.filter(r => r.grp === 'button');
      const strips = new Map(); for (const c of free) { const k = stripOf(c); if (k) { if (!strips.has(k)) strips.set(k, []); strips.get(k).push(c); } }
      if (strips.size >= 2) {
        // een apparaat met kanaalstroken (zoals een mengtafel): kolom i van de controller is strook i, rij r is de r-de regelaar van elke strook
        const S = [...strips.values()], fad = S.map(l => l.find(isFaderCtl)), rest = S.map(l => l.filter(c => rangeCtl(c) && !isFaderCtl(c)).sort((a, b) => rank(a) - rank(b))), bt = S.map(l => l.filter(c => c.type === 'check' || c.type === 'button'));
        faderRuns.forEach((r, ri) => r.items.forEach((e, i) => { const k = ri * 8 + i; add(fad[k], e); }));
        knobRuns.forEach((r, ri) => r.items.forEach((e, i) => add(rest[i] && rest[i][ri], e)));
        btnRuns.forEach((r, ri) => r.items.forEach((e, i) => add(bt[i] && bt[i][ri], e)));
      } else {
        // één apparaat: de schuiven krijgen de niveauregelaars, de draaiknoppen de rest in de volgorde van het apparaat
        const fc = rs.filter(isFaderCtl), oc = rs.filter(c => !isFaderCtl(c)), pool = faderRuns.length ? oc : rs;
        let fi = 0; faderRuns.forEach(r => r.items.forEach(e => { const c = fc[fi] || oc.shift(); if (c) { fi++; add(c, e); } }));
        let ki = 0; const list = faderRuns.length ? oc.filter(c => !used(t).has(c.key)) : pool; knobRuns.forEach(r => r.items.forEach(e => { while (ki < list.length && used(t).has(list[ki].key)) ki++; if (list[ki] && add(list[ki], e)) ki++; }));
        let bi = 0; btnRuns.forEach(r => r.items.forEach(e => { if (bs[bi] && add(bs[bi], e)) bi++; }));
      }
      msg = n ? T.sugDone(n) : T.sugNone; render();
    }
    // ---- AI-voorstel (contract v1.29): de AI krijgt de regelaars van het apparaat en je indeling, en antwoordt met paren (bron, regelaar) als JSON; wij controleren elk paar ----
    const aiHas = () => typeof host.ai === 'function';
    function aiPrompt(t, L, rr) {
      const ctl = L.map((c, i) => ({ i, label: c.label, type: c.type, ...(c.type === 'range' ? { min: c.min, max: c.max } : {}), ...(c.type === 'select' ? { options: (c.options || []).slice(0, 12).map(o => o.text) } : {}) }));
      const rows = rr.map((r, ri) => ({ row: ri, kind: r.items[0].k === 'note' && r.grp === 'pad' ? 'pad' : runKind(r) === 'fader' ? 'fader' : r.grp === 'button' ? 'button' : r.grp === 'pad' ? 'pad' : 'knob', sources: r.items.map(e => ({ s: state.surface.indexOf(e), name: srcLabel(e) })) }));
      const system = 'You map the knobs, faders and buttons of a MIDI controller onto the controls of a music device. Answer with one JSON object only, no other text: {"maps":[{"s":<source index>,"c":<control index>,"inv":false}]}. Rules: a knob or fader (kind knob or fader) goes only on a control of type range; a button goes only on a control of type check or button; never use pads. Use every source and every control at most once. Choose the controls a performer wants under their hands first (level or volume, filter cutoff and resonance, pan, send, EQ, tempo, mute and solo). If the device has several channel strips (labels ending in " - T1", " - T2" and so on), keep each column of the controller on one strip: the sources of one row go to the same kind of control on strips 1, 2, 3 in order, and put faders on the fader or level of each strip. Do not map more sources than there are sensible controls.';
      return { system, prompt: 'Device: ' + (t.name || t.def) + '\nControls (i = control index):\n' + JSON.stringify(ctl) + '\nController rows (s = source index; a row is a line of neighbouring knobs, faders or buttons):\n' + JSON.stringify(rows) };
    }
    function aiParse(text, t, L) {
      let o = null; const a = text.indexOf('{'), b = text.lastIndexOf('}'); if (a < 0 || b <= a) return []; try { o = JSON.parse(text.slice(a, b + 1)); } catch (e) { return []; }
      const arr = o && Array.isArray(o.maps) ? o.maps : [], out = [], us = new Set(), uc = new Set(used(t));
      for (const m of arr.slice(0, MAXM)) {
        if (!m || !Number.isInteger(m.s) || !Number.isInteger(m.c)) continue; const e = state.surface[m.s], c = L[m.c]; if (!e || !c || us.has(m.s) || uc.has(c.key) || e.kind === 'pad' || taken(t, e)) continue;
        const knob = e.kind === 'knob' || e.kind === 'fader'; if (knob ? c.type !== 'range' : !(c.type === 'check' || c.type === 'button')) continue;
        us.add(m.s); uc.add(c.key); const mp = newMapFor(t, c, e); mp.inv = m.inv === true && knob; out.push(mp);
      }
      return out;
    }
    const taken = (t, e) => t.maps.some(m => sameSrc(m.src, e));
    async function aiSuggest(t) {
      if (aiBusy) return; if (!aiHas() || !host.ai(self, 'available')) { msg = T.aiOff; try { if (aiHas()) host.ai(self, 'settings'); } catch (e) { /* ok */ } render(); return; }
      if (!state.surface.length) { msg = T.needSurface; render(); return; }
      const L = controlsOf(t, true), rr = runs(); aiBusy = true; msg = T.aiBusy; render();
      try {
        const q = aiPrompt(t, L, rr), text = await host.ai(self, 'ask', { system: q.system, prompt: q.prompt, maxTokens: 3000 }); if (dead) return;
        const add = aiParse(String(text || ''), t, L).slice(0, Math.max(0, MAXM - t.maps.length));
        if (!add.length) msg = T.aiNone; else { aiUndo = { t: t.id, n: add.length }; t.maps.push(...add); msg = T.aiDone(add.length); }
      } catch (e) { msg = e && e.code === 'declined' ? T.aiDeclined : T.aiErr((e && e.message) || ''); }
      aiBusy = false; if (!dead) render();
    }
    // ---- UI ----
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const btn = (text, fn, parent, cls) => { const b = el('button', text, parent, cls); b.type = 'button'; b.onclick = fn; return b; };
    const CSS = ':host{display:block}.mc{display:grid;gap:12px;font-size:12px;color:var(--fg)}.mc h4{margin:0 0 4px;font:700 11px var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.hint{color:var(--muted);line-height:1.45}'
      + '.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.box{border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--card-2,transparent);display:grid;gap:8px}'
      + '.mc button{font:inherit;padding:3px 9px}.mc select,.mc input[type=number]{font:inherit;padding:2px 4px;max-width:100%}.dev{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--line);border-radius:6px;cursor:pointer}.dev.on{border-color:var(--sel);box-shadow:0 0 0 1px var(--sel)}.dev b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.pill{padding:1px 8px;border-radius:999px;background:var(--sel);color:#fff;font-size:10px}.muted{color:var(--muted)}.led{width:9px;height:9px;border-radius:50%;background:var(--line)}.led.on{background:var(--go,#6bd98a)}'
      + '.map{display:grid;grid-template-columns:minmax(110px,1fr) minmax(140px,1.6fr) auto auto auto auto;gap:6px;align-items:center}.map .src{font:11px var(--mono,monospace)}.warn{color:var(--event)}.msg{color:var(--event)}.learning{outline:2px solid var(--event)}';
    let sh = null, devBox = null, mapBox = null, inBox = null, surfLine = null;
    function render() {
      if (!sh || dead) return; sh.innerHTML = ''; const st = el('style', CSS, sh); const m = el('div', null, sh, 'mc');
      // verbinden en ingangen
      const top = el('div', null, m, 'box'); const r0 = el('div', null, top, 'row'); btn(status === 3 ? T.connected : status === 1 ? T.connecting : T.connect, connect, r0).disabled = status === 1 || status === 3; if (msg) el('span', msg, r0, 'msg');
      inBox = el('div', null, top); renderInputs();
      const lr = el('div', null, top, 'row'); el('span', T.last + ':', lr, 'muted'); lastEl = el('span', lastText, lr);
      // apparaten
      devBox = el('div', null, m, 'box'); el('h4', T.devices, devBox);
      if (!state.targets.length) el('div', T.noDevices, devBox, 'muted');
      state.targets.forEach(t => {
        const row = el('div', null, devBox, 'dev' + (t.id === state.active ? ' on' : '')), p = peerOf(t.id); row.onclick = e => { if (e.target.closest('button')) return; activate(t.id, { center: state.center }); };
        el('b', t.name || t.id, row); if (t.id === state.active) el('span', T.active, row, 'pill'); if (!p) el('span', T.gone, row, 'warn');
        el('span', t.sw ? srcLabel(t.sw) : T.noSwitch, row, 'muted' + (learnSw === t.id ? ' learning' : ''));
        btn(learnSw === t.id ? T.learningSwitch : T.learnSwitch, () => { learnSw = learnSw === t.id ? '' : t.id; learn = null; quick = null; render(); }, row);
        btn('×', () => removeTarget(t.id), row).title = T.remove;
      });
      const free = peers.filter(p => !target(p.id) && p.def !== 'nl.patchkamer.midicontroller'); const r1 = el('div', null, devBox, 'row');
      const sel = el('select', null, r1); sel.appendChild(Object.assign(el('option', T.add), { value: '' })); free.forEach(p => sel.appendChild(Object.assign(el('option', p.name), { value: p.id }))); sel.onchange = () => { if (sel.value) addTarget(sel.value); };
      // koppelingen van het actieve apparaat
      const t = target(state.active);
      if (t) {
        mapBox = el('div', null, m, 'box'); el('h4', T.maps + ' ' + (t.name || t.id), mapBox); if (!t.port) el('div', T.noPort(t.name || t.id), mapBox, 'msg'); const L = controlsOf(t);
        const bar = el('div', null, mapBox, 'row'); btn(T.suggest, () => suggest(t), bar).title = T.suggestTip; if (aiHas()) { const ab = btn(T.ai, () => aiSuggest(t), bar); ab.title = T.aiTip; ab.disabled = aiBusy; }
        btn(quick ? T.quickStop : T.quick, () => { quick = quick ? null : { t: t.id }; learn = null; learnSw = ''; render(); }, bar).classList.toggle('learning', !!quick);
        btn(T.addMap, () => { if (t.maps.length < MAXM) { t.maps.push(normMap({})); render(); } }, bar); btn(T.refresh, () => { controlsOf(t, true); render(); }, bar); btn(T.clearMaps, () => { t.maps = []; prev.clear(); render(); }, bar);
        el('span', T.counts(L.length) + ' · ' + T.mapped(t.maps.length), bar, 'muted');
        if (aiUndo && aiUndo.t === t.id && t.maps.length >= aiUndo.n) btn(T.aiUndo, () => { t.maps.splice(t.maps.length - aiUndo.n, aiUndo.n); aiUndo = null; prev.clear(); msg = ''; render(); }, bar);
        if (quick) { const next = L.filter(c => !used(t).has(c.key))[0]; el('div', next ? T.quickNext(next.label) : '…', mapBox, 'msg'); }
        t.maps.forEach((mp, mi) => {
          const row = el('div', null, mapBox, 'map'); el('span', srcLabel(mp.src), row, 'src');
          const cs = el('select', null, row); cs.appendChild(Object.assign(el('option', T.pick), { value: '' })); let found = !mp.ctl; for (const c of L) { const o = el('option', c.label, cs); o.value = c.key; if (c.key === mp.ctl) { o.selected = true; found = true; } }
          if (!found) { const o = el('option', mp.label + ' (' + T.missing + ')', cs); o.value = mp.ctl; o.selected = true; }
          cs.onchange = () => { mp.ctl = cs.value; const c = L.find(x => x.key === cs.value); mp.label = c ? c.label : ''; if (c) mp.toggle = c.type === 'check'; };
          btn(learn && learn.t === t.id && learn.m === mi ? T.learning : T.learn, () => { learn = learn && learn.m === mi ? null : { t: t.id, m: mi }; learnSw = ''; quick = null; render(); }, row);
          const iv = el('label', null, row); const ck = el('input', null, iv); ck.type = 'checkbox'; ck.checked = mp.inv; ck.onchange = () => { mp.inv = ck.checked; }; el('span', ' ' + T.invert, iv);
          const rg = el('span', null, row, 'muted'); for (const k of ['min', 'max']) { const n = el('input', null, rg); n.type = 'number'; n.min = 0; n.max = 100; n.step = 5; n.style.width = '52px'; n.value = Math.round(mp[k] * 100); n.title = T[k]; n.onchange = () => { mp[k] = clamp((+n.value || 0) / 100, 0, 1); }; }
          btn('×', () => { t.maps.splice(mi, 1); prev.clear(); render(); }, row).title = T.del;
        });
      }
      // indeling van de controller
      const sb = el('div', null, m, 'box'); el('h4', T.surface, sb); const sr = el('div', null, sb, 'row');
      btn(learnSurface ? T.surfaceStop : T.surfaceLearn, () => { learnSurface = !learnSurface; if (!learnSurface) guessFaders(); learn = null; learnSw = ''; quick = null; render(); }, sr).classList.toggle('learning', learnSurface);
      btn(learnCal ? T.calStop : T.cal, () => { learnCal = !learnCal; learnSurface = false; learn = null; learnSw = ''; quick = null; render(); }, sr).classList.toggle('learning', learnCal);
      btn(T.surfaceClear, () => { state.surface = []; seenVals.clear(); render(); }, sr); surfLine = el('span', T.surfaceN(state.surface.length), sr, 'muted'); if (learnSurface) el('div', T.surfaceHint, sb, 'hint'); if (learnCal) el('div', T.calHint, sb, 'hint');
      if (!learnSurface) for (const r of runs()) { const a = r.items[0], z = r.items[r.items.length - 1], rw = el('div', null, sb, 'row'); el('span', srcLabel(a) + (r.items.length > 1 ? ' – ' + z.n : '') + ' · ' + r.items.length + '×', rw); const rs = r.items.filter(restricted); if (rs.length) { el('span', T.rangeTxt(Math.min(...rs.map(e => e.lo)), Math.max(...rs.map(e => e.hi))), rw, 'muted'); btn('×', () => { r.items.forEach(e => { delete e.lo; delete e.hi; }); render(); }, rw).title = T.rangeReset; }
        const opts = r.grp === 'knob' ? [['knob', T.kKnob], ['fader', T.kFader]] : [['pad', T.kPad], ['button', T.kBtn]];
        const sel = el('select', null, rw); for (const [v, tx] of opts) { const o = el('option', tx, sel); o.value = v; } sel.value = runKind(r) === 'fader' ? 'fader' : r.grp; sel.onchange = () => { r.items.forEach(e => { e.kind = sel.value; }); render(); }; }
      // opties
      const ob = el('div', null, m, 'box'); el('h4', T.options, ob);
      { const lb = el('label', null, ob, 'row'), c = el('input', null, lb), n = el('input', null, lb); c.type = 'checkbox'; c.checked = state.padVel > 0; n.type = 'number'; n.min = 1; n.max = 127; n.step = 1; n.style.width = '56px'; n.value = state.padVel || 100; n.disabled = !c.checked; c.onchange = () => { state.padVel = c.checked ? int(+n.value, 1, 127, 100) : 0; n.disabled = !c.checked; }; n.onchange = () => { if (c.checked) state.padVel = int(+n.value, 1, 127, 100); }; el('span', T.padVel, lb); }
      for (const [k, tx] of [['center', T.center], ['notes', T.notes]]) { const lb = el('label', null, ob, 'row'); const c = el('input', null, lb); c.type = 'checkbox'; c.checked = state[k]; c.onchange = () => { state[k] = c.checked; }; el('span', tx, lb); }
    }
    function renderInputs() { if (!inBox) return; inBox.innerHTML = ''; el('h4', T.inputs, inBox); const L = inputsList(); if (!L.length) { el('div', status === 3 ? T.noInputs : '', inBox, 'muted'); return; }
      L.forEach(i => { const r = el('div', null, inBox, 'row'); el('span', null, r, 'led' + (heard.get(i.id) ? ' on' : '')); el('span', i.name, r); }); }
    function renderSurfaceCount() { if (surfLine) surfLine.textContent = T.surfaceN(state.surface.length); }
    Object.assign(self, {
      inputs: {}, outputs: {},
      mount(parent) { root = parent; sh = parent.attachShadow ? (parent.shadowRoot || parent.attachShadow({ mode: 'open' })) : parent; render(); },
      unmount() { if (sh) sh.innerHTML = ''; sh = null; devBox = mapBox = inBox = surfLine = lastEl = null; },
      onPeers(list) { peers = Array.isArray(list) ? list : []; for (const t of state.targets) { const p = peerOf(t.id); if (p) { t.name = p.name; t.def = p.def; if (!t.port || !(p.eventIn || []).some(x => x.id === t.port)) { t.port = pickPort(p); if (t.port) setTimeout(() => { if (!dead) ensureCable(t); }, 0); } } } syncPorts(); ctlCache.clear(); if (sh) render(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { state = normalize(s); learn = null; learnSw = ''; learnSurface = false; quick = null; prev.clear(); ctlCache.clear(); syncPorts(); for (const t of state.targets) if (t.port && peerOf(t.id)) setTimeout(() => { if (!dead) ensureCable(t); }, 0); if (sh) render(); },
      // preset: de koppelingen en schakelknoppen per apparaatsoort, de indeling van de controller en de opties; geen apparaten of kabels
      getPreset() { const maps = {}, sw = {}; for (const t of state.targets) if (t.def && t.maps.length) { maps[t.def] = t.maps; if (t.sw) sw[t.def] = t.sw; } return JSON.parse(JSON.stringify({ maps, switches: sw, surface: state.surface, center: state.center, notes: state.notes, padVel: state.padVel })); },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; if (Array.isArray(p.surface)) state.surface = p.surface.slice(0, MAXS).map(normSurf).filter(Boolean); if (typeof p.center === 'boolean') state.center = p.center; if (typeof p.padVel === 'number') state.padVel = int(p.padVel, 0, 127, 0); if (typeof p.notes === 'boolean') state.notes = p.notes;
        const maps = p.maps && typeof p.maps === 'object' ? p.maps : {}, sw = p.switches && typeof p.switches === 'object' ? p.switches : {};
        for (const t of state.targets) { const rows = maps[t.def] || maps['*']; if (Array.isArray(rows)) t.maps = rows.slice(0, MAXM).map(normMap); if (sw[t.def]) t.sw = normSrc(sw[t.def]); }
        prev.clear(); if (sh) render(); },
      destroy() { dead = true; if (access) { access.inputs.forEach(i => { i.onmidimessage = null; }); access.onstatechange = null; } try { for (const t of state.targets) host.disconnect(self, pid(t)); } catch (e) { /* ok */ } },
    });
    return self;
  },
};
