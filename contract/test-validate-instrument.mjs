// test-validate-instrument.mjs — testgevallen voor de regelaarscontroles en de dekking van params() van validate-instrument.mjs (contract v1.15) het klembord (clipInfo/getClip/setClip, v1.17) en meters (host.ui.meter, v1.18)
// Gebruik / Usage:  node contract/test-validate-instrument.mjs      (exit 0 = alles groen / all green)
// Elk geval is een klein apparaat dat in een tijdelijke map wordt gezet en in beide talen (--lang nl en --lang en) wordt gevalideerd.
// "err" = fragmenten (nl, en) die in de foutmelding moeten staan (exit 1, geen OK-regel).
// "warn" = fragmenten (nl, en) die in de OK-regel als let op / warning moeten staan; zonder "warn" mag er geen enkele waarschuwing staan.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const V = join(dirname(fileURLToPath(import.meta.url)), 'validate-instrument.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'inst-test-'));

// Apparaat met een vrij te kiezen mount-body. `ui.k` (knoppen) en `ui.s` (keuzes) worden door setState bijgewerkt (anders faalt contract §13).
const dev = (body, { lang = false } = {}) => `// SPDX-License-Identifier: MIT
export default {
  id: 'nl.test.ctl', name: 'Ctl', version: '1.0.0', kind: 'effect', modExclude: '*',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [] },
  create(ctx, host) {
    const g = ctx.createGain(); const ui = { k: [], s: [] }; const T = host.lang === 'nl' ? { a: 'Snelheid', b: 'Diepte', c: 'Vorm' } : { a: 'Rate', b: 'Depth', c: 'Shape' };
    const L = ${lang ? "host.lang" : "'x'"};
    return { inputs: { in: g }, outputs: { out: g },
      mount(el) { ${body} },
      getState() { return { v: 1 }; },
      setState(s) { for (const k of ui.k) k.set(0); for (const x of ui.s) x.value = 'a'; },
      destroy() {} };
  }
};
`;
const K = (id, extra = '') => `ui.k.push(host.ui.knob(el, T.a, [0, 1, 0.01], 0.5, v => v, v => {}, { ${id}${extra} }));`;
const SEL = (o = '{}') => `ui.s.push(host.ui.select(el, T.c, [['a', 'A'], ['b', 'B']], 'a', v => {}, ${o}));`;
const IN = (type = 'range', attrs = '') => `const i = document.createElement('input'); i.type = '${type}'; i.min = '0'; i.max = '10'; ${attrs} el.appendChild(i);`;

const cases = [];
// [naam, apparaatbron, { warn: [[nl, en], ...], has: [[nl, en]...] (fragmenten in de uitvoer, ook met --controls), controls: true }]
const ok = (name, src, extra = {}) => cases.push([name, src, extra]);
const warns = (name, src, w, extra = {}) => cases.push([name, src, { ...extra, warn: w }]);
const errs = (name, src, e, extra = {}) => cases.push([name, src, { ...extra, err: e }]);

// ---- zonder waarschuwing
ok('geen host.ui, geen id', dev(`el.appendChild(document.createElement('div'));`));
ok('knop zonder opties (oud gedrag)', dev(`ui.k.push(host.ui.knob(el, T.a, [0, 1, 0.01], 0.5, v => v, v => {}));`));
ok('knop met alleen { default, scale } (v1.8)', dev(`ui.k.push(host.ui.knob(el, T.a, [1, 100, 1], 5, v => v, v => {}, { default: 5, scale: 'log' }));`));
ok('geen enkel id (niet gemigreerd): geen let op', dev(`${K('role: "param"')} ${SEL()}`));
ok('alle ids goed', dev(`${K('id: "rate", role: "param", group: "lfo"')} ${K('id: "depth"', ', group: "lfo"')} ${SEL('{ id: "shape", group: "lfo" }')}`), { has: [['3 regelaars met id', '3 controls with an id']] });
ok('id van 60 tekens mag', dev(K(`id: "${'a'.repeat(60)}"`)));
ok('id met punt, streep en cijfers', dev(`${K('id: "kick.tune-2_a"')} ${K('id: "kick.decay"')}`));
for (const r of ['param', 'fader', 'toggle', 'button', 'pad', 'step', 'display', 'select', 'meter', 'jack']) ok('rol ' + r, dev(K(`id: "x", role: "${r}"`)));
ok('options null mag (zoals geen opties)', dev(`ui.k.push(host.ui.knob(el, T.a, [0, 1, 0.01], 0.5, v => v, v => {}, null));`));
ok('select zonder 6e argument', dev(`ui.s.push(host.ui.select(el, T.c, [['a', 'A']], 'a', v => {}));`));
ok('rebuild na mount met dezelfde id\'s: niet dubbel', dev(`const build = () => { ${K('id: "rate"')} }; build(); el.__later = build; setTimeout(build, 0);`));
ok('id\'s taalonafhankelijk, labels per taal', dev(`${K('id: "rate"')} ui.k.push(host.ui.knob(el, T.b, [0, 1, 0.01], 0.5, v => v, v => {}, { id: "depth" }));`), { controls: true, has: [['Snelheid / Rate', 'Snelheid / Rate'], ['Diepte / Depth', 'Diepte / Depth']] });

