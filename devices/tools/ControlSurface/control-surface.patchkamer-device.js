// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.16.0 — Titel in de UI verwijderd: de kaartbalk toont de naam.
// 1.15.0 — Teruggetrokken (status 'retired'): vervangen door de MIDI Controller (MIDI-apparaten, koppelen en schakelen) en het Keyboard (klavier). De bibliotheek toont dit apparaat standaard niet meer; bestaande werkruimtes en songs laden het gewoon. Verder ongewijzigd.
// 1.14.0 — Een preset neemt nu ook de toewijzingen (CC's en noten) mee, niet alleen de indeling: een controllerpreset is indeling plus MIDI-mapping. Een preset zonder toewijzingen wist ze nog steeds.
// 1.13.0 — Eerste versie. Control Surface toont een MIDI-controller met draaiknoppen, schuiven, pads en knoppen als paneel dat live meebeweegt, en stuurt wat je op de hardware doet door als CC-berichten (met nummer en
//          kanaal) naar andere apparaten, zoals de MIDI Hub. De indeling bestaat uit secties: elke sectie heeft een soort (draaiknoppen, schuiven, pads of knoppen), een aantal rijen, een aantal elementen per rij en een
//          band; secties in dezelfde band staan naast elkaar, banden staan onder elkaar. Zo kun je de vorm van bijna elke controller nabouwen, en een indeling bewaar je als preset. Je kiest een MIDI-ingang (of alle) en een
//          kanaal, en legt elk element vast met Leer: draai aan een knop op de hardware. Met Leer alles loop je het hele paneel langs. Elk element krijgt een eigen naam. Zonder hardware kun je de elementen op het scherm
//          bedienen. Het apparaat opent MIDI alleen na een klik en gebruikt geen sysex (lampjes sturen kan dus niet).
// Control Surface — een paneel voor een controller met knoppen en schuiven · Patchkamer contract v1.13

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const int = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), a, b) : d;
const str = (v, d, n) => typeof v === 'string' ? v.slice(0, n || 40) : d;
const TYPES = ['knob', 'fader', 'pad', 'button'], LABEL = { knob: 'Knob', fader: 'Fader', pad: 'Pad', button: 'Button' };
const defaultSections = () => [{ type: 'knob', rows: 3, cols: 8, band: 0 }, { type: 'fader', rows: 1, cols: 8, band: 1 }, { type: 'button', rows: 2, cols: 8, band: 2 }];
const defaults = () => ({ sections: defaultSections(), input: 'all', channel: 0, assign: {} });
function normSections(raw) {
  const out = []; let total = 0;
  for (const x of (Array.isArray(raw) ? raw : []).slice(0, 8)) {
    if (!x || typeof x !== 'object' || !TYPES.includes(x.type)) continue; const rows = int(x.rows, 1, 8, 1), cols = int(x.cols, 1, 16, 8); if (total + rows * cols > 256) continue; total += rows * cols; out.push({ type: x.type, rows, cols, band: int(x.band, 0, 7, out.length) });
  }
  return out;
}
function normalize(raw) {
  const s = defaults(); raw = raw && typeof raw === 'object' ? raw : {};
  if (Array.isArray(raw.sections)) s.sections = normSections(raw.sections);
  s.input = str(raw.input, 'all', 200) || 'all'; s.channel = int(raw.channel, 0, 16, 0);
  if (raw.assign && typeof raw.assign === 'object' && !Array.isArray(raw.assign)) for (const id of Object.keys(raw.assign).slice(0, 256)) {
    const a = raw.assign[id]; if (!a || typeof a !== 'object' || !/^[a-z0-9.]+$/.test(id)) continue;
    s.assign[id] = { kind: a.kind === 'note' ? 'note' : 'cc', n: int(a.n, -1, 127, -1), ch: int(a.ch, 0, 16, 0), name: str(a.name, '', 32) };
  }
  return s;
}
// De elementen van de indeling, in volgorde van sectie, rij en kolom. Het id bevat het nummer van de sectie, zodat het stabiel blijft.
function slotsOf(st) {
  const L = [], count = {}; for (const sec of st.sections) count[sec.type] = (count[sec.type] || 0) + 1;
  st.sections.forEach((sec, si) => { for (let r = 1; r <= sec.rows; r++) for (let c = 1; c <= sec.cols; c++) {
    const multi = count[sec.type] > 1, pos = sec.rows === 1 ? '' + c : r + '.' + c;
    L.push({ id: sec.type[0] + (si + 1) + '.' + r + '.' + c, type: sec.type, sec: si, def: LABEL[sec.type] + (multi ? ' ' + String.fromCharCode(65 + si) : '') + ' ' + pos });
  } });
  return L;
}
// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { hint: 'Een paneel voor een controller met knoppen en schuiven. Draai aan de hardware en het paneel beweegt mee; de berichten gaan als CC naar de apparaten of de MIDI Hub die je aansluit.',
    connect: 'MIDI verbinden', reconnect: 'MIDI opnieuw verbinden', input: 'MIDI-ingang', allInputs: 'Alle MIDI-ingangen', channel: 'Kanaal', anyCh: 'alle kanalen', ch: 'kanaal', learnAll: 'Leer alles', stopLearn: 'Stop leren', clear: 'Wis toewijzingen',
    layout: 'Indeling', types: { knob: 'Draaiknoppen', fader: 'Schuiven', pad: 'Pads', button: 'Knoppen' }, rows: 'Rijen', perRow: 'Per rij', band: 'Band', remove: 'Verwijder', addSection: '+ sectie', slot: 'Element', name: 'Naam', learn: 'Leer', clearOne: 'Wis', number: 'Nummer', kind: 'Soort', kindCc: 'CC', kindNote: 'Noot',
    last: 'Laatste invoer', none: 'nog niets ontvangen', unassigned: 'niet toegewezen', status: ['MIDI is uit. Klik op MIDI verbinden en geef toestemming.', 'MIDI verbonden', 'Web MIDI is hier niet beschikbaar (gebruik Chrome of Edge).', 'Geen toestemming voor MIDI.'],
    learning: 'Beweeg het element op je controller…', learnedTo: s => 'Toegewezen aan ' + s, noSel: 'Klik op een element om het te benoemen of vast te leggen.', virtual: 'Je kunt de elementen ook met de muis bedienen.' },
  en: { hint: 'A panel for a controller with knobs and faders. Move the hardware and the panel follows; the messages go as CC to the devices or the MIDI Hub you connect.',
    connect: 'Connect MIDI', reconnect: 'Reconnect MIDI', input: 'MIDI input', allInputs: 'All MIDI inputs', channel: 'Channel', anyCh: 'all channels', ch: 'channel', learnAll: 'Learn all', stopLearn: 'Stop learning', clear: 'Clear assignments',
    layout: 'Layout', types: { knob: 'Knobs', fader: 'Faders', pad: 'Pads', button: 'Buttons' }, rows: 'Rows', perRow: 'Per row', band: 'Band', remove: 'Remove', addSection: '+ section', slot: 'Element', name: 'Name', learn: 'Learn', clearOne: 'Clear', number: 'Number', kind: 'Kind', kindCc: 'CC', kindNote: 'Note',
    last: 'Last input', none: 'nothing received yet', unassigned: 'not assigned', status: ['MIDI is off. Click Connect MIDI and allow access.', 'MIDI connected', 'Web MIDI is not available here (use Chrome or Edge).', 'No permission for MIDI.'],
    learning: 'Move the element on your controller…', learnedTo: s => 'Assigned to ' + s, noSel: 'Click an element to name it or assign it.', virtual: 'You can also operate the elements with the mouse.' }
};

