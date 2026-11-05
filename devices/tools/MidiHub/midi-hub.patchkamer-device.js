// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.13.1 — Vier MIDI-ingangen (MIDI in, 2, 3 en 4) in plaats van één, zodat je meer dan één fysiek MIDI-apparaat tegelijk kunt gebruiken: zet per apparaat een Keys / MIDI op zijn eigen ingang (kies daar de MIDI-ingang) en verbind elk met een eigen ingang van de hub. Een koppeling en een noteroute kunnen op één ingang gelden of op alle; oude koppelingen en routes gelden op alle ingangen en werken dus als voorheen.
// 1.13.0 — Eerste versie. De MIDI Hub staat tussen je MIDI-bronnen (Keys / MIDI, een controller) en de apparaten in de werkruimte. Hij ziet welke apparaten er staan en laat je er een
//          toevoegen aan zijn actieve apparaten. Per apparaat kies je waar de noten vandaan komen (het keyboard, met een MIDI-kanaal, of een spoor van een sequencer via de multi-MIDI-kabel,
//          met de spoornaam erbij) en koppel je knoppen, schuiven, pads en toetsen van je MIDI-apparaat aan elke regelaar op de kaart van dat apparaat (schuiven, draaiknoppen, keuzelijsten,
//          vinkjes en knoppen). Koppelen gaat met Leer: draai aan een knop op je keyboard. Een koppeling bewaar je per apparaatsoort in de bibliotheek van de hub, en als preset van de hub.
//          De hub legt zijn eigen kabels (zichtbaar, je kunt ze losmaken) en verandert niets bij laden, aansluiten of herstellen van een werkruimte.
// MIDI Hub — MIDI-bronnen en sporen koppelen aan apparaten en hun regelaars · Patchkamer contract v1.13

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = n => NOTE[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const str = (v, d, max) => typeof v === 'string' ? v.slice(0, max || 200) : d;
const int = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), a, b) : d;
const KINDS = ['cc', 'note', 'bend', 'pressure', 'name'], INS = ['in', 'in2', 'in3', 'in4'];

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { title: 'MIDI Hub', hint: 'Koppel je MIDI-apparaat en de sporen van een sequencer aan apparaten, en zet hun knoppen en schuiven op een knop van je keyboard.',
    last: 'Laatste invoer', none: 'nog niets ontvangen', sources: 'Bronnen', noSources: 'Verbind een MIDI-bron (bijvoorbeeld Keys / MIDI) met MIDI in, en een sequencer met Sporen in.',
    kbd: 'MIDI in', inputs: 'Ingangen', kbdOn: 'ontvangt invoer', kbdOff: 'wacht op invoer', tracks: 'Sporen',
    devices: 'Actieve apparaten', addDevice: 'Apparaat toevoegen…', noDevices: 'Nog geen apparaten. Kies er hierboven een om toe te voegen.', remove: 'Verwijder',
    routes: 'Noten van', addRoute: '+ bron', routeNone: 'geen', routeKbd: 'Keyboard', routeTrack: 'Spoor', chAny: 'alle kanalen', ch: 'kanaal',
    cable: 'kabel', cableOk: 'verbonden', cableNone: 'geen kabel', cableLost: 'kabel is los', reconnect: 'Opnieuw verbinden', noInput: 'Dit apparaat heeft geen gebeurtenissen-ingang.',
    maps: 'Koppelingen', addMap: '+ koppeling', learn: 'Leer', learning: 'Draai aan een knop…', learned: 'Geleerd', control: 'Regelaar', pick: 'Kies een regelaar', missing: 'niet gevonden',
    min: 'min', max: 'max', invert: 'omkeren', toggle: 'wissel', clear: 'Alles wissen', refresh: 'Ververs regelaars', counts: n => n + ' regelaar' + (n === 1 ? '' : 's'),
    lib: 'Bibliotheek', libPick: 'Opgeslagen koppeling…', load: 'Laad', save: 'Bewaar als…', del: 'Wis', libName: 'Naam van de koppeling', gone: 'Apparaat staat niet meer in de werkruimte',
    inAny: 'alle ingangen', inN: p => (p === 'in' ? 'MIDI in' : 'MIDI in ' + p.slice(2)), srcCc: n => 'CC ' + n, srcName: n => 'CC ' + n, srcNote: n => 'Noot ' + noteName(n), srcBend: 'Pitch bend', srcPress: 'Kanaaldruk', anyCh: 'ch alle', unmapped: 'nog geen knop geleerd' },
  en: { title: 'MIDI Hub', hint: 'Connect your MIDI device and the tracks of a sequencer to devices, and put their knobs and sliders on a knob of your keyboard.',
    last: 'Last input', none: 'nothing received yet', sources: 'Sources', noSources: 'Connect a MIDI source (for example Keys / MIDI) to MIDI in, and a sequencer to Tracks in.',
    kbd: 'MIDI in', inputs: 'Inputs', kbdOn: 'receiving input', kbdOff: 'waiting for input', tracks: 'Tracks',
    devices: 'Active devices', addDevice: 'Add a device…', noDevices: 'No devices yet. Pick one above to add it.', remove: 'Remove',
    routes: 'Notes from', addRoute: '+ source', routeNone: 'none', routeKbd: 'Keyboard', routeTrack: 'Track', chAny: 'all channels', ch: 'channel',
    cable: 'cable', cableOk: 'connected', cableNone: 'no cable', cableLost: 'cable was removed', reconnect: 'Reconnect', noInput: 'This device has no event input.',
    maps: 'Mappings', addMap: '+ mapping', learn: 'Learn', learning: 'Move a knob…', learned: 'Learned', control: 'Control', pick: 'Pick a control', missing: 'not found',
    min: 'min', max: 'max', invert: 'invert', toggle: 'toggle', clear: 'Clear all', refresh: 'Refresh controls', counts: n => n + ' control' + (n === 1 ? '' : 's'),
    lib: 'Library', libPick: 'Saved mapping…', load: 'Load', save: 'Save as…', del: 'Delete', libName: 'Name of the mapping', gone: 'This device is no longer in the workspace',
    inAny: 'any input', inN: p => (p === 'in' ? 'MIDI in' : 'MIDI in ' + p.slice(2)), srcCc: n => 'CC ' + n, srcName: n => 'CC ' + n, srcNote: n => 'Note ' + noteName(n), srcBend: 'Pitch bend', srcPress: 'Channel pressure', anyCh: 'ch any', unmapped: 'no knob learned yet' }
};

