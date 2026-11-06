// test-validate-instrument.mjs — testgevallen voor de regelaarscontroles van validate-instrument.mjs (contract v1.15)
// Gebruik / Usage:  node contract/test-validate-instrument.mjs      (exit 0 = alles groen / all green)
// Elk geval is een klein apparaat dat in een tijdelijke map wordt gezet en in beide talen (--lang nl en --lang en) wordt gevalideerd.
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
  id: 'nl.test.ctl', name: 'Ctl', version: '1.0.0', kind: 'effect',
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

let fail = 0, n = 0;
let idx = 0;
for (const [name, src, exp] of cases) {
  const f = join(tmp, `case${idx++}.patchkamer-device.js`); writeFileSync(f, src);
  for (const lang of ['nl', 'en']) {
    n++;
    const args = [V, f, '--lang', lang]; if (exp.controls) args.push('--controls'); if (exp.hostLang) args.push('--host-lang', exp.hostLang);
    let out = '', code = 0;
    try { out = execFileSync('node', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { code = e.status; out = (e.stdout || '') + (e.stderr || ''); }
    const problems = [], li = lang === 'nl' ? 0 : 1, ok1 = out.split('\n').find(l => l.startsWith('OK')) || '';
    if (code !== 0) problems.push('exit ' + code);
    if (!ok1) problems.push('geen OK-regel');
    const warnPart = ok1.includes(' · ') ? ok1.slice(ok1.indexOf(' · ')) : '';
    const hasWarn = lang === 'nl' ? /· let op:/.test(ok1) : /· warning:/.test(ok1);
    if (exp.warn) { if (!hasWarn) problems.push('geen waarschuwing'); for (const w of exp.warn) if (!warnPart.includes(w[li])) problems.push(`mist "${w[li]}"`); }
    else if (hasWarn) problems.push('onverwachte waarschuwing: ' + warnPart);
    for (const h of exp.has || []) if (!out.includes(h[li])) problems.push(`uitvoer mist "${h[li]}"`);
    if (/⟦/.test(out)) problems.push('ontbrekende vertaling');
    if (!exp.controls && /\n(Regelaars|Controls) \(/.test(out)) problems.push('tabel zonder --controls');
    if (problems.length) { fail++; console.log(`MISLUKT [${lang}] ${name}: ${problems.join('; ')}\n  ${out.trim().split('\n').slice(0, 14).join('\n  ')}`); }
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log(`${n - fail}/${n} gevallen groen (${cases.length} gevallen x 2 talen)`);
process.exit(fail ? 1 : 0);
