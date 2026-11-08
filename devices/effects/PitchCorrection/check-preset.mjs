// SPDX-License-Identifier: AGPL-3.0-or-later
// Controleert een presetpack voor Pitch Correction door elke preset door het apparaat zelf te halen (setState, getState).
// Gebruik, vanuit de root van de repo:  node devices/effects/PitchCorrection/check-preset.mjs presets/pitch-correction.patchkamer-presets.json
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : (k === 'value' ? 0 : chain()), apply: () => chain(), set: () => true });
globalThis.AudioWorkletNode = class { constructor() { this.port = { postMessage() {} }; this.connect = () => {}; this.disconnect = () => {}; } };
const ctx = new Proxy({ sampleRate: 48000, currentTime: 0, state: 'running' }, { get: (t, k) => k in t ? t[k] : chain() });
const def = (await import(pathToFileURL(resolve('devices/effects/PitchCorrection/pitch-correction.patchkamer-device.js')).href)).default;
const host = new Proxy({ lang: 'en', bpm: 120, loadWorklet: async () => true }, { get: (t, k) => k in t ? t[k] : chain() });
const inst = def.create(ctx, host); await new Promise(r => setTimeout(r, 50));
const all = Object.keys(inst.getState());
const pack = JSON.parse(readFileSync(process.argv[2] || 'presets/pitch-correction.patchkamer-presets.json', 'utf8'));
let problems = 0; const bad = m => { problems++; console.log('FOUT:', m); };
if (pack.format !== 'patchkamer-presets' || pack.formatVersion !== 2) bad('format moet "patchkamer-presets" zijn en formatVersion 2');
if (pack.device !== def.id) bad(`device moet ${def.id} zijn`);
if (pack.license !== 'CC0-1.0') bad('license van het pack moet CC0-1.0 zijn');
if (!/^\d+\.\d+\.\d+$/.test(pack.version || '')) bad('version van het pack ontbreekt of is geen x.y.z');
const items = []; const walk = list => (list || []).forEach(x => x.folder ? walk(x.items) : items.push(x)); walk(pack.tree);
if (!items.length) bad('het pack bevat geen presets');
const names = new Set();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9);
for (const it of items) {
  const s = it.state && typeof it.state === 'object' ? it.state : null;
  if (!it.name) bad('een preset heeft geen name'); else if (names.has(it.name)) bad(`dubbele naam "${it.name}"`); names.add(it.name);
  if (it.kind !== 'set') bad(`${it.name}: kind moet "set" zijn`);
  if (!/^\d+\.\d+\.\d+$/.test(it.version || '')) bad(`${it.name}: version ontbreekt`);
  if (!s) { bad(`${it.name}: state ontbreekt`); continue; }
  for (const k of all) if (!(k in s)) bad(`${it.name}: veld "${k}" ontbreekt (een preset bevat alle velden)`);
  for (const k of Object.keys(s)) if (!all.includes(k)) bad(`${it.name}: onbekend veld "${k}"`);
  inst.setState(JSON.parse(JSON.stringify(s)));
  const g = inst.getState();
  for (const k of all) if (k in s && !same(g[k], s[k])) bad(`${it.name}: ${k} = ${JSON.stringify(s[k])} wordt door het apparaat ${JSON.stringify(g[k])}`);
}
console.log(problems ? `${problems} probleem(en) in ${items.length} preset(s)` : `OK  ${items.length} preset(s) in "${pack.name}" komen ongewijzigd door Pitch Correction ${def.version}`);
process.exit(problems ? 1 : 0);
