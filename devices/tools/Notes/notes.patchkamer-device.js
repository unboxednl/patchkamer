// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Notes en nieuwe id nl.patchkamer.notes (voorheen Notities, nl.patchkamer.notities);
//          werkruimtes en songs uit die tijd verwijzen naar de oude id. Tweetalig (host.lang, teksten in TXT). setState negeert onbekende velden,
//          kapt teksten en de takenlijst af op een vaste lengte en geeft ongeldige waarden de standaard. Nieuw: getPreset/setPreset laten het
//          tijdstip van de laatste wijziging (`edited`) buiten een preset. Geen geluid, geen poorten.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// 1.0.0 — Eerste versie (als Notities).
// Notes: een notitieblok op de vloer voor ideeën, toonsoort, structuur en wat er nog moet. Maakt geen geluid;
// de tekst wordt met de werkruimte bewaard.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { key: 'Toonsoort', keyPh: 'bv. A mineur, D dorisch', tempo: 'Tempo / gevoel', tempoPh: 'bv. 128, hypnotisch', section: 'Deel', addHead: 'voeg een kop toe',
    sections: ['Intro', 'Opbouw', 'Break', 'Drop', 'Outro'], textPh: 'Ideeën, structuur, welke klank waar, wat je morgen wilt proberen…', textA: 'notities',
    todo: 'Nog doen', newPh: 'nieuwe taak, Enter', newA: 'nieuwe taak', doneA: 'klaar: ', remove: 'weg', edited: 'gewijzigd ', locale: 'nl-NL' },
  en: { key: 'Key', keyPh: 'e.g. A minor, D dorian', tempo: 'Tempo / feel', tempoPh: 'e.g. 128, hypnotic', section: 'Section', addHead: 'add a heading',
    sections: ['Intro', 'Build', 'Break', 'Drop', 'Outro'], textPh: 'Ideas, structure, which sound goes where, what to try tomorrow…', textA: 'notes',
    todo: 'To do', newPh: 'new task, Enter', newA: 'new task', doneA: 'done: ', remove: 'remove', edited: 'edited ', locale: 'en-GB' },
};
// grenzen voor setState (§13)
const MAX_SHORT = 200, MAX_TEXT = 100000, MAX_TODO = 200, MAX_TASK = 500;
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const cleanTodo = a => (Array.isArray(a) ? a : []).filter(t => t && typeof t.t === 'string').slice(0, MAX_TODO).map(t => ({ t: t.t.slice(0, MAX_TASK), done: t.done === true }));

