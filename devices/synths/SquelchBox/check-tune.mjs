// SPDX-License-Identifier: AGPL-3.0-or-later
// Controleert een tunepack voor Squelch Box door elke tune door het apparaat zelf te halen.
// Gebruik, vanuit de root van de repo:  node <dit-bestand> tunes/<pack>.patchkamer-tunes.json
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : (k === 'value' ? 0 : chain()), apply: () => chain(), set: () => true });
globalThis.AudioWorkletNode = class { constructor() { this.port = { postMessage() {} }; this.connect = () => {}; this.disconnect = () => {}; } };
const ctx = new Proxy({ sampleRate: 48000, currentTime: 0, state: 'running', audioWorklet: { addModule: async () => {} } }, { get: (t, k) => k in t ? t[k] : chain() });
const def = (await import(pathToFileURL(resolve('devices/synths/SquelchBox/squelch-box.patchkamer-device.js')).href)).default;
const host = new Proxy({ lang: 'en', bpm: 120, swing: 0, loadWorklet: async () => true }, { get: (t, k) => k in t ? t[k] : chain() });
const inst = def.create(ctx, host); await new Promise(r => setTimeout(r, 100));
const all = Object.keys(inst.getState());
const pack = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let problems = 0; const bad = m => { problems++; console.log('FOUT:', m); };
if (pack.format !== 'patchkamer-tunes' || pack.formatVersion !== 1) bad('format moet "patchkamer-tunes" zijn en formatVersion 1');
if (pack.device !== def.id) bad(`device moet ${def.id} zijn`);
if (pack.license !== 'CC0-1.0') bad('license van het pack moet CC0-1.0 zijn');
const items = []; const walk = list => (list || []).forEach(x => x.folder ? walk(x.items) : items.push(x)); walk(pack.tree);
if (!items.length) bad('het pack bevat geen tunes');
for (const it of items) {
  const s = it.state && typeof it.state === 'object' ? it.state : null;
  if (!it.name) bad('een tune heeft geen name');
  if (it.kind !== 'set') bad(`${it.name}: kind moet "set" zijn`);
  if (it.license && it.license !== 'CC0-1.0') bad(`${it.name}: license moet CC0-1.0 zijn`);
  if (!s) { bad(`${it.name}: state ontbreekt`); continue; }
  for (const k of all) if (!(k in s)) bad(`${it.name}: veld "${k}" ontbreekt (een tune bevat alle velden)`);
  for (const k of Object.keys(s)) if (!all.includes(k)) bad(`${it.name}: onbekend veld "${k}"`);
  inst.setState(JSON.parse(JSON.stringify(s)));
  const g = inst.getState();
  // het apparaat vult de patronenlijst aan tot 16 plekken met lege patronen: vergelijk de opgegeven patronen en eis dat de rest leeg is
  const emptyPat = p => p && (p.n || []).every(v => v === -1) && ['oc', 'acc', 'sl', 'tie'].every(f => (p[f] || []).every(v => v === 0));
  const same = (k) => Array.isArray(s[k]) && Array.isArray(g[k]) && g[k].length > s[k].length
    ? s[k].every((v, i) => JSON.stringify(v) === JSON.stringify(g[k][i])) && g[k].slice(s[k].length).every(emptyPat)
    : JSON.stringify(g[k]) === JSON.stringify(s[k]);
  for (const k of all) if (k in s && !same(k)) bad(`${it.name}: ${k} = ${JSON.stringify(s[k])} wordt door het apparaat ${JSON.stringify(g[k])}`);
}
console.log(problems ? `${problems} probleem(en) in ${items.length} tune(s)` : `OK  ${items.length} tune(s) in "${pack.name}" komen ongewijzigd door Squelch Box ${def.version}`);
process.exit(problems ? 1 : 0);
