// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.20.0 — Regelaars herkenbaar voor skins (host.ui.adopt, id = state-sleutel, rol param of select, groep `pattern`/`row`), zodat een skin ze als draaiknop kan tonen; zonder skin ongewijzigd.
// 1.19.0 — Uitleg naar about (menu Over Step Sequencer); de UI toont geen uitlegtekst meer.
// 1.18.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in het definitieveld about.
// 1.17.0 — Patchkamer contract v1.17: klembord voor patronen. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, tijd in tikken van 12 per zestiende). Zonder drumcomputer aan de uitgang is het patroon een `notes`-clip, met een drumcomputer (`noteNames`) een `drums`-clip met de klanken als banen. Plakken zet alleen het patroon (`n`, `acc`, `vel`, `ln`, `mt`, `len`, `res`); swing, humanize, octaaf, gate en werkstand blijven. Het apparaat is mono: per rasterstap blijft de hardste noot. Een clip uit hetzelfde apparaat komt via `native` verliesvrij terug. Verder niets gewijzigd: `getState`, presets, geluid en bestaande songs zijn gelijk aan 1.14.1.
// 1.14.1 — Swing per rij en inspelen tegen het geswingde raster. Nieuw: `rowSwing` (nootnummer → 0 … 0,5 zestiende, standaard leeg): vertraagt de noten van die rij op de oneven zestienden, bovenop de swing van de host en de bestaande patroon-`swing` (die ongewijzigd blijft werken: elke tweede rasterstap, in rasterstappen); samen hoogstens 0,5 zestiende voor het rijdeel. Inspelen met de klok kwantiseert naar het dichtstbijzijnde GESWINGDE rasterpunt (hostswing, patroonswing en rijswing), zet bij Kwantiseren uit de afwijking als microtiming tegen dat punt, neemt de lengte van een noot met `dur` over (vanaf 2 rasterstappen) en negeert aanslagen die buiten de geplande stappen vallen. De rol toont de volledige klankenlijst van een drumcomputer (tot 64 rijen; de rol wordt hoger in plaats van de lijst af te kappen). Met `rowSwing` leeg speelt alles als voorheen.
// 1.14.0 — Patchkamer contract v1.14. Hangt er via de notenkabel een apparaat met noteNames() (een drumcomputer) aan, dan is elke rij van de rol een klank in de volgorde van dat apparaat, met de naam erbij; noten die het apparaat niet kent blijven zichtbaar met een vraagteken. Zonder lijst blijft het de gewone pianorol. Geen wijziging in klank of state.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Step Sequencer (id nl.patchkamer.seq blijft gelijk, eigen map in sequencers; voorheen Sequencer, 16 stappen).
//   Uitgebreid tot een volwaardige stap-sequencer: patroonlengte 1–64 stappen, raster 1/16, 1/32 of 1/64, per stap noot, velocity, lengte en
//   microtiming, accent, swing en humanize (vast zaad), pianorol met velocity-strook, live spelen (doorgeven) en inspelen met een toetsenbord
//   op de nieuwe notenpoort, stap-voor-stap invoer als de klok stilstaat. De state van het oude bestand (n, acc, gate, oct) laadt en klinkt
//   identiek: dezelfde noten, velocity, tijden en duren. Bewust anders: noten buiten 12 … 108 worden niet meer op 36 … 72 afgekapt.
//   Tweetalig (host.lang, poortnamen per taal in i18n), kleuren uit de CSS-variabelen van de host, tekenen via host.frame.
const EN = {
  'STEP SEQUENCER · stap-sequencer': 'STEP SEQUENCER · step sequencer',
  'Raster': 'Grid', 'Lengte': 'Length', 'Octaaf': 'Octave', 'Humanize tijd': 'Humanize time', 'Humanize velocity': 'Humanize velocity',
  'Opnemen': 'Record', 'Kwantiseren': 'Quantize', 'Doorgeven': 'Thru', 'Aan': 'On', 'Uit': 'Off',
  'Wis': 'Clear', 'Dubbel': 'Double', 'Pagina {0}': 'Page {0}', 'Hoger': 'Up', 'Lager': 'Down',
  'Rij': 'Row', 'Rij-swing': 'Row swing',
  'Stap {0}': 'Step {0}', 'Noten in': 'Notes in', 'Noten': 'Notes',
  'Patroon van {0} stappen': 'Pattern of {0} steps', 'Geen geldige clip.': 'Not a valid clip.', 'Het apparaat is verwijderd.': 'The device has been removed.',
  'De soort past niet: dit apparaat neemt nu {0}.': 'Wrong kind: this device now takes {0}.', 'noten': 'notes', 'drums': 'drums'
};
const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const MAXN = 64, LO = 12, HI = 108, ROWS = 25, LANEMAX = 64;
export default {
  id: 'nl.patchkamer.seq', name: 'Step Sequencer', version: '1.20.0', about: { nl: 'Stap-sequencer: één patroon van stappen dat noten naar een synth, drone of drumcomputer stuurt.\n\nStuurt note-gebeurtenissen; verbind de oranje uitgang met een synth. Klik in de rol voor een noot, sleep de rechterrand voor de lengte, klik of sleep in de strook voor de velocity.\n\nSluit een toetsenbord (Keys) aan op de ingang: dat gaat meteen door naar de uitgang. Met Opnemen aan schrijft het de noten in het patroon (tijdens de klok op de plek van de aanslag, anders stap voor stap).\n\nSwing per rij vertraagt de noten van één rij (een klank van de drumcomputer) op de oneven zestienden; Swing vertraagt het hele patroon. Beide komen bovenop de swing van de host. Inspelen kwantiseert naar het geswingde raster; per stap past één noot (een nieuwe noot vervangt de oude).', en: 'Step sequencer: one pattern of steps that sends notes to a synth, drone or drum machine.\n\nSends note events; connect the orange output to a synth. Click in the roll to place a note, drag its right edge for the length, click or drag in the strip for the velocity.\n\nConnect a keyboard (Keys) to the input: it goes straight through to the output. With Record on it writes the notes into the pattern (on the beat position while the clock runs, otherwise step by step).\n\nRow swing delays the notes of one row (one sound of the drum machine) on the odd sixteenths; Swing delays the whole pattern. Both come on top of the host swing. Recording quantizes to the swung grid; a step holds one note (a new note replaces the old one).' }, category: 'sequencer', kind: 'utility', ui: { width: 880, minWidth: 380 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'in', name: 'Notes in' }], eventOut: [{ id: 'notes', name: 'Notes' }] },
  i18n: { nl: { ports: { in: 'Noten in', notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    const defN = () => { const base = [45, -1, 45, 48, -1, 45, 52, -1, 45, -1, 43, 45, -1, 48, -1, 52]; return Array.from({ length: MAXN }, (_, i) => i < 16 ? base[i] : -1); };
    const defAcc = () => { const base = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0]; return Array.from({ length: MAXN }, (_, i) => i < 16 ? base[i] : 0); };
    const zeros = () => new Array(MAXN).fill(0);
    const DEF = () => ({ n: defN(), acc: defAcc(), vel: zeros(), ln: zeros(), mt: zeros(), gate: 0.6, oct: 0, len: 16, res: 16, swing: 0, rowSwing: {}, humT: 0, humV: 0, seed: 1, quant: true, thru: true, rec: false, view: 36, cur: 0 });
    const PRESET_SKIP = ['rec', 'view', 'cur'];  // werkstand, geen klank
    let state = DEF(), dead = false, mountHost = null, shadow = null, canvas = null, g2 = null, cw = 600, stopFrame = null, ro = null, colors = null, colorAge = 0;
    let skinOn = false, dirty = true, playPos = -1, lastPlayDrawn = -2, page = 0, ticks = [], localBar = 0, prevStep = -1, playing = null, lastTickT = -1, heldThru = new Set(), pending = new Map(), self, recBtn, drag = null, labels = {};
    const resOf = () => state.res / 16;
    const gridDur = sd => sd / resOf();
    const stepDurOf = info => Number.isFinite(info?.stepDur) && info.stepDur > 0 ? info.stepDur : Number.isFinite(info?.bpm) && info.bpm > 0 ? 15 / info.bpm : typeof host.stepDur === 'function' && Number.isFinite(host.stepDur()) && host.stepDur() > 0 ? host.stepDur() : 0;
    // rowSwing: nootnummer (als tekst) → 0 … 0,5 zestiende; alleen waarden boven 0 blijven bewaard
    const cleanRowSwing = x => { const o = {}; if (!x || typeof x !== 'object' || Array.isArray(x)) return o; for (const k of Object.keys(x).slice(0, 256)) { const n = Number(k); if (!Number.isInteger(n) || n < 0 || n > 127) continue; const v = finite(x[k], 0, 0, 0.5); if (v > 0) o[String(n)] = v; } return o; };
    const rowSwingOf = m => { const v = state.rowSwing && state.rowSwing[String(m)]; return typeof v === 'number' && Number.isFinite(v) ? clamp(v, 0, 0.5) : 0; };
    // het rijdeel van de swing (in zestienden) voor een noot op een rasterstap: hoogstens 0,5 samen met wat de patroonswing er al aan toevoegt
    const rowPart = (m, legacyFrac) => Math.min(rowSwingOf(m), Math.max(0, 0.5 - legacyFrac));
    const hash = a => { a = Math.imul((a | 0) ^ ((a | 0) >>> 16), 0x7feb352d); a = Math.imul(a ^ (a >>> 15), 0x846ca68b); return (((a ^ (a >>> 16)) >>> 0) / 4294967296) * 2 - 1; };
    const effVel = i => state.vel[i] > 0 ? state.vel[i] : (state.acc[i] ? 1 : 0.7);
    const autoView = () => { let lo = 999, hi = -1; for (let i = 0; i < state.len; i++) if (state.n[i] >= 0) { lo = Math.min(lo, state.n[i]); hi = Math.max(hi, state.n[i]); } return lo > hi ? 36 : clamp(Math.round((lo + hi) / 2) - 12, 0, 127 - (ROWS - 1)); };
    function emit(port, e) { if (!dead && Number.isFinite(e?.time)) host.emit(self, port, e); }
    function releaseThru(t = ctx.currentTime) { for (const note of heldThru) emit('notes', { type: 'noteoff', note, vel: 0, time: t }); heldThru.clear(); pending.clear(); }
    const cleanType = e => String(e?.type || '').toLowerCase().replace(/[_-]/g, '');

    // ---- spelen ---------------------------------------------------------------------------------------------------------------------------
    self = {
      inputs: {}, outputs: {},
      onStep(info) {
        try {
          if (dead || !Number.isFinite(info?.time) || !Number.isInteger(info.step) || info.step < 0) return;
          const sd = stepDurOf(info); if (!sd) return;
          if (info.step < prevStep) localBar++; prevStep = info.step;
          const bar = Number.isInteger(info.bar) && info.bar >= 0 ? info.bar : localBar;
          const res = resOf(), gd = gridDur(sd), abs16 = bar * 16 + info.step;
          playing = true;
          for (let k = 0; k < res; k++) {
            const gi = abs16 * res + k, pos = gi % state.len, tBase = info.time + k * gd;
            ticks.push({ t: tBase, pos, gOdd: !!(gi & 1), odd16: !!(info.step & 1), gd, sd }); if (k === 0) playPos = pos;
            const m = state.n[pos]; if (!(m >= 0)) continue;
            let t = tBase, vel = effVel(pos);
            if (state.mt[pos]) t += state.mt[pos] * gd;
            if (state.swing && (gi & 1)) t += state.swing * gd;
            if ((info.step & 1) && state.rowSwing) { const rp = rowPart(m, state.swing && (gi & 1) ? state.swing * gd / sd : 0); if (rp) t += rp * sd; }
            if (state.humT) t += hash(gi * 2 + state.seed * 131) * state.humT * 0.5 * gd;
            if (state.humV) vel += hash(gi * 2 + 1 + state.seed * 977) * state.humV * 0.3;
            if (state.humT) t = Math.max(t, info.time - 0.5 * gd);
            const dur = gd * (state.ln[pos] > 0 ? state.ln[pos] : state.gate), note = Math.round(clamp(m + 12 * state.oct, 0, 127));
            if (!Number.isFinite(t) || !(dur > 0) || !Number.isFinite(dur)) continue;
            emit('notes', { type: 'note', note, vel: clamp(vel, 0.02, 1), time: t, dur });
          }
          lastTickT = info.time; if (ticks.length > 600) ticks.splice(0, ticks.length - 400);
          dirty = true;
        } catch (e) {}
      },
      onPeers(list) { if (!dead) readTarget(list); },
      onTransport(info) {
        if (dead) return; playing = !!info?.playing; ticks = []; localBar = 0; prevStep = -1; lastTickT = -1;
        if (!playing) { playPos = -1; dirty = true; }
      },
      onEvent(port, e) {
        try {
          if (dead || port !== 'in' || !e || typeof e !== 'object') return;
          const type = cleanType(e), t = Number.isFinite(e.time) ? e.time : ctx.currentTime;
          if (type === 'note' || type === 'noteon') {
            if (!Number.isFinite(e.note)) return;
            const note = Math.round(clamp(e.note, 0, 127)), vel = Number.isFinite(e.vel) ? clamp(e.vel, 0, 1) : 0.8, held = e.held === true;
            const realDur = Number.isFinite(e.dur) && e.dur > 0 ? e.dur : 0, dur = realDur || 0.25;
            if (state.thru) { emit('notes', { type: 'note', note, vel, time: t, dur, ...(held ? { held: true } : {}) }); if (held) heldThru.add(note); }
            if (state.rec) record(note, vel, t, held, realDur);
          } else if (type === 'noteoff') {
            if (!Number.isFinite(e.note)) return; const note = Math.round(clamp(e.note, 0, 127));
            if (state.thru && heldThru.delete(note)) emit('notes', { type: 'noteoff', note, vel: 0, time: t });
            const p = pending.get(note);
            if (p) { pending.delete(note); const gd = p.gd; if (gd > 0) { const l = Math.round((t - p.t) / gd); state.ln[p.pos] = clamp(l, 1, MAXN); dirty = true; } }
          } else if (type === 'allnotesoff' || type === 'panic') {
            if (state.thru) { emit('notes', { type: 'allnotesoff', time: t }); heldThru.clear(); } pending.clear();
          } else if (type === 'cc' && state.thru && typeof e.id === 'string' && Number.isFinite(e.value)) {
            emit('notes', { type: 'cc', id: e.id.slice(0, 40), value: clamp(e.value, 0, 1), time: t });
          }
        } catch (err) {}
      },
      getState() { return JSON.parse(JSON.stringify(state)); },
      getPreset() { const p = self.getState(); for (const k of PRESET_SKIP) delete p[k]; return p; },
      setPreset(p) { if (dead) return; const keep = {}; for (const k of ['rec', 'cur']) keep[k] = state[k]; self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      setState(raw) {
        if (dead) return; releaseThru(); const s = raw && typeof raw === 'object' ? raw : {}, d = DEF();
        const arr = (v, def, f) => Array.from({ length: MAXN }, (_, i) => Array.isArray(v) ? f(v[i], def[i]) : def[i]);
        const next = DEF();
        next.n = arr(s.n, d.n, (x, df) => typeof x === 'number' && Number.isFinite(x) ? (x < 0 ? -1 : Math.round(clamp(x, LO, HI))) : df);
        next.acc = arr(s.acc, d.acc, (x, df) => x != null ? (x ? 1 : 0) : df);
        next.vel = arr(s.vel, d.vel, (x, df) => typeof x === 'number' && Number.isFinite(x) ? (x <= 0 ? 0 : clamp(x, 0.05, 1)) : df);
        next.ln = arr(s.ln, d.ln, (x, df) => typeof x === 'number' && Number.isFinite(x) ? (x <= 0 ? 0 : clamp(x, 0.1, MAXN)) : df);
        next.mt = arr(s.mt, d.mt, (x, df) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, -0.5, 0.5) : df);
        next.gate = finite(s.gate, d.gate, 0.1, 1); next.oct = [-1, 0, 1].includes(+s.oct) && s.oct != null ? +s.oct : d.oct;
        next.len = Math.round(finite(s.len, 16, 1, MAXN)); next.res = [16, 32, 64].includes(s.res) ? s.res : 16;
        next.swing = finite(s.swing, 0, 0, 0.6); next.rowSwing = cleanRowSwing(s.rowSwing); next.humT = finite(s.humT, 0, 0, 1); next.humV = finite(s.humV, 0, 0, 1);
        next.seed = Math.round(finite(s.seed, 1, 0, 65535)); next.quant = typeof s.quant === 'boolean' ? s.quant : true; next.thru = typeof s.thru === 'boolean' ? s.thru : true;
        next.rec = typeof s.rec === 'boolean' ? s.rec : false;
        state = next; state.view = Number.isFinite(s.view) ? Math.round(clamp(s.view, 0, 127 - (ROWS - 1))) : autoView();
        state.cur = Math.round(finite(s.cur, 0, 0, state.len - 1)); page = 0; dirty = true;
        if (mountHost) render(mountHost);
      },
      // ---- klembord (contract v1.17): patroon kopiëren en plakken ----
      clipInfo() { return clipInfo(); },
      getClip() { return getClip(); },
      setClip(clip) { return setClip(clip); },
      mount(el) { render(el); },
      unmount() { teardown(); },
      destroy() { if (dead) return; releaseThru(); dead = true; teardown(); }
    };
    // ---- klembord (contract v1.17) ----------------------------------------------------------------------------------------------------------
    // Formaat `patchkamer-clip` (formatVersion 1): tijd in tikken, 12 per zestiende, dus 192 per maat. Een rasterstap is 192 / res tikken (12, 6 of 3).
    // Zonder drumcomputer aan de uitgang is het patroon een `notes`-clip, met een drumcomputer (noteNames) een `drums`-clip met de klanken als banen.
    // Plakken zet alleen het patroon: `n`, `acc`, `vel`, `ln`, `mt`, `len` en `res`. Swing, humanize, octaaf, gate en de werkstand blijven staan.
    const CLIP_ID = 'nl.patchkamer.seq', MAXEV = 4096, MAXTICKS = 12288, GRIDS = [16, 32, 64];
    const cellTicks = res => 192 / res;
    const foldNote = n => { n = Math.round(n); while (n < LO) n += 12; while (n > HI) n -= 12; return n; };
    const kindNow = () => (buildLanes() ? 'drums' : 'notes');
    // het patroon (zonder de werkstand) als eenvoudig object; ook voor een vergelijking vóór en na
    const patternOf = () => ({ len: state.len, res: state.res, n: state.n.slice(), acc: state.acc.slice(), vel: state.vel.slice(), ln: state.ln.slice(), mt: state.mt.slice(), gate: state.gate });
    // gebeurtenissen van een patroon in tikken; de toonhoogte staat zoals opgeslagen (zonder `oct`)
    function eventsOf(p) {
      const ct = cellTicks(p.res), length = p.len * ct, out = [];
      for (let i = 0; i < p.len; i++) {
        const m = p.n[i]; if (!(m >= 0)) continue;
        const t = clamp(Math.round((i + p.mt[i]) * ct), 0, length - 1);
        // een noot die over het einde van het patroon loopt, wordt in de clip bij het einde afgekapt (zoals het formaat voorschrijft)
        out.push({ t, note: m, len: Math.max(1, Math.min(length - t, Math.round((p.ln[i] > 0 ? p.ln[i] : p.gate) * ct))), vel: p.vel[i] > 0 ? p.vel[i] : (p.acc[i] ? 1 : 0.7), acc: !!p.acc[i] });
      }
      return out;
    }
    // Is `inc` (wat er binnenkomt) nog dezelfde clip als `ref` (het eigen patroon dat in `native` zat)? Gelijke lengte en aantal, gelijke noten, snelheid en accent;
    // de tijd (en bij `notes` de lengte) mag hoogstens `tol` tikken verschillen, want de host zet de tijden op het rasterpunt van het doel en kapt noten bij het einde af.
    function sameClip(ref, refLength, inc, incLength, drums, tol) {
      if (ref.length !== inc.length || refLength !== incLength) return false;
      const key = (a, b) => a.note - b.note || a.t - b.t || a.vel - b.vel, A = ref.slice().sort(key), B = inc.slice().sort(key);
      return A.every((a, i) => { const b = B[i]; return a.note === b.note && Math.abs(a.t - b.t) <= tol && Math.abs(a.vel - b.vel) < 1e-6 && a.acc === b.acc && (drums || Math.abs(a.len - b.len) <= tol); });
    }
    // het patroon uit `native.data` van dit apparaat, op dezelfde manier gezuiverd als setState; null bij onzin
    function cleanPattern(d) {
      if (!d || typeof d !== 'object') return null;
      const res = GRIDS.includes(d.res) ? d.res : 16, len = Math.round(finite(d.len, 0, 0, MAXN)); if (len < 1) return null;
      const arr = (v, def, f) => Array.from({ length: MAXN }, (_, i) => Array.isArray(v) ? f(v[i], def) : def);
      const num = x => typeof x === 'number' && Number.isFinite(x);
      return {
        len, res, gate: state.gate,
        n: arr(d.n, -1, (x, df) => num(x) ? (x < 0 ? -1 : Math.round(clamp(x, LO, HI))) : df),
        acc: arr(d.acc, 0, (x, df) => x != null ? (x ? 1 : 0) : df),
        vel: arr(d.vel, 0, (x, df) => num(x) ? (x <= 0 ? 0 : clamp(x, 0.05, 1)) : df),
        ln: arr(d.ln, 0, (x, df) => num(x) ? (x <= 0 ? 0 : clamp(x, 0.1, MAXN)) : df),
        mt: arr(d.mt, 0, (x, df) => num(x) ? clamp(x, -0.5, 0.5) : df)
      };
    }
    function clipInfo() {
      try {
        if (dead) return null;
        readTarget(); const ln = buildLanes(), kind = ln ? 'drums' : 'notes';
        const info = { name: tx('Patroon van {0} stappen', state.len), copy: [kind], paste: [kind], length: { min: 3, max: 64 * 12, step: 3, current: state.len * cellTicks(state.res), shared: false }, grid: [16, 32, 64], poly: 1, range: [LO, HI], scheme: ln ? 'device' : 'gm', vel: 'continuous', prob: false, ratchet: false, maxEvents: MAXN };
        if (ln) info.lanes = ln.filter(l => l.named).map(l => ({ id: 'n' + l.note, name: l.name.slice(0, 40), type: '', note: l.note }));
        return info;
      } catch (e) { return null; }
    }
    function getClip() {
      try {
        if (dead) return null;
        readTarget(); const p = patternOf(), ln = buildLanes(), evs = eventsOf(p), ct = cellTicks(p.res), length = p.len * ct;
        const clip = { format: 'patchkamer-clip', formatVersion: 1, kind: ln ? 'drums' : 'notes', name: tx('Patroon van {0} stappen', p.len), length, grid: p.res, source: { device: CLIP_ID, name: 'Step Sequencer', version: '1.17.0', scheme: ln ? 'device' : 'gm' } };
        const sw = Math.min(0.5, state.swing * 16 / p.res); if (sw > 0) clip.swing = sw;
        if (ln) {
          clip.lanes = ln.map(l => ({ id: 'n' + l.note, name: l.name.slice(0, 40), type: '', note: l.note }));
          clip.hits = []; for (const e of evs) { const j = ln.findIndex(l => l.note === e.note); if (j < 0) continue; const h = { t: e.t, lane: j, vel: e.vel }; if (e.acc) h.acc = true; clip.hits.push(h); }
        } else clip.notes = evs.map(e => { const o = { t: e.t, n: e.note, len: e.len, vel: e.vel }; if (e.acc) o.acc = true; return o; });
        clip.native = { device: CLIP_ID, data: { len: p.len, res: p.res, n: p.n, acc: p.acc, vel: p.vel, ln: p.ln, mt: p.mt } };
        return JSON.parse(JSON.stringify(clip));
      } catch (e) { return null; }
    }
    // leest een clip uit onbetrouwbare invoer: { kind, length, hint, evs:[{t,note,len,vel,acc}], native } of { err }
    function parseClip(clip) {
      const bad = { err: tx('Geen geldige clip.') };
      if (!clip || typeof clip !== 'object' || Array.isArray(clip) || clip.format !== 'patchkamer-clip' || (clip.formatVersion !== undefined && clip.formatVersion !== 1)) return bad;
      const want = kindNow(); if (clip.kind !== want) return { err: tx('De soort past niet: dit apparaat neemt nu {0}.', tx(want === 'drums' ? 'drums' : 'noten')) };
      if (typeof clip.length !== 'number' || !Number.isFinite(clip.length)) return bad;
      const length = Math.round(clamp(clip.length, 1, MAXTICKS)), evs = [], num = x => typeof x === 'number' && Number.isFinite(x);
      let seen = 0;
      if (want === 'notes') {
        const src = Array.isArray(clip.notes) ? clip.notes : []; seen = src.length;
        for (const x of src.slice(0, MAXEV)) { if (!x || typeof x !== 'object' || !num(x.t) || !num(x.n)) continue; evs.push({ t: Math.round(clamp(x.t, 0, length - 1)), note: foldNote(clamp(x.n, 0, 127)), len: Math.round(finite(x.len, 12, 1, MAXTICKS)), vel: finite(x.vel, 0.8, 0.01, 1), acc: x.acc === true }); }
      } else {
        const lanes = Array.isArray(clip.lanes) ? clip.lanes.slice(0, 64) : [], src = Array.isArray(clip.hits) ? clip.hits : []; seen = src.length;
        for (const x of src.slice(0, MAXEV)) { if (!x || typeof x !== 'object' || !num(x.t) || !Number.isInteger(x.lane) || x.lane < 0 || x.lane >= lanes.length) continue; const l = lanes[x.lane]; if (!l || typeof l !== 'object' || !num(l.note)) continue; evs.push({ t: Math.round(clamp(x.t, 0, length - 1)), note: foldNote(clamp(l.note, 0, 127)), len: 0, vel: finite(x.vel, 0.8, 0.01, 1), acc: x.acc === true }); }
      }
      const nat = clip.native && typeof clip.native === 'object' && clip.native.device === CLIP_ID ? clip.native.data : null;
      return { kind: want, length, hint: GRIDS.includes(clip.grid) ? clip.grid : 16, evs, native: nat, cut: Math.max(0, seen - MAXEV) };
    }
    // zet de gebeurtenissen op rasterstappen (hoogstens één per stap: de hardste wint); noten precies tussen twee stappen kiezen een vrije buur
    function placeEvents(evs, L, ct) {
      const best = new Map(); let dropped = 0;
      const put = (cell, e) => { const o = best.get(cell); if (o) { dropped++; if (e.vel <= o.vel) return; } best.set(cell, e); };
      const half = [];
      for (const e of evs) {
        if (e.t >= L * ct) { dropped++; continue; }
        if ((e.t * 2) % (2 * ct) === ct) half.push(e); else put(Math.min(L - 1, Math.round(e.t / ct)), e);
      }
      for (const e of half) { const lo = Math.min(L - 1, Math.floor(e.t / ct)), hi = Math.min(L - 1, lo + 1); put(best.has(lo) && !best.has(hi) ? hi : lo, e); }
      return { best, dropped };
    }
    // kies het raster: bij voorkeur het gevraagde, anders het dichtstbijzijnde waarop alles precies past
    function pickRes(hint, length, evs) {
      const cand = GRIDS.map(res => { const ct = cellTicks(res); return { res, ct, fits: Math.ceil(length / ct) <= MAXN, aligned: evs.every(e => e.t % ct === 0) }; });
      const near = c => Math.abs(Math.log2(c.res / hint));
      const ok = cand.filter(c => c.fits && c.aligned);
      if (ok.length) return ok.reduce((b, c) => near(c) < near(b) ? c : b);
      // niets past precies: het raster waarbij de minste noten wegvallen en de afrondingen het kleinst zijn
      const fit = cand.filter(c => c.fits); if (!fit.length) return cand[0];
      for (const c of fit) { c.lost = placeEvents(evs, Math.ceil(length / c.ct), c.ct).dropped; c.err = 0; for (const e of evs) c.err += Math.abs(e.t / c.ct - Math.round(e.t / c.ct)) * c.ct; }
      return fit.reduce((b, c) => c.lost < b.lost || (c.lost === b.lost && (c.err < b.err - 1e-9 || (Math.abs(c.err - b.err) <= 1e-9 && near(c) < near(b)))) ? c : b);
    }
    function setClip(clip) {
      try {
        if (dead) return { ok: false, reason: tx('Het apparaat is verwijderd.') };
        readTarget(); const c = parseClip(clip); if (c.err) return { ok: false, reason: c.err };
        let pat = null, dropped = c.cut;
        // een clip uit dit apparaat die niet is aangepast: het eigen patroon komt exact terug
        const nat = cleanPattern(c.native);
        if (nat && sameClip(eventsOf(nat), nat.len * cellTicks(nat.res), c.evs, c.length, c.kind === 'drums', Math.floor(cellTicks(c.hint) / 2))) pat = nat;
        if (!pat) {
          const r = pickRes(c.hint, c.length, c.evs), ct = r.ct, L = clamp(Math.ceil(c.length / ct), 1, MAXN);
          pat = { len: L, res: r.res, n: new Array(MAXN).fill(-1), acc: zeros(), vel: zeros(), ln: zeros(), mt: zeros() };
          const pl = placeEvents(c.evs, L, ct), best = pl.best; dropped += pl.dropped;
          for (const [cell, e] of best) {
            pat.n[cell] = e.note; pat.mt[cell] = clamp((e.t - cell * ct) / ct, -0.5, 0.5) + 0;
            pat.acc[cell] = e.acc ? 1 : 0;
            pat.vel[cell] = e.acc && e.vel >= 0.999 ? 0 : (!e.acc && Math.abs(e.vel - 0.7) < 1e-9 ? 0 : clamp(e.vel, 0.05, 1));
            // c.kind === 'drums': geen lengte in de clip, dan geldt de gate
            pat.ln[cell] = c.kind === 'drums' || Math.round(state.gate * ct) === e.len ? 0 : clamp(e.len / ct, 0.1, MAXN);
          }
        }
        const before = JSON.stringify(patternOf());
        for (const k of ['n', 'acc', 'vel', 'ln', 'mt']) state[k] = pat[k].slice();
        state.len = pat.len; state.res = pat.res;
        if (JSON.stringify(patternOf()) === before) return { ok: true, ...(dropped ? { dropped } : {}) };
        state.cur = Math.min(state.cur, state.len - 1); page = Math.min(page, pages() - 1);
        if (!buildLanes()) { let out = false; for (let i = 0; i < state.len; i++) { const m = state.n[i]; if (m >= 0 && (m < state.view || m > state.view + ROWS - 1)) out = true; } if (out) state.view = autoView(); }
        dirty = true; if (mountHost) render(mountHost);
        return { ok: true, ...(dropped ? { dropped } : {}) };
      } catch (e) { return { ok: false, reason: tx('Geen geldige clip.') }; }
    }

    // Inspelen: met de klok loopt de aanslag naar het dichtstbijzijnde GESWINGDE rasterpunt (host-, patroon- en rijswing), zoals de noot straks ook echt klinkt.
    // Kwantiseren uit: de noot staat op dat punt met de afwijking als microtiming (± een halve rasterstap). Zonder klok schrijft het stap voor stap vanaf de cursor.
    function record(note, vel, t, held, realDur) {
      if (!Number.isFinite(t) || !Number.isFinite(vel)) return;
      const live = playing === true && lastTickT >= 0 && ctx.currentTime - lastTickT < 1.5 && ticks.length;
      let pos, gd, mt = 0;
      const stored = Math.round(clamp(clamp(note, LO, HI) - 12 * state.oct, LO, HI));
      if (live) {
        let best = null, bd = Infinity;
        for (const k of ticks) {
          const lf = state.swing && k.gOdd ? state.swing * k.gd / k.sd : 0, ct = k.t + (state.swing && k.gOdd ? state.swing * k.gd : 0) + (k.odd16 ? rowPart(stored, lf) * k.sd : 0), d = Math.abs(ct - t);
          if (d < bd) { bd = d; best = { k, ct }; }
        }
        if (!best || bd > best.k.sd) return; // buiten de geplande stappen: niet gokken
        pos = best.k.pos; gd = best.k.gd;
        mt = state.quant ? 0 : clamp((t - best.ct) / gd, -0.5, 0.5);
      } else { pos = state.cur; gd = Number.isFinite(host.stepDur?.()) ? host.stepDur() / resOf() : 0; state.cur = (state.cur + 1) % state.len; }
      state.mt[pos] = mt; state.n[pos] = stored; state.vel[pos] = Math.max(0.05, vel); state.acc[pos] = 0; state.ln[pos] = 0;
      if (!held && realDur > 0 && gd > 0) { const l = Math.round(realDur / gd); if (l >= 2) state.ln[pos] = clamp(l, 1, MAXN); }
      if (held && gd > 0) pending.set(note, { pos, t, gd });
      dirty = true;
    }

    // ---- bediening ------------------------------------------------------------------------------------------------------------------------
    const noteName = m => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
    function shift(fn) { fn(); dirty = true; }
    const adopt = (el, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    function select(parent, label, options, value, change, id, group) { const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select'); for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); } el.value = String(value); el.onchange = () => change(el.value); if (id) adopt(el, id, 'select', group || 'pattern', label); return el; }
    function knob(parent, label, bounds, value, change, format, def, id, group) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.dataset.pkDefault = String(def);
      if (id) adopt(input, id, 'param', group || 'pattern', label); input.addEventListener('pointerdown', e => e.stopPropagation()); input.oninput = () => { const n = Number(input.value); out.textContent = format(n); change(n); }; return input;
    }
    const button = (parent, label, fn, title) => { const b = add(parent, 'button', label); b.type = 'button'; b.onclick = fn; if (title) b.title = title; return b; };
    function toggle(parent, label, key, after) { const b = button(parent, label, () => { state[key] = !state[key]; b.classList.toggle('active', state[key]); if (after) after(); }); b.classList.toggle('active', state[key]); b.setAttribute('aria-pressed', String(state[key])); return b; }
    function teardown() { if (skinOn && window.removeEventListener) window.removeEventListener('patchkamer-skin', onSkin); skinOn = false; if (stopFrame) { stopFrame(); stopFrame = null; } if (ro) { ro.disconnect(); ro = null; } if (mountHost) mountHost.innerHTML = ''; mountHost = null; shadow = null; canvas = null; g2 = null; }
    const pages = () => Math.max(1, Math.ceil(state.len / 32));
    const cols = () => Math.min(32, state.len);

    function render(el) {
      teardown(); mountHost = el; const wrap = add(el, 'div'); shadow = wrap.attachShadow({ mode: 'open' });
      add(shadow, 'style', `:host{display:block;color:var(--fg);font:13px system-ui,sans-serif}.app{container-type:inline-size;background:var(--card);border-radius:10px;padding:14px;box-sizing:border-box}.row{display:flex;gap:8px;align-items:stretch;flex-wrap:wrap;margin:8px 0}.control{display:flex;flex-direction:column;gap:4px;padding:6px 8px;border:1px solid var(--line);border-radius:7px;min-width:0;flex:1 1 90px}select{width:100%}.control span{font-size:11px;color:var(--muted)}button,select,input{font:inherit;color:var(--field-fg);background:var(--field);border:1px solid var(--line);border-radius:5px;padding:6px 8px;max-width:100%;box-sizing:border-box}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--sel)}button.active{background:color-mix(in srgb,var(--event) 40%,var(--field));border-color:var(--event)}button.rec.active{background:color-mix(in srgb,var(--stop) 55%,var(--field));border-color:var(--stop)}input[type=range]{width:100%;padding:0;accent-color:var(--event)}output{font:12px monospace;color:var(--fg)}canvas{display:block;width:100%;border-radius:6px;touch-action:none;cursor:crosshair}`);
      const panel = add(shadow, 'div'); panel.className = 'app';
      const r1 = add(panel, 'div'); r1.className = 'row';
      select(r1, tx('Raster'), [[16, '1/16'], [32, '1/32'], [64, '1/64']], state.res, v => { state.res = +v; dirty = true; }, 'res');
      knob(r1, tx('Lengte'), [1, MAXN, 1], state.len, v => { state.len = v; state.cur = Math.min(state.cur, v - 1); page = Math.min(page, pages() - 1); dirty = true; syncPager(); }, v => String(v), 16, 'len');
      select(r1, tx('Octaaf'), [[-1, '−1'], [0, '0'], [1, '+1']], state.oct, v => { state.oct = +v; }, 'oct');
      knob(r1, 'Gate', [0.1, 1, 0.01], state.gate, v => { state.gate = v; dirty = true; }, v => Math.round(v * 100) + '%', 0.6, 'gate');
      knob(r1, 'Swing', [0, 0.6, 0.01], state.swing, v => state.swing = v, v => Math.round(v * 100) + '%', 0, 'swing');
      knob(r1, tx('Humanize tijd'), [0, 1, 0.01], state.humT, v => state.humT = v, v => Math.round(v * 100) + '%', 0, 'humT');
      knob(r1, tx('Humanize velocity'), [0, 1, 0.01], state.humV, v => state.humV = v, v => Math.round(v * 100) + '%', 0, 'humV');
      const rsBox = add(panel, 'div'); rsBox.className = 'row'; labels.rs = rsBox; lastLaneSig = null; syncRowSwing();
      const r2 = add(panel, 'div'); r2.className = 'row';
      recBtn = toggle(r2, '● ' + tx('Opnemen'), 'rec'); recBtn.classList.add('rec');
      toggle(r2, tx('Kwantiseren'), 'quant'); toggle(r2, tx('Doorgeven'), 'thru', () => { if (!state.thru) releaseThru(); });
      button(r2, '◀', () => shift(() => rotate(-1))); button(r2, '▶', () => shift(() => rotate(1)));
      button(r2, '−1', () => shift(() => transpose(-1))); button(r2, '+1', () => shift(() => transpose(1)));
      button(r2, '−12', () => shift(() => transpose(-12))); button(r2, '+12', () => shift(() => transpose(12)));
      button(r2, tx('Dubbel'), () => shift(() => { if (state.len * 2 <= MAXN) { for (const a of [state.n, state.acc, state.vel, state.ln, state.mt]) for (let i = 0; i < state.len; i++) a[state.len + i] = a[i]; state.len *= 2; render(el); } }));
      button(r2, tx('Wis'), () => shift(() => { state.n.fill(-1); for (const a of [state.acc, state.vel, state.ln, state.mt]) a.fill(0); }));
      const pager = add(r2, 'span', undefined, 'display:flex;gap:6px;align-items:center'); pager.className = 'pager';
      const up = button(r2, '↑ ' + tx('Hoger'), () => { state.view = clamp(state.view + 12, 0, 127 - (ROWS - 1)); dirty = true; syncRowSwing(); });
      const down = button(r2, '↓ ' + tx('Lager'), () => { state.view = clamp(state.view - 12, 0, 127 - (ROWS - 1)); dirty = true; syncRowSwing(); }); void up; void down;
      labels.pager = pager; syncPager();
      canvas = add(panel, 'canvas'); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', tx('STEP SEQUENCER · stap-sequencer'));
      canvas.style.height = H + 'px'; g2 = canvas.getContext('2d'); resize(canvas.getBoundingClientRect().width || 600);
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w) resize(w); }); ro.observe(canvas); }
      if (typeof window !== 'undefined' && window.addEventListener) { window.addEventListener('patchkamer-skin', onSkin); skinOn = true; }
      canvas.addEventListener('pointerdown', pdown); canvas.addEventListener('pointermove', pmove); canvas.addEventListener('pointerup', pup); canvas.addEventListener('pointercancel', pup);
      readTarget(); dirty = true; stopFrame = typeof host.frame === 'function' ? host.frame(self, draw, 30) : null;
    }
    function setRowSwing(m, v) { if (v > 0) state.rowSwing[String(m)] = clamp(v, 0, 0.5); else delete state.rowSwing[String(m)]; }
    // rij en rij-swing: de rijen van de drumcomputer, anders de toonhoogten in beeld
    function syncRowSwing() {
      const box = labels.rs; if (!box || !box.isConnected && !shadow) return; box.textContent = '';
      const opts = lanes ? lanes.map(l => [l.note, l.name]) : Array.from({ length: ROWS }, (_, r) => { const m = state.view + (ROWS - 1) - r; return [m, noteName(m)]; });
      if (!opts.some(o => o[0] === rsel)) rsel = opts[0][0];
      select(box, tx('Rij'), opts, rsel, v => { rsel = +v; syncRowSwing(); }, 'row', 'row');
      knob(box, tx('Rij-swing'), [0, 0.5, 0.01], rowSwingOf(rsel), v => setRowSwing(rsel, v), v => Math.round(v * 100) + '%', 0, 'rowSwing', 'row');
    }
    function syncPager() {
      const p = labels.pager; if (!p) return; p.textContent = '';
      if (pages() > 1) for (let i = 0; i < pages(); i++) { const b = button(p, tx('Pagina {0}', i + 1), () => { page = i; dirty = true; for (const c of p.children) c.classList.remove('active'); b.classList.add('active'); }); if (i === page) b.classList.add('active'); }
    }
    function rotate(d) { const L = state.len; for (const a of [state.n, state.acc, state.vel, state.ln, state.mt]) { const c = a.slice(0, L); for (let i = 0; i < L; i++) a[(i + d + L) % L] = c[i]; } }
    function transpose(d) { for (let i = 0; i < state.len; i++) if (state.n[i] >= 0) state.n[i] = Math.round(clamp(state.n[i] + d, LO, HI)); state.view = clamp(state.view + (Math.abs(d) >= 12 ? d : 0), 0, 127 - (ROWS - 1)); }

    // ---- tekenen --------------------------------------------------------------------------------------------------------------------------
    let ROWH = 11, ACCH = 14, STRIPH = 60, RULERH = 14, ROLLH = ROWS * ROWH, H = ROLLH + ACCH + STRIPH + RULERH;
    // de rol groeit mee met de lijst klanken (tot 64 rijen van elk ROWH); met 25 rijen of minder blijft hij zoals hij was
    function setRoll(n) { const r = Math.max(ROWS, n) * ROWH; if (r === ROLLH) return; ROLLH = r; H = ROLLH + ACCH + STRIPH + RULERH; if (canvas) { canvas.style.height = H + 'px'; resize(cw); } }
    let LABW = 32;
    // Rijen volgen de drumcomputer (contract v1.14): hangt er via de notenkabel een apparaat met noteNames() aan, dan is elke rij een klank, in de volgorde van dat apparaat.
    // Noten in het patroon die het apparaat niet kent, blijven zichtbaar als rij met alleen het nootnummer. Zonder lijst is het de gewone pianorol.
    const LANE_LABW = 92;
    let peerNames = [], namesSig = '', lanes = null, lastLaneSig = null, rsel = null;
    function readTarget(list) {
      let names = [];
      try {
        const cs = typeof host.cablesFrom === 'function' ? host.cablesFrom(self, 'notes') : [], ps = Array.isArray(list) ? list : (typeof host.peers === 'function' ? host.peers(self) : []);
        for (const k of cs) { const p = k && ps.find(x => x && x.id === k.to); if (p && Array.isArray(p.noteNames) && p.noteNames.length) { names = p.noteNames; break; } }
      } catch (e) { names = []; }
      const sig = JSON.stringify(names); if (sig !== namesSig) { namesSig = sig; peerNames = names; dirty = true; }
    }
    // de rijen van de drumcomputer (zie boven), of null zonder lijst klanken
    function buildLanes() {
      if (!peerNames.length) return null;
      const seen = new Set(), rows = [];
      for (const x of peerNames) { const n = Math.round(x.note); if (rows.length >= LANEMAX || seen.has(n) || !(n >= 0 && n <= 127)) continue; seen.add(n); rows.push({ note: n, name: String(x.name), named: true }); }
      const extra = new Set(); for (let i = 0; i < state.len; i++) { const m = state.n[i]; if (m >= 0 && !seen.has(m)) extra.add(m); }
      for (const m of [...extra].sort((a, b) => a - b)) if (rows.length < LANEMAX) rows.push({ note: m, name: noteName(m), named: false });
      return rows;
    }
    function refreshRows() {
      const rows = buildLanes();
      if (!rows) { lanes = null; LABW = 32; setRoll(ROWS); if (lastLaneSig !== '') { lastLaneSig = ''; syncRowSwing(); } return; }
      lanes = rows; LABW = LANE_LABW; setRoll(rows.length);
      const sig = rows.map(r => r.note).join(','); if (sig !== lastLaneSig) { lastLaneSig = sig; syncRowSwing(); }
    }
    const rowH = () => lanes ? ROLLH / lanes.length : ROWH;
    const noteOfRow = r => lanes ? lanes[clamp(r, 0, lanes.length - 1)].note : clamp(state.view + (ROWS - 1) - r, LO, HI);
    const rowOfNote = m => lanes ? lanes.findIndex(x => x.note === m) : state.view + (ROWS - 1) - m;
    function resize(w) { cw = Math.max(200, w); if (!canvas) return; const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1); canvas.width = Math.round(cw * dpr); canvas.height = Math.round(H * dpr); g2.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true; }
    function readColors() {
      const cs = getComputedStyle(canvas), v = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
      colors = { card: v('--card', '#142129'), well: v('--well', '#0d171c'), fg: v('--fg', '#e4edef'), muted: v('--muted', '#aabec5'), line: v('--line', '#344953'), note: v('--event', '#e8a64b'), acc: v('--stop', '#ff8a6b'), sel: v('--sel', '#8de4d3'), alt: v('--audio', '#91e0d4') };
    }
    const onSkin = () => { colors = null; dirty = true; };
    const stepW = () => (cw - LABW) / cols();
    function draw() {
      if (!g2 || !canvas) return;
      if (!colors || ++colorAge > 60) { colorAge = 0; readColors(); dirty = true; }
      if (!dirty && lastPlayDrawn === playPos) return; dirty = false; lastPlayDrawn = playPos; refreshRows();
      const c = colors, sw = stepW(), nc = cols(), p0 = page * 32, W = cw;
      g2.clearRect(0, 0, W, H); g2.fillStyle = c.well; g2.fillRect(0, 0, W, H);
      g2.font = '9px system-ui,sans-serif'; g2.textBaseline = 'middle';
      const rh = rowH();
      if (lanes) {
        g2.font = (rh < 14 ? 10 : 11) + 'px system-ui,sans-serif';
        lanes.forEach((ln, r) => {
          const y = r * rh; if (r % 2) { g2.fillStyle = c.card; g2.globalAlpha = 0.55; g2.fillRect(LABW, y, W - LABW, rh); g2.globalAlpha = 1; }
          g2.fillStyle = ln.named ? c.fg : c.muted; g2.textAlign = 'right'; g2.fillText(ln.named ? ln.name : ln.name + ' ?', LABW - 4, y + rh / 2, LABW - 6);
          g2.strokeStyle = c.line; g2.globalAlpha = 0.6; g2.beginPath(); g2.moveTo(0, y + rh); g2.lineTo(W, y + rh); g2.stroke(); g2.globalAlpha = 1;
        });
        g2.font = '9px system-ui,sans-serif';
      } else for (let r = 0; r < ROWS; r++) {
        const m = state.view + (ROWS - 1) - r, y = r * ROWH, black = [1, 3, 6, 8, 10].includes(m % 12);
        if (black) { g2.fillStyle = c.card; g2.globalAlpha = 0.55; g2.fillRect(LABW, y, W - LABW, ROWH); g2.globalAlpha = 1; }
        if (m % 12 === 0 || r === 0) { g2.fillStyle = c.muted; g2.textAlign = 'right'; g2.fillText(noteName(m), LABW - 3, y + ROWH / 2); g2.strokeStyle = c.line; g2.globalAlpha = 0.6; g2.beginPath(); g2.moveTo(LABW, y + ROWH); g2.lineTo(W, y + ROWH); g2.stroke(); g2.globalAlpha = 1; }
      }
      const beat = 4 * resOf(), bar = 16 * resOf();
      for (let i = 0; i <= nc; i++) { const idx = p0 + i, x = LABW + i * sw; if (idx > state.len) break; g2.strokeStyle = c.line; g2.globalAlpha = idx % bar === 0 ? 1 : idx % beat === 0 ? 0.65 : 0.25; g2.beginPath(); g2.moveTo(x, 0); g2.lineTo(x, ROLLH + ACCH + STRIPH); g2.stroke(); }
      g2.globalAlpha = 1;
      for (let i = 0; i < nc; i++) {
        const idx = p0 + i; if (idx >= state.len) break; const m = state.n[idx], x = LABW + i * sw;
        if (idx % beat === 0) { g2.fillStyle = c.muted; g2.textAlign = 'left'; g2.fillText(String(idx + 1), x + 2, ROLLH + ACCH + STRIPH + RULERH / 2); }
        if (m < 0) continue;
        const v = effVel(idx), L = state.ln[idx] > 0 ? state.ln[idx] : state.gate, bw = Math.max(3, Math.min(L * sw, W - x) - 1);
        const r = rowOfNote(m), nr = lanes ? lanes.length : ROWS, inView = r >= 0 && r < nr, rr = clamp(r, 0, nr - 1), bh = lanes ? rh * (0.35 + 0.55 * v) : ROWH * (0.3 + 1.1 * v), cy = rr * rh + rh / 2;
        g2.fillStyle = state.acc[idx] ? c.acc : c.note; g2.globalAlpha = inView ? 1 : 0.4; g2.fillRect(x + 0.5, cy - bh / 2, bw, bh); g2.globalAlpha = 1;
        if (state.ln[idx] > 0 || bw > 8) { g2.fillStyle = c.fg; g2.globalAlpha = 0.5; g2.fillRect(x + bw - 2, cy - bh / 2, 2, bh); g2.globalAlpha = 1; }
        if (state.acc[idx]) { g2.fillStyle = c.acc; g2.fillRect(x + 1, ROLLH + 3, Math.max(3, sw - 3), ACCH - 6); }
        g2.fillStyle = state.acc[idx] ? c.acc : c.alt; g2.fillRect(x + 1, ROLLH + ACCH + STRIPH * (1 - v), Math.max(2, sw - 3), STRIPH * v);
      }
      if (state.rec && playing !== true) { const i = state.cur - p0; if (i >= 0 && i < nc) { g2.strokeStyle = c.sel; g2.lineWidth = 2; g2.strokeRect(LABW + i * sw + 1, 1, sw - 2, ROLLH + ACCH + STRIPH - 2); g2.lineWidth = 1; } }
      const pi = playPos - p0; if (playPos >= 0 && pi >= 0 && pi < nc) { g2.fillStyle = c.sel; g2.globalAlpha = 0.25; g2.fillRect(LABW + pi * sw, 0, sw, ROLLH + ACCH + STRIPH); g2.globalAlpha = 1; }
    }
    // ---- muis / aanraking -----------------------------------------------------------------------------------------------------------------
    function where(e) { const rc = canvas.getBoundingClientRect(), x = (e.clientX - rc.left) * (cw / (rc.width || cw)), y = e.clientY - rc.top; return { x, y, col: Math.floor((x - LABW) / stepW()) + page * 32 }; }
    function pdown(e) {
      if (dead || !canvas) return; const { x, y, col } = where(e); if (col < 0 || col >= state.len) return; canvas.setPointerCapture?.(e.pointerId);
      const sw = stepW();
      if (y < ROLLH) {
        refreshRows(); const pitch = noteOfRow(Math.floor(y / rowH()));
        for (let s = Math.max(0, col - 32); s <= col; s++) { // rechterrand van een blok: lengte
          if (state.n[s] !== pitch) continue; const L = state.ln[s] > 0 ? state.ln[s] : state.gate, x0 = LABW + (s - page * 32) * sw, x1 = x0 + L * sw;
          if (x >= x1 - 8 && x <= x1 + 1 && s + L >= col) { drag = { mode: 'len', s }; return; }
        }
        if (state.n[col] === pitch) { drag = { mode: 'erase' }; state.n[col] = -1; state.ln[col] = 0; state.vel[col] = 0; state.acc[col] = 0; state.mt[col] = 0; }
        else { drag = { mode: 'paint', pitch }; place(col, pitch); }
      } else if (y < ROLLH + ACCH) { drag = { mode: 'acc' }; if (state.n[col] >= 0) { state.acc[col] = state.acc[col] ? 0 : 1; state.vel[col] = 0; } }
      else if (y < ROLLH + ACCH + STRIPH) { drag = { mode: 'vel' }; setVel(col, y); }
      else { state.cur = col; drag = null; }
      dirty = true;
    }
    function place(col, pitch) { if (state.n[col] < 0) { state.vel[col] = 0; state.ln[col] = 0; state.acc[col] = 0; state.mt[col] = 0; } state.n[col] = pitch; }
    function setVel(col, y) { if (state.n[col] < 0) return; state.vel[col] = Math.round(clamp(1 - (y - ROLLH - ACCH) / STRIPH, 0.05, 1) * 100) / 100; state.acc[col] = 0; }
    function pmove(e) {
      if (!drag || dead) return; const { x, y, col } = where(e); const sw = stepW();
      if (drag.mode === 'len') { const x0 = LABW + (drag.s - page * 32) * sw; state.ln[drag.s] = clamp(Math.floor((x - x0) / sw) + 1, 1, MAXN); }
      else if (col >= 0 && col < state.len) {
        if (drag.mode === 'paint' && y < ROLLH) { drag.pitch = noteOfRow(Math.floor(y / rowH())); place(col, drag.pitch); }
        else if (drag.mode === 'erase' && y < ROLLH) { state.n[col] = -1; state.ln[col] = 0; state.vel[col] = 0; state.acc[col] = 0; }
        else if (drag.mode === 'vel') setVel(col, y);
      }
      dirty = true;
    }
    function pup() { drag = null; }
    return self;
  }
};
