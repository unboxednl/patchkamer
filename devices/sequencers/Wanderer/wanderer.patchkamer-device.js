// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.16.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in het definitieveld about.
// 1.15.0 — Patchkamer contract v1.17: klembord, alleen kopiëren. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, 12 tikken per zestiende). Kopiëren geeft het motief zoals het nu klinkt (toonladdertrappen omgezet naar MIDI-noten, met velocity, lengte, verloop en ratchets) als notes-clip; wijzigt het motief later, dan blijft de kopie staan (momentopname, geen koppeling). Plakken kan niet (`paste` is leeg): `setClip` geeft `ok:false` met een reden, behalve voor de eigen momentopname (`native`), die niets verandert. `modExclude: ['reps']` toegevoegd (Herhaal eerst was al bewust buiten `params()` gelaten; de validator meldde dat als let op). Verder niets gewijzigd: `getState`, presets, geluid en bestaande songs zijn gelijk aan 1.14.1.
// 1.14.1 — Swing is nu ook bestuurbaar via params()/modulate() (standaard uit, drift 0,05; role swing). Modulatie komt alleen bovenop de knop (effectief = knop + o × 0,5, geclampt) en is nooit state. De overige continue regelaars (inclusief Mensachtig, Accenten, Spooknoten, Ratchets) zaten er al in.
//   Bewust weggelaten: Herhaal eerst (geheel getal 1 tot 8, discreet), grondtoon, toonladder, laagste, hoogste, raster, motieflengte, verloop, karakter en de schakelaars (keuzes en vinkjes).
// 1.14.0 — Extra swing (`swing`, 0 … 0,5 van een zestiende, standaard 0). Een noot (of ratchet-noot) die in een oneven zestiende valt komt swing × stepDur later, bovenop de swing van de host; even zestienden blijven staan.
//   Rasters van 1/8 en langzamer hebben alleen noten op even zestienden en schuiven dus niet. Met swing 0 speelt een state precies als voorheen (geen extra willekeur).
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Wanderer (nieuwe id nl.patchkamer.wanderer, eigen map in sequencers; voorheen een Nederlandstalig
//   apparaat met een andere naam en id, nl.patchkamer.dwaler). Songs en presets uit die tijd verwijzen naar de oude id en laden hier niet in.
//   Met een ongewijzigde (oude) state, dezelfde klokstappen en dezelfde willekeur geeft dit apparaat dezelfde noten als het oude bestand.
//   - tweetalig (host.lang), poortnamen per taal in i18n; toonladders en karakters hebben Engelse sleutels (oude Nederlandse namen worden herkend)
//   - kleuren volgen de CSS-variabelen van de host; het bewegende deel tekent via host.frame
//   - raster: ook 1/32, 1/32 triool en 1/64 (standaard blijft 1/16); motieflengte tot 64 stappen
//   - dynamiek: spooklijn ("ghost notes"), mensachtige variatie, velocity-verloop over het motief, ratchets (rolls van 2 tot 4 noten per stap);
//     alle nieuwe velden staan standaard uit en veranderen een oude state niet
//   - de pianorol toont de lengte als breedte en de velocity als hoogte, met een velocity-strook; klikken en slepen bewerkt noten, lengte en velocity
//   - alles wat het apparaat uitstuurt is begrensd (noot 0–127, velocity 0–1, duur > 0, eindige tijd)
// Kansmelodie: verzint een motief binnen een toonladder en speelt het herhaaldelijk, met af en toe een variatie. Daardoor klinkt het als muziek
// (herhaling + verandering) in plaats van willekeur. Vooral kleine stapjes en soms een sprong, richting-voorkeur, akkoordtonen op de zware tellen,
// octaafsprongen, wisselende notenlengte en accenten, 'herhaal eerst N keer, verander dan', vergrendelen en Volg akkoord: een akkoord op de ingang
// bepaalt dan de toonschaal.
const EN = {
  'Verzint een motief in de toonladder, herhaalt het en verandert het beetje bij beetje. Trek de uitgang Noten naar een synth. Speel een akkoord op de ingang en zet Volg akkoord aan: dan dwaalt hij alleen over die tonen.':
    'Invents a motif in the scale, repeats it and changes it little by little. Connect the Notes output to a synth. Play a chord on the input and switch on Follow chord: it then wanders over those notes only.',
  'Karakter': 'Character', 'Grondtoon': 'Root', 'Toonladder': 'Scale', 'Laagste': 'Lowest', 'Hoogste': 'Highest', 'Raster': 'Grid', 'Motieflengte': 'Motif length',
  'Verloop': 'Contour', 'Vlak': 'Flat', 'Crescendo': 'Crescendo', 'Decrescendo': 'Decrescendo', 'Zwelling': 'Swell', 'Dip': 'Dip',
  'Het apparaat is verwijderd.': 'The device has been removed.', 'Geen geldige clip.': 'Not a valid clip.', 'Motief van {0} stappen': 'Motif of {0} steps', 'Wanderer': 'Wanderer',
  'Wanderer kan alleen kopiëren: het motief bestaat uit toonladdertrappen en verandert zelf, een clip is daar niet in terug te rekenen.': 'Wanderer can only copy: the motif is made of scale degrees and changes by itself, a clip cannot be turned back into that.',
  'Eigen': 'Own', 'Speelt': 'Playing', 'Stil': 'Stopped', 'Nieuw motief': 'New motif', 'Verander nu': 'Change now', 'Vergrendel': 'Lock', 'Volg akkoord': 'Follow chord',
  'het motief blijft zoals het is': 'the motif stays as it is', 'gebruik alleen de tonen die op de ingang worden vastgehouden': 'use only the notes held on the input',
  'het motief als pianorol; breedte = lengte, hoogte van het blokje en de strook = velocity. Klik om een noot te zetten of te wissen, sleep opzij voor de lengte, sleep in de strook voor de velocity':
    'the motif as a piano roll; width = length, height of the block and the strip = velocity. Click to set or clear a note, drag sideways for the length, drag in the strip for the velocity',
  'Hoe de lijn loopt': 'How the line moves', 'Herhaling en verandering': 'Repeat and change', 'Voordracht': 'Delivery', 'Dynamiek en rolls': 'Dynamics and rolls',
  'Dichtheid': 'Density', 'kans op een noot per stap': 'chance of a note per step', 'Sprongen': 'Leaps', 'kans op een grote sprong in plaats van een stapje': 'chance of a big leap instead of a small step',
  'Richting': 'Direction', '−1 = vooral omlaag, +1 = vooral omhoog': '−1 = mostly down, +1 = mostly up', 'Akkoordtonen': 'Chord tones', 'kans dat zware tellen op een akkoordtoon landen': 'chance that strong beats land on a chord tone',
  'Octaafsprong': 'Octave jump', 'Verandering': 'Change', 'kans per noot om te veranderen als het motief opnieuw begint': 'chance per note to change when the motif starts again',
  'Herhaal eerst': 'Repeat first', 'zo vaak klinkt het motief gelijk voordat er iets verandert': 'how often the motif sounds the same before something changes',
  'Notenlengte': 'Note length', 'Lengte-variatie': 'Length variation', 'Velocity': 'Velocity', 'Accenten': 'Accents', 'zware tellen harder': 'strong beats louder',
  'Spooknoten': 'Ghost notes', 'kans dat een lichte noot een zachte spooknoot wordt': 'chance that a weak note becomes a soft ghost note', 'Mensachtig': 'Humanize',
  'willekeurige velocity en lichte vertraging bij het spelen': 'random velocity and slight delay while playing', 'Ratchets': 'Ratchets', 'kans dat een noot een roll van 2 tot 4 noten wordt': 'chance that a note becomes a roll of 2 to 4 notes',
  'Het motief herhaalt zich; na "Herhaal eerst" keer verandert elke noot met de kans Verandering, en soms schuift het hele motief een trede. Vergrendel houdt een motief vast dat je goed vindt (het wordt bewaard in de werkruimte). Paarse Mod: Drift op Dichtheid of Sprongen laat de melodie ademen; Volger op Dichtheid laat hem drukker spelen als de drums luider zijn. Live toetsenbord: sluit een toetsenbord aan op de ingang en zet Volg akkoord aan; dit apparaat stuurt geen toetsenbord door naar een synth.':
    'The motif repeats; after "Repeat first" times every note changes with the chance Change, and now and then the whole motif shifts a scale step. Lock keeps a motif you like (it is saved in the workspace). Purple Mod: Drift on Density or Leaps lets the melody breathe; Follower on Density makes it play busier when the drums get louder. Live keyboard: connect a keyboard to the input and switch on Follow chord; this device does not pass a keyboard through to a synth.',
  'dubbelklik: standaard': 'double-click: default',
  'extra vertraging van noten op een oneven zestiende, bovenop de swing van de host (alleen rasters van 1/16 en sneller)': 'extra delay for notes on an odd sixteenth, on top of the host swing (grids of 1/16 and faster only)',
  'akkoord: ': 'chord: ', 'wacht op een akkoord (speelt intussen de toonladder)': 'waiting for a chord (plays the scale meanwhile)', 'wacht op een akkoord': 'waiting for a chord',
  'herhaling {0}': 'repeat {0}', ' · vergrendeld': ' · locked',
  '1/8 triool': '1/8 triplet', '1/16 triool': '1/16 triplet', '1/32 triool': '1/32 triplet',
};
const SCALE_NL = { minor: 'Mineur', major: 'Majeur', dorian: 'Dorisch', phrygian: 'Frygisch', lydian: 'Lydisch', mixolydian: 'Mixolydisch', 'harmonic minor': 'Harmonisch mineur', 'minor pentatonic': 'Penta mineur', 'major pentatonic': 'Penta majeur', blues: 'Blues', 'whole tone': 'Heletoon', japanese: 'Japans' };
const SCALE_EN = { minor: 'Minor', major: 'Major', dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', 'harmonic minor': 'Harmonic minor', 'minor pentatonic': 'Minor pentatonic', 'major pentatonic': 'Major pentatonic', blues: 'Blues', 'whole tone': 'Whole tone', japanese: 'Japanese' };
const LEGACY_SCALE = { mineur: 'minor', majeur: 'major', dorisch: 'dorian', frygisch: 'phrygian', lydisch: 'lydian', mixolydisch: 'mixolydian', harmonisch: 'harmonic minor', 'penta mineur': 'minor pentatonic', 'penta majeur': 'major pentatonic', heletoon: 'whole tone', japans: 'japanese' };
const LEGACY_CHARACTER = { 'Rustige lijn': 'Calm line', 'Arp-dwaler': 'Arp wanderer', 'Bas-dwaler': 'Bass wanderer', 'Sprongen': 'Leaps', 'Pentatonisch spel': 'Pentatonic play', 'Langzame zang': 'Slow song', 'Akkoordvolger': 'Chord follower', 'Japanse tuin': 'Japanese garden', 'Eigen': 'Own' };
// ---------- UI-kit (eigen kopie) ----------
const UK_CSS = `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:var(--event,#7fd6ff);--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px}
 .sub{margin:3px 0 10px;color:var(--muted,#97a1ad);font-size:12px;line-height:1.45}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:color-mix(in srgb,var(--u-acc) 45%,var(--field,#20252d));border-color:var(--u-acc)}
select:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--u-acc)}
canvas{display:block;width:100%;border-radius:6px;background:var(--well,#0c0f13);touch-action:none;cursor:crosshair}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
.note{font-size:11px;color:var(--muted,#97a1ad);line-height:1.5;margin:8px 0 0} .stt{font-size:11px;color:var(--mod,#b48cff);margin:4px 0}`;
const ukClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ukFinite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? ukClamp(x, a, b) : d;
const ukEl = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const ukStop = e => e.stopPropagation();
function ukShadow(hostEl, css) { const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap; ukEl(sh, 'style').textContent = css; sh.addEventListener('pointerdown', ukStop); sh.addEventListener('keydown', ukStop); return ukEl(sh, 'div', 'app'); }
function ukSelect(p, label, opts, value, change) { const box = ukEl(p, 'label', 'sel'); ukEl(box, 'span', '', label); const s = ukEl(box, 'select'); for (const [v, t] of opts) { const o = ukEl(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); return s; }
const ukToS = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
const ukFromS = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function ukFmt(d, v) { const u = d.unit || ''; if (u === '%') return Math.round(v * 100) + '%'; if (u === 'x') return v.toFixed(2) + '×'; if (u === 'int') return String(Math.round(v)); return v.toFixed(2) + (u ? ' ' + u : ''); }
// schuifregelaars voor een spec {id:{name,min,max,scale,unit,g}} in groepen; get/set lezen en schrijven de waarde
function ukSliders(parent, spec, groups, set, defaults, tx) { const handles = {};
  groups.forEach((gname, gi) => { if (gname) ukEl(parent, 'h3', '', gname); const g = ukEl(parent, 'div', 'grid');
    for (const [id, d] of Object.entries(spec)) { if ((d.g || 0) !== gi) continue; const c = ukEl(g, 'div', 'c'), lab = ukEl(c, 'div', 'lab'); ukEl(lab, 'span', '', tx(d.name)).title = tx(d.name); const o = ukEl(lab, 'output');
      const inp = ukEl(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', tx(d.name)); inp.title = tx(d.name) + (d.tip ? ' — ' + tx(d.tip) : '') + ' · ' + tx('dubbelklik: standaard');
      inp.value = String(ukToS(d, defaults[id])); inp.setAttribute('data-pk-default', inp.value);
      inp.oninput = () => { const v = ukFromS(d, +inp.value); set(id, v); o.textContent = ukFmt(d, v); };
      inp.ondblclick = () => { set(id, defaults[id]); handles[id].set(defaults[id]); };
      handles[id] = { set(v) { inp.value = String(ukToS(d, v)); o.textContent = ukFmt(d, v); }, el: c }; } });
  return handles; }
// canvas zonder layout-werk per frame: de breedte komt van een ResizeObserver, de hoogte wordt één keer gezet
function ukCanvas(cv, h) { const dpr = ukClamp(globalThis.devicePixelRatio || 1, 1, 3);
  if (!cv._ro) { cv._cw = cv.clientWidth || 300; try { cv._ro = new ResizeObserver(() => { cv._cw = cv.clientWidth || cv._cw; }); cv._ro.observe(cv); } catch { } }
  if (cv._h !== h) { cv.style.height = h + 'px'; cv._h = h; } const w = Math.max(160, cv._cw || 300);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const g = cv._g || (cv._g = cv.getContext('2d')); if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h }; }
// CSS-kleuren hooguit één keer per seconde opvragen (en meteen opnieuw na een wissel van kleurstelling)
let ukVarEpoch = 0; try { window.addEventListener('patchkamer-skin', () => { ukVarEpoch++; }); } catch { }
const ukVar = (el, name, d) => { const c = el._ukv || (el._ukv = {}), now = performance.now(), e = c[name];
  if (e && now - e.t < 1000 && e.ep === ukVarEpoch) return e.v; let v = d; try { v = getComputedStyle(el).getPropertyValue(name).trim() || d; } catch { } c[name] = { v, t: now, ep: ukVarEpoch }; return v; };
function ukResolve(spec, state, mod) { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = d.nomod ? 0 : (mod[id] || 0); if (!x) continue; e[id] = ukClamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } return e; }
function ukParams(spec, lane, laneName) { return Object.entries(spec).filter(([, d]) => !d.nomod).map(([id, d]) => ({ id, name: d.name, lane, laneName, min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: d.drift ?? 0.015, on: d.on ?? (!d.role || !['level', 'pitch'].includes(d.role)) })); }
// ---------- einde UI-kit ----------

export default {
  id: 'nl.patchkamer.wanderer', name: 'Wanderer', version: '1.16.0', about: { nl: 'Kansmelodie: verzint een motief in de toonladder en verandert het beetje bij beetje.', en: 'Probability melody: invents a motif in a scale and changes it bit by bit.' }, kind: 'utility', category: 'sequencer', modExclude: ['reps'],
  ui: { width: 820, minWidth: 400 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'akkoord', name: 'Chord / keys' }], eventOut: [{ id: 'notes', name: 'Notes' }], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { akkoord: 'Akkoord / toetsen', notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = ukClamp;
    const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
      'harmonic minor': [0, 2, 3, 5, 7, 8, 11], 'minor pentatonic': [0, 3, 5, 7, 10], 'major pentatonic': [0, 2, 4, 7, 9], blues: [0, 3, 5, 6, 7, 10], 'whole tone': [0, 2, 4, 6, 8, 10], japanese: [0, 1, 5, 7, 8] };
    // raster: aantal stappen per zestiende noot (1 = 1/16, 2 = 1/32, 4 = 1/64)
    const DIVS = [['0.25', '1/4'], ['0.5', '1/8'], ['0.75', '1/8 triool'], ['1', '1/16'], ['1.5', '1/16 triool'], ['2', '1/32'], ['3', '1/32 triool'], ['4', '1/64']];
    const CONTOURS = [['flat', 'Vlak'], ['crescendo', 'Crescendo'], ['decrescendo', 'Decrescendo'], ['swell', 'Zwelling'], ['dip', 'Dip']];
    const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'], nn = n => NOTE_NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
    const scaleLabel = k => (host.lang === 'nl' ? SCALE_NL : SCALE_EN)[k];
    const spec = {
      density: { name: 'Dichtheid', min: 0, max: 1, unit: '%', g: 0, tip: 'kans op een noot per stap' },
      jump: { name: 'Sprongen', min: 0, max: 1, unit: '%', g: 0, tip: 'kans op een grote sprong in plaats van een stapje' },
      drift: { name: 'Richting', min: -1, max: 1, unit: 'x', g: 0, tip: '−1 = vooral omlaag, +1 = vooral omhoog' },
      chord: { name: 'Akkoordtonen', min: 0, max: 1, unit: '%', g: 0, tip: 'kans dat zware tellen op een akkoordtoon landen' },
      octave: { name: 'Octaafsprong', min: 0, max: 1, unit: '%', g: 0 },
      mut: { name: 'Verandering', min: 0, max: 1, unit: '%', g: 1, tip: 'kans per noot om te veranderen als het motief opnieuw begint' },
      reps: { name: 'Herhaal eerst', min: 1, max: 8, step: 1, unit: 'int', g: 1, nomod: true, tip: 'zo vaak klinkt het motief gelijk voordat er iets verandert' },
      gate: { name: 'Notenlengte', min: 0.05, max: 1.5, unit: 'x', g: 2 },
      gvar: { name: 'Lengte-variatie', min: 0, max: 1, unit: '%', g: 2 },
      vel: { name: 'Velocity', min: 0.1, max: 1, unit: '%', g: 3 },
      accent: { name: 'Accenten', min: 0, max: 1, unit: '%', g: 3, tip: 'zware tellen harder' },
      ghost: { name: 'Spooknoten', min: 0, max: 1, unit: '%', g: 3, tip: 'kans dat een lichte noot een zachte spooknoot wordt' },
      swing: { name: 'Swing', min: 0, max: 0.5, step: 0.01, unit: '%', g: 2, role: 'swing', drift: 0.05, on: false, tip: 'extra vertraging van noten op een oneven zestiende, bovenop de swing van de host (alleen rasters van 1/16 en sneller)' },
      human: { name: 'Mensachtig', min: 0, max: 1, unit: '%', g: 3, tip: 'willekeurige velocity en lichte vertraging bij het spelen' },
      ratchet: { name: 'Ratchets', min: 0, max: 1, unit: '%', g: 3, tip: 'kans dat een noot een roll van 2 tot 4 noten wordt' },
    };
    const defaults = { swing: 0, density: 0.65, jump: 0.15, drift: 0, chord: 0.6, octave: 0.05, mut: 0.25, reps: 2, gate: 0.6, gvar: 0.3, vel: 0.75, accent: 0.4, ghost: 0, human: 0, ratchet: 0,
      root: 57, scale: 'minor', lo: 50, hi: 74, div: '1', len: 16, contour: 'flat', follow: false, lock: false, run: true, preset: 'Calm line', motif: null, seed: 1 };
    const presets = {
      'Calm line': {},
      'Arp wanderer': { density: 1, jump: 0.05, chord: 0.9, octave: 0.15, len: 8, gate: 0.4, gvar: 0.1, div: '1', mut: 0.15, reps: 4 },
      'Bass wanderer': { root: 33, lo: 28, hi: 45, density: 0.55, jump: 0.3, chord: 0.8, len: 16, div: '1', gate: 0.8, accent: 0.6, mut: 0.2, reps: 4 },
      'Leaps': { jump: 0.6, octave: 0.25, density: 0.5, gvar: 0.6, len: 12, mut: 0.4, reps: 1 },
      'Pentatonic play': { scale: 'minor pentatonic', density: 0.7, div: '1', len: 10, chord: 0.4, mut: 0.3 },
      'Slow song': { div: '0.5', len: 8, density: 0.8, gate: 1.2, jump: 0.1, chord: 0.7, mut: 0.2, reps: 2 },
      'Chord follower': { follow: true, density: 0.8, chord: 0.5, len: 16, jump: 0.2 },
      'Japanese garden': { scale: 'japanese', root: 64, lo: 60, hi: 84, div: '0.75', density: 0.55, gate: 0.9, jump: 0.25, mut: 0.35 },
    };
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, n = { ...defaults };
      for (const [id, d] of Object.entries(spec)) n[id] = ukFinite(s[id], defaults[id], d.min, d.max); n.reps = Math.round(n.reps);
      n.root = Math.round(ukFinite(s.root, defaults.root, 24, 84)); n.lo = Math.round(ukFinite(s.lo, defaults.lo, 12, 108)); n.hi = Math.round(ukFinite(s.hi, defaults.hi, 12, 108)); if (n.hi < n.lo + 5) n.hi = n.lo + 5;
      const sc = typeof s.scale === 'string' && Object.hasOwn(LEGACY_SCALE, s.scale) ? LEGACY_SCALE[s.scale] : s.scale;
      n.scale = typeof sc === 'string' && Object.hasOwn(SCALES, sc) ? sc : defaults.scale; n.div = DIVS.some(x => x[0] === s.div) ? s.div : defaults.div; n.len = Math.round(ukFinite(s.len, defaults.len, 2, 64));
      n.contour = CONTOURS.some(x => x[0] === s.contour) ? s.contour : defaults.contour;
      for (const k of ['follow', 'lock', 'run']) n[k] = s[k] !== undefined ? !!s[k] : defaults[k];
      const pc = typeof s.preset === 'string' && Object.hasOwn(LEGACY_CHARACTER, s.preset) ? LEGACY_CHARACTER[s.preset] : s.preset;
      n.preset = pc === 'Own' || (typeof pc === 'string' && Object.hasOwn(presets, pc)) ? pc : defaults.preset;
      n.motif = Array.isArray(s.motif) ? s.motif.slice(0, 64).map(x => ({ on: !!(x && x.on), deg: Math.round(ukFinite(x && x.deg, 0, -40, 60)), oct: Math.round(ukFinite(x && x.oct, 0, -1, 1)), vel: ukFinite(x && x.vel, 0.75, 0.05, 1), gate: ukFinite(x && x.gate, 0.6, 0.05, 4), rat: Math.round(ukFinite(x && x.rat, 1, 1, 4)) })) : null;
      return n; }
    let state = normalize({}), dead = false, mod = {}, eff = {}, tickN = 0, lastAbs = -1, cycle = 0, curStep = -1, held = new Map();
    const resolve = () => { eff = ukResolve(spec, state, mod); };
    // ---------- toonmateriaal ----------
    function pcs() { if (state.follow && held.size) { const set = [...new Set([...held.keys()].map(n => ((n - state.root) % 12 + 12) % 12))].sort((a, b) => a - b); if (set.length) return set; } return SCALES[state.scale]; }
    function degToNote(deg, oct) { const P = pcs(), n = P.length, o = Math.floor(deg / n), i = ((deg % n) + n) % n; let note = state.root + 12 * o + P[i] + 12 * (oct || 0); while (note > state.hi) note -= 12; while (note < state.lo) note += 12; return note; }
    function degRange() { const P = pcs(), n = P.length; let lo = -60, hi = 60; for (let d = -60; d <= 60; d++) { const nt = state.root + 12 * Math.floor(d / n) + P[((d % n) + n) % n]; if (nt >= state.lo && lo === -60) lo = d; if (nt <= state.hi) hi = d; } return [lo, hi]; }
    function chordDegs() { const n = pcs().length; return state.follow && held.size ? Array.from({ length: n }, (_, i) => i) : n >= 7 ? [0, 2, 4] : n >= 5 ? [0, 2, 3] : [0]; }
    function genStep(j, prev) { const R = Math.random, [dlo, dhi] = degRange();
      const strong = j % 4 === 0, on = R() < clamp(eff.density + (strong ? 0.15 : 0) - (j % 2 ? 0.08 : 0), 0, 1);
      let deg = prev; const up = R() < 0.5 + eff.drift * 0.4;
      if (R() < eff.jump) deg += (up ? 1 : -1) * (3 + Math.floor(R() * 4)); else { const r = R(); deg += r < 0.15 ? 0 : (up ? 1 : -1) * (r < 0.75 ? 1 : 2); }
      if (deg > dhi) deg = dhi - (deg - dhi); if (deg < dlo) deg = dlo + (dlo - deg); deg = clamp(deg, dlo, dhi);
      if (strong && R() < eff.chord) { const n = pcs().length, cd = chordDegs(); let best = deg, bd = 99; for (let d = deg - n; d <= deg + n; d++) { if (!cd.includes(((d % n) + n) % n) || d < dlo || d > dhi) continue; const dd = Math.abs(d - deg); if (dd < bd) { bd = dd; best = d; } } deg = best; }
      const oct = R() < eff.octave ? (R() < 0.5 ? 1 : -1) : 0;
      let vel = clamp(eff.vel * (0.8 + R() * 0.2) + (strong ? eff.accent * 0.3 : 0), 0.05, 1);
      const gate = clamp(eff.gate * (1 + (R() * 2 - 1) * eff.gvar), 0.05, 2);
      // nieuwe velden: alleen willekeur als ze aan staan, zodat een oude state dezelfde reeks willekeurige getallen gebruikt
      if (eff.ghost > 0 && !strong && R() < eff.ghost) vel = clamp(vel * 0.45, 0.05, 1);
      let rat = 1; if (eff.ratchet > 0 && R() < eff.ratchet) rat = 2 + Math.floor(R() * 3);
      return { on, deg, oct, vel, gate, rat }; }
    function newMotif() { resolve(); const m = []; const [dlo, dhi] = degRange(); let prev = Math.round((dlo + dhi) / 2 + (Math.random() - 0.5) * 3); for (let j = 0; j < state.len; j++) { const s = genStep(j, prev); m.push(s); if (s.on) prev = s.deg; } state.motif = m; cycle = 0; }
    function mutate() { if (state.lock || !state.motif) return; resolve(); const m = state.motif; let prev = m.find(x => x.on)?.deg ?? 0;
      for (let j = 0; j < m.length; j++) { if (Math.random() < eff.mut) m[j] = genStep(j, j ? (m[j - 1].on ? m[j - 1].deg : prev) : prev); if (m[j].on) prev = m[j].deg; }
      if (Math.random() < eff.mut * 0.25) { const sh = Math.random() < 0.5 ? 1 : -1, [dlo, dhi] = degRange(); m.forEach(x => { x.deg = clamp(x.deg + sh, dlo, dhi); }); } }
    function ensure() { if (!state.motif || state.motif.length !== state.len) { const old = state.motif || []; if (old.length && old.length < state.len) { resolve(); let prev = old[old.length - 1].deg; while (old.length < state.len) { const s = genStep(old.length, prev); old.push(s); if (s.on) prev = s.deg; } state.motif = old; } else if (old.length > state.len) state.motif = old.slice(0, state.len); else newMotif(); } }
    ensure();
    // velocity-verloop over het motief (1 = geen verandering)
    function contourFactor(j, L) { const p = L > 1 ? j / (L - 1) : 0; switch (state.contour) { case 'crescendo': return 0.55 + 0.45 * p; case 'decrescendo': return 1 - 0.45 * p; case 'swell': return 0.6 + 0.4 * Math.sin(Math.PI * p); case 'dip': return 1 - 0.4 * Math.sin(Math.PI * p); default: return 1; } }
    const outNote = n => clamp(Math.round(Number.isFinite(n) ? n : 60), 0, 127);
    // ---------- UI ----------
    const PH = 150, SH = 46;   // pianorol en velocity-strook
    let root = null, ui = {}, cv = null, raf = null, drag = null;
    // ---- klembord: momentopname van het motief (zoals het nu klinkt, ook als het zelf verandert) ----
    function clipBuild() {
      const m = state.motif; if (!Array.isArray(m) || !m.length) return null;
      const rate = +state.div, tickT = 12 / rate, L = m.length, length = Math.max(1, Math.min(12288, Math.round(L * tickT))), notes = [], r3 = x => Math.round(clamp(x, 0.01, 1) * 1000) / 1000;
      for (let j = 0; j < L; j++) {
        const s = m[j]; if (!s || !s.on) continue; let vel = s.vel; if (state.contour !== 'flat') vel *= contourFactor(j, L); if (!Number.isFinite(vel)) vel = 0.75;
        const note = outNote(degToNote(s.deg, s.oct)), rat = s.rat > 1 ? Math.min(4, Math.round(s.rat)) : 1, t0 = j * tickT;
        for (let r = 0; r < rat; r++) {
          const t = Math.round(t0 + r * tickT / rat); if (t >= length) continue; const slot = rat === 1 ? tickT * s.gate : tickT / rat * clamp(s.gate, 0.1, 1);
          notes.push({ t, n: note, len: Math.max(1, Math.min(length - t, Math.round(slot))), vel: r3(rat === 1 ? vel : vel * (1 - 0.12 * r)) });
        }
      }
      notes.sort((a, b) => a.t - b.t || a.n - b.n);
      const clip = { format: 'patchkamer-clip', formatVersion: 1, kind: 'notes', name: tx('Motief van {0} stappen', L), length, grid: notes.every(e => e.t % 12 === 0) ? 16 : notes.every(e => e.t % 6 === 0) ? 32 : 64, source: { device: 'nl.patchkamer.wanderer', name: 'Wanderer', version: '1.15.0', scheme: 'gm' }, notes: notes.slice(0, 4096), native: { device: 'nl.patchkamer.wanderer', data: { snapshot: true } } };
      const sw = Math.min(0.5, state.swing || 0); if (sw > 0) clip.swing = sw; return clip;
    }
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS);
      ukEl(app, 'p', 'sub', tx('Verzint een motief in de toonladder, herhaalt het en verandert het beetje bij beetje. Trek de uitgang Noten naar een synth. Speel een akkoord op de ingang en zet Volg akkoord aan: dan dwaalt hij alleen over die tonen.'));
      const top = ukEl(app, 'div', 'top');
      ui.preset = ukSelect(top, tx('Karakter'), Object.keys(presets).map(k => [k, k]).concat([['Own', tx('Eigen')]]), state.preset, v => { if (presets[v]) { self.setState({ ...defaults, ...presets[v], preset: v, motif: null, run: state.run }); } });
      ui.root = ukSelect(top, tx('Grondtoon'), Array.from({ length: 61 }, (_, i) => [24 + i, nn(24 + i)]), state.root, v => { state.root = +v; eigen(); paint(); });
      ui.scale = ukSelect(top, tx('Toonladder'), Object.keys(SCALES).map(k => [k, scaleLabel(k)]), state.scale, v => { state.scale = v; eigen(); paint(); });
      ui.lo = ukSelect(top, tx('Laagste'), Array.from({ length: 85 }, (_, i) => [12 + i, nn(12 + i)]), state.lo, v => { state.lo = +v; if (state.hi < state.lo + 5) state.hi = state.lo + 5; eigen(); paint(); });
      ui.hi = ukSelect(top, tx('Hoogste'), Array.from({ length: 85 }, (_, i) => [24 + i, nn(24 + i)]), state.hi, v => { state.hi = +v; if (state.hi < state.lo + 5) state.lo = state.hi - 5; eigen(); paint(); });
      ui.div = ukSelect(top, tx('Raster'), DIVS.map(([v, t]) => [v, tx(t)]), state.div, v => { state.div = v; eigen(); });
      ui.len = ukSelect(top, tx('Motieflengte'), Array.from({ length: 63 }, (_, i) => [i + 2, String(i + 2)]), state.len, v => { state.len = +v; ensure(); eigen(); paint(); });
      ui.contour = ukSelect(top, tx('Verloop'), CONTOURS.map(([v, t]) => [v, tx(t)]), state.contour, v => { state.contour = v; eigen(); });
      const t2 = ukEl(app, 'div', 'top');
      ui.run = ukEl(t2, 'button'); ui.run.type = 'button'; ui.run.onclick = () => { state.run = !state.run; paint(); };
      const nw = ukEl(t2, 'button', '', tx('Nieuw motief')); nw.type = 'button'; nw.onclick = () => { newMotif(); eigen(); paint(); };
      const mu = ukEl(t2, 'button', '', tx('Verander nu')); mu.type = 'button'; mu.onclick = () => { const l = state.lock; state.lock = false; mutate(); state.lock = l; paint(); };
      ui.lock = ukEl(t2, 'button', '', tx('Vergrendel')); ui.lock.type = 'button'; ui.lock.title = tx('het motief blijft zoals het is'); ui.lock.onclick = () => { state.lock = !state.lock; paint(); };
      ui.follow = ukEl(t2, 'button', '', tx('Volg akkoord')); ui.follow.type = 'button'; ui.follow.title = tx('gebruik alleen de tonen die op de ingang worden vastgehouden'); ui.follow.onclick = () => { state.follow = !state.follow; eigen(); paint(); };
      ui.held = ukEl(t2, 'span', 'stt', '');
      cv = ukEl(app, 'canvas'); cv.setAttribute('aria-label', tx('het motief als pianorol; breedte = lengte, hoogte van het blokje en de strook = velocity. Klik om een noot te zetten of te wissen, sleep opzij voor de lengte, sleep in de strook voor de velocity'));
      cv.title = cv.getAttribute('aria-label'); cv.onpointerdown = down; cv.onpointermove = move; cv.onpointerup = up; cv.onpointercancel = up;
      ui.k = ukSliders(app, spec, [tx('Hoe de lijn loopt'), tx('Herhaling en verandering'), tx('Voordracht'), tx('Dynamiek en rolls')], (id, v) => { state[id] = id === 'reps' ? Math.round(v) : v; eigen(); resolve(); }, defaults, tx);
      ukEl(app, 'p', 'note', tx('Het motief herhaalt zich; na "Herhaal eerst" keer verandert elke noot met de kans Verandering, en soms schuift het hele motief een trede. Vergrendel houdt een motief vast dat je goed vindt (het wordt bewaard in de werkruimte). Paarse Mod: Drift op Dichtheid of Sprongen laat de melodie ademen; Volger op Dichtheid laat hem drukker spelen als de drums luider zijn. Live toetsenbord: sluit een toetsenbord aan op de ingang en zet Volg akkoord aan; dit apparaat stuurt geen toetsenbord door naar een synth.'));
      paint(); raf = host && typeof host.frame === 'function' ? host.frame(self, draw, 20) : null; draw(); }
    function eigen() { if (state.preset !== 'Own') { state.preset = 'Own'; if (ui.preset) ui.preset.value = 'Own'; } }
    function heldText() { return state.follow ? (held.size ? tx('akkoord: ') + [...held.keys()].sort((a, b) => a - b).map(nn).join(' ') : tx('wacht op een akkoord (speelt intussen de toonladder)')) : ''; }
    function paint() { if (!root) return; ui.preset.value = state.preset; ui.root.value = String(state.root); ui.scale.value = state.scale; ui.lo.value = String(state.lo); ui.hi.value = String(state.hi); ui.div.value = state.div; ui.len.value = String(state.len); ui.contour.value = state.contour;
      ui.run.textContent = state.run ? tx('Speelt') : tx('Stil'); ui.run.classList.toggle('on', state.run); ui.lock.classList.toggle('on', state.lock); ui.follow.classList.toggle('on', state.follow);
      ui.held.textContent = heldText();
      for (const [id, k] of Object.entries(ui.k)) k.set(state[id]); draw(); }
    // bewerken met de aanwijzer: klik zet of wist een noot, opzij slepen = lengte, in de strook slepen = velocity
    function pos(e) { const r = cv.getBoundingClientRect(), w = r.width || 1; return { x: (e.clientX - r.left), y: (e.clientY - r.top) * ((PH + SH) / (r.height || 1)), w }; }
    function down(e) { if (!state.motif || !cv) return; const p = pos(e), L = state.motif.length, j = clamp(Math.floor(p.x / p.w * L), 0, L - 1), s = state.motif[j];
      try { cv.setPointerCapture(e.pointerId); } catch { }
      if (p.y >= PH) { drag = { mode: 'vel' }; if (s.on) { s.vel = clamp(1 - (p.y - PH) / SH, 0.05, 1); } eigen(); draw(); return; }
      const span = state.hi - state.lo + 1, pitch = clamp(state.lo + Math.floor((PH - p.y) / PH * span), state.lo, state.hi), [dlo, dhi] = degRange(); let best = dlo, bd = 1e9;
      for (let d = dlo; d <= dhi; d++) { const dd = Math.abs(degToNote(d, 0) - pitch); if (dd < bd) { bd = dd; best = d; } }
      const same = s.on && degToNote(s.deg, s.oct) === degToNote(best, 0);
      drag = { mode: 'gate', j, x0: p.x, moved: false, off: same };
      if (!same) { s.on = true; s.deg = best; s.oct = 0; s.rat = 1; } eigen(); draw(); }
    function move(e) { if (!drag || !state.motif || !cv) return; const p = pos(e), L = state.motif.length;
      if (drag.mode === 'vel') { const j = clamp(Math.floor(p.x / p.w * L), 0, L - 1), s = state.motif[j]; if (s.on && p.y >= 0) s.vel = clamp(1 - (p.y - PH) / SH, 0.05, 1); draw(); return; }
      if (Math.abs(p.x - drag.x0) > 4) { drag.moved = true; const s = state.motif[drag.j]; s.gate = clamp(Math.round((p.x / p.w * L - drag.j) * 20) / 20, 0.05, 4); draw(); } }
    function up(e) { if (drag && drag.mode === 'gate' && !drag.moved && drag.off && state.motif) state.motif[drag.j].on = false; drag = null; try { cv && cv.releasePointerCapture(e.pointerId); } catch { } draw(); }
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, PH + SH + 4); if (g && state.motif) { g.clearRect(0, 0, w, h); const acc = ukVar(cv, '--event', '#7fd6ff'), line = ukVar(cv, '--line', '#333'), fg = ukVar(cv, '--fg', '#fff'), lo = state.lo, hi = state.hi, span = hi - lo + 1, L = state.motif.length, rh = PH / span;
        const P = pcs(); for (let n = lo; n <= hi; n++) { const inS = P.includes(((n - state.root) % 12 + 12) % 12), y = PH - (n - lo + 1) * rh; g.fillStyle = line; g.globalAlpha = inS ? 0.35 : 0.08; g.fillRect(0, y, w, rh - 1); }
        g.globalAlpha = 1; for (let j = 0; j <= L; j += 4) { g.fillStyle = line; g.fillRect(Math.min(w - 1, j / L * w), 0, 1, h); }
        g.fillStyle = line; g.fillRect(0, PH + 1, w, 1);
        for (let j = 0; j < L; j++) { const s = state.motif[j]; if (!s.on) continue; const note = degToNote(s.deg, s.oct), bw = Math.max(3, Math.min(s.gate, 4) / L * w - 2), bh = Math.max(3, rh * (0.45 + 0.55 * s.vel)), y = PH - (note - lo + 1) * rh + (rh - bh) / 2, x = j / L * w + 1;
          g.fillStyle = acc; g.globalAlpha = 0.35 + 0.65 * s.vel; g.fillRect(x, y, bw, bh); if (s.rat > 1) { g.fillStyle = fg; g.globalAlpha = 0.8; for (let r = 1; r < s.rat; r++) g.fillRect(x + bw * r / s.rat, y, 1, bh); }
          g.globalAlpha = 0.5 + 0.5 * s.vel; g.fillStyle = acc; g.fillRect(x, PH + 3 + (SH - 2) * (1 - s.vel), Math.max(3, w / L - 3), (SH - 2) * s.vel);
          if (j === curStep) { g.globalAlpha = 1; g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(x, y - 1, bw, bh + 2); } }
        g.globalAlpha = 1; if (curStep >= 0) { g.fillStyle = fg; g.globalAlpha = 0.15; g.fillRect(curStep / L * w, 0, w / L, h); g.globalAlpha = 1; }
        g.fillStyle = ukVar(cv, '--muted', '#888'); g.font = '10px monospace'; g.fillText(nn(hi), 4, 10); g.fillText(nn(lo), 4, PH - 3); g.fillText('velocity', 4, PH + 12); const lbl = tx('herhaling {0}', cycle + 1) + (state.lock ? tx(' · vergrendeld') : ''); g.fillText(lbl, w - 8 - lbl.length * 6, 10); }
      }
    function unmount() { if (raf) raf(); raf = null; if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; drag = null; }
    const self = {
      inputs: {}, outputs: {},
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; ensure(); resolve(); const sd = ukFinite(info.stepDur, 0.125, 0.01, 2), t = ukFinite(info.time, ctx.currentTime, 0, 1e9);
          for (const [n, until] of [...held]) if (until < t) held.delete(n);
          const abs = Number.isFinite(info.bar) ? info.bar * 16 + (info.step | 0) : lastAbs + 1; lastAbs = abs; if (!state.run) { curStep = -1; return; }
          const rate = +state.div, from = Math.ceil(abs * rate - 1e-9), to = (abs + 1) * rate;
          for (let k = from; k < to - 1e-9; k++) { const j = ((tickN % state.len) + state.len) % state.len; if (j === 0 && tickN > 0) { cycle++; if (cycle >= state.reps) { mutate(); cycle = 0; } } tickN++; curStep = j;
            const s = state.motif[j]; if (!s || !s.on) continue; const time = t + (k / rate - abs) * sd, slot = sd / rate, note = outNote(degToNote(s.deg, s.oct));
            let vel = s.vel; if (state.contour !== 'flat') vel *= contourFactor(j, state.motif.length);
            let delay = 0; if (eff.human > 0) { vel += (Math.random() * 2 - 1) * eff.human * 0.25; delay = Math.random() * eff.human * 0.3 * slot; }
            vel = clamp(Number.isFinite(vel) ? vel : 0.75, 0.01, 1);
            const sw = eff.swing > 0 ? Math.min(0.5, eff.swing) : 0, sh = q => (sw > 0 && Math.floor(k / rate + q + 1e-9) % 2 === 1 ? sw * sd : 0);
            try { const rat = s.rat > 1 ? s.rat : 1;
              if (rat === 1) host.emit(self, 'notes', { type: 'note', note, vel, time: time + delay + sh(0), dur: Math.max(0.001, s.gate * sd / rate) });
              else for (let r = 0; r < rat; r++) host.emit(self, 'notes', { type: 'note', note, vel: clamp(vel * (1 - 0.12 * r), 0.01, 1), time: time + delay + sh(r / rat / rate) + r * slot / rat, dur: Math.max(0.001, slot / rat * clamp(s.gate, 0.1, 1)) });
            } catch {} }
           } catch {} },
      onTransport(info) { try { if (!info?.playing) { tickN = 0; cycle = 0; curStep = -1; lastAbs = -1; } } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'akkoord' || !e || !Number.isFinite(e.note)) return; const type = String(e.type || '').toLowerCase().replace(/[_-]/g, ''), n = clamp(Math.round(e.note), 0, 127), t = ukFinite(e.time, ctx.currentTime, 0, 1e9);
          if (type === 'noteoff' || e.vel === 0) held.delete(n); else if (type === 'noteon') held.set(n, 1e12); else if (type === 'note') held.set(n, t + (Number.isFinite(e.dur) ? e.dur : 1) + 0.05);
          if (root && ui.held) ui.held.textContent = heldText(); } catch {} },
      params() { return ukParams(spec, 'wanderer', 'Wanderer'); },
      modulate(o) { try { mod = {}; if (o && typeof o === 'object') for (const id of Object.keys(spec)) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); resolve(); } catch {} },
      // ---- klembord (contract v1.17, §13d): alleen kopiëren, het motief als momentopname; plakken kan niet ----
      clipInfo() { try { if (dead) return null; const c = clipBuild(); return c ? { name: c.name, copy: ['notes'], paste: [], length: { min: 1, max: 12288, step: 1, current: c.length, shared: false }, grid: [16, 32, 64], range: [0, 127], scheme: 'gm', vel: 'continuous', prob: false, ratchet: false } : { name: tx('Wanderer'), copy: [], paste: [] }; } catch { return null; } },
      getClip() { try { if (dead) return null; const c = clipBuild(); return c ? JSON.parse(JSON.stringify(c)) : null; } catch { return null; } },
      setClip(clip) { try { if (dead) return { ok: false, reason: tx('Het apparaat is verwijderd.') };
          // de eigen momentopname terugplakken laat alles zoals het is; al het andere kan niet (een motief vergrendelen vraagt terugrekenen naar toonladdertrappen)
          if (clip && typeof clip === 'object' && clip.format === 'patchkamer-clip' && clip.native && typeof clip.native === 'object' && clip.native.device === 'nl.patchkamer.wanderer') return { ok: true };
          return { ok: false, reason: tx('Wanderer kan alleen kopiëren: het motief bestaat uit toonladdertrappen en verandert zelf, een clip is daar niet in terug te rekenen.') };
        } catch { return { ok: false, reason: tx('Geen geldige clip.') }; } },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(raw) { if (dead) return; state = normalize(raw); ensure(); resolve(); paint(); },
      getPreset() { const s = self.getState(); delete s.run; return s; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), run: state.run }); },
      destroy() { if (dead) return; dead = true; unmount(); },
    };
    resolve();
    return self;
  },
};
