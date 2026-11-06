// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Zelf bestuurbaar (contract §8): params() + modulate() voor Drift (sterkte), Tempo van drift, Samenhang en Eigen (alle standaard uit). Modulatie komt alleen bovenop de knop en is nooit state; getState blijft gelijk.
//          Sterkte, tempo en samenhang zijn van de (gedeelde) klok: een Drift die een master volgt negeert modulatie daarop. Geen lus: modulate() roept zelf geen host.modulate aan, dus een Drift die een andere Drift (of zichzelf) stuurt herhaalt niets.
//          Een Drift die een andere Drift via de Volg-ingang volgt krijgt in de master nu ook diens vier parameters in de lijst (standaard uit). Bewust weggelaten: groep, volgmodus (keuzes), bevriezen en nieuw zaad (knoppen). Zonder modulatie gelijk aan 1.11.0.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Drift en nieuwe id nl.patchkamer.drift (voorheen Drift · modulator, nl.patchkamer.driftmod); werkruimtes en presets uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang, poortnamen per taal in i18n). Tekenen via host.frame met een ResizeObserver en een kleurcache voor de kleuren van de host.
//          Elke uitgestuurde waarde is eindig (NaN en Infinity worden nul) en een bevroren stand in setState wordt begrensd; de beweging zelf is gelijk aan 1.8.0.
// Drift: maakt geen geluid en heeft geen sequencer. Laat parameters van aangesloten apparaten langzaam rond
// hun knopstand bewegen, zodat een instrument blijft variëren.
//
// Beweging ("wind"): per parameter drie trage, onderling onmeetbare sinussen (periodes 35 s tot ruim
// 20 min drifttijd), deterministisch uit een zaad. Daardoor bewegen apparaten met hetzelfde zaad en
// dezelfde klok exact samen, zonder berichten uit te wisselen.
//   Groep A–D : alle Drifts in de groep delen klok, tempo, sterkte, samenhang, zaad en bevriezen.
//   Volg      : kabel van de Drift-uitgang van een master naar de Volg-ingang; de volger neemt de
//               klok en wind van de master over (gelijk, gespiegeld of verschoven, plus eigen deel).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fin = v => (Number.isFinite(v) ? v : 0);
const ID = 'nl.patchkamer.drift';
const ROLE_COL = { pitch: '#b48cff', filter: '#4fd1c5', res: '#ff8fc8', env: '#7ef0c8', decay: '#f4a261', level: '#f4d35e', pan: '#8fb3ff', sub: '#d9a066', glide: '#9fb0c4' };
const PALETTE = ['#4fd1c5', '#f4a261', '#b48cff', '#f4d35e', '#ff8fc8', '#8fb3ff', '#7ef0c8', '#e4574a'];
const GROUPS = new Map();   // 'A'..'D' -> gedeelde klok
const INST = new Map();     // host-id -> interne staat (zodat een volger zijn master vindt)
const W = 360;              // zichtvenster in drifttijd (s): 80% verleden, 20% vooruitblik

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, Engels staat hieronder; onbekende taal = Engels
const EN = {
  'Drift maakt geen geluid en speelt geen noten. Het laat de aangevinkte parameters van aangesloten apparaten langzaam rond hun knopstand bewegen; de knop blijft de basis.':
    'Drift makes no sound and plays no notes. It lets the ticked parameters of connected devices wander slowly around their knob position; the knob stays the base.',
  'Drift': 'Drift', 'Tempo van drift': 'Drift speed', 'Samenhang': 'Coherence',
  'hoe snel de drifttijd loopt; ×1 = periodes van een halve minuut tot twintig minuten': 'how fast drift time runs; ×1 = periods from half a minute to twenty minutes',
  'hoe sterk gelijke soorten parameters (alle filters, alle toonhoogtes) samen bewegen, ook over sporen en apparaten heen': 'how strongly similar kinds of parameters (all filters, all pitches) move together, across lanes and devices too',
  'Bevries': 'Freeze', 'Bevroren': 'Frozen', 'houd alle beweging vast op de huidige stand': 'hold all movement at its current position',
  'Nieuwe wind': 'New wind', 'een nieuwe, andere beweging (zaad)': 'a new, different movement (seed)',
  'Groep ': 'Group ', 'groep': 'group', 'Drifts in dezelfde groep delen klok, tempo, sterkte, samenhang en wind': 'Drifts in the same group share clock, speed, amount, coherence and wind',
  'Volgt ': 'Follows ', 'master': 'master', ' (groep genegeerd zolang hij volgt)': ' (group ignored while it follows)',
  ' · {0} Drift(s) delen klok en wind': ' · {0} Drift(s) share clock and wind',
  'Vrij. Zet Drifts in dezelfde groep, of trek een paarse kabel van een andere Drift naar Volg om deze te laten volgen.': 'Free. Put Drifts in the same group, or pull a purple cable from another Drift to Follow to make this one follow.',
  'Volgen ': 'Follow mode ', 'gelijk': 'same', 'gespiegeld': 'mirrored', 'verschoven': 'shifted', 'manier van volgen': 'way of following',
  'Eigen': 'Own', 'mengt een eigen, losse beweging door de gedeelde heen': 'mixes an own, separate movement into the shared one',
  'Volgers: ': 'Followers: ',
  'Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Drift</b> naar de ingang <b>Mod</b> van een instrument. Alle apparaten met stuurbare parameters kunnen worden aangesloten. Drift maakt zelf geen geluid en speelt geen noten.':
    'Nothing connected yet. Pull a <b>purple cable</b> from the output <b>Drift</b> to the <b>Mod</b> input of an instrument. Any device with controllable parameters can be connected. Drift makes no sound and plays no notes itself.',
  '{0} van {1} parameters driften': '{0} of {1} parameters drifting',
  'alle parameters van dit spoor aan/uit': 'all parameters of this lane on/off', 'alles in {0}': 'all in {0}',
  'bevries dit spoor': 'freeze this lane', 'bevries {0}': 'freeze {0}', 'nieuwe wind voor dit spoor': 'new wind for this lane', 'nieuwe wind {0}': 'new wind {0}',
  'laat {0} driften': 'let {0} drift', 'bereik {0}': 'range {0}', 'maximale afwijking, als deel van het bereik van de knop': 'maximum deviation, as a share of the knob range',
  'beweging van {0}': 'movement of {0}', '← 5 min drifttijd': '← 5 min drift time', 'nu · vooruit →': 'now · ahead →', 'schaal ±': 'scale ±',
};

