// test-validate-skin.mjs — testgevallen voor validate-skin.mjs (contract v0.5) / test cases for the validator
// Gebruik / Usage:  node skins/contract/test-validate-skin.mjs      (exit 0 = alles groen / all green)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const V = join(dirname(fileURLToPath(import.meta.url)), 'validate-skin.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'skin-test-'));
const base = () => ({ format: 'patchkamer-skin', formatVersion: 1, skinsContract: '0.3', id: 'nl.test.dev.sample', device: 'nl.test.dev', name: 'Sample', version: '1.0.0', author: 'Test', license: 'CC0-1.0', description: 'A test skin.', created: '2026-11-06', icon: null, default: 'a', appearances: [{ id: 'a', name: 'A', when: { minWidth: 0 }, css: '' }] });
const withDesign = d => ({ ...base(), design: d });
const withAppDesign = d => { const s = base(); s.appearances[0].design = d; return s; };
const cases = []; // [naam, skin, verwacht: { ok:bool, codes:[...] (alle moeten voorkomen), no:[...] (mogen niet voorkomen) }]
const ok = (n, s, no = []) => cases.push([n, s, { ok: true, codes: [], no: ['*'].concat(no) }]);
const okWarn = (n, s, codes) => cases.push([n, s, { ok: true, codes, no: [] }]);
const bad = (n, s, codes) => cases.push([n, s, { ok: false, codes, no: [] }]);
const SK = s => { const o = base(); return Object.assign(o, s); };
// --- 0.1 en basis
ok('0.1-bestand zonder design', SK({ skinsContract: '0.1' }));
ok('0.2-bestand zonder design', base());
okWarn('minor 6 is nieuwer', SK({ skinsContract: '0.6' }), ['contract_minor']);
bad('major 1', SK({ skinsContract: '1.0' }), ['contract_major']);
okWarn('design in een 0.1-bestand', { ...withDesign({ ports: { mode: 'hover' } }), skinsContract: '0.1' }, ['design_contract']);
// --- ports
for (const m of ['default', 'always', 'hover', 'strip']) ok('ports.mode ' + m, withDesign({ ports: { mode: m } }));
bad('ports.mode onbekend', withDesign({ ports: { mode: 'never' } }), ['design_enum']);
bad('ports.mode hoofdletter', withDesign({ ports: { mode: 'Hover' } }), ['design_enum']);
bad('ports.mode getal', withDesign({ ports: { mode: 1 } }), ['design_enum']);
bad('ports geen object', withDesign({ ports: 'hover' }), ['design_object']);
bad('ports null', withDesign({ ports: null }), ['design_object']);
okWarn('ports onbekende sleutel', withDesign({ ports: { mode: 'hover', side: 'left' } }), ['unknown_field']);
// --- design zelf
bad('design geen object (tekst)', withDesign('x'), ['design_object']);
bad('design lijst', withDesign([]), ['design_object']);
bad('design null', withDesign(null), ['design_object']);
ok('design leeg object', withDesign({}));
okWarn('design onbekende sectie (laag 2: layout)', withDesign({ layout: { x: 1 } }), ['unknown_field']);
// --- colors
const full = { bg: '#14191f', surface: '#1d252e', text: '#e6edf3', muted: '#8b98a5', accent: '#4fd1b8', line: '#2d3a46' };
ok('colors custom volledig', withDesign({ colors: { scheme: 'custom', custom: full } }), ['design_contrast', 'design_custom_missing']);
ok('colors workspace', withDesign({ colors: { scheme: 'workspace' } }));
ok('kleur #rgb', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '#0fa' } } }));
ok('kleur hoofdletters', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '#4FD1B8' } } }));
bad('kleur zonder #', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '4fd1b8' } } }), ['design_colour']);
bad('kleur 4 cijfers', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '#abcd' } } }), ['design_colour']);
bad('kleur 8 cijfers (alpha)', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '#4fd1b8ff' } } }), ['design_colour']);
bad('kleur naam', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: 'red' } } }), ['design_colour']);
bad('kleur rgb()', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: 'rgb(1,2,3)' } } }), ['design_colour']);
bad('kleur getal', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: 5 } } }), ['design_colour']);
bad('kleur niet-hex tekens', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '#gggggg' } } }), ['design_colour']);
bad('kleur met script', withDesign({ colors: { scheme: 'custom', custom: { ...full, accent: '#fff;}</style>' } } }), ['design_colour']);
bad('scheme onbekend', withDesign({ colors: { scheme: 'dark' } }), ['design_enum']);
bad('custom geen object', withDesign({ colors: { scheme: 'custom', custom: '#fff' } }), ['design_object']);
okWarn('custom onbekende kleur', withDesign({ colors: { scheme: 'custom', custom: { ...full, glow: '#fff' } } }), ['unknown_field']);
okWarn('custom ontbreekt geheel', withDesign({ colors: { scheme: 'custom' } }), ['design_custom_missing']);
okWarn('custom mist sleutels', withDesign({ colors: { scheme: 'custom', custom: { bg: '#000000', text: '#ffffff' } } }), ['design_custom_missing']);
okWarn('custom zonder scheme custom', withDesign({ colors: { scheme: 'workspace', custom: full } }), ['design_custom_unused']);
okWarn('custom zonder scheme', withDesign({ colors: { custom: full } }), ['design_custom_unused']);
// contrast
okWarn('contrast text/bg laag', withDesign({ colors: { scheme: 'custom', custom: { ...full, bg: '#808080', text: '#8a8a8a' } } }), ['design_contrast']);
okWarn('contrast text/surface laag', withDesign({ colors: { scheme: 'custom', custom: { ...full, surface: '#e6edf3' } } }), ['design_contrast']);
okWarn('contrast gelijke kleur', withDesign({ colors: { scheme: 'custom', custom: { ...full, text: '#14191f' } } }), ['design_contrast']);
ok('contrast net genoeg (zwart op wit)', withDesign({ colors: { scheme: 'custom', custom: { ...full, bg: '#ffffff', surface: '#ffffff', text: '#000000' } } }), ['design_contrast']);
ok('contrast #777 op wit = 4.5 (ruim boven 3)', withDesign({ colors: { scheme: 'custom', custom: { ...full, bg: '#fff', surface: '#fff', text: '#777' } } }), ['design_contrast']);
okWarn('contrast #aaa op wit = 2.3 (onder 3)', withDesign({ colors: { scheme: 'custom', custom: { ...full, bg: '#fff', surface: '#fff', text: '#aaa' } } }), ['design_contrast']);
// --- haptics
for (const l of ['off', 'light', 'medium', 'strong']) ok('haptics ' + l, withDesign({ haptics: { click: l, turn: l, slide: l } }));
bad('haptics onbekend niveau', withDesign({ haptics: { click: 'max' } }), ['design_enum']);
bad('haptics boolean', withDesign({ haptics: { turn: true } }), ['design_enum']);
bad('haptics geen object', withDesign({ haptics: 'light' }), ['design_object']);
okWarn('haptics onbekende sleutel', withDesign({ haptics: { click: 'light', tap: 'light' } }), ['unknown_field']);
// --- knobs
for (const st of ['workspace', 'rotary', 'slider']) for (const sz of ['s', 'm', 'l']) ok(`knobs ${st}/${sz}`, withDesign({ knobs: { style: st, size: sz } }));
bad('knobs stijl onbekend', withDesign({ knobs: { style: 'round' } }), ['design_enum']);
bad('knobs maat onbekend', withDesign({ knobs: { size: 'xl' } }), ['design_enum']);
bad('knobs maat getal', withDesign({ knobs: { size: 2 } }), ['design_enum']);
okWarn('knobs onbekende sleutel', withDesign({ knobs: { style: 'rotary', color: 'red' } }), ['unknown_field']);
// --- per verschijning
ok('verschijning-design geldig', withAppDesign({ ports: { mode: 'always' } }));
bad('verschijning-design ongeldig', withAppDesign({ ports: { mode: 'x' } }), ['design_enum']);
bad('verschijning-design geen object', withAppDesign(5), ['design_object']);
okWarn('verschijning-design onbekende sleutel', withAppDesign({ foo: 1 }), ['unknown_field']);
{ const s = withDesign({ colors: { scheme: 'custom', custom: full } }); s.appearances[0].design = { colors: { custom: { text: '#14191f' } } }; okWarn('verschijning overschrijft kleur per sleutel (contrast)', s, ['design_contrast']); }
{ const s = withDesign({ colors: { scheme: 'custom', custom: { bg: '#fff' } } }); s.appearances[0].design = { colors: { custom: { surface: '#fff', text: '#000', muted: '#555', accent: '#06c', line: '#ccc' } } }; ok('skin + verschijning samen volledig', s, ['design_custom_missing']); }
{ const s = withDesign({ ports: { mode: 'strip' } }); s.appearances.push({ id: 'b', name: 'B', when: { minWidth: 1 }, css: '' }); s.appearances[0].when = { maxWidth: 0 }; okWarn('twee verschijningen delen skin-design', s, ['when_zero']); }