// ---- host.ui.adopt en attributen (N1)
ok('adopt op range-input', dev(`${IN()} host.ui.adopt(i, { id: "gain", role: "fader", group: "out", label: "Gain" });`), { has: [['1 regelaars met id', '1 controls with an id']] });
ok('adopt geeft het element terug en zet data-pk-*', dev(`${IN()} const r = host.ui.adopt(i, { id: "gain", group: "out" }); if (r !== i || i.getAttribute('data-pk-id') !== 'gain' || i.getAttribute('data-pk-group') !== 'out' || i.getAttribute('data-pk-role') !== 'param') throw new Error('adopt-contract');`));
ok('adopt op checkbox en button en select', dev(`${IN('checkbox')} host.ui.adopt(i, { id: "on", role: "toggle" }); const b = document.createElement('button'); el.appendChild(b); host.ui.adopt(b, { id: "go", role: "button" }); const s = document.createElement('select'); el.appendChild(s); host.ui.adopt(s, { id: "mode" });`));
ok('attributen op eigen range-input (setAttribute)', dev(`${IN('range', `i.setAttribute('data-pk-id', 'cut'); i.setAttribute('data-pk-role', 'param'); i.setAttribute('data-pk-group', 'filter');`)}`), { controls: true, has: [['cut', 'cut'], ['filter', 'filter']] });
ok('attributen via dataset', dev(`${IN('range', `i.dataset.pkId = 'cut2'; i.dataset.pkRole = 'fader';`)}`), { controls: true, has: [['cut2', 'cut2']] });
ok('gemengd: knop + eigen schuif met id', dev(`${K('id: "a"')} ${IN('range', `i.setAttribute('data-pk-id', 'b');`)}`));

// ---- let op
warns('dubbel id (twee knoppen)', dev(`${K('id: "rate"')} ${K('id: "rate"')}`), [['id "rate" staat bij meer dan één regelaar', 'id "rate" is used by more than one control']]);
warns('dubbel id (knop en keuze)', dev(`${K('id: "x"')} ${SEL('{ id: "x" }')}`), [['id "x" staat bij meer dan één', 'id "x" is used by more than one']]);
warns('dubbel id (knop en attribuut)', dev(`${K('id: "x"')} ${IN('range', `i.setAttribute('data-pk-id', 'x');`)}`), [['id "x" staat bij meer dan één', 'id "x" is used by more than one']]);
warns('dubbel id via adopt', dev(`{ ${IN()} host.ui.adopt(i, { id: "q" }); } { ${IN()} host.ui.adopt(i, { id: "q" }); }`), [['id "q" staat bij meer dan één', 'id "q" is used by more than one']]);
warns('deels ontbrekende id\'s', dev(`${K('id: "a"')} ${K('')}`), [['1 regelaar(s) zonder id terwijl andere er wel een hebben', '1 control(s) without an id while others have one']]);
warns('deels ontbrekende id\'s (keuze zonder)', dev(`${K('id: "a"')} ${SEL()}`), [['zonder id terwijl', 'without an id while']]);
warns('rol buiten de lijst', dev(K('id: "a", role: "slider"')), [['rol "slider" staat niet in de lijst', 'role "slider" is not in the list']]);
warns('rol hoofdletters', dev(K('id: "a", role: "Param"')), [['rol "Param"', 'role "Param"']]);
warns('rol is geen tekst', dev(K('id: "a", role: 5')), [['rol "5"', 'role "5"']]);
ok('id camelCase (envAmt) geldig', dev(`${K('id: "envAmt"')} ${K('id: "fAttack", group: "envAmp"')} ${K('id: "ch3.Vol_A-1"')}`), { controls: true, has: [['envAmt', 'envAmt'], ['fAttack', 'fAttack']] });
ok('id van 60 hoofdletters', dev(K(`id: "${'A'.repeat(60)}"`)));
warns('id met underscore en spatie: spatie blijft fout', dev(K('id: "env amt"')), [['id "env amt" hoort', 'id "env amt" must be']]);
warns('id met ongeldig teken (#)', dev(K('id: "env#amt"')), [['id "env#amt"', 'id "env#amt"']]);
warns('id met spatie', dev(K('id: "my rate"')), [['id "my rate"', 'id "my rate"']]);
warns('id leeg', dev(K('id: ""')), [['id "" hoort', 'id "" must be']]);
warns('id van 61 tekens', dev(K(`id: "${'a'.repeat(61)}"`)), [['hoort 1 tot 60 tekens', 'must be 1 to 60 characters']]);
warns('id is een getal', dev(K('id: 7')), [['id "7"', 'id "7"']]);
warns('id met slash', dev(K('id: "a/b"')), [['id "a/b"', 'id "a/b"']]);
ok('groep met hoofdletters geldig', dev(K('id: "a", group: "envAmp"')));
warns('groep met spatie', dev(K('id: "a", group: "low pass"')), [['groep "low pass"', 'group "low pass"']]);
warns('groep leeg', dev(K('id: "a", group: ""')), [['groep ""', 'group ""']]);
warns('opties zijn een tekst', dev(`ui.k.push(host.ui.knob(el, T.a, [0, 1, 0.01], 0.5, v => v, v => {}, 'rate'));`), [['moeten een object zijn', 'must be an object']]);
warns('opties zijn een lijst (keuze)', dev(SEL('["x"]')), [['moeten een object zijn', 'must be an object']]);
warns('adopt zonder element', dev(`host.ui.adopt(null, { id: "a" });`), [['host.ui.adopt() kreeg geen element', 'host.ui.adopt() received no element']]);
warns('adopt op div (geen model)', dev(`const d = document.createElement('div'); el.appendChild(d); host.ui.adopt(d, { id: "a", label: "Vak" });`), [['heeft geen model', 'has no model']]);
warns('adopt op input type text', dev(`${IN('text')} host.ui.adopt(i, { id: "a" });`), [['heeft geen model', 'has no model']]);
warns('data-pk-id op div', dev(`const d = document.createElement('div'); d.setAttribute('data-pk-id', 'a'); el.appendChild(d);`), [['heeft geen model', 'has no model']]);
warns('data-pk-id op element dat nergens hangt', dev(`const i = document.createElement('input'); i.type = 'range'; i.setAttribute('data-pk-id', 'a');`), [['nergens in de kaart hangt', 'not attached anywhere']]);
warns('data-pk-role buiten de lijst', dev(IN('range', `i.setAttribute('data-pk-id', 'a'); i.setAttribute('data-pk-role', 'knob');`)), [['rol "knob"', 'role "knob"']]);
ok('data-pk-id met hoofdletters geldig', dev(IN('range', `i.setAttribute('data-pk-id', 'envAmt');`)));
warns('data-pk-id met spatie', dev(IN('range', `i.setAttribute('data-pk-id', 'env amt');`)), [['id "env amt"', 'id "env amt"']]);
warns('id hangt van de taal af (= label)', dev(`ui.k.push(host.ui.knob(el, T.a, [0, 1, 0.01], 0.5, v => v, v => {}, { id: T.a.toLowerCase() }));`, { lang: true }), [['verschillen per host.lang', 'differ per host.lang']]);
warns('meerdere waarschuwingen tegelijk', dev(`${K('id: "a", role: "x"')} ${K('id: "a"')} ${K('')}`), [['rol "x"', 'role "x"'], ['staat bij meer dan één', 'is used by more than one'], ['zonder id terwijl', 'without an id while']]);

