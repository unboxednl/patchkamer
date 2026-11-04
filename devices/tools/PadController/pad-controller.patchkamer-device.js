// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Pad Controller en nieuwe id nl.patchkamer.padcontroller; songs uit die tijd verwijzen naar de oude id. Tweetalig (host.lang, apparaat- en poortnamen per taal in i18n).
//          Het apparaat herkent zijn controller niet meer aan de naam van de MIDI-poort: je kiest zelf per ingang wat die stuurt (toetsen, pads + knoppen of negeren) en de uitgang voor de lampjes (standaard geen).
//          setState negeert onbekende velden en geeft ongeldige waarden de standaard. getPreset/setPreset bewaren alleen de timing; koppelingen, rollen en poortkeuze horen niet in een preset.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
/** Pad Controller — Patchkamer contract v1.11 (besturing). Zelfstandig, geen externe bestanden.
 * Koppel apparaten aan de 40 pads van een pad-controller met een raster van 8 × 5 pads. Bij het koppelen legt Patchkamer zelf de kabels:
 * een gebeurteniskabel van 'Pad N' naar de noten- of triggeringang, en een paarse kabel van 'Knoppen' naar Mod.
 * Shift + pad kiest welk apparaat je bespeelt; de pads lichten op in de kleur van hun apparaat, het gekozen pad pulseert.
 * Stap 1: koppelen, kiezen, toetsen spelen. Stap 2 (volgt): vaste indeling per soort apparaat (drumpads, knoppen).
 * Verwachte MIDI-indeling van de controller: pad N is nootnummer N-1 (0–39); Shift is noot 98; de knoppen sturen CC 48–55 (relatief);
 * de lampjes krijgen noot-aan op hetzelfde nootnummer als de pad (kanaal 1 = uit, kanaal 3 = vast, kanaal 10 = pulserend, snelheid = kleurnummer).
 * Web MIDI pas na een klik; geen sysex.
 * 1.0.1: timing 'Strak' gebruikt de tijdstempel van elk MIDI-bericht: elke aanslag krijgt dezelfde kleine vaste vertraging
 *        (12 ms) in plaats van een wisselende, ook als de pagina even druk is. 'Direct' speelt zo snel mogelijk.
 * Ingang 'midi' accepteert ruwe berichten {type:'midi', role:'keys'|'ctrl', data:[status,d1,d2]} (testen, of van Keys).
 */