// --- controls (0.3)
const ctl = (...rules) => withDesign({ controls: rules });
const ctlApp = (...rules) => withAppDesign({ controls: rules });
ok('0.2-bestand zonder controls blijft ok', SK({ skinsContract: '0.2' }));
ok('controls: alle matchvormen', ctl({ match: '*', color: 'accent' }, { match: 'cut', face: 'rotary' }, { match: 'role:fader', face: 'vslider' }, { match: 'group:filter', size: 'l' }, { match: 'kick.tune-2_a', size: 1 }));
for (const f of ['rotary', 'hslider', 'vslider', 'default']) ok('controls face ' + f, ctl({ match: '*', face: f }));
for (const sz of ['xs', 's', 'm', 'l', 'xl', 0.6, 1, 2, 1.25]) ok('controls size ' + sz, ctl({ match: '*', size: sz }));
for (const l of ['short', 'medium', 'long', 40, 400, 120.5]) ok('controls length ' + l, ctl({ match: 'role:fader', face: 'hslider', length: l }));
for (const th of [2, 24, 4.5]) ok('controls thickness ' + th, ctl({ match: 'role:fader', face: 'vslider', thickness: th }));
for (const th of ['round', 'square', 'bar', 'none']) ok('controls thumb ' + th, ctl({ match: 'role:fader', face: 'vslider', thumb: th }));
for (const c of ['accent', '#ff8800', '#F80']) ok('controls color ' + c, ctl({ match: '*', color: c }));
for (const sv of ['always', 'hover', 'never']) ok('controls showValue ' + sv, ctl({ match: '*', showValue: sv }));
ok('controls per verschijning', ctlApp({ match: 'cut', size: 's' }));
ok('controls leeg is geldig', ctl());
ok('knobs en controls samen', withDesign({ knobs: { style: 'slider', size: 's' }, controls: [{ match: 'role:param', face: 'rotary' }] }));
ok('64 regels is het maximum', ctl(...Array.from({ length: 64 }, (_, i) => ({ match: 'id' + i, size: 'm' }))));
bad('65 regels', ctl(...Array.from({ length: 65 }, (_, i) => ({ match: 'id' + i, size: 'm' }))), ['controls_max']);
bad('controls geen lijst (object)', withDesign({ controls: { match: '*' } }), ['controls_list']);
bad('controls geen lijst (tekst)', withDesign({ controls: 'all' }), ['controls_list']);
bad('regel is geen object', ctl('cut'), ['controls_rule']);
bad('regel is null', ctl(null), ['controls_rule']);
bad('match ontbreekt', ctl({ face: 'rotary' }), ['controls_match']);
bad('match is een getal', ctl({ match: 3, face: 'rotary' }), ['controls_match']);
bad('match leeg', ctl({ match: '', face: 'rotary' }), ['controls_match']);
ok('match camelCase-id', ctl({ match: 'envAmt', size: 's' }, { match: 'fAttack', size: 'l' }, { match: 'group:envAmp', color: 'accent' }));
bad('match met underscore-spatie', ctl({ match: 'env amt', face: 'rotary' }), ['controls_match']);
bad('role: met hoofdletter blijft fout', ctl({ match: 'role:Fader', face: 'rotary' }), ['controls_match']);
bad('match met spatie', ctl({ match: 'my cut', face: 'rotary' }), ['controls_match']);
bad('match "role:" leeg', ctl({ match: 'role:', face: 'rotary' }), ['controls_match']);
bad('match "group:" leeg', ctl({ match: 'group:', face: 'rotary' }), ['controls_match']);
bad('match 61 tekens', ctl({ match: 'a'.repeat(61), face: 'rotary' }), ['controls_match']);
bad('match jokerteken **', ctl({ match: '**', face: 'rotary' }), ['controls_match']);
bad('face none (verbergen bestaat niet)', ctl({ match: 'cut', face: 'none' }), ['controls_none']);
bad('face onbekend', ctl({ match: 'cut', face: 'dial' }), ['design_enum']);
bad('face getal', ctl({ match: 'cut', face: 1 }), ['design_enum']);
bad('size te klein (0.5)', ctl({ match: '*', size: 0.5 }), ['controls_enum_num']);
bad('size te groot (2.1)', ctl({ match: '*', size: 2.1 }), ['controls_enum_num']);
bad('size onbekend (xxl)', ctl({ match: '*', size: 'xxl' }), ['controls_enum_num']);
bad('size NaN-tekst', ctl({ match: '*', size: '1.5' }), ['controls_enum_num']);
bad('length 39', ctl({ match: '*', length: 39 }), ['controls_enum_num']);
bad('length 401', ctl({ match: '*', length: 401 }), ['controls_enum_num']);
bad('length onbekend', ctl({ match: '*', length: 'huge' }), ['controls_enum_num']);
bad('thickness 1', ctl({ match: '*', thickness: 1 }), ['controls_num']);
bad('thickness 25', ctl({ match: '*', thickness: 25 }), ['controls_num']);
bad('thickness tekst', ctl({ match: '*', thickness: '4' }), ['controls_num']);
bad('thumb onbekend', ctl({ match: '*', thumb: 'diamond' }), ['design_enum']);
bad('color naam', ctl({ match: '*', color: 'red' }), ['controls_colour']);
bad('color 4 cijfers', ctl({ match: '*', color: '#abcd' }), ['controls_colour']);
bad('color 8 cijfers', ctl({ match: '*', color: '#ff880080' }), ['controls_colour']);
bad('color getal', ctl({ match: '*', color: 5 }), ['controls_colour']);
bad('showValue onbekend', ctl({ match: '*', showValue: 'sometimes' }), ['design_enum']);
bad('showValue boolean', ctl({ match: '*', showValue: false }), ['design_enum']);
bad('controls in verschijning ongeldig', ctlApp({ match: 'cut', face: 'none' }), ['controls_none']);
okWarn('regel met onbekende sleutel', ctl({ match: 'cut', size: 's', hidden: true }), ['unknown_field']);
okWarn('regel met onbekende rol', ctl({ match: 'role:knob', size: 's' }), ['controls_role']);
okWarn('regel zonder eigenschap', ctl({ match: 'cut' }), ['controls_empty']);
okWarn('rotary met length', ctl({ match: 'cut', face: 'rotary', length: 'long' }), ['controls_slider_only']);
okWarn('rotary met thumb', ctl({ match: 'cut', face: 'rotary', thumb: 'bar' }), ['controls_slider_only']);
okWarn('rotary met thickness', ctl({ match: 'cut', face: 'rotary', thickness: 4 }), ['controls_slider_only']);
okWarn('controls in een 0.2-bestand', { ...ctl({ match: '*', size: 's' }), skinsContract: '0.2' }, ['controls_contract']);
okWarn('controls in een 0.1-bestand', { ...ctl({ match: '*', size: 's' }), skinsContract: '0.1' }, ['controls_contract', 'design_contract']);
okWarn('0.6 is nieuwer dan 0.5', SK({ skinsContract: '0.6' }), ['contract_minor']);
ok('0.3 is bekend', SK({ skinsContract: '0.3' }), ['contract_minor']);
ok('0.4 is bekend', SK({ skinsContract: '0.4' }), ['contract_minor']);
ok('0.5 is bekend', SK({ skinsContract: '0.5' }), ['contract_minor']);
// --- sections en size (0.5)
const sec = (...rules) => ({ ...withDesign({ sections: rules }), skinsContract: '0.5' });
const secApp = (...rules) => ({ ...withAppDesign({ sections: rules }), skinsContract: '0.5' });
const siz = size => ({ ...withDesign({ size }), skinsContract: '0.5' });
ok('sections: alle matchvormen', sec({ match: '*', frame: 'line' }, { match: 'group:setup', columns: 2 }, { match: 'group:a.b_c-1', gap: 'tight' }));
for (const f of ['none', 'line', 'raised', 'inset', 'floating', 'default']) ok('sections frame ' + f, sec({ match: '*', frame: f }));
for (const c of ['auto', 1, 3, 12]) ok('sections columns ' + c, sec({ match: '*', columns: c }));
for (const g of ['tight', 'normal', 'wide']) ok('sections gap ' + g, sec({ match: '*', gap: g }));
for (const b of [true, false]) ok('sections bare ' + b, sec({ match: '*', bare: b }));
for (const l of ['default', 'above', 'below']) ok('sections labels ' + l, sec({ match: '*', labels: l }));
for (const a of ['start', 'center']) ok('sections align ' + a, sec({ match: '*', align: a }));
ok('sections alle eigenschappen in een regel', sec({ match: 'group:filter', frame: 'raised', columns: 3, gap: 'wide', bare: true, labels: 'below', align: 'center' }));
ok('sections per verschijning', secApp({ match: '*', frame: 'inset' }));
ok('sections leeg is geldig', sec());
ok('sections precies 32 regels', sec(...Array.from({ length: 32 }, (_, i) => ({ match: 'group:g' + i, frame: 'line' }))));
ok('sections naast controls en meters', { ...base(), skinsContract: '0.5', design: { sections: [{ match: '*', frame: 'line' }], controls: [{ match: '*', size: 's' }], meters: [{ match: '*', face: 'vu' }] } });
ok('0.4-bestand zonder sections blijft ok', SK({ skinsContract: '0.4' }));
bad('sections geen lijst', { ...withDesign({ sections: 'line' }), skinsContract: '0.5' }, ['sections_list']);
bad('sections regel geen object', sec('line'), ['sections_rule']);
bad('sections match ontbreekt', sec({ frame: 'line' }), ['sections_match']);
bad('sections match is een id', sec({ match: 'cutoff', frame: 'line' }), ['sections_match']);
bad('sections match role:', sec({ match: 'role:param', frame: 'line' }), ['sections_match']);
bad('sections match group: leeg', sec({ match: 'group:', frame: 'line' }), ['sections_match']);
bad('sections match met spatie', sec({ match: 'group:a b', frame: 'line' }), ['sections_match']);
bad('sections match geen tekst', sec({ match: 3, frame: 'line' }), ['sections_match']);
bad('sections frame onbekend', sec({ match: '*', frame: 'double' }), ['design_enum']);
bad('sections gap onbekend', sec({ match: '*', gap: 'huge' }), ['design_enum']);
bad('sections labels onbekend', sec({ match: '*', labels: 'left' }), ['design_enum']);
bad('sections align onbekend', sec({ match: '*', align: 'end' }), ['design_enum']);
bad('sections columns 0', sec({ match: '*', columns: 0 }), ['sections_columns']);
bad('sections columns 13', sec({ match: '*', columns: 13 }), ['sections_columns']);
bad('sections columns niet geheel', sec({ match: '*', columns: 2.5 }), ['sections_columns']);
bad('sections columns woord', sec({ match: '*', columns: 'many' }), ['sections_columns']);
bad('sections bare als tekst', sec({ match: '*', bare: 'yes' }), ['sections_bool']);
bad('sections bare als getal', sec({ match: '*', bare: 1 }), ['sections_bool']);
bad('sections meer dan 32 regels', sec(...Array.from({ length: 33 }, (_, i) => ({ match: 'group:g' + i, frame: 'line' }))), ['sections_max']);
okWarn('sections regel met onbekende sleutel', sec({ match: '*', frame: 'line', shadow: 'big' }), ['unknown_field']);
okWarn('sections regel zonder eigenschap', sec({ match: '*' }), ['sections_empty']);
okWarn('sections in een 0.4-bestand', { ...sec({ match: '*', frame: 'line' }), skinsContract: '0.4' }, ['sections_contract']);
okWarn('sections in een 0.1-bestand', { ...sec({ match: '*', frame: 'line' }), skinsContract: '0.1' }, ['sections_contract', 'design_contract']);
ok('size.width 200', siz({ width: 200 }));
ok('size.width 1600', siz({ width: 1600 }));
ok('size.width 380.5', siz({ width: 380.5 }));
ok('size per verschijning', { ...withAppDesign({ size: { width: 380 } }), skinsContract: '0.5' });
bad('size.width 199', siz({ width: 199 }), ['size_width']);
bad('size.width 1601', siz({ width: 1601 }), ['size_width']);
bad('size.width als tekst', siz({ width: '380' }), ['size_width']);
bad('size.width negatief', siz({ width: -5 }), ['size_width']);
bad('size geen object', { ...withDesign({ size: 380 }), skinsContract: '0.5' }, ['design_object']);
okWarn('size onbekende sleutel', siz({ width: 380, height: 500 }), ['unknown_field']);
okWarn('size zonder width', siz({}), ['size_empty']);
okWarn('size in een 0.3-bestand', { ...siz({ width: 380 }), skinsContract: '0.3' }, ['sections_contract']);
// --- meters (0.4)
const met = (...rules) => ({ ...withDesign({ meters: rules }), skinsContract: '0.4' });
const metApp = (...rules) => ({ ...withAppDesign({ meters: rules }), skinsContract: '0.4' });
ok('meters: alle matchvormen', met({ match: '*', face: 'vu' }, { match: 'met.master', face: 'ledladder' }, { match: 'group:meters', length: 'long' }, { match: 'met.t1-a_b', width: 6 }));
for (const f of ['bar', 'ledladder', 'vu', 'default']) ok('meters face ' + f, met({ match: '*', face: f }));
for (const o of ['auto', 'vertical', 'horizontal']) ok('meters orientation ' + o, met({ match: '*', face: 'bar', orientation: o }));
for (const l of ['short', 'medium', 'long', 24, 400, 120.5]) ok('meters length ' + l, met({ match: '*', length: l }));
for (const w of [3, 48, 10.5]) ok('meters width ' + w, met({ match: '*', face: 'bar', width: w }));
for (const b of ['default', 'fast', 'vu', 'slow']) ok('meters ballistics ' + b, met({ match: '*', ballistics: b }));
for (const v of ['on', 'off', 'default']) ok('meters peakHold ' + v, met({ match: '*', peakHold: v }));
for (const v of ['show', 'hide', 'default']) ok('meters clip ' + v, met({ match: '*', clip: v }));
for (const v of ['show', 'hide']) ok('meters scale ' + v, met({ match: '*', face: 'vu', scale: v }));
for (const c of ['accent', 'default', '#ff8800', '#F80']) ok('meters color ' + c, met({ match: '*', color: c }));
for (const n of [8, 20, 40]) ok('meters segments ' + n, met({ match: '*', face: 'ledladder', segments: n }));
ok('meters per verschijning', metApp({ match: 'met.master', face: 'vu' }));
ok('meters leeg is geldig', met());
ok('meters naast controls', { ...met({ match: '*', face: 'vu' }), design: { meters: [{ match: '*', face: 'vu' }], controls: [{ match: '*', size: 's' }] } });
ok('0.3-bestand zonder meters blijft ok', SK({ skinsContract: '0.3' }));
bad('meters geen lijst', { ...withDesign({ meters: 'vu' }), skinsContract: '0.4' }, ['meters_list']);
bad('meters regel geen object', met('vu'), ['meters_rule']);
bad('meters match ontbreekt', met({ face: 'vu' }), ['meters_match']);
bad('meters match role: bestaat niet', met({ match: 'role:meter', face: 'vu' }), ['meters_match']);
bad('meters match met spatie', met({ match: 'met master', face: 'vu' }), ['meters_match']);
bad('meters face none', met({ match: '*', face: 'none' }), ['meters_none']);
bad('meters face onbekend', met({ match: '*', face: 'needle' }), ['design_enum']);
bad('meters orientation onbekend', met({ match: '*', orientation: 'diagonal' }), ['design_enum']);
bad('meters length te klein', met({ match: '*', length: 10 }), ['meters_enum_num']);
bad('meters length te groot', met({ match: '*', length: 500 }), ['meters_enum_num']);
bad('meters length onbekend woord', met({ match: '*', length: 'huge' }), ['meters_enum_num']);
bad('meters width te klein', met({ match: '*', width: 2 }), ['meters_num']);
bad('meters width te groot', met({ match: '*', width: 49 }), ['meters_num']);
bad('meters width als woord', met({ match: '*', width: 'm' }), ['meters_num']);
bad('meters ballistics onbekend', met({ match: '*', ballistics: 'medium' }), ['design_enum']);
bad('meters peakHold waar', met({ match: '*', peakHold: true }), ['design_enum']);
bad('meters clip onbekend', met({ match: '*', clip: 'always' }), ['design_enum']);
bad('meters scale default bestaat niet', met({ match: '*', scale: 'default' }), ['design_enum']);
bad('meters color ongeldig', met({ match: '*', color: 'red' }), ['meters_colour']);
bad('meters segments te klein', met({ match: '*', face: 'ledladder', segments: 7 }), ['meters_int']);
bad('meters segments te groot', met({ match: '*', face: 'ledladder', segments: 41 }), ['meters_int']);
bad('meters segments niet geheel', met({ match: '*', face: 'ledladder', segments: 12.5 }), ['meters_int']);
bad('meters meer dan 64 regels', met(...Array.from({ length: 65 }, (_, i) => ({ match: 'm' + i, face: 'vu' }))), ['meters_max']);
okWarn('meters regel met onbekende sleutel', met({ match: '*', face: 'vu', needle: 'red' }), ['unknown_field']);
okWarn('meters regel zonder eigenschap', met({ match: 'met.master' }), ['meters_empty']);
okWarn('meters vu met width', met({ match: '*', face: 'vu', width: 10 }), ['meters_vu_width']);
okWarn('meters vu met orientation vertical', met({ match: '*', face: 'vu', orientation: 'vertical' }), ['meters_vu_orientation']);
ok('meters vu met orientation auto is stil', met({ match: '*', face: 'vu', orientation: 'auto' }), ['meters_vu_orientation']);
okWarn('meters bar met scale', met({ match: '*', face: 'bar', scale: 'show' }), ['meters_scale_bar']);
okWarn('meters segments bij vu', met({ match: '*', face: 'vu', segments: 12 }), ['meters_segments_face']);
okWarn('meters in een 0.3-bestand', { ...withDesign({ meters: [{ match: '*', face: 'vu' }] }), skinsContract: '0.3' }, ['meters_contract']);
okWarn('meters in een 0.1-bestand', { ...withDesign({ meters: [{ match: '*', face: 'vu' }] }), skinsContract: '0.1' }, ['meters_contract', 'design_contract']);
// --- --device: register van een apparaat (id's, groepen, rollen)
const DEVSRC = `export default { id: 'nl.test.dev', name: 'D', version: '1.0.0', kind: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [] },
  create(ctx, host) { const g = ctx.createGain(); const ui = [];
    return { inputs: { in: g }, outputs: { out: g },
      mount(el) { ui.push(host.ui.knob(el, 'Cut', [0, 1, 0.01], 0.5, v => v, v => {}, { id: 'cut', role: 'param', group: 'filter' })); ui.push(host.ui.select(el, 'Mode', [['a', 'A']], 'a', v => {}, { id: 'mode', group: 'filter' })); },
      getState() { return { v: 1 }; }, setState() { ui[0].set(0); ui[1].value = 'a'; }, destroy() {} }; } };`;