// ---- --controls
ok('--controls: kop, rijen, gezicht, bereik', dev(`${K('id: "rate", role: "param", group: "lfo"')} ${SEL('{ id: "shape", group: "lfo" }')}`), { controls: true, has: [
  ['id    | rol', 'id    | role'], ['rate  | param  | lfo', 'rate  | param  | lfo'], ['shape | select | lfo', 'shape | select | lfo'], ['0..1', '0..1'], ['rotary', 'rotary'], ['a,b', 'a,b'], ['Regelaars (2):', 'Controls (2):'], ['label nl/en', 'label nl/en']] });
ok('--controls zonder regelaars', dev(`el.appendChild(document.createElement('div'));`), { controls: true, has: [['Regelaars (0):', 'Controls (0):'], ['(geen regelaars', '(no controls']] });
ok('--controls zonder id\'s', dev(K('role: "fader"')), { controls: true, has: [['(zonder id)', '(no id)'], ['fader', 'fader']] });
ok('--controls adopt: gezicht hslider en bereik', dev(`${IN()} host.ui.adopt(i, { id: "gain", role: "fader", label: "Gain" });`), { controls: true, has: [['gain', 'gain'], ['0..10', '0..10'], ['hslider', 'hslider'], ['Gain', 'Gain']] });
ok('--controls: host.ui.list en id op de terugwaarde', dev(`const k = host.ui.knob(el, T.a, [0, 1, 0.01], 0.5, v => v, v => {}, { id: "rate", role: "fader" }); ui.k.push(k); if (k.id !== 'rate') throw new Error('knob().id ontbreekt'); const l = host.ui.list({}); if (!Array.isArray(l) || l.length !== 1 || l[0].id !== 'rate' || l[0].role !== 'fader' || l[0].type !== 'range') throw new Error('list() klopt niet: ' + JSON.stringify(l));`));
ok('--controls: label nl/en door twee taalronden', dev(`${K('id: "rate"')}`, { lang: true }), { controls: true, has: [['Snelheid / Rate', 'Snelheid / Rate']] });
ok('--controls met --host-lang en: kolom blijft nl/en', dev(`${K('id: "rate"')}`, { lang: true }), { controls: true, hostLang: 'en', has: [['Snelheid / Rate', 'Snelheid / Rate']] });

// ---- dekking van params() (§8): continue regelaars horen in params(), of in modExclude
// Apparaat mét echte state: S wordt door de regelaars gezet; params() en modExclude kiest het geval.
const dev2 = ({ kind = 'effect', category = '', def = '', plist = null, body, state = "{ cut: 0.5, res: 0.2, testNote: 60, osc: [{ fine: 0 }, { fine: 0 }, { fine: 0 }], steps: Array.from({ length: 16 }, () => 0) }" }) => `// SPDX-License-Identifier: MIT
export default {
  id: 'nl.test.dek', name: 'Dek', version: '1.0.0', kind: '${kind}', ${category ? `category: '${category}',` : ''} ${def}
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [] },
  create(ctx, host) {
    const g = ctx.createGain(); const ui = { k: [], s: [] }; const S = ${state}; const sel = (o) => ui.s.push(host.ui.select(EL, 'Vorm', [['a', 'A']], 'a', v => {}, o));
    const knob = (id, key = id, label = id) => ui.k.push(host.ui.knob(EL, label, [0, 1, 0.01], 0.5, v => v, v => { S[key] = v; }, id ? { id } : undefined));
    const own = (key, label = '', min = '0', max = '1', role) => { const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = '0.01'; if (label) i.setAttribute('aria-label', label); if (role) i.setAttribute('data-pk-role', role);
      i.oninput = () => { S[key] = +i.value; }; EL.appendChild(i); return i; };
    let EL = null;
    return { inputs: { in: g }, outputs: { out: g },
      mount(el) { EL = el; ${body} },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) { Object.assign(S, JSON.parse(JSON.stringify(s || {}))); for (const k of ui.k) k.set(0); for (const x of ui.s) x.value = 'a'; },
      ${plist === null ? '' : `params() { return [${plist.map(i => `{ id: '${i}', name: '${i}', min: 0, max: 1 }`).join(', ')}]; }, modulate() {},`}
      destroy() {} };
  }
};
`;
const NOTIN = (names, n = names.split(',').length) => [`${n} continue regelaar(s) staan niet in params(): ${names}`, `${n} continuous control(s) are not in params(): ${names}`];
const NOPAR = (kind, n) => [`${n} continue regelaar(s) maar geen params() (kind ${kind})`, `${n} continuous control(s) but no params() (kind ${kind})`];

