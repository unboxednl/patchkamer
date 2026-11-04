// SPDX-License-Identifier: AGPL-3.0-or-later
// Controleert een tunepack voor Duofone door elke tune door het apparaat zelf te halen.
// Gebruik, vanuit de root van de repo:  node <dit-bestand> tunes/<pack>.patchkamer-tunes.json
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : (k === 'value' ? 0 : chain()), apply: () => chain(), set: () => true });
globalThis.AudioWorkletNode = class { constructor() { this.port = { postMessage() {} }; this.connect = () => {}; this.disconnect = () => {}; } };
const ctx = new Proxy({ sampleRate: 48000, currentTime: 0, state: 'running', audioWorklet: { addModule: async () => {} } }, { get: (t, k) => k in t ? t[k] : chain() });
const def = (await import(pathToFileURL(resolve('devices/synths/Duofone/duofone.patchkamer-device.js')).href)).default;
const inst = def.create(ctx, chain()); await new Promise(r => setTimeout(r, 100));
const all = Object.keys(inst.getPreset());
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
  inst.setPreset(JSON.parse(JSON.stringify(s)));
  const g = inst.getPreset();
  for (const k of all) if (k in s && JSON.stringify(g[k]) !== JSON.stringify(s[k])) bad(`${it.name}: ${k} = ${JSON.stringify(s[k])} wordt door het apparaat ${JSON.stringify(g[k])}`);
}
console.log(problems ? `${problems} probleem(en) in ${items.length} tune(s)` : `OK  ${items.length} tune(s) in "${pack.name}" komen ongewijzigd door Duofone ${def.version}`);
process.exit(problems ? 1 : 0);