const DEVSRC_PLAIN = DEVSRC.replace(/, \{ id: 'cut', role: 'param', group: 'filter' \}/, '').replace(/, \{ id: 'mode', group: 'filter' \}/, '');
const dev = (name, skin, src, codes, extra = {}) => cases.push([name, skin, { ok: true, codes, no: codes.length ? [] : ['*'], device: src, ...extra }]);
dev('device: bekende id en groep', ctl({ match: 'cut', face: 'vslider' }, { match: 'group:filter', size: 'l' }, { match: 'role:param', color: 'accent' }, { match: '*', showValue: 'hover' }), DEVSRC, []);
dev('device: camelCase-id uit het register', ctl({ match: 'envAmt', size: 's' }), DEVSRC.replace("id: 'cut'", "id: 'envAmt'"), []);
dev('device: id met andere hoofdletters is onbekend', ctl({ match: 'envamt', size: 's' }), DEVSRC.replace("id: 'cut'", "id: 'envAmt'"), ['dev_unknown_id']);
dev('device: onbekend id', ctl({ match: 'cutoff', face: 'rotary' }), DEVSRC, ['dev_unknown_id']);
dev('device: onbekende groep', ctl({ match: 'group:osc', size: 's' }), DEVSRC, ['dev_unknown_group']);
dev('device: rol die het apparaat niet heeft', ctl({ match: 'role:fader', face: 'vslider' }), DEVSRC, ['dev_unknown_role']);
dev('device: onbekend id in een verschijning', ctlApp({ match: 'nope', size: 's' }), DEVSRC, ['dev_unknown_id']);
dev('device: niet gemigreerd (geen id\'s)', ctl({ match: 'cut', size: 's' }), DEVSRC_PLAIN, ['dev_no_ids']);
dev('device: niet gemigreerd, alleen * en rol: geen melding behalve rol', ctl({ match: '*', size: 's' }, { match: 'role:param', face: 'rotary' }), DEVSRC_PLAIN, []);
dev('device: ander apparaat dan de skin', SK({ device: 'nl.test.other', id: 'nl.test.other.sample', design: { controls: [{ match: 'zzz', size: 's' }] } }), DEVSRC, ['dev_other']);
dev('device: onbekend id zonder controls in de skin', base(), DEVSRC, []);
const DEVMET = `export default { id: 'nl.test.dev', name: 'D', version: '1.0.0', kind: 'effect', modExclude: '*',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [], eventOut: [] },
  create(ctx, host) { const g = ctx.createGain(); const ui = [];
    return { inputs: { in: g }, outputs: { out: g },
      mount(el) { ui.push(host.ui.knob(el, 'Cut', [0, 1, 0.01], 0.5, v => v, v => {}, { id: 'cut', role: 'param', group: 'filter' })); const an = ctx.createAnalyser(); host.ui.meter(el, 'Master', { id: 'met.master', group: 'meters', source: an }); host.ui.meter(el, 'T1', { id: 'met.t1', group: 'meters', source: an }); },
      getState() { return { v: 1 }; }, setState() { ui[0].set(0); }, destroy() {} }; } };`;
