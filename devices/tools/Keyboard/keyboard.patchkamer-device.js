// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.1.0 — Uitleg naar about (menu Over Keyboard); de UI toont geen uitlegtekst meer.
// 1.0.0 — Eerste versie (Patchkamer contract v1.28). Een klavier voor andere apparaten: een instelbaar aantal toetsen (25 tot 88), schermtoetsen met de muis of aanraking, de computertoetsen (A, W, S, E…,
//         Z en X voor een octaaf lager of hoger), snelheid, transponeren, MIDI-kanaal, pitch bend en modulatiewiel, vasthouden (sustain) en Alles uit. Speelmodus puls (noot met lengte) of vasthouden
//         (noot aan en uit). Geen MIDI-toegang nodig: een fysiek keyboard sluit je aan op de MIDI Controller. Vervangt het klavier van Keys / MIDI (teruggetrokken).
// Keyboard — klavier met instelbaar aantal toetsen voor andere apparaten · Patchkamer contract v1.28

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const int = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), a, b) : d;
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], BLACK = [1, 3, 6, 8, 10];
const noteName = n => NOTE[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const KEYS = [25, 37, 49, 61, 76, 88];
// computertoetsen: A W S E D F T G Y H U J K O L P ; '   (witte en zwarte toetsen, vanaf de laagste toets van de rij)
const KEYMAP = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon', 'Quote'];

const TXT = {
  nl: { keys: 'Aantal toetsen', start: 'Laagste toets', octave: 'Octaaf', vel: 'Aanslag', mode: 'Speelmodus', pulse: 'Puls (noot met lengte)', hold: 'Vasthouden (noot aan en uit)',
    len: 'Lengte', transpose: 'Transponeren', channel: 'Kanaal', bend: 'Pitch bend', mod: 'Modulatie', sustain: 'Sustain', panic: 'Alles uit', computer: 'Computertoetsen', computerOn: 'Computertoetsen aan', computerHint: 'Z en X: octaaf lager of hoger', hold1: 'Vasthouden' },
  en: { keys: 'Number of keys', start: 'Lowest key', octave: 'Octave', vel: 'Velocity', mode: 'Play mode', pulse: 'Pulse (note with length)', hold: 'Hold (note on and off)',
    len: 'Length', transpose: 'Transpose', channel: 'Channel', bend: 'Pitch bend', mod: 'Modulation', sustain: 'Sustain', panic: 'All off', computer: 'Computer keys', computerOn: 'Computer keys on', computerHint: 'Z and X: octave down or up', hold1: 'Hold' },
};

const defaults = () => ({ keys: 61, start: 36, oct: 0, velocity: 0.8, mode: 'hold', duration: 0.4, transpose: 0, channel: 1, computer: true });
function normalize(s) { s = s && typeof s === 'object' ? s : {}; const d = defaults();
  return { keys: KEYS.includes(s.keys) ? s.keys : d.keys, start: int(s.start, 0, 96, d.start), oct: int(s.oct, -3, 3, 0), velocity: num(s.velocity, 0.05, 1, d.velocity), mode: s.mode === 'pulse' ? 'pulse' : 'hold',
    duration: num(s.duration, 0.05, 4, d.duration), transpose: int(s.transpose, -24, 24, 0), channel: int(s.channel, 1, 16, 1), computer: s.computer !== false }; }

export default {
  id: 'nl.patchkamer.keyboard', name: 'Keyboard', about: { nl: 'Klik op de toetsen, of gebruik de computertoetsen (A, W, S, E…). Verbind Noten met een synth, sampler of arpeggiator.', en: 'Click the keys, or use the computer keys (A, W, S, E…). Connect Notes to a synth, sampler or arpeggiator.' }, version: '1.1.0', kind: 'utility', category: 'tool', ui: { width: 720, minWidth: 360 },
  i18n: { nl: { ports: { notes: 'Noten' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [{ id: 'notes', name: 'Notes' }], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en; let state = defaults(), dead = false, sh = null, wrap = null, sustain = false, deferred = [], bendV = 0.5, modV = 0;
    const pressed = new Map(), buttons = new Map(), self = {};
    const emit = ev => { if (dead) return; if (ev.ch === undefined) ev.ch = state.channel; host.emit(self, 'notes', ev); };
    const cc = (id, value) => emit({ type: 'cc', id, value: clamp(value, 0, 1), time: ctx.currentTime });
    const mark = (note, on) => { const b = buttons.get(note); if (b) b.classList.toggle('on', on); };
    const out = n => clamp(Math.round(n + state.transpose), 0, 127);
    function down(source, note, vel) {
      if (dead || pressed.has(source)) return; const n = out(note); pressed.set(source, { note: n, mode: state.mode }); mark(note, true);
      emit({ type: 'note', note: n, vel: clamp(vel == null ? state.velocity : vel, 0, 1), time: ctx.currentTime, dur: state.mode === 'hold' ? 120 : state.duration, ...(state.mode === 'hold' ? { held: true } : {}) });
    }
    function up(source, shown) {
      const e = pressed.get(source); if (!e) return; pressed.delete(source); if (shown != null) mark(shown, [...pressed.keys()].some(k => k !== source && String(k).endsWith(':' + shown)));
      if (e.mode === 'hold' && ![...pressed.values()].some(p => p.note === e.note)) { if (sustain) deferred.push(e.note); else emit({ type: 'noteoff', note: e.note, vel: 0, time: ctx.currentTime }); }
    }
    function pedal(on) { sustain = on; if (!on) { for (const n of deferred) if (![...pressed.values()].some(p => p.note === n)) emit({ type: 'noteoff', note: n, vel: 0, time: ctx.currentTime }); deferred = []; } }
    function panic() { for (const k of [...pressed.keys()]) { const [, n] = String(k).split(':'); up(k, +n); } pedal(false); buttons.forEach(b => b.classList.remove('on')); emit({ type: 'allnotesoff', time: ctx.currentTime }); }
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const CSS = ':host{display:block}.kb{display:grid;gap:10px;font-size:12px;color:var(--fg)}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.row label{display:flex;gap:6px;align-items:center}'
      + '.kb select,.kb input[type=number]{font:inherit;padding:2px 4px}.kb button{font:inherit;padding:3px 9px}.piano{position:relative;overflow-x:auto;padding:4px 0 8px;touch-action:pan-x}.keys{position:relative;height:130px;min-width:min-content}'
      + '.k{position:absolute;top:0;box-sizing:border-box;border:1px solid var(--line);border-radius:0 0 4px 4px;cursor:pointer;user-select:none;touch-action:none;display:flex;align-items:flex-end;justify-content:center;font:9px var(--mono,monospace);padding-bottom:3px}'
      + '.k.w{width:26px;height:130px;background:#e9ecf0;color:#4a5260}.k.b{width:16px;height:80px;background:#1b2028;color:#9aa4b2;z-index:2}.k.on{background:var(--sel);color:#fff}.k.c{font-weight:700}'
      + '.wheels{display:flex;gap:14px;align-items:flex-end}.whl{display:grid;gap:3px;justify-items:center;font:10px var(--mono,monospace);color:var(--muted)}.whl input[type=range]{writing-mode:vertical-lr;direction:rtl;height:90px;width:24px;margin:0}';
    function buildKeys(box) {
      buttons.clear(); let x = 0; const lo = state.start, hi = lo + state.keys - 1;
      for (let n = lo; n <= hi; n++) { if (BLACK.includes(n % 12)) continue; const b = el('div', n % 12 === 0 ? noteName(n) : '', box, 'k w' + (n % 12 === 0 ? ' c' : '')); b.style.left = x + 'px'; b.dataset.n = n; buttons.set(n, b); x += 26; }
      let wx = 0; for (let n = lo; n <= hi; n++) { if (BLACK.includes(n % 12)) { const b = el('div', '', box, 'k b'); b.style.left = (wx - 8) + 'px'; b.dataset.n = n; buttons.set(n, b); } else wx += 26; }
      box.style.width = x + 'px';
      const vel = e => { const r = e.currentTarget.getBoundingClientRect(); const f = clamp((e.clientY - r.top) / r.height, 0.1, 1); return clamp(state.velocity * (0.5 + f), 0.05, 1); };   // lager op de toets = harder
      box.querySelectorAll('.k').forEach(b => { const n = +b.dataset.n;
        b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } const src = 'p' + e.pointerId + ':' + n; b._src = src; down(src, n, vel(e)); });
        const end = e => { if (b._src) { up(b._src, n); mark(n, false); b._src = null; } }; b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); });
    }
    function render() {
      if (!sh || dead) return; sh.innerHTML = ''; el('style', CSS, sh); const m = el('div', null, sh, 'kb');
      const piano = el('div', null, m, 'piano'), box = el('div', null, piano, 'keys'); buildKeys(box);
      const r1 = el('div', null, m, 'row');
      const sel = (label, opts, val, fn) => { const l = el('label', label, r1); const s = el('select', null, l); opts.forEach(([v, t]) => { const o = el('option', t, s); o.value = v; }); s.value = String(val); s.onchange = () => { fn(s.value); }; return s; };
      sel(T.keys, KEYS.map(k => [k, String(k)]), state.keys, v => { panic(); state.keys = +v; render(); });
      sel(T.start, Array.from({ length: 9 }, (_, i) => [12 * i, noteName(12 * i)]).filter(([v]) => v + 12 <= 127), Math.round(state.start / 12) * 12, v => { panic(); state.start = +v; render(); });
      sel(T.mode, [['hold', T.hold], ['pulse', T.pulse]], state.mode, v => { panic(); state.mode = v; render(); });
      sel(T.channel, Array.from({ length: 16 }, (_, i) => [i + 1, String(i + 1)]), state.channel, v => { state.channel = +v; });
      const r2 = el('div', null, m, 'row');
      const rng = (label, min, max, step, val, fn, fmt) => { const l = el('label', label, r2); const i = el('input', null, l); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; const o = el('span', fmt(val), l); i.oninput = () => { fn(+i.value); o.textContent = fmt(+i.value); }; return i; };
      rng(T.vel, 5, 100, 1, Math.round(state.velocity * 100), v => { state.velocity = v / 100; }, v => v + '%');
      if (state.mode === 'pulse') rng(T.len, 5, 400, 5, Math.round(state.duration * 100), v => { state.duration = v / 100; }, v => (v / 100).toFixed(2) + ' s');
      rng(T.transpose, -24, 24, 1, state.transpose, v => { panic(); state.transpose = v; }, v => (v > 0 ? '+' : '') + v);
      const r3 = el('div', null, m, 'row');
      const wheels = el('div', null, r3, 'wheels');
      const wh = (label, init, spring, fn) => { const w = el('div', null, wheels, 'whl'); const i = el('input', null, w); i.type = 'range'; i.min = 0; i.max = 1; i.step = 0.01; i.value = init; el('span', label, w); i.oninput = () => fn(+i.value); if (spring) { const back = () => { i.value = 0.5; fn(0.5); }; i.addEventListener('pointerup', back); i.addEventListener('pointercancel', back); } return i; };
      wh(T.bend, 0.5, true, v => { bendV = v; cc('bend', v); }); wh(T.mod, modV, false, v => { modV = v; cc('vibrato', v); });
      const sb = el('button', T.sustain, r3); sb.type = 'button'; sb.classList.toggle('on', sustain); sb.onclick = () => { pedal(!sustain); sb.style.outline = sustain ? '2px solid var(--sel)' : ''; };
      const pb = el('button', T.panic, r3); pb.type = 'button'; pb.onclick = panic;
      const cl = el('label', null, r3); const ck = el('input', null, cl); ck.type = 'checkbox'; ck.checked = state.computer; ck.onchange = () => { state.computer = ck.checked; }; el('span', T.computerOn + ' · ' + T.computerHint, cl);
    }
    // computertoetsen: alleen als de focus niet in een veld staat; Z en X verschuiven het octaaf
    const base = () => 60 + 12 * state.oct - state.transpose;
    const typing = e => { const t = e.composedPath && e.composedPath()[0] || e.target; return !!t && (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) && t.type !== 'range' && t.type !== 'checkbox' || t.isContentEditable); };
    const onKey = (e, isDown) => { if (dead || !state.computer || e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
      if (isDown && !e.repeat && (e.code === 'KeyZ' || e.code === 'KeyX')) { state.oct = clamp(state.oct + (e.code === 'KeyX' ? 1 : -1), -3, 3); return; }
      const i = KEYMAP.indexOf(e.code); if (i < 0) return; e.preventDefault(); const n = base() + i, src = 'k' + e.code + ':' + n; if (isDown) { if (!e.repeat) { down(src, n); mark(n, true); } } else { up(src, n); mark(n, false); } };
    const kd = e => onKey(e, true), ku = e => onKey(e, false);
    const blur = () => { if (!dead) panic(); };   // het venster verliest de focus: alle noten los
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('blur', blur);
    Object.assign(self, {
      inputs: {}, outputs: {},
      mount(parent) { sh = parent.attachShadow ? (parent.shadowRoot || parent.attachShadow({ mode: 'open' })) : parent; render(); },
      unmount() { if (sh) sh.innerHTML = ''; sh = null; buttons.clear(); },
      getState() { return { ...state }; },
      setState(s) { panic(); state = normalize(s); if (sh) render(); },
      getPreset() { const { keys, start, velocity, mode, duration, transpose, channel } = state; return { keys, start, velocity, mode, duration, transpose, channel }; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; panic(); state = normalize({ ...state, ...p }); if (sh) render(); },
      destroy() { dead = true; document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('blur', blur); },
    });
    return self;
  },
};
