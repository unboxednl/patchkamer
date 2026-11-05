// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Swell en nieuwe id nl.patchkamer.swell (voorheen Deining, nl.patchkamer.deining); werkruimtes en presets uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang, poortnaam per taal in i18n). Tekenen via host.frame met een ResizeObserver en een kleurcache. De regelaars krijgen een beginwaarde (dubbelklik).
//          Elke uitgestuurde waarde is eindig (NaN en Infinity worden nul), het tempo wordt begrensd, setState negeert onbekende velden en kapt getallen af; de beweging zelf is gelijk aan 1.8.0.
// Swell: een modulator. Hij maakt geen geluid en stuurt geen onhoorbare tonen uit. Vier samenhangende, trage banen
//   (Breath, Warmth, Space, Sway) laten de aangevinkte parameters van aangesloten apparaten rustig meebewegen, zoals een deining.
//   Een sfeerprofiel (Calm, Cosy, Closeness, Euphoria) zet de golflengte en de verhoudingen; de golf loopt in seconden of op de maat van de klok.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fin = v => (Number.isFinite(v) ? v : 0);

// Teksten per taal (host.lang): de Nederlandse tekst is de sleutel, Engels staat hieronder; onbekende taal = Engels
const EN = {
  'Rust': 'Calm', 'Geborgenheid': 'Cosy', 'Nabijheid': 'Closeness', 'Euforie': 'Euphoria',
  'Adem': 'Breath', 'Warmte': 'Warmth', 'Ruimte': 'Space', 'Zweving': 'Sway',
  'Samenhangende beweging voor warme, rustige en open klankvelden.': 'Coherent movement for warm, calm and open soundscapes.',
  'Sfeer': 'Mood', 'Aan': 'On', 'Volg Start/Stop': 'Follow Start/Stop', 'Op tempo': 'Tempo sync', 'Tempoverdeling': 'Length in beats', '{0} tellen': '{0} beats',
  'De vier modulatiebanen': 'The four modulation lanes',
  'Ademgolf': 'Breath cycle', 'Hoeveelheid': 'Amount', 'Beweging': 'Motion', 'Variatie': 'Variation',
  'Alles neutraal': 'All neutral', 'Voorzichtig voorstel': 'Gentle suggestion',
  'Doelen · vink parameters aan en kies de beweging. Bereik is een deel van het volledige parameterbereik; negatief keert de richting om.': 'Targets · tick parameters and pick the movement. Range is a share of the full parameter range; negative reverses the direction.',
  'Verbind Swell met een paarse kabel aan een synth of effect. Voorzichtige voorstellen verschijnen hier automatisch.': 'Connect Swell with a purple cable to a synth or effect. Gentle suggestions appear here automatically.',
  '{0} beweging': '{0} movement', '{0} bereik': '{0} range',
  'Beweegt': 'Moving', 'Neutraal': 'Neutral', '{0} tellen bij {1} BPM': '{0} beats at {1} BPM', '{0} s per ademgolf': '{0} s per breath cycle', '{0} doel(en)': '{0} target(s)',
};

const PROFILES = {
  rust: { name: 'Rust', period: 22, depth: .38, warmth: .62, space: .45, motion: .22, human: .12 },
  geborgen: { name: 'Geborgenheid', period: 14, depth: .48, warmth: .8, space: .32, motion: .28, human: .18 },
  nabij: { name: 'Nabijheid', period: 10, depth: .42, warmth: .72, space: .24, motion: .4, human: .24 },
  euforie: { name: 'Euforie', period: 8, depth: .58, warmth: .62, space: .55, motion: .62, human: .24 }
};
const DEF = () => ({ profile: 'rust', on: true, follow: false, sync: false, beats: 32, period: 22, depth: .38, warmth: .62, space: .45, motion: .22, human: .12, routes: {} });
const LANES = [['breath', 'Adem'], ['warmth', 'Warmte'], ['space', 'Ruimte'], ['sway', 'Zweving']];
const BEATS = [4, 8, 16, 32, 64, 128];
const KNOBS = [
  ['period', 'Ademgolf', 4, 120, .1, v => v.toFixed(1) + ' s'],
  ['depth', 'Hoeveelheid', 0, 1, .01, v => Math.round(v * 100) + '%'],
  ['warmth', 'Warmte', 0, 1, .01, v => Math.round(v * 100) + '%'],
  ['space', 'Ruimte', 0, 1, .01, v => Math.round(v * 100) + '%'],
  ['motion', 'Beweging', 0, 1, .01, v => Math.round(v * 100) + '%'],
  ['human', 'Variatie', 0, 1, .01, v => Math.round(v * 100) + '%']
];