dev('device: bekend meter-id en groep', met({ match: 'met.master', face: 'vu' }, { match: 'group:meters', length: 'long' }, { match: '*', ballistics: 'vu' }), DEVMET, []);
dev('device: onbekend meter-id', met({ match: 'met.nope', face: 'vu' }), DEVMET, ['dev_unknown_meter']);
dev('device: onbekende meter-groep', met({ match: 'group:levels', face: 'vu' }), DEVMET, ['dev_unknown_meter_group']);
dev('device: een regelaar-id is geen meter-id', met({ match: 'cut', face: 'vu' }), DEVMET, ['dev_unknown_meter']);
dev('device: een meter-id is geen regelaar-id', ctl({ match: 'met.master', size: 's' }), DEVMET, ['dev_unknown_id']);
dev('device: een regelaar-groep is geen meter-groep', met({ match: 'group:filter', face: 'vu' }), DEVMET, ['dev_unknown_meter_group']);
dev('device: onbekend meter-id in een verschijning', metApp({ match: 'nope', face: 'vu' }), DEVMET, ['dev_unknown_meter']);
dev('device: apparaat zonder meters', met({ match: 'met.master', face: 'vu' }), DEVSRC, ['dev_no_meters']);
dev('device: apparaat zonder meters, alleen *: wel melding', met({ match: '*', face: 'vu' }), DEVSRC, ['dev_no_meters']);
dev('device: controls- en meterregels samen', { ...met({ match: 'met.master', face: 'vu' }), design: { meters: [{ match: 'met.master', face: 'vu' }], controls: [{ match: 'cut', size: 's' }] } }, DEVMET, []);
dev('device: sectie met bekende groep', sec({ match: 'group:filter', frame: 'line' }, { match: '*', columns: 3 }), DEVSRC, []);
dev('device: sectie met onbekende groep', sec({ match: 'group:osc', frame: 'line' }), DEVSRC, ['dev_unknown_section_group']);
dev('device: sectie met een meter-groep telt als groep', sec({ match: 'group:meters', frame: 'line' }), DEVMET, []);
dev('device: sectie, onbekende groep in een verschijning', secApp({ match: 'group:nope', frame: 'line' }), DEVSRC, ['dev_unknown_section_group']);
dev('device: sectie, alleen *: geen melding', sec({ match: '*', frame: 'line' }), DEVSRC, []);
dev('device: sectie naast controls en meters', { ...sec({ match: 'group:filter', frame: 'line' }), design: { sections: [{ match: 'group:filter', frame: 'line' }], controls: [{ match: 'cut', size: 's' }] } }, DEVSRC, []);
cases.push(['device: Duofone, groepen setup/filter/amp/play', { ...sec({ match: 'group:setup', columns: 2 }, { match: 'group:filter', frame: 'raised' }, { match: 'group:amp', frame: 'raised' }, { match: 'group:play', frame: 'none' }), device: 'nl.patchkamer.duofone', id: 'nl.patchkamer.duofone.sample' }, { ok: true, codes: [], no: ['*'], devicePath: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'devices', 'synths', 'Duofone', 'duofone.patchkamer-device.js') }]);
cases.push(['device: Duofone, onbekende groep nope', { ...sec({ match: 'group:nope', frame: 'line' }), device: 'nl.patchkamer.duofone', id: 'nl.patchkamer.duofone.sample' }, { ok: true, codes: ['dev_unknown_section_group'], no: [], devicePath: join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'devices', 'synths', 'Duofone', 'duofone.patchkamer-device.js') }]);
cases.push(['device: pad bestaat niet', ctl({ match: 'cut', size: 's' }), { ok: true, codes: ['dev_unreadable'], no: [], devicePath: '/nonexistent/x.patchkamer-device.js' }]);
cases.push(['device: apparaat faalt in de validator', ctl({ match: 'cut', size: 's' }), { ok: true, codes: ['dev_unreadable'], no: [], device: 'export default {}' }]);
// --- 0.1-regels blijven
bad('nog steeds: merknaam', { ...base(), name: ['M', 'oog'].join('') }, ['brand']);
bad('nog steeds: @import in css', (() => { const s = base(); s.appearances[0].css = '@import "x";'; return s; })(), ['css_import']);
bad('nog steeds: externe url', (() => { const s = base(); s.appearances[0].css = ':host{background:url(http://x/y.png)}'; return s; })(), ['css_url']);
bad('nog steeds: default onbekend', SK({ default: 'zzz' }), ['default_ref']);

