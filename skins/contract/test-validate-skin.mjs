// test-validate-skin.mjs — testgevallen voor validate-skin.mjs (contract v0.2) / test cases for the validator
// Gebruik / Usage:  node skins/contract/test-validate-skin.mjs      (exit 0 = alles groen / all green)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const V = join(dirname(fileURLToPath(import.meta.url)), 'validate-skin.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'skin-test-'));
const base = () => ({ format: 'patchkamer-skin', formatVersion: 1, skinsContract: '0.2', id: 'nl.test.dev.sample', device: 'nl.test.dev', name: 'Sample', version: '1.0.0', author: 'Test', license: 'CC0-1.0', description: 'A test skin.', created: '2026-11-06', icon: null, default: 'a', appearances: [{ id: 'a', name: 'A', when: { minWidth: 0 }, css: '' }] });
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
okWarn('minor 3 is nieuwer', SK({ skinsContract: '0.3' }), ['contract_minor']);
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
okWarn('design onbekende sectie (laag 2)', withDesign({ layout: { x: 1 } }), ['unknown_field']);
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
    let out = '', code = 0;
    try { out = execFileSync('node', [V, '--lang', lang, f], { env: { ...process.env, PK_SKIN_CODES: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
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