export default {
  id: 'nl.patchkamer.controlsurface', name: 'Control Surface', version: '1.16.0', status: 'retired', kind: 'utility', category: 'tool', ui: { width: 760, minWidth: 340 },
  i18n: { nl: { ports: { out: 'CC uit' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [{ id: 'out', name: 'CC out' }], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = defaults(), dead = false, shell = null, sh = null, root = null, access = null, midiStatus = 0, listeners = [], selected = '', learn = null, learnAll = false, lastText = T.none, lastEl = null, statusEl = null, values = {}, els = new Map(), token = 0;
    const slotList = () => slotsOf(state), slotById = id => slotList().find(s => s.id === id) || null, nameOf = s => (state.assign[s.id] && state.assign[s.id].name) || s.def;
    const cc = (extra) => { if (!dead) host.emit(self, 'out', { type: 'cc', time: ctx.currentTime, ...extra }); };
    function emitSlot(slot, v) {
      const a = state.assign[slot.id]; values[slot.id] = v; paintSlot(slot);
      cc({ id: slot.id, slot: nameOf(slot), value: clamp(v, 0, 1), ...(a && a.n >= 0 ? { cc: a.kind === 'cc' ? a.n : undefined, ch: a.ch || undefined } : {}) });
    }
    // ---- MIDI ----
    function detach() { for (const [input, fn] of listeners) input.removeEventListener('midimessage', fn); listeners = []; }
    function attach() {
      detach(); if (!access || dead) return;
      for (const input of access.inputs.values()) { const fn = e => onMidi(input, e); input.addEventListener('midimessage', fn); listeners.push([input, fn]); }
    }
    async function connect() {
      const my = ++token;
      try {
        if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') { midiStatus = 2; paintStatus(); return; }
        const a = await navigator.requestMIDIAccess({ sysex: false }); if (dead || my !== token) return;
        access = a; access.onstatechange = () => { attach(); render(); }; midiStatus = 1; attach(); render();
      } catch (e) { if (!dead) { midiStatus = 3; paintStatus(); } }
    }
    function onMidi(input, e) {
      if (dead || (state.input !== 'all' && state.input !== input.id)) return; const d = e.data; if (!d || d.length < 2) return;
      const status = d[0], command = status & 240, channel = (status & 15) + 1; if (state.channel && state.channel !== channel) return;
      let kind = null, n = d[1], v = 0;
      if (command === 176) { kind = 'cc'; v = (d[2] || 0) / 127; } else if (command === 144 && (d[2] || 0) > 0) { kind = 'note'; v = (d[2] || 0) / 127; } else if (command === 128 || (command === 144 && !(d[2] > 0))) { kind = 'note'; v = 0; } else return;
      if (learn) { if (!(kind === 'note' && v === 0)) assignLearn(kind, n, channel); return; }
      const slot = findSlot(kind, n, channel);
      if (slot) { emitSlot(slot, v); setLast(nameOf(slot) + ' = ' + Math.round(v * 100) + '%'); }
      else { setLast((kind === 'cc' ? 'CC ' : 'Note ') + n + ' · ch ' + channel + ' = ' + Math.round(v * 100) + '% (' + T.unassigned + ')'); cc(kind === 'cc' ? { id: 'cc' + n, cc: n, ch: channel, value: v } : { id: 'note' + n, value: v, ch: channel }); }
    }
    function findSlot(kind, n, ch) { for (const s of slotList()) { const a = state.assign[s.id]; if (a && a.kind === kind && a.n === n && (!a.ch || a.ch === ch)) return s; } return null; }
    function assignLearn(kind, n, ch) {
      const s = slotById(learn); if (!s) { learn = null; render(); return; }
      for (const id of Object.keys(state.assign)) { const a = state.assign[id]; if (id !== s.id && a.kind === kind && a.n === n && a.ch === ch) delete state.assign[id]; }
      state.assign[s.id] = { kind, n, ch, name: (state.assign[s.id] && state.assign[s.id].name) || '' }; setLast(T.learnedTo(nameOf(s)));
      if (learnAll) { const L = slotList(), i = L.findIndex(x => x.id === s.id); if (i >= 0 && i + 1 < L.length) { learn = L[i + 1].id; selected = learn; } else { learn = null; learnAll = false; } } else learn = null;
      render();
    }
    // ---- UI ----
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    function setLast(t) { lastText = t; if (lastEl) lastEl.textContent = t; }
    function paintStatus() { if (statusEl) statusEl.textContent = T.status[midiStatus]; }
    function paintSlot(slot) {
      const e = els.get(slot.id); if (!e) return; const v = clamp(values[slot.id] || 0, 0, 1);
      if (slot.type === 'knob') { const a = 135 + 270 * v, t = a * Math.PI / 180; e.ind.setAttribute('x2', (15 + 9 * Math.cos(t)).toFixed(2)); e.ind.setAttribute('y2', (15 + 9 * Math.sin(t)).toFixed(2)); e.val.setAttribute('d', arc(135, a, 12)); }
      else if (slot.type === 'fader') e.fill.style.height = Math.round(v * 100) + '%'; else { e.box.classList.toggle('on', v >= 0.5); if (slot.type === 'pad') e.box.style.opacity = String(0.45 + 0.55 * v); }
    }
    const pt = (a, r) => { const t = a * Math.PI / 180; return [(15 + r * Math.cos(t)).toFixed(2), (15 + r * Math.sin(t)).toFixed(2)]; };
    const arc = (a0, a1, r) => { if (a1 - a0 < 1) return ''; const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return 'M' + x0 + ',' + y0 + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + x1 + ',' + y1; };
    function drag(target, slot, kind) {
      let y0 = 0, v0 = 0, down = false;
      target.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); selected = slot.id; markSel(); if (kind === 'button') { down = true; emitSlot(slot, 1); return; } try { target.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } down = true; y0 = e.clientY; v0 = values[slot.id] || 0; });
      target.addEventListener('pointermove', e => { if (!down || kind === 'button') return; const h = kind === 'fader' ? 90 : 160, v = clamp(v0 + (y0 - e.clientY) / h, 0, 1); if (v !== values[slot.id]) emitSlot(slot, v); });
      const up = () => { if (down && kind === 'button') emitSlot(slot, 0); if (down) renderEditor(); down = false; }; target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
    }
    function markSel() { for (const [id, e] of els) { e.box.classList.toggle('sel', id === selected); e.box.classList.toggle('lrn', id === learn); } renderEditor(); }
    function render() {
      if (!root) return; root.replaceChildren(); els = new Map();
      const top = el('div', null, root, 'row'); const cb = el('button', access ? T.reconnect : T.connect, top); cb.type = 'button'; cb.onclick = connect;
      const inSel = el('select', null, top); inSel.setAttribute('aria-label', T.input); const a0 = el('option', T.allInputs, inSel); a0.value = 'all'; let found = state.input === 'all';
      if (access) for (const i of access.inputs.values()) { const o = el('option', i.name || i.id, inSel); o.value = i.id; if (i.id === state.input) found = true; } if (!found) { const o = el('option', state.input, inSel); o.value = state.input; } inSel.value = state.input; inSel.onchange = () => { state.input = inSel.value; };
      const chSel = el('select', null, top); chSel.setAttribute('aria-label', T.channel); const c0 = el('option', T.anyCh, chSel); c0.value = '0'; for (let c = 1; c <= 16; c++) { const o = el('option', T.ch + ' ' + c, chSel); o.value = String(c); } chSel.value = String(state.channel); chSel.onchange = () => { state.channel = int(parseInt(chSel.value, 10), 0, 16, 0); };
      const la = el('button', learnAll ? T.stopLearn : T.learnAll, top); la.type = 'button'; la.classList.toggle('on', learnAll); la.onclick = () => { if (learnAll) { learnAll = false; learn = null; } else { const L = slotList(); if (L.length) { learnAll = true; learn = L[0].id; selected = learn; } } render(); };
      const cl = el('button', T.clear, top); cl.type = 'button'; cl.onclick = () => { state.assign = {}; learn = null; learnAll = false; render(); };
      statusEl = el('div', T.status[midiStatus], root, 'hint');
      // paneel: banden onder elkaar, secties in dezelfde band naast elkaar
      const panel = el('div', null, root, 'panel'), slots = slotList(), bands = [...new Set(state.sections.map(x => x.band))].sort((p, q) => p - q);
      for (const band of bands) {
        const brow = el('div', null, panel, 'band');
        state.sections.forEach((sec, si) => { if (sec.band !== band) return; const grid = el('div', null, brow, 'sec ' + sec.type); grid.style.setProperty('--cols', sec.cols);
          for (const slot of slots) { if (slot.sec !== si) continue;
            const cell = el('div', null, grid, 'cell ' + slot.type); const box = el('div', null, cell, 'box'); const e = { box };
            if (slot.type === 'knob') { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 30 30'); svg.setAttribute('width', '30'); svg.setAttribute('height', '30'); box.appendChild(svg);
              const tr = document.createElementNS('http://www.w3.org/2000/svg', 'path'); tr.setAttribute('d', arc(135, 405, 12)); tr.setAttribute('class', 'tr'); svg.appendChild(tr); e.val = document.createElementNS('http://www.w3.org/2000/svg', 'path'); e.val.setAttribute('class', 'vl'); svg.appendChild(e.val); e.ind = document.createElementNS('http://www.w3.org/2000/svg', 'line'); e.ind.setAttribute('x1', '15'); e.ind.setAttribute('y1', '15'); e.ind.setAttribute('class', 'pt'); svg.appendChild(e.ind); }
            else if (slot.type === 'fader') { const t = el('div', null, box, 'track'); e.fill = el('div', null, t, 'fill'); }
            el('div', nameOf(slot), cell, 'lbl'); els.set(slot.id, e); drag(box, slot, slot.type === 'fader' ? 'fader' : slot.type === 'knob' ? 'knob' : 'button'); paintSlot(slot);
            box.addEventListener('click', () => { selected = slot.id; markSel(); }); }
        });
      }
      el('div', T.virtual, root, 'hint'); const ed = el('div', null, root, 'editor'); ed.id = 'editor';
      const act = el('div', null, root, 'line'); el('b', T.last + ': ', act); lastEl = el('span', lastText, act);
      // indeling: een regel per sectie
      const lay = el('div', null, root, 'layout'); el('b', T.layout, lay);
      state.sections.forEach((sec, si) => {
        const row = el('div', null, lay, 'row'); const ty = el('select', null, row); ty.setAttribute('aria-label', T.kind); for (const t of TYPES) { const o = el('option', T.types[t], ty); o.value = t; } ty.value = sec.type; ty.onchange = () => { sec.type = ty.value; learn = null; learnAll = false; render(); };
        for (const [k, lab, mn, mx] of [['rows', T.rows, 1, 8], ['cols', T.perRow, 1, 16], ['band', T.band, 0, 7]]) { const l = el('label', lab + ' ', row); const n = el('input', null, l); n.type = 'number'; n.min = mn; n.max = mx; n.value = sec[k]; n.setAttribute('aria-label', lab); n.onchange = () => { sec[k] = int(parseInt(n.value, 10), mn, mx, sec[k]); state.sections = normSections(state.sections); render(); }; }
        const rm = el('button', '×', row); rm.type = 'button'; rm.setAttribute('aria-label', T.remove); rm.onclick = () => { state.sections.splice(si, 1); render(); };
      });
      const add = el('button', T.addSection, lay); add.type = 'button'; add.onclick = () => { state.sections.push({ type: 'knob', rows: 1, cols: 8, band: state.sections.length ? Math.max(...state.sections.map(x => x.band)) + 1 : 0 }); state.sections = normSections(state.sections); render(); };
      markSel();
    }
    function renderEditor() {
      const ed = root && root.querySelector('#editor'); if (!ed) return; ed.replaceChildren(); const slot = selected && slotById(selected); if (!slot) { el('div', T.noSel, ed, 'hint'); return; }
      const a = state.assign[slot.id] || { kind: 'cc', n: -1, ch: 0, name: '' }; const row = el('div', null, ed, 'row'); el('b', T.slot + ' ' + slot.def, row);
      const nm = el('input', null, row); nm.type = 'text'; nm.maxLength = 32; nm.value = a.name; nm.placeholder = slot.def; nm.setAttribute('aria-label', T.name); nm.onchange = () => { state.assign[slot.id] = { ...a, ...(state.assign[slot.id] || {}), name: nm.value.slice(0, 32) }; render(); };
      const lb = el('button', learn === slot.id ? T.learning : T.learn, row); lb.type = 'button'; lb.classList.toggle('on', learn === slot.id); lb.onclick = () => { learn = learn === slot.id ? null : slot.id; learnAll = false; render(); };
      el('span', a.n >= 0 ? (a.kind === 'cc' ? 'CC ' : 'Note ') + a.n + (a.ch ? ' · ch ' + a.ch : ' · ' + T.anyCh) : T.unassigned, row, 'src');
      const rm = el('button', T.clearOne, row); rm.type = 'button'; rm.onclick = () => { delete state.assign[slot.id]; render(); };
    }
    const self = {
      inputs: {}, outputs: {},
      mount(parent) {
        if (dead) return; self.unmount(); shell = el('div', null, parent); sh = shell.attachShadow({ mode: 'open' });
        const css = el('style', null, sh); css.textContent = ':host{display:block;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--card)}.hint{color:var(--muted);font-size:11px;line-height:1.4}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.line{display:flex;gap:6px;flex-wrap:wrap}.line span{color:var(--event)}.src{color:var(--event)}select,button,input[type=text],input[type=number]{font:inherit;background:var(--field,var(--well));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:4px;padding:4px 7px;min-width:0;max-width:100%}input[type=number]{width:50px}button{cursor:pointer}button.on{background:var(--event);color:#1b1206;border-color:var(--event)}.body{display:grid;gap:10px}.panel{display:grid;gap:12px;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--well,#0002)}.band{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}.sec{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:8px 6px}.layout{display:grid;gap:6px}.pad .box{width:34px;height:34px;background:var(--well,#0007);border:1px solid var(--line);cursor:pointer;border-radius:4px}.pad .box.on{background:var(--event)}.pad .box.sel{border-color:var(--sel,#7a6cf0)}.pad .box.lrn{border-color:var(--event)}.cell{display:grid;justify-items:center;gap:3px;min-width:0}.box{display:grid;place-items:center;cursor:ns-resize;touch-action:none;border:1px solid transparent;border-radius:6px;padding:2px}.box.sel{border-color:var(--sel,#7a6cf0)}.box.lrn{border-color:var(--event);box-shadow:0 0 0 2px var(--event)}.lbl{font-size:9px;color:var(--muted);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr{fill:none;stroke:var(--line);stroke-width:3.2;stroke-linecap:round}.vl{fill:none;stroke:var(--event);stroke-width:3.2;stroke-linecap:round}.pt{stroke:var(--fg);stroke-width:2;stroke-linecap:round}.track{position:relative;width:14px;height:90px;background:var(--well,#0007);border:1px solid var(--line);border-radius:3px;overflow:hidden;display:flex;align-items:flex-end}.fill{width:100%;background:var(--event);height:0}.button .box{width:30px;height:20px;background:var(--well,#0007);border:1px solid var(--line);cursor:pointer}.button .box.on{background:var(--event)}.button .box.sel{border-color:var(--sel,#7a6cf0)}.button .box.lrn{border-color:var(--event)}[hidden]{display:none!important}';
        const app = el('div', null, sh, 'app'); el('div', T.hint, app, 'hint'); root = el('div', null, app, 'body'); sh.addEventListener('pointerdown', e => e.stopPropagation()); render();
      },
      unmount() { if (shell) shell.remove(); shell = sh = root = lastEl = statusEl = null; els = new Map(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { if (dead) return; state = normalize(s); learn = null; learnAll = false; render(); },
      getPreset() { const p = self.getState(); delete p.input; if (!Object.keys(p.assign).length) delete p.assign; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, sections: Array.isArray(p.sections) ? p.sections : s.sections, channel: p.channel !== undefined ? p.channel : s.channel, input: s.input, assign: p.assign && typeof p.assign === 'object' ? p.assign : {} }); },
      destroy() { if (dead) return; dead = true; detach(); if (access) { try { access.onstatechange = null; } catch (e) { /* ok */ } } self.unmount(); }
    };
    return self;
  }
};
