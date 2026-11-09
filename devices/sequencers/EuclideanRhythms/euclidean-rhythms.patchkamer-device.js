// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.17.0 — Uitleg naar about (menu Over Euclidean Rhythms); de UI toont geen uitlegtekst meer.
// 1.16.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in het definitieveld about.
// 1.15.0 — Patchkamer contract v1.17: klembord, alleen kopiëren. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, 12 tikken per zestiende). Kopiëren geeft een momentopname van de eerste maat: staat de gekozen rij op Noot, dan een notes-clip van die rij; anders een drums-clip van alle rijen die aan staan en naar een spoor gaan, elke baan met de eigen lengte (polymeter), accenten, ghost notes en kans meegenomen. Plakken kan niet (`paste` is leeg): `setClip` geeft `ok:false` met een reden, behalve voor de eigen momentopname (`native`), die niets verandert. Verder niets gewijzigd: `getState`, presets, geluid en bestaande songs zijn gelijk aan 1.14.1.
// 1.14.1 — Swing per rij en de hele klanklijst van een drumcomputer bereikbaar. Staat de swing van een rij op 0 (de standaard), dan geeft elke state dezelfde gebeurtenissen als voorheen.
//   - swing per rij (`swing`, 0 … 0,5 van een zestiende, regelaar bij de gekozen rij): een slag die in een oneven zestiende valt (ook een 1/32-slag of de tweede helft van een ratchet daarin) komt (rijswing) × stepDur later, bovenop de swing van de host;
//     rijen op 1/8 of langzamer hebben alleen slagen op even zestienden en schuiven dus niet
//   - de nootkeuze van een rij mag elke noot 0 … 127 zijn (was 12 … 108) en toont, als er een drumcomputer aan hangt, eerst al zijn klanken in zijn volgorde en daarna alle noten
// 1.14.0 — Patchkamer contract v1.14. De uitgangskeuze en de nootkeuze tonen de klanken van de aangesloten drumcomputer (noteNames, host.peers); zonder zo'n apparaat is alles als voorheen.
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Euclidean Rhythms (nieuwe id nl.patchkamer.euclidean, eigen map in sequencers; voorheen Euclides, nl.patchkamer.euclides).
//   Presets en songs uit die tijd verwijzen naar de oude id en laden hier niet in. Een oude state klinkt identiek: zelfde state en zelfde klokstappen geven dezelfde
//   gebeurtenissen, want alle nieuwe velden hebben als standaard het oude gedrag.
//   - tweetalig (host.lang, poortnamen per taal in i18n); kleuren volgen de CSS-variabelen van de host; tekenen via host.frame
//   - raster per rij tot 1/64 en 1/32-triolen (naast 1/32, 1/16, triolen, 1/8 en 1/4)
//   - velocity-dynamiek per rij: accentsterkte, zachte slagen, ghost notes (euclidisch verdeeld), crescendo/decrescendo/boog, menselijke variatie
//   - notenlengte (gate) tot 4 rasterstappen, dus ook legato en overlap; velocity en lengte zijn als staafjes te zien in de strook onder de ringen
//   - ingang Notes in: een toetsenbord kan de gekozen rij live spelen (noot of trig), met nette afsluiting van hangende noten
//   - getPreset/setPreset (zonder gekozen rij en lopen/stop); onbekende of ongeldige invoer wordt afgekapt; de klok-invoer is begrensd
//   - de namen van de ingebouwde voorbeelden zijn Engels (oude Nederlandse namen in een state worden herkend)
/** Euclidean Rhythms — Zelfstandig, geen externe bestanden.
 * Euclidische ritmes: verdeel een aantal slagen zo gelijk mogelijk over een aantal stappen (bijv. 3 over 8 = tresillo,
 * 5 over 8 = cinquillo, 7 over 12 = bembé). Acht rijen, elk met eigen stappen, slagen, verschuiving en tempo-deling
 * (tot 1/64 en ook triolen). Uit: trigs per spoor (ch1–ch8, voor een drumapparaat) of noten (voor synths).
 * Slimmigheden: accenten en ghost notes die zelf ook euclidisch verdeeld zijn, kans per rij, fills om de N maten (dubbel of
 * ratchet), mutatie die per maat de rotatie laat verspringen, en een ringweergave waarop je alles ziet lopen.
 */