const NP = 40;
const PREF_IN = ['notes', 'trigger', 'akkoord', 'trig', 'midi'];
// kleur per categorie: kleurnummer voor de lampjes van de pads (5 = rood)
const CAT_LED = { synth: 9, groove: 5, sequencer: 13, mod: 49, effect: 37, mix: 45, tool: 3, other: 21 };
const CAT_CSS = { synth: '#f4a261', groove: '#e4574a', sequencer: '#f4d35e', mod: '#b48cff', effect: '#4fd1c5', mix: '#5f8dff', tool: '#c8cdd4', other: '#8bdb6a' };
const NOTE_SHIFT = 98, BTN_TRACK = [64, 65, 66, 67, 68, 69, 70, 71], BTN_SCENE = [82, 83, 84, 85, 86], BTN_STOPALL = 81, BTN_PLAY = 91, BTN_REC = 93;

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief
const EN = {
  'Koppel een apparaat aan een pad: Patchkamer legt de kabels. Op de controller kies je met Shift + pad welk apparaat je bespeelt. Je kunt hier ook op een pad klikken.':
    'Link a device to a pad: Patchkamer lays the cables. On the controller, Shift + pad chooses which device you play. You can also click a pad here.',
  'Deze Patchkamer kan nog geen kabels leggen voor apparaten (contract v1.7 nodig). Werk Patchkamer bij.': 'This Patchkamer cannot lay cables for devices yet (contract v1.7 needed). Update Patchkamer.',
  'Verbind met MIDI': 'Connect MIDI',
  'Timing: strak (+12 ms, gelijkmatig)': 'Timing: tight (+12 ms, even)', 'Timing: direct (zo snel mogelijk)': 'Timing: direct (as fast as possible)',
  'Shift op de controller; klik hier om Shift na te doen met de muis': 'Shift on the controller; click here to imitate Shift with the mouse',
  'Knoppen (paars) →': 'Buttons (purple) →', 'Knoppen': 'Buttons', 'MIDI (ruw)': 'MIDI (raw)',
  'Stap 1: koppelen, kiezen en spelen met de toetsen. In stap 2 krijgt elk soort apparaat een vaste indeling: drumpads voor drumcomputers, de 8 knoppen op de belangrijkste parameters. De pads lichten op in de kleur van de categorie van hun apparaat (de exacte kleur op de controller kan iets afwijken).':
    'Step 1: link, choose and play with the keys. In step 2 each kind of device gets a fixed layout: drum pads for drum machines, the 8 knobs on the main parameters. The pads light up in the colour of their device category (the exact colour on the controller may differ a little).',
  'Kies per MIDI-ingang wat die stuurt en kies de uitgang voor de lampjes. Zonder uitgang blijven de lampjes uit.': 'Choose for each MIDI input what it sends, and choose the output for the LEDs. Without an output the LEDs stay off.',
  'knoppen/pads': 'buttons/pads', 'toetsen': 'keys',
  'Web MIDI is hier niet beschikbaar. Gebruik een browser met Web MIDI en het losse Patchkamer-bestand (niet de ingebedde weergave).': 'Web MIDI is not available here. Use a browser with Web MIDI and the standalone Patchkamer file (not the embedded view).',
  'MIDI verbonden': 'MIDI connected', 'Geen toegang tot MIDI: ': 'No access to MIDI: ',
  'knop {0}: {1} (indeling volgt in stap 2)': 'knob {0}: {1} (layout follows in step 2)',
  ' (kabel los)': ' (cable loose)', '(apparaat weg)': '(device gone)',
  'Pad {0}: {1}{2} · Shift+pad of dubbelklik: bespelen': 'Pad {0}: {1}{2} · Shift+pad or double-click: play', 'Pad {0}: vrij': 'Pad {0}: free',
  'apparaat voor pad {0}': 'device for pad {0}', '— niet gekoppeld —': '— not linked —', ' (alleen knoppen)': ' (buttons only)', 'ingang': 'input', 'ingang: ': 'input: ',
  'Koppel “{0}”': 'Link “{0}”', 'het apparaat dat je op het canvas het laatst hebt aangeklikt': 'the device you last clicked on the canvas',
  'Kabel opnieuw leggen': 'Lay cable again', 'Bespelen': 'Play', 'Ontkoppel': 'Unlink',
  'Je bespeelt nu: pad {0} → {1}': 'You are now playing: pad {0} → {1}', ' (toetsen gaan naar {0})': ' (keys go to {0})', ' (alleen knoppen, geen ingang voor noten)': ' (buttons only, no input for notes)',
  'Nog geen apparaat gekozen: koppel een pad en druk Shift + pad (of dubbelklik hier op het pad).': 'No device chosen yet: link a pad and press Shift + pad (or double-click the pad here).',
  '{0} MIDI-ingang': '{0} MIDI input', '{0} MIDI-ingangen': '{0} MIDI inputs',
  'geen MIDI-apparaat gevonden (staat de controller aan en via USB aangesloten?)': 'no MIDI device found (is the controller on and connected over USB?)', 'nog niet verbonden': 'not connected yet',
  'pads + knoppen': 'pads + buttons', 'negeren': 'ignore',
  'lampjes naar': 'LEDs to', '— geen —': '— none —'
};