// zonder let op
ok('dekking: knop met id in params()', dev2({ plist: ['cut'], body: `knob('cut');` }));
ok('dekking: eigen schuif, state-sleutel = param-id', dev2({ plist: ['cut', 'res'], body: `own('cut'); own('res');` }));
ok('dekking: eigen schuif via addEventListener', dev2({ plist: ['cut'], body: `const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; i.addEventListener('input', () => { S.cut = +i.value; }); el.appendChild(i);` }));
ok('dekking: schuif met data-pk-id = param-id', dev2({ plist: ['cut'], body: `const i = own('cut'); i.setAttribute('data-pk-id', 'cut');` }));
ok('dekking: label gelijk aan unieke param-naam (geen state-koppeling)', dev2({ plist: ['Cutoff'], body: `const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; i.setAttribute('aria-label', 'Cutoff'); el.appendChild(i);` }));
ok('dekking: genummerde sleutel osc.0.fine = param osc1.fine', dev2({ plist: ['osc1.fine', 'osc2.fine', 'osc3.fine'], body: `for (let n = 0; n < 3; n++) { const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; i.oninput = () => { S.osc[n].fine = +i.value; }; el.appendChild(i); }` }));
ok('dekking: stapdata (16 schuiven op steps.N) telt niet', dev2({ plist: ['cut'], body: `knob('cut'); for (let n = 0; n < 16; n++) { const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; i.oninput = () => { S.steps[n] = +i.value; }; el.appendChild(i); }` }));
ok('dekking: rol step/display telt niet', dev2({ plist: ['cut'], body: `knob('cut'); own('res', '', '0', '1', 'step'); own('testNote', '', '0', '127', 'display');` }));
ok('dekking: keuzes en vinkjes hoeven niet in params()', dev2({ plist: ['cut'], body: `knob('cut'); sel({ id: 'shape' }); const c = document.createElement('input'); c.type = 'checkbox'; el.appendChild(c);` }));
ok('dekking: modExclude sluit testnoot uit', dev2({ def: "modExclude: ['testNote'],", plist: ['cut'], body: `knob('cut'); own('testNote', 'Test note', '0', '127');` }));
ok('dekking: modExclude op een knop met id', dev2({ def: "modExclude: ['res'],", plist: ['cut'], body: `knob('cut'); knob('res');` }));
ok('dekking: modExclude \'*\' zonder params()', dev2({ def: "modExclude: '*',", body: `knob('cut');` }));
ok('dekking: modulator zonder params() krijgt geen let op', dev2({ kind: 'modulator', def: "", body: `knob('cut');` }).replace("eventOut: [] }", "eventOut: [], modOut: [{ id: 'mod', name: 'Mod' }] }").replace('destroy() {} };', 'onModTargets() {}, destroy() {} };'));
ok('dekking: utility, output zonder params() krijgen geen let op', dev2({ kind: 'utility', body: `knob('cut');` }));
ok('dekking: output zonder params()', dev2({ kind: 'output', body: `knob('cut');` }).replace("outputs: { out: g }", "outputs: { out: g }"));
ok('dekking: sequencer-categorie zonder params()', dev2({ kind: 'instrument', category: 'sequencer', body: `knob('cut');` }));
ok('dekking: apparaat zonder regelaars en zonder params()', dev2({ kind: 'instrument', body: `el.appendChild(document.createElement('div'));` }));
ok('dekking: param-id met state-sleutel zonder regelaar mag', dev2({ plist: ['cut', 'res'], body: `knob('cut');` }));
// let op
warns('dekking: knop met id staat niet in params()', dev2({ plist: ['cut'], body: `knob('cut'); knob('res');` }), [NOTIN('res')]);
warns('dekking: eigen schuif (state-sleutel) staat niet in params()', dev2({ plist: ['cut'], body: `knob('cut'); own('res');` }), [NOTIN('res')]);
warns('dekking: meerdere ontbrekende regelaars', dev2({ plist: ['cut'], body: `knob('cut'); own('res'); own('testNote', '', '0', '127');` }), [NOTIN('res, testNote', 2)]);
warns('dekking: genummerde sleutel mist in params()', dev2({ plist: ['cut'], body: `knob('cut'); for (let n = 0; n < 3; n++) { const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; i.oninput = () => { S.osc[n].fine = +i.value; }; el.appendChild(i); }` }), [NOTIN('osc.0.fine, osc.1.fine, osc.2.fine', 3)]);
warns('dekking: schuif met data-pk-id staat niet in params()', dev2({ plist: ['cut'], body: `knob('cut'); const i = own('res'); i.setAttribute('data-pk-id', 'res');` }), [NOTIN('res')]);
warns('dekking: modExclude sluit een ander id uit, res blijft ontbreken', dev2({ def: "modExclude: ['testNote'],", plist: ['cut'], body: `knob('cut'); own('res'); own('testNote');` }), [NOTIN('res')]);
warns('dekking: apparaat met regelaars maar zonder params() (effect)', dev2({ body: `knob('cut'); own('res');` }), [NOPAR('effect', 2)]);
warns('dekking: instrument zonder params()', dev2({ kind: 'instrument', body: `knob('cut');` }), [NOPAR('instrument', 1)]);
warns('dekking: mixer zonder params()', dev2({ kind: 'mixer', body: `knob('cut');` }), [NOPAR('mixer', 1)]);
warns('dekking: zonder params(), maar modExclude laat er één over', dev2({ def: "modExclude: ['testNote'],", body: `knob('cut'); own('testNote');` }), [NOPAR('effect', 1)]);
warns('dekking: param-id zonder regelaar of state-sleutel', dev2({ plist: ['cut', 'cutt'], body: `knob('cut');` }), [['zonder regelaar of state-sleutel: cutt', 'without a control or state key: cutt']]);
warns('dekking: modExclude is geen lijst', dev2({ def: "modExclude: 'testNote',", plist: ['cut'], body: `knob('cut');` }), [['modExclude moet een lijst', 'modExclude must be a list']]);
warns('dekking: modExclude bevat een getal', dev2({ def: "modExclude: [5],", plist: ['cut'], body: `knob('cut');` }), [['modExclude moet een lijst', 'modExclude must be a list']]);
// --controls: kolom "in params()"
ok('--controls: kolom in params() (ja, nee, uitgesloten, ?)', dev2({ def: "modExclude: ['testNote'],", plist: ['cut'], body: `knob('cut'); knob('res'); own('testNote', 'Test note', '0', '127'); const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; el.appendChild(i);` }), { controls: true, warn: [NOTIN('res', 1)], has: [
  ['in params()', 'in params()'], ['cut', 'cut'], [' | ja', ' | yes'], [' | nee', ' | no'], [' | uitgesloten', ' | excluded'], [' | ?', ' | ?'], ['Test note', 'Test note']] });
