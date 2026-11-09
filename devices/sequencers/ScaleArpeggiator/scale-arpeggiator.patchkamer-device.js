// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in het definitieveld about.
// 1.14.1 — Meer continue regelaars bestuurbaar via params()/modulate(): Accent op de tel, Zwakke noten zachter, Swing, Mensachtig en Speelkans erbij (Gate en Velocity zaten er al in); de nieuwe staan standaard uit. Modulatie komt alleen bovenop de knop en is nooit state (effectief = knop + o × bereik, geclampt).
//   Bewust weggelaten: patroon, snelheid, octaven, herhalingen, latch, actief, patroonlengte (keuzes) en de balkjes van het velocity- en lengtepatroon (patroondata). Zonder modulatie gelijk aan 1.14.0.
// 1.14.0 — Extra swing (`swing`, 0 … 0,5 van een zestiende, standaard 0). Een noot (of roll-herhaling) die in een oneven zestiende valt komt swing × stepDur later, bovenop de swing van de host; even zestienden blijven staan.
//   Snelheden van 1/8 en langzamer spelen alleen op even zestienden en schuiven dus niet. Met swing 0 geeft een state dezelfde gebeurtenissen als voorheen.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Scale Arpeggiator (nieuwe id nl.patchkamer.scale-arpeggiator, eigen map in sequencers; voorheen een
//   Nederlandstalig apparaat met een andere naam en id, nl.patchkamer.toonladder). Songs en presets uit die tijd verwijzen naar de oude id en laden hier niet in.
//   Met een ongewijzigde (oude) state en dezelfde ingang en klokstappen stuurt dit apparaat dezelfde noten uit als het oude bestand.
//   - tweetalig (host.lang); de poortnamen zijn Engels in alle talen (in- en uitgang delen de poort-id notes, dus één naam per taal zou beide veranderen); kleuren volgen de CSS-variabelen van de host; schuiven hebben data-pk-default
//   - raster: ook 1/64, 1/16 triool, 1/8 triool en 1/32 triool (de eerste vijf snelheden zijn ongewijzigd)
//   - extra patronen: Heen / terug met herhaald eindpunt, Naar elkaar toe, Duim (laagste toon om de andere noot)
//   - dynamiek: een velocity-patroon en een lengte-patroon van 1 tot 16 noten (standaard vlak), accent op de tel, zachtere zwakke noten (ghost),
//     mensachtige variatie, speelkans en herhalingen per noot (rolls van 2 tot 4)
//   - de patronen zijn te bewerken in de kaart (klik of sleep op de balkjes)
// Geklokte arpeggiator: speelt de noten die op de ingang klinken (of vastgehouden worden) om de beurt, op de klok van de studio. Een inkomende noot
// houdt zijn eigen tijd en lengte; held:true wacht op noteoff. Een wachtrij zorgt dat toekomstige ingangsnoten niet te vroeg klinken. Geen eigen
// klok en geen audio.
const EN = {
  'Patroon': 'Pattern', 'Omhoog': 'Up', 'Omlaag': 'Down', 'Heen / terug': 'Up / down', 'Speelvolgorde': 'Play order', 'Willekeurig': 'Random', 'Akkoord-puls': 'Chord pulse',
  'Heen / terug (herhaald)': 'Up / down (repeat ends)', 'Naar elkaar toe': 'Converge', 'Duim': 'Thumb',
  'Snelheid': 'Rate', '1/16 triool': '1/16 triplet', '1/8 triool': '1/8 triplet', '1/32 triool': '1/32 triplet',
  'Octaven': 'Octaves', 'Latch': 'Latch', 'Uit': 'Off', 'Akkoord vasthouden': 'Hold chord', 'Actief': 'Active', 'Arpeggio': 'Arpeggio', 'Doorvoer': 'Pass-through',
  'Herhalingen': 'Repeats', 'Gate': 'Gate', 'Velocity': 'Velocity', 'Accent op de tel': 'Beat accent', 'Zwakke noten zachter': 'Soft weak notes', 'Mensachtig': 'Humanize', 'Speelkans': 'Probability',
  'Akkoord wissen': 'Clear chord', 'Swing': 'Swing', 'Patroonlengte': 'Pattern length', 'Velocity-patroon': 'Velocity pattern', 'Lengte-patroon': 'Length pattern',
  'Balkjes: klik of sleep om de velocity en lengte van elke noot in de cyclus te zetten (hoog = hard of lang).': 'Bars: click or drag to set the velocity and length of each note in the cycle (high = loud or long).',
  'Interne klok gestopt': 'Internal clock stopped', 'Interne klok · {0} BPM': 'Internal clock · {0} BPM', 'Wacht op interne klok': 'Waiting for internal clock',
  'Noten komen van de aangesloten oranje kabel. Latch bewaart het akkoord tot een nieuw akkoord of Wissen.': 'Notes come from the connected orange cable. Latch keeps the chord until a new chord or Clear.',
  'De host bepaalt BPM en swing. 1/32 plant twee noten per zestiende vooruit; alle tijden zijn AudioContext-tijden. Een toetsenbord op de ingang is de akkoordbron zelf: zet Actief op Doorvoer om het toetsenbord ongewijzigd door te laten.':
    'The host sets BPM and swing. 1/32 schedules two notes per sixteenth ahead; all times are AudioContext times. A keyboard on the input is the chord source itself: set Active to Pass-through to let the keyboard through unchanged.',
};
export default {
  id: 'nl.patchkamer.scale-arpeggiator', name: 'Scale Arpeggiator', version: '1.15.0', about: { nl: 'Arpeggiator: speelt de noten van een keyboard of sequencer om de beurt als arpeggio naar een synth. Start het hosttransport.', en: 'Arpeggiator: plays the notes from a keyboard or sequencer one after another as an arpeggio into a synth. Start the host transport.' }, kind: 'utility', category: 'sequencer', ui: { width: 620, minWidth: 330 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'notes', name: 'Chord / keyboard' }], eventOut: [{ id: 'notes', name: 'Arpeggio' }], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const finite = (v, d, a, b) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;
    let mountHost = null, panel = null, uiHandles = {};
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    function mountUI(el) {
      clearUI(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', `:host{display:block;color:var(--fg,#d9e6e7);font:13px system-ui,sans-serif;--x-acc:var(--event,#91e0d4);--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg,#d9e6e7))}.app{container-type:inline-size;background:var(--card,#142129);border-radius:10px;padding:14px;box-sizing:border-box}p{line-height:1.5;color:var(--muted,#aabec5);margin:8px 0}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line,#344953);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted,#adc3c9)}button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#223640);border:1px solid var(--line,#49616c);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--x-acc)}input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink)}canvas{display:block;width:100%;background:var(--well,#0b171d);border:1px solid var(--line,#36505a);border-radius:6px;touch-action:none;cursor:crosshair}h3{font-size:13px;color:var(--x-ink);margin:14px 0 8px}label{min-width:0}.small{font-size:11px}`);
      shadow.addEventListener('pointerdown', e => e.stopPropagation()); shadow.addEventListener('keydown', e => e.stopPropagation());
      panel = add(shadow, 'div', undefined); panel.className = 'app'; uiHandles = {}; return panel;
    }
    function clearUI() { for (const h of Object.values(uiHandles)) try { h.dispose && h.dispose(); } catch { } if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; uiHandles = {}; }
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; return b; };
    function select(parent, label, options, value, change) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); return el; }
    function knob(parent, id, label, bounds, value, change, format = v => Number(v).toFixed(2)) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input'); input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(defaults[id]); input.setAttribute('data-pk-default', input.value); input.setAttribute('aria-label', label); input.value = String(value);
      input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; uiHandles[id] = { set(v) { input.value = String(v); out.textContent = format(v); } }; return input; }
    // balkjes-editor voor een patroon van maximaal 16 waarden
    function bars(parent, id, label, arr, lenGet, lo) { const h3 = add(parent, 'h3', label), cv = add(parent, 'canvas'); cv.style.height = '64px'; cv.setAttribute('aria-label', label); cv.title = tx('Balkjes: klik of sleep om de velocity en lengte van elke noot in de cyclus te zetten (hoog = hard of lang).'); let w = 300, down = false;
      const draw = () => { const g = cv.getContext('2d'); if (!g) return; const dpr = clamp(globalThis.devicePixelRatio || 1, 1, 3), cw = Math.max(160, cv.clientWidth || w); w = cw; if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(64 * dpr); } g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, 64);
        const cs = getComputedStyle(cv), acc = cs.getPropertyValue('--event').trim() || '#91e0d4', line = cs.getPropertyValue('--line').trim() || '#444', L = lenGet();
        for (let i = 0; i < 16; i++) { const x = i / 16 * cw, bw = cw / 16 - 3, v = arr[i], hgt = 60 * v; g.globalAlpha = i < L ? 1 : 0.18; g.fillStyle = i < L ? acc : line; g.fillRect(x + 1, 62 - hgt, bw, hgt); } g.globalAlpha = 1; };
      const set = e => { const r = cv.getBoundingClientRect(), i = clamp(Math.floor((e.clientX - r.left) / (r.width || 1) * 16), 0, 15), v = clamp(1 - (e.clientY - r.top) / (r.height || 1), lo, 1); if (i < lenGet()) arr[i] = Math.round(v * 20) / 20 < lo ? lo : Math.round(v * 20) / 20; draw(); };
      cv.onpointerdown = e => { down = true; try { cv.setPointerCapture(e.pointerId); } catch { } set(e); }; cv.onpointermove = e => { if (down) set(e); }; cv.onpointerup = cv.onpointercancel = () => { down = false; };
      let ro = null; try { ro = new ResizeObserver(draw); ro.observe(cv); } catch { } uiHandles[id] = { set() { draw(); }, dispose() { try { ro && ro.disconnect(); } catch { } } }; draw(); return cv; }
    const defaults = { swing: 0, mode: 'up', rate: 2, octaves: 2, gate: 0.7, velocity: 0.85, latch: false, enabled: true, seed: 12345, plen: 1, vpat: new Array(16).fill(1), gpat: new Array(16).fill(1), accent: 0, ghost: 0, human: 0, chance: 1, repeat: 1 };
    let state = JSON.parse(JSON.stringify(defaults)), mod = {}, dead = false, playing = null, queue = [], held = new Map(), latched = new Map(), counter = 0, last = -1, gen = 12345, pgen = 7, status = null, clockStatus = null, clockBpm = 0, ownAbs = -1;
    const rates = [0.5, 1, 2, 4, 8];                                   // de eerste vijf: noten per stap of stappen per noot (ongewijzigd)
    const NEWRATES = { 5: 0.25, 6: 2 / 3, 7: 4 / 3, 8: 1 / 3 };      // nieuwe snelheden: afstand tussen noten in zestiende noten
    const RATE_LABELS = [['0', '1/32'], ['1', '1/16'], ['2', '1/8'], ['3', '1/4'], ['4', '1/2'], ['5', '1/64'], ['6', '1/16 triool'], ['7', '1/8 triool'], ['8', '1/32 triool']];
    const modes = [['up', 'Omhoog'], ['down', 'Omlaag'], ['updown', 'Heen / terug'], ['order', 'Speelvolgorde'], ['random', 'Willekeurig'], ['chord', 'Akkoord-puls'], ['updown2', 'Heen / terug (herhaald)'], ['converge', 'Naar elkaar toe'], ['thumb', 'Duim']];
    function emit(e) { if (!dead) host.emit(self, 'notes', e); }
    let missed = [];
    function reset() { missed = []; queue = []; held.clear(); latched.clear(); counter = 0; last = -1; ownAbs = -1; gen = state.seed; pgen = (state.seed ^ 0x9e3779b9) >>> 0; }
    function consume(t) { while (queue.length && queue[0].time <= t) { const e = queue.shift(), type = String(e.type).toLowerCase().replace(/[_-]/g, ''); if (type === 'panic' || type === 'allnotesoff') { held.clear(); latched.clear(); continue; }
        if (!Number.isFinite(e.note)) continue; const n = clamp(Math.round(e.note), 0, 127); if (type === 'noteoff' || e.vel === 0) held.delete(n); else if (type === 'note' || type === 'noteon') {
          for (const [key, v] of held) if (v.until <= e.time) held.delete(key); if (state.latch && held.size === 0) latched.clear();
          const entry = { note: n, vel: finite(e.vel, 0.8, 0, 1), until: e.held === true || !Number.isFinite(e.dur) ? Infinity : e.time + clamp(e.dur, 0.005, 120) }; held.set(n, entry); latched.set(n, entry);
        } }
      for (const [n, e] of held) if (e.until <= t) held.delete(n);
    }
    function notes() { const base = [...(state.latch ? latched : held).values()]; if (state.mode !== 'order') base.sort((a, b) => a.note - b.note); const result = []; for (let o = 0; o < state.octaves; o++) for (const e of base) if (e.note + o * 12 <= 127) result.push({ note: e.note + o * 12, vel: e.vel }); return result.slice(0, 128); }
    // effectieve waarde van een bestuurbare regelaar: knop + o × (max − min), geclampt
    const MODP = [['gate', 'Gate', 0.1, 1.5, 'env', 0.02, true], ['velocity', 'Velocity', 0.05, 1, 'level', 0.02, true], ['accent', 'Accent op de tel', 0, 1, 'accent', 0.05, false], ['ghost', 'Zwakke noten zachter', 0, 1, 'accent', 0.05, false],
      ['swing', 'Swing', 0, 0.5, 'swing', 0.05, false], ['human', 'Mensachtig', 0, 1, 'humanize', 0.05, false], ['chance', 'Speelkans', 0, 1, 'probability', 0.05, false]];
    const MODBY = Object.fromEntries(MODP.map(m => [m[0], m]));
    const EF = k => { const m = MODBY[k], o = mod[k]; return o ? clamp(state[k] + o * (m[3] - m[2]), m[2], m[3]) : state[k]; };
    const lcg = g => (Math.imul(g, 1664525) + 1013904223) >>> 0;
    function tick(t, stepSeconds, pos, sd = stepSeconds) {
      consume(t); const list = notes(); if (!list.length) return false; let index = 0; const n = list.length;
      if (state.mode === 'down') index = n - 1 - counter % n; else if (state.mode === 'updown') { const period = Math.max(1, n * 2 - 2), x = counter % period; index = x < n ? x : period - x; }
      else if (state.mode === 'updown2') { const period = n * 2, x = counter % period; index = x < n ? x : period - 1 - x; }
      else if (state.mode === 'converge') { const x = counter % n; index = x % 2 === 0 ? x / 2 : n - 1 - (x - 1) / 2; }
      else if (state.mode === 'thumb') { const x = counter % Math.max(1, n * 2 - 2 || 1); index = n === 1 ? 0 : x % 2 === 0 ? 0 : 1 + ((x - 1) / 2) % (n - 1); }
      else if (state.mode === 'random') { gen = lcg(gen); index = Math.floor(gen / 4294967296 * n); } else index = counter % n;
      const gate = clamp(state.gate + (mod.gate || 0) * 1.4, 0.1, 1.5), velocity = clamp(state.velocity + (mod.velocity || 0) * 0.95, 0.05, 1), c = counter % state.plen, vm = state.vpat[c], gm = state.gpat[c];
      counter++;
      const chance = EF('chance'), swingV = EF('swing'), accentV = EF('accent'), ghostV = EF('ghost'), humanV = EF('human');
      if (chance < 1) { pgen = lcg(pgen); if (pgen / 4294967296 >= chance) return true; }
      const sw = swingV > 0 && Math.floor(pos + 1e-9) % 2 === 1 ? Math.min(0.5, swingV) * sd : 0;
      const beat = Math.abs(pos / 4 - Math.round(pos / 4)) < 1e-6, eighth = Math.abs(pos / 2 - Math.round(pos / 2)) < 1e-6, rep = state.repeat;
      let hum = 0, delay = 0; if (humanV > 0) { hum = (Math.random() * 2 - 1) * humanV * 0.25; delay = Math.random() * humanV * 0.3 * stepSeconds; }
      for (const e of state.mode === 'chord' ? list : [list[index]]) {
        let v = e.vel * velocity * vm; if (accentV > 0 && beat) v += accentV * 0.3; if (ghostV > 0 && !eighth) v *= 1 - ghostV * 0.6; v += hum;
        v = clamp(v, 0.01, 1);
        if (rep === 1) emit({ type: 'note', note: e.note, vel: v, time: t + delay + sw, dur: Math.max(0.01, stepSeconds * gate * gm) });
        else for (let r = 0; r < rep; r++) emit({ type: 'note', note: e.note, vel: clamp(v * (1 - 0.12 * r), 0.01, 1), time: t + delay + sw + r * stepSeconds / rep, dur: Math.max(0.005, stepSeconds / rep * gate * gm) });
      }
      return true;
    }
    function clockLabel() { if (clockStatus) clockStatus.textContent = playing === false ? tx('Interne klok gestopt') : clockBpm ? tx('Interne klok · {0} BPM', Number(clockBpm.toFixed(2))) : tx('Wacht op interne klok'); }
    function render(el) { mountUI(el);
      const controls = grid(panel);
      select(controls, tx('Patroon'), modes.map(([v, t]) => [v, tx(t)]), state.mode, v => { state.mode = v; counter = 0; });
      select(controls, tx('Snelheid'), RATE_LABELS.map(([v, t]) => [v, tx(t)]), state.rate, v => state.rate = +v);
      select(controls, tx('Octaven'), [[1, '1'], [2, '2'], [3, '3'], [4, '4']], state.octaves, v => state.octaves = +v);
      select(controls, tx('Herhalingen'), [[1, '1'], [2, '2'], [3, '3'], [4, '4']], state.repeat, v => state.repeat = +v);
      select(controls, tx('Latch'), [[0, tx('Uit')], [1, tx('Akkoord vasthouden')]], state.latch ? 1 : 0, v => { state.latch = v === '1'; if (!state.latch) latched.clear(); });
      select(controls, tx('Actief'), [[1, tx('Arpeggio')], [0, tx('Doorvoer')]], state.enabled ? 1 : 0, v => { state.enabled = v === '1'; reset(); });
      select(controls, tx('Patroonlengte'), Array.from({ length: 16 }, (_, i) => [i + 1, String(i + 1)]), state.plen, v => { state.plen = +v; counter = 0; uiHandles.vpat && uiHandles.vpat.set(); uiHandles.gpat && uiHandles.gpat.set(); });
      const pct = v => Math.round(v * 100) + '%';
      knob(controls, 'gate', tx('Gate'), [0.1, 1.5, 0.01], state.gate, v => state.gate = v);
      knob(controls, 'velocity', tx('Velocity'), [0.05, 1, 0.01], state.velocity, v => state.velocity = v);
      knob(controls, 'accent', tx('Accent op de tel'), [0, 1, 0.01], state.accent, v => state.accent = v, pct);
      knob(controls, 'ghost', tx('Zwakke noten zachter'), [0, 1, 0.01], state.ghost, v => state.ghost = v, pct);
      knob(controls, 'swing', tx('Swing'), [0, 0.5, 0.01], state.swing, v => state.swing = v, pct);
      knob(controls, 'human', tx('Mensachtig'), [0, 1, 0.01], state.human, v => state.human = v, pct);
      knob(controls, 'chance', tx('Speelkans'), [0, 1, 0.01], state.chance, v => state.chance = v, pct);
      bars(panel, 'vpat', tx('Velocity-patroon'), state.vpat, () => state.plen, 0.05); bars(panel, 'gpat', tx('Lengte-patroon'), state.gpat, () => state.plen, 0.1);
      button(row(panel), tx('Akkoord wissen'), () => { reset(); emit({ type: 'allnotesoff', time: ctx.currentTime }); }); clockStatus = add(panel, 'p'); clockLabel();
      status = add(panel, 'p', tx('Noten komen van de aangesloten oranje kabel. Latch bewaart het akkoord tot een nieuw akkoord of Wissen.'));
      add(panel, 'p', tx('De host bepaalt BPM en swing. 1/32 plant twee noten per zestiende vooruit; alle tijden zijn AudioContext-tijden. Een toetsenbord op de ingang is de akkoordbron zelf: zet Actief op Doorvoer om het toetsenbord ongewijzigd door te laten.')); }
    const self = { inputs: {}, outputs: {}, mount: render, unmount() { status = null; clockStatus = null; clearUI(); },
      onEvent(port, e) { try { if (dead || port !== 'notes' || !e || !Number.isFinite(e.time)) return; if (e.type === 'cc' || !state.enabled) { emit({ ...e }); return; } if (!['note', 'noteon', 'noteoff', 'note_on', 'note_off', 'panic', 'allnotesoff'].includes(String(e.type).toLowerCase())) return; queue.push({ ...e }); queue.sort((a, b) => a.time - b.time); if (queue.length > 512) queue.shift();
          if (playing && missed.length) { const now = ctx.currentTime; missed = missed.filter(m => m.t >= now); const due = missed.filter(m => m.t >= e.time).sort((a, b) => a.t - b.t); if (due.length) { missed = missed.filter(m => m.t < e.time); for (const m of due) if (!tick(m.t, m.d, m.p, m.s)) missed.push(m); } } } catch { } },
      onTransport(info) { if (dead) return; const next = !!info?.playing; if (next !== playing) last = -1; playing = next; if (!playing) { reset(); emit({ type: 'allnotesoff', time: ctx.currentTime }); } clockLabel(); },
      onStep(info) { try {
        if (dead || playing === false || !state.enabled || !info || !Number.isFinite(info.time) || !Number.isInteger(info.step) || info.step < 0 || info.step > 15) return;
        // De klokstap van de host is de klok. Sommige hosts laten bar of stepDur weg; dat mag het arpeggio niet stilzetten.
        const bpm = finite(info.bpm, finite(host.bpm, 0, 0, 1000), 0, 1000);
        const stepSeconds = Number.isFinite(info.stepDur) && info.stepDur > 0 ? info.stepDur : bpm > 0 ? 15 / bpm : 0;
        if (!stepSeconds) return;
        const key = info.time + ':' + info.step; if (key === last) return; last = key;
        clockBpm = bpm > 0 ? bpm : 15 / stepSeconds; clockLabel();
        const t = info.time;
        // Elke ondersteunde deling herhaalt binnen één maat van 16 stappen of loopt via de absolute positie. De getimede stappen van de host blijven staan.
        const run = (at, d, p) => { if (!tick(at, d, p, stepSeconds)) { missed.push({ t: at, d, p, s: stepSeconds }); if (missed.length > 8) missed.shift(); } };
        if (Object.hasOwn(NEWRATES, state.rate)) {
          const sp = NEWRATES[state.rate], abs = Number.isFinite(info.bar) ? info.bar * 16 + info.step : ownAbs + 1; ownAbs = abs;
          for (let k = Math.ceil(abs / sp - 1e-9); k * sp < abs + 1 - 1e-9; k++) run(t + (k * sp - abs) * stepSeconds, stepSeconds * sp, k * sp);
          return; }
        const division = rates[state.rate];
        if (division >= 1) { if (info.step % division === 0) run(t, stepSeconds * division, info.step); }
        else { run(t, stepSeconds / 2, info.step); run(t + stepSeconds / 2, stepSeconds / 2, info.step + 0.5); }
      } catch { } },
      params() { return MODP.map(([id, name, min, max, role, drift, on]) => ({ id, name: tx(name), lane: 'arp', laneName: tx('Arpeggio'), min, max, scale: 'lin', role, drift, on })); },
      modulate(o) { mod = {}; if (o && typeof o === 'object') for (const k in MODBY) if (Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(raw) { if (dead) return; const s = raw && typeof raw === 'object' ? raw : {}; const pat = (a, lo) => Array.from({ length: 16 }, (_, i) => finite(Array.isArray(a) ? a[i] : undefined, 1, lo, 1));
        state = { swing: finite(s.swing, 0, 0, 0.5), mode: modes.some(([v]) => v === s.mode) ? s.mode : 'up', rate: Math.round(finite(s.rate, 2, 0, 8)), octaves: Math.round(finite(s.octaves, 2, 1, 4)), gate: finite(s.gate, 0.7, 0.1, 1.5), velocity: finite(s.velocity, 0.85, 0.05, 1), latch: typeof s.latch === 'boolean' ? s.latch : false, enabled: typeof s.enabled === 'boolean' ? s.enabled : true, seed: Math.round(finite(s.seed, 12345, 0, 4294967295)),
          plen: Math.round(finite(s.plen, 1, 1, 16)), vpat: pat(s.vpat, 0.05), gpat: pat(s.gpat, 0.1), accent: finite(s.accent, 0, 0, 1), ghost: finite(s.ghost, 0, 0, 1), human: finite(s.human, 0, 0, 1), chance: finite(s.chance, 1, 0, 1), repeat: Math.round(finite(s.repeat, 1, 1, 4)) };
        reset(); if (mountHost) render(mountHost); },
      destroy() { if (dead) return; reset(); dead = true; self.unmount(); } };
    return self;
  },
};
