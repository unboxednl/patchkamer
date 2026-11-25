// SPDX-License-Identifier: AGPL-3.0-or-later
// Test: meerdere Keyboards op één canvas. Een computertoets mag maar één Keyboard laten spelen (anders stuurt het ene keyboard ook de apparaten van het andere aan).
// Gebruik, vanuit de root:  node docs/tools/test-keyboard-unique.mjs   (exit 0 = groen)
import { readFileSync } from 'node:fs';
const src = readFileSync('devices/tools/Keyboard/keyboard.patchkamer-device.js', 'utf8');
const handlers = { keydown: [], keyup: [] };
globalThis.document = { addEventListener: (t, f) => handlers[t] && handlers[t].push(f), removeEventListener: (t, f) => { if (handlers[t]) handlers[t] = handlers[t].filter(x => x !== f); }, createElement: () => ({ style: {}, classList: { toggle() {}, remove() {} }, appendChild() {} }) };
const dev = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
const log = [];
const make = name => { const inst = dev.create({ currentTime: 0 }, { lang: 'en', emit: (self, port, ev) => log.push([name, ev.type, ev.note]) }); inst._name = name; return inst; };
const press = (code, down = true) => handlers[down ? 'keydown' : 'keyup'].slice().forEach(f => f({ code, repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: { tagName: 'DIV' }, preventDefault() {} }));
let fail = 0; const t = (n, ok, x = '') => { if (!ok) fail++; console.log((ok ? 'OK     ' : 'FOUT   ') + n + ' ' + x); };
const who = () => [...new Set(log.filter(l => l[1] === 'note').map(l => l[0]))].join(',') || '-';
const a = make('A'), b = make('B');
press('KeyA'); t('twee keyboards, één computertoets: precies één speelt', who() === 'A', 'speelt: ' + who());
press('KeyA', false); log.length = 0;
b._claimKeys && b._claimKeys(); press('KeyA'); t('na een klik op B speelt alleen B', who() === 'B', 'speelt: ' + who());
press('KeyA', false); log.length = 0;
const c = make('C'), d = make('D'); c._claimKeys(); press('KeyA'); log.length = 0; d._claimKeys();
t('toets ingedrukt en dan naar een ander keyboard: het eerste laat zijn noot los', log.some(l => l[0] === 'C' && l[1] === 'noteoff'), JSON.stringify(log)); press('KeyA', false); c.destroy(); d.destroy(); b._claimKeys(); log.length = 0;
b.destroy(); press('KeyA'); t('B weg: A neemt de computertoetsen weer over', who() === 'A', 'speelt: ' + who());
press('KeyA', false); a.destroy();
process.exit(fail ? 1 : 0);