export default {
  id: 'nl.patchkamer.notes',
  name: 'Notes',
  version: '1.11.0',
  kind: 'utility',
  category: 'tool',
  ui: { width: 380, minWidth: 240 },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [] },

  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const DEF = () => ({ key: '', tempo: '', text: '', todo: [], edited: 0 });
    const state = DEF();
    let el = null, f = {};
    const touch = () => { state.edited = Date.now(); if (f.when) f.when.textContent = when(); };
    const when = () => state.edited ? T.edited + new Date(state.edited).toLocaleString(T.locale, { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const E = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const fieldCss = 'background:var(--card-2);color:var(--fg);border:1px solid var(--line);border-radius:3px;font-family:var(--mono);font-size:12px;padding:5px 7px;min-width:0;width:100%;box-sizing:border-box';
    const labCss = 'font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)';
    function paintTodo() {
      const box = f.todo; if (!box) return; box.innerHTML = '';
      state.todo.forEach((t, i) => {
        const row = E('div', 'display:grid;grid-template-columns:16px minmax(0,1fr) 22px;gap:6px;align-items:center');
        const cb = E('input'); cb.type = 'checkbox'; cb.checked = !!t.done; cb.setAttribute('aria-label', T.doneA + t.t); cb.onchange = () => { t.done = cb.checked; tx.style.opacity = t.done ? 0.5 : 1; tx.style.textDecoration = t.done ? 'line-through' : ''; touch(); };
        const tx = E('span', 'font-size:12px;overflow-wrap:anywhere' + (t.done ? ';opacity:.5;text-decoration:line-through' : ''), t.t);
        const rm = E('button', 'padding:0 4px;font-size:11px', '×'); rm.title = T.remove; rm.onclick = () => { state.todo.splice(i, 1); paintTodo(); touch(); };
        row.append(cb, tx, rm); box.appendChild(row);
      });
    }
    function paint() { if (!el) return; f.key.value = state.key; f.tempo.value = state.tempo; f.text.value = state.text; f.when.textContent = when(); paintTodo(); }
    const self = {
      inputs: {}, outputs: {},
      mount(root) {
        el = E('div', 'display:grid;gap:8px'); root.appendChild(el);
        const top = E('div', 'display:grid;grid-template-columns:1fr 1fr;gap:8px');
        const k = E('label', 'display:grid;gap:2px'); k.appendChild(E('span', labCss, T.key)); f.key = E('input', fieldCss); f.key.maxLength = MAX_SHORT; f.key.placeholder = T.keyPh; f.key.oninput = () => { state.key = f.key.value; touch(); }; k.appendChild(f.key);
        const t = E('label', 'display:grid;gap:2px'); t.appendChild(E('span', labCss, T.tempo)); f.tempo = E('input', fieldCss); f.tempo.maxLength = MAX_SHORT; f.tempo.placeholder = T.tempoPh; f.tempo.oninput = () => { state.tempo = f.tempo.value; touch(); }; t.appendChild(f.tempo);
        top.append(k, t); el.appendChild(top);
        const ins = E('div', 'display:flex;gap:4px;flex-wrap:wrap;align-items:center'); ins.appendChild(E('span', labCss + ';margin-right:4px', T.section));
        T.sections.forEach(s => { const b = E('button', 'font-size:10px;padding:2px 6px', s); b.title = T.addHead; b.onclick = () => { const p = f.text.selectionStart ?? f.text.value.length; const add = (p && f.text.value[p - 1] !== '\n' ? '\n' : '') + '## ' + s + '\n'; f.text.setRangeText(add, p, p, 'end'); state.text = f.text.value; touch(); f.text.focus(); }; ins.appendChild(b); });
        el.appendChild(ins);
        f.text = E('textarea', fieldCss + ';min-height:180px;resize:vertical;line-height:1.5'); f.text.maxLength = MAX_TEXT; f.text.placeholder = T.textPh; f.text.setAttribute('aria-label', T.textA); f.text.spellcheck = true;
        f.text.oninput = () => { state.text = f.text.value; touch(); }; el.appendChild(f.text);
        const tl = E('div', labCss, T.todo); el.appendChild(tl);
        f.todo = E('div', 'display:grid;gap:4px'); el.appendChild(f.todo);
        const add = E('div', 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px'); const ni = E('input', fieldCss); ni.maxLength = MAX_TASK; ni.placeholder = T.newPh; ni.setAttribute('aria-label', T.newA);
        const nb = E('button', '', '+'); const push = () => { const v = ni.value.trim(); if (!v || state.todo.length >= MAX_TODO) return; state.todo.push({ t: v, done: false }); ni.value = ''; paintTodo(); touch(); };
        nb.onclick = push; ni.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); push(); } }; add.append(ni, nb); el.appendChild(add);
        f.when = E('div', 'font-size:10px;color:var(--muted);text-align:right'); el.appendChild(f.when);
        paint();
      },
      unmount() { el = null; f = {}; },
      getState() { return { key: state.key, tempo: state.tempo, text: state.text, todo: state.todo.map(t => ({ t: t.t, done: !!t.done })), edited: state.edited }; },
      // preset: de tekst en de taken, niet het tijdstip van de laatste wijziging (gegevens van deze sessie, contract §13)
      getPreset() { const s = self.getState(); delete s.edited; return s; },
      setPreset(p) { const edited = state.edited; self.setState({ ...(p && typeof p === 'object' ? p : {}), edited }); },
      setState(s) {
        s = s && typeof s === 'object' ? s : {}; const d = DEF();
        state.key = str(s.key, MAX_SHORT); state.tempo = str(s.tempo, MAX_SHORT); state.text = str(s.text, MAX_TEXT);
        state.todo = cleanTodo(s.todo); state.edited = typeof s.edited === 'number' && Number.isFinite(s.edited) && s.edited >= 0 ? s.edited : d.edited; paint();
      },
      destroy() { el = null; f = {}; }
    };
    return self;
  }
};