const EN = {
  'Voorbeeld': 'Example', 'Eigen': 'Custom', 'Loopt': 'Running', 'Aan': 'On', 'Uit': 'Off', 'Live spelen': 'Live play',
  'Terug naar het begin': 'Back to the start', 'alle rijen beginnen opnieuw (kan ook met een trig op de ingang Reset)': 'all rows start again (also possible with a trig on the Reset input)',
  'Verras': 'Surprise', 'willekeurige verdelingen voor de rijen die aan staan': 'random distributions for the rows that are on',
  'ringen: elke rij is een ring, de slagen zijn stippen': 'rings: every row is a ring, the pulses are dots',
  'staafjes: hoogte is de velocity, breedte is de notenlengte van de gekozen rij': 'bars: height is the velocity, width is the note length of the selected row',
  'Rij': 'Row', 'Stappen': 'Steps', 'Slagen': 'Pulses', 'Rotatie': 'Rotation', 'Tempo': 'Rate', 'Uitgang': 'Out', 'Velocity': 'Velocity', 'Accent': 'Accents', 'Kans': 'Chance', 'Fill': 'Fill', 'Mutatie': 'Mutation',
  'stappen': 'steps', 'slagen': 'pulses', 'rotatie': 'rotation', 'accenten': 'accents', 'kans': 'chance', 'mutatie': 'mutation', 'velocity': 'velocity', 'rij {0}': 'row {0}',
  'kans per maat dat de rij een stap verspringt': 'chance per bar that the row shifts by one step',
  'Het apparaat is verwijderd.': 'The device has been removed.', 'Geen geldige clip.': 'Not a valid clip.', 'Rij {0}': 'Row {0}', 'Alle sporen': 'All tracks', 'Euclidean Rhythms': 'Euclidean Rhythms',
  'Euclidean Rhythms kan alleen kopiëren: het ritme volgt uit getallen (stappen, slagen, rotatie) en heeft geen stappenlijst om te plakken.': 'Euclidean Rhythms can only copy: the rhythm follows from numbers (steps, pulses, rotation) and has no step list to paste into.',
  'Spoor {0}': 'Track {0}', 'Noot': 'Note', 'Geen': 'None', '{0} m · dubbel': '{0} bars · double', '{0} m · ratchet': '{0} bars · ratchet',
  '1/16 triool': '1/16 triplet', '1/8 triool': '1/8 triplet', '1/32 triool': '1/32 triplet',
  'Gekozen rij {0}': 'Selected row {0}', 'Noot van de gekozen rij': 'Note of the selected row',
  'Notenlengte': 'Note length', 'Accentsterkte': 'Accent level', 'Zachte slagen': 'Soft hits', 'Ghost notes': 'Ghost notes', 'Ghost-sterkte': 'Ghost level', 'Verloop': 'Contour', 'Verloopdiepte': 'Contour depth', 'Menselijk': 'Humanize',
  'Vlak': 'Flat', 'Crescendo': 'Crescendo', 'Decrescendo': 'Decrescendo', 'Boog': 'Arch',
  'lengte van de noot als deel van een rasterstap van de rij (tot 4: legato en overlap); bij trigs zonder effect': 'note length as a part of the row grid step (up to 4: legato and overlap); no effect on trigs',
  'sterkte van de accenten': 'strength of the accented hits', 'sterkte van de overige slagen in een rij met accenten': 'strength of the other hits in a row with accents',
  'zoveel niet-accent slagen worden ghost notes, euclidisch verdeeld': 'this many non-accent hits become ghost notes, spread euclidean',
  'velocity van de ghost notes ten opzichte van de rij-velocity': 'velocity of the ghost notes relative to the row velocity',
  'hoe de velocity over de stappen van de rij loopt': 'how the velocity moves over the steps of the row', 'hoeveel het verloop uitmaakt': 'how much the contour matters',
  'willekeurige variatie in velocity en lengte': 'random variation in velocity and length', ' · dubbelklik: standaard': ' · double-click: default',
  '(uit)': '(off)',
  'Swing': 'Swing', 'Klanken van de drumcomputer': 'Drum machine sounds', 'Alle noten': 'All notes',
  'extra vertraging van slagen op een oneven zestiende, bovenop de swing van de host (alleen rasters van 1/16 en sneller)': 'extra delay for hits on an odd sixteenth, on top of the host swing (grids of 1/16 and faster only)',
};
const LEGACY_PRESETS = { 'Klikwerk-kit': 'Drum kit', 'Afro-Cubaans': 'Afro-Cuban', 'Bembé (7 over 12)': 'Bembe (7 over 12)', 'Polyritme 3·4·5·7': 'Polyrhythm 3·4·5·7', 'Techno': 'Techno', 'IDM-stotter': 'IDM stutter', 'Melodisch (noten)': 'Melodic (notes)', 'Eigen': 'Custom' };
// ---------- UI-kit (eigen kopie) ----------
const UK_CSS = (acc) => `:host{display:block;color:var(--fg,#e2e6ea);font:13px system-ui,sans-serif;--u-acc:${acc};--u-ink:color-mix(in srgb,var(--u-acc) 60%,var(--fg,#e2e6ea))}
*{box-sizing:border-box}
.app{container-type:inline-size;background:var(--card,#15181d);border-radius:10px;padding:14px}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:8px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)}
select,button,input[type=text],input[type=number]{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--u-acc)} button.on{background:var(--u-acc);border-color:var(--u-acc);color:#14100a}
canvas{display:block;width:100%;border-radius:6px;background:var(--well,#0c0f13)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#97a1ad);font-weight:600;margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line,#30363f)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#97a1ad)}
.c .lab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c output{font-size:11px;color:var(--fg,#e2e6ea);white-space:nowrap;text-transform:none;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--u-acc)}
`;
const ukClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ukFinite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? ukClamp(x, a, b) : d;
const ukEl = (p, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (p) p.appendChild(e); return e; };
const ukStop = e => e.stopPropagation();
function ukShadow(hostEl, css) { const wrap = document.createElement('div'); hostEl.appendChild(wrap); const sh = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap; ukEl(sh, 'style').textContent = css; sh.addEventListener('pointerdown', ukStop); sh.addEventListener('keydown', ukStop); return ukEl(sh, 'div', 'app'); }
function ukSelect(p, label, opts, value, change) { const box = ukEl(p, 'label', 'sel'); ukEl(box, 'span', '', label); const s = ukEl(box, 'select'); for (const [v, t] of opts) { const o = ukEl(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); return s; }
const ukToS = (d, v) => (v - d.min) / (d.max - d.min);
const ukFromS = (d, x) => { const v = d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
function ukFmt(d, v) { if (d.unit === '%') return Math.round(v * 100) + '%'; if (d.unit === 'int') return String(Math.round(v)); return v.toFixed(2) + '×'; }
// schuifregelaars voor een spec {id:{name,min,max,unit,step,tip}}; set(id, v) schrijft de waarde, dbl is de tip voor dubbelklikken
function ukSliders(parent, spec, set, defaults, dbl) { const handles = {}, g = ukEl(parent, 'div', 'grid');
  for (const [id, d] of Object.entries(spec)) { const c = ukEl(g, 'div', 'c'), lab = ukEl(c, 'div', 'lab'); ukEl(lab, 'span', '', d.name).title = d.name; const o = ukEl(lab, 'output');
    const inp = ukEl(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', d.name); inp.title = d.name + (d.tip ? ' — ' + d.tip : '') + dbl;
    inp.dataset.pkDefault = String(ukToS(d, defaults[id])); inp.value = String(ukToS(d, defaults[id])); o.textContent = ukFmt(d, defaults[id]);
    inp.oninput = () => { const v = ukFromS(d, +inp.value); set(id, v); o.textContent = ukFmt(d, v); };
    inp.ondblclick = () => { set(id, defaults[id]); handles[id].set(defaults[id]); };
    handles[id] = { set(v) { inp.value = String(ukToS(d, v)); o.textContent = ukFmt(d, v); }, el: c }; }
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
// ---------- einde UI-kit ----------

export default {
  id: 'nl.patchkamer.euclidean', name: 'Euclidean Rhythms', version: '1.17.0', about: { nl: 'Euclidische ritmes: acht rijen die slagen zo gelijk mogelijk over stappen verdelen, voor trigs of noten.\n\nVerdeel slagen zo gelijk mogelijk over stappen: 3 over 8, 5 over 12, 7 over 16. Elke rij is een spoor; samen maken ze polyritmes. Trek de uitgang naar een drumapparaat (trigs) of naar een synth (noten). Met een toetsenbord op Notes in speel je de gekozen rij live.\n\nStappen = lengte van de rij, Slagen = hoeveel daarvan klinken (zo gelijk mogelijk verdeeld), Rotatie = waar de rij begint. Accent: zoveel slagen klinken hard, ook die zijn euclidisch verdeeld; Ghost notes zijn zachte slagen tussen de rest. Fill: elke N-de maat extra slagen (dubbel) of trillers (ratchet). Mutatie: de rij verspringt soms een maat lang. Rij-nummer aanklikken = kiezen voor het live spelen, de noot en de notenlengte (bij Uitgang = Noot).', en: 'Euclidean rhythms: eight rows that spread beats as evenly as possible over steps, for trigs or notes.\n\nSpread pulses as evenly as possible over steps: 3 over 8, 5 over 12, 7 over 16. Each row is a track; together they make polyrhythms. Connect the output to a drum machine (trigs) or to a synth (notes). A keyboard on Notes in plays the selected row live.\n\nSteps = length of the row, Pulses = how many of them sound (spread as evenly as possible), Rotation = where the row starts. Accents: this many pulses sound hard, also spread euclidean; ghost notes are soft hits between the rest. Fill: every Nth bar extra pulses (double) or rolls (ratchet). Mutation: the row sometimes shifts for a bar. Click a row number to choose it for live play, the note and the note length (when Out = Note).' }, kind: 'utility', category: 'sequencer',
  ui: { width: 900, minWidth: 420 },
  ports: { audioIn: [], audioOut: [], eventIn: [{ id: 'reset', name: 'Reset' }, { id: 'keys', name: 'Notes in' }], eventOut: [{ id: 'trigs', name: 'Trigs / notes' }], modIn: [], modOut: [] },
  i18n: { nl: { ports: { reset: 'Reset', keys: 'Noten in', trigs: 'Trigs / noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = ukClamp, NR = 8;
    const DIVS = [['4', '1/64'], ['3', '1/32 triool'], ['2', '1/32'], ['1.5', '1/16 triool'], ['1', '1/16'], ['0.75', '1/8 triool'], ['0.5', '1/8'], ['0.25', '1/4']];
    const FILLS = [['0', 'Geen'], ['2', '2'], ['4', '4'], ['8', '8']];
    const CURVES = [['flat', 'Vlak'], ['up', 'Crescendo'], ['down', 'Decrescendo'], ['arch', 'Boog']];
    const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'], nn = n => NOTE_NAMES[n % 12] + (Math.floor(n / 12) - 1);
    const ROWDEF = { swing: 0, gate: 0.5, accVel: 1, softVel: 0.75, ghost: 0, ghostVel: 0.35, curveAmt: 0, human: 0 };
    const row = (on, steps, pulses, rot, out, o = {}) => ({ on, steps, pulses, rot, div: '1', out, note: 60, vel: 0.8, acc: 0, prob: 1, fill: '0', fillMode: 'dubbel', mut: 0, ...ROWDEF, curve: 'flat', ...o });
    const PRESETS = {
      'Drum kit': () => [row(true, 16, 4, 0, 'ch1', { acc: 1 }), row(true, 8, 3, 1, 'ch2'), row(true, 12, 5, 0, 'ch3', { prob: 0.85 }), row(true, 16, 2, 4, 'ch4'), row(true, 16, 9, 0, 'ch5', { acc: 3, vel: 0.6 }), row(true, 7, 3, 0, 'ch6', { div: '0.5' }), row(true, 16, 1, 14, 'ch7', { fill: '4', fillMode: 'ratchet' }), row(true, 13, 4, 2, 'ch8', { mut: 0.3, prob: 0.7 })],
      'Afro-Cuban': () => [row(true, 8, 3, 0, 'ch1', { acc: 1 }), row(true, 8, 5, 0, 'ch2'), row(true, 16, 4, 2, 'ch3'), row(true, 16, 7, 0, 'ch5', { acc: 2, vel: 0.6 }), row(true, 12, 5, 0, 'ch4', { div: '1.5' }), row(false, 16, 0, 0, 'ch6'), row(false, 16, 0, 0, 'ch7'), row(false, 16, 0, 0, 'ch8')],
      'Bembe (7 over 12)': () => [row(true, 12, 7, 0, 'ch3', { div: '1.5', acc: 2 }), row(true, 12, 4, 0, 'ch1', { div: '1.5' }), row(true, 12, 3, 2, 'ch4', { div: '1.5' }), row(true, 12, 6, 1, 'ch5', { div: '1.5', vel: 0.5 }), row(false, 16, 0, 0, 'ch2'), row(false, 16, 0, 0, 'ch6'), row(false, 16, 0, 0, 'ch7'), row(false, 16, 0, 0, 'ch8')],
      'Polyrhythm 3·4·5·7': () => [row(true, 3, 1, 0, 'ch1', { div: '0.25' }), row(true, 4, 1, 0, 'ch2', { div: '0.25' }), row(true, 5, 1, 0, 'ch3', { div: '0.25' }), row(true, 7, 1, 0, 'ch4', { div: '0.25' }), row(true, 16, 16, 0, 'ch5', { acc: 4, vel: 0.45 }), row(false, 16, 0, 0, 'ch6'), row(false, 16, 0, 0, 'ch7'), row(false, 16, 0, 0, 'ch8')],
      'Techno': () => [row(true, 16, 4, 0, 'ch1'), row(true, 16, 2, 4, 'ch2', { fill: '4' }), row(true, 16, 4, 2, 'ch3', { acc: 4 }), row(true, 16, 3, 3, 'ch6'), row(true, 16, 11, 0, 'ch7', { acc: 4, vel: 0.5, prob: 0.9 }), row(true, 16, 5, 7, 'ch5', { mut: 0.25 }), row(false, 16, 0, 0, 'ch4'), row(false, 16, 0, 0, 'ch8')],
      'IDM stutter': () => [row(true, 16, 5, 0, 'ch1', { mut: 0.4, fill: '2', fillMode: 'ratchet' }), row(true, 11, 4, 0, 'ch2', { div: '2', prob: 0.8 }), row(true, 13, 6, 3, 'ch3', { div: '2', mut: 0.5, acc: 2 }), row(true, 9, 2, 0, 'ch4', { div: '1.5' }), row(true, 32, 13, 0, 'ch5', { div: '2', vel: 0.5, acc: 3 }), row(true, 7, 2, 1, 'ch8', { prob: 0.6 }), row(true, 5, 2, 0, 'ch6', { div: '0.75' }), row(true, 15, 1, 0, 'ch7', { fill: '2' })],
      'Melodic (notes)': () => [row(true, 8, 3, 0, 'noot', { note: 45, gate: 0.9 }), row(true, 8, 5, 2, 'noot', { note: 57, vel: 0.6 }), row(true, 12, 5, 0, 'noot', { note: 64, div: '1.5', vel: 0.55 }), row(true, 16, 3, 5, 'noot', { note: 67, vel: 0.5 }), row(true, 7, 2, 0, 'noot', { note: 72, div: '0.5', vel: 0.45 }), row(false, 16, 0, 0, 'noot', { note: 76 }), row(false, 16, 0, 0, 'ch7'), row(false, 16, 0, 0, 'ch8')],
    };
    const PNAMES = Object.keys(PRESETS), CUSTOM = 'Custom', RUNFIELDS = ['sel', 'run'];
    function cleanRow(r, i) { const d = PRESETS['Drum kit']()[i]; r = r && typeof r === 'object' ? r : d; const steps = Math.round(ukFinite(r.steps, d.steps, 1, 32)); const out = r.out === 'note' ? 'noot' : r.out;
      return { on: r.on !== undefined ? !!r.on : d.on, steps, pulses: Math.round(ukFinite(r.pulses, d.pulses, 0, steps)), rot: Math.round(ukFinite(r.rot, d.rot, 0, steps - 1)), div: DIVS.some(x => x[0] === r.div) ? r.div : '1',
        out: /^ch[1-8]$|^noot$/.test(out) ? out : d.out, note: Math.round(ukFinite(r.note, 60, 0, 127)), vel: ukFinite(r.vel, 0.8, 0.05, 1), acc: Math.round(ukFinite(r.acc, 0, 0, 32)), prob: ukFinite(r.prob, 1, 0, 1),
        fill: FILLS.some(x => x[0] === r.fill) ? r.fill : '0', fillMode: ['dubbel', 'ratchet'].includes(r.fillMode) ? r.fillMode : 'dubbel', mut: ukFinite(r.mut, 0, 0, 1), gate: ukFinite(r.gate, ROWDEF.gate, 0.05, 4),
        accVel: ukFinite(r.accVel, ROWDEF.accVel, 0.05, 1), softVel: ukFinite(r.softVel, ROWDEF.softVel, 0.05, 1), ghost: Math.round(ukFinite(r.ghost, 0, 0, 32)), ghostVel: ukFinite(r.ghostVel, ROWDEF.ghostVel, 0.05, 1),
        curve: CURVES.some(x => x[0] === r.curve) ? r.curve : 'flat', curveAmt: ukFinite(r.curveAmt, 0, 0, 1), human: ukFinite(r.human, 0, 0, 1), swing: ukFinite(r.swing, ROWDEF.swing, 0, 0.5) }; }
    function normalize(raw) { const s = raw && typeof raw === 'object' ? raw : {}, p = LEGACY_PRESETS[s.preset] || s.preset;
      return { preset: PNAMES.includes(p) || p === CUSTOM ? p : PNAMES[0], run: s.run !== undefined ? !!s.run : true, sel: Math.round(ukFinite(s.sel, 0, 0, NR - 1)), live: s.live !== undefined ? !!s.live : true,
      rows: Array.from({ length: NR }, (_, i) => cleanRow(Array.isArray(s.rows) ? s.rows[i] : undefined, i)) }; }
    let state = normalize({}), dead = false, offset = 0, lastAbs = -1; const cur = new Array(NR).fill(-1), flash = new Array(NR).fill(0), liveHeld = new Map();
    // euclidisch patroon (Bresenham-vorm, gelijk aan Bjorklund op rotatie na), met verschuiving
    const euclid = (n, k, rot) => { const p = new Array(n).fill(0); if (k <= 0) return p; for (let i = 0; i < n; i++) p[i] = ((i * k) % n) < k ? 1 : 0; return p.map((_, i) => p[((i - rot) % n + n) % n]); };
    const hash = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
    function rowPattern(r, i, bar) { let k = r.pulses, rot = r.rot; const isFill = +r.fill > 0 && bar % +r.fill === +r.fill - 1;
      if (isFill && r.fillMode === 'dubbel') k = Math.min(r.steps, Math.max(k + 1, Math.round(k * 1.6)));
      if (r.mut > 0 && hash(bar, i + 1) < r.mut) rot += hash(bar, i + 11) < 0.5 ? 1 : -1;
      return { p: euclid(r.steps, k, rot), k, ratchet: isFill && r.fillMode === 'ratchet' }; }
    // per slag: accent of ghost note. Accenten zijn euclidisch over de slagen verdeeld, de ghost notes euclidisch over de overige slagen.
    function levels(r, pat) { const k = pat.reduce((a, b) => a + b, 0), acc = new Array(pat.length).fill(false), ghost = new Array(pat.length).fill(false); let h = 0; const rest = [];
      for (let j = 0; j < pat.length; j++) { if (!pat[j]) continue; if (r.acc && k && ((h * r.acc) % k) < r.acc) acc[j] = true; else rest.push(j); h++; }
      const m = rest.length, g = Math.min(r.ghost, m); if (g > 0) rest.forEach((j, q) => { if (((q * g) % m) < g) ghost[j] = true; });
      return { acc, ghost }; }
    function shape(r, idx) { if (!r.curveAmt || r.curve === 'flat') return 1; const pos = r.steps > 1 ? idx / (r.steps - 1) : 0, s = r.curve === 'up' ? pos : r.curve === 'down' ? 1 - pos : Math.sin(Math.PI * pos); return 1 - r.curveAmt * (1 - s); }
    function hitVel(r, lv, idx) { const base = lv.acc[idx] ? r.accVel : lv.ghost[idx] ? r.vel * r.ghostVel : r.vel * (r.acc ? r.softVel : 1); return clamp(base * shape(r, idx), 0.05, 1); }
    function emit(r, time, vel, dur) { try { if (r.out === 'noot') host.emit(self, 'trigs', { type: 'note', note: r.note, vel, time, dur }); else host.emit(self, 'trigs', { type: 'trig', lane: r.out, vel, time }); } catch { } }
    // ---------- live spelen via de ingang Notes in: de gekozen rij bepaalt de bestemming ----------
    function liveOff(time) { try { const t = ukFinite(time, ctx.currentTime, 0, 1e9); for (const note of liveHeld.keys()) host.emit(self, 'trigs', { type: 'noteoff', note, vel: 0, time: t }); } catch { } liveHeld.clear(); }
    function setSel(i) { if (i !== state.sel) liveOff(); state.sel = i; }
    function liveIn(e) { try { if (dead || !state.live || !e || typeof e !== 'object') return; const type = String(e.type).toLowerCase(), r = R(state.sel), now = ukFinite(ctx.currentTime, 0, 0, 1e9), time = Math.max(now, ukFinite(e.time, now, 0, 1e9));
      if (type === 'allnotesoff' || type === 'panic') { liveOff(time); return; }
      const nt = Math.round(ukFinite(e.note, -1, 0, 127)); if (nt < 0) return; const vel = ukFinite(e.vel, 0.8, 0, 1);
      if (type === 'noteoff' || (type === 'noteon' && vel <= 0)) { if (liveHeld.has(nt)) { host.emit(self, 'trigs', { type: 'noteoff', note: nt, vel: 0, time }); liveHeld.delete(nt); } return; }
      if (type !== 'note' && type !== 'noteon') return; if (vel <= 0) return;
      if (r.out === 'noot') { const held = e.held === true || type === 'noteon'; host.emit(self, 'trigs', { type: 'note', note: nt, vel, time, dur: held ? 120 : ukFinite(e.dur, 0.25, 0.01, 120), ...(held ? { held: true } : {}) }); if (held) liveHeld.set(nt, true); else liveHeld.delete(nt); }
      else host.emit(self, 'trigs', { type: 'trig', lane: r.out, vel, time }); } catch { } }
    // ---------- UI ----------
    let root = null, ui = {}, cv = null, cs = null, raf = null; const rowEls = [];
    // Klanken van het apparaat achter 'trigs' (contract v1.14): "Spoor k" krijgt de naam op plaats k van het apparaat, de nootkeuze de namen per nootnummer.
    let peerNames = [], namesSig = '';
    function readTarget(list) {
      let names = [];
      try {
        const cs = typeof host.cablesFrom === 'function' ? host.cablesFrom(self, 'trigs') : [], ps = Array.isArray(list) ? list : (typeof host.peers === 'function' ? host.peers(self) : []);
        for (const k of cs) { const p = k && ps.find(x => x && x.id === k.to); if (p && Array.isArray(p.noteNames) && p.noteNames.length) { names = p.noteNames; break; } }
      } catch { names = []; }
      const sig = JSON.stringify(names); if (sig === namesSig) return; namesSig = sig; peerNames = names; labelOuts();
    }
    function labelOuts() {
      if (!root) return;
      const byNote = new Map(); for (const x of peerNames) { const n = Math.round(x.note); if (n >= 0 && n <= 127 && !byNote.has(n)) byNote.set(n, String(x.name)); }
      rowEls.forEach(E => { const v = E.out.value; E.out.innerHTML = ''; [...Array.from({ length: NR }, (_, k) => { const nm = peerNames[k] ? String(peerNames[k].name) : ''; return ['ch' + (k + 1), nm ? (k + 1) + ' · ' + nm : tx('Spoor {0}', k + 1)]; }), ['noot', tx('Noot')]].forEach(([val, t]) => { const o = ukEl(E.out, 'option', '', t); o.value = val; o.title = t; }); E.out.value = v; });
      if (ui.noteSel) { const v = ui.noteSel.value; ui.noteSel.innerHTML = ''; const lo = 0, hi = 127; let into = ui.noteSel;
        if (byNote.size) { const g1 = ukEl(ui.noteSel, 'optgroup'); g1.label = tx('Klanken van de drumcomputer'); for (const [n, name] of byNote) { const o = ukEl(g1, 'option', '', nn(n) + ' · ' + name); o.value = String(n); } into = ukEl(ui.noteSel, 'optgroup'); into.label = tx('Alle noten'); }
        for (let n = lo; n <= hi; n++) { const o = ukEl(into, 'option', '', byNote.has(n) ? nn(n) + ' · ' + byNote.get(n) : nn(n)); o.value = String(n); } ui.noteSel.value = v; }
    }
    // ---- klembord: momentopname van de eerste maat (gekozen rij of alle sporen) ----
    const clipR3 = x => Math.round(ukClamp(x, 0.01, 1) * 1000) / 1000;
    function clipRow(r, i) {
      const rate = +r.div, tickT = 12 / rate, len = Math.max(1, Math.min(12288, Math.round(r.steps * tickT))), { p } = rowPattern(r, i, 0), lv = levels(r, p), hits = [];
      for (let k = 0; k < r.steps; k++) { if (!p[k]) continue; const t = Math.round(k * tickT); if (t >= len) continue; const h = { t, vel: clipR3(hitVel(r, lv, k)) }; if (lv.acc[k]) h.acc = true; if (r.prob < 1) h.prob = clipR3(r.prob); hits.push(h); }
      return { len, tickT, hits };
    }
    function clipBuild() {
      const sel = R(state.sel), src = { device: 'nl.patchkamer.euclidean', name: 'Euclidean Rhythms', version: '1.15.0', scheme: 'device' }, nat = { device: 'nl.patchkamer.euclidean', data: { snapshot: true } };
      const gridOf = ev => ev.every(e => e.t % 12 === 0) ? 16 : ev.every(e => e.t % 6 === 0) ? 32 : 64, sw = Math.min(0.5, sel.swing || 0);
      if (sel.out === 'noot') {
        if (!sel.on) return null; const c = clipRow(sel, state.sel), notes = c.hits.map(h => { const o = { t: h.t, n: sel.note, len: Math.max(1, Math.round(c.tickT * sel.gate)), vel: h.vel }; if (h.acc) o.acc = true; if (h.prob != null) o.prob = h.prob; return o; });
        notes.forEach(o => { o.len = Math.min(o.len, c.len - o.t); });
        const clip = { format: 'patchkamer-clip', formatVersion: 1, kind: 'notes', name: tx('Rij {0}', state.sel + 1), length: c.len, grid: gridOf(notes), source: { ...src, scheme: 'gm' }, notes, native: nat }; if (sw > 0) clip.swing = sw; return clip;
      }
      const lanes = [], hits = [], seen = new Set(); let max = 1;
      state.rows.forEach((r, i) => {
        if (!r.on || !/^ch[1-8]$/.test(r.out) || seen.has(r.out) || r.steps < 1) return; seen.add(r.out); const k = +r.out.slice(2) - 1, pn = peerNames[k], c = clipRow(r, i);
        const li = lanes.length; lanes.push({ id: r.out, name: (pn && pn.name ? String(pn.name) : tx('Spoor {0}', k + 1)).slice(0, 40), type: '', note: pn && Number.isFinite(pn.note) ? Math.round(ukClamp(pn.note, 0, 127)) : -1, length: c.len });
        max = Math.max(max, c.len); c.hits.forEach(h => hits.push({ ...h, lane: li }));
      });
      if (!lanes.length) return null; hits.sort((a, b) => a.t - b.t || a.lane - b.lane);
      const clip = { format: 'patchkamer-clip', formatVersion: 1, kind: 'drums', name: tx('Alle sporen'), length: max, grid: gridOf(hits), source: src, lanes, hits: hits.slice(0, 4096), native: nat }; if (sw > 0) clip.swing = sw; return clip;
    }
    function mount(el) { unmount(); root = el; const app = ukShadow(el, UK_CSS('var(--event,#ffd166)') + `
.rows{display:grid;gap:4px;margin-top:8px}.rh,.r{display:grid;grid-template-columns:34px 30px 58px 58px 58px 88px 82px minmax(60px,1fr) 58px minmax(60px,1fr) 112px minmax(56px,1fr);gap:5px;align-items:center}
.rh{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#97a1ad)} .r select,.r input[type=number]{padding:4px;font-size:11px;width:100%}
.r .nr{font-family:var(--mono,monospace);font-size:11px;text-align:center;border-radius:4px;padding:4px 0;cursor:pointer;color:#111} .r.sel .nr{outline:2px solid var(--u-acc)}
.r .tog{padding:4px 0;font-size:11px} .r input[type=range]{height:18px}
.wrapx{overflow-x:auto} .vis{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:12px;align-items:start}
.pv{font-family:var(--mono,monospace);font-size:12px;line-height:1.7;white-space:pre;color:var(--muted,#97a1ad);overflow:hidden}
.strip{margin-top:10px}
@container (max-width:640px){.vis{grid-template-columns:1fr}}`);
      const top = ukEl(app, 'div', 'top');
      ui.preset = ukSelect(top, tx('Voorbeeld'), PNAMES.map(k => [k, k]).concat([[CUSTOM, tx('Eigen')]]), state.preset, v => { if (PRESETS[v]) { const k = state.sel, run = state.run; self.setState({ ...state, preset: v, rows: PRESETS[v](), sel: k, run }); } });
      const rl = ukEl(top, 'label', 'sel'); ukEl(rl, 'span', '', tx('Loopt')); ui.run = ukEl(rl, 'button'); ui.run.type = 'button'; ui.run.onclick = () => { state.run = !state.run; paint(); };
      const ll = ukEl(top, 'label', 'sel'); ukEl(ll, 'span', '', tx('Live spelen')); ui.live = ukEl(ll, 'button'); ui.live.type = 'button'; ui.live.onclick = () => { state.live = !state.live; if (!state.live) liveOff(); paint(); };
      const rs = ukEl(top, 'button', '', tx('Terug naar het begin')); rs.type = 'button'; rs.title = tx('alle rijen beginnen opnieuw (kan ook met een trig op de ingang Reset)'); rs.onclick = () => { offset = lastAbs + 1; };
      const rnd = ukEl(top, 'button', '', tx('Verras')); rnd.type = 'button'; rnd.title = tx('willekeurige verdelingen voor de rijen die aan staan'); rnd.onclick = () => { state.rows.forEach(r => { if (!r.on) return; r.steps = [5, 7, 8, 9, 11, 12, 13, 16, 16, 16][Math.floor(Math.random() * 10)]; r.pulses = 1 + Math.floor(Math.random() * Math.max(1, r.steps * 0.6)); r.rot = Math.floor(Math.random() * r.steps); }); eigen(); paint(); };
      const vis = ukEl(app, 'div', 'vis'); cv = ukEl(vis, 'canvas'); cv.setAttribute('aria-label', tx('ringen: elke rij is een ring, de slagen zijn stippen')); ui.pv = ukEl(vis, 'div', 'pv');
      cs = ukEl(app, 'canvas', 'strip'); cs.setAttribute('aria-label', tx('staafjes: hoogte is de velocity, breedte is de notenlengte van de gekozen rij'));
      const wrap = ukEl(app, 'div', 'wrapx'), rows = ukEl(wrap, 'div', 'rows'), hd = ukEl(rows, 'div', 'rh'); ['Rij', 'Aan', 'Stappen', 'Slagen', 'Rotatie', 'Tempo', 'Uitgang', 'Velocity', 'Accent', 'Kans', 'Fill', 'Mutatie'].forEach(t => ukEl(hd, 'span', '', tx(t)));
      rowEls.length = 0;
      for (let i = 0; i < NR; i++) { const r = ukEl(rows, 'div', 'r'), E = {}, lbl = k => tx(k) + ' ' + tx('rij {0}', i + 1);
        E.nr = ukEl(r, 'span', 'nr', String(i + 1)); E.nr.onclick = () => { setSel(i); paint(); };
        E.on = ukEl(r, 'button', 'tog'); E.on.type = 'button'; E.on.onclick = () => { R(i).on = !R(i).on; eigen(); paint(); };
        const num = (get, setv, label) => { const s = ukEl(r, 'select'); s.setAttribute('aria-label', lbl(label)); s.onchange = () => { setv(+s.value); eigen(); paint(); }; return { s, fill(mn, mx) { const v = get(); s.innerHTML = ''; for (let k = mn; k <= mx; k++) { const o = ukEl(s, 'option', '', String(k)); o.value = k; } s.value = String(v); } }; };
        E.steps = num(() => R(i).steps, v => { const x = R(i); x.steps = v; x.pulses = Math.min(x.pulses, v); x.rot = Math.min(x.rot, v - 1); }, 'stappen');
        E.pulses = num(() => R(i).pulses, v => { R(i).pulses = v; }, 'slagen');
        E.rot = num(() => R(i).rot, v => { R(i).rot = v; }, 'rotatie');
        E.div = ukEl(r, 'select'); DIVS.forEach(([v, t]) => { const o = ukEl(E.div, 'option', '', tx(t)); o.value = v; }); E.div.setAttribute('aria-label', lbl('Tempo')); E.div.onchange = () => { R(i).div = E.div.value; eigen(); paint(); };
        E.out = ukEl(r, 'select'); [...Array.from({ length: 8 }, (_, k) => ['ch' + (k + 1), tx('Spoor {0}', k + 1)]), ['noot', tx('Noot')]].forEach(([v, t]) => { const o = ukEl(E.out, 'option', '', t); o.value = v; }); E.out.setAttribute('aria-label', lbl('Uitgang')); E.out.onchange = () => { R(i).out = E.out.value; eigen(); paint(); };
        const rng = (field, min, max, label, def, tip) => { const s = ukEl(r, 'input'); s.type = 'range'; s.min = min; s.max = max; s.step = 0.01; s.value = def; s.dataset.pkDefault = String(def); s.setAttribute('aria-label', lbl(label)); if (tip) s.title = tx(tip); s.oninput = () => { R(i)[field] = +s.value; eigen(); }; return s; };
        E.vel = rng('vel', 0.05, 1, 'velocity', 0.8);
        E.acc = num(() => R(i).acc, v => { R(i).acc = v; }, 'accenten');
        E.prob = rng('prob', 0, 1, 'kans', 1); E.prob.oninput = () => { R(i).prob = +E.prob.value; eigen(); paint(); };
        E.fill = ukEl(r, 'select'); [['0', tx('Geen')], ['2', tx('{0} m · dubbel', 2)], ['4', tx('{0} m · dubbel', 4)], ['8', tx('{0} m · dubbel', 8)], ['2r', tx('{0} m · ratchet', 2)], ['4r', tx('{0} m · ratchet', 4)], ['8r', tx('{0} m · ratchet', 8)]].forEach(([v, t]) => { const o = ukEl(E.fill, 'option', '', t); o.value = v; });
        E.fill.setAttribute('aria-label', lbl('Fill'));
        E.fill.onchange = () => { const v = E.fill.value; R(i).fill = v.replace('r', ''); R(i).fillMode = v.endsWith('r') ? 'ratchet' : 'dubbel'; eigen(); };
        E.mut = rng('mut', 0, 1, 'mutatie', 0, 'kans per maat dat de rij een stap verspringt');
        E.row = r; rowEls.push(E); }
      ui.selH = ukEl(app, 'h3', '', '');
      const ed = ukEl(app, 'div', 'top');
      ui.noteSel = ukSelect(ed, tx('Noot van de gekozen rij'), Array.from({ length: 128 }, (_, k) => [k, nn(k)]), 60, v => { R(state.sel).note = +v; eigen(); });
      ui.curve = ukSelect(ed, tx('Verloop'), CURVES.map(([v, t]) => [v, tx(t)]), 'flat', v => { R(state.sel).curve = v; eigen(); });
      const SP = { swing: { name: tx('Swing'), min: 0, max: 0.5, step: 0.01, unit: '%', tip: tx('extra vertraging van slagen op een oneven zestiende, bovenop de swing van de host (alleen rasters van 1/16 en sneller)') },
        gate: { name: tx('Notenlengte'), min: 0.05, max: 4, step: 0.01, unit: 'x', tip: tx('lengte van de noot als deel van een rasterstap van de rij (tot 4: legato en overlap); bij trigs zonder effect') },
        accVel: { name: tx('Accentsterkte'), min: 0.05, max: 1, step: 0.01, unit: '%', tip: tx('sterkte van de accenten') },
        softVel: { name: tx('Zachte slagen'), min: 0.05, max: 1, step: 0.01, unit: '%', tip: tx('sterkte van de overige slagen in een rij met accenten') },
        ghost: { name: tx('Ghost notes'), min: 0, max: 32, step: 1, unit: 'int', tip: tx('zoveel niet-accent slagen worden ghost notes, euclidisch verdeeld') },
        ghostVel: { name: tx('Ghost-sterkte'), min: 0.05, max: 1, step: 0.01, unit: '%', tip: tx('velocity van de ghost notes ten opzichte van de rij-velocity') },
        curveAmt: { name: tx('Verloopdiepte'), min: 0, max: 1, step: 0.01, unit: '%', tip: tx('hoeveel het verloop uitmaakt') },
        human: { name: tx('Menselijk'), min: 0, max: 1, step: 0.01, unit: '%', tip: tx('willekeurige variatie in velocity en lengte') } };
      ui.sl = ukSliders(app, SP, (id, v) => { R(state.sel)[id] = id === 'ghost' ? Math.round(v) : v; eigen(); }, ROWDEF, tx(' · dubbelklik: standaard'));
      namesSig = ''; readTarget(); paint(); raf = host.frame(self, draw, 30); }
    const R = i => state.rows[i];
    function eigen() { if (state.preset !== CUSTOM) { state.preset = CUSTOM; if (ui.preset) ui.preset.value = CUSTOM; } }
    function paint() { if (!root) return; ui.preset.value = state.preset; ui.run.textContent = state.run ? tx('Aan') : tx('Uit'); ui.run.classList.toggle('on', state.run); ui.live.textContent = state.live ? tx('Aan') : tx('Uit'); ui.live.classList.toggle('on', state.live);
      rowEls.forEach((E, i) => { const r = R(i); E.row.classList.toggle('sel', i === state.sel); E.on.textContent = r.on ? '●' : '○'; E.on.classList.toggle('on', r.on); E.row.style.opacity = r.on ? 1 : 0.5;
        E.steps.fill(1, 32); E.pulses.fill(0, r.steps); E.rot.fill(0, r.steps - 1); E.div.value = r.div; E.out.value = r.out; E.vel.value = r.vel; E.acc.fill(0, Math.max(0, r.pulses)); E.prob.value = r.prob;
        E.fill.value = r.fill === '0' ? '0' : r.fill + (r.fillMode === 'ratchet' ? 'r' : ''); E.mut.value = r.mut; E.nr.style.background = `hsl(${i * 45},70%,${r.on ? 55 : 30}%)`; });
      const s = R(state.sel); ui.selH.textContent = tx('Gekozen rij {0}', state.sel + 1);
      ui.noteSel.value = String(s.note); ui.curve.value = s.curve; ui.noteSel.parentElement.style.opacity = s.out === 'noot' ? 1 : 0.4; for (const id of Object.keys(ui.sl)) ui.sl[id].set(s[id]);
      ui.pv.textContent = state.rows.map((r, i) => `${i + 1} ${r.on ? '' : tx('(uit)') + ' '}${r.pulses}/${r.steps}${r.rot ? ' ↻' + r.rot : ''}  ` + euclid(r.steps, r.pulses, r.rot).map(x => x ? '●' : '·').join('')).join('\n'); }
    function draw() { if (dead || !cv) return; const { g, w, h } = ukCanvas(cv, 280); if (g) { g.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) / 2 - 8, now = performance.now(), flashCol = ukVar(cv, '--fg', '#fff');
        const act = state.rows.map((r, i) => [r, i]).filter(([r]) => r.on && r.steps > 0);
        act.forEach(([r, i], k) => { const rad = R0 * (1 - k / Math.max(1, act.length) * 0.82); const pat = euclid(r.steps, r.pulses, r.rot), lv = levels(r, pat), col = `hsl(${i * 45},70%,60%)`;
          g.strokeStyle = col; g.globalAlpha = 0.25; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, rad, 0, 7); g.stroke(); g.globalAlpha = 1;
          if (r.pulses > 1) { g.strokeStyle = col; g.globalAlpha = 0.35; g.beginPath(); let first = true; pat.forEach((v, j) => { if (!v) return; const a = -Math.PI / 2 + j / r.steps * 2 * Math.PI, x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad; first ? g.moveTo(x, y) : g.lineTo(x, y); first = false; }); g.closePath(); g.stroke(); g.globalAlpha = 1; }
          pat.forEach((v, j) => { const a = -Math.PI / 2 + j / r.steps * 2 * Math.PI, x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad, isCur = cur[i] === j;
            g.fillStyle = v ? col : 'rgba(128,128,128,0.35)'; g.globalAlpha = v && lv.ghost[j] ? 0.55 : 1; const big = v ? (lv.acc[j] ? 5.5 : lv.ghost[j] ? 3 : 4) : 2; g.beginPath(); g.arc(x, y, isCur ? big + 2.5 : big, 0, 7); g.fill(); g.globalAlpha = 1;
            if (isCur && v && now >= flash[i] && now - flash[i] < 120) { g.strokeStyle = flashCol; g.lineWidth = 2; g.beginPath(); g.arc(x, y, big + 5, 0, 7); g.stroke(); } }); }); }
      drawStrip(); }
    // staafjes van de gekozen rij: hoogte = velocity van de slag, breedte = notenlengte (gate) binnen de rasterstap
    function drawStrip() { if (!cs) return; const { g, w, h } = ukCanvas(cs, 84); if (!g) return; g.clearRect(0, 0, w, h); const r = R(state.sel), i = state.sel, col = `hsl(${i * 45},70%,60%)`, muted = ukVar(cs, '--muted', '#97a1ad');
      const pat = euclid(r.steps, r.pulses, r.rot), lv = levels(r, pat), cw = (w - 8) / r.steps; g.strokeStyle = muted; g.globalAlpha = 0.25; g.lineWidth = 1; g.beginPath(); g.moveTo(4, h - 4.5); g.lineTo(w - 4, h - 4.5); g.stroke(); g.globalAlpha = 1;
      for (let j = 0; j < r.steps; j++) { const x = 4 + j * cw; if (!pat[j]) { g.fillStyle = muted; g.globalAlpha = 0.3; g.fillRect(x + cw / 2 - 1, h - 6, 2, 2); g.globalAlpha = 1; continue; }
        const v = hitVel(r, lv, j), bw = Math.max(2, Math.min(cw * r.gate, w - 4 - x) - 1), bh = Math.max(2, v * (h - 12)); g.fillStyle = col; g.globalAlpha = lv.ghost[j] ? 0.5 : 1; g.fillRect(x, h - 5 - bh, bw, bh); g.globalAlpha = 1; } }
    function unmount() { if (raf) raf(); raf = null; if (root) root.innerHTML = ''; root = null; ui = {}; cv = null; cs = null; rowEls.length = 0; }
    const self = {
      inputs: {}, outputs: {},
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; const sd = ukFinite(info.stepDur, 0.125, 0.01, 2), t = ukFinite(info.time, ctx.currentTime, 0, 1e9);
          const abs0 = Number.isFinite(info.bar) ? clamp(info.bar, -1e7, 1e7) * 16 + (info.step | 0) : lastAbs + 1; lastAbs = abs0; const abs = abs0 - offset; if (!state.run) { cur.fill(-1); return; }
          state.rows.forEach((r, i) => { if (!r.on || r.steps < 1) return; const rate = +r.div, from = Math.ceil(abs * rate - 1e-9), to = (abs + 1) * rate;
            for (let k = from; k < to - 1e-9; k++) { const bar = Math.floor(k / (16 * rate)), { p, ratchet } = rowPattern(r, i, bar), idx = ((k % r.steps) + r.steps) % r.steps; cur[i] = idx;
              if (!p[idx] || Math.random() >= r.prob) continue; const time = t + (k / rate - abs) * sd, tick = sd / rate; let vel = hitVel(r, levels(r, p), idx), dur = tick * r.gate;
              if (r.human > 0) { vel = clamp(vel * (1 + (Math.random() - 0.5) * r.human * 0.6), 0.05, 1); dur *= 1 + (Math.random() - 0.5) * r.human * 0.4; }
              flash[i] = performance.now() + Math.max(0, (time - ctx.currentTime) * 1000);
              const sw = r.swing > 0 ? Math.min(0.5, r.swing) : 0, p0 = k / rate + offset, sh = q => (sw > 0 && Math.floor(p0 + q + 1e-9) % 2 === 1 ? sw * sd : 0);
              if (ratchet) { emit(r, time + sh(0), vel, tick * 0.4); emit(r, time + tick / 2 + sh(0.5 / rate), vel * 0.8, tick * 0.4); } else emit(r, time + sh(0), vel, dur); } });
           } catch { } },
      onPeers(list) { if (!dead) readTarget(list); },
      onTransport(info) { try { if (!info?.playing) { cur.fill(-1); offset = 0; lastAbs = -1; } } catch { } },
      onEvent(port, e) { try { if (port === 'reset' && e && ['trig', 'note', 'noteon'].includes(String(e.type).toLowerCase())) offset = lastAbs + 1; else if (port === 'keys') liveIn(e); } catch { } },
      // ---- klembord (contract v1.17, §13d): alleen kopiëren, als momentopname van de eerste maat; plakken kan niet (het ritme volgt uit getallen) ----
      // Staat de gekozen rij op Noot, dan is de kopie een notes-clip van die rij; anders een drums-clip van alle rijen die aan staan en naar een spoor (ch1 … ch8) gaan, elke baan met de eigen lengte (polymeter).
      clipInfo() { try { if (dead) return null; const c = clipBuild(); return c ? { name: c.name, copy: [c.kind], paste: [], length: { min: 1, max: 12288, step: 1, current: c.length, shared: false }, grid: [16, 32, 64], scheme: 'device', vel: 'continuous', prob: true, ratchet: false } : { name: tx('Euclidean Rhythms'), copy: [], paste: [] }; } catch { return null; } },
      getClip() { try { if (dead) return null; const c = clipBuild(); return c ? JSON.parse(JSON.stringify(c)) : null; } catch { return null; } },
      setClip(clip) { try { if (dead) return { ok: false, reason: tx('Het apparaat is verwijderd.') };
          // de eigen momentopname terugplakken laat alles zoals het is; al het andere kan niet (de rijen zijn getallen, geen stappenlijst)
          if (clip && typeof clip === 'object' && clip.format === 'patchkamer-clip' && clip.native && typeof clip.native === 'object' && clip.native.device === 'nl.patchkamer.euclidean') return { ok: true };
          return { ok: false, reason: tx('Euclidean Rhythms kan alleen kopiëren: het ritme volgt uit getallen (stappen, slagen, rotatie) en heeft geen stappenlijst om te plakken.') };
        } catch { return { ok: false, reason: tx('Geen geldige clip.') }; } },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(raw) { if (dead) return; const prev = state.sel; state = normalize(raw); if (state.sel !== prev || !state.live) liveOff(); paint(); },
      getPreset() { const p = self.getState(); for (const k of RUNFIELDS) delete p[k]; return p; },
      setPreset(p) { if (dead) return; const keep = {}; for (const k of RUNFIELDS) keep[k] = state[k]; self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      destroy() { if (dead) return; liveOff(); dead = true; unmount(); },
    };
    return self;
  },
};
