// SPDX-License-Identifier: AGPL-3.0-or-later
// Every host file that main.js serves by name must be in the extraResources filter of the exe (meten.html was missing: 404 in the app).
'use strict';
const fs = require('fs'), path = require('path');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const filter = pkg.build.extraResources.find(r => r.to === 'patchkamer').filter;
const main = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
const named = [...main.matchAll(/path\.join\(hostDir, '([^']+)'\)/g)].map(m => m[1]);
let bad = 0;
for (const f of named) if (!filter.includes(f)) { console.error('FAIL: ' + f + ' is served by main.js but not in the exe'); bad++; }
if (!named.length) { console.error('FAIL: no served files found'); bad++; }
if (!bad) console.log('OK: ' + named.join(', '));
process.exit(bad ? 1 : 0);
