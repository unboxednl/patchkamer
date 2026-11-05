// SPDX-License-Identifier: AGPL-3.0-or-later
// Builds the manifest (patchkamer.json) of the bundled library by scanning devices/, presets/ and tunes/.
'use strict';
const fs = require('fs');
const path = require('path');

const KINDS = [
  ['modules', /\.patchkamer-device\.js$/i, 'devices'],
  ['presets', /\.patchkamer-presets\.json$/i, 'presets'],
  ['tunes', /\.patchkamer-tunes\.json$/i, 'tunes'],
];

function walk(dir, out) {
  let list;
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const d of list) {
    if (d.name === 'node_modules' || d.name.startsWith('.')) continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

function manifest(root) {
  const m = { name: 'Patchkamer', modules: [], presets: [], tunes: [] };
  for (const [key, re, sub] of KINDS) {
    const base = path.join(root, sub);
    m[key] = walk(base, []).filter(f => re.test(f)).map(f => path.relative(root, f).split(path.sep).join('/')).sort();
  }
  return m;
}

module.exports = { manifest };