export default {
  id: 'nl.patchkamer.padcontroller', name: 'Pad Controller', version: '1.11.0', kind: 'utility', category: 'tool',
  ui: { width: 940, minWidth: 520, jacks: true },
  i18n: { nl: { ports: { midi: 'MIDI (ruw)', knoppen: 'Knoppen' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'midi', name: 'MIDI (raw)' }],
    eventOut: Array.from({ length: NP }, (_, i) => ({ id: 'pad' + (i + 1), name: 'Pad ' + (i + 1) })), modIn: [], modOut: [{ id: 'knoppen', name: 'Buttons' }] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.split('{' + i + '}').join(v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    let self, dead = false, access = null, peers = [], shift = false, midiMsg = '', learnedRoles = {};
    const can = !!(host && typeof host.peers === 'function' && typeof host.connect === 'function');
    const DEF = () => ({ slots: {}, active: 0, outName: '', roles: {}, timing: 'strak' });
    let S = DEF();
    // ---------- koppelen ----------
    const peer = id => peers.find(p => p.id === id);
    const bestIn = p => { if (!p || !p.eventIn.length) return ''; for (const k of PREF_IN) if (p.eventIn.some(x => x.id === k)) return k; return p.eventIn[0].id; };
    function link(pad, targetId, inPort) { const p = peer(targetId); if (!p || !can) return false; unlink(pad, true);
      const port = inPort && p.eventIn.some(x => x.id === inPort) ? inPort : bestIn(p);
      if (port) host.connect(self, 'pad' + pad, targetId, port, 'event');
      if (p.mod) host.connect(self, 'knoppen', targetId, 'mod', 'mod');
      S.slots[pad] = { target: targetId, port }; if (!S.active) S.active = pad; refresh(); return true; }
    function unlink(pad, quiet) { const sl = S.slots[pad]; if (!sl) return; host.disconnect(self, 'pad' + pad);
      delete S.slots[pad]; if (!Object.values(S.slots).some(x => x.target === sl.target)) host.disconnect(self, 'knoppen', sl.target);
      if (S.active === pad) S.active = 0; if (!quiet) refresh(); }
    function relink(pad) { const sl = S.slots[pad]; if (sl) link(pad, sl.target, sl.port); }
    function slotOk(pad) { const sl = S.slots[pad]; if (!sl) return 'leeg'; if (!peer(sl.target)) return 'weg'; if (!sl.port) return 'ok';
      const c = host.cablesFrom ? host.cablesFrom(self, 'pad' + pad) : []; return c.some(x => x.to === sl.target && x.toPort === sl.port) ? 'ok' : 'los'; }
    function activate(pad) { if (!S.slots[pad]) return; allNotesOff(); S.active = pad; refresh(); }
    // ---------- timing: MIDI-tijdstempel (performance.now-klok) → AudioContext-tijd ----------
    function timeOf(stamp) { const now = ctx.currentTime; if (S.timing !== 'strak' || !Number.isFinite(stamp) || typeof ctx.getOutputTimestamp !== 'function') return now;
      try { const o = ctx.getOutputTimestamp(); if (!o || !Number.isFinite(o.performanceTime) || !o.performanceTime) return now;
        const t = o.contextTime + (stamp - o.performanceTime) / 1000 + 0.012; return Math.max(now, Math.min(now + 0.05, t)); } catch (e) { return now; } }
    // ---------- spelen ----------
    const held = new Set();
    function send(ev) { const sl = S.slots[S.active]; if (!sl || !sl.port || slotOk(S.active) !== 'ok') return; try { host.emit(self, 'pad' + S.active, ev); } catch (e) {} }
    function allNotesOff() { const sl = S.slots[S.active]; if (sl && sl.port) for (const n of held) try { host.emit(self, 'pad' + S.active, { type: 'noteoff', note: n, vel: 0, time: ctx.currentTime }); } catch (e) {} held.clear(); }
    function onMidi(role, d, stamp) { if (!d || d.length < 2) return; const st = d[0] & 0xf0, d1 = d[1], d2 = d[2] || 0, on = st === 0x90 && d2 > 0, off = st === 0x80 || (st === 0x90 && d2 === 0);
      midiMsg = `${role === 'ctrl' ? tx('knoppen/pads') : tx('toetsen')}: ${[...d].map(x => x.toString(16).padStart(2, '0')).join(' ')}`;
      if (role === 'ctrl') {
        if ((on || off) && d1 === NOTE_SHIFT) { shift = on; paintShift(); return; }
        if (on && d1 < NP) { const pad = d1 + 1; if (shift) { if (S.slots[pad]) activate(pad); else { ui.pick = pad; paint(); } } else { ui.pick = pad; paint(); } flashPad(pad); return; }
        if (st === 0xb0 && d1 >= 48 && d1 <= 55) { const delta = d2 > 64 ? d2 - 128 : d2; knob(d1 - 48, delta); return; }
        return; }
      // toetsen
      if (on) { held.add(d1); send({ type: 'noteon', note: d1, vel: d2 / 127, time: timeOf(stamp) }); }
      else if (off) { held.delete(d1); send({ type: 'noteoff', note: d1, vel: 0, time: timeOf(stamp) }); }
      else if (st === 0xb0 && d1 === 64) { /* sustain: stap 2 */ } }
    function knob(i, delta) { lastKnob = { i, delta, t: performance.now() }; paintKnob(); /* stap 2: naar parameters van het gekozen apparaat */ }
    let lastKnob = null;
    // ---------- Web MIDI ----------
    // De rol van een ingang (toetsen, pads + knoppen, negeren) kies je zelf; zolang je niets koos, leert het apparaat 'pads + knoppen' van de berichten (knop-CC's en knopnoten).
    const roleOf = inp => S.roles[inp.name] || learnedRoles[inp.name] || 'keys';
    async function connectMidi() { if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') { midiMsg = tx('Web MIDI is hier niet beschikbaar. Gebruik een browser met Web MIDI en het losse Patchkamer-bestand (niet de ingebedde weergave).'); paint(); return; }
      try { access = await navigator.requestMIDIAccess({ sysex: false }); access.onstatechange = () => { wireInputs(); paint(); leds(); }; wireInputs(); midiMsg = tx('MIDI verbonden'); } catch (e) { midiMsg = tx('Geen toegang tot MIDI: ') + e.message; }
      paint(); leds(); }
    function wireInputs() { if (!access) return; access.inputs.forEach(inp => { inp.onmidimessage = e => { const d = e.data; if (dead || !d || d.length < 2) return;
        // leer de rol: knoppen (CC 48–55) en knopnoten zitten op de bedieningspoort
        if (!S.roles[inp.name] && ((d[0] & 0xf0) === 0xb0 && d[1] >= 48 && d[1] <= 55 || ((d[0] & 0xf0) === 0x90 && [...BTN_TRACK, ...BTN_SCENE, BTN_STOPALL, BTN_PLAY, BTN_REC, NOTE_SHIFT].includes(d[1])))) { if (learnedRoles[inp.name] !== 'ctrl') { learnedRoles[inp.name] = 'ctrl'; paint(); } }
        const role = roleOf(inp); if (role === 'off') return; onMidi(role, d, e.timeStamp); }; }); }
    function outPort() { if (!access || !S.outName) return null; return [...access.outputs.values()].find(o => o.name === S.outName) || null; }
    function leds() { const o = outPort(); if (!o) return; try {
        for (let p = 1; p <= NP; p++) { const sl = S.slots[p], pr = sl && peer(sl.target), col = pr ? (CAT_LED[pr.category] ?? 3) : 0;
          if (!pr) o.send([0x90, p - 1, 0]); else if (p === S.active) o.send([0x99, p - 1, col]); else o.send([0x92, p - 1, col]); }
        o.send([0x90, BTN_PLAY, 0]); } catch (e) {} }
    // ---------- UI (gewone DOM, want de pad-aansluitingen moeten in de kaart zelf staan) ----------
    let root = null, ui = {}, padEls = [];
    const CSS = `.pkpc{display:grid;gap:10px;font-size:12px}.pkpc .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.pkpc h2{margin:0;font-size:17px;letter-spacing:.1em;text-transform:uppercase}.pkpc .sub{margin:0;color:var(--muted);line-height:1.45}
.pkpc .stt{font-family:var(--mono);font-size:11px;color:var(--mod)} .pkpc .warn{color:var(--stop)}
.pkpc .grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px;padding:8px;border-radius:8px;background:var(--well);border:1px solid var(--line)}
.pkpc .pad{position:relative;min-height:62px;border-radius:6px;border:1px solid var(--line);background:var(--card-2);padding:4px 5px 16px;cursor:pointer;display:flex;flex-direction:column;gap:2px;min-width:0}
.pkpc .pad .n{font-family:var(--mono);font-size:9px;color:var(--muted)} .pkpc .pad .t{font-size:10px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}
.pkpc .pad.has{border-color:var(--pc);box-shadow:inset 0 0 0 1px var(--pc);background:color-mix(in srgb,var(--pc) 16%,var(--card-2))}
.pkpc .pad.act{background:color-mix(in srgb,var(--pc) 42%,var(--card-2));animation:pkpcPulse 1s ease-in-out infinite}
.pkpc .pad.pick{outline:2px dashed var(--fg);outline-offset:1px} .pkpc .pad.lost .t{color:var(--stop)} .pkpc .pad.flash{filter:brightness(1.6)}
@keyframes pkpcPulse{50%{filter:brightness(1.25)}}
.pkpc .pad .port{position:absolute;right:2px;bottom:1px;padding:0;gap:0} .pkpc .pad .port span:not(.dot){display:none}
.pkpc .ed{display:grid;gap:8px;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--card-2)}
.pkpc .ed b{font-family:var(--disp);letter-spacing:.06em} .pkpc select{max-width:260px}
.pkpc .knobs{display:flex;gap:6px;align-items:center} .pkpc .knobs .port span:not(.dot){display:inline}
.pkpc .shift{font-family:var(--mono);padding:3px 8px;border-radius:4px;border:1px solid var(--line)} .pkpc .shift.on{background:var(--sel);color:#fff}
.pkpc table{border-collapse:collapse;font-size:11px} .pkpc td{padding:2px 8px 2px 0}`;
    const E = (p, tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; };
    function mount(el) { root = el; el.innerHTML = ''; const st = E(el, 'style'); st.textContent = CSS; const app = E(el, 'div', 'pkpc');
      E(app, 'h2', '', 'Pad Controller'); E(app, 'p', 'sub', tx('Koppel een apparaat aan een pad: Patchkamer legt de kabels. Op de controller kies je met Shift + pad welk apparaat je bespeelt. Je kunt hier ook op een pad klikken.'));
      if (!can) E(app, 'p', 'stt warn', tx('Deze Patchkamer kan nog geen kabels leggen voor apparaten (contract v1.7 nodig). Werk Patchkamer bij.'));
      const r1 = E(app, 'div', 'row'); ui.conn = E(r1, 'button', 'small', tx('Verbind met MIDI')); ui.conn.onclick = connectMidi; ui.ports = E(r1, 'span', 'stt'); ui.timing = E(r1, 'select'); [['strak', tx('Timing: strak (+12 ms, gelijkmatig)')], ['direct', tx('Timing: direct (zo snel mogelijk)')]].forEach(([v, x]) => { const o = E(ui.timing, 'option', '', x); o.value = v; }); ui.timing.value = S.timing; ui.timing.onchange = () => { S.timing = ui.timing.value; };
      ui.shift = E(r1, 'span', 'shift', 'SHIFT'); ui.shift.title = tx('Shift op de controller; klik hier om Shift na te doen met de muis'); ui.shift.onclick = () => { shift = !shift; paintShift(); };
      E(app, 'p', 'sub', tx('Kies per MIDI-ingang wat die stuurt en kies de uitgang voor de lampjes. Zonder uitgang blijven de lampjes uit.'));
      ui.rolebox = E(app, 'div', 'row');
      ui.grid = E(app, 'div', 'grid'); padEls = [];
      for (let row = 4; row >= 0; row--) for (let c = 0; c < 8; c++) { const pad = row * 8 + c + 1, d = E(ui.grid, 'div', 'pad'); d.dataset.pad = pad; E(d, 'span', 'n', String(pad)); E(d, 'span', 't', '');
        try { host.ui.jack(self, d, 'pad' + pad, 'out', ''); } catch (e) {}
        d.addEventListener('click', ev => { if (ev.target.closest('.port')) return; if (shift && S.slots[pad]) activate(pad); else { ui.pick = pad; paint(); } });
        d.addEventListener('dblclick', ev => { if (ev.target.closest('.port')) return; activate(pad); });
        padEls[pad] = d; }
      const kn = E(app, 'div', 'knobs'); E(kn, 'span', 'stt', tx('Knoppen (paars) →')); try { host.ui.jack(self, kn, 'knoppen', 'out', tx('Knoppen')); host.ui.jack(self, kn, 'midi', 'in', tx('MIDI (ruw)')); } catch (e) {} ui.knob = E(kn, 'span', 'stt', '');
      ui.ed = E(app, 'div', 'ed'); ui.act = E(app, 'p', 'stt'); ui.msg = E(app, 'p', 'stt');
      E(app, 'p', 'sub', tx('Stap 1: koppelen, kiezen en spelen met de toetsen. In stap 2 krijgt elk soort apparaat een vaste indeling: drumpads voor drumcomputers, de 8 knoppen op de belangrijkste parameters. De pads lichten op in de kleur van de categorie van hun apparaat (de exacte kleur op de controller kan iets afwijken).'));
      ui.pick = ui.pick || 1; paint(); }
    function paintShift() { if (ui.shift) ui.shift.classList.toggle('on', shift); }
    function flashPad(pad) { const d = padEls[pad]; if (!d) return; d.classList.add('flash'); setTimeout(() => d.classList.remove('flash'), 150); }
    function paintKnob() { if (ui.knob && lastKnob) ui.knob.textContent = tx('knop {0}: {1} (indeling volgt in stap 2)', lastKnob.i + 1, (lastKnob.delta > 0 ? '+' : '') + lastKnob.delta); }
    function paint() { if (!root || !ui.grid) return;
      for (let pad = 1; pad <= NP; pad++) { const d = padEls[pad], sl = S.slots[pad], p = sl && peer(sl.target), ok = slotOk(pad);
        d.classList.toggle('has', !!p); d.classList.toggle('act', pad === S.active && !!p); d.classList.toggle('pick', pad === ui.pick); d.classList.toggle('lost', ok === 'los' || ok === 'weg');
        d.style.setProperty('--pc', p ? CAT_CSS[p.category] || '#888' : 'var(--line)'); d.querySelector('.t').textContent = p ? p.name + (ok === 'los' ? tx(' (kabel los)') : '') : sl ? tx('(apparaat weg)') : '';
        d.title = p ? tx('Pad {0}: {1}{2} · Shift+pad of dubbelklik: bespelen', pad, p.name, sl.port ? ' → ' + sl.port : '') : tx('Pad {0}: vrij', pad); }
      // koppel-editor voor het aangewezen pad
      const pad = ui.pick, sl = S.slots[pad], ed = ui.ed; ed.innerHTML = '';
      const h = E(ed, 'div', 'row'); E(h, 'b', '', `Pad ${pad}`);
      const sel = E(h, 'select'); sel.setAttribute('aria-label', tx('apparaat voor pad {0}', pad)); E(sel, 'option', '', tx('— niet gekoppeld —')).value = '';
      peers.forEach(p => { const o = E(sel, 'option', '', `${p.name}${p.eventIn.length ? '' : tx(' (alleen knoppen)')}`); o.value = p.id; });
      sel.value = sl ? sl.target : ''; sel.onchange = () => { if (sel.value) link(pad, sel.value); else unlink(pad); };
      const pr = sl && peer(sl.target);
      if (pr && pr.eventIn.length > 1) { const ps = E(h, 'select'); ps.setAttribute('aria-label', tx('ingang')); pr.eventIn.forEach(x => { const o = E(ps, 'option', '', tx('ingang: ') + x.name); o.value = x.id; }); ps.value = sl.port; ps.onchange = () => link(pad, sl.target, ps.value); }
      const selPeer = peers.find(p => p.selected); if (selPeer && (!sl || sl.target !== selPeer.id)) { const b = E(h, 'button', 'small', tx('Koppel “{0}”', selPeer.name)); b.title = tx('het apparaat dat je op het canvas het laatst hebt aangeklikt'); b.onclick = () => link(pad, selPeer.id); }
      if (sl) { const ok = slotOk(pad); if (ok === 'los') { const b = E(h, 'button', 'small', tx('Kabel opnieuw leggen')); b.onclick = () => relink(pad); }
        const b2 = E(h, 'button', 'small', tx('Bespelen')); b2.onclick = () => activate(pad); const b3 = E(h, 'button', 'small danger', tx('Ontkoppel')); b3.onclick = () => unlink(pad); }
      const ap = S.slots[S.active] && peer(S.slots[S.active].target);
      ui.act.textContent = ap ? tx('Je bespeelt nu: pad {0} → {1}', S.active, ap.name) + (S.slots[S.active].port ? tx(' (toetsen gaan naar {0})', S.slots[S.active].port) : tx(' (alleen knoppen, geen ingang voor noten)')) : tx('Nog geen apparaat gekozen: koppel een pad en druk Shift + pad (of dubbelklik hier op het pad).');
      // poorten en rollen
      ui.rolebox.innerHTML = ''; if (access) { const ins = [...access.inputs.values()], outs = [...access.outputs.values()];
        ui.ports.textContent = ins.length ? tx(ins.length > 1 ? '{0} MIDI-ingangen' : '{0} MIDI-ingang', ins.length) : tx('geen MIDI-apparaat gevonden (staat de controller aan en via USB aangesloten?)');
        const t = E(ui.rolebox, 'table'); ins.forEach(inp => { const tr = E(t, 'tr'); E(tr, 'td', '', inp.name); const td = E(tr, 'td'), s2 = E(td, 'select'); [['keys', tx('toetsen')], ['ctrl', tx('pads + knoppen')], ['off', tx('negeren')]].forEach(([v, x]) => { const o = E(s2, 'option', '', x); o.value = v; }); s2.value = roleOf(inp); s2.onchange = () => { S.roles[inp.name] = s2.value; }; });
        { const tr = E(t, 'tr'); E(tr, 'td', '', tx('lampjes naar')); const s3 = E(E(tr, 'td'), 'select'); const none = E(s3, 'option', '', tx('— geen —')); none.value = ''; outs.forEach(o => { const op = E(s3, 'option', '', o.name); op.value = o.name; }); const cur = outPort(); s3.value = cur ? cur.name : ''; s3.onchange = () => { allLedsOff(); S.outName = s3.value; leds(); }; } }
      else ui.ports.textContent = tx('nog niet verbonden');
      ui.msg.textContent = midiMsg; if (ui.timing) ui.timing.value = S.timing; paintShift(); paintKnob(); }
    function allLedsOff() { const o = outPort(); if (!o) return; try { for (let p = 0; p < NP; p++) o.send([0x90, p, 0]); } catch (e) {} }
    function refresh() { paint(); leds(); }
    self = {
      inputs: {}, outputs: {},
      mount, unmount() { root = null; ui = {}; padEls = []; },
      onPeers(list) { peers = Array.isArray(list) ? list : []; paint(); leds(); },
      onModTargets(list) { /* stap 2: de knoppen sturen de parameters van het gekozen apparaat */ },
      onEvent(port, e) { try { if (port === 'midi' && e && Array.isArray(e.data) && e.data.every(x => Number.isFinite(x))) onMidi(e.role === 'ctrl' ? 'ctrl' : 'keys', e.data); } catch (x) {} },
      onTransport(info) { if (!info?.playing) allNotesOff(); },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = DEF(); d.active = typeof s.active === 'number' && Number.isFinite(s.active) ? Math.round(clamp(s.active, 0, NP)) : 0; d.outName = typeof s.outName === 'string' ? s.outName : ''; d.timing = s.timing === 'direct' ? 'direct' : 'strak';
        d.roles = s.roles && typeof s.roles === 'object' ? Object.fromEntries(Object.entries(s.roles).filter(([, v]) => v === 'keys' || v === 'ctrl' || v === 'off')) : {};
        if (s.slots && typeof s.slots === 'object') for (const [k, v] of Object.entries(s.slots)) { const n = +k; if (Number.isInteger(n) && n >= 1 && n <= NP && v && typeof v.target === 'string') d.slots[n] = { target: v.target, port: typeof v.port === 'string' ? v.port : '' }; }
        S = d; if (can) peers = host.peers(self); paint(); leds(); },
      getPreset() { return { timing: S.timing }; },
      setPreset(p) { const s = p && typeof p === 'object' ? p : {}; if (s.timing === undefined) return; S.timing = s.timing === 'direct' ? 'direct' : 'strak'; paint(); },
      destroy() { if (dead) return; dead = true; allNotesOff(); try { const o = outPort(); if (o) for (let p = 0; p < NP; p++) o.send([0x90, p, 0]); } catch (e) {} if (access) access.inputs.forEach(i => { i.onmidimessage = null; }); },
    };
    if (can) setTimeout(() => { if (!dead) { peers = host.peers(self); paint(); } }, 0);
    return self;
  },
};