function normalize(raw) {
  const d = DEF(); raw = raw && typeof raw === 'object' ? raw : {};
  for (const k of ['on', 'follow', 'sync']) if (typeof raw[k] === 'boolean') d[k] = raw[k];
  d.profile = Object.hasOwn(PROFILES, raw.profile) ? raw.profile : d.profile;
  for (const k of ['depth', 'warmth', 'space', 'motion', 'human']) if (typeof raw[k] === 'number' && Number.isFinite(raw[k])) d[k] = clamp(raw[k], 0, 1);
  if (typeof raw.period === 'number' && Number.isFinite(raw.period)) d.period = clamp(raw.period, 4, 120);
  d.beats = BEATS.includes(raw.beats) ? raw.beats : d.beats;
  if (raw.routes && typeof raw.routes === 'object' && !Array.isArray(raw.routes)) {
    d.routes = Object.fromEntries(Object.entries(raw.routes).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v)).map(([target, map]) => [target, Object.fromEntries(Object.entries(map).filter(([, v]) => v && typeof v === 'object').map(([id, r]) => [id, { on: r.on === true, lane: LANES.some(([k]) => r.lane === k) ? r.lane : 'breath', amount: typeof r.amount === 'number' && Number.isFinite(r.amount) ? clamp(r.amount, -.2, .2) : 0 }]))]));
  }
  return d;
}
function suggested(p) {
  const id = String(p.id).toLowerCase();
  if (['cutoff', 'tone', 'color', 'brightness'].includes(id)) return { on: true, lane: 'warmth', amount: id === 'cutoff' ? -.035 : -.065 };
  if (['wet', 'space', 'dsend', 'chorusmix', 'ensemble'].includes(id)) return { on: true, lane: 'space', amount: .04 };
  if (id === 'expression') return { on: true, lane: 'breath', amount: .055 };
  if (['lvl', 'level'].includes(id)) return { on: true, lane: 'breath', amount: .012 };
  if (id === 'pan') return { on: true, lane: 'sway', amount: .025 };
  return { on: false, lane: 'breath', amount: .02 };
}
// Vier gecorreleerde banen, zonder sprongen of willekeur per update.
function waves(phase, s) {
  const t = phase * 2 * Math.PI;
  const drift = Math.sin(t * .371 + 1.3) * .6 + Math.sin(t * .173 + 2.7) * .4;
  const breath = .82 * Math.sin(t) + .18 * Math.sin(2 * t - .4);
  return {
    breath: breath * (1 - s.human * .12) + drift * s.human * .12,
    warmth: (s.warmth - .5) * 1.15 + Math.sin(t * .317 + .8) * (.24 + s.motion * .22) + drift * s.human * .1,
    space: (s.space - .5) * 1.15 + Math.sin(t * .613 - 1.1) * (.22 + s.motion * .25) + drift * s.human * .08,
    sway: (Math.sin(t * .733 + 1.8) * .78 + Math.sin(t * 1.271) * .22) * s.motion
  };
}

const CSS = `
:host{display:block;min-width:0;color:var(--fg);font:12px var(--mono,monospace)}*{box-sizing:border-box}.app{display:grid;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
h2{font:700 25px var(--disp,sans-serif);letter-spacing:.12em;margin:0}.hint,.status{color:var(--muted);font-size:11px;line-height:1.5}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:7px}
label.control{display:grid;gap:6px;padding:8px;background:var(--card-2);border:1px solid var(--line);border-radius:5px}.label{display:flex;justify-content:space-between;gap:8px}output{color:var(--mod,var(--audio));font-size:10px}
select,button{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:4px;padding:5px;min-width:0;max-width:100%}button{cursor:pointer}input{accent-color:var(--mod,var(--audio))}input[type=range]{width:100%;min-width:0}label.switch{display:flex;gap:5px;align-items:center}
.screen{height:140px;position:relative;overflow:hidden;min-width:0;background:var(--well);border-radius:6px}canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
details{padding:8px;background:var(--card-2);border:1px solid var(--line);border-radius:5px;margin-bottom:6px}summary{cursor:pointer;font-weight:bold;margin-bottom:6px}.route{display:grid;grid-template-columns:minmax(80px,1fr) 90px minmax(70px,1fr) 45px;gap:7px;align-items:center;min-height:30px}.route label{display:flex;gap:5px;min-width:0}.route label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:500px){.route{grid-template-columns:minmax(75px,1fr) 75px minmax(60px,1fr) 40px}}
`;

// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id: 'nl.patchkamer.swell', name: 'Swell', version: '1.11.0', kind: 'modulator', category: 'mod', ui: { width: 640, minWidth: 300 },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [], modIn: [], modOut: [{ id: 'mod', name: 'Swell' }], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host && host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let state = DEF(), targets = [], dead = false, playing = false, bpm = Number.isFinite(host.bpm) ? host.bpm : 120;
    let phase = 0, last = ctx.currentTime, shell = null, shadow = null, routeBox = null, status = null, canvas = null, pen = null, ro = null, stopDraw = null, controls = [];
    let cw = 0, ch = 0, col = null, colT = 0, lastStatus = '';
    const smoothed = {}, trace = { breath: 0, warmth: 0, space: 0, sway: 0 };
    function clear(id) { host.modulate(self, id, {}); delete smoothed[id]; }
    function update() {
      if (dead) return; const now = ctx.currentTime, delta = Math.max(0, now - last); last = now;
      const active = state.on && (!state.follow || playing);
      const period = state.sync ? state.beats * 60 / Math.max(20, bpm) : state.period;
      if (active) phase += delta / period;
      if (!Number.isFinite(phase)) phase = 0;
      const w = waves(phase, state); for (const key of Object.keys(trace)) trace[key] = clamp(fin(w[key] * state.depth), -1, 1);
      const alpha = 1 - Math.exp(-Math.min(delta, .5) / .32);
      for (const target of targets) {
        if (!active) { clear(target.id); continue; }
        const values = {}, previous = smoothed[target.id] || (smoothed[target.id] = {}), route = state.routes[target.id] || {};
        for (const p of target.params) {
          const r = route[p.id]; if (!r || !r.on) continue;
          const wanted = clamp(trace[r.lane] * r.amount, -1, 1); previous[p.id] = fin((previous[p.id] || 0) + (wanted - (previous[p.id] || 0)) * alpha); values[p.id] = previous[p.id];
        }
        // Verwijder ook slewenveloppen voor uitgezette/verwijderde parameters.
        for (const id of Object.keys(previous)) if (!(id in values)) delete previous[id];
        host.modulate(self, target.id, values);
      }
      if (status) {
        const s = tx(active ? 'Beweegt' : 'Neutraal') + ' · ' + (state.sync ? tx('{0} tellen bij {1} BPM', state.beats, Math.round(bpm)) : tx('{0} s per ademgolf', state.period.toFixed(1))) + ' · ' + tx('{0} doel(en)', targets.length);
        if (s !== lastStatus) { lastStatus = s; status.textContent = s; }
      }
    }
    function ensureRoutes() { for (const t of targets) { if (!Object.hasOwn(state.routes, t.id)) state.routes[t.id] = {}; for (const p of t.params) if (!Object.hasOwn(state.routes[t.id], p.id)) state.routes[t.id][p.id] = suggested(p); } }
    function syncUI() { for (const c of controls) { if (c.check) c.el.checked = state[c.key]; else c.el.value = String(state[c.key]); if (c.output) c.output.textContent = c.format(state[c.key]); } update(); }
    function drawRoutes() {
      if (!routeBox) return; routeBox.replaceChildren();
      if (!targets.length) { const e = document.createElement('p'); e.textContent = tx('Verbind Swell met een paarse kabel aan een synth of effect. Voorzichtige voorstellen verschijnen hier automatisch.'); routeBox.appendChild(e); return; }
      for (const target of targets) {
        const group = document.createElement('details'); group.open = true; routeBox.appendChild(group); const title = document.createElement('summary'); title.textContent = target.name || target.id; group.appendChild(title);
        for (const p of target.params) {
          const route = state.routes[target.id][p.id], row = document.createElement('div'); row.className = 'route'; group.appendChild(row);
          const label = document.createElement('label'), on = document.createElement('input'); on.type = 'checkbox'; on.checked = route.on; label.appendChild(on); const name = document.createElement('span'); name.textContent = p.name || p.id; label.appendChild(name); row.appendChild(label);
          const select = document.createElement('select'); select.setAttribute('aria-label', tx('{0} beweging', p.name || p.id)); for (const [k, title] of LANES) { const o = document.createElement('option'); o.value = k; o.textContent = tx(title); select.appendChild(o); } select.value = route.lane; row.appendChild(select);
          const amount = document.createElement('input'); amount.type = 'range'; amount.min = -.2; amount.max = .2; amount.step = .001; amount.value = route.amount; amount.dataset.pkDefault = String(suggested(p).amount); amount.setAttribute('aria-label', tx('{0} bereik', p.name || p.id)); row.appendChild(amount);
          const value = document.createElement('output'); value.textContent = (route.amount * 100).toFixed(1) + '%'; row.appendChild(value);
          on.onchange = () => { route.on = on.checked; update(); }; select.onchange = () => { route.lane = select.value; update(); }; amount.oninput = () => { route.amount = Number(amount.value); value.textContent = (route.amount * 100).toFixed(1) + '%'; update(); };
        }
      }
    }
    function unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } if (ro) ro.disconnect(); ro = null; if (typeof window.removeEventListener === 'function') window.removeEventListener('patchkamer-skin', onSkin); if (shell) shell.remove(); shell = shadow = routeBox = status = canvas = pen = null; controls = []; lastStatus = ''; }
    const onSkin = () => { col = null; };
    function readColors() { const css = getComputedStyle(shell), v = k => css.getPropertyValue(k).trim(); colT = performance.now(); col = { well: v('--well') || 'Canvas', lanes: ['--audio', '--event', '--mod', '--fg'].map(k => v(k) || 'CanvasText') }; }
    function draw() {
      if (dead || !canvas || !cw || !ch) return;
      if (!col || performance.now() - colT > 1000) readColors();
      const d = Math.min(2, globalThis.devicePixelRatio || 1), w = cw, h = ch;
      if (canvas.width !== Math.max(1, Math.round(w * d)) || canvas.height !== Math.max(1, Math.round(h * d))) { canvas.width = Math.max(1, Math.round(w * d)); canvas.height = Math.max(1, Math.round(h * d)); }
      pen.setTransform(d, 0, 0, d, 0, 0); pen.fillStyle = col.well; pen.fillRect(0, 0, w, h); pen.font = '10px monospace';
      LANES.forEach(([key, name], index) => {
        const color = col.lanes[index]; pen.strokeStyle = color; pen.fillStyle = color; pen.globalAlpha = .7; pen.beginPath();
        for (let x = 0; x < w; x++) { const value = waves(phase + x / Math.max(1, w) * 1.8, state)[key] * state.depth * (state.on && (!state.follow || playing) ? 1 : 0), y = h * (.15 + index * .235) - value * h * .085; if (x) pen.lineTo(x, y); else pen.moveTo(x, y); }
        pen.stroke(); pen.globalAlpha = 1; pen.fillText(tx(name), 7, 12 + index * h * .235);
      });
    }
    const self = {
      inputs: {}, outputs: {},
      mount(el) {
        if (dead) return; unmount(); shell = document.createElement('div'); el.appendChild(shell); shadow = shell.attachShadow({ mode: 'open' });
        const style = document.createElement('style'); style.textContent = CSS; shadow.appendChild(style);
        function make(tag, text, parent, cls) { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
        const D = DEF();
        const app = make('div', null, shadow, 'app'); make('h2', 'SWELL', app); make('div', tx('Samenhangende beweging voor warme, rustige en open klankvelden.'), app, 'hint');
        const top = make('div', null, app, 'row'), profile = make('select', null, top); profile.setAttribute('aria-label', tx('Sfeer'));
        for (const [k, p] of Object.entries(PROFILES)) { const o = make('option', tx(p.name), profile); o.value = k; }
        profile.onchange = () => { const key = profile.value, p = PROFILES[key]; for (const k of ['period', 'depth', 'warmth', 'space', 'motion', 'human']) state[k] = p[k]; state.profile = key; syncUI(); }; controls.push({ el: profile, key: 'profile' });
        function check(key, title) { const label = make('label', null, top, 'switch'), i = make('input', null, label); i.type = 'checkbox'; make('span', tx(title), label); i.onchange = () => { state[key] = i.checked; syncUI(); }; controls.push({ el: i, key, check: true }); }
        check('on', 'Aan'); check('follow', 'Volg Start/Stop'); check('sync', 'Op tempo');
        const beats = make('select', null, top); beats.setAttribute('aria-label', tx('Tempoverdeling')); for (const n of BEATS) { const o = make('option', tx('{0} tellen', n), beats); o.value = String(n); } beats.onchange = () => { state.beats = Number(beats.value); syncUI(); }; controls.push({ el: beats, key: 'beats' });
        const screen = make('div', null, app, 'screen'); canvas = make('canvas', null, screen); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', tx('De vier modulatiebanen')); pen = canvas.getContext('2d');
        cw = screen.clientWidth; ch = screen.clientHeight; col = null;
        if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const r = es[0] && es[0].contentRect; if (r) { cw = r.width; ch = r.height; } }); ro.observe(screen); }
        if (typeof window.addEventListener === 'function') window.addEventListener('patchkamer-skin', onSkin);
        stopDraw = tekenLus(host, self, draw, 30);
        const grid = make('div', null, app, 'controls');
        for (const [key, name, min, max, step, format] of KNOBS) {
          const label = make('label', null, grid, 'control'), head = make('div', null, label, 'label'); make('span', tx(name), head); const output = make('output', null, head), input = make('input', null, label);
          input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = D[key]; input.dataset.pkDefault = String(D[key]); input.setAttribute('aria-label', tx(name)); input.oninput = () => { state[key] = Number(input.value); syncUI(); }; controls.push({ el: input, key, output, format });
        }
        const action = make('div', null, app, 'row'), neutral = make('button', tx('Alles neutraal'), action); neutral.type = 'button'; neutral.onclick = () => { state.on = false; syncUI(); };
        const recommend = make('button', tx('Voorzichtig voorstel'), action); recommend.type = 'button'; recommend.onclick = () => { for (const t of targets) { state.routes[t.id] = {}; for (const p of t.params) state.routes[t.id][p.id] = suggested(p); } drawRoutes(); update(); };
        make('div', tx('Doelen · vink parameters aan en kies de beweging. Bereik is een deel van het volledige parameterbereik; negatief keert de richting om.'), app, 'hint'); routeBox = make('div', null, app); status = make('div', null, app, 'status'); shadow.addEventListener('pointerdown', e => e.stopPropagation()); drawRoutes(); syncUI();
      },
      unmount,
      onModTargets(list) {
        if (dead) return;
        const next = Array.isArray(list) ? list.filter(t => t && typeof t.id === 'string').map(t => ({ id: t.id, name: typeof t.name === 'string' ? t.name : t.id, params: Array.isArray(t.params) ? t.params.filter(p => p && typeof p.id === 'string' && Number.isFinite(p.min) && Number.isFinite(p.max) && p.max > p.min) : [] })) : [];
        for (const old of targets) if (!next.some(t => t.id === old.id)) clear(old.id); targets = next; ensureRoutes(); drawRoutes(); update();
      },
      onStep(info) { if (dead || !info) return; if (Number.isFinite(info.bpm) && info.bpm > 0) bpm = clamp(info.bpm, 1, 1000); if (!playing) playing = true; update(); },
      onTransport(info) { if (dead) return; playing = !!(info && info.playing); last = ctx.currentTime; update(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { if (dead) return; state = normalize(s); ensureRoutes(); drawRoutes(); syncUI(); },
      // Een preset bevat de beweging zelf; de koppelingen met doelen (routes) horen er niet in.
      getPreset() { const s = self.getState(); delete s.routes; return s; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), routes: state.routes }); },
      destroy() { if (dead) return; for (const t of targets) clear(t.id); dead = true; clearInterval(timer); unmount(); targets = []; }
    };
    const timer = setInterval(update, 40); return self;
  }
};