ok('--controls: keuze krijgt streepje in de kolom in params()', dev2({ plist: ['cut'], body: `knob('cut'); sel({ id: 'shape' });` }), { controls: true, has: [['shape | select | -', 'shape | select | -'], ['| ja', '| yes']] });


// ---- klembord (v1.17): clipInfo / getClip / setClip. Een probe-apparaat met een noten-patroon; `mut` past het aan om één regel te schenden.
const PROBE = {
  info: `clipInfo() { return { name: 'Probe', copy: ['notes'], paste: ['notes'], length: { min: 12, max: 12288, step: 12, current: S.length, shared: false }, maxEvents: 4096 }; },`,
  get: `getClip() { return S.notes.length ? { format: 'patchkamer-clip', formatVersion: 1, kind: 'notes', name: 'Probe', length: S.length, notes: S.notes.map(n => ({ ...n })) } : null; },`,
  set: `setClip(c) { try {
        if (!c || c.format !== 'patchkamer-clip' || c.formatVersion !== 1 || c.kind !== 'notes') return { ok: false, reason: host.lang === 'nl' ? 'Alleen noten' : 'Notes only' };
        const L = Math.round(+c.length); if (!(L >= 1 && L <= 12288) || !Array.isArray(c.notes)) return { ok: false, reason: host.lang === 'nl' ? 'Ongeldige lengte' : 'Invalid length' };
        const out = []; for (const n of c.notes.slice(0, 4096)) { if (!n || typeof n !== 'object') continue; const t = Math.round(+n.t), nn = Math.round(+n.n); if (!(t >= 0 && t < L && nn >= 0 && nn <= 127)) continue;
          let len = Math.round(+n.len); if (!(len >= 1)) len = 12; let v = +n.vel; if (!(v >= 0.01)) v = 0.8; out.push({ t, n: nn, len: Math.min(len, L - t), vel: Math.min(1, v) }); }
        S.length = L; S.notes = out; return { ok: true }; } catch (e) { return { ok: false, reason: String(e) }; } },`
};
const clipDev = (o = {}) => `// SPDX-License-Identifier: MIT
export default {
  id: 'nl.test.clip', name: 'Clip', version: '1.0.0', kind: 'effect', modExclude: '*',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [{ id: 'ev', name: 'Ev' }] },
  create(ctx, host) {
    const g = ctx.createGain(); const S = ${o.init ?? '{ length: 192, notes: [{ t: 0, n: 60, len: 12, vel: 0.8 }, { t: 48, n: 64, len: 24, vel: 0.5 }] }'}; const self = {};
    return Object.assign(self, { inputs: { in: g }, outputs: { out: g },
      mount(el) {}, getState() { return ${o.raw ? 'S' : 'JSON.parse(JSON.stringify(S))'}; }, setState(s) { Object.assign(S, JSON.parse(JSON.stringify(s || {}))); }, destroy() {},
      ${o.info ?? PROBE.info}
      ${o.get ?? PROBE.get}
      ${o.set ?? PROBE.set} });
  }
};
`;
const CLIPOK = ', klembord (clipInfo/getClip/setClip)';
cases.push(['klembord: probe-apparaat (alle drie, geldig)', clipDev(), { has: [[', klembord (clipInfo/getClip/setClip)', ', clipboard (clipInfo/getClip/setClip)']] }]);
ok('klembord: geen enkele methode (zoals de 86 bestaande apparaten)', clipDev({ info: '', get: '', set: '' }));
ok('klembord: getClip() geeft null (niets te kopieren)', clipDev({ get: 'getClip() { return null; },' }));
ok('klembord: clipInfo() geeft null', clipDev({ info: 'clipInfo() { return null; },' }));
warns('klembord: een drums-clip (de probe neemt alleen noten aan: let op)', clipDev({ get: `getClip() { return { format: 'patchkamer-clip', formatVersion: 1, kind: 'drums', length: 192, lanes: [{ id: 'kick', name: 'Kick', type: 'kick', note: 36 }], hits: [{ t: 0, lane: 0, vel: 0.9 }, { t: 96, lane: 0 }] }; },` }), [['wordt door het apparaat zelf afgewezen', 'rejects setClip(getClip())']]);
ok('klembord: extreme clip op 12288 tikken en 4096 noten', clipDev({ init: "{ length: 12288, notes: Array.from({ length: 4096 }, (_, i) => ({ t: i * 3, n: i % 128, len: 1, vel: 1 })) }" }));
warns('klembord: setClip(getClip()) afgewezen door het apparaat zelf', clipDev({ set: 'setClip(c) { return { ok: false, reason: "nee" }; },' }), [['wordt door het apparaat zelf afgewezen', 'rejects setClip(getClip())']]);
const H = (k) => [`klembord (v1.17): ${k}() ontbreekt; clipInfo, getClip en setClip horen bij elkaar`, `clipboard (v1.17): ${k}() is missing; clipInfo, getClip and setClip belong together`];
errs('klembord: setClip ontbreekt', clipDev({ set: '' }), [H('setClip')]);
errs('klembord: getClip ontbreekt', clipDev({ get: '' }), [H('getClip')]);
errs('klembord: clipInfo ontbreekt', clipDev({ info: '' }), [H('clipInfo')]);
errs('klembord: clipInfo gooit', clipDev({ info: 'clipInfo() { throw new Error("boem"); },' }), [['clipInfo() gooit: boem', 'clipInfo() throws: boem']]);
errs('klembord: clipInfo geeft een tekst', clipDev({ info: 'clipInfo() { return "x"; },' }), [['clipInfo() moet null of een JSON-object geven', 'clipInfo() must return null or a JSON object']]);
errs('klembord: clipInfo verandert de state', clipDev({ info: 'clipInfo() { S.length += 12; return null; },' }), [['clipInfo() verandert de state', 'clipInfo() changes the state']]);
errs('klembord: clipInfo copy met onbekende soort', clipDev({ info: `clipInfo() { return { copy: ['chords'] }; },` }), [["clipInfo(): copy en paste moeten lijsten zijn", 'clipInfo(): copy and paste must be lists']]);
errs('klembord: clipInfo length.max te groot', clipDev({ info: `clipInfo() { return { length: { min: 1, max: 99999 } }; },` }), [['clipInfo(): length.min', 'clipInfo(): length.min']]);
errs('klembord: getClip gooit', clipDev({ get: 'getClip() { throw new Error("kapot"); },' }), [['getClip() gooit: kapot', 'getClip() throws: kapot']]);
errs('klembord: getClip is geen JSON (BigInt)', clipDev({ get: 'getClip() { return { a: 10n }; },' }), [['getClip() geeft geen JSON', 'getClip() does not return a JSON']]);
errs('klembord: getClip is een AudioNode-struct', clipDev({ get: 'getClip() { return { format: "patchkamer-clip", formatVersion: 1, kind: "notes", length: 192, notes: [], node: g }; },' }), [['geeft geen JSON-object of null', 'does not return a JSON object or null']]);
errs('klembord: getClip verandert de state', clipDev({ get: 'getClip() { S.length += 12; return null; },' }), [['getClip() verandert de state', 'getClip() changes the state']]);
const BADC = (extra) => `getClip() { return { format: 'patchkamer-clip', formatVersion: 1, kind: 'notes', length: 192, notes: [{ t: 0, n: 60, len: 12, vel: 0.8 }], ${extra} }; },`;
errs('klembord: verkeerd format', clipDev({ get: BADC("format: 'x'") }), [['format moet', 'format must']]);
errs('klembord: formatVersion 2', clipDev({ get: BADC('formatVersion: 2') }), [['formatVersion 1', 'formatVersion 1']]);
errs('klembord: kind chords', clipDev({ get: BADC("kind: 'chords'") }), [["kind moet 'notes' of 'drums'", "kind must be 'notes' or 'drums'"]]);
errs('klembord: length 20000', clipDev({ get: BADC('length: 20000') }), [['length moet een geheel getal van 1 tot 12288', 'length must be an integer from 1 to 12288']]);
errs('klembord: length 0', clipDev({ get: BADC('length: 0') }), [['length moet', 'length must']]);
errs('klembord: length met komma', clipDev({ get: BADC('length: 192.5') }), [['length moet', 'length must']]);
errs('klembord: name geen tekst', clipDev({ get: BADC('name: 5') }), [['name moet tekst zijn', 'name must be text']]);
errs('klembord: noot met n 200', clipDev({ get: BADC('notes: [{ t: 0, n: 200, len: 1 }]') }), [['noot 0:', 'note 0:']]);
errs('klembord: noot met t buiten length', clipDev({ get: BADC('notes: [{ t: 0, n: 60, len: 1 }, { t: 192, n: 60, len: 1 }]') }), [['noot 1:', 'note 1:']]);
errs('klembord: noot met kommagetal als t', clipDev({ get: BADC('notes: [{ t: 0.5, n: 60, len: 1 }]') }), [['noot 0:', 'note 0:']]);
errs('klembord: noot met len 0', clipDev({ get: BADC('notes: [{ t: 0, n: 60, len: 0 }]') }), [['noot 0:', 'note 0:']]);
errs('klembord: noot met vel 2', clipDev({ get: BADC('notes: [{ t: 0, n: 60, len: 1, vel: 2 }]') }), [['noot 0:', 'note 0:']]);
errs('klembord: 4097 noten', clipDev({ get: BADC('notes: Array.from({ length: 4097 }, () => ({ t: 0, n: 60, len: 1 }))') }), [["kind 'notes' heeft een lijst notes", "kind 'notes' needs a list notes"]]);
errs('klembord: notes ontbreekt bij kind notes', clipDev({ get: BADC('notes: undefined') }), [["kind 'notes' heeft een lijst notes", "kind 'notes' needs a list notes"]]);
const DRUM = (extra) => `getClip() { return { format: 'patchkamer-clip', formatVersion: 1, kind: 'drums', length: 192, lanes: [{ id: 'kick', name: 'Kick', note: 36 }], hits: [{ t: 0, lane: 0, vel: 0.9 }], ${extra} }; },`;
errs('klembord: slag op een baan die niet bestaat', clipDev({ get: DRUM('hits: [{ t: 0, lane: 1 }]') }), [['slag 0:', 'hit 0:'].map(x => x.replace('slag', 'hit'))].map(([a, b]) => [a, b]));
errs('klembord: 65 banen', clipDev({ get: DRUM('lanes: Array.from({ length: 65 }, (_, i) => ({ id: "l" + i, name: "L" }))') }), [["kind 'drums' heeft een lijst lanes", "kind 'drums' needs a list lanes"]]);
errs('klembord: drums zonder hits', clipDev({ get: DRUM('hits: undefined') }), [["kind 'drums' heeft een lijst lanes", "kind 'drums' needs a list lanes"]]);
errs('klembord: setClip(getClip()) verandert de state', clipDev({ set: PROBE.set.replace('S.length = L;', 'S.length = L + 12;') }), [['setClip(getClip()) verandert de state', 'setClip(getClip()) changes the state']]);
errs('klembord: setClip gooit op rommel', clipDev({ set: PROBE.set.replace('try {', 'if (!c || typeof c.length !== "number") throw new Error("rommel"); try {') }), [['setClip() gooit bij', 'setClip() throws on']]);
errs('klembord: setClip geeft niets terug', clipDev({ set: 'setClip(c) { return undefined; },' }), [['setClip() moet { ok: true }', 'setClip() must return { ok: true }']]);
errs('klembord: ok:false zonder reden', clipDev({ set: 'setClip(c) { return { ok: false }; },' }), [['setClip() moet { ok: true }', 'setClip() must return { ok: true }']]);
errs('klembord: ok geen boolean', clipDev({ set: 'setClip(c) { return { ok: 1 }; },' }), [['setClip() moet { ok: true }', 'setClip() must return { ok: true }']]);
errs('klembord: ok:false maar de state is half gezet', clipDev({ set: PROBE.set.replace('const L = Math.round(+c.length);', 'if (c && typeof c.length === "number") S.length = 24; const L = Math.round(+c.length);').replace('{ ok: false, reason: host.lang === \'nl\' ? \'Ongeldige lengte\' : \'Invalid length\' }', '{ ok: false, reason: "x" }') }), [['gaf ok:false maar veranderde toch de state', 'returned ok:false but still changed the state']]);
errs('klembord: NaN komt in de state', clipDev({ set: 'setClip(c) { S.length = (c && c.length !== undefined) ? +c.length : 192; if (c && Array.isArray(c.notes)) S.notes = c.notes; return { ok: true }; },', raw: true }), [['is de state geen geldige JSON zonder NaN of Infinity', 'the state is not valid JSON without NaN or Infinity']]);
errs('klembord: setClip stuurt zelf gebeurtenissen', clipDev({ set: PROBE.set.replace('S.length = L;', "host.emit(self, 'ev', { type: 'note', note: 60, vel: 0.8, time: 0, dur: 0.1 }); S.length = L;") }), [['setClip() stuurt zelf gebeurtenissen', 'setClip() sends events itself']]);
// --clip: toont de uitvoer van clipInfo() en getClip()
ok('--clip: toont clipInfo en getClip', clipDev(), { clip: true, has: [['Klembord (--clip):', 'Clipboard (--clip):'], ['clipInfo(): {"name":"Probe"', 'clipInfo(): {"name":"Probe"'], ['getClip():  {"format":"patchkamer-clip","formatVersion":1,"kind":"notes"', 'getClip():  {"format":"patchkamer-clip","formatVersion":1,"kind":"notes"']] });
ok('--clip: apparaat zonder klembord', clipDev({ info: '', get: '', set: '' }), { clip: true, has: [['(geen clipInfo/getClip/setClip)', '(no clipInfo/getClip/setClip)']] });
ok('--clip: getClip null', clipDev({ get: 'getClip() { return null; },' }), { clip: true, has: [['getClip():  (null)', 'getClip():  (null)']] });
ok('zonder --clip geen klembordtabel', clipDev(), { no: [['Klembord (--clip):', 'Clipboard (--clip):']] });


