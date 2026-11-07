// SPDX-License-Identifier: AGPL-3.0-or-later
// The app has the same version number as the host (patchkamer/version.json): it names the exe and shows up in Settings.
'use strict';
const fs = require('fs'), path = require('path');
const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'patchkamer', 'version.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(v)) { console.error('patchkamer/version.json: version must look like 1.2.3, got ' + v); process.exit(1); }
const file = path.join(__dirname, 'package.json'), pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
if (pkg.version !== v) { pkg.version = v; fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n'); console.log('app version set to ' + v); }