let fail = 0, n = 0;
for (const lang of ['nl', 'en']) {
  cases.forEach(([name, skin, exp], i) => {
    n++;
    const dir = join(tmp, lang, String(i)); mkdirSync(dir, { recursive: true });
    const f = join(dir, 'sample.patchkamer-skin.json'); writeFileSync(f, JSON.stringify(skin));
    const args = [V, '--lang', lang, f];
    if (exp.device !== undefined) { const df = join(dir, 'dev.patchkamer-device.js'); writeFileSync(df, exp.device); args.push('--device', df); }
    if (exp.devicePath) args.push('--device', exp.devicePath);
    let out = '', code = 0;
    try { out = execFileSync('node', args, { env: { ...process.env, PK_SKIN_CODES: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { code = e.status; out = (e.stdout || '') + (e.stderr || ''); }
    const got = [...out.matchAll(/\[([a-z0-9_]+)\]/g)].map(m => m[1]).filter(c => c !== 'dir_elsewhere');
    const problems = [];
    if ((code === 0) !== exp.ok) problems.push(`exit ${code}, verwacht ${exp.ok ? 0 : 1}`);
    for (const c of exp.codes) if (!got.includes(c)) problems.push(`mist ${c}`);
    if (exp.no.includes('*') && got.length) problems.push(`onverwacht ${got.join(',')}`);
    for (const c of exp.no) if (c !== '*' && got.includes(c)) problems.push(`onverwacht ${c}`);
    if (lang === 'en' && /⟦/.test(out)) problems.push('ontbrekende vertaling');
    if (!exp.ok && !/ERROR|FOUT/.test(out)) problems.push('geen foutregel');
    if (problems.length) { fail++; console.log(`MISLUKT [${lang}] ${name}: ${problems.join('; ')}\n  ${out.trim().split('\n').join('\n  ')}`); }
  });
}
rmSync(tmp, { recursive: true, force: true });
console.log(`${n - fail}/${n} gevallen groen (${cases.length} gevallen x 2 talen)`);
process.exit(fail ? 1 : 0);