const newMap = () => ({ src: null, ctl: '', label: '', min: 0, max: 1, inv: false, toggle: false });
function normMap(m) {
  m = m && typeof m === 'object' ? m : {}; const s = m.src && typeof m.src === 'object' && KINDS.includes(m.src.k) ? { k: m.src.k, n: int(m.src.n, -1, 127, -1), id: str(m.src.id, '', 40), ch: int(m.src.ch, 0, 16, 0), port: INS.includes(m.src.port) ? m.src.port : '' } : null;
  const lo = typeof m.min === 'number' && Number.isFinite(m.min) ? clamp(m.min, 0, 1) : 0, hi = typeof m.max === 'number' && Number.isFinite(m.max) ? clamp(m.max, 0, 1) : 1;
  return { src: s, ctl: str(m.ctl, '', 120), label: str(m.label, '', 60), min: lo, max: hi, inv: m.inv === true, toggle: m.toggle === true };
}
function normRoute(r) { r = r && typeof r === 'object' ? r : {}; return { src: r.src === 'tr' ? 'tr' : 'in', ch: int(r.ch, 0, 16, 0), port: INS.includes(r.port) ? r.port : '', key: str(r.key, '', 120), track: str(r.track, '', 80) }; }
function normTarget(t) {
  t = t && typeof t === 'object' ? t : {};
  return { id: str(t.id, '', 40), def: str(t.def, '', 120), name: str(t.name, '', 80), port: str(t.port, '', 40), linked: t.linked === true, routes: (Array.isArray(t.routes) ? t.routes : []).slice(0, 16).map(normRoute), maps: (Array.isArray(t.maps) ? t.maps : []).slice(0, 128).map(normMap) };
}
const defaults = () => ({ targets: [], library: {} });
function normalize(s) {
  s = s && typeof s === 'object' ? s : {}; const out = defaults(), seen = new Set();
  for (const t of (Array.isArray(s.targets) ? s.targets : []).slice(0, 32)) { const n = normTarget(t); if (n.id && /^[a-z0-9_-]+$/i.test(n.id) && !seen.has(n.id)) { seen.add(n.id); out.targets.push(n); } }
  if (s.library && typeof s.library === 'object' && !Array.isArray(s.library)) for (const def of Object.keys(s.library).slice(0, 64)) { const L = s.library[def]; if (!L || typeof L !== 'object') continue; out.library[def.slice(0, 120)] = {}; for (const name of Object.keys(L).slice(0, 64)) if (Array.isArray(L[name])) out.library[def.slice(0, 120)][name.slice(0, 60)] = L[name].slice(0, 128).map(normMap); }
  return out;
}