// ---- meters (v1.18): host.ui.meter(parent, label, opts) -> { el, set, id, destroy }
const AN = 'const an = ctx.createAnalyser();';
const M = (opts = '{}', pre = '') => `${AN} ${pre} const m = host.ui.meter(el, T.a, ${opts}); if (!m || !m.el || typeof m.set !== 'function' || typeof m.destroy !== 'function') throw new Error('meter-terugwaarde'); `;
ok('meter met AnalyserNode (source)', dev(M('{ id: "met.master", group: "meters", source: an, range: [-60, 6], clip: 0 }')), { controls: true, has: [['1 meters', '1 meters'], ['met.master | meter | meters', 'met.master | meter | meters'], ['-60..6', '-60..6']] });
ok('meter met twee AnalyserNodes (stereo)', dev(M('{ id: "met.out", source: [an, ctx.createAnalyser()], kind: "rms", hold: false }')));
ok('meter zonder source, met set() (level en [l, r])', dev(M('{ id: "met.in", unit: "db", orientation: "horizontal", length: 120, width: 8 }') + 'm.set(0.4); m.set([0.2, 0.3]); m.set(-12);'));
ok('meter: destroy() twee keer mag', dev(M('{ id: "m1", source: an }') + 'm.destroy(); m.destroy(); m.set(0.1);'));
ok('meter zonder opties', dev(M('undefined')));
ok('meter hoort niet in params(): geen dekkingsmelding', dev2({ plist: ['cut'], body: `knob('cut'); ${AN} host.ui.meter(el, 'Level', { id: 'lvl', source: an });` }));
ok('meter in een shadow root-ouder', dev(`const sr = el.attachShadow({ mode: 'open' }); ${AN} host.ui.meter(sr, T.a, { id: 'sh', source: an });`));
ok('meters op meer plekken, elk een eigen id (herbouw telt niet dubbel)', dev(`${AN} const build = () => { host.ui.meter(el, 'A', { id: 'a', source: an }); }; build(); setTimeout(build, 0);`));
ok('data-pk-suffix van 16 tekens mag', dev(`const d = document.createElement('div'); d.setAttribute('data-pk-suffix', '${'x'.repeat(16)}'); el.appendChild(d);`));
ok('data-pk-suffix korte tekst', dev(`const i = document.createElement('input'); i.type = 'range'; i.min = '0'; i.max = '1'; i.setAttribute('data-pk-id', 'trim'); i.setAttribute('data-pk-suffix', 'T3'); el.appendChild(i);`));
warns('meter: dubbel meter-id', dev(`${AN} host.ui.meter(el, 'A', { id: 'dup', source: an }); host.ui.meter(el, 'B', { id: 'dup', source: an });`), [['id "dup" staat bij meer dan één regelaar', 'id "dup" is used by more than one control']]);
warns('meter: ongeldig id', dev(M('{ id: "no good!" }')), [['id "no good!"', 'id "no good!"']]);
warns('meter: ongeldige groep', dev(M('{ id: "a", group: "x y" }')), [['groep "x y"', 'group "x y"']]);
warns('meter: opties geen object', dev(M('"nee"')), [['de opties van host.ui.meter moeten een object zijn', 'the host.ui.meter options must be an object']]);
warns('meter: range ongeldig (min >= max)', dev(M('{ id: "a", range: [0, -60] }')), [['meter-optie range is ongeldig', 'meter option range is invalid']]);
warns('meter: unit onbekend', dev(M('{ id: "a", unit: "volt" }')), [['meter-optie unit is ongeldig', 'meter option unit is invalid']]);
warns('meter: orientation onbekend', dev(M('{ id: "a", orientation: "diagonal" }')), [['meter-optie orientation is ongeldig', 'meter option orientation is invalid']]);
warns('meter: length negatief', dev(M('{ id: "a", length: -4 }')), [['meter-optie length is ongeldig', 'meter option length is invalid']]);
warns('meter: hold geen boolean', dev(M('{ id: "a", hold: "ja" }')), [['meter-optie hold is ongeldig', 'meter option hold is invalid']]);
warns('meter: kind rms zonder source', dev(M('{ id: "a", kind: "rms" }')), [["kind 'rms' werkt alleen met source", "kind 'rms' only works with source"]]);
warns('meter: set() met rommel', dev(M('{ id: "a" }') + 'm.set(NaN); m.set("x");'), [['set() verwacht een eindig getal', 'set() expects a finite number']]);
warns('meter: data-pk-role="meter" op een eigen element', dev(`const d = document.createElement('div'); d.setAttribute('data-pk-id', 'mine'); d.setAttribute('data-pk-role', 'meter'); el.appendChild(d);`), [['data-pk-role="meter" op een eigen element wordt niet ondersteund', 'data-pk-role="meter" on your own element is not supported']]);
warns('meter: adopt met rol meter op een div', dev(`const d = document.createElement('div'); el.appendChild(d); host.ui.adopt(d, { id: 'mine', role: 'meter' });`), [['wordt niet ondersteund', 'is not supported']]);
warns('data-pk-suffix te lang (17 tekens)', dev(`const d = document.createElement('div'); d.setAttribute('data-pk-suffix', '${'x'.repeat(17)}'); el.appendChild(d);`), [['data-pk-suffix hoort tekst van hoogstens 16 tekens te zijn', 'data-pk-suffix must be text of at most 16 characters']]);
warns('meter naast knoppen met id, meter zonder id', dev(`${K('id: "rate"')} ${AN} host.ui.meter(el, 'Level', { source: an });`), [['regelaar(s) zonder id terwijl andere er wel een hebben', 'control(s) without an id while others have one']]);
errs('meter: source is geen AnalyserNode (een GainNode)', dev(M('{ id: "a", source: ctx.createGain() }')), [['source moet een AnalyserNode zijn', 'source must be an AnalyserNode']]);
errs('meter: source is een getal', dev(M('{ id: "a", source: 5 }')), [['source moet een AnalyserNode zijn', 'source must be an AnalyserNode']]);
errs('meter: source is een lijst van drie', dev(M('{ id: "a", source: [an, an, an] }')), [['source moet een AnalyserNode zijn', 'source must be an AnalyserNode']]);
errs('meter: source is een lege lijst', dev(M('{ id: "a", source: [] }')), [['source moet een AnalyserNode zijn', 'source must be an AnalyserNode']]);