const CSS = `
:host{all:initial;display:block;container-type:inline-size;font-family:var(--mono,ui-monospace,monospace);font-size:12px;color:var(--fg,#e6e9ee)}
*{box-sizing:border-box}
.dm{display:grid;gap:10px;min-width:0}
.intro{color:var(--muted,#8a93a3);font-size:11px;line-height:1.45;margin:0}
.top{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:8px 14px;align-items:end;padding:8px 10px;border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,#161a20)}
.ctl{display:grid;gap:2px;min-width:0}
.ctl label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a3);display:flex;justify-content:space-between;gap:6px}
.ctl label output{color:var(--mod,#b48cff);letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums}
.btns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
button{font:inherit;font-size:11px;color:var(--field-fg,var(--fg,#e6e9ee));background:var(--field,var(--card,#1c2128));border:1px solid var(--line,#2a303a);border-radius:4px;padding:4px 9px;cursor:pointer;letter-spacing:.04em}
button:hover{border-color:var(--mod,#b48cff)} button.on{background:var(--mod,#b48cff);border-color:var(--mod,#b48cff);color:#17121f}
button:disabled,input:disabled,select:disabled{opacity:.4;cursor:default}
select{font:inherit;font-size:11px;color:var(--field-fg,var(--fg,#e6e9ee));background:var(--field,var(--card,#1c2128));border:1px solid var(--line,#2a303a);border-radius:4px;padding:3px 5px}
input[type=range]{width:100%;margin:0;accent-color:var(--mod,#b48cff);height:16px;min-width:0}
input[type=checkbox]{accent-color:var(--mod,#b48cff);margin:0;width:14px;height:14px}
.link{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:6px 10px;border:1px dashed var(--line,#2a303a);border-radius:5px;font-size:11px}
.link .who{color:var(--mod,#b48cff);font-weight:500}
.link .ctl{grid-auto-flow:column;align-items:center;gap:6px;min-width:150px}
.link .muted{color:var(--muted,#8a93a3)}
.empty{border:1px dashed var(--line,#2a303a);border-radius:5px;padding:14px;color:var(--muted,#8a93a3);line-height:1.5}
.empty b{color:var(--mod,#b48cff);font-weight:500}
.tg{display:grid;gap:6px}
.tg h3{margin:0;font-family:var(--disp,sans-serif);font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:10px;align-items:baseline}
.tg h3 small{font-family:var(--mono,monospace);font-size:10px;font-weight:400;letter-spacing:0;text-transform:none;color:var(--muted,#8a93a3)}
.lane{display:grid;grid-template-columns:minmax(250px,330px) minmax(0,1fr);gap:10px;padding:8px;border:1px solid var(--line,#2a303a);border-radius:5px;background:var(--card-2,#161a20);min-width:0}
.lhead{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.lhead b{font-family:var(--disp,sans-serif);font-size:14px;letter-spacing:.08em;text-transform:uppercase;flex:1}
.lhead button{padding:2px 7px}
.prow{display:grid;grid-template-columns:16px 8px minmax(58px,1fr) minmax(60px,1.3fr) 40px 44px;gap:6px;align-items:center;min-height:22px}
.prow .dot{width:8px;height:8px;border-radius:50%}
.prow .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prow output{font-variant-numeric:tabular-nums;text-align:right;color:var(--muted,#8a93a3);font-size:11px}
.prow .live{font-variant-numeric:tabular-nums;text-align:right;font-size:11px}
.prow.off .nm,.prow.off .live{opacity:.45}
.plot{position:relative;min-height:96px;min-width:0}
.plot canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.cap{display:flex;justify-content:space-between;font-size:10px;color:var(--muted,#8a93a3);margin-top:4px}
.followers{font-size:11px;color:var(--muted,#8a93a3)}
@container (max-width:640px){ .top{grid-template-columns:1fr 1fr} .btns{grid-column:1/-1;justify-content:flex-start} .lane{grid-template-columns:minmax(0,1fr)} .plot{min-height:80px} }
`;

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const GENS = new Map();
function gen(seed, key) { const k = seed + '|' + key; let g = GENS.get(k); if (!g) { const r = rng(hash(k)); g = { T: [35 + 85 * r(), 120 + 300 * r(), 420 + 880 * r()], ph: [r() * 6.2832, r() * 6.2832, r() * 6.2832] }; if (GENS.size > 4000) GENS.clear(); GENS.set(k, g); } return g; }
function wind(seed, key, t) { const g = gen(seed, key); return clamp((0.5 * Math.sin(6.2832 * t / g.T[0] + g.ph[0]) + 0.35 * Math.sin(6.2832 * t / g.T[1] + g.ph[1]) + 0.25 * Math.sin(6.2832 * t / g.T[2] + g.ph[2])) * 0.9, -1, 1); }
const newSeed = () => Math.floor(Math.random() * 1e9);
const speedOf = x => 0.25 * Math.pow(2, 7 * x), xOfSpeed = s => Math.log2(clamp(s, 0.25, 32) / 0.25) / 7;
const fmtSpeed = s => '×' + (s < 1 ? s.toFixed(2) : s < 10 ? s.toFixed(1) : Math.round(s));
const pct = v => Math.round(v * 100) + '%';

// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id: ID,
  name: 'Drift',
  version: '1.11.1',
  kind: 'modulator',
  category: 'mod',
  ui: { width: 820, minWidth: 380 },
  i18n: { en: { ports: { volg: 'Follow' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [], modIn: [{ id: 'volg', name: 'Volg' }], modOut: [{ id: 'mod', name: 'Drift' }] },

  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const defClock = () => ({ t: 0, speed: 1, amount: 0.6, coh: 0.35, seed: newSeed(), frozen: false, wall: null });
    const me = { id: null, own: defClock(), masterId: null, masterName: '', targets: [], followers: [],
      S: { group: '', follow: 'gelijk', eigen: 0, ownSeed: newSeed(), sel: {}, salt: {}, freeze: {} } };
    // Bestuurbare regelaars: [id, naam, min, max, log, role, drift, aan]; effectief = knop + o × bereik (log: knop × (max/min)^o), geclampt
    const MODP = [['amount', 'Drift', 0, 1, false, 'depth', 0.05, false], ['speed', 'Tempo van drift', 0.25, 32, true, 'rate', 0.05, false], ['coh', 'Samenhang', 0, 1, false, 'param', 0.05, false], ['eigen', 'Eigen', 0, 1, false, 'param', 0.05, false]];
    const MODBY = Object.fromEntries(MODP.map(m => [m[0], m])), mod = {};
    const EFF = (k, b) => { const o = mod[k]; if (!o || (k !== 'eigen' && isSlave())) return b; const m = MODBY[k], mn = m[2], mx = m[3]; return m[4] ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    let self, dead = false, timer = 0, stopDraw = null, root = null, ui = null, ro = null, col = null, colT = 0;

    // ---------- klok ----------
    function clockOf(m, seen = new Set()) {
      if (seen.has(m)) return m.own; seen.add(m);
      const ms = m.masterId && INST.get(m.masterId); if (ms) return clockOf(ms, seen);
      if (m.S.group) { let g = GROUPS.get(m.S.group); if (!g) { g = { ...m.own, wall: null }; GROUPS.set(m.S.group, g); } return g; }
      return m.own;
    }
    function ensureId() { if (!me.id && self && self._id) { me.id = self._id; INST.set(me.id, me); } }
    const isSlave = () => !!(me.masterId && INST.get(me.masterId));
    function advance(c) { const now = ctx.currentTime; if (c.wall !== null && !c.frozen) c.t += Math.min(5, Math.max(0, now - c.wall)) * EFF('speed', c.speed); c.wall = now; }
    function setGroup(g) {
      const was = me.S.group; if (g === was) return;
      if (was) { const gc = GROUPS.get(was); if (gc) Object.assign(me.own, gc, { wall: null }); }
      me.S.group = g; if (was) dropEmptyGroups(); clockOf(me); paintAll();
    }
    function dropEmptyGroups() { [...GROUPS.keys()].forEach(g => { if (![...INST.values()].some(m => m.S.group === g)) GROUPS.delete(g); }); }

    // ---------- selectie per doel ----------
    function selOf(T, p) { const st = me.S.sel[T.id] || (me.S.sel[T.id] = {}); let x = st[p.id];
      if (!x) x = st[p.id] = { on: p.on !== undefined ? !!p.on : false, range: clamp(p.drift !== undefined ? p.drift : 0.1, 0, 0.5) }; return x; }
    const laneKey = (T, lane) => T.id + '/' + lane;
    function lanesOf(T) { const L = new Map(); T.params.forEach(p => { const k = p.lane || '-'; if (!L.has(k)) L.set(k, { lane: k, name: p.laneName || (p.lane ? String(p.lane) : 'Parameters'), params: [] }); L.get(k).params.push(p); }); return [...L.values()]; }

    // ---------- waarde van één parameter op drifttijd t (−1..1, vóór bereik en sterkte) ----------
    function raw(T, p, t, c) {
      const salt = me.S.salt[laneKey(T, p.lane || '-')] || 0;
      const keyRole = 'r:' + (p.role || p.id), keyLane = 'l:' + (p.lane || '-') + ':' + p.id + (salt ? ':' + salt : '');
      const linked = isSlave() || !!me.S.group;
      const tt = t + (linked && me.S.follow === 'verschoven' ? 240 : 0);
      const coh = EFF('coh', c.coh); let v = (coh * wind(c.seed, keyRole, tt) + (1 - coh) * wind(c.seed, keyLane, tt)) / Math.max(0.6, Math.hypot(coh, 1 - coh));
      if (linked && me.S.follow === 'gespiegeld') v = -v;
      const eg = EFF('eigen', me.S.eigen); if (linked && eg > 0) v = (1 - eg) * v + eg * wind(me.S.ownSeed, keyLane, t);
      return fin(clamp(v, -1, 1));
    }
    function offsetAt(T, p, t, c) { const s = selOf(T, p); const fz = me.S.freeze[laneKey(T, p.lane || '-')]; return raw(T, p, fz !== undefined ? fz : t, c) * s.range * EFF('amount', c.amount); }

    // ---------- de modulatie zelf: 20× per seconde ----------
    function tick() {
      if (dead) return; ensureId(); const c = clockOf(me); advance(c);
      if (!me.id) return;
      me.targets.forEach(T => { if (!T.params.length) return; const o = {};
        T.params.forEach(p => { if (selOf(T, p).on) o[p.id] = fin(clamp(offsetAt(T, p, c.t, c), -1, 1)); });
        host.modulate(self, T.id, o); });
    }
    timer = setInterval(tick, 50);

    // ---------- UI ----------
    const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    function slider(parent, label, val, fmt, onin) {
      const w = E('div', 'ctl'), l = E('label'), o = E('output'), i = E('input'); i.type = 'range'; i.min = 0; i.max = 1; i.step = 0.001; i.value = val; i.setAttribute('aria-label', label);
      l.append(document.createTextNode(label), o); o.textContent = fmt(val); i.oninput = () => { onin(+i.value); o.textContent = fmt(+i.value); };
      w.append(l, i); parent.appendChild(w); return { i, o, set(v) { i.value = v; o.textContent = fmt(v); } };
    }
    function buildTop(dm) {
      const top = E('div', 'top'); dm.appendChild(top);
      const c0 = () => clockOf(me), D = defClock();
      ui.amount = slider(top, tx('Drift'), c0().amount, pct, v => { c0().amount = v; }); ui.amount.i.dataset.pkDefault = String(D.amount);
      ui.speed = slider(top, tx('Tempo van drift'), xOfSpeed(c0().speed), x => fmtSpeed(speedOf(x)), x => { c0().speed = speedOf(x); }); ui.speed.i.dataset.pkDefault = String(xOfSpeed(D.speed));
      ui.coh = slider(top, tx('Samenhang'), c0().coh, pct, v => { c0().coh = v; }); ui.coh.i.dataset.pkDefault = String(D.coh);
      ui.speed.i.title = tx('hoe snel de drifttijd loopt; ×1 = periodes van een halve minuut tot twintig minuten');
      ui.coh.i.title = tx('hoe sterk gelijke soorten parameters (alle filters, alle toonhoogtes) samen bewegen, ook over sporen en apparaten heen');
      const b = E('div', 'btns'); top.appendChild(b);
      ui.freeze = E('button', '', tx('Bevries')); ui.freeze.title = tx('houd alle beweging vast op de huidige stand'); ui.freeze.onclick = () => { const c = c0(); c.frozen = !c.frozen; paintAll(); };
      ui.reseed = E('button', '', tx('Nieuwe wind')); ui.reseed.title = tx('een nieuwe, andere beweging (zaad)'); ui.reseed.onclick = () => { c0().seed = newSeed(); paintAll(); };
      const gl = E('label', '', tx('Groep ')); gl.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:var(--muted,#8a93a3)';
      ui.group = E('select'); [['', '—'], ['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']].forEach(([v, t]) => { const o = E('option', '', t); o.value = v; ui.group.appendChild(o); });
      ui.group.setAttribute('aria-label', tx('groep')); ui.group.title = tx('Drifts in dezelfde groep delen klok, tempo, sterkte, samenhang en wind'); ui.group.onchange = () => setGroup(ui.group.value);
      gl.appendChild(ui.group); b.append(ui.freeze, ui.reseed, gl);
      ui.link = E('div', 'link'); dm.appendChild(ui.link);
    }
    function paintLink() {
      const L = ui.link; L.innerHTML = ''; const slave = isSlave(), grp = me.S.group;
      const st = E('span'); if (slave) { st.append(tx('Volgt ')); st.appendChild(E('span', 'who', me.masterName || tx('master'))); st.append(grp ? tx(' (groep genegeerd zolang hij volgt)') : ''); }
      else if (grp) { const n = [...INST.values()].filter(m => m.S.group === grp).length; st.append(tx('Groep ')); st.appendChild(E('span', 'who', grp)); st.append(tx(' · {0} Drift(s) delen klok en wind', n)); }
      else { st.className = 'muted'; st.textContent = tx('Vrij. Zet Drifts in dezelfde groep, of trek een paarse kabel van een andere Drift naar Volg om deze te laten volgen.'); }
      L.appendChild(st);
      if (slave || grp) {
        const f = E('label', 'muted', tx('Volgen ')); f.style.cssText = 'display:flex;gap:5px;align-items:center';
        const s = E('select'); ['gelijk', 'gespiegeld', 'verschoven'].forEach(v => { const o = E('option', '', tx(v)); o.value = v; s.appendChild(o); });
        s.value = me.S.follow; s.onchange = () => { me.S.follow = s.value; }; s.setAttribute('aria-label', tx('manier van volgen')); f.appendChild(s); L.appendChild(f);
        const eg = E('div', 'ctl'); L.appendChild(eg); const es = slider(eg, tx('Eigen'), me.S.eigen, pct, v => { me.S.eigen = v; }); es.i.title = tx('mengt een eigen, losse beweging door de gedeelde heen'); es.i.dataset.pkDefault = '0';
      }
      if (me.followers.length) { const f = E('span', 'followers', tx('Volgers: ') + me.followers.map(x => x.name).join(', ')); L.appendChild(f); }
    }
    function paintTop() {
      const c = clockOf(me), lock = isSlave();
      ui.amount.set(c.amount); ui.speed.set(xOfSpeed(c.speed)); ui.coh.set(c.coh);
      [ui.amount.i, ui.speed.i, ui.coh.i, ui.freeze, ui.reseed].forEach(x => x.disabled = lock);
      ui.freeze.classList.toggle('on', !!c.frozen); ui.freeze.textContent = c.frozen ? tx('Bevroren') : tx('Bevries');
      ui.group.value = me.S.group; ui.group.disabled = lock;
    }
    function paintTargets() {
      const box = ui.targets; box.innerHTML = ''; ui.lanes = []; if (ro) ro.disconnect();
      const real = me.targets.filter(T => T.params.length);
      if (!real.length) { const e = E('div', 'empty'); e.innerHTML = tx('Nog niets aangesloten. Trek een <b>paarse kabel</b> van de uitgang <b>Drift</b> naar de ingang <b>Mod</b> van een instrument. Alle apparaten met stuurbare parameters kunnen worden aangesloten. Drift maakt zelf geen geluid en speelt geen noten.'); box.appendChild(e); return; }
      const dup = {}; real.forEach(T => dup[T.name] = (dup[T.name] || 0) + 1);
      real.forEach(T => {
        const sec = E('section', 'tg'), h = E('h3', '', '→ ' + T.name + (dup[T.name] > 1 ? ' · ' + T.id : '')), sm = E('small'); h.appendChild(sm); sec.appendChild(h);
        const count = () => { const n = T.params.filter(p => selOf(T, p).on).length; sm.textContent = tx('{0} van {1} parameters driften', n, T.params.length); }; count();
        lanesOf(T).forEach(Ln => {
          const lane = E('div', 'lane'), left = E('div'), lh = E('div', 'lhead'), nm = E('b', '', Ln.name);
          const all = E('input'); all.type = 'checkbox'; all.title = tx('alle parameters van dit spoor aan/uit'); all.setAttribute('aria-label', tx('alles in {0}', Ln.name));
          const lk = laneKey(T, Ln.lane);
          const fz = E('button', '', '❄'); fz.title = tx('bevries dit spoor'); fz.setAttribute('aria-label', tx('bevries {0}', Ln.name));
          fz.onclick = () => { if (me.S.freeze[lk] !== undefined) delete me.S.freeze[lk]; else me.S.freeze[lk] = clockOf(me).t; fz.classList.toggle('on', me.S.freeze[lk] !== undefined); };
          fz.classList.toggle('on', me.S.freeze[lk] !== undefined);
          const rs = E('button', '', '↻'); rs.title = tx('nieuwe wind voor dit spoor'); rs.setAttribute('aria-label', tx('nieuwe wind {0}', Ln.name)); rs.onclick = () => { me.S.salt[lk] = (me.S.salt[lk] || 0) + 1; };
          lh.append(all, nm, fz, rs); left.appendChild(lh);
          const rows = [];
          Ln.params.forEach((p, k) => {
            const s = selOf(T, p), colr = ROLE_COL[p.role] || PALETTE[k % PALETTE.length];
            const r = E('div', 'prow' + (s.on ? '' : ' off')), cb = E('input'), dot = E('span', 'dot'), n = E('span', 'nm', p.name), rg = E('input'), out = E('output'), live = E('span', 'live');
            cb.type = 'checkbox'; cb.checked = s.on; cb.setAttribute('aria-label', tx('laat {0} driften', p.name)); dot.style.background = colr; live.style.color = colr;
            rg.type = 'range'; rg.min = 0; rg.max = 0.5; rg.step = 0.005; rg.value = s.range; rg.setAttribute('aria-label', tx('bereik {0}', p.name)); rg.title = tx('maximale afwijking, als deel van het bereik van de knop');
            out.textContent = '±' + pct(s.range); n.title = `${p.name} · ${p.min}…${p.max}${p.scale === 'log' ? ' (log)' : ''}`;
            cb.onchange = () => { s.on = cb.checked; r.classList.toggle('off', !s.on); count(); syncAll(); };
            rg.oninput = () => { s.range = +rg.value; out.textContent = '±' + pct(s.range); };
            rg.ondblclick = () => { s.range = clamp(p.drift !== undefined ? p.drift : 0.1, 0, 0.5); rg.value = s.range; out.textContent = '±' + pct(s.range); };
            r.append(cb, dot, n, rg, out, live); left.appendChild(r); rows.push({ p, s, live, col: colr });
          });
          const syncAll = () => { const on = rows.filter(x => x.s.on).length; all.checked = on === rows.length; all.indeterminate = on > 0 && on < rows.length; };
          all.onchange = () => { rows.forEach(x => { x.s.on = all.checked; }); left.querySelectorAll('.prow').forEach((r, i) => { r.classList.toggle('off', !rows[i].s.on); r.querySelector('input[type=checkbox]').checked = rows[i].s.on; }); syncAll(); count(); };
          syncAll();
          const right = E('div'), plot = E('div', 'plot'), cv = E('canvas'), cap = E('div', 'cap');
          cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', tx('beweging van {0}', Ln.name));
          cap.append(E('span', '', tx('← 5 min drifttijd')), E('span', 'scale', ''), E('span', '', tx('nu · vooruit →')));
          plot.appendChild(cv); right.append(plot, cap); lane.append(left, right); sec.appendChild(lane);
          const L = { T, lane: Ln.lane, rows, cv, g: cv.getContext('2d'), plot, w: 0, h: 0, scale: cap.querySelector('.scale'), lk, scaleText: '' };
          ui.lanes.push(L); plot.__lane = L;
        });
        box.appendChild(sec);
      });
      ui.lanes.forEach(L => { L.w = L.plot.clientWidth; L.h = L.plot.clientHeight; if (ro) ro.observe(L.plot); });
    }
    function readColors() { const cs = getComputedStyle(ui.targets); colT = performance.now(); col = { muted: cs.getPropertyValue('--muted').trim() || '#8a93a3', mod: cs.getPropertyValue('--mod').trim() || '#b48cff' }; }
    function draw() {
      if (dead || !ui) return;
      const c = clockOf(me);
      // groepsleden en volgers kunnen de gedeelde klok veranderen: houd de knoppen en de koppelregel bij
      const sig = [c.amount, c.speed, c.coh, c.frozen, c.seed, isSlave(), me.masterName, me.S.group, me.S.group ? [...INST.values()].filter(m => m.S.group === me.S.group).length : 0].join('|');
      if (sig !== ui.sig) { const linkSig = sig.split('|').slice(5).join('|'); ui.sig = sig; paintTop(); if (linkSig !== ui.linkSig) { ui.linkSig = linkSig; paintLink(); } }
      if (!col || performance.now() - colT > 1000) readColors();
      ui.lanes.forEach(L => {
        const on = L.rows.filter(x => x.s.on);
        L.rows.forEach(x => { if (!x.s.on) { if (x.live.textContent !== '—') x.live.textContent = '—'; return; } const v = offsetAt(L.T, x.p, c.t, c); const s = (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + '%'; if (x.live.textContent !== s) x.live.textContent = s; });
        const cv = L.cv, w = L.w, h = L.h; if (!w || !h) return; const dpr = window.devicePixelRatio || 1;
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        const g = L.g; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
        const sc = Math.max(0.02, ...on.map(x => x.s.range * c.amount)); const st = tx('schaal ±') + pct(sc); if (L.scale && L.scaleText !== st) { L.scaleText = st; L.scale.textContent = st; }
        const mid = h / 2, nowX = w * 0.8;
        g.globalAlpha = 0.3; g.strokeStyle = col.muted; g.lineWidth = 1; g.beginPath(); g.moveTo(0, mid); g.lineTo(w, mid); g.moveTo(0, 6); g.lineTo(w, 6); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
        g.globalAlpha = 0.6; g.strokeStyle = col.mod; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(nowX, 0); g.lineTo(nowX, h); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
        const fz = me.S.freeze[L.lk];
        on.forEach(x => {
          const yOf = v => mid - clamp(v / sc, -1, 1) * (mid - 6), N = Math.max(40, Math.min(240, Math.round(w / 3)));
          g.lineWidth = 2; g.strokeStyle = x.col;
          if (fz !== undefined) { const y = yOf(offsetAt(L.T, x.p, c.t, c)); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); return; }
          for (const part of [0, 1]) { g.globalAlpha = part ? 0.35 : 1; g.beginPath();
            const a = part ? Math.round(N * 0.8) : 0, b = part ? N : Math.round(N * 0.8);
            for (let i = a; i <= b; i++) { const tt = c.t - W * 0.8 + (i / N) * W; const y = yOf(raw(L.T, x.p, tt, c) * x.s.range * c.amount); const X = (i / N) * w; i === a ? g.moveTo(X, y) : g.lineTo(X, y); }
            g.stroke(); }
          g.globalAlpha = 1; const y = yOf(offsetAt(L.T, x.p, c.t, c)); g.fillStyle = x.col; g.beginPath(); g.arc(nowX, y, 3.5, 0, 6.2832); g.fill();
        });
      });
    }
    function paintAll() { if (!ui) return; paintTop(); paintLink(); paintTargets(); }
    const onSkin = () => { col = null; };
    function stopLoop() { if (stopDraw) { stopDraw(); stopDraw = null; } }

    self = {
      inputs: {}, outputs: {},
      mount(el) {
        const holder = document.createElement('div'); el.appendChild(holder); root = holder.attachShadow({ mode: 'open' }); root.addEventListener('pointerdown', e => e.stopPropagation());
        const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
        const dm = E('div', 'dm'); root.appendChild(dm);
        dm.appendChild(E('p', 'intro', tx('Drift maakt geen geluid en speelt geen noten. Het laat de aangevinkte parameters van aangesloten apparaten langzaam rond hun knopstand bewegen; de knop blijft de basis.')));
        ui = { lanes: [] }; col = null;
        if (typeof ResizeObserver !== 'undefined') ro = new ResizeObserver(es => { es.forEach(en => { const L = en.target.__lane; if (L) { L.w = en.contentRect.width; L.h = en.contentRect.height; } }); });
        buildTop(dm); ui.targets = E('div'); ui.targets.style.cssText = 'display:grid;gap:12px'; dm.appendChild(ui.targets);
        ensureId(); paintAll();
        if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        stopLoop(); stopDraw = tekenLus(host, self, draw, 16);
      },
      unmount() { stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); ui = null; },
      // contract v1.3 — de host vertelt wie deze Drift stuurt en wie hem volgt
      onModTargets(targets) {
        ensureId();
        me.targets = (targets || []).filter(T => T && Array.isArray(T.params) && T.params.length).map(T => ({ id: T.id, name: T.name, params: T.params }));
        me.followers = (targets || []).filter(T => T && T.def === ID).map(T => ({ id: T.id, name: T.name }));
        paintAll();
      },
      params() { return MODP.map(([id, name, min, max, log, role, drift, on]) => ({ id, name: tx(name), lane: 'drift', laneName: 'Drift', min, max, role, scale: log ? 'log' : 'lin', drift, on })); },
      modulate(offsets) { for (const k in mod) delete mod[k]; for (const k in offsets || {}) if (MODBY[k] && Number.isFinite(+offsets[k])) mod[k] = clamp(+offsets[k], -1, 1); },
      onModSources(sources) {
        ensureId();
        const m = (sources || []).find(s => s.port === 'volg' && s.def === ID && s.id !== me.id);
        me.masterId = m ? m.id : null; me.masterName = m ? m.name : '';
        paintAll();
      },
      getState() { const c = clockOf(me);
        return { group: me.S.group, follow: me.S.follow, eigen: me.S.eigen, ownSeed: me.S.ownSeed,
          clock: { t: Math.round(c.t * 1000) / 1000, speed: c.speed, amount: c.amount, coh: c.coh, seed: c.seed, frozen: !!c.frozen },
          sel: JSON.parse(JSON.stringify(me.S.sel)), salt: { ...me.S.salt }, freeze: { ...me.S.freeze } }; },
      setState(s) { s = s && typeof s === 'object' ? s : {}; const d = defClock(), k = s.clock && typeof s.clock === 'object' ? s.clock : {};
        const num = (v, a, b, def) => typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : def;
        Object.assign(me.own, { t: num(k.t, 0, 1e9, 0), speed: num(k.speed, 0.25, 32, d.speed), amount: num(k.amount, 0, 1, d.amount), coh: num(k.coh, 0, 1, d.coh),
          seed: Number.isInteger(k.seed) ? k.seed : d.seed, frozen: !!k.frozen, wall: null });
        me.S.follow = ['gelijk', 'gespiegeld', 'verschoven'].includes(s.follow) ? s.follow : 'gelijk';
        me.S.eigen = num(s.eigen, 0, 1, 0); me.S.ownSeed = Number.isInteger(s.ownSeed) ? s.ownSeed : me.S.ownSeed;
        me.S.sel = {}; if (s.sel && typeof s.sel === 'object') Object.entries(s.sel).forEach(([tid, ps]) => { if (!ps || typeof ps !== 'object') return; me.S.sel[tid] = {};
          Object.entries(ps).forEach(([pid, x]) => { if (x && typeof x === 'object') me.S.sel[tid][pid] = { on: !!x.on, range: num(x.range, 0, 0.5, 0.1) }; }); });
        me.S.salt = {}; if (s.salt && typeof s.salt === 'object') Object.entries(s.salt).forEach(([a, b]) => { if (Number.isInteger(b)) me.S.salt[a] = b; });
        me.S.freeze = {}; if (s.freeze && typeof s.freeze === 'object') Object.entries(s.freeze).forEach(([a, b]) => { if (typeof b === 'number' && isFinite(b)) me.S.freeze[a] = clamp(b, 0, 1e9); });
        const g = ['A', 'B', 'C', 'D'].includes(s.group) ? s.group : ''; if (g !== me.S.group) { me.S.group = g; if (!GROUPS.has(g) && g) GROUPS.set(g, { ...me.own, wall: null }); dropEmptyGroups(); }
        if (g && !isSlave()) Object.assign(clockOf(me), me.own);
        paintAll(); tick(); },
      // Een preset verandert de wind (tempo, sterkte, samenhang, zaad), maar behoudt de koppelingen met doelen en de lopende positie.
      getPreset() { const s = self.getState(); return { eigen: s.eigen, ownSeed: s.ownSeed,
        clock: { speed: s.clock.speed, amount: s.clock.amount, coh: s.clock.coh, seed: s.clock.seed, frozen: s.clock.frozen } }; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState();
        const k = p.clock && typeof p.clock === 'object' ? p.clock : {};
        self.setState({ ...p, group: s.group, follow: s.follow, sel: s.sel, salt: s.salt, freeze: s.freeze,
          clock: { speed: k.speed, amount: k.amount, coh: k.coh, seed: k.seed, frozen: k.frozen, t: s.clock.t } }); },
      destroy() { if (dead) return; dead = true; clearInterval(timer); stopLoop(); if (ro) { ro.disconnect(); ro = null; } if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); me.targets.forEach(T => host.modulate(self, T.id, {})); if (me.id) INST.delete(me.id); dropEmptyGroups(); }
    };
    return self;
  }
};
