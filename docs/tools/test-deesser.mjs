// SPDX-License-Identifier: AGPL-3.0-or-later
// Test voor de De-esser: de reductiemeter (gr) moet laten zien wat er werkelijk met het geluid gebeurt.
// Gebruik, vanuit de root:  node docs/tools/test-deesser.mjs   (exit 0 = groen)
import { loadEngine, SR, db, lin, sine } from './dynamics-harness.mjs';
const make = loadEngine('devices/effects/DeEsser/deesser.patchkamer-device.js');
const base = { mode: 'split', freq: 6500, bw: 1, thr: -30, ratio: 100, range: 12, att: 0.5, rel: 50, mix: 1, on: true };
let fail = 0; const t = (n, ok, x = '') => { if (!ok) fail++; console.log((ok ? 'OK     ' : 'FOUT   ') + n + ' ' + x); };
function meterGr(cfg) { const n = SR, x = sine(6500, lin(-10), n), e = make({ ...base, ...cfg }); e.run(x, x); const p = e.p.port.posted; return p[p.length - 1].gr; }
const full = meterGr({});
t('meter toont de volle reductie bij mix 100%', Math.abs(full - 12) < 0.3, full.toFixed(2) + ' dB');
const off = meterGr({ on: false });
t('meter staat op 0 als het apparaat uit staat (het geluid wordt niet gedempt)', off < 0.2, off.toFixed(2) + ' dB');
const half = meterGr({ mix: 0.5 }), want = -db((1 + lin(-12)) / 2);
t('meter toont de werkelijke reductie bij mix 50%', Math.abs(half - want) < 0.3, half.toFixed(2) + ' dB, verwacht ' + want.toFixed(2));
const zero = meterGr({ mix: 0 });
t('meter staat op 0 bij mix 0%', zero < 0.2, zero.toFixed(2) + ' dB');
process.exit(fail ? 1 : 0);