let fail = 0, n = 0;
let idx = 0;
for (const [name, src, exp] of cases) {
  const f = join(tmp, `case${idx++}.patchkamer-device.js`); writeFileSync(f, src);
  for (const lang of ['nl', 'en']) {
    n++;
    const args = [V, f, '--lang', lang]; if (exp.controls) args.push('--controls'); if (exp.hostLang) args.push('--host-lang', exp.hostLang); if (exp.clip) args.push('--clip');
    let out = '', code = 0;
    try { out = execFileSync('node', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { code = e.status; out = (e.stdout || '') + (e.stderr || ''); }
    const problems = [], li = lang === 'nl' ? 0 : 1, ok1 = out.split('\n').find(l => l.startsWith('OK')) || '';
    if (exp.err) { if (code !== 1) problems.push('exit ' + code + ' (verwacht 1)'); if (ok1) problems.push('onverwachte OK-regel'); for (const e of exp.err) if (!out.includes(e[li])) problems.push(`foutmelding mist "${e[li]}"`); }
    else {
    if (code !== 0) problems.push('exit ' + code);
    if (!ok1) problems.push('geen OK-regel');
    const warnPart = ok1.includes(' · ') ? ok1.slice(ok1.indexOf(' · ')) : '';
    const hasWarn = lang === 'nl' ? /· let op:/.test(ok1) : /· warning:/.test(ok1);
    if (exp.warn) { if (!hasWarn) problems.push('geen waarschuwing'); for (const w of exp.warn) if (!warnPart.includes(w[li])) problems.push(`mist "${w[li]}"`); }
    else if (hasWarn) problems.push('onverwachte waarschuwing: ' + warnPart);
    }
    for (const h of exp.no || []) if (out.includes(h[li])) problems.push(`uitvoer bevat onverwacht "${h[li]}"`);
    for (const h of exp.has || []) if (!out.includes(h[li])) problems.push(`uitvoer mist "${h[li]}"`);
    if (/⟦/.test(out)) problems.push('ontbrekende vertaling');
    if (!exp.controls && /\n(Regelaars|Controls) \(/.test(out)) problems.push('tabel zonder --controls');
    if (problems.length) { fail++; console.log(`MISLUKT [${lang}] ${name}: ${problems.join('; ')}\n  ${out.trim().split('\n').slice(0, 14).join('\n  ')}`); }
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log(`${n - fail}/${n} gevallen groen (${cases.length} gevallen x 2 talen)`);
process.exit(fail ? 1 : 0);