export default {
  id: 'nl.patchkamer.midihub', name: 'MIDI Hub', version: '1.13.1', kind: 'utility', category: 'tool', ui: { width: 720, minWidth: 340 },
  i18n: { nl: { ports: { in: 'MIDI in', in2: 'MIDI in 2', in3: 'MIDI in 3', in4: 'MIDI in 4', tracks: 'Sporen in' } } },
  ports: { audioIn: [], audioOut: [], eventIn: INS.map((id, i) => ({ id, name: i ? 'MIDI in ' + (i + 1) : 'MIDI in' })), eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [], multiEventIn: [{ id: 'tracks', name: 'Tracks in' }], multiEventOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = defaults(), dead = false, shell = null, sh = null, peers = [], bundles = new Map(), ctlCache = new Map(), learn = null, lastText = T.none, lastEl = null, heard = new Set(), root = null, peerSig = '', portsApplied = false;
    const liveBars = new Map(), prev = new Map();   // meters en vorige waarde per koppeling (voor het oppakken van een flank)
    const pid = t => 'o_' + t.id;
    const peerOf = id => peers.find(p => p.id === id) || null;
    const label = p => p ? p.name : '';
    // ---- poorten: één eventuit per actief apparaat met een gebeurtenissen-ingang ----
    function portsNow() {
      const out = state.targets.filter(t => t.port).map(t => ({ id: pid(t), name: '→ ' + (t.name || t.id) }));
      return { audioIn: [], audioOut: [], eventIn: INS.map((id, i) => ({ id, name: i ? 'MIDI in ' + (i + 1) : 'MIDI in' })), eventOut: out, modIn: [], modOut: [], multiIn: [], multiOut: [], multiEventIn: [{ id: 'tracks', name: 'Tracks in' }], multiEventOut: [] };
    }
    let portSig = '';
    function syncPorts() { const p = portsNow(), sig = JSON.stringify(p.eventOut); if (sig === portSig) return; portSig = sig; try { host.setPorts(self, p); } catch (e) { /* de host kent ons nog niet */ } }
    // ---- apparaten ----
    const target = id => state.targets.find(t => t.id === id) || null;
    const controlsOf = (t, fresh) => { if (fresh || !ctlCache.has(t.id)) { let l = []; try { l = host.controls(self, t.id) || []; } catch (e) { l = []; } ctlCache.set(t.id, l); } return ctlCache.get(t.id); };
    // een koppeling vindt zijn regelaar op sleutel, en anders op dezelfde naam zonder letterverschil (zodat een preset op elk apparaat met een 'Cutoff' werkt)
    function resolve(t, m) { const L = controlsOf(t); let c = L.find(x => x.key === m.ctl); if (c || !m.ctl) return c || null; const base = m.ctl.replace(/#\d+$/, '').toLowerCase(); return L.find(x => x.key.replace(/#\d+$/, '').toLowerCase() === base) || null; }
    function inPortOf(p) { return p && Array.isArray(p.eventIn) && p.eventIn.length ? p.eventIn[0].id : ''; }
    function cableOf(t) { try { return (host.cablesFrom(self, pid(t)) || []).find(c => c.to === t.id && c.kind === 'event') || null; } catch (e) { return null; } }
    function ensureCable(t) {
      if (!t.port) return; if (cableOf(t)) { t.linked = true; return; }
      try { if (host.connect(self, pid(t), t.id, t.port, 'event')) t.linked = true; } catch (e) { /* geen kabel mogelijk */ }
    }
    function addTarget(id) {
      const p = peerOf(id); if (!p || target(id)) return;
      const t = normTarget({ id, def: p.def, name: label(p), port: inPortOf(p) }); state.targets.push(t); syncPorts();
      if (t.port) { t.routes.push(normRoute({ src: 'in' })); setTimeout(() => { if (!dead) { ensureCable(t); render(); } }, 0); }
      controlsOf(t, true); render();
    }
    function removeTarget(id) {
      const t = target(id); if (!t) return; try { host.disconnect(self, pid(t)); } catch (e) { /* ok */ }
      state.targets = state.targets.filter(x => x !== t); ctlCache.delete(id); syncPorts(); render();
    }
    // ---- gebeurtenissen ----
    function srcOf(ev) {
      if (ev.type === 'note') return { k: 'note', n: int(ev.note, 0, 127, 0), val: clamp(+ev.vel || 0, 0, 1) };
      if (ev.type === 'noteoff') return { k: 'note', n: int(ev.note, 0, 127, 0), val: 0 };
      if (ev.type !== 'cc') return null; const v = clamp(+ev.value || 0, 0, 1);
      if (Number.isInteger(ev.cc)) return { k: 'cc', n: ev.cc, val: v };
      if (ev.id === 'bend') return { k: 'bend', n: -1, val: v };
      if (ev.id === 'pressure') return { k: 'pressure', n: -1, val: v };
      return { k: 'name', n: -1, id: String(ev.id || ''), val: v };
    }
    const sameSrc = (a, b) => a && b && a.k === b.k && (a.k === 'cc' || a.k === 'note' ? a.n === b.n : a.k === 'name' ? a.id === b.id : true);
    const srcLabel = s => !s ? T.unmapped : (s.k === 'cc' ? T.srcCc(s.n) : s.k === 'note' ? T.srcNote(s.n) : s.k === 'bend' ? T.srcBend : s.k === 'pressure' ? T.srcPress : T.srcName(s.id)) + ' · ' + (s.ch ? 'ch ' + s.ch : T.anyCh) + (s.port ? ' · ' + T.inN(s.port) : '');
    function apply(t, m, mi, s) {
      let v = s.val; if (m.inv) v = 1 - v; v = m.min + v * (m.max - m.min);
      const key = t.id + ':' + mi, c = resolve(t, m); if (!c) return;
      if (c && c.type === 'check' && m.toggle) { const was = prev.get(key) || 0; prev.set(key, s.val); if (s.val >= 0.5 && was < 0.5) host.setControl(self, t.id, c.key, c.value ? 0 : 1), c.value = !c.value; return; }
      if (c && c.type === 'button') { const was = prev.get(key) || 0; prev.set(key, v); if (v >= 0.5 && was < 0.5) host.setControl(self, t.id, c.key, 1); return; }
      const q = Math.round(v * 1024); if (prev.get(key) === q) return; prev.set(key, q); host.setControl(self, t.id, c.key, v);
      const bar = liveBars.get(key); if (bar) bar.style.width = Math.round(clamp(v, 0, 1) * 100) + '%';
    }
    function onKeyboard(ev, port) {
      const s = srcOf(ev), ch = int(ev.ch, 0, 16, 0);
      if (!heard.has(port)) { heard.add(port); render(); }
      if (s) {
        const shown = s.k === 'note' && ev.type === 'noteoff' ? null : srcLabel({ ...s, ch, port }) + ' = ' + Math.round(s.val * 100) + '%';
        if (shown) { lastText = shown; if (lastEl) lastEl.textContent = shown; }
        if (learn && !(s.k === 'note' && ev.type === 'noteoff')) { const t = target(learn.t), m = t && t.maps[learn.m]; if (m) { m.src = { k: s.k, n: s.n, id: s.id || '', ch, port }; learn = null; render(); return; } learn = null; }
      }
      if (s) for (const t of state.targets) t.maps.forEach((m, mi) => { if (m.src && m.ctl && sameSrc(m.src, s) && (!m.src.ch || m.src.ch === ch) && (!m.src.port || m.src.port === port)) { try { apply(t, m, mi, s); } catch (e) { /* de regelaar is weg */ } } });
      for (const t of state.targets) {
        if (!t.port) continue; const mapped = s && ev.type === 'cc' && t.maps.some(m => m.src && m.ctl && sameSrc(m.src, s) && (!m.src.ch || m.src.ch === ch) && (!m.src.port || m.src.port === port));
        if (mapped) continue;
        for (const r of t.routes) if (r.src === 'in' && (!r.ch || r.ch === ch) && (!r.port || r.port === port)) { host.emit(self, pid(t), ev); break; }
      }
    }
    function onTrack(ev) {
      for (const t of state.targets) { if (!t.port) continue; for (const r of t.routes) if (r.src === 'tr' && r.key === ev.bundle && r.track === ev.track) { host.emit(self, pid(t), ev); break; } }
    }
    // ---- UI ----
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const trackList = () => { const l = []; for (const b of bundles.values()) for (const tr of b.tracks) l.push({ key: b.key, track: tr.id, text: b.label + ' › ' + tr.name + (tr.ch ? ' (ch ' + tr.ch + ')' : '') }); return l; };
    function render() {
      if (!root) return; root.replaceChildren(); liveBars.clear();
      // bronnen
      const sec = el('div', null, root, 'sec'); el('h3', T.sources, sec);
      const k = el('div', null, sec, 'line'); el('b', T.inputs + ': ', k); k.appendChild(document.createTextNode(INS.map(p => T.inN(p) + ' ' + (heard.has(p) ? '✓' : '–')).join(' · ')));
      for (const b of bundles.values()) { const l = el('div', null, sec, 'line'); el('b', b.label + ': ', l); l.appendChild(document.createTextNode(b.tracks.map(t => t.name + (t.ch ? ' (' + t.ch + ')' : '')).join(' · ') || '–')); }
      if (!heard.size && !bundles.size) el('div', T.noSources, sec, 'hint');
      const act = el('div', null, sec, 'line act'); el('b', T.last + ': ', act); lastEl = el('span', lastText, act);
      // apparaten
      const dv = el('div', null, root, 'sec'); el('h3', T.devices, dv);
      const add = el('select', null, dv); add.setAttribute('aria-label', T.addDevice); const o0 = el('option', T.addDevice, add); o0.value = '';
      for (const p of peers) if (!target(p.id)) { const o = el('option', label(p), add); o.value = p.id; }
      add.onchange = () => { const v = add.value; if (v) addTarget(v); };
      if (!state.targets.length) el('div', T.noDevices, dv, 'hint');
      for (const t of state.targets) renderTarget(dv, t);
    }
    function renderTarget(parent, t) {
      const p = peerOf(t.id), card = el('div', null, parent, 'tgt' + (p ? '' : ' gone')); const head = el('div', null, card, 'head');
      el('b', (p ? label(p) : t.name || t.id), head); const rm = el('button', '×', head); rm.type = 'button'; rm.title = T.remove; rm.setAttribute('aria-label', T.remove); rm.onclick = () => removeTarget(t.id);
      if (!p) { el('div', T.gone, card, 'hint'); return; }
      const ctl = controlsOf(t); el('span', T.counts(ctl.length), head, 'cnt'); const rf = el('button', T.refresh, head); rf.type = 'button'; rf.onclick = () => { controlsOf(t, true); render(); };
      // routes
      if (t.port) {
        const cab = cableOf(t), rh = el('div', null, card, 'sub'); el('b', T.routes, rh);
        el('span', ' · ' + T.cable + ': ' + (cab ? T.cableOk : t.linked ? T.cableLost : T.cableNone), rh, 'cab' + (cab ? '' : ' bad'));
        if (!cab) { const rb = el('button', T.reconnect, rh); rb.type = 'button'; rb.onclick = () => { ensureCable(t); render(); }; }
        t.routes.forEach((r, ri) => {
          const row = el('div', null, card, 'row'); const sel = el('select', null, row); sel.setAttribute('aria-label', T.routes);
          const ok = el('option', T.routeKbd, sel); ok.value = 'in'; const tl = trackList(); for (const x of tl) { const o = el('option', T.routeTrack + ': ' + x.text, sel); o.value = 'tr|' + x.key + '|' + x.track; }
          if (r.src === 'tr' && !tl.some(x => x.key === r.key && x.track === r.track)) { const o = el('option', T.routeTrack + ': ' + (r.track || '?') + ' (' + T.missing + ')', sel); o.value = 'tr|' + r.key + '|' + r.track; }
          sel.value = r.src === 'in' ? 'in' : 'tr|' + r.key + '|' + r.track;
          const chs = el('select', null, row); chs.setAttribute('aria-label', T.ch); const a0 = el('option', T.chAny, chs); a0.value = '0'; for (let c = 1; c <= 16; c++) { const o = el('option', T.ch + ' ' + c, chs); o.value = String(c); } chs.value = String(r.ch); chs.hidden = r.src !== 'in';
          const ins = el('select', null, row); ins.setAttribute('aria-label', T.kbd); const i0 = el('option', T.inAny, ins); i0.value = ''; for (const q of INS) { const o = el('option', T.inN(q), ins); o.value = q; } ins.value = r.port; ins.hidden = r.src !== 'in'; ins.onchange = () => { r.port = INS.includes(ins.value) ? ins.value : ''; };
          sel.onchange = () => { const v = sel.value; if (v === 'in') { r.src = 'in'; r.key = ''; r.track = ''; } else { const [, k, tr] = v.split('|'); r.src = 'tr'; r.key = k; r.track = tr; } render(); };
          chs.onchange = () => { r.ch = int(parseInt(chs.value, 10), 0, 16, 0); };
          const x = el('button', '×', row); x.type = 'button'; x.setAttribute('aria-label', T.remove); x.onclick = () => { t.routes.splice(ri, 1); render(); };
        });
        const ar = el('button', T.addRoute, card); ar.type = 'button'; ar.onclick = () => { t.routes.push(normRoute({ src: 'in' })); ensureCable(t); render(); };
      } else el('div', T.noInput, card, 'hint');
      // bibliotheek
      const lib = state.library[t.def] || {}, lh = el('div', null, card, 'sub'); el('b', T.lib + ': ', lh);
      const ls = el('select', null, lh); ls.setAttribute('aria-label', T.libPick); const l0 = el('option', T.libPick, ls); l0.value = ''; for (const n of Object.keys(lib)) { const o = el('option', n, ls); o.value = n; }
      const lb = el('button', T.load, lh); lb.type = 'button'; lb.onclick = () => { if (ls.value && lib[ls.value]) { t.maps = lib[ls.value].map(normMap); prev.clear(); render(); } };
      const ld = el('button', T.del, lh); ld.type = 'button'; ld.onclick = () => { if (ls.value) { delete lib[ls.value]; if (!Object.keys(lib).length) delete state.library[t.def]; render(); } };
      const nm = el('input', null, lh); nm.type = 'text'; nm.placeholder = T.libName; nm.setAttribute('aria-label', T.libName); nm.maxLength = 60;
      const sb = el('button', T.save, lh); sb.type = 'button'; sb.onclick = () => { const n = nm.value.trim().slice(0, 60); if (!n) { nm.focus(); return; } (state.library[t.def] = state.library[t.def] || {})[n] = t.maps.map(m => normMap(JSON.parse(JSON.stringify(m)))); render(); };
      // koppelingen
      const mh = el('div', null, card, 'sub'); el('b', T.maps, mh);
      t.maps.forEach((m, mi) => {
        const row = el('div', null, card, 'row map'); const lb2 = el('button', learn && learn.t === t.id && learn.m === mi ? T.learning : T.learn, row); lb2.type = 'button'; lb2.classList.toggle('on', !!(learn && learn.t === t.id && learn.m === mi));
        lb2.onclick = () => { learn = learn && learn.t === t.id && learn.m === mi ? null : { t: t.id, m: mi }; render(); };
        el('span', srcLabel(m.src), row, 'src');
        const cs = el('select', null, row); cs.setAttribute('aria-label', T.control); const c0 = el('option', T.pick, cs); c0.value = '';
        const byType = {}; for (const c of ctl) (byType[c.type] = byType[c.type] || []).push(c);
        for (const c of ctl) { const o = el('option', c.label + (c.type === 'range' ? '' : ' (' + c.type + ')'), cs); o.value = c.key; }
        const found = resolve(t, m); if (m.ctl && !found) { const o = el('option', (m.label || m.ctl) + ' (' + T.missing + ')', cs); o.value = m.ctl; }
        cs.value = found ? found.key : m.ctl; cs.onchange = () => { m.ctl = cs.value; const c = ctl.find(x => x.key === m.ctl); m.label = c ? c.label : ''; prev.delete(t.id + ':' + mi); render(); };
        const mn = el('input', null, row); mn.type = 'number'; mn.min = 0; mn.max = 100; mn.step = 1; mn.value = Math.round(m.min * 100); mn.title = T.min; mn.setAttribute('aria-label', T.min); mn.onchange = () => { m.min = clamp((parseFloat(mn.value) || 0) / 100, 0, 1); };
        const mx = el('input', null, row); mx.type = 'number'; mx.min = 0; mx.max = 100; mx.step = 1; mx.value = Math.round(m.max * 100); mx.title = T.max; mx.setAttribute('aria-label', T.max); mx.onchange = () => { m.max = clamp((parseFloat(mx.value) || 0) / 100, 0, 1); };
        const iv = el('label', null, row); const ic = el('input', null, iv); ic.type = 'checkbox'; ic.checked = m.inv; el('span', T.invert, iv); ic.onchange = () => { m.inv = ic.checked; };
        const cur = found; if (cur && cur.type === 'check') { const tg = el('label', null, row); const tc = el('input', null, tg); tc.type = 'checkbox'; tc.checked = m.toggle; el('span', T.toggle, tg); tc.onchange = () => { m.toggle = tc.checked; }; }
        const bar = el('span', null, row, 'live'); const bi = el('i', null, bar); liveBars.set(t.id + ':' + mi, bi);
        const x = el('button', '×', row); x.type = 'button'; x.setAttribute('aria-label', T.remove); x.onclick = () => { t.maps.splice(mi, 1); if (learn) learn = null; render(); };
      });
      const am = el('button', T.addMap, card); am.type = 'button'; am.onclick = () => { t.maps.push(newMap()); learn = { t: t.id, m: t.maps.length - 1 }; render(); };
      if (t.maps.length) { const cl = el('button', T.clear, card); cl.type = 'button'; cl.onclick = () => { t.maps = []; learn = null; prev.clear(); render(); }; }
    }
    const self = {
      inputs: {}, outputs: {},
      mount(parent) {
        if (dead) return; self.unmount(); shell = el('div', null, parent); sh = shell.attachShadow({ mode: 'open' });
        const css = el('style', null, sh); css.textContent = ':host{display:block;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--card)}h2{margin:0;font:700 20px var(--disp,sans-serif);letter-spacing:.06em}h3{margin:0 0 6px;font:700 12px var(--disp,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.hint{color:var(--muted);font-size:11px;line-height:1.4}.sec{display:grid;gap:6px}.line{display:flex;gap:6px;flex-wrap:wrap}.act span{color:var(--event)}.tgt{display:grid;gap:6px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--well,#0002)}.tgt.gone{opacity:.6}.head{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.head b{flex:1}.cnt{color:var(--muted);font-size:11px}.sub{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px}.cab.bad{color:var(--stop,#e0584a)}.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.row.map .src{min-width:120px;color:var(--event)}select,button,input[type=text],input[type=number]{font:inherit;background:var(--field,var(--well));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:4px;padding:4px 7px;min-width:0;max-width:100%}input[type=number]{width:54px}button{cursor:pointer}button.on{background:var(--event);color:#1b1206;border-color:var(--event)}label{display:flex;gap:4px;align-items:center}.live{display:inline-block;width:46px;height:6px;background:var(--well,#0007);border-radius:3px;overflow:hidden}.live i{display:block;height:100%;width:0;background:var(--event)}[hidden]{display:none!important}';
        const app = el('div', null, sh, 'app'); el('h2', T.title, app); el('div', T.hint, app, 'hint'); root = el('div', null, app, 'body'); root.style.display = 'grid'; root.style.gap = '12px';
        sh.addEventListener('pointerdown', e => e.stopPropagation()); render();
      },
      unmount() { if (shell) shell.remove(); shell = sh = root = lastEl = null; liveBars.clear(); },
      onPeers(list) {
        if (dead) return; peers = Array.isArray(list) ? list : []; let changed = false;
        for (const t of state.targets) { const p = peerOf(t.id); if (p && (t.name !== label(p) || t.def !== p.def)) { t.name = label(p); t.def = p.def; changed = true; } }
        if (!portsApplied) { portsApplied = true; portSig = ''; syncPorts(); } else if (changed) syncPorts();
        const sig = peers.map(p => p.id + '|' + p.name + '|' + p.def + '|' + (p.eventIn || []).length).join(';') + '#' + state.targets.map(t => t.id + (cableOf(t) ? 1 : 0)).join(',');
        if (sig !== peerSig) { peerSig = sig; if (root && !(sh && sh.activeElement && sh.activeElement.tagName === 'INPUT')) render(); }
      },
      onEventBundle(port, key, b) { if (dead) return; if (b) bundles.set(key, b); else bundles.delete(key); render(); },
      onEvent(port, ev) {
        if (dead || !ev || typeof ev !== 'object') return;
        if (port === 'tracks') onTrack(ev); else if (INS.includes(port)) onKeyboard(ev, port);
      },
      onTransport() {},
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { if (dead) return; state = normalize(s); learn = null; prev.clear(); portSig = ''; syncPorts(); render(); },
      getPreset() { const maps = {}; for (const t of state.targets) if (t.maps.length) maps[t.def] = JSON.parse(JSON.stringify(t.maps)); return { maps }; },
      setPreset(p) {
        if (dead) return; const maps = p && typeof p === 'object' && p.maps && typeof p.maps === 'object' ? p.maps : {};
        for (const t of state.targets) { const rows = maps[t.def] || maps['*']; if (Array.isArray(rows)) t.maps = rows.slice(0, 128).map(normMap); }
        prev.clear(); render();
      },
      destroy() { if (dead) return; dead = true; self.unmount(); }
    };
    return self;
  }
};
